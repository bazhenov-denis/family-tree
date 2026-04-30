/**
 * Creates a HUGE family tree to stress-test rendering performance.
 * ~150 people, 5 generations
 *
 * Usage: node scripts/create-huge-tree.js
 */

const BASE = 'http://localhost';
const EMAIL = 'denis.bazhenov2005@yandex.ru';
const PASSWORD = 'Denis@128';

let token = '';
let treeId = '';

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  token = data.accessToken;
  console.log('Logged in');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
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

async function addPerson(firstName, lastName, gender, birthYear) {
  return api('POST', `/api/trees/${treeId}/persons`, {
    firstName, lastName, gender, birthDate: `${birthYear}-06-15`
  });
}

async function addRelationship(fromId, toId, type) {
  return api('POST', `/api/trees/${treeId}/relationships`, {
    fromPersonId: fromId, toPersonId: toId, type
  });
}

const maleNames = ['Александр','Дмитрий','Максим','Иван','Андрей','Сергей','Николай','Владимир','Павел','Михаил','Борис','Виктор','Олег','Евгений','Артём','Роман','Тимофей','Фёдор','Григорий','Степан','Константин','Юрий','Василий','Пётр','Алексей','Илья','Кирилл','Даниил','Матвей','Лев'];
const femaleNames = ['Елена','Мария','Анна','Ольга','Наталья','Татьяна','Ирина','Светлана','Екатерина','Валентина','Людмила','Галина','Вера','Надежда','Любовь','Марина','Юлия','Алина','Дарья','Ксения','Варвара','Софья','Полина','Александра','Евгения'];
const lastNames = ['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Волков','Соколов','Лебедев','Кузнецов'];

let nameCounter = 0;
function nextMale(lastName) { return { first: maleNames[nameCounter % maleNames.length], last: lastName || lastNames[Math.floor(nameCounter / 2) % lastNames.length] }; }
function nextFemale(lastName) { return { first: femaleNames[nameCounter % femaleNames.length], last: (lastName || lastNames[Math.floor(nameCounter / 2) % lastNames.length]) + 'а' }; }

async function createHugeTree() {
  await login();
  await api('POST', '/api/trees', { title: 'Огромное Тестовое Древо', description: 'Стресс-тест: 150+ человек' }).then(t => { treeId = t.id; });
  console.log('Tree created:', treeId);

  const persons = []; // { id, gen, lastName }
  let relCount = 0;

  // Gen 0: 1 founding couple
  console.log('Gen 0...');
  const g0m = await addPerson('Александр', 'Иванов', 'MALE', 1920);
  const g0f = await addPerson('Елена', 'Иванова', 'FEMALE', 1923);
  await addRelationship(g0m.id, g0f.id, 'SPOUSE'); relCount++;
  persons.push({ id: g0m.id, gen: 0, lastName: 'Иванов' }, { id: g0f.id, gen: 0, lastName: 'Иванов' });

  // Gen 1: 4 children (2 couples)
  console.log('Gen 1...');
  const gen1Children = [];
  for (let i = 0; i < 4; i++) {
    const name = i % 2 === 0 ? nextMale('Иванов') : nextFemale('Иванов');
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const p = await addPerson(name.first, name.last, gender, 1945 + i * 3);
    await addRelationship(g0m.id, p.id, 'PARENT'); relCount++;
    await addRelationship(g0f.id, p.id, 'PARENT'); relCount++;
    gen1Children.push(p);
    persons.push({ id: p.id, gen: 1, lastName: name.last });
  }
  // Pair them up as couples
  await addRelationship(gen1Children[0].id, gen1Children[1].id, 'SPOUSE'); relCount++;
  await addRelationship(gen1Children[2].id, gen1Children[3].id, 'SPOUSE'); relCount++;

  // Gen 2: Each couple has 4 children (16 people)
  console.log('Gen 2...');
  const gen2Couples = [];
  for (let c = 0; c < 2; c++) {
    const parent1 = gen1Children[c * 2];
    const parent2 = gen1Children[c * 2 + 1];
    const children = [];
    for (let i = 0; i < 4; i++) {
      const name = i % 2 === 0 ? nextMale(parent1.lastName) : nextFemale(parent1.lastName);
      const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      const p = await addPerson(name.first, name.last, gender, 1965 + c * 4 + i);
      await addRelationship(parent1.id, p.id, 'PARENT'); relCount++;
      await addRelationship(parent2.id, p.id, 'PARENT'); relCount++;
      children.push(p);
      persons.push({ id: p.id, gen: 2, lastName: name.last });
    }
    // Pair gen2 children into couples
    for (let i = 0; i < 4; i += 2) {
      await addRelationship(children[i].id, children[i + 1].id, 'SPOUSE'); relCount++;
      gen2Couples.push([children[i], children[i + 1]]);
    }
  }

  // Gen 3: Each gen2 couple has 4 children (32 people)
  console.log('Gen 3...');
  const gen3Couples = [];
  for (const [p1, p2] of gen2Couples) {
    const children = [];
    for (let i = 0; i < 4; i++) {
      const name = i % 2 === 0 ? nextMale(p1.lastName) : nextFemale(p1.lastName);
      const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      const p = await addPerson(name.first, name.last, gender, 1985 + Math.random() * 10 | 0);
      await addRelationship(p1.id, p.id, 'PARENT'); relCount++;
      await addRelationship(p2.id, p.id, 'PARENT'); relCount++;
      children.push(p);
      persons.push({ id: p.id, gen: 3, lastName: name.last });
    }
    for (let i = 0; i < 4; i += 2) {
      await addRelationship(children[i].id, children[i + 1].id, 'SPOUSE'); relCount++;
      gen3Couples.push([children[i], children[i + 1]]);
    }
  }

  // Gen 4: Each gen3 couple has 3 children (~48 people)
  console.log('Gen 4...');
  for (const [p1, p2] of gen3Couples) {
    for (let i = 0; i < 3; i++) {
      const name = i % 2 === 0 ? nextMale(p1.lastName) : nextFemale(p1.lastName);
      const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      const p = await addPerson(name.first, name.last, gender, 2005 + Math.random() * 10 | 0);
      await addRelationship(p1.id, p.id, 'PARENT'); relCount++;
      await addRelationship(p2.id, p.id, 'PARENT'); relCount++;
      persons.push({ id: p.id, gen: 4, lastName: name.last });
    }
  }

  // Gen 5: A few more (~15 people from first few gen4 couples)
  console.log('Gen 5...');
  const gen4Persons = persons.filter(p => p.gen === 4);
  for (let i = 0; i < Math.min(10, gen4Persons.length - 1); i += 2) {
    const p1 = gen4Persons[i];
    const p2 = gen4Persons[i + 1];
    if (p1.lastName === p2.lastName || true) {
      await addRelationship(p1.id, p2.id, 'SPOUSE'); relCount++;
      for (let j = 0; j < 2; j++) {
        const name = nextMale(p1.lastName);
        const p = await addPerson(name.first, name.last, 'MALE', 2022 + j);
        await addRelationship(p1.id, p.id, 'PARENT'); relCount++;
        await addRelationship(p2.id, p.id, 'PARENT'); relCount++;
        persons.push({ id: p.id, gen: 5, lastName: name.last });
      }
    }
  }

  console.log('\n=== DONE ===');
  console.log(`Tree ID: ${treeId}`);
  console.log(`URL: ${BASE}/trees/${treeId}`);
  console.log(`Total persons: ${persons.length}`);
  console.log(`Total relationships: ${relCount}`);

  // Verify
  const graph = await api('GET', `/api/trees/${treeId}/graph`);
  console.log(`Graph nodes: ${graph.nodes.length}`);
  console.log(`Graph edges: ${graph.edges.length}`);
}

createHugeTree().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
