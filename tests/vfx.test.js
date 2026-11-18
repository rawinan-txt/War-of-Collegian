const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

const TEAM = ['bug', 'mecha', 'lab', 'night', 'animal', 'music'];
function setup(team = TEAM) {
  const g = loadGame();
  g.run(`team=${JSON.stringify(team)};startBattle();battle.at=9999`);
  return g;
}
function dummyEnemy(g, dx, hp = 1e9) {
  g.run(`spawnEnemy('basic');{const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=${hp};e.x=battle.units[0].x+${dx};e.spd=0;e.atk=0}`);
}
const skillN = (g, i = 0) => g.run(`battle.units[${i}].skillN||0`);

test('SKILL_MODE covers every hero and matches the sprite config', () => {
  const g = loadGame();
  const ids = g.run('heroes.map(h=>h.id)');
  for (const id of ids) assert.ok(['onDeploy', 'onPulse', 'onStack', 'every3'].includes(g.run(`SKILL_MODE['${id}']`)), id);
  for (const id of g.run('Object.keys(CHARACTER_ANIMS)')) {
    if (id !== 'dog') assert.equal(g.run(`CHARACTER_ANIMS['${id}'].skillMode`), g.run(`SKILL_MODE['${id}']`), id);
  }
});

test('onDeploy heroes play their skill when deployed, and only then', () => {
  for (const id of ['mecha', 'runner', 'global']) {
    const g = setup([id, 'bug', 'lab', 'night', 'animal', 'music']);
    g.run(`deploy('${id}')`);
    assert.equal(skillN(g), 1, id);
    g.run('battle.units[0].spd=0');
    tick(g, 3);
    assert.equal(skillN(g), 1, id + ' retriggered');
  }
});

test('onStack: Bug Hunter plays the skill once when the stack first reaches 8', () => {
  const g = setup();
  g.run("deploy('bug')");
  g.run('battle.units[0].spd=0');
  dummyEnemy(g, 100);
  tick(g, 10);
  assert.ok(g.run('battle.units[0].atkCount') >= 10);
  assert.equal(g.run('battle.units[0].stack'), 8);
  assert.equal(skillN(g), 1);
});

test('onPulse: healers/summoner/shielder trigger on their pulses, not otherwise', () => {
  const g = setup();
  g.run("deploy('night')");
  g.run('battle.units[0].spd=0');
  tick(g, 3);
  assert.equal(skillN(g), 0, 'no injured ally -> no pulse');
  g.run("{const d=makeUnit(heroes.find(h=>h.id==='mecha'),true,battle.units[0].x+10);d.spd=0;d.hp=d.maxHp-900;battle.units.push(d)}");
  tick(g, 0.5);
  assert.equal(skillN(g), 1);

  const a = setup();
  a.run("deploy('animal')");
  a.run('battle.units[0].spd=0');
  tick(a, 0.2);
  assert.equal(skillN(a), 1, 'summon pulse');

  const p = setup(['public', 'bug', 'lab', 'night', 'animal', 'music']);
  p.run("deploy('public')");
  p.run('battle.units[0].spd=0');
  tick(p, 17);
  assert.equal(skillN(p), 3, 'shield pulse every 8s');
});

test('every3: attacks 3, 6, 9 use the skill animation; damage per attack is identical', () => {
  const g = setup();
  g.run("deploy('lab')");
  g.run('battle.units[0].spd=0');
  dummyEnemy(g, 100, 1e9);
  tick(g, 15);
  assert.equal(g.run('battle.units[0].atkCount'), 9);
  assert.equal(skillN(g), 3);
  assert.equal(g.run('battle.enemies[0].maxHp-battle.enemies[0].hp'), 9 * 85);
});

test('particle pool never exceeds FX_MAX and stays bounded across many bursts', () => {
  const g = setup();
  for (let i = 0; i < 100; i++) g.run('fxBurst(500,300,"#fff",50,3)');
  assert.ok(g.run('battle.particles.length') <= g.run('FX_MAX'));
  tick(g, 5);
  g.run('for(let i=0;i<30;i++)fxBurst(500,300,"#fff",40,3)');
  tick(g, 5);
  assert.ok(g.run('battle.particles.length+battle.fxFree.length') <= g.run('FX_MAX'));
});

test('reduced effects: no screen shake and half the particles', () => {
  const g = setup();
  g.run('fxShake(6)');
  assert.equal(g.run('battle.shake'), 6);
  g.run('battle.shake=0;battle.particles.length=0;fxBurst(10,10,"#fff",10,3)');
  assert.equal(g.run('battle.particles.length'), 10);
  g.run("setFxLevel('reduced');battle.shake=0;battle.particles.length=0");
  g.run('fxShake(6)');
  assert.equal(g.run('battle.shake'), 0);
  g.run('fxBurst(10,10,"#fff",10,3)');
  assert.equal(g.run('battle.particles.length'), 5);
});

test('skill VFX are visual only: HP and statistics are untouched', () => {
  const g = setup();
  g.run("deploy('bug');deploy('mecha');deploy('lab');deploy('night')");
  dummyEnemy(g, 200, 5000);
  const snap = () => g.run('JSON.stringify([battle.units.map(u=>u.hp),battle.enemies.map(u=>u.hp),CombatStats.getAllCharacterStats(),CombatStats.laserDamage,CombatStats.ultDamage,battle.enemyHp,battle.baseHp])');
  const before = snap();
  for (const id of TEAM) g.run(`runSkillFx({id:'${id}',x:300,y:320,ally:true})`);
  assert.equal(snap(), before);
});

test('startBattle clears particles and shake', () => {
  const g = setup();
  g.run('fxBurst(10,10,"#fff",20,3);fxShake(5)');
  g.run('startBattle()');
  assert.equal(g.run('battle.particles.length'), 0);
  assert.equal(g.run('battle.shake'), 0);
});

test('draw() works with particles, shake and projectiles on screen', () => {
  const g = setup();
  g.run("deploy('bug');screen='battle'");
  dummyEnemy(g, 150);
  g.run('fxBurst(400,300,"#fff",30,3);fxShake(4)');
  tick(g, 0.7);
  g.run('draw();updateHud()');
});
