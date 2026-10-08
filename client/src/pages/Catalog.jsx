import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api.js';

export default function Catalog() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ search: '', category: '', page: 1 });
  const [error, setError] = useState('');

  useEffect(() => {
    api('/products/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: query.page, limit: 12 });
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    api(`/products?${params}`)
      .then((result) => {
        setData(result);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [query]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery((q) => ({ ...q, search, page: 1 }));
  }

  return (
    <>
      <h1>Catalog</h1>
      <div className="toolbar">
        <form onSubmit={handleSearch} className="row">
          <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button>Search</button>
        </form>
        <select
          value={query.category}
          onChange={(e) => setQuery((q) => ({ ...q, category: e.target.value, page: 1 }))}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {data.items.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className="card">
            <img src={p.image_url} alt={p.name} />
            <h3>{p.name}</h3>
            <p className="price">{money(p.price_cents)}</p>
            {p.stock === 0 && <span className="muted">Out of stock</span>}
          </Link>
        ))}
      </div>
      {data.items.length === 0 && !error && <p>No products found.</p>}

      <div className="pager">
        <button disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>
          Previous
        </button>
        <span>Page {data.page} of {data.pages}</span>
        <button disabled={query.page >= data.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>
          Next
        </button>
      </div>
    </>
  );
}
