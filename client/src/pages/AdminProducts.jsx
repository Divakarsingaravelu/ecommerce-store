import { useEffect, useState } from 'react';
import { api, money } from '../api.js';
import { useAuth } from '../auth.jsx';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '0', image_url: '', category: 'General' };

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const data = await api('/products?limit=50', { token });
    setProducts(data.items);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [token]);

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: (product.price_cents / 100).toFixed(2),
      stock: String(product.stock),
      image_url: product.image_url,
      category: product.category,
    });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    const body = {
      name: form.name,
      description: form.description,
      price_cents: Math.round(Number(form.price) * 100),
      stock: parseInt(form.stock, 10),
      image_url: form.image_url,
      category: form.category,
    };
    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', token, body });
      } else {
        await api('/products', { method: 'POST', token, body });
      }
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await api(`/products/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <>
      <h1>Products</h1>
      {error && <p className="error">{error}</p>}

      <form className="product-form" onSubmit={save}>
        <h2>{editingId ? 'Edit product' : 'New product'}</h2>
        <label>
          Name
          <input required value={form.name} onChange={setField('name')} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={setField('description')} />
        </label>
        <label>
          Price (USD)
          <input required type="number" step="0.01" min="0" value={form.price} onChange={setField('price')} />
        </label>
        <label>
          Stock
          <input required type="number" min="0" value={form.stock} onChange={setField('stock')} />
        </label>
        <label>
          Category
          <input value={form.category} onChange={setField('category')} />
        </label>
        <label>
          Image URL
          <input value={form.image_url} onChange={setField('image_url')} />
        </label>
        <div className="row">
          <button>{editingId ? 'Save changes' : 'Create product'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={reset}>Cancel</button>
          )}
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{money(p.price_cents)}</td>
              <td>{p.stock}</td>
              <td>{p.category}</td>
              <td>
                <button className="link-btn" onClick={() => startEdit(p)}>Edit</button>{' '}
                <button className="link-btn danger" onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
