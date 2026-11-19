// Deterministic combat tracer: runs a scripted battle headlessly and records everything that must not depend on visual
// settings. Works against the current index.html and (with opts.html) against an older copy, so the same scenarios
// can be recorded before and after a change.
//
// Simulation-time inputs only: the battle is advanced with fixed dt and inputs fire at fixed simulation times, so two runs
// differ only in what the options change (fx level, draw cadence, ...).
const crypto = require('node:crypto');
const path = require('node:path');
const { loadGame } = require('../harness');

const MANIFEST = path.join(__dirname, '..', '..', 'public', 'assets', 'characters', 'manifest.js');

const TEAMS = {
  mixed: ['bug', 'mecha', 'night', 'lab', 'chem', 'dental'],
  support: ['bug', 'animal', 'music', 'runner', 'global', 'nurse'],
  tanky: ['bug', 'public', 'night', 'lab', 'mecha', 'chem'],
};

// scripted player inputs (simulation seconds): deploys, income upgrades, faculty laser, ultimate
function defaultInputs(team) {
  const inputs = [];
  team.forEach((id, i) => inputs.push({ t: 0.2 + i * 1.7, do: 'deploy', id }));
  inputs.push({ t: 12, do: 'upgrade' }, { t: 20, do: 'laser' }, { t: 31, do: 'deploy', id: team[1] }, { t: 40, do: 'deploy', id: team[2] },
    { t: 44, do: 'ult' }, { t: 52, do: 'upgrade' }, { t: 60, do: 'laser' }, { t: 70, do: 'deploy', id: team[0] }, { t: 80, do: 'deploy', id: team[3] });
  return inputs;
}

const INSTALL = `
  globalThis.__T={spawns:[],proj:[],warn:[],calls:0,fin:null,wlen:0};
  const _se=spawnEnemy; spawnEnemy=function(type){const r=_se(type);const e=battle.enemies[battle.enemies.length-1];__T.spawns.push({t:battle.t,type,id:e.id,x:e.x,y:e.y,walk:e.walk});return r};
  const _lp=launchProjectile; launchProjectile=function(u,p){__T.proj.push({t:battle.t,shooter:u.id,ally:u.ally,target:p.target.id,tx:p.target.x,val:p.val});return _lp(u,p)};
  const _fin=finish; finish=function(w){__T.fin={win:w,t:battle.t};return _fin(w)};
  const _R=Math.random; Math.random=function(){__T.calls++;return _R()};
`;

// opts: seed, team, teamName, inputs, step, duration, speed, pauses [[from,to]], fx ('full'|'reduced'|'off'), draw (bool),
//       html, combatSeed (new code only), checkpointEvery
function runTrace(opts) {
  const step = opts.step || 1 / 30, duration = opts.duration || 90, every = opts.checkpointEvery || 10;
  const team = opts.team || TEAMS.mixed;
  const g = loadGame(opts.seed, { html: opts.html, manifest: MANIFEST, lazy: !!opts.html });
  g.run(INSTALL);
  if (opts.fx) g.run(`setFxLevel(${JSON.stringify(opts.fx)})`);
  const hasRng = g.run('typeof createSeededRng === "function"');
  g.run(`team=${JSON.stringify(team)};screen='battle'`);
  g.run(opts.combatSeed !== undefined && hasRng ? `startBattle(${opts.combatSeed})` : 'startBattle()');
  g.run(`battle.at=${opts.at || 400};battle.speed=${opts.speed || 1}`);
  const inputs = (opts.inputs || defaultInputs(team)).map((x) => ({ ...x, done: false }));
  const pauses = opts.pauses || [];
  const hash = crypto.createHash('sha256');
  const checkpoints = [], applied = [];
  const n = Math.round(duration / step);
  let simT = 0, nextCp = every;
  for (let i = 0; i < n; i++) {
    // inputs fire at simulation times (paused time does not advance, so they wait)
    for (const inp of inputs) {
      if (inp.done || simT < inp.t) continue;
      inp.done = true;
      const ok = g.run(inp.do === 'js' ? inp.code : inp.do === 'deploy' ? `(deploy(${JSON.stringify(inp.id)}),battle.units.length)` : inp.do === 'upgrade' ? '(upgradeIncome(),battle.level)' : inp.do === 'laser' ? 'baseSkill()' : 'useUltimate()');
      applied.push({ t: Math.round(simT * 1000) / 1000, do: inp.do, id: inp.id || null, result: ok });
    }
    const wall = i * step;
    const paused = pauses.some(([a, b]) => wall >= a && wall < b);
    g.run(`battle.paused=${paused}`);
    g.run(`update(${step})`);
    if (opts.draw) g.run('draw()');
    if (!paused) simT += step * (opts.speed || 1);
    // new warnings (boss rain) are combat decisions
    const wl = g.run('battle.warnings.length'), seen = g.run('__T.wlen');
    if (wl > seen) { g.run(`for(let k=__T.wlen;k<battle.warnings.length;k++)__T.warn.push({t:battle.t,x:battle.warnings[k].x});__T.wlen=battle.warnings.length`); } else if (wl < seen) g.run('__T.wlen=battle.warnings.length');
    hash.update(g.run(`JSON.stringify([battle.t,battle.baseHp,battle.enemyHp,battle.at,battle.kills,battle.ult,battle.units.map(u=>[u.id,u.x,u.y,u.hp,u.alive,u.stun,u.shield]),battle.enemies.map(u=>[u.id,u.x,u.y,u.hp,u.alive,u.stun,u.shield]),battle.projectiles.length])`));
    if ((i + 1) * step >= nextCp - 1e-9) {
      nextCp += every;
      checkpoints.push(JSON.parse(g.run(`JSON.stringify({t:battle.t,baseHp:battle.baseHp,enemyHp:battle.enemyHp,at:battle.at,kills:battle.kills,ult:battle.ult,units:battle.units.map(u=>[u.id,u.x,u.y,u.hp]),enemies:battle.enemies.map(u=>[u.id,u.x,u.y,u.hp])})`)));
    }
    if (g.run('battle.ended')) break;
  }
  const T = JSON.parse(g.run('JSON.stringify(__T)'));
  const stats = JSON.parse(g.run('JSON.stringify({rows:CombatStats.getAllCharacterStats(),laser:CombatStats.laserDamage,ult:CombatStats.ultDamage})'));
  const rng = { mathRandomCalls: T.calls };
  if (hasRng) {
    rng.seed = g.run('battle.seed');
    rng.combat = JSON.parse(g.run('JSON.stringify({state:battle.rng.combat.state,draws:battle.rng.combat.draws})'));
    rng.vfx = JSON.parse(g.run('JSON.stringify({state:battle.rng.vfx.state,draws:battle.rng.vfx.draws})'));
  }
  return {
    seed: opts.seed, team, speed: opts.speed || 1, fx: opts.fx || 'full', draw: !!opts.draw,
    spawns: T.spawns, projectiles: T.proj, bossRain: T.warn, inputs: applied, checkpoints, stats,
    outcome: { ended: g.run('battle.ended'), win: T.fin ? T.fin.win : null, t: T.fin ? T.fin.t : null, simTime: g.run('battle.t'), kills: g.run('battle.kills'), baseHp: g.run('battle.baseHp'), enemyHp: g.run('battle.enemyHp') },
    rng, digest: hash.digest('hex'),
  };
}

// the part of a trace that is gameplay (everything except how many random numbers the visuals used)
function gameplayView(t) {
  const { rng, fx, draw, ...rest } = t;
  const combat = rng && rng.combat ? rng.combat : null;
  return { ...rest, combatRng: combat };
}

module.exports = { runTrace, gameplayView, TEAMS, defaultInputs };
