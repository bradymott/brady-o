// usage: node tools/dump_level.js 1-2 [x0] [x1]
const { getLevel, Validator, T, TS } = require('./load_game')();
const [w, i] = process.argv[2].split('-').map(Number);
const lvl = getLevel(w, i);
const r = Validator.run(lvl, { trace: true });
const ch = { [T.EMPTY]: ' ', [T.GROUND]: '#', [T.BRICK]: 'b', [T.QBLOCK]: '?', [T.USED]: 'u', [T.HARD]: 'H', [T.HIDDEN]: 'h', [T.SEMI]: '=', [T.SPIKES]: '^', [T.LAVA]: '~', [T.WATER]: 'w', [T.ICE]: 'I', [T.CONV_L]: '<', [T.CONV_R]: '>', [T.PICK]: '.', [T.FAKE]: 'F', [T.CRUMBLE]: 'c', [T.PILLAR]: 'P', [T.SPIKES_CEIL]: 'v', [T.QBRICK]: 'q' };
const ai = +(process.argv[5] || 0);
const a = lvl.areas[ai];
const x0 = +(process.argv[3] || 0), x1 = Math.min(a.W, +(process.argv[4] || a.W));
const grid = [];
for (let y = 0; y < a.H; y++) { let row = ''; for (let x = x0; x < x1; x++) row += ch[a.tiles[y * a.W + x]] || '?'; grid.push(row.split('')); }
for (const s of a.spawns) { const tx = Math.floor(s.x / TS) - x0, ty = Math.floor((s.y - 1) / TS); if (grid[ty] && tx >= 0 && tx < grid[ty].length) grid[ty][tx] = { gold: 'G', gate: 'E', portal: 'O', spring: 'S', mplat: 'M', fplat: 'f', checkpoint: 'C', boss: 'X' }[s.type] || 'e'; }
for (const [aa, tx, ty] of r.trace) if (aa === ai && grid[ty - 1] && tx - x0 >= 0 && tx - x0 < grid[0].length && grid[ty - 1][tx - x0] === ' ') grid[ty - 1][tx - x0] = '*';
let hdr = ''; for (let x = x0; x < x1; x++) hdr += (x % 10 === 0) ? String((x / 10) % 10) : ' ';
console.log(hdr);
grid.forEach((r2, y) => console.log(r2.join('') + ' ' + y));
lvl.areas.forEach((aa,k)=>aa.spawns.filter(s=>s.type==='gold').forEach(s=>console.log('gold',s.idx,'area',k,'tile',Math.floor(s.x/TS),Math.floor((s.y-1)/TS),s.kind,'reached',r.gold[s.idx])));
console.log('goal', r.goal, 'gold', r.gold, 'warps', r.warps, 'start', lvl.start);
