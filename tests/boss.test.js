const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

function setup() {
  const g = loadGame();
  g.run('startBattle()');
  g.run("spawnEnemy('boss')");
  return g;
}
const boss = (g, expr) => g.run(`battle.enemies.find(e=>e.type==='boss').${expr}`);
const setBossHp = (g, ratio) => g.run(`{const e=battle.enemies.find(e=>e.type==='boss');e.hp=e.maxHp*${ratio}}`);
// stationary ally so telegraph impact is isolated
const addDummyAlly = (g, x) =>
  g.run(`{const d=makeUnit(heroes.find(h=>h.id==='bug'),true,${x});d.spd=0;battle.units.push(d)}`);

test('boss spawns in phase 1 with no warnings', () => {
  const g = setup();
  assert.equal(boss(g, 'phase'), 1);
  assert.equal(g.run('battle.warnings.length'), 0);
});

test('below 50% HP boss enters phase 2 and telegraphs Exam Paper Rain', () => {
  const g = setup();
  setBossHp(g, 0.49);
  tick(g, 0.6);
  assert.equal(boss(g, 'phase'), 2);
  assert.ok(g.run('battle.warnings.length') > 0);
});

test('rain impact damages allies in range (160) only after the telegraph delay', () => {
  const g = setup();
  setBossHp(g, 0.49);
  tick(g, 0.6);
  const x = g.run('battle.warnings[0].x');
  addDummyAlly(g, x);
  const idx = g.run('battle.units.length-1');
  const full = g.run(`battle.units[${idx}].maxHp`);
  assert.equal(g.run(`battle.units[${idx}].hp`), full);
  tick(g, 1.2);
  assert.equal(g.run(`battle.units[${idx}].hp`), full - 160);
});

test('below 20% HP boss enters Overtime exactly once (atk x1.3, interval x0.5)', () => {
  const g = setup();
  setBossHp(g, 0.19);
  tick(g, 10);
  assert.equal(boss(g, 'phase'), 3);
  assert.ok(Math.abs(boss(g, 'atk') - 150 * 1.3) < 1e-9);
  assert.ok(Math.abs(boss(g, 'interval') - 0.9) < 1e-9);
});

test('a single big hit from full HP to 10% ends in phase 3 with one Overtime', () => {
  const g = setup();
  g.run("damage(battle.enemies.find(e=>e.type==='boss'),5760,'x')");
  tick(g, 0.2);
  assert.equal(boss(g, 'phase'), 3);
  assert.ok(Math.abs(boss(g, 'atk') - 195) < 1e-9);
});

test('killing the boss clears pending warnings so allies are not hit afterwards', () => {
  const g = setup();
  setBossHp(g, 0.49);
  tick(g, 0.6);
  const x = g.run('battle.warnings[0].x');
  addDummyAlly(g, x);
  const idx = g.run('battle.units.length-1');
  const full = g.run(`battle.units[${idx}].maxHp`);
  g.run("damage(battle.enemies.find(e=>e.type==='boss'),999999,'x')");
  tick(g, 2);
  assert.equal(g.run('battle.warnings.length'), 0);
  assert.equal(g.run(`battle.units[${idx}].hp`), full);
});

test('restarting battle clears warnings', () => {
  const g = setup();
  setBossHp(g, 0.49);
  tick(g, 0.6);
  g.run('startBattle()');
  assert.equal(g.run('battle.warnings.length'), 0);
});
