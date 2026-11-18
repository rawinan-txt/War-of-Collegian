// The other heroes of the code roster + the summoned dog. Each def: look, attack style, accessories, unique skill pose + fx.
const { CX } = require('./rig');
const { PixBuf } = require('./buf');
const { h, STUDENT, bmp, HEART, NOTE, CROSS, TOOTH, cog, dome, seq } = require('./helpers');

const R = Math.round;
const base = (o) => ({ ...o, impact: { attack: 3, skill: 6 } });

// ---------- Mecha Freshy (Engineering): hard hat + wrench, gear barrier ----------
const mecha = base({
  id: 'mecha', name: 'mecha_freshy', title: 'Mecha Freshy', faculty: 'EG', folder: 'engineering/mecha_freshy', skillMode: 'onDeploy', attackStyle: 'swing',
  look: { ...STUDENT, hair: '#4a3426', hairStyle: 'short', bottom: '#5a4a3a', bottomType: 'trousers', shoes: '#2d2a45', accent: '#ffae44' },
  acc: {
    body(buf, p, { tx, ty }) { buf.rect(CX - 7 + tx, 41 + ty, 4, 4, '#c97a1e'); buf.rect(CX - 6 + tx, 42 + ty, 2, 1, '#ffae44'); },
    head(buf, p, { x0, y0 }) {
      buf.shape(x0, y0 - 4, [[4, 10], [2, 14], [1, 16]], '#ffae44');
      buf.rect(x0 - 1, y0 - 1, 20, 2, '#c97a1e'); buf.rect(x0 + 8, y0 - 4, 2, 3, '#c97a1e'); buf.set(x0 + 5, y0 - 3, '#ffd08a');
    },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      if (p.item !== 'use') { buf.rect(fx - 1, fy, 2, 10, '#8a93b8'); buf.rect(fx - 2, fy + 9, 4, 3, '#c8d1ee'); }
      else { buf.rect(fx - 1, fy - 11, 2, 12, '#8a93b8'); buf.rect(fx - 3, fy - 14, 6, 4, '#c8d1ee'); buf.rect(fx - 1, fy - 14, 2, 2, '#8a93b8'); }
    },
  },
  skill: {
    pose: (f) => seq({ item: 'rest' }, [
      { dy: 1, handF: h(8, 44), handB: h(-8, 44) }, { dy: 2, handF: h(7, 44), handB: h(-7, 44) }, { dy: 2, handF: h(7, 42), handB: h(-7, 42) },
      { dy: 1, handF: h(10, 34), handB: h(-10, 34) }, { handF: h(12, 28), handB: h(-12, 28), mouth: 'open' }, { dy: -1, handF: h(13, 26), handB: h(-13, 26), mouth: 'open', headDy: -1 },
      { handF: h(15, 30), handB: h(-15, 30), mouth: 'open', lean: 1 }, { handF: h(14, 32), handB: h(-14, 32) }, { handF: h(12, 36), handB: h(-12, 36) }, { handF: h(9, 41), handB: h(-9, 41) },
    ])[f],
    fx(buf, f) {
      cog(buf, 13, 28, 3, '#ffd08a', f * 0.5); cog(buf, 51, 33, 4, '#ffae44', -f * 0.4);
      if (f >= 3 && f <= 8) { buf.ring(CX, 34, Math.min(22, (f - 1) * 4), '#ffd08a'); if (f === 6) for (let k = 0; k < 8; k++) buf.set(CX + Math.cos(k * 0.8) * 22, 34 + Math.sin(k * 0.8) * 20, '#fff'); }
    },
  },
});

// ---------- Lab Maniac (Science): lab coat, goggles, flask ----------
const lab = base({
  id: 'lab', name: 'lab_maniac', title: 'Lab Maniac', faculty: 'SC', folder: 'science/lab_maniac', skillMode: 'every3', attackStyle: 'throw',
  look: { ...STUDENT, hair: '#7a4fc4', hairStyle: 'long', bottom: '#3d3568', bottomType: 'trousers', shoes: '#2d2a45', accent: '#b995ff' },
  acc: {
    body(buf, p, { tx, ty }) {
      buf.rect(CX - 8 + tx, 32 + ty, 3, 17, '#e9eefc'); buf.rect(CX + 5 + tx, 32 + ty, 3, 17, '#e9eefc'); buf.rect(CX - 8 + tx, 44 + ty, 16, 5, '#e9eefc');
      buf.rect(CX + 6 + tx, 34 + ty, 2, 13, '#c5cfe6'); buf.rect(CX - 6 + tx, 38 + ty, 3, 3, '#b995ff');
    },
    head(buf, p, { x0, y0 }) { buf.rect(x0 + 2, y0 + 3, 6, 3, '#3d3568'); buf.rect(x0 + 10, y0 + 3, 6, 3, '#3d3568'); buf.rect(x0 + 3, y0 + 4, 4, 1, '#bfe9ff'); buf.rect(x0 + 11, y0 + 4, 4, 1, '#bfe9ff'); },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      const liquid = (p.f || 0) % 2 ? '#6ee0a5' : '#b995ff';
      buf.rect(fx - 1, fy - 9, 3, 3, '#bfe9ff'); buf.rect(fx - 1, fy - 10, 3, 1, '#7a4a2a');
      buf.shape(fx - 4, fy - 6, [[2, 4], [1, 6], [0, 8], [0, 8]], '#bfe9ff'); buf.shape(fx - 3, fy - 4, [[1, 4], [0, 6], [0, 6]], liquid);
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 36) }, { handF: h(9, 30) }, { handF: h(8, 22), headDy: -1 }, { handF: h(6, 17) }, { handF: h(9, 16), mouth: 'open' },
      { handF: h(6, 17), mouth: 'open' }, { handF: h(15, 24), lean: 3, mouth: 'open' }, { handF: h(16, 30), lean: 2 }, { handF: h(12, 36), item: 'rest' }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 1 && f <= 6) for (let k = 0; k < 6; k++) { const x = 38 + ((k * 7 + f * 3) % 18), y = 30 - ((f * 4 + k * 5) % 22); buf.rect(x, y, 2, 2, k % 2 ? '#b995ff' : '#6ee0a5'); }
      if (f === 6) { buf.ring(48, 22, 7, '#e9eefc'); buf.ring(48, 22, 11, '#b995ff'); }
      if (f === 7) buf.ring(52, 26, 13, '#6ee0a5');
    },
  },
});

// ---------- Night Shifter (Medicine/Siriraj): scrubs, stethoscope, medical bag ----------
const night = base({
  id: 'night', name: 'night_shifter', title: 'Night Shifter', faculty: 'SI', folder: 'medicine/night_shifter', skillMode: 'onPulse', attackStyle: 'cast',
  look: { ...STUDENT, shirt: '#8fe3bf', shirtShade: '#5bd6a2', hair: '#1e2a3a', hairStyle: 'short', bottom: '#3a7d6a', bottomType: 'trousers', shoes: '#2d2a45', accent: '#5bd6a2' },
  acc: {
    body(buf, p, { tx, ty }) {
      buf.line(CX - 3 + tx, 32 + ty, CX - 4 + tx, 38 + ty, '#2a2f45', 1); buf.line(CX + 3 + tx, 32 + ty, CX + 3 + tx, 38 + ty, '#2a2f45', 1);
      buf.line(CX - 4 + tx, 38 + ty, CX + tx, 41 + ty, '#2a2f45', 1); buf.line(CX + 3 + tx, 38 + ty, CX + tx, 41 + ty, '#2a2f45', 1); buf.rect(CX - 1 + tx, 41 + ty, 3, 2, '#c5cfe6');
    },
    head(buf, p, { x0, y0 }) {
      // scrub cap with a knot at the back
      buf.shape(x0, y0 - 3, [[3, 12], [1, 16], [0, 18], [0, 18], [0, 18]], '#5bd6a2'); buf.rect(x0, y0 + 2, 18, 1, '#3a7d6a'); buf.disc(x0 + 19, y0 + 2, 2, '#5bd6a2');
    },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      const y = p.item === 'use' ? fy - 9 : fy - 1;
      buf.rect(fx - 4, y, 9, 7, '#d94b5a'); buf.rect(fx - 4, y, 9, 1, '#9b2f3c'); buf.rect(fx, y + 2, 1, 3, '#fff'); buf.rect(fx - 1, y + 3, 3, 1, '#fff');
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 38), handB: h(-9, 40) }, { dy: 1, handF: h(9, 34), handB: h(-10, 36) }, { handF: h(10, 28), handB: h(-11, 30) }, { handF: h(10, 22), handB: h(-11, 24), headDy: -1 },
      { handF: h(10, 18), handB: h(-11, 20), mouth: 'open', headDy: -1 }, { handF: h(10, 17), handB: h(-11, 19), mouth: 'open' }, { handF: h(11, 16), handB: h(-12, 18), mouth: 'open', headDy: -1 },
      { handF: h(11, 22), handB: h(-12, 24) }, { handF: h(10, 30), handB: h(-11, 32), item: 'rest' }, { handF: h(9, 41), handB: h(-9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 2 && f <= 8) bmp(buf, CROSS, CX - 2, 8 - Math.min(6, f - 2) + (f > 6 ? 4 : 0), '#9dffcb');
      if (f >= 4 && f <= 7) { buf.ring(CX, 30, (f - 3) * 6, '#9dffcb'); }
      if (f === 6) for (let k = 0; k < 6; k++) buf.rect(8 + k * 9, 14 + (k % 2) * 8, 2, 2, '#fff');
    },
  },
});

// ---------- Chemist Pro (Pharmacy): safety glasses, potion bottles ----------
const chem = base({
  id: 'chem', name: 'chemist_pro', title: 'Chemist Pro', faculty: 'PY', folder: 'pharmacy/chemist_pro', skillMode: 'every3', attackStyle: 'throw',
  look: { ...STUDENT, hair: '#e87aa8', hairStyle: 'ponytail', bottom: '#7a3f66', bottomType: 'skirt', shoes: '#2d2a45', accent: '#ec85bc' },
  acc: {
    body(buf, p, { tx, ty }) {
      buf.rect(CX - 11 + tx, 40 + ty, 4, 5, '#ec85bc'); buf.rect(CX - 10 + tx, 38 + ty, 2, 2, '#e0a24a');
      buf.rect(CX - 7 + tx, 41 + ty, 3, 4, '#6ee0a5');
    },
    head(buf, p, { x0, y0 }) {
      buf.rect(x0 + 2, y0 + 6, 6, 5, '#ec85bc'); buf.rect(x0 + 10, y0 + 6, 6, 5, '#ec85bc');
      buf.rect(x0 + 3, y0 + 7, 4, 3, '#dff6ff'); buf.rect(x0 + 11, y0 + 7, 4, 3, '#dff6ff');
      buf.set(x0 + 4, y0 + 7, '#fff'); buf.set(x0 + 12, y0 + 7, '#fff');
    },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      const y = p.item === 'rest' ? fy - 2 : fy - 8;
      buf.rect(fx - 2, y, 5, 8, '#e0a24a'); buf.rect(fx - 1, y - 2, 3, 2, '#7a4a2a'); buf.rect(fx - 1, y + 2, 3, 3, '#fff6c8');
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 36), handB: h(-6, 36) }, { handF: h(7, 33), handB: h(-4, 33), lean: -1 }, { handF: h(9, 31), handB: h(-3, 31), lean: 0, dy: 1 }, { handF: h(7, 30), handB: h(-4, 32), dy: 0 },
      { handF: h(9, 31), handB: h(-3, 31) }, { handF: h(8, 30), handB: h(-4, 31), mouth: 'open' }, { handF: h(16, 28), handB: h(-6, 34), lean: 3, mouth: 'open' }, { handF: h(15, 31), lean: 2 },
      { handF: h(12, 36), item: 'rest' }, { handF: h(9, 41), handB: h(-9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 1 && f <= 5) for (let k = 0; k < 5; k++) buf.rect(30 + k * 3 + (f % 2), 22 - ((f * 3 + k * 4) % 12), 2, 2, k % 2 ? '#9be86a' : '#ec85bc');
      if (f >= 6) for (let k = 0; k < 9; k++) buf.disc(46 + (k % 3) * 5 + (f - 6) * 2, 24 + R(Math.sin(k * 1.7) * 6), 3 - ((k + f) % 2), k % 2 ? '#9be86a' : '#4fa83a');
    },
  },
});

// ---------- Animal Keeper (Veterinary): companion dog, paw badge ----------
const animal = base({
  id: 'animal', name: 'animal_keeper', title: 'Animal Keeper', faculty: 'VS', folder: 'veterinary/animal_keeper', skillMode: 'onPulse', attackStyle: 'swing',
  look: { ...STUDENT, shirt: '#d9f5e6', shirtShade: '#a9dcc2', hair: '#3d5a3a', hairStyle: 'curly', bottom: '#4a6b4f', bottomType: 'trousers', shoes: '#4a3a2a', accent: '#8de7ac' },
  acc: {
    back(buf, p, { tx, ty }) {
      const bob = (p.f || 0) % 2;
      buf.rect(CX - 20 + tx, 47 + ty - bob, 10, 6, '#c98a4a'); buf.rect(CX - 20 + tx, 53 + ty, 3, 2, '#8a5a2a'); buf.rect(CX - 13 + tx, 53 + ty, 3, 2, '#8a5a2a');
      buf.rect(CX - 12 + tx, 43 + ty - bob, 5, 5, '#c98a4a'); buf.rect(CX - 8 + tx, 44 + ty - bob, 2, 3, '#8a5a2a'); buf.set(CX - 10 + tx, 45 + ty - bob, '#1a2342'); buf.rect(CX - 22 + tx, 45 + ty - bob + (bob ? 0 : 1), 2, 3, '#8a5a2a');
    },
    head(buf, p, { x0, y0 }) { bmp(buf, ['10101', '01010', '01110'], x0 + 6, y0 - 4, '#8de7ac'); },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      if (p.item === 'rest') { buf.rect(fx - 3, fy, 7, 2, '#fff3d6'); buf.rect(fx - 4, fy - 1, 2, 4, '#fff3d6'); buf.rect(fx + 3, fy - 1, 2, 4, '#fff3d6'); }
      else { buf.rect(fx - 1, fy - 5, 3, 3, '#8de7ac'); }
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 38) }, { handF: h(7, 30) }, { handF: h(5, 26), mouth: 'o', headDy: -1 }, { handF: h(5, 25), mouth: 'o' }, { handF: h(6, 27), mouth: 'o' },
      { handF: h(12, 28), mouth: 'open', lean: 1 }, { handF: h(17, 30), lean: 2, mouth: 'open' }, { handF: h(17, 31), lean: 2 }, { handF: h(13, 36), item: 'rest' }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 2 && f <= 5) bmp(buf, NOTE, 14 + f * 3, 14 - (f % 3), '#8de7ac');
      if (f >= 5) for (let k = 0; k < 3; k++) { const x = 26 + (f - 5) * 8 + k * 10; if (x < 60) { buf.rect(x, 52, 3, 2, '#8de7ac'); buf.set(x - 1, 51, '#8de7ac'); buf.set(x + 3, 51, '#8de7ac'); } }
    },
  },
});

// ---------- Dental Blitz (Dentistry): face mask, head mirror, dental drill ----------
const dental = base({
  id: 'dental', name: 'dental_blitz', title: 'Dental Blitz', faculty: 'DT', folder: 'dentistry/dental_blitz', skillMode: 'every3', attackStyle: 'thrust',
  look: { ...STUDENT, hair: '#5aa6c9', hairStyle: 'short', bottom: '#3a6e8a', bottomType: 'trousers', shoes: '#2d2a45', accent: '#73ddff' },
  acc: {
    head(buf, p, { x0, y0 }) {
      buf.rect(x0 + 3, y0 + 10, 12, 5, '#9fe3f5'); buf.rect(x0 + 3, y0 + 10, 12, 1, '#73ddff'); buf.rect(x0 + 1, y0 + 9, 2, 1, '#9fe3f5'); buf.rect(x0 + 15, y0 + 9, 2, 1, '#9fe3f5');
      buf.disc(x0 + 9, y0 + 1, 2, '#c8d1ee'); buf.set(x0 + 9, y0 + 1, '#fff');
    },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      if (p.item === 'rest') { buf.rect(fx, fy, 2, 8, '#c8d1ee'); buf.rect(fx, fy + 8, 2, 2, '#73ddff'); }
      else { buf.rect(fx - 1, fy - 1, 9, 2, '#c8d1ee'); buf.rect(fx + 8, fy - 1, 2, 2, '#73ddff'); buf.set(fx + 10, fy, (p.f || 0) % 2 ? '#fff' : '#73ddff'); }
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(8, 38), lean: -1 }, { handF: h(6, 37), lean: -3, dy: 1 }, { handF: h(5, 36), lean: -4, dy: 1 }, { handF: h(5, 35), lean: -4, dy: 1, mouth: 'open' },
      { handF: h(8, 34), lean: -2, mouth: 'open' }, { handF: h(13, 34), lean: 1, mouth: 'open' }, { handF: h(18, 33), lean: 4, mouth: 'open' }, { handF: h(17, 33), lean: 3 }, { handF: h(13, 37), lean: 1, item: 'rest' }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 4 && f <= 7) { for (let k = 0; k < 8; k++) { const a = f * 1.3 + k * 0.8; buf.set(CX + 21 + Math.cos(a) * (3 + k * 0.6), 33 + Math.sin(a) * (3 + k * 0.6), k % 2 ? '#fff' : '#fff6a8'); } }
      if (f === 6) bmp(buf, TOOTH, 52, 20, '#fff');
      if (f === 7) bmp(buf, TOOTH, 54, 18, '#73ddff');
    },
  },
});

// ---------- Sound Wave (Music): bass guitar ----------
const music = base({
  id: 'music', name: 'sound_wave', title: 'Sound Wave', faculty: 'MUSIC', folder: 'music/sound_wave', skillMode: 'every3', attackStyle: 'strum',
  look: { ...STUDENT, hair: '#d34bf0', hairStyle: 'spiky', bottom: '#3a2a5a', bottomType: 'trousers', shoes: '#2d2a45', accent: '#ed7aff' },
  acc: {
    body(buf, p, { tx, ty }) {
      buf.line(CX - 6 + tx, 32 + ty, CX + 5 + tx, 44 + ty, '#27345f', 1); // strap
      buf.line(CX - 10 + tx, 46 + ty, CX + 12 + tx, 34 + ty, '#6b4a2a', 2); // neck
      buf.shape(CX - 6 + tx, 41 + ty, [[1, 8], [0, 10], [0, 10], [1, 8], [2, 6]], '#ed7aff'); buf.rect(CX - 3 + tx, 43 + ty, 3, 1, '#9a2fb0'); buf.set(CX - 1 + tx, 44 + ty, '#fff');
      buf.rect(CX + 11 + tx, 32 + ty, 3, 3, '#9a2fb0');
    },
    head(buf, p, { x0, y0 }) { buf.rect(x0 + 18, y0 + 10, 1, 3, '#ffd45a'); },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(8, 38), lean: -1 }, { handF: h(8, 36), lean: -2 }, { handF: h(14, 22), lean: -3, headDy: -1 }, { handF: h(16, 18), lean: -4, headDy: -1, mouth: 'open' },
      { handF: h(14, 24), lean: -3, mouth: 'open' }, { handF: h(10, 36), lean: -2, mouth: 'open', dy: 1 }, { handF: h(12, 44), lean: 1, mouth: 'open', dy: 1 }, { handF: h(14, 22), lean: -2 },
      { handF: h(10, 40), lean: 0 }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      for (let k = 0; k < 3; k++) { const r = (f * 3 + k * 6) % 20 + 4; if (f >= 3) { for (let a = -0.9; a <= 0.9; a += 0.25) buf.set(CX + 14 + Math.cos(a) * r, 38 + Math.sin(a) * r, k % 2 ? '#ed7aff' : '#ffd1ff'); } }
      if (f >= 2 && f <= 8) bmp(buf, NOTE, 40 + (f % 3) * 5, 20 - f, '#ffd1ff');
      if (f >= 4 && f <= 8) bmp(buf, NOTE, 18 + (f % 2) * 4, 16 - (f % 4), '#ed7aff');
    },
  },
});

// ---------- Ace Runner (Sports Science): headband, sprint ----------
const runner = base({
  id: 'runner', name: 'ace_runner', title: 'Ace Runner', faculty: 'SC2', folder: 'sports/ace_runner', skillMode: 'onDeploy', attackStyle: 'thrust',
  look: { ...STUDENT, shirt: '#ff9c52', shirtShade: '#d9783a', hair: '#c0682a', hairStyle: 'ponytail', bottom: '#2d5a9a', bottomType: 'trousers', shoes: '#ffffff', accent: '#ffffff' },
  acc: {
    head(buf, p, { x0, y0 }) { buf.rect(x0, y0 + 4, 18, 2, '#ff4a4a'); buf.rect(x0 + 16, y0 + 5, 4, 2, '#ff4a4a'); },
    hand(buf, p, { fx, fy }) { buf.rect(R(fx) - 1, R(fy) - 2, 3, 2, '#ff4a4a'); },
  },
  skill: {
    pose: (f) => [
      { dy: 1, lean: -1, handF: h(5, 40), handB: h(-6, 38) }, { dy: 2, lean: -2, handF: h(4, 41), handB: h(-7, 38), footL: [-8, 0], footR: [6, 0] },
      { dy: 2, lean: -3, handF: h(3, 42), handB: h(-8, 36), footL: [-9, 0], footR: [7, 0] }, { dy: 1, lean: 3, handF: h(-4, 38), handB: h(12, 34), footL: [-9, 2], footR: [8, 0] },
      { dy: 0, lean: 5, handF: h(-6, 36), handB: h(14, 32), footL: [-10, 3], footR: [9, 0], mouth: 'open' }, { dy: 0, lean: 6, handF: h(-7, 36), handB: h(15, 33), footL: [-6, 0], footR: [8, 3], mouth: 'open' },
      { dy: 0, lean: 7, handF: h(-8, 35), handB: h(16, 33), footL: [-7, 3], footR: [9, 0], mouth: 'open' }, { dy: 0, lean: 4, handF: h(-4, 38), handB: h(13, 35), footL: [-5, 0], footR: [6, 2] },
      { dy: 0, lean: 2, handF: h(8, 39), handB: h(-8, 40) }, { handF: h(9, 41), handB: h(-9, 41) },
    ][f],
    fx(buf, f) {
      if (f >= 3 && f <= 8) {
        const ghost = buf.shifted(-9, 0); ghost.fade(0.45); buf.under(ghost);
        for (let k = 0; k < 5; k++) buf.rect(2 + ((k * 7 + f * 5) % 14), 24 + k * 6, 10 + (k % 3) * 3, 1, k % 2 ? '#fff' : '#ffd2a8');
      }
    },
  },
});

// ---------- Global Exchange (MUIC): blazer, globe ----------
const global = base({
  id: 'global', name: 'global_exchange', title: 'Global Exchange', faculty: 'MUIC', folder: 'muic/global_exchange', skillMode: 'onDeploy', attackStyle: 'cast',
  look: { ...STUDENT, hair: '#d9a84a', hairStyle: 'bob', bottom: '#2f3a5a', bottomType: 'skirt', shoes: '#2d2a45', accent: '#69aaff' },
  acc: {
    body(buf, p, { tx, ty }) {
      buf.rect(CX - 8 + tx, 33 + ty, 4, 11, '#2f5aa8'); buf.rect(CX + 4 + tx, 33 + ty, 4, 11, '#2f5aa8'); buf.rect(CX - 8 + tx, 33 + ty, 2, 11, '#69aaff'); buf.set(CX + 5 + tx, 36 + ty, '#ffd45a');
    },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      const y = p.item === 'rest' ? fy - 3 : fy - 8;
      buf.disc(fx, y, 4, '#69aaff'); buf.rect(fx - 2, y - 1, 2, 2, '#6ee0a5'); buf.rect(fx + 1, y + 1, 2, 2, '#6ee0a5'); buf.rect(fx - 1, y + 4, 3, 1, '#2f5aa8');
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 38) }, { handF: h(9, 34) }, { handF: h(9, 28), headDy: -1 }, { handF: h(8, 22) }, { handF: h(8, 19), mouth: 'open' },
      { handF: h(8, 18), mouth: 'open' }, { handF: h(10, 17), lean: 1, mouth: 'open' }, { handF: h(10, 20) }, { handF: h(10, 30), item: 'rest' }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 2 && f <= 8) {
        for (let a = 0; a < Math.PI * 2; a += 0.35) { buf.set(CX + Math.cos(a + f * 0.4) * 21, 30 + Math.sin(a + f * 0.4) * 8, '#69aaff'); buf.set(CX + Math.cos(a - f * 0.3) * 9, 30 + Math.sin(a - f * 0.3) * 19, '#ffd45a'); }
      }
      if (f >= 5 && f <= 8) { buf.rect(48, 14 - (f - 5), 5, 1, '#ffd45a'); buf.rect(50, 12 - (f - 5), 1, 5, '#ffd45a'); }
    },
  },
});

// ---------- Health Guardian (Public Health): reflective vest + shield ----------
const pub = base({
  id: 'public', name: 'health_guardian', title: 'Health Guardian', faculty: 'PH', folder: 'public_health/health_guardian', skillMode: 'onPulse', attackStyle: 'thrust',
  look: { ...STUDENT, hair: '#2c8a7a', hairStyle: 'short', bottom: '#2f5a55', bottomType: 'trousers', shoes: '#2d2a45', accent: '#5acbb9' },
  acc: {
    body(buf, p, { tx, ty }) { buf.rect(CX - 7 + tx, 33 + ty, 14, 9, '#5acbb9'); buf.rect(CX - 7 + tx, 36 + ty, 14, 1, '#fff'); buf.rect(CX - 7 + tx, 39 + ty, 14, 1, '#fff'); buf.rect(CX + 5 + tx, 34 + ty, 2, 7, '#2f8f80'); },
    head(buf, p, { x0, y0 }) { buf.rect(x0 + 2, y0 - 2, 14, 3, '#2f8f80'); bmp(buf, CROSS, x0 + 6, y0 - 4, '#fff'); },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      const y = fy - 6;
      buf.shape(fx - 4, y, [[0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [1, 7], [1, 7], [2, 5], [3, 3], [4, 1]], '#5acbb9');
      buf.rect(fx - 4, y, 9, 1, '#2f8f80'); bmp(buf, CROSS, fx - 2, y + 2, '#fff');
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(10, 38), dy: 1 }, { handF: h(10, 34), dy: 1 }, { handF: h(10, 28) }, { handF: h(10, 22), headDy: -1 }, { handF: h(10, 20), mouth: 'open' },
      { handF: h(10, 24), mouth: 'open' }, { handF: h(15, 40), lean: 2, dy: 2, mouth: 'open' }, { handF: h(15, 40), lean: 1, dy: 1 }, { handF: h(12, 38), item: 'rest' }, { handF: h(9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 3 && f <= 8) { dome(buf, CX + 4, 50, Math.min(26, 8 + (f - 3) * 5), '#c8f5ee'); dome(buf, CX + 4, 50, Math.min(22, 4 + (f - 3) * 5), '#5acbb9'); }
      if (f === 6) for (let k = 0; k < 6; k++) buf.rect(10 + k * 9, 46 + (k % 2) * 4, 2, 2, '#fff');
    },
  },
});

// ---------- Angel of Care (Nursing): nurse cap, wings, clipboard ----------
const nurse = base({
  id: 'nurse', name: 'angel_of_care', title: 'Angel of Care', faculty: 'NS', folder: 'nursing/angel_of_care', skillMode: 'onPulse', attackStyle: 'cast',
  look: { ...STUDENT, shirt: '#ffe3ec', shirtShade: '#f0b6c8', hair: '#ffa3be', hairStyle: 'long', bottom: '#ffa3be', bottomType: 'skirt', shoes: '#ffffff', accent: '#d6658c' },
  acc: {
    back(buf, p, { tx, ty }) {
      const flap = p.anim === 'skill' ? [0, 1, 2, 3, 4, 3, 2, 3, 2, 1][p.f] : 0;
      buf.shape(CX - 17 + tx, 30 + ty - flap, [[3, 4], [1, 7], [0, 8], [0, 8], [1, 7], [2, 5], [4, 3]], '#e9f1ff');
      buf.shape(CX + 8 + tx, 30 + ty - flap, [[0, 4], [0, 7], [0, 8], [0, 8], [0, 7], [0, 5], [0, 3]], '#e9f1ff');
    },
    head(buf, p, { x0, y0 }) { buf.rect(x0 + 3, y0 - 4, 12, 4, '#fff'); buf.rect(x0 + 2, y0 - 1, 14, 1, '#fff'); buf.rect(x0 + 8, y0 - 3, 2, 3, '#d6658c'); buf.rect(x0 + 7, y0 - 2, 4, 1, '#d6658c'); },
    hand(buf, p, { fx, fy }) {
      fx = R(fx); fy = R(fy);
      if (p.item === 'rest') { buf.rect(fx - 3, fy - 1, 6, 8, '#fff'); buf.rect(fx - 3, fy - 1, 6, 1, '#d6658c'); buf.rect(fx - 1, fy + 2, 2, 3, '#d6658c'); }
      else bmp(buf, HEART, fx - 2, fy - 8, '#ff6b9a');
    },
  },
  skill: {
    pose: (f) => seq({ item: 'use' }, [
      { handF: h(9, 36), handB: h(-9, 36) }, { handF: h(11, 30), handB: h(-11, 30) }, { handF: h(13, 24), handB: h(-13, 24), headDy: -1 }, { handF: h(14, 20), handB: h(-14, 20), headDy: -1 },
      { handF: h(14, 17), handB: h(-14, 17), mouth: 'open', headDy: -1 }, { handF: h(13, 16), handB: h(-13, 16), mouth: 'open', headDy: -2 }, { handF: h(15, 18), handB: h(-15, 18), mouth: 'open', headDy: -1 },
      { handF: h(13, 24), handB: h(-13, 24) }, { handF: h(11, 32), handB: h(-11, 32), item: 'rest' }, { handF: h(9, 41), handB: h(-9, 41), item: 'rest' },
    ])[f],
    fx(buf, f) {
      if (f >= 3 && f <= 9) for (let k = 0; k < 4; k++) bmp(buf, HEART, 8 + k * 14, 28 - ((f * 3 + k * 5) % 22), k % 2 ? '#ff6b9a' : '#ffd1e0');
      if (f >= 5 && f <= 8) buf.ring(CX, 30, (f - 4) * 6, '#ffd1e0');
    },
  },
});

// ---------- Dog (summoned by Animal Keeper): custom small rig ----------
function dogFrame(anim, f) {
  const buf = new PixBuf();
  const FUR = '#c98a4a', DARK = '#8a5a2a', BELLY = '#f0d2a0', EYE = '#1a2342', TONGUE = '#ff9aa8', COLLAR = '#8de7ac';
  let dx = 0, dy = 0, tail = 0, open = false, bark = false, eyes = 'open', flash = false, fade = 0, dead = false;
  let legs = [0, 0, 0, 0]; // lifts for back-left, back-right, front-left, front-right
  if (anim === 'idle') { dy = [0, 0, 1, 0][f]; tail = [0, 2, 0, -2][f]; }
  else if (anim === 'walk') { dy = f % 3 === 0 ? 0 : -1; tail = f % 2 ? 2 : -2; legs = f < 3 ? [0, 3, 3, 0] : [3, 0, 0, 3]; if (f % 3 === 1) legs = [0, 1, 1, 0]; }
  else if (anim === 'attack') { dx = [0, -2, 2, 6, 4, 0][f]; open = f >= 2 && f <= 4; tail = 3; dy = f === 3 ? -2 : 0; }
  else if (anim === 'skill') { dx = [0, 0, 1, 1, 2, 2, 1, 1, 0, 0][f]; dy = [0, -1, -2, -3, -2, -3, -2, -1, 0, 0][f]; bark = f >= 3 && f <= 7; open = bark; tail = f % 2 ? 3 : -2; }
  else if (anim === 'hurt') { dx = [-2, -3, -1][f]; flash = f === 0; eyes = 'hurt'; open = true; }
  else if (anim === 'death') { dx = -[1, 2, 3, 3, 3, 3][f]; dy = [1, 3, 6, 8, 8, 8][f]; legs = [0, 0, 4, 6, 6, 6]; eyes = 'x'; flash = f === 0; fade = [0, 0, 0, 0, 0.45, 0.9][f]; dead = f >= 2; }
  const bx = CX - 8 + dx, by = 42 + dy;
  // tail
  buf.line(bx - 1, by + 1, bx - 5, by - 3 + tail, FUR, 2);
  // body + belly
  buf.shape(bx, by, [[1, 14], [0, 16], [0, 16], [0, 16], [1, 14], [2, 12]], FUR); buf.rect(bx + 3, by + 4, 9, 2, BELLY);
  // legs (feet bottom row 54)
  const footY = (lift) => 54 - lift;
  [[bx + 1, legs[0]], [bx + 5, legs[1]], [bx + 10, legs[2]], [bx + 14, legs[3]]].forEach(([x, lift], i) => {
    const top = by + 5, fy = footY(dead ? lift : lift);
    buf.rect(x, top, 3, Math.max(1, fy - top), i < 2 ? DARK : FUR);
  });
  // head
  const hx = bx + 12, hy = by - 6 + (bark ? -2 : 0);
  buf.shape(hx, hy, [[1, 8], [0, 10], [0, 10], [0, 10], [0, 10], [1, 8]], FUR);
  buf.rect(hx + 8, hy + 3, 5, 4, BELLY); buf.rect(hx + 12, hy + 3, 2, 2, EYE);
  buf.rect(hx, hy - 3, 3, 4, DARK); buf.rect(hx + 7, hy - 2, 2, 3, DARK);
  buf.rect(hx + 2, hy + 6, 7, 1, COLLAR);
  if (eyes === 'open') { buf.rect(hx + 5, hy + 2, 2, 2, EYE); buf.set(hx + 5, hy + 2, '#fff'); }
  else if (eyes === 'hurt') { buf.set(hx + 5, hy + 2, EYE); buf.set(hx + 6, hy + 3, EYE); buf.set(hx + 6, hy + 2, EYE); buf.set(hx + 5, hy + 3, EYE); }
  else { buf.set(hx + 5, hy + 2, EYE); buf.set(hx + 6, hy + 3, EYE); buf.set(hx + 6, hy + 2, EYE); buf.set(hx + 5, hy + 3, EYE); }
  if (open) { buf.rect(hx + 8, hy + 7, 4, 2, TONGUE); buf.rect(hx + 8, hy + 6, 4, 1, EYE); }
  if (flash) buf.flash('#ffffff');
  buf.outline('#1a1d33');
  if (fade) buf.fade(fade);
  if (bark) { bmp(buf, NOTE, hx + 15, hy - 8 - (f % 2), '#8de7ac'); }
  return buf;
}
const dog = {
  id: 'dog', name: 'dog', title: 'Companion Dog', faculty: 'VS', folder: 'veterinary/dog', skillMode: 'none', impact: { attack: 3, skill: 5 },
  look: {}, custom: dogFrame, skill: { fx: null },
};

module.exports = { mecha, lab, night, chem, animal, dental, music, runner, global, public: pub, nurse, dog };
