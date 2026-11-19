const { renderFrame } = require('./rig');
const { COUNTS, poseFor } = require('./anims');

// tiny sparkle puff used on the last death frame
function sparkles(buf) {
  const c = '#ffffff';
  [[28, 40], [36, 44], [32, 36], [24, 46], [40, 38], [30, 48]].forEach(([x, y]) => {
    buf.set(x, y, c); buf.set(x - 1, y, c); buf.set(x + 1, y, c); buf.set(x, y - 1, c); buf.set(x, y + 1, c);
  });
}

function generateCharacter(def) {
  const anims = {};
  for (const anim of Object.keys(COUNTS)) {
    anims[anim] = [];
    for (let f = 0; f < COUNTS[anim]; f++) {
      const buf = def.custom ? def.custom(anim, f) : renderFrame(def, { ...poseFor(def, anim, f), f, anim });
      if (anim === 'skill' && def.skill && def.skill.fx) def.skill.fx(buf, f);
      if (anim === 'attack' && def.attackFx) def.attackFx(buf, f);
      if (anim === 'death' && f === 5) sparkles(buf);
      anims[anim].push(buf);
    }
  }
  return { anims };
}

module.exports = { generateCharacter };
