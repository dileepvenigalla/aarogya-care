import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/departments', label: 'Departments' },
  { to: '/book', label: 'Appointments' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setMenuOpen(false);
    showToast('Logged out.', 'info');
    navigate('/');
  }

  return (
    <nav className="navbar navbar-expand-lg ac-nav fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand brand" to="/" onClick={() => setMenuOpen(false)}>
          <i className="fa-solid fa-heart-pulse me-2" />
          AAROGYA CARE
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <i className="fa-solid fa-bars" />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="menu">
          <ul className="navbar-nav mx-auto">
            {NAV_ITEMS.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex gap-2 ac-auth-actions">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/patient'}
                  className="btn btn-line btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button type="button" className="btn btn-navy btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-line btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-blue btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
