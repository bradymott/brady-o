/* ============================================================
   VIETNAM (world 10)
   10-1 Train Street          run    a pho cart lends a noodle lasso; the train rumbles down the street (get up on a doorstep!),
                                     wind-up toy scooters, lasso the tangled wires to swing over the rooftop gaps
   10-2 Ha Long Bay           run    limestone karsts rising from emerald water: lasso the cliff-side trees and swing from
                                     karst to karst; bobbing fishing rafts, leaping squid, punchy mantis shrimp
   10-3 Hoi An Lantern River  night  lantern light on the river: lasso a moored boat to pull it over, then ride it back across;
                                     swing on the lantern strings; mosquitoes and toads
   10-4 Phong Nha Cave        climb  climb a giant cave toward its skylight: lasso the stalactites and reel yourself up;
                                     glowing cave fungi, bats, blind cave crabs
   10-5 Hue Citadel           castle the Baron's coffee works in the citadel: hot coffee pits, melting ice-cube rafts,
                                     coffee-bean cannons; boss Ong Phin, the Grand Coffee Filter
   Food gags (pho, banh bao, spring rolls, drip coffee) are the jokes; people, temples and shrines are never the joke.
   ============================================================ */
(() => {
const COL = { a: '#e8323a', b: '#1aa86a', c: '#ffd23a' };
const K = TourKit;
const LANT = ['#e8323a', '#ffb02a', '#ff5a8a', '#ffd23a', '#2aa86a', '#3a7ad8'];
const NOODLE = '#f6e6ba';
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
LIQUIDS.vn_bay = ['#5ae0b8', '#1a9a8a', '#0a4a52', 'rgba(220,255,240,0.28)', null, 'rgba(240,255,250,0.7)'];
LIQUIDS.vn_river = ['#3a5a7a', '#1a2e48', '#0a1424', 'rgba(255,200,120,0.25)', '#ff9a3a', 'rgba(255,220,160,0.5)'];
LIQUIDS.vn_coffee = ['#a8683a', '#5a2e14', '#2a1408', 'rgba(255,220,180,0.22)', null, 'rgba(255,240,220,0.55)'];
// a silk lantern (round-bellied, tasselled)
function lantern(ctx, x, y, r, col, t, glow) {
  if (glow !== false) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 1, x, y, r * 3); g.addColorStop(0, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - r * 0.45, y - r * 1.05, r * 0.9, r * 0.22); ctx.fillRect(x - r * 0.45, y + r * 0.85, r * 0.9, r * 0.22);
  const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r); g2.addColorStop(0, shade(col, 0.55)); g2.addColorStop(1, col);
  ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 0.9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(shade(col, -0.35), 0.6); ctx.lineWidth = 0.8; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(x, y, r * 0.95 * Math.abs(k * 0.6 + (k ? 0 : 0.01)) + (k ? 0 : 0.5), r * 0.9, 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + r * 1.05); ctx.lineTo(x + Math.sin((t || 0) * 2 + x) * 1.5, y + r * 1.7); ctx.stroke();
}
// a rough karst tower outline (limestone pillar with an overhanging, tree-tufted top)
function karst(ctx, x, base, w, h, col, seed) {
  const r = (k) => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2, base);
  const n = 9;
  for (let k = 0; k <= n; k++) { const u = k / n, yy = base - h * (0.15 + 0.85 * Math.sin(u * Math.PI) ** 0.35) - r(k) * h * 0.08; ctx.lineTo(x - w / 2 + u * w + (r(k + 3) - 0.5) * w * 0.12, yy); }
  ctx.lineTo(x + w / 2, base); ctx.closePath(); ctx.fill();
}

/* ---------------- background painters ---------------- */
const painters = {
  // Hanoi's tall, narrow tube houses: shutters, balconies, potted plants, shop signs with little pictures (no words)
  vnTubeHouses(ctx, L, rng, H) {
    const cols = L.cols || ['#f2d07a', '#e8a07a', '#9ad0c0', '#f0c8d0', '#c8d890', '#f4e4c0', '#a8c0e8'];
    let x = 0;
    while (x < BG_W) {
      const w = 34 + Math.floor(rng() * 26), floors = 3 + Math.floor(rng() * 3), top = L.base - floors * 26 - 10, c = cols[Math.floor(rng() * cols.length)];
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(c, L.dim || 0); ctx.fillRect(xx, top, w - 1, H - top);
        ctx.fillStyle = shade(c, (L.dim || 0) - 0.18); ctx.fillRect(xx, top - 4, w - 1, 5);
        for (let f = 0; f < floors; f++) {
          const wy = top + 8 + f * 26;
          ctx.fillStyle = L.night ? (rng() < 0.55 ? '#ffd890' : '#2a2238') : shade(c, -0.45); ctx.fillRect(xx + 6, wy, w - 13, 13);
          ctx.fillStyle = shade(c, (L.dim || 0) - 0.3); ctx.fillRect(xx + 4, wy, 3, 13); ctx.fillRect(xx + w - 8, wy, 3, 13);
          if (f < floors - 1) { ctx.fillStyle = '#3a3a44'; ctx.fillRect(xx + 3, wy + 15, w - 7, 2); for (let q = 0; q < 5; q++) ctx.fillRect(xx + 5 + q * (w - 12) / 4, wy + 11, 1, 5); if (rng() < 0.5) { ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(xx + 8 + rng() * (w - 16), wy + 12, 3, 0, TAU); ctx.fill(); } }
        }
        if (rng() < 0.6) { const sc = LANT[Math.floor(rng() * LANT.length)]; ctx.fillStyle = sc; rr(ctx, xx + 3, L.base - 40, w - 7, 11, 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(xx + w / 2, L.base - 34.5, 3, 0, TAU); ctx.fill(); }
      });
      x += w;
    }
  },
  // the famous tangle of street power lines, strung between leaning poles
  vnWires(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 120 + rng() * 60) {
      wrapDraw(x - 4, 8, xx => { ctx.fillStyle = '#5a5a62'; ctx.fillRect(xx, L.base - 160, 5, 160); ctx.fillRect(xx - 8, L.base - 150, 21, 3); });
      for (let k = 0; k < 6; k++) { const y0 = L.base - 150 + k * 4 + rng() * 6, sag = 14 + rng() * 22; ctx.strokeStyle = `rgba(30,30,36,${0.55 + rng() * 0.3})`; ctx.lineWidth = 0.9 + rng(); ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 80, y0 + sag, x + 160, y0 + rng() * 6); ctx.stroke(); }
      ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x + 30, L.base - 138, 9, 6, 0, 0, TAU); ctx.fill();
    }
  },
  // misty limestone karsts rising from the bay, layer behind layer
  vnKarsts(ctx, L, rng, H) {
    const n = L.n || 9;
    for (let i = 0; i < n; i++) {
      const x = (i + rng() * 0.6) * BG_W / n, w = 50 + rng() * 70, h = (L.h || 140) * (0.6 + rng() * 0.6), seed = rng() * 100;
      wrapDraw(x - w, w * 2, ox => {
        const cx = ox + w;
        karst(ctx, cx, L.base, w, h, L.color, seed);
        if (L.green) { ctx.fillStyle = rgba(L.green, 0.7); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(cx - w * 0.3 + k * w * 0.12, L.base - h * 0.95 + Math.sin(k * 2 + seed) * 6, 5 + (k % 3) * 2, 0, TAU); ctx.fill(); } }
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(cx - w * 0.35, L.base - h * 0.6, 3, h * 0.5);
      });
    }
    if (L.mist) { ctx.fillStyle = vgrad(ctx, L.base - 40, L.base + 4, 'rgba(255,255,255,0)', rgba(L.mist, 0.75)); ctx.fillRect(0, L.base - 40, BG_W, 46); }
  },
  // emerald water with long, lazy reflections
  vnBay(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.color, shade(L.color, -0.4)); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let i = 0; i < 70; i++) { const x = rng() * BG_W, y = L.base + 3 + rng() * (H - L.base - 6), w = 8 + rng() * 26; ctx.fillStyle = `rgba(230,255,245,${0.12 + rng() * 0.18})`; ctx.fillRect(x, y, w, 1.2); }
  },
  // Hoi An's old merchant houses: ochre walls, tiled roofs, wooden shutters and strings of lanterns
  vnOldTown(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 70 + rng() * 50, h = 60 + rng() * 40, top = L.base - h;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(L.color, -0.05 + rng() * 0.08); ctx.fillRect(xx, top, w - 2, H - top);
        ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.moveTo(xx - 8, top + 4); ctx.lineTo(xx + 10, top - 16); ctx.lineTo(xx + w - 12, top - 16); ctx.lineTo(xx + w + 6, top + 4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(30,15,10,0.5)'; ctx.lineWidth = 1; for (let k = 0; k < w; k += 6) { ctx.beginPath(); ctx.moveTo(xx + k, top - 14); ctx.lineTo(xx + k - 4, top + 3); ctx.stroke(); }
        for (let k = 0; k < Math.floor(w / 26); k++) { const wx = xx + 8 + k * 26; ctx.fillStyle = L.night ? '#ffcf7a' : '#6a4a2a'; ctx.fillRect(wx, top + 16, 14, 18); ctx.fillStyle = '#3a2418'; ctx.fillRect(wx + 6, top + 16, 2, 18); }
        ctx.fillStyle = '#4a2a1a'; ctx.fillRect(xx + 4, L.base - 30, w - 10, 3);
        for (let k = 0; k < Math.floor(w / 18); k++) lantern(ctx, xx + 10 + k * 18, L.base - 22, 5, LANT[(k + Math.floor(xx)) % LANT.length], 0, !!L.night);
      });
      x += w + 4;
    }
  },
  // the river at night: dark water mirroring the lanterns
  vnRiverBg(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.color, shade(L.color, -0.5)); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let i = 0; i < 60; i++) { const x = rng() * BG_W, y = L.base + 4 + rng() * 50; ctx.fillStyle = rgba(LANT[i % LANT.length], 0.18 + rng() * 0.2); ctx.fillRect(x, y, 2 + rng() * 3, 6 + rng() * 14); }
  },
  // cave walls: layers of dark limestone with flowstone curtains, stalactites and a faint far opening
  vnCaveWall(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, 0.12), shade(L.color, -0.45)); ctx.fillRect(0, 0, BG_W, H);
    for (let i = 0; i < 26; i++) { const x = rng() * BG_W, w = 20 + rng() * 60, h = 40 + rng() * 160; ctx.fillStyle = rgba(shade(L.color, 0.18), 0.35); ctx.beginPath(); ctx.moveTo(x - w / 2, 0); ctx.quadraticCurveTo(x, h * 1.1, x + w / 2, 0); ctx.fill(); }
    for (let i = 0; i < 18; i++) { const x = rng() * BG_W, w = 30 + rng() * 50, h = 30 + rng() * 120; ctx.fillStyle = rgba(shade(L.color, 0.1), 0.45); ctx.beginPath(); ctx.moveTo(x - w / 2, H); ctx.quadraticCurveTo(x, H - h * 1.2, x + w / 2, H); ctx.fill(); }
    ctx.fillStyle = 'rgba(160,230,200,0.05)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rng() * BG_W, rng() * H, 2 + rng() * 6, 0, TAU); ctx.fill(); }
  },
  // the Noon Gate of the citadel on the horizon (a palace gate: drawn as a calm, plain silhouette)
  vnGate(ctx, L, rng, H) {
    const b = L.base;
    wrapDraw(L.at || 560, 300, ox => {
      const x = ox + 150;
      ctx.fillStyle = L.color; ctx.fillRect(x - 150, b - 50, 300, 50);
      ctx.fillStyle = shade(L.color, -0.15); for (let k = 0; k < 5; k++) { const dx = x - 110 + k * 55; ctx.beginPath(); ctx.moveTo(dx - 12, b); ctx.lineTo(dx - 12, b - 26); ctx.arc(dx, b - 26, 12, Math.PI, TAU); ctx.lineTo(dx + 12, b); ctx.fill(); }
      for (const [dx, w, h] of [[0, 120, 46], [-110, 60, 30], [110, 60, 30]]) {
        const px = x + dx, py = b - 50;
        ctx.fillStyle = shade(L.color, 0.08); ctx.fillRect(px - w / 2 + 6, py - h, w - 12, h);
        ctx.fillStyle = L.roof || '#7a3a2a'; ctx.beginPath(); ctx.moveTo(px - w / 2 - 10, py - h + 4); ctx.quadraticCurveTo(px, py - h - 16, px + w / 2 + 10, py - h + 4); ctx.lineTo(px + w / 2 - 4, py - h - 8); ctx.lineTo(px - w / 2 + 4, py - h - 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = L.roof || '#7a3a2a'; ctx.beginPath(); ctx.moveTo(px - w / 2 + 2, py - h * 0.45); ctx.quadraticCurveTo(px, py - h * 0.45 - 10, px + w / 2 - 2, py - h * 0.45); ctx.lineTo(px + w / 2 - 8, py - h * 0.45 - 6); ctx.lineTo(px - w / 2 + 8, py - h * 0.45 - 6); ctx.closePath(); ctx.fill();
      }
    });
  },
  // red flame trees (phuong vi) in full bloom along the moat
  vnFlameTrees(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 20; x < BG_W; x += 90 + rng() * 70) {
      const h = 60 + rng() * 40;
      wrapDraw(x - 50, 100, xx => {
        const px = xx + 50;
        ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, b + 2); ctx.lineTo(px, b - h * 0.6); ctx.moveTo(px, b - h * 0.5); ctx.quadraticCurveTo(px - 20, b - h * 0.7, px - 34, b - h * 0.8); ctx.moveTo(px, b - h * 0.55); ctx.quadraticCurveTo(px + 22, b - h * 0.75, px + 36, b - h * 0.82); ctx.stroke();
        for (let k = 0; k < 16; k++) { ctx.fillStyle = ['#e8322a', '#ff5a2a', '#c8221a', '#ff7a3a'][k % 4]; ctx.beginPath(); ctx.ellipse(px - 44 + rng() * 88, b - h * 0.75 - rng() * h * 0.3, 10 + rng() * 8, 6 + rng() * 4, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(60,120,40,0.6)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(px - 36 + rng() * 72, b - h * 0.7 - rng() * h * 0.2, 5, 0, TAU); ctx.fill(); }
      });
    }
  }
};
const dyn = {
  // junk boats with ribbed, bat-wing sails gliding across the bay
  vnJunks(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 3; i++) {
      const x = ((i * 380 + t * (8 + i * 3) - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (L.base - L.top + 6 + i * 4) * S, s = S * (0.7 + i * 0.12);
      for (const xx of [x, x - BG_W * S]) {
        if (xx < -100 * S || xx > W + 100 * S) continue;
        ctx.save(); ctx.translate(xx, y); ctx.scale(s, s);
        ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(34, -6); ctx.lineTo(26, 4); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill();
        for (const [mx, sh] of [[-12, 34], [10, 42]]) { ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx, -4); ctx.lineTo(mx, -4 - sh); ctx.stroke(); ctx.fillStyle = '#c8622a'; ctx.beginPath(); ctx.moveTo(mx, -4 - sh); ctx.quadraticCurveTo(mx + 22, -4 - sh * 0.6, mx + 16, -8); ctx.lineTo(mx, -8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(90,30,10,0.6)'; ctx.lineWidth = 0.8; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(mx, -4 - sh + k * sh / 5); ctx.lineTo(mx + 18 - k * 1.5, -4 - sh + k * sh / 5 + 3); ctx.stroke(); } }
        ctx.restore();
      }
    }
  },
  // lantern strings swaying over the old-town river; floating lotus lanterns drifting on it
  vnLanterns(ctx, L, camX, oy, S, W, t) {
    for (let s = 0; s < 2; s++) {
      const off = ((s * 300 - camX * (L.f + 0.05 * s)) % 600 + 600) % 600;
      for (let x0 = -off; x0 < W / S + 600; x0 += 600) {
        const y0 = (40 + s * 34) * S + oy * 0;
        ctx.strokeStyle = 'rgba(40,20,20,0.6)'; ctx.lineWidth = S; ctx.beginPath(); ctx.moveTo(x0 * S, y0); ctx.quadraticCurveTo((x0 + 300) * S, y0 + 60 * S, (x0 + 600) * S, y0); ctx.stroke();
        for (let k = 1; k < 12; k++) { const u = k / 12, lx = (x0 + u * 600) * S, ly = y0 + Math.sin(u * Math.PI) * 30 * S + 8 * S + Math.sin(t * 1.5 + k) * 1.5 * S; ctx.save(); ctx.translate(lx, ly); ctx.scale(S, S); lantern(ctx, 0, 0, 5.5, LANT[(k + s) % LANT.length], t); ctx.restore(); }
      }
    }
  },
  vnFloaters(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 9; i++) {
      const x = ((i * 117 + t * (6 + (i % 3) * 3) - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (L.base - L.top + 10 + (i % 4) * 9) * S;
      if (x > W) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
      ctx.fillStyle = '#ff7aa8'; for (let k = 0; k < 6; k++) { ctx.save(); ctx.rotate(-Math.PI / 2 + (k - 2.5) * 0.4); ctx.beginPath(); ctx.ellipse(0, -5, 2.4, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -3, 1, 0, -3, 14); g.addColorStop(0, 'rgba(255,200,110,0.7)'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -3, 14, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,190,100,0.25)'; ctx.fillRect(-1.5, 2, 3, 10 + Math.sin(t * 2 + i) * 3);
      ctx.restore();
    }
  },
  // a sunbeam pouring down the cave's skylight
  vnSkylight(ctx, L, camX, oy, S, W, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const x = (W * (0.3 + i * 0.22) - camX * 0.02 * S), a = 0.05 + 0.03 * Math.sin(t * 0.7 + i); const g = ctx.createLinearGradient(x, 0, x + 60 * S, 448 * S); g.addColorStop(0, `rgba(220,255,210,${a})`); g.addColorStop(1, 'rgba(220,255,210,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 20 * S, 0); ctx.lineTo(x + 40 * S, 0); ctx.lineTo(x + 140 * S, 448 * S); ctx.lineTo(x + 30 * S, 448 * S); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
};

/* ---------------- tiles ---------------- */
// the item block: a red silk lantern in a wooden frame
function lanternBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,180,90,0.9)'; ctx.shadowBlur = 5 + f * 1.5;
  ctx.fillStyle = '#5a2a14'; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.fill(); ctx.restore();
  const g = ctx.createRadialGradient(TS / 2 - 3, TS / 2 - 3, 2, TS / 2, TS / 2, 13); g.addColorStop(0, '#ffe0a0'); g.addColorStop(0.5, '#ff5a3a'); g.addColorStop(1, '#b8221a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2, 11.5, 10.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(120,20,10,0.6)'; ctx.lineWidth = 0.8; for (const rx of [3.5, 7.5]) { ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2, rx, 10.5, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(TS / 2 - 6, 4, 12, 3); ctx.fillRect(TS / 2 - 6, TS - 7, 12, 3);
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(TS / 2 - 5, TS / 2 + 5); ctx.lineTo(TS / 2, TS / 2 + 1); ctx.lineTo(TS / 2 + 5, TS / 2 + 5); ctx.stroke();
  const sx = -8 + f * 12; ctx.save(); rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#2a140a'; ctx.lineWidth = 1.2; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.stroke();
}
function lanternUsed(ctx) { ctx.fillStyle = '#6a4a3a'; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.fill(); ctx.fillStyle = '#8a5a4a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 + 1, 10, 9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.stroke(); }
const pavement = { style: 'vnPave', cap: '#8a8a8a', capHi: '#c8c8c0', dirt: '#7a7068', dirt2: '#4a4440', rock: '#8a8078',
  paint(ctx, rng) { for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { ctx.fillStyle = ['#8a8078', '#9a9088', '#7a7068'][Math.floor(rng() * 3)]; ctx.fillRect(k * 16 + 1, r * 16 + 1, 14, 14); } ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 15, TS, 2); ctx.fillRect(15, 0, 2, TS); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#b8b0a0'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = 'rgba(60,50,40,0.35)'; for (let x = x0 + 8; x < x1; x += 16) ctx.fillRect(x, 1, 1, 5); }
};
const limestone = { style: 'grass', cap: '#5aa84a', capHi: '#9ad86a', dirt: '#a8a89a', dirt2: '#6a6e64', rock: '#c8c8b8',
  paint(ctx, rng) { ctx.strokeStyle = 'rgba(60,70,60,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); let x = rng() * TS; ctx.moveTo(x, 0); for (let y = 0; y <= TS; y += 6) { x += (rng() - 0.5) * 6; ctx.lineTo(x, y); } ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(rng() * TS, 0, 2, TS); ctx.fillStyle = 'rgba(70,120,60,0.3)'; ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 2 + rng() * 2, 0, TAU); ctx.fill(); }
};
const caveRock = { style: 'mineral', cap: '#7a8a7a', capHi: '#a8c0a8', dirt: '#4a4e4a', dirt2: '#22262a', rock: '#6a706a',
  paint(ctx, rng) { for (let y = 2; y < TS; y += 7) { ctx.fillStyle = `rgba(${rng() < 0.5 ? '180,200,180' : '20,24,28'},0.14)`; ctx.fillRect(0, y + Math.sin(y + rng() * 6) * 1.5, TS, 3); } ctx.fillStyle = 'rgba(140,255,200,0.25)'; if (rng() < 0.3) { ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 1.4, 0, TAU); ctx.fill(); } }
};
const citadelFloor = { style: 'vnTiles', cap: '#a8402a', capHi: '#e87a5a', dirt: '#8a3a24', dirt2: '#5a2414', rock: '#a85a3a',
  paint(ctx, rng) { for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { ctx.fillStyle = ['#9a3a24', '#a8442a', '#8a3220'][Math.floor(rng() * 3)]; ctx.fillRect(k * 16 + (r % 2) * 8 - 8, r * 8, 15, 7); } },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8a03a'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#ffe08a'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = '#8a2a1a'; for (let x = x0 + 4; x < x1; x += 10) ctx.fillRect(x, 2, 4, 2); }
};
const yellowBrick = { style: 'brick', c1: '#f2c45a', c2: '#c8902a', mortar: '#7a5a2a' };
const lacquer = { style: 'plank', c1: '#c8322a', c2: '#7a1a12', paint(ctx, part, x0, x1) { ctx.fillStyle = '#a8241a'; rr(ctx, x0, 0, x1 - x0, 9, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0 + 1, 1, x1 - x0 - 2, 1.5); ctx.fillRect(x0 + 1, 7, x1 - x0 - 2, 1); ctx.fillStyle = 'rgba(255,220,120,0.6)'; for (let x = x0 + 6; x < x1 - 3; x += 10) { ctx.beginPath(); ctx.arc(x, 4.5, 1.3, 0, TAU); ctx.fill(); } } };
const bambooRaft = { style: 'vnBamboo', paint(ctx, part, x0, x1) { for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#c8b45a' : '#b0a048'; rr(ctx, x0, k * 3, x1 - x0, 3.4, 1.6); ctx.fill(); } ctx.fillStyle = 'rgba(80,60,20,0.6)'; for (let x = x0 + 7; x < x1 - 2; x += 12) ctx.fillRect(x, 0, 1.6, 9); } };
const base = {
  brick: yellowBrick, hard: { c1: '#b8b0a0', c2: '#7a7468' }, semi: { style: 'plank', c1: '#8a5a3a', c2: '#5a3a24' },
  pillar: { c1: '#c8322a', c2: '#7a1a12', cap: '#ffd23a', style: 'column' }, accent: COL.a, qblockArt: lanternBlock, usedArt: lanternUsed, tint: {}, bloom: 0.17
};
const themes = {
  vn_street: Object.assign({}, base, {
    name: 'Train Street', music: 'tour_vn', particles: 'dust',
    sky: ['#5aa0d8', '#bfe0f0', '#fff4dc'], horizonGlow: '#ffe8c0',
    celestial: { type: 'sun', x: 0.7, y: 0.14, r: 30, color: '#fffbe8', glow: '#ffe8b0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'vnTubeHouses', color: '#c8b8a8', base: 300, f: 0.05, blur: true, dim: -0.12 },
      { kind: 'vnTubeHouses', color: '#d8c8b8', base: 340, f: 0.14 },
      { kind: 'vnWires', color: '#2a2a30', base: 330, f: 0.22 }
    ],
    fog: '#fff0d8', ground: pavement, decor: ['vnStools', 'vnPlants', 'vnBirdcage', 'vnStools']
  }),
  vn_bay: Object.assign({}, base, {
    name: 'Ha Long Bay', music: 'tour_vn', particles: 'none',
    sky: ['#7ab0d8', '#cfe6ec', '#f2f6e8'], horizonGlow: '#f4ffe8',
    celestial: { type: 'sun', x: 0.3, y: 0.2, r: 30, color: '#fffbec', glow: '#fff4c8' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'vnKarsts', color: '#a8bcc4', base: 286, h: 150, f: 0.02, blur: true, n: 8, mist: '#e8f4f0' },
      { kind: 'vnKarsts', color: '#6a8c84', base: 296, h: 120, f: 0.05, n: 10, green: '#4a7a4a', mist: '#d8ece4' },
      { kind: 'vnBay', color: '#3aa894', base: 298, f: 0.08, dyn: 'vnJunks' }
    ],
    fog: '#e8f8f0', liquid: 'vn_bay', ground: limestone, hard: { c1: '#b8b8a8', c2: '#7a7c70' }, semi: bambooRaft,
    decor: ['vnTuft', 'vnTuft', 'vnCrabPot']
  }),
  vn_river: Object.assign({}, base, {
    name: 'Hoi An Lantern River', music: 'tour_vn_night', particles: 'fireflies',
    sky: ['#0c0a24', '#24183e', '#4a2a4a'], horizonGlow: '#ff9a5a',
    celestial: { type: 'moon', x: 0.82, y: 0.14, r: 22, color: '#fff6e0', glow: '#ffd8a0' }, stars: 0.5,
    layers: [
      { kind: 'vnOldTown', color: '#c8943a', base: 316, f: 0.1, night: true, dyn: 'vnLanterns' },
      { kind: 'vnRiverBg', color: '#1a2a44', base: 322, f: 0.14, dyn: 'vnFloaters' }
    ],
    fog: '#ff9a5a', liquid: 'vn_river', ground: { style: 'vnRiverStone', cap: '#8a7a5a', capHi: '#c8b88a', dirt: '#6a5a40', dirt2: '#3a3020', rock: '#8a7a60' },
    decor: ['vnLanternPost', 'vnPlants', 'vnLanternPost']
  }),
  vn_cave: Object.assign({}, base, {
    name: 'Phong Nha Cave', music: 'tour_vn_cave', particles: 'motes',
    sky: ['#0a1410', '#06100c', '#020604'], horizonGlow: '#3a8a6a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'vnCaveWall', color: '#1e2a26', base: 0, f: 0.05, dyn: 'vnSkylight' }],
    fog: '#3a6a5a', darkness: 0.45, ground: caveRock, hard: { c1: '#6a706a', c2: '#2e322e' }, semi: { style: 'plank', c1: '#6a5a40', c2: '#3a3020' },
    decor: ['vnFungi', 'vnPearls', 'vnFungi']
  }),
  vn_citadel: Object.assign({}, base, {
    name: 'Hue Citadel', music: 'tour_vn', particles: 'petals',
    sky: ['#e8a05a', '#f8d8a8', '#fff2dc'], horizonGlow: '#ffd8a0',
    celestial: { type: 'sun', x: 0.2, y: 0.25, r: 36, color: '#fff2d0', glow: '#ffc880' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'vnGate', color: '#b89a7a', base: 300, f: 0.04, at: 420, roof: '#8a4a32' },
      { kind: 'vnFlameTrees', color: '#5a6a3a', base: 342, f: 0.14 }
    ],
    fog: '#ffe8d0', liquid: 'vn_coffee', ground: citadelFloor, brick: { style: 'brick', c1: '#c8322a', c2: '#8a1a12', mortar: '#ffd23a' }, semi: lacquer,
    hard: { c1: '#c8b090', c2: '#8a7058' }, decor: ['vnUrnPot', 'vnBonsai', 'vnUrnPot']
  })
};

/* ---------------- decor ---------------- */
const decor = {
  // a stack of low plastic street-food stools (and a bowl of pho on top)
  vnStools(ctx, x, y, t, th, d) {
    const cols = ['#e8323a', '#2a6ad8', '#2aa86a', '#ffb02a'];
    for (let k = 0; k < 3; k++) { const c = cols[(d.seed + k) % 4], yy = y - k * 9; ctx.fillStyle = c; rr(ctx, x - 9, yy - 10, 18, 4, 1.5); ctx.fill(); ctx.fillRect(x - 8, yy - 7, 2.5, 7); ctx.fillRect(x + 5.5, yy - 7, 2.5, 7); }
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x, y - 30, 8, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b86a'; ctx.beginPath(); ctx.ellipse(x, y - 31, 6, 1.8, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 3 + k * 3 + Math.sin(ph * 6) * 2, y - 34 - ph * 16, 2 + ph * 3, 0, TAU); ctx.fill(); }
  },
  vnPlants(ctx, x, y) { ctx.fillStyle = '#a85a3a'; ctx.beginPath(); ctx.moveTo(x - 9, y - 12); ctx.lineTo(x + 9, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y); ctx.fill(); ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x - 8 + k * 4, y - 18 - (k % 2) * 5, 4, 8, -0.6 + k * 0.3, 0, TAU); ctx.fill(); } },
  vnBirdcage(ctx, x, y, t) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1.5, y - 44, 3, 44); ctx.fillRect(x - 1.5, y - 44, 14, 2); ctx.strokeStyle = '#c8a05a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 11, y - 42); ctx.lineTo(x + 11, y - 38); ctx.stroke(); for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + 11 + k * 2.4, y - 37); ctx.quadraticCurveTo(x + 11 + k * 3.2, y - 26, x + 11 + k * 2.4, y - 18); ctx.stroke(); } ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 11 + Math.sin(t * 3) * 2, y - 24, 3, 0, TAU); ctx.fill(); },
  vnTuft(ctx, x, y, t) { for (let k = -3; k <= 3; k++) { ctx.strokeStyle = k % 2 ? '#4a8a3a' : '#6aa84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.quadraticCurveTo(x + k * 5, y - 10, x + k * 8 + Math.sin(t + k) * 1.5, y - 16 - (k % 3) * 3); ctx.stroke(); } },
  vnCrabPot(ctx, x, y) { ctx.fillStyle = '#b89a5a'; ctx.beginPath(); ctx.ellipse(x, y - 10, 12, 10, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 12, y - 10, 24, 10); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 5, y); ctx.lineTo(x + k * 4, y - 19); ctx.stroke(); } for (const yy of [y - 5, y - 12]) { ctx.beginPath(); ctx.moveTo(x - 12, yy); ctx.lineTo(x + 12, yy); ctx.stroke(); } },
  vnLanternPost(ctx, x, y, t) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, y - 62, 4, 62); ctx.fillRect(x - 14, y - 60, 28, 3); lantern(ctx, x - 11, y - 50, 6, '#e8323a', t); lantern(ctx, x + 11, y - 48, 6, '#ffb02a', t + 1); },
  vnFungi(ctx, x, y, t) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [dx, s] of [[-6, 1], [3, 0.7], [9, 0.5]]) { const a = 0.6 + 0.3 * Math.sin(t * 2 + dx); ctx.fillStyle = `rgba(120,255,200,${a})`; ctx.beginPath(); ctx.ellipse(x + dx, y - 9 * s, 6 * s, 3.5 * s, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = `rgba(200,255,230,${a * 0.6})`; ctx.fillRect(x + dx - 1, y - 9 * s, 2, 9 * s); } ctx.restore(); },
  vnPearls(ctx, x, y) { for (const [dx, r] of [[-6, 4], [0, 5], [6, 3.5], [3, 3]]) { const g = ctx.createRadialGradient(x + dx - 1, y - r - 1, 0.5, x + dx, y - r, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8c0b0'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y - r, r, 0, TAU); ctx.fill(); } },
  vnUrnPot(ctx, x, y) { ctx.fillStyle = '#2a5a8a'; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x - 14, y - 14, x - 7, y - 24); ctx.lineTo(x + 7, y - 24); ctx.quadraticCurveTo(x + 14, y - 14, x + 8, y); ctx.fill(); ctx.strokeStyle = '#e8f0ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - 12, 5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x - 6 + k * 4, y - 28, 3, 6, -0.5 + k * 0.33, 0, TAU); ctx.fill(); } },
  vnBonsai(ctx, x, y) { ctx.fillStyle = '#8a4a2a'; rr(ctx, x - 12, y - 7, 24, 7, 2); ctx.fill(); ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.quadraticCurveTo(x - 8, y - 16, x + 2, y - 22); ctx.quadraticCurveTo(x + 10, y - 26, x + 6, y - 32); ctx.stroke(); ctx.fillStyle = '#3a7a3a'; for (const [dx, dy, r] of [[-6, -22, 6], [6, -32, 7], [10, -24, 5]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r * 1.4, r * 0.8, 0, 0, TAU); ctx.fill(); } },
  // a doorstep with its folding shutter and a little shop sign: the safe spot when the train comes
  vnDoorstep(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    // a raised tiled porch with a few steps (the front of a house on Train Street)
    ctx.fillStyle = '#b8a890'; ctx.fillRect(x0, top, d.w, d.h); ctx.fillStyle = '#d8c8b0'; ctx.fillRect(x0, top, d.w, 4);
    for (let k = 32; k < d.h; k += 32) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x0, top + k - 2, d.w, 2); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, top + k, d.w, 2); }
    ctx.fillStyle = 'rgba(160,60,40,0.35)'; for (let k = 8; k < d.w - 4; k += 12) ctx.fillRect(x0 + k, top + 10, 6, 6);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x0 + 6, top - 50, d.w - 12, 50); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; for (let k = 4; k < 50; k += 5) { ctx.beginPath(); ctx.moveTo(x0 + 6, top - k); ctx.lineTo(x0 + d.w - 6, top - k); ctx.stroke(); }
    ctx.fillStyle = LANT[d.seed % LANT.length]; rr(ctx, x0 + 2, top - 66, d.w - 4, 12, 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, top - 60, 3.5, 0, TAU); ctx.fill();
  },
  // a tall, skinny tube house: its flat roof is the platform (rooftops of the Old Quarter)
  vnRoofHouse(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, w = d.w, top = y - d.h, s = d.seed;
    const cols = ['#f2d27a', '#f4b0a0', '#9ad4c8', '#b0c8f0', '#f6e6c8', '#c8e09a'];
    ctx.fillStyle = cols[s % cols.length]; ctx.fillRect(x0, top + 6, w, d.h - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x0, top + 6, 4, d.h - 6); ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0 + w - 6, top + 6, 6, d.h - 6);
    for (let fy = top + 22, k = 0; fy < y - 30; fy += 64, k++) {
      for (let wx = x0 + 10; wx + 16 <= x0 + w - 10; wx += 28) { ctx.fillStyle = '#3a4656'; ctx.fillRect(wx, fy, 16, 22); ctx.fillStyle = (s + k) % 2 ? '#3a8a5a' : '#2a7a9a'; ctx.fillRect(wx - 5, fy, 5, 22); ctx.fillRect(wx + 16, fy, 5, 22); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(wx - 5, fy + 22, 26, 2); }
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(x0 + 4, fy + 32, w - 8, 2); ctx.fillRect(x0 + 4, fy + 42, w - 8, 1.5); for (let bx = x0 + 6; bx < x0 + w - 4; bx += 6) ctx.fillRect(bx, fy + 32, 1.4, 10);
      if ((s + k) % 3 !== 2) { const px = x0 + 12 + ((s * 7 + k * 13) % Math.max(1, w - 34)); ctx.fillStyle = '#b8603a'; ctx.fillRect(px, fy + 24, 9, 8); ctx.fillStyle = '#4a9a3a'; ctx.beginPath(); ctx.arc(px + 4.5, fy + 21, 7, 0, TAU); ctx.fill(); }
    }
    // the flat roof's concrete parapet: the bit Brady stands on
    ctx.fillStyle = '#d8d0c0'; ctx.fillRect(x0 - 2, top, w + 4, 8); ctx.fillStyle = '#eeeae2'; ctx.fillRect(x0 - 2, top, w + 4, 2); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 - 2, top + 8, w + 4, 2);
  },
  // the rails and sleepers down the middle of the street
  vnTrack(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#5a4030'; for (let k = 4; k < d.w; k += 14) ctx.fillRect(x0 + k, y - 3, 8, 3); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x0, y - 5, d.w, 2); ctx.fillStyle = '#d8dce0'; ctx.fillRect(x0, y - 5, d.w, 0.8); }
};
const decorLights = { vnLanternPost: [110, '#ffa040', -50], vnFungi: [70, '#5affb4', -8] };

/* ---------------- enemies ---------------- */
// a wind-up tin toy scooter, piled impossibly high with cargo
const scooterArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const zoom = m === 'charge', wob = zoom ? Math.sin(t * 40) * 0.6 : 0;
  ctx.fillStyle = '#2a2a30'; for (const wx of [-11, 11]) { ctx.beginPath(); ctx.arc(wx, -5, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.arc(wx, -5, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a30'; }
  ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(10, -8); ctx.quadraticCurveTo(16, -9, 17, -16); ctx.lineTo(13, -18); ctx.lineTo(8, -12); ctx.lineTo(-14, -13); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(13, -17); ctx.lineTo(15, -27); ctx.lineTo(9, -27); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(17, -16, 2.2, 0, TAU); ctx.fill();
  // the cargo stack: crates, a mattress, a potted plant
  ctx.save(); ctx.rotate(wob * 0.05);
  ctx.fillStyle = '#c8a06a'; ctx.fillRect(-16, -22, 16, 9); ctx.fillStyle = '#e8e0f0'; rr(ctx, -18, -31, 20, 9, 3); ctx.fill(); ctx.fillStyle = '#7ab8e8'; ctx.fillRect(-14, -38, 12, 7); ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(-8, -42, 5, 0, TAU); ctx.fill();
  ctx.restore();
  // the wind-up key
  ctx.fillStyle = '#c8c8d0'; ctx.save(); ctx.translate(-17, -12); ctx.rotate(t * (zoom ? 18 : 5)); ctx.fillRect(-1, -5, 2, 10); ctx.beginPath(); ctx.ellipse(0, -6, 4, 2, 0, 0, TAU); ctx.ellipse(0, 6, 4, 2, 0, 0, TAU); ctx.fill(); ctx.restore();
  if (m !== 'flat') K.eyes(ctx, 8, -11, 1, 2, 1.5, zoom);
  ctx.restore();
  if (zoom) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - e.dir * (22 + k * 6), y - 8 - k * 6); ctx.lineTo(x - e.dir * (34 + k * 6), y - 8 - k * 6); ctx.stroke(); } }
};
const baoArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : m === 'hop' ? 1.08 : 1; ctx.scale(e.dir * (2 - sq), sq);
  const g = ctx.createRadialGradient(-3, -14, 2, 0, -10, 15); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ecdcc4');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-15, -16, -3, -20); ctx.lineTo(0, -24); ctx.lineTo(3, -20); ctx.quadraticCurveTo(15, -16, 13, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(180,150,110,0.6)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 1.5, -22); ctx.quadraticCurveTo(k * 5, -14, k * 6, -6); ctx.stroke(); }
  ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(0, -21, 1.6, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -10, 1, 3, 2, false); ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(2, -5, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
  if (m === 'walk' && e.onGround) for (let k = 0; k < 2; k++) { const ph = (t * 0.8 + k * 0.5) % 1; ctx.fillStyle = `rgba(255,255,255,${0.3 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + k * 4 - 2, y - 26 - ph * 14, 2 + ph * 3, 0, TAU); ctx.fill(); }
};
const rollArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 8);
  if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 14 * e.dir); else ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const g = ctx.createLinearGradient(0, -7, 0, 7); g.addColorStop(0, '#f0b050'); g.addColorStop(1, '#a8601a');
  ctx.fillStyle = g; rr(ctx, -13, -7, 26, 14, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,230,160,0.5)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 5, -2 + (k % 2) * 3, 1.5, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(120,60,10,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 4); ctx.stroke();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, 6, -2, 1, 2.4, 1.8, true);
  ctx.restore();
};
const shrimpArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const punch = m === 'charge' ? 8 : m === 'notice' ? -3 : 0;
  const cols = ['#2ad8a0', '#ff5a3a', '#3a8aff', '#ffd23a'];
  for (let k = 0; k < 5; k++) { ctx.fillStyle = cols[k % 4]; ctx.beginPath(); ctx.ellipse(-12 + k * 5, -8 + Math.abs(k - 2) * 0.8, 4, 5.5, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ff7a3a'; ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(-22, -12); ctx.lineTo(-22, 0); ctx.fill();
  ctx.fillStyle = '#e8402a'; ctx.beginPath(); ctx.ellipse(10 + punch, -7, 5, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd8c8'; ctx.beginPath(); ctx.arc(14 + punch, -7, 2.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a8a6a'; ctx.lineWidth = 1.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(10 + s * 2, -20); ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(10 + s * 2, -21, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(10 + s * 2, -21, 0.9, 0, TAU); ctx.fill(); }
  ctx.restore();
  if (m === 'charge') { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + e.dir * 22, y - 7, 4 + k * 3, -0.8, 0.8); ctx.stroke(); } }
};
const squidArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(m === 'up' ? 0 : Math.PI);
  ctx.fillStyle = '#f0c8d8'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(9, -4, 7, 6); ctx.lineTo(-7, 6); ctx.quadraticCurveTo(-9, -4, 0, -14); ctx.fill();
  ctx.fillStyle = '#ff9ac0'; ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(-12, -12); ctx.lineTo(-6, -2); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -6); ctx.lineTo(12, -12); ctx.lineTo(6, -2); ctx.fill();
  ctx.strokeStyle = '#f0c8d8'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 2.5, 6); ctx.quadraticCurveTo(k * 3 + Math.sin(e.t * 12 + k) * 2, 12, k * 3, 18); ctx.stroke(); }
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-3, 1, 1.5, 0, TAU); ctx.arc(3, 1, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
};
const birdArt = (dark, beak) => (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 16 : 9));
  ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-16, -10 - f * 8, -26, -4 - f * 10); ctx.lineTo(-20, 1); ctx.lineTo(-6, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(12, -10 - f * 8, 22, -4 - f * 10); ctx.lineTo(18, 1); ctx.lineTo(4, 4); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 11, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11, -1, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = beak; ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(22, 0); ctx.lineTo(14, 1); ctx.fill();
  ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.arc(12, -2, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
const mosquitoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * 60);
  ctx.fillStyle = 'rgba(220,230,255,0.6)'; ctx.beginPath(); ctx.ellipse(-2, -6 - f * 2, 7, 3, -0.5, 0, TAU); ctx.ellipse(2, -6 + f * 2, 7, 3, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a3a4a'; ctx.beginPath(); ctx.ellipse(-4, 0, 6, 3, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(4, -1, 3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(13, 3); ctx.stroke(); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-3 + k * 3, 2); ctx.lineTo(-6 + k * 4, 9); ctx.stroke(); }
  ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(5, -2, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
const toadArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#6a7a3a'; ctx.beginPath(); ctx.ellipse(0, -8, 12, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a9a4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-6 + k * 3, -11 + (k % 2) * 3, 1.6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e8d870'; ctx.beginPath(); ctx.ellipse(4, -3, 7, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a7a3a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(4 + s * 4, -15, 3.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffd23a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(5 + s * 4, -15.5, 2, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) ctx.fillRect(4 + s * 4, -16, 2.4, 1);
  ctx.restore();
};
const goiArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#c8b8a0', 4, 5, m === 'stun');
  ctx.translate(0, -5); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = 'rgba(250,245,235,0.85)'; rr(ctx, -8, -28, 16, 28, 7); ctx.fill();
  ctx.fillStyle = '#ff8a6a'; for (const [dx, dy] of [[-3, -20], [3, -12]]) { ctx.beginPath(); ctx.arc(dx, dy, 3.4, Math.PI * 0.2, Math.PI * 1.6); ctx.lineWidth = 2.4; ctx.strokeStyle = '#ff8a6a'; ctx.stroke(); }
  ctx.fillStyle = 'rgba(80,170,70,0.75)'; ctx.fillRect(-6, -8, 12, 4);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -24, 1, 2.4, 1.8, true);
  ctx.restore();
};
const caveCrabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, m === 'flat' ? 0.4 : 1);
  ctx.strokeStyle = '#e8e0f0'; ctx.lineWidth = 1.6; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 6, -6); ctx.lineTo(s * (11 + k * 2), -8 + k * 3 + Math.sin(t * 14 + k) * 1.5); ctx.lineTo(s * (13 + k * 2), 0); ctx.stroke(); }
  ctx.fillStyle = '#f4eef8'; ctx.beginPath(); ctx.ellipse(0, -7, 10, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8d8f0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 12, -12, 4.5, 3, s * 0.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(150,150,170,0.6)'; ctx.fillRect(-4, -12, 8, 1.5);
  ctx.restore();
};
const beanArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#3a2010', 4, 5, m === 'stun');
  ctx.translate(0, -5); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const g = ctx.createRadialGradient(-3, -16, 2, 0, -11, 12); g.addColorStop(0, '#8a5a32'); g.addColorStop(1, '#3a2010');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -11, 9, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a0c04'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(-4, -11, 0, 0); ctx.stroke();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, -13, 1, 2.4, 1.8, true);
  ctx.restore();
};
// the mantis shrimp: its punch knocks Brady clean off his feet
class VnShrimp extends TourEnemy {
  constructor(g, s) { super(g, s, { w: 30, h: 20, speed: 0.8, behavior: 'charge', range: 6, chargeSpeed: 7, windup: 0.5, chargeT: 0.7, art: shrimpArt, burst: '#2ad8a0', onNotice: e => K.say(e.g, e, 'POW?', '#ffd23a') }); }
  touchPlayer(p) { if (this.dead || this.stunT > 0) return; if (this.state === 'charge' && !p.invuln && !p.star) { p.vx = this.dir * 9 * TS; p.vy = -6 * TS; K.say(this.g, p, 'POW!', '#ff7a3a'); } p.hurt(this); }
}
const enemies = {
  vnScooter: { cls: TourEnemy.make({ w: 36, h: 30, inkPad: 6, speed: 1.4, behavior: 'charge', range: 8, chargeSpeed: 8.2, windup: 0.6, chargeT: 1.5, art: scooterArt, burst: '#e8323a', onNotice: e => { K.say(e.g, e, 'BEEP BEEP!', '#ffd23a'); TourKit.sfx('bike_bell', 'select2', { vol: 0.4, pitch: 1.3 }); } }), place: 'walk' },
  vnBao: { cls: TourEnemy.make({ w: 26, h: 24, speed: 1.0, behavior: 'hop', hopV: 9, hopEvery: 1.3, art: baoArt, burst: '#ffffff' }), place: 'walk' },
  vnRoll: { cls: TourEnemy.make({ w: 26, h: 16, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6.4, rollT: 2.4, art: rollArt, burst: '#f0b050' }), place: 'walk' },
  vnShrimp: { cls: VnShrimp, place: 'walk' },
  vnSquid: { cls: TourLeaper.make({ w: 20, h: 26, jumpV: 16, every: 1.7, art: squidArt, splash: '#bff8e8', stompable: true }), place: 'here' },
  vnCormorant: { cls: TourFlyer.make({ w: 30, h: 16, range: 3.5, speed: 0.9, swoop: true, art: birdArt('#1e2028', '#e8a03a'), burst: '#1e2028' }), place: 'fly' },
  vnMosquito: { cls: TourFlyer.make({ w: 18, h: 14, range: 2, speed: 2.2, swoop: true, art: mosquitoArt, burst: '#3a3a4a', onSwoop: e => TourKit.sfx('mosquito', null, { vol: 0.25 }) }), place: 'fly' },
  vnToad: { cls: TourEnemy.make({ w: 24, h: 18, speed: 0.9, behavior: 'hop', hopV: 10, hopEvery: 1.5, art: toadArt, burst: '#6a7a3a' }), place: 'walk' },
  vnGoi: { cls: TourEnemy.make({ w: 18, h: 36, speed: 1.0, behavior: 'walk', art: goiArt, burst: '#f4f0e8' }), place: 'walk' },
  vnBat: { cls: TourFlyer.make({ w: 28, h: 14, range: 2.5, speed: 1.3, swoop: true, art: birdArt('#2a2430', '#2a2430'), burst: '#2a2430' }), place: 'fly' },
  vnCaveCrab: { cls: TourEnemy.make({ w: 28, h: 16, speed: 1.1, behavior: 'walk', edgeTurn: true, art: caveCrabArt, burst: '#f4eef8' }), place: 'walk' },
  vnBean: { cls: TourEnemy.make({ w: 20, h: 30, speed: 1.2, behavior: 'walk', art: beanArt, burst: '#5a3a1a' }), place: 'walk' }
};

/* ---------------- the noodle lasso: hooks, the swing, the pull ---------------- */
// something to lasso: a knot in the tangled wires, a tree growing out of a karst, a lantern ring, a stalactite
class VnHook extends Ent {
  constructor(g, s) {
    super(g, s, 24, 24); this.look = s.look || 'knot'; this.hook = true; this.flash = 0; this.anchor = null;
    // a branch grows out of the underside of the rock above it
    if (this.look === 'branch' && g.area) { const A = g.area, tx = Math.floor(this.cx / TS); for (let ty = Math.floor(this.cy / TS) - 1; ty > Math.floor(this.cy / TS) - 7 && ty >= 0; ty--) if (SOLID[A.tiles[ty * A.W + tx]]) { this.anchor = (ty + 1) * TS; break; } }
  }
  update(dt) { this.t += dt; if (this.flash > 0) this.flash -= dt; }
  draw(ctx) {
    const x = this.cx, y = this.cy, t = this.t, near = this.near > 0;
    if (this.look === 'knot') {
      ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1.4; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 160, y - 30 + k * 4); ctx.quadraticCurveTo(x - 60, y - 8 + k * 3, x, y + k * 2 - 4); ctx.quadraticCurveTo(x + 60, y - 8 + k * 3, x + 160, y - 34 + k * 4); ctx.stroke(); }
      ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1a1a20'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.6) * 3, y + Math.sin(k * 1.6) * 3, 5, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#5a5a68'; rr(ctx, x - 6, y + 6, 12, 9, 2); ctx.fill();
    } else if (this.look === 'branch') {
      // a gnarled cliff tree hanging from the rock, its tip curling down to a vine loop
      const d0 = this.s.dir || 1, ay = this.anchor != null ? this.anchor : y - 22, k = y - ay;
      ctx.strokeStyle = '#4a3424'; ctx.lineCap = 'round';
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - d0 * 16, ay - 2); ctx.bezierCurveTo(x - d0 * 30, ay + k * 0.45, x + d0 * 14, ay + k * 0.55, x, y); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - d0 * 4, ay - 2); ctx.quadraticCurveTo(x + d0 * 2, ay + 10, x + d0 * 14, ay + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - d0 * 22, ay + k * 0.4); ctx.quadraticCurveTo(x - d0 * 34, ay + k * 0.5, x - d0 * 36, ay + k * 0.62); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#2f6a34'; for (const [dx, dy, r] of [[-d0 * 6, 6, 10], [d0 * 14, 14, 8], [-d0 * 34, k * 0.62, 8], [-d0 * 18, k * 0.35, 7], [d0 * 6, k * 0.72, 7]]) { ctx.beginPath(); ctx.arc(x + dx, ay + dy, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4a9a46'; for (const [dx, dy, r] of [[-d0 * 3, 3, 6], [d0 * 15, 11, 5], [-d0 * 32, k * 0.58, 5]]) { ctx.beginPath(); ctx.arc(x + dx, ay + dy, r, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 3, 4, 0, TAU); ctx.stroke();
    } else if (this.look === 'lantern') {
      ctx.strokeStyle = 'rgba(60,30,20,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 140, y - 26); ctx.quadraticCurveTo(x, y + 8, x + 140, y - 26); ctx.stroke();
      ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y - 4, 5, 0, TAU); ctx.stroke();
      lantern(ctx, x, y + 10, 8, LANT[Math.floor(this.s.x / 37) % LANT.length], t);
    } else {
      ctx.fillStyle = '#7a8a84'; ctx.beginPath(); ctx.moveTo(x - 15, y - 42); ctx.lineTo(x + 15, y - 42); ctx.lineTo(x + 5, y); ctx.quadraticCurveTo(x, y + 12, x - 5, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(220,255,240,0.35)'; ctx.fillRect(x - 7, y - 38, 2.5, 32);
      // glow-worms on the rock show where the stalactite is in the dark
      for (let k = 0; k < 5; k++) { const a = 0.7 + 0.3 * Math.sin(t * 3 + k * 1.7); ctx.fillStyle = `rgba(140,255,220,${a})`; ctx.beginPath(); ctx.arc(x - 8 + (k * 7) % 16, y - 34 + k * 6, 1.4, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#c8b88a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 2, 4, 0, TAU); ctx.stroke();
    }
    if (this.flash > 0 || this.hint) { ctx.strokeStyle = `rgba(255,240,180,${this.flash > 0 ? this.flash : 0.35 + 0.25 * Math.sin(t * 5)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y + 2, 11 + Math.sin(t * 5) * 1.5, 0, TAU); ctx.stroke(); }
  }
  get light() { return this.look === 'lantern' ? { r: 80, c: 'rgba(255,170,80,', x: this.cx, y: this.cy + 10 } : this.look === 'stalactite' ? { r: 60, c: 'rgba(120,255,210,', x: this.cx, y: this.cy - 14 } : null; }
}
const handOf = p => ({ x: p.cx + p.facing * (p.small ? 6 : 9), y: p.y + (p.small ? 8 : 14) });
function findHook(p, g) {
  const h0 = handOf(p); let best = null, bs = 1e9;
  for (const e of g.entities) {
    if (!e.hook || e.remove) continue;
    const dx = e.cx - h0.x, dy = e.cy - h0.y, d = Math.hypot(dx, dy);
    if (d > 6.8 * TS || dy > -0.4 * TS || dx * p.facing < -1.6 * TS) continue;
    const score = d - (dx * p.facing > 0 ? 40 : 0);
    if (score < bs) { bs = score; best = e; }
  }
  return best;
}
// how long the noodle may hang under a hook before Brady's feet would dip into the water (or hit the floor) below it
function ropeRoom(g, h, p) {
  const A = g.area, tx = Math.floor(h.cx / TS); let ty = Math.floor(h.cy / TS) + 1;
  while (ty < A.H) { const t = A.tiles[ty * A.W + tx]; if (SOLID[t] || t === T.LAVA || t === T.WATER) break; ty++; }
  return clamp(ty * TS - h.cy - (p.h - (p.small ? 8 : 14)) - 6, 1.8 * TS, 7 * TS);
}
function attachSwing(p, g, h) {
  const hd = handOf(p), room = ropeRoom(g, h, p);
  let L = clamp(Math.hypot(hd.x - h.cx, hd.y - h.cy), 1.8 * TS, Math.min(6.8 * TS, room));
  // thrown from the ground, the noodle yanks him up so the swing's low point is level with where he stood (no slamming into the ledge)
  if (p.onGround) L = Math.max(1.8 * TS, Math.min(L - 12, hd.y - h.cy + 4));
  const th = Math.atan2(hd.x - h.cx, hd.y - h.cy), om = (p.vx * Math.cos(th) - p.vy * Math.sin(th)) / L;
  p._sw = { h, L, th, om, x: p.x, y: p.y, k: 0, room };
  p.onGround = false; p.jumping = false; p.ride = null; p.spin = false;
  h.flash = 0.6; Sound.play('throw', { pitch: 0.7, vol: 0.5 }); TourKit.sfx('spring', null, { pitch: 1.6, vol: 0.25 });
}
function releaseSwing(p, fling) {
  const s = p._sw; p._sw = null; if (!s) return;
  // letting go with JUMP springs him off the noodle; for a moment he floats like a held jump
  if (fling) { p.vy = Math.min(p.vy, 0) - 7 * TS; p._fling = 0.3; p.g.burst(p.cx, p.y + 8, 8, NOODLE, 'spark'); }
  p.airMax = Math.max(PHYS.walk, Math.abs(p.vx)); p.jumping = false;
}
function stepSwing(p, dt, inp, g) {
  const s = p._sw, h = s.h;
  if (!h || h.remove || p.dead || p.inWater || p.state !== 'play') { p._sw = null; return; }
  s.k += dt;
  if (s.k > 0.12 && Input.jumpPressed) { releaseSwing(p, true); return; }
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), G = 62 * TS;
  // pushing the way he's already swinging pumps the swing higher (pushing against it does nothing)
  const pump = dir && s.om * dir > -0.4 ? dir * 4.2 * Math.cos(s.th) : 0;
  s.om += (-(G / s.L) * Math.sin(s.th) + pump) * dt;
  s.om *= Math.pow(0.9, dt);
  if (inp.up) s.L = Math.max(1.6 * TS, s.L - 3.4 * TS * dt); else if (inp.down) s.L = Math.min(s.room || 7 * TS, s.L + 3 * TS * dt);
  s.th += s.om * dt;
  if (Math.abs(s.th) > 1.4) { s.th = sign(s.th) * 1.4; s.om *= -0.2; }
  const off = p.small ? 8 : 14, nx = h.cx + Math.sin(s.th) * s.L - p.w / 2, ny = h.cy + Math.cos(s.th) * s.L - off;
  // undo this frame's free fall, then move along the arc through the tiles (walls stop him)
  p.x = s.x; p.y = s.y; p.vx = (nx - p.x) / dt; p.vy = (ny - p.y) / dt;
  moveBody(p, g.area, dt, { semis: false });
  if (p.hitWall || p.bonks) s.om *= -0.25;
  if (p.onGround) { s.x = p.x; s.y = p.y; releaseSwing(p, false); return; }
  s.x = p.x; s.y = p.y;
  const v = s.om * s.L; p.vx = Math.cos(s.th) * v; p.vy = -Math.sin(s.th) * v;
  p.jumping = false; p.coyote = 0; p.airMax = Math.max(PHYS.walk, Math.abs(p.vx)); p.ride = null;
  if (Math.abs(p.vx) > 4) p.facing = sign(p.vx);
}
// a lash of noodle: snags an enemy (knocked out), yanks a moored boat over, or tugs the boss's lid
function lash(p, g) {
  const hd = handOf(p), reach = 4.6 * TS;
  p._lash = { t: 0.22, x: hd.x + p.facing * reach, y: hd.y };
  const box = { x: p.facing > 0 ? hd.x : hd.x - reach, y: hd.y - 14, w: reach, h: 28 };
  for (const e of g.entities) {
    if (!e.enemy || e.dead || e.remove || e.boss || !overlap(box, e)) continue;
    if (e.hit('disc', p)) { g.addScore(150, e.cx, e.y); g.burst(e.cx, e.cy, 10, NOODLE, 'spark'); p._lash.x = e.cx; p._lash.y = e.cy; return; }
  }
  const b = g.boss; if (b && !b.dead && overlap(box, b)) { p._lash.x = b.cx; p._lash.y = b.cy; if (b.brain.onLasso) b.brain.onLasso(b); else b.hit('disc', p); }
}
// a moored boat in front of Brady that a THROW would pull over
function pullTarget(p, g) {
  const hd = handOf(p);
  for (const e of g.entities) if (e.pullable && !e.remove && e.canPull() && Math.abs(e.cx - hd.x) < 11 * TS && (e.cx - hd.x) * p.facing > 0 && Math.abs(e.cy - hd.y) < 3.5 * TS) return e;
  return null;
}
const power = {
  id: 'noodle', name: 'NOODLE LASSO', country: 'vn', hint: 'THROW AT A HOOK TO SWING · JUMP LETS GO', time: 0, cooldown: 0.25,
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(0, 4, 11, 5, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(-11, 2, 22, 3);
    ctx.fillStyle = '#3a8aff'; ctx.fillRect(-10, 5, 20, 1.5);
    ctx.strokeStyle = NOODLE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, 2); for (let k = 0; k < 5; k++) ctx.quadraticCurveTo(-5 + k * 3, -6 - (k % 2) * 4, -3 + k * 3, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(10, -14, 2, -12 + Math.sin(t * 4) * 1.5); ctx.stroke();
    ctx.fillStyle = '#5ab84a'; ctx.beginPath(); ctx.ellipse(-4, 1, 2.4, 1.2, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
  },
  action(p, g) {
    if (p._sw) { releaseSwing(p, false); return true; }
    const h = findHook(p, g); if (h) { attachSwing(p, g, h); return true; }
    const e = pullTarget(p, g);
    if (e) { e.pull(p); p._lash = { t: 0.35, x: e.cx, y: e.y + 4 }; Sound.play('throw', { pitch: 0.8, vol: 0.5 }); return true; }
    lash(p, g); Sound.play('throw', { pitch: 1.3, vol: 0.45 }); return true;
  },
  update(p, dt, inp, g) {
    if (p._sw) stepSwing(p, dt, inp, g);
    if (p._fling > 0) { p._fling -= dt; if (p.vy < 0 && !p.onGround && !p._sw) p.vy -= (PHYS.gDown - PHYS.gUp) * dt; }
    if (p._lash) { p._lash.t -= dt; if (p._lash.t <= 0) p._lash = null; }
    // the nearest hook in reach gets a faint ring, so the player knows THROW will catch it
    if (Math.floor(p.anim.t * 10) % 3 === 0) { const h = p._sw ? null : findHook(p, g), b = h || p._sw ? null : pullTarget(p, g); for (const e of g.entities) { if (e.hook) e.hint = e === h; else if (e.pullable) e.hint = e === b; } }
  },
  drawOn(p, ctx, t) {
    const hd = handOf(p);
    const line = (tx, ty, sag) => {
      ctx.strokeStyle = '#d8c48a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hd.x, hd.y);
      const mx = (hd.x + tx) / 2 + Math.sin(t * 12) * 2, my = (hd.y + ty) / 2 + sag; ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
      ctx.strokeStyle = NOODLE; ctx.lineWidth = 2; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#5ab84a'; for (let k = 1; k < 4; k++) { const u = k / 4, x = (1 - u) * (1 - u) * hd.x + 2 * (1 - u) * u * mx + u * u * tx, y = (1 - u) * (1 - u) * hd.y + 2 * (1 - u) * u * my + u * u * ty; ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.1, k, 0, TAU); ctx.fill(); }
    };
    if (p._sw) { const h = p._sw.h; line(h.cx, h.cy, 4); }
    else if (p._lash) { const k = p._lash.t; line(lerp(hd.x, p._lash.x, Math.min(1, (0.25 - k) * 9 + 0.3)), p._lash.y, 6 * Math.sin(k * 30)); }
    else { ctx.strokeStyle = NOODLE; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.cx - p.facing * 6, p.y + p.h * 0.62, 5, 3.5, 0, 0, TAU); ctx.stroke(); }
  }
};
// a pho cart: hands Brady a bowl (and its noodle lasso) whenever he has none
class VnPho extends Ent {
  constructor(g, s) { super(g, s, 50, 52); this.cool = 0; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; }
  touchPlayer(p) { if (this.cool > 0 || p.dead || (p.sig && p.sig.id === 'noodle')) return; this.cool = 1.2; K.say(this.g, this, 'ONE PHO TO GO! (NOODLES INCLUDED)', '#7affd8'); TourKit.sfx('gift', 'appear'); p.collect('sig:noodle'); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, has = this.g.player && this.g.player.sig && this.g.player.sig.id === 'noodle';
    K.shadow(ctx, x, y, 26);
    ctx.fillStyle = '#3a3a44'; for (const wx of [x - 16, x + 16]) { ctx.beginPath(); ctx.arc(wx, y - 6, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a7ad8'; rr(ctx, x - 24, y - 30, 48, 20, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 24, y - 22, 48, 3);
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x - 22, y - 46, 3, 16); ctx.fillRect(x + 19, y - 46, 3, 16);
    ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(x - 28, y - 46); ctx.lineTo(x + 28, y - 46); ctx.lineTo(x + 24, y - 52); ctx.lineTo(x - 24, y - 52); ctx.fill();
    ctx.fillStyle = '#b8b8c0'; rr(ctx, x - 16, y - 44, 14, 14, 2); ctx.fill(); ctx.fillStyle = '#8a8a96'; ctx.fillRect(x - 17, y - 45, 16, 3);
    for (let k = 0; k < 4; k++) { const ph = (t * 0.5 + k / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 9 + Math.sin(ph * 6 + k) * 3, y - 48 - ph * 26, 3 + ph * 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x + 9, y - 33, 8, 3.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = NOODLE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 3, y - 34); ctx.quadraticCurveTo(x + 8, y - 40 + Math.sin(t * 3) * 2, x + 14, y - 34); ctx.stroke();
    if (!has) { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('PHO!', x, y - 58 + Math.sin(t * 4) * 1.5); }
  }
}
// a sampan moored across the river (painted eyes on the bow, a lantern on a pole): lasso it and it comes to you,
// then it drifts home to its mooring, carrying whoever hopped aboard
class VnBoat extends Ent {
  constructor(g, s) { super(g, s, (s.pw || 3) * TS, 12); this.isPlatform = true; this.pullable = true; this.x = s.ax * TS; this.ax = s.ax * TS; this.bx = s.bx * TS; this.y = s.y - 6; this.base = this.y; this.state = 'home'; this.k = 0; this.dx = 0; this.dy = 0; }
  canPull() { return this.state === 'home'; }
  pull(p) { this.state = 'pull'; K.say(this.g, this, 'HEAVE HO!', '#ffd84a'); }
  update(dt) {
    this.t += dt; const ox = this.x, oy = this.y;
    if (this.state === 'pull') { this.x = approach(this.x, this.bx, 4.2 * TS * dt); if (this.x === this.bx) { this.state = 'wait'; this.k = 1.5; } }
    else if (this.state === 'wait') { this.k -= dt; if (this.k <= 0) this.state = 'back'; }
    else if (this.state === 'back') { this.x = approach(this.x, this.ax, 1.9 * TS * dt); if (this.x === this.ax) { this.state = 'home'; } }
    this.y = this.base + Math.sin(this.t * 2) * 1.5;
    this.dx = this.x - ox; this.dy = this.y - oy;
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t;
    // the woven bamboo canopy, mid-boat (behind whoever rides)
    const c0 = x + w * 0.42, cw = w * 0.46;
    ctx.fillStyle = '#5a3e22'; ctx.beginPath(); ctx.moveTo(c0, y - 2); ctx.lineTo(c0, y - 18); ctx.quadraticCurveTo(c0 + cw / 2, y - 36, c0 + cw, y - 18); ctx.lineTo(c0 + cw, y - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,180,110,0.45)'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { const u = k / 6; ctx.beginPath(); ctx.moveTo(c0 + u * cw, y - 2); ctx.lineTo(c0 + u * cw, y - 18 - Math.sin(u * Math.PI) * 9); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(c0, y - 12); ctx.quadraticCurveTo(c0 + cw / 2, y - 28, c0 + cw, y - 12); ctx.stroke();
    // the stern pole and its lantern
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 4, y - 2); ctx.lineTo(x + 2, y - 36); ctx.stroke(); lantern(ctx, x + 2, y - 32, 5, '#ffb02a', t);
    // the hull: bow and stern curl up out of the water
    ctx.fillStyle = '#3e2616'; ctx.beginPath();
    ctx.moveTo(x - 18, y - 10); ctx.quadraticCurveTo(x - 8, y - 1, x + 4, y); ctx.lineTo(x + w - 4, y); ctx.quadraticCurveTo(x + w + 8, y - 1, x + w + 18, y - 10);
    ctx.quadraticCurveTo(x + w + 12, y + 12, x + w - 10, y + 16); ctx.lineTo(x + 10, y + 16); ctx.quadraticCurveTo(x - 12, y + 12, x - 18, y - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8322a'; ctx.fillRect(x - 6, y + 2, w + 12, 3); ctx.fillStyle = '#2aa86a'; ctx.fillRect(x - 2, y + 6, w + 4, 2);
    ctx.fillStyle = '#7a5030'; ctx.fillRect(x, y - 3, w, 4); ctx.fillStyle = 'rgba(255,220,160,0.35)'; ctx.fillRect(x, y - 3, w, 1);
    // the painted eye on the bow
    const ex = x + w + 6; ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(ex, y + 1, 5, 3, -0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.arc(ex + 1, y + 1, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(ex + 1.4, y + 1, 1.1, 0, TAU); ctx.fill();
    // ripples at the waterline, a wake when it moves, the mooring rope when it's home
    ctx.strokeStyle = 'rgba(255,220,170,0.45)'; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; ctx.beginPath(); ctx.moveTo(x - 6 + ph * (w + 12), y + 13); ctx.lineTo(x - 6 + ph * (w + 12) + 10, y + 13); ctx.stroke(); }
    if (Math.abs(this.dx) > 0.2) { const back = this.dx > 0 ? x - 20 : x + w + 20, s = this.dx > 0 ? -1 : 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(back + s * k * 9, y + 10, 4 + k * 3, 0, Math.PI, true); ctx.stroke(); } }
    if (this.state === 'home') { ctx.strokeStyle = 'rgba(200,180,140,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w + 14, y - 8); ctx.quadraticCurveTo(x + w + 26, y + 6, x + w + 38, y - 14); ctx.stroke(); }
    if (this.hint && this.state === 'home') { ctx.strokeStyle = `rgba(255,240,180,${0.45 + 0.3 * Math.sin(t * 5)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 2, w / 2 + 14 + Math.sin(t * 5) * 2, 10, 0, 0, TAU); ctx.stroke(); }
  }
  get light() { return { r: 90, c: 'rgba(255,180,90,', x: this.x + this.w - 2, y: this.y - 30 }; }
}
// a bobbing fishing raft in the bay
class VnRaft extends Ent {
  constructor(g, s) { super(g, s, (s.pw || 3) * TS, 12); this.isPlatform = true; this.x = s.x - TS / 2; this.base = s.y + 26; this.y = this.base; this.ph = (s.x % 89) / 9; this.dx = 0; this.dy = 0; }
  update(dt) { this.t += dt; const ny = this.base + Math.sin(this.t * 1.8 + this.ph) * 3; this.dy = ny - this.y; this.y = ny; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w;
    ctx.fillStyle = '#4a8aa8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + 8 + k * (w - 16) / 2, y + 9, 7, 5, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#b89a5a'; ctx.fillRect(x - 2, y, w + 4, 6); ctx.fillStyle = 'rgba(80,60,20,0.5)'; for (let k = 4; k < w; k += 8) ctx.fillRect(x + k, y, 1.5, 6);
    ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w / 2, y - 22); ctx.lineTo(x + w - 4, y); ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + w / 2 - 6, y - 10, 12, 10);
  }
}
// the train: it rumbles down the street every so often (warning bell, flashing light); get up on a doorstep
class VnTrainSignal extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.x0 = s.x0 * TS; this.x1 = s.x1 * TS; this.gy = s.gy * TS; this.state = 'idle'; this.k = s.first || 2.5; this.train = null; this.period = s.period || 7.5; this.told = false; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    const near = p && p.cx > this.x0 - 6 * TS && p.cx < this.x1 + 2 * TS;
    if (this.state === 'idle') { if (near) this.k -= dt; if (this.k <= 0) { this.state = 'warn'; this.k = 1.9; Sound.play('checkpoint', { pitch: 1.6, vol: 0.5 }); if (!this.told) { this.told = true; g.toast('TRAIN COMING! GET UP ON A DOORSTEP'); } } }
    else if (this.state === 'warn') { this.k -= dt; if (Math.floor(this.k * 6) !== Math.floor((this.k + dt) * 6)) Sound.play('select2', { pitch: 1.9, vol: 0.25 }); if (this.k <= 0) { this.state = 'run'; this.train = new VnTrain(g, this.x1 + 2 * TS, this.gy); g.spawn(this.train); TourKit.sfx('artcarHorn', 'bump', { pitch: 0.7, vol: 0.6 }); g.shake(3); } }
    else if (this.state === 'run') { const tr = this.train; tr.x -= 15 * TS * dt; if (Math.random() < 0.3) g.shake(1.5); if (tr.x + tr.w < this.x0 - 2 * TS) { tr.remove = true; this.train = null; this.state = 'idle'; this.k = this.period; } }
  }
  draw(ctx) {
    const x = this.x1 + 1.5 * TS, y = this.gy, on = this.state === 'warn' || this.state === 'run', blink = on && Math.floor(this.t * 6) % 2;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 80, 4, 80);
    ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(x, y - 70); ctx.rotate(0.785); ctx.fillRect(-14, -3, 28, 6); ctx.rotate(-1.57); ctx.fillRect(-14, -3, 28, 6); ctx.restore();
    for (const s of [-1, 1]) { ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.arc(x + s * 8, y - 52, 6, 0, TAU); ctx.fill(); ctx.fillStyle = (blink ? s > 0 : s < 0) && on ? '#ff3a2a' : '#4a1a1a'; ctx.beginPath(); ctx.arc(x + s * 8, y - 52, 4, 0, TAU); ctx.fill(); }
  }
  get light() { return this.state === 'warn' || this.state === 'run' ? { r: 70, c: 'rgba(255,60,40,', x: this.x1 + 1.5 * TS, y: this.gy - 52 } : null; }
}
class VnTrain extends Ent {
  constructor(g, x, gy) { super(g, null, 15 * TS, 58); this.x = x; this.y = gy - 58; this.enemy = false; }
  update(dt) { this.t += dt; }
  touchPlayer(p) { if (p.y + p.h > this.y + 6) { p.vx = -5 * TS; p.vy = -7 * TS; p.hurt(this); } }
  draw(ctx) {
    const x = this.x, y = this.y, h = this.h;
    // the locomotive (heading left), then two passenger cars
    ctx.fillStyle = '#2a5a9a'; ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x + 5 * TS, y); ctx.lineTo(x + 5 * TS, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + 22); ctx.quadraticCurveTo(x + 4, y + 2, x + 20, y); ctx.fill();
    ctx.fillStyle = '#f2e8d0'; ctx.fillRect(x + 4, y + 30, 5 * TS - 4, 8); ctx.fillStyle = '#e8323a'; ctx.fillRect(x + 2, y + 38, 5 * TS - 2, 4);
    ctx.fillStyle = '#bfe0ff'; rr(ctx, x + 10, y + 8, 22, 16, 3); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x + 4, y + 34, 2, x + 4, y + 34, 50); g.addColorStop(0, 'rgba(255,250,200,0.9)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 4, y + 34, 50, 0, TAU); ctx.fill(); ctx.restore();
    for (let c = 0; c < 2; c++) {
      const cx = x + 5 * TS + 4 + c * 5 * TS;
      ctx.fillStyle = '#3a3a44'; ctx.fillRect(cx - 4, y + h - 16, 8, 6);
      ctx.fillStyle = '#e8e0c8'; rr(ctx, cx, y + 2, 5 * TS - 6, h - 2, 4); ctx.fill();
      ctx.fillStyle = '#2a5a9a'; ctx.fillRect(cx, y + 34, 5 * TS - 6, 6);
      ctx.fillStyle = '#5a7aa8'; for (let k = 0; k < 6; k++) rr(ctx, cx + 8 + k * 24, y + 10, 16, 14, 2), ctx.fill();
    }
    ctx.fillStyle = '#1a1a20'; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.arc(x + 20 + k * 46, y + h, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + this.w + 10 + k * 14 + (this.t * 60 % 14), y + h - 6 - k * 3, 5 + k * 2, 0, TAU); ctx.fill(); }
  }
  get light() { return { r: 120, c: 'rgba(255,240,180,', x: this.x + 4, y: this.y + 34 }; }
}
// an ice cube floating in the hot coffee: it melts while you stand on it, sinks when it's gone, then floats back up
class VnIce extends Ent {
  constructor(g, s) { super(g, s, (s.pw || 2) * TS, 14); this.isPlatform = true; this.full = this.w; this.x = s.x - TS / 2; this.mx = this.x + this.w / 2; this.base = s.y - 2; this.y = this.base; this.melt = 0; this.gone = 0; this.dx = 0; this.dy = 0; this.ph = (s.x % 61) / 7; }
  update(dt) {
    this.t += dt; const p = this.g.player, on = p && p.ride === this && !this.gone;
    if (this.gone > 0) { this.gone -= dt; if (this.gone <= 0) { this.gone = 0; this.melt = 0.85; } }
    else {
      this.melt = clamp(this.melt + (on ? dt / 2.6 : -dt / 1.6), 0, 1);
      if (this.melt >= 1) { this.gone = 2.4; Sound.play('splash', { pitch: 1.4, vol: 0.4 }); this.g.burst(this.mx, this.base + 6, 10, '#e8f8ff', 'spark'); if (p && p.ride === this) p.ride = null; }
    }
    const w = Math.max(6, this.full * (1 - this.melt * 0.85)), oy = this.y;
    this.w = w; this.x = this.mx - w / 2; this.y = this.base + Math.sin(this.t * 2 + this.ph) * 1.5 + this.melt * 6;
    this.dead = this.gone > 0;
    this.dx = 0; this.dy = this.y - oy;
    if (on && Math.random() < 0.3) this.g.burst(this.cx + (Math.random() - 0.5) * w, this.y + 8, 1, '#e8f8ff', 'spark');
  }
  draw(ctx) {
    if (this.dead) { ctx.fillStyle = 'rgba(220,245,255,0.8)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(this.mx - 10 + k * 10, this.base + 12 + Math.sin(this.t * 3 + k) * 1.5, 3, 1.6, 0, 0, TAU); ctx.fill(); } return; }
    const x = this.x, y = this.y, w = this.w, k = this.melt;
    ctx.fillStyle = 'rgba(210,240,255,0.88)'; rr(ctx, x, y - 4, w, 18 - k * 6, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(120,180,220,0.9)'; ctx.lineWidth = 1.4; rr(ctx, x, y - 4, w, 18 - k * 6, 5); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x + 4, y - 2, Math.max(2, w * 0.3), 3);
    if (k > 0.2) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 3; i++) { const ph = (this.t * 0.7 + i / 3) % 1; ctx.beginPath(); ctx.arc(x + w * (0.2 + i * 0.3), y - 6 - ph * 16, 2 + ph * 3, 0, TAU); ctx.fill(); } }
  }
}
// a coffee roaster drum: it turns, smokes, and spits hot roasted beans in arcs
class VnRoaster extends Ent {
  constructor(g, s) { super(g, s, 44, 48); this.dirC = s.dir || -1; this.every = s.period || 2.4; this.k = s.phase || 1; this.recoil = 0; }
  update(dt) {
    this.t += dt; this.recoil = Math.max(0, this.recoil - dt * 3);
    if (!this.g.onScreen(this, 3 * TS)) return;
    this.k -= dt;
    if (this.k <= 0) {
      this.k = this.every; this.recoil = 1; Sound.play('kick', { pitch: 1.5, vol: 0.4 });
      for (let n = 0; n < 2; n++) tourFire(this.g, this.cx + this.dirC * 20, this.y + 12, { kind: 'bean', vx: this.dirC * (3.2 + n * 1.6) * TS, vy: -(7 + n * 2) * TS, grav: PHYS.gDown * 0.5, w: 12, h: 12, life: 3, stompable: true, thru: true, col: '#5a3218', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 9); ctx.fillStyle = '#5a3218'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4.4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, 2, 5, 0); ctx.stroke(); ctx.restore(); } });
    }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 16, y - 18, 4, 18); ctx.fillRect(x + 12, y - 18, 4, 18);
    ctx.fillStyle = '#e8622a'; ctx.beginPath(); ctx.arc(x, y - 14, 5, Math.PI, TAU); ctx.fill();
    ctx.save(); ctx.translate(x - this.recoil * 3 * this.dirC, y - 30);
    ctx.fillStyle = '#8a6a3a'; rr(ctx, -20, -12, 40, 24, 10); ctx.fill();
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1.5; ctx.save(); ctx.rotate(this.t * 2); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(this.dirC * 20, 0, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.arc(this.dirC * 20, 0, 3.4, 0, TAU); ctx.fill();
    ctx.restore();
    for (let k = 0; k < 3; k++) { const ph = (this.t * 0.6 + k / 3) % 1; ctx.fillStyle = `rgba(120,100,90,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 6 + Math.sin(ph * 5 + k) * 4, y - 46 - ph * 30, 4 + ph * 6, 0, TAU); ctx.fill(); }
  }
}
/* ---------------- the boss arena: the citadel courtyard and the great kettle ---------------- */
// A giant kettle hangs on a chain from the courtyard's lacquered beam. Stomp one of the two foot pedals and the chain
// yanks: the kettle swings up to that side, then crashes down and sweeps across the courtyard. It passes harmlessly over
// Brady (he pulled it), but when it crashes into Ong Phin it blasts him with steam. Timing is everything: catch him
// standing still (dripping, wobbling after a slide, blowing, conducting).
const inArenaOf = (b, e) => e.cx >= b.arenaX0 - TS && e.cx <= b.arenaX1 + TS;
class VnKettle extends Ent {
  constructor(g, s) {
    super(g, s, 60, 54); this.friendly = true; this.ghost = true;
    this.px = s.x; this.py = -120; this.ax0 = s.ax0 * TS; this.ax1 = s.ax1 * TS;
    this.L = s.y - 0.5 * TS - this.h / 2 - this.py;   // a long chain from high above: the kettle skims half a tile over the floor at the low point
    this.a = 0; this.av = 0; this.tug = 0; this.hitT = 0; this.place();
  }
  place() { this.x = this.px + Math.sin(this.a) * this.L - this.w / 2; this.y = this.py + Math.cos(this.a) * this.L - this.h / 2; }
  get swinging() { return Math.abs(this.av) > 0.35; }
  // a pedal stomp: the chain is yanked and the kettle swings up to that side, then falls through and across
  pull(dir) {
    this.av = clamp(this.av + dir * 1.25, -1.5, 1.5); if (sign(this.av) !== dir) this.av = dir * 1.25;
    this.tug = 0.4; Sound.play('bump', { pitch: 0.5, vol: 0.8 }); this.g.burst(this.cx, this.y, 8, '#c8ccd8', 'spark');
  }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.tug > 0) this.tug -= dt; if (this.hitT > 0) this.hitT -= dt;
    const G = PHYS.gDown * 0.5;
    this.av += -(G / this.L) * Math.sin(this.a) * dt; this.av *= Math.max(0, 1 - 0.16 * dt); this.a += this.av * dt;
    if (Math.abs(this.a) < 0.02 && Math.abs(this.av) < 0.08) { this.a = 0; this.av = 0; }
    this.place();
    const b = g.boss;
    if (b && !b.remove && b.state === 'fight' && b.hurtT <= 0 && this.swinging && this.hitT <= 0 && overlap(this, b)) {
      const r = b.hit('hazard', this);
      if (r) { this.hitT = 0.5; this.av *= -0.35; g.burst(this.cx, this.cy, 36, '#ffffff', 'dust'); g.burst(this.cx, this.cy, 14, '#e8f4ff', 'spark'); Sound.play('splash', { pitch: 0.5, vol: 0.9 }); }
    }
  }
  get light() { return { r: 120, col: '#ffb070', x: this.cx, y: this.cy }; }
  draw(ctx) {
    const t = this.g.t, cx = this.cx, cy = this.cy;
    // the lacquered beam across the courtyard, its brackets, and the chains from the pedals
    ctx.fillStyle = '#a8241a'; rr(ctx, this.ax0 - 8, this.py - 14, this.ax1 - this.ax0 + 16, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(this.ax0 - 6, this.py - 12, this.ax1 - this.ax0 + 12, 2); ctx.fillRect(this.ax0 - 6, this.py - 4, this.ax1 - this.ax0 + 12, 1.5);
    ctx.fillStyle = '#7a1a12'; for (let x = this.ax0 + 24; x < this.ax1; x += 64) { ctx.beginPath(); ctx.moveTo(x - 10, this.py); ctx.lineTo(x + 10, this.py); ctx.lineTo(x, this.py + 10); ctx.fill(); }
    ctx.strokeStyle = '#5a5a66'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    for (const px of [this.ax0 + TS * 1.5, this.ax1 - TS * 1.5]) { ctx.beginPath(); ctx.moveTo(px, this.py); ctx.lineTo(px, this.g.boss ? this.g.boss.floorY - 12 : this.py + 400); ctx.stroke(); }
    // the chain down to the kettle (it twangs on a tug)
    ctx.beginPath(); ctx.moveTo(this.px, this.py); const mx = (this.px + cx) / 2 + (this.tug > 0 ? Math.sin(t * 60) * 4 : 0), my = (this.py + this.y) / 2; ctx.quadraticCurveTo(mx, my, cx, this.y + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.arc(this.px, this.py, 5, 0, TAU); ctx.fill();
    // the kettle itself, hanging straight down from its handle (it tilts with the swing)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.a * 0.6);
    if (this.swinging) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-sign(this.av) * (36 + k * 8), -10 + k * 10); ctx.lineTo(-sign(this.av) * (52 + k * 10), -12 + k * 10); ctx.stroke(); } }
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -22, 16, Math.PI, TAU); ctx.stroke();
    const kg = ctx.createRadialGradient(-8, -4, 4, 0, 4, 34); kg.addColorStop(0, '#6a6a7a'); kg.addColorStop(1, '#22222c');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.ellipse(0, 4, 29, 23, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a48'; rr(ctx, -12, -24, 24, 8, 3); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.arc(0, -24, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(24, -4); ctx.quadraticCurveTo(40, -10, 40, -22); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-10, -4, 8, 12, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HOT', 0, 8);
    ctx.restore();
    // it is boiling: steam from the spout, a whole cloud after a hit
    const n = this.hitT > 0 ? 9 : 3;
    for (let k = 0; k < n; k++) { const ph = (t * 0.8 + k / n) % 1, big = this.hitT > 0; ctx.fillStyle = `rgba(255,255,255,${(big ? 0.7 : 0.4) * (1 - ph)})`; ctx.beginPath(); ctx.arc(cx + (big ? (k - 4) * 9 : 40) + Math.sin(ph * 6 + k) * 5, cy - (big ? 6 : 24) - ph * (big ? 70 : 34), (big ? 8 : 3) + ph * (big ? 14 : 6), 0, TAU); ctx.fill(); }
  }
}
// a foot pedal on the floor: jump onto it and the chain yanks the kettle up on that side
class VnPedal extends Ent {
  constructor(g, s) { super(g, s, 44, 14); this.dirK = s.dir || -1; this.press = 0; this.cool = 0; }
  update(dt) { this.t += dt; if (this.press > 0) this.press -= dt; if (this.cool > 0) this.cool -= dt; }
  touchPlayer(p) { if (p.dead || this.cool > 0) return; if (p.vy > 0 && p.prevBottom <= this.y + 6) this.stomp(p); }
  stomp(p) {
    const g = this.g, k = g.entities.find(e => e instanceof VnKettle && !e.remove && Math.abs(e.px - this.cx) < 16 * TS);
    this.press = 0.45; this.cool = 0.7;
    if (p) { p.vy = -PHYS.stompV * 0.55; p.y = Math.min(p.y, this.y - p.h + 2); p.jumping = true; p.onGround = false; }
    Sound.play('kick', { pitch: 0.6 }); g.burst(this.cx, this.y, 8, '#ffd84a', 'spark'); g.parts.text(this.cx, this.y - 16, 'CLANK!', '#ffd84a'); g.shake(2);
    if (k) k.pull(this.dirK);
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, k = Math.min(1, this.press / 0.45);
    ctx.fillStyle = '#3a3a44'; rr(ctx, x - 24, y - 6, 48, 6, 2); ctx.fill();
    ctx.save(); ctx.translate(x - this.dirK * 20, y - 6); ctx.rotate(this.dirK * (0.32 - k * 0.3));
    ctx.fillStyle = '#c8322a'; rr(ctx, this.dirK > 0 ? -40 : 0, -8, 40, 8, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(this.dirK > 0 ? -34 : 6, -6, 28, 1.5);
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('STOMP', this.dirK > 0 ? -20 : 20, -1);
    ctx.restore();
    // a little arrow bobbing over the pedal when the kettle is at rest
    const kettle = this.g.entities.find(e => e instanceof VnKettle && !e.remove);
    if (kettle && !kettle.swinging && this.press <= 0) { ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 6)})`; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', x, y - 22 + Math.sin(this.t * 6) * 3); }
  }
}
// a paper lantern strung across the courtyard: it lights the dark phase, and Ong Phin can blow it out
class VnArenaLantern extends Ent {
  constructor(g, s) { super(g, s, 22, 28); this.col = LANT[(s.k || 0) % LANT.length]; this.lit = true; this.relight = 0; this.outIn = null; this.friendly = true; this.ghost = true; this.k = s.k || 0; }
  update(dt) {
    this.t += dt;
    if (this.outIn != null) { this.outIn -= dt; if (this.outIn <= 0) { this.outIn = null; this.lit = false; this.relight = 1.7 + this.k * 0.12; this.g.burst(this.cx, this.cy, 6, '#9a9aa0', 'dust'); Sound.play('bump', { pitch: 2, vol: 0.15 }); } }
    if (!this.lit) { this.relight -= dt; if (this.relight <= 0) { this.lit = true; this.g.burst(this.cx, this.cy, 6, this.col, 'spark'); Sound.play('pick', { pitch: 1.8, vol: 0.2 }); } } }
  blowOut(delay) { if (!this.lit || this.outIn != null) return; this.outIn = Math.max(0.001, delay || 0); }
  get light() { return this.lit && this.g.area.dark ? { r: 160, col: this.col } : null; }
  draw(ctx) {
    const t = this.g.t, x = this.cx + Math.sin(t * 1.2 + this.k) * 2, y = this.cy;
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(this.cx, this.y - 22); ctx.lineTo(x, y - 12); ctx.stroke();
    lantern(ctx, x, y, 11, this.lit ? this.col : shade(this.col, -0.55), t, this.lit && !!this.g.area.dark);
    if (!this.lit) { ctx.fillStyle = 'rgba(200,200,210,0.5)'; for (let q = 0; q < 2; q++) { const ph = (t * 0.9 + q / 2) % 1; ctx.beginPath(); ctx.arc(x + Math.sin(ph * 7) * 3, y - 14 - ph * 20, 2 + ph * 3, 0, TAU); ctx.fill(); } }
  }
}
// a puddle of spilled coffee: slippery as ice while it lasts
class VnPuddle extends Ent {
  constructor(g, x, y, w) { super(g, null, w || 90, 8); this.x = x - this.w / 2; this.y = y - 8; this.life = 7; }
  update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) this.remove = true; }
  touchPlayer(p) { if (p.onGround && !p.dead) { p.groundTile = T.ICE; if (!this.told) { this.told = true; K.say(this.g, p, 'SLIPPERY!', '#c8783a'); } } }
  draw(ctx) {
    const a = Math.min(1, this.life / 1.2), t = this.g.t;
    ctx.fillStyle = `rgba(90,40,16,${0.85 * a})`; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 6, this.w / 2, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,220,180,${0.35 * a})`; ctx.beginPath(); ctx.ellipse(this.cx - this.w * 0.2, this.y + 4, this.w * 0.18, 1.6, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.25 * (1 - ph) * a})`; ctx.beginPath(); ctx.arc(this.cx + (k ? 18 : -14), this.y - ph * 18, 2 + ph * 3, 0, TAU); ctx.fill(); }
  }
}
// a water puppet: it waits under a trapdoor in the courtyard, ripples as a warning, then pops up on its rod (phase 3)
class VnPuppet extends Ent {
  constructor(g, s) { super(g, s, 30, 56); this.floor = s.y; this.kind = s.kind || 0; this.state = 'down'; this.k = 0; this.active = false; this.every = 3.8; this.timer = 1 + (s.kind || 0) * 1.2; this.rise = 0; this.h = 0; this.y = this.floor; }
  pop(delay) { if (this.state === 'down') { this.state = 'warn'; this.k = 0.75 + (delay || 0); } }
  update(dt) {
    this.t += dt;
    if (this.active && this.state === 'down') { this.timer -= dt; if (this.timer <= 0) { this.timer = this.every; this.pop(0); } }
    if (this.state === 'warn') { this.k -= dt; if (this.k <= 0) { this.state = 'up'; this.k = 1.5; Sound.play('splash', { pitch: 1.2, vol: 0.5 }); this.g.burst(this.cx, this.floor, 12, '#8ad0ff', 'spark'); } }
    else if (this.state === 'up') { this.k -= dt; this.rise = Math.min(1, this.rise + dt * 5); if (this.k <= 0) this.state = 'sink'; }
    else if (this.state === 'sink') { this.rise -= dt * 3; if (this.rise <= 0) { this.rise = 0; this.state = 'down'; } }
    this.h = 56 * this.rise; this.y = this.floor - this.h; this.enemy = this.state === 'up';
  }
  touchPlayer(p) { if (this.state === 'up' && this.rise > 0.5 && !p.dead) p.hurt(this); }
  hit(kind) { return false; }
  draw(ctx) {
    const x = this.cx, fy = this.floor, t = this.t, r = this.rise;
    // the trapdoor pool in the floor, always visible so the spots are known
    ctx.fillStyle = '#2a5a8a'; ctx.beginPath(); ctx.ellipse(x, fy - 2, 22, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(140,210,255,0.8)'; ctx.beginPath(); ctx.ellipse(x, fy - 3, 17, 3, 0, 0, TAU); ctx.fill();
    if (this.state === 'warn') { ctx.strokeStyle = `rgba(200,240,255,${0.5 + 0.5 * Math.sin(t * 20)})`; ctx.lineWidth = 2; for (let k = 0; k < 2; k++) { const ph = (t * 2 + k / 2) % 1; ctx.beginPath(); ctx.ellipse(x, fy - 3, 6 + ph * 16, 1.5 + ph * 4, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 1.5, fy - 12 - Math.sin(t * 20) * 3, 3, 10); }
    if (r <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 60, fy - 200, 120, 200); ctx.clip(); ctx.translate(x, fy - 56 * r + 56);
    ctx.fillStyle = '#c8a05a'; ctx.fillRect(-2, -58, 4, 60);
    ctx.save(); ctx.rotate(Math.sin(t * 4) * 0.12 * r);
    if (this.kind === 0) {
      // a golden dragon, lacquered red
      ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(-6, -44, 10, -46); ctx.quadraticCurveTo(22, -42, 16, -30); ctx.quadraticCurveTo(6, -24, 12, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-8 + k * 5, -36 + k * 5); ctx.lineTo(-4 + k * 5, -46 + k * 5); ctx.lineTo(0 + k * 5, -36 + k * 5); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12, -42, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(13, -42, 1.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(28, -44); ctx.moveTo(18, -38); ctx.lineTo(27, -34); ctx.stroke();
    } else if (this.kind === 1) {
      // a white duck
      ctx.fillStyle = '#f8f4ec'; ctx.beginPath(); ctx.ellipse(0, -26, 16, 11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12, -42, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffb02a'; ctx.beginPath(); ctx.moveTo(18, -43); ctx.lineTo(28, -40); ctx.lineTo(18, -38); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -44, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.ellipse(-4, -26, 8, 5, -0.3, 0, TAU); ctx.fill();
    } else {
      // a water buffalo, black lacquer with gold horns
      ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.ellipse(-2, -24, 17, 11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(12, -34, 9, 7, 0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(10, -42, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(16, -36, 2, 0, TAU); ctx.fill();
    }
    ctx.restore(); ctx.restore();
  }
}
const entities = { vnHook: VnHook, vnPho: VnPho, vnBoat: VnBoat, vnRaft: VnRaft, vnTrainSignal: VnTrainSignal, vnIce: VnIce, vnRoaster: VnRoaster, vnKettle: VnKettle, vnPedal: VnPedal, vnArenaLantern: VnArenaLantern, vnPuppet: VnPuppet };

/* ---------------- set pieces ---------------- */
// the validator can't swing: give it an arc of standing spots under a hook (a swing carries Brady along it)
function swingGhosts(B, hx, hy, Lt, span, maxRow) { for (let a = -span; a <= span; a += 0.08) { const gx = Math.round(hx + Math.sin(a) * Lt), gy = Math.min(maxRow == null ? 99 : maxRow, Math.round(hy + Math.cos(a) * Lt + 1.4)); B.ghosts.push([gx, gy]); } }
// the bay and the river: a pit with deadly water two rows below the ledges
function water(st, x0, x1) { st.pit(x0, x1); st.B.fill(x0, st.gy + 1, x1, st.H - 1, T.LAVA); }
const P = {
  // a pho cart: Brady gets a bowl, and with it a noodle lasso
  pho(st, o) { const x = st.x; st.floor(x, x + 8); st.spawn('vnPho', x + 4, st.gy - 1, {}); st.sign(x + 7, 'THROW near a hook to lasso it and swing. JUMP lets go. UP and DOWN reel the noodle in and out.'); return x + 9; },

  /* 10-1: Train Street */
  // stacked plastic stools to climb
  stools(st, o) { const x = st.x, B = st.B; st.floor(x, x + 12); for (const [dx, h] of [[2, 1], [4, 2], [6, 3], [9, 2]]) { B.fill(x + dx, st.gy - h, x + dx, st.gy - 1, T.HARD); B.setHide(x + dx, st.gy - h, 0); for (let y = st.gy - h; y < st.gy; y++) B.setHide(x + dx, y, 1); for (let k = 0; k < h; k++) B.decorAt('vnStools', x + dx, st.gy - k, k); } st.coins(x + 2, x + 9, st.gy - 5); st.enemy('vnBao', x + 11, st.gy); return x + 13; },
  // the street with the railway down its middle: doorsteps every few houses to wait on while the train rumbles past
  trainstreet(st, o) {
    const x = st.x, B = st.B, n = o.len || 22;
    st.floor(x, x + n - 1);
    B.prop('vnTrack', x, st.gy, n, 0, 'none', {});
    for (let k = 2; k < n - 2; k += 7) { B.prop('vnDoorstep', x + k, st.gy - 3, 2, 3, 'body', {}); st.coins(x + k, x + k + 1, st.gy - 5); }
    st.spawn('vnTrainSignal', x, st.gy - 1, { x0: x, x1: x + n, gy: st.gy, period: o.period || 7, first: 2 });
    for (let k = 0; k < (o.n || 1); k++) st.enemy(k % 2 ? 'vnBao' : 'vnScooter', x + 6 + k * 7, st.gy);
    if (o.gold) st.gold(x + n - 6, st.gy - 6, 'risky');
    return x + n;
  },
  // up onto the rooftops: lasso the knots in the tangled wires to swing across the gaps
  rooftops(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x;
    const house = (x0, x1, gy) => B.prop('vnRoofHouse', x0, gy, x1 - x0 + 1, st.H - gy, 'body', {});
    st.floor(x, x + 1); for (let i = 0; i < 2; i++) { house(x + 2 + i * 2, x + 3 + i * 2, st.gy - 2 * (i + 1)); } x += 6; st.gy -= 4;
    for (let k = 0; k < n; k++) {
      house(x, x + 5, st.gy); st.decor('vnPlants', x + 1);
      x += 6; const gap = 6; st.pit(x, x + gap - 1);
      const hx = x + Math.floor(gap / 2), hy = st.gy - 4;
      st.spawn('vnHook', hx, hy, { look: 'knot' }); swingGhosts(B, hx, hy, 3.5, 1.15, st.gy);
      st.coins(x + 1, x + gap - 2, st.gy - 1);
      if (o.gold && k === n - 1) st.gold(hx, hy - 2, 'high');
      x += gap;
    }
    house(x, x + 4, st.gy); x += 5;
    for (let i = 0; i < 2; i++) { st.gy += 2; house(x, x + 1, st.gy); x += 2; }
    st.floor(x, x + 2);
    return x + 3;
  },

  /* 10-2: Ha Long Bay */
  // karst pillars with little gaps of sea between them
  karsts(st, o) {
    const n = o.n || 3; let x = st.x; st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const gap = 2 + (k % 2), w = 3 + ((k + 1) % 2); water(st, x, x + gap - 1); if (k % 2 === 0) st.spawn('vnSquid', x + 1, st.gy + 2, { delay: k * 0.6 }); x += gap;
      st.gy = clamp(st.gy + [0, -1, 1, -2, 2][(k + (o.seed || 0)) % 5], st.gyMin, st.gyMax); st.floor(x, x + w - 1); st.decor('vnTuft', x + 1);
      st.coins(x, x + w - 1, st.gy - 2); if (k === 1 && o.shrimp !== false) st.enemy('vnShrimp', x + 1, st.gy, { edgeTurn: true });
      x += w;
    }
    water(st, x, x + 1); x += 2; st.floor(x, x + 2);
    return x + 3;
  },
  // a wide stretch of sea: lasso the tree growing out of the cliff above and swing over
  swing(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 2); x += 3;
    const gap = o.gap || 7; water(st, x, x + gap - 1);
    // a karst overhang reaching out above the water, with a gnarled tree at its tip
    const hx = x + Math.floor(gap / 2), hy = st.gy - 4;
    B.fill(x - 3, st.gy - 9, hx + 1, st.gy - 8, T.GROUND);
    st.spawn('vnHook', hx, hy, { look: 'branch', dir: 1 }); swingGhosts(B, hx, hy, 3.4, 1.2, st.gy);
    st.coins(x + 1, x + gap - 2, st.gy - 1); st.spawn('vnSquid', x + 2, st.gy + 2, { delay: 0.5 });
    if (o.gold) st.gold(hx, st.gy - 1, 'risky');
    x += gap; st.floor(x, x + 3); st.decor('vnTuft', x + 2);
    return x + 4;
  },
  // two trees in a row over a very wide stretch: swing from one to the next
  doubleswing(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 2); x += 3;
    const gap = 12; water(st, x, x + gap - 1);
    B.fill(x - 2, st.gy - 9, x + gap + 1, st.gy - 8, T.GROUND);
    for (const [dx, hy] of [[3, st.gy - 4], [8, st.gy - 4]]) { st.spawn('vnHook', x + dx, hy, { look: 'branch', dir: dx < 5 ? 1 : -1 }); swingGhosts(B, x + dx, hy, 3.4, 1.15, st.gy); }
    st.coins(x + 2, x + gap - 3, st.gy - 2); st.enemy('vnCormorant', x + 6, st.gy - 1);
    x += gap; st.floor(x, x + 3);
    return x + 4;
  },
  // bobbing fishing rafts on the swell
  rafts(st, o) {
    const n = o.n || 2; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 4 + 2; water(st, x, x + span - 1);
    for (let k = 0; k < n; k++) { st.spawn('vnRaft', x + 2 + k * 4, st.gy - 1, { pw: 2 }); st.B.ghosts.push([x + 1 + k * 4, st.gy], [x + 2 + k * 4, st.gy]); st.coins(x + 1 + k * 4, x + 2 + k * 4, st.gy - 3); }
    if (o.gold) st.gold(x + span - 3, st.gy - 5, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a sea cave straight through a karst
  cave(st, o) { const x = st.x, B = st.B; st.floor(x, x + 14); B.fill(x + 3, st.gy - 9, x + 11, st.gy - 3, T.GROUND); st.coins(x + 3, x + 11, st.gy - 2); st.enemy('vnShrimp', x + 8, st.gy); st.decor('vnCrabPot', x + 13); st.block(x + 7, st.gy - 4 + 1 - 1, null); return x + 15; },

  /* 10-3: Hoi An */
  // an old-town lane: lantern posts, a lantern shop, toads
  oldstreet(st, o) { const x = st.x, n = 14; st.floor(x, x + n - 1); st.decor('vnLanternPost', x + 2); st.decor('vnLanternPost', x + 10); st.semi(x + 5, x + 8, st.gy - 4); st.block(x + 6, st.gy - 8, 'power'); st.coins(x + 4, x + 9, st.gy - 2); st.enemy(o.toads ? 'vnToad' : 'vnGoi', x + 12, st.gy); if (o.toads) st.enemy('vnToad', x + 4, st.gy); return x + n; },
  // the river: a sampan is moored on the far side. Lasso it, it comes over; hop on, it drifts home with you
  ferry(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 2); x += 3;
    const gap = 9; water(st, x, x + gap - 1);
    st.spawn('vnBoat', x, st.gy, { ax: x + gap - 3, bx: x, pw: 3 });
    for (let q = 0; q < gap; q++) B.ghosts.push([x + q, st.gy]);
    st.coins(x + 1, x + gap - 2, st.gy - 3); st.enemy('vnMosquito', x + 4, st.gy - 1);
    if (o.gold) st.gold(x + gap - 2, st.gy - 5, 'risky');
    x += gap; st.floor(x, x + 3); st.decor('vnLanternPost', x + 2);
    return x + 4;
  },
  // a canal under a string of lanterns: lasso the big lantern and swing over
  lanterns(st, o) {
    const B = st.B, n = o.n || 1; let x = st.x; st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      const gap = 6; water(st, x, x + gap - 1);
      const hx = x + 3, hy = st.gy - 4; st.spawn('vnHook', hx, hy, { look: 'lantern' }); swingGhosts(B, hx, hy, 3.4, 1.15, st.gy);
      st.coins(x + 1, x + gap - 2, st.gy - 1);
      if (o.gold && k === n - 1) st.gold(hx, hy - 2, 'high');
      x += gap; st.floor(x, x + 4); x += 5;
    }
    return x;
  },
  // a little arched footbridge over a narrow canal (mosquitoes love it)
  bridgearch(st, o) { const x = st.x; st.floor(x, x + 1); water(st, x + 2, x + 6); for (let q = 0; q < 7; q++) st.B.set(x + 1 + q, st.gy - [0, 1, 2, 2, 2, 1, 0][q], T.SEMI); st.floor(x + 7, x + 9); st.coins(x + 2, x + 6, st.gy - 4); st.enemy('vnMosquito', x + 4, st.gy - 2); return x + 10; },

  /* 10-4: the cave climb (pieces move st.y up) */
  cstart(st) { st.spawn('vnPho', 8, st.y - 1, {}); st.B.decorAt('vnFungi', 14, st.y, 0); st.B.decorAt('vnPearls', 18, st.y, 1); return st.x; },
  // zig-zag ledges up the cave wall
  cledges(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, mid = st.mid; let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1);
      const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 2 : W - 9;
      B.fill(x0, y, x0 + 6, y, T.GROUND); B.decorAt(k % 2 ? 'vnFungi' : 'vnPearls', x0 + 3, y, k);
      st.coins(x0 + 1, x0 + 5, y - 2);
      if (k === 1) st.enemy(o.enemy || 'vnCaveCrab', x0 + 3, y, { edgeTurn: true });
      if (k < n - 1) for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI);
    }
    if (o.bat) st.enemy('vnBat', mid, y - 1);
    st.top(y - 2);
  },
  // a tall shaft with nothing to stand on: lasso the stalactite at the top and reel yourself up
  reel(st, o) {
    const B = st.B, W = st.W, mid = st.mid, y0 = st.y, h = 10, yt = y0 - h;
    const side = o.flip ? -1 : 1, lx0 = side > 0 ? W - 9 : 2;
    B.fill(lx0, yt, lx0 + 6, yt, T.GROUND); B.decorAt('vnFungi', lx0 + 3, yt, 2);
    const hx = mid, hy = yt - 2;
    st.spawn('vnHook', hx, hy, { look: 'stalactite' });
    // the validator climbs a ladder of standing spots under the stalactite (a reel carries Brady up it)
    for (let y = y0 - 3; y > yt; y -= 3) for (let q = -1; q <= 1; q++) B.ghosts.push([hx + q, y]);
    for (let y = yt; y <= yt + 1; y++) for (let x = Math.min(hx, lx0); x <= Math.max(hx, lx0 + 6); x++) B.ghosts.push([x, yt]);
    for (let y = y0 - 2; y > yt; y -= 2) B.pickAt(hx, y);
    if (o.gold) st.gold(lx0 + 3, yt - 2, 'must');
    B.fill(hx - 1, yt - 3, hx + 1, yt - 3, T.GROUND);
    st.top(yt - 3);
  },
  // a checkpoint ledge across the cave
  ccp(st) { const B = st.B, W = st.W, y = st.y - 3; B.fill(2, y, W - 3, y, T.GROUND); st.spawn('checkpoint', Math.floor(W / 2) + 4, y - 1); st.spawn('vnPho', 5, y - 1, {}); for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI); st.top(y - 3); },
  // a wide chamber: stepping stones and a cave pearl stash
  chamber(st, o) {
    const B = st.B, W = st.W, y0 = st.y;
    for (const [x0, dy] of [[3, 3], [9, 5], [15, 3], [6, 8], [13, 9]]) { B.fill(x0, y0 - dy, x0 + 3, y0 - dy, T.SEMI); st.coins(x0, x0 + 3, y0 - dy - 2); }
    st.enemy('vnBat', st.mid, y0 - 6); B.decorAt('vnPearls', 4, y0 - 3, 3); B.decorAt('vnFungi', 16, y0 - 3, 4);
    st.top(y0 - 11);
  },

  /* 10-5: the citadel's coffee works */
  // a pit of hot coffee crossed on melting ice cubes
  coffeepit(st, o) {
    const n = o.n || 2; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 3 + 1; st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    for (let i = 0; i < n; i++) { st.spawn('vnIce', x + 2 + i * 3, st.gy - 1, { pw: 2 }); st.B.ghosts.push([x + 1 + i * 3, st.gy], [x + 2 + i * 3, st.gy]); st.coins(x + 1 + i * 3, x + 2 + i * 3, st.gy - 3); }
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a coffee roaster spits hot beans; bean soldiers march
  roasters(st, o) { const x = st.x; st.floor(x, x + 14); st.B.fill(x + 12, st.gy - 1, x + 13, st.gy - 1, T.HARD); st.spawn('vnRoaster', x + 12, st.gy - 2, { dir: -1, period: 2.4 }); st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6); st.enemy('vnBean', x + 9, st.gy); if (o.gold) st.gold(x + 5, st.gy - 7, 'high'); return x + 15; },
  // a lacquered hall: a gallery above, an item block
  palacehall(st, o) { const x = st.x, B = st.B; st.floor(x, x + 14); B.fill(x + 2, st.gy - 3, x + 3, st.gy - 1, T.HARD); for (let q = 0; q < 9; q++) B.set(x + 4 + q, st.gy - 5, T.SEMI); st.block(x + 8, st.gy - 9, 'star'); st.gold(x + 11, st.gy - 7, 'hidden'); st.enemy('vnBean', x + 9, st.gy - 5); st.coins(x + 5, x + 12, st.gy - 7); return x + 15; },
  pavilion(st, o) { const x = st.x, B = st.B; st.floor(x, x + 12); for (const [dx, dy] of [[2, 3], [6, 5], [10, 3]]) for (let q = 0; q < 3; q++) B.set(x + dx + q, st.gy - dy, T.SEMI); st.enemy('vnBean', x + 6, st.gy); st.enemy('vnBean', x + 10, st.gy); st.coins(x + 6, x + 8, st.gy - 7); return x + 13; },
  // the boss arena: the citadel courtyard, a great kettle on a chain under the beam, a foot pedal at either end
  arena_kettle(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 3; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 6 + q, GY - 4, T.SEMI); }
    // two stone pedestals with the citadel's urns: they stop his slides inside the kettle's sweep (hop over them to the pedals)
    for (const px of [x0 + 4, x0 + w - 5]) { B.fill(px, GY - 2, px, GY - 1, T.HARD); B.decorAt('vnUrnPot', px, GY - 2, px % 3); }
    B.spawn('vnKettle', x0 + 13, GY - 1, { ax0: x0, ax1: x0 + w });
    B.spawn('vnPedal', x0 + 1, GY - 1, { dir: -1 }); B.spawn('vnPedal', x0 + w - 2, GY - 1, { dir: 1 });
    for (let k = 0; k < 6; k++) B.spawn('vnArenaLantern', x0 + 3 + k * 4, 6, { k });
    [7, 13, 19].forEach((dx, k) => B.spawn('vnPuppet', x0 + dx, GY - 1, { kind: k }));
    B.decorAt('vnBonsai', x0 + 9, GY, 2); B.decorAt('vnBonsai', x0 + 17, GY, 3); B.decorAt('vnStools', x0 + 23, GY, 1); B.decorAt('vnPlants', x0 + 2, GY, 0); B.decorAt('vnBirdcage', x0 + 11, GY, 1);
  }
};

/* ---------------- the boss: ONG PHIN, the Grand Coffee Filter ---------------- */
// A giant drip-coffee filter on a glass of condensed milk. Its lid is far too hot to stomp. It rains scalding drips,
// pours coffee puddles and slides across them, and from phase 2 blows the courtyard's lanterns out. The only thing that
// gets through is the great kettle: stomp a foot pedal, the kettle swings across the courtyard, and when it crashes into
// him he is steamed ("over-brewed"). Phase 3 raises the water-puppet stage. Beaten, he drips empty and sits down for a cup.
const PHIN_WINDOWS = { drips: 1, wobble: 1, blow: 1, conduct: 1, stunned: 1 };
const boss = {
  id: 'vn_phin', name: 'Ong Phin', hp: 5, dims: [76, 92], music: 'tour_vn_boss', country: 'vn',
  brain: {
    guardText: 'TOO HOT!',
    phases: [3, 1],
    wake(b) {
      const g = b.g; b.brew = 1; g.area.dark = false;
      b.kettle = g.entities.find(e => e instanceof VnKettle && inArenaOf(b, e)) || null;
      b.lanterns = g.entities.filter(e => e instanceof VnArenaLantern && inArenaOf(b, e));
      b.puppets = g.entities.filter(e => e instanceof VnPuppet && inArenaOf(b, e));
      K.say(g, b, 'ONE STRONG COFFEE, COMING UP!', '#ffd84a'); g.toast('STOMP A PEDAL: THE KETTLE SWINGS. STEAM HIM!');
    },
    onLasso(b) { if (b.state === 'fight' && !PHIN_WINDOWS[b.act] && b.act !== 'scald' && b.act !== 'empty') { K.say(b.g, b, 'MY LID!! HEY!', '#ffd84a'); b.go('stunned'); } },
    hit(b, kind, src) {
      if (kind === 'stomp' || kind === 'spin') { if (!b.sizzT || b.t - b.sizzT > 1) { b.sizzT = b.t; K.say(b.g, b, pick(['SSSSS! HOT LID!', 'CAREFUL, IT\'S BREWING!', 'OUCH FOR YOU, NOT ME!']), '#ff8a3a'); } b.g.burst(b.cx, b.y, 8, '#ff8a3a', 'spark'); return 'bounce'; }
      if (kind === 'hazard' && src instanceof VnKettle) { b.damage(1, { text: 'OVER-BREWED!', col: '#ffffff' }); return true; }
      if (kind === 'prop' || kind === 'bump' || kind === 'hazard') return false;
      return undefined;
    },
    hurt(b) { b.go('scald'); b.brew = Math.max(0.2, (b.brew || 1) - 0.25); K.say(b.g, b, pick(['FSSSH! TOO MUCH STEAM!', 'MY CREMA!', 'I\'M OVER-BREWED!!']), '#ffffff'); b.g.burst(b.cx, b.y + 20, 20, '#ffffff', 'dust'); },
    phase(b, n) {
      const g = b.g; this.hurt(b);
      if (n === 2) { g.area.dark = true; g.bannerText = 'LIGHTS OUT!'; g.bannerT = 1.8; for (const l of b.lanterns) l.lit = true; }
      else { for (const q of b.puppets) q.active = true; g.bannerText = 'THE PUPPET STAGE RISES!'; g.bannerT = 1.8; }
    },
    lastHit(b) { b.go('empty'); b.vx = 0; b.g.area.dark = false; return true; },
    touch(b, p) { if (b.act === 'scald' || b.act === 'wobble' || b.act === 'stunned' || b.act === 'empty') { p.x += (p.cx < b.cx ? -1 : 1) * 2; return true; } return false; },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1; b.guard = 'bounce';
      if (b.act !== 'empty' && b.act !== 'scald') b.brew = Math.min(1, (b.brew || 0) + dt * 0.2);
      if (b.act === 'walk') {
        b.face(); b.walk(ph >= 3 ? 1.5 : 0.9); b.pose = 'walk'; b.fall(dt);
        if (b.at > 1.2) { b.cycle++; const plan = ph >= 3 ? ['slide', 'conduct', 'drips', 'blow', 'slide', 'pour'] : ph === 2 ? ['drips', 'blow', 'slide', 'pour', 'blow', 'slide'] : ['drips', 'pour', 'slide', 'drips', 'slide']; b.go(plan[b.cycle % plan.length]); }
      } else if (b.act === 'drips') {
        // stands still and rattles: scalding drips rain down (and he is a sitting duck for the kettle)
        b.vx = 0; b.pose = 'rattle'; b.fall(dt);
        if (b.first) { b.n = 0; K.say(g, b, 'DRIP DRIP DRIP!', '#c8783a'); }
        if (b.at > 0.5 + b.n * 0.45 && b.n < 3) { b.n++; const k = ph >= 2 ? 4 : 3; for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (i - (k - 1) / 2) * 0.5 + (Math.random() - 0.5) * 0.2; tourFire(g, b.cx, b.y + 10, { kind: 'drip', vx: Math.cos(a) * 5.5 * TS + (p ? sign(p.cx - b.cx) * TS : 0), vy: Math.sin(a) * 7 * TS, grav: PHYS.gDown * 0.5, w: 10, h: 12, life: 3, thru: true, col: '#7a3a14', art: (ctx, s) => { ctx.fillStyle = '#7a3a14'; ctx.beginPath(); ctx.moveTo(s.cx, s.y); ctx.quadraticCurveTo(s.cx + 6, s.cy + 3, s.cx, s.y + s.h); ctx.quadraticCurveTo(s.cx - 6, s.cy + 3, s.cx, s.y); ctx.fill(); ctx.fillStyle = 'rgba(255,220,180,0.6)'; ctx.fillRect(s.cx - 1.5, s.cy, 1.5, 3); } }); } Sound.play('splash', { pitch: 1.6, vol: 0.4 }); }
        if (b.at > 2.3) b.go('walk');
      } else if (b.act === 'pour') {
        // tilts over and pours a long puddle of coffee on the floor: slippery as ice
        b.vx = 0; b.pose = 'pour'; b.fall(dt);
        if (b.first) { b.face(); K.say(g, b, 'FRESH POUR!', '#c8783a'); }
        if (b.at > 0.6 && !b.poured) { b.poured = true; g.spawn(new VnPuddle(g, clamp(b.cx + b.dir * 90, b.arenaX0 + 50, b.arenaX1 - 50), b.floorY, 100)); Sound.play('splash', { pitch: 0.9, vol: 0.5 }); g.burst(b.cx + b.dir * 40, b.floorY - 6, 10, '#7a3a14', 'spark'); }
        if (b.at > 1.4) { b.poured = false; b.go('walk'); }
      } else if (b.act === 'slide') {
        // leans back (the tell), then skids across the courtyard on its own spilled coffee until it hits the wall
        if (b.at < 0.65) { b.vx = 0; b.pose = 'lean'; if (b.first) { b.face(); K.say(g, b, pick(['SLIP \'N SLIDE!', 'WHEEEE!', 'COMING THROUGH!']), '#ffd84a'); } }
        else {
          b.pose = 'slide'; b.vx = b.dir * (ph >= 3 ? 9.5 : 7.5) * TS; if (Math.random() < 0.5) g.burst(b.cx - b.dir * 30, b.floorY - 4, 1, '#7a3a14', 'spark');
          if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { g.shake(5); Sound.play('bump'); b.vx = 0; b.go('wobble'); }
        }
        b.fall(dt); if (b.at > 3.5) b.go('walk');
      } else if (b.act === 'wobble') {
        // bonked the wall: rattles in place, dizzy (catch him with the kettle now)
        b.vx = 0; b.pose = 'wobble'; b.fall(dt);
        if (b.first) K.say(g, b, 'WOBBLE WOBBLE...', '#ffffff');
        if (b.at > 1.5) b.go('walk');
      } else if (b.act === 'blow') {
        // a long breath in, then a great puff: the lanterns go out one by one, and the courtyard goes dark
        b.vx = 0; b.fall(dt); b.pose = b.at < 0.8 ? 'inhale' : 'blow';
        if (b.first) { b.face(); b.blown = false; K.say(g, b, '...FFFFFF...', '#cfefff'); }
        if (b.at >= 0.8 && !b.blown) {
          b.blown = true; Sound.play('throw', { pitch: 0.5, vol: 0.8 }); g.shake(2); K.say(g, b, 'WHOOOOSH!', '#cfefff');
          const ls = b.lanterns.slice().sort((u, v) => Math.abs(u.cx - b.cx) - Math.abs(v.cx - b.cx)); ls.forEach((l, k) => l.blowOut(k * 0.13));
          for (let k = 0; k < 6; k++) g.burst(b.cx + b.dir * (40 + k * 30), b.y + 20 + (k % 2) * 12, 3, '#e8f4ff', 'dust');
        }
        if (b.at > 0.8 && b.at < 1.6 && p && !p.dead && Math.abs(p.cy - b.cy) < 3 * TS && sign(p.cx - b.cx) === b.dir) p.pushX = (p.pushX || 0) + b.dir * 3.5 * TS;
        if (b.at > 2.2) b.go('walk');
      } else if (b.act === 'conduct') {
        // the puppet master: raises the rod and the water puppets pop up one after the other
        b.vx = 0; b.pose = 'conduct'; b.fall(dt);
        if (b.first) { b.face(); K.say(g, b, 'PUPPETS! DANCE!', '#ffd23a'); b.puppets.slice().sort((u, v) => Math.abs(u.cx - (p ? p.cx : b.cx)) - Math.abs(v.cx - (p ? p.cx : b.cx))).forEach((q, k) => q.pop(k * 0.35)); }
        if (b.at > 2.2) b.go('walk');
      } else if (b.act === 'scald') {
        // steamed: hops about in a cloud of its own steam
        b.pose = 'scald'; if (b.first) { b.hops = 0; }
        if (b.onGround && b.hops < 3 && b.at > 0.1) { b.hops++; b.vy = -6 * TS; b.vx = -b.dir * 2 * TS; Sound.play('bump', { pitch: 1.5, vol: 0.3 }); }
        if (Math.random() < 0.4) g.burst(b.cx + (Math.random() - 0.5) * 50, b.y + Math.random() * 40, 1, '#ffffff', 'dust');
        b.fall(dt); if (b.at > 1.5 && b.onGround) { b.vx = 0; b.go('walk'); }
      } else if (b.act === 'stunned') {
        b.vx = 0; b.pose = 'wobble'; b.fall(dt); if (b.at > 1.4) b.go('walk');
      } else if (b.act === 'empty') {
        // the last drip: he sighs, the lid pops, and he sits down for a cup of his own
        b.vx = 0; b.pose = b.at < 1.0 ? 'rattle' : 'sit'; b.fall(dt); b.brew = Math.max(0, 1 - b.at);
        if (b.first) { K.say(g, b, '...DRIP. ...DRIP. THAT\'S THE LAST ONE.', '#ffffff'); }
        if (b.at > 1.0 && !b.sat) { b.sat = true; Sound.play('bump', { pitch: 1.6 }); g.burst(b.cx, b.y, 12, '#c8c8d0', 'spark'); K.say(g, b, '*SIGH* ...ONE FOR ME, THEN.', '#ffd84a'); }
        if (b.at > 3.2) b.die();
      } else b.go('walk');
    },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, sq = 1 + b.squash * 0.12, brew = b.brew == null ? 1 : b.brew;
      const wob = (P === 'rattle' || P === 'wobble') ? Math.sin(t * 40) * 1.5 : P === 'walk' ? Math.sin(t * 9) * 1 : 0;
      const tilt = P === 'lean' ? -d * 0.28 : P === 'slide' ? d * 0.22 : P === 'pour' ? d * 0.5 : P === 'sit' ? 0 : 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(sq, 1 / sq);
      K.shadow(ctx, 0, 0, 36);
      if (P === 'slide') { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-d * (44 + k * 6), -20 - k * 16); ctx.lineTo(-d * (70 + k * 10), -22 - k * 16); ctx.stroke(); } }
      // little legs (tucked up when sliding or sitting)
      ctx.fillStyle = '#5a5a66'; for (const s of [-1, 1]) { const st = P === 'walk' ? Math.sin(t * 9 + s) * 3 : 0, up = (P === 'slide' || P === 'sit') ? 6 : 0; rr(ctx, s * 14 - 4 + st, -10 + up, 8, 10 - up, 3); ctx.fill(); }
      ctx.save(); ctx.translate(0, P === 'sit' ? 6 : 0); ctx.rotate(tilt);
      // the glass: condensed milk at the bottom, coffee dripping in above it
      const gy0 = -50, gh = 40;
      ctx.fillStyle = 'rgba(220,240,255,0.35)'; ctx.beginPath(); ctx.moveTo(-26, gy0); ctx.lineTo(26, gy0); ctx.lineTo(22, -10); ctx.lineTo(-22, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff2d0'; ctx.beginPath(); ctx.moveTo(-23.5, -22); ctx.lineTo(23.5, -22); ctx.lineTo(22, -10); ctx.lineTo(-22, -10); ctx.fill();
      const cl = 6 + (1 - brew) * 16; ctx.fillStyle = '#6a3214'; ctx.beginPath(); ctx.moveTo(-23.5 - cl * 0.05, -22 - cl); ctx.lineTo(23.5 + cl * 0.05, -22 - cl); ctx.lineTo(23.5, -22); ctx.lineTo(-23.5, -22); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-26, gy0); ctx.lineTo(-22, -10); ctx.lineTo(22, -10); ctx.lineTo(26, gy0); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-20, gy0 + 4, 3, gh - 18);
      // the steel filter on top, with a face
      ctx.save(); ctx.translate(wob, 0);
      const fy = gy0 - 4;
      ctx.fillStyle = '#b8bcc8'; rr(ctx, -34, fy - 2, 68, 6, 3); ctx.fill();
      const fg = ctx.createLinearGradient(-22, 0, 22, 0); fg.addColorStop(0, P === 'scald' ? '#b85a4a' : '#8a8e9a'); fg.addColorStop(0.45, P === 'scald' ? '#ffb0a0' : '#e8ecf4'); fg.addColorStop(1, P === 'scald' ? '#a84a3a' : '#7a7e8a');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-22, fy); ctx.lineTo(-20, fy - 36); ctx.lineTo(20, fy - 36); ctx.lineTo(22, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(60,40,30,0.8)'; ctx.fillRect(-19, fy - 36 + (1 - brew) * 30, 38, Math.max(0, brew * 30));
      ctx.fillStyle = fg; ctx.fillRect(-20, fy - 36, 40, 6 + (1 - brew) * 30);
      if (P === 'wobble' || P === 'sit') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (const s of [-1, 1]) { if (P === 'sit') { ctx.beginPath(); ctx.arc(d * 3 + s * 9, fy - 20, 3.5, 0, Math.PI); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(s * 11 - 4, fy - 22); ctx.lineTo(s * 11 + 4, fy - 18); ctx.moveTo(s * 11 + 4, fy - 22); ctx.lineTo(s * 11 - 4, fy - 18); ctx.stroke(); } } if (P === 'wobble') TourKit.dizzy(ctx, 0, fy - 56, t); }
      else if (P === 'inhale' || P === 'blow') {
        // cheeks puffed, eyes squeezed shut, a round mouth and a gale of wind lines
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 3 + s * 9, fy - 20, 3.5, Math.PI, TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,170,150,0.6)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 3 + s * 13, fy - 10, 6 + (P === 'inhale' ? Math.min(6, b.at * 8) : 2), 5, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(d * 6, fy - 9, P === 'inhale' ? 2.5 : 4, 3.5, 0, 0, TAU); ctx.fill();
        if (P === 'blow') { ctx.strokeStyle = 'rgba(220,240,255,0.8)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const ph = (t * 3 + k / 4) % 1; ctx.beginPath(); ctx.moveTo(d * (12 + ph * 60), fy - 14 + k * 5 - 8); ctx.lineTo(d * (30 + ph * 60), fy - 14 + k * 5 - 8 + Math.sin(t * 20 + k) * 2); ctx.stroke(); } }
      }
      else if (P === 'scald') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 3 + s * 9 - 3, fy - 22); ctx.lineTo(d * 3 + s * 9 + 3, fy - 18); ctx.moveTo(d * 3 + s * 9 + 3, fy - 22); ctx.lineTo(d * 3 + s * 9 - 3, fy - 18); ctx.stroke(); } ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(d * 3, fy - 9, 5, 4 + Math.abs(Math.sin(t * 20)) * 2, 0, 0, TAU); ctx.fill(); }
      else { K.eyes(ctx, d * 3, fy - 20, d, 9, 4.6, P !== 'lean'); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); if (P === 'lean' || P === 'slide') { ctx.arc(d * 3, fy - 12, 6, Math.PI + 0.2, TAU - 0.2); } else ctx.arc(d * 3, fy - 10, 6, 0.2, Math.PI - 0.2); ctx.stroke(); }
      // the lid (off and spinning on the floor once he's sat down), with its steam
      if (P !== 'sit') { ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.ellipse(0, fy - 37, 23, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#a8acb8'; rr(ctx, -4, fy - 46, 8, 9, 3); ctx.fill(); const sn = P === 'scald' ? 7 : 3; for (let k = 0; k < sn; k++) { const ph = (t * 0.7 + k / sn) % 1; ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - ph) * Math.max(brew, P === 'scald' ? 1 : 0)})`; ctx.beginPath(); ctx.arc(-8 + k * (16 / Math.max(1, sn - 1)) + Math.sin(ph * 6 + k) * 3, fy - 48 - ph * (P === 'scald' ? 50 : 30), 3 + ph * (P === 'scald' ? 10 : 6), 0, TAU); ctx.fill(); } }
      // the puppet master's rod
      if (P === 'conduct') { ctx.save(); ctx.translate(d * 24, fy - 10); ctx.rotate(-d * (0.9 + Math.sin(t * 6) * 0.3)); ctx.fillStyle = '#c8a05a'; ctx.fillRect(-2, -40, 4, 40); ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.arc(0, -42, 5, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.restore();
      // drips falling into the glass (a stream when pouring)
      if (brew > 0.05 && P !== 'sit') { ctx.fillStyle = '#5a2810'; const dy = (t * 60) % 20; ctx.beginPath(); ctx.ellipse(0, fy + 4 + dy, 1.8, 3, 0, 0, TAU); ctx.fill(); }
      if (P === 'pour') { ctx.fillStyle = '#6a3214'; ctx.beginPath(); ctx.moveTo(d * 22, -14); ctx.quadraticCurveTo(d * 40, 0, d * 60, 14); ctx.lineTo(d * 54, 16); ctx.quadraticCurveTo(d * 36, 4, d * 20, -8); ctx.fill(); }
      ctx.restore();
      if (P === 'sit') {
        // the lid on the floor and a tiny cup of coffee in front of him
        ctx.save(); ctx.translate(x - d * 50, y - 6); ctx.rotate(t * 6); ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 4.5, 0, 0, TAU); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#f4f0e8'; rr(ctx, x + d * 36 - 7, y - 14, 14, 12, 3); ctx.fill(); ctx.fillStyle = '#6a3214'; ctx.beginPath(); ctx.ellipse(x + d * 36, y - 13, 5, 2, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + d * 36 + d * 8, y - 8, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + d * 36 + Math.sin(ph * 5 + k) * 3, y - 18 - ph * 20, 2 + ph * 3, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      // a steam marker: while he stands still he is a target for the kettle
      if (b.state === 'fight' && PHIN_WINDOWS[b.pose === 'rattle' ? 'drips' : b.act] && b.hurtT <= 0) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 10)})`; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KETTLE!', x, b.y - 16 + Math.sin(t * 6) * 3); }
    }
  }
};

/* ---------------- music: dan bau slides (a sliding, singing string), dan tranh zither, bamboo flute, woodblocks ---------------- */
const tracks = {
  tour_vn: {
    bpm: 112, bars: 8, rv: 0.32, dl: 0.14,
    ch: 'Am G Am Em F G Am Am',
    ld: 'E5:4 G5:2 A5:2 C6:6 A5:2 | D6:4 C6:2 A5:2 G5:8 | A5:2 C6:2 D6:4 E6:4 D6:2 C6:2 | B5:6 G5:2 E5:8 |' +
        'C6:4 D6:2 C6:2 A5:4 G5:4 | B5:2 D6:2 G6:4 E6:4 D6:4 | E6:6 D6:2 C6:4 A5:4 | A5:12 .:4',
    li: 'theremin', lv: 0.12,
    l2: 'A4:8 C5:8 | B4:8 D5:8 | E5:8 D5:8 | G4:8 B4:8 | A4:8 F4:8 | G4:8 B4:8 | C5:8 E5:8 | A4:16', l2i: 'whistle', l2v: 0.045,
    bp: 'r...r.f.r...o...', bi: 'pluckb', bv: 0.26,
    ap: '0.2.4.2.1.3.5.3.', ai: 'harp', av: 0.04, ao: 64,
    dr: ['d.......d.d.....', 'l..l..l...l..l..', '....b.......b..b', 'n.n.n.n.n.n.n.n.'], dv: 0.38
  },
  tour_vn_night: {
    bpm: 84, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'Dm Am Bb F Gm Dm A Dm',
    ld: 'A5:6 D6:2 F6:8 | E6:4 C6:4 A5:8 | D6:6 F6:2 G6:4 F6:4 | C6:12 .:4 | G5:4 Bb5:4 D6:8 | F6:6 E6:2 D6:8 | C#6:4 E6:4 A6:8 | D6:12 .:4',
    li: 'theremin', lv: 0.11,
    pd: 'c-------c-------', pi: 'pad', pv: 0.04, po: 52,
    bp: 'r.......f.......', bi: 'sub', bv: 0.22,
    ap: '0..2..4..2..1..3', ai: 'harp', av: 0.035, ao: 64,
    dr: ['d.......d.......', '......l.......l.', '..n.......n.....'], dv: 0.28
  },
  tour_vn_cave: {
    bpm: 76, bars: 8, rv: 0.7, dl: 0.32,
    ch: 'Em Em C C Am Am B B',
    ld: 'B5:8 G5:4 E5:4 | F#5:12 .:4 | E5:8 G5:4 C6:4 | B5:12 .:4 | C6:8 A5:4 E5:4 | G5:12 .:4 | F#5:8 A5:4 D#6:4 | B5:12 .:4',
    li: 'glass', lv: 0.13,
    pd: 'c---------------', pi: 'pad', pv: 0.05, po: 48,
    ap: '0...2...4...2...', ai: 'vibes', av: 0.03, ao: 70,
    bp: 'r...............', bi: 'sub', bv: 0.22,
    dr: ['u.....u.....u...', '.........u......'], dv: 0.3
  },
  tour_vn_boss: {
    bpm: 160, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Am Am F G Am Am E E',
    ld: 'A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 D6:4 | C6:2 D6:2 E6:4 A5:8 | F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4 | G5:2 B5:2 D6:2 G6:2 F6:4 D6:4 |' +
        'E6:2 D6:2 C6:2 A5:2 C6:4 E6:4 | A6:4 G6:2 E6:2 C6:8 | B5:2 D6:2 E6:2 G#6:2 B6:4 G#6:4 | E6:12 .:4',
    li: 'theremin', lv: 0.13,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'pluckb', bv: 0.3,
    ap: 'c-..c-..c-..c-..', ai: 'harp', av: 0.04, ao: 60,
    dr: ['k...k...k...k...', '....s.......s.s.', 'l.l.l.l.l.l.l.l.', 'd..d..d...d..d..'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
const COIN = { name: 'GOLDEN XU', draw(ctx, x, y) {
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#8a5a12'; ctx.fillRect(x - 2.6, y - 2.6, 5.2, 5.2); ctx.fillStyle = '#c8901a'; ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 5, y - 6, 2, 2);
} };
Tour.country({
  id: 'vn', colors: COL, tagline: 'Train Street, emerald bays and a river of lanterns',
  themes, painters, dyn, decor, decorLights, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_vn', boss: 'tour_vn_boss' },
  landmark: 'the Japanese Covered Bridge of Hoi An',
  arrival: 'Xin chào, Brady! The Baron squeezed a whole bridge into a snow globe and flew off with a coffee to go. A pho cart lent me a lasso made of noodles. Trust me. ♥ C',
  emblem(ctx, x, y, r, t) { lantern(ctx, x, y, r * 0.75, '#e8323a', t || 0, false); },
  coin: COIN,
  star: { name: 'GOLDEN LOTUS', draw(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 2);
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.42 + Math.sin(t * 2) * 0.04; ctx.save(); ctx.rotate(a); ctx.fillStyle = k % 2 ? '#ffe070' : '#f0b830'; ctx.beginPath(); ctx.ellipse(0, -8, 3.6, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(0, 2, 10, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  } },
  levels: [
    { name: 'Train Street', style: 'run', theme: 'vn_street', gyMin: 6,
      gimmick: 'A pho cart lends a noodle lasso: the train rumbles down the street (get up on a doorstep!), wind-up toy scooters zoom, swing over the rooftop gaps on the tangled wires',
      enemies: [['vnScooter', 2], ['vnBao', 2], ['vnRoll', 1]],
      hint: 'When the bell rings, get up on a doorstep! THROW near a wire knot to swing',
      postcard: 'Brady! A train runs right down this street, between the cafes. Everyone just moves their stools. Amazing. ♥ C',
      script: ['pho', 'stools', ['trainstreet', { len: 22, n: 1 }], 'rooftops', 'cp', ['enemies', { n: 2 }], ['trainstreet', { len: 29, n: 2, gold: true, period: 6.5 }], ['rooftops', { n: 3, gold: true }], 'stools', 'bonus', 'end'] },
    { name: 'Ha Long Bay', style: 'run', theme: 'vn_bay', gyMin: 9, gyMax: 15,
      gimmick: 'Limestone karsts rising from emerald water: lasso the cliff-side trees and swing from karst to karst; bobbing fishing rafts, leaping squid, mantis shrimp that punch',
      enemies: [['vnShrimp', 1], ['vnCormorant', 1]],
      hint: 'THROW at the trees on the cliffs to swing across the water. Tap JUMP to let go',
      postcard: 'Thousands of stone islands, and the Baron\'s blimp hiding behind every one. Swing, Brady, swing! ♥ C',
      script: ['pho', 'karsts', 'swing', 'rafts', ['karsts', { n: 4, seed: 2 }], 'cp', 'cave', ['swing', { gold: true, gap: 8 }], 'doubleswing', ['rafts', { n: 3, gold: true }], ['karsts', { n: 2, seed: 4 }], 'swing', 'end'] },
    { name: 'Hoi An Lantern River', style: 'night', theme: 'vn_river', dark: true,
      gimmick: 'A lantern-lit river at night: lasso a moored sampan to pull it over, then ride it back across; swing on the lantern strings; mosquitoes and toads',
      enemies: [['vnToad', 2], ['vnMosquito', 2], ['vnGoi', 1]],
      hint: 'Lasso the moored boat: it comes to you, then carries you home across the river',
      postcard: 'The whole river is floating lanterns tonight. I made a wish. It was about you. (And noodles.) ♥ C',
      script: ['pho', 'oldstreet', 'ferry', 'lanterns', ['oldstreet', { toads: true }], 'cp', ['ferry', { gold: true }], 'bridgearch', ['lanterns', { n: 2, gold: true }], 'oneup', 'ferry', 'end'] },
    { name: 'Phong Nha Cave', style: 'climb', theme: 'vn_cave', dark: true, W: 24, H: 104,
      gimmick: 'Climb a giant cave toward its skylight: lasso the stalactites and reel yourself up the sheer shafts; glowing fungi, bats, blind cave crabs',
      enemies: [['vnBat', 1], ['vnCaveCrab', 1]],
      hint: 'In a shaft, lasso the stalactite and hold UP to reel in',
      postcard: 'There\'s a whole jungle growing inside this cave. And a river. And, somewhere, a Baron. ♥ C',
      script: ['cstart', ['cledges', { n: 4 }], 'reel', ['cledges', { n: 3, flip: true, bat: true }], 'ccp', 'chamber', ['reel', { gold: true, flip: true }], ['cledges', { n: 4 }], 'reel', ['cledges', { n: 3, bat: true }]] },
    { name: 'Hue Citadel', style: 'castle', theme: 'vn_citadel', boss: 'vn_phin', arena: 'kettle', arenaW: 26, roof: false,
      gimmick: 'The Baron\'s coffee works in the citadel: hot-coffee pits crossed on melting ice cubes, bean-spitting roasters, then Ong Phin under the great kettle',
      enemies: [['vnBean', 3], ['vnRoll', 1]],
      hint: 'Ong Phin is too hot to stomp. Jump on a foot pedal: the kettle swings across the courtyard and steams him!',
      postcard: 'The bridge is back in Hoi An! The Baron flew off toward Japan. He left his coffee. ♥ C',
      script: [['coffeepit', { n: 2 }], 'roasters', ['enemies', { n: 2 }], 'palacehall', 'cp', ['coffeepit', { n: 3 }], ['roasters', { gold: true }], 'pavilion', 'arena'] }
  ]
});
})();
