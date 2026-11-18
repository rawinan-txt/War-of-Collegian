// Visual polish round: death shadow, muzzle flash under a hurt reaction, stun visual state, Bug Hunter stun sheet.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('./harness');
const { decodePng } = require('../tools/pixel/png');

const ROOT = path.join(__dirname, '..');
const SHIPPED = path.join(ROOT, 'public', 'assets', 'characters', 'manifest.js');
const STEP = 1 / 60;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/characters/sprites.json'), 'utf8')).characters.bug;

function setup(seed, { speed = 1 } = {}) {
  const g = loadGame(seed, { manifest: SHIPPED });
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;battle.income=0;battle.speed=${speed};deploy('bug');
    globalThis.B=battle.units.find(u=>u.id==='bug');
    globalThis.LOG={starts:[],launches:[],fx:[],names:[]};
    const _sa=startAttack; startAttack=function(u,t,v){ if(u.id==='bug')LOG.starts.push(battle.t); return _sa(u,t,v)};
    const _lp=launchProjectile; launchProjectile=function(u,p){ if(u.id==='bug')LOG.launches.push({t:battle.t,name:u.animName}); return _lp(u,p)};
    const _fx=SKILL_FX.bug.run; SKILL_FX.bug.run=function(u,o){ LOG.fx.push(battle.t); return _fx(u,o)};`);
  return g;
}
const tick = (g) => { g.run(`update(${STEP})`); g.run('LOG.names.push(B.animName)'); };
function until(g, cond, maxSec) { for (let i = 0; i < maxSec / STEP; i++) { tick(g); if (cond()) return true; } return false; }
const J = (g, e) => JSON.parse(g.run(`JSON.stringify(${e})`));

// ---------------- death shadow ----------------
test('death: the shadow follows the body on the ground line, widens when lying, and fades with the dissolve', () => {
  const g = loadGame(5, { manifest: SHIPPED });
  const img = decodePng(fs.readFileSync(path.join(ROOT, 'public/assets/characters/bug/death.png')));
  const FW = 224;
  const footprint = (f) => { let x0 = FW, x1 = -1; for (let y = 84; y <= 89; y++) for (let x = 0; x < FW; x++) if (img.rgba[(y * img.w + f * FW + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return x1 < 0 ? null : [x0, x1]; };
  g.run('ctx.globalAlpha=1;globalThis.R=[];ctx.ellipse=function(...a){R.push([...a,ctx.globalAlpha])}');
  const rec = [];
  for (let f = 0; f < 6; f++) {
    g.run('R.length=0');
    g.run(`drawSpriteFrame('bug','death',${(f + 0.5) / 8.5},300,200,true)`);
    rec.push(J(g, 'R')[0]);
  }
  for (const [i, r] of rec.entries()) {
    assert.equal(r[1], 224, `frame ${i}: shadow stays on the ground line (y+24)`);
    const fp = footprint(i);
    if (fp && i <= 3) {
      const centre = 300 + (fp[0] + fp[1]) / 2 - FW / 2;
      assert.ok(Math.abs(r[0] - centre) <= 6, `frame ${i}: shadow centre ${r[0]} follows the footprint ${centre}`);
      assert.ok(r[2] + 2 >= (fp[1] - fp[0]) / 2 || r[2] >= 14, `frame ${i}: shadow wide enough`);
    }
  }
  assert.ok(rec[3][2] > rec[0][2] * 1.8, 'wider when lying');
  assert.ok(rec[0][0] > rec[3][0] && rec[3][0] < 300, 'moves left with the fall');
  const alpha = rec.map((r) => r[7]);
  assert.ok(alpha[3] === 1 && alpha[4] < alpha[3] && alpha[5] < alpha[4] && alpha[5] < 0.3, 'fades with the dissolve: ' + alpha);
  // alpha is restored afterwards and other animations keep the old standing shadow
  assert.equal(g.run('ctx.globalAlpha'), 1);
  g.run('R.length=0;drawSpriteFrame("bug","idle",0,300,200,true)');
  assert.deepEqual(J(g, 'R')[0], [300, 224, 22, 6, 0, 0, Math.PI * 2, 1]);
  g.run('R.length=0;drawSpriteFrame("mecha","idle",0,300,200,true)');
  assert.deepEqual(J(g, 'R')[0], [300, 224, 22, 6, 0, 0, Math.PI * 2, 1]);
});

// ---------------- muzzle flash under a hurt reaction ----------------
test('hurt on the launch frame: the shot is still seen (muzzle flash), the swing timeline and damage are untouched', () => {
  const g = setup(5);
  let injected = -1;
  for (let i = 0; i < 25 / STEP; i++) {
    tick(g);
    const s = J(g, 'LOG.starts.length'), atkT = g.run('B.atkT');
    if (s !== injected && atkT > 0 && atkT <= 0.38 && atkT >= 0.33 && g.run('B.hurtCd') <= 0) { g.run('B.hurtT=.25;B.hurtCd=.6'); injected = s; }
    if (J(g, 'LOG.launches').some((l) => l.name === 'hurt')) break;
  }
  const hurtLaunch = J(g, 'LOG.launches').find((l) => l.name === 'hurt');
  assert.ok(hurtLaunch, 'a launch happened under a hurt reaction');
  assert.ok(g.run('B.flashT') > 0, 'flash timer started by the launch');
  g.run('ctx.__calls.length=0;drawUnit(B)');
  const x = Math.round(g.run('B.x') + 18), y = Math.round(g.run('B.y') - 14);
  const rects = J(g, 'ctx.__calls').filter((c) => c.k === 'fillRect').map((c) => c.args);
  assert.ok(rects.some((r) => r[0] === x - 2 && r[1] === y - 2 && r[2] === 4 && r[3] === 4), 'white flash block at the muzzle');
  // not drawn when the normal attack frame is showing, and expires by itself
  g.run('B.animName="attack";ctx.__calls.length=0;drawUnit(B)');
  assert.ok(!J(g, 'ctx.__calls').some((c) => c.k === 'fillRect' && c.args[2] === 4 && c.args[3] === 4 && c.args[0] === x - 2), 'no extra flash over the real attack frame');
  for (let i = 0; i < 20; i++) tick(g);
  assert.equal(g.run('B.flashT'), 0);
});

// ---------------- stun visual state ----------------
test('stun during an attack: no release is shown, the unit switches to the stun state, combat rule unchanged', () => {
  const g = setup(5);
  until(g, () => g.run('B.atkT') > 0.35, 25); // ~0.15 s into a swing, impact still pending
  const launches0 = J(g, 'LOG.launches.length');
  g.run('B.stun=.4');
  tick(g);
  assert.equal(g.run('B.animName'), 'stun');
  assert.equal(g.run('B.atkT'), 0, 'the cancelled swing stops animating');
  assert.equal(g.run('B.pend.length'), 0, 'rule unchanged: stun clears unlaunched events');
  const names = [];
  for (let i = 0; i < 0.38 / STEP; i++) { tick(g); names.push(g.run('B.animName')); }
  assert.ok(names.every((n) => n === 'stun' || n === 'hurt'), 'only stun while stunned: ' + [...new Set(names)]);
  assert.equal(J(g, 'LOG.launches.length'), launches0, 'no projectile appears out of a cancelled swing');
  for (let i = 0; i < 0.3 / STEP; i++) tick(g);
  assert.notEqual(g.run('B.animName'), 'stun', 'stun ends');
});

test('stun during a skill: the beam never fires and the skill animation stops', () => {
  const g = setup(5);
  until(g, () => g.run('B.atkT') > 0, 25);
  g.run('B.skillT=0;triggerSkill(B)');
  for (let i = 0; i < 8; i++) tick(g); // 0.13 s in, fx pending at 0.43 s
  g.run('B.stun=.5');
  for (let i = 0; i < 1.0 / STEP; i++) tick(g);
  assert.equal(J(g, 'LOG.fx.length'), 0, 'skill fx cancelled by stun (existing rule)');
  assert.equal(g.run('B.skillT'), 0);
  const i0 = J(g, 'LOG.names').lastIndexOf('skill');
  assert.ok(J(g, 'LOG.names').slice(i0 + 1, i0 + 20).every((n) => n === 'stun' || n === 'hurt'), 'skill animation replaced by stun');
});

test('stun at 2x speed and across pause/resume behaves the same', () => {
  const g = setup(5, { speed: 2 });
  until(g, () => g.run('B.atkT') > 0.35, 25);
  g.run('B.stun=.4');
  tick(g);
  assert.equal(g.run('B.animName'), 'stun');
  g.run('battle.paused=true');
  const snap = g.run('JSON.stringify([B.animName,B.stun,B.atkT,B.animT])');
  for (let i = 0; i < 30; i++) g.run(`update(${STEP})`);
  assert.equal(g.run('JSON.stringify([B.animName,B.stun,B.atkT,B.animT])'), snap, 'paused: frozen');
  g.run('battle.paused=false');
  for (let i = 0; i < 1.2 / STEP; i++) tick(g);
  assert.notEqual(g.run('B.animName'), 'stun');
});

test('stun art: Bug Hunter has a 4-frame looping stun sheet, same character, swirl eyes, glasses intact', () => {
  assert.equal(cfg.anims.stun.frameCount, 4);
  assert.equal(cfg.anims.stun.repeat, -1);
  const img = decodePng(fs.readFileSync(path.join(ROOT, 'public/assets/characters/bug/stun.png')));
  const v3 = decodePng(fs.readFileSync(path.join(ROOT, 'docs/preview/bug_hunter_96_v3.png')));
  assert.equal(img.w, 96 * 4); assert.equal(img.h, 96);
  for (let i = 3; i < img.rgba.length; i += 4) assert.ok(img.rgba[i] === 0 || img.rgba[i] === 255);
  const frames = [0, 1, 2, 3].map((f) => Array.from({ length: 96 * 96 }, (_, i) => { const k = (Math.floor(i / 96) * img.w + f * 96 + (i % 96)) * 4; return img.rgba.slice(k, k + 4).join(); }));
  assert.equal(new Set(frames.map((f) => f.join('|'))).size, 4, 'frames differ (wobble)');
  const src = (x, y) => (v3.rgba[(y * 96 + x) * 4 + 3] ? v3.rgba.slice((y * 96 + x) * 4, (y * 96 + x) * 4 + 3).join() : '-');
  for (let f = 0; f < 4; f++) {
    let best = 0;
    for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 2; dy++) {
      let same = 0, total = 0;
      for (const y of [36, 43]) for (let x = 43; x <= 48; x++) { total++; const k = ((y + dy) * img.w + f * 96 + x + dx) * 4; if (src(x, y) === (img.rgba[k + 3] ? img.rgba.slice(k, k + 3).join() : '-')) same++; }
      best = Math.max(best, same / total);
    }
    assert.equal(best, 1, `stun frame ${f} glasses`);
  }
});

test('stun state uses the idle frame for heroes without a stun sheet (no crash, no attack pose)', () => {
  const g = loadGame(5, { manifest: SHIPPED });
  g.run('ctx.__calls.length=0;drawSpriteFrame("mecha","stun",0.3,300,200,true)');
  assert.equal(J(g, 'ctx.__calls').filter((c) => c.k === 'drawImage').length, 1);
});

// ---------------- combat is unchanged ----------------
test('stuns, hurts and the new shadow/flash code never change the battle: identical with and without external sprites', () => {
  const run = (opts) => {
    const g = loadGame(9, opts);
    g.run(`team=['bug','mecha','night','lab','chem','dental'];startBattle();battle.at=1000;battle.income=0;for(const id of team)deploy(id)`);
    for (let i = 0; i < 45 / STEP; i++) {
      g.run(`update(${STEP})`);
      if (i % 37 === 5) g.run('for(const u of battle.units){if(u.alive&&u.stun<=0&&(u.id.length+Math.floor(battle.t))%2===0)u.stun=.35}');
      if (i % 29 === 3) g.run('for(const u of battle.units){if(u.hurtCd<=0){u.hurtT=.25;u.hurtCd=.6}}');
      if (i % 600 === 0) g.run('draw()');
    }
    return g.run(`JSON.stringify({kills:battle.kills,base:battle.baseHp,enemy:battle.enemyHp,stats:CombatStats.getAllCharacterStats(),units:battle.units.map(u=>[u.id,u.hp,u.alive,u.x]),en:battle.enemies.map(u=>[u.id,u.hp,u.x])})`);
  };
  assert.equal(run({ manifest: SHIPPED }), run({}));
});
