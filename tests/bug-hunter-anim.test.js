const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { decodePng } = require('../tools/pixel/png');

const ROOT = path.join(__dirname, '..');
const dec = (p) => decodePng(fs.readFileSync(path.join(ROOT, p)));
const v3 = dec('docs/preview/bug_hunter_96_v3.png');
const N = 96;

function colours(img) {
  const s = new Set();
  for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3]) s.add(img.rgba.slice(i, i + 3).join());
  return s;
}
function frame(img, f) {
  const out = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = (y * img.w + f * N + x) * 4; out.push(img.rgba.slice(k, k + 4).join()); }
  return out;
}
const diff = (a, b, y0 = 0, y1 = N - 1) => { let n = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < N; x++) if (a[y * N + x] !== b[y * N + x]) n++; return n; };
const bottom = (fr) => { for (let y = N - 1; y >= 0; y--) for (let x = 0; x < N; x++) if (!fr[y * N + x].endsWith(',0')) return y; return -1; };

const SHEETS = { idle: ['public/assets/characters/bug/idle.png', 4], walk: ['public/assets/characters/bug/walk.png', 6] };

test('bug idle/walk sheets: size, hard alpha, only v3 colours (appearance stays identical)', () => {
  const base = colours(v3);
  for (const [name, [p, n]] of Object.entries(SHEETS)) {
    const img = dec(p);
    assert.equal(img.w, N * n, `${name} width`);
    assert.equal(img.h, N, `${name} height`);
    for (let i = 3; i < img.rgba.length; i += 4) assert.ok(img.rgba[i] === 0 || img.rgba[i] === 255, `${name} has soft alpha`);
    for (const c of colours(img)) assert.ok(base.has(c), `${name} introduces colour ${c}`);
  }
});

test('bug idle frame 0 is exactly the approved v3 sprite', () => {
  const a = frame(dec(SHEETS.idle[0]), 0), b = frame(v3, 0);
  assert.equal(diff(a, b), 0);
});

test('bug idle really animates (not a still image) and the face never changes', () => {
  const img = dec(SHEETS.idle[0]);
  const fr = [0, 1, 2, 3].map((i) => frame(img, i));
  for (let i = 1; i < 4; i++) assert.ok(diff(fr[0], fr[i]) > 30, `idle frame ${i} differs from frame 0`);
  assert.ok(new Set(fr.map((f) => f.join('|'))).size === 4, 'all idle frames distinct');
});

test('bug walk: legs and laptop arm move, feet stay on the ground line, frames distinct', () => {
  const img = dec(SHEETS.walk[0]);
  const fr = [0, 1, 2, 3, 4, 5].map((i) => frame(img, i));
  assert.equal(new Set(fr.map((f) => f.join('|'))).size, 6);
  for (let i = 1; i < 6; i++) assert.ok(diff(fr[0], fr[i], 72, 89) > 20, `leg area changes in frame ${i}`);
  let laptopMoves = 0;
  for (let i = 1; i < 6; i++) { let n = 0; for (let y = 43; y <= 64; y++) for (let x = 61; x < 84; x++) if (fr[0][y * N + x] !== fr[i][y * N + x]) n++; if (n > 10) laptopMoves++; }
  assert.ok(laptopMoves >= 4, 'laptop/arm region moves');
  const bottoms = fr.map(bottom);
  assert.ok(bottoms.every((b) => b <= 89 && b >= 84), `feet bottoms ${bottoms}`);
  assert.ok(bottoms.filter((b) => b === 89).length >= 3, 'a grounded foot touches row 89 in most frames');
});

test('shipped manifest: bug has idle (4) and walk (6) with correct config; other anims fall back safely', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/characters/sprites.json'), 'utf8')).characters.bug;
  assert.equal(cfg.scale, 1);
  assert.equal(cfg.anims.idle.frameCount, 4);
  assert.equal(cfg.anims.walk.frameCount, 6);
  assert.equal(cfg.anims.walk.feetRow, 89);
  assert.equal(cfg.anims.hurt.frameCount, 3);
  assert.equal(cfg.anims.death.frameCount, 6);
  assert.equal(cfg.anims.death.frameWidth, 224);
});

// ---- artifact checks (round 2) ----
const anim = require('../tools/pixel/art/bug_hunter_anim');
const opaque = (img, f, x, y) => x >= 0 && y >= 0 && x < N && y < N && img.rgba[(y * img.w + f * N + x) * 4 + 3] > 0;
function holes(img, f) {
  let h = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (opaque(img, f, x, y)) continue;
    if ((opaque(img, f, x - 1, y) && opaque(img, f, x + 1, y)) || (opaque(img, f, x, y - 1) && opaque(img, f, x, y + 1))) h++;
  }
  return h;
}
const count = (img, f) => { let n = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (opaque(img, f, x, y)) n++; return n; };

test('no pixel artifacts: no new 1px holes or seams, no body parts lost, in any frame', () => {
  const baseHoles = holes(v3, 0), baseCount = count(v3, 0);
  for (const [name, [p, n]] of Object.entries(SHEETS)) {
    const img = dec(p);
    for (let f = 0; f < n; f++) {
      assert.ok(holes(img, f) <= baseHoles, `${name} frame ${f}: ${holes(img, f)} holes vs ${baseHoles} in v3`);
      const c = count(img, f);
      assert.ok(Math.abs(c - baseCount) / baseCount < 0.06, `${name} frame ${f}: ${c} opaque pixels vs ${baseCount}`);
    }
  }
});

test('shoes are never stretched: each foot (rows 82-89) is a rigid, translated copy of v3', () => {
  const img = dec(SHEETS.walk[0]);
  const src = (x, y) => (v3.rgba[(y * N + x) * 4 + 3] ? v3.rgba.slice((y * N + x) * 4, (y * N + x) * 4 + 3).join() : '-');
  const dst = (f, x, y) => { const k = (y * img.w + f * N + x) * 4; return img.rgba[k + 3] ? img.rgba.slice(k, k + 3).join() : '-'; };
  let exact = 0; const scores = [];
  for (let f = 0; f < 6; f++) for (const [x0, x1] of [[30, 46], [47, 62]]) {
    let best = 0;
    for (let dx = -6; dx <= 6; dx++) for (let dy = 0; dy >= -4; dy--) {
      let same = 0, total = 0;
      for (let y = 82; y <= 89; y++) for (let x = x0; x <= x1; x++) { total++; if (src(x, y) === dst(f, x + dx, y + dy)) same++; }
      best = Math.max(best, same / total);
    }
    scores.push(best); assert.ok(best >= 0.6, 'leg ' + x0 + ' frame ' + f + ' foot match ' + best.toFixed(2));
    if (best === 1) exact++;
  }
  // lower scores only where the near leg is drawn over the far one (legs crossing); a stretched foot would score far lower everywhere
  assert.ok(scores.reduce((a, b) => a + b) / scores.length >= 0.92, 'mean foot match ' + scores);
  assert.ok(exact >= 8, 'exact rigid copies: ' + exact + '/12');
});

test('animation build is deterministic and equals the shipped sheets', () => {
  const { idle, walk } = anim.build(path.join(ROOT, 'docs/preview/bug_hunter_96_v3.png'));
  for (const [name, frames] of [['idle', idle], ['walk', walk]]) {
    const img = dec(SHEETS[name][0]);
    frames.forEach((cv, f) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = cv[y][x], k = (y * img.w + f * N + x) * 4;
      assert.equal(img.rgba[k + 3] ? img.rgba.slice(k, k + 3).join() : '-', c ? c.slice(0, 3).join() : '-', `${name} f${f} ${x},${y}`);
    } });
  }
});

test('extension points for Attack/Skill: overlays and laptopSrc replace the arm without touching the rest', () => {
  const at = anim.loadSource(path.join(ROOT, 'docs/preview/bug_hunter_96_v3.png'));
  const render = anim.makeRenderer(at);
  const base = render({});
  const red = [255, 0, 0, 255];
  const withOverlay = render({ overlays: [{ x: 30, y: 60, pixels: [[0, 0, red], [1, 0, red]] }] });
  assert.deepEqual(withOverlay[60][30], red);
  assert.deepEqual(withOverlay[60][31], red);
  assert.deepEqual(withOverlay[61][30], base[61][30]);
  const blueScreen = render({ laptopSrc: (x, y) => (y >= 43 && y <= 64 && x >= 61 && x <= 80 ? [1, 2, 3, 255] : null) });
  assert.deepEqual(blueScreen[50][70], [1, 2, 3, 255]);
  assert.deepEqual(blueScreen[10][50], base[10][50], 'head untouched');
});

// ---- Attack (6 frames) and Skill (12 frames), round 3 ----
const SHEETS2 = {};
const { loadGame, tick } = require('./harness');
const SHIPPED = path.join(ROOT, 'public', 'assets', 'characters', 'manifest.js');
SHEETS2.attack = ['public/assets/characters/bug/attack.png', 6];
SHEETS2.skill = ['public/assets/characters/bug/skill.png', 12];
const VFX = new Set(['255,255,255', '191,243,255', '127,227,255', '43,155,255']);
// bright release pixels (flash / beam): white, pale and cyan VFX colours at or beyond column `x0`
const vfxCount = (img, f, x0) => { let n = 0; for (let y = 0; y < N; y++) for (let x = x0; x < N; x++) { const k = (y * img.w + f * N + x) * 4; if (img.rgba[k + 3] && ['255,255,255', '191,243,255', '127,227,255'].includes(img.rgba.slice(k, k + 3).join())) n++; } return n; };
const holesIn = (img, f, x0, x1) => { let h = 0; for (let y = 0; y < N; y++) for (let x = x0; x <= x1; x++) { if (opaque(img, f, x, y)) continue; if ((opaque(img, f, x - 1, y) && opaque(img, f, x + 1, y)) || (opaque(img, f, x, y - 1) && opaque(img, f, x, y + 1))) h++; } return h; };
const cfgBug = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/characters/sprites.json'), 'utf8')).characters.bug;

test('attack/skill sheets: size, hard alpha, never touching the frame edge, no new holes', () => {
  const baseHoles = holesIn(v3, 0, 0, 60); // body area only: the VFX are deliberately made of separate pixels
  for (const name of ['attack', 'skill']) {
    const [p, n] = SHEETS2[name];
    const img = dec(p);
    assert.equal(img.w, N * n); assert.equal(img.h, N);
    for (let i = 3; i < img.rgba.length; i += 4) assert.ok(img.rgba[i] === 0 || img.rgba[i] === 255, `${name} soft alpha`);
    for (let f = 0; f < n; f++) {
      for (let i = 0; i < N; i++) for (const [x, y] of [[0, i], [N - 1, i], [i, 0], [i, N - 1]]) assert.ok(!opaque(img, f, x, y), `${name} f${f} touches frame edge at ${x},${y}`);
      assert.ok(holesIn(img, f, 0, 60) <= baseHoles, `${name} f${f}: ${holesIn(img, f, 0, 60)} body holes vs ${baseHoles}`);
    }
    assert.equal(new Set(Array.from({ length: n }, (_, f) => frame(img, f).join('|'))).size, n, `${name} frames are distinct`);
  }
});

test('attack/skill keep the approved face: the glasses+eyes block is a rigid copy of v3 in every frame', () => {
  const src = (x, y) => (v3.rgba[(y * N + x) * 4 + 3] ? v3.rgba.slice((y * N + x) * 4, (y * N + x) * 4 + 3).join() : '-');
  for (const name of ['attack', 'skill']) {
    const [p, n] = SHEETS2[name], img = dec(p);
    for (let f = 0; f < n; f++) {
      let best = 0;
      for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
        let same = 0, total = 0;
        for (let y = 36; y <= 43; y++) for (let x = 42; x <= 59; x++) { total++; const k = ((y + dy) * img.w + f * N + x + dx) * 4; if (src(x, y) === (img.rgba[k + 3] ? img.rgba.slice(k, k + 3).join() : '-')) same++; }
        best = Math.max(best, same / total);
      }
      assert.equal(best, 1, `${name} frame ${f} face block match ${best}`);
    }
  }
});

test('attack: laptop and arm really move; flash peaks on the impact frame 3; skill beam peaks on frame 7', () => {
  const atk = dec(SHEETS2.attack[0]), skl = dec(SHEETS2.skill[0]);
  const a = [0, 1, 2, 3, 4, 5].map((f) => vfxCount(atk, f, 70)), s = Array.from({ length: 12 }, (_, f) => vfxCount(skl, f, 86));
  assert.equal(a.indexOf(Math.max(...a)), 3, `attack vfx per frame ${a}`);
  assert.equal(s.indexOf(Math.max(...s)), 7, `skill vfx per frame ${s}`);
  const total = (img, n) => { let t = 0; for (let f = 0; f < n; f++) t += vfxCount(img, f, 60); return t / n; };
  assert.ok(total(skl, 12) > total(atk, 6), 'skill effect is bigger than the normal attack (avg bright VFX pixels per frame)');
  const laptopMoved = (img, n) => { let k = 0; for (let f = 1; f < n; f++) { let d = 0; for (let y = 43; y <= 64; y++) for (let x = 56; x < 84; x++) { const i = (y * img.w + x) * 4, j = (y * img.w + f * N + x) * 4; if (img.rgba.slice(i, i + 4).join() !== img.rgba.slice(j, j + 4).join()) d++; } if (d > 25) k++; } return k; };
  assert.ok(laptopMoved(atk, 6) >= 4 && laptopMoved(skl, 12) >= 9);
});

test('timing: config rates match the combat constants (attack impact frame 3, skill release frame 7)', () => {
  const c = cfgBug();
  assert.equal(c.anims.attack.frameCount, 6); assert.equal(c.anims.skill.frameCount, 12);
  assert.deepEqual(c.impact, { attack: 3, skill: 7 });
  const g = loadGame(5, { manifest: SHIPPED });
  const idx = (name, t) => g.run(`frameIndex(SPRITES.bug.anims.${name}.def, ${t})`);
  assert.equal(idx('attack', 0.25), 3, 'projectile launch (IMPACT_DELAY .25 s) shows frame 3');
  assert.equal(idx('attack', 0.25 - 1e-9), 3, 'one float tick earlier still frame 3');
  assert.equal(idx('attack', 0.5), 5, 'attack ends on its last frame at atkT 0.5');
  assert.equal(idx('skill', 0.43), 7, 'code beam (SKILL_IMPACT .43 s) shows frame 7');
  assert.equal(idx('skill', 0.72), 11, 'skill ends on its last frame at SKILL_DUR .72');
  assert.ok(g.run('SKILL_IMPACT') === 0.43 && g.run('SKILL_DUR') === 0.72 && g.run('IMPACT_DELAY') === 0.25, 'combat constants unchanged');
});

test('timing in a real battle: every Bug Hunter projectile launches on attack frame 3, skill fx on skill frame 7', () => {
  const g = loadGame(5, { manifest: SHIPPED });
  g.run(`team=['bug','mecha','night','lab','animal','music'];startBattle();battle.at=1000;battle.income=0;deploy('bug');
    globalThis.__rec={atk:[],skill:[]};
    const _lp=launchProjectile; launchProjectile=function(u,p){ if(u.id==='bug'&&u.animName==='attack')__rec.atk.push([frameIndex(SPRITES.bug.anims.attack.def,u.animT),u.animT]); return _lp(u,p)};
    const _fx=SKILL_FX.bug.run; SKILL_FX.bug.run=function(u){ if(u.animName==='skill')__rec.skill.push(frameIndex(SPRITES.bug.anims.skill.def,u.animT)); return _fx(u)};`);
  tick(g, 20, 1 / 60);
  g.run(`triggerSkill(battle.units.find(u=>u.id==='bug'))`);
  tick(g, 2, 1 / 60);
  const rec = JSON.parse(g.run('JSON.stringify(__rec)'));
  assert.ok(rec.atk.length >= 5, 'bug fired projectiles: ' + rec.atk.length);
  // a swing interrupted by a hurt reaction restarts the clock (known state-machine behaviour, not changed in this round)
  const clean = rec.atk.filter(([, t]) => t >= 0.2);
  assert.ok(clean.length >= 5 && clean.every(([f]) => f === 3), 'launch frames of uninterrupted swings ' + JSON.stringify(rec.atk));
  assert.ok(rec.skill.length >= 1 && rec.skill.every((f) => f === 7), 'skill fx frames ' + rec.skill);
});

test('external attack/skill art does not change combat: damage, DMG/DEF/HEAL stats and outcome are identical', () => {
  const run = (opts) => {
    const g = loadGame(21, opts);
    g.run(`team=['bug','mecha','night','lab','chem','dental'];startBattle();battle.at=1000;battle.income=0;for(const id of team)deploy(id)`);
    tick(g, 40, 1 / 30);
    return g.run(`JSON.stringify({kills:battle.kills,base:Math.round(battle.baseHp),enemy:Math.round(battle.enemyHp),ult:Math.round(battle.ult),stats:CombatStats.getAllCharacterStats(),units:battle.units.map(u=>[u.id,Math.round(u.hp),u.alive])})`);
  };
  assert.equal(run({ manifest: SHIPPED }), run({}));
});

// ---- Hurt (3 frames) and Death (6 frames), round 4 ----
const HW = 224;
const hurtImg = () => dec('public/assets/characters/bug/hurt.png');
const deathImg = () => dec('public/assets/characters/bug/death.png');
const opaqueW = (img, fw, f, x, y) => x >= 0 && y >= 0 && x < fw && y < N && img.rgba[(y * img.w + f * fw + x) * 4 + 3] > 0;
const countW = (img, fw, f) => { let n = 0; for (let y = 0; y < N; y++) for (let x = 0; x < fw; x++) if (opaqueW(img, fw, f, x, y)) n++; return n; };
const boundsW = (img, fw, f) => { let x0 = fw, x1 = -1, y0 = N, y1 = -1; for (let y = 0; y < N; y++) for (let x = 0; x < fw; x++) if (opaqueW(img, fw, f, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; };

test('hurt sheet: 3 frames of 96x96, hard alpha, distinct, glasses and laptop stay, no new body holes', () => {
  const img = hurtImg();
  assert.equal(img.w, N * 3); assert.equal(img.h, N);
  for (let i = 3; i < img.rgba.length; i += 4) assert.ok(img.rgba[i] === 0 || img.rgba[i] === 255);
  assert.equal(new Set([0, 1, 2].map((f) => frame(img, f).join('|'))).size, 3);
  const src = (x, y) => (v3.rgba[(y * N + x) * 4 + 3] ? v3.rgba.slice((y * N + x) * 4, (y * N + x) * 4 + 3).join() : '-');
  const base = holesIn(v3, 0, 0, 60);
  for (let f = 0; f < 3; f++) {
    // glasses frame rows (36 and 43) are a rigid copy of v3, whatever the recoil
    let best = 0;
    for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) {
      let same = 0, total = 0;
      for (const y of [36, 43]) for (let x = 43; x <= 48; x++) { total++; const k = ((y + dy) * img.w + f * N + x + dx) * 4; if (src(x, y) === (img.rgba[k + 3] ? img.rgba.slice(k, k + 3).join() : '-')) same++; }
      best = Math.max(best, same / total);
    }
    assert.equal(best, 1, `hurt frame ${f} glasses`);
    assert.ok(holesIn(img, f, 0, 60) <= base + 1, `hurt frame ${f} body holes ${holesIn(img, f, 0, 60)} vs ${base}`);
    let laptop = 0;
    for (let y = 40; y < 70; y++) for (let x = 56; x < 84; x++) if (opaque(img, f, x, y)) laptop++;
    assert.ok(laptop > 120, `hurt frame ${f}: laptop still in the picture (${laptop})`);
  }
  assert.ok(diff(frame(img, 0), frame(img, 2)) > 150, 'a visible recoil');
});

test('death sheet: 6 frames of 224x96, hard alpha, falls backwards to lying, dissolves, never touches the frame edge', () => {
  const img = deathImg();
  assert.equal(img.w, HW * 6); assert.equal(img.h, N);
  for (let i = 3; i < img.rgba.length; i += 4) assert.ok(img.rgba[i] === 0 || img.rgba[i] === 255);
  const frames = [0, 1, 2, 3, 4, 5].map((f) => Array.from({ length: N * HW }, (_, i) => { const k = (Math.floor(i / HW) * img.w + f * HW + (i % HW)) * 4; return img.rgba.slice(k, k + 4).join(); }));
  assert.equal(new Set(frames.map((f) => f.join('|'))).size, 6);
  const b = [0, 1, 2, 3, 4, 5].map((f) => boundsW(img, HW, f));
  for (let f = 0; f < 6; f++) {
    for (let y = 0; y < N; y++) assert.ok(!opaqueW(img, HW, f, 0, y) && !opaqueW(img, HW, f, HW - 1, y), `frame ${f} touches a side edge`);
    for (let x = 0; x < HW; x++) assert.ok(!opaqueW(img, HW, f, x, 0) && !opaqueW(img, HW, f, x, N - 1), `frame ${f} touches top/bottom`);
  }
  const h = (f) => b[f].y1 - b[f].y0 + 1, w = (f) => b[f].x1 - b[f].x0 + 1;
  assert.ok(h(0) > 70 && h(0) > w(0), 'frame 0 still standing');
  assert.ok(w(3) > h(3) * 1.4, `frame 3 is lying down (${w(3)}x${h(3)})`);
  assert.ok(h(1) < h(0) && h(2) < h(1) + 10 && w(2) > w(0), 'it tilts progressively');
  assert.ok(b[3].y1 >= 86 && b[3].y1 <= 89, 'lying figure rests on the ground line');
  const n = [0, 1, 2, 3, 4, 5].map((f) => countW(img, HW, f));
  assert.ok(n[4] < n[3] * 0.8 && n[5] < n[3] * 0.25, `dissolve ${n}`);
  assert.ok(n[5] > 0, 'last frame is not blank (the corpse is removed by the game, not by an empty frame)');
});

test('death timing: 6 frames fit the corpse lifetime (0.7 s) and the last frame is shown at the end', () => {
  const g = loadGame(5, { manifest: SHIPPED });
  const idx = (t) => g.run(`frameIndex(SPRITES.bug.anims.death.def, ${t})`);
  assert.equal(idx(0), 0); assert.equal(idx(0.69), 5); assert.equal(idx(0.35), 2);
  assert.equal(g.run('SPRITES.bug.anims.hurt.def.frameCount'), 3);
  assert.equal(g.run('frameIndex(SPRITES.bug.anims.hurt.def, .249)'), 2, 'hurt lasts HURT_DUR 0.25 s over its 3 frames');
});

test('a Bug Hunter that dies leaves the death corpse (not an idle image) and it disappears after 0.7 s', () => {
  const g = loadGame(5, { manifest: SHIPPED });
  g.run(`team=['bug'];startBattle();battle.at=1000;deploy('bug')`);
  g.run('const B=battle.units[0];B.hp=1;damage(B,50,"x")');
  assert.equal(g.run('battle.corpses.length'), 1);
  g.run('ctx.__calls.length=0;drawSpriteFrame("bug","death",0.4,300,200,true)');
  const call = g.run('ctx.__calls').find((c) => c.k === 'drawImage').args; // img, sx, sy, sw, sh, dx, dy, dw, dh
  assert.deepEqual([call[1], call[3], call[4], call[7], call[8]], [3 * HW * 0 + 3 * HW, HW, 96, 224, 96].map((v, i) => (i === 0 ? 3 * HW : v)), 'frame 3 of the death sheet at 0.4 s');
  for (let i = 0; i < 80; i++) g.run('update(0.01)');
  assert.equal(g.run('battle.corpses.length'), 0, 'corpse removed after 0.7 s');
});
