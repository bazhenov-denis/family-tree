import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Link, X, Plus, Calendar, Images, Users, UserPlus, Heart, Baby } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import PersonFormModal from './PersonFormModal.jsx';
import RelationshipModal from './RelationshipModal.jsx';
import EventFormModal from './EventFormModal.jsx';
import MediaGallery from './MediaGallery.jsx';
import EventMediaInline from './EventMediaInline.jsx';
import CommentSection from './CommentSection.jsx';
import { getPerson, deletePerson } from '../../api/persons.js';
import { deleteRelationship, createRelationship } from '../../api/relationships.js';
import { listEvents, deleteEvent } from '../../api/events.js';
import { useToast } from '../../context/ToastContext.jsx';

const GENDER_LABELS = { MALE: 'Мужской', FEMALE: 'Женский', OTHER: 'Другой' };
const REL_LABELS = {
  PARENT: 'Родитель', SPOUSE: 'Супруг/а', GUARDIAN: 'Опекун',
  ADOPTED: 'Усыновлён', CUSTOM: 'Другое', CHILD: 'Ребёнок',
};
const EVENT_LABELS = {
  BIRTH: 'Рождение', DEATH: 'Смерть', MARRIAGE: 'Бракосочетание',
  DIVORCE: 'Развод', MOVE: 'Переезд', CUSTOM: 'Другое',
};
const EVENT_ICONS = {
  BIRTH: '👶', DEATH: '✝️', MARRIAGE: '💍', DIVORCE: '📋', MOVE: '🏠', CUSTOM: '📌',
};

const TABS = [
  { id: 'overview', label: 'Обзор',   icon: Users },
  { id: 'events',   label: 'События', icon: Calendar },
  { id: 'media',    label: 'Файлы',   icon: Images },
  { id: 'rels',     label: 'Связи',   icon: Link },
];

// Relation badge labels from viewer perspective
const RELATION_BADGES = {
  PARENT: { label: 'Родитель', icon: Heart, color: '#ec4899', bg: '#fce7f3' },
  SPOUSE: { label: 'Супруг/а', icon: Heart, color: '#ec4899', bg: '#fce7f3' },
  GUARDIAN: { label: 'Опекун', icon: Heart, color: '#065f46', bg: '#d1fae5' },
  ADOPTED: { label: 'Усыновлён', icon: Heart, color: '#92400e', bg: '#fef3c7' },
  CHILD: { label: 'Ребёнок', icon: Baby, color: '#2563eb', bg: '#dbeafe' },
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PersonPanel({ treeId, node, graph, canEdit, onClose, onRefresh }) {
  const toast = useToast();
  const [tab, setTab]               = useState('overview');
  const [prevTab, setPrevTab]       = useState('overview');
  const [tabDirection, setTabDirection] = useState(1); // 1 = forward, -1 = backward
  const [editing, setEditing]       = useState(false);
  const [editData, setEditData]     = useState(null);
  const [addingRel, setAddingRel]   = useState(false);
  const [deletingRel, setDeletingRel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDelRel, setConfirmDelRel] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [quickAddRel, setQuickAddRel] = useState(null); // 'PARENT' | 'CHILD' | 'SPOUSE'

  const [details, setDetails] = useState(null);

  const [events, setEvents]               = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [addingEvent, setAddingEvent]     = useState(false);
  const [editingEvent, setEditingEvent]   = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const bodyRef = useRef(null);

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

  // Relation badge: find how this person relates to the first node in graph (root)
  const relationBadge = (() => {
    if (!graph.nodes.length || node.id === graph.nodes[0]?.id) return null;
    const rootNode = graph.nodes[0];
    // Check if this person is directly connected to root
    const rootEdge = graph.edges.find(e =>
      (e.from === rootNode.id && e.to === node.id) ||
      (e.to === rootNode.id && e.from === node.id)
    );
    if (rootEdge) {
      const type = rootEdge.type;
      // If root is parent of this node, badge = "Ребёнок"
      if ((type === 'PARENT' || type === 'GUARDIAN' || type === 'ADOPTED') && rootEdge.from === rootNode.id) {
        return RELATION_BADGES.CHILD;
      }
      if (type === 'SPOUSE') return RELATION_BADGES.SPOUSE;
      if (rootEdge.from === node.id && (type === 'PARENT' || type === 'GUARDIAN')) {
        return RELATION_BADGES.PARENT;
      }
      return RELATION_BADGES[type] || null;
    }
    return null;
  })();

  // Timeline preview: top 3 most recent events
  const timelinePreview = (() => {
    const sorted = [...events]
      .filter(ev => ev.dateFrom || ev.dateTo)
      .sort((a, b) => new Date(b.dateFrom || b.dateTo || 0) - new Date(a.dateFrom || a.dateTo || 0))
      .slice(0, 3);
    return sorted;
  })();

  useEffect(() => {
    getPerson(treeId, node.id).then(setDetails).catch(() => {});
    setEventsLoading(true);
    listEvents(treeId, node.id)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [treeId, node.id]);

  // Reset to overview tab when person changes
  useEffect(() => {
    setTab('overview');
    setPrevTab('overview');
  }, [node.id]);

  function switchTab(newTab) {
    const tabOrder = TABS.map(t => t.id);
    setTabDirection(tabOrder.indexOf(newTab) > tabOrder.indexOf(tab) ? 1 : -1);
    setPrevTab(tab);
    setTab(newTab);
  }

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

  // Quick add relationship: pre-open relationship modal with type hint
  function handleQuickAdd(type) {
    setQuickAddRel(null);
    setAddingRel(true);
  }

  // Check which relation types already exist for this person
  const existingRelTypes = new Set(relationships.map(r => r.type));

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="person-panel-name">{node.fullName}</span>
              {relationBadge && (
                <span
                  className="person-relation-badge"
                  style={{ color: relationBadge.color, background: relationBadge.bg }}
                >
                  <relationBadge.icon size={10} />
                  {relationBadge.label}
                </span>
              )}
            </div>
            <span className="person-panel-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {node.gender && <span>{GENDER_LABELS[node.gender] || node.gender}</span>}
              {years && <span>{years}</span>}
            </span>
          </div>
          <button className="person-panel-close" onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs with icons ── */}
        <div className="person-panel-tabs">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`person-panel-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => switchTab(t.id)}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Body with tab transitions ── */}
        <div className="person-panel-body" ref={bodyRef}>
          <div
            key={tab}
            className="person-panel-tab-content"
            style={{
              animation: `tab-fade-in .2s ease-out`,
            }}
          >

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

                {/* Mini timeline preview */}
                {events.length > 0 && (
                  <div>
                    <div className="person-panel-section-title">
                      <Calendar size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Последние события
                    </div>
                    <div className="person-timeline-preview">
                      {timelinePreview.map(ev => (
                        <div key={ev.id} className="person-timeline-preview-item">
                          <span className="person-timeline-preview-dot" />
                          <div className="person-timeline-preview-info">
                            <span className="person-timeline-preview-type">
                              {EVENT_ICONS[ev.type] || '📌'} {EVENT_LABELS[ev.type] || ev.type}
                            </span>
                            {(ev.dateFrom || ev.dateTo) && (
                              <span className="person-timeline-preview-date">
                                {ev.dateFrom ? formatShortDate(ev.dateFrom) : formatShortDate(ev.dateTo)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {events.length > 3 && (
                        <button
                          className="person-timeline-preview-more"
                          onClick={() => switchTab('events')}
                        >
                          Все события ({events.length}) →
                        </button>
                      )}
                    </div>
                  </div>
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
                        <div className="event-main">
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
                        </div>
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

                {/* Quick add buttons */}
                {canEdit && (
                  <div className="person-quick-rels">
                    {!existingRelTypes.has('PARENT') && !existingRelTypes.has('GUARDIAN') && (
                      <button className="person-quick-rel-btn" onClick={() => handleQuickAdd('PARENT')}>
                        <Heart size={13} /> Родитель
                      </button>
                    )}
                    {!existingRelTypes.has('SPOUSE') && (
                      <button className="person-quick-rel-btn" onClick={() => handleQuickAdd('SPOUSE')}>
                        <Heart size={13} /> Супруг/а
                      </button>
                    )}
                    <button className="person-quick-rel-btn" onClick={() => handleQuickAdd('CHILD')}>
                      <Baby size={13} /> Ребёнок
                    </button>
                  </div>
                )}

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
          defaultType={quickAddRel}
          onSave={() => { onRefresh(); setAddingRel(false); setQuickAddRel(null); }}
          onClose={() => { setAddingRel(false); setQuickAddRel(null); }}
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
