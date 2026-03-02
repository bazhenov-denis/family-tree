/**
 * BFS по ненаправленному графу рёбер.
 * Возвращает массив шагов [{ fromId, toId, edgeType, dir }] или null если пути нет.
 *
 * Направление рёбер:
 *   PARENT edge (from → to) означает: from является родителем to.
 *   SPOUSE, ADOPTED, GUARDIAN — аналогично.
 */
export function findRelationPath(nodes, edges, fromId, toId) {
  if (fromId === toId) return [];

  // Строим список смежности (ненаправленный)
  const adj = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    adj.get(e.from)?.push({ neighborId: e.to,   edgeType: e.type, dir: 'forward'  });
    adj.get(e.to)  ?.push({ neighborId: e.from,  edgeType: e.type, dir: 'backward' });
  }

  // BFS
  const visited = new Set([fromId]);
  // queue: [currentId, pathSteps[]]
  const queue = [[fromId, []]];

  while (queue.length) {
    const [curr, path] = queue.shift();
    for (const { neighborId, edgeType, dir } of (adj.get(curr) ?? [])) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      const newPath = [...path, { fromId: curr, toId: neighborId, edgeType, dir }];
      if (neighborId === toId) return newPath;
      queue.push([neighborId, newPath]);
    }
  }

  return null; // нет связи
}

/**
 * Метка шага: каким является `to` по отношению к `from`.
 *
 * PARENT edge, forward  (from = родитель, to = ребёнок):
 *   → идём вниз по дереву: to — «ребёнок» from
 * PARENT edge, backward (from = ребёнок, to = родитель):
 *   → идём вверх: to — «родитель» from
 */
export function stepLabel(edgeType, dir) {
  if (edgeType === 'SPOUSE')   return 'супруг/а';
  if (edgeType === 'ADOPTED') {
    return dir === 'forward' ? 'усыновлён/а' : 'усыновитель';
  }
  if (edgeType === 'GUARDIAN') {
    return dir === 'forward' ? 'подопечный' : 'опекун';
  }
  // PARENT
  return dir === 'forward' ? 'ребёнок' : 'родитель';
}

/**
 * Человекочитаемое описание для коротких путей (1–2 шага).
 * Для длинных возвращает null (используем пошаговое отображение).
 */
export function summarizePath(path, nameOf) {
  if (!path || path.length === 0) return null;

  const a = nameOf(path[0].fromId);
  const b = nameOf(path[path.length - 1].toId);

  if (path.length === 1) {
    const rel = stepLabel(path[0].edgeType, path[0].dir);
    return `${a} — ${rel} ${b}`;
  }

  if (path.length === 2) {
    const [s1, s2] = path;
    // Дед/бабушка: родитель → родитель (backward + backward = up, up)
    if (s1.edgeType === 'PARENT' && s1.dir === 'backward' &&
        s2.edgeType === 'PARENT' && s2.dir === 'backward') {
      return `${a} — дедушка/бабушка ${b}`;
    }
    // Внук/внучка (down, down)
    if (s1.edgeType === 'PARENT' && s1.dir === 'forward' &&
        s2.edgeType === 'PARENT' && s2.dir === 'forward') {
      return `${a} — внук/внучка ${b}`;
    }
    // Тётя/дядя: up + down
    if (s1.edgeType === 'PARENT' && s1.dir === 'backward' &&
        s2.edgeType === 'PARENT' && s2.dir === 'forward') {
      return `${a} — дядя/тётя ${b}`;
    }
    // Племянник: down + up
    if (s1.edgeType === 'PARENT' && s1.dir === 'forward' &&
        s2.edgeType === 'PARENT' && s2.dir === 'backward') {
      return `${a} — племянник/племянница ${b}`;
    }
    // Брат/сестра через общего родителя
    if (s1.edgeType === 'PARENT' && s2.edgeType === 'PARENT' &&
        s1.fromId === path[0].fromId) {
      return `${a} — брат/сестра ${b}`;
    }
    // Свёкор/свекровь, зять и т.п. — общий случай
    const r1 = stepLabel(s1.edgeType, s1.dir);
    const r2 = stepLabel(s2.edgeType, s2.dir);
    const mid = nameOf(s1.toId);
    return `${a} → (${r1}) → ${mid} → (${r2}) → ${b}`;
  }

  return null; // для длинных путей краткого описания нет
}
