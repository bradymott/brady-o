/* ============================================================
   THE ORCHARD AFTER CLOSING: the hidden way in (the land's best secret), in Japan 11-3 NIGHT OF THINGS.
   ChatGPT's entrance: "walk behind the orchard's last tree and jump into the underside of its lowest fork. One pear
   hangs from a garden tie instead of a stalk."
   In the bamboo grove's first, sunlit stretch (before the wind chime), the path passes a little pear orchard: three
   pear trees painted the way Japan paints its grove (flat soft colours, no ink line), each hung with pale pears on
   their stalks. The last tree stands nearest the path; its trunk is in FRONT of Brady (he walks behind it). On that
   tree one pear hangs from a rust-red garden tie instead of a stalk: the only odd thing there. No sign, no arrow, no
   coins, nothing on the level card. Behind the trunk, jump straight up into the underside of its lowest fork: Brady
   slips up into the tree, the land's name comes up and 11-3 clears through its new 'orch' exit, which opens the land.
   The host level's files are not touched: this file re-registers 11-3 with one piece added in its first stretch and
   one exit added; its other exits, postcards and totals are as they were.
   The checker: an exit box in the air under the fork (only a jump from behind the trunk reaches it).
   ============================================================ */
(function () {
const JP = Tour.countries.jp, OK = Tour.orchKit;
if (!JP || !OK || !JP.levels[2]) return;

/* ---------------- the orchard, in Japan's own painting: flat colours, soft shading, no ink ---------------- */
const JPC = { trunk: '#6a5040', trunk2: '#8a6a52', leaf: '#5a9a52', leaf2: '#7ab86a', leaf3: '#4a8048', pear: '#d8dc84', pear2: '#c0c868', stalk: '#5a4030', tie: '#c0462a', tie2: '#9a3420', stake: '#d8d0bc' };
const jpPear = (ctx, x, y, s, tie) => {
  // a pale pear (its bottom at y), flat shaded; on a stalk, or (the clue) tied up by a rust-red garden tie
  ctx.fillStyle = JPC.pear; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 9 * s, y, x - 9 * s, y - 10 * s, x - 4 * s, y - 12 * s); ctx.bezierCurveTo(x - 3 * s, y - 16 * s, x - 2 * s, y - 18 * s, x, y - 18 * s); ctx.bezierCurveTo(x + 2 * s, y - 18 * s, x + 3 * s, y - 16 * s, x + 4 * s, y - 12 * s); ctx.bezierCurveTo(x + 9 * s, y - 10 * s, x + 9 * s, y, x, y); ctx.fill();
  ctx.fillStyle = JPC.pear2; ctx.beginPath(); ctx.ellipse(x + 3 * s, y - 5 * s, 3.5 * s, 4 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,240,0.5)'; ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 9 * s, 1.6 * s, 3 * s, 0.3, 0, TAU); ctx.fill();
  if (!tie) { ctx.strokeStyle = JPC.stalk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y - 17 * s); ctx.lineTo(x + 1, y - 24 * s); ctx.stroke(); return; }
  // the garden tie: a rust band round the neck, two loops and two tails, its knot up to the branch
  ctx.fillStyle = JPC.tie; ctx.fillRect(x - 3.5 * s, y - 16 * s, 7 * s, 3 * s); ctx.fillRect(x - 1, y - 24 * s, 2, 8 * s);
  ctx.beginPath(); ctx.ellipse(x - 4 * s, y - 18 * s, 3 * s, 1.8 * s, 0.6, 0, TAU); ctx.ellipse(x + 4 * s, y - 18 * s, 3 * s, 1.8 * s, -0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = JPC.tie2; ctx.beginPath(); ctx.moveTo(x + 1, y - 15 * s); ctx.lineTo(x + 6 * s, y - 6 * s); ctx.lineTo(x + 3 * s, y - 7 * s); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 1, y - 15 * s); ctx.lineTo(x - 4 * s, y - 7 * s); ctx.lineTo(x - 2 * s, y - 8 * s); ctx.closePath(); ctx.fill();
};
// a pear tree: a short trunk forking low, two limbs, a round flat canopy. part: 'back' (limbs, canopy, pears) or
// 'trunk' (the trunk and the low fork, drawn in front of Brady for the last tree); tie: which pear is tied (-1: none)
function jpTree(ctx, x, y, s, part, tie, t) {
  const fy = y - 3.8 * TS;
  if (part !== 'trunk') {
    ctx.fillStyle = JPC.trunk; ctx.lineCap = 'round'; ctx.strokeStyle = JPC.trunk; ctx.lineWidth = 12 * s;
    ctx.beginPath(); ctx.moveTo(x, fy); ctx.quadraticCurveTo(x - 30 * s, fy - 40 * s, x - 62 * s, fy - 70 * s); ctx.moveTo(x, fy); ctx.quadraticCurveTo(x + 34 * s, fy - 36 * s, x + 66 * s, fy - 64 * s); ctx.moveTo(x, fy); ctx.lineTo(x + 4 * s, fy - 96 * s); ctx.stroke();
    for (const [dx, dy, r, c] of [[-60, -96, 46, JPC.leaf3], [60, -92, 46, JPC.leaf3], [0, -124, 54, JPC.leaf], [-34, -78, 40, JPC.leaf], [36, -76, 40, JPC.leaf], [-12, -140, 30, JPC.leaf2], [24, -108, 26, JPC.leaf2]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * s, fy + dy * s, r * s, 0, TAU); ctx.fill(); }
    // its pears, hanging below the canopy on stalks
    const P = [[-70, -54], [-30, -48], [8, -62], [44, -50], [78, -46]];
    P.forEach(([dx, dy], k) => jpPear(ctx, x + dx * s, fy + dy * s + Math.sin(t * 1.3 + k) * 1.2, s, k === tie));
  }
  if (part !== 'back') {
    // the trunk and its low fork (bark stripes, a little moss)
    ctx.fillStyle = JPC.trunk; ctx.beginPath(); ctx.moveTo(x - 13 * s, y); ctx.quadraticCurveTo(x - 9 * s, fy + 30, x - 6 * s, fy); ctx.lineTo(x + 6 * s, fy); ctx.quadraticCurveTo(x + 9 * s, fy + 30, x + 14 * s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = JPC.trunk2; ctx.fillRect(x - 3 * s, fy + 10, 4 * s, y - fy - 14);
    ctx.fillStyle = 'rgba(120,160,90,0.55)'; ctx.beginPath(); ctx.ellipse(x - 6 * s, y - 30, 5, 9, 0.2, 0, TAU); ctx.fill();
    // the fork's underside: two limbs parting, a dark crook between them
    ctx.fillStyle = JPC.trunk; ctx.beginPath(); ctx.moveTo(x - 8 * s, fy + 6); ctx.quadraticCurveTo(x - 16 * s, fy - 12, x - 26 * s, fy - 22); ctx.lineTo(x - 16 * s, fy - 26); ctx.quadraticCurveTo(x - 6 * s, fy - 10, x, fy - 6); ctx.quadraticCurveTo(x + 8 * s, fy - 12, x + 18 * s, fy - 24); ctx.lineTo(x + 26 * s, fy - 18); ctx.quadraticCurveTo(x + 14 * s, fy - 8, x + 8 * s, fy + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(40,24,16,0.5)'; ctx.beginPath(); ctx.ellipse(x, fy - 6, 5 * s, 3 * s, 0, 0, TAU); ctx.fill();
  }
}
Object.assign(Decor, {
  // an ordinary orchard tree (its pears all on stalks), behind the path
  orchJpTree(ctx, x, y, t, th, d) { jpTree(ctx, x, y, (d && d.s) || 0.9, 'all', -1, t || 0); },
  // a bamboo stake with a rope ring (the orchard's edge), Japan's flat look
  orchJpStake(ctx, x, y) { ctx.fillStyle = JPC.stake; ctx.fillRect(x - 3, y - 70, 6, 70); ctx.fillStyle = '#b8ae98'; ctx.fillRect(x - 3, y - 50, 6, 3); ctx.fillRect(x - 3, y - 20, 6, 3); }
});

/* ---------------- the last tree and the way in ---------------- */
class OrchJpTree extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.tx = s.tx; this.gy = s.gy; this.x = this.tx * TS; this.y = (this.gy - 4) * TS; this.w = TS; this.h = 4 * TS; this.back = true; this.friendly = true;
    this.exitKey = 'orch'; this.secret = true; this.arr = -1; this.trunkX = (this.tx + 0.5) * TS; this.forkY = this.gy * TS - 3.8 * TS;
  }
  update(dt) {
    this.t += dt;
    const g = this.g, p = g.player;
    if (!p || p.dead) return;
    if (this.arr >= 0) {
      this.arr += dt; p.vx = 0; p.vy = 0; p.x = this.trunkX - p.w / 2; p.y = Math.max(this.forkY - p.h - this.arr * 60, this.forkY - p.h - 50); p.invuln = Math.max(p.invuln || 0, 0.5);
      if (this.arr > 0.3 && !this.named) { this.named = true; g.bannerText = 'THE ORCHARD AFTER CLOSING'; g.bannerT = 2.6; TourKit.sfx('secret', 'secret', { vol: 0.9 }); if (g.toast) g.toast('A HIDDEN LAND! UP THROUGH THE PEAR TREE...'); }
      if (this.arr > 2.3 && g.state === 'play') { p.state = 'play'; g.levelClear(this); }
      return;
    }
    // behind the trunk, rising, his head into the fork's underside
    if (p.vy < 0 && Math.abs(p.cx - this.trunkX) < 0.9 * TS && p.y <= this.forkY + 4 && p.y > this.forkY - TS) {
      this.arr = 0; p.stunT = 3; g.burst(this.trunkX, this.forkY, 14, JPC.leaf2, 'confetti'); TourKit.sfx('rustle', 'kick', { vol: 0.5, pitch: 1.4 });
    }
  }
  touchPlayer() {}
  // the canopy and its pears behind everything (one of them on the tie)
  draw(ctx) { jpTree(ctx, this.trunkX, this.gy * TS, 0.9, 'back', 2, this.t); if (this.arr >= 0) { const k = Math.min(1, this.arr); for (let q = 0; q < 6; q++) { ctx.fillStyle = `rgba(120,184,106,${1 - k})`; ctx.beginPath(); ctx.ellipse(this.trunkX + Math.sin(q * 2 + this.arr * 8) * 30, this.forkY - 40 + q * 6 - this.arr * 30, 6, 3, q, 0, TAU); ctx.fill(); } } }
}
ENTITY_TYPES.orchJpTree = OrchJpTree;
// the last tree's trunk and fork in front of Brady (he walks behind it); while he slips up, he is hidden by it
TourHooks.on('afterEntities', (play, ctx) => {
  for (const e of play.entities) if (e instanceof OrchJpTree && !e.remove && play.onScreen(e, 200)) jpTree(ctx, e.trunkX, e.gy * TS, 0.9, 'trunk', -1, e.t);
});
// while slipping in, Brady is drawn rising up into the crook (clipped at the fork)
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    const e = this.g && this.g.entities && this.g.entities.find(q => q instanceof OrchJpTree && q.arr >= 0);
    if (!e) return dr0.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 60, e.forkY - 10, this.w + 120, 400); ctx.clip(); dr0.apply(this, arguments); ctx.restore();
  };
}
// the checker: an exit box in the air just under the fork, behind the trunk (a standing body never reaches it)
if (typeof VALIDATOR_EXITS !== 'undefined') VALIDATOR_EXITS.orchJpTree = { w: 20, h: 18 };

/* the orchard piece, run inside 11-3's strip: 22 tiles of grass, three trees, the last one nearest the path */
Tour.pieces['orch.jpOrchard'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 21);
  B.decorAt('orchJpStake', x + 1, gy, 0); B.decorAt('orchJpStake', x + 20, gy, 1);
  B.decor.push({ kind: 'orchJpTree', x: (x + 5) * TS, y: gy * TS, seed: 0, s: 0.75 });
  B.decor.push({ kind: 'orchJpTree', x: (x + 10) * TS, y: gy * TS, seed: 1, s: 0.82 });
  const s = B.spawn('orchJpTree', x + 16, gy - 1, { tx: x + 16, gy, exit: 'orch' });
  // the checker's box: its feet line 3.6 rows up (s.y), 18 px tall
  s.y = gy * TS - 3.6 * TS;
  return x + 22;
};

/* ---------------- 11-3, amended: the orchard in the first (sunlit) stretch, the 'orch' exit ---------------- */
{
  const L0 = JP.levels[2];
  if (L0 && L0.areas && !L0.exits.orch) {
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 3; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { orch: { to: 'land:orch' } });
    const A = spec.areas.find(a => a.id === 'chikurin'), k = A.script.findIndex(s2 => s2 === 'grove');
    A.script.splice(k + 1, 0, ['orch.jpOrchard', {}]);
    Tour.amend('jp', { levels: [spec] });
  }
}
})();
