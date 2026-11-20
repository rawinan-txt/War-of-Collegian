const test = require('node:test');
const assert = require('node:assert');
const { loadGame, tick } = require('./harness');

function fire(facultyId) {
  const g = loadGame();
  g.run(`faculty='${facultyId}';startBattle()`);
  g.run("for(const x of [300,500,700]){spawnEnemy('basic');const e=battle.enemies[battle.enemies.length-1];e.hp=e.maxHp=1000;e.x=x}");
  const xs0 = g.run('battle.enemies.map(e=>e.x)');
  const ok = g.run('baseSkill()');
  return {
    g,
    ok,
    xs0,
    hps: g.run('battle.enemies.map(e=>e.hp)'),
    xs: g.run('battle.enemies.map(e=>e.x)'),
    cd: g.run('battle.baseCd'),
    stun: g.run('battle.enemies.map(e=>e.stun)'),
    slow: g.run('battle.enemies.map(e=>e.slow)'),
  };
}

const ids = loadGame().run('faculties.map(f=>f[0])');

test('every faculty in the game fires the identical laser', () => {
  assert.ok(ids.length > 0 && new Set(ids).size === ids.length, 'faculty ids exist and are unique');
  for (const id of ids) {
    const r = fire(id);
    assert.equal(r.ok, true, id);
    assert.deepEqual(r.hps, [500, 500, 500], `${id} damage`);
    assert.deepEqual(r.xs, r.xs0, `${id} knockback`);
    assert.equal(r.cd, 45, `${id} cooldown`);
    assert.deepEqual(r.stun, [0, 0, 0], `${id} stun`);
    assert.deepEqual(r.slow, [0, 0, 0], `${id} slow`);
  }
});

test('FACULTY_LASER holds the spec values and is frozen', () => {
  const g = loadGame();
  assert.deepEqual(
    g.run('({damage:FACULTY_LASER.damage,cooldown:FACULTY_LASER.cooldown,knockback:FACULTY_LASER.knockback,stun:FACULTY_LASER.stun,slow:FACULTY_LASER.slow,hits:FACULTY_LASER.hits})'),
    { damage: 500, cooldown: 45, knockback: 0, stun: 0, slow: 0, hits: 1 }
  );
  assert.equal(g.run('Object.isFrozen(FACULTY_LASER)'), true);
});

test('laser hits once per activation, even over many animation frames; cooldown blocks a second shot', () => {
  const { g } = fire('ICT');
  assert.equal(g.run('baseSkill()'), false);
  tick(g, 1);
  assert.deepEqual(g.run('battle.enemies.map(e=>Math.round(e.hp))'), [500, 500, 500]);
});

test('laser does not damage the enemy base', () => {
  const { g } = fire('EG');
  assert.equal(g.run('battle.enemyHp'), 6500);
});

test('laser damage is counted separately: not hero DMG, not ultimate charge, only real HP damage', () => {
  const { g } = fire('SC');
  assert.equal(g.run('CombatStats.laserDamage'), 1500);
  assert.equal(g.run('CombatStats.getAllCharacterStats().every(s=>s.totalDamage===0)'), true);
  assert.equal(g.run('battle.ult'), 0);
  const g2 = loadGame();
  g2.run("startBattle();spawnEnemy('tank');battle.enemies[0].x=500;baseSkill()");
  assert.equal(g2.run('battle.enemies[0].hp'), 1350 - (500 - 160)); // 160 shield absorbs part
  assert.equal(g2.run('CombatStats.laserDamage'), 340);
});

test('laser refuses while paused or after the battle ended', () => {
  const g = loadGame();
  g.run('startBattle();battle.paused=true');
  assert.equal(g.run('baseSkill()'), false);
  g.run('battle.paused=false;battle.ended=true');
  assert.equal(g.run('baseSkill()'), false);
});

test('VFX config is cosmetic-only and unknown faculties get a default', () => {
  const g = loadGame();
  const keys = g.run('[...new Set(Object.values(FACULTY_LASER_VFX).flatMap(v=>Object.keys(v)))].sort()');
  assert.deepEqual(keys, ['color', 'particleStyle']);
  const v = g.run("laserVfx('NOPE')");
  assert.equal(v.particleStyle, 'default');
  assert.match(v.color, /^#/);
  assert.equal(g.run("laserVfx('ICT').particleStyle"), 'digital');
});

// ---- Task 7: pixel laser VFX + reduced-effects toggle ----
const ctxOf = (g) => g.run("document.getElementById('game').getContext('2d')");

test('the laser renders for every faculty in both FX levels without throwing', () => {
  for (const level of ['full', 'reduced']) {
    for (const id of ids) {
      const g = loadGame();
      g.run(`setFxLevel('${level}');faculty='${id}';startBattle();screen='battle';spawnEnemy('basic');baseSkill()`);
      tick(g, 0.2);
      g.run('draw()');
    }
  }
});

test('the laser beam is drawn as hard-edged integer pixel blocks (no glow, no anti-aliasing)', () => {
  const g = loadGame();
  g.run("faculty='ICT';startBattle();spawnEnemy('basic');baseSkill();screen='battle'");
  tick(g, 0.1);
  const ctx = ctxOf(g);
  ctx.__calls.length = 0;
  ctx.shadowBlur = 0;
  g.run('drawLaser(battle)');
  const rects = ctx.__calls.filter((c) => c.k === 'fillRect');
  assert.ok(rects.length >= 100, `only ${rects.length} blocks`);
  for (const r of rects) for (const v of r.args) assert.ok(Number.isInteger(v), `non-integer rect arg ${v}`);
  assert.ok(!ctx.shadowBlur, 'laser must not use shadow glow');
  assert.ok(ctx.__calls.every((c) => c.k !== 'arc' && c.k !== 'ellipse'), 'no smooth shapes');
});

test('laser fire shakes the screen in full mode only; gameplay numbers are unchanged', () => {
  const full = loadGame();
  full.run("startBattle();spawnEnemy('basic');battle.enemies[0].hp=battle.enemies[0].maxHp=1000;baseSkill()");
  assert.ok(full.run('battle.shake') > 0);
  assert.equal(full.run('battle.enemies[0].hp'), 500);
  const red = loadGame();
  red.run("setFxLevel('reduced');startBattle();spawnEnemy('basic');battle.enemies[0].hp=battle.enemies[0].maxHp=1000;baseSkill()");
  assert.equal(red.run('battle.shake'), 0);
  assert.equal(red.run('battle.enemies[0].hp'), 500);
  assert.equal(red.run('battle.baseCd'), 45);
});

test('the FX toggle flips full/reduced, updates its label and never touches battle state', () => {
  const g = loadGame();
  g.run("startBattle();deploy('bug')");
  const snap = () => g.run('JSON.stringify([battle.t,battle.at,battle.units.length,battle.paused,battle.speed,battle.baseCd,battle.ult])');
  const before = snap();
  assert.equal(g.run('fxLevel'), 'full');
  g.run('toggleFx()');
  assert.equal(g.run('fxLevel'), 'reduced');
  assert.match(g.run("document.getElementById('fxBtn').textContent"), /ลด/);
  g.run('toggleFx()');
  assert.equal(g.run('fxLevel'), 'full');
  assert.match(g.run("document.getElementById('fxBtn').textContent"), /เต็ม/);
  assert.equal(snap(), before);
});
