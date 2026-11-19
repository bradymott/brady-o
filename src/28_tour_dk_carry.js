/* ============================================================
   World tour: powers carry from one level to the next.
   When Brady clears a level (any exit, boss levels included), what
   he holds is written to the save (Save.data.tour.carry); the next
   tour level he starts fresh (from the map, NEXT, PLAY AGAIN or
   RESTART LEVEL) gives it back:
   - FORM: big (magic mushroom) or the joint (smoke puffs); the
     Hydration Station gift and opts.power still apply (the larger
     one wins);
   - HANDS: the gear item (with its uses left) or the country's
     signature item (with its time left: the carpet, the chili);
   - FEET: the jump power (Spring Socks, Pound Cake, Magic Beans,
     with a full gas meter);
   - BUFFS: the magnet and sundial timers, the time left;
   - TIMED: the LSD flight, the invincibility star and the trip
     colours (the mushroom's dizzy colours, the joint's green
     moment): the time left when he touched the exit;
   - the power picker's choice (which power THROW uses).
   Not here: the Backpack (already kept in Save.data.pack, live,
   through deaths and between levels, as before), the kandi
   bracelet (the gift gives one at every level start, as before),
   keys, boxes, rides, lives, coins and score (level-bound or
   already global).
   Rules:
   - a death keeps the in-level rules: Brady respawns small with
     nothing (a respawn is a Play built with opts.checkpoint, also
     after GAME OVER -> CONTINUE); the stored carry is untouched;
   - quitting (WORLD MAP, RESTART LEVEL) or GAME OVER -> MAP leave
     the stored carry as it was when he entered: re-entering gives
     it again (no way to lose or to farm powers by quitting);
   - a clear always overwrites it (a replayed level too);
   - parking: a level that starts on a moving ride (an autoscroll:
     boats, trains, the gondola, the surf) or underwater would
     waste or misuse a flight (the LSD tab, a flying signature
     item: he would float off the boat), so those wait in the carry
     (carry.parked) and come back at the next level that starts on
     foot. A parked signature item waits until his hands are free
     at a level start.
   Everything else that limits a power is already in the engine
   (jump powers off while carrying a box, bounded in boss arenas).
   ============================================================ */
const TourCarry = {
  TIMED: ['star', 'lsd', 'dizzy', 'joint'],
  // the store in the save (null when there is none: an old save, a new game)
  get() { const T = Save.data && Save.data.tour; const c = T && T.carry; return c && typeof c === 'object' ? c : null; },
  set(c) { const T = typeof TourProgress !== 'undefined' ? TourProgress.data() : (Save.data.tour || (Save.data.tour = {})); T.carry = c; },
  // the start area of a level: a ride or autoscroll (the screen moves on its own) or underwater: no flight at the start
  noFlightStart(level) {
    const s = level && level.start, a = s && level.areas && level.areas[s.area || 0];
    if (!a) return false;
    return !!(a.autoscroll || a.water || a.gen === 'ride' || a.gen === 'rail' || a.gen === 'swim');
  },
  flightSig(sig) { const P = sig && typeof TourPowers !== 'undefined' ? TourPowers.get(sig.id) : null; return !!(P && P.flight); },
  round(x) { return Math.round(x * 100) / 100; },
  // what Brady holds right now (a plain object, JSON-safe)
  snapshot(play) {
    const p = play.player, c = { v: 1, from: play.id };
    if (!p) return c;
    c.power = p.power > 0 ? p.power : 0;
    if (p.star > 0) c.star = this.round(p.star);
    if (p.lsdT > 0) c.lsd = this.round(p.lsdT);
    if (play.dizzy > 0) c.dizzy = this.round(play.dizzy);
    if (play.tripJoint > 0) c.joint = this.round(play.tripJoint);
    if (p.hands && p.hands.id) c.hands = { id: p.hands.id, uses: p.hands.uses || 0 };
    else if (p.sig && p.sig.id) c.sig = { id: p.sig.id, t: this.round(p.sig.t || 0), n: p.sig.n || 0 };
    if (p.jumpPow && p.jumpPow.id) c.jump = { id: p.jumpPow.id };
    if (p.buffs) { const b = {}; let any = false; for (const k in p.buffs) if (p.buffs[k] > 0) { b[k] = this.round(p.buffs[k]); any = true; } if (any) c.buffs = b; }
    if (play.powHist && play.powHist.length) c.pick = { hist: play.powHist.slice(-12), seq: Object.assign({}, play.powSeq || {}), n: play.powN || 0 };
    // what waited in the carry during this level comes along (the slot is free again, or it waits on)
    const pk = play.carryParked;
    if (pk) {
      if (pk.lsd > 0) c.lsd = Math.max(c.lsd || 0, pk.lsd);
      if (pk.sig) { if (!c.hands && !c.sig) c.sig = pk.sig; else c.parked = { sig: pk.sig }; }
    }
    return c;
  },
  // split a stored carry for this level: what Brady gets now, and what waits
  split(c, level) {
    const now = Object.assign({}, c), park = {};
    delete now.parked;
    const noFly = this.noFlightStart(level);
    if (noFly && now.lsd > 0) { park.lsd = now.lsd; delete now.lsd; }
    if (now.sig && noFly && this.flightSig(now.sig)) { park.sig = now.sig; delete now.sig; }
    const ps = c.parked && c.parked.sig;
    if (ps) {
      if (!now.sig && !now.hands && !(noFly && this.flightSig(ps))) now.sig = ps;
      else if (!park.sig) park.sig = ps;
    }
    return { now, park: (park.lsd > 0 || park.sig) ? park : null };
  },
  // Play's constructor calls this last (12_play.js)
  start(play, opts) {
    if (!play.level || !play.level.tour) return;
    const c = this.get();
    if (!c) return;
    const respawn = !!opts && Object.prototype.hasOwnProperty.call(opts, 'checkpoint');
    const sp = this.split(c, play.level);
    // a respawn: the in-level rules (Brady comes back small with nothing); only what waits keeps waiting
    if (respawn) { play.carryParked = sp.park; return; }
    play.carryParked = sp.park;
    const got = this.apply(play, sp.now);
    if (got && play.toast) play.toast(sp.park ? 'POWERS KEPT! (SOME WAIT FOR THE NEXT LEVEL)' : 'POWERS KEPT FROM THE LAST LEVEL!');
    else if (sp.park && play.toast) play.toast('YOUR TRIP WAITS FOR THE NEXT LEVEL');
    play.carryApplied = sp.now;
  },
  // give Brady a loadout; true if anything was given
  apply(play, c) {
    const p = play.player; if (!p || !c) return false;
    let got = false;
    const pw = Math.min(2, Math.floor(+c.power || 0));   // 0 small, 1 big, 2 the joint
    if (pw > 0 && pw > p.power) { p.setPower(pw, true); got = true; }
    if (c.hands && typeof TourGear !== 'undefined' && TourGear.get(c.hands.id)) { p.hands = { id: c.hands.id, uses: c.hands.uses || 0, t: 0, cool: 0 }; p.sig = null; got = true; }
    else if (c.sig && typeof TourPowers !== 'undefined' && TourPowers.get(c.sig.id)) { p.sig = { id: c.sig.id, t: c.sig.t || 0, n: c.sig.n || 0 }; p.hands = null; got = true; }
    if (c.jump && typeof TourJump !== 'undefined' && TourJump.is(c.jump.id)) { p.jumpPow = { id: c.jump.id, gas: 1, used: false, pants: 0 }; got = true; }
    if (c.buffs && p.buffs) for (const k in c.buffs) if (c.buffs[k] > 0) { p.buffs[k] = c.buffs[k]; got = true; }
    if (c.lsd > 0 && c.lsd <= 10) { p.lsdT = c.lsd; p.glideT = 0; play.lsdK = 0.2; got = true; }
    if (c.star > 0 && c.star <= 10) { p.star = c.star; play.mus('star'); got = true; }
    if (c.dizzy > 0) play.dizzy = c.dizzy;
    if (c.joint > 0) play.tripJoint = c.joint;
    if (c.pick && Array.isArray(c.pick.hist)) { play.powHist = c.pick.hist.slice(); play.powSeq = Object.assign({}, c.pick.seq || {}); play.powN = c.pick.n || 0; }
    return got;
  }
};
{
  // a clear: write what he holds, read before the clear takes the star away
  const lc = Play.prototype.levelClear;
  Play.prototype.levelClear = function (gate) {
    let snap = null;
    if (this.state === 'play' && this.level && this.level.tour) { try { snap = TourCarry.snapshot(this); } catch (err) { console.error('carry snapshot', err); } }
    const r = lc.call(this, gate);
    if (snap && this.state === 'clear') { TourCarry.set(snap); Save.save(); }
    return r;
  };
}
try { window.BRADY_CARRY = TourCarry; } catch (e) { /* not in a browser */ }
