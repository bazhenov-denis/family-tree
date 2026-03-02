import { useState, useEffect } from 'react';
import { Cake, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getUpcomingBirthdays } from '../../api/persons.js';

const MONTHS_RU = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];

function daysLabel(n) {
  if (n === 0) return 'сегодня!';
  if (n === 1) return 'завтра';
  if (n >= 2 && n <= 4) return `через ${n} дня`;
  return `через ${n} дней`;
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function BirthdaysWidget({ treeId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUpcomingBirthdays(treeId, 30)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [treeId]);

  if (!loading && list.length === 0) return null;

  return (
    <div className="bday-widget">
      <div className="bday-widget-header" onClick={() => setOpen(o => !o)}>
        <Cake size={15} />
        <span>Дни рождения</span>
        {!loading && <span className="bday-count">{list.length}</span>}
        <span style={{ marginLeft: 'auto' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {open && (
        <div className="bday-list">
          {loading ? (
            <div className="bday-loading">Загрузка…</div>
          ) : (
            list.map(b => {
              const age = b.nextBirthdayYear - b.birthYear;
              const dateStr = `${b.birthDay} ${MONTHS_RU[b.birthMonth - 1]}`;
              const today = b.daysUntil === 0;
              return (
                <div key={b.id} className={`bday-item${today ? ' bday-item--today' : ''}`}>
                  <div className="bday-avatar">
                    {b.photoUrl
                      ? <img src={b.photoUrl} alt={b.fullName} className="bday-photo" />
                      : <span>{initials(b.fullName)}</span>}
                  </div>
                  <div className="bday-info">
                    <div className="bday-name">{b.fullName}</div>
                    <div className="bday-meta">{dateStr} · {age} лет</div>
                  </div>
                  <div className={`bday-days${today ? ' bday-days--today' : ''}`}>
                    {daysLabel(b.daysUntil)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
