import { useState, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';

// ── Layout constants ────────────────────────────────────────────
const CR       = 34;   // circle radius
const CW       = CR * 2 + 24;  // card width
const CH       = CR * 2 + 52;  // card height (circle + name + years)
const CX       = CW / 2;       // circle centre X within card
const CY       = CR + 4;       // circle centre Y within card
const NAME_Y   = CR * 2 + 20;
const YEARS_Y  = NAME_Y + 15;
const YEAR_PX  = 80;   // pixels per year on axis
const ROW_H    = CH + 80;  // height per generation row
const AXIS_H   = 44;   // height of year ruler at bottom
const PAD_X    = 48;   // left/right padding
const PAD_Y    = 28;   // top padding
const CONN_CLR = '#a8a29e';

const PALETTE = {
  MALE:   { bg: '#dbeafe', border: '#3b82f6', init: '#2563eb' },
  FEMALE: { bg: '#fce7f3', border: '#ec4899', init: '#db2777' },
  OTHER:  { bg: '#f1f5f9', border: '#94a3b8', init: '#64748b' },
};
const PAL_DEF = PALETTE.OTHER;
const GEN_TYPES = new Set(['PARENT', 'ADOPTED', 'GUARDIAN']);

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '?';
}

function trim9(s) { return s.length > 9 ? s.slice(0, 8) + '\u2026' : s; }

// ── Chronological layout: X by birth year, Y by generation ─────
function computeLayout(nodes, edges) {
  if (!nodes.length) return { pos: new Map(), minYear: 1900, maxYear: 2000, maxGen: 0 };

  // Generation via BFS from roots
  const childrenOf = new Map(nodes.map(n => [n.id, []]));
  const parentsOf  = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    if (GEN_TYPES.has(e.type)) {
      childrenOf.get(e.from)?.push(e.to);
      parentsOf.get(e.to)?.push(e.from);
    }
  }
  const gen = new Map();
  const roots = nodes.filter(n => !parentsOf.get(n.id)?.length).map(n => n.id);
  if (!roots.length) roots.push(nodes[0].id);
  const q = [...roots];
  roots.forEach(id => gen.set(id, 0));
  while (q.length) {
    const id = q.shift();
    const g  = gen.get(id);
    for (const cid of childrenOf.get(id) ?? []) {
      const ng = g + 1;
      if (!gen.has(cid) || gen.get(cid) < ng) { gen.set(cid, ng); q.push(cid); }
    }
  }
  nodes.forEach(n => { if (!gen.has(n.id)) gen.set(n.id, 0); });

  // Year range
  const birthYears = nodes.filter(n => n.birthYear).map(n => Number(n.birthYear));
  const minYear = birthYears.length ? Math.min(...birthYears) - 5 : 1900;
  const maxYear = birthYears.length ? Math.max(...birthYears) + 15 : 2000;
  const maxGen  = Math.max(0, ...gen.values());

  // Assign positions — same (year, gen) get small horizontal offset to avoid full overlap
  const slotMap = new Map(); // `${year}-${g}` → count
  const pos = new Map();
  const noYearList = [];

  for (const n of nodes) {
    const g = gen.get(n.id) ?? 0;
    if (n.birthYear) {
      const key  = `${n.birthYear}-${g}`;
      const slot = slotMap.get(key) ?? 0;
      slotMap.set(key, slot + 1);
      pos.set(n.id, {
        x: (Number(n.birthYear) - minYear) * YEAR_PX + slot * (CW + 10),
        y: g * ROW_H,
      });
    } else {
      noYearList.push({ id: n.id, g });
    }
  }

  // Nodes without birth year go to the far right
  const rightEdge = (maxYear - minYear + 5) * YEAR_PX + CW;
  noYearList.forEach((n, i) => {
    pos.set(n.id, { x: rightEdge + i * (CW + 12), y: n.g * ROW_H });
  });

  return { pos, minYear, maxYear, maxGen };
}

// ── Component ───────────────────────────────────────────────────
export default function TimelineView({ graph, onPersonClick }) {
  const [hoveredId, setHoveredId] = useState(null);

  const layout = useMemo(
    () => (graph?.nodes?.length ? computeLayout(graph.nodes, graph.edges ?? []) : null),
    [graph]
  );

  if (!graph || !layout) {
    return (
      <div className="timeline-empty">
        <CalendarDays size={48} strokeWidth={1.2} style={{ opacity: 0.3 }} />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!graph.nodes.length) {
    return (
      <div className="timeline-empty">
        <CalendarDays size={48} strokeWidth={1.2} style={{ opacity: 0.3 }} />
        <p>Дерево пусто — добавьте людей для отображения хронологии.</p>
      </div>
    );
  }

  const { pos, minYear, maxYear, maxGen } = layout;

  // SVG canvas size
  const noYearExtra = graph.nodes.filter(n => !n.birthYear).length * (CW + 12);
  const svgW = (maxYear - minYear + 10) * YEAR_PX + PAD_X * 2 + noYearExtra + CW;
  const svgH = (maxGen + 1) * ROW_H + AXIS_H + PAD_Y * 2;

  // Year ruler ticks (every 10 years)
  const firstTick = Math.ceil(minYear / 10) * 10;
  const ticks = [];
  for (let y = firstTick; y <= maxYear + 5; y += 10) ticks.push(y);

  // Connection lines (parent→child solid, spouse double-dashed)
  const connLines = [];
  for (const e of (graph.edges ?? [])) {
    if (!GEN_TYPES.has(e.type) && e.type !== 'SPOUSE') continue;
    const pa = pos.get(e.from);
    const pb = pos.get(e.to);
    if (!pa || !pb) continue;
    const x1 = pa.x + PAD_X + CX;
    const y1 = pa.y + PAD_Y + CY;
    const x2 = pb.x + PAD_X + CX;
    const y2 = pb.y + PAD_Y + CY;
    if (e.type === 'SPOUSE') {
      connLines.push(
        <line key={`${e.id}-a`} x1={x1} y1={y1 - 2} x2={x2} y2={y2 - 2}
          stroke={CONN_CLR} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.55} />,
        <line key={`${e.id}-b`} x1={x1} y1={y1 + 2} x2={x2} y2={y2 + 2}
          stroke={CONN_CLR} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.55} />
      );
    } else {
      connLines.push(
        <line key={e.id} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={CONN_CLR} strokeWidth={1.5} opacity={0.5} />
      );
    }
  }

  return (
    <div className="chrono-scroll">
      <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: svgW }}>
        {/* Background */}
        <rect width={svgW} height={svgH} fill="var(--clr-bg, #faf9f7)" />

        {/* Vertical year grid lines */}
        {ticks.map(y => {
          const x = (y - minYear) * YEAR_PX + PAD_X;
          return (
            <line key={y} x1={x} y1={PAD_Y - 10} x2={x} y2={svgH - AXIS_H}
              stroke="var(--clr-border, #e8e4df)" strokeWidth={1} />
          );
        })}

        {/* Connections behind cards */}
        {connLines}

        {/* Person cards */}
        {graph.nodes.map(node => {
          const p = pos.get(node.id);
          if (!p) return null;
          const pal = PALETTE[node.gender] || PAL_DEF;
          const clipId = `chrono-clip-${node.id}`;
          const hovered = hoveredId === node.id;
          const px = p.x + PAD_X;
          const py = p.y + PAD_Y;
          const parts = (node.fullName || '?').split(' ').filter(Boolean);
          const line1 = trim9(parts[0] || '?');
          const line2 = parts.length > 1 ? trim9(parts.slice(1).join(' ')) : null;
          const yearsStr = [
            node.birthYear ? String(node.birthYear) : null,
            node.deathYear ? `\u2020 ${node.deathYear}` : null,
          ].filter(Boolean).join(' \u2013 ');

          return (
            <g key={node.id}
              transform={`translate(${px},${py})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onPersonClick?.(node)}
            >
              <circle cx={CX} cy={CY} r={CR}
                fill={pal.bg} stroke={pal.border}
                strokeWidth={hovered ? 3 : 2}
                filter={hovered ? 'drop-shadow(0 4px 10px rgba(0,0,0,.18))' : undefined}
              />
              <clipPath id={clipId}>
                <circle cx={CX} cy={CY} r={CR - 2} />
              </clipPath>
              {node.photoUrl ? (
                <image href={node.photoUrl}
                  x={CX - CR + 2} y={CY - CR + 2}
                  width={(CR - 2) * 2} height={(CR - 2) * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`}
                />
              ) : (
                <text x={CX} y={CY}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={20} fontWeight={700} fill={pal.init}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {initials(node.fullName)}
                </text>
              )}
              <text x={CX} y={NAME_Y}
                textAnchor="middle" fontSize={11} fontWeight={600} fill="#0f172a"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >{line1}</text>
              {line2 && (
                <text x={CX} y={NAME_Y + 13}
                  textAnchor="middle" fontSize={11} fontWeight={600} fill="#0f172a"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >{line2}</text>
              )}
              {yearsStr && (
                <text x={CX} y={YEARS_Y + (line2 ? 13 : 0)}
                  textAnchor="middle" fontSize={10} fill="#94a3b8"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >{yearsStr}</text>
              )}
            </g>
          );
        })}

        {/* Year axis ruler */}
        <line x1={PAD_X} y1={svgH - AXIS_H} x2={svgW - PAD_X} y2={svgH - AXIS_H}
          stroke="var(--clr-border, #e8e4df)" strokeWidth={1.5} />
        {ticks.map(y => {
          const x = (y - minYear) * YEAR_PX + PAD_X;
          return (
            <g key={`lbl-${y}`}>
              <line x1={x} y1={svgH - AXIS_H} x2={x} y2={svgH - AXIS_H + 6}
                stroke="var(--clr-muted, #78716c)" strokeWidth={1} />
              <text x={x} y={svgH - AXIS_H + 20}
                textAnchor="middle" fontSize={12} fill="var(--clr-muted, #78716c)">
                {y}
              </text>
            </g>
          );
        })}

        {/* Generation labels on the left */}
        {Array.from({ length: maxGen + 1 }, (_, g) => (
          <text key={g}
            x={8} y={g * ROW_H + PAD_Y + CY}
            fontSize={11} fill="var(--clr-muted, #78716c)"
            dominantBaseline="central" fontWeight={600}
          >
            {['I','II','III','IV','V','VI','VII','VIII'][g] ?? `${g + 1}`}
          </text>
        ))}

        {/* «Без даты» label for nodes without birth year */}
        {graph.nodes.some(n => !n.birthYear) && (
          <text
            x={(maxYear - minYear + 7) * YEAR_PX + PAD_X}
            y={svgH - AXIS_H + 20}
            fontSize={11} fill="var(--clr-muted, #78716c)"
          >
            Без даты
          </text>
        )}
      </svg>
    </div>
  );
}
