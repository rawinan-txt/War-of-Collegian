// Pose generators shared by every character. A def can override attack style and provide skill pose/fx.
const { CX } = require('./rig');

const COUNTS = { idle: 4, walk: 6, attack: 6, skill: 10, hurt: 3, death: 6 };
const FPS = { idle: 6, walk: 12, attack: 12, skill: 14, hurt: 12, death: 10 };
const REPEAT = { idle: -1, walk: -1, attack: 0, skill: 0, hurt: 0, death: 0 };

const h = (x, y) => [CX + x, y];

function idle(f) {
  const dy = [0, -1, 0, 1][f], sway = [0, 0, 1, 1][f];
  return { dy, handF: h(9, 41 + sway), handB: h(-9, 41 - sway), eyes: f === 3 ? 'blink' : 'open' };
}

function walk(f) {
  const ph = (f / 6) * Math.PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    dy: -Math.round(Math.abs(s) * 1.2),
    footL: [-4 + Math.round(5 * s), Math.max(0, Math.round(3 * c))],
    footR: [4 - Math.round(5 * s), Math.max(0, Math.round(-3 * c))],
    handF: h(9 - Math.round(3 * s), 41 - Math.max(0, Math.round(c))),
    handB: h(-9 + Math.round(3 * s), 41 - Math.max(0, Math.round(-c))),
    lean: 1,
  };
}

// hand = [x offset from CX, y]; impact is frame 3
const STYLES = {
  shoot: { hand: [[8, 36], [7, 34], [12, 33], [15, 32], [14, 32], [10, 37]], lean: [0, -1, 0, 1, 0, 0], dy: [0, 0, 0, 0, 0, 0], item: ['open', 'open', 'open', 'open', 'open', 'open'] },
  swing: { hand: [[6, 26], [5, 20], [10, 24], [15, 40], [14, 41], [10, 40]], lean: [-1, -2, 0, 3, 2, 0], dy: [0, 0, 0, 1, 1, 0], item: ['use', 'use', 'use', 'use', 'use', 'rest'] },
  throw: { hand: [[7, 34], [4, 26], [8, 18], [15, 26], [16, 30], [11, 36]], lean: [0, -2, -1, 2, 2, 0], dy: [0, 0, 0, 0, 0, 0], item: ['use', 'use', 'use', 'rest', 'rest', 'rest'] },
  thrust: { hand: [[7, 38], [5, 38], [11, 37], [16, 36], [15, 36], [10, 39]], lean: [0, -2, 0, 3, 2, 0], dy: [0, 0, 0, 0, 0, 0], item: ['use', 'use', 'use', 'use', 'use', 'use'] },
  strum: { hand: [[7, 39], [8, 37], [8, 41], [9, 36], [8, 42], [8, 39]], lean: [0, 1, 0, 1, 0, 0], dy: [0, -1, 0, -1, 0, 0], item: ['use', 'use', 'use', 'use', 'use', 'use'] },
  cast: { hand: [[7, 36], [6, 32], [11, 30], [16, 29], [15, 30], [10, 36]], lean: [0, -1, 0, 1, 1, 0], dy: [0, 0, 0, 0, 0, 0], item: ['use', 'use', 'use', 'use', 'use', 'rest'] },
};

function attack(def, f) {
  const s = STYLES[def.attackStyle || 'shoot'];
  const handB = [h(-9, 41), h(-8, 40), h(-10, 39), h(-11, 40), h(-10, 41), h(-9, 41)][f];
  return {
    handF: h(...s.hand[f]), handB, lean: s.lean[f], dy: s.dy[f], item: s.item[f],
    mouth: f >= 2 && f <= 4 ? 'open' : 'smile', headDx: f === 3 ? 1 : 0,
  };
}

function hurt(f) {
  return [
    { lean: -2, dy: 1, eyes: 'hurt', mouth: 'o', flash: true, handF: h(11, 36), handB: h(-11, 37), headDx: -1 },
    { lean: -3, dy: 0, eyes: 'hurt', mouth: 'o', handF: h(11, 38), handB: h(-11, 39), headDx: -1 },
    { lean: -1, dy: 0, eyes: 'hurt', mouth: 'smile', handF: h(10, 40), handB: h(-10, 40) },
  ][f];
}

function death(f) {
  return [
    { lean: -3, dy: 1, eyes: 'hurt', mouth: 'o', flash: true, handF: h(11, 34), handB: h(-11, 36), headDx: -1 },
    { lean: -5, dy: 2, headDx: -1, eyes: 'hurt', mouth: 'o', handF: h(12, 33), handB: h(-12, 35), footL: [-6, 0], footR: [3, 0] },
    { lean: -6, dy: 5, headDx: -2, headDy: 2, eyes: 'star', mouth: 'o', handF: h(8, 40), handB: h(-12, 40), footL: [-8, 0], footR: [1, 0] },
    { lean: -5, dy: 8, headDx: -1, headDy: 3, eyes: 'star', mouth: 'smile', handF: h(8, 44), handB: h(-11, 44), footL: [-10, 0], footR: [-2, 0] },
    { lean: -5, dy: 8, headDx: -1, headDy: 3, eyes: 'star', mouth: 'smile', handF: h(8, 44), handB: h(-11, 44), footL: [-10, 0], footR: [-2, 0], fade: 0.45 },
    { lean: -5, dy: 8, headDx: -1, headDy: 3, eyes: 'star', mouth: 'smile', handF: h(8, 44), handB: h(-11, 44), footL: [-10, 0], footR: [-2, 0], fade: 0.9 },
  ][f];
}

function poseFor(def, anim, f) {
  if (anim === 'idle') return idle(f);
  if (anim === 'walk') return walk(f);
  if (anim === 'attack') return attack(def, f);
  if (anim === 'skill') return def.skill.pose(f);
  if (anim === 'hurt') return hurt(f);
  if (anim === 'death') return death(f);
  throw new Error('unknown anim ' + anim);
}

module.exports = { COUNTS, FPS, REPEAT, poseFor };
