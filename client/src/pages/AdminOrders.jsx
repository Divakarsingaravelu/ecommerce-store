import { useEffect, useState } from 'react';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

const STATUSES = ['placed', 'shipped', 'delivered'];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders/all', { token }).then(setOrders).catch((err) => setError(err.message));
  }, [token]);

  async function changeStatus(id, status) {
    setError('');
    try {
      const updated = await api(`/orders/${id}/status`, { method: 'PATCH', token, body: { status } });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>
                  {o.customer_name}
                  <br />
                  <span className="muted">{o.customer_email}</span>
                </td>
                <td>{o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(', ')}</td>
                <td>{money(o.total_cents)}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
