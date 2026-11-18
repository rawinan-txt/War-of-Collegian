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

function makeImage(failSheets) {
  const bad = failSheets ? new RegExp(failSheets) : null;
  return class Image {
    constructor() { Image.count = (Image.count || 0) + 1; }
    set src(v) {
      this._s = v;
      if (bad && bad.test(v)) { if (this.onerror) this.onerror(); } else if (this.onload) this.onload();
    }
    get src() { return this._s; }
  };
}

function loadGame(seed, opts = {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no inline script found');
  const els = {};
  const sandbox = {
    document: { getElementById: (id) => (els[id] ||= stubEl()) },
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    Image: makeImage(opts.failSheets),
    console,
    Math: seed === undefined ? Math : seededMath(seed),
  };
  const ctx = vm.createContext(sandbox);
  const animsFile = path.join(__dirname, '..', 'assets', 'characters', 'animations.js');
  if (fs.existsSync(animsFile)) vm.runInContext(fs.readFileSync(animsFile, 'utf8'), ctx);
  const extFile = opts.manifest || path.join(__dirname, '..', 'public', 'assets', 'characters', 'manifest.js');
  if (fs.existsSync(extFile)) vm.runInContext(fs.readFileSync(extFile, 'utf8'), ctx);
  vm.runInContext(m[1], ctx);
  return { ctx, run: (code) => vm.runInContext(code, ctx) };
}

function tick(game, seconds, step = 0.05) {
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) game.run(`update(${step})`);
}

module.exports = { loadGame, tick };
