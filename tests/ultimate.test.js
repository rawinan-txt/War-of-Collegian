const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

function setup(ult = 'wifi') {
  const g = loadGame();
  g.run(`ultType='${ult}';startBattle()`);
  return g;
}
function addEnemy(g, x, hp = 1000) {
  g.run(`spawnEnemy('basic');{const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=${hp};e.x=${x}}`);
}

test('meter starts at 0 and useUltimate with empty meter does nothing', () => {
  const g = setup();
  addEnemy(g, 500);
  assert.equal(g.run('battle.ult'), 0);
  assert.equal(g.run('useUltimate()'), false);
  assert.equal(g.run('battle.enemies[0].stun'), 0);
});

test('meter gain: damage/20 to enemies, +8 per kill, damage/30 taken by allies, cap 100', () => {
  const g = setup();
  addEnemy(g, 500, 1000);
  g.run("damage(battle.enemies[0],400,'bug')");
  assert.equal(g.run('battle.ult'), 20);
  addEnemy(g, 500, 100);
  g.run("battle.ult=0;damage(battle.enemies[1],100,'bug')");
  assert.equal(g.run('battle.ult'), 5 + 8);
  g.run("battle.ult=0;battle.at=1000;deploy('bug');damage(battle.units[0],300,'x')");
  assert.equal(g.run('battle.ult'), 10);
  g.run("battle.ult=95;damage(battle.enemies[0],400,'bug')");
  assert.equal(g.run('battle.ult'), 100);
});

test('Wi-Fi Down stuns every enemy for 3s, resets meter, enemies do not move', () => {
  const g = setup('wifi');
  addEnemy(g, 500);
  addEnemy(g, 700);
  g.run('battle.ult=100');
  assert.equal(g.run('useUltimate()'), true);
  assert.equal(g.run('battle.ult'), 0);
  assert.equal(g.run('battle.enemies.every(e=>e.stun===3)'), true);
  tick(g, 1);
  assert.deepEqual(g.run('battle.enemies.map(e=>e.x)'), [500, 700]);
});

function enemyDisplacement(rain) {
  const g = setup(rain ? 'rain' : 'wifi');
  addEnemy(g, 700);
  if (rain) g.run('battle.ult=100;useUltimate()');
  tick(g, 1);
  return 700 - g.run('battle.enemies[0].x');
}

test('Salaya Rain slows enemies by 40%', () => {
  const base = enemyDisplacement(false);
  assert.ok(base > 0);
  assert.ok(enemyDisplacement(true) <= base * 0.6 + 1e-6);
});

test('Campus Shuttle damages each enemy once and knocks it back', () => {
  const g = setup('shuttle');
  addEnemy(g, 300, 1000);
  g.run('battle.ult=100;useUltimate()');
  tick(g, 1);
  assert.equal(g.run('battle.enemies[0].hp'), 600);
  assert.ok(g.run('battle.enemies[0].x') > 300);
  tick(g, 1);
  assert.equal(g.run('battle.enemies[0].hp'), 600);
});

test('Campus Shuttle with no enemies does not throw', () => {
  const g = setup('shuttle');
  g.run('battle.ult=100;useUltimate()');
  tick(g, 2);
  assert.equal(g.run('battle.shuttle'), null);
});

test('ultimate refused while paused or after battle ended', () => {
  const g = setup();
  g.run('battle.ult=100;battle.paused=true');
  assert.equal(g.run('useUltimate()'), false);
  g.run('battle.paused=false;battle.ended=true');
  assert.equal(g.run('useUltimate()'), false);
  assert.equal(g.run('battle.ult'), 100);
});

test('restarting battle clears ultimate state', () => {
  const g = setup('shuttle');
  g.run('battle.ult=100;useUltimate()');
  g.run('startBattle()');
  assert.equal(g.run('battle.shuttle'), null);
  assert.equal(g.run('battle.rain'), 0);
  assert.equal(g.run('battle.ult'), 0);
});
