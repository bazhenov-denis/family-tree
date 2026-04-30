/**
 * Creates a WIDE family tree: ~200 people, 5 generations.
 * Each couple has 5-6 children to create wide branching.
 * Usage: node scripts/create-mega-tree.js
 */
const BASE = 'http://localhost';
const EMAIL = 'denis.bazhenov2005@yandex.ru';
const PASSWORD = 'Denis@128';
let token = '', treeId = '';

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  token = (await res.json()).accessToken;
}

function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; }
async function api(method, path, body) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function addPerson(firstName, lastName, gender, birthYear) {
  return api('POST', `/api/trees/${treeId}/persons`, { firstName, lastName, gender, birthDate: `${birthYear}-06-15` });
}
async function addRel(fromId, toId, type) {
  return api('POST', `/api/trees/${treeId}/relationships`, { fromPersonId: fromId, toPersonId: toId, type });
}

const M = ['Александр','Дмитрий','Максим','Иван','Андрей','Сергей','Николай','Владимир','Павел','Михаил','Борис','Виктор','Олег','Евгений','Артём','Роман','Тимофей','Фёдор','Григорий','Степан','Константин','Юрий','Василий','Пётр','Алексей','Илья','Кирилл','Даниил','Матвей','Лев'];
const F = ['Елена','Мария','Анна','Ольга','Наталья','Татьяна','Ирина','Светлана','Екатерина','Валентина','Людмила','Галина','Вера','Надежда','Любовь','Марина','Юлия','Алина','Дарья','Ксения','Варвара','Софья','Полина','Александра','Евгения'];
const L = ['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Волков','Соколов','Лебедев','Кузнецов'];
let nc = 0;
function nm(ln, g) {
  const arr = g === 'MALE' ? M : F;
  const base = L[Math.floor(nc / 2) % L.length];
  nc++;
  return { first: arr[(nc-1) % arr.length], last: g === 'MALE' ? base : base + 'а' };
}

async function main() {
  await login();
  const tree = await api('POST', '/api/trees', { title: 'Мега Широкое Древо', description: 'Стресс-тест 200+ человек' });
  treeId = tree.id;
  console.log('Tree:', treeId);

  let personCount = 0, relCount = 0;

  // Gen 0: 1 couple
  const g0m = await addPerson('Александр', 'Иванов', 'MALE', 1910);
  const g0f = await addPerson('Елена', 'Иванова', 'FEMALE', 1913);
  await addRel(g0m.id, g0f.id, 'SPOUSE'); relCount++;
  personCount += 2;

  // Gen 1: 6 children → 3 couples
  let prevGenCouples = [[g0m, g0f]];
  const childrenPerCouple = [6, 6, 6, 6]; // 4 gens of wide branching

  for (let gen = 0; gen < 4; gen++) {
    console.log(`Creating Gen ${gen + 1}...`);
    const nextGenCouples = [];
    const cpc = childrenPerCouple[gen] || 4;

    for (const [p1, p2] of prevGenCouples) {
      const children = [];
      for (let i = 0; i < cpc; i++) {
        const n = nm(p1?.lastName || 'Иванов', i % 2 === 0 ? 'MALE' : 'FEMALE');
        const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
        const p = await addPerson(n.first, n.last, gender, 1910 + (gen + 1) * 18 + i * 2);
        if (p1) { await addRel(p1.id, p.id, 'PARENT'); relCount++; }
        if (p2) { await addRel(p2.id, p.id, 'PARENT'); relCount++; }
        personCount++;
        children.push(p);
      }
      // Pair into couples
      for (let i = 0; i < children.length - 1; i += 2) {
        await addRel(children[i].id, children[i+1].id, 'SPOUSE'); relCount++;
        nextGenCouples.push([children[i], children[i+1]]);
      }
    }
    prevGenCouples = nextGenCouples;
    console.log(`  Couples in next gen: ${nextGenCouples.length}`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Persons: ${personCount}, Relationships: ${relCount}`);

  const graph = await api('GET', `/api/trees/${treeId}/graph`);
  console.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  console.log(`URL: ${BASE}/trees/${treeId}`);
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
