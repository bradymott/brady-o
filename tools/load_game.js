// Loads the level generator + validator into a Node VM (no browser needed).
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function loadGame(opts) {
  opts = opts || {};
  const files = ['00_core.js', '03_themes.js', '07_physics.js', '08_levels.js', '08b_seeds.js', '09_validate.js', '20_burn_themes.js', '26_worlddata.js']
    .filter(f => !(opts.noSeeds && f === '08b_seeds.js'))
    .filter(f => fs.existsSync(path.join(__dirname, '..', 'src', f)));
  const src = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
  const ctx = { console, Date, Math, performance: { now: () => Date.now() } };
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.API = { WORLDS, WORLD_ORDER, CLASSIC_WORLDS, WORLD3_REGIONS, getLevel, generateLevel, Validator, T, TS, secretFor };', ctx);
  const A = ctx.API;
  // every platformer world across the three games, in play order
  A.ALL_WORLDS = A.WORLD_ORDER.concat(A.CLASSIC_WORLDS, A.WORLD3_REGIONS);
  return A;
};
