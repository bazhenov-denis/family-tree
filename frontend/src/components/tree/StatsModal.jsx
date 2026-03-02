import { useMemo } from 'react';
import {
  Users, Heart, GitBranch, Clock, TrendingUp,
  Baby, Layers, Tag,
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { computeStats } from '../../utils/treeStats.js';

const REL_LABELS = {
  PARENT:   'Родитель–ребёнок',
  SPOUSE:   'Супруги',
  ADOPTED:  'Усыновление',
  GUARDIAN: 'Опека',
  CUSTOM:   'Другое',
};

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
      <div className="stat-card-icon"><Icon size={20} /></div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value ?? '—'}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}

function GenderBar({ male, female, other, total }) {
  if (total === 0) return null;
  const mPct = Math.round(male / total * 100);
  const fPct = Math.round(female / total * 100);
  const oPct = 100 - mPct - fPct;
  return (
    <div className="stat-gender">
      <div className="stat-gender-bar">
        {mPct > 0 && <div style={{ width: `${mPct}%`, background: '#3b82f6' }} title={`Мужчины ${mPct}%`} />}
        {fPct > 0 && <div style={{ width: `${fPct}%`, background: '#ec4899' }} title={`Женщины ${fPct}%`} />}
        {oPct > 0 && <div style={{ width: `${oPct}%`, background: '#9ca3af' }} title={`Другие ${oPct}%`} />}
      </div>
      <div className="stat-gender-legend">
        {male > 0   && <span className="stat-gender-dot" style={{ background: '#3b82f6' }}>{male} муж.</span>}
        {female > 0 && <span className="stat-gender-dot" style={{ background: '#ec4899' }}>{female} жен.</span>}
        {other > 0  && <span className="stat-gender-dot" style={{ background: '#9ca3af' }}>{other} др.</span>}
      </div>
    </div>
  );
}

export default function StatsModal({ graph, onClose }) {
  const s = useMemo(() => computeStats(graph), [graph]);

  if (!s) {
    return (
      <Modal title="Статистика дерева" onClose={onClose}>
        <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
          Дерево пусто — добавьте людей, чтобы увидеть статистику.
        </p>
      </Modal>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <Modal title="Статистика дерева" onClose={onClose}>
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Всего людей"
          value={s.totalPersons}
          sub={`${s.living} живых · ${s.deceased} умерших`}
          accent
        />
        <StatCard
          icon={Layers}
          label="Поколений"
          value={s.generations}
        />
        <StatCard
          icon={Clock}
          label="Средняя продолжит. жизни"
          value={s.avgLifespan ? `${s.avgLifespan} лет` : null}
          sub={s.avgLifespan ? `по ${s.deceased} умершим` : 'нет данных'}
        />
        <StatCard
          icon={Baby}
          label="Детей в среднем"
          value={s.avgChildren ? `${s.avgChildren}` : null}
          sub="на одного родителя"
        />
        {s.oldest && (
          <StatCard
            icon={TrendingUp}
            label="Старший живой"
            value={s.oldest.fullName}
            sub={`${s.oldest.birthYear} г.р. · ${currentYear - s.oldest.birthYear} лет`}
          />
        )}
        {s.youngest && s.youngest.id !== s.oldest?.id && (
          <StatCard
            icon={Heart}
            label="Младший живой"
            value={s.youngest.fullName}
            sub={`${s.youngest.birthYear} г.р. · ${currentYear - s.youngest.birthYear} лет`}
          />
        )}
      </div>

      {/* Gender distribution */}
      <div className="stats-section">
        <h4 className="stats-section-title">Распределение по полу</h4>
        <GenderBar male={s.male} female={s.female} other={s.other} total={s.totalPersons} />
      </div>

      {/* Relationship types */}
      {Object.keys(s.relCounts).length > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title">Типы связей</h4>
          <div className="stats-rel-list">
            {Object.entries(s.relCounts).map(([type, count]) => (
              <div key={type} className="stats-rel-item">
                <span className="stats-rel-label">{REL_LABELS[type] ?? type}</span>
                <span className="stats-rel-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top surnames */}
      {s.topSurnames.length > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title"><Tag size={13} style={{ marginRight: 4 }} />Частые фамилии</h4>
          <div className="stats-surname-list">
            {s.topSurnames.map(([name, count]) => (
              <div key={name} className="stats-surname-item">
                <span className="stats-surname-bar"
                  style={{ width: `${Math.round(count / s.totalPersons * 100)}%` }} />
                <span className="stats-surname-name">{name}</span>
                <span className="stats-surname-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
