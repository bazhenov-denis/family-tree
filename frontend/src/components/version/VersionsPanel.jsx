import { useState, useEffect } from 'react';
import { X, Camera, GitBranch, Trash2, GitMerge, Plus, Eye, CheckCircle2 } from 'lucide-react';
import { listVersions, deleteVersion } from '../../api/versions';
import CreateSnapshotModal from './CreateSnapshotModal';
import CreateWorkingCopyModal from './CreateWorkingCopyModal';
import MergeWizard from './MergeWizard';
import SnapshotPreviewModal from './SnapshotPreviewModal';
import WorkingCopyDetailModal from './WorkingCopyDetailModal';

export default function VersionsPanel({ treeId, onClose, onRefresh }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showWCModal, setShowWCModal] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [detailVersion, setDetailVersion] = useState(null);
  const [mergeVersion, setMergeVersion] = useState(null);

  useEffect(() => { loadVersions(); }, [treeId]);

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

  async function handleDeleteSnapshot(id) {
    if (!confirm('Удалить этот снапшот?')) return;
    try {
      await deleteVersion(treeId, id);
      await loadVersions();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  function fmt(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function refresh() { loadVersions(); onRefresh?.(); }

  const snapshots    = versions.filter(v => v.type === 'SNAPSHOT');
  const workingCopies = versions.filter(v => v.type === 'WORKING_COPY');
  const activeWC     = workingCopies.filter(v => v.state === 'ACTIVE').length;

  return (
    <>
      <div className="versions-panel">

        {/* ── Panel header ─────────────────────────────── */}
        <div className="versions-panel__header">
          <h3>Версии дерева</h3>
          <button className="versions-panel__close" onClick={onClose}><X size={20} /></button>
        </div>

        {loading && <div className="vp-loading">Загрузка...</div>}
        {error   && <div className="error-text" style={{ padding: '10px 20px' }}>{error}</div>}

        {!loading && (
          <div className="vp-body">

            {/* ── Snapshots ──────────────────────────────── */}
            <section className="vp-section">
              <div className="vp-section-head">
                <div className="vp-section-title">
                  <Camera size={14} color="#8b5cf6" />
                  Снапшоты
                  {snapshots.length > 0 && (
                    <span className="vp-count">{snapshots.length}</span>
                  )}
                </div>
                <button
                  className="vp-add-btn"
                  title="Создать снапшот"
                  onClick={() => setShowSnapshotModal(true)}
                >
                  <Plus size={13} /> Создать
                </button>
              </div>

              {snapshots.length === 0 ? (
                <p className="vp-empty">
                  Снапшот сохраняет состояние дерева на конкретный момент.
                </p>
              ) : (
                <ul className="vp-list">
                  {snapshots.map(v => (
                    <li key={v.id} className="vp-item">
                      <div className="vp-item-dot" style={{ background: '#8b5cf6' }} />
                      <div className="vp-item-body">
                        <div className="vp-item-name">{v.name}</div>
                        <div className="vp-item-meta">
                          {fmt(v.createdAt)}
                          {v.entityCount > 0 && <> · {v.entityCount} объектов</>}
                        </div>
                      </div>
                      <div className="vp-item-actions">
                        <button
                          className="icon-btn"
                          title="Просмотр снапшота"
                          onClick={() => setPreviewVersion(v)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Удалить"
                          onClick={() => handleDeleteSnapshot(v.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Working copies ─────────────────────────── */}
            <section className="vp-section">
              <div className="vp-section-head">
                <div className="vp-section-title">
                  <GitBranch size={14} color="#3b82f6" />
                  Рабочие копии
                  {activeWC > 0 && <span className="vp-count vp-count--blue">{activeWC}</span>}
                </div>
                <button
                  className="vp-add-btn"
                  title="Создать рабочую копию"
                  onClick={() => setShowWCModal(true)}
                >
                  <Plus size={13} /> Создать
                </button>
              </div>

              {workingCopies.length === 0 ? (
                <p className="vp-empty">
                  Рабочая копия позволяет вносить изменения без затрагивания основного дерева.
                </p>
              ) : (
                <ul className="vp-list">
                  {workingCopies.map(v => (
                    <li
                      key={v.id}
                      className={`vp-item ${v.state === 'MERGED' ? 'vp-item--merged' : ''}`}
                    >
                      <div
                        className="vp-item-dot"
                        style={{ background: v.state === 'MERGED' ? '#94a3b8' : '#3b82f6' }}
                      />
                      <div className="vp-item-body">
                        <div className="vp-item-name">
                          {v.name}
                          {v.state === 'MERGED' && (
                            <span className="vp-badge vp-badge--merged">слита</span>
                          )}
                        </div>
                        <div className="vp-item-meta">
                          {fmt(v.createdAt)}
                          {v.createdBy && <> · {v.createdBy}</>}
                        </div>
                      </div>
                      <div className="vp-item-actions">
                        {v.state === 'ACTIVE' && (
                          <button
                            className="icon-btn"
                            title="Детали и слияние"
                            onClick={() => setDetailVersion(v)}
                          >
                            <GitMerge size={15} />
                          </button>
                        )}
                        {v.state === 'MERGED' && (
                          <CheckCircle2 size={15} color="#16a34a" style={{ margin: '0 4px' }} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        )}
      </div>

      {showSnapshotModal && (
        <CreateSnapshotModal
          treeId={treeId}
          onClose={() => setShowSnapshotModal(false)}
          onCreated={refresh}
        />
      )}
      {showWCModal && (
        <CreateWorkingCopyModal
          treeId={treeId}
          onClose={() => setShowWCModal(false)}
          onCreated={refresh}
        />
      )}
      {previewVersion && (
        <SnapshotPreviewModal
          treeId={treeId}
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRestored={refresh}
        />
      )}
      {detailVersion && (
        <WorkingCopyDetailModal
          treeId={treeId}
          version={detailVersion}
          onClose={() => setDetailVersion(null)}
          onMerge={v => { setDetailVersion(null); setMergeVersion(v); }}
          onDiscarded={refresh}
        />
      )}
      {mergeVersion && (
        <MergeWizard
          treeId={treeId}
          version={mergeVersion}
          onClose={() => setMergeVersion(null)}
          onMerged={refresh}
        />
      )}
    </>
  );
}
