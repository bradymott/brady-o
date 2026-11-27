/* ============================================================
   TABLE FOR TWO: the secret rooms (B51-B55 of docs/design/CHATGPT_RELAY.md, one per stage, in order). Five kinds,
   all new to the game, each its own place in the restaurant, each a game that fits one landscape view with the
   game on a raised stage in the middle band (clear of the stick, the buttons and the top bar):
     tabSpoons 36-1 BAD REFLECTION     three spoons reflect Piwi Squirmin' (upside down, as spoons do). Stand at a
                                       spoon and it tilts up for a closer look. When Piwi shuts his mouth, one
                                       reflection keeps grinning: THROW at that spoon. Twice.
     tabTear   36-2 MATCH THE TEAR     a torn RESERVED card hangs on the coat rack; three scraps wait on their pegs.
                                       THROW at the scrap whose bite fits the card's edge. Twice (the menu next).
     tabStar   36-3 THE SPARE STAR     the skylight shows the night sky; the souvenir coaster on the wall prints it
                                       with one star too many. Stand on that star's number and THROW to cover it.
     tabScope  36-4 WRONG END          a giant prize fills the telescope's lens (touch it: it's only the lens). Climb
                                       round the tripod to the tiny real prize at the far end.
     tabPull   36-5 PULL TO ENTER      the door with two handprints never budges when pushed. Hold THROW on its pull
                                       ring and walk backwards: it swings open.
   A miss costs nothing (a raspberry, the turn starts again). The prize cage opens at the win (TourRooms.win and
   29_tour_zz_lamps.js). Three of the five let Brady out somewhere else (a hatch onto a ledge further along).
   Each kind scripts its own win for tools/sbw_rooms_test.js (testWin).
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.tableKit) return;
const TK = Tour.tableKit, INK = TK.INK, TabArt = TK.TabArt, RK = TourRoomKit;
const { RED, IVORY, IVORY2, NAVY, GOLD, OLIVE } = TK;
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
// the room's shape: 28 x 14, the way in at the bottom left, a raised stage (top row ST) for the game, the cage on
// the stage at the right wall, an optional hatch out beside it
// (the room is 28 wide for the room kit, but its last two columns are rock: 26 columns fit a landscape phone's view)
const ST = 8, W = 28, R1 = 24;
function stageRoom(keep, A, o, items) {
  const g = RK.room(W), Y = RK.Y;
  g.west(keep);
  g.fill(R1 + 1, 1, W - 2, 10, '#');
  // the stage and the step up to it
  g.fill(6, ST, R1, 10, '#'); g.fill(4, 9, 5, 10, '#');
  const cw = Math.max(3, items.length + 2), cx = R1 - cw;
  g.cage(A.id, cx, ST - 1, items, { w: cw, h: 4 });
  if (o.exit) { g.door(cx - 2, ST - 1, { to: o.exit, look: 'tabHatch' }); }
  return { g, Y, x0: 7, x1: cx - (o.exit ? 4 : 2), cx };
}
const prizeOf = (o, keep) => RK.prize(o, keep);
// the room's game state helpers
const on = (play, tx, row) => TK.onMark(play.player, tx, row + 1, 0.8);
const hud = (play, ctx, str, col) => TourRooms.hudText(play, ctx, str, col, 15, 34);
// a THROW mark on the stage: an entity whose tabInput calls the room's own handler
class TabRoomMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.tabProp = true; this.k = s.k; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.cue = s.cue || 'THROW'; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  tabTouch(p) { const r = this.room(); return !!r && !r.R.won && TK.onMark(p, this.tx, this.fy, 0.8); }
  tabInput(p, inp, dt) { if (!inp.actionPressed) return; const r = this.room(); if (r && r.K.mark) r.K.mark(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { const p = this.g.player; if (p && this.tabTouch(p)) TK.handCue(ctx, this.cx, this.y - TS - 4, this.t, this.cue); }
}
ENTITY_TYPES.tabRoomMark = TabRoomMark;
const marks = play => play.entities.filter(e => e instanceof TabRoomMark);

/* ================= tabSpoons: BAD REFLECTION ================= */
TourRooms.def('tabSpoons', {
  title: 'BAD REFLECTION', rule: 'WATCH PIWI SHUT HIS MOUTH: ONE SPOON KEEPS GRINNING. THROW AT THAT SPOON', need: 'FIND THE BAD REFLECTION FIRST!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(keep, A, o, prizeOf(o, keep)), g = S.g;
    const xs = [9, 12, 15];
    xs.forEach((x, k) => { g.spawn(x, ST - 1, 'tabRoomMark', { k }); g.need('spoon ' + k, x, ST - 1); });
    g.winSpot(A.id, 12, ST - 1);
    g.data.spoons = xs;
    g.coins(7, 8, ST - 2);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; R.odd = R.odd != null ? R.odd : 1; R.cyc = 0; } },
  phase(R) { const c = R.cyc % 3.4; return c < 1.6 ? 'talk' : 'shut'; },
  update(play, dt, A, R, kit) { R.cyc = (R.cyc || 0) + dt; },
  mark(play, A, R, kit, m) {
    if (R.won) return;
    if (m.k === R.odd) {
      R.round++; chime(R.round, true); play.parts.text(m.cx, m.y - 40, 'THAT ONE\'S STILL GRINNING!', '#ffd84a');
      if (R.round >= 2) TourRooms.win(play, A, R, { text: 'PIWI, REFLECTED!', coins: 4 });
      else { R.odd = (R.odd + 2) % 3; R.cyc = 0; }
    } else { RK.raspberry(play, 'A PERFECTLY NORMAL SPOON'); R.odd = (R.odd + 1 + (R.round % 2)) % 3; R.cyc = 0; }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, ph = this.phase(R), jawP = ph === 'talk' ? 2.5 + Math.sin(t * 14) * 2.5 : 0, p = play.player;
    // Piwi himself, up on the drawer's edge, talking: his jaw flaps, then he shuts it and grins at you
    // (his head on the drawer's back wall, left of the spoons, clear of the HUD)
    if (typeof Piwi !== 'undefined') Ink.around(ctx, 2 * TS, 2.6 * TS, 4 * TS, 3.4 * TS, c => Piwi.head(c, 4 * TS, 4.4 * TS, 2.4, t, { jaw: jawP, look: 1 }), { pad: 4 });
    if (!R.won && ph === 'shut') { ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('MMM-HMM.', 4 * TS, 2.9 * TS); ctx.restore(); }
    // the three spoons on stands; a spoon tilts up toward Brady when he stands at it (a closer look)
    kit.data.spoons.forEach((x, k) => {
      const near = p && Math.abs(p.cx - (x * TS + TS / 2)) < TS && p.groundTy === ST, sc = near ? 1.35 : 1, cx = x * TS + TS / 2, cy = (ST - 1) * TS - 34;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(near ? -0.12 : 0.06 * Math.sin(t + k));
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#c8ccd8'; rr(ctx, -3, 12, 6, 34, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 19, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 12, 16, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = '#b8c0d0'; ctx.fillRect(-14, -18, 28, 36);
      // the reflection: Piwi upside down; the odd spoon's reflection keeps its grin when he shuts his mouth
      const odd = k === R.odd && !R.won, jaw = ph === 'shut' ? (odd ? 3.5 : 0) : jawP;
      if (typeof Piwi !== 'undefined') { ctx.save(); ctx.scale(0.62, -0.62); Piwi.head(ctx, 0, 1, 1, t, { jaw, look: 0 }); ctx.restore(); }
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-6, -9, 3, 6, 0.3, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.restore();
    });
    if (!R.won && !(play.bannerT > 0)) { const n = R.round || 0; hud(play, ctx, 'SPOON ' + (n + 1) + ' OF 2'); }
  },
  testWin(g, A, R, kit, frame) { for (let k = 0; k < 2 && !R.won; k++) { const m = marks(g).find(e => e.k === R.odd); this.mark(g, A, R, kit, m); frame(g); } }
});

/* ================= tabTear: MATCH THE TEAR ================= */
// a torn edge: 5 bites (heights 0..2); the right scrap's edge is its exact complement
const tearOf = rng => { const e = []; for (let k = 0; k < 5; k++) e.push(Math.floor(rng() * 3)); if (e.every(v => v === e[0])) e[2] = (e[2] + 1) % 3; return e; };
const tornPath = (ctx, x, y, h, edge, dir) => { const seg = h / edge.length; ctx.lineTo(x, y); edge.forEach((v, k) => { ctx.lineTo(x + dir * (v * 5 + 3), y + seg * (k + 0.5)); ctx.lineTo(x, y + seg * (k + 1)); }); };
TourRooms.def('tabTear', {
  title: 'MATCH THE TEAR', rule: 'WHICH SCRAP WAS TORN OFF THIS CARD? STAND AT IT AND THROW TO SLIDE IT INTO THE EDGE', need: 'MEND THE CARD FIRST!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(keep, A, o, prizeOf(o, keep)), g = S.g;
    const xs = [10, 13, 16];
    xs.forEach((x, k) => { g.spawn(x, ST - 1, 'tabRoomMark', { k }); g.need('scrap ' + k, x, ST - 1); });
    g.winSpot(A.id, 13, ST - 1);
    // two cards, each a torn edge; the scraps: the match and two that are nearly right (one bite different)
    const rounds = [0, 1].map(() => { const e = tearOf(rng), wrong = [1, 2].map(j => { const w = e.slice(); const i = Math.floor(rng() * 5); w[i] = (w[i] + j) % 3; return w; }), at = Math.floor(rng() * 3), sc = []; let wi = 0; for (let k = 0; k < 3; k++) sc.push(k === at ? e : wrong[wi++]); return { edge: e, scraps: sc, at }; });
    g.data.rounds = rounds; g.data.xs = xs;
    g.coins(7, 8, ST - 2);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; R.slide = -1; R.slideT = 0; } },
  update(play, dt, A, R, kit) { if (R.slide >= 0) { R.slideT += dt; if (R.slideT > 0.9) { const ok = R.slideOk; R.slide = -1; if (ok) { R.round++; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'GOOD AS NEW!', coins: 4 }); } } } },
  mark(play, A, R, kit, m) {
    if (R.won || R.slide >= 0) return;
    const rd = kit.data.rounds[R.round]; R.slide = m.k; R.slideT = 0; R.slideOk = m.k === rd.at;
    if (R.slideOk) { chime(R.round + 1, true); play.parts.text(m.cx, m.y - 40, 'A PERFECT FIT!', '#ffd84a'); }
    else { RK.raspberry(play, 'NOT THAT BITE'); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, rd = kit.data.rounds[Math.min(1, R.round || 0)], cxL = 3.2 * TS, cy = 3 * TS, h = 2.6 * TS;
    // the coat rack's card, torn down its right edge
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cxL + 30, cy - 12, 4, 14);
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(cxL, cy); tornPath(ctx, cxL + 64, cy, h, rd.edge, 1); ctx.lineTo(cxL, cy + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(R.round ? 'MEN' : 'RESER', cxL + 34, cy + h / 2 + 4);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.strokeRect(cxL + 6, cy + 6, 52, h - 12);
    // the three scraps on their pegs (and the one sliding over to the card)
    kit.data.xs.forEach((x, k) => {
      let sx = x * TS + 2, sy = (ST - 1) * TS - 6 - h * 0.62;
      if (R.slide === k) { const q = Math.min(1, R.slideT / 0.5); sx = sx + (cxL + 64 - sx) * q; sy = sy + (cy - sy) * q; if (!R.slideOk && R.slideT > 0.5) sy += (R.slideT - 0.5) * 300; }
      const e = rd.scraps[k], sh = h * (R.slide === k && R.slideT > 0.4 ? 1 : 0.62), sc = sh / h;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc);
      ctx.strokeStyle = INK; ctx.lineWidth = 2 / sc; ctx.fillStyle = IVORY;
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(0, 0); edgeIn(ctx, 0, 0, h, e); ctx.lineTo(40, h); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = RED; ctx.font = (11 / sc | 0) + 'px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(R.round ? 'U' : 'VED', 22, h / 2 + 4);
      ctx.restore();
      if (R.slide !== k) { ctx.fillStyle = '#5e341c'; ctx.fillRect(x * TS + 10, (ST - 1) * TS - 6, 12, 6); }
    });
    ctx.restore();
    if (!R.won && !(play.bannerT > 0)) hud(play, ctx, (R.round ? 'THE MENU' : 'THE CARD') + '  ' + ((R.round || 0) + 1) + ' / 2');
    function edgeIn(c, x, y, hh, edge) { const seg = hh / edge.length; edge.forEach((v, k) => { c.lineTo(x + v * 5 + 3, y + seg * (k + 0.5)); c.lineTo(x, y + seg * (k + 1)); }); }
  },
  testWin(g, A, R, kit, frame) { for (let k = 0; k < 2 && !R.won; k++) { const m = marks(g).find(e => e.k === kit.data.rounds[R.round].at); this.mark(g, A, R, kit, m); for (let q = 0; q < 140; q++) frame(g); } }
});

/* ================= tabStar: THE SPARE STAR ================= */
TourRooms.def('tabStar', {
  title: 'THE SPARE STAR', rule: 'THE COASTER HAS ONE STAR THE SKY HASN\'T. STAND ON ITS NUMBER AND THROW TO COVER IT', need: 'COVER THE SPARE STAR FIRST!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(keep, A, o, prizeOf(o, keep)), g = S.g;
    const xs = [9, 11, 13, 15, 17];
    xs.forEach((x, k) => { g.spawn(x, ST - 1, 'tabRoomMark', { k, cue: 'COVER' }); g.need('star pad ' + k, x, ST - 1); });
    g.winSpot(A.id, 13, ST - 1);
    // two skies: 4 stars each (positions in a unit box); the coaster prints 5, the extra one at a random number
    g.data.rounds = [0, 1].map(() => { const pts = []; for (let k = 0, n = 0; k < 5 && n < 400; n++) { const q = [0.18 + rng() * 0.64, 0.2 + rng() * 0.6]; if (pts.every(o => Math.hypot(o[0] - q[0], o[1] - q[1]) > 0.3)) { pts.push(q); k++; } } return { pts, spare: Math.floor(rng() * 5) }; });
    g.data.xs = xs;
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; R.cover = -1; } },
  mark(play, A, R, kit, m) {
    if (R.won) return;
    const rd = kit.data.rounds[R.round];
    if (m.k === rd.spare) { chime(R.round + 1, true); R.round++; play.parts.text(m.cx, m.y - 40, 'COVERED! THE SKY AGREES', '#ffd84a'); if (R.round >= 2) TourRooms.win(play, A, R, { text: 'STAR-SPOTTER!', coins: 4 }); }
    else RK.raspberry(play, 'THAT ONE IS IN THE SKY');
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, rd = kit.data.rounds[Math.min(1, R.round || 0)];
    const box = (x, y, w, h, sky) => {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3;
      if (sky) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#0a0a2a'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#f2e2c0'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e2a5a'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, TAU); ctx.fill(); }
      rd.pts.forEach(([px, py], k) => {
        if (sky && k === rd.spare) return;
        const sx = x + px * w, sy = y + py * h, tw = sky ? 0.6 + 0.4 * Math.sin(t * 3 + k * 2) : 1;
        ctx.fillStyle = sky ? `rgba(255,248,200,${tw})` : '#ffe28a'; ctx.beginPath(); TourKit.star(ctx, sx, sy, 7, 3, 5); ctx.fill();
        if (!sky) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), sx, sy + 17); }
      });
      ctx.restore();
    };
    box(4.4 * TS, 3.5 * TS, 3.1 * TS, 3.1 * TS, true);
    box(12.4 * TS, 3.5 * TS, 3.1 * TS, 3.1 * TS, false);
    ctx.save(); ctx.fillStyle = '#ffe8c8'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('THE SKY', 5.95 * TS, 3.2 * TS); ctx.fillText('THE COASTER', 13.95 * TS, 3.2 * TS); ctx.restore();
    // the numbered star pads on the stage
    kit.data.xs.forEach((x, k) => { const cx = x * TS + TS / 2, cy = ST * TS - 3; ctx.save(); ctx.fillStyle = '#1e2a5a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 14, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe28a'; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), cx, cy - 6); ctx.restore(); });
    if (!R.won && !(play.bannerT > 0)) hud(play, ctx, 'SKY ' + ((R.round || 0) + 1) + ' / 2');
  },
  testWin(g, A, R, kit, frame) { for (let k = 0; k < 2 && !R.won; k++) { const m = marks(g).find(e => e.k === kit.data.rounds[R.round].spare); this.mark(g, A, R, kit, m); frame(g); } }
});

/* ================= tabScope: WRONG END OF THE TELESCOPE ================= */
TourRooms.def('tabScope', {
  title: 'WRONG END', rule: 'A GIANT PRIZE IN THE LENS! ...OR IS IT? THE REAL PRIZE IS AT THE OTHER END', need: 'FIND THE REAL PRIZE FIRST!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(keep, A, o, prizeOf(o, keep)), g = S.g;
    // the tripod: a tall stack (books under its feet) to climb over, the lens end facing the way in, the eyepiece
    // end (and the tiny prize) on the far side
    g.fill(14, 4, 15, ST - 1, '#'); g.hline(11, 13, 5, '-'); g.hline(16, 18, 5, '-');
    g.fill(11, ST - 1, 11, ST - 1, '#');
    g.winSpot(A.id, 18, ST - 1);
    g.need('the lens', 9, ST - 1); g.coins(14, 15, 3);
    g.data.lens = [9, ST - 1]; g.data.prize = [18, ST - 1];
    return g;
  },
  enter(play, A, R, kit) { R.poke = 0; },
  update(play, dt, A, R, kit) {
    const p = play.player; if (R.poke > 0) R.poke -= dt;
    if (R.won || !p) return;
    if (Math.abs(p.cx - (kit.data.lens[0] + 0.5) * TS) < 0.8 * TS && p.groundTy === ST && R.poke <= 0) { R.poke = 2; RK.raspberry(play, 'IT\'S ONLY THE LENS'); }
    if (Math.abs(p.cx - (kit.data.prize[0] + 0.5) * TS) < 0.7 * TS && p.groundTy === ST) TourRooms.win(play, A, R, { text: 'THE REAL PRIZE! (TINY)', coins: 4 });
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, lx = 8.2 * TS, ly = 4.6 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    // the tube from the lens (left, big) to the eyepiece (right, small), over the tripod
    ctx.fillStyle = '#c89a4a'; ctx.beginPath(); ctx.moveTo(lx, ly - 40); ctx.lineTo(17.6 * TS, 3.1 * TS - 10); ctx.lineTo(17.6 * TS, 3.1 * TS + 10); ctx.lineTo(lx, ly + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a87a2a'; for (const fx of [0.3, 0.6]) { const x = lx + (17.6 * TS - lx) * fx; ctx.fillRect(x - 5, ly - 40 + fx * 26 - 4, 10, 88 - fx * 56); }
    // the lens: a huge magnified prize box filling it
    const wob = R.poke > 0 ? Math.sin(t * 30) * 4 : 0;
    ctx.fillStyle = '#c8e8ff'; ctx.beginPath(); ctx.ellipse(lx, ly, 26, 46, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(lx, ly, 24, 44, 0, 0, TAU); ctx.clip();
    if (!R.won) { ctx.fillStyle = '#ff6a5a'; rr(ctx, lx - 30 + wob, ly - 30, 60, 60, 10); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = '22px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('1UP', lx + wob, ly + 8); }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(lx - 8, ly - 20, 6, 14, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
    // the eyepiece and the tiny real prize under it
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(17.6 * TS, 3.1 * TS - 6, 10, 12);
    if (!R.won) { const px = 18.5 * TS, py = (ST - 1) * TS + 18 + Math.sin(t * 4) * 2; ctx.fillStyle = '#ff6a5a'; rr(ctx, px - 6, py - 12, 12, 10, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = '5px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('1UP', px, py - 5); }
    ctx.restore();
  },
  testWin(g, A, R, kit, frame) { const p = g.player; p.x = (kit.data.prize[0] + 0.5) * TS - p.w / 2; p.y = ST * TS - p.h; p.vy = 0; for (let q = 0; q < 30 && !R.won; q++) frame(g); }
});

/* ================= tabPull: PULL TO ENTER ================= */
TourRooms.def('tabPull', {
  title: 'PULL TO ENTER', rule: 'IT SAYS PUSH. IT NEVER BUDGES. HOLD THROW ON THE PULL RING AND WALK BACKWARDS', need: 'PULL!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(keep, A, o, prizeOf(o, keep)), g = S.g;
    // the door is the cage's own bars, dressed as a grand door; its pull ring mark just in front of it
    const rx = S.cx - 1;
    g.spawn(rx, ST - 1, 'tabRoomMark', { k: 0, cue: 'HOLD THROW' }); g.need('the pull ring', rx, ST - 1);
    g.winSpot(A.id, rx - 4, ST - 1);
    g.data.ring = [rx, ST - 1]; g.data.door = S.cx;
    g.coins(9, 12, ST - 3);
    return g;
  },
  enter(play, A, R, kit) { R.held = false; R.d = 0; R.push = 0; },
  mark(play, A, R, kit, m, p, inp) {
    if (R.won) return;
    if (!R.held && inp.actionPressed) { R.held = true; R.x0 = p.cx; TourKit.sfx('grab', 'select', { vol: 0.5, pitch: 0.7 }); }
  },
  update(play, dt, A, R, kit) {
    const p = play.player, In = typeof Input !== 'undefined' ? Input : null; if (R.push > 0) R.push -= dt;
    if (R.won || !p) return;
    // pushing on the door (walking into it): it never budges
    const dx = kit.data.door * TS;
    if (p.x + p.w > dx - 2 && p.vx >= 0 && (!R.held) && p.groundTy === ST && R.push <= 0 && Math.abs(p.cx - dx) < TS) { R.push = 2; RK.raspberry(play, 'PUSH... IT WON\'T BUDGE'); }
    if (R.held) {
      R.d = Math.max(0, (R.x0 - p.cx) / TS);
      const holding = p.tabHeld != null ? p.tabHeld : (In ? In.action : false);
      if (R.d >= 3) { R.held = false; TourRooms.win(play, A, R, { text: 'IT SAID PULL ALL ALONG', coins: 4 }); }
      else if (!holding) { R.held = false; if (R.d > 0.3) play.parts.text(p.cx, p.y - 14, 'KEEP HOLDING AND WALK BACK', '#ffd8a0'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const x = kit.data.door * TS, y = (ST - 4) * TS, t = play.t, k = R.held ? Math.min(1, R.d / 3) : R.won ? 1 : 0;
    if (R.won) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    // the grand door over the cage: a heavy panelled door, two brass handprints, PUSH, a pull ring
    ctx.fillStyle = '#5e1a26'; ctx.save(); ctx.translate(x, y); ctx.transform(1 - k * 0.5, -k * 0.15, 0, 1, 0, 0); rr(ctx, 0, 0, 3.4 * TS, 4 * TS, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7e2430'; rr(ctx, 8, 8, 3.4 * TS - 16, 4 * TS - 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GOLD; for (const hx of [0.32, 0.68]) { const cx = 3.4 * TS * hx, cy = 1.4 * TS; ctx.beginPath(); ctx.ellipse(cx, cy, 8, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(cx - 6 + f * 4, cy - 13, 1.8, 4, 0, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = '#ffe8c8'; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('PUSH', 1.7 * TS, 2.6 * TS);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(8, 2.6 * TS, 9, 0, TAU); ctx.stroke();
    ctx.restore();
    if (R.held && play.player) { const p = play.player; ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 8, y + 2.6 * TS); ctx.lineTo(p.cx, p.y + 22); ctx.stroke(); }
    ctx.restore();
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player, [rx, ry] = kit.data.ring; p.x = (rx + 0.5) * TS - p.w / 2; p.y = (ry + 1) * TS - p.h; p.vy = 0;
    for (let q = 0; q < 20; q++) frame(g, {});
    frame(g, { action: true, actionPressed: true });
    for (let q = 0; q < 160 && !R.won; q++) frame(g, { action: true, left: true });
  }
});

// the camera in a table room: the whole room's width in view (when the screen is wide enough), the stage band in the
// middle
TourHooks.on('camera', (play, dt) => {
  const A = play.area; if (!(A && A.roomKit && /^tab/.test(A.roomKit.kind))) return;
  if (Game.viewW >= (R1 + 1) * TS - 8) play.camX = clamp(((R1 + 1) * TS - Game.viewW) / 2, 0, Math.max(0, A.W * TS - Game.viewW));
});
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.roomKit && /^tab/.test(A.roomKit.kind)) return clamp(TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
})();
