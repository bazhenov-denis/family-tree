import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trees, LogOut, Mail, Home, UserCircle, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyInvites } from '../api/invites.js';

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

export default function Layout({ children, fill = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useDarkMode();
  const [inviteCount, setInviteCount] = useState(0);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Fetch pending invites count
  useEffect(() => {
    getMyInvites()
      .then(list => setInviteCount((list || []).filter(i => i.status === 'PENDING').length))
      .catch(() => {});
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const navLinks = (
    <>
      <Link to="/trees" className={`nav-item ${isActive('/trees') ? 'active' : ''}`}>
        <Home size={18} />
        Мои деревья
      </Link>
      <Link to="/invites" className={`nav-item ${isActive('/invites') ? 'active' : ''}`}>
        <Mail size={18} />
        Приглашения
        {inviteCount > 0 && <span className="nav-badge">{inviteCount}</span>}
      </Link>
      <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
        <UserCircle size={18} />
        Профиль
      </Link>
    </>
  );

  return (
    <div className="app-shell">
      {/* ── Skip link (accessibility) ── */}
      <a href="#main-content" className="skip-link">Перейти к содержимому</a>

      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Открыть меню"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-topbar-logo">
          <Trees size={22} />
          <span>Семейное Древо</span>
        </div>
      </div>

      {/* ── Overlay backdrop ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <Trees size={28} />
          <span>Семейное Древо</span>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть меню"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="user-info user-info-link">
            <div className="user-avatar">{(user?.name || user?.email || '?')[0].toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Пользователь'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </Link>
          <button className="icon-btn" onClick={() => setDark(d => !d)} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main id="main-content" className={`main-content${fill ? ' main-content--fill' : ''}`}>{children}</main>
    </div>
  );
}
