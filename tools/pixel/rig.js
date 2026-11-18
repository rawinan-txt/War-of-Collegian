// Shared chibi rig: draws one 64x64 frame of a student character from a def + a pose.
// Layout (px): head y16-31 (16 rows, 18 wide), torso y32-42, hips y43, shoes bottom row 54, outline row 55.
const { PixBuf } = require('./buf');

const CX = 32, SHOE_Y = 54, HIP_Y = 44, HEAD_Y = 16, OUTLINE = '#1a1d33';
const HEAD_ROWS = [10, 14, 16, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17, 16, 14, 10];
const WHITE = '#ffffff', BLUSH = '#ff9aa8', MOUTH = '#a4505a', MOUTH_IN = '#7a2f3a';

const DEFAULT_POSE = {
  dx: 0, dy: 0, lean: 0, headDx: 0, headDy: 0,
  footL: [-4, 0], footR: [4, 0], // [x offset from CX, lift above ground]
  handF: [CX + 9, 41], handB: [CX - 9, 41],
  eyes: 'open', mouth: 'smile', item: 'rest', flash: false, fade: 0, legs: 'stand',
};

function lerp(a, b, t) { return a + (b - a) * t; }

function arm(buf, sx, sy, hx, hy, sleeve, skin) {
  const mx = lerp(sx, hx, 0.55), my = lerp(sy, hy, 0.55);
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

function drawHair(buf, look, x0, y0, flip) {
  const c = look.hair, style = look.hairStyle || 'short';
  // cap
  buf.shape(x0, y0 - 1, [[4, 10], [2, 14], [1, 16], [0, 18], [0, 18], [0, 18], [0, 18]], c);
  // sides
  const sideLen = style === 'bob' ? 12 : style === 'long' ? 16 : 6;
  buf.rect(x0, y0 + 4, 2, sideLen, c);
  buf.rect(x0 + 16, y0 + 4, 2, style === 'long' ? 16 : sideLen, c);
  // fringe
  const fr = { spiky: [[1, 3], [6, 2], [10, 3], [14, 3]], bun: [[2, 14]], short: [[1, 5], [8, 4], [14, 3]], bob: [[1, 16]], long: [[1, 16]], curly: [[1, 4], [6, 3], [11, 3], [15, 2]], ponytail: [[1, 6], [9, 7]] }[style] || [[1, 16]];
  fr.forEach(([ox, w]) => buf.rect(x0 + ox, y0 + 5, w, 2, c));
  if (style === 'spiky') [[2, 3], [6, 4], [10, 4], [14, 3]].forEach(([ox, h]) => buf.rect(x0 + ox, y0 - 1 - h, 3, h, c));
  if (style === 'bun') buf.disc(x0 + 9, y0 - 4, 3, c);
  if (style === 'ponytail') { buf.line(x0 + 17, y0 + 3, x0 + 21, y0 + 12, c, 3); }
  if (style === 'curly') [[1, 2], [5, 3], [10, 3], [14, 2]].forEach(([ox, h]) => buf.rect(x0 + ox, y0 - 2 - (h > 2 ? 1 : 0), 3, 2, c));
}

function drawFace(buf, look, hx, hy, p) {
  const ex = CX + hx + 1, ey = HEAD_Y + 7 + hy, e = look.eye;
  const eyeL = ex - 5, eyeR = ex + 3;
  if (p.eyes === 'open') {
    buf.rect(eyeL, ey, 2, 3, e); buf.rect(eyeR, ey, 2, 3, e);
    buf.set(eyeL, ey, WHITE); buf.set(eyeR, ey, WHITE);
  } else if (p.eyes === 'blink') {
    buf.rect(eyeL, ey + 2, 3, 1, e); buf.rect(eyeR - 1, ey + 2, 3, 1, e);
  } else if (p.eyes === 'hurt') {
    [eyeL, eyeR].forEach((x, i) => {
      if (i === 0) { buf.set(x, ey, e); buf.set(x + 1, ey + 1, e); buf.set(x, ey + 2, e); }
      else { buf.set(x + 1, ey, e); buf.set(x, ey + 1, e); buf.set(x + 1, ey + 2, e); }
    });
  } else if (p.eyes === 'star') {
    [eyeL, eyeR].forEach((x) => { buf.set(x, ey, e); buf.set(x + 1, ey, e); buf.set(x, ey + 1, e); buf.set(x + 1, ey + 2, e); buf.set(x, ey + 2, e); });
  }
  buf.rect(eyeL - 1, ey + 4, 2, 1, BLUSH); buf.rect(eyeR + 1, ey + 4, 2, 1, BLUSH);
  const mx = ex - 1, my = ey + 5;
  if (p.mouth === 'smile') { buf.rect(mx, my, 3, 1, MOUTH); buf.set(mx - 1, my - 1, MOUTH); buf.set(mx + 3, my - 1, MOUTH); }
  else if (p.mouth === 'open') { buf.rect(mx, my - 1, 3, 3, MOUTH_IN); buf.set(mx + 1, my - 1, WHITE); }
  else if (p.mouth === 'o') { buf.rect(mx + 1, my - 1, 2, 2, MOUTH_IN); }
}

function renderFrame(def, poseIn) {
  const look = def.look, p = { ...DEFAULT_POSE, ...poseIn };
  const buf = new PixBuf();
  const tx = p.dx + p.lean, ty = p.dy;               // upper body offset
  const hipx = p.dx + Math.round(p.lean / 2);         // hips follow half the lean
  const hx = tx + p.headDx, hy = ty + p.headDy;
  const x0 = CX - 9 + hx, y0 = HEAD_Y + hy;

  if (def.acc && def.acc.back) def.acc.back(buf, p, { tx, ty, hx, hy, x0, y0 });

  // back arm (behind torso)
  arm(buf, CX - 7 + tx, 35 + ty, p.handB[0] + tx, p.handB[1] + ty, look.shirtShade, look.skin);

  // legs
  const hipY = HIP_Y + ty;
  leg(buf, CX - 3 + hipx, hipY, CX + p.footL[0] + p.dx, SHOE_Y - p.footL[1], look);
  leg(buf, CX + 3 + hipx, hipY, CX + p.footR[0] + p.dx, SHOE_Y - p.footR[1], look);

  // waist / skirt
  if (look.bottomType === 'skirt') {
    buf.shape(CX - 9 + hipx, 41 + ty, [[2, 14], [1, 16], [0, 18], [0, 18], [0, 18]], look.bottom);
    buf.rect(CX - 9 + hipx, 45 + ty, 18, 1, look.accent);
  } else buf.rect(CX - 7 + hipx, 41 + ty, 14, 4, look.bottom);

  // torso
  buf.shape(CX - 7 + tx, 32 + ty, [[1, 12], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]], look.shirt);
  buf.rect(CX + 5 + tx, 34 + ty, 2, 7, look.shirtShade);
  buf.rect(CX - 2 + tx, 32 + ty, 4, 1, look.accent); buf.rect(CX - 1 + tx, 33 + ty, 2, 1, look.accent);
  buf.rect(CX - 7 + tx, 40 + ty, 14, 1, look.accent);
  if (def.acc && def.acc.body) def.acc.body(buf, p, { tx, ty, hx, hy, x0, y0 });

  // head
  buf.shape(x0, y0, HEAD_ROWS.map((w) => [(18 - w) >> 1, w]), look.skin);
  buf.rect(x0 + 14, y0 + 11, 3, 4, look.skinShade);
  drawHair(buf, look, x0, y0);
  drawFace(buf, look, hx, hy, p);
  if (def.acc && def.acc.head) def.acc.head(buf, p, { tx, ty, hx, hy, x0, y0 });

  // front arm + held item
  const fx = p.handF[0] + tx, fy = p.handF[1] + ty;
  arm(buf, CX + 7 + tx, 35 + ty, fx, fy, look.shirt, look.skin);
  if (def.acc && def.acc.hand) def.acc.hand(buf, p, { fx, fy, tx, ty });

  if (p.flash) buf.flash(WHITE);
  buf.outline(OUTLINE);
  if (p.fade) buf.fade(p.fade);
  return buf;
}

module.exports = { renderFrame, DEFAULT_POSE, CX, SHOE_Y, OUTLINE, WHITE };
