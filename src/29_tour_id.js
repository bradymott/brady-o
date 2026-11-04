/* ============================================================
   BALI, INDONESIA (world 9)
   9-1 Kuta Surf Break         auto   a gecko lends a surfboard: ride the rolling swells, launch off the crests, hop the reefs
   9-2 Kite Festival           run    ride giant fish kites drifting on the wind over flooded rice terraces; duck parades
   9-3 Batur Sunrise Trek      night  climb the volcano before dawn: lava bombs land on glowing rings, hot rocks, civets
                                      in the dark; the sky turns to sunrise as Brady climbs
   9-4 Manta Point Night Dive  swim   a black reef that glows: plankton lights up as Brady swims, anglerfish dangle fake
                                      coins, morays lurk, a manta's slipstream sweeps him along
   9-5 Monkey Forest Ruins     castle macaques snatch coins, stinky durians, gamelan-gong doors; boss Boss Kera, the selfie macaque
   Temples, offerings and ceremonies appear only as respectful background; the gags are food, animals and objects.
   ============================================================ */
(() => {
const COL = { a: '#ff5a8a', b: '#14b4ac', c: '#ffc23a' };
const K = TourKit;
const KITE = ['#e8323a', '#ffd23a', '#2a6ad8', '#ffffff', '#2aa85a', '#ff7a2a'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
LIQUIDS.id_sea = ['#72f0e6', '#18b0c8', '#0a5a8a', 'rgba(230,255,255,0.3)', null, 'rgba(255,255,255,0.85)'];
LIQUIDS.id_lava = ['#ffe07a', '#ff7a1a', '#a8280a', 'rgba(255,160,60,0.35)', '#ff7a1e', null];
// a frangipani blossom (five rounded petals, a golden heart)
function frangipani(ctx, x, y, r, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  for (let k = 0; k < 5; k++) { ctx.rotate(TAU / 5); ctx.fillStyle = col || '#fffaf0'; ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.62, r * 0.36, 0.35, 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55); g.addColorStop(0, '#ffc23a'); g.addColorStop(1, 'rgba(255,194,58,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ---------------- background painters (seamless 1024-wide strips) ---------------- */
const painters = {
  idNone() {},
  // Bali's two great volcanoes on the horizon: plain, respectful silhouettes
  idVolcanoes(ctx, L, rng, H) {
    const b = L.base, hh = L.h || 170, at = L.at || 120;
    wrapDraw(at, 560, ox => {
      const x = ox + 280, top = b - hh;
      ctx.fillStyle = vgrad(ctx, top, b, shade(L.color, 0.12), L.color);
      ctx.beginPath(); ctx.moveTo(x - 280, b + 2); ctx.quadraticCurveTo(x - 110, b - 30, x - 18, top + 2); ctx.quadraticCurveTo(x, top - 3, x + 16, top + 3); ctx.quadraticCurveTo(x + 110, b - 26, x + 280, b + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(shade(L.color, 0.3), 0.22); ctx.lineWidth = 1.5;
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, top + 10); ctx.quadraticCurveTo(x + k * 26, b - hh * 0.45, x + k * 64, b - 4); ctx.stroke(); }
    });
    wrapDraw(at + 470, 420, ox => {
      const x = ox + 210, top = b - hh * 0.5;
      ctx.fillStyle = shade(L.color, -0.06);
      ctx.beginPath(); ctx.moveTo(x - 210, b + 2); ctx.quadraticCurveTo(x - 140, top + 16, x - 70, top + 4); ctx.lineTo(x - 40, top + 16); ctx.quadraticCurveTo(x - 4, top - 30, x + 30, top + 14); ctx.lineTo(x + 72, top + 4); ctx.quadraticCurveTo(x + 140, top + 18, x + 210, b + 2); ctx.closePath(); ctx.fill();
      if (L.glow) { const g = ctx.createRadialGradient(x - 4, top - 14, 2, x - 4, top - 14, 70); g.addColorStop(0, 'rgba(255,150,60,0.55)'); g.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = g; ctx.fillRect(x - 74, top - 84, 148, 120); ctx.strokeStyle = 'rgba(255,120,40,0.75)'; ctx.lineWidth = 2; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 10, top - 10); ctx.quadraticCurveTo(x - 30 + k * 40, top + 30, x - 50 + k * 90, b - 20); ctx.stroke(); } }
      if (L.lake) { ctx.fillStyle = L.lake; ctx.beginPath(); ctx.ellipse(x + 130, b - 4, 100, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 70, b - 6, 110, 1.5); }
    });
    if (L.haze) { ctx.fillStyle = vgrad(ctx, b - 50, b + 4, 'rgba(255,255,255,0)', rgba(L.haze, 0.55)); ctx.fillRect(0, b - 50, BG_W, 60); }
  },
  // the far side of the bay: a thin golden beach, palms and colourful outrigger canoes
  idCoast(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b - 4, BG_W, H - b + 4);
    ctx.fillStyle = shade(L.color, 0.2); ctx.fillRect(0, b - 4, BG_W, 2);
    for (let x = 8; x < BG_W; x += 22 + rng() * 30) {
      const h = 26 + rng() * 26, lean = (rng() - 0.5) * 10;
      wrapDraw(x - 20, 40, xx => {
        const px = xx + 20;
        ctx.strokeStyle = '#4a6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, b - 2); ctx.quadraticCurveTo(px + lean * 0.3, b - h * 0.6, px + lean, b - h); ctx.stroke();
        ctx.fillStyle = '#3a7a3a'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.62; ctx.beginPath(); ctx.ellipse(px + lean + Math.cos(a) * 8, b - h + Math.sin(a) * 4 + 2, 9, 2.6, a, 0, TAU); ctx.fill(); }
      });
    }
    for (let x = 40; x < BG_W; x += 140 + rng() * 90) wrapDraw(x, 40, xx => { const c = KITE[Math.floor(rng() * KITE.length)]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(xx, b - 3); ctx.lineTo(xx + 30, b - 3); ctx.lineTo(xx + 26, b + 1); ctx.lineTo(xx + 4, b + 1); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xx + 4, b - 6); ctx.lineTo(xx + 26, b - 6); ctx.stroke(); });
  },
  // the open ocean band: rows of swell lines getting closer and bigger
  idOcean(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = vgrad(ctx, b, H, L.color, shade(L.color, -0.3)); ctx.fillRect(0, b, BG_W, H - b);
    for (let r = 0; r < 9; r++) {
      const y = b + 4 + r * r * 3.2, a = 0.18 + r * 0.03;
      ctx.strokeStyle = `rgba(230,255,255,${a})`; ctx.lineWidth = 0.8 + r * 0.25;
      for (let x = (r * 37) % 60; x < BG_W; x += 40 + r * 12) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8 + r * 2, y - 2 - r * 0.4, x + 16 + r * 5, y); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, b, BG_W, 1.5);
  },
  // rice terraces stepping down the hills: curved bands of green with silver water lines
  idTerraces(ctx, L, rng, H) {
    const b = L.base;
    for (let hill = 0; hill < 3; hill++) {
      const cx = 170 + hill * 340 + rng() * 40, w = 260 + rng() * 80, top = b - 90 - rng() * 30;
      wrapDraw(cx - w, w * 2, ox => {
        const x = ox + w;
        ctx.fillStyle = shade(L.color, -0.12 - hill * 0.03); ctx.beginPath(); ctx.moveTo(x - w, H); ctx.quadraticCurveTo(x - w * 0.4, top, x, top); ctx.quadraticCurveTo(x + w * 0.4, top, x + w, H); ctx.closePath(); ctx.fill();
        for (let r = 0; r < 9; r++) {
          const y = top + 10 + r * 12, k = (y - top) / (b + 60 - top), half = w * Math.min(1, 0.32 + k * 0.9);
          if (y > H) break;
          ctx.fillStyle = shade(L.color, (r % 2 ? 0.05 : -0.04) + 0.06 * Math.sin(r + hill));
          ctx.beginPath(); ctx.moveTo(x - half, y + 8); ctx.quadraticCurveTo(x, y - 6, x + half, y + 8); ctx.lineTo(x + half, y + 12); ctx.quadraticCurveTo(x, y - 2, x - half, y + 12); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(220,250,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - half * 0.9, y + 8.5); ctx.quadraticCurveTo(x, y - 5, x + half * 0.9, y + 8.5); ctx.stroke();
        }
        // a coconut palm on the ridge and a small thatched farm hut
        ctx.strokeStyle = '#4a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.2, top + 30); ctx.lineTo(x + w * 0.22, top - 6); ctx.stroke();
        ctx.fillStyle = '#2e6a2a'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.6; ctx.beginPath(); ctx.ellipse(x + w * 0.22 + Math.cos(a) * 9, top - 6 + Math.sin(a) * 4, 10, 2.8, a, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - w * 0.3, top + 24, 12, 8); ctx.fillStyle = '#b89a5a'; ctx.beginPath(); ctx.moveTo(x - w * 0.3 - 4, top + 25); ctx.lineTo(x - w * 0.3 + 6, top + 16); ctx.lineTo(x - w * 0.3 + 16, top + 25); ctx.fill();
      });
    }
  },
  // palms, banana plants and frangipani in the foreground
  idPalms(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 10; x < BG_W; x += 50 + rng() * 60) {
      const h = 80 + rng() * 60, lean = (rng() - 0.4) * 30, kind = rng();
      wrapDraw(x - 40, 80, xx => {
        const px = xx + 40;
        if (kind < 0.6) {
          ctx.strokeStyle = shade(L.color, 0.15); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, b + 4); ctx.quadraticCurveTo(px + lean * 0.2, b - h * 0.6, px + lean, b - h); ctx.stroke();
          ctx.fillStyle = shade(L.color, 0.1); for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.52; ctx.save(); ctx.translate(px + lean, b - h); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(16, -6, 32, 6); ctx.quadraticCurveTo(16, 2, 0, 0); ctx.fill(); ctx.restore(); }
        } else {
          for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.45; ctx.save(); ctx.translate(px, b); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = shade(L.color, 0.05 + (k % 2) * 0.08); ctx.beginPath(); ctx.ellipse(0, -h * 0.35, 9, h * 0.35, 0, 0, TAU); ctx.fill(); ctx.restore(); }
        }
      });
    }
  },
  // the volcano's black crater rim: lava fields with glowing cracks and a few hardy pines
  idCrater(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, b - 30 - 26 * Math.sin(x * 0.009) - 14 * Math.sin(x * 0.031 + 1));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,110,40,0.55)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) { let x = rng() * BG_W, y = b - 10 + rng() * 60; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += 6 + rng() * 10; y += (rng() - 0.5) * 8; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let x = 20; x < BG_W; x += 70 + rng() * 80) wrapDraw(x - 10, 20, xx => { const px = xx + 10, by = b - 30 - 26 * Math.sin(px * 0.009) - 14 * Math.sin(px * 0.031 + 1) + 4, h = 24 + rng() * 22; ctx.fillStyle = shade(L.color, 0.12); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px - 9 + k * 2, by - k * h / 4); ctx.lineTo(px, by - h - 4 - k * 2); ctx.lineTo(px + 9 - k * 2, by - k * h / 4); ctx.fill(); } });
  },
  // the deep water of the night dive: a black-blue gradient with faint moonlight shafts
  idDeep(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, 0.15), shade(L.color, -0.55)); ctx.fillRect(0, 0, BG_W, H);
    for (let i = 0; i < 5; i++) { const x = rng() * BG_W, g = ctx.createLinearGradient(x, 0, x + 80, H * 0.8); g.addColorStop(0, 'rgba(160,220,255,0.10)'); g.addColorStop(1, 'rgba(160,220,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 130, H * 0.8); ctx.lineTo(x + 70, H * 0.8); ctx.closePath(); ctx.fill(); }
  },
  // reef silhouettes: staghorn branches, sea fans and brain corals
  idReefBg(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 0; x < BG_W; x += 26 + rng() * 34) {
      const k = rng(), h = 30 + rng() * 60;
      wrapDraw(x - 30, 60, xx => {
        const px = xx + 30;
        ctx.fillStyle = shade(L.color, 0.06 + k * 0.08); ctx.strokeStyle = shade(L.color, 0.06 + k * 0.08);
        if (k < 0.35) { ctx.lineWidth = 4; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(px, b + 2); ctx.quadraticCurveTo(px + (j - 1.5) * 10, b - h * 0.5, px + (j - 1.5) * 18, b - h + j * 6); ctx.stroke(); } }
        else if (k < 0.7) { ctx.beginPath(); ctx.moveTo(px - 2, b + 2); ctx.quadraticCurveTo(px - h * 0.5, b - h, px, b - h * 1.05); ctx.quadraticCurveTo(px + h * 0.5, b - h, px + 2, b + 2); ctx.fill(); ctx.strokeStyle = shade(L.color, -0.15); ctx.lineWidth = 0.8; for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.moveTo(px, b); ctx.lineTo(px + (j - 2.5) * h * 0.14, b - h * 0.9); ctx.stroke(); } }
        else { ctx.beginPath(); ctx.ellipse(px, b, h * 0.5, h * 0.36, 0, Math.PI, TAU); ctx.fill(); }
      });
    }
  },
  // the jungle canopy: misty layers of round crowns
  idJungle(ctx, L, rng, H) {
    const b = L.base;
    for (let r = 0; r < 3; r++) {
      const col = shade(L.color, -r * 0.12), y0 = b + r * 34;
      ctx.fillStyle = col; ctx.fillRect(0, y0, BG_W, H - y0);
      for (let x = -20; x < BG_W + 40; x += 30 + rng() * 40) { const rad = 26 + rng() * 34; ctx.beginPath(); ctx.arc(x, y0 + 4, rad, Math.PI, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(220,255,230,0.10)'; ctx.fillRect(0, y0 - 6, BG_W, 10);
    }
  },
  // overgrown stone ruins: walls, arched doorways and banyan roots spilling over them
  idRuinsBg(ctx, L, rng, H) {
    const b = L.base;
    let x = 0;
    while (x < BG_W) {
      const w = 90 + rng() * 80, h = 70 + rng() * 60, top = b - h, arch = rng() < 0.6;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(L.color, -0.05); ctx.fillRect(xx, top, w - 6, H - top);
        ctx.strokeStyle = rgba(shade(L.color, -0.35), 0.5); ctx.lineWidth = 1;
        for (let yy = top + 12; yy < b; yy += 12) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + w - 6, yy); ctx.stroke(); for (let k = ((yy / 12) % 2) * 9; k < w - 6; k += 18) { ctx.beginPath(); ctx.moveTo(xx + k, yy); ctx.lineTo(xx + k, yy - 12); ctx.stroke(); } }
        ctx.fillStyle = shade(L.color, 0.12); ctx.fillRect(xx - 3, top - 6, w, 7);
        for (let k = 0; k < w; k += 14) { ctx.fillRect(xx + k, top - 12, 8, 6); }
        if (arch) { ctx.fillStyle = shade(L.color, -0.5); ctx.beginPath(); ctx.moveTo(xx + w / 2 - 16, b); ctx.lineTo(xx + w / 2 - 16, b - 40); ctx.arc(xx + w / 2, b - 40, 16, Math.PI, TAU); ctx.lineTo(xx + w / 2 + 16, b); ctx.fill(); }
        ctx.fillStyle = 'rgba(70,140,60,0.55)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(xx + rng() * w, top - 4 + rng() * 14, 5 + rng() * 7, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = 'rgba(90,70,50,0.75)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const rx = xx + rng() * w; ctx.beginPath(); ctx.moveTo(rx, top - 6); ctx.quadraticCurveTo(rx + (rng() - 0.5) * 30, top + h * 0.5, rx + (rng() - 0.5) * 20, b); ctx.stroke(); }
      });
      x += w + rng() * 30;
    }
  },
  // lianas hanging from the canopy in the foreground
  idVines(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 18 + rng() * 36) {
      const len = 60 + rng() * 160;
      ctx.strokeStyle = shade(L.color, rng() * 0.2); ctx.lineWidth = 2 + rng() * 2; ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y <= len; y += 10) ctx.lineTo(x + Math.sin(y * 0.05 + x) * 5, y); ctx.stroke();
      ctx.fillStyle = shade(L.color, 0.18); for (let y = 20; y < len; y += 22) { ctx.beginPath(); ctx.ellipse(x + Math.sin(y * 0.05 + x) * 5 + 5, y, 6, 2.5, 0.5, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = L.color; for (let x = -20; x < BG_W + 20; x += 24 + rng() * 20) { ctx.beginPath(); ctx.arc(x, -6, 26 + rng() * 14, 0, Math.PI); ctx.fill(); }
  }
};
const dyn = {
  // breakers rolling across the open sea
  idBreakers(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 7; i++) {
      const sp = 26 + i * 6, x = ((i * 157 + t * sp - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (L.base - L.top + 10 + (i % 3) * 14) * S;
      for (const xx of [x, x - BG_W * S]) { if (xx < -120 * S || xx > W + 20) continue; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(xx, y); ctx.quadraticCurveTo(xx + 30 * S, y - 7 * S, xx + 70 * S, y); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(xx + 10 * S, y + 1 * S, 50 * S, 2 * S); }
    }
  },
  // giant festival kites high over the terraces, tails rippling
  idSkyKites(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 5; i++) {
      const x = ((i * 220 + 60 - camX * 0.05 + Math.sin(t * 0.3 + i) * 20) % BG_W + BG_W) % BG_W * S, y = oy + (60 + i * 22 + Math.sin(t * 0.7 + i * 2) * 8) * S, c = KITE[i % KITE.length], c2 = KITE[(i + 2) % KITE.length];
      ctx.save(); ctx.translate(x, y); ctx.scale(S * (0.6 + (i % 3) * 0.15), S * (0.6 + (i % 3) * 0.15)); ctx.rotate(Math.sin(t * 0.9 + i) * 0.12);
      ctx.strokeStyle = 'rgba(60,40,40,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-60, 200); ctx.stroke();
      if (i % 2) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 30, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-44, -12); ctx.lineTo(-40, 0); ctx.lineTo(-44, 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(18, -3, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(19, -3, 2, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(34, 0); ctx.lineTo(0, 6); ctx.lineTo(-34, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 6); for (let k = 1; k < 10; k++) ctx.lineTo(Math.sin(t * 3 + k * 0.7 + i) * 6, 6 + k * 9); ctx.stroke(); }
      ctx.restore();
    }
  },
  // stars and a setting moon that fade as the sun comes up (9-3)
  idNightSky(ctx, L, camX, oy, S, W, t) {
    const k = IdSky.k, a = clamp(1 - k * 1.5, 0, 1);
    if (a <= 0.01) return;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) { const x = (((i * 97.3 - camX * 0.01) % BG_W + BG_W) % BG_W) * S, y = ((i * 53.7) % 220) * S, tw = 0.5 + 0.5 * Math.sin(t * (1 + i % 3) + i); if (x > W) continue; ctx.globalAlpha = a * (0.3 + 0.6 * tw); ctx.fillRect(x, y, 1.4 * S, 1.4 * S); }
    ctx.globalAlpha = a;
    const mx = W * 0.18, my = (50 + k * 160) * S, r = 16 * S;
    const g = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3); g.addColorStop(0, 'rgba(220,230,255,0.35)'); g.addColorStop(1, 'rgba(220,230,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4f2ff'; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,160,200,0.35)'; ctx.beginPath(); ctx.arc(mx - r * 0.3, my - r * 0.2, r * 0.25, 0, TAU); ctx.arc(mx + r * 0.3, my + r * 0.25, r * 0.18, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  },
  // mantas gliding through the dark water far behind the reef (9-4)
  idMantasBg(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 3; i++) {
      const x = ((i * 380 + t * (14 + i * 4) - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (110 + i * 60 + Math.sin(t * 0.5 + i) * 12) * S, s = S * (0.8 + i * 0.25), f = Math.sin(t * 1.4 + i) * 0.25;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#0a2238'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.quadraticCurveTo(0, -36 - f * 20, -20, -40 - f * 26); ctx.quadraticCurveTo(-10, -10, -26, 0); ctx.quadraticCurveTo(-10, 10, -20, 40 + f * 26); ctx.quadraticCurveTo(0, 36 + f * 20, 20, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(120,230,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-56, 2); ctx.stroke();
      ctx.restore();
    }
  },
  // pinpricks of bioluminescence twinkling on the far reef
  idGlowDots(ctx, L, camX, oy, S, W, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const x = ((i * 71.3 - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (L.base - L.top - 80 + (i * 37) % 120) * S, a = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 1.7); ctx.fillStyle = `rgba(${i % 3 ? '90,240,255' : '170,255,140'},${0.55 * a})`; ctx.beginPath(); ctx.arc(x % W, y, (1 + (i % 3)) * S, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};

/* ---------------- tiles ---------------- */
// a batik-wrapped bundle (kawung motif) for the item block
function batikBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,200,100,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = '#5a2a12'; rr(ctx, 1, 4, TS - 2, TS - 5, 6); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, 1, 4, TS - 2, TS - 5, 6); ctx.clip();
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
    const cx = 5 + gx * 11 + (gy % 2) * 5, cy = 9 + gy * 9;
    ctx.fillStyle = '#f0d8a8'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, 3.1, 1.7, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d88a2a'; ctx.beginPath(); ctx.arc(cx, cy, 1.1, 0, TAU); ctx.fill();
  }
  const sx = -8 + f * 12; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1.2; rr(ctx, 1, 4, TS - 2, TS - 5, 6); ctx.stroke();
  ctx.fillStyle = '#8a4a1c'; ctx.beginPath(); ctx.ellipse(TS / 2 - 5, 3.5, 5.5, 3, -0.5, 0, TAU); ctx.ellipse(TS / 2 + 5, 3.5, 5.5, 3, 0.5, 0, TAU); ctx.fill();
  frangipani(ctx, TS / 2, 4, 4, f * 0.2);
}
function batikUsed(ctx) { ctx.fillStyle = '#8a7058'; rr(ctx, 1, 5, TS - 2, TS - 6, 6); ctx.fill(); ctx.strokeStyle = '#5a4430'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 3; k++) ctx.fillRect(4, 10 + k * 7, TS - 8, 1.5); }
// bamboo: a one-way platform of lashed poles
const bamboo = { style: 'idBamboo', c1: '#c8b45a', c2: '#8a7a2a', paint(ctx, part, x0, x1) {
  const g = ctx.createLinearGradient(0, 0, 0, 10); g.addColorStop(0, '#e8d880'); g.addColorStop(1, '#9a8a3a');
  ctx.fillStyle = g; rr(ctx, x0, 0, x1 - x0, 9, 4); ctx.fill();
  ctx.fillStyle = 'rgba(80,70,20,0.6)'; for (let x = x0 + 7; x < x1 - 2; x += 10) ctx.fillRect(x, 0, 1.6, 9);
  ctx.fillStyle = 'rgba(255,255,230,0.6)'; ctx.fillRect(x0 + 2, 1.5, x1 - x0 - 4, 1.2);
  ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 1.2; if (part === 'L' || part === 'S') { ctx.beginPath(); ctx.moveTo(x0 + 3, 0); ctx.lineTo(x0 + 3, 9); ctx.stroke(); } if (part === 'R' || part === 'S') { ctx.beginPath(); ctx.moveTo(x1 - 3, 0); ctx.lineTo(x1 - 3, 9); ctx.stroke(); }
} };
// the grey volcanic paras stone of Balinese walls, carved with a little lotus band
const paras = { style: 'stone', c1: '#a8a08a', c2: '#7a7260', mortar: '#4a4636', paint(ctx) {
  ctx.fillStyle = '#4a4636'; ctx.fillRect(0, 0, TS, TS);
  for (const [x, y, w, h] of [[1, 1, 18, 14], [20, 1, 11, 14], [1, 16, 10, 15], [12, 16, 19, 15]]) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#b8ae96'); g.addColorStop(1, '#8a8270'); ctx.fillStyle = g; rr(ctx, x, y, w, h, 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(60,50,40,0.45)'; ctx.lineWidth = 0.8; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(6 + k * 7, 9, 3, Math.PI, TAU); ctx.stroke(); }
  ctx.fillStyle = 'rgba(90,160,70,0.55)'; ctx.beginPath(); ctx.arc(4, 3, 3, 0, TAU); ctx.arc(26, 28, 2.5, 0, TAU); ctx.fill();
} };
const reefRock = { c1: '#4a4a58', c2: '#22222c', paint(ctx) {
  const g = ctx.createLinearGradient(0, 0, TS, TS); g.addColorStop(0, '#5a5866'); g.addColorStop(1, '#262430'); ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (const [x, y, r] of [[8, 9, 3], [22, 6, 2], [16, 20, 4], [26, 24, 2.5], [6, 25, 2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(2, 2, TS - 4, 2);
  ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(28, 4, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#7ae0c8'; ctx.beginPath(); ctx.arc(4, 14, 1.6, 0, TAU); ctx.fill();
} };
const base = {
  brick: paras, hard: reefRock, semi: bamboo, pillar: { c1: '#a8a08a', c2: '#6a6250', cap: '#d8d0b8', style: 'column' },
  accent: COL.a, qblockArt: batikBlock, usedArt: batikUsed, tint: {}, bloom: 0.17
};
const riceCap = (ctx, x0, x1, rng) => {
  ctx.fillStyle = '#4aa83a'; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = '#8ad85a'; ctx.fillRect(x0, 0, x1 - x0, 2);
  ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 1.2; for (let x = x0 + 2; x < x1 - 1; x += 4) { ctx.beginPath(); ctx.moveTo(x, 3); ctx.quadraticCurveTo(x - 1, -2, x - 3, -5 + (x % 3)); ctx.moveTo(x, 3); ctx.quadraticCurveTo(x + 1, -3, x + 2, -6 + (x % 2)); ctx.stroke(); }
};
const mossStone = { style: 'idMoss', cap: '#5a9a3a', capHi: '#9ad86a', dirt: '#6a6a5a', dirt2: '#3a3a30', rock: '#8a8a78',
  paint(ctx, rng) { ctx.strokeStyle = 'rgba(30,30,20,0.45)'; ctx.lineWidth = 1; for (const y of [10, 21]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TS, y); ctx.stroke(); } for (const [x, y0, y1] of [[12, 0, 10], [24, 10, 21], [8, 21, TS]]) { ctx.beginPath(); ctx.moveTo(x + rng() * 4, y0); ctx.lineTo(x + rng() * 4, y1); ctx.stroke(); } ctx.fillStyle = 'rgba(110,170,70,0.35)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 2 + rng() * 3, 0, TAU); ctx.fill(); } },
  paintCap(ctx, x0, x1, rng) { ctx.fillStyle = '#3a7a2a'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#7ac84a'; for (let x = x0; x < x1; x += 5) { ctx.beginPath(); ctx.arc(x + 2, 1.5, 3, Math.PI, TAU); ctx.fill(); } ctx.fillStyle = '#4a8a2a'; for (let x = x0 + 3; x < x1; x += 9) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.quadraticCurveTo(x + 2, 9, x + 1, 13); ctx.lineTo(x + 3, 6); ctx.fill(); } }
};
const themes = {
  id_surf: Object.assign({}, base, {
    name: 'Kuta Surf Break', music: 'tour_id_surf', particles: 'none',
    sky: ['#1a86e8', '#78d4ff', '#fff2d0'], horizonGlow: '#fff0c0',
    celestial: { type: 'sun', x: 0.8, y: 0.16, r: 38, color: '#fffbe0', glow: '#ffe08a' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'idVolcanoes', color: '#7a9ac8', base: 236, h: 130, f: 0.02, blur: true, at: 60, haze: '#d8f0ff' },
      { kind: 'idCoast', color: '#e8cc8a', base: 240, f: 0.035 },
      { kind: 'idOcean', color: '#2aaed0', base: 244, f: 0.06, dyn: 'idBreakers' }
    ],
    fog: '#e8fff8', liquid: 'id_sea',
    ground: { style: 'sand', cap: '#f6dfa4', capHi: '#fff8dc', dirt: '#e6c482', dirt2: '#c09452', rock: '#d8b070' },
    decor: ['idPalmS', 'idBoards', 'idShells', 'idPalmS']
  }),
  id_kites: Object.assign({}, base, {
    name: 'Kite Festival', music: 'tour_id', particles: 'leaves',
    sky: ['#2a8ee8', '#9adcff', '#f6fff0'], horizonGlow: '#f0ffd8',
    celestial: { type: 'sun', x: 0.22, y: 0.14, r: 34, color: '#fffbe8', glow: '#fff0a8' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'idVolcanoes', color: '#8aa8cc', base: 232, h: 120, f: 0.02, blur: true, at: 400, haze: '#e8fff0', dyn: 'idSkyKites' },
      { kind: 'idTerraces', color: '#5aa83a', base: 300, f: 0.09 },
      { kind: 'idPalms', color: '#2a5e2a', base: 352, f: 0.26 }
    ],
    fog: '#eaffe0',
    ground: { style: 'grass', cap: '#4aa83a', capHi: '#8ad85a', dirt: '#8a5a32', dirt2: '#5a3a1e', rock: '#9a7a52', paintCap: riceCap },
    decor: ['idRiceTuft', 'idFrangipani', 'idRiceTuft', 'idPalmS']
  }),
  id_batur: Object.assign({}, base, {
    name: 'Batur Sunrise Trek', music: 'tour_id_dawn', particles: 'embers',
    sky: ['#05061a', '#16123a', '#2a2050'], horizonGlow: '#4a2a6a',
    celestial: { type: 'sun', x: 0.74, y: 1.2, r: 40, color: '#fff2c0', glow: '#ffb060' }, stars: 0,
    layers: [
      { kind: 'idNone', color: '#000000', base: 0, f: 0, dyn: 'idNightSky' },
      { kind: 'idVolcanoes', color: '#1c1c36', base: 250, h: 170, f: 0.025, at: 300, glow: true, lake: '#24365a' },
      { kind: 'idCrater', color: '#151020', base: 330, f: 0.16 }
    ],
    fog: '#3a2a50', liquid: 'id_lava',
    ground: { style: 'basalt', cap: '#3a3038', capHi: '#6a5a62', dirt: '#2a2228', dirt2: '#120c10', rock: '#4a3a40' },
    hard: { c1: '#4a3e44', c2: '#1e161a' }, semi: { style: 'plank', c1: '#7a5a3a', c2: '#4a3020' },
    decor: ['idTorch', 'idLavaRock', 'idTorch', 'idPine']
  }),
  id_dive: Object.assign({}, base, {
    name: 'Manta Point', music: 'tour_id_deep', particles: 'bubbles', underwater: true,
    sky: ['#062a48', '#041a30', '#020a16'], horizonGlow: '#1a6a9a', celestial: { type: 'none' }, stars: 0,
    layers: [
      { kind: 'idDeep', color: '#0a3050', base: 0, f: 0.04, dyn: 'idMantasBg' },
      { kind: 'idReefBg', color: '#0c3450', base: 320, f: 0.14, dyn: 'idGlowDots' }
    ],
    fog: '#0a4a7a', darkness: 0.5,
    ground: { style: 'coral', cap: '#ff7a9a', capHi: '#ffc0d0', dirt: '#24304a', dirt2: '#101828', rock: '#3a4a64' },
    hard: reefRock, decor: ['idCoral', 'idAnemone', 'idCoral']
  }),
  id_ruins: Object.assign({}, base, {
    name: 'Monkey Forest Ruins', music: 'tour_id', particles: 'leaves',
    sky: ['#2a6a52', '#8acaa8', '#eaf8e0'], horizonGlow: '#e8ffd0', rays: '#fff4c0',
    celestial: { type: 'none' }, stars: 0,
    layers: [
      { kind: 'idJungle', color: '#2e6440', base: 250, f: 0.04, blur: true },
      { kind: 'idRuinsBg', color: '#7a8270', base: 340, f: 0.12 },
      { kind: 'idVines', color: '#1e4a2a', base: 0, f: 0.22 }
    ],
    fog: '#d0f0d0', ground: mossStone, semi: { style: 'mossy', c1: '#7a6a4a', c2: '#4a3a24' },
    decor: ['idFern', 'idMossRock', 'idBanana', 'idFern']
  })
};

/* ---------------- decor ---------------- */
function boardShape(ctx, x, y, len, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  const w = len / 2, c = col || '#ff5a8a';
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(1, 2, w, 4.4, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(0, -4, 0, 4); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f0e2c8');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(-w, -4.2, -w * 0.4, -4.2); ctx.lineTo(w * 0.5, -3.6); ctx.quadraticCurveTo(w, -2, w + 2, 0); ctx.quadraticCurveTo(w, 2, w * 0.5, 3.6); ctx.lineTo(-w * 0.4, 4.2); ctx.quadraticCurveTo(-w, 4.2, -w, 0); ctx.fill();
  ctx.fillStyle = c; ctx.fillRect(-w * 0.75, -1.2, w * 1.5, 2.4);
  ctx.fillStyle = COL.b; ctx.fillRect(-w * 0.75, -3, w * 0.25, 6);
  frangipani(ctx, w * 0.25, 0, 3.4, 0.4);
  ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(-w * 0.8, 3); ctx.lineTo(-w * 0.62, 3); ctx.lineTo(-w * 0.78, 8); ctx.fill();
  ctx.restore();
}
const decor = {
  idPalmS(ctx, x, y, t) {
    const sw = Math.sin(t * 1.3 + x) * 2;
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y - 40, x + 10 + sw, y - 76); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 1; for (let k = 1; k < 7; k++) { const yy = y - k * 11; ctx.beginPath(); ctx.moveTo(x - 2 + k * 1.2, yy); ctx.lineTo(x + 3 + k * 1.2, yy + 1); ctx.stroke(); }
    ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.55 + Math.sin(t + k) * 0.04; ctx.save(); ctx.translate(x + 10 + sw, y - 76); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -7, 36, 7); ctx.quadraticCurveTo(18, 2, 0, 0); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#6a4a1a'; for (const [dx, dy] of [[-3, 2], [3, 3], [0, 6]]) { ctx.beginPath(); ctx.arc(x + 10 + sw + dx, y - 74 + dy, 3.4, 0, TAU); ctx.fill(); }
  },
  idBoards(ctx, x, y) {
    const cols = ['#ff5a8a', '#14b4ac', '#ffc23a'];
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x - 12 + k * 12, y - 22); ctx.rotate(-0.12 + k * 0.12); boardShape(ctx, 0, 0, 46, Math.PI / 2, cols[k]); ctx.restore(); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, 22, 3, 0, 0, TAU); ctx.fill();
  },
  idShells(ctx, x, y) {
    ctx.fillStyle = '#ff9a7a'; ctx.beginPath(); K.star(ctx, x - 8, y - 3, 6, 2.6, 5); ctx.fill();
    ctx.fillStyle = '#fff0e0'; ctx.beginPath(); ctx.ellipse(x + 6, y - 3, 5, 3.5, -0.3, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = '#d8b8a0'; ctx.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + 6, y - 2); ctx.lineTo(x + 6 + k * 2, y - 6); ctx.stroke(); }
  },
  idUmbrella(ctx, x, y) {
    ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x - 1.5, y - 54, 3, 54);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff4e0' : COL.a; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x - 30 + k * 10, y - 46); ctx.lineTo(x - 20 + k * 10, y - 46); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#c8a070'; ctx.fillRect(x + 6, y - 6, 22, 3); ctx.fillRect(x + 8, y - 6, 2, 6); ctx.fillRect(x + 25, y - 6, 2, 6);
  },
  idRiceTuft(ctx, x, y, t) {
    for (let k = -2; k <= 2; k++) { ctx.strokeStyle = k % 2 ? '#5ab83a' : '#7ad04a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.quadraticCurveTo(x + k * 4, y - 10, x + k * 6 + Math.sin(t * 2 + k) * 2, y - 18 - Math.abs(k) * 2); ctx.stroke(); }
    ctx.fillStyle = '#e8c85a'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(x + k * 6 + Math.sin(t * 2 + k) * 2, y - 19 - Math.abs(k) * 2, 1.6, 3.4, k * 0.4, 0, TAU); ctx.fill(); }
  },
  idFrangipani(ctx, x, y, t) {
    ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.moveTo(x, y - 20); ctx.quadraticCurveTo(x - 12, y - 30, x - 16, y - 40); ctx.moveTo(x, y - 24); ctx.quadraticCurveTo(x + 10, y - 34, x + 18, y - 42); ctx.stroke();
    ctx.fillStyle = '#4a8a3a'; for (const [dx, dy] of [[-16, -42], [18, -44], [0, -30], [-6, -48], [8, -52]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 9, 4, dx * 0.04, 0, TAU); ctx.fill(); }
    for (const [dx, dy, c] of [[-14, -46, '#fffaf0'], [16, -48, '#ffd0e0'], [-2, -54, '#fffaf0'], [6, -38, '#ffd0e0']]) frangipani(ctx, x + dx, y + dy, 4.4, t * 0.1 + dx, c);
  },
  idTorch(ctx, x, y, t) {
    ctx.fillStyle = '#c8b45a'; ctx.fillRect(x - 2, y - 46, 4, 46); ctx.fillStyle = '#8a7a2a'; for (let k = 1; k < 5; k++) ctx.fillRect(x - 2, y - k * 10, 4, 1.5);
    ctx.fillStyle = '#6a5a2a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 46); ctx.lineTo(x + 4, y - 46); ctx.lineTo(x + 3, y - 52); ctx.lineTo(x - 3, y - 52); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const f = Math.sin(t * 14 + k * 2) * 2; ctx.fillStyle = ['rgba(255,220,120,0.9)', 'rgba(255,140,40,0.7)', 'rgba(255,80,20,0.5)'][k]; ctx.beginPath(); ctx.moveTo(x - 4 + k, y - 52); ctx.quadraticCurveTo(x - 5 + f, y - 60 - k * 3, x + f * 0.5, y - 68 - k * 2); ctx.quadraticCurveTo(x + 5 + f, y - 60, x + 4 - k, y - 52); ctx.fill(); }
    ctx.restore();
  },
  idLavaRock(ctx, x, y, t) {
    ctx.fillStyle = '#2a2228'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 12, y - 12); ctx.lineTo(x - 2, y - 17); ctx.lineTo(x + 10, y - 13); ctx.lineTo(x + 16, y); ctx.fill();
    ctx.strokeStyle = `rgba(255,${110 + Math.sin(t * 2 + x) * 30},40,0.85)`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.lineTo(x - 4, y - 9); ctx.lineTo(x + 2, y - 7); ctx.lineTo(x + 6, y - 12); ctx.stroke();
  },
  idPine(ctx, x, y) { ctx.fillStyle = '#3a2a24'; ctx.fillRect(x - 2, y - 12, 4, 12); ctx.fillStyle = '#1e2a2a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 14 + k * 2.5, y - 10 - k * 11); ctx.lineTo(x, y - 30 - k * 12); ctx.lineTo(x + 14 - k * 2.5, y - 10 - k * 11); ctx.fill(); } },
  idCoral(ctx, x, y, t) {
    const cols = ['#ff7a9a', '#ffb05a', '#c87aff'];
    for (let k = -2; k <= 2; k++) { ctx.strokeStyle = cols[(k + 3) % 3]; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + k * 5, y); ctx.quadraticCurveTo(x + k * 9 + Math.sin(t + k) * 2, y - 12, x + k * 12, y - 20 - (k % 2) * 6); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(120,255,230,${0.25 + 0.2 * Math.sin(t * 2 + x)})`; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x + k * 12, y - 20 - (k % 2) * 6, 3, 0, TAU); ctx.fill(); } ctx.restore();
  },
  idAnemone(ctx, x, y, t) {
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.25; ctx.strokeStyle = k % 2 ? '#ff6ac8' : '#ffa0e0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.quadraticCurveTo(x + Math.cos(a) * 10 + Math.sin(t * 2 + k) * 3, y - 4 + Math.sin(a) * 10, x + Math.cos(a) * 14 + Math.sin(t * 2 + k) * 4, y - 4 + Math.sin(a) * 16); ctx.stroke(); }
    ctx.fillStyle = '#c84a8a'; ctx.beginPath(); ctx.ellipse(x, y - 3, 8, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(x + 6 + Math.sin(t) * 3, y - 14, 4, 2.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 5 + Math.sin(t) * 3, y - 16, 1.4, 4);
  },
  idPaddyRice(ctx, x, y, t, th, d) { for (let k = -1; k <= 1; k++) { const sx = x + k * 9 + ((d.seed * 7) % 5) - 2; ctx.strokeStyle = k ? '#5aa83a' : '#7ac84a'; ctx.lineWidth = 1.5; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.quadraticCurveTo(sx + j * 2, y - 34, sx + j * 5 + Math.sin(t * 1.5 + k + j) * 1.5, y - 52 - (j ? 0 : 6)); ctx.stroke(); } } },
  idFern(ctx, x, y, t) { for (let k = -3; k <= 3; k++) { const a = -Math.PI / 2 + k * 0.35; ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); const ex = x + Math.cos(a) * 22, ey = y + Math.sin(a) * 18; ctx.quadraticCurveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 18, ex + Math.sin(t + k) * 1.5, ey); ctx.stroke(); ctx.fillStyle = '#4aa84a'; for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.ellipse(x + (ex - x) * j / 4, y + (ey - y) * j / 4, 3, 1.2, a + 0.8, 0, TAU); ctx.fill(); } } },
  idMossRock(ctx, x, y) { ctx.fillStyle = '#6a6a5a'; ctx.beginPath(); ctx.ellipse(x, y - 7, 15, 9, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 15, y - 7, 30, 7); ctx.fillStyle = '#5a9a3a'; ctx.beginPath(); ctx.ellipse(x - 2, y - 14, 11, 4, -0.1, 0, TAU); ctx.fill(); },
  idBanana(ctx, x, y, t) { ctx.fillStyle = '#6a7a3a'; ctx.fillRect(x - 3, y - 30, 6, 30); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55 + Math.sin(t + k) * 0.03; ctx.save(); ctx.translate(x, y - 30); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = k % 2 ? '#4a9a3a' : '#5ab84a'; ctx.beginPath(); ctx.ellipse(0, -18, 6, 20, 0, 0, TAU); ctx.fill(); ctx.restore(); } },
  // a wooden pier on pilings (its deck is a one-way platform)
  idPier(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#5a4030'; for (let k = 0; k <= d.w; k += 64) { ctx.fillRect(x0 + k + 4, top + 6, 8, d.h + 40); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0 + k + 4, y + 2 + Math.sin(t * 2 + k) * 2, 8, 3); ctx.fillStyle = '#5a4030'; }
    ctx.fillStyle = '#9a7048'; ctx.fillRect(x0, top, d.w, 9); ctx.fillStyle = '#c8986a'; ctx.fillRect(x0, top, d.w, 2);
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1; for (let k = 8; k < d.w; k += 8) { ctx.beginPath(); ctx.moveTo(x0 + k, top); ctx.lineTo(x0 + k, top + 9); ctx.stroke(); }
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, top - 16); ctx.lineTo(x0 + d.w, top - 16); ctx.stroke(); for (let k = 0; k <= d.w; k += 32) { ctx.beginPath(); ctx.moveTo(x0 + k, top - 16); ctx.lineTo(x0 + k, top); ctx.stroke(); }
  },
  // a bale: an open farm pavilion on posts with a thatched alang-alang roof (the roof is a one-way platform)
  idHut(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#7a5232'; for (const px of [x0 + 6, x0 + d.w - 12]) ctx.fillRect(px, top + 10, 6, d.h - 10);
    ctx.fillStyle = '#a8784a'; ctx.fillRect(x0 + 2, y - 26, d.w - 4, 6);
    ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(x0 - 10, top + 14); ctx.lineTo(x0 + d.w / 2, top - 22); ctx.lineTo(x0 + d.w + 10, top + 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,40,0.6)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x0 + d.w / 2 + (k - 4) * 4, top - 20); ctx.lineTo(x0 + d.w / 2 + (k - 4) * 14, top + 14); ctx.stroke(); }
    ctx.fillStyle = '#e8c87a'; ctx.fillRect(x0 - 10, top + 11, d.w + 20, 3);
  },
  // a durian tree: knobbly trunk and heavy spiky fruit
  idDurianTreeArt(ctx, x, y, t, sh) {
    ctx.fillStyle = '#6a4a32'; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 5, y - 70); ctx.lineTo(x + 5, y - 70); ctx.lineTo(x + 9, y); ctx.fill();
    ctx.fillStyle = '#2e6a2e'; for (const [dx, dy, r] of [[0, -88, 30], [-26, -76, 20], [26, -78, 22], [-10, -104, 18], [14, -102, 18]]) { ctx.beginPath(); ctx.arc(x + dx + (sh || 0), y + dy, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a8a3a'; for (const [dx, dy] of [[-14, -94], [10, -90], [0, -78]]) { ctx.beginPath(); ctx.arc(x + dx + (sh || 0), y + dy, 8, 0, TAU); ctx.fill(); }
  }
};
const decorLights = { idTorch: [120, '#ffa040', -60] };

/* ---------------- enemies ---------------- */
const jellyArt = (ctx, x, y, t, col, glow) => {
  ctx.save(); ctx.translate(x, y);
  if (glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -2, 1, 0, -2, 22); g.addColorStop(0, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -2, 22, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.4;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 3.5, 0); for (let j = 1; j <= 4; j++) ctx.lineTo(k * 3.5 + Math.sin(t * 4 + j + k) * 2.4, j * 4.5); ctx.stroke(); }
  const g = ctx.createRadialGradient(-3, -8, 1, 0, -4, 12); g.addColorStop(0, '#ffffff'); g.addColorStop(1, rgba(col, 0.75));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -2, 11 + Math.sin(t * 3) * 1.2, 9 - Math.sin(t * 3) * 1.2, 0, Math.PI, TAU); ctx.quadraticCurveTo(0, 3, -11, -2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-4, -7, 3, 1.6, -0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-3, -4, 1.1, 0, TAU); ctx.arc(3, -4, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
};
// a jellyfish bobbing at the waterline: the tentacles sting, the bell squishes flat
class IdJelly extends Ent {
  constructor(g, s) { super(g, s, 22, 20); this.enemy = true; this.hx = this.x; this.base = s.y; this.col = ['#c88aff', '#ff8ad0', '#8ad0ff'][Math.floor(Math.abs(s.x) / 41) % 3]; this.k = 0; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.k -= dt; if (this.k <= 0) this.remove = true; return; }
    const rig = this.g.idRig; this.x = this.hx + Math.sin(this.t * 0.7) * 12; this.y = this.base - 12 - (rig ? rig.height(this.cx) : 0) + Math.sin(this.t * 2.4) * 3;
  }
  hit(kind) { if (this.dead) return false; if (kind === 'stomp' || kind === 'spin') { this.dead = true; this.k = 0.4; Sound.play('splat', { pitch: 1.6, vol: 0.5 }); this.g.burst(this.cx, this.cy, 10, this.col, 'spark'); return true; } this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { if (this.dead) { ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1.4, 0.3); jellyArt(ctx, 0, 0, this.t, this.col); ctx.restore(); return; } jellyArt(ctx, this.cx, this.y + 12, this.t, this.col); }
}
// a glowing night-dive jellyfish: drifts up and down, lights the reef, stings
class IdGlowJelly extends Ent {
  constructor(g, s) { super(g, s, 22, 22); this.enemy = true; this.hx = this.x; this.hy = this.y; this.range = (s.range || 2) * TS; this.col = ['#7af0ff', '#c8a0ff', '#9aff9a'][Math.floor(Math.abs(s.x) / 37) % 3]; this.ph = Math.random() * TAU; }
  update(dt) { this.t += dt; if (this.knocked) return this.updateKnocked(dt); this.y = this.hy + Math.sin(this.t * 0.8 + this.ph) * this.range * 0.5; this.x = this.hx + Math.sin(this.t * 0.31 + this.ph) * 8; }
  hit(kind) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI); jellyArt(ctx, 0, 0, this.t, this.col, true); ctx.restore(); return; } jellyArt(ctx, this.cx, this.cy + 2, this.t, this.col, true); }
  get light() { return this.dead ? null : { r: 95, c: 'rgba(' + hexToRgb(this.col).join(',') + ',' }; }
}
const flyfishArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.vx < 0 ? -1 : 1, 1); ctx.rotate(m === 'up' ? -0.35 : 0.35);
  const f = Math.sin(e.t * 30) * 0.3;
  ctx.fillStyle = 'rgba(180,230,255,0.75)'; ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(-8, -12 - f * 6); ctx.lineTo(-10, -4); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(-8, 11 + f * 6); ctx.lineTo(-10, 4); ctx.fill();
  const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#2a6ad8'); g.addColorStop(1, '#c8e8ff'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a6ad8'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, -5); ctx.lineTo(-16, 0); ctx.lineTo(-17, 5); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(7, -1, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(7.5, -1, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
const urchinArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 9); if (m === 'flat') ctx.scale(1.3, 0.4);
  ctx.strokeStyle = '#3a1a4a'; ctx.lineWidth = 1.6; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + Math.sin(t * 2 + k) * 0.05; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke(); }
  ctx.fillStyle = '#4a2a6a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(-3, -3, 2.4, 0, TAU); ctx.fill();
  K.eyes(ctx, 0, -1, e.dir, 2.4, 1.6, true);
  ctx.restore();
};
const duckArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const step = m === 'stun' || m === 'flat' ? 0 : Math.sin(e.t * 14);
  ctx.fillStyle = '#ff9a2a'; ctx.fillRect(-4 + step * 2, -5, 3, 5); ctx.fillRect(1 - step * 2, -5, 3, 5); ctx.fillRect(-6 + step * 2, -1, 6, 1.6); ctx.fillRect(-1 - step * 2, -1, 6, 1.6);
  const body = e.lead ? '#f4f0e4' : '#e8dcc4';
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(-1, -11, 10, 7, -0.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -13); ctx.lineTo(-15, -17); ctx.lineTo(-9, -9); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, -20, 4.5, 8, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(7, -25, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8b090'; ctx.beginPath(); ctx.ellipse(-3, -11, 6, 3.5, -0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb02a'; ctx.beginPath(); ctx.moveTo(11, -26); ctx.lineTo(17, -24); ctx.lineTo(11, -22); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(9, -26, 1.2, 0, TAU); ctx.fill();
  if (e.lead) { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(3, -16); ctx.lineTo(1, -40); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(1, -40); ctx.lineTo(-11 + Math.sin(t * 8) * 1.5, -37); ctx.lineTo(1, -33); ctx.fill(); ctx.fillStyle = COL.a; ctx.fillRect(-5, -38, 3, 3); }
  ctx.restore();
  if (e.panic > 0 && m !== 'flat') { ctx.fillStyle = '#ffffff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('?!', x, y - 34); }
};
const DUCK = { w: 20, h: 26, speed: 1.0, behavior: 'walk', edgeTurn: true, art: duckArt, burst: '#f4f0e4' };
// Balinese ducks march in single file after a leader with a little flag; knock out the leader and the rest panic
class IdDuck extends TourEnemy {
  constructor(g, s) { super(g, s, DUCK); this.lead = !!s.lead; this.grp = s.grp || 0; this.panic = 0; this.edgeTurn = true; }
  think(dt) {
    if (!this.lead && this.panic <= 0 && !this.calm) {
      if (!this.leader) this.leader = this.g.entities.find(e => e instanceof IdDuck && e.lead && e.grp === this.grp) || null;
      if (this.leader && (this.leader.dead || this.leader.remove)) { this.panic = 5; this.calm = true; K.say(this.g, this, 'QUACK?!', '#ffffff'); }
      else if (!this.leader) this.calm = true;
    }
    if (this.panic > 0) { this.panic -= dt; this.mode = this.onGround ? 'walk' : 'hop'; if (this.onGround) { this.vx = this.dir * 3.2 * TS; if (Math.random() < dt * 2.5) { this.vy = -8 * TS; this.onGround = false; if (Math.random() < 0.5) this.dir = -this.dir; } } return; }
    super.think(dt);
  }
}
const scarecrowArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.2, 0.35);
  const shake = m === 'throw' ? Math.sin(t * 40) * 0.12 : Math.sin(t * 1.5) * 0.04;
  ctx.fillStyle = '#8a7a3a'; ctx.fillRect(-2, -44, 4, 44);
  ctx.save(); ctx.translate(0, -36); ctx.rotate(shake);
  ctx.fillStyle = '#8a7a3a'; ctx.fillRect(-18, -2, 36, 3);
  ctx.fillStyle = '#c8402a'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.lineTo(12, 22); ctx.lineTo(-12, 22); ctx.fill();
  ctx.fillStyle = '#ffd23a'; for (let k = 0; k < 3; k++) ctx.fillRect(-11, 6 + k * 6, 22, 2);
  ctx.fillStyle = '#e8d08a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 18, -1); ctx.lineTo(s * 24, 4); ctx.lineTo(s * 20, 6); ctx.fill(); }
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 16, 0); ctx.lineTo(s * 16, 8); ctx.stroke(); ctx.fillStyle = '#b8b8c8'; ctx.fillRect(s * 16 - 3, 8 + Math.sin(t * 9 + s) * 1.5, 6, 7); }
  ctx.fillStyle = '#f2dca8'; ctx.beginPath(); ctx.arc(0, -8, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(0, -22); ctx.lineTo(15, -10); ctx.closePath(); ctx.fill();
  if (m !== 'flat') K.eyes(ctx, 0, -8, e.dir, 2.6, 1.5, true);
  ctx.restore(); ctx.restore();
};
const dragonflyArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * 40);
  ctx.fillStyle = 'rgba(200,240,255,0.55)'; for (const [dx, s] of [[-2, 1], [3, -1]]) { ctx.beginPath(); ctx.ellipse(dx, -5 - f * 2 * s, 9, 3, -0.3 * s, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(dx, 5 + f * 2 * s, 9, 3, 0.3 * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e8402a'; ctx.fillRect(-16, -1.5, 16, 3); ctx.fillStyle = '#ff7a2a'; for (let k = 0; k < 4; k++) ctx.fillRect(-15 + k * 4, -1.5, 1.4, 3);
  ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.ellipse(3, 0, 5, 3.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2ad8a0'; ctx.beginPath(); ctx.arc(8, -1.5, 2.6, 0, TAU); ctx.arc(8, 1.5, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
};
const sateArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#8a6a3a', 3.5, 6, m === 'stun');
  ctx.translate(0, -6);
  ctx.fillStyle = '#c8a070'; ctx.fillRect(-1, -34, 2, 34);
  ctx.beginPath(); ctx.moveTo(-1.5, -34); ctx.lineTo(0, -42); ctx.lineTo(1.5, -34); ctx.fill();
  for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#a8501a', '#8a3a12', '#b8602a', '#9a4a1a'][k]; rr(ctx, -6 + (k % 2), -30 + k * 7, 12, 6.5, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,0.35)'; ctx.fillRect(-4, -29 + k * 7, 6, 1.4); }
  ctx.fillStyle = '#c8822a'; ctx.beginPath(); ctx.ellipse(1, -3, 5, 2.4, 0, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -26, 1, 2.2, 1.6, true);
  ctx.restore();
};
const civetArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const crouch = m === 'notice' ? 3 : 0, run = m === 'charge' ? Math.sin(e.t * 30) * 2 : Math.sin(e.t * 10);
  ctx.fillStyle = '#4a4440'; for (const lx of [-9, -4, 5, 10]) ctx.fillRect(lx - 1.4, -6, 2.8, 6 - Math.abs(run) * 0.5);
  ctx.beginPath(); ctx.ellipse(0, -10 + crouch, 13, 5.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a4440'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-12, -10 + crouch); ctx.quadraticCurveTo(-24, -12, -28, -6 + run); ctx.stroke();
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(-14, -10 + crouch); ctx.quadraticCurveTo(-24, -12, -28, -6 + run); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5a524c'; ctx.beginPath(); ctx.ellipse(13, -12 + crouch, 6, 4.6, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(17, -13 + crouch); ctx.lineTo(23, -10 + crouch); ctx.lineTo(17, -9 + crouch); ctx.fill();
  ctx.fillStyle = '#1a1414'; ctx.fillRect(9, -15 + crouch, 9, 3);
  ctx.beginPath(); ctx.moveTo(10, -16 + crouch); ctx.lineTo(11, -21 + crouch); ctx.lineTo(13, -16 + crouch); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = m === 'notice' || m === 'charge' ? 1 : 0.7; ctx.fillStyle = `rgba(255,240,120,${a})`; ctx.beginPath(); ctx.arc(14, -13.5 + crouch, 1.6, 0, TAU); ctx.arc(17, -13 + crouch, 1.4, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,240,120,${0.25 * a})`; ctx.beginPath(); ctx.arc(15.5, -13.3 + crouch, 6, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
  if (m === 'notice') { ctx.fillStyle = '#ffe08a'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!!', x, y - 26); }
};
const batArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 16 : 9));
  ctx.fillStyle = '#3a2a2a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(s * 10, -12 - f * 7, s * 22, -6 - f * 9); ctx.lineTo(s * 17, -1); ctx.lineTo(s * 20, 3 - f * 3); ctx.lineTo(s * 12, 2); ctx.lineTo(s * 13, 6); ctx.quadraticCurveTo(s * 6, 2, 0, 4); ctx.fill(); }
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#a8703a'; ctx.beginPath(); ctx.ellipse(4, -6, 4.5, 3.8, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(11, -5); ctx.lineTo(7, -4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1, -9); ctx.lineTo(2, -13); ctx.lineTo(4, -9); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(6, -7, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
};
const lionfishArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); if (m === 'ko') ctx.scale(1, -1);
  ctx.strokeStyle = '#ffe8d8'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const a = -Math.PI * 0.85 + k * 0.28; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(Math.cos(a) * 18 - 4, Math.sin(a) * 16 - 2); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? '#c8402a' : '#fff0e0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(-12 + k * 2, 12 + k * 2); ctx.stroke(); }
  ctx.fillStyle = '#e8603a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff0e0'; for (let k = -2; k <= 2; k++) ctx.fillRect(k * 4 - 1, -6, 1.6, 12);
  ctx.fillStyle = '#e8603a'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, -5); ctx.lineTo(-17, 5); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(7, -2, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
};
const enemies = {
  idFlyfish: { cls: TourLeaper.make({ w: 22, h: 12, jumpV: 14.5, drift: 2.6, every: 1.6, art: flyfishArt, splash: '#bff4ff', stompable: true }), place: 'here' },
  idUrchin: { cls: TourEnemy.make({ w: 22, h: 18, speed: 0, behavior: 'still', spiky: true, art: urchinArt, burst: '#4a2a6a' }), place: 'walk' },
  idDuck: { cls: IdDuck, place: 'walk' },
  idScarecrow: { cls: TourEnemy.make({ w: 26, h: 50, speed: 0, behavior: 'throw', every: 2.6, range: 9, hp: 2, art: scarecrowArt, burst: '#e8d08a', shoot: (e, p) => {
    tourFire(e.g, e.cx + e.dir * 10, e.y + 10, { kind: 'can', vx: e.dir * 3.6 * TS, vy: -7 * TS, grav: PHYS.gDown * 0.45, w: 12, h: 12, life: 3, stompable: true, col: '#c8c8d8', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 10); ctx.fillStyle = '#c8c8d8'; ctx.fillRect(-4, -6, 8, 12); ctx.fillStyle = '#e8402a'; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); } });
    K.say(e.g, e, 'CLANG CLANG!', '#ffffff'); TourKit.sfx('bump', null, { pitch: 1.8, vol: 0.35 });
  } }), place: 'walk' },
  idDragonfly: { cls: TourFlyer.make({ w: 30, h: 12, range: 3, speed: 1.5, swoop: true, art: dragonflyArt, burst: '#e8402a' }), place: 'fly' },
  idSate: { cls: TourEnemy.make({ w: 14, h: 44, speed: 0.9, behavior: 'walk', spiky: true, art: sateArt, burst: '#a8501a', onDefeat: e => K.say(e.g, e, 'SATAY LATER!', '#ffd23a') }), place: 'walk' },
  idCivet: { cls: TourEnemy.make({ w: 30, h: 16, speed: 0.9, behavior: 'charge', range: 7, chargeSpeed: 7.4, windup: 0.6, chargeT: 1, art: civetArt, glow: 'rgba(255,230,140,', burst: '#4a4440', onNotice: e => K.say(e.g, e, 'HISSS', '#ffe08a') }), place: 'walk' },
  idBat: { cls: TourFlyer.make({ w: 30, h: 16, range: 3, speed: 1.0, swoop: true, art: batArt, burst: '#8a5a32' }), place: 'fly' },
  idLionfish: { cls: TourSwimmer.make({ w: 30, h: 18, speed: 1.2, range: 3, art: lionfishArt }), place: 'swim' }
};

/* ---------------- the surf: swells, the water under a surfer, floats ---------------- */
// the water surface (px) right under Brady, or null (land below, or he is already under the waterline)
function surfaceUnder(g, x, feet) {
  const A = g.area, tx = Math.floor(x / TS), ty0 = Math.max(1, Math.floor((feet - 10) / TS));
  if (tx < 0 || tx >= A.W) return null;
  for (let ty = ty0; ty < Math.min(A.H, ty0 + 8); ty++) {
    const t = A.tiles[ty * A.W + tx];
    if (t === T.LAVA || t === T.WATER) {
      if (A.tiles[(ty - 1) * A.W + tx] === t) return null;
      const rig = g.idRig;
      return ty * TS + (t === T.LAVA ? 7 : 3) - (rig && rig.area === A ? rig.height(x) : 0);
    }
    if (SOLID[t] || t === T.SEMI) return null;
  }
  return null;
}
// rolling swells: they come in from behind and carry a surfer toward the beach (9-1)
class IdSurfRig extends Ent {
  constructor(g, s) {
    super(g, s, 10, 10);
    const A = g.area; this.area = A; this.x = 0; this.y = 0; this.w = A.W * TS; this.h = A.H * TS;
    this.swells = []; this.k = 0.6; this.every = s.every || 3.2; this.bigs = (s.bigs || []).map(x => ({ x: x * TS, done: false })); g.idRig = this;
    this.top = new Int16Array(A.W).fill(-1);
    for (let tx = 0; tx < A.W; tx++) for (let ty = 1; ty < A.H; ty++) { const t = A.tiles[ty * A.W + tx]; if (t === T.LAVA) { if (A.tiles[(ty - 1) * A.W + tx] !== T.LAVA) this.top[tx] = ty; break; } if (SOLID[t]) break; }
  }
  sea(x) { const tx = Math.floor(x / TS); return tx >= 0 && tx < this.top.length && this.top[tx] >= 0; }
  height(x) {
    if (!this.sea(x)) return 0;
    let h = 0;
    for (const s of this.swells) { const u = (x - s.x) / (x > s.x ? s.wf : s.wb); if (u > -1 && u < 1) h += s.a * s.k * (1 + Math.cos(Math.PI * u)) / 2; }
    return h;
  }
  // a surfer on the face of a swell gets carried forward
  push(x) { let f = 0; for (const s of this.swells) { const u = (x - s.x) / s.wf; if (u > -0.3 && u < 1) f = Math.max(f, s.k * Math.min(1, s.a / 34) * (1 - Math.abs(u - 0.35) / 1.35)); } return this.sea(x) ? clamp(f, 0, 1) * 2.6 * TS : 0; }
  wave(x, a) { this.swells.push({ x, v: 5 * TS, a, k: 0, wb: 4.6 * TS, wf: 2.6 * TS, life: 0 }); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (g.state === 'play') {
      this.k -= dt;
      if (this.k <= 0) { this.k = this.every * (0.8 + Math.random() * 0.45); this.wave(g.camX - 2 * TS, 22 + Math.random() * 16); }
      for (const b of this.bigs) if (!b.done && p && p.cx > b.x - 9 * TS) { b.done = true; this.wave(Math.max(g.camX - 2 * TS, p.cx - 10 * TS), 68); g.toast('BIG WAVE! JUMP OFF THE CREST'); TourKit.sfx('wind', 'splash', { vol: 0.5, pitch: 0.7 }); }
    }
    for (const s of this.swells) { s.x += s.v * dt; s.life += dt; s.k = Math.min(1, s.life / 1.1); }
    this.swells = this.swells.filter(s => s.x - s.wb < g.camX + Game.viewW + 6 * TS);
  }
  draw(ctx) {
    const g = this.g, x0 = Math.max(0, g.camX - 20), x1 = Math.min(this.w, g.camX + Game.viewW + 20);
    let seg = null;
    const flush = () => {
      if (!seg || seg.pts.length < 2) { seg = null; return; }
      const b = seg.base, pts = seg.pts;
      const gr = ctx.createLinearGradient(0, b - 70, 0, b + 4); gr.addColorStop(0, '#b8fff4'); gr.addColorStop(0.45, '#46d8e0'); gr.addColorStop(1, '#18b0c8');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(pts[0][0], b + 4); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(pts[pts.length - 1][0], b + 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); let on = false;
      for (const [x, y] of pts) { if (b - y > 7) { if (!on) { ctx.moveTo(x, y); on = true; } else ctx.lineTo(x, y); } else on = false; }
      ctx.stroke();
      seg = null;
    };
    for (let x = x0; x <= x1; x += 6) {
      const tx = Math.floor(x / TS), top = tx >= 0 && tx < this.top.length ? this.top[tx] : -1;
      if (top < 0) { flush(); continue; }
      const b = top * TS + 7, h = this.height(x);
      if (!seg || seg.base !== b) { flush(); seg = { base: b, pts: [] }; }
      seg.pts.push([x, b - h]);
    }
    flush();
    // foam and spray where the crests curl over
    for (const s of this.swells) {
      if (s.a * s.k < 18) continue;
      const cx = s.x + s.wf * 0.15; if (!this.sea(cx) || cx < x0 || cx > x1) continue;
      const b = this.top[Math.floor(cx / TS)] * TS + 7, h = this.height(cx);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let k = 0; k < 6; k++) { const a = this.t * 3 + k * 1.1; ctx.beginPath(); ctx.arc(cx + 6 + Math.cos(a) * 6 + k * 3, b - h + 2 + Math.sin(a) * 3, 2.4 + (k % 3), 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + 10, b - h + 10, 10, -Math.PI * 0.9, -Math.PI * 0.1); ctx.stroke();
    }
  }
}
// the patch of water under a surfer: a one-way platform that follows him along the surface
class IdDeck extends Ent {
  constructor(g) { super(g, null, 70, 12); this.isPlatform = true; this.dead = true; this.on = false; this.dx = 0; this.dy = 0; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    let y = null;
    if (p && !p.dead && p.state === 'play' && p.sig && p.sig.id === 'surf' && !p.inWater) {
      y = surfaceUnder(g, p.cx, p.y + p.h);
      if (y != null && p.y + p.h > y + 6) y = null;
      if (y != null && p.inp && p.inp.down && g.area.tiles[Math.floor((y + 4) / TS) * g.area.W + Math.floor(p.cx / TS)] === T.WATER) y = null;   // DOWN: duck-dive under
    }
    if (y == null) { this.on = false; this.dead = true; this.dx = this.dy = 0; return; }
    this.dy = this.on ? y - this.y : 0; this.dx = 0; this.on = true; this.dead = false;
    this.y = y; this.x = p.x - 24; this.w = p.w + 48;
  }
}
function deckOf(g) { const A = g.area; if (!A.idDeck) { A.idDeck = new IdDeck(g); g.spawn(A.idDeck); } return A.idDeck; }
// buoys and an anchored outrigger canoe: they ride the swells (stand on them)
class IdFloat extends Ent {
  constructor(g, s) { super(g, s, (s.pw || 1) * TS, 12); this.isPlatform = true; this.look = s.look || 'buoy'; this.x = s.x - TS / 2; this.hx = this.x; this.base = s.y + 7; this.top = s.top || 12; this.y = this.base - this.top; this.dx = 0; this.dy = 0; this.ph = (s.x % 97) / 10; }
  update(dt) { this.t += dt; const rig = this.g.idRig, ny = this.base - this.top - (rig ? rig.height(this.cx) : 0) + Math.sin(this.t * 2 + this.ph) * 1.5; this.dy = ny - this.y; this.y = ny; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, cx = this.cx;
    if (this.look === 'buoy') {
      ctx.fillStyle = '#e8402a'; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.lineTo(x + w - 6, y + 20); ctx.lineTo(x + 6, y + 20); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, y + 7, w - 8, 4);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - 1.5, y - 16, 3, 16); ctx.beginPath(); ctx.arc(cx, y - 17, 4, 0, TAU); ctx.fill();
      PlatformArt.deck(ctx, x, y - 2, w, '#c8302a');
    } else {
      // a jukung: a slim painted canoe with an outrigger and a fish-snout prow
      ctx.fillStyle = '#2a6ad8'; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x + w + 18, y - 4); ctx.lineTo(x + w + 4, y + 14); ctx.lineTo(x - 2, y + 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 6, y + 5, w + 14, 3); ctx.fillStyle = '#e8323a'; ctx.fillRect(x - 2, y + 9, w + 6, 2);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + w + 6, y + 3, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + w + 7, y + 3, 1.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; for (const ax of [x + 10, x + w - 10]) { ctx.beginPath(); ctx.moveTo(ax, y + 2); ctx.quadraticCurveTo(ax + 4, y + 14, ax + 6, y + 22); ctx.stroke(); }
      ctx.fillStyle = '#c8a070'; ctx.fillRect(x + 4, y + 20, w - 4, 4);
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + 2, y - 60); ctx.stroke();
      ctx.fillStyle = COL.a; ctx.beginPath(); ctx.moveTo(cx + 2, y - 58); ctx.quadraticCurveTo(cx + 30, y - 40, cx + 3, y - 14); ctx.closePath(); ctx.fill();
      PlatformArt.deck(ctx, x - 4, y - 2, w + 8, '#a8783a');
    }
  }
}
// THROW while holding the board: a curl of sea spray that knocks out whatever it hits
class IdSpray extends Ent {
  constructor(g, x, y, dir) { super(g, null, 26, 24); this.x = x - 13; this.y = y - 20; this.vx = dir * 7.5 * TS; this.dir = dir; this.life = 0.6; this.friendly = true; }
  update(dt) {
    this.t += dt; this.life -= dt; this.x += this.vx * dt; this.vx *= Math.pow(0.4, dt);
    if (this.life <= 0 || SOLID[tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor(this.cy / TS))]) { this.remove = true; this.g.burst(this.cx, this.cy, 8, '#bff8ff', 'spark'); return; }
    for (const e of this.g.entities) { if (!e.enemy || e.dead || e.remove || e.boss || !overlap(this, e)) continue; if (e.hit('disc', this)) { this.g.addScore(100, e.cx, e.y); this.g.burst(e.cx, e.cy, 10, '#bff8ff', 'spark'); } }
    const b = this.g.boss; if (b && !b.dead && overlap(this, b) && !this.hitBoss) { this.hitBoss = true; b.hit('disc', this); }
  }
  draw(ctx) {
    const a = Math.min(1, this.life * 3), x = this.cx, y = this.y + this.h;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(190,250,255,0.85)';
    ctx.beginPath(); ctx.moveTo(x - this.dir * 12, y); ctx.quadraticCurveTo(x - this.dir * 6, y - 26, x + this.dir * 10, y - 20); ctx.quadraticCurveTo(x + this.dir * 2, y - 14, x + this.dir * 12, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + this.dir * (6 - k * 4), y - 20 + Math.sin(this.t * 20 + k) * 3, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
let SURFING = false;
const power = {
  id: 'surf', name: 'SURFBOARD', country: 'id', hint: 'JUMP OFF A WAVE CREST FOR BIG AIR', time: 0, cooldown: 0.45,
  get speedMul() { return SURFING ? 1.2 : 1; },
  icon(ctx, x, y, t) { boardShape(ctx, x, y + 1, 30, -0.55 + Math.sin(t * 2) * 0.08); },
  onCollect(p, g) { deckOf(g); },
  update(p, dt, inp, g) {
    const deck = deckOf(g), rig = g.idRig && g.idRig.area === g.area ? g.idRig : null;
    const surfing = p.ride === deck && !deck.dead;
    SURFING = surfing;
    if (surfing) {
      if (rig) { const f = rig.push(p.cx); if (f) p.pushX = (p.pushX || 0) + f; p._crest = rig.height(p.cx); }
      if (Math.random() < 0.45 + Math.abs(p.vx) / (12 * TS)) g.burst(p.cx - p.facing * 16, p.y + p.h, 1, '#e8ffff', 'spark');
    } else if (p._wasSurf && p.vy < -8 * TS && (p._crest || 0) > 10) {
      // jumped off a crest: big air
      p.vy -= clamp(p._crest / 8, 1.5, 8.5) * TS; p.jumping = true;
      g.burst(p.cx, p.y + p.h, 16, '#ffffff', 'spark'); K.say(g, p, p._crest > 40 ? 'MEGA AIR!' : 'AIR!', '#bff8ff'); Sound.play('splash', { vol: 0.5, pitch: 1.3 });
      p._crest = 0;
    }
    if (!surfing && p.onGround) p._crest = 0;
    p._wasSurf = surfing;
  },
  action(p, g) {
    if (g.entities.some(e => e instanceof IdSpray && !e.remove)) return false;
    g.spawn(new IdSpray(g, p.cx + p.facing * 18, p.y + p.h - 2, p.facing));
    Sound.play('splash', { vol: 0.5, pitch: 1.4 }); return true;
  },
  drawOn(p, ctx, t) {
    if (p._wasSurf && p.ride) {
      const rig = p.g.idRig && p.g.idRig.area === p.g.area ? p.g.idRig : null, h1 = rig ? rig.height(p.cx - 14) : 0, h2 = rig ? rig.height(p.cx + 14) : 0;
      boardShape(ctx, p.cx + p.facing * 2, p.y + p.h + 1, p.small ? 44 : 58, Math.atan2(h1 - h2, 28) * 0.9 * (p.facing > 0 ? 1 : 1));
      if (Math.random() < 0.3) p.g.burst(p.cx - p.facing * 26, p.y + p.h, 1, '#ffffff', 'dust');
    } else if (!p._wasSurf && !p.inWater) {
      ctx.save(); ctx.translate(p.cx - p.facing * (p.small ? 8 : 10), p.y + p.h * 0.55); ctx.rotate(p.facing * 0.25);
      boardShape(ctx, 0, 0, p.small ? 30 : 44, Math.PI / 2); ctx.restore();
    }
  }
};
// a cheeky tokay gecko (and, at checkpoints, a surf-shack rack): hands Brady a board whenever he has none
class IdGiver extends Ent {
  constructor(g, s) { const rack = s.look === 'rack'; super(g, s, rack ? 40 : 34, rack ? 60 : 30); this.look = s.look || 'gecko'; this.cool = 0; this.wave = 0; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; if (this.wave > 0) this.wave -= dt; }
  touchPlayer(p) {
    if (this.cool > 0 || p.dead || (p.sig && p.sig.id === 'surf')) return;
    this.cool = 1.2; this.wave = 1.6;
    K.say(this.g, this, this.look === 'rack' ? 'GRAB A BOARD!' : 'TO-KAY! SURF\'S UP!', '#7affd8');
    TourKit.sfx('gift', 'appear'); p.collect('sig:surf');
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, has = this.g.player && this.g.player.sig && this.g.player.sig.id === 'surf';
    if (this.look === 'rack') {
      ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 20, y - 50, 4, 50); ctx.fillRect(x + 16, y - 50, 4, 50); ctx.fillRect(x - 20, y - 26, 40, 3);
      ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(x - 26, y - 48); ctx.lineTo(x, y - 62); ctx.lineTo(x + 26, y - 48); ctx.fill();
      const cols = [COL.a, COL.b, COL.c];
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x - 10 + k * 10, y - 26); boardShape(ctx, 0, 0, 44, Math.PI / 2 + (k - 1) * 0.06, cols[k]); ctx.restore(); }
      if (!has) { ctx.fillStyle = '#ffd84a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BOARDS', x, y - 66 + Math.sin(t * 4) * 1.5); }
      return;
    }
    // the gecko, sitting up, holding a board taller than itself
    K.shadow(ctx, x, y, 16);
    if (!has) { ctx.save(); ctx.translate(x + 12, y - 22); boardShape(ctx, 0, 0, 44, Math.PI / 2 - 0.1); ctx.restore(); }
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#6a8ab8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-20, -2, -22, -12 + Math.sin(t * 3) * 3); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#7a9ac8'; ctx.beginPath(); ctx.ellipse(0, -10, 9, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a3a'; for (const [dx, dy] of [[-4, -14], [3, -8], [-2, -4], [4, -16]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.8, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7a9ac8'; ctx.beginPath(); ctx.ellipse(2, -25, 9, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(2 + s * 5, -28, 3.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) ctx.fillRect(2 + s * 5 - 0.7, -30.5, 1.4, 5);
    ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(2, -23, 4, 0.3, Math.PI - 0.3); ctx.stroke();
    // one hand waves when Brady already has a board
    ctx.fillStyle = '#7a9ac8'; const wv = has ? Math.sin(t * 10) * 0.6 : 0; ctx.save(); ctx.translate(-7, -14); ctx.rotate(-0.8 + wv); ctx.fillRect(-2, -10, 4, 10); ctx.restore();
    ctx.restore();
    if (!has) { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 44 + Math.sin(t * 5) * 2); }
  }
}

/* ---------------- the kite festival ---------------- */
// a giant fish kite (bebean) or a bird kite (janggan) swooping back and forth across a ravine on the wind:
// at each end of its swing it dips level with the ledge (hop on, hop off); in between it soars up. Its back is a platform.
class IdKite extends Ent {
  constructor(g, s) {
    super(g, s, (s.pw || 3) * TS, 14);
    this.isPlatform = true; this.x = s.x - TS / 2; this.y = s.y; this.hx = this.x + (s.ox || 0) * TS; this.hy = this.y;
    this.ax = (s.ax || 2) * TS; this.ay = (s.ay || 1) * TS; this.sp = s.speed || 0.6; this.ph = s.phase || 0; this.look = s.look || 0; this.tilt = 0; this.dx = 0; this.dy = 0;
    this.t = 0;   // every kite keeps the same clock, so neighbours meet at the ends of their swings
    this.place(); this.dx = this.dy = 0;
  }
  // it lingers at each end of the swing (level with the ledge), then swoops up and across
  static path(a, ax, ay) { const u = clamp(1.3 * Math.sin(a), -1, 1); return [u * ax, -(1 - u * u) * ay]; }
  place() { const [ox, oy] = IdKite.path(this.t * this.sp + this.ph, this.ax, this.ay), nx = this.hx + ox, ny = this.hy + oy; this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny; }
  update(dt) {
    this.t += dt; this.place(); this.tilt = approach(this.tilt, (this.g.windForce || 0) / (3 * TS) * 0.18 + Math.sin(this.t * 0.9 + this.ph) * 0.06 - this.dx * 0.02, dt * 0.8);
    // a rider holds on to the kite's frame: gusts don't blow him off its back
    const p = this.g.player; if (p && p.ride === this) p.pushX = (p.pushX || 0) - (this.g.windForce || 0);
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, cx = this.cx, c = KITE[this.look % KITE.length], c2 = KITE[(this.look + 2) % KITE.length];
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, y + 10); ctx.quadraticCurveTo(cx - 60, y + 120, cx - 140, y + 360); ctx.stroke();
    ctx.save(); ctx.translate(cx, y + 6); ctx.rotate(this.tilt + Math.sin(this.t * 1.7) * 0.03);
    if (this.look % 2 === 0) {
      // bebean: a fat fish with fins and a forked tail
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-w / 2 + 4, 0); ctx.lineTo(-w / 2 - 22, -16); ctx.lineTo(-w / 2 - 14, 0); ctx.lineTo(-w / 2 - 22, 16); ctx.closePath(); ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6, s * 6); ctx.lineTo(4, s * 22); ctx.lineTo(12, s * 6); ctx.fill(); }
      const g = ctx.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, shade(c, 0.25)); g.addColorStop(1, shade(c, -0.2));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 2, w / 2 + 4, 13, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 10, 2, 7, -1, 1); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(w / 2 - 8, -1, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(w / 2 - 7, -1, 2.4, 0, TAU); ctx.fill();
    } else {
      // janggan: a bird kite with spread wings and a very long ribbon tail
      ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, 6); for (let k = 1; k < 14; k++) ctx.lineTo(-6 - k * 10, 6 + k * 7 + Math.sin(this.t * 4 + k * 0.6) * 6); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w / 2 - 10, 6); ctx.quadraticCurveTo(0, -24, w / 2 + 10, 6); ctx.quadraticCurveTo(0, -6, -w / 2 - 10, 6); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 2, 8, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(14, 1); ctx.lineTo(6, 4); ctx.fill();
    }
    ctx.restore();
    PlatformArt.deck(ctx, x, y - 2, w, 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.45)');
  }
}

/* ---------------- Batur: the sunrise, lava bombs, hot rocks ---------------- */
const IdSky = { k: 0 };
const NIGHT = { sky: ['#05061a', '#16123a', '#2a2050'], glow: '#4a2a6a', fog: '#3a2a50' }, DAWN = { sky: ['#2a6ad0', '#ff9a6a', '#ffe0a0'], glow: '#ffb070', fog: '#ffc8a0' };
// the sky over the volcano brightens from night to sunrise as Brady climbs
class IdSunrise extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; g.area.sunrise = true; this.apply(0); }
  apply(k) {
    IdSky.k = k; const th = THEMES.id_batur;
    th.sky = NIGHT.sky.map((c, i) => mix(c, DAWN.sky[i], clamp(k * 1.15 - 0.1, 0, 1)));
    th.horizonGlow = mix(NIGHT.glow, DAWN.glow, k); th.fog = mix(NIGHT.fog, DAWN.fog, k);
    th.celestial.y = 1.15 - 0.8 * clamp((k - 0.3) / 0.7, 0, 1);
  }
  update(dt) { this.t += dt; const p = this.g.player, A = this.g.area; if (p) this.apply(clamp(p.cx / (A.W * TS - 14 * TS), 0, 1)); }
}
function groundRow(A, x, y) { const tx = Math.floor(x / TS); for (let ty = Math.max(0, Math.floor(y / TS)); ty < A.H; ty++) { const t = tileAt(A, tx, ty); if ((SOLID[t] || t === T.SEMI) && !SOLID[tileAt(A, tx, ty - 1)]) return ty; } return null; }
// lava bombs lobbed from the crater: a glowing ring marks where each one lands
class IdBombs extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.x0 = s.x0 * TS; this.x1 = s.x1 * TS; this.every = s.every || 2; this.k = 1.2; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (!p || p.dead || g.state !== 'play' || p.cx < this.x0 - 5 * TS || p.cx > this.x1 + 3 * TS) return;
    this.k -= dt;
    if (this.k > 0) return;
    this.k = this.every * (0.8 + Math.random() * 0.5);
    const tx = clamp(p.cx + p.vx * 0.8 + (Math.random() - 0.5) * 3 * TS, this.x0, this.x1), ty = groundRow(g.area, tx, p.y);
    if (ty != null) g.spawn(new IdBomb(g, tx, ty * TS));
  }
}
class IdBomb extends Ent {
  constructor(g, tx, ty) { super(g, null, 18, 18); this.tx = tx; this.ty = ty; this.T = 1.3; this.k = 0; this.sx = tx + (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) * TS; this.sy = ty - 9 * TS; this.x = this.sx - 9; this.y = this.sy - 9; this.enemy = false; this.trail = []; }
  update(dt) {
    this.t += dt; this.k += dt; const u = Math.min(1, this.k / this.T);
    const bx = lerp(this.sx, this.tx, u), by = lerp(this.sy, this.ty - 8, u * u) - Math.sin(u * Math.PI) * 50;
    this.trail.unshift([bx, by]); if (this.trail.length > 8) this.trail.pop();
    this.x = bx - 9; this.y = by - 9;
    if (u >= 1) {
      this.remove = true; const g = this.g, p = g.player;
      g.shake(5); Sound.play('stomp', { pitch: 0.5, vol: 0.6 }); g.burst(this.tx, this.ty - 6, 18, '#ff8a2a', 'spark'); g.burst(this.tx, this.ty - 4, 8, '#3a2a2a', 'debris');
      if (p && !p.dead && Math.abs(p.cx - this.tx) < 34 && p.y + p.h > this.ty - 50 && p.y < this.ty) p.hurt({ x: this.tx - 10, w: 20, enemy: false });
    }
  }
  touchPlayer(p) { if (this.k < this.T - 0.05 && this.k > 0.3) p.hurt(this); }
  draw(ctx) {
    const u = Math.min(1, this.k / this.T), r = 8 + 10 * u, a = 0.35 + 0.5 * u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,${90 + 100 * Math.sin(this.t * 20) ** 2},40,${a})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(this.tx, this.ty - 2, 30 - 10 * u, 7 - 2 * u, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(255,120,40,${0.15 * u})`; ctx.beginPath(); ctx.ellipse(this.tx, this.ty - 2, 30, 7, 0, 0, TAU); ctx.fill();
    this.trail.forEach(([x, y], i) => { ctx.fillStyle = `rgba(255,${140 - i * 10},40,${0.5 - i * 0.05})`; ctx.beginPath(); ctx.arc(x, y, r * 0.6 * (1 - i / 10), 0, TAU); ctx.fill(); });
    ctx.restore();
    ctx.fillStyle = '#3a2420'; ctx.beginPath(); ctx.arc(this.cx, this.cy, 8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(this.cx - 5, this.cy - 2); ctx.lineTo(this.cx, this.cy + 2); ctx.lineTo(this.cx + 4, this.cy - 4); ctx.stroke();
  }
  get light() { return { r: 90, c: 'rgba(255,140,50,', x: this.cx, y: this.cy }; }
}
// a patch of volcanic rock that heats up red-hot and cools again: don't stand on it while it glows
class IdHotRocks extends Ent {
  constructor(g, s) { super(g, s, (s.n || 4) * TS, 8); this.x = s.x - TS / 2; this.y = s.y; this.ty = Math.round(s.y / TS); this.period = s.period || 4.6; this.ph = s.phase || 0; this.burnK = 0; }
  get heat() { const k = ((this.t + this.ph) % this.period) / this.period; return k < 0.5 ? 0 : k < 0.72 ? (k - 0.5) / 0.22 : 1; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.heat >= 1 && p && !p.dead && p.onGround && p.groundTy === this.ty && p.cx > this.x && p.cx < this.x + this.w) { p.hurt(this); if (this.burnK <= 0) { K.say(this.g, p, 'HOT HOT HOT!', '#ffb03a'); this.burnK = 1; } }
    if (this.burnK > 0) this.burnK -= dt;
    if (this.heat >= 1 && Math.random() < 0.2) this.g.burst(this.x + Math.random() * this.w, this.y, 1, '#ffd0a0', 'dust');
  }
  draw(ctx) {
    const h = this.heat;
    for (let k = 0; k < this.w / TS; k++) {
      const x = this.x + k * TS;
      ctx.fillStyle = h > 0 ? `rgba(255,${80 + 80 * (1 - h)},30,${0.25 + 0.55 * h})` : 'rgba(255,90,30,0.12)'; ctx.fillRect(x + 1, this.y, TS - 2, 6);
      ctx.strokeStyle = h > 0 ? `rgba(255,${200 - 60 * h},80,${0.5 + 0.5 * h})` : 'rgba(255,110,40,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 4, this.y + 2); ctx.lineTo(x + 12, this.y + 5); ctx.lineTo(x + 18, this.y + 1); ctx.lineTo(x + 27, this.y + 4); ctx.stroke();
    }
    if (h >= 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,90,30,0.25)'; ctx.fillRect(this.x, this.y - 10, this.w, 10); ctx.restore(); }
  }
  get light() { const h = this.heat; return h > 0.15 ? { r: 60 + 60 * h, c: 'rgba(255,110,40,', x: this.cx, y: this.y } : null; }
}

/* ---------------- the night dive ---------------- */
// an anglerfish dangling a fake coin in the dark: reach for it and it lunges
class IdAngler extends Ent {
  constructor(g, s) { super(g, s, 32, 26); this.enemy = true; this.hx = this.x; this.hy = this.y; this.dir = s.dir || -1; this.state = 'lurk'; this.k = 0; this.cool = 0; }
  get lure() { return { x: this.cx + this.dir * 34, y: this.y - 16 + Math.sin(this.t * 2) * 3 }; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player, L = this.lure; if (this.cool > 0) this.cool -= dt;
    if (this.state === 'lurk') {
      this.x = approach(this.x, this.hx, 40 * dt); this.y = this.hy + Math.sin(this.t * 1.2) * 4;
      if (this.cool <= 0 && p && !p.dead && Math.abs(p.cx - L.x) < 2.6 * TS && Math.abs(p.cy - L.y) < 2.4 * TS) { this.state = 'lunge'; this.k = 0.5; this.dir = sign(p.cx - this.cx) || this.dir; this.vx = clamp((p.cx - this.cx) / 0.45, -9 * TS, 9 * TS); this.vy = clamp((p.cy - this.cy) / 0.45, -6 * TS, 6 * TS); K.say(this.g, this, 'GOTCHA!', '#9affe0'); TourKit.sfx('bump', null, { pitch: 0.6, vol: 0.5 }); }
    } else if (this.state === 'lunge') { this.k -= dt; moveBody(this, this.g.area, dt, { semis: false }); if (this.k <= 0 || this.hitWall) this.state = 'back'; }
    else { this.x += (this.hx - this.x) * Math.min(1, dt * 2.5); this.y += (this.hy - this.y) * Math.min(1, dt * 2.5); if (Math.abs(this.hx - this.x) + Math.abs(this.hy - this.y) < 4) { this.state = 'lurk'; this.cool = 1.6; this.dir = this.s.dir || -1; } }
  }
  hit(kind) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.cy, d = this.dir, L = this.lure, open = this.state === 'lunge' ? 1 : 0.25 + 0.1 * Math.sin(this.t * 3);
    ctx.save(); if (this.knocked) { ctx.translate(x, y); ctx.rotate(Math.PI); ctx.translate(-x, -y); }
    ctx.strokeStyle = 'rgba(200,220,180,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + d * 4, y - 12); ctx.quadraticCurveTo(x + d * 20, y - 30, L.x, L.y); ctx.stroke();
    ctx.save(); ctx.translate(L.x, L.y); ctx.scale(0.8, 0.8); COIN.draw(ctx, 0, 0, this.t); ctx.restore();
    ctx.fillStyle = '#2a2a3a'; ctx.beginPath(); ctx.ellipse(x, y, 16, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a4e'; ctx.beginPath(); ctx.ellipse(x - d * 4, y - 4, 10, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(x - d * 14, y); ctx.lineTo(x - d * 24, y - 8); ctx.lineTo(x - d * 24, y + 8); ctx.fill();
    ctx.fillStyle = '#0a0610'; ctx.beginPath(); ctx.moveTo(x + d * 4, y); ctx.lineTo(x + d * 17, y - 6 * open - 2); ctx.lineTo(x + d * 17, y + 6 * open + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4f0e0'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + d * (7 + k * 3), y - 4 * open - 1); ctx.lineTo(x + d * (8 + k * 3), y + 1); ctx.lineTo(x + d * (9 + k * 3), y - 4 * open - 1); ctx.fill(); }
    ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.arc(x + d * 6, y - 7, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + d * 7, y - 7, 1.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  get light() { const L = this.lure; return this.dead ? null : { r: 80, c: 'rgba(255,230,140,', x: L.x, y: L.y }; }
}
// a moray eel in a hole in the reef: glowing eyes, then a lunge when Brady swims past
class IdMoray extends Ent {
  constructor(g, s) { super(g, s, 22, 16); this.enemy = true; this.dir = s.dir || 1; this.hx = this.x; this.out = 0; this.state = 'hide'; this.k = 0; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player; this.k -= dt;
    if (this.state === 'hide') { this.out = approach(this.out, 0, dt * 2.5); if (this.k <= 0 && p && !p.dead && Math.abs(p.cy - this.cy) < 1.5 * TS && (p.cx - this.hx) * this.dir > -TS && Math.abs(p.cx - this.hx) < 3.4 * TS) { this.state = 'lunge'; this.k = 0.8; TourKit.sfx('bump', null, { pitch: 0.5, vol: 0.4 }); } }
    else { this.out = approach(this.out, 1, dt * 7); if (this.k <= 0) { this.state = 'hide'; this.k = 1.3; } }
    const reach = this.out * 2.6 * TS; this.w = 22 + reach; this.x = this.dir > 0 ? this.hx : this.hx - reach;
  }
  hit(kind) { if (this.dead || kind === 'stomp' || this.out < 0.3) return false; this.knockOff(this.dir); return true; }
  touchPlayer(p) { if (!this.dead && this.out > 0.15) p.hurt(this); }
  draw(ctx) {
    const d = this.dir, bx = this.dir > 0 ? this.hx : this.hx + 22, y = this.cy, len = 8 + this.out * 2.6 * TS;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,255,120,0.9)'; ctx.beginPath(); ctx.arc(bx + d * (len - 2), y - 3, 1.8, 0, TAU); ctx.fill(); ctx.restore();
    if (this.out < 0.05) return;
    ctx.strokeStyle = '#5a7a2a'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - d * 6, y + 2); ctx.quadraticCurveTo(bx + d * len * 0.5, y + Math.sin(this.t * 8) * 4, bx + d * (len - 6), y); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(30,50,10,0.5)'; for (let k = 0; k < len - 10; k += 6) { ctx.beginPath(); ctx.arc(bx + d * k, y + (k % 12 ? -2 : 2), 1.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a8a32'; ctx.beginPath(); ctx.ellipse(bx + d * len, y, 9, 6.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.moveTo(bx + d * (len + 1), y + 1); ctx.lineTo(bx + d * (len + 9), y - 2 * this.out); ctx.lineTo(bx + d * (len + 9), y + 5 * this.out); ctx.fill();
    ctx.fillStyle = '#e8ff9a'; ctx.beginPath(); ctx.arc(bx + d * (len + 2), y - 3, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(bx + d * (len + 2.5), y - 3, 1, 0, TAU); ctx.fill();
  }
  get light() { return { r: 34, c: 'rgba(200,255,120,', x: (this.dir > 0 ? this.hx : this.hx + 22) + this.dir * (8 + this.out * 2.6 * TS), y: this.cy }; }
}
// a manta ray gliding back and forth; behind it trails a slipstream that sweeps Brady along
class IdManta extends Ent {
  constructor(g, s) { super(g, s, 96, 26); this.x0 = s.x0 * TS; this.x1 = s.x1 * TS; this.y = s.y - 13; this.x = this.x0; this.dir = 1; this.zid = s.zid; this.zone = null; this.sp = (s.speed || 2.4) * TS; }
  update(dt) {
    this.t += dt; this.x += this.dir * this.sp * dt;
    if (this.x > this.x1 - this.w) { this.x = this.x1 - this.w; this.dir = -1; } else if (this.x < this.x0) { this.x = this.x0; this.dir = 1; }
    if (!this.zone) this.zone = (this.g.area.zones || []).find(z => z.kind === 'manta' && z.mid === this.zid) || null;
    if (this.zone) { const z = this.zone; z.w = 6 * TS; z.x = this.dir > 0 ? this.x - z.w + 20 : this.x + this.w - 20; z.y = this.y - 28; z.h = this.h + 56; z.fx = this.dir * 3.6 * TS; }
    if (Math.random() < 0.3) this.g.burst(this.dir > 0 ? this.x : this.x + this.w, this.cy, 1, '#7af0ff', 'spark');
  }
  draw(ctx) {
    const x = this.cx, y = this.cy, d = this.dir, f = Math.sin(this.t * 2.4);
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    ctx.strokeStyle = 'rgba(120,230,255,0.25)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-50 - k * 26, -6 + k * 4); ctx.lineTo(-70 - k * 26, -6 + k * 4); ctx.stroke(); }
    ctx.fillStyle = '#16304a'; ctx.beginPath(); ctx.moveTo(34, 0); ctx.quadraticCurveTo(10, -14, -18, -30 - f * 18); ctx.quadraticCurveTo(-14, -8, -30, 0); ctx.quadraticCurveTo(-14, 8, -18, 30 + f * 18); ctx.quadraticCurveTo(10, 14, 34, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(140,240,255,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(6, 0, 12, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#16304a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-58, 2); ctx.stroke();
    ctx.fillStyle = '#16304a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(32, s * 5, 6, 2.4, s * 0.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  get light() { return { r: 110, c: 'rgba(120,230,255,' }; }
}
// a cloud of bioluminescent plankton: it blooms bright when Brady swims through it
class IdPlankton extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 3 * TS); this.y = s.y - 2 * TS; this.glow = 0; }
  update(dt) { this.t += dt; const p = this.g.player; const near = p && Math.hypot(p.cx - this.cx, p.cy - this.cy) < 2.4 * TS; this.glow = approach(this.glow, near ? 1 : 0, dt * (near ? 3 : 0.6)); if (near && Math.random() < 0.4) this.g.burst(p.cx, p.cy, 1, '#7af0ff', 'spark'); }
  draw(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) { const a = k * 2.4 + this.t * 0.3, r = 10 + (k * 13) % 38, x = this.cx + Math.cos(a) * r, y = this.cy + Math.sin(a * 1.3) * r * 0.7, b = 0.25 + 0.75 * this.glow; ctx.fillStyle = `rgba(${k % 3 ? '90,240,255' : '160,255,170'},${b * (0.4 + 0.4 * Math.sin(this.t * 3 + k))})`; ctx.beginPath(); ctx.arc(x, y, 1.2 + this.glow * 1.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  get light() { return { r: 50 + this.glow * 110, c: 'rgba(110,240,255,' }; }
}
// the dive's glow: Brady's strokes stir up a trail of light
class IdBiolum extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.lx = 0; this.ly = 0; this.lit = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p) return;
    const sp = Math.hypot(p.vx, p.vy); this.lit = approach(this.lit, clamp(sp / (5 * TS), 0, 1), dt * 2);
    this.lx += (p.cx - p.facing * 20 - this.lx) * Math.min(1, dt * 4); this.ly += (p.cy - this.ly) * Math.min(1, dt * 4);
    if (sp > 2 * TS && Math.random() < 0.6) this.g.burst(p.cx - p.facing * 10, p.cy + 6, 1, Math.random() < 0.7 ? '#7af0ff' : '#b0ffb0', 'spark');
  }
  get light() { return this.lit > 0.05 ? { r: 70 + 90 * this.lit, c: 'rgba(110,240,255,', x: this.lx, y: this.ly } : null; }
}

/* ---------------- the monkey forest ---------------- */
// a long-tailed macaque on a branch: it drops down, snatches coins and scampers back up (stomp it to get them back)
class IdMonkey extends Ent {
  constructor(g, s) { super(g, s, 24, 26); this.enemy = true; this.hy = this.y; this.state = 'perch'; this.loot = 0; this.k = 0; this.dir = -1; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.k -= dt; if (this.k <= 0) this.remove = true; return; }
    const p = this.g.player; this.k -= dt;
    if (this.state === 'perch') { this.y = this.hy; if (p) this.dir = sign(p.cx - this.cx) || this.dir; if (this.k <= 0 && p && !p.dead && p.y > this.y && Math.abs(p.cx - this.cx) < 2.2 * TS) { this.state = 'drop'; this.vy = 0; K.say(this.g, this, 'OOK!', '#ffd84a'); } }
    else if (this.state === 'drop') { this.vy += PHYS.gDown * 0.7 * dt; moveBody(this, this.g.area, dt, { semis: false }); if (this.onGround) { this.state = 'grab'; this.k = 0.7; } }
    else if (this.state === 'grab') { this.vx = p ? sign(p.cx - this.cx) * 3 * TS : 0; this.vy += PHYS.gDown * dt; moveBody(this, this.g.area, dt, { semis: true }); if (this.k <= 0) { this.state = 'climb'; } }
    else if (this.state === 'climb') { this.y = approach(this.y, this.hy, 4.5 * TS * dt); this.x = approach(this.x, this.s.x - this.w / 2, 3 * TS * dt); if (this.y <= this.hy) { this.state = 'perch'; this.k = 1.5; if (this.loot) K.say(this.g, this, 'OOK OOK! ★' + this.loot, '#ffd84a'); } }
  }
  steal(p) {
    const g = this.g, n = Math.min(6, g.picks);
    if (n <= 0) return false;
    g.picks -= n; Save.data.picks = g.picks; this.loot += n; this.state = 'climb';
    K.say(g, this, 'SNATCH! −' + n, '#ffd84a'); Sound.play('pick', { pitch: 0.6 }); return true;
  }
  giveBack() { const g = this.g; for (let k = 0; k < this.loot; k++) { g.spawn(new PickPop(g, this.cx + (k - this.loot / 2) * 6, this.y)); g.addPick(); } if (this.loot) K.say(g, this, 'OKAY OKAY!', '#ffd84a'); this.loot = 0; }
  hit(kind) {
    if (this.dead) return false;
    if (kind === 'stomp' || kind === 'spin') { this.dead = true; this.k = 0.5; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 10, '#a8988a', 'dust'); this.giveBack(); return true; }
    this.giveBack(); this.knockOff(1); return true;
  }
  // up in the tree (or scampering off with the loot) it is out of reach; down on the ground it snatches coins, or bites
  touchPlayer(p) { if (this.dead || this.state === 'perch' || this.state === 'climb') return; if (this.steal(p)) return; p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    if (this.state === 'perch' || this.state === 'climb') { ctx.strokeStyle = '#5a7a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.s.x, this.hy - 200); ctx.lineTo(this.s.x, this.hy + 4); ctx.stroke(); }
    ctx.save(); ctx.translate(x, y); if (this.dead) ctx.scale(1.3, 0.4); if (this.knocked) { ctx.translate(0, -this.h / 2); ctx.rotate(Math.PI + (this.spin || 0)); ctx.translate(0, this.h / 2); }
    ctx.scale(this.dir, 1);
    ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-22, -6, -20 + Math.sin(t * 3) * 3, -24); ctx.stroke();
    ctx.fillStyle = '#a8988a'; ctx.beginPath(); ctx.ellipse(0, -10, 10, 9, 0, 0, TAU); ctx.fill();
    for (const lx of [-6, 5]) { ctx.fillRect(lx - 2, -4, 4, 4); }
    ctx.beginPath(); ctx.arc(6, -21, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0b8a8'; ctx.beginPath(); ctx.ellipse(8, -20, 5, 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(7, -22, 1.2, 0, TAU); ctx.arc(10.5, -22, 1.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(9, -18, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    if (this.loot) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-4, -12, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.fillRect(-5, -13, 2, 2); }
    ctx.restore();
  }
}
// a durian tree: now and then it lets a ripe durian fall; the spiky fruit rolls, then bursts into a stink cloud
class IdDurianTree extends Ent {
  constructor(g, s) { super(g, s, 50, 110); this.every = s.every || 3.4; this.k = 1 + (s.phase || 0); this.shake = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (this.shake > 0) this.shake -= dt;
    if (!p || p.dead || Math.abs(p.cx - this.cx) > 9 * TS) return;
    this.k -= dt;
    if (this.k <= 0.5 && this.shake <= 0 && this.k > 0) this.shake = 0.5;
    if (this.k <= 0) { this.k = this.every; const d = new IdDurian(this.g, this.cx + (Math.random() - 0.5) * 30, this.y + 22, sign(p.cx - this.cx) || -1); this.g.spawn(d); }
  }
  draw(ctx) { Decor.idDurianTreeArt(ctx, this.cx, this.y + this.h, this.t, this.shake > 0 ? Math.sin(this.t * 50) * 2 : 0); for (const [dx, dy] of [[-12, -64], [14, -70]]) durianShape(ctx, this.cx + dx, this.y + this.h + dy, 0, 0.7); }
}
function durianShape(ctx, x, y, rot, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s || 1, s || 1);
  ctx.fillStyle = '#9aa83a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a7a1a'; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.15) * 9, Math.sin(a - 0.15) * 7.5); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 12.5); ctx.lineTo(Math.cos(a + 0.15) * 9, Math.sin(a + 0.15) * 7.5); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,200,0.3)'; ctx.beginPath(); ctx.ellipse(-3, -3, 4, 2.4, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}
class IdDurian extends Ent {
  constructor(g, x, y, dir) { super(g, null, 22, 20); this.x = x - 11; this.y = y; this.dir = dir; this.enemy = true; this.life = 4.5; this.rot = 0; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    this.life -= dt; this.vy += PHYS.gDown * 0.8 * dt; if (this.onGround) this.vx = this.dir * 3.4 * TS;
    moveBody(this, this.g.area, dt, { semis: true }); this.rot += this.vx * dt / 10;
    if (this.hitWall || this.life <= 0) this.burst();
    if (this.y > this.g.area.H * TS + 40) this.remove = true;
  }
  burst() { if (this.remove) return; this.remove = true; this.dead = true; Sound.play('splat', { pitch: 0.7, vol: 0.5 }); this.g.burst(this.cx, this.cy, 12, '#c8c84a', 'debris'); this.g.spawn(new IdStink(this.g, this.cx, this.y + this.h)); }
  hit(kind) { if (this.dead) return false; if (kind === 'stomp' || kind === 'spin') return kind === 'spin' ? 'bounce' : false; this.burst(); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { durianShape(ctx, this.cx, this.cy, this.rot, 1); }
}
// a cloud of durian stink: walking through it leaves Brady dizzy for a moment
class IdStink extends Ent {
  constructor(g, x, y) { super(g, null, 60, 50); this.x = x - 30; this.y = y - 50; this.life = 2.6; this.zapped = false; this.friendly = false; }
  update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) this.remove = true; }
  touchPlayer(p) { if (this.zapped || this.life < 0.4 || p.star) return; this.zapped = true; p.stun(0.7); K.say(this.g, p, 'PEE-YEW!', '#d8e86a'); }
  draw(ctx) {
    const a = Math.min(1, this.life / 0.8);
    for (let k = 0; k < 7; k++) { const ph = this.t * 0.8 + k * 0.9; ctx.fillStyle = `rgba(${190 + k * 6},${210 + k * 4},90,${0.28 * a})`; ctx.beginPath(); ctx.arc(this.cx + Math.cos(ph) * 16, this.cy + Math.sin(ph * 1.3) * 10 - this.t * 4, 12 + (k % 3) * 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = `rgba(150,170,40,${0.7 * a})`; ctx.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const sx = this.cx - 14 + k * 14; ctx.beginPath(); ctx.moveTo(sx, this.cy + 6); for (let j = 1; j < 5; j++) ctx.lineTo(sx + Math.sin(this.t * 6 + j + k) * 3, this.cy + 6 - j * 6); ctx.stroke(); }
  }
}
// gamelan gongs hung on a carved frame: strike them (jump into them) from the smallest to the biggest to open the stone door
class IdGong extends Ent {
  constructor(g, s) { const r = 13 + s.size * 5; super(g, s, r * 2, r * 2); this.r = r; this.size = s.size; this.order = s.order; this.door = s.door; this.ring = 0; this.cool = 0; this.lit = false; this.y = s.y - r * 2; }
  update(dt) { this.t += dt; if (this.ring > 0) this.ring -= dt; if (this.cool > 0) this.cool -= dt; }
  touchPlayer(p) {
    if (this.cool > 0) return; this.cool = 0.7; this.ring = 1.2;
    Sound.play('pick', { pitch: [1.0, 0.75, 0.56, 0.45][this.size] || 0.5, vol: 0.7 }); TourKit.sfx('gold', null, { pitch: [1.2, 0.9, 0.7, 0.55][this.size] || 0.6, vol: 0.4 });
    this.g.burst(this.cx, this.cy, 10, '#ffd84a', 'spark');
    const D = this.g.entities.find(e => e instanceof IdGongDoor && e.id === this.door); if (D) D.strike(this);
  }
  draw(ctx) {
    const x = this.cx, y = this.cy, r = this.r, sw = this.ring > 0 ? Math.sin(this.t * 30) * this.ring * 2 : 0;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r - 8); ctx.lineTo(x + sw, y - r); ctx.lineTo(x + r * 0.5, y - r - 8); ctx.stroke();
    ctx.fillStyle = '#7a3a1a'; ctx.fillRect(x - r - 6, y - r - 10, r * 2 + 12, 4);
    ctx.save(); ctx.translate(x + sw, y);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.6, this.lit ? '#ffc23a' : '#c8902a'); g.addColorStop(1, '#7a5212');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6a4210'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, TAU); ctx.stroke();
    ctx.fillStyle = this.lit ? '#fff6c0' : '#e8b84a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a2a0a'; for (let k = 0; k <= this.size; k++) { ctx.beginPath(); ctx.arc((k - this.size / 2) * 5, r * 0.55, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (this.ring > 0) { ctx.strokeStyle = `rgba(255,230,140,${this.ring * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + (1.2 - this.ring) * 30, 0, TAU); ctx.stroke(); }
  }
  get light() { return this.ring > 0 || this.lit ? { r: 70, c: 'rgba(255,220,120,' } : null; }
}
// the carved stone door the gongs open (its solid tiles are put in place when the level starts)
class IdGongDoor extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, (s.h || 6) * TS); this.id = s.id; this.n = s.n || 3; this.next = 1; this.open = 0; this.opening = false; this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor((s.y - 1) / TS); this.ty0 = this.ty1 - (s.h || 6) + 1;
    this.x = this.tx * TS; this.y = this.ty0 * TS;
    const A = g.area; for (let y = this.ty0; y <= this.ty1; y++) for (let x = this.tx; x < this.tx + 2; x++) { A.tiles[y * A.W + x] = T.HARD; A.hide[y * A.W + x] = 1; }
  }
  strike(gong) {
    if (this.opening) return;
    if (gong.order === this.next) { gong.lit = true; this.next++; if (this.next > this.n) { this.opening = true; const g = this.g; g.toast('THE STONE DOOR OPENS!'); Sound.play('secret'); g.shake(6); const A = g.area; for (let y = this.ty0; y <= this.ty1; y++) for (let x = this.tx; x < this.tx + 2; x++) { A.tiles[y * A.W + x] = T.EMPTY; A.hide[y * A.W + x] = 0; } } }
    else { this.next = 1; for (const e of this.g.entities) if (e instanceof IdGong && e.door === this.id) e.lit = false; Sound.play('bump', { pitch: 0.6 }); K.say(this.g, gong, 'CLONK... START OVER', '#ffd84a'); }
  }
  update(dt) { this.t += dt; if (this.opening) this.open = Math.min(1, this.open + dt * 0.8); }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, up = this.open * h;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 8, y - 20, w + 16, h + 20); ctx.clip();
    ctx.fillStyle = '#8a8270'; rr(ctx, x, y - up, w, h, 4); ctx.fill();
    ctx.strokeStyle = '#4a4636'; ctx.lineWidth = 1.5; for (let k = 1; k < h / TS; k++) { ctx.beginPath(); ctx.moveTo(x, y - up + k * TS); ctx.lineTo(x + w, y - up + k * TS); ctx.stroke(); }
    ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.arc(x + w / 2, y - up + h * 0.4, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a5212'; ctx.beginPath(); ctx.arc(x + w / 2, y - up + h * 0.4, 5, 0, TAU); ctx.fill();
    for (let k = 1; k <= this.n; k++) { ctx.fillStyle = k < this.next ? '#ffd84a' : '#4a4636'; ctx.beginPath(); ctx.arc(x + w / 2 + (k - (this.n + 1) / 2) * 9, y - up + h * 0.4 + 24, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
/* ---------------- the boss arena: the durian grove ---------------- */
// Three durian trees grow in the ruined temple garden. Their branches are one-way platforms: land on one and the
// whole tree shakes, and a ripe durian drops out of the crown straight down the trunk. Boss Kera loves perching at
// the trunk right under the crown... A fallen durian is a spiky ball Brady can kick into him as well.
const GROVE = { trunks: [4, 13, 21], low: 2, high: 4, crown: 7.4 };
const durianPropArt = (ctx, e, x, y, t) => durianShape(ctx, x, y - e.h / 2, 0, 1);
const IdDurianProp = TourProp.make({
  w: 22, h: 20, durian: true, kick: 6.5, bounce: 0.45, friction: 5, roll: true, hurts: true, hp: 1, life: 16, semis: false, burst: '#c8d84a', art: durianPropArt,
  onHitBoss(e, b) { e.g.burst(e.cx, e.cy, 16, '#d8e86a', 'debris'); Sound.play('splat', { pitch: 0.7, vol: 0.6 }); }
});
const coconutArt = (ctx, s, t) => {
  ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 7);
  ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-6 + k * 3, -6); ctx.lineTo(-7 + k * 3, 6); ctx.stroke(); }
  ctx.fillStyle = '#3a2410'; for (const [dx, dy] of [[-2, -3], [2, -3], [0, 1]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the grove itself: trunks, branches, crowns full of durians (and the vines, from phase 3). It watches Brady's landings.
class IdGrove extends Ent {
  constructor(g, s) {
    super(g, s, 26 * TS, 14 * TS); this.x = s.ax0 * TS; this.y = (s.gy - 14) * TS; this.friendly = true; this.ghost = true;
    const fy = s.gy * TS; this.floorY = fy; this.ax0 = s.ax0 * TS; this.ax1 = (s.ax0 + 26) * TS;
    this.trees = GROVE.trunks.map(tx => { const x = (s.ax0 + tx) * TS + TS / 2; return { x, low: { x0: x - 2.5 * TS, x1: x + 2.5 * TS, y: fy - GROVE.low * TS }, high: { x0: x - 1.5 * TS, x1: x + 1.5 * TS, y: fy - GROVE.high * TS }, crownY: fy - GROVE.crown * TS, shake: 0, drop: 0, crown: 2, regrow: 0, on: [false, false], buck: 0, seed: tx }; });
    this.vines = false; this.phase = 1;
  }
  // the grove of a given boss (castles build a second, unreachable arena past the door: match by position)
  static of(g, b) { return g.entities.find(e => e instanceof IdGrove && !e.remove && Math.abs(e.ax0 - b.arenaX0) < 1) || null; }
  perches() { const out = []; for (const tr of this.trees) { out.push({ tree: tr, x: tr.x, y: tr.high.y }); out.push({ tree: tr, x: tr.x, y: tr.low.y }); } return out; }
  onBranch(p, br) { return !!(p && !p.dead && p.onGround && p.cx > br.x0 - 4 && p.cx < br.x1 + 4 && Math.abs(p.y + p.h - br.y) < 4); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    for (const tr of this.trees) {
      if (tr.shake > 0) { tr.shake -= dt; if (tr.shake <= 0 && tr.drop) this.dropDurian(tr); }
      if (tr.crown < 2) { tr.regrow -= dt; if (tr.regrow <= 0) { tr.crown++; tr.regrow = this.phase >= 3 ? 3 : 4.5; g.burst(tr.x, tr.crownY, 6, '#9ad86a', 'spark'); } }
      // phase 3: the tree shakes back and bucks Brady off its branch
      if (tr.buck > 0) { tr.buck -= dt; if (tr.buck <= 0 && p && !p.dead && (this.onBranch(p, tr.low) || this.onBranch(p, tr.high))) { p.vy = -7 * TS; p.vx = (sign(p.cx - tr.x) || 1) * 5 * TS; p.onGround = false; K.say(g, p, 'WOBBLE!', '#9ad86a'); Sound.play('bump', { pitch: 0.8, vol: 0.5 }); } }
      // a landing on either branch shakes the tree
      [tr.low, tr.high].forEach((br, k) => { const on = this.onBranch(p, br); if (on && !tr.on[k]) this.stomp(tr, br); tr.on[k] = on; });
    }
  }
  stomp(tr, br) {
    const g = this.g, p = g.player;
    Sound.play('bump', { pitch: 1.3, vol: 0.5 }); g.burst(p.cx, br.y, 6, '#9ad86a', 'spark');
    if (tr.crown <= 0) { g.parts.text(tr.x, tr.crownY - 30, 'NO DURIANS YET...', '#c8e8a0'); tr.shake = 0.3; return; }
    tr.shake = 0.55; tr.drop = 1; g.shake(2);
    if (this.phase >= 3) tr.buck = 0.9;
  }
  dropDurian(tr) {
    const g = this.g; tr.drop = 0; if (tr.crown <= 0) return;
    tr.crown--; if (tr.regrow <= 0) tr.regrow = this.phase >= 3 ? 3 : 4.5;
    const d = new IdDurianProp(g, { x: tr.x + (tr.crown ? -9 : 9), y: tr.crownY + 20 });
    d.vy = 2 * TS; g.spawn(d); Sound.play('throw', { pitch: 0.6, vol: 0.4 }); g.burst(tr.x, tr.crownY, 8, '#4a8a3a', 'debris');
  }
  draw(ctx) {
    const t = this.g.t, fy = this.floorY, b = this.g.boss;
    // the vines hanging from the ruined arch (phase 3)
    if (this.vines) {
      const px = (this.ax0 + this.ax1) / 2, swinging = b && b.pose === 'swing' && b.vineA != null;
      ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const dx of [-14, 14]) { if (swinging) continue; ctx.beginPath(); ctx.moveTo(px + dx, 0); ctx.quadraticCurveTo(px + dx + Math.sin(t * 1.3) * 10, fy - 7 * TS, px + dx * 1.5 + Math.sin(t * 1.1) * 14, fy - 3.4 * TS); ctx.stroke(); }
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#5a9a3a'; for (const dx of [-14, 14]) { ctx.beginPath(); ctx.ellipse(px + dx * 1.5 + Math.sin(t * 1.1) * 14, fy - 3.4 * TS + 4, 6, 10, 0, 0, TAU); ctx.fill(); }
    }
    for (const tr of this.trees) {
      const sx = tr.shake > 0 ? Math.sin(t * 55) * 3 : 0, x = tr.x, cy = tr.crownY;
      // the trunk, with bark lines and a root flare
      ctx.fillStyle = '#6a4a32'; ctx.beginPath(); ctx.moveTo(x - 14, fy); ctx.lineTo(x - 7 + sx * 0.5, cy + 24); ctx.lineTo(x + 7 + sx * 0.5, cy + 24); ctx.lineTo(x + 14, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a3a26'; ctx.beginPath(); ctx.moveTo(x - 22, fy); ctx.quadraticCurveTo(x - 10, fy - 10, x - 8, fy - 30); ctx.lineTo(x - 2, fy - 30); ctx.lineTo(x - 4, fy); ctx.fill();
      ctx.strokeStyle = 'rgba(40,24,12,0.45)'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 3, fy - 10 - k * 8); ctx.lineTo(x - 7 + k * 3 + sx * 0.4, cy + 50 - k * 12); ctx.stroke(); }
      // the branches: thick limbs over the one-way tiles, tufts of leaves along them
      for (const br of [tr.low, tr.high]) {
        ctx.fillStyle = '#6a4a32'; rr(ctx, br.x0 - 2 + sx, br.y - 2, br.x1 - br.x0 + 4, 12, 5); ctx.fill();
        ctx.fillStyle = '#8a6a48'; ctx.fillRect(br.x0 + 2 + sx, br.y - 1, br.x1 - br.x0 - 4, 2);
        ctx.fillStyle = '#2e6a2e'; for (let lx = br.x0 + 8; lx < br.x1; lx += 22) { ctx.beginPath(); ctx.ellipse(lx + sx, br.y - 6, 12, 7, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#4a9a3a'; for (let lx = br.x0 + 14; lx < br.x1; lx += 22) { ctx.beginPath(); ctx.ellipse(lx + sx, br.y - 9, 6, 4, 0, 0, TAU); ctx.fill(); }
      }
      // the crown
      ctx.fillStyle = '#2e6a2e'; for (const [dx, dy, r] of [[0, 0, 36], [-34, 12, 26], [34, 12, 26], [-16, -22, 24], [18, -22, 24]]) { ctx.beginPath(); ctx.arc(x + dx + sx, cy + dy, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4a8a3a'; for (const [dx, dy, r] of [[-18, -8, 12], [14, -14, 11], [0, 12, 10], [30, 2, 8]]) { ctx.beginPath(); ctx.arc(x + dx + sx, cy + dy, r, 0, TAU); ctx.fill(); }
      // the ripe durians hanging under the crown
      for (let k = 0; k < tr.crown; k++) { const dx = k === 0 ? -9 : 9; ctx.strokeStyle = '#5a7a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + dx + sx, cy + 10); ctx.lineTo(x + dx + sx * 1.5, cy + 22); ctx.stroke(); durianShape(ctx, x + dx + sx * 1.5, cy + 32 + (tr.shake > 0 ? Math.sin(t * 40) * 2 : 0), tr.shake > 0 ? Math.sin(t * 30) * 0.3 : 0, 1); }
      // the drop zone: a dashed line from the crown onto the perched boss
      if (b && b.state === 'fight' && b.act === 'perch' && b.perch && b.perch.tree === tr && tr.crown > 0) {
        ctx.save(); ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = `rgba(255,240,120,${0.55 + 0.35 * Math.sin(t * 8)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, cy + 46); ctx.lineTo(x, b.y - 6); ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#fff6c0'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LAND ON A BRANCH!', x, cy + 62);
      }
    }
  }
}
// a banana peel: it sails through the air, lands, and whoever steps on it goes flying
class IdPeel extends Ent {
  constructor(g, x, y, vx, vy) { super(g, null, 22, 10); this.x = x - 11; this.y = y - 10; this.vx = vx; this.vy = vy; this.life = 9; this.landed = false; this.rot = 0; }
  update(dt) {
    this.t += dt; this.life -= dt; if (this.life <= 0) { this.remove = true; return; }
    if (!this.landed) { this.vy += PHYS.gDown * 0.7 * dt; moveBody(this, this.g.area, dt, { semis: true }); this.rot += dt * 8; if (this.onGround) { this.landed = true; this.vx = 0; this.rot = 0; Sound.play('splat', { pitch: 1.6, vol: 0.3 }); } }
  }
  touchPlayer(p) {
    if (!this.landed || p.dead || !p.onGround || p.star > 0 || this.life < 0.5) return;
    const d = sign(p.vx) || p.facing || 1; p.vx = d * 10 * TS; p.vy = -3 * TS; p.onGround = false; this.remove = true;
    K.say(this.g, p, 'WHOOPS!', '#ffe08a'); Sound.play('kick', { pitch: 1.5, vol: 0.5 }); this.g.burst(this.cx, this.y + this.h, 6, '#ffe08a', 'spark');
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, a = this.life < 1.5 ? Math.max(0.2, this.life / 1.5) : 1;
    ctx.save(); ctx.translate(x, y - 4); ctx.rotate(this.rot); ctx.globalAlpha = a;
    ctx.fillStyle = '#ffe24a'; for (const ang of [-2.4, -0.7, 0.7, 2.4]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(ang) * 12, Math.sin(ang) * 6 - 6, Math.cos(ang) * 14, Math.sin(ang) * 4 + 2); ctx.quadraticCurveTo(Math.cos(ang) * 8, Math.sin(ang) * 2 + 2, 0, 2); ctx.fill(); }
    ctx.fillStyle = '#5a4a1a'; ctx.beginPath(); ctx.arc(0, -2, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// a troop monkey: it runs for any durian lying on the floor and carries it up the nearest trunk, out of reach
class IdTroop extends Ent {
  constructor(g, s) { super(g, s, 20, 22); this.enemy = true; this.state = 'run'; this.carry = null; this.flat = 0; this.vx = this.dir * 2.4 * TS; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.flat -= dt; if (this.flat <= 0) this.remove = true; return; }
    const g = this.g, grove = g.boss && g.boss.grove;
    if (this.state === 'run') {
      let best = null, bd = 1e9;
      for (const e of g.entities) if (e.prop && e.cfg && e.cfg.durian && !e.remove && !e.carried && e.onGround) { const d = Math.abs(e.cx - this.cx); if (d < bd) { bd = d; best = e; } }
      if (best) {
        this.dir = sign(best.cx - this.cx) || this.dir; this.vx = this.dir * 3.6 * TS;
        if (bd < 14) {
          this.carry = best; best.carried = this; this.state = 'home';
          const tr = grove ? grove.trees.reduce((a, q) => Math.abs(q.x - this.cx) < Math.abs(a.x - this.cx) ? q : a) : null;
          this.homeX = tr ? tr.x : this.cx; this.homeY = tr ? tr.crownY : this.y - 200; K.say(g, this, 'OOK! MINE!', '#ffd84a');
        }
      } else if (!this.vx) this.vx = this.dir * 2.4 * TS;
      this.vy += PHYS.gDown * dt; moveBody(this, g.area, dt, { semis: false });
      if (this.hitWall) { this.dir = -this.dir; this.vx = this.dir * 2.4 * TS; }
    } else {
      if (Math.abs(this.cx - this.homeX) > 6) { this.dir = sign(this.homeX - this.cx) || 1; this.vx = this.dir * 3 * TS; this.vy += PHYS.gDown * dt; moveBody(this, g.area, dt, { semis: false }); }
      else { this.vx = 0; this.vy = 0; this.y -= 4.5 * TS * dt; if (this.y + this.h < this.homeY) { this.remove = true; if (this.carry) this.carry.remove = true; g.parts.text(this.cx, this.y + 20, 'BYE BYE DURIAN!', '#ffd84a'); } }
      if (this.carry) { if (this.carry.remove) this.carry = null; else { this.carry.x = this.cx - this.carry.w / 2; this.carry.y = this.y - this.carry.h + 4; this.carry.vx = 0; this.carry.vy = 0; this.carry.onGround = false; } }
    }
  }
  dropCarry() { if (this.carry) { this.carry.carried = null; this.carry.fling((Math.random() - 0.5) * 2 * TS, -3 * TS); this.carry = null; } }
  hit(kind, src) {
    if (this.dead) return false; this.dropCarry();
    if (kind === 'stomp' || kind === 'spin') { this.dead = true; this.flat = 0.5; this.vx = 0; Sound.play('stomp'); this.g.burst(this.cx, this.y + this.h, 8, '#a8988a', 'dust'); this.g.addScore(200, this.cx, this.y); return true; }
    this.knockOff(src && src.vx ? sign(src.vx) : 1); return true;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, climbing = this.state === 'home' && Math.abs(this.cx - this.homeX) <= 6;
    ctx.save(); ctx.translate(x, y); if (this.dead) ctx.scale(1.3, 0.4); if (this.knocked) { ctx.translate(0, -this.h / 2); ctx.rotate(Math.PI + (this.spin || 0)); ctx.translate(0, this.h / 2); }
    ctx.scale(this.dir, 1);
    const run = this.dead ? 0 : Math.sin(t * (climbing ? 16 : 12));
    ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.quadraticCurveTo(-18, -5, -17 + Math.sin(t * 3) * 3, -20); ctx.stroke();
    ctx.fillStyle = '#a8988a'; ctx.beginPath(); ctx.ellipse(0, -9, 9, 8, 0, 0, TAU); ctx.fill();
    for (const lx of [-5, 4]) ctx.fillRect(lx - 2 + run * 2 * (lx < 0 ? 1 : -1), -4, 4, 4);
    ctx.beginPath(); ctx.arc(5, -18, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0b8a8'; ctx.beginPath(); ctx.ellipse(7, -17, 4.5, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(6, -19, 1.1, 0, TAU); ctx.arc(9.5, -19, 1.1, 0, TAU); ctx.fill();
    // arms up when carrying, pumping when running
    ctx.strokeStyle = '#a8988a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
    if (this.carry) { ctx.moveTo(-3, -12); ctx.lineTo(-6, -24); ctx.moveTo(5, -12); ctx.lineTo(8, -24); } else { ctx.moveTo(2, -12); ctx.lineTo(8 + run * 4, -6); }
    ctx.stroke(); ctx.lineCap = 'butt';
    ctx.restore();
  }
}
const entities = {
  idGecko: IdGiver, idRack: IdGiver, idSurfRig: IdSurfRig, idFloat: IdFloat, idJelly: IdJelly, idGlowJelly: IdGlowJelly, idKite: IdKite,
  idSunrise: IdSunrise, idBombs: IdBombs, idHotRocks: IdHotRocks, idAngler: IdAngler, idMoray: IdMoray, idManta: IdManta, idPlankton: IdPlankton, idBiolum: IdBiolum,
  idMonkey: IdMonkey, idDurianTree: IdDurianTree, idGong: IdGong, idGongDoor: IdGongDoor, idGrove: IdGrove, idDurianProp: IdDurianProp, idTroop: IdTroop
};
Object.assign(decor, {
  // a banyan tree: a wide crown and curtains of aerial roots
  idBanyan(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.quadraticCurveTo(x - 10, y - d.h * 0.5, x - 16, top + 40); ctx.lineTo(x + 18, top + 40); ctx.quadraticCurveTo(x + 10, y - d.h * 0.5, x + 28, y); ctx.fill();
    ctx.strokeStyle = 'rgba(110,90,70,0.85)'; ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) { const rx = x0 + 10 + k * (d.w - 20) / 13; ctx.beginPath(); ctx.moveTo(rx, top + 34); ctx.quadraticCurveTo(rx + Math.sin(t * 0.8 + k) * 3, top + d.h * 0.5, rx + Math.sin(k * 2) * 6, y - (k % 3) * 20); ctx.stroke(); }
    ctx.fillStyle = '#2e5a2e'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x0 + 20 + k * (d.w - 40) / 8, top + 30 + (k % 2) * 10, 34, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a8a3a'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x0 + 30 + k * (d.w - 60) / 6, top + 18 + (k % 2) * 8, 16, 0, TAU); ctx.fill(); }
  },
  // the mast of a sunken jukung, its sail in rags, glowing with tiny anemones
  idMast(ctx, x, y, t) {
    ctx.strokeStyle = '#3a3040'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 110); ctx.stroke();
    ctx.fillStyle = 'rgba(120,80,110,0.55)'; ctx.beginPath(); ctx.moveTo(x + 9, y - 104); ctx.quadraticCurveTo(x + 40 + Math.sin(t) * 4, y - 80, x + 28, y - 46); ctx.lineTo(x + 20, y - 60); ctx.lineTo(x + 6, y - 50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a4050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y - 110); ctx.quadraticCurveTo(x + 60, y - 60, x + 90, y + 2); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(${k % 2 ? '255,120,220' : '120,255,220'},${0.4 + 0.3 * Math.sin(t * 2 + k)})`; ctx.beginPath(); ctx.arc(x + 2 + k * 1.6, y - 10 - k * 16, 2.4, 0, TAU); ctx.fill(); } ctx.restore();
  }
});

/* ---------------- set pieces ---------------- */
const SEA = st => st.GY + 1;
// open sea: a pit filled with surf; the validator walks the surface (a surfer can)
function seaCols(st, x0, x1) { const B = st.B, S = SEA(st); st.pit(x0, x1); B.fill(x0, S, x1, B.H - 1, T.LAVA); for (let x = x0; x <= x1; x++) B.ghosts.push([x, S - 1]); }
const P = {
  /* 9-1: the surf */
  // the beach at the start: a tokay gecko hands over a surfboard (and the swells start rolling)
  gecko(st) { const x = st.x; st.floor(x, x + 8); st.rig = st.spawn('idSurfRig', 0, 0, { every: 3.2, bigs: [] }); st.spawn('idGecko', x + 4, st.gy - 1, {}); st.decor('idBoards', x + 1); st.decor('idUmbrella', x + 7); return x + 9; },
  surf(st, o) {
    const n = o.n || 8, x = st.x, S = SEA(st);
    seaCols(st, x, x + n - 1);
    st.arc(x + 1, x + n - 2, S - 2, o.high ? 3 : 2);
    for (let k = 0; k < (o.jelly || 0); k++) st.spawn('idJelly', x + 3 + k * 4, S - 1, {});
    for (let k = 0; k < (o.fish || 0); k++) st.spawn('idFlyfish', x + 2 + k * 5, S, { delay: k * 0.8 });
    return x + n;
  },
  // black lava-rock reefs poke out of the surf: hop them (sea urchins sit on some)
  reef(st, o) { const x = st.x, n = 9, S = SEA(st), top = S - (o.tall ? 3 : 2); seaCols(st, x, x + n - 1); st.B.fill(x + 4, top, x + 5, st.H - 1, T.HARD); st.coins(x + 3, x + 6, top - 2); if (o.urchin) st.enemy('idUrchin', x + 4, top); return x + n; },
  // an old wooden pier over the water
  pier(st, o) { const x = st.x, n = 13, S = SEA(st), py = S - 3; seaCols(st, x, x + n - 1); st.B.prop('idPier', x + 2, py, 9, S - py, 'top', {}); st.coins(x + 3, x + 9, py - 2); if (o.gold) st.gold(x + 6, py - 4, 'high'); if (o.jelly) st.spawn('idJelly', x + 6, S - 1, {}); return x + n; },
  // buoys bobbing on the swells
  buoys(st, o) { const x = st.x, n = 13, S = SEA(st); seaCols(st, x, x + n - 1); for (let k = 0; k < 3; k++) { st.spawn('idFloat', x + 2 + k * 4, S - 1, { look: 'buoy', top: 14 }); st.coins(x + 2 + k * 4, x + 2 + k * 4, S - 4 - k); } if (o.gold) st.gold(x + 10, S - 6, 'risky'); return x + n; },
  // an outrigger canoe at anchor: a raft that rides the waves
  jukung(st, o) { const x = st.x, n = 14, S = SEA(st); seaCols(st, x, x + n - 1); st.spawn('idFloat', x + 5, S - 1, { look: 'jukung', pw: 4, top: 8 }); st.arc(x + 3, x + 11, S - 4, 3); if (o.gold) st.gold(x + 7, S - 6, 'high'); return x + n; },
  // a big set rolls in: ride up its face and launch off the crest for the high coins
  lip(st, o) { const x = st.x, n = 16, S = SEA(st); seaCols(st, x, x + n - 1); if (st.rig) st.rig.bigs.push(x + 4); st.arc(x + 4, x + 12, S - 6, 3); if (o.gold) st.gold(x + 9, S - 6, 'risky'); st.spawn('idFlyfish', x + 13, S, { delay: 1 }); return x + n; },
  sandbar(st, o) { const x = st.x, n = o.n || 7; st.floor(x, x + n - 1); st.decor('idPalmS', x + 2); st.coins(x + 1, x + n - 2, st.gy - 2); return x + n; },
  // in the surf the checkpoint is a sandbar with a board rack (lose the board, grab another)
  cp(st, o) {
    if (!st.R.surf) return Tour.pieces.cp(st, o);
    const x = st.x; st.floor(x, x + 7); st.spawn('checkpoint', x + 3, st.gy - 1); st.spawn('idRack', x + 3, st.gy - 1, { look: 'rack' }); st.decor('idPalmS', x + 6); st.decor('idUmbrella', x + 1);
    return x + 8;
  },

  /* 9-2: the kite festival over the terraces */
  // rice terraces stepping up (or down); every other step holds a flooded paddy
  terrace(st, o) {
    const n = o.n || 3, dir = o.down ? 1 : -1; let x = st.x;
    st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      st.gy = clamp(st.gy + dir * 2, st.gyMin, st.gyMax);
      const w = 7; st.floor(x, x + w - 1);
      if (k % 2 === 0) { st.B.fill(x + 2, st.gy, x + w - 3, st.gy + 1, T.WATER); for (let q = x + 2; q <= x + w - 3; q++) st.B.decorAt('idPaddyRice', q, st.gy + 2, q); }
      st.decor('idRiceTuft', x); st.decor('idRiceTuft', x + w - 1);
      st.coins(x + 2, x + w - 3, st.gy - 2);
      x += w;
    }
    return x;
  },
  // a ravine between the terraces: giant kites swoop back and forth over it, a relay from ledge to ledge
  kites(st, o) {
    const n = o.n || 2; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 6 * n; st.pit(x, x + span - 1);
    const ax = 1.5, ay = 1.6, speed = 1.2;
    for (let k = 0; k < n; k++) {
      // kite k's left edge swings between x + 6k and x + 6k + 3; neighbours meet edge to edge at the ends of their swings
      const L = x + 6 * k;
      st.spawn('idKite', L + 1, st.gy - 1, { ox: 0.5, ax, ay, speed, phase: -Math.PI / 2 + k * Math.PI, look: k + (o.look || 0), pw: 3 });
      for (let a = 0; a < 40; a++) { const [ox, oy] = IdKite.path(a / 40 * TAU, ax, ay), gx = Math.round(L + 1.5 + ox - 1), gy = Math.round(st.gy + oy); for (let q = 0; q < 3; q++) st.B.ghosts.push([gx + q, gy]); }
      st.coins(L + 1, L + 3, st.gy - 4);
    }
    if (o.gold) st.gold(x + span - 3, st.gy - 6, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a parade of ducks behind their flag-waving leader
  ducks(st, o) { const x = st.x, n = o.len || 14; st.floor(x, x + n - 1); const grp = x; st.spawn('idDuck', x + n - 6, st.gy - 1, { lead: true, grp, dir: -1 }); for (let k = 1; k <= (o.n || 3); k++) st.spawn('idDuck', x + n - 6 + k, st.gy - 1, { grp, dir: -1 }); st.coins(x + 2, x + n - 8, st.gy - 3); st.dress(x, x + 3); return x + n; },
  // a scarecrow rattling its tin cans
  scarecrows(st, o) { const x = st.x; st.floor(x, x + 12); st.enemy('idScarecrow', x + 9, st.gy); st.semi(x + 3, x + 6, st.gy - 3); st.coins(x + 3, x + 6, st.gy - 5); st.decor('idRiceTuft', x + 1); st.decor('idRiceTuft', x + 11); return x + 13; },
  // a long flooded paddy: hop the bamboo stakes (or wade through)
  paddy(st, o) { const x = st.x, n = 13; st.floor(x, x + n - 1); st.B.fill(x + 2, st.gy, x + n - 3, st.gy + 1, T.WATER); for (let q = x + 2; q <= x + n - 3; q++) st.B.decorAt('idPaddyRice', q, st.gy + 2, q); for (let k = 0; k < 3; k++) st.semi(x + 3 + k * 3, x + 3 + k * 3, st.gy - 1 - (k % 2)); st.coins(x + 3, x + n - 4, st.gy - 4); st.enemy('idDragonfly', x + 6, st.gy); return x + n; },
  // a bale on stilts: its thatched roof is a platform
  hut(st, o) { const x = st.x; st.floor(x, x + 9); st.B.prop('idHut', x + 2, st.gy - 4, 6, 4, 'top', {}); st.block(x + 5, st.gy - 8, o.content || 'power'); st.coins(x + 2, x + 7, st.gy - 6); return x + 10; },

  /* 9-3: the sunrise trek */
  dawn(st) { const x = st.x; st.floor(x, x + 5); st.spawn('idSunrise', x, st.gy - 1, {}); st.decor('idTorch', x + 1); st.sign(x + 4, 'Reach the crater rim by sunrise! A glowing ring means a lava bomb is about to land there.'); return x + 6; },
  // stone steps up the slope, lit by bamboo torches
  trail(st, o) {
    const n = o.n || 3; let x = st.x;
    for (let k = 0; k < n; k++) { const w = 4 + (k % 2); st.floor(x, x + w - 1); if (k % 2 === 0) st.decor('idTorch', x + 1); else st.decor('idLavaRock', x + 2); st.coins(x + 1, x + w - 2, st.gy - 2); x += w; st.gy = clamp(st.gy - (1 + (k % 2)), st.gyMin, st.gyMax); }
    st.floor(x, x + 2); return x + 3;
  },
  // the crater lobs lava bombs: each one's landing spot glows first
  bombs(st, o) { const x = st.x, n = o.len || 16; st.floor(x, x + n - 1); st.spawn('idBombs', x, st.gy - 1, { x0: x + 1, x1: x + n - 2, every: o.every || 1.8 }); for (let k = 0; k < 2; k++) st.semi(x + 3 + k * 7, x + 5 + k * 7, st.gy - 3 - k); st.coins(x + 2, x + n - 3, st.gy - 2); st.decor('idLavaRock', x + n - 2); if (o.gold) st.gold(x + 11, st.gy - 7, 'risky'); return x + n; },
  // rocks that heat up red-hot and cool again: cross while they are dark
  hotrocks(st, o) { const x = st.x, n = (o.n || 6) + 3; st.floor(x, x + n + 3); st.spawn('idHotRocks', x + 2, st.gy - 1, { n: o.n || 6, period: 4.6, phase: o.phase || 0 }); st.coins(x + 2, x + n - 2, st.gy - 3); st.decor('idTorch', x + n + 2); return x + n + 4; },
  // a fissure glowing with lava far below: hop the basalt columns
  fissure(st, o) {
    let x = st.x; const B = st.B; st.floor(x, x + 1); x += 2;
    for (let k = 0; k < 3; k++) { st.pit(x, x + 1); B.fill(x, B.H - 2, x + 1, B.H - 1, T.LAVA); const h = 1 + ((k + 1) % 3); B.fill(x + 2, st.gy - h, x + 3, B.H - 1, T.HARD); st.coins(x + 2, x + 3, st.gy - h - 2); x += 4; }
    st.pit(x, x + 1); B.fill(x, B.H - 2, x + 1, B.H - 1, T.LAVA); x += 2;
    st.floor(x, x + 2);
    if (o.gold) st.gold(x - 7, st.gy - 7, 'risky');
    st.enemy('idBat', x - 6, st.gy);
    return x + 3;
  },
  // civets prowl the dark ash fields: their eyes give them away
  civets(st, o) { const x = st.x, n = 14; st.floor(x, x + n - 1); st.enemy('idCivet', x + 8, st.gy); st.enemy('idCivet', x + 12, st.gy); st.decor('idTorch', x + 2); st.semi(x + 4, x + 7, st.gy - 4); st.coins(x + 4, x + 7, st.gy - 6); st.block(x + 10, st.gy - 4, 'power'); return x + n; },
  // a rocky lookout over the crater lake
  lookout(st, o) { const x = st.x; st.floor(x, x + 10); st.B.fill(x + 6, st.gy - 3, x + 9, st.gy - 1, T.HARD); st.semi(x + 2, x + 4, st.gy - 3); st.gold(x + 8, st.gy - 6, 'must'); st.decor('idTorch', x + 7, st.gy - 3); return x + 11; },

  /* 9-4: the night dive (rows 0-1 are rock; st.floorY is the sea bed) */
  biolum(st) { st.spawn('idBiolum', st.x, 4, {}); return st.x; },
  // a gate of coral: squeeze through the gaps (one rock hides a pocket with a postcard)
  reefgate(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x + 1, 2, x + 3, 6); st.rock(x + 1, 11, x + 3, F - 1); st.B.decorAt('idCoral', x + 2, 11, 0);
    st.rock(x + 7, 2, x + 9, 4); st.rock(x + 7, 9, x + 9, F - 1); st.B.decorAt('idAnemone', x + 8, 9, 1);
    st.coins(x + 4, x + 6, 8);
    st.spawn('idGlowJelly', x + 5, 11, { range: 2 });
    if (o.gold) { st.rock(x + 11, 2, x + 13, 9); st.water(x + 12, 4, x + 12, 9); st.gold(x + 12, 5, 'hidden'); return x + 14; }
    return x + 11;
  },
  // anglerfish dangle fake coins in the dark
  anglers(st, o) { const x = st.x, F = st.floorY, n = o.n || 2; st.rock(x + 1, F - 2, x + 3 + n * 5, F - 1); for (let k = 0; k < n; k++) st.spawn('idAngler', x + 3 + k * 5, k % 2 ? 5 : 10, { dir: k % 2 ? 1 : -1 }); st.coins(x + 2, x + 3 + n * 5, 7 + (n % 2)); return x + 5 + n * 5; },
  // a manta glides through: swim in its slipstream to zoom along
  manta(st, o) { const x = st.x, F = st.floorY, w = o.w || 16, zid = 'm' + x, my = 8; st.B.zone(x, my - 1, 6, 3, 0, 0, 0, 'manta', { mid: zid }); st.spawn('idManta', x, my, { x0: x, x1: x + w, zid, speed: 2.2 }); st.coins(x + 2, x + w - 2, my - 3); st.rock(x, F - 1, x + w, F - 1); st.B.decorAt('idCoral', x + 3, F - 1, 2); if (o.gold) st.gold(x + w - 3, 3, 'high'); return x + w; },
  // a shaft through the reef: morays lunge across it from holes in the walls
  morays(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x, 2, x + 10, F - 1);
    st.water(x, 3, x + 3, 5); st.water(x + 4, 3, x + 6, 12); st.water(x + 7, 10, x + 10, 12);
    st.water(x + 3, 8, x + 3, 8); st.spawn('idMoray', x + 3, 8, { dir: 1 });
    st.water(x + 7, 6, x + 7, 6); st.spawn('idMoray', x + 7, 6, { dir: -1 });
    st.coins(x + 1, x + 3, 4); st.B.picksCol(x + 5, 6, 11); st.coins(x + 7, x + 9, 11);
    return x + 11;
  },
  // a sunken outrigger on the sea bed: swim through its hold
  wreck(st, o) {
    const x = st.x, F = st.floorY, B = st.B;
    B.fill(x + 1, F - 4, x + 12, F - 1, T.HARD); st.water(x + 1, F - 3, x + 12, F - 2);
    B.decorAt('idMast', x + 6, F - 4, 0); st.coins(x + 3, x + 10, F - 6);
    if (o.gold) st.gold(x + 7, F - 2, 'hidden');
    st.spawn('idLionfish', x + 9, F - 7, {});
    return x + 13;
  },
  jellies(st, o) { const x = st.x, n = o.n || 4; for (let k = 0; k < n; k++) st.spawn('idGlowJelly', x + 2 + k * 3, 4 + (k * 5) % 9, { range: 2 + (k % 2) }); st.coins(x + 1, x + n * 3, 8); return x + n * 3 + 2; },
  plankton(st, o) { const x = st.x; for (let k = 0; k < 3; k++) st.spawn('idPlankton', x + 2 + k * 4, 6 + (k % 2) * 5, {}); st.spawn('idLionfish', x + 8, 12, {}); st.coins(x + 2, x + 12, 3); return x + 14; },

  /* 9-5: the monkey forest ruins */
  // macaques perch on branches; pass underneath and one drops down to snatch coins
  monkeys(st, o) {
    const x = st.x, n = o.n || 1, w = 9 + n * 5; st.floor(x, x + w - 1);
    for (let k = 0; k < n; k++) { const mx = x + 4 + k * 5, by = st.gy - 5; st.semi(mx - 1, mx + 1, by); st.spawn('idMonkey', mx, by - 1, {}); st.B.fill(mx + 3, st.gy - 1, mx + 3, st.gy - 1, T.HARD); if (o.gold && k === n - 1) st.gold(mx, by - 3, 'risky'); }
    st.coins(x + 1, x + w - 2, st.gy - 2); st.decor('idBanana', x + w - 2);
    return x + w;
  },
  durians(st, o) { const x = st.x, n = 14; st.floor(x, x + n - 1); st.spawn('idDurianTree', x + 6, st.gy - 1, { every: 3.2 }); st.semi(x + 10, x + 12, st.gy - 3); st.coins(x + 10, x + 12, st.gy - 5); if (o.gold) st.gold(x + 11, st.gy - 7, 'risky'); st.enemy('idSate', x + 12, st.gy); return x + n; },
  // a carved stone door that opens to a sequence of gamelan gongs
  gongs(st, o) {
    const x = st.x, n = o.n || 3, id = 'door' + x, w = 7 + n * 3;
    st.floor(x, x + w + 3);
    const sizes = n === 3 ? [2, 0, 1] : [1, 3, 0, 2];
    sizes.forEach((sz, k) => st.spawn('idGong', x + 3 + k * 3, st.gy - 3, { size: sz, order: sz + 1, door: id }));
    st.spawn('idGongDoor', x + w, st.gy - 1, { id, n, h: 8 });
    st.sign(x + 1, 'Strike the gongs from the smallest to the biggest to open the stone door.');
    st.coins(x + 3, x + w - 2, st.gy - 7);
    return x + w + 4;
  },
  // a banyan's aerial roots: climb the root ledges into its crown
  roots(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    B.prop('idBanyan', x + 1, st.gy - 12, 13, 12, 'none', {});
    for (let k = 0; k < 3; k++) st.semi(x + 2 + k * 3, x + 4 + k * 3, st.gy - 3 - k * 3);
    st.semi(x + 11, x + 13, st.gy - 6);
    st.gold(x + 9, st.gy - 12, 'high'); st.coins(x + 2, x + 10, st.gy - 11);
    st.spawn('idMonkey', x + 12, st.gy - 7, {});
    return x + 15;
  },
  // crumbling palace stairs up and over
  ruinstairs(st, o) {
    const x = st.x, B = st.B, n = 4; st.floor(x, x + n * 2 + 6);
    for (let i = 0; i < n; i++) B.fill(x + 1 + i, st.gy - 1 - i, x + 1 + i, st.gy - 1, T.HARD);
    B.fill(x + 1 + n, st.gy - n, x + n + 4, st.gy - 1, T.HARD);
    for (let i = 0; i < n; i++) B.fill(x + n + 5 + i, st.gy - n + i, x + n + 5 + i, st.gy - 1, T.HARD);
    st.block(x + n + 2, st.gy - n - 4, o.content || 'power'); st.enemy('idSate', x + n + 3, st.gy - n); st.coins(x + n + 1, x + n + 4, st.gy - n - 2); st.gold(x + n + 4, st.gy - n - 5, 'hidden');
    return x + n * 2 + 7;
  },
  // the boss arena: a ruined temple garden (the banyan stays in the background) with three durian trees in front of it
  arena_grove(st, o) {
    const B = st.B, { x0, w, GY } = o;
    B.prop('idBanyan', x0 + Math.floor(w / 2) - 7, GY - 13, 14, 12, 'none', {});
    for (const tx of GROVE.trunks) { for (let q = -2; q <= 2; q++) B.set(x0 + tx + q, GY - GROVE.low, T.SEMI); for (let q = -1; q <= 1; q++) B.set(x0 + tx + q, GY - GROVE.high, T.SEMI); }
    B.spawn('idGrove', x0, GY - 1, { ax0: x0, gy: GY });
    B.decorAt('idTorch', x0 + 1, GY, 0); B.decorAt('idTorch', x0 + w - 2, GY, 1);
    B.decorAt('idFrangipani', x0 + 8, GY, 2); B.decorAt('idFrangipani', x0 + 17, GY, 3); B.decorAt('idRiceTuft', x0 + 10, GY, 1); B.decorAt('idRiceTuft', x0 + 24, GY, 4);
  }
};

/* ---------------- the boss: BOSS KERA, the monkey king of the durian grove ---------------- */
// The alpha macaque of the monkey forest, in stolen sunglasses and a stolen bucket hat. He laughs at stomps, snatches
// coins on his dashes, lobs coconuts from his perch and throws banana peels. His weakness: he perches at the trunk,
// right under the crown. Land on a branch and the tree drops a durian on his head (or kick a fallen durian at him).
// Phase 2 calls his troop to carry the durians away; phase 3 he swings on the vines and the trees shake back.
const KERA_LAUGHS = ['OOK OOK OOK!', 'TOO CHEEKY!', 'HAT STAYS ON!', 'NICE TRY, TOURIST!'];
const boss = {
  id: 'id_kera', name: 'Boss Kera', hp: 5, dims: [56, 60], music: 'tour_id_boss', country: 'id',
  brain: {
    guardText: 'OOK OOK!',
    phases: [3, 1],
    wake(b) { const g = b.g; b.loot = 0; b.grove = IdGrove.of(g, b); K.say(g, b, 'OOK! NICE COINS. MINE SOON.', '#ffd84a'); g.toast('LAND ON A BRANCH: THE TREE DROPS A DURIAN ON HIM'); },
    hit(b, kind, src) {
      if (kind === 'stomp' || kind === 'spin') { if (!b.laughT || b.t - b.laughT > 1.2) { b.laughT = b.t; K.say(b.g, b, pick(KERA_LAUGHS), '#ffd84a'); } return 'bounce'; }
      if (kind === 'prop') { if (src && src.cfg && src.cfg.durian) { b.damage(1, { text: 'DURIAN!', col: '#d8e86a' }); return true; } return false; }
      if (kind === 'bump' || kind === 'hazard') return false;
      return undefined;
    },
    hurt(b) { b.go('fall'); b.vy = -7 * TS; b.vx = -b.dir * 3 * TS; b.perch = null; K.say(b.g, b, pick(['OW! MY HAT!', 'OOK?! STINKY!', 'NOT THE DURIAN!']), '#ffd84a'); b.g.burst(b.cx, b.y, 18, '#ffd84a', 'confetti'); },
    phase(b, n) {
      const g = b.g; this.hurt(b); if (b.grove) b.grove.phase = n;
      if (n === 2) { b.troopCool = 0.8; g.bannerText = 'THE TROOP ARRIVES!'; g.bannerT = 1.8; }
      else { if (b.grove) b.grove.vines = true; g.bannerText = 'VINE TIME!'; g.bannerT = 1.8; }
    },
    lastHit(b) { b.go('surrender'); b.vx = 0; return true; },
    giveBack(b) { const g = b.g, n = b.loot || 0; for (let k = 0; k < n; k++) { g.spawn(new PickPop(g, b.cx + (k - n / 2) * 7, b.y)); g.addPick(); } if (n) K.say(g, b, 'HERE. YOUR COINS. ALL ' + n + '.', '#ffd84a'); b.loot = 0; },
    touch(b, p) {
      if (b.act === 'fall' || b.act === 'dizzy' || b.act === 'surrender' || (b.act === 'climb' && b.climbing)) { p.x += (p.cx < b.cx ? -1 : 1) * 2; return true; }
      const fromAbove = p.vy > 0 && p.prevBottom <= b.y + b.h * 0.35;
      if (!fromAbove && b.act === 'dash' && p.invuln <= 0 && !p.dead && b.g.picks > 0) { const n = Math.min(5, b.g.picks); b.g.picks -= n; Save.data.picks = b.g.picks; b.loot = (b.loot || 0) + n; K.say(b.g, b, 'SNATCH! −' + n, '#ffd84a'); Sound.play('pick', { pitch: 0.6 }); }
      return false;
    },
    update(b, dt) {
      const g = b.g, p = g.player, gr = b.grove, ph = b.phase || 1; b.guard = 'bounce';
      // from phase 2 on, two troop monkeys keep running for the fallen durians
      if (ph >= 2 && b.act !== 'surrender') {
        b.troopCool = (b.troopCool == null ? 0.8 : b.troopCool) - dt;
        if (b.troopCool <= 0) {
          const n = g.entities.filter(e => e instanceof IdTroop && !e.dead && !e.remove).length;
          if (n < 2) { b.troopCool = 7; for (let k = n; k < 2; k++) { const side = k ? 1 : -1; g.spawn(new IdTroop(g, { x: side < 0 ? b.arenaX0 + 24 : b.arenaX1 - 24, y: b.floorY, dir: -side })); } K.say(g, b, 'TROOP! FETCH THE DURIANS!', '#ffd84a'); Sound.play('throw', { pitch: 1.6, vol: 0.4 }); }
          else b.troopCool = 2;
        }
      }
      if (b.act === 'walk') {
        b.face(); b.walk(1.6); b.pose = 'walk'; b.fall(dt);
        if (b.at > 0.9) { b.cycle++; const plan = ph >= 3 ? ['climb', 'vine', 'dash', 'climb', 'peel', 'vine'] : ph === 2 ? ['climb', 'dash', 'peel', 'climb', 'dash'] : ['climb', 'dash', 'climb', 'peel']; b.go(plan[b.cycle % plan.length]); }
      } else if (b.act === 'climb') {
        // run to a tree and scamper up the trunk to a perch (right under the crown's durians)
        if (b.first) { const ps = gr ? gr.perches() : []; const far = ps.filter(q => !p || Math.abs(q.x - p.cx) > 3 * TS); b.perch = (far.length ? pick(far) : ps[0]) || null; b.climbing = false; }
        if (!b.perch) { b.go('walk'); return; }
        if (!b.climbing) { b.pose = 'dash'; const dx = b.perch.x - b.cx; b.dir = sign(dx) || b.dir; b.vx = b.dir * 5 * TS; if (Math.abs(dx) < 8) { b.climbing = true; b.vx = 0; b.x = b.perch.x - b.w / 2; } b.fall(dt); }
        else { b.pose = 'climb'; b.vx = 0; b.vy = 0; b.y = approach(b.y, b.perch.y - b.h, 7 * TS * dt); if (b.y <= b.perch.y - b.h + 0.5) { b.y = b.perch.y - b.h; b.go('perch'); } }
        if (b.at > 4) { b.climbing = false; b.go('walk'); }
      } else if (b.act === 'perch') {
        // perched at the trunk, laughing and lobbing coconuts: right under the crown
        b.vx = 0; b.vy = 0; b.onGround = true; b.pose = b.at < 0.7 ? 'laugh' : 'throw'; b.face();
        if (b.first) { b.n = 0; b.perchT = ph >= 3 ? 2.0 : 2.8; K.say(g, b, pick(['OOK OOK! CAN\'T REACH ME!', 'KING OF THE TREE!', 'HAVE A COCONUT!']), '#ffd84a'); }
        if (b.at > 0.8 + b.n * 0.5 && b.n < (ph >= 2 ? 3 : 2) && p) { b.n++; b.face(); const dx = p.cx - b.cx; tourFire(g, b.cx + b.dir * 16, b.y + 12, { kind: 'coconut', vx: clamp(dx * 0.9, -6 * TS, 6 * TS), vy: -6 * TS, grav: PHYS.gDown * 0.5, w: 16, h: 16, life: 3, thru: true, stompable: true, col: '#6a4a2a', art: coconutArt }); Sound.play('throw', { pitch: 1.1, vol: 0.5 }); }
        if (b.at > b.perchT) b.go('drop');
      } else if (b.act === 'drop') {
        b.pose = 'leap'; if (b.first) { b.face(); b.vy = -4 * TS; b.vx = b.dir * 2.5 * TS; b.perch = null; b.onGround = false; }
        b.fall(dt); if ((b.onGround && b.at > 0.3) || b.at > 3) b.go('walk');
      } else if (b.act === 'dash') {
        if (b.at < 0.6) { b.vx = 0; b.pose = 'crouch'; if (b.first) { b.face(); K.say(g, b, 'HEHEHE... COINS!', '#ffd84a'); } }
        else { b.walk(6.4); b.pose = 'dash'; if (b.hitWall || b.x <= b.arenaX0 + 2 || b.x >= b.arenaX1 - b.w - 2) { g.shake(4); Sound.play('bump'); b.vx = 0; b.go('walk'); } }
        if (b.at > 3) b.go('walk');
        b.fall(dt);
      } else if (b.act === 'peel') {
        b.vx = 0; b.pose = 'throw'; b.fall(dt);
        if (b.first) { b.face(); b.n = 0; K.say(g, b, 'BANANA TIME!', '#ffe08a'); }
        if (b.at > 0.5 + b.n * 0.35 && b.n < 2 && p) { b.n++; const tx = clamp(p.cx + (b.n === 1 ? -1.5 : 1.5) * TS, b.arenaX0 + 20, b.arenaX1 - 20); g.spawn(new IdPeel(g, b.cx + b.dir * 14, b.y + 20, (tx - b.cx) / 0.9, -8 * TS)); Sound.play('throw', { pitch: 1.4, vol: 0.4 }); }
        if (b.at > 1.4) b.go('walk');
      } else if (b.act === 'vine') {
        // up to the vine hanging from the ruined arch, then one great swing across the whole arena
        const px = (b.arenaX0 + b.arenaX1) / 2, L = b.floorY - 1.0 * TS - 30;
        if (b.first) { b.sw = b.cx < px ? 1 : -1; b.sx = b.x; b.sy = b.y; b.let = false; K.say(g, b, 'WHEEE! VINE TIME!', '#9ad86a'); Sound.play('throw', { pitch: 0.8, vol: 0.5 }); }
        const a0 = -b.sw * 1.05, gx = px + L * Math.sin(a0) - b.w / 2, gy = L * Math.cos(a0) - b.h / 2;
        if (b.at < 0.7) { const k = Math.min(1, b.at / 0.7); b.pose = 'leap'; b.x = lerp(b.sx, gx, k); b.y = lerp(b.sy, gy, k) - Math.sin(k * Math.PI) * 40; b.vx = b.vy = 0; b.vineA = a0; b.onGround = false; }
        else if (b.at < 2.0) { const k = (b.at - 0.7) / 1.3, a = a0 * Math.cos(k * Math.PI); b.vineA = a; b.pose = 'swing'; b.x = px + L * Math.sin(a) - b.w / 2; b.y = L * Math.cos(a) - b.h / 2; b.dir = b.sw; b.vx = b.vy = 0; }
        else { if (!b.let) { b.let = true; b.vy = -5 * TS; b.vx = b.sw * 3 * TS; b.vineA = null; } b.pose = 'leap'; b.fall(dt); if (b.onGround && b.at > 2.3) { b.let = false; b.go('walk'); } }
        if (b.at > 5) { b.let = false; b.vineA = null; b.go('walk'); }
      } else if (b.act === 'fall') {
        // bonked off the tree: tumbles down the trunk and lands in a heap
        b.pose = 'fall'; b.perch = null; b.fall(dt);
        if ((b.onGround && b.at > 0.25) || b.at > 3) { g.shake(3); Sound.play('stomp', { pitch: 0.7 }); g.burst(b.cx, b.y + b.h, 10, '#a8988a', 'dust'); b.go('dizzy'); }
      } else if (b.act === 'dizzy') {
        b.vx = 0; b.pose = 'dizzy'; b.fall(dt);
        if (b.at > 1.3) { b.face(); b.go('walk'); }
      } else if (b.act === 'surrender') {
        b.vx = 0; b.pose = 'eat'; b.fall(dt);
        if (b.first) { b.gave = false; K.say(g, b, 'MMMF... DURIAN? ...OKAY. OKAY! YOU WIN.', '#ffffff'); Sound.play('select2', { pitch: 0.8 }); }
        if (b.at > 1.2 && !b.gave) { b.gave = true; this.giveBack(b); }
        if (b.at > 3.0) b.die();
      } else b.go('walk');
    },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, sq = 1 + b.squash * 0.12;
      const FUR = '#9a8a76', FUR2 = '#7a6a58', BELLY = '#cdbda4', FACE = '#f2b4a2';
      const limb = (x0, y0, x1, y1, w, c) => { ctx.strokeStyle = c || FUR; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.lineCap = 'butt'; };
      const hand = (hx, hy) => { ctx.fillStyle = FUR2; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, TAU); ctx.fill(); };
      // the vine he swings on
      if (P === 'swing' && b.vineA != null) { const px = (b.arenaX0 + b.arenaX1) / 2; ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(x, b.y + 2); ctx.stroke(); }
      ctx.save(); ctx.translate(x, y);
      if (P === 'fall') ctx.rotate(b.at * 9 * d);
      ctx.scale(d * sq, 1 / sq);
      const lean = P === 'dash' ? 0.25 : P === 'crouch' ? 0.12 : P === 'swing' ? -0.3 : P === 'laugh' ? -0.15 : 0;
      const crouch = (P === 'crouch' || P === 'eat' || P === 'dizzy') ? 8 : (P === 'leap' || P === 'swing') ? -4 : P === 'laugh' ? 4 : 0;
      const run = P === 'dash' ? Math.sin(t * 30) : P === 'walk' ? Math.sin(t * 9) * 0.6 : P === 'climb' ? Math.sin(t * 14) : 0;
      if (P !== 'swing' && P !== 'climb' && P !== 'fall') K.shadow(ctx, 0, 0, 30);
      // tail: long and curling up at the tip
      ctx.strokeStyle = FUR2; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, -20 + crouch); ctx.bezierCurveTo(-46, -14, -50, -50 + Math.sin(t * 2.5) * 5, -32, -56); ctx.stroke(); ctx.lineCap = 'butt';
      // haunches and feet
      for (const s of [-1, 1]) { const fx = s * 11 + run * 6 * s; ctx.fillStyle = FUR; ctx.beginPath(); ctx.ellipse(s * 9, -14 + crouch * 0.5, 11, 13, s * 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = FUR2; rr(ctx, fx - 7, -6, 16, 6, 3); ctx.fill(); }
      ctx.save(); ctx.rotate(lean);
      // the body and belly, with a stolen fanny pack strapped on
      const by = -30 + crouch;
      ctx.fillStyle = FUR; ctx.beginPath(); ctx.ellipse(0, by, 19, 22, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = BELLY; ctx.beginPath(); ctx.ellipse(5, by + 4, 11, 15, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-17, by - 6); ctx.lineTo(16, by + 10); ctx.stroke();
      ctx.fillStyle = COL.b; rr(ctx, 4, by + 6, 18, 11, 4); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(15, by + 9, 3, 5); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, by + 11); ctx.lineTo(20, by + 11); ctx.stroke();
      if (b.loot) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(8, by + 3, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.fillRect(7, by + 2, 2, 2); }
      // the back arm (behind the head)
      const sh = [8, by - 12];
      if (P === 'laugh') { limb(-6, by - 10, -16 + Math.sin(t * 16) * 2, by + 4, 7); hand(-18 + Math.sin(t * 16) * 2, by + 6); }
      else if (P === 'swing') { limb(-6, by - 12, -8, by - 46, 7); hand(-9, by - 49); }
      else if (P === 'climb') { limb(-6, by - 12, -10, by - 34 - run * 8, 7); hand(-11, by - 37 - run * 8); }
      else if (P === 'dash') { limb(-6, by - 10, -24, by + 4, 7); hand(-26, by + 6); }
      else if (P === 'leap' || P === 'fall') { limb(-6, by - 12, -14, by - 40, 7); hand(-15, by - 43); }
      else if (P === 'eat') { limb(-6, by - 10, 2, by - 20, 7); }
      else { limb(-6, by - 10, -10 - run * 4, by + 14, 7); hand(-11 - run * 4, by + 17); }
      // head: a ruff of fur, a pink heart-shaped face, sunglasses and the stolen bucket hat
      const hx = 10, hy = by - 26, tilt = P === 'laugh' ? -0.35 : P === 'dizzy' ? 0.25 : 0;
      ctx.save(); ctx.translate(hx, hy + 8); ctx.rotate(tilt); ctx.translate(-hx, -hy - 8);
      ctx.fillStyle = FUR; ctx.beginPath(); ctx.arc(hx, hy, 16, 0, TAU); ctx.fill();
      ctx.fillStyle = FUR2; for (let k = 0; k < 7; k++) { const a2 = Math.PI * 0.6 + k * 0.32; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a2) * 13, hy + Math.sin(a2) * 13); ctx.lineTo(hx + Math.cos(a2 + 0.16) * 19, hy + Math.sin(a2 + 0.16) * 19); ctx.lineTo(hx + Math.cos(a2 + 0.32) * 13, hy + Math.sin(a2 + 0.32) * 13); ctx.fill(); }
      ctx.fillStyle = FACE; ctx.beginPath(); ctx.arc(hx - 15, hy - 1, 4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx + 4, hy - 12); ctx.bezierCurveTo(hx + 22, hy - 14, hx + 22, hy + 6, hx + 8, hy + 12); ctx.bezierCurveTo(hx, hy + 6, hx - 4, hy - 6, hx + 4, hy - 12); ctx.fill();
      ctx.fillStyle = 'rgba(160,80,70,0.45)'; ctx.beginPath(); ctx.ellipse(hx + 16, hy + 3, 2.4, 1.6, 0, 0, TAU); ctx.fill();
      if (P === 'dizzy' || P === 'fall') {
        // sunglasses knocked askew, eyes crossed out
        ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.6; for (const ex of [hx + 9, hx + 16]) { ctx.beginPath(); ctx.moveTo(ex - 2.5, hy - 6); ctx.lineTo(ex + 2.5, hy - 1); ctx.moveTo(ex + 2.5, hy - 6); ctx.lineTo(ex - 2.5, hy - 1); ctx.stroke(); }
        ctx.save(); ctx.translate(hx + 12, hy); ctx.rotate(0.6); ctx.fillStyle = '#16121e'; rr(ctx, -10, 2, 19, 7, 3); ctx.fill(); ctx.restore();
        ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx + 7, hy + 7); ctx.quadraticCurveTo(hx + 12, hy + 4, hx + 17, hy + 7); ctx.stroke();
      } else if (P === 'laugh' || P === 'eat') {
        // sunglasses pushed up on the forehead, eyes shut tight, mouth wide open (or cheeks stuffed with durian)
        ctx.fillStyle = '#16121e'; rr(ctx, hx + 2, hy - 13, 19, 6, 3); ctx.fill();
        ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.6; for (const ex of [hx + 9, hx + 16]) { ctx.beginPath(); ctx.arc(ex, hy - 3, 2.5, Math.PI + 0.3, TAU - 0.3); ctx.stroke(); }
        if (P === 'laugh') { ctx.fillStyle = '#3a1a1a'; ctx.beginPath(); ctx.ellipse(hx + 12, hy + 6, 6, 4 + Math.abs(Math.sin(t * 16)) * 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a9a'; ctx.beginPath(); ctx.ellipse(hx + 12, hy + 9, 3, 1.6, 0, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = FACE; ctx.beginPath(); ctx.ellipse(hx + 12, hy + 6, 9, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx + 7, hy + 6); ctx.lineTo(hx + 17, hy + 6); ctx.stroke(); }
      } else {
        ctx.fillStyle = '#16121e'; rr(ctx, hx + 2, hy - 7, 19, 7, 3); ctx.fill(); ctx.fillStyle = 'rgba(140,210,255,0.75)'; ctx.fillRect(hx + 5, hy - 6, 5, 2); ctx.fillRect(hx + 13, hy - 6, 5, 2);
        ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); if (P === 'crouch' || P === 'dash') { ctx.moveTo(hx + 6, hy + 5); ctx.quadraticCurveTo(hx + 12, hy + 10, hx + 18, hy + 4); } else { ctx.moveTo(hx + 7, hy + 6); ctx.quadraticCurveTo(hx + 12, hy + 8, hx + 17, hy + 5); } ctx.stroke();
      }
      ctx.fillStyle = '#f4e8c8'; ctx.beginPath(); ctx.ellipse(hx + 2, hy - 14, 18, 4.5, -0.12, 0, TAU); ctx.fill(); rr(ctx, hx - 9, hy - 28, 21, 15, 7); ctx.fill();
      ctx.fillStyle = COL.a; ctx.fillRect(hx - 9, hy - 18, 21, 3.5);
      ctx.restore();
      // the front arm: a coconut wind-up, a vine grip, a climb, a belly slap, a durian snack, or swinging along
      if (P === 'throw') { const k = Math.min(1, b.at * 2.5); const ax = 8 + Math.cos(-2.4 + k * 2.6) * 24, ay = by - 12 + Math.sin(-2.4 + k * 2.6) * 24; limb(sh[0], sh[1], ax, ay, 7); hand(ax, ay); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(ax + 2, ay - 7, 7, 0, TAU); ctx.fill(); }
      else if (P === 'swing') { limb(sh[0], sh[1], 4, by - 48, 7); hand(4, by - 51); }
      else if (P === 'climb') { limb(sh[0], sh[1], 14, by - 34 + run * 8, 7); hand(15, by - 37 + run * 8); }
      else if (P === 'laugh') { limb(sh[0], sh[1], 18 - Math.sin(t * 16) * 2, by + 6, 7); hand(19 - Math.sin(t * 16) * 2, by + 8); }
      else if (P === 'eat') { limb(sh[0], sh[1], 22, by - 14, 7); hand(23, by - 16); durianShape(ctx, 26, by - 22, Math.sin(t * 3) * 0.2, 0.8); }
      else if (P === 'dash') { limb(sh[0], sh[1], -10, by + 2, 7); hand(-12, by + 4); }
      else if (P === 'leap' || P === 'fall') { limb(sh[0], sh[1], 22, by - 40, 7); hand(23, by - 43); }
      else { limb(sh[0], sh[1], 16 + run * 4, by + 14, 7); hand(17 + run * 4, by + 17); }
      ctx.restore();
      ctx.restore();
      if (P === 'dizzy') TourKit.dizzy(ctx, x, b.y - 8, t);
    }
  }
};

/* ---------------- music: gamelan bells and gongs, suling flute, kendang drums ---------------- */
const tracks = {
  tour_id: {
    bpm: 120, bars: 8, rv: 0.3, dl: 0.14,
    ch: 'Em Em C D Em Am B Em',
    ld: 'E5:2 G5:2 B5:2 C6:2 B5:4 G5:4 | F5:2 G5:2 E5:4 B4:4 E5:4 | C6:2 B5:2 G5:2 F5:2 E5:4 G5:4 | B5:4 C6:2 B5:2 G5:8 |' +
        'E6:2 C6:2 B5:2 G5:2 B5:4 C6:4 | C6:2 B5:2 A5:4 E5:4 A5:4 | B5:2 C6:2 B5:2 F#5:2 B5:4 D#6:4 | E6:4 B5:4 G5:4 E5:4',
    li: 'mbox', lv: 0.14,
    l2: 'E5:8 G5:8 | F5:8 E5:8 | C5:8 E5:8 | D5:8 F#5:8 | E5:8 B4:8 | A4:8 C5:8 | B4:8 D#5:8 | E5:16', l2i: 'bell', l2v: 0.06,
    bp: 'r.......o.......', bi: 'bigbell', bv: 0.13, bo: 40,
    ap: '0213021302130213', ai: 'vibes', av: 0.032, ao: 76,
    a2: '3.1.2.0.3.1.2.0.', a2i: 'mbox', a2v: 0.024, a2o: 79,
    dr: ['d..b.d..b..d.b..', '..j...j...j...j.', 'n.nn.n.nn.n.n.nn'], dv: 0.4
  },
  tour_id_surf: {
    bpm: 156, bars: 8, rv: 0.22, dl: 0.1,
    ch: 'E A E B E A B E',
    ld: 'E5:2 G#5:2 B5:2 E6:2 D#6:2 B5:2 G#5:4 | A5:2 C#6:2 E6:4 C#6:2 A5:2 E5:4 | B5:2 G#5:2 E5:2 G#5:2 B5:4 E6:4 | F#6:4 D#6:4 B5:8 |' +
        'E6:2 E6:2 D#6:2 B5:2 G#5:2 B5:2 E6:4 | C#6:2 E6:2 A6:4 G#6:2 E6:2 C#6:4 | B5:2 D#6:2 F#6:4 E6:2 D#6:2 B5:4 | E6:12 .:4',
    li: 'twang', lv: 0.14, hx: 0.05,
    bp: 'r.r.o.r.r.r.o.f.', bi: 'pluckb', bv: 0.3,
    ap: '0.2.1.3.0.2.1.3.', ai: 'mbox', av: 0.03, ao: 76,
    dr: ['k...k.k.k...k.k.', '....s.......s...', 'h.hhh.hhh.hhh.hh', '..j...j...j...j.'], dv: 0.42
  },
  tour_id_dawn: {
    bpm: 88, bars: 8, rv: 0.55, dl: 0.22,
    ch: 'Em C G D Em C Am B',
    ld: 'B4:6 E5:2 G5:8 | G5:4 E5:4 C5:8 | D5:4 G5:4 B5:8 | A5:6 F#5:2 D5:8 | G5:6 B5:2 E6:8 | E6:4 C6:4 G5:8 | A5:4 C6:4 E6:8 | D#6:6 B5:2 F#5:8',
    li: 'whistle', lv: 0.13,
    pd: 'c---------------', pi: 'pad', pv: 0.045, po: 52,
    bp: 'r...............', bi: 'bigbell', bv: 0.14, bo: 40,
    ap: '0...2...1...3...', ai: 'bell', av: 0.03, ao: 72,
    dr: ['d.......d.....d.', '........u.......', '..n.......n.....'], dv: 0.3
  },
  tour_id_deep: {
    bpm: 72, bars: 8, rv: 0.65, dl: 0.3,
    ch: 'Dmaj7 Bm7 Gmaj7 Em7 Dmaj7 Bm7 Gmaj7 A',
    ld: 'F#5:8 A5:4 C#6:4 | B5:12 A5:4 | G5:8 B5:4 D6:4 | E6:12 .:4 | A5:8 F#5:4 D5:4 | F#5:8 B5:8 | D6:8 B5:4 G5:4 | A5:12 .:4',
    li: 'glass', lv: 0.14,
    pd: 'c-------c-------', pi: 'pad', pv: 0.05, po: 50,
    ap: '0.2.4.2.1.3.5.3.', ai: 'vibes', av: 0.03, ao: 74,
    bp: 'r.......f.......', bi: 'sub', bv: 0.22,
    dr: ['u.....u...u.....', '...u.......u..u.'], dv: 0.25
  },
  tour_id_boss: {
    bpm: 168, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Em Em C B Em Em Am B',
    ld: 'E5:1 F5:1 G5:1 B5:1 C6:2 B5:2 G5:2 F5:2 E5:4 | B5:2 C6:2 E6:4 C6:2 B5:2 G5:4 | G5:2 C6:2 E6:2 G6:2 E6:4 C6:4 | B5:2 D#6:2 F#6:4 D#6:2 B5:2 F#5:4 |' +
        'E6:1 D#6:1 E6:1 F6:1 G6:2 F6:2 E6:4 B5:4 | G5:2 B5:2 E6:4 G6:4 E6:4 | A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:4 | B5:4 D#6:4 F#6:4 B6:4',
    li: 'mbox', lv: 0.15,
    bp: 'r...r...r.r.r...', bi: 'bigbell', bv: 0.16, bo: 40,
    ap: '0123012301230123', ai: 'vibes', av: 0.034, ao: 72,
    dr: ['d.bd.bd.d.bd.b.b', 'j.j.j.j.j.j.j.j.', 'k.......k..k....', '....c.......c...'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
const COIN = { name: 'GOLDEN FRANGIPANI', draw(ctx, x, y) {
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke();
  frangipani(ctx, x, y, 5, 0.3, '#fffaf0');
} };
Tour.country({
  id: 'id', colors: COL, tagline: 'Surf breaks, rice terraces and a volcano sunrise',
  themes, painters, dyn, decor, decorLights, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_id', boss: 'tour_id_boss' },
  landmark: 'the Jatiluwih rice terraces',
  arrival: 'Selamat datang, Brady! The Baron shrank a whole hillside of rice terraces into a snow globe. A gecko here says it can lend you a surfboard... ♥ C',
  emblem(ctx, x, y, r) { frangipani(ctx, x, y, r * 0.95, 0.3, '#ffffff'); },
  coin: COIN,
  star: { name: 'GOLDEN GECKO', draw(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * 0.2);
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -10, 4.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(6, 14, 2, 18); ctx.stroke();
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(a * 3, b * 4); ctx.lineTo(a * 9, b * 7); ctx.stroke(); }
    ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(-1.6, -11, 1, 0, TAU); ctx.arc(1.6, -11, 1, 0, TAU); ctx.fill();
    ctx.restore();
  } },
  levels: [
    { name: 'Kuta Surf Break', style: 'auto', theme: 'id_surf', surf: true, GY: 13, H: 17, scroll: 2.5,
      gimmick: 'A gecko lends a surfboard: ride the rolling swells, launch off the crests for big air, hop the lava-rock reefs',
      enemies: [['idUrchin', 1]],
      hint: 'Surf the sea! Jump off a wave crest for big air. THROW sprays water',
      postcard: 'Brady! Bali smells like frangipani and sunscreen. The Baron\'s blimp went inland. Catch a wave and follow! ♥ C',
      script: ['gecko', ['surf', { n: 9, tight: true }], ['reef', { tight: true }], ['surf', { n: 8, jelly: 1, tight: true }], ['pier', { tight: true, gold: true }], ['surf', { n: 8, fish: 1, tight: true }], ['buoys', { tight: true, gold: true }],
        'sandbar', 'cp', ['reef', { urchin: true }], ['surf', { n: 10, fish: 2, jelly: 1, tight: true }], ['lip', { tight: true, gold: true }], ['jukung', { tight: true }], ['surf', { n: 8, jelly: 2, tight: true }], ['reef', { tall: true, tight: true }], ['lip', { tight: true }], ['surf', { n: 6, tight: true }], 'end'] },
    { name: 'Kite Festival', style: 'run', theme: 'id_kites', gyMin: 6,
      gimmick: 'Giant fish and bird kites swoop back and forth over the ravines between the rice terraces: ride them like a relay; wade the flooded paddies; duck parades',
      enemies: [['idDuck', 1], ['idSate', 2], ['idDragonfly', 1]],
      hint: 'Step onto a kite when it dips to the ledge, then hop to the next one where they meet',
      postcard: 'The whole sky is full of kites! One of them looks like the Baron\'s blimp... no, it\'s a fish. ♥ C',
      script: ['flat', ['ducks', { n: 3 }], ['terrace', { n: 3 }], 'kites', 'scarecrows', ['terrace', { n: 2, down: true }], 'paddy', 'cp', ['kites', { n: 3, gold: true }], 'hut', ['ducks', { n: 4 }], 'bonus', ['terrace', { n: 2 }], ['kites', { n: 2, look: 1 }], 'end'] },
    { name: 'Batur Sunrise Trek', style: 'night', theme: 'id_batur', dark: true, GY: 18, H: 22, gyMin: 9, gyMax: 19,
      gimmick: 'Climb the volcano in the dark: lava bombs land on glowing rings, rocks heat up red-hot, civets prowl; the sky turns to sunrise as you climb',
      enemies: [['idCivet', 2], ['idBat', 1]],
      hint: 'A glowing ring means a lava bomb is about to land. Don\'t stand on red-hot rocks!',
      postcard: 'We climbed in the dark to watch the sunrise. The Baron climbed too... in his blimp. Cheater. ♥ C',
      script: ['dawn', ['trail', { n: 3 }], 'bombs', 'hotrocks', ['trail', { n: 2 }], 'fissure', 'lookout', 'cp', 'civets', ['trail', { n: 3 }], ['bombs', { len: 18, gold: true, every: 1.5 }], ['hotrocks', { n: 7, phase: 2 }], ['fissure', { gold: true }], 'oneup', ['trail', { n: 2 }], 'end'] },
    { name: 'Manta Point Night Dive', style: 'swim', theme: 'id_dive', dark: true, H: 18, width: 260,
      gimmick: 'A night dive on a black reef that glows: plankton lights up as you swim, anglerfish dangle fake coins, morays lunge from holes, a manta\'s slipstream sweeps you along',
      enemies: [['idLionfish', 1]],
      hint: 'Tap jump to swim. That coin in the dark might be a fish\'s lure!',
      postcard: 'Night diving! A manta ray swam right over me like a big friendly blanket. ♥ C',
      script: ['biolum', 'reefgate', 'anglers', ['manta', { w: 18 }], 'morays', 'plankton', 'cp', ['wreck', { gold: true }], ['anglers', { n: 3 }], 'jellies', ['manta', { w: 16, gold: true }], 'morays', ['reefgate', { gold: true }], 'plankton'] },
    { name: 'Monkey Forest Ruins', style: 'castle', theme: 'id_ruins', boss: 'id_kera', arena: 'grove', arenaW: 26, roof: false,
      gimmick: 'Overgrown palace ruins: macaques snatch coins, durians burst into stink clouds, gamelan gongs open the stone doors, then Boss Kera in the durian grove',
      enemies: [['idSate', 3], ['idDragonfly', 1]],
      hint: 'Boss Kera laughs at stomps. Land on a branch of the tree he perches in: a durian drops on his head!',
      postcard: 'The rice terraces are back! The Baron flew north to Vietnam. I smell pho. ♥ C',
      script: [['monkeys', { n: 1 }], ['durians', { gold: true }], ['gongs', { n: 3 }], 'roots', 'cp', ['monkeys', { n: 2, gold: true }], 'ruinstairs', ['enemies', { n: 2 }], ['gongs', { n: 4 }], 'durians', 'arena'] }
  ]
});
})();
