import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/products/${id}`).then(setProduct).catch((err) => setError(err.message));
  }, [id]);

  async function addToCart() {
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setError('');
    setMessage('');
    try {
      await api('/cart', { method: 'POST', token, body: { productId: product.id, quantity: qty } });
      setMessage('Added to cart.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !product) return <p className="error">{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <div className="detail">
      <img src={product.image_url} alt={product.name} />
      <div>
        <h1>{product.name}</h1>
        <p className="price">{money(product.price_cents)}</p>
        <p>{product.description}</p>
        <p className="muted">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'} · {product.category}
        </p>
        {product.stock > 0 && (
          <div className="row">
            <label>
              Quantity{' '}
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <button onClick={addToCart}>Add to cart</button>
          </div>
        )}
        {message && <p className="success">{message} <Link to="/cart">View cart</Link></p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
