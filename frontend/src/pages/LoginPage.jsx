import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trees } from 'lucide-react';
import { login } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="auth-card">
        <div className="auth-logo">
          <Trees size={36} />
          <h1>Семейное Древо</h1>
        </div>

        <h2 className="auth-title">Вход</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
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
  );
}
