// Bug Hunter Hurt (3 frames) and Death (6 frames), built on the approved v3 sprite.
// Hurt  : recoil + pained ">  <" eyes (glasses stay), laptop stays in hand. 3 frames @ 12 fps = HURT_DUR 0.25 s.
// Death : stagger, fall backwards (nearest-neighbour rotation of the whole figure incl. laptop), X eyes, then a digital
//         dissolve. 6 frames @ 8.5 fps = 0.706 s ~ the corpse lifetime (0.7 s); the last frame is almost gone.
//         Death frames are 224x96 so the lying figure fits; the standing pose keeps the same screen position as idle.
// Usage: node bug_hunter_hurt_death.js <v3.png> <outDir>   -> hurt.png (3x96), death.png (6x224)
const fs = require('node:fs');
const path = require('node:path');
const { encodePng } = require('../png');
const { makeRenderer, loadSource, N } = require('./bug_hunter_anim');

const K = [5, 4, 13, 255], SK = [252, 225, 204, 255];
const VC = { p: [191, 243, 255, 255], c: [127, 227, 255, 255] };
const at = loadSource(process.argv[2] || 'docs/preview/bug_hunter_96_v3.png');
const baseRender = makeRenderer(at);
// body-area 1 px notches (cols 0..60), and the fix for them: close notches inside the white outline (rows >= 20, the ahoge
// ring above is part of the approved art) and let the tuft stay rigid with the head when its sway would open one
const holesOf = (cv) => { const o = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !!cv[y][x]; let h = 0; for (let y = 0; y < N; y++) for (let x = 0; x <= 60; x++) if (!o(x, y) && ((o(x - 1, y) && o(x + 1, y)) || (o(x, y - 1) && o(x, y + 1)))) h++; return h; };
function heal(cv) {
  const white = (c) => c && c[0] >= 240 && c[1] >= 240 && c[2] >= 240;
  for (let y = 20; y < N; y++) for (let x = 1; x <= 60; x++) {
    if (cv[y][x]) continue;
    if (white(cv[y][x - 1]) && white(cv[y][x + 1])) cv[y][x] = cv[y][x - 1];
    else if (white(cv[y - 1][x]) && white(cv[y + 1][x])) cv[y][x] = cv[y - 1][x];
  }
}
function render(p) {
  let best = null, bh = 1e9;
  for (const tuftDx of [p.tuftDx, 0, 1, -1, 2, -2]) {
    const cv = baseRender({ ...p, tuftDx }); heal(cv);
    const h = holesOf(cv);
    if (h < bh) { bh = h; best = cv; }
    if (h <= 8) break;
  }
  return best;
}

// eye interiors in v3 coordinates: near eye cols 43..48, far eye cols 55..58, rows 38..42 (row 37 is the lash line)
const paint = (rects, list) => {
  const px = [];
  for (const [x0, x1] of rects) for (let y = 38; y <= 42; y++) for (let x = x0; x <= x1; x++) px.push([x, y, SK]);
  for (const [x, y] of list) px.push([x, y, K]);
  return [{ x: 0, y: 0, pixels: px }];
};
const PAIN = paint([[43, 48], [55, 58]], [
  [43, 38], [44, 38], [45, 39], [46, 39], [47, 40], [48, 40], [45, 41], [46, 41], [43, 42], [44, 42], // >
  [57, 38], [58, 38], [56, 39], [57, 39], [55, 40], [56, 40], [56, 41], [57, 41], [57, 42], [58, 42], // <
]);
const XEYES = paint([[43, 48], [55, 58]], [
  [43, 38], [47, 38], [44, 39], [46, 39], [45, 40], [44, 41], [46, 41], [43, 42], [47, 42], // X (near)
  [55, 39], [57, 39], [56, 40], [55, 41], [57, 41], // x (far)
]);
const sweat = [{ x: 0, y: 0, pixels: [[63, 36, VC.p], [63, 37, VC.c], [62, 38, VC.c], [63, 38, VC.c]] }];

// ---------------- Hurt ----------------
const HURT = [
  { bodyDx: -2, bob: -1, laptopDx: -2, laptopDy: -2, tuftDx: 2, overlays: PAIN },
  { bodyDx: -3, bob: 0, laptopDx: -3, laptopDy: -1, tuftDx: 2, overlays: [...PAIN, ...sweat] },
  { bodyDx: -1, bob: 0, laptopDx: -1, laptopDy: 0, tuftDx: 1, overlays: [] },
].map((p) => render({ ...p, waistShear: true }));

// ---------------- Stun (4 frames, loop): dizzy swirl eyes, head wobble ----------------
const ring = (cols, rows = [38, 39, 40, 41, 42]) => {
  const [a, b, c, d] = cols;
  return [[b, rows[0]], [c, rows[0]], [a, rows[1]], [d, rows[1]], [a, rows[2]], [c, rows[2]], [d, rows[2]], [a, rows[3]], [d, rows[3]], [b, rows[4]], [c, rows[4]]];
};
const SWIRL = paint([[43, 48], [55, 58]], [...ring([44, 45, 46, 47]), ...ring([55, 56, 57, 58])]);
const STUN = [
  { bodyDx: -1, bob: 0, laptopDx: -1, laptopDy: 1, tuftDx: 1 },
  { bodyDx: 0, bob: 1, laptopDx: 0, laptopDy: 1, tuftDx: 0 },
  { bodyDx: 1, bob: 0, laptopDx: 1, laptopDy: 0, tuftDx: -1 },
  { bodyDx: 0, bob: 1, laptopDx: 0, laptopDy: 0, tuftDx: 1 },
].map((p) => render({ ...p, waistShear: true, overlays: SWIRL }));

// ---------------- Death ----------------
const W = 224, OX = 64;                       // death frame width; standing figure shifted +64 so its feet stay put
const PIVOT = [36, 89];                       // rotate about the rear heel: feet stay planted while the body tips back
const blank = () => Array.from({ length: N }, () => Array(W).fill(null));
function shifted(cv) { const out = blank(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (cv[y][x]) out[y][x + OX] = cv[y][x]; return out; }
function rotate(cv, deg, lie = false) {
  const th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th), px = PIVOT[0] + OX, py = PIVOT[1];
  const out = blank();
  for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) {
    const dx = x - px, dy = y - py;
    // inverse of a counter-clockwise (screen) rotation by `deg`
    const sx = Math.round(px + c * dx - s * dy), sy = Math.round(py + s * dx + c * dy);
    if (sx >= 0 && sx < W && sy >= 0 && sy < N && cv[sy][sx]) out[y][x] = cv[sy][sx];
  }
  // ground contact: never below the ground line (row 89); the lying pose (lie) rests exactly on it, the tipping poses
  // keep their feet planted at the heel pivot
  let bottom = -1;
  for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) if (out[y][x]) bottom = Math.max(bottom, y);
  const dy = bottom > 89 || lie ? 89 - bottom : 0;
  if (dy === 0) return out;
  const moved = blank();
  for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) if (out[y][x] && y + dy >= 0 && y + dy < N) moved[y + dy][x] = out[y][x];
  return moved;
}
const hash = (x, y, k) => ((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0;
function dissolve(cv, p, k) {
  for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) if (cv[y][x] && (hash(x, y, k) % 1000) / 1000 < p) cv[y][x] = null;
}
function bits(cv, list) { for (const [x, y, c] of list) if (x >= 1 && y >= 1 && x < W - 1 && y < N - 1) cv[y][x] = VC[c]; }
function bounds(cv) { let x0 = W, x1 = -1, y0 = N, y1 = -1; for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) if (cv[y][x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; }

const pose = (extra = {}) => render({ bodyDx: -3, bob: 0, laptopDx: -2, laptopDy: -1, tuftDx: 2, waistShear: true, overlays: PAIN, ...extra });
const down = (overlays) => render({ bodyDx: -2, bob: 0, laptopDx: -1, laptopDy: 0, tuftDx: 1, waistShear: true, overlays });

const f0 = shifted(render({ bodyDx: -3, bob: -1, laptopDx: -3, laptopDy: -3, tuftDx: 2, waistShear: true, overlays: PAIN }));
const f1 = rotate(shifted(pose()), 20);
const f2 = rotate(shifted(down(PAIN)), 48);
const f3 = rotate(shifted(down(XEYES)), 90, true);
const f4 = rotate(shifted(down(XEYES)), 90, true);
const f5 = rotate(shifted(down(XEYES)), 90, true);
dissolve(f4, 0.4, 4);
const b4 = bounds(f4), b5 = bounds(f5);
bits(f4, [[b4.x0 + 18, b4.y0 - 3, 'c'], [b4.x0 + 40, b4.y0 - 6, 'p'], [b4.x0 + 62, b4.y0 - 2, 'c'], [b4.x0 + 28, b4.y0 - 10, 'p']]);
dissolve(f5, 0.86, 5);
bits(f5, [[b5.x0 + 12, b5.y0 - 9, 'p'], [b5.x0 + 35, b5.y0 - 13, 'c'], [b5.x0 + 55, b5.y0 - 8, 'c'], [b5.x0 + 70, b5.y0 - 14, 'p']]);
const DEATH = [f0, f1, f2, f3, f4, f5];

function strip(frames, fw, file) {
  const w = fw * frames.length, rgba = Buffer.alloc(w * N * 4);
  frames.forEach((cv, f) => { for (let y = 0; y < N; y++) for (let x = 0; x < fw; x++) { const c = cv[y][x]; if (c) rgba.set([c[0], c[1], c[2], 255], (y * w + f * fw + x) * 4); } });
  fs.writeFileSync(file, encodePng(w, N, rgba));
}

const OUT = process.argv[3];
if (OUT) {
  fs.mkdirSync(OUT, { recursive: true });
  strip(HURT, N, path.join(OUT, 'hurt.png'));
  strip(STUN, N, path.join(OUT, 'stun.png'));
  strip(DEATH, W, path.join(OUT, 'death.png'));
  console.log('wrote hurt.png (3 frames, 96x96) and death.png (6 frames, 224x96) to', OUT);
}
module.exports = { HURT, STUN, DEATH, W };
