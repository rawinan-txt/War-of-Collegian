// Approved static enemy drawings (64x64 chibi pixel art). Each draw function returns a RigBuf: the body before mark(),
// detached bits after it. Frame 0 of every idle sheet must equal the approved static drawing (see tests/enemies.test.js).
const { PixBuf } = require('../pixel/buf');
const { RigBuf } = require('./rig');

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
  const b = new RigBuf();
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
  b.mark();
  // detached bits drawn after the outline: loose pages and angry purple sparks around the pile
  const page = (x, y) => { b.rect(x, y, 5, 4, P.paper); b.rect(x, y + 3, 5, 1, P.paperDk); b.rect(x + 1, y + 1, 3, 1, P.line); };
  page(5, 20); page(54, 23); page(7, 27);
  for (const [x, y] of [[9, 16], [57, 28], [53, 14], [4, 38]]) { b.set(x, y, P.aura); b.set(x + 1, y + 1, P.auraHi); }
  return b;
}

// ---------- shared bits for the exam / deadline family ----------
const GOLD = '#ffcf3a', GOLD_HI = '#fff0a0', GOLD_DK = '#c98a12';
function angryEyes(b, x1, x2, y, w = 7, h = 5) {
  for (const x of [x1, x2]) { b.rect(x, y, w, h, P.redDk); b.rect(x + 1, y + 1, w - 2, h - 2, P.red); b.rect(x + w - 4, y + 2, 2, 2, P.redHi); }
  // slanted brows: inner ends low
  for (let k = 0; k < w - 1; k++) { b.rect(x1 - 1 + k, y - 3 + Math.floor(k * 0.5), 2, 2, OUT_DARK); b.rect(x2 + w - k, y - 3 + Math.floor(k * 0.5), 2, 2, OUT_DARK); }
}
function fangs(b, x, y, w, h) {
  b.rect(x, y, w, h, P.mouth);
  for (let k = 0; k * 3 + 1 < w - 1; k++) { b.rect(x + 1 + k * 3, y, 2, 2, P.tooth); if (k * 3 + 3 < w - 1) b.rect(x + 2 + k * 3, y + h - 2, 2, 2, P.tooth); }
}
function boots(b, x1, x2, y) { for (const x of [x1, x2]) { b.rect(x, y, 8, 4, P.boot); b.rect(x, y, 8, 1, P.bootHi); } }
function sparks(b, pts) { for (const [x, y] of pts) { b.set(x, y, P.aura); b.set(x + 1, y + 1, P.auraHi); } }

// ---------- Deadline Monster (enemy id "deadline", type basic, fast): evil laptop-calendar with an alarm clock ----------
function drawDeadline() {
  const b = new RigBuf();
  boots(b, 17, 39, 51);
  // calendar base: red header, grid, red X marks on missed days
  b.rect(11, 41, 42, 11, P.paper); b.rect(11, 41, 42, 2, P.redDk); b.rect(11, 51, 42, 1, P.paperDk);
  b.rect(11, 41, 1, 11, P.edge); b.rect(52, 41, 1, 11, P.edge);
  for (const x of [18, 25, 32, 39, 46]) b.rect(x, 43, 1, 8, P.line);
  for (const y of [46, 49]) b.rect(12, y, 40, 1, P.line);
  const cross = (x, y) => { b.set(x, y, P.red); b.set(x + 2, y, P.red); b.set(x + 1, y + 1, P.red); b.set(x, y + 2, P.red); b.set(x + 2, y + 2, P.red); };
  cross(13, 44); cross(27, 44); cross(41, 44); cross(20, 47); cross(34, 47); cross(48, 47); cross(13, 50 - 1 + 1 - 1);
  // laptop screen with the face
  b.rect(13, 26, 38, 15, P.boot); b.rect(13, 26, 38, 1, P.bootHi); b.rect(15, 28, 34, 11, '#1d1736');
  b.rect(13, 26, 1, 15, P.edge); b.rect(50, 26, 1, 15, P.edge);
  angryEyes(b, 18, 33, 31, 8, 4);
  fangs(b, 24, 36, 16, 3);
  // alarm clock on top: bells, red body, white face with hands
  b.disc(24, 19, 2, GOLD); b.disc(40, 19, 2, GOLD); b.rect(23, 18, 2, 1, GOLD_HI); b.rect(39, 18, 2, 1, GOLD_HI);
  b.disc(32, 22, 6, P.redDk); b.disc(32, 22, 5, '#ec3a52'); b.disc(32, 22, 3, P.paperHi);
  b.rect(32, 20, 1, 3, OUT_DARK); b.rect(32, 22, 3, 1, OUT_DARK);
  b.rect(31, 27, 3, 1, P.edge);
  // little arms
  b.rect(8, 40, 4, 3, P.arm); b.rect(7, 42, 4, 3, P.glove); b.rect(53, 38, 4, 3, P.arm); b.rect(55, 36, 4, 3, P.glove);
  b.mark();
  // detached: speed dashes behind it (it is the fast one) + purple sparks + a flying page
  b.rect(1, 42, 5, 1, P.paperHi); b.rect(3, 46, 6, 1, P.paperHi); b.rect(0, 50, 4, 1, P.paperHi);
  sparks(b, [[8, 20], [54, 24], [58, 44]]);
  b.rect(52, 17, 5, 4, P.paper); b.rect(52, 20, 5, 1, P.paperDk); b.rect(53, 18, 3, 1, P.line);
  return b;
}

// ---------- Group Project Gang (enemy id "group", type tank): three shadow students, laptops and a GROUP flag ----------
function drawGroup() {
  const b = new RigBuf();
  const SH = '#2b2447', SH_HI = '#463c76', SH_DK = '#1d1733';
  const student = (cx, headY, r, bodyTop, bodyW) => {
    b.rect(cx - (bodyW >> 1), bodyTop, bodyW, 51 - bodyTop, SH); b.rect(cx - (bodyW >> 1), bodyTop, 2, 51 - bodyTop, SH_HI);
    b.disc(cx, headY, r, SH); b.rect(cx - r + 1, headY - r + 2, 2, 3, SH_HI);
    // glowing angry eyes
    for (const ex of [cx - 4, cx + 1]) { b.rect(ex, headY - 1, 3, 2, P.paperHi); b.set(ex + 2, headY - 2, SH_DK); b.set(ex + 1, headY - 2, SH_DK); }
    b.rect(cx - 2, headY + 3, 5, 1, P.red); // tight little grin
  };
  student(32, 25, 7, 31, 16);    // middle, tallest, holds the flag
  student(17, 31, 6, 37, 14);
  student(47, 31, 6, 37, 14);
  boots(b, 10, 20, 51); boots(b, 36, 46, 51);
  // laptops: dark lids with a glowing logo, pointing at the viewer
  const laptop = (x) => { b.rect(x, 42, 16, 9, '#7f89ad'); b.rect(x + 1, 43, 14, 7, '#aeb7d6'); b.rect(x + 6, 45, 4, 3, '#58b8ff'); b.rect(x, 50, 16, 2, '#59628a'); };
  laptop(9); laptop(39);
  // flag pole + red banner with white block lettering (GROUP)
  b.rect(46, 17, 2, 18, '#7a5230'); b.rect(46, 17, 1, 18, '#a87848');
  b.rect(34, 16, 14, 8, P.redDk); b.rect(35, 17, 12, 6, '#c4263f');
  for (let k = 0; k < 5; k++) b.rect(36 + k * 2, 19, 1, 3, P.paperHi);
  b.rect(48, 16, 3, 2, P.redDk);
  b.mark();
  sparks(b, [[6, 22], [56, 40], [3, 44]]);
  return b;
}

// ---------- Midterm Exam (enemy id "quiz", type ranged): angry exam paper aiming a giant pencil ----------
function drawMidterm() {
  const b = new RigBuf();
  boots(b, 15, 29, 51);
  // upright exam paper with folded corner and a red MIDTERM header
  b.rect(13, 15, 30, 37, P.paper); b.rect(13, 15, 30, 1, P.paperHi); b.rect(13, 51, 30, 1, P.paperDk);
  b.rect(13, 15, 1, 37, P.edge); b.rect(42, 15, 1, 37, P.edge);
  b.shape(36, 15, [[0, 7], [1, 6], [2, 5], [3, 4], [4, 3], [5, 2]], P.paperSh);
  b.rect(16, 18, 18, 5, P.redDk); for (let k = 0; k < 6; k++) b.rect(17 + k * 3, 19, 2, 3, P.paperHi);
  b.rect(16, 25, 14, 1, P.line); b.rect(16, 28, 10, 1, P.line);
  b.rect(30, 25, 5, 5, P.redDk); b.rect(31, 26, 3, 3, P.paperHi); b.set(31, 28, P.red); b.set(32, 27, P.red); b.set(33, 26, P.red);
  angryEyes(b, 16, 28, 34, 6, 5);
  fangs(b, 20, 43, 14, 4);
  // the giant pencil, levelled like a lance: eraser, ferrule, yellow body, wood tip, graphite point
  const px = (x, y, w, h, c) => b.rect(x, y, w, h, c);
  px(30, 36, 5, 4, '#ff7aa8'); px(34, 36, 2, 4, '#b8c0dd');
  px(36, 36, 17, 4, '#ffcf3a'); px(36, 36, 17, 1, GOLD_HI); px(36, 39, 17, 1, GOLD_DK);
  b.shape(53, 36, [[0, 4], [0, 4], [0, 4], [0, 4]], '#e8c28a'); b.shape(55, 36, [[0, 3], [1, 2], [1, 2], [0, 3]], '#e8c28a');
  b.rect(57, 37, 2, 2, '#2b2b3a');
  // glove gripping it
  b.rect(40, 34, 5, 7, P.glove); b.rect(40, 34, 5, 1, P.paperHi);
  b.rect(10, 38, 3, 3, P.arm);
  b.mark();
  sparks(b, [[7, 16], [52, 20], [58, 30]]);
  b.rect(51, 44, 5, 4, P.paper); b.rect(51, 47, 5, 1, P.paperDk); b.rect(52, 45, 3, 1, P.line);
  return b;
}

// ---------- Final Exam (enemy id "final", boss): crowned giant exam paper on a stack of past papers ----------
function drawFinal() {
  const b = new RigBuf();
  boots(b, 15, 41, 51);
  // pile of past papers under it
  for (const [y, x, w, c] of [[47, 8, 48, P.paperSh], [43, 9, 46, P.paper]]) { b.rect(x, y, w, 5, c); b.rect(x, y, w, 1, P.paperHi); b.rect(x, y + 4, w, 1, P.paperDk); b.rect(x, y, 1, 5, P.edge); b.rect(x + w - 1, y, 1, 5, P.edge); }
  // main exam sheet
  b.rect(14, 26, 36, 22, P.paper); b.rect(14, 26, 36, 1, P.paperHi); b.rect(14, 26, 1, 22, P.edge); b.rect(49, 26, 1, 22, P.edge);
  b.shape(42, 26, [[0, 8], [1, 7], [2, 6], [3, 5], [4, 4], [5, 3], [6, 2]], P.paperSh);
  // FINAL header, red, white block lettering
  b.rect(17, 28, 22, 6, P.redDk); b.rect(18, 29, 20, 4, '#c4263f'); for (let k = 0; k < 5; k++) b.rect(19 + k * 4, 29, 3, 4, P.paperHi);
  b.rect(19, 30, 1, 1, P.red);
  angryEyes(b, 18, 31, 37, 8, 5);
  fangs(b, 23, 43, 18, 4);
  // gold crown of paper spikes with jewels
  const spike = (x, h) => { for (let j = 0; j < h; j++) b.rect(x + (j >> 1) * 0, 25 - j, Math.max(1, 5 - Math.floor(j * 5 / h)), 1, GOLD); };
  for (const [x, h] of [[15, 6], [23, 9], [30, 10], [38, 9], [45, 6]]) spike(x, h);
  b.rect(14, 23, 36, 4, GOLD); b.rect(14, 23, 36, 1, GOLD_HI); b.rect(14, 26, 36, 1, GOLD_DK);
  b.rect(31, 24, 3, 2, P.red); b.rect(20, 24, 2, 2, '#58b8ff'); b.rect(42, 24, 2, 2, '#52d49a');
  // arms with big clenched paper fists
  b.rect(9, 33, 5, 4, P.arm); b.rect(5, 30, 6, 6, P.glove); b.rect(5, 30, 6, 1, P.paperHi);
  b.rect(50, 33, 5, 4, P.arm); b.rect(53, 30, 6, 6, P.glove); b.rect(53, 30, 6, 1, P.paperHi);
  b.mark();
  sparks(b, [[3, 20], [58, 22], [6, 44], [57, 46], [29, 15]]);
  return b;
}

// =====================================================================================================
// Teaching staff (static concepts, NOT in gameplay yet). Original chibi characters, invented faces:
// no real Mahidol staff, no real names. Big head (~55% of height), dark inner + white outer outline.
// =====================================================================================================
const SKIN = '#ffd9bd', SKIN_SH = '#e9b894', LENS = '#e9f6ff';
function ell(b, cx, cy, rx, ry, c) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) b.set(cx + x, cy + y, c);
}
function legs(b, y, c, shoe, offA = 0, offB = 0) {
  b.rect(26 + offA, y, 4, 54 - y, c); b.rect(34 + offB, y, 4, 54 - y, c);
  b.rect(25 + offA, 52, 6, 3, shoe); b.rect(33 + offB, 52, 6, 3, shoe); b.rect(25 + offA, 52, 6, 1, P.bootHi); b.rect(33 + offB, 52, 6, 1, P.bootHi);
}
// face: skin head, ears, shaded jaw. hx = horizontal shift (chibi faces turn a little toward the player's side, i.e. right)
function head(b, hx = 0, hy = 0) {
  ell(b, 32 + hx, 25 + hy, 11, 10, SKIN); b.rect(24 + hx, 31 + hy, 17, 1, SKIN_SH);
  b.rect(20 + hx, 26 + hy, 2, 4, SKIN); b.rect(42 + hx, 26 + hy, 2, 4, SKIN); b.set(21 + hx, 28 + hy, SKIN_SH);
}
function brows(b, hx, hy, y = 22) { // heavy slanted brows, inner ends low
  for (let k = 0; k < 6; k++) { b.rect(25 + hx + k, hy + y + Math.floor(k * 0.5), 2, 2, OUT_DARK); b.rect(41 + hx - k, hy + y + Math.floor(k * 0.5), 2, 2, OUT_DARK); }
}
function squareGlasses(b, hx, hy, frame, y = 25) {
  for (const x of [25, 35]) {
    b.rect(x + hx, y + hy, 7, 6, frame); b.rect(x + hx + 1, y + hy + 1, 5, 4, LENS); b.rect(x + hx + 1, y + hy + 1, 2, 1, P.paperHi);
    b.rect(x + hx + 3, y + hy + 2, 2, 3, OUT_DARK); b.set(x + hx + 3, y + hy + 2, '#5a4a8a'); // pupil, looking forward
  }
  b.rect(32 + hx, y + 1 + hy, 3, 1, frame);
}
function gritMouth(b, hx, hy, w = 6) { b.rect(30 + hx, 32 + hy, w, 2, P.mouth); b.rect(31 + hx, 32 + hy, w - 2, 1, P.tooth); }
function flames(b, pts, cols) { // purple energy tongues rising from base points [x, baseY, height]
  for (const [x, y, h] of pts) for (let j = 0; j < h; j++) { const w = Math.max(1, 4 - Math.floor(j * 4 / h)); b.rect(x - (w >> 1) + (j % 3 === 1 ? 1 : 0), y - j, w, 1, cols[Math.min(cols.length - 1, Math.floor(j * cols.length / h))]); }
}

// ---------- Strict Professor: stern, glasses, red pen and a marked score sheet ----------
function drawProfessor() {
  const b = new RigBuf(), hx = 1;
  legs(b, 47, '#232b4d', '#2a2440');
  // suit jacket, white shirt, red tie
  b.rect(22, 34, 20, 14, '#26335e'); b.rect(22, 34, 3, 14, '#3a4d8c'); b.rect(39, 34, 3, 14, '#1c2748');
  b.shape(28, 34, [[0, 8], [1, 6], [2, 4], [2, 4]], P.paperHi); b.rect(31, 35, 3, 9, '#e0334a'); b.rect(30, 34, 5, 2, '#e0334a'); b.rect(32, 36, 1, 7, '#a82238');
  b.rect(28, 44, 1, 4, '#3a4d8c'); b.rect(36, 44, 1, 4, '#1c2748');
  // hair: swept grey with a side part, bushy sideburns
  ell(b, 32 + hx, 18, 12, 8, '#b7bacb'); b.rect(21 + hx, 20, 3, 8, '#b7bacb'); b.rect(41 + hx, 20, 3, 8, '#b7bacb');
  head(b, hx, 0);
  ell(b, 32 + hx, 17, 12, 7, '#b7bacb'); b.rect(21 + hx, 19, 3, 9, '#b7bacb'); b.rect(41 + hx, 19, 3, 9, '#b7bacb');
  b.rect(24 + hx, 18, 17, 2, '#b7bacb'); for (let k = 0; k < 10; k++) b.rect(22 + hx + k * 2, 11 + (k > 5 ? 10 - k : k) * 0, 2, 1, '#e8eaf4');
  b.rect(26 + hx, 12, 10, 1, '#e8eaf4'); b.rect(24 + hx, 13, 13, 1, '#e8eaf4'); b.rect(33 + hx, 16, 3, 3, '#8d90a6'); b.rect(21 + hx, 22, 2, 5, '#8d90a6');
  brows(b, hx, 0, 21);
  squareGlasses(b, hx, 0, '#2a2740', 24);
  b.rect(31 + hx, 29, 3, 2, SKIN_SH); // nose
  b.rect(29 + hx, 33, 8, 1, P.mouth); b.set(28 + hx, 34, P.mouth); b.set(37 + hx, 34, P.mouth); // stern downturned mouth
  // left arm: score sheet with a big red mark
  b.rect(18, 36, 5, 9, '#26335e'); b.rect(17, 44, 4, 3, SKIN);
  b.rect(9, 38, 11, 14, P.paper); b.rect(9, 38, 11, 1, P.paperHi); b.rect(9, 51, 11, 1, P.paperDk); b.rect(9, 38, 1, 14, P.edge); b.rect(19, 38, 1, 14, P.edge);
  b.rect(11, 40, 7, 1, P.line); b.rect(11, 43, 7, 1, P.line);
  b.rect(11, 46, 1, 4, P.red); b.rect(11, 46, 4, 1, P.red); b.rect(11, 48, 3, 1, P.red); // red F
  // right arm: raised red pen
  b.rect(42, 36, 5, 5, '#26335e'); b.rect(46, 35, 4, 4, SKIN);
  b.line(49, 36, 58, 23, P.redDk, 3); b.line(49, 35, 58, 22, '#ff3b4d', 1); b.rect(57, 20, 2, 3, OUT_DARK); b.rect(49, 37, 2, 2, '#c9ccdc');
  b.mark();
  sparks(b, [[6, 22], [4, 34], [57, 40]]);
  return b;
}

// ---------- Ruthless TA: bun, round glasses, lanyard, a mountain of reports hugged to the chest ----------
function drawTA() {
  const b = new RigBuf(), hx = 2;
  legs(b, 47, '#2f3b6a', '#3a3454', -2, 3); // mid-stride: back leg left, front leg forward
  // cardigan + tee
  b.rect(22, 34, 20, 14, '#3c6fd6'); b.rect(22, 34, 3, 14, '#5b8ff0'); b.rect(39, 34, 3, 14, '#2a52a8'); b.rect(29, 34, 6, 10, P.paperHi);
  // lanyard + ID card
  b.rect(29, 33, 1, 8, '#ff6fa6'); b.rect(34, 33, 1, 8, '#ff6fa6'); b.rect(30, 40, 4, 5, P.paperHi); b.rect(31, 41, 2, 2, '#58b8ff');
  // hair: dark mass + big bun on top
  ell(b, 32 + hx, 18, 12, 9, '#2b2038'); b.rect(21 + hx, 20, 3, 9, '#2b2038'); b.rect(41 + hx, 20, 3, 8, '#2b2038');
  head(b, hx, 0);
  ell(b, 32 + hx, 17, 12, 7, '#2b2038'); b.rect(21 + hx, 19, 3, 9, '#2b2038'); b.rect(41 + hx, 19, 3, 8, '#2b2038'); b.rect(25 + hx, 18, 16, 2, '#2b2038');
  b.rect(27 + hx, 13, 9, 1, '#5a4670'); b.rect(25 + hx, 14, 7, 1, '#5a4670');
  // the bun: a round ball on top of the head with a pink hair tie and shine
  ell(b, 32 + hx, 8, 6, 5, '#2b2038'); b.rect(29 + hx, 4, 5, 1, '#6a5488'); b.rect(28 + hx, 5, 2, 1, '#6a5488'); b.rect(34 + hx, 6, 2, 2, '#6a5488'); b.rect(30 + hx, 7, 2, 1, '#6a5488');
  b.rect(27 + hx, 12, 11, 2, '#ff6fa6'); b.rect(27 + hx, 12, 11, 1, '#ffb0cc'); b.rect(29 + hx, 13, 1, 1, '#c93f7c');
  brows(b, hx, 0, 21);
  // round glasses with tired narrowed eyes
  for (const x of [28, 38]) { b.ring(x + hx, 27, 3, '#2b2038'); b.rect(x + hx - 1, 26, 3, 2, LENS); b.rect(x + hx, 26, 2, 2, OUT_DARK); b.set(x + hx - 2, 25, P.paperHi); }
  b.rect(31 + hx, 27, 4, 1, '#2b2038');
  b.rect(29 + hx, 32, 8, 3, P.mouth); for (let k = 0; k < 4; k++) { b.rect(30 + hx + k * 2, 32, 1, 1, P.tooth); b.rect(31 + hx + k * 2, 34, 1, 1, P.tooth); } // gritted teeth
  // the report stack: thick, taller than her chin, sticky tabs, red "REVISE" scribble
  const sheets = [[48, 28, '#d8d1be'], [44, 29, P.paper], [40, 28, '#d8d1be'], [36, 29, P.paper]];
  for (const [y, w, c] of sheets) { b.rect(22, y, w, 5, c); b.rect(22, y, w, 1, P.paperHi); b.rect(22, y + 4, w, 1, P.paperDk); b.rect(22, y, 1, 5, P.edge); b.rect(22 + w - 1, y, 1, 5, P.edge); }
  b.rect(24, 38, 12, 1, P.line); b.rect(24, 40, 8, 1, P.line); b.rect(38, 37, 7, 4, P.redDk); b.rect(39, 38, 5, 2, P.red);
  b.rect(47, 41, 4, 3, '#ffd23a'); b.rect(47, 46, 4, 3, '#52d49a'); b.rect(18, 44, 4, 3, '#ff6fa6');
  // arms wrapped around the stack
  b.rect(18, 39, 6, 5, '#3c6fd6'); b.rect(19, 43, 5, 4, SKIN); b.rect(46, 39, 6, 5, '#2a52a8'); b.rect(47, 43, 5, 4, SKIN);
  b.mark();
  b.rect(1, 44, 6, 1, P.paperHi); b.rect(3, 48, 7, 1, P.paperHi); b.rect(0, 40, 4, 1, P.paperHi); // she is running late for everyone
  sparks(b, [[55, 20], [5, 24]]);
  b.rect(52, 24, 5, 4, P.paper); b.rect(52, 27, 5, 1, P.paperDk); b.rect(53, 25, 3, 1, P.line);
  return b;
}

// ---------- Thesis Advisor: formal gown with gold trim, long checklist scroll, purple aura ----------
function drawAdvisor(opts = {}) {
  const b = new RigBuf(), hx = 1;
  const aura = new PixBuf();
  const ap = opts.aura || [0, 0, 0, 0, 0, 0];
  flames(aura, [[8, 52, 22 + ap[0]], [14, 53, 30 + ap[1]], [51, 53, 30 + ap[2]], [57, 52, 22 + ap[3]], [20, 54, 14 + ap[4]], [45, 54, 14 + ap[5]]], ['#6a2fd0', '#8d4cf0', '#b88bff', '#e4d2ff']);
  aura.rect(12, 54, 40, 1, '#8d4cf0');
  // gown: wide bell sleeves, flared hem, gold front trim
  b.shape(19, 34, [[2, 22], [1, 24], [1, 24], [0, 26], [0, 26], [0, 26], [0, 26], [0, 26], [0, 26], [0, 26], [-1, 28], [-1, 28], [-2, 30], [-2, 30], [-2, 30], [-2, 30], [-3, 32], [-3, 32]], '#2e2152');
  b.rect(20, 34, 3, 18, '#46357a'); b.rect(38, 34, 3, 18, '#221842');
  b.rect(31, 35, 2, 18, '#f0b93a'); b.rect(29, 34, 6, 1, '#f0b93a'); b.rect(30, 35, 1, 18, '#c98a12');
  b.shape(28, 34, [[0, 8], [1, 6], [2, 4]], P.paperHi); b.rect(31, 36, 2, 5, '#8d4cf0');
  b.rect(24, 51, 3, 3, '#1b1a33'); b.rect(37, 51, 3, 3, '#1b1a33'); // shoes peeking out
  // swept white-grey hair with a high forehead, goatee
  ell(b, 32 + hx, 18, 12, 8, '#d8d9e6'); b.rect(21 + hx, 20, 3, 9, '#d8d9e6'); b.rect(41 + hx, 20, 3, 9, '#d8d9e6');
  head(b, hx, 0);
  ell(b, 32 + hx, 16, 12, 6, '#d8d9e6'); b.rect(21 + hx, 18, 3, 10, '#d8d9e6'); b.rect(41 + hx, 18, 3, 10, '#d8d9e6'); b.rect(24 + hx, 17, 17, 2, '#d8d9e6');
  b.rect(25 + hx, 11, 9, 1, P.paperHi); b.rect(24 + hx, 12, 7, 1, P.paperHi); b.rect(36 + hx, 15, 3, 3, '#a2a4bb');
  brows(b, hx, 0, 21); for (let k = 0; k < 6; k++) { b.rect(25 + hx + k, 21 + Math.floor(k * 0.5), 2, 1, '#d8d9e6'); b.rect(41 + hx - k, 21 + Math.floor(k * 0.5), 2, 1, '#d8d9e6'); }
  // white-rimmed glasses with a purple glint, tiny menacing smile, goatee
  for (const x of [25, 35]) { b.rect(x + hx, 24, 7, 6, P.paperHi); b.rect(x + hx + 1, 25, 5, 4, '#cdb8ff'); b.rect(x + hx + 1, 25, 2, 1, P.paperHi); b.rect(x + hx + 3, 26, 2, 3, OUT_DARK); }
  b.rect(32 + hx, 25, 3, 1, P.paperHi);
  b.rect(31 + hx, 29, 3, 2, SKIN_SH);
  b.rect(29 + hx, 33, 8, 1, P.mouth); b.set(28 + hx, 32, P.mouth); b.set(37 + hx, 32, P.mouth);
  b.rect(30 + hx, 34, 6, 3, '#d8d9e6'); b.rect(31 + hx, 37, 4, 1, '#a2a4bb');
  // left hand: glowing purple orb (the aura source)
  b.rect(14, 38, 6, 5, '#2e2152'); b.rect(13, 42, 4, 3, SKIN); b.disc(11, 37, 3, '#8d4cf0'); b.disc(11, 37, 2, '#cdb8ff'); b.set(10, 36, P.paperHi);
  // right hand: long checklist scroll hanging to the floor, red ticks and open boxes
  b.rect(43, 38, 6, 5, '#2e2152'); b.rect(46, 41, 4, 3, SKIN);
  b.rect(46, 31, 11, 2, '#f0b93a'); b.rect(45, 30, 2, 4, GOLD_DK); b.rect(56, 30, 2, 4, GOLD_DK);
  b.rect(47, 33, 9, 21, P.paper); b.rect(47, 33, 1, 21, P.edge); b.rect(55, 33, 1, 21, P.edge); b.rect(47, 53, 9, 1, P.paperDk);
  for (let k = 0; k < 4; k++) { const y = 35 + k * 5; b.rect(49, y, 3, 3, k < 3 ? '#b3122c' : P.edge); b.rect(50, y + 1, 1, 1, k < 3 ? P.red : P.paperHi); b.rect(53, y + 1, 2, 1, P.line); }
  b.mark();
  b.under(aura);
  return b;
}

// ---------- Exam Master (boss): dark proctor with glowing lenses, mortarboard, spread arms, floating exam sheets ----------
function drawExamMaster(opts = {}) {
  const b = new RigBuf();
  const aura = new PixBuf();
  const ap = opts.aura || [0, 0, 0, 0, 0, 0, 0];
  flames(aura, [[6, 54, 30 + ap[0]], [13, 55, 40 + ap[1]], [20, 55, 24 + ap[2]], [44, 55, 24 + ap[3]], [51, 55, 40 + ap[4]], [58, 54, 30 + ap[5]], [32, 56, 20 + ap[6]]], ['#5a24b8', '#7a3fe0', '#a35bff', '#d2b0ff']);
  aura.rect(8, 55, 48, 1, '#7a3fe0');
  // long dark coat, high collar, gold buttons
  b.shape(20, 34, [[2, 20], [1, 22], [1, 22], [0, 24], [0, 24], [0, 24], [0, 24], [0, 24], [0, 24], [0, 24], [0, 24], [-1, 26], [-1, 26], [-2, 28], [-2, 28], [-2, 28], [-2, 28], [-3, 30]], '#241a48');
  b.rect(21, 34, 3, 18, '#3c2d70'); b.rect(39, 34, 3, 18, '#181030'); b.rect(31, 36, 2, 17, '#181030');
  for (const y of [38, 42, 46]) { b.rect(34, y, 2, 2, '#f0b93a'); b.set(34, y, GOLD_HI); }
  b.rect(26, 33, 12, 4, '#3c2d70'); b.rect(28, 33, 8, 2, '#181030');
  b.rect(25, 51, 4, 4, '#120d26'); b.rect(35, 51, 4, 4, '#120d26');
  // spread arms with glowing purple palms
  b.shape(8, 33, [[8, 14], [4, 18], [0, 22], [0, 22], [2, 14]], '#241a48'); b.rect(10, 36, 12, 2, '#3c2d70');
  b.shape(42, 33, [[0, 12], [0, 16], [0, 18], [0, 18], [6, 12]], '#241a48'); b.rect(44, 36, 12, 2, '#3c2d70');
  b.disc(6, 39, 3, '#a35bff'); b.disc(6, 39, 2, '#e4d2ff'); b.disc(58, 39, 3, '#a35bff'); b.disc(58, 39, 2, '#e4d2ff');
  // head in shadow: dark hair, pale-violet face, glowing lenses instead of eyes
  const FACE = '#b9a9e4', FACE_SH = '#8f7cc2', FACE_DK = '#5f4c96';
  ell(b, 32, 26, 11, 10, FACE); b.rect(24, 33, 17, 1, FACE_SH); b.rect(25, 34, 15, 1, FACE_SH); b.rect(27, 35, 11, 1, FACE_DK); // jaw shade
  ell(b, 32, 18, 12, 6, '#1c1530'); b.rect(20, 19, 3, 10, '#1c1530'); b.rect(41, 19, 3, 10, '#1c1530'); b.rect(24, 21, 17, 2, '#1c1530');
  b.rect(26, 14, 6, 1, '#4a3a78'); b.rect(24, 15, 5, 1, '#4a3a78'); b.rect(36, 16, 4, 1, '#4a3a78');
  // glowing lenses (smaller than before so the cheeks show), slanted angry lids
  for (const x of [25, 35]) { b.rect(x, 24, 8, 6, '#7a3fe0'); b.rect(x + 1, 25, 6, 4, '#f4ecff'); b.rect(x + 1, 25, 3, 1, P.paperHi); b.rect(x + 3, 26, 3, 2, '#b99aff'); }
  b.rect(33, 25, 2, 1, '#7a3fe0');
  for (const [x, y] of [[29, 25], [30, 25], [31, 25], [30, 26], [31, 26], [31, 27]]) { b.set(x, y, '#2a1858'); b.set(67 - x, y, '#2a1858'); }
  b.rect(26, 22, 6, 1, OUT_DARK); b.rect(35, 22, 6, 1, OUT_DARK); // heavy brows resting on the lens rims
  // face: nose shadow, nasolabial lines, grim mouth with bared teeth
  b.rect(32, 30, 3, 2, FACE_SH); b.rect(25, 31, 1, 3, FACE_SH); b.rect(40, 31, 1, 3, FACE_SH);
  b.rect(28, 32, 9, 3, '#2a1034'); for (let k = 0; k < 4; k++) { b.rect(29 + k * 2, 32, 1, 1, P.tooth); b.rect(30 + k * 2, 34, 1, 1, P.tooth); }
  b.set(27, 33, '#2a1034'); b.set(37, 33, '#2a1034');
  // mortarboard with gold tassel
  b.shape(20, 13, [[3, 21], [1, 25], [0, 27]], '#120d26'); b.rect(26, 13, 12, 1, '#4a3a78'); b.rect(31, 12, 2, 1, '#f0b93a'); b.rect(44, 14, 1, 6, '#f0b93a'); b.rect(43, 20, 3, 3, GOLD);
  b.mark();
  b.under(aura);
  // floating exam sheets with red marks, drawn after the outline so they read as separate objects
  const sheet = (x, y, tilt) => {
    for (let j = 0; j < 12; j++) b.rect(x + (tilt > 0 ? Math.floor(j / 5) : 2 - Math.floor(j / 5)), y + j, 9, 1, P.paper);
    for (let j = 0; j < 12; j++) { const ox = x + (tilt > 0 ? Math.floor(j / 5) : 2 - Math.floor(j / 5)); b.set(ox, y + j, P.edge); b.set(ox + 8, y + j, P.edge); }
    b.rect(x + 1, y, 9, 1, P.edge); b.rect(x, y + 11, 9, 1, P.paperDk);
    b.rect(x + 2, y + 2, 5, 2, P.redDk); b.rect(x + 2, y + 5, 5, 1, P.line); b.rect(x + 2, y + 7, 4, 1, P.line); b.set(x + 6, y + 9, P.red); b.set(x + 5, y + 8, P.red); b.set(x + 4, y + 9, P.red);
  };
  const sh = opts.sheets || [[0, 0], [0, 0], [0, 0], [0, 0]];
  if (!opts.hideSheets) { sheet(2 + sh[0][0], 14 + sh[0][1], 1); sheet(49 + sh[1][0], 12 + sh[1][1], -1); sheet(1 + sh[2][0], 42 + sh[2][1], -1); sheet(50 + sh[3][0], 43 + sh[3][1], 1); }
  return b;
}


module.exports = { drawAssignment, drawDeadline, drawGroup, drawMidterm, drawFinal, drawProfessor, drawTA, drawAdvisor, drawExamMaster, PALETTE: P };
