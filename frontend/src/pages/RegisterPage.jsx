import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trees, Eye, EyeOff, MailCheck, UserPlus } from 'lucide-react';
import { register } from '../api/auth.js';
import Spinner from '../components/ui/Spinner.jsx';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const invitedEmail = searchParams.get('email') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await register({ name: name.trim() || undefined, email, password, redirectPath: redirect || undefined });
      setRegisteredEmail(res.email || email);
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const initials = ((name.trim() || email || '?')[0]).toUpperCase();

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-icon">
            <UserPlus size={40} />
          </div>
          <h2 className="auth-visual-title">Начните свою<br />семейную историю</h2>
          <p className="auth-visual-desc">
            Создайте аккаунт, подтвердите email и приступайте к построению дерева.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <Trees size={32} />
            <h1>Семейное Древо</h1>
          </div>

          <h2 className="auth-title">Регистрация</h2>
          <p className="auth-subtitle">
            {registeredEmail ? 'Остался последний шаг: подтвердите email' : 'Создайте аккаунт и подтвердите email'}
          </p>

          {registeredEmail ? (
            <div className="success-state">
              <MailCheck size={52} color="var(--clr-primary)" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Письмо отправлено</div>
                <div className="text-muted">
                  Мы отправили ссылку подтверждения на <strong>{registeredEmail}</strong>.
                  После подтверждения email мы сразу откроем ваш аккаунт.
                </div>
              </div>
              <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} className="btn btn-ghost btn-full">Войти другим способом</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--clr-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 600, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Ваш аватар</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-muted)' }}>Будет обновляться при вводе имени</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                  <label className="form-label">Имя <span style={{ color: 'var(--clr-muted)', fontWeight: 400 }}>(необязательно)</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    autoComplete="name"
                    autoFocus
                  />
                </div>

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
                      placeholder="Минимум 6 символов"
                      autoComplete="new-password"
                      required
                      minLength={6}
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
                  {loading ? <Spinner size={18} /> : 'Создать аккаунт'}
                </button>
              </form>
            </>
          )}

          <p className="auth-footer">
            Уже есть аккаунт? <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}>Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
