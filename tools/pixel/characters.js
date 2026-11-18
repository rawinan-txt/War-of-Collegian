// Character definitions. The game's code roster is the source of truth for ids/names.
const { CX } = require('./rig');
const { glyph } = require('./buf');

const { h, STUDENT, bmp, HEART, NOTE, CROSS, TOOTH, cog, dome, seq } = require('./helpers');

const bug = {
  id: 'bug', name: 'bug_hunter', title: 'Bug Hunter', faculty: 'ICT', folder: 'ict/bug_hunter',
  skillMode: 'onStack', impact: { attack: 3, skill: 6 }, attackStyle: 'shoot',
  look: { ...STUDENT, hair: '#232a4a', hairStyle: 'spiky', bottom: '#27345f', bottomType: 'trousers', shoes: '#2d2a45', accent: '#35b8ff' },
  acc: {
    // ICT backpack
    back(buf, p, { tx, ty }) {
      buf.rect(CX - 13 + tx, 33 + ty, 6, 10, '#27345f');
      buf.rect(CX - 12 + tx, 34 + ty, 4, 2, '#1c6fa8');
    },
    // headphones
    head(buf, p, { x0, y0 }) {
      const band = '#27345f', cup = '#35b8ff', cupDark = '#1c6fa8';
      buf.line(x0 - 1, y0 + 8, x0 - 1, y0 + 2, band, 1);
      buf.line(x0 - 1, y0 + 2, x0 + 3, y0 - 2, band, 1);
      buf.line(x0 + 3, y0 - 2, x0 + 14, y0 - 2, band, 1);
      buf.line(x0 + 14, y0 - 2, x0 + 18, y0 + 2, band, 1);
      buf.line(x0 + 18, y0 + 2, x0 + 18, y0 + 8, band, 1);
      buf.rect(x0 - 3, y0 + 7, 3, 6, cup); buf.rect(x0 - 3, y0 + 7, 3, 1, cupDark);
      buf.rect(x0 + 18, y0 + 7, 3, 6, cup); buf.rect(x0 + 18, y0 + 7, 3, 1, cupDark);
    },
    // laptop
    hand(buf, p, { fx, fy }) {
      const dark = '#2a3050', base = '#8a93b8', screen = '#35b8ff', code = '#bff3ff';
      fx = Math.round(fx); fy = Math.round(fy);
      if (p.item === 'rest') {
        buf.rect(fx - 4, fy - 1, 9, 3, dark);
        buf.set(fx, fy, screen);
        return;
      }
      buf.rect(fx - 5, fy, 11, 2, base);
      buf.rect(fx - 4, fy - 9, 10, 9, dark);
      buf.rect(fx - 3, fy - 8, 8, 7, screen);
      for (let r = 0; r < 3; r++) buf.rect(fx - 2, fy - 7 + r * 2, 2 + ((p.f + r * 2) % 4), 1, code);
    },
  },
  skill: {
    pose(f) {
      const base = { item: 'open', handB: h(-11, 36) };
      return [
        { dy: 1, handF: h(9, 38) },
        { dy: 2, handF: h(9, 36), mouth: 'open' },
        { handF: h(10, 28), headDy: -1 },
        { handF: h(10, 22), headDy: -1, mouth: 'open' },
        { handF: h(10, 18), headDy: -1, mouth: 'open' },
        { handF: h(10, 17), headDy: -2, mouth: 'open' },
        { handF: h(15, 22), lean: 2, mouth: 'open', headDx: 1 },
        { handF: h(14, 26), lean: 1 },
        { handF: h(12, 32) },
        { handF: h(10, 38), item: 'rest', handB: h(-9, 41) },
      ].map((o) => ({ ...base, ...o }))[f];
    },
    // pixel code orbiting the student, then a code beam on the impact frame
    fx(buf, f) {
      if (f >= 1 && f <= 8) {
        for (let k = 0; k < 6; k++) {
          const ang = f * 0.55 + (k * Math.PI * 2) / 6;
          const x = Math.round(CX + Math.cos(ang) * 19) - 1, y = Math.round(28 + Math.sin(ang) * 10) - 2;
          glyph(buf, (k + f) % 2, x, y, k % 2 ? '#7fe3ff' : '#bff3ff');
        }
      }
      if (f >= 3 && f <= 6) buf.ring(CX, 30, (f - 2) * 4, '#7fe3ff');
      if (f === 6) { buf.rect(46, 21, 18, 3, '#bff3ff'); buf.rect(44, 22, 4, 1, '#7fe3ff'); }
      if (f === 7) buf.rect(48, 22, 10, 1, '#7fe3ff');
    },
  },
  attackFx(buf, f) {
    if (f === 3 || f === 4) { glyph(buf, f % 2, 50, 24, '#bff3ff'); buf.rect(54, 28, 2, 2, '#7fe3ff'); buf.rect(58, 26, 2, 2, '#bff3ff'); }
  },
};

const CHARACTERS = { bug, ...require('./roster') };

module.exports = { CHARACTERS, STUDENT };
