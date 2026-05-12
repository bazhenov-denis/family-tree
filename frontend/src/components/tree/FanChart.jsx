import { useState, useRef, useEffect, useMemo } from 'react';
import { Trees } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { computeLayout, CARD_H, V_GAP } from '../../utils/genealogyLayout.js';

// ── Constants ───────────────────────────────────────────────────
const CENTER_R    = 70;   // hollow hub radius
const RING_W      = 118;  // radial width of each generation ring
const GAP_A       = 0.026; // gap between adjacent arcs (radians)
const TAU         = 2 * Math.PI;
const START_A     = -Math.PI / 2; // first arc starts at top
const MAX_PHOTO_R = 28;

const PALETTE = {
  MALE:   { fill: '#dbeafe', stroke: '#3b82f6', initFill: '#2563eb' },
  FEMALE: { fill: '#fce7f3', stroke: '#ec4899', initFill: '#db2777' },
  OTHER:  { fill: '#f1f5f9', stroke: '#94a3b8', initFill: '#64748b' },
};
const PAL_DEF = PALETTE.OTHER;

// ── Helpers ─────────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '?';
}

/** SVG path for an annular arc sector centred at the origin. */
function arcPath(r1, r2, a1, a2) {
  const large = (a2 - a1 > Math.PI) ? 1 : 0;
  const pt = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return [
    `M${pt(r2, a1)}`,
    `A${r2} ${r2} 0 ${large} 1 ${pt(r2, a2)}`,
    `L${pt(r1, a2)}`,
    `A${r1} ${r1} 0 ${large} 0 ${pt(r1, a1)}`,
    'Z',
  ].join('');
}

// ── Fan data builder ─────────────────────────────────────────────
function buildFanData(graph) {
  if (!graph || !graph.nodes.length) return null;

  // Re-use the existing layout algorithm to get generation + order
  const layout = computeLayout(graph.nodes, graph.edges);

  // Group nodes by generation (inferred from Y position)
  const genMap = new Map();
  for (const node of graph.nodes) {
    const lp = layout.pos.get(node.id);
    if (!lp) continue;
    const g = Math.round(lp.y / (CARD_H + V_GAP));
    if (!genMap.has(g)) genMap.set(g, []);
    genMap.get(g).push({ node, lx: lp.x });
  }

  // Sort gens ascending; sort persons within each gen by X (barycenter-ordered)
  const gens = [...genMap.keys()].sort((a, b) => a - b);
  gens.forEach(g => genMap.get(g).sort((a, b) => a.lx - b.lx));

  const arcs = [];
  gens.forEach((g, gi) => {
    const persons = genMap.get(g);
    const n = persons.length;
    const r1 = CENTER_R + gi * RING_W;
    const r2 = r1 + RING_W;

    persons.forEach((item, i) => {
      const gapHalf = n === 1 ? 0 : GAP_A / 2;
      const a1    = START_A + (TAU * i / n) + gapHalf;
      const a2    = START_A + (TAU * (i + 1) / n) - gapHalf;
      const midA  = (a1 + a2) / 2;
      const midR  = (r1 + r2) / 2;
      const arcLen = (a2 - a1) * midR;                    // arc length at midRadius
      const photoR = Math.min(
        MAX_PHOTO_R,
        (RING_W - 20) / 2,
        Math.max(0, (arcLen - 12) / 2),
      );

      arcs.push({
        node:    item.node,
        r1, r2, a1, a2,
        midA, midR, arcLen, photoR,
        px: midR * Math.cos(midA),
        py: midR * Math.sin(midA),
      });
    });
  });

  return {
    arcs,
    numGens: gens.length,
    totalR:  CENTER_R + gens.length * RING_W,
  };
}

// ── Component ────────────────────────────────────────────────────
export default function FanChart({ graph, loading, onNodeClick }) {
  const containerRef = useRef(null);
  const [pan,      setPan]      = useState({ x: 0, y: 0 });
  const [zoom,     setZoom]     = useState(1);
  const [dragging, setDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const panRef    = useRef(pan);
  const zoomRef   = useRef(zoom);
  const dragStart = useRef(null);
  const didDrag   = useRef(false);

  // Touch state
  const touchStartPos = useRef(null);
  const pinchStart    = useRef(null);

  useEffect(() => { panRef.current  = pan;  }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const fanData = useMemo(() => buildFanData(graph), [graph]);

  // Centre and fit the chart whenever the graph changes
  useEffect(() => {
    if (!fanData || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const newZoom = Math.min(1, (Math.min(cw, ch) - 80) / (fanData.totalR * 2));
    setZoom(Math.max(0.1, newZoom));
    setPan({ x: cw / 2, y: ch / 2 });
  }, [graph]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom toward cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = e => {
      e.preventDefault();
      const rect  = el.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const oldZ  = zoomRef.current;
      const newZ  = Math.min(3, Math.max(0.1, oldZ * (e.deltaY < 0 ? 1.12 : 0.9)));
      const ratio = newZ / oldZ;
      setZoom(newZ);
      setPan(prev => ({
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [loading, graph]); // eslint-disable-line react-hooks/exhaustive-deps

  function onMouseDown(e) {
    if (e.button !== 0) return;
    setDragging(true);
    didDrag.current   = false;
    dragStart.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
  }
  function onMouseMove(e) {
    if (!dragging || !dragStart.current) return;
    didDrag.current = true;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }
  function onMouseUp() { setDragging(false); }

  // ── Touch handlers ──
  function getTouchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function dampPinchScale(rawScale) {
    return Math.pow(rawScale, 0.45);
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      };
      didDrag.current = false;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      pinchStart.current = {
        dist: getTouchDist(e),
        zoom: zoomRef.current,
        pan: { ...panRef.current },
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 1 && touchStartPos.current) {
      const dx = e.touches[0].clientX - touchStartPos.current.x;
      const dy = e.touches[0].clientY - touchStartPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      setPan({ x: dx, y: dy });
    } else if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const newDist = getTouchDist(e);
      const scale = dampPinchScale(newDist / pinchStart.current.dist);
      const newZoom = Math.min(3, Math.max(0.1, pinchStart.current.zoom * scale));
      const rect = containerRef.current.getBoundingClientRect();
      const cx = pinchStart.current.cx - rect.left;
      const cy = pinchStart.current.cy - rect.top;
      const ratio = newZoom / pinchStart.current.zoom;
      setZoom(newZoom);
      setPan({
        x: cx - (cx - pinchStart.current.pan.x) * ratio,
        y: cy - (cy - pinchStart.current.pan.y) * ratio,
      });
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0) {
      touchStartPos.current = null;
      pinchStart.current = null;
    } else if (e.touches.length === 1 && pinchStart.current) {
      pinchStart.current = null;
      touchStartPos.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      };
    }
  }

  function fitToScreen() {
    if (!fanData || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const newZoom = Math.min(1.5, (Math.min(cw, ch) - 80) / (fanData.totalR * 2));
    setZoom(Math.max(0.1, newZoom));
    setPan({ x: cw / 2, y: ch / 2 });
  }

  // ── Render states ──
  if (loading) {
    return (
      <div className="graph-placeholder">
        <Spinner size={40} />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!graph || !graph.nodes.length) {
    return (
      <div className="graph-empty-state">
        <div className="graph-empty-icon"><Trees size={40} /></div>
        <h3 className="graph-empty-title">Дерево пока пусто</h3>
        <p className="graph-empty-desc">Добавьте первого человека, чтобы начать строить семейное дерево</p>
      </div>
    );
  }

  if (!fanData) return null;

  // Hovered arc rendered last (SVG z-order = last painted = on top)
  const sortedArcs = [...fanData.arcs].sort((a, b) =>
    a.node.id === hoveredId ? 1 : b.node.id === hoveredId ? -1 : 0
  );

  return (
    <div
      ref={containerRef}
      className="graph-container"
      style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <svg className="graph-svg">
        {/* Top-level defs: background pattern */}
        <defs>
          <pattern id="fan-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="#cbd5e1" opacity="0.6" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#fan-dots)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

          {/* Photo clip paths — all in defs, in the local (fan) coordinate space */}
          <defs>
            {fanData.arcs.map(({ node, px, py, photoR }) =>
              photoR >= 8 ? (
                <clipPath key={`fclip-${node.id}`} id={`fclip-${node.id}`}>
                  <circle cx={px} cy={py} r={photoR} />
                </clipPath>
              ) : null
            )}
          </defs>

          {/* Concentric ring guides */}
          {Array.from({ length: fanData.numGens + 1 }, (_, i) => (
            <circle
              key={i}
              cx={0} cy={0}
              r={CENTER_R + i * RING_W}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              opacity={0.6}
            />
          ))}

          {/* Hub badge */}
          <circle cx={0} cy={0} r={CENTER_R - 2} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
          <text x={0} y={-8} textAnchor="middle" fontSize={16} fontWeight={700} fill="#0f172a">
            {graph.nodes.length}
          </text>
          <text x={0} y={9} textAnchor="middle" fontSize={9} fill="#94a3b8" letterSpacing="0.6">
            ЧЕЛОВЕК
          </text>

          {/* Arcs */}
          {sortedArcs.map(({ node, r1, r2, a1, a2, midA, midR, arcLen, photoR, px, py }) => {
            const pal       = PALETTE[node.gender] || PAL_DEF;
            const isHovered = hoveredId === node.id;
            const showPhoto = photoR >= 8;
            const showName  = arcLen >= 46;
            const showYear  = arcLen >= 72 && !!node.birthYear;
            const fs        = Math.min(11, Math.max(7, arcLen / 8));

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => { if (!didDrag.current) onNodeClick?.(node); }}
              >
                <title>
                  {node.fullName}
                  {node.birthYear ? ` (${node.birthYear}${node.deathYear ? ` – ${node.deathYear}` : ''})` : ''}
                </title>

                {/* Sector */}
                <path
                  d={arcPath(r1 + 2, r2 - 2, a1, a2)}
                  fill={pal.fill}
                  stroke={pal.stroke}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  opacity={isHovered ? 1 : 0.88}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${pal.stroke}99)` : 'none',
                    transition: 'opacity .15s',
                  }}
                />

                {/* Photo / initials circle at arc midpoint */}
                {showPhoto && (
                  <>
                    <circle
                      cx={px} cy={py} r={photoR + 2}
                      fill="white"
                      stroke={pal.stroke}
                      strokeWidth={isHovered ? 2 : 1.5}
                    />
                    {node.photoUrl ? (
                      <image
                        href={node.photoUrl}
                        x={px - photoR} y={py - photoR}
                        width={photoR * 2} height={photoR * 2}
                        clipPath={`url(#fclip-${node.id})`}
                        preserveAspectRatio="xMidYMid slice"
                        style={{ pointerEvents: 'none' }}
                      />
                    ) : (
                      <text
                        x={px} y={py}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={Math.max(7, photoR * 0.65)}
                        fontWeight={700}
                        fill={pal.initFill}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {initials(node.fullName)}
                      </text>
                    )}
                  </>
                )}

                {/* First name */}
                {showName && (
                  <text
                    x={px}
                    y={py + (showPhoto ? photoR + 5 : 0)}
                    textAnchor="middle"
                    dominantBaseline={showPhoto ? 'hanging' : 'central'}
                    fontSize={fs}
                    fontWeight={600}
                    fill="#1e293b"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {(node.fullName || '?').split(' ')[0]}
                  </text>
                )}

                {/* Birth year */}
                {showYear && showName && (
                  <text
                    x={px}
                    y={py + (showPhoto ? photoR + 5 + fs + 2 : fs + 3)}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize={Math.max(7, fs - 2)}
                    fill="#94a3b8"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.birthYear}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="graph-controls">
        <button className="btn btn-ghost btn-sm" title="Приблизить"
          onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="100%"
          onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="Отдалить"
          onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>−</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="По размеру"
          onClick={fitToScreen}>⊡</button>
      </div>
    </div>
  );
}
