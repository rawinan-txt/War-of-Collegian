// Enemy sprites (original chibi pixel art) -> assets/enemies/<id>/idle.png + assets/enemies/enemies.js (ENEMY_ANIMS)
// Visual remodel only: gameplay stats live in index.html (enemyTemplates) and are never touched here.
// Concept reference: docs/reference/enemy-roster.png (used as inspiration, never cropped or scaled into a sprite).
// Art faces RIGHT like the heroes; the game mirrors enemies at draw time so they face the player's side.
// Run: node tools/gen-enemies.js   (deterministic)
const fs = require('node:fs');
const path = require('node:path');
const { PixBuf } = require('./pixel/buf');
const { encodePng, } = require('./pixel/png');

const OUT_DARK = '#1b1a33', OUT_WHITE = '#ffffff';
const P = {
  paper: '#f6f2e8', paperHi: '#ffffff', paperSh: '#d8d1be', paperDk: '#b3aa95', edge: '#5d567a',
  ink: '#3b3f7d', inkHi: '#7f86d6', line: '#8c94bd',
  red: '#ff2b3e', redDk: '#b3122c', redHi: '#ffc2a8',
  mouth: '#3c0f2c', tooth: '#fffaf0',
  pink: '#ff6fa6', yel: '#ffd23a', grn: '#52d49a', blu: '#58b8ff',
  boot: '#3a3454', bootHi: '#5a5280', arm: '#4a4468', glove: '#f6f2e8',
  aura: '#a35bff', auraHi: '#d2b0ff',
};

// ---------- Assignment Monster (enemy id "assignment", type basic) ----------
function drawAssignment() {
  const b = new PixBuf();
  // feet
  b.rect(19, 51, 8, 4, P.boot); b.rect(19, 51, 8, 1, P.bootHi); b.rect(37, 51, 8, 4, P.boot); b.rect(37, 51, 8, 1, P.bootHi);
  // stack body: jagged layered sheets (front face)
  const layers = [[45, 14, 36, 7], [40, 13, 37, 6], [35, 15, 35, 6], [30, 14, 36, 6]];
  layers.forEach(([y, x, w, h], i) => {
    b.rect(x, y, w, h, i % 2 ? P.paperSh : P.paper);
    b.rect(x, y, w, 1, P.paperHi);             // lit top edge
    b.rect(x, y + h - 1, w, 1, P.paperDk);     // shaded lower edge = visible sheet thickness
    b.rect(x, y, 1, h, P.edge); b.rect(x + w - 1, y, 1, h, P.edge);
  });
  // sheet-edge ticks beside the face so the stack still reads as many pages
  for (const y of [34, 40, 46]) { b.rect(15, y, 3, 1, P.paperDk); b.rect(46, y, 3, 1, P.paperDk); }
  // top sheet, tilted like a hat: rows shift right every 4px
  const rows = [];
  for (let j = 0; j < 15; j++) rows.push([Math.floor(j / 5), 31]);
  b.shape(16, 15, rows, P.paper);
  rows.forEach(([ox, w], j) => { b.set(16 + ox, 15 + j, P.edge); b.set(16 + ox + w - 1, 15 + j, P.edge); });
  b.rect(16, 15, 31, 1, P.edge); b.rect(16, 29, 31, 1, P.paperDk);
  b.rect(17, 16, 30, 1, P.paperHi);
  // folded corner (top right)
  b.shape(41, 16, [[0, 6], [1, 5], [2, 4], [3, 3], [4, 2]], P.paperSh); b.rect(46, 15, 1, 1, P.edge);
  // title bar + text lines + red check box (reads as an assignment sheet)
  b.rect(20, 18, 20, 4, P.ink); for (let k = 0; k < 7; k++) b.rect(21 + k * 3, 19, 2, 2, P.inkHi);
  b.rect(21, 24, 15, 1, P.line); b.rect(21, 27, 11, 1, P.line);
  b.rect(38, 23, 5, 5, P.redDk); b.rect(39, 24, 3, 3, P.paperHi); b.set(39, 26, P.red); b.set(40, 25, P.red); b.set(41, 24, P.red);
  // sticky tabs (faculty-colour bits stand in for dozens of overdue pages)
  b.rect(10, 32, 5, 4, P.pink); b.rect(11, 38, 4, 4, P.yel); b.rect(49, 36, 6, 4, P.grn); b.rect(46, 20, 5, 3, P.blu);
  b.rect(10, 32, 5, 1, '#ffb0cc'); b.rect(49, 36, 6, 1, '#a6f0cf');
  // angry face on the front of the stack (turned slightly toward the heroes)
  const eye = (x) => { b.rect(x, 33, 7, 5, P.redDk); b.rect(x + 1, 34, 5, 3, P.red); b.rect(x + 3, 35, 2, 2, P.redHi); };
  eye(21); eye(33);
  // slanted brows: inner ends low
  for (let k = 0; k < 6; k++) { b.rect(20 + k, 31 + Math.floor(k * 0.5), 2, 2, OUT_DARK); b.rect(41 - k, 31 + Math.floor(k * 0.5), 2, 2, OUT_DARK); }
  // wide jagged mouth
  b.rect(23, 41, 18, 5, P.mouth);
  for (let k = 0; k < 6; k++) { b.rect(24 + k * 3, 41, 2, 2, P.tooth); if (k < 5) b.rect(25 + k * 3, 44, 2, 2, P.tooth); }
  // arms: dark stick arms with paper gloves, right one raised and clenched
  b.rect(11, 44, 3, 5, P.arm); b.rect(10, 48, 4, 3, P.glove);
  b.rect(50, 40, 3, 6, P.arm); b.rect(51, 37, 5, 4, P.glove); b.rect(52, 36, 3, 1, P.paperHi);
  // dark inner outline + light outer outline, same pair the heroes use
  b.outline(OUT_DARK); b.outline(OUT_WHITE);
  // detached bits drawn after the outline: loose pages and angry purple sparks around the pile
  const page = (x, y) => { b.rect(x, y, 5, 4, P.paper); b.rect(x, y + 3, 5, 1, P.paperDk); b.rect(x + 1, y + 1, 3, 1, P.line); };
  page(5, 20); page(54, 23); page(7, 27);
  for (const [x, y] of [[9, 16], [57, 28], [53, 14], [4, 38]]) { b.set(x, y, P.aura); b.set(x + 1, y + 1, P.auraHi); }
  return b;
}

const ENEMIES = {
  assignment: { title: 'Assignment Monster', draw: drawAssignment },
};

// 64x64 single idle frame; later steps add walk/attack/hurt/death sheets using the same registry shape as CHARACTER_ANIMS
function registry() {
  const out = {};
  for (const [id, e] of Object.entries(ENEMIES)) {
    out[id] = { name: e.title, enemy: true, anims: { idle: { sheet: `assets/enemies/${id}/idle.png`, frameWidth: 64, frameHeight: 64, frameCount: 1, frameRate: 6, repeat: -1 } } };
  }
  return out;
}

function scaled(buf, k) {
  const W = 64 * k, out = Buffer.alloc(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const s = (Math.floor(y / k) * 64 + Math.floor(x / k)) * 4, d = (y * W + x) * 4;
    out[d] = buf.data[s]; out[d + 1] = buf.data[s + 1]; out[d + 2] = buf.data[s + 2]; out[d + 3] = buf.data[s + 3];
  }
  return { w: W, rgba: out };
}

function main() {
  const root = path.join(__dirname, '..');
  for (const [id, e] of Object.entries(ENEMIES)) {
    const dir = path.join(root, 'assets', 'enemies', id);
    fs.mkdirSync(dir, { recursive: true });
    const buf = e.draw();
    fs.writeFileSync(path.join(dir, 'idle.png'), encodePng(64, 64, Buffer.from(buf.data)));
    const pdir = path.join(root, 'docs', 'enemy-remodel');
    fs.mkdirSync(pdir, { recursive: true });
    const x8 = scaled(buf, 8);
    fs.writeFileSync(path.join(pdir, id + '_x8.png'), encodePng(x8.w, x8.w, x8.rgba));
    console.log(`assets/enemies/${id}/idle.png`, buf.count(), 'opaque px');
  }
  fs.writeFileSync(path.join(root, 'assets', 'enemies', 'enemies.js'),
    '// generated by tools/gen-enemies.js - visual registry for enemies (separate from CHARACTER_ANIMS so hero tooling is untouched)\n' +
    'globalThis.ENEMY_ANIMS = ' + JSON.stringify(registry()) + ';\n');
}
if (require.main === module) main();
module.exports = { ENEMIES, registry, drawAssignment };
