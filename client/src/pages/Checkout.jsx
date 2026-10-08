import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Checkout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api('/cart', { token }).then(setCart).catch((err) => setError(err.message));
  }, [token]);

  async function placeOrder() {
    setError('');
    setPlacing(true);
    try {
      const order = await api('/orders', { method: 'POST', token });
      navigate('/orders', { state: { placed: order.orderId } });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }

  if (!cart) return <p>{error || 'Loading...'}</p>;
  if (cart.items.length === 0) {
    return (
      <>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </>
    );
  }

  return (
    <>
      <h1>Checkout</h1>
      <ul className="summary-list">
        {cart.items.map((item) => (
          <li key={item.product_id}>
            {item.name} × {item.quantity} — {money(item.price_cents * item.quantity)}
          </li>
        ))}
      </ul>
      <p><strong>Total: {money(cart.totalCents)}</strong></p>
      <p className="muted">
        Payment isn't connected in this demo. Placing the order reduces stock and clears your cart.
      </p>
      {error && <p className="error">{error}</p>}
      <button onClick={placeOrder} disabled={placing}>
        {placing ? 'Placing order...' : 'Place order'}
      </button>{' '}
      <Link to="/cart">Back to cart</Link>
    </>
  );
}
