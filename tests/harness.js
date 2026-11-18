const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function stubCtx() {
  const store = {};
  return new Proxy(store, {
    get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })),
    set: (t, k, v) => ((t[k] = v), true),
  });
}

function stubEl() {
  const el = {
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    style: {},
    textContent: '',
    innerHTML: '',
    disabled: false,
    getContext: () => stubCtx(),
  };
  return el;
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

function loadGame(seed) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no inline script found');
  const els = {};
  const sandbox = {
    document: { getElementById: (id) => (els[id] ||= stubEl()) },
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    console,
    Math: seed === undefined ? Math : seededMath(seed),
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(m[1], ctx);
  return { ctx, run: (code) => vm.runInContext(code, ctx) };
}

function tick(game, seconds, step = 0.05) {
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) game.run(`update(${step})`);
}

module.exports = { loadGame, tick };
