import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { createRelationship } from '../../api/relationships.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Roles encode both the semantic meaning and the correct API direction.
 * PARENT edge semantics: fromPersonId = parent, toPersonId = child.
 * GUARDIAN edge semantics: fromPersonId = guardian, toPersonId = ward.
 * ADOPTED edge semantics: fromPersonId = adoptive parent, toPersonId = adopted child.
 *
 * currentId = person whose panel is open
 * selectedId = person chosen in the dropdown
 */
const ROLES = [
  {
    id: 'PARENT',
    label: 'Родитель',
    emoji: '👨‍👩‍👧',
    desc: (sel, cur) => `${sel} — родитель ${cur}`,
    toRequest: (curId, selId) => ({ fromPersonId: selId, toPersonId: curId, type: 'PARENT' }),
  },
  {
    id: 'CHILD',
    label: 'Ребёнок',
    emoji: '👶',
    desc: (sel, cur) => `${sel} — ребёнок ${cur}`,
    toRequest: (curId, selId) => ({ fromPersonId: curId, toPersonId: selId, type: 'PARENT' }),
  },
  {
    id: 'SPOUSE',
    label: 'Супруг/а',
    emoji: '💍',
    desc: (sel, cur) => `${sel} и ${cur} — супруги`,
    toRequest: (curId, selId) => ({ fromPersonId: curId, toPersonId: selId, type: 'SPOUSE' }),
  },
  {
    id: 'GUARDIAN',
    label: 'Опекун',
    emoji: '🛡️',
    desc: (sel, cur) => `${sel} — опекун ${cur}`,
    toRequest: (curId, selId) => ({ fromPersonId: selId, toPersonId: curId, type: 'GUARDIAN' }),
  },
  {
    id: 'ADOPTED',
    label: 'Усыновлён/а',
    emoji: '🤝',
    desc: (sel, cur) => `${cur} усыновил/а ${sel}`,
    toRequest: (curId, selId) => ({ fromPersonId: curId, toPersonId: selId, type: 'ADOPTED' }),
  },
  {
    id: 'CUSTOM',
    label: 'Другое',
    emoji: '🔗',
    desc: (sel, cur) => `Произвольная связь: ${cur} ↔ ${sel}`,
    toRequest: (curId, selId) => ({ fromPersonId: curId, toPersonId: selId, type: 'CUSTOM' }),
  },
];

export default function RelationshipModal({
  treeId,
  currentPersonId,
  currentPersonName,
  persons,
  onSave,
  onClose,
  defaultType,
}) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [roleId, setRoleId] = useState(defaultType || 'PARENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPerson = persons.find(p => p.id === selectedId);
  const role = ROLES.find(r => r.id === roleId);
  const preview = selectedPerson && role
    ? role.desc(selectedPerson.fullName, currentPersonName)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedId) { setError('Выберите человека'); return; }

    const reqBody = role.toRequest(currentPersonId, selectedId);
    setLoading(true);
    setError('');
    try {
      await createRelationship(treeId, reqBody);
      toast.success('Связь добавлена');
      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Добавить связь" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">

        {/* Person select */}
        <div className="form-group">
          <label className="form-label">Связать с</label>
          <div className="select-wrapper">
            <select
              className="form-input role-select"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">— выберите человека —</option>
              {persons.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Role selection */}
        <div className="form-group">
          <label className="form-label">
            Кем является выбранный для <strong>{currentPersonName}</strong>?
          </label>
          <div className="rel-role-grid">
            {ROLES.map(r => (
              <button
                key={r.id}
                type="button"
                className={`rel-role-option${roleId === r.id ? ' selected' : ''}`}
                onClick={() => setRoleId(r.id)}
              >
                <span className="rel-role-emoji">{r.emoji}</span>
                <span className="rel-role-label">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="rel-role-preview">
            {preview}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
