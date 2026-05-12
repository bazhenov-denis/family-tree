import { useState, useEffect } from 'react';
import { Camera, RotateCcw, User, Link2, Calendar, Image, Loader2 } from 'lucide-react';
import { getVersionPreview, restoreSnapshot } from '../../api/versions';

const GENDER_LABELS = { M: 'Муж.', F: 'Жен.', OTHER: 'Другой' };
const REL_LABELS = {
  PARENT: 'Родитель', CHILD: 'Ребёнок', SPOUSE: 'Супруг(а)',
  SIBLING: 'Брат/Сестра', OTHER: 'Прочее',
};
const EVENT_LABELS = {
  BIRTH: 'Рождение', DEATH: 'Смерть', MARRIAGE: 'Брак',
  DIVORCE: 'Развод', MOVE: 'Переезд', CUSTOM: 'Событие',
};

export default function SnapshotPreviewModal({ treeId, version, onClose, onRestored }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('persons');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getVersionPreview(treeId, version.id)
      .then(data => { setPreview(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [treeId, version.id]);

  async function handleRestore() {
    if (!confirm('Восстановить дерево до этого снапшота? Текущее состояние будет перезаписано.')) return;
    setRestoring(true);
    try {
      await restoreSnapshot(treeId, version.id);
      onRestored?.();
      onClose();
    } catch (e) {
      alert(e.message);
      setRestoring(false);
    }
  }

  function formatDate(d) {
    if (!d) return null;
    return String(d);
  }

  const tabs = preview ? [
    { key: 'persons',       label: 'Персоны',  count: preview.persons.length,       Icon: User },
    { key: 'relationships', label: 'Связи',    count: preview.relationships.length,  Icon: Link2 },
    { key: 'events',        label: 'События',  count: preview.events.length,         Icon: Calendar },
    { key: 'media',         label: 'Медиа',    count: preview.media.length,          Icon: Image },
  ] : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal snap-preview-modal" onClick={e => e.stopPropagation()}>

        <div className="snap-preview-header">
          <div className="snap-preview-header-icon">
            <Camera size={18} color="#8b5cf6" />
          </div>
          <div className="snap-preview-header-info">
            <div className="modal-title">{version.name}</div>
            {version.description && (
              <div className="snap-preview-subtitle">{version.description}</div>
            )}
            <div className="snap-preview-subtitle">
              {new Date(version.createdAt).toLocaleString('ru-RU', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {version.createdBy && <> · {version.createdBy}</>}
            </div>
          </div>
          <button className="snap-preview-close" onClick={onClose}>&times;</button>
        </div>

        {loading && (
          <div className="snap-preview-loading">
            <Loader2 size={20} className="spin" />
            Загрузка данных снапшота...
          </div>
        )}

        {error && (
          <div className="snap-preview-error">{error}</div>
        )}

        {preview && (
          <>
            <div className="snap-preview-tabs">
              {tabs.map(({ key, label, count, Icon }) => (
                <button
                  key={key}
                  className={`snap-tab ${activeTab === key ? 'snap-tab--active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={13} />
                  {label}
                  <span className="snap-tab-badge">{count}</span>
                </button>
              ))}
            </div>

            <div className="snap-preview-body">
              {activeTab === 'persons' && (
                preview.persons.length === 0 ? <EmptyState text="Персон в снапшоте нет" /> :
                <ul className="snap-entity-list">
                  {preview.persons.map((p, i) => (
                    <li key={i} className="snap-entity-row">
                      <div className="snap-entity-avatar snap-entity-avatar--person">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div className="snap-entity-info">
                        <div className="snap-entity-name">
                          {[p.firstName, p.lastName].filter(Boolean).join(' ') || 'Без имени'}
                        </div>
                        <div className="snap-entity-meta">
                          {GENDER_LABELS[p.gender] || p.gender || ''}
                          {p.birthDate && ` · р. ${formatDate(p.birthDate)}`}
                          {p.deathDate && ` — ум. ${formatDate(p.deathDate)}`}
                          {p.birthPlace && ` · ${p.birthPlace}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === 'relationships' && (
                preview.relationships.length === 0 ? <EmptyState text="Связей в снапшоте нет" /> :
                <ul className="snap-entity-list">
                  {preview.relationships.map((r, i) => (
                    <li key={i} className="snap-entity-row snap-entity-row--rel">
                      <div className="snap-rel-badge">{REL_LABELS[r.type] || r.type}</div>
                      <div className="snap-entity-meta snap-rel-ids">
                        {String(r.fromPersonId).slice(0, 8)}… → {String(r.toPersonId).slice(0, 8)}…
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === 'events' && (
                preview.events.length === 0 ? <EmptyState text="Событий в снапшоте нет" /> :
                <ul className="snap-entity-list">
                  {preview.events.map((e, i) => (
                    <li key={i} className="snap-entity-row">
                      <div className="snap-entity-avatar snap-entity-avatar--event">
                        <Calendar size={13} />
                      </div>
                      <div className="snap-entity-info">
                        <div className="snap-entity-name">
                          {e.title || EVENT_LABELS[e.type] || e.type}
                        </div>
                        <div className="snap-entity-meta">
                          {EVENT_LABELS[e.type] || e.type}
                          {e.dateFrom && ` · ${formatDate(e.dateFrom)}`}
                          {e.dateTo && ` — ${formatDate(e.dateTo)}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === 'media' && (
                preview.media.length === 0 ? <EmptyState text="Медиафайлов в снапшоте нет" /> :
                <ul className="snap-entity-list">
                  {preview.media.map((m, i) => (
                    <li key={i} className="snap-entity-row">
                      <div className="snap-entity-avatar snap-entity-avatar--media">
                        <Image size={13} />
                      </div>
                      <div className="snap-entity-info">
                        <div className="snap-entity-name">{m.fileName || 'Файл'}</div>
                        <div className="snap-entity-meta">{m.mimeType || ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="snap-preview-footer">
          <button className="btn btn--outline" onClick={onClose}>Закрыть</button>
          <button className="btn" disabled={restoring || loading} onClick={handleRestore}>
            <RotateCcw size={14} />
            {restoring ? 'Восстановление...' : 'Восстановить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="snap-preview-empty">{text}</div>;
}
