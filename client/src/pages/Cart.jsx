import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Cart() {
  const { token } = useAuth();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/cart', { token }).then(setCart).catch((err) => setError(err.message));
  }, [token]);

  async function updateQuantity(productId, quantity) {
    setError('');
    try {
      setCart(await api(`/cart/${productId}`, { method: 'PATCH', token, body: { quantity } }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(productId) {
    setError('');
    try {
      setCart(await api(`/cart/${productId}`, { method: 'DELETE', token }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!cart) return <p>{error || 'Loading...'}</p>;

  if (cart.items.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <p>Your cart is empty. <Link to="/">Browse products</Link></p>
      </>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.product_id}>
              <td>{item.name}</td>
              <td>{money(item.price_cents)}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    if (q >= 1) updateQuantity(item.product_id, q);
                  }}
                />
              </td>
              <td>{money(item.price_cents * item.quantity)}</td>
              <td>
                <button className="link-btn danger" onClick={() => remove(item.product_id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="summary">
        <p><strong>Total: {money(cart.totalCents)}</strong></p>
        <Link to="/checkout" className="button">Proceed to checkout</Link>
      </div>
    </>
  );
}
