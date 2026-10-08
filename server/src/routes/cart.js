import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function getCart(userId) {
  const { rows } = await pool.query(
    `SELECT c.product_id, c.quantity, p.name, p.price_cents, p.image_url, p.stock
     FROM cart_items c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1 ORDER BY p.name`,
    [userId]
  );
  const totalCents = rows.reduce((sum, r) => sum + r.price_cents * r.quantity, 0);
  return { items: rows, totalCents };
}

router.get('/', async (req, res) => {
  res.json(await getCart(req.user.id));
});

// Add a product to the cart (adds to the quantity already there).
router.post('/', async (req, res) => {
  const body = req.body || {};
  const productId = Number(body.productId);
  const quantity = Number(body.quantity ?? 1);
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  const { rows: [product] } = await pool.query('SELECT stock FROM products WHERE id = $1', [productId]);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { rows: [existing] } = await pool.query(
    'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
    [req.user.id, productId]
  );
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  if (newQuantity > product.stock) {
    return res.status(409).json({ error: `Only ${product.stock} in stock` });
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [req.user.id, productId, newQuantity]
  );
  res.status(201).json(await getCart(req.user.id));
});

// Set the quantity for an item. A quantity of 0 removes it.
router.patch('/:productId', async (req, res) => {
  const quantity = Number((req.body || {}).quantity);
  if (!Number.isInteger(quantity)) return res.status(400).json({ error: 'Quantity must be a whole number' });

  if (quantity <= 0) {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [
      req.user.id,
      req.params.productId,
    ]);
    return res.json(await getCart(req.user.id));
  }

  const { rows: [product] } = await pool.query('SELECT stock FROM products WHERE id = $1', [req.params.productId]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (quantity > product.stock) return res.status(409).json({ error: `Only ${product.stock} in stock` });

  const { rowCount } = await pool.query(
    'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
    [quantity, req.user.id, req.params.productId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Item is not in your cart' });
  res.json(await getCart(req.user.id));
});

router.delete('/:productId', async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [
    req.user.id,
    req.params.productId,
  ]);
  res.json(await getCart(req.user.id));
});

export default router;
