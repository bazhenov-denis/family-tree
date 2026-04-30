import { useState } from 'react';
import { UserMinus, ChevronDown, GitBranch } from 'lucide-react';
import { changeMemberRole, removeMember } from '../../api/members.js';
import { useToast } from '../../context/ToastContext.jsx';
import BranchPermissionModal from './BranchPermissionModal.jsx';

const ROLES = ['EDITOR', 'COMMENTATOR', 'VIEWER'];
const ROLE_LABELS = { OWNER: 'Владелец', EDITOR: 'Редактор', VIEWER: 'Читатель', COMMENTATOR: 'Комментатор' };

export default function MemberList({ treeId, members, currentUserId, onRefresh }) {
  const toast = useToast();
  const [busy, setBusy] = useState({});
  const [branchModal, setBranchModal] = useState(null); // { memberId, memberName }

  async function handleRoleChange(userId, role) {
    setBusy(b => ({ ...b, [userId]: true }));
    try {
      await changeMemberRole(treeId, userId, role);
      toast.success('Роль изменена');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(b => ({ ...b, [userId]: false }));
    }
  }

  async function handleRemove(userId, email) {
    if (!confirm(`Удалить участника ${email}?`)) return;
    setBusy(b => ({ ...b, [userId]: true }));
    try {
      await removeMember(treeId, userId);
      toast.success('Участник удалён');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(b => ({ ...b, [userId]: false }));
    }
  }

  if (members.length === 0) {
    return <div className="empty-state">Участников нет</div>;
  }

  return (
    <>
    <ul className="member-list">
      {members.map((m) => {
        const isSelf = m.userId === currentUserId;
        const isOwner = m.role === 'OWNER';

        return (
          <li key={m.userId} className="member-item">
            <div className="member-avatar">{m.email[0].toUpperCase()}</div>
            <div className="member-info">
              <span className="member-email">{m.email}</span>
              {isSelf && <span className="badge">Вы</span>}
            </div>

            <div className="member-actions">
              {isOwner ? (
                <span className={`role-badge role-owner`}>{ROLE_LABELS.OWNER}</span>
              ) : (
                <>
                  <div className="select-wrapper">
                    <select
                      className="role-select"
                      value={m.role}
                      disabled={busy[m.userId]}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-icon" />
                  </div>

                  {m.role === 'EDITOR' && (
                    <button
                      className="icon-btn"
                      onClick={() => setBranchModal({ memberId: m.memberId, memberName: m.email })}
                      title="Настроить ветви"
                    >
                      <GitBranch size={16} />
                    </button>
                  )}

                  <button
                    className="icon-btn danger"
                    disabled={busy[m.userId]}
                    onClick={() => handleRemove(m.userId, m.email)}
                    title="Удалить"
                  >
                    <UserMinus size={16} />
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>

    {branchModal && (
      <BranchPermissionModal
        treeId={treeId}
        memberId={branchModal.memberId}
        onClose={() => setBranchModal(null)}
      />
    )}
    </>
  );
}
