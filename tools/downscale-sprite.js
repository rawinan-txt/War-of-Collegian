// Feature-preserving nearest-style downscale for pixel sprites (no blending, no new colours).
// Each target pixel takes one of the colours already present in its source cell; thin saturated
// blue lines (glasses, eye details) and white sparkles get extra weight so they survive.
// Usage: node tools/downscale-sprite.js <in.png> <frame> <figureHeight> <maxColours> <out.png> [preview.png]
const fs = require('node:fs');
const { decodePng, encodePng } = require('./pixel/png');

const [, , IN, FRAME, FH, MAXC, OUT, PREV] = process.argv;
const F = +FRAME, TH = +FH;
const src = decodePng(fs.readFileSync(IN));
const W = src.w, H = src.h;
const px = (x, y) => { const k = (y * W + x) * 4; return src.rgba[k + 3] ? [src.rgba[k], src.rgba[k + 1], src.rgba[k + 2]] : null; };

let x0 = W, x1 = -1, y0 = H, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = TH / bh, tw = Math.round(bw * sc);
const isBlue = (c) => c[2] > 140 && c[0] < 90 && c[2] - c[0] > 90;
const isWhite = (c) => c[0] > 235 && c[1] > 235 && c[2] > 235;
const weight = (c) => (isBlue(c) ? 3 : isWhite(c) ? 1.2 : 1);

const out = Array.from({ length: F }, () => Array(F).fill(null));
const ox = Math.round(F / 2 - tw / 2), oy = F - 7 - TH + 1;
for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < tw; tx++) {
  const sx0 = x0 + tx / sc, sx1 = x0 + (tx + 1) / sc, sy0 = y0 + ty / sc, sy1 = y0 + (ty + 1) / sc;
  const cnt = new Map(); let n = 0, tot = 0;
  for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
    const w = Math.max(0, Math.min(x + 1, sx1) - Math.max(x, sx0)) * Math.max(0, Math.min(y + 1, sy1) - Math.max(y, sy0));
    tot += w;
    const c = px(Math.min(x, x1), Math.min(y, y1)); if (!c) continue;
    n += w; const k = c.join(); const e = cnt.get(k) || { s: 0, c }; e.s += w * weight(c); cnt.set(k, e);
  }
  if (n * 2 < tot) continue; // cell mostly empty -> transparent (keeps hard alpha)
  out[oy + ty][ox + tx] = [...cnt.values()].sort((a, b) => b.s - a.s)[0].c;
}

// reduce palette: merge the rarest colours into their nearest neighbour, never merging blue / white
const freq = new Map();
for (const r of out) for (const c of r) if (c) { const k = c.join(); freq.set(k, (freq.get(k) || 0) + 1); }
const colours = () => [...freq.keys()].map((k) => k.split(',').map(Number));
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const remap = new Map();
while (freq.size > +MAXC) {
  const cand = [...freq.entries()].filter(([k]) => { const c = k.split(',').map(Number); return !isBlue(c) && !isWhite(c); }).sort((a, b) => a[1] - b[1]);
  const [k, n] = cand[0]; const c = k.split(',').map(Number);
  let best = null, bd = 1e9; for (const o of colours()) { const ks = o.join(); if (ks === k) continue; const d = d2(c, o); if (d < bd) { bd = d; best = ks; } }
  freq.delete(k); freq.set(best, freq.get(best) + n);
  for (const [a, b] of remap) if (b === k) remap.set(a, best);
  remap.set(k, best);
}
for (const r of out) for (let i = 0; i < F; i++) if (r[i]) { const k = r[i].join(); if (remap.has(k)) r[i] = remap.get(k).split(',').map(Number); }

const rgba = Buffer.alloc(F * F * 4);
for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) { const c = out[y][x]; if (c) { const i = (y * F + x) * 4; rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255; } }
fs.writeFileSync(OUT, encodePng(F, F, rgba));
if (PREV) {
  const S = 8, pv = Buffer.alloc(F * S * F * S * 4);
  for (let y = 0; y < F * S; y++) for (let x = 0; x < F * S; x++) {
    const c = out[(y / S) | 0][(x / S) | 0]; const i = (y * F * S + x) * 4; const bg = ((((x / S) | 0) + ((y / S) | 0)) & 1) ? 0x5e : 0x56; const q = c || [bg, bg + 10, bg + 40];
    pv[i] = q[0]; pv[i + 1] = q[1]; pv[i + 2] = q[2]; pv[i + 3] = 255;
  }
  fs.writeFileSync(PREV, encodePng(F * S, F * S, pv));
}
console.log({ colours: freq.size, figureHeight: TH, width: tw, feetRow: oy + TH - 1 });
