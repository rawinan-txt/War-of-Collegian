// Phase 4: skill effects are data (character.json -> fx.js) interpreted by a small engine of rendering primitives.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame, tick } = require('./harness');
const { compare } = require('../tools/compare-skillfx');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const HEROES = ['bug', 'mecha', 'lab', 'night', 'chem', 'animal', 'dental', 'music', 'runner', 'global', 'public', 'nurse'];
const J = (g, e) => JSON.parse(g.run(`JSON.stringify(${e})`));
const fxData = () => { const c = {}; new Function('globalThis', fs.readFileSync(path.join(ROOT, 'public/assets/characters/fx.js'), 'utf8'))(c); return c.CHARACTER_FX; };

function battle(seed = 3) {
  const g = loadGame(seed, { lazy: true });
  g.run(`team=${JSON.stringify(HEROES)};screen='battle';startBattle(${seed});battle.at=1e6`);
  return g;
}
const state = (g) => g.run('JSON.stringify([battle.units.map(u=>[u.id,u.hp,u.x,u.shield]),battle.enemies.map(u=>[u.id,u.hp,u.x]),battle.baseHp,battle.enemyHp,battle.at,battle.ult,CombatStats.getAllCharacterStats(),CombatStats.laserDamage,CombatStats.ultDamage])');

// ---------------------------------------------------------------- migration is faithful
test('all 12 skill effects equal the former hand-written ones: same fx calls, same particles, same visual random draws, no combat draws, same reduced/off behaviour', () => {
  const report = compare(HEROES);
  for (const id of HEROES) assert.deepEqual(report[id], [], `${id}: ${report[id].join('; ')}`);
});

test('effects live only in data: index.html has no hero-specific effect code any more, and every effect has its own kind', () => {
  assert.ok(!/SKILL_FX/.test(html), 'no SKILL_FX table');
  const data = fxData();
  assert.deepEqual(Object.keys(data).sort(), [...HEROES].sort());
  for (const [id, d] of Object.entries(data)) assert.ok(!html.includes(`'${d.kind}'`) && !html.includes(`"${d.kind}"`), `${id}'s kind ${d.kind} is not hard-coded in index.html`);
  assert.equal(new Set(Object.values(data).map((d) => d.kind)).size, 12, 'unique kinds');
  const shapes = Object.values(data).map((d) => JSON.stringify(d.ops, (k, v) => (['color', 'color2', 'colors'].includes(k) ? undefined : v)));
  assert.equal(new Set(shapes).size, 12, 'no two effects differ only by colour');
  const opTypes = new Set();
  const walk = (ops) => ops.forEach((o) => { opTypes.add(o.op); if (o.ops) walk(o.ops); });
  Object.values(data).forEach((d) => walk(d.ops));
  assert.ok(opTypes.size >= 6, 'the roster uses several different primitives: ' + [...opTypes]);
});

// ---------------------------------------------------------------- all 12 skills activate at the right moment
test('all 12 skills activate once, at SKILL_IMPACT after the trigger, with particles, and unchanged timing', () => {
  const g = battle();
  g.run(`globalThis.__fx=[];const _r=runSkillFx;runSkillFx=function(u){__fx.push({id:u.id,t:battle.t,p:battle.particles.length});_r(u);__fx[__fx.length-1].after=battle.particles.length;__fx[__fx.length-1].flash=!!battle.flash}`);
  for (const id of HEROES) g.run(`deploy(${JSON.stringify(id)})`);
  assert.equal(g.run('battle.units.length'), 12);
  g.run('battle.enemyTimer=1e9');
  for (let i = 0; i < 24; i++) g.run('update(0.025)'); // let the skills that fire on deploy finish first
  g.run('__fx.length=0;globalThis.__t0=battle.t');
  g.run('for(const u of battle.units)if(u.id!=="dog")triggerSkill(u)'); // the summoned dog has no skill
  assert.equal(g.run('SKILL_IMPACT'), 0.43);
  for (let i = 0; i < 40; i++) g.run('update(0.025)');
  const fx = J(g, '__fx'), f0 = g.run('__t0');
  assert.deepEqual(fx.map((f) => f.id).sort(), [...HEROES].sort(), 'each hero exactly once');
  for (const f of fx) {
    assert.ok(Math.abs(f.t - f0 - 0.43) <= 0.026, `${f.id} effect ${(f.t - f0).toFixed(3)}s after the trigger`);
    assert.ok(f.after > f.p || f.p >= 300, `${f.id} drew particles (or the 300-particle pool was already full)`);
  }
});

// ---------------------------------------------------------------- effects never touch combat
test('playing every effect at every level changes nothing in combat: HP, stats, AT, ultimate, no damage call, no combat random draw', () => {
  const g = battle(5);
  for (const id of ['bug', 'mecha', 'night', 'lab']) g.run(`deploy(${JSON.stringify(id)})`);
  g.run('spawnEnemy("basic");spawnEnemy("ranged")');
  g.run('globalThis.__dmg=0;const _d=damage;damage=function(...a){__dmg++;return _d(...a)}');
  const before = state(g), c0 = g.run('battle.rng.combat.draws');
  for (const level of ['full', 'reduced', 'off']) {
    g.run(`setFxLevel(${JSON.stringify(level)})`);
    for (const id of HEROES) g.run(`runSkillFx({id:${JSON.stringify(id)},x:400,y:320,ally:true})`);
    g.run('runSkillFx({id:"nobody",x:400,y:320,ally:true})'); // a hero without effect data gets the default effect
  }
  assert.equal(state(g), before);
  assert.equal(g.run('__dmg'), 0, 'effects never deal damage');
  assert.equal(g.run('battle.rng.combat.draws'), c0, 'no combat random draw');
});

// ---------------------------------------------------------------- primitives
const play = (g, ops, { x = 300, y = 300, ally = true, anchor = [0, 0], level = 'full' } = {}) => {
  g.run(`setFxLevel(${JSON.stringify(level)});battle.particles.length=0;battle.flash=null;battle.shake=0`);
  const v0 = g.run('battle.rng.vfx.draws'), c0 = g.run('battle.rng.combat.draws');
  g.run(`runFxOps(${JSON.stringify(ops)},{x:${x},y:${y},ax:${anchor[0]},ay:${anchor[1]},dir:${ally ? 1 : -1}})`);
  return { particles: J(g, 'battle.particles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,life:p.life,color:p.color,size:p.size}))'), flash: J(g, 'battle.flash'), shake: g.run('battle.shake'), vfx: g.run('battle.rng.vfx.draws') - v0, combat: g.run('battle.rng.combat.draws') - c0 };
};
const PRIMITIVES = {
  beam: { op: 'beam', from: [0, 0], to: [100, 0], color: '#7fe3ff' },
  burst: { op: 'burst', at: [0, 0], color: '#fff', count: 10, size: 3 },
  shockwave: { op: 'shockwave', at: [0, 0], color: '#ffae44', radius: 16 },
  explosion: { op: 'explosion', at: [0, 0], color: '#ffae44', color2: '#ffd08a', radius: 20, count: 12, size: 3, shake: 2 },
  aura: { op: 'aura', at: [0, 0], color: '#9dffcb', radius: 24, count: 12, rise: 20, life: 0.8, size: 2 },
  trail: { op: 'trail', from: [0, 0], to: [-80, 0], color: '#ffd2a8', count: 10, life: 0.5, size: 2 },
  flash: { op: 'flash', color: '#ffffff', alpha: 0.6, duration: 0.3 },
  dissolve: { op: 'dissolve', at: [-10, -30], w: 20, h: 30, color: '#bff3ff', count: 14, life: 0.8, size: 2 },
  spawn: { op: 'spawn', at: [0, 0], v: [10, -5], life: 0.5, color: '#8de7ac', size: 3, grav: 0 },
  repeat: { op: 'repeat', count: 3, step: [20, 0], ops: [{ op: 'spawn', at: [0, 0], v: [0, 0], life: 0.5, color: '#8de7ac', size: 3, grav: 0 }] },
  spiral: { op: 'spiral', at: [0, 0], count: 8, angleStep: 0.9, radius0: 4, radiusStep: 1.6, life: 0.35, colors: ['#fff', '#73ddff'], size: 3 },
  arc: { op: 'arc', at: [0, 0], radius: 30, from: 3.14159, to: 6.28318, step: 0.5, life: 0.7, color: '#5acbb9', size: 3 },
  shake: { op: 'shake', amount: 2 },
};

test('every rendering primitive draws, honours reduced/off, uses only the visual stream, and mirrors for enemies', () => {
  const g = battle();
  for (const [name, op] of Object.entries(PRIMITIVES)) {
    const full = play(g, [op]), reduced = play(g, [op], { level: 'reduced' }), off = play(g, [op], { level: 'off' });
    const draws = full.particles.length > 0 || full.flash || full.shake > 0;
    assert.ok(draws, `${name} produces something at full effects`);
    assert.ok(reduced.particles.length <= full.particles.length, `${name} reduced <= full`);
    assert.equal(off.particles.length, 0, `${name} off draws no particles`);
    assert.equal(off.flash, null, `${name} off: no flash`);
    assert.equal(off.shake, 0, `${name} off: no shake`);
    assert.equal(off.vfx, 0, `${name} off: the visual stream is untouched`);
    assert.equal(full.combat + reduced.combat + off.combat, 0, `${name}: no combat draws`);
    for (const p of full.particles) assert.ok(p.life > 0 && p.life <= 3, `${name}: finite life ${p.life}`);
    // mirrored for an enemy caster (x offsets flip, y does not)
    const e = play(g, [op], { ally: false });
    if (full.particles.length && name !== 'shake') {
      assert.equal(e.particles.length, full.particles.length);
      const dx = (arr) => arr.map((p) => p.x - 300);
      const a = dx(full.particles), b = dx(e.particles);
      if (!['dissolve'].includes(name)) assert.ok(a.every((v, i) => Math.abs(v + b[i]) < 1e-6), `${name}: x mirrored`);
      if (name !== 'dissolve') assert.deepEqual(full.particles.map((p) => Math.round(p.y * 1e6)), e.particles.map((p) => Math.round(p.y * 1e6)), `${name}: y unchanged`);
    }
  }
  const dissolve = play(g, [PRIMITIVES.dissolve]);
  assert.ok(dissolve.vfx > 0, 'dissolve is random, and uses the visual stream');
});

test('anchor and repeat offsets are applied to every primitive; an unknown op is ignored, not fatal', () => {
  const g = battle();
  const plain = play(g, [PRIMITIVES.spiral]).particles, moved = play(g, [PRIMITIVES.spiral], { anchor: [10, -20] }).particles;
  assert.ok(plain.every((p, i) => Math.abs(moved[i].x - p.x - 10) < 1e-9 && Math.abs(moved[i].y - p.y + 20) < 1e-9), 'anchor shifts the effect');
  const rep = play(g, [PRIMITIVES.repeat]).particles;
  assert.deepEqual(rep.map((p) => p.x), [300, 320, 340]);
  assert.doesNotThrow(() => play(g, [{ op: 'does-not-exist' }, PRIMITIVES.burst]));
  assert.ok(play(g, [{ op: 'does-not-exist' }, PRIMITIVES.burst]).particles.length > 0);
});

// ---------------------------------------------------------------- nothing stays active, pause and speed
test('no effect stays active indefinitely: particles, flash and shake all expire', () => {
  const g = battle();
  g.run('battle.enemyTimer=1e9');
  for (const id of HEROES) g.run(`runSkillFx({id:${JSON.stringify(id)},x:400,y:320,ally:true})`);
  g.run(`runFxOps(${JSON.stringify(Object.values(PRIMITIVES))},{x:300,y:300,ax:0,ay:0,dir:1})`);
  assert.ok(g.run('battle.particles.length') > 100 && g.run('!!battle.flash'));
  tick(g, 4, 1 / 30);
  assert.equal(g.run('battle.particles.length'), 0);
  assert.equal(g.run('battle.flash'), null);
  assert.equal(g.run('battle.shake'), 0);
});

test('pause freezes effects and 2x speed ages them twice as fast, the flash included', () => {
  const run = (speed, pause) => {
    const g = battle();
    g.run(`battle.enemyTimer=1e9;battle.speed=${speed};runFxOps(${JSON.stringify([PRIMITIVES.trail, PRIMITIVES.flash])},{x:300,y:300,ax:0,ay:0,dir:1})`);
    if (pause) { g.run('battle.paused=true'); for (let i = 0; i < 60; i++) g.run('update(1/30)'); assert.equal(g.run('battle.particles.length'), 10, 'frozen while paused'); assert.equal(g.run('battle.flash.t'), 0.3); g.run('battle.paused=false'); }
    let n = 0;
    while (g.run('battle.particles.length') && n < 200) { g.run('update(1/30)'); n++; }
    return { steps: n, flash: g.run('battle.flash') };
  };
  const a = run(1, false), b = run(2, false), c = run(1, true);
  assert.ok(Math.abs(a.steps - 2 * b.steps) <= 2, `1x ${a.steps} steps, 2x ${b.steps} steps`);
  assert.equal(c.steps, a.steps, 'pause does not change how long an effect lasts');
  assert.equal(a.flash, null);
});

test('a hero without effect data still gets a visible default effect (no crash)', () => {
  const g = battle();
  g.run('battle.particles.length=0');
  g.run('runSkillFx({id:"mecha",x:300,y:300,ally:true});battle.particles.length=0;const _h=CHARACTER_FX;CHARACTER_FX={};runSkillFx({id:"mecha",x:300,y:300,ally:true})');
  assert.ok(g.run('battle.particles.length') > 0);
});

// ---------------------------------------------------------------- the flash primitive draws and respects the level
test('screen flash is drawn over the scene and fades with the remaining time', () => {
  const g = battle();
  g.run('battle.flash=null;fxFlash("#ffffff",0.6,0.3)');
  g.run('ctx.__calls.length=0;draw()');
  const rects = J(g, 'ctx.__calls.filter(c=>c.k==="fillRect")').filter((c) => c.args[2] === 1100 && c.args[3] === 440);
  assert.ok(rects.length >= 1, 'a full-canvas rectangle is drawn');
  g.run('setFxLevel("reduced");battle.flash=null;fxFlash("#fff",0.6,0.3)');
  assert.equal(g.run('battle.flash.alpha'), 0.3, 'reduced: half strength');
  g.run('setFxLevel("off");battle.flash=null;fxFlash("#fff",0.6,0.3)');
  assert.equal(g.run('battle.flash'), null);
});
