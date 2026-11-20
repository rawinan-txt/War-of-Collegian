// Per-enemy rig data: how the approved drawing is split into parts, and the pose recipe of every animation.
// Frame counts / fps follow the heroes: idle 4 @6, walk 6 @12, attack 6 @12 (impact on frame 3), hurt 3 @12, death 6 @10, skill 10 @14 (impact on frame 6).
// Bosses may use a longer death. All recipes are plain data + tiny functions: add an enemy by adding an entry here.
const A = require('./art');
const { bits } = require('./rig');
const P = A.PALETTE;

const COUNTS = { idle: 4, walk: 6, attack: 6, hurt: 3, death: 6, skill: 10 };
const FPS = { idle: 6, walk: 12, attack: 12, hurt: 12, death: 10, skill: 14 };
const REPEAT = { idle: -1, walk: -1, attack: 0, hurt: 0, death: 0, skill: 0 };

const sin = (f, n, a) => Math.round(a * Math.sin((2 * Math.PI * f) / n));
const at = (arr, f) => arr[Math.min(f, arr.length - 1)];
const legsWalk = (f, amp = 2) => {
  const s = Math.sin((2 * Math.PI * f) / 6), c = Math.cos((2 * Math.PI * f) / 6);
  return { lx: Math.round(amp * s), rx: Math.round(-amp * s), ly: c > 0.4 ? -1 : 0, ry: c < -0.4 ? -1 : 0 };
};
const part = (o) => o; // readability only

// ------------------------------------------------------------------ generic death (squash + dither fade + debris + persistent ground bits)
function deathPose(f, D) {
  const SQ = D.sq || [1, 0.9, 0.76, 0.58, 0.38, 0.2], n = SQ.length;
  const FADE = D.fade || [0, 0, 0.1, 0.28, 0.5, 0.78];
  const SHAKE = [0, -2, 2, -1, 0, 0];
  const p = { squash: SQ[Math.min(f, n - 1)], dx: SHAKE[Math.min(f, 5)], fade: f >= 2 ? FADE[Math.min(f, FADE.length - 1)] : 0, bits: [], parts: {} };
  if (f === 0) p.flash = D.flash || '#ffffff';
  if (D.flicker && f % 2 === 1 && f < n - 1) p.tint = { color: D.flicker, a: 0.55 };
  if (D.keep) { p.keep = D.keep; p.parts = {}; for (const k of D.keep) p.parts[k] = { x: 0, y: Math.min(f, 3) * (D.drop || 1) }; }
  if (D.spread) for (const [k, dx] of Object.entries(D.spread)) p.parts[k] = { x: dx * f, y: Math.round(f * (D.spreadY || 0)) };
  const col = D.colors, count = D.n || 14;
  for (let k = 0; k < count; k++) {
    const c = col[k % col.length];
    if (D.kind === 'rise') {
      const x = 32 + ((k * 11) % 27) - 13, y = 44 - Math.round(f * (3 + (k % 4)) * 1.3);
      if (y > 2 && f >= 1) p.bits.push(bits.px(x, y, c, k % 3 === 0 ? 2 : 1, k % 3 === 0 ? 2 : 1));
    } else {
      const vx = ((k * 7 + 3) % 9) - 4, vy = -(3 + ((k * 5) % 5));
      const x = Math.round(32 + vx * f * (D.spreadX || 1.7)), y = Math.min(52, Math.round(36 + vy * f * 1.3 + 1.2 * f * f));
      if (f >= 1 && x > 0 && x < 62) p.bits.push(D.kind === 'pix' ? bits.px(x, y, c, 2, 2) : bits.px(x, y, c, 4, 3));
    }
  }
  if (D.ring && f >= 1) p.bits.push(bits.ring(32, 36, 5 + f * 5, D.ring));
  if (D.ground && f >= 3) for (const g of D.ground) p.bits.push(bits.px(g[0], g[1], g[4], g[2], g[3]));
  return p;
}

// ------------------------------------------------------------------ generic skill cast: arms up, head lift, rings / risers / tint pulses
function skillPose(f, S) {
  const up = at(S.arm, f);
  const p = { parts: { armL: { x: 0, y: up }, armR: { x: 0, y: up } }, dy: at(S.dy || [], f) || 0, bits: [], lean: 0 };
  if (S.prop) p.parts[S.prop] = { x: 0, y: up };
  if (S.head) p.parts.head = { x: 0, y: Math.max(0, at(S.head, f)) };
  if (S.tint && S.tint.frames.includes(f)) p.tint = { color: S.tint.color, a: S.tint.a, parts: S.tint.parts };
  if (f >= 3 && f <= 9) {
    p.bits.push(bits.ring(32, S.ringY || 32, 6 + (f - 3) * (S.ringStep || 3), S.ring));
    if (S.ring2 && f >= 5) p.bits.push(bits.ring(32, S.ringY || 32, 3 + (f - 5) * (S.ringStep || 3), S.ring2));
  }
  if (S.risers) for (let k = 0; k < 5; k++) {
    const x = 14 + k * 9 + ((k * 3) % 4), y = 40 - f * (2 + (k % 3)) - k;
    if (f >= 1 && y > 3) p.bits.push(S.risers.kind === 'paper' ? bits.paper(x, y) : bits.px(x, y, S.risers.color, 2, 2));
  }
  if (S.ground && f >= 4 && f <= 8) { const w = (f - 3) * 5; p.bits.push(bits.px(32 - w, 54, S.ground, w * 2, 1)); }
  if (f === 6 && S.burst) p.bits.push(bits.spark(S.burst[0], S.burst[1], S.burst[2]));
  return p;
}

// ------------------------------------------------------------------ the nine rigs
const RIGS = {};

// ---- Assignment Monster: paper stack trembles / bounces / throws a sheet / scatters / collapses into loose papers
RIGS.assignment = {
  draw: A.drawAssignment,
  spec: { parts: { head: [[15, 12, 50, 29]], armL: [[9, 43, 15, 50]], armR: [[49, 35, 57, 46]] }, legs: [18, 51, 46, 63] },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { head: { x: at([0, 1, 0, -1], f), y: 0 }, armR: { x: 0, y: at([0, -1, 0, 0], f) } }, dy: at([0, 0, -1, 0], f) };
    if (anim === 'walk') return { dy: at([0, -2, 0, 0, -2, 0], f), lean: 1, legs: legsWalk(f, 3), parts: { head: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) }, armR: { x: 0, y: at([0, -1, 0, 0, -1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 2, 2, 0], f), parts: { head: { x: at([-1, -2, -3, 2, 3, 0], f), y: at([0, 0, 0, 1, 1, 0], f) }, armR: { x: at([0, -1, -2, 3, 3, 0], f), y: at([0, -3, -5, -1, 0, 0], f) } }, dy: at([0, 0, 0, 0, 0, 0], f), bits: [] };
      if (f >= 3) p.bits.push(bits.paper(49 + (f - 3) * 4, 26 + (f - 3)));
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, dx: at([-2, -3, -1], f), bits: [bits.paper(8 - f * 2, 16 + f * 4), bits.paper(54 + f * 2, 14 + f * 5), bits.paper(4, 30 + f * 4)].slice(f === 0 ? 1 : 0) };
    return deathPose(f, { colors: ['#f6f2e8', '#d8d1be', '#8c94bd', '#ff6fa6', '#ffd23a'], n: 16, ground: [[16, 52, 8, 2, '#f6f2e8'], [27, 53, 7, 2, '#d8d1be'], [38, 52, 9, 2, '#f6f2e8'], [22, 54, 5, 1, '#8c94bd'], [43, 54, 5, 1, '#ff6fa6']] });
  },
  anchors: { muzzle: [40, -10] },
};

// ---- Deadline Monster: alarm clock shakes / rapid bounce / launches warning symbols / flashes red / calendar falls apart
RIGS.deadline = {
  draw: A.drawDeadline,
  spec: { parts: { head: [[21, 14, 43, 28]], armL: [[6, 39, 12, 46]], armR: [[53, 35, 60, 42]] }, legs: [16, 51, 48, 63] },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { head: { x: at([0, 1, -1, 1], f), y: at([0, 0, 1, 0], f) } }, bits: f % 2 ? [bits.px(19, 15, '#ffffff'), bits.px(18, 17, '#ffffff'), bits.px(44, 15, '#ffffff'), bits.px(45, 17, '#ffffff')] : [] };
    if (anim === 'walk') return { dy: at([0, -3, 0, 0, -3, 0], f), lean: 2, legs: legsWalk(f, 3), parts: { head: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -3, 2, 3, 0], f), parts: { head: { x: 0, y: at([0, 0, 1, 0, 0, 0], f) } }, dx: at([0, -1, -2, 1, 2, 0], f), bits: [] };
      if (f >= 3) p.bits.push(bits.bang(50 + (f - 3) * 4, 30 - (f - 3)));
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, tint: f === 1 ? undefined : { color: '#ff2b3e', a: 0.6, parts: ['head', 'torso'] }, dx: at([-2, -3, -1], f) };
    return deathPose(f, { colors: ['#f6f2e8', '#e0334a', '#8c94bd', '#ffcf3a', '#f6f2e8'], n: 18, ground: [[14, 52, 9, 2, '#f6f2e8'], [27, 53, 8, 2, '#e0334a'], [39, 52, 9, 2, '#f6f2e8'], [24, 54, 6, 1, '#8c94bd']] });
  },
  anchors: { muzzle: [36, -26] },
};

// ---- Group Project Gang: students argue / move together / coordinated laptop attack / recoil / scatter
RIGS.group = {
  draw: A.drawGroup,
  spec: { parts: { flag: [[33, 14, 52, 36]], lapL: [[8, 41, 25, 50]], lapR: [[38, 41, 56, 50]], stuL: [[8, 25, 26, 50]], stuR: [[38, 25, 56, 50]] }, legs: [9, 51, 54, 63], legSplit: 31 },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { stuL: { x: at([0, 0, 1, 0], f), y: at([0, -1, 0, 0], f) }, torso: { x: 0, y: at([0, 0, -1, 0], f) }, stuR: { x: 0, y: at([0, 0, 0, -1], f) }, lapL: { x: 0, y: at([0, -1, 0, 0], f) }, lapR: { x: 0, y: at([0, 0, 0, -1], f) }, flag: { x: at([0, 1, 0, -1], f), y: 0 } } };
    if (anim === 'walk') {
      const b = (k) => at(k === 0 ? [0, -2, 0, 0, -2, 0] : k === 1 ? [0, 0, -2, 0, 0, -2] : [-2, 0, 0, -2, 0, 0], f);
      return { legs: legsWalk(f, 2), parts: { stuL: { x: 0, y: b(0) }, lapL: { x: 0, y: b(0) }, torso: { x: 0, y: b(1) }, flag: { x: sin(f, 6, 1), y: b(1) }, stuR: { x: 0, y: b(2) }, lapR: { x: 0, y: b(2) } } };
    }
    if (anim === 'attack') {
      const L = at([0, -1, -2, -3, -1, 0], f), X = at([0, -1, -2, 2, 2, 0], f), p = { parts: { lapL: { x: X, y: L }, lapR: { x: X, y: L }, stuL: { x: X, y: 0 }, stuR: { x: X, y: 0 }, torso: { x: X, y: 0 }, flag: { x: X, y: at([0, 0, -1, -2, -1, 0], f) } }, bits: [] };
      if (f >= 3) { p.bits.push(bits.px(18, 42 + L, '#ffffff', 6, 2), bits.px(44, 42 + L, '#ffffff', 6, 2)); }
      if (f >= 4) { p.bits.push(bits.px(52, 44, '#58b8ff', 8, 2), bits.px(58, 41, '#58b8ff', 4, 1)); }
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, parts: { stuL: { x: at([-3, -4, -1], f), y: 0 }, torso: { x: at([-2, -3, -1], f), y: 0 }, stuR: { x: at([-1, -2, 0], f), y: at([0, -1, 0], f) }, lapL: { x: at([-3, -4, -1], f), y: 0 }, lapR: { x: at([-1, -2, 0], f), y: 0 } } };
    return deathPose(f, { colors: ['#58b8ff', '#aeb7d6', '#2b2447', '#e0334a'], n: 8, kind: 'pix', spread: { stuL: -3, lapL: -3, stuR: 3, lapR: 3, flag: 1 }, spreadY: 0 });
  },
  anchors: { muzzle: [48, -8] },
};

// ---- Midterm Exam: pencil rotates / paper hops / pencil thrust / crumples / tears
RIGS.quiz = {
  draw: A.drawMidterm,
  spec: { parts: { prop: [[30, 34, 61, 41]], armL: [[9, 37, 14, 42]] }, legs: [14, 51, 37, 63], legSplit: 26 },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { prop: { x: at([0, 0, 1, 0], f), y: at([0, -1, 0, 1], f) } }, dy: at([0, 0, -1, 0], f) };
    if (anim === 'walk') return { dy: at([0, -3, 0, 0, -3, 0], f), lean: 1, legs: legsWalk(f, 2), parts: { prop: { x: 0, y: at([0, -1, 0, 0, -1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 1, 2, 0], f), parts: { prop: { x: at([0, -3, -5, 3, 6, 2], f), y: at([0, 0, 1, 0, 0, 0], f) } }, bits: [] };
      if (f >= 3) p.bits.push(bits.px(60, 36, '#2b2b3a', 3, 1), bits.px(62, 39, '#2b2b3a', 2, 1));
      if (f === 4) p.bits.push(bits.spark(61, 37, '#ffffff'));
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, squash: at([0.9, 0.82, 0.94], f), dx: at([-2, -3, -1], f), parts: { prop: { x: at([-1, -2, 0], f), y: 0 } } };
    return deathPose(f, { colors: ['#f6f2e8', '#d8d1be', '#b3122c', '#ffcf3a', '#f6f2e8'], n: 20, ground: [[14, 52, 7, 2, '#f6f2e8'], [24, 53, 8, 2, '#d8d1be'], [36, 52, 6, 2, '#b3122c'], [46, 53, 9, 1, '#ffcf3a']] });
  },
  anchors: { muzzle: [52, -10] },
};

// ---- Final Exam (boss): crown + paper move / heavy advance / slam / rain cast / crown shake / paper explosion
RIGS.final = {
  draw: A.drawFinal,
  spec: { parts: { head: [[13, 13, 51, 27]], armL: [[3, 29, 14, 38]], armR: [[50, 29, 61, 38]] }, legs: [14, 52, 49, 63], legSplit: 31 },
  boss: true,
  recipe(anim, f) {
    if (anim === 'idle') return { dy: at([0, 0, -1, 0], f), parts: { head: { x: at([0, 0, 1, 0], f), y: at([0, 1, 0, 0], f) }, armL: { x: 0, y: at([0, -1, 0, -1], f) }, armR: { x: 0, y: at([0, 0, -1, 0], f) } }, bits: f % 2 ? [bits.spark(20, 14, '#fff0a0'), bits.spark(44, 13, '#fff0a0')] : [] };
    if (anim === 'walk') return { dy: at([0, -2, 0, 0, -2, 0], f), legs: legsWalk(f, 2), parts: { head: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) }, armL: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) } } };
    if (anim === 'attack') {
      const p = { squash: at([1, 1, 1, 0.93, 0.97, 1], f), parts: { armL: { x: at([0, -1, -2, 1, 1, 0], f), y: at([0, -4, -7, 3, 2, 0], f) }, armR: { x: at([0, 1, 2, 3, 2, 0], f), y: at([0, -4, -7, 3, 2, 0], f) }, head: { x: 0, y: at([0, 0, 0, 1, 0, 0], f) } }, bits: [] };
      if (f >= 3) for (let k = 0; k < 3; k++) p.bits.push(bits.paper(46 + (f - 3) * 5 + k * 2, 38 + k * 4 - (f - 3) * 2));
      return p;
    }
    if (anim === 'skill') {
      const p = skillPose(f, { arm: [-2, -5, -8, -9, -9, -9, -9, -7, -3, 0], head: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], ring: '#e0334a', ring2: '#ffcf3a', ringStep: 4, tint: { frames: [4, 5, 6, 7], color: '#ff3b3b', a: 0.3 }, ground: '#e0334a' });
      for (let k = 0; k < 4; k++) { const y = 20 - f * (1 + (k % 2)) - k * 2; if (y > 1) p.bits.push(bits.paper(14 + k * 12, y)); }
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, dx: at([-1, -1, 0], f), parts: { head: { x: at([-2, 2, -1], f), y: 0 } } };
    return deathPose(f, { sq: [1, 0.94, 0.82, 0.66, 0.5, 0.3, 0.22, 0.16], fade: [0, 0, 0.08, 0.2, 0.36, 0.52, 0.68, 0.84], colors: ['#f6f2e8', '#ffcf3a', '#e0334a', '#d8d1be', '#fff0a0'], n: 28, spreadX: 2.1, ring: '#ffcf3a', ground: [[8, 52, 9, 2, '#f6f2e8'], [24, 53, 10, 2, '#d8d1be'], [42, 52, 10, 2, '#f6f2e8'], [18, 54, 7, 1, '#e0334a'], [50, 53, 6, 2, '#ffcf3a']] });
  },
  anchors: { muzzle: [96, -60] },
};

// ---- Strict Professor: adjusts glasses / walks with authority / throws a red pen / reacts angrily / drops the grade sheet
RIGS.professor = {
  draw: A.drawProfessor,
  spec: { parts: { pen: [[41, 18, 61, 44]], armL: [[8, 36, 21, 53]], head: [[19, 8, 45, 35]] }, legs: [24, 48, 40, 63] },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { head: { x: 0, y: at([0, 0, 1, 0], f) }, pen: { x: 0, y: at([0, 0, -1, 0], f) } }, bits: f === 1 ? [bits.px(27, 24, '#ffffff', 2, 1)] : f === 2 ? [bits.px(37, 24, '#ffffff', 2, 1)] : [] };
    if (anim === 'walk') return { dy: at([0, -1, 0, 0, -1, 0], f), legs: legsWalk(f, 2), parts: { pen: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) }, armL: { x: 0, y: at([0, -1, 0, 0, -1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 1, 1, 0], f), parts: { pen: { x: at([0, -3, -5, 3, 5, 1], f), y: at([0, -3, -6, -2, 0, 0], f) }, head: { x: at([0, -1, -1, 1, 1, 0], f), y: 0 } }, bits: [] };
      if (f >= 3) p.bits.push(bits.pen(50 + (f - 3) * 5, 30 - (f - 3) * 2));
      return p;
    }
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, tint: f === 1 ? { color: '#ff3b3b', a: 0.28, parts: ['head'] } : undefined, dx: at([-2, -3, -1], f), parts: { head: { x: 0, y: at([0, 1, 0], f) } } };
    return deathPose(f, { colors: ['#ffffff', '#ffd23a', '#8c94bd'], n: 8, kind: 'pix', fade: [0, 0.1, 0.3, 0.5, 0.72, 0.92], sq: [1, 0.96, 0.88, 0.76, 0.6, 0.45], ground: [[19, 51, 9, 3, '#f6f2e8'], [21, 52, 5, 1, '#e0334a']] });
  },
  anchors: { muzzle: [36, -14] },
};

// ---- Ruthless TA: adjusts the stack / runs with papers / throws graded assignments / supports allies / papers fall / drops the stack
RIGS.ta = {
  draw: A.drawTA,
  spec: { parts: { stack: [[18, 36, 53, 51]], head: [[18, 1, 47, 35]] }, legs: [22, 52, 43, 63] },
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { stack: { x: at([0, 0, 1, 0], f), y: at([0, -1, 0, 0], f) }, head: { x: 0, y: at([0, 0, 1, 0], f) } } };
    if (anim === 'walk') return { dy: at([0, -3, 0, 0, -3, 0], f), lean: 3, legs: legsWalk(f, 4), parts: { stack: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 2, 2, 0], f), parts: { stack: { x: at([0, -2, -3, 2, 3, 0], f), y: at([0, -1, -2, 0, 1, 0], f) }, head: { x: at([0, -1, -1, 1, 1, 0], f), y: 0 } }, bits: [] };
      if (f >= 3) p.bits.push(bits.gradedPaper(50 + (f - 3) * 5, 36 - (f - 3)));
      return p;
    }
    if (anim === 'skill') return skillPose(f, { arm: [0, -2, -5, -8, -9, -9, -8, -6, -3, 0], prop: 'stack', ring: '#52d49a', ring2: '#ffd23a', ringY: 30, ringStep: 3, risers: { kind: 'pix', color: '#52d49a' } });
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, dx: at([-2, -3, -1], f), parts: { stack: { x: 0, y: at([0, 1, 0], f) } }, bits: [bits.paper(22 + f * 3, 40 + f * 4), bits.paper(40 - f * 2, 38 + f * 5), bits.paper(30, 44 + f * 3)] };
    return deathPose(f, { colors: ['#f6f2e8', '#d8d1be', '#ff6fa6', '#58b8ff'], n: 12, keep: ['stack'], drop: 1, ground: [] });
  },
  anchors: { muzzle: [40, -8] },
};

// ---- Thesis Advisor: reviews the checklist / slow approach / purple academic energy / debuff cast / checklist shakes / dissolves
RIGS.advisor = {
  draw: (o) => A.drawAdvisor(o),
  spec: { parts: { orb: [[8, 33, 20, 45]], scroll: [[46, 29, 60, 55]], head: [[18, 8, 48, 38]] }, legs: [23, 51, 41, 63] },
  drawOpts(anim, f) { const w = [0, 1, 0, -1][f % 4]; return { aura: [2 * w, -2 * w, 3 * w, -3 * w, 2 * w, -2 * w] }; }, // all zero on frame 0 = the approved static
  recipe(anim, f) {
    if (anim === 'idle') return { parts: { scroll: { x: at([0, 0, 1, 0], f), y: at([0, 0, -1, 0], f) }, head: { x: at([0, 0, 1, 0], f), y: at([0, 1, 0, 0], f) } } };
    if (anim === 'walk') return { dy: at([0, -1, 0, 0, -1, 0], f), lean: 1, legs: legsWalk(f, 1), parts: { scroll: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) }, orb: { x: 0, y: at([0, -1, 0, 0, -1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 1, 2, 0], f), parts: { scroll: { x: at([0, -2, -3, 3, 4, 1], f), y: at([0, -1, -1, 0, 0, 0], f) }, orb: { x: 0, y: at([0, -3, -6, -6, -2, 0], f) } }, bits: [] };
      if (f >= 3) p.bits.push(bits.orb(52 + (f - 3) * 4, 40, 3, '#7a3fe0', '#d2b0ff'));
      return p;
    }
    if (anim === 'skill') return skillPose(f, { arm: [0, -3, -6, -9, -10, -10, -9, -6, -3, 0], ring: '#8d4cf0', ring2: '#d2b0ff', ringY: 34, ringStep: 3, risers: { kind: 'pix', color: '#b88bff' }, burst: [32, 20, '#e4d2ff'], prop: 'scroll' });
    if (anim === 'hurt') return { flash: f === 0 ? '#ffffff' : null, dx: at([-2, -3, -1], f), parts: { scroll: { x: at([-2, 2, -1], f), y: 0 } } };
    return deathPose(f, { colors: ['#b88bff', '#8d4cf0', '#d2b0ff', '#f6f2e8'], n: 20, kind: 'rise', fade: [0, 0.12, 0.32, 0.55, 0.78, 0.95], sq: [1, 0.97, 0.9, 0.8, 0.66, 0.5], flicker: '#d2b0ff' });
  },
  anchors: { muzzle: [34, -12] },
};

// ---- Exam Master (boss): orbiting papers / glide / dark exam energy / area cast / aura flickers / pixel-energy collapse
// offsets relative to frame 0, so frame 0 is exactly the approved drawing
const orbit = (f, n, rx, ry) => [0, 1, 2, 3].map((i) => { const t = (2 * Math.PI * f) / n + i * 1.6, t0 = i * 1.6; return [Math.round(rx * Math.cos(t)) - Math.round(rx * Math.cos(t0)), Math.round(ry * Math.sin(t)) - Math.round(ry * Math.sin(t0))]; });
RIGS.exammaster = {
  draw: (o) => A.drawExamMaster(o),
  spec: { parts: { armL: [[3, 31, 19, 44]], armR: [[48, 31, 62, 44]], head: [[18, 9, 48, 37]] }, legs: [24, 51, 40, 63] },
  boss: true,
  drawOpts(anim, f) {
    const fast = anim === 'skill';
    return { sheets: orbit(f, fast ? 5 : anim === 'idle' ? 4 : 6, fast ? 5 : 3, fast ? 4 : 2), aura: [0, 1, 2, 3, 4, 5, 6].map((i) => [0, 3, -3, 2, -2, 3, -2][i] * [0, 1, 0, -1][f % 4]), hideSheets: anim === 'death' && f >= 1 };
  },
  recipe(anim, f) {
    if (anim === 'idle') return { dy: at([0, 0, -1, 0], f), parts: { head: { x: 0, y: at([0, 1, 0, 0], f) } } };
    if (anim === 'walk') return { dy: at([0, 0, -1, -1, 0, 0], f), lean: 2, legs: legsWalk(f, 1), parts: { armL: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) }, armR: { x: 0, y: at([0, 1, 0, 0, 1, 0], f) } } };
    if (anim === 'attack') {
      const p = { lean: at([0, -1, -2, 1, 2, 0], f), parts: { armL: { x: 0, y: at([0, -2, -3, -3, -1, 0], f) }, armR: { x: at([0, -1, -2, 3, 3, 0], f), y: at([0, -2, -3, -3, -1, 0], f) }, head: { x: at([0, -1, -1, 1, 1, 0], f), y: 0 } }, bits: [] };
      if (f >= 3) p.bits.push(bits.orb(56 + (f - 3) * 3, 40, 3, '#3a1a7a', '#ff6fd0'));
      return p;
    }
    if (anim === 'skill') return skillPose(f, { arm: [0, -2, -3, -3, -3, -3, -3, -2, -1, 0], head: [0, 0, 0, 1, 1, 1, 0, 0, 0, 0], dy: [0, 0, -1, -2, -2, -2, -2, -1, 0, 0], ring: '#a35bff', ring2: '#ff6fd0', ringY: 36, ringStep: 4, tint: { frames: [4, 5, 6], color: '#f4ecff', a: 0.4, parts: ['head'] }, ground: '#a35bff' });
    if (anim === 'hurt') return { flash: f === 0 ? '#d2b0ff' : null, tint: f === 1 ? { color: '#a35bff', a: 0.45 } : undefined, dx: at([-2, -3, -1], f), parts: { head: { x: 0, y: at([0, 1, 0], f) } } };
    return deathPose(f, { sq: [1, 0.95, 0.85, 0.7, 0.52, 0.34, 0.22, 0.14], fade: [0, 0, 0.1, 0.25, 0.42, 0.6, 0.78, 0.92], colors: ['#a35bff', '#d2b0ff', '#ff6fd0', '#7a3fe0', '#f4ecff'], n: 26, kind: 'rise', ring: '#a35bff', flicker: '#d2b0ff', ground: [[6, 53, 9, 2, '#f6f2e8'], [48, 52, 9, 2, '#f6f2e8'], [16, 54, 8, 1, '#a35bff'], [36, 54, 10, 1, '#7a3fe0']] });
  },
  anchors: { muzzle: [78, -24] },
};

// which animations each enemy has (skill only for those with an ability)
const ANIMS = {
  assignment: ['idle', 'walk', 'attack', 'hurt', 'death'],
  deadline: ['idle', 'walk', 'attack', 'hurt', 'death'],
  group: ['idle', 'walk', 'attack', 'hurt', 'death'],
  quiz: ['idle', 'walk', 'attack', 'hurt', 'death'],
  final: ['idle', 'walk', 'attack', 'skill', 'hurt', 'death'],
  professor: ['idle', 'walk', 'attack', 'hurt', 'death'],
  ta: ['idle', 'walk', 'attack', 'skill', 'hurt', 'death'],
  advisor: ['idle', 'walk', 'attack', 'skill', 'hurt', 'death'],
  exammaster: ['idle', 'walk', 'attack', 'skill', 'hurt', 'death'],
};
// bosses get a longer, more dramatic death (frames, fps)
const DEATH = { final: [8, 10], exammaster: [8, 10] };

module.exports = { RIGS, ANIMS, COUNTS, FPS, REPEAT, DEATH };
