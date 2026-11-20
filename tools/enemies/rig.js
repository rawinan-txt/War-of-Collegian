// Enemy rig: turns one approved static drawing into animation frames with real pixel differences.
// A drawing is made on a RigBuf; everything drawn before mark() is the body (outlined later, after posing),
// everything drawn after mark() is a detached "bit" (sparks, floating sheets, speed lines) that is not outlined.
// The body is split into parts by rectangles (head, arms, held prop, torso, legs); a pose moves the parts,
// leans / squashes the figure, tints or fades it, and adds extra bits. The outline pass runs on the finished pose,
// so every frame keeps the same dark inner + white outer outline as the heroes.
// The all-zero pose reproduces the approved static sprite exactly (checked by tests).
const { PixBuf, SIZE, rgb } = require('../pixel/buf');

const GROUND = 55; // the row the feet stand on (hero standard)
const OUT_DARK = '#1b1a33', OUT_WHITE = '#ffffff';

class RigBuf extends PixBuf {
  constructor() { super(); this.marked = false; this.pre = null; this.post = null; this.aura = null; }
  set(x, y, c) { if (this.marked) this.post.set(x, y, c); else super.set(x, y, c); }
  mark() { this.pre = new PixBuf(); this.pre.data.set(this.data); this.post = new PixBuf(); this.marked = true; }
  under(src) { this.aura = src; } // energy drawn behind the outlined body
}

const inRect = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];

// split the pre-outline body into named layers: parts (first rectangle match), legs (row/rect), torso (the rest)
function split(rig, spec) {
  const names = Object.keys(spec.parts || {});
  const layers = { torso: new PixBuf(), legs: new PixBuf() };
  for (const n of names) layers[n] = new PixBuf();
  const legs = spec.legs;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    if (!rig.pre.data[i + 3]) continue;
    let dest = null;
    for (const n of names) if ((spec.parts[n] || []).some((r) => inRect(r, x, y))) { dest = n; break; }
    if (!dest) dest = inRect(legs, x, y) ? 'legs' : 'torso';
    const L = layers[dest];
    L.data[i] = rig.pre.data[i]; L.data[i + 1] = rig.pre.data[i + 1]; L.data[i + 2] = rig.pre.data[i + 2]; L.data[i + 3] = 255;
  }
  return layers;
}

function blit(dst, src, dx = 0, dy = 0, mask = null) {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const s = (y * SIZE + x) * 4;
    if (!src.data[s + 3]) continue;
    const X = x + dx, Y = y + dy;
    if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
    if (mask && !mask(X, Y)) continue;
    const d = (Y * SIZE + X) * 4;
    dst.data[d] = src.data[s]; dst.data[d + 1] = src.data[s + 1]; dst.data[d + 2] = src.data[s + 2]; dst.data[d + 3] = 255;
  }
}

// lean (px at the top, positive = forward/right), squash (1 = none, scaled about the ground row), dy / dx shifts
function deform(src, { shear = 0, squash = 1, dy = 0, dx = 0 }) {
  if (!shear && squash === 1 && !dy && !dx) return src;
  const out = new PixBuf();
  for (let Y = 0; Y < SIZE; Y++) {
    const sy = Math.round(GROUND - (GROUND - (Y - dy)) / squash);
    if (sy < 0 || sy >= SIZE) continue;
    const sh = dx + Math.round((shear * Math.max(0, GROUND - Y)) / 40);
    for (let x = 0; x < SIZE; x++) {
      const s = (sy * SIZE + x) * 4;
      if (!src.data[s + 3]) continue;
      const X = x + sh;
      if (X < 0 || X >= SIZE) continue;
      const d = (Y * SIZE + X) * 4;
      out.data[d] = src.data[s]; out.data[d + 1] = src.data[s + 1]; out.data[d + 2] = src.data[s + 2]; out.data[d + 3] = 255;
    }
  }
  return out;
}

// tint with an ordered dither (a of the pixels become the tint colour) instead of blending: no new in-between colours, true pixel-art look
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function tint(buf, color, a) {
  const [r, g, b] = rgb(color);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    if (buf.data[i + 3] && BAYER[(y & 3) * 4 + (x & 3)] < a * 16) { buf.data[i] = r; buf.data[i + 1] = g; buf.data[i + 2] = b; }
  }
}

// pose = { parts:{name:{x,y}}, legs:{lx,ly,rx,ry}, lean, squash, dx, dy, tint:{color,a,parts?}, flash, fade, keep:[names], bits:[fn], postOff:{x,y} }
function compose(rig, spec, pose = {}) {
  const layers = split(rig, spec);
  const off = (n) => (pose.parts && pose.parts[n]) || {};
  const keep = new Set(pose.keep || []);
  const moving = new PixBuf(), kept = new PixBuf();
  const lg = pose.legs || {};
  const mid = spec.legSplit == null ? 32 : spec.legSplit;
  // legs: left half / right half move independently
  const lt = new PixBuf(), rt = new PixBuf();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    if (!layers.legs.data[i + 3]) continue;
    (x < mid ? lt : rt).data.set(layers.legs.data.slice(i, i + 4), i);
  }
  blit(moving, lt, lg.lx || 0, lg.ly || 0); blit(moving, rt, lg.rx || 0, lg.ry || 0);
  const order = ['torso', ...Object.keys(spec.parts || {})];
  for (const n of order) {
    const o = off(n), L = layers[n];
    let t = L;
    if (pose.tint && (!pose.tint.parts || pose.tint.parts.includes(n))) { t = new PixBuf(); t.data.set(L.data); tint(t, pose.tint.color, pose.tint.a); }
    blit(keep.has(n) ? kept : moving, t, o.x || 0, o.y || 0);
  }
  let body = deform(moving, { shear: pose.lean || 0, squash: pose.squash || 1, dy: pose.dy || 0, dx: pose.dx || 0 });
  if (pose.fade) body.fade(pose.fade);
  const comp = new PixBuf(); comp.data.set(body.data); blit(comp, kept);
  if (pose.flash) comp.flash(pose.flash);
  comp.outline(OUT_DARK); comp.outline(OUT_WHITE);
  if (rig.aura) comp.under(rig.aura);
  // detached bits of the drawing, then the pose's own bits
  const po = pose.postOff || {};
  blit(comp, rig.post, po.x || 0, po.y || 0);
  for (const fn of pose.bits || []) fn(comp);
  return comp;
}

// ---- tiny bit helpers used by the pose recipes
const bits = {
  paper(x, y, c = '#f6f2e8') { return (b) => { b.rect(x, y, 5, 4, c); b.rect(x, y + 3, 5, 1, '#b3aa95'); b.rect(x + 1, y + 1, 3, 1, '#8c94bd'); }; },
  gradedPaper(x, y) { return (b) => { b.rect(x, y, 6, 5, '#f6f2e8'); b.rect(x, y + 4, 6, 1, '#b3aa95'); b.rect(x + 1, y + 1, 2, 2, '#e0334a'); b.rect(x + 4, y + 2, 1, 1, '#8c94bd'); }; },
  pen(x, y) { return (b) => { b.rect(x, y, 7, 2, '#e0334a'); b.rect(x, y, 7, 1, '#ff6b7a'); b.rect(x + 7, y, 1, 2, OUT_DARK); b.rect(x - 1, y, 1, 2, '#c9ccdc'); }; },
  pencil(x, y) { return (b) => { b.rect(x, y, 6, 3, '#ffcf3a'); b.rect(x - 2, y, 2, 3, '#ff7aa8'); b.rect(x + 6, y, 2, 3, '#e8c28a'); b.set(x + 8, y + 1, '#2b2b3a'); b.rect(x, y, 6, 1, '#fff0a0'); }; },
  bang(x, y) { return (b) => { b.shape(x, y, [[2, 1], [2, 1], [1, 3], [1, 3], [0, 5], [0, 5]], '#ffd23a'); b.rect(x + 2, y + 1, 1, 3, '#b3122c'); b.set(x + 2, y + 5, '#b3122c'); b.rect(x - 1, y, 1, 6, OUT_DARK); b.rect(x + 5, y, 1, 6, OUT_DARK); }; },
  orb(x, y, r, c1, c2) { return (b) => { b.disc(x, y, r, c1); b.disc(x, y, Math.max(1, r - 2), c2); b.set(x - 1, y - 1, '#ffffff'); }; },
  ring(cx, cy, r, c) { return (b) => b.ring(cx, cy, r, c); },
  px(x, y, c, w = 1, h = 1) { return (b) => b.rect(x, y, w, h, c); },
  spark(x, y, c) { return (b) => { b.set(x, y, c); b.set(x - 1, y, c); b.set(x + 1, y, c); b.set(x, y - 1, c); b.set(x, y + 1, c); }; },
};

module.exports = { RigBuf, compose, bits, GROUND, OUT_DARK, OUT_WHITE, blit };
