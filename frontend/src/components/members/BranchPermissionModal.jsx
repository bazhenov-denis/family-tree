import { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getBranches, setBranches } from '../../api/members.js';
import { listPersons } from '../../api/persons.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

const DIRECTION_LABELS = { DESCENDANTS: 'Потомки', ANCESTORS: 'Предки' };

export default function BranchPermissionModal({ treeId, memberId, onClose }) {
  const toast = useToast();
  const [persons, setPersons] = useState([]);
  const [branches, setBranchesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Map()); // personId -> direction

  useEffect(() => {
    Promise.all([
      listPersons(treeId),
      getBranches(treeId, memberId),
    ]).then(([persons, branches]) => {
      setPersons(persons);
      setBranchesState(branches);
      const map = new Map();
      branches.forEach(b => map.set(b.personId, b.direction));
      setSelected(map);
      setLoading(false);
    }).catch(() => {
      toast.error('Ошибка загрузки данных');
      setLoading(false);
    });
  }, [treeId, memberId]);

  async function handleSave() {
    setSaving(true);
    try {
      const requests = Array.from(selected.entries()).map(([personId, direction]) => ({
        personId,
        direction,
      }));
      await setBranches(treeId, memberId, requests);
      toast.success('Ветви сохранены');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function togglePerson(personId) {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.set(personId, 'DESCENDANTS');
      }
      return next;
    });
  }

  function toggleDirection(personId) {
    setSelected(prev => {
      const next = new Map(prev);
      const current = next.get(personId) || 'DESCENDANTS';
      next.set(personId, current === 'DESCENDANTS' ? 'ANCESTORS' : 'DESCENDANTS');
      return next;
    });
  }

  const filtered = persons.filter(p => {
    const name = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <Modal title="Настроить ветви" onClose={onClose} size="large">
      {loading ? (
        <div className="empty-state"><Spinner /></div>
      ) : (
        <div className="branch-modal">
          <div className="branch-search">
            <Search size={16} className="branch-search-icon" />
            <input
              type="text"
              className="form-input branch-search-input"
              placeholder="Поиск человека..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="branch-list">
            {filtered.length === 0 ? (
              <div className="empty-state">Никого не найдено</div>
            ) : (
              filtered.map(person => {
                const isSelected = selected.has(person.id);
                const direction = selected.get(person.id) || 'DESCENDANTS';
                const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Без имени';

                return (
                  <div
                    key={person.id}
                    className={`branch-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePerson(person.id)}
                  >
                    <div className="branch-checkbox">
                      <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <span>&#10003;</span>}
                      </div>
                    </div>
                    <div className="branch-name">{name}</div>
                    {isSelected && (
                      <button
                        className="branch-direction-btn"
                        onClick={e => { e.stopPropagation(); toggleDirection(person.id); }}
                        title={DIRECTION_LABELS[direction]}
                      >
                        {direction === 'DESCENDANTS' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                        <span>{DIRECTION_LABELS[direction]}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="branch-summary">
            Выбрано ветвей: {selected.size}
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size={16} /> : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
