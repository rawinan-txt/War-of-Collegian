// Shared chibi rig v2: draws one 64x64 frame of a student character from a def + a pose.
// Proportions: big head (22 of 38 px = ~58% of the figure), small body. Layout (px):
//   head y17-38 (22 rows, 22 wide), torso y39-45, hips y47, shoes bottom row 54,
//   dark inner outline (row 55 under the shoes) + white outer outline (row 56).
// Existing pose keyframes were authored for the old, taller rig; `mapHand` / `mapFoot` adapt them.
const { PixBuf } = require('./buf');

const CX = 32, SHOE_Y = 54, HIP_Y = 47, SHOULDER_Y = 41, HEAD_Y = 17, HEAD_X = CX - 11;
const HEAD_ROWS = [10, 14, 17, 19, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 21, 20, 18, 16, 12, 8];
const HEAD_H = HEAD_ROWS.length;
const FIGURE_H = SHOE_Y - HEAD_Y + 1; // head top to shoe bottom
const OUT_DARK = '#1b1a33', OUT_WHITE = '#ffffff';
const WHITE = '#ffffff', BLUSH = '#ff9aa8', MOUTH = '#9a4a56', MOUTH_IN = '#6e2a36';

const DEFAULT_POSE = {
  dx: 0, dy: 0, lean: 0, headDx: 0, headDy: 0,
  footL: [-4, 0], footR: [4, 0],
  handF: [CX + 9, 41], handB: [CX - 9, 41],
  eyes: 'open', mouth: 'smile', item: 'rest', flash: false, fade: 0,
};

// pose keyframes use the old rig's coordinates (shoulders at y=35); re-express them for the new body
function mapHand([x, y]) { const d = y - 35; return [x, SHOULDER_Y + (d < 0 ? d * 1.35 : d * 0.8)]; }
function mapFoot([x, lift]) { return [Math.round(x * 0.8), Math.round(lift * 0.7)]; }

function lerp(a, b, t) { return a + (b - a) * t; }

function arm(buf, sx, sy, hx, hy, sleeve, skin) {
  const mx = lerp(sx, hx, 0.5), my = lerp(sy, hy, 0.5);
  buf.line(sx, sy, mx, my, sleeve, 3);
  buf.line(mx, my, hx, hy, skin, 2);
  buf.rect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3, skin);
}

function leg(buf, hx, hy, fx, fy, look) {
  if (look.bottomType === 'skirt') buf.line(hx, hy, fx, fy - 1, look.skin, 2);
  else buf.line(hx, hy, fx, fy - 1, look.bottom, 4);
  buf.rect(fx - 2, fy - 1, 5, 2, look.shoes);
  buf.set(fx + 3, fy, look.shoes);
}

const span = (r) => { const w = HEAD_ROWS[r]; return [(22 - w) >> 1, w]; };

// ---------- hair ----------
function hairBack(buf, look, x0, y0) {
  const c = look.hair, s = look.hairStyle;
  if (s === 'long') {
    const len = look.hairLen || 28, fl = look.hairFlare || 0;
    buf.rect(x0 - 2, y0 + 8, 5, len - 8, c); buf.rect(x0 + 19, y0 + 8, 5, len - 8, c);
    buf.rect(x0 - 1, y0 + 8, 2, len - 10, look.hairShade || c); buf.rect(x0 + 21, y0 + 8, 2, len - 10, look.hairShade || c);
    if (fl) { buf.rect(x0 - 2 - fl, y0 + len - 10, fl, 10, c); buf.rect(x0 + 24, y0 + len - 10, fl, 10, c); }
  } else if (s === 'sideponytail') {
    buf.shape(x0 + 19, y0 + 6, [[0, 6], [0, 7], [1, 7], [1, 7], [1, 6], [1, 6], [2, 5], [2, 5], [2, 4], [2, 4], [3, 3], [3, 3]], c);
    buf.rect(x0 + 22, y0 + 10, 2, 8, look.hairShade || c);
  }
}

function hairFront(buf, look, x0, y0) {
  const c = look.hair, hi = look.hairHi || c, st = look.hairStyle || 'short';
  // cap: head-shaped, one pixel wider than the skull
  for (let r = 0; r < 9; r++) { const [ox, w] = span(r); const e = r >= 3 ? 1 : 0; buf.rect(x0 + ox - e, y0 + r, w + 2 * e, 1, c); }
  buf.rect(x0 + 4, y0 - 1, 14, 1, c); // crown
  // highlight streaks (the reference's lighter hair band)
  buf.rect(x0 + 4, y0 + 2, 6, 1, hi); buf.rect(x0 + 12, y0 + 2, 6, 1, hi);
  buf.rect(x0 + 3, y0 + 4, 4, 1, hi); buf.rect(x0 + 13, y0 + 4, 5, 1, hi);
  // sides
  const sideLen = { short: 12, swept: 12, spiky: 11, ruffled: 12, long: 20, sideponytail: 13 }[st] || 12;
  buf.rect(x0 - 1, y0 + 5, 3, sideLen - 5, c); buf.rect(x0 + 20, y0 + 5, 3, sideLen - 5, c);
  if (look.hairShade) { buf.rect(x0 - 1, y0 + 9, 1, sideLen - 9, look.hairShade); buf.rect(x0 + 22, y0 + 9, 1, sideLen - 9, look.hairShade); }
  // bangs
  const bangs = {
    short: [[9, [[1, 6], [8, 5], [15, 6]]], [10, [[2, 3], [17, 3]]]],
    swept: [[9, [[0, 17]]], [10, [[0, 13]]], [11, [[1, 7]]], [9, [[18, 4]]], [10, [[18, 4]]], [11, [[19, 3]]], [12, [[19, 3]]]],
    spiky: [[9, [[1, 4], [7, 3], [12, 3], [18, 3]]], [10, [[2, 2], [18, 2]]]],
    ruffled: [[9, [[0, 5], [8, 3], [13, 4], [18, 4]]], [10, [[1, 3], [10, 2], [19, 2]]]],
    long: [[9, [[0, 22]]], [10, [[0, 8], [13, 9]]], [11, [[0, 4], [18, 4]]]],
    sideponytail: [[9, [[0, 22]]], [10, [[1, 6], [13, 7]]]],
  }[st] || [];
  for (const [r, rects] of bangs) for (const [ox, w] of rects) buf.rect(x0 + ox, y0 + r, w, 1, c);
  if (st === 'swept' || st === 'short') buf.rect(x0 + 5, y0 + 9, 3, 1, hi);
  // top volume
  if (st === 'spiky') [[2, 4], [6, 6], [11, 5], [15, 6], [19, 4]].forEach(([ox, h]) => { buf.rect(x0 + ox, y0 - 1 - h, 3, h, c); buf.set(x0 + ox + 1, y0 - h, hi); });
  if (st === 'ruffled') [[2, 3], [6, 4], [10, 3], [14, 4], [18, 3]].forEach(([ox, h]) => { buf.rect(x0 + ox, y0 - 1 - h, 3, h, c); buf.set(x0 + ox + 1, y0 - h, hi); });
  if (st === 'swept') buf.rect(x0 + 6, y0 - 3, 8, 2, c);
  if (st === 'short') buf.rect(x0 + 5, y0 - 2, 12, 1, c);
}

// ---------- face ----------
const EYE = ['DDDDD', 'IWIII', 'IIDII', 'ILLLI', '.III.'];
function drawEye(buf, x, y, look, kind) {
  const pal = { D: look.eyeDark || OUT_DARK, I: look.iris, L: look.irisHi || look.iris, W: WHITE };
  if (kind === 'open') EYE.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') buf.set(x + i, y + j, pal[ch]); }));
  else if (kind === 'blink') { buf.rect(x, y + 3, 5, 1, pal.D); buf.set(x, y + 2, pal.D); buf.set(x + 4, y + 2, pal.D); }
  else if (kind === 'hurt') { [0, 1, 2].forEach((j) => { const dx = j === 1 ? 2 : j === 0 ? 0 : 0; buf.set(x + dx, y + j + 1, pal.D); buf.set(x + dx + 1, y + j + 1, pal.D); }); buf.set(x + 3, y + 1, pal.D); buf.set(x + 3, y + 3, pal.D); }
  else if (kind === 'star') { [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4], [1, 1], [3, 1], [1, 3], [3, 3]].forEach(([i, j]) => buf.set(x + i, y + j, pal.D)); }
}

function drawFace(buf, look, x0, y0, p) {
  const ey = y0 + 10, exL = x0 + 3, exR = x0 + 13;
  const kind = p.eyes;
  drawEye(buf, exL, ey, look, kind);
  drawEye(buf, exR, ey, look, kind);
  if (look.glasses) {
    const g = look.glasses;
    [exL, exR].forEach((x) => { buf.rect(x - 1, ey - 1, 7, 1, g); buf.rect(x - 1, ey + 5, 7, 1, g); buf.rect(x - 1, ey, 1, 5, g); buf.rect(x + 5, ey, 1, 5, g); });
    buf.rect(exL + 6, ey + 1, 6, 1, g);
  }
  buf.rect(exL - 1, ey + 6, 3, 1, BLUSH); buf.rect(exR + 3, ey + 6, 3, 1, BLUSH);
  const mx = x0 + 10, my = y0 + 17;
  if (p.mouth === 'smile') { buf.rect(mx, my, 3, 1, MOUTH); buf.set(mx - 1, my - 1, MOUTH); buf.set(mx + 3, my - 1, MOUTH); }
  else if (p.mouth === 'open') { buf.rect(mx, my - 1, 4, 3, MOUTH_IN); buf.set(mx + 1, my - 1, WHITE); buf.set(mx + 2, my - 1, WHITE); }
  else if (p.mouth === 'o') { buf.rect(mx + 1, my - 1, 2, 2, MOUTH_IN); }
}

function renderFrame(def, poseIn) {
  const look = def.look, p = { ...DEFAULT_POSE, ...poseIn };
  const buf = new PixBuf();
  const tx = p.dx + p.lean, ty = p.dy;
  const hipx = p.dx + Math.round(p.lean / 2);
  const hx = tx + p.headDx, hy = ty + p.headDy;
  const x0 = HEAD_X + hx, y0 = HEAD_Y + hy;
  const ctx = { tx, ty, hx, hy, x0, y0 };
  const hF = mapHand(p.handF), hB = mapHand(p.handB), fL = mapFoot(p.footL), fR = mapFoot(p.footR);

  hairBack(buf, look, x0, y0);
  if (def.acc && def.acc.back) def.acc.back(buf, p, ctx);

  arm(buf, CX - 6 + tx, SHOULDER_Y + ty, hB[0] + tx, hB[1] + ty, look.shirtShade, look.skin);

  const hipY = HIP_Y + ty;
  leg(buf, CX - 3 + hipx, hipY, CX + fL[0] + p.dx, SHOE_Y - fL[1], look);
  leg(buf, CX + 3 + hipx, hipY, CX + fR[0] + p.dx, SHOE_Y - fR[1], look);

  if (look.bottomType === 'skirt') {
    buf.shape(CX - 8 + hipx, 45 + ty, [[1, 14], [0, 16], [0, 16], [0, 16], [1, 14]], look.bottom);
    buf.rect(CX - 8 + hipx, 49 + ty, 16, 1, look.accent);
  } else buf.rect(CX - 6 + hipx, 45 + ty, 12, 4, look.bottom);

  // torso (shirt) + lanyard
  buf.shape(CX - 6 + tx, 39 + ty, [[1, 10], [0, 12], [0, 12], [0, 12], [0, 12], [0, 12], [0, 12]], look.shirt);
  buf.rect(CX + 4 + tx, 40 + ty, 2, 6, look.shirtShade);
  buf.rect(CX - 1 + tx, 39 + ty, 2, 2, look.accent);
  buf.rect(CX + tx, 41 + ty, 1, 3, look.lanyard || look.accent);
  buf.rect(CX - 1 + tx, 44 + ty, 3, 2, WHITE); buf.set(CX + tx, 44 + ty, look.lanyard || look.accent);
  buf.rect(CX - 6 + tx, 45 + ty, 12, 1, look.accent);
  if (def.acc && def.acc.body) def.acc.body(buf, p, ctx);

  // head
  buf.shape(x0, y0, HEAD_ROWS.map((w) => [(22 - w) >> 1, w]), look.skin);
  buf.rect(x0 + 17, y0 + 13, 4, 7, look.skinShade); buf.rect(x0 + 6, y0 + 20, 10, 1, look.skinShade);
  hairFront(buf, look, x0, y0);
  drawFace(buf, look, x0, y0, p);
  if (def.acc && def.acc.head) def.acc.head(buf, p, ctx);

  const fx = hF[0] + tx, fy = hF[1] + ty;
  arm(buf, CX + 6 + tx, SHOULDER_Y + ty, fx, fy, look.shirt, look.skin);
  if (def.acc && def.acc.hand) def.acc.hand(buf, p, { ...ctx, fx, fy });

  if (p.flash) buf.flash(WHITE);
  buf.outline(OUT_DARK);
  buf.outline(OUT_WHITE);
  if (p.fade) buf.fade(p.fade);
  return buf;
}

module.exports = { renderFrame, DEFAULT_POSE, CX, SHOE_Y, HEAD_H, FIGURE_H, OUT_DARK, OUT_WHITE, WHITE, HEAD_ROWS };
