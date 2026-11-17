/* ============================================================
   World tour: secrets, stage B (SECRETS_WARPS_SWITCHES.md §3, WP-3; contracts in SECRETS_CONTRACTS.md §3-4).
   BACKSTAGE: every level is a stage set in Piwi Squirmin's travelling show. Off its edges, behind a fair but
   hidden way in (off the top of the screen, past the gate, down one odd pit, left of the start), is the
   backstage: the rigging, the loading dock, the trap room under the stage, the wings. Backstage areas are
   ordinary v2 areas (role: 'backstage', zone, theme bk_<zone>) joined to the level by seams (TourSeams).
   WORMHOLES: a spinning wormhole set in an old touring trunk (spawn type 'warp', exit via 'warp'). Up at it and
   Brady is sucked in; the level counts as cleared through that exit and the map sends him where it leads.
   Here: the seam swap (Play.prototype.seamTo, the velvet curtain whip), the warp entity and its exit, the
   backstage looks (themes, tiles, painted backdrops, props), Piwi's wind-up stagehand mice, and the pieces.
   Player-facing words: WORMHOLE. Code words stay neutral: warp, seam, backstage.
   ============================================================ */

/* ---------- the seam swap ---------- */
// Brady crossed a seam: he is carried into the target area with his velocity, his powers and his Pupo (the
// areaLoaded hook remounts Pupo where he may go), and a velvet curtain whips off the screen the way he travelled.
Play.prototype.seamTo = function (seam, side) {
  const tg = seam && seam.target, p = this.player;
  if (!tg || this.state !== 'play' || !p || p.state !== 'play') return false;
  const vx = p.vx, vy = p.vy, facing = p.facing;
  // the same hand-over as a door (Play.enterPortal)
  const power = p.power, pack = p.pack, kandi = p.kandi, fx = p.fx;
  this.sigCarry = p.sig; this.handsCarry = p.hands; this.buffsCarry = p.buffs;
  this.loadArea(tg.area, tg.x, tg.y, power);
  const q = this.player;
  q.power = power; q.pack = pack; q.kandi = kandi; q.fx = fx;
  q.facing = facing;
  // velocity kept: up through the floor from below, down onto a landing from above, walking in from the side
  if (side === 'top') { q.vy = Math.max(vy, -14 * TS); q.vx = vx; q.onGround = false; }
  else if (side === 'bottom') { q.vy = clamp(vy, 0, 10 * TS); q.vx = vx; q.onGround = false; }
  else q.vx = vx;
  this.camX = clamp(q.cx - Game.viewW * 0.4, 0, Math.max(0, this.area.W * TS - Game.viewW));
  this.camY = this.camTargetY(true);
  this.weather.reset(this.camX, this.camY, Game.viewW, Game.viewH);
  this.mus(this.area.music);
  this.seamFx = { t: 0, side };
  Sound.play('door', { vol: 0.5, pitch: 0.8 });
  return true;
};
TourHooks.on('offEdge', (play, p, side, seam) => play.seamTo(seam, side));
TourHooks.on('playUpdate', (play, dt) => { const F = play.seamFx; if (F) { F.t += dt; if (F.t > 0.45) play.seamFx = null; } });
// the curtain whip and the wormhole swirl are drawn over the world (world coordinates, the view's rectangle)
TourHooks.on('afterEntities', (play, ctx) => {
  const F = play.seamFx, Wf = play.warpFx;
  if (!F && !Wf) return;
  const x0 = play.camX, y0 = play.camY, VW = Game.viewW, VH = Game.viewH;
  if (F) TourBackstage.curtain(ctx, x0, y0, VW, VH, F.side, clamp(F.t / 0.4, 0, 1));
  if (Wf) TourBackstage.swirl(ctx, play, Wf, x0, y0, VW, VH);
});

/* ---------- the looks ---------- */
const TourBackstage = {
  INK: '#160e14',
  // fonts made once (draw code makes no new strings or objects per frame)
  F5: '5px ' + FONT_DISPLAY, F6: '6px ' + FONT_DISPLAY, F7: '7px ' + FONT_DISPLAY, F8: '8px ' + FONT_DISPLAY, F9: '9px ' + FONT_DISPLAY,
  CANVAS: '#d2c09a', WOOD: '#8a6440', VELVET: '#5a0c22', VELVET2: '#7a1430',
  // stencils on the props (no brand names; the show is Piwi's)
  STENCILS: ['PIWI SQUIRMIN\' WORLD TOUR', 'FRAGILE', 'THIS SIDE UP', 'PROPS · ACT 2', 'STAGE LEFT', 'DO NOT DROP', 'LIGHTS', 'CONFETTI', 'SPARE DUMMY HEADS', 'WIGS'],
  // the velvet curtain that whips away after a seam: travelling up, the curtain flies up out of view, and so on
  curtain(ctx, x0, y0, W, H, side, k) {
    const e = 1 - (1 - k) * (1 - k) * (1 - k);   // ease out
    let ox = 0, oy = 0;
    if (side === 'top') oy = -e * H; else if (side === 'bottom') oy = e * H; else if (side === 'left') ox = -e * W; else ox = e * W;
    ctx.save();
    ctx.fillStyle = this.VELVET; ctx.fillRect(x0 + ox, y0 + oy, W, H);
    ctx.fillStyle = this.VELVET2;
    for (let x = 0; x < W; x += 26) ctx.fillRect(x0 + ox + x + 6, y0 + oy, 9, H);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let x = 0; x < W; x += 26) ctx.fillRect(x0 + ox + x + 20, y0 + oy, 4, H);
    // the gold fringe on its leading edge
    ctx.fillStyle = '#e8b83a';
    if (side === 'top') ctx.fillRect(x0, y0 + oy + H - 6, W, 6);
    else if (side === 'bottom') ctx.fillRect(x0, y0 + oy, W, 6);
    else if (side === 'left') ctx.fillRect(x0 + ox + W - 6, y0, 6, H);
    else ctx.fillRect(x0 + ox, y0, 6, H);
    ctx.restore();
  },
  // one flight case (props, the Wormhole's neighbours): bottom centre (cx, by)
  caseBox(ctx, cx, by, cw, ch, k) {
    ctx.fillStyle = '#26222c'; ctx.strokeStyle = this.INK; ctx.lineWidth = 2; rr(ctx, cx - cw / 2, by - ch, cw, ch, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(cx - cw / 2 + 2, by - ch + 2, cw - 4, 2); ctx.fillRect(cx - cw / 2 + 2, by - 4, cw - 4, 2);
    ctx.fillStyle = '#e8eaee'; ctx.fillRect(cx - cw / 2, by - ch, 5, 5); ctx.fillRect(cx + cw / 2 - 5, by - ch, 5, 5); ctx.fillRect(cx - cw / 2, by - 5, 5, 5); ctx.fillRect(cx + cw / 2 - 5, by - 5, 5, 5);
    ctx.fillStyle = 'rgba(240,230,200,0.85)'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.STENCILS[k % this.STENCILS.length], cx, by - ch / 2, cw - 10);
  },
  RACK: ['#ff7ab0', '#3ac8d8', '#ffd84a', '#8a5aff'],
  // a wormhole swallowing the screen: rings spin out from the warp until the view is all wormhole
  swirl(ctx, play, Wf, x0, y0, W, H) {
    const t = play.t, k = clamp(Wf.t / 1.1, 0, 1), cx = Wf.x, cy = Wf.y;
    const R = Math.hypot(Math.max(cx - x0, x0 + W - cx), Math.max(cy - y0, y0 + H - cy)) * easeInOut(k) + 30;
    ctx.save();
    ctx.fillStyle = '#16072c'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.lineWidth = Math.max(6, R * 0.06);
    for (let q = 0; q < 7; q++) {
      const rr2 = R * (1 - q * 0.13); if (rr2 < 8) break;
      const a = t * (2.2 + q * 0.6) * (q % 2 ? -1 : 1) + q;
      ctx.strokeStyle = q % 3 === 0 ? '#b46aff' : q % 3 === 1 ? '#3ae8d8' : '#ff7ad8';
      ctx.beginPath(); ctx.arc(cx, cy, rr2, a, a + 3.6); ctx.stroke();
    }
    ctx.fillStyle = '#05010e'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * 0.12), 0, TAU); ctx.fill();
    ctx.restore();
  },
  // the trunk a wormhole lives in: a battered touring trunk stood on end, lid open, the wormhole spinning inside.
  // (x, by) = bottom centre; k = 0..1 how wide the wormhole is open; locked: padlocked shut
  trunk(ctx, x, by, t, k, label, locked, near) {
    const w = 46, h = 62, x0 = x - w / 2, y0 = by - h, INK = this.INK;
    ctx.save();
    ctx.lineJoin = 'round';
    // the lid swung open to the right
    if (!locked) {
      ctx.fillStyle = '#3a3440'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + w, y0 + 2); ctx.lineTo(x0 + w + 12, y0 + 8); ctx.lineTo(x0 + w + 12, by - 6); ctx.lineTo(x0 + w, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b8bcc4'; ctx.fillRect(x0 + w + 2, y0 + 10, 8, 3); ctx.fillRect(x0 + w + 2, by - 14, 8, 3);
    }
    // the body: black with aluminium edges and corner caps
    ctx.fillStyle = '#26222c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; rr(ctx, x0, y0, w, h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd4';
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, 3); ctx.fillRect(x0 + 1, by - 4, w - 2, 3); ctx.fillRect(x0 + 1, y0 + 1, 3, h - 2); ctx.fillRect(x0 + w - 4, y0 + 1, 3, h - 2);
    ctx.fillStyle = '#e8eaee';
    ctx.fillRect(x0, y0, 7, 7); ctx.fillRect(x0 + w - 7, y0, 7, 7); ctx.fillRect(x0, by - 7, 7, 7); ctx.fillRect(x0 + w - 7, by - 7, 7, 7);
    // the opening: the wormhole
    const ix = x0 + 7, iy = y0 + 9, iw = w - 14, ih = h - 18;
    ctx.fillStyle = '#12061e'; ctx.fillRect(ix, iy, iw, ih);
    if (!locked) {
      ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
      const cx = ix + iw / 2, cy = iy + ih / 2, R = (iw * 0.62) * (0.75 + 0.25 * k);
      ctx.lineWidth = 4.5;
      for (let q = 0; q < 5; q++) {
        const a = t * (3 + q * 0.8) + q * 1.3, r = R * (1 - q * 0.17);
        ctx.strokeStyle = q % 2 ? '#3ae8d8' : '#b46aff';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.25, 0, a, a + 4); ctx.stroke();
      }
      ctx.fillStyle = '#fff4ff'; ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 7);
      ctx.beginPath(); ctx.arc(cx, cy, 2.5 + k * 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
    } else {
      // padlocked: a chain across and Piwi's tag
      ctx.strokeStyle = '#9a9aa4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix, iy + 6); ctx.lineTo(ix + iw, iy + ih - 6); ctx.moveTo(ix + iw, iy + 6); ctx.lineTo(ix, iy + ih - 6); ctx.stroke();
      ctx.fillStyle = '#d8a83a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, x - 6, iy + ih / 2 - 5, 12, 11, 2); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(ix, iy, iw, ih);
    // the stencilled plate on top: WORMHOLE and where it goes
    ctx.fillStyle = '#f2e6c8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, x - 34, y0 - 22, 68, 19, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a1a6a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = TourBackstage.F7; ctx.fillText('WORMHOLE', x, y0 - 16.5);
    ctx.font = TourBackstage.F8; ctx.fillStyle = '#1a1020'; ctx.fillText(label || '→ ???', x, y0 - 8, 64);
    if (near && !locked) {
      const b = Math.sin(t * 6) * 3;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.moveTo(x, y0 - 36 + b); ctx.lineTo(x + 8, y0 - 26 + b); ctx.lineTo(x - 8, y0 - 26 + b); ctx.fill();
      ctx.font = TourBackstage.F9; ctx.fillText('UP', x, y0 - 42 + b);
    }
    ctx.restore();
  }
};

/* ---------- the Wormhole entity: spawn { type: 'warp', exit: 'warp', label?, needs? } ---------- */
// A tour gate (exit key, level clear) that only goes when Brady presses Up at it (never by a plain touch), with the
// validator's box: 40 wide, 56 tall, standing on its tile (VALIDATOR_EXITS.warp).
{
  class TourWarp extends ENTITY_TYPES.gate {
    constructor(g, s) {
      super(g, s);
      this.exitKey = s.exit || 'warp'; this.secret = true; this.isWarp = true;
      this.w = 40; this.h = 56; this.x = s.x - 20; this.y = s.y - 56;
      const ex = g.level && g.level.exits && g.level.exits[this.exitKey];
      this.label = String(s.label || (ex && ex.label) || '').toUpperCase();
      this.plate = '→ ' + (this.label || '???');
      this.near = false; this.suck = null; this.open = 0;
    }
    get locked() { return !!this.s.needs && !TourNeeds.ok(this.s.needs); }
    update(dt) {
      this.t += dt; this.near = Math.max(0, (this.near || 0) - dt * 4);
      this.open = approach(this.open, this.suck != null ? 1 : this.near > 0 ? 0.8 : 0.4, dt * 2);
      if (this.suck != null) {
        this.suck += dt;
        const p = this.g.player;
        if (p && p.state === 'portal') { p.x = lerp(p.x, this.cx - p.w / 2, Math.min(1, dt * 10)); p.y = lerp(p.y, this.y + this.h / 2 - p.h / 2, Math.min(1, dt * 6)); }
        if (this.suck > 0.8 && !this.cleared) { this.cleared = true; this.g.levelClear(this); }
      }
    }
    touchPlayer(p) {
      if (this.used || p.dead || p.state !== 'play' || this.g.state !== 'play') return;
      this.near = 1;
      if (!(Input.upPressed || (Input.up && p.onGround))) return;
      if (this.locked) {
        if (!(this.toldT > this.t)) { this.toldT = this.t + 3; this.g.toast('PADLOCKED: HELD BY ORDER OF PIWI SQUIRMIN\''); Sound.play('bump'); }
        return;
      }
      // in he goes: Brady spins into the wormhole, then the level clears through this exit
      this.used = true; this.suck = 0;
      p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3;
      TourKit.sfx('portal', 'portal', { vol: 0.8 }); Sound.play('portal', { pitch: 0.6, vol: 0.5 });
      this.g.shake(4); this.g.burst(this.cx, this.y + this.h / 2, 18, '#b46aff', 'spark');
    }
    draw(ctx) { TourBackstage.trunk(ctx, this.cx, this.y + this.h, this.t, this.open, this.plate, this.locked, this.near > 0.5 && !this.used); }
    get light() { return { r: 110, c: 'rgba(180,106,255,', x: this.cx, y: this.y + 28 }; }
  }
  ENTITY_TYPES.warp = TourWarp;
}
// a Wormhole's clear: Brady stays inside (no walk to the gate, no victory pose) while the wormhole fills the screen
TourHooks.on('levelClear', (play, gate) => {
  if (!gate || !gate.isWarp) return;
  const p = play.player; if (p) { p.state = 'portal'; p.portalT = 1; p.vx = 0; p.vy = 0; }
  play.warpFx = { t: 0, x: gate.cx, y: gate.y + gate.h / 2 };
});
TourHooks.on('playUpdate', (play, dt) => { if (play.warpFx) play.warpFx.t += dt; });

/* ---------- Piwi's wind-up stagehand mice: harmless, they trundle a prop about and scatter with a squeak ---------- */
{
  class BkMouse extends Ent {
    constructor(g, s) { super(g, s, 22, 16); this.dir = s.dir || (s.x % 2 ? 1 : -1); this.friendly = true; this.speed = 1.6 * TS; this.flee = 0; this.prop = s.prop != null ? s.prop : Math.floor(s.x / TS) % 3; }
    update(dt) {
      this.t += dt; if (this.flee > 0) this.flee -= dt;
      const A = this.g.area, sp = this.speed * (this.flee > 0 ? 2.6 : 1), nx = this.x + this.dir * sp * dt;
      const ahead = Math.floor((this.dir > 0 ? nx + this.w + 1 : nx - 1) / TS), ty = Math.floor((this.y + this.h - 4) / TS), below = Math.floor((this.y + this.h + 2) / TS);
      const wall = SOLID[tileAt(A, ahead, ty)], gap = !(SOLID[tileAt(A, ahead, below)] || tileAt(A, ahead, below) === T.SEMI);
      if (wall || gap || ahead <= 0 || ahead >= A.W - 1) this.dir = -this.dir; else this.x = nx;
      const p = this.g.player;
      if (p && !p.dead && this.flee <= 0 && Math.abs(p.cx - this.cx) < 3 * TS && Math.abs(p.cy - this.cy) < 2 * TS) {
        this.flee = 1.4; this.dir = p.cx < this.cx ? 1 : -1;
        this.g.parts.text(this.cx, this.y - 8, 'SQUEAK!', '#ffe6f0'); Sound.play('pick', { pitch: 2.2, vol: 0.3 });
      }
    }
    draw(ctx) {
      const x = this.cx, y = this.y + this.h, d = this.dir, t = this.t, INK = TourBackstage.INK, bob = Math.sin(t * 18) * (this.flee > 0 ? 1.2 : 0.6);
      ctx.save(); ctx.lineJoin = 'round';
      // the prop it pushes: a tiny piñata, a hat box or a spotlight gel
      const px = x + d * 15;
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      if (this.prop === 0) { ctx.fillStyle = '#ff5fa0'; rr(ctx, px - 6, y - 12, 12, 10, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(px - 6, y - 8, 12, 2.5); }
      else if (this.prop === 1) { ctx.fillStyle = '#7ac8ff'; ctx.beginPath(); ctx.ellipse(px, y - 6, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(px - 5, y - 9, 10, 2); }
      else { ctx.fillStyle = '#c8b07a'; ctx.fillRect(px - 6, y - 11, 12, 11); ctx.strokeRect(px - 6, y - 11, 12, 11); ctx.fillStyle = INK; ctx.fillRect(px - 3, y - 7, 6, 1.5); }
      // the tin mouse on its wheels
      ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.ellipse(x, y - 7 + bob * 0.3, 10, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8c8d4'; ctx.beginPath(); ctx.ellipse(x - d * 2, y - 9 + bob * 0.3, 5, 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffb6c8'; ctx.beginPath(); ctx.arc(x + d * 6, y - 13, 3.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + d * 8, y - 8, 1.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff7aa0'; ctx.beginPath(); ctx.arc(x + d * 10.5, y - 6.5, 1.4, 0, TAU); ctx.fill();
      // the wind-up key turning on its back, the tail
      const ka = t * (this.flee > 0 ? 18 : 7);
      ctx.strokeStyle = '#d8a83a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - d * 3, y - 13); ctx.lineTo(x - d * 3, y - 17); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x - d * 3, y - 19, 4 * Math.abs(Math.cos(ka)) + 0.5, 2.5, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - d * 10, y - 6); ctx.quadraticCurveTo(x - d * 16, y - 12 + bob, x - d * 18, y - 5); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 5, y - 1, 2, 0, TAU); ctx.arc(x + 5, y - 1, 2, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  ENTITY_TYPES.bkMouse = BkMouse;
}

/* ---------- the backstage themes: tiles, painted backdrops, props ---------- */
// stage deck: black-painted boards with scuffs and coloured spike tape
const bkDeck = {
  style: 'stage', cap: '#3a3238', capHi: '#5a4e56', dirt: '#2a2228', dirt2: '#140e14', rock: '#2a2228',
  paint(ctx, rng, o) {
    ctx.fillStyle = '#231c22'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#2e262c'; for (let y = 2; y < TS; y += 8) ctx.fillRect(0, y, TS, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect((o.variant || 0) % 2 ? 9 : 23, 0, 1, TS);
    if (rng() < 0.2) { ctx.fillStyle = rng() < 0.5 ? '#ffd23a' : '#3ad8ff'; ctx.fillRect(6 + rng() * 14, 4 + rng() * 12, 7, 2); }
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#4a4046'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = '#6a5e64'; ctx.fillRect(x0, 0, x1 - x0, 1.2);
    if (rng() < 0.3) { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x0 + rng() * (x1 - x0 - 8), 1, 8, 2); }
  }
};
// catwalk grating: steel with a diamond mesh and a toe-board
const bkGrating = {
  style: 'truss', c1: '#9aa0a8', c2: '#5a6068',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#4a5058'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#8a929c'; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.strokeStyle = 'rgba(20,20,26,0.6)'; ctx.lineWidth = 1;
    for (let x = x0 - 6; x < x1; x += 6) { ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 6, 9); ctx.moveTo(x + 6, 3); ctx.lineTo(x, 9); ctx.stroke(); }
    ctx.fillStyle = '#1a1c22'; ctx.fillRect(x0, 9, x1 - x0, 1.5);
  }
};
// a flight case as a brick, a steel truss block as hard
const bkCaseBrick = {
  style: 'amp', c1: '#2a2630', c2: '#121016', mortar: '#c8ccd4',
  paint(ctx) {
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#2a2630'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = '#e8eaee'; ctx.fillRect(0, 0, 6, 6); ctx.fillRect(TS - 6, 0, 6, 6); ctx.fillRect(0, TS - 6, 6, 6); ctx.fillRect(TS - 6, TS - 6, 6, 6);
    ctx.fillStyle = '#d8b84a'; ctx.fillRect(TS / 2 - 4, TS / 2 - 2, 8, 4);
  }
};
const bkTruss = {
  c1: '#5a5e68', c2: '#2a2c34',
  paint(ctx) {
    ctx.fillStyle = '#1e2026'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#8a909a'; ctx.lineWidth = 2.5;
    ctx.strokeRect(2, 2, TS - 4, TS - 4);
    ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(TS - 2, TS - 2); ctx.moveTo(TS - 2, 2); ctx.lineTo(2, TS - 2); ctx.stroke();
  }
};
Object.assign(BGPaint, {
  // the theatre's back wall: dark brick, conduit, a steel ladder, stencilled crew notices
  bkWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    const a = shade(L.color, -0.22), b = shade(L.color, 0.07);
    for (let y = 0; y < H; y += 14) { const off = (y / 14) % 2 ? 0 : 15; for (let x = -off; x < BG_W; x += 30) { ctx.fillStyle = rng() < 0.55 ? a : b; ctx.fillRect(x + 1, y + 1, 28, 12); } }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 60; x < BG_W; x += 230 + rng() * 120) ctx.fillRect(x, 0, 7, H);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = 61; x < BG_W; x += 260) ctx.fillRect(x, 0, 2, H);
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    const notes = ['QUIET BACKSTAGE', 'CREW ONLY', 'NO WHISTLING', 'PROPS RETURN HERE', 'MIND THE FLY RAIL'];
    for (let x = 140, k = 0; x < BG_W; x += 380, k++) { ctx.fillStyle = 'rgba(240,220,190,0.18)'; ctx.fillText(notes[k % notes.length], x, 120 + (k % 3) * 70); }
  },
  // the backs of painted scenery flats: raw canvas on wooden frames, braced to the floor with sandbags
  bkFlats(ctx, L, rng, H) {
    let x = 10;
    while (x < BG_W) {
      const w = 80 + rng() * 70, h = 170 + rng() * 120, top = L.base - h, x0 = x;
      wrapDraw(x0, w + 40, X => {
        ctx.fillStyle = TourBackstage.CANVAS; ctx.fillRect(X, top, w, h);
        // paint bleeding round the edge from the front
        ctx.fillStyle = ['#ff6a8a', '#3ac8a0', '#ffc83a', '#7a8aff'][Math.floor(rng() * 4)]; ctx.fillRect(X, top, 4, h);
        ctx.fillStyle = TourBackstage.WOOD; ctx.fillRect(X, top, w, 7); ctx.fillRect(X, L.base - 7, w, 7); ctx.fillRect(X + w - 7, top, 7, h); ctx.fillRect(X + 4, top, 6, h);
        ctx.fillRect(X, top + h * 0.48, w, 6);
        // the brace and its sandbag
        ctx.strokeStyle = TourBackstage.WOOD; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X + w * 0.6, top + h * 0.3); ctx.lineTo(X + w + 30, L.base - 4); ctx.stroke();
        ctx.fillStyle = '#6a5a40'; rr(ctx, X + w + 14, L.base - 16, 26, 16, 6); ctx.fill(); ctx.fillStyle = '#4a3e2c'; ctx.fillRect(X + w + 25, L.base - 17, 4, 5);
        ctx.fillStyle = 'rgba(60,40,30,0.55)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(TourBackstage.STENCILS[Math.floor(rng() * 6)], X + w / 2, top + h * 0.3, w - 16);
        ctx.fillText('FLAT ' + (1 + Math.floor(rng() * 40)), X + w / 2, top + h * 0.7);
      });
      x += w + 60 + rng() * 90;
    }
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // the fly system overhead: pipes with stage lanterns, hanging ropes, sandbag weights
  bkFly(ctx, L, rng, H) {
    for (const py of [34, 92]) {
      ctx.fillStyle = '#3a3e46'; ctx.fillRect(0, py, BG_W, 6); ctx.fillStyle = '#5a606a'; ctx.fillRect(0, py, BG_W, 2);
      for (let x = 20 + rng() * 40; x < BG_W; x += 70 + rng() * 60) {
        ctx.fillStyle = '#16141a'; ctx.fillRect(x - 1, py + 6, 3, 6); rr(ctx, x - 9, py + 11, 18, 22, 4); ctx.fill();
        ctx.fillStyle = ['#ffd86a', '#ff7aa0', '#7ad8ff', '#b4ff7a'][Math.floor(rng() * 4)]; ctx.beginPath(); ctx.ellipse(x, py + 33, 7, 3, 0, 0, TAU); ctx.fill();
      }
    }
    for (let x = 30 + rng() * 60; x < BG_W; x += 90 + rng() * 120) {
      const len = 120 + rng() * 200;
      ctx.strokeStyle = '#a8906a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
      if (rng() < 0.6) { ctx.fillStyle = '#7a6a4a'; rr(ctx, x - 9, len, 18, 22, 7); ctx.fill(); ctx.fillStyle = '#5a4c34'; ctx.fillRect(x - 2, len - 3, 4, 6); }
      else { ctx.strokeStyle = '#9a9aa4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, len + 6, 6, -Math.PI / 2, Math.PI); ctx.stroke(); }
    }
  }
});
{
  const base = Object.assign({}, THEMES.backstage, {
    music: 'secret', particles: 'dust', spotlights: false, darkness: 0.18, stars: 0, celestial: { type: 'none' },
    sky: ['#0c080e', '#1a1218', '#2a1a22'], horizonGlow: '#ffb86a', fog: '#ffb86a',
    ground: bkDeck, semi: bkGrating, brick: bkCaseBrick, hard: bkTruss, pillar: { c1: '#3a3e46', c2: '#1a1c22', cap: '#8a909a', style: 'column' },
    accent: '#d8a83a', decor: ['bkCase', 'bkGhostLight', 'bkRack', 'bkCase'], backstage: true
  });
  const mk = (name, layers, extra) => Object.assign({}, base, { name, layers }, extra || {});
  THEMES.bk_rigging = mk('The Rigging', [
    { kind: 'bkWall', color: '#2a1a1e', base: 0, f: 0.06 },
    { kind: 'bkFly', color: '#3a3e46', base: 0, f: 0.22 }
  ]);
  THEMES.bk_dock = mk('The Loading Dock', [
    { kind: 'bkWall', color: '#262024', base: 0, f: 0.06 },
    { kind: 'bkFlats', color: '#2e2428', base: 400, f: 0.25 }
  ], { darkness: 0.1 });
  THEMES.bk_under = mk('Under the Stage', [
    { kind: 'bkWall', color: '#1c1418', base: 0, f: 0.06 },
    { kind: 'bkFly', color: '#2a2c32', base: 0, f: 0.3 }
  ], { darkness: 0.3 });
  THEMES.bk_wings = mk('The Wings', [
    { kind: 'curtains', color: '#5a0c22', base: 0, f: 0.05 },
    { kind: 'bkFlats', color: '#2e2428', base: 400, f: 0.22 }
  ], { darkness: 0.12 });
}
// props (Decor: drawn each frame, so plain shapes, no gradients or per-frame objects)
Object.assign(Decor, {
  // the ghost light: a bare bulb in a cage on a stand, left burning when the theatre is dark
  bkGhostLight(ctx, x, y, t) {
    ctx.save(); const INK = TourBackstage.INK;
    ctx.globalAlpha = 0.16 + 0.03 * Math.sin(t * 3); ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x, y - 78, 46, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y - 78, 22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x, y - 6); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 8); ctx.lineTo(x + 12, y); ctx.stroke();
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x, y - 79, 6.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y - 79, 9, 0, TAU); ctx.moveTo(x - 9, y - 79); ctx.lineTo(x + 9, y - 79); ctx.moveTo(x, y - 88); ctx.lineTo(x, y - 70); ctx.stroke();
    ctx.restore();
  },
  // a flight case on the floor, with a stencil and sometimes a smaller one on top
  bkCase(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, w = 44 + (s % 3) * 10, h = 26 + (s % 4) * 6;
    ctx.save(); TourBackstage.caseBox(ctx, x, y, w, h, s); if (s % 2) TourBackstage.caseBox(ctx, x - 4, y - h, w * 0.6, h * 0.8, s + 3); ctx.restore();
  },
  // a costume rail: a frilly dress, a sombrero-sized party hat, a striped jacket, a spare dummy suit
  bkRack(ctx, x, y, t) {
    const INK = TourBackstage.INK; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 30, y - 62); ctx.lineTo(x + 30, y - 62); ctx.lineTo(x + 30, y); ctx.stroke();
    const sway = Math.sin(t * 1.5) * 1.5, cols = TourBackstage.RACK;
    for (let k = 0; k < 4; k++) {
      const cx = x - 21 + k * 14 + sway; ctx.fillStyle = cols[k]; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx, y - 60); ctx.lineTo(cx - 7, y - 50); ctx.lineTo(cx - 9, y - 22); ctx.lineTo(cx + 9, y - 22); ctx.lineTo(cx + 7, y - 50); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  },
  // a stencilled crew notice on a little easel
  bkCrewSign(ctx, x, y, t, th, d) {
    const INK = TourBackstage.INK; ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 6, y - 30); ctx.moveTo(x + 10, y); ctx.lineTo(x + 6, y - 30); ctx.stroke();
    ctx.fillStyle = '#f2d23a'; rr(ctx, x - 26, y - 50, 52, 24, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1416'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CREW ONLY', x, y - 42); ctx.fillText((d && d.seed % 2) ? 'MIND THE GAP' : 'BACKSTAGE', x, y - 33);
    ctx.restore();
  },
  // a rope hanging down from the flies through a hole in the deck (the way back down to the stage)
  bkRopeDown(ctx, x, y, t) {
    ctx.save(); const sw = Math.sin(t * 1.3) * 2;
    ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 420); ctx.quadraticCurveTo(x + sw, y - 150, x + sw * 1.5, y + 70); ctx.stroke();
    ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 1; for (let q = y - 400; q < y + 60; q += 9) { ctx.beginPath(); ctx.moveTo(x - 1.5, q); ctx.lineTo(x + 1.5, q + 4); ctx.stroke(); }
    ctx.fillStyle = '#f2d23a'; ctx.strokeStyle = TourBackstage.INK; ctx.lineWidth = 1.5; rr(ctx, x + 10, y - 64, 46, 18, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1416'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↓ TO STAGE', x + 33, y - 55);
    ctx.restore();
  },
  // a sandbag on a rope dangling down from above the top of the view: the tell for a Rigging above
  bkDangle(ctx, x, y, t) {
    ctx.save(); const sw = Math.sin(t * 1.1) * 4, by = y - 92;
    ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, by - 400); ctx.quadraticCurveTo(x + sw * 0.5, by - 200, x + sw, by); ctx.stroke();
    ctx.fillStyle = '#7a6a4a'; ctx.strokeStyle = TourBackstage.INK; ctx.lineWidth = 2; rr(ctx, x + sw - 10, by, 20, 24, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a4c34'; ctx.fillRect(x + sw - 3, by - 2, 6, 6);
    ctx.fillStyle = 'rgba(240,220,180,0.8)'; ctx.font = TourBackstage.F5; ctx.textAlign = 'center'; ctx.fillText('SAND', x + sw, by + 14);
    ctx.restore();
  },
  // the back of one painted flat standing in the foreground
  bkFlatBack(ctx, x, y, t, th, d) {
    const w = 70, h = 120, INK = TourBackstage.INK; ctx.save();
    ctx.fillStyle = TourBackstage.CANVAS; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = TourBackstage.WOOD; ctx.fillRect(x - w / 2, y - h, w, 6); ctx.fillRect(x - w / 2, y - h / 2, w, 5); ctx.fillRect(x - w / 2, y - 6, w, 6); ctx.fillRect(x - w / 2, y - h, 6, h); ctx.fillRect(x + w / 2 - 6, y - h, 6, h);
    ctx.fillStyle = 'rgba(60,40,30,0.6)'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('THIS SIDE AWAY', x, y - h * 0.72); ctx.fillText('FROM AUDIENCE', x, y - h * 0.65);
    ctx.restore();
  },
  // a curtain flap at the very edge of the stage, stirring (the tell for the Wings)
  bkCurtainFlap(ctx, x, y, t) {
    ctx.save(); const sw = Math.sin(t * 2.2) * 5;
    ctx.fillStyle = TourBackstage.VELVET; ctx.strokeStyle = TourBackstage.INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 16, y - 150); ctx.lineTo(x + 10, y - 150); ctx.quadraticCurveTo(x + 14 + sw, y - 70, x + 6 + sw * 1.6, y); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TourBackstage.VELVET2; ctx.fillRect(x - 8, y - 150, 5, 150);
    ctx.fillStyle = '#e8b83a'; ctx.fillRect(x - 16, y - 150, 26, 5);
    ctx.restore();
  },
  // a thick crash mat on the floor of a trap room (the bounce surface itself is the tile under it)
  bkMatTag(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#f2d23a'; ctx.strokeStyle = TourBackstage.INK; ctx.lineWidth = 1.5; rr(ctx, x - 20, y - 22, 40, 12, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1416'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CRASH MAT', x, y - 15.5); ctx.restore();
  }
});
// the counterweight lift's platform: a steel arbor with stacked iron weights
PlatformArt.bkArbor = function (ctx, e) {
  const INK = TourBackstage.INK, x = e.x, y = e.y, w = e.w; ctx.save();
  ctx.fillStyle = '#4a4e58'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x, y, w, 12); ctx.strokeRect(x, y, w, 12);
  ctx.fillStyle = '#7a808a'; ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 6, y - 600); ctx.moveTo(x + w - 6, y); ctx.lineTo(x + w - 6, y - 600); ctx.stroke();
  ctx.restore();
};
// the Under-Stage pit's tell (TourSeams.TELLS): the crash mat spawn draws nothing itself (the mat is the tile)
TourSeams.TELLS.bkCrashMat = true;

/* ---------- pieces ---------- */
// a counterweight lift in a backstage room (stamp legend ['piece', 'bkLift', { rise }]): an arbor that rides up and
// down; the validator stands on its column (ghosts)
Tour.pieces.bkLift = function (st, o) {
  const rise = o.rise || 4, x = st.x;
  st.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: o.speed || 1.4, skin: 'bkArbor' });
  for (let y = st.gy - rise; y <= st.gy; y++) for (let k = 0; k < 3; k++) st.B.ghosts.push([x + k, y]);
  return x + 3;
};
// the Wings (a strip's first step): the start stays open at x = 0 with a stirring curtain flap; pressing left off the
// start goes through to the wings: { to, rows: 3 }
Tour.pieces.wings = function (st, o) {
  const B = st.B, gy = st.gy, n = o.rows || 3;
  for (let y = gy - n; y < gy; y++) B.set(0, y, T.EMPTY);
  B.decorAt('bkCurtainFlap', 0, gy, 0);
  TourSeams.add(B, { side: 'left', a: gy - n, b: gy - 1, to: o.to });
  return st.x;
};
// a Rigging over a strip: a launcher (a spring, or a bouncy crash mat) under an open ceiling throws Brady off the
// top of the screen; a sandbag dangling down is the tell: { to, x (default st.x + 1), w: 3, back: anchor name }
Tour.pieces.rigging = function (st, o) {
  const B = st.B, x = o.x != null ? o.x : st.x + 1, w = o.w || 3;
  st.floor(x - 1, x + w);
  for (let k = 0; k < w; k++) B.clearCol(x + k, 0, st.gy - 1);
  if (o.launcher === 'mat') { for (let k = 0; k < w; k++) B.setSurf(x + k, st.gy, SURF.BOUNCE); }
  else { B.spawn('spring', x + 1, st.gy - 1, {}); B.springs.push([x + 1, st.gy - 1]); }
  B.decorAt('bkDangle', x + 1, Math.max(4, st.gy - 2), 0);
  TourSeams.add(B, { side: 'top', a: x - 1, b: x + w, to: o.to });
  if (o.back) B.anchor(o.back, x + w + 1, st.gy - 1);
  return Math.max(st.x, x + w + 1);
};
// (exposed for the browser tests)
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourBackstage = TourBackstage; } } catch (e) { /* not in a browser */ }
