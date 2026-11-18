// Hand pixel-art touch-up of the Bug Hunter sprite SOURCE file (face + laptop glyph), applied to the downscaled PNG.
// Reuses only colours already in the sprite palette. Usage: node bug_hunter_touchup.js <in.png> <out.png> [preview.png]
const fs = require('node:fs');
const path = require('node:path');
const { decodePng, encodePng } = require('../png');

const [, , IN, OUT, PREV] = process.argv;
const img = decodePng(fs.readFileSync(IN));
const W = img.w;
const C = { K: '#05040d', H: '#39335c', S: '#fce1cc', F: '#142daa', I: '#2365f6', J: '#276ffa', P: '#141334', W: '#fefeff', B: '#f79d7b' };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const set = (x, y, code) => { const k = (y * W + x) * 4, c = rgb(C[code]); img.rgba[k] = c[0]; img.rgba[k + 1] = c[1]; img.rgba[k + 2] = c[2]; img.rgba[k + 3] = 255; };
const patch = (x0, y0, rows) => rows.forEach((r, dy) => [...r].forEach((ch, dx) => { if (ch !== '.') set(x0 + dx, y0 + dy, ch); }));

// face: thin round glasses (1px blue frame), big eyes with dark pupil + white sparkle, hair strand between the eyes
// columns 42..59, rows 36..44
patch(42, 36, [
  '.FFFFFF....FFFF...',
  'FKKKKKKFHHHFKKKKF.',
  'FIIPPWIFFFFFIPWIF.',
  'FIPPPIIFSSSFIPPIF.',
  'FIPPPIJFSSSFIPPJF.',
  'FJIIIJJFSSSFJIIJF.',
  'FSSSSSSFSSSFSSSSF.',
  'SFFFFFFSSSSSFFFFSS',
  '..BB........BB....',
]);

// laptop screen: clean the noisy pixels and draw a crisp white </> (11x5)
for (let y = 48; y <= 56; y++) for (let x = 61; x <= 72; x++) {
  const k = (y * W + x) * 4; const r = img.rgba[k], g = img.rgba[k + 1], b = img.rgba[k + 2];
  if (img.rgba[k + 3] && b > 200 && r < 120 || (img.rgba[k + 3] && r > 235 && g > 235 && b > 235 && y > 48 && y < 56 && x > 61 && x < 72)) set(x, y, 'I');
}
patch(62, 50, [
  '..W...W.W..',
  '.W....W..W.',
  'W....W....W',
  '.W..W....W.',
  '..W.W...W..',
]);

fs.writeFileSync(OUT, encodePng(img.w, img.h, Buffer.from(img.rgba)));
if (PREV) {
  const F = img.w, S = 8, pv = Buffer.alloc(F * S * F * S * 4);
  for (let y = 0; y < F * S; y++) for (let x = 0; x < F * S; x++) {
    const k = ((((y / S) | 0) * F) + ((x / S) | 0)) * 4, i = (y * F * S + x) * 4;
    const bg = ((((x / S) | 0) + ((y / S) | 0)) & 1) ? 0x5e : 0x56;
    const a = img.rgba[k + 3];
    pv[i] = a ? img.rgba[k] : bg; pv[i + 1] = a ? img.rgba[k + 1] : bg + 10; pv[i + 2] = a ? img.rgba[k + 2] : bg + 40; pv[i + 3] = 255;
  }
  fs.writeFileSync(PREV, encodePng(F * S, F * S, pv));
}
console.log('touch-up applied');
