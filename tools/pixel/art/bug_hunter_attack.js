// Bug Hunter Attack (6 frames) and Skill "Infinite Loop" (12 frames), built on the approved v3 sprite.
// Body, face, hair, glasses and outfit are copied from v3 (rigid parts, see bug_hunter_anim.js); the laptop arm
// and body lean, the laptop screen glow and small hand-placed pixel VFX (muzzle flash, hologram, beam stub) are
// the only new pixels. The real beam / projectile / damage stay in the game code and are untouched.
//
// Timing contract with the combat code (index.html), do not change without re-checking:
//   attack : 6 frames @ 12 fps = 0.5 s = atkT. Projectile launches at IMPACT_DELAY 0.25 s -> frame 3 (muzzle flash).
//   skill  : 12 frames @ 16.5 fps = 0.727 s ~ SKILL_DUR 0.72 s. fx (code beam) at SKILL_IMPACT 0.43 s -> frame 7.
// Usage: node bug_hunter_attack.js <v3.png> <outDir>   -> attack.png, skill.png
const fs = require('node:fs');
const path = require('node:path');
const { encodePng } = require('../png');
const { makeRenderer, loadSource, N, put } = require('./bug_hunter_anim');

const VC = { w: [255, 255, 255, 255], p: [191, 243, 255, 255], c: [127, 227, 255, 255], b: [43, 155, 255, 255] };
const SCREEN = { I: [35, 101, 246], J: [39, 111, 250] };
const GLOW = [
  null,
  { I: [74, 168, 255], J: [100, 185, 255] },
  { I: [127, 227, 255], J: [160, 238, 255] },
  { I: [191, 243, 255], J: [255, 255, 255], glyph: [35, 101, 246] },
];
const same = (c, d) => c[0] === d[0] && c[1] === d[1] && c[2] === d[2];

function glowSource(at, level) {
  if (!level) return at;
  const g = GLOW[level];
  return (x, y) => {
    const c = at(x, y);
    if (!c) return c;
    if (same(c, SCREEN.I)) return [...g.I, 255];
    if (same(c, SCREEN.J)) return [...g.J, 255];
    if (g.glyph && same(c, [254, 254, 255]) && x >= 62 && x <= 73 && y >= 48 && y <= 56) return [...g.glyph, 255];
    return c;
  };
}

// ---- tiny VFX toolbox (all hard pixels, absolute frame coordinates; kept inside the 96x96 frame) ----
const dot = (cv, x, y, k) => { if (x >= 1 && y >= 1 && x <= N - 2 && y <= N - 2) put(cv, x, y, VC[k]); };
function star(cv, cx, cy, r) { // plus-shaped flash with diagonal sparks
  dot(cv, cx, cy, 'w');
  for (let i = 1; i <= r; i++) { const k = i === r ? 'c' : 'p'; dot(cv, cx + i, cy, k); dot(cv, cx - i, cy, k); dot(cv, cx, cy + i, k); dot(cv, cx, cy - i, k); }
  const d = Math.max(1, Math.round(r / 2));
  dot(cv, cx + d, cy + d, 'c'); dot(cv, cx - d, cy + d, 'c'); dot(cv, cx + d, cy - d, 'c'); dot(cv, cx - d, cy - d, 'c');
}
function beam(cv, x0, x1, y, thick = 3) {
  for (let x = x0; x <= x1; x++) {
    dot(cv, x, y, 'w');
    if (thick >= 3) { dot(cv, x, y - 1, 'p'); dot(cv, x, y + 1, 'p'); }
    if (thick >= 3 && (x + y) % 2 === 0) { dot(cv, x, y - 2, 'c'); dot(cv, x, y + 2, 'c'); }
  }
}
function bits(cv, list) { for (const [x, y, k] of list) dot(cv, x, y, k); }
// holographic code window: frame, dotted glass, three code lines
function holo(cv, x0, y0, w, h, { lines = 3, bright = false, keep = 1 } = {}) {
  const hash = (x, y) => (x * 7 + y * 13 + x * y) % 10;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const edge = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1;
    if (hash(x, y) >= keep * 10) continue;
    if (edge) dot(cv, x, y, bright ? 'w' : 'c');
    else if ((x + y) % 2 === 0) dot(cv, x, y, 'b');
  }
  for (let i = 0; i < lines; i++) {
    const y = y0 + 3 + i * 4, len = [w - 6, w - 9, w - 7][i % 3];
    for (let x = 0; x < len; x++) if (hash(x0 + 2 + x, y) < keep * 10 && (x % 5 !== 4)) dot(cv, x0 + 2 + x, y, bright ? 'w' : 'p');
  }
}

// ---- Attack: 6 frames, release at frame 3 ----
const tip = (f) => ({ x: 75 + f.laptopDx + f.bodyDx, y: 50 + f.laptopDy + f.bob });
const ATTACK = [
  { bodyDx: -1, bob: 0, laptopDx: -2, laptopDy: 1, tuftDx: 1, glow: 0, vfx: (cv, t) => bits(cv, [[t.x - 6, t.y - 6, 'c'], [t.x - 2, t.y - 7, 'p']]) },
  { bodyDx: -1, bob: 0, laptopDx: -1, laptopDy: 0, tuftDx: 1, glow: 1, vfx: (cv, t) => bits(cv, [[t.x - 3, t.y - 4, 'c'], [t.x + 1, t.y, 'p'], [t.x - 2, t.y + 4, 'c'], [t.x - 7, t.y - 6, 'p']]) },
  { bodyDx: 0, bob: -1, laptopDx: 1, laptopDy: -1, tuftDx: 0, glow: 2, vfx: (cv, t) => { dot(cv, t.x + 4, t.y, 'w'); bits(cv, [[t.x + 3, t.y, 'p'], [t.x + 5, t.y, 'p'], [t.x + 4, t.y - 1, 'p'], [t.x + 4, t.y + 1, 'p'], [t.x + 2, t.y - 4, 'c'], [t.x + 7, t.y + 3, 'c'], [t.x + 1, t.y + 4, 'p']]); } },
  { bodyDx: 1, bob: 0, laptopDx: 3, laptopDy: 0, tuftDx: 0, glow: 3, vfx: (cv, t) => { star(cv, t.x + 4, t.y, 5); beam(cv, t.x + 10, Math.min(N - 2, t.x + 22), t.y); bits(cv, [[t.x + 10, t.y - 5, 'c'], [t.x + 14, t.y + 5, 'p'], [t.x + 18, t.y - 4, 'c']]); } },
  { bodyDx: 1, bob: 0, laptopDx: 2, laptopDy: 0, tuftDx: -1, glow: 2, vfx: (cv, t) => { star(cv, t.x + 5, t.y, 2); bits(cv, [[t.x + 9, t.y - 3, 'c'], [t.x + 12, t.y + 2, 'p'], [t.x + 15, t.y - 1, 'c'], [t.x + 8, t.y + 4, 'c']]); } },
  { bodyDx: 0, bob: 0, laptopDx: 1, laptopDy: 0, tuftDx: 0, glow: 1, vfx: (cv, t) => bits(cv, [[t.x + 7, t.y - 2, 'c'], [t.x + 10, t.y + 1, 'p']]) },
];

// ---- Skill: 12 frames, beam release at frame 7 (the game draws the long code beam from col 70, row 36) ----
const HX = 72, HY = 27; // hologram window origin
const SKILL = [
  { bodyDx: -1, bob: 0, laptopDx: -2, laptopDy: 2, tuftDx: 1, glow: 0, vfx: () => {} },
  { bodyDx: -1, bob: 1, laptopDx: -2, laptopDy: 1, tuftDx: 1, glow: 1, vfx: (cv, t) => bits(cv, [[t.x - 5, t.y - 5, 'c'], [t.x - 1, t.y - 6, 'p'], [t.x + 2, t.y - 4, 'c']]) },
  { bodyDx: -1, bob: 1, laptopDx: -1, laptopDy: 0, tuftDx: 0, glow: 1, vfx: (cv, t) => bits(cv, [[t.x - 4, t.y - 8, 'c'], [t.x, t.y - 10, 'p'], [t.x + 3, t.y - 7, 'c'], [t.x - 7, t.y - 5, 'b']]) },
  { bodyDx: 0, bob: 0, laptopDx: 0, laptopDy: -1, tuftDx: -1, glow: 2, vfx: (cv) => { holo(cv, HX + 4, HY + 11, 8, 8, { lines: 1 }); bits(cv, [[HX + 2, HY + 20, 'c'], [HX + 4, HY + 23, 'p']]); } },
  { bodyDx: 0, bob: -1, laptopDx: 1, laptopDy: -1, tuftDx: -1, glow: 2, vfx: (cv) => holo(cv, HX + 2, HY + 6, 11, 13, { lines: 2 }) },
  { bodyDx: 0, bob: -1, laptopDx: 1, laptopDy: -2, tuftDx: 0, glow: 3, vfx: (cv) => holo(cv, HX, HY, 15, 19, { lines: 3 }) },
  { bodyDx: 1, bob: -1, laptopDx: 2, laptopDy: -2, tuftDx: 1, glow: 3, vfx: (cv) => { holo(cv, HX, HY, 15, 19, { lines: 3, bright: true }); bits(cv, [[HX - 3, HY + 2, 'c'], [HX - 3, HY + 16, 'c'], [HX + 18, HY + 2, 'p'], [HX + 18, HY + 16, 'p'], [HX + 8, HY - 3, 'c']]); } },
  { bodyDx: 1, bob: 0, laptopDx: 3, laptopDy: -1, tuftDx: -2, glow: 3, vfx: (cv) => { holo(cv, HX, HY, 15, 19, { lines: 3, bright: true }); star(cv, HX + 16, 36, 3); beam(cv, HX + 18, N - 2, 36, 3); bits(cv, [[HX + 19, 30, 'c'], [HX + 21, 42, 'p'], [HX + 17, 24, 'p']]); } },
  { bodyDx: 1, bob: 0, laptopDx: 3, laptopDy: 0, tuftDx: -1, glow: 3, vfx: (cv) => { holo(cv, HX, HY, 15, 19, { lines: 2, bright: false, keep: 0.8 }); beam(cv, HX + 17, N - 3, 36, 1); star(cv, HX + 16, 36, 2); bits(cv, [[HX + 20, 31, 'c'], [HX + 21, 41, 'p']]); } },
  { bodyDx: 0, bob: 0, laptopDx: 2, laptopDy: 0, tuftDx: 0, glow: 2, vfx: (cv) => { holo(cv, HX, HY, 15, 19, { lines: 1, keep: 0.5 }); bits(cv, [[HX + 3, HY + 22, 'c'], [HX + 9, HY + 25, 'p'], [HX + 14, HY + 23, 'c']]); } },
  { bodyDx: 0, bob: 0, laptopDx: 1, laptopDy: 0, tuftDx: 0, glow: 1, vfx: (cv) => { holo(cv, HX + 1, HY + 3, 13, 13, { lines: 0, keep: 0.2 }); bits(cv, [[HX + 4, HY + 24, 'c'], [HX + 11, HY + 27, 'p']]); } },
  { bodyDx: 0, bob: 0, laptopDx: 0, laptopDy: 0, tuftDx: 0, glow: 0, vfx: (cv) => bits(cv, [[HX + 6, HY + 20, 'c'], [HX + 12, HY + 17, 'p']]) },
];

function strip(frames, file) {
  const w = N * frames.length, rgba = Buffer.alloc(w * N * 4);
  frames.forEach((cv, f) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = cv[y][x]; if (c) rgba.set([c[0], c[1], c[2], 255], (y * w + f * N + x) * 4); } });
  fs.writeFileSync(file, encodePng(w, N, rgba));
}

// body-area holes (1 px gaps with opaque neighbours on both sides), cols 0..60: the VFX are separate pixels on purpose
function bodyHoles(cv) {
  const o = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !!cv[y][x];
  let h = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x <= 60; x++) if (!o(x, y) && ((o(x - 1, y) && o(x + 1, y)) || (o(x, y - 1) && o(x, y + 1)))) h++;
  return h;
}

// a 1 px notch inside the white outer outline (opened when a part shifts) is closed with the outline colour; rows < 20
// (the ahoge ring, which is a hole in the approved art itself) are left alone
function healOutline(cv) {
  const white = (c) => c && c[0] >= 240 && c[1] >= 240 && c[2] >= 240;
  for (let y = 20; y < N; y++) for (let x = 1; x <= 60; x++) {
    if (cv[y][x]) continue;
    if (white(cv[y][x - 1]) && white(cv[y][x + 1])) cv[y][x] = cv[y][x - 1];
    else if (white(cv[y - 1][x]) && white(cv[y + 1][x])) cv[y][x] = cv[y - 1][x];
  }
}

function build(v3file) {
  const at = loadSource(v3file), render = makeRenderer(at);
  const baseHoles = bodyHoles(render({}));
  const mk = (list) => list.map((f) => {
    const draw = (tuftDx) => render({ bob: f.bob, bodyDx: f.bodyDx, laptopDx: f.laptopDx, laptopDy: f.laptopDy, tuftDx, laptopSrc: glowSource(at, f.glow) });
    // the tuft sways relative to the head; if that opens a 1 px gap in the hair outline, keep it rigid with the head
    let cv = draw(f.tuftDx);
    if (bodyHoles(cv) > baseHoles) cv = draw(0);
    healOutline(cv);
    f.vfx(cv, tip(f));
    return cv;
  });
  return { attack: mk(ATTACK), skill: mk(SKILL) };
}

if (require.main === module) {
  const [, , IN, OUTDIR] = process.argv;
  const { attack, skill } = build(IN);
  fs.mkdirSync(OUTDIR, { recursive: true });
  strip(attack, path.join(OUTDIR, 'attack.png'));
  strip(skill, path.join(OUTDIR, 'skill.png'));
  console.log('wrote attack.png (6 frames) and skill.png (12 frames) to', OUTDIR);
}
module.exports = { build };
