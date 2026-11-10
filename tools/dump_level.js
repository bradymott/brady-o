// ASCII dump of a generated level, with the validator's reachable standing spots marked '*'.
// usage: node tools/dump_level.js 41-2 [x0] [x1] [areaIndex]
// legend: # ground  b brick  ? block  H hard  = one-way  ^ spikes  ~ lava/liquid  w water  I ice/mud  < > conveyors
//         F fake wall  c crumble  P pillar  B bounce surface  s sticky  % beat pad  | updraft/zone  : moving-platform path
//         G photo  E exit  O portal/door  S spring/geyser  K key  L lock  C checkpoint  X boss  M mover  e enemy/other
//        node tools/dump_level.js lab:gens.layered [x0] [x1] [areaIndex]   (a fixture from tools/fixtures/sbw_lab_levels.js)
const { getLevel, Validator, T, TS, SURF, Tour, TourBuild } = require('./load_game')();
let lvl;
if (process.argv[2].startsWith('lab:')) {
  const LAB = require('./fixtures/sbw_lab_levels.js'); let spec = LAB;
  for (const k of process.argv[2].slice(4).split('.')) spec = spec[k];
  if (spec.spec) spec = spec.spec;
  lvl = TourBuild.fromSpec(Tour.countries[spec.host || 'mx'], spec, 90);
  if (lvl.problems && lvl.problems.length) console.log('problems:', lvl.problems);
} else { const [w, i] = process.argv[2].split('-').map(Number); lvl = getLevel(w, i); }
const r = Validator.run(lvl, { trace: true });
const ch = { [T.SOIL]: 's', [T.LINTEL]: 'T', [T.EMPTY]: ' ', [T.GROUND]: '#', [T.BRICK]: 'b', [T.QBLOCK]: '?', [T.USED]: 'u', [T.HARD]: 'H', [T.HIDDEN]: 'h', [T.SEMI]: '=', [T.SPIKES]: '^', [T.LAVA]: '~', [T.WATER]: 'w', [T.ICE]: 'I', [T.CONV_L]: '<', [T.CONV_R]: '>', [T.PICK]: '.', [T.FAKE]: 'F', [T.CRUMBLE]: 'c', [T.PILLAR]: 'P', [T.SPIKES_CEIL]: 'v', [T.QBRICK]: 'q' };
const ai = +(process.argv[5] || 0);
const a = lvl.areas[ai];
const x0 = +(process.argv[3] || 0), x1 = Math.min(a.W, +(process.argv[4] || a.W));
const grid = [];
for (let y = 0; y < a.H; y++) {
  let row = [];
  for (let x = x0; x < x1; x++) {
    const k = y * a.W + x, t = a.tiles[k];
    let c = ch[t] || '?';
    if (a.surf && a.surf[k] === SURF.BOUNCE) c = 'B';
    else if (a.surf && a.surf[k] === SURF.STICKY) c = 's';
    if (a.hide && a.hide[k] === 2) c = '-';
    row.push(c);
  }
  grid.push(row);
}
const put = (tx, ty, c, onlyEmpty) => { tx -= x0; if (grid[ty] && tx >= 0 && tx < grid[ty].length && (!onlyEmpty || grid[ty][tx] === ' ' || grid[ty][tx] === '.')) grid[ty][tx] = c; };
for (const b of a.beats || []) put(b.tx, b.ty, '%');
for (const z of a.zones || []) for (let ty = Math.floor(z.y / TS); ty < Math.floor((z.y + z.h) / TS); ty++) for (let tx = Math.floor(z.x / TS); tx < Math.floor((z.x + z.w) / TS); tx++) put(tx, ty, '|', true);
for (const [gx, gy] of a.ghosts || []) put(gx, gy, ':', true);
for (const s of a.spawns) {
  const tx = Math.floor(s.x / TS), ty = Math.floor((s.y - 1) / TS);
  put(tx, ty, { gold: 'G', gate: 'E', portal: 'O', spring: 'S', geyser: 'S', pancake: 'S', jellypad: 'S', key: 'K', lock: 'L', mplat: 'M', fplat: 'f', checkpoint: 'C', boss: 'X', hammock: 'Z' }[s.type] || 'e');
}
for (const [aa, tx, ty] of r.trace || []) if (aa === ai) put(tx, ty - 1, '*', true);
console.log('exits', JSON.stringify(r.exits), 'areas', JSON.stringify(r.areasReached), 'held', JSON.stringify(r.held));
let hdr = ''; for (let x = x0; x < x1; x++) hdr += (x % 10 === 0) ? String((x / 10) % 10) : ' ';
console.log(hdr);
grid.forEach((row, y) => console.log(row.join('') + ' ' + y));
lvl.areas.forEach((aa, k) => aa.spawns.filter(s => s.type === 'gold').forEach(s => console.log('gold', s.idx, 'area', k, 'tile', Math.floor(s.x / TS), Math.floor((s.y - 1) / TS), s.kind, 'reached', r.gold[s.idx])));
console.log('goal', r.goal, 'secret', r.secretGoal, 'gold', r.gold, 'start', lvl.start, 'arch', lvl.arch);
