import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trees } from 'lucide-react';
import { register, login as loginApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }

    setLoading(true);
    setError('');
    try {
      await register({ name: name.trim() || undefined, email, password });
      const res = await loginApi({ email, password });
      authLogin(res.accessToken, { email, name: name.trim() || undefined });
      navigate('/trees');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
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

        <h2 className="auth-title">Регистрация</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Имя (необязательно)</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Создать аккаунт'}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
