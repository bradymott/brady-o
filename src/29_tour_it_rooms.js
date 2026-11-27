/* ============================================================
   ITALY: the secret rooms on a phone, and each room's own place.
   1. The frame. An Italy room area with `frame` (set by the level spec's `it: { frame: ... }`) is shown in one view
      on a landscape phone: as many tile rows as it takes for the room's width to fit (12 to the room's 14), the
      camera fixed on the whole room. A room too wide for that (the scooter time trial; the shared kinds' rooms on a
      narrower screen) keeps all 14 rows in view and the camera follows Brady, held on the room's game (frame.focus)
      while he is near it.
   2. The room's words in turn: the title (the banner) first, then the rule (the toast) once the title has gone; the
      clock and the counters in one fixed spot, top-left under the HUD pills, clear of the toast and the title.
   3. Each room its own place: six backdrops (the scooter garage, the pizza pass, the bell loft, the royal box, the
      tenor's dressing room, the bean store) and their floor props (frame.props: [[decor kind, tile x], ...]).
   ============================================================ */
(function () {
const C = Tour.countries.it;
if (!C) return;
const IK = Tour.itKit, INK = IK.INK;

/* ---------------- 1. the frame ---------------- */
const landscape = () => { const gr = Game.gameRect; return !!gr && gr.w > gr.h * 1.3; };
// tile rows that show the whole room's width (null: it does not fit, keep the room's height)
const fitRows = A => { const gr = Game.gameRect; if (!gr || !landscape()) return null; const need = A.W / (gr.w / gr.h); return need <= A.H + 1e-6 ? Math.max(12, need) : null; };
{
  const vr0 = Play.prototype.viewRows;
  Play.prototype.viewRows = function () {
    const A = this.area;
    if (A && A.frame && !(this.boss && !this.boss.remove)) return fitRows(A) || A.H;
    return vr0.call(this);
  };
}
TourHooks.on('camera', (play, dt) => {
  const A = play.area, F = A && A.frame;
  if (!F) return;
  const VW = Game.viewW, VH = Game.viewH, p = play.player;
  play.camY = Math.max(0, A.H * TS - VH);
  const maxX = Math.max(0, A.W * TS - VW);
  if (maxX <= 2) { play.camX = 0; return; }
  const R = A.roomKit && A.roomState;
  if (R && R.camX != null) { play.camX = clamp(R.camX, 0, maxX); return; }   // a room's own camera move (the time trial's route)
  if (!F.focus || !p) return;   // the game's own camera, following Brady
  // held on the game, unless Brady walks off toward a door or the cage
  const fx = (F.focus[0] + F.focus[1] + 1) / 2 * TS, m = 3 * TS;
  let tx = fx - VW / 2;
  if (p.cx < tx + m) tx = p.cx - m; else if (p.cx > tx + VW - m) tx = p.cx - VW + m;
  tx = clamp(tx, 0, maxX);
  play.itCamX = play.itCamX == null || Math.abs(play.itCamX - tx) > VW ? tx : play.itCamX + (tx - play.itCamX) * (1 - Math.exp(-dt * 6));
  play.camX = play.itCamX;
});
TourHooks.on('areaLoaded', (play, A) => { play.itCamX = null; });

/* ---------------- 2. the room's words in turn; the counters in one spot ---------------- */
// world units per CSS pixel of the game view
const perCss = () => Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
// the fixed spot for the room's clock (i = 0) and counters (i = 1, 2): top-left, under the HUD pills
const spot = (play, i) => { const k = perCss(); return { x: play.camX + 16 * k, cx: play.camX + 62 * k, y: play.camY + (96 + (i || 0) * 38) * k, k }; };
Tour.itRoomHud = { spot, perCss };
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    if (!A.frame) return;
    // the rule waits for the title to go (TourRooms.update below shows it)
    const R = this.state(play, A), rule = A.roomKit && A.roomKit.rule;
    if (rule && play.toastT > 0 && play.toastText === rule) { R.ruleQ = rule; play.toastT = 0; }
  };
  // the room's game waits for its title too (a shell game's first show, a clock): only the room's time runs
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area;
    if (A && A.frame && A.roomKit) {
      const R = this.state(play, A);
      if (R.ruleQ) { if (play.bannerT > 0.1) { R.t += dt; const K = this.kinds[A.roomKit.kind]; if (K.waiting && !R.won) K.waiting(play, dt, A, R, A.roomKit); return; } play.toast(R.ruleQ); R.ruleQ = null; }
    }
    return up0.apply(this, arguments);
  };
  // the shared kinds' rooms (the opera hats, the dressing room, the bean store) built to the frame's width (frame.w):
  // their games lay out between the room's two ends, so a narrower room is the same game, closer together
  for (const name of ['shell', 'prank', 'rush']) {
    const K = TourRooms.kinds[name]; if (!K) continue;
    const mk0 = K.make;
    K.make = function (o, keep, ctx, A) {
      const w = A && A.it && A.it.frame && A.it.frame.w;
      if (!w) return mk0.apply(this, arguments);
      const room0 = TourRoomKit.room;
      TourRoomKit.room = function (W, H, F) { return room0.call(this, Math.min(W, w), H, F); };
      try { return mk0.apply(this, arguments); } finally { TourRoomKit.room = room0; }
    };
  }
  // the shared clock and counter (the bean store's): moved to the fixed spot in an Italy room
  const moved = (fn, i, dy) => function (play, ctx) {
    if (!(play.area && play.area.frame)) return fn.apply(this, arguments);
    const s = spot(play, i), x0 = play.camX + Game.viewW / 2, y0 = TourRooms.hudY(play, 0) + dy;
    ctx.save(); ctx.translate(s.cx - x0, s.y - y0);
    try { return fn.apply(this, arguments); } finally { ctx.restore(); }
  };
  TourRooms.clock = moved(TourRooms.clock, 0, 36);
  TourRooms.counter = moved(TourRooms.counter, 1, 72);
}

/* ---------------- 3. each room its own place ---------------- */
const FL = 354;   // the room's floor line in a backdrop (a 14-row room at the standard framing)
const T0 = THEMES;
// a stack of things along the strip, wrapped at the seam
const every = (step, x0, fn) => { for (let x = x0; x < BG_W; x += step) fn(x); };
const tyre = (ctx, x, y, r) => { ctx.fillStyle = '#26232a'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4650'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 1, r * 0.55, r * 0.2, 0, 0, TAU); ctx.stroke(); };
const sack = (ctx, x, y, w, h, col, mark) => {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w / 2 - 4, y - h * 0.6, x - w / 2 + 6, y - h); ctx.lineTo(x + w / 2 - 6, y - h); ctx.quadraticCurveTo(x + w / 2 + 4, y - h * 0.6, x + w / 2, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,10,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, y - h + 5); ctx.lineTo(x + w / 2 - 6, y - h + 5); ctx.stroke();
  if (mark) { ctx.fillStyle = 'rgba(60,30,16,0.55)'; ctx.font = `bold ${Math.round(h * 0.26)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(mark, x, y - h * 0.4); }
};
const painters = {
  // the scooter garage: brick, two roller doors, a pegboard of tools, tyre stacks, a shelf of oil cans, a work lamp
  itGarageBack(ctx, L, rng, H) {
    ctx.fillStyle = '#4a3a34'; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < FL; y += 14) for (let x = (y / 14) % 2 ? -14 : 0; x < BG_W; x += 28) { ctx.fillStyle = (x * 7 + y * 3) % 5 ? '#5a463e' : '#634c42'; ctx.fillRect(x + 1, y + 1, 26, 12); }
    every(512, 40, X => {
      // a roller door, half up
      ctx.fillStyle = '#2a2428'; ctx.fillRect(X, 150, 210, FL - 150);
      ctx.fillStyle = '#8a9098'; ctx.fillRect(X, 150, 210, 120);
      ctx.fillStyle = '#6a7078'; for (let y = 156; y < 270; y += 10) ctx.fillRect(X, y, 210, 3);
      ctx.fillStyle = '#b8bcc4'; ctx.fillRect(X - 8, 140, 226, 12); ctx.fillStyle = '#ffd24a'; for (let x = 0; x < 210; x += 24) ctx.fillRect(X + x, 262, 12, 8);
      ctx.fillStyle = '#3a3438'; ctx.fillRect(X + 92, 270, 26, 6);
      // a pegboard of tools
      const P = X + 250; ctx.fillStyle = '#c8a070'; ctx.fillRect(P, 120, 150, 110); ctx.fillStyle = 'rgba(80,50,20,0.35)'; for (let y = 128; y < 226; y += 12) for (let x = P + 8; x < P + 146; x += 12) ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(P + 14, 134, 8, 60); ctx.fillRect(P + 6, 134, 24, 10);            // a wrench
      ctx.fillRect(P + 46, 140, 6, 56); ctx.fillStyle = '#c84a3a'; ctx.fillRect(P + 38, 134, 22, 14);           // a hammer
      ctx.fillStyle = '#5a5e66'; ctx.beginPath(); ctx.arc(P + 92, 168, 22, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = '#5a5e66'; ctx.stroke();   // a coil of hose
      ctx.fillStyle = '#e8b04a'; ctx.fillRect(P + 124, 140, 10, 50); ctx.fillStyle = '#3a3438'; ctx.fillRect(P + 122, 186, 14, 20);   // a screwdriver
      // a shelf of oil cans
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(P + 170, 200, 120, 6);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#c83a2a', '#2a6ac8', '#3a9a4a', '#c83a2a'][k]; ctx.fillRect(P + 176 + k * 28, 172, 20, 28); ctx.fillStyle = '#d8dce4'; ctx.fillRect(P + 182 + k * 28, 166, 8, 6); }
      // tyre stacks
      for (let k = 0; k < 4; k++) tyre(ctx, P + 200, FL - 8 - k * 15, 26);
      for (let k = 0; k < 3; k++) tyre(ctx, P + 240, FL - 8 - k * 15, 24);
      // the work lamp
      ctx.strokeStyle = '#2a2428'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 105, 0); ctx.lineTo(X + 105, 96); ctx.stroke();
      ctx.fillStyle = '#3a3438'; ctx.beginPath(); ctx.moveTo(X + 90, 110); ctx.lineTo(X + 120, 110); ctx.lineTo(X + 112, 96); ctx.lineTo(X + 98, 96); ctx.fill();
      const g = ctx.createRadialGradient(X + 105, 114, 2, X + 105, 114, 90); g.addColorStop(0, 'rgba(255,230,160,0.55)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.fillRect(X + 15, 110, 180, 120);
    });
    ctx.fillStyle = '#2e2a2c'; ctx.fillRect(0, FL, BG_W, H - FL);
  },
  // the pizza pass: dark green tiles, the steel pass with its heat lamps and ticket rail, tins and flour sacks
  itPassBack(ctx, L, rng, H) {
    ctx.fillStyle = '#2a5a4a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = 'rgba(10,40,30,0.5)'; ctx.lineWidth = 1;
    for (let y = 0; y < FL; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let y = 0; y < FL; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < BG_W; x += 20) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke(); }
    // the steel pass: a long shelf with heat lamps over it and the ticket rail along its front
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(0, 252, BG_W, 16); ctx.fillStyle = '#8a909c'; ctx.fillRect(0, 268, BG_W, 6);
    ctx.fillStyle = '#9aa0aa'; ctx.fillRect(0, 238, BG_W, 4);
    every(128, 30, X => {
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 30, 0); ctx.lineTo(X + 30, 170); ctx.stroke();
      ctx.fillStyle = '#5a5e66'; ctx.beginPath(); ctx.moveTo(X + 12, 196); ctx.lineTo(X + 48, 196); ctx.lineTo(X + 38, 170); ctx.lineTo(X + 22, 170); ctx.fill();
      const g = ctx.createLinearGradient(0, 196, 0, 252); g.addColorStop(0, 'rgba(255,120,60,0.45)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X + 12, 196); ctx.lineTo(X + 48, 196); ctx.lineTo(X + 62, 252); ctx.lineTo(X - 2, 252); ctx.fill();
      ctx.fillStyle = '#e8a050'; ctx.beginPath(); ctx.ellipse(X + 30, 248, 22, 4, 0, 0, TAU); ctx.fill();   // a pizza under the lamp
      // little tickets on the rail
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(X + 70, 238, 16, 22); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(X + 70, 238, 16, 3);
      ctx.fillStyle = 'rgba(40,40,40,0.4)'; for (let k = 0; k < 3; k++) ctx.fillRect(X + 73, 245 + k * 4, 10, 1.5);
    });
    // tins on high shelves, flour sacks on the floor
    every(256, 150, X => {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(X, 120, 96, 5);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = '#c8ccd4'; ctx.fillRect(X + 4 + k * 18, 98, 14, 22); ctx.fillStyle = '#d83a2a'; ctx.fillRect(X + 4 + k * 18, 104, 14, 9); }
      sack(ctx, X + 20, FL - 2, 44, 50, '#efe8d8', '00'); sack(ctx, X + 62, FL - 2, 44, 46, '#e8e0cc', '00'); sack(ctx, X + 40, FL - 42, 40, 38, '#f2ece0', '00');
    });
    ctx.fillStyle = '#1e2e28'; ctx.fillRect(0, FL, BG_W, H - FL);
  },
  // the bell loft: pale stone, a heavy timber frame, louvred arches onto the sky, bell ropes with striped grips
  itBelfryBack(ctx, L, rng, H) {
    ctx.fillStyle = '#d8ccb4'; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < FL; y += 24) for (let x = (y / 24) % 2 ? -30 : 0; x < BG_W; x += 60) { ctx.strokeStyle = 'rgba(120,100,70,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 60, 24); }
    every(256, 60, X => {
      // a louvred arch
      ctx.fillStyle = '#8ac8f0'; ctx.beginPath(); ctx.moveTo(X, 300); ctx.lineTo(X, 170); ctx.arc(X + 50, 170, 50, Math.PI, 0); ctx.lineTo(X + 100, 300); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a5430'; for (let y = 150; y < 300; y += 18) ctx.fillRect(X, y, 100, 6);
      ctx.strokeStyle = '#a8987a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X, 300); ctx.lineTo(X, 170); ctx.arc(X + 50, 170, 50, Math.PI, 0); ctx.lineTo(X + 100, 300); ctx.stroke();
      // a rope with a red-and-white grip
      const rx = X + 160; ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, 250); ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#fffaf0' : '#c8283a'; ctx.fillRect(rx - 5, 230 + k * 9, 10, 9); }
    });
    // the timber frame: posts, a beam, braces; pigeons on the beam
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(0, 88, BG_W, 18);
    every(256, 0, X => {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(X + 4, 88, 18, FL - 88);
      ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(X + 22, 200); ctx.lineTo(X + 90, 106); ctx.moveTo(X + 4, 200); ctx.lineTo(X - 64, 106); ctx.stroke();
      ctx.fillStyle = '#7a7a86'; for (const px of [X + 120, X + 140]) { ctx.beginPath(); ctx.ellipse(px, 80, 9, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(px + 7, 74, 4, 0, TAU); ctx.fill(); }
    });
    // the bell wheel high on the frame
    every(512, 330, X => { ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(X, 60, 40, 0, TAU); ctx.stroke(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(X, 60); ctx.lineTo(X + Math.cos(a) * 40, 60 + Math.sin(a) * 40); ctx.stroke(); } });
    ctx.fillStyle = '#8a7a5a'; ctx.fillRect(0, FL, BG_W, H - FL);
  },
  // the royal box: red damask, gilded panels, a chandelier, velvet swags and the lit stage far below the rail
  itBoxBack(ctx, L, rng, H) {
    ctx.fillStyle = '#7a1424'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = 'rgba(255,200,90,0.18)'; for (let y = 10; y < FL; y += 26) for (let x = (y / 26) % 2 ? 13 : 0; x < BG_W; x += 26) { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.fill(); }
    every(256, 20, X => {
      // a gilded panel with a view of the stage through it
      ctx.fillStyle = '#1a0a10'; ctx.fillRect(X, 140, 150, 130);
      const g = ctx.createRadialGradient(X + 75, 250, 4, X + 75, 250, 90); g.addColorStop(0, 'rgba(255,220,140,0.85)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g; ctx.fillRect(X, 140, 150, 130);
      ctx.fillStyle = '#a8182a'; ctx.fillRect(X, 140, 26, 130); ctx.fillRect(X + 124, 140, 26, 130);
      ctx.fillStyle = '#3a1a10'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(X + 40 + k * 18, 262, 6, Math.PI, 0); ctx.fill(); }   // heads in the stalls
      ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 7; ctx.strokeRect(X - 3, 137, 156, 136);
      // the velvet swags
      ctx.fillStyle = '#c8283a'; ctx.beginPath(); ctx.moveTo(X - 10, 120); ctx.quadraticCurveTo(X + 75, 175, X + 160, 120); ctx.lineTo(X + 160, 108); ctx.lineTo(X - 10, 108); ctx.fill();
      ctx.fillStyle = '#e8b84a'; for (const tx of [X - 6, X + 156]) { ctx.fillRect(tx - 3, 120, 6, 26); ctx.beginPath(); ctx.arc(tx, 150, 6, 0, TAU); ctx.fill(); }
    });
    // the chandelier
    every(512, 340, X => {
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, 40); ctx.stroke();
      ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.ellipse(X, 52, 46, 10, 0, 0, TAU); ctx.fill();
      for (let k = -3; k <= 3; k++) { ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(X + k * 13, 66 + Math.abs(k) * -2, 3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,0.35)'; ctx.beginPath(); ctx.arc(X + k * 13, 40, 7, 0, TAU); ctx.fill(); }
    });
    // the gilded rail of the box along the floor
    ctx.fillStyle = '#e8b84a'; ctx.fillRect(0, FL - 54, BG_W, 6); for (let x = 6; x < BG_W; x += 22) ctx.fillRect(x, FL - 50, 5, 50);
    ctx.fillStyle = '#3a0a14'; ctx.fillRect(0, FL, BG_W, H - FL);
  },
  // the tenor's dressing room: striped paper, a lit mirror over the dressing table, a costume rack, a poster of him
  itDressingBack(ctx, L, rng, H) {
    ctx.fillStyle = '#e8d8c0'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 32) { ctx.fillStyle = '#d8b8a8'; ctx.fillRect(x, 0, 12, FL); }
    every(512, 40, X => {
      // the lit mirror over the dressing table
      ctx.fillStyle = '#f2ece0'; rr(ctx, X, 120, 180, 120, 8); ctx.fill();
      ctx.fillStyle = '#a8c8d8'; ctx.fillRect(X + 16, 134, 148, 92); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(X + 30, 134); ctx.lineTo(X + 60, 134); ctx.lineTo(X + 30, 190); ctx.fill();
      for (let k = 0; k < 8; k++) for (const [bx, by] of [[X + 8 + k * 23, 126], [X + 8 + k * 23, 234]]) { ctx.fillStyle = 'rgba(255,236,160,0.4)'; ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(X - 10, 262, 200, 12); ctx.fillRect(X, 274, 10, FL - 274); ctx.fillRect(X + 170, 274, 10, FL - 274);
      ctx.fillStyle = '#e8424a'; ctx.fillRect(X + 30, 250, 12, 12); ctx.fillStyle = '#ffd24a'; ctx.fillRect(X + 60, 252, 18, 10); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(X + 130, 254, 10, Math.PI, 0); ctx.fill();   // pots and a powder puff
      // the poster: THE TENOR (a meatball in a bow tie)
      const P = X + 250; ctx.fillStyle = '#fff2c8'; ctx.fillRect(P, 110, 96, 130); ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 4; ctx.strokeRect(P, 110, 96, 130);
      ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.arc(P + 48, 170, 30, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1410'; ctx.fillRect(P + 34, 162, 8, 4); ctx.fillRect(P + 54, 162, 8, 4); ctx.beginPath(); ctx.ellipse(P + 48, 184, 12, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c8283a'; ctx.beginPath(); ctx.moveTo(P + 36, 204); ctx.lineTo(P + 48, 210); ctx.lineTo(P + 60, 204); ctx.lineTo(P + 60, 216); ctx.lineTo(P + 48, 210); ctx.lineTo(P + 36, 216); ctx.fill();
      ctx.fillStyle = '#8a1a20'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('IL TENORE', P + 48, 132);
      // the costume rack
      const Q = X + 380; ctx.strokeStyle = '#5a5e66'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Q, FL); ctx.lineTo(Q, 150); ctx.lineTo(Q + 110, 150); ctx.lineTo(Q + 110, FL); ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#c8283a', '#2a4a9a', '#e8b84a', '#4a2a6a'][k]; const cx = Q + 18 + k * 25; ctx.beginPath(); ctx.moveTo(cx - 12, 160); ctx.lineTo(cx + 12, 160); ctx.lineTo(cx + 16, 260); ctx.lineTo(cx - 16, 260); ctx.closePath(); ctx.fill(); }
    });
    ctx.fillStyle = '#6a3a2a'; ctx.fillRect(0, FL, BG_W, H - FL);
  },
  // the bean store: plank walls, sacks of beans stacked high, the roaster drum and a chalkboard
  itBeanBack(ctx, L, rng, H) {
    ctx.fillStyle = '#7a5434'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 36) { ctx.fillStyle = (x / 36) % 2 ? '#84603e' : '#6e4c2e'; ctx.fillRect(x, 0, 34, FL); }
    every(512, 20, X => {
      // sacks stacked in a pyramid
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) sack(ctx, X + 30 + k * 50 + r * 25, FL - r * 44, 50, 46, k % 2 ? '#c8a06a' : '#b8905a', 'CAFFÈ');
      // the roaster drum
      const R = X + 270; ctx.fillStyle = '#b87a3a'; rr(ctx, R, 200, 120, 80, 36); ctx.fill(); ctx.fillStyle = '#d8964a'; ctx.fillRect(R + 10, 214, 100, 8);
      ctx.fillStyle = '#3a3438'; ctx.fillRect(R + 10, 280, 10, FL - 280); ctx.fillRect(R + 100, 280, 10, FL - 280); ctx.fillRect(R + 50, 160, 20, 40);
      ctx.fillStyle = '#6a3a1e'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(R + 20 + k * 16, 300 + (k % 2) * 4, 5, 7, 0.4, 0, TAU); ctx.fill(); }
      // the chalkboard
      const B = X + 420; ctx.fillStyle = '#2a2e2a'; ctx.fillRect(B, 120, 80, 100); ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 5; ctx.strokeRect(B, 120, 80, 100);
      ctx.fillStyle = '#f2ece0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BEANS', B + 40, 142); ctx.font = '10px sans-serif'; ctx.fillText('DARK ***', B + 40, 166); ctx.fillText('MEDIUM **', B + 40, 184); ctx.fillText('DOPPIO!', B + 40, 204);
    });
    ctx.fillStyle = '#3a2618'; ctx.fillRect(0, FL, BG_W, H - FL);
  }
};
Object.assign(BGPaint, painters);

// floor props (drawn behind the tiles, standing on the floor)
const decor = {
  itTyres(ctx, x, y) { ctx.save(); for (let k = 0; k < 3; k++) tyre(ctx, x, y - 6 - k * 12, 20); ctx.restore(); },
  itOilCans(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (const [dx, col, h] of [[-9, '#c83a2a', 24], [8, '#2a6ac8', 18]]) { ctx.fillStyle = col; ctx.fillRect(x + dx - 7, y - h, 14, h); ctx.strokeRect(x + dx - 7, y - h, 14, h); ctx.fillStyle = '#d8dce4'; ctx.fillRect(x + dx - 3, y - h - 4, 6, 4); }
    ctx.fillStyle = 'rgba(20,16,24,0.5)'; ctx.beginPath(); ctx.ellipse(x + 18, y - 1, 14, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  itFlourSacks(ctx, x, y) { ctx.save(); sack(ctx, x - 12, y, 28, 30, '#efe8d8', '00'); sack(ctx, x + 12, y, 28, 26, '#e8e0cc', '00'); ctx.restore(); },
  itRopeCoil(ctx, x, y) { ctx.save(); ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x, y - 4 - k * 4, 16 - k, 5, 0, 0, TAU); ctx.stroke(); } ctx.restore(); },
  itBoxChairs(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (const dx of [-16, 16]) { ctx.fillStyle = '#e8b84a'; ctx.fillRect(x + dx - 9, y - 14, 3, 14); ctx.fillRect(x + dx + 6, y - 14, 3, 14); ctx.fillStyle = '#c8283a'; rr(ctx, x + dx - 10, y - 18, 20, 6, 2); ctx.fill(); ctx.stroke(); rr(ctx, x + dx - 9, y - 36, 18, 18, 5); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // the dressing table's lit mirror, in front of the wall
  itLitMirror(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 30, y - 30, 60, 8); ctx.strokeRect(x - 30, y - 30, 60, 8); ctx.fillRect(x - 26, y - 22, 6, 22); ctx.fillRect(x + 20, y - 22, 6, 22);
    ctx.fillStyle = '#f2ece0'; rr(ctx, x - 26, y - 78, 52, 46, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8c8d8'; ctx.fillRect(x - 19, y - 71, 38, 32);
    for (let k = 0; k < 5; k++) for (const by of [y - 76, y - 34]) { const bx = x - 22 + k * 11, on = 0.75 + 0.25 * Math.sin(t * 3 + k); ctx.fillStyle = `rgba(255,236,160,${0.35 * on})`; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  itWigStand(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#5a5e66'; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.fillRect(x - 10, y - 3, 20, 3);
    ctx.fillStyle = '#e8dcc8'; ctx.beginPath(); ctx.ellipse(x, y - 40, 9, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2ece0'; for (const [dx, dy] of [[-8, -46], [0, -52], [8, -46], [-9, -36], [9, -36]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  itBeanSacks(ctx, x, y) { ctx.save(); sack(ctx, x - 14, y, 30, 30, '#c8a06a', ''); sack(ctx, x + 14, y, 30, 26, '#b8905a', ''); sack(ctx, x, y - 24, 26, 22, '#c8a06a', ''); ctx.restore(); },
  itGrinder(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c83a2a'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 9, y - 34); ctx.lineTo(x + 9, y - 34); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.moveTo(x - 14, y - 52); ctx.lineTo(x + 14, y - 52); ctx.lineTo(x + 6, y - 34); ctx.lineTo(x - 6, y - 34); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a3a1e'; ctx.beginPath(); ctx.ellipse(x, y - 52, 13, 3, 0, 0, TAU); ctx.fill();
    const a = t * 2; ctx.strokeStyle = '#3a3438'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 9, y - 24); ctx.lineTo(x + 9 + Math.cos(a) * 14, y - 24 + Math.sin(a) * 14); ctx.stroke();
    ctx.fillStyle = '#3a3438'; ctx.beginPath(); ctx.arc(x + 9 + Math.cos(a) * 14, y - 24 + Math.sin(a) * 14, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
Object.assign(Decor, decor);

// the six rooms' themes: the land's ground and blocks, their own backdrop and light
const room = (base, o) => Object.assign({}, T0[base], { particles: 'dust', rays: null, celestial: { type: 'none' }, stars: 0, music: 'secret' }, o);
Object.assign(THEMES, {
  it_garage: room('it_cantina', { name: 'The Scooter Garage', sky: ['#2a2224', '#3a3034', '#4a3e40'], horizonGlow: '#ffd28a', fog: '#3a3034', darkness: 0.12, layers: [{ kind: 'itGarageBack', color: '#4a3a34', base: 280, f: 0.1 }], decor: ['itTyres', 'itOilCans'] }),
  it_pass: room('it_pizzeria', { name: 'The Pizza Pass', sky: ['#1e3a30', '#2a5a4a', '#2a5a4a'], horizonGlow: '#ff9a5a', fog: '#2a4a3e', darkness: 0, layers: [{ kind: 'itPassBack', color: '#2a5a4a', base: 280, f: 0.1 }], decor: ['itFlourSacks'] }),
  it_belfry: room('it_torre', { name: 'The Bell Loft', particles: 'motes', sky: ['#c8bca4', '#d8ccb4', '#d8ccb4'], horizonGlow: '#fff2c8', fog: '#d8ccb4', layers: [{ kind: 'itBelfryBack', color: '#d8ccb4', base: 280, f: 0.1 }], decor: ['itRopeCoil'] }),
  it_box: room('it_opera', { name: 'The Royal Box', particles: 'motes', sky: ['#5a0c18', '#7a1424', '#7a1424'], horizonGlow: '#ffd24a', fog: '#5a1a22', darkness: 0, layers: [{ kind: 'itBoxBack', color: '#7a1424', base: 280, f: 0.1 }], decor: ['itBoxChairs'] }),
  it_dressing: room('it_opera', { name: 'The Tenor\'s Dressing Room', sky: ['#d8c8b0', '#e8d8c0', '#e8d8c0'], horizonGlow: '#fff2c8', fog: '#c8b8a0', darkness: 0, layers: [{ kind: 'itDressingBack', color: '#e8d8c0', base: 280, f: 0.1 }], decor: ['itWigStand'] }),
  it_beans: room('it_bar', { name: 'The Bean Store', sky: ['#5a3a24', '#7a5434', '#7a5434'], horizonGlow: '#ffb06a', fog: '#5a3a24', darkness: 0.08, layers: [{ kind: 'itBeanBack', color: '#7a5434', base: 280, f: 0.1 }], decor: ['itBeanSacks'] })
});

// the level spec's frame.props become the room's floor props (decor, before the tiles)
{
  const gv0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (Cc, spec) {
    const L = gv0.apply(this, arguments);
    if (Cc && Cc.id === 'it' && L && L.areas) for (const A of L.areas) {
      const F = A.frame;
      if (!F || !F.props || A.itPropsDone) continue;
      A.itPropsDone = true; A.decor = A.decor || [];
      for (const [kind, tx, gy] of F.props) A.decor.push({ kind, x: tx * TS + TS / 2, y: (gy || 11) * TS, seed: tx });
    }
    return L;
  };
}
})();
