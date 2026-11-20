// Faculty base sprites (original pixel art, one PNG per faculty) -> assets/bases/<id>.png
// ICT: inspired by the real Faculty of ICT building (MUICT Building, Mahidol Salaya). References: docs/base-remodel/ict/REFERENCES.md
// No photo pixels are used and no official insignia is reproduced (the sign is plain pixel lettering).
// Run: node tools/gen-bases.js   (deterministic; a test fails if the committed PNG is stale)
const fs = require('node:fs');
const path = require('node:path');
const { PixBuf } = require('./pixel/buf');
const { encodePng } = require('./pixel/png');

const C = {
  outline: '#232838',
  cream: '#ece7d8', creamHi: '#f7f3e7', creamSh: '#d2cab6', creamDk: '#bdb59f',
  band: '#bcbeb9', bandDk: '#a2a49f',
  win: '#26364a', winHi: '#3e5b79', mull: '#c9c4b3',
  glassL: '#d3f0e6', glassM: '#a0dacb', glassD: '#6fb8a8', glassMull: '#e9f6f1',
  canTop: '#f6f3ea', canUnder: '#cfcabb', trim: '#d9633a', trimDk: '#a9452b',
  wood: '#d0a76f', woodDk: '#a27b47', woodLn: '#876339',
  door: '#2c4966', doorHi: '#5f93bb',
  stepTop: '#b6b7bc', stepFace: '#8b8c94',
  pillar: '#f2efe6', pillarSh: '#c9c5b6',
  louvre: '#8e918c', louvreDk: '#5d605d',
  signBg: '#27a6ea', signEdge: '#1a6fa8', signText: '#ffffff',
};

const GLYPH = { I: ['111', '010', '010', '010', '111'], C: ['111', '100', '100', '100', '111'], T: ['111', '010', '010', '010', '010'] };
function text(b, str, x, y, c) {
  [...str].forEach((ch, n) => GLYPH[ch].forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') b.set(x + n * 4 + i, y + j, c); })));
}

function drawIct() {
  const b = new PixBuf();
  const G = 54; // wall bottom
  const slope = (x) => Math.floor(x * 3 / 46); // canopy drops 3px towards the viewer's right (3/4 look)

  // right wing (behind everything)
  b.rect(32, 16, 28, G - 16, C.cream);
  b.rect(32, 16, 28, 1, C.creamHi);
  for (const y of [20, 25]) { // upper ribbon windows seen above the canopy
    b.rect(33, y, 12, 3, C.win);
    for (let x = 36; x < 45; x += 4) b.rect(x, y, 1, 3, C.mull);
    b.rect(33, y, 12, 1, C.winHi);
    b.rect(33, y + 3, 12, 1, C.creamSh);
  }
  b.rect(47, 17, 12, 6, C.louvreDk); // louvre / vent panel
  for (let y = 17; y < 23; y += 2) b.rect(47, y, 12, 1, C.louvre);
  // ICT sign on the right wing (plain lettering, not the official logo)
  b.rect(46, 25, 13, 9, C.signEdge);
  b.rect(47, 26, 11, 7, C.signBg);
  text(b, 'ICT', 47, 27, C.signText);
  // lower ribbon windows
  for (const y of [36, 41, 46]) {
    b.rect(47, y, 12, 3, C.win);
    for (let x = 50; x < 59; x += 4) b.rect(x, y, 1, 3, C.mull);
    b.rect(47, y, 12, 1, C.winHi);
    b.rect(47, y + 3, 12, 1, C.creamSh);
    b.rect(47, y + 4, 12, 1, C.creamDk);
  }
  b.rect(46, 16, 1, 9, C.creamSh); b.rect(46, 34, 1, G - 34, C.creamSh); // shaded return
  b.rect(32, G - 2, 28, 2, C.bandDk); // plinth

  // left mass: cream concrete with ribbon windows
  b.rect(2, 8, 20, G - 8, C.cream);
  b.rect(2, 8, 20, 1, C.creamHi);
  for (const y of [11, 17, 23]) {
    b.rect(4, y, 15, 3, C.win);
    for (let x = 8; x < 19; x += 5) b.rect(x, y, 1, 3, C.mull);
    b.rect(4, y, 15, 1, C.winHi);
    b.rect(4, y + 3, 15, 1, C.creamSh);
    b.rect(4, y + 4, 15, 1, C.creamDk);
  }
  b.rect(2, G - 2, 20, 2, C.bandDk);
  for (let y = 8; y < 31; y++) b.rect(19, y, 3, 1, y % 2 ? C.band : C.bandDk); // ribbed grey strip

  // glass stair / lift tower (tallest element)
  b.rect(22, 3, 10, 29, C.glassM);
  b.rect(22, 3, 2, 29, C.glassD);
  b.rect(30, 3, 2, 29, C.glassL);
  for (let y = 3; y < 32; y += 5) b.rect(22, y, 10, 1, C.glassMull);
  b.rect(26, 3, 1, 29, C.glassMull);
  b.rect(22, 2, 10, 1, C.creamSh);

  // recessed entrance: vertical timber slats + glass door
  b.rect(8, 35, 36, G - 35, C.wood);
  for (let x = 8; x < 44; x += 3) b.rect(x, 35, 1, G - 35, C.woodDk);
  for (let x = 9; x < 44; x += 6) b.rect(x, 35, 1, G - 35, C.woodLn);
  b.rect(19, 40, 10, G - 40, C.door);
  b.rect(19, 40, 10, 1, C.creamHi);
  b.rect(23, 41, 2, G - 41, C.doorHi);
  b.rect(20, 42, 2, 3, C.doorHi); b.rect(26, 42, 2, 3, C.doorHi);
  b.rect(8, G - 2, 36, 2, C.woodLn);

  // cantilevered flat canopy with terracotta edge
  for (let x = 0; x <= 46; x++) {
    const y = 30 + slope(x);
    b.set(x, y, C.canTop); b.set(x, y + 1, C.canTop); b.set(x, y + 2, C.trim); b.set(x, y + 3, C.canUnder);
  }
  for (let x = 0; x <= 46; x += 7) b.set(x, 30 + slope(x) + 2, C.trimDk);
  b.rect(44, 36, 2, G - 36, C.pillar); b.rect(45, 36, 1, G - 36, C.pillarSh);
  b.rect(6, 34, 2, G - 34, C.pillar); b.rect(7, 34, 1, G - 34, C.pillarSh);

  // wide stepped stairs (grey concrete); the last row is the ground contact
  for (const [x, w, i] of [[8, 36, 0], [6, 40, 1], [4, 44, 2]]) {
    b.rect(x, 54 + i * 2, w, 1, C.stepTop);
    b.rect(x, 55 + i * 2, w, 1, C.stepFace);
  }
  b.outline(C.outline);
  return b;
}

function crop(b) {
  let x0 = 64, y0 = 64, x1 = -1, y1 = -1;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (b.get(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((y + y0) * 64 + (x + x0)) * 4, d = (y * w + x) * 4;
    out[d] = b.data[s]; out[d + 1] = b.data[s + 1]; out[d + 2] = b.data[s + 2]; out[d + 3] = b.data[s + 3];
  }
  return { w, h, rgba: out };
}
function scaled({ w, h, rgba }, k) {
  const W = w * k, H = h * k, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (Math.floor(y / k) * w + Math.floor(x / k)) * 4, d = (y * W + x) * 4;
    out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = rgba[s + 3];
  }
  return { w: W, h: H, rgba: out };
}

const BASES = { ict: drawIct };

function build() {
  const out = {};
  for (const [id, fn] of Object.entries(BASES)) { const s = crop(fn()); out[id] = { sprite: s, png: encodePng(s.w, s.h, s.rgba) }; }
  return out;
}

function main() {
  const dir = path.join(__dirname, '..', 'assets', 'bases');
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, r] of Object.entries(build())) {
    fs.writeFileSync(path.join(dir, id + '.png'), r.png);
    const x8 = scaled(r.sprite, 8);
    fs.writeFileSync(path.join(__dirname, '..', 'docs', 'base-remodel', id, id + '_x8.png'), encodePng(x8.w, x8.h, x8.rgba));
    console.log(`assets/bases/${id}.png ${r.sprite.w}x${r.sprite.h}`);
  }
}
if (require.main === module) main();
module.exports = { build, BASES };
