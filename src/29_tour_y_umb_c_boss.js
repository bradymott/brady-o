/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: 31-6 LIFETIME WARRANTY, and THE INSPECTOR OF UNLIKELY WEATHER.
   The lead-in (the repair hall's corridor): inside-out umbrellas jammed in repair collars across the way. Stand at
   the runner, hold THROW and walk back: the runner slides home and the canopy snaps the right way out
   (29_tour_y_umb_b_mech.js umb.jam). The Missing Rib room is off the corridor, before the arena.
   The boss: a big marigold umbrella with a stern face and a coral crook, the inspector of everything that ever blew
   inside out. Three repair collars stand on the hall floor: BIG (left), MEDIUM (middle), SMALL (right). He is cloth
   and wire: stomping only bounces. Every hit is his runner walked home along his shaft while his tip is caught in a
   collar, by the land's own trick:
     1 THE POKE       his crook curls back (1.0 s tell), then he pokes tip-first the whole width of the hall at
                      standing height. Jump it near the BIG collar (within its glow): the tip lodges in the collar.
     2 THE SCOOP      his canopy flips inside out to show its bare spokes (1.0 s tell), then he scoops low along the
                      floor. Be in the MEDIUM collar's glow when the scoop reaches it (jump it if it's coming at you):
                      the bowl wedges in the collar.
     3 THE JAB        his tip points at Brady and every panel folds shut (1.0 s tell), then a quick narrow jab at
                      standing height. Bait it into the SMALL collar: be in its (smaller) glow and jump the jab.
   Once he's caught: the runner's mark pulses by the collar on Brady's side: hold THROW there and walk back, away from
   him, three steps: the runner passes the notch (a hit). He pulls free after 8 s if left alone (no harm done). Two
   catches a phase. At the end a single drop of rain lands on him, and he reopens, flawlessly.
   ============================================================ */
(function () {
const UK = Tour.umbKit, INK = UK.INK, UA = UK.UmbArt;
// his words come up under the boss bar, one at a time, on a pill (UmbSay with who 'boss' replaces the last)
const say = (g, b, text, col) => UK.say(g, b.cx, b.y + b.h + 34, text, col || '#ffffff', 'boss');

/* ---------------- the arena: the hall floor, the three collars (drawn by the boss's hook), a bench at each end ---------------- */
Tour.pieces['umb.arena_hall'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('umbBench', x0 + 2, GY, 1); B.decorAt('umbBench', x0 + w - 3, GY, 2);
};
const COLLARS = w => [{ k: 0, at: 6, r: 34, glow: 3.6 }, { k: 1, at: Math.floor(w / 2), r: 26, glow: 3.2 }, { k: 2, at: w - 7, r: 18, glow: 2.6 }];
const NAMES = ['UNLIKELY! MOST UNLIKELY!', 'I HAVE INSPECTED WORSE WEATHER.', 'A FORECAST OF POKING!', 'NOT A RIB OUT OF PLACE!'];

const brain = {
  phases: [4, 2],
  guardText: 'MIND THE CANOPY!',
  wake(b) {
    b.phase = 1; b.homeY = b.floorY - 5.2 * TS; b.y = b.homeY; b.dir = 1; b.flat = false;
    const x0 = b.arenaX0 / TS, w = (b.arenaX1 - b.arenaX0) / TS;
    b.collars = COLLARS(w).map(c => Object.assign({}, c, { x: (x0 + c.at) * TS + TS / 2 }));
    say(b.g, b, 'AN INSPECTION! STAND STILL, PLEASE.', '#ffffff');
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE SCOOP!'; g.bannerT = 2.2; say(g, b, 'INSIDE OUT IS A PERFECTLY GOOD WAY ROUND!', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE JAB!'; g.bannerT = 2.2; say(g, b, 'FOLDED. POINTED. INSPECTING.', '#ffffff'); }
    b.go('back');
  },
  hurt(b) { say(b.g, b, pick(['MY RUNNER!', 'THAT NOTCH WAS UNDER WARRANTY!', 'MOST IRREGULAR!']), UA.GOLD_L); b.go('back'); },
  touch(b, p) { return true; },   // touching his cloth never hurts: his tip does
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; return false; },
  lastHit(b) { b.flat = true; b.dropT = 0; b.go('drop'); return true; },
  collar(b) { return b.collars[(b.phase || 1) - 1]; },
  // the attack's hitbox at its head (world): poke / jab at standing height, the scoop low and wide
  box(b) {
    const fy = b.floorY, hx = b.head;
    if (b.act === 'scoop') return { x: hx - 34, y: fy - 0.9 * TS, w: 68, h: 0.9 * TS };
    if (b.act === 'jab') return { x: hx - 10, y: fy - 1.05 * TS, w: 20, h: 14 };
    return { x: hx - 14, y: fy - 1.1 * TS, w: 28, h: 20 };
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, fy = b.floorY;
    b.guard = 'bounce';
    if (!b.collars) this.wake(b);
    const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH), minY = b.g.camY + 78 * k;
    if (b.act === 'idle' || b.act === 'walk') b.go('back');
    if (b.act === 'back') {
      // back up to hover on the far side of the hall from Brady
      const side = p && p.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1, tx = side > 0 ? b.arenaX1 - b.w - TS : b.arenaX0 + TS;
      b.x = approach(b.x, tx, 6 * TS * dt); b.y = approach(b.y, Math.max(minY, b.homeY), 5 * TS * dt); b.rot = approach(b.rot || 0, 0, dt * 4);
      if (b.at > 1.4 && Math.abs(b.x - tx) < 4) b.go('tell');
    } else if (b.act === 'tell') {
      // the tell: phase 1 his crook curls back; 2 the canopy flips inside out (bare spokes); 3 the panels fold, the
      // tip points; he sinks to the attack's height facing Brady
      if (b.first) { b.dir = p && p.cx < b.cx ? -1 : 1; say(g, b, ph === 1 ? pick(NAMES) : ph === 2 ? 'SPOKES OUT!' : 'POINT... AND...', '#ffffff'); TourKit.sfx('creak', 'select', { vol: 0.4, pitch: 0.5 + ph * 0.1 }); }
      const ty = fy - (ph === 2 ? 1.6 : 1.9) * TS - b.h / 2;
      b.y = approach(b.y, ty, 5 * TS * dt); b.rot = approach(b.rot || 0, b.dir * Math.PI / 2, dt * 3);
      if (b.at >= 1.0) { b.go(ph === 1 ? 'poke' : ph === 2 ? 'scoop' : 'jab'); b.head = b.cx + b.dir * b.w * 0.55; TourKit.sfx('swish', 'kick', { vol: 0.5, pitch: 1.2 }); }
    } else if (b.act === 'poke' || b.act === 'scoop' || b.act === 'jab') {
      const sp = (b.act === 'jab' ? 13 : b.act === 'scoop' ? 8 : 11) * TS;
      b.x += b.dir * sp * dt; b.head = b.cx + b.dir * b.w * 0.55;
      const box = this.box(b), C = this.collar(b);
      // into the collar: lodged when Brady is within its glow as the head reaches it
      if ((b.head - C.x) * b.dir >= 0 && (b.head - b.dir * sp * dt - C.x) * b.dir < 0 && p && Math.abs(p.cx - C.x) < C.glow * TS) {
        b.go('caught'); b.x = C.x - b.dir * b.w * 0.55 - b.w / 2; b.head = C.x; b.runner = 0; b.hold = false;
        g.shake(5); TourKit.sfx('clang', 'bump', { vol: 0.6, pitch: 0.8 }); g.burst(C.x, fy - 1.2 * TS, 14, UA.GOLD, 'confetti');
        say(g, b, pick(['STUCK! THIS IS MOST UNLIKELY!', 'A COLLAR? FOR ME?', 'I AM NOT IN NEED OF REPAIR!']), UA.GOLD_L);
        return;
      }
      if (p && !p.dead && overlap(p, box)) p.hurt({ x: box.x, w: box.w });
      if (b.x < b.arenaX0 - 10 || b.x + b.w > b.arenaX1 + 10) { b.x = clamp(b.x, b.arenaX0, b.arenaX1 - b.w); b.go('back'); }
    } else if (b.act === 'caught') {
      // the runner: hold THROW at the mark on Brady's side of the collar and walk back, away from him
      const C = this.collar(b), side = -b.dir, mx = C.x + side * 1.6 * TS, I = (p && p.inp) || {};
      b.markX = mx;
      if (p && !p.dead) {
        const at = p.onGround && Math.abs(p.cx - mx) < 0.9 * TS && Math.abs(p.y + p.h - fy) < 8;
        if (!b.hold && I.action && at) { b.hold = true; b.x0p = p.cx; TourKit.sfx('grip', 'select', { vol: 0.4, pitch: 1.0 }); }
        if (b.hold && (!I.action || !p.onGround)) b.hold = false;
        if (b.hold) b.runner = clamp((p.cx - b.x0p) * side / (3 * TS), 0, 1); else b.runner = Math.max(0, b.runner - dt * 2);
        if (b.runner >= 1) { b.hold = false; b.runner = 0; g.burst(C.x, fy - 1.2 * TS, 18, UA.CORAL, 'confetti'); UK.say(g, C.x, fy - 3 * TS, 'NOTCH!', UA.GOLD_L); b.damage(1); if (b.act === 'caught') b.go('back'); return; }
      }
      if (b.at > 8) { say(g, b, 'HA! FREE AS A BREEZE.', '#ffffff'); b.go('back'); }
    } else if (b.act === 'drop') {
      // the end: a single drop of rain lands on him... and he reopens, flawlessly
      b.dropT = (b.dropT || 0) + dt; b.rot = approach(b.rot || 0, 0, dt * 3); b.y = approach(b.y, fy - b.h - 2 * TS, 3 * TS * dt);
      if (b.dropT > 1.1 && !b.reopened) { b.reopened = true; b.flat = false; say(g, b, '...FLAWLESS. CARRY ON.', '#ffffff'); g.burst(b.cx, b.y, 20, UA.GOLD, 'confetti'); TourKit.sfx('pop', 'kick', { vol: 0.5, pitch: 1.4 }); }
      if (b.dropT > 2.6) { b.die(); }
    } else b.go('back');
  },
  draw(b, ctx, t) {
    const x = b.cx, y = b.cy, r = b.w * 0.5, ph = b.phase || 1, act = b.act;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot || 0);
    const inside = (act === 'tell' || act === 'scoop' || (act === 'caught' && ph === 2)) && ph === 2;
    const folded = ph === 3 && (act === 'tell' || act === 'jab' || act === 'caught') || b.flat;
    if (folded) {
      // all panels shut: a tall narrow furled umbrella, tip first, his face squeezed on the folds
      ctx.save(); ctx.rotate(Math.PI); UA.furled(ctx, 0, -r * 1.1, r * 2.1, UA.GOLD, 0); ctx.restore();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-4, -6, 2.2, 0, TAU); ctx.arc(4, -6, 2.2, 0, TAU); ctx.fill();
    } else {
      UA.umbrella(ctx, 0, r * 0.35, r, { inside, n: 8, len: act === 'tell' && ph === 1 ? r * 0.55 : r * 0.9, c1: UA.GOLD, c2: UA.GOLD_L });
      // the crook curls right back (phase 1's tell)
      if (act === 'tell' && ph === 1) { ctx.strokeStyle = UA.CORAL; ctx.lineWidth = 5; const k = Math.min(1, b.at); ctx.beginPath(); ctx.arc(-6, r * 0.95, 8 + 10 * k, 0, Math.PI * (1 + k)); ctx.stroke(); }
      // the face on the canopy: stern brows, a downturned mouth (bare spokes: only the eyes, peering through)
      const fy = inside ? r * 0.55 : -r * 0.15;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.22, fy, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s * r * 0.22 + (b.dir || 1) * 2, fy + 1, 2.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; }
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * 0.38, fy - 12); ctx.lineTo(-r * 0.1, fy - 7); ctx.moveTo(r * 0.38, fy - 12); ctx.lineTo(r * 0.1, fy - 7); ctx.stroke();
      if (!inside) { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-10, fy + 16); ctx.quadraticCurveTo(0, fy + 10, 10, fy + 16); ctx.stroke(); }
      // stitched patches (he has been mended before)
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.05); ctx.lineTo(-r * 0.45, -r * 0.35); ctx.moveTo(r * 0.5, -r * 0.3); ctx.lineTo(r * 0.62, 0); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
};
// the collars, his shaft and runner while caught, the drop at the end (in the world, over the floor)
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'umb_inspector' || b.remove || !b.collars) return;
  const fy = b.floorY, t = play.t, ph = b.phase || 1, p = play.player;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  b.collars.forEach((C, i) => {
    const live = i === ph - 1 && b.act !== 'drop', cy = fy - 1.2 * TS;
    // the glow on the floor: where Brady must be when the attack reaches the collar (this phase's only)
    if (live && b.act !== 'caught') { const k = 0.5 + 0.5 * Math.sin(t * 5); ctx.fillStyle = `rgba(255,216,74,${0.16 + 0.14 * k})`; ctx.beginPath(); ctx.ellipse(C.x, fy - 4, C.glow * TS, 10, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.4 * k})`; ctx.lineWidth = 2; ctx.stroke(); }
    // the post and the ring
    ctx.fillStyle = '#5a6a8a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(C.x - 5, cy, 10, fy - cy); ctx.strokeRect(C.x - 5, cy, 10, fy - cy);
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(C.x, cy - C.r * 0.2, C.r * 0.45, C.r, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = live ? UA.GOLD_L : '#9aa4b8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(C.x, cy - C.r * 0.2, C.r * 0.45, C.r, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = UA.CORAL; ctx.beginPath(); ctx.arc(C.x, cy - C.r * 1.2, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    if (live && b.act !== 'caught' && p && Math.abs(p.cx - C.x) > C.glow * TS + 2 * TS) UA.pill(ctx, C.x, cy - C.r - 26, ['BIG COLLAR', 'MEDIUM COLLAR', 'SMALL COLLAR'][i], UA.GOLD_L, 0.85);
  });
  // caught: his shaft through the collar, the coral runner and its notch, the mark on Brady's side
  if (b.act === 'caught' && b.markX != null) {
    const C = brain.collar(b), side = -b.dir, sy = fy - 1.2 * TS, end = C.x + side * 3.4 * TS, nx = C.x + side * 2.6 * TS;
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(C.x - side * 20, sy); ctx.lineTo(end, sy); ctx.stroke();
    ctx.strokeStyle = '#a0a8c0'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(C.x - side * 20, sy); ctx.lineTo(end, sy); ctx.stroke();
    ctx.strokeStyle = UA.GOLD_L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(nx, sy - 12); ctx.lineTo(nx, sy + 12); ctx.stroke();
    const rx = lerp(C.x + side * 22, nx, b.runner || 0);
    ctx.fillStyle = UA.CORAL; rr(ctx, rx - 11, sy - 9, 22, 18, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    const on = p && Math.abs(p.cx - b.markX) < 0.9 * TS;
    UA.ring(ctx, b.markX, fy, t, on || b.hold, 22);
    const k = 0.5 + 0.5 * Math.sin(t * 7);
    UA.pill(ctx, b.markX, fy - 3.6 * TS, b.hold ? 'WALK BACK...' : on ? 'HOLD THROW, WALK BACK' : 'THE RUNNER!', UA.GOLD_L, 0.7 + 0.3 * k);
    if (b.hold && p) { ctx.strokeStyle = UA.CORAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, sy); ctx.lineTo(p.cx, p.y + 24); ctx.stroke(); }
    // the time left before he wriggles free: a little bar on the collar
    const left = clamp(1 - b.at / 8, 0, 1); ctx.fillStyle = 'rgba(20,16,36,0.8)'; rr(ctx, C.x - 24, sy + 22, 48, 7, 3); ctx.fill(); ctx.fillStyle = left < 0.3 ? UA.CORAL : UA.GOLD_L; rr(ctx, C.x - 23, sy + 23, 46 * left, 5, 2); ctx.fill();
  }
  // the end: one drop falls on him
  if (b.act === 'drop') { const u = clamp((b.dropT || 0) / 1.1, 0, 1); if (u < 1) UA.drop(ctx, b.cx, lerp(b.g.camY + 40, b.y, u * u), 6); }
  ctx.restore();
});
const boss = { id: 'umb_inspector', name: 'The Inspector of Unlikely Weather', hp: 6, dims: [96, 84], floats: true, music: 'tour_umb_boss', country: 'umb', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.umb_inspector = [30, 40, 30, 40];
UK.inspector = brain;
})();
