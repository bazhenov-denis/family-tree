import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ArrowRight, GitMerge, Trash2, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { discardWorkingCopy } from '../../api/versions';

export default function WorkingCopyDetailModal({ treeId, version, onClose, onMerge, onDiscarded }) {
  const [discarding, setDiscarding] = useState(false);
  const navigate = useNavigate();

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  async function handleDiscard() {
    if (!confirm('Удалить рабочую копию? Все изменения будут потеряны.')) return;
    setDiscarding(true);
    try {
      await discardWorkingCopy(treeId, version.id);
      onDiscarded?.();
      onClose();
    } catch (e) {
      alert(e.message);
      setDiscarding(false);
    }
  }

  const isActive = version.state === 'ACTIVE';
  const isMerged = version.state === 'MERGED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wc-modal" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <div className="wc-modal-title-row">
            <GitBranch size={18} color="#3b82f6" />
            <div>
              <div className="modal-title">{version.name}</div>
              {version.description && (
                <div className="wc-modal-desc">{version.description}</div>
              )}
            </div>
          </div>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">

          {/* Merge flow diagram */}
          <div className="wc-flow">
            <div className="wc-flow-node wc-flow-node--source">
              <div className="wc-flow-node-icon"><GitBranch size={16} /></div>
              <div>
                <div className="wc-flow-node-role">Рабочая копия</div>
                <div className="wc-flow-node-name">{version.name}</div>
              </div>
            </div>

            <div className="wc-flow-connector">
              <div className="wc-flow-line" />
              <ArrowRight size={16} className="wc-flow-arrow-icon" />
              <div className="wc-flow-label">слияние</div>
            </div>

            <div className="wc-flow-node wc-flow-node--target">
              <div className="wc-flow-node-icon"><GitBranch size={16} /></div>
              <div>
                <div className="wc-flow-node-role">Основное дерево</div>
                <div className="wc-flow-node-name">main</div>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="wc-info-grid">
            <div className="wc-info-item">
              <div className="wc-info-label">Статус</div>
              <div className="wc-info-value">
                {isActive && (
                  <span className="wc-badge wc-badge--active">
                    <Clock size={11} /> Активна
                  </span>
                )}
                {isMerged && (
                  <span className="wc-badge wc-badge--merged">
                    <CheckCircle2 size={11} /> Слита
                  </span>
                )}
              </div>
            </div>
            <div className="wc-info-item">
              <div className="wc-info-label">Создана</div>
              <div className="wc-info-value">{formatDate(version.createdAt)}</div>
            </div>
            {version.createdBy && (
              <div className="wc-info-item">
                <div className="wc-info-label">Автор</div>
                <div className="wc-info-value">{version.createdBy}</div>
              </div>
            )}
          </div>

          {/* Contextual hint */}
          {isActive && (
            <div className="wc-hint">
              Откройте рабочую копию, внесите изменения, затем вернитесь сюда и выполните слияние — изменения попадут в основное дерево.
            </div>
          )}
          {isMerged && (
            <div className="wc-hint wc-hint--success">
              <CheckCircle2 size={14} /> Эта рабочая копия уже слита с основным деревом.
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onClose}>Закрыть</button>
          {isActive && version.clonedTreeId && (
            <button
              className="btn btn--outline"
              onClick={() => { onClose(); navigate(`/trees/${version.clonedTreeId}`); }}
            >
              <ExternalLink size={14} />
              Открыть копию
            </button>
          )}
          {isActive && (
            <>
              <button
                className="btn btn--danger-outline"
                disabled={discarding}
                onClick={handleDiscard}
              >
                <Trash2 size={14} />
                {discarding ? 'Удаление...' : 'Удалить копию'}
              </button>
              <button className="btn" onClick={() => { onMerge(version); onClose(); }}>
                <GitMerge size={14} />
                Выполнить слияние
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
