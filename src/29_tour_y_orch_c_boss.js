/* ============================================================
   THE ORCHARD AFTER CLOSING: 28-6 WINDFALL COMMITTEE, the boss. Three pears on one stalk hang from the great bough
   over the night lawn and sit as a committee. Under them, four sprung branches, each with a gold mark beneath it,
   and the voting basket at the left. Pears can't be stomped. Every vote is one pear flicked into the basket: wait
   for it to sit on a branch, stand under that branch on its mark and press THROW (pluck it from underneath): the
   spring flicks the pear into the basket. Two votes per member (after the first it climbs back: OBJECTION!).
   1 THE CHAIR (the small grumpy pear) raises its leaf (0.9 s, and a shadow on the lawn) and drops onto the branch
     nearest Brady: the branch whips down where it lands. Stand clear, then pluck.
   2 THE TREASURER blushes on one cheek (1.0 s), then lunges along that side of the lawn and lands on the end branch
     there. Wait on the other side (basket-side when the blush is away from it), then pluck.
   3 THE SECRETARY points its stalk at Brady (1.0 s), then lunges AWAY from him to the end branch on the other side.
     Only a pear on the basket's side (the left half) flicks into the basket: approach from the far (right) side so it
     lunges toward the basket, then drop below and pluck. From the wrong side its flick misses: TABLED, and it climbs
     back.
   Motion carried, three to nothing.
   ============================================================ */
(function () {
const OK = Tour.orchKit, INK = OK.INK, OA = OK.OrchArt;
const say = (g, b, text, col) => OK.say(g, b ? b.cx : 0, b ? b.y : 0, text, col || '#ffffff', 'boss');
const PERCH = [5, 11, 17, 23];

/* ---------------- the arena: the night lawn, four sprung branches, the voting basket ---------------- */
Tour.pieces['orch.arena_committee'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('orchBoughTrunk', x0 + 1, GY, 1); B.decorAt('orchBoughTrunk', x0 + w - 2, GY, 2);
  // a low wall at each end to stand on (somewhere to wait above a lunge)
  for (let q = 0; q < 2; q++) { B.set(x0 + w - 3 + q, GY - 3, T.SEMI); }
};
Object.assign(Decor, {
  // an old pear trunk at the arena's edge (the great bough springs from it)
  orchBoughTrunk(ctx, x, y, t, th, d) { ctx.save(); ctx.globalAlpha = 0.85; OA.branch(ctx, x, y, x + ((d || 1) === 1 ? 6 : -6), y - 9 * TS, 36, 0, '#4a3828'); ctx.restore(); }
});

/* ---------------- the committee ---------------- */
const NAMES = ['ORDER! ORDER!', 'THE CHAIR RECOGNISES... NOBODY.', 'ALL THOSE IN FAVOUR?', 'POINT OF ORDER!', 'MINUTES, PLEASE.'];
const brain = {
  phases: [4, 2],
  guardText: 'NOT THE FRUIT!',
  wake(b) {
    b.phase = 1; b.votes = 0; b.memberVotes = 0; const x0 = b.arenaX0 / TS;
    b.perches = PERCH.map(k => ({ x: (x0 + k) * TS + TS / 2, tx: x0 + k, whip: 0 }));
    b.basketX = b.arenaX0 + 2.4 * TS; b.basketY = b.floorY - 3.4 * TS; b.stalkX = (b.arenaX0 + b.arenaX1) / 2; b.homeY = b.floorY - 6.1 * TS;
    b.pears = [0, 1, 2].map(k => ({ k, x: b.stalkX + (k - 1) * 34, y: b.homeY + (k === 1 ? 10 : 0), mode: 'home', sp: 0 }));
    say(b.g, b, 'THIS MEETING OF THE WINDFALL COMMITTEE IS NOW IN SESSION.', '#ffffff');
    b.go('idle');
  },
  phase(b, n) {
    const g = b.g; b.memberVotes = 0;
    if (n === 2) { g.bannerText = 'THE TREASURER'; g.bannerT = 2.0; say(g, b, 'THE TREASURER WILL NOW BLUSH.', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE SECRETARY'; g.bannerT = 2.0; say(g, b, 'THE SECRETARY HAS A POINT.', '#ffffff'); }
    b.go('idle');
  },
  hurt(b) { b.go('idle'); },
  touch(b, p) { return true; },   // touching the committee never hurts (its drops and lunges do)
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; return false; },
  lastHit(b) { say(b.g, b, 'MOTION CARRIED. THREE TO NOTHING.', '#ffd84a'); return false; },
  active(b) { return b.pears[Math.min(2, (b.phase || 1) - 1)]; },
  basketSide(b, perch) { return perch.x < (b.arenaX0 + b.arenaX1) / 2; },
  // Brady plucks from under a branch (the mark entity calls this)
  pluck(b, perch) {
    const P = this.active(b); if (b.act !== 'sit' || P.perch !== perch) return false;
    perch.whip = 0.5; TourKit.sfx('twang', 'spring', { vol: 0.6, pitch: 1.1 });
    P.mode = 'fly'; P.sx = P.x; P.sy = P.y; P.fk = 0;
    P.into = (b.phase || 1) < 3 || this.basketSide(b, perch);
    b.go('flick'); return true;
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, fy = b.floorY;
    b.guard = 'bounce';
    if (!b.pears) this.wake(b);
    for (const q of b.perches) if (q.whip > 0) q.whip -= dt;
    // the stalk and its committee hang over the middle (the boss body stays put; the pears do the moving)
    b.x = b.stalkX - b.w / 2; b.y = b.homeY - b.h * 0.6 + Math.sin(b.t * 1.3) * 3;
    { const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH); b.y = Math.max(b.y, g.camY + 70 * k); }
    for (const P of b.pears) if (P.mode === 'home') { P.x = approach(P.x, b.stalkX + (P.k - 1) * 34, 3 * TS * dt); P.y = approach(P.y, b.y + b.h - 6 + (P.k === 1 ? 10 : 0), 3 * TS * dt); }
    const P = this.active(b);
    if (b.act === 'walk') b.go('idle');
    if (b.act === 'idle') { if (b.at > 1.3) b.go('tell'); return; }
    if (b.act === 'tell') {
      if (b.first) {
        P.mode = 'tell';
        if (ph === 1) { const L = b.perches.slice().sort((a, c) => Math.abs(a.x - (p ? p.cx : 0)) - Math.abs(c.x - (p ? p.cx : 0))); P.perch = L[0]; say(g, b, pick(NAMES), '#ffffff'); }
        else if (ph === 2) { b.side = b.side === -1 ? 1 : -1; if (Math.random() < 0.35) b.side = -b.side; P.side = b.side; P.perch = b.side < 0 ? b.perches[0] : b.perches[3]; say(g, b, b.side < 0 ? 'I BLUSH TO THE LEFT.' : 'I BLUSH TO THE RIGHT.', '#ffffff'); }
        else { const s = p && p.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1; P.side = s; P.perch = s < 0 ? b.perches[0] : b.perches[3]; say(g, b, 'I MOVE AWAY FROM YOU, SIR.', '#ffffff'); }
        TourKit.sfx('ahem', 'select', { vol: 0.4, pitch: 0.6 });
      }
      if (b.at >= (ph === 1 ? 0.9 : 1.0)) { P.mode = ph === 1 ? 'drop' : 'lunge'; P.sx = P.x; P.sy = P.y; P.fk = 0; b.go('move'); }
      return;
    }
    if (b.act === 'move') {
      const tgt = P.perch, ty = (fy / TS - 4) * TS + 2;
      if (P.mode === 'drop') {
        P.fk = Math.min(1, P.fk + dt / 0.35); P.x = lerp(P.sx, tgt.x, P.fk); P.y = lerp(P.sy, ty, P.fk * P.fk);
        if (P.fk >= 1) {
          // the branch whips down to the lawn where it lands
          tgt.whip = 0.35; g.shake(6); TourKit.sfx('thud', 'bump', { vol: 0.6, pitch: 0.6 });
          if (p && !p.dead && Math.abs(p.cx - tgt.x) < 1.1 * TS && p.y + p.h > fy - 3 * TS) p.hurt({ x: tgt.x - 20, w: 40 });
          P.mode = 'sit'; b.go('sit');
        }
      } else {
        // a lunge: the pear swoops low along its side of the lawn, then springs up onto the end branch
        P.fk = Math.min(1, P.fk + dt / 0.8); const k = P.fk, mid = (b.arenaX0 + b.arenaX1) / 2, edge = P.side < 0 ? b.arenaX0 + 1.2 * TS : b.arenaX1 - 1.2 * TS;
        if (k < 0.7) { const q = k / 0.7; P.x = lerp(P.sx, lerp(mid, edge, q), Math.min(1, q * 3)); P.y = lerp(P.sy, fy - 0.9 * TS, Math.min(1, q * 2.5)); }
        else { const q = (k - 0.7) / 0.3; P.x = lerp(edge, tgt.x, q); P.y = lerp(fy - 0.9 * TS, ty, q) - Math.sin(q * Math.PI) * 30; }
        const box = { x: P.x - 16, y: P.y - 30, w: 32, h: 30 };
        if (k > 0.05 && k < 0.78 && p && !p.dead && overlap(p, box)) p.hurt(box);
        if (k >= 1) { P.mode = 'sit'; tgt.whip = 0.25; b.go('sit'); }
      }
      return;
    }
    if (b.act === 'sit') {
      // it sits on its branch; the mark under it pulses. Not plucked in time: it climbs back to the stalk
      P.x = P.perch.x; P.y = (fy / TS - 4) * TS + 2 + Math.sin(b.t * 6) * 2;
      if (b.at > 5.5) { P.mode = 'back'; P.sx = P.x; P.sy = P.y; P.fk = 0; say(g, b, 'THE MEMBER RETURNS TO THE STALK.', '#ffffff'); b.go('back'); }
      return;
    }
    if (b.act === 'flick') {
      P.fk = Math.min(1, P.fk + dt / 0.9); const k = P.fk;
      const tx = P.into ? b.basketX : (P.perch.x < b.cx ? b.arenaX0 - TS : b.arenaX1 + TS), ty = P.into ? b.basketY - 0.8 * TS : fy - 1.2 * TS;
      P.x = lerp(P.sx, tx, k); P.y = lerp(P.sy, ty, k) - Math.sin(k * Math.PI) * 3.4 * TS;
      if (k >= 1) {
        if (P.into) {
          b.votes++; b.memberVotes++; g.burst(b.basketX, b.basketY - TS, 16, '#ffd84a', 'confetti'); OK.say(g, b.basketX + TS, b.basketY - 2 * TS, 'AYE!', '#ffd84a');
          const done = b.memberVotes >= 2;
          if (done) { P.mode = 'gone'; } else { P.mode = 'back'; P.sx = P.x; P.sy = P.y; P.fk = 0; }
          b.damage(1, { quiet: true });
          if (b.state !== 'dying' && !b.remove && b.act === 'flick') { if (!done) say(g, b, 'OBJECTION! BACK TO THE STALK.', '#ffffff'); b.go(done ? 'idle' : 'back'); }
        } else {
          say(g, b, 'TABLED! IT MISSED THE BASKET.', '#ffffff'); P.mode = 'back'; P.sx = P.perch.x; P.sy = P.y; P.fk = 0; b.go('back');
        }
      }
      return;
    }
    if (b.act === 'back') {
      P.fk = Math.min(1, P.fk + dt / 1.0); const hx = b.stalkX + (P.k - 1) * 34, hy = b.y + b.h - 6;
      P.x = lerp(P.sx, hx, P.fk); P.y = lerp(P.sy, hy, P.fk) - Math.sin(P.fk * Math.PI) * 40;
      if (P.fk >= 1) { P.mode = 'home'; b.go('idle'); }
      return;
    }
    b.go('idle');
  },
  draw(b, ctx, t) {
    // the stalk and its fork (the pears are drawn in the world, over the lawn: afterEntities)
    const x = b.cx, y = b.y;
    OA.branch(ctx, x, y - 30, x, y + b.h - 26, 8, 0, OA.BARK);
    OA.leaf(ctx, x + 4, y + 4, 1.6, -0.5); OA.leaf(ctx, x - 4, y + 16, 1.5, -2.6);
    for (const P of b.pears || []) if (P.mode === 'home' || P.mode === 'tell') OA.branch(ctx, x, y + b.h - 26, P.x, P.y - 30, 4, 0, OA.BARK);
  }
};
// a member: k 0 grumpy (the Chair), 1 wide-eyed (the Treasurer), 2 smug (the Secretary)
function member(ctx, P, t, ph, b) {
  const x = P.x, y = P.y, s = P.k === 1 ? 1.9 : 1.6;
  ctx.save();
  // the tell: a raised leaf / a blush / a pointing stalk
  const tell = P.mode === 'tell' && b.act === 'tell', k = tell ? Math.min(1, b.at / 0.9) : 0;
  OA.pear(ctx, x, y, s, P.k === 1 ? '#c8d05a' : OA.PEAR, false, P.mode === 'fly' ? P.fk * 9 : 0);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  // the stalk: normal, or (the Secretary's tell) stretched out pointing at Brady
  const pl = b.g.player;
  if (tell && P.k === 2) { const d = pl && pl.cx < x ? -1 : 1, L = 20 + k * 46; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y - 46); ctx.lineTo(x + d * L, y - 46 - 10); ctx.stroke(); ctx.strokeStyle = OA.BARK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.fillStyle = OA.BARK; ctx.beginPath(); ctx.arc(x + d * L, y - 56, 5, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = OA.BARK_D; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 46); ctx.quadraticCurveTo(x + 2, y - 54, x + 5, y - 58); ctx.stroke(); }
  // the leaf (the Chair's tell: raised straight up)
  OA.leaf(ctx, x + 4, y - 52, 1.4, tell && P.k === 0 ? -Math.PI / 2 - 0.1 : -0.5);
  // the face
  const fy = y - 20, eye = P.k === 2 ? 1.2 : 3.4;
  ctx.fillStyle = '#ffffff'; for (const sx of [-8, 8]) { ctx.beginPath(); ctx.ellipse(x + sx, fy, 6, P.k === 2 ? 4 : 6.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); }
  ctx.fillStyle = INK; for (const sx of [-8, 8]) { ctx.beginPath(); ctx.arc(x + sx + (pl ? sign(pl.cx - x) * 1.5 : 0), fy + (P.k === 2 ? 1 : 0), eye, 0, TAU); ctx.fill(); }
  if (P.k === 2) { ctx.fillStyle = '#c8d05a'; ctx.fillRect(x - 15, fy - 5, 30, 4); }
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  if (P.k === 0) { ctx.beginPath(); ctx.moveTo(x - 14, fy - 10); ctx.lineTo(x - 3, fy - 6); ctx.moveTo(x + 14, fy - 10); ctx.lineTo(x + 3, fy - 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 6, fy + 14); ctx.quadraticCurveTo(x, fy + 9, x + 6, fy + 14); ctx.stroke(); }
  else if (P.k === 1) { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, fy + 14, 5, 6, 0, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(x - 7, fy + 11); ctx.quadraticCurveTo(x + 2, fy + 17, x + 9, fy + 9); ctx.stroke(); }
  // the Treasurer's blush: one cheek glows (the side it will lunge to)
  if (P.k === 1 && (tell || P.mode === 'lunge')) { const d = P.side || 1, a = tell ? 0.3 + 0.6 * k : 0.6; ctx.fillStyle = `rgba(255,90,110,${a})`; ctx.beginPath(); ctx.ellipse(x + d * 14, fy + 8, 8 + k * 3, 5 + k * 2, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// the pears, the branches, the marks, the shadows and the basket, in the world over the lawn
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'orch_committee' || b.remove || !b.perches) return;
  const fy = b.floorY, t = play.t, P = brain.active(b), p = play.player;
  // the sprung branches with their marks: the one a member sits on pulses, big and gold
  for (const q of b.perches) {
    const by = fy - 4 * TS, whip = q.whip > 0 ? Math.sin(q.whip / 0.35 * Math.PI) : 0;
    OA.branch(ctx, q.x - 2.4 * TS, by - 18, q.x + 0.8 * TS, by + 6 + whip * 3 * TS, 10, 0.25, OA.PEAR_D);
    OA.leaf(ctx, q.x - TS, by - 14, 1.2, -1); OA.leaf(ctx, q.x + 10, by + 2 + whip * 3 * TS, 1, -0.3);
    const hot = b.act === 'sit' && P.perch === q, on = p && OK.onMark(p, q.tx, fy / TS, 0.8);
    OA.ring(ctx, q.x, fy, t, hot, hot ? 26 : 15);
    if (hot && on) OA.cue(ctx, q.x, fy - 3.1 * TS, t, 'PLUCK');
    // which side counts (phase 3): the basket's half is marked with little ivory ticks
    if ((b.phase || 1) === 3 && brain.basketSide(b, q)) { ctx.save(); ctx.fillStyle = 'rgba(244,236,212,0.6)'; ctx.fillRect(q.x - 2, fy - 8, 4, 6); ctx.restore(); }
  }
  // the shadow of a coming drop
  if (b.act === 'tell' && (b.phase || 1) === 1 && P.perch) { const k = Math.min(1, b.at / 0.9); ctx.save(); ctx.fillStyle = `rgba(20,10,30,${0.25 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(P.perch.x, fy - 2, 18 + k * 18, 5 + k * 3, 0, 0, TAU); ctx.fill(); ctx.restore(); OA.pill(ctx, P.perch.x, fy - 3.1 * TS - 22, 'STAND CLEAR', '#ffd84a'); }
  // the lunge's lane: the half of the lawn it will sweep
  if (b.act === 'tell' && (b.phase || 1) >= 2 && P.side) { const k = Math.min(1, b.at); const mid = (b.arenaX0 + b.arenaX1) / 2, x0 = P.side < 0 ? b.arenaX0 : mid, x1 = P.side < 0 ? mid : b.arenaX1; ctx.save(); ctx.fillStyle = `rgba(255,90,110,${0.1 + 0.18 * k})`; ctx.fillRect(x0, fy - 1.6 * TS, x1 - x0, 1.6 * TS); ctx.restore(); }
  // the voting basket (left end), its votes in it
  // (up on its stand, clear of the stick in the corner)
  const bx = b.basketX, by = b.basketY;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.fillStyle = OA.BARK; ctx.fillRect(bx - 6, by, 12, fy - by); ctx.strokeRect(bx - 6, by, 12, fy - by); ctx.fillRect(bx - 22, fy - 8, 44, 8); ctx.strokeRect(bx - 22, fy - 8, 44, 8);
  for (let k = 0; k < Math.min(6, b.votes); k++) OA.pear(ctx, bx - 22 + (k % 3) * 22, by - 40 - Math.floor(k / 3) * 12, 1.0, OA.PEAR, true, (k - 2) * 0.25);
  ctx.fillStyle = '#c8a06a'; ctx.beginPath(); ctx.moveTo(bx - 46, by - 44); ctx.lineTo(bx + 46, by - 44); ctx.lineTo(bx + 36, by); ctx.lineTo(bx - 36, by); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.3; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(bx + k * 10, by - 43); ctx.lineTo(bx + k * 8, by - 1); ctx.stroke(); }
  ctx.restore();
  OA.pill(ctx, bx, by - 62, 'AYES ' + b.votes, '#ffd84a');
  // the members, on top
  for (const Q of b.pears) if (Q.mode !== 'gone') member(ctx, Q, t, b.phase, b);
});
// the pluck: Brady's THROW on a branch's mark (a prop like every orchard prop)
class OrchPerchMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.orchProp = true; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; }
  orchTouch(p) { const b = this.g.boss; if (!b || b.style !== 'orch_committee' || !b.perches || b.state !== 'fight') return false; return b.perches.some(q => OK.onMark(p, q.tx, b.floorY / TS, 0.8)); }
  orchInput(p, inp) { if (!inp.actionPressed) return; const b = this.g.boss, q = b.perches.find(q2 => OK.onMark(p, q2.tx, b.floorY / TS, 0.8)); if (q && !brain.pluck(b, q)) { TourKit.sfx('twang', 'spring', { vol: 0.25, pitch: 1.6 }); } }
  touchPlayer() {}
  draw() {}
}
ENTITY_TYPES.orchPerchMark = OrchPerchMark;
{
  // one mark-listener for the lawn, added on the committee's first update
  const up0 = brain.update;
  brain.update = function (b, dt) { if (!b.g.entities.some(e => e instanceof OrchPerchMark)) b.g.spawn(new OrchPerchMark(b.g, { x: b.cx, y: b.floorY })); return up0.call(this, b, dt); };
}
const boss = { id: 'orch_committee', name: 'The Windfall Committee', hp: 6, dims: [110, 70], floats: true, music: 'tour_orch_boss', country: 'orch', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.orch_committee = [20, 20, 20, 20];
Tour.orchKit.committee = brain;
})();
