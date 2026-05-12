import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trees, Check, LogIn } from 'lucide-react';
import { resolveToken, acceptByToken } from '../api/tokens.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const ROLE_LABELS = { EDITOR: 'Редактор', VIEWER: 'Читатель' };

function withInviteParams(path, token, email) {
  const params = new URLSearchParams({ redirect: `/invite/${token}` });
  if (email) params.set('email', email);
  return `${path}?${params.toString()}`;
}

export default function InviteTokenPage() {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    resolveToken(token)
      .then(setPreview)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!isAuthenticated) {
      navigate(withInviteParams('/login', token, preview?.email));
      return;
    }
    setAccepting(true);
    try {
      await acceptByToken(token);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Trees size={36} />
          <h1>Семейное Древо</h1>
        </div>

        {loading && (
          <div className="loading-state"><Spinner size={32} /></div>
        )}

        {error && (
          <div className="invite-error">
            <p className="form-error">{error}</p>
            <Link to="/trees" className="btn btn-ghost">На главную</Link>
          </div>
        )}

        {!loading && !error && preview && (
          <div className="invite-preview">
            {done ? (
              <>
                <div className="invite-success-icon"><Check size={40} /></div>
                <h2>Вы вступили в дерево</h2>
                <p className="text-muted">«{preview.treeTitle}»</p>
                <Link to="/trees" className="btn btn-primary btn-full">
                  Перейти к деревьям
                </Link>
              </>
            ) : (
              <>
                <h2>Приглашение</h2>
                <p>Вас приглашают в семейное дерево</p>
                <div className="invite-tree-name">«{preview.treeTitle}»</div>
                <p className="text-muted">
                  Роль: <span className={`role-badge role-${preview.role?.toLowerCase()}`}>
                    {ROLE_LABELS[preview.role] || preview.role}
                  </span>
                </p>

                {isAuthenticated ? (
                  <button className="btn btn-primary btn-full" disabled={accepting} onClick={handleAccept}>
                    {accepting ? <Spinner size={18} /> : <><Check size={16} /> Принять приглашение</>}
                  </button>
                ) : (
                  <>
                    <p className="text-muted">Войдите, чтобы принять приглашение</p>
                    <Link to={withInviteParams('/login', token, preview.email)} className="btn btn-primary btn-full">
                      <LogIn size={16} /> Войти
                    </Link>
                    <Link to={withInviteParams('/register', token, preview.email)} className="btn btn-ghost btn-full">
                      Создать аккаунт
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
