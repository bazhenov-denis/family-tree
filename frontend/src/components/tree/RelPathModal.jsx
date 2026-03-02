import { useState, useMemo } from 'react';
import { ArrowRight, GitFork } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { findRelationPath, stepLabel, summarizePath } from '../../utils/findRelationPath.js';

function PersonSelect({ label, nodes, value, onChange, excludeId }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— выберите человека —</option>
        {nodes
          .filter(n => n.id !== excludeId)
          .map(n => (
            <option key={n.id} value={n.id}>
              {n.fullName}
              {(n.birthYear || n.deathYear)
                ? ` (${n.birthYear || '?'}${n.deathYear ? ` – ${n.deathYear}` : ''})`
                : ''}
            </option>
          ))}
      </select>
    </div>
  );
}

export default function RelPathModal({ graph, onClose }) {
  const [fromId, setFromId] = useState('');
  const [toId,   setToId]   = useState('');

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const nameOf = id => nodes.find(n => n.id === id)?.fullName ?? id;

  const result = useMemo(() => {
    if (!fromId || !toId) return null;
    return findRelationPath(nodes, edges, fromId, toId);
  }, [fromId, toId, nodes, edges]);

  const summary = useMemo(() => {
    if (!result) return null;
    return summarizePath(result, nameOf);
  }, [result]);

  const notFound = fromId && toId && result === null;
  const isSelf   = fromId && toId && fromId === toId;

  return (
    <Modal title="Путь родства" onClose={onClose}>
      <div className="form">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PersonSelect label="От кого" nodes={nodes} value={fromId} onChange={setFromId} excludeId={toId} />
          </div>
          <div style={{ paddingBottom: 8, color: 'var(--clr-muted)', flexShrink: 0 }}>
            <ArrowRight size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PersonSelect label="До кого" nodes={nodes} value={toId} onChange={setToId} excludeId={fromId} />
          </div>
        </div>

        {/* Summary for short paths */}
        {summary && (
          <div className="rel-path-summary">{summary}</div>
        )}

        {/* Step-by-step path */}
        {result && result.length > 0 && (
          <div className="rel-path-chain">
            {result.map((step, idx) => {
              const fromName = nameOf(step.fromId);
              const toName   = nameOf(step.toId);
              const label    = stepLabel(step.edgeType, step.dir);
              return (
                <div key={idx} className="rel-path-row">
                  {idx === 0 && (
                    <div className="rel-path-node rel-path-node--start">{fromName}</div>
                  )}
                  <div className="rel-path-edge">
                    <span className="rel-path-edge-line" />
                    <span className="rel-path-edge-label">{label}</span>
                    <span className="rel-path-edge-line" />
                  </div>
                  <div className={`rel-path-node${idx === result.length - 1 ? ' rel-path-node--end' : ''}`}>
                    {toName}
                  </div>
                </div>
              );
            })}
            <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
              {result.length === 1 ? '1 шаг' : `${result.length} шага(ов)`} разделяет этих людей
            </p>
          </div>
        )}

        {isSelf && (
          <p className="rel-path-empty">Это один и тот же человек.</p>
        )}

        {notFound && (
          <div className="rel-path-empty">
            <GitFork size={24} style={{ opacity: .4, marginBottom: 6 }} />
            <p>Связи между этими людьми не найдено.</p>
            <p className="text-muted" style={{ fontSize: 12 }}>Возможно, они находятся в разных несвязанных ветвях дерева.</p>
          </div>
        )}

        {!fromId && !toId && (
          <p className="text-muted" style={{ fontSize: 13 }}>
            Выберите двух людей, чтобы узнать, как они связаны.
          </p>
        )}
      </div>
    </Modal>
  );
}
