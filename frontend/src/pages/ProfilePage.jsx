import { useState, useEffect } from 'react';
import { User, Lock, Trees, Users, CalendarDays, Mail } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateMe } from '../api/users.js';
import { getMyTrees } from '../api/trees.js';

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

  // User stats
  const [treeCount, setTreeCount] = useState(0);
  const [totalPersons, setTotalPersons] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    setStatsLoading(true);
    getMyTrees()
      .then(trees => {
        setTreeCount(trees.length);
        setTotalPersons(trees.reduce((sum, t) => sum + (t.personCount || 0), 0));
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const initials = ((user?.name || user?.email || '?')[0]).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    : null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Профиль</h1>
          <p className="page-subtitle">Управление учётной записью</p>
        </div>
      </div>

      <div className="profile-grid">

        {/* Profile card */}
        <div className="section-card">
          <div className="section-header">
            <User size={16} />
            <span>Основные данные</span>
          </div>

          <div className="profile-card-top">
            <div className="profile-avatar-large" style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
            }}>
              {initials}
            </div>
            <div>
              <div className="profile-name-large">{user?.name || 'Пользователь'}</div>
              <div className="profile-email-line">
                <Mail size={12} />
                {user?.email}
              </div>
              {memberSince && (
                <div className="profile-member-since">
                  <CalendarDays size={12} />
                  Участник с {memberSince}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          {statsLoading ? (
            <div style={{ padding: '16px 22px' }}><Spinner size={18} /></div>
          ) : (
            <div className="profile-stats-row">
              <div className="profile-stat">
                <Trees size={16} />
                <div className="profile-stat-value">{treeCount}</div>
                <div className="profile-stat-label">{treeCount === 1 ? 'дерево' : treeCount < 5 ? 'дерева' : 'деревьев'}</div>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <Users size={16} />
                <div className="profile-stat-value">{totalPersons}</div>
                <div className="profile-stat-label">{totalPersons === 1 ? 'человек' : totalPersons < 5 ? 'человека' : 'человек'}</div>
              </div>
            </div>
          )}

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
