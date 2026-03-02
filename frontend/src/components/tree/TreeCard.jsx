import { Link } from 'react-router-dom';
import { Trees, Trash2, Edit2, Users, ChevronRight } from 'lucide-react';

const ROLE_LABELS = { OWNER: 'Владелец', EDITOR: 'Редактор', VIEWER: 'Читатель', COMMENTATOR: 'Комментатор' };

export default function TreeCard({ tree, onEdit, onDelete }) {
  const date = new Date(tree.createdAt).toLocaleDateString('ru-RU');
  const isOwner = tree.role === 'OWNER';

  return (
    <div className={`tree-card tree-card--${tree.role?.toLowerCase()}`}>
      <div className="tree-card-icon">
        <Trees size={32} />
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

        <div className="tree-card-meta">Создано {date}</div>
      </div>

      <div className="tree-card-actions">
        {isOwner && (
          <>
            <button className="icon-btn" onClick={() => onEdit(tree)} title="Редактировать">
              <Edit2 size={16} />
            </button>
            <Link to={`/trees/${tree.id}/members`} className="icon-btn" title="Участники">
              <Users size={16} />
            </Link>
            <button className="icon-btn danger" onClick={() => onDelete(tree)} title="Удалить">
              <Trash2 size={16} />
            </button>
          </>
        )}
        <Link to={`/trees/${tree.id}`} className="btn btn-primary btn-sm">
          Открыть <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
