// Pupo, PU-1: the mount core (docs/design/PUPO.md §1, §7.10). Node only: the real game modules in a VM, the lab
// fixture (tools/fixtures/sbw_pupo_lab.js) as Play scenes stepped at 1/120 s.
// Sections: box (the Nap Box opens every way a gift box does, refills), mount (mounting, the riding box, met / meter / save),
// move (amble, lope, jump, swim, flop, the physics wrapper), off (hopping off), hits (drowsy, nap, wake, the hit order,
// grabbers, a nap over a pit), carry (doors, areas, noPupo, the checkpoint and a respawn, the level clear, death),
// none (a level without a Nap Box behaves as before), draw (every pose draws without an error)
// usage: node tools/sbw_pupo_test.js [section ...]
const { boot, checker } = require('./sbw_pupo_lib');
const G = boot(), C = checker(), want = process.argv.slice(2);
const { T, TS } = G;
const R = G.run('PupoRide'), K = R.K;
const near = (a, b, eps) => Math.abs(a - b) <= eps;
// open the yard's box with a kick and mount Pupo
function ridingYard() {
  const g = G.lab('ride'); G.step(g, 0.3);
  G.step(g, 1.2, { right: true }); G.step(g, 0.05, { actionPressed: true }); G.step(g, 1.4);
  G.step(g, 0.8, { left: true }); G.step(g, 1.0, { right: true });
  return g;
}
const put = (g, tx, feetY) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = feetY - p.h; p.vx = 0; p.vy = 0; p.onGround = false; };

C.section(want, 'box', () => {
  // the carton: a QBLOCK holding 'pupo' with a napBox entity over it
  let g = G.lab('ride'), A = g.area;
  const nb = g.entities.find(e => e.isNapBox);
  C.check('the Nap Box is a QBLOCK holding pupo, with its carton drawn over it', nb && A.tiles[nb.ty * A.W + nb.tx] === T.QBLOCK && A.contents[nb.tx + ',' + nb.ty] === 'pupo' && nb.state === 'closed');
  // a kick (Action beside it)
  G.step(g, 0.3); G.step(g, 1.2, { right: true }); G.step(g, 0.05, { actionPressed: true }); G.step(g, 0.1);
  const items = g.entities.filter(e => e.item && !e.remove).length;
  C.check('a kick opens it: the tile is used, the carton opens, Pupo unfolds (no item comes out)', A.tiles[nb.ty * A.W + nb.tx] === T.USED && nb.state === 'open' && g.pupo.free && g.pupo.free.mode === 'unfold' && items === 0, { items, where: g.pupo.where });
  G.step(g, 1.3);
  C.check('after 1.2 s he sits beside the box', g.pupo.free.mode === 'sit' && g.pupo.free.onGround, { mode: g.pupo.free.mode });
  // landing on it
  g = G.lab('ride'); A = g.area; put(g, 7, 6 * TS); G.step(g, 0.6);
  C.check('landing on it opens it', A.tiles[8 * A.W + 7] === T.USED && g.pupo.where === 'free');
  // from below: a box in the air
  g = G.lab('ride'); A = g.area;
  A.tiles[5 * A.W + 44] = T.QBLOCK; A.contents['44,5'] = 'pupo'; const NB = G.run('NapBox'); g.spawn(new NB(g, { x: 44 * TS + 16, y: 6 * TS }));
  put(g, 44, 9 * TS); G.step(g, 0.2); G.step(g, 0.5, { jump: true, jumpPressed: true });
  C.check('a bump from below opens it', A.tiles[5 * A.W + 44] === T.USED && g.pupo.where === 'free');
  // a shot
  g = G.lab('ride'); A = g.area; put(g, 3, 9 * TS); G.step(g, 0.2);
  const Gas = G.run('GasPuff'); const gp = new Gas(g, 6 * TS, 8 * TS + 10, -1); gp.vy = 0; gp.vx = 8 * TS; g.spawn(gp); G.step(g, 0.3);
  C.check('a thrown or launched thing opens it', A.tiles[8 * A.W + 7] === T.USED && g.pupo.where === 'free');
  // the ground pound
  g = G.lab('ride'); A = g.area; put(g, 7, 7 * TS - 2); g.player.pound = { phase: 'slam', t: 0, y: 0 }; g.player.vy = 20 * TS; G.step(g, 0.3);
  C.check('the ground pound opens it', A.tiles[8 * A.W + 7] === T.USED);
  // refill: Pupo asleep elsewhere, the used box is bumped: he pops out of this box instead
  g = ridingYard(); A = g.area; const p = g.player; put(g, 25, 9 * TS); G.step(g, 0.3);
  const old = R.dismount(p, 'nap'); G.step(g, 0.2);
  g.bumpBlock(7, 8, false, p); G.step(g, 0.05);
  const nf = g.pupo.free;
  C.check('a used Nap Box refills: the sleeping Pupo vanishes and pops out of this box', old.remove && nf && nf !== old && nf.mode === 'unfold' && Math.abs(nf.cx - 7.5 * TS) < 2 * TS, { old: old.remove, mode: nf && nf.mode });
  // landing on a used box while Pupo is elsewhere refills it too
  g = ridingYard(); { const p2 = g.player; put(g, 25, 9 * TS); G.step(g, 0.3); const o2 = R.dismount(p2, 'nap'); G.step(g, 2.2); put(g, 7, 6 * TS); G.step(g, 0.8);
    C.check('landing on a used Nap Box while Pupo sleeps elsewhere: he pops out of it', o2.remove && g.pupo.free && g.pupo.free !== o2, { removed: o2.remove }); }
  // while riding, a used box is just a box
  g = ridingYard(); const before = g.pupo.free; g.bumpBlock(7, 8, false, g.player);
  C.check('bumping a used box while riding changes nothing', g.player.pupoRide && g.pupo.where === 'ride' && !before);
});

C.section(want, 'mount', () => {
  const g = ridingYard(), p = g.player;
  C.check('walking into the sitting Pupo mounts him: the riding box is 28 x 58', p.pupoRide && p.w === K.W && p.h === K.H && g.pupo.where === 'ride' && !p.mounted, { w: p.w, h: p.h });
  C.check('the first mount in a level run: met, the meter at 0.5, the save remembers him', g.pupo.met && near(g.pupo.meter, 0.5, 0.05) && G.run('Save.data.tour.pupo.met') === true, { meter: g.pupo.meter });
  C.check('the old Slothy mount is never set (its dismount is not in this build)', p.mounted === false && G.run('typeof Player.prototype.dismount') === 'undefined');
  // the mushroom grows Brady on Pupo's back; the box stays the riding box
  p.collect('mushroom'); G.step(g, 0.5);
  C.check('setPower while riding keeps the 28 x 58 box (Brady grows on his back)', p.power === 1 && p.w === K.W && p.h === K.H, { w: p.w, h: p.h, power: p.power });
  // jump powers are off
  p.jumpPow = { id: 'socks', used: false, gas: 1 }; G.step(g, 0.05, { jump: true, jumpPressed: true }); G.step(g, 0.15, { jump: true }); const vy0 = p.vy; G.step(g, 0.05, { jump: true, jumpPressed: true });
  C.check('jump powers do nothing in mid-air on Pupo', !p.onGround && p.vy >= vy0, { vy0, vy: p.vy });
  G.step(g, 1);
  // the picker chip hides; the action button does not throw
  p.collect('joint'); p.collect('sig:taco'); G.step(g, 0.1);
  const TP = G.run('TourPicker');
  C.check('the power picker chip hides while riding', TP.list(p).length >= 2 && !TP.visible(g));
  const shots = g.entities.filter(e => e.constructor.name === 'SmokePuff' || e.constructor.name === 'TacoShot').length;
  G.step(g, 0.05, { actionPressed: true }); G.step(g, 0.1);
  C.check('Action does not fire Brady\'s powers while riding (it belongs to Pupo)', g.entities.filter(e => e.constructor.name === 'SmokePuff' || e.constructor.name === 'TacoShot').length === shots);
});

C.section(want, 'move', () => {
  let g = ridingYard(), p = g.player;
  put(g, 38, 9 * TS); G.step(g, 0.5); p.runT = 0;
  G.step(g, 0.3, { right: true }); const amble = p.vx / TS;
  G.step(g, 0.9, { right: true }); const lope = p.vx / TS;
  C.check(`amble ${amble.toFixed(2)} t/s then lope ${lope.toFixed(2)} t/s (4.8 / 7.4)`, near(amble, 4.77, 0.15) && near(lope, 7.39, 0.15), { amble, lope });
  // the same jump as Brady
  const rise = (gg) => { const q = gg.player; put(gg, 44, 9 * TS); G.step(gg, 0.5); const y0 = q.y + q.h; let top = y0; for (let i = 0; i < 80; i++) { G.step(gg, 1 / 120, { jump: true, jumpPressed: i === 0 }); top = Math.min(top, q.y + q.h); } return (y0 - top) / TS; };
  const onPupo = rise(g); const g2 = G.lab('ride'); G.step(g2, 0.3); const alone = rise(g2);
  C.check(`the jump is as high as Brady's (${onPupo.toFixed(2)} vs ${alone.toFixed(2)} tiles)`, near(onPupo, alone, 0.05), { onPupo, alone });
  // swimming 1.6x
  g = ridingYard(); p = g.player; const A = g.area;
  const wx = [...Array(A.W).keys()].find(x => A.tiles[9 * A.W + x] === T.WATER);
  put(g, wx + 1, 11 * TS); G.step(g, 0.3); G.step(g, 1.0, { right: true }); const swim = p.vx / TS;
  C.check(`he swims at ${swim.toFixed(2)} t/s (Brady 4.4, Pupo 7.0)`, p.inWater && near(swim, 7.04, 0.3), { swim, inWater: p.inWater });
  // the flop crawls under a 1-tile gap that the riding box cannot pass
  g = ridingYard(); p = g.player; put(g, 18, 9 * TS); G.step(g, 0.3);
  G.step(g, 1.0, { right: true });
  C.check('standing, the riding box cannot pass the 1-tile gap', p.x + p.w <= 20 * TS + 1, { right: p.x + p.w });
  G.step(g, 0.2, { down: true }); const flopH = p.h;
  G.step(g, 0.5, { down: true, right: true }); const crawl = p.vx / TS;
  G.step(g, 2.2, { down: true, right: true });
  C.check(`hold Down: the flop (28 x 30) crawls at ${crawl.toFixed(2)} t/s and through the gap`, flopH === K.FLOP_H && near(crawl, 2.8, 0.2) && p.x > 24 * TS && p.pupoRide, { flopH, crawl, x: p.x / TS });
  G.step(g, 0.3);
  C.check('let go of Down with headroom: he stands up again', p.h === K.H && !p.pupoFlop);
  // the physics wrapper: speedMul and swimMul on a body with pupoRide, restored afterwards, untouched without it
  const ppf = G.run('playerPhysicsFlip'), mk = () => ({ x: 64, y: 100, w: 28, h: 58, vx: 0, vy: 0, onGround: true, coyote: 0, jumpBuf: 0, jumping: false, runT: 0, airMax: 0, facing: 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, groundTx: 2, groundTy: 5, ride: null, dropT: 0 });
  const opts = { speedMul: 1, swimMul: 1 }, a = mk(), b = mk(); b.pupoRide = true;
  for (let i = 0; i < 60; i++) { ppf(a, { right: true }, g.area, 1 / 120, [], opts); ppf(b, { right: true }, g.area, 1 / 120, [], opts); }
  C.check('the physics wrapper scales speed only for a body with pupoRide and restores opts', near(b.vx / a.vx, 0.77, 0.02) && opts.speedMul === 1 && opts.swimMul === 1, { ratio: b.vx / a.vx, opts });
});

C.section(want, 'off', () => {
  let g = ridingYard(), p = g.player; put(g, 5, 9 * TS); G.step(g, 0.3);
  G.step(g, 0.05, { down: true, jump: true, jumpPressed: true }); G.step(g, 0.05);
  C.check('Down + Jump on solid ground: Brady hops off, Pupo sits where he is', !p.pupoRide && p.w === 20 && g.pupo.free && g.pupo.free.mode === 'sit' && p.vy < 0, { w: p.w, where: g.pupo.where });
  G.step(g, 1.2);
  C.check('he does not climb straight back on: he has to walk off and back', !p.pupoRide);
  G.step(g, 0.6, { right: true }); G.step(g, 0.9, { left: true });
  C.check('walking back into him gets back on', p.pupoRide);
  // a one-way floor: Down + Jump drops both through it
  g = ridingYard(); p = g.player; const A = g.area; const sx = [...Array(A.W).keys()].find(x => A.tiles[5 * A.W + x] === T.SEMI);
  put(g, sx + 2, 5 * TS); G.step(g, 0.4);
  const onSemi = p.onGround && p.groundTile === T.SEMI;
  G.step(g, 0.05, { down: true, jump: true, jumpPressed: true }); G.step(g, 0.5);
  C.check('on a one-way floor Down + Jump drops both through it', onSemi && p.pupoRide && p.y + p.h > 6 * TS, { onSemi, ride: p.pupoRide, feet: (p.y + p.h) / TS });
  // hold Down for a second, standing still
  g = ridingYard(); p = g.player; put(g, 5, 9 * TS); G.step(g, 0.3);
  G.step(g, 0.8, { down: true }); const still = p.pupoRide; G.step(g, 0.3, { down: true });
  C.check('holding Down for 1 s standing still hops off', still && !p.pupoRide && g.pupo.free);
});

C.section(want, 'hits', () => {
  let g = ridingYard(), p = g.player; put(g, 25, 9 * TS); G.step(g, 0.3);
  const foe = () => { const E = G.run("ENTITY_TYPES.mxElote"); const e = new E(g, { x: p.cx + 40, y: p.y + p.h, dir: -1 }); g.spawn(e); return e; };
  const m0 = g.pupo.meter; p.hands = { id: 'plane' }; p.jumpPow = { id: 'socks', used: false, gas: 1 }; p.power = 1;
  const e1 = foe(); e1.x += 400; e1.vx = 0; e1.speed = 0; p.hurt(e1);
  C.check('first hit: Pupo takes it and goes drowsy for 8 s; the meter loses 25 %; Brady keeps HANDS, FEET and form', p.pupoRide && near(g.pupo.drowsyT, 8, 0.01) && near(g.pupo.meter, Math.max(0, m0 - 0.25), 0.01) && p.hands && p.jumpPow && p.power === 1 && !(p.invuln > 0), { drowsy: g.pupo.drowsyT, meter: g.pupo.meter });
  p.hurt(e1);
  C.check('a hit inside the 1.5 s grace is ignored (and Brady does not flicker: no invuln)', p.pupoRide && g.pupo.shieldT > 0 && !(p.invuln > 0));
  G.step(g, 1.6);
  const fx = p.cx; p.hurt(e1);
  const f = g.pupo.free;
  C.check('a hit while drowsy: Pupo falls asleep on the spot, Brady pops off (vy -9 t/s, 2 s invulnerable), keeping his items', !p.pupoRide && f && f.mode === 'sleep' && near(p.vy, -9 * TS, 1) && near(p.invuln, 2, 0.01) && p.hands && p.jumpPow && p.power === 1 && near(f.cx, fx, 2), { vy: p.vy, inv: p.invuln, mode: f && f.mode });
  e1.remove = true; G.step(g, 2.5);
  C.check('a sleeping Pupo is never hurt and never wanders', f.mode === 'sleep' && !f.remove && near(f.cx, fx, 2));
  // waking him: walk into him
  G.step(g, 0.6, { right: true }); G.step(g, 1.0, { left: true });
  const waking = f.mode === 'wake' || p.pupoRide;
  G.step(g, 0.8);
  C.check('walking into him: Brady pokes his pupo, he wakes in 0.6 s and Brady is back on, not drowsy', waking && p.pupoRide && g.pupo.drowsyT === 0, { mode: f.mode, ride: p.pupoRide });
  // 8 s without another hit: he perks up
  p.hurt({ x: p.x + 40, w: 10 }); G.step(g, 8.2);
  C.check('8 s without another hit: he perks up', p.pupoRide && g.pupo.drowsyT === 0);
  // the hit order: the star first (the enemy is defeated, Pupo untouched), then the Pupo shield
  const e2 = foe(); p.star = 3; p.hurt(e2);
  C.check('star: the enemy is defeated, Pupo untouched', e2.dead && g.pupo.drowsyT === 0);
  p.star = 0; g.pupo.shieldT = 1.5; g.pupo.powerShield = 1; p.hurt({ x: p.x, w: 10 });
  C.check('the Pupo shield (after PUPO POWER!) ignores hits', g.pupo.drowsyT === 0 && p.pupoRide);
  g.pupo.shieldT = 0;
  // spikes are a hit on Pupo
  const A = g.area; const sx = [...Array(A.W).keys()].find(x => A.tiles[8 * A.W + x] === T.SPIKES);
  put(g, sx, 8 * TS + 2); G.step(g, 0.1);
  C.check('spikes are a hit on Pupo (drowsy), not on Brady', p.pupoRide && g.pupo.drowsyT > 0 && !p.dead);
  // grabbers cannot carry Brady off Pupo: one hit on Pupo
  g = ridingYard(); p = g.player; put(g, 25, 9 * TS); G.step(g, 0.3);
  let released = false; p.grabbedBy = { release() { released = true; }, dead: false, remove: false }; G.step(g, 0.05);
  C.check('a grabber cannot carry Brady off Pupo: released, one hit on Pupo', released && p.pupoRide && !p.grabbedBy && g.pupo.drowsyT > 0);
  // a nap over a pit: Pupo poofs back into the last Nap Box, closed again
  g = ridingYard(); p = g.player; const pit = 16;
  put(g, pit, 7 * TS); g.pupo.drowsyT = 3; g.pupo.shieldT = 0; p.vy = 0; G.step(g, 1 / 120); p.hurt({ x: p.x, w: 10 });
  const Ar = g.area;
  C.check('a nap over a pit: he is back asleep in the last Nap Box, the box closed again', !p.pupoRide && g.pupo.where === 'box' && Ar.tiles[8 * Ar.W + 7] === T.QBLOCK && g.entities.find(e => e.isNapBox).state === 'closed', { where: g.pupo.where, tile: Ar.tiles[8 * Ar.W + 7] });
  put(g, 3, 9 * TS); G.step(g, 0.5); G.step(g, 1.2, { right: true }); G.step(g, 0.05, { actionPressed: true }); G.step(g, 0.2);
  C.check('...and that box opens again with him inside', g.pupo.free && g.pupo.where === 'free');
});

C.section(want, 'carry', () => {
  let g = ridingYard(), p = g.player;
  const doors = g.entities.filter(e => e.constructor.name === 'Portal'), toShed = doors.find(d => d.target.area === 2), toLoft = doors.find(d => d.target.area === 1);
  const R0 = G.run('PupoRide');
  C.check('noPupo: the shed (pupoOk: false) is closed to him, the yard and the loft are open', !R0.allowed(g.level, 2) && R0.allowed(g.level, 0) && R0.allowed(g.level, 1));
  const lv = (A, extra) => ({ areas: [Object.assign({ gen: 'room', spawns: [] }, A)], arch: (extra && extra.arch) || 'lab' });
  C.check('noPupo defaults: rails, rides, autoscroll, carry, flip bands, scroll and glide levels, boss arenas', [lv({ gen: 'rail' }), lv({ gen: 'ride' }), lv({ autoscroll: 2 }), lv({ autoscrollY: { speed: 1 } }), lv({ carry: {} }), lv({ hasFlip: true }), lv({}, { arch: 'scroll' }), lv({}, { arch: 'glide' }), lv({ spawns: [{ type: 'boss' }] })].every(L => !R0.allowed(L, 0)) && R0.allowed(lv({}), 0));
  // through a door into an allowed area: still riding
  put(g, toLoft.cx / TS - 0.5, toLoft.y + toLoft.h); G.step(g, 0.2); g.enterPortal(toLoft); G.step(g, 1.5);
  p = g.player;
  C.check('through a door into another area: Pupo goes along, still ridden (a new Player)', g.area.aid === 'loft' && p.pupoRide && p.w === K.W && p.h === K.H, { area: g.area.aid, ride: p.pupoRide });
  const back = g.entities.find(e => e.constructor.name === 'Portal'); put(g, back.cx / TS - 0.5, back.y + back.h); G.step(g, 0.2); g.enterPortal(back); G.step(g, 1.5); p = g.player;
  // a door into the shed: Pupo waits on the near side
  put(g, toShed.cx / TS - 0.5, toShed.y + toShed.h); G.step(g, 0.2); g.enterPortal(toShed);
  const parked = g.pupo.free;
  G.step(g, 1.5); p = g.player;
  C.check('a door into a noPupo area: Pupo hops off on the near side and sits by the door; Brady goes in alone', g.area.aid === 'shed' && !p.pupoRide && g.pupo.where === 'parked' && parked && g.rt[0].entities.indexOf(parked) >= 0, { area: g.area.aid, where: g.pupo.where });
  const out = g.entities.find(e => e.constructor.name === 'Portal'); put(g, out.cx / TS - 0.5, out.y + out.h); G.step(g, 0.2); g.enterPortal(out); G.step(g, 1.5); p = g.player;
  C.check('coming back through that door, Brady remounts automatically', g.area.aid === 'yard' && p.pupoRide && parked.remove);
  // the checkpoint carries met and the meter; a respawn puts Pupo beside Brady
  const cp = g.entities.find(e => e.constructor.name === 'Checkpoint'); put(g, cp.cx / TS - 0.5, cp.y + cp.h); G.step(g, 0.2);
  C.check('the checkpoint object carries pupo: true and the meter', g.checkpoint && g.checkpoint.pupo === true && near(g.checkpoint.meter, g.pupo.meter, 0.05), g.checkpoint);
  g.pupo.meter = 0.8; G.step(g, 0.01); g.setCheckpoint(cp.cx, cp.y + cp.h);
  p.die('pit'); C.check('dying while riding: Pupo goes back to his box (Brady falls alone)', !p.pupoRide && p.dead && p.w === (p.power ? 22 : 20));
  G.step(g, 3.5); let g2 = G.scene();
  for (let i = 0; i < 20 && g2 === g; i++) { G.step(g, 0.2); g2 = G.scene(); }
  const f2 = g2.pupo && g2.pupo.free;
  C.check('a respawn at the checkpoint: Pupo sits beside Brady, the meter as it was', g2 !== g && f2 && f2.mode === 'sit' && Math.abs(f2.cx - g2.player.cx) < 2 * TS && near(g2.pupo.meter, 0.8, 0.02) && g2.pupo.met, { meter: g2.pupo && g2.pupo.meter, free: !!f2 });
  // the level clear: he waves and climbs into his box; nothing is carried over
  g2.state = 'play'; g2.fade.a = 0; g2.fade.target = 0; G.step(g2, 0.5, { right: true }); G.step(g2, 0.3);
  const q = g2.player;
  C.check('back on after the respawn', q.pupoRide);
  g2.levelClear({ cx: q.cx + 60, y: q.y, exitKey: 'main' });
  const pack = g2.entities.find(e => e.pupoFree && e.mode === 'pack');
  C.check('the level clear: Brady hops off, Pupo waves and climbs into his box', !q.pupoRide && q.w !== K.W && pack, { ride: q.pupoRide, pack: !!pack });
  G.step(g2, 2.0);
  C.check('...and is gone into it', pack.remove);
});

C.section(want, 'hooks', () => {
  // the run state rides the secrets' TourHooks (areaLoaded, levelClear), not a wrapper of Play.loadArea / levelClear
  const TH = G.run('TourHooks'), PL = G.run('Play.prototype');
  const al = TH.areaLoaded.filter(f => /PupoRide/.test(String(f))), lc = TH.levelClear.filter(f => /PupoRide/.test(String(f)));
  C.check('Pupo registers on TourHooks.areaLoaded and .levelClear and wraps neither Play.loadArea nor Play.levelClear', al.length === 1 && lc.length === 1 && !/PupoRide/.test(String(PL.loadArea)) && !/PupoRide/.test(String(PL.levelClear)));
  // without the areaLoaded handler a door would drop him: the hook is what carries the ride
  let g = ridingYard(); const loft = g.entities.find(e => e.constructor.name === 'Portal' && e.target.area === 1);
  TH.off('areaLoaded', al[0]); put(g, loft.cx / TS - 0.5, loft.y + loft.h); G.step(g, 0.2); g.enterPortal(loft); G.step(g, 1.5);
  const without = g.player.pupoRide; TH.on('areaLoaded', al[0]);
  g = ridingYard(); put(g, loft.cx / TS - 0.5, loft.y + loft.h); G.step(g, 0.2); g.enterPortal(g.entities.find(e => e.constructor.name === 'Portal' && e.target.area === 1)); G.step(g, 1.5);
  C.check('through TourHooks.areaLoaded: the ride survives the door (and not without the handler)', g.player.pupoRide && !without, { with: g.player.pupoRide, without });
  const q = g.player; g.levelClear({ cx: q.cx + 60, y: q.y, exitKey: 'main' });
  C.check('through TourHooks.levelClear: Pupo packs into his box at the clear', !q.pupoRide && g.entities.some(e => e.pupoFree && e.mode === 'pack'));
});

C.section(want, 'none', () => {
  // a level without a Nap Box: nothing of Pupo shows or changes
  const g = G.lab('power'); const A = g.area; A.tiles[9 * A.W + 7] = T.EMPTY; delete A.contents['7,9'];
  for (const e of g.entities) if (e.isNapBox) e.remove = true;
  G.step(g, 0.3); G.step(g, 1.5, { right: true }); G.step(g, 0.05, { jump: true, jumpPressed: true }); G.step(g, 1.0, { left: true }); G.step(g, 0.05, { actionPressed: true }); G.step(g, 0.5, { down: true });
  const p = g.player;
  C.check('no Nap Box: no Pupo, Brady\'s own box and moves', !p.pupoRide && (!g.pupo || g.pupo.where === 'none') && p.w === 20 && !g.entities.some(e => e.pupoFree));
  // the wrappers pass straight through without him
  const ppf = G.run('playerPhysicsFlip'), mk = () => ({ x: 64, y: 100, w: 20, h: 28, vx: 0, vy: 0, onGround: true, coyote: 0, jumpBuf: 0, jumping: false, runT: 0, airMax: 0, facing: 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, ride: null, dropT: 0 });
  const a = mk(); for (let i = 0; i < 60; i++) ppf(a, { right: true }, A, 1 / 120, [], { speedMul: 1 });
  C.check('Brady alone keeps his speed through the physics wrapper', near(a.vx / TS, 6.2, 0.05), a.vx / TS);
});

C.section(want, 'draw', () => {
  // every state draws without an error (the canvas is a stub that accepts everything)
  const g = ridingYard(), p = g.player, ctx = G.run('Game.canvas.getContext ? null : null') || G.run("document.createElement('canvas').getContext('2d')");
  let err = null;
  const draw = () => { try { g.draw(ctx); } catch (e) { err = err || String(e.stack).slice(0, 300); } };
  draw(); p.collect('mushroom'); G.step(g, 0.5); draw();
  g.pupo.drowsyT = 4; draw(); g.pupo.shieldT = 1; g.pupo.powerShield = 1; draw();
  G.step(g, 0.2, { down: true }); draw();
  R.dismount(p, 'nap'); draw(); G.step(g, 0.3); draw();
  const f = g.pupo.free; f.setMode('wake'); draw(); f.setMode('unfold'); f.mt = 0.5; draw(); f.setMode('pack'); f.mt = 1.3; draw();
  for (const e of g.entities) if (e.isNapBox) { e.close(); draw(); e.open(); draw(); }
  C.check('riding, drowsy, shielded, flopped, asleep, waking, unfolding, packing and both boxes draw without errors', !err, err);
});

C.done();
