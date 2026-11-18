const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

const near = (a, b, eps = 0.5) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b}`);
const stat = (g, id, key) => g.run(`CombatStats.getCharacterStats('${id}').${key}`);

function setup(team) {
  const g = loadGame();
  g.run(`${team ? `team=${JSON.stringify(team)};` : ''}startBattle();battle.at=5000`);
  return g;
}
function addEnemy(g, x, hp = 1000, type = 'basic') {
  g.run(`spawnEnemy('${type}');{const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=${hp};e.x=${x}}`);
}

test('normal hit credits actual HP damage to the source hero', () => {
  const g = setup();
  addEnemy(g, 400);
  g.run("damage(battle.enemies[0],100,'bug')");
  assert.equal(stat(g, 'bug', 'totalDamage'), 100);
});

test('overkill is not counted', () => {
  const g = setup();
  addEnemy(g, 400, 100);
  g.run("damage(battle.enemies[0],500,'bug')");
  assert.equal(stat(g, 'bug', 'totalDamage'), 100);
});

test('damage absorbed by an enemy shield is not HP damage', () => {
  const g = setup();
  addEnemy(g, 400, 1350, 'tank'); // enemy tank starts with a 160 shield
  g.run("damage(battle.enemies[0],100,'bug')");
  assert.equal(stat(g, 'bug', 'totalDamage'), 0);
  g.run("damage(battle.enemies[0],100,'bug')");
  assert.equal(stat(g, 'bug', 'totalDamage'), 40);
});

test('AoE splash damage is credited to the AoE hero', () => {
  const g = setup();
  g.run("deploy('lab')");
  g.run('{const x=battle.units[0].x;spawnEnemy(\'basic\');spawnEnemy(\'basic\');battle.enemies.forEach((e,i)=>{e.hp=e.maxHp=100000;e.x=x+100+i*20})}');
  tick(g, 0.3);
  near(stat(g, 'lab', 'totalDamage'), 85 + 85 * 0.48, 0.01);
});

test('damage over time keeps its source even after the source dies', () => {
  const g = setup(['chem', 'bug', 'lab', 'night', 'animal', 'music']);
  addEnemy(g, 600, 100000);
  g.run("battle.enemies[0].poison=2;battle.enemies[0].poisonSource='chem'");
  tick(g, 2);
  near(stat(g, 'chem', 'totalDamage'), 26, 1);
});

test('summoned dog damage is credited to the summoner, even after the summoner dies', () => {
  const g = setup();
  g.run("deploy('animal')");
  tick(g, 0.1);
  assert.equal(g.run("battle.units.some(u=>u.id==='dog')"), true);
  g.run("{const a=battle.units.find(u=>u.id==='animal');a.atk=0;a.alive=false}");
  g.run("{const d=battle.units.find(u=>u.id==='dog');spawnEnemy('basic');const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=100000;e.x=d.x+20}");
  tick(g, 0.5);
  assert.ok(stat(g, 'animal', 'totalDamage') >= 33);
  assert.equal(g.run("CombatStats.getCharacterStats('dog')"), null);
});

test('deployCount aggregates by character type', () => {
  const g = setup();
  g.run("deploy('bug')");
  tick(g, 4);
  g.run("battle.at=5000;deploy('bug')");
  assert.equal(stat(g, 'bug', 'deploymentCount'), 2);
});

test('startBattle resets all statistics', () => {
  const g = setup();
  addEnemy(g, 400);
  g.run("damage(battle.enemies[0],100,'bug');CombatStats.recordHealing('bug',5);CombatStats.recordDefense('bug',5)");
  g.run('startBattle()');
  assert.equal(stat(g, 'bug', 'totalDamage'), 0);
  assert.equal(stat(g, 'bug', 'totalHealing'), 0);
  assert.equal(stat(g, 'bug', 'totalDefense'), 0);
  assert.equal(g.run('CombatStats.laserDamage'), 0);
});

test('base skill damage is kept separate from hero damage', () => {
  const g = setup();
  addEnemy(g, 400);
  g.run('baseSkill()');
  assert.equal(g.run('CombatStats.laserDamage'), 500);
  assert.equal(stat(g, 'bug', 'totalDamage'), 0);
});

test('getAllCharacterStats lists every team hero with name and faculty', () => {
  const g = setup();
  const all = g.run('JSON.parse(JSON.stringify(CombatStats.getAllCharacterStats()))');
  assert.equal(all.length, 6);
  assert.deepEqual(Object.keys(all[0]).sort(), ['characterId', 'characterName', 'deploymentCount', 'facultyId', 'totalDamage', 'totalDefense', 'totalHealing']);
  assert.equal(all[0].characterName, 'Bug Hunter');
  assert.equal(all[0].facultyId, 'ICT');
});
