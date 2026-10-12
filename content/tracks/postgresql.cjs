'use strict';
// Runs on PGlite — real PostgreSQL compiled to WebAssembly — so nothing has to
// be installed. Each attempt gets a fresh copy of the `shop` database. Grading
// runs the reference solution next to yours and compares the result sets;
// `ordered` challenges also compare row order. For statements that change
// data, `check` is a query run afterwards on both databases.

const q = (id, title, tier, prompt, solution, hints, extra = {}) => ({
  id, title, tier, prompt, starter: '-- Write your SQL here\n', solution: solution.trim() + '\n', hints, ...extra,
});

const SCHEMA = "\n\n**Tables:** `customers(id, name, city, email, joined)` · `products(id, name, category, price, stock)` · `orders(id, customer_id, ordered_at, status)` · `order_items(order_id, product_id, qty)` · `employees(id, name, dept_id, manager_id, salary, hired)` · `departments(id, name)`";

module.exports = {
  id: 'postgresql',
  name: 'PostgreSQL',
  short: 'PG',
  blurb: 'Relational data: filtering, joins, grouping, window functions, and changing data safely.',
  lang: 'sql',
  runner: { kind: 'sql', dataset: 'shop' },
  schemaNote: SCHEMA.trim(),
  challenges: [
    q('select-all', 'Select everything', 1,
      'Return every column of every row in `products`.',
      'SELECT * FROM products;',
      ['`SELECT * FROM table_name;`']),
    q('where', 'Pick columns, filter rows', 1,
      'Return the `name` and `price` of every product in the `hardware` category.',
      "SELECT name, price FROM products WHERE category = 'hardware';",
      ['List the columns you want after `SELECT`, separated by commas.', 'String literals use **single** quotes. Double quotes mean a column or table name.']),
    q('order-limit', 'Top three', 1,
      'Return the `name` and `price` of the three most expensive products, most expensive first.',
      'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;',
      ['`ORDER BY column DESC` sorts high to low.', '`LIMIT 3` keeps the first three rows after sorting.'], { ordered: true }),
    q('ilike', 'Pattern matching', 1,
      "Return the `name` of every customer whose name contains the letter `o`, in either case.",
      "SELECT name FROM customers WHERE name ILIKE '%o%';",
      ['`%` in a `LIKE` pattern matches any run of characters.', '`LIKE` is case-sensitive in PostgreSQL; `ILIKE` is not.']),
    q('is-null', 'Missing values', 1,
      'Return the `name` of every customer that has no `city` **or** no `email` on file.',
      'SELECT name FROM customers WHERE city IS NULL OR email IS NULL;',
      ['`NULL` means "unknown", and nothing equals unknown — `city = NULL` is never true.', 'Use `IS NULL` / `IS NOT NULL`.']),
    q('between', 'Date ranges', 1,
      'Return the `id` and `ordered_at` of every order placed in March 2025.',
      "SELECT id, ordered_at FROM orders WHERE ordered_at BETWEEN '2025-03-01' AND '2025-03-31';",
      ['`BETWEEN a AND b` includes both ends.', "Dates are written as strings: `'2025-03-01'`."]),
    q('distinct', 'Distinct values', 1,
      'Return each city that appears in `customers` exactly once, alphabetically. Leave out the missing ones.',
      'SELECT DISTINCT city FROM customers WHERE city IS NOT NULL ORDER BY city;',
      ['`SELECT DISTINCT` removes duplicate rows from the result.'], { ordered: true }),
    q('coalesce', 'Fallbacks and string building', 1,
      "Return one column named `label` for every customer, formatted `Name (City)`. When the city is missing, use `Unknown` — e.g. `Stark Industries (Unknown)`.",
      "SELECT name || ' (' || COALESCE(city, 'Unknown') || ')' AS label FROM customers;",
      ['`||` joins strings together.', '`COALESCE(a, b)` returns the first argument that is not NULL.', 'Joining a string to NULL gives NULL — which is why the fallback is needed.']),
    q('aggregate', 'Count and average', 1,
      'Return a single row with two columns: how many products there are, and their average price rounded to 2 decimal places.',
      'SELECT COUNT(*), ROUND(AVG(price), 2) FROM products;',
      ['`COUNT(*)` counts rows. `AVG(col)` averages a column.', '`ROUND(value, 2)` rounds to two places.']),
    q('case', 'CASE expressions', 2,
      "Return each product's `name` and a second column `tier`: `'budget'` when the price is under 100, `'mid'` when under 1000, and `'premium'` otherwise.",
      "SELECT name, CASE WHEN price < 100 THEN 'budget' WHEN price < 1000 THEN 'mid' ELSE 'premium' END AS tier FROM products;",
      ['`CASE WHEN condition THEN value ... ELSE value END`.', 'Branches are tested top to bottom and the first match wins, so the second branch only needs `< 1000`.']),
    q('group-by', 'GROUP BY', 2,
      'For each product category, return the `category`, the number of products in it, and the total `stock` across them. Order by category.',
      'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;',
      ['`GROUP BY category` collapses all rows that share a category into one.', 'Every selected column must either be in the `GROUP BY` or inside an aggregate.'], { ordered: true }),
    q('having', 'HAVING', 2,
      'Return the `customer_id` and order count for customers who have placed **more than one** order.',
      'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) > 1;',
      ['`WHERE` filters rows *before* grouping; it cannot see `COUNT(*)`.', '`HAVING` filters the groups *after* aggregating.']),
    q('months', 'Group by month', 2,
      "Return how many orders were placed in each month, as two columns: the month formatted `YYYY-MM`, and the count. Order by month.",
      "SELECT TO_CHAR(ordered_at, 'YYYY-MM') AS month, COUNT(*) FROM orders GROUP BY 1 ORDER BY 1;",
      ["`TO_CHAR(date, 'YYYY-MM')` formats a date as text.", '`GROUP BY 1` means "group by the first selected column" — handy when that column is an expression.'], { ordered: true }),
    q('inner-join', 'INNER JOIN', 2,
      "Return each order's `id` together with the **name** of the customer who placed it, ordered by order id.",
      'SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.id;',
      ['`FROM orders o JOIN customers c ON c.id = o.customer_id` — the `ON` clause says how the rows pair up.', 'Short aliases (`o`, `c`) keep column references unambiguous.'], { ordered: true }),
    q('left-join', 'LEFT JOIN', 2,
      'Return **every** customer\'s `name` and how many orders they have placed — including `0` for customers with none. Order by name.',
      'SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY c.name;',
      ['An inner join drops customers with no matching order. `LEFT JOIN` keeps every row from the left table.', '`COUNT(o.id)` counts only non-NULL values, so unmatched customers get 0. `COUNT(*)` would give them 1.'], { ordered: true }),
    q('order-totals', 'Join three tables', 2,
      'Return each order\'s `id` and its total value — the sum of `qty × price` over its items — ordered by order id.',
      'SELECT oi.order_id, SUM(oi.qty * p.price) AS total FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY oi.order_id ORDER BY oi.order_id;',
      ['`order_items` links orders to products. Join it to `products` to reach the price.', 'You can do arithmetic inside an aggregate: `SUM(qty * price)`.'], { ordered: true }),
    q('self-join', 'A table joined to itself', 2,
      "Return every employee's `name` next to their **manager's name** (a column called `manager`). The employee with no manager must still appear, with NULL. Order by employee id.",
      'SELECT e.name, m.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.id;',
      ['Use the same table twice with different aliases: one playing "employee", one playing "manager".', 'A `LEFT JOIN` keeps the boss, who has no manager row to match.'], { ordered: true }),
    q('subquery', 'Subqueries', 2,
      'Return the `name` and `price` of every product that costs more than the average product price.',
      'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);',
      ['A query in parentheses that returns one value can be used anywhere a value can.']),
    q('never-ordered', 'Find what is missing', 2,
      'Return the `name` of every product that has **never** appeared in any order.',
      'SELECT p.name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);',
      ['`NOT EXISTS (subquery)` is true when the subquery finds no rows for the current product.', 'Alternative: `LEFT JOIN order_items ... WHERE oi.product_id IS NULL`.']),
    q('cte', 'Common table expressions', 3,
      'Using a `WITH` clause, return each customer\'s `name` and their total revenue from **shipped** orders only (`qty × price`), highest revenue first. Customers with no shipped orders are left out.',
      `WITH shipped AS (
  SELECT o.customer_id, oi.qty * p.price AS amount
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'shipped'
)
SELECT c.name, SUM(s.amount) AS revenue
FROM shipped s JOIN customers c ON c.id = s.customer_id
GROUP BY c.name
ORDER BY revenue DESC;`,
      ['`WITH name AS (SELECT ...) SELECT ... FROM name` gives a sub-result a name you can read top to bottom.', 'Build the line amounts first, then aggregate them in the final query.'], { ordered: true }),
    q('rank', 'Window functions: RANK', 3,
      "For every employee who has a department, return the employee `name`, the department name, the `salary`, and their salary rank **within their department** (1 = highest paid). Order by department name, then rank.",
      `SELECT e.name, d.name AS department, e.salary,
       RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rank
FROM employees e JOIN departments d ON d.id = e.dept_id
ORDER BY d.name, rank;`,
      ['A window function computes across related rows without collapsing them like `GROUP BY` does.', '`RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)` restarts the ranking for each department.'], { ordered: true }),
    q('running-total', 'Window functions: running total', 3,
      'For shipped orders, return the order `id`, `ordered_at`, the order\'s value, and a **running total** of value over time. Order by date.',
      `SELECT o.id, o.ordered_at, SUM(oi.qty * p.price) AS value,
       SUM(SUM(oi.qty * p.price)) OVER (ORDER BY o.ordered_at) AS running
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'shipped'
GROUP BY o.id, o.ordered_at
ORDER BY o.ordered_at;`,
      ['`SUM(x) OVER (ORDER BY date)` adds up everything from the first row to the current one.', 'Compute the per-order value first (a CTE helps), then apply the window on top.'], { ordered: true }),
    q('insert', 'INSERT', 1,
      "Add a new product: id `9`, name `Webcam`, category `hardware`, price `59.99`, stock `30`.",
      "INSERT INTO products (id, name, category, price, stock) VALUES (9, 'Webcam', 'hardware', 59.99, 30);",
      ['`INSERT INTO table (col, col, ...) VALUES (val, val, ...);`', 'Naming the columns keeps the statement correct even if the table gains columns later.'],
      { check: 'SELECT * FROM products WHERE id = 9;' }),
    q('update', 'UPDATE', 2,
      'Software is going up: raise the `price` of every product in the `software` category by 10%. No other product may change.',
      "UPDATE products SET price = price * 1.10 WHERE category = 'software';",
      ['`UPDATE table SET col = expression WHERE condition;`', 'An `UPDATE` with no `WHERE` changes every row in the table.'],
      { check: 'SELECT id, price FROM products ORDER BY id;' }),
    q('delete', 'DELETE and foreign keys', 2,
      "Delete every `cancelled` order. The `order_items` table references `orders`, so the database will refuse to delete an order that still has items — remove those first.",
      "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled');\nDELETE FROM orders WHERE status = 'cancelled';",
      ['A foreign key protects you from orphaned rows: the child rows have to go first.', 'You can run two statements, each ending with a semicolon.'],
      { check: "SELECT 'orders', COUNT(*) FROM orders UNION ALL SELECT 'items', COUNT(*) FROM order_items UNION ALL SELECT 'cancelled', COUNT(*) FROM orders WHERE status = 'cancelled';" }),
    q('create-table', 'CREATE TABLE', 2,
      "Create a table `tickets` with:\n\n- `id` — `serial`, the primary key\n- `title` — `text`, required\n- `priority` — `integer`, required, default `3`, and a `CHECK` that it is between 1 and 5\n- `customer_id` — `integer`, a foreign key to `customers(id)`, may be NULL",
      `CREATE TABLE tickets (
  id serial PRIMARY KEY,
  title text NOT NULL,
  priority integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  customer_id integer REFERENCES customers(id)
);`,
      ['Each column is `name type constraints`, separated by commas.', '`NOT NULL`, `DEFAULT value`, `CHECK (condition)` and `REFERENCES table(col)` all go after the type.'],
      { check: `SELECT 'col ' || column_name || ' ' || data_type || ' nullable=' || is_nullable || ' default=' || (column_default IS NOT NULL) AS fact FROM information_schema.columns WHERE table_name = 'tickets'
UNION ALL SELECT 'constraint ' || constraint_type || ' x' || COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY') GROUP BY constraint_type
UNION ALL SELECT 'check on priority x' || COUNT(*) FROM information_schema.check_constraints cc JOIN information_schema.constraint_column_usage u USING (constraint_name) WHERE u.table_name = 'tickets' AND u.column_name = 'priority' AND cc.check_clause NOT LIKE '%IS NOT NULL%';` }),
    q('index', 'Indexes', 2,
      "Looking up a customer's orders scans the whole `orders` table. Create:\n\n- an index named `idx_orders_customer` on `orders(customer_id)`\n- a **unique** index named `idx_customers_email` on `customers(email)`",
      'CREATE INDEX idx_orders_customer ON orders (customer_id);\nCREATE UNIQUE INDEX idx_customers_email ON customers (email);',
      ['`CREATE INDEX name ON table (column);`', 'A `UNIQUE` index also enforces that no two rows share the value (NULLs are exempt).'],
      { check: "SELECT indexname, indexdef FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY indexname;" }),
    q('view', 'Views', 2,
      'Create a view named `order_totals` with two columns, `order_id` and `total` (the sum of `qty × price` for that order).',
      'CREATE VIEW order_totals AS\nSELECT oi.order_id, SUM(oi.qty * p.price) AS total\nFROM order_items oi JOIN products p ON p.id = oi.product_id\nGROUP BY oi.order_id;',
      ['`CREATE VIEW name AS SELECT ...` saves a query under a name; selecting from it re-runs the query.', 'Column names come from the query, so alias the sum `AS total`.'],
      { check: 'SELECT order_id, total FROM order_totals ORDER BY order_id;' }),
    q('upsert', 'Upsert', 3,
      "A stock delivery arrived. In **one statement**, apply these two rows to `products`:\n\n- `(3, 'Keyboard', 'hardware', 80.00, 25)`\n- `(9, 'Webcam', 'hardware', 59.99, 30)`\n\nIf the id already exists, **add** the delivered stock to the existing stock and leave the other columns alone. If it does not, insert the row.",
      `INSERT INTO products (id, name, category, price, stock) VALUES
  (3, 'Keyboard', 'hardware', 80.00, 25),
  (9, 'Webcam', 'hardware', 59.99, 30)
ON CONFLICT (id) DO UPDATE SET stock = products.stock + EXCLUDED.stock;`,
      ['`INSERT ... ON CONFLICT (id) DO UPDATE SET ...` turns a duplicate-key error into an update.', '`EXCLUDED` is the row that failed to insert; the table name refers to the row already there.'],
      { check: 'SELECT id, name, stock FROM products WHERE id IN (3, 9) ORDER BY id;' }),
    q('boss-top-per-category', 'Boss: best seller per category', 3,
      "For each product category, find the product with the most **units sold** in shipped orders. Return `category`, product `name`, and `units`, ordered by category. A category with no shipped sales does not appear.",
      `WITH sold AS (
  SELECT p.category, p.name, SUM(oi.qty) AS units
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'shipped'
  GROUP BY p.category, p.name
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC, name) AS rn FROM sold
)
SELECT category, name, units FROM ranked WHERE rn = 1 ORDER BY category;`,
      ['Two steps: (1) units sold per product, (2) pick the top row in each category.', 'You cannot filter on a window function in the same query that computes it — rank in a CTE, filter in the next.', 'PostgreSQL also has `SELECT DISTINCT ON (category) ... ORDER BY category, units DESC`.'], { ordered: true }),
    q('pagination', 'LIMIT and OFFSET', 1,
      'Products are listed alphabetically by name, three per page. Return the `name` and `price` of the products on **page 2**.',
      'SELECT name, price FROM products ORDER BY name LIMIT 3 OFFSET 3;',
      ['`OFFSET n` skips the first n rows; `LIMIT` then takes the page.', 'Page 2 of size 3 skips 3 rows. Without an `ORDER BY`, "page 2" means nothing — row order is not guaranteed.'], { ordered: true }),
    q('string-functions', 'String functions', 1,
      'For each customer return the name in upper case and the number of characters in the name, longest name first; break ties alphabetically.',
      'SELECT UPPER(name), LENGTH(name) FROM customers ORDER BY LENGTH(name) DESC, name;',
      ['`UPPER(text)` and `LENGTH(text)`.', '`ORDER BY` accepts several keys, each with its own direction.'], { ordered: true }),
    q('count-distinct', 'COUNT(DISTINCT …)', 1,
      'How many **different** customers have placed at least one order? Return a single number.',
      'SELECT COUNT(DISTINCT customer_id) FROM orders;',
      ['`COUNT(customer_id)` counts orders. `COUNT(DISTINCT customer_id)` counts customers.']),
    q('extract', 'Parts of a date', 1,
      'Return the `name` and the hire **year** (as a number) of every employee hired in 2022 or later, earliest hire first.',
      "SELECT name, EXTRACT(YEAR FROM hired) AS year FROM employees WHERE hired >= '2022-01-01' ORDER BY hired;",
      ['`EXTRACT(YEAR FROM date_column)` pulls one field out of a date.', "Filter on the raw column (`hired >= '2022-01-01'`), not on the extracted year — that way an index on `hired` can be used."], { ordered: true }),
    q('min-max', 'MIN and MAX per group', 2,
      'For each product category return the `category`, its cheapest price and its most expensive price, ordered by category.',
      'SELECT category, MIN(price), MAX(price) FROM products GROUP BY category ORDER BY category;',
      ['Several aggregates can share one `GROUP BY`.'], { ordered: true }),
    q('filter-aggregate', 'Conditional counts', 2,
      "In a **single row**, return three numbers: how many orders are `shipped`, how many are `pending`, and how many are `cancelled` — in that column order.",
      "SELECT COUNT(*) FILTER (WHERE status = 'shipped'), COUNT(*) FILTER (WHERE status = 'pending'), COUNT(*) FILTER (WHERE status = 'cancelled') FROM orders;",
      ["`COUNT(*) FILTER (WHERE condition)` counts only the rows that match — one pass over the table, several answers.", "The portable spelling is `SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END)`."]),
    q('union', 'UNION', 2,
      "Build one contact list: every customer's name and every employee's name, with a second column `kind` holding `'customer'` or `'employee'`. Sort by name.",
      "SELECT name, 'customer' AS kind FROM customers UNION ALL SELECT name, 'employee' FROM employees ORDER BY name;",
      ['`UNION ALL` stacks the rows of two queries. Both must return the same number of columns, of compatible types.', 'Plain `UNION` also removes duplicates, which costs a sort you do not need here.', 'An `ORDER BY` at the end applies to the combined result.'], { ordered: true }),
    q('in-subquery', 'IN with a subquery', 2,
      "Return the name of every customer who has ordered at least one `hardware` product. Each customer once, alphabetically.",
      `SELECT name FROM customers
WHERE id IN (
  SELECT o.customer_id FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE p.category = 'hardware'
)
ORDER BY name;`,
      ['`WHERE id IN (SELECT …)` keeps a customer if their id appears in the subquery — however many times.', 'Joining everything in one query would repeat a customer per matching item; `IN` (or `EXISTS`) avoids needing `DISTINCT`.'], { ordered: true }),
    q('dept-averages', 'Keep the empty groups', 2,
      'Return **every** department name with its average salary rounded to the nearest whole number — and `0` for a department that has no employees. Order by department name.',
      'SELECT d.name, COALESCE(ROUND(AVG(e.salary)), 0) FROM departments d LEFT JOIN employees e ON e.dept_id = d.id GROUP BY d.name ORDER BY d.name;',
      ['Start `FROM departments` and `LEFT JOIN` the employees, so a department with nobody in it still produces a row.', '`AVG` of no rows is NULL; `COALESCE(…, 0)` turns that into 0.'], { ordered: true }),
    q('alter-table', 'ALTER TABLE', 2,
      'Add a column `discontinued` to `products` — a `boolean` that is required and defaults to `false`. Then mark every product with zero `stock` as discontinued.',
      'ALTER TABLE products ADD COLUMN discontinued boolean NOT NULL DEFAULT false;\nUPDATE products SET discontinued = true WHERE stock = 0;',
      ['`ALTER TABLE t ADD COLUMN name type constraints;`', 'Adding a `NOT NULL` column to a table that already has rows only works if you give it a `DEFAULT`.'],
      { check: 'SELECT id, discontinued FROM products ORDER BY id;' }),
    q('lag', 'Window functions: LAG', 3,
      'For every order return `id`, `customer_id`, `ordered_at`, and `gap` — the number of days since that **same customer\'s previous order** (NULL for their first). Order by customer, then date.',
      `SELECT id, customer_id, ordered_at,
       ordered_at - LAG(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at) AS gap
FROM orders
ORDER BY customer_id, ordered_at;`,
      ['`LAG(col) OVER (PARTITION BY x ORDER BY y)` reads the value from the previous row in the same partition.', 'Subtracting one `date` from another gives a whole number of days.'], { ordered: true }),
    q('recursive', 'Recursive CTE: the org chart', 3,
      "Walk the management tree from the top. Return every employee's `name` and their `level`: the person with no manager is level `1`, their direct reports are `2`, and so on. Order by level, then name.",
      `WITH RECURSIVE chain AS (
  SELECT id, name, 1 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, c.level + 1 FROM employees e JOIN chain c ON e.manager_id = c.id
)
SELECT name, level FROM chain ORDER BY level, name;`,
      ['`WITH RECURSIVE name AS (anchor UNION ALL recursive_step)`.', 'The anchor is the starting row: the employee whose `manager_id` is NULL.', 'The recursive step joins `employees` to the CTE itself — "everyone whose manager is already in the chain" — adding 1 to the level.'], { ordered: true }),
  ],
  drills: [
    { q: 'Which clause filters groups after aggregation?', choices: ['WHERE', 'HAVING', 'GROUP BY', 'FILTER BY'], answer: 1, why: 'WHERE runs before grouping and cannot reference aggregates; HAVING runs after.' },
    { q: 'What does `SELECT 1 WHERE NULL = NULL` return?', choices: ['One row', 'No rows', 'An error', 'NULL'], answer: 1, why: 'Comparing anything to NULL yields NULL (unknown), which is not true. Use `IS NULL`.' },
    { q: 'Which join keeps every row from the first table even with no match?', choices: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'NATURAL JOIN'], answer: 1, why: 'LEFT JOIN fills the right side with NULLs when there is no match. INNER JOIN drops the row.' },
    { q: 'In what order are these clauses logically evaluated?', choices: ['SELECT → FROM → WHERE', 'FROM → WHERE → GROUP BY → SELECT → ORDER BY', 'WHERE → FROM → SELECT', 'ORDER BY → SELECT → FROM'], answer: 1, why: 'That is why a column alias defined in SELECT can be used in ORDER BY but not in WHERE.' },
    { q: 'What does a PRIMARY KEY guarantee?', choices: ['Fast inserts', 'Each value is unique and not NULL', 'Rows are stored sorted', 'The column is an integer'], answer: 1, why: 'It is UNIQUE plus NOT NULL, and it gets an index automatically.' },
    { q: 'What is wrong with `"hardware"` in `WHERE category = "hardware"`?', choices: ['Nothing', 'Double quotes mean an identifier (column name), not a string', 'It needs backticks', 'It is case-insensitive'], answer: 1, why: 'PostgreSQL follows the standard: single quotes for strings, double quotes for names.' },
    { q: 'How do you safely put user input into a query?', choices: ['Concatenate it into the SQL string', 'Use parameter placeholders like $1 and pass values separately', 'Escape quotes by hand', 'Wrap it in double quotes'], answer: 1, why: 'Parameters are never parsed as SQL, which makes injection impossible. Concatenation is how databases get dumped.' },
    { q: 'What does `COUNT(column)` skip that `COUNT(*)` counts?', choices: ['Duplicates', 'Rows where the column is NULL', 'Zeroes', 'Nothing'], answer: 1, why: 'COUNT(col) counts non-NULL values. COUNT(*) counts rows.' },
    { q: 'What happens to an UPDATE with no WHERE clause?', choices: ['It errors', 'It updates every row', 'It updates the first row', 'It does nothing'], answer: 1, why: 'Run the matching SELECT first, or work inside a transaction you can ROLLBACK.' },
    { q: 'What does a transaction give you?', choices: ['Faster queries', 'All statements succeed together or none take effect', 'Automatic backups', 'Row-level encryption'], answer: 1, why: 'BEGIN … COMMIT is atomic. If anything fails, ROLLBACK leaves the data as it was.' },
    { q: 'When does an index help most?', choices: ['On every column', 'On columns used to filter or join in large tables', 'On tiny tables', 'Only on text columns'], answer: 1, why: 'Indexes speed up lookups but slow down writes and take space. Add them where queries actually search.' },
    { q: 'What does a foreign key prevent?', choices: ['Duplicate rows', 'A row pointing at a parent row that does not exist', 'NULL values', 'Slow joins'], answer: 1, why: 'It enforces referential integrity: no order for a customer that is not there, and no deleting a customer who still has orders.' },
    { q: 'Which window function numbers rows 1, 2, 3 with no gaps or ties?', choices: ['RANK()', 'ROW_NUMBER()', 'DENSE_RANK()', 'COUNT()'], answer: 1, why: 'ROW_NUMBER is always unique. RANK leaves gaps after ties (1, 1, 3); DENSE_RANK does not (1, 1, 2).' },
    { q: 'What does `SELECT DISTINCT city, state FROM customers` de-duplicate on?', choices: ['city only', 'The combination of city and state', 'state only', 'The primary key'], answer: 1, why: 'DISTINCT applies to the whole row of selected columns, not just the first one.' },
    { q: 'What is the difference between `UNION` and `UNION ALL`?', choices: ['None', '`UNION` removes duplicate rows; `UNION ALL` keeps them all', '`UNION ALL` sorts the result', '`UNION` is faster'], answer: 1, why: 'Removing duplicates costs a sort or hash. Use `UNION ALL` unless you actually need them gone.' },
    { q: 'What does `LIKE \'a_c\'` match?', choices: ['Anything starting with a', 'Exactly three characters: a, any one character, c', 'The literal text a_c only', 'a followed by any number of characters then c'], answer: 1, why: '`_` is one character; `%` is any number of characters.' },
    { q: 'What does `SELECT 7 / 2` return in PostgreSQL?', choices: ['3.5', '3', '4', 'An error'], answer: 1, why: 'Integer divided by integer is integer division. Write `7 / 2.0` or cast one side to `numeric` for 3.5.' },
    { q: 'What does `EXPLAIN ANALYZE` do?', choices: ['Describes the table columns', 'Runs the query and shows the plan with real timings', 'Checks syntax only', 'Rebuilds indexes'], answer: 1, why: 'Plain `EXPLAIN` only estimates. `ANALYZE` actually executes — wrap a write in a transaction and roll it back.' },
    { q: 'What does `ON DELETE CASCADE` on a foreign key do?', choices: ['Blocks deleting the parent', 'Deletes the child rows automatically when the parent is deleted', 'Sets the child column to NULL', 'Logs the deletion'], answer: 1, why: 'Convenient and dangerous: one delete can remove a lot. The default, `NO ACTION`, refuses instead.' },
    { q: 'Which type should hold money?', choices: ['real', 'numeric (exact decimal)', 'double precision', 'text'], answer: 1, why: 'Floating-point types cannot represent 0.10 exactly, and the errors add up. `numeric(12,2)` is exact.' },
    { q: 'What does `RETURNING id` add to an INSERT?', choices: ['Nothing', 'The statement returns the new row\'s id, saving a second query', 'It validates the id', 'It makes the insert a transaction'], answer: 1, why: 'A PostgreSQL feature that also works on UPDATE and DELETE: `DELETE … RETURNING *`.' },
    { q: 'Why can `WHERE LOWER(email) = \'a@b.test\'` ignore an index on `email`?', choices: ['Indexes do not work on text', 'The index stores `email`, not `LOWER(email)`', 'LOWER is too slow', 'It cannot — the index is always used'], answer: 1, why: 'Wrapping a column in a function hides it from a plain index. Create an expression index on `LOWER(email)`.' },
    { q: 'What does `NULL = NULL` evaluate to?', choices: ['true', 'NULL (unknown)', 'false', 'An error'], answer: 1, why: 'Unknown compared with unknown is unknown, and a WHERE clause only keeps rows where the test is true. Use `IS NULL`.' },
    { q: 'What is the purpose of `BEGIN … ROLLBACK`?', choices: ['To speed up a query', 'To try changes and undo all of them', 'To lock the whole database', 'To take a backup'], answer: 1, why: 'Nothing is permanent until COMMIT. Running a risky UPDATE inside a transaction lets you inspect the result first.' },
    { q: 'What does `serial` (or `GENERATED … AS IDENTITY`) give a column?', choices: ['A random UUID', 'An automatically increasing integer', 'A timestamp', 'A unique string'], answer: 1, why: 'Each insert takes the next number from a sequence. Gaps are normal — a rolled-back insert still uses up a value.' },
  ],
};
