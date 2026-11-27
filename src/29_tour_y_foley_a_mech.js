/* ============================================================
   FOLEY BEACH: the land's mechanics (world 29). Every one is worked with the stick, JUMP and RUN/THROW only, every
   noise has a visible source and a visible cue (the game is often played muted), and every one tells the level
   checker only what the player can really do:
   29-1 LOOK     a hollow prop on a post (a wood block's high CLACK: small quick ivory rings; a tom's low THUMP: wide
                 slow burgundy rings). Stand at it and tap THROW: the nosy shell flock heaped on the beach rushes over
                 to sit on it, clearing the patch. The last flock is mixed: the little shells come only to the clack,
                 the big ones only to the thump. (checker: a heap is a lock; standing at its prop is the key)
   29-2 DAMPER   a tin panel over a gap rattles (a jagged ripple: you can't stand on it). Hold THROW at its near end
                 and the felt damper presses it flat; keep holding and the felt slides along under Brady, so walk it
                 across. Let go and it starts to rattle again (its ripples come back first: the tell). The last panel
                 throws two humps that run toward each other: tap THROW when they meet under the hanging damper and
                 it catches both: the panel lies flat. (checker: the panels are an auto toggle: always flattenable)
   29-3 BANK     a bank of fixed props under a silent flipbook. THROW at the bank's mark takes it: the stick picks a
                 prop, THROW plays it, JUMP lets go. Play the prop that fits the picture when its foot lands (the
                 picture flashes and a dust puff rises), twice, and the flipbook screen rolls up out of the way. The
                 last flipbook shows the horse, then a wooden hobbyhorse: the coconuts, then the single wood block.
                 (checker: the screen is a lock; the bank's mark is its key)
                 Also in 29-3: the prop-lifting cargo net, a real climbing surface: push into it to grip, steer four
                 ways, JUMP at a brass collar crosses to the far side of the ropes; crabs crawl on one side each.
   29-4 TRUMPET  a speaking trumpet on a stand: THROW at its mark takes it, the stick aims (a dotted line shows the
                 puff's path, bounces included), THROW sends a puff ring. A puff into the FRONT of a distant hinged
                 ear opens it down into a landing. The last ear faces away: bounce the puff off a tin platter.
                 (checker: the landings are a toggle switched at the trumpet marks)
   29-5 TAKE     a recording desk with a picture strip: a marker sweeps along it. Hold THROW while the marker is in
                 the marked length (start inside the band's start) and let go at its end (generous windows): the cut
                 take plays back out of the speaker and the clapper gate lifts. The last take is a thunderclap with a
                 long rattle: the band is only the short crack. (checker: the gate is a lock; the desk is its key)
   29-6 MIC      a microphone on a stand among three noisy machines (the tin sheet: jagged ripples; the rice tray:
                 dots; the windcloth: long loops). THROW takes the mic, the stick steers it, THROW captures the noise
                 it points at while that machine sounds, THROW again plays it back: the one that matches the card
                 lifts the gate. The last card wants the pea's tiny voice: wait for the machines to go quiet.
   Shared: the THROW-on-a-prop hook (a prop takes the button only while Brady is on its mark or holding it; a
   mounted prop takes the stick too, JUMP lets go), the marks and cues, window.BRADY_FOLEY for the shots tool.
   ============================================================ */
(function () {
const K = Tour.foleyKit, INK = K.INK, FA = K.FArt, FX = K.FX;
const { APRI, APRI2, APRI3, TIN, TIN2, TIN3, IVORY, IVORY2, FELT, FELT2, FELT3, SAND, BRASS, WOOD, WOOD2 } = K;
const isFoley = g => !!(g && g.level && g.level.country === 'foley');
const mod = (a, n) => ((a % n) + n) % n;
const onMark = (p, tx, ty, wide) => p && !p.dead && p.onGround && p.groundTy === ty && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.75);
const overlapsTile = (b, x, y) => b.x < (x + 1) * TS && b.x + b.w > x * TS && b.y < (y + 1) * TS && b.y + b.h > y * TS;
const sfx = (name, fb, o) => TourKit.sfx(name, fb, o);
// what the land's mechanics have opened (not keys: the HUD would show them as keys)
const openId = (g, id) => (g.foleyOpen || (g.foleyOpen = new Set())).add(id);
const isOpen = (g, id) => !!(g.foleyOpen && g.foleyOpen.has(id));

/* ---------------- THROW on a prop (and a mounted prop's stick) ---------------- */
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (isFoley(g) && inp && this.state === 'play' && !this.dead) {
      let prop = null;
      for (const e of g.entities) if (e.fProp && !e.remove && e.fTouch(this)) { prop = e; break; }
      this.fProp = prop;
      if (prop) {
        prop.fInput(this, inp, dt);
        const o = Object.assign({}, inp, { actionPressed: false });
        if (prop.mounted) { o.left = o.right = o.up = o.down = false; o.action = false; if (inp.jumpPressed) { prop.mounted = false; prop.onDismount && prop.onDismount(this); } }
        inp = o;
      }
    } else this.fProp = null;
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined' && TourPicker.visible) { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.fProp) return false; return vis0.call(this, play); }; }
}
// the little sign that a prop is listening: a word over a white arrow, pulsing, on a dark pill
const handCue = (ctx, x, y, t, txt) => {
  const k = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save(); ctx.font = '9px ' + FONT_DISPLAY; const w = Math.max(52, ctx.measureText(txt || 'THROW').width + 14);
  ctx.globalAlpha = 0.8 + 0.2 * k; ctx.fillStyle = 'rgba(20,10,20,0.78)'; rr(ctx, x - w / 2, y - 24, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffd84a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt || 'THROW', x, y - 14.5);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x + 4, y - 6); ctx.lineTo(x, y - 1 + k * 2); ctx.closePath(); ctx.fill(); ctx.restore();
};
// a mark Brady must stand on: a pulsing ivory scalloped ring on the floor (gold when `hot`)
const markRing = (ctx, x, y, t, hot, r) => {
  const k = 0.5 + 0.5 * Math.sin(t * 5), R = (r || 18) * (hot ? 1.15 : 1) + k * 3;
  ctx.save(); ctx.strokeStyle = hot ? `rgba(255,220,90,${0.7 + 0.3 * k})` : `rgba(246,236,214,${0.45 + 0.3 * k})`; ctx.lineWidth = hot ? 3.5 : 2.5;
  ctx.beginPath(); for (let s = 0; s <= 48; s++) { const a = s / 48 * TAU, rr2 = R + Math.sin(a * 10) * 1.6; ctx.lineTo(x + Math.cos(a) * rr2, y - 2 + Math.sin(a) * rr2 * 0.3); } ctx.stroke(); ctx.restore();
};
// a big NOW! cue on a pill (timing moments)
const nowCue = (ctx, x, y, t, txt, col) => {
  ctx.save(); ctx.font = '14px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(txt).width + 22, s = 1 + 0.08 * Math.sin(t * 16);
  ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = 'rgba(14,8,26,0.88)'; rr(ctx, -w / 2, -13, w, 26, 13); ctx.fill(); ctx.strokeStyle = col || '#ffd84a'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = col || '#ffd84a'; ctx.fillText(txt, 0, 1); ctx.restore();
};
const sayP = (g, txt, col) => { const p = g.player; if (p) K.say(g, p.cx, p.y - 16, txt, col || '#ffd8a0', 'brady'); };

/* ======================= 29-1 LOOK: hollow props and the nosy shell flock ======================= */
// the props: 'block' (a wood block: CLACK), 'drum' (a tom: THUMP), 'log' (a hollow log: a plain knock, any shell comes)
const PROP_NOISE = { block: 'clack', drum: 'thump', log: 'clack' };
class FoleyProp extends Ent {
  constructor(g, s) { super(g, s, TS, 2 * TS); this.x = s.x - TS / 2; this.y = s.y - 2 * TS; this.friendly = true; this.back = true; this.fProp = true; this.kind = s.kind || 'log'; this.pid = s.pid; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.hitT = 0; this.perched = []; }
  fTouch(p) { return onMark(p, this.tx, this.fy, 0.9); }
  fInput(p, inp) { if (inp.actionPressed) this.strike(); }
  strike() {
    const g = this.g; this.hitT = 0.35;
    const kind = PROP_NOISE[this.kind] || 'clack';
    FX.noise(g, this.cx, this.y + 14, kind);
    if (kind === 'thump') { sfx('thump', 'stomp', { vol: 0.7, pitch: 0.55 }); K.say(g, this.cx, this.y - 6, 'THUMP!', '#ff9ab0', 'prop' + this.pid); }
    else { sfx('clack', 'kick', { vol: 0.6, pitch: 2.0 }); K.say(g, this.cx, this.y - 6, this.kind === 'log' ? 'TOK!' : 'CLACK!', IVORY, 'prop' + this.pid); }
    for (const e of g.entities) if (e.hear && !e.remove) e.hear(kind, this);
  }
  update(dt) { this.t += dt; if (this.hitT > 0) this.hitT -= dt; }
  touchPlayer() {}
  draw(ctx) {
    // (the prop stands just past its mark, so Brady beside it never hides it)
    const x = this.cx + 24, y = this.fy * TS, t = this.t, sw = this.hitT > 0 ? Math.sin(this.hitT * 30) * 2 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the post
    ctx.fillStyle = WOOD; rr(ctx, x - 4, y - 36, 8, 36, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = WOOD2; ctx.fillRect(x - 10, y - 4, 20, 4); ctx.strokeRect(x - 10, y - 4, 20, 4);
    const py = y - 40 + sw;
    if (this.kind === 'block') {
      // a pale wood block with a slot: small and bright (a HIGH noise)
      ctx.fillStyle = '#f0c880'; rr(ctx, x - 13, py - 12, 26, 14, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 9, py - 6, 18, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 11, py - 10, 8, 2);
      // its little sign: three tiny rings (high)
      for (let k = 0; k < 3; k++) FA.ring(ctx, x + 18 + k * 7, py - 16 - k * 4, 3, 0.8, IVORY, 1.4);
    } else if (this.kind === 'drum') {
      // a deep burgundy tom: big and low
      ctx.fillStyle = FELT; ctx.fillRect(x - 17, py - 22, 34, 24); ctx.strokeRect(x - 17, py - 22, 34, 24);
      ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(x, py - 22, 17, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 7, py - 20); ctx.lineTo(x + k * 7 + 3, py); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2; FA.ring(ctx, x + 26, py - 16, 9, 0.7, '#ff9ab0', 2.4);
    } else {
      // a hollow log on its side
      ctx.fillStyle = '#9a6a3a'; rr(ctx, x - 16, py - 14, 32, 16, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.ellipse(x + 12, py - 6, 5, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 12, py - 9); ctx.lineTo(x + 4, py - 9); ctx.stroke();
    }
    ctx.restore();
    const p = this.g.player; markRing(ctx, this.cx, y, t, p && this.fTouch(p), 16);
    if (p && this.fTouch(p)) handCue(ctx, this.cx, y - 2 * TS - 26, t, 'THROW: ' + (this.kind === 'drum' ? 'THUMP' : this.kind === 'block' ? 'CLACK' : 'KNOCK'));
  }
}
// a heap of nosy shells on a patch of beach: { cells (lock tiles), size: 'small' | 'big' | 'any', props: [pid...] }
class FoleyFlock extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, s.h * TS); this.x = s.tx * TS; this.y = (s.ty - s.h + 1) * TS; this.friendly = true; this.back = false;
    this.size = s.size || 'any'; this.props = s.props || []; this.lockId = s.lock; this.cells = s.cells; this.state = 'heap'; this.fly = 0; this.look = 0;
    const R = mulberry32(hashStr('flock' + s.tx));
    this.shells = [];
    const per = this.size === 'big' ? 1.2 : this.size === 'small' ? 2.6 : 1.8;
    for (const [cx, cy] of s.cells) for (let k = 0; k < per; k++) { const r = this.size === 'big' ? 13 + R() * 3 : this.size === 'small' ? 6 + R() * 2 : 9 + R() * 3; this.shells.push({ x: cx * TS + 6 + R() * (TS - 12), y: cy * TS + TS - 4 - R() * (TS - 10), r, ph: R() * 6, col: this.size === 'big' ? APRI2 : this.size === 'small' ? APRI3 : APRI }); }
    this.shells.sort((a, b) => a.y - b.y);
  }
  hears(kind) { return this.size === 'any' || (this.size === 'small' && kind === 'clack') || (this.size === 'big' && kind === 'thump'); }
  hear(kind, prop) {
    if (this.state !== 'heap') return;
    if (this.props.indexOf(prop.pid) < 0) { if (Math.abs(prop.cx - this.cx) < 14 * TS) { this.look = sign(prop.cx - this.cx); this.lookT = 1.2; } return; }
    if (!this.hears(kind)) { this.look = sign(prop.cx - this.cx); this.lookT = 1.4; K.say(this.g, this.cx, this.y - 10, this.size === 'big' ? 'TOO SQUEAKY FOR US.' : 'TOO BOOMY FOR US.', '#ffe0c0', 'flock' + this.x); return; }
    // rush to sit on it: the patch is clear at once
    this.state = 'fly'; this.fly = 0; this.to = prop; this.look = sign(prop.cx - this.cx);
    const g = this.g; for (const [x, y] of this.cells) g.setTile(x, y, T.EMPTY);
    openId(g, this.lockId);
    sfx('flock', 'pick', { vol: 0.5, pitch: 1.4 }); K.say(g, this.cx, this.y - 10, this.size === 'big' ? 'OOH, A DEEP ONE!' : this.size === 'small' ? 'OOH, A HIGH ONE!' : 'WHAT WAS THAT?!', '#ffe0c0', 'flock' + this.x);
    this.shells.forEach((s, k) => { s.x0 = s.x; s.y0 = s.y; s.tx = prop.cx + ((k % 5) - 2) * (s.r * 0.9) + (prop.perched.length % 2) * 4; s.ty = prop.fy * TS - 2 * TS - 10 - Math.floor(k / 5) * s.r * 0.8 - prop.perched.length * 6; s.dl = (k % 6) * 0.05; });
  }
  update(dt) {
    this.t += dt; if (this.lookT > 0) this.lookT -= dt; else if (this.state === 'heap') this.look = 0;
    if (this.state === 'fly') { this.fly += dt; if (this.fly > 1.1) { this.state = 'perched'; this.to.perched.push(this); } }
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t;
    for (const s of this.shells) {
      let x = s.x, y = s.y;
      if (this.state !== 'heap') { const k = clamp((this.fly - s.dl) / 0.8, 0, 1); x = s.x0 + (s.tx - s.x0) * k; y = s.y0 + (s.ty - s.y0) * k - Math.sin(k * Math.PI) * 60; }
      else y += Math.sin(t * 3 + s.ph) * 0.8;
      FA.shell(ctx, x, y, s.r, s.col, true, this.state === 'heap' ? this.look + Math.sin(t + s.ph) * 0.3 : 0);
    }
  }
}

/* ======================= 29-2 DAMPER: the rattling tin panels ======================= */
// { n (columns), meet (the twist: two humps meet in the middle), hold (s the panel stays flat after letting go) }
class FoleyPanel extends Ent {
  constructor(g, s) {
    super(g, s, s.n * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true;
    this.tx = Math.round(this.x / TS); this.row = Math.round(this.y / TS); this.n = s.n; this.meet = !!s.meet; this.hold = s.hold || 2.4;
    this.E = 1; this.flatT = 0; this.flat = false; this.press = 0; this.caught = false; this.P = s.period || 2.8; this.ph = 0; this.missT = 0;
  }
  // the near end's mark (the ground tile before the panel) or anywhere on the flat panel (the felt slides along)
  fTouch(p) {
    if (!p || p.dead || !p.onGround || p.groundTy !== this.row) return false;
    const c = Math.floor(p.cx / TS);
    if (this.meet) return !this.caught && c === this.tx - 1;
    return c >= this.tx - 1 && c <= this.tx + this.n - 1 && (c === this.tx - 1 || this.flat);
  }
  fInput(p, inp, dt) {
    if (this.meet) { if (inp.actionPressed) this.tryCatch(); return; }
    if (inp.action) { this.press = 0.15; if (!this.flat) { this.E = Math.max(0, this.E - dt / 0.6); if (this.E <= 0) this.setFlat(true); } else this.flatT = this.hold; }
  }
  // the twist: the humps' positions (0..1 from each end toward the middle) and whether they meet now
  humpU() { const q = mod(this.ph, this.P) / this.P; return q < 0.5 ? q * 2 : (1 - q) * 2; }
  meetNow() { return this.humpU() > 0.78; }
  tryCatch() {
    const g = this.g; this.drop = 0.5;
    if (this.meetNow()) { this.caught = true; this.setFlat(true); this.flatT = 1e9; FX.noise(g, this.cx, this.y, 'thump', { quiet: true }); sfx('felt', 'stomp', { vol: 0.6, pitch: 0.7 }); K.say(g, this.cx, this.y - 50, 'CAUGHT THEM BOTH! FLAT AS A PANCAKE', '#ffd84a', 'panel' + this.tx); }
    else { this.missT = 0.6; sfx('bonk', 'bump', { vol: 0.5, pitch: 1.4 }); FX.noise(g, this.cx, this.y, 'jag', { quiet: true }); K.say(g, this.cx, this.y - 50, 'MISSED! CATCH THEM WHERE THEY MEET', '#ff9a9a', 'panel' + this.tx); }
  }
  setFlat(on) {
    const g = this.g; this.flat = on;
    if (on) { this.E = 0; this.flatT = this.hold; for (let c = this.tx; c < this.tx + this.n; c++) if (tileAt(g.area, c, this.row) === T.EMPTY && !(g.player && overlapsTile(g.player, c, this.row))) g.setTile(c, this.row, T.HARD); sfx('flat', 'land', { vol: 0.5 }); }
    else { this.E = 1; for (let c = this.tx; c < this.tx + this.n; c++) g.setTile(c, this.row, T.EMPTY); FX.noise(g, this.cx, this.y, 'jag'); sfx('rattle', 'crumble', { vol: 0.5, pitch: 1.6 }); }
  }
  update(dt) {
    this.t += dt; this.ph += dt; if (this.press > 0) this.press -= dt; if (this.drop > 0) this.drop -= dt; if (this.missT > 0) this.missT -= dt;
    if (this.flat) {
      // flat: if the panel was only being held, it counts down once nobody holds it (its ripples come back first)
      if (!this.caught && this.press <= 0) { this.flatT -= dt; if (this.flatT <= 0) this.setFlat(false); }
      // a half-finished flat panel never leaves a tile half-set under Brady
      for (let c = this.tx; c < this.tx + this.n; c++) if (tileAt(this.g.area, c, this.row) === T.EMPTY && !(this.g.player && overlapsTile(this.g.player, c, this.row))) this.g.setTile(c, this.row, T.HARD);
    } else {
      if (this.press <= 0) this.E = Math.min(1, this.E + dt * 0.8);
      if (this.g.onScreen(this) && Math.floor(this.t * 1.6) !== Math.floor((this.t - dt) * 1.6)) { FX.noise(this.g, this.cx + Math.sin(this.t * 3) * this.w * 0.3, this.y + 6, 'jag', { quiet: true }); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t, n = this.n;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the burgundy end caps (always solid-looking: the panel hangs between them)
    ctx.fillStyle = FELT; rr(ctx, x - 6, y - 4, 10, 18, 2); ctx.fill(); ctx.stroke(); rr(ctx, x + w - 4, y - 4, 10, 18, 2); ctx.fill(); ctx.stroke();
    // the sheet: rattling (a jagged ripple, amplitude E) or flat (a calm petrol plank)
    const wob = (this.flat ? 0 : this.meet ? 1.5 : 3 + 7 * this.E), warn = this.flat && !this.caught && this.press <= 0 && this.flatT < 1.2 ? (1.2 - this.flatT) * 4 : 0;
    ctx.fillStyle = TIN; ctx.beginPath(); ctx.moveTo(x, y + 2);
    const segs = n * 4;
    const hump = u => { if (!this.meet || this.caught) return 0; const hu = this.humpU() * 0.5; return -24 * (Math.exp(-Math.pow((u - hu) * 9, 2)) + Math.exp(-Math.pow((u - (1 - hu)) * 9, 2))); };
    for (let s = 0; s <= segs; s++) { const u = s / segs, yy = y + 2 + (s % 2 ? 1 : -1) * (wob + warn) * Math.sin(t * 30 + s) * 0.8 + hump(u); ctx.lineTo(x + u * w, yy); }
    for (let s = segs; s >= 0; s--) { const u = s / segs, yy = y + 10 + (s % 2 ? 1 : -1) * (wob + warn) * Math.sin(t * 30 + s) * 0.8 + hump(u); ctx.lineTo(x + u * w, yy); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TIN3; ctx.fillRect(x + 2, y + 2, w - 4, 2);
    if (this.meet && !this.caught) { const hu = this.humpU() * 0.5; for (const u of [hu, 1 - hu]) { ctx.fillStyle = '#9ad0e0'; ctx.beginPath(); ctx.ellipse(x + u * w, y - 16, 10, 8, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); } }
    if (!this.flat || warn) { ctx.strokeStyle = '#9ad0e0'; ctx.lineWidth = 2; for (let k = 0; k < n; k++) { const xx = x + (k + 0.5) * TS; ctx.beginPath(); ctx.moveTo(xx - 6, y - 6); ctx.lineTo(xx - 2, y - 12); ctx.lineTo(xx + 2, y - 6); ctx.lineTo(xx + 6, y - 12); ctx.stroke(); } }
    ctx.restore();
    const p = this.g.player;
    // the felt damper: a burgundy pad on a pole under Brady's hand while THROW is held
    if (!this.meet && this.press > 0 && p) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeStyle = WOOD2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.cx, p.y + 20); ctx.lineTo(p.cx + p.facing * 22, y - 2); ctx.stroke(); ctx.fillStyle = FELT; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; rr(ctx, p.cx + p.facing * 22 - 12, y - 6, 24, 7, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (this.meet) {
      // the hanging damper over the middle, on its rope from the gantry; the meeting ring under it glows when the
      // humps are inside it: that is the moment
      const cx = x + w / 2, dy = this.drop > 0 ? (0.5 - Math.abs(this.drop - 0.25) * 2) * 40 : 0, hot = !this.caught && this.meetNow();
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeStyle = '#d8c8a0'; ctx.beginPath(); ctx.moveTo(cx, y - 5 * TS); ctx.lineTo(cx, y - 2 * TS + dy); ctx.stroke();
      ctx.fillStyle = FELT; ctx.strokeStyle = INK; rr(ctx, cx - 22, y - 2 * TS + dy, 44, 14, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      if (!this.caught) { markRing(ctx, cx, y + 4, t, hot, 30); if (hot) nowCue(ctx, cx, y - 3 * TS, t, 'NOW!'); }
      if (p && this.fTouch(p)) handCue(ctx, p.cx, p.y - 30, t, 'THROW WHEN THEY MEET');
      if (!this.caught) markRing(ctx, (this.tx - 0.5) * TS, this.row * TS, t, p && this.fTouch(p), 16);
    } else if (!this.flat) {
      markRing(ctx, (this.tx - 0.5) * TS, this.row * TS, t, p && this.fTouch(p), 16);
      if (p && this.fTouch(p)) handCue(ctx, p.cx, p.y - 30, t, 'HOLD THROW');
    } else if (p && this.fTouch(p) && this.press <= 0 && !this.caught) handCue(ctx, p.cx, p.y - 30, t, 'KEEP HOLDING THROW');
  }
}

/* ======================= 29-3 BANK: the props bank and the silent flipbook ======================= */
// the props a bank can hold, the noise each makes, and what each picture needs
const BANK_PROPS = {
  coconut: { noise: 'clack', word: 'CLIP-CLOP', name: 'COCONUTS' },
  block: { noise: 'clack', word: 'TOK', name: 'WOOD BLOCK' },
  squeak: { noise: 'squeak', word: 'SQUEAK', name: 'RUBBER DUCK' },
  sponge: { noise: 'dots', word: 'SPLOSH', name: 'WET SPONGE' },
  tin: { noise: 'jag', word: 'WOBBLE', name: 'TIN SHEET' }
};
const PICS = { horse: 'coconut', hobby: 'block', duck: 'squeak', fish: 'sponge', thunder: 'tin' };
const drawBankProp = (ctx, kind, x, y, sel, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  if (sel) { ctx.fillStyle = 'rgba(255,216,74,0.35)'; ctx.beginPath(); ctx.ellipse(x, y - 8, 20, 14, 0, 0, TAU); ctx.fill(); }
  if (kind === 'coconut') { FA.coconut(ctx, x - 8, y - 2, 8); FA.coconut(ctx, x + 8, y - 2, 8); }
  else if (kind === 'block') { ctx.fillStyle = '#f0c880'; rr(ctx, x - 11, y - 14, 22, 12, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 7, y - 9, 14, 2.5); }
  else if (kind === 'squeak') { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(x, y - 7, 11, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 6, y - 15, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f08a2a'; ctx.beginPath(); ctx.moveTo(x + 11, y - 16); ctx.lineTo(x + 17, y - 14); ctx.lineTo(x + 11, y - 12); ctx.fill(); ctx.stroke(); }
  else if (kind === 'sponge') { ctx.fillStyle = '#f0e060'; rr(ctx, x - 12, y - 13, 24, 11, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8b030'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 8 + k * 4, y - 8 + (k % 2) * 2, 1.4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#8ad0ff'; ctx.beginPath(); ctx.arc(x + 10, y - 2, 2, 0, TAU); ctx.fill(); }
  else if (kind === 'tin') { ctx.fillStyle = TIN; ctx.beginPath(); ctx.moveTo(x - 12, y - 2); for (let k = 0; k <= 6; k++) ctx.lineTo(x - 12 + k * 4, y - 16 + (k % 2) * 5); ctx.lineTo(x + 12, y - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
// a picture in the silent flipbook at phase q (0..1: the foot lands at q = 0)
const drawPic = (ctx, pic, x, y, s, q) => {
  const lift = Math.max(0, Math.sin(q * TAU)) * 8 * s, bob = Math.sin(q * TAU * 2) * 2 * s;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = '#1a1426'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // silent-film sepia ink drawings
  ctx.fillStyle = '#3a2a1a'; ctx.strokeStyle = '#3a2a1a';
  if (pic === 'horse' || pic === 'hobby') {
    if (pic === 'hobby') {
      // a wooden hobbyhorse on its stick, a little wheel at the foot
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, 16 - lift / s); ctx.lineTo(10, -10 - lift / s); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14, -14 - lift / s, 9, 6, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-14, 18 - lift / s, 4, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#e8d8b8'; ctx.beginPath(); ctx.arc(17, -16 - lift / s, 1.6, 0, TAU); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(0, -4 + bob, 16, 8, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, -8 + bob); ctx.lineTo(20, -20 + bob); ctx.lineTo(25, -16 + bob); ctx.lineTo(17, -6 + bob); ctx.fill();
      ctx.lineWidth = 3; for (const [lx, ph] of [[-10, 0], [-4, 0.5], [6, 0.5], [11, 0]]) { const up = Math.max(0, Math.sin((q + ph) * TAU)) * 6; ctx.beginPath(); ctx.moveTo(lx, 2 + bob); ctx.lineTo(lx + 1, 16 - up); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-16, -6 + bob); ctx.quadraticCurveTo(-24, -2, -22, 8); ctx.stroke();
    }
  } else if (pic === 'duck') {
    ctx.beginPath(); ctx.ellipse(0, -2 - lift / s * 0.4, 12, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9, -12 - lift / s * 0.4, 6, 0, TAU); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(-5, 16 - lift / s); ctx.moveTo(4, 6); ctx.lineTo(5, 16 - Math.max(0, Math.sin((q + 0.5) * TAU)) * 8); ctx.stroke();
  } else if (pic === 'fish') {
    const fy = -lift / s * 1.6;
    ctx.beginPath(); ctx.ellipse(0, 8 + fy, 14, 7, Math.sin(q * TAU) * 0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-12, 8 + fy); ctx.lineTo(-22, 2 + fy); ctx.lineTo(-22, 14 + fy); ctx.fill();
  }
  // the ground line and the dust puff as the foot lands
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, 18); ctx.lineTo(28, 18); ctx.stroke();
  const land = mod(q + 0.08, 1) < 0.16;
  if (land) { ctx.fillStyle = 'rgba(58,42,26,0.55)'; for (const dx of [-10, 0, 10]) { ctx.beginPath(); ctx.arc(dx, 15, 3.5, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
// { props: [...kinds], pics: ['horse', 'horse', 'hobby'] (one per hit needed), lock (id), sx/sy (the screen, tiles) }
class FoleyBank extends Ent {
  constructor(g, s) {
    super(g, s, s.props.length * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true;
    this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.props = s.props; this.pics = s.pics; this.lockId = s.lock; this.scr = s.scr;
    this.sel = 0; this.n = 0; this.mounted = false; this.P = s.period || 1.5; this.ph = 0; this.done = false; this.flash = 0; this.shake = 0; this.stickT = 0;
  }
  fTouch(p) { return !this.done && onMark(p, this.tx, this.fy, 0.9); }
  fInput(p, inp, dt) {
    if (!this.mounted) { if (inp.actionPressed) { this.mounted = true; this.stickT = 0.2; sfx('grab', 'select', { vol: 0.4 }); } return; }
    // the stick picks a prop (a tap moves one; holding steps every 0.3 s)
    const d = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (d) { this.stickT -= dt; if (this.stickT <= 0) { this.sel = clamp(this.sel + d, 0, this.props.length - 1); this.stickT = 0.3; sfx('tick', 'select', { vol: 0.25, pitch: 2 }); } } else this.stickT = 0;
    if (inp.actionPressed) this.play();
  }
  pic() { return this.pics[Math.min(this.n, this.pics.length - 1)]; }
  q() { return mod(this.ph, this.P) / this.P; }
  // the foot lands at q = 0 (generous: 0.3 s either side)
  onBeat() { const q = this.q(), d = Math.min(q, 1 - q) * this.P; return d < 0.3; }
  play() {
    const g = this.g, kind = this.props[this.sel], B = BANK_PROPS[kind], x = (this.tx + 1 + this.sel) * TS + TS / 2;
    FX.noise(g, x, this.fy * TS - 14, B.noise); sfx('prop', B.noise === 'thump' ? 'stomp' : 'kick', { vol: 0.5, pitch: B.noise === 'squeak' ? 2.2 : 1.6 });
    K.say(g, x, this.fy * TS - 2 * TS, B.word + '!', '#ffe8c8', 'bankw' + this.tx);
    const want = PICS[this.pic()];
    if (kind !== want) { this.shake = 0.6; K.say(g, this.scr[0] * TS, this.scr[1] * TS - 10, 'THAT\'S NOT WHAT A ' + (this.pic() === 'hobby' ? 'HOBBYHORSE' : this.pic().toUpperCase()) + ' SOUNDS LIKE', '#ff9a9a', 'bank' + this.tx); return; }
    if (!this.onBeat()) { this.shake = 0.4; K.say(g, this.scr[0] * TS, this.scr[1] * TS - 10, 'RIGHT NOISE! ON THE FOOT, THOUGH', '#ffd8a0', 'bank' + this.tx); return; }
    this.n++; this.flash = 0.5; sfx('good', 'pick', { vol: 0.6, pitch: 1.2 });
    if (this.n >= this.pics.length) { this.done = true; this.mounted = false; openId(g, this.lockId); K.say(g, this.scr[0] * TS, this.scr[1] * TS - 10, 'PERFECT! ROLL IT!', '#ffd84a', 'bank' + this.tx); Sound.play('door', { vol: 0.6 }); }
    else K.say(g, this.scr[0] * TS, this.scr[1] * TS - 10, this.pics[this.n] !== this.pics[this.n - 1] ? 'NEXT PICTURE!' : 'YES! AGAIN!', '#ffd84a', 'bank' + this.tx);
  }
  update(dt) { this.t += dt; this.ph += dt; if (this.flash > 0) this.flash -= dt; if (this.shake > 0) this.shake -= dt; }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, y = this.fy * TS, p = this.g.player;
    // the bank: a burgundy felt table with the props on it
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = FELT; rr(ctx, (this.tx + 1) * TS + 2, y - 20, this.props.length * TS - 4, 10, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = WOOD2; ctx.fillRect((this.tx + 1) * TS + 6, y - 10, 5, 10); ctx.fillRect((this.tx + 1 + this.props.length) * TS - 11, y - 10, 5, 10);
    ctx.restore();
    this.props.forEach((k, i) => drawBankProp(ctx, k, (this.tx + 1 + i) * TS + TS / 2, y - 20, this.mounted && i === this.sel, t));
    if (this.mounted) { const x = (this.tx + 1 + this.sel) * TS + TS / 2; ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 7, y - 50); ctx.lineTo(x + 7, y - 50); ctx.lineTo(x, y - 40 + Math.sin(t * 8) * 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (!this.done) {
      markRing(ctx, this.tx * TS + TS / 2, y, t, p && this.fTouch(p), 16);
      if (p && this.fTouch(p)) handCue(ctx, p.cx, p.y - 34, t, this.mounted ? 'STICK PICKS · THROW PLAYS · JUMP LETS GO' : 'THROW: TAKE THE PROPS');
    }
  }
}
// the flipbook screen over the way on: a lock column drawn as a silent-film screen that rolls up when the bank is done
class FoleyScreen extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, s.h * TS); this.x = s.x - 1.5 * TS; this.y = s.y - s.h * TS + TS; this.friendly = true; this.back = true; this.lockId = s.lock; this.tiles = s.tiles; this.hh = s.h; this.roll = 0; this.bank = null; this.open = false; }
  update(dt) {
    this.t += dt;
    if (!this.bank) this.bank = this.g.entities.find(e => e instanceof FoleyBank && e.lockId === this.lockId) || null;
    if (!this.open && isOpen(this.g, this.lockId)) { this.open = true; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY); }
    if (this.open) this.roll = Math.min(1, this.roll + dt * 1.2);
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.w, top = this.y, h = this.h * (1 - this.roll), B = this.bank, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    // the roller at the top
    ctx.fillStyle = WOOD; rr(ctx, x - 6, top - 10, w + 12, 12, 5); ctx.fill(); ctx.stroke();
    if (h > 4) {
      ctx.fillStyle = '#efe2c0'; ctx.fillRect(x, top, w, h); ctx.strokeRect(x, top, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 3, top + 3, w - 6, h - 6); ctx.clip();
      ctx.fillStyle = '#e4d2a8'; ctx.fillRect(x + 3, top + 3, w - 6, h - 6);
      // film grain and a frame flicker
      ctx.fillStyle = 'rgba(58,42,26,0.15)'; for (let k = 0; k < 8; k++) ctx.fillRect(x + ((k * 37 + Math.floor(t * 12) * 11) % w), top + ((k * 23) % (this.h)), 1.5, 6);
      if (B) {
        const q = B.q(), cy = top + Math.min(h, this.h) * 0.42;
        ctx.save(); if (B.shake > 0) ctx.translate(Math.sin(t * 50) * 4, 0);
        drawPic(ctx, B.pic(), x + w / 2, cy, 1.3, q);
        ctx.restore();
        // the foot lands: the whole frame flashes, a big dust puff and LANDS! at the bottom
        const land = mod(q + 0.06, 1) < 0.14;
        if (land) { ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillRect(x + 3, top + 3, w - 6, h - 6); }
        // the progress dots: one per hit needed
        for (let k = 0; k < B.pics.length; k++) { ctx.fillStyle = k < B.n ? '#ffd84a' : 'rgba(58,42,26,0.35)'; ctx.beginPath(); ctx.arc(x + w / 2 + (k - (B.pics.length - 1) / 2) * 14, top + this.h - 18, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
        // which prop it wants is shown only by the picture itself (the player chooses)
        if (B.flash > 0) { ctx.fillStyle = `rgba(255,216,74,${B.flash})`; ctx.fillRect(x + 3, top + 3, w - 6, h - 6); }
      }
      ctx.restore();
      // a beat bar under the picture: the moving dot reaches the middle mark when the foot lands
      if (B && h > this.h * 0.5) { const q = B.q(), by = top + this.h - 34, bx = x + 10, bw = w - 20; ctx.strokeStyle = 'rgba(58,42,26,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke(); ctx.fillStyle = '#7a2236'; ctx.fillRect(bx + bw / 2 - 2, by - 6, 4, 12); const u = mod(q + 0.5, 1); ctx.fillStyle = Math.abs(u - 0.5) * B.P < 0.3 ? '#ffd84a' : '#3a2a1a'; ctx.beginPath(); ctx.arc(bx + u * bw, by, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
    }
    ctx.restore();
  }
}

/* ======================= the cargo net (29-3): a real climbing surface ======================= */
// The grip physics and the checker's climbing spots are the engine's net (zone kind 'washNet', added for the drying
// nets in 26-1 and used here unchanged); this land draws its own net: a prop-lifting cargo net of knotted cream rope
// on a burgundy frame, two petrol pulleys at the top, a couple of prop tins caught in its bottom. The brass collars
// on the rope are the crossing points (JUMP there to swing round to the far side of the ropes).
class FoleyNet extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, s.h * TS); this.back = true; this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; this.friendly = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t, g = this.g;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the lifting ropes running on up through a gap: just knotted ropes
    if (this.s.lift) { ctx.strokeStyle = INK; ctx.lineWidth = 5; const R = () => { ctx.beginPath(); for (let xx = x + 8; xx < x + w; xx += 16) { ctx.moveTo(xx, y - 4); ctx.lineTo(xx, y + h + 6); } for (let yy = y + 6; yy < y + h; yy += 18) { ctx.moveTo(x + 4, yy); ctx.lineTo(x + w - 4, yy); } ctx.stroke(); }; R(); ctx.strokeStyle = '#efe2c4'; ctx.lineWidth = 3; R(); ctx.restore(); return; }
    // the frame and the pulleys it is lifted by
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = FELT; ctx.fillRect(x - 10, y - 18, w + 20, 10); ctx.strokeRect(x - 10, y - 18, w + 20, 10);
    for (const px of [x + 12, x + w - 12]) { ctx.fillStyle = TIN; ctx.beginPath(); ctx.arc(px, y - 8, 11, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = TIN3; ctx.beginPath(); ctx.arc(px, y - 8, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = FELT2; ctx.fillRect(x - 4, y - 8, 6, h + 8); ctx.fillRect(x + w - 2, y - 8, 6, h + 8);
    // the ropes: knotted cream squares
    const step = TS * 0.75;
    ctx.strokeStyle = INK; ctx.lineWidth = 5;
    const ropes = () => { ctx.beginPath(); for (let xx = x + 6; xx <= x + w - 6; xx += step) { ctx.moveTo(xx, y); ctx.lineTo(xx + Math.sin(t + xx) * 1.5, y + h); } for (let yy = y + 4; yy <= y + h; yy += step) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); } ctx.stroke(); };
    ropes(); ctx.strokeStyle = '#efe2c4'; ctx.lineWidth = 3; ropes();
    ctx.fillStyle = '#d8c8a0'; for (let xx = x + 6; xx <= x + w - 6; xx += step) for (let yy = y + 4; yy <= y + h; yy += step) { ctx.beginPath(); ctx.arc(xx, yy, 2.6, 0, TAU); ctx.fill(); }
    // the props it is lifting, caught in its bottom
    FA.propTin(ctx, x + w * 0.3, y + h + 6, 30, 20); FA.propTin(ctx, x + w * 0.7, y + h + 4, 24, 16);
    // the brass collars (the crossing points)
    for (const [hx, hy] of this.holes) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, TAU); ctx.stroke(); ctx.strokeStyle = BRASS; ctx.lineWidth = 4.5; ctx.stroke(); ctx.fillStyle = 'rgba(40,20,30,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill(); }
    // the far-side crawlers: one hatched silhouette each, drawn behind the ropes
    for (const e of g.entities) if (e.isFoleyNetCrab && e.face === 1 && e.nid === this.nid && !e.remove && !e.dead) e.drawFar(ctx);
    const p = g.player, W = p && p.wash;
    if (W && W.grip && W.grip.nid === this.nid && !(W.crossT > 0) && Tour.washKit && Tour.washKit.holeAt) {
      const hh = Tour.washKit.holeAt(W.grip, p.x + p.w / 2, p.y + Tour.washKit.NET.grip);
      if (hh) { const cx = hh[0] * TS + TS / 2, cy = hh[1] * TS + TS / 2, k = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 20 + k * 3, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  }
}
// on the far side of the ropes, the ropes pass in front of Brady (his bun and glasses still read between them)
TourHooks.on('afterEntities', (play, ctx) => {
  const p = play.player, W = p && p.wash; if (!(W && W.grip && W.face === 1) || !isFoley(play)) return;
  const N = play.entities.find(e => e instanceof FoleyNet && e.nid === W.grip.nid); if (!N) return;
  const step = TS * 0.75, x0 = p.x - 20, x1 = p.x + p.w + 20, y0 = p.y - 20, y1 = p.y + p.h + 10;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.lineCap = 'round';
  const ropes = () => { ctx.beginPath(); for (let xx = N.x + 6; xx <= N.x + N.w - 6; xx += step) { ctx.moveTo(xx, N.y); ctx.lineTo(xx + Math.sin(N.t + xx) * 1.5, N.y + N.h); } for (let yy = N.y + 4; yy <= N.y + N.h; yy += step) { ctx.moveTo(N.x, yy); ctx.lineTo(N.x + N.w, yy); } ctx.stroke(); };
  ctx.globalAlpha = 0.85; ctx.strokeStyle = INK; ctx.lineWidth = 4; ropes(); ctx.strokeStyle = '#efe2c4'; ctx.lineWidth = 2.4; ropes();
  ctx.restore();
});
// a Boom Crab clambering on the net: one side each; only a crab on Brady's side can touch him
class FoleyNetCrab extends Ent {
  constructor(g, s) {
    super(g, s, 24, 24); this.enemy = true; this.customCollide = true; this.isFoleyNetCrab = true;
    this.nid = s.nid; this.face = s.face || 0; this.x0 = s.x - 12; this.y0 = s.y - TS - 8; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 1.1;
    this.len = Math.max(1, Math.abs(this.ax) + Math.abs(this.ay)); this.u = (s.phase || 0) % 1; this.dirU = 1; this.dir = 1; this.place();
  }
  place() { this.x = this.x0 + this.ax * this.u; this.y = this.y0 + this.ay * this.u; }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    this.u += this.dirU * this.sp * TS * dt / this.len; if (this.u >= 1) { this.u = 1; this.dirU = -1; } if (this.u <= 0) { this.u = 0; this.dirU = 1; }
    if (this.ax) this.dir = sign(this.ax) * this.dirU; this.place();
  }
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.wash, onNet = !!(W && W.grip), face = onNet ? W.face : 0;
    if (face !== this.face || (W && W.crossT > 0)) return;
    if (p.star > 0) { this.knock(); return; }
    if (!onNet && p.vy > 0 && p.prevBottom <= this.y + 12) { this.knock(); p.vy = -PHYS.stompV; p.jumping = true; this.g.addScore(100, this.cx, this.y); return; }
    p.hurt(this);
  }
  knock() { if (this.dead) return; this.dead = true; this.vy = -4 * TS; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, APRI, 'dust'); }
  hit(kind) { if (this.face === 1 && kind !== 'star') return false; this.knock(); return true; }
  touchPlayer() {}
  draw(ctx) {
    if (this.face === 1 && !this.dead) return;
    const art = Tour.countries.foley.enemies ? null : null; void art;
    const E = ENTITY_TYPES.foleyCrab, A = E && E.cfg && E.cfg.art;
    Ink.around(ctx, this.x - 26, this.y - 40, this.w + 52, this.h + 50, c => { c.save(); if (this.dead) { c.translate(this.cx, this.cy); c.rotate(Math.PI); c.translate(-this.cx, -this.cy); } if (A) A(c, this, this.cx, this.y + this.h, 'walk', this.t); c.restore(); }, { pad: 4 });
  }
  drawFar(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save(); const body = () => { ctx.beginPath(); ctx.ellipse(x, y - 12, 16, 12, 0, 0, TAU); ctx.moveTo(x - 18, y - 34); ctx.ellipse(x - 20, y - 36, 9, 7, 0, 0, TAU); };
    ctx.fillStyle = 'rgba(40,20,40,0.5)'; body(); ctx.fill(); ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(40,20,40,0.6)'; ctx.lineWidth = 2; for (let k = -40; k < 40; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 44); ctx.lineTo(x + k + 30, y); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = FELT3; ctx.beginPath(); ctx.arc(x, y - 18, 6, Math.PI, 0); ctx.fill(); ctx.restore();
  }
}

/* ======================= 29-4 TRUMPET: the speaking trumpet, the hinged ears, the tin platters ======================= */
// the puff's path from (x, y) along angle a: straight lines, bouncing off tin platters ('/' or '\'), stopping at a
// solid tile, an ear, or after `max` px. Returns the points and what it ends on (the same function draws the dotted
// preview and moves the real puff)
const puffPath = (g, x, y, a, max) => {
  const A = g.area, pts = [[x, y]], plats = g.entities.filter(e => e instanceof FoleyPlatter), ears = g.entities.filter(e => e instanceof FoleyEar && !e.open);
  let vx = Math.cos(a), vy = Math.sin(a), d = 0, hit = null, lastPl = null;
  const step = 4;
  while (d < (max || 70 * TS)) {
    x += vx * step; y += vy * step; d += step;
    const pl = plats.find(q => q !== lastPl && Math.abs(x - q.cx) < 14 && Math.abs(y - q.cy) < 14);
    if (pl) { pts.push([pl.cx, pl.cy]); x = pl.cx; y = pl.cy; const ox = vx; if (pl.dirn === '/') { vx = -vy; vy = -ox; } else { vx = vy; vy = ox; } lastPl = pl; continue; }
    const ear = ears.find(q => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
    if (ear) { hit = { ear, front: sign(vx) === -ear.face || (vx === 0 && false) }; break; }
    const t2 = tileAt(A, Math.floor(x / TS), Math.floor(y / TS));
    if (SOLID[t2] && !(A.hide && A.hide[Math.floor(y / TS) * A.W + Math.floor(x / TS)] === 2)) { hit = { wall: true }; break; }
    if (x < 0 || y < 0 || x > A.W * TS || y > A.H * TS) break;
  }
  pts.push([x, y]);
  return { pts, hit, len: d };
};
// the trumpet on its stand: { a (the starting aim, radians), id }
class FoleyTrumpet extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.a = s.a != null ? s.a : -0.5; this.mounted = false; this.puff = null; this.cool = 0; }
  mouth() { return [this.cx + Math.cos(this.a) * 30, this.fy * TS - 44 + Math.sin(this.a) * 30]; }
  fTouch(p) { return onMark(p, this.tx, this.fy, 0.9); }
  fInput(p, inp, dt) {
    if (!this.mounted) { if (inp.actionPressed) { this.mounted = true; sfx('grab', 'select', { vol: 0.4 }); } return; }
    // the stick aims: up/down turns the bell, left/right swings it round to that side
    const sp = 1.3 * dt;
    if (inp.up) this.a += Math.cos(this.a) >= 0 ? -sp : sp;
    if (inp.down) this.a += Math.cos(this.a) >= 0 ? sp : -sp;
    if (inp.right && Math.cos(this.a) < 0) this.a = Math.PI - this.a;
    if (inp.left && Math.cos(this.a) > 0) this.a = Math.PI - this.a;
    // never into the floor: from straight up to a little below level
    let c = Math.cos(this.a) >= 0 ? 1 : -1, s = Math.sin(this.a); s = clamp(s, -0.999, 0.35); this.a = Math.atan2(s, c * Math.sqrt(1 - s * s));
    if (inp.actionPressed && this.cool <= 0) this.send();
  }
  send() {
    const g = this.g, [mx, my] = this.mouth(), path = puffPath(g, mx, my, this.a);
    this.puff = { path, k: 0, len: path.len }; this.cool = 0.5;
    FX.noise(g, mx, my, 'puff', { quiet: true }); sfx('puff', 'throw', { vol: 0.5, pitch: 0.8 }); K.say(g, mx, my - 20, 'HOO!', IVORY, 'trumpet' + this.tx);
  }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt;
    const P = this.puff; if (!P) return;
    P.k += dt * 12 * TS;
    if (P.k >= P.len) {
      const h = P.path.hit; this.puff = null;
      if (h && h.ear) { if (h.front) h.ear.hear(); else { K.say(this.g, h.ear.cx, h.ear.y - 10, 'THIS EAR IS FACING AWAY', '#ffd8a0', 'ear' + h.ear.x); FX.noise(this.g, h.ear.cx, h.ear.cy, 'puff', { quiet: true }); } }
      else { const e = P.path.pts[P.path.pts.length - 1]; FX.noise(this.g, e[0], e[1], 'puff', { quiet: true, scale: 0.6 }); }
    }
  }
  // where along the path the puff is now
  puffAt() { const P = this.puff; if (!P) return null; let left = P.k; const pts = P.path.pts; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay); if (left <= L) return [ax + (bx - ax) * left / L, ay + (by - ay) * left / L]; left -= L; } return pts[pts.length - 1]; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.fy * TS, t = this.t, p = this.g.player;
    // the dotted preview while Brady holds it
    if (this.mounted) {
      const [mx, my] = this.mouth(), path = puffPath(this.g, mx, my, this.a);
      ctx.save(); ctx.fillStyle = '#fff6d8'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
      let acc = (t * 60) % 14; const pts = path.pts;
      for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay); for (; acc < L; acc += 14) { const u = acc / L; ctx.beginPath(); ctx.arc(ax + (bx - ax) * u, ay + (by - ay) * u, 3, 0, TAU); ctx.fill(); ctx.stroke(); } acc -= L; }
      const h = path.hit; if (h && h.ear) { const e = h.ear; ctx.strokeStyle = h.front ? '#9aff9a' : '#ff9a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.cx, e.cy, 26, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the stand
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 44, 4, 44); ctx.strokeRect(x - 2, y - 44, 4, 44);
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 10); ctx.lineTo(x + 12, y); ctx.stroke();
    // the brass speaking trumpet, turned to its aim
    ctx.translate(x, y - 44); ctx.rotate(this.a);
    ctx.fillStyle = BRASS; ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(16, -5); ctx.lineTo(32, -15); ctx.lineTo(32, 15); ctx.lineTo(16, 5); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5a18'; ctx.beginPath(); ctx.ellipse(32, 0, 4, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2a0'; ctx.fillRect(0, -3, 14, 1.5);
    ctx.restore();
    const at = this.puffAt(); if (at) { FA.ring(ctx, at[0], at[1], 12 + Math.sin(t * 20) * 2, 0.95, IVORY, 3.5); FA.ring(ctx, at[0], at[1], 6, 0.9, '#ffffff', 2); }
    markRing(ctx, x, y, t, p && this.fTouch(p), 16);
    if (p && this.fTouch(p)) handCue(ctx, x, y - 3 * TS - 6, t, this.mounted ? 'STICK AIMS · THROW PUFFS · JUMP LETS GO' : 'THROW: TAKE THE TRUMPET');
  }
}
// a distant hinged ear: { face (1: its front opens to the right... -1: to the left), g (toggle group), landing rects }
class FoleyEar extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 3 * TS); this.x = s.x - TS; this.y = s.y - 3 * TS; this.friendly = true; this.back = true; this.face = s.face || -1; this.gi = s.gi; this.land = s.land || []; this.open = false; this.fold = 0; }
  hear() {
    if (this.open) return; this.open = true; const g = this.g;
    FX.noise(g, this.cx, this.cy, 'clack'); sfx('ear', 'door', { vol: 0.6 }); K.say(g, this.cx, this.y - 10, 'I HEARD THAT!', '#ffd84a', 'ear' + this.x);
    // its own landing only (the checker's toggle group stands for all the ears the trumpets reach)
    for (const r of this.land) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) if (!(g.player && overlap(g.player, { x: xx * TS, y: yy * TS, w: TS, h: TS }))) g.setTile(xx, yy, T.HARD);
  }
  update(dt) { this.t += dt; if (this.open) this.fold = Math.min(1, this.fold + dt * 2.5); }
  touchPlayer() {}
  draw(ctx) {
    const f = this.face, base = this.y + this.h, x = this.cx, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    // the hinge post
    ctx.fillStyle = WOOD; ctx.fillRect(x - 5, base - 10, 10, 10); ctx.strokeRect(x - 5, base - 10, 10, 10);
    // the ear: upright (closed) folding down flat into a landing (open) toward its front
    ctx.translate(x, base - 6); ctx.rotate(this.fold * f * Math.PI / 2);
    ctx.fillStyle = APRI3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-f * 30, -10, -f * 34, -80, f * 6, -86); ctx.bezierCurveTo(f * 36, -88, f * 30, -40, f * 10, -30); ctx.quadraticCurveTo(f * 2, -10, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e08a6a'; ctx.beginPath(); ctx.moveTo(f * 2, -12); ctx.bezierCurveTo(-f * 16, -24, -f * 14, -70, f * 6, -72); ctx.bezierCurveTo(f * 22, -72, f * 18, -46, f * 6, -38); ctx.closePath(); ctx.fill();
    ctx.restore();
    // a closed ear facing the trumpet listens (a little "?" toward its front)
    if (!this.open) { ctx.save(); ctx.fillStyle = 'rgba(14,8,26,0.8)'; rr(ctx, x + f * 30 - 10, this.y - 4, 20, 18, 9); ctx.fill(); ctx.fillStyle = '#ffe8c8'; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('?', x + f * 30, this.y + 9 + Math.sin(t * 3) * 1.5); ctx.restore(); }
    ctx.restore();
  }
}
// a tin platter on a bracket (the bounce): '/' or '\'
class FoleyPlatter extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.dirn = s.dirn || '/'; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.cy, a = this.dirn === '/' ? -Math.PI / 4 : Math.PI / 4;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke();
    ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#c8d4dc'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-10, -2, 8, 1.5); ctx.restore();
  }
}

/* ======================= 29-5 TAKE: the recording desk and the picture strip ======================= */
// { lock, prop: 'door' | 'gull' | 'thunder', band: [a, b] (where the take starts and stops, 0..1), period }
const TAKES = { door: { word: 'CREEEAK', noise: 'jag', col: '#c8a070' }, gull: { word: 'KYAAA', noise: 'squeak', col: '#ffffff' }, splash: { word: 'SPLOSH', noise: 'dots', col: '#8ad0ff' }, thunder: { word: 'CRACK!', noise: 'thump', col: '#fff2a0' } };
class FoleyDesk extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS);
    this.lockId = s.lock; this.prop = s.prop || 'door'; this.band = s.band || [0.3, 0.6]; this.P = s.period || 3.2; this.ph = 0; this.rec = null; this.done = false; this.win = s.win || 0.075; this.spk = s.spk; this.playT = 0;
  }
  u() { return mod(this.ph, this.P) / this.P; }
  fTouch(p) { return !this.done && onMark(p, this.tx, this.fy, 0.9); }
  fInput(p, inp) {
    const u = this.u(), g = this.g;
    if (inp.actionPressed && !this.rec) {
      if (Math.abs(u - this.band[0]) <= this.win) { this.rec = { a: u }; sfx('rec', 'select', { vol: 0.4, pitch: 1.4 }); }
      else { this.rec = { a: u, bad: true }; K.say(g, this.cx, this.y - 5.2 * TS, u < this.band[0] ? 'TOO EARLY: START AT THE BAND' : 'TOO LATE: START AT THE BAND', '#ff9a9a', 'desk' + this.tx); sfx('bonk', 'bump', { vol: 0.4 }); }
    }
    if (this.rec && !inp.action) this.release(u);
  }
  release(u) {
    const g = this.g, R = this.rec; this.rec = null;
    if (R.bad) return;
    const end = this.band[1];
    if (Math.abs(u - end) <= this.win) {
      this.done = true; openId(g, this.lockId); this.playT = 1.6;
      const T2 = TAKES[this.prop] || TAKES.door, sp = this.spk ? [this.spk[0] * TS, this.spk[1] * TS] : [this.cx, this.y];
      FX.noise(g, sp[0], sp[1], T2.noise); sfx('play', T2.noise === 'thump' ? 'thunder' : 'door', { vol: 0.6 });
      K.say(g, sp[0], sp[1] - 30, T2.word + ' ...THAT\'S A TAKE!', '#ffd84a', 'desk' + this.tx);
    } else K.say(g, this.cx, this.y - 5.2 * TS, u < end ? 'CUT TOO SHORT: LET GO AT THE BAND\'S END' : (this.prop === 'thunder' ? 'TOO LONG: THAT\'S THE RATTLE. JUST THE CRACK' : 'TOO LONG: LET GO AT THE BAND\'S END'), '#ff9a9a', 'desk' + this.tx);
  }
  update(dt) { this.t += dt; this.ph += dt; if (this.playT > 0) this.playT -= dt; if (this.rec && this.u() < (this.rec.a || 0) - 0.5) this.release(this.u()); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.fy * TS, t = this.t, p = this.g.player, T2 = TAKES[this.prop] || TAKES.door;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the desk with its reel
    ctx.fillStyle = WOOD; rr(ctx, x - 22, y - 24, 44, 24, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TIN; for (const rx of [x - 10, x + 10]) { ctx.beginPath(); ctx.arc(rx, y - 30, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.save(); ctx.translate(rx, y - 30); ctx.rotate(this.rec ? t * 8 : 0); ctx.fillStyle = TIN3; ctx.fillRect(-1, -7, 2, 14); ctx.restore(); }
    if (this.rec && !this.rec.bad) { ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x + 18, y - 18, 4 + Math.sin(t * 10), 0, TAU); ctx.fill(); }
    ctx.restore();
    // the picture strip above the desk: the prop's noise drawn along it (the marked band in gold), the moving marker
    const sw = 7 * TS, sx = x - sw / 2, sy = y - 4 * TS, sh = 34;
    ctx.save(); ctx.fillStyle = '#1e1a24'; rr(ctx, sx - 6, sy - 6, sw + 12, sh + 12, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(sx, sy, sw, sh);
    // sprocket holes
    ctx.fillStyle = '#e8e0d0'; for (let k = 0; k < 14; k++) { ctx.fillRect(sx + 4 + k * sw / 14, sy - 4, 5, 3); ctx.fillRect(sx + 4 + k * sw / 14, sy + sh + 1, 5, 3); }
    // the noise's picture along the strip
    ctx.strokeStyle = T2.col; ctx.lineWidth = 2; ctx.beginPath();
    for (let s = 0; s <= 140; s++) {
      const u = s / 140; let amp;
      if (this.prop === 'thunder') amp = u < this.band[0] ? 1 : u < this.band[1] ? 15 : u < 0.9 ? 8 * (1 - (u - this.band[1]) / (0.9 - this.band[1])) + 2 : 1;
      else amp = u > this.band[0] - 0.04 && u < this.band[1] + 0.04 ? 11 : 1.5;
      const yy = sy + sh / 2 + Math.sin(s * 1.7) * amp * (this.prop === 'thunder' && u > this.band[1] ? (s % 2 ? 1 : -0.6) : 1);
      s ? ctx.lineTo(sx + u * sw, yy) : ctx.moveTo(sx + u * sw, yy);
    }
    ctx.stroke();
    // the marked length: a gold band with a start and an end tick
    const ax = sx + this.band[0] * sw, bx = sx + this.band[1] * sw;
    ctx.fillStyle = 'rgba(255,216,74,0.22)'; ctx.fillRect(ax, sy, bx - ax, sh);
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, sy - 8); ctx.lineTo(ax, sy + sh + 8); ctx.moveTo(bx, sy - 8); ctx.lineTo(bx, sy + sh + 8); ctx.stroke();
    // the moving marker (the playhead); red while recording
    const mx = sx + this.u() * sw;
    ctx.strokeStyle = this.rec && !this.rec.bad ? '#ff4a4a' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, sy - 10); ctx.lineTo(mx, sy + sh + 10); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(mx - 6, sy - 14); ctx.lineTo(mx + 6, sy - 14); ctx.lineTo(mx, sy - 6); ctx.closePath(); ctx.fill();
    if (this.rec && !this.rec.bad) { ctx.fillStyle = 'rgba(255,74,74,0.3)'; ctx.fillRect(sx + this.rec.a * sw, sy, Math.max(0, mx - (sx + this.rec.a * sw)), sh); }
    // the window cues: START / STOP light up as the marker comes into each
    const near = (v) => Math.abs(this.u() - v) <= this.win;
    if (!this.done) { if (near(this.band[0]) && !this.rec) nowCue(ctx, ax, sy - 26, t, 'HOLD!', '#9aff9a'); if (near(this.band[1]) && this.rec && !this.rec.bad) nowCue(ctx, bx, sy - 26, t, 'LET GO!', '#ffd84a'); }
    ctx.restore();
    if (!this.done) { markRing(ctx, x, y, t, p && this.fTouch(p), 18); if (p && this.fTouch(p) && !this.rec) handCue(ctx, x - 70, y - 2 * TS, t, 'HOLD THROW ON THE BAND'); }
    // the speaker plays the take back
    if (this.spk) { const kx = this.spk[0] * TS, ky = this.spk[1] * TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#3a3440'; rr(ctx, kx - 14, ky - 18, 28, 36, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = this.playT > 0 ? '#ffd84a' : '#6a6070'; ctx.beginPath(); ctx.arc(kx, ky + 2 + (this.playT > 0 ? Math.sin(t * 40) : 0), 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
}
// the clapper gate a lock id opens: a big clapperboard that lifts away (also 29-6's gates)
class FoleyClapGate extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.rise = 0; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    if (!this.open && isOpen(this.g, this.id)) { this.open = true; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY); Sound.play('door', { vol: 0.6 }); this.g.burst(this.cx, this.cy, 14, '#ffffff', 'confetti'); FX.noise(this.g, this.cx, this.y + 10, 'clack', { quiet: true }); }
    if (this.open) this.rise = Math.min(1, this.rise + dt * 1.4);
  }
  touchPlayer() { if (this.open) return; if (this.msgT <= 0) { this.msgT = 2.5; K.say(this.g, this.cx, this.y - 10, 'QUIET ON SET! GET THE TAKE FIRST', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); } }
  draw(ctx) {
    if (this.rise >= 1) return;
    const x = this.cx, y = this.y - this.rise * this.h * 1.3, h = this.h;
    ctx.save(); ctx.globalAlpha = 1 - this.rise; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#1e1a24'; rr(ctx, x - 14, y, 28, h, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < h / 12; k++) { ctx.save(); ctx.beginPath(); ctx.rect(x - 14, y + k * 12, 28, 6); ctx.clip(); for (let s = -2; s < 4; s++) { ctx.beginPath(); ctx.moveTo(x - 14 + s * 10, y + k * 12); ctx.lineTo(x - 4 + s * 10, y + k * 12); ctx.lineTo(x - 9 + s * 10, y + k * 12 + 6); ctx.lineTo(x - 19 + s * 10, y + k * 12 + 6); ctx.fill(); } ctx.restore(); }
    ctx.restore();
  }
}

/* ======================= 29-6 MIC: the noisy machines and the microphone ======================= */
// the three machines of the storm: tin sheet (shakes: jagged ripples), rice tray (pours: dots), windcloth (a handle
// turns: long loops); each sounds on its own cycle
const MACHINES = { tin: { noise: 'jag', word: 'WOBBA-WOBBA', move: 'clap' }, rice: { noise: 'dots', word: 'SHHHHH', move: 'hail' }, wind: { noise: 'loops', word: 'WHOOOO', move: 'gust' }, pea: { noise: 'squeak', word: 'thank you', move: 'voice' } };
class FoleyMachine extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 2 * TS); this.x = s.x - TS; this.y = s.y - 2 * TS; this.friendly = true; this.back = true; this.kind = s.kind; this.P = s.period || 3.0; this.on0 = s.on0 || 0; this.dur = s.dur || 1.4; this.ph = 0; this.big = !!s.big; }
  sounding() { if (this.kind === 'pea') return this.quietAround(); const q = mod(this.ph - this.on0, this.P); return q < this.dur; }
  // the pea's tiny voice registers only when every machine nearby is quiet
  quietAround() { return !this.g.entities.some(e => e instanceof FoleyMachine && e !== this && e.kind !== 'pea' && Math.abs(e.cx - this.cx) < 16 * TS && e.sounding()); }
  update(dt) {
    this.t += dt; this.ph += dt;
    if (this.sounding() && this.g.onScreen(this) && Math.floor(this.t * 3) !== Math.floor((this.t - dt) * 3)) FX.noise(this.g, this.cx, this.y + 14, MACHINES[this.kind].noise, { quiet: true, dir: 1, scale: this.kind === 'pea' ? 0.5 : 1 });
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, on = this.sounding();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    if (this.kind === 'tin') {
      ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 26, y - 62, 4, 62); ctx.fillRect(x + 22, y - 62, 4, 62); ctx.fillRect(x - 26, y - 64, 52, 4);
      const w = on ? Math.sin(t * 28) * 6 : 0;
      ctx.fillStyle = TIN; ctx.beginPath(); ctx.moveTo(x - 20, y - 60); ctx.quadraticCurveTo(x + w, y - 34, x - 20, y - 8); ctx.lineTo(x + 20, y - 8); ctx.quadraticCurveTo(x - w, y - 34, x + 20, y - 60); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TIN3; ctx.fillRect(x - 16, y - 58, 4, 46);
    } else if (this.kind === 'rice') {
      ctx.fillStyle = WOOD; ctx.save(); ctx.translate(x, y - 50); ctx.rotate(on ? 0.25 : 0); rr(ctx, -26, -6, 52, 12, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 46, 4, 46);
      if (on) { ctx.fillStyle = '#fff8e0'; for (let k = 0; k < 16; k++) { const q = (t * 2 + k / 16) % 1; ctx.beginPath(); ctx.arc(x + 22 + Math.sin(k) * 3, y - 44 + q * 40, 1.8, 0, TAU); ctx.fill(); } }
      ctx.fillStyle = TIN2; rr(ctx, x + 10, y - 8, 26, 8, 2); ctx.fill(); ctx.stroke();
    } else if (this.kind === 'wind') {
      // the windcloth: a drum of canvas turned by a crank
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(x, y - 30, 22, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(x, y - 30); ctx.rotate(on ? t * 6 : 0); ctx.strokeStyle = '#a89870'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.stroke(); } ctx.restore();
      ctx.strokeStyle = FELT; ctx.lineWidth = 3; const ca = on ? t * 6 : 0; ctx.beginPath(); ctx.moveTo(x + 22, y - 30); ctx.lineTo(x + 30 + Math.cos(ca) * 6, y - 30 + Math.sin(ca) * 6); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = WOOD2; ctx.fillRect(x - 18, y - 12, 36, 12); ctx.strokeRect(x - 18, y - 12, 36, 12);
    } else if (this.kind === 'pea') {
      // a cardboard cut-out of Mr. Thunder's tin with the pea peeping out: his stand-in for the voice test
      FA.propTin(ctx, x, y, 40, 22);
      ctx.fillStyle = '#8ac84a'; ctx.beginPath(); ctx.arc(x, y - 28, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 3, y - 30, 1.4, 0, TAU); ctx.arc(x + 3, y - 30, 1.4, 0, TAU); ctx.fill();
      if (on) { ctx.fillStyle = 'rgba(14,8,26,0.8)'; rr(ctx, x - 30, y - 58, 60, 16, 8); ctx.fill(); ctx.fillStyle = '#ffe8c8'; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('(thank you)', x, y - 47); }
    }
    ctx.restore();
    if (on && this.kind !== 'pea') { ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 30, y - 2 * TS, 4 + Math.sin(t * 12), 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
// the microphone on its stand: { lock, want: 'tin' | 'rice' | 'wind' | 'pea' }; the machines near it are its choices
class FoleyMic extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.lockId = s.lock; this.want = s.want; this.mounted = false; this.sel = 0; this.got = null; this.done = false; this.stickT = 0; this.card = s.card; }
  machines() { return this.g.entities.filter(e => e instanceof FoleyMachine && Math.abs(e.cx - this.cx) < 12 * TS && Math.abs(e.cy - this.cy) < 6 * TS).sort((a, b) => a.x - b.x); }
  fTouch(p) { return !this.done && onMark(p, this.tx, this.fy, 0.9); }
  fInput(p, inp, dt) {
    if (!this.mounted) { if (inp.actionPressed) { this.mounted = true; this.sel = clamp(this.sel, 0, this.machines().length - 1); sfx('grab', 'select', { vol: 0.4 }); } return; }
    const d = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), M = this.machines();
    if (d && !this.got) { this.stickT -= dt; if (this.stickT <= 0) { this.sel = clamp(this.sel + d, 0, M.length - 1); this.stickT = 0.3; sfx('tick', 'select', { vol: 0.25, pitch: 2 }); } } else this.stickT = 0;
    if (inp.actionPressed) this.tap();
  }
  tap() {
    const g = this.g, M = this.machines(), m = M[this.sel];
    if (!this.got) {
      // one tap captures what the mic points at, if it is sounding now
      if (!m || !m.sounding()) { K.say(g, this.cx, this.y - 80, m && m.kind === 'pea' ? 'TOO NOISY: WAIT FOR QUIET' : 'NOTHING THERE YET: WAIT FOR IT TO SOUND', '#ffd8a0', 'mic' + this.tx); sfx('bonk', 'bump', { vol: 0.3 }); return; }
      this.got = m.kind; sfx('rec', 'select', { vol: 0.5, pitch: 1.4 }); K.say(g, this.cx, this.y - 80, 'GOT IT! THROW AGAIN TO PLAY IT BACK', '#9aff9a', 'mic' + this.tx); return;
    }
    // the next tap plays it back
    const kind = this.got; this.got = null; FX.noise(g, this.cx, this.y - 30, MACHINES[kind].noise); sfx('play', 'select', { vol: 0.5, pitch: 0.9 });
    if (kind === this.want) { this.done = true; this.mounted = false; openId(g, this.lockId); K.say(g, this.cx, this.y - 80, 'THAT\'S HIS NEXT MOVE! THE GATE BOWS', '#ffd84a', 'mic' + this.tx); }
    else K.say(g, this.cx, this.y - 80, 'NOT THE NOISE ON THE CARD', '#ff9a9a', 'mic' + this.tx);
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.fy * TS, t = this.t, p = this.g.player, M = this.machines(), m = M[this.sel];
    // the cable from the mic to what it points at (a dotted line while held)
    if (this.mounted && m) { ctx.save(); ctx.strokeStyle = this.got ? '#9aff9a' : '#ffd84a'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(m.cx, m.y + 20); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(m.cx, m.y + 20, 30, 0, TAU); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 50, 4, 50); ctx.strokeRect(x - 2, y - 50, 4, 50);
    const a = m && this.mounted ? Math.atan2(m.y + 20 - (y - 56), m.cx - x) : -1.2;
    ctx.translate(x, y - 54); ctx.rotate(a); ctx.fillStyle = '#5a5a64'; rr(ctx, -4, -5, 20, 10, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.arc(18, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the cue card: Mr. Thunder's next move (a picture: a clap, hail, a gust, or his tiny mouth)
    if (this.card && !this.done) {
      const [cx, cy] = [this.card[0] * TS, this.card[1] * TS];
      ctx.save(); ctx.fillStyle = '#f6ecd6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, cx - 30, cy - 24, 60, 48, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a2236'; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('NEXT MOVE', cx, cy - 14);
      drawMove(ctx, MACHINES[this.want].move, cx, cy + 6, t);
      ctx.restore();
    }
    if (!this.done) { markRing(ctx, x, y, t, p && this.fTouch(p), 16); if (p && this.fTouch(p)) handCue(ctx, x, y - 3 * TS - 10, t, this.mounted ? (this.got ? 'THROW: PLAY IT BACK' : 'STICK STEERS · THROW CAPTURES') : 'THROW: TAKE THE MIC'); }
    if (this.got) { ctx.save(); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x + 12, y - 64, 4 + Math.sin(t * 10), 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
// a little picture of a move (cards and the boss's cue): a clap, hail, a gust, a tiny mouth
const drawMove = (ctx, move, x, y, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (move === 'clap') { ctx.fillStyle = TIN; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * (6 + Math.abs(Math.sin(t * 4)) * 4), y, 6, 10, s * 0.3, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.strokeStyle = '#7a2236'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 4 + k * 4, y - 14); ctx.lineTo(x - 6 + k * 6, y - 20); ctx.stroke(); } }
  else if (move === 'hail') { ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 10 + k * 5, y + 2 + ((t * 20 + k * 5) % 10), 1.8, 0, TAU); ctx.fill(); ctx.stroke(); } }
  else if (move === 'gust') { ctx.strokeStyle = '#4a6a8a'; ctx.lineWidth = 2.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 16, y - 8 + k * 7); ctx.quadraticCurveTo(x, y - 14 + k * 7, x + 12, y - 8 + k * 7); ctx.arc(x + 12, y - 11 + k * 7, 3, Math.PI / 2, -Math.PI / 2, true); ctx.stroke(); } }
  else if (move === 'voice') { ctx.fillStyle = '#8ac84a'; ctx.beginPath(); ctx.arc(x, y - 2, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y + 1, 1.5, 0, TAU); ctx.fill(); FA.ring(ctx, x, y - 2, 13, 0.7, '#ffb0c8', 1.4); }
  ctx.restore();
};

/* ---------------- the pieces ---------------- */
const P = {
  // a hollow prop on a post at the letter: { pid, kind: 'block' | 'drum' | 'log' }
  prop(st, o) { st.B.spawn('foleyProp', st.x, st.gy - 1, { pid: o.pid, kind: o.kind || 'log' }); return st.x; },
  // a heap of shells whose bottom-left cell is the letter: { id, w, h, size, props: [pid], at: [[dx, dy] of the props' marks] }
  flock(st, o) {
    const B = st.B, x0 = st.x, y1 = st.gy - 1, w = o.w || 2, h = o.h || 2, id = 'foley:flock:' + (o.id || x0), cells = [];
    const skip = (o.skip || []).map(([dx, dy]) => (x0 + dx) + ',' + (y1 + dy));
    for (let y = y1 - h + 1; y <= y1; y++) for (let x = x0; x < x0 + w; x++) { if (skip.indexOf(x + ',' + y) >= 0) continue; B.set(x, y, T.HARD); B.setHide(x, y, 1); cells.push([x, y]); }
    B.locks.push({ id, tiles: cells });
    B.vkey(id, (o.at || []).map(([dx, dy]) => [x0 + dx, y1 + (dy || 0)]));
    B.spawn('foleyFlock', x0, y1, { tx: x0, ty: y1, w, h, size: o.size || 'any', props: o.props || [], lock: id, cells });
    return st.x;
  },
  // a rattling tin panel whose left end is the letter (its top row is the letter's row): { n, meet, hold, g }
  panel(st, o) {
    const B = st.B, x = st.x, row = st.gy - 1, n = o.n || 5;
    for (let c = x; c < x + n; c++) { B.set(c, row, T.EMPTY); }
    B.toggle(o.g || 0, [], [[x, row, x + n - 1, row]], { auto: true, kind: 'foleyPanel' });
    for (let c = x; c < x + n; c++) B.setHide(c, row, 1);
    B.spawn('foleyPanel', x, row, { n, meet: !!o.meet, hold: o.hold, period: o.period });
    return st.x;
  },
  // a props bank whose first prop is the letter, and its flipbook screen: { id, props, pics, sx (the screen's column,
  // relative), sh (its height), period }
  bank(st, o) {
    const B = st.B, x = st.x, F = st.gy, id = 'foley:bank:' + (o.id || x), sx = x + o.sx, sh = o.sh || 4;
    B.spawn('foleyBank', x, F - 1, { props: o.props, pics: o.pics, lock: id, scr: [sx + 0.5, F - sh - 1], period: o.period });
    B.vkey(id, [[x, F - 1]]);
    const tiles = []; for (let y = F - sh; y <= F - 1; y++) { B.set(sx, y, T.HARD); B.setHide(sx, y, 1); tiles.push([sx, y]); }
    B.locks.push({ id, tiles });
    B.spawn('foleyScreen', sx, F - 1, { lock: id, tiles, h: sh });
    return st.x;
  },
  // a cargo net with its top-left cell at the letter: { w, h, holes: [[dx, dy]] } (the engine's climbing net)
  net(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 'fn' + x0 + '_' + y0, holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'washNet', { holes, nid, pulse: true });
    B.spawn('foleyNet', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid, lift: !!o.lift });
    return st.x;
  },
  // a crab on the net it sits on: { face, ax, ay, speed, phase }
  netcrab(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'washNet' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('foleyNetCrab', x, y, { nid: z ? z.nid : null, face: o.face || 0, ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.1, phase: o.phase || 0 });
    return st.x;
  },
  // a speaking trumpet's mark at the letter: { a, g (its ears' toggle group) }
  trumpet(st, o) { const B = st.B; B.spawn('foleyTrumpet', st.x, st.gy - 1, { a: o.a }); B.switchAt(o.g != null ? o.g : 1, st.x, st.gy - 1); return st.x; },
  // a hinged ear at the letter (its hinge on the letter's floor): { face, g, land: [[dx0, dy0, dx1, dy1]] (the landing
  // it opens into, relative to the letter) }
  ear(st, o) {
    const B = st.B, x = st.x, row = st.gy - 1, g = o.g != null ? o.g : 1;
    const Bt = (o.land || []).map(r => [x + r[0], row + r[1], x + r[2], row + r[3]]);
    for (const r of Bt) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) { B.set(xx, yy, T.EMPTY); B.setHide(xx, yy, 1); }
    B.toggle(g, [], Bt, { kind: 'foleyEar' });
    B.spawn('foleyEar', x, row, { face: o.face || -1, gi: g, land: Bt });
    return st.x;
  },
  platter(st, o) { st.B.spawn('foleyPlatter', st.x, st.gy - 1, { dirn: o.dirn || '/' }); return st.x; },
  // a recording desk at the letter and its clapper gate: { id, prop, band, gx (relative), gh, spk: [dx, dy], period }
  desk(st, o) {
    const B = st.B, x = st.x, F = st.gy, id = 'foley:take:' + (o.id || x);
    B.spawn('foleyDesk', x, F - 1, { lock: id, prop: o.prop, band: o.band, period: o.period, spk: o.spk ? [x + o.spk[0] + 0.5, F - 1 + o.spk[1]] : null });
    B.vkey(id, [[x, F - 1]]);
    if (o.gx != null) { const gx = x + o.gx, gh = o.gh || 4; B.lock(gx, F - gh, F - 1, id, 'foleyClap'); B.spawns[B.spawns.length - 1].type = 'foleyClapGate'; for (let y = F - gh; y <= F - 1; y++) B.setHide(gx, y, 1); }
    return st.x;
  },
  // a noisy machine at the letter: { kind, period, on0, dur }
  machine(st, o) { st.B.spawn('foleyMachine', st.x, st.gy - 1, { kind: o.kind, period: o.period, on0: o.on0, dur: o.dur }); return st.x; },
  // a microphone's mark at the letter and its gate: { id, want, gx, gh, card: [dx, dy] }
  mic(st, o) {
    const B = st.B, x = st.x, F = st.gy, id = 'foley:mic:' + (o.id || x);
    B.spawn('foleyMic', x, F - 1, { lock: id, want: o.want, card: o.card ? [x + o.card[0] + 0.5, F - 1 + o.card[1]] : null });
    B.vkey(id, [[x, F - 1]]);
    if (o.gx != null) { const gx = x + o.gx, gh = o.gh || 4; B.lock(gx, F - gh, F - 1, id, 'foleyClap'); B.spawns[B.spawns.length - 1].type = 'foleyClapGate'; for (let y = F - gh; y <= F - 1; y++) B.setHide(gx, y, 1); }
    return st.x;
  },
  // the land's tell: a thin trickle of sand from a gap (seed odd: puffing up out of a floor gap)
  sand(st, o) { st.B.decorAt('foleySand', st.x, st.gy, o.up ? 1 : 2); return st.x; }
};
for (const k in P) Tour.pieces['foley.' + k] = P[k];
Object.assign(ENTITY_TYPES, { foleyProp: FoleyProp, foleyFlock: FoleyFlock, foleyPanel: FoleyPanel, foleyBank: FoleyBank, foleyScreen: FoleyScreen, foleyNet: FoleyNet, foleyNetCrab: FoleyNetCrab, foleyTrumpet: FoleyTrumpet, foleyEar: FoleyEar, foleyPlatter: FoleyPlatter, foleyDesk: FoleyDesk, foleyClapGate: FoleyClapGate, foleyMachine: FoleyMachine, foleyMic: FoleyMic });
Object.assign(K, { openId, isOpen, isFoley, onMark, markRing, handCue, nowCue, sayP, drawMove, drawPic, drawBankProp, puffPath, MACHINES, BANK_PROPS, PICS, FoleyProp, FoleyFlock, FoleyPanel, FoleyBank, FoleyTrumpet, FoleyEar, FoleyDesk, FoleyMic, FoleyMachine });
try { if (typeof window !== 'undefined') window.BRADY_FOLEY = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: K }; } catch (e) { /* not in a browser */ }
})();
