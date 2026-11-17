/* ============================================================
   World tour: gear (LEVEL_OVERHAUL.md §5). Ten core items in
   Brady's HANDS slot (or BUFFS for the timed ones), registered
   with TourGear.register. The country's signature item sits in
   the same HANDS slot; the HUD's Backpack holds one spare.
   Ids: plane hat pads magnet fins box kazoo wand sundial globe.
   ============================================================ */
const TourGear = {
  list: {},
  // G: { id, name, hint, slot: 'hands' | 'buff', lose: 'drop' | 'consume' | 'timer', time (buffs), uses (globe),
  //      icon(ctx, x, y, t), onCollect(p, g), action(p, g) -> true if used, update(p, dt, inp, g), drawOn(p, ctx, t) }
  register(G) { this.list[G.id] = Object.assign({ slot: 'hands', lose: 'drop', cooldown: 0.3 }, G); return this.list[G.id]; },
  get(id) { return id ? this.list[String(id).replace(/^gear:/, '').split('#')[0]] || null : null; },
  is(kind) { return !!this.get(kind); },
  // the icon of any HANDS / Backpack kind: gear, signature item or core pickup
  icon(ctx, kind, x, y, t, g) {
    const G = this.get(kind);
    if (G) { G.icon(ctx, x, y, t); return; }
    ctx.save(); ctx.translate(x, y); TourItemArt.draw(ctx, kind, 0, 12, t, g || Game.scene); ctx.restore();
  }
};
// item blocks and stands hand out gear by id
{
  const bi = TourPowers.blockItem.bind(TourPowers);
  TourPowers.blockItem = (it, play) => TourGear.get(it) ? 'gear:' + TourGear.get(it).id : bi(it, play);
  const nm = TourPowers.name.bind(TourPowers);
  TourPowers.name = kind => { const G = TourGear.get(kind); return G ? G.name : nm(kind); };
  const draw0 = TourItemArt.draw.bind(TourItemArt);
  TourItemArt.draw = (ctx, kind, x, y, t, g) => { const G = TourGear.get(kind); if (G) { TourItemArt.glow(ctx, x, y - 12, t, G.glow || '#fff2c0'); G.icon(ctx, x, y - 12, t); return; } draw0(ctx, kind, x, y, t, g); };
}

/* ---------- Brady's slots: HANDS, BUFFS and the Backpack (§5.2) ---------- */
Object.assign(Player.prototype, {
  // what is in Brady's hands: { kind: 'gear:plane' | 'sig:taco', G (gear) or P (signature) } or null
  handsKind() { return this.hands ? 'gear:' + this.hands.id + (this.hands.uses ? '#' + this.hands.uses : '') : this.sig ? 'sig:' + this.sig.id : null; },
  clearHands() { this.hands = null; this.sig = null; },
  // put a HANDS kind back in Brady's hands (from the Backpack or a pickup)
  holdKind(kind) {
    if (!kind) return;
    if (kind.startsWith('sig:')) { const P = TourPowers.get(kind.slice(4)); if (P) this.sig = { id: P.id, t: P.time || 0, n: 0 }; return; }
    const G = TourGear.get(kind); if (!G) return;
    const uses = +(kind.split('#')[1] || 0) || G.uses || 0;
    this.hands = { id: G.id, uses, t: 0, cool: 0 };
  },
  // a new HANDS item: the old one goes to the Backpack, or drops for 4 s if the Backpack is full
  stashHands(src) {
    const old = this.handsKind(); if (!old) return;
    this.clearHands();
    if (!this.pack) { this.pack = old; this.g.toast && this.g.toast('INTO THE BACKPACK: TAP IT TO SWAP'); }
    else this.dropKind(old, 4);
  },
  // a floating pickup that waits a moment (a hit, a full backpack)
  dropKind(kind, life) {
    const g = this.g, it = new TourItem(g, this.cx, this.y + 4, kind); it.emerge = 0; it.speedX = 0; it.hoverY = this.y - 10; it.y = it.hoverY; it.life = life || 2; it.dropped = true;
    g.spawn(it);
  },
  takeGear(G, src) {
    const g = this.g;
    if (G.slot === 'buff') { this.buffs[G.id] = G.time || 8; TourKit.sfx('gear_' + G.id, 'powerup'); g.toast(G.name + '! ' + (G.hint || '')); if (G.onCollect) G.onCollect(this, g); return; }
    if (this.hands && this.hands.id === G.id) { this.hands.uses = G.uses || this.hands.uses; Sound.play('pick', { pitch: 1.4 }); return; }
    this.stashHands(src);
    this.hands = { id: G.id, uses: G.uses || 0, t: 0, cool: 0 };
    Sound.play('powerup'); g.burst(this.cx, this.cy, 20, G.glow || '#fff2c0', 'confetti');
    g.toast(G.name + '! ' + (G.hint || ''));
    if (G.onCollect) G.onCollect(this, g);
  },
  // tap the Backpack: swap it with HANDS (core pickups in the Backpack are used instead)
  usePackTour() {
    const k = this.pack;
    if (!k || this.dead || this.state !== 'play') return false;
    if (k.startsWith('gear:') || k.startsWith('sig:')) {
      const old = this.handsKind(); this.clearHands(); this.holdKind(k); this.pack = old || null;
      Sound.play('select'); this.g.burst(this.cx, this.cy, 10, '#ffd84a', 'spark'); return true;
    }
    this.pack = null; this.collect(k); return true;
  }
});
// pickups route gear into the slots; signature items now share the HANDS slot
{
  const ct0 = Player.prototype.collectTour;
  Player.prototype.collectTour = function (kind, src) {
    const G = TourGear.get(kind);
    if (G) return this.takeGear(G, src);
    if (kind && kind.startsWith('sig:') && !(this.sig && this.sig.id === kind.slice(4))) { if (this.hands) this.stashHands(src); }
    return ct0.call(this, kind, src);
  };
  const up0 = Player.prototype.usePack;
  Player.prototype.usePack = function () { return this.g.level && this.g.level.tour ? this.usePackTour() : up0.call(this); };
  // the order of a hit (§5.2): a star blocks it; a Hard Hat absorbs it; else the HANDS item drops; else FORM drops
  const hurt0 = Player.prototype.hurt;
  Player.prototype.hurt = function (src) {
    if (!(this.g.level && this.g.level.tour) || this.dead || this.state !== 'play' || this.star > 0 || this.invuln > 0 || this.grabbedBy || this.mounted || this.kandi > 0 || this.fx.molly > 0) return hurt0.call(this, src);
    const lose = () => { this.invuln = 1.8; this.hurtFlash = 0.3; this.g.shake(4); if (src && src.x !== undefined) this.vx = (this.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) * 4 * TS; this.vy = Math.min(this.vy, -6 * TS); };
    if (this.hands && this.hands.id === 'hat') {
      this.hands = null; lose(); Sound.play('bump'); this.g.burst(this.cx, this.y, 14, '#ffd84a', 'debris'); this.g.parts.text(this.cx, this.y - 10, 'CLONK! HAT LOST', '#ffd84a'); return;
    }
    const k = this.handsKind();
    if (k) { this.clearHands(); this.dropKind(k, 2); lose(); Sound.play('powerdown', { vol: 0.6 }); this.g.parts.text(this.cx, this.y - 10, 'DROPPED IT!', '#ffffff'); return; }
    return hurt0.call(this, src);
  };
}
// TourItem: dropped items float for a while, then fade
{
  const u0 = TourItem.prototype.update;
  TourItem.prototype.update = function (dt) {
    if (this.dropped) { this.t += dt; this.life -= dt; ItemSpace.keepFree(this, true); this.y = this.hoverY + Math.sin(this.t * 4) * 3; if (this.life <= 0) { this.remove = true; this.g.burst(this.cx, this.cy, 6, '#ffffff', 'spark'); } return; }
    return u0.call(this, dt);
  };
  const d0 = TourItem.prototype.draw;
  TourItem.prototype.draw = function (ctx) { if (this.dropped && this.life < 0.8 && Math.floor(this.t * 12) % 2) return; return d0.call(this, ctx); };
}

/* ---------- shared bits ---------- */
const GearFx = {
  // enemies (not bosses) in a cone or box in front of Brady
  inFront(p, len, h) { const g = p.g, x0 = p.facing > 0 ? p.x + p.w : p.x - len * TS, box = { x: x0, y: p.y - (h || 1) * TS * 0.5, w: len * TS, h: p.h + (h || 1) * TS }; return { box, list: g.entities.filter(e => !e.remove && !e.dead && overlap(box, e)) }; },
  ring(ctx, x, y, r, col, a) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); }
};

/* ---------- the projectiles ---------- */
// the paper plane: flies straight, hits at range, comes back to Brady's hand
class GearPlane extends Ent {
  constructor(g, p) { super(g, null, 22, 12); this.p = p; this.x = p.cx - 11 + p.facing * 10; this.y = p.y + (p.small ? 6 : 14); this.vx = p.facing * 9 * TS; this.dir = p.facing; this.friendly = true; this.out = 0; this.back = false; this.hitSet = new Set(); }
  update(dt) {
    this.t += dt; this.out += dt; const p = this.p, g = this.g;
    if (!this.back && (this.out > 8 / 9 || SOLID[tileAt(g.area, Math.floor(this.cx / TS), Math.floor(this.cy / TS))])) { this.back = true; TourKit.sfx('paper', 'jump', { vol: 0.4, pitch: 1.6 }); }
    if (this.back) {
      const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1, sp = 10 * TS;
      this.vx = dx / d * sp; this.vy = dy / d * sp; this.dir = sign(dx) || this.dir;
      if (d < 18 || this.out > 3) { this.remove = true; if (p.hands && p.hands.id === 'plane') p.hands.thrown = false; return; }
    } else this.vy = Math.sin(this.out * 9) * 0.6 * TS;
    this.x += this.vx * dt; this.y += this.vy * dt;
    for (const e of g.entities) {
      if (e === this || e.remove || e.dead || this.hitSet.has(e) || !overlap(this, e)) continue;
      if (e.enemy && !e.boss) { this.hitSet.add(e); if (e.hit('plane', this)) g.addScore(200, e.cx, e.y); this.back = true; }
      else if (e.hit && (e.lever || e.bell || e.mirror || e instanceof TourRailSwitch)) { this.hitSet.add(e); e.hit('plane', this); this.back = true; }
    }
    if (g.boss && !g.boss.dead && overlap(this, g.boss) && !this.hitSet.has(g.boss)) { this.hitSet.add(g.boss); g.boss.hit('plane', this); this.back = true; }
  }
  draw(ctx) { Ink.ent(ctx, this, c => { c.save(); c.translate(this.cx, this.cy); c.scale(this.dir, 1); c.rotate(this.back ? 0.25 : -0.08 + Math.sin(this.t * 14) * 0.06); GearArt.plane(c, 0, 0, 1); c.restore(); }, { scale: 1 }); }
}
// a soap bubble: drifts, traps an enemy (its top is a platform), pops
class GearBubble extends Ent {
  constructor(g, p) { super(g, null, 40, 14); this.x = p.cx - 20 + p.facing * 24; this.y = p.y + 4; this.dir = p.facing; this.life = 4; this.r = 6; this.isPlatform = true; this.dx = 0; this.dy = 0; this.friendly = true; this.trapped = null; this.landT = 0; }
  update(dt) {
    this.t += dt; this.life -= dt; const g = this.g, ox = this.x, oy = this.y;
    this.r = Math.min(20, this.r + dt * 50);
    this.x += this.dir * 1.5 * TS * dt; this.y -= 0.3 * TS * dt + Math.sin(this.t * 3) * 0.2;
    if (!this.trapped) for (const e of g.entities) if (e.enemy && !e.boss && !e.dead && !e.remove && overlap({ x: this.cx - this.r, y: this.cy - this.r, w: this.r * 2, h: this.r * 2 }, e)) { this.trapped = e; this.life = 4; TourKit.sfx('bubble', 'splat', { pitch: 1.8, vol: 0.5 }); break; }
    if (this.trapped) { const e = this.trapped; e.x = this.cx - e.w / 2; e.y = this.cy - e.h / 2 + 2; e.vx = 0; e.vy = 0; if (e.stunT !== undefined) e.stunT = Math.max(e.stunT, 0.2); }
    const p = g.player;
    if (p && p.ride === this) { this.landT += dt; if (!this.trapped && this.landT > 0.6) this.life = 0; }
    if (SOLID[tileAt(g.area, Math.floor(this.cx / TS), Math.floor(this.cy / TS))]) this.life = 0;
    this.dx = this.x - ox; this.dy = this.y - oy;
    if (this.life <= 0) this.pop();
  }
  get cy() { return this.y + 12; }
  pop() {
    if (this.remove) return; this.remove = true; this.dead = true;
    this.g.burst(this.cx, this.cy, 14, '#e8f8ff', 'bubble'); TourKit.sfx('pop', 'splat', { pitch: 1.6, vol: 0.4 });
    if (this.trapped && !this.trapped.dead) { const e = this.trapped; if (e.stun) e.stun(1); else if (e.stunT !== undefined) e.stunT = 1; }
  }
  draw(ctx) {
    const x = this.cx, y = this.cy, r = this.r;
    ctx.save();
    const gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.6, 'rgba(180,230,255,0.12)'); gr.addColorStop(1, `hsla(${(this.t * 160) % 360},90%,70%,0.55)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `hsla(${(this.t * 160 + 120) % 360},90%,75%,0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// a magnet-pulled coin flying to Brady
class GearCoin extends Ent {
  constructor(g, x, y) { super(g, null, 14, 14); this.x = x - 7; this.y = y - 7; this.item = true; }
  update(dt) { this.t += dt; const p = this.g.player; if (!p) return; const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1, sp = 12 * TS; this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; if (d < 14) { this.remove = true; this.g.addPick(this.cx, this.cy); } }
  touchPlayer() { if (!this.remove) { this.remove = true; this.g.addPick(this.cx, this.cy); } }
  draw(ctx) { Sprites.pick(ctx, this.cx, this.cy, this.t, Math.cos(this.t * 18)); }
}

/* ---------- the ten items ---------- */
const GearArt = {
  plane(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-11, -7); ctx.lineTo(-6, 0); ctx.lineTo(-11, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8dcc8'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, 0); ctx.lineTo(-9, 3.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,80,0.6)'; ctx.lineWidth = 0.8; ctx.setLineDash([1.6, 1.6]); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, 0); ctx.stroke(); ctx.setLineDash([]);
    // Chinka's stamp: a red heart
    ctx.fillStyle = '#e8384f'; ctx.beginPath(); ctx.moveTo(-3, -1.2); ctx.bezierCurveTo(-5.5, -4, -1.5, -5.5, -1.2, -3.2); ctx.bezierCurveTo(-0.9, -5.5, 3, -4, 0.6, -1.2); ctx.lineTo(-1.2, 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};
TourGear.register({ id: 'plane', name: 'PAPER PLANE', hint: 'HOLD JUMP TO GLIDE · THROW IT', glow: '#fff4d0',
  icon(ctx, x, y, t) { GearArt.plane(ctx, x, y + Math.sin(t * 3) * 1.5, 1.05); },
  update(p, dt, inp, g) {
    const h = p.hands; if (!h || h.thrown || p.lsdT > 0 || p.inWater) { p.gliding = false; return; }
    p.gliding = !p.onGround && inp.jump && p.vy > 0;
    if (p.gliding) { if (p.vy > 1.6 * TS) p.vy = 1.6 * TS; p.airBoost = 1.15; if (Math.random() < 0.2) g.burst(p.cx - p.facing * 10, p.y + 8, 1, '#ffffff', 'dust'); } else p.airBoost = 1;
  },
  // after the physics step: the glide caps the fall at 1.6 tiles/s
  after(p, dt, inp, g) { if (p.gliding && !p.onGround && p.vy > 1.6 * TS) p.vy = 1.6 * TS; },
  action(p, g) { const h = p.hands; if (h.thrown) return false; h.thrown = true; g.spawn(new GearPlane(g, p)); TourKit.sfx('paper', 'throw', { vol: 0.6 }); return true; },
  drawOn(p, ctx, t) { if (p.hands.thrown) return; ctx.save(); const x = p.cx - p.facing * 7, y = p.y + (p.small ? 8 : 14); ctx.translate(x, y); ctx.rotate(p.gliding ? -0.3 * p.facing : -0.9 * p.facing); GearArt.plane(ctx, 0, 0, p.gliding ? 1.6 : 0.8); ctx.restore(); }
});
TourGear.register({ id: 'hat', name: 'HARD HAT', hint: 'HEADLAMP · THROW = SHOULDER DASH · TAKES A HIT', glow: '#ffe070',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 3);
    ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2a90a'; ctx.fillRect(-13, -1, 26, 4); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-6, -8, 3, 6);
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(-2.5, -9, 5, 6); ctx.fillStyle = `rgba(255,250,200,${0.75 + 0.25 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(0, -6, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4ab0e8'; ctx.fillRect(4, -5, 4, 3);   // a little map sticker
    ctx.restore();
  },
  update(p, dt, inp, g) { const h = p.hands; if (h.dashT > 0) { h.dashT -= dt; p.vx = h.dashDir * 11 * TS; p.vy = Math.min(p.vy, 1 * TS); GearHit.dash(p, g, 'hatdash'); if (h.dashT <= 0) p.vx *= 0.3; } },
  action(p, g) { const h = p.hands; if (h.dashT > 0) return false; h.dashT = 0.35; h.dashDir = p.facing; TourKit.sfx('dash', 'kick', { vol: 0.6 }); g.burst(p.cx, p.y + p.h, 8, '#ffffff', 'dust'); return true; },
  drawOn(p, ctx, t) { ctx.save(); ctx.translate(p.cx + p.facing * 1, p.y + (p.small ? 2 : 3) - (p.crouch ? -2 : 0)); ctx.scale(0.8, 0.8); this.icon(ctx, 0, -2, t); ctx.restore(); },
  light: 150
});
TourGear.register({ id: 'pads', name: 'CRAWL PADS', hint: 'HOLD DOWN AND WALK TO CRAWL', glow: '#d8b0ff',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 6, 0); ctx.fillStyle = '#7a3ad8'; rr(ctx, -5, -8, 10, 16, 5); ctx.fill(); ctx.fillStyle = '#5a2aa8'; ctx.fillRect(-5, -2, 10, 3); ctx.fillRect(-5, 4, 10, 2); ctx.fillStyle = '#ffffff'; ctx.beginPath(); TourKit.star(ctx, 0, -4, 2.6, 1.1, 5); ctx.fill(); ctx.restore(); }
    ctx.restore();
  },
  update(p, dt, inp, g) { p.crawling = p.crouch && p.onGround; },
  action(p, g) { if (!p.crawling) return false; p.vx = p.facing * 7 * TS; TourKit.sfx('roll', 'jump', { pitch: 0.7, vol: 0.4 }); g.burst(p.cx, p.y + p.h, 6, '#ffffff', 'dust'); return true; },
  drawOn(p, ctx, t) { ctx.save(); ctx.fillStyle = '#7a3ad8'; const ky = p.y + p.h - (p.crouch ? 6 : 12); ctx.fillRect(p.cx - 7, ky, 5, 5); ctx.fillRect(p.cx + 2, ky, 5, 5); ctx.restore(); }
});
TourGear.register({ id: 'magnet', name: 'MAGNET BELT', hint: 'COINS FLY TO YOU', slot: 'buff', lose: 'timer', time: 30, glow: '#ff9090',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineWidth = 6; ctx.strokeStyle = '#d8323a'; ctx.beginPath(); ctx.arc(0, -1, 8, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#d8323a'; ctx.fillRect(-11, -1, 6, 7); ctx.fillRect(5, -1, 6, 7);
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(-11, 5, 6, 4); ctx.fillRect(5, 5, 6, 4);
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 6)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -1, 13, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.restore();
  }
});
TourGear.register({ id: 'fins', name: 'FLIPPER FINS', hint: 'SWIM FASTER · THROW = DASH', glow: '#a8ff70',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 5, 3); ctx.rotate(s * 0.25); ctx.fillStyle = '#7ad83a'; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(3, -6); ctx.lineTo(6, 8); ctx.quadraticCurveTo(0, 11, -6, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,90,20,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 9); ctx.stroke(); ctx.restore(); }
    // snorkel goggles on top
    ctx.fillStyle = '#2a8ad8'; ctx.fillRect(-9, -11, 18, 3); ctx.fillStyle = '#bfefff'; ctx.beginPath(); ctx.arc(-4, -9.5, 3, 0, TAU); ctx.arc(4, -9.5, 3, 0, TAU); ctx.fill();
    ctx.restore();
  },
  update(p, dt, inp, g) { const h = p.hands; p.swimMul = 1.6; if (h.dashT > 0) { h.dashT -= dt; p.vx = h.dashDir * 10 * TS; GearHit.dash(p, g, 'hatdash', true); } },
  action(p, g) { const h = p.hands; if (!p.inWater || h.dashT > 0) return false; h.dashT = 0.35; h.dashDir = p.facing; TourKit.sfx('swim', 'swim', { vol: 0.6 }); g.burst(p.cx, p.cy, 10, '#bfefff', 'bubble'); return true; },
  drawOn(p, ctx, t) { ctx.save(); ctx.fillStyle = '#7ad83a'; const fy = p.y + p.h - 2, k = Math.sin(t * (p.inWater ? 14 : 8)) * 3; ctx.beginPath(); ctx.ellipse(p.cx - 4 - p.facing * 2, fy + k * 0.3, 7, 2.6, k * 0.06, 0, TAU); ctx.ellipse(p.cx + 4 - p.facing * 2, fy - k * 0.3, 7, 2.6, -k * 0.06, 0, TAU); ctx.fill(); ctx.restore(); }
});
TourGear.register({ id: 'box', name: 'CARDBOARD BOX', hint: 'HOLD DOWN TO HIDE', glow: '#e8c890',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#c8955a'; ctx.fillRect(-11, -8, 22, 17); ctx.fillStyle = '#a87440'; ctx.fillRect(-11, -8, 22, 4);
    ctx.fillStyle = '#1c1210'; ctx.fillRect(-6, -2, 3, 2); ctx.fillRect(3, -2, 3, 2);
    ctx.fillStyle = '#d8323a'; ctx.font = `bold 5px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('FRAGILE ♥', 0, 6);
    ctx.restore();
  },
  update(p, dt, inp, g) { p.boxed = !!inp.down && p.onGround && !p.inWater; if (p.boxed) { p.vx = clamp(p.vx, -0.4 * PHYS.walk, 0.4 * PHYS.walk); } },
  drawOn(p, ctx, t) {
    if (!p.boxed) return;
    const w = 34, h = 30, x = p.cx - w / 2, y = p.y + p.h - h + Math.abs(Math.sin(t * 10)) * (Math.abs(p.vx) > 5 ? 1.5 : 0);
    ctx.save(); ctx.fillStyle = '#c8955a'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#a87440'; ctx.fillRect(x, y, w, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + w / 2 - 1, y, 2, h);
    ctx.fillStyle = '#1c1210'; ctx.fillRect(x + w / 2 + p.facing * 4 - 5, y + 9, 3, 2); ctx.fillRect(x + w / 2 + p.facing * 4 + 2, y + 9, 3, 2);
    ctx.fillStyle = '#d8323a'; ctx.font = `bold 6px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('FRAGILE ♥', x + w / 2, y + h - 6); ctx.restore();
  }
});
TourGear.register({ id: 'kazoo', name: 'KAZOO', hint: 'THROW = HONK: STUNS, RINGS BELLS, REVEALS', cooldown: 0.5, glow: '#ffe060',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3);
    ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(-11, -3); ctx.lineTo(6, -5); ctx.lineTo(11, -7); ctx.lineTo(11, 7); ctx.lineTo(6, 5); ctx.lineTo(-11, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-1, -4, 3, 0, TAU); ctx.fill(); ctx.fillRect(-11, -1, 17, 2);
    ctx.restore();
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const a = (t * 2 + k * 0.3) % 1; ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(x + 12, y - 4, 4 + k * 3 + a * 3, -0.6, 0.6); ctx.stroke(); } ctx.globalAlpha = 1;
  },
  action(p, g) {
    const { box, list } = GearFx.inFront(p, 3, 1.5);
    TourKit.sfx('kazoo', 'artcarHorn', { vol: 0.6, pitch: 1.8 }); p.honkT = 0.35;
    for (const e of list) {
      if (e.boss) continue;
      if (e.reveal) e.reveal(3);
      if (e.ring) e.ring(p);
      if (e.enemy) { if (e.stun) { e.stun(2); g.addScore(50, e.cx, e.y); } else e.hit('kazoo', p); }
      else if (e.hit && (e.bell || e.glass)) e.hit('kazoo', p);
    }
    for (const e of g.entities) if (e.sleeper && Math.hypot(e.cx - p.cx, e.cy - p.cy) < 6 * TS && e.wake) e.wake('kazoo');
    if (g.boss && g.boss.brain && g.boss.brain.onBell && Math.abs(g.boss.cx - p.cx) < 6 * TS) g.boss.brain.onBell(g.boss);
    return true;
  },
  drawOn(p, ctx, t) {
    ctx.save(); ctx.translate(p.cx + p.facing * 8, p.y + (p.small ? 10 : 16)); ctx.scale(p.facing * 0.55, 0.55); this.icon(ctx, 0, 0, t); ctx.restore();
    if (p.honkT > 0) {
      // the honk: three bold sound arcs fanning out, and a HONK! that pops
      const k = 1 - p.honkT / 0.35, cy = p.y + (p.small ? 10 : 16);
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const r = 14 + i * 16 + k * 26, a = (1 - k) * (1 - i * 0.2); ctx.globalAlpha = a; ctx.strokeStyle = i % 2 ? '#ff6a3a' : '#ffd23a'; ctx.lineWidth = 4 - i; ctx.beginPath(); ctx.arc(p.cx + p.facing * 10, cy, r, p.facing > 0 ? -0.7 : Math.PI - 0.7, p.facing > 0 ? 0.7 : Math.PI + 0.7); ctx.stroke(); }
      ctx.globalAlpha = 1 - k; ctx.font = `${12 + k * 6}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#1c1426'; ctx.fillText('HONK!', p.cx + p.facing * (40 + k * 16) + 1.5, cy - 22 - k * 10 + 1.5); ctx.fillStyle = '#ffd23a'; ctx.fillText('HONK!', p.cx + p.facing * (40 + k * 16), cy - 22 - k * 10);
      ctx.restore();
    }
  }
});
TourGear.register({ id: 'wand', name: 'BUBBLE WAND', hint: 'THROW = BUBBLE: TRAPS ENEMIES, STAND ON IT', glow: '#c8f0ff',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#b8b8c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(1, -1); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(4, -5, 6, 0, TAU); ctx.stroke();
    const gr = ctx.createLinearGradient(-2, -11, 10, 1); ['#ff8ab8', '#ffe08a', '#8affc8', '#8ac8ff'].forEach((c, k) => gr.addColorStop(k / 3, c));
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 3); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(4, -5, 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
  },
  action(p, g) { const n = g.entities.filter(e => e instanceof GearBubble && !e.remove).length; if (n >= 3) return false; g.spawn(new GearBubble(g, p)); TourKit.sfx('bubble', 'splat', { pitch: 1.4, vol: 0.5 }); return true; },
  drawOn(p, ctx, t) { ctx.save(); ctx.translate(p.cx + p.facing * 9, p.y + (p.small ? 8 : 14)); ctx.scale(0.6 * p.facing, 0.6); this.icon(ctx, 0, 0, t); ctx.restore(); }
});
TourGear.register({ id: 'sundial', name: 'POCKET SUNDIAL', hint: 'EVERYTHING ELSE SLOWS DOWN', slot: 'buff', lose: 'timer', time: 8, glow: '#ffd890',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 1);
    ctx.strokeStyle = '#c8902a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, -8); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12.5, 2, 0, TAU); ctx.stroke();
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9); g.addColorStop(0, '#fff0b0'); g.addColorStop(1, '#d8a030'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 1; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.stroke(); }
    ctx.fillStyle = '#5a3a10'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6 * Math.cos(-t * 0.8), 6 * Math.sin(-t * 0.8)); ctx.lineTo(1.5, 1.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
});
TourGear.register({ id: 'globe', name: 'SNOW GLOBE', hint: 'THROW = SNOWFALL: SLOWS AND COOLS', uses: 5, glow: '#e0f4ff',
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#8a5a30'; rr(ctx, -9, 5, 18, 6, 2); ctx.fill();
    const g = ctx.createRadialGradient(-3, -5, 1, 0, -2, 10); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(150,200,255,0.55)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -2, 9, 0, TAU); ctx.fill();
    // a tiny Brady-O world inside: a hill, a palm and a pin
    ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.arc(0, 6, 7, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.arc(2, -1, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { const a = t * 0.8 + k; ctx.fillRect(Math.cos(a * 1.3) * 6, -2 + ((t * 6 + k * 3) % 12) - 6, 1.2, 1.2); }
    ctx.restore();
  },
  action(p, g) {
    const h = p.hands; if (h.uses <= 0) return false;
    h.uses--; g.spawn(new GearSnow(g, p.cx, p.cy)); TourKit.sfx('chime', 'pick', { pitch: 1.8, vol: 0.5 });
    if (h.uses <= 0) { p.hands = null; g.parts.text(p.cx, p.y - 10, 'THE GLOBE IS EMPTY', '#e0f4ff'); }
    return true;
  },
  drawOn(p, ctx, t) { ctx.save(); ctx.translate(p.cx + p.facing * 9, p.y + (p.small ? 10 : 16)); ctx.scale(0.55, 0.55); this.icon(ctx, 0, 0, t); ctx.restore(); }
});
// the snowfall: 5 tiles around, 2.5 s; enemies slow to 30 % and lose spikes and fire for 6 s
class GearSnow extends Ent {
  constructor(g, x, y) { super(g, null, 10 * TS, 10 * TS); this.x = x - 5 * TS; this.y = y - 5 * TS; this.life = 2.5; this.flakes = []; this.friendly = true; for (let k = 0; k < 70; k++) this.flakes.push([Math.random(), Math.random(), Math.random()]); }
  update(dt) {
    this.t += dt; this.life -= dt; if (this.life <= 0) { this.remove = true; return; }
    for (const e of this.g.entities) if (e.enemy && !e.boss && !e.dead && overlap(this, e)) { if (!(e.snowCapT > 0)) this.g.burst(e.cx, e.y, 6, '#ffffff', 'spark'); e.snowCapT = 6; }
    for (const e of this.g.entities) if (e.hotRock && overlap(this, e)) e.coolT = 6;
  }
  draw(ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [fx, fy, fz] of this.flakes) { const x = this.x + fx * this.w + Math.sin(this.t * 2 + fz * 9) * 6, y = this.y + ((fy * this.h + this.t * 60 * (0.6 + fz)) % this.h); ctx.globalAlpha = Math.min(1, this.life) * (0.5 + fz * 0.5); ctx.beginPath(); ctx.arc(x, y, 1 + fz * 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// snow-capped enemies: 30 % speed, no spikes or fire for a while (drawn with a snow cap)
{
  const upd = TourEnemy.prototype.update;
  TourEnemy.prototype.update = function (dt) { if (this.snowCapT > 0) { this.snowCapT -= dt; return upd.call(this, dt * 0.3); } return upd.call(this, dt); };
  const hit = TourEnemy.prototype.hit;
  TourEnemy.prototype.hit = function (kind, src) {
    if (this.snowCapT > 0) { const sp = this.spiky, fi = this.fiery; this.spiky = false; this.fiery = false; try { return hit.call(this, kind, src); } finally { this.spiky = sp; this.fiery = fi; } }
    return hit.call(this, kind, src);
  };
  Object.defineProperty(TourEnemy.prototype, 'prickly', { get() { if (this.snowCapT > 0) return false; return this.spiky || (this.behavior === 'roll' && this.state === 'roll' && this.cfg.rollSpiky !== false); }, configurable: true });
  const dr = TourEnemy.prototype.draw;
  TourEnemy.prototype.draw = function (ctx) { dr.call(this, ctx); if (this.snowCapT > 0 && !this.dead) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 1, this.w * 0.55, 5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(200,230,255,0.9)'; ctx.fillRect(this.cx - this.w * 0.4, this.y, this.w * 0.8, 2); ctx.restore(); } };
}
// a dash (hard hat, fins): breaks walls meant for it, digs soil sideways, knocks out what it meets
const GearHit = {
  dash(p, g, kind, water) {
    const box = { x: p.facing > 0 ? p.x + p.w - 4 : p.x - 10, y: p.y + 2, w: 14, h: p.h - 4 };
    for (const e of g.entities) {
      if (e.remove || e.dead || !overlap(box, e)) continue;
      if (e.enemy && !e.boss) { if (!water || e instanceof TourSwimmer || e.swims) { if (e.hit(kind, p)) g.addScore(200, e.cx, e.y); } }
      else if (e.breakWall && e.hit) e.hit(kind, p);
    }
    if (!water && p.hands && p.hands.id === 'hat') {
      const tx = Math.floor((p.facing > 0 ? p.x + p.w + 4 : p.x - 4) / TS);
      for (const ty of [Math.floor((p.y + 4) / TS), Math.floor((p.y + p.h - 4) / TS)]) if (tileAt(g.area, tx, ty) === T.SOIL) p.dig(p.facing);
    }
  }
};
// the hard hat's headlamp and the box: lights and hiding
{
  const cl = Play.prototype.collectLights;
  Play.prototype.collectLights = function (camX, camY) {
    const L = cl.call(this, camX, camY), p = this.player;
    if (p && p.hands) { const G = TourGear.get(p.hands.id); if (G && G.light) L.push({ x: p.cx + p.facing * 40, y: p.y + 10, r: G.light, col: '#fff2c0', a: 0.45 }); }
    return L;
  };
  // the sundial: everything but Brady at half speed (boss fights 75 %)
  const ws = Play.prototype.worldScale;
  Play.prototype.worldScale = function () { const k = ws.call(this), p = this.player; return p && p.buffs && p.buffs.sundial > 0 ? k * (this.bossLock ? 0.75 : 0.5) : k; };
}

/* ---------- the gear stand: an infinite dispenser (§6.2 #25) ---------- */
class TourGearStand extends Ent {
  constructor(g, s) { super(g, s, 30, 64); this.item = s.item || 'plane'; this.back = 0; this.skinName = s.skin; this.back = true; this.hangT = 0; }
  update(dt) { this.t += dt; if (this.hangT > 0) this.hangT -= dt; }
  touchPlayer(p) {
    if (this.hangT > 0 || p.dead) return;
    if (p.hands && p.hands.id === this.item) return;
    const G = TourGear.get(this.item); if (!G) return;
    if (G.slot === 'buff' && p.buffs && p.buffs[G.id] > 1) return;
    p.collect('gear:' + this.item, this); this.hangT = 1;
  }
  draw(ctx) { Ink.around(ctx, this.x - 14, this.y, this.w + 28, this.h, c => this.art(c), { pad: 12 }); }
  art(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h, C = Tour.countryOf(this.g.id), col = (C && C.colors) || { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' };
    // a little market post: a striped awning in the country colours, a hook, the item swinging on it
    TourObj.plank(ctx, x - 3, y - 62, 6, 62);
    ctx.fillStyle = shade(col.a, -0.2); ctx.fillRect(x - 16, y - 62, 32, 4);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#fffaf0' : col.a; ctx.beginPath(); ctx.moveTo(x - 16 + k * 8, y - 58); ctx.lineTo(x - 8 + k * 8, y - 58); ctx.lineTo(x - 12 + k * 8, y - 52); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#5a5866'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 2, y - 50); ctx.lineTo(x + 12, y - 50); ctx.arc(x + 12, y - 46, 4, -Math.PI / 2, Math.PI * 0.6); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, 14, 3, 0, 0, TAU); ctx.fill();
    if (this.hangT <= 0) { const G = TourGear.get(this.item); if (G) { ctx.save(); ctx.translate(x + 12, y - 34); ctx.rotate(Math.sin(this.t * 2) * 0.12); G.icon(ctx, 0, 0, this.t); ctx.restore(); } }
  }
  get light() { return { r: 60, c: 'rgba(255,240,190,', y: this.y + 20 }; }
}
ENTITY_TYPES.gearStand = TourGearStand;
Tour.pieces.gearStand = function (st, o) {
  const x = st.x; if (!o.here) st.floor(x, x + 3);
  const tx = o.here ? x : x + 1, ty = st.gy - 1;
  st.B.spawn('gearStand', tx, ty, { item: o.item || 'plane', skin: o.skin || null });
  st.B.vkey('gear:' + (o.item || 'plane'), [[tx, ty], [tx, ty - 1]]);
  return o.here ? x : x + 4;
};
