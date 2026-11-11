/* ============================================================
   ART CART — BATTLE ROYALE (C2). Objective 'royale' (mode 'royale' turns it on):
   car combat where the point is to knock the other art cars out.
     · every car has 120 HP; every weapon, gift-box item, car / driver special, ram and arena hazard does damage
       (CART_ROY_DMG, by weapon/item id, else by hit kind: CART_ROY_KIND); WATER and REPAIR KITS heal
     · rams: damage by closing speed, boosted rammers hit harder, heavier cars take less
     · knock-out: lights out, the car pops up, then POOF (a cartoon smoke-and-stars puff) and it's gone
     · places by survival order; the player out: spectate the car that got you, tap to skip to quick results
     · big arenas, spread spawns, 3 s of spawn protection, repair kits, a closing DUST STORM so a match ends in ~3–4 min
     · AI roams, hunts, flees when weak, heals, and spreads its targets (never more than 2 AI on the player)
     · phone aim assist: forward weapons swing onto a target inside a cone
     · HUD: health bar, alive count, radar (storm ring, rivals, kits), bars over rivals, off-screen arrows
   Works in any arena (C1 uses old arenas as stand-ins); an arena may add E.royale = { R, x, z, ends: [[x,z]...],
   repairs: [[x,z]...], route(k, G), avoid: [[x,z,r]...], storm: { name, col } } and rules hooks royaleWon(s) (the
   final: start the boss instead of ending), bossHit(s, src, kind, o).
   Hooks in the shared scene (small, generic): this.ofx (the objective's fx) → onHit, ram (this.onRam), aiGoal,
   hud, draw, render, finish; k.hidden (not drawn), this.camKart (spectate camera).
   Result for the career flow: s.royaleResult = { arena, places: [kart ids], cars, playerPlace, won, top3, bossDefeated,
   time }, opts.onResult(result) when the results show; the final sets s.stageWon (true only when the Man burns).
   ============================================================ */
const CART_ROYALE = {
  hp: 120, time: 240, protect: 3, invT: 1.4,
  storm: { start: 70, end: 205, minR: 26, dps: 6 },   // the safe zone holds for 70 s, then closes to 26 m by 3:25
  final: 'man', arenas: { heart: 'sound' }
};
// C1's registries (43_cart_h_career.js): assign, never redeclare
var CART_ROYALE_ARENAS = (typeof CART_ROYALE_ARENAS !== 'undefined' && CART_ROYALE_ARENAS) || {};
var CART_STAGE_MODES = (typeof CART_STAGE_MODES !== 'undefined' && CART_STAGE_MODES) || {};
CART_STAGE_MODES.royale = true;

/* ---------------- the damage table (HP out of 120) ----------------
   by weapon / item id; anything not listed falls back to its hit kind. Not here because they don't attack:
   GLOW RUSH (boosted rams hit 1.5x), DISCO SHIELD (blocks the next hit, halves rams), WATER BOTTLE (+25 HP). */
const CART_ROY_DMG = {
  // signature weapons (reload 6–10 s)
  bassdrop: 22, dazzle: 16, torch: 22, fireball: 18, bubbles: 15, laser: 20, sprinkles: 22, cannon: 24, slime: 10, zap: 16, chomp: 26, geyser: 22,
  // gift-box items
  tumble: 12, devil: 18, potty: 18, foam: 10, whistle: 8, skymail: 24, bombs: 16, ducks: 6,
  // car specials
  throb: 10, decoys: 12, toss: 20, glide: 15, surf: 16, warp: 14, frosting: 10, wave: 20, shell: 12, hover: 12, dive: 20, breach: 22,
  // arena hazards and the Man
  tile: 9, subwave: 10, lovebomb: 12, firepit: 5, embervent: 12, stomp: 20, sweep: 18, ember: 12, emberfire: 5
};
const CART_ROY_KIND = { spin: 15, knock: 18, flip: 20, dazzle: 12, bubble: 14, stun: 14, slip: 10, foam: 10, whirl: 18, launch: 22, charm: 8, goo: 10, slow: 8 };
const CART_ROY_HEAL = { water: 25, repair: 35 };
// what the non-attacking items do here (the guide and the test read this)
const CART_ROY_NOTES = { glow: 'boosted rams hit 1.5x', shield: 'blocks the next hit, halves ram damage', water: 'repairs 25 HP' };
function cartRoyDmgOf(what, kind) { return CART_ROY_DMG[what] !== undefined ? CART_ROY_DMG[what] : CART_ROY_KIND[kind] !== undefined ? CART_ROY_KIND[kind] : 12; }

const CART_ROY_T = { p: {}, wd: {}, col: [1, 1, 1], arr: [] };
const CART_ROY_STORM_RGB = [1, 0.72, 0.4], CART_ROY_KIT_RGB = [0.35, 1, 0.55], CART_ROY_HURT_RGB = [1, 0.25, 0.35];

/* ---------------- damage, healing, knock-outs ---------------- */
function cartRoyDamage(s, k, n, src, what) {
  const R = s.roy; if (!R || !k.roy || k.out || n <= 0 || (s.obj && s.obj.ended)) return 0;
  if (R.phase === 2 && !k.player) return 0;
  n = Math.min(n, k.hp);
  k.hp -= n; k.roy.taken += n; k.roy.hurtT = 3; k.roy.flash = 0.5;
  const key = what || 'hit'; k.roy.dmgBy[key] = (k.roy.dmgBy[key] || 0) + n;
  if (src && src !== k && src.roy) { src.roy.dealt += n; k.roy.lastBy = src; }
  s.log('dmg', { k: k.id, by: src && src.id, src: key, n: +n.toFixed(1), hp: +k.hp.toFixed(1), player: k.player });
  if (k.player) { R.hurtFlash = 0.45; }
  if (k.hp <= 0.001) cartRoyKO(s, k, src, key);
  return n;
}
function cartRoyHeal(s, k, n, what) {
  if (!k.roy || k.out) return 0;
  const was = k.hp; k.hp = Math.min(k.hpMax, k.hp + n); const got = k.hp - was;
  if (got > 0) { k.roy.healed += got; s.log('heal', { k: k.id, src: what, n: +got.toFixed(1) }); if (s.fx) s.fx.burst(k.x, k.y + 1.6, k.z, 'cross', 8, '#5aff8a'); if (k.player) s.banner('+' + Math.round(got) + ' HP', '#5aff8a', 1.0, what === 'water' ? 'water bottle' : 'repair kit', true); }
  return got;
}
function cartRoyKO(s, k, src, what) {
  const R = s.roy;
  k.hp = 0; k.out = true; k.outT = s.raceT; k.anim = 'cartSulk'; k.roy.koT = 0; k.roy.poofed = false;
  k.roy.place = s.karts.filter(o => !o.out).length + 1; k.drift = 0; k.boostT = 0; k.item = null; k.roul = 0;
  // cartoon knock-out: the lights go out and the car hops up, spinning
  k.vy = 7.5; k.air = true; k.hop = true; k.spinT = 1.2; k.vx *= 0.3; k.vz *= 0.3;
  if (src && src !== k && src.roy) { src.roy.kos++; cartRoyHeal(s, src, 10, 'repair'); }
  R.koN++; if (R.firstKO === undefined) R.firstKO = s.raceT;
  s.log('ko', { k: k.id, by: src && src.id, src: what, place: k.roy.place, t: +s.raceT.toFixed(2), player: k.player });
  if (s.fx) { s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 18, '#ffe24a'); s.fx.smoke(k.x, k.y + 1.5, k.z, 10, '#4a4652'); }
  Sound.play('powerdown', { vol: k.player ? 0.95 : 0.45 });
  if (k.player) { s.banner('KNOCKED OUT!', '#ff6a6a', 2.4, cartOrdinal(k.roy.place) + ' PLACE' + (src && src !== k ? ' · by ' + src.car.name : '')); s.shakeIt(1); R.spect = src && src !== k && !src.out ? src : null; R.spectT = 0; }
  else s.banner(src && src.player ? 'KNOCKOUT! ' + k.car.name : k.car.name + ' IS OUT!', src && src.player ? '#7aff8a' : '#ffd84a', 1.6, (s.karts.filter(o => !o.out).length) + ' LEFT', true);
  if (src && src.player && !k.player) Sound.play('kartFinish', { vol: 0.45, pitch: 1.3 });
}
// the car's last hop ends in a POOF: a ball of smoke and stars, and it is gone
function cartRoyPoof(s, k) {
  k.roy.poofed = true; k.roy.poofT = 0.6; k.roy.px = k.x; k.roy.py = k.y; k.roy.pz = k.z; k.hidden = true; k.sunk = true; k.vx = 0; k.vz = 0;
  if (s.fx) { s.fx.burst(k.x, k.y + 1.4, k.z, 'puff', 22, '#e8e0f0'); s.fx.burst(k.x, k.y + 1.6, k.z, 'star', 14, k.car.col); s.fx.confetti(k.x, k.y + 1.5, k.z, 18); }
  Sound.play('break', { vol: k.player ? 0.8 : 0.35, pitch: 0.8 });
}

/* ---------------- rams (s.onRam from collideKarts; velocities before the bounce) ---------------- */
function cartRoyRamOne(s, a, v, ap) {
  if (ap < 9 || v.out || v.invT > 0 || v.immuneT > 0 || !v.roy || v.roy.ramT > 0) return;
  let d = (ap - 7) * 1.0;
  if (a.boostT > 0 || a.dashT > 0) d *= 1.5;                                  // GLOW RUSH, mini-turbos, CHOMP DASH
  d *= clamp(Math.sqrt(a.mass / 1.15), 0.8, 1.15) * clamp(1.1 - (v.mass - 0.85) * 0.33, 0.88, 1.1);   // weight: heavy hits harder, takes less
  if (v.shieldT > 0) d *= 0.5;
  d = Math.min(30, d);
  v.roy.ramT = 0.6;
  if (cartRoyDamage(s, v, d, a, 'ram') > 0) {
    if (s.fx) s.fx.spark((a.x + v.x) / 2, v.y + 1, (a.z + v.z) / 2, 10 + Math.round(d), '#ffd890', 9);
    if (v.player) s.banner('RAMMED! -' + Math.round(d), '#ff6a6a', 0.9, a.car.name, true);
    else if (a.player) s.banner('RAM! -' + Math.round(d), '#7aff8a', 0.8, v.car.name, true);
  }
}
function cartRoyRam(s, A, B, nx, nz) {
  if (!s.roy || s.state !== 'race' || s.roy.phase === 2 || !A.roy || !B.roy || A.roy.ramT > 0 || B.roy.ramT > 0) return;   // one ram per contact (no damage from the bounce)
  const aA = A.vx * nx + A.vz * nz, aB = -(B.vx * nx + B.vz * nz);
  cartRoyRamOne(s, A, B, aA); cartRoyRamOne(s, B, A, aB);
  if (A.roy.ramT > 0 || B.roy.ramT > 0) { A.roy.ramT = B.roy.ramT = 0.7; }
}

/* ---------------- aim assist: forward weapons swing onto a target inside a cone ---------------- */
function cartRoyAim(s, k) {
  const D = k.wpn.def; if (!/cone|shot|dash/.test(D.kind)) return;
  const tgt = s.roy && s.roy.aimAt ? s.roy.aimAt(s, k) : null;   // the final: aim at the Man
  let best = tgt, bs = 1e9;
  if (!best) for (const o of s.karts) {
    if (o === k || o.out || o.hidden) continue;
    const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > D.range * 1.05 || d < 2) continue;
    const a = Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)); if (a > 0.5) continue;
    const sc = d * (1 + a * 3); if (sc < bs) { bs = sc; best = o; }
  }
  if (!best) return;
  const want = cartWrap(Math.atan2(best.x - k.x, best.z - k.z) - k.yaw), turn = clamp(want, -0.4, 0.4);
  k.yaw = cartWrap(k.yaw + turn);
  const sp = Math.hypot(k.vx, k.vz), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); if (k.fwd > 0) { k.vx = fx * sp; k.vz = fz * sp; }
  s.log('aim', { k: k.id, at: best.id, turn: +turn.toFixed(2) });
}

/* ---------------- arena layout for the royale (any arena) ---------------- */
function cartRoyLayout(s) {
  const E = s.E, Ro = E.royale || {};
  let R0 = Ro.R || E.R || 0;
  if (!R0 && E.walls) for (const p of E.walls) R0 = Math.max(R0, Math.hypot(p[0], p[1]));
  R0 = R0 || 110;
  const ends = Ro.ends || [[0, 0]], e = ends[Math.floor(s.rng() * ends.length)];
  // repair kits: the arena's spots, else spread over the arena's orb / gift spots (farthest-point sampling)
  let rep = Ro.repairs;
  if (!rep) {
    const cand = (E.orbSpots || []).map(o => [o.x, o.z]).filter(p => !E.walls || s.wallDist(p[0], p[1], CART_ROY_T.wd).d > 8);
    rep = []; if (cand.length) { rep.push(cand[0]); while (rep.length < 6 && rep.length < cand.length) { let bi = -1, bd = -1; for (let i = 0; i < cand.length; i++) { let m = 1e9; for (const q of rep) m = Math.min(m, Math.hypot(cand[i][0] - q[0], cand[i][1] - q[1])); for (const g of E.gifts) m = Math.min(m, Math.hypot(cand[i][0] - g.x, cand[i][1] - g.z) + 4); if (m > bd) { bd = m; bi = i; } } rep.push(cand[bi]); } }
  }
  return { R0, x0: Ro.x || 0, z0: Ro.z || 0, ex: e[0], ez: e[1], rep, storm: Ro.storm || { name: 'DUST STORM', col: '#ffb870' } };
}

/* ---------------- the repair kits (one pooled mesh group, drawn by the render hook) ---------------- */
function cartRoyKitMesh(m) {
  m.color('#1fbf5a').shine(2); m.roundBox(0, 0, 0, 1.5, 1.0, 1.0, 0.18);
  m.color('#e8fff0').shine(1); m.roundBox(0, 0.02, 0, 1.54, 0.14, 1.04, 0.05);
  m.color('#2a2f36').shine(2); for (const sx of [1, -1]) m.limb(sx * 0.32, 0.45, 0, sx * 0.26, 0.78, 0, 0.05, 0.05, { seg: 5 }); m.limb(-0.27, 0.78, 0, 0.27, 0.78, 0, 0.055, 0.055, { seg: 6 });
  m.color('#ffffff', 0.9);
  for (const sz of [1, -1]) { m.roundBox(0, 0.02, sz * 0.51, 0.62, 0.16, 0.04, 0.03); m.roundBox(0, 0.02, sz * 0.51, 0.16, 0.62, 0.04, 0.03); }
  for (const sx of [1, -1]) { m.roundBox(sx * 0.76, 0.02, 0, 0.04, 0.16, 0.5, 0.03); m.roundBox(sx * 0.76, 0.02, 0, 0.04, 0.5, 0.16, 0.03); }
  m.emissive(0).shine(0);
}

/* ---------------- the objective ---------------- */
CART_OBJECTIVES.royale = {
  name: 'BATTLE ROYALE', short: 'Knock out the other art cars', time: CART_ROYALE.time, unit: ' KO',
  desc: 'Every car has 120 HP. Weapons, items, rams and hazards do damage. Grab repair kits, stay out of the closing storm. Last car running wins.',
  fx: {
    init(s) {
      const L = cartRoyLayout(s), E = s.E;
      s.isRoyale = true; s.onRam = function (A, B, nx, nz) { cartRoyRam(this, A, B, nx, nz); };
      if (!s.poolCar && E.arena && E.arena.levelCar) s.poolCar = E.arena.levelCar;   // a car's own arena: its special joins everyone's gift boxes
      const R = s.roy = { t: 0, phase: 1, koN: 0, firstKO: undefined, hurtFlash: 0, spect: null, spectT: 0, quick: false, endNow: false, protect: false, result: null, layout: L,
        zone: { x: L.x0, z: L.z0, r: L.R0 + 30, r0: L.R0 + 30, warned: false, tick: 0 }, kits: [], pulse: 0 };
      for (const k of s.karts) {
        k.hpMax = CART_ROYALE.hp; k.hp = k.hpMax;
        k.roy = { dmgBy: {}, dealt: 0, taken: 0, healed: 0, kos: 0, tgt: null, tgtT: 0, wp: [0, 0], wpT: 0, hurtT: 0, flash: 0, lastBy: null, ramT: 0, stormT: 0, calm: 3 + s.rng() * 6, goal: [0, 0], ret: { goal: null, prey: null }, koT: 0, poofed: false, place: 0 };
      }
      // repair kits
      const G = new BurnsGroup(Math.min(16, BurnsGL.maxBones || 16));
      for (const p of L.rep) { const o = G.add(m => cartRoyKitMesh(m), { visible: true }); o.gx = p[0]; o.gz = p[1]; o.alive = 1; o.t = 0; o.ph = s.rng() * 6; R.kits.push(o); }
      G.finish(); R.kitG = G;
      // aim assist for the player's forward weapons (and the autopilot)
      const fire0 = s.fireWeapon;
      s.fireWeapon = function (k) { if (k.player && this.roy) cartRoyAim(this, k); return fire0.call(this, k); };
      // WATER BOTTLE repairs
      const use0 = s.useItem;
      s.useItem = function (k) { const it = k.item, r = use0.call(this, k); if (it === 'water' && this.roy) cartRoyHeal(this, k, CART_ROY_HEAL.water, 'water'); return r; };
      // RANGER WHISTLE slows without a hit(), rubber ducks only slow you: here they sting a little
      const log0 = s.log;
      s.log = function (type, o) { const e = log0.call(this, type, o); if (type === 'duck' && o && this.roy) { const v = this.karts.find(q => q.id === o.k), b = this.karts.find(q => q.id === o.by); if (v && v.roy && !v.out && (v.roy.duckT || 0) <= this.raceT) { v.roy.duckT = this.raceT + 0.6; cartRoyDamage(this, v, CART_ROY_DMG.ducks, b !== v ? b : null, 'ducks'); } }
        if (type === 'hit' && o && o.kind === 'slow' && o.item && this.roy) { const v = this.karts.find(q => q.id === o.k), b = this.karts.find(q => q.id === o.by); if (v && v.invT <= 0) cartRoyDamage(this, v, cartRoyDmgOf(o.item, 'slow'), b, o.item); } return e; };
    },
    update(s, dt) {
      const R = s.roy, K = s.karts, O = s.obj; if (!R) return false;
      R.t += dt; R.pulse += dt;
      if (!R.protect) { R.protect = true; for (const k of K) k.invT = Math.max(k.invT, CART_ROYALE.protect); if (s.player) s.banner('3 S SPAWN PROTECTION', '#9af0ff', 1.6, 'spread out, grab gift boxes', true); }
      if (R.hurtFlash > 0) R.hurtFlash -= dt;
      // per-car timers, knock-out poofs
      for (const k of K) {
        const r = k.roy; if (!r) continue;
        if (r.ramT > 0) r.ramT -= dt; if (r.hurtT > 0) r.hurtT -= dt; if (r.flash > 0) r.flash -= dt; if (r.tgtT > 0) r.tgtT -= dt; if (r.wpT > 0) r.wpT -= dt;
        if (k.out && !r.poofed) { r.koT += dt; if (r.koT > 1.5) cartRoyPoof(s, k); }
        if (r.poofT > 0) r.poofT -= dt;
      }
      if (R.phase === 2) return R.endNow;   // the final's boss fight (its rules drive it)
      // the storm: holds, then closes on the end point
      const Z = R.zone, ST = CART_ROYALE.storm, u = clamp((R.t - ST.start) / (ST.end - ST.start), 0, 1), e = u * u * (3 - 2 * u);
      Z.r = lerp(Z.r0, ST.minR, e); Z.x = lerp(R.layout.x0, R.layout.ex, e); Z.z = lerp(R.layout.z0, R.layout.ez, e);
      if (!Z.warned && R.t > ST.start - 10) { Z.warned = true; s.banner('THE ' + R.layout.storm.name + ' IS COMING', R.layout.storm.col, 2.2, 'stay inside the ring', false); Sound.play('dust', { vol: 0.7 }); }
      Z.tick -= dt;
      if (Z.tick <= 0) {
        Z.tick = 0.5;
        const late = R.t > ST.end + 15 ? 2 : 1;
        for (const k of K) { if (k.out) continue; const d = Math.hypot(k.x - Z.x, k.z - Z.z); k.roy.inStorm = d > Z.r; if (d > Z.r) { k.roy.stormT += 0.5; cartRoyDamage(s, k, ST.dps * 0.5 * late, null, 'storm'); } }
      }
      // repair kits
      for (const o of R.kits) {
        if (!o.alive) { o.t -= dt; if (o.t <= 0) { o.alive = 1; if (s.fx) s.fx.burst(o.gx, 1.2, o.gz, 'star', 8, '#5aff8a'); } continue; }
        for (const k of K) { if (k.out || k.hp >= k.hpMax - 0.5) continue; const dx = k.x - o.gx, dz = k.z - o.gz; if (dx * dx + dz * dz < 7.3 && Math.abs(k.y - s.terrain.height(o.gx, o.gz)) < 2.5) { o.alive = 0; o.t = 18; cartRoyHeal(s, k, CART_ROY_HEAL.repair, 'repair'); Sound.play('pick', { vol: k.player ? 0.8 : 0.25, pitch: 1.2 }); break; } }
      }
      // AI use their WATER when hurt
      for (const k of K) if (!k.player && !k.out && k.item === 'water' && k.hp < 72 && k.ai && k.ai.itemT > -2.5) k.ai.itemT = -3;
      // the end: one car left (the final starts its boss instead), or the player is out and skips / waits it out
      const alive = R.aliveN = K.reduce((n, k) => n + (k.out ? 0 : 1), 0);
      const P = s.player;
      if (alive <= 1) { if (alive === 1 && !P.out && s.rules.royaleWon && s.rules.royaleWon(s)) return false; return true; }
      if (P && P.out && !R.keepGoing) {   // (tests: keepGoing plays an AI-only match to the end)
        if (R.spect && R.spect.out) R.spect = K.find(k => !k.out) || null;
        if (!R.spect) R.spect = K.reduce((b, k) => (!k.out && (!b || k.hp > b.hp) ? k : b), null);
        s.camKart = R.spect; R.spectT += dt;
        const tap = Input.taps.length || Input.jumpPressed || Input.actionPressed || (Input.hudPressed && Input.hudPressed.fire);
        if ((R.spectT > 1.5 && tap) || R.spectT > 9 || s.autoDrive && R.spectT > 2) { R.quick = true; return true; }
      }
      if (O.time <= 0 && s.rules.royaleWon && this.rank(s)[0] === P && !P.out && s.rules.royaleWon(s)) return false;
      return false;
    },
    // a hit landed (hit() already applied the cartoon effect): damage by what did it
    onHit(s, k, src, kind, o) {
      if (!s.roy) return;
      if (k.bossProxy) { if (s.rules.bossHit) s.rules.bossHit(s, src, kind, o); return; }
      const what = (o && (o.weapon || o.item)) || kind;
      cartRoyDamage(s, k, cartRoyDmgOf(what, kind), src && src !== k ? src : null, what);
      if (!k.out) k.invT = Math.min(k.invT, CART_ROYALE.invT);
    },
    rank(s) {
      // alive cars by HP, then the knocked-out by how long they lasted
      const A = CART_ROY_T.arr; A.length = 0; for (const k of s.karts) A.push(k);
      return A.slice().sort((a, b) => (a.out - b.out) || (a.out ? (b.outT || 0) - (a.outT || 0) : b.hp - a.hp) || ((b.roy ? b.roy.kos : 0) - (a.roy ? a.roy.kos : 0)));
    },
    score(k) { return k.roy ? k.roy.kos : 0; },
    aiGoal(s, k, nearestRival) { return cartRoyAI(s, k); },
    hud(s, ctx, top, left) { cartRoyHud(s, ctx, top, left); return true; },
    draw(s, R, S, t) { cartRoyDraw(s, R, S, t); },
    render(s, R) { const G = s.roy && s.roy.kitG; if (!G) return; const t = s.time; for (const o of s.roy.kits) { o.visible = !!o.alive; if (!o.alive) continue; o.x = o.gx; o.z = o.gz; o.y = s.terrain.height(o.gx, o.gz) + 1.1 + Math.sin(t * 2.4 + o.ph) * 0.2; o.yaw = t * 1.1 + o.ph; o.scale = 1; } G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); },
    // results: the career flow's verdict and the callback
    finish(s) {
      const R = s.roy; if (!R || R.result) return;
      const order = s.finalOrder || this.rank(s), P = s.player, place = order.indexOf(P) + 1;
      R.result = { arena: s.arenaId, places: order.map(k => k.id), cars: order.map(k => k.car.id), playerPlace: place, won: place === 1, top3: place <= 3, bossDefeated: !!R.bossDefeated, boss: R.phase === 2, time: +s.raceT.toFixed(1), kos: P.roy ? P.roy.kos : 0, quick: R.quick };
      if (s.rules.finishResults) s.rules.finishResults(s);   // the final: a lost fight puts THE MAN on top
      s.royaleResult = R.result;
      if (s.rules.royaleFinal) s.stageWon = !!R.bossDefeated;   // the final: only destroying the Man wins it
      s.log('royaleResult', R.result);
      if (s.opts.onResult) try { s.opts.onResult(R.result, s); } catch (e) { console.error(e); }
    }
  }
};

/* ---------------- AI: roam, hunt (spread out: max 2 on the player), heal, flee, stay out of the storm ---------------- */
function cartRoyHunters(s, o, except) { let n = 0; for (const k of s.karts) if (k !== except && !k.out && !k.player && k.roy && k.roy.tgt === o && k.roy.tgtT > 0) n++; return n; }
function cartRoyAI(s, k) {
  const R = s.roy, r = k.roy; if (!R || !r || R.phase === 2) return null;
  const Z = R.zone, G = r.goal, ret = r.ret, E = s.E, Ro = E.royale; ret.goal = G; ret.prey = null;
  const dz = Math.hypot(k.x - Z.x, k.z - Z.z);
  let mode = 'roam';
  // 1) the storm: head in
  if (dz > Z.r - 7 && R.t > CART_ROYALE.storm.start - 5) { const a = Math.atan2(k.x - Z.x, k.z - Z.z) + 0.5; G[0] = Z.x + Math.sin(a) * Z.r * 0.35; G[1] = Z.z + Math.cos(a) * Z.r * 0.35; mode = 'storm'; }
  // 2) hurt: the nearest repair kit
  if (mode === 'roam' && k.hp < 45) { let b = null, bd = 130; for (const o of R.kits) { if (!o.alive || Math.hypot(o.gx - Z.x, o.gz - Z.z) > Z.r) continue; const d = Math.hypot(o.gx - k.x, o.gz - k.z); if (d < bd) { bd = d; b = o; } } if (b) { G[0] = b.gx; G[1] = b.gz; mode = 'heal'; } }
  // 3) badly hurt and just hit: run from the attacker
  if ((mode === 'roam' || mode === 'heal') && k.hp < 30 && r.hurtT > 1.5 && r.lastBy && !r.lastBy.out && Math.hypot(r.lastBy.x - k.x, r.lastBy.z - k.z) < 30) {
    const a = Math.atan2(k.x - r.lastBy.x, k.z - r.lastBy.z); let x = k.x + Math.sin(a) * 45, z = k.z + Math.cos(a) * 45; const d = Math.hypot(x - Z.x, z - Z.z); if (d > Z.r * 0.85) { x = Z.x + (x - Z.x) / d * Z.r * 0.85; z = Z.z + (z - Z.z) / d * Z.r * 0.85; }
    if (mode !== 'heal') { G[0] = x; G[1] = z; } mode = mode === 'heal' ? 'heal' : 'flee';
  }
  // 4) hunt: a target in sight (spread: a crowded target scores worse, at most two hunters on the player)
  if (mode === 'roam' && s.raceT > r.calm) {
    let t = r.tgt;
    if (!t || t.out || t.hidden || r.tgtT <= 0 || Math.hypot(t.x - k.x, t.z - k.z) > 95 || (t.player && cartRoyHunters(s, t, k) >= 2)) {
      t = null; let bs = 1e9;
      for (const o of s.karts) {
        if (o === k || o.out || o.hidden) continue;
        const d = Math.hypot(o.x - k.x, o.z - k.z); if (d > 80) continue;
        const h = cartRoyHunters(s, o, k); if (o.player && h >= 2) continue;
        const sc = d + o.hp * 0.3 + h * 32 - (o === r.lastBy ? 35 : 0) + (o.invT > 1 ? 20 : 0);
        if (sc < bs) { bs = sc; t = o; }
      }
      r.tgt = t; r.tgtT = t ? 4 + s.rng() * 4 : 0;
    }
    if (t) { ret.prey = t; mode = 'hunt'; }
  }
  // 5) no item: a gift box close by
  if ((mode === 'roam' || (mode === 'hunt' && Math.hypot(ret.prey.x - k.x, ret.prey.z - k.z) > 35)) && !k.item && k.roul <= 0) {
    let b = null, bd = 34; for (const g of s.props.gifts) { if (!g.alive) continue; const d = Math.hypot(g.gx - k.x, g.gz - k.z); if (d < bd) { bd = d; b = g; } }
    if (b) { G[0] = b.gx; G[1] = b.gz; ret.prey = null; mode = 'gift'; }
  }
  // 6) roam: a waypoint of its own, somewhere inside the zone
  if (mode === 'roam') {
    if (r.wpT <= 0 || Math.hypot(r.wp[0] - k.x, r.wp[1] - k.z) < 10 || Math.hypot(r.wp[0] - Z.x, r.wp[1] - Z.z) > Z.r * 0.9) {
      const a = (k.slot / s.karts.length) * TAU + s.rng() * 1.6 + R.t * 0.05, d = Z.r * (0.25 + s.rng() * 0.5);
      r.wp[0] = Z.x + Math.sin(a) * d; r.wp[1] = Z.z + Math.cos(a) * d; r.wpT = 6 + s.rng() * 5;
    }
    G[0] = r.wp[0]; G[1] = r.wp[1];
  }
  r.mode = mode;
  // keep clear of the arena's no-go spots (fire pits, the dance floor when it pulses…) and route through gaps in walls
  if (Ro && Ro.avoid && !ret.prey) for (const a of Ro.avoid) { const dx = G[0] - a[0], dz2 = G[1] - a[1], d = Math.hypot(dx, dz2); if (d < a[2] + 3) { G[0] = a[0] + dx / (d || 1) * (a[2] + 5); G[1] = a[1] + dz2 / (d || 1) * (a[2] + 5); } }
  if (Ro && Ro.route) { const tx = ret.prey ? ret.prey.x : G[0], tz = ret.prey ? ret.prey.z : G[1]; if (Ro.route(k.x, k.z, tx, tz, G)) ret.prey = null; }
  return ret;
}

/* ---------------- drawing: the storm wall, the kits' glow, hurt cars smoking ---------------- */
function cartRoyDraw(s, R, S, t) {
  const Y = s.roy; if (!Y) return;
  const cam = s.cam, H = s.terrain;
  // repair kits: a green halo and a soft ring on the ground
  for (const o of Y.kits) { if (!o.alive) continue; const dx = o.gx - cam.x, dz = o.gz - cam.z; if (dx * dx + dz * dz > 160 * 160) continue; const gy = H.height(o.gx, o.gz); R.bbs.bb(o.gx, gy + 1.2, o.gz, 4, 4, S.glow, CART_ROY_KIT_RGB, 0.55, true); R.flat.flat(o.gx, gy + 0.06, o.gz, 4.4, 4.4, t * 0.7 + o.ph, S.ring, CART_ROY_KIT_RGB, 0.5 + 0.2 * Math.sin(t * 3 + o.ph), true); R.bbs.streak(o.gx, gy + 5, o.gz, 0, 1, 0, 8, 0.6, S.streak, CART_ROY_KIT_RGB, 0.35); }
  // knock-outs: dizzy stars circling the dark car, then the POOF flash
  for (const k of s.karts) {
    const r = k.roy; if (!r || !k.out) continue;
    if (!r.poofed && k._in) { const top = k.y + (k.M ? k.M.h : 3) + 0.6; for (let i = 0; i < 4; i++) { const a = t * 5 + i * TAU / 4; R.bbs.bb(k.x + Math.sin(a) * 1.6, top + Math.sin(a * 2) * 0.2, k.z + Math.cos(a) * 1.6, 1.1, 1.1, S.star, CART_ROY_T.gold || (CART_ROY_T.gold = [1, 0.9, 0.3]), 0.95, true, t * 4); } R.bbs.bb(k.x, top - 0.4, k.z, 6, 6, S.glow, CART_ROY_HURT_RGB, 0.35 + 0.25 * Math.sin(t * 12), true); }
    if (r.poofT > 0) { const u = 1 - r.poofT / 0.6; R.bbs.bb(r.px, r.py + 1.6, r.pz, 6 + u * 14, 6 + u * 14, S.glow, CART_ROY_T.white || (CART_ROY_T.white = [1, 1, 1]), (1 - u) * 0.9, true); R.flat.flat(r.px, H.height(r.px, r.pz) + 0.1, r.pz, 4 + u * 18, 4 + u * 18, 0, S.ring, CART_ROY_T.white, 1 - u, true); }
  }
  // hurt cars smoke; the low-HP ones spark
  for (const k of s.karts) { if (k.out || !k._in || !k.roy) continue; if (k.hp < 50 && Math.random() < (k.hp < 25 ? 0.5 : 0.18)) s.fx.add(k.x + (Math.random() - 0.5), k.y + (k.M ? k.M.h * 0.6 : 2), k.z + (Math.random() - 0.5), 0, 1.6, 0, 1.6, 0.5, 1.8, k.hp < 25 ? [0.2, 0.18, 0.2] : [0.45, 0.43, 0.46], 0.45, 'smoke', 4); if (k.hp < 25 && Math.random() < 0.2) s.fx.spark(k.x, k.y + 1.4, k.z, 3, '#ffb040', 4); }
  if (Y.phase === 2) return;
  // the storm: posts of swirling dust round the zone edge, the near ones only, and dust blowing in
  const Z = Y.zone; if (Z.r > Y.layout.R0 + 5) return;
  const col = burnsRGBf(Y.layout.storm.col), n = Math.max(24, Math.round(TAU * Z.r / 7)), cd = Math.hypot(cam.x - Z.x, cam.z - Z.z);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + t * 0.05, px = Z.x + Math.sin(a) * Z.r, pz = Z.z + Math.cos(a) * Z.r, dx = px - cam.x, dz = pz - cam.z; if (dx * dx + dz * dz > 140 * 140) continue;
    const gy = H.height(px, pz), w = 0.6 + 0.4 * Math.sin(t * 2 + i);
    R.bbs.streak(px, gy + 4, pz, 0, 1, 0, 8, 3.2, S.streak, col, 0.28 * w); if (i % 2 === 0) R.bbs.bb(px, gy + 1.5, pz, 7, 5, S.smoke, col, 0.25, false);
    if (Math.random() < 0.05) s.fx.add(px, gy + 0.5 + Math.random() * 3, pz, -Math.cos(a) * 3, 0.3, Math.sin(a) * 3, 2.5, 2, 5, col, 0.25, 'puff', 4);
  }
  void cd;
}

/* ---------------- HUD: health, alive count, storm, radar, bars over rivals, off-screen arrows ---------------- */
function cartRoyBar(ctx, x, y, w, h, f, col, back) {
  ctx.fillStyle = back || 'rgba(10,4,20,0.7)'; burnsRR(ctx, x, y, w, h, h / 2); ctx.fill();
  if (f > 0) { ctx.fillStyle = col; burnsRR(ctx, x + 1.5, y + 1.5, Math.max(h - 3, (w - 3) * clamp(f, 0, 1)), h - 3, (h - 3) / 2); ctx.fill(); }
}
const cartRoyHpCol = f => f > 0.6 ? '#5aff8a' : f > 0.3 ? '#ffd84a' : '#ff4a5a';
function cartRoyHud(s, ctx, top, left) {
  const Y = s.roy, k = s.player, W = Game.cssW, H = Game.cssH, portrait = H > W, t = s.time, L = Input.layout; if (!Y || !k) return;
  const racing = s.state === 'race';
  // damage flash at the screen edge
  if (Y.hurtFlash > 0) { const a = Y.hurtFlash / 0.45; const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${0.45 * a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (k.roy && k.roy.inStorm && !k.out && racing) { ctx.fillStyle = `rgba(200,140,80,${0.22 + 0.08 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, W, H); }
  // ---- the player's health ----
  const pw = portrait ? 150 : 176, f = k.hp / k.hpMax;
  ctx.save(); ctx.fillStyle = 'rgba(10,4,20,0.5)'; burnsRR(ctx, left - 6, top - 4, pw + 12, 58, 12); ctx.fill(); ctx.restore();
  ctx.fillStyle = k.car.col; ctx.beginPath(); ctx.arc(left + 7, top + 9, 6, 0, TAU); ctx.fill();
  BurnsUI.text(ctx, k.out ? 'OUT' : Math.ceil(k.hp) + ' HP', left + 18, top + 9, 14, k.out ? '#ff6a6a' : '#ffffff', { align: 'left', ui: true });
  BurnsUI.text(ctx, Y.phase === 2 ? 'FINAL BOSS' : (Y.aliveN || s.karts.length) + ' LEFT · ' + (k.roy ? k.roy.kos : 0) + ' KO', left + pw, top + 9, 11, '#ffd84a', { align: 'right', ui: true });
  const shake = k.roy && k.roy.flash > 0 ? (Math.random() - 0.5) * 4 : 0;
  cartRoyBar(ctx, left + shake, top + 21, pw, 13, f, f < 0.3 && Math.sin(t * 10) > 0 ? '#ff8a8a' : cartRoyHpCol(f));
  if (k.invT > 0 && racing && s.raceT < CART_ROYALE.protect + 0.2) BurnsUI.text(ctx, 'PROTECTED ' + k.invT.toFixed(1), left, top + 44, 10, '#9af0ff', { align: 'left', ui: true });
  else if (Y.phase !== 2) {
    const Z = Y.zone, ST = CART_ROYALE.storm, sn = Y.layout.storm.name;
    const txt = k.roy && k.roy.inStorm ? 'IN THE ' + sn + '! GET INSIDE' : Y.t < ST.start ? sn + ' IN ' + cartFmtClock(ST.start - Y.t) : Y.t < ST.end ? sn + ' CLOSING' : sn + ' CLOSED';
    BurnsUI.text(ctx, txt, left, top + 44, 10, k.roy && k.roy.inStorm ? '#ff9a5a' : 'rgba(255,220,180,0.85)', { align: 'left', ui: true }); void Z;
  }
  // ---- clock ----
  if (Y.phase !== 2 && s.obj) BurnsUI.text(ctx, cartFmtClock(s.obj.time), W / 2, top + 10, 13, s.obj.time < 20 ? '#ff6a6a' : 'rgba(255,255,255,0.85)', { ui: true });
  // ---- radar ----
  const RS = portrait ? 86 : 96, rx = W - Math.max(14, insets.r + 6) - (portrait ? RS : RS + 48), ry = portrait ? top + 48 : top;
  cartRoyRadar(s, ctx, rx, ry, RS);
  if (!racing) return;
  // ---- bars over rivals, arrows for the ones off screen ----
  const p = CART_ROY_T.p, Rr = s.R;
  for (const o of s.karts) {
    if (o === k || o.out || o.hidden || !o.roy) continue;
    const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz), hunting = o.roy.tgt === k && o.roy.tgtT > 0;
    const on = Rr.project(o.x, o.y + (o.M ? o.M.h : 3) + 1.2, o.z, W, H, p) && p.x > 0 && p.x < W && p.y > 0 && p.y < H;
    if (on && d < 90) {
      const bw = clamp(60 - d * 0.35, 30, 54), fo = o.hp / o.hpMax, a = d > 70 ? 1 - (d - 70) / 20 : 1;
      ctx.save(); ctx.globalAlpha = a; cartRoyBar(ctx, p.x - bw / 2, p.y - 4, bw, 7, fo, cartRoyHpCol(fo)); if (o.roy.flash > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; burnsRR(ctx, p.x - bw / 2, p.y - 4, bw, 7, 3.5); ctx.stroke(); }
      if (hunting) { ctx.fillStyle = '#ff3a4a'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x - 5, p.y - 14); ctx.lineTo(p.x + 5, p.y - 14); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    } else if (!on && d < 70) {
      // the arrow at the screen edge, in the direction of the car relative to the camera
      const cy = s.camYaw !== undefined ? s.camYaw : k.yaw, a = cartWrap(Math.atan2(dx, dz) - cy), ex = W / 2 - Math.sin(a) * (W / 2 - 34), ey = H / 2 - Math.cos(a) * (H / 2 - 40);
      const x = clamp(ex, 30, W - 30), y = clamp(ey, portrait ? 110 : 70, H - 40), sz = d < 25 ? 12 : 9;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-a); ctx.globalAlpha = 0.6 + 0.4 * (1 - d / 70);
      ctx.fillStyle = o.car.col; ctx.strokeStyle = hunting ? '#ff3a4a' : 'rgba(0,0,0,0.7)'; ctx.lineWidth = hunting ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(0, -sz * 1.3); ctx.lineTo(-sz, sz * 0.6); ctx.lineTo(sz, sz * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  if (k.out && Y.phase !== 2) { BurnsUI.text(ctx, 'SPECTATING' + (Y.spect ? ' · ' + Y.spect.car.name : ''), W / 2, H * 0.3, 16, '#ff9ad8', {}); if (Y.spectT > 1.5) BurnsUI.text(ctx, 'TAP TO SKIP TO RESULTS', W / 2, H * 0.3 + 24, 12, 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 5)) + ')', { ui: true }); }
  if (s.rules.royaleHud) s.rules.royaleHud(s, ctx, W, H, top, left);
  void L;
}
function cartRoyRadar(s, ctx, x, y, S) {
  const Y = s.roy, k = s.player, Z = Y.zone, R0 = Y.layout.R0, sc = S / 2 / (R0 + 12), cx = x + S / 2, cy = y + S / 2;
  const cam = s.camKart && !s.camKart.hidden ? s.camKart : k, yaw = s.camYaw !== undefined ? s.camYaw : cam.yaw, c = Math.cos(yaw), sn = Math.sin(yaw);
  // world → radar: centred on the arena, rotated so "up" is where the camera looks
  const P = (wx, wz, o) => { const dx = wx - Y.layout.x0, dz = wz - Y.layout.z0; o.x = cx - (dx * c - dz * sn) * sc; o.y = cy - (dx * sn + dz * c) * sc; return o; };
  const q = CART_ROY_T.p;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,20,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, S / 2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, S / 2, 0, TAU); ctx.clip();
  // storm: tint outside the safe ring
  if (Y.phase !== 2) { P(Z.x, Z.z, q); ctx.fillStyle = 'rgba(255,170,90,0.28)'; ctx.beginPath(); ctx.rect(x, y, S, S); ctx.arc(q.x, q.y, Z.r * sc, 0, TAU, true); ctx.fill(); ctx.strokeStyle = '#ffb870'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, Z.r * sc, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R0 * sc, 0, TAU); ctx.stroke();
  if (s.rules.radar) s.rules.radar(s, ctx, P, sc);
  for (const o of Y.kits) if (o.alive) { P(o.gx, o.gz, q); ctx.fillStyle = '#5aff8a'; ctx.fillRect(q.x - 1, q.y - 3, 2, 6); ctx.fillRect(q.x - 3, q.y - 1, 6, 2); }
  for (const o of s.karts) { if (o.out || o.hidden || o === k) continue; P(o.x, o.z, q); ctx.fillStyle = o.car.col; ctx.strokeStyle = o.roy && o.roy.tgt === k && o.roy.tgtT > 0 ? '#ff3a4a' : '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (!k.hidden) { P(k.x, k.z, q); const a = -(k.yaw - yaw); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-4.5, 4.5); ctx.lineTo(4.5, 4.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, S / 2, 0, TAU); ctx.stroke();
}

/* ---------------- debug helpers (tests) ---------------- */
if (typeof window !== 'undefined' && window.BRADY_CART && window.BRADY_CART.debug) Object.assign(window.BRADY_CART.debug, {
  royale() {
    const s = Game.scene, R = s && s.roy; if (!R) return null;
    return { phase: R.phase, t: +R.t.toFixed(1), alive: s.karts.filter(k => !k.out).length, firstKO: R.firstKO, zone: { x: +R.zone.x.toFixed(1), z: +R.zone.z.toFixed(1), r: +R.zone.r.toFixed(1) }, result: R.result, boss: s.boss ? { hp: +s.boss.hp.toFixed(1), max: s.boss.max, state: s.boss.st, dead: s.boss.dead } : null,
      karts: s.karts.map(k => ({ id: k.id, player: k.player, hp: +(k.hp || 0).toFixed(1), out: k.out, hidden: !!k.hidden, outT: k.outT, place: k.roy && k.roy.place, kos: k.roy && k.roy.kos, dealt: k.roy && +k.roy.dealt.toFixed(1), taken: k.roy && +k.roy.taken.toFixed(1), dmgBy: k.roy && k.roy.dmgBy, mode: k.roy && k.roy.mode })) };
  },
  hurt(i, n, what) { const s = Game.scene, k = i < 0 ? s.player : s.karts[i]; return cartRoyDamage(s, k, n, null, what || 'test'); },
  dmgTable() { return { dmg: CART_ROY_DMG, kind: CART_ROY_KIND, heal: CART_ROY_HEAL, notes: CART_ROY_NOTES, hp: CART_ROYALE.hp }; }
});
if (typeof window !== 'undefined' && window.BRADY_BURNS) for (const key of ['CART_ROYALE', 'CART_ROY_DMG']) { try { Object.defineProperty(window.BRADY_BURNS, key, { get: () => key === 'CART_ROYALE' ? CART_ROYALE : CART_ROY_DMG, configurable: true }); } catch (e) { /* already there */ } }
