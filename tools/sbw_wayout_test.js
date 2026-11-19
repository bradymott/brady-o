// Super Brady-O World: from the top, is there a way back to an exit? Node only (the level checker's real physics search).
// For every level and area: the checker finds every spot Brady can stand on from the level's start; from the highest
// ones in each area (the top of a climb, a ledge over everything) a second search must reach one of the level's exits
// (through doors and other areas as needed) without dying. Brady's 1-4 Obsidian Chimney had only a one-way hatch at the
// top (DOWN + JUMP on it): the checker does not drop through one-way floors either, so a spot whose only way down is
// such a drop is reported, then checked again with the area's one-way floors open ("only with DOWN + JUMP").
// Exits: any gate or warp of the level; for a secret room, its door out (any other area) is enough. Water areas are
// skipped (Brady swims anywhere there).
// --rooms: only the secret rooms (areas built by the room kit), and from each of the room's needs too (its prize boxes,
// tokens, the top of a climb): the way out must be reachable FROM the prize, not only from the entrance.
// usage: node tools/sbw_wayout_test.js [levelId ...] [--verbose] [--top N] [--rooms]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), ROOMS = args.includes('--rooms');
const TOPN = +(args[args.indexOf('--top') + 1] || 2) || 2, only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--top');
const A = loadGame();
const { Validator, T, TS, Tour } = A;
// a Pupo level's way on can need Pupo: from a spot, the search rides him from every Nap Box it reaches (PupoVal)
const PV = A.run("typeof PupoVal !== 'undefined' ? PupoVal : null"), search = (L, o) => PV && PV.has(L) ? PV.run(L, o) : Validator.run(L, o);
let failures = 0, warnings = 0, spots = 0;
const anyExit = r => Object.keys(r.exits || {}).length > 0;
const t0 = Date.now();
for (const C of Object.values(Tour.countries)) for (const id of Tour.levelIds(C)) {
  if (only.length && !only.includes(id)) continue;
  const [w, i] = id.split('-').map(Number); const lvl = A.getLevel(w, i);
  // a room's prize cage stays open once its game is won: from a spot inside, its own lock ('room:<aid>') is open
  const opened = (L0, ai) => Object.assign({}, L0, { areas: L0.areas.map((b, k) => {
    if (k !== ai || !b.locks || !b.locks.some(l => String(l.id).startsWith('room:'))) return b;
    const tiles = new Uint8Array(b.tiles);
    for (const l of b.locks) if (String(l.id).startsWith('room:')) for (const [x, y] of l.tiles) tiles[y * b.W + x] = T.EMPTY;
    return Object.assign({}, b, { tiles, locks: b.locks.filter(l => !String(l.id).startsWith('room:')) });
  }) });
  const all = Validator.run(lvl, { trace: true });
  const byArea = new Map();
  for (const [ai, tx, ty, mask, f] of all.trace || []) { if (f) continue; const L = byArea.get(ai) || []; L.push([tx, ty, mask]); byArea.set(ai, L); }
  for (const [ai, L] of byArea) {
    const a = lvl.areas[ai]; if (a.water) continue; if (ROOMS && !a.roomKit) continue;
    // the highest standing spots, a few columns apart
    L.sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    const pick = [];
    for (const s of L) { if (pick.length >= TOPN) break; if (pick.every(q => Math.abs(q[0] - s[0]) > 3 || q[1] !== s[1])) pick.push(s); }
    // a room's needs (the prize, tokens, the top): the reachable spot nearest each one
    if (a.roomNeeds) for (const nd of a.roomNeeds) {
      const cx = (nd.x + nd.w / 2) / TS, cy = (nd.y + nd.h) / TS; let best = null, bd = 1e9;
      for (const s of L) { const d = Math.abs(s[0] + 0.5 - cx) + Math.abs(s[1] - cy); if (d < bd) { bd = d; best = s; } }
      if (best && bd < 4 && !pick.some(q => q[0] === best[0] && q[1] === best[1])) pick.push(best.concat([nd.what]));
    }
    for (const [tx, ty, , what] of pick) {
      spots++;
      const start = { area: ai, x: tx * TS + TS / 2, y: ty * TS };
      // a room: out through its door (any other area) is enough; elsewhere: one of the level's exits
      const done = a.roomKit ? (r => anyExit(r) || r.areasReached.some((v, k) => v && k !== ai)) : anyExit;
      const base = opened(lvl, ai), r = search(base, { start, until: done });
      if (done(r)) { if (verbose) console.log(`ok   ${id} ${a.aid}(${tx},${ty})`); continue; }
      // again with this area's one-way floors open (a DOWN + JUMP drop through them)
      const open = Object.assign({}, base, { areas: base.areas.map((b, k) => k !== ai ? b : Object.assign({}, b, { tiles: b.tiles.map(t => t === T.SEMI ? T.EMPTY : t) })) });
      const r2 = search(open, { start, until: done });
      const where = `${id} ${lvl.name}: ${a.aid}${a.roomKit ? ' (room: ' + a.roomKit.kind + ')' : a.role ? ' (' + a.role + ')' : ''} at (${tx},${ty})${what ? ' by ' + what : ''}`;
      if (done(r2)) { warnings++; console.log(`WARN ${where}: the only way down to an exit is a DOWN + JUMP drop through a one-way floor`); }
      else { failures++; console.log(`FAIL ${where}: no way back to an exit from here without dying`); }
    }
  }
}
console.log(`\n${spots} top spots checked in ${Math.round((Date.now() - t0) / 1000)} s: ${failures} with no way out, ${warnings} only with a DOWN + JUMP drop`);
process.exit(failures ? 1 : 0);
