/* ============================================================
   World tour: Pupo's tutorial labels (docs/design/PUPO.md §6).
   No text walls: at most six one-line labels, each shown once ever
   (Save.data.tips.pupo*), next to what they are about, through the
   power picker's label (it keeps to the screen, landscape or
   portrait). Everything else is taught by the level and the paw
   marker.
     HOP ON ▼          over a sitting Pupo, until Brady first gets on
     ◉ POKE            over the first enemy the marker sits on, until a poke
     ▲ STICK + ◉       when something is in reach only with the stick up
     JUMP TO LET GO    the first swing
     ◉ GRAB            a ledge, climb strip or bar in reach (nothing grabs on its own)
     HOLD ▲            the first climb
     ▼ + JUMP: HOP OFF holding Down on Pupo for a moment
   (TAP PUPO! over the Pupo Power button is drawn with the button.)
   ============================================================ */
const PupoTutor = {
  // key -> text; a label shows while its condition holds, at most 6 s, and once ever
  TEXT: { pupoHop: 'HOP ON ▼', pupoPoke: '◉ POKE', pupoReach: '▲ STICK + ◉', pupoGrab: 'JUMP TO LET GO', pupoGrip: '◉ GRAB', pupoClimb: 'HOLD ▲', pupoOff: '▼ + JUMP: HOP OFF' },
  MAX: 6,
  tips() { return Save.data.tips || (Save.data.tips = {}); },
  done(key) { const T = this.tips(); if (!T[key]) { T[key] = true; Save.save(); } },
  // what to show this frame (one label at a time): sets play.pupoLabel = { key, x, y } in world px, or null
  pick(g) {
    const p = g.player, R = g.pupo, T = this.tips(); if (!p || !R || g.state !== 'play') return null;
    const L = g.pupoLabel || (g.pupoLabel = { key: null, x: 0, y: 0, t: 0 });
    L.key = null;
    if (!p.pupoRide) {
      const f = R.free;
      if (!T.pupoHop && f && !f.remove && f.mode === 'sit' && R.freeArea === g.area.idx && g.onScreen(f, 0)) { L.key = 'pupoHop'; L.x = f.cx; L.y = f.y - 22; }
      return L.key ? L : null;
    }
    T.pupoHop || this.done('pupoHop');
    if (!T.pupoGrab && R.mode === 'swing') { L.key = 'pupoGrab'; L.x = p.cx; L.y = p.y - 26; return L; }
    if (!T.pupoClimb && R.mode === 'climb') { L.key = 'pupoClimb'; L.x = p.cx; L.y = p.y - 26; return L; }
    if (!T.pupoOff && R.holdT > 0.35) { L.key = 'pupoOff'; L.x = p.cx; L.y = p.y - 26; return L; }
    const tg = R.tg;
    if (!T.pupoGrip && tg && (tg.kind === 'strip' || tg.kind === 'bar' || tg.kind === 'ledge') && !R.mode) { L.key = 'pupoGrip'; L.x = tg.x; L.y = tg.y - 30; return L; }
    if (!T.pupoPoke && tg && tg.kind === 'enemy') { L.key = 'pupoPoke'; L.x = tg.x; L.y = tg.y - 34; return L; }
    if (!T.pupoReach && (!tg || !tg.kind) && !R.mode && this.upOnly(g, p, R)) { L.key = 'pupoReach'; L.x = this.ux; L.y = this.uy - 34; return L; }
    return null;
  },
  // something in reach with the stick up that the neutral aim does not find (checked 4 times a second)
  utg: { kind: null, e: null, x: 0, y: 0, tx: -1, ty: -1 }, ux: 0, uy: 0, uT: 0, uHit: false,
  UP: { up: true },
  upOnly(g, p, R) {
    if ((this.uT -= 1 / 60) > 0) return this.uHit;
    this.uT = 0.25;
    const keep = R.tg; R.tg = this.utg;
    try { const t = PupoReach.scan(p, g, R, this.UP); this.uHit = !!t.kind && (PupoReach.verbOf(t.kind) === 'fetch' || t.kind === 'box') && t.y < p.y; this.ux = t.x; this.uy = t.y; }
    finally { R.tg = keep; }
    return this.uHit;
  },
  step(g, dt) {
    const L = this.pick(g);
    if (!L) { if (g.pupoLabel) g.pupoLabel.t = 0; return; }
    if (g.pupoLabelKey !== L.key) { g.pupoLabelKey = L.key; L.t = 0; }
    L.t += dt;
    if (L.t > this.MAX) this.done(L.key);
  },
  // drawn with the HUD, in CSS px
  draw(ctx, g) {
    const L = g.pupoLabel; if (!L || !L.key || typeof TourPicker === 'undefined' || this.tips()[L.key]) return;
    const gr = Game.gameRect, k = Game.S / Game.dpr, x = gr.x + (L.x - g.camX) * k, y = gr.y + (L.y - g.camY) * k;
    if (x < gr.x - 40 || x > gr.x + gr.w + 40 || y < gr.y || y > gr.y + gr.h) return;
    const a = clamp(Math.min(L.t * 4, (this.MAX - L.t) * 2), 0, 1);
    TourPicker.label(ctx, this.TEXT[L.key], x, clamp(y + Math.sin(g.t * 4) * 2, gr.y + 14, gr.y + gr.h - 14), a, true);
  }
};
{
  // the lessons are done when the move is made
  PupoRide.tip = function (g, key) { if (key === 'pupoGrab' || key === 'pupoClimb') { /* shown while swinging / climbing, done after */ } };
  const m0 = PupoRide.mount;
  PupoRide.mount = function (p, quiet, at) { const r = m0.call(this, p, quiet, at); if (!quiet) PupoTutor.done('pupoHop'); return r; };
  const f0 = PupoReach.fire;
  PupoReach.fire = function (p, g, R, inp) { const ok = f0.call(this, p, g, R, inp); if (ok && R.arm) { if (R.arm.kind === 'strip' || R.arm.kind === 'bar' || R.arm.kind === 'ledge') PupoTutor.done('pupoGrip'); if (R.arm.kind === 'enemy') PupoTutor.done('pupoPoke'); else if (R.arm.kind !== 'air' && PupoReach.ay < -0.5) PupoTutor.done('pupoReach'); } return ok; };
  const l0 = PupoRide.leave;
  PupoRide.leave = function (g, p) { const m = this.st(g).mode; const r = l0.call(this, g, p); if (m === 'swing') PupoTutor.done('pupoGrab'); if (m === 'climb') PupoTutor.done('pupoClimb'); return r; };
  const d0 = PupoRide.dismount;
  PupoRide.dismount = function (p, how, spot) { if (how === 'hop') PupoTutor.done('pupoOff'); return d0.call(this, p, how, spot); };
  // the labels run with the tour's Play (not during PUPO POWER!, which freezes the world)
  TourHooks.on('playUpdate', (play, dt) => { if (play.level && play.level.tour && play.pupo && !(play.pupo.showT > 0)) PupoTutor.step(play, dt); });
  const dh0 = Play.prototype.drawHUD;
  Play.prototype.drawHUD = function (ctx) { const r = dh0.call(this, ctx); if (this.level && this.level.tour && this.pupo && !this.paused && !(this.pupo.showT > 0)) PupoTutor.draw(ctx, this); return r; };
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoTutor }); } catch (e) { /* not in a browser */ }
