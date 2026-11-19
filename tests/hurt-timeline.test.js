// Combat timeline vs visual timeline: a hurt reaction (or death) must never move, duplicate or drop combat events.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { loadGame } = require('./harness');

const SHIPPED = path.join(__dirname, '..', 'public', 'assets', 'characters', 'manifest.js');
const STEP = 1 / 60;

function setup(seed, { speed = 1 } = {}) {
  const g = loadGame(seed, { manifest: SHIPPED });
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;battle.income=0;battle.speed=${speed};deploy('bug');
    globalThis.B=battle.units.find(u=>u.id==='bug');
    globalThis.LOG={starts:[],launches:[],fx:[],samples:[]};
    const _sa=startAttack; startAttack=function(u,t,v){ if(u.id==='bug')LOG.starts.push(battle.t); return _sa(u,t,v)};
    const _lp=launchProjectile; launchProjectile=function(u,p){ if(u.id==='bug')LOG.launches.push({t:battle.t,name:u.animName,animT:u.animT,atkT:u.atkT}); return _lp(u,p)};
    const _fx=runSkillFx; runSkillFx=function(u){ if(u.id==='bug')LOG.fx.push({t:battle.t,name:u.animName}); return _fx(u)};
    globalThis.sample=function(){ LOG.samples.push({t:battle.t,name:B.animName,animT:B.animT,atkT:B.atkT,skillT:B.skillT,hurtT:B.hurtT}) };`);
  return g;
}
const step = (g, hook) => { g.run(`update(${STEP})`); g.run('sample()'); if (hook) hook(); };
const get = (g, expr) => g.run(`JSON.stringify(${expr})`) && JSON.parse(g.run(`JSON.stringify(${expr})`));
function until(g, cond, maxSec, hook) { for (let i = 0; i < maxSec / STEP; i++) { step(g, hook); if (cond()) return true; } return false; }

test('hurt during an attack: launch stays 0.25 s after the swing starts, visual clock follows the combat timer', () => {
  const g = setup(5);
  let injectedFor = -1;
  const hook = () => {
    const s = get(g, 'LOG.starts.length');
    const atkT = g.run('B.atkT');
    // inject a hurt reaction at elapsed ~0.12-0.17 s of every swing, so the hurt window (0.25 s) covers the launch at 0.25 s
    if (s !== injectedFor && atkT > 0 && atkT <= 0.38 && atkT >= 0.33 && g.run('B.hurtCd') <= 0) { g.run('B.hurtT=.25;B.hurtCd=.6'); injectedFor = s; }
  };
  until(g, () => get(g, 'LOG.launches.length') >= 6, 25, hook);
  const { starts, launches, samples } = get(g, 'LOG');
  assert.ok(launches.length >= 6, 'bug fired: ' + launches.length);
  // every launch is exactly IMPACT_DELAY after some swing start (within one tick)
  for (const l of launches) assert.ok(starts.some((s) => Math.abs(l.t - s - 0.25) <= STEP + 1e-9), `launch at ${l.t} matches a swing start`);
  // at least one launch happened while the hurt reaction was showing
  assert.ok(launches.some((l) => l.name === 'hurt'), 'a launch coincided with the hurt reaction: ' + launches.map((l) => l.name));
  // visual clock == combat timeline in every sample
  for (const s of samples) {
    if (s.name === 'attack') assert.ok(Math.abs(s.animT - (0.5 - s.atkT)) < 1e-9, 'attack clock follows atkT');
    if (s.name === 'hurt') assert.ok(Math.abs(s.animT - (0.25 - s.hurtT)) < 1e-9, 'hurt clock follows hurtT');
  }
  // un-interrupted launches show frame 3; after a hurt the attack resumes on the frame its timeline dictates
  const frame = (t) => Math.min(5, Math.floor(t * 12.5));
  for (const l of launches) if (l.name === 'attack') assert.equal(frame(l.animT), 3);
  const resumed = samples.filter((s, i) => s.name === 'attack' && i > 0 && samples[i - 1].name === 'hurt');
  assert.ok(resumed.length >= 1, 'attack resumed after a hurt');
  for (const s of resumed) assert.ok(s.animT > 0.25 - 1e-9, 'resumed attack is past the launch frame, not restarted at 0 (animT ' + s.animT + ')');
});

test('hurt during a skill: beam fx fires once, 0.43 s after the trigger; skill clock follows skillT', () => {
  const g = setup(7);
  until(g, () => g.run('B.atkT') > 0, 20);
  let n = 0;
  for (let k = 0; k < 3; k++) {
    g.run('B.skillT=0;triggerSkill(B)');
    const t0 = g.run('battle.t');
    until(g, () => g.run('B.skillT') <= 0, 1.2, () => { if (g.run('B.skillT') <= 0.47 && g.run('B.skillT') >= 0.44) { g.run('B.hurtT=.25;B.hurtCd=.6'); n++; } });
    const fx = get(g, 'LOG.fx');
    assert.equal(fx.length, k + 1, 'skill fx fired once per trigger');
    assert.ok(Math.abs(fx[k].t - t0 - 0.43) <= STEP + 1e-9, `fx at ${fx[k].t - t0} s`);
  }
  assert.ok(n >= 3, 'hurt injected during skills');
  for (const s of get(g, 'LOG.samples')) if (s.name === 'skill') assert.ok(Math.abs(s.animT - (0.72 - s.skillT)) < 1e-9);
});

test('hurt reactions are purely visual: identical combat outcome with and without them (several seeds)', () => {
  for (const seed of [1, 2, 3]) {
    const out = [];
    for (const withHurt of [false, true]) {
      const g = setup(seed);
      g.run(`for(const id of ['mecha','night','lab','chem'])deploy(id)`);
      for (let i = 0; i < 40 / STEP; i++) {
        g.run(`update(${STEP})`);
        if (withHurt && i % 25 === 0) g.run(`for(const u of battle.units){if(u.hurtCd<=0){u.hurtT=.25;u.hurtCd=.6}}`);
      }
      out.push(g.run(`JSON.stringify({kills:battle.kills,base:battle.baseHp,enemy:battle.enemyHp,stats:CombatStats.getAllCharacterStats(),units:battle.units.map(u=>[u.id,u.hp,u.alive,u.x]),en:battle.enemies.map(u=>[u.id,u.hp,u.x])})`));
    }
    assert.equal(out[0], out[1], `seed ${seed}`);
  }
});

test('death during an attack cancels the unlaunched swing; death during a skill cancels the beam fx; no damage appears', () => {
  const g = setup(5);
  until(g, () => g.run('B.atkT') > 0.4, 25);
  const before = get(g, '{l:LOG.launches.length,p:battle.projectiles.length}');
  g.run('B.hp=1;damage(B,50,"enemy_test")');
  assert.equal(g.run('B.alive'), false);
  assert.ok(g.run('battle.corpses.some(c=>c.id==="bug")'), 'corpse is created');
  for (let i = 0; i < 90; i++) g.run(`update(${STEP})`);
  assert.equal(get(g, 'LOG.launches.length'), before.l, 'no projectile from the dead unit');
  // skill
  const g2 = setup(5);
  until(g2, () => g2.run('B.atkT') > 0, 25);
  g2.run('B.skillT=0;triggerSkill(B)');
  for (let i = 0; i < 8; i++) g2.run(`update(${STEP})`); // 0.13 s into the skill, fx pending at 0.43 s
  g2.run('B.hp=1;damage(B,50,"enemy_test")');
  for (let i = 0; i < 90; i++) g2.run(`update(${STEP})`);
  assert.equal(get(g2, 'LOG.fx.length'), 0, 'beam fx of a dead unit never fires');
});

test('a projectile launched before the shooter died still lands and credits the shooter', () => {
  const g = setup(5);
  until(g, () => get(g, 'LOG.launches.length') >= 1 && g.run('battle.projectiles.length') > 0, 25);
  const flying = g.run('battle.projectiles.length');
  assert.ok(flying >= 1);
  const stat = () => g.run(`(CombatStats.getAllCharacterStats().find(r=>r.characterId==='bug')||{totalDamage:0}).totalDamage`);
  const before = stat();
  g.run('B.hp=1;damage(B,50,"enemy_test")');
  for (let i = 0; i < 60; i++) g.run(`update(${STEP})`);
  assert.ok(stat() > before, 'damage from the in-flight projectile was credited after death');
});

test('multiple hurts in a row: hurt clock and cooldown behave, combat timers untouched', () => {
  const g = setup(5);
  until(g, () => g.run('B.atkT') > 0, 25);
  const atkT0 = g.run('B.atkT');
  g.run('B.hurtT=.25;B.hurtCd=.6');
  g.run('damage(B,1,"enemy_test")'); // cooldown blocks a new hurt reaction
  assert.ok(g.run('B.hurtT') <= 0.25 && g.run('B.hurtT') > 0.24, 'second hit within the hurt cooldown does not restart the reaction');
  assert.equal(g.run('B.atkT'), atkT0, 'attack timer untouched by hurt');
  let hurts = 0, last = false;
  for (let i = 0; i < 8 / STEP; i++) { g.run(`update(${STEP})`); if (i % 20 === 0) g.run('damage(B,1,"enemy_test")'); const h = g.run('B.animName') === 'hurt'; if (h && !last) hurts++; last = h; }
  assert.ok(hurts >= 3, 'repeated hits produce repeated reactions: ' + hurts);
});

test('pause / resume and 2x speed keep animation frames locked to the combat timeline', () => {
  for (const speed of [1, 2]) {
    const g = setup(5, { speed });
    until(g, () => g.run('B.atkT') > 0.2, 25);
    g.run('battle.paused=true');
    const snap = g.run('JSON.stringify([B.animT,B.atkT,B.animName,battle.t,battle.projectiles.length])');
    for (let i = 0; i < 30; i++) g.run(`update(${STEP})`);
    assert.equal(g.run('JSON.stringify([B.animT,B.atkT,B.animName,battle.t,battle.projectiles.length])'), snap, 'paused: nothing moves');
    g.run('battle.paused=false');
    until(g, () => get(g, 'LOG.launches.length') >= 4, 25);
    for (const s of get(g, 'LOG.samples')) if (s.name === 'attack') assert.ok(Math.abs(s.animT - (0.5 - s.atkT)) < 1e-9);
    const frame = (t) => Math.min(5, Math.floor(t * 12.5));
    for (const l of get(g, 'LOG.launches')) if (l.name === 'attack') assert.equal(frame(l.animT), 3, `speed ${speed}: launch frame`);
  }
});
