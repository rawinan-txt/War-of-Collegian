// Team Builder collection: search / filter / sort, empty state, state persistence. UI only; hero data is never modified.
// Filter contract (friend's redesign): { q, fac, role: DPS|Tank|Healer|Support, minStar: 1..5, sort: default|star|cost|fac, sortDir: asc|desc }.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./harness');

const J = (g, code) => JSON.parse(g.run(`JSON.stringify(${code})`));
const ids = (g, state) => J(g, `filterHeroes(heroes, Object.assign({q:'',fac:'',role:'',minStar:1,sort:'default',sortDir:'asc'}, ${JSON.stringify(state)})).map(h=>h.id)`);
const html = (g, id) => g.run(`document.getElementById('${id}').innerHTML`);

test('no filters: every hero in the original data order, nothing mutated', () => {
  const g = loadGame(1);
  const all = J(g, 'heroes.map(h=>h.id)');
  assert.deepEqual(ids(g, {}), all);
  assert.equal(all.length, 12);
  g.run("filterHeroes(heroes,{q:'',fac:'',role:'',minStar:1,sort:'cost',sortDir:'desc'})");
  assert.deepEqual(J(g, 'heroes.map(h=>h.id)'), all, 'sorting works on a copy');
});

test('search matches name, skill, description and faculty code (case-insensitive, Thai too)', () => {
  const g = loadGame(1);
  assert.deepEqual(ids(g, { q: 'bug' }), ['bug']);
  assert.deepEqual(ids(g, { q: 'ICT' }), ['bug']);
  assert.deepEqual(ids(g, { q: 'infinite' }), ['bug']);
  assert.deepEqual(ids(g, { q: 'ติดพิษ' }), ['chem']);
  assert.deepEqual(ids(g, { q: '  SONIC ' }), ['music']);
  assert.deepEqual(ids(g, { q: 'zzz' }), []);
});

test('faculty, role and minimum-star filters combine; every hero has exactly one of the four roles', () => {
  const g = loadGame(1);
  assert.deepEqual(ids(g, { fac: 'SC' }), ['lab']);
  assert.ok(ids(g, { role: 'Healer' }).includes('night'));
  assert.ok(ids(g, { role: 'Tank' }).includes('mecha'));
  const byRole = ['DPS', 'Tank', 'Healer', 'Support'].map((r) => ids(g, { role: r }));
  assert.equal(byRole.flat().length, 12, 'the four roles partition the roster');
  assert.equal(new Set(byRole.flat()).size, 12);
  assert.deepEqual(ids(g, { minStar: 5 }), ['public', 'nurse']);
  assert.deepEqual(ids(g, { minStar: 4 }).sort(), ['dental', 'global', 'music', 'nurse', 'public', 'runner']);
  assert.deepEqual(ids(g, { minStar: 5, fac: 'NS' }), ['nurse']);
  assert.equal(ids(g, { minStar: 1 }).length, 12, 'one star and up filters nothing');
  assert.deepEqual(ids(g, { minStar: 5, role: 'DPS' }), ids(g, { minStar: 5 }).filter((id) => ids(g, { role: 'DPS' }).includes(id)));
});

test('sort: star, cost, faculty in either direction (ascending / descending); ties are stable and deterministic', () => {
  const g = loadGame(1);
  const col = (sort, dir, f) => J(g, `filterHeroes(heroes,{q:'',fac:'',role:'',minStar:1,sort:'${sort}',sortDir:'${dir}'}).map(h=>h.${f})`);
  const star = col('star', 'asc', 'star'), costD = col('cost', 'desc', 'cost'), fac = col('fac', 'asc', 'f');
  assert.deepEqual(star, [...star].sort((a, b) => a - b));
  assert.deepEqual(col('star', 'desc', 'star'), [...star].reverse());
  assert.deepEqual(costD, [...costD].sort((a, b) => b - a));
  assert.deepEqual(fac, [...fac].sort());
  assert.deepEqual(ids(g, { sort: 'star', sortDir: 'desc' }), ids(g, { sort: 'star', sortDir: 'desc' }));
});

test('renderTeam shows the filtered list, the count note and the empty state', () => {
  const g = loadGame(1);
  g.run('renderTeam()');
  assert.equal((html(g, 'teamGrid').match(/class="ccard /g) || []).length, 12);
  assert.equal((html(g, 'teamSlots').match(/class="tslot/g) || []).length, 6);
  g.run("tbSet('q','angel')");
  assert.equal((html(g, 'teamGrid').match(/class="ccard /g) || []).length, 1);
  assert.match(g.run("document.getElementById('tbCountNote').textContent"), /แสดง 1 จาก 12/);
  g.run("tbSet('q','zzz')");
  assert.match(html(g, 'teamGrid'), /tb-empty/);
  assert.match(html(g, 'teamGrid'), /tbClear\(\)/);
  assert.equal(g.run("document.getElementById('startBtn').disabled"), false, 'a filter never blocks Start (the 6-hero team is unchanged)');
});

test('filters persist while the team changes; chips toggle off on a second click; sort toggles direction; tbClear resets everything', () => {
  const g = loadGame(1);
  g.run("tbSet('fac','SC');toggleHero('chem');toggleHero('lab')");
  assert.equal(g.run('TB.fac'), 'SC', 'filter state survives team edits');
  g.run("tbSet('fac','SC')");
  assert.equal(g.run('TB.fac'), '', 'same chip again clears it');
  g.run("tbSet('sort','cost')");
  assert.equal(g.run("TB.sort+':'+TB.sortDir"), 'cost:desc', 'a new sort starts descending');
  g.run("tbSet('sort','cost')");
  assert.equal(g.run("TB.sort+':'+TB.sortDir"), 'cost:asc', 'the same sort again flips the direction');
  g.run("tbSet('role','Tank');tbSetStar(5);tbSet('q','x')");
  assert.equal(g.run('TB.minStar'), 5);
  g.run('tbClear()');
  assert.equal(g.run("JSON.stringify([TB.q,TB.fac,TB.role,TB.minStar,TB.sort,TB.sortDir])"), '["","","",1,"default","asc"]');
});

test('selection rules are unchanged: max 6, mixed faculties allowed, full team dims the rest', () => {
  const g = loadGame(1);
  g.run("team=['bug','mecha','lab','night','animal','music'];renderTeam()");
  g.run("toggleHero('chem')");
  assert.equal(g.run('team.length'), 6, 'a 7th hero is not added');
  assert.match(html(g, 'teamGrid'), /ccard r3  full/, 'unselected cards are dimmed when the team is full');
  g.run("toggleHero('bug');toggleHero('chem')");
  assert.ok(J(g, "team.includes('chem')") && !J(g, "team.includes('bug')"), 'swapping works across faculties');
});

test('deploy cards keep their ids and gain rarity + state classes', () => {
  const g = loadGame(1);
  g.run("startBattle(7)");
  const cards = html(g, 'battleCards');
  for (const id of ['bug', 'mecha', 'lab', 'night', 'animal', 'music']) {
    assert.match(cards, new RegExp(`id="card-${id}"`));
    assert.match(cards, new RegExp(`id="cd-${id}"`));
    assert.match(cards, new RegExp(`id="cdf-${id}"`));
  }
  assert.match(cards, /unitbtn r1 ready/);
  assert.match(cards, /unitbtn r4 ready/);
});
