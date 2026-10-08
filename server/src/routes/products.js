import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function validateProduct(body) {
  const { name, description = '', price_cents, stock = 0, image_url = '', category = 'General' } = body;
  if (typeof name !== 'string' || !name.trim()) return { error: 'Name is required' };
  if (!Number.isInteger(price_cents) || price_cents < 0) {
    return { error: 'Price must be a whole number of cents, 0 or more' };
  }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number, 0 or more' };

  return {
    values: [
      name.trim(),
      String(description),
      price_cents,
      stock,
      String(image_url),
      String(category).trim() || 'General',
    ],
  };
}

// Public: list products with search, category filter and pagination.
router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM products ${where}`,
    params
  );
  const { rows } = await pool.query(
    `SELECT * FROM products ${where} ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({ items: rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

router.get('/categories', async (req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
  res.json(rows.map((r) => r.category));
});

router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const { rows: [product] } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Admin: create a product.
router.post('/', requireAdmin, async (req, res) => {
  const { error, values } = validateProduct(req.body || {});
  if (error) return res.status(400).json({ error });

  const { rows: [product] } = await pool.query(
    `INSERT INTO products (name, description, price_cents, stock, image_url, category)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    values
  );
  res.status(201).json(product);
});

// Admin: update a product.
router.put('/:id', requireAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const { error, values } = validateProduct(req.body || {});
  if (error) return res.status(400).json({ error });

  const { rows: [product] } = await pool.query(
    `UPDATE products SET name = $1, description = $2, price_cents = $3, stock = $4,
       image_url = $5, category = $6
     WHERE id = $7 RETURNING *`,
    [...values, req.params.id]
  );
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Admin: delete a product.
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

export default router;
