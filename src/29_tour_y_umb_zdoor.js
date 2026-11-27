/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the hidden entrance (docs/handoff/HIDDEN_LAND_BRIEF.md, SHEET_KEY 06). In Amsterdam
   8-1, Polder Pumps, on the last stretch of quay before the gate: a green canal bench stands at the quay's edge, a
   tin umbrella stand bolted to its end, hanging out over a lower quay (a mooring step a few rows down, beside the
   canal). Under the stand's open bottom, three furled umbrellas hang on an iron hook down the quay wall. Two of them
   drip from their tips, as wet umbrellas do. The third one's handle drips UPWARD, into the stand.
   From the lower quay, jump up into the stand's open bottom: Brady slips up inside it and comes out where the
   umbrellas are mended. The land's name comes up, 8-1 clears through its exit 'umb' (to: 'land:umb'), the land opens
   and appears on the route map, and its first stage can be entered from there from then on.
   The street jumps the lower quay's gap (an easy hop; a fall only lands on the mooring step, with a step back up):
   the stand is passed close by on the way to the gate, but a hop over the gap can't trip it.
   Amsterdam's own files are not touched: 8-1 is amended from here (its script gains the quay piece before the gate,
   the level gains the exit). Its postcards, its other exits and their pips on the level card stay as they were: this
   exit's pip only shows once it has been taken. The prop is painted the way Amsterdam paints its own street things:
   flat shapes, no outlines, the quay's greens and greys.
   ============================================================ */
(function () {
const NL = Tour.countries.nl, UK = Tour.umbKit;
if (!NL || !UK || !NL.levels[0]) return;
const DROP = '#4a8ab8';

/* ---------------- the bench and the umbrella stand (decor; x: the stand's middle, y: the street) ---------------- */
Decor.umbQuayBench = function (ctx, x, y, t) {
  const S = TS;
  ctx.save();
  // the bench: green slats on cast-iron ends, set back from the quay edge
  const bx = x - 3.6 * S;
  ctx.fillStyle = '#1e1e26'; ctx.fillRect(bx - 4, y - 30, 6, 30); ctx.fillRect(bx + 2.6 * S, y - 30, 6, 30);
  ctx.fillRect(bx - 6, y - 34, 10, 6); ctx.fillRect(bx + 2.6 * S - 2, y - 34, 10, 6);
  ctx.fillStyle = '#2e6a4a'; for (let k = 0; k < 3; k++) ctx.fillRect(bx - 8, y - 32 + k * 5 - 2, 2.6 * S + 22, 4);
  ctx.fillStyle = '#3e8a5e'; for (let k = 0; k < 3; k++) ctx.fillRect(bx - 4, y - 62 + k * 8, 2.6 * S + 14, 6);
  ctx.fillStyle = '#1e1e26'; ctx.fillRect(bx - 2, y - 64, 5, 34); ctx.fillRect(bx + 2.6 * S + 2, y - 64, 5, 34);
  // the bracket from the bench's end out to the stand
  ctx.fillStyle = '#4a4a56'; ctx.fillRect(bx + 2.6 * S + 4, y - 44, x - (bx + 2.6 * S + 4) - 8, 5);
  ctx.restore();
};
// the stand itself is the way in (the entity below draws it, the open bottom glowing when Brady is close)
class UmbStandDoor extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s);
    this.exitKey = s.exit || 'umb'; this.secret = true; this.isUmbDoor = true;
    // the validator's box (VALIDATOR_EXITS.umbStandDoor): the open bottom of the stand and the air just under it
    this.w = 1.4 * TS; this.h = 1.8 * TS; this.x = s.x - this.w / 2; this.y = s.y - this.h;
    this.gy = s.gy; this.used = false; this.slip = null; this.near = 0;
  }
  update(dt) {
    this.t += dt;
    const p = this.g.player;
    if (p && !p.dead) this.near = Math.abs(p.cx - this.cx) < 2.5 * TS && p.y > this.gy * TS - TS ? Math.min(1, this.near + dt * 3) : Math.max(0, this.near - dt * 3);
    if (this.slip != null) {
      this.slip += dt;
      if (p && p.state === 'portal') { p.x = lerp(p.x, this.cx - p.w / 2, Math.min(1, dt * 8)); p.y -= 2.4 * TS * dt; }
      if (this.slip > 0.25 && !this.named) { this.named = true; this.g.bannerText = 'THE UMBRELLA REPAIR DISTRICT'; this.g.bannerT = 2.6; }
      if (this.slip > 1.4 && !this.cleared) { this.cleared = true; this.g.levelClear(this); }
    }
  }
  touchPlayer(p) {
    // up into the stand from underneath only: a jump up into its open bottom (never a fall, never a walk past)
    if (this.used || p.dead || p.state !== 'play' || this.g.state !== 'play' || !(p.vy < 0)) return;
    this.used = true; this.slip = 0;
    p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3;
    TourKit.sfx('swish', 'portal', { vol: 0.6, pitch: 1.2 }); this.g.burst(this.cx, this.gy * TS + 1.0 * TS, 12, '#9ac8e8', 'confetti');
  }
  draw(ctx) {
    const t = this.t, x = this.cx, gy = this.gy * TS;
    ctx.save();
    // the tin stand: a cylinder on its bracket, its bottom open over the lower quay
    const top = gy - 1.1 * TS, bot = gy + 0.75 * TS, w = 28;
    ctx.fillStyle = '#c8bfa8'; ctx.fillRect(x - w / 2, top, w, bot - top);
    ctx.fillStyle = '#a89c84'; ctx.fillRect(x + w / 2 - 8, top, 8, bot - top);
    ctx.fillStyle = '#dcd4c0'; ctx.fillRect(x - w / 2 + 3, top, 4, bot - top);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - w / 2, top + 14, w, 3); ctx.fillRect(x - w / 2 + 5, bot - 20, 6, 4);
    ctx.fillStyle = '#b8ae96'; ctx.beginPath(); ctx.ellipse(x, top, w / 2, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(x, top, w / 2 - 3, 3, 0, 0, TAU); ctx.fill();
    // two umbrellas' crooks stick up out of its top
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 4; for (const [dx, h] of [[-6, 18], [5, 14]]) { ctx.beginPath(); ctx.moveTo(x + dx, top + 2); ctx.lineTo(x + dx, top - h); ctx.arc(x + dx + 5, top - h, 5, Math.PI, 0); ctx.stroke(); }
    // the open bottom (a dark ring, a faint light inside when Brady is close: as if it goes somewhere)
    ctx.fillStyle = '#9a9078'; ctx.beginPath(); ctx.ellipse(x, bot, w / 2, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = this.near > 0 ? `rgba(40,40,60,${1 - 0.3 * this.near})` : '#28283a'; ctx.beginPath(); ctx.ellipse(x, bot, w / 2 - 3, 3.2, 0, 0, TAU); ctx.fill();
    if (this.near > 0) { ctx.fillStyle = `rgba(255,214,120,${0.35 * this.near * (0.6 + 0.4 * Math.sin(t * 3))})`; ctx.beginPath(); ctx.ellipse(x, bot, w / 2 - 5, 2, 0, 0, TAU); ctx.fill(); }
    // the hook under it on a rod from the quay wall, three furled umbrellas hanging down the wall
    const hy = bot + 0.35 * TS;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - w / 2 - 10, hy - 3, 22, 4);
    const cols = ['#2a3a5a', '#3a2a4a', '#2a4a3a'], xs = [x - 12, x - 2, x + 9];
    xs.forEach((ux, k) => {
      ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(ux - 3, hy + 2, 4, Math.PI, 0); ctx.lineTo(ux + 1, hy + 2); ctx.arc(ux - 3, hy + 2, 1.5, 0, Math.PI, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.moveTo(ux - 1, hy + 5); ctx.lineTo(ux + 2, hy + 5); ctx.lineTo(ux + 5, hy + 30); ctx.lineTo(ux + 1, hy + 50); ctx.lineTo(ux - 4, hy + 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a5a64'; ctx.fillRect(ux - 0.5, hy + 50, 2, 5);
    });
    // two ordinary drips from the tips, falling down the wall into the canal
    for (const k of [0, 2]) { const ph = (t * 0.7 + k * 0.37) % 1; ctx.fillStyle = DROP; ctx.beginPath(); ctx.arc(xs[k] + 0.5, hy + 56 + ph * 1.6 * TS, 3, 0, TAU); ctx.fill(); }
    // THE CLUE: the middle umbrella's handle sheds its drop UPWARD, into the stand's open bottom
    { const ph = (t * 0.55) % 1, ux = xs[1] - 3, yy = hy - 2 - ph * (hy - bot - 2); ctx.globalAlpha = ph > 0.85 ? (1 - ph) / 0.15 : 1; ctx.fillStyle = DROP; ctx.beginPath(); ctx.arc(ux, yy, 3.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(ux - 3, yy + 1); ctx.lineTo(ux, yy + 7.5); ctx.lineTo(ux + 3, yy + 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(ux - 1, yy - 1, 1.1, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  }
}
ENTITY_TYPES.umbStandDoor = UmbStandDoor;
VALIDATOR_EXITS.umbStandDoor = { w: 1.4 * TS, h: 1.8 * TS };

// the quay piece in a strip: { } (18 wide). The street (row gy) runs to the bench and the stand at the quay edge;
// the lower quay (a mooring step, three rows down, five wide) under the stand; a step back up; the street again.
Tour.pieces['umb.quay'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 9);
  for (let xx = x + 10; xx <= x + 14; xx++) { B.clearCol(xx, 0, gy + 2); B.fill(xx, gy + 3, xx, B.H - 1, T.GROUND); }
  B.fill(x + 14, gy + 1, x + 14, B.H - 1, T.GROUND);
  st.floor(x + 15, x + 17);
  B.decorAt('umbQuayBench', x + 10, gy, 0);
  B.spawn('umbStandDoor', x + 10, gy + 1, { exit: 'umb', gy });
  return x + 18;
};

/* ---------------- 8-1, amended: the quay before the gate, the exit to the land ---------------- */
{
  const L0 = NL.levels[0];
  const areas = L0.areas.map(a => {
    if (a.id !== 'polder' || !Array.isArray(a.script)) return a;
    const sc = a.script.slice(), k = sc.findIndex(s => Array.isArray(s) && s[0] === 'gate');
    sc.splice(k >= 0 ? k : sc.length, 0, ['umb.quay', {}]);
    return Object.assign({}, a, { script: sc, W: (a.W || 220) + 18 });
  });
  const exits = Object.assign({}, L0.exits, { umb: { to: 'land:umb' } });
  Tour.amend('nl', { levels: [Object.assign({}, L0, { n: 1, areas, exits })] });
}
// the level card's exit pips: the way up the umbrella stand is not counted until it has been found
{
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const r = ef0.call(this, id), L = Tour.specOf(id);
    if (!L || !L.exits || !L.exits.umb || L.exits.umb.to !== 'land:umb') return r;
    const E = (Save.data.exits || {})[id] || {};
    return E.umb ? r : { found: r.found, total: Math.max(0, r.total - 1) };
  };
}
})();
