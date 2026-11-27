/* ============================================================
   THE ORCHARD AFTER CLOSING (world 28, cc 'orch'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, A3 of
   docs/design/CHATGPT_RELAY.md). Each evening, once the gate is shut, the fruit trees take their arms off the trellises
   and have a good stretch. Pear-green forks, plum fruit, ivory stakes and rust-red garden ties under a dusk sky.
   Found only through Japan: in 11-3's bamboo grove a little pear orchard stands beside the path; its last tree has one
   pear hanging from a rust-red garden tie instead of a stalk. Walk behind that tree and jump into the underside of its
   lowest fork (29_tour_y_orch_e_entry.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Pear Fly, Tie Worm,
   Pip Finch, Bark Snail), the land's words on pills, THROW on a prop, the route-map emblem, the map's sprites and
   painters, the music, the country.
   The trellis (28-1's climbing): 29_tour_y_orch_a_trellis.js. The other stages' growing things: 29_tour_y_orch_b_mech.js.
   The boss: 29_tour_y_orch_c_boss.js. The secret rooms: 29_tour_y_orch_d_rooms.js. The entrance in Japan:
   29_tour_y_orch_e_entry.js. The levels and the land's map: 29_tour_y_orch_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'orch', world: 28, name: 'The Orchard After Closing', sub: 'a hidden land', lon: 146, lat: 44, secret: true, bonus: true, d0: 0.8, pin: 'pear' });
const COL = { a: '#b8c84a', b: '#7a2e4a', c: '#f4ecd4' };
const INK = '#1e1624';
const PEAR = '#b8c84a', PEAR_D = '#8a9a2a', PEAR_L = '#dce88a', PLUM = '#7a2e4a', PLUM_D = '#561a32', PLUM_L = '#a84a6a';
const IVORY = '#f4ecd4', IVORY_D = '#d8ccaa', RUST = '#c0462a', RUST_D = '#8a2e1a', BARK = '#6a4a32', BARK_D = '#4a3020', LEAF = '#5a8a3a', LEAF_D = '#3e6a2a';
const isOrch = g => !!(g && g.level && g.level.country === 'orch');

/* ---------------- shared drawings ---------------- */
const OrchArt = {
  INK, PEAR, PEAR_D, PEAR_L, PLUM, PLUM_D, PLUM_L, IVORY, IVORY_D, RUST, RUST_D, BARK, BARK_D, LEAF, LEAF_D,
  // a pear, its bottom at (x, y); s = scale (1: 26 px tall); col; stalk: false for none
  pear(ctx, x, y, s, col, stalk, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = col || PEAR;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-13, 0, -13, -14, -6, -17); ctx.bezierCurveTo(-4, -22, -3, -26, 0, -26); ctx.bezierCurveTo(3, -26, 4, -22, 6, -17); ctx.bezierCurveTo(13, -14, 13, 0, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-4, -11, 2.4, 4.5, 0.3, 0, TAU); ctx.fill();
    if (stalk !== false) { ctx.strokeStyle = BARK_D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -25); ctx.quadraticCurveTo(1, -30, 3, -32); ctx.stroke(); }
    ctx.restore();
  },
  // a pear leaf at (x, y) pointing angle a
  leaf(ctx, x, y, s, a, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0); ctx.scale(s || 1, s || 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.fillStyle = col || LEAF;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -6, 14, 0); ctx.quadraticCurveTo(6, 6, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.restore();
  },
  // a rust-red garden tie: a wrap with a little bow and two tails
  tie(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.fillStyle = col || RUST;
    ctx.fillRect(-5, -3, 10, 6); ctx.strokeRect(-5, -3, 10, 6);
    ctx.beginPath(); ctx.ellipse(-5, -4, 4, 2.6, 0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(5, -4, 4, 2.6, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(-4, 11); ctx.lineTo(-1, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, 2); ctx.lineTo(5, 10); ctx.lineTo(2, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // an ivory stake from (x, y) up h px
  stake(ctx, x, y, h, w) {
    w = w || 8; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = IVORY;
    ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = IVORY_D; ctx.fillRect(x + w / 2 - 2.5, y - h + 1, 2, h - 2);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x, y - h - 5); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fillStyle = IVORY; ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a thick bark branch from (x0, y0) to (x1, y1) with a slight bend
  branch(ctx, x0, y0, x1, y1, w, bend, col) {
    ctx.save(); ctx.lineCap = 'round';
    const mx = (x0 + x1) / 2 + (bend || 0) * (y1 - y0) * 0.2, my = (y0 + y1) / 2 - (bend || 0) * 14;
    ctx.strokeStyle = INK; ctx.lineWidth = (w || 8) + 3.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    ctx.strokeStyle = col || PEAR_D; ctx.lineWidth = w || 8; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(1, (w || 8) * 0.25); ctx.beginPath(); ctx.moveTo(x0, y0 - (w || 8) * 0.2); ctx.quadraticCurveTo(mx, my - (w || 8) * 0.2, x1, y1 - (w || 8) * 0.2); ctx.stroke();
    ctx.restore();
  },
  // the land's tell: a pear with one bite out of it, a little Pear Fly hovering backwards to admire the hole
  bitten(ctx, x, y, t, shy) {
    ctx.save(); ctx.translate(x, y);
    OrchArt.pear(ctx, 0, 0, 0.95, PEAR, true, 0.12);
    // the bite: a scalloped cream hole on the right shoulder
    ctx.fillStyle = '#fff6dc'; ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(8, -12, 5.5, Math.PI * 0.55, Math.PI * 1.55); for (let k = 0; k < 3; k++) ctx.arc(10.5, -16 + k * 4, 2.2, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BARK_D; ctx.beginPath(); ctx.ellipse(7, -12, 0.9, 1.6, 0, 0, TAU); ctx.fill();
    if (!shy) { const bx = 20 + Math.sin(t * 1.6) * 3, by = -26 + Math.sin(t * 3.1) * 2; OrchArt.flyTiny(ctx, bx, by, t, -1); }
    ctx.restore();
  },
  flyTiny(ctx, x, y, t, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
    const f = Math.sin(t * 40) * 0.5 + 0.5; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-2, -4 - f * 2, 4, 2.4, -0.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PLUM; ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2.4, -1, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.8, -1, 0.8, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a prompt on a dark rounded pill (never bare text over the sky or a character)
  pill(ctx, x, y, text, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = 17; ctx.fillStyle = 'rgba(20,14,30,0.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = col || '#ffd84a'; ctx.fillText(text, x, y + 1); ctx.restore();
  },
  // a mark Brady must stand on: a pulsing gold ring on the ground (bigger and brighter when `hot`)
  ring(ctx, x, y, t, hot, r) {
    const k = 0.5 + 0.5 * Math.sin(t * 5), R = (r || 18) * (hot ? 1.15 : 1) + k * 4;
    ctx.save(); ctx.strokeStyle = hot ? `rgba(255,220,90,${0.65 + 0.35 * k})` : `rgba(255,230,150,${0.4 + 0.3 * k})`; ctx.lineWidth = hot ? 3.5 : 2.5;
    ctx.beginPath(); ctx.ellipse(x, y - 2, R, R * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore();
  },
  // the little sign that a prop is listening: THROW (or another word) on a pill with a pointer under it
  cue(ctx, x, y, t, txt) {
    const k = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.save(); ctx.globalAlpha = 0.78 + 0.22 * k; OrchArt.pill(ctx, x, y - 14, txt || 'THROW', '#ffd84a');
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x, y + 1 + k * 2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
};

/* ---------------- the land's floating words: always on a dark rounded pill, clear of the HUD and the thumbs ---------------- */
// OrchSay(g, x, y, text, col, who): a short line that rises and fades (a line with a `who` replaces that speaker's
// last line: the boss says one thing at a time)
function OrchSay(g, x, y, text, col, who) {
  if (!g) return; const L = g.__orchSay || (g.__orchSay = []);
  if (L.some(q => q.text === text && q.t < 0.4 && Math.abs(q.x - x) < 80)) return;
  if (who) for (let i = L.length - 1; i >= 0; i--) if (L[i].who === who) L.splice(i, 1);
  L.push({ x, y, text: String(text), col: col || '#ffffff', t: 0, who, life: who === 'boss' ? 2.2 : 1.4 }); if (L.length > 3) L.shift();
}
TourHooks.on('areaLoaded', play => { play.__orchSay = []; });
TourHooks.on('playUpdate', (play, dt) => { const L = play.__orchSay; if (!L || !L.length) return; for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].life) L.splice(i, 1); } });
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.__orchSay; if (!L || !L.length) return;
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
  const top = play.camY + 74 * k, bot = play.camY + Game.viewH - 150 * k, x0 = play.camX + 150 * k, x1 = play.camX + Game.viewW - 150 * k;
  ctx.save(); ctx.font = `${Math.round(12 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    const w = ctx.measureText(q.text).width + 18 * k, h = 22 * k;
    // a boss line sits in a fixed spot under the boss bar; the others rise from where they were said
    let x = q.who === 'boss' ? play.camX + Game.viewW / 2 : clamp(q.x, Math.min(x0 + w / 2, play.camX + Game.viewW / 2), Math.max(x1 - w / 2, play.camX + Game.viewW / 2)), y = q.who === 'boss' ? top + h / 2 + 22 * k : clamp(q.y - q.t * 22, top + h / 2, Math.max(top + h / 2, bot - h / 2));
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
// Each frame in an orchard level: the first entity with orchProp whose orchTouch(p) is true gets the button
// (orchInput) and the engine's own THROW (the power picker) does not fire. Holding the button still runs.
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (isOrch(g) && inp && this.state === 'play' && !this.dead) {
      let prop = null;
      for (const e of g.entities) if (e.orchProp && !e.remove && e.orchTouch(this)) { prop = e; break; }
      this.orchProp = prop;
      if (prop) { prop.orchInput(this, inp, dt); if (inp.actionPressed) inp = Object.assign({}, inp, { actionPressed: false }); }
    } else this.orchProp = null;
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined' && TourPicker.visible) { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.orchProp) return false; return vis0.call(this, play); }; }
}
// Brady's feet on floor row ty, his centre within `wide` tiles of column tx
const onMark = (p, tx, ty, wide) => p && !p.dead && p.onGround && p.groundTy === ty && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.75);

/* ---------------- tiles ---------------- */
// grassy orchard soil: a scalloped grass cap, rust-red earth with pale roots
const soilGround = {
  style: 'orchSoil', cap: '#9ab83a', capHi: '#c8dc6a', dirt: '#8a3a2a', dirt2: '#742e20', rock: '#5a2418',
  paint(ctx, rng) {
    ctx.fillStyle = '#8a3a2a'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(240,228,196,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const x = 4 + rng() * 24; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + (rng() - 0.5) * 16, 14, x + (rng() - 0.5) * 20, 30); ctx.stroke();
    if (rng() < 0.5) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, 12); ctx.lineTo(x + 10 * (rng() < 0.5 ? -1 : 1), 20); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#9ab83a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#9ab83a'; for (let x = x0; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x + 4, 8, 4.5, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#c8dc6a'; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = x0; x < x1; x += 8) ctx.arc(x + 4, 8, 4.5, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = '#6a9a2a'; for (let x = x0 + 5; x < x1; x += 22) { ctx.beginPath(); ctx.moveTo(x, 1); ctx.lineTo(x + 2, -5); ctx.lineTo(x + 4, 1); ctx.fill(); }
  }
};
// a tied, forked branch lying flat (the one-way ledges)
const branchSemi = {
  style: 'orchBranch', c1: PEAR_D, c2: '#6a7a1a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#6a7a1a'; rr(ctx, x0, 1, x1 - x0, 9, 4); ctx.fill();
    ctx.fillStyle = '#9aac34'; rr(ctx, x0, 0, x1 - x0, 6, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0 + 2, 1, x1 - x0 - 4, 1.2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; rr(ctx, x0, 0, x1 - x0, 10, 4); ctx.stroke();
    // a rust tie every so often
    for (let x = x0 + 16; x < x1 - 6; x += 64) { ctx.fillStyle = RUST; ctx.fillRect(x - 3, -1, 6, 12); ctx.strokeRect(x - 3, -1, 6, 12); }
  }
};
// slatted fruit punnets (bricks: they break)
const punnetBrick = {
  style: 'orchPunnet', c1: IVORY, c2: IVORY_D, mortar: '#8a7a5a',
  paint(ctx) {
    ctx.fillStyle = IVORY; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = IVORY_D; for (let x = 4; x < TS; x += 9) ctx.fillRect(x, 2, 2, TS - 4);
    ctx.fillStyle = PLUM; ctx.beginPath(); ctx.arc(TS / 2, 9, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the old orchard wall: weathered brick under moss (walls, the high ledges)
const wallHard = {
  c1: '#9a6a52', c2: '#5a3a2a',
  paint(ctx) {
    ctx.fillStyle = '#6a4434'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#9a6a52';
    ctx.fillRect(1, 1, 14, 6); ctx.fillRect(17, 1, 14, 6); ctx.fillRect(-7, 9, 14, 6); ctx.fillRect(9, 9, 14, 6); ctx.fillRect(25, 9, 14, 6);
    ctx.fillRect(1, 17, 14, 6); ctx.fillRect(17, 17, 14, 6); ctx.fillRect(-7, 25, 14, 6); ctx.fillRect(9, 25, 14, 6); ctx.fillRect(25, 25, 14, 6);
    ctx.fillStyle = 'rgba(140,180,80,0.35)'; ctx.fillRect(1, 1, 10, 2); ctx.fillRect(19, 17, 8, 2);
  }
};
const orchard = { ground: soilGround, semi: branchSemi, brick: punnetBrick, hard: wallHard, pillar: { c1: IVORY, c2: IVORY_D, cap: RUST, style: 'column' }, accent: RUST, tint: {}, bloom: 0.14, liquid: null };

// each secret room its own floor and walls
const roomTiles = (cap, capHi, body, body2, pat, hard1, hard2) => {
  const ground = { style: 'orchRoom', cap, capHi, dirt: body, dirt2: body2, rock: body2,
    paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = body2;
      if (pat === 'tile') { ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); }
      else if (pat === 'plank') { ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect((rng() * 20) | 0, 0, 2, 10); }
      else if (pat === 'check') { ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); }
      else if (pat === 'gravel') { for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 1.5 + rng() * 2, 0, TAU); ctx.fill(); } }
      else if (pat === 'straw') { ctx.strokeStyle = body2; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const y = rng() * TS; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TS, y + (rng() - 0.5) * 8); ctx.stroke(); } }
      else if (pat === 'herring') { for (let y = 0; y < TS; y += 8) for (let x = (y / 8) % 2 * 8; x < TS; x += 16) ctx.fillRect(x, y, 8, 3); } },
    paintCap(ctx, x0, x1) { ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 3); ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); } };
  const hard = { c1: hard1, c2: hard2, paint(ctx) { ctx.fillStyle = hard2; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = hard1; ctx.fillRect(2, 2, TS - 4, TS - 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); } };
  return Object.assign({}, orchard, { ground, hard });
};
const RT = {
  shed: roomTiles('#5a8a3a', '#8ab85a', '#7a5a3a', '#5a3e26', 'plank', '#8a6a4a', '#4a3424'),         // B11 the potting shed
  pantry: roomTiles('#e8dcc0', '#fff6e0', '#c8b898', '#a8987a', 'tile', '#f0e4c8', '#a89878'),          // B12 the preserving pantry
  loft: roomTiles('#c8a050', '#f0d080', '#a8823a', '#7a5a22', 'straw', '#b8904a', '#6a4a1a'),            // B13 the hay loft
  parlour: roomTiles('#a84a6a', '#d87a9a', '#f4e4ec', '#e0c4d0', 'check', '#c87a9a', '#7a2e4a'),         // B14 the sorbet parlour
  office: roomTiles('#4a5a7a', '#6a7aa0', '#3a4660', '#2a3448', 'herring', '#5a6a8a', '#2a3448'),        // B15 the label office
  cellar: roomTiles('#8a6a5a', '#b08a7a', '#5a4038', '#3e2a24', 'gravel', '#6a5048', '#3a2820')          // the pip cellar
};

/* ---------------- painted backdrops ---------------- */
// a row of espaliered fruit trees (flat arms along wires), pears and plums on them
function espalierRow(ctx, rng, y, x0, x1, scale, col, fruit) {
  for (let x = x0; x < x1; x += 150 * scale) {
    const h = (90 + rng() * 30) * scale;
    ctx.fillStyle = col; ctx.fillRect(x - 4 * scale, y - h, 8 * scale, h);
    for (let k = 1; k <= 3; k++) { const yy = y - h * k / 3.4; ctx.fillRect(x - 60 * scale, yy - 3 * scale, 120 * scale, 6 * scale); }
    if (fruit) for (let k = 0; k < 6; k++) { ctx.fillStyle = fruit[k % fruit.length]; ctx.beginPath(); ctx.ellipse(x + (rng() - 0.5) * 100 * scale, y - h * (0.3 + rng() * 0.6), 5 * scale, 7 * scale, 0, 0, TAU); ctx.fill(); }
  }
}
// a round-headed orchard tree silhouette
function treeBlob(ctx, x, y, s, col, trunk) {
  ctx.fillStyle = trunk || col; ctx.fillRect(x - 5 * s, y - 40 * s, 10 * s, 40 * s);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 58 * s, 30 * s, 0, TAU); ctx.arc(x - 24 * s, y - 46 * s, 20 * s, 0, TAU); ctx.arc(x + 24 * s, y - 46 * s, 20 * s, 0, TAU); ctx.fill();
}
const painters = {
  // far hills under the dusk: soft rows of round trees on a hill line, a glow at the horizon
  orchFarTrees(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    for (let x = 0; x <= BG_W; x += 60) ctx.lineTo(x, b - 20 - Math.sin(x * 0.006) * 26 - Math.sin(x * 0.017) * 8);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let x = 20; x < BG_W; x += 44 + rng() * 20) treeBlob(ctx, x, b - 16 - Math.sin(x * 0.006) * 26, 0.5 + rng() * 0.15, L.color);
  },
  // near: espalier rows on wires between ivory posts, a grassy bank
  orchEspaliers(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    espalierRow(ctx, rng, b, 60, BG_W, 0.9, '#5a4a5a', ['#8a6a7a', '#9a9a5a']);
    ctx.fillStyle = '#d8ccc0'; for (let x = 0; x < BG_W; x += 135) ctx.fillRect(x - 3, b - 120, 6, 120);
    ctx.strokeStyle = 'rgba(220,210,200,0.5)'; ctx.lineWidth = 1.5; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(0, b - 120 * k / 3.4); ctx.lineTo(BG_W, b - 120 * k / 3.4); ctx.stroke(); }
  },
  // 28-2: a meadow of tall flowers and beehives (skeps) on stands, the sun low
  orchMeadow(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 0; x < BG_W; x += 14 + rng() * 10) { const h = 30 + rng() * 60; ctx.strokeStyle = '#6a8a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x + 3, b - h); ctx.stroke(); ctx.fillStyle = ['#e8e0a0', '#ffffff', '#f4c870', '#d8d8b0'][(rng() * 4) | 0]; ctx.beginPath(); ctx.arc(x + 3, b - h, 4 + rng() * 3, 0, TAU); ctx.fill(); }
    for (let x = 120; x < BG_W; x += 380) { ctx.fillStyle = '#7a6a4a'; ctx.fillRect(x - 3, b - 40, 6, 40); ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(x - 24, b - 40); ctx.quadraticCurveTo(x - 26, b - 92, x, b - 96); ctx.quadraticCurveTo(x + 26, b - 92, x + 24, b - 40); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#9a7a30'; ctx.lineWidth = 2; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 24, b - 40 - k * 11); ctx.lineTo(x + 24, b - 40 - k * 11); ctx.stroke(); } }
  },
  // 28-3: the pruning yard: big old cut trees, stubs, cut branches in heaps
  orchPruned(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color;
    for (let x = 40; x < BG_W; x += 160 + rng() * 60) {
      ctx.fillRect(x - 10, b - 150, 20, 150);
      for (const [dx, dy, a] of [[-10, -120, -0.8], [10, -100, 0.7], [-10, -80, -0.6], [10, -140, 0.5]]) { ctx.save(); ctx.translate(x + dx, b + dy); ctx.rotate(a); ctx.fillRect(0, -4, 50, 8); ctx.restore(); }
    }
    ctx.fillRect(0, b, BG_W, H - b);
  },
  // 28-4: the packing shed's side: paper-sleeved pears hanging in long rows, crates
  orchSleeves(ctx, L, rng, H) {
    // (no paper sleeves back here: they would read as the real ones) beams, shelves of crates, a ladder, lamps
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = '#5a4040'; for (let y = 50; y < b - 40; y += 90) ctx.fillRect(0, y, BG_W, 10);
    for (let x = 0; x < BG_W; x += 240) { ctx.fillRect(x + 10, 50, 12, b - 50); }
    for (let y = 60; y < b - 40; y += 90) for (let x = 40; x < BG_W; x += 70) { ctx.fillStyle = '#8a6a5a'; ctx.fillRect(x, y - 34, 50, 34); ctx.fillStyle = '#9a7a6a'; for (let k = 0; k < 3; k++) ctx.fillRect(x, y - 30 + k * 11, 50, 4); }
    for (let x = 120; x < BG_W; x += 300) { ctx.strokeStyle = '#4a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 40); ctx.stroke(); ctx.fillStyle = 'rgba(255,220,150,0.55)'; ctx.beginPath(); ctx.arc(x, 46, 9, 0, TAU); ctx.fill(); }
  },
  // 28-5: the grafting nursery: rows of young trees on stakes, each with a waxed bandage
  orchNursery(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 20; x < BG_W; x += 46) { ctx.fillStyle = '#d8ccc0'; ctx.fillRect(x - 2, b - 80, 4, 80); ctx.fillStyle = L.color; ctx.fillRect(x + 4, b - 70, 5, 70); ctx.fillStyle = '#c86a4a'; ctx.fillRect(x + 2, b - 50, 9, 6); ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(x + 6, b - 78, 14, 0, TAU); ctx.fill(); }
  },
  // 28-6: the night orchard: an arch of tree canopies against a deep sky, lanterns of fireflies, the voting baskets
  orchNight(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color;
    for (let x = 0; x < BG_W + 200; x += 210) treeBlob(ctx, x, b, 2.4, L.color, L.color);
    ctx.fillRect(0, b, BG_W, H - b);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(255,240,150,${0.3 + rng() * 0.5})`; ctx.beginPath(); ctx.arc(rng() * BG_W, b - 40 - rng() * 220, 1.5 + rng() * 1.5, 0, TAU); ctx.fill(); }
  },
  // the rooms: each its own back wall
  roomShed(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#6a4a32'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#7a5a3e'; for (let x = 0; x < BG_W; x += 36) ctx.fillRect(x, 0, 30, H); for (let x = 60; x < BG_W; x += 220) { ctx.fillStyle = '#c86a3a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 40, b - 150); ctx.lineTo(x + 30 + k * 40, b - 150); ctx.lineTo(x + 26 + k * 40, b - 120); ctx.lineTo(x + 4 + k * 40, b - 120); ctx.fill(); } ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 10, b - 118, 140, 6); } },
  roomPantry(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#f4ead4'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#e4d8bc'; for (let x = 0; x < BG_W; x += 24) for (let y = 0; y < H; y += 24) if ((x + y) % 48 === 0) ctx.fillRect(x, y, 24, 24); for (let x = 40; x < BG_W; x += 180) { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x, b - 170, 150, 6); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(220,240,255,0.8)'; ctx.fillRect(x + 8 + k * 36, b - 204, 24, 34); ctx.fillStyle = ['#c8d84a', '#a84a6a', '#e8a83a', '#c8d84a'][k]; ctx.fillRect(x + 10 + k * 36, b - 190, 20, 18); } } },
  roomLoft(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#5a3e26'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 10; for (let x = 0; x < BG_W; x += 200) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 100, b - 200); ctx.lineTo(x + 200, 0); ctx.stroke(); } ctx.fillStyle = '#c8a050'; for (let x = 0; x < BG_W; x += 90) { ctx.beginPath(); ctx.moveTo(x, b); ctx.quadraticCurveTo(x + 45, b - 70 - rng() * 30, x + 90, b); ctx.fill(); } ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(BG_W * 0.5, b - 230, 26, 0, TAU); ctx.fill(); },
  roomParlour(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#f8e4ec'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#f0ccd8'; for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, 0, 20, H); ctx.fillStyle = '#7a2e4a'; ctx.fillRect(0, b - 60, BG_W, 60); ctx.fillStyle = '#a84a6a'; for (let x = 0; x < BG_W; x += 30) { ctx.beginPath(); ctx.arc(x + 15, b - 60, 15, Math.PI, 0); ctx.fill(); } },
  roomOffice(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#2e3a52'; ctx.fillRect(0, 0, BG_W, H); for (let x = 20; x < BG_W; x += 60) for (let y = 20; y < b - 80; y += 46) { ctx.fillStyle = '#3e4c68'; ctx.fillRect(x, y, 50, 38); ctx.fillStyle = '#f4ecd4'; ctx.fillRect(x + 14, y + 10, 22, 14); ctx.fillStyle = '#c0462a'; ctx.fillRect(x + 23, y + 6, 4, 4); } },
  roomCellar(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#3a2a24'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#4a3630'; for (let x = 0; x < BG_W; x += 40) for (let y = (x / 40 % 2) * 20; y < H; y += 40) { ctx.beginPath(); ctx.ellipse(x + 20, y + 20, 18, 14, 0, 0, TAU); ctx.fill(); } for (let x = 80; x < BG_W; x += 260) { ctx.fillStyle = '#6a4a32'; ctx.beginPath(); ctx.ellipse(x, b - 60, 50, 60, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 4; for (const dy of [-90, -40]) { ctx.beginPath(); ctx.moveTo(x - 46, b + dy); ctx.lineTo(x + 46, b + dy); ctx.stroke(); } } }
};

// the dusk sky over the orchard
const SKY = ['#3e3a6a', '#a86a8a', '#f4b87a'];
const base = (o, ...mix) => Object.assign({}, ...mix, o);
const room = (name, sky, layer) => base({ name, music: 'tour_orch_room', particles: 'none', rays: null, sky: [sky, sky, sky], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: layer, base: 400, f: 0.05 }], fog: sky, decor: [] }, RT[{ roomShed: 'shed', roomPantry: 'pantry', roomLoft: 'loft', roomParlour: 'parlour', roomOffice: 'office', roomCellar: 'cellar' }[layer]]);
const themes = {
  orch_trellis: base({ name: 'Elbows on the Trellis', music: 'tour_orch', particles: 'leaves', rays: '#ffe0b0', sky: SKY, horizonGlow: '#ffd8a0', celestial: { type: 'sun', x: 0.8, y: 0.62, r: 30, color: '#ffe0a0', glow: '#ffb070' }, stars: 0.2,
    layers: [{ kind: 'orchFarTrees', color: '#6a5a7a', base: 330, f: 0.08 }, { kind: 'orchEspaliers', color: '#4a5a4a', base: 420, f: 0.2 }], fog: '#c8909a', decor: ['orchCrate', 'orchFallen'] }, orchard),
  orch_bees: base({ name: 'Appointment with a Bee', music: 'tour_orch_bee', particles: 'leaves', rays: '#fff0c0', sky: ['#6a7ab0', '#e0a8a0', '#ffe0a0'], horizonGlow: '#fff0c0', celestial: { type: 'sun', x: 0.25, y: 0.5, r: 30, color: '#fff0b0', glow: '#ffd080' }, stars: 0,
    layers: [{ kind: 'orchFarTrees', color: '#8a8aa0', base: 320, f: 0.06 }, { kind: 'orchMeadow', color: '#6a8a5a', base: 420, f: 0.2 }], fog: '#f0c8b0', decor: ['orchCrate'] }, orchard),
  orch_prune: base({ name: 'Cut Above', music: 'tour_orch', particles: 'leaves', rays: null, sky: ['#4a4a7a', '#9a7aa0', '#e8b890'], horizonGlow: '#ffd8b0', celestial: { type: 'none' }, stars: 0.3,
    layers: [{ kind: 'orchFarTrees', color: '#5a5070', base: 330, f: 0.07 }, { kind: 'orchPruned', color: '#4a4050', base: 420, f: 0.18 }], fog: '#a88a9a', decor: ['orchFallen', 'orchCrate'] }, orchard),
  orch_sleeve: base({ name: 'A Pear in a Sleeve', music: 'tour_orch_bee', particles: 'none', rays: null, sky: ['#5a3a5a', '#b86a6a', '#f4a86a'], horizonGlow: '#ffd090', celestial: { type: 'sun', x: 0.5, y: 0.75, r: 40, color: '#ffc880', glow: '#ff9a60' }, stars: 0.2,
    layers: [{ kind: 'orchFarTrees', color: '#6a4a5a', base: 340, f: 0.06 }, { kind: 'orchSleeves', color: '#7a5a5a', base: 430, f: 0.16 }], fog: '#c88a7a', decor: ['orchCrate'] }, orchard),
  orch_graft: base({ name: 'The Graft Takes', music: 'tour_orch', particles: 'leaves', rays: null, sky: ['#2e3a5a', '#7a6a9a', '#d8a8a0'], horizonGlow: '#f0c8c0', celestial: { type: 'moon', x: 0.2, y: 0.18, r: 18, color: '#fff8e0', glow: '#e0e0ff' }, stars: 0.5,
    layers: [{ kind: 'orchFarTrees', color: '#4a4a6a', base: 330, f: 0.07 }, { kind: 'orchNursery', color: '#3e4a4a', base: 420, f: 0.2 }], fog: '#8a7a9a', decor: ['orchFallen'] }, orchard),
  orch_night: base({ name: 'Windfall Committee', music: 'tour_orch_boss', particles: 'none', rays: null, sky: ['#141a3a', '#2e2a5a', '#5a3a6a'], horizonGlow: '#a87aa8', celestial: { type: 'moon', x: 0.78, y: 0.16, r: 22, color: '#fff8e0', glow: '#d8d0ff' }, stars: 0.8,
    layers: [{ kind: 'orchFarTrees', color: '#2a2a48', base: 330, f: 0.06 }, { kind: 'orchNight', color: '#1e2236', base: 420, f: 0.16 }], fog: '#3a2e5a', decor: ['orchCrate'] }, orchard),
  orch_room_shed: room('The Potting Shed', '#6a4a32', 'roomShed'),
  orch_room_pantry: room('The Preserving Pantry', '#f4ead4', 'roomPantry'),
  orch_room_loft: room('The Hay Loft', '#5a3e26', 'roomLoft'),
  orch_room_parlour: room('The Sorbet Parlour', '#f8e4ec', 'roomParlour'),
  orch_room_office: room('The Label Office', '#2e3a52', 'roomOffice'),
  orch_room_cellar: room('The Pip Cellar', '#3a2a24', 'roomCellar')
};

/* ---------------- props (Decor: drawn each frame) ---------------- */
const decor = {
  // a slatted fruit punnet crate with plums
  orchCrate(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? PLUM_L : PLUM; ctx.beginPath(); ctx.arc(x - 10 + k * 10, y - 20, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = IVORY; ctx.fillRect(x - 18, y - 18, 36, 18); ctx.strokeRect(x - 18, y - 18, 36, 18);
    ctx.fillStyle = IVORY_D; for (let k = -12; k <= 12; k += 8) ctx.fillRect(x + k, y - 16, 2, 14);
    ctx.restore();
  },
  // a windfall pear on the grass, whole (the bitten one is the tell: orchBite)
  orchFallen(ctx, x, y, t, th, d) { OrchArt.pear(ctx, x + 6, y, 0.7, (d || 0) % 2 ? PEAR : '#c8b84a', true, 1.4); OrchArt.leaf(ctx, x - 8, y - 3, 0.8, -0.2); },
  // a sign card tied to a stake (the land's tips)
  orchTip(ctx, x, y) { OrchArt.stake(ctx, x, y, 30, 7); OrchArt.tie(ctx, x, y - 22, 0.8); }
};

/* ---------------- door looks: a shed door, a trapdoor in the turf ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'orchShed' || look === 'orchHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'orchShed') {
        ctx.fillStyle = '#7a5a3e'; rr(ctx, x - 22, y - 62, 44, 62, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#2a1a14' : '#9a7a54'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 17 + k * 9, y - 56, 6, 52);
        ctx.strokeStyle = RUST; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 18, y - 50); ctx.lineTo(x + 18, y - 12); ctx.stroke();
        OrchArt.tie(ctx, x + 14, y - 32, 0.9);
      } else {
        ctx.fillStyle = '#6a4a32'; rr(ctx, x - 20, y - 48, 40, 48, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#120e10' : '#2a1a14'; rr(ctx, x - 14, y - 40, 28, 34, 6); ctx.fill();
        OrchArt.pear(ctx, x, y - 42, 0.6, PEAR, true);
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// PEAR FLY: a plum fly with cream wings. It takes a bite (it stops: the tell), then flies backwards to admire the hole
const flyArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y + 9); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = Math.sin(t * (m === 'swoop' ? 46 : 30)) * 0.5 + 0.5, bite = m === 'notice';
  ctx.fillStyle = 'rgba(250,246,230,0.92)';
  ctx.beginPath(); ctx.ellipse(-6, -18 - f * 4, 9, 5, -0.7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-1, -19 - f * 3, 8, 4.5, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PLUM; ctx.beginPath(); ctx.ellipse(-2, -9, 10, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = PLUM_D; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-8 + k * 4, -15); ctx.lineTo(-8 + k * 4, -3); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = PLUM_L; ctx.beginPath(); ctx.arc(7, -11, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(9, -14, 3.6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10, -14, 1.7, 0, TAU); ctx.fill();
  ctx.lineWidth = 1.2; ctx.beginPath(); for (const lx of [-8, -3, 2]) { ctx.moveTo(lx, -2); ctx.lineTo(lx - 2, 4); } ctx.stroke();
  if (bite) { ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(13, -8, 3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
// TIE WORM: a rust worm with a cream bow. It stops to tighten a garden tie and gets stuck in its own bow
const wormArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const stuck = m === 'stun' || m === 'notice', w = Math.sin(t * 9) * 3;
  ctx.lineCap = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-8, -12 - w, -2, -5); ctx.quadraticCurveTo(4, 1 + w, 10, -8); };
  ctx.strokeStyle = INK; ctx.lineWidth = 11; path(); ctx.stroke(); ctx.strokeStyle = '#c85a3a'; ctx.lineWidth = 8; path(); ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.fillStyle = '#d86a4a'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(11, -10, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12, -14, 3, 0, TAU); ctx.arc(16, -13, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(13, -14, 1.3, 0, TAU); ctx.arc(16.6, -13, 1.1, 0, TAU); ctx.fill();
  // the bow: neat on its tail when walking; a big loop round the whole worm when stuck
  ctx.fillStyle = IVORY; ctx.strokeStyle = INK;
  if (stuck) { ctx.lineWidth = 2.6; ctx.strokeStyle = IVORY; ctx.beginPath(); ctx.ellipse(-2, -8, 15, 6, 0.2, 0, TAU); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); OrchArt.tie(ctx, -2, -14, 0.9, IVORY); }
  else OrchArt.tie(ctx, -14, -6, 0.7, IVORY);
  ctx.restore();
};
// PIP FINCH: a pear-green finch. It puffs its cheeks (the tell) and spits a pip
const finchArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const puff = m === 'notice', spit = m === 'throw';
  ctx.strokeStyle = BARK_D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-5, 0); ctx.moveTo(3, -6); ctx.lineTo(4, 0); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = PEAR_D; ctx.beginPath(); ctx.moveTo(-10, -16); ctx.lineTo(-20, -20); ctx.lineTo(-18, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PEAR; ctx.beginPath(); ctx.ellipse(0, -14, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(3, -10, 6, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = PEAR_D; ctx.beginPath(); ctx.ellipse(-3, -14, 6, 4, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PEAR; ctx.beginPath(); ctx.arc(7, -23, puff ? 8 : 7, 0, TAU); ctx.fill(); ctx.stroke();
  if (puff) { ctx.fillStyle = '#ffb0a0'; ctx.beginPath(); ctx.arc(10, -20, 3.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8, -26, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(9, -26, 1.3, 0, TAU); ctx.fill();
  ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(13, -25); ctx.lineTo(spit ? 22 : 20, spit ? -27 : -22); ctx.lineTo(13, -19); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (spit) { ctx.beginPath(); ctx.moveTo(13, -19); ctx.lineTo(20, -15); ctx.lineTo(13, -17); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
// BARK SNAIL: a plum snail under a bark-spiral shell. It waits for a branch to move under it and claims the distance
const snailArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const proud = m === 'notice', s = Math.sin(t * 3) * 1.5;
  ctx.fillStyle = PLUM_L; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-16, -6, -6, -6); ctx.lineTo(10, -6); ctx.quadraticCurveTo(14, -8, 14, -16 - (proud ? 6 : 0)); ctx.lineTo(18, -16 - (proud ? 6 : 0)); ctx.quadraticCurveTo(20, -4, 16, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, -16 - (proud ? 6 : 0)); ctx.lineTo(13 + s, -26 - (proud ? 6 : 0)); ctx.moveTo(17, -16 - (proud ? 6 : 0)); ctx.lineTo(20 + s, -25 - (proud ? 6 : 0)); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const [ex, ey] of [[13 + s, -27], [20 + s, -26]]) { ctx.beginPath(); ctx.arc(ex, ey - (proud ? 6 : 0), 3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; for (const [ex, ey] of [[14 + s, -27], [21 + s, -26]]) { ctx.beginPath(); ctx.arc(ex, ey - (proud ? 6 : 0), 1.3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = BARK; ctx.beginPath(); ctx.arc(-2, -15, 12, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = BARK_D; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 28; k++) { const a = k * 0.42, r = 10 - k * 0.33; ctx.lineTo(-2 + Math.cos(a) * r, -15 + Math.sin(a) * r); } ctx.stroke();
  ctx.restore();
};
// a pip (the finch's spit): a little dark teardrop
const pipArt = (c, s) => { c.save(); c.translate(s.x + s.w / 2, s.y + s.h / 2); c.rotate(s.t * 12 || 0); c.fillStyle = '#3a2214'; c.strokeStyle = '#fff6dc'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 4, 6, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); };
const enemies = {
  // the fly: drifts; now and then stops to take a bite (0.8 s, hanging still), then darts BACKWARDS a few tiles
  orchFly: { cls: TourFlyer.make({ w: 26, h: 22, range: 3, speed: 0.8, art: flyArt, burst: PLUM_L,
    think(e, dt) {
      if (e.bite > 0) { e.bite -= dt; e.mode = 'notice'; if (e.bite <= 0) { e.bk = 0.7; if (e.g.onScreen(e)) OrchSay(e.g, e.cx, e.y - 10, 'LOVELY HOLE.', '#ffffff'); } return; }
      if (e.bk > 0) { e.bk -= dt; e.off = (e.off || 0) - e.dir * 3 * TS * dt; } else e.off = approach(e.off || 0, 0, 1.2 * TS * dt);
      e.ph = (e.ph || 0) + dt; const k = e.ph * 0.9;
      if (!(e.bk > 0)) e.dir = Math.cos(k) >= 0 ? 1 : -1;
      e.x = e.hx + Math.sin(k) * e.range + e.off; e.y = e.hy + Math.sin(k * 2) * 10; e.mode = 'fly';
      if (!(e.bk > 0) && Math.floor(e.ph / 3.4) !== Math.floor((e.ph - dt) / 3.4)) { e.bite = 0.8; if (e.g.onScreen(e)) OrchSay(e.g, e.cx, e.y - 10, 'CHOMP', PEAR_L); }
    } }), place: 'fly' },
  // the worm: walks; every few seconds it stops to tighten a tie (0.5 s tell) and is stuck in its bow for 1.6 s
  orchWorm: { cls: TourEnemy.make({ w: 30, h: 18, speed: 0.8, behavior: 'walk', art: wormArt, burst: '#c85a3a',
    init(e) { e.tieT = 2 + Math.random() * 2; e.stk = 0; },
    think(e, dt) {
      if (e.stk > 0) { e.stk -= dt; e.vx = 0; e.mode = e.stk > 1.6 ? 'walk' : 'notice'; if (e.stk <= 0) e.vx = e.dir * e.speed; return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      e.tieT -= dt; if (e.tieT <= 0) { e.tieT = 3.5 + Math.random() * 1.5; e.stk = 2.1; e.vx = 0; if (e.g.onScreen(e)) OrchSay(e.g, e.cx, e.y - 12, 'TIGHTER... OOPS', IVORY); }
    } }), place: 'walk' },
  // the finch: stands; puffs its cheeks for 0.7 s, then spits a pip that flies level and drops
  orchFinch: { cls: TourEnemy.make({ w: 24, h: 30, speed: 0.6, behavior: 'still', art: finchArt, burst: PEAR,
    init(e) { e.cd = 1.5 + Math.random(); e.puff = 0; e.sp = 0; },
    think(e, dt) {
      const p = e.g.player; e.vx = 0;
      if (p) e.dir = sign(p.cx - e.cx) || e.dir;
      if (e.sp > 0) { e.sp -= dt; e.mode = 'throw'; return; }
      if (e.puff > 0) { e.puff -= dt; e.mode = 'notice'; if (e.puff <= 0) { e.sp = 0.35; e.cd = 2.6; if (e.g.onScreen(e, 60)) { TourKit.sfx('ptoo', 'kick', { vol: 0.3, pitch: 1.8 }); tourFire(e.g, e.cx + e.dir * 14, e.y + 6, { vx: e.dir * 4.2 * TS, vy: -1.2 * TS, grav: 0.25 * PHYS.gDown, w: 12, h: 12, life: 2.2, col: '#3a2214', art: pipArt }); } } return; }
      e.mode = 'idle'; e.cd -= dt;
      if (e.cd <= 0 && TourKit.near(e, p, 9, 4)) { e.puff = 0.7; }
    } }), place: 'walk' },
  // the snail: creeps; when it reaches a ledge it stops and waits, eyes up, very pleased with itself
  orchSnail: { cls: TourEnemy.make({ w: 34, h: 28, speed: 0.35, behavior: 'walk', edgeTurn: true, art: snailArt, burst: BARK,
    init(e) { e.waitT = 0; },
    think(e, dt) {
      if (e.waitT > 0) { e.waitT -= dt; e.vx = 0; e.mode = 'notice'; if (e.waitT <= 0) e.vx = e.dir * e.speed; return; }
      if (!e.vx) e.vx = e.dir * e.speed; e.mode = 'walk';
      if (Math.floor(e.t / 4) !== Math.floor((e.t - dt) / 4)) { e.waitT = 1.4; if (e.g.onScreen(e)) OrchSay(e.g, e.cx, e.y - 12, 'I CAME ALL THIS WAY.', IVORY); }
    } }), place: 'walk' }
};
// the snail's bark shell: a stomp only bounces off while it is creeping (stomp it while it waits, eyes up)
{
  const h0 = TourEnemy.prototype.hit;
  enemies.orchSnail.cls.prototype.hit = function (kind, src) {
    if ((kind === 'stomp' || kind === 'spin') && !this.dead && !(this.waitT > 0) && !(this.stunT > 0)) { Sound.play('bump', { vol: 0.35, pitch: 1.3 }); this.waitT = 1.4; return 'bounce'; }
    return h0.call(this, kind, src);
  };
}

/* ---------------- the route map: a pear in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = '#f4b87a'; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  OrchArt.pear(ctx, x, y + r * 0.6, r / 24, PEAR, true, 0.12 * Math.sin(t * 2));
  OrchArt.tie(ctx, x + r * 0.1, y - r * 0.55, r / 28);
  ctx.restore();
};

/* ---------------- the land's map: sprites and the grass ---------------- */
Object.assign(TourOWPaint.art, {
  // a little round pear tree
  orchTree(c, r) {
    c.fillStyle = BARK; c.fillRect(-r * 0.12, -r * 0.9, r * 0.24, r * 0.9); c.strokeRect(-r * 0.12, -r * 0.9, r * 0.24, r * 0.9);
    c.fillStyle = LEAF; c.beginPath(); c.arc(0, -r * 1.15, r * 0.6, 0, TAU); c.arc(-r * 0.45, -r * 0.9, r * 0.4, 0, TAU); c.arc(r * 0.45, -r * 0.9, r * 0.4, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = PEAR; for (const [dx, dy] of [[-0.3, -0.9], [0.25, -1.2], [0.4, -0.8]]) { c.beginPath(); c.ellipse(dx * r, dy * r, r * 0.11, r * 0.15, 0, 0, TAU); c.fill(); c.stroke(); }
  },
  // an espalier panel on two stakes
  orchTrellisSprite(c, r) {
    c.fillStyle = IVORY; c.fillRect(-r, -r, r * 0.12, r); c.strokeRect(-r, -r, r * 0.12, r); c.fillRect(r * 0.88, -r, r * 0.12, r); c.strokeRect(r * 0.88, -r, r * 0.12, r);
    c.strokeStyle = IVORY_D; c.lineWidth = 1.5; for (let k = 1; k <= 2; k++) { c.beginPath(); c.moveTo(-r, -r * k / 3); c.lineTo(r, -r * k / 3); c.stroke(); }
    c.strokeStyle = PEAR_D; c.lineWidth = 3; c.beginPath(); c.moveTo(-r * 0.8, -r * 0.1); c.quadraticCurveTo(0, -r * 0.9, r * 0.8, -r * 0.6); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.4;
  },
  // a beehive (skep) on a post
  orchSkep(c, r) { c.fillStyle = '#7a6a4a'; c.fillRect(-r * 0.08, -r * 0.5, r * 0.16, r * 0.5); c.fillStyle = '#d8a850'; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.5); c.quadraticCurveTo(-r * 0.5, -r * 1.3, 0, -r * 1.35); c.quadraticCurveTo(r * 0.5, -r * 1.3, r * 0.5, -r * 0.5); c.closePath(); c.fill(); c.stroke(); },
  // the voting basket (the boss)
  orchBasketSprite(c, r) { c.fillStyle = '#c8a06a'; c.beginPath(); c.moveTo(-r, -r * 0.6); c.lineTo(r, -r * 0.6); c.lineTo(r * 0.8, 0); c.lineTo(-r * 0.8, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = PEAR; for (const dx of [-0.4, 0, 0.4]) { c.beginPath(); c.ellipse(dx * r, -r * 0.75, r * 0.2, r * 0.26, 0, 0, TAU); c.fill(); c.stroke(); } },
  // the orchard gate (the airstrip): two ivory posts and a tied bar
  orchGateSprite(c, r) { c.fillStyle = IVORY; c.fillRect(-r * 0.8, -r, r * 0.2, r); c.strokeRect(-r * 0.8, -r, r * 0.2, r); c.fillRect(r * 0.6, -r, r * 0.2, r); c.strokeRect(r * 0.6, -r, r * 0.2, r); c.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 0.16); c.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 0.16); c.fillStyle = RUST; c.fillRect(-r * 0.1, -r * 0.76, r * 0.2, r * 0.28); }
});
// a clipped hedge instead of a coast
TourOWLands.coast.orchHedge = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(30,20,40,0.3)'; c.fill(); c.restore();
  c.save(); c.translate(0, 8); OWGeo.path(c, ring, true); c.fillStyle = '#3e6a2a'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#5a8a3a'; c.lineWidth = 14; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the grass under the trails: mown stripes, windfalls, little trees
TourOWScenes.groundPaint.orch = function (c, ow) {
  const R = TourOWPaint.rng('orchground'), ink = TourOWPaint.INK, A = TourOWPaint.art;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 180; x < 1360; x += 60) c.fillRect(x, 160, 30, 560);
  for (let k = 0; k < 14; k++) { const x = 260 + R() * 1000, y = 200 + R() * 480; c.fillStyle = k % 3 ? PEAR : PLUM; c.beginPath(); c.ellipse(x, y, 5, 6, 0.4, 0, TAU); c.fill(); c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); }
  for (let k = 0; k < 7; k++) { c.save(); c.translate(280 + R() * 980, 220 + R() * 460); c.strokeStyle = ink; c.lineWidth = 1.4; A.orchTree.call(TourOWPaint, c, 14 + R() * 6); c.restore(); }
};
TourLandscape.looks.orch = ['#f4b87a', '#a86a8a', '#5a8a3a', IVORY, '#ffffff', RUST, 'orchPear'];
{
  // the land's landmark miniature: a pear on a tie
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'orchPear') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    OrchArt.branch(ctx, -22, -40, 22, -36, 6, 0.2, BARK);
    OrchArt.tie(ctx, 0, -36, 1); OrchArt.pear(ctx, 0, -4, 1.1, PEAR, false);
    ctx.restore();
  };
}

/* ---------------- music: an evening garden swing, a buzzing meadow waltz, a little room tune, the committee's
   pompous march ---------------- */
const tracks = {
  tour_orch: {
    bpm: 112, bars: 8, rv: 0.35, dl: 0.18, sw: 0.14, hx: 0.04,
    ch: 'Fmaj7 Dm7 Gm7 C7 Fmaj7 Am7 Bbmaj7 C7',
    ld: 'A5:4 C6:4 F6:4 E6:4 | D6:8 F6:8 | G6:4 F6:4 D6:4 Bb5:4 | C6:16 | A6:4 G6:4 F6:4 C6:4 | E6:8 A6:8 | D6:4 F6:4 Bb6:4 A6:4 | G6:16',
    li: 'glass', lv: 0.13,
    bp: 'r...f...r.f.r...', bi: 'pluckb', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 62,
    dr: ['k.......k.....k.', '....s.......s...', 'h.h.h.hhh.h.h.h.'], dv: 0.26
  },
  tour_orch_bee: {
    bpm: 138, bpb: 3, bars: 8, rv: 0.3, dl: 0.14, hx: 0.05,
    ch: 'G G D7 D7 G C D7 G',
    ld: 'D6:3 G6:3 B6:3 | A6:6 F#6:3 | C6:3 D6:3 F#6:3 | A6:9 | B6:3 D7:3 B6:3 | C7:3 A6:3 E6:3 | D6:3 F#6:3 A6:3 | G6:9',
    li: 'reed', lv: 0.13,
    bp: 'r..f..', bi: 'pluckb', bv: 0.3,
    ap: '...c.c', ai: 'vibes', av: 0.05, ao: 64,
    dr: ['k.....', '...s.s', 'h.hh.h'], dv: 0.3
  },
  tour_orch_room: {
    bpm: 100, bars: 4, rv: 0.4, dl: 0.2, hx: 0.04,
    ch: 'D Bm G A',
    ld: 'F#6:4 A6:4 D7:8 | B6:4 D7:4 F#7:8 | G6:4 B6:4 D7:4 B6:4 | A6:4 C#7:4 E7:8',
    li: 'mbox', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_orch_boss: {
    bpm: 132, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Cm Cm Ab G Cm Fm G7 Cm',
    ld: 'C6:2 Eb6:2 G6:2 C7:2 Bb6:4 G6:4 | Ab6:2 G6:2 F6:2 Eb6:2 C6:8 | Ab6:2 C7:2 Eb7:2 C7:2 Ab6:4 C7:4 | B6:4 D7:4 G7:8 |' +
        'C7:2 Bb6:2 G6:2 Eb6:2 C6:4 Eb6:4 | F6:2 Ab6:2 C7:2 Ab6:2 F6:8 | G6:2 B6:2 D7:2 F7:2 Eb7:4 D7:4 | C7:16',
    li: 'brass', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'reed', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'orch', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: what the fruit trees do once the gate is shut',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_orch', boss: 'tour_orch_boss', map: null },
  landmark: 'the espalier trellis', emblem,
  arrival: 'Brady! You came up through a pear tree. The orchard is closed, darling, so everything in it is stretching. Mind the ties: they have opinions. ♥ C',
  coin: { name: 'PIPS', draw(ctx, x, y) {
    ctx.fillStyle = '#3a2214'; ctx.beginPath(); ctx.ellipse(x, y, 6, 8.5, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f0c870'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.beginPath(); ctx.ellipse(x - 2, y - 3, 1.6, 3, 0.3, 0, TAU); ctx.fill();
  } },
  levels: []
});
// for the land's other files and the tests
Tour.orchKit = { SOLID, say: OrchSay, COL, INK, OrchArt, onMark, isOrch, flyArt, wormArt, finchArt, snailArt, pipArt, RT };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.orchKit = Tour.orchKit; if (typeof TourMap !== 'undefined' && !window.BRADY_TOUR.TourMap) window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
})();
