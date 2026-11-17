/* ============================================================
   World tour: Pupo, Brady-O's rideable sloth (docs/design/PUPO.md,
   PU-1 "mount core").
   - the Nap Box: a QBLOCK whose contents are 'pupo', with a 'napBox'
     entity drawn over the tile (a brown travel carton, breathing,
     snoring); it opens every way a gift box does; a used one refills
     ("...I was... in here... the whole time.")
   - pupoFree: Pupo when Brady is not on him (sitting, asleep, waking,
     parked at a door, packing up at the level clear)
   - riding: a 28 x 58 box, 0.77x ground speed (the same run-after-
     0.42 s rule), 1.6x swimming, the same jump, a flop (hold Down) to
     crawl through 1-tile gaps; Down + Jump or holding Down 1 s hops off
   - hits: drowsy (8 s), then a nap on the spot; Brady pops off unhurt
     and wakes him by walking into him (a poke in *his* pupo)
   - the ride survives doors, areas and respawns; areas Pupo cannot go
     into (rails, rides, scrolls, carry, flip bands, boss arenas, glide)
     park him at the door; nothing is carried into the next level
   - the map: once met, Pupo rides piggyback on Brady on the overworld
   Everything is a wrapper of an existing method, the way the jump
   powers are (28_tour_di_jumps.js); this file loads after them, so its
   wrappers are outermost. Brady's old Slothy mount (this.mounted) is
   never used: its dismount() is not in this app's build.
   The stretch arms (28_tour_pa_reach.js) and PUPO POWER! (pb_power)
   plug into PupoRide.modes / afters / overs / napSpots.
   ============================================================ */
const PupoRide = {
  // constants (PUPO.md §7.5), in px and px/s; shared with the validator module (PU-4)
  K: {
    W: 28, H: 58, FLOP_H: 30, SPEED_MUL: 0.77, SWIM_MUL: 1.6, JUMP_BOOST: 1.0, FLOP_SPEED: 2.8 * TS,
    DROWSY: 8, GRACE: 1.5, NAP_POP: 9 * TS, NAP_INV: 2, WAKE: 0.6, MOUNT_T: 0.25, HOLD_HOP: 1.0,
    METER_T: 30, METER_POKE: 0.10, METER_HIT: 0.25, METER_START: 0.5
  },
  ART: 0.8,                 // Pupo's art units -> world px (his back is about 1.1 tiles high)
  modes: {},                // R.mode -> { update(p, dt, inp, g, R), pose(p, R, o) }: climbing, hanging, swinging... (PU-2, PU-3)
  afters: [],               // after Brady's step while riding: (p, dt, inp, g, R, inMode)
  overs: [],                // drawn after the ride, in world space: (ctx, p, g, R, t)
  napSpots: [],             // where a Pupo who falls asleep in mid-air ends up: (g, p) -> { x, y, hang } or null
  says: { ow: '...OW.', better: '...BETTER.', pupo: '...PUPO.', wake: '...PUPO?', wait: "...I'LL... WAIT... HERE.", box: '...I WAS... IN HERE... THE WHOLE TIME.', nap: '...ZZZ.', first: '...I HAD... A GOOD NAP.' },

  /* ---------- the run state (on the Play scene; the checkpoint carries met and the meter over a respawn) ---------- */
  st(g) {
    let R = g.pupo;
    if (!R) {
      R = g.pupo = { met: false, where: 'none', meter: 0, drowsyT: 0, shieldT: 0, powerShield: 0, mode: '', free: null, freeArea: -1, parkArea: -1,
        lastBox: { area: -1, tx: 0, ty: 0 }, lastGround: { area: -1, x: 0, y: 0 }, holdT: 0, mountT: 0, walkPh: 0, boxScan: 0, showT: 0, sayT: 0,
        draw: { x: 0, y: 0, scale: 1, facing: 1, t: 0, pose: 'ride', mood: 'calm', rider: null, armsOff: false, phase: null, spiral: 0, still: false },
        bo: { x: 0, y: 0, facing: 1, small: false, power: 0, anim: null, hair: null, look: null, star: false, time: 0, fly: false, floaty: false, trip: false, held: null },
        an: Pupo.newAnchors() };
    }
    return R;
  },
  riding(g) { const p = g && g.player; return !!(p && p.pupoRide); },
  // where Pupo may go (§1.7): an area spec's pupoOk wins; otherwise not on rails, rides, scrolls, carry, flip bands,
  // autoscroll, glide levels or boss arenas
  allowed(level, idx) {
    if (!level || !level.areas) return false;
    const A = level.areas[idx]; if (!A) return false;
    const D = level.design && level.design.areas && level.design.areas[idx];
    if (D && D.pupoOk != null) return !!D.pupoOk;
    if (A._pupoOk != null) return A._pupoOk;
    let ok = !(A.gen === 'rail' || A.gen === 'ride' || A.autoscroll || A.autoscrollY || A.carry || A.hasFlip || (A.zones || []).some(z => z.kind === 'flip'));
    if (ok && level.arch && ['scroll', 'glide', 'rail', 'ride', 'carry'].indexOf(level.arch) >= 0) ok = false;
    if (ok && (A.spawns || []).some(s => s.type === 'boss' || /boss/i.test(s.type))) ok = false;
    A._pupoOk = ok;
    return ok;
  },
  sfx(name, fb, o) { if (typeof TourKit !== 'undefined') TourKit.sfx(name, fb, o); else Sound.play(fb, o); },
  say(g, x, y, key) { g.parts.text(x, y, this.says[key] || key, '#fff2c0'); },
  tip(g, key, text) {
    const tips = Save.data.tips || (Save.data.tips = {});
    if (tips[key]) return; tips[key] = true; g.toast(text); Save.save();
  },

  /* ---------- the riding box ---------- */
  // resize Brady's body about its feet and centre; false if that would put him inside a wall
  setBox(p, w, h, force) {
    const A = p.g.area, bottom = p.y + p.h, cx = p.cx;
    if (!force && !regionFree(A, cx - w / 2, bottom - h, w, h)) return false;
    p.w = w; p.h = h; p.x = cx - w / 2; p.y = bottom - h; return true;
  },
  setFlop(p, on) {
    if (on) { p.pupoFlop = true; this.setBox(p, this.K.W, this.K.FLOP_H, true); p.runT = 0; return true; }
    if (!this.setBox(p, this.K.W, this.K.H)) return false;
    p.pupoFlop = false; return true;
  },
  mount(p, quiet, at) {
    const g = p.g, R = this.st(g), K = this.K;
    if (at) { const bottom = at.y; p.x = at.x - p.w / 2; p.y = bottom - p.h; }
    p.crouch = false; p.pupoRide = true; p.pupoFlop = false; p.mounted = false; p.hang = false;
    if (!this.setBox(p, K.W, K.H)) { if (!this.setBox(p, K.W, K.FLOP_H)) this.setBox(p, K.W, K.FLOP_H, true); p.pupoFlop = true; }
    R.where = 'ride'; R.mode = ''; R.free = null; R.freeArea = -1; R.parkArea = -1; R.holdT = 0; R.mountT = quiet ? 0 : K.MOUNT_T;
    if (!R.met) {
      R.met = true; R.meter = Math.max(R.meter, K.METER_START);
      if (!quiet) this.say(g, p.cx, p.y - 16, Save.data.tour && Save.data.tour.pupo ? 'pupo' : 'first');
      const T2 = Save.data.tour || (Save.data.tour = {}); if (!T2.pupo) { T2.pupo = { met: true }; Save.save(); }
    }
    if (!quiet) { this.sfx('pupoMount', 'sloth', { vol: 0.5 }); g.burst(p.cx, p.y + p.h - 6, 6, '#e8d8b8', 'dust'); }
  },
  // Brady off Pupo: how = 'hop' (he hops off, Pupo sits), 'nap' (Pupo falls asleep), 'park' (at a door), 'gone' (no Pupo left here)
  dismount(p, how, spot) {
    const g = p.g, R = this.st(g), K = this.K;
    const fx = p.cx, fy = p.y + p.h, wasMode = R.mode;
    p.pupoRide = false; p.pupoFlop = false; R.mode = ''; R.mountT = 0; R.holdT = 0;
    if (wasMode && this.modes[wasMode] && this.modes[wasMode].exit) this.modes[wasMode].exit(p, g, R);
    // Brady's own box again (he keeps his form, HANDS and FEET items)
    const d = p.power === 0 ? PLAYER_DIM.small : PLAYER_DIM.big;
    p.w = d.w; p.h = d.h; p.x = fx - d.w / 2; p.y = fy - d.h; p.crouch = false;
    if (p.power > 0 && !regionFree(g.area, p.x, p.y, p.w, p.h)) { p.crouch = true; p.h = PLAYER_DIM.crouch.h; p.y = fy - p.h; }
    if (how === 'gone') { R.where = 'box'; return null; }
    const e = new PupoFree(g, { x: spot ? spot.x : fx, y: spot ? spot.y : fy, facing: p.facing, mode: how === 'nap' ? 'sleep' : 'sit', hang: spot && spot.hang ? spot : null });
    g.spawn(e); R.free = e; R.freeArea = g.area.idx; R.where = how === 'park' ? 'parked' : 'free';
    if (how === 'park') R.parkArea = g.area.idx;
    if (how === 'hop') { p.vy = -9 * TS; p.vx = p.facing * 2.2 * TS; p.onGround = false; p.jumping = false; Sound.play('jump', { pitch: 0.9 }); this.tip(g, 'pupoOff', 'WALK INTO PUPO TO HOP BACK ON'); }
    return e;
  },

  /* ---------- hits (§1.4): drowsy, then a nap ---------- */
  hitPupo(p, src) {
    const g = p.g, R = this.st(g), K = this.K;
    if (R.drowsyT > 0) { this.nap(p, src); return; }
    R.drowsyT = K.DROWSY; R.shieldT = K.GRACE; R.powerShield = 0; R.meter = Math.max(0, R.meter - K.METER_HIT);
    this.say(g, p.cx, p.y - 14, 'ow'); this.sfx('pupoOw', 'bump', { pitch: 0.6, vol: 0.7 }); g.shake(3);
    g.burst(p.cx, p.y + p.h * 0.5, 8, '#e8d8b8', 'dust');
    if (src && src.x !== undefined) p.vx = (p.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) * 3 * TS;
    if (!R.mode) p.vy = Math.min(p.vy, -5 * TS);
  },
  nap(p, src) {
    const g = p.g, R = this.st(g), K = this.K, A = g.area;
    // where he sleeps: on the ground where he is; in mid-air on a grab point, bar or ledge (PU-2); else he drops
    let spot = null;
    if (!p.onGround && !p.inWater) for (const f of this.napSpots) { spot = f(g, p); if (spot) break; }
    const fx = p.cx, fy = p.y + p.h;
    const e = this.dismount(p, 'nap', spot);
    p.vy = -K.NAP_POP; p.onGround = false; p.jumping = false; p.invuln = K.NAP_INV;
    R.drowsyT = 0; R.shieldT = 0;
    this.say(g, fx, fy - 70, 'nap'); this.sfx('pupoSnore', 'sloth', { pitch: 0.6, vol: 0.5 }); g.shake(3);
    // over a pit or lava with nothing to land on: he is back asleep in the last Nap Box Brady passed
    if (e && !spot && !e.onGround && !this.floorBelow(A, fx, fy)) this.poofToBox(g, e);
    return e;
  },
  // is there something solid (not lava) to land on under x, below y?
  floorBelow(A, x, y) {
    const tx = Math.floor(x / TS);
    for (let ty = Math.max(0, Math.floor(y / TS)); ty < A.H; ty++) {
      const t = tileAt(A, tx, ty);
      if (t === T.LAVA) return false;
      if (SOLID[t] || t === T.SEMI) return true;
    }
    return false;
  },
  // he vanishes in a puff of z's and is asleep in a Nap Box again (closed), or, if there is none, by the last ground
  poofToBox(g, e) {
    const R = this.st(g), L = R.lastBox;
    if (e) { this.zPuff(g, e.cx, e.y + 10); e.remove = true; }
    R.free = null; R.freeArea = -1;
    if (L.area >= 0 && g.rt[L.area]) {
      const A = g.rt[L.area]; A.tiles[L.ty * A.W + L.tx] = T.QBLOCK;
      for (const n of A.entities) if (n instanceof NapBox && n.tx === L.tx && n.ty === L.ty) n.close();
      R.where = 'box'; return;
    }
    const G = R.lastGround;
    if (G.area >= 0 && g.rt[G.area]) {
      const f = new PupoFree(g, { x: G.x, y: G.y, facing: 1, mode: 'sleep' });
      if (G.area === g.area.idx) g.spawn(f); else g.rt[G.area].entities.push(f);
      R.free = f; R.freeArea = G.area; R.where = 'free';
    } else R.where = 'box';
  },
  zPuff(g, x, y) { g.burst(x, y, 10, '#e8e4ff', 'dust'); for (let k = 0; k < 3; k++) g.parts.text(x + (k - 1) * 10, y - k * 6, 'Z', '#e8e4ff'); },

  /* ---------- the Nap Box ---------- */
  openBox(g, tx, ty, why) {
    const A = g.area, R = this.st(g);
    g.setTile(tx, ty, T.USED); A.bumps.push({ tx, ty, t: 0.18 });
    let nb = null; for (const e of g.entities) if (e instanceof NapBox && e.tx === tx && e.ty === ty) { nb = e; break; }
    if (nb) nb.open();
    R.lastBox.area = A.idx; R.lastBox.tx = tx; R.lastBox.ty = ty;
    this.sfx('pupoBox', 'appear', { pitch: 0.8 });
    this.emerge(g, tx, ty, false);
  },
  // bumping a used box while Pupo is not with Brady: he was in here the whole time
  refill(g, tx, ty) {
    const R = this.st(g), A = g.area;
    A.bumps.push({ tx, ty, t: 0.18, amp: 4 });
    if (R.where === 'ride') { Sound.play('bump', { vol: 0.5 }); return; }
    if (R.free && !R.free.remove) {
      const f = R.free;
      // already sitting or asleep right here: just a rattle
      if (R.freeArea === A.idx && Math.abs(f.cx - (tx * TS + TS / 2)) < 3 * TS && Math.abs(f.y + f.h - (ty + 1) * TS) < 4 * TS) { Sound.play('bump', { vol: 0.5 }); return; }
      if (R.freeArea === A.idx) this.zPuff(g, f.cx, f.y + 8);
      f.remove = true;
    }
    R.free = null; R.freeArea = -1; R.parkArea = -1;
    R.lastBox.area = A.idx; R.lastBox.tx = tx; R.lastBox.ty = ty;
    this.sfx('pupoBox', 'appear', { pitch: 0.7 });
    this.emerge(g, tx, ty, true);
  },
  // Pupo unfolds out of the box at (tx, ty) and sits beside it (on the side Brady is on, if there is room)
  emerge(g, tx, ty, again) {
    const A = g.area, R = this.st(g), p = g.player, side = p && p.cx < tx * TS + TS / 2 ? -1 : 1;
    let x = null, y = null;
    const fits = (cx, by) => regionFree(A, cx - 14, by - 40, 28, 40);
    // a box on the floor or in the air: drop beside it; under a ceiling: the other side; else on top
    for (const s of [side, -side]) { const cx = (tx + s) * TS + TS / 2, by = (ty + 1) * TS; if (fits(cx, by)) { x = cx; y = by; break; } }
    if (x == null && fits(tx * TS + TS / 2, ty * TS)) { x = tx * TS + TS / 2; y = ty * TS; }
    if (x == null) { x = tx * TS + TS / 2; y = (ty + 1) * TS; }
    const e = new PupoFree(g, { x, y, facing: -side, mode: 'unfold', box: { tx, ty } });
    g.spawn(e); R.free = e; R.freeArea = A.idx; R.where = 'free';
    if (again) this.say(g, x, y - 50, 'box');
    this.tip(g, 'pupoHop', 'PUPO! WALK INTO HIM TO HOP ON');
  },

  /* ---------- the step while riding ---------- */
  sin: { left: false, right: false, up: false, down: false, jump: false, action: false, jumpPressed: false, actionPressed: false, upPressed: false, downPressed: false },
  EMPTY: { left: false, right: false, up: false, down: false, jump: false, action: false, jumpPressed: false, actionPressed: false },
  tick(p, R, dt) {
    const K = this.K;
    if (R.mountT > 0) R.mountT = Math.max(0, R.mountT - dt);
    if (R.shieldT > 0) { R.shieldT -= dt; if (R.shieldT <= 0) { R.shieldT = 0; R.powerShield = 0; } }
    if (R.drowsyT > 0) { R.drowsyT -= dt; if (R.drowsyT <= 0) { R.drowsyT = 0; this.say(p.g, p.cx, p.y - 14, 'better'); } }
    if (!(R.showT > 0)) R.meter = Math.min(1, R.meter + dt / K.METER_T * (R.drowsyT > 0 ? 0.5 : 1));
  },
  update(p, dt, inp, up0) {
    const g = p.g, R = this.st(g), K = this.K;
    if (p.state !== 'play' || p.dead) return up0.call(p, dt, inp);
    inp = inp || this.EMPTY;
    this.tick(p, R, dt);
    // a grabber cannot carry Brady off Pupo: the grab counts as one hit on Pupo
    if (p.grabbedBy) {
      const gb = p.grabbedBy; p.grabbedBy = null; p.grabMash = 0; if (gb.release) gb.release(true);
      if (!(R.shieldT > 0) && !(p.invuln > 0) && !(p.star > 0)) this.hitPupo(p, gb);
      if (!p.pupoRide) return up0.call(p, dt, inp);
    }
    // a mode of his own (climbing, hanging, swinging, zipping, pulling, PUPO POWER!): it moves the body itself
    const M = R.mode && this.modes[R.mode];
    if (M) {
      p.inp = inp; p.anim.t += dt; if (p.invuln > 0) p.invuln -= dt; if (p.hurtFlash > 0) p.hurtFlash -= dt;
      if (p.star > 0) { p.star -= dt; if (p.star <= 0) { p.star = 0; g.resumeMusic(); } }
      M.update(p, dt, inp, g, R);
      if (p.pupoRide) this.after(p, dt, inp, g, R, true);
      p.updateAnim(dt, inp); p.updateHair(dt);
      return;
    }
    // what reaches Brady's own step: no action (it belongs to Pupo), no crouch, no dig; down only to swim down and to
    // drop through a one-way floor with jump (both of them)
    const S = this.sin;
    S.left = !!inp.left; S.right = !!inp.right; S.up = !!inp.up; S.jump = !!inp.jump; S.jumpPressed = !!inp.jumpPressed;
    S.upPressed = !!inp.upPressed; S.downPressed = false; S.action = false; S.actionPressed = false; S.down = !!(inp.down && p.inWater);
    const ground = p.onGround && !p.inWater;
    if (inp.down && inp.jumpPressed && ground) {
      if (p.groundTile === T.SEMI) { if (p.pupoFlop) this.setFlop(p, false); S.down = true; }
      else { this.dismount(p, 'hop'); return up0.call(p, dt, this.EMPTY); }
    }
    // flop: hold Down on the ground to crawl (1-tile gaps); standing up again needs the headroom
    const wantFlop = !!inp.down && ground && !S.down;
    if (wantFlop && !p.pupoFlop) this.setFlop(p, true);
    else if (!wantFlop && p.pupoFlop && !this.setFlop(p, false)) S.jumpPressed = false;
    // hold Down for a second, standing still: hop off (anywhere with room to stand)
    if (inp.down && ground && !inp.left && !inp.right && Math.abs(p.vx) < 10) {
      R.holdT += dt;
      if (R.holdT >= K.HOLD_HOP && regionFree(g.area, p.cx - 11, p.y + p.h - PLAYER_DIM.big.h, 22, PLAYER_DIM.big.h)) { this.dismount(p, 'hop'); return up0.call(p, dt, this.EMPTY); }
    } else R.holdT = 0;
    if (R.holdT > 0.35 && R.holdT - dt <= 0.35) this.tip(g, 'pupoOff', 'HOLD ▼ (OR ▼ + JUMP): HOP OFF PUPO');
    const r = up0.call(p, dt, S);
    if (p.pupoRide && p.state === 'play' && !p.dead) this.after(p, dt, inp, g, R, false);
    return r;
  },
  after(p, dt, inp, g, R, inMode) {
    const A = g.area;
    if (!inMode && p.onGround && !p.inWater) { const G = R.lastGround; G.area = A.idx; G.x = p.cx; G.y = p.y + p.h; }
    R.walkPh += dt * (0.4 + Math.abs(p.vx) / TS * 0.16) * (p.inWater ? 1.4 : 1);
    // the last Nap Box Brady passed (4 times a second)
    if ((R.boxScan -= dt) <= 0) {
      R.boxScan = 0.25;
      for (const e of g.entities) if (e instanceof NapBox && Math.abs(e.x + 16 - p.cx) < 2.5 * TS && Math.abs(e.y - p.y) < 5 * TS) { const L = R.lastBox; L.area = A.idx; L.tx = e.tx; L.ty = e.ty; }
    }
    for (let i = 0; i < this.afters.length; i++) this.afters[i](p, dt, inp, g, R, inMode);
  },

  /* ---------- drawing the ride ---------- */
  pose(p, R) {
    if (R.mode && this.modes[R.mode] && this.modes[R.mode].pose) return this.modes[R.mode].pose(p, R, R.draw);
    const o = R.draw;
    o.pose = p.inWater ? 'swim' : p.pupoFlop ? 'flop' : 'ride';
    o.x = p.cx - p.facing * 6; o.y = p.y + p.h; o.phase = R.walkPh; o.still = p.onGround && Math.abs(p.vx) < 8;
    return o;
  },
  drawRide(p, ctx, t) {
    const g = p.g, R = this.st(g), o = this.pose(p, R);
    o.t = t; o.scale = this.ART; o.facing = p.facing; o.mood = R.showT > 0 ? 'spiral' : R.drowsyT > 0 ? 'drowsy' : (o.moodX || 'calm');
    o.rider = this.riderFn; this.cur = p;
    // Brady's flicker when hurt (Pupo's own grace and shield never flicker)
    const flick = p.invuln > 0 && Math.floor(p.invuln * 16) % 2 === 0;
    let a0 = 1;
    if (p.state === 'portal') { a0 = 1 - clamp(p.portalT / 0.4, 0, 1); ctx.save(); ctx.globalAlpha = a0; }
    if (flick) o.rider = null;
    PlayerFx.under(ctx, p, t);
    const bx = o.boxX != null ? o.boxX : o.x - 56, by = o.boxY != null ? o.boxY : o.y - 100, bw = o.boxW || 112, bh = o.boxH || 106;
    Ink.around(ctx, bx, by, bw, bh, this.inkFn, this.INK);
    o.boxX = o.boxY = null; o.boxW = o.boxH = 0; o.moodX = null;
    PlayerFx.over(ctx, p, t);
    for (let i = 0; i < this.overs.length; i++) this.overs[i](ctx, p, g, R, t);
    this.drawStatus(ctx, p, R, t);
    if (p.state === 'portal') ctx.restore();
  },
  INK: { pad: 6, width: 1.0, color: '#120e16', rim: '#e7e3d7', hero: true },   // Brady's own ink look (made once: nothing is allocated per frame)
  paintRide(c) { const p = this.cur, R = p.g.pupo; Pupo.draw(c, R.draw); },
  // Brady on Pupo's back: drawn inside Pupo's art space (scaled by ART, mirrored by facing), his hips on the seat
  paintRider(c, sx, sy) {
    const p = this.cur, R = p.g.pupo, o = R.bo, k = ART_SCALE.brady / this.ART, gs = p.growT > 0 ? p.growScale() : this.GS1;
    o.facing = 1; o.small = p.small; o.power = p.power; o.anim = p.anim; o.look = Save.data.look; o.star = p.star > 0; o.time = R.draw.t;
    o.trip = p.lsdT > 0; o.held = p.g.level && p.g.level.tour ? 'joint' : null; o.floaty = false; o.fly = false;
    const D = p.small ? BRADY_DIM.small : BRADY_DIM.big, hang = p.anim.state === 'hang';
    // the swing up onto his back (0.25 s)
    const up = R.mountT > 0 ? R.mountT / this.K.MOUNT_T : 0;
    c.translate(sx - up * 10, sy + up * 30); c.scale(k * gs.sx, k * gs.sy);
    o.x = 0; o.y = hang ? (D.headY + D.headR + 18) : D.hip - 4;
    drawBrady(c, o);
  },
  // the status over the ride: drowsy z's, the post-power shield stars
  drawStatus(ctx, p, R, t) {
    if (R.drowsyT > 0) {
      const k = (t * 0.6) % 1, x = p.cx + p.facing * 22 + k * 8, y = p.y - 6 - k * 16;
      this.zGlyph(ctx, x, y, 4 + k * 2);
    }
    if (R.powerShield > 0 && R.shieldT > 0) {
      for (let i = 0; i < 3; i++) {
        const a = t * TAU + i * TAU / 3, x = p.cx + Math.cos(a) * 26, y = p.y + p.h * 0.45 + Math.sin(a) * 12;
        ctx.fillStyle = '#1c1426'; ctx.beginPath(); TourKit.star(ctx, x, y, 5.2, 2.4, 5); ctx.fill();
        ctx.fillStyle = '#ffd84a'; ctx.beginPath(); TourKit.star(ctx, x, y, 3.6, 1.5, 5); ctx.fill();
      }
    }
  },
  // a hard-edged "z": an ink stroke under a cream stroke
  zGlyph(ctx, x, y, s) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = k ? '#f4ecdc' : '#1c1426'; ctx.lineWidth = k ? 1.5 : 3.2;
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); ctx.stroke();
    }
  },

  /* ---------- area loads, respawns, doors ---------- */
  areaLoaded(g) {
    const R = this.st(g), p = g.player; if (!p || !g.level || !g.level.tour) return;
    const A = g.area, ok = this.allowed(g.level, A.idx);
    // a respawn: Pupo sits beside Brady at the checkpoint if he was met in this level run
    if (!R.inited) {
      R.inited = true;
      const cp = g.checkpoint;
      if (cp && cp.pupo) {
        R.met = true; R.meter = cp.meter != null ? cp.meter : R.meter;
        if (ok) { const f = new PupoFree(g, { x: p.cx + 34, y: p.y + p.h, facing: -1, mode: 'sit' }); g.spawn(f); R.free = f; R.freeArea = A.idx; R.where = 'free'; }
        else R.where = 'box';
      }
      return;
    }
    if (R.where === 'ride') {
      if (ok) this.mount(p, true);
      else { R.where = 'box'; this.say(g, p.cx, p.y - 30, 'wait'); }
    } else if (R.where === 'parked' && R.parkArea === A.idx && R.free && !R.free.remove) {
      // back through the door he waited at: Brady remounts
      R.free.remove = true; this.mount(p, true);
    }
  },
  enterPortal(g, portal) {
    const p = g.player, R = this.st(g);
    if (!p || !p.pupoRide || g.state !== 'play' || p.state !== 'play') return;
    const tg = portal.target;
    if (!tg || tg.area === g.area.idx || this.allowed(g.level, tg.area)) return;
    // Pupo will not go in: he hops off on the near side and sits by the door
    const side = p.cx < portal.cx ? -1 : 1, x = portal.cx + side * 34;
    const e = this.dismount(p, 'park', { x: regionFree(g.area, x - 14, portal.y + portal.h - 40, 28, 40) ? x : p.cx, y: portal.y + portal.h });
    if (e) e.armed = true;
    this.say(g, p.cx, p.y - 30, 'wait');
  },
  setCheckpoint(g) { const R = g.pupo; if (R && R.met && g.checkpoint) { g.checkpoint.pupo = true; g.checkpoint.meter = R.meter; } },
  levelClear(g) {
    const p = g.player, R = g.pupo; if (!p || !R) return;
    if (p.pupoRide) {
      const fx = p.cx, fy = p.y + p.h;
      this.dismount(p, 'gone');
      const e = new PupoFree(g, { x: fx - p.facing * 30, y: fy, facing: p.facing, mode: 'pack' }); g.spawn(e);
    } else if (R.free && !R.free.remove && R.freeArea === g.area.idx) R.free.setMode('pack');
  },
  died(p) { if (p.pupoRide) { this.zPuff(p.g, p.cx, p.y + p.h - 20); this.dismount(p, 'gone'); } }
};
PupoRide.GS1 = { sx: 1, sy: 1 };
PupoRide.inkFn = c => PupoRide.paintRide(c);
PupoRide.riderFn = (c, sx, sy) => PupoRide.paintRider(c, sx, sy);

/* ---------- the Nap Box: a brown carton drawn over its QBLOCK tile ---------- */
const NAPBOX_TAG = { es: 'FRÁGIL — PEREZOSO DORMIDO', ec: 'FRÁGIL — PEREZOSO DORMIDO', mx: 'FRÁGIL — PEREZOSO DORMIDO', br: 'FRÁGIL — PREGUIÇA A DORMIR', mz: 'FRÁGIL — PREGUIÇA A DORMIR', fr: 'FRAGILE — PARESSEUX ENDORMI', ma: 'FRAGILE — PARESSEUX ENDORMI', nl: 'BREEKBAAR — LUIAARD SLAAPT' };
class NapBox extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS);
    this.tx = Math.floor(s.x / TS); this.ty = Math.floor(s.y / TS) - 1; this.x = this.tx * TS; this.y = this.ty * TS;
    this.back = true; this.isNapBox = true; this.k = 0; this.zT = 1 + (this.tx % 3) * 0.6;
    this.state = tileAt(g.area || { W: 0, H: 0, tiles: [] }, this.tx, this.ty) === T.USED ? 'open' : 'closed';
    this.cc = (g.level && g.level.country) || 'mx';
  }
  open() { this.state = 'open'; this.k = 0; }
  close() { this.state = 'closed'; this.k = 0; }
  update(dt) {
    this.t += dt; if (this.k < 1) this.k = Math.min(1, this.k + dt / 0.3);
    // the tile is the truth (a refill closes it again, a pound or a shot opens it through bumpBlock)
    const A = this.g.area, t = A && A.tiles ? tileAt(A, this.tx, this.ty) : T.USED;
    if (this.state === 'closed' && t === T.USED) this.open();
  }
  bumpY() { const A = this.g.area; if (!A || !A.bumps) return 0; for (let i = 0; i < A.bumps.length; i++) { const b = A.bumps[i]; if (b.tx === this.tx && b.ty === this.ty) return -Math.sin(b.t / 0.18 * Math.PI) * (b.amp || 8); } return 0; }
  draw(ctx) {
    const by = this.bumpY(), closed = this.state === 'closed', breath = closed ? Math.round((Math.sin(this.t * TAU / 2.5) * 0.5 + 0.5) * 4) / 4 : 0;
    this.drawB = by; this.drawBreath = breath;
    Ink.around(ctx, this.x - 6, this.y - 12 + by, TS + 12, TS + 14, NapBox.inkFn(this), { pad: 6, owner: this, key: (closed ? 'c' : 'o' + Math.round(this.k * 4)) + breath + ':' + Math.round(by), rim: Ink.keyline });
    // the snore: a hard-edged z floats out of an air hole every 2 s
    if (closed) {
      const k = ((this.t + this.zT) % 2) / 2;
      if (k < 0.8) PupoRide.zGlyph(ctx, this.x + 22 + k * 10, this.y + 8 + by - k * 26, 2.6 + k * 2.4);
    }
  }
  static inkFn(nb) { NapBox.cur = nb; return NapBox.paintFn; }
  paint(c) {
    const x = this.x + TS / 2, y = this.y + TS + this.drawB, closed = this.state === 'closed';
    const s = 1 + this.drawBreath * 0.04, w = 34, h = 30;
    c.save(); c.translate(x, y); c.scale(s, s);
    // the carton
    c.fillStyle = '#b8864e'; c.fillRect(-w / 2, -h, w, h);
    c.fillStyle = '#a0723e'; c.fillRect(-w / 2, -h, 5, h); c.fillRect(w / 2 - 4, -h, 4, h);
    c.fillStyle = '#c99a62'; c.fillRect(-w / 2 + 5, -h, w - 9, 3);
    // stencilled THIS WAY UP arrows
    c.fillStyle = '#5a3a1c';
    for (let i = -1; i <= 1; i += 2) { const ax = i * 9; c.beginPath(); c.moveTo(ax, -21); c.lineTo(ax + 3, -17); c.lineTo(ax + 1, -17); c.lineTo(ax + 1, -13); c.lineTo(ax - 1, -13); c.lineTo(ax - 1, -17); c.lineTo(ax - 3, -17); c.closePath(); c.fill(); }
    // a row of punched air holes
    c.fillStyle = '#2a1a10'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-9 + i * 6, -8, 1.4, 0, TAU); c.fill(); }
    // a postage stamp sticker with the land's little icon (never a flag)
    c.fillStyle = '#fff4dc'; c.fillRect(4, -16, 9, 9); c.fillStyle = PUPO_STAMP[this.cc] || '#e83a3a'; c.beginPath(); c.arc(8.5, -11.5, 2.6, 0, TAU); c.fill();
    if (closed) {
      // packing tape crossed over the lid, three cream claw tips under the flap
      c.fillStyle = '#e8d49a'; c.fillRect(-2.5, -h - 2, 5, 12); c.fillRect(-w / 2, -h + 1, w, 3.5);
      c.fillStyle = '#9a6a36'; c.fillRect(-w / 2 - 1, -h - 2, w + 2, 3);
      c.fillStyle = '#f4ead8'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-12 + i * 3.2, -h + 1); c.lineTo(-10.6 + i * 3.2, -h + 5); c.lineTo(-9.4 + i * 3.2, -h + 1); c.closePath(); c.fill(); }
    } else {
      // open: the flaps up, the empty dark inside
      const k = easeInOut(this.k);
      c.fillStyle = '#3a2414'; c.fillRect(-w / 2 + 2, -h - 1, w - 4, 4);
      c.fillStyle = '#c99a62';
      c.save(); c.translate(-w / 2, -h); c.rotate(-0.4 - k * 1.6); c.fillRect(0, -2, 14, 4); c.restore();
      c.save(); c.translate(w / 2, -h); c.rotate(0.4 + k * 1.6 + Math.PI); c.fillRect(0, -2, 14, 4); c.restore();
    }
    // the hand-lettered tag
    c.fillStyle = '#f2e6c8'; c.save(); c.translate(-w / 2 + 2, -6); c.rotate(-0.2); c.fillRect(-6, -4, 11, 8); c.fillStyle = '#6a4a2a'; c.fillRect(-4.5, -2, 8, 1); c.fillRect(-4.5, 0.5, 6, 1); c.restore();
    c.restore();
  }
  get light() { return { r: 40, c: 'rgba(255,230,180,' }; }
}
NapBox.paintFn = c => NapBox.cur.paint(c);
const PUPO_STAMP = { mx: '#e83a3a', ec: '#8a4a2a', br: '#3ab84a', mz: '#c8a03a', ma: '#3a6ae8', es: '#e8a83a', fr: '#9a6ae8', nl: '#ff8a2a', id: '#3ac8a8', vn: '#e8d83a', jp: '#ff7ab8', np: '#e8e8f0', aq: '#7ad0ff', w22: '#ffd84a' };

/* ---------- Pupo off the ride: sitting, asleep (on the ground or dangling), waking, waiting, packing up ---------- */
class PupoFree extends Ent {
  constructor(g, s) {
    super(g, s, 28, 40);
    this.x = s.x - 14; this.y = s.y - 40; this.facing = s.facing || 1; this.friendly = true; this.pupoFree = true;
    this.hangAt = s.hang || null; this.box = s.box || null; this.mt = 0; this.mode = 'sit';
    // Brady standing in him when he appears (a hop off, a nap) must walk off before he can get back on
    const p = g.player; this.armed = !(p && overlap(p, this));
    this.setMode(s.mode || 'sit');
  }
  setMode(m) { this.mode = m; this.mt = 0; if (m === 'pack') this.armed = false; }
  update(dt) {
    this.t += dt; this.mt += dt;
    const g = this.g, A = g.area, p = g.player, R = PupoRide.st(g);
    if (this.hangAt) { this.vy = 0; this.x = this.hangAt.x - 14; this.y = this.hangAt.y + 2; }
    else {
      this.vy = Math.min(this.vy + PHYS.gDown * dt, PHYS.maxFall); this.vx = 0;
      moveBody(this, A, dt, { semis: true, platforms: g.platforms });
      if (this.ride) { this.x += this.ride.dx || 0; this.y += this.ride.dy || 0; }
      // fell into lava or out of the area: asleep in the last Nap Box again
      if (this.y > A.H * TS + 20 || lavaContact(this, A)) { PupoRide.poofToBox(g, this); return; }
    }
    if (this.mode === 'unfold' && this.mt >= 1.2) { this.setMode('sit'); PupoRide.say(g, this.cx, this.y - 6, 'pupo'); }
    if (this.mode === 'unfold' && this.mt > 0.35 && this.mt < 0.95) this.yawnPoke();
    if (this.mode === 'pack' && this.mt > 1.6) { this.remove = true; PupoRide.zPuff(g, this.cx, this.y + 20); return; }
    if (this.mode === 'wake' && this.mt >= PupoRide.K.WAKE) {
      // awake: Brady (still beside him) is back on, and Pupo is no longer drowsy
      if (p && !p.dead && p.state === 'play' && !p.pupoRide && Math.abs(p.cx - this.cx) < 2.5 * TS && Math.abs(p.y + p.h - (this.y + this.h)) < 3 * TS) { this.remove = true; R.drowsyT = 0; PupoRide.mount(p, false, { x: this.cx, y: this.y + this.h }); return; }
      this.setMode('sit');
    }
    if (!p || p.dead || p.state !== 'play' || p.pupoRide) return;
    const touch = overlap(p, this);
    if (!touch && this.mode !== 'pack') this.armed = true;
    if (!touch || !this.armed) return;
    if (this.mode === 'sit') { this.remove = true; PupoRide.mount(p, false, { x: this.cx, y: this.y + this.h }); }
    else if (this.mode === 'sleep') {
      // Brady pokes Pupo's pupo; he wakes in 0.6 s and Brady is back on, no longer drowsy
      this.setMode('wake'); this.armed = false; p.throwT = 0.25;
      PupoRide.say(g, this.cx, this.y - 6, 'wake'); PupoRide.sfx('pupoBoop', 'pick', { pitch: 0.5, vol: 0.6 });
      g.burst(this.cx + this.facing * 4, this.y + 26, 6, '#ffffff', 'spark');
    }
  }
  // the yawn: both arms stretch 4 tiles out to the sides; an enemy in the way is poked (the first lesson)
  yawnPoke() {
    const g = this.g, y = this.y + 6, L = 4 * TS;
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss || e.friendly) continue;
      if (e.y > y + 4 || e.y + e.h < y - 4 || Math.abs(e.cx - this.cx) > L + e.w / 2) continue;
      if (e.hit('poke', { x: this.cx, vx: sign(e.cx - this.cx) })) { g.addScore(200, e.cx, e.y); g.parts.text(e.cx, e.y - 8, 'BOOP!', '#ffffff'); }
    }
  }
  pose(o) {
    const m = this.mode, mt = this.mt;
    o.armsOff = false; o.still = false; o.reach = 0; o.mood = 'calm'; o.phase = null;
    if (this.hangAt) { o.pose = 'hang'; o.mood = this.mode === 'wake' ? 'blink' : 'sleep'; o.y = this.hangAt.y; return; }
    if (m === 'sleep') { o.pose = 'sleep'; o.mood = 'sleep'; return; }
    if (m === 'wake') { o.pose = 'idle'; o.mood = mt < 0.3 ? 'blink' : 'happy'; return; }
    if (m === 'unfold') {
      if (mt < 0.35) { o.pose = 'sleep'; o.mood = 'sleep'; return; }
      if (mt < 0.95) { o.pose = 'yawn'; o.mood = 'yawn'; o.armsOff = true; return; }
      o.pose = 'idle'; o.mood = 'drowsy'; return;
    }
    if (m === 'pack') { o.pose = mt < 1.1 ? 'happy' : 'idle'; o.mood = 'happy'; return; }
    o.pose = 'idle'; o.mood = (this.t % 7) < 2.5 ? 'drowsy' : 'calm';
  }
  draw(ctx) {
    const g = this.g, R = PupoRide.st(g), o = PupoFree.o;
    o.x = this.cx; o.y = this.y + this.h; o.t = this.t; o.scale = PupoRide.ART; o.facing = this.facing; o.rider = null; o.spiral = 0;
    this.pose(o);
    // a sleeping or sitting Pupo is a held picture (re-inked only on the slow breathing frames)
    const anim = o.pose === 'yawn' || this.mode === 'wake' || this.mode === 'pack' || this.mode === 'unfold';
    if (!anim) { o.t = o.pose === 'sleep' || o.pose === 'hang' ? Math.round((this.t % 2.4) / 0.6) * 0.6 : o.t; }
    PupoFree.cur = o;
    const key = anim ? null : o.pose + ':' + o.mood + ':' + Math.round(o.t * 10) + ':' + this.facing;
    if (key) Ink.around(ctx, this.cx - 44, o.y - 62, 88, 66, PupoFree.inkFn, { pad: 6, owner: this, key, rim: Ink.keyline });
    else Ink.around(ctx, this.cx - 44, o.y - 62, 88, 66, PupoFree.inkFn, { pad: 6, rim: Ink.keyline });
    if (o.pose === 'yawn') {
      // the yawn's long arms: outside the ink pass, with their own outline
      const k = clamp((this.mt - 0.35) / 0.25, 0, 1) * clamp((0.95 - this.mt) / 0.15, 0, 1), L = 4 * TS * k, S = PupoRide.ART, f = this.facing;
      const an = Pupo.anchors('idle', this.t, PupoFree.an);
      const sy = o.y + an.shoulderF.y * S;
      Pupo.arm(ctx, this.cx + f * an.shoulderF.x * S, sy, this.cx + f * (an.shoulderF.x * S + L), sy - 6, { w: 6, t: this.t, point: false, sag: -3 });
      Pupo.arm(ctx, this.cx + f * an.shoulderB.x * S, sy, this.cx + f * (an.shoulderB.x * S - L), sy - 6, { w: 5.5, col: PUPO.furSh, t: this.t, point: false, sag: 3 });
    }
    if (this.mode === 'sleep' || (this.mode === 'unfold' && this.mt < 0.35)) { const k = (this.t * 0.5) % 1; PupoRide.zGlyph(ctx, this.cx + this.facing * 16 + k * 8, (this.hangAt ? this.hangAt.y + 30 : this.y + 6) - k * 18, 3 + k * 2.5); }
    if (this.mode === 'pack' && this.mt > 1.1) {
      // his own travel carton rises around him and shuts
      const k = clamp((this.mt - 1.1) / 0.4, 0, 1), h = 34 * k;
      ctx.fillStyle = '#1c1426'; ctx.fillRect(this.cx - 19, o.y - h - 1, 38, h + 1);
      ctx.fillStyle = '#b8864e'; ctx.fillRect(this.cx - 17, o.y - h + 1, 34, h - 1);
      if (k >= 1) { ctx.fillStyle = '#e8d49a'; ctx.fillRect(this.cx - 2.5, o.y - 35, 5, 34); }
    }
  }
}
PupoFree.o = { x: 0, y: 0, scale: 1, facing: 1, t: 0, pose: 'idle', mood: 'calm', rider: null, armsOff: false, phase: null, spiral: 0, still: false, reach: 0 };
PupoFree.an = Pupo.newAnchors();
PupoFree.inkFn = c => Pupo.draw(c, PupoFree.cur);
Object.assign(ENTITY_TYPES, { napBox: NapBox, pupoFree: PupoFree });

/* ---------- the builder piece: a Nap Box y rows above the floor (a QBLOCK holding 'pupo', plus its carton) ---------- */
Tour.pieces.napBox = function (st, o) {
  const tx = st.x, ty = st.gy - 1 - (o.y || 0);
  st.B.set(tx, ty, T.QBLOCK); st.B.item(tx, ty, 'pupo'); st.B.spawn('napBox', tx, ty, {});
  return st.x + 1;
};

/* ---------- the wrappers (outermost: this file loads after every other Player / Play wrapper) ---------- */
{
  const P = Player.prototype, G = Play.prototype;
  const up0 = P.update;
  P.update = function (dt, inp) { if (!this.pupoRide) return up0.call(this, dt, inp); return PupoRide.update(this, dt, inp, up0); };
  // the hit order while riding (§1.4): star, the Pupo shield, then Pupo; Hard Hat, HANDS, FEET and FORM only without him
  const hurt0 = P.hurt;
  P.hurt = function (src) {
    if (!this.pupoRide || this.dead || this.state !== 'play') return hurt0.call(this, src);
    if (this.star > 0 || (this.fx && this.fx.molly > 0)) return hurt0.call(this, src);
    const R = PupoRide.st(this.g);
    if (this.invuln > 0 || R.shieldT > 0 || R.showT > 0) return;
    if (this.grabbedBy) { const gb = this.grabbedBy; this.grabbedBy = null; if (gb.release) gb.release(true); }
    PupoRide.hitPupo(this, src);
  };
  // the mushroom still grows Brady on Pupo's back; the box stays the riding box
  const sp0 = P.setPower;
  P.setPower = function (n, quiet) {
    const r = sp0.call(this, n, quiet);
    if (this.pupoRide) { this.crouch = false; PupoRide.setBox(this, PupoRide.K.W, this.pupoFlop ? PupoRide.K.FLOP_H : PupoRide.K.H, true); }
    return r;
  };
  // no jump powers on Pupo (no hover, double jump or pound)
  const aj0 = P.airJump;
  if (aj0) P.airJump = function (inp) { if (this.pupoRide) return false; return aj0.call(this, inp); };
  // Brady sits (or hangs on) while riding; no idle air guitar on Pupo's back
  const ua0 = P.updateAnim;
  P.updateAnim = function (dt, inp) {
    if (this.pupoRide) this.idleT = 0;
    ua0.call(this, dt, inp);
    if (this.pupoRide && this.state === 'play') { const R = this.g.pupo; this.anim.state = R && R.mode === 'hang' ? 'hang' : this.throwT > 0 ? 'throw' : 'ride'; if (this.anim.state === 'throw') this.anim.base = 'ride'; }
  };
  const dr0 = P.draw;
  P.draw = function (ctx, t) { if (!this.pupoRide) return dr0.call(this, ctx, t); PupoRide.drawRide(this, ctx, t); };
  const die0 = P.die;
  P.die = function (reason) { if (!this.dead) PupoRide.died(this); return die0.call(this, reason); };
  // the run state rides on the checkpoint (Play is rebuilt on a respawn)
  const sc0 = G.setCheckpoint;
  G.setCheckpoint = function (x, y) { const r = sc0.call(this, x, y); PupoRide.setCheckpoint(this); return r; };
  // contents 'pupo': open the Nap Box (or refill a used one) instead of spawning an item
  const bb0 = G.bumpBlock;
  G.bumpBlock = function (tx, ty, big, src) {
    const A = this.area;
    if (A && A.contents && A.contents[tx + ',' + ty] === 'pupo' && this.level && this.level.tour) {
      const t = tileAt(A, tx, ty);
      if (t === T.QBLOCK || t === T.HIDDEN || t === T.QBRICK) { PupoRide.openBox(this, tx, ty); return; }
      if (t === T.USED) { PupoRide.refill(this, tx, ty); return; }
    }
    return bb0.call(this, tx, ty, big, src);
  };
  const ep0 = G.enterPortal;
  G.enterPortal = function (portal) { if (this.level && this.level.tour) PupoRide.enterPortal(this, portal); return ep0.call(this, portal); };
  // TourHooks (secrets WP-1) where it exists; otherwise wrap loadArea and levelClear
  const hooks = typeof TourHooks !== 'undefined' && TourHooks && typeof TourHooks.on === 'function';
  if (hooks) TourHooks.on('areaLoaded', play => { if (play.level && play.level.tour) PupoRide.areaLoaded(play); });
  else { const la0 = G.loadArea; G.loadArea = function (idx, x, y, power) { const r = la0.call(this, idx, x, y, power); if (this.level && this.level.tour) PupoRide.areaLoaded(this); return r; }; }
  if (hooks) TourHooks.on('levelClear', play => { PupoRide.levelClear(play); });
  else { const lc0 = G.levelClear; G.levelClear = function (gate) { const ok = this.state === 'play'; const r = lc0.call(this, gate); if (ok && this.state === 'clear') PupoRide.levelClear(this); return r; }; }
  // the speeds on Pupo (§1.3): the game and the validator's simulated bodies share this one rule (body.pupoRide)
  const ppf0 = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (!p.pupoRide || !opts) return ppf0(p, inp, area, dt, platforms, opts);
    const s0 = opts.speedMul, w0 = opts.swimMul, K = PupoRide.K;
    opts.speedMul = (s0 == null ? 1 : s0) * (p.pupoFlop ? K.FLOP_SPEED / PHYS.walk : K.SPEED_MUL);
    opts.swimMul = (w0 == null ? 1 : w0) * K.SWIM_MUL;
    if (p.pupoFlop) p.runT = 0;
    try { return ppf0(p, inp, area, dt, platforms, opts); } finally { opts.speedMul = s0; opts.swimMul = w0; }
  };
  // the power picker's chip hides while riding: the action button belongs to Pupo
  if (typeof TourPicker !== 'undefined') {
    const vis0 = TourPicker.visible;
    TourPicker.visible = function (play) { if (play && play.player && play.player.pupoRide) return false; return vis0.call(this, play); };
  }
  // the map: once met, Pupo rides piggyback on Brady (cosmetic; drawn behind him)
  if (typeof TourOverworld !== 'undefined' && TourOverworld.prototype.drawWalker) {
    const dw0 = TourOverworld.prototype.drawWalker;
    TourOverworld.prototype.drawWalker = function (ctx) {
      const T2 = Save.data.tour, w = this.walker;
      if (T2 && T2.pupo && T2.pupo.met && w) {
        const o = PupoFree.o, walking = !!w.seg, hop = w.hop > 0 ? Math.sin((1 - w.hop / 0.3) * Math.PI) * 9 : 0;
        const node = !walking && this.by && this.by[w.at], lift = node ? (node.boss ? 2 : node.kind === 'level' ? 7 : 4) : 0;
        o.x = w.x - (w.facing || 1) * 7; o.y = w.y - lift - hop - 9 + (walking ? Math.abs(Math.sin(this.t * 13)) * -1.5 : 0); o.t = this.t; o.scale = 0.36; o.facing = w.facing || 1;
        o.pose = 'idle'; o.mood = 'happy'; o.rider = null; o.armsOff = false; o.spiral = 0; o.reach = 0;
        PupoFree.cur = o; Ink.around(ctx, o.x - 18, o.y - 26, 36, 28, PupoFree.inkFn, { pad: 8, width: 0.95, color: '#120e16', hero: true });
      }
      return dw0.call(this, ctx);
    };
  }
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoRide, PupoFree, NapBox, Pupo }); } catch (e) { /* not in a browser */ }
