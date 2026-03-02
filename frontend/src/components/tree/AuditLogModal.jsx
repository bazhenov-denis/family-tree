import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, Link } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getAuditLog } from '../../api/audit.js';

const ACTION_META = {
  CREATE_PERSON:       { Icon: PlusCircle, color: '#16a34a', bg: '#f0fdf4' },
  UPDATE_PERSON:       { Icon: Pencil,     color: '#2563eb', bg: '#eff6ff' },
  DELETE_PERSON:       { Icon: Trash2,     color: '#dc2626', bg: '#fef2f2' },
  CREATE_RELATIONSHIP: { Icon: Link,       color: '#16a34a', bg: '#f0fdf4' },
  DELETE_RELATIONSHIP: { Icon: Trash2,     color: '#dc2626', bg: '#fef2f2' },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff} сек. назад`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

function initials(name) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AuditLogModal({ treeId, onClose }) {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuditLog(treeId)
      .then(setLog)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

  return (
    <Modal title="Журнал изменений" onClose={onClose}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spinner size={28} />
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {!loading && log.length === 0 && !error && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
          Изменений пока не было.
        </p>
      )}
      {!loading && log.length > 0 && (
        <div className="audit-list">
          {log.map(entry => {
            const meta = ACTION_META[entry.action] ?? ACTION_META.UPDATE_PERSON;
            const { Icon } = meta;
            return (
              <div key={entry.id} className="audit-item">
                <div className="audit-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={14} />
                </div>
                <div className="audit-body">
                  <div className="audit-line">
                    <span className="audit-avatar">{initials(entry.userName)}</span>
                    <span className="audit-user">{entry.userName}</span>
                    <span className="audit-desc">{entry.description}</span>
                  </div>
                  <div className="audit-time">{timeAgo(entry.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
