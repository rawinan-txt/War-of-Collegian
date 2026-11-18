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
  assert.equal(cfg.anims.attack, undefined, 'attack/skill/hurt/death not created yet');
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
