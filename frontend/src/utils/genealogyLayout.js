export const CARD_W = 155;
export const CARD_H = 180;
export const H_GAP = 60;
export const COUPLE_GAP = 28;
export const V_GAP = 80;

const GEN_TYPES = new Set(['PARENT', 'ADOPTED', 'GUARDIAN']);

export function computeLayout(nodes, edges) {
  if (!nodes.length) return { pos: new Map(), width: 800, height: 400 };

  // ── Build adjacency ──────────────────────────────────────────
  const childrenOf = new Map(nodes.map(n => [n.id, []]));
  const parentsOf  = new Map(nodes.map(n => [n.id, []]));
  const spousesOf  = new Map(nodes.map(n => [n.id, []]));

  for (const e of edges) {
    if (GEN_TYPES.has(e.type)) {
      childrenOf.get(e.from)?.push(e.to);
      parentsOf.get(e.to)?.push(e.from);
    } else if (e.type === 'SPOUSE') {
      const sf = spousesOf.get(e.from); if (sf && !sf.includes(e.to)) sf.push(e.to);
      const st = spousesOf.get(e.to);   if (st && !st.includes(e.from)) st.push(e.from);
    }
  }

  // ── Assign generation via BFS from roots ─────────────────────
  const gen = new Map();
  const roots = nodes.filter(n => !parentsOf.get(n.id).length).map(n => n.id);
  if (!roots.length) roots.push(nodes[0].id);

  const q = [...roots];
  roots.forEach(id => gen.set(id, 0));

  while (q.length) {
    const id = q.shift();
    const g = gen.get(id);
    for (const sid of spousesOf.get(id) ?? []) {
      if (!gen.has(sid) || gen.get(sid) < g) { gen.set(sid, g); q.push(sid); }
    }
    for (const cid of childrenOf.get(id) ?? []) {
      const ng = g + 1;
      // cap at nodes.length to break cycles (valid trees can't have more generations than nodes)
      if (ng <= nodes.length && (!gen.has(cid) || gen.get(cid) < ng)) { gen.set(cid, ng); q.push(cid); }
    }
  }
  nodes.forEach(n => { if (!gen.has(n.id)) gen.set(n.id, 0); });

  // ── Group by generation ───────────────────────────────────────
  const byGen = new Map();
  nodes.forEach(n => {
    const g = gen.get(n.id);
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g).push(n.id);
  });
  const gens = [...byGen.keys()].sort((a, b) => a - b);

  // ── Build spouse-groups within each generation ────────────────
  // A group keeps every same-generation spouse component together. This is
  // important for people with several spouse links: otherwise the extra spouse
  // can drift far away and create a very long horizontal relationship line.
  // A group = { ids: [id] | [spouse, id, spouse...], width, x }
  const groupOf  = new Map();
  const genGroups = new Map();

  for (const g of gens) {
    const persons = byGen.get(g);
    const personSet = new Set(persons);
    const seen    = new Set();
    const groups  = [];

    for (const id of persons) {
      if (seen.has(id)) continue;
      const component = [];
      const stack = [id];
      seen.add(id);

      while (stack.length) {
        const curr = stack.pop();
        component.push(curr);
        for (const sid of spousesOf.get(curr) ?? []) {
          if (gen.get(sid) !== g || !personSet.has(sid) || seen.has(sid)) continue;
          seen.add(sid);
          stack.push(sid);
        }
      }

      const ids = orderSpouseComponent(component, spousesOf);
      const grp = {
        ids,
        width: CARD_W * ids.length + COUPLE_GAP * Math.max(0, ids.length - 1),
        x: 0,
      };

      groups.push(grp);
      grp.ids.forEach(gid => groupOf.set(gid, grp));
    }
    genGroups.set(g, groups);
  }

  // ── Initial uniform x layout ──────────────────────────────────
  for (const g of gens) {
    let cx = 0;
    for (const grp of genGroups.get(g)) { grp.x = cx; cx += grp.width + H_GAP; }
  }

  // ── Barycenter reordering — reduce crossing lines ─────────────
  // Up sweep: sort each generation by avg X of its children
  for (let gi = gens.length - 2; gi >= 0; gi--) {
    const groups = genGroups.get(gens[gi]);
    for (const grp of groups) {
      const cxs = [];
      for (const id of grp.ids)
        for (const cid of childrenOf.get(id) ?? []) {
          const cg = groupOf.get(cid);
          if (cg) cxs.push(cg.x + cg.width / 2);
        }
      grp._sort = cxs.length
        ? cxs.reduce((a, b) => a + b, 0) / cxs.length
        : grp.x + grp.width / 2;
    }
    groups.sort((a, b) => a._sort - b._sort);
    let cx = 0;
    for (const grp of groups) { grp.x = cx; cx += grp.width + H_GAP; }
  }
  // Down sweep: sort each generation by avg X of its parents
  for (let gi = 1; gi < gens.length; gi++) {
    const groups = genGroups.get(gens[gi]);
    for (const grp of groups) {
      const pxs = [];
      for (const id of grp.ids)
        for (const pid of parentsOf.get(id) ?? []) {
          const pg = groupOf.get(pid);
          if (pg) pxs.push(pg.x + pg.width / 2);
        }
      grp._sort = pxs.length
        ? pxs.reduce((a, b) => a + b, 0) / pxs.length
        : grp.x + grp.width / 2;
    }
    groups.sort((a, b) => a._sort - b._sort);
    let cx = 0;
    for (const grp of groups) { grp.x = cx; cx += grp.width + H_GAP; }
  }

  // ── Iterative refinement (8 passes) ──────────────────────────
  for (let iter = 0; iter < 8; iter++) {
    // Down pass: center children under their parents
    for (let gi = 1; gi < gens.length; gi++) {
      for (const grp of genGroups.get(gens[gi])) {
        const pxs = [];
        for (const id of grp.ids)
          for (const pid of parentsOf.get(id) ?? []) {
            const pg = groupOf.get(pid);
            if (pg) pxs.push(pg.x + pg.ids.indexOf(pid) * (CARD_W + COUPLE_GAP) + CARD_W / 2);
          }
        if (pxs.length) {
          const avg = pxs.reduce((s, v) => s + v, 0) / pxs.length;
          grp.x = grp.x * 0.3 + (avg - grp.width / 2) * 0.7;
        }
      }
      resolveOverlaps(genGroups.get(gens[gi]));
    }

    // Up pass: center parents over their children
    for (let gi = gens.length - 2; gi >= 0; gi--) {
      for (const grp of genGroups.get(gens[gi])) {
        const cxs = [];
        for (const id of grp.ids)
          for (const cid of childrenOf.get(id) ?? []) {
            const cg = groupOf.get(cid);
            if (cg) cxs.push(cg.x + cg.width / 2);
          }
        if (cxs.length) {
          const avg = cxs.reduce((s, v) => s + v, 0) / cxs.length;
          grp.x = grp.x * 0.3 + (avg - grp.width / 2) * 0.7;
        }
      }
      resolveOverlaps(genGroups.get(gens[gi]));
    }
  }

  // ── Normalize x ≥ 0 ──────────────────────────────────────────
  const minX = Math.min(...[...genGroups.values()].flatMap(gs => gs.map(g => g.x)));
  genGroups.forEach(gs => gs.forEach(grp => (grp.x -= minX)));

  // ── Build final positions ─────────────────────────────────────
  const pos = new Map();
  nodes.forEach(n => {
    const grp = groupOf.get(n.id);
    const g   = gen.get(n.id);
    const idx = grp.ids.indexOf(n.id);
    pos.set(n.id, {
      x: grp.x + idx * (CARD_W + COUPLE_GAP),
      y: g * (CARD_H + V_GAP),
    });
  });

  const xs = [...pos.values()].map(p => p.x + CARD_W);
  const ys = [...pos.values()].map(p => p.y + CARD_H);

  return {
    pos,
    width:  Math.max(800, ...xs) + H_GAP,
    height: Math.max(400, ...ys) + V_GAP,
  };
}

function resolveOverlaps(groups) {
  const sorted = [...groups].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const minX = prev.x + prev.width + H_GAP;
    if (curr.x < minX) {
      const delta = minX - curr.x;
      for (let j = i; j < sorted.length; j++) sorted[j].x += delta;
    }
  }
}

function orderSpouseComponent(ids, spousesOf) {
  if (ids.length <= 2) return ids;

  const idSet = new Set(ids);
  const center = [...ids].sort((a, b) => {
    const degreeA = (spousesOf.get(a) ?? []).filter(id => idSet.has(id)).length;
    const degreeB = (spousesOf.get(b) ?? []).filter(id => idSet.has(id)).length;
    return degreeB - degreeA;
  })[0];

  const spouses = ids.filter(id => id !== center);
  const left = [];
  const right = [];

  spouses.forEach((id, idx) => {
    if (idx % 2 === 0) left.unshift(id);
    else right.push(id);
  });

  return [...left, center, ...right];
}
