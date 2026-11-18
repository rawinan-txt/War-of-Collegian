// Reads the facts about the game that character configuration must agree with, straight from index.html (single source
// of truth): combat timing constants, the projectile muzzle offset, the hero table, SKILL_MODE and SKILL_FX.
// Nothing here changes the game; it only observes it (the game is executed in the headless test sandbox).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const HTML = path.join(ROOT, 'index.html');

function readConstants(html = fs.readFileSync(HTML, 'utf8')) {
  const num = (name) => {
    const m = html.match(new RegExp(`\\b${name}=([0-9]*\\.?[0-9]+)`));
    if (!m) throw new Error(`cannot find constant ${name} in index.html`);
    return parseFloat(m[1]);
  };
  const corpse = html.match(/corpses=b\.corpses\.filter\(c=>c\.t<([0-9]*\.?[0-9]+)\)/);
  if (!corpse) throw new Error('cannot find the corpse lifetime in index.html');
  const muzzle = html.match(/o\.x=u\.x\+\(u\.ally\?(\d+):-(\d+)\);o\.y=u\.y-(\d+)/);
  if (!muzzle || muzzle[1] !== muzzle[2]) throw new Error('cannot find the projectile muzzle offset in index.html');
  return {
    attackDuration: num('ATK_DUR'),
    impactDelay: num('IMPACT_DELAY'),
    skillDuration: num('SKILL_DUR'),
    skillImpact: num('SKILL_IMPACT'),
    hurtDuration: num('HURT_DUR'),
    corpseLife: parseFloat(corpse[1]),
    muzzle: [parseInt(muzzle[1], 10), -parseInt(muzzle[3], 10)],
  };
}

let game = null;
function sandbox() {
  if (!game) game = require(path.join(ROOT, 'tests', 'harness')).loadGame(1);
  return game;
}

// hero table / skill tables as the running game sees them
function heroes() {
  const g = sandbox();
  return JSON.parse(g.run('JSON.stringify(heroes.map(h=>({id:h.id,name:h.name,f:h.f})))'));
}
function skillMode(id) { return sandbox().run(`SKILL_MODE[${JSON.stringify(id)}]`) || null; }

// run the hero's SKILL_FX with the fx helpers replaced by recorders; returns {kind, calls} or null
function skillFx(id) {
  const g = sandbox();
  if (!g.run(`!!SKILL_FX[${JSON.stringify(id)}]`)) return null;
  g.run(`globalThis.__fxCalls=[];
    fxBeam=function(a,b,c,d,e){__fxCalls.push(['beam',a,b,c,d,e])};
    fxBurst=function(a,b,c,d,e){__fxCalls.push(['burst',a,b,c,d,e])};
    fxRing=function(a,b,c,d){__fxCalls.push(['ring',a,b,c,d])};
    fxSpawn=function(a,b,c,d,e,f,g2,h){__fxCalls.push(['spawn',a,b,c,d,e,f,g2,h])};
    fxShake=function(a){__fxCalls.push(['shake',a])};
    SKILL_FX[${JSON.stringify(id)}].run({x:0,y:0,id:${JSON.stringify(id)},ally:true});`);
  return { kind: g.run(`SKILL_FX[${JSON.stringify(id)}].kind`), calls: JSON.parse(g.run('JSON.stringify(__fxCalls)')) };
}

// descriptor op -> the call shape recorded above
function opToCall(o) {
  switch (o.op) {
    case 'beam': return ['beam', o.from[0], o.from[1], o.to[0], o.to[1], o.color];
    case 'burst': return ['burst', o.at[0], o.at[1], o.color, o.count, o.size];
    case 'ring': return ['ring', o.at[0], o.at[1], o.color, o.radius];
    case 'spawn': return ['spawn', o.at[0], o.at[1], o.v[0], o.v[1], o.life, o.color, o.size, o.grav];
    case 'shake': return ['shake', o.amount];
    default: throw new Error('unknown fx op ' + o.op);
  }
}

module.exports = { ROOT, HTML, readConstants, heroes, skillMode, skillFx, opToCall };
