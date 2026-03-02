import { useState, useRef, useEffect } from 'react';
import { Trees, UserPlus } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { computeLayout, CARD_W, CARD_H, V_GAP } from '../../utils/genealogyLayout.js';

const PHOTO_R = 44;   // circle radius; top of circle == bounding-box y=0
const MM_W    = 180;
const MM_H    = 108;

// card rect starts at y=PHOTO_R (photo centre) and runs to CARD_H
const CARD_RECT_Y = PHOTO_R;
const CONN_CLR    = '#94a3b8';

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
function Connections({ spousePairs, families, customEdges, pos }) {
  const lp = { stroke: CONN_CLR, strokeWidth: 2, strokeLinecap: 'round' };
  const lines = [];

  // Spouse: horizontal line at card vertical-center, drawn center-to-center.
  // The trunk to children starts from the same Y, so the T-junction is formed
  // right at the centre of the couple's cards.
  // Cards are rendered ON TOP of connections: the portions inside each card rect
  // are hidden — only the gap between the two cards (COUPLE_GAP wide) is visible.
  for (const { id, a, b } of spousePairs) {
    const pa = pos.get(a);
    const pb = pos.get(b);
    if (!pa || !pb) continue;
    const y  = pa.y + CARD_H / 2;        // vertical centre of card
    const ax = pa.x + CARD_W / 2;        // centre X of card A
    const bx = pb.x + CARD_W / 2;        // centre X of card B
    lines.push(
      <line key={`sp-${id}`}
        x1={Math.min(ax, bx)} y1={y}
        x2={Math.max(ax, bx)} y2={y}
        {...lp}
      />
    );
  }

  // Parent→children: orthogonal elbow + bar + stubs
  for (const { parents, children } of families) {
    const ppos = parents.map(id => pos.get(id)).filter(Boolean);
    const cpos = children.map(id => pos.get(id)).filter(Boolean);
    if (!ppos.length || !cpos.length) continue;

    const trunkX = ppos.reduce((s, p) => s + p.x + CARD_W / 2, 0) / ppos.length;

    // For a couple, trunkX is in the gap between their cards, so the trunk is
    // fully visible from card-centre Y downward.
    // For a single parent, trunkX is inside the card rect and stays hidden until
    // the card bottom — no visual difference vs starting at card bottom.
    const trunkTopY    = Math.min(...ppos.map(p => p.y)) + CARD_H / 2;
    const parentBottom = Math.max(...ppos.map(p => p.y + CARD_H));
    const childTop     = Math.min(...cpos.map(p => p.y));
    const midY         = (parentBottom + childTop) / 2;

    // Vertical trunk from card centre down to midY
    lines.push(<line key={`tr-${parents.join('-')}`} x1={trunkX} y1={trunkTopY} x2={trunkX} y2={midY} {...lp} />);

    // Collect child centre-Xs
    const childXs = children.map(id => { const p = pos.get(id); return p ? p.x + CARD_W / 2 : null; }).filter(x => x !== null);
    const barLeft  = Math.min(trunkX, ...childXs);
    const barRight = Math.max(trunkX, ...childXs);

    // Horizontal bar at midY (even for single child if offset)
    if (barRight > barLeft + 1) {
      lines.push(<line key={`bar-${parents.join('-')}`} x1={barLeft} y1={midY} x2={barRight} y2={midY} {...lp} />);
    }

    // Vertical stubs from bar down to each child's photo top
    for (const cid of children) {
      const cp = pos.get(cid);
      if (!cp) continue;
      const cx = cp.x + CARD_W / 2;
      lines.push(<line key={`stub-${cid}`} x1={cx} y1={midY} x2={cx} y2={cp.y} {...lp} />);
    }
  }

  // Custom: dashed line between card centres
  for (const e of customEdges) {
    const pa = pos.get(e.from);
    const pb = pos.get(e.to);
    if (!pa || !pb) continue;
    lines.push(
      <line key={`cu-${e.id}`}
        x1={pa.x + CARD_W / 2} y1={pa.y + CARD_H / 2}
        x2={pb.x + CARD_W / 2} y2={pb.y + CARD_H / 2}
        stroke={CONN_CLR} strokeWidth={1.5} strokeDasharray="5 5"
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
function CollapseBtn({ cx, collapsed, count, onClick }) {
  return (
    <g
      transform={`translate(${cx},${CARD_H + 12})`}
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

// ── Person card ─────────────────────────────────────────────────
// Bounding box: (p.x, p.y) → (p.x+CARD_W, p.y+CARD_H)
// Photo circle centre at (cx, PHOTO_R) — top of circle == y=0 (bounding-box top)
// White card rect from y=PHOTO_R to y=CARD_H
function PersonCard({ node, p, isHovered, isSelected, canEdit, hasChildren, isCollapsed, descendantCount, onHover, onLeave, onClick, onQuickAdd, onToggleCollapse, didDrag }) {
  const pal      = PALETTE[node.gender] || PAL_DEFAULT;
  const clipId   = `clip-${node.id}`;
  const shadowId = isSelected ? 'f-sel' : isHovered ? 'f-hov' : 'f-nor';
  const cx       = CARD_W / 2;

  // Split name across up to 2 lines
  const parts  = (node.fullName || '?').split(' ').filter(Boolean);
  const line1  = parts[0] || '?';
  const line2  = parts.slice(1).join(' ') || null;
  const trim14 = s => s.length > 13 ? s.slice(0, 12) + '…' : s;

  const years = [
    node.birthYear ? String(node.birthYear)  : null,
    node.deathYear ? `† ${node.deathYear}`   : null,
  ].filter(Boolean).join(' – ');

  // Vertical text positions (relative to bounding-box y=0)
  const textBaseY = CARD_RECT_Y + 56;          // first name line: 12px below photo bottom (2*PHOTO_R=88)
  const yearsY    = textBaseY + (line2 ? 34 : 18);

  const textStyle = { fontFamily: 'inherit', pointerEvents: 'none', userSelect: 'none' };

  return (
    <g
      transform={`translate(${p.x},${p.y})`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => { if (!didDrag.current) onClick(node); }}
    >
      {/* White card rect — shadow here so it stays behind the photo circle */}
      <rect
        x={0} y={CARD_RECT_Y}
        width={CARD_W} height={CARD_H - CARD_RECT_Y}
        rx={16}
        fill="white"
        stroke={pal.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        filter={`url(#${shadowId})`}
      />

      {/* Photo ring (coloured circle behind the clipped image/initials) */}
      <circle cx={cx} cy={PHOTO_R} r={PHOTO_R} fill={pal.bg} stroke={pal.border} strokeWidth={isSelected ? 2.5 : 2} />

      {/* Photo clip */}
      <clipPath id={clipId}>
        <circle cx={cx} cy={PHOTO_R} r={PHOTO_R - 3} />
      </clipPath>

      {node.photoUrl ? (
        <image
          href={node.photoUrl}
          x={cx - (PHOTO_R - 3)} y={3}
          width={(PHOTO_R - 3) * 2} height={(PHOTO_R - 3) * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <text
          x={cx} y={PHOTO_R}
          textAnchor="middle" dominantBaseline="central"
          fontSize={24} fontWeight={700} fill={pal.init}
          style={textStyle}
        >
          {initials(node.fullName)}
        </text>
      )}

      {/* Name — centred, up to 2 lines */}
      <text x={cx} y={textBaseY} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0f172a" style={textStyle}>
        {trim14(line1)}
      </text>
      {line2 && (
        <text x={cx} y={textBaseY + 17} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0f172a" style={textStyle}>
          {trim14(line2)}
        </text>
      )}

      {/* Years */}
      {years && (
        <text x={cx} y={yearsY} textAnchor="middle" fontSize={11} fill="#94a3b8" style={textStyle}>
          {years}
        </text>
      )}

      {/* Collapse toggle — always visible for parent nodes */}
      {hasChildren && (
        <CollapseBtn
          cx={cx}
          collapsed={isCollapsed}
          count={descendantCount}
          onClick={() => onToggleCollapse(node.id)}
        />
      )}

      {/* Hover: quick-add button below the card (shifted down if collapse btn present) */}
      {isHovered && canEdit && (
        <>
          {/* Transparent bridge fills the gap between card bottom and button top */}
          <rect x={cx - 18} y={CARD_H} width={36} height={hasChildren ? 46 : 6} fill="transparent" />
          <QABtn x={cx} y={CARD_H + (hasChildren ? 46 : 24)} borderColor={pal.border} onClick={() => onQuickAdd(node)} />
        </>
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

  // Viewport rect in canvas coords
  const vpX = (-pan.x / zoom) * mmScale + offX;
  const vpY = (-pan.y / zoom) * mmScale + offY;
  const vpW = (cw / zoom) * mmScale;
  const vpH = (ch / zoom) * mmScale;

  return (
    <div className="graph-minimap">
      <svg width={MM_W} height={MM_H}>
        <rect width={MM_W} height={MM_H} fill="#f8fafc" rx={6} stroke="#e2e8f0" strokeWidth={1} />

        <g transform={`translate(${offX},${offY}) scale(${mmScale})`}>
          {[...layout.pos.entries()].map(([id, p]) => (
            <rect key={id} x={p.x} y={p.y} width={CARD_W} height={CARD_H} rx={4} fill="#94a3b8" opacity={0.45} />
          ))}
        </g>

        {/* Viewport indicator */}
        <rect
          x={Math.max(0, vpX)} y={Math.max(0, vpY)}
          width={Math.min(MM_W - Math.max(0, vpX), vpW)}
          height={Math.min(MM_H - Math.max(0, vpY), vpH)}
          fill="#6366f1" fillOpacity={0.08}
          stroke="#6366f1" strokeWidth={1.5}
          rx={2}
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

  // Wheel zoom toward cursor (passive: false)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = e => {
      e.preventDefault();
      const rect    = el.getBoundingClientRect();
      const mx      = e.clientX - rect.left;
      const my      = e.clientY - rect.top;
      const oldZoom = zoomRef.current;
      const newZoom = Math.min(2.5, Math.max(0.15, oldZoom * (e.deltaY < 0 ? 1.12 : 0.9)));
      const ratio   = newZoom / oldZoom;
      setZoom(newZoom);
      setPan(prev => ({
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
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
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
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
          <pattern id="grid-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="#cbd5e1" opacity="0.6" />
          </pattern>
        </defs>

        {/* Dotted grid background */}
        <rect width="100%" height="100%" fill="url(#grid-dots)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Connections drawn first (behind cards) */}
          {layout && (
            <Connections
              spousePairs={conn.spousePairs}
              families={conn.families}
              customEdges={conn.customEdges}
              pos={layout.pos}
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
        <button className="btn btn-ghost btn-sm" title="Приблизить"   onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}>+</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="100%"         onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <span className="graph-controls-sep" />
        <button className="btn btn-ghost btn-sm" title="Отдалить"     onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}>−</button>
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
