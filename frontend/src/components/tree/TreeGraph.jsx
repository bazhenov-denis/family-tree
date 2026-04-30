import { useState, useRef, useEffect } from 'react';
import { Trees, UserPlus } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { computeLayout, CARD_W, CARD_H, V_GAP } from '../../utils/genealogyLayout.js';

const CIRCLE_R    = 50;   // circle radius
const CIRCLE_CX   = CARD_W / 2;  // 77.5
const CIRCLE_CY   = 50;   // circle center Y
const NAME_Y      = 115;  // first name line
const YEARS_Y     = 148;  // years text
const COLLAPSE_Y  = 160;  // collapse button Y
const MM_W        = 180;
const MM_H        = 108;

const CONN_CLR    = '#a8a29e';

const PALETTE = {
  MALE:   { bg: '#dbeafe', border: '#3b82f6', init: '#2563eb' },
  FEMALE: { bg: '#fce7f3', border: '#ec4899', init: '#db2777' },
  OTHER:  { bg: '#f1f5f9', border: '#94a3b8', init: '#64748b' },
};
const PAL_DEFAULT = PALETTE.OTHER;

const GEN_TYPES = new Set(['PARENT', 'ADOPTED', 'GUARDIAN']);

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';
}

// ── Build connection data ───────────────────────────────────────
function buildConnections(edges) {
  // spouse pairs (deduplicated)
  const spousePairs = [];
  const spouseSeen  = new Set();
  const spouseOf    = new Map();

  for (const e of edges) {
    if (e.type === 'SPOUSE') {
      spouseOf.set(e.from, e.to);
      spouseOf.set(e.to, e.from);
      const key = [e.from, e.to].sort().join('|');
      if (!spouseSeen.has(key)) {
        spouseSeen.add(key);
        spousePairs.push({ id: e.id, a: e.from, b: e.to });
      }
    }
  }

  // child → parents mapping
  const childToParents = new Map();
  for (const e of edges) {
    if (GEN_TYPES.has(e.type)) {
      if (!childToParents.has(e.to)) childToParents.set(e.to, []);
      childToParents.get(e.to).push(e.from);
    }
  }

  // group children by their parent-set signature
  const familyMap = new Map();
  for (const [childId, parents] of childToParents) {
    const key = [...parents].sort().join('|');
    if (!familyMap.has(key)) familyMap.set(key, { parents: [...parents].sort(), children: [] });
    familyMap.get(key).children.push(childId);
  }

  // custom edges
  const customEdges = edges.filter(e => e.type === 'CUSTOM');

  return { spousePairs, families: [...familyMap.values()], customEdges };
}

// ── Connection lines ────────────────────────────────────────────
// strokeWidth is divided by zoom so lines stay visible at any zoom level
function Connections({ spousePairs, families, customEdges, pos, animated, zoom }) {
  const sw = Math.max(1, 2 / zoom); // keep lines ≥1px on screen
  const lp = { stroke: CONN_CLR, strokeWidth: sw, strokeLinecap: 'round' };
  const lines = [];

  // Spouse: horizontal line at card vertical-center, drawn center-to-center.
  for (const { id, a, b } of spousePairs) {
    const pa = pos.get(a);
    const pb = pos.get(b);
    if (!pa || !pb) continue;
    const y  = pa.y + CARD_H / 2;
    const ax = pa.x + CARD_W / 2;
    const bx = pb.x + CARD_W / 2;
    lines.push(
      <line key={`sp-${id}`}
        x1={Math.min(ax, bx)} y1={y}
        x2={Math.max(ax, bx)} y2={y}
        {...lp}
        className={animated ? 'graph-connection-animated' : undefined}
      />
    );
  }

  // Parent→children: orthogonal elbow + bar + stubs
  for (const { parents, children } of families) {
    const ppos = parents.map(id => pos.get(id)).filter(Boolean);
    const cpos = children.map(id => pos.get(id)).filter(Boolean);
    if (!ppos.length || !cpos.length) continue;

    const trunkX = ppos.reduce((s, p) => s + p.x + CARD_W / 2, 0) / ppos.length;
    const trunkTopY    = Math.min(...ppos.map(p => p.y)) + CARD_H / 2;
    const parentBottom = Math.max(...ppos.map(p => p.y + CARD_H));
    const childTop     = Math.min(...cpos.map(p => p.y));
    const midY         = (parentBottom + childTop) / 2;

    lines.push(<line key={`tr-${parents.join('-')}`} x1={trunkX} y1={trunkTopY} x2={trunkX} y2={midY} {...lp} className={animated ? 'graph-connection-animated' : undefined} />);

    const childXs = children.map(id => { const p = pos.get(id); return p ? p.x + CARD_W / 2 : null; }).filter(x => x !== null);
    const barLeft  = Math.min(trunkX, ...childXs);
    const barRight = Math.max(trunkX, ...childXs);

    if (barRight > barLeft + 1) {
      lines.push(<line key={`bar-${parents.join('-')}`} x1={barLeft} y1={midY} x2={barRight} y2={midY} {...lp} className={animated ? 'graph-connection-animated' : undefined} />);
    }

    for (const cid of children) {
      const cp = pos.get(cid);
      if (!cp) continue;
      const cx = cp.x + CARD_W / 2;
      lines.push(<line key={`stub-${cid}`} x1={cx} y1={midY} x2={cx} y2={cp.y} {...lp} className={animated ? 'graph-connection-animated' : undefined} />);
    }
  }

  // Custom: dashed line between card centres
  const csw = Math.max(1, 1.5 / zoom);
  for (const e of customEdges) {
    const pa = pos.get(e.from);
    const pb = pos.get(e.to);
    if (!pa || !pb) continue;
    lines.push(
      <line key={`cu-${e.id}`}
        x1={pa.x + CARD_W / 2} y1={pa.y + CARD_H / 2}
        x2={pb.x + CARD_W / 2} y2={pb.y + CARD_H / 2}
        stroke={CONN_CLR} strokeWidth={csw} strokeDasharray={`${5 / zoom} ${5 / zoom}`}
        className={animated ? 'graph-connection-animated' : undefined}
      />
    );
  }

  return <g>{lines}</g>;
}

// ── Quick-add button (single, below card) ───────────────────────
function QABtn({ x, y, borderColor, onClick }) {
  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onClick(); }}
    >
      <title>Добавить родственника</title>
      <circle r={18} fill="white" stroke={borderColor} strokeWidth={2} />
      <text
        textAnchor="middle" dominantBaseline="central"
        fontSize={26} fontWeight={500} fill={borderColor}
        style={{ pointerEvents: 'none' }}
      >
        +
      </text>
    </g>
  );
}

// ── Collapse toggle button ───────────────────────────────────────
function CollapseBtn({ cx, y, collapsed, count, onClick }) {
  return (
    <g
      transform={`translate(${cx},${y})`}
      style={{ cursor: 'pointer' }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onClick(); }}
    >
      <title>{collapsed ? `Развернуть (скрыто: ${count})` : 'Свернуть ветвь'}</title>
      <circle r={11} fill={collapsed ? '#6366f1' : 'white'} stroke={collapsed ? '#6366f1' : '#94a3b8'} strokeWidth={1.5} />
      <text
        textAnchor="middle" dominantBaseline="central"
        fontSize={collapsed ? 11 : 15} fontWeight={700}
        fill={collapsed ? 'white' : '#94a3b8'}
        style={{ pointerEvents: 'none' }}
      >
        {collapsed ? (count > 9 ? '9+' : String(count || '+')) : '▾'}
      </text>
    </g>
  );
}

// ── Person card (circular) ──────────────────────────────────────
// Bounding box: (p.x, p.y) → (p.x+CARD_W, p.y+CARD_H)
// Circle centered at (CIRCLE_CX, CIRCLE_CY) with radius CIRCLE_R
// Name below circle, years below name, collapse button at bottom
function PersonCard({ node, p, isHovered, isSelected, canEdit, hasChildren, isCollapsed, descendantCount, onHover, onLeave, onClick, onQuickAdd, onToggleCollapse, didDrag }) {
  const pal      = PALETTE[node.gender] || PAL_DEFAULT;
  const clipId   = `clip-${node.id}`;
  const shadowId = isSelected ? 'f-sel' : isHovered ? 'f-hov' : 'f-nor';
  const scale    = isHovered ? 1.06 : 1;

  // Split name across up to 2 lines
  const parts  = (node.fullName || '?').split(' ').filter(Boolean);
  const line1  = parts[0] || '?';
  const line2  = parts.slice(1).join(' ') || null;
  const trim12 = s => s.length > 11 ? s.slice(0, 10) + '…' : s;

  const years = [
    node.birthYear ? String(node.birthYear)  : null,
    node.deathYear ? `† ${node.deathYear}`   : null,
  ].filter(Boolean).join(' – ');

  const textStyle = { fontFamily: 'inherit', pointerEvents: 'none', userSelect: 'none' };

  return (
    <g
      transform={`translate(${p.x},${p.y}) scale(${scale})`}
      style={{
        cursor: 'pointer',
        transition: 'transform .2s cubic-bezier(.4,0,.2,1)',
        transformOrigin: `${CIRCLE_CX}px ${CIRCLE_CY}px`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => { if (!didDrag.current) onClick(node); }}
    >
      {/* Circle with shadow */}
      <circle
        cx={CIRCLE_CX} cy={CIRCLE_CY} r={CIRCLE_R}
        fill={pal.bg}
        stroke={pal.border}
        strokeWidth={isSelected ? 3 : 2}
        filter={`url(#${shadowId})`}
      />

      {/* Photo clip */}
      <clipPath id={clipId}>
        <circle cx={CIRCLE_CX} cy={CIRCLE_CY} r={CIRCLE_R - 3} />
      </clipPath>

      {node.photoUrl ? (
        <image
          href={node.photoUrl}
          x={CIRCLE_CX - (CIRCLE_R - 3)} y={CIRCLE_CY - (CIRCLE_R - 3)}
          width={(CIRCLE_R - 3) * 2} height={(CIRCLE_R - 3) * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <text
          x={CIRCLE_CX} y={CIRCLE_CY}
          textAnchor="middle" dominantBaseline="central"
          fontSize={28} fontWeight={700} fill={pal.init}
          style={textStyle}
        >
          {initials(node.fullName)}
        </text>
      )}

      {/* Name — centred, up to 2 lines */}
      <text x={CIRCLE_CX} y={NAME_Y} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0f172a" style={textStyle}>
        {trim12(line1)}
      </text>
      {line2 && (
        <text x={CIRCLE_CX} y={NAME_Y + 17} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0f172a" style={textStyle}>
          {trim12(line2)}
        </text>
      )}

      {/* Years */}
      {years && (
        <text x={CIRCLE_CX} y={YEARS_Y} textAnchor="middle" fontSize={11} fill="#94a3b8" style={textStyle}>
          {years}
        </text>
      )}

      {/* Collapse toggle */}
      {hasChildren && (
        <CollapseBtn
          cx={CIRCLE_CX}
          y={COLLAPSE_Y}
          collapsed={isCollapsed}
          count={descendantCount}
          onClick={() => onToggleCollapse(node.id)}
        />
      )}

      {/* Mobile quick-add button (top-right of circle) — visible only on touch devices via CSS */}
      {canEdit && (
        <g
          className="card-mobile-add"
          transform={`translate(${CIRCLE_CX + CIRCLE_R - 6}, ${CIRCLE_CY - CIRCLE_R + 6})`}
          style={{ cursor: 'pointer' }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onQuickAdd(node); }}
        >
          <circle r={11} fill="white" stroke={pal.border} strokeWidth={1.5} opacity={0.9} />
          <text
            textAnchor="middle" dominantBaseline="central"
            fontSize={18} fontWeight={500} fill={pal.border}
            style={{ pointerEvents: 'none' }}
          >
            +
          </text>
        </g>
      )}

      {/* Hover: quick-add button below the card */}
      {isHovered && canEdit && (
        <QABtn
          x={CIRCLE_CX}
          y={hasChildren ? COLLAPSE_Y + 30 : YEARS_Y + 28}
          borderColor={pal.border}
          onClick={() => onQuickAdd(node)}
        />
      )}
    </g>
  );
}

// ── Minimap ─────────────────────────────────────────────────────
function Minimap({ layout, pan, zoom, cw, ch }) {
  if (!layout || !layout.pos.size) return null;

  const scaleX  = MM_W / layout.width;
  const scaleY  = MM_H / layout.height;
  const mmScale = Math.min(scaleX, scaleY) * 0.9;
  const offX    = (MM_W - layout.width  * mmScale) / 2;
  const offY    = (MM_H - layout.height * mmScale) / 2;

  const vpX = (-pan.x / zoom) * mmScale + offX;
  const vpY = (-pan.y / zoom) * mmScale + offY;
  const vpW = (cw / zoom) * mmScale;
  const vpH = (ch / zoom) * mmScale;

  return (
    <div className="graph-minimap">
      <svg width={MM_W} height={MM_H}>
        <defs>
          <linearGradient id="mm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf9f7" />
            <stop offset="100%" stopColor="#f5f3f0" />
          </linearGradient>
        </defs>
        <rect width={MM_W} height={MM_H} fill="url(#mm-bg)" rx={8} />

        <g transform={`translate(${offX},${offY}) scale(${mmScale})`}>
          {[...layout.pos.entries()].map(([id, p]) => (
            <rect key={id} x={p.x} y={p.y} width={CARD_W} height={CARD_H} rx={6} fill="#a8a29e" opacity={0.35} />
          ))}
        </g>

        <rect
          x={Math.max(0, vpX)} y={Math.max(0, vpY)}
          width={Math.min(MM_W - Math.max(0, vpX), vpW)}
          height={Math.min(MM_H - Math.max(0, vpY), vpH)}
          fill="#16a34a" fillOpacity={0.06}
          stroke="#16a34a" strokeWidth={1.5} strokeOpacity={0.4}
          rx={3}
        />
      </svg>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function TreeGraph({ graph, loading, onNodeClick, onQuickAdd, canEdit, selectedNodeId, svgRef, flyToTarget, onAddFirst }) {
  const containerRef = useRef(null);
  const [pan,  setPan]  = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  const panRef   = useRef(pan);
  const zoomRef  = useRef(zoom);
  const dragStart = useRef(null);
  const didDrag   = useRef(false);

  // Touch state
  const touchStartPos = useRef(null);   // { x, y } for single-finger pan
  const pinchStart    = useRef(null);   // { dist, zoom, pan } for pinch-to-zoom

  const [collapsedIds, setCollapsedIds] = useState(new Set());

  useEffect(() => { panRef.current  = pan;  }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  // Reset collapsed state when graph is refreshed
  useEffect(() => { setCollapsedIds(new Set()); }, [graph]);

  // Nodes that have at least one child via generational edges
  const parentIds = new Set();
  if (graph) {
    for (const e of graph.edges) {
      if (GEN_TYPES.has(e.type)) parentIds.add(e.from);
    }
  }

  // Compute all descendants of a set of collapsed node IDs
  function computeHidden(collapsedSet) {
    if (!graph || !collapsedSet.size) return new Set();
    const hidden = new Set();
    const queue  = [...collapsedSet];
    while (queue.length) {
      const pid = queue.shift();
      for (const e of graph.edges) {
        if (GEN_TYPES.has(e.type) && e.from === pid && !hidden.has(e.to)) {
          hidden.add(e.to);
          queue.push(e.to);
        }
        // Also hide spouses of hidden nodes
        if (e.type === 'SPOUSE' && hidden.has(pid) && !hidden.has(e.to)) {
          hidden.add(e.to);
        }
      }
    }
    return hidden;
  }

  function countDescendants(nodeId) {
    return computeHidden(new Set([nodeId])).size;
  }

  function toggleCollapse(nodeId) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
      return next;
    });
  }

  const hiddenIds    = computeHidden(collapsedIds);
  const visibleNodes = graph ? graph.nodes.filter(n => !hiddenIds.has(n.id)) : [];
  const visibleEdges = graph ? graph.edges.filter(e => !hiddenIds.has(e.from) && !hiddenIds.has(e.to)) : [];

  // Compute layout from visible nodes only
  const layout = visibleNodes.length
    ? computeLayout(visibleNodes, visibleEdges)
    : null;

  const conn = visibleEdges.length
    ? buildConnections(visibleEdges)
    : { spousePairs: [], families: [], customEdges: [] };

  // Actual pixel bounds of the content (no artificial 800×400 minimum)
  function contentBounds() {
    if (!layout || !layout.pos.size) return { w: CARD_W, h: CARD_H };
    let maxX = 0, maxY = 0;
    for (const p of layout.pos.values()) {
      if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
      if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
    }
    return { w: maxX, h: maxY };
  }

  // Fit to screen when graph changes
  useEffect(() => {
    if (!layout || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const { w: contentW, h: contentH } = contentBounds();
    const newZoom = Math.min(1, (cw - 80) / contentW, (ch - 80) / contentH);
    const newPan  = {
      x: (cw - contentW * newZoom) / 2,
      y: Math.max(40, (ch - contentH * newZoom) / 2),
    };
    setZoom(newZoom);
    setPan(newPan);
  }, [graph]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly-to: pan+zoom to centre a node when flyToTarget changes
  useEffect(() => {
    if (!flyToTarget?.nodeId || !layout || !containerRef.current) return;
    const p = layout.pos.get(flyToTarget.nodeId);
    if (!p) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const targetZoom = 1.2;
    setZoom(targetZoom);
    setPan({
      x: cw / 2 - (p.x + CARD_W / 2) * targetZoom,
      y: ch / 2 - (p.y + CARD_H / 2) * targetZoom,
    });
  }, [flyToTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom toward cursor — native listener on SVG element
  useEffect(() => {
    const el = containerRef.current;
    const svg = svgRef?.current;
    if (!el || !svg) return;

    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const oldZoom = zoomRef.current;
      const factor  = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.min(5, Math.max(0.01, oldZoom * factor));
      const ratio   = newZoom / oldZoom;
      setZoom(newZoom);
      setPan(prev => ({
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      }));
    };

    // Listen on SVG with passive:false — this is the key element that receives wheel events
    svg.addEventListener('wheel', handler, { passive: false });
    // Also on container as fallback
    el.addEventListener('wheel', handler, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handler);
      el.removeEventListener('wheel', handler);
    };
  }, []);

  function onMouseDown(e) {
    if (e.button !== 0) return;
    setDragging(true);
    didDrag.current  = false;
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

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      // Single finger: pan
      touchStartPos.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      };
      didDrag.current = false;
    } else if (e.touches.length === 2) {
      // Two fingers: pinch-to-zoom
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
      // Pan
      const dx = e.touches[0].clientX - touchStartPos.current.x;
      const dy = e.touches[0].clientY - touchStartPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDrag.current = true;
      }
      setPan({ x: dx, y: dy });
    } else if (e.touches.length === 2 && pinchStart.current) {
      // Pinch-to-zoom
      e.preventDefault();
      const newDist = getTouchDist(e);
      const scale = newDist / pinchStart.current.dist;
      const newZoom = Math.min(2.5, Math.max(0.15, pinchStart.current.zoom * scale));

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
    } else if (e.touches.length === 1) {
      // Went from 2 fingers to 1 — reset pinch state, start pan
      if (pinchStart.current) {
        pinchStart.current = null;
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }

  function fitToScreen() {
    if (!layout || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const { w: contentW, h: contentH } = contentBounds();
    const newZoom = Math.min(1.5, (cw - 80) / contentW, (ch - 80) / contentH);
    setZoom(newZoom);
    setPan({
      x: (cw - contentW * newZoom) / 2,
      y: Math.max(40, (ch - contentH * newZoom) / 2),
    });
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

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="graph-empty-state">
        <div className="graph-empty-icon">
          <Trees size={40} />
        </div>
        <h3 className="graph-empty-title">Дерево пока пусто</h3>
        <p className="graph-empty-desc">
          Добавьте первого человека, чтобы начать строить семейное дерево
        </p>
        {onAddFirst && (
          <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={onAddFirst}>
            <UserPlus size={16} /> Добавить человека
          </button>
        )}
      </div>
    );
  }

  // Hovered node rendered last (on top in SVG z-order)
  const sortedNodes = [...visibleNodes].sort((a, b) =>
    a.id === hoveredId ? 1 : b.id === hoveredId ? -1 : 0
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
      <svg ref={svgRef} className="graph-svg">
        <defs>
          <filter id="f-nor" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#00000018" />
          </filter>
          <filter id="f-hov" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#00000028" />
          </filter>
          <filter id="f-sel" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#6366f140" />
          </filter>
          {/* Noise texture filter for graph background */}
          <filter id="graph-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" />
          </filter>
          <linearGradient id="graph-bg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf9f7" />
            <stop offset="100%" stopColor="#f5f3f0" />
          </linearGradient>
        </defs>

        {/* Gradient + subtle noise background */}
        <rect width="100%" height="100%" fill="url(#graph-bg-grad)" />
        <rect width="100%" height="100%" fill="#faf9f7" opacity="0.3" filter="url(#graph-noise)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Connections drawn first (behind cards) */}
          {layout && (
            <Connections
              spousePairs={conn.spousePairs}
              families={conn.families}
              customEdges={conn.customEdges}
              pos={layout.pos}
              animated
              zoom={zoom}
            />
          )}

          {/* Cards */}
          {layout && sortedNodes.map(node => {
            const p = layout.pos.get(node.id);
            if (!p) return null;
            return (
              <PersonCard
                key={node.id}
                node={node}
                p={p}
                isHovered={hoveredId === node.id}
                isSelected={selectedNodeId === node.id}
                canEdit={!!canEdit}
                hasChildren={parentIds.has(node.id)}
                isCollapsed={collapsedIds.has(node.id)}
                descendantCount={collapsedIds.has(node.id) ? countDescendants(node.id) : 0}
                onHover={() => setHoveredId(node.id)}
                onLeave={() => setHoveredId(null)}
                onClick={onNodeClick || (() => {})}
                onQuickAdd={onQuickAdd || (() => {})}
                onToggleCollapse={toggleCollapse}
                didDrag={didDrag}
              />
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="graph-controls">
        <button className="btn btn-ghost btn-sm" title="Приблизить"   onClick={() => setZoom(z => Math.min(5, z * 1.3))}>+</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="100%"         onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="Отдалить"     onClick={() => setZoom(z => Math.max(0.01, z / 1.3))}>−</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="По размеру"   onClick={fitToScreen}>⊡</button>
      </div>

      {/* Minimap */}
      {layout && (
        <Minimap layout={layout} pan={pan} zoom={zoom} cw={dims.w} ch={dims.h} />
      )}
    </div>
  );
}
