const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

const ids = (g, team) => g.run(`calcSynergies(${JSON.stringify(team)}).map(s=>s.id)`);

const TECH = ['bug', 'mecha', 'lab', 'night', 'animal', 'music'];
const HEALTH = ['night', 'chem', 'nurse', 'public', 'bug', 'lab'];
const CAMPUS = ['music', 'runner', 'bug', 'lab', 'night', 'animal'];

test('Tech Alliance needs both ICT and EG heroes', () => {
  const g = loadGame();
  assert.ok(ids(g, TECH).includes('tech_alliance'));
  assert.ok(!ids(g, ['bug', 'lab', 'night', 'animal', 'music', 'chem']).includes('tech_alliance'));
});

test('Healthcare Network needs at least 3 healthcare-group heroes', () => {
  const g = loadGame();
  assert.ok(ids(g, HEALTH).includes('healthcare'));
  assert.ok(!ids(g, ['night', 'chem', 'bug', 'lab', 'animal', 'music']).includes('healthcare'));
});

test('Campus Life needs at least 2 campus-group heroes', () => {
  const g = loadGame();
  assert.ok(ids(g, CAMPUS).includes('campus_life'));
  assert.ok(!ids(g, ['music', 'bug', 'lab', 'night', 'animal', 'chem']).includes('campus_life'));
});

test('team with no synergy returns empty list', () => {
  const g = loadGame();
  assert.deepEqual(ids(g, ['lab', 'animal', 'dental', 'music', 'bug', 'night']), []);
});

function healedHp(team, faculty) {
  const g = loadGame();
  g.run(`team=${JSON.stringify(team)};faculty='${faculty}';startBattle()`);
  g.run("deploy('night')");
  g.run("const d=makeUnit(heroes.find(h=>h.id==='mecha'),true,battle.units[0].x+10);d.hp=100;battle.units.push(d)");
  tick(g, 0.3);
  return g.run('battle.units[1].hp');
}

test('Healthcare Network boosts heal by 12%', () => {
  assert.ok(Math.abs(healedHp(HEALTH, 'ICT') - (100 + 185 * 1.12)) < 0.01);
  assert.ok(Math.abs(healedHp(['night', 'chem', 'bug', 'lab', 'animal', 'music'], 'ICT') - 285) < 0.01);
});

test('player faculty does not change synergy effects', () => {
  assert.equal(healedHp(HEALTH, 'ICT'), healedHp(HEALTH, 'MT'));
});

test('Campus Life reduces deploy cooldown by 8%', () => {
  const g = loadGame();
  g.run(`team=${JSON.stringify(CAMPUS)};startBattle();battle.at=1000`);
  g.run("deploy('music')");
  assert.ok(Math.abs(g.run("battle.cd['music']") - 12 * 0.92) < 1e-9);
});

function firstHit(heroId, team) {
  const g = loadGame();
  g.run(`team=${JSON.stringify(team)};startBattle();battle.at=1000`);
  g.run(`deploy('${heroId}')`);
  g.run("spawnEnemy('basic');const e=battle.enemies[0];e.hp=e.maxHp=100000;e.x=battle.units[0].x+100");
  tick(g, 0.3);
  return g.run(`battle.damageDone['${heroId}']`);
}

test('Tech Alliance: ICT hero +10% damage, other heroes unchanged', () => {
  assert.ok(Math.abs(firstHit('bug', TECH) - 39 * 1.1) < 1e-6);
  assert.ok(Math.abs(firstHit('lab', TECH) - 85) < 1e-6);
});
