import { useState, useEffect } from 'react';
import { CalendarDays, User } from 'lucide-react';
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

  useEffect(() => {
    listTreeEvents(treeId)
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

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
  for (const ev of events) {
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

  return (
    <div className="timeline-scroll">
      <div className="timeline-container">
        {years.map(year => (
          <div key={year} className="timeline-year-group">
            <div className="timeline-year-label">{year}</div>
            <div className="timeline-events">
              {byYear[year].map(ev => {
                const meta = TYPE_LABELS[ev.type] || TYPE_LABELS.CUSTOM;
                return (
                  <div key={ev.id} className="timeline-event">
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
        ))}
      </div>
    </div>
  );
}
