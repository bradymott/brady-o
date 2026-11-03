/* ============================================================
   JAPAN (world 11)
   11-1 Bamboo Grove          run    a Shiba hands over nunchucks; bending bamboo: hop on a tall stalk, it bows under
                                     you and carries you forward, jump as it springs back for a huge vault;
                                     bamboo shoots pop out of the ground, rice-ball hoppers, charging beetles
   11-2 Bullet Train          ride   ride the roof of a bullet train past Mt. Fuji: duck the signal gantries,
                                     crouch through the tunnels (low lamps!), swat the crows and the runaway umbrellas
   11-3 Sushi Carousel        run    a giant conveyor-belt sushi bar: ride the plate wheel, dodge the chopsticks
                                     (or knock them away), float on the steam of giant tea cups, soy-sauce pools
   11-4 Neon Batting Cages    night  pitching machines fire baseballs: knock them back into the target to open the
                                     shutters; ride the crane-game claw across the gap; lucky-cat toys throw coins
   11-5 Kappa Castle          castle nightingale floors chirp and wake the spinning-top traps, revolving wall
                                     panels, a koi moat; boss the Great Kappa (bow to him: he bows back and spills
                                     the water from the dish on his head)
   Food, toys, animals and folklore creatures are the jokes; people, shrines and temples never are.
   ============================================================ */
(() => {
const COL = { a: '#e8384f', b: '#26408a', c: '#ffb7c9' };
const K = TourKit;
const SAKURA = ['#ffd0de', '#ffb8cc', '#ffa0bc', '#ffe4ec'];
const NEON = ['#ff3a8a', '#3af0ff', '#ffe03a', '#7aff5a', '#b85aff', '#ff8a2a'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
LIQUIDS.jp_pond = ['#5ab0a0', '#246a6a', '#0c3236', 'rgba(220,255,240,0.25)', null, 'rgba(240,255,250,0.6)'];
LIQUIDS.jp_soy = ['#6a3418', '#341608', '#160804', 'rgba(255,210,160,0.2)', null, 'rgba(255,225,190,0.35)'];
LIQUIDS.jp_moat = ['#4a7a8a', '#1e4252', '#0a1c26', 'rgba(220,240,255,0.22)', null, 'rgba(230,245,255,0.5)'];
LIQUIDS.jp_canal = ['#2a2a5a', '#14143a', '#06061a', 'rgba(255,120,220,0.25)', '#ff3a8a', 'rgba(150,230,255,0.45)'];

// a five-petal cherry blossom
function blossom(ctx, x, y, r, col, rot) {
  ctx.fillStyle = col;
  for (let k = 0; k < 5; k++) { const a = (rot || 0) + k * TAU / 5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.36, a, 0, TAU); ctx.fill(); }
  ctx.fillStyle = shade(col, -0.25); ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, TAU); ctx.fill();
}
// a bamboo culm from y0 down to y1: green tube, darker nodes every so often, a sheen down one side
function culm(ctx, x, y0, y1, w, col, seg) {
  ctx.fillStyle = col; ctx.fillRect(x - w / 2, y0, w, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - w / 2 + w * 0.18, y0, Math.max(1, w * 0.18), y1 - y0);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + w / 2 - w * 0.25, y0, w * 0.25, y1 - y0);
  for (let y = y1 - seg * 0.6; y > y0; y -= seg) { ctx.fillStyle = shade(col, -0.3); ctx.fillRect(x - w / 2 - 0.5, y, w + 1, Math.max(1.2, w * 0.16)); ctx.fillStyle = shade(col, 0.25); ctx.fillRect(x - w / 2, y - 1.2, w, 1); }
}
// a little spray of bamboo leaves
function leafSpray(ctx, x, y, s, col, dir) {
  ctx.fillStyle = col;
  for (let k = 0; k < 5; k++) { const a = dir * (0.3 + k * 0.28) - (dir < 0 ? Math.PI : 0); ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 * 0); ctx.beginPath(); ctx.ellipse(s * 7, 0, s * 8, s * 1.8, 0, 0, TAU); ctx.fill(); ctx.restore(); }
}

/* ---------------- background painters ---------------- */
const painters = {
  // a grove of tall bamboo: rows of culms rising out of view, leaf sprays catching the light
  jpBamboo(ctx, L, rng, H) {
    const n = L.n || 40, cols = L.cols || ['#5a9a4a', '#6aaa52', '#4a8a42', '#7ab85a'], fl = L.floor || L.base;
    for (let i = 0; i < n; i++) {
      const x = rng() * BG_W, w = (L.w || 9) * (0.7 + rng() * 0.6), c = shade(cols[Math.floor(rng() * cols.length)], L.dim || 0), seg = 34 + rng() * 26;
      const leaves = [0, 1, 2].map(k => [20 + rng() * (fl - 60), 0.8 + rng() * 0.6, shade(c, 0.1 + rng() * 0.15)]);
      for (const xx of [x, x - BG_W, x + BG_W]) {
        if (xx < -40 || xx > BG_W + 40) continue;
        culm(ctx, xx, 0, H, w, c, seg);
        leaves.forEach(([ly, s, lc], k) => leafSpray(ctx, xx + (k % 2 ? w / 2 : -w / 2), ly, s, lc, k % 2 ? 1 : -1));
      }
    }
    // the grove floor: soft moss and a stone path line
    ctx.fillStyle = shade(cols[0], (L.dim || 0) - 0.25); ctx.fillRect(0, fl, BG_W, H - fl);
  },
  // rolling misty hills with a few pines
  jpHills(ctx, L, rng, H) {
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = shade(L.color, layer * -0.1); ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, L.base - 30 - layer * 18 + Math.sin(x / 140 + layer * 2) * 22 + Math.sin(x / 47 + layer) * 6);
      ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 14; i++) { const x = rng() * BG_W, y = L.base - 30 + Math.sin(x / 140) * 22; ctx.fillStyle = shade(L.color, -0.2); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + (k - 1) * 5, y - 10 - k * 5, 9 - k * 2, 4, 0, 0, TAU); ctx.fill(); } }
  },
  // the snow-capped volcano on the horizon (scenery only)
  jpFuji(ctx, L, rng, H) {
    const cx = L.at || BG_W / 2, base = L.base, w = L.w || 520, h = L.hh || 170;
    const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, shade(L.color, 0.15)); g.addColorStop(1, L.color);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w / 2, base);
    ctx.quadraticCurveTo(cx - w * 0.2, base - h * 0.55, cx - w * 0.07, base - h); ctx.lineTo(cx + w * 0.07, base - h); ctx.quadraticCurveTo(cx + w * 0.2, base - h * 0.55, cx + w / 2, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.moveTo(cx - w * 0.07, base - h); ctx.lineTo(cx + w * 0.07, base - h);
    ctx.quadraticCurveTo(cx + w * 0.12, base - h * 0.8, cx + w * 0.16, base - h * 0.62);
    for (let k = 0; k <= 8; k++) { const u = 1 - k / 8; ctx.lineTo(cx - w * 0.16 + u * w * 0.32, base - h * 0.62 + (k % 2 ? 14 : 0) + Math.sin(k * 2.1) * 4); }
    ctx.quadraticCurveTo(cx - w * 0.12, base - h * 0.8, cx - w * 0.07, base - h); ctx.fill();
    ctx.fillStyle = 'rgba(160,190,230,0.45)'; ctx.beginPath(); ctx.moveTo(cx + w * 0.02, base - h); ctx.lineTo(cx + w * 0.07, base - h); ctx.quadraticCurveTo(cx + w * 0.12, base - h * 0.8, cx + w * 0.16, base - h * 0.62); ctx.lineTo(cx + w * 0.06, base - h * 0.66); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx - w * 0.3 + k * w * 0.28, base - h * 0.32 + k * 6, 60, 9, 0, 0, TAU); ctx.fill(); }
  },
  // countryside rushing past the train: rice fields, farmhouses with tiled roofs, little orchards
  jpFields(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 40) { ctx.fillStyle = shade(L.color, (x / 40) % 2 ? 0.06 : -0.04); ctx.fillRect(x, L.base + 4, 39, H - L.base); ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = L.base + 10; y < H; y += 7) ctx.fillRect(x, y, 39, 1); }
    let x = 0;
    while (x < BG_W) {
      const w = 40 + rng() * 30, h = 22 + rng() * 10, roof = ['#4a5a6a', '#5a4a4a', '#3a4a5a'][Math.floor(rng() * 3)];
      wrapDraw(x, w, xx => {
        ctx.fillStyle = '#f2ece0'; ctx.fillRect(xx, L.base - h, w, h); ctx.fillStyle = '#6a4a2a'; for (let k = 1; k < 4; k++) ctx.fillRect(xx + k * w / 4, L.base - h, 2, h);
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(xx - 8, L.base - h + 2); ctx.quadraticCurveTo(xx + w / 2, L.base - h - 4, xx + w + 8, L.base - h + 2); ctx.lineTo(xx + w - 6, L.base - h - 16); ctx.lineTo(xx + 6, L.base - h - 16); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(roof, 0.2); ctx.fillRect(xx + 6, L.base - h - 17, w - 12, 3);
      });
      x += w + 40 + rng() * 120;
      const tx = x - 20; ctx.fillStyle = '#3a6a3a'; ctx.beginPath(); ctx.arc(tx, L.base - 16, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(tx - 1.5, L.base - 6, 3, 6);
    }
  },
  // overhead line poles flashing past right beside the track
  jpPoles(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 160) {
      ctx.fillStyle = L.color; ctx.fillRect(x + 20, L.base - 150, 6, 150); ctx.fillRect(x + 4, L.base - 140, 60, 4); ctx.fillRect(x + 26, L.base - 120, 30, 3);
      ctx.strokeStyle = 'rgba(30,30,40,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 60, L.base - 138); ctx.quadraticCurveTo(x + 140, L.base - 128, x + 220, L.base - 138); ctx.stroke();
    }
  },
  // the sushi bar: warm wood wall, hanging menu boards (pictures, no words), noren curtains, paper lanterns, shelves of cups
  jpSushiBar(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 22) { ctx.fillStyle = shade(L.color, ((x / 22) % 3) * 0.03 - 0.03); ctx.fillRect(x, 0, 21, H); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 21, 0, 1, H); }
    ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(0, 60, BG_W, 8); ctx.fillRect(0, L.base - 70, BG_W, 6);
    // menu boards: little paintings of nigiri, maki, tea
    for (let x = 30; x < BG_W; x += 64) {
      ctx.fillStyle = '#f2e6c8'; rr(ctx, x, 76, 44, 58, 3); ctx.fill(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; rr(ctx, x, 76, 44, 58, 3); ctx.stroke();
      const k = Math.floor(rng() * 4), cx = x + 22, cy = 108;
      if (k === 0) { ctx.fillStyle = '#ffffff'; rr(ctx, cx - 13, cy - 2, 26, 10, 4); ctx.fill(); ctx.fillStyle = '#ff7a4a'; rr(ctx, cx - 14, cy - 8, 28, 9, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let q = -2; q <= 2; q++) ctx.fillRect(cx + q * 5, cy - 7, 1.5, 7); }
      else if (k === 1) { for (const dx of [-9, 9]) { ctx.fillStyle = '#1a2a1a'; ctx.beginPath(); ctx.arc(cx + dx, cy, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + dx, cy, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff5a6a'; ctx.beginPath(); ctx.arc(cx + dx, cy, 2.5, 0, TAU); ctx.fill(); } }
      else if (k === 2) { ctx.fillStyle = '#7aa04a'; rr(ctx, cx - 8, cy - 10, 16, 20, 4); ctx.fill(); ctx.fillStyle = '#c8e08a'; ctx.beginPath(); ctx.ellipse(cx, cy - 10, 8, 2.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; for (let q = 0; q < 2; q++) { ctx.beginPath(); ctx.moveTo(cx - 3 + q * 6, cy - 14); ctx.quadraticCurveTo(cx + q * 6, cy - 20, cx - 3 + q * 6, cy - 26); ctx.stroke(); } }
      else { ctx.fillStyle = '#ffffff'; rr(ctx, cx - 13, cy - 2, 26, 10, 4); ctx.fill(); ctx.fillStyle = '#ffd23a'; rr(ctx, cx - 13, cy - 9, 26, 9, 2); ctx.fill(); ctx.fillStyle = '#1a2a1a'; ctx.fillRect(cx - 3, cy - 9, 6, 19); }
      ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.arc(x + 38, 82, 3, 0, TAU); ctx.fill();
    }
    // the cup shelf
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, L.base - 110, BG_W, 5);
    for (let x = 10; x < BG_W; x += 26 + Math.floor(rng() * 14)) { const c = ['#e8e0d0', '#5a7a9a', '#c8a07a', '#3a3a44'][Math.floor(rng() * 4)]; ctx.fillStyle = c; rr(ctx, x, L.base - 128, 14, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 2, L.base - 126, 2, 13); }
    // noren curtains: indigo with a white wave pattern
    for (let x = 0; x < BG_W; x += 260) {
      for (let k = 0; k < 4; k++) { const px = x + 40 + k * 26; ctx.fillStyle = '#26408a'; ctx.fillRect(px, 6, 24, 50); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; for (let w = 0; w < 3; w++) { ctx.beginPath(); ctx.arc(px + 12, 40 + w * 5, 8 - w * 2, Math.PI, TAU); ctx.stroke(); } }
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + 34, 2, 116, 5);
    }
    // paper lanterns: white with a red band (no writing)
    for (let x = 200; x < BG_W; x += 260) for (const dx of [0, 34]) { const lx = x + dx; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 18); ctx.stroke(); ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(lx, 34, 12, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.fillRect(lx - 12, 30, 24, 6); ctx.fillStyle = '#2a1a10'; ctx.fillRect(lx - 6, 17, 12, 3); ctx.fillRect(lx - 6, 49, 12, 3); }
    // the counter top along the bottom
    ctx.fillStyle = '#e8c890'; ctx.fillRect(0, L.base - 36, BG_W, 12); ctx.fillStyle = '#b8945a'; ctx.fillRect(0, L.base - 24, BG_W, H - L.base + 24);
  },
  // a night city: towers of lit windows and vertical neon signs (pictures, never words)
  jpNeonCity(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 40 + Math.floor(rng() * 50), top = L.base - 70 - Math.floor(rng() * (L.hh || 140)), c = shade(L.color, rng() * 0.12 - 0.06);
      wrapDraw(x, w, xx => {
        ctx.fillStyle = c; ctx.fillRect(xx, top, w - 2, H - top);
        for (let y = top + 8; y < H - 6; y += 10) for (let wx = xx + 5; wx < xx + w - 8; wx += 8) if (rng() < 0.55) { ctx.fillStyle = rng() < 0.8 ? 'rgba(255,220,150,0.55)' : 'rgba(150,220,255,0.6)'; ctx.fillRect(wx, y, 4, 5); }
        if (rng() < 0.6) { const sc = NEON[Math.floor(rng() * NEON.length)], sx = xx + (rng() < 0.5 ? 2 : w - 14), sy = top + 10; ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fillRect(sx, sy, 12, 60); ctx.strokeStyle = sc; ctx.lineWidth = 1.6; ctx.shadowColor = sc; ctx.shadowBlur = 6; rr(ctx, sx + 1, sy + 1, 10, 58, 2); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(sx + 6, sy + 9 + k * 13, 3, 0, TAU); ctx.stroke(); } ctx.shadowBlur = 0; }
        if (rng() < 0.4) { ctx.fillStyle = shade(c, -0.2); ctx.fillRect(xx + w / 2 - 8, top - 12, 16, 12); ctx.fillRect(xx + w / 2 - 1, top - 22, 2, 10); }
      });
      x += w + Math.floor(rng() * 10);
    }
  },
  // batting-cage nets on tall poles, floodlights on top
  jpNets(ctx, L, rng, H) {
    const top = L.base - 190;
    ctx.strokeStyle = rgba(L.color, 0.5); ctx.lineWidth = 1;
    for (let x = -200; x < BG_W + 200; x += 12) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 180, L.base); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 180, top); ctx.lineTo(x, L.base); ctx.stroke(); }
    for (let x = 0; x < BG_W; x += 180) { ctx.fillStyle = '#3a3a48'; ctx.fillRect(x, top - 30, 6, L.base - top + 30); ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 14, top - 36, 34, 9); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#fffbe0'; ctx.fillRect(x - 12 + k * 11, top - 34, 8, 5); } }
  },
  // the castle keep on its sloping stone base, white walls and dark curving roofs (its golden roof fish are missing!)
  jpCastle(ctx, L, rng, H) {
    const cx = L.at || BG_W * 0.55, base = L.base, s = L.s || 1;
    ctx.fillStyle = shade(L.color, -0.15); ctx.beginPath(); ctx.moveTo(cx - 150 * s, base); ctx.quadraticCurveTo(cx - 118 * s, base - 30 * s, cx - 110 * s, base - 60 * s); ctx.lineTo(cx + 110 * s, base - 60 * s); ctx.quadraticCurveTo(cx + 118 * s, base - 30 * s, cx + 150 * s, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; for (let y = base - 55 * s; y < base; y += 8 * s) { ctx.beginPath(); ctx.moveTo(cx - 140 * s, y); ctx.lineTo(cx + 140 * s, y); ctx.stroke(); }
    const tiers = [[96, 34], [76, 30], [56, 28], [36, 26]];
    let y = base - 60 * s;
    for (let i = 0; i < tiers.length; i++) {
      const [hw, th] = tiers[i].map(v => v * s);
      ctx.fillStyle = '#f4f0e8'; ctx.fillRect(cx - hw, y - th, hw * 2, th);
      ctx.fillStyle = '#3a3a40'; for (let k = -2; k <= 2; k++) ctx.fillRect(cx + k * hw * 0.38 - 3 * s, y - th + 8 * s, 6 * s, 9 * s);
      const rw = hw + 22 * s, ry = y - th;
      ctx.fillStyle = L.roof || '#3e4a52'; ctx.beginPath(); ctx.moveTo(cx - rw - 8 * s, ry + 4 * s); ctx.quadraticCurveTo(cx - rw + 14 * s, ry - 2 * s, cx - hw * 0.6, ry - 14 * s); ctx.lineTo(cx + hw * 0.6, ry - 14 * s); ctx.quadraticCurveTo(cx + rw - 14 * s, ry - 2 * s, cx + rw + 8 * s, ry + 4 * s); ctx.closePath(); ctx.fill();
      if (i === 1) { ctx.beginPath(); ctx.moveTo(cx - 20 * s, ry - 13 * s); ctx.lineTo(cx, ry - 30 * s); ctx.lineTo(cx + 20 * s, ry - 13 * s); ctx.fill(); }
      y = ry - 12 * s;
    }
    ctx.fillStyle = L.roof || '#3e4a52'; ctx.fillRect(cx - 30 * s, y - 2 * s, 60 * s, 4 * s);
    // two little empty spots where the golden fish should be
    ctx.strokeStyle = 'rgba(255,220,120,0.5)'; ctx.setLineDash([2, 2]); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * 28 * s, y - 8 * s, 6 * s, 0, TAU); ctx.stroke(); } ctx.setLineDash([]);
  },
  // a row of cherry trees in bloom
  jpSakura(ctx, L, rng, H) {
    for (let x = 30; x < BG_W; x += 110 + Math.floor(rng() * 70)) {
      const s = (L.s || 1) * (0.8 + rng() * 0.4), base = L.base;
      const blooms = []; for (let k = 0; k < 16; k++) blooms.push([rng() * TAU, rng(), SAKURA[Math.floor(rng() * SAKURA.length)], 12 + rng() * 9]);
      for (const xx of [x, x - BG_W, x + BG_W]) {
        if (xx < -90 || xx > BG_W + 90) continue;
        ctx.strokeStyle = shade('#4a3030', L.dim || 0); ctx.lineCap = 'round'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(xx, base); ctx.quadraticCurveTo(xx - 6 * s, base - 30 * s, xx + 4 * s, base - 52 * s); ctx.stroke();
        ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.moveTo(xx + 2 * s, base - 40 * s); ctx.quadraticCurveTo(xx + 26 * s, base - 50 * s, xx + 40 * s, base - 62 * s); ctx.moveTo(xx, base - 44 * s); ctx.quadraticCurveTo(xx - 24 * s, base - 52 * s, xx - 36 * s, base - 66 * s); ctx.stroke(); ctx.lineCap = 'butt';
        for (const [a, r, c, rad] of blooms) { ctx.fillStyle = shade(c, L.dim || 0); ctx.beginPath(); ctx.arc(xx + Math.cos(a) * 46 * s * r, base - 70 * s + Math.sin(a) * 24 * s * r, rad * s, 0, TAU); ctx.fill(); }
      }
    }
  }
};
const dyn = {
  // neon signs on the near buildings: they buzz and flicker
  jpNeonBlink(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 7; i++) {
      const x = ((i * 233 + 60 - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (L.base - L.top - 150 - (i % 3) * 30) * S;
      if (x > W + 60 * S) continue;
      const c = NEON[i % NEON.length], on = Math.sin(t * (3 + i) + i * 5) > -0.85 || Math.sin(t * 31 + i) > 0.5;
      ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
      ctx.fillStyle = 'rgba(12,8,24,0.9)'; rr(ctx, -30, -18, 60, 36, 4); ctx.fill();
      ctx.strokeStyle = on ? c : rgba(c, 0.25); ctx.lineWidth = 2.4; if (on) { ctx.shadowColor = c; ctx.shadowBlur = 10; }
      const k = i % 4;
      if (k === 0) { ctx.beginPath(); ctx.ellipse(-4, 0, 16, 8, 0, 0, TAU); ctx.moveTo(12, 0); ctx.lineTo(22, -8); ctx.lineTo(22, 8); ctx.closePath(); ctx.stroke(); }                        // a fish
      else if (k === 1) { ctx.beginPath(); ctx.arc(0, 2, 12, 0, Math.PI); ctx.lineTo(-12, 2); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(0, -12, 4, -2); ctx.stroke(); }                                // a noodle bowl
      else if (k === 2) { ctx.beginPath(); ctx.arc(0, 2, 10, 0, TAU); ctx.moveTo(-8, -6); ctx.lineTo(-8, -14); ctx.lineTo(-2, -8); ctx.moveTo(8, -6); ctx.lineTo(8, -14); ctx.lineTo(2, -8); ctx.stroke(); } // a cat face
      else { ctx.beginPath(); for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + q * TAU / 5; ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); const b = a + TAU / 10; ctx.lineTo(Math.cos(b) * 6, Math.sin(b) * 6); } ctx.closePath(); ctx.stroke(); } // a star
      ctx.restore();
    }
  },
  // a stream of sushi plates going round on the back counter's belt
  jpBelt(ctx, L, camX, oy, S, W, t) {
    const y = oy + (L.base - L.top - 44) * S;
    ctx.fillStyle = '#9a9aa8'; ctx.fillRect(0, y + 6 * S, W, 6 * S);
    for (let i = 0; i < 30; i++) {
      const x = ((i * 70 + t * 30 - camX * L.f) % (BG_W) + BG_W) % BG_W * S;
      if (x > W + 30 * S) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
      const pc = ['#e8e8f0', '#ffd23a', '#e8384f', '#3a6ad8'][i % 4]; ctx.fillStyle = pc; ctx.beginPath(); ctx.ellipse(0, 4, 14, 4, 0, 0, TAU); ctx.fill();
      const k = i % 3; ctx.fillStyle = '#ffffff'; rr(ctx, -9, -4, 18, 7, 3); ctx.fill(); ctx.fillStyle = k === 0 ? '#ff7a4a' : k === 1 ? '#ffd23a' : '#e8384f'; rr(ctx, -10, -8, 20, 6, 3); ctx.fill();
      ctx.restore();
    }
  }
};

/* ---------------- tiles ---------------- */
// the item block: a lacquered bento box with a golden blossom on the lid
function bentoBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,150,170,0.9)'; ctx.shadowBlur = 4 + f * 1.5;
  const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#f0485a'); g.addColorStop(1, '#a81a2a');
  ctx.fillStyle = g; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.6; rr(ctx, 3.5, 3.5, TS - 7, TS - 7, 3); ctx.stroke();
  ctx.fillStyle = '#1a0a10'; ctx.fillRect(2, TS / 2 - 1, TS - 4, 2);
  blossom(ctx, TS / 2, TS / 2, 9, '#ffd24a', 0.3 + f * 0.05);
  const sx = -8 + f * 12; ctx.save(); rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#4a0a14'; ctx.lineWidth = 1.2; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.stroke();
}
function bentoUsed(ctx) { ctx.fillStyle = '#5a2a2a'; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.fill(); ctx.fillStyle = '#3a1a1a'; ctx.fillRect(2, TS / 2 - 1, TS - 4, 2); ctx.strokeStyle = '#2a1010'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.stroke(); }
const mossEarth = { style: 'jpMoss', cap: '#5a9a3a', capHi: '#9ad06a', dirt: '#5a4430', dirt2: '#3a2a1e', rock: '#8a8478',
  paint(ctx, rng) { ctx.fillStyle = 'rgba(30,20,10,0.25)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 4 + rng() * 3, 2.5 + rng() * 2, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(200,190,170,0.35)'; ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 3, 2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,70,40,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); let x = rng() * TS; ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 6, TS / 2, x - 3, TS); ctx.stroke(); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#4a8a34'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#8ac85a'; for (let x = x0; x < x1; x += 4) ctx.fillRect(x, 0, 2, 1.5 + ((x * 7) % 3)); ctx.fillStyle = 'rgba(30,60,20,0.35)'; ctx.fillRect(x0, 6, x1 - x0, 2); }
};
const station = { style: 'jpStation', cap: '#b8b8b0', capHi: '#e8e8e0', dirt: '#9a9a94', dirt2: '#6a6a66', rock: '#a8a8a0',
  paint(ctx, rng) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, TS, 1); ctx.fillRect(0, 0, 1, TS); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < 6; k++) ctx.fillRect(rng() * TS, rng() * TS, 1.5, 1.5); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#d8d8d0'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0, 1, x1 - x0, 3); ctx.fillStyle = '#c8a01a'; for (let x = x0 + 2; x < x1; x += 4) { ctx.beginPath(); ctx.arc(x, 2.5, 0.9, 0, TAU); ctx.fill(); } }
};
const counter = { style: 'jpCounter', cap: '#e8c890', capHi: '#fff0d0', dirt: '#c8a06a', dirt2: '#a07a48', rock: '#d8b07a',
  paint(ctx, rng) { ctx.strokeStyle = 'rgba(120,80,40,0.25)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = rng() * TS; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(TS / 2, y + (rng() - 0.5) * 6, TS, y); ctx.stroke(); } },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#f2d8a8'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#fff6e0'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = 'rgba(120,80,40,0.35)'; ctx.fillRect(x0, 6, x1 - x0, 1.5); }
};
const asphalt = { style: 'jpAsphalt', cap: '#3a3a48', capHi: '#6a6a7a', dirt: '#2a2a34', dirt2: '#1a1a22', rock: '#4a4a56',
  paint(ctx, rng) { for (let k = 0; k < 10; k++) { ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)'; ctx.fillRect(rng() * TS, rng() * TS, 1.5, 1.5); } if (rng() < 0.2) { ctx.fillStyle = 'rgba(255,60,150,0.12)'; ctx.fillRect(0, rng() * TS, TS, 2); } },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#4a4a5a'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = 'rgba(58,240,255,0.55)'; ctx.fillRect(x0, 0, x1 - x0, 1.2); ctx.fillStyle = '#e8e8e0'; for (let x = x0 + 4; x < x1; x += 16) ctx.fillRect(x, 2, 8, 1.5); }
};
const ishigaki = { style: 'jpIshigaki', cap: '#7a9a5a', capHi: '#b8d08a', dirt: '#8a8478', dirt2: '#5a564e', rock: '#a8a49a',
  paint(ctx, rng) { for (let k = 0; k < 4; k++) { const x = (k % 2) * 16 + rng() * 3, y = Math.floor(k / 2) * 16 + rng() * 3; ctx.fillStyle = ['#a8a49a', '#9a968c', '#b4b0a6', '#8e8a80'][Math.floor(rng() * 4)]; ctx.beginPath(); ctx.moveTo(x + 1, y + 2); ctx.lineTo(x + 14 + rng() * 2, y + 1); ctx.lineTo(x + 15, y + 13 + rng() * 2); ctx.lineTo(x + 2 + rng() * 2, y + 15); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,36,30,0.45)'; ctx.lineWidth = 1; ctx.stroke(); } },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8bca0'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = 'rgba(120,150,80,0.6)'; for (let x = x0; x < x1; x += 5) ctx.fillRect(x, 0, 3, 1.5 + (x % 3)); }
};
const tatami = { style: 'jpTatami', cap: '#c8c070', capHi: '#e8e0a0', dirt: '#5a3a24', dirt2: '#3a2414', rock: '#6a4a30',
  paint(ctx, rng) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, TS, 2); ctx.fillStyle = 'rgba(255,220,180,0.08)'; ctx.fillRect(0, rng() * TS, TS, 3); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8be6a'; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = 'rgba(120,110,40,0.35)'; for (let x = x0 + 1; x < x1; x += 2.5) ctx.fillRect(x, 0, 1, 7); ctx.fillStyle = '#1e1e26'; ctx.fillRect(x0, 6, x1 - x0, 3); for (let x = x0 + 31; x < x1; x += 64) ctx.fillRect(x, 0, 3, 9); }
};
const bambooSemi = { style: 'jpBambooPole', paint(ctx, part, x0, x1) { for (let k = 0; k < 2; k++) { ctx.fillStyle = k ? '#7ab04a' : '#8ac05a'; rr(ctx, x0, k * 4.5, x1 - x0, 4.5, 2.2); ctx.fill(); } ctx.fillStyle = '#5a8a34'; for (let x = x0 + 9; x < x1 - 2; x += 18) ctx.fillRect(x, 0, 2, 9); ctx.fillStyle = '#c8a05a'; for (let x = x0 + 15; x < x1 - 2; x += 32) ctx.fillRect(x, 1, 3, 7); } };
const shelfSemi = { style: 'jpShelf', paint(ctx, part, x0, x1) { ctx.fillStyle = '#c8945a'; rr(ctx, x0, 0, x1 - x0, 8, 2); ctx.fill(); ctx.fillStyle = '#f0c890'; ctx.fillRect(x0 + 1, 0, x1 - x0 - 2, 1.5); ctx.fillStyle = '#8a5a30'; ctx.fillRect(x0, 7, x1 - x0, 2); } };
const catwalk = { style: 'jpCatwalk', paint(ctx, part, x0, x1) { ctx.fillStyle = '#4a4a5a'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.strokeStyle = 'rgba(160,160,180,0.6)'; ctx.lineWidth = 1; for (let x = x0 + 3; x < x1; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 3, 6); ctx.stroke(); } ctx.fillStyle = 'rgba(255,58,138,0.7)'; ctx.fillRect(x0, 6, x1 - x0, 1.5); } };
const beamSemi = { style: 'jpBeam', paint(ctx, part, x0, x1) { ctx.fillStyle = '#4a2e1c'; ctx.fillRect(x0, 0, x1 - x0, 9); ctx.fillStyle = '#6a4a30'; ctx.fillRect(x0, 0, x1 - x0, 2); ctx.fillStyle = '#c8a040'; for (let x = x0 + 16; x < x1; x += 32) { ctx.beginPath(); ctx.arc(x, 4.5, 2, 0, TAU); ctx.fill(); } } };
const base = {
  brick: { style: 'brick', c1: '#e8e0d0', c2: '#a8a094', mortar: '#5a5650' }, hard: { c1: '#a8a49a', c2: '#6a665e' }, semi: bambooSemi,
  pillar: { c1: '#c8322a', c2: '#7a1a12', cap: '#2a2a30', style: 'column' }, accent: COL.a, qblockArt: bentoBlock, usedArt: bentoUsed, tint: {}, bloom: 0.16
};
const themes = {
  jp_bamboo: Object.assign({}, base, {
    name: 'Bamboo Grove', music: 'tour_jp', particles: 'leaves',
    sky: ['#9ac8b8', '#d8ecd8', '#f4f8e8'], horizonGlow: '#f0ffe0',
    celestial: { type: 'sun', x: 0.72, y: 0.12, r: 26, color: '#fffff0', glow: '#f0ffd0' }, stars: 0, rays: '#f8ffd8',
    layers: [
      { kind: 'jpHills', color: '#a8c4b0', base: 300, f: 0.02, blur: true },
      { kind: 'jpBamboo', color: '#8ab894', base: 270, floor: 330, f: 0.06, blur: true, dim: 0.12, n: 46, w: 7 },
      { kind: 'jpBamboo', color: '#5a9a52', base: 270, floor: 350, f: 0.16, n: 26, w: 11 }
    ],
    fog: '#e8f8e0', liquid: 'jp_pond', ground: mossEarth, decor: ['jpStoneLantern', 'jpFern', 'jpFern', 'jpShootDecor']
  }),
  jp_rail: Object.assign({}, base, {
    name: 'Bullet Train', music: 'tour_jp_rail', particles: 'none',
    sky: ['#4a8ad8', '#a8d0f0', '#eef6fc'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.86, y: 0.12, r: 24, color: '#ffffff', glow: '#fff8d8' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'jpFuji', color: '#6a7aa8', base: 300, f: 0.01, at: 600, w: 560, hh: 190 },
      { kind: 'jpFields', color: '#8ab85a', base: 326, f: 0.12 },
      { kind: 'jpPoles', color: '#4a4a58', base: 360, f: 0.7 }
    ],
    fog: '#eaf4ff', ground: station, hard: { c1: '#b8b8c0', c2: '#7a7a84' }, semi: { style: 'plank', c1: '#9a9aa8', c2: '#5a5a68' }, decor: ['jpBench']
  }),
  jp_sushi: Object.assign({}, base, {
    name: 'Sushi Carousel', music: 'tour_jp_sushi', particles: 'none',
    sky: ['#5a3a24', '#7a5236', '#9a6a44'], horizonGlow: '#ffd8a0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'jpSushiBar', color: '#c89a62', base: 336, f: 0.08, dyn: 'jpBelt' }],
    fog: '#ffe8c8', liquid: 'jp_soy', ground: counter, semi: shelfSemi, hard: { c1: '#e8c050', c2: '#b88a20' },
    brick: { style: 'brick', c1: '#f4ead8', c2: '#c8b8a0', mortar: '#7a6a58' }, decor: ['jpTeapot', 'jpPlates', 'jpSoyBottle']
  }),
  jp_neon: Object.assign({}, base, {
    name: 'Neon Batting Cages', music: 'tour_jp_neon', particles: 'none',
    sky: ['#0a0620', '#1e0e3a', '#3a1450'], horizonGlow: '#ff3a8a',
    celestial: { type: 'moon', x: 0.18, y: 0.14, r: 18, color: '#f0f0ff', glow: '#c8c8ff' }, stars: 0.3,
    layers: [
      { kind: 'jpNeonCity', color: '#1a1430', base: 300, f: 0.04, blur: true, hh: 160 },
      { kind: 'jpNeonCity', color: '#241a3e', base: 330, f: 0.1, hh: 110, dyn: 'jpNeonBlink' },
      { kind: 'jpNets', color: '#5aff9a', base: 352, f: 0.2 }
    ],
    fog: '#5a2a7a', liquid: 'jp_canal', ground: asphalt, semi: catwalk, hard: { c1: '#5a5a6a', c2: '#2e2e3a' },
    brick: { style: 'brick', c1: '#4a3a5a', c2: '#2a2038', mortar: '#ff3a8a' }, decor: ['jpVending', 'jpCones', 'jpCapsuleMachine']
  }),
  jp_castle: Object.assign({}, base, {
    name: 'Kappa Castle', music: 'tour_jp', particles: 'petals',
    sky: ['#e88aa0', '#f8c8c8', '#fff0e0'], horizonGlow: '#ffd8d0',
    celestial: { type: 'sun', x: 0.25, y: 0.2, r: 34, color: '#fff4e8', glow: '#ffc8c0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'jpCastle', color: '#8a8a90', base: 300, f: 0.03, at: 700, s: 1.1, roof: '#3e4a52' },
      { kind: 'jpSakura', color: '#ffc0d0', base: 340, f: 0.12, s: 1 }
    ],
    fog: '#ffe0e8', liquid: 'jp_moat', ground: ishigaki, semi: beamSemi, hard: { c1: '#f2eee6', c2: '#a8a094' },
    brick: { style: 'brick', c1: '#f4f0e8', c2: '#c8c0b0', mortar: '#3a2a20' }, decor: ['jpStoneLantern', 'jpIkebana', 'jpPine']
  })
};

/* ---------------- decor ---------------- */
const decor = {
  // a stone garden lantern
  jpStoneLantern(ctx, x, y) {
    ctx.fillStyle = '#8a8680'; rr(ctx, x - 10, y - 6, 20, 6, 2); ctx.fill(); ctx.fillRect(x - 3, y - 22, 6, 16);
    ctx.fillStyle = '#9a968e'; rr(ctx, x - 8, y - 34, 16, 12, 2); ctx.fill();
    ctx.fillStyle = '#ffe8a8'; ctx.fillRect(x - 4, y - 31, 8, 6);
    ctx.fillStyle = '#7a766e'; ctx.beginPath(); ctx.moveTo(x - 14, y - 34); ctx.quadraticCurveTo(x, y - 46, x + 14, y - 34); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 44, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,140,70,0.5)'; ctx.beginPath(); ctx.ellipse(x - 6, y - 36, 5, 2, 0, 0, TAU); ctx.fill();
  },
  jpFern(ctx, x, y, t) { for (let k = -3; k <= 3; k++) { ctx.strokeStyle = k % 2 ? '#3a7a34' : '#5a9a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + k * 4, y - 14, x + k * 9 + Math.sin(t + k) * 1.2, y - 10 - (3 - Math.abs(k)) * 3); ctx.stroke(); } },
  jpShootDecor(ctx, x, y) { for (const [dx, h] of [[-5, 12], [4, 17]]) { ctx.fillStyle = '#b89a5a'; ctx.beginPath(); ctx.moveTo(x + dx - 5, y); ctx.quadraticCurveTo(x + dx - 3, y - h * 0.6, x + dx, y - h); ctx.quadraticCurveTo(x + dx + 3, y - h * 0.6, x + dx + 5, y); ctx.fill(); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + dx - 4 + k, y - k * h / 3); ctx.lineTo(x + dx + 4 - k, y - k * h / 3 - 2); ctx.stroke(); } } },
  jpBench(ctx, x, y) { ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 18, y - 10, 2, 10); ctx.fillRect(x + 16, y - 10, 2, 10); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a7ad8'; rr(ctx, x - 18 + k * 12, y - 18, 11, 9, 2); ctx.fill(); } },
  jpTeapot(ctx, x, y, t) {
    ctx.fillStyle = '#2e2e34'; ctx.beginPath(); ctx.ellipse(x, y - 10, 13, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x + k * 4, y - 12, 1.2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#2e2e34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 11, y - 12); ctx.lineTo(x + 19, y - 18); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 20, 9, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + 20 + Math.sin(ph * 5) * 2, y - 22 - ph * 16, 2 + ph * 3, 0, TAU); ctx.fill(); }
  },
  jpPlates(ctx, x, y, t, th, d) { const cols = ['#e8e8f0', '#ffd23a', '#e8384f', '#3a6ad8', '#2aa86a']; for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[(d.seed + k) % cols.length]; ctx.beginPath(); ctx.ellipse(x, y - 3 - k * 4, 13, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 12, y - 2 - k * 4, 24, 1); } },
  jpSoyBottle(ctx, x, y) { ctx.fillStyle = 'rgba(220,235,245,0.6)'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - 12); ctx.quadraticCurveTo(x - 6, y - 18, x - 2, y - 20); ctx.lineTo(x + 2, y - 20); ctx.quadraticCurveTo(x + 6, y - 18, x + 6, y - 12); ctx.lineTo(x + 6, y); ctx.fill(); ctx.fillStyle = '#3a1a0a'; ctx.fillRect(x - 5, y - 11, 10, 10); ctx.fillStyle = '#e8384f'; rr(ctx, x - 3.5, y - 25, 7, 6, 2); ctx.fill(); },
  // a glowing drinks machine (rows of little bottles, no labels)
  jpVending(ctx, x, y, t, th, d) {
    ctx.fillStyle = ['#e8384f', '#3a6ad8', '#f4f4f8'][d.seed % 3]; rr(ctx, x - 16, y - 58, 32, 58, 3); ctx.fill();
    ctx.fillStyle = '#d8f4ff'; ctx.fillRect(x - 12, y - 54, 24, 28); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { ctx.fillStyle = NEON[(r * 4 + k + d.seed) % NEON.length]; rr(ctx, x - 11 + k * 6, y - 52 + r * 9, 4, 7, 1.5); ctx.fill(); }
    ctx.fillStyle = '#1a1a24'; ctx.fillRect(x - 12, y - 14, 24, 7); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 7, y - 24, 4, 6);
  },
  jpCones(ctx, x, y) { for (const dx of [-7, 7]) { ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x + dx - 6, y - 1); ctx.lineTo(x + dx, y - 18); ctx.lineTo(x + dx + 6, y - 1); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + dx - 3, y - 10, 6, 3); ctx.fillStyle = '#2a2a30'; ctx.fillRect(x + dx - 8, y - 2, 16, 2); } },
  jpCapsuleMachine(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#e8384f'; rr(ctx, x - 12, y - 22, 24, 22, 3); ctx.fill(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.arc(x, y - 16, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,240,255,0.55)'; ctx.beginPath(); ctx.arc(x, y - 34, 13, 0, TAU); ctx.fill();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = NEON[(k + d.seed) % NEON.length]; ctx.beginPath(); ctx.arc(x - 8 + (k % 4) * 5.5, y - 28 - Math.floor(k / 4) * 7, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 6, y - 44, 3, 6);
  },
  jpIkebana(ctx, x, y) { ctx.fillStyle = '#2a2a34'; rr(ctx, x - 12, y - 6, 24, 6, 2); ctx.fill(); ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 1.6; for (const [dx, h] of [[-4, 30], [2, 22], [6, 14]]) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.quadraticCurveTo(x + dx * 0.5, y - h * 0.6, x + dx, y - h); ctx.stroke(); } blossom(ctx, x - 4, y - 30, 5, '#ff9ab8', 0.2); blossom(ctx, x + 2, y - 22, 4, '#ffd0de', 1); ctx.fillStyle = '#3a7a34'; ctx.beginPath(); ctx.ellipse(x + 8, y - 12, 6, 2, -0.5, 0, TAU); ctx.fill(); },
  jpPine(ctx, x, y) { ctx.fillStyle = '#5a3a24'; rr(ctx, x - 10, y - 6, 20, 6, 2); ctx.fill(); ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.quadraticCurveTo(x + 8, y - 16, x - 4, y - 24); ctx.stroke(); ctx.fillStyle = '#2f6a3a'; for (const [dx, dy, r] of [[-8, -24, 7], [6, -18, 6], [0, -30, 6]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r * 1.5, r * 0.7, 0, 0, TAU); ctx.fill(); } },
  // a giant tea cup (its steam lifts Brady; the steam itself is drawn by the cup entity)
  jpBigCup(ctx, x, y, t, th, d) {
    const w = d.w;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#5a7a4a'); g.addColorStop(0.5, '#8aaa6a'); g.addColorStop(1, '#4a6a3a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y - d.h); ctx.lineTo(x + w / 2, y - d.h); ctx.quadraticCurveTo(x + w / 2 - 4, y - 6, x + w / 2 - 14, y); ctx.lineTo(x - w / 2 + 14, y); ctx.quadraticCurveTo(x - w / 2 + 4, y - 6, x - w / 2, y - d.h); ctx.fill();
    ctx.fillStyle = '#c8e08a'; ctx.beginPath(); ctx.ellipse(x, y - d.h + 3, w / 2 - 3, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y - d.h + 10); ctx.lineTo(x - w / 2 + 12, y - 10); ctx.stroke();
    ctx.fillStyle = 'rgba(30,50,20,0.4)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 10 + k * 10, y - d.h * 0.5, 3, 0, TAU); ctx.fill(); }
  },
  // a neon sign board you can stand on (the 'top' prop makes its upper edge a one-way platform)
  jpSignBoard(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h, c = NEON[d.seed % NEON.length], on = Math.sin(t * 2.3 + d.seed) > -0.92;
    ctx.fillStyle = '#3a3a48'; ctx.fillRect(x0 + 8, top + 18, 4, d.h - 18); ctx.fillRect(x0 + d.w - 12, top + 18, 4, d.h - 18);
    ctx.fillStyle = 'rgba(14,10,28,0.92)'; rr(ctx, x0, top, d.w, 24, 4); ctx.fill();
    ctx.save(); if (on) { ctx.shadowColor = c; ctx.shadowBlur = 10; } ctx.strokeStyle = on ? c : rgba(c, 0.3); ctx.lineWidth = 2.4; rr(ctx, x0 + 3, top + 3, d.w - 6, 18, 3); ctx.stroke();
    for (let k = 0; k < Math.floor(d.w / 24); k++) { const cx = x0 + 16 + k * 24; ctx.beginPath(); if (k % 3 === 0) ctx.arc(cx, top + 12, 5, 0, TAU); else if (k % 3 === 1) { ctx.moveTo(cx - 6, top + 16); ctx.lineTo(cx, top + 7); ctx.lineTo(cx + 6, top + 16); ctx.closePath(); } else { ctx.moveTo(cx - 6, top + 12); ctx.lineTo(cx + 6, top + 12); ctx.moveTo(cx + 2, top + 8); ctx.lineTo(cx + 6, top + 12); ctx.lineTo(cx + 2, top + 16); } ctx.stroke(); }
    ctx.restore();
  }
};
const decorLights = { jpStoneLantern: [60, '#ffd8a0', -30], jpVending: [80, '#bff0ff', -36], jpCapsuleMachine: [44, '#ffd0f0', -30] };

/* ---------------- enemies ---------------- */
const onigiriArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : m === 'hop' ? 1.08 : 1; ctx.scale(e.dir * (2 - sq), sq);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-13, -2); ctx.quadraticCurveTo(-14, 0, -10, 0); ctx.lineTo(10, 0); ctx.quadraticCurveTo(14, 0, 13, -2); ctx.lineTo(3, -22); ctx.quadraticCurveTo(0, -25, -3, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,200,190,0.6)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-6 + (k % 3) * 6, -15 + Math.floor(k / 3) * 5, 1, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#1e2a20'; rr(ctx, -9, -9, 18, 9, 1); ctx.fill(); ctx.fillStyle = 'rgba(80,120,80,0.4)'; ctx.fillRect(-9, -8, 18, 1);
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -15, 1, 2.6, 1.8, false); ctx.fillStyle = '#ff9aaa'; ctx.beginPath(); ctx.arc(-4, -12, 1.8, 0, TAU); ctx.arc(8, -12, 1.8, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const beetleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const run = m === 'charge', lg = Math.sin(t * (run ? 30 : 12)) * 2;
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.6; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 7, -6); ctx.lineTo(k * 7 + (k % 2 ? lg : -lg) - 3, 0); ctx.stroke(); }
  const g = ctx.createLinearGradient(0, -20, 0, -4); g.addColorStop(0, '#8a4a2a'); g.addColorStop(1, '#3a1a0e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-3, -11, 13, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -19); ctx.lineTo(-3, -4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,180,0.4)'; ctx.beginPath(); ctx.ellipse(-7, -15, 5, 2, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a1a0e'; ctx.beginPath(); ctx.ellipse(10, -10, 5, 5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a1a0e'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(12, -12); ctx.quadraticCurveTo(20, -14, 20, -24); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(19, -20); ctx.lineTo(23, -21); ctx.stroke(); ctx.lineCap = 'butt';
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 11, -11, 1, 1.8, 1.3, run);
  ctx.restore();
};
const crowArt = (ctx, e, x, y, m, t) => {
  const f = Math.sin(t * 12 + (e.seed || 0)) * 0.6;
  ctx.save(); ctx.translate(x, y - 8); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-20, -3); ctx.lineTo(-19, 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -4, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a48'; ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(23, -3); ctx.lineTo(15, -1); ctx.fill();
  ctx.fillStyle = '#2a2a38'; ctx.save(); ctx.rotate(-f); ctx.beginPath(); ctx.ellipse(-2, -6, 12, 4, -0.4, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(11, -5, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(11.5, -5, 0.9, 0, TAU); ctx.fill();
  ctx.restore();
};
const tamagoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#ffffff'; rr(ctx, -12, -9, 24, 9, 4); ctx.fill(); ctx.fillStyle = 'rgba(200,200,190,0.5)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-9 + k * 4.5, -4, 1, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffd23a'; rr(ctx, -13, -21, 26, 13, 3); ctx.fill(); ctx.fillStyle = '#ffe680'; ctx.fillRect(-12, -20, 24, 2); ctx.fillStyle = 'rgba(200,140,20,0.35)'; ctx.fillRect(-12, -14, 24, 1); ctx.fillRect(-12, -11, 24, 1);
  ctx.fillStyle = '#1e2a20'; ctx.fillRect(-3, -21, 6, 21);
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 7, -16, 1, 2.2, 1.6, false); }
  ctx.restore();
};
const takoArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 10);
  const rolling = m === 'roll' || m === 'curl';
  if (rolling) ctx.rotate(e.t * 12 * e.dir); else ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11); g.addColorStop(0, '#e8a050'); g.addColorStop(1, '#9a5a20');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a2a10'; ctx.beginPath(); ctx.ellipse(0, -4, 8, 4, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = '#fff4d8'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 5; k++) ctx.lineTo(-7 + k * 3.5, -5 + (k % 2) * 3); ctx.stroke();
  ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 4; k++) { ctx.fillRect(-5 + k * 3, -8 + (k % 2), 1.4, 1.4); }
  if (!rolling) { ctx.fillStyle = '#e8b8a0'; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(-4 + k * 4, -9); ctx.rotate(Math.sin(t * 9 + k) * 0.6); ctx.fillRect(-1.5, -6, 3, 6); ctx.restore(); } if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, 1, 1, 2, 1.5, false); }
  ctx.restore();
};
const wasabiArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : m === 'hop' ? 1.15 : 0.95; ctx.scale(e.dir * (2 - sq), sq);
  ctx.fillStyle = '#8ac84a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-14, -12, -6, -16); ctx.quadraticCurveTo(0, -24, 4, -16); ctx.quadraticCurveTo(14, -14, 12, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(60,120,30,0.5)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-7 + (k % 3) * 6, -10 + Math.floor(k / 3) * 5, 1, 0, TAU); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -10, 1, 2.4, 1.8, true); ctx.strokeStyle = '#2a4a1a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(0, -13); ctx.moveTo(8, -15); ctx.lineTo(4, -13); ctx.stroke(); }
  ctx.restore();
};
const capsuleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 10);
  const rolling = m === 'roll' || m === 'curl';
  if (rolling) ctx.rotate(e.t * 11 * e.dir); else ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const c = NEON[(e.seed || 0) % NEON.length];
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -4, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a24'; ctx.fillRect(-1, -5, 0.8, 0.8); ctx.fillRect(1, -5, 0.8, 0.8);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-10, -0.5, 20, 1.2);
  if (!rolling && m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, 4, 1, 1.8, 1.3, false);
  ctx.restore();
};
// a battery-powered lucky-cat toy: waves its paw, then throws a (pretend) coin
const catArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#c8322a'; rr(ctx, -12, -6, 24, 6, 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -16, 11, 11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -30, 9, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-6, -42); ctx.lineTo(-2, -37); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(6, -42); ctx.lineTo(2, -37); ctx.fill();
  ctx.fillStyle = '#ffb0c0'; ctx.beginPath(); ctx.moveTo(-7, -36); ctx.lineTo(-6, -40); ctx.lineTo(-4, -37); ctx.fill();
  ctx.fillStyle = '#e8384f'; ctx.fillRect(-8, -23, 16, 3); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -19, 2.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(-4, -12, 4, 5, 0, 0, TAU); ctx.fill();
  const wave = m === 'throw' ? -1.2 : Math.sin(t * 6) * 0.5 - 0.3;
  ctx.save(); ctx.translate(7, -24); ctx.rotate(wave); ctx.fillStyle = '#ffffff'; rr(ctx, -3, -12, 6, 13, 3); ctx.fill(); ctx.fillStyle = '#ffb0c0'; ctx.beginPath(); ctx.arc(0, -10, 1.6, 0, TAU); ctx.fill(); ctx.restore();
  if (m !== 'flat' && m !== 'ko') { ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-3.5, -31, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(3.5, -31, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2, -26); ctx.quadraticCurveTo(0, -24, 2, -26); ctx.stroke(); }
  ctx.restore();
};
// kasa-obake, the hopping one-eyed umbrella of the old stories
const umbrellaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : m === 'hop' ? 1.06 : 1; ctx.scale(e.dir * (2 - sq), sq);
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -1); ctx.stroke(); ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.ellipse(1, -1, 4, 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.moveTo(0, -44); ctx.quadraticCurveTo(-13, -26, -10, -12); ctx.lineTo(10, -12); ctx.quadraticCurveTo(13, -26, 0, -44); ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,200,0.6)'; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(0, -44); ctx.quadraticCurveTo(k * 7, -26, k * 9, -12); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -18, 22, 3);
  if (m !== 'flat' && m !== 'ko') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(2, -30, 5, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(3.5, -29, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff6a8a'; ctx.beginPath(); ctx.moveTo(1, -21); ctx.quadraticCurveTo(6, -14 + Math.sin(t * 8) * 2, 8, -18); ctx.quadraticCurveTo(5, -20, 1, -21); ctx.fill(); }
  ctx.restore();
};
// an umbrella that blew away in the wind, tumbling along open
const flyUmbrellaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 8); ctx.rotate(Math.sin(t * 3 + (e.seed || 0)) * 0.4);
  ctx.fillStyle = '#3a6ad8'; ctx.beginPath(); ctx.moveTo(-18, 2); ctx.quadraticCurveTo(0, -18, 18, 2); for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(18 - k * 9 - 4.5, -2, 18 - (k + 1) * 9, 2); ctx.fill();
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.quadraticCurveTo(0, 16, 4, 15); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(2, -5, 4, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(3, -4.5, 2, 0, TAU); ctx.fill();
  ctx.restore();
};
const topArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y);
  const spinning = m === 'roll' || m === 'curl', s = spinning ? Math.sin(t * 40) : 0;
  ctx.scale(1, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, -12); ctx.lineTo(1, 0); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill();
  const bands = ['#e8384f', '#ffd23a', '#26408a']; for (let k = 0; k < 3; k++) { ctx.fillStyle = bands[(k + (spinning ? Math.floor(t * 20) : 0)) % 3]; ctx.fillRect(-12 + k * 1.5 + s, -16 + k * 1.6, 24 - k * 3, 2); }
  ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, -16, 12, 4, 0, 0, TAU); ctx.fill(); ctx.fillRect(-1.5, -24, 3, 8);
  if (!spinning && m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -9, e.dir, 2, 1.5, false);
  ctx.restore();
  if (spinning) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - 14, 15, 5, 0, 0, TAU); ctx.stroke(); }
};
const koiArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 12); ctx.rotate(e.vy ? clamp(e.vy / (12 * TS), -1, 1) * 1.2 - Math.PI / 2 * 0 : 0); ctx.scale(1, 1);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.ellipse(-2, -4, 5, 6, 0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(3, 5, 4, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(0, 22 + Math.sin(t * 14) * 2); ctx.lineTo(6, 12); ctx.fill();
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(-3, -10, 1.4, 0, TAU); ctx.arc(3, -10, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
// the nightingale-floor traps' spinning tops and the pitching machines' baseballs
const ballArt = (ctx, s, t) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 6.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8384f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(s.cx - 6, s.cy, 5, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(s.cx + 6, s.cy, 5, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke(); if (s._back) { ctx.strokeStyle = 'rgba(255,240,120,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.cx - s.vx * 0.03, s.cy - s.vy * 0.03); ctx.lineTo(s.cx - s.vx * 0.07, s.cy - s.vy * 0.07); ctx.stroke(); } };
const coinShotArt = (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.scale(Math.cos(t * 12), 1); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b8901a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, 3, 5, 0, 0, TAU); ctx.stroke(); ctx.restore(); };
const shotTopArt = (ctx, s, t) => { topArt(ctx, { dir: 1 }, s.cx, s.y + s.h, 'roll', t); };
const enemies = {
  jpOnigiri: { cls: TourEnemy.make({ w: 26, h: 24, speed: 1.0, behavior: 'hop', hopV: 9.5, hopEvery: 1.4, art: onigiriArt, burst: '#ffffff' }), place: 'walk' },
  jpBeetle: { cls: TourEnemy.make({ w: 34, h: 22, speed: 1.2, behavior: 'charge', range: 7, chargeSpeed: 7.5, windup: 0.5, chargeT: 1.4, art: beetleArt, burst: '#5a2a14', onNotice: e => K.say(e.g, e, 'BZZZT!', '#ffd84a') }), place: 'walk' },
  jpCrow: { cls: TourFlyer.make({ w: 30, h: 16, range: 3, speed: 1.0, swoop: true, art: crowArt, burst: '#1a1a24', onSwoop: e => K.say(e.g, e, 'KAA!', '#ffffff') }), place: 'fly' },
  jpTamago: { cls: TourEnemy.make({ w: 26, h: 22, speed: 1.1, behavior: 'walk', art: tamagoArt, burst: '#ffd23a' }), place: 'walk' },
  jpTako: { cls: TourEnemy.make({ w: 22, h: 22, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6.2, rollT: 2.4, art: takoArt, burst: '#c87a30' }), place: 'walk' },
  jpWasabi: { cls: TourEnemy.make({ w: 24, h: 20, speed: 1.0, behavior: 'hop', hopV: 11, hopEvery: 1.1, art: wasabiArt, burst: '#8ac84a', onHop: e => { if (Math.random() < 0.3) K.say(e.g, e, 'SPICY!', '#bfff8a'); } }), place: 'walk' },
  jpCapsule: { cls: TourEnemy.make({ w: 22, h: 22, speed: 0.9, behavior: 'roll', range: 8, rollSpeed: 6.6, rollT: 2.2, art: capsuleArt, burst: '#ff3a8a', init: e => { e.seed = Math.floor(Math.random() * 6); } }), place: 'walk' },
  jpLuckyCat: { cls: TourEnemy.make({ w: 24, h: 40, speed: 0.6, behavior: 'throw', range: 9, every: 2.2, art: catArt, burst: '#ffffff', shoot: (e, p) => { tourFire(e.g, e.cx + e.dir * 12, e.y + 10, { kind: 'coin', vx: e.dir * 5.5 * TS, vy: -5 * TS, grav: PHYS.gDown * 0.35, w: 12, h: 14, life: 3, thru: true, col: '#ffd23a', art: coinShotArt }); Sound.play('pick', { pitch: 1.6, vol: 0.3 }); } }), place: 'walk' },
  jpUmbrella: { cls: TourEnemy.make({ w: 22, h: 44, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.2, art: umbrellaArt, burst: '#c8322a' }), place: 'walk' },
  jpUmbrellaFly: { cls: TourFlyer.make({ w: 34, h: 22, range: 2.5, speed: 1.4, swoop: true, art: flyUmbrellaArt, burst: '#3a6ad8' }), place: 'fly' },
  jpTop: { cls: TourEnemy.make({ w: 24, h: 24, speed: 0.9, behavior: 'roll', range: 9, rollSpeed: 7, rollT: 2.6, art: topArt, burst: '#e8384f' }), place: 'walk' },
  jpKoi: { cls: TourLeaper.make({ w: 18, h: 30, jumpV: 15, every: 1.9, art: koiArt, splash: '#d8f0ff', stompable: true }), place: 'here' }
};

/* ---------------- the nunchucks: a whirl that swats enemies and knocks shots back ---------------- */
// where a knocked-back shot should go: the nearest target, else the nearest enemy (or boss) ahead, else straight back
function backTarget(p, g, s) {
  let best = null, bd = 1e9;
  for (const e of g.entities) {
    if (e.remove || e.dead || e === s) continue;
    const ok = (e.target && !e.lit) || (e.enemy && !(e instanceof Shot) && !e.friendT) || e.boss;
    if (!ok) continue;
    const dx = e.cx - s.cx, dy = e.cy - s.cy, d = Math.hypot(dx, dy) * (e.target ? 0.5 : 1);
    // a target pulls the ball in from any direction (a home run!); anything else has to be in front
    if (d > 16 * TS || (!e.target && dx * sign(s.cx - p.cx || p.facing) < -TS)) continue;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function knockBack(p, g, s) {
  s._back = true; s.friendly = true; s.enemy = false; s.thru = true; s.ground = false; s.homing = 0; s.grav = 0; s.stompable = false;
  s.life = Math.max(s.life, 2.2); s.touchPlayer = () => {};
  const tgt = backTarget(p, g, s), sp = Math.max(11 * TS, Math.hypot(s.vx, s.vy) * 1.4);
  if (tgt) { const dx = tgt.cx - s.cx, dy = tgt.cy - s.cy, d = Math.hypot(dx, dy) || 1; s.vx = dx / d * sp; s.vy = dy / d * sp; s._tgt = tgt; }
  else { s.vx = (sign(s.cx - p.cx) || p.facing) * sp; s.vy = -1.5 * TS; }
  g.burst(s.cx, s.cy, 8, '#ffe8a0', 'spark'); Sound.play('kick', { pitch: 1.7, vol: 0.55 }); g.addScore(50, s.cx, s.cy);
}
const CHUCK_R = 1.7 * TS;
const power = {
  id: 'nunchuck', name: 'NUNCHUCKS', country: 'jp', hint: 'THROW: WHIRL · KNOCK SHOTS BACK', time: 0, cooldown: 0.3,
  icon(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(0, -2 + Math.sin(t * 5), 3, -6); ctx.stroke();
    for (const [dx, a] of [[-5, -0.5], [5, 0.5]]) { ctx.save(); ctx.translate(dx, 1); ctx.rotate(a); const g = ctx.createLinearGradient(-2, 0, 2, 0); g.addColorStop(0, '#5a2a14'); g.addColorStop(0.5, '#a8603a'); g.addColorStop(1, '#5a2a14'); ctx.fillStyle = g; rr(ctx, -2.2, -8, 4.4, 16, 2); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-2.2, -8, 4.4, 1.6); ctx.fillRect(-2.2, 6.4, 4.4, 1.6); ctx.restore(); }
    ctx.restore();
  },
  action(p, g) {
    p._whirl = 0.42; p._whirlHit = [];
    if (!p.onGround && !p._whirlAir) { p._whirlAir = true; p._hover = 0.42; }
    TourKit.sfx('spin', 'throw', { pitch: 0.8, vol: 0.5 });
    return true;
  },
  update(p, dt, inp, g) {
    if (p.onGround) p._whirlAir = false;
    let backs = null; for (const s of g.entities) if (s._back && !s.remove) (backs = backs || []).push(s);
    if (backs) for (const s of backs) {
      const tg = s._tgt; if (tg && !tg.remove && !tg.dead) { const dx = tg.cx - s.cx, dy = tg.cy - s.cy, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(s.vx, s.vy); s.vx = dx / d * sp; s.vy = dy / d * sp; }
      for (const e of g.entities) {
        if (e === s || e.remove || e.dead || e._back || e.friendT) continue;
        if (!(e.target || e.boss || e.whack || (e.enemy && !(e instanceof Shot)))) continue;
        if (!overlap(s, e)) continue;
        if (e.target) e.ding();
        else if (e.boss) { if (e.brain.onBall) e.brain.onBall(e, s); else e.hit('disc', p); }
        else if (e.whack) e.whack(p);
        else if (e.hit('disc', p)) g.addScore(200, e.cx, e.y);
        s.pop(); break;
      }
    }
    if (!(p._whirl > 0)) return;
    p._whirl -= dt;
    // one whirl per jump slows the fall a little
    if (p._hover > 0) { p._hover -= dt; if (p.vy > 2.6 * TS) p.vy = 2.6 * TS; }
    const cx = p.cx, cy = p.y + p.h * 0.45, b = g.boss;
    for (const e of g.entities) {
      if (e.remove || e.dead || e.friendT) continue;
      const r = Math.max(e.w, e.h) / 2, d = Math.hypot(e.cx - cx, e.cy - cy);
      if (d > CHUCK_R + r) continue;
      if (e instanceof Shot) { if (!e._back && e.enemy && e.blockable !== false) knockBack(p, g, e); continue; }
      if (p._whirlHit.indexOf(e) >= 0) continue;
      if (e.whack) { p._whirlHit.push(e); e.whack(p); continue; }
      if (e === b) { p._whirlHit.push(e); if (b.brain.onWhirl) b.brain.onWhirl(b, p); continue; }
      if (e.enemy && !e.boss) { p._whirlHit.push(e); if (e.hit('disc', p)) { g.addScore(100, e.cx, e.y); g.burst(e.cx, e.cy, 8, '#ffe8a0', 'spark'); Sound.play('kick', { pitch: 1.2, vol: 0.5 }); } }
    }
  },
  drawOn(p, ctx, t) {
    const hx = p.cx + p.facing * 8, hy = p.y + p.h * 0.45;
    const stick = (x, y, a, len) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); const g = ctx.createLinearGradient(-2.5, 0, 2.5, 0); g.addColorStop(0, '#5a2a14'); g.addColorStop(0.5, '#b8703a'); g.addColorStop(1, '#5a2a14'); ctx.fillStyle = g; rr(ctx, -2.5, -len / 2, 5, len, 2.2); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-2.5, -len / 2, 5, 2); ctx.fillRect(-2.5, len / 2 - 2, 5, 2); ctx.restore(); };
    if (p._whirl > 0) {
      const a = (0.42 - p._whirl) * 34 * p.facing, R = CHUCK_R * 0.62;
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.cx, hy, R + 6, a - 1.6 * p.facing, a, p.facing < 0); ctx.stroke(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(p.cx, hy, CHUCK_R - 4, 0, TAU); ctx.stroke(); ctx.restore();
      const ex = p.cx + Math.cos(a) * R, ey = hy + Math.sin(a) * R * 0.8;
      ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
      stick(hx, hy, a + Math.PI / 2, 16); stick(ex + Math.cos(a) * 8, ey + Math.sin(a) * 6, a + Math.PI / 2, 16);
    } else {
      // tucked in his belt
      stick(p.cx - p.facing * 7, p.y + p.h * 0.62, 0.35 * p.facing, 13); stick(p.cx - p.facing * 3, p.y + p.h * 0.66, -0.25 * p.facing, 13);
    }
  }
};

/* ---------------- entities ---------------- */
// a Shiba with a pair of nunchucks: hands them over whenever Brady has none
class JpShiba extends Ent {
  constructor(g, s) { super(g, s, 34, 30); this.cool = 0; this.wag = 0; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; this.wag += dt * (this.cool > 0 ? 18 : 7); const p = this.g.player; if (p) this.dir = p.cx < this.cx ? -1 : 1; }
  touchPlayer(p) {
    if (this.cool > 0 || p.dead || (p.sig && p.sig.id === 'nunchuck')) return;
    this.cool = 1.2; K.say(this.g, this, 'WAN! WAN!', '#ffd84a'); Sound.play('bump', { pitch: 1.9, vol: 0.4 }); TourKit.sfx('gift', 'appear');
    p.collect('sig:nunchuck');
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir || 1, t = this.t, has = this.g.player && this.g.player.sig && this.g.player.sig.id === 'nunchuck';
    K.shadow(ctx, x, y, 18);
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    // curly tail
    ctx.strokeStyle = '#d8843a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-13, -20, 5, Math.PI * 0.3 + Math.sin(this.wag) * 0.4, Math.PI * 1.8 + Math.sin(this.wag) * 0.4); ctx.stroke(); ctx.lineCap = 'butt';
    // sitting body
    ctx.fillStyle = '#d8843a'; ctx.beginPath(); ctx.ellipse(-4, -12, 12, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff4e4'; ctx.beginPath(); ctx.ellipse(3, -11, 6, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8843a'; rr(ctx, 0, -6, 6, 6, 2); ctx.fill(); rr(ctx, -12, -5, 8, 5, 2); ctx.fill(); ctx.fillStyle = '#fff4e4'; ctx.fillRect(1, -2, 5, 2);
    // head
    ctx.fillStyle = '#d8843a'; ctx.beginPath(); ctx.ellipse(6, -27, 10, 9, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1, -31); ctx.lineTo(1, -41); ctx.lineTo(6, -34); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -34); ctx.lineTo(12, -41); ctx.lineTo(14, -31); ctx.fill();
    ctx.fillStyle = '#fff4e4'; ctx.beginPath(); ctx.ellipse(10, -23, 7, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(3, -29, 2.4, 1.6, 0, 0, TAU); ctx.ellipse(11, -29, 2.4, 1.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(16, -24, 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(5, -28, 1.5, 0, TAU); ctx.arc(11, -28, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(13, -21, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
    if (this.cool > 0) { ctx.fillStyle = '#ff8aa0'; ctx.beginPath(); ctx.ellipse(13, -18, 2, 3, 0, 0, TAU); ctx.fill(); }
    // a red bandana
    ctx.fillStyle = '#e8384f'; ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(14, -18); ctx.lineTo(6, -13); ctx.closePath(); ctx.fill();
    ctx.restore();
    // the nunchucks it's offering, in its mouth
    if (!has) { ctx.save(); ctx.translate(x + d * 16, y - 20); ctx.rotate(Math.sin(t * 3) * 0.15); for (const dx of [-5, 5]) { ctx.fillStyle = '#a8603a'; rr(ctx, dx - 2, -1, 4, 13, 2); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(dx - 2, 10, 4, 2); } ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, -4, 5, 0); ctx.stroke(); ctx.restore(); }
  }
}
// bending bamboo: a tall culm with a leafy perch on top. Under Brady's weight it bows forward and down,
// carrying him along; jump while it's bent and it springs back, flinging him high
class JpPole extends Ent {
  constructor(g, s) {
    super(g, s, 52, 12); this.isPlatform = true; this.dir = s.dir || 1; this.rx = s.x; this.rootY = (s.root != null ? s.root : g.area.H) * TS;
    this.len = this.rootY - (s.y - TS); this.lean = s.lean || 0.55; this.bend = 0; this.bendV = 0; this.was = false; this.flung = false; this.dx = 0; this.dy = 0;
    this.place();
  }
  tip() { const th = this.bend * this.lean * this.dir; return { x: this.rx + Math.sin(th) * this.len, y: this.rootY - Math.cos(th) * this.len }; }
  place() { const q = this.tip(); this.x = q.x - this.w / 2; this.y = q.y; }
  update(dt) {
    this.t += dt; const p = this.g.player, on = !!(p && p.ride === this && !p.dead);
    if (on) { this.bend = Math.min(1, this.bend + dt * 0.8); this.bendV = 0; this.was = true; this.flung = false; if (this.bend < 1 && Math.random() < dt * 6) Sound.play('crumble', { pitch: 2.2, vol: 0.12 }); }
    else {
      if (this.was && p && p.vy < -3 * TS && this.bend > 0.2 && !this.flung) { p.vy -= this.bend * 5.5 * TS; p.vx += this.dir * this.bend * 0.6 * TS; p.airMax = Math.max(p.airMax || PHYS.walk, Math.abs(p.vx)); this.flung = true; Sound.play('spring', { pitch: 1.3, vol: 0.5 }); this.g.burst(this.cx, this.y, 8, '#9ad06a', 'spark'); }
      this.was = false;
      this.bendV += (-70 * this.bend - 6 * this.bendV) * dt; this.bend += this.bendV * dt;
      if (Math.abs(this.bend) < 0.003 && Math.abs(this.bendV) < 0.02) { this.bend = 0; this.bendV = 0; }
    }
    const ox = this.x, oy = this.y; this.place(); this.dx = this.x - ox; this.dy = this.y - oy;
  }
  draw(ctx) {
    const q = this.tip(), rx = this.rx, ry = this.rootY, th = this.bend * this.lean * this.dir;
    // the culm curves more near the top as it bows
    const cx = rx + Math.sin(th * 0.35) * this.len * 0.55, cy = ry - Math.cos(th * 0.35) * this.len * 0.55;
    ctx.strokeStyle = '#4e8a3a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(cx, cy, q.x, q.y + 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx - 2, ry); ctx.quadraticCurveTo(cx - 2, cy, q.x - 2, q.y + 6); ctx.stroke();
    ctx.fillStyle = '#2e5a24'; for (let k = 1; k < 12; k++) { const u = k / 12, x = (1 - u) * (1 - u) * rx + 2 * (1 - u) * u * cx + u * u * q.x, y = (1 - u) * (1 - u) * ry + 2 * (1 - u) * u * cy + u * u * (q.y + 6); if (y > ry - 4) continue; ctx.fillRect(x - 5, y - 1, 10, 2.2); }
    // the leafy perch
    const px = q.x, py = q.y;
    ctx.fillStyle = '#3e7a30'; for (const [dx, a] of [[-18, -0.5], [18, 0.5], [-10, -1.1], [10, 1.1]]) { ctx.save(); ctx.translate(px + dx * 0.5, py + 2); ctx.rotate(a + th); ctx.beginPath(); ctx.ellipse(dx * 0.6, 0, 14, 3.4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#7ab84a'; rr(ctx, px - 26, py, 52, 8, 4); ctx.fill(); ctx.fillStyle = '#a8d870'; ctx.fillRect(px - 24, py, 48, 2);
    ctx.strokeStyle = '#4e8a3a'; ctx.lineWidth = 1; for (let k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(px + k, py + 1); ctx.lineTo(px + k + 3, py + 7); ctx.stroke(); }
  }
}
// a bamboo shoot that bursts up out of the ground (spiky while it's up); the nunchucks snap it off
class JpShoot extends Ent {
  constructor(g, s) { super(g, s, 22, 30); this.x = s.x - 11; this.gy = s.y; this.y = s.y - 30; this.k = 1 + ((s.x / 32) % 3) * 0.7; this.state = 'down'; this.up = 0; this.snapT = 0; }
  update(dt) {
    this.t += dt; this.k -= dt;
    if (this.snapT > 0) { this.snapT -= dt; this.up = Math.max(0, this.up - dt * 4); if (this.snapT <= 0) { this.state = 'down'; this.k = 2; } return; }
    if (this.state === 'down') { this.up = Math.max(0, this.up - dt * 5); if (this.k <= 0) { this.state = 'warn'; this.k = 0.6; } }
    else if (this.state === 'warn') { if (Math.random() < 0.4) this.g.burst(this.cx + (Math.random() - 0.5) * 16, this.gy - 2, 1, '#8a6a40', 'dust'); if (this.k <= 0) { this.state = 'up'; this.k = 1.5; Sound.play('crumble', { pitch: 1.6, vol: 0.3 }); } }
    else { this.up = Math.min(1, this.up + dt * 9); if (this.k <= 0) { this.state = 'down'; this.k = 2.2; } }
  }
  touchPlayer(p) { if (this.up > 0.5 && this.snapT <= 0 && p.y + p.h > this.gy - this.up * 30 + 4) p.hurt(this); }
  whack(p) { if (this.up < 0.3 || this.snapT > 0) return; this.snapT = 3.5; this.g.burst(this.cx, this.gy - 20, 10, '#c8a05a', 'spark'); Sound.play('break', { pitch: 1.4, vol: 0.5 }); this.g.addScore(100, this.cx, this.gy - 30); }
  draw(ctx) {
    const x = this.cx, y = this.gy, h = this.up * 30;
    if (this.state === 'warn') { ctx.fillStyle = 'rgba(90,60,30,0.6)'; ctx.beginPath(); ctx.ellipse(x + Math.sin(this.t * 40) * 1.5, y - 1, 9, 3, 0, 0, TAU); ctx.fill(); }
    if (h < 1) return;
    ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x - 7, y - h * 0.6, x, y - h); ctx.quadraticCurveTo(x + 7, y - h * 0.6, x + 9, y); ctx.fill();
    ctx.fillStyle = '#8a6a30'; for (let k = 1; k < 4; k++) { const yy = y - k * h / 4; ctx.beginPath(); ctx.moveTo(x - 8 + k * 1.6, yy + 3); ctx.lineTo(x + 3 - k, yy - 2); ctx.lineTo(x - 2, yy + 4); ctx.fill(); }
    ctx.fillStyle = '#6a9a3a'; ctx.beginPath(); ctx.moveTo(x - 2, y - h + 3); ctx.lineTo(x, y - h - 4); ctx.lineTo(x + 2, y - h + 3); ctx.fill();
  }
}
// overhead obstacles on the bullet train's route: signal gantries outside, low lamps in the tunnels. Duck!
class JpLowBar extends Ent {
  constructor(g, s) { super(g, s, s.look === 'lamp' ? 26 : 22, 20); this.look = s.look || 'gantry'; this.deck = s.deck * TS; this.x = s.x - this.w / 2; this.y = this.deck - 54; this.told = false; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && !this.told && this.x - p.cx < 9 * TS && this.x > p.cx) { this.told = true; if (!this.g._jpDuckTold) { this.g._jpDuckTold = true; this.g.toast('DUCK! HOLD DOWN'); } } }
  touchPlayer(p) { if (p.y < this.y + this.h - 2) { p.hurt(this); if (!p.dead) { p.vx = -3 * TS; } } }
  draw(ctx) {
    const x = this.cx, y = this.y, p = this.g.player, near = p && this.x - p.cx < 7 * TS && this.x > p.cx - 20;
    if (this.look === 'gantry') {
      ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 4, y - 200, 8, 200 - 2); ctx.fillStyle = '#4a4a58'; ctx.fillRect(x - 40, y - 4, 80, 6);
      ctx.fillStyle = '#3a3a44'; rr(ctx, x - 11, y, 22, 18, 3); ctx.fill();
      ctx.fillStyle = Math.sin(this.t * 6) > 0 ? '#ff3a2a' : '#4a1a1a'; ctx.beginPath(); ctx.arc(x - 5, y + 9, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2aff6a'; ctx.beginPath(); ctx.arc(x + 5, y + 9, 3.5, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.moveTo(x - 13, y + 12); ctx.lineTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 13, y + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(x, y + 13, 11, 5, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createRadialGradient(x, y + 14, 2, x, y + 40, 70); lg.addColorStop(0, 'rgba(255,240,190,0.55)'); lg.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 10, y + 14); ctx.lineTo(x + 10, y + 14); ctx.lineTo(x + 60, y + 110); ctx.lineTo(x - 60, y + 110); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (near) { const a = 0.6 + 0.4 * Math.sin(this.t * 10); ctx.fillStyle = `rgba(255,216,74,${a})`; ctx.beginPath(); ctx.moveTo(x - 8, y + 26); ctx.lineTo(x + 8, y + 26); ctx.lineTo(x, y + 36); ctx.closePath(); ctx.fill(); }
  }
  get light() { return this.look === 'lamp' ? { r: 90, c: 'rgba(255,240,190,', x: this.cx, y: this.y + 14 } : null; }
}
// a tunnel turns the lights down while Brady is inside it
class JpTunnel extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.x0 = s.x0 * TS; this.x1 = s.x1 * TS; this.on = false; this.x = this.x0 - 24; this.w = this.x1 - this.x0 + 48; this.y = 0; this.h = s.deck * TS; }
  update(dt) { const p = this.g.player, inside = !!(p && p.cx > this.x0 && p.cx < this.x1); if (inside !== this.on) { this.on = inside; if (inside) Sound.play('wind', { vol: 0.35, pitch: 0.7 }); } }
  draw(ctx) {
    // the tunnel mouths: concrete portals at both ends
    const deckY = this.s.deck * TS;
    for (const [px, d] of [[this.x0, -1], [this.x1, 1]]) { ctx.fillStyle = '#8a8a90'; ctx.fillRect(px + (d < 0 ? -20 : 0), 0, 20, deckY - 2 * TS); ctx.fillStyle = '#6a6a70'; ctx.fillRect(px + (d < 0 ? -20 : 0), deckY - 2 * TS - 8, 20, 8); }
  }
}
// sushi plates on a big vertical conveyor loop: ride them up and over
class JpPlateLoop extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true;
    this.X0 = s.x0 * TS + TS; this.X1 = s.x1 * TS; this.Y0 = s.y0 * TS; this.Y1 = s.y1 * TS; this.v = (s.speed || 1.6) * TS;
    this.P = 2 * ((this.X1 - this.X0) + (this.Y1 - this.Y0)); this.s0 = 0; this.plates = [];
    this.x = this.X0 - 40; this.w = this.X1 - this.X0 + 80; this.y = this.Y0 - 20; this.h = this.Y1 - this.Y0 + 40;
    // (spawned while the area loads, so the plates go straight into the area's entity list)
    const n = s.n || 6, list = (g.area && g.area.entities) || g.entities; for (let i = 0; i < n; i++) { const pl = new JpPlate(g, this, i * this.P / n, i); this.plates.push(pl); list.push(pl); }
  }
  at(s) {
    const w = this.X1 - this.X0, h = this.Y1 - this.Y0; s = ((s % this.P) + this.P) % this.P;
    if (s < w) return [this.X0 + s, this.Y1];                  // along the bottom, to the right
    s -= w; if (s < h) return [this.X1, this.Y1 - s];          // up the right side
    s -= h; if (s < w) return [this.X1 - s, this.Y0];          // along the top, to the left
    s -= w; return [this.X0, this.Y0 + s];                     // down the left side
  }
  update(dt) { this.t += dt; this.s0 += this.v * dt; }
  draw(ctx) {
    ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; rr(ctx, this.X0 - 2, this.Y0 + 10, this.X1 - this.X0 + 4, this.Y1 - this.Y0, 18); ctx.stroke();
    ctx.strokeStyle = '#c8c8d4'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineJoin = 'miter';
    ctx.fillStyle = '#5a5a68'; for (const [x, y] of [[this.X0, this.Y0 + 10], [this.X1, this.Y0 + 10], [this.X0, this.Y1 + 10], [this.X1, this.Y1 + 10]]) { ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a5a68'; }
  }
}
class JpPlate extends Ent {
  constructor(g, loop, off, i) { super(g, null, 60, 10); this.loop = loop; this.off = off; this.i = i; this.isPlatform = true; this.dx = 0; this.dy = 0; const [x, y] = loop.at(off); this.x = x - 30; this.y = y; }
  update(dt) { const ox = this.x, oy = this.y, [x, y] = this.loop.at(this.loop.s0 + this.off); this.x = x - 30; this.y = y; this.dx = this.x - ox; this.dy = this.y - oy; if (Math.abs(this.dx) > 40 || Math.abs(this.dy) > 40) { this.dx = 0; this.dy = 0; } }
  draw(ctx) {
    const x = this.cx, y = this.y, c = ['#e8e8f0', '#ffd23a', '#e8384f', '#3a6ad8', '#2aa86a', '#ff8a2a'][this.i % 6];
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 10, 28, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(c, -0.25); ctx.beginPath(); ctx.ellipse(x, y + 5, 30, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y + 3, 30, 5.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - 8, y + 2, 14, 2, 0, 0, TAU); ctx.fill();
    // a little piece of sushi riding at the back of the plate
    const sx = x + 18, k = this.i % 3; ctx.fillStyle = '#ffffff'; rr(ctx, sx - 6, y - 4, 12, 6, 3); ctx.fill(); ctx.fillStyle = k === 0 ? '#ff7a4a' : k === 1 ? '#ffd23a' : '#e8384f'; rr(ctx, sx - 7, y - 7, 14, 4, 2); ctx.fill();
  }
}
// giant chopsticks reach down for a bite: their shadow grows first. Swat them with the nunchucks and they back off
class JpChopsticks extends Ent {
  constructor(g, s) { super(g, s, 40, 40); this.fx = s.x; this.floorY = s.y; this.topY = (s.top != null ? s.top : 0) * TS - 40; this.state = 'up'; this.k = s.delay || 1.5; this.drop = 0; this.open = 1; this.knock = 0; this.x = s.x - 20; this.y = this.topY; this.every = s.every || 3; }
  update(dt) {
    this.t += dt; this.k -= dt;
    if (this.knock > 0) { this.knock -= dt; this.drop = Math.max(0, this.drop - dt * 3); if (this.knock <= 0) { this.state = 'up'; this.k = this.every; } }
    else if (this.state === 'up') { this.drop = Math.max(0, this.drop - dt * 2); this.open = 1; if (this.k <= 0 && this.g.onScreen(this, 2 * TS)) { this.state = 'aim'; this.k = 0.9; Sound.play('select2', { pitch: 2, vol: 0.25 }); } }
    else if (this.state === 'aim') { this.open = 0.8 + 0.2 * Math.sin(this.t * 30); if (Math.floor(this.k * 6) !== Math.floor((this.k + dt) * 6)) Sound.play('bump', { pitch: 2.6, vol: 0.2 }); if (this.k <= 0) { this.state = 'dive'; this.k = 0.22; } }
    else if (this.state === 'dive') { this.drop = Math.min(1, this.drop + dt / 0.22); if (this.k <= 0) { this.state = 'pinch'; this.k = 0.5; Sound.play('kick', { pitch: 1.8, vol: 0.5 }); } }
    else if (this.state === 'pinch') { this.open = Math.max(0, this.open - dt * 6); if (this.k <= 0) { this.state = 'up'; this.k = this.every; } }
    const tipY = this.topY + 40 + this.drop * (this.floorY - this.topY - 40);
    this.y = tipY - 40; this.h = 40;
  }
  touchPlayer(p) { if (this.knock <= 0 && (this.state === 'dive' || this.state === 'pinch') && this.drop > 0.6) p.hurt(this); }
  whack(p) { if (this.drop < 0.15 || this.knock > 0) return; this.knock = 2.4; this.g.burst(this.cx, this.y + 30, 10, '#ffe8a0', 'spark'); Sound.play('kick', { pitch: 1.1, vol: 0.6 }); K.say(this.g, this, 'OUCH!', '#ffd84a'); this.g.addScore(200, this.cx, this.y); }
  draw(ctx) {
    const x = this.fx, tipY = this.y + 40, o = this.open * 10;
    // shadow on the floor grows as they aim
    const sh = this.state === 'aim' ? 0.5 + 0.5 * (1 - this.k / 0.9) : this.drop;
    if (sh > 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.25 * sh})`; ctx.beginPath(); ctx.ellipse(x, this.floorY - 2, 10 + 16 * sh, 4, 0, 0, TAU); ctx.fill(); }
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(x + d * o, tipY); ctx.rotate(d * (0.12 + this.open * 0.1));
      const g = ctx.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, '#6a1a1a'); g.addColorStop(0.5, '#c8322a'); g.addColorStop(1, '#6a1a1a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-1.6, 0); ctx.lineTo(1.6, 0); ctx.lineTo(4.5, -260); ctx.lineTo(-4.5, -260); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(-1.6, -14, 3.2, 12); ctx.fillStyle = '#1a1a20'; ctx.fillRect(-4.2, -240, 8.4, 30);
      ctx.restore();
    }
  }
}
// a giant cup of green tea: its steam lifts Brady (the lift is a zone placed with it)
class JpSteam extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, 10); this.x = s.x - TS / 2; this.base = s.y; this.top = (s.top || 6) * TS; this.y = s.y - this.top; this.h = this.top; this.puffs = []; this.friendly = true; }
  update(dt) {
    this.t += dt; if (!this.g.onScreen(this, 300)) return;
    if (Math.random() < dt * 16) this.puffs.push({ x: this.x + 10 + Math.random() * (this.w - 20), y: this.base, vy: -(3 + Math.random() * 3) * TS, life: 0, max: this.top / (4.5 * TS) });
    for (const q of this.puffs) { q.y += q.vy * dt; q.life += dt; q.x += Math.sin(q.life * 5 + q.y * 0.02) * 0.5; }
    this.puffs = this.puffs.filter(q => q.life < q.max);
  }
  draw(ctx) { for (const q of this.puffs) { const k = q.life / q.max; ctx.fillStyle = `rgba(255,255,255,${0.32 * (1 - k)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 8 + k * 16, 0, TAU); ctx.fill(); } }
}
// a pitching machine: it fires baseballs at chest height. Knock them back into the target!
class JpPitcher extends Ent {
  constructor(g, s) { super(g, s, 40, 46); this.dirP = s.dir || -1; this.every = s.every || 1.7; this.k = 1; this.recoil = 0; this.gy = s.y; this.cage = s.id; this.done = false; }
  update(dt) {
    this.t += dt; this.recoil = Math.max(0, this.recoil - dt * 4);
    // once its target's been hit, the machine powers down
    if (!this.done && this.cage != null && this.g.entities.some(e => e.target && e.id === this.cage && e.lit)) { this.done = true; Sound.play('powerdown', { vol: 0.3 }); }
    const p = this.g.player; if (this.done || !p || Math.abs(p.cx - this.cx) > 13 * TS || Math.abs(p.cy - this.cy) > 4 * TS) return;
    this.k -= dt;
    if (this.k <= 0) { this.k = this.every; this.recoil = 1; Sound.play('kick', { pitch: 0.9, vol: 0.5 }); tourFire(this.g, this.cx + this.dirP * 22, this.gy - 24, { kind: 'ball', vx: this.dirP * 7.5 * TS, w: 14, h: 14, life: 3, thru: true, col: '#ffffff', art: ballArt }); }
  }
  draw(ctx) {
    const x = this.cx, y = this.gy, d = this.dirP, r = this.recoil;
    ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 3, y - 18, 6, 18); ctx.fillRect(x - 14, y - 4, 28, 4);
    ctx.save(); ctx.translate(x - d * r * 3, y - 28);
    ctx.fillStyle = '#e8e8f0'; rr(ctx, -16, -12, 32, 22, 5); ctx.fill(); ctx.fillStyle = '#e8384f'; ctx.fillRect(-16, -2, 32, 3);
    for (const dy of [-7, 5]) { ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(d * 6, dy, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 1; ctx.save(); ctx.translate(d * 6, dy); ctx.rotate(this.t * 20); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(d > 0 ? 14 : -22, -4, 8, 8);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-d * 6, -14, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-d * 12, -15, 4, 0, TAU); ctx.fill();
    ctx.restore();
    if (this.k < 0.35 && !this.done) { ctx.fillStyle = `rgba(255,80,80,${0.6 + 0.4 * Math.sin(this.t * 30)})`; ctx.beginPath(); ctx.arc(x - d * 14, y - 44, 3, 0, TAU); ctx.fill(); }
    if (this.done) { ctx.fillStyle = '#2aff6a'; ctx.beginPath(); ctx.arc(x - d * 14, y - 44, 3, 0, TAU); ctx.fill(); }
  }
}
// a home-run target board: a knocked-back ball that hits it opens the linked shutters
class JpTarget extends Ent {
  constructor(g, s) { super(g, s, 40, 40); this.target = true; this.lit = false; this.id = s.id; this.x = s.x - 20; this.y = s.y - 40; this.flash = 0; }
  update(dt) { this.t += dt; if (this.flash > 0) this.flash -= dt; }
  ding() {
    if (this.lit) return; this.lit = true; this.flash = 1;
    const g = this.g; g.toast('HOME RUN! THE SHUTTER OPENS'); Sound.play('secret'); TourKit.sfx('crowd_cheer', null, { vol: 0.4 }); g.addScore(500, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#ffd23a', 'confetti');
    for (const e of g.entities) if (e.shutter === this.id) e.openUp();
  }
  draw(ctx) {
    const x = this.cx, y = this.cy, f = this.lit ? 1 : 0;
    ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 2, y + 18, 4, 30);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : (f ? '#ffd23a' : '#e8384f'); ctx.beginPath(); ctx.arc(x, y, 20 - k * 5, 0, TAU); ctx.fill(); }
    if (!this.lit) { ctx.strokeStyle = `rgba(255,240,150,${0.4 + 0.4 * Math.sin(this.t * 4)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 24, 0, TAU); ctx.stroke(); }
    if (this.flash > 0) { ctx.strokeStyle = `rgba(255,255,200,${this.flash})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24 + (1 - this.flash) * 30, 0, TAU); ctx.stroke(); }
  }
  get light() { return { r: 60, c: this.lit ? 'rgba(255,220,80,' : 'rgba(255,90,90,', x: this.cx, y: this.cy }; }
}
// a roll-up shutter (its tiles are put in place at runtime, so it only opens for a home run)
class JpShutter extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 4) * TS); this.shutter = s.id; this.open = 0; this.opening = false; this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor((s.y - 1) / TS); this.ty0 = this.ty1 - (s.h || 4) + 1;
    this.x = this.tx * TS; this.y = this.ty0 * TS;
    const A = g.area; for (let y = this.ty0; y <= this.ty1; y++) { A.tiles[y * A.W + this.tx] = T.HARD; A.hide[y * A.W + this.tx] = 1; }
  }
  openUp() { if (this.opening) return; this.opening = true; const A = this.g.area; for (let y = this.ty0; y <= this.ty1; y++) { A.tiles[y * A.W + this.tx] = T.EMPTY; A.hide[y * A.W + this.tx] = 0; } this.g.shake(4); Sound.play('crumble', { pitch: 0.7, vol: 0.5 }); }
  update(dt) { this.t += dt; if (this.opening) this.open = Math.min(1, this.open + dt * 1.2); }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h * (1 - this.open);
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 3, y - 10, w + 6, 10);
    if (h < 2) return;
    ctx.fillStyle = '#8a8a98'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let yy = y + 5; yy < y + h; yy += 7) ctx.fillRect(x, yy, w, 2);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, y + h - 6, w, 4); ctx.fillStyle = '#1a1a24'; for (let k = 0; k < w; k += 8) ctx.fillRect(x + k, y + h - 6, 4, 4);
  }
}
// the crane-game claw: it waits low at one side, carries whoever climbs in across the gap and drops them at the chute
class JpClaw extends Ent {
  constructor(g, s) {
    super(g, s, 50, 10); this.isPlatform = true; this.xa = s.xa * TS + TS / 2; this.xb = s.xb * TS + TS / 2; this.rail = (s.rail || 3) * TS; this.lowA = s.y - TS - 6; this.lowB = (s.yb != null ? s.yb : s.y / TS) * TS - TS - 6;
    this.cx0 = this.xa; this.cy0 = this.lowA; this.state = 'waitA'; this.k = 0; this.open = 0; this.dx = 0; this.dy = 0; this.place();
  }
  place() { this.x = this.cx0 - this.w / 2; this.y = this.cy0; }
  update(dt) {
    this.t += dt; const p = this.g.player, on = !!(p && p.ride === this), ox = this.x, oy = this.y, sp = 3.4 * TS;
    if (this.state === 'waitA') { this.open = Math.max(0, this.open - dt * 3); if (on) { this.k += dt; if (this.k > 0.35) { this.state = 'up'; Sound.play('select2', { pitch: 1.4, vol: 0.35 }); } } else this.k = 0; }
    else if (this.state === 'up') { this.cy0 = approach(this.cy0, this.rail, sp * dt); if (this.cy0 === this.rail) this.state = 'over'; }
    else if (this.state === 'over') { this.cx0 = approach(this.cx0, this.xb, sp * dt); if (this.cx0 === this.xb) this.state = 'down'; }
    else if (this.state === 'down') { this.cy0 = approach(this.cy0, this.lowB, sp * dt); if (this.cy0 === this.lowB) { this.state = 'drop'; this.k = 0.9; Sound.play('pick', { pitch: 0.8, vol: 0.4 }); } }
    else if (this.state === 'drop') { this.open = Math.min(1, this.open + dt * 4); this.k -= dt; if (this.k <= 0) this.state = 'up2'; }
    else if (this.state === 'up2') { this.open = Math.max(0, this.open - dt * 3); this.cy0 = approach(this.cy0, this.rail, sp * dt); if (this.cy0 === this.rail) this.state = 'back'; }
    else if (this.state === 'back') { this.cx0 = approach(this.cx0, this.xa, sp * 1.4 * dt); if (this.cx0 === this.xa) this.state = 'down2'; }
    else if (this.state === 'down2') { this.cy0 = approach(this.cy0, this.lowA, sp * dt); if (this.cy0 === this.lowA) { this.state = 'waitA'; this.k = 0; } }
    this.dead = this.open > 0.3;
    if (this.dead && p && p.ride === this) p.ride = null;
    this.place(); this.dx = this.x - ox; this.dy = this.y - oy;
  }
  draw(ctx) {
    const x = this.cx, y = this.y, o = this.open;
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(Math.min(this.xa, this.xb) - 40, this.rail - 60, Math.abs(this.xb - this.xa) + 80, 8);
    ctx.fillStyle = '#ff3a8a'; ctx.fillRect(Math.min(this.xa, this.xb) - 40, this.rail - 53, Math.abs(this.xb - this.xa) + 80, 2);
    ctx.fillStyle = '#3a3a48'; rr(ctx, x - 12, this.rail - 60, 24, 14, 3); ctx.fill();
    ctx.strokeStyle = '#c8c8d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, this.rail - 46); ctx.lineTo(x, y - 18); ctx.stroke();
    ctx.fillStyle = '#d8d8e4'; rr(ctx, x - 10, y - 22, 20, 10, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x, y - 17, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c8c8d4'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 8, y - 14); ctx.quadraticCurveTo(x + d * (26 + o * 10), y - 8, x + d * (18 + o * 14), y + 8 - o * 4); ctx.stroke(); }
    ctx.lineCap = 'butt';
    if (!this.dead) { ctx.fillStyle = 'rgba(200,200,220,0.5)'; rr(ctx, this.x, y, this.w, 6, 3); ctx.fill(); }
    const p = this.g.player; if (this.state === 'waitA' && p && Math.abs(p.cx - x) < 6 * TS && p.ride !== this) { ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 8)})`; ctx.beginPath(); ctx.moveTo(x - 7, y - 40); ctx.lineTo(x + 7, y - 40); ctx.lineTo(x, y - 30); ctx.closePath(); ctx.fill(); }
  }
  get light() { return { r: 50, c: 'rgba(255,90,170,', x: this.cx, y: this.rail - 50 }; }
}
// nightingale floor: the boards chirp under Brady's feet, and every chirp wakes a sliding panel that bowls a spinning top
class JpNightingale extends Ent {
  constructor(g, s) { super(g, s, s.n * TS + 2 * TS, 72); this.x = s.x0 * TS - TS; this.gy = s.y; this.y = s.y - 72; this.friendly = true; this.fx = s.x0 * TS; this.fw = s.n * TS; this.chirpT = 0; this.cool = 0.6; this.panels = [{ x: this.fx - TS * 0.6, d: 1, o: 0 }, { x: this.fx + this.fw + TS * 0.6, d: -1, o: 0 }]; this.queue = 0; this.told = false; }
  update(dt) {
    this.t += dt; const p = this.g.player, g = this.g;
    if (this.chirpT > 0) this.chirpT -= dt; if (this.cool > 0) this.cool -= dt;
    for (const q of this.panels) q.o = Math.max(0, q.o - dt * 1.5);
    const on = p && !p.dead && p.onGround && !p.ride && p.cx > this.fx && p.cx < this.fx + this.fw && Math.abs(p.y + p.h - this.gy) < 4;
    if (on && (Math.abs(p.vx) > 40 || !this.wasOn) && this.chirpT <= 0) {
      this.chirpT = 0.3; Sound.play('select2', { pitch: 2.8, vol: 0.3 }); Sound.play('pick', { pitch: 2.4, vol: 0.2 }); g.parts.text(p.cx, p.y - 6, '♪', '#ffffff');
      this.queue = Math.min(2, this.queue + 1);
      if (!this.told) { this.told = true; g.toast('NIGHTINGALE FLOOR! IT CHIRPS WHEN YOU STEP ON IT'); }
    }
    this.wasOn = on;
    if (this.queue > 0 && this.cool <= 0 && p) {
      // the panel behind Brady opens and bowls a spinning top at him
      const q = p.cx - this.panels[0].x < this.panels[1].x - p.cx ? this.panels[0] : this.panels[1];
      q.o = 1; this.queue--; this.cool = 1.1; Sound.play('door', { pitch: 1.4, vol: 0.4 });
      tourFire(g, q.x + q.d * 16, this.gy - 12, { kind: 'top', vx: q.d * 5 * TS, w: 24, h: 24, ground: true, life: 4, stompable: true, col: '#e8384f', art: shotTopArt });
    }
  }
  draw(ctx) {
    // the polished boards (they wobble a little when they sing)
    const pcx = this.g.player ? this.g.player.cx : -999;
    for (let k = 0; k < this.fw / 16; k++) { const x = this.fx + k * 16, lift = this.chirpT > 0.15 && Math.abs(x + 8 - pcx) < 24 ? 1.5 : 0; ctx.fillStyle = k % 2 ? '#8a5a34' : '#9e6c40'; ctx.fillRect(x, this.gy - 8 - lift, 15.5, 8); ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.fillRect(x, this.gy - 8 - lift, 15.5, 1.5); ctx.fillStyle = 'rgba(40,20,10,0.5)'; ctx.fillRect(x + 15, this.gy - 8 - lift, 1, 8); }
    ctx.fillStyle = '#4a2e1c'; ctx.fillRect(this.fx - 2, this.gy - 1, this.fw + 4, 2);
    // the sliding panels at each end of the corridor
    for (const q of this.panels) { const x = q.x - 16, y = this.gy - 64; ctx.fillStyle = '#3a2418'; ctx.fillRect(x - 3, y - 4, 38, 68); ctx.fillStyle = '#2a1810'; ctx.fillRect(x, y, 32, 64); const sl = q.o * 28; ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + (q.d > 0 ? sl : 0), y, 32 - sl, 64); ctx.strokeStyle = '#6a4a30'; ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + (q.d > 0 ? sl : 0), y + k * 16); ctx.lineTo(x + 32 - (q.d > 0 ? 0 : sl), y + k * 16); ctx.stroke(); } }
  }
}
// a revolving wall panel: push against it and it spins round, carrying Brady through to the other side
class JpRevolve extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 3) * TS); this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor((s.y - 1) / TS); this.ty0 = this.ty1 - (s.h || 3) + 1; this.x = this.tx * TS; this.y = this.ty0 * TS;
    this.push = 0; this.spin = 0; this.from = 1; this.friendly = true;
    this.setTiles(T.HARD);
  }
  setTiles(t) { const A = this.g.area; for (let y = this.ty0; y <= this.ty1; y++) { A.tiles[y * A.W + this.tx] = t; A.hide[y * A.W + this.tx] = t === T.EMPTY ? 0 : 1; } }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.spin > 0) {
      this.spin -= dt;
      if (p && this.carry) { const k = 1 - this.spin / 0.5; p.vx = 0; p.vy = 0; p.x = this.cx - p.w / 2 + this.from * Math.cos(k * Math.PI) * (TS * 0.5 + p.w / 2 + 2); }
      if (this.spin <= 0 && this.carry) { this.carry = false; if (p) { p.x = this.from > 0 ? this.x - p.w - 1 : this.x + this.w + 1; p.facing = -this.from; } this.setTiles(T.HARD); }
      return;
    }
    if (!p || p.dead) return;
    const side = p.cx < this.cx ? -1 : 1, touching = Math.abs(p.y + p.h - (this.y + this.h)) < 6 && (side < 0 ? Math.abs(p.x + p.w - this.x) < 3 : Math.abs(p.x - (this.x + this.w)) < 3);
    const inp = this.g.input ? this.g.input() : Input, pushing = touching && ((side < 0 && inp.right) || (side > 0 && inp.left));
    this.push = pushing ? this.push + dt : Math.max(0, this.push - dt * 2);
    if (this.push > 0.25) { this.push = 0; this.spin = 0.5; this.from = side; this.carry = true; this.setTiles(T.EMPTY); Sound.play('door', { pitch: 1.2, vol: 0.5 }); this.g.burst(this.cx, this.cy, 8, '#e8d8b0', 'dust'); if (!this.g._jpSpinTold) { this.g._jpSpinTold = true; this.g.toast('A SECRET REVOLVING WALL!'); } }
  }
  draw(ctx) {
    const sx = this.spin > 0 ? Math.cos((1 - this.spin / 0.5) * Math.PI) : 1, x = this.cx, w = this.w * Math.max(0.08, Math.abs(sx));
    ctx.fillStyle = '#2a1810'; ctx.fillRect(this.x - 4, this.y - 6, this.w + 8, 6); ctx.fillRect(this.x - 4, this.y + this.h, this.w + 8, 4);
    ctx.fillStyle = sx > 0 ? '#f4f0e8' : '#e8dcc0'; ctx.fillRect(x - w / 2, this.y, w, this.h);
    ctx.strokeStyle = '#8a7a64'; ctx.lineWidth = 1; for (let k = 1; k < this.h / TS; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2, this.y + k * TS); ctx.lineTo(x + w / 2, this.y + k * TS); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x - w / 2, this.y, w * 0.2, this.h);
    if (this.push > 0) { ctx.fillStyle = `rgba(255,216,74,${this.push * 3})`; ctx.fillRect(x - w / 2, this.y, w, 3); }
  }
}
// the inside of a tunnel: a dark lined back wall with a strip of little lights
decor.jpTunnelBack = (ctx, x, y, t, th, d) => {
  const x0 = x - d.w / 2, top = y - d.h;
  const g = ctx.createLinearGradient(0, top, 0, y); g.addColorStop(0, '#2a2a34'); g.addColorStop(1, '#14141c');
  ctx.fillStyle = g; ctx.fillRect(x0, top, d.w, d.h);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < d.w; k += 48) ctx.fillRect(x0 + k, top, 2, d.h);
  for (let k = 12; k < d.w; k += 40) { ctx.fillStyle = '#ffd890'; ctx.fillRect(x0 + k, top + 20, 8, 3); }
};
// a big drinks machine you can climb (a 'body' prop)
decor.jpVendBox = (ctx, x, y, t, th, d) => {
  const x0 = x - d.w / 2, top = y - d.h, w = d.w, h = d.h, c = ['#e8384f', '#3a6ad8', '#f4f4f8', '#2aa86a'][d.seed % 4];
  ctx.fillStyle = c; rr(ctx, x0 + 2, top, w - 4, h, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + 4, top + 2, 3, h - 4);
  const gx = x0 + 8, gw = w - 16, gh = Math.min(h * 0.55, h - 26);
  ctx.fillStyle = '#d8f4ff'; ctx.fillRect(gx, top + 6, gw, gh);
  const rows = Math.max(2, Math.floor(gh / 12)); for (let r = 0; r < rows; r++) for (let k = 0; k < Math.floor(gw / 9); k++) { ctx.fillStyle = NEON[(r * 5 + k + d.seed) % NEON.length]; rr(ctx, gx + 2 + k * 9, top + 9 + r * 12, 6, 9, 2); ctx.fill(); }
  ctx.fillStyle = '#1a1a24'; ctx.fillRect(gx, top + h - 18, gw, 9); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0 + w - 16, top + gh + 10, 5, 7);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,230,255,0.12)'; ctx.fillRect(gx - 4, top + 2, gw + 8, gh + 8); ctx.restore();
};
decorLights.jpVendBox = [90, '#bff0ff', -40];
// the batting cage's roof: a steel frame with green netting hanging off it
decor.jpCageRoof = (ctx, x, y, t, th, d) => {
  const x0 = x - d.w / 2, top = y - d.h, w = d.w;
  ctx.fillStyle = '#3a3a48'; ctx.fillRect(x0, top, w, 10); ctx.fillRect(x0, y - 8, w, 8);
  ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 3; for (let k = 0; k < w; k += 32) { ctx.beginPath(); ctx.moveTo(x0 + k, top + 10); ctx.lineTo(x0 + k + 16, y - 8); ctx.lineTo(x0 + k + 32, top + 10); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,58,138,0.8)'; ctx.fillRect(x0, y - 2, w, 2);
  ctx.strokeStyle = 'rgba(90,255,154,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < w; k += 10) { ctx.beginPath(); ctx.moveTo(x0 + k, y); ctx.lineTo(x0 + k + 14, y + 26 + Math.sin(k * 0.3) * 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + k + 14, y); ctx.lineTo(x0 + k, y + 26 + Math.cos(k * 0.3) * 4); ctx.stroke(); }
  for (let k = 40; k < w - 20; k += 120) { ctx.fillStyle = '#fffbe0'; ctx.fillRect(x0 + k, y - 1, 26, 5); }
};
decorLights.jpCageRoof = [110, '#fff4d0', 6];
const entities = { jpShiba: JpShiba, jpPole: JpPole, jpShoot: JpShoot, jpLowBar: JpLowBar, jpTunnel: JpTunnel, jpPlateLoop: JpPlateLoop, jpChopsticks: JpChopsticks, jpSteam: JpSteam, jpPitcher: JpPitcher, jpTarget: JpTarget, jpShutter: JpShutter, jpClaw: JpClaw, jpNightingale: JpNightingale, jpRevolve: JpRevolve };

/* ---------------- the bullet train (the carrier's skin) ---------------- */
// white with a sakura-pink stripe and a long nose, riding an elevated viaduct; Brady rides on the roof
PlatformArt.jpBullet = function (ctx, p, t) {
  const x = p.x, y = p.y, w = p.w, vy = y + 94;
  // the viaduct (fixed to the world, so it slides past)
  ctx.fillStyle = '#b8b8c0'; ctx.fillRect(x - 900, vy, w + 1800, 14); ctx.fillStyle = '#d8d8e0'; ctx.fillRect(x - 900, vy, w + 1800, 3);
  for (let px = Math.floor((x - 900) / 192) * 192; px < x + w + 900; px += 192) { ctx.fillStyle = '#a0a0a8'; ctx.fillRect(px, vy + 14, 26, 400); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 18, vy + 14, 8, 400); }
  ctx.fillStyle = '#5a5a64'; ctx.fillRect(x - 900, vy - 4, w + 1800, 3); for (let px = Math.floor((x - 900) / 24) * 24; px < x + w + 900; px += 24) ctx.fillRect(px, vy - 2, 12, 3);
  // cars
  const body = (x0, x1, nose) => {
    const g = ctx.createLinearGradient(0, y, 0, y + 84); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#eef2f6'); g.addColorStop(1, '#c8ccd4');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y + 4); ctx.lineTo(x1, y + 4);
    if (nose) { ctx.bezierCurveTo(x1 + 40, y + 6, x1 + 96, y + 40, x1 + 104, y + 66); ctx.lineTo(x1 + 100, y + 84); }
    else { ctx.lineTo(x1, y + 84); }
    ctx.lineTo(x0, y + 84); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#26408a'; ctx.fillRect(x0 + 6, y + 22, x1 - x0 - 12, 16);
    ctx.fillStyle = '#bfe0ff'; for (let wx = x0 + 12; wx < x1 - 18; wx += 22) rr(ctx, wx, y + 25, 15, 10, 3), ctx.fill();
    ctx.fillStyle = '#ff6a96'; ctx.fillRect(x0, y + 50, x1 - x0 + (nose ? 60 : 0), 4); ctx.fillStyle = '#ffb7c9'; ctx.fillRect(x0, y + 55, x1 - x0 + (nose ? 70 : 0), 2);
    if (nose) { ctx.fillStyle = '#1e2a40'; ctx.beginPath(); ctx.moveTo(x1 + 10, y + 12); ctx.bezierCurveTo(x1 + 34, y + 14, x1 + 52, y + 24, x1 + 58, y + 34); ctx.lineTo(x1 + 18, y + 34); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(x1 + 92, y + 64, 6, 3, 0.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#9aa0aa'; ctx.fillRect(x0, y + 4, x1 - x0, 3);
    for (const bx of [x0 + 26, x1 - 46]) { ctx.fillStyle = '#3a3a44'; rr(ctx, bx, y + 80, 36, 10, 3); ctx.fill(); ctx.fillStyle = '#1a1a20'; for (const wx of [bx + 8, bx + 28]) { ctx.beginPath(); ctx.arc(wx, y + 90, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a8a98'; ctx.save(); ctx.translate(wx, y + 90); ctx.rotate(t * 30); ctx.fillRect(-4, -0.8, 8, 1.6); ctx.restore(); ctx.fillStyle = '#1a1a20'; } }
  };
  const cars = Math.max(1, Math.round(w / 170)), cw = w / cars;
  for (let k = 0; k < cars; k++) { const x0 = x + k * cw, x1 = x0 + cw - 4; body(x0, x1, k === cars - 1); if (k < cars - 1) { ctx.fillStyle = '#4a4a54'; ctx.fillRect(x1 - 2, y + 10, 10, 70); } }
  // the tail light and a pantograph at the back
  ctx.fillStyle = '#ff3a3a'; ctx.fillRect(x - 2, y + 60, 4, 8);
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 30, y + 4); ctx.lineTo(x + 40, y - 8); ctx.lineTo(x + 50, y + 4); ctx.moveTo(x + 32, y - 8); ctx.lineTo(x + 48, y - 8); ctx.stroke();
  // speed lines
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; for (let k = 0; k < 4; k++) { const sy = y + 20 + k * 18, ph = (t * 3 + k * 0.3) % 1; ctx.beginPath(); ctx.moveTo(x - 30 - ph * 80, sy); ctx.lineTo(x - 70 - ph * 80, sy); ctx.stroke(); }
};

/* ---------------- set pieces ---------------- */
const pond = (st, x0, x1, row) => { st.pit(x0, x1); st.B.fill(x0, row, x1, st.H - 1, T.LAVA); };
const P = {
  // a Shiba with nunchucks
  shiba(st, o) { const x = st.x; st.floor(x, x + 8); st.spawn('jpShiba', x + 4, st.gy - 1, {}); if (!o.quiet) st.sign(x + 7, 'THROW to whirl the nunchucks: they swat bugs, snap bamboo shoots and knock anything thrown at you right back!'); return x + 9; },

  /* 11-1: the bamboo grove */
  // a ravine crossed on bending bamboo: they bow under Brady and carry him forward; jump as one springs back for a vault
  poles(st, o) {
    const B = st.B, n = o.n || 2, lean = 0.55; let x = st.x;
    st.floor(x, x + 2); x += 3;
    const gap = n * 5 + 1; pond(st, x, x + gap - 1, st.H - 2);
    for (let k = 0; k < n; k++) {
      const rx = x + 1 + k * 5, top = st.gy - 1 - (k % 2), root = st.H, len = root - top;
      st.spawn('jpPole', rx, top, { root, lean, dir: 1 });
      // the validator can't ride a bending pole: give it standing spots along the perch's path
      for (let b = 0; b <= 1.001; b += 0.125) { const th = b * lean, tx = rx + 0.5 + Math.sin(th) * len, ty = Math.round(root - Math.cos(th) * len); B.ghosts.push([Math.floor(tx), ty], [Math.floor(tx) - 1, ty]); }
      st.coins(rx, rx + 2, top - 3);
    }
    if (o.gold) st.gold(x + 5, st.gy - 7, 'high');
    x += gap; st.floor(x, x + 2); st.decor('jpFern', x + 1);
    if (o.first) st.sign(x - gap - 2, 'Hop onto the bamboo: it bends under you. Jump while it\'s bent and it flings you high!');
    return x + 3;
  },
  // bamboo shoots that burst out of the path
  shoots(st, o) { const x = st.x, n = o.n || 3, w = n * 3 + 3; st.floor(x, x + w - 1); for (let k = 0; k < n; k++) st.spawn('jpShoot', x + 2 + k * 3, st.gy - 1, {}); st.coins(x + 1, x + w - 2, st.gy - 3); st.decor('jpShootDecor', x + w - 1); return x + w; },
  // a quiet glade: bamboo-pole platforms, a stone lantern, a bento block
  grove(st, o) { const x = st.x; st.floor(x, x + 13); st.semi(x + 3, x + 6, st.gy - 3); st.semi(x + 8, x + 11, st.gy - 6); st.block(x + 9, st.gy - 9, o.high ? 'star' : 'power'); st.coins(x + 3, x + 6, st.gy - 5); st.decor('jpStoneLantern', x + 1); st.decor('jpFern', x + 12); st.enemy(o.high ? 'jpBeetle' : 'jpOnigiri', x + 10, st.gy); if (o.high) st.gold(x + 10, st.gy - 9, 'hidden'); return x + 14; },
  // a koi pond with stepping stones
  kpond(st, o) {
    const B = st.B, x = st.x, w = 8; st.floor(x, x + 1);
    pond(st, x + 2, x + 1 + w, st.gy + 1);
    for (const dx of [2, 5]) B.fill(x + 2 + dx, st.gy - 1, x + 2 + dx, st.H - 1, T.GROUND);
    st.enemy('jpKoi', x + 3, st.gy + 2); st.enemy('jpKoi', x + 8, st.gy + 2, { delay: 0.9 });
    st.arc(x + 2, x + 1 + w, st.gy - 2, 3); if (o.gold) st.gold(x + 6, st.gy - 4, 'risky');
    st.floor(x + 2 + w, x + 4 + w); st.decor('jpStoneLantern', x + 3 + w);
    return x + 5 + w;
  },

  /* 11-2: the bullet train (pieces place things along the route; the train carries Brady past them) */
  gantry(st, o) { const x = st.x, d = st.deck; st.spawn('jpLowBar', x, d - 1, { look: 'gantry', deck: d }); if (o.two) st.spawn('jpLowBar', x + 7, d - 1, { look: 'gantry', deck: d }); st.coins(x - 1, x + 1, d - 1); return x + (o.two ? 11 : 6); },
  tunnel(st, o) {
    const x = st.x, n = o.n || 16, B = st.B, d = st.deck, lamps = o.lamps || 2;
    B.fill(x, 0, x + n - 1, d - 3, T.GROUND);
    B.prop('jpTunnelBack', x, d - 2, n, st.H - d + 2, 'none', {});
    st.spawn('jpTunnel', x, d - 1, { x0: x, x1: x + n, deck: d });
    for (let k = 0; k < lamps; k++) st.spawn('jpLowBar', x + Math.round((k + 1) * n / (lamps + 1)), d - 1, { look: 'lamp', deck: d });
    st.coins(x + 2, x + n - 3, d - 1);
    if (o.gold) st.gold(x + Math.floor(n / 2), d - 2, 'risky');
    return x + n;
  },
  crows(st, o) { st.enemy('jpCrow', st.x + 4, st.deck); st.enemy('jpCrow', st.x + 10, st.deck + 1); return st.x + 13; },
  brollies(st, o) { st.enemy('jpUmbrellaFly', st.x + 3, st.deck); st.enemy('jpUmbrellaFly', st.x + 9, st.deck - 1); st.coins(st.x + 5, st.x + 7, st.deck - 4); if (o.gold) st.gold(st.x + 6, st.deck - 5, 'high'); return st.x + 12; },
  // closes the one-tile gap between where the train stops and the platform
  endcap(st) { st.B.fill(st.len - 1, st.deck, st.len - 1, st.H - 1, T.GROUND); return st.x; },
  fujiview(st, o) { const x = st.x, d = st.deck; st.arc(x, x + 6, d - 2, 3); st.block(x + 10, d - 4, o.item || 'power'); if (o.gold) st.gold(x + 13, d - 5, 'high'); return x + 15; },

  /* 11-3: the sushi carousel */
  counter(st, o) { const x = st.x; st.floor(x, x + 11); st.decor('jpTeapot', x + 2); st.decor('jpPlates', x + 9); st.block(x + 5, st.gy - 4, 'power'); st.semi(x + 4, x + 6, st.gy - 4); st.coins(x + 4, x + 6, st.gy - 6); st.enemy('jpTamago', x + 8, st.gy); return x + 12; },
  // a soy-sauce pool with the plate wheel turning over it: ride the plates across (or up)
  wheel(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 1); x += 2;
    const w = 9, h = 5; pond(st, x, x + w - 1, st.gy + 1);
    const x0 = x, x1 = x + w - 2, y1 = st.gy, y0 = st.gy - h;
    st.spawn('jpPlateLoop', x, st.gy - 1, { x0, x1, y0, y1, n: 6, speed: 1.7 });
    for (let c = x0; c <= x1 + 1; c++) B.ghosts.push([c, y1], [c, y0]);
    for (let r = y0; r <= y1; r++) B.ghosts.push([x1, r], [x1 + 1, r], [x0 + 1, r]);
    st.coins(x0 + 2, x1 - 1, y0 - 2);
    if (o.gold) st.gold(x0 + 4, y0 - 3, 'high');
    x += w;
    if (o.up) { st.gy = y0; st.floor(x, x + 4); st.decor('jpPlates', x + 3); st.enemy('jpWasabi', x + 3, st.gy); x += 5; for (let i = 0; i < 2; i++) { st.gy += 2; st.floor(x, x + 1); x += 2; } st.floor(x, x + 1); return x + 2; }
    st.floor(x, x + 3); st.decor('jpSoyBottle', x + 2); return x + 4;
  },
  // giant chopsticks reach down from above
  chopsticks(st, o) { const x = st.x, n = o.n || 2, w = n * 4 + 4; st.floor(x, x + w - 1); for (let k = 0; k < n; k++) st.spawn('jpChopsticks', x + 3 + k * 4, st.gy - 1, { top: st.gy - 9, delay: 0.8 + k * 1.2, every: 2.6 }); st.coins(x + 2, x + w - 3, st.gy - 2); st.enemy(o.n > 2 ? 'jpTako' : 'jpTamago', x + w - 2, st.gy); return x + w; },
  // a giant tea cup: its steam lifts Brady over the tall rice-cracker wall
  teacup(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    B.prop('jpBigCup', x + 3, st.gy - 2, 3, 2, 'body', {});
    st.spawn('jpSteam', x + 3, st.gy - 3, { w: 3, top: 8 });
    B.zone(x + 3, st.gy - 10, 3, 8, 0, -110 * TS, 6.5 * TS, 'steam', { pull: 3 });
    B.fill(x + 8, st.gy - 7, x + 9, st.gy - 1, T.HARD);
    st.semi(x + 6, x + 7, st.gy - 9); st.coins(x + 3, x + 5, st.gy - 6); st.coins(x + 10, x + 13, st.gy - 2); if (o.gold) st.gold(x + 7, st.gy - 11, 'high');
    if (o.first) st.sign(x + 1, 'Hop on the tea cup: its steam carries you up!');
    st.enemy('jpTako', x + 12, st.gy);
    return x + 15;
  },
  // stepping across soy-sauce pools on sushi-plate stacks
  soyjumps(st, o) { let x = st.x; st.floor(x, x + 1); x += 2; for (let k = 0; k < 3; k++) { const w = 2 + (k % 2); pond(st, x, x + w - 1, st.gy + 1); if (k === 1) st.gold(x + 1, st.gy - 3, 'risky'); x += w; st.gy = clamp(st.gy + [-1, 1, -2][k], st.gyMin, st.gyMax); st.floor(x, x + 1); st.decor('jpPlates', x + 1); x += 2; } st.enemy('jpWasabi', x - 1, st.gy); return x; },

  /* 11-4: neon batting cages */
  // a batting cage: knock a pitch back into the target and the shutter rolls up
  cage(st, o) {
    const x = st.x, B = st.B, n = 15, gy = st.gy, id = o.id || 1;
    st.floor(x, x + n + 2);
    B.prop('jpCageRoof', x + 3, gy - 7, n - 2, 2, 'body', {});
    st.spawn('jpShiba', x + 5, gy - 1, {});
    st.spawn('jpPitcher', x + n - 3, gy - 1, { dir: -1, every: o.two ? 1.3 : 1.7, id });
    st.spawn('jpTarget', x + n - 2, gy - 4, { id });
    st.spawn('jpShutter', x + n, gy - 1, { id, h: 5 });
    if (o.two) st.enemy('jpLuckyCat', x + 9, gy);
    st.coins(x + 7, x + 10, gy - 3);
    if (o.first) st.sign(x + 1, 'Batting cage! Whirl the nunchucks as a pitch reaches you: it flies back at the target and opens the shutter.');
    return x + n + 3;
  },
  // the crane-game claw: climb in at the left, it carries you over the canal and drops you at the chute
  claw(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 3);
    const gw = 9, g0 = x + 4; pond(st, g0, g0 + gw - 1, st.gy + 1);
    const xa = x + 2, xb = g0 + gw + 1, rail = st.gy - 5;
    st.spawn('jpClaw', xa, st.gy - 1, { xa, xb, rail, yb: st.gy });
    for (let r = st.gy - 1; r >= rail; r--) B.ghosts.push([xa, r], [xb, r]);
    for (let c = xa; c <= xb; c++) B.ghosts.push([c, rail]);
    st.coins(g0 + 1, g0 + gw - 2, rail - 2);
    if (o.gold) st.gold(g0 + 4, rail - 3, 'high');
    st.floor(g0 + gw, g0 + gw + 3); st.decor('jpCapsuleMachine', g0 + gw + 2);
    if (o.first) st.sign(x + 1, 'Jump into the claw and wait: it carries you over the canal.');
    return g0 + gw + 4;
  },
  // neon sign boards over the canal
  signs(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 14; pond(st, x, x + span - 1, st.gy + 1);
    for (const [dx, dy] of [[1, 2], [6, 4], [11, 2]]) { B.prop('jpSignBoard', x + dx, st.gy - dy, 3, dy + 3, 'top', {}); st.coins(x + dx, x + dx + 2, st.gy - dy - 2); }
    st.enemy('jpCrow', x + 8, st.gy);
    x += span; st.floor(x, x + 2); return x + 3;
  },
  // drinks machines to climb, a lucky-cat toy throwing coins from the top
  vending(st, o) { const x = st.x, B = st.B; st.floor(x, x + 12); B.prop('jpVendBox', x + 3, st.gy - 2, 2, 2, 'body', {}); B.prop('jpVendBox', x + 6, st.gy - 4, 2, 4, 'body', {}); st.enemy('jpLuckyCat', x + 7, st.gy - 4); st.coins(x + 3, x + 4, st.gy - 4); st.gold(x + 10, st.gy - 6, 'hidden'); st.enemy('jpCapsule', x + 11, st.gy); return x + 13; },

  /* 11-5: Kappa Castle */
  // the moat: stone posts, leaping koi
  moat(st, o) {
    const B = st.B; let x = st.x; st.floor(x, x + 1); x += 2; const w = 10;
    pond(st, x, x + w - 1, st.gy + 1);
    for (const dx of [2, 5, 8]) B.fill(x + dx, st.gy - (dx === 5 ? 1 : 0), x + dx, st.H - 1, T.GROUND);
    st.enemy('jpKoi', x + 3, st.gy + 2); st.enemy('jpKoi', x + 7, st.gy + 2, { delay: 0.8 });
    st.arc(x + 1, x + w - 2, st.gy - 2, 3); if (o.gold) st.gold(x + 5, st.gy - 5, 'risky');
    x += w; st.floor(x, x + 2); st.decor('jpStoneLantern', x + 1); return x + 3;
  },
  // a corridor of nightingale floor: it chirps underfoot and the sliding panels bowl spinning tops. Hop the beams to stay quiet
  nightingale(st, o) { const x = st.x, n = o.n || 12; st.floor(x, x + n + 3); st.spawn('jpNightingale', x + 2, st.gy - 1, { x0: x + 2, n }); st.semi(x + 3, x + 5, st.gy - 3); st.semi(x + 8, x + 10, st.gy - 3); if (n > 12) { st.semi(x + 13, x + 14, st.gy - 3); st.gold(x + 9, st.gy - 7, 'high'); } st.coins(x + 3, x + n, st.gy - 5); return x + n + 4; },
  // a revolving wall panel in a tall plaster wall
  revolve(st, o) { const x = st.x, B = st.B; st.floor(x, x + 9); B.fill(x + 5, 0, x + 5, st.gy - 4, T.HARD); st.spawn('jpRevolve', x + 5, st.gy - 1, { h: 3 }); st.coins(x + 1, x + 3, st.gy - 2); st.coins(x + 7, x + 9, st.gy - 2); if (o.first) st.sign(x + 2, 'Some walls in this castle spin round. Walk into one and keep pushing!'); return x + 10; },
  // the cherry-tree garden: beams, a bento block, a hopping umbrella
  garden(st, o) { const x = st.x; st.floor(x, x + 14); st.semi(x + 3, x + 6, st.gy - 3); st.semi(x + 8, x + 11, st.gy - 5); st.block(x + 9, st.gy - 8, 'power'); st.decor('jpStoneLantern', x + 1); st.decor('jpPine', x + 13); st.enemy('jpUmbrella', x + 7, st.gy); st.enemy('jpTop', x + 12, st.gy); st.gold(x + 4, st.gy - 6, 'hidden'); return x + 15; },
  arena_garden(st, o) { const B = st.B, { x0, w, GY } = o; for (let q = 0; q < 3; q++) { B.set(x0 + 4 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); } B.decorAt('jpStoneLantern', x0 + 1, GY, 0); B.decorAt('jpStoneLantern', x0 + w - 2, GY, 1); }
};

/* ---------------- the boss: THE GREAT KAPPA ---------------- */
// A pond-dwelling kappa with a dish of water on his head. Full dish = full strength. Every big splash
// sloshes some out; when it's empty he's woozy: stomp his head! He is also terribly polite:
// bow to him (hold DOWN, facing him) and he bows right back... and spills the lot.
const boss = {
  id: 'jp_kappa', name: 'The Great Kappa', hp: 4, dims: [70, 80], music: 'tour_jp_boss', country: 'jp',
  brain: {
    guardText: 'HARD SHELL!',
    wake(b) { b.water = 1; K.say(b.g, b, 'KAPPA! WHO DARES ENTER MY POND?', '#bfff8a'); },
    onWhirl(b, p) { if (b.act !== 'dizzy') { K.say(b.g, b, 'TINK!', '#ffffff'); Sound.play('bump', { pitch: 1.6, vol: 0.4 }); } },
    onBall(b, s) { if (s.kind === 'cucumber') { K.say(b.g, b, pick(['MUNCH! MORE CUCUMBER!', 'CRUNCH! DELICIOUS!']), '#bfff8a'); b.g.burst(b.cx, b.y + 20, 8, '#5ab84a', 'spark'); } else { K.say(b.g, b, 'TINK!', '#ffffff'); } },
    noDisc(b) { return true; },
    update(b, dt) {
      // the first frame of a new act (the framework's own first is cleared before an act started inside update() ever runs)
      const first = b._ent !== b.act || b.at <= (b._entAt || 0); b._ent = b.act; b._entAt = b.at;
      const g = b.g, p = g.player; b.guard = 'bounce'; if (b.water == null) b.water = 1;
      // a bow is answered with a bow
      if (b.bowCool > 0) b.bowCool -= dt;
      if (b.act === 'walk' && b.at > 0.4 && p && !p.dead && p.onGround && Input.down && b.water > 0.3 && Math.abs(p.cx - b.cx) < 8 * TS && sign(b.cx - p.cx) === p.facing) { if (b.bowCool > 0) { if (!b.nodT || b.t - b.nodT > 3) { b.nodT = b.t; K.say(g, b, '*NODS* NOT AGAIN, LITTLE ONE.', '#bfff8a'); } } else { b.bowCool = 8; b.go('bow'); } }
      if (b.act === 'walk') { b.face(); b.walk(b.hp <= 2 ? 1.3 : 0.9); b.pose = 'walk'; if (b.at > 1.7) { b.cycle++; b.go(['cucumber', 'slap', 'splash', 'cucumber', 'splash'][b.cycle % 5]); } }
      else if (b.act === 'cucumber') {
        b.vx = 0; b.pose = 'throw';
        if (first) { b.face(); b.n = 0; K.say(g, b, 'CUCUMBER STORM!', '#bfff8a'); }
        const k = b.hp <= 2 ? 4 : 3;
        if (b.at > 0.45 + b.n * 0.4 && b.n < k && p) { b.n++; const dx = p.cx - b.cx, tt = 0.9; tourFire(g, b.cx + b.dir * 24, b.y + 18, { kind: 'cucumber', vx: clamp(dx / tt, -8 * TS, 8 * TS) + (Math.random() - 0.5) * TS, vy: -9 * TS, grav: PHYS.gDown * 0.36, w: 22, h: 12, life: 3, thru: true, stompable: true, col: '#5ab84a', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); ctx.fillStyle = '#3a8a2a'; rr(ctx, -11, -5, 22, 10, 5); ctx.fill(); ctx.fillStyle = '#8ad05a'; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.arc(q * 4, -1, 1.2, 0, TAU); ctx.fill(); } ctx.fillStyle = '#c8e8a0'; ctx.beginPath(); ctx.ellipse(10, 0, 2, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); } }); Sound.play('throw', { pitch: 0.9, vol: 0.4 }); }
        if (b.at > 0.6 + k * 0.4) b.go('walk');
      } else if (b.act === 'slap') {
        // a mighty palm-thrust: a gust rolls along the floor
        b.vx = 0; b.pose = b.at > 0.5 ? 'slap' : 'wind';
        if (first) { b.face(); K.say(g, b, 'HAKKEYOI!', '#ffd84a'); }
        if (b.at > 0.5 && !b.fired) { b.fired = true; g.shake(4); Sound.play('stomp', { pitch: 0.7 }); tourFire(g, b.cx + b.dir * (b.w / 2 + 12), b.floorY - 14, { kind: 'gust', vx: b.dir * 5.5 * TS, w: 26, h: 28, ground: true, life: 2.6, col: '#d8f0ff', art: (ctx, s, t) => { ctx.strokeStyle = 'rgba(220,240,255,0.85)'; ctx.lineWidth = 3; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(s.cx - sign(s.vx) * q * 6, s.cy, 8 + q * 4, -1.1, 1.1); ctx.stroke(); } } }); }
        if (b.at > 1.3) { b.fired = false; b.go('walk'); }
      } else if (b.act === 'splash') {
        if (first) { b.vy = -15 * TS; b.vx = b.dir * 2 * TS; K.say(g, b, 'BELLY FLOP!', '#8af0ff'); }
        b.pose = 'hop';
        if (b.onGround && b.at > 0.3) {
          g.shake(8); Sound.play('splash', { pitch: 0.6, vol: 0.7 }); g.burst(b.cx, b.floorY - 10, 20, '#bfe8ff', 'spark');
          for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 10), b.floorY - 12, { kind: 'wave', vx: d * 4.5 * TS, w: 28, h: 22, ground: true, life: 3, col: '#8ad0ff', art: (ctx, s, t) => { ctx.fillStyle = 'rgba(120,200,255,0.85)'; ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); ctx.quadraticCurveTo(s.cx - sign(s.vx) * 6, s.y - 4, s.x + s.w, s.y + s.h); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(s.cx - sign(s.vx) * 4, s.y + 4, 3, 0, TAU); ctx.fill(); } });
          b.water = Math.max(0, b.water - 0.55); b.vx = 0;
          b.go(b.water < 0.2 ? 'dizzy' : 'walk');
        }
      } else if (b.act === 'bow') {
        // a deep, polite bow... and the water pours out of his dish
        b.vx = 0; b.pose = 'bow';
        if (first) { K.say(g, b, 'OH! HOW POLITE. *BOWS*', '#bfff8a'); Sound.play('select2', { pitch: 1.2, vol: 0.4 }); }
        if (b.at > 0.35) { b.water = Math.max(0, b.water - dt * 2); if (Math.random() < 0.6) g.burst(b.cx + b.dir * 30, b.y + 30, 2, '#8ad0ff', 'spark'); }
        if (b.at > 1) b.go('dizzy');
      } else if (b.act === 'dizzy') {
        b.vx = 0; b.pose = 'dizzy'; b.water = 0;
        if (first) { K.say(g, b, 'MY DISH... IT\'S EMPTY...', '#ffffff'); Sound.play('bump', { pitch: 0.6 }); }
        b.vuln = b.at > 0.2 && b.at < 2.8; b.guard = b.vuln ? 'hurt' : 'bounce';
        if (b.at > 3) { b.water = 1; K.say(g, b, 'REFILLED!', '#8af0ff'); b.go('walk'); }
      }
      b.fall(dt);
    },
    hurt(b) { b.water = 1; b.go('walk'); b.vx = -b.dir * 4 * TS; K.say(b.g, b, pick(['GEROGERO!', 'MY POOR HEAD!', 'NOT THE DISH!']), '#bfff8a'); b.g.burst(b.cx, b.y, 18, '#8ad0ff', 'spark'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, sq = 1 + b.squash * 0.12, water = b.water == null ? 1 : b.water;
      const bow = P === 'bow' ? Math.min(1, (b.at || 0) * 3) : 0, walkB = P === 'walk' ? Math.abs(Math.sin(t * 7)) * 3 : 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(sq * d, 1 / sq);
      K.shadow(ctx, 0, 0, 34);
      // legs
      ctx.fillStyle = '#5a9a3a'; for (const s of [-1, 1]) { const st = P === 'walk' ? Math.sin(t * 7 + s) * 4 : 0; rr(ctx, s * 14 - 6 + st, -16, 12, 16, 4); ctx.fill(); ctx.fillStyle = '#4a8a2a'; ctx.beginPath(); ctx.ellipse(s * 14 + st + 2, -1, 9, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a9a3a'; }
      ctx.save(); ctx.translate(0, -16 - walkB); ctx.rotate(bow * 0.85);
      // the shell on his back
      ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.ellipse(-16, -28, 20, 28, -0.15, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 1.6; for (const [hx, hy] of [[-18, -40], [-24, -24], [-12, -24], [-18, -10]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6); } ctx.closePath(); ctx.stroke(); }
      // body and belly
      ctx.fillStyle = '#6aaa4a'; ctx.beginPath(); ctx.ellipse(2, -28, 24, 28, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8e08a'; ctx.beginPath(); ctx.ellipse(8, -24, 15, 20, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,130,40,0.45)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-4, -24 + k * 7); ctx.quadraticCurveTo(8, -21 + k * 7, 20, -24 + k * 7); ctx.stroke(); }
      // arms
      ctx.fillStyle = '#6aaa4a';
      const armA = P === 'throw' ? -2.2 + Math.sin(t * 12) * 0.3 : P === 'slap' ? -1.45 : P === 'wind' ? 0.6 : P === 'dizzy' ? 0.3 + Math.sin(t * 5) * 0.2 : P === 'bow' ? 0.2 : 0.5 + Math.sin(t * 7) * 0.2;
      ctx.save(); ctx.translate(14, -40); ctx.rotate(armA); rr(ctx, -5, 0, 10, 24, 5); ctx.fill(); ctx.fillStyle = '#5a9a3a'; ctx.beginPath(); ctx.arc(0, 26, 7, 0, TAU); ctx.fill(); if (P === 'throw' && b.at % 0.4 < 0.25) { ctx.fillStyle = '#3a8a2a'; rr(ctx, -4, 22, 8, 16, 4); ctx.fill(); } ctx.restore();
      ctx.save(); ctx.translate(-8, -40); ctx.rotate(-armA * 0.4 + 0.3); ctx.fillStyle = '#5a9a3a'; rr(ctx, -5, 0, 10, 22, 5); ctx.fill(); ctx.restore();
      // the head: beak, eyes, a fringe of hair round the dish
      ctx.fillStyle = '#6aaa4a'; ctx.beginPath(); ctx.ellipse(6, -62, 18, 16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.moveTo(18, -62); ctx.quadraticCurveTo(32, -58, 30, -52); ctx.quadraticCurveTo(22, -50, 16, -54); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(18, -56); ctx.lineTo(28, -55); ctx.stroke();
      if (P === 'dizzy') { ctx.strokeStyle = '#1a1a10'; ctx.lineWidth = 1.6; for (const ex of [4, 14]) { ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = k * 0.6 + t * 6, r = k * 0.32; ctx.lineTo(ex + Math.cos(a) * r, -66 + Math.sin(a) * r); } ctx.stroke(); } }
      else K.eyes(ctx, 10, -66, 1, 4.6, 3, P === 'throw' || P === 'slap');
      ctx.fillStyle = '#2a5a2a'; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.ellipse(6 + k * 4.2, -75 + Math.abs(k) * 0.6, 3, 5, k * 0.2, 0, TAU); ctx.fill(); }
      // the dish and its water
      ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.ellipse(6, -78, 15, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a8b4c0'; ctx.lineWidth = 1.2; ctx.stroke();
      if (water > 0.02) { ctx.fillStyle = 'rgba(80,170,240,0.9)'; ctx.beginPath(); ctx.ellipse(6, -78 + (1 - water) * 1.5, 13 * Math.sqrt(water), 3.6 * Math.sqrt(water), 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(1, -80, 4 * water, 1.2); }
      if (P === 'bow' && water > 0) { ctx.fillStyle = 'rgba(80,170,240,0.8)'; for (let k = 0; k < 4; k++) { const ph = (t * 3 + k / 4) % 1; ctx.beginPath(); ctx.arc(22 + ph * 6, -76 + ph * 50, 2.5, 0, TAU); ctx.fill(); } }
      ctx.restore();
      ctx.restore();
      if (P === 'dizzy') TourKit.dizzy(ctx, x, b.y - 8, t);
    }
  }
};

/* ---------------- music: shamisen and koto, a breathy bamboo flute, taiko ---------------- */
const tracks = {
  tour_jp: {
    bpm: 96, bars: 8, rv: 0.36, dl: 0.18,
    ch: 'Em Em C D Em Bm Am Em',
    ld: 'E5:4 G5:2 A5:2 B5:6 A5:2 | G5:4 E5:4 D5:8 | E5:2 G5:2 A5:4 B5:2 D6:2 B5:4 | A5:12 .:4 | B5:4 D6:2 E6:2 D6:4 B5:4 | A5:2 B5:2 A5:2 G5:2 E5:8 | G5:4 A5:4 B5:2 A5:2 G5:4 | E5:12 .:4',
    li: 'twang', lv: 0.12,
    l2: 'B4:16 | A4:16 | G4:16 | A4:16 | B4:16 | D5:16 | B4:16 | E4:16', l2i: 'whistle', l2v: 0.04,
    bp: 'r.......r...f...', bi: 'pluckb', bv: 0.24,
    ap: '0.1.2.3.4.3.2.1.', ai: 'harp', av: 0.035, ao: 64,
    dr: ['d.......d...d...', '....m.......t.t.', '..r.......r...r.', 'n...n...n...n...'], dv: 0.38
  },
  tour_jp_rail: {
    bpm: 144, bars: 8, rv: 0.22, dl: 0.12,
    ch: 'Cmaj7 G/B Am7 Em7 Fmaj7 C Dm7 G',
    ld: 'E5:2 G5:2 C6:4 B5:2 G5:2 | D6:4 B5:2 G5:2 D5:8 | C5:2 E5:2 A5:4 G5:2 E5:2 | G5:12 .:4 | F5:2 A5:2 C6:4 E6:4 | E6:2 D6:2 C6:2 G5:2 C6:8 | D6:2 C6:2 A5:2 F5:2 A5:4 | B5:2 D6:2 G6:8 .:4',
    li: 'pulse', lv: 0.1,
    bp: 'R.r.o.r.R.r.o.f.', bi: 'slapb', bv: 0.26,
    ap: 'c...c...c.c.....', ai: 'ep', av: 0.05, ao: 60,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.hh', '..............o.'], dv: 0.4
  },
  tour_jp_sushi: {
    bpm: 122, bars: 8, rv: 0.25, dl: 0.14, sw: 0.12,
    ch: 'G Em C D G Em Am D',
    ld: 'D5:2 G5:2 B5:2 G5:2 A5:4 G5:4 | E5:2 G5:2 E5:2 D5:2 E5:8 | C5:2 E5:2 G5:2 E5:2 A5:4 G5:4 | A5:2 B5:2 A5:2 G5:2 D5:8 | B5:2 D6:2 B5:2 A5:2 G5:4 E5:4 | G5:2 A5:2 B5:4 E5:8 | A5:2 G5:2 E5:2 D5:2 E5:4 A5:4 | G5:12 .:4',
    li: 'mbox', lv: 0.13,
    a2: '..c...c...c...c.', a2i: 'twang', a2v: 0.05, a2o: 60,
    bp: 'r..r..f.r..r..o.', bi: 'pluckb', bv: 0.26,
    dr: ['k.....k...k.....', '....c.......c...', 'b..b..b.b..b..b.', '..h...h...h...h.'], dv: 0.38
  },
  tour_jp_neon: {
    bpm: 108, bars: 8, rv: 0.4, dl: 0.2,
    ch: 'Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 G',
    ld: 'A5:4 C6:2 E6:4 D6:2 C6:4 | B5:4 G5:4 E5:8 | F5:2 A5:2 C6:4 B5:2 A5:2 F5:4 | E5:8 G5:8 | A5:2 C6:2 E6:4 G6:4 E6:4 | D6:2 E6:2 D6:2 B5:2 G5:8 | F5:4 A5:4 C6:4 D6:4 | B5:12 .:4',
    li: 'ssaw', lv: 0.08,
    pd: 'c-------c-------', pi: 'pad', pv: 0.05, po: 52,
    bp: 'r.r...o.r.r...f.', bi: 'slapb', bv: 0.26,
    ap: '0.2.4.2.0.2.4.2.', ai: 'ep', av: 0.04, ao: 64,
    dr: ['k.....k...k.....', '....c.......c...', '..h...h...h...h.', 'n.n.n.n.n.n.n.n.'], dv: 0.38
  },
  tour_jp_boss: {
    bpm: 164, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Em Em C D Em Em Am B',
    ld: 'E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 A5:4 | G5:2 A5:2 B5:4 E5:8 | C6:2 B5:2 A5:2 G5:2 E5:2 G5:2 C6:4 | D6:2 B5:2 A5:2 F#5:2 D5:8 | E6:2 D6:2 B5:2 A5:2 B5:4 E6:4 | G6:4 E6:2 D6:2 B5:8 | A5:2 C6:2 E6:2 A6:2 G6:4 E6:4 | F#6:2 D#6:2 B5:4 .:8',
    li: 'twang', lv: 0.13,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'pluckb', bv: 0.3,
    ap: 'c-..c-..c-..c-..', ai: 'harp', av: 0.04, ao: 60,
    dr: ['d...d...d.d.d...', '....t.......t.t.', 'r.r.r.r.r.r.r.r.', 'k...k...k...k...'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
const COIN = { name: 'GOLDEN KOBAN', draw(ctx, x, y) {
  const g = ctx.createRadialGradient(x - 2, y - 4, 1, x, y, 10); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 6.5, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 0.9; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 4.5, y + k * 2.6); ctx.lineTo(x + 4.5, y + k * 2.6); ctx.stroke(); }
  ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 1.6, 1.2, 0, 0, TAU); ctx.ellipse(x, y + 6, 1.6, 1.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 3.5, y - 7, 1.6, 3);
} };
Tour.country({
  id: 'jp', colors: COL, tagline: 'Bamboo groves, bullet trains and a very polite kappa',
  themes, painters, dyn, decor, decorLights, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_jp', boss: 'tour_jp_boss' },
  landmark: 'the golden roof fish of the castle',
  arrival: 'Konnichiwa, Brady! The Baron pried the two golden fish off a castle roof and is taking them home on the bullet train. A Shiba here owns nunchucks. Don\'t ask. ♥ C',
  emblem(ctx, x, y, r, t) { blossom(ctx, x, y, r * 0.9, '#ffb7c9', (t || 0) * 0.3); },
  coin: COIN,
  star: { name: 'GOLDEN SAKURA', draw(ctx, x, y, t) { blossom(ctx, x, y, 11, '#ffd24a', Math.sin(t * 2) * 0.2); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill(); } },
  levels: [
    { name: 'Bamboo Grove', style: 'run', theme: 'jp_bamboo', gyMin: 8,
      gimmick: 'A Shiba hands over nunchucks; bending bamboo bows under you and carries you forward (jump as it springs back for a huge vault); bamboo shoots burst out of the path, rice-ball hoppers, charging beetles, a koi pond',
      enemies: [['jpOnigiri', 2], ['jpBeetle', 2], ['jpCrow', 1]],
      hint: 'Stand on the bamboo to bend it, then jump as it springs back',
      postcard: 'Brady! The bamboo here is taller than a house and it creaks in the wind. I bowed to a Shiba. It bowed back. ♥ C',
      script: ['shiba', 'grove', ['poles', { n: 2, first: true }], 'shoots', 'kpond', 'cp', ['enemies', { n: 2 }], ['poles', { n: 3, gold: true }], ['shoots', { n: 4 }], ['grove', { high: true }], ['kpond', { gold: true }], ['poles', { n: 4 }], 'bonus', 'end'] },
    { name: 'Bullet Train', style: 'ride', theme: 'jp_rail', vehicle: 'jpBullet', vehicleW: 16, deck: 11, H: 16, len: 210, scroll: 3.2,
      gimmick: 'Ride the roof of a bullet train past Mt. Fuji: duck under the signal gantries, crouch through the tunnels\' low lamps, swat crows and runaway umbrellas',
      enemies: [['jpCrow', 2], ['jpUmbrellaFly', 2]],
      hint: 'Hold DOWN to duck under the gantries and the tunnel lamps',
      postcard: 'We\'re going 300 km an hour and you\'re on the ROOF?! Hold on to something. ♥ C',
      script: ['endcap', ['fujiview', { item: 'power' }], 'gantry', 'crows', ['tunnel', { n: 16 }], 'brollies', 'gantry', ['fujiview', { gold: true, item: 'sig' }], 'cp', ['tunnel', { n: 22, lamps: 3, gold: true }], 'crows', ['gantry', { two: true }], ['brollies', { gold: true }], ['tunnel', { n: 14 }], 'fujiview'] },
    { name: 'Sushi Carousel', style: 'run', theme: 'jp_sushi', gyMin: 7,
      gimmick: 'A giant conveyor-belt sushi bar: ride the plate wheel over the soy sauce, dodge (or knock away) the giant chopsticks, float up on the steam of a giant tea cup',
      enemies: [['jpTamago', 2], ['jpTako', 2], ['jpWasabi', 1]],
      hint: 'Ride the plates! And watch for the chopsticks\' shadow',
      postcard: 'Everything here goes round and round on little plates. I\'ve eaten nine. Ten. ♥ C',
      script: ['shiba', 'counter', 'wheel', 'chopsticks', ['teacup', { first: true }], 'cp', ['enemies', { n: 2 }], ['wheel', { gold: true, up: true }], ['chopsticks', { n: 3 }], 'soyjumps', ['teacup', { gold: true }], 'bonus', 'end'] },
    { name: 'Neon Batting Cages', style: 'night', theme: 'jp_neon',
      gimmick: 'Pitching machines fire baseballs: whirl the nunchucks to knock them back into the target and roll up the shutters; ride the crane-game claw over the canal; lucky-cat toys throw coins',
      enemies: [['jpLuckyCat', 1], ['jpCapsule', 2], ['jpCrow', 1]],
      hint: 'Whirl the nunchucks as a pitch reaches you: it flies back at the target',
      postcard: 'Neon everywhere, and machines that throw baseballs at you. For FUN. I love it here. ♥ C',
      script: [['cage', { id: 1, first: true }], 'signs', ['claw', { first: true }], 'cp', ['enemies', { n: 2 }], ['cage', { id: 2, two: true }], 'vending', ['claw', { gold: true }], 'signs', 'bonus', 'end'] },
    { name: 'Kappa Castle', style: 'castle', theme: 'jp_castle', boss: 'jp_kappa', arena: 'garden', arenaW: 26, roof: false,
      gimmick: 'Nightingale floors chirp underfoot and wake the spinning-top traps (hop the beams to stay quiet), revolving secret walls, a koi moat; then the Great Kappa',
      enemies: [['jpUmbrella', 2], ['jpTop', 2]],
      hint: 'Kappa are VERY polite. Bow to him (hold DOWN, facing him) and see what happens',
      postcard: 'The golden fish are back on the castle roof! The Baron took off toward the Himalaya. This is it, Brady. ♥ C',
      script: [['shiba', { quiet: true }], 'moat', 'nightingale', ['enemies', { n: 2 }], ['revolve', { first: true }], 'cp', ['nightingale', { n: 14 }], 'garden', ['moat', { gold: true }], 'revolve', 'arena'] }
  ]
});
})();
