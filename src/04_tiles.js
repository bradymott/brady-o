/* ============================================================
   Tile art — themed, autotiled, pre-rendered atlases
   ============================================================ */
const TPAD = 6; // logical overdraw padding around each tile image

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

const TileArt = {
  cache: {},
  get(themeKey, S) {
    const k = themeKey + '@' + S.toFixed(3);
    if (this.cache[k]) return this.cache[k];
    const keys = Object.keys(this.cache);
    if (keys.length >= 3) delete this.cache[keys[0]];
    const a = this.build(themeKey, S);
    this.cache[k] = a;
    return a;
  },

  tile(S, fn) {
    const size = (TS + TPAD * 2) * S;
    const c = makeCanvas(size, size);
    const ctx = c.getContext('2d');
    ctx.scale(S, S); ctx.translate(TPAD, TPAD);
    fn(ctx);
    return c;
  },

  build(themeKey, S) {
    const th = THEMES[themeKey];
    const A = { S, ground: [], ice: [], pillar: {}, semi: {}, qblock: [], conv: { l: [], r: [] }, glitch: [] };
    for (let v = 0; v < 2; v++) for (let m = 0; m < 16; m++) A.ground[v * 16 + m] = this.tile(S, ctx => paintGround(ctx, th, m, v));
    for (let m = 0; m < 2; m++) A.ice[m] = this.tile(S, ctx => paintIce(ctx, m, th.iceStyle));
    A.brick = this.tile(S, ctx => paintBrick(ctx, th.brick));
    for (let f = 0; f < 4; f++) A.qblock[f] = this.tile(S, ctx => (th.qblockArt || paintQBlock)(ctx, th, f));
    A.used = this.tile(S, ctx => (th.usedArt || paintUsed)(ctx, th));
    A.hard = this.tile(S, ctx => paintHard(ctx, th.hard));
    ['L', 'M', 'R', 'S'].forEach(p => A.semi[p] = this.tile(S, ctx => paintSemi(ctx, th.semi, p)));
    A.spikes = this.tile(S, ctx => paintSpikes(ctx, false, th.spikes));
    A.spikesCeil = this.tile(S, ctx => paintSpikes(ctx, true, th.spikes));
    for (let f = 0; f < 4; f++) { A.conv.l[f] = this.tile(S, ctx => paintConveyor(ctx, -1, f)); A.conv.r[f] = this.tile(S, ctx => paintConveyor(ctx, 1, f)); }
    A.crumble = this.tile(S, ctx => paintCrumble(ctx, th));
    ['L', 'R', 'S'].forEach(p => { A.pillar[p + 't'] = this.tile(S, ctx => paintPillar(ctx, th.pillar, p, true)); A.pillar[p + 'b'] = this.tile(S, ctx => paintPillar(ctx, th.pillar, p, false)); });
    for (let f = 0; f < 3; f++) A.glitch[f] = this.tile(S, ctx => paintGlitch(ctx, f));
    return A;
  }
};

function speckle(ctx, rng, n, col, x0, y0, w, h, rmin, rmax) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(x0 + rng() * w, y0 + rng() * h, rmin + rng() * (rmax - rmin), 0, TAU); ctx.fill(); }
}

function paintGround(ctx, th, mask, variant) {
  const G = th.ground, st = G.style;
  const top = mask & 1, right = mask & 2, bottom = mask & 4, left = mask & 8;
  const rng = mulberry32(1000 + mask * 7 + variant * 131 + hashStr(st));
  // --- base body
  ctx.save();
  // rounded outer corners where two open sides meet
  const rad = 7;
  ctx.beginPath();
  const tl = top && left ? rad : 0, tr = top && right ? rad : 0, br = bottom && right ? rad : 0, bl = bottom && left ? rad : 0;
  ctx.moveTo(tl, 0); ctx.lineTo(TS - tr, 0); if (tr) ctx.quadraticCurveTo(TS, 0, TS, tr);
  ctx.lineTo(TS, TS - br); if (br) ctx.quadraticCurveTo(TS, TS, TS - br, TS);
  ctx.lineTo(bl, TS); if (bl) ctx.quadraticCurveTo(0, TS, 0, TS - bl);
  ctx.lineTo(0, tl); if (tl) ctx.quadraticCurveTo(0, 0, tl, 0);
  ctx.closePath();
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, TS);
  g.addColorStop(0, G.dirt); g.addColorStop(1, mix(G.dirt, G.dirt2, 0.55));
  ctx.fillStyle = g; ctx.fillRect(-1, -1, TS + 2, TS + 2);
  // a theme can paint its own ground body (G.paint) and cap (G.paintCap)
  if (typeof G.paint === 'function') {
    G.paint(ctx, rng, { top, left, right, bottom, variant });
  } else if (st === 'metal') {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(1, 1, TS - 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    [[4, 4], [TS - 4, 4], [4, TS - 4], [TS - 4, TS - 4]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    [[4, 4], [TS - 4, 4], [4, TS - 4], [TS - 4, TS - 4]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, 0.8, 0, TAU); ctx.fill(); });
  } else if (st === 'marble') {
    ctx.strokeStyle = 'rgba(192,138,255,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); let x = rng() * TS; ctx.moveTo(x, 0); for (let y = 0; y <= TS; y += 6) { x += (rng() - 0.5) * 8; ctx.lineTo(x, y); } ctx.stroke(); }
    speckle(ctx, rng, 6, 'rgba(255,255,255,0.05)', 0, 0, TS, TS, 1, 3);
  } else if (st === 'stage') {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let y = 0; y < TS; y += 8) { ctx.fillRect(0, y, TS, 1); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(variant ? 10 : 22, 0, 1, TS);
  } else if (st === 'pixel') {
    for (let y = 0; y < TS; y += 8) for (let x = 0; x < TS; x += 8) { ctx.fillStyle = rng() < 0.3 ? 'rgba(0,255,154,0.08)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y, 7, 7); }
  } else if (st === 'castle') {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(TS, 16); ctx.moveTo(16, 0); ctx.lineTo(16, 16); ctx.moveTo(variant ? 6 : 26, 16); ctx.lineTo(variant ? 6 : 26, TS); ctx.stroke();
    speckle(ctx, rng, 6, 'rgba(255,255,255,0.05)', 0, 0, TS, TS, 1, 3);
  } else if (st === 'neon') {
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, 0, TS, 1);
    speckle(ctx, rng, 10, 'rgba(0,0,0,0.25)', 0, 0, TS, TS, 0.5, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 15, TS, 1);
  } else if (st === 'playa') {
    // dried lakebed: plates of cracked dust
    speckle(ctx, rng, 10, 'rgba(255,255,255,0.08)', 0, 0, TS, TS, 0.6, 1.6);
    speckle(ctx, rng, 8, 'rgba(0,0,0,0.08)', 0, 0, TS, TS, 0.6, 1.4);
    const pts = [];
    for (let j = -1; j <= 2; j++) for (let i = -1; i <= 2; i++) pts.push([i * 16 + (j % 2 ? 8 : 0) + (rng() - 0.5) * 8, j * 14 + (rng() - 0.5) * 6]);
    ctx.strokeStyle = 'rgba(70,50,40,0.35)'; ctx.lineWidth = 0.9;
    for (const [px, py] of pts) {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5, r = 8.5 + rng() * 1.5; const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r * 0.85; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.6;
    for (const [px, py] of pts) { ctx.beginPath(); ctx.moveTo(px - 6, py - 4); ctx.lineTo(px + 2, py - 7); ctx.stroke(); }
    if (G.night) { ctx.fillStyle = 'rgba(40,30,80,0.18)'; ctx.fillRect(0, 0, TS, TS); }
  } else if (st === 'mineral') {
    for (let y = 0; y < TS; y += 5) { ctx.fillStyle = (y / 5) % 2 ? 'rgba(255,170,90,0.18)' : 'rgba(120,40,20,0.15)'; ctx.fillRect(0, y + Math.sin(y + variant) * 1.5, TS, 3); }
    speckle(ctx, rng, 6, 'rgba(255,240,200,0.25)', 0, 0, TS, TS, 0.8, 1.8);
  } else if (st === 'paper') {
    // stacked paper: ruled lines, a margin rule and the odd ink blot
    ctx.strokeStyle = 'rgba(90,130,200,0.35)'; ctx.lineWidth = 0.8;
    for (let y = 6; y < TS; y += 7) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TS, y); ctx.stroke(); }
    if (variant) { ctx.strokeStyle = 'rgba(220,90,110,0.4)'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, TS); ctx.stroke(); }
    if (rng() < 0.3) { ctx.fillStyle = 'rgba(20,20,40,0.55)'; ctx.beginPath(); ctx.arc(6 + rng() * 20, 8 + rng() * 18, 1.5 + rng() * 2.5, 0, TAU); ctx.fill(); }
  } else if (st === 'deck') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(4, 0, 3, TS); ctx.fillRect(TS - 7, 0, 3, TS);
    ctx.strokeStyle = 'rgba(90,60,30,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(TS - 5, TS - 2); ctx.moveTo(TS - 5, 2); ctx.lineTo(5, TS - 2); ctx.stroke();
  } else if (st === 'ember') {
    speckle(ctx, rng, 10, 'rgba(0,0,0,0.35)', 0, 0, TS, TS, 1, 3);
    ctx.strokeStyle = 'rgba(255,110,40,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); let ex = rng() * TS; ctx.moveTo(ex, 0); for (let y = 0; y <= TS; y += 5) { ex += (rng() - 0.5) * 9; ctx.lineTo(ex, y); } ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,140,50,0.7)'; ctx.fillRect(rng() * TS, rng() * TS, 1.4, 1.4); }
  } else if (st === 'basalt') {
    speckle(ctx, rng, 8, 'rgba(0,0,0,0.3)', 0, 0, TS, TS, 1, 3);
    ctx.strokeStyle = 'rgba(255,100,30,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); let x = rng() * TS; ctx.moveTo(x, 0);
    for (let y = 0; y <= TS; y += 5) { x += (rng() - 0.5) * 9; ctx.lineTo(x, y); }
    ctx.stroke();
  } else {
    // soil: speckles and embedded stones
    speckle(ctx, rng, 14, 'rgba(0,0,0,0.18)', 0, 0, TS, TS, 0.6, 1.6);
    speckle(ctx, rng, 6, 'rgba(255,255,255,0.06)', 0, 0, TS, TS, 0.6, 1.4);
    for (let i = 0; i < 2; i++) {
      const sx = 4 + rng() * (TS - 8), sy = (top ? 12 : 3) + rng() * (TS - (top ? 16 : 7)), sr = 2.5 + rng() * 3;
      ctx.fillStyle = G.rock; ctx.beginPath(); ctx.ellipse(sx, sy, sr * 1.3, sr, rng(), 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(sx - sr * 0.3, sy - sr * 0.35, sr * 0.6, sr * 0.35, 0, 0, TAU); ctx.fill();
    }
  }
  // edge shading
  if (left) { const e = ctx.createLinearGradient(0, 0, 6, 0); e.addColorStop(0, 'rgba(0,0,0,0.35)'); e.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = e; ctx.fillRect(0, 0, 6, TS); }
  if (right) { const e = ctx.createLinearGradient(TS, 0, TS - 6, 0); e.addColorStop(0, 'rgba(0,0,0,0.4)'); e.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = e; ctx.fillRect(TS - 6, 0, 6, TS); }
  if (bottom) { const e = ctx.createLinearGradient(0, TS, 0, TS - 7); e.addColorStop(0, 'rgba(0,0,0,0.45)'); e.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = e; ctx.fillRect(0, TS - 7, TS, 7); }
  ctx.restore();

  // --- outline on open edges
  ctx.strokeStyle = rgba(shade(G.dirt2, -0.5), 0.9); ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (left) { ctx.moveTo(0.7, tl); ctx.lineTo(0.7, TS - bl); }
  if (right) { ctx.moveTo(TS - 0.7, tr); ctx.lineTo(TS - 0.7, TS - br); }
  if (bottom) { ctx.moveTo(bl, TS - 0.7); ctx.lineTo(TS - br, TS - 0.7); }
  ctx.stroke();

  // --- cap
  if (top) paintCap(ctx, th, st, left, right, rng);
}

function paintCap(ctx, th, st, left, right, rng) {
  const G = th.ground;
  const x0 = left ? 1 : -0.5, x1 = right ? TS - 1 : TS + 0.5;
  if (typeof G.paintCap === 'function') { G.paintCap(ctx, x0, x1, rng, left, right); return; }
  if (st === 'grass' || st === 'coral') {
    const capH = 9;
    ctx.fillStyle = G.cap;
    ctx.beginPath(); ctx.moveTo(x0, 2);
    ctx.lineTo(x1, 2);
    for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x, capH + Math.sin(x * 0.9 + rng() * 2) * 2 + (rng() < 0.2 ? 3 : 0));
    ctx.closePath(); ctx.fill();
    if (left) { ctx.beginPath(); ctx.ellipse(2, 6, 3, 5, 0, 0, TAU); ctx.fill(); }
    if (right) { ctx.beginPath(); ctx.ellipse(TS - 2, 6, 3, 5, 0, 0, TAU); ctx.fill(); }
    // blades / nubs above the surface
    if (st === 'grass') {
      ctx.fillStyle = G.cap;
      for (let x = x0 + 1; x < x1 - 1; x += 3 + rng() * 3) {
        const h = 3 + rng() * 4; ctx.beginPath(); ctx.moveTo(x - 1.5, 3); ctx.lineTo(x + (rng() - 0.5) * 2, 3 - h); ctx.lineTo(x + 1.5, 3); ctx.fill();
      }
      ctx.fillStyle = G.capHi; ctx.fillRect(x0 + 1, 1.5, x1 - x0 - 2, 2);
      for (let x = x0 + 2; x < x1 - 2; x += 5 + rng() * 4) { ctx.fillRect(x, 3 - rng() * 3, 1, 2 + rng() * 2); }
    } else {
      for (let x = x0 + 3; x < x1 - 2; x += 6 + rng() * 5) {
        const r = 2 + rng() * 2.5; ctx.fillStyle = rng() < 0.5 ? G.cap : '#ffb36a';
        ctx.beginPath(); ctx.arc(x, 2, r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, 2 - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = G.capHi; ctx.fillRect(x0 + 1, 3, x1 - x0 - 2, 1.5);
    }
  } else if (st === 'snow') {
    ctx.fillStyle = G.cap;
    ctx.beginPath(); ctx.moveTo(x0 - (left ? 2 : 0), 4);
    ctx.quadraticCurveTo(TS / 2, -3, x1 + (right ? 2 : 0), 4);
    for (let x = x1 + (right ? 2 : 0); x >= x0; x -= 5) ctx.lineTo(x, 9 + Math.sin(x * 1.3) * 1.5 + (rng() < 0.25 ? 4 : 0));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(160,210,255,0.5)'; ctx.fillRect(x0, 8, x1 - x0, 1.5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + 3, 0.5, x1 - x0 - 6, 1.5);
    if (rng() < 0.6) { const ix = 6 + rng() * 20; ctx.fillStyle = 'rgba(220,245,255,0.9)'; ctx.beginPath(); ctx.moveTo(ix, 9); ctx.lineTo(ix + 2, 16 + rng() * 4); ctx.lineTo(ix + 4, 9); ctx.fill(); }
  } else if (st === 'sand') {
    const g = ctx.createLinearGradient(0, 0, 0, 10);
    g.addColorStop(0, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, 1); ctx.lineTo(x1, 1);
    for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x, 9 + Math.sin(x * 0.5) * 1.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(170,110,50,0.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x0 + 3, 5); ctx.quadraticCurveTo(TS / 2, 3, x1 - 3, 6); ctx.stroke();
  } else if (st === 'neon') {
    ctx.fillStyle = '#4a4860'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.save(); ctx.shadowColor = G.cap; ctx.shadowBlur = 8;
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 2.2);
    ctx.restore();
    ctx.fillStyle = G.capHi; ctx.fillRect(x0, 0.4, x1 - x0, 0.8);
  } else if (st === 'metal') {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, 6); ctx.clip();
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#1e1e1e';
    for (let x = -8; x < TS + 8; x += 8) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 4, 0); ctx.lineTo(x + 8, 0); ctx.lineTo(x + 4, 6); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, 0, x1 - x0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x0, 6, x1 - x0, 1);
  } else if (st === 'playa') {
    // a soft drift of fine dust on top
    const g = ctx.createLinearGradient(0, 0, 0, 7); g.addColorStop(0, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 2);
    for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, 1 + Math.sin(x * 0.35 + rng()) * 1.2);
    ctx.lineTo(x1, 6); for (let x = x1; x >= x0; x -= 5) ctx.lineTo(x, 6 + Math.sin(x * 0.7) * 1.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 1, 0.8, x1 - x0 - 2, 1);
    if (rng() < 0.35) { ctx.strokeStyle = 'rgba(120,90,60,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0 + 4, 3.5); ctx.lineTo(x1 - 4, 3.2); ctx.stroke(); } // bike track
  } else if (st === 'asphalt') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 9);
    speckle(ctx, rng, 8, 'rgba(255,255,255,0.12)', x0, 0, x1 - x0, 9, 0.4, 0.9);
    ctx.fillStyle = G.capHi; if (Math.floor(rng() * 2)) ctx.fillRect(x0 + 4, 3.6, Math.min(14, x1 - x0 - 6), 1.6);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0, 9, x1 - x0, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0, 0, x1 - x0, 0.8);
  } else if (st === 'mineral') {
    const g = ctx.createLinearGradient(0, 0, 0, 9); g.addColorStop(0, '#7ad8a0'); g.addColorStop(0.4, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 1); for (let x = x0; x <= x1; x += 5) ctx.lineTo(x, 0.5 + Math.sin(x * 0.6) * 1); ctx.lineTo(x1, 8); for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x, 8 + (Math.floor(x / 4) % 2) * 2.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(200,255,240,0.55)'; ctx.fillRect(x0 + 1, 1, x1 - x0 - 2, 1);
  } else if (st === 'carpet') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = G.capHi; for (let x = Math.ceil(x0); x < x1; x += 8) { ctx.beginPath(); ctx.moveTo(x + 4, 1.5); ctx.lineTo(x + 7, 4); ctx.lineTo(x + 4, 6.5); ctx.lineTo(x + 1, 4); ctx.fill(); }
    ctx.fillStyle = shade(G.cap, -0.35); ctx.fillRect(x0, 7, x1 - x0, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let x = Math.ceil(x0) + 2; x < x1; x += 3) ctx.fillRect(x, 8.4, 1, 2); // fringe
  } else if (st === 'paper') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = G.capHi; ctx.fillRect(x0, 0, x1 - x0, 1.4);
    ctx.fillStyle = 'rgba(40,40,70,0.35)'; ctx.fillRect(x0, 5, x1 - x0, 1);
    ctx.fillStyle = 'rgba(40,40,70,0.15)'; for (let x = x0 + 3; x < x1 - 3; x += 7 + rng() * 6) ctx.fillRect(x, 2.4, 3 + rng() * 4, 0.8);
  } else if (st === 'deck') {
    const g = ctx.createLinearGradient(0, 0, 0, 7); g.addColorStop(0, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = 'rgba(90,50,20,0.5)'; for (let x = Math.ceil(x0) + 7; x < x1; x += 8) ctx.fillRect(x, 0, 1, 7);
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x0, 7, x1 - x0, 1.6);
  } else if (st === 'ember') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.save(); ctx.shadowColor = G.capHi; ctx.shadowBlur = 6; ctx.fillStyle = G.capHi;
    for (let x = x0 + 2; x < x1 - 2; x += 4 + rng() * 6) ctx.fillRect(x, 1 + rng() * 4, 1.6 + rng() * 2, 1.4);
    ctx.restore();
  } else if (st === 'basalt') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.save(); ctx.shadowColor = G.capHi; ctx.shadowBlur = 6; ctx.fillStyle = G.capHi;
    for (let x = x0 + 2; x < x1 - 2; x += 5 + rng() * 6) ctx.fillRect(x, 5, 2 + rng() * 3, 1.2);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, 0, x1 - x0, 1);
  } else if (st === 'marble') {
    ctx.fillStyle = shade(G.dirt, 0.15); ctx.fillRect(x0, 0, x1 - x0, 7);
    const g = ctx.createLinearGradient(0, 0, 0, 4); g.addColorStop(0, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 7, x1 - x0, 1);
  } else if (st === 'stage') {
    ctx.fillStyle = '#34303a'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, 0, x1 - x0, 1);
    if (rng() < 0.4) { ctx.fillStyle = G.capHi; ctx.fillRect(6 + rng() * 12, 1, 10, 2); }
  } else if (st === 'pixel') {
    ctx.fillStyle = G.cap; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = G.capHi; for (let x = Math.ceil(x0); x < x1; x += 4) if (rng() < 0.5) ctx.fillRect(x, 0, 2, 2);
    ctx.fillStyle = '#003a24'; for (let x = Math.ceil(x0); x < x1; x += 4) if (rng() < 0.5) ctx.fillRect(x, 4, 4, 2);
  } else { // rock, castle
    const g = ctx.createLinearGradient(0, 0, 0, 6); g.addColorStop(0, G.capHi); g.addColorStop(1, G.cap);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 1);
    for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, 0.5 + rng() * 1.5);
    ctx.lineTo(x1, 6); ctx.lineTo(x0, 6); ctx.closePath(); ctx.fill();
  }
}

function paintIce(ctx, topOpen, style) {
  if (style === 'mud' || style === 'butter') {
    // slick surfaces: wet mud in the canyon, melted butter on the griddle row
    const mud = style === 'mud';
    const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, mud ? '#8a6040' : '#f8e08a'); g.addColorStop(1, mud ? '#4a3020' : '#d8a84a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = mud ? 'rgba(255,230,190,0.18)' : 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(6 + i * 7, 10 + (i % 2) * 9, 4, 2, 0.3, 0, TAU); ctx.fill(); }
    if (topOpen) { ctx.fillStyle = mud ? '#a87a52' : '#fff6c0'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= TS; x += 4) ctx.lineTo(x, 3 + Math.sin(x * 0.8) * 1.5); ctx.lineTo(TS, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(2, 0.5, TS - 4, 1.2); }
    return;
  }
  const g = ctx.createLinearGradient(0, 0, TS, TS);
  g.addColorStop(0, '#c8f0ff'); g.addColorStop(1, '#6ab8e0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4, TS - 6); ctx.lineTo(TS - 8, 4); ctx.moveTo(10, TS - 4); ctx.lineTo(TS - 4, 10); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,110,170,0.6)'; ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1);
  if (topOpen) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, TS, 3); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 3, TS, 1); }
}

function paintBrick(ctx, B) {
  if (typeof B.paint === 'function') { B.paint(ctx); return; }
  const st = B.style;
  ctx.fillStyle = B.mortar; ctx.fillRect(0, 0, TS, TS);
  const brickFace = (x, y, w, h, c) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(c, 0.12)); g.addColorStop(1, shade(c, -0.15));
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 1.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 1, y + 0.6, w - 2, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 1, y + h - 1.2, w - 2, 1);
  };
  if (st === 'plywood') {
    const g = ctx.createLinearGradient(0, 0, TS, TS); g.addColorStop(0, shade(B.c1, 0.1)); g.addColorStop(1, shade(B.c1, -0.12));
    ctx.fillStyle = g; rr(ctx, 0.6, 0.6, TS - 1.2, TS - 1.2, 2); ctx.fill();
    ctx.strokeStyle = rgba(B.c2, 0.45); ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(1, 5 + i * 7); ctx.bezierCurveTo(10, 3 + i * 7, 20, 8 + i * 7, TS - 1, 5 + i * 7); ctx.stroke(); }
    ctx.strokeStyle = shade(B.c2, -0.3); ctx.lineWidth = 1.4; ctx.strokeRect(1.2, 1.2, TS - 2.4, TS - 2.4);
    ctx.fillStyle = '#5a5a66'; for (const [x, y] of [[4, 4], [TS - 4, 4], [4, TS - 4], [TS - 4, TS - 4]]) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill(); }
    if (B.tags) { ctx.strokeStyle = rgba(B.mortar, 0.85); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(7, 20); ctx.quadraticCurveTo(12, 9, 16, 18); ctx.quadraticCurveTo(20, 26, 25, 12); ctx.stroke(); }
    if (B.charred) { const cg = ctx.createLinearGradient(0, TS, 0, 0); cg.addColorStop(0, 'rgba(0,0,0,0.6)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cg; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = 'rgba(255,110,40,0.75)'; ctx.fillRect(6, TS - 5, 4, 1.2); ctx.fillRect(18, TS - 3, 5, 1.2); }
  } else if (st === 'travertine') {
    for (let r = 0; r < 4; r++) { ctx.fillStyle = r % 2 ? B.c1 : shade(B.c1, -0.12); rr(ctx, 0.5, r * 8 + 0.5, TS - 1, 7, 3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,240,210,0.35)'; for (let r = 0; r < 4; r++) ctx.fillRect(2, r * 8 + 1.2, TS - 4, 1);
    ctx.fillStyle = 'rgba(80,200,170,0.35)'; ctx.fillRect(0, 0, TS, 2);
  } else if (st === 'lattice') {
    ctx.fillStyle = shade(B.c1, -0.15); ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = B.c1; rr(ctx, 1, 1, TS - 2, TS - 2, 2); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.moveTo(8 + i * 16, 3 + j * 16); ctx.lineTo(13 + i * 16, 8 + j * 16); ctx.lineTo(8 + i * 16, 13 + j * 16); ctx.lineTo(3 + i * 16, 8 + j * 16); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = rgba(B.mortar, 0.6); ctx.lineWidth = 1; ctx.strokeRect(1, 1, TS - 2, TS - 2);
  } else if (st === 'brick' || st === 'sandstone' || st === 'magma' || st === 'stone') {
    const rows = 4, h = TS / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? -TS / 4 : 0;
      for (let x = off; x < TS; x += TS / 2) brickFace(x + 0.8, r * h + 0.8, TS / 2 - 1.6, h - 1.6, r % 2 ? B.c1 : mix(B.c1, B.c2, 0.25));
    }
    if (st === 'magma') { ctx.save(); ctx.shadowColor = B.mortar; ctx.shadowBlur = 5; ctx.strokeStyle = rgba(B.mortar, 0.7); ctx.lineWidth = 0.8; ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1); ctx.restore(); }
  } else if (st === 'plank') {
    for (let r = 0; r < 3; r++) brickFace(0.5, r * TS / 3 + 0.5, TS - 1, TS / 3 - 1, r % 2 ? B.c1 : shade(B.c1, -0.08));
    ctx.fillStyle = B.c2; [[4, 5], [TS - 4, 5], [4, TS - 5], [TS - 4, TS - 5]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = rgba(B.c2, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(TS - 2, TS - 2); ctx.stroke();
  } else if (st === 'panel' || st === 'copper' || st === 'amp') {
    brickFace(0.5, 0.5, TS - 1, TS - 1, B.c1);
    ctx.strokeStyle = rgba(B.c2, 0.9); ctx.lineWidth = 1; ctx.strokeRect(3.5, 3.5, TS - 7, TS - 7);
    if (st === 'amp') {
      ctx.fillStyle = '#0a0a0e'; rr(ctx, 4, 4, TS - 8, TS - 8, 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; for (let i = 6; i < TS - 6; i += 3) { ctx.beginPath(); ctx.moveTo(5, i); ctx.lineTo(TS - 5, i); ctx.stroke(); }
    } else {
      ctx.fillStyle = st === 'panel' ? rgba(B.mortar, 0.85) : shade(B.c1, 0.3);
      [[3, 3], [TS - 3, 3], [3, TS - 3], [TS - 3, TS - 3]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill(); });
      if (st === 'panel') { ctx.save(); ctx.shadowColor = B.mortar; ctx.shadowBlur = 4; ctx.fillStyle = B.mortar; ctx.fillRect(8, TS / 2 - 0.5, TS - 16, 1); ctx.restore(); }
    }
  } else if (st === 'ice') {
    paintIce(ctx, false);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(TS, 16); ctx.moveTo(16, 0); ctx.lineTo(16, 16); ctx.moveTo(8, 16); ctx.lineTo(8, 32); ctx.stroke();
  } else if (st === 'rune') {
    brickFace(0.5, 0.5, TS - 1, TS - 1, B.c1);
    ctx.save(); ctx.shadowColor = B.mortar; ctx.shadowBlur = 5; ctx.strokeStyle = B.mortar; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(16, 8); ctx.lineTo(10, 16); ctx.lineTo(16, 24); ctx.lineTo(22, 16); ctx.closePath(); ctx.moveTo(16, 8); ctx.lineTo(16, 24); ctx.stroke(); ctx.restore();
  } else if (st === 'pixel') {
    for (let y = 0; y < TS; y += 8) for (let x = 0; x < TS; x += 8) { ctx.fillStyle = (x + y) % 16 ? B.c1 : B.c2; ctx.fillRect(x, y, 8, 8); }
    ctx.strokeStyle = '#000'; ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1);
  } else { brickFace(0.5, 0.5, TS - 1, TS - 1, B.c1); }
}

function paintQBlock(ctx, th, f) {
  // a glowing wrapped gift (the playa runs on gifting)
  const paper = '#ff4f8a', paper2 = '#c81e5a', ribbon = '#ffe24a';
  ctx.save();
  ctx.shadowColor = 'rgba(255,200,90,0.85)'; ctx.shadowBlur = 4 + f * 1.6;
  const g = ctx.createLinearGradient(0, 0, 0, TS);
  g.addColorStop(0, shade(paper, 0.25)); g.addColorStop(0.6, paper); g.addColorStop(1, paper2);
  ctx.fillStyle = g; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#6a0a2a'; ctx.lineWidth = 1.2; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.stroke();
  // polka dots
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [x, y] of [[7, 9], [24, 11], [9, 24], [25, 26], [16, 18]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
  // ribbon cross
  const rg = ctx.createLinearGradient(0, 0, TS, 0); rg.addColorStop(0, '#d8a81a'); rg.addColorStop(0.5, ribbon); rg.addColorStop(1, '#c8901a');
  ctx.fillStyle = rg; ctx.fillRect(TS / 2 - 3, 3, 6, TS - 4); ctx.fillRect(1, TS / 2 - 1, TS - 2, 6);
  // bow
  ctx.fillStyle = ribbon;
  ctx.beginPath(); ctx.ellipse(TS / 2 - 5, 3, 5, 3, -0.5, 0, TAU); ctx.ellipse(TS / 2 + 5, 3, 5, 3, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(TS / 2, 3.5, 2.2, 0, TAU); ctx.fill();
  // shimmer sweep
  const sx = -10 + f * 14;
  ctx.save(); rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 6, 0); ctx.lineTo(sx - 6, TS); ctx.lineTo(sx - 12, TS); ctx.fill();
  ctx.restore();
}

function paintUsed(ctx) {
  // an opened, flattened gift box
  const g = ctx.createLinearGradient(0, 0, 0, TS);
  g.addColorStop(0, '#b89a7a'); g.addColorStop(1, '#7a5e44');
  ctx.fillStyle = g; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.fill();
  ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(TS / 2 - 3, 2, 6, TS - 3);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(3, 3, TS - 6, 1.4);
  ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(TS - 4, 8); ctx.stroke();
}

function paintHard(ctx, H) {
  if (typeof H.paint === 'function') { H.paint(ctx); return; }
  ctx.fillStyle = H.c2; ctx.fillRect(0, 0, TS, TS);
  // bevelled pyramid block
  ctx.fillStyle = shade(H.c1, 0.25); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TS, 0); ctx.lineTo(TS - 6, 6); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(H.c1, 0.1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 6); ctx.lineTo(6, TS - 6); ctx.lineTo(0, TS); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(H.c2, -0.25); ctx.beginPath(); ctx.moveTo(TS, 0); ctx.lineTo(TS, TS); ctx.lineTo(TS - 6, TS - 6); ctx.lineTo(TS - 6, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(H.c2, -0.4); ctx.beginPath(); ctx.moveTo(0, TS); ctx.lineTo(6, TS - 6); ctx.lineTo(TS - 6, TS - 6); ctx.lineTo(TS, TS); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(6, 6, TS - 6, TS - 6);
  g.addColorStop(0, H.c1); g.addColorStop(1, mix(H.c1, H.c2, 0.6));
  ctx.fillStyle = g; ctx.fillRect(6, 6, TS - 12, TS - 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, TS - 1, TS - 1);
}

function paintSemi(ctx, P, part) {
  const st = P.style;
  const l = part === 'L' || part === 'S', r = part === 'R' || part === 'S';
  const x0 = l ? 2 : 0, x1 = r ? TS - 2 : TS;
  if (typeof P.paint === 'function') { P.paint(ctx, part, x0, x1); return; }
  if (st === 'cloud') {
    ctx.fillStyle = P.c2;
    ctx.beginPath(); ctx.ellipse(16, 9, 18, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = P.c1;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(4 + i * 12 + (l && i === 0 ? 4 : 0) - (r && i === 2 ? 4 : 0), 5 + (i % 2) * 2, 8, 0, TAU); ctx.fill(); }
    ctx.fillRect(x0 + 4, 2, x1 - x0 - 8, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x0 + 4, 0.5, x1 - x0 - 8, 1.5);
    return;
  }
  if (st === 'neon') {
    ctx.fillStyle = P.c2; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.save(); ctx.shadowColor = P.c1; ctx.shadowBlur = 8; ctx.fillStyle = P.c1; ctx.fillRect(x0, 0, x1 - x0, 2); ctx.fillRect(x0, 6, x1 - x0, 1); ctx.restore();
    if (l) { ctx.fillStyle = P.c1; ctx.fillRect(x0, 0, 2, 7); }
    if (r) { ctx.fillStyle = P.c1; ctx.fillRect(x1 - 2, 0, 2, 7); }
    return;
  }
  if (st === 'log') {
    const g = ctx.createLinearGradient(0, 0, 0, 12); g.addColorStop(0, shade(P.c1, 0.2)); g.addColorStop(1, P.c2);
    ctx.fillStyle = g; rr(ctx, x0, 0, x1 - x0, 11, l || r ? 5 : 0); ctx.fill();
    ctx.strokeStyle = rgba(P.c2, 0.8); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0 + 3, 4); ctx.lineTo(x1 - 3, 4); ctx.moveTo(x0 + 6, 7.5); ctx.lineTo(x1 - 6, 7.5); ctx.stroke();
    if (l) { ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(x0 + 3, 5.5, 3, 5.5, 0, 0, TAU); ctx.fill(); }
    if (r) { ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(x1 - 3, 5.5, 3, 5.5, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4caf50'; if (!l && !r) { ctx.beginPath(); ctx.arc(16, 1, 3, Math.PI, TAU); ctx.fill(); }
    return;
  }
  if (st === 'scaffold') {
    ctx.fillStyle = P.c2; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = P.c1; ctx.fillRect(x0, 0, x1 - x0, 1.6);
    ctx.strokeStyle = P.c1; ctx.lineWidth = 1.4; ctx.beginPath();
    ctx.moveTo(x0, 9); ctx.lineTo(x1, 9);
    for (let x = x0; x < x1; x += 8) { ctx.moveTo(x, 2); ctx.lineTo(x + 8, 9); }
    ctx.stroke();
    if (l || r) { ctx.fillStyle = '#c84a2a'; ctx.fillRect(l ? x0 : x1 - 3, 0, 3, 10); }
    return;
  }
  if (st === 'shade') {
    // shade cloth stretched over a frame, with a scalloped edge
    ctx.fillStyle = P.c2; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = P.c1; ctx.beginPath(); ctx.moveTo(x0, 1); ctx.lineTo(x1, 1); ctx.lineTo(x1, 6);
    for (let x = x1; x >= x0; x -= 8) ctx.quadraticCurveTo(x - 4, 11, x - 8, 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0, 1, x1 - x0, 1);
    return;
  }
  if (st === 'plank' || st === 'mossy') {
    const g = ctx.createLinearGradient(0, 0, 0, 8); g.addColorStop(0, shade(P.c1, 0.15)); g.addColorStop(1, P.c2);
    ctx.fillStyle = g; rr(ctx, x0, 0, x1 - x0, 8, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = x0 + 10; x < x1; x += 11) ctx.fillRect(x, 0, 1, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x0 + 1, 0.8, x1 - x0 - 2, 1);
    if (st === 'mossy') { ctx.fillStyle = '#7ad86a'; for (let x = x0 + 2; x < x1; x += 5) { ctx.beginPath(); ctx.arc(x, 0.5, 2, Math.PI, TAU); ctx.fill(); } }
    if (l) { ctx.fillStyle = P.c2; ctx.fillRect(x0 + 3, 8, 3, 10); } if (r) { ctx.fillStyle = P.c2; ctx.fillRect(x1 - 6, 8, 3, 10); }
    return;
  }
  if (st === 'grate' || st === 'metal' || st === 'truss') {
    ctx.fillStyle = P.c2; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = P.c1; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.strokeStyle = P.c1; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = x0; x < x1; x += 6) { ctx.moveTo(x, 2); ctx.lineTo(x + 6, 8); ctx.moveTo(x + 6, 2); ctx.lineTo(x, 8); }
    ctx.stroke(); ctx.fillRect(x0, 7, x1 - x0, 1.5);
    return;
  }
  if (st === 'bone') {
    ctx.fillStyle = P.c1; rr(ctx, x0, 1, x1 - x0, 7, 3.5); ctx.fill();
    if (l) { ctx.beginPath(); ctx.arc(x0 + 2, 1.5, 3, 0, TAU); ctx.arc(x0 + 2, 7.5, 3, 0, TAU); ctx.fill(); }
    if (r) { ctx.beginPath(); ctx.arc(x1 - 2, 1.5, 3, 0, TAU); ctx.arc(x1 - 2, 7.5, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 2, 6, x1 - x0 - 4, 1.5);
    return;
  }
  // wood / ice / coral generic slab
  const g = ctx.createLinearGradient(0, 0, 0, 10); g.addColorStop(0, shade(P.c1, 0.15)); g.addColorStop(1, P.c2);
  ctx.fillStyle = g; rr(ctx, x0, 0, x1 - x0, 10, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0 + 1, 0.8, x1 - x0 - 2, 1.2);
  if (st === 'wood') {
    ctx.fillStyle = rgba(P.c2, 0.9); ctx.fillRect(x0, 4.5, x1 - x0, 0.8);
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(x0 + 4, 7, 1, 0, TAU); ctx.arc(x1 - 4, 7, 1, 0, TAU); ctx.fill();
    // support struts under ends
    ctx.strokeStyle = rgba(P.c2, 0.9); ctx.lineWidth = 2;
    if (l) { ctx.beginPath(); ctx.moveTo(x0 + 4, 10); ctx.lineTo(x0 + 10, 18); ctx.stroke(); }
    if (r) { ctx.beginPath(); ctx.moveTo(x1 - 4, 10); ctx.lineTo(x1 - 10, 18); ctx.stroke(); }
  } else if (st === 'ice') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x0, 0, x1 - x0, 2);
    for (let x = x0 + 4; x < x1 - 2; x += 7) { ctx.fillStyle = 'rgba(200,240,255,0.85)'; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 1.5, 15); ctx.lineTo(x + 3, 10); ctx.fill(); }
  } else if (st === 'coral') {
    ctx.fillStyle = '#ffd0a0'; for (let x = x0 + 3; x < x1; x += 6) { ctx.beginPath(); ctx.arc(x, 1, 1.6, 0, TAU); ctx.fill(); }
  }
}

function paintSpikes(ctx, ceil, style) {
  // rusty rebar sticking out of the playa (the reason everyone caps their rebar)
  ctx.save();
  if (ceil) { ctx.translate(0, TS); ctx.scale(1, -1); }
  if (style === 'crystal' || style === 'neon' || style === 'ink') {
    const cols = style === 'crystal' ? ['#c8a0ff', '#7affd8', '#e8d0ff'] : style === 'neon' ? ['#ff4fd8', '#38f2ff', '#ffffff'] : ['#1a1a2a', '#3a3a5a', '#12121e'];
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 8, h = 16 + ((i * 7) % 3) * 4;
      if (style === 'neon') { ctx.shadowColor = cols[i % 2]; ctx.shadowBlur = 6; }
      ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.moveTo(x - 4, TS); ctx.lineTo(x - 1, TS - h); ctx.lineTo(x + 1, TS - h); ctx.lineTo(x + 4, TS); ctx.closePath(); ctx.fill();
      if (style !== 'ink') { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(x - 1, TS - 3); ctx.lineTo(x - 0.5, TS - h + 2); ctx.lineTo(x + 0.5, TS - h + 4); ctx.fill(); }
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = 'rgba(70,50,40,0.6)'; ctx.beginPath(); ctx.ellipse(TS / 2, TS - 2, TS / 2, 3, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 8, h = 18 + (i % 2) * 6, lean = (i - 1.5) * 1.2;
    const g = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
    g.addColorStop(0, '#5a2e1a'); g.addColorStop(0.5, '#b06a3a'); g.addColorStop(1, '#4a2414');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 1.8, TS - 2); ctx.lineTo(x - 1 + lean, TS - 2 - h); ctx.lineTo(x + 1 + lean, TS - 2 - h); ctx.lineTo(x + 1.8, TS - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,0.6)'; ctx.lineWidth = 0.6;
    for (let k = 4; k < h; k += 3) { ctx.beginPath(); ctx.moveTo(x - 1.6 + lean * k / h, TS - 2 - k); ctx.lineTo(x + 1.6 + lean * k / h, TS - 3 - k); ctx.stroke(); }
    ctx.fillStyle = '#e8d0b0'; ctx.beginPath(); ctx.arc(x + lean, TS - 2 - h, 1.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function paintConveyor(ctx, dir, f) {
  ctx.fillStyle = '#2a2a30'; rr(ctx, 0, 0, TS, TS, 3); ctx.fill();
  ctx.fillStyle = '#1a1a1e'; ctx.fillRect(0, 0, TS, 8);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, TS, 8); ctx.clip();
  ctx.fillStyle = '#f2c23a';
  const off = (f / 4) * 8 * dir;
  for (let x = -16; x < TS + 16; x += 8) {
    const X = x + off;
    ctx.beginPath();
    if (dir > 0) { ctx.moveTo(X, 1.5); ctx.lineTo(X + 3, 4); ctx.lineTo(X, 6.5); ctx.lineTo(X + 2, 6.5); ctx.lineTo(X + 5, 4); ctx.lineTo(X + 2, 1.5); }
    else { ctx.moveTo(X + 5, 1.5); ctx.lineTo(X + 2, 4); ctx.lineTo(X + 5, 6.5); ctx.lineTo(X + 3, 6.5); ctx.lineTo(X, 4); ctx.lineTo(X + 3, 1.5); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const cx = 6 + i * 10, cy = 19;
    ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.beginPath();
    const a = f / 4 * TAU / 2 * dir; ctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4); ctx.lineTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 8, TS, 1);
}

function paintCrumble(ctx, th) {
  const c = mix(th.brick.c1, '#d8b080', 0.5);
  const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, shade(c, 0.15)); g.addColorStop(1, shade(c, -0.25));
  ctx.fillStyle = g; rr(ctx, 1, 1, TS - 2, TS - 2, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(12, 12); ctx.lineTo(8, 20); ctx.lineTo(14, 31);
  ctx.moveTo(12, 12); ctx.lineTo(24, 9); ctx.lineTo(31, 14); ctx.moveTo(8, 20); ctx.lineTo(1, 22);
  ctx.moveTo(24, 9); ctx.lineTo(22, 22); ctx.lineTo(28, 31); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(3, 2, TS - 6, 1.2);
}

function paintPillar(ctx, P, part, isTop) {
  const st = P.style || 'column';
  // a pillar is drawn as halves: L = left half of a 2-wide column, R = right half, S = single 1-wide
  const full = part === 'S' ? TS : TS * 2;
  const ox = part === 'R' ? -TS : 0;
  ctx.save(); ctx.beginPath(); ctx.rect(0, isTop ? -TPAD : 0, TS, TS + (isTop ? TPAD : 0)); ctx.clip();
  ctx.translate(ox, 0);
  const inset = 3;
  const g = ctx.createLinearGradient(inset, 0, full - inset, 0);
  g.addColorStop(0, shade(P.c2, -0.1)); g.addColorStop(0.3, shade(P.c1, 0.25)); g.addColorStop(0.55, P.c1); g.addColorStop(1, shade(P.c2, -0.3));
  ctx.fillStyle = g;
  if (st === 'portapotty') {
    const g2 = ctx.createLinearGradient(inset, 0, full - inset, 0); g2.addColorStop(0, shade(P.c1, -0.35)); g2.addColorStop(0.45, shade(P.c1, 0.2)); g2.addColorStop(1, shade(P.c1, -0.4));
    ctx.fillStyle = g2; ctx.fillRect(inset, 0, full - inset * 2, TS);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = inset + 5; x < full - inset; x += 6) ctx.fillRect(x, 0, 1.2, TS);
    if (isTop) { ctx.fillStyle = P.cap; rr(ctx, inset - 2, -3, full - inset * 2 + 4, 8, 3); ctx.fill(); ctx.fillStyle = shade(P.c1, -0.2); ctx.fillRect(full / 2 - 6, 8, 12, 6); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(full / 2 - 1, 11, 2.2, 0.6, 5.7); ctx.fill(); }
  } else if (st === 'barrel') {
    const g2 = ctx.createLinearGradient(inset, 0, full - inset, 0); g2.addColorStop(0, '#1e1e24'); g2.addColorStop(0.45, '#4a4a56'); g2.addColorStop(1, '#16161c');
    ctx.fillStyle = g2; ctx.fillRect(inset, 0, full - inset * 2, TS);
    ctx.fillStyle = '#2a2a32'; ctx.fillRect(inset, 8, full - inset * 2, 2); ctx.fillRect(inset, 22, full - inset * 2, 2);
    ctx.fillStyle = 'rgba(255,110,40,0.6)'; for (let i = 0; i < 3; i++) ctx.fillRect(inset + 4 + i * 8, 14, 3, 3);
    if (isTop) { ctx.save(); ctx.shadowColor = '#ff7a2a'; ctx.shadowBlur = 10; ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.ellipse(full / 2, 0, full / 2 - inset, 4, 0, 0, TAU); ctx.fill(); ctx.restore();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ffd84a', '#ff7a2a', '#ffb84a', '#fff2a0'][i]; ctx.beginPath(); ctx.moveTo(inset + 4 + i * 6, 0); ctx.quadraticCurveTo(inset + 6 + i * 6, -10 - (i % 2) * 4, inset + 8 + i * 6, 0); ctx.fill(); } }
  } else if (st === 'pole' || st === 'carved' || st === 'geyser' || st === 'shroom') {
    const base = st === 'geyser' ? '#c8743a' : st === 'shroom' ? '#f4eadc' : P.c1;
    const g2 = ctx.createLinearGradient(inset, 0, full - inset, 0); g2.addColorStop(0, shade(base, -0.3)); g2.addColorStop(0.4, shade(base, 0.2)); g2.addColorStop(1, shade(base, -0.4));
    ctx.fillStyle = g2; ctx.fillRect(inset, 0, full - inset * 2, TS);
    if (st === 'pole') { ctx.strokeStyle = rgba(P.c2, 0.9); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(inset, 0); ctx.lineTo(full - inset, TS); ctx.moveTo(full - inset, 0); ctx.lineTo(inset, TS); ctx.stroke(); }
    if (st === 'carved') { ctx.fillStyle = 'rgba(90,50,20,0.45)'; for (let y = 4; y < TS; y += 9) { ctx.beginPath(); ctx.moveTo(full / 2, y); ctx.lineTo(full / 2 + 4, y + 4); ctx.lineTo(full / 2, y + 8); ctx.lineTo(full / 2 - 4, y + 4); ctx.fill(); } }
    if (st === 'geyser') { for (let y = 0; y < TS; y += 6) { ctx.fillStyle = (y / 6) % 2 ? 'rgba(255,190,110,0.3)' : 'rgba(120,40,20,0.25)'; ctx.fillRect(inset, y, full - inset * 2, 3); } }
    if (isTop) {
      ctx.fillStyle = st === 'shroom' ? `hsl(${(full * 37) % 360},80%,55%)` : P.cap;
      if (st === 'shroom') { ctx.beginPath(); ctx.ellipse(full / 2, 2, full / 2 + 2, 9, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(full / 2 - 5, -2, 2, 0, TAU); ctx.arc(full / 2 + 6, -1, 1.6, 0, TAU); ctx.fill(); }
      else { rr(ctx, 0, -2, full, 9, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(3, -1, full - 6, 1.2); }
    }
  } else if (st === 'stump') {
    ctx.fillRect(inset, 0, full - inset * 2, TS);
    ctx.strokeStyle = rgba(P.c2, 0.6); ctx.lineWidth = 1.2;
    for (let x = inset + 5; x < full - inset; x += 7) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 1, TS); ctx.stroke(); }
    if (isTop) {
      ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(full / 2, 2, full / 2 - inset + 1, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,40,0.6)'; for (let r = 3; r < full / 2 - 4; r += 4) { ctx.beginPath(); ctx.ellipse(full / 2, 2, r, r * 0.3, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = P.cap; ctx.beginPath(); ctx.ellipse(full * 0.3, -1, 6, 3, 0, 0, TAU); ctx.fill();
    }
  } else if (st === 'speaker') {
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(inset - 1, 0, full - inset * 2 + 2, TS);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(inset, 0.5, full - inset * 2, TS - 1);
    const cx = full / 2, r = Math.min(full / 2 - 7, 12);
    ctx.fillStyle = '#050508'; ctx.beginPath(); ctx.arc(cx, TS / 2, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(cx, TS / 2, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(cx, TS / 2, r * 0.35, 0, TAU); ctx.fill();
    if (isTop) { ctx.fillStyle = P.cap; ctx.fillRect(inset - 1, 0, full - inset * 2 + 2, 2); }
  } else if (st === 'pixel') {
    for (let y = 0; y < TS; y += 8) for (let x = inset; x < full - inset; x += 8) { ctx.fillStyle = (x / 8 + y / 8) % 2 ? P.c1 : P.c2; ctx.fillRect(x, y, 8, 8); }
    if (isTop) { ctx.fillStyle = P.cap; ctx.fillRect(inset - 2, 0, full - inset * 2 + 4, 6); }
  } else {
    ctx.fillRect(inset, 0, full - inset * 2, TS);
    if (st === 'pipe') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(inset, TS / 2 - 2, full - inset * 2, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(inset, TS / 2 - 2, full - inset * 2, 1);
    } else if (st === 'coral') {
      ctx.fillStyle = rgba(P.cap, 0.5); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(inset + 4 + ((i * 11) % (full - 12)), 6 + i * 7, 2, 0, TAU); ctx.fill(); }
    } else if (st === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(inset + 4, 0, 3, TS);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = inset + 6; x < full - inset - 3; x += 7) ctx.fillRect(x, 0, 2, TS);
    }
    if (isTop) {
      const cg = ctx.createLinearGradient(0, -2, 0, 9);
      cg.addColorStop(0, shade(P.cap, 0.3)); cg.addColorStop(1, shade(P.cap, -0.25));
      ctx.fillStyle = cg; rr(ctx, 0, -2, full, 10, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; rr(ctx, 0, -2, full, 10, 3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(3, -1, full - 6, 1.2);
      if (st === 'ice') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -3, full, 3); }
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inset, isTop ? 8 : 0); ctx.lineTo(inset, TS); ctx.moveTo(full - inset, isTop ? 8 : 0); ctx.lineTo(full - inset, TS); ctx.stroke();
  ctx.restore();
}

function paintGlitch(ctx, f) {
  const rng = mulberry32(77 + f * 991);
  for (let y = 0; y < TS; y += 4) for (let x = 0; x < TS; x += 4) {
    const r = rng();
    ctx.fillStyle = r < 0.3 ? '#ff00d4' : r < 0.6 ? '#00ff9a' : r < 0.8 ? '#000' : '#fff';
    ctx.fillRect(x + (rng() < 0.1 ? 2 : 0), y, 4, 4);
  }
}

/* ---------- autotile variant computation ---------- */
function computeVariants(area) {
  const W = area.W, H = area.H, tiles = area.tiles;
  const v = new Uint8Array(W * H);
  const gl = (x, y) => {
    if (x < 0 || x >= W) return true;
    if (y >= H) return true;
    if (y < 0) return false;
    return GROUNDLIKE[tiles[y * W + x]] === 1;
  };
  const pil = (x, y) => x >= 0 && x < W && y >= 0 && y < H && tiles[y * W + x] === T.PILLAR;
  const semi = (x, y) => x >= 0 && x < W && y >= 0 && y < H && tiles[y * W + x] === T.SEMI;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = tiles[y * W + x];
    let m = 0;
    if (GROUNDLIKE[t]) {
      if (!gl(x, y - 1)) m |= 1; if (!gl(x + 1, y)) m |= 2; if (!gl(x, y + 1)) m |= 4; if (!gl(x - 1, y)) m |= 8;
      m += (((x * 7 + y * 13) >> 1) & 1) * 16;
    } else if (t === T.ICE) {
      m = (y > 0 && tiles[(y - 1) * W + x] !== T.ICE && !SOLID[tiles[(y - 1) * W + x]]) ? 1 : 0;
    } else if (t === T.PILLAR) {
      // pair columns two-by-two from the left edge of each run
      let run = 0; let xx = x; while (pil(xx - 1, y)) { xx--; run++; }
      let len = 1; while (pil(xx + len, y)) len++;
      const idx = x - xx;
      let part = 'S';
      if (len >= 2) { if (len % 2 === 1 && idx === len - 1) part = 'S'; else part = idx % 2 === 0 ? 'L' : 'R'; }
      const top = !pil(x, y - 1);
      m = ({ L: 0, R: 1, S: 2 })[part] + (top ? 4 : 0);
    } else if (t === T.SEMI) {
      const l = semi(x - 1, y), r = semi(x + 1, y);
      m = l && r ? 1 : l ? 2 : r ? 0 : 3; // 0=L 1=M 2=R 3=S
    }
    v[y * W + x] = m;
  }
  area.variants = v;
}
