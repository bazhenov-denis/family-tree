import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trees, Eye, EyeOff } from 'lucide-react';
import { login } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login({ email, password });
      authLogin(res.accessToken, { email });
      navigate('/trees');
    } catch (err) {
      setError(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left visual panel */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-icon">
            <Trees size={40} />
          </div>
          <h2 className="auth-visual-title">Сохраните историю<br />своей семьи</h2>
          <p className="auth-visual-desc">
            Создайте интерактивное семейное дерево, добавьте фотографии и события. Поделитесь с близкими.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <Trees size={32} />
            <h1>Семейное Древо</h1>
          </div>

          <h2 className="auth-title">Вход</h2>
          <p className="auth-subtitle">Войдите, чтобы продолжить работу с вашими деревьями</p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--clr-muted)', padding: 4, display: 'flex',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Войти'}
            </button>
          </form>

          <p className="auth-footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
