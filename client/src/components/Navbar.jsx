import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">Shop</Link>
      <nav>
        <Link to="/">Catalog</Link>
        {user ? (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/products">Manage Products</Link>
                <Link to="/admin/orders">Manage Orders</Link>
              </>
            )}
            <span className="muted">Hi, {user.name}</span>
            <button className="link-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
