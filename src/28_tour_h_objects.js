/* ============================================================
   World tour: the object library (LEVEL_OVERHAUL.md §6.2).
   Every object is an entity type in ENTITY_TYPES plus a builder
   piece of the same name in Tour.pieces that places it and writes
   its validator primitive. A skin option picks a country look:
   Tour.country({ skins: { mxTrapdoor(ctx, e, t) {} } }).
   Art here is procedural with the ink outline (sprites come later).
   ============================================================ */
const TourObj = {
  // a country skin, if the level asked for one and the country drew it: true when it painted
  skin(ctx, e, name) { const f = name && TOUR_SKINS[name]; if (!f) return false; f(ctx, e, e.g ? e.g.t : 0); return true; },
  // shared palette for the library's own looks: warm wood, brass, rope and paint
  wood: ['#b8763e', '#8a5226', '#5e3417', '#e0a466'], brass: ['#f2c14e', '#c8902a', '#8a5a14', '#fff0b0'],
  plank(ctx, x, y, w, h, col) {
    const c = col || this.wood;
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c[3]); g.addColorStop(0.25, c[0]); g.addColorStop(1, c[1]);
    ctx.fillStyle = g; rr(ctx, x, y, w, h, Math.min(3, h / 3)); ctx.fill();
    ctx.strokeStyle = rgba(c[2], 0.55); ctx.lineWidth = 0.8;
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 2, y + h * k / 3); ctx.lineTo(x + w - 2, y + h * k / 3 + Math.sin(k * 7 + x) * 0.6); ctx.stroke(); }
  },
  bolt(ctx, x, y, r) { ctx.fillStyle = '#5a5866'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); ctx.fill(); },
  // a hint that something is hidden here: puffs drifting out of a crack (tell rule §3.1)
  puffs(g, x, y, col, rate) { if (g.onScreen && g.onScreen({ x: x - 20, y: y - 20, w: 40, h: 40 }, 80) && Math.random() < (rate || 0.06)) g.burst(x + (Math.random() - 0.5) * 10, y, 1, col || '#e8d8c0', 'dust'); }
};

// doors: country skins and the hidden door behind a curtain or fake wall
{
  const door0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'tourDoorHidden') {
      // a dark doorway that shows only once Brady stands in it
      ctx.save(); ctx.globalAlpha = near ? 0.95 : 0.0;
      ctx.fillStyle = '#120c18'; rr(ctx, x - 15, y - 50, 30, 50, 13); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,160,0.7)'; ctx.lineWidth = 1.5; rr(ctx, x - 15, y - 50, 30, 50, 13); ctx.stroke();
      ctx.restore(); return;
    }
    if (TOUR_SKINS[look]) { ctx.save(); TOUR_SKINS[look](ctx, { x: x - 15, y: y - 50, w: 30, h: 50, cx: x, near, door: true }, t); ctx.restore(); if (near) { ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.08 * Math.sin(t * 6)})`; rr(ctx, x - 17, y - 52, 34, 52, 10); ctx.fill(); } return; }
    if (!DoorArt.known[look]) return door0.call(this, ctx, x, y, 'tourDoor', t, near);
    return door0.call(this, ctx, x, y, look, t, near);
  };
  DoorArt.known = { door: 1, mirror: 1, locker: 1, rvdoor: 1, tourDoor: 1, tourDoor22: 1 };
}

/* the tell of a fake wall: a hairline crack and puffs of dust drifting out of it */
class TourDraft extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 3 * TS); this.x = s.x - 1.5 * TS; this.y = s.y - 3 * TS; this.look = s.look || 'fake'; this.skinName = s.skin; }
  update(dt) { this.t += dt; TourObj.puffs(this.g, this.cx + 4, this.y + this.h - 10 - Math.random() * 40, this.look === 'painted' ? '#ffffff' : '#e8dcc8', 0.05); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h;
    ctx.save(); ctx.strokeStyle = 'rgba(30,20,20,0.55)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 2, y - 92); ctx.lineTo(x + 3, y - 74); ctx.lineTo(x - 2, y - 60); ctx.lineTo(x + 4, y - 42); ctx.lineTo(x + 1, y - 26); ctx.lineTo(x + 5, y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 3, y - 74); ctx.lineTo(x + 11, y - 70); ctx.moveTo(x + 4, y - 42); ctx.lineTo(x - 7, y - 37); ctx.stroke();
    if (this.look === 'painted') { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; rr(ctx, x - 14, y - 52, 28, 52, 12); ctx.stroke(); }
    ctx.restore();
  }
}
/* a curtain in front of a hidden door: a waterfall (default), a willow, a leaf ladder; parts when Brady is inside */
class TourCurtain extends Ent {
  constructor(g, s) { super(g, s, 2.4 * TS, (s.h || 4) * TS); this.x = s.x - 1.2 * TS; this.y = s.y - this.h; this.look = s.look || 'curtain'; this.skinName = s.skin; this.part = 0; this.friendly = true; }
  update(dt) {
    this.t += dt;
    const p = this.g.player, inside = p && overlap(p, this);
    this.part = approach(this.part, inside ? 1 : 0, dt * 3);
    if (this.look === 'curtain' || this.look === 'waterfall') TourObj.puffs(this.g, this.cx + (Math.random() - 0.5) * this.w, this.y + this.h - 4, '#e8f8ff', 0.25);
  }
  touchPlayer() {}
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x0 = this.x, y0 = this.y, w = this.w, h = this.h, t = this.t, a = 1 - this.part * 0.65;
    ctx.save(); ctx.globalAlpha = a;
    if (this.look === 'willow' || this.look === 'leaves' || this.look === 'vines') {
      for (let k = 0; k < 9; k++) {
        const x = x0 + 4 + k * (w - 8) / 8, sway = Math.sin(t * 1.6 + k) * 3 * (1 + this.part * 3) * (k < 4.5 ? -1 : 1);
        ctx.strokeStyle = k % 2 ? '#3f8a3a' : '#57a84a'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway * 0.5, y0 + h * 0.5, x + sway, y0 + h - 4); ctx.stroke();
        for (let q = 0; q < 6; q++) { const yy = y0 + 8 + q * (h - 14) / 5, xx = x + sway * (q / 6); ctx.fillStyle = q % 2 ? '#7ccf5a' : '#4e9d43'; ctx.beginPath(); ctx.ellipse(xx + (q % 2 ? 3 : -3), yy, 3.4, 1.8, q % 2 ? 0.6 : -0.6, 0, TAU); ctx.fill(); }
      }
    } else {
      // a waterfall: streaks of falling water over a pale sheet, foam at the bottom and a little rainbow in the mist
      const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, 'rgba(150,215,255,0.55)'); g.addColorStop(0.5, 'rgba(225,248,255,0.8)'); g.addColorStop(1, 'rgba(150,215,255,0.55)');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 10; k++) { const x = x0 + 3 + k * (w - 6) / 9, off = ((t * 160 + k * 37) % (h + 30)) - 30; ctx.beginPath(); ctx.moveTo(x, y0 + Math.max(0, off)); ctx.lineTo(x, y0 + Math.min(h, off + 22)); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x0 + k * w / 5, y0 + h - 2 + Math.sin(t * 5 + k) * 1.5, 5 + (k % 2) * 2, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = a * 0.35; const cols = ['#ff4f6a', '#ffd84a', '#5ae07a', '#38c8ff', '#8a5aff'];
      cols.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h * 0.75, w * 0.62 - k * 2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); });
    }
    ctx.restore();
  }
}
/* a hatch in the floor. Stomp it (with a crate on it: stomp the crate first) or stand on it and press down: Brady drops
   into the area it leads to. Chili-dust puffs from its cracks are the tell. */
class TourTrapdoor extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 10); this.x = s.x - TS / 2; this.y = s.y; this.target = s.target; this.crate = !!s.crate; this.open = 0; this.skinName = s.look;
    this.portal = { target: s.target, kind: 'door' };
  }
  update(dt) {
    this.t += dt;
    if (this.opening) this.open = Math.min(1, this.open + dt * 5);
    if (this.crate) TourObj.puffs(this.g, this.cx + (Math.random() - 0.5) * this.w, this.y - 2, '#d8603a', 0.05);
    const p = this.g.player;
    if (!p || p.dead || p.state !== 'play') return;
    const on = p.onGround && p.x + p.w > this.x + 6 && p.x < this.x + this.w - 6 && Math.abs(p.y + p.h - this.y) < 4;
    if (this.crate) {
      // the crate sits on the hatch: land on it from above to smash it
      const box = { x: this.x + 6, y: this.y - 30, w: this.w - 12, h: 30 };
      if (overlap(p, box) && p.vy > 0 && p.prevBottom <= box.y + 8) {
        this.crate = false; p.vy = -PHYS.stompV; p.jumping = true;
        this.g.burst(this.cx, this.y - 14, 14, '#c8905a', 'debris'); this.g.burst(this.cx, this.y - 6, 16, '#ff5a2a', 'dust'); Sound.play('break', { vol: 0.6 });
        this.g.toast && this.g.toast('A HATCH! STAND ON IT AND PRESS DOWN');
      } else if (overlap(p, box) && p.y + p.h > box.y + 8) { if (p.cx < this.cx) p.x = Math.min(p.x, box.x - p.w); else p.x = Math.max(p.x, box.x + box.w); }
      return;
    }
    if (on && (p.inp.down || this.opening) && this.target) {
      if (!this.opening) { this.opening = true; Sound.play('door', { vol: 0.6 }); }
      if (this.open >= 1) this.g.enterPortal(this.portal);
    }
  }
  draw(ctx) {
    Ink.around(ctx, this.x, this.y - 32, this.w, 44, c => this.art(c), { pad: 8 });
  }
  art(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) { if (this.crate) this.crateArt(ctx); return; }
    const x = this.x, y = this.y, w = this.w, k = this.open;
    // the frame set into the floor, the dark hole, the two hatch leaves swinging down
    ctx.fillStyle = '#3a2416'; rr(ctx, x - 2, y - 1, w + 4, 9, 2); ctx.fill();
    ctx.fillStyle = '#0c0608'; ctx.fillRect(x + 2, y + 1, w - 4, 5);
    const leaf = (x0, dir) => { ctx.save(); ctx.translate(x0, y + 1); ctx.scale(1, Math.cos(k * Math.PI / 2)); TourObj.plank(ctx, dir > 0 ? 0 : -w / 2 + 2, -1, w / 2 - 2, 6); ctx.restore(); };
    leaf(x + 2, 1); leaf(x + w - 2, -1);
    if (k < 0.5) { ctx.fillStyle = '#6a6470'; ctx.fillRect(x + w / 2 - 6, y + 1, 12, 2); TourObj.bolt(ctx, x + 6, y + 2.5, 1.4); TourObj.bolt(ctx, x + w - 6, y + 2.5, 1.4); }
    if (this.crate) this.crateArt(ctx);
  }
  crateArt(ctx) {
    const x = this.cx - 15, y = this.y - 28;
    TourObj.plank(ctx, x, y, 30, 28);
    ctx.strokeStyle = '#5e3417'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, 26, 24);
    ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + 27, y + 25); ctx.stroke();
    // a stencilled chili on the side
    ctx.fillStyle = '#d23a2a'; ctx.beginPath(); ctx.ellipse(x + 17, y + 15, 6, 3, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a8a3a'; ctx.fillRect(x + 21, y + 9, 2.5, 3);
  }
}
Object.assign(ENTITY_TYPES, { tourDraft: TourDraft, tourCurtain: TourCurtain, trapdoor: TourTrapdoor });

/* ---------- RAIL: the cart and the lever posts at the forks ---------- */
class TourRailCart extends MovingPlatform {
  constructor(g, s) {
    super(g, Object.assign({}, s, { carrier: true }));
    this.forks = s.forks || []; this.decks = s.decks || { upper: 6, lower: 11 }; this.skinName = s.skin; this.wheel = 0;
    if (!g.railState) g.railState = {};
  }
  deckAt(px) {
    const tx = px / TS, d = this.decks;
    for (let k = 0; k < this.forks.length; k++) {
      const f = this.forks[k]; if (!this.g.railState[k] || tx < f.x0 || tx > f.x1) continue;
      const e = Math.min(tx - f.x0, f.x1 - tx, 3) / 3;
      return d.lower + (d.upper - d.lower) * easeInOut(clamp(e, 0, 1));
    }
    return d.lower;
  }
  update(dt) {
    const oy = this.y;
    super.update(dt);
    this.y = this.deckAt(this.x + this.w / 2) * TS; this.dy = this.y - oy;
    this.wheel += this.dx / 7;
    if (Math.abs(this.dy) > 0.5 && this.g.onScreen(this) && Math.random() < 0.3) this.g.burst(this.x + this.w / 2, this.y + 12, 1, '#ffd890', 'spark');
  }
  draw(ctx) {
    if (this.skinName && PlatformArt[this.skinName]) { PlatformArt[this.skinName](ctx, this, this.g.t); return; }
    Ink.around(ctx, this.x - 8, this.y - 6, this.w + 16, 36, c => this.art(c), { pad: 10 });
  }
  art(ctx) {
    const x = this.x, y = this.y, w = this.w;
    // an iron mine cart: tapered tub with riveted bands, a lantern on the front, wheels on the rail
    const g = ctx.createLinearGradient(0, y, 0, y + 24); g.addColorStop(0, '#8a8c9c'); g.addColorStop(0.5, '#5c5e70'); g.addColorStop(1, '#3a3a4c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.lineTo(x + w + 4, y - 2); ctx.lineTo(x + w - 4, y + 20); ctx.lineTo(x + 4, y + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8902a'; ctx.fillRect(x - 3, y + 2, w + 6, 3); ctx.fillRect(x, y + 12, w, 3);
    for (let k = 0; k < 6; k++) TourObj.bolt(ctx, x + 2 + k * (w - 4) / 5, y + 3.5, 1.2);
    for (const wx of [x + 10, x + w - 10]) {
      ctx.fillStyle = '#26242e'; ctx.beginPath(); ctx.arc(wx, y + 22, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9a9aa8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx + Math.cos(this.wheel) * 5, y + 22 + Math.sin(this.wheel) * 5); ctx.lineTo(wx - Math.cos(this.wheel) * 5, y + 22 - Math.sin(this.wheel) * 5); ctx.stroke();
    }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + w + 3, y + 6, 3.5, 0, TAU); ctx.fill();
    PlatformArt.deck && PlatformArt.deck(ctx, x - 2, y - 3, w + 4, '#a07a52');
  }
  get light() { return { r: 120, c: 'rgba(255,220,140,', x: this.x + this.w + 6, y: this.y + 6 }; }
}
// a lever post before a fork: touch it and press THROW (or UP) to send the cart up or down
class TourRailSwitch extends Ent {
  constructor(g, s) { super(g, s, 26, 60); this.fork = s.fork || 0; this.cool = 0; this.skinName = s.skin; this.k = 0; if (!g.railState) g.railState = {}; }
  get up() { return !!this.g.railState[this.fork]; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; this.k = approach(this.k, this.up ? 1 : 0, dt * 6); }
  touchPlayer(p) {
    if (this.cool > 0 || p.dead) return;
    if (Input.actionPressed || Input.upPressed || (p.inp && (p.inp.actionPressed))) this.flip();
    else if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 10, 'THROW: SWITCH TRACK', '#ffd84a'); }
  }
  hit(kind) { if (kind === 'plane' || kind === 'prop' || kind === 'kazoo') { this.flip(); return true; } return false; }
  flip() { this.g.railState[this.fork] = !this.up; this.cool = 0.4; TourKit.sfx('lever', 'select', { vol: 0.7 }); this.g.burst(this.cx, this.y + 10, 6, '#ffd84a', 'spark'); }
  draw(ctx) { if (TourObj.skin(ctx, this, this.skinName)) return; Ink.ent(ctx, this, c => this.art(c), { scale: 1 }); }
  art(ctx) {
    const x = this.cx, y = this.y + this.h, k = this.k;
    TourObj.plank(ctx, x - 4, y - 46, 8, 46);
    // the sign: two arrows, the live one lit
    ctx.fillStyle = '#2a2230'; rr(ctx, x - 13, y - 60, 26, 16, 4); ctx.fill();
    const arrow = (dy, on) => { ctx.fillStyle = on ? '#ffd84a' : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x - 6, y - 52 + dy * 3); ctx.lineTo(x + 6, y - 52 + dy * 3); ctx.lineTo(x, y - 52 - dy * 4); ctx.closePath(); ctx.fill(); };
    ctx.save(); ctx.translate(-5, 0); arrow(1, this.up); ctx.restore(); ctx.save(); ctx.translate(5, 0); arrow(-1, !this.up); ctx.restore();
    // the lever arm swings between down and up
    const a = -0.9 + k * 1.8;
    ctx.save(); ctx.translate(x, y - 24); ctx.rotate(a);
    ctx.fillStyle = '#c8902a'; rr(ctx, -2, -20, 4, 20, 2); ctx.fill(); ctx.fillStyle = '#e84a3a'; ctx.beginPath(); ctx.arc(0, -21, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
    TourObj.bolt(ctx, x, y - 24, 2.4);
  }
}
Object.assign(ENTITY_TYPES, { railCart: TourRailCart, railSwitch: TourRailSwitch });
// the track itself: sleepers and two rails on the lower deck, the upper branch at every fork, trestles down to the ground
class TourRailTrack extends Ent {
  constructor(g, s) { super(g, s, (s.len || 100) * TS, 8); this.x = 0; this.y = (s.decks.upper - 1) * TS; this.h = (g.area ? 0 : 0) + 12 * TS; this.len = s.len; this.forks = s.forks || []; this.decks = s.decks; this.skinName = s.skin; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const g = this.g, x0 = Math.max(0, Math.floor(g.camX / TS) - 2), x1 = Math.min(this.len, Math.ceil((g.camX + Game.viewW) / TS) + 2), d = this.decks;
    const lay = (tx, row) => {
      const x = tx * TS, y = row * TS;
      // a trestle every 4 tiles, down below the view
      if (tx % 4 === 0) { ctx.fillStyle = '#5e3417'; ctx.fillRect(x + 12, y + 8, 6, Game.viewH); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 16, y + 8, 2, Game.viewH); ctx.strokeStyle = '#5e3417'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 15, y + 40); ctx.lineTo(x + 15 + 32, y + 8); ctx.stroke(); }
      TourObj.plank(ctx, x + 2, y + 8, 26, 6);
    };
    const rails = (pts) => { for (const [dy, col, w] of [[9, '#2c2a36', 4], [8, '#b8b8c8', 2]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py + dy - 8) : ctx.moveTo(px, py + dy - 8)); ctx.stroke(); } };
    ctx.save();
    for (let tx = x0; tx < x1; tx++) lay(tx, d.lower);
    rails([[x0 * TS, d.lower * TS + 8], [x1 * TS, d.lower * TS + 8]]);
    for (const f of this.forks) {
      if (f.x1 < x0 || f.x0 > x1) continue;
      const pts = [];
      for (let tx = f.x0; tx <= f.x1; tx++) { const k = Math.min(tx - f.x0, f.x1 - tx, 3) / 3, row = d.lower + (d.upper - d.lower) * easeInOut(clamp(k, 0, 1)); if (tx >= x0 - 1 && tx <= x1) lay(tx, row); pts.push([tx * TS + TS / 2, row * TS + 8]); }
      rails(pts);
    }
    ctx.restore();
  }
}
ENTITY_TYPES.railTrack = TourRailTrack;

/* ======================= the object library, batch A ======================= */
// runtime toggle groups (§6.1): Play keeps one bit per group; flipping swaps the A and B tile rects and the zones tied to it
Object.assign(Play.prototype, {
  toggleBit(gi) { return !!(this.area.toggleState && this.area.toggleState[gi]); },
  flipToggle(gi, quiet) {
    const A = this.area, G = A.toggles && A.toggles[gi]; if (!G) return;
    A.toggleState = A.toggleState || {};
    const on = !A.toggleState[gi]; A.toggleState[gi] = on;
    if (G.kind === 'water' || G.kind === 'tide') { A.waterTarget = (on ? G.high : G.low) * TS; if (A.waterTop == null) A.waterTop = G.low * TS; }
    else {
      const setRect = (r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) this.setTile(x, y, t); };
      for (const r of G.A) setRect(r, on ? T.EMPTY : (r[4] != null ? r[4] : T.HARD));
      for (const r of G.B) setRect(r, on ? (r[4] != null ? r[4] : T.HARD) : T.EMPTY);
    }
    for (const z of A.zones) if (z.g === gi) z.off = !(on === (z.gOn !== false));
    if (G.kind === 'phase' && A.phase) this.setPhase(on);
    for (const e of this.entities) if (e.onToggle) e.onToggle(gi, on);
    if (!quiet) { TourKit.sfx('switch', 'select', { vol: 0.7 }); this.shake(1.5); }
  },
  // PHASE: the whole area swaps to its night theme and back (enemies hear onPhase)
  setPhase(night) {
    const A = this.area, ph = A.phase; if (!ph) return;
    A.night = night; const key = night ? ph.night : (ph.day || A.dayTheme || A.theme);
    if (!A.dayTheme) A.dayTheme = A.theme;
    if (THEMES[key]) { this.themeKey = key; A.theme = key; this.weather = new Weather(THEMES[key].particles); this.weather.reset(this.camX, this.camY, Game.viewW, Game.viewH); }
    this.flash = Math.max(this.flash || 0, 0.5);
    for (const e of this.entities) { if (e.cfg && e.cfg.onPhase) e.cfg.onPhase(e, night); else if (e.onPhase) e.onPhase(night); }
  }
});
{
  const mk = Play.prototype.makeRuntimeArea;
  Play.prototype.makeRuntimeArea = function (idx) {
    const a = mk.call(this, idx);
    a.toggleState = {};
    for (const z of a.zones) if (z.g != null) z.off = z.gOn === false ? false : true;
    for (const gi in a.toggles || {}) { const G = a.toggles[gi]; if ((G.kind === 'water') && G.low != null && a.waterTop == null) a.waterTop = G.low * TS; }
    if (a.phase && a.phase.start === 'night') { this.area = a; this.setPhase(true); }
    return a;
  };
  // the water line glides to its new level after a valve turns
  const up = Play.prototype.update;
  Play.prototype.update = function (dt) { const A = this.area; if (A && A.waterTarget != null && A.waterTop != null && A.waterTop !== A.waterTarget) A.waterTop = approach(A.waterTop, A.waterTarget, 2.5 * TS * dt); return up.call(this, dt); };
}
// country looks on the engine gimmicks: a 'look' that names a skin draws it instead of the default art
for (const C of [Geyser, Pancake, Bubbler, Barrel, Laser, Sweeper, Subwoofer, Horn, PoiRing, Dropper, Banner, DiscoBall, JellyPad]) {
  const d0 = C.prototype.draw;
  C.prototype.draw = function (ctx) { const L = this.s && this.s.look; if (L && TOUR_SKINS[L]) { TOUR_SKINS[L](ctx, this, this.g.t); return; } return d0.call(this, ctx); };
}

/* ---- 2. lever: pull it (touch + THROW) or hit it with a plane, tomato or ball: lock `opens` opens for good ---- */
class TourLever extends Ent {
  constructor(g, s) { super(g, s, 24, 40); this.opens = s.opens || 'lever'; this.skinName = s.look; this.pulled = false; this.k = 0; this.lever = true; this.timed = s.timed || 0; this.timer = 0; }
  update(dt) {
    this.t += dt; this.k = approach(this.k, this.pulled ? 1 : 0, dt * 5);
    if (this.timer > 0) { this.timer -= dt; if (Math.floor((this.timer + dt) * 2) !== Math.floor(this.timer * 2) && this.g.onScreen(this, 200)) TourKit.sfx('tick', 'select', { vol: 0.35, pitch: 1.8 }); if (this.timer <= 0) { this.pulled = false; TourLock.shut(this.g, this.opens); } }
  }
  touchPlayer(p) { if (this.pulled && !this.timed) return; if (Input.actionPressed || (p.inp && p.inp.actionPressed) || Input.upPressed) this.pull(); else if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 8, 'THROW: PULL', '#ffd84a'); } }
  hit(kind) { if (kind === 'plane' || kind === 'prop' || kind === 'tomato' || kind === 'ball' || kind === 'disc') { this.pull(); return true; } return false; }
  pull() {
    if (this.pulled && !this.timed) return;
    this.pulled = true; if (this.timed) this.timer = this.timed;
    TourKit.sfx('lever', 'select', { vol: 0.8 }); this.g.burst(this.cx, this.y + 8, 8, '#ffd84a', 'spark');
    TourLock.open(this.g, this.opens);
  }
  draw(ctx) { if (TourObj.skin(ctx, this, this.skinName)) return; Ink.ent(ctx, this, c => this.art(c), { scale: 1 }); }
  art(ctx) {
    const x = this.cx, y = this.y + this.h, k = this.k;
    // a stone base with a brass lever in a slot; the knob is red, the slot glows when pulled
    ctx.fillStyle = '#6a6470'; rr(ctx, x - 11, y - 12, 22, 12, 3); ctx.fill(); ctx.fillStyle = '#8a8490'; ctx.fillRect(x - 11, y - 12, 22, 3);
    ctx.fillStyle = k > 0.5 ? '#ffd84a' : '#2a2430'; rr(ctx, x - 7, y - 11, 14, 4, 2); ctx.fill();
    ctx.save(); ctx.translate(x, y - 9); ctx.rotate(-0.8 + k * 1.6);
    ctx.fillStyle = '#c8902a'; rr(ctx, -2, -26, 4, 26, 2); ctx.fill(); ctx.fillStyle = '#e83a3a'; ctx.beginPath(); ctx.arc(0, -27, 5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-1.5, -28.5, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    if (this.timer > 0) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, this.y - 10, 7, -Math.PI / 2, -Math.PI / 2 + TAU * this.timer / this.timed); ctx.stroke(); }
  }
}
// locks opened by levers, plates and timers (the existing Lock entity draws them; this opens/shuts its tiles)
const TourLock = {
  open(g, id) { g.keys.add(id); for (const e of g.entities) if (e instanceof Lock && e.id === id && !e.open) { e.open = true; e.openT = 0; for (const [x, y] of e.tiles) g.setTile(x, y, T.EMPTY); g.burst(e.cx, e.cy, 14, '#ffd84a', 'confetti'); } for (const e of g.entities) if (e.shutter && e.id === id) e.setOpen(true); },
  shut(g, id) { g.keys.delete(id); for (const e of g.entities) if (e.shutter && e.id === id) e.setOpen(false); }
};
// a shutter: a lock that can close again (timed doors, plates); drawn as a slatted roller door
class TourShutter extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 3) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id; this.open = false; this.k = 0; this.shutter = true; this.skinName = s.look;
    this.tiles = []; for (let i = 0; i < (s.h || 3); i++) this.tiles.push([Math.floor(s.x / TS), Math.floor(s.y / TS) - 1 - i]);
  }
  setOpen(o) {
    if (o === this.open) return; this.open = o;
    if (!o && overlap(this.g.player, this)) { this.pending = true; return; }
    for (const [x, y] of this.tiles) this.g.setTile(x, y, o ? T.EMPTY : T.HARD);
    TourKit.sfx(o ? 'door' : 'bump', 'select', { vol: 0.5 });
  }
  update(dt) { this.t += dt; this.k = approach(this.k, this.open ? 1 : 0, dt * 4); if (this.pending && !overlap(this.g.player, this)) { this.pending = false; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.HARD); } }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.x, y = this.y, h = this.h * (1 - this.k * 0.9);
    ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 2, y - 6, this.w + 4, 6);
    for (let yy = 0; yy < h; yy += 6) { ctx.fillStyle = yy % 12 ? '#9aa0b0' : '#7a8090'; ctx.fillRect(x + 1, y + yy, this.w - 2, Math.min(6, h - yy)); }
    ctx.fillStyle = '#ffd84a'; if (h > 10) ctx.fillRect(x + this.w / 2 - 4, y + h - 5, 8, 3);
  }
}
Object.assign(ENTITY_TYPES, { lever: TourLever, shutter: TourShutter });
// the validator sees a shutter as a lock with its id (closed until the key / vkey is held)
function tourShutterLock(B, tx, ty0, ty1, id, look) { const tiles = []; for (let y = ty0; y <= ty1; y++) { B.set(tx, y, T.HARD); B.setHide(tx, y, 1); tiles.push([tx, y]); } B.locks.push({ id, tiles }); B.spawn('shutter', tx, ty1, { id, h: ty1 - ty0 + 1, look: look || null }); }

/* ---- 7. catapult: stand in the cup and press THROW (or land on it hard): a launch to the target ---- */
class TourCatapult extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 22); this.x = s.x - TS / 2; this.y = s.y - 22; this.to = s.to || [10, -2]; this.skinName = s.skin; this.k = 0; this.cool = 0; this.solidTop = true; this.isPlatform = true; this.dx = 0; this.dy = 0; }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; this.k = approach(this.k, 0, dt * 2.5);
    const p = this.g.player; if (!p || p.dead) return;
    if (p.ride === this && this.cool <= 0 && (Input.actionPressed || (p.inp && p.inp.actionPressed) || this.slam)) this.launch(p);
    this.slam = false;
  }
  touchPlayer(p) { if (p.vy > 9 * TS && p.y + p.h <= this.y + 10) this.slam = true; else if (!this.told && p.ride === this) { this.told = true; this.g.parts.text(this.cx, this.y - 20, 'THROW: LAUNCH!', '#ffd84a'); } }
  launch(p) {
    // a ballistic arc to the landing tile: horizontal speed from the time of flight
    const tx = this.s.x / TS - 0.5 + this.to[0] + 0.5, ty = this.s.y / TS + this.to[1];
    const dxp = (tx - (p.cx / TS)) * TS, apex = Math.max(2, -this.to[1] + 3) * TS, g = PHYS.gDown;
    const vy = -Math.sqrt(2 * g * apex), tUp = -vy / g, fall = apex + (ty * TS - (p.y + p.h)), tDown = Math.sqrt(2 * Math.max(TS, fall) / g);
    p.vy = vy; p.vx = 0; p.carryVx = dxp / (tUp + tDown); p.onGround = false; p.jumping = false; p.ride = null; p.y -= 2;
    this.k = 1; this.cool = 1; this.g.shake(3); TourKit.sfx('catapult', 'spring', { vol: 0.8, pitch: 0.8 }); this.g.burst(this.cx, this.y, 12, '#ffffff', 'dust');
  }
  draw(ctx) { if (TourObj.skin(ctx, this, this.skinName)) return; Ink.around(ctx, this.x - 10, this.y - 50, this.w + 20, 72, c => this.art(c), { pad: 8 }); }
  art(ctx) {
    const x = this.cx, y = this.y + this.h, k = this.k;
    // a wooden throwing arm on a frame, a basket cup; the arm snaps up on launch
    ctx.fillStyle = '#6a3e1c'; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 6, y - 18); ctx.lineTo(x + 6, y - 18); ctx.lineTo(x + 30, y); ctx.closePath(); ctx.fill();
    TourObj.plank(ctx, x - 30, y - 6, 60, 6);
    ctx.save(); ctx.translate(x, y - 16); ctx.rotate(-0.15 - k * 1.1);
    TourObj.plank(ctx, -34, -4, 44, 7);
    ctx.fillStyle = '#c8955a'; ctx.beginPath(); ctx.ellipse(-30, -6, 13, 6, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-30, -6, 13, 6, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
    TourObj.bolt(ctx, x, y - 16, 3);
  }
}
/* ---- 16. ring: jump into it to hang; it swings; jump to let go with the swing's momentum ---- */
class TourRing extends Ent {
  constructor(g, s) { super(g, s, 24, 24); this.ax = s.x; this.ay = s.y - (s.len || 3) * TS - TS; this.len = (s.len || 3) * TS; this.amp = s.amp || 0.7; this.period = 1.6; this.skinName = s.skin; this.ph = s.phase || 0; this.place(); this.cool = 0; }
  place() { const a = this.amp * Math.sin((this.t + this.ph) * TAU / this.period); this.th = a; this.hx = this.ax + Math.sin(a) * this.len; this.hy = this.ay + Math.cos(a) * this.len; this.x = this.hx - 12; this.y = this.hy - 12; this.av = this.amp * TAU / this.period * Math.cos((this.t + this.ph) * TAU / this.period); }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; this.place();
    const p = this.g.player; if (!p) return;
    if (p.ringed === this) {
      if (p.dead || p.state !== 'play') { p.ringed = null; return; }
      p.x = this.hx - p.w / 2; p.y = this.hy + 6; p.vx = 0; p.vy = 0; p.onGround = false;
      if (p.inp.jumpPressed || Input.jumpPressed) { p.ringed = null; this.cool = 0.35; const tv = this.av * this.len; p.vx = Math.cos(this.th) * tv * 1.1; p.vy = -PHYS.jumpV * 0.85 + Math.sin(this.th) * tv * 0.4; p.jumping = true; p.carryVx = p.vx; Sound.play('jump'); }
    }
  }
  touchPlayer(p) { if (p.ringed || this.cool > 0 || p.onGround || p.dead) return; p.ringed = this; p.spin = false; TourKit.sfx('grab', 'pick', { pitch: 0.7, vol: 0.5 }); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    ctx.save(); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(this.ax, this.ay); ctx.lineTo(this.hx, this.hy - 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(this.ax + 1, this.ay); ctx.lineTo(this.hx + 1, this.hy - 10); ctx.stroke();
    TourObj.bolt(ctx, this.ax, this.ay, 3.5);
    Ink.around(ctx, this.hx - 12, this.hy - 12, 24, 24, c => { c.strokeStyle = '#d8a030'; c.lineWidth = 4; c.beginPath(); c.arc(this.hx, this.hy, 9, 0, TAU); c.stroke(); c.strokeStyle = '#fff0b0'; c.lineWidth = 1.2; c.beginPath(); c.arc(this.hx, this.hy, 9, -2.6, -1.2); c.stroke(); }, { pad: 6 });
    ctx.restore();
  }
}
// a hanging Brady swings with the ring (Player.update skips physics while ringed)
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    if (this.ringed && this.state === 'play' && !this.dead) { this.inp = inp; this.anim.t += dt; this.anim.state = 'hang'; this.updateHair(dt); if (inp.jumpPressed) { const r = this.ringed; r.update(0); } return; }
    return pu.call(this, dt, inp);
  };
}
/* ---- 6. zip line: jump into the handle; ride down the cable at 9 t/s; jump to let go ---- */
class TourZip extends Ent {
  constructor(g, s) { super(g, s, 20, 20); this.x0 = s.x; this.y0 = s.y - 4 * TS; this.x1 = s.x + (s.dx || 12) * TS; this.y1 = this.y0 + (s.dy || 4) * TS; this.u = 0; this.riding = false; this.skinName = s.skin; this.cool = 0; this.place(); }
  place() { this.hx = lerp(this.x0, this.x1, this.u); this.hy = lerp(this.y0, this.y1, this.u); this.x = this.hx - 10; this.y = this.hy; }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; const p = this.g.player;
    const L = Math.hypot(this.x1 - this.x0, this.y1 - this.y0);
    if (this.riding && p && !p.dead) {
      this.u = Math.min(1, this.u + 9 * TS * dt / L); this.place();
      p.x = this.hx - p.w / 2; p.y = this.hy + 18; p.vx = 0; p.vy = 0; p.onGround = false;
      if (Math.random() < 0.4) this.g.burst(this.hx, this.hy, 1, '#ffd890', 'spark');
      if (p.inp.jumpPressed || this.u >= 1) { this.riding = false; p.zipping = null; p.vx = (this.x1 - this.x0) / L * 7 * TS; p.vy = this.u >= 1 ? 0 : -PHYS.jumpV * 0.6; p.carryVx = p.vx; this.cool = 1; }
    } else if (!this.riding && this.u > 0) { this.u = Math.max(0, this.u - dt * 0.6); this.place(); }
  }
  touchPlayer(p) { if (this.riding || this.cool > 0 || p.onGround || this.u > 0.05) return; this.riding = true; p.zipping = this; TourKit.sfx('zip', 'pick', { pitch: 0.6 }); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    ctx.save();
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(this.x0, this.y0); ctx.lineTo(this.x1, this.y1); ctx.stroke();
    for (const [px, py] of [[this.x0, this.y0], [this.x1, this.y1]]) { TourObj.plank(ctx, px - 4, py - 6, 8, 4 * TS + 6); TourObj.bolt(ctx, px, py, 3); }
    Ink.around(ctx, this.hx - 12, this.hy - 4, 24, 26, c => { c.strokeStyle = '#c8902a'; c.lineWidth = 3; c.beginPath(); c.moveTo(this.hx, this.hy); c.lineTo(this.hx, this.hy + 12); c.stroke(); c.fillStyle = '#e83a3a'; rr(c, this.hx - 10, this.hy + 11, 20, 6, 3); c.fill(); c.fillStyle = '#5a5866'; c.beginPath(); c.arc(this.hx, this.hy, 4, 0, TAU); c.fill(); }, { pad: 6 });
    ctx.restore();
  }
}
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    if (this.zipping && this.state === 'play' && !this.dead) { this.inp = inp; this.anim.t += dt; this.anim.state = 'hang'; this.updateHair(dt); return; }
    return pu.call(this, dt, inp);
  };
}
/* ---- 11. fan: an updraft column with a spinning fan; with g it belongs to a toggle group ---- */
class TourFan extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, 16); this.x = s.x - TS / 2; this.y = s.y - 16; this.g0 = s.g; this.skinName = s.skin; this.spin = 0; }
  get on() { return this.g0 == null || this.g.toggleBit(this.g0) === (this.s.gOn !== false); }
  update(dt) { this.t += dt; this.spin += dt * (this.on ? 18 : 1.5); if (this.on && this.g.onScreen(this, 100) && Math.random() < 0.5) this.g.burst(this.x + Math.random() * this.w, this.y - 4, 1, '#ffffff', 'dust'); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h;
    ctx.save(); ctx.fillStyle = '#4a4654'; rr(ctx, this.x, y - 12, this.w, 12, 3); ctx.fill();
    ctx.fillStyle = '#2a2632'; ctx.fillRect(this.x + 4, y - 10, this.w - 8, 4);
    for (let k = 0; k < 3; k++) { const a = this.spin + k * TAU / 3; ctx.fillStyle = '#b8b8c8'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 10, y - 8, Math.abs(Math.cos(a)) * 9 + 2, 2.5, 0, 0, TAU); ctx.fill(); }
    if (this.on) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const yy = y - 16 - ((this.t * 120 + k * 30) % 120); ctx.beginPath(); ctx.moveTo(this.x + 6 + k * (this.w - 12) / 3, yy); ctx.lineTo(this.x + 6 + k * (this.w - 12) / 3, yy - 12); ctx.stroke(); } }
    ctx.restore();
  }
}
/* ---- 3. toggle switch: a wheel, brake, lantern or chime that flips a toggle group ---- */
class TourToggleSwitch extends Ent {
  constructor(g, s) { super(g, s, 28, 40); this.gi = s.g || 0; this.kind = s.kind || 'switch'; this.skinName = s.look; this.cool = 0; this.spinA = 0; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; const target = this.g.toggleBit(this.gi) ? Math.PI : 0; this.spinA = approach(this.spinA, target, dt * 6); }
  touchPlayer(p) { if (this.cool > 0) return; if (Input.actionPressed || (p.inp && p.inp.actionPressed) || Input.upPressed) { this.cool = 0.5; this.g.flipToggle(this.gi); } else if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 10, 'THROW: TURN', '#ffd84a'); } }
  hit(kind) { if ((kind === 'plane' || kind === 'kazoo') && this.cool <= 0) { this.cool = 0.5; this.g.flipToggle(this.gi); return true; } return false; }
  ring() { if (this.kind === 'phase' && this.cool <= 0) { this.cool = 0.5; this.g.flipToggle(this.gi); } }
  draw(ctx) { if (TourObj.skin(ctx, this, this.skinName)) return; Ink.ent(ctx, this, c => this.art(c), { scale: 1 }); }
  art(ctx) {
    const x = this.cx, y = this.y + this.h, on = this.g.toggleBit(this.gi);
    TourObj.plank(ctx, x - 3, y - 24, 6, 24);
    if (this.kind === 'phase') {
      // a sun-moon lantern: the sun side by day, the moon side by night
      ctx.save(); ctx.translate(x, y - 32); ctx.scale(Math.cos(this.spinA), 1);
      ctx.fillStyle = on ? '#3a3a7a' : '#ffd84a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = on ? '#fff6d0' : '#ff9a2a'; if (on) { ctx.beginPath(); ctx.arc(2, -1, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a7a'; ctx.beginPath(); ctx.arc(5, -3, 5, 0, TAU); ctx.fill(); } else { for (let k = 0; k < 8; k++) { const a = k * TAU / 8; ctx.fillRect(Math.cos(a) * 12 - 1.5, Math.sin(a) * 12 - 1.5, 3, 3); } }
      ctx.restore(); return;
    }
    // a valve wheel: six spokes, turns half a turn per flip
    ctx.save(); ctx.translate(x, y - 30); ctx.rotate(this.spinA);
    ctx.strokeStyle = '#c8323a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.2; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.stroke(); }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// the A/B tiles of a toggle group, drawn as real objects: a sluice gate of planks (raised / lowered), never coloured blocks
class TourToggleGate extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.gi = s.g || 0; this.rect = s.rect; this.state = s.state; this.skinName = s.look; this.k = 0; this.back = true; this.x = s.rect[0] * TS; this.y = s.rect[1] * TS; this.w = (s.rect[2] - s.rect[0] + 1) * TS; this.h = (s.rect[3] - s.rect[1] + 1) * TS; }
  get solid() { return this.g.toggleBit(this.gi) === (this.state === 'B'); }
  update(dt) { this.t += dt; this.k = approach(this.k, this.solid ? 1 : 0, dt * 5); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.x, y = this.y, w = this.w, h = this.h, k = this.k;
    if (k < 0.02) { ctx.fillStyle = 'rgba(40,30,20,0.35)'; for (let xx = x; xx < x + w; xx += TS) ctx.fillRect(xx + 2, y - 4, TS - 4, 4); return; }
    // planks slide in from above (a lowered gate when solid)
    const hh = h * k;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y - 2, w + 4, h + 4); ctx.clip();
    for (let yy = y + h - hh; yy < y + h; yy += 10) TourObj.plank(ctx, x, yy, w, Math.min(10, y + h - yy));
    ctx.fillStyle = '#4a4654'; for (let xx = x + 6; xx < x + w; xx += 26) ctx.fillRect(xx, y + h - hh, 4, hh);
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { catapult: TourCatapult, ring: TourRing, zipLine: TourZip, fan: TourFan, toggleSwitch: TourToggleSwitch, toggleGate: TourToggleGate });

/* ---- 13. breakwall: a wall of the country's material, broken by the right ability ---- */
class TourBreakWall extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 3) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.needs = s.needs || 'hat'; this.skinName = s.skin; this.breakWall = true; this.id = s.id; this.glass = this.needs === 'kazoo';   // the kazoo's honk only rings bells and glass
    this.tiles = []; for (let i = 0; i < (s.h || 3); i++) this.tiles.push([Math.floor(s.x / TS), Math.floor(s.y / TS) - 1 - i]);
  }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p || this.remove) return;
    // big Brady shoulders through a 'big' wall; a running Brady near it with fire breath etc. is handled by hit()
    if (this.needs === 'big' && p.power > 0 && Math.abs(p.vx) > PHYS.walk * 0.9 && overlap({ x: this.x - 3, y: this.y, w: this.w + 6, h: this.h }, p)) this.smash();
    if (this.needs === 'hat' && p.hands && p.hands.id === 'hat' && p.bonks && p.bonks.some(b => this.tiles.some(t => t[0] === b.tx && t[1] === b.ty))) this.smash();
  }
  hit(kind, src) {
    const ok = { hat: ['hatdash'], big: ['star'], fire: ['fire', 'piri'], ball: ['prop', 'ball'], kazoo: ['kazoo'], tomato: ['tomato'], sig: ['sig', 'fire', 'tomato', 'prop', 'ball'] }[this.needs] || [];
    if (ok.includes(kind)) { this.smash(); return true; } return false;
  }
  smash() {
    if (this.remove) return; this.remove = true;
    for (const [x, y] of this.tiles) { this.g.setTile(x, y, T.EMPTY); this.g.burst(x * TS + 16, y * TS + 16, 8, this.needs === 'kazoo' ? '#c8f0ff' : '#c8a070', 'debris'); }
    Sound.play('break'); this.g.shake(4); this.g.keys.add('wall:' + this.id);
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.x, y = this.y, w = this.w, h = this.h, n = this.needs;
    ctx.save();
    if (n === 'kazoo') { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(180,230,255,0.75)'); g.addColorStop(0.5, 'rgba(240,252,255,0.9)'); g.addColorStop(1, 'rgba(160,210,255,0.75)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 12, y + h * 0.4); ctx.lineTo(x + 8, y + h * 0.7); ctx.stroke(); }
    else if (n === 'fire') { ctx.fillStyle = '#4a7a2a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#2a4a1a'; ctx.lineWidth = 2; for (let k = 0; k < h / 8; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * 8 + 4); ctx.lineTo(x + w, y + k * 8); ctx.stroke(); } ctx.fillStyle = '#c8e070'; for (let k = 0; k < h / 10; k++) { ctx.beginPath(); ctx.moveTo(x - 3, y + k * 10 + 5); ctx.lineTo(x + 3, y + k * 10 + 3); ctx.lineTo(x + 3, y + k * 10 + 7); ctx.fill(); } }
    else { // a stack of crates / rubble with cracks, the 'needs' sign stencilled on
      for (let yy = y; yy < y + h; yy += TS) { TourObj.plank(ctx, x + 1, yy + 1, w - 2, TS - 2, ['#a08060', '#7a5a40', '#4a3020', '#c8a880']); ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 3, yy + 3, w - 6, TS - 6); }
      ctx.strokeStyle = 'rgba(30,15,5,0.7)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x + 8, y + 4); ctx.lineTo(x + 16, y + h * 0.35); ctx.lineTo(x + 10, y + h * 0.6); ctx.lineTo(x + 20, y + h - 4); ctx.stroke();
      const G = TourGear.get(n); if (G) { ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(x + w / 2, y + h / 2); ctx.scale(0.55, 0.55); G.icon(ctx, 0, 0, this.t); ctx.restore(); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.breakWall = TourBreakWall;
/* ---- 10. teleport pair: two magic doorways; enter one, come out of the other ---- */
const TourTeleportArt = (ctx, x, y, t, near, col) => {
  ctx.save();
  ctx.fillStyle = '#2a2236'; rr(ctx, x - 17, y - 54, 34, 54, 16); ctx.fill();
  const g = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 20); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(40,20,80,0.9)');
  ctx.fillStyle = g; rr(ctx, x - 13, y - 50, 26, 48, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x, y - 26, 6 + k * 4, t * (2 + k) + k, t * (2 + k) + k + 2.2); ctx.stroke(); }
  ctx.fillStyle = '#d8a030'; ctx.fillRect(x - 17, y - 4, 34, 4);
  if (near) { ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(t * 8)})`; rr(ctx, x - 17, y - 54, 34, 54, 16); ctx.fill(); }
  ctx.restore();
};
TOUR_SKINS.tourTeleport = (ctx, e, t) => TourTeleportArt(ctx, e.cx, e.y + e.h, t, e.near, '#a88aff');
class TourTeleport extends Portal {
  constructor(g, s) { super(g, Object.assign({}, s, { kind: 'door', look: s.look || 'tourTeleport' })); }
}
ENTITY_TYPES.teleport = TourTeleport;

/* ---------- batch A pieces (each writes its validator primitive) ---------- */
const TOUR_BREAK_KEY = { hat: 'gear:hat', big: 'big', fire: 'sig', tomato: 'sig', sig: 'sig', ball: 'ball', kazoo: 'gear:kazoo' };
Object.assign(Tour.pieces, {
  // 1. a key and its lock: { id, keyAt: 3, lockAt: 9, h: 3 }
  keyLock(st, o) {
    const x = st.x, id = o.id || 'k' + x, ka = o.keyAt != null ? o.keyAt : 3, la = o.lockAt != null ? o.lockAt : 9, h = o.h || 3;
    st.floor(x, x + la + 2);
    st.B.spawn('key', x + ka, st.gy - 2, { id });
    st.B.lock(x + la, st.gy - h, st.gy - 1, id, o.look || 'door');
    if (o.roof !== false) st.B.fill(x + la, Math.max(0, st.gy - h - 6), x + la, st.gy - h - 1, T.HARD);
    return x + la + 3;
  },
  // 2. a lever that opens lock `opens` for good: { opens, look, lockAt (a shutter this many tiles on), h }
  lever(st, o) {
    const x = st.x, id = o.opens || 'lever' + x;
    st.floor(x, x + 2);
    st.B.spawn('lever', x + 1, st.gy - 1, { opens: id, look: o.look || null });
    st.B.vkey(id, [[x + 1, st.gy - 1]]);
    if (o.lockAt != null) { const lx = x + o.lockAt, h = o.h || 3; st.floor(x, lx + 1); tourShutterLock(st.B, lx, st.gy - h, st.gy - 1, id, o.lockLook); st.B.fill(lx, Math.max(0, st.gy - h - 6), lx, st.gy - h - 1, T.HARD); return lx + 2; }
    return x + 3;
  },
  // 5. a lever that opens a shutter for t seconds: { lever: dx, door: dx, t }
  timedDoor(st, o) {
    const x = st.x, id = o.id || 'timed' + x, lx = x + (o.lever != null ? o.lever : 1), dx = x + (o.door != null ? o.door : 8), t = o.t || 6, h = o.h || 3;
    st.floor(x, dx + 2);
    st.B.spawn('lever', lx, st.gy - 1, { opens: id, timed: t, look: o.look || null });
    st.B.vkey(id, [[lx, st.gy - 1]]);
    tourShutterLock(st.B, dx, st.gy - h, st.gy - 1, id, o.doorLook);
    st.B.fill(dx, Math.max(0, st.gy - h - 6), dx, st.gy - h - 1, T.HARD);
    if ((dx - lx) / (6.2 * 0.7) >= t && st.ctx.problems) st.ctx.problems.push(`timedDoor at ${x}: ${dx - lx} tiles can't be run in ${t} s`);
    return dx + 3;
  },
  // 3. a toggle group: { g, kind, A: [[dx0, dy0, dx1, dy1]], B: [...] } (rects relative to the cursor and the ground row),
  //    or the shortcuts { bridge: n } (a pit bridged in state B) and { wall: h } (a gate that opens in state B)
  toggle(st, o) {
    const B = st.B, x = st.x, g = o.g || 0, kind = o.kind || 'switch';
    let A = (o.A || []).map(r => [x + r[0], st.gy + r[1], x + r[2], st.gy + r[3], r[4]]), Bt = (o.B || []).map(r => [x + r[0], st.gy + r[1], x + r[2], st.gy + r[3], r[4]]), end = x + (o.n || 3);
    st.floor(x, x + 2);
    if (o.bridge) { const n = o.bridge; st.pit(x + 3, x + 2 + n); Bt.push([x + 3, st.gy, x + 2 + n, st.gy]); st.floor(x + 3 + n, x + 5 + n); end = x + 6 + n; }
    if (o.wall) { const h = o.wall; st.floor(x + 3, x + 6); A.push([x + 4, st.gy - h, x + 4, st.gy - 1]); B.fill(x + 4, Math.max(0, st.gy - h - 6), x + 4, st.gy - h - 1, T.HARD); end = x + 7; }
    for (const r of A) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) { B.set(xx, yy, r[4] != null ? r[4] : T.HARD); B.setHide(xx, yy, 1); }
    for (const r of Bt) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) B.set(xx, yy, T.EMPTY);
    B.toggle(g, A, Bt, { kind });
    B.switchAt(g, x + 1, st.gy - 1);
    B.spawn('toggleSwitch', x + 1, st.gy - 1, { g, kind, look: o.look || null });
    for (const r of A) B.spawn('toggleGate', r[0], r[1], { g, rect: r, state: 'A', look: o.gateLook || null });
    for (const r of Bt) B.spawn('toggleGate', r[0], r[1], { g, rect: r, state: 'B', look: o.gateLook || null });
    return end;
  },
  // 15. a valve wheel that moves the water line between two rows: { g, low, high }
  valve(st, o) {
    const B = st.B, x = st.x, g = o.g != null ? o.g : 1;
    st.floor(x, x + 2);
    B.toggle(g, [], [], { kind: 'water', low: o.low, high: o.high });
    B.switchAt(g, x + 1, st.gy - 1);
    B.spawn('toggleSwitch', x + 1, st.gy - 1, { g, kind: 'valve', look: o.look || null });
    return x + 3;
  },
  // 4. a pressure plate held down by a crate: { opens, crateDx (crate start, relative), lockAt, h }
  plate(st, o) {
    const B = st.B, x = st.x, id = o.opens || 'plate' + x, cdx = o.crateDx != null ? o.crateDx : -4;
    const px = x + Math.max(1, -cdx + 1), cx = px + cdx;
    st.floor(x, px + 2);
    for (let q = Math.min(cx, px); q <= Math.max(cx, px); q++) if (!SOLID[B.get(q, st.gy)]) st.ctx.problems && st.ctx.problems.push(`plate at ${x}: the crate's run to the plate has a pit`);
    B.spawn('plate', px, st.gy - 1, { opens: id, look: o.look || null });
    B.spawn('crate', cx, st.gy - 1, { skin: o.crateSkin || null });
    B.vkey(id, [[cx, st.gy - 1]]);
    if (o.lockAt != null) { const lx = px + o.lockAt, h = o.h || 3; st.floor(px, lx + 1); tourShutterLock(B, lx, st.gy - h, st.gy - 1, id, o.lockLook); B.fill(lx, Math.max(0, st.gy - h - 6), lx, st.gy - h - 1, T.HARD); return lx + 2; }
    return px + 3;
  },
  // 6. a zip line: { dx: 14, dy: 4 } (dy > 0 goes down); the ground continues at the bottom end
  zip(st, o) {
    const B = st.B, x = st.x, dx = o.dx || 14, dy = o.dy != null ? o.dy : 4;
    st.floor(x, x + 2);
    st.pit(x + 3, x + dx - 2);
    B.spawn('zipLine', x + 1, st.gy - 1, { dx: dx - 1, dy, skin: o.skin || null });
    st.gy += dy; st.floor(x + dx - 1, x + dx + 3);
    B.edge([x + 1, st.gy - dy - 1], [x + dx, st.gy]);
    B.edge([x + 2, st.gy - dy - 1], [x + dx, st.gy]);
    return x + dx + 4;
  },
  // 7. a catapult: { to: [dx, dy] (landing, relative to the cup), skin }; a landing ledge is built at the target
  catapult(st, o) {
    const B = st.B, x = st.x, to = o.to || [12, -2], lx = x + 1 + to[0], ly = st.gy + to[1];
    st.floor(x, x + 3);
    B.spawn('catapult', x + 1, st.gy - 1, { to, skin: o.skin || null });
    st.pit(x + 4, lx - 2);
    st.gy = ly; st.floor(lx - 1, lx + 3);
    for (const fx of [x + 1, x + 2]) B.edge([fx, ly - to[1] - 1], [lx, ly]);
    return lx + 4;
  },
  // 16. a hanging ring: { len } (jump into it, swing, jump off); a pit under it
  ring(st, o) {
    const B = st.B, x = st.x, len = o.len || 3, w = o.w || 7;
    st.floor(x, x + 1);
    st.pit(x + 2, x + w + 1);
    const ax = x + 2 + Math.floor(w / 2), ay = st.gy - len - 4;
    B.spawn('ring', ax, ay + len + 1, { len, amp: o.amp || 0.7, skin: o.skin || null, phase: o.phase || 0 });
    // the validator: where Brady's feet are while he hangs, along the swing
    for (let a = -4; a <= 4; a++) { const th = a / 4 * (o.amp || 0.7), hx = Math.round(ax + Math.sin(th) * len), hy = Math.round(ay + 1 + Math.cos(th) * len + 2.3); B.ghosts.push([hx, hy]); }
    st.floor(x + w + 2, x + w + 4);
    return x + w + 5;
  },
  // 11. a fan updraft: { w: 2, h: 7, force: 30, g (toggle group: on in state 1 unless gOn: false) }
  fan(st, o) {
    const B = st.B, x = st.x, w = o.w || 2, h = o.h || 7, F = (o.force || 30) * 4;
    st.floor(x, x + w + 3);
    const z = B.zone(x + 2, st.gy - h, w, h, 0, -F * TS, 7.2 * TS, 'updraft', { pull: 3 });
    if (o.g != null) { z.g = o.g; if (o.gOn === false) z.gOn = false; if (!B.toggles[o.g]) B.toggle(o.g, [], [], { kind: o.kind || 'switch' }); }
    B.spawn('fan', x + 2, st.gy - 1, { w, g: o.g, gOn: o.gOn, skin: o.skin || null });
    return x + w + 4;
  },
  // 13. a wall only an ability breaks: { needs: 'hat' | 'big' | 'fire' | 'ball' | 'kazoo' | 'tomato', h: 3, skin }
  breakwall(st, o) {
    const B = st.B, x = st.x, h = o.h || 3, needs = o.needs || 'hat', id = TOUR_BREAK_KEY[needs] || needs;
    st.floor(x, x + 4);
    const tiles = []; for (let y = st.gy - h; y < st.gy; y++) { B.set(x + 2, y, T.HARD); B.setHide(x + 2, y, 1); tiles.push([x + 2, y]); }
    B.fill(x + 2, Math.max(0, st.gy - h - 6), x + 2, st.gy - h - 1, T.HARD);
    B.locks.push({ id, tiles });
    B.spawn('breakWall', x + 2, st.gy - 1, { needs, h, skin: o.skin || null, id: 'bw' + x });
    return x + 5;
  },
  // 10. a teleport pair: two pieces with the same pair id are linked
  teleport(st, o) {
    const B = st.B, x = st.x, id = o.pair || 'a';
    st.floor(x, x + 4);
    const s = B.spawn('teleport', x + 2, st.gy - 1, { look: o.look || 'tourTeleport' });
    B.pairs = B.pairs || {};
    const other = B.pairs[id];
    if (other) { s.target = { area: st.ctx.areaIndex || 0, x: other.x, y: other.y }; other.target = { area: st.ctx.areaIndex || 0, x: s.x, y: s.y }; delete B.pairs[id]; }
    else B.pairs[id] = s;
    return x + 5;
  },
  // 17. surfaces: conveyor belts, ice, honey (sticky), a bounce pad, a crumbling row
  belt(st, o) { const x = st.x, n = o.n || 8; st.floor(x, x + n + 1); for (let q = 1; q <= n; q++) st.B.set(x + q, st.gy, (o.dir || 1) > 0 ? T.CONV_R : T.CONV_L); st.coins(x + 2, x + n - 1, st.gy - 2); return x + n + 2; },
  iceRun(st, o) { const x = st.x, n = o.n || 10; st.floor(x, x + n + 1); for (let q = 1; q <= n; q++) st.B.set(x + q, st.gy, T.ICE); return x + n + 2; },
  honey(st, o) { const x = st.x, n = o.n || 6; st.floor(x, x + n + 1); for (let q = 1; q <= n; q++) st.B.setSurf(x + q, st.gy, SURF.STICKY); st.B.spawn('surfaceSkin', x + 1, st.gy - 1, { n, kind: 'honey', look: o.look || null }); return x + n + 2; },
  bouncePad(st, o) { const x = st.x; st.floor(x, x + 4); for (let q = 1; q <= 3; q++) st.B.setSurf(x + q, st.gy, SURF.BOUNCE); st.B.spawn('surfaceSkin', x + 1, st.gy - 1, { n: 3, kind: 'bounce', look: o.look || null }); if (o.gold !== false) st.gold(x + 2, st.gy - 8, 'high'); return x + 5; },
  crumbleRow(st, o) { const x = st.x, n = o.n || 6; st.floor(x, x + 1); st.pit(x + 2, x + n + 1); for (let q = 0; q < n; q++) st.B.set(x + 2 + q, st.gy, T.CRUMBLE); st.floor(x + n + 2, x + n + 4); st.coins(x + 2, x + n + 1, st.gy - 2); return x + n + 5; }
});
// the honey and bounce-pad looks over their tiles
class TourSurfaceSkin extends Ent {
  constructor(g, s) { super(g, s, (s.n || 3) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - 4; this.kind = s.kind; this.skinName = s.look; this.back = true; this.squash = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && this.kind === 'bounce' && p.onGround === false && p.vy < -10 * TS && Math.abs(p.y + p.h - this.y - 4) < 20 && p.cx > this.x && p.cx < this.x + this.w) this.squash = 1; this.squash = Math.max(0, this.squash - dt * 4); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.x, y = this.y + 4, w = this.w;
    if (this.kind === 'honey') { ctx.fillStyle = 'rgba(240,170,30,0.85)'; ctx.beginPath(); ctx.moveTo(x, y); for (let q = 0; q <= w; q += 8) ctx.lineTo(x + q, y - 3 - Math.sin(this.t * 2 + q) * 1.5); ctx.lineTo(x + w, y + 6); ctx.lineTo(x, y + 6); ctx.fill(); ctx.fillStyle = 'rgba(255,240,170,0.8)'; for (let q = 6; q < w; q += 22) { ctx.beginPath(); ctx.ellipse(x + q, y - 2, 4, 1.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(240,170,30,0.85)'; ctx.fillRect(x + q + 6, y + 4, 3, 6 + Math.sin(this.t * 2 + q) * 3); ctx.fillStyle = 'rgba(255,240,170,0.8)'; } return; }
    // a bounce pad: a drum skin on a painted frame, squashes when it fires
    const k = this.squash;
    ctx.fillStyle = '#c83a5a'; rr(ctx, x + 2, y - 10, w - 4, 12, 4); ctx.fill(); ctx.fillStyle = '#ffd84a'; for (let q = x + 8; q < x + w - 6; q += 12) ctx.fillRect(q, y - 8, 4, 8);
    ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.ellipse(x + w / 2, y - 10 + k * 3, w / 2 - 3, 4 - k * 2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,40,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  }
}
// a crate Brady pushes onto a plate (a TourProp; heavy, no bounce) and the plate
// the crate: solid on top (stand on it), Brady pushes it along by walking into it (it never lets him through)
class TourCrate extends TourProp {
  constructor(g, s) {
    super(g, s, { w: 30, h: 30, kick: 0, bounce: 0, friction: 30, hp: 0, art(ctx, e, x, y) { TourObj.plank(ctx, x - 15, y - 30, 30, 30); ctx.strokeStyle = '#5e3417'; ctx.lineWidth = 2; ctx.strokeRect(x - 13, y - 28, 26, 26); ctx.beginPath(); ctx.moveTo(x - 12, y - 27); ctx.lineTo(x + 12, y - 3); ctx.moveTo(x + 12, y - 27); ctx.lineTo(x - 12, y - 3); ctx.stroke(); if (e.s.skin) TourObj.skin(ctx, e, e.s.skin); } });
    this.isPlatform = true; this.dx = 0; this.dy = 0; this.crate = true;
  }
  update(dt) { const ox = this.x, oy = this.y; super.update(dt); this.dx = this.x - ox; this.dy = this.y - oy; }
  touchPlayer(p) {
    if (p.dead) return;
    if (p.y + p.h <= this.y + 6) return;   // standing on it (it's a platform)
    const side = p.cx < this.cx ? 1 : -1;
    // push: the crate moves with Brady when he walks into it; he stays against its side
    if ((side > 0 && p.vx > 0) || (side < 0 && p.vx < 0)) {
      const want = p.vx * 0.75 * STEP, nx = this.x + want;
      const T0 = this.g.area, y0 = Math.floor((this.y + 2) / TS), y1 = Math.floor((this.y + this.h - 2) / TS), tx = Math.floor((side > 0 ? nx + this.w : nx) / TS);
      let blocked = false; for (let ty = y0; ty <= y1; ty++) if (SOLID[tileAt(T0, tx, ty)]) blocked = true;
      if (!blocked) { this.x = nx; if (Math.random() < 0.08) this.g.burst(this.cx - side * 14, this.y + this.h, 1, '#d8c0a0', 'dust'); }
      p.vx = clamp(p.vx, -PHYS.walk * 0.75, PHYS.walk * 0.75);
    }
    if (side > 0) p.x = Math.min(p.x, this.x - p.w); else p.x = Math.max(p.x, this.x + this.w);
  }
}
class TourPlate extends Ent {
  constructor(g, s) { super(g, s, 2 * TS - 8, 8); this.x = s.x - TS / 2 + 4; this.y = s.y - 6; this.opens = s.opens; this.down = false; this.skinName = s.look; this.k = 0; this.back = true; }
  update(dt) {
    this.t += dt; const zone = { x: this.x + 4, y: this.y - 10, w: this.w - 8, h: 14 };
    const weighted = this.g.entities.some(e => e !== this && (e.prop || e.carryItem) && !e.remove && overlap(zone, e));
    if (weighted !== this.down) { this.down = weighted; TourKit.sfx('click', 'select', { vol: 0.5, pitch: weighted ? 0.8 : 1.2 }); if (weighted) TourLock.open(this.g, this.opens); else TourLock.shut(this.g, this.opens); }
    this.k = approach(this.k, this.down ? 1 : 0, dt * 8);
  }
  draw(ctx) { if (TourObj.skin(ctx, this, this.skinName)) return; ctx.fillStyle = '#4a4654'; rr(ctx, this.x - 2, this.y + 2, this.w + 4, 6, 2); ctx.fill(); ctx.fillStyle = this.down ? '#7ae07a' : '#e8c84a'; rr(ctx, this.x + 2, this.y - 2 + this.k * 3, this.w - 4, 5, 2); ctx.fill(); }
}
Object.assign(ENTITY_TYPES, { surfaceSkin: TourSurfaceSkin, crate: TourCrate, plate: TourPlate });
// the engine gimmicks as pieces (§6.3), re-themed with { look, period, len, ... }
{
  const G = (type, w, opts) => function (st, o) {
    const x = st.x, n = o.w || w; st.floor(x, x + n - 1);
    const s = st.B.spawn(type, x + Math.floor(n / 2), st.gy - 1 - (opts && opts.up ? opts.up(o) : 0), Object.assign({}, o, { look: o.look || null }));
    if (opts && opts.write) opts.write(st, x, o, s);
    return x + n;
  };
  Object.assign(Tour.pieces, {
    geyser: G('geyser', 6, { write: (st, x, o) => { for (let k = 0; k < 6; k++) st.B.ghosts.push([x + 2, st.gy - 1 - k]); st.B.springs.push([x + 3, st.gy - 1]); } }),
    pancake: G('pancake', 6, { write: (st, x) => { st.B.ghosts.push([x + 2, st.gy - 1], [x + 3, st.gy - 1]); st.B.springs.push([x + 3, st.gy - 1]); } }),
    bubbler: G('bubbler', 5, { write: (st, x, o) => { for (let k = 2; k < (o.rise || 8); k += 2) st.B.ghosts.push([x + 2, st.gy - k], [x + 3, st.gy - k]); } }),
    roller: G('roller', 6),
    barrel: G('barrel', 4),
    laser: G('laser', 4),
    sweeper: G('sweeper', 8, { up: o => 0 }),
    subwoofer: G('subwoofer', 5),
    horn: G('horn', 4),
    poiring: G('poiring', 6, { up: o => 2 }),
    dropper: (st, o) => { const x = st.x, n = o.w || 6; st.floor(x, x + n - 1); st.B.spawn('dropper', x + 3, st.gy - (o.h || 5), { period: o.period, look: o.look || null }); return x + n; },
    banner: (st, o) => { const x = st.x, n = (o.len || 4) + 4; st.floor(x, x + n - 1); st.B.spawn('banner', x + 2, st.gy - (o.h || 3), { len: o.len || 4, look: o.look || null }); return x + n; },
    discoball: (st, o) => { const x = st.x, n = 8; st.floor(x, x + n - 1); st.B.spawn('discoball', x + 4, st.gy - (o.len || 5) - 2, { len: o.len || 4, amp: o.amp, speed: o.speed, look: o.look || null }); return x + n; },
    jellypad: G('jellypad', 4, { write: (st, x) => st.B.springs.push([x + 2, st.gy - 1]) })
  });
}
