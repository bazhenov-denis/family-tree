/**
 * Creates a large family tree via the REST API.
 *
 * Structure:
 *   Gen 0: 2 founding couples (4 people)
 *   Gen 1: Each couple has 2-3 children + spouses (~16 people)
 *   Gen 2: Each Gen-1 child has 2-3 children (~30 people)
 *   Gen 3: Some Gen-2 people have children (~20 people)
 *   Total: ~70 people, ~65 relationships
 *
 * Usage: node scripts/create-large-tree.js
 */

const BASE = 'http://localhost';

const EMAIL = 'denis.bazhenov2005@yandex.ru';
const PASSWORD = 'Denis@128';

// ── Helpers ──────────────────────────────────────────────────────
let token = '';
let treeId = '';

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  token = data.accessToken;
  console.log('Logged in');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function api(method, path, body) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function createTree(title, desc) {
  const tree = await api('POST', '/api/trees', { title, description: desc });
  treeId = tree.id;
  console.log(`Tree created: ${title} (${treeId})`);
  return treeId;
}

async function addPerson(firstName, lastName, gender, birthYear, deathYear, birthPlace) {
  const body = { firstName, lastName, gender, birthDate: `${birthYear}-06-15` };
  if (deathYear) body.deathDate = `${deathYear}-01-01`;
  if (birthPlace) body.birthPlace = birthPlace;
  return api('POST', `/api/trees/${treeId}/persons`, body);
}

async function addRelationship(fromId, toId, type) {
  return api('POST', `/api/trees/${treeId}/relationships`, {
    fromPersonId: fromId,
    toPersonId: toId,
    type,
  });
}

// ── Family data ──────────────────────────────────────────────────
const maleFirstNames = [
  'Александр', 'Дмитрий', 'Максим', 'Иван', 'Андрей',
  'Сергей', 'Николай', 'Владимир', 'Павел', 'Михаил',
  'Борис', 'Виктор', 'Олег', 'Евгений', 'Артём',
  'Роман', 'Тимофей', 'Фёдор', 'Григорий', 'Степан',
  'Констанин', 'Юрий', 'Василий', 'Пётр', 'Алексей',
  'Илья', 'Кирилл', 'Даниил', 'Матвей', 'Лев',
];
const femaleFirstNames = [
  'Елена', 'Мария', 'Анна', 'Ольга', 'Наталья',
  'Татьяна', 'Ирина', 'Светлана', 'Екатерина', 'Валентина',
  'Людмила', 'Галина', 'Вера', 'Надежда', 'Любовь',
  'Марина', 'Юлия', 'Алина', 'Дарья', 'Ксения',
  'Варвара', 'Софья', 'Полина', 'Александра', 'Евгения',
];
const lastNames = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков',
  'Морозов', 'Волков', 'Соколов', 'Лебедев', 'Кузнецов',
];
const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург'];

let nameIdx = 0;
function nextMaleName() { return maleFirstNames[nameIdx++ % maleFirstNames.length]; }
function nextFemaleName() { return femaleFirstNames[nameIdx++ % femaleFirstNames.length]; }
function nextLastName() { return lastNames[Math.floor(nameIdx / 2) % lastNames.length]; }

async function createLargeTree() {
  await login();
  await createTree('Большое Семейное Древо', 'Тестовое дерево с 70+ членами семьи');

  // ═══════════════════════════════════════════════
  // GENERATION 0 — Founding couples
  // ═══════════════════════════════════════════════
  console.log('\n--- Generation 0 ---');
  const g0_m1 = await addPerson('Александр', 'Иванов', 'MALE', 1935, 2010, 'Москва');
  const g0_f1 = await addPerson('Елена', 'Иванова', 'FEMALE', 1938, null, 'Казань');
  await addRelationship(g0_m1.id, g0_f1.id, 'SPOUSE');

  const g0_m2 = await addPerson('Дмитрий', 'Петров', 'MALE', 1933, 2005, 'Санкт-Петербург');
  const g0_f2 = await addPerson('Мария', 'Петрова', 'FEMALE', 1936, null, 'Москва');
  await addRelationship(g0_m2.id, g0_f2.id, 'SPOUSE');

  // ═══════════════════════════════════════════════
  // GENERATION 1 — Children of founding couples + spouses
  // ═══════════════════════════════════════════════
  console.log('\n--- Generation 1 ---');

  // Children of Александр + Елена (3 children)
  const g1_m1 = await addPerson('Максим', 'Иванов', 'MALE', 1958, null, 'Москва');
  const g1_f1 = await addPerson('Анна', 'Иванова', 'FEMALE', 1960, null, 'Москва');
  const g1_m2 = await addPerson('Иван', 'Иванов', 'MALE', 1963, null, 'Москва');
  await addRelationship(g0_m1.id, g1_m1.id, 'PARENT');
  await addRelationship(g0_f1.id, g1_m1.id, 'PARENT');
  await addRelationship(g0_m1.id, g1_f1.id, 'PARENT');
  await addRelationship(g0_f1.id, g1_f1.id, 'PARENT');
  await addRelationship(g0_m1.id, g1_m2.id, 'PARENT');
  await addRelationship(g0_f1.id, g1_m2.id, 'PARENT');

  // Spouses for Иванов children
  const g1_f1s = await addPerson('Ольга', 'Сидорова', 'FEMALE', 1959, null, 'Казань');
  await addRelationship(g1_m1.id, g1_f1s.id, 'SPOUSE');
  const g1_f2s = await addPerson('Наталья', 'Козлова', 'FEMALE', 1964, null, 'Санкт-Петербург');
  await addRelationship(g1_m2.id, g1_f2s.id, 'SPOUSE');

  // Children of Дмитрий + Мария (3 children)
  const g1_m3 = await addPerson('Сергей', 'Петров', 'MALE', 1957, null, 'Санкт-Петербург');
  const g1_f3 = await addPerson('Татьяна', 'Петрова', 'FEMALE', 1961, null, 'Москва');
  const g1_m4 = await addPerson('Николай', 'Петров', 'MALE', 1965, null, 'Санкт-Петербург');
  await addRelationship(g0_m2.id, g1_m3.id, 'PARENT');
  await addRelationship(g0_f2.id, g1_m3.id, 'PARENT');
  await addRelationship(g0_m2.id, g1_f3.id, 'PARENT');
  await addRelationship(g0_f2.id, g1_f3.id, 'PARENT');
  await addRelationship(g0_m2.id, g1_m4.id, 'PARENT');
  await addRelationship(g0_f2.id, g1_m4.id, 'PARENT');

  // Spouses for Петров children
  const g1_f3s = await addPerson('Ирина', 'Морозова', 'FEMALE', 1958, null, 'Екатеринбург');
  await addRelationship(g1_m3.id, g1_f3s.id, 'SPOUSE');
  const g1_m4s = await addPerson('Светлана', 'Волкова', 'FEMALE', 1966, null, 'Новосибирск');
  await addRelationship(g1_m4.id, g1_m4s.id, 'SPOUSE');

  // ═══════════════════════════════════════════════
  // GENERATION 2 — Grandchildren (~30 people)
  // ═══════════════════════════════════════════════
  console.log('\n--- Generation 2 ---');

  // Children of Максим + Ольга (3 children)
  const g2_1 = await addPerson('Артём', 'Иванов', 'MALE', 1980, null, 'Москва');
  const g2_2 = await addPerson('Роман', 'Иванов', 'MALE', 1983, null, 'Москва');
  const g2_3 = await addPerson('Дарья', 'Иванова', 'FEMALE', 1986, null, 'Москва');
  for (const child of [g2_1, g2_2, g2_3]) {
    await addRelationship(g1_m1.id, child.id, 'PARENT');
    await addRelationship(g1_f1s.id, child.id, 'PARENT');
  }

  // Spouses for g2_1, g2_2
  const g2_1s = await addPerson('Алина', 'Лебедева', 'FEMALE', 1981, null, 'Казань');
  await addRelationship(g2_1.id, g2_1s.id, 'SPOUSE');
  const g2_2s = await addPerson('Ксения', 'Кузнецова', 'FEMALE', 1984, null, 'Москва');
  await addRelationship(g2_2.id, g2_2s.id, 'SPOUSE');

  // Children of Анна + (no spouse shown, single parent) (2 children)
  const g2_4 = await addPerson('Тимофей', 'Иванов', 'MALE', 1982, null, 'Москва');
  const g2_5 = await addPerson('Варвара', 'Иванова', 'FEMALE', 1985, null, 'Москва');
  for (const child of [g2_4, g2_5]) {
    await addRelationship(g1_f1.id, child.id, 'PARENT');
  }

  // Children of Иван + Наталья (3 children)
  const g2_6 = await addPerson('Фёдор', 'Иванов', 'MALE', 1985, null, 'Москва');
  const g2_7 = await addPerson('Софья', 'Иванова', 'FEMALE', 1988, null, 'Москва');
  const g2_8 = await addPerson('Матвей', 'Иванов', 'MALE', 1991, null, 'Москва');
  for (const child of [g2_6, g2_7, g2_8]) {
    await addRelationship(g1_m2.id, child.id, 'PARENT');
    await addRelationship(g1_f2s.id, child.id, 'PARENT');
  }

  // Children of Сергей + Ирина (3 children)
  const g2_9 = await addPerson('Константин', 'Петров', 'MALE', 1980, null, 'Санкт-Петербург');
  const g2_10 = await addPerson('Юлия', 'Петрова', 'FEMALE', 1983, null, 'Санкт-Петербург');
  const g2_11 = await addPerson('Григорий', 'Петров', 'MALE', 1987, null, 'Санкт-Петербург');
  for (const child of [g2_9, g2_10, g2_11]) {
    await addRelationship(g1_m3.id, child.id, 'PARENT');
    await addRelationship(g1_f3s.id, child.id, 'PARENT');
  }

  // Spouses
  const g2_9s = await addPerson('Вера', 'Новикова', 'FEMALE', 1981, null, 'Москва');
  await addRelationship(g2_9.id, g2_9s.id, 'SPOUSE');
  const g2_10s = await addPerson('Евгений', 'Соколов', 'MALE', 1982, null, 'Казань');
  await addRelationship(g2_10s.id, g2_10.id, 'SPOUSE');

  // Children of Татьяна (2 children)
  const g2_12 = await addPerson('Степан', 'Петров', 'MALE', 1984, null, 'Москва');
  const g2_13 = await addPerson('Полина', 'Петрова', 'FEMALE', 1987, null, 'Москва');
  for (const child of [g2_12, g2_13]) {
    await addRelationship(g1_f3.id, child.id, 'PARENT');
  }

  // Children of Николай + Светлана (3 children)
  const g2_14 = await addPerson('Лев', 'Петров', 'MALE', 1988, null, 'Новосибирск');
  const g2_15 = await addPerson('Екатерина', 'Петрова', 'FEMALE', 1990, null, 'Новосибирск');
  const g2_16 = await addPerson('Василий', 'Петров', 'MALE', 1993, null, 'Новосибирск');
  for (const child of [g2_14, g2_15, g2_16]) {
    await addRelationship(g1_m4.id, child.id, 'PARENT');
    await addRelationship(g1_m4s.id, child.id, 'PARENT');
  }

  // ═══════════════════════════════════════════════
  // GENERATION 3 — Great-grandchildren (~20 people)
  // ═══════════════════════════════════════════════
  console.log('\n--- Generation 3 ---');

  // Children of Артём + Алина (3 children)
  const g3_1 = await addPerson('Даниил', 'Иванов', 'MALE', 2002, null, 'Москва');
  const g3_2 = await addPerson('Михаил', 'Иванов', 'MALE', 2005, null, 'Москва');
  const g3_3 = await addPerson('Александра', 'Иванова', 'FEMALE', 2008, null, 'Москва');
  for (const child of [g3_1, g3_2, g3_3]) {
    await addRelationship(g2_1.id, child.id, 'PARENT');
    await addRelationship(g2_1s.id, child.id, 'PARENT');
  }

  // Children of Роман + Ксения (2 children)
  const g3_4 = await addPerson('Борис', 'Иванов', 'MALE', 2006, null, 'Москва');
  const g3_5 = await addPerson('Виктор', 'Иванов', 'MALE', 2009, null, 'Москва');
  for (const child of [g3_4, g3_5]) {
    await addRelationship(g2_2.id, child.id, 'PARENT');
    await addRelationship(g2_2s.id, child.id, 'PARENT');
  }

  // Children of Дарья (2 children)
  const g3_6 = await addPerson('Любовь', 'Иванова', 'FEMALE', 2007, null, 'Москва');
  const g3_7 = await addPerson('Надежда', 'Иванова', 'FEMALE', 2010, null, 'Москва');
  for (const child of [g3_6, g3_7]) {
    await addRelationship(g2_3.id, child.id, 'PARENT');
  }

  // Children of Тимофей (2 children)
  const g3_8 = await addPerson('Павел', 'Иванов', 'MALE', 2004, null, 'Москва');
  const g3_9 = await addPerson('Галина', 'Иванова', 'FEMALE', 2007, null, 'Москва');
  for (const child of [g3_8, g3_9]) {
    await addRelationship(g2_4.id, child.id, 'PARENT');
  }

  // Children of Фёдор (2 children)
  const g3_10 = await addPerson('Юрий', 'Иванов', 'MALE', 2008, null, 'Москва');
  const g3_11 = await addPerson('Людмила', 'Иванова', 'FEMALE', 2011, null, 'Москва');
  for (const child of [g3_10, g3_11]) {
    await addRelationship(g2_6.id, child.id, 'PARENT');
  }

  // Children of Константин + Вера (2 children)
  const g3_12 = await addPerson('Олег', 'Петров', 'MALE', 2003, null, 'Санкт-Петербург');
  const g3_13 = await addPerson('Марина', 'Петрова', 'FEMALE', 2006, null, 'Санкт-Петербург');
  for (const child of [g3_12, g3_13]) {
    await addRelationship(g2_9.id, child.id, 'PARENT');
    await addRelationship(g2_9s.id, child.id, 'PARENT');
  }

  // Children of Юлия + Евгений (2 children)
  const g3_14 = await addPerson('Евгения', 'Соколова', 'FEMALE', 2005, null, 'Казань');
  const g3_15 = await addPerson('Кирилл', 'Соколов', 'MALE', 2008, null, 'Казань');
  for (const child of [g3_14, g3_15]) {
    await addRelationship(g2_10s.id, child.id, 'PARENT');
    await addRelationship(g2_10.id, child.id, 'PARENT');
  }

  // Children of Степан (1 child)
  const g3_16 = await addPerson('Илья', 'Петров', 'MALE', 2007, null, 'Москва');
  await addRelationship(g2_12.id, g3_16.id, 'PARENT');

  // Children of Лев (2 children)
  const g3_17 = await addPerson('Алексей', 'Петров', 'MALE', 2010, null, 'Новосибирск');
  const g3_18 = await addPerson('Валентина', 'Петрова', 'FEMALE', 2013, null, 'Новосибирск');
  for (const child of [g3_17, g3_18]) {
    await addRelationship(g2_14.id, child.id, 'PARENT');
  }

  // ═══════════════════════════════════════════════
  // GENERATION 4 — 4th generation (a few more)
  // ═══════════════════════════════════════════════
  console.log('\n--- Generation 4 ---');

  const g4_1 = await addPerson('Семён', 'Иванов', 'MALE', 2022, null, 'Москва');
  const g4_2 = await addPerson('Ева', 'Иванова', 'FEMALE', 2024, null, 'Москва');
  await addRelationship(g3_1.id, g4_1.id, 'PARENT');
  await addRelationship(g3_1.id, g4_2.id, 'PARENT');

  const g4_3 = await addPerson('Марк', 'Иванов', 'MALE', 2023, null, 'Москва');
  await addRelationship(g3_4.id, g4_3.id, 'PARENT');

  // ═══════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════
  console.log('\n=== DONE ===');
  console.log(`Tree ID: ${treeId}`);
  console.log(`URL: ${BASE}/trees/${treeId}`);

  // Fetch graph to verify
  const graph = await api('GET', `/api/trees/${treeId}/graph`);
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);
}

createLargeTree().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
