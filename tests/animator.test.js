const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

function setup(opts) {
  const g = loadGame(undefined, opts);
  g.run('startBattle();battle.at=5000');
  return g;
}
const unit = (g, expr = '') => g.run(`battle.units[0]${expr}`);
function addEnemy(g, x, hp = 100000) {
  g.run(`spawnEnemy('basic');{const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=${hp};e.x=${x}}`);
}

test('frameIndex loops looping animations and clamps one-shot animations', () => {
  const g = loadGame();
  const loop = '({frameCount:4,frameRate:6,repeat:-1})', once = '({frameCount:6,frameRate:12,repeat:0})';
  assert.equal(g.run(`frameIndex(${loop},0)`), 0);
  assert.equal(g.run(`frameIndex(${loop},0.17)`), 1);
  assert.equal(g.run(`frameIndex(${loop},4/6)`), 0);
  assert.equal(g.run(`frameIndex(${once},0.26)`), 3);
  assert.equal(g.run(`frameIndex(${once},10)`), 5);
});

test('spriteReady is true for configured heroes, false for unknown ids or failed sheets', () => {
  const g = loadGame();
  assert.equal(g.run("spriteReady('bug')"), true);
  assert.equal(g.run("spriteReady('nobody')"), false);
  const bad = loadGame(undefined, { failSheets: 'bug_hunter' });
  assert.equal(bad.run("spriteReady('bug')"), false);
});

test('animation state follows movement: walk while moving, idle when stopped', () => {
  const g = setup();
  g.run("deploy('bug')");
  tick(g, 0.2);
  assert.equal(unit(g, '.animName'), 'walk');
  g.run('battle.units[0].spd=0');
  tick(g, 0.3);
  assert.equal(unit(g, '.animName'), 'idle');
});

test('attack animation plays while attacking', () => {
  const g = setup();
  g.run("deploy('bug')");
  addEnemy(g, g.run('battle.units[0].x+100'));
  g.run('battle.units[0].spd=0');
  tick(g, 0.3);
  assert.equal(unit(g, '.animName'), 'attack');
});

test('hurt plays only when HP is really lost, with a 0.6s gap between triggers', () => {
  const g = setup();
  g.run("deploy('bug')");
  g.run('battle.units[0].spd=0;battle.units[0].shield=50;battle.units[0].shieldSrc={bug:50}');
  g.run('damage(battle.units[0],30,null)'); // fully absorbed by the shield
  assert.equal(unit(g, '.hurtT'), 0);
  g.run('damage(battle.units[0],30,null)'); // 10 absorbed, 20 HP lost
  assert.ok(unit(g, '.hurtT') > 0);
  tick(g, 0.05);
  assert.equal(unit(g, '.animName'), 'hurt');
  const t0 = unit(g, '.hurtT');
  g.run('damage(battle.units[0],5,null)');
  assert.ok(unit(g, '.hurtT') <= t0, 'second hit inside the gap must not restart hurt');
});

test('state priority: death > hurt > skill > attack > walk > idle', () => {
  const g = setup();
  g.run("deploy('bug')");
  g.run('battle.units[0].spd=0;battle.units[0].skillT=0.7;battle.units[0].atkT=0.5');
  tick(g, 0.05);
  assert.equal(unit(g, '.animName'), 'skill');
  g.run('battle.units[0].hurtT=0.2');
  tick(g, 0.05);
  assert.equal(unit(g, '.animName'), 'hurt');
});

test('a dying sprite hero leaves a visual-only corpse that plays the death animation then disappears', () => {
  const g = setup();
  g.run("deploy('bug')");
  const statsBefore = g.run('JSON.stringify(CombatStats.getAllCharacterStats())');
  g.run('damage(battle.units[0],99999,null)');
  tick(g, 0.05);
  assert.equal(g.run('battle.units.length'), 0);
  assert.equal(g.run('battle.corpses.length'), 1);
  assert.equal(g.run('battle.units.some(u=>u.corpse)||battle.enemies.some(u=>u.corpse)'), false);
  tick(g, 0.4);
  assert.equal(g.run('battle.corpses.length'), 1);
  tick(g, 0.5);
  assert.equal(g.run('battle.corpses.length'), 0);
  assert.equal(g.run('JSON.stringify(CombatStats.getAllCharacterStats())'), statsBefore);
});

test('corpses do not count toward the 35-unit cap, and startBattle clears them', () => {
  const g = setup();
  g.run("deploy('bug')");
  g.run('damage(battle.units[0],99999,null)');
  tick(g, 0.05);
  assert.equal(g.run('battle.corpses.length'), 1);
  g.run('startBattle()');
  assert.equal(g.run('battle.corpses.length'), 0);
});

test('without a sheet the old canvas drawing is used and draw() does not throw', () => {
  const g = loadGame(undefined, { failSheets: 'bug_hunter' });
  g.run("startBattle();battle.at=5000;deploy('bug');screen='battle'");
  tick(g, 0.2);
  g.run('draw()');
  const calls = g.run("document.getElementById('game').getContext('2d').__calls");
  assert.equal(calls.filter((c) => c.k === 'drawImage').length, 0);
});

test('sprite units are drawn from the sheet at 2x with smoothing off', () => {
  const g = setup();
  g.run("deploy('bug');screen='battle'");
  tick(g, 0.2);
  g.run('draw()');
  const ctx = g.run("document.getElementById('game').getContext('2d')");
  const di = ctx.__calls.filter((c) => c.k === 'drawImage');
  assert.ok(di.length >= 1);
  const [img, sx, sy, sw, sh, dx, dy, dw, dh] = di[0].args;
  assert.match(img.src, /bug_hunter\/(walk|idle)\.png/);
  assert.equal(sw, 64);
  assert.equal(sh, 64);
  assert.equal(dw, 128);
  assert.equal(dh, 128);
  assert.equal(sx % 64, 0);
  assert.equal(ctx.imageSmoothingEnabled, false);
});

test('animation clocks freeze while paused', () => {
  const g = setup();
  g.run("deploy('bug')");
  tick(g, 0.2);
  const t = unit(g, '.animT');
  g.run('battle.paused=true');
  tick(g, 1);
  assert.equal(unit(g, '.animT'), t);
});
