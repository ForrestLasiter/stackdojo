'use strict';
// A mongosh-shaped `db` object over plain arrays, powered by mingo — a faithful
// JS implementation of MongoDB's query, update and aggregation languages. It
// lets the MongoDB track run with no server installed.
module.exports = function makeDb(appRequire, data) {
  const mingo = appRequire('mingo');
  const store = {};
  for (const [k, v] of Object.entries(data)) store[k] = v;
  const options = { collectionResolver: (name) => store[name] || [] };
  let nextId = 1000;

  class Cursor {
    constructor(docs, query, projection) { this.c = mingo.find(docs, query || {}, projection || undefined, options); }
    sort(s) { this.c.sort(s); return this; }
    limit(n) { this.c.limit(n); return this; }
    skip(n) { this.c.skip(n); return this; }
    toArray() { return this.c.all(); }
    count() { return this.toArray().length; }
    map(f) { return this.toArray().map(f); }
    forEach(f) { this.toArray().forEach(f); }
    pretty() { return this; }
  }
  class AggCursor {
    constructor(rows) { this.rows = rows; }
    toArray() { return this.rows; }
    map(f) { return this.rows.map(f); }
    forEach(f) { this.rows.forEach(f); }
    pretty() { return this; }
  }
  class Collection {
    constructor(name) { this.name = name; this.indexes = [{ key: { _id: 1 }, name: '_id_' }]; }
    get docs() { return (store[this.name] = store[this.name] || []); }
    find(q, p) { return new Cursor(this.docs, q, p); }
    findOne(q, p) { return new Cursor(this.docs, q, p).limit(1).toArray()[0] ?? null; }
    countDocuments(q) { return new Cursor(this.docs, q).toArray().length; }
    estimatedDocumentCount() { return this.docs.length; }
    distinct(field, q) {
      const seen = new Set();
      for (const d of new Cursor(this.docs, q).toArray()) {
        const v = field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d);
        for (const x of Array.isArray(v) ? v : [v]) if (x !== undefined) seen.add(x);
      }
      return [...seen].sort();
    }
    aggregate(pipeline) { return new AggCursor(mingo.aggregate(this.docs, pipeline, options)); }
    insertOne(doc) { const d = { _id: doc._id ?? nextId++, ...doc }; this.docs.push(d); return { acknowledged: true, insertedId: d._id }; }
    insertMany(docs) { return { acknowledged: true, insertedIds: docs.map((d) => this.insertOne(d).insertedId) }; }
    updateOne(q, u, o = {}) { return this._update(q, u, o, false); }
    updateMany(q, u, o = {}) { return this._update(q, u, o, true); }
    _update(q, u, o, many) {
      if (!Array.isArray(u) && !Object.keys(u).every((k) => k.startsWith('$'))) throw new Error('MongoInvalidArgumentError: Update document requires atomic operators (like $set)');
      const r = (many ? mingo.updateMany : mingo.updateOne)(this.docs, q, u, { arrayFilters: o.arrayFilters }, options);
      let upsertedId = null;
      if (r.matchedCount === 0 && o.upsert) {
        const seed = {};
        for (const [k, v] of Object.entries(q)) if (v === null || typeof v !== 'object') seed[k] = v;
        upsertedId = this.insertOne(seed).insertedId;
        mingo.updateOne(this.docs, { _id: upsertedId }, u, {}, options);
      }
      return { acknowledged: true, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId };
    }
    replaceOne(q, doc) {
      const hit = new Cursor(this.docs, q).limit(1).toArray()[0];
      if (!hit) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      this.docs[this.docs.indexOf(hit)] = { _id: hit._id, ...doc };
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }
    deleteOne(q) { return this._delete(q, false); }
    deleteMany(q) { return this._delete(q, true); }
    _delete(q, many) {
      let hits = new Cursor(this.docs, q).toArray();
      if (!many) hits = hits.slice(0, 1);
      const set = new Set(hits);
      store[this.name] = this.docs.filter((d) => !set.has(d));
      return { acknowledged: true, deletedCount: hits.length };
    }
    createIndex(key, opts = {}) {
      const name = opts.name || Object.entries(key).map(([k, v]) => `${k}_${v}`).join('_');
      this.indexes.push({ key, name, ...(opts.unique ? { unique: true } : {}) });
      return name;
    }
    getIndexes() { return this.indexes; }
  }
  const cols = {};
  return new Proxy({}, {
    get(_, name) {
      if (typeof name !== 'string') return undefined;
      if (name === 'getCollection') return (n) => (cols[n] = cols[n] || new Collection(n));
      if (name === 'getCollectionNames') return () => Object.keys(store).sort();
      return (cols[name] = cols[name] || new Collection(name));
    },
  });
};
