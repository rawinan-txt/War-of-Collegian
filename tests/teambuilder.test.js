// Team Builder collection: search / filter / sort, empty state, state persistence. UI only; hero data is never modified.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./harness');

const J = (g, code) => JSON.parse(g.run(`JSON.stringify(${code})`));
const ids = (g, state) => J(g, `filterHeroes(heroes, Object.assign({q:'',fac:'',role:'',stars:{},sort:'default'}, ${JSON.stringify(state)})).map(h=>h.id)`);
const html = (g, id) => g.run(`document.getElementById('${id}').innerHTML`);

test('no filters: every hero in the original data order, nothing mutated', () => {
  const g = loadGame(1);
  const all = J(g, 'heroes.map(h=>h.id)');
  assert.deepEqual(ids(g, {}), all);
  assert.equal(all.length, 12);
  g.run("filterHeroes(heroes,{q:'',fac:'',role:'',stars:{},sort:'cost'})");
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

test('faculty, role and star filters combine; star filter is multi-select', () => {
  const g = loadGame(1);
  assert.deepEqual(ids(g, { fac: 'SC' }), ['lab']);
  assert.deepEqual(ids(g, { role: 'heal' }), ['night']);
  assert.deepEqual(ids(g, { stars: { 5: true } }), ['public', 'nurse']);
  assert.deepEqual(ids(g, { stars: { 1: true, 5: true } }).sort(), ['bug', 'nurse', 'public']);
  assert.deepEqual(ids(g, { stars: { 5: true }, fac: 'NS' }), ['nurse']);
  assert.deepEqual(ids(g, { stars: { 5: false } }).length, 12, 'an unticked star filters nothing');
});

test('sort: star (high first), cost (low first), faculty (A to Z); ties are stable and deterministic', () => {
  const g = loadGame(1);
  const star = J(g, "filterHeroes(heroes,{q:'',fac:'',role:'',stars:{},sort:'star'}).map(h=>h.star)");
  assert.deepEqual(star, [...star].sort((a, b) => b - a));
  const cost = J(g, "filterHeroes(heroes,{q:'',fac:'',role:'',stars:{},sort:'cost'}).map(h=>h.cost)");
  assert.deepEqual(cost, [...cost].sort((a, b) => a - b));
  const fac = J(g, "filterHeroes(heroes,{q:'',fac:'',role:'',stars:{},sort:'fac'}).map(h=>h.f)");
  assert.deepEqual(fac, [...fac].sort());
  assert.deepEqual(ids(g, { sort: 'star' }), ids(g, { sort: 'star' }));
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

test('filters persist while the team changes and reset with tbClear; fac/role chips toggle off on a second click', () => {
  const g = loadGame(1);
  g.run("tbSet('fac','SC');toggleHero('chem');toggleHero('lab')");
  assert.equal(g.run('TB.fac'), 'SC', 'filter state survives team edits');
  g.run("tbSet('fac','SC')");
  assert.equal(g.run('TB.fac'), '', 'same chip again clears it');
  g.run("tbSet('role','tank');tbStar(5);tbSet('sort','cost');tbSet('q','x')");
  g.run('tbClear()');
  assert.equal(g.run("JSON.stringify([TB.q,TB.fac,TB.role,TB.sort,Object.keys(TB.stars).filter(k=>TB.stars[k])])"), '["","","","default",[]]');
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
