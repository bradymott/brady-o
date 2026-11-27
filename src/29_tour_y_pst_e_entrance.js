/* ============================================================
   PUPO STANDARD TIME: the way in, from Nepal 12-1 Suspension Bridges (docs/design/chatgpt_lands/SHEET_KEY.md, 07).
   Left of where the level starts, on the first terrace: a trail rest bench against a mossy rock, Pupo asleep on it,
   a honey cushion at its end and a dark hollow in the rock behind it. Pupo breathes slow (four seconds a breath); the
   cushion rises with his breath, AND ONCE MORE, by itself, just after he has finished breathing out (the one clue:
   nothing is breathing then). Stand in the hollow, still, through that extra lift; then walk on into the hollow:
   Brady slips through the rock into the gap in Pupo's sentence. A short arrival (the land's name over the dream),
   the land opens, and the map flies there.
   Nothing in the host level moves: the rock and the bench are added at the far left (columns 0-4), the level's own
   exits, postcards and totals are unchanged; the new exit 'pst' is hidden from the level's exit count until taken.
   No Nepal file is edited: the level is amended here, after it is built.
   ============================================================ */
(function () {
const K = Tour.pstKit, NP = Tour.countries.np; if (!K || !NP) return;
const { PstArt, INK, HONEY, HONEY_LO, HONEY_HI, CREAM } = K;
const HOST = '12-1', BREATH = 4.0;
// Pupo's breath (0..1, 1 = full) and the cushion's lift (with the breath, plus the one extra lift after the exhale)
const breath = t => { const q = t % BREATH; return q < 1.8 ? Math.sin(q / 1.8 * Math.PI / 2) : q < 3.4 ? Math.cos((q - 1.8) / 1.6 * Math.PI / 2) : 0; };
const EXTRA0 = 3.45, EXTRA1 = 3.95;
const extra = t => { const q = t % BREATH; return q >= EXTRA0 && q < EXTRA1 ? Math.sin((q - EXTRA0) / (EXTRA1 - EXTRA0) * Math.PI) : 0; };
const cushionLift = t => Math.max(breath(t) * 0.6, extra(t));

/* the exit and its spec */
const L0 = NP.levels[0];
if (L0 && L0.exits && !L0.exits.pst) L0.exits.pst = { to: 'land:pst', via: 'pstNap' };
TourHooks.exitKind('pstNap', { title: 'A HIDDEN LAND!', marksDone: false });
VALIDATOR_EXITS.pstHollow = { w: 30, h: 54 };
// the level's exit count leaves the hidden exit out until it has been taken (the card is never a hint)
{
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const r = ef0.call(this, id);
    if (id === HOST && !((Save.data.exits || {})[id] || {}).pst && r.total > 0) return { found: r.found, total: r.total - 1 };
    return r;
  };
}

/* the bench, Pupo, the cushion and the rock (one prop, drawn behind Brady) */
class PstBench extends Ent {
  constructor(g, s) { super(g, s, 5 * TS, 3 * TS); this.x = 0; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const t = this.g.t, y = this.y + this.h, b = breath(t), lift = cushionLift(t);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the mossy rock with its hollow (columns 0-1; the hollow is the dark recess at the foot of it)
    ctx.fillStyle = '#7a7a72'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-40, y); ctx.lineTo(-40, y - 7 * TS); ctx.quadraticCurveTo(10, y - 7.6 * TS, 58, y - 6 * TS); ctx.quadraticCurveTo(76, y - 4.5 * TS, 62, y - 2.7 * TS); ctx.lineTo(56, y - 2 * TS - 6); ctx.lineTo(-40, y - 2 * TS - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8e8e84'; ctx.beginPath(); ctx.ellipse(10, y - 5.6 * TS, 34, 16, -0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(40, y - 3.6 * TS, 18, 10, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a9a4a'; for (const [mx, my, r] of [[-10, 6.9, 14], [20, 6.7, 12], [48, 5.6, 10], [60, 4.0, 7]]) { ctx.beginPath(); ctx.ellipse(mx, y - my * TS, r, r * 0.45, 0, 0, TAU); ctx.fill(); }
    // the hollow: dark, soft-edged, under the overhang
    ctx.fillStyle = '#1a1414'; ctx.beginPath(); ctx.moveTo(-40, y); ctx.lineTo(-40, y - 2 * TS - 6); ctx.quadraticCurveTo(14, y - 2 * TS - 18, 50, y - 2 * TS + 2); ctx.quadraticCurveTo(58, y - TS, 46, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(60,40,40,0.6)'; ctx.beginPath(); ctx.ellipse(10, y - 1, 34, 5, 0, 0, TAU); ctx.fill();
    // ivy over the rock
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(50, y - 6 * TS); ctx.quadraticCurveTo(62, y - 4.6 * TS, 52, y - 3 * TS); ctx.stroke();
    ctx.fillStyle = '#6aaa4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(56 + Math.sin(k * 2) * 6, y - 5.8 * TS + k * 16, 5, 3, k, 0, TAU); ctx.fill(); }
    // the bench: two stone feet, a weathered plank (columns 2-4)
    const bx0 = 2 * TS - 6, bx1 = 5 * TS - 4, by = y - 20;
    ctx.fillStyle = '#9a9a90'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    rr(ctx, bx0 + 6, by + 4, 18, 16, 3); ctx.fill(); ctx.stroke(); rr(ctx, bx1 - 24, by + 4, 18, 16, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a5a34'; rr(ctx, bx0, by - 4, bx1 - bx0, 9, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6a4024'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx0 + 10, by); ctx.lineTo(bx1 - 40, by); ctx.stroke();
    // the worn oval hollow in the plank under the cushion
    ctx.fillStyle = '#5a3418'; ctx.beginPath(); ctx.ellipse(bx0 + 22, by - 1, 12, 2.4, 0, 0, TAU); ctx.fill();
    // the honey cushion at the bench's rock end (it rises with the breath, and once more on its own)
    const cy = by - 12 - lift * 7;
    PstArt.cushion(ctx, bx0 + 4, cy, 38, 12 + lift * 2, HONEY, HONEY_LO, HONEY_HI);
    // Pupo asleep along the rest of the bench, his head on his paws, breathing slowly
    const px = bx1 - 30, py = by - 3;
    ctx.save(); ctx.translate(px, py); ctx.scale(1, 1 + b * 0.05); ctx.translate(-px, -py);
    Ink.around(ctx, px - 60, py - 60, 120, 64, c => Pupo.draw(c, { x: px, y: py, scale: 0.62, facing: -1, t, pose: 'sleep', mood: 'sleep' }), { pad: 4, width: 1.6 });
    ctx.restore();
    // his slow z's, only while he breathes out (the extra lift has none: nobody breathed)
    const q = t % BREATH;
    if (q > 1.8 && q < 3.4) { const k = (q - 1.8) / 1.6; PstArt.z(ctx, px - 30 - k * 6, py - 34 - k * 26, 6 + k * 4, 0.8 * Math.sin(k * Math.PI), '#ffffff'); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstBench = PstBench;

/* the hollow: an exit that only opens for someone who waited in it through the extra lift, then walked on in */
class PstHollow extends Ent {
  constructor(g, s) { super(g, s, 30, 54); this.exitKey = s.exit || 'pst'; this.secret = true; this.isPstHollow = true; this.armed = 0; this.go = null; this.friendly = true; this.wasExtra = false; }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt;
    if (this.go) { this.arrival(dt); return; }
    const inside = p && !p.dead && p.state === 'play' && p.onGround && Math.floor(p.cx / TS) <= 0;
    const ex = extra(g.t) > 0;
    // the extra lift: Brady standing still in the hollow through it arms the way in
    if (ex && !this.wasExtra) this.seenStill = inside && Math.abs(p.vx) < 30;
    else if (ex && this.seenStill) this.seenStill = inside && Math.abs(p.vx) < 30;
    if (!ex && this.wasExtra && this.seenStill) { this.armed = 3.0; g.burst(10, this.y + this.h - 30, 4, '#1a1414', 'dust'); Sound.play('select', { vol: 0.35, pitch: 0.5 }); }
    this.wasExtra = ex;
    if (this.armed > 0) this.armed -= dt;
    // then walking on into the hollow (left, against the rock) slips him through
    if (this.armed > 0 && inside && p.inp && p.inp.left) { this.pushT = (this.pushT || 0) + dt; if (this.pushT > 0.25) this.enter(p); } else this.pushT = 0;
  }
  enter(p) {
    const g = this.g; this.go = { t: 0 }; this.used = true;
    p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 5;
    TourKit.sfx('portal', 'portal', { vol: 0.6, pitch: 0.6 }); Sound.play('float', { vol: 0.5, pitch: 0.7 });
    g.pstArrival = { t: 0, x: p.cx, y: p.y };
  }
  arrival(dt) {
    const g = this.g, p = g.player, A = this.go; A.t += dt;
    if (p && A.t < 1.0) { p.x = lerp(p.x, -p.w, Math.min(1, dt * 2.2)); }
    if (A.t >= 3.4 && !A.cleared) { A.cleared = true; g.levelClear(this); }
  }
  touchPlayer() {}
  draw() {}
}
ENTITY_TYPES.pstHollow = PstHollow;
// Brady stays gone through the clear (no walk to a gate, no pose): he is in the dream now
TourHooks.on('levelClear', (play, gate) => { if (!gate || !gate.isPstHollow) return; const p = play.player; if (p) { p.state = 'portal'; p.portalT = 1; p.vx = 0; p.vy = 0; } });
TourHooks.on('playUpdate', (play, dt) => { if (play.pstArrival) play.pstArrival.t += dt; });
// the arrival: the screen fills with honey dusk and drifting thought bubbles; the land's name, then on to the map
TourHooks.on('afterEntities', (play, ctx) => {
  const A = play.pstArrival; if (!A) return;
  const t = A.t, x0 = play.camX, y0 = play.camY, W = Game.viewW, H = Game.viewH, k = clamp((t - 0.6) / 0.8, 0, 1);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + H); g.addColorStop(0, '#3a1a4a'); g.addColorStop(0.6, '#7a3a6a'); g.addColorStop(1, '#e89a7a');
  ctx.fillStyle = g; ctx.fillRect(x0 - 4, y0 - 4, W + 8, H + 8);
  for (let q = 0; q < 6; q++) { const bx = x0 + W * (0.1 + q * 0.16), by = y0 + H * 0.7 - ((t * 40 + q * 37) % (H * 0.7)); PstArt.bubble(ctx, bx, by, 60, 26); }
  const s = clamp((t - 1.2) / 0.5, 0, 1);
  if (s > 0) {
    ctx.globalAlpha = k * s; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '30px ' + FONT_DISPLAY; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('PUPO STANDARD TIME', x0 + W / 2, y0 + H * 0.42); ctx.fillStyle = HONEY; ctx.fillText('PUPO STANDARD TIME', x0 + W / 2, y0 + H * 0.42);
    ctx.font = '13px ' + FONT_DISPLAY; ctx.lineWidth = 4; ctx.strokeText('A HIDDEN LAND, BETWEEN "MORE..." AND "...TRIP"', x0 + W / 2, y0 + H * 0.42 + 34); ctx.fillStyle = CREAM; ctx.fillText('A HIDDEN LAND, BETWEEN "MORE..." AND "...TRIP"', x0 + W / 2, y0 + H * 0.42 + 34);
    for (let q = 0; q < 3; q++) PstArt.z(ctx, x0 + W / 2 + 150 + q * 16, y0 + H * 0.3 - q * 18 - Math.sin(t * 2 + q) * 4, 8 + q * 3, s, '#ffffff');
  }
  ctx.restore();
});

/* the host level, amended after it is built: the rock over the hollow (invisible tiles, drawn by the prop), the
   bench and the exit. Columns 0-4 of the first terrace; nothing else in the level changes. */
{
  const gen0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (C0, spec, w, i, attempt) {
    const L = gen0.call(this, C0, spec, w, i, attempt);
    if (!C0 || C0.id !== 'np' || i !== 1 || !L.areas[0]) return L;
    const A = L.areas[0];
    // the terrace floor's top row at the far left
    let fy = -1; for (let y = 0; y < A.H; y++) if (SOLID[A.tiles[y * A.W + 1]]) { fy = y; break; }
    if (fy < 8) return L;
    // the rock: columns 0-1, five rows over the hollow (two rows high) at the floor
    for (let y = fy - 7; y <= fy - 3; y++) for (const x of [0, 1]) { if (A.tiles[y * A.W + x] === T.EMPTY) { A.tiles[y * A.W + x] = T.HARD; A.hide[y * A.W + x] = 1; } }
    A.spawns.push({ type: 'pstBench', x: 2.5 * TS, y: fy * TS });
    A.spawns.push({ type: 'pstHollow', exit: 'pst', x: TS / 2, y: fy * TS });
    return L;
  };
}
Tour.pstKit.entrance = { HOST, breath, extra, cushionLift, BREATH, EXTRA0, EXTRA1 };
})();
