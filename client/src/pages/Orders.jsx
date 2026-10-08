import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

const STATUS_LABELS = { placed: 'Placed', shipped: 'Shipped', delivered: 'Delivered' };

export default function Orders() {
  const { token } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders', { token }).then(setOrders).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!orders) return <p>Loading...</p>;

  return (
    <>
      <h1>My orders</h1>
      {location.state?.placed && (
        <p className="success">Order #{location.state.placed} was placed successfully.</p>
      )}
      {orders.length === 0 && <p>You have no orders yet.</p>}
      {orders.map((order) => (
        <div className="order" key={order.id}>
          <div className="order-head">
            <strong>Order #{order.id}</strong>
            <span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
            <span className="muted">{new Date(order.created_at).toLocaleDateString()}</span>
            <strong>{money(order.total_cents)}</strong>
          </div>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product_name} × {item.quantity} — {money(item.price_cents)} each
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
