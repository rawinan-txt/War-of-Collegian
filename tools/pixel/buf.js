// 64x64 RGBA pixel buffer with hard-edged drawing helpers (no anti-aliasing).
const SIZE = 64;
const cache = {};

function rgb(c) {
  if (typeof c !== 'string') return c;
  if (!cache[c]) cache[c] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  return cache[c];
}

class PixBuf {
  constructor() { this.data = new Uint8Array(SIZE * SIZE * 4); }

  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || !c) return;
    const [r, g, b] = rgb(c), i = (y * SIZE + x) * 4;
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 0;
    return this.data[(y * SIZE + x) * 4 + 3];
  }
  erase(x, y) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    this.data[i] = this.data[i + 1] = this.data[i + 2] = this.data[i + 3] = 0;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  // rows: array of [offsetX, width] starting at y; used for rounded shapes
  shape(x, y, rows, c) {
    rows.forEach(([ox, w], j) => this.rect(x + ox, y + j, w, 1, c));
  }
  line(x0, y0, x1, y1, c, thick = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.rect(x0 - (thick >> 1), y0 - (thick >> 1), thick, thick, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.set(cx + x, cy + y, c);
  }
  ring(cx, cy, r, c) {
    for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d >= r - 0.5 && d < r + 0.5) this.set(cx + x, cy + y, c);
    }
  }
  // 1px outline around all opaque pixels (4-neighbourhood), drawn on transparent pixels only
  outline(c) {
    const add = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
  }
  // turn every opaque pixel into one flat colour (hit flash)
  flash(c) {
    const [r, g, b] = rgb(c);
    for (let i = 0; i < this.data.length; i += 4) if (this.data[i + 3]) { this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; }
  }
  // remove pixels in an ordered-dither pattern; amount 0..1
  fade(amount) {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (bayer[(y & 3) * 4 + (x & 3)] < amount * 16) this.erase(x, y);
    }
  }
  // shift the whole image (used for body offsets); wraps nothing, clips
  shifted(dx, dy) {
    const out = new PixBuf();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const sx = x - dx, sy = y - dy;
      if (sx < 0 || sy < 0 || sx >= SIZE || sy >= SIZE) continue;
      const s = (sy * SIZE + sx) * 4, d = (y * SIZE + x) * 4;
      out.data[d] = this.data[s]; out.data[d + 1] = this.data[s + 1]; out.data[d + 2] = this.data[s + 2]; out.data[d + 3] = this.data[s + 3];
    }
    return out;
  }
  blit(src) {
    for (let i = 0; i < this.data.length; i += 4) if (src.data[i + 3]) {
      this.data[i] = src.data[i]; this.data[i + 1] = src.data[i + 1]; this.data[i + 2] = src.data[i + 2]; this.data[i + 3] = 255;
    }
  }
  count() { let n = 0; for (let i = 3; i < this.data.length; i += 4) if (this.data[i]) n++; return n; }
}

// tiny 3x5 digit glyphs for "code" effects
const GLYPHS = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
};
function glyph(buf, ch, x, y, c) {
  GLYPHS[ch].forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') buf.set(x + i, y + j, c); }));
}

module.exports = { PixBuf, SIZE, rgb, glyph };
