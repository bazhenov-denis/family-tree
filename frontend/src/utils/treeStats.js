/**
 * Computes statistics from the graph data.
 * graph = { nodes: PersonNodeDto[], edges: RelationEdgeDto[] }
 */
export function computeStats(graph) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  if (nodes.length === 0) return null;

  // ─── Basic counts ─────────────────────────────────────────────────────────
  const totalPersons = nodes.length;
  const living   = nodes.filter(n => !n.deathYear).length;
  const deceased = nodes.filter(n =>  n.deathYear).length;

  // ─── Gender ───────────────────────────────────────────────────────────────
  const male   = nodes.filter(n => n.gender === 'MALE').length;
  const female = nodes.filter(n => n.gender === 'FEMALE').length;
  const other  = totalPersons - male - female;

  // ─── Lifespans ────────────────────────────────────────────────────────────
  const lifespans = nodes
    .filter(n => n.birthYear && n.deathYear && n.deathYear > n.birthYear)
    .map(n => n.deathYear - n.birthYear);
  const avgLifespan = lifespans.length > 0
    ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length)
    : null;

  // ─── Oldest / youngest living ─────────────────────────────────────────────
  const withBirth = nodes.filter(n => n.birthYear && !n.deathYear);
  const oldest   = withBirth.length > 0
    ? withBirth.reduce((a, b) => a.birthYear < b.birthYear ? a : b)
    : null;
  const youngest = withBirth.length > 0
    ? withBirth.reduce((a, b) => a.birthYear > b.birthYear ? a : b)
    : null;

  // ─── Generations (longest PARENT chain) ──────────────────────────────────
  const parentEdges = edges.filter(e => e.type === 'PARENT');
  const childSet = new Set(parentEdges.map(e => e.to));
  // Build parent→children
  const children = new Map();
  for (const e of parentEdges) {
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from).push(e.to);
  }
  // BFS from root nodes (nodes that have no parent in the tree)
  const roots = nodes.filter(n => !childSet.has(n.id));
  let generations = nodes.length > 0 ? 1 : 0;
  const queue = roots.map(r => ({ id: r.id, depth: 1 }));
  const visited = new Set();
  while (queue.length) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    if (depth > generations) generations = depth;
    for (const childId of (children.get(id) ?? [])) {
      queue.push({ id: childId, depth: depth + 1 });
    }
  }

  // ─── Surnames ─────────────────────────────────────────────────────────────
  const surnameMap = {};
  for (const n of nodes) {
    const parts = (n.fullName ?? '').trim().split(/\s+/);
    if (parts.length >= 2) {
      const surname = parts[parts.length - 1];
      if (surname) surnameMap[surname] = (surnameMap[surname] ?? 0) + 1;
    }
  }
  const topSurnames = Object.entries(surnameMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ─── Relationship type counts ─────────────────────────────────────────────
  const relCounts = {};
  for (const e of edges) {
    relCounts[e.type] = (relCounts[e.type] ?? 0) + 1;
  }

  // ─── Average children per parent ─────────────────────────────────────────
  const childCountPerParent = [...children.values()].map(c => c.length);
  const avgChildren = childCountPerParent.length > 0
    ? (childCountPerParent.reduce((a, b) => a + b, 0) / childCountPerParent.length).toFixed(1)
    : null;

  return {
    totalPersons, living, deceased,
    male, female, other,
    avgLifespan,
    oldest, youngest,
    generations,
    topSurnames,
    relCounts,
    avgChildren,
  };
}
