import { Link } from 'react-router-dom';
import { Trees, Trash2, Edit2, Users, ChevronRight, UserRound, CalendarDays, Image } from 'lucide-react';

const ROLE_LABELS = { OWNER: 'Владелец', EDITOR: 'Редактор', VIEWER: 'Читатель', COMMENTATOR: 'Комментатор' };

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 5) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHr < 24) return `${diffHr} ч назад`;
  if (diffDay < 7) return `${diffDay} дн назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TreeCard({ tree, onEdit, onDelete }) {
  const isOwner = tree.role === 'OWNER';
  const updatedStr = formatDate(tree.updatedAt || tree.createdAt);
  const createdStr = new Date(tree.createdAt).toLocaleDateString('ru-RU');

  return (
    <div className={`tree-card tree-card--${tree.role?.toLowerCase()}`}>
      {/* Quick actions overlay */}
      {isOwner && (
        <div className="tree-card-quick-actions">
          <button className="icon-btn" onClick={() => onEdit(tree)} title="Редактировать" style={{ width: 30, height: 30 }}>
            <Edit2 size={14} />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(tree)} title="Удалить" style={{ width: 30, height: 30 }}>
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="tree-card-icon">
        <Trees size={26} />
      </div>

      <div className="tree-card-body">
        <div className="tree-card-header">
          <h3 className="tree-card-title">{tree.title}</h3>
          <span className={`role-badge role-${tree.role?.toLowerCase()}`}>
            {ROLE_LABELS[tree.role] || tree.role}
          </span>
        </div>

        {tree.description && (
          <p className="tree-card-desc">{tree.description}</p>
        )}

        {/* Stats row */}
        <div className="tree-card-stats">
          <span className="tree-card-stat">
            <UserRound size={13} /> {tree.personCount ?? 0}
          </span>
          <span className="tree-card-stat">
            <CalendarDays size={13} /> {tree.eventCount ?? 0}
          </span>
          <span className="tree-card-stat">
            <Image size={13} /> {tree.mediaCount ?? 0}
          </span>
        </div>
      </div>

      <div className="tree-card-meta">
        {updatedStr && <span>Обновлено {updatedStr}</span>}
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Создано {createdStr}</span>
      </div>

      <div className="tree-card-actions">
        {isOwner && (
          <Link to={`/trees/${tree.id}/members`} className="icon-btn" title="Участники">
            <Users size={16} />
          </Link>
        )}
        <Link to={`/trees/${tree.id}`} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
          Открыть <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
