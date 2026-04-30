import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, User, Filter } from 'lucide-react';
import { listTreeEvents } from '../../api/events.js';
import Spinner from '../ui/Spinner.jsx';

const TYPE_LABELS = {
  BIRTH:    { label: 'Рождение',  color: '#22c55e' },
  DEATH:    { label: 'Смерть',    color: '#64748b' },
  MARRIAGE: { label: 'Свадьба',   color: '#ec4899' },
  DIVORCE:  { label: 'Развод',    color: '#f97316' },
  MOVE:     { label: 'Переезд',   color: '#3b82f6' },
  CUSTOM:   { label: 'Событие',   color: '#a855f7' },
};

function getYear(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

export default function TimelineView({ treeId, onPersonClick, graph }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTypes, setActiveTypes] = useState(new Set(Object.keys(TYPE_LABELS)));
  const [yearRange, setYearRange] = useState(null); // { min, max }

  useEffect(() => {
    listTreeEvents(treeId)
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

  // Compute year range from events
  useEffect(() => {
    if (!events.length) return;
    const years = events
      .map(ev => getYear(ev.dateFrom))
      .filter(Boolean)
      .map(Number);
    if (years.length) {
      setYearRange({ min: Math.min(...years), max: Math.max(...years) });
    }
  }, [events]);

  // Toggle event type filter
  function toggleType(type) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  function toggleAll() {
    setActiveTypes(prev =>
      prev.size === Object.keys(TYPE_LABELS).length
        ? new Set()
        : new Set(Object.keys(TYPE_LABELS))
    );
  }

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => activeTypes.has(ev.type));
  }, [events, activeTypes]);

  if (loading) return <div className="timeline-empty"><Spinner size={28} /></div>;
  if (error)   return <div className="timeline-empty" style={{ color: 'var(--clr-danger)' }}>{error}</div>;
  if (!events.length) return (
    <div className="timeline-empty">
      <CalendarDays size={48} strokeWidth={1.2} style={{ opacity: 0.3 }} />
      <p>Нет событий. Добавьте события к людям в дереве.</p>
    </div>
  );

  // Group by year
  const byYear = {};
  for (const ev of filteredEvents) {
    const year = getYear(ev.dateFrom) ?? '—';
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(ev);
  }

  const years = Object.keys(byYear).sort((a, b) => {
    if (a === '—') return 1;
    if (b === '—') return -1;
    return Number(a) - Number(b);
  });

  function handlePersonClick(personId) {
    if (!onPersonClick || !graph) return;
    const node = graph.nodes.find(n => n.id === personId);
    if (node) onPersonClick(node);
  }

  const activeCount = activeTypes.size;
  const totalCount = Object.keys(TYPE_LABELS).length;

  return (
    <div className="timeline-scroll">
      <div className="timeline-container">

        {/* Filter bar */}
        <div className="timeline-filter-bar">
          <button
            className="timeline-filter-toggle"
            onClick={() => setFilterOpen(o => !o)}
          >
            <Filter size={13} />
            Фильтр
            {activeCount < totalCount && (
              <span className="timeline-filter-count">{activeCount}/{totalCount}</span>
            )}
          </button>
          {filterOpen && (
            <div className="timeline-filter-dropdown">
              <button className="timeline-filter-all-btn" onClick={toggleAll}>
                {activeCount === totalCount ? 'Сбросить все' : 'Выбрать все'}
              </button>
              {Object.entries(TYPE_LABELS).map(([type, meta]) => (
                <label
                  key={type}
                  className={`timeline-filter-option${activeTypes.has(type) ? ' active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={activeTypes.has(type)}
                    onChange={() => toggleType(type)}
                  />
                  <span className="timeline-filter-dot" style={{ background: meta.color }} />
                  {meta.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {years.length === 0 ? (
          <div className="timeline-empty">
            <p>Нет событий выбранных типов.</p>
          </div>
        ) : (
          years.map((year, yi) => (
            <div key={year} className="timeline-year-group">
              <div className="timeline-year-label">{year}</div>
              <div className="timeline-events">
                {byYear[year].map((ev, ei) => {
                  const meta = TYPE_LABELS[ev.type] || TYPE_LABELS.CUSTOM;
                  return (
                    <div
                      key={ev.id}
                      className="timeline-event"
                      style={{
                        animation: `timeline-fade-in .3s ease-out ${ei * 0.06}s both`,
                      }}
                    >
                      <div className="timeline-dot" style={{ background: meta.color }} />
                      <div className="timeline-event-body">
                        <div className="timeline-event-header">
                          <span className="timeline-type-badge" style={{ background: meta.color + '22', color: meta.color }}>
                            {meta.label}
                          </span>
                          {ev.dateFrom && (
                            <span className="timeline-date">
                              {new Date(ev.dateFrom).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {ev.title && <div className="timeline-event-title">{ev.title}</div>}
                        <button
                          className="timeline-person-link"
                          onClick={() => handlePersonClick(ev.personId)}
                        >
                          <User size={12} />
                          {ev.personName}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
