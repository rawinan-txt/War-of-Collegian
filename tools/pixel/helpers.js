// shared helpers for character defs
const { CX } = require('./rig');

const h = (x, y) => [CX + x, y];
const STUDENT = { skin: '#ffd7b5', skinShade: '#eab08a', shirt: '#f4f7ff', shirtShade: '#c5cfe6', eye: '#1a2342' };

// ---- shared pixel helpers (tiny bitmaps drawn after the outline) ----
const bmp = (buf, rows, x, y, c) => rows.forEach((r, j) => [...r].forEach((v, i) => { if (v === '1') buf.set(x + i, y + j, c); }));
const HEART = ['01010', '11111', '01110', '00100'];
const NOTE = ['0011', '0010', '0010', '1110', '1110'];
const CROSS = ['00100', '00100', '11111', '00100', '00100'];
const TOOTH = ['0111110', '1111111', '1111111', '0111110', '0110110', '0110110'];
function cog(buf, cx, cy, r, c, rot) {
  buf.ring(cx, cy, r, c);
  for (let k = 0; k < 8; k++) { const a = rot + (k * Math.PI) / 4; buf.set(cx + Math.cos(a) * (r + 1.5), cy + Math.sin(a) * (r + 1.5), c); }
  buf.set(cx, cy, c);
}
function dome(buf, cx, cy, r, c) { for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += 0.3) buf.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, c); }
const seq = (base, arr) => arr.map((o) => ({ ...base, ...o }));

module.exports = { h, STUDENT, bmp, HEART, NOTE, CROSS, TOOTH, cog, dome, seq };
