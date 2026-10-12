'use strict';
// Seed data for the two database tracks. Every run starts from a fresh copy,
// so nothing a learner does to it can leak into the next attempt.

const shopSql = `
CREATE TABLE departments (id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE employees (
  id int PRIMARY KEY, name text NOT NULL, dept_id int REFERENCES departments(id),
  manager_id int REFERENCES employees(id), salary numeric(10,2) NOT NULL, hired date NOT NULL
);
CREATE TABLE customers (id int PRIMARY KEY, name text NOT NULL, city text, email text, joined date NOT NULL);
CREATE TABLE products (id int PRIMARY KEY, name text NOT NULL, category text NOT NULL, price numeric(10,2) NOT NULL, stock int NOT NULL);
CREATE TABLE orders (id int PRIMARY KEY, customer_id int REFERENCES customers(id), ordered_at date NOT NULL, status text NOT NULL);
CREATE TABLE order_items (order_id int REFERENCES orders(id), product_id int REFERENCES products(id), qty int NOT NULL, PRIMARY KEY (order_id, product_id));

INSERT INTO departments VALUES (1,'Engineering'),(2,'Support'),(3,'Sales'),(4,'Research');
INSERT INTO employees VALUES
 (1,'Ada',1,NULL,150000,'2019-03-01'),
 (2,'Linus',1,1,120000,'2020-06-15'),
 (3,'Grace',1,1,125000,'2021-01-10'),
 (4,'Dennis',2,1,70000,'2022-09-01'),
 (5,'Margaret',2,4,65000,'2023-02-20'),
 (6,'Ken',3,1,90000,'2020-11-30'),
 (7,'Barbara',3,6,82000,'2024-04-01'),
 (8,'Tim',NULL,1,60000,'2025-01-15');
INSERT INTO customers VALUES
 (1,'Acme Corp','Tulsa','ops@acme.test','2023-01-05'),
 (2,'Globex','Dallas','it@globex.test','2023-03-12'),
 (3,'Initech','Austin',NULL,'2023-07-30'),
 (4,'Umbrella','Tulsa','lab@umbrella.test','2024-02-14'),
 (5,'Hooli','Denver','hello@hooli.test','2024-08-01'),
 (6,'Stark Industries',NULL,'tony@stark.test','2025-05-20');
INSERT INTO products VALUES
 (1,'Laptop','hardware',1200.00,14),
 (2,'Monitor','hardware',300.00,40),
 (3,'Keyboard','hardware',80.00,0),
 (4,'Antivirus','software',45.50,500),
 (5,'Backup Plan','service',25.00,999),
 (6,'Firewall','hardware',650.00,6),
 (7,'Office Suite','software',99.99,250),
 (8,'On-site Visit','service',150.00,999);
INSERT INTO orders VALUES
 (1,1,'2025-01-10','shipped'),
 (2,1,'2025-02-03','shipped'),
 (3,2,'2025-02-14','cancelled'),
 (4,3,'2025-03-01','shipped'),
 (5,4,'2025-03-09','pending'),
 (6,2,'2025-03-22','shipped'),
 (7,1,'2025-04-02','pending'),
 (8,5,'2025-04-18','shipped');
INSERT INTO order_items VALUES
 (1,1,2),(1,2,2),(2,4,10),(3,6,1),(4,3,6),(4,7,5),(5,1,1),(5,5,12),(6,2,3),(7,6,2),(8,4,25),(8,7,25);
`;

const shopMongo = {
  users: [
    { _id: 1, name: 'Ada', age: 36, city: 'Tulsa', active: true, tags: ['admin', 'dev'], address: { zip: '74103', state: 'OK' } },
    { _id: 2, name: 'Linus', age: 29, city: 'Dallas', active: true, tags: ['dev'], address: { zip: '75201', state: 'TX' } },
    { _id: 3, name: 'Grace', age: 45, city: 'Tulsa', active: false, tags: ['dev', 'lead'], address: { zip: '74104', state: 'OK' } },
    { _id: 4, name: 'Dennis', age: 52, city: 'Austin', active: true, tags: [], address: { zip: '73301', state: 'TX' } },
    { _id: 5, name: 'Margaret', age: 31, city: 'Denver', active: false, tags: ['support'], address: { zip: '80014', state: 'CO' } },
    { _id: 6, name: 'Ken', age: 24, city: 'Tulsa', active: true, tags: ['support', 'dev'] },
  ],
  products: [
    { _id: 'lap', name: 'Laptop', category: 'hardware', price: 1200, stock: 14, ratings: [5, 4, 5] },
    { _id: 'mon', name: 'Monitor', category: 'hardware', price: 300, stock: 40, ratings: [4, 4] },
    { _id: 'key', name: 'Keyboard', category: 'hardware', price: 80, stock: 0, ratings: [3, 5, 4, 2] },
    { _id: 'av', name: 'Antivirus', category: 'software', price: 45.5, stock: 500, ratings: [] },
    { _id: 'bak', name: 'Backup Plan', category: 'service', price: 25, stock: 999, ratings: [5] },
    { _id: 'fw', name: 'Firewall', category: 'hardware', price: 650, stock: 6, ratings: [5, 5] },
  ],
  orders: [
    { _id: 101, userId: 1, status: 'shipped', total: 3000, date: '2025-01-10', items: [{ sku: 'lap', qty: 2, price: 1200 }, { sku: 'mon', qty: 2, price: 300 }] },
    { _id: 102, userId: 1, status: 'shipped', total: 455, date: '2025-02-03', items: [{ sku: 'av', qty: 10, price: 45.5 }] },
    { _id: 103, userId: 2, status: 'cancelled', total: 650, date: '2025-02-14', items: [{ sku: 'fw', qty: 1, price: 650 }] },
    { _id: 104, userId: 3, status: 'shipped', total: 400, date: '2025-03-01', items: [{ sku: 'key', qty: 5, price: 80 }] },
    { _id: 105, userId: 4, status: 'pending', total: 1500, date: '2025-03-09', items: [{ sku: 'lap', qty: 1, price: 1200 }, { sku: 'bak', qty: 12, price: 25 }] },
    { _id: 106, userId: 2, status: 'shipped', total: 900, date: '2025-03-22', items: [{ sku: 'mon', qty: 3, price: 300 }] },
    { _id: 107, userId: 1, status: 'pending', total: 1300, date: '2025-04-02', items: [{ sku: 'fw', qty: 2, price: 650 }] },
    { _id: 108, userId: 6, status: 'shipped', total: 160, date: '2025-04-18', items: [{ sku: 'key', qty: 2, price: 80 }] },
  ],
};

module.exports = { sql: { shop: shopSql }, mongo: { shop: shopMongo } };
