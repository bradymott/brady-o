/* ============================================================
   FOLEY BEACH: the way in, from Brazil 3-1 Samba Sunrise (docs/design/chatgpt_lands/SHEET_KEY.md, 04).
   Left of where the level starts (behind Brady as he arrives): the beach band's empty riser, its surdo stack still on
   it, and behind the riser a painted sea on a plywood flat propped up by two struts. One wave, and only one, has a
   brass fastener in its foam: the clue (the flat's other corners are plain). That wave is a loose flap. Stand on the
   riser and jump into its foam (pushing toward the flat): Brady slips through the painted sea. A short arrival (the
   land's name over a curtain of sound rings), the land opens, and the map flies there.
   Everything is painted in Brazil's own flat style (no ink line, its green, yellow and plank brown).
   Nothing in the host level moves: the riser and the flat are added at the far left (columns 0-4), the surdo stack
   that stood there is lifted onto the riser, the level's own exits, postcards and totals are unchanged; the new exit
   'foley' is left out of the level's exit count until taken. No Brazil file is edited: the level is amended here,
   after it is built.
   ============================================================ */
(function () {
const K = Tour.foleyKit, BR = Tour.countries.br; if (!K || !BR) return;
const { FArt, INK, IVORY, TIN, APRI } = K;
const HOST = '3-1';
// Brazil's own colours (29_tour_br_levels.js): the samba green and yellow, plank brown, cream
const BG = '#1aa85a', BY = '#ffd23a', BW = '#8a5a3a', BW2 = '#6a4228', BC = '#f4f0e4', SEA = '#3a7ad8', SEA2 = '#2a5ab8', FOAM = '#f4f0e4', BRASSC = '#e8b030';
// the fastener's wave: its foam's centre (px, from the riser's left end and the riser's top)
const FOAM_X = 1.6 * TS, FOAM_DY = 2.9 * TS, FOAM_R = 16;

/* the exit and its spec */
const L0 = BR.levels[0];
if (L0 && L0.exits && !L0.exits.foley) L0.exits.foley = { to: 'land:foley', via: 'foleySea' };
TourHooks.exitKind('foleySea', { title: 'A HIDDEN LAND!', marksDone: false });
VALIDATOR_EXITS.foleyFlap = { w: 30, h: 40 };
// the level's exit count leaves the hidden exit out until it has been taken (the card is never a hint)
{
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const r = ef0.call(this, id);
    if (id === HOST && !((Save.data.exits || {})[id] || {}).foley && r.total > 0) return { found: r.found, total: r.total - 1 };
    return r;
  };
}

/* the riser and the painted sea flat (one prop, drawn behind Brady) */
class FoleyRiser extends Ent {
  constructor(g, s) { super(g, s, 5 * TS, TS); this.x = 0; this.y = s.y - TS; this.friendly = true; this.back = true; this.flap = 0; }
  update(dt) { this.t += dt; if (this.flap > 0) this.flap = Math.max(0, this.flap - dt); }
  touchPlayer() {}
  draw(ctx) {
    const top = this.y, t = this.t;
    ctx.save();
    // the flat: a plywood board painted as the sea, two struts behind it
    const fx = -6, fw = 4.6 * TS, fy = top - 4.4 * TS, fh = 4.4 * TS;
    ctx.fillStyle = BW2; ctx.save(); ctx.translate(fx + fw - 10, top); ctx.rotate(-0.28); ctx.fillRect(-3, -fh * 0.9, 6, fh * 0.9); ctx.restore();
    ctx.fillStyle = '#c8a070'; ctx.fillRect(fx - 4, fy - 4, fw + 8, fh + 4);
    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
    ctx.fillStyle = '#8ac8f0'; ctx.fillRect(fx, fy, fw, fh);
    // three waves, front to back; the second's crest curls into the foam with the brass fastener
    const wave = (y0, amp, col, crest) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx, fy + fh);
      for (let x = fx; x <= fx + fw; x += 6) ctx.lineTo(x, y0 + Math.sin((x - fx) * 0.045 + amp) * 10);
      ctx.lineTo(fx + fw, fy + fh); ctx.closePath(); ctx.fill();
      if (crest) { ctx.fillStyle = FOAM; for (let x = fx + 20; x < fx + fw; x += 52) { ctx.beginPath(); ctx.ellipse(x, y0 + Math.sin((x - fx) * 0.045 + amp) * 10 - 2, 14, 5, -0.3, 0, TAU); ctx.fill(); } }
    };
    wave(fy + fh * 0.62, 0.5, SEA, true);
    // the curling wave with the loose flap: its foam curl at the fastener; while it swings, the flap lifts
    const cx = FOAM_X, cy = top - FOAM_DY, sw = this.flap > 0 ? Math.sin(this.flap * 18) * 0.25 : 0;
    ctx.save(); ctx.translate(fx, cy + 30); ctx.rotate(sw);
    ctx.fillStyle = SEA2; ctx.beginPath(); ctx.moveTo(0, 40); ctx.quadraticCurveTo(cx + 10, -40, cx + 70, -14); ctx.quadraticCurveTo(cx + 40, -10, cx + 30, 10); ctx.lineTo(cx + 90, 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = FOAM; ctx.beginPath(); ctx.arc(cx - fx, -30, FOAM_R + 4, Math.PI * 0.9, Math.PI * 2.3); ctx.quadraticCurveTo(cx - fx + 34, -22, cx - fx + 48, -16); ctx.quadraticCurveTo(cx - fx + 20, -6, cx - fx - 6, -18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = SEA2; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 20; k++) { const an = k / 20 * TAU * 1.3, r = 2 + k * 0.45; ctx.lineTo(cx - fx + 4 + Math.cos(an) * r, -29 + Math.sin(an) * r); } ctx.stroke();
    // the clue: one small brass fastener in that foam (a round head, a slot)
    ctx.fillStyle = BRASSC; ctx.beginPath(); ctx.arc(cx - fx - 8, -34, 4.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.arc(cx - fx - 9, -35.5, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a6010'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - fx - 11, -32); ctx.lineTo(cx - fx - 5, -36); ctx.stroke();
    ctx.restore();
    wave(fy + fh * 0.82, 2.1, SEA, true);
    ctx.restore();
    // the board's plain corners and edge (no fastener there: the one in the foam is the only odd thing)
    ctx.strokeStyle = BW; ctx.lineWidth = 3; ctx.strokeRect(fx, fy, fw, fh);
    // the riser: a low plank stage with the samba green and yellow trim
    ctx.fillStyle = BW; ctx.fillRect(0, top, 5 * TS, TS);
    ctx.fillStyle = '#a8724a'; for (let x = 0; x < 5 * TS; x += 32) ctx.fillRect(x + 2, top + 3, 28, 4);
    ctx.fillStyle = BY; ctx.fillRect(0, top, 5 * TS, 4); ctx.fillStyle = BG; ctx.fillRect(0, top + TS - 8, 5 * TS, 5);
    ctx.fillStyle = BW2; ctx.fillRect(5 * TS - 6, top, 6, TS);
    // a pandeiro on a little stand (nobody to play it): silver jingles
    const px = 3.6 * TS, py = top;
    ctx.fillStyle = '#5a5a64'; ctx.fillRect(px - 1.5, py - 26, 3, 26); ctx.fillRect(px - 10, py - 2, 20, 2);
    ctx.fillStyle = BC; ctx.beginPath(); ctx.ellipse(px, py - 30, 12, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = BW; ctx.fillRect(px - 12, py - 30, 24, 5);
    ctx.fillStyle = '#c8c8d0'; for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(px + dx, py - 27, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
ENTITY_TYPES.foleyRiser = FoleyRiser;

/* the flap: an exit that opens only for a jump into the fastener's foam from the riser, pushing toward the flat */
class FoleyFlap extends Ent {
  constructor(g, s) { super(g, s, 30, 40); this.exitKey = s.exit || 'foley'; this.secret = true; this.isFoleyFlap = true; this.go = null; this.friendly = true; this.top = s.top; }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt;
    if (this.go) { this.arrival(dt); return; }
    if (!p || p.dead || p.state !== 'play' || p.onGround) return;
    const fx = FOAM_X - 6, fy = this.top - FOAM_DY;
    // his head in the foam, moving up into it, pushing toward the flat (left)
    const hx = p.cx, hy = p.y + 4;
    if (Math.abs(hx - fx) < 1.3 * TS && hy < fy + FOAM_R && hy > fy - 2.6 * TS && p.inp && p.inp.left) this.enter(p);
  }
  enter(p) {
    const g = this.g; this.go = { t: 0 }; this.used = true;
    const R = g.entities.find(e => e instanceof FoleyRiser); if (R) R.flap = 1.2;
    p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 5;
    TourKit.sfx('portal', 'portal', { vol: 0.6, pitch: 0.8 }); Sound.play('splash', { vol: 0.5 });
    g.foleyArrival = { t: 0, x: p.cx, y: p.y };
  }
  arrival(dt) {
    const g = this.g, p = g.player, A = this.go; A.t += dt;
    if (p && A.t < 0.8) { p.x = lerp(p.x, -p.w, Math.min(1, dt * 3)); }
    if (A.t >= 3.4 && !A.cleared) { A.cleared = true; g.levelClear(this); }
  }
  touchPlayer() {}
  draw() {}
}
ENTITY_TYPES.foleyFlap = FoleyFlap;
TourHooks.on('levelClear', (play, gate) => { if (!gate || !gate.isFoleyFlap) return; const p = play.player; if (p) { p.state = 'portal'; p.portalT = 1; p.vx = 0; p.vy = 0; } });
TourHooks.on('playUpdate', (play, dt) => { if (play.foleyArrival) play.foleyArrival.t += dt; });
// the arrival: the screen fills with the show's dusk, sound rings bloom, the land's name
TourHooks.on('afterEntities', (play, ctx) => {
  const A = play.foleyArrival; if (!A) return;
  const t = A.t, x0 = play.camX, y0 = play.camY, W = Game.viewW, H = Game.viewH, k = clamp((t - 0.5) / 0.8, 0, 1);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  const gr = ctx.createLinearGradient(0, y0, 0, y0 + H); gr.addColorStop(0, '#2a1a30'); gr.addColorStop(0.6, '#7a2236'); gr.addColorStop(1, '#f2a65a');
  ctx.fillStyle = gr; ctx.fillRect(x0 - 4, y0 - 4, W + 8, H + 8);
  for (let q = 0; q < 5; q++) { const r = ((t * 90 + q * 60) % 300); FArt.ring(ctx, x0 + W / 2, y0 + H * 0.45, r, 0.6 * (1 - r / 300), IVORY, 3); }
  const s = clamp((t - 1.1) / 0.5, 0, 1);
  if (s > 0) {
    ctx.globalAlpha = k * s; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '32px ' + FONT_DISPLAY; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('FOLEY BEACH', x0 + W / 2, y0 + H * 0.42); ctx.fillStyle = APRI; ctx.fillText('FOLEY BEACH', x0 + W / 2, y0 + H * 0.42);
    ctx.font = '13px ' + FONT_DISPLAY; ctx.lineWidth = 4; ctx.strokeText('A HIDDEN LAND, BEHIND PIWI\'S SEASIDE SHOW', x0 + W / 2, y0 + H * 0.42 + 34); ctx.fillStyle = IVORY; ctx.fillText('A HIDDEN LAND, BEHIND PIWI\'S SEASIDE SHOW', x0 + W / 2, y0 + H * 0.42 + 34);
    FArt.shell(ctx, x0 + W / 2 - 150, y0 + H * 0.42 + 4, 12, APRI); FArt.propTin(ctx, x0 + W / 2 + 150, y0 + H * 0.42 + 12, 30, 20); void TIN;
  }
  ctx.restore();
});

/* the host level, amended after it is built: the riser (a solid plank row, drawn by the prop), the flat and the exit.
   Columns 0-4 at the far left of the avenue; nothing else in the level changes. */
{
  const gen0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (C0, spec, w, i, attempt) {
    const L = gen0.call(this, C0, spec, w, i, attempt);
    if (!C0 || C0.id !== 'br' || i !== 1 || !L.areas[0]) return L;
    const A = L.areas[0];
    let fy = -1; for (let y = 0; y < A.H; y++) if (SOLID[A.tiles[y * A.W + 2]]) { fy = y; break; }
    if (fy < 8) return L;
    // the riser: one row of planks over columns 0-4 (invisible tiles: the prop draws it)
    for (let x = 0; x <= 4; x++) { const k = (fy - 1) * A.W + x; if (A.tiles[k] === T.EMPTY) { A.tiles[k] = T.HARD; A.hide[k] = 1; } }
    // the surdo stack that stood at the far left now stands on the riser
    for (const d of A.decor || []) if (d.x < 5 * TS && Math.abs(d.y - fy * TS) < 2) d.y -= TS;
    A.spawns.push({ type: 'foleyRiser', x: 2.5 * TS, y: fy * TS - TS + TS });
    // (the exit's box, for the checker, is up at the foam: only a jump from the riser reaches it)
    A.spawns.push({ type: 'foleyFlap', exit: 'foley', x: TS, y: (fy - 1) * TS - 2.6 * TS, top: (fy - 1) * TS });
    return L;
  };
}
Tour.foleyKit.entrance = { HOST, FOAM_X, FOAM_DY, FOAM_R };
})();
