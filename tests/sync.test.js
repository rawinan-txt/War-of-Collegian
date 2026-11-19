const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

const TEAM = ['bug', 'mecha', 'lab', 'night', 'animal', 'music'];
function setup(team = TEAM) {
  const g = loadGame();
  g.run(`team=${JSON.stringify(team)};startBattle();battle.at=5000`);
  return g;
}
function enemyNear(g, dx, hp = 100000) {
  g.run(`spawnEnemy('basic');{const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=${hp};e.x=battle.units[0].x+${dx};e.spd=0;e.atk=0}`);
}
const lost = (g, i = 0) => g.run(`battle.enemies[${i}].maxHp-battle.enemies[${i}].hp`);
const stopUnit = (g) => g.run('battle.units[0].spd=0');

test('melee damage lands once at the impact frame, not at attack start', () => {
  const g = setup();
  g.run("deploy('mecha')");
  stopUnit(g);
  enemyNear(g, 30);
  tick(g, 0.35);
  assert.equal(g.run('battle.units[0].atkT>0'), true, 'attack animation started');
  assert.equal(lost(g), 0, 'no damage before the impact frame');
  tick(g, 0.35);
  const hit = lost(g);
  assert.ok(Math.abs(hit - 38 * 0.85 * 1.1) < 1e-6, `one hit of ${hit}`);
  tick(g, 0.5); // many animation frames later, still exactly one hit
  assert.equal(lost(g), hit);
});

test('ranged damage lands only when the projectile arrives (later than melee)', () => {
  const g = setup();
  g.run("deploy('bug')");
  stopUnit(g);
  enemyNear(g, 150);
  tick(g, 0.55);
  assert.equal(lost(g), 0, 'projectile still in flight');
  assert.equal(g.run('battle.projectiles.length'), 1);
  tick(g, 0.5);
  assert.ok(Math.abs(lost(g) - 39 * 1.1) < 1e-6);
  assert.equal(g.run('battle.projectiles.length'), 0);
});

test('a projectile whose target died deals nothing and is removed', () => {
  const g = setup();
  g.run("deploy('bug')");
  stopUnit(g);
  enemyNear(g, 150);
  tick(g, 0.6);
  assert.equal(g.run('battle.projectiles.length'), 1);
  g.run("damage(battle.enemies[0],9999999,'x')");
  tick(g, 1);
  assert.equal(g.run('battle.projectiles.length'), 0);
  assert.equal(g.run("CombatStats.getCharacterStats('bug').totalDamage"), 0);
});

test('a launched projectile still credits its shooter after the shooter died', () => {
  const g = setup();
  g.run("deploy('bug')");
  stopUnit(g);
  enemyNear(g, 150);
  tick(g, 0.6);
  g.run('battle.units[0].alive=false');
  tick(g, 1);
  assert.ok(Math.abs(g.run("CombatStats.getCharacterStats('bug').totalDamage") - 39 * 1.1) < 1e-6);
});

test('an attacker killed before the melee impact deals nothing', () => {
  const g = setup();
  g.run("deploy('mecha')");
  stopUnit(g);
  enemyNear(g, 30);
  tick(g, 0.35);
  assert.equal(g.run('battle.units[0].atkT>0'), true);
  g.run('battle.units[0].alive=false');
  tick(g, 1);
  assert.equal(lost(g), 0);
});

test('stun cancels an unlaunched swing', () => {
  const g = setup();
  g.run("deploy('mecha')");
  stopUnit(g);
  enemyNear(g, 30);
  tick(g, 0.35);
  g.run('battle.units[0].stun=1');
  tick(g, 0.6);
  assert.equal(lost(g), 0);
});

test('attack cooldown equals the old formula (interval counted from attack start)', () => {
  const g = setup();
  g.run("deploy('mecha')");
  stopUnit(g);
  enemyNear(g, 30);
  tick(g, 0.35);
  const cd = g.run('battle.units[0].cd');
  assert.ok(cd > 1.1 && cd <= 1.3, `cd ${cd}`);
});

test('poison and slow apply at impact with the same numbers', () => {
  const g = setup(['chem', 'music', 'bug', 'lab', 'night', 'animal']);
  g.run("deploy('chem')");
  stopUnit(g);
  enemyNear(g, 120);
  tick(g, 0.3);
  assert.equal(g.run('battle.enemies[0].poison'), 0);
  tick(g, 0.7);
  assert.ok(g.run('battle.enemies[0].poison') > 3);
  const g2 = setup(['music', 'chem', 'bug', 'lab', 'night', 'animal']);
  g2.run("deploy('music')");
  stopUnit(g2);
  enemyNear(g2, 120);
  tick(g2, 0.3);
  assert.equal(g2.run('battle.enemies[0].slow'), 0);
  tick(g2, 0.7);
  assert.ok(g2.run('battle.enemies[0].slow') > 1);
});

test('heal pulse lands at its impact time, once', () => {
  const g = setup();
  g.run("deploy('night')");
  stopUnit(g);
  g.run("{const d=makeUnit(heroes.find(h=>h.id==='mecha'),true,battle.units[0].x+10);d.spd=0;d.hp=d.maxHp-300;battle.units.push(d)}");
  tick(g, 0.35);
  assert.equal(g.run('battle.units[1].maxHp-battle.units[1].hp'), 300, 'not healed yet');
  tick(g, 0.65);
  assert.equal(g.run('battle.units[1].maxHp-battle.units[1].hp'), 300 - 185);
});

test('the dog appears at the summon impact time, not instantly', () => {
  const g = setup();
  g.run("deploy('animal')");
  stopUnit(g);
  tick(g, 0.2);
  assert.equal(g.run("battle.units.some(u=>u.id==='dog')"), false);
  tick(g, 0.4);
  assert.equal(g.run("battle.units.some(u=>u.id==='dog')"), true);
});

test('units attacking the enemy base also land the hit on impact', () => {
  const g = setup();
  g.run("deploy('mecha')");
  g.run('battle.units[0].x=950;battle.units[0].spd=0');
  tick(g, 0.35);
  assert.equal(g.run('battle.enemyHp'), 6500);
  tick(g, 0.4);
  assert.ok(g.run('battle.enemyHp') < 6500);
});

test('pause freezes pending hits; resuming lets them land', () => {
  const g = setup();
  g.run("deploy('mecha')");
  stopUnit(g);
  enemyNear(g, 30);
  tick(g, 0.35);
  g.run('battle.paused=true');
  tick(g, 2);
  assert.equal(lost(g), 0);
  g.run('battle.paused=false');
  tick(g, 0.3);
  assert.ok(lost(g) > 0);
});

test('startBattle clears projectiles and pending hits', () => {
  const g = setup();
  g.run("deploy('bug')");
  stopUnit(g);
  enemyNear(g, 150);
  tick(g, 0.6);
  assert.equal(g.run('battle.projectiles.length'), 1);
  g.run('startBattle()');
  assert.equal(g.run('battle.projectiles.length'), 0);
});
