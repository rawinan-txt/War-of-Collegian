// Prepares a game sprite from an AI reference PNG (hard alpha, largest component, nearest-style downscale, median-cut palette). Usage: F=96 node tools/prep-reference-sprite.js <point|mode> <figureHeight> <colors> <out.png> <preview.png>
const fs = require('fs'); const F = +process.env.F || 96;
const R = require('path').join(__dirname, '..');
const { decodePng, encodePng } = require(R + '/tools/pixel/png');
const [, , MODE, HT, NCOL, OUT, PREV] = process.argv;
const src = decodePng(fs.readFileSync(R + '/docs/reference/bug_hunter_original.png'));
const W = src.w, H = src.h;
// 1. hard alpha
const op = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) op[i] = src.rgba[i * 4 + 3] >= 128 ? 1 : 0;
// 2. keep largest 8-connected component
const lab = new Int32Array(W * H).fill(-1); const sizes = [];
for (let s = 0; s < W * H; s++) {
  if (!op[s] || lab[s] >= 0) continue;
  const id = sizes.length; let n = 0; const st = [s]; lab[s] = id;
  while (st.length) { const p = st.pop(); n++; const x = p % W, y = (p / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const q = ny * W + nx; if (op[q] && lab[q] < 0) { lab[q] = id; st.push(q); } } }
  sizes.push(n);
}
const big = sizes.indexOf(Math.max(...sizes));
console.log('components', sizes.length, 'largest', sizes[big], 'dropped', sizes.reduce((a, b) => a + b, 0) - sizes[big], 'px');
let x0 = W, x1 = -1, y0 = H, y1 = -1;
for (let p = 0; p < W * H; p++) if (lab[p] === big) { const x = p % W, y = (p / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const bw = x1 - x0 + 1, bh = y1 - y0 + 1; console.log('bbox', x0, y0, x1, y1, bw, bh);
// 3. nearest-neighbour style downscale to height HT
const th = +HT, sc = th / bh, tw = Math.round(bw * sc);
const px = Array.from({ length: F }, () => Array(F).fill(null));
const ox = Math.round(F / 2 - tw / 2), oy = F - 7 - th + 1;
const get = (x, y) => { const p = y * W + x; return lab[p] === big ? [src.rgba[p * 4], src.rgba[p * 4 + 1], src.rgba[p * 4 + 2]] : null; };
for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
  const sx0 = x0 + tx / sc, sx1 = x0 + (tx + 1) / sc, sy0 = y0 + ty / sc, sy1 = y0 + (ty + 1) / sc;
  let out = null;
  if (MODE === 'point') out = get(Math.min(x1, Math.floor((sx0 + sx1) / 2)), Math.min(y1, Math.floor((sy0 + sy1) / 2)));
  else { // most frequent quantised colour in the cell (no blending, no new colours)
    const cnt = new Map(); let opaque = 0, total = 0;
    for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) { total++; const c = get(Math.min(x, x1), Math.min(y, y1)); if (!c) continue; opaque++; const k = c.map((v) => v >> 4).join(); const e = cnt.get(k) || { n: 0, c }; e.n++; cnt.set(k, e); }
    if (opaque * 2 >= total) out = [...cnt.values()].sort((a, b) => b.n - a.n)[0].c;
  }
  if (out) px[oy + ty][ox + tx] = out;
}
// 4. median-cut quantise to NCOL colours
const all = []; for (const r of px) for (const c of r) if (c) all.push(c);
const boxes = [all.slice()];
while (boxes.length < +NCOL) {
  let bi = -1, best = -1, bch = 0;
  boxes.forEach((b, i) => { if (b.length < 2) return; for (let ch = 0; ch < 3; ch++) { const v = b.map((c) => c[ch]); const range = Math.max(...v) - Math.min(...v); const score = range * Math.sqrt(b.length); if (score > best) { best = score; bi = i; bch = ch; } } });
  if (bi < 0) break;
  const b = boxes[bi].sort((p, q) => p[bch] - q[bch]); const m = b.length >> 1; boxes.splice(bi, 1, b.slice(0, m), b.slice(m));
}
const pal = boxes.map((b) => [0, 1, 2].map((ch) => Math.round(b.reduce((s, c) => s + c[ch], 0) / b.length)));
const near = (c) => { let bi = 0, bd = 1e9; pal.forEach((p, i) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = i; } }); return pal[bi]; };
for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (px[y][x]) px[y][x] = near(px[y][x]);
// write
const rgba = Buffer.alloc(F * F * 4);
for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) { const c = px[y][x]; if (c) { const i = (y * F + x) * 4; rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255; } }
fs.writeFileSync(OUT, encodePng(F, F, rgba));
const S = 8, pv = Buffer.alloc(F * S * F * S * 4);
for (let y = 0; y < F * S; y++) for (let x = 0; x < F * S; x++) { const c = px[(y / S) | 0][(x / S) | 0]; const i = (y * F * S + x) * 4; const bg = (((x / S | 0) + (y / S | 0)) & 1) ? 0x5e : 0x56; const q = c || [bg, bg + 10, bg + 40]; pv[i] = q[0]; pv[i + 1] = q[1]; pv[i + 2] = q[2]; pv[i + 3] = 255; }
fs.writeFileSync(PREV, encodePng(F * S, F * S, pv));
let top = F, bot = -1, l = F, r = -1; for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (px[y][x]) { top = Math.min(top, y); bot = Math.max(bot, y); l = Math.min(l, x); r = Math.max(r, x); }
console.log({ colors: pal.length, bbox96: [l, top, r, bot], height: bot - top + 1 });
