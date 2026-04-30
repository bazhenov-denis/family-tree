import { useState, useEffect } from 'react';
import { X, Camera, GitBranch, ArrowLeftRight, Trash2, GitMerge, RotateCcw, Plus } from 'lucide-react';
import { listVersions, deleteVersion, discardWorkingCopy } from '../../api/versions';
import CreateSnapshotModal from './CreateSnapshotModal';
import CreateWorkingCopyModal from './CreateWorkingCopyModal';
import MergeWizard from './MergeWizard';

const TYPE_ICONS = {
  SNAPSHOT: { icon: Camera, label: 'Снапшот', color: '#8b5cf6' },
  WORKING_COPY: { icon: GitBranch, label: 'Рабочая копия', color: '#3b82f6' },
  MAIN: { icon: GitBranch, label: 'Основная', color: '#16a34a' },
};

export default function VersionsPanel({ treeId, onClose, onRefresh }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showWorkingCopyModal, setShowWorkingCopyModal] = useState(false);
  const [mergeVersion, setMergeVersion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [treeId]);

  async function loadVersions() {
    try {
      const data = await listVersions(treeId);
      setVersions(data || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить эту версию?')) return;
    try {
      await deleteVersion(treeId, id);
      await loadVersions();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDiscard(id) {
    if (!confirm('Отменить рабочую копию? Все изменения будут потеряны.')) return;
    try {
      await discardWorkingCopy(treeId, id);
      await loadVersions();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <>
      <div className="versions-panel">
        <div className="versions-panel__header">
          <h3>Версии</h3>
          <button className="versions-panel__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="versions-panel__actions">
          <button className="btn btn--sm" onClick={() => setShowSnapshotModal(true)}>
            <Plus size={14} /> Снапшот
          </button>
          <button className="btn btn--sm btn--outline" onClick={() => setShowWorkingCopyModal(true)}>
            <GitBranch size={14} /> Копия
          </button>
        </div>

        {loading && <div className="spinner">Загрузка...</div>}
        {error && <div className="error-text">{error}</div>}

        {!loading && versions.length === 0 && (
          <div className="versions-panel__empty">
            Нет сохранённых версий. Создайте снапшот или рабочую копию.
          </div>
        )}

        <ul className="versions-list">
          {versions.map(v => {
            const typeInfo = TYPE_ICONS[v.type] || TYPE_ICONS.MAIN;
            const Icon = typeInfo.icon;
            return (
              <li key={v.id} className={`versions-list__item versions-list__item--${v.type.toLowerCase()}`}>
                <div className="versions-list__icon" style={{ color: typeInfo.color }}>
                  <Icon size={18} />
                </div>
                <div className="versions-list__info">
                  <div className="versions-list__name">
                    {v.name}
                    {v.state === 'MERGED' && <span className="badge badge--merged">merged</span>}
                  </div>
                  <div className="versions-list__meta">
                    {typeInfo.label} &middot; {formatDate(v.createdAt)}
                    {v.createdBy && <> &middot; {v.createdBy}</>}
                    {v.entityCount > 0 && <> &middot; {v.entityCount} сущностей</>}
                  </div>
                </div>
                <div className="versions-list__actions">
                  {v.type === 'WORKING_COPY' && v.state === 'ACTIVE' && (
                    <>
                      <button
                        className="icon-btn"
                        title="Merge"
                        onClick={() => setMergeVersion(v)}
                      >
                        <GitMerge size={16} />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        title="Отменить"
                        onClick={() => handleDiscard(v.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {v.type === 'SNAPSHOT' && (
                    <button
                      className="icon-btn icon-btn--danger"
                      title="Удалить"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {showSnapshotModal && (
        <CreateSnapshotModal
          treeId={treeId}
          onClose={() => setShowSnapshotModal(false)}
          onCreated={() => { loadVersions(); onRefresh?.(); }}
        />
      )}
      {showWorkingCopyModal && (
        <CreateWorkingCopyModal
          treeId={treeId}
          onClose={() => setShowWorkingCopyModal(false)}
          onCreated={() => { loadVersions(); onRefresh?.(); }}
        />
      )}
      {mergeVersion && (
        <MergeWizard
          treeId={treeId}
          version={mergeVersion}
          onClose={() => setMergeVersion(null)}
          onMerged={() => { loadVersions(); onRefresh?.(); }}
        />
      )}
    </>
  );
}
