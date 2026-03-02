import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, Edit2, Trash2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import PersonFormModal from '../components/person/PersonFormModal.jsx';
import { getTree } from '../api/trees.js';
import { listPersons, deletePerson } from '../api/persons.js';
import { useToast } from '../context/ToastContext.jsx';

const GENDER_LABELS = { MALE: 'Мужской', FEMALE: 'Женский', OTHER: 'Другой' };
const GENDER_COLOR  = { MALE: '#3b82f6', FEMALE: '#ec4899', OTHER: '#6b7280' };

function plural(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} человек`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} человека`;
  return `${n} человек`;
}

export default function PersonsPage() {
  const toast = useToast();
  const { treeId } = useParams();
  const [tree, setTree]       = useState(null);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');
  const [editing, setEditing] = useState(null);   // person object or 'new'
  const [busy, setBusy]       = useState({});

  const canEdit = tree?.role === 'OWNER' || tree?.role === 'EDITOR';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [treeData, personsData] = await Promise.all([getTree(treeId), listPersons(treeId)]);
      setTree(treeData);
      setPersons(personsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [treeId]);

  async function handleDelete(person) {
    if (!confirm(`Удалить «${person.firstName} ${person.lastName || ''}»? Все связи этого человека тоже будут удалены.`)) return;
    setBusy(b => ({ ...b, [person.id]: true }));
    try {
      await deletePerson(treeId, person.id);
      toast.success('Удалено');
      setPersons(ps => ps.filter(p => p.id !== person.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(b => ({ ...b, [person.id]: false }));
    }
  }

  const filtered = persons.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.firstName} ${p.lastName || ''}`.toLowerCase().includes(q);
  });

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <Link to={`/trees/${treeId}`} className="back-link">
            <ArrowLeft size={18} /> {tree?.title || 'Дерево'}
          </Link>
          <h1 className="page-title">Люди</h1>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <UserPlus size={18} /> Добавить
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><Spinner size={32} /></div>
      ) : (
        <div className="section-card">
          <div className="section-header">
            <span>{plural(persons.length)}</span>
            <div className="search-bar">
              <Search size={15} className="search-icon" />
              <input
                className="search-input"
                placeholder="Поиск по имени…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              {search ? 'Никого не найдено' : 'В дереве пока нет людей'}
            </div>
          ) : (
            <ul className="person-list">
              {filtered.map(p => {
                const color = GENDER_COLOR[p.gender] || GENDER_COLOR.OTHER;
                const initial = (p.firstName?.[0] || '?').toUpperCase();
                const years = [p.birthDate?.slice(0, 4), p.deathDate?.slice(0, 4)].filter(Boolean).join(' – ');
                return (
                  <li key={p.id} className="person-item">
                    {p.photoUrl
                      ? <img src={p.photoUrl} alt="" className="person-avatar person-avatar-img" />
                      : <div className="person-avatar" style={{ background: color }}>{initial}</div>
                    }
                    <div className="person-info">
                      <span className="person-name">{p.firstName} {p.lastName || ''}</span>
                      <span className="person-meta">
                        {p.gender && <span className="gender-badge" style={{ color }}>{GENDER_LABELS[p.gender]}</span>}
                        {years && <span>{years}</span>}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="member-actions">
                        <button
                          className="icon-btn"
                          title="Редактировать"
                          disabled={busy[p.id]}
                          onClick={() => setEditing(p)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Удалить"
                          disabled={busy[p.id]}
                          onClick={() => handleDelete(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {editing && (
        <PersonFormModal
          treeId={treeId}
          person={editing === 'new' ? null : editing}
          onSave={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}
    </Layout>
  );
}
