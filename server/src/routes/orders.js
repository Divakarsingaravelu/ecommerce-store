import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const STATUSES = ['placed', 'shipped', 'delivered'];

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Attach line items to a list of orders.
async function attachItems(orders) {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o.id);
  const { rows: items } = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ANY($1) ORDER BY id',
    [ids]
  );
  for (const order of orders) {
    order.items = items.filter((i) => i.order_id === order.id);
  }
  return orders;
}

// Checkout: turns the cart into an order in one transaction.
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the product rows so two customers can't buy the last item at once.
    const { rows: items } = await client.query(
      `SELECT c.product_id, c.quantity, p.name, p.price_cents, p.stock
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1
       ORDER BY p.id
       FOR UPDATE OF p`,
      [req.user.id]
    );
    if (!items.length) throw new CheckoutError(400, 'Your cart is empty');

    let totalCents = 0;
    for (const item of items) {
      if (item.quantity > item.stock) {
        throw new CheckoutError(409, `Not enough stock for ${item.name} (only ${item.stock} left)`);
      }
      totalCents += item.price_cents * item.quantity;
    }

    const { rows: [order] } = await client.query(
      'INSERT INTO orders (user_id, total_cents) VALUES ($1, $2) RETURNING id',
      [req.user.id, totalCents]
    );

    for (const item of items) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [
        item.quantity,
        item.product_id,
      ]);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_cents)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.name, item.quantity, item.price_cents]
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    res.status(201).json({ orderId: order.id, totalCents });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    client.release();
  }
});

// Admin: every order, with customer details.
router.get('/all', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  res.json(await attachItems(rows));
});

// The logged-in user's own orders.
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(await attachItems(rows));
});

// One order. Customers can only see their own; admins can see any.
router.get('/:id', requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Order not found' });
  const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const [withItems] = await attachItems([order]);
  res.json(withItems);
});

// Admin: move an order to the next status.
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const status = (req.body || {}).status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Order not found' });

  const { rows: [order] } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

export default router;
