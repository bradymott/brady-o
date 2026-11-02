// Loads the level generator + validator into a Node VM (no browser needed).
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function loadGame(opts) {
  opts = opts || {};
  const files = ['00_core.js', '03_themes.js', '07_physics.js', '08_levels.js', '08a_chunks.js', '08b_seeds.js', '08c_designs.js', '09_validate.js', '20_burn_themes.js', '20b_world_themes.js', '26_worlddata.js']
    .filter(f => !(opts.noSeeds && f === '08b_seeds.js'))
    .filter(f => fs.existsSync(path.join(__dirname, '..', 'src', f)));
  const src = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
  const ctx = { console, Date, Math, performance: { now: () => Date.now() } };
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.API = { WORLDS, WORLD_ORDER, WORLD3_REGIONS, WORLD_NODES, WORLD_PATHS, getLevel, generateLevel, levelDesign, Validator, T, TS, SURF, secretFor, LEVEL_DESIGNS, THEMES };', ctx);
  const A = ctx.API;
  // every Super Brady-O World land, in play order
  A.ALL_WORLDS = A.WORLD3_REGIONS.slice();
  return A;
};
