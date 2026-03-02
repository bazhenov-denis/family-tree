import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateMe } from '../api/users.js';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  // Profile form
  const [name, setName]           = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError]     = useState('');
  const [savingPwd, setSavingPwd]   = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateMe({ name: name.trim() || null });
      updateUser({ ...user, name: updated.name });
      toast.success('Профиль обновлён');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdError('');
    if (newPwd !== confirmPwd) {
      setPwdError('Пароли не совпадают');
      return;
    }
    if (newPwd.length < 6) {
      setPwdError('Пароль должен быть не менее 6 символов');
      return;
    }
    setSavingPwd(true);
    try {
      await updateMe({ currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      toast.success('Пароль изменён');
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setSavingPwd(false);
    }
  }

  const initials = ((user?.name || user?.email || '?')[0]).toUpperCase();

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Профиль</h1>
          <p className="page-subtitle">Управление учётной записью</p>
        </div>
      </div>

      <div className="profile-grid">

        {/* Profile info */}
        <div className="section-card">
          <div className="section-header">
            <User size={16} />
            <span>Основные данные</span>
          </div>

          <div className="profile-avatar-row">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="profile-name">{user?.name || '—'}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="form" style={{ marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Отображаемое имя</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван Иванов"
                maxLength={100}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? <Spinner size={16} /> : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="section-card">
          <div className="section-header">
            <Lock size={16} />
            <span>Смена пароля</span>
          </div>

          <form onSubmit={handleChangePassword} className="form" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Текущий пароль</label>
              <input
                type="password"
                className="form-input"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input
                type="password"
                className="form-input"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Подтвердите новый пароль</label>
              <input
                type="password"
                className="form-input"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {pwdError && <div className="form-error">{pwdError}</div>}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
              >
                {savingPwd ? <Spinner size={16} /> : 'Изменить пароль'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </Layout>
  );
}
