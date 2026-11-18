// Hand-authored ASCII pixel map -> 64x64 PNG (+ nearest-neighbour preview). Usage: node convert.js <map.txt> <out.png> [scale]
const fs = require('node:fs');
const { encodePng } = require('../png');
const PAL = {
  H: '#232a4a', h: '#5560b0', g: '#323a6e', S: '#ffd9b8', s: '#f0b48e', P: '#ff9aa8', K: '#1b1a33', G: '#6fd0ff',
  E: '#1e3fbf', e: '#6fa0ff', D: '#0d0d24', w: '#ffffff', B: '#2e86de', b: '#1f5fae', Y: '#ffd45a',
  T: '#3b3f5c', t: '#2a2d45', R: '#f4f4f4', r: '#b8bcd0', C: '#aab4c8', c: '#dfe6f4', d: '#4a5068',
};
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const [, , inp, outp, scaleArg] = process.argv;
const rows = fs.readFileSync(inp, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
const W = Math.max(...rows.map((r) => r.length));
const N = 64, ox = Math.floor((N - W) / 2), oy = 55 - (rows.length - 1);
const px = Array.from({ length: N }, () => Array(N).fill(null));
rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { if (!PAL[ch]) throw new Error('bad char ' + ch); px[oy + y][ox + x] = hex(PAL[ch]); } }));
const outline = (col) => {
  const add = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!px[y][x]) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = px[y + dy]?.[x + dx]; if (a) { add.push([x, y]); break; } }
  }
  add.forEach(([x, y]) => { px[y][x] = col; });
};
outline(hex(PAL.K)); outline([255, 255, 255]);
const S = +(scaleArg || 1);
const out = Buffer.alloc(N * S * N * S * 4);
for (let y = 0; y < N * S; y++) for (let x = 0; x < N * S; x++) {
  const p = px[Math.floor(y / S)][Math.floor(x / S)]; const i = (y * N * S + x) * 4;
  if (p) { out[i] = p[0]; out[i + 1] = p[1]; out[i + 2] = p[2]; out[i + 3] = 255; }
  else { out[i] = out[i + 1] = out[i + 2] = 0x56; out[i + 3] = 255; }
}
fs.writeFileSync(outp, encodePng(N * S, N * S, out));
console.log('rows', rows.length, 'width', W, 'offset', ox, oy);
