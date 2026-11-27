/* ============================================================
   THE UMBRELLA REPAIR DISTRICT (world 31, cc 'umb'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, A6 of
   docs/design/CHATGPT_RELAY.md). All the umbrellas that turn inside out in a storm come here to have their ribs
   counted. Ink-blue ribs, marigold canopy wedges, coral ferrules, chalk-white rain dashes.
   Found only through Amsterdam: in 8-1, on the last quay before the gate, an umbrella stand is bolted to a canal
   bench; one of its handles drips UPWARD into the stand. Jump up into the stand's open bottom from the lower quay
   (29_tour_y_umb_zdoor.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Rivet Tick, Puddle
   Mule, Drip Finch, Ferrule Ferret), the floating words, the route-map emblem, the map's sprites and painters, the
   music, the country.
   The canopies (31-1's climbing): 29_tour_y_umb_a_canopy.js. The other stages' repair work: 29_tour_y_umb_b_mech.js.
   The boss: 29_tour_y_umb_c_boss.js. The secret rooms: 29_tour_y_umb_d_rooms.js. The levels and the land's map:
   29_tour_y_umb_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'umb', world: 31, name: 'The Umbrella Repair District', sub: 'a hidden land', lon: 8.5, lat: 56.6, secret: true, bonus: true, d0: 0.8, pin: 'umbrella' });
const INK = '#1a1830';
const NAVY = '#2e3f7a', NAVY_L = '#4a62a8', NAVY_D = '#1f2a56', GOLD = '#f4b32e', GOLD_L = '#ffd060', GOLD_D = '#c98a16', CORAL = '#ef6f5a', CORAL_D = '#c24a3a', CHALK = '#f4f1e8', RAIN = '#e8f0ff', SLATE = '#7d8fb0';
const COL = { a: GOLD, b: NAVY, c: CORAL };

/* ---------------- shared drawings ---------------- */
const UmbArt = {
  INK, NAVY, NAVY_L, NAVY_D, GOLD, GOLD_L, GOLD_D, CORAL, CORAL_D, CHALK, RAIN, SLATE,
  // an open umbrella seen from the side: tip at (x, y - r*0.9), canopy radius r, handle hanging below (len); wedges
  // alternate marigold and a lighter marigold; ferrules (coral) at the rib tips. inside: inside out (a bowl)
  umbrella(ctx, x, y, r, o) {
    o = o || {};
    const n = o.n || 6, inside = !!o.inside, c1 = o.c1 || GOLD, c2 = o.c2 || GOLD_L, len = o.len == null ? r * 1.2 : o.len;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const dome = inside ? 1 : -1, top = dome * r * 0.8;
    // the shaft and its J handle
    if (len > 0) {
      ctx.strokeStyle = INK; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(0, len); ctx.stroke();
      ctx.strokeStyle = '#8a90a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(0, len); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, len - 2); ctx.arc(-r * 0.16, len, r * 0.16, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = o.handle || CORAL; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(0, len - 2); ctx.arc(-r * 0.16, len, r * 0.16, 0, Math.PI); ctx.stroke();
    }
    // the canopy: n wedges between rib tips along a scalloped edge
    const tips = []; for (let k = 0; k <= n; k++) { const a = Math.PI * (k / n); tips.push([-Math.cos(a) * r, 0]); }
    for (let k = 0; k < n; k++) {
      const [x0] = tips[k], [x1] = tips[k + 1];
      ctx.fillStyle = k % 2 ? c2 : c1;
      ctx.beginPath(); ctx.moveTo(0, top);
      ctx.quadraticCurveTo(x0 * 0.9, top * 0.55, x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, -dome * r * 0.12, x1, 0); ctx.quadraticCurveTo(x1 * 0.9, top * 0.55, 0, top); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tips[0][0], 0); for (let k = 0; k < n; k++) { const [x0] = tips[k], [x1] = tips[k + 1]; ctx.quadraticCurveTo((x0 + x1) / 2, -dome * r * 0.12, x1, 0); }
    ctx.quadraticCurveTo(r * 0.9, top * 0.55, 0, top); ctx.quadraticCurveTo(-r * 0.9, top * 0.55, -r, 0); ctx.stroke();
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.6; for (let k = 1; k < n; k++) { const [x0] = tips[k]; ctx.beginPath(); ctx.moveTo(0, top); ctx.quadraticCurveTo(x0 * 0.9, top * 0.55, x0, 0); ctx.stroke(); }
    ctx.fillStyle = CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (const [tx] of tips) { ctx.beginPath(); ctx.arc(tx, 0, Math.max(1.8, r * 0.06), 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.moveTo(-2, top); ctx.lineTo(2, top); ctx.lineTo(0, top + dome * r * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a furled (closed) umbrella hanging from its handle at (x, y): length len, tipped by a coral ferrule
  furled(ctx, x, y, len, col, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-5, 0, 5, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-5, 0, 5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = col || NAVY; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-1.5, 2); ctx.lineTo(1.5, 2); ctx.lineTo(6, len * 0.55); ctx.lineTo(1.5, len - 6); ctx.lineTo(-1.5, len - 6); ctx.lineTo(-6, len * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-4, len * 0.55); ctx.stroke();
    ctx.fillStyle = CORAL; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-1.5, len - 6); ctx.lineTo(1.5, len - 6); ctx.lineTo(0, len); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a coral rivet (a cap with a glint)
  rivet(ctx, x, y, r) {
    ctx.save(); ctx.fillStyle = CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CORAL_D; ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.25, r * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd0c4'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fill(); ctx.restore();
  },
  // a chalk-white rain dash
  dash(ctx, x, y, len) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.18, y + len); ctx.stroke(); },
  // a water drop (tip up)
  drop(ctx, x, y, r, col) {
    ctx.save(); ctx.fillStyle = col || '#8ac8f4'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.8); ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r * 0.1); ctx.arc(x, y, r, 0.1, Math.PI - 0.1); ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r * 1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.2, r * 0.25, 0, TAU); ctx.fill(); ctx.restore();
  },
  // the land's tell by every secret: a coral repair ticket on a string, pinned by a rivet; it flutters (No. 31)
  ticket(ctx, x, y, t, shy) {
    ctx.save(); const sw = Math.sin(t * 2.2) * (shy ? 0.5 : 0.18);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(sw) * 10, y + 10); ctx.stroke();
    ctx.translate(x + Math.sin(sw) * 10, y + 10); ctx.rotate(sw);
    ctx.fillStyle = '#ffe2c8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.lineTo(6, 18); ctx.lineTo(0, 22); ctx.lineTo(-6, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CORAL; ctx.fillRect(-6, 2, 12, 4); ctx.strokeRect(-6, 2, 12, 4);
    ctx.fillStyle = INK; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('31', 0, 15);
    ctx.restore();
    this.rivet(ctx, x, y, 3.2);
  },
  // a prompt on a dark rounded pill (never bare text over the sky or a character)
  pill(ctx, x, y, text, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = 17; ctx.fillStyle = 'rgba(20,16,36,0.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = col || GOLD_L; ctx.fillText(text, x, y + 1); ctx.restore();
  },
  // a pulsing ring round something Brady can use
  ring(ctx, x, y, t, hot, r) { const k = 0.5 + 0.5 * Math.sin(t * 6); ctx.save(); ctx.strokeStyle = hot ? `rgba(255,216,74,${0.6 + 0.4 * k})` : `rgba(255,216,74,${0.25 + 0.3 * k})`; ctx.lineWidth = hot ? 3.4 : 2.4; ctx.beginPath(); ctx.ellipse(x, y, (r || 16) + k * 3, ((r || 16) + k * 3) * 0.42, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
};

/* ---------------- the land's floating words: always on a dark rounded pill, clear of the HUD and the thumbs ---------------- */
// UmbSay(g, x, y, text, col, who): a short line that rises and fades over ~1.4 s; a line with a `who` replaces that
// speaker's last line (a boss says one thing at a time)
function UmbSay(g, x, y, text, col, who) {
  if (!g) return; const L = g.__umbSay || (g.__umbSay = []);
  if (L.some(q => q.text === text && q.t < 0.4 && Math.abs(q.x - x) < 80)) return;
  if (who) for (let i = L.length - 1; i >= 0; i--) if (L[i].who === who) L.splice(i, 1);
  L.push({ x, y, text: String(text), col: col || '#ffffff', t: 0, who, life: who === 'boss' ? 2.2 : 1.4 }); if (L.length > 4) L.shift();
}
TourHooks.on('areaLoaded', play => { play.__umbSay = []; });
TourHooks.on('playUpdate', (play, dt) => { const L = play.__umbSay; if (!L || !L.length) return; for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].life) L.splice(i, 1); } });
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.__umbSay; if (!L || !L.length) return;
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
  const top = play.camY + 74 * k, bot = play.camY + Game.viewH - 150 * k, x0 = play.camX + 150 * k, x1 = play.camX + Game.viewW - 150 * k;
  ctx.save(); ctx.font = `${Math.round(12 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    const w = ctx.measureText(q.text).width + 18 * k, h = 22 * k, rise = q.who === 'boss' ? 0 : q.t * 22;
    let x = clamp(q.x, x0 + w / 2, Math.max(x0 + w / 2, x1 - w / 2)), y = clamp(q.y - rise, top + h / 2, Math.max(top + h / 2, bot - h / 2));
    for (const r of placed) if (Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < h) y = r.y - h - 3 * k;
    placed.push({ x, y, w });
    const a = q.t > q.life - 0.4 ? (q.life - q.t) / 0.4 : Math.min(1, q.t * 8);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,16,36,0.84)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.restore();
});

/* ---------------- tiles ---------------- */
// the workshop floor: wet slate flags with a marigold oilcloth runner along the top, rivets in its hem
const slateGround = {
  style: 'slate', cap: GOLD, capHi: GOLD_L, dirt: '#5a6a8a', dirt2: '#4a5878', rock: '#6a7a98',
  paint(ctx, rng) {
    ctx.fillStyle = '#56668a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#4a5878'; ctx.fillRect(0, TS - 3, TS, 3); ctx.fillRect(rng() < 0.5 ? 0 : TS / 2, 0, 2, TS);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(3, 3, TS - 10, 2);
    if (rng() < 0.3) { ctx.fillStyle = 'rgba(140,190,240,0.35)'; ctx.beginPath(); ctx.ellipse(10 + rng() * 12, 18 + rng() * 8, 6, 2, 0, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = GOLD; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = GOLD_L; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = GOLD_D; for (let x = x0 + 8; x < x1; x += 16) ctx.fillRect(x, 4, 8, 6);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
    ctx.fillStyle = CORAL; for (let x = x0 + 16; x < x1 - 4; x += 32) { ctx.beginPath(); ctx.arc(x, 13.5, 2.2, 0, TAU); ctx.fill(); }
  }
};
// a closed umbrella laid flat (the one-way ledges): navy cloth, a coral ferrule every so often
const furlSemi = {
  style: 'furl', c1: NAVY, c2: NAVY_D,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = NAVY_D; ctx.fillRect(x0, 3, x1 - x0, 7);
    ctx.fillStyle = NAVY_L; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5);
    ctx.fillStyle = CORAL; for (let x = x0 + 12; x < x1 - 4; x += 32) { ctx.fillRect(x, 1, 5, 7); }
  }
};
// a stack of wrapped canopy bundles (bricks: they break)
const bundleBrick = {
  style: 'bundle', c1: GOLD, c2: GOLD_D, mortar: '#8a5a10',
  paint(ctx) {
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = GOLD_L; ctx.fillRect(0, 0, TS, 5);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, TS / 2); ctx.lineTo(TS, TS / 2); ctx.moveTo(TS / 2, 0); ctx.lineTo(TS / 2, TS); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// riveted ink-blue iron (walls, the hard blocks)
const ironHard = {
  c1: NAVY_L, c2: NAVY_D,
  paint(ctx) {
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = NAVY_L; ctx.fillRect(2, 2, TS - 4, 4);
    ctx.fillStyle = NAVY_D; ctx.fillRect(2, TS - 6, TS - 4, 4);
    ctx.fillStyle = CORAL; for (const [x, y] of [[6, 6], [TS - 6, 6], [6, TS - 6], [TS - 6, TS - 6]]) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const district = { ground: slateGround, semi: furlSemi, brick: bundleBrick, hard: ironHard, pillar: { c1: NAVY_L, c2: NAVY_D, cap: CORAL, style: 'column' }, accent: GOLD, tint: {}, bloom: 0.12, liquid: null };

// each secret room its own floor and walls: a ground whose top band and body are painted from two colours and a
// pattern, a hard block to match
const roomTiles = (cap, capHi, body, body2, pat, hard1, hard2) => {
  const ground = { style: 'room', cap, capHi, dirt: body, dirt2: body2, rock: body2,
    paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = body2;
      if (pat === 'herring') { for (let y = 0; y < TS; y += 8) for (let x = ((y / 8) % 2) * 8; x < TS; x += 16) ctx.fillRect(x, y, 10, 3); }
      else if (pat === 'tile') { ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); }
      else if (pat === 'plank') { ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect((rng() * 20) | 0, 0, 2, 10); }
      else if (pat === 'check') { ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); }
      else if (pat === 'dots') { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(8 + (k % 2) * 16, 8 + (k >> 1) * 16, 3, 0, TAU); ctx.fill(); } }
      else if (pat === 'grate') { for (let x = 3; x < TS; x += 7) ctx.fillRect(x, 0, 3, TS); } },
    paintCap(ctx, x0, x1) { ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 3); ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); } };
  const hard = { c1: hard1, c2: hard2, paint(ctx) { ctx.fillStyle = hard2; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = hard1; ctx.fillRect(2, 2, TS - 4, TS - 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); } };
  return Object.assign({}, district, { ground, hard });
};
const RT = {
  lunch: roomTiles('#5ab08a', '#8ad8b0', '#e8e0c8', '#d0c4a4', 'check', '#5ab08a', '#2e7a5a'),
  sew: roomTiles('#c86a9a', '#f0a0c8', '#f4e4ec', '#e0c8d4', 'dots', '#c86a9a', '#8a3a66'),
  tray: roomTiles('#8a8a96', '#c0c0cc', '#4a4a58', '#3a3a46', 'grate', '#7a7a88', '#4a4a56'),
  photo: roomTiles('#2a2a36', '#4a4a5a', '#a8323a', '#8a2430', 'plank', '#3a3a4a', '#1a1a24'),
  slice: roomTiles('#e85a5a', '#ff9a8a', '#fff0d8', '#f0d8b0', 'tile', '#5ab05a', '#2e7a3a'),
  rib: roomTiles(GOLD, GOLD_L, '#3a4a78', '#2e3c66', 'herring', NAVY_L, NAVY_D)
};

/* ---------------- painted backdrops ---------------- */
// a row of tall narrow shopfronts with gables and repair signs (no towers, no spires): their windows hold umbrellas
function shopRow(ctx, rng, b, col, h0, h1, umb) {
  let x = 0;
  while (x < BG_W) {
    const w = 70 + rng() * 50, h = h0 + rng() * (h1 - h0), c = shade(col, (rng() - 0.5) * 0.18);
    wrapDraw(x, w, X => {
      ctx.fillStyle = c; ctx.fillRect(X, b - h, w - 4, h + 400);
      // a stepped gable
      ctx.beginPath(); ctx.moveTo(X, b - h); ctx.lineTo(X + 10, b - h); ctx.lineTo(X + 10, b - h - 14); ctx.lineTo(X + w / 2 - 8, b - h - 14); ctx.lineTo(X + w / 2 - 8, b - h - 26); ctx.lineTo(X + w / 2 + 4, b - h - 26); ctx.lineTo(X + w / 2 + 4, b - h - 14); ctx.lineTo(X + w - 14, b - h - 14); ctx.lineTo(X + w - 14, b - h); ctx.lineTo(X + w - 4, b - h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(c, 0.22); for (let y = b - h + 14; y < b - 40; y += 30) for (let wx = X + 10; wx < X + w - 20; wx += 22) ctx.fillRect(wx, y, 12, 18);
      if (umb) { ctx.fillStyle = shade(c, -0.25); ctx.fillRect(X + 6, b - 40, w - 16, 40); ctx.fillStyle = rng() < 0.5 ? GOLD : CORAL; ctx.beginPath(); ctx.arc(X + w / 2 - 2, b - 14, 12, Math.PI, 0); ctx.fill(); }
    });
    x += w;
  }
}
const painters = {
  // the rain: long chalk dashes slanting a little, over a far haze
  umbRain(ctx, L, rng, H) {
    ctx.strokeStyle = L.color || 'rgba(232,240,255,0.55)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 260; k++) { const x = rng() * BG_W, y = rng() * H, len = 10 + rng() * 14; UmbArt.dash(ctx, x, y, len); }
  },
  // far: the district's rooftops, open umbrellas propped upside down on them to dry
  umbFarRoofs(ctx, L, rng, H) {
    const b = L.base;
    shopRow(ctx, rng, b, L.color, 70, 150, false);
    ctx.save(); ctx.globalAlpha = 0.55;
    for (let k = 0; k < 9; k++) { const x = rng() * BG_W, y = b - 60 - rng() * 50, r = 16 + rng() * 14; wrapDraw(x - r, r * 2, X => UmbArt.umbrella(ctx, X + r, y, r, { len: 0, c1: rng() < 0.5 ? GOLD : CORAL, c2: GOLD_L, inside: rng() < 0.3 })); }
    ctx.restore();
  },
  // near: repair stalls under striped awnings, umbrellas hung up to drip on rails, a wet street shine
  umbStalls(ctx, L, rng, H) {
    const b = L.base;
    shopRow(ctx, rng, b, L.color, 120, 190, true);
    for (let x = 40; x < BG_W; x += 260 + Math.floor(rng() * 80)) {
      ctx.fillStyle = INK; ctx.fillRect(x, b - 120, 150, 4);
      for (let k = 0; k < 5; k++) UmbArt.furled(ctx, x + 16 + k * 28, b - 116, 46 + (k % 2) * 8, [NAVY_L, CORAL, GOLD_D, '#5a9a8a', NAVY][k], 0);
    }
    ctx.fillStyle = 'rgba(200,220,255,0.12)'; ctx.fillRect(0, b - 6, BG_W, 6);
  },
  // 31-2: the backs of the workshops: downpipes, gutters, rain barrels, brick
  umbPipes(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b - 280, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.12); for (let y = b - 280; y < b; y += 14) for (let x = ((y / 14) % 2) * 20; x < BG_W; x += 40) ctx.fillRect(x, y, 36, 11);
    for (let x = 60; x < BG_W; x += 180 + Math.floor(rng() * 60)) {
      ctx.fillStyle = '#5a6a8a'; ctx.fillRect(x, b - 280, 14, 280); ctx.fillStyle = '#7a8aa8'; ctx.fillRect(x + 2, b - 280, 4, 280);
      ctx.fillStyle = '#5a6a8a'; ctx.fillRect(x - 60, b - 220, 74, 10);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 20, b - 54, 40, 54); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 20, b - 40, 40, 4); ctx.fillRect(x + 20, b - 16, 40, 4);
    }
    ctx.fillStyle = 'rgba(160,210,255,0.6)'; for (let k = 0; k < 50; k++) { const x = rng() * BG_W, y = b - 260 + rng() * 240; ctx.beginPath(); ctx.ellipse(x, y, 1.6, 3.2, 0, 0, TAU); ctx.fill(); }
  },
  // 31-3: a hook exchange: wires strung across a high hall, closed umbrellas riding them, numbered hooks
  umbWires(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.08); for (let x = 0; x < BG_W; x += 120) ctx.fillRect(x, 0, 16, b);
    for (let row = 0; row < 3; row++) {
      const y = 70 + row * 70, a = 0.4 + row * 0.2;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y + 6); ctx.stroke();
      for (let x = 20 + row * 30; x < BG_W; x += 70 + rng() * 40) UmbArt.furled(ctx, x, y + 4, 40 + row * 6, [NAVY_L, CORAL, GOLD_D, '#5a9a8a'][Math.floor(rng() * 4)], 0);
      ctx.restore();
    }
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, b - 10, BG_W, 10);
  },
  // 31-4: the arcade under the great canopies: marigold panels overhead, columns, the rain beyond
  umbArcade(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 200) {
      wrapDraw(x, 200, X => {
        ctx.fillStyle = shade(GOLD, -0.12); ctx.beginPath(); ctx.moveTo(X, 40); ctx.quadraticCurveTo(X + 100, -10, X + 200, 40); ctx.lineTo(X + 200, 70); ctx.quadraticCurveTo(X + 100, 30, X, 70); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X + 100, 14); ctx.lineTo(X + 100, b); ctx.stroke();
        ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(X + 92, 70, 16, b - 70);
      });
    }
    ctx.strokeStyle = 'rgba(232,240,255,0.4)'; ctx.lineWidth = 1.4; for (let k = 0; k < 120; k++) UmbArt.dash(ctx, rng() * BG_W, 80 + rng() * (b - 100), 12);
  },
  // 31-5: an evening square of puddles: lamplit, umbrellas upturned and full of water, reflections
  umbPuddles(ctx, L, rng, H) {
    const b = L.base;
    shopRow(ctx, rng, b - 20, L.color, 90, 170, false);
    for (let x = 80; x < BG_W; x += 240) { ctx.fillStyle = INK; ctx.fillRect(x, b - 150, 5, 150); ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x + 2, b - 156, 9, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,232,160,0.18)'; ctx.beginPath(); ctx.arc(x + 2, b - 150, 40, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(150,180,230,0.35)'; for (let k = 0; k < 14; k++) { const x = rng() * BG_W; ctx.beginPath(); ctx.ellipse(x, b - 8 - rng() * 10, 30 + rng() * 40, 5, 0, 0, TAU); ctx.fill(); }
  },
  // 31-6: the inspector's hall: a long repair bench, rib cases on shelves, a big barometer dial
  umbHall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.08); for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, 0, 18, b);
    for (let x = 60; x < BG_W; x += 360) {
      ctx.fillStyle = '#3a2a3a'; ctx.beginPath(); ctx.arc(x + 60, b - 230, 52, 0, TAU); ctx.fill();
      ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(x + 60, b - 230, 44, 0, TAU); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 60, b - 230); ctx.lineTo(x + 60 + Math.cos(-2.3 + (x % 3)) * 36, b - 230 + Math.sin(-2.3 + (x % 3)) * 36); ctx.stroke();
      ctx.fillStyle = NAVY_D; for (let s = 0; s < 3; s++) ctx.fillRect(x + 160, b - 260 + s * 60, 140, 8);
      for (let s = 0; s < 3; s++) for (let k = 0; k < 4; k++) { ctx.fillStyle = NAVY; ctx.fillRect(x + 166 + k * 34, b - 290 + s * 60, 28, 30); ctx.fillStyle = CORAL; ctx.fillRect(x + 177 + k * 34, b - 280 + s * 60, 6, 10); }
    }
    ctx.fillStyle = shade(L.color, -0.22); ctx.fillRect(0, b - 14, BG_W, 14);
  },
  /* ---------- the six secret rooms' own places (one each, no two alike) ---------- */
  // B26 the lunch nook: green tiles, a lunch counter, a pelican teapot on a shelf
  roomLunch(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#cfe8d8'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#b4d8c4'; for (let y = 0; y < H; y += 20) for (let x = (y / 20 % 2) * 10; x < BG_W; x += 20) ctx.fillRect(x, y, 18, 18);
    ctx.fillStyle = '#2e7a5a'; ctx.fillRect(0, b - 100, BG_W, 10);
    for (let x = 60; x < BG_W; x += 180) { ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.arc(x, 80, 26, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2e7a5a'; ctx.lineWidth = 3; ctx.stroke(); }
  },
  // B27 the sewing loft: pink striped wallpaper, a dress form, spools on pegs
  roomSew(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#f4dce8'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#ecc8da'; for (let x = 0; x < BG_W; x += 30) ctx.fillRect(x, 0, 12, H);
    for (let x = 40; x < BG_W; x += 60) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x, 30, 4, 30); ctx.fillStyle = ['#c86a9a', NAVY_L, GOLD, '#5ab08a'][(x / 60) % 4 | 0]; ctx.fillRect(x - 6, 38, 16, 14); }
  },
  // B28 the ferrule tray room: a steel workshop, pegboard of tools, a gantry rail
  roomTray(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#6a6a78'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#5a5a68'; for (let y = 8; y < H; y += 16) for (let x = 8; x < BG_W; x += 16) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3a3a46'; ctx.fillRect(0, 36, BG_W, 12);
  },
  // B29 the photo booth: a red velvet curtain, a big shop mirror, a striped floor lamp
  roomPhoto(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#7a1e2a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#9a2a36'; for (let x = 0; x < BG_W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 18, H / 2, x, H); ctx.lineTo(x + 14, H); ctx.quadraticCurveTo(x + 32, H / 2, x + 14, 0); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ffd060'; ctx.fillRect(0, 0, BG_W, 10);
  },
  // B30 the canopy carousel: a melon-pink kitchen with a turning table
  roomSlice(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#fff0d8'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#ffd8c0'; for (let x = 0; x < BG_W; x += 64) for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.arc(x + 32, y + 32, 10, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5ab05a'; ctx.fillRect(0, b - 120, BG_W, 6);
  },
  // Missing Rib: the test shower: a tiled rain room with a big rose over it
  roomRib(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#2e3c66'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#34447a'; for (let y = 0; y < H; y += 24) for (let x = (y / 24 % 2) * 12; x < BG_W; x += 24) ctx.fillRect(x, y, 22, 22);
    ctx.strokeStyle = 'rgba(232,240,255,0.25)'; ctx.lineWidth = 1.4; for (let k = 0; k < 80; k++) UmbArt.dash(ctx, rng() * BG_W, rng() * H, 12);
  }
};

const SKY = ['#6f85ad', '#93a8c8', '#c4d0e2'];
const base = (o, ...mix) => Object.assign({}, ...mix, o);
const roomTheme = (name, col, kind, rt) => base({ name, music: 'tour_umb_room', particles: 'none', rays: null, sky: [col, col, col], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind, base: 400, f: 0.05 }], fog: col, decor: [] }, rt);
const themes = {
  umb_ribs: base({ name: 'Rib Inspector', music: 'tour_umb', particles: 'rain', rays: null, sky: SKY, horizonGlow: '#e8eef8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'umbRain', color: 'rgba(232,240,255,0.35)', base: 200, f: 0.02 }, { kind: 'umbFarRoofs', color: '#8a9ab8', base: 330, f: 0.1 }, { kind: 'umbStalls', color: '#6a5a78', base: 420, f: 0.22 }], fog: '#b8c4da', decor: ['umbStand', 'umbBench'] }, district),
  umb_gutter: base({ name: 'Every Drop Accounted For', music: 'tour_umb_drip', particles: 'rain', rays: null, sky: ['#5a6a8a', '#7a8aa8', '#a8b4c8'], horizonGlow: '#d8e0f0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'umbRain', color: 'rgba(232,240,255,0.3)', base: 200, f: 0.02 }, { kind: 'umbPipes', color: '#8a5a4a', base: 420, f: 0.16 }], fog: '#9aa8c0', decor: ['umbBarrel'] }, district),
  umb_hooks: base({ name: 'Hook Exchange', music: 'tour_umb', particles: 'none', rays: null, sky: ['#d8c8a8', '#e8dcc0', '#f4ecd8'], horizonGlow: '#fff4e0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'umbWires', color: '#e0d0b0', base: 420, f: 0.12 }], fog: '#e8dcc4', decor: ['umbStand'] }, district),
  umb_arcade: base({ name: 'Panel Beater', music: 'tour_umb_drip', particles: 'rain', rays: null, sky: ['#4a5a7a', '#6a7a98', '#8a98b0'], horizonGlow: '#c8d4e8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'umbArcade', color: '#7a8aa4', base: 420, f: 0.14 }], fog: '#8a98b0', decor: ['umbBench'] }, district),
  umb_puddles: base({ name: 'Shake Well', music: 'tour_umb', particles: 'rain', rays: null, sky: ['#3a3a6a', '#7a6a9a', '#d8a8a0'], horizonGlow: '#ffd8b0', celestial: { type: 'none' }, stars: 0.2,
    layers: [{ kind: 'umbRain', color: 'rgba(232,240,255,0.25)', base: 200, f: 0.02 }, { kind: 'umbPuddles', color: '#5a4a6a', base: 420, f: 0.18 }], fog: '#8a7a9a', decor: ['umbStand', 'umbBarrel'] }, district),
  umb_hall: base({ name: 'Lifetime Warranty', music: 'tour_umb_boss', particles: 'none', rays: null, sky: ['#3a3050', '#4a4060', '#5a5070'], horizonGlow: '#c8b8e0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'umbHall', color: '#6a5a7a', base: 420, f: 0.08 }, { kind: 'umbRain', color: 'rgba(232,240,255,0.12)', base: 200, f: 0.03 }], fog: '#5a5070' }, district),
  umb_room_lunch: roomTheme('The Lunch Nook', '#cfe8d8', 'roomLunch', RT.lunch),
  umb_room_sew: roomTheme('The Sewing Loft', '#f4dce8', 'roomSew', RT.sew),
  umb_room_tray: roomTheme('The Ferrule Tray', '#6a6a78', 'roomTray', RT.tray),
  umb_room_photo: roomTheme('The Photo Booth', '#7a1e2a', 'roomPhoto', RT.photo),
  umb_room_slice: roomTheme('The Patch Carousel', '#fff0d8', 'roomSlice', RT.slice),
  umb_room_rib: roomTheme('The Test Shower', '#2e3c66', 'roomRib', RT.rib)
};

/* ---------------- props (Decor: drawn each frame) ---------------- */
const decor = {
  // a repair-shop umbrella stand with two furled umbrellas
  umbStand(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    UmbArt.furled(ctx, x - 5, y - 52, 46, (d || 0) % 2 ? CORAL : NAVY_L, -0.12); UmbArt.furled(ctx, x + 6, y - 48, 42, GOLD_D, 0.15);
    ctx.fillStyle = '#9aa4b8'; ctx.fillRect(x - 11, y - 28, 22, 28); ctx.strokeRect(x - 11, y - 28, 22, 28);
    ctx.fillStyle = '#c0c8d8'; ctx.fillRect(x - 11, y - 28, 22, 4); ctx.fillStyle = '#7a8498'; ctx.fillRect(x - 11, y - 10, 22, 3);
    ctx.restore();
  },
  // a padded repair bench (the building block sheet's): marigold cushions on an ink-blue frame, coral bolts
  umbBench(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = NAVY; ctx.fillRect(x - 34, y - 22, 68, 22); ctx.strokeRect(x - 34, y - 22, 68, 22);
    ctx.fillStyle = NAVY_D; ctx.fillRect(x - 28, y - 16, 56, 14);
    ctx.fillStyle = GOLD; for (let k = 0; k < 3; k++) { rr(ctx, x - 34 + k * 23, y - 32, 22, 11, 5); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = CORAL; for (const bx of [-26, 0, 26]) { ctx.beginPath(); ctx.arc(x + bx, y - 18, 2.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a rain barrel
  umbBarrel(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x - 15, y - 30); ctx.lineTo(x + 15, y - 30); ctx.lineTo(x + 13, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 15, y - 24, 30, 4); ctx.fillRect(x - 14, y - 10, 28, 4);
    ctx.fillStyle = '#8ac8f4'; ctx.beginPath(); ctx.ellipse(x, y - 30, 14, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a tip card (the land's signs stand on these)
  umbTip(ctx, x, y) { UmbArt.rivet(ctx, x, y - 6, 4); }
};

/* ---------------- door looks: a rib-case door, a drainpipe hatch ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'umbCase' || look === 'umbHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'umbCase') {
        ctx.fillStyle = NAVY; rr(ctx, x - 22, y - 60, 44, 60, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#140f24' : NAVY_D; rr(ctx, x - 16, y - 54, 32, 50, 3); ctx.fill();
        ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.lineTo(x, y - 34); ctx.arc(x - 5, y - 34, 5, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = CORAL; for (const [dx, dy] of [[-18, -56], [18, -56], [-18, -4], [18, -4]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.2, 0, TAU); ctx.fill(); }
      } else {
        ctx.fillStyle = '#8a98b0'; rr(ctx, x - 20, y - 50, 40, 50, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#0e0c18' : '#2a2a3e'; rr(ctx, x - 14, y - 42, 28, 38, 9); ctx.fill();
        UmbArt.drop(ctx, x, y - 50, 4);
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// RIVET TICK: a coral tick with cream rivet-dots on its shell and ink-blue legs. It counts the spokes it passes; now
// and then it loses count ("ONE... TWO... ONE?"), stops dead (the tell) and turns back to start again.
const tickArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const count = m === 'notice', st = count ? 0 : Math.sin(t * 16) * 2;
  ctx.fillStyle = NAVY; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(-8 + k * 8 + (k % 2 ? st : -st), -3, 3, 3, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(-2, -14, 13, 11, 0, Math.PI, 0); ctx.lineTo(11, -6); ctx.lineTo(-15, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -25); ctx.lineTo(-2, -6); ctx.stroke();
  ctx.fillStyle = CHALK; for (const [dx, dy] of [[-9, -14], [4, -18], [-5, -21], [7, -10]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, TAU); ctx.fill(); }
  // the head: big eyes, frowning in concentration; while counting, one leg up, pointing
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(12, -10, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14, -12, 3, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(15, -12, 1.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(11, -16); ctx.lineTo(16, -15); ctx.stroke();
  ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(11, -16); ctx.quadraticCurveTo(12, -24, 8, -27); ctx.moveTo(14, -16); ctx.quadraticCurveTo(18, -23, 17, -27); ctx.stroke();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(8, -27, 1.8, 0, TAU); ctx.arc(17, -27, 1.8, 0, TAU); ctx.fill();
  if (count) { ctx.strokeStyle = NAVY; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(22, -14 + Math.sin(t * 12) * 2); ctx.stroke(); }
  ctx.restore();
};
// PUDDLE MULE: a blue donkey with a marigold mane and a coral saddle cloth, standing in his own puddle. His
// reflection kicks first (the tell): its hoof flicks up in the water; then he kicks exactly where it did, behind him.
const muleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const tell = m === 'notice', kick = m === 'charge' || m === 'throw', d = e.dir || 1;
  // the puddle and his reflection (upside down, faint), whose hoof kicks first
  ctx.fillStyle = 'rgba(120,170,230,0.55)'; ctx.beginPath(); ctx.ellipse(0, 1, 22, 4, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.scale(d, -0.35); ctx.globalAlpha = 0.45; ctx.fillStyle = NAVY_L; ctx.fillRect(-12, 2, 24, 10); ctx.fillRect(-12, 0, 4, 6); ctx.fillRect(8, 0, 4, 6);
  if (tell || kick) { ctx.fillStyle = INK; ctx.fillRect(-20, 4, 9, 4); } ctx.restore();
  ctx.scale(d, 1);
  const buck = kick ? -0.25 : 0;
  ctx.save(); ctx.rotate(buck);
  // legs (the back ones fly out on the kick)
  ctx.fillStyle = NAVY; ctx.fillRect(6, -10, 4, 10); ctx.fillRect(1, -10, 4, 10);
  if (kick) { ctx.save(); ctx.translate(-8, -12); ctx.rotate(1.2); ctx.fillRect(0, 0, 4, 12); ctx.fillRect(5, 0, 4, 12); ctx.fillStyle = INK; ctx.fillRect(0, 10, 9, 4); ctx.restore(); }
  else { ctx.fillRect(-11, -10, 4, 10); ctx.fillRect(-6, -10, 4, 10); ctx.fillStyle = INK; ctx.fillRect(-11, -2, 4, 2); ctx.fillRect(-6, -2, 4, 2); }
  ctx.fillStyle = INK; ctx.fillRect(1, -2, 4, 2); ctx.fillRect(6, -2, 4, 2);
  // body, saddle cloth, tail
  ctx.fillStyle = NAVY_L; rr(ctx, -14, -24, 28, 15, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CORAL; ctx.fillRect(-6, -25, 12, 10); ctx.strokeRect(-6, -25, 12, 10); ctx.fillStyle = CHALK; ctx.fillRect(-4, -23, 8, 6);
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(-14, -21); ctx.quadraticCurveTo(-24, -18 + (tell ? Math.sin(t * 30) * 3 : 0), -20, -10); ctx.lineTo(-15, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the head: long face, cream muzzle, big ears, a stubborn look
  ctx.fillStyle = NAVY_L; ctx.save(); ctx.translate(14, -24); ctx.rotate(0.35); rr(ctx, -4, -8, 12, 20, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.ellipse(3, 10, 6, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NAVY_L; ctx.beginPath(); ctx.ellipse(-2, -12, 3, 8, -0.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(5, -13, 3, 8, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-10, 0); ctx.lineTo(-9, 6); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4, -2, 3, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5, -2, 1.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1, -6); ctx.lineTo(7, -5); ctx.stroke();
  ctx.restore(); ctx.restore();
  ctx.restore();
};
// DRIP FINCH: a marigold finch who lines up under a leak with his beak wide open... and misses every drop
const finchArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 10); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const flap = Math.sin(t * 18) * 0.7, open = m === 'swoop' || Math.sin(t * 1.7) > 0.6;
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.ellipse(2, 4, 6, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = GOLD_D; ctx.save(); ctx.translate(-3, -2); ctx.rotate(-0.6 + flap); ctx.beginPath(); ctx.ellipse(-6, 0, 9, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-17, -1); ctx.lineTo(-16, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(5, -4, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -5, 1.6, 0, TAU); ctx.fill();
  // the beak: wide open, pointing up (a drop goes right past it)
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(16, open ? -10 : -3); ctx.lineTo(10, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -1); ctx.lineTo(16, open ? 3 : -1); ctx.lineTo(10, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (open) { const k = (t * 1.3) % 1; UmbArt.drop(ctx, 21, -22 + k * 34, 2.6); }
  ctx.restore();
};
// FERRULE FERRET: a navy ferret with a cream front who walks off with the shiny tips and wears them on his toes. He
// taps them together (clink-clink: the tell), then dashes.
const ferretArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const run = m === 'charge', tap = m === 'notice', st = run ? Math.sin(t * 26) * 4 : Math.sin(t * 9) * 2;
  // the tail (cream tip)
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(-14, -12); ctx.quadraticCurveTo(-26, -20, -24, -30); ctx.quadraticCurveTo(-20, -20, -12, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.arc(-24, -29, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
  // legs with coral ferrules on the toes
  const legs = [[-11, st], [-5, -st], [6, -st], [11, st]];
  for (const [lx, s] of legs) { ctx.fillStyle = NAVY; ctx.fillRect(lx - 2 + s * 0.3, -9, 4, 6); ctx.fillStyle = CORAL; ctx.beginPath(); ctx.moveTo(lx - 3 + s * 0.3, -4 - (tap && lx > 0 ? Math.abs(Math.sin(t * 20)) * 3 : 0)); ctx.lineTo(lx + 3 + s * 0.3, -4); ctx.lineTo(lx + 2 + s * 0.3, 0); ctx.lineTo(lx - 2 + s * 0.3, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // the long body
  ctx.fillStyle = NAVY; rr(ctx, -15, -18, 30, 11, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.ellipse(6, -9, 9, 3, 0, 0, TAU); ctx.fill();
  // head: pleased with himself, eyes half shut
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(17, -20, 8, 6, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.ellipse(20, -17, 5, 3, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(25, -19, 1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(13, -26, 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(16, -22); ctx.quadraticCurveTo(18, -24, 20, -22); ctx.stroke();
  ctx.restore();
};
// a heel splash (the mule's kick): a short burst of water behind him
const splashArt = (c, s) => { c.save(); c.fillStyle = 'rgba(140,200,250,0.9)'; c.strokeStyle = INK; c.lineWidth = 1.2; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(s.x + 4 + k * 6, s.y + s.h / 2 + Math.sin(k * 2.1) * 4, 4, 0, TAU); c.fill(); c.stroke(); } c.restore(); };
const enemies = {
  umbTick: { cls: TourEnemy.make({ w: 26, h: 24, speed: 0.8, behavior: 'walk', art: tickArt, burst: CORAL,
    init(e) { e.cnt = 0; e.cntT = 2 + Math.random() * 1.5; },
    think(e, dt) {
      if (e.cntS > 0) { e.cntS -= dt; e.vx = 0; e.mode = 'notice'; if (e.cntS <= 0) { e.dir = -e.dir; e.vx = e.dir * e.speed; e.mode = 'walk'; } return; }
      if (!e.vx) e.vx = e.dir * e.speed;
      e.mode = 'walk'; e.cntT -= dt;
      if (e.cntT <= 0) { e.cntT = 3 + Math.random() * 1.5; e.cntS = 0.9; if (e.g.onScreen(e, 40)) UmbSay(e.g, e.cx, e.y - 14, pick(['ONE... TWO... ONE?', 'WAIT. START AGAIN.', 'SEVEN, EIGHT, SEVEN?']), CHALK); }
    } }), place: 'walk' },
  umbMule: { cls: TourEnemy.make({ w: 30, h: 30, speed: 0.6, behavior: 'walk', art: muleArt, burst: NAVY_L,
    init(e) { e.kickT = 2.2 + Math.random(); },
    think(e, dt) {
      const p = e.g.player;
      if (e.tellT > 0) { e.tellT -= dt; e.vx = 0; e.mode = 'notice'; if (e.tellT <= 0) { e.mode = 'charge'; e.kickS = 0.35; if (e.g.onScreen(e, 40)) { TourKit.sfx('kick', 'kick', { vol: 0.35, pitch: 0.8 }); tourFire(e.g, e.dir > 0 ? e.x - 30 : e.x + e.w, e.y + e.h - 20, { vx: -e.dir * 1.2 * TS, w: 30, h: 18, life: 0.35, col: '#8ac8f4', art: splashArt }); } } return; }
      if (e.kickS > 0) { e.kickS -= dt; e.vx = 0; e.mode = 'charge'; return; }
      if (!e.vx) e.vx = e.dir * e.speed;
      e.mode = 'walk'; e.kickT -= dt;
      if (e.kickT <= 0) { e.kickT = 3 + Math.random() * 1.2; e.tellT = 0.75; if (p && e.g.onScreen(e, 40)) UmbSay(e.g, e.cx, e.y - 14, 'HEE-HAW... (SPLOSH)', CHALK); }
    } }), place: 'walk' },
  umbFinch: { cls: TourFlyer.make({ w: 26, h: 22, range: 3, speed: 0.8, swoop: true, art: finchArt, burst: GOLD,
    onSwoop: e => { if (e.g.onScreen(e)) UmbSay(e.g, e.cx, e.y - 10, 'MISSED IT!', GOLD_L); } }), place: 'fly' },
  umbFerret: { cls: TourEnemy.make({ w: 28, h: 22, speed: 0.9, behavior: 'charge', range: 6, windup: 0.7, chargeSpeed: 4.2, chargeT: 0.9, art: ferretArt, burst: NAVY,
    onNotice: e => { if (e.g.onScreen(e)) UmbSay(e.g, e.cx, e.y - 12, 'CLINK CLINK! SHINY!', CORAL); } }), place: 'walk' }
};

/* ---------------- the route map: an open umbrella in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = '#c4d0e2'; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  UmbArt.umbrella(ctx, x, y + r * 0.1, r * 0.62, { len: r * 0.5, rot: 0.12 * Math.sin(t * 2) });
  ctx.restore();
};

/* ---------------- the land's map: sprites and the wet cobbles ---------------- */
Object.assign(TourOWPaint.art, {
  // an open umbrella propped on the cobbles
  umbOpen(c, r) { UmbArt.umbrella(c, 0, -r * 0.5, r * 0.8, { len: r * 0.45 }); },
  // a stand of furled umbrellas
  umbStandSprite(c, r) { c.save(); c.scale(r / 30, r / 30); decor.umbStand(c, 0, 0, 0, null, 1); c.restore(); },
  // the inspector's hall (the boss): a gabled workshop with a big umbrella over the door
  umbHallSprite(c, r) {
    c.fillStyle = NAVY; c.fillRect(-r, -r * 0.9, r * 2, r * 0.9); c.strokeRect(-r, -r * 0.9, r * 2, r * 0.9);
    c.fillStyle = NAVY_D; c.beginPath(); c.moveTo(-r * 1.1, -r * 0.9); c.lineTo(0, -r * 1.5); c.lineTo(r * 1.1, -r * 0.9); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = GOLD; c.fillRect(-r * 0.25, -r * 0.6, r * 0.5, r * 0.6); c.strokeRect(-r * 0.25, -r * 0.6, r * 0.5, r * 0.6);
    UmbArt.umbrella(c, 0, -r * 0.75, r * 0.5, { len: 0, c1: CORAL });
  },
  // a puddle with a reflection
  umbPuddle(c, r) { c.fillStyle = 'rgba(120,170,230,0.7)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.35, 0, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.moveTo(-r * 0.4, -2); c.lineTo(r * 0.2, -2); c.stroke(); }
});
// a kerb of riveted iron instead of a coast: ink-blue edging over the rain-grey water
TourOWLands.coast.umbKerb = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(20,20,50,0.3)'; c.fill(); c.restore();
  c.save(); c.translate(0, 8); OWGeo.path(c, ring, true); c.fillStyle = NAVY_D; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = GOLD; c.lineWidth = 9; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the wet cobbles under the trails: slate rows, puddles, umbrellas left open to dry
TourOWScenes.groundPaint.umb = function (c, ow) {
  const R = TourOWPaint.rng('umbground'), ink = TourOWPaint.INK, A = TourOWPaint.art;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(60,70,110,0.18)'; c.lineWidth = 2;
  for (let y = 180; y < 720; y += 20) { c.beginPath(); c.moveTo(200, y); c.lineTo(1340, y + 4); c.stroke(); }
  for (let k = 0; k < 9; k++) { c.save(); c.translate(260 + R() * 1000, 200 + R() * 480); c.strokeStyle = ink; c.lineWidth = 1.2; A.umbPuddle.call(TourOWPaint, c, 14 + R() * 10); c.restore(); }
};
TourLandscape.looks.umb = ['#93a8c8', '#6f85ad', NAVY, GOLD, CHALK, CORAL, 'umbOpen'];
{
  // the land's landmark miniature: an open umbrella, tip up
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'umbOpen') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    UmbArt.umbrella(ctx, 0, -22, 22, { len: 20 });
    ctx.restore();
  };
}

/* ---------------- music: a drizzly street waltz, a dripping pizzicato, a little room tune and the inspector's
   brisk weather report ---------------- */
const tracks = {
  tour_umb: {
    bpm: 120, bpb: 3, bars: 8, rv: 0.35, dl: 0.18, hx: 0.05,
    ch: 'Dm Dm A7 A7 Dm Gm A7 Dm',
    ld: 'A5:3 D6:3 F6:3 | E6:6 C#6:3 | E6:3 G6:3 Bb6:3 | A6:9 | F6:3 A6:3 D7:3 | Bb6:3 G6:3 D6:3 | C#6:3 E6:3 G6:3 | D6:9',
    li: 'reed', lv: 0.13,
    bp: 'r..f..', bi: 'pluckb', bv: 0.3,
    ap: '...c.c', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k.....', '...s..', 'h.hh.h'], dv: 0.28
  },
  tour_umb_drip: {
    bpm: 96, bars: 8, rv: 0.45, dl: 0.25, hx: 0.04,
    ch: 'Cmaj7 Am7 Dm7 G7 Cmaj7 Am7 Fmaj7 G7',
    ld: 'G6:2 .:2 E6:2 .:2 C7:4 B6:4 | A6:2 .:2 C7:2 .:2 E7:8 | F6:2 .:2 A6:2 .:2 D7:4 C7:4 | B6:4 G6:4 D7:8 | E7:2 .:2 C7:2 .:2 G6:4 A6:4 | C7:2 .:2 A6:2 .:2 E6:8 | F6:4 A6:4 C7:4 E7:4 | D7:16',
    li: 'pluck', lv: 0.14,
    bp: 'r...r.f.r...r.f.', bi: 'sub', bv: 0.24,
    ap: '..c...c...c...c.', ai: 'glass', av: 0.05, ao: 64,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_umb_room: {
    bpm: 112, bars: 4, rv: 0.4, dl: 0.2, hx: 0.04,
    ch: 'F Dm Bb C',
    ld: 'A6:4 C7:4 F7:8 | D7:4 F7:4 A7:8 | Bb6:4 D7:4 F7:4 D7:4 | C7:4 E7:4 G7:8',
    li: 'mbox', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_umb_boss: {
    bpm: 150, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Em Em C B7 Em Em Am B7',
    ld: 'E6:2 G6:2 B6:2 E7:2 D7:4 B6:4 | C7:2 B6:2 A6:2 G6:2 E6:8 | C7:2 E7:2 G7:2 E7:2 C7:4 E7:4 | D#7:4 F#7:4 B7:8 |' +
        'E7:2 G7:2 B7:2 G7:2 E7:4 G7:4 | F#7:2 E7:2 D#7:2 E7:2 B6:8 | A6:2 C7:2 E7:2 A7:2 G7:4 E7:4 | F#7:4 A7:4 D#7:8',
    li: 'brass', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'reed', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  }
};

Tour.country({
  id: 'umb', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: where the inside-out umbrellas go to be mended',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_umb', boss: 'tour_umb_boss', map: null },
  landmark: 'the open canopies', emblem,
  arrival: 'Brady! You went up the umbrella stand and came out where they mend them. Every umbrella that ever blew inside out on us is here having its ribs counted. Mine is on a waiting list. ♥ C',
  coin: { name: 'RIVETS', draw(ctx, x, y) {
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = CORAL_D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd0c4'; ctx.beginPath(); ctx.arc(x - 2.5, y - 2.5, 2.2, 0, TAU); ctx.fill();
  } },
  levels: []
});
// for the land's other files and the tests
Tour.umbKit = { SOLID, say: UmbSay, COL, INK, UmbArt, tickArt, muleArt, finchArt, ferretArt, splashArt, decor };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.umbKit = Tour.umbKit; if (typeof TourMap !== 'undefined' && !window.BRADY_TOUR.TourMap) window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
})();
