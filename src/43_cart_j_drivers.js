/* ============================================================
   ART CART — the twelve drivers' specials (C3, Nov 11 2026), beside the
   cars' specials (43_cart_da_items.js, whose plumbing they reuse).
   Every driver adds one stat pip to any car they drive (CART_DRIVERS[i].stat,
   applied by cartKartStats in 43_cart_h_career.js) and brings one special that
   rolls from gift boxes like the car's own (cartRollItem, 43_cart_a_data.js):
     BRADY            FIRST BURN ENERGY   joy boost that shrugs off every slow-down
     CHINKA           ALREADY LAPPED YOU  a golden slipstream whisks her past the car ahead
     SPARKLE PONY     CAN I BORROW THAT?  a glitter lasso takes the item (and the water) of the car ahead
     DPW PUNK         ROAD WORK           a barricade and a cone taper close most of the road behind
     DEATH GUILD      TWO CARS ENTER      bungees the nearest rival in, three foam-bat bonks
     CRUSTY           BACK IN MY DAY      a lecture: everyone in earshot is bored to a crawl
     RANGER           5 MPH!              a speed-limit zone drops onto the road ahead of a rival
     ANNOYING DJ      AIR HORN            BWAAAMP: steering goes backwards for whoever is close
     DARKWAD          LIGHTS OUT          goes dark and untouchable, rivals close by lose their line
     BAD IDEA GUY     HOLD MY WATER       a rocket ride; one time in four it blows up
     MESSIAH COMPLEX  PART THE TRAFFIC    a red carpet rolls out, the cars ahead politely step aside
     PARTY BOY        WHERE'S THE AFTERPARTY?  a rave train: rivals close by follow his line, dancing
   Plumbing: each special is a CART_ITEM_FX entry (use · aiWants · icon) and a CART_IX_KIND record (update ·
   sprites · lights · hud: hud draws 2D text where it reads best: speech bubbles and signs projected over the
   world). Victim states are timers on the kart: crawlT (45 % top speed, read by the sim), mixT / lostT /
   trainT (steering, through k.steerFx), partT (pushed aside), boredT (yawning), joyT, darkT (drawn dark,
   lights off). The timers tick in cartDrvTick. The two new characters (messiah, partyboy) are engine
   character types defined here with BurnsRig.defineType.
   ============================================================ */
const CART_DRV_P = { x: 0, y: 0, w: 1 }, CART_DRV_P2 = { x: 0, y: 0, w: 1 };
const CART_DRVC = { gold: [1, 0.82, 0.3], goldHi: [1, 0.95, 0.65], orange: [1, 0.5, 0.1], amber: [1, 0.7, 0.15], red: [1, 0.12, 0.18], carpet: [0.78, 0.04, 0.12], beige: [0.86, 0.78, 0.66],
  grey: [0.62, 0.6, 0.66], violet: [0.55, 0.3, 1], dark: [0.04, 0.02, 0.08], lime: [0.5, 1, 0.35], cyan: [0.22, 0.95, 1], pink: [1, 0.3, 0.75], white: [1, 1, 1], black: [0, 0, 0], foamBat: [1, 0.85, 0.2], foamBat2: [1, 0.4, 0.75] };
const CART_DRV_NEONF = BURNS_NEON.map(c => burnsRGBf(c));
const CART_DRV_RAINBOW = [[1, 0.3, 0.4], [1, 0.6, 0.2], [1, 0.95, 0.3], [0.4, 1, 0.45], [0.3, 0.8, 1], [0.7, 0.45, 1]];

/* ---------------- the two new characters (engine character types, re-dressed from the kit) ----------------
   MESSIAH COMPLEX: flowing white robe with a cream trim, long wavy hair and a full beard, sandals, white shades and a very
   pleased smile. Nothing religious on him: no symbols, no halo, no text. PARTY BOY: bleached spiky hair, neon tank,
   rainbow fuzzy boots, kandi up both arms, LED pendants, glitter. Riders keep their hands on the wheel (no props). */
if (typeof BurnsRig !== 'undefined' && BurnsRig.defineType) {
  BurnsRig.defineType('messiah', { anim: 'welcome', lines: ['Make way. I am kind of a big deal.', 'You may touch the robe. Briefly.', 'I have been chosen. Mostly by me.'],
    spec(s) {
      s.face = 'beatific'; s.skin = '#e8b890'; s.skinSh = '#c8946a';
      s.hair = { style: 'wavy', col: '#6a4428', hi: '#a87a50' }; s.beard = { col: '#6a4428', len: 0.08 }; s.glasses = 'whiteShades'; s.hat = null;
      s.top = { kind: 'long', col: '#fbf8f0' }; s.coat = { kind: 'robe', col: '#fbf8f2', trim: '#e8d8b0' };
      s.bottom = { kind: 'pants', col: '#f4f0e6' }; s.shoes = { kind: 'sandals', col: '#8a6a4a' };
      s.acc = ['kandi']; s.prop = null; s.body.w = 0.98; s.body.h = 1.04;
    } });
  BurnsRig.defineType('partyboy', { anim: 'dance', lines: ['Where\'s the afterparty?', 'Is THIS the afterparty?', 'I lost my fan. I found a better fan.'],
    spec(s) {
      s.face = 'toothy'; s.hair = { style: 'spiky', col: '#f4ecc8', hi: '#ffffff' }; s.glasses = 'visorRainbow'; s.hat = null;
      s.top = { kind: 'crop', col: '#38f2ff', pattern: 'holo', long: true }; s.paint = 'rainbow';
      s.bottom = { kind: 'shorts', col: '#ff4fd8', pattern: 'sequin' }; s.shoes = { kind: 'furboots', col: '#ffffff', pattern: 'rainbow' };
      s.acc = ['kandi', 'beads', 'ledPendants', 'furCuffs']; s.prop = null; s.body.w = 0.95; s.body.h = 0.98;
    } });
}

/* ---------------- registry glue ---------------- */
const CART_DRIVER_SPECIALS = {
  firstburn: { driver: 'brady', name: 'FIRST BURN ENERGY', col: '#ff4fd8', desc: 'Everything is AMAZING! A joyful rainbow boost, and nothing can slow Brady down while it lasts.' },
  lapped: { driver: 'chinka', name: 'ALREADY LAPPED YOU', col: '#ffd27a', desc: 'A golden slipstream lifts Chinka and whisks her past the car ahead. She blows it a kiss on the way.' },
  borrow: { driver: 'sparklepony', name: 'CAN I BORROW THAT?', col: '#c8a0ff', desc: 'A glitter lasso takes the gift-box item of the car ahead (and a sip of its water). Nothing to take? Its boost, then.' },
  roadwork: { driver: 'dpw', name: 'ROAD WORK', col: '#ff8a1a', desc: 'Drops a barricade and a line of cones across most of the road behind. Find the gap!' },
  bungee: { driver: 'deathguild', name: 'TWO CARS ENTER', col: '#ff5a5a', desc: 'Bungees the nearest rival in close and bonks it three times with giant foam bats.' },
  lecture: { driver: 'crusty', name: 'BACK IN MY DAY', col: '#d8a870', desc: 'A long, long lecture. Every rival in earshot is bored to a crawl.' },
  fivemph: { driver: 'ranger', name: '5 MPH!', col: '#ffe24a', desc: 'A speed-limit zone drops onto the road in front of a rival. Inside it, everyone crawls.' },
  airhorn: { driver: 'annoyingdj', name: 'AIR HORN', col: '#7aff5a', desc: 'BWAAAMP! A wub-wub shockwave: close rivals steer backwards for a moment.' },
  lightsout: { driver: 'darkwad', name: 'LIGHTS OUT', col: '#a08aff', desc: 'Goes dark: nothing can find (or hit) the car, and rivals close by lose their line.' },
  holdwater: { driver: 'badideaguy', name: 'HOLD MY WATER', col: '#ff7a2a', desc: 'Straps on a rocket: a huge boost that bowls cars aside. One time in four it blows up.' },
  parting: { driver: 'messiah', name: 'PART THE TRAFFIC', col: '#fff0c8', desc: 'A red carpet rolls out up the road and the cars ahead step aside to let him through.' },
  afterparty: { driver: 'partyboy', name: 'WHERE\'S THE AFTERPARTY?', col: '#38f2ff', desc: 'A rave train! He boosts, and close rivals can\'t help following his line, dancing.' }
};
for (const id in CART_DRIVER_SPECIALS) { const P = CART_DRIVER_SPECIALS[id]; CART_ITEMS[id] = { name: P.name, desc: P.desc, col: P.col, driver: P.driver }; }
// the POWER-UPS guide's two lines (what it does; then a tip (0) or how to dodge it (1))
if (typeof CART_GUIDE_TEXT !== 'undefined') Object.assign(CART_GUIDE_TEXT, {
  firstburn: ['A joy boost: no slow-down can touch Brady.', 0, 'Use it when foam, frosting or a whistle hits.'],
  lapped: ['A golden slipstream flies her past the car ahead.', 0, 'Use it right behind a rival.'],
  borrow: ['Steals the item of the car ahead, or its boost.', 1, 'Use your item before she gets close.'],
  roadwork: ['A barricade and cones close most of the road.', 1, 'Aim for the gap at the open side.'],
  bungee: ['Yanks the nearest rival in for three foam bonks.', 1, 'Keep 30 m away, or a DISCO SHIELD up.'],
  lecture: ['A lecture that bores close rivals to a crawl.', 1, 'Stay out of earshot. Pass him wide.'],
  fivemph: ['A 5 MPH zone drops onto the road ahead.', 1, 'Watch the falling sign; take the open lane.'],
  airhorn: ['Close rivals steer backwards for 2 seconds.', 1, 'Steer the OTHER way until it wears off.'],
  lightsout: ['Goes dark and untouchable; rivals lose their line.', 1, 'Hold your line and keep your distance.'],
  holdwater: ['A huge rocket boost. Sometimes it explodes.', 1, 'Out of his way. And away when it sputters.'],
  parting: ['The cars ahead are pushed aside off his carpet.', 1, 'A DISCO SHIELD keeps you in your lane.'],
  afterparty: ['Close rivals follow his line, dancing.', 1, 'Keep away, or steer hard against the train.']
});

/* ---------------- per-race state: the pooled meshes (barricades, cones), the steering hook ---------------- */
const CART_DRV_POOL = { bar: 8, cone: 16 };
const CartDrvMesh = {
  // a road barricade 2.9 m wide (local x): two A-frame legs, two striped boards, amber lamps
  bar(m) {
    m.color('#3a3a42').shine(1);
    for (const sx of [-1.3, 1.3]) { m.limb(sx, 0, -0.42, sx, 1.08, 0, 0.06, 0.05, { seg: 5 }); m.limb(sx, 0, 0.42, sx, 1.08, 0, 0.06, 0.05, { seg: 5 }); }
    for (const [y, h] of [[0.95, 0.26], [0.5, 0.2]]) for (let i = 0; i < 6; i++) { m.color(i % 2 ? '#f4f4f4' : '#ff6a10', i % 2 ? 0 : 0.25); m.box(-1.45 + 0.29 + i * 0.58, y, 0, 0.58, h, 0.07); }
    m.color('#ffb020', 1); for (const sx of [-1.3, 1.3]) m.ball(sx, 1.22, 0, 0.11, { seg: 7, rings: 5 }); m.emissive(0).shine(0);
  },
  // a traffic cone with two reflective bands
  cone(m) {
    m.color('#202024'); m.box(0, 0.03, 0, 0.62, 0.06, 0.62);
    m.color('#ff6a10', 0.2).shine(1); m.lathe([[0.27, 0.06], [0.05, 0.82], [0, 0.83]], { seg: 10 });
    m.color('#ffffff', 0.35); m.lathe([[0.215, 0.24], [0.17, 0.4]], { seg: 10 }); m.lathe([[0.135, 0.5], [0.095, 0.62]], { seg: 10 }); m.emissive(0).shine(0);
  }
};
function cartDrvLoad(s) {
  const D = s.drv = { bars: [], cones: [] };
  for (const k of s.karts) k.steerFx = cartDrvSteer;
  if (s.ix) cartIxRec(s, 'drvcues', { owner: null });
  if (!BurnsGL.gl || !s.ix) return;
  const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32));
  for (let i = 0; i < CART_DRV_POOL.bar; i++) { const o = G.add(m => CartDrvMesh.bar(m), { visible: false }); o.live = false; D.bars.push(o); }
  for (let i = 0; i < CART_DRV_POOL.cone; i++) { const o = G.add(m => CartDrvMesh.cone(m), { visible: false }); o.live = false; D.cones.push(o); }
  G.finish(); s.ix.groups.push(G);   // drawn by cartItemsRender (only while something in it is live)
}
// k.steerFx (read by the sim every step): what the drivers' specials do to a car's steering
function cartDrvSteer(s, k, steer) {
  let w = 0;
  if (k.mixT > 0) w -= steer * 2;   // AIR HORN: left is right
  if (k.lostT > 0) w += Math.sin(s.t * 3.1 + k.slot * 1.9) * 0.5 + Math.sin(s.t * 7.7 + k.slot) * 0.22;   // LIGHTS OUT: where's the road?
  if (k.trainT > 0 && k.trainBy && !k.trainBy.out) {   // RAVE TRAIN: follow the leader's line, 7 m behind him, dancing
    const L = k.trainBy, bx = L.x - Math.sin(L.yaw) * 7, bz = L.z - Math.cos(L.yaw) * 7, want = clamp(-cartWrap(Math.atan2(bx - k.x, bz - k.z) - k.yaw) * 2.4, -1, 1);
    w += (want - steer) * 0.72 + Math.sin(s.t * 8 + k.slot) * 0.25;
  }
  return w;
}
// every sim step: the victims' timers, the joy that clears them, cars being pushed aside
function cartDrvTick(s, dt) {
  const T = s.T && s.isRace ? s.T : null;
  for (const k of s.karts) {
    for (const key of CART_DRV_TIMERS) if (k[key] > 0) k[key] = Math.max(0, k[key] - dt);
    if (k.joyT > 0) { k.slowT = 0; k.foamT = 0; k.gooT = 0; k.charmT = 0; k.dazzleT = 0; k.stunT = 0; k.crawlT = 0; k.mixT = 0; k.lostT = 0; k.trainT = 0; k.partT = 0; k.boredT = 0; k.whistleT = 0; }
    if (k.partT > 0 && !k.out && !k.air) {
      k.slowT = Math.max(k.slowT, 0.15);
      if (T) { const i = k.loc.i, want = k.partSide * (T.HW[i] - 1.6), v = clamp((want - k.loc.d) * 2.4, -9, 9); k.x += T.NX[i] * v * dt; k.z += T.NZ[i] * v * dt; }
      else { k.x += k.partNX * 6 * dt; k.z += k.partNZ * 6 * dt; }
    }
    if (k.trainT > 0) k.slowT = Math.max(k.slowT, 0.12);
    if (k.boredT > 0 && s.fx && k._in && Math.random() < dt * 2.2) s.fx.zzz(k.x + 0.6, k.y + (k.M ? k.M.h : 2.5) + 0.3, k.z);
  }
}
const CART_DRV_TIMERS = ['crawlT', 'mixT', 'lostT', 'trainT', 'partT', 'boredT', 'joyT', 'darkT'];

/* ---------------- helpers ---------------- */
const cartDrvRace = s => !!(s.T && s.isRace);
// the shield answers a non-hit effect (a theft, a parting): pops, and the effect fails
function cartDrvShielded(s, o, k, id) {
  if (o.immuneT > 0 || o.joyT > 0) return true;
  if (o.shieldT <= 0) return false;
  o.shieldT = 0; o.invT = 0.8; if (s.fx) s.fx.burst(o.x, o.y + 1.6, o.z, 'star', 16, '#ff9af0'); Sound.play('break', { vol: o.player ? 0.8 : 0.3, pitch: 1.4 });
  s.log('blocked', { k: o.id, by: k.id, w: id }); if (o.player) s.banner('SHIELD POPPED!', '#ff9af0', 1.2);
  return true;
}
// a victim effect without the spin: logged like a hit (tests and the stats count it), banner for the player
function cartDrvTag(s, o, k, id, banner, col) {
  s.log('hit', { k: o.id, by: k.id, kind: 'drv', item: id, player: o.player, byPlayer: !!k.player });
  k.hitsDealt++; k.cheerT = Math.max(k.cheerT, 0.9); o.hitsTaken++;
  if (o.player && banner) { s.banner(banner, col || '#ff6a6a', 1.3, 'by ' + k.drv.name); Sound.play('kartHit', { vol: 0.6 }); s.shakeIt(0.4); }
  else if (k.player) s.banner('GOT ' + o.car.name + '!', '#7aff8a', 0.9, null, true);
}
// a speech bubble projected over a world point (2D: crisp at any distance); returns false when off screen
function cartDrvBubble(s, ctx, W, H, x, y, z, text, col, a, fs, tail) {
  const p = CART_DRV_P; if (a <= 0.02 || !s.R || !s.R.project(x, y, z, W, H, p) || p.w > 110) return false;
  if (p.x < -60 || p.x > W + 60 || p.y < -30 || p.y > H + 30) return false;
  fs = fs || 12; a *= clamp(1.3 - p.w / 100, 0.35, 1);
  ctx.save(); ctx.globalAlpha = a; ctx.font = `800 ${fs}px ${FONT_UI}`;
  const tw = ctx.measureText(text).width + fs * 1.3, th = fs * 1.9, bx = clamp(p.x - tw / 2, 4, W - tw - 4), by = p.y - th - 8;
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.strokeStyle = col || '#1a1020'; ctx.lineWidth = 2.5;
  burnsRR(ctx, bx, by, tw, th, th / 2); ctx.fill(); ctx.stroke();
  if (tail !== false) { const tx = clamp(p.x, bx + 12, bx + tw - 12); ctx.beginPath(); ctx.moveTo(tx - 6, by + th - 1); ctx.lineTo(tx, by + th + 9); ctx.lineTo(tx + 6, by + th - 1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 6, by + th); ctx.lineTo(tx, by + th + 9); ctx.lineTo(tx + 6, by + th); ctx.stroke(); }
  ctx.fillStyle = '#1a1020'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + tw / 2, by + th / 2 + 0.5);
  ctx.restore(); return true;
}
// a car's roof point, for bubbles over it
const cartDrvTop = (k, h) => k.y + (k.M ? k.M.h : 2.5) + (h || 0.8);
// a short-lived owner-level line ("BWAAAMP!") over the owner, fading at the end of its window
function cartDrvSay(s, ctx, W, H, k, text, col, t, t0, t1, fs) { if (t < t0 || t > t1) return; const a = Math.min(1, (t - t0) * 6, (t1 - t) * 4); cartDrvBubble(s, ctx, W, H, k.x, cartDrvTop(k), k.z, text, col, a, fs || 13); }
// the cars within r metres of k (not k, not out, not finished)
function cartDrvAround(s, k, r, L) { L.length = 0; for (const o of s.karts) { if (o === k || o.out || (s.isRace && o.finished)) continue; if (Math.hypot(o.x - k.x, o.z - k.z) < r && Math.abs(o.y - k.y) < 5) L.push(o); } return L; }
const CART_DRV_L = [];
// a point on the course (races) at arc length sv, lateral d
function cartDrvAt(s, sv, d, out) { const g = s.T.at(sv, CART_IX_T.at2); out.x = g.x + g.nx * d; out.z = g.z + g.nz * d; out.yaw = g.yaw; out.hw = g.hw; out.nx = g.nx; out.nz = g.nz; out.tx = g.tx; out.tz = g.tz; return out; }
const CART_DRV_SPOT = { x: 0, z: 0, yaw: 0, hw: 8, nx: 0, nz: 0, tx: 0, tz: 1 };
const cartDrvSoundAll = (k, list) => { const v = k.player ? 1 : 0.35; for (const [n, vol, p] of list) Sound.play(n, p ? { vol: v * vol, pitch: p } : { vol: v * vol }); };

/* ============ BRADY: FIRST BURN ENERGY ============
   4 s at 130 % top speed, and every slow-down (foam, frosting, whistles, lectures, zones, love, dazzle, zaps) is shrugged
   off while it lasts. Hits that spin or flip still land: it is joy, not armour. */
CART_ITEM_FX.firstburn = {
  use(s, k) {
    cartIxRec(s, 'firstburn', { owner: k, life: 4.0, said: 0 });
    k.joyT = 4.0; k.vmaxMin = 1.3; s.boost(k, 0.8, 'glow');
    cartDrvSoundAll(k, [['reunion', 0.7], ['crowd', 0.5], ['cartSparkle', 0.6]]);
    if (s.fx) { s.fx.confetti(k.x, k.y + 2.5, k.z, 30); s.fx.hearts(k.x, k.y + 3, k.z, 10); }
    if (k.player) s.banner('EVERYTHING IS AMAZING!', '#ff4fd8', 1.4, 'nothing can slow you down');
  },
  aiWants(s, k) { return k.slowT > 0 || k.foamT > 0 || k.gooT > 0 || k.crawlT > 0 || (cartDrvRace(s) && k.rank > 1 && Math.abs(s.T.K[s.T.idx(k.loc.s + 25)]) < 0.012) || k.ai.itemT < -3; },
  icon(ctx, s, col) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = BURNS_NEON[i]; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(0, s * 0.25, s * (0.5 - i * 0.065), Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
    cartHeartIcon(ctx, 0, s * 0.12, s * 0.22, col); ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-0.42, -0.42], [0.45, -0.3], [0.32, 0.35]]) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? s * 0.03 : s * 0.09; ctx.lineTo(x * s + Math.cos(a) * r, y * s + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  }
};
CART_IX_KIND.firstburn = {
  update(s, r, dt) {
    const k = r.owner;
    if (k.out || r.t >= r.life) { if (k.vmaxMin === 1.3) k.vmaxMin = 0; return false; }
    if (s.fx && k._in) { const c = CART_DRV_RAINBOW[Math.floor(r.t * 12) % 6], b = (k.M ? k.M.len : 4) * 0.5, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); s.fx.add(k.x - fx * b + (Math.random() - 0.5) * 2, k.y + 0.5 + Math.random() * 1.6, k.z - fz * b + (Math.random() - 0.5) * 2, -fx * 3, 1 + Math.random() * 2, -fz * 3, 0.9, 0.7, 0.15, c, 1, 'star', 1, Math.random() * 6, 3); if (Math.random() < dt * 6) s.fx.hearts(k.x, k.y + 3.2, k.z, 1); }
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, a = clamp((r.life - r.t) * 2, 0, 1) * Math.min(1, r.t * 4), gy = s.terrain.height(k.x, k.z) + 0.08, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    R.flat.flat(k.x, gy, k.z, 8, 9, t * 2, S.glow, CART_DRV_RAINBOW[Math.floor(t * 6) % 6], 0.55 * a, true);
    // a rainbow ribbon streaming behind the car
    for (let i = 0; i < 6; i++) { const off = (i - 2.5) * 0.32; R.bbs.streak(k.x - fx * 6 - fz * off, k.y + 1.0 + i * 0.22, k.z - fz * 6 + fx * off, fx, 0, fz, 9, 0.3, S.streak, CART_DRV_RAINBOW[i], 0.75 * a); }
    R.bbs.bb(k.x, cartDrvTop(k, 1.4), k.z, 2.2 + Math.sin(t * 9) * 0.3, 2.2 + Math.sin(t * 9) * 0.3, S.heart, CART_DRVC.pink, 0.9 * a, true);
  },
  lights(s, r, add) { const k = r.owner; add(k.x, k.y + 2, k.z, 10, CART_DRV_RAINBOW[Math.floor(s.time * 6) % 6], 1.2, 1.6); },
  hud(s, ctx, W, H, r) { const lines = ['WOOO!', 'EVERYTHING IS AMAZING!', 'BEST. BURN. EVER.']; cartDrvSay(s, ctx, W, H, r.owner, lines[Math.floor(r.t / 1.3) % 3], '#ff4fd8', r.t, 0.1, 3.8); }
};
CART_ITEM_FX.firstburn.update = (s, dt) => { if (s.karts) cartDrvTick(s, dt); };   // the drivers' timers tick once per sim step

/* ============ CHINKA: ALREADY LAPPED YOU ============
   A golden slipstream lifts her 2 m and whisks her (155 % top speed, pulled onto the target's line, over the top of it)
   past the car ahead within 90 m; it ends 12 m past it (or after 3 s). No harm to anyone: she blows it a kiss. */
CART_ITEM_FX.lapped = {
  use(s, k) {
    const L = cartIxTargets(s, k, s.isRace ? 90 : 60), tgt = L[0] || null;
    const r = cartIxRec(s, 'lapped', { owner: k, tgt, life: 3.4, passed: false, passT: 0 });
    r.f = cartFlyStart(s, k, 'gold', 3.0, 2.0, { up: 0.35, down: 0.45 }); k.vmaxMin = 1.55; s.boost(k, 0.6, 'glow');
    cartDrvSoundAll(k, [['chinka', 0.9], ['cartSparkle', 0.7], ['kartBoost', 0.5, 1.2]]);
    if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 18, '#ffd27a');
  },
  aiWants(s, k) { return !k.air && (cartIxTargets(s, k, 70).length > 0 || k.ai.itemT < -3); },
  icon(ctx, s, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.3); ctx.quadraticCurveTo(-s * 0.1, -s * 0.05, s * 0.5, -s * 0.38); ctx.lineTo(s * 0.32, -s * 0.12); ctx.quadraticCurveTo(-s * 0.05, s * 0.18, -s * 0.48, s * 0.48); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a8a96'; burnsRR(ctx, -s * 0.12, s * 0.12, s * 0.42, s * 0.22, s * 0.06); ctx.fill(); ctx.stroke();
    cartHeartIcon(ctx, s * 0.36, -s * 0.38, s * 0.14, '#ff4f8a');
  }
};
CART_IX_KIND.lapped = {
  update(s, r, dt) {
    const k = r.owner, f = k.fly;
    if (!f || f !== r.f) { if (k.vmaxMin === 1.55) k.vmaxMin = 0; return false; }
    f.t += dt;
    const tg = r.tgt;
    if (k.out || k.flipT > 0) { cartFlyEnd(s, k); return false; }
    // ride onto the target's line (over the top of it) until past it
    if (tg && !tg.out && !r.passed) {
      if (cartDrvRace(s)) { const T = s.T, i = k.loc.i, v = clamp((tg.loc.d - k.loc.d) * 3, -10, 10); k.x += T.NX[i] * v * dt; k.z += T.NZ[i] * v * dt; if (k.prog > tg.prog + 12) r.passed = true; }
      else { const want = Math.atan2(tg.x - k.x, tg.z - k.z), d = cartWrap(want - k.yaw); k.yaw = cartWrap(k.yaw + clamp(d, -2 * dt, 2 * dt)); if ((tg.x - k.x) * Math.sin(k.yaw) + (tg.z - k.z) * Math.cos(k.yaw) < -10) r.passed = true; }
      if (r.passed) {
        r.passT = r.t; f.dur = Math.min(f.dur, f.t + 0.5);
        s.log('pass', { k: k.id, by: k.id, item: 'lapped', passed: tg.id });
        if (s.fx) { s.fx.hearts(tg.x, tg.y + 3, tg.z, 8); s.fx.burst(tg.x, tg.y + 2, tg.z, 'star', 12, '#ffd27a'); }
        cartIxSound(s, 'chinka', k.x, k.z, 0.7, 1.2);
        if (k.player) s.banner('ALREADY LAPPED YOU!', '#ffd27a', 1.2, null, true);
        if (tg.player) s.banner('LAPPED BY CHINKA', '#ffd27a', 1.2, 'she blew you a kiss', true);
      }
    }
    if (s.fx && Math.random() < 0.9) s.fx.add(k.x + (Math.random() - 0.5) * 2.4, k.y + 0.2, k.z + (Math.random() - 0.5) * 2.4, -k.vx * 0.2, -0.5, -k.vz * 0.2, 0.8, 0.5, 0.1, CART_DRVC.gold, 1, 'star', 1, Math.random() * 6, 2);
    if (f.t >= f.dur) { cartFlyEnd(s, k); if (k.vmaxMin === 1.55) k.vmaxMin = 0; return false; }
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner; if (!k.fly) return; const C = CART_DRVC, a = Math.min(1, r.t * 4);
    // the golden slipstream: a glowing ribbon road under her and running ahead
    if (cartDrvRace(s)) {
      const p = CART_DRV_SPOT;
      for (let i = 0; i < 12; i++) { const ds = -4 + i * 4, tg = r.tgt, d = tg && !r.passed ? lerp(k.loc.d, tg.loc.d, clamp(ds / 30, 0, 1)) : k.loc.d; cartDrvAt(s, k.loc.s + ds, d, p); const gy = s.terrain.height(p.x, p.z) + 0.1 + 1.6 * (1 - i / 12) * 0; R.flat.flat(p.x, gy, p.z, 3.4, 4.6, p.yaw, S.glow, C.gold, 0.6 * a * (1 - i / 13), true); if (i % 2 === 0) R.bbs.bb(p.x + Math.sin(t * 5 + i) * 1.2, gy + 0.6 + Math.sin(t * 7 + i) * 0.4, p.z, 0.7, 0.7, S.star, C.goldHi, 0.9 * a, true, t * 3 + i); }
    }
    R.bbs.bb(k.x, k.y + 0.6, k.z, 7, 4, S.glow, C.gold, 0.55 * a, true);
    for (const sd of [-1, 1]) R.bbs.streak(k.x - Math.sin(k.yaw) * 4 + Math.cos(k.yaw) * sd * 1.3, k.y + 0.8, k.z - Math.cos(k.yaw) * 4 - Math.sin(k.yaw) * sd * 1.3, Math.sin(k.yaw), 0, Math.cos(k.yaw), 8, 0.45, S.streak, C.goldHi, 0.8 * a);
  },
  lights(s, r, add) { const k = r.owner; if (k.fly) add(k.x, k.y, k.z, 10, CART_DRVC.gold, 1.3, 1.6); },
  hud(s, ctx, W, H, r) { if (r.passed) cartDrvSay(s, ctx, W, H, r.owner, 'ALREADY LAPPED YOU, BABE ♥', '#d8a020', r.t, r.passT, r.passT + 1.6); else cartDrvSay(s, ctx, W, H, r.owner, 'ON YOUR LEFT, BABE!', '#d8a020', r.t, 0.1, 1.0); }
};

/* ============ SPARKLE PONY: CAN I BORROW THAT? ============
   A glitter lasso flies to the nearest car ahead within 80 m (one with an item first). At 0.55 s: its item (or the
   one spinning in its roulette) is hers, and she drinks its water (her slow-downs cleared, a small boost). Nothing to
   take: she borrows its boost instead (it slows for 1.4 s, she boosts). A DISCO SHIELD pops and keeps the item. */
CART_ITEM_FX.borrow = {
  use(s, k) {
    const L = cartIxTargets(s, k, s.isRace ? 80 : 55); let tgt = null;
    for (const o of L) if (o.item || o.roul > 0) { tgt = o; break; }
    if (!tgt) tgt = L[0] || null;
    cartIxRec(s, 'borrow', { owner: k, tgt, life: tgt ? 1.9 : 0.9, done: false, got: null, fail: false });
    cartDrvSoundAll(k, [['disco', 0.5], ['throw', 0.6, 1.3], ['cartSparkle', 0.6]]);
  },
  aiWants(s, k) { for (const o of cartIxTargets(s, k, s.isRace ? 75 : 50)) if (o.item || o.roul > 0) return true; return k.ai.itemT < -4; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#ff4fd8'; ctx.fillRect(-s * 0.1, -s * 0.05, s * 0.5, s * 0.45); ctx.strokeRect(-s * 0.1, -s * 0.05, s * 0.5, s * 0.45); ctx.fillStyle = '#ffe24a'; ctx.fillRect(s * 0.1, -s * 0.05, s * 0.1, s * 0.45); ctx.fillRect(-s * 0.1, s * 0.12, s * 0.5, s * 0.08);
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.ellipse(s * 0.15, -s * 0.1, s * 0.34, s * 0.16, -0.2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.05); ctx.quadraticCurveTo(-s * 0.5, s * 0.1, -s * 0.52, s * 0.45); ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-0.38, -0.3], [0.45, -0.38], [-0.35, 0.2]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.05, 0, TAU); ctx.fill(); }
  }
};
CART_IX_KIND.borrow = {
  update(s, r, dt) {
    const k = r.owner, o = r.tgt;
    if (!o) return r.t < r.life;
    if (!r.done && r.t >= 0.55) {
      r.done = true;
      if (o.out || Math.hypot(o.x - k.x, o.z - k.z) > 110 || cartDrvShielded(s, o, k, 'borrow')) { r.fail = true; return true; }
      const it = o.item || (o.roul > 0 ? o.roulItem : null);
      if (it) { o.item = null; o.roul = 0; r.got = it; if (!k.item && k.roul <= 0) { k.item = it; k.itemCool = 0.6; } }
      else { o.slowT = Math.max(o.slowT, 1.4); s.boost(k, 0.9, 'water'); }
      // and the water: her own slow-downs are gone
      k.slowT = 0; k.foamT = 0; k.gooT = 0; k.stunT = 0; k.dazzleT = 0; k.charmT = 0; k.crawlT = 0; s.boost(k, 0.5, 'water');
      o.vx *= 0.88; o.vz *= 0.88;
      cartDrvTag(s, o, k, 'borrow', it ? 'SHE TOOK YOUR ' + CART_ITEMS[it].name + '!' : 'SHE BORROWED YOUR BOOST', '#c8a0ff');
      cartIxSound(s, 'hydrate', k.x, k.z, 0.8); cartIxSound(s, 'pick', o.x, o.z, 0.7, 1.4);
      if (s.fx) s.fx.burst(o.x, o.y + 2, o.z, 'star', 14, '#c8a0ff');
    }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, o = r.tgt; if (!o) return;
    const C = CART_DRVC, reach = r.t < 0.55 ? r.t / 0.55 : clamp(1 - (r.t - 1.1) / 0.5, 0, 1); if (reach <= 0) return;
    const x0 = k.x, y0 = cartDrvTop(k, -0.4), z0 = k.z, x1 = lerp(x0, o.x, reach), y1 = lerp(y0, o.y + 1.6, reach), z1 = lerp(z0, o.z, reach), n = 18;
    // the glitter lasso: a sagging rope of rainbow sparkles, a loop round the victim
    for (let i = 1; i <= n; i++) { const u = i / n, x = lerp(x0, x1, u), z = lerp(z0, z1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * 1.6; R.bbs.bb(x, y, z, 0.5, 0.5, i % 3 ? S.dot : S.star, CART_DRV_RAINBOW[(i + Math.floor(t * 10)) % 6], 1, true, t * 4 + i); }
    if (r.t >= 0.5 && !r.fail) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 3; R.bbs.bb(o.x + Math.sin(a) * 1.8, o.y + 1.4, o.z + Math.cos(a) * 1.8, 0.55, 0.55, S.star, C.pink, 0.95, true); }
    // the loot flies home along the rope
    if (r.done && !r.fail && r.t < 1.2) { const u = clamp((r.t - 0.55) / 0.6, 0, 1), x = lerp(o.x, k.x, u), z = lerp(o.z, k.z, u), y = lerp(o.y + 1.6, cartDrvTop(k), u) + Math.sin(u * Math.PI) * 2.2; R.bbs.bb(x, y, z, 2.2, 2.2, S.glow, r.got ? burnsRGBf(CART_ITEMS[r.got].col) : C.violet, 0.9, true); R.bbs.bb(x, y, z, 1.2, 1.2, S.star, C.white, 1, true, t * 6); }
  },
  hud(s, ctx, W, H, r) {
    const k = r.owner, o = r.tgt;
    cartDrvSay(s, ctx, W, H, k, o ? 'CAN I BORROW THAT?' : 'ANYONE? ANYTHING?', '#a070e8', r.t, 0, 0.9);
    if (o && r.done) { if (r.fail) cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o), o.z, 'NOPE!', '#ff9af0', Math.min(1, (r.life - r.t) * 3), 13); else { cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o), o.z, 'HEY!', '#ff5a5a', Math.min(1, (r.life - r.t) * 3), 14); cartDrvSay(s, ctx, W, H, k, r.got ? 'THANKS! *SIP*' : 'THANKS! *SIP*', '#a070e8', r.t, 0.7, r.life); } }
  }
};

/* ============ DPW PUNK: ROAD WORK ============
   14 m behind, a barricade closes 62 % of the road (on the side of the nearest follower), with a taper of six cones
   leading into it. Drive into the barricade: KNOCKED (and it topples); hit a cone: it flies and you lose a little speed.
   10 s. Arenas: a short barricade across the path behind, cones in a V. */
CART_ITEM_FX.roadwork = {
  use(s, k) {
    const D = s.drv; if (!D) return;
    const r = cartIxRec(s, 'roadwork', { owner: k, life: 10, bars: [], cones: [], sd: 0 });
    if (cartDrvRace(s)) {
      const T = s.T, s0 = k.loc.s - 14; let side = 0, best = 70;
      for (const o of s.karts) { if (o === k || o.out) continue; const ds = k.prog - o.prog; if (ds > 0 && ds < best) { best = ds; side = o.loc.d >= 0 ? 1 : -1; } }
      if (!side) side = s.rng() < 0.5 ? 1 : -1;
      r.sd = side;
      const g = cartDrvAt(s, s0, 0, CART_DRV_SPOT), hw = g.hw, w = hw * 1.24, n = Math.ceil(w / 2.9);
      for (let i = 0; i < n; i++) { const d = side * (hw - 1.45 - i * (w - 2.9) / Math.max(1, n - 1)); cartDrvAt(s, s0, d, CART_DRV_SPOT); cartDrvBar(s, r, CART_DRV_SPOT.x, CART_DRV_SPOT.z, CART_DRV_SPOT.yaw, CART_DRV_SPOT.nx, CART_DRV_SPOT.nz, CART_DRV_SPOT.tx, CART_DRV_SPOT.tz); }
      for (let i = 0; i < 6; i++) { const u = (i + 1) / 7, d = side * lerp(hw - 1.45 - (w - 2.9), hw - 0.6, u); cartDrvAt(s, s0 - 3 - i * 3.2, d, CART_DRV_SPOT); cartDrvCone(s, r, CART_DRV_SPOT.x, CART_DRV_SPOT.z); }
    } else {
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), nx = -fz, nz = fx, cx = k.x - fx * 10, cz = k.z - fz * 10;
      for (let i = -1; i <= 1; i++) { const p = cartIxInside(s, { x: cx + nx * i * 2.9, z: cz + nz * i * 2.9 }, 3); cartDrvBar(s, r, p.x, p.z, k.yaw, nx, nz, fx, fz); }
      for (let i = 1; i <= 3; i++) for (const sd of [-1, 1]) { const p = cartIxInside(s, { x: cx - fx * i * 2.5 + nx * sd * (4.4 + i * 1.4), z: cz - fz * i * 2.5 + nz * sd * (4.4 + i * 1.4) }, 3); cartDrvCone(s, r, p.x, p.z); }
    }
    cartDrvSoundAll(k, [['crumble', 0.6], ['stomp', 0.5, 1.2], ['bell', 0.4, 1.5]]);
    if (k.player) s.banner('ROAD CLOSED BEHIND YOU', '#ff8a1a', 1.0, null, true);
  },
  aiWants(s, k) { for (const o of s.karts) { if (o === k || o.out) continue; if (s.isRace) { const d = k.prog - o.prog; if (d > 4 && d < 40) return true; } else { const dx = o.x - k.x, dz = o.z - k.z; if (dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw) < 0 && Math.hypot(dx, dz) < 22) return true; } } return k.ai.itemT < -5; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#202024'; ctx.fillRect(-s * 0.42, s * 0.36, s * 0.84, s * 0.12);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.38); ctx.lineTo(-s * 0.06, -s * 0.5); ctx.lineTo(s * 0.06, -s * 0.5); ctx.lineTo(s * 0.32, s * 0.38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 0.2, 0); ctx.lineTo(s * 0.25, s * 0.16); ctx.lineTo(-s * 0.25, s * 0.16); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.11, -s * 0.28); ctx.lineTo(s * 0.11, -s * 0.28); ctx.lineTo(s * 0.14, -s * 0.18); ctx.lineTo(-s * 0.14, -s * 0.18); ctx.closePath(); ctx.fill();
  }
};
function cartDrvBar(s, r, x, z, yaw, nx, nz, tx, tz) { const o = cartIxTake(s.drv.bars); if (!o) return; o.live = true; o.t = 0; o.rec = r; o.gx = x; o.gz = z; o.byaw = yaw; o.nx = nx; o.nz = nz; o.tx = tx; o.tz = tz; o.fall = 0; o.down = false; o.drop = 0.45; r.bars.push(o); }
function cartDrvCone(s, r, x, z) { const o = cartIxTake(s.drv.cones); if (!o) return; o.live = true; o.t = 0; o.rec = r; o.gx = x; o.gz = z; o.gy = 0; o.vx = o.vz = o.vy = 0; o.spin = 0; o.kick = 0; o.drop = 0.3 + Math.random() * 0.3; o.flying = false; r.cones.push(o); }
CART_IX_KIND.roadwork = {
  update(s, r, dt) {
    const k = r.owner, end = r.t >= r.life;
    for (const b of r.bars) {
      if (b.rec !== r) continue;
      b.t += dt; const gy = s.terrain.height(b.gx, b.gz), u = clamp(b.t / b.drop, 0, 1);
      if (b.down) b.fall = Math.min(1, b.fall + dt * 4);
      b.visible = true; b.x = b.gx; b.z = b.gz; b.y = gy + (1 - u * u) * 7; b.yaw = b.byaw; b.pitch = b.fall * 1.45; b.roll = 0; b.scale = end ? 0.01 : clamp((r.life - r.t) * 2, 0.05, 1);
      if (b.t > b.drop && !b.down) {
        cartIxObs(s, b.gx, b.gz, 1.9);
        for (const o of s.karts) {
          if (o.out || o.air || (o === k && r.t < 2.5)) continue;
          const dx = o.x - b.gx, dz = o.z - b.gz, al = dx * b.tx + dz * b.tz, ac = dx * b.nx + dz * b.nz;
          if (Math.abs(al) < 1.25 && Math.abs(ac) < 1.65) {
            b.down = true; const sg = al >= 0 ? 1 : -1;
            if (s.hit(o, 'knock', k, { item: 'roadwork', dx: b.tx * sg, dz: b.tz * sg, power: 9, dur: 1.0, banner: 'ROAD CLOSED!' })) cartIxSound(s, 'crumble', b.gx, b.gz, 0.8, 1.1);
            else { o.vx *= 0.6; o.vz *= 0.6; }
            if (s.fx) s.fx.spark(b.gx, gy + 1, b.gz, 12, '#ffb020', 6);
            break;
          }
        }
      }
      if (end) { b.live = false; b.rec = null; b.visible = false; }
    }
    for (const c of r.cones) {
      if (c.rec !== r) continue;
      c.t += dt; const gh = s.terrain.height(c.gx, c.gz);
      if (c.t < c.drop) { c.visible = false; continue; }
      if (c.kick > 0) c.kick -= dt;
      if (c.flying) { c.vy -= 24 * dt; c.gx += c.vx * dt; c.gz += c.vz * dt; c.gy += c.vy * dt; c.spin += dt * 12; if (c.gy <= gh) { c.gy = gh; c.vy = Math.abs(c.vy) > 4 ? -c.vy * 0.35 : 0; c.vx *= 0.6; c.vz *= 0.6; if (!c.vy) c.flying = false; } }
      else { c.gy = gh; cartIxObs(s, c.gx, c.gz, 0.75); }
      if (c.kick <= 0) for (const o of s.karts) {
        if (o.out || o.air || (o === k && r.t < 2.5)) continue;
        const dx = c.gx - o.x, dz = c.gz - o.z; if (dx * dx + dz * dz > 2.6) continue;
        const l = Math.hypot(dx, dz) || 1; c.vx = o.vx * 0.9 + dx / l * 5; c.vz = o.vz * 0.9 + dz / l * 5; c.vy = 6; c.flying = true; c.kick = 0.4;
        if (o.invT <= 0 && !o.fly) { o.vx *= 0.85; o.vz *= 0.85; o.yaw = cartWrap(o.yaw + (Math.random() - 0.5) * 0.15); if (!o.coneT || s.t > o.coneT) { o.coneT = s.t + 0.6; s.log('cone', { k: o.id, by: k.id, item: 'roadwork' }); if (o.player) s.shakeIt(0.2); } }
        cartIxSound(s, 'kick', c.gx, c.gz, 0.6, 1.3, 0.05); break;
      }
      c.visible = !end; c.x = c.gx; c.y = c.gy + (c.t < c.drop + 0.25 ? (1 - (c.t - c.drop) / 0.25) * 3 : 0); c.z = c.gz; c.yaw = c.spin; c.pitch = c.flying ? c.spin * 0.8 : 0; c.roll = 0; c.scale = clamp((r.life - r.t) * 2, 0.05, 1.15);
      if (end) { c.live = false; c.rec = null; c.visible = false; }
    }
    return !end;
  },
  sprites(s, R, r, S, t) {
    // amber blinkers and a warning glow on the road in front of the barricade
    const bl = Math.floor(t * 3) % 2, C = CART_DRVC;
    for (const b of r.bars) { if (b.rec !== r || b.down || b.t < b.drop) continue; const gy = s.terrain.height(b.gx, b.gz); R.flat.flat(b.gx - b.tx * 2.5, gy + 0.06, b.gz - b.tz * 2.5, 3.2, 4, b.byaw, S.warn, C.amber, 0.45, true); for (const sd of [-1.3, 1.3]) R.bbs.bb(b.gx + b.nx * sd, gy + 1.22, b.gz + b.nz * sd, bl ? 1.6 : 0.9, bl ? 1.6 : 0.9, S.glow, C.amber, bl ? 0.95 : 0.4, true); }
  },
  lights(s, r, add) { const b = r.bars[0]; if (b && b.rec === r && !b.down) add(b.gx, 1.4, b.gz, 9, CART_DRVC.amber, 0.8 + 0.4 * (Math.floor(s.time * 3) % 2), 1); },
  hud(s, ctx, W, H, r) {
    const p = s.player, b = r.bars[Math.floor(r.bars.length / 2)];
    if (b && b.rec === r && b.t > b.drop && p && p !== r.owner && Math.hypot(p.x - b.gx, p.z - b.gz) < 70) cartDrvBubble(s, ctx, W, H, b.gx, s.terrain.height(b.gx, b.gz) + 2.6, b.gz, 'ROAD WORK AHEAD', '#ff8a1a', 1, 12, false);
    cartDrvSay(s, ctx, W, H, r.owner, 'BUILT THIS ROAD. CLOSED THIS ROAD.', '#ff8a1a', r.t, 0, 1.3, 12);
  }
};

/* ============ DEATH GUILD: TWO CARS ENTER ============
   A bungee shoots to the nearest rival within 28 m and yanks it in beside the Death Guild car (0.3–1.0 s), then three
   giant foam bats BONK it (1.0, 1.35, 1.7 s); the last bonk spins it out. A ring of light bars (the cage) round the pair. */
CART_ITEM_FX.bungee = {
  use(s, k) {
    let tgt = null, bd = 28; for (const o of s.karts) { if (o === k || o.out || (s.isRace && o.finished)) continue; const d = Math.hypot(o.x - k.x, o.z - k.z); if (d < bd && Math.abs(o.y - k.y) < 4) { bd = d; tgt = o; } }
    cartIxRec(s, 'bungee', { owner: k, tgt, life: tgt ? 2.3 : 0.7, grab: false, fail: false, bonks: 0, side: 1 });
    cartDrvSoundAll(k, [['spring', 0.9, 0.7], ['throw', 0.5, 0.8]]);
    if (k.player) s.banner('TWO CARS ENTER!', '#ff5a5a', 1.2, null, true);
  },
  aiWants(s, k) { return cartIxNear(s, k, 24) || k.ai.itemT < -6; },
  icon(ctx, s, col) {
    for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * 0.55); ctx.fillStyle = '#3a3a42'; ctx.fillRect(-s * 0.06, s * 0.05, s * 0.12, s * 0.45); ctx.fillStyle = sd > 0 ? '#ffd84a' : '#ff6ab0'; burnsRR(ctx, -s * 0.13, -s * 0.55, s * 0.26, s * 0.64, s * 0.12); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = col; ctx.font = `900 ${Math.round(s * 0.28)}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('BONK', 0, s * 0.52);
  }
};
CART_IX_KIND.bungee = {
  update(s, r, dt) {
    const k = r.owner, o = r.tgt;
    if (!o || r.fail) return r.t < r.life;
    if (!r.grab && r.t >= 0.3) {
      r.grab = true;
      if (o.out || o.invT > 0 || Math.hypot(o.x - k.x, o.z - k.z) > 40 || cartDrvShielded(s, o, k, 'bungee')) { r.fail = true; r.life = Math.min(r.life, r.t + 0.5); return true; }
      r.side = ((o.x - k.x) * Math.cos(k.yaw) - (o.z - k.z) * Math.sin(k.yaw)) >= 0 ? 1 : -1;
      cartIxSound(s, 'spring', o.x, o.z, 0.9, 1.1);
      if (o.player) s.banner('BUNGEED!', '#ff5a5a', 1.0, 'by DEATH GUILD');
    }
    if (r.grab && !o.out && r.t < 1.9) {
      // pull it in beside the owner (left or right, whichever side it was on), matching the owner's speed
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = Math.cos(k.yaw), rz = -Math.sin(k.yaw), px = k.x + rx * r.side * 3.2 + fx * 0.5, pz = k.z + rz * r.side * 3.2 + fz * 0.5, e = 1 - Math.exp(-(r.t < 1 ? 6 : 10) * dt);
      o.x = lerp(o.x, px, e); o.z = lerp(o.z, pz, e); o.vx = lerp(o.vx, k.vx, e); o.vz = lerp(o.vz, k.vz, e); o.drift = 0; o.boostT = 0;
    }
    const want = r.t >= 1.7 ? 3 : r.t >= 1.35 ? 2 : r.t >= 1.0 ? 1 : 0;
    while (r.grab && r.bonks < want) {
      r.bonks++;
      cartIxSound(s, 'bossHit', o.x, o.z, 0.9, 0.8 + r.bonks * 0.15); cartIxSound(s, 'kick', o.x, o.z, 0.7, 0.7);
      if (s.fx) s.fx.burst(o.x, o.y + 2.4, o.z, 'star', 10, r.bonks % 2 ? '#ffd84a' : '#ff6ab0');
      if (o.player) s.shakeIt(0.5);
      if (r.bonks < 3) { o.yaw = cartWrap(o.yaw + (r.bonks % 2 ? 0.25 : -0.25)); o.vx *= 0.8; o.vz *= 0.8; }
      else s.hit(o, 'spin', k, { item: 'bungee', dur: 1.2, banner: 'BONKED!' });
    }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, o = r.tgt, C = CART_DRVC; if (!o) return;
    const reach = r.t < 0.3 ? r.t / 0.3 : r.fail ? clamp(1 - (r.t - 0.3) / 0.3, 0, 1) : r.t < 1.9 ? 1 : clamp(1 - (r.t - 1.9) / 0.3, 0, 1); if (reach <= 0) return;
    const y0 = k.y + 1.6, x1 = lerp(k.x, o.x, reach), y1 = lerp(y0, o.y + 1.4, reach), z1 = lerp(k.z, o.z, reach), n = 14, L = Math.hypot(x1 - k.x, z1 - k.z);
    for (let i = 1; i <= n; i++) { const u = i / n, sag = Math.sin(u * Math.PI) * (r.t < 1 ? 0.4 : 1.2) * (1 - L / 40); R.bbs.bb(lerp(k.x, x1, u), lerp(y0, y1, u) - sag, lerp(k.z, z1, u), 0.45, 0.45, S.dot, i % 2 ? C.dark : C.red, 1, false); }
    if (!r.grab || r.fail) return;
    // the cage: light bars in a ring round the pair
    const mx = (k.x + o.x) / 2, mz = (k.z + o.z) / 2, a = clamp(Math.min(r.t - 0.3, r.life - r.t) * 4, 0, 1), gy = s.terrain.height(mx, mz);
    for (let i = 0; i < 16; i++) { const ang = i / 16 * TAU + t * 0.6, px = mx + Math.sin(ang) * 6.5, pz = mz + Math.cos(ang) * 6.5; R.bbs.streak(px, gy + 2.2, pz, 0, 1, 0, 4.4, 0.32, S.streak, i % 2 ? C.red : C.grey, 0.8 * a); }
    R.flat.flat(mx, gy + 0.08, mz, 14, 14, t, S.ring, C.red, 0.7 * a, true);
    // the foam bats: swing up and BONK down onto the victim's roof
    for (let b = 0; b < 3; b++) { const tb = r.t - (0.75 + b * 0.35); if (tb < 0 || tb > 0.4) continue; const sw = tb < 0.25 ? -1.2 + (tb / 0.25) * 1.9 : 0.7, sd = b % 2 ? 1 : -1, hx = o.x + Math.cos(o.yaw) * sd * 2.6, hz = o.z - Math.sin(o.yaw) * sd * 2.6, hy = o.y + 4.2, dx = -Math.cos(o.yaw) * sd * Math.cos(sw), dy = -Math.sin(sw) - 0.2, dz = Math.sin(o.yaw) * sd * Math.cos(sw), l = Math.hypot(dx, dy, dz);
      R.bbs.streak(hx + dx / l * 0.6, hy + dy / l * 0.6, hz + dz / l * 0.6, dx / l, dy / l, dz / l, 1.2, 0.22, S.streak, C.dark, 1); R.bbs.streak(hx + dx / l * 2.1, hy + dy / l * 2.1, hz + dz / l * 2.1, dx / l, dy / l, dz / l, 2.2, 0.85, S.streak, b % 2 ? C.foamBat : C.foamBat2, 1); }
  },
  hud(s, ctx, W, H, r) {
    const k = r.owner, o = r.tgt;
    cartDrvSay(s, ctx, W, H, k, o ? 'TWO CARS ENTER!' : 'NOBODY? FINE.', '#d83a3a', r.t, 0, 1.0);
    if (o && r.grab && !r.fail && r.bonks > 0) { const tb = r.t - [0, 1.0, 1.35, 1.7][r.bonks]; if (tb < 0.35) cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o, 1.4 + tb * 3), o.z, r.bonks < 3 ? 'BONK!' : 'BONK!!!', '#d83a3a', 1 - tb / 0.35, 14 + r.bonks * 3, false); }
  }
};

/* ============ CRUSTY OLD BURNER: BACK IN MY DAY ============
   For 3.5 s an earshot of 16 m follows Crusty. Every rival it reaches (once) is LECTURED: 1 s at a crawl (45 %), then
   2.6 s slowed (60 %), yawning, with his stories drifting over its head. A DISCO SHIELD pops instead. */
const CART_DRV_LECTURE = ['BACK IN MY DAY…', '…IT WAS ALL JUST DUST', 'WE DIDN\'T HAVE GIFT BOXES', 'WE HAD ONE BOX. IT WAS DUST.', 'YOU KIDS AND YOUR LEDs', 'IT WAS BETTER NEXT YEAR. I MEAN LAST YEAR.', 'WE WALKED HERE. BOTH WAYS.'];
CART_ITEM_FX.lecture = {
  use(s, k) { cartIxRec(s, 'lecture', { owner: k, life: 3.6, R: 16, mask: 0, n: 0 }); cartDrvSoundAll(k, [['sloth', 0.9, 0.8], ['swell', 0.35, 0.7]]); if (k.player) s.banner('BACK IN MY DAY…', '#d8a870', 1.2, null, true); },
  aiWants(s, k) { return cartIxNear(s, k, 14) || k.ai.itemT < -5; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#ffffff'; burnsRR(ctx, -s * 0.5, -s * 0.45, s * 0.95, s * 0.6, s * 0.18); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.14); ctx.lineTo(-s * 0.36, s * 0.42); ctx.lineTo(-s * 0.05, s * 0.14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-s * 0.22 + i * s * 0.2, -s * 0.15, s * 0.06, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#9ab0ff'; ctx.font = `900 ${Math.round(s * 0.3)}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('z', s * 0.38, s * 0.4); ctx.font = `900 ${Math.round(s * 0.2)}px ${FONT_UI}`; ctx.fillText('z', s * 0.5, s * 0.18);
  }
};
CART_IX_KIND.lecture = {
  update(s, r, dt) {
    const k = r.owner; if (k.out) return false;
    if (r.t < 3.5) for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot)) || (s.isRace && o.finished)) continue;
      if (Math.hypot(o.x - k.x, o.z - k.z) > r.R + 1 || Math.abs(o.y - k.y) > 5) continue;
      r.mask |= 1 << o.slot;
      if (cartDrvShielded(s, o, k, 'lecture')) continue;
      o.crawlT = Math.max(o.crawlT || 0, 1.0); o.slowT = Math.max(o.slowT, 3.6); o.boredT = 3.6; o.lectureN = r.n++; r.last = o;
      cartDrvTag(s, o, k, 'lecture', 'LECTURED!', '#d8a870');
      cartIxSound(s, 'sloth', o.x, o.z, 0.5, 1.2, 0.3);
    }
    if (s.fx && Math.random() < dt * 10) { const a = Math.random() * TAU, d = Math.random() * r.R; s.fx.add(k.x + Math.sin(a) * d, k.y + 1 + Math.random() * 2, k.z + Math.cos(a) * d, 0, 0.4, 0, 1.6, 1.2, 3.2, CART_DRVC.beige, 0.25, 'smoke', 4); }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, a = clamp(Math.min(r.t * 4, (r.life - r.t) * 2), 0, 1), gy = s.terrain.height(k.x, k.z) + 0.1, C = CART_DRVC;
    R.flat.flat(k.x, gy, k.z, r.R * 2, r.R * 2, t * 0.3, S.ring, C.beige, 0.55 * a, true);
    for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU + t * 0.5, d = r.R * (0.55 + 0.25 * Math.sin(t + i)); R.bbs.bb(k.x + Math.sin(ang) * d, gy + 2 + Math.sin(t * 2 + i) * 0.5, k.z + Math.cos(ang) * d, 5, 3, S.puff, C.beige, 0.32 * a, false, i); }
  },
  hud(s, ctx, W, H, r) {
    const k = r.owner, ln = Math.floor(r.t / 0.85);
    if (r.t < 3.5) cartDrvBubble(s, ctx, W, H, k.x, cartDrvTop(k), k.z, CART_DRV_LECTURE[ln % CART_DRV_LECTURE.length], '#a8784a', Math.min(1, r.t * 5, (3.5 - r.t) * 4), 12);
    // the bored: a yawn (and the story) drifting up over each one
    for (const o of s.karts) if (o.boredT > 0 && o.boredT < 3.6 && (r.mask & (1 << o.slot))) { const u = 1 - o.boredT / 3.6; cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o, 0.8 + u * 2.5), o.z, u < 0.45 ? '*YAWN*' : 'zzz…', '#7a8ab8', Math.min(1, o.boredT), 11); }
  }
};

/* ============ OVERZEALOUS RANGER: 5 MPH! ============
   A giant speed-limit sign drops (0.9 s: its shadow and the zone's outline flash) onto the road in front of the
   nearest rival 40–140 m ahead (else 42 m ahead): a 16 m zone over 70 % of the road on that rival's side. Inside it
   everyone crawls (45 % top speed). 7.5 s. Arenas: a 7 m circle. */
CART_ITEM_FX.fivemph = {
  use(s, k) {
    const race = cartDrvRace(s), L = cartIxTargets(s, k, race ? 140 : 70); let tgt = null; for (const o of L) if (o._ixD > (race ? 25 : 12)) { tgt = o; break; }
    const r = cartIxRec(s, 'fivemph', { owner: k, race, land: 0.9, life: 8.4, s0: 0, d0: 0, d1: 0, sd: 1, x: 0, z: 0, y: 0, yaw: 0, R: 7, mask: 0, tgt });
    if (race) {
      const sp = tgt ? Math.max(8, Math.hypot(tgt.vx, tgt.vz)) : 0; r.s0 = tgt ? tgt.loc.s + sp * 0.9 + 8 : k.loc.s + 42; r.sd = tgt ? (tgt.loc.d >= 0 ? 1 : -1) : (s.rng() < 0.5 ? 1 : -1);
      const g = cartDrvAt(s, r.s0, 0, CART_DRV_SPOT); r.d0 = r.sd > 0 ? -0.4 * g.hw : -g.hw - 1; r.d1 = r.sd > 0 ? g.hw + 1 : 0.4 * g.hw;
      cartDrvAt(s, r.s0, (r.d0 + r.d1) / 2, CART_DRV_SPOT); r.x = CART_DRV_SPOT.x; r.z = CART_DRV_SPOT.z; r.yaw = CART_DRV_SPOT.yaw;
      cartDrvAt(s, r.s0, r.sd * (g.hw + 2), CART_DRV_SPOT); r.px = CART_DRV_SPOT.x; r.pz = CART_DRV_SPOT.z;
    } else { const p = tgt ? { x: tgt.x + tgt.vx * 0.8, z: tgt.z + tgt.vz * 0.8 } : cartIxAhead(s, k, 30, 0, { x: 0, z: 0 }); cartIxInside(s, p, 8); r.x = p.x; r.z = p.z; r.px = p.x; r.pz = p.z; r.yaw = k.yaw; }
    r.y = s.terrain.height(r.x, r.z);
    cartDrvSoundAll(k, [['whistle', 0.9], ['whistle', 0.6, 1.3]]);
    if (k.player) s.banner('5 MPH!', '#ffe24a', 1.0, 'speed limit enforced', true);
    if (tgt && tgt.player) s.banner('SPEED TRAP AHEAD!', '#ffe24a', 1.0, 'take the open lane');
  },
  aiWants(s, k) { const L = cartIxTargets(s, k, s.isRace ? 140 : 70); for (const o of L) if (o._ixD > (s.isRace ? 25 : 12)) return true; return k.ai.itemT < -5; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#ffffff'; burnsRR(ctx, -s * 0.36, -s * 0.5, s * 0.72, s * 0.95, s * 0.1); ctx.fill(); ctx.lineWidth = s * 0.08; ctx.stroke(); ctx.lineWidth = s * 0.04; burnsRR(ctx, -s * 0.28, -s * 0.42, s * 0.56, s * 0.79, s * 0.06); ctx.stroke();
    ctx.fillStyle = '#1a1020'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${Math.round(s * 0.13)}px ${FONT_UI}`; ctx.fillText('LIMIT', 0, -s * 0.27); ctx.font = `900 ${Math.round(s * 0.55)}px ${FONT_UI}`; ctx.fillText('5', 0, s * 0.08);
  }
};
function cartDrvInZone(s, r, o) {
  if (r.race) { let ds = o.loc.s - r.s0; const L = s.T.L; if (ds < -L / 2) ds += L; if (ds > L / 2) ds -= L; return Math.abs(ds) < 8 && o.loc.d > r.d0 && o.loc.d < r.d1; }
  return Math.hypot(o.x - r.x, o.z - r.z) < r.R;
}
CART_IX_KIND.fivemph = {
  update(s, r, dt) {
    if (r.t < r.land) { if (r.t > 0.4) cartDrvZoneObs(s, r); return true; }
    if (!r.landed) { r.landed = true; cartIxSound(s, 'stomp', r.px, r.pz, 0.9, 0.7); cartIxSound(s, 'whistle', r.px, r.pz, 0.7, 0.9); if (s.fx) s.fx.dust(r.px, r.y + 0.3, r.pz, 14, '#e8d8a8'); const p = s.player; if (p && Math.hypot(p.x - r.px, p.z - r.pz) < 30) s.shakeIt(0.4); }
    for (const o of s.karts) {
      if (o.out || o.air || o.shieldT > 0 || o.joyT > 0) continue;
      if (!cartDrvInZone(s, r, o)) continue;
      o.crawlT = Math.max(o.crawlT || 0, 0.25);
      if (!(r.mask & (1 << o.slot))) { r.mask |= 1 << o.slot; if (o !== r.owner) cartDrvTag(s, o, r.owner, 'fivemph', '5 MPH ZONE!', '#ffe24a'); }
    }
    cartDrvZoneObs(s, r);
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_DRVC, land = clamp(r.t / r.land, 0, 1), a = clamp((r.life - r.t) * 2, 0, 1);
    // the zone: a yellow-edged carpet of slow-down chevrons (outline flashing while the sign falls)
    const fl = r.t < r.land ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
    if (r.race) {
      const p = CART_DRV_SPOT;
      for (let j = 0; j < 5; j++) { const sv = r.s0 - 8 + j * 4; const n = Math.ceil((r.d1 - r.d0) / 3.2); for (let i = 0; i < n; i++) { const d = r.d0 + (i + 0.5) * (r.d1 - r.d0) / n; cartDrvAt(s, sv, d, p); const gy = s.terrain.height(p.x, p.z) + 0.07; const edge = j === 0 || j === 4 || i === 0 || i === n - 1; R.flat.flat(p.x, gy, p.z, 3.3, 4.1, p.yaw, S.square, edge ? C.amber : C.dark, (edge ? 0.85 * fl : 0.45 * land) * a, edge); if (!edge && land >= 1) R.flat.flat(p.x, gy + 0.01, p.z, 2.4, 2.4, p.yaw + Math.PI, S.arrow, C.amber, 0.55 * a, true); } }
    } else { R.flat.flat(r.x, r.y + 0.07, r.z, r.R * 2, r.R * 2, 0, S.glow, C.amber, 0.35 * a * fl, true); R.flat.flat(r.x, r.y + 0.08, r.z, r.R * 2.1, r.R * 2.1, t, S.ring, C.amber, 0.9 * a * fl, true); }
    // the sign: a tall post with a white board, dropping from the sky (its shadow grows)
    const dy = (1 - land * land) * 26, gy = s.terrain.height(r.px, r.pz);
    if (r.t < r.land) R.flat.flat(r.px, gy + 0.08, r.pz, 1.5 + land * 3, 1.5 + land * 3, 0, S.shadow, C.black, 0.3 + land * 0.5, false);
    R.bbs.streak(r.px, gy + 2.5 + dy, r.pz, 0, 1, 0, 5, 0.25, S.streak, C.grey, a);
    R.bbs.bb(r.px, gy + 5.8 + dy, r.pz, 3.4, 4.2, S.square, C.dark, a, false);
    R.bbs.bb(r.px, gy + 5.8 + dy, r.pz, 3.1, 3.9, S.square, C.white, a, false);
    if (s.night) R.bbs.bb(r.px, gy + 5.8 + dy, r.pz, 6, 6, S.glow, C.amber, 0.35 * a, true);
  },
  lights(s, r, add) { if (r.t > r.land) add(r.px, 5, r.pz, 12, CART_DRVC.amber, 0.9, 1.2); },
  hud(s, ctx, W, H, r) {
    // the sign's text, drawn over its board at the board's projected size
    const a = clamp((r.life - r.t) * 2, 0, 1), land = clamp(r.t / r.land, 0, 1), gy = s.terrain.height(r.px, r.pz) + (1 - land * land) * 26, p = CART_DRV_P, q = CART_DRV_P2;
    if (!s.R.project(r.px, gy + 7.7, r.pz, W, H, p) || !s.R.project(r.px, gy + 3.9, r.pz, W, H, q)) return;
    const h = q.y - p.y; if (h < 9 || p.w > 160) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#1a1020'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.max(5, h * 0.13).toFixed(1)}px ${FONT_UI}`; ctx.fillText('SPEED', p.x, p.y + h * 0.16); ctx.fillText('LIMIT', p.x, p.y + h * 0.3);
    ctx.font = `900 ${Math.max(8, h * 0.5).toFixed(1)}px ${FONT_UI}`; ctx.fillText('5', p.x, p.y + h * 0.66); ctx.restore();
    cartDrvSay(s, ctx, W, H, r.owner, 'SLOW. DOWN.', '#b8a020', r.t, 0, 1.2);
  }
};
// the AI steers round the zone: obstacle points over its covered part
function cartDrvZoneObs(s, r) {
  if (!r.race) { cartIxObs(s, r.x, r.z, r.R * 0.85); return; }
  for (let j = -1; j <= 1; j++) for (let d = r.d0 + 2; d < r.d1 - 1; d += 4) { cartDrvAt(s, r.s0 + j * 6, d, CART_DRV_SPOT); cartIxObs(s, CART_DRV_SPOT.x, CART_DRV_SPOT.z, 2.6); }
}

/* ============ ANNOYING DJ: AIR HORN ============
   BWAAAMP: a wub-wub shockwave (0.5 s, 22 m). Every rival it reaches steers BACKWARDS for 2.4 s (left is right).
   A DISCO SHIELD blocks it. */
CART_ITEM_FX.airhorn = {
  use(s, k) { cartIxRec(s, 'airhorn', { owner: k, life: 1.3, R: 22, mask: 0, r: 0 }); cartDrvSoundAll(k, [['artcarHorn', 1.0], ['cartBass', 0.8, 1.4]]); if (k.player) s.shakeIt(0.3); },
  aiWants(s, k) { return cartIxNear(s, k, 18) || k.ai.itemT < -5; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#d8dce6'; burnsRR(ctx, -s * 0.5, -s * 0.12, s * 0.32, s * 0.5, s * 0.08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff3a4a'; ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.02); ctx.lineTo(s * 0.18, -s * 0.28); ctx.lineTo(s * 0.18, s * 0.38); ctx.lineTo(-s * 0.2, s * 0.14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(s * 0.18, s * 0.05, s * (0.16 + i * 0.12), -0.8, 0.8); ctx.stroke(); }
  }
};
CART_IX_KIND.airhorn = {
  update(s, r, dt) {
    const k = r.owner; r.x = k.x; r.y = k.y; r.z = k.z;
    const u = clamp(r.t / 0.5, 0, 1); r.r = r.R * (1 - (1 - u) * (1 - u));
    if (r.t < 0.6) for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot)) || (s.isRace && o.finished)) continue;
      if (Math.hypot(o.x - k.x, o.z - k.z) > r.r + 1.5 || Math.abs(o.y - k.y) > 5) continue;
      r.mask |= 1 << o.slot;
      if (s.hit(o, 'drv', k, { item: 'airhorn', banner: 'STEERING BACKWARDS!' })) { o.mixT = 2.4; if (s.fx) s.fx.notes(o.x, o.y + 3, o.z); }
    }
    if (s.fx && r.t < 0.8 && Math.random() < 0.6) s.fx.notes(k.x + (Math.random() - 0.5) * r.r, k.y + 1.5, k.z + (Math.random() - 0.5) * r.r);
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_DRVC, gy = s.terrain.height(r.x, r.z) + 0.15;
    for (let b = 0; b < 3; b++) { const tb = r.t - b * 0.16; if (tb < 0 || tb > 0.7) continue; const u = tb / 0.7, sz = r.R * 2 * (1 - (1 - u) * (1 - u)), a = 1 - u; R.flat.flat(r.x, gy, r.z, sz, sz, 0, S.ring, b % 2 ? C.pink : C.lime, a, true); R.bbs.bb(r.x, gy + 1.5, r.z, sz, sz * 0.25, S.ring, b % 2 ? C.pink : C.lime, a * 0.5, true); }
    const k = r.owner, a = clamp((r.life - r.t) * 3, 0, 1); R.bbs.bb(k.x, cartDrvTop(k, 1.2), k.z, 3 + Math.sin(t * 30) * 0.4, 3 + Math.sin(t * 30) * 0.4, S.glow, C.lime, 0.6 * a, true);
  },
  lights(s, r, add) { if (r.t < 0.7) add(r.x, r.y + 2, r.z, 16, CART_DRVC.lime, 1.4, 2); },
  hud(s, ctx, W, H, r) {
    cartDrvSay(s, ctx, W, H, r.owner, 'BWAAAMP!', '#3ac83a', r.t, 0, 0.6, 16); cartDrvSay(s, ctx, W, H, r.owner, 'WUB WUB WUB', '#ff4fd8', r.t, 0.6, 1.3, 13);
  }
};

/* ============ DARKWAD: LIGHTS OUT ============
   4 s dark: the car turns black, its lights go off, and nothing can hit it (it can't be found). Every rival within
   22 m when it happens loses its line (2.2 s of wandering steering, slowed for 1 s). */
CART_ITEM_FX.lightsout = {
  use(s, k) {
    cartIxRec(s, 'lightsout', { owner: k, life: 4.0 });
    k.darkT = 4.0; k.immuneT = Math.max(k.immuneT || 0, 4.0);
    for (const o of cartDrvAround(s, k, 22, CART_DRV_L)) if (s.hit(o, 'drv', k, { item: 'lightsout', banner: 'WHERE\'D HE GO?' })) { o.lostT = 2.2; o.slowT = Math.max(o.slowT, 1.0); }
    cartDrvSoundAll(k, [['powerdown', 0.9, 0.8], ['secret', 0.5, 0.6]]);
    if (s.fx) for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; s.fx.add(k.x, k.y + 1.2, k.z, Math.sin(a) * 9, 1 + Math.random() * 2, Math.cos(a) * 9, 1.2, 1.4, 4, CART_DRVC.dark, 0.85, 'smoke', 4); }
    if (k.player) s.banner('LIGHTS OUT', '#a08aff', 1.2, 'nobody can see you', true);
  },
  aiWants(s, k) { return cartIxNear(s, k, 18) || k.ai.itemT < -4; },
  icon(ctx, s, col) { ctx.fillStyle = '#16121e'; ctx.beginPath(); ctx.arc(0, 0, s * 0.48, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.06; ctx.stroke(); ctx.fillStyle = col; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * s * 0.17, -s * 0.03, s * 0.1, s * 0.055, sd * 0.3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffffff'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * s * 0.17, -s * 0.03, s * 0.025, 0, TAU); ctx.fill(); } }
};
CART_IX_KIND.lightsout = {
  update(s, r, dt) { const k = r.owner; if (k.out) { k.darkT = 0; return false; } if (s.fx && Math.random() < 0.5) s.fx.add(k.x + (Math.random() - 0.5) * 3, k.y + 0.5 + Math.random() * 2, k.z + (Math.random() - 0.5) * 3, 0, 0.6, 0, 1.0, 1.0, 2.6, CART_DRVC.dark, 0.6, 'smoke', 4); return r.t < r.life; },
  sprites(s, R, r, S, t) {
    const k = r.owner, C = CART_DRVC, gy = s.terrain.height(k.x, k.z) + 0.08, a = clamp(Math.min(r.t * 4, (r.life - r.t) * 3), 0, 1);
    R.flat.flat(k.x, gy, k.z, 10, 11, k.yaw, S.glow, C.dark, 0.85 * a, false);
    // two eyes in the dark (they blink)
    const bl = (t * 0.7) % 1 < 0.06 ? 0.15 : 1, top = cartDrvTop(k, 0.2), rx = Math.cos(k.yaw), rz = -Math.sin(k.yaw);
    for (const sd of [-1, 1]) R.bbs.bb(k.x + rx * sd * 0.45, top, k.z + rz * sd * 0.45, 0.55, 0.55 * bl, S.dot, C.violet, a, true);
  },
  hud(s, ctx, W, H, r) {
    const p = s.player; cartDrvSay(s, ctx, W, H, r.owner, 'HEADLIGHTS? NEVER HEARD OF THEM.', '#6a5aa8', r.t, 0.1, 1.6, 12);
    // the player lost in the dark (or being the dark one): the screen closes in
    if (p && (p.lostT > 0 || p === r.owner)) { const a = p === r.owner ? 0.35 * clamp(Math.min(r.t * 3, (r.life - r.t) * 2), 0, 1) : 0.7 * Math.min(1, p.lostT); const g = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.18, W / 2, H * 0.55, Math.max(W, H) * 0.62); g.addColorStop(0, 'rgba(8,4,18,0)'); g.addColorStop(1, 'rgba(8,4,18,' + a.toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }
};

/* ============ BAD IDEA GUY: HOLD MY WATER ============
   A rocket on the roof: 2.8 s at 160 % top speed, bowling aside anything in front. One time in four it sputters at
   0.7 s ("UH OH") and blows up at 1.2 s: he is launched, and every car within 6 m is knocked away. */
CART_ITEM_FX.holdwater = {
  use(s, k) {
    cartIxRec(s, 'holdwater', { owner: k, life: 2.8, bad: s.rng() < 0.25, boom: false, mask: 0 });
    k.vmaxMin = 1.6; s.boost(k, 1.0, 'mt2');
    cartDrvSoundAll(k, [['firework_launch', 1.0, 0.6], ['kartBoost', 0.7, 0.8]]);
    if (k.player) s.banner('HOLD MY WATER!', '#ff7a2a', 1.0, 'watch this', true);
  },
  aiWants(s, k) { return (!s.isRace || Math.abs(s.T.K[s.T.idx(k.loc.s + 30)]) < 0.012) && (k.rank > 1 || cartIxTargets(s, k, 40).length > 0 || k.ai.itemT < -3); },
  icon(ctx, s, col) {
    ctx.save(); ctx.rotate(-0.7); ctx.fillStyle = '#5ac8ff'; ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.22, s * 0.5); ctx.strokeRect(-s * 0.3, -s * 0.1, s * 0.22, s * 0.5);
    ctx.fillStyle = '#f0f0f4'; ctx.fillRect(-s * 0.06, -s * 0.3, s * 0.24, s * 0.66); ctx.strokeRect(-s * 0.06, -s * 0.3, s * 0.24, s * 0.66);
    ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.3); ctx.lineTo(s * 0.06, -s * 0.56); ctx.lineTo(s * 0.18, -s * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(-s * 0.04, s * 0.36); ctx.lineTo(s * 0.06, s * 0.62); ctx.lineTo(s * 0.16, s * 0.36); ctx.closePath(); ctx.fill(); ctx.restore();
  }
};
CART_IX_KIND.holdwater = {
  update(s, r, dt) {
    const k = r.owner, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    if (k.out) { if (k.vmaxMin === 1.6) k.vmaxMin = 0; return false; }
    if (r.boom) return r.t < r.life;
    if (r.bad && r.t >= 1.2) {
      r.boom = true; if (k.vmaxMin === 1.6) k.vmaxMin = 0; r.life = r.t + 0.9;
      cartIxBoom(s, k.x, k.y + 1.5, k.z, 1.1);
      cartIxBlast(s, k.x, k.y, k.z, 6, 'knock', k, 'holdwater', 13, 0, k);
      k.immuneT = 0; k.invT = 0; s.hit(k, 'launch', null, { item: 'holdwater', vy: 11, banner: 'BAD IDEA!' });
      s.log('backfire', { k: k.id, item: 'holdwater' });
      return true;
    }
    // bowl aside whatever is right in front
    for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot))) continue;
      const dx = o.x - k.x, dz = o.z - k.z, al = dx * fx + dz * fz, sd = dx * fz - dz * fx;
      if (al > 0.5 && al < 5 && Math.abs(sd) < 2.8 && Math.abs(o.y - k.y) < 3) { r.mask |= 1 << o.slot; const g = sd >= 0 ? -1 : 1; s.hit(o, 'knock', k, { item: 'holdwater', dx: -fz * g * 0.9 + fx * 0.4, dz: fx * g * 0.9 + fz * 0.4, power: 14 }); }
    }
    // the rocket's exhaust (sputtering smoke before a backfire)
    if (s.fx) { const p = cartCarPoint(k, 0, (k.M ? k.M.h : 2.5) + 0.2, -1.6, CART_IX_T.a), sput = r.bad && r.t > 0.7; for (let i = 0; i < 2; i++) s.fx.add(p[0], p[1], p[2], -fx * 10 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, -fz * 10 + (Math.random() - 0.5) * 2, 0.25, sput ? 0.4 : 0.9, 0.2, CART_IXC.fire, 1, 'flame', 1); if (Math.random() < (sput ? 0.9 : 0.4)) s.fx.add(p[0], p[1], p[2], -fx * 4, 1, -fz * 4, 1.2, 0.8, 2.4, sput ? CART_IXC.smoke : CART_IXC.white, 0.5, 'smoke', 4); }
    if (r.t >= r.life) { if (k.vmaxMin === 1.6) k.vmaxMin = 0; return false; }
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner; if (r.boom) return; const C = CART_DRVC, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), top = (k.M ? k.M.h : 2.5) + 0.35, P = cartCarPoint(k, 0, top, 0, CART_IX_T.b);
    const shake = r.bad && r.t > 0.7 ? Math.sin(t * 60) * 0.12 : 0;
    R.bbs.streak(P[0] + shake, P[1], P[2], fx, 0, fz, 3.2, 0.75, S.streak, C.white, 1);
    R.bbs.streak(P[0] + fx * 1.9 + shake, P[1], P[2] + fz * 1.9, fx, 0, fz, 0.8, 0.6, S.streak, C.red, 1);
    R.bbs.bb(P[0] - fx * 1.9, P[1], P[2] - fz * 1.9, 2.2, 2.2, S.glow, CART_IXC.fire, 0.95, true);
    R.bbs.streak(P[0] - fx * 3.6, P[1], P[2] - fz * 3.6, fx, 0, fz, 3.4, 0.9, S.streak, CART_IXC.fire, 0.8);
  },
  lights(s, r, add) { const k = r.owner; if (!r.boom) add(k.x, k.y + 3, k.z, 9, CART_IXC.fire, 1.2, 1.5); },
  hud(s, ctx, W, H, r) {
    const k = r.owner;
    cartDrvSay(s, ctx, W, H, k, 'HOLD MY WATER. WATCH THIS.', '#d8601a', r.t, 0, 0.7, 12);
    if (r.bad && !r.boom) cartDrvSay(s, ctx, W, H, k, 'UH OH.', '#d8301a', r.t, 0.7, 1.2, 15);
    if (r.boom) cartDrvSay(s, ctx, W, H, k, 'NAILED IT!', '#d8601a', r.t, 1.4, 2.0, 13);
    if (!r.bad) cartDrvSay(s, ctx, W, H, k, 'WOOOOOO!', '#d8601a', r.t, 0.8, 2.4, 14);
  }
};

/* ============ MESSIAH COMPLEX: PART THE TRAFFIC ============
   A red carpet rolls 55 m up the road from his car, a spotlight follows him (2.8 s at 130 %), and every car ahead
   within 70 m (arenas: 40 m in front) is pushed politely aside, off the carpet, for 1.8 s (slowed while it shuffles).
   A DISCO SHIELD keeps you in your lane. Nothing religious: the joke is how important he thinks he is. */
CART_ITEM_FX.parting = {
  use(s, k) {
    const race = cartDrvRace(s), r = cartIxRec(s, 'parting', { owner: k, race, life: 3.2, s0: race ? k.loc.s : 0, d0: race ? k.loc.d : 0, x0: k.x, z0: k.z, yaw0: k.yaw, n: 0 });
    for (const o of s.karts) {
      if (o === k || o.out || (s.isRace && o.finished)) continue;
      let ok;
      if (race) { const d = o.prog - k.prog; ok = d > 1 && d < 70; }
      else { const dx = o.x - k.x, dz = o.z - k.z; ok = Math.hypot(dx, dz) < 40 && dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw) > 0; }
      if (!ok || cartDrvShielded(s, o, k, 'parting')) continue;
      o.partT = 1.8; r.n++;
      if (race) o.partSide = o.loc.d >= r.d0 ? 1 : -1;
      else { const sd = (o.x - k.x) * Math.cos(k.yaw) - (o.z - k.z) * Math.sin(k.yaw) >= 0 ? 1 : -1; o.partNX = Math.cos(k.yaw) * sd; o.partNZ = -Math.sin(k.yaw) * sd; }
      cartDrvTag(s, o, k, 'parting', 'MAKE WAY!', '#fff0c8');
    }
    k.vmaxMin = 1.3; s.boost(k, 0.8, 'glow');
    cartDrvSoundAll(k, [['swell', 0.7, 1.2], ['secret', 0.8], ['crowd', 0.35]]);
    if (k.player) s.banner('PART THE TRAFFIC', '#fff0c8', 1.2, r.n ? r.n + (r.n === 1 ? ' car steps aside' : ' cars step aside') : 'the road is yours', true);
  },
  aiWants(s, k) { return cartIxTargets(s, k, s.isRace ? 60 : 35).length > 0 || k.ai.itemT < -4; },
  icon(ctx, s, col) {
    ctx.fillStyle = '#c81a2a'; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.5); ctx.lineTo(s * 0.15, s * 0.5); ctx.lineTo(s * 0.06, -s * 0.2); ctx.lineTo(-s * 0.06, -s * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-s * 0.15, s * 0.42, s * 0.3, s * 0.06);
    ctx.fillStyle = '#a8101a'; ctx.beginPath(); ctx.ellipse(0, -s * 0.24, s * 0.3, s * 0.12, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.06; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * s * 0.25, s * 0.35); ctx.lineTo(sd * s * 0.48, s * 0.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sd * s * 0.25, s * 0.15); ctx.lineTo(sd * s * 0.46, -s * 0.08); ctx.stroke(); }
  }
};
CART_IX_KIND.parting = {
  update(s, r, dt) {
    const k = r.owner; if (k.out) { if (k.vmaxMin === 1.3) k.vmaxMin = 0; return false; }
    if (r.t >= 2.8 && k.vmaxMin === 1.3) k.vmaxMin = 0;
    if (s.fx && Math.random() < 0.6) s.fx.glint(k.x + (Math.random() - 0.5) * 3, k.y + 1 + Math.random() * 2.5, k.z + (Math.random() - 0.5) * 3, '#fff4d0');
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, C = CART_DRVC, unroll = clamp(r.t / 0.6, 0, 1), a = clamp((r.life - r.t) * 2, 0, 1), L = 55 * unroll;
    // the red carpet with gold edges, and the roll at its front
    if (r.race) { const p = CART_DRV_SPOT; for (let ds = 0; ds < L; ds += 2.5) { cartDrvAt(s, r.s0 + ds, r.d0, p); const gy = s.terrain.height(p.x, p.z) + 0.06; R.flat.flat(p.x, gy, p.z, 3.6, 3.6, p.yaw, S.square, C.carpet, 0.97 * a, false); for (const sd of [-1, 1]) R.flat.flat(p.x + p.nx * sd * 1.85, gy + 0.01, p.z + p.nz * sd * 1.85, 0.34, 3.6, p.yaw, S.square, C.gold, 0.95 * a, false); }
      cartDrvAt(s, r.s0 + L, r.d0, p); if (unroll < 1) R.bbs.streak(p.x, s.terrain.height(p.x, p.z) + 0.45, p.z, p.nx, 0, p.nz, 3.6, 0.9, S.streak, C.carpet, 1); }
    else { const fx = Math.sin(r.yaw0), fz = Math.cos(r.yaw0); for (let ds = 0; ds < L * 0.7; ds += 2.5) { const x = r.x0 + fx * ds, z = r.z0 + fz * ds, gy = s.terrain.height(x, z) + 0.06; R.flat.flat(x, gy, z, 3.6, 3.6, r.yaw0, S.square, C.carpet, 0.97 * a, false); } }
    // his spotlight from the sky
    const gy = s.terrain.height(k.x, k.z); R.bbs.streak(k.x, gy + 15, k.z, 0, 1, 0, 30, 4, S.streak, C.goldHi, 0.35 * a); R.flat.flat(k.x, gy + 0.08, k.z, 8, 8, 0, S.glow, C.goldHi, 0.6 * a, true);
  },
  lights(s, r, add) { const k = r.owner; add(k.x, k.y + 4, k.z, 12, CART_DRVC.goldHi, 1.4, 2); },
  hud(s, ctx, W, H, r) {
    const k = r.owner; cartDrvSay(s, ctx, W, H, k, r.n ? 'BEHOLD… MY LANE.' : 'BEHOLD… AN EMPTY ROAD.', '#c8a040', r.t, 0, 1.5, 13); cartDrvSay(s, ctx, W, H, k, 'NO PHOTOS, PLEASE.', '#c8a040', r.t, 1.6, 2.8, 12);
    let n = 0; for (const o of s.karts) if (o.partT > 0.9 && o !== k && n < 2) { n++; cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o, 0.8 + (o.slot % 2) * 1.2), o.z, o.slot % 2 ? 'EXCUSE ME?' : 'OH! SORRY!', '#c8a040', Math.min(1, (o.partT - 0.9) * 3), 11); }
  }
};

/* ============ PARTY BOY: WHERE'S THE AFTERPARTY? ============
   He fist-pumps into a rave train: 3.4 s at 135 %, and every rival within 24 m joins the train for 2.6 s, its steering
   pulled onto his line 7 m behind him (you can fight it a little), dancing, a step slower. A DISCO SHIELD blocks it. */
CART_ITEM_FX.afterparty = {
  use(s, k) {
    const r = cartIxRec(s, 'afterparty', { owner: k, life: 3.4, beat: 0, n: 0 });
    for (const o of cartDrvAround(s, k, 24, CART_DRV_L)) if (s.hit(o, 'drv', k, { item: 'afterparty', banner: 'RAVE TRAIN!' })) { o.trainT = 2.6; o.trainBy = k; r.n++; }
    k.vmaxMin = 1.35; s.boost(k, 0.8, 'mt2');
    cartDrvSoundAll(k, [['disco', 0.8], ['cartBass', 0.7, 1.2], ['crowd', 0.4]]);
    if (k.player) s.banner('WHERE\'S THE AFTERPARTY?!', '#38f2ff', 1.2, r.n ? r.n + ' in the train' : null, true);
  },
  aiWants(s, k) { return cartIxNear(s, k, 20) || k.ai.itemT < -4; },
  icon(ctx, s, col) {
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.1 + i * 0.13); ctx.fillStyle = BURNS_NEON[i]; ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.lineTo(Math.cos(a) * s * 0.58, s * 0.3 + Math.sin(a) * s * 0.58); ctx.lineTo(Math.cos(a + 0.13) * s * 0.58, s * 0.3 + Math.sin(a + 0.13) * s * 0.58); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#1a1020'; ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.58, Math.PI * 1.1, Math.PI * 1.1 + 0.13 * 7); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.05, s * 0.28, s * 0.1, s * 0.25);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = BURNS_NEON[(i + 2) % 7]; ctx.beginPath(); ctx.arc(-s * 0.36 + i * s * 0.18, s * 0.5, s * 0.07, 0, TAU); ctx.fill(); }
  }
};
CART_IX_KIND.afterparty = {
  update(s, r, dt) {
    const k = r.owner; if (k.out) { if (k.vmaxMin === 1.35) k.vmaxMin = 0; return false; }
    const b = Math.floor(r.t / 0.476); if (b > r.beat) { r.beat = b; cartIxSound(s, 'cartBass', k.x, k.z, 0.5, 1.3 + (b % 2) * 0.2); }
    if (s.fx && Math.random() < 0.5) s.fx.notes(k.x, k.y + 3, k.z);
    if (r.t >= r.life) { if (k.vmaxMin === 1.35) k.vmaxMin = 0; return false; }
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, a = clamp(Math.min(r.t * 4, (r.life - r.t) * 2), 0, 1), pulse = Math.pow(Math.max(0, Math.sin(r.t / 0.476 * Math.PI)), 4);
    const gy = s.terrain.height(k.x, k.z) + 0.1; R.flat.flat(k.x, gy, k.z, 9 + pulse * 3, 9 + pulse * 3, t, S.ring, CART_DRV_NEONF[Math.floor(t * 4) % 7], 0.8 * a, true);
    // the train: a neon line from car to car, every member with a pulsing ring
    let prev = k;
    for (const o of s.karts) { if (!(o.trainT > 0 && o.trainBy === k)) continue; const c = CART_DRV_NEONF[o.slot % 7], dx = prev.x - o.x, dy = prev.y - o.y, dz = prev.z - o.z, l = Math.hypot(dx, dy, dz) || 1; R.bbs.streak((o.x + prev.x) / 2, (o.y + prev.y) / 2 + 1.2, (o.z + prev.z) / 2, dx / l, dy / l, dz / l, l, 0.35, S.streak, c, 0.8 * a); R.flat.flat(o.x, s.terrain.height(o.x, o.z) + 0.1, o.z, 6 + pulse * 2, 6 + pulse * 2, -t, S.ring, c, 0.8 * a, true); R.bbs.bb(o.x, cartDrvTop(o, 0.5 + pulse * 0.6), o.z, 1.2, 1.2, S.note || S.star, c, a, true); prev = o; }
  },
  lights(s, r, add) { const k = r.owner; add(k.x, k.y + 3, k.z, 12, CART_DRV_NEONF[Math.floor(s.time * 4) % 7], 1.3, 1.6); },
  hud(s, ctx, W, H, r) {
    const k = r.owner, p = s.player; cartDrvSay(s, ctx, W, H, k, 'WHERE\'S THE AFTERPARTY?!', '#18b8c8', r.t, 0, 1.5, 13); cartDrvSay(s, ctx, W, H, k, 'FOLLOW ME!!', '#18b8c8', r.t, 1.6, 3.2, 13);
    for (const o of s.karts) if (o.trainT > 0 && o.trainBy === k) cartDrvBubble(s, ctx, W, H, o.x, cartDrvTop(o), o.z, (Math.floor(r.t * 2) % 2) ? '♪ OONTZ ♪' : '♪ OONTZ OONTZ ♪', '#18b8c8', Math.min(1, o.trainT * 2), 11);
    if (p && p.trainT > 0 && p.trainBy === k) { const a = Math.min(1, p.trainT) * (0.5 + 0.5 * Math.sin(s.time * 13)); ctx.save(); ctx.strokeStyle = BURNS_NEON[Math.floor(s.time * 6) % 7]; ctx.globalAlpha = a; ctx.lineWidth = 9; ctx.strokeRect(5, 5, W - 10, H - 10); ctx.restore(); }
  }
};
// the player's own cues: steering backwards (a mirrored arrow line), crawling
const cartDrvPlayerCues = (s, ctx, W, H) => {
  const p = s.player; if (!p || s.state !== 'race') return;
  if (p.mixT > 0) { const a = Math.min(1, p.mixT * 2), y = H * 0.3; ctx.save(); ctx.globalAlpha = a; BurnsUI.text(ctx, '⇄ STEERING BACKWARDS ⇄', W / 2, y, 18 + Math.sin(s.time * 12) * 1.5, '#7aff5a', { glow: '#3ac83a' }); ctx.restore(); }
  if (p.crawlT > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, p.crawlT * 4) * 0.9; BurnsUI.text(ctx, 'CRAWLING…', W / 2, H * 0.3 + 26, 14, '#ffe24a', {}); ctx.restore(); }
};
// one always-on record (made at load) draws them in the items' HUD pass
CART_IX_KIND.drvcues = { update(s, r, dt) { return true; }, hud(s, ctx, W, H) { cartDrvPlayerCues(s, ctx, W, H); } };

/* ---------------- test API: window.BRADY_CART.debug gets driver helpers (tools/cart_driver_test.js) ---------------- */
if (typeof window !== 'undefined') {
  if (window.BRADY_BURNS) for (const k of ['CART_DRIVERS', 'CART_DRIVER_SPECIALS', 'CART_TRACKS']) Object.defineProperty(window.BRADY_BURNS, k, { get: () => eval(k), configurable: true });
  setTimeout(() => {
    const C = window.BRADY_CART; if (!C || !C.debug) return;
    Object.assign(C.debug, {
      drivers() { return CART_DRIVERS.map(d => ({ id: d.id, name: d.name, stat: d.stat, special: d.special, specialName: CART_ITEMS[d.special] && CART_ITEMS[d.special].name })); },
      kartDrv(i) { const s = Game.scene, k = i < 0 || i === undefined ? s.player : s.karts[i]; return { drv: k.drv.id, crawlT: +(k.crawlT || 0).toFixed(2), mixT: +(k.mixT || 0).toFixed(2), lostT: +(k.lostT || 0).toFixed(2), trainT: +(k.trainT || 0).toFixed(2), partT: +(k.partT || 0).toFixed(2), boredT: +(k.boredT || 0).toFixed(2), joyT: +(k.joyT || 0).toFixed(2), darkT: +(k.darkT || 0).toFixed(2), d: +(k.loc ? k.loc.d : 0).toFixed(2), vmax: +k.vmax.toFixed(3), acc: +k.acc.toFixed(3), turn: +k.turn.toFixed(3), mass: +k.mass.toFixed(3) }; }
    });
  }, 0);
}
