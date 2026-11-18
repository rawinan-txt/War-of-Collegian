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

// ---- Task 2: DEF (shield absorption) and effective HEAL ----
const allyAt = (g, id, x, extra = '') =>
  g.run(`{const d=makeUnit(heroes.find(h=>h.id==='${id}'),true,${x});d.spd=0;${extra};battle.units.push(d)}`);
const TEAM_SH = ['mecha', 'public', 'bug', 'night', 'nurse', 'animal'];

test('shield absorption is DEF for the provider; only the overflow is HP damage', () => {
  const g = setup(TEAM_SH);
  allyAt(g, 'bug', 300, "d.shield=200;d.shieldSrc={mecha:200}");
  const hp0 = g.run('battle.units[0].hp');
  g.run('damage(battle.units[0],300,null)');
  assert.equal(stat(g, 'mecha', 'totalDefense'), 200);
  assert.equal(g.run('battle.units[0].hp'), hp0 - 100);
  assert.equal(g.run('battle.units[0].shield'), 0);
});

test("a tank's own Emergency Barrier credits itself", () => {
  const g = setup(TEAM_SH);
  g.run("deploy('mecha')");
  g.run('damage(battle.units[0],500,null)');
  assert.equal(stat(g, 'mecha', 'totalDefense'), 160);
});

test("Health Guardian's zone shield on an ally credits Health Guardian", () => {
  const g = setup(TEAM_SH);
  g.run("deploy('public');deploy('bug')");
  tick(g, 3);
  const shield = g.run("battle.units.find(u=>u.id==='bug').shield");
  assert.ok(shield > 10, `shield ${shield}`);
  g.run("damage(battle.units.find(u=>u.id==='bug'),10,null)");
  near(stat(g, 'public', 'totalDefense'), 10, 1e-9);
  assert.equal(stat(g, 'bug', 'totalDefense'), 0);
  assert.equal(stat(g, 'mecha', 'totalDefense'), 0);
});

test('two providers: DEF split by what each absorbed, total equals shield lost', () => {
  const g = setup(TEAM_SH);
  allyAt(g, 'bug', 300, "d.shield=100;d.shieldSrc={mecha:60,public:40}");
  g.run('damage(battle.units[0],80,null)');
  near(stat(g, 'mecha', 'totalDefense'), 60, 1e-9);
  near(stat(g, 'public', 'totalDefense'), 20, 1e-9);
  near(g.run('battle.units[0].shield'), 20, 1e-9);
});

test('a shield that is never hit gives no DEF; zero damage records nothing', () => {
  const g = setup(TEAM_SH);
  g.run("deploy('mecha')");
  tick(g, 2);
  g.run('damage(battle.units[0],0,null)');
  assert.equal(stat(g, 'mecha', 'totalDefense'), 0);
});

test('healing at full HP records nothing', () => {
  const g = setup(TEAM_SH);
  g.run("deploy('night')");
  tick(g, 2);
  assert.equal(stat(g, 'night', 'totalHealing'), 0);
});

test('overheal is excluded: 185 heal on 100 missing HP records 100', () => {
  const g = setup(TEAM_SH);
  g.run("deploy('night')");
  allyAt(g, 'mecha', g.run('battle.units[0].x+10'), 'd.hp=d.maxHp-100');
  tick(g, 0.3);
  assert.equal(stat(g, 'night', 'totalHealing'), 100);
  assert.equal(g.run('battle.units[1].hp'), g.run('battle.units[1].maxHp'));
});

test('mass heal credits each target its effective amount', () => {
  const g = setup(['nurse', 'bug', 'lab', 'mecha', 'animal', 'music']); // no Healthcare Network
  g.run("deploy('nurse')");
  const x = g.run('battle.units[0].x');
  allyAt(g, 'mecha', x + 10, 'd.hp=d.maxHp-50');
  allyAt(g, 'mecha', x + 20, 'd.hp=d.maxHp-150');
  allyAt(g, 'mecha', x + 30, 'd.hp=d.maxHp-400');
  tick(g, 0.3);
  assert.equal(stat(g, 'nurse', 'totalHealing'), 50 + 150 + 150);
});

test('Healthcare Network multiplier applies before the overheal cap', () => {
  const g = setup(['night', 'chem', 'nurse', 'public', 'bug', 'lab']);
  g.run("deploy('night')");
  allyAt(g, 'mecha', g.run('battle.units[0].x+10'), 'd.hp=d.maxHp-300');
  tick(g, 0.3);
  near(stat(g, 'night', 'totalHealing'), 185 * 1.12, 1e-9);
});
