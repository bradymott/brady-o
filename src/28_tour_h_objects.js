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
