import { useState, useEffect } from 'react';
import { Check, X, Trees } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMyInvites, acceptInvite, declineInvite } from '../api/invites.js';
import { useToast } from '../context/ToastContext.jsx';

const ROLE_LABELS = { EDITOR: 'Редактор', VIEWER: 'Читатель' };

export default function InvitesPage() {
  const toast = useToast();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyInvites();
      setInvites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handle(inviteId, treeId, action) {
    setBusy(b => ({ ...b, [inviteId]: true }));
    try {
      if (action === 'accept') {
        await acceptInvite(treeId, inviteId);
        toast.success('Приглашение принято');
      } else {
        await declineInvite(treeId, inviteId);
        toast.success('Приглашение отклонено');
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(b => ({ ...b, [inviteId]: false }));
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Приглашения</h1>
          <p className="page-subtitle">Входящие приглашения в семейные деревья</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><Spinner size={32} /></div>
      ) : invites.length === 0 ? (
        <div className="empty-state">
          <p>Нет входящих приглашений.</p>
        </div>
      ) : (
        <div className="invite-list">
          {invites.map((inv) => {
            const expires = new Date(inv.expiresAt).toLocaleDateString('ru-RU');
            return (
              <div key={inv.inviteId} className="invite-card">
                <div className="invite-icon">
                  <Trees size={24} />
                </div>
                <div className="invite-body">
                  <div className="invite-tree">{inv.treeTitle}</div>
                  <div className="invite-meta">
                    Роль: <span className={`role-badge role-${inv.role?.toLowerCase()}`}>
                      {ROLE_LABELS[inv.role] || inv.role}
                    </span>
                    <span className="separator">·</span>
                    Действует до {expires}
                  </div>
                </div>
                <div className="invite-actions">
                  <button
                    className="btn btn-success btn-sm"
                    disabled={busy[inv.inviteId]}
                    onClick={() => handle(inv.inviteId, inv.treeId, 'accept')}
                  >
                    {busy[inv.inviteId] ? <Spinner size={14} /> : <><Check size={14} /> Принять</>}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busy[inv.inviteId]}
                    onClick={() => handle(inv.inviteId, inv.treeId, 'decline')}
                  >
                    <X size={14} /> Отклонить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
