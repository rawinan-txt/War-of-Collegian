// The fixed scenarios used for combat baselines and determinism tests.
const { TEAMS, defaultInputs } = require('./combat-trace');

const SCENARIOS = [];
for (const seed of [1, 2, 3, 4, 5, 6]) {
  for (const teamName of ['mixed', 'support', 'tanky']) {
    SCENARIOS.push({ id: `s${seed}-${teamName}`, seed, teamName, team: TEAMS[teamName], duration: 100, speed: 1 });
  }
}
// pause/resume and 2x speed variants (the same simulation inputs, different wall-clock handling)
SCENARIOS.push(
  { id: 's7-mixed-2x', seed: 7, teamName: 'mixed', team: TEAMS.mixed, duration: 60, speed: 2 },
  { id: 's8-support-pause', seed: 8, teamName: 'support', team: TEAMS.support, duration: 100, speed: 1, pauses: [[9, 12], [40.5, 43]] },
  { id: 's9-tanky-2x-pause', seed: 9, teamName: 'tanky', team: TEAMS.tanky, duration: 70, speed: 2, pauses: [[14, 17]] },
);
// boss rain (phase 2+) is a random combat decision: weaken the boss at a fixed simulation time so it is exercised
const WEAKEN_BOSS = { t: 87, do: 'js', code: '(battle.enemies.filter(e=>e.type==="boss").forEach(e=>{e.hp=e.maxHp*0.3}),1)' };
for (const [seed, teamName] of [[10, 'mixed'], [11, 'tanky']]) {
  SCENARIOS.push({ id: `s${seed}-${teamName}-boss`, seed, teamName, team: TEAMS[teamName], duration: 125, speed: 1, inputs: [...defaultInputs(TEAMS[teamName]), WEAKEN_BOSS] });
}
module.exports = { SCENARIOS };
