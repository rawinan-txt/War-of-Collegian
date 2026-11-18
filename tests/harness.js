const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function stubCtx() {
  const store = {}, calls = [];
  return new Proxy(store, {
    get: (t, k) => {
      if (k === '__calls') return calls;
      if (k in t) return t[k];
      return (...args) => { calls.push({ k, args }); return { addColorStop() {} }; };
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
}

function stubEl() {
  let ctx = null;
  return {
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    style: {},
    textContent: '',
    innerHTML: '',
    disabled: false,
    getContext: () => (ctx ||= stubCtx()),
  };
}

function seededMath(seed) {
  let a = seed >>> 0;
  const m = Object.create(Math);
  m.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return m;
}

// holdImages: images stay "loading" until Image.flush() (to test that a battle never waits for assets)
function makeImage(failSheets, hold) {
  const bad = failSheets ? new RegExp(failSheets) : null;
  const pending = [];
  const fire = (img) => { if (bad && bad.test(img._s)) { if (img.onerror) img.onerror(); } else if (img.onload) img.onload(); };
  return class Image {
    constructor() { Image.count = (Image.count || 0) + 1; }
    set src(v) { this._s = v; Image.requested = (Image.requested || []).concat(v); if (hold) pending.push(this); else fire(this); }
    get src() { return this._s; }
    static flush() { while (pending.length) fire(pending.shift()); }
  };
}

function loadGame(seed, opts = {}) {
  const html = fs.readFileSync(opts.html || process.env.TEST_HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no inline script found');
  const els = {};
  const sandbox = {
    document: { getElementById: (id) => (els[id] ||= stubEl()) },
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    Image: makeImage(opts.failSheets, opts.holdImages),
    console,
    Math: seed === undefined ? Math : seededMath(seed),
  };
  const ctx = vm.createContext(sandbox);
  const animsFile = path.join(__dirname, '..', 'assets', 'characters', 'animations.js');
  if (fs.existsSync(animsFile)) vm.runInContext(fs.readFileSync(animsFile, 'utf8'), ctx);
  // built-in sprite tests are hermetic: the shipped external manifest is only loaded when asked for (opts.manifest)
  const extFile = opts.manifest;
  if (extFile && fs.existsSync(extFile)) vm.runInContext(fs.readFileSync(extFile, 'utf8'), ctx);
  vm.runInContext(m[1], ctx);
  // the game loads sprites lazily (ensureSprites); most tests want every configured sprite ready, lazy tests pass { lazy: true }
  if (!opts.lazy) vm.runInContext("ensureSprites(Object.keys(typeof CHARACTER_ANIMS === \"undefined\" ? {} : CHARACTER_ANIMS))", ctx);
  return { ctx, run: (code) => vm.runInContext(code, ctx) };
}

function tick(game, seconds, step = 0.05) {
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) game.run(`update(${step})`);
}

module.exports = { loadGame, tick };
