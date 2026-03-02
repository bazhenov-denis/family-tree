import { useState, useEffect } from 'react';
import { Edit2, Trash2, Link, X, Plus, Calendar, Images, MessageSquare, Users } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import PersonFormModal from './PersonFormModal.jsx';
import RelationshipModal from './RelationshipModal.jsx';
import EventFormModal from './EventFormModal.jsx';
import MediaGallery from './MediaGallery.jsx';
import EventMediaInline from './EventMediaInline.jsx';
import CommentSection from './CommentSection.jsx';
import { getPerson, deletePerson } from '../../api/persons.js';
import { deleteRelationship } from '../../api/relationships.js';
import { listEvents, deleteEvent } from '../../api/events.js';
import { useToast } from '../../context/ToastContext.jsx';

const GENDER_LABELS = { MALE: 'Мужской', FEMALE: 'Женский', OTHER: 'Другой' };
const REL_LABELS = {
  PARENT: 'Родитель', SPOUSE: 'Супруг/а', GUARDIAN: 'Опекун',
  ADOPTED: 'Усыновлён', CUSTOM: 'Другое',
};
const EVENT_LABELS = {
  BIRTH: 'Рождение', DEATH: 'Смерть', MARRIAGE: 'Бракосочетание',
  DIVORCE: 'Развод', MOVE: 'Переезд', CUSTOM: 'Другое',
};
const EVENT_ICONS = {
  BIRTH: '👶', DEATH: '✝️', MARRIAGE: '💍', DIVORCE: '📋', MOVE: '🏠', CUSTOM: '📌',
};

const TABS = [
  { id: 'overview', label: 'Обзор',       icon: null },
  { id: 'events',   label: 'События',     icon: null },
  { id: 'media',    label: 'Файлы',       icon: null },
  { id: 'rels',     label: 'Связи',       icon: null },
];

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PersonPanel({ treeId, node, graph, canEdit, onClose, onRefresh }) {
  const toast = useToast();
  const [tab, setTab]               = useState('overview');
  const [editing, setEditing]       = useState(false);
  const [editData, setEditData]     = useState(null);
  const [addingRel, setAddingRel]   = useState(false);
  const [deletingRel, setDeletingRel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDelRel, setConfirmDelRel] = useState(null); // rel object
  const [deleting, setDeleting]     = useState(false);

  const [details, setDetails] = useState(null);

  const [events, setEvents]               = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [addingEvent, setAddingEvent]     = useState(false);
  const [editingEvent, setEditingEvent]   = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const myEdges = graph.edges.filter(e => e.from === node.id || e.to === node.id);
  const relationships = myEdges.map(e => {
    const otherId = e.from === node.id ? e.to : e.from;
    const other = graph.nodes.find(n => n.id === otherId);
    return { id: e.id, type: e.type, other };
  });
  const otherPersons = graph.nodes.filter(n => n.id !== node.id);

  const years = [
    node.birthYear,
    node.deathYear ? `† ${node.deathYear}` : null,
  ].filter(Boolean).join(' — ');

  useEffect(() => {
    getPerson(treeId, node.id).then(setDetails).catch(() => {});
    setEventsLoading(true);
    listEvents(treeId, node.id)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [treeId, node.id]);

  async function handleEdit() {
    if (details) { setEditData(details); setEditing(true); return; }
    try {
      const full = await getPerson(treeId, node.id);
      setEditData(full);
      setEditing(true);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePerson(treeId, node.id);
      toast.success('Удалено');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    } finally {
      setConfirmDelete(false);
    }
  }

  async function handleDeleteRel(rel) {
    setDeletingRel(rel.id);
    try {
      await deleteRelationship(treeId, rel.id);
      toast.success('Связь удалена');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingRel(null);
      setConfirmDelRel(null);
    }
  }

  async function handleDeleteEvent(eventId) {
    setDeletingEvent(eventId);
    try {
      await deleteEvent(treeId, eventId);
      toast.success('Событие удалено');
      setEvents(evs => evs.filter(e => e.id !== eventId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingEvent(null);
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="person-panel">

        {/* ── Header ── */}
        <div className="person-panel-header">
          {node.photoUrl && (
            <img src={node.photoUrl} alt="" className="person-panel-photo" />
          )}
          <div className="person-panel-info">
            <span className="person-panel-name">{node.fullName}</span>
            <span className="person-panel-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {node.gender && <span>{GENDER_LABELS[node.gender] || node.gender}</span>}
              {years && <span>{years}</span>}
            </span>
          </div>
          <button className="person-panel-close" onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="person-panel-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`person-panel-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="person-panel-body">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              {details && (details.birthPlace || details.deathPlace || details.bio) ? (
                <div>
                  {(details.birthPlace || details.deathPlace) && (
                    <div className="person-detail-row">
                      {details.birthPlace && (
                        <span className="person-detail-item">
                          <span className="person-detail-icon">📍</span>
                          <span className="person-detail-label">Рождение:</span>
                          {details.birthPlace}
                        </span>
                      )}
                      {details.deathPlace && (
                        <span className="person-detail-item">
                          <span className="person-detail-icon">🏁</span>
                          <span className="person-detail-label">Смерть:</span>
                          {details.deathPlace}
                        </span>
                      )}
                    </div>
                  )}
                  {details.bio && <p className="person-bio">{details.bio}</p>}
                </div>
              ) : !details ? (
                <div style={{ padding: '8px 0' }}><Spinner size={18} /></div>
              ) : (
                <p className="text-muted" style={{ fontSize: 13 }}>Дополнительных данных нет.</p>
              )}

              <div>
                <div className="person-panel-section-title">Комментарии</div>
                <CommentSection treeId={treeId} personId={node.id} />
              </div>
            </>
          )}

          {/* EVENTS */}
          {tab === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="person-panel-section-title" style={{ margin: 0 }}>
                  <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  События
                </span>
                {canEdit && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingEvent(true)}>
                    <Plus size={14} /> Добавить
                  </button>
                )}
              </div>

              {eventsLoading ? (
                <div style={{ padding: '8px 0' }}><Spinner size={18} /></div>
              ) : events.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13 }}>Нет событий</p>
              ) : (
                <ul className="event-list">
                  {events.map(ev => (
                    <li key={ev.id} className="event-item">
                      <span className="event-icon">{EVENT_ICONS[ev.type] || '📌'}</span>
                      <div className="event-info">
                        <span className="event-type">{EVENT_LABELS[ev.type] || ev.type}</span>
                        {ev.title && <span className="event-title">{ev.title}</span>}
                        {(ev.dateFrom || ev.dateTo) && (
                          <span className="event-date">
                            {ev.dateFrom && formatDate(ev.dateFrom)}
                            {ev.dateTo && ev.dateFrom && ' — '}
                            {ev.dateTo && formatDate(ev.dateTo)}
                          </span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="event-actions">
                          <button className="icon-btn" title="Редактировать" onClick={() => setEditingEvent(ev)}>
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Удалить"
                            disabled={deletingEvent === ev.id}
                            onClick={() => handleDeleteEvent(ev.id)}
                          >
                            {deletingEvent === ev.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      )}
                      <EventMediaInline treeId={treeId} eventId={ev.id} canEdit={canEdit} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* MEDIA */}
          {tab === 'media' && (
            <div>
              <div className="person-panel-section-title">
                <Images size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Фотографии
              </div>
              <MediaGallery treeId={treeId} personId={node.id} canEdit={canEdit} />
            </div>
          )}

          {/* RELATIONS */}
          {tab === 'rels' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="person-panel-section-title" style={{ margin: 0 }}>Связи</span>
                {canEdit && otherPersons.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingRel(true)}>
                    <Link size={14} /> Добавить
                  </button>
                )}
              </div>

              {relationships.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13 }}>Нет связей</p>
              ) : (
                <ul className="rel-list">
                  {relationships.map(rel => (
                    <li key={rel.id} className="rel-item">
                      <div className="rel-item-info">
                        <span className="rel-item-name">{rel.other?.fullName || '—'}</span>
                        <span className={`rel-type-badge ${rel.type}`}>
                          {REL_LABELS[rel.type] || rel.type}
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          className="icon-btn danger"
                          title="Удалить связь"
                          disabled={deletingRel === rel.id}
                          onClick={() => setConfirmDelRel(rel)}
                        >
                          {deletingRel === rel.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        {canEdit && (
          <div className="person-panel-footer">
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={handleEdit}>
              <Edit2 size={14} /> Редактировать
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ flex: 1 }}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              {deleting ? <Spinner size={14} /> : <Trash2 size={14} />}
              Удалить
            </button>
          </div>
        )}
      </div>

      {/* ── Sub-modals ── */}
      {editing && editData && (
        <PersonFormModal
          treeId={treeId}
          person={editData}
          onSave={() => { onRefresh(); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
      {addingRel && (
        <RelationshipModal
          treeId={treeId}
          currentPersonId={node.id}
          currentPersonName={node.fullName}
          persons={otherPersons}
          onSave={() => { onRefresh(); setAddingRel(false); }}
          onClose={() => setAddingRel(false)}
        />
      )}
      {(addingEvent || editingEvent) && (
        <EventFormModal
          treeId={treeId}
          personId={node.id}
          event={editingEvent}
          onSave={saved => {
            if (editingEvent) {
              setEvents(evs => evs.map(e => e.id === saved.id ? saved : e));
            } else {
              setEvents(evs => [...evs, saved]);
            }
            setAddingEvent(false);
            setEditingEvent(null);
          }}
          onClose={() => { setAddingEvent(false); setEditingEvent(null); }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Удалить человека"
          message={`Удалить «${node.fullName}»? Все связи тоже будут удалены. Это действие необратимо.`}
          confirmLabel="Удалить"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      {confirmDelRel && (
        <ConfirmModal
          title="Удалить связь"
          message={`Удалить связь с «${confirmDelRel.other?.fullName || '—'}» (${REL_LABELS[confirmDelRel.type] || confirmDelRel.type})?`}
          confirmLabel="Удалить"
          onConfirm={() => handleDeleteRel(confirmDelRel)}
          onCancel={() => setConfirmDelRel(null)}
          loading={deletingRel === confirmDelRel?.id}
        />
      )}
    </>
  );
}
