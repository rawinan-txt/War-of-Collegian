const test = require('node:test');
const assert = require('node:assert');
const { loadGame } = require('./harness');

const ALL = ['bug', 'mecha', 'lab', 'night', 'chem', 'animal', 'dental', 'music', 'runner', 'global', 'public', 'nurse', 'dog'];

test('every sprite sheet of every character loads and is ready', () => {
  const g = loadGame();
  for (const id of ALL) assert.equal(g.run(`spriteReady('${id}')`), true, id);
});

test('no animation references a missing sheet (every config entry resolves to a loaded image)', () => {
  const g = loadGame();
  const missing = g.run("Object.entries(CHARACTER_ANIMS).flatMap(([id,c])=>Object.entries(c.anims).filter(([a,d])=>!SPRITES[id]||!SPRITES[id].anims[a]||SPRITES[id].anims[a].img.src!==d.sheet).map(([a])=>id+'.'+a))");
  assert.deepEqual(missing, []);
});

const FRAME = `(()=>{
  for(const id of team){battle.cd[id]=0;deploy(id)}
  if(frameNo%20===0){spawnEnemy('basic');spawnEnemy('ranged');spawnEnemy('fast')}
  if(frameNo%97===0){battle.baseCd=0;baseSkill()}
  battle.ult=100;if(frameNo%150===0)useUltimate();
  update(0.05);draw();updateHud();
  peakParticles=Math.max(peakParticles,battle.particles.length);
  peakProj=Math.max(peakProj,battle.projectiles.length+battle.projFree.length);
  peakCorpses=Math.max(peakCorpses,battle.corpses.length);
  peakUnits=Math.max(peakUnits,battle.units.length);
  peakEnemies=Math.max(peakEnemies,battle.enemies.length);
  frameNo++;
})()`;

test('stress: 600 frames of update+draw+HUD with the full team, many enemies and FX on keep every pool bounded', () => {
  const g = loadGame();
  g.run("faculty='ICT';team=['bug','lab','music','night','chem','animal'];startBattle();battle.at=1e6;battle.maxAt=1e6;screen='battle'");
  g.run('battle.baseHp=1e9;battle.enemyHp=1e9;var peakParticles=0,peakProj=0,peakCorpses=0,peakUnits=0,peakEnemies=0,frameNo=0');
  for (let i = 0; i < 600; i++) g.run(FRAME);
  assert.equal(g.run('frameNo'), 600, 'loop really ran');
  assert.ok(g.run('peakUnits') >= 10, 'stress actually deployed many units');
  assert.ok(g.run('peakEnemies') >= 10, 'stress actually spawned many enemies');
  assert.ok(g.run('peakParticles') > 20, 'effects were really active');
  assert.ok(g.run('peakParticles') <= g.run('FX_MAX'), 'particle pool bounded');
  assert.ok(g.run('peakProj') <= 400, `projectile pool grew to ${g.run('peakProj')}`);
  assert.ok(g.run('peakCorpses') <= 60, `corpses grew to ${g.run('peakCorpses')}`);
  assert.ok(g.run('peakUnits') <= 35, 'unit cap respected');
});

test('drawing never creates new Image objects after load', () => {
  const g = loadGame();
  const count0 = g.run('Image.count');
  assert.equal(count0, 13 * 6);
  g.run("startBattle();battle.at=1e6;for(const id of team)deploy(id);screen='battle'");
  for (let i = 0; i < 200; i++) g.run('update(0.05);draw()');
  assert.equal(g.run('Image.count'), count0);
});
