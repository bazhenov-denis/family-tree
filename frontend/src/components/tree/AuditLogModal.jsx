import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, Link, CalendarDays, Image } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getAuditLog } from '../../api/audit.js';

const ACTION_META = {
  CREATE_PERSON:       { Icon: PlusCircle,   color: '#16a34a', bg: '#f0fdf4' },
  UPDATE_PERSON:       { Icon: Pencil,       color: '#2563eb', bg: '#eff6ff' },
  DELETE_PERSON:       { Icon: Trash2,       color: '#dc2626', bg: '#fef2f2' },
  CREATE_RELATIONSHIP: { Icon: Link,         color: '#16a34a', bg: '#f0fdf4' },
  DELETE_RELATIONSHIP: { Icon: Trash2,       color: '#dc2626', bg: '#fef2f2' },
  CREATE_EVENT:        { Icon: CalendarDays, color: '#8b5cf6', bg: '#f5f3ff' },
  UPDATE_EVENT:        { Icon: CalendarDays, color: '#2563eb', bg: '#eff6ff' },
  DELETE_EVENT:        { Icon: Trash2,       color: '#dc2626', bg: '#fef2f2' },
  CREATE_MEDIA:        { Icon: Image,        color: '#f59e0b', bg: '#fffbeb' },
  DELETE_MEDIA:        { Icon: Trash2,       color: '#dc2626', bg: '#fef2f2' },
};

const FILTER_OPTIONS = [
  { id: 'ALL',    label: 'Все' },
  { id: 'CREATE', label: 'Создание' },
  { id: 'UPDATE', label: 'Изменение' },
  { id: 'DELETE', label: 'Удаление' },
];

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
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    getAuditLog(treeId)
      .then(setLog)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

  const filteredLog = filter === 'ALL'
    ? log
    : log.filter(e => e.action?.startsWith(filter));

  return (
    <Modal title="Журнал изменений" onClose={onClose}>
      <div className="audit-filter-bar">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            className={`audit-filter-btn${filter === opt.id ? ' active' : ''}`}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spinner size={28} />
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {!loading && filteredLog.length === 0 && !error && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
          {filter === 'ALL' ? 'Изменений пока не было.' : 'Нет записей выбранного типа.'}
        </p>
      )}
      {!loading && filteredLog.length > 0 && (
        <div className="audit-list">
          {filteredLog.map(entry => {
            const meta = ACTION_META[entry.action] ?? { Icon: Pencil, color: '#64748b', bg: '#f8fafc' };
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
