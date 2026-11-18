// Minimal animated GIF writer for previewing pixel sprite strips (nearest-neighbour scaling, flat background).
// Usage: node tools/make-gif.js <strip.png> <frameWidth> <scale> <fps> <out.gif> [bgHex]
const fs = require('node:fs');
const { decodePng } = require('./pixel/png');

function lzw(indices, minCode) {
  const clear = 1 << minCode, eoi = clear + 1;
  let codeSize = minCode + 1, next = eoi + 1, dict = new Map();
  const out = []; let cur = 0, bits = 0;
  const emit = (code) => { cur |= code << bits; bits += codeSize; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 4096 + k;
    if (dict.has(key)) prefix = dict.get(key);
    else {
      emit(prefix);
      if (next < 4096) { dict.set(key, next++); if (next > (1 << codeSize) && codeSize < 12) codeSize++; }
      else { emit(clear); dict = new Map(); codeSize = minCode + 1; next = eoi + 1; }
      prefix = k;
    }
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function writeGif({ frames, size, height = size, delayCs, palette }) {
  let minCode = 2; while ((1 << minCode) < palette.length) minCode++;
  const tableSize = 1 << minCode;
  const b = [];
  const w16 = (v) => b.push(v & 255, v >> 8);
  b.push(...Buffer.from('GIF89a'));
  w16(size); w16(height); b.push(0x80 | 0x70 | (minCode - 1), 0, 0);
  for (let i = 0; i < tableSize; i++) b.push(...(palette[i] || [0, 0, 0]));
  b.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0);
  for (const f of frames) {
    b.push(0x21, 0xf9, 4, 0, delayCs & 255, delayCs >> 8, 0, 0);
    b.push(0x2c); w16(0); w16(0); w16(size); w16(height); b.push(0);
    b.push(minCode);
    const data = lzw(f, minCode);
    for (let i = 0; i < data.length; i += 255) { const c = data.slice(i, i + 255); b.push(c.length, ...c); }
    b.push(0);
  }
  b.push(0x3b);
  return Buffer.from(b);
}

if (require.main === module) {
  const [, , file, fw, scale, fps, out, bgHex = '566080'] = process.argv;
  const img = decodePng(fs.readFileSync(file));
  const FW = +fw, S = +scale, n = img.w / FW, size = FW * S, height = img.h * S;
  const bg = [0, 2, 4].map((i) => parseInt(bgHex.slice(i, i + 2), 16));
  const palette = [bg], index = new Map([[bg.join(), 0]]);
  const idx = (c) => { const k = c.join(); if (!index.has(k)) { index.set(k, palette.length); palette.push(c); } return index.get(k); };
  const frames = [];
  for (let f = 0; f < n; f++) {
    const px = new Uint8Array(size * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < size; x++) {
      const k = ((((y / S) | 0) * img.w) + f * FW + ((x / S) | 0)) * 4;
      px[y * size + x] = img.rgba[k + 3] ? idx([img.rgba[k], img.rgba[k + 1], img.rgba[k + 2]]) : 0;
    }
    frames.push(px);
  }
  if (palette.length > 256) throw new Error('more than 256 colours');
  fs.writeFileSync(out, writeGif({ frames, size, height, delayCs: Math.round(100 / +fps), palette }));
  console.log(`wrote ${out}: ${n} frames, ${size}x${height}, ${palette.length} colours`);
}
module.exports = { writeGif };
