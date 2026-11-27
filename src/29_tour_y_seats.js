/* ============================================================
   BELOW THE CHEAP SEATS (world 33, cc 'seats'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, A8 of
   docs/design/CHATGPT_RELAY.md). Beneath Piwi's grandstand the wind-up tin stagehands have built another theatre, to
   watch everything going wrong upstairs. Rust-orange scaffold squares, cream rope loops, teal seat boards and mulberry
   curtains, lit by caged work lamps.
   Found only through Festival Fields: behind 23-1's main stage a little grandstand of benches faces the stage; under
   the last bench ONE plain folding seat faces the ground. Climb down the back of that bench and press DOWN between its
   two middle legs (29_tour_y_seats_e_entry.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Bolt Crab, Seat Shrew,
   Cable Hen, Sandbag Stoat), the tin stagehands' drawing, the land's words on pills, THROW on a prop, the route-map
   emblem, the map's sprites and painters, the music, the country.
   The scaffold (33-1's climbing): 29_tour_y_seats_a_scaff.js. The other stages' stage machinery: 29_tour_y_seats_b_mech.js.
   The boss: 29_tour_y_seats_c_boss.js. The secret rooms: 29_tour_y_seats_d_rooms.js. The entrance in Festival Fields:
   29_tour_y_seats_e_entry.js. The levels and the land's map: 29_tour_y_seats_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'seats', world: 33, name: 'Below the Cheap Seats', sub: 'a hidden land', lon: -47, lat: 39, secret: true, bonus: true, d0: 0.8, pin: 'seat' });
const COL = { a: '#c8562a', b: '#2a8a84', c: '#7a2448' };
const INK = '#1e1624';
const RUST = '#c8562a', RUST_D = '#8a3418', RUST_L = '#e8825a', CREAM = '#f4e6c4', CREAM_D = '#d8c49a', TEAL = '#2a8a84', TEAL_D = '#1a5e5a', TEAL_L = '#5ab8b0';
const MUL = '#7a2448', MUL_D = '#4e1430', MUL_L = '#a8466e', GOLD = '#e8b040', GOLD_D = '#b0801e', TIN = '#c8ccd4', TIN_D = '#8a909c', SAND = '#c89a5a', SAND_D = '#9a7038';
const isSeats = g => !!(g && g.level && g.level.country === 'seats');

/* ---------------- shared drawings ---------------- */
const SeatsArt = {
  INK, RUST, RUST_D, RUST_L, CREAM, CREAM_D, TEAL, TEAL_D, TEAL_L, MUL, MUL_D, MUL_L, GOLD, GOLD_D, TIN, TIN_D, SAND, SAND_D,
  // a scaffold tube from (x0, y0) to (x1, y1), w px thick
  tube(ctx, x0, y0, x1, y1, w, col) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = (w || 6) + 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = col || RUST; ctx.lineWidth = w || 6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,0.35)'; ctx.lineWidth = Math.max(1, (w || 6) * 0.25); ctx.beginPath(); ctx.moveTo(x0 - 1, y0 - 1); ctx.lineTo(x1 - 1, y1 - 1); ctx.stroke();
    ctx.restore();
  },
  // a bolted clamp (a little square with two bolt heads)
  clamp(ctx, x, y, s, col) {
    s = s || 1; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = col || RUST_D;
    rr(ctx, x - 6 * s, y - 6 * s, 12 * s, 12 * s, 2 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TIN; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 3 * s, y + d * 3 * s, 1.8 * s, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // a cream rope loop (a coil hung on a cleat)
  coil(ctx, x, y, s, col) {
    s = s || 1; ctx.save(); ctx.lineWidth = 4 * s; ctx.strokeStyle = INK;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + k * 2 * s, y + k * 2 * s, 9 * s, 13 * s, 0.2, 0, TAU); ctx.stroke(); }
    ctx.lineWidth = 2.4 * s; ctx.strokeStyle = col || CREAM; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + k * 2 * s, y + k * 2 * s, 9 * s, 13 * s, 0.2, 0, TAU); ctx.stroke(); }
    ctx.restore();
  },
  // a rope line from (x0, y0) to (x1, y1) with a little sag
  rope(ctx, x0, y0, x1, y1, sag, col) {
    ctx.save(); ctx.lineCap = 'round'; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + (sag || 0);
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    ctx.strokeStyle = col || CREAM; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore();
  },
  // a teal folding seat seen from the side: pan down (open) or folded up; x the hinge, y the floor
  seat(ctx, x, y, open, s, col) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = TIN_D; ctx.fillRect(-14, -34, 4, 34); ctx.strokeRect(-14, -34, 4, 34);
    ctx.fillStyle = col || TEAL; rr(ctx, -20, -62, 12, 32, 4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-10, -30); ctx.rotate(open ? 0 : -1.35); ctx.fillStyle = col || TEAL; rr(ctx, 0, -5, 26, 9, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  },
  // a hessian sandbag with its rope
  sandbag(ctx, x, y, s, tied) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = SAND; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-16, -14, -14, -2); ctx.quadraticCurveTo(0, 4, 14, -2); ctx.quadraticCurveTo(16, -14, 6, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SAND_D; ctx.beginPath(); ctx.ellipse(0, -23, 7, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.3)'; ctx.beginPath(); ctx.ellipse(-6, -11, 3, 6, 0.3, 0, TAU); ctx.fill();
    if (tied !== false) { ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -40); ctx.stroke(); }
    ctx.restore();
  },
  // a wind-up tin stagehand (Piwi's crew): a tin can body, a key in its back, two lamp eyes; badge = its colour;
  // pose: 'stand' | 'bow' | 'plank' (putting a plank down) | 'shrug'
  hand(ctx, x, y, t, badge, pose, dir, s) {
    s = s || 1; dir = dir || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
    const bow = pose === 'bow' ? 0.9 : pose === 'plank' ? 0.6 : 0, wob = Math.sin(t * 8) * 1.2;
    ctx.fillStyle = '#5a6276'; ctx.fillRect(-8, -9, 6, 9); ctx.strokeRect(-8, -9, 6, 9); ctx.fillRect(2, -9, 6, 9); ctx.strokeRect(2, -9, 6, 9);
    ctx.save(); ctx.translate(0, -9); ctx.rotate(bow);
    ctx.fillStyle = TIN; rr(ctx, -10, -24, 20, 24, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = badge || GOLD; ctx.beginPath(); ctx.arc(2, -13, 5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-12, -14); ctx.rotate(t * (pose === 'stand' ? 3 : 9)); ctx.fillStyle = GOLD; ctx.fillRect(-1, -1, 4, 2); ctx.beginPath(); ctx.ellipse(-4, 0, 3, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = TIN_D; rr(ctx, -7, -36 + wob * 0.3, 14, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = pose === 'shrug' ? '#ff8a6a' : '#ffe68a'; ctx.fillRect(-1, -32, 3, 3); ctx.fillRect(4, -32, 3, 3);
    // the arms: at its sides; out for a shrug; down at the floor in a bow
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath();
    if (pose === 'shrug') { ctx.moveTo(-9, -18); ctx.lineTo(-18, -26); ctx.moveTo(9, -18); ctx.lineTo(18, -26); }
    else if (bow) { ctx.moveTo(6, -18); ctx.lineTo(14, -4); }
    else { ctx.moveTo(9, -18); ctx.lineTo(12, -6); }
    ctx.stroke(); ctx.strokeStyle = TIN_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore(); ctx.restore();
  },
  // a pair of shoes (the curtain call: who is behind the curtain); kind picks colour and shape
  shoes(ctx, x, y, kind, s) {
    s = s || 1; const K = [['#3a2a24', 0, 0], [MUL, 1, 0], ['#e8e0d0', 0, 1], ['#2a5a8a', 1, 1]][kind % 4];
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (const d of [-1, 1]) {
      ctx.fillStyle = K[0]; ctx.beginPath(); ctx.moveTo(d * 4, 0); ctx.lineTo(d * 4, -8); ctx.quadraticCurveTo(d * 14, -9, d * 18, -2); ctx.lineTo(d * 18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (K[1]) { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(d * 10, -6, 2, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (K[2]) { ctx.fillStyle = INK; ctx.fillRect(d * 4 - (d > 0 ? 0 : 3), -3, 3, 3); }
    }
    ctx.restore();
  },
  // the land's tell: one teal seat that faces the wrong way (upside down, its pan toward the floor), tiny, by every secret
  wrongSeat(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = TIN_D; ctx.fillRect(-2, -30, 4, 12); ctx.strokeRect(-2, -30, 4, 12);
    ctx.fillStyle = TEAL; rr(ctx, -12, -18, 24, 8, 3); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(0, -10); ctx.rotate(Math.sin(t * 1.4) * 0.06); rr(ctx, -10, 0, 20, 10, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  },
  // a prompt on a dark rounded pill (never bare text over the backdrop or a character)
  pill(ctx, x, y, text, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = 17; ctx.fillStyle = 'rgba(20,14,30,0.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = col || '#ffd84a'; ctx.fillText(text, x, y + 1); ctx.restore();
  },
  // a mark Brady must stand on: a pulsing gold chalk ring on the boards
  ring(ctx, x, y, t, hot, r) {
    const k = 0.5 + 0.5 * Math.sin(t * 5), R = (r || 18) * (hot ? 1.15 : 1) + k * 4;
    ctx.save(); ctx.strokeStyle = hot ? `rgba(255,220,90,${0.65 + 0.35 * k})` : `rgba(255,230,150,${0.4 + 0.3 * k})`; ctx.lineWidth = hot ? 3.5 : 2.5;
    ctx.beginPath(); ctx.ellipse(x, y - 2, R, R * 0.3, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x - R * 0.6, y - 2); ctx.lineTo(x + R * 0.6, y - 2); ctx.stroke(); ctx.restore();
  },
  // the sign that a prop is listening: THROW on a pill with a pointer under it
  cue(ctx, x, y, t, txt) {
    const k = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.save(); ctx.globalAlpha = 0.78 + 0.22 * k; SeatsArt.pill(ctx, x, y - 14, txt || 'THROW', '#ffd84a');
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x, y + 1 + k * 2); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // a caged work lamp hanging on its flex
  lamp(ctx, x, y, glow) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    if (glow) { const gr = ctx.createRadialGradient(x, y + 8, 2, x, y + 8, 60); gr.addColorStop(0, 'rgba(255,220,150,0.35)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y + 8, 60, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x, y + 8, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a3040'; for (const d of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x + d * 0.6, y); ctx.lineTo(x + d, y + 14); ctx.stroke(); }
    ctx.restore();
  }
};

/* ---------------- the land's floating words: always on a dark rounded pill, clear of the HUD and the thumbs ---------------- */
// SeatsSay(g, x, y, text, col, who): a short line that rises and fades (a line with a `who` replaces that speaker's
// last line: the boss says one thing at a time, in a fixed spot under its bar)
function SeatsSay(g, x, y, text, col, who) {
  if (!g) return; const L = g.__seatsSay || (g.__seatsSay = []);
  if (L.some(q => q.text === text && q.t < 0.4 && Math.abs(q.x - x) < 80)) return;
  if (who) for (let i = L.length - 1; i >= 0; i--) if (L[i].who === who) L.splice(i, 1);
  if (who === 'boss') for (let i = L.length - 1; i >= 0; i--) if (L[i].who === 'boss') L.splice(i, 1);
  L.push({ x, y, text: String(text), col: col || '#ffffff', t: 0, who, life: who === 'boss' ? 2.2 : 1.4 }); if (L.length > 3) L.shift();
}
TourHooks.on('areaLoaded', play => { play.__seatsSay = []; });
TourHooks.on('playUpdate', (play, dt) => { const L = play.__seatsSay; if (!L || !L.length) return; for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].life) L.splice(i, 1); } });
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.__seatsSay; if (!L || !L.length) return;
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
  const top = play.camY + 74 * k, bot = play.camY + Game.viewH - 150 * k, x0 = play.camX + 150 * k, x1 = play.camX + Game.viewW - 150 * k;
  ctx.save(); ctx.font = `${Math.round(12 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    const w = ctx.measureText(q.text).width + 18 * k, h = 22 * k;
    let x = q.who === 'boss' ? play.camX + Game.viewW / 2 : clamp(q.x, Math.min(x0 + w / 2, play.camX + Game.viewW / 2), Math.max(x1 - w / 2, play.camX + Game.viewW / 2)), y = q.who === 'boss' ? top + h / 2 + 22 * k + (Game.viewH > Game.viewW ? 118 * k : 0) : clamp(q.y - q.t * 22, top + h / 2, Math.max(top + h / 2, bot - h / 2));
    for (const r of placed) if (Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < h) y = r.y + h + 3 * k;
    placed.push({ x, y, w });
    const a = q.t > q.life - 0.4 ? (q.life - q.t) / 0.4 : Math.min(1, q.t * 8);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,14,30,0.84)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.restore();
});

/* ---------------- THROW on a prop ---------------- */
// Each frame in a Cheap Seats level: the first entity with seatsProp whose seatsTouch(p) is true gets the button
// (seatsInput) and the engine's own THROW (the power picker) does not fire.
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (isSeats(g) && inp && this.state === 'play' && !this.dead) {
      let prop = null;
      for (const e of g.entities) if (e.seatsProp && !e.remove && e.seatsTouch(this)) { prop = e; break; }
      this.seatsProp = prop;
      if (prop) { prop.seatsInput(this, inp, dt); if (inp.actionPressed || inp.action) inp = Object.assign({}, inp, { actionPressed: false, action: prop.seatsKeepRun ? inp.action : false }); if (prop.seatsStick && (!prop.seatsStickOn || prop.seatsStickOn(this))) inp = Object.assign({}, inp, { left: false, right: false, down: false, up: false }); }
    } else this.seatsProp = null;
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined' && TourPicker.visible) { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.seatsProp) return false; return vis0.call(this, play); }; }
}
// Brady's feet on floor row ty, his centre within `wide` tiles of column tx
const onMark = (p, tx, ty, wide) => p && !p.dead && p.onGround && p.groundTy === ty && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.75);

/* ---------------- tiles ---------------- */
// the understage boards: dark planks with a worn teal edge and nail heads
const boardGround = {
  style: 'seatsBoards', cap: '#9a6a42', capHi: '#c8945a', dirt: '#4a2e2a', dirt2: '#3a2220', rock: '#2a1818',
  paint(ctx, rng) {
    ctx.fillStyle = '#4a2e2a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#3a2220'; ctx.fillRect(0, 15, TS, 2); ctx.fillRect(((rng() * 24) | 0) + 2, 0, 2, 15); ctx.fillRect(((rng() * 24) | 0) + 2, 17, 2, 15);
    ctx.fillStyle = 'rgba(200,150,100,0.25)'; ctx.fillRect(4, 4, 2, 2); ctx.fillRect(24, 21, 2, 2);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#9a6a42'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.fillStyle = '#6a4228'; for (let x = x0 + 30; x < x1; x += 32) ctx.fillRect(x, 1, 2, 8);
    ctx.fillStyle = TEAL; ctx.fillRect(x0, 9, x1 - x0, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.5);
  }
};
// a scaffold board on two clamps (the one-way ledges)
const scaffSemi = {
  style: 'seatsPlank', c1: '#b8844a', c2: '#8a5a2a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x0, 2, x1 - x0, 8);
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + 2, 1, x1 - x0 - 4, 1.2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.strokeRect(x0 + 0.5, 0.5, x1 - x0 - 1, 9);
    for (let x = x0 + 14; x < x1 - 6; x += 48) { ctx.fillStyle = RUST; ctx.fillRect(x - 3, -2, 6, 13); ctx.strokeRect(x - 3, -2, 6, 13); }
  }
};
// a rope trunk (bricks: they break)
const trunkBrick = {
  style: 'seatsTrunk', c1: TEAL, c2: TEAL_D, mortar: '#0e3a38',
  paint(ctx) {
    ctx.fillStyle = TEAL; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = TEAL_D; ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 21, TS, 2);
    ctx.fillStyle = RUST; ctx.fillRect(0, 0, 6, 6); ctx.fillRect(TS - 6, 0, 6, 6); ctx.fillRect(0, TS - 6, 6, 6); ctx.fillRect(TS - 6, TS - 6, 6, 6);
    ctx.fillStyle = GOLD; ctx.fillRect(TS / 2 - 4, 12, 8, 7);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// backstage boards and struts over a mulberry curtain (walls, the high ledges)
const strutHard = {
  c1: RUST, c2: MUL_D,
  paint(ctx) {
    ctx.fillStyle = MUL_D; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = MUL; ctx.fillRect(4, 0, 6, TS); ctx.fillRect(18, 0, 6, TS);
    ctx.fillStyle = RUST; ctx.fillRect(0, 0, TS, 4); ctx.fillRect(0, TS - 4, TS, 4); ctx.fillRect(0, 0, 4, TS);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, TS, TS); ctx.clip(); ctx.strokeStyle = RUST; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(2, TS - 2); ctx.lineTo(TS - 2, 2); ctx.stroke(); ctx.restore();
    ctx.fillStyle = TIN_D; ctx.beginPath(); ctx.arc(2, 2, 1.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1);
  }
};
const understage = { ground: boardGround, semi: scaffSemi, brick: trunkBrick, hard: strutHard, pillar: { c1: RUST, c2: RUST_D, cap: TEAL, style: 'column' }, accent: GOLD, tint: {}, bloom: 0.16, liquid: null };

// each secret room its own floor and walls
const roomTiles = (cap, capHi, body, body2, pat, hard1, hard2) => {
  const ground = { style: 'seatsRoom', cap, capHi, dirt: body, dirt2: body2, rock: body2,
    paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = body2;
      if (pat === 'tile') { ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); }
      else if (pat === 'plank') { ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect((rng() * 20) | 0, 0, 2, 10); }
      else if (pat === 'check') { ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); }
      else if (pat === 'rivet') { for (const [a, b] of [[5, 5], [26, 5], [5, 26], [26, 26]]) { ctx.beginPath(); ctx.arc(a, b, 2, 0, TAU); ctx.fill(); } ctx.fillRect(0, 15, TS, 1.5); }
      else if (pat === 'carpet') { for (let y = 2; y < TS; y += 8) for (let x = (y / 8 % 2) * 8; x < TS; x += 16) { ctx.beginPath(); ctx.arc(x + 4, y + 2, 2.2, 0, TAU); ctx.fill(); } }
      else if (pat === 'herring') { for (let y = 0; y < TS; y += 8) for (let x = (y / 8) % 2 * 8; x < TS; x += 16) ctx.fillRect(x, y, 8, 3); } },
    paintCap(ctx, x0, x1) { ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 3); ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); } };
  const hard = { c1: hard1, c2: hard2, paint(ctx) { ctx.fillStyle = hard2; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = hard1; ctx.fillRect(2, 2, TS - 4, TS - 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); } };
  return Object.assign({}, understage, { ground, hard });
};
const RT = {
  store: roomTiles('#c8562a', '#e8825a', '#6a3a24', '#4a2618', 'rivet', '#8a4a2a', '#4a2618'),          // B36 the cable store
  weights: roomTiles('#8a909c', '#c8ccd4', '#4a4e5a', '#34363e', 'tile', '#6a6e7a', '#2a2c34'),          // B37 the counterweight cage
  props: roomTiles('#e8b040', '#f8d880', '#8a6a3a', '#6a4e26', 'plank', '#a8844a', '#5a3e1a'),            // B38 the props table
  green: roomTiles('#3e8a5a', '#6ab88a', '#e8e0c8', '#cfc4a4', 'check', '#5a9a6a', '#2a5a3a'),            // B39 the green room
  pit: roomTiles('#2a2a3a', '#4a4a64', '#1e1e2a', '#14141e', 'herring', '#3a3a52', '#14141e'),            // B40 the band pit
  call: roomTiles('#7a2448', '#a8466e', '#4e1430', '#3a0e24', 'carpet', '#8a3458', '#3a0e24')            // the curtain call
};

/* ---------------- painted backdrops (all dull: nothing back here looks like a prop you can use) ---------------- */
// the grandstand's underside: raking rows of seat boards with daylight slits between them
function underside(ctx, b, col, slit) {
  for (let x = -200; x < BG_W + 200; x += 46) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 46, 0); ctx.lineTo(x + 46 + 120, b * 0.5); ctx.lineTo(x + 120, b * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = slit; ctx.beginPath(); ctx.moveTo(x + 42, 0); ctx.lineTo(x + 46, 0); ctx.lineTo(x + 166, b * 0.5); ctx.lineTo(x + 162, b * 0.5); ctx.closePath(); ctx.fill();
  }
}
// a scaffold silhouette: verticals, ledgers and braces
function scaffSil(ctx, x0, x1, top, b, step, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += step) { ctx.moveTo(x, top); ctx.lineTo(x, b); }
  for (let y = b - step; y > top; y -= step) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();
  ctx.lineWidth = w * 0.7; ctx.beginPath(); for (let x = x0; x < x1; x += step * 2) for (let y = b; y > top + step; y -= step * 2) { ctx.moveTo(x, y); ctx.lineTo(x + step, y - step); } ctx.stroke();
}
const painters = {
  // far: the grandstand's sloping underside, thin daylight slits between its boards
  seatsUnder(ctx, L, rng, H) { underside(ctx, L.base, L.color, 'rgba(255,230,170,0.18)'); ctx.fillStyle = L.color; ctx.fillRect(0, L.base * 0.5, BG_W, H); },
  // near: scaffold towers in silhouette, caged lamps on their flexes
  seatsScaff(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 30; x < BG_W; x += 330) scaffSil(ctx, x, x + 180, 60 + rng() * 40, b, 60, L.color, 6);
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 140; x < BG_W; x += 280) { ctx.strokeStyle = L.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 70); ctx.stroke(); ctx.fillStyle = 'rgba(255,220,150,0.28)'; ctx.beginPath(); ctx.arc(x, 78, 26, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,170,0.6)'; ctx.beginPath(); ctx.arc(x, 78, 6, 0, TAU); ctx.fill(); }
  },
  // 33-2: the fly gallery: the pin rail with rows of rope ends, hanging sandbags far off, battens
  seatsFlies(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let y = 40; y < b - 60; y += 70) ctx.fillRect(0, y, BG_W, 6);
    for (let x = 10; x < BG_W; x += 22) { ctx.fillRect(x, 0, 2, b - 30 - (x * 7 % 50)); }
    for (let x = 60; x < BG_W; x += 150) { ctx.beginPath(); ctx.ellipse(x, b - 60 - (x % 90), 9, 12, 0, 0, TAU); ctx.fill(); }
  },
  // 33-3: the stalls from behind: rows of seat backs raking up into the dark, a balcony's curved front
  seatsStalls(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let r = 0; r < 5; r++) { const y = b - r * 34; for (let x = (r % 2) * 14; x < BG_W; x += 28) { ctx.fillRect(x, y - 26, 22, 26); ctx.beginPath(); ctx.arc(x + 11, y - 26, 11, Math.PI, 0); ctx.fill(); } }
    ctx.beginPath(); ctx.moveTo(0, 70); for (let x = 0; x <= BG_W; x += 40) ctx.lineTo(x, 70 + Math.sin(x * 0.004) * 14); ctx.lineTo(BG_W, 96); ctx.lineTo(0, 96); ctx.closePath(); ctx.fill();
  },
  // 33-4: the scenery dock: flats stacked against the wall, edge on, painted backs facing us (plain canvas)
  seatsDock(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 0; x < BG_W; x += 90 + rng() * 60) { const h = 140 + rng() * 80; ctx.save(); ctx.translate(x, b); ctx.rotate(-0.08 - rng() * 0.06); ctx.fillRect(0, -h, 70, h); ctx.restore(); }
  },
  // 33-5: the house seen from the wings: rows of animal audience (round heads, two eye-glints each) in the dark
  seatsHouse(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let r = 0; r < 4; r++) { const y = b - r * 30; for (let x = (r % 2) * 18; x < BG_W; x += 36) { ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(x, y - 12, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 9, y - 18); ctx.lineTo(x - 6, y - 28); ctx.lineTo(x - 2, y - 20); ctx.fill(); ctx.fillStyle = 'rgba(255,240,200,0.35)'; if (rng() < 0.6) { ctx.fillRect(x - 4, y - 14, 2, 2); ctx.fillRect(x + 2, y - 14, 2, 2); } } }
  },
  // 33-6: the stage from the wings: proscenium arch, a mulberry house curtain gathered up, footlight glow
  seatsProsc(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color;
    for (let x = 0; x < BG_W; x += 520) { ctx.fillRect(x, 0, 40, b); ctx.fillRect(x, 0, 520, 40); for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(x + 60 + k * 50, 40, 26, 34 + (k % 2) * 6, 0, 0, Math.PI); ctx.fill(); } }
    ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = 'rgba(255,220,140,0.12)'; ctx.fillRect(0, b - 20, BG_W, 20);
  },
  // the rooms: each its own back wall
  roomStore(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#4a2618'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#5a3020'; for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, BG_W, 20); for (let x = 60; x < BG_W; x += 150) { ctx.fillStyle = '#6a3a28'; ctx.fillRect(x, b - 210, 8, 210); for (let k = 0; k < 3; k++) { ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x + 30, b - 180 + k * 50, 16, 20, 0, 0, TAU); ctx.stroke(); } } },
  roomWeights(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#2a2c34'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = '#3e424e'; ctx.lineWidth = 3; for (let x = 0; x < BG_W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); } ctx.fillStyle = '#4a4e5a'; for (let x = 40; x < BG_W; x += 120) for (let k = 0; k < 5; k++) ctx.fillRect(x, b - 40 - k * 16, 60, 12); },
  roomProps(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#5a3e1a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#6a4e26'; for (let x = 0; x < BG_W; x += 60) ctx.fillRect(x, 0, 56, H); for (let x = 30; x < BG_W; x += 200) { ctx.fillStyle = '#7a5a30'; ctx.fillRect(x, b - 160, 150, 8); ctx.fillStyle = '#8a6a40'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 20 + k * 36, b - 176, 12, 0, TAU); ctx.fill(); } } },
  roomGreen(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#d8d8b8'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#c8ccaa'; for (let x = 0; x < BG_W; x += 30) ctx.fillRect(x, 0, 15, H); for (let x = 80; x < BG_W; x += 340) { ctx.fillStyle = '#9aa888'; ctx.fillRect(x, b - 230, 120, 80); ctx.fillStyle = '#f0e8c8'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * 20, b - 232, 6, 0, TAU); ctx.fill(); } ctx.fillStyle = '#7a8a6a'; ctx.fillRect(x + 160, b - 120, 120, 70); } },
  roomPit(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#14141e'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#22223a'; for (let x = 40; x < BG_W; x += 110) { ctx.fillRect(x, b - 140, 4, 140); ctx.fillRect(x - 20, b - 150, 44, 30); } ctx.fillStyle = 'rgba(255,230,150,0.12)'; for (let x = 60; x < BG_W; x += 110) { ctx.beginPath(); ctx.moveTo(x - 20, b - 120); ctx.lineTo(x + 30, b - 120); ctx.lineTo(x + 50, b); ctx.lineTo(x - 40, b); ctx.closePath(); ctx.fill(); } },
  roomCall(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#3a0e24'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#4e1430'; for (let x = 0; x < BG_W; x += 34) { ctx.beginPath(); ctx.ellipse(x + 17, H / 2, 14, H, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(232,176,64,0.18)'; ctx.fillRect(0, 30, BG_W, 10); }
};

// the dim understage under the warm working lamps
const SKY = ['#1e1424', '#3a2230', '#5a3a34'];
const base = (o, ...mix) => Object.assign({}, ...mix, o);
const room = (name, sky, layer) => base({ name, music: 'tour_seats_room', particles: 'none', rays: null, sky: [sky, sky, sky], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: layer, base: 400, f: 0.05 }], fog: sky, decor: [] }, RT[{ roomStore: 'store', roomWeights: 'weights', roomProps: 'props', roomGreen: 'green', roomPit: 'pit', roomCall: 'call' }[layer]]);
const themes = {
  seats_scaffold: base({ name: 'Two Ways Round a Pole', music: 'tour_seats', particles: 'none', rays: '#ffe0b0', sky: SKY, horizonGlow: '#c8906a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#2e2030', base: 330, f: 0.06 }, { kind: 'seatsScaff', color: '#3e2a32', base: 430, f: 0.2 }], fog: '#4a3038', decor: ['seatsCoilDecor', 'seatsLampDecor'] }, understage),
  seats_flies: base({ name: 'Slack Department', music: 'tour_seats_flies', particles: 'none', rays: null, sky: ['#241a2e', '#3e2a3a', '#6a4a3a'], horizonGlow: '#d8a070', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#30223a', base: 330, f: 0.05 }, { kind: 'seatsFlies', color: '#3a2a38', base: 430, f: 0.18 }], fog: '#4a3440', decor: ['seatsCoilDecor', 'seatsBagDecor'] }, understage),
  seats_rowg: base({ name: 'The Seat That Ate Row G', music: 'tour_seats', particles: 'none', rays: '#ffd8a0', sky: ['#1a2a30', '#2a3a40', '#4a4a40'], horizonGlow: '#a8b890', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#1e2e34', base: 320, f: 0.05 }, { kind: 'seatsStalls', color: '#22383c', base: 430, f: 0.18 }], fog: '#2e4448', decor: ['seatsLampDecor'] }, understage),
  seats_dock: base({ name: 'Please Mind the Scenery', music: 'tour_seats_flies', particles: 'none', rays: null, sky: ['#2a1a20', '#4a2a2e', '#7a4a3a'], horizonGlow: '#e0a070', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#36202a', base: 330, f: 0.05 }, { kind: 'seatsDock', color: '#4a2e30', base: 430, f: 0.17 }], fog: '#5a3a3a', decor: ['seatsCoilDecor'] }, understage),
  seats_house: base({ name: 'House Left', music: 'tour_seats', particles: 'none', rays: null, sky: ['#120e1e', '#1e1830', '#2e2440'], horizonGlow: '#5a4a7a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#1a1428', base: 320, f: 0.05 }, { kind: 'seatsHouse', color: '#221c34', base: 430, f: 0.18 }], fog: '#2a2240', decor: ['seatsLampDecor'] }, understage),
  seats_stage: base({ name: 'Just One More Bow', music: 'tour_seats_boss', particles: 'none', rays: null, sky: ['#1a0a14', '#3a1424', '#5a2a2a'], horizonGlow: '#c87a5a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'seatsUnder', color: '#2a1220', base: 330, f: 0.05 }, { kind: 'seatsProsc', color: '#3a1626', base: 430, f: 0.16 }], fog: '#4a1e2e', decor: ['seatsCoilDecor'] }, understage),
  seats_room_store: room('The Cable Store', '#4a2618', 'roomStore'),
  seats_room_weights: room('The Counterweight Cage', '#2a2c34', 'roomWeights'),
  seats_room_props: room('The Props Table', '#5a3e1a', 'roomProps'),
  seats_room_green: room('The Green Room', '#d8d8b8', 'roomGreen'),
  seats_room_pit: room('The Band Pit', '#14141e', 'roomPit'),
  seats_room_call: room('The Curtain Call', '#3a0e24', 'roomCall')
};

/* ---------------- props (Decor: drawn each frame) ---------------- */
const decor = {
  // a coil of cream rope on a cleat
  seatsCoilDecor(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = RUST_D; ctx.fillRect(x - 3, y - 40, 6, 40); ctx.strokeRect(x - 3, y - 40, 6, 40); ctx.restore(); SeatsArt.coil(ctx, x + 2, y - 22, 0.8); },
  // a caged work lamp on a short stand
  seatsLampDecor(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = TIN_D; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.restore(); SeatsArt.lamp(ctx, x, y - 44, true); },
  // a sandbag slumped on the boards
  seatsBagDecor(ctx, x, y) { SeatsArt.sandbag(ctx, x, y, 0.8, false); }
};

/* ---------------- door looks: a stage door, a trap in the boards ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'seatsDoor' || look === 'seatsTrap') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'seatsDoor') {
        ctx.fillStyle = MUL; rr(ctx, x - 22, y - 62, 44, 62, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#1a0a14' : MUL_L; rr(ctx, x - 16, y - 56, 32, 52, 3); ctx.fill();
        ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x + 10, y - 30, 3, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x, y - 44, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(x - 3, y - 46); ctx.lineTo(x, y - 42); ctx.lineTo(x + 3, y - 46); ctx.fill();
      } else {
        ctx.fillStyle = '#6a4228'; rr(ctx, x - 20, y - 48, 40, 48, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#120a0e' : '#2a1a14'; rr(ctx, x - 14, y - 40, 28, 34, 3); ctx.fill();
        SeatsArt.clamp(ctx, x, y - 44, 0.8);
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// BOLT CRAB: a rust crab under a hex-nut shell, a spanner in one claw. Every so often it stops and bolts ITSELF to the
// rail with its own spanner (the tell: the spanner turns), then sits there tight, very pleased
const crabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const tight = m === 'notice' || m === 'stun', st = Math.sin(t * 14) * (m === 'walk' ? 2 : 0);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); for (const lx of [-12, -6, 4, 10]) { ctx.moveTo(lx, -6); ctx.lineTo(lx + (lx < 0 ? -4 : 4) + st * (lx % 2 ? 1 : -1), 0); } ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.fillStyle = RUST; ctx.beginPath(); ctx.ellipse(0, -10, 14, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // the nut shell
  ctx.fillStyle = TIN; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; ctx.lineTo(-2 + Math.cos(a) * 11, -18 + Math.sin(a) * 8); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = TIN_D; ctx.beginPath(); ctx.ellipse(-2, -18, 4, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // eyes on stalks
  ctx.beginPath(); ctx.moveTo(7, -14); ctx.lineTo(8, -22); ctx.moveTo(11, -13); ctx.lineTo(13, -21); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const [ex, ey] of [[8, -24], [13, -23]]) { ctx.beginPath(); ctx.arc(ex, ey, 3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; for (const [ex, ey] of [[9, -24], [14, -23]]) { ctx.beginPath(); ctx.arc(ex, ey + (tight ? -1 : 0), 1.3, 0, TAU); ctx.fill(); }
  // the claw with the spanner: held up walking; down on the rail, turning, when tightening
  ctx.save(); ctx.translate(13, -8); ctx.rotate(tight ? 1.2 + Math.sin(t * 20) * 0.3 : -0.9);
  ctx.fillStyle = RUST_L; ctx.beginPath(); ctx.ellipse(4, 0, 6, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = TIN_D; ctx.fillRect(8, -1.6, 12, 3.2); ctx.strokeRect(8, -1.6, 12, 3.2); ctx.beginPath(); ctx.arc(21, 0, 4, 0.7, -0.7 + TAU); ctx.lineWidth = 2.4; ctx.stroke();
  ctx.restore();
  ctx.restore();
};
// SEAT SHREW: a teal shrew with a crumb. It pinches crumbs and keeps folding itself into a little seat
const shrewArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  if (m === 'seat' || m === 'notice') {
    // folded into a seat: a teal seat with a pink nose and a tail poking out
    const k = m === 'notice' ? 0.5 : 1;
    ctx.fillStyle = '#9a6a42'; ctx.fillRect(-12, -8, 4, 8); ctx.strokeRect(-12, -8, 4, 8); ctx.fillRect(8, -8, 4, 8); ctx.strokeRect(8, -8, 4, 8);
    ctx.fillStyle = TEAL; rr(ctx, -14, -16 - 8 * k, 28, 10, 3); ctx.fill(); ctx.stroke(); rr(ctx, -14, -34 * k - 8, 8, 26 * k, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0a0a8'; ctx.beginPath(); ctx.arc(15, -12 - 8 * k, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f0a0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -10); ctx.quadraticCurveTo(-22, -6, -20, 2); ctx.stroke();
    ctx.restore(); return;
  }
  const st = Math.sin(t * 16) * 2;
  ctx.strokeStyle = '#f0a0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-22, -2, -24, -10); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = TEAL; ctx.beginPath(); ctx.ellipse(-1, -10, 13, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(3, -7, 7, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = TEAL; ctx.beginPath(); ctx.moveTo(8, -16); ctx.quadraticCurveTo(20, -14, 22, -10); ctx.quadraticCurveTo(16, -6, 8, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f0a0a8'; ctx.beginPath(); ctx.arc(22, -10, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(4, -19, 4, 5, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12, -13, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(13, -13, 1.2, 0, TAU); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6 + st, 0); ctx.moveTo(4, -2); ctx.lineTo(4 - st, 0); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(16, -5, 3.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// CABLE HEN: a cream hen with a mulberry cable looped round her. She lays immaculate coils across the walkway
const henArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const fluff = m === 'notice' ? 1.15 : 1, step = m === 'walk' ? Math.sin(t * 10) * 3 : 0;
  ctx.strokeStyle = GOLD_D; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-4 + step, 0); ctx.moveTo(4, -8); ctx.lineTo(5 - step, 0); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.save(); ctx.scale(fluff, fluff);
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(-16, -22); ctx.quadraticCurveTo(-18, -6, 0, -7); ctx.quadraticCurveTo(14, -8, 12, -22); ctx.quadraticCurveTo(0, -18, -16, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = RUST_L; ctx.beginPath(); ctx.ellipse(-3, -15, 7, 4, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(10, -27, 6, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.arc(9, -36, 3, 0, TAU); ctx.arc(13, -35, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(15, -29); ctx.lineTo(21, -27); ctx.lineTo(15, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12, -30, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(12.6, -30, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
  // the cable round her: two mulberry loops and a plug
  ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.ellipse(-10, -14, 6, 9, 0.3, 0, TAU); ctx.stroke(); ctx.strokeStyle = MUL; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = TIN; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillRect(-20, -8, 6, 5); ctx.strokeRect(-20, -8, 6, 5);
  ctx.restore();
};
// SANDBAG STOAT: a cream stoat with a dark tail tip. She bows to whichever bag is heavier (the tell), then darts off
const stoatArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const bow = m === 'notice', run = m === 'charge';
  // tail
  ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-20, bow ? -30 : -14, bow ? -16 : -26, bow ? -38 : -18); ctx.stroke(); ctx.strokeStyle = CREAM; ctx.lineWidth = 4.6; ctx.stroke();
  ctx.strokeStyle = '#3a2a24'; ctx.beginPath(); ctx.moveTo(bow ? -17 : -24, bow ? -34 : -17); ctx.lineTo(bow ? -16 : -26, bow ? -38 : -18); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = CREAM;
  if (bow) { ctx.beginPath(); ctx.ellipse(0, -9, 13, 6, 0.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(12, -3, 7, 5, 0.2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(14, -5, 1.2, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(16, -4, 2, 0, Math.PI); ctx.stroke(); }
  else {
    ctx.beginPath(); ctx.ellipse(-2, -10, 12, 7, run ? 0 : -0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10, -18, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d88a8a'; ctx.beginPath(); ctx.arc(17, -17, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(11, -20, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(11.8, -20, 1.1, 0, TAU); ctx.fill();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(6, -24, 3, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  const st = Math.sin(t * (run ? 24 : 12)) * 2.4; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-8 + st, 0); ctx.moveTo(6, -4); ctx.lineTo(6 - st, 0); ctx.stroke();
  ctx.restore();
};
// a laid coil of cable (the hen's): a neat flat mulberry spiral
const coilArt = (c, s) => { c.save(); c.translate(s.x + s.w / 2, s.y + s.h - 3); c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -1, 6, 2.4, 0, 0, TAU); c.stroke(); c.strokeStyle = MUL_L; c.lineWidth = 2.4; c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -1, 6, 2.4, 0, 0, TAU); c.stroke(); c.restore(); };
const enemies = {
  // the crab: walks the rail; every few seconds stops and bolts itself down (0.5 s turning tell, then 1.6 s tight).
  // Its nut shell bounces a stomp while it walks; stomp it while it is bolted down
  seatsCrab: { cls: TourEnemy.make({ w: 30, h: 26, speed: 0.75, behavior: 'walk', edgeTurn: true, art: crabArt, burst: RUST,
    init(e) { e.tieT = 2 + Math.random() * 2; e.stk = 0; },
    think(e, dt) {
      if (e.stk > 0) { e.stk -= dt; e.vx = 0; e.mode = 'notice'; if (e.stk <= 0) e.vx = e.dir * e.speed; return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      e.tieT -= dt; if (e.tieT <= 0) { e.tieT = 3.6 + Math.random() * 1.4; e.stk = 2.1; e.vx = 0; if (e.g.onScreen(e)) SeatsSay(e.g, e.cx, e.y - 12, 'TIGHT AS A NUT.', CREAM); }
    } }), place: 'walk' },
  // the shrew: scurries; stops to pinch a crumb and folds itself into a seat (2 s): a seat you can bounce on
  seatsShrew: { cls: TourEnemy.make({ w: 28, h: 22, speed: 1.1, behavior: 'walk', edgeTurn: true, art: shrewArt, burst: TEAL,
    init(e) { e.cd = 1.5 + Math.random() * 1.5; e.fold = 0; },
    think(e, dt) {
      if (e.fold > 0) { e.fold -= dt; e.vx = 0; e.mode = e.fold > 1.8 || e.fold < 0.25 ? 'notice' : 'seat'; if (e.fold <= 0) e.vx = e.dir * e.speed; return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      e.cd -= dt; if (e.cd <= 0) { e.cd = 3.2 + Math.random(); e.fold = 2.2; e.vx = 0; if (e.g.onScreen(e)) SeatsSay(e.g, e.cx, e.y - 12, 'IS THIS SEAT TAKEN?', CREAM); }
    } }), place: 'walk' },
  // the hen: struts; fluffs up (0.7 s) and lays a neat coil of cable that rolls a little way along the boards
  seatsHen: { cls: TourEnemy.make({ w: 28, h: 34, speed: 0.55, behavior: 'walk', edgeTurn: true, art: henArt, burst: CREAM,
    init(e) { e.cd = 2 + Math.random(); e.puff = 0; },
    think(e, dt) {
      if (e.puff > 0) { e.puff -= dt; e.vx = 0; e.mode = 'notice'; if (e.puff <= 0) { e.cd = 3.4; e.vx = e.dir * e.speed; if (e.g.onScreen(e, 60)) { TourKit.sfx('plop', 'kick', { vol: 0.3, pitch: 0.8 }); tourFire(e.g, e.cx - e.dir * 10, e.y + e.h - 12, { vx: -e.dir * 1.6 * TS, vy: 0, grav: 0, w: 20, h: 10, life: 2.4, col: MUL, art: coilArt }); SeatsSay(e.g, e.cx, e.y - 12, 'IMMACULATE.', CREAM); } } return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      e.cd -= dt; if (e.cd <= 0 && TourKit.near(e, e.g.player, 9, 3)) { e.puff = 0.7; e.vx = 0; }
    } }), place: 'walk' },
  // the stoat: trots; stops and bows low to the heavier bag (0.8 s, the tell), then darts forward 2.5 tiles
  seatsStoat: { cls: TourEnemy.make({ w: 30, h: 26, speed: 0.8, behavior: 'walk', edgeTurn: true, art: stoatArt, burst: CREAM,
    init(e) { e.cd = 2 + Math.random(); e.bow = 0; e.dash = 0; },
    think(e, dt) {
      if (e.bow > 0) { e.bow -= dt; e.vx = 0; e.mode = 'notice'; if (e.bow <= 0) e.dash = 0.6; return; }
      if (e.dash > 0) { e.dash -= dt; e.vx = e.dir * 4 * TS * 0.0 + e.dir * e.speed * 4; e.mode = 'charge'; if (e.dash <= 0) e.vx = e.dir * e.speed; return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      e.cd -= dt; if (e.cd <= 0) { e.cd = 3.6 + Math.random(); e.bow = 0.8; e.vx = 0; if (e.g.onScreen(e)) SeatsSay(e.g, e.cx, e.y - 12, 'AFTER YOU, HEAVY ONE.', CREAM); }
    } }), place: 'walk' }
};
// the crab's nut shell: a stomp bounces off while it walks (stomp it while it is bolted down); the shrew folded into a
// seat is a springy seat (a stomp bounces Brady high and does not hurt it)
{
  const h0 = TourEnemy.prototype.hit;
  enemies.seatsCrab.cls.prototype.hit = function (kind, src) {
    if ((kind === 'stomp' || kind === 'spin') && !this.dead && !(this.stk > 0) && !(this.stunT > 0)) { Sound.play('bump', { vol: 0.35, pitch: 1.3 }); return 'bounce'; }
    return h0.call(this, kind, src);
  };
  enemies.seatsShrew.cls.prototype.hit = function (kind, src) {
    if ((kind === 'stomp' || kind === 'spin') && !this.dead && this.fold > 0) { Sound.play('spring', { vol: 0.4, pitch: 1.3 }); const p = this.g.player; if (p) { p.vy = -PHYS.stompV * 1.25; } return 'bounce'; }
    return h0.call(this, kind, src);
  };
}

/* ---------------- the route map: a folding seat in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = MUL; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  SeatsArt.seat(ctx, x + r * 0.15, y + r * 0.55, Math.sin(t * 2) > 0, r / 48);
  ctx.restore();
};

/* ---------------- the land's map: sprites and the boards ---------------- */
Object.assign(TourOWPaint.art, {
  // a scaffold tower: two uprights and three ledgers
  seatsTowerSprite(c, r) {
    c.fillStyle = RUST; for (const dx of [-0.7, 0.55]) { c.fillRect(dx * r, -r * 1.6, r * 0.15, r * 1.6); c.strokeRect(dx * r, -r * 1.6, r * 0.15, r * 1.6); }
    for (const dy of [0.5, 1.0, 1.5]) { c.fillRect(-r * 0.75, -dy * r, r * 1.45, r * 0.12); c.strokeRect(-r * 0.75, -dy * r, r * 1.45, r * 0.12); }
  },
  // a folding teal seat
  seatsSeatSprite(c, r) { c.fillStyle = TEAL; c.fillRect(-r * 0.5, -r * 1.2, r * 0.3, r * 0.9); c.strokeRect(-r * 0.5, -r * 1.2, r * 0.3, r * 0.9); c.fillRect(-r * 0.5, -r * 0.4, r, r * 0.22); c.strokeRect(-r * 0.5, -r * 0.4, r, r * 0.22); c.fillStyle = TIN_D; c.fillRect(-r * 0.45, -r * 0.2, r * 0.12, r * 0.2); c.fillRect(r * 0.35, -r * 0.2, r * 0.12, r * 0.2); },
  // a sandbag on its line
  seatsBagSprite(c, r) { c.strokeStyle = CREAM; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r * 1.6); c.lineTo(0, -r * 0.8); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.4; c.fillStyle = SAND; c.beginPath(); c.ellipse(0, -r * 0.4, r * 0.45, r * 0.45, 0, 0, TAU); c.fill(); c.stroke(); },
  // the prop basket (the boss)
  seatsBasketSprite(c, r) { c.fillStyle = TEAL; c.fillRect(-r, -r * 0.8, r * 2, r * 0.8); c.strokeRect(-r, -r * 0.8, r * 2, r * 0.8); c.fillStyle = RUST; c.fillRect(-r * 0.2, -r * 0.7, r * 0.4, r * 0.3); c.fillStyle = MUL; c.beginPath(); c.moveTo(-r * 0.4, -r * 0.8); c.lineTo(0, -r * 1.6); c.lineTo(r * 0.4, -r * 0.8); c.closePath(); c.fill(); c.stroke(); },
  // the stage door (the airstrip)
  seatsDoorSprite(c, r) { c.fillStyle = MUL; c.fillRect(-r * 0.5, -r * 1.3, r, r * 1.3); c.strokeRect(-r * 0.5, -r * 1.3, r, r * 1.3); c.fillStyle = GOLD; c.beginPath(); c.arc(r * 0.3, -r * 0.6, r * 0.08, 0, TAU); c.fill(); }
});
// the edge of the land: a mulberry curtain hem instead of a coast
TourOWLands.coast.seatsCurtain = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(20,10,20,0.35)'; c.fill(); c.restore();
  c.save(); c.translate(0, 8); OWGeo.path(c, ring, true); c.fillStyle = MUL_D; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = MUL; c.lineWidth = 16; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the boards under the trails: plank seams, chalk marks, coils of rope
TourOWScenes.groundPaint.seats = function (c, ow) {
  const R = TourOWPaint.rng('seatsground'), ink = TourOWPaint.INK;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(40,20,20,0.25)'; c.lineWidth = 2; for (let y = 180; y < 720; y += 34) { c.beginPath(); c.moveTo(160, y); c.lineTo(1380, y); c.stroke(); }
  for (let k = 0; k < 10; k++) { const x = 260 + R() * 1000, y = 200 + R() * 480; c.strokeStyle = ink; c.lineWidth = 3.4; c.beginPath(); c.ellipse(x, y, 9, 5, 0, 0, TAU); c.stroke(); c.strokeStyle = CREAM; c.lineWidth = 2; c.stroke(); }
  for (let k = 0; k < 8; k++) { const x = 260 + R() * 1000, y = 200 + R() * 480; c.strokeStyle = 'rgba(255,240,200,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y - 8); c.lineTo(x + 8, y + 8); c.moveTo(x + 8, y - 8); c.lineTo(x - 8, y + 8); c.stroke(); }
};
TourLandscape.looks.seats = ['#5a3a34', '#3a2230', '#2a8a84', CREAM, '#ffffff', RUST, 'seatsSeat'];
{
  // the land's landmark miniature: a folding seat facing the ground
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'seatsSeat') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    SeatsArt.tube(ctx, -24, -40, 24, -40, 6); SeatsArt.wrongSeat(ctx, 0, -6, 0);
    ctx.restore();
  };
}

/* ---------------- music: a sneaky backstage shuffle, a rope-hauling waltz, a little room tune, the coat's grand
   encore march ---------------- */
const tracks = {
  tour_seats: {
    bpm: 116, bars: 8, rv: 0.32, dl: 0.16, sw: 0.18, hx: 0.04,
    ch: 'Dm7 G7 Cmaj7 A7 Dm7 G7 Em7 A7',
    ld: 'D6:2 F6:2 A6:4 G6:4 F6:4 | E6:8 D6:8 | C6:2 E6:2 G6:4 B6:8 | A6:4 G6:4 E6:8 | F6:2 A6:2 D7:4 C7:4 A6:4 | B6:4 G6:4 D6:8 | E6:4 G6:4 B6:4 D7:4 | C#7:16',
    li: 'reed', lv: 0.12,
    bp: 'r..f..r.r...f...', bi: 'pluckb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k.....k...k.....', '....s.......s...', 'h.hhh.h.h.hhh.h.'], dv: 0.26
  },
  tour_seats_flies: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.34, dl: 0.14, hx: 0.05,
    ch: 'Am Am E7 E7 Am Dm E7 Am',
    ld: 'E6:3 A6:3 C7:3 | B6:6 G#6:3 | D6:3 E6:3 G#6:3 | B6:9 | C7:3 E7:3 C7:3 | D7:3 A6:3 F6:3 | E6:3 G#6:3 B6:3 | A6:9',
    li: 'glass', lv: 0.12,
    bp: 'r..f..', bi: 'pluckb', bv: 0.3,
    ap: '...c.c', ai: 'vibes', av: 0.05, ao: 62,
    dr: ['k.....', '...s.s', 'h.hh.h'], dv: 0.28
  },
  tour_seats_room: {
    bpm: 104, bars: 4, rv: 0.4, dl: 0.2, hx: 0.04,
    ch: 'F Dm Bb C',
    ld: 'A6:4 C7:4 F7:8 | D7:4 F7:4 A7:8 | Bb6:4 D7:4 F7:4 D7:4 | C7:4 E7:4 G7:8',
    li: 'mbox', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_seats_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Gm Gm Eb D Gm Cm D7 Gm',
    ld: 'G6:2 Bb6:2 D7:2 G7:2 F7:4 D7:4 | Eb7:2 D7:2 C7:2 Bb6:2 G6:8 | Eb7:2 G7:2 Bb7:2 G7:2 Eb7:4 G7:4 | F#7:4 A7:4 D7:8 |' +
        'G7:2 F7:2 D7:2 Bb6:2 G6:4 Bb6:4 | C7:2 Eb7:2 G7:2 Eb7:2 C7:8 | D7:2 F#7:2 A7:2 C8:2 Bb7:4 A7:4 | G7:16',
    li: 'brass', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'reed', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'seats', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: the theatre under the grandstand',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_seats', boss: 'tour_seats_boss', map: null },
  landmark: 'the scaffold under the grandstand', emblem,
  arrival: 'Brady! You went down under the benches. There is a whole theatre under there, darling, run by tin stagehands, and they think WE are the show. Wave. ♥ C',
  coin: { name: 'TICKET STUBS', draw(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2); ctx.fillStyle = '#f4d070'; ctx.fillRect(-7, -5, 14, 10);
    ctx.strokeStyle = '#7a2448'; ctx.lineWidth = 1.4; ctx.strokeRect(-7, -5, 14, 10);
    ctx.setLineDash([1.5, 1.5]); ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(2, 5); ctx.stroke(); ctx.restore();
  } },
  levels: []
});
// for the land's other files and the tests
Tour.seatsKit = { SOLID, say: SeatsSay, COL, INK, SeatsArt, onMark, isSeats, crabArt, shrewArt, henArt, stoatArt, coilArt, RT };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.seatsKit = Tour.seatsKit; if (typeof TourMap !== 'undefined' && !window.BRADY_TOUR.TourMap) window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
})();
