import { useState, useEffect } from 'react';
import { initiateMerge, resolveConflict, completeMerge } from '../../api/versions';

const ENTITY_LABELS = {
  PERSON: 'Персона',
  RELATIONSHIP: 'Связь',
  EVENT: 'Событие',
  MEDIA: 'Медиа',
};

export default function MergeWizard({ treeId, version, onClose, onMerged }) {
  const [step, setStep] = useState('loading'); // loading | conflicts | resolving | done
  const [conflicts, setConflicts] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mergeResult, setMergeResult] = useState(null);

  useEffect(() => {
    loadConflicts();
  }, [treeId, version.id]);

  async function loadConflicts() {
    try {
      const data = await initiateMerge(treeId, version.id);
      setConflicts(data || []);
      setStep((data && data.length > 0) ? 'conflicts' : 'resolving');
    } catch (e) {
      setError(e.message);
      setStep('conflicts');
    }
  }

  function setResolution(entityKey, resolution) {
    setResolutions(prev => ({ ...prev, [entityKey]: resolution }));
  }

  async function handleResolveAll() {
    setLoading(true);
    setError(null);
    try {
      for (const [key, resolution] of Object.entries(resolutions)) {
        const [entityType, entityId] = key.split('|');
        await resolveConflict(treeId, version.id, { entityType, entityId: UUID(entityId), resolution });
      }
      setStep('resolving');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteMerge() {
    setLoading(true);
    setError(null);
    try {
      const result = await completeMerge(treeId, version.id);
      setMergeResult(result);
      setStep('done');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function UUID(str) { return str; }

  const unresolved = conflicts.filter(c => !resolutions[`${c.entityType}|${c.entityId}`]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Слияние: {version.name}</h2>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="error-text">{error}</div>}

        {step === 'loading' && <div className="spinner">Анализ изменений...</div>}

        {step === 'conflicts' && (
          <div>
            <p className="text-muted">
              Найдено конфликтов: {conflicts.length}.
              {conflicts.length === 0 && ' Автоматическое слияние возможно.'}
            </p>

            {conflicts.length > 0 && (
              <table className="merge-conflicts-table">
                <thead>
                  <tr>
                    <th>Сущность</th>
                    <th>Основное дерево</th>
                    <th>Рабочая копия</th>
                    <th>Решение</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map(c => {
                    const key = `${c.entityType}|${c.entityId}`;
                    const resolved = resolutions[key];
                    return (
                      <tr key={key} className={resolved ? 'row-resolved' : ''}>
                        <td>
                          <div className="merge-entity-type">{ENTITY_LABELS[c.entityType] || c.entityType}</div>
                          <div className="merge-entity-name">{c.entityName}</div>
                        </td>
                        <td><pre className="merge-preview">{c.ours}</pre></td>
                        <td><pre className="merge-preview">{c.theirs}</pre></td>
                        <td>
                          <div className="merge-resolution-btns">
                            <button
                              className={`btn btn--sm ${resolved === 'OURS' ? 'btn--primary' : 'btn--outline'}`}
                              onClick={() => setResolution(key, 'OURS')}
                            >
                              Основное
                            </button>
                            <button
                              className={`btn btn--sm ${resolved === 'THEIRS' ? 'btn--primary' : 'btn--outline'}`}
                              onClick={() => setResolution(key, 'THEIRS')}
                            >
                              Копия
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="modal__footer">
              <button className="btn btn--outline" onClick={onClose}>Отмена</button>
              {conflicts.length > 0 ? (
                <button
                  className="btn"
                  disabled={unresolved.length > 0 || loading}
                  onClick={handleResolveAll}
                >
                  {loading ? 'Сохранение...' : `Применить решения (${conflicts.length - unresolved.length}/${conflicts.length})`}
                </button>
              ) : (
                <button className="btn" onClick={() => setStep('resolving')}>
                  Продолжить слияние
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'resolving' && (
          <div>
            <p>Все конфликты разрешены. Готовы завершить слияние?</p>
            <p className="text-muted">
              Изменения из рабочей копии будут применены к основному дереву.
              Рабочая копия будет удалена.
            </p>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={onClose}>Отмена</button>
              <button className="btn" disabled={loading} onClick={handleCompleteMerge}>
                {loading ? 'Слияние...' : 'Завершить слияние'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div>
            <div className="merge-success">
              <h3>Слияние завершено</h3>
              <p className="text-muted">
                Версия «{mergeResult?.name}» успешно объединена с основным деревом.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => { onMerged(); onClose(); }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
