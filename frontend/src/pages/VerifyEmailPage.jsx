import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, MailX, Trees } from 'lucide-react';
import { verifyEmail } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Подтверждаем email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Ссылка подтверждения некорректна');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        login(res.accessToken, { email: res.email, name: res.name });
        setStatus('success');
        setMessage('Email подтверждён. Открываем аккаунт...');
        setTimeout(() => navigate(redirect || '/trees', { replace: true }), 700);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Не удалось подтвердить email');
      });
  }, [token, redirect, login, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-form-side" style={{ margin: '0 auto' }}>
        <div className="auth-card">
          <div className="auth-logo">
            <Trees size={32} />
            <h1>Семейное Древо</h1>
          </div>

          <div className="success-state">
            {status === 'loading' && <Spinner size={42} />}
            {status === 'success' && <MailCheck size={52} color="var(--clr-primary)" />}
            {status === 'error' && <MailX size={52} color="var(--clr-danger)" />}

            <div>
              <h2 className="auth-title" style={{ marginBottom: 8 }}>
                {status === 'success' ? 'Email подтверждён' : status === 'error' ? 'Ссылка не сработала' : 'Проверяем ссылку'}
              </h2>
              <p className="auth-subtitle" style={{ marginBottom: 0 }}>{message}</p>
            </div>

            {status === 'success' ? (
              <Link to={redirect || '/trees'} className="btn btn-primary btn-full">Продолжить</Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-full">Перейти ко входу</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
