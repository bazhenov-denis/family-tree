import { Link } from 'react-router-dom';
import {
  Trees, Users, GitBranch, Camera, Calendar, Search,
  ArrowRight, Star, Shield, Globe,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <GitBranch size={28} />,
    title: 'Визуальное дерево',
    desc: 'Интерактивный граф с панорамированием, масштабированием и радиальным видом. Связи между поколениями видны с первого взгляда.',
    color: '#16a34a',
  },
  {
    icon: <Users size={28} />,
    title: 'Совместная работа',
    desc: 'Приглашайте родственников как редакторов или читателей. Каждый может добавлять информацию и фотографии.',
    color: '#3b82f6',
  },
  {
    icon: <Camera size={28} />,
    title: 'Фото и медиа',
    desc: 'Загружайте фотографии к карточкам людей. Галерея сохраняет историю в лицах.',
    color: '#ec4899',
  },
  {
    icon: <Calendar size={28} />,
    title: 'События и хронология',
    desc: 'Рождения, свадьбы, переезды — все важные события на одной временной шкале.',
    color: '#f97316',
  },
  {
    icon: <Search size={28} />,
    title: 'Поиск и путь родства',
    desc: 'Мгновенный поиск по имени. Узнайте кем приходятся друг другу любые два человека.',
    color: '#a855f7',
  },
  {
    icon: <Shield size={28} />,
    title: 'Роли и приватность',
    desc: 'Гибкая система ролей: Владелец, Редактор, Читатель, Комментатор. Дерево видят только приглашённые.',
    color: '#0ea5e9',
  },
];

const STEPS = [
  { n: '1', title: 'Создайте дерево', desc: 'Дайте дереву название и добавьте первого человека — себя или прародителя.' },
  { n: '2', title: 'Добавьте людей', desc: 'Заполняйте карточки: имя, даты, место рождения, фото, биография.' },
  { n: '3', title: 'Пригласите семью', desc: 'Отправьте ссылку-приглашение. Вместе дерево растёт быстрее.' },
];

export default function LandingPage() {
  return (
    <div className="landing">

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <Trees size={26} />
            <span>Семейное Древо</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">
            <Star size={13} fill="currentColor" /> Сохраните историю своей семьи
          </div>
          <h1 className="landing-hero-title">
            Ваше семейное<br />
            <span className="landing-hero-accent">древо онлайн</span>
          </h1>
          <p className="landing-hero-sub">
            Создайте интерактивную карту семьи, добавьте фотографии, события и пригласите родственников. Всё в одном месте, навсегда.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Начать бесплатно <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg">
              Уже есть аккаунт
            </Link>
          </div>

          {/* decorative tree illustration */}
          <div className="landing-hero-visual">
            <svg viewBox="0 0 520 220" className="landing-tree-svg" aria-hidden="true">
              {/* generation lines */}
              <line x1="260" y1="48" x2="260" y2="80" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="130" y1="80" x2="390" y2="80" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="130" y1="80" x2="130" y2="112" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="260" y1="80" x2="260" y2="112" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="390" y1="80" x2="390" y2="112" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="65"  y1="148" x2="195" y2="148" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="65"  y1="148" x2="65"  y2="180" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="195" y1="148" x2="195" y2="180" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="325" y1="148" x2="455" y2="148" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="325" y1="148" x2="325" y2="180" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              <line x1="455" y1="148" x2="455" y2="180" stroke="#16a34a" strokeWidth="2" opacity=".4"/>
              {/* nodes */}
              {[
                [260, 32, '#16a34a', 'ВЫ'],
                [130, 112, '#3b82f6', ''],
                [260, 112, '#ec4899', ''],
                [390, 112, '#3b82f6', ''],
                [65,  180, '#3b82f6', ''],
                [195, 180, '#ec4899', ''],
                [325, 180, '#3b82f6', ''],
                [455, 180, '#ec4899', ''],
              ].map(([cx, cy, fill, label], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={label ? 18 : 14} fill={fill} opacity={label ? 1 : 0.7} />
                  {label && <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">{label}</text>}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Всё что нужно для семейной истории</h2>
          <p className="landing-section-sub">Удобный инструмент для сохранения и изучения родословной</p>
          <div className="landing-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ color: f.color, background: f.color + '18' }}>
                  {f.icon}
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Как начать</h2>
          <p className="landing-section-sub">Три простых шага до готового семейного дерева</p>
          <div className="landing-steps">
            {STEPS.map(s => (
              <div key={s.n} className="landing-step">
                <div className="landing-step-num">{s.n}</div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <Globe size={40} strokeWidth={1.2} className="landing-cta-icon" />
          <h2 className="landing-cta-title">Начните сегодня — это бесплатно</h2>
          <p className="landing-cta-sub">Создайте аккаунт за минуту и сразу приступайте к построению дерева</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Создать аккаунт <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-logo">
            <Trees size={18} />
            <span>Семейное Древо</span>
          </div>
          <div className="landing-footer-links">
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
