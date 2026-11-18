// Bug Hunter v3 animation frames, derived from the approved static sprite (docs/preview/bug_hunter_96_v3.png).
// Every frame is made only of pixels copied from v3 - no blending, no new colours, no scaling - so face, hair,
// colours and proportions stay identical.
//
// Parts (all rigid; nothing is stretched or sheared):
//   legs    : each leg = thigh (rows 72-76) + shin (77-81) + foot (82-89), translated as rigid blocks
//   upper   : head, torso, backpack, hip arm (bob)
//   laptop  : laptop + holding hand (own swing, gap-filled at the seam)
//   tuft    : ahoge sway
// Extension points for later poses (Attack / Skill): render() accepts `overlays` (extra pixel maps drawn over the
// body, e.g. a redrawn arm) and `laptopSrc` (a replacement for the laptop+hand pixels).
//
// Usage: node bug_hunter_anim.js <v3.png> <outDir>   -> idle.png (4 frames), walk.png (6 frames)
const fs = require('node:fs');
const path = require('node:path');
const { decodePng, encodePng } = require('../png');

const N = 96;
const FEET = 89;
const LEG_X = [{ x0: 30, x1: 46, phase: 0 }, { x0: 47, x1: 62, phase: Math.PI }]; // far leg first, near leg last
const PIECES = [{ y0: 72, y1: 76, k: 1 / 3, lift: 0 }, { y0: 77, y1: 81, k: 2 / 3, lift: 0.5 }, { y0: 82, y1: 89, k: 1, lift: 1 }];
const UPPER_MAX = 74;
const LAPTOP = { x0: 61, x1: 80, y0: 43, y1: 64 };
const TUFT = { x0: 38, x1: 60, y0: 3, y1: 10 };

function loadSource(file) {
  const img = decodePng(fs.readFileSync(file));
  return (x, y) => (x < 0 || y < 0 || x >= N || y >= N || !img.rgba[(y * N + x) * 4 + 3] ? null : Array.from(img.rgba.slice((y * N + x) * 4, (y * N + x) * 4 + 4)));
}

const blank = () => Array.from({ length: N }, () => Array(N).fill(null));
const put = (cv, x, y, c) => { if (c && x >= 0 && y >= 0 && x < N && y < N) cv[y][x] = c; };
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const has = (cv, x, y) => x >= 0 && y >= 0 && x < N && y < N && !!cv[y][x];

// copy the nearest moved pixel into the 1-2 px gap a moving part leaves against its neighbour
function fillSeam(cv, rect, dx, dy, bob) {
  const y0 = rect.y0 + bob, y1 = rect.y1 + bob;
  if (dx > 0) for (let y = y0; y <= y1; y++) for (let x = rect.x0; x < rect.x0 + dx; x++) if (!cv[y][x] && has(cv, x - 1, y) && has(cv, x + dx, y)) cv[y][x] = cv[y][x + dx];
  if (dy > 0) for (let y = y0; y < y0 + dy; y++) for (let x = rect.x0; x <= rect.x1; x++) if (!cv[y][x] && has(cv, x, y - 1) && has(cv, x, y + dy)) cv[y][x] = cv[y + dy][x];
  if (dy < 0) for (let y = y1 + dy + 1; y <= y1; y++) for (let x = rect.x0; x <= rect.x1; x++) if (!cv[y][x] && has(cv, x, y + 1) && has(cv, x, y + dy)) cv[y][x] = cv[y + dy][x];
}

function makeRenderer(at) {
  return function render({ bob = 0, bodyDx = 0, legSwing = 0, legLift = 0, legPhase = 0, laptopDx = 0, laptopDy = 0, tuftDx = 0, walking = false, overlays = [], laptopSrc = at }) {
    const cv = blank();
    // legs: rigid thigh / shin / foot blocks; foot moves the full stride, shin and thigh follow partially
    if (walking) {
      for (const leg of LEG_X) {
        const th = legPhase + leg.phase;
        const stride = legSwing * Math.sin(th);
        const lift = legLift * Math.max(0, Math.cos(th));
        for (const p of PIECES) {
          const dx = Math.round(stride * p.k), dy = -Math.round(lift * p.lift);
          for (let y = p.y0; y <= p.y1; y++) for (let x = leg.x0; x <= leg.x1; x++) put(cv, x + dx, y + dy, at(x, y));
        }
      }
    } else {
      for (let y = 72; y <= FEET; y++) for (let x = 0; x < N; x++) put(cv, x, y, at(x, y));
    }
    // upper body (laptop+hand and tuft are separate parts)
    for (let y = 0; y <= UPPER_MAX; y++) for (let x = 0; x < N; x++) if (!inRect(LAPTOP, x, y) && !inRect(TUFT, x, y)) put(cv, x + bodyDx, y + bob, at(x, y));
    // tuft sways more toward the tip
    for (let y = TUFT.y0; y <= TUFT.y1; y++) {
      const dx = Math.round(tuftDx * (1 - (y - TUFT.y0) / (TUFT.y1 - TUFT.y0 + 1)));
      for (let x = TUFT.x0; x <= TUFT.x1; x++) put(cv, x + dx + bodyDx, y + bob, at(x, y));
    }
    // laptop + hand
    for (let y = LAPTOP.y0; y <= LAPTOP.y1; y++) for (let x = LAPTOP.x0; x <= LAPTOP.x1; x++) put(cv, x + laptopDx + bodyDx, y + laptopDy + bob, laptopSrc(x, y));
    fillSeam(cv, { x0: LAPTOP.x0 + bodyDx, x1: LAPTOP.x1 + bodyDx, y0: LAPTOP.y0, y1: LAPTOP.y1 }, laptopDx, laptopDy, bob);
    // overlays: [{x, y, rows: ['..AB', ...], colours: {A: [r,g,b,a]}}] or [{x, y, pixels: [[x,y,[r,g,b,a]], ...]}]
    for (const o of overlays) for (const [px, py, c] of o.pixels) put(cv, o.x + px, o.y + py + bob, c);
    return cv;
  };
}

function strip(frames, file) {
  const w = N * frames.length, rgba = Buffer.alloc(w * N * 4);
  frames.forEach((cv, f) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = cv[y][x]; if (c) rgba.set([c[0], c[1], c[2], 255], (y * w + f * N + x) * 4); } });
  fs.writeFileSync(file, encodePng(w, N, rgba));
}

const IDLE = [
  { bob: 0, laptopDy: 0, tuftDx: 0 },
  { bob: 0, laptopDy: -1, tuftDx: 1 },
  { bob: -1, laptopDy: 0, tuftDx: 1 },
  { bob: -1, laptopDy: 1, tuftDx: -1 },
];
const WALK = [
  { bob: -1, laptopDx: 0, laptopDy: -1, tuftDx: -1 },
  { bob: 0, laptopDx: -1, laptopDy: 0, tuftDx: 0 },
  { bob: 0, laptopDx: -1, laptopDy: 1, tuftDx: 1 },
  { bob: -1, laptopDx: 0, laptopDy: -1, tuftDx: 0 },
  { bob: 0, laptopDx: 1, laptopDy: 0, tuftDx: -1 },
  { bob: 0, laptopDx: 1, laptopDy: 1, tuftDx: 0 },
];

function build(v3file) {
  const render = makeRenderer(loadSource(v3file));
  return {
    idle: IDLE.map((p) => render(p)),
    walk: WALK.map((p, i) => render({ ...p, walking: true, legSwing: 4, legLift: 4, legPhase: (2 * Math.PI * i) / 6 })),
  };
}

if (require.main === module) {
  const [, , IN, OUTDIR] = process.argv;
  const { idle, walk } = build(IN);
  fs.mkdirSync(OUTDIR, { recursive: true });
  strip(idle, path.join(OUTDIR, 'idle.png'));
  strip(walk, path.join(OUTDIR, 'walk.png'));
  console.log('wrote idle.png (4 frames) and walk.png (6 frames) to', OUTDIR);
}
module.exports = { build, makeRenderer, loadSource, N, put };
