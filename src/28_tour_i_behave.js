/* ============================================================
   World tour: the enemy behaviour library (LEVEL_OVERHAUL.md §4).
   TourEnemy.make({ behavior: '<name>', ...params }) (or TourFlyer /
   TourSwimmer .make) picks a behaviour up: think(e, dt) runs its
   state machine; hit / touch / draw hooks are optional. Every
   attack has a tell of at least 0.4 s (a pose and a sound), every
   enemy a clearly drawn weak moment; none can kill outright, push
   Brady into a pit or steal a postcard (§4.1).
   Modes passed to art(ctx, e, x, y, mode, t) are the state names.
   ============================================================ */
const TourBehave = {};
const TB = {
  // state machine helpers: e.bst = state, e.bt = seconds in it
  go(e, st, t) { e.bst = st; e.bt = 0; e.btMax = t || 0; e.mode = st; },
  p(e) { const p = e.g.player; return p && !p.dead && p.state === 'play' ? p : null; },
  dist(e, p) { return p ? Math.hypot(p.cx - e.cx, p.cy - e.cy) / TS : 1e9; },
  face(e, p) { if (p) e.dir = sign(p.cx - e.cx) || e.dir; },
  tell(e, name, fb) { if (e.g.onScreen(e, 120)) TourKit.sfx(name, fb || 'select', { vol: 0.45, pitch: 1.3 }); },
  par(e, k, d) { const c = e.cfg || {}; return c[k] != null ? c[k] : d; },
  hidden(p) { return !!(p && (p.boxed || (p.hands && p.hands.id === 'box' && p.crouch))); },
  solidAt(g, px, py) { return SOLID[tileAt(g.area, Math.floor(px / TS), Math.floor(py / TS))]; },
  floorUnder(g, px, py) { for (let y = Math.floor(py / TS); y < g.area.H; y++) { const t = tileAt(g.area, Math.floor(px / TS), y); if (SOLID[t] || t === T.SEMI) return y; } return -1; },
  noGrab(g, tx) { return (g.area.noGrabs || []).some(([a, b]) => tx >= a && tx <= b); },
  // the lights in the area (cached per frame): Brady's own glow, lit entities, lit decor
  lit(e) {
    const g = e.g;
    if (g.litFrame !== g.t) { g.litFrame = g.t; g.litList = g.collectLights ? g.collectLights(g.camX - 400, g.camY - 300) : []; }
    for (const L of g.litList) { if (L.e === e) continue; if (Math.hypot(L.x - e.cx, L.y - e.cy) < L.r * 0.75) return true; }
    return false;
  }
};
// a flashing outline / exclamation drawn over an enemy in its tell
TB.tellMark = (ctx, e, col) => { const k = 0.5 + 0.5 * Math.sin(e.t * 30); ctx.save(); ctx.fillStyle = col || '#ffd84a'; ctx.globalAlpha = 0.6 + 0.4 * k; ctx.font = `bold 14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', e.cx, e.y - 10 - k * 3); ctx.restore(); };

/* 1. splitter: stomp it and it bursts into n children that hop twice and fade; harmless for their first 0.3 s */
TourBehave.splitter = {
  think(e, dt) { if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk'; },
  hit(e, kind, src) {
    if (kind !== 'stomp' && kind !== 'spin') return undefined;
    const n = TB.par(e, 'n', 3), child = TB.par(e, 'child', null), g = e.g;
    e.mode = 'burst'; g.burst(e.cx, e.cy, 16, e.cfg.burst || '#fff8e0', 'confetti'); TB.tell(e, 'pop', 'stomp');
    if (child && ENTITY_TYPES[child]) for (let k = 0; k < n; k++) { const C = ENTITY_TYPES[child]; const c = new C(g, { x: e.cx + (k - (n - 1) / 2) * 14, y: e.y + e.h, dir: k % 2 ? 1 : -1, child: true, life: TB.par(e, 'childLife', 4) }); c.vy = -8 * TS; c.vx = (k - (n - 1) / 2) * 1.5 * TS; g.spawn(c); }
    return undefined;   // the default stomp defeats the parent
  }
};
// children (any enemy spawned with child: true): harmless for 0.3 s, fade out after `life`
{
  const up = TourEnemy.prototype.update;
  TourEnemy.prototype.update = function (dt) {
    if (this.s && this.s.child && !this.dead) { this.childT = (this.childT || 0) + dt; if (this.childT > (this.s.life || 4)) { this.remove = true; this.g.burst(this.cx, this.cy, 6, '#ffffff', 'dust'); return; } }
    return up.call(this, dt);
  };
  const tp = TourEnemy.prototype.touchPlayer;
  TourEnemy.prototype.touchPlayer = function (p) { if (this.s && this.s.child && (this.childT || 0) < 0.3) return; const B = TourBehave[this.behavior]; if (B && B.touch && B.touch(this, p)) return; return tp.call(this, p); };
  const hit = TourEnemy.prototype.hit;
  TourEnemy.prototype.hit = function (kind, src) {
    const B = TourBehave[this.behavior];
    if (B && B.hit && !this.dead) { const r = B.hit(this, kind, src); if (r !== undefined) return r; }
    const r = hit.call(this, kind, src);
    if (r === true && this.s && this.s.child) this.g.addPick();   // a child is worth coins
    return r;
  };
  const think = TourEnemy.prototype.think;
  TourEnemy.prototype.think = function (dt) {
    const B = TourBehave[this.behavior];
    if (B && !this.cfg.think) { this.bt = (this.bt || 0) + dt; this.noWalk = false; B.think(this, dt); return; }
    return think.call(this, dt);
  };
  const dr = TourEnemy.prototype.draw;
  TourEnemy.prototype.draw = function (ctx) { const B = TourBehave[this.behavior]; if (B && B.draw && !this.dead) B.draw(this, ctx, () => dr.call(this, ctx)); else dr.call(this, ctx); };
  const lt = Object.getOwnPropertyDescriptor(TourEnemy.prototype, 'light');
  Object.defineProperty(TourEnemy.prototype, 'light', { configurable: true, get() { const B = TourBehave[this.behavior]; if (B && B.light) { const L = B.light(this); if (L) return L; } return lt.get.call(this); } });
}

/* 2. regrower: a stomp shrinks it (harmless, half speed); it flashes in its last second and regrows */
TourBehave.regrower = {
  think(e, dt) {
    if (e.bst === 'tiny') { e.vx = e.dir * e.speed * 0.5; if (e.bt > TB.par(e, 'regrowT', 3)) TB.go(e, 'regrow'); return; }
    if (e.bst === 'regrow') { e.vx = 0; if (e.bt > 0.4) { TB.go(e, 'walk'); e.tiny = false; e.y -= e.h; e.h *= 2; } return; }
    e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
  },
  hit(e, kind) {
    if (kind === 'stomp' || kind === 'spin') {
      if (e.tiny) return undefined;   // stomped again while tiny: defeated
      e.tiny = true; const b = e.y + e.h; e.h = Math.round(e.h * 0.5); e.y = b - e.h; TB.go(e, 'tiny'); Sound.play('stomp', { pitch: 1.4 }); e.g.burst(e.cx, e.y, 6, '#ffffff', 'spark'); return 'bounce';
    }
    return undefined;   // any other hit defeats it at once
  },
  touch(e) { return e.tiny; },   // harmless while tiny
  draw(e, ctx, d) { if (e.bst === 'tiny' && e.bt > TB.par(e, 'regrowT', 3) - 1 && Math.floor(e.t * 12) % 2) { ctx.save(); ctx.globalAlpha = 0.5; d(); ctx.restore(); return; } if (e.bst === 'regrow') { ctx.save(); const k = 1 + Math.sin(e.t * 40) * 0.06; ctx.translate(e.cx, e.y + e.h); ctx.scale(k, 1 / k); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); return; } d(); }
};
/* 3. camouflage: nearly invisible, shows for 0.6 s every few seconds (and always inside light); hurts either way */
TourBehave.camouflage = {
  think(e, dt) {
    e.vx = 0; e.noWalk = false;
    const every = TB.par(e, 'revealEvery', 2.2);
    if (e.forceShow > 0) e.forceShow -= dt;
    const showing = e.forceShow > 0 || TB.lit(e) || (e.bt % (every + 0.6)) > every;
    if (showing && !e.wasShown) TB.tell(e, 'croak', 'jump');
    e.wasShown = showing; e.mode = showing ? 'show' : 'hidden'; e.visibleNow = showing;
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && !e.visibleNow) return false; return undefined; },
  draw(e, ctx, d) { if (e.visibleNow) { d(); return; } ctx.save(); ctx.globalAlpha = 0.08 + 0.06 * Math.sin(e.t * 5); d(); ctx.restore(); ctx.save(); ctx.strokeStyle = `rgba(200,255,220,${0.25 + 0.15 * Math.sin(e.t * 7)})`; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.ellipse(e.cx, e.cy, e.w * 0.65, e.h * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
};
TourEnemy.prototype.reveal = function (t) { this.forceShow = t || 3; if (this.behavior === 'mimic' && this.bst === 'disguise') TB.go(this, 'reveal'); };
/* 4. burrower: a moving soil bump; under Brady it pops up (tell 0.7 s), stays out a moment (stompable), digs back */
TourBehave.burrower = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'under';
    if (!e.bst) { TB.go(e, 'under'); e.homeY = e.y; e.fullH = e.h; }
    if (e.pinT > 0) { e.pinT -= dt; e.vx = 0; e.mode = 'exposed'; return; }
    if (st === 'under') {
      e.h = 8; e.y = e.homeY + e.fullH - 8;
      const sp = TB.par(e, 'speed', 1.5) * TS, dx = p ? p.cx - e.cx : 0;
      // never leave its own floor
      const ahead = e.cx + sign(dx) * (e.w / 2 + 4), fl = TB.floorUnder(e.g, ahead, e.y + e.h - 2);
      e.vx = Math.abs(dx) > 0.5 * TS && fl === Math.floor((e.y + e.h + 2) / TS) ? sign(dx) * sp : 0;
      if (p && Math.abs(dx) < 0.5 * TS && Math.abs(p.y + p.h - (e.y + e.h)) < 2 * TS) { TB.go(e, 'tell'); TB.tell(e, 'dig', 'crumble'); }
      if (Math.random() < 0.15) e.g.burst(e.cx, e.y + e.h, 1, '#a07850', 'dust');
    } else if (st === 'tell') { e.vx = 0; if (Math.random() < 0.5) e.g.burst(e.cx + (Math.random() - 0.5) * 16, e.y + e.h - 2, 1, '#8a6040', 'debris'); if (e.bt > TB.par(e, 'tell', 0.7)) { TB.go(e, 'pop'); e.h = e.fullH * 1.5; e.y = e.homeY + e.fullH - e.h; } }
    else if (st === 'pop') { e.vx = 0; if (e.bt > 1.2) { TB.go(e, 'exposed'); e.h = e.fullH; e.y = e.homeY; } }
    else if (st === 'exposed') { e.vx = 0; if (e.bt > 1.0) TB.go(e, 'dig'); }
    else if (st === 'dig') { e.vx = 0; if (e.bt > 0.4) TB.go(e, 'under'); }
    e.mode = e.bst;
  },
  hit(e, kind) {
    if (e.bst === 'under' || e.bst === 'tell' || e.bst === 'dig') { if (kind === 'hatdash' || kind === 'globe') { e.pinT = 2; e.h = e.fullH; e.y = e.homeY; TB.go(e, 'exposed'); return true; } return false; }
    if (e.bst === 'pop' && (kind === 'stomp' || kind === 'spin')) return false;
    return undefined;
  },
  touch(e) { return e.bst === 'under' || e.bst === 'tell' || e.bst === 'dig' || e.bst === 'exposed' || e.pinT > 0; },
  draw(e, ctx, d) {
    if (e.bst === 'under' || e.bst === 'tell') { const x = e.cx, y = e.y + e.h, wig = e.bst === 'tell' ? Math.sin(e.t * 50) * 2 : 0; ctx.fillStyle = '#7a5434'; ctx.beginPath(); ctx.ellipse(x + wig, y - 2, 14, 7, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#9a6e48'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 6 + k * 6 + wig, y - 6 - (k % 2) * 2, 2, 0, TAU); ctx.fill(); } if (e.bst === 'tell') TB.tellMark(ctx, e, '#ff9a3a'); return; }
    d();
  }
};
/* 5. trailLayer: leaves a trail on the floor behind it: slime / oil (slippery like ice) or coffee (hot: hurts after 0.3 s) */
TourBehave.trailLayer = {
  think(e, dt) {
    if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
    if (!e.onGround) return;
    const tx = Math.floor(e.cx / TS), ty = Math.floor((e.y + e.h + 2) / TS);
    if (tx !== e.lastTx) { e.lastTx = tx; TourTrails.lay(e.g, tx, ty, TB.par(e, 'trail', 'slime'), TB.par(e, 'trailT', 4)); }
  }
};
// trails on floor tiles: SURF.SLICK (ice-like) or SURF.HOT (hurts after standing 0.3 s); they fade and the tile comes back
SURF.SLICK = 3; SURF.HOT = 4;
const TourTrails = {
  lay(g, tx, ty, kind, t) {
    const A = g.area; if (tx < 0 || ty < 0 || tx >= A.W || ty >= A.H || !SOLID[A.tiles[ty * A.W + tx]]) return;
    A.trails = A.trails || []; const k = ty * A.W + tx;
    const was = A.trails.find(q => q.k === k);
    if (was) { was.t = t; was.kind = kind; return; }
    A.trails.push({ k, tx, ty, t, kind, old: A.surf[k] });
    A.surf[k] = kind === 'coffee' ? SURF.HOT : SURF.SLICK;
  },
  update(g, dt) {
    const A = g.area; if (!A.trails || !A.trails.length) return;
    for (let i = A.trails.length - 1; i >= 0; i--) { const q = A.trails[i]; q.t -= dt; if (q.t <= 0) { A.surf[q.k] = q.old; A.trails.splice(i, 1); } }
    const p = g.player;
    if (p && p.onGround && !p.dead && surfAt(A, p.groundTx, p.groundTy) === SURF.HOT) { p.hotT = (p.hotT || 0) + dt; if (p.hotT > 0.3) { p.hotT = 0; p.hurt({ x: p.x, w: p.w }); } } else if (p) p.hotT = 0;
  },
  draw(ctx, g) {
    const A = g.area; if (!A.trails) return;
    for (const q of A.trails) {
      const x = q.tx * TS, y = q.ty * TS, a = Math.min(1, q.t);
      if (q.kind === 'coffee') { ctx.fillStyle = `rgba(90,50,20,${0.8 * a})`; ctx.fillRect(x, y - 3, TS, 5); ctx.fillStyle = `rgba(255,255,255,${0.35 * a})`; for (let k = 0; k < 2; k++) { const ph = (g.t * 0.8 + k * 0.5 + q.tx * 0.3) % 1; ctx.beginPath(); ctx.arc(x + 8 + k * 14, y - 6 - ph * 14, 2 + ph * 3, 0, TAU); ctx.fill(); } }
      else { const col = q.kind === 'oil' ? '200,180,90' : '170,255,190'; ctx.fillStyle = `rgba(${col},${0.55 * a})`; ctx.beginPath(); ctx.ellipse(x + TS / 2, y, TS * 0.62, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${0.7 * a * (0.5 + 0.5 * Math.sin(g.t * 4 + q.tx))})`; ctx.fillRect(x + 6 + (q.tx * 7) % 14, y - 2, 4, 1.2); }
    }
  }
};
{
  // slick trails are ice for Brady's physics
  const pp = playerPhysics;
  // (the physics reads p.groundTile for ice: a slick trail under Brady counts as ice for that frame)
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) { const A = this.g.area; if (this.onGround && A && A.trails && A.trails.length && surfAt(A, this.groundTx, this.groundTy) === SURF.SLICK) this.groundTile = T.ICE; return pu.call(this, dt, inp); };
  const up = Play.prototype.update;
  Play.prototype.update = function (dt) { const r = up.call(this, dt); if (this.state === 'play' && this.area) TourTrails.update(this, dt); return r; };
}
/* 6. saltSneezer: every few seconds it tilts back ("ah-"), then sneezes a puff 3 tiles ahead that sets into a salt platform */
TourBehave.saltSneezer = {
  think(e, dt) {
    const st = e.bst || 'walk';
    if (st === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (e.bt > TB.par(e, 'every', 3)) { TB.go(e, 'tell'); TB.tell(e, 'sneeze_tell', 'select'); } }
    else if (st === 'tell') { e.vx = 0; if (e.bt > 0.6) { TB.go(e, 'sneeze'); TB.tell(e, 'sneeze', 'splat'); e.g.spawn(new TourSaltPuff(e.g, e.cx + e.dir * 10, e.y + 6, e.dir, TB.par(e, 'platT', 5))); } }
    else if (st === 'sneeze') { e.vx = 0; if (e.bt > 0.3) TB.go(e, 'walk'); }
  },
  draw(e, ctx, d) { if (e.bst === 'tell') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.rotate(-e.dir * 0.18 * Math.min(1, e.bt / 0.3)); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); ctx.fillStyle = '#ffffff'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('AH-', e.cx, e.y - 8); return; } d(); }
};
class TourSaltPuff extends Ent {
  constructor(g, x, y, dir, platT) { super(g, null, 16, 16); this.x = x - 8; this.y = y - 8; this.vx = dir * 3.2 * TS; this.vy = -3 * TS; this.platT = platT; this.friendly = true; }
  update(dt) {
    this.t += dt; this.vy += PHYS.gDown * 0.5 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
    const g = this.g, tx = Math.floor(this.cx / TS), ty = Math.floor((this.y + this.h) / TS);
    if (SOLID[tileAt(g.area, tx, ty)] || this.t > 1.5) {
      // it sets into a 2-tile salt platform (one-way) in the air just above where it landed
      const py = ty - 1; const tiles = [];
      for (const x of [tx, tx + (this.vx > 0 ? 1 : -1)]) if (tileAt(g.area, x, py) === T.EMPTY) { g.setTile(x, py, T.SEMI); tiles.push([x, py]); }
      if (tiles.length) g.spawn(new TourSaltPlat(g, tiles, this.platT));
      g.burst(this.cx, this.cy, 10, '#ffffff', 'dust'); this.remove = true;
    }
  }
  draw(ctx) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(this.cx + Math.cos(k * 1.6 + this.t * 6) * 4, this.cy + Math.sin(k * 1.6 + this.t * 6) * 4, 4, 0, TAU); ctx.fill(); } }
}
class TourSaltPlat extends Ent {
  constructor(g, tiles, life) { super(g, null, tiles.length * TS, 10); this.tiles = tiles; this.life = life; this.x = Math.min(...tiles.map(t => t[0])) * TS; this.y = tiles[0][1] * TS; this.back = true; }
  update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) { for (const [x, y] of this.tiles) if (this.g.area.tiles[y * this.g.area.W + x] === T.SEMI) this.g.setTile(x, y, T.EMPTY); this.remove = true; this.g.burst(this.cx, this.cy, 8, '#ffffff', 'dust'); } }
  draw(ctx) { const a = this.life < 1 && Math.floor(this.t * 10) % 2 ? 0.5 : 1; ctx.save(); ctx.globalAlpha = a; for (const [x, y] of this.tiles) { ctx.fillStyle = '#f4f4fa'; rr(ctx, x * TS + 1, y * TS, TS - 2, 9, 4); ctx.fill(); ctx.fillStyle = '#c8d0e0'; for (let k = 0; k < 4; k++) ctx.fillRect(x * TS + 4 + k * 7, y * TS + 2 + (k % 2) * 3, 2, 2); } ctx.restore(); }
}
/* 7. inhaleBlast: cheeks puff (tell), it inhales (pulls Brady in), blasts a stink cloud, then gasps (stompable) */
TourBehave.inhaleBlast = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'idle'; e.vx = 0;
    if (st === 'idle') { e.mode = 'idle'; TB.face(e, p); if (p && TB.dist(e, p) < TB.par(e, 'range', 5) && e.cool <= 0) { TB.go(e, 'tell'); TB.tell(e, 'inhale', 'fly'); } }
    else if (st === 'tell') { if (e.bt > 0.5) TB.go(e, 'inhale'); }
    else if (st === 'inhale') {
      if (p && !TB.hidden(p) && Math.abs(p.cy - e.cy) < 2 * TS) { const dir = sign(e.cx - p.cx), dx = e.cx + dir * 0 - p.cx; if (Math.abs(dx) > e.w) p.pushX = (p.pushX || 0) + dir * TB.par(e, 'pull', 6) * TS * 0.55; }
      if (Math.random() < 0.6) e.g.burst(e.cx + e.dir * (30 + Math.random() * 60), e.cy + (Math.random() - 0.5) * 30, 1, '#e8f0d0', 'dust');
      if (e.bt > 1.2) { TB.go(e, 'blast'); tourFire(e.g, e.cx + e.dir * 14, e.cy, { vx: e.dir * 4 * TS, w: 26, h: 22, life: 1.2, art: (ctx, s, t) => { ctx.fillStyle = 'rgba(170,200,90,0.75)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(s.cx + Math.cos(k * 1.3 + t * 5) * 7, s.cy + Math.sin(k * 1.3 + t * 5) * 5, 7, 0, TAU); ctx.fill(); } } }); TB.tell(e, 'blast', 'splat'); }
    } else if (st === 'blast') { if (e.bt > 0.4) TB.go(e, 'gasp'); }
    else if (st === 'gasp') { if (e.bt > 1.0) { TB.go(e, 'idle'); e.cool = 1.5; } }
  },
  hit(e, kind) {
    if ((kind === 'disc' || kind === 'laser') && e.bst === 'inhale') { TB.go(e, 'gasp'); return true; }
    if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'gasp') return 'bounce';
    return undefined;
  },
  draw(e, ctx, d) { if (e.bst === 'tell' || e.bst === 'inhale') { ctx.save(); const k = e.bst === 'inhale' ? 1.15 + Math.sin(e.t * 18) * 0.04 : 1 + e.bt * 0.3; ctx.translate(e.cx, e.y + e.h); ctx.scale(k, 1 / Math.sqrt(k)); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); if (e.bst === 'tell') TB.tellMark(ctx, e); return; } if (e.bst === 'gasp') { d(); TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); return; } d(); }
};
/* 8. ceilingDrop: hangs from a ceiling or branch; Brady close below: it shakes (tell), drops, sits stuck (stompable), climbs back */
TourBehave.ceilingDrop = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'hang';
    if (!e.bst) { TB.go(e, 'hang'); e.homeY = e.y; }
    if (st === 'hang') { e.noWalk = true; e.vx = 0; e.vy = 0; e.y = e.homeY; if (p && Math.abs(p.cx - e.cx) < 1.3 * TS && p.y > e.y && p.y - (e.y + e.h) < 6 * TS) { TB.go(e, 'tell'); TB.tell(e, 'rustle', 'crumble'); } }
    else if (st === 'tell') { e.noWalk = true; e.vx = 0; if (Math.random() < 0.4) e.g.burst(e.cx, e.y, 1, '#c8b090', 'dust'); if (e.bt > TB.par(e, 'tell', 0.4)) TB.go(e, 'drop'); }
    else if (st === 'drop') { e.vx = 0; if (e.onGround) { TB.go(e, 'stuck'); e.g.shake(2); e.g.burst(e.cx, e.y + e.h, 8, '#ffffff', 'dust'); } }
    else if (st === 'stuck') { e.vx = 0; if (e.bt > TB.par(e, 'stuckT', 1.5)) TB.go(e, 'climb'); }
    else if (st === 'climb') { e.noWalk = true; e.vx = 0; e.y -= TB.par(e, 'climbSpeed', 1) * TS * dt; if (e.y <= e.homeY) { e.y = e.homeY; TB.go(e, 'hang'); } }
    e.mode = e.bst;
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'stuck') return e.bst === 'hang' || e.bst === 'climb' || e.bst === 'tell' ? false : 'bounce'; return undefined; },
  draw(e, ctx, d) { if (e.bst === 'hang' || e.bst === 'tell' || e.bst === 'climb') { ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.cx, e.homeY - 4); ctx.lineTo(e.cx, e.y); ctx.stroke(); ctx.save(); if (e.bst === 'tell') ctx.translate(Math.sin(e.t * 60) * 2, 0); d(); ctx.restore(); if (e.bst === 'tell') TB.tellMark(ctx, e); return; } d(); if (e.bst === 'stuck') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); }
};
/* 9. wallCrawl: walks the floor, climbs walls, crosses ceilings; over Brady on a ceiling it drops like ceilingDrop */
TourBehave.wallCrawl = {
  think(e, dt) {
    const g = e.g, sp = TB.par(e, 'speed', 1.4) * TS, p = TB.p(e);
    e.side = e.side || 'floor'; e.noWalk = e.side !== 'floor';
    if (e.side === 'floor') {
      e.mode = 'crawl'; if (!e.vx) e.vx = e.dir * sp;
      // the walk that hit the wall already turned it round: the wall is behind its new heading
      if (e.hitWall) { e.side = 'wall'; e.wallDir = -e.dir; e.dir = e.wallDir; e.vx = 0; }
    } else if (e.side === 'wall') {
      e.vx = 0; e.vy = 0; e.y -= sp * dt; e.mode = 'climb';
      const wx = e.wallDir > 0 ? e.x + e.w + 2 : e.x - 2;
      if (!TB.solidAt(g, wx, e.y + e.h - 2)) { e.side = 'floor'; e.x += e.wallDir * 6; e.y -= 2; }
      else if (TB.solidAt(g, e.cx, e.y - 2)) { e.side = 'ceil'; e.dir = -e.wallDir; }
    } else if (e.side === 'ceil') {
      e.vy = 0; e.x += e.dir * sp * dt; e.mode = 'ceil';
      if (!TB.solidAt(g, e.cx + e.dir * (e.w / 2 + 2), e.y - 2) || TB.solidAt(g, e.cx + e.dir * (e.w / 2 + 2), e.y + 4)) e.dir = -e.dir;
      if (p && Math.abs(p.cx - e.cx) < 1.2 * TS && p.y > e.y && p.y - e.y < 6 * TS) { e.side = 'drop'; e.dropT = 0; TB.tell(e, 'chirp', 'select'); }
    } else if (e.side === 'drop') { e.dropT += dt; if (e.dropT < 0.4) { e.noWalk = true; } else { e.noWalk = false; if (e.onGround) { e.side = 'floor'; e.stunT = 1.2; } } }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.side !== 'floor') return false; if (kind === 'bump') { e.side = 'floor'; e.stunT = 1.5; return true; } return undefined; },
  draw(e, ctx, d) { ctx.save(); if (e.side === 'wall') { ctx.translate(e.cx, e.cy); ctx.rotate(-e.wallDir * Math.PI / 2); ctx.translate(-e.cx, -e.cy); } else if (e.side === 'ceil' || (e.side === 'drop' && e.dropT < 0.4)) { ctx.translate(e.cx, e.cy); ctx.scale(1, -1); ctx.translate(-e.cx, -e.cy); } d(); ctx.restore(); if (e.side === 'drop' && e.dropT < 0.4) TB.tellMark(ctx, e); }
};
/* 10. inflater: swells when Brady is close (spiky sides, its top a bounce surface) for a few seconds, then deflates */
TourBehave.inflater = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'walk';
    if (!e.baseW) { e.baseW = e.w; e.baseH = e.h; }
    if (st === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (p && TB.dist(e, p) < TB.par(e, 'range', 3)) { TB.go(e, 'puff'); TB.tell(e, 'squeak', 'jump'); } }
    else if (st === 'puff') { e.vx = 0; const k = 1 + Math.min(1, e.bt / 0.8); this.size(e, k); if (e.bt > 0.8) TB.go(e, 'big'); }
    else if (st === 'big') { e.vx = 0; if (e.bt > TB.par(e, 'bigT', 3)) TB.go(e, 'deflate'); }
    else if (st === 'deflate') { e.vx = 0; this.size(e, 2 - Math.min(1, e.bt / 0.5)); if (e.bt > 0.5) { this.size(e, 1); TB.go(e, 'walk'); } }
  },
  size(e, k) { const b = e.y + e.h, cx = e.cx; e.w = e.baseW * k; e.h = e.baseH * k; e.x = cx - e.w / 2; e.y = b - e.h; e.puffK = k; },
  hit(e, kind, src) {
    if ((kind === 'stomp' || kind === 'spin') && (e.bst === 'big' || e.bst === 'puff')) { const p = e.g.player; if (p) { p.vy = -PHYS.springV * 0.9; p.jumping = true; } TourKit.sfx('boing', 'spring', { vol: 0.6 }); return 'bounce'; }
    return undefined;   // smoke puffs and lasers pop it
  },
  draw(e, ctx, d) { d(); if (e.puffK > 1.2) { ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const yy = e.y + e.h * (0.3 + k * 0.2); ctx.beginPath(); ctx.moveTo(e.cx + s * e.w / 2, yy - 3); ctx.lineTo(e.cx + s * (e.w / 2 + 6), yy); ctx.lineTo(e.cx + s * e.w / 2, yy + 3); ctx.fill(); } } }
};
/* 11. pouncer: hides in the grass (ears show); eyes glow and the tail wiggles (tell), then it leaps where Brady was */
TourBehave.pouncer = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'crouch';
    if (!e.bst) TB.go(e, 'crouch');
    if (st === 'crouch') { e.vx = 0; e.mode = 'crouch'; if (p && !TB.hidden(p) && TB.dist(e, p) < TB.par(e, 'range', 6) && e.cool <= 0 && (!e.cfg.onlyDash || Math.abs(p.vx) > PHYS.walk * 1.2)) { TB.go(e, 'tell'); e.aim = { x: p.cx + sign(p.vx || (p.cx - e.cx)) * 0.5 * TS, y: p.y + p.h }; TB.face(e, p); TB.tell(e, 'growl', 'select'); } }
    else if (st === 'tell') { e.vx = 0; if (e.bt > TB.par(e, 'tell', 1.0)) { TB.go(e, 'pounce'); const dx = clamp(e.aim.x - e.cx, -9 * TS * 0.8, 9 * TS * 0.8); e.vx = dx / 0.8; e.vy = -7 * TS; e.onGround = false; TB.tell(e, 'pounce', 'jump'); } }
    else if (st === 'pounce') { if (e.onGround && e.bt > 0.15) { TB.go(e, 'land'); e.vx = 0; e.g.burst(e.cx, e.y + e.h, 6, '#ffffff', 'dust'); } else if (e.hitWall) e.vx = 0; }
    else if (st === 'land') { e.vx = 0; if (e.bt > 0.8) { TB.go(e, 'crouch'); e.cool = 2; } }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'land') return e.bst === 'crouch' ? undefined : 'bounce'; return undefined; },
  draw(e, ctx, d) {
    if (e.bst === 'crouch' || e.bst === 'tell') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.scale(1, 0.55); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); ctx.fillStyle = '#3e8a3a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(e.cx - 16 + k * 6, e.y + e.h); ctx.lineTo(e.cx - 14 + k * 6 + Math.sin(e.t * 2 + k) * 2, e.y + e.h - 14 - (k % 2) * 5); ctx.lineTo(e.cx - 11 + k * 6, e.y + e.h); ctx.fill(); }
      if (e.bst === 'tell') { ctx.fillStyle = `rgba(255,230,80,${0.6 + 0.4 * Math.sin(e.t * 20)})`; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.cx + e.dir * 4 + s * 4, e.y + e.h - 12, 2.2, 0, TAU); ctx.fill(); } } return; }
    d(); if (e.bst === 'land') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t);
  }
};
/* 12. itemThief: reaches out (0.4 s), grabs Brady's HANDS item (or signature item, or a FORM step) and runs off laughing */
TourBehave.itemThief = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'approach';
    if (st === 'approach') { e.mode = 'walk'; TB.face(e, p); e.vx = e.dir * e.speed * 1.2; if (p && TB.dist(e, p) < 1.2) { TB.go(e, 'grab'); e.vx = 0; TB.tell(e, 'grab', 'select'); } }
    else if (st === 'grab') { e.vx = 0; if (e.bt > 0.4) { if (p && overlap({ x: e.x - 18, y: e.y - 8, w: e.w + 36, h: e.h + 16 }, p) && !TB.hidden(p)) this.steal(e, p); TB.go(e, 'flee'); } }
    else if (st === 'flee') { e.mode = 'flee'; e.dir = p ? -sign(p.cx - e.cx) || e.dir : e.dir; e.vx = e.dir * e.speed * 1.6; if (e.hitWall) e.dir = -e.dir; if (e.bt > TB.par(e, 'flee', 8)) { TB.go(e, 'leave'); } }
    else if (st === 'leave') { e.vx = e.dir * e.speed * 2.2; if (!e.g.onScreen(e, 100)) e.remove = true; }
  },
  steal(e, p) {
    const k = p.handsKind ? p.handsKind() : null;
    if (k && !(TB.par(e, 'coinsOnly', false))) { p.clearHands(); e.loot = k; }
    else if (!TB.par(e, 'coinsOnly', false) && p.power > 1) { p.setPower(1); e.loot = 'joint'; }
    else { const n = Math.min(5, e.g.picks); e.g.picks -= n; e.lootCoins = n; }
    e.g.parts.text(e.cx, e.y - 12, 'HEE HEE!', '#ffd84a'); TB.tell(e, 'laugh', 'select');
  },
  hit(e, kind) {
    if ((e.loot || e.lootCoins) && e.bst === 'flee') { const g = e.g; if (e.loot) { const it = new TourItem(g, e.cx, e.y, e.loot); it.emerge = 0; it.speedX = 0; it.hoverY = e.y - 10; it.dropped = true; it.life = 3; g.spawn(it); } if (e.lootCoins) for (let k = 0; k < e.lootCoins; k++) g.addPick(e.cx, e.cy); e.loot = null; e.lootCoins = 0; }
    return undefined;
  },
  touch(e, p) { if (e.bst === 'approach' || !e.bst) TB.go(e, 'grab'); return true; },   // it never hurts: it steals
  draw(e, ctx, d) { d(); if (e.bst === 'grab') TB.tellMark(ctx, e, '#ff9ad8'); if (e.loot) { ctx.save(); ctx.translate(e.cx, e.y - 8); ctx.scale(0.5, 0.5); TourGear.icon(ctx, e.loot, 0, 0, e.t, e.g); ctx.restore(); } }
};
/* 13. timeSlow: sand starts to fall (tell), then for 2 s Brady and enemies near it move at half speed */
TourBehave.timeSlow = {
  think(e, dt) {
    const st = e.bst || 'idle'; e.vx = 0;
    if (st === 'idle') { e.mode = 'idle'; if (e.bt > TB.par(e, 'every', 5)) { TB.go(e, 'flip'); TB.tell(e, 'tick', 'select'); } }
    else if (st === 'flip') { if (e.bt > 0.6) TB.go(e, 'field'); }
    else if (st === 'field') {
      const r = TB.par(e, 'r', 4) * TS, p = TB.p(e);
      if (p && !(p.buffs && p.buffs.sundial > 0) && Math.hypot(p.cx - e.cx, p.cy - e.cy) < r) p.slowDown(0.1);
      for (const o of e.g.entities) if (o !== e && o.enemy && !o.dead && Math.hypot(o.cx - e.cx, o.cy - e.cy) < r) o.timeSlowT = 0.1;
      if (e.bt > 2) TB.go(e, 'idle');
    }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst === 'field') return 'bounce'; return undefined; },
  draw(e, ctx, d) { d(); if (e.bst === 'flip' || e.bst === 'field') { const r = TB.par(e, 'r', 4) * TS * (e.bst === 'flip' ? e.bt / 0.6 : 1); ctx.save(); ctx.strokeStyle = 'rgba(255,220,140,0.55)'; ctx.setLineDash([4, 6]); ctx.lineDashOffset = -e.t * 20; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.cx, e.cy, r, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,220,140,0.08)'; ctx.fill(); ctx.restore(); } }
};
{
  const up = TourEnemy.prototype.update;
  TourEnemy.prototype.update = function (dt) { if (this.timeSlowT > 0) { this.timeSlowT -= dt; return up.call(this, dt * 0.5); } return up.call(this, dt); };
}
/* 14. curlShield: hunches when Brady is in the air above it, a stomp just bounces off the ball; it uncurls slowly (weak) */
TourBehave.curlShield = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'walk';
    if (st === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (p && !p.onGround && Math.abs(p.cx - e.cx) < 3 * TS && p.y < e.y && e.y - p.y < 5 * TS) { TB.go(e, 'curl'); TB.tell(e, 'curl', 'select'); } }
    else if (st === 'curl') { e.vx = 0; if (e.bt > 0.15) TB.go(e, 'ball'); }
    else if (st === 'ball') { e.vx = 0; if (e.bt > TB.par(e, 'curlT', 1.5) || (p && p.onGround && e.bt > 0.4)) TB.go(e, 'uncurl'); }
    else if (st === 'uncurl') { e.vx = 0; if (e.bt > 0.6) TB.go(e, 'walk'); }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && (e.bst === 'ball' || e.bst === 'curl')) return 'bounce'; return undefined; },
  draw(e, ctx, d) { if (e.bst === 'ball' || e.bst === 'curl') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.scale(1.05, 0.8); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); return; } d(); if (e.bst === 'uncurl') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); }
};
/* 15. mimic: disguised as a piece of scenery (with a twitching leaf as its tell); close up it pops out and chases */
TourBehave.mimic = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'disguise';
    if (!e.bst) TB.go(e, 'disguise');
    if (st === 'disguise') { e.vx = 0; if (p && TB.dist(e, p) < TB.par(e, 'range', 2)) { TB.go(e, 'reveal'); } }
    else if (st === 'reveal') { e.vx = 0; if (e.bt < 0.05) { TB.tell(e, 'pop', 'appear'); e.g.parts.text(e.cx, e.y - 10, 'HA!', '#ffd84a'); e.g.burst(e.cx, e.cy, 10, '#ffffff', 'dust'); } if (e.bt > 0.3) TB.go(e, 'chase'); }
    else if (st === 'chase') { TB.face(e, p); e.mode = 'chase'; if (e.onGround) { e.vx = e.dir * e.speed * 1.4; if (e.bt % 0.6 < dt) e.vy = -6 * TS; } if (e.bt > TB.par(e, 'chaseT', 4)) TB.go(e, 'disguise'); }
  },
  hit(e, kind) { if (e.bst === 'disguise') { if (kind === 'kazoo' || kind === 'laser') { TB.go(e, 'reveal'); return true; } return false; } return undefined; },
  touch(e) { return e.bst === 'disguise'; },
  draw(e, ctx, d) {
    if (e.bst !== 'disguise') { d(); return; }
    const x = e.cx, y = e.y + e.h;
    if (e.cfg.disguise) e.cfg.disguise(ctx, e, x, y, e.t);
    else { TourObj.plank(ctx, x - e.w / 2, y - e.h, e.w, e.h); ctx.strokeStyle = '#5e3417'; ctx.lineWidth = 1.5; ctx.strokeRect(x - e.w / 2 + 2, y - e.h + 2, e.w - 4, e.h - 4); }
    // the tell drawn into the disguise: a leaf that twitches every 1.5 s, a tail tip peeking out
    const tw = (e.t % 1.5) < 0.2 ? Math.sin(e.t * 60) * 0.5 : 0;
    ctx.save(); ctx.translate(x + 2, y - e.h - 1); ctx.rotate(-0.4 + tw); ctx.fillStyle = '#5ab84a'; ctx.beginPath(); ctx.ellipse(0, -5, 3, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a6a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(x + e.w / 2 + 2, y - 4, 4, 3, 0.4, 0, TAU); ctx.fill();
  }
};
/* 17. echo: a see-through copy of Brady that follows `lag` seconds behind; touching it hurts; lasers, puffs or a honk disperse it */
TourBehave.echo = {
  think(e, dt) {
    const p = TB.p(e); e.noWalk = true; e.vx = 0; e.vy = 0;
    e.hist = e.hist || []; if (p) e.hist.push([p.x, p.y, p.facing, p.anim.state, p.small, p.anim.phase]);
    const lag = Math.round(TB.par(e, 'lag', 1.5) * 120); if (e.hist.length > lag) { const h = e.hist.shift(); e.x = h[0]; e.y = h[1]; e.w = p ? p.w : e.w; e.h = p ? p.h : e.h; e.pose = h; e.on = true; }
    if (e.goneT > 0) { e.goneT -= dt; e.on = false; }
    e.mode = 'echo';
  },
  hit(e, kind, src) { if (kind === 'laser' || kind === 'disc' || kind === 'kazoo') { e.goneT = 3; e.g.burst(e.cx, e.cy, 14, '#c8a0ff', 'spark'); return true; } if (kind === 'stomp' || kind === 'spin') { const p = e.g.player; if (p && e.on && !(e.goneT > 0)) p.hurt(e); return false; } return false; },
  touch(e, p) { if (!e.on || e.goneT > 0) return true; return false; },
  draw(e, ctx) {
    if (!e.on || !e.pose || e.goneT > 0) return;
    const [x, y, f, st, small, ph] = e.pose, p = e.g.player, near = p && Math.hypot(p.cx - e.cx, p.cy - e.cy) < 50;
    ctx.save(); ctx.globalAlpha = near ? 0.55 + 0.25 * Math.sin(e.t * 20) : 0.42; ctx.filter = 'hue-rotate(250deg) saturate(1.6)';
    drawBrady(ctx, { x: x + e.w / 2, y: y + e.h, facing: f, small, power: small ? 0 : 1, anim: { state: st, t: e.t, phase: ph, speed: 1 }, hair: null, look: Save.data.look, time: e.t });
    ctx.restore();
  }
};
/* 18. stacker: three in a row stack into a tower when they notice Brady, the tower topples toward him, the pieces lie stunned */
TourBehave.stacker = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'walk', n = TB.par(e, 'n', 3);
    if (!e.unitW) { e.unitW = e.w; e.unitH = e.h; e.units = n; }
    if (st === 'walk') { e.mode = 'walk'; this.shape(e, 'row'); if (!e.vx) e.vx = e.dir * e.speed * 0.7; if (p && TB.dist(e, p) < 6 && e.cool <= 0) { TB.go(e, 'stack'); TB.face(e, p); TB.tell(e, 'stack', 'select'); } }
    else if (st === 'stack') { e.vx = 0; this.shape(e, 'tower'); if (e.bt > 0.6) TB.go(e, 'topple'); }
    else if (st === 'topple') { e.vx = 0; this.shape(e, 'fall', e.bt / 0.5); if (e.bt > 0.5) { TB.go(e, 'stun'); e.g.shake(3); TB.tell(e, 'thud', 'stomp'); } }
    else if (st === 'stun') { e.vx = 0; this.shape(e, 'flat'); if (e.bt > 1.0 + 0.6) { TB.go(e, 'walk'); e.cool = 2; } }
  },
  shape(e, kind, k) {
    const b = e.y + e.h, n = e.units, uw = e.unitW, uh = e.unitH, cx = e.cx;
    if (kind === 'row' || kind === 'flat') { e.w = uw * n * 0.9; e.h = uh; }
    else if (kind === 'tower') { e.w = uw; e.h = uh * n; }
    else { const a = Math.min(1, k) * Math.PI / 2; e.w = uw + Math.sin(a) * uh * (n - 1); e.h = uh + Math.cos(a) * uh * (n - 1); }
    e.x = kind === 'fall' ? (e.dir > 0 ? e.towerX : e.towerX - (e.w - uw)) : cx - e.w / 2; e.y = b - e.h;
    if (kind === 'tower') e.towerX = e.x;
    e.shapeKind = kind; e.shapeK = k || 0;
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst === 'stun') { e.units--; e.g.addScore(100, e.cx, e.y); if (e.units > 0) { Sound.play('stomp'); return 'bounce'; } return undefined; } if (kind === 'stomp' || kind === 'spin') return e.bst === 'walk' ? undefined : 'bounce'; return undefined; },
  touch(e, p) { return e.bst === 'stun'; },
  draw(e, ctx) {
    const n = e.units, uw = e.unitW, uh = e.unitH, paint = (x, y, m) => TourSprite.art(ctx, e, x, y, m);
    const draw = () => {
      if (e.shapeKind === 'tower' || e.shapeKind === 'fall') { ctx.save(); const px = e.dir > 0 ? e.towerX + uw / 2 : e.towerX + uw / 2, py = e.y + e.h; ctx.translate(px, py + (e.shapeKind === 'fall' ? 0 : 0)); if (e.shapeKind === 'fall') ctx.rotate(e.dir * Math.min(1, e.shapeK) * Math.PI / 2); if (e.bst === 'stack') ctx.rotate(Math.sin(e.t * 25) * 0.05); for (let k = 0; k < n; k++) paint(0, -k * uh, 'stack'); ctx.restore(); return; }
      for (let k = 0; k < n; k++) paint(e.x + uw * 0.45 + k * uw * 0.9, e.y + e.h, e.bst === 'stun' ? 'stun' : 'walk');
      if (e.bst === 'stun') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t);
    };
    Ink.around(ctx, e.x - 20, e.y - 20, e.w + 40, e.h + 40, () => draw(), { pad: 30 });
  }
};
/* 19. boomerang: winds up (0.5 s spin), throws a projectile that curves out and back; ride its top like a platform */
TourBehave.boomerang = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'idle'; e.vx = 0;
    if (e.flyer) { e.noWalk = true; e.vy = 0; }
    if (st === 'idle') { e.mode = 'idle'; TB.face(e, p); if (e.bt > TB.par(e, 'every', 2.4) && !e.shot) { TB.go(e, 'tell'); TB.tell(e, 'whirl', 'select'); } }
    else if (st === 'tell') { if (e.bt > 0.5) { TB.go(e, 'throw'); e.shot = new TourBoomerang(e.g, e, TB.par(e, 'out', 5)); e.g.spawn(e.shot); } }
    else if (st === 'throw') { if (!e.shot || e.shot.remove) { e.shot = null; TB.go(e, 'idle'); } }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst === 'tell') return 'bounce'; return undefined; },
  draw(e, ctx, d) { if (e.bst === 'tell') { ctx.save(); ctx.translate(e.cx, e.cy); ctx.rotate(e.bt * 20); ctx.translate(-e.cx, -e.cy); d(); ctx.restore(); TB.tellMark(ctx, e); return; } if (e.bst === 'throw' && e.cfg.hatProjectile) return; d(); }
};
class TourBoomerang extends Ent {
  constructor(g, owner, out) { super(g, null, 3 * TS, 12); this.owner = owner; this.out = out; this.u = 0; this.dir = owner.dir; this.isPlatform = true; this.dx = 0; this.dy = 0; this.ox = owner.cx; this.oy = owner.y + 6; this.place(); }
  place() { const s = Math.sin(this.u * Math.PI), nx = this.ox + this.dir * s * this.out * TS - this.w / 2, ny = this.oy - Math.sin(this.u * TAU) * 0.6 * TS; this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny; }
  update(dt) { this.t += dt; this.u += dt / 2.2; if (this.u >= 1 || this.owner.dead) { this.remove = true; this.dead = true; return; } this.place(); const p = this.g.player; if (p && !p.dead && p.ride !== this && overlap({ x: this.x + 4, y: this.y + 6, w: this.w - 8, h: 8 }, p) && p.y + p.h > this.y + 8) p.hurt(this); }
  draw(ctx) { const art = this.owner.cfg.projectileArt; Ink.around(ctx, this.x, this.y - 10, this.w, 24, c => { if (art) art(c, this, this.t); else { c.save(); c.translate(this.cx, this.y + 6); c.rotate(this.t * 14); c.fillStyle = '#e8b04a'; c.beginPath(); c.ellipse(0, 0, this.w / 2, 7, 0, 0, TAU); c.fill(); c.fillStyle = '#c8802a'; c.beginPath(); c.ellipse(0, 0, this.w / 2 - 6, 4, 0, 0, TAU); c.fill(); c.restore(); } }, { pad: 12 }); }
}
/* 20. swarm: a leader and n followers in a snake (0.18 s apart); followers die to one hit; the leader's fall scatters them */
TourBehave.swarm = {
  think(e, dt) {
    if (!e.followers) {
      e.followers = []; e.path = []; const n = TB.par(e, 'n', 5);
      for (let k = 0; k < n; k++) { const F = new TourSwarmling(e.g, e, k); e.followers.push(F); e.g.spawn(F); }
    }
    e.path.unshift([e.cx, e.cy, e.dir]); if (e.path.length > 200) e.path.pop();
    if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
    if (e.flyer) { e.noWalk = true; e.vy = 0; e.y = e.hy0 + Math.sin(e.t * 2) * 10; e.x += e.vx * dt; if (Math.abs(e.cx - e.hx0) > 4 * TS) { e.dir = -e.dir; e.vx = e.dir * e.speed; } }
  },
  hit(e, kind) { if (e.followers) for (const f of e.followers) f.scatter = true; return undefined; }
};
class TourSwarmling extends Ent {
  constructor(g, lead, k) { super(g, null, lead.w * 0.8, lead.h * 0.8); this.lead = lead; this.k = k; this.enemy = true; this.x = lead.x; this.y = lead.y; this.cfg = lead.cfg; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.scatter) { this.vy -= 6 * TS * dt; this.x += (this.k % 2 ? 1 : -1) * 5 * TS * dt; this.y += this.vy * dt; if (!this.g.onScreen(this, 100)) this.remove = true; return; }
    const P = this.lead.path, i = Math.min(P.length - 1, Math.round((this.k + 1) * 0.18 * 120));
    if (P[i]) { this.x = P[i][0] - this.w / 2; this.y = P[i][1] - this.h / 2 + (this.lead.flyer ? 0 : this.lead.h * 0.1); this.dir = P[i][2]; }
    if (this.lead.remove) this.scatter = true;
  }
  hit(kind, src) { if (this.dead) return false; this.knockOff(src && src.vx ? sign(src.vx) : 1); return true; }
  touchPlayer(p) { if (!this.dead && !this.scatter) { if (this.cfg.harmless) { p.pushX = (p.pushX || 0) + this.dir * 4 * TS; return; } p.hurt(this); } }
  draw(ctx) { Ink.ent(ctx, this, c => { c.save(); c.translate(this.cx, this.y + this.h); c.scale(0.8, 0.8); c.translate(-this.cx, -(this.y + this.h)); this.cfg.art(c, this, this.cx, this.lead.flyer ? this.cy : this.y + this.h, this.knocked ? 'ko' : 'walk', this.g.t); c.restore(); }); }
}
/* 21. platEater: walks along one-way platforms and rugs, eating the tile behind it every 1.2 s; it regrows after 6 s */
TourBehave.platEater = {
  think(e, dt) {
    if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
    e.eatT = (e.eatT || 0) + dt;
    if (e.onGround && e.eatT > TB.par(e, 'every', 1.2)) {
      const tx = Math.floor((e.cx - e.dir * (e.w / 2 + 4)) / TS), ty = Math.floor((e.y + e.h + 2) / TS), A = e.g.area;
      if (tileAt(A, tx, ty) === T.SEMI) { e.eatT = 0; e.g.setTile(tx, ty, T.EMPTY); (A.eaten || (A.eaten = new Set())).add(ty * A.W + tx); e.g.spawn(new TourRegrow(e.g, tx, ty, TB.par(e, 'regrow', 6))); TB.tell(e, 'munch', 'pick'); e.g.burst(tx * TS + 16, ty * TS + 4, 6, '#c8a070', 'debris'); e.mode = 'eat'; }
    }
  }
};
class TourRegrow extends Ent {
  constructor(g, tx, ty, t) { super(g, null, TS, TS); this.x = tx * TS; this.y = ty * TS; this.tx = tx; this.ty = ty; this.life = t; this.back = true; }
  update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0 && !overlap(this.g.player, { x: this.x, y: this.y - 2, w: TS, h: 6 })) { this.g.setTile(this.tx, this.ty, T.SEMI); const A = this.g.area; if (A.eaten) A.eaten.delete(this.ty * A.W + this.tx); this.remove = true; this.g.burst(this.cx, this.y + 4, 6, '#7ad85a', 'spark'); } }
  draw(ctx) { const k = clamp(1 - this.life / 1.5, 0, 1); if (k <= 0) { ctx.fillStyle = 'rgba(120,90,60,0.35)'; ctx.fillRect(this.x + 4, this.y, TS - 8, 2); return; } ctx.fillStyle = '#5ab84a'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.ellipse(this.x + 8 + q * 8, this.y + 4 - k * 4, 2 + k * 2, 4 * k + 1, (q - 1) * 0.5, 0, TAU); ctx.fill(); } }
}
/* 22. alarmCaller: Brady in its cone: it inhales (tell), then calls: every sleeper nearby wakes up facing him */
TourBehave.alarmCaller = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'idle'; e.vx = 0;
    if (st === 'idle') { e.mode = 'idle'; if (p && !TB.hidden(p) && sign(p.cx - e.cx) === e.dir && Math.abs(p.cx - e.cx) < TB.par(e, 'cone', 5) * TS && Math.abs(p.cy - e.cy) < Math.abs(p.cx - e.cx) * 0.6 + TS && e.cool <= 0) { TB.go(e, 'tell'); TB.tell(e, 'inhale', 'select'); } if (e.bt > 3) { e.dir = -e.dir; e.bt = 0; } }
    else if (st === 'tell') { if (e.bt > 0.5) { TB.go(e, 'call'); TB.tell(e, 'alarm', 'artcarHorn'); e.g.parts.text(e.cx, e.y - 14, '!!!', '#ff5a5a'); for (const o of e.g.entities) if (o.wake && Math.hypot(o.cx - e.cx, o.cy - e.cy) < TB.par(e, 'wake', 12) * TS) o.wake('alarm', p); } }
    else if (st === 'call') { if (e.bt > 1) { TB.go(e, 'idle'); e.cool = 3; } }
  },
  draw(e, ctx, d) { d(); const c = TB.par(e, 'cone', 5) * TS; ctx.save(); ctx.fillStyle = e.bst === 'tell' ? 'rgba(255,120,80,0.16)' : 'rgba(255,240,180,0.07)'; ctx.beginPath(); ctx.moveTo(e.cx, e.cy); ctx.lineTo(e.cx + e.dir * c, e.cy - c * 0.6); ctx.lineTo(e.cx + e.dir * c, e.cy + c * 0.6); ctx.fill(); ctx.restore(); if (e.bst === 'tell') TB.tellMark(ctx, e, '#ff5a5a'); }
};
/* 28. sleeper: sleeps (Zzz) until a noise nearby (running, a hard landing, a honk) or an alarm, stretches, then acts (its base behaviour) */
TourBehave.sleeper = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'sleep';
    if (!e.bst) { TB.go(e, 'sleep'); }
    if (st === 'sleep') {
      e.vx = 0; e.mode = 'sleep';
      if (p && !TB.hidden(p) && TB.dist(e, p) < TB.par(e, 'hear', 4) && (Math.abs(p.vx) > PHYS.walk * 1.05 || (p.justLanded && p.vyBeforeLand > 12 * TS))) e.wake('noise', p);
      if (e.cfg.phaseWake && e.g.area.night) e.wake('night', p);
      return;
    }
    if (st === 'wake') { e.vx = 0; if (e.bt > 0.8) { TB.go(e, 'awake'); e.mode = 'walk'; } return; }
    const base = TourBehave[TB.par(e, 'base', 'walk')];
    if (base && base !== this) base.think(e, dt);
    else { if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk'; }
    if (e.cfg.phaseWake && !e.g.area.night) { TB.go(e, 'sleep'); }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst === 'sleep') { e.g.addPick(e.cx, e.y); e.g.addPick(e.cx, e.y); return undefined; } const base = TourBehave[TB.par(e, 'base', 'walk')]; if (base && base !== this && base.hit && e.bst === 'awake') return base.hit(e, kind); return undefined; },
  touch(e, p) { return e.bst === 'sleep'; },
  draw(e, ctx, d) { if (e.bst === 'sleep') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.scale(1.08, 0.82); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); ctx.fillStyle = '#e8f0ff'; ctx.font = `bold ${9 + (e.t * 2 % 1) * 4}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.globalAlpha = 1 - (e.t * 0.7 % 1); ctx.fillText('Z', e.cx + 10 + (e.t * 0.7 % 1) * 8, e.y - 4 - (e.t * 0.7 % 1) * 14); ctx.globalAlpha = 1; return; } if (e.bst === 'wake') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.scale(0.95, 1.1); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); TB.tellMark(ctx, e); return; } const base = TourBehave[TB.par(e, 'base', 'walk')]; if (base && base.draw && base !== this) base.draw(e, ctx, d); else d(); }
};
TourEnemy.prototype.wake = function (why, p) { if (this.behavior !== 'sleeper' || this.bst !== 'sleep') return; if (why === 'noise' && p && p.boxed) return; TB.go(this, 'wake'); TB.tell(this, 'wake', 'select'); if (p) this.dir = sign(p.cx - this.cx) || this.dir; };
/* 23. frostBreath: cheeks turn blue (tell 0.7 s), it breathes a 3-tile cone: floors ice over, enemies freeze into blocks, Brady freezes 0.8 s */
TourBehave.frostBreath = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'walk';
    if (st === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (p && TB.dist(e, p) < 4 && e.cool <= 0 && Math.abs(p.cy - e.cy) < 2 * TS) { TB.go(e, 'tell'); e.vx = 0; TB.face(e, p); TB.tell(e, 'hiss', 'fly'); } }
    else if (st === 'tell') { e.vx = 0; if (e.bt > 0.7) TB.go(e, 'breathe'); }
    else if (st === 'breathe') {
      e.vx = 0; const c = TB.par(e, 'cone', 3) * TS, box = { x: e.dir > 0 ? e.x + e.w : e.x - c, y: e.y - TS * 0.5, w: c, h: e.h + TS }, g = e.g;
      if (Math.random() < 0.8) g.burst(e.cx + e.dir * (14 + Math.random() * c), e.cy + (Math.random() - 0.5) * 24, 1, '#c8f0ff', 'spark');
      if (!e.iced) { e.iced = true; const ty = Math.floor((e.y + e.h + 2) / TS); for (let tx = Math.floor(box.x / TS); tx <= Math.floor((box.x + box.w) / TS); tx++) if (tileAt(g.area, tx, ty) === T.GROUND) { g.setTile(tx, ty, T.ICE); g.spawn(new TourThaw(g, tx, ty, 5)); } }
      const p2 = TB.p(e); if (p2 && overlap(box, p2) && !(p2.frozenT > 0)) { p2.frozenT = 0.8; p2.stun(0.8); }
      for (const o of g.entities) if (o !== e && o.enemy && !o.dead && overlap(box, o) && o.stun) o.stun(5);
      if (e.bt > 1.0) { TB.go(e, 'pant'); e.iced = false; }
    } else if (st === 'pant') { e.vx = 0; if (e.bt > 1.0) { TB.go(e, 'walk'); e.cool = 2.5; } }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'pant' && e.bst !== 'walk') return 'bounce'; return undefined; },
  draw(e, ctx, d) { d(); if (e.bst === 'tell') { ctx.fillStyle = 'rgba(120,200,255,0.65)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.cx + s * e.w * 0.25 + e.dir * 3, e.y + e.h * 0.4, 4, 0, TAU); ctx.fill(); } TB.tellMark(ctx, e, '#8ad8ff'); } if (e.bst === 'breathe') { const c = TB.par(e, 'cone', 3) * TS; ctx.save(); const g = ctx.createLinearGradient(e.cx, 0, e.cx + e.dir * c, 0); g.addColorStop(0, 'rgba(220,245,255,0.8)'); g.addColorStop(1, 'rgba(220,245,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e.cx + e.dir * 8, e.cy - 4); ctx.lineTo(e.cx + e.dir * c, e.cy - 24); ctx.lineTo(e.cx + e.dir * c, e.cy + 20); ctx.closePath(); ctx.fill(); ctx.restore(); } if (e.bst === 'pant') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); }
};
class TourThaw extends Ent { constructor(g, tx, ty, t) { super(g, null, 1, 1); this.tx = tx; this.ty = ty; this.life = t; this.back = true; } update(dt) { this.life -= dt; if (this.life <= 0) { if (tileAt(this.g.area, this.tx, this.ty) === T.ICE) this.g.setTile(this.tx, this.ty, T.GROUND); this.remove = true; } } draw() {} }
/* 24. lightFrozen: moves only in the dark; inside any light it freezes into a harmless statue you can stand on */
TourBehave.lightFrozen = {
  think(e, dt) {
    const lit = TB.lit(e);
    if (lit) { if (e.bst !== 'statue') TB.go(e, 'statue'); e.vx = 0; return; }
    if (e.bst === 'statue') TB.go(e, 'walk');
    e.mode = 'walk'; if (!e.vx || Math.abs(e.vx) < TB.par(e, 'speed', 2.2) * TS * 0.5) e.vx = e.dir * TB.par(e, 'speed', 2.2) * TS;
  },
  hit(e, kind) { if (e.bst === 'statue' && (kind === 'stomp' || kind === 'spin')) return false; return undefined; },
  touch(e, p) { if (e.bst === 'statue') { if (p.vy >= 0 && p.y + p.h <= e.y + 10) { p.y = e.y - p.h; p.vy = 0; p.onGround = true; } else { if (p.cx < e.cx) p.x = Math.min(p.x, e.x - p.w); else p.x = Math.max(p.x, e.x + e.w); } return true; } return false; },
  draw(e, ctx, d) { if (e.bst === 'statue') { ctx.save(); ctx.filter = 'grayscale(1) brightness(1.15)'; d(); ctx.restore(); return; } d(); }
};
/* 25. inkBlot: tenses (tell 0.5 s), squirts: an ink blot covers part of the view for 2 s (cosmetic), then backs off */
TourBehave.inkBlot = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'walk';
    if (st === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed * 0.6; if (p && TB.dist(e, p) < TB.par(e, 'range', 4) && e.cool <= 0) { TB.go(e, 'tell'); TB.face(e, p); TB.tell(e, 'squelch', 'splat'); } }
    else if (st === 'tell') { e.vx = 0; if (e.bt > 0.5) { TB.go(e, 'squirt'); const g = e.g, p2 = TB.p(e); (g.inkBlots = g.inkBlots || []).push({ x: p2 ? p2.cx : e.cx, y: p2 ? p2.cy : e.cy, t: 2, seed: Math.random() * 99 }); TB.tell(e, 'splat', 'splat'); } }
    else if (st === 'squirt') { e.vx = -e.dir * e.speed * 1.5; if (e.bt > 0.8) { TB.go(e, 'walk'); e.cool = 3; } }
  },
  draw(e, ctx, d) { if (e.bst === 'tell') { ctx.save(); ctx.translate(e.cx, e.y + e.h); ctx.scale(0.9, 1.1); ctx.translate(-e.cx, -(e.y + e.h)); d(); ctx.restore(); TB.tellMark(ctx, e, '#5a4a8a'); return; } d(); }
};
{
  // the ink blots: drawn over the view (screen space), fading; reduced motion: no wobble
  const dr = Play.prototype.drawToast;
  Play.prototype.drawToast = function (ctx) {
    if (this.inkBlots && this.inkBlots.length) {
      const calm = TourKit.reduceMotion();
      for (let i = this.inkBlots.length - 1; i >= 0; i--) {
        const b = this.inkBlots[i]; if (!this.paused) b.t -= 1 / 60; if (b.t <= 0) { this.inkBlots.splice(i, 1); continue; }
        const sx = Game.gameRect.x + (b.x - this.camX) * Game.S / Game.dpr, sy = Game.gameRect.y + (b.y - this.camY) * Game.S / Game.dpr, R = Math.min(Game.cssW, Game.cssH) * 0.32;
        ctx.save(); ctx.globalAlpha = Math.min(1, b.t) * 0.92; ctx.fillStyle = '#16122a';
        const rng = mulberry32(Math.floor(b.seed * 1000)); ctx.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, r = R * (0.75 + rng() * 0.35) * (calm ? 1 : 1 + Math.sin(b.t * 3 + k) * 0.03); k ? ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r) : ctx.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        for (let k = 0; k < 6; k++) { const a = rng() * TAU, r = R * (1 + rng() * 0.4); ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 6 + rng() * 14, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    }
    return dr.call(this, ctx);
  };
}
/* 26. tongue: its eye swivels (tell 0.5 s), a 3-tile tongue lashes straight out: it eats pickups, tugs Brady 1 tile and takes 5 coins */
TourBehave.tongue = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'idle'; e.vx = 0;
    if (st === 'idle') { e.mode = 'idle'; TB.face(e, p); if (p && TB.dist(e, p) < TB.par(e, 'len', 3) + 1.5 && e.cool <= 0 && Math.abs(p.cy - e.cy) < 1.5 * TS) { TB.go(e, 'tell'); TB.tell(e, 'swivel', 'select'); } }
    else if (st === 'tell') { if (e.bt > 0.5) { TB.go(e, 'lash'); e.hitOnce = false; TB.tell(e, 'lash', 'throw'); } }
    else if (st === 'lash') {
      const L = TB.par(e, 'len', 3) * TS * Math.sin(Math.min(1, e.bt / 0.5) * Math.PI), tip = { x: e.dir > 0 ? e.cx : e.cx - L, y: e.y + e.h * 0.4, w: L, h: 8 }; e.tipL = L;
      const g = e.g, p2 = TB.p(e);
      for (const o of g.entities) if (o.item && !o.remove && overlap(tip, o)) { o.remove = true; g.burst(o.cx, o.cy, 6, '#ff9ad8', 'spark'); }
      if (p2 && !e.hitOnce && overlap(tip, p2) && !(p2.crouch)) { e.hitOnce = true; p2.x += -e.dir * TS; const n = Math.min(5, g.picks); g.picks -= n; Save.data.picks = g.picks; g.parts.text(p2.cx, p2.y - 10, '-' + n, '#ffd84a'); TB.tell(e, 'gulp', 'pick'); }
      if (e.bt > 0.5) { TB.go(e, 'idle'); e.cool = 2; e.tipL = 0; }
    }
  },
  draw(e, ctx, d) { d(); if (e.bst === 'tell') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(e.cx + e.dir * 4 + Math.sin(e.t * 30) * 2, e.y + 6, 3.5, 0, TAU); ctx.fill(); TB.tellMark(ctx, e); } if (e.tipL > 2) { const y = e.y + e.h * 0.45; ctx.strokeStyle = '#ff6a9a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e.cx, y); ctx.lineTo(e.cx + e.dir * e.tipL, y); ctx.stroke(); ctx.fillStyle = '#ff4a7a'; ctx.beginPath(); ctx.arc(e.cx + e.dir * e.tipL, y, 5, 0, TAU); ctx.fill(); ctx.lineCap = 'butt'; } }
};
/* 27. pusher: rolls a ball toward Brady that grows as it rolls; stomp the pusher, then kick the ball (it breaks ball walls) */
TourBehave.pusher = {
  think(e, dt) {
    const p = TB.p(e);
    if (!e.ball) { e.ball = new TourBall(e.g, { x: e.cx + e.dir * 26, y: e.y + e.h }, { kind: e.cfg.ballKind || 'dung', r: 0.5, maxScale: TB.par(e, 'maxScale', 2) }); e.g.spawn(e.ball); }
    const b = e.ball; if (b.remove || b.free) { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; return; }
    TB.face(e, p); e.mode = 'push';
    e.vx = e.dir * e.speed * 0.8;
    const want = e.cx + e.dir * (e.w / 2 + b.w / 2 + 2); if (Math.abs(b.cx - want) < 20) { b.x = want - b.w / 2; b.vx = e.vx; b.pushed(Math.abs(e.vx) * dt / TS); } else e.vx = sign(b.cx - e.cx) * e.speed;
  },
  hit(e, kind) { if (kind === 'stomp' || kind === 'spin') { if (e.ball) e.ball.free = true; } return undefined; }
};
// the ROLL / pusher ball: grows as it rolls (radius 1 to maxScale), rolls when kicked, smashes 'ball' walls and fences
class TourBall extends TourProp {
  constructor(g, s, o) {
    o = o || {}; const r = (o.r || s.r || 0.6) * TS;
    super(g, s, { w: r * 2, h: r * 2, roll: true, kick: 6, bounce: 0.3, friction: 2.5, hp: 0, art: (ctx, e, x, y) => TourBall.art(ctx, e, x, y) });
    this.kind = o.kind || s.kind || 'snow'; this.scale = 1; this.maxScale = o.maxScale || s.maxScale || 2; this.r0 = r; this.ball = true;
  }
  pushed(tiles) { this.scale = Math.min(this.maxScale, this.scale + tiles * 0.1); const b = this.y + this.h, cx = this.cx; this.w = this.h = this.r0 * 2 * this.scale; this.x = cx - this.w / 2; this.y = b - this.h; }
  update(dt) {
    super.update(dt);
    if (this.onGround && Math.abs(this.vx) > 0.5 * TS && this.kind === 'snow') this.pushed(Math.abs(this.vx) * dt / TS);
    if (this.fast) for (const e of this.g.entities) if (e.breakWall && !e.remove && overlap(this, e) && (e.needs === 'ball' || (this.scale > 1.6 && e.needs === 'big'))) e.smash();
  }
  static art(ctx, e, x, y) {
    const r = e.w / 2, cy = y - r;
    if (e.kind === 'snow') { const g = ctx.createRadialGradient(x - r * 0.3, cy - r * 0.3, r * 0.1, x, cy, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8dcf0'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,190,220,0.6)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.3) * r * 0.55, cy + Math.sin(k * 1.3) * r * 0.55, r * 0.12, 0, TAU); ctx.fill(); } }
    else if (e.kind === 'cheese') { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b030'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.7) * r * 0.5, cy + Math.sin(k * 1.7) * r * 0.5, r * 0.15, 0, TAU); ctx.fill(); } }
    else { ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a4028'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.1) * r * 0.6, cy + Math.sin(k * 1.1) * r * 0.6, r * 0.18, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x - r * 0.35, cy - r * 0.35, r * 0.3, 0, TAU); ctx.fill(); }
  }
}
ENTITY_TYPES.tourBall = class extends TourBall { constructor(g, s) { super(g, s, s); } };
/* 29. blinker: visible 2 s, fades, vanishes 0.8 s (a glowing spot shows where it will reappear), reappears closer to Brady */
TourBehave.blinker = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'visible'; e.vx = 0; e.noWalk = !!e.cfg.floats;
    if (st === 'visible') { e.mode = 'visible'; if (e.bt > 2) { TB.go(e, 'fade'); TB.tell(e, 'blink', 'select'); } }
    else if (st === 'fade') { if (e.bt > 0.4) { TB.go(e, 'gone'); const [a, b] = TB.par(e, 'jump', [3, 5]), d = (a + Math.random() * (b - a)) * TS * (p ? sign(p.cx - e.cx) || 1 : 1); e.next = { x: e.x + (p && Math.abs(p.cx - e.cx) < Math.abs(d) ? (p.cx - e.cx) * 0.6 : d), y: e.y }; } }
    else if (st === 'gone') { if (e.bt > 0.8) { e.x = e.next.x; e.y = e.next.y; TB.go(e, 'appear'); TB.tell(e, 'appear', 'appear'); } }
    else if (st === 'appear') { if (e.bt > 0.3) TB.go(e, 'visible'); }
  },
  hit(e, kind) { if (e.bst === 'gone') return false; if (kind === 'laser' && e.bst === 'fade') return undefined; if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'appear' && e.bst !== 'visible') return false; return undefined; },
  touch(e) { return e.bst === 'gone' || e.bst === 'fade'; },
  draw(e, ctx, d) {
    if (e.bst === 'gone') { if (e.bt > 0.3 && e.next) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = 10 + Math.sin(e.t * 20) * 3; const g = ctx.createRadialGradient(e.next.x + e.w / 2, e.next.y + e.h / 2, 1, e.next.x + e.w / 2, e.next.y + e.h / 2, r * 2); g.addColorStop(0, 'rgba(255,230,150,0.9)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.next.x + e.w / 2, e.next.y + e.h / 2, r * 2, 0, TAU); ctx.fill(); ctx.restore(); } return; }
    ctx.save(); ctx.globalAlpha = e.bst === 'fade' ? 1 - e.bt / 0.4 : e.bst === 'appear' ? e.bt / 0.3 : 1; d(); ctx.restore();
  },
  light(e) { return e.bst === 'gone' ? null : { r: 70, c: 'rgba(255,220,150,' }; }
};
/* 30. hoverDart: hovers; Brady in line of sight: a glint and a flickering aim line (0.6 s), a straight dart, then it hovers low (stompable) */
TourBehave.hoverDart = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'hover', g = e.g; e.noWalk = true;
    if (!e.home) { e.home = { x: e.x, y: e.y }; }
    if (st === 'hover') { e.vx = 0; e.vy = 0; e.x = e.home.x + Math.sin(e.t * 1.3) * 12; e.y = e.home.y + Math.sin(e.t * 3.1) * 5; e.mode = 'hover'; if (p && TB.dist(e, p) < TB.par(e, 'range', 7) && e.cool <= 0 && lineOfSight(g, e.cx, e.cy, p.cx, p.cy)) { TB.go(e, 'aim'); e.aimAt = { x: p.cx, y: p.cy }; TB.face(e, p); TB.tell(e, 'glint', 'select'); } }
    else if (st === 'aim') { if (e.bt > 0.6) { TB.go(e, 'dart'); const dx = e.aimAt.x - e.cx, dy = e.aimAt.y - e.cy, d = Math.hypot(dx, dy) || 1; e.dvx = dx / d * 8 * TS; e.dvy = dy / d * 8 * TS; } }
    else if (st === 'dart') { e.x += e.dvx * dt; e.y += e.dvy * dt; if (e.bt > 0.6 || TB.solidAt(g, e.cx, e.cy)) { if (TB.solidAt(g, e.cx, e.cy)) { e.x -= e.dvx * dt * 2; e.y -= e.dvy * dt * 2; } TB.go(e, 'recover'); } }
    else if (st === 'recover') { e.y += Math.sin(e.t * 4) * 0.3; if (e.bt > 1.0) { TB.go(e, 'return'); } }
    else if (st === 'return') { e.x = approach(e.x, e.home.x, 3 * TS * dt); e.y = approach(e.y, e.home.y, 3 * TS * dt); if (Math.abs(e.x - e.home.x) < 2 && Math.abs(e.y - e.home.y) < 2) { TB.go(e, 'hover'); e.cool = 1.5; } }
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'recover') return 'bounce'; return undefined; },
  draw(e, ctx, d) { d(); if (e.bst === 'aim') { ctx.save(); ctx.strokeStyle = `rgba(255,80,80,${Math.floor(e.t * 20) % 2 ? 0.7 : 0.2})`; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.cx, e.cy); ctx.lineTo(e.aimAt.x, e.aimAt.y); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); TourKit.star(ctx, e.cx + e.dir * 8, e.cy - 3, 5, 1.5, 4); ctx.fill(); } if (e.bst === 'recover') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); }
};
/* 16. grabber (a flyer): legs dangle and it cries (tell 0.5 s), swoops, carries Brady 3 rows up and 4 tiles back (jump 3 times to
   wriggle free), sets him down unharmed, rests 2 s (stompable). It only grabs over solid ground. */
TourFlyer.prototype.release = function () { if (this.cfg.behavior === 'grabber') TB.go(this, 'drop'); };
TourBehave.grabber = {
  think(e, dt) {
    const p = TB.p(e), st = e.bst || 'patrol', g = e.g; e.noWalk = true;
    if (!e.home) e.home = { x: e.x, y: e.y };
    if (st === 'patrol') { e.mode = 'fly'; e.x = e.home.x + Math.sin(e.t * 0.9) * 3 * TS; e.y = e.home.y + Math.sin(e.t * 2.4) * 6; e.dir = Math.cos(e.t * 0.9) > 0 ? 1 : -1;
      if (p && !TB.hidden(p) && e.cool <= 0 && Math.abs(p.cx - e.cx) < 3 * TS && p.y > e.y && p.y - e.y < 6 * TS) {
        // the ground under the whole carry path must be solid (never over a pit)
        const back = -sign(p.cx - e.home.x) || -1, ok = [0, 1, 2, 3, 4].every(k => { const tx = Math.floor((p.cx + back * k * TS) / TS); return !TB.noGrab(g, tx) && TB.floorUnder(g, p.cx + back * k * TS, p.y + p.h - 2) >= 0 && Math.abs(TB.floorUnder(g, p.cx + back * k * TS, p.y) - Math.floor((p.y + p.h + 2) / TS)) <= 1; });
        if (ok) { TB.go(e, 'tell'); e.carryDir = back; TB.tell(e, 'cry', 'select'); } } }
    else if (st === 'tell') { if (e.bt > TB.par(e, 'tell', 0.5)) TB.go(e, 'swoop'); }
    else if (st === 'swoop') { const tx = p ? p.cx - e.w / 2 : e.x, ty = p ? p.y - e.h + 6 : e.y; e.x = approach(e.x, tx, 9 * TS * dt); e.y = approach(e.y, ty, 9 * TS * dt); if (p && overlap(e, p)) { TB.go(e, 'carry'); e.start = { x: p.x, y: p.y }; p.grabbedBy = e; p.grabMash = 2; TB.tell(e, 'flap', 'fly'); } else if (e.bt > 1.2) TB.go(e, 'rest'); }
    else if (st === 'carry') {
      // Brady hangs from its feet (Player's grab: three presses wriggle free); set down unharmed at the end
      const q = g.player;
      if (!q || q.grabbedBy !== e) { TB.go(e, 'drop'); return; }
      const k = Math.min(1, e.bt / 1.2); q.x = e.start.x + e.carryDir * TB.par(e, 'carry', 4) * TS * k; q.y = e.start.y - 3 * TS * Math.sin(k * Math.PI * 0.5); q.vx = 0; q.vy = 0;
      e.x = q.cx - e.w / 2; e.y = q.y - e.h + 6;
      if (k >= 1) { q.grabbedBy = null; TB.go(e, 'drop'); }
    } else if (st === 'drop') { if (e.bt > 0.2) TB.go(e, 'rest'); }
    else if (st === 'rest') { e.y = approach(e.y, (p ? p.y + p.h : e.y) - e.h - 6, 2 * TS * dt); if (e.bt > 2) { TB.go(e, 'return'); } }
    else if (st === 'return') { e.x = approach(e.x, e.home.x, 4 * TS * dt); e.y = approach(e.y, e.home.y, 4 * TS * dt); if (Math.abs(e.x - e.home.x) + Math.abs(e.y - e.home.y) < 4) { TB.go(e, 'patrol'); e.t = 0; e.cool = 2; } }
    e.mode = e.bst === 'patrol' ? 'fly' : e.bst;
  },
  hit(e, kind) { if ((kind === 'stomp' || kind === 'spin') && e.bst !== 'rest') return e.bst === 'carry' ? false : 'bounce'; return undefined; },
  touch(e, p) { return true; },   // it never hurts: it carries
  draw(e, ctx, d) { d(); if (e.bst === 'tell') { ctx.strokeStyle = '#e8a040'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.cx + s * 4, e.y + e.h - 2); ctx.lineTo(e.cx + s * 6 + Math.sin(e.t * 25) * 2, e.y + e.h + 10); ctx.stroke(); } TB.tellMark(ctx, e); } if (e.bst === 'rest') TourKit.dizzy(ctx, e.cx, e.y - 4, e.t); }
};

// flyers and swimmers take a behaviour too (TourFlyer.make({ behavior: 'grabber' }), ...): the behaviour runs their update
for (const Cls of [TourFlyer, TourSwimmer]) {
  const up = Cls.prototype.update, hit = Cls.prototype.hit, tp = Cls.prototype.touchPlayer, dr = Cls.prototype.draw;
  Cls.prototype.update = function (dt) {
    const B = TourBehave[this.cfg.behavior];
    if (!B) return up.call(this, dt);
    this.behavior = this.cfg.behavior; this.flyer = true; this.speed = (this.cfg.speed || 1) * TS;
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.vy += PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    if (this.stunT > 0) { this.stunT -= dt; return; }
    if (this.cool > 0) this.cool -= dt;
    if (this.hx0 == null) { this.hx0 = this.cx; this.hy0 = this.y; }
    this.bt = (this.bt || 0) + dt;
    B.think(this, dt);
    if (!this.noWalk && !(this instanceof TourFlyer)) moveBody(this, this.g.area, dt, { semis: false });
  };
  Cls.prototype.hit = function (kind, src) { const B = TourBehave[this.cfg.behavior]; if (B && B.hit && !this.dead) { const r = B.hit(this, kind, src); if (r !== undefined) return r; } return hit.call(this, kind, src); };
  Cls.prototype.touchPlayer = function (p) { const B = TourBehave[this.cfg.behavior]; if (B && B.touch && B.touch(this, p)) return; return tp.call(this, p); };
  Cls.prototype.draw = function (ctx) { const B = TourBehave[this.cfg.behavior]; if (B && B.draw && !this.dead) B.draw(this, ctx, () => dr.call(this, ctx)); else dr.call(this, ctx); };
}
try { Object.assign(window.BRADY_TOUR, { TourBehave, TourBall }); } catch (e) { /* not in a browser */ }
