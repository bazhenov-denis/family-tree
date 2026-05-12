import { useState, useEffect } from 'react';
import { GitMerge, GitBranch, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { initiateMerge, resolveConflict, completeMerge } from '../../api/versions';

const ENTITY_LABELS = { PERSON: 'Персона', RELATIONSHIP: 'Связь', EVENT: 'Событие', MEDIA: 'Медиа' };

const STEPS = [
  { key: 'conflicts', label: 'Конфликты' },
  { key: 'resolving', label: 'Подтверждение' },
  { key: 'done',      label: 'Готово' },
];

export default function MergeWizard({ treeId, version, onClose, onMerged }) {
  const [step, setStep] = useState('loading');
  const [conflicts, setConflicts] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mergeResult, setMergeResult] = useState(null);

  useEffect(() => { loadConflicts(); }, [treeId, version.id]);

  async function loadConflicts() {
    try {
      const data = await initiateMerge(treeId, version.id);
      setConflicts(data || []);
      setStep(data && data.length > 0 ? 'conflicts' : 'resolving');
    } catch (e) {
      setError(e.message);
      setStep('conflicts');
    }
  }

  async function handleResolveAll() {
    setLoading(true); setError(null);
    try {
      for (const [key, resolution] of Object.entries(resolutions)) {
        const [entityType, entityId] = key.split('|');
        await resolveConflict(treeId, version.id, { entityType, entityId, resolution });
      }
      setStep('resolving');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCompleteMerge() {
    setLoading(true); setError(null);
    try {
      const result = await completeMerge(treeId, version.id);
      setMergeResult(result);
      setStep('done');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const unresolved = conflicts.filter(c => !resolutions[`${c.entityType}|${c.entityId}`]);
  const activeStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide merge-wiz" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="merge-wiz-header">
          <div className="merge-wiz-title">
            <GitMerge size={20} color="var(--clr-primary)" />
            <div>
              <div className="modal-title">Слияние</div>
              <div className="merge-wiz-route">
                <span className="merge-wiz-from"><GitBranch size={11} /> {version.name}</span>
                <ArrowRight size={12} />
                <span className="merge-wiz-to">Основное дерево</span>
              </div>
            </div>
          </div>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>

        {/* ── Step bar ───────────────────────────────────────── */}
        {step !== 'loading' && (
          <div className="merge-wiz-steps">
            {STEPS.map((s, idx) => {
              const done   = idx < activeStepIdx;
              const active = idx === activeStepIdx;
              return (
                <div key={s.key} className={`mwstep ${active ? 'mwstep--active' : ''} ${done ? 'mwstep--done' : ''}`}>
                  <div className="mwstep-dot">
                    {done ? <CheckCircle2 size={12} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="mwstep-label">{s.label}</span>
                  {idx < STEPS.length - 1 && <div className="mwstep-line" />}
                </div>
              );
            })}
          </div>
        )}

        {error && <div className="error-text" style={{ padding: '0 22px 10px' }}>{error}</div>}

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="merge-wiz-body">

          {step === 'loading' && (
            <div className="merge-wiz-center">Анализ изменений...</div>
          )}

          {step === 'conflicts' && conflicts.length === 0 && (
            <div className="merge-wiz-center merge-wiz-ok">
              <CheckCircle2 size={36} color="var(--clr-primary)" />
              <p>Конфликтов не найдено — слияние можно выполнить без ручного разрешения.</p>
            </div>
          )}

          {step === 'conflicts' && conflicts.length > 0 && (
            <>
              <div className="merge-conflict-banner">
                <AlertTriangle size={15} />
                Найдено конфликтов: <strong>{conflicts.length}</strong> — выберите версию для каждого объекта.
              </div>
              <div className="merge-table-wrap">
                <table className="merge-conflicts-table">
                  <thead>
                    <tr>
                      <th style={{ width: 160 }}>Объект</th>
                      <th>Основное дерево</th>
                      <th>Рабочая копия</th>
                      <th style={{ width: 100 }}>Решение</th>
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
                                onClick={() => setResolutions(p => ({ ...p, [key]: 'OURS' }))}
                              >Основное</button>
                              <button
                                className={`btn btn--sm ${resolved === 'THEIRS' ? 'btn--primary' : 'btn--outline'}`}
                                onClick={() => setResolutions(p => ({ ...p, [key]: 'THEIRS' }))}
                              >Копия</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 'resolving' && (
            <div className="merge-wiz-center merge-wiz-confirm">
              <GitMerge size={40} color="var(--clr-primary)" />
              <h3>Готово к слиянию</h3>
              <p>
                Изменения из&nbsp;<strong>{version.name}</strong> будут применены к основному дереву.
                Рабочая копия будет помечена как&nbsp;слитая.
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="merge-wiz-center merge-wiz-confirm merge-wiz-done">
              <CheckCircle2 size={44} color="var(--clr-primary)" />
              <h3>Слияние завершено</h3>
              <p>Версия «{mergeResult?.name}» успешно объединена с основным деревом.</p>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="modal__footer">
          {step !== 'done' && (
            <button className="btn btn--outline" onClick={onClose}>Отмена</button>
          )}
          {step === 'conflicts' && conflicts.length > 0 && (
            <button
              className="btn"
              disabled={unresolved.length > 0 || loading}
              onClick={handleResolveAll}
            >
              {loading
                ? 'Сохранение...'
                : `Принять решения (${conflicts.length - unresolved.length}/${conflicts.length})`}
            </button>
          )}
          {step === 'conflicts' && conflicts.length === 0 && (
            <button className="btn" onClick={() => setStep('resolving')}>Продолжить</button>
          )}
          {step === 'resolving' && (
            <button className="btn" disabled={loading} onClick={handleCompleteMerge}>
              {loading ? 'Слияние...' : 'Выполнить слияние →'}
            </button>
          )}
          {step === 'done' && (
            <button className="btn" onClick={() => { onMerged(); onClose(); }}>Закрыть</button>
          )}
        </div>
      </div>
    </div>
  );
}
