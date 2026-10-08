import bcrypt from 'bcryptjs';
import { initDb, pool } from './db.js';

const SAMPLE_PRODUCTS = [
  ['Wireless Headphones', 'Over-ear headphones with 30-hour battery life.', 4999, 25, 'Electronics'],
  ['Mechanical Keyboard', 'Compact keyboard with hot-swappable switches.', 8950, 10, 'Electronics'],
  ['USB-C Charger 65W', 'Fast charger for laptops and phones.', 3499, 40, 'Electronics'],
  ['Cotton T-Shirt', 'Soft everyday tee, available in several colors.', 1500, 100, 'Clothing'],
  ['Denim Jacket', 'Classic-fit denim jacket.', 6500, 15, 'Clothing'],
  ['Ceramic Mug', 'Dishwasher-safe 350 ml mug.', 1200, 60, 'Home'],
  ['Desk Lamp', 'Adjustable LED lamp with three brightness levels.', 3200, 20, 'Home'],
  ['Notebook Set', 'Set of three dotted notebooks.', 999, 80, 'Stationery'],
];

async function seed() {
  await initDb();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first');
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', $1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [adminEmail.trim().toLowerCase(), hash]
  );

  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  if (count === 0) {
    for (const [name, description, price, stock, category] of SAMPLE_PRODUCTS) {
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/600/450`;
      await pool.query(
        `INSERT INTO products (name, description, price_cents, stock, image_url, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, description, price, stock, imageUrl, category]
      );
    }
    console.log(`Added ${SAMPLE_PRODUCTS.length} sample products`);
  }

  console.log(`Seed complete. Admin login: ${adminEmail}`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
