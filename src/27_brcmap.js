/* ============================================================
   SUPER BRADY-O WORLD — the overworld map scene (BRCMapScene)
   A painted map of the playa and its surroundings: ten lands joined
   by paths, secret trails and two rainbow bridges, with the Man on
   his saucer in the middle. The layout and the land art live in
   27_brcmap_land.js (OW, owPaint*, owLive*, owIcon).
   Static layers are cached as 256px tiles (close view) and one
   whole-map canvas (overview); only the living bits redraw.
   ============================================================ */
const BRCM = {
  B: { x0: 0, y0: 0, x1: 1200, y1: 1080 },         // the map sheet; keep in step with OW.W x OW.H
  TILE: 256,                                         // tile size, device px
  TILE_MAX: 120,                                     // tile canvases kept (256 KB each)
  NIGHT: '#120b1b',
  LIGHTS: ['#ff4fd8', '#4af2ff', '#ffd84a', '#7dff6a', '#ff7a3a', '#a07bff', '#fff1d6', '#ff5a7a'],
  TYPE: { ow: 'Overworld', under: 'Underground', sky: 'Sky', water: 'Underwater', tower: 'Tower climb', castle: 'Boss', auto: 'Auto-scroll' }
};
const BRCM_RB = { x0: BRCM.B.x0 - 90, y0: BRCM.B.y0 - 90, x1: BRCM.B.x1 + 90, y1: BRCM.B.y1 + 90 };   // rendered area
function brcmLand(w) { return (typeof WORLD_LANDS !== 'undefined' && WORLD_LANDS.find(L => L.id === w)) || { id: w, name: (WORLDS[w] && WORLDS[w].name) || 'Land ' + w, tag: '', color: '#ff4fd8' }; }
const BRCM_PAL = {
  tent: ['#e8553f', '#f29a3a', '#f3d046', '#38b2a2', '#3a78d4', '#8b5bd6', '#d6458f', '#5dbb48', '#ece5d8', '#2fa3c7', '#c43c5c', '#f07b52'],
  shade: ['#e2e6ec', '#d6dae1', '#2d2a36', '#cbb690', '#ebe6dc', '#4a3f5e', '#e0e4ea'],
  dome: ['#f0f2f7', '#e4e8f0', '#f3dfb2', '#c9d8f2', '#ead2ea', '#f4f4f4'],
  rv: ['#f2f0e9', '#e8e0d0', '#f7f4ed', '#ded7c7', '#d2d8df'],
  stripe: ['#c0392b', '#2c6fbb', '#2e8b57', '#d68a1f', '#6d4bb3', '#1f8a8a'],
  box: ['#b5482f', '#2f62a6', '#3e7d4f', '#c58b2a', '#7a7f87', '#8a3b6b'],
  para: [['#e8553f', '#f3d046'], ['#3a78d4', '#ece5d8'], ['#d6458f', '#8b5bd6'], ['#38b2a2', '#f29a3a'], ['#5dbb48', '#f3d046']]
};

const BRCM_CACHE = { key: '', tiles: new Map(), pool: [], base: null };

const BRCM_SPR = {};

function brcmHash(a, b, c) {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(((b | 0) + 0x632be5ab) | 0, 0xc2b2ae35) ^ Math.imul(((c | 0) + 0x27d4eb2f) | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function brcmNoise(x, y, cell, seed) {      // smooth value noise, 0..1
  const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy);
  const fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const s = seed || 7;
  return lerp(lerp(brcmHash(ix, iy, s), brcmHash(ix + 1, iy, s), sx), lerp(brcmHash(ix, iy + 1, s), brcmHash(ix + 1, iy + 1, s), sx), sy);
}

function brcmPolyline(pts) {               // -> { pts, cum, len }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

function brcmResample(pts, step) {
  const pl = brcmPolyline(pts), n = Math.max(1, Math.round(pl.len / step)), out = [];
  for (let k = 0; k <= n; k++) out.push(brcmAlong(pl, pl.len * k / n));
  return out;
}

function brcmAlong(pl, s) {                // point (and heading) at distance s along a polyline
  const { pts, cum } = pl;
  if (s <= 0) { const a = pts[0], b = pts[1] || a; return { x: a.x, y: a.y, dx: b.x - a.x, dy: b.y - a.y }; }
  if (s >= pl.len) { const a = pts[pts.length - 2] || pts[pts.length - 1], b = pts[pts.length - 1]; return { x: b.x, y: b.y, dx: b.x - a.x, dy: b.y - a.y }; }
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], k = (s - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), dx: b.x - a.x, dy: b.y - a.y };
}

function brcmGlow(col, kind) {            // 64px radial glow; kind: 0 = hot core, 1 = soft halo
  const key = col + '|' + (kind || 0);
  if (BRCM_SPR[key]) return BRCM_SPR[key];
  const c = makeCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (kind === 2) { g.addColorStop(0, rgba(mix(col, '#ffffff', 0.55), 1)); g.addColorStop(0.13, rgba(col, 0.92)); g.addColorStop(0.3, rgba(col, 0.3)); g.addColorStop(0.62, rgba(col, 0.07)); g.addColorStop(1, rgba(col, 0)); }
  else if (kind) { g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(0.35, rgba(col, 0.24)); g.addColorStop(1, rgba(col, 0)); }
  else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.1, rgba(col, 0.95)); g.addColorStop(0.32, rgba(col, 0.34)); g.addColorStop(1, rgba(col, 0)); }
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (BRCM_SPR[key] = c);
}

function brcmCloud() {                    // soft dust cloud for the drifting haze
  if (BRCM_SPR.cloud) return BRCM_SPR.cloud;
  const c = makeCanvas(256, 256), x = c.getContext('2d'), rng = mulberry32(77);
  for (let i = 0; i < 26; i++) {
    const a = rng() * TAU, d = rng() * 70, px = 128 + Math.cos(a) * d, py = 128 + Math.sin(a) * d * 0.7, r = rng.range(30, 62);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(236,218,204,0.22)'); g.addColorStop(1, 'rgba(236,218,204,0)');
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  return (BRCM_SPR.cloud = c);
}

function brcmCracks(ctx, R, s, hi, cell) {
  const H = cell || 6.2, hw = H * Math.sqrt(3), vh = H * 1.5, J = H * 0.3;
  const j0 = Math.floor((R.y0 - H) / vh) - 1, j1 = Math.ceil((R.y1 + H) / vh) + 1;
  const i0 = Math.floor((R.x0 - hw) / hw) - 1, i1 = Math.ceil((R.x1 + hw) / hw) + 1;
  const cs = [], faint = new Path2D(), strong = new Path2D(), lite = new Path2D(), dark = new Path2D();
  const corner = (x, y) => { const kx = Math.round(x * 4), ky = Math.round(y * 4); return { x: x + (brcmHash(kx, ky, 11) - 0.5) * 2 * J, y: y + (brcmHash(kx, ky, 12) - 0.5) * 2 * J }; };
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = hw * (i + 0.5 * (j & 1)), cy = vh * j;
    for (let k = 0; k < 6; k++) { const a = (60 * k - 30) * Math.PI / 180; cs[k] = corner(cx + Math.cos(a) * H, cy + Math.sin(a) * H); }
    if (hi) {
      const h = brcmHash(i, j, 5);
      if (h < 0.34) { const p = h < 0.17 ? lite : dark; p.moveTo(cs[0].x, cs[0].y); for (let k = 1; k < 6; k++) p.lineTo(cs[k].x, cs[k].y); p.closePath(); }
    }
    for (let k = 0; k < 3; k++) {
      const a = cs[k], b = cs[k + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const n = brcmNoise(mx, my, 60, 3);
      if (n < 0.26 || (!hi && n < 0.5)) continue;
      const dx = b.y - a.y, dy = a.x - b.x, w = (brcmHash(Math.round(mx * 4), Math.round(my * 4), 13) - 0.5) * 0.34;
      const p = n > 0.56 ? strong : faint;
      p.moveTo(a.x, a.y); p.quadraticCurveTo(mx + dx * w, my + dy * w, b.x, b.y);
    }
  }
  if (hi) { ctx.fillStyle = 'rgba(255,250,240,0.05)'; ctx.fill(lite); ctx.fillStyle = 'rgba(80,56,76,0.045)'; ctx.fill(dark); }
  const lw = Math.max(hi ? 0.3 : 0.4, 0.8 / s);
  if (hi) { ctx.strokeStyle = 'rgba(84,58,70,0.17)'; ctx.lineWidth = lw; ctx.stroke(faint); }
  ctx.strokeStyle = hi ? 'rgba(80,52,66,0.38)' : 'rgba(80,52,66,0.15)'; ctx.lineWidth = lw * 1.25; ctx.stroke(strong);
  if (hi) {
    ctx.save(); ctx.translate(0.26, 0.26);
    ctx.strokeStyle = 'rgba(255,248,236,0.17)'; ctx.lineWidth = lw * 0.75; ctx.stroke(faint); ctx.stroke(strong);
    ctx.restore();
  }
}

function brcmItem(ctx, it, s, ox, oy, hi) {
  const t = it.t;
  let shx = 0.3, shy = 0.36;               // shadow offset (world space: light comes from the upper left)
  if (t === 'tent' || t === 'dome' || t === 'para' || t === 'yurt' || t === 'flag') ctx.setTransform(s, 0, 0, s, ox + it.x * s, oy + it.y * s);
  else {
    const ca = Math.cos(it.a), sa = Math.sin(it.a);
    ctx.setTransform(s * ca, s * sa, -s * sa, s * ca, ox + it.x * s, oy + it.y * s);
    shx = 0.3 * ca + 0.36 * sa; shy = -0.3 * sa + 0.36 * ca;
  }
  const shadowRect = (w, h, r) => { if (!hi) return; ctx.fillStyle = 'rgba(46,24,46,0.24)'; rr(ctx, -w / 2 + shx, -h / 2 + shy, w, h, r || 0.2); ctx.fill(); };
  switch (t) {
    case 'tent': {
      const r = it.r;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.24)'; ctx.beginPath(); ctx.arc(r * 0.24, r * 0.3, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = it.c; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      if (hi) {
        ctx.fillStyle = 'rgba(255,255,255,0.26)'; ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.32, r * 0.46, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(30,20,40,0.32)'; ctx.lineWidth = 0.13; ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.moveTo(r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.7, r * 0.7); ctx.stroke();
      }
      break;
    }
    case 'cabin': {
      const w = it.w, h = it.h;
      shadowRect(w, h);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(30,15,40,0.3)'; ctx.fillRect(-w / 2, 0, w, h / 2);
      if (hi) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-w / 2, -0.07, w, 0.14); }
      break;
    }
    case 'dome': {
      const r = it.r;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.26)'; ctx.beginPath(); ctx.arc(r * 0.2, r * 0.26, r, 0, TAU); ctx.fill(); }
      if (hi) {
        const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, it.c); g.addColorStop(1, shade(it.c, -0.28));
        ctx.fillStyle = g;
      } else ctx.fillStyle = it.c;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      if (hi) {
        ctx.strokeStyle = 'rgba(80,66,104,0.4)'; ctx.lineWidth = Math.min(0.14, r * 0.04);
        ctx.beginPath();
        const h6 = [];
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; h6.push([Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52]); }
        h6.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * TAU + Math.PI / 6, b = a + Math.PI / 6;
          ctx.moveTo(h6[k][0], h6[k][1]); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.moveTo(h6[k][0], h6[k][1]); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
          ctx.moveTo(h6[(k + 1) % 6][0], h6[(k + 1) % 6][1]); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
          ctx.moveTo(0, 0); ctx.lineTo(h6[k][0], h6[k][1]);
        }
        ctx.moveTo(r, 0); ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
      break;
    }
    case 'para': {
      const r = it.r, n = it.n;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.24)'; ctx.beginPath(); ctx.arc(r * 0.18, r * 0.24, r, 0, TAU); ctx.fill(); }
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = k % 2 ? it.c : it.c2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, k / n * TAU, (k + 1) / n * TAU); ctx.closePath(); ctx.fill();
      }
      if (hi) {
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(40,20,40,0.2)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2c40'; ctx.beginPath(); ctx.arc(0, 0, 0.35, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'yurt': {
      const r = it.r;
      ctx.fillStyle = hi ? '#d5dbe4' : '#cfd5de';
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      if (hi) {
        ctx.fillStyle = 'rgba(70,70,100,0.22)';
        ctx.beginPath(); ctx.moveTo(0, 0); for (let k = 0; k <= 3; k++) { const a = k / 6 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(90,90,120,0.45)'; ctx.lineWidth = 0.1; ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.stroke();
      }
      break;
    }
    case 'flag': {
      ctx.fillStyle = it.c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.9, 0.4); ctx.lineTo(0, 0.85); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b2230'; ctx.beginPath(); ctx.arc(0, 0.1, 0.28, 0, TAU); ctx.fill();
      break;
    }
    case 'shade': {
      const w = it.w, h = it.h, dark = it.c === '#2d2a36' || it.c === '#4a3f5e';
      shadowRect(w, h, 0.3);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (hi) {
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(60,50,70,0.2)'; ctx.lineWidth = 0.12;
        ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2);
        for (let k = 1; k < 4; k++) { ctx.moveTo(-w / 2 + w * k / 4, -h / 2); ctx.lineTo(-w / 2 + w * k / 4, h / 2); }
        ctx.stroke();
        ctx.fillStyle = rgba(it.c2, 0.55); ctx.fillRect(-w * 0.18, -h * 0.2, w * 0.36, h * 0.4);
        ctx.fillStyle = '#2b2230';
        for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) { ctx.beginPath(); ctx.arc(x, y, 0.3, 0, TAU); ctx.fill(); }
      }
      break;
    }
    case 'rv': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.45);
      ctx.fillStyle = it.c; rr(ctx, -w / 2, -h / 2, w, h, 0.45); ctx.fill();
      ctx.fillStyle = it.c2; ctx.fillRect(-w / 2 + 0.2, h * 0.16, w - 0.4, h * 0.14);
      ctx.fillStyle = '#2a3442'; ctx.fillRect(w / 2 - 0.75, -h / 2 + 0.25, 0.45, h - 0.5);
      if (hi) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-0.5, -0.5, 1, 0.9); ctx.strokeStyle = 'rgba(40,30,50,0.35)'; ctx.lineWidth = 0.1; rr(ctx, -w / 2, -h / 2, w, h, 0.45); ctx.stroke(); }
      break;
    }
    case 'car': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.4);
      ctx.fillStyle = it.c; rr(ctx, -w / 2, -h / 2, w, h, 0.5); ctx.fill();
      ctx.fillStyle = '#26293a'; rr(ctx, -w * 0.22, -h * 0.36, w * 0.5, h * 0.72, 0.25); ctx.fill();
      break;
    }
    case 'box': {
      const w = it.w, h = it.h;
      shadowRect(w, h);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (hi) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.09; ctx.beginPath();
        for (let x = -w / 2 + 0.45; x < w / 2; x += 0.45) { ctx.moveTo(x, -h / 2); ctx.lineTo(x, h / 2); }
        ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.14; ctx.strokeRect(-w / 2, -h / 2, w, h);
      }
      break;
    }
    case 'stage': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.3);
      ctx.fillStyle = '#231d2b'; rr(ctx, -w / 2, -h / 2, w, h, 0.3); ctx.fill();
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2 + 0.3, h / 2 - 0.5, w - 0.6, 0.42);
      if (hi) {
        ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.12; ctx.strokeRect(-w / 2 + 0.6, -h / 2 + 0.6, w - 1.2, h - 1.4);
        for (const x of [-w / 2 + 0.1, w / 2 - 1.5]) {
          ctx.fillStyle = '#0d0b12'; ctx.fillRect(x, h / 2 - 1.7, 1.4, 1.4);
          ctx.fillStyle = '#4a4456'; ctx.beginPath(); ctx.arc(x + 0.7, h / 2 - 1.0, 0.45, 0, TAU); ctx.fill();
        }
      }
      break;
    }
    case 'floor': {
      const w = it.w, h = it.h, cols = Math.max(3, Math.round(w / 1.6)), rows = 2, tw = w / cols, th = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        ctx.fillStyle = rgba(BRCM.LIGHTS[(i + j) % 2 ? it.c : it.c2], 0.72);
        ctx.fillRect(-w / 2 + i * tw + 0.08, -h / 2 + j * th + 0.08, tw - 0.16, th - 0.16);
      }
      break;
    }
  }
}

function brcmDrawArt(ctx, a, t, z) {
  const s = a.s, ph = a.ph, hue = (a.hue + t * 24) % 360, lw = Math.max(0.3, 1 / z);
  ctx.save(); ctx.translate(a.x, a.y); ctx.scale(s, s);
  const col = `hsl(${hue},95%,64%)`, col2 = `hsl(${(hue + 120) % 360},95%,64%)`;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.5; ctx.drawImage(brcmGlow(BRCM.LIGHTS[(a.hue >> 5) % 8], 1), -16, -22, 32, 32);
  ctx.globalAlpha = 0.45; ctx.drawImage(brcmGlow(BRCM.LIGHTS[(a.hue >> 5) % 8], 1), -9, -4, 18, 8);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (a.kind) {
    case 'lotus': {
      ctx.fillStyle = '#3a2c40'; ctx.beginPath(); ctx.ellipse(0, -0.5, 4, 1.4, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI / 2 + (i - 3) * 0.36 + Math.sin(t * 0.8 + ph) * 0.05;
        ctx.fillStyle = `hsla(${(hue + i * 22) % 360},95%,62%,0.55)`;
        ctx.save(); ctx.translate(0, -1.5); ctx.rotate(ang + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -5, 1.7, 5, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'spire': {
      ctx.fillStyle = '#2c2440'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(0.5, -16); ctx.lineTo(-0.5, -16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-0.5, -16); ctx.moveTo(2, 0); ctx.lineTo(0.5, -16); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + ph);
      ctx.drawImage(brcmGlow('#ffffff', 0), -3.5, -19.5, 7, 7); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'ring': {
      ctx.strokeStyle = '#2c2440'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-4, -4); ctx.moveTo(3, 0); ctx.lineTo(4, -4); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, -9, 5, 7, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = lw * 0.6; ctx.stroke();
      for (let i = 0; i < 6; i++) { const u = t * 1.5 + i / 6 * TAU + ph; ctx.fillStyle = col2; ctx.beginPath(); ctx.arc(Math.cos(u) * 3, -9 + Math.sin(u) * 4.5, 0.45, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'jelly': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col2; ctx.lineWidth = lw;
      for (let i = 0; i < 6; i++) { const x0 = -4 + i * 1.6; ctx.beginPath(); ctx.moveTo(x0, -10); for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(t * 2 + k * 0.9 + i + ph) * 0.8, -10 + k * 1.5); ctx.stroke(); }
      ctx.fillStyle = `hsla(${hue},90%,62%,0.6)`; ctx.beginPath(); ctx.ellipse(0, -10.5, 6, 4.4, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = lw * 0.7; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'tree': {
      ctx.strokeStyle = '#4a3a3c'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.moveTo(0, -5); ctx.lineTo(-4, -10); ctx.moveTo(0, -6); ctx.lineTo(4, -11); ctx.moveTo(0, -8); ctx.lineTo(-1, -13); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const u = i * 2.39996, r = 2 + (i % 5), x = Math.cos(u) * r * 1.1, y = -10.5 + Math.sin(u) * r * 0.6;
        ctx.fillStyle = `hsla(${(hue + i * 30) % 360},95%,65%,${0.45 + 0.55 * Math.max(0, Math.sin(t * 2.4 + i))})`; ctx.beginPath(); ctx.arc(x, y, 0.75, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'head': {
      ctx.fillStyle = '#7b7a88'; ctx.beginPath(); ctx.ellipse(0, -8, 5, 7.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9d9cab'; ctx.beginPath(); ctx.ellipse(-1.4, -9.5, 2.6, 5, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; const e = 0.6 + 0.4 * Math.sin(t * 1.3 + ph);
      ctx.globalAlpha = e; ctx.drawImage(brcmGlow('#4af2ff', 0), -4, -12, 3.2, 3.2); ctx.drawImage(brcmGlow('#4af2ff', 0), 0.8, -12, 3.2, 3.2); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3c3a48'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-1.8, -4.5); ctx.quadraticCurveTo(0, -3.6, 1.8, -4.5); ctx.stroke();
      break;
    }
    case 'disco': {
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.lineTo(0, -5); ctx.lineTo(2.5, 0); ctx.stroke();
      const g = ctx.createRadialGradient(-1.5, -11, 0.5, 0, -9.5, 4.6); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8c8aa0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -9.5, 4.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,80,0.45)'; ctx.lineWidth = lw * 0.5; ctx.beginPath();
      for (let k = -3; k <= 3; k++) { ctx.moveTo(-4.4, -9.5 + k * 1.3); ctx.lineTo(4.4, -9.5 + k * 1.3); ctx.moveTo(k * 1.3 + ((t * 1.5) % 1.3) - 0.65, -14); ctx.lineTo(k * 1.3 + ((t * 1.5) % 1.3) - 0.65, -5); }
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const u = t * 0.9 + i * 0.9 + ph, f = Math.max(0, Math.sin(t * 4 + i * 1.7)); ctx.fillStyle = `hsla(${(hue + i * 50) % 360},100%,70%,${f})`; ctx.beginPath(); ctx.arc(Math.cos(u) * 9, -6 + Math.sin(u) * 4, 0.55, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'pyramid': {
      ctx.fillStyle = 'rgba(30,26,44,0.85)'; ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.lineTo(0, -11); ctx.lineTo(6.5, 0); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.5, lw); ctx.stroke();
      ctx.beginPath(); for (let k = 1; k < 4; k++) { const f = (k / 4 + t * 0.25) % 1, y = -11 * (1 - f); ctx.moveTo(-6.5 * f, y); ctx.lineTo(6.5 * f, y); } ctx.strokeStyle = col2; ctx.lineWidth = lw * 0.6; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'wave': {
      for (let i = 0; i < 9; i++) {
        const u = (i - 4) * 0.32, x = Math.sin(u) * 9, y = -Math.cos(u) * 3 + 2, h = 6;
        ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
        const f = 0.2 + 0.8 * Math.max(0, Math.sin(t * 3 - i * 0.7 + ph));
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f; ctx.drawImage(brcmGlow(BRCM.LIGHTS[i % 8], 0), x - 2, y - h - 2, 4, 4); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      break;
    }
    case 'spiral': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const u = i * 0.55 + t * 1.2 + ph, r = 1 + i * 0.32; ctx.fillStyle = `hsla(${(hue + i * 14) % 360},95%,65%,0.9)`; ctx.beginPath(); ctx.arc(Math.cos(u) * r, -8 + Math.sin(u) * r * 0.55, 0.5, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
      break;
    }
    case 'butterfly': {
      const f = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.6 + ph));
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (const sx of [-1, 1]) {
        ctx.fillStyle = `hsla(${(hue + (sx > 0 ? 40 : 0)) % 360},95%,62%,0.6)`;
        ctx.beginPath(); ctx.ellipse(sx * 3.6 * f, -10, 3.6 * f, 4.4, sx * 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sx * 2.6 * f, -5.8, 2.4 * f, 2.6, -sx * 0.4, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#2c2440'; ctx.beginPath(); ctx.ellipse(0, -8, 0.6, 3.4, 0, 0, TAU); ctx.fill();
      break;
    }
  }
  ctx.lineCap = 'butt';
  ctx.restore();
}

function brcmDrawArtCar(ctx, a, t, z) {
  const ang = Math.atan2(a.hy, a.hx), lw = Math.max(0.3, 0.9 / z);
  // light trail
  const tr = a.trail;
  if (tr.length > 4) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [n, w, al] of [[tr.length, 3.2, 0.16], [Math.min(tr.length, 40), 1.6, 0.3], [Math.min(tr.length, 16), Math.max(0.5, 1 / z), 0.55]]) {
      ctx.strokeStyle = rgba(a.c, al); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y);
      for (let i = 0; i < n; i += 2) ctx.lineTo(tr[i], tr[i + 1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8; ctx.drawImage(brcmGlow(a.c, 1), a.x - 12, a.y - 12, 24, 24); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
  }
  if (a.kind === 'dragon') {        // a long body that follows its own trail
    for (let i = 20; i >= 0; i -= 4) {
      const x = tr[i] !== undefined ? tr[i] : a.x, y = tr[i + 1] !== undefined ? tr[i + 1] : a.y, r = 2.2 - i * 0.05;
      ctx.fillStyle = i % 8 ? '#c83a2e' : '#e8a23a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
  switch (a.kind) {
    case 'whale':
      ctx.fillStyle = '#2a5ab0'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.7, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-8.6, -2.6); ctx.lineTo(-7.6, 0); ctx.lineTo(-8.6, 2.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8fe4ff'; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.7, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#d8f6ff'; ctx.beginPath(); ctx.arc(3.6, -1, 0.5, 0, TAU); ctx.arc(3.6, 1, 0.5, 0, TAU); ctx.fill();
      break;
    case 'fish':
      ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3.6, 0); ctx.lineTo(-6.6, -2.2); ctx.lineTo(-6.6, 2.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); for (const x of [-1.5, 0, 1.5]) { ctx.moveTo(x, -1.6); ctx.quadraticCurveTo(x + 0.8, 0, x, 1.6); } ctx.stroke();
      break;
    case 'bus':
      ctx.fillStyle = '#5a2fb8'; rr(ctx, -5.6, -2.1, 11.2, 4.2, 0.8); ctx.fill();
      ctx.fillStyle = '#8f62ff'; rr(ctx, -4.2, -1.5, 7, 3, 0.5); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-0.7, 0, 1, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const u = t * 3 + i * 1.256; ctx.fillStyle = `hsla(${(i * 70 + t * 90) % 360},100%,70%,0.85)`; ctx.beginPath(); ctx.arc(-0.7 + Math.cos(u) * 3, Math.sin(u) * 1.6, 0.35, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    case 'cupcake':
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff8ad8';
      for (let k = 0; k < 8; k++) { const u = k / 8 * TAU; ctx.beginPath(); ctx.arc(Math.cos(u) * 2.1, Math.sin(u) * 2.1, 1.25, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff2a4a'; ctx.beginPath(); ctx.arc(0, 0, 0.8, 0, TAU); ctx.fill();
      break;
    case 'snail':
      ctx.fillStyle = '#9adf6a'; ctx.beginPath(); ctx.ellipse(0.8, 0, 3.6, 1.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.arc(-0.6, 0, 2.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const u = k * 0.45, r = 0.1 + k * 0.08; k ? ctx.lineTo(-0.6 + Math.cos(u) * r, Math.sin(u) * r) : ctx.moveTo(-0.6, 0); } ctx.stroke();
      break;
    case 'dragon':
      ctx.fillStyle = '#e8463a'; ctx.beginPath(); ctx.ellipse(0.6, 0, 2.6, 1.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(1.6, -0.8, 0.4, 0, TAU); ctx.arc(1.6, 0.8, 0.4, 0, TAU); ctx.fill();
      if (Math.sin(t * 1.7) > 0.86) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(brcmGlow('#ff9a2a', 1), 3, -3, 7, 6); ctx.globalCompositeOperation = 'source-over'; }
      break;
  }
  ctx.restore();
}

function brcmDrawLaser(ctx, L, t, z) {
  const act = Math.sin(t * 0.21 * L.sp + L.ph);
  if (act < 0.3) return;
  const env = Math.min(1, (act - 0.3) * 4), base = Math.atan2(-L.y, -L.x);
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const a = base + Math.sin(t * 0.9 * L.sp + L.ph) * 0.55 + i * 0.13, len = 165;
    const x1 = L.x + Math.cos(a) * len, y1 = L.y + Math.sin(a) * len;
    ctx.strokeStyle = rgba(L.c, 0.09 * env); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = rgba(L.c, 0.55 * env); ctx.lineWidth = Math.max(0.35, 0.9 / z); ctx.stroke();
  }
  ctx.globalAlpha = env; ctx.drawImage(brcmGlow(L.c, 0), L.x - 3, L.y - 3, 6, 6); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
}

function brcmTrimCache(keep) {
  const C = BRCM_CACHE;
  while (C.tiles.size > keep) { const k = C.tiles.keys().next().value, c = C.tiles.get(k); C.tiles.delete(k); c.width = 0; c.height = 0; }
  for (const c of C.pool) { c.width = 0; c.height = 0; }
  C.pool.length = 0;
  if (C.base) { C.base.c.width = 0; C.base.c.height = 0; C.base = null; }
}

/* ---------- geometry (built once from WORLD_NODES / WORLD_PATHS and the OW layout) ---------- */
let BRCM_GEO = null;
function brcmGeo() { return BRCM_GEO || (BRCM_GEO = brcmBuildGeo()); }
function brcmBuildGeo() {
  const G = { nodes: {}, list: [], paths: [], adj: {} };
  for (const n of WORLD_NODES) {
    const p = OW.NODES[n.id] || [OW.W / 2, OW.H / 2], i = +n.id.split('-')[1];
    const N = { id: n.id, n, x: p[0], y: p[1], w: n.land, i, type: n.id === WorldGame.start ? 'start' : (n.type || 'level'), boss: !!n.boss };
    G.nodes[n.id] = N; G.list.push(N); G.adj[n.id] = [];
  }
  WORLD_PATHS.forEach((p, i) => {
    if (!G.nodes[p.from] || !G.nodes[p.to]) return;
    const R = OW.ROUTES[p.from + '>' + p.to] || {};
    const P = Object.assign(brcmPolyline(owRoute(p.from, p.to)), { i, p, from: p.from, to: p.to, secret: p.kind === 'secret', bridge: !!R.bridge, key: p.from + '>' + p.to });
    G.paths.push(P);
    G.adj[p.from].push({ P, other: p.to, dir: 1 });
    G.adj[p.to].push({ P, other: p.from, dir: -1 });
  });
  for (const N of G.list) N.secretOnly = G.adj[N.id].some(e => e.dir === -1) && G.adj[N.id].every(e => e.dir === 1 || e.P.secret);
  owBuildGeo(G);
  return G;
}

/* ---------- static map renderer: every static thing inside world rect R ----------
   world (x, y) -> device px (x * s + ox, y * s + oy); lod 'close' adds the fine detail */
function brcmRenderStatic(ctx, s, ox, oy, R, lod) {
  const hi = lod === 'close';
  const P = { 41: owPaint41, 42: owPaint42, 43: owPaint43, 44: owPaint44, 45: owPaint45, 46: owPaint46, 47: owPaint47, 48: owPaint48 };
  ctx.setTransform(s, 0, 0, s, ox, oy); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  owPaintBase(ctx, R, s, hi);
  for (const w of OW.ORDER) { ctx.setTransform(s, 0, 0, s, ox, oy); ctx.globalAlpha = 1; P[w](ctx, R, s, ox, oy, hi); }
  ctx.setTransform(s, 0, 0, s, ox, oy); ctx.globalAlpha = 1;
  owPaintFinish(ctx, R, s);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

class BRCMapScene {
  constructor(opts) {
    opts = opts || {};
    this.t = 0;
    Input.setMode('ui');
    Sound.music('brcmap');
    this.G = brcmGeo();
    this.L = owMakeLive();
    this.parts = [];
    this.ptrs = new Map();
    this.popT = {}; this.bumpT = {};
    this.toast = null; this.banner = null; this.landBanner = null; this.flash = 0; this.inertia = null; this.suppress = 0; this.dustT = 0; this.intro = 1;
    this.fx = 1; this.slowT = 0;          // effects quality: drops to 0.5 if frames keep running long
    this.zoomMode = 'close'; this.zoomAnim = null;
    this.facing = 1; this.anim = { state: 'idle', t: 0, phase: 0, speed: 1 };
    this.cam = { x: 0, y: 0, z: 1, follow: true };
    this.initState(opts);
    this.initFog();
    this.resize();
    const p = this.bradyPos();
    this.cam.z = this.zClose; this.cam.x = p.x; this.cam.y = p.y - this.lift(this.zClose);
    if (this.firstVisit && !this.rv) { this.zoomMode = 'over'; this.cam.z = this.zOver; this.cam.x = OW.W / 2; this.cam.y = OW.H / 2; this.cam.follow = false; this.establish = 1.6; }
    this.clampCam();
    this.lastLand = this.G.nodes[this.cur].w;
    this.perf = { frames: 0, drawMs: 0, maxMs: 0, tiles: 0, tileMs: 0 };
  }

  /* ----- progress, seen-state and the reveal queue ----- */
  initState(opts) {
    const G = this.G, d = Save.data;
    if (!d.world3 || typeof d.world3 !== 'object') d.world3 = {};
    const w3 = this.w3 = d.world3;
    const ok = id => !!(id && G.nodes[id] && WorldGame.isUnlocked(id));
    const from = ok(opts.from) ? opts.from : null;
    this.firstVisit = !w3.seen || typeof w3.seen !== 'object';
    if (this.firstVisit) {
      w3.seen = {};
      const fresh = new Set();
      if (from) for (const e of G.adj[from]) if (e.dir === 1 && WorldGame.pathOpen(e.P.p)) fresh.add(e.other);
      for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !fresh.has(N.id)) w3.seen[N.id] = true;
    }
    if (!w3.seenPaths || typeof w3.seenPaths !== 'object') {
      w3.seenPaths = {};
      for (const P of G.paths) if (this.pathLive(P) && w3.seen[P.from] && w3.seen[P.to]) w3.seenPaths[P.key] = true;
    }
    let cur = from || (ok(w3.node) ? w3.node : null);
    if (!cur) { cur = WorldGame.start; for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !WorldGame.isDone(N.id) && w3.seen[N.id]) { cur = N.id; break; } }
    if (!G.nodes[cur]) cur = G.list[0].id;
    w3.seen[cur] = true; w3.node = cur;
    this.cur = cur; this.sel = cur; this.walk = null;
    // what changed since the last visit
    const known = new Set(Object.keys(w3.seen).filter(id => G.nodes[id] && WorldGame.isUnlocked(id)));
    this.regionK = {};
    for (const w of WORLD3_REGIONS) this.regionK[w] = G.list.some(N => N.w === w && known.has(N.id)) ? 1 : 0;
    const newPaths = G.paths.filter(P => this.pathLive(P) && !w3.seenPaths[P.key]);
    const seq = [], used = new Set(), regionSeen = Object.assign({}, this.regionK);
    let progress = true;
    while (progress) {
      progress = false;
      const cands = newPaths.filter(P => !used.has(P.key) && (known.has(P.from) || known.has(P.to)));
      cands.sort((a, b) => (a.from === cur ? 0 : 1) - (b.from === cur ? 0 : 1));
      for (const P of cands) {
        used.add(P.key);
        const fwd = known.has(P.from), target = fwd ? P.to : P.from, node = known.has(target) ? null : target;
        const step = { P, dir: fwd ? 1 : -1, node, secret: P.secret };
        if (node && !regionSeen[G.nodes[node].w]) { step.region = G.nodes[node].w; regionSeen[step.region] = 1; }
        seq.push(step); known.add(target); progress = true;
      }
    }
    for (const P of newPaths) if (!used.has(P.key)) {
      const node = known.has(P.to) ? null : P.to, step = { P, dir: 1, node, secret: P.secret };
      if (node && !regionSeen[G.nodes[node].w]) { step.region = G.nodes[node].w; regionSeen[step.region] = 1; }
      seq.push(step); known.add(P.to); known.add(P.from);
    }
    for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !known.has(N.id)) {
      const step = { P: null, node: N.id };
      if (!regionSeen[N.w]) { step.region = N.w; regionSeen[N.w] = 1; }
      seq.push(step); known.add(N.id);
    }
    this.pendingNodes = new Set(seq.filter(s => s.node).map(s => s.node));
    this.pendingPaths = new Set(seq.filter(s => s.P).map(s => s.P.key));
    this.rv = seq.length ? { seq, i: 0, t: -0.9, phase: 'path' } : null;
    if (!this.rv) Save.save();
  }
  pathLive(P) { return WorldGame.pathOpen(P.p) && WorldGame.isUnlocked(P.from) && WorldGame.isUnlocked(P.to); }
  edgeOK(P) { return this.pathLive(P) && !this.pendingPaths.has(P.key); }
  secretPending(id) { return !!(WORLD3_SECRETS[id] && !WorldGame.secretFound(id)); }
  nodeState(id) {
    const c = this.nsCache && this.nsCache.get(id);
    if (c) return c;
    let st;
    if (this.pendingNodes.has(id)) st = this.hintVisible(id) ? 'locked' : 'hidden';
    else if (WorldGame.isUnlocked(id)) st = WorldGame.isDone(id) ? 'done' : 'open';
    else st = this.hintVisible(id) ? 'locked' : 'hidden';
    if (this.nsCache) this.nsCache.set(id, st);
    return st;
  }
  hintVisible(id) {
    const N = this.G.nodes[id];
    if (N.secretOnly) return false;                 // hidden side camps appear only once their secret trail opens
    if ((this.regionK[N.w] || 0) >= 0.99) return true;
    for (const e of this.G.adj[id]) if (e.dir === -1 && !e.P.secret && WorldGame.isUnlocked(e.P.from) && !this.pendingNodes.has(e.P.from)) return true;
    return false;
  }
  pathState(P) {
    if (this.rv && this.rv.step && this.rv.step.P === P && this.rv.phase === 'path') return 'reveal';
    if (this.pendingPaths.has(P.key)) return !P.secret && this.nodeState(P.from) !== 'hidden' && this.nodeState(P.to) !== 'hidden' ? 'hint' : 'hidden';
    if (this.pathLive(P)) return 'open';
    if (P.secret) return 'hidden';
    return this.nodeState(P.from) !== 'hidden' && this.nodeState(P.to) !== 'hidden' ? 'hint' : 'hidden';
  }
  finishReveal() {
    const rv = this.rv; if (!rv) return;
    for (const s of rv.seq) {
      if (s.node && this.popT[s.node] === undefined) this.popT[s.node] = 0.6;
      if (s.region) this.regionK[s.region] = 1;
    }
    this.pendingNodes.clear(); this.pendingPaths.clear();
    for (const N of this.G.list) if (WorldGame.isUnlocked(N.id)) this.w3.seen[N.id] = true;
    for (const P of this.G.paths) if (this.pathLive(P)) this.w3.seenPaths[P.key] = true;
    Save.save();
    this.rv = null; this.fogDirty = true; this.cam.follow = true;
  }
  revealDur(P) { return P.bridge ? clamp(P.len / 260, 1.6, 2.6) : clamp(P.len / 110, 0.7, 1.8); }
  stepReveal(dt) {
    const rv = this.rv, s = rv.seq[rv.i];
    rv.step = s; rv.t += dt;
    if (rv.phase === 'path') {
      const dur = s.P ? this.revealDur(s.P) : 0;
      if (s.P && rv.t >= 0 && !rv.started) { rv.started = true; if (s.secret) { Sound.play('secret'); this.flash = 0.5; } else Sound.play('appear', { vol: 0.6 }); }
      if (s.P && rv.t > 0) {
        const p = clamp(rv.t / dur, 0, 1), h = brcmAlong(s.P, s.dir === 1 ? p * s.P.len : (1 - p) * s.P.len);
        rv.head = h;
        const n = s.secret ? 3 : 2;
        for (let i = 0; i < n; i++) this.spark(h.x, h.y, s.secret ? BRCM.LIGHTS[((this.t * 9) | 0) + i * 3 & 7] : (i ? '#ffffff' : '#ff8ae0'), 40, 0.7);
      } else if (!s.P) rv.head = this.G.nodes[s.node];
      if (rv.t >= dur) {
        rv.phase = 'pop'; rv.t = 0; rv.started = false;
        if (s.node) {
          this.popT[s.node] = 0; this.pendingNodes.delete(s.node); this.fogDirty = true;
          const N = this.G.nodes[s.node];
          for (let i = 0; i < 26; i++) this.spark(N.x, N.y, s.secret ? BRCM.LIGHTS[i & 7] : (i % 3 ? '#ffd84a' : '#ffffff'), 90, 1.1);
          Sound.play(s.secret ? 'gold' : 'pick', { vol: 0.7 });
          if (s.region) { this.regionAnim = { w: s.region, t: 0 }; this.banner = { w: s.region, t: 0 }; }
        }
        if (s.P) this.pendingPaths.delete(s.P.key);
      }
    } else if (rv.t >= (s.node ? 0.95 : 0.4) + (rv.i === rv.seq.length - 1 ? 0.5 : 0)) {
      rv.i++; rv.t = -0.15; rv.phase = 'path';
      if (rv.i >= rv.seq.length) this.finishReveal();
    }
  }

  /* ----- layout ----- */
  resize() {
    const W = Game.cssW, H = Game.cssH, portrait = H > W * 1.05;
    this.portrait = portrait;
    const sl = Math.max(12, insets.l + 6), sr = Math.max(12, insets.r + 6), st = Math.max(8, insets.t + 4), sb = Math.max(10, insets.b + 6);
    this.safe = { l: sl, r: sr, t: st, b: sb };
    this.topH = st + 50;
    const ph = portrait ? 156 : 78;
    this.panel = { x: sl, y: H - sb - ph, w: W - sl - sr, h: ph };
    const P = this.panel;
    this.btnBack = { x: sl, y: st + 4, w: 92, h: 38, label: '◀ BACK', fn: () => this.back() };
    this.btnZoom = { x: W - sr - 52, y: st + 4, w: 52, h: 38, label: '', fn: () => this.toggleZoom() };
    this.btnPlay = portrait ? { x: P.x + 12, y: P.y + P.h - 56, w: P.w - 24, h: 46, label: 'PLAY', primary: true, size: 18, fn: () => this.playSel() }
      : { x: P.x + P.w - 160, y: P.y + (P.h - 52) / 2, w: 148, h: 52, label: 'PLAY', primary: true, size: 18, fn: () => this.playSel() };
    this.btns = [this.btnBack, this.btnZoom, this.btnPlay];
    this.vcx = W / 2; this.vcyClose = (this.topH + P.y) / 2;
    this.panelHide = portrait ? 0 : P.h + sb + 12;      // landscape overview: the panel slides off the bottom
    this.vcyOver = portrait ? this.vcyClose : (this.topH + H - sb) / 2;
    this.zClose = clamp(Math.min(W, H) / 320, 1.0, 2.2);
    this.zOver = clamp(Math.min((W - sl - sr) / OW.W, ((portrait ? P.y : H - sb) - this.topH) / OW.H) * 0.98, 0.15, 1.2);
    this.playY = this.btnPlay.y;
    this.vcy = this.vcyClose; this.panelOff = 0;
    const z1 = this.zoomMode === 'over' ? this.zOver : this.zClose;
    if (this.zoomAnim) this.zoomAnim = null;
    this.cam.z = z1; this.layoutZoom();
    const v = makeCanvas(64, 64), vx = v.getContext('2d'), vg = vx.createRadialGradient(32, 32, 14, 32, 32, 46);
    vg.addColorStop(0, 'rgba(7,4,14,0)'); vg.addColorStop(1, 'rgba(7,4,14,0.55)');
    vx.fillStyle = vg; vx.fillRect(0, 0, 64, 64); this.vig = v;
    this.clampCam();
  }
  lift(z) { return 12 / (z || this.cam.z); }
  layoutZoom() {                    // panel position and view centre follow the zoom level
    const u = clamp((this.zClose - this.cam.z) / Math.max(0.01, this.zClose - this.zOver), 0, 1), e = u * u * (3 - 2 * u);
    this.vcy = lerp(this.vcyClose, this.vcyOver, e);
    this.panelOff = this.panelHide * e;
    this.btnPlay.y = this.playY + this.panelOff;
  }
  clampCam() {
    const c = this.cam, z = c.z, B = BRCM.B, W = Game.cssW;
    const minX = B.x0 + this.vcx / z, maxX = B.x1 - (W - this.vcx) / z;
    c.x = minX > maxX ? (B.x0 + B.x1) / 2 : clamp(c.x, minX, maxX);
    const minY = B.y0 + (this.vcy - this.topH) / z, maxY = B.y1 - (Math.min(Game.cssH, this.panel.y + this.panelOff) - this.vcy) / z;
    c.y = minY > maxY ? (B.y0 + B.y1) / 2 : clamp(c.y, minY, maxY);
  }
  clampedAt(x, y, z) {
    const c = this.cam, o = { x: c.x, y: c.y, z: c.z };
    c.x = x; c.y = y; c.z = z; this.layoutZoom(); this.clampCam();
    const r = { x: c.x, y: c.y }; c.x = o.x; c.y = o.y; c.z = o.z; this.layoutZoom(); return r;
  }
  toScreen(x, y) { const c = this.cam; return { x: (x - c.x) * c.z + this.vcx, y: (y - c.y) * c.z + this.vcy }; }
  toWorld(x, y) { const c = this.cam; return { x: (x - this.vcx) / c.z + c.x, y: (y - this.vcy) / c.z + c.y }; }
  nodeScale() { return clamp(0.42 + 0.58 * (this.cam.z - this.zOver) / Math.max(0.01, this.zClose - this.zOver), 0.42, 1.15); }

  /* ----- Brady on the map ----- */
  bradyPos() {
    const w = this.walk;
    if (!w) { const N = this.G.nodes[this.cur]; return { x: N.x, y: N.y }; }
    const L = w.legs[w.li];
    return brcmAlong(L.P, L.dir === 1 ? w.s : L.P.len - w.s);
  }
  dijkstra(src) {
    const G = this.G, dist = { [src]: 0 }, prev = {}, done = new Set();
    for (;;) {
      let u = null, best = Infinity;
      for (const id in dist) if (!done.has(id) && dist[id] < best) { best = dist[id]; u = id; }
      if (u === null) break;
      done.add(u);
      for (const e of G.adj[u]) {
        if (!this.edgeOK(e.P)) continue;
        const nd = best + e.P.len;
        if (dist[e.other] === undefined || nd < dist[e.other]) { dist[e.other] = nd; prev[e.other] = { from: u, P: e.P, dir: e.dir }; }
      }
    }
    return { dist, prev };
  }
  legsTo(D, target) {
    if (D.dist[target] === undefined) return null;
    const legs = [];
    for (let id = target; D.prev[id]; id = D.prev[id].from) legs.unshift({ P: D.prev[id].P, dir: D.prev[id].dir });
    return legs;
  }
  // a route (list of legs) from where Brady is now; mid-walk he may turn around
  routeTo(target) {
    const w = this.walk;
    if (!w) { if (target === this.cur) return []; const D = this.dijkstra(this.cur); const L = this.legsTo(D, target); return L ? { legs: L, s: 0 } : null; }
    const L = w.legs[w.li], a = L.dir === 1 ? L.P.from : L.P.to, b = L.dir === 1 ? L.P.to : L.P.from;
    const Da = this.dijkstra(a), Db = this.dijkstra(b);
    const ca = Da.dist[target] !== undefined ? w.s + Da.dist[target] : Infinity;
    const cb = Db.dist[target] !== undefined ? L.P.len - w.s + Db.dist[target] : Infinity;
    if (ca === Infinity && cb === Infinity) return null;
    if (cb <= ca) return { legs: [L].concat(this.legsTo(Db, target)), s: w.s };
    return { legs: [{ P: L.P, dir: -L.dir }].concat(this.legsTo(Da, target)), s: L.P.len - w.s };
  }
  startWalk(route, target) {
    if (!route.legs.length) { this.walk = null; this.cur = target; return; }
    let total = -route.s; for (const L of route.legs) total += L.P.len;
    const keep = this.walk && this.walk.playOnArrive && this.walk.target === target;
    this.walk = { legs: route.legs, li: 0, s: route.s, target, total, done: 0, speed: clamp(total / 1.8, 80, 420), playOnArrive: keep };
    this.cam.follow = true; this.inertia = null;
  }
  stepWalk(dt) {
    const w = this.walk;
    if (!w) { this.anim.state = 'idle'; return; }
    const before = this.bradyPos();
    const left = w.total - w.done, ease = Math.min(1, 0.35 + w.done / 14) * Math.min(1, 0.25 + left / 20);
    const v = w.speed * ease * (w.playOnArrive ? 2.4 : 1);
    w.s += v * dt; w.done += v * dt;
    let L = w.legs[w.li];
    while (w.s >= L.P.len) {
      w.s -= L.P.len;
      this.cur = L.dir === 1 ? L.P.to : L.P.from;
      this.checkLand();
      w.li++;
      if (w.li >= w.legs.length) { this.arrive(); return; }
      L = w.legs[w.li];
    }
    const p = this.bradyPos(), dx = p.x - before.x;
    if (Math.abs(dx) > 0.02) this.facing = dx > 0 ? 1 : -1;
    this.anim.state = 'run'; this.anim.phase += dt * 15; this.anim.speed = 1;
    this.dustT += dt;
    if (this.dustT > 0.11) { this.dustT = 0; this.parts.push({ x: p.x - this.facing * 2, y: p.y, vx: -this.facing * 5, vy: -4, life: 0.6, max: 0.6, c: '#e2cfbd', sz: 7, dust: true }); }
  }
  checkLand() {                        // a banner with the land's name and tag when Brady walks into a new land
    const w = this.G.nodes[this.cur].w;
    if (w !== this.lastLand) { this.lastLand = w; this.landBanner = { w, t: 0 }; }
  }
  arrive() {
    const w = this.walk; this.walk = null;
    this.cur = w.target; this.w3.node = this.cur; Save.save();
    this.checkLand();
    this.anim.state = 'idle';
    const N = this.G.nodes[this.cur];
    for (let i = 0; i < 8; i++) this.parts.push({ x: N.x + (Math.random() - 0.5) * 6, y: N.y, vx: (Math.random() - 0.5) * 20, vy: -Math.random() * 8, life: 0.5, max: 0.5, c: '#e2cfbd', sz: 6, dust: true });
    if (w.playOnArrive && this.sel === this.cur) this.playSel();
  }

  /* ----- actions ----- */
  back() { Sound.play('back'); Save.save(); brcmTrimCache(24); Game.setScene(new TitleScene()); }
  showToast(text) { this.toast = { text, t: 1.8 }; }
  bump(id) { Sound.play('bump'); this.bumpT[id] = 0.35; }
  playSel() {
    const id = this.sel;
    if (!WorldGame.isUnlocked(id) || this.pendingNodes.has(id)) { this.bump(id); this.showToast('LOCKED'); return; }
    if (this.walk && this.walk.target === id) { this.walk.playOnArrive = true; return; }
    if (this.cur !== id || this.walk) {
      const r = this.routeTo(id);
      if (!r) { this.bump(id); this.showToast('NO OPEN PATH YET'); return; }
      this.startWalk(r, id); if (this.walk) { this.walk.playOnArrive = true; return; }
    }
    Sound.play('select');
    this.w3.node = id; Save.save();
    brcmTrimCache(48);
    WorldGame.play(id);
  }
  tapNode(id) {
    const st = this.nodeState(id);
    if (st === 'hidden') return false;
    if (st === 'locked') { this.sel = id; this.bump(id); this.showToast('LOCKED'); return true; }
    const there = this.walk ? this.walk.target === id : this.cur === id;
    if (this.sel === id && there) { this.playSel(); return true; }
    if (there) { this.sel = id; Sound.play('select', { vol: 0.5 }); return true; }
    const r = this.routeTo(id);
    if (!r) { this.sel = id; this.bump(id); this.showToast('NO OPEN PATH YET'); return true; }
    this.sel = id; this.startWalk(r, id); Sound.play('select');
    return true;
  }
  navKey(key) {
    const vec = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[key];
    const base = this.walk ? this.walk.target : this.cur, B = this.G.nodes[base];
    let best = null;
    for (const e of this.G.adj[base]) {
      if (!this.edgeOK(e.P)) continue;
      // direction of the first stretch of the path, blended with the straight line to the neighbour
      const N = this.G.nodes[e.other], q = brcmAlong(e.P, e.dir === 1 ? Math.min(e.P.len, 24) : Math.max(0, e.P.len - 24));
      const dx = (N.x - B.x) + (q.x - B.x) * 2, dy = (N.y - B.y) + (q.y - B.y) * 2;
      const d = Math.hypot(dx, dy) || 1, dot = (dx * vec[0] + dy * vec[1]) / d;
      if (dot > 0.3 && (!best || dot > best.dot)) best = { id: e.other, dot };
    }
    if (!best) { Sound.play('bump', { vol: 0.4 }); return; }
    const r = this.routeTo(best.id);
    if (r) { this.sel = best.id; this.startWalk(r, best.id); Sound.play('select', { vol: 0.5 }); }
  }
  toggleZoom() { Sound.play('select', { vol: 0.5 }); this.setZoom(this.zoomMode === 'close' ? 'over' : 'close'); }
  setZoom(mode, focus) {
    this.zoomMode = mode; this.inertia = null;
    const z1 = mode === 'close' ? this.zClose : this.zOver;
    let x, y;
    if (mode === 'over') { x = OW.W / 2; y = OW.H / 2; this.cam.follow = false; this.ensureBase(true); }
    else if (focus) { x = focus.x; y = focus.y; this.cam.follow = false; }
    else { const p = this.bradyPos(); x = p.x; y = p.y - this.lift(z1); this.cam.follow = true; }
    const tgt = this.clampedAt(x, y, z1);
    this.zoomAnim = { z0: this.cam.z, z1, x0: this.cam.x, y0: this.cam.y, x1: tgt.x, y1: tgt.y, t: 0, dur: 0.55 };
  }
  isUI(x, y) {
    if (y < this.topH - 4) return true;
    const P = this.panel;
    if (x >= P.x && x <= P.x + P.w && y >= P.y + this.panelOff - 4) return true;
    return false;
  }
  nodeAt(x, y) {
    const sc = this.nodeScale(), rad = Math.max(16, 26 * sc);
    let best = null, bd = rad;
    for (const N of this.G.list) {
      if (this.nodeState(N.id) === 'hidden') continue;
      const p = this.toScreen(N.x, N.y), d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = N.id; }
    }
    if (!best) {    // tapping Brady himself means his node
      const bp = this.bradyPos(), b = this.toScreen(bp.x, bp.y), s = 1.1 * sc;
      if (Math.abs(x - b.x) < 12 * s && y < b.y + 4 && y > b.y - 36 * s) best = this.walk ? this.walk.target : this.cur;
    }
    return best;
  }

  /* ----- per-step update (120 Hz) ----- */
  update(dt) {
    this.t += dt; this.anim.t += dt;
    owStepLive(this.L, dt, this.t);
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; if (!p.dust) p.vy += 6 * dt; }
    if (this.parts.length) this.parts = this.parts.filter(p => p.life > 0);
    for (const id in this.popT) { this.popT[id] += dt; if (this.popT[id] > 1.2) delete this.popT[id]; else if (this.popT[id] < 0.7) this.fogDirty = true; }
    for (const id in this.bumpT) { this.bumpT[id] -= dt; if (this.bumpT[id] <= 0) delete this.bumpT[id]; }
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 3) this.banner = null; }
    if (this.landBanner) { this.landBanner.t += dt; if (this.landBanner.t > 3.2) this.landBanner = null; }
    if (this.regionAnim) { const ra = this.regionAnim; ra.t += dt; this.regionK[ra.w] = clamp(ra.t / 1.4, 0, 1); this.fogDirty = true; if (ra.t >= 1.4) this.regionAnim = null; }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6);
    if (this.suppress > 0) this.suppress -= dt;

    // input: consume the key first so UI.hitButtons does not treat arrows as focus moves
    const key = Input.uiKey; Input.uiKey = null;
    const taps = Input.taps.slice();
    const anyDown = this.trackPointers(dt);
    if (this.establish > 0) {           // first visit: hold on the whole dusty map, then fly down to Brady
      if (!this.intro) this.establish -= dt;
      if (this.establish <= 0 || taps.length || key || anyDown) {
        this.establish = 0; Input.taps.length = 0; this.eatTouches();
        this.setZoom('close'); this.zoomAnim.dur = 1.5;
        this.landBanner = { w: this.G.nodes[this.cur].w, t: -1.2 };
      }
      this.stepCamera(dt);
      return;
    }
    if (this.rv) {
      this.stepReveal(dt);
      if (this.rv && (taps.length || key || anyDown)) { this.finishReveal(); this.eatTouches(); }
      Input.taps.length = 0;
    } else {
      const hit = this.suppress > 0 ? null : UI.hitButtons(this.btns);
      if (hit) { hit.fn(); return; }
      if (this.suppress <= 0) for (const tp of taps) {
        if (this.isUI(tp.x, tp.y)) continue;
        const id = this.nodeAt(tp.x, tp.y);
        if (id) { this.tapNode(id); break; }
        if (this.zoomMode === 'over') { this.setZoom('close', this.toWorld(tp.x, tp.y)); break; }
      }
      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') this.navKey(key);
      else if (key === 'enter') this.playSel();
      else if (key === 'action') this.toggleZoom();
      else if (key === 'pause') { this.back(); return; }
      else if (Input.jumpPressed && !Input.usingTouch) this.playSel();
    }
    this.stepWalk(dt);
    this.stepCamera(dt);
  }
  eatTouches() { for (const p of this.ptrs.values()) p.eat = true; }
  trackPointers(dt) {
    let anyDown = false;
    const seen = new Set();
    for (const [id, t] of Input.touches) {
      seen.add(id);
      let p = this.ptrs.get(id);
      if (!p) { p = { sx: t.x, sy: t.y, lx: t.x, ly: t.y, drag: false, ui: this.isUI(t.x, t.y), vx: 0, vy: 0 }; this.ptrs.set(id, p); if (!p.ui) anyDown = true; continue; }
      if (p.ui || p.eat || this.rv) { p.lx = t.x; p.ly = t.y; continue; }
      if (!p.drag && Input.touches.size === 1 && Math.hypot(t.x - p.sx, t.y - p.sy) > 9) {
        p.drag = true; this.cam.follow = false; this.inertia = null;
        if (this.zoomAnim) { this.cam.z = this.zoomAnim.z1; this.zoomAnim = null; }
      }
      if (p.drag) {
        const dx = t.x - p.lx, dy = t.y - p.ly;
        this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z;
        p.vx = lerp(p.vx, dx / dt, 0.25); p.vy = lerp(p.vy, dy / dt, 0.25);
        this.clampCam();
      }
      p.lx = t.x; p.ly = t.y;
    }
    for (const [id, p] of this.ptrs) if (!seen.has(id)) {
      if (p.drag || p.eat) this.suppress = 0.05;
      if (p.drag && Math.hypot(p.vx, p.vy) > 60) this.inertia = { vx: p.vx, vy: p.vy };
      this.ptrs.delete(id);
    }
    return anyDown;
  }
  stepCamera(dt) {
    const c = this.cam;
    this.layoutZoom();
    if (this.zoomAnim) {
      const a = this.zoomAnim; a.t += dt;
      const k = easeInOut(clamp(a.t / a.dur, 0, 1));
      c.z = Math.exp(lerp(Math.log(a.z0), Math.log(a.z1), k));
      if (a.z1 === this.zClose && this.cam.follow) { const p = this.bradyPos(), tg = this.clampedAt(p.x, p.y - this.lift(a.z1), a.z1); a.x1 = tg.x; a.y1 = tg.y; }
      c.x = lerp(a.x0, a.x1, k); c.y = lerp(a.y0, a.y1, k);
      if (a.t >= a.dur) { this.zoomAnim = null; c.z = a.z1; }
      this.layoutZoom(); this.clampCam();
      return;
    }
    if (this.inertia) {
      const v = this.inertia;
      c.x -= v.vx * dt / c.z; c.y -= v.vy * dt / c.z;
      const f = Math.exp(-dt * 4.5); v.vx *= f; v.vy *= f;
      if (Math.hypot(v.vx, v.vy) < 8) this.inertia = null;
      this.clampCam();
      return;
    }
    let tx = null, ty = null, rate = 5;
    if (this.rv && this.rv.head) { tx = this.rv.head.x; ty = this.rv.head.y - this.lift(); rate = 4; }
    else if (c.follow && this.zoomMode === 'close') { const p = this.bradyPos(); tx = p.x; ty = p.y - this.lift(); }
    if (tx !== null) {
      const k = 1 - Math.exp(-dt * rate);
      c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
      this.clampCam();
    }
  }
  spark(x, y, c, speed, life) {
    if (this.parts.length > 260) return;
    const a = Math.random() * TAU, v = (0.3 + Math.random()) * speed / Math.max(0.5, this.cam.z);
    this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.6 + Math.random() * 0.4), max: life, c, sz: 3 + Math.random() * 3 });
  }

  /* ----- static layers: 256px tiles for the close view, one canvas for the overview ----- */
  viewRect(m) {
    const c = this.cam, W = Game.cssW, H = Game.cssH; m = m || 0;
    return { x0: c.x - this.vcx / c.z - m, x1: c.x + (W - this.vcx) / c.z + m, y0: c.y - this.vcy / c.z - m, y1: c.y + (H - this.vcy) / c.z + m };
  }
  ensureBase(full, budget) {
    const sB = this.zOver * Game.dpr, key = sB.toFixed(4), RB = BRCM_RB;
    let b = BRCM_CACHE.base;
    if (!b || b.key !== key) {
      if (b && b.c) { b.c.width = 1; b.c.height = 1; }
      const w = Math.ceil((RB.x1 - RB.x0) * sB), h = Math.ceil((RB.y1 - RB.y0) * sB);
      b = BRCM_CACHE.base = { key, s: sB, c: makeCanvas(w, h), w, h, row: 0, done: false };
    }
    if (b.done) return b;
    const ctx = b.c.getContext('2d'), t0 = performance.now();
    while (b.row < b.h && (full || performance.now() - t0 < (budget || 3))) {
      const y0 = b.row, y1 = Math.min(b.h, b.row + 64);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, y0, b.w, y1 - y0); ctx.clip();
      brcmRenderStatic(ctx, b.s, -RB.x0 * b.s, -RB.y0 * b.s, { x0: RB.x0, y0: RB.y0 + y0 / b.s - 1, x1: RB.x1, y1: RB.y0 + y1 / b.s + 1 }, 'over');
      ctx.restore();
      b.row = y1;
    }
    b.done = b.row >= b.h;
    return b;
  }
  drawBase(ctx, k, ox, oy) {
    const b = BRCM_CACHE.base, RB = BRCM_RB, V = this.viewRect(2);
    if (!b) return;
    const x0 = Math.max(V.x0, RB.x0), y0 = Math.max(V.y0, RB.y0), x1 = Math.min(V.x1, RB.x1), y1 = Math.min(V.y1, RB.y1);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.drawImage(b.c, (x0 - RB.x0) * b.s, (y0 - RB.y0) * b.s, (x1 - x0) * b.s, (y1 - y0) * b.s, x0 * k + ox, y0 * k + oy, (x1 - x0) * k, (y1 - y0) * k);
  }
  makeTile(i, j, sT, tw) {
    const C = BRCM_CACHE, t0 = performance.now();
    const c = C.pool.pop() || makeCanvas(BRCM.TILE, BRCM.TILE), ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    brcmRenderStatic(ctx, sT, -i * BRCM.TILE, -j * BRCM.TILE, { x0: i * tw - 1, y0: j * tw - 1, x1: (i + 1) * tw + 1, y1: (j + 1) * tw + 1 }, 'close');
    C.tiles.set(i + ',' + j, c);
    this.perf.tiles++; this.perf.tileMs += performance.now() - t0;
  }
  drawTiles(ctx, k, ox, oy, budget) {
    const C = BRCM_CACHE, T = BRCM.TILE, sT = this.zClose * Game.dpr, key = 'ow' + sT.toFixed(4), RB = BRCM_RB;
    if (C.key !== key) { for (const c of C.tiles.values()) C.pool.push(c); C.tiles.clear(); C.key = key; }
    const tw = T / sT, V = this.viewRect(0);
    const i0 = Math.floor(Math.max(V.x0, RB.x0) / tw), i1 = Math.floor(Math.min(V.x1, RB.x1 - 0.01) / tw);
    const j0 = Math.floor(Math.max(V.y0, RB.y0) / tw), j1 = Math.floor(Math.min(V.y1, RB.y1 - 0.01) / tw);
    const cx = (V.x0 + V.x1) / 2, cy = (V.y0 + V.y1) / 2, missing = [];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (!C.tiles.has(i + ',' + j)) missing.push({ i, j, d: Math.hypot((i + 0.5) * tw - cx, (j + 0.5) * tw - cy) });
    const t0 = performance.now();
    if (missing.length && !this.zoomAnim) {
      missing.sort((a, b) => a.d - b.d);
      while (missing.length && performance.now() - t0 < budget) { const m = missing.shift(); this.makeTile(m.i, m.j, sT, tw); }
    }
    // spare time: prefetch a ring of tiles around the view so walking and panning find them ready
    if (!missing.length && !this.zoomAnim && performance.now() - t0 < 2) {
      const P = [], pi0 = Math.max(i0 - 2, Math.floor(RB.x0 / tw)), pi1 = Math.min(i1 + 2, Math.floor((RB.x1 - 0.01) / tw));
      const pj0 = Math.max(j0 - 2, Math.floor(RB.y0 / tw)), pj1 = Math.min(j1 + 2, Math.floor((RB.y1 - 0.01) / tw));
      for (let j = pj0; j <= pj1; j++) for (let i = pi0; i <= pi1; i++) if (!C.tiles.has(i + ',' + j)) P.push({ i, j, d: Math.hypot((i + 0.5) * tw - cx, (j + 0.5) * tw - cy) });
      P.sort((a, b) => a.d - b.d);
      const t1 = performance.now();
      while (P.length && performance.now() - t1 < 3 && C.tiles.size < BRCM.TILE_MAX - 4) { const m = P.shift(); this.makeTile(m.i, m.j, sT, tw); }
    }
    if (missing.length && this.intro === 0) { this.ensureBase(false); this.drawBase(ctx, k, ox, oy); }
    const sc = k / sT;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const id = i + ',' + j, c = C.tiles.get(id);
      if (!c) continue;
      C.tiles.delete(id); C.tiles.set(id, c);           // most recently used last
      const x0 = Math.round(i * T * sc + ox), y0 = Math.round(j * T * sc + oy), x1 = Math.round((i + 1) * T * sc + ox), y1 = Math.round((j + 1) * T * sc + oy);
      ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0);
    }
    while (C.tiles.size > BRCM.TILE_MAX) { const first = C.tiles.keys().next().value; C.pool.push(C.tiles.get(first)); C.tiles.delete(first); }
    return missing.length;
  }

  /* ----- fog of war over the lands not reached yet ----- */
  initFog() {
    const RB = BRCM_RB, fs = 0.2, w = Math.ceil((RB.x1 - RB.x0) * fs), h = Math.ceil((RB.y1 - RB.y0) * fs);
    this.fog = { fs, w, h, m: makeCanvas(w, h), b: makeCanvas(w, h), c: makeCanvas(w, h) };
    if (!BRCM_SPR.fogtex || BRCM_SPR.fogtex.width !== w) {
      const t = makeCanvas(w, h), x = t.getContext('2d'), rng = mulberry32(31);
      x.fillStyle = '#3d2c4a'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 110; i++) {
        const px = rng() * w, py = rng() * h, r = rng.range(8, 30), lt = rng() < 0.62, g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, lt ? 'rgba(214,180,166,0.32)' : 'rgba(18,10,30,0.34)'); g.addColorStop(1, lt ? 'rgba(214,180,166,0)' : 'rgba(18,10,30,0)');
        x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
      }
      BRCM_SPR.fogtex = t;
    }
    this.fogDirty = true;
  }
  renderFog() {
    const F = this.fog, RB = BRCM_RB, G = this.G, B = BRCM.B;
    const m = F.m.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, F.w, F.h);
    m.setTransform(F.fs, 0, 0, F.fs, -RB.x0 * F.fs, -RB.y0 * F.fs);
    let open = 0; for (const w of WORLD3_REGIONS) open += clamp(this.regionK[w] || 0, 0, 1);
    this.baseFog = lerp(0.42, 0.06, open / WORLD3_REGIONS.length);
    m.fillStyle = '#000'; m.globalAlpha = this.baseFog; m.fillRect(RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0);
    for (const w of WORLD3_REGIONS) { const k = this.regionK[w] || 0; if (k < 1 && !brcmLand(w).secret) { m.globalAlpha = (1 - k) * 0.92; m.beginPath(); owLandPath(m, w, 18); m.fill('evenodd'); } }
    m.globalCompositeOperation = 'destination-out';
    m.globalAlpha = 1; m.beginPath(); m.rect(RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0); m.rect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0 - 8, B.y1 - B.y0 - 8); m.fill('evenodd');
    for (const w of WORLD3_REGIONS) { const k = this.regionK[w] || 0; if (k > 0) { m.globalAlpha = k; m.beginPath(); owLandPath(m, w, 18); m.fill('evenodd'); } }
    for (const N of G.list) {
      if (!WorldGame.isUnlocked(N.id)) continue;
      const a = this.pendingNodes.has(N.id) ? 0 : this.popT[N.id] !== undefined ? clamp(this.popT[N.id] / 0.7, 0, 1) : 1;
      if (a <= 0) continue;
      m.globalAlpha = a; m.beginPath(); m.arc(N.x, N.y, 46, 0, TAU); m.fill();
    }
    m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
    const b = F.b.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(0, 0, F.w, F.h);
    b.globalCompositeOperation = 'lighter';
    const offs = [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2], [-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]];
    b.globalAlpha = 1 / offs.length; for (const [dx, dy] of offs) b.drawImage(F.m, dx, dy);
    b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    const c = F.c.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, F.w, F.h);
    c.drawImage(BRCM_SPR.fogtex, 0, 0);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(F.b, 0, 0); c.globalCompositeOperation = 'source-over';
    this.fogDirty = false;
  }
  fogAt(x, y) {                    // rough fog density at a world point (for the drifting haze)
    for (const w of WORLD3_REGIONS) if (!brcmLand(w).secret && owInLand(w, x, y)) return 1 - (this.regionK[w] || 0);
    return this.baseFog === undefined ? 0.4 : this.baseFog;
  }

  /* ----- frame ----- */
  draw(ctx) {
    this.layoutZoom();
    const t0 = performance.now(), dpr = Game.dpr, z = this.cam.z, k = z * dpr;
    const ox = Math.round((this.vcx - this.cam.x * z) * dpr), oy = Math.round((this.vcy - this.cam.y * z) * dpr);
    this.nsCache = new Map();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BRCM.NIGHT; ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
    let missing = 0;
    if (z >= this.zClose * 0.72) missing = this.drawTiles(ctx, k, ox, oy, this.intro < 1 ? 7 : 12);
    else {
      const b = this.ensureBase(this.zoomMode === 'over' && !(this.intro > 0), this.intro > 0 ? 14 : 3);
      if (!b.done) missing = 1;
      this.drawBase(ctx, k, ox, oy);
    }
    if (this.intro > 0 && !missing) this.intro = Math.max(0, this.intro - (this.lastFrameT ? Math.min(0.05, (t0 - this.lastFrameT) / 1000) : 0.016) / 0.35);
    if (this.lastFrameT && !this.intro) {
      const fdt = t0 - this.lastFrameT;
      if (fdt > 24 && fdt < 200) this.slowT += fdt / 1000; else this.slowT = Math.max(0, this.slowT - fdt / 2000);
      if (this.slowT > 1.5) this.fx = 0.5;
    }
    this.lastFrameT = t0;
    this.drawLiving(ctx, k, ox, oy);
    if (this.fogDirty) this.renderFog();
    ctx.setTransform(k, 0, 0, k, ox, oy);
    const RB = BRCM_RB;
    ctx.globalAlpha = 0.86; ctx.drawImage(this.fog.c, RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0); ctx.globalAlpha = 1;
    this.drawHaze(ctx, k, ox, oy);
    this.drawLandmarks(ctx, k, ox, oy);
    this.drawLandLabels(ctx);
    this.drawPaths(ctx, k, ox, oy);
    this.drawNodes(ctx);
    this.drawBradyMap(ctx);
    this.drawParts(ctx, k, ox, oy);
    if (this.intro > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = this.intro; ctx.fillStyle = BRCM.NIGHT; ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height); ctx.globalAlpha = 1; }
    this.drawHUD(ctx);
    this.nsCache = null;
    // build the overview canvas a strip at a time while nothing else is going on
    if (this.t > 1.2 && !this.intro && !this.walk && !this.rv && !this.zoomAnim && !this.ptrs.size && !(BRCM_CACHE.base && BRCM_CACHE.base.done)) this.ensureBase(false);
    const ms = performance.now() - t0, P = this.perf;
    P.frames++; P.drawMs += ms; P.maxMs = Math.max(P.maxMs, ms); P.last = ms; if (P.first === undefined) P.first = ms;
  }
  drawLiving(ctx, k, ox, oy) {
    const t = this.t, z = this.cam.z, V = this.viewRect(16), G = this.G, L = this.L;
    const inV = (x, y, r) => x + r > V.x0 && x - r < V.x1 && y + r > V.y0 && y - r < V.y1;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    owLive41(ctx, L, t, z, inV, G); owLive42(ctx, L, t, z, inV, G); owLive43(ctx, L, t, z, inV, G); owLive44(ctx, L, t, z, inV, G);
    owLive45(ctx, L, t, z, inV, G); owLive46(ctx, L, t, z, inV, G); owLive47(ctx, L, t, z, inV, G);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
  }
  drawHaze(ctx, k, ox, oy) {
    if (this.fx < 1 || !this.hazeClouds) {
      if (!this.hazeClouds) { const rng = mulberry32(9); this.hazeClouds = []; for (let i = 0; i < 5; i++) this.hazeClouds.push({ x: rng.range(0, OW.W), y: rng.range(0, OW.H), s: rng.range(200, 320), a: rng.range(0.6, 1), vx: rng.range(4, 7), vy: rng.range(-1, 1.5) }); }
      if (this.fx < 1) return;
    }
    const V = this.viewRect(0), cl = brcmCloud(), B = BRCM.B;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.save(); ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();
    for (const c of this.hazeClouds) {
      c.x = ((c.x + c.vx / 60 + c.s) % (OW.W + 2 * c.s)) - c.s;
      if (c.x + c.s < V.x0 || c.x - c.s > V.x1 || c.y + c.s < V.y0 || c.y - c.s > V.y1) continue;
      ctx.globalAlpha = c.a * (0.08 + 0.3 * this.fogAt(c.x, c.y));
      if (ctx.globalAlpha < 0.05) continue;
      ctx.drawImage(cl, c.x - c.s, c.y - c.s * 0.75, c.s * 2, c.s * 1.5);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  drawLandmarks(ctx, k, ox, oy) {
    const t = this.t, V = this.viewRect(30), M = OW.M;
    if (M.x + 120 > V.x0 && M.x - 120 < V.x1 && M.y - 200 < V.y1 && M.y + 40 > V.y0) owDrawMan(ctx, t, k, ox, oy, lerp(0.6, 1, this.regionK[48] || 0));
    const s49 = this.regionK[49] || 0, s50 = this.regionK[50] || 0;
    if (s49 > 0 && V.y0 < 220) owDrawSunrise(ctx, t, k, ox, oy, s49);
    if (s50 > 0 && V.y0 < 180 && V.x1 > 780) owDrawW22(ctx, t, k, ox, oy, s50);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  drawLandLabels(ctx) {
    const dpr = Game.dpr, z = this.cam.z, W = Game.cssW, H = Game.cssH, size = clamp(z * 9, 9, 17);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const w of WORLD3_REGIONS) {
      const k = this.regionK[w] || 0, at = OW.LABELS[w];
      if (k <= 0.02 || !at || (w === 48 && z < this.zClose * 0.5)) continue;
      const p = this.toScreen(at[0], at[1]);
      if (p.x < -160 || p.x > W + 160 || p.y < -40 || p.y > H + 40) continue;
      const Ld = brcmLand(w), txt = Ld.name.toUpperCase();
      ctx.save(); ctx.translate(p.x, p.y); if (at[2]) ctx.rotate(at[2]);
      ctx.font = `${Math.round(size)}px ${FONT_DISPLAY}`;
      ctx.globalAlpha = k * 0.92;
      ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(22,10,32,0.8)'; ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = mix(Ld.color, '#ffffff', 0.3); ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  polyPath(ctx, P, s0, s1, pts) {
    pts = pts || P.pts;
    const a = brcmAlong(P, s0), b = brcmAlong(P, s1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for (let i = 0; i < pts.length; i++) if (P.cum[i] > s0 && P.cum[i] < s1) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(b.x, b.y);
  }
  bridgeBands(P) {                   // the rainbow bridge as six parallel bands (cached)
    if (P.bands) return P.bands;
    const n = P.pts.length, bands = [];
    for (let k = 0; k < 6; k++) {
      const off = (k - 2.5) * 2.1, pts = [];
      for (let i = 0; i < n; i++) {
        const a = P.pts[Math.max(0, i - 1)], b = P.pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        pts.push({ x: P.pts[i].x - dy / d * off, y: P.pts[i].y + dx / d * off });
      }
      bands.push(pts);
    }
    return (P.bands = bands);
  }
  drawBridge(ctx, P, s0, s1, t, z) {
    const cols = ['#ff4a5a', '#ff9a3a', '#ffe14a', '#5ee86a', '#4aa8ff', '#a26aff'], bands = this.bridgeBands(P);
    ctx.save();
    ctx.translate(0, 9); ctx.strokeStyle = 'rgba(20,8,30,0.22)'; ctx.lineWidth = 14; this.polyPath(ctx, P, s0, s1); ctx.stroke(); ctx.translate(0, -9);
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,230,255,0.25)'; ctx.lineWidth = 20; this.polyPath(ctx, P, s0, s1); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 6; k++) { ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.6; ctx.globalAlpha = 0.92; this.polyPath(ctx, P, s0, s1, bands[k]); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    for (let g = 0; g < 3; g++) { const u = ((t * 0.16 + g / 3) % 1) * (s1 - s0) + s0, h = brcmAlong(P, u); ctx.drawImage(brcmGlow('#ffffff', 0), h.x - 6, h.y - 6, 12, 12); }
    ctx.restore();
  }
  drawPaths(ctx, k, ox, oy) {
    const G = this.G, t = this.t, z = this.cam.z, V = this.viewRect(14), px = 1 / z;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const P of G.paths) {
      if (!P.bb) { P.bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; for (const q of P.pts) { P.bb.x0 = Math.min(P.bb.x0, q.x); P.bb.y0 = Math.min(P.bb.y0, q.y); P.bb.x1 = Math.max(P.bb.x1, q.x); P.bb.y1 = Math.max(P.bb.y1, q.y); } }
      if (P.bb.x1 < V.x0 || P.bb.x0 > V.x1 || P.bb.y1 < V.y0 || P.bb.y0 > V.y1) continue;
      const st = this.pathState(P);
      if (st === 'hidden') continue;
      if (st === 'hint' || (st === 'reveal' && !P.secret)) {
        this.polyPath(ctx, P, 0, P.len); ctx.setLineDash([0.01, 8 * px]);
        ctx.strokeStyle = 'rgba(26,14,38,0.42)'; ctx.lineWidth = 4.4 * px; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,244,250,0.6)'; ctx.lineWidth = 2.4 * px; ctx.stroke(); ctx.setLineDash([]);
      }
      if (st === 'hint') continue;
      if (st === 'reveal') {
        const rv = this.rv, s = rv.step, p = clamp(rv.t / this.revealDur(P), 0, 1);
        if (p <= 0) continue;
        const a = s.dir === 1 ? 0 : P.len * (1 - p), b = s.dir === 1 ? P.len * p : P.len;
        if (P.bridge) { this.drawBridge(ctx, P, a, b, t, z); continue; }
        this.polyPath(ctx, P, a, b);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = P.secret ? 'rgba(90,255,180,0.32)' : 'rgba(255,110,220,0.34)'; ctx.lineWidth = 12 * px; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        if (P.secret) {
          for (let x = a, i = 0; x < b; x += 8, i++) { this.polyPath(ctx, P, x, Math.min(b, x + 8.5)); ctx.strokeStyle = `hsl(${(t * 320 + i * 28) % 360},100%,66%)`; ctx.lineWidth = 4.4 * px; ctx.stroke(); }
        } else { ctx.strokeStyle = '#ffd6f6'; ctx.lineWidth = 4 * px; ctx.stroke(); }
        continue;
      }
      if (P.bridge) { this.drawBridge(ctx, P, 0, P.len, t, z); continue; }
      const done = WorldGame.isDone(P.from) && WorldGame.isDone(P.to);
      const col = P.secret ? `hsl(${150 + 28 * Math.sin(t * 2.2 + P.i)},100%,64%)` : done ? '#ffd84a' : '#ff7ade';
      this.polyPath(ctx, P, 0, P.len);
      if (z > this.zClose * 0.6) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = P.secret ? 'rgba(80,255,170,0.2)' : done ? 'rgba(255,200,80,0.17)' : 'rgba(255,90,210,0.2)'; ctx.lineWidth = 11 * px; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = 'rgba(24,12,34,0.55)'; ctx.lineWidth = 5 * px; ctx.stroke();
      ctx.setLineDash([0.01, 9 * px]); ctx.lineDashOffset = -t * 9 * px;
      ctx.strokeStyle = col; ctx.lineWidth = 3.8 * px; ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    ctx.lineCap = 'butt';
  }
  drawNodes(ctx) {
    const dpr = Game.dpr, t = this.t, sc = this.nodeScale(), W = Game.cssW, H = Game.cssH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const N of this.G.list) {
      const st = this.nodeState(N.id);
      if (st === 'hidden') continue;
      const p = this.toScreen(N.x, N.y);
      if (p.x < -40 || p.x > W + 40 || p.y < -50 || p.y > H + 40) continue;
      let s = sc;
      const pt = this.popT[N.id];
      if (pt !== undefined) { const u = clamp(pt / 0.45, 0, 1), c1 = 2.2; s *= 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
      if (s <= 0.02) continue;
      let x = p.x; const y = p.y;
      const bt = this.bumpT[N.id]; if (bt) x += Math.sin(bt * 70) * 4 * (bt / 0.35);
      if (st === 'open') {
        const pu = 0.5 + 0.5 * Math.sin(t * 3 + N.i), g = 30 * s;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28 + 0.28 * pu;
        ctx.drawImage(brcmGlow(this.secretPending(N.id) ? '#2ee6d0' : '#ff4fd8', 1), x - g, y - g, g * 2, g * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (N.id === this.sel) {
        ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.setLineDash([4, 3.2]); ctx.lineDashOffset = -t * 14;
        ctx.beginPath(); ctx.ellipse(x, y + 4 * s, 20 * s, 12 * s, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      const S = 48 * s, secret = N.type === 'level' && st !== 'locked' && this.secretPending(N.id);
      ctx.drawImage(owIcon(N.type, st, secret, dpr, N.type === 'level' ? String(N.i) : ''), x - S / 2, y - S / 2 - 2 * s, S, S);
      if (sc > 0.72 && st !== 'locked') {
        const gc = WorldGame.goldCount(N.id), g = Save.data.gold[N.id] || [];
        for (let i = 0; i < 3; i++) {
          const has = gc && g[i], qx = x + (i - 1) * 8.5 * s, qy = y + 19 * s;
          ctx.fillStyle = has ? '#ffffff' : 'rgba(255,255,255,0.35)'; rr(ctx, qx - 3.2 * s, qy - 3.6 * s, 6.4 * s, 7.4 * s, 1.2 * s); ctx.fill();
          ctx.fillStyle = has ? '#ff5fd2' : 'rgba(20,10,30,0.7)'; ctx.fillRect(qx - 2.3 * s, qy - 2.7 * s, 4.6 * s, 4.2 * s);
        }
      }
      if (WorldGame.secretFound(N.id)) {
        const r = (4.5 + Math.sin(t * 5 + N.i) * 1.2) * Math.max(0.7, s), sx = x + 13 * s, sy = y - 13 * s;
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(brcmGlow('#3dff9a', 1), sx - r * 2, sy - r * 2, r * 4, r * 4); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#7dffbf'; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 1.5, rr2 = i % 2 ? r * 0.32 : r; ctx.lineTo(sx + Math.cos(a) * rr2, sy + Math.sin(a) * rr2); }
        ctx.closePath(); ctx.fill();
      }
    }
  }
  drawBradyMap(ctx) {
    const dpr = Game.dpr, b = this.bradyPos(), p = this.toScreen(b.x, b.y), s = 1.08 * this.nodeScale();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3;
    ctx.drawImage(brcmGlow('#ffcf8a', 1), p.x - 30 * s, p.y - 18 * s, 60 * s, 34 * s);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(p.x, p.y + 1, 0, p.x, p.y + 1, 11 * s);
    g.addColorStop(0, 'rgba(10,4,20,0.6)'); g.addColorStop(1, 'rgba(10,4,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 11 * s, 4 * s, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    drawBrady(ctx, { x: 0, y: 0, facing: this.facing, small: true, power: 0, anim: this.anim, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
  }
  drawParts(ctx, k, ox, oy) {
    if (!this.parts.length) return;
    const z = this.cam.z;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.dust) { const r = p.sz / z * (1.7 - a); ctx.globalAlpha = a * 0.5; ctx.drawImage(brcmGlow(p.c, 1), p.x - r, p.y - r, r * 2, r * 2); }
      else { const r = p.sz / z * (0.4 + a); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(brcmGlow(p.c), p.x - r, p.y - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over'; }
    }
    ctx.globalAlpha = 1;
  }
  progress() {
    let done = 0, photos = 0;
    for (const N of this.G.list) { if (WorldGame.isDone(N.id)) done++; photos += WorldGame.goldCount(N.id); }
    return { done, photos, total: this.G.list.length };
  }
  drawHUD(ctx) {
    const dpr = Game.dpr, W = Game.cssW, H = Game.cssH, S = this.safe, t = this.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(this.vig, 0, 0, W, H);
    if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(120,255,200,${this.flash * 0.3})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    const tg = ctx.createLinearGradient(0, 0, 0, this.topH + 26);
    tg.addColorStop(0, 'rgba(7,4,14,0.9)'); tg.addColorStop(0.65, 'rgba(7,4,14,0.5)'); tg.addColorStop(1, 'rgba(7,4,14,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, this.topH + 26);
    const avail = W - 2 * (this.btnBack.w + S.l + 14);
    UI.title(ctx, 'SUPER BRADY-O WORLD', W / 2, S.t + 21, clamp(avail / 12.6, 12, 22));
    const pr = this.progress();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${pr.done}/${pr.total} CLEARED   ·   ${pr.photos}/${pr.total * 3} PHOTOS`, W / 2, S.t + 42);
    ctx.restore();
    this.drawPanel(ctx);
    UI.drawButtons(ctx, this.btns);
    // zoom icon: magnifier with + (go close) or - (see the whole overworld)
    const zb = this.btnZoom, cx = zb.x + zb.w / 2 - 2, cy = zb.y + zb.h / 2 - 1 + (zb._press > 0 ? 2 : 0);
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5.4, cy + 5.4); ctx.lineTo(cx + 10, cy + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 3.6, cy); ctx.lineTo(cx + 3.6, cy); if (this.zoomMode === 'over') { ctx.moveTo(cx, cy - 3.6); ctx.lineTo(cx, cy + 3.6); } ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.toast) {
      const a = clamp(this.toast.t * 3, 0, 1); ctx.globalAlpha = a; ctx.font = `13px ${FONT_DISPLAY}`;
      const w = ctx.measureText(this.toast.text).width + 32, y = this.panel.y + this.panelOff - 26;
      ctx.fillStyle = 'rgba(14,8,24,0.88)'; rr(ctx, W / 2 - w / 2, y - 15, w, 30, 15); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillText(this.toast.text, W / 2, y + 1);
    }
    // a land's banner: when Brady walks in (name + tag), or when it is first discovered
    const lb = this.banner ? { w: this.banner.w, t: this.banner.t, head: 'NEW LAND DISCOVERED', dur: 3 } : this.landBanner && this.landBanner.t > 0 ? { w: this.landBanner.w, t: this.landBanner.t, head: null, dur: 3.2 } : null;
    if (lb) {
      const Ld = brcmLand(lb.w), a = clamp(lb.t * 3, 0, 1) * clamp((lb.dur - lb.t) * 2, 0, 1), slide = (1 - clamp(lb.t * 3, 0, 1)) * -14;
      const y = this.topH + 30 + slide, sz = clamp(W / 18, 17, 28), name = Ld.name.toUpperCase();
      ctx.globalAlpha = a;
      ctx.font = `${sz}px ${FONT_DISPLAY}`;
      const bw = Math.min(W - 24, Math.max(ctx.measureText(name).width + 70, 240)), bh = sz + 30;
      const g = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2); g.addColorStop(0, 'rgba(24,12,40,0.9)'); g.addColorStop(1, 'rgba(10,6,20,0.9)');
      ctx.fillStyle = g; rr(ctx, W / 2 - bw / 2, y - bh / 2, bw, bh, 14); ctx.fill();
      ctx.strokeStyle = Ld.color; ctx.lineWidth = 2; rr(ctx, W / 2 - bw / 2, y - bh / 2, bw, bh, 14); ctx.stroke();
      ctx.fillStyle = Ld.color; ctx.beginPath(); ctx.moveTo(W / 2 - bw / 2 - 10, y); ctx.lineTo(W / 2 - bw / 2 + 4, y - 9); ctx.lineTo(W / 2 - bw / 2 + 4, y + 9); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W / 2 + bw / 2 + 10, y); ctx.lineTo(W / 2 + bw / 2 - 4, y - 9); ctx.lineTo(W / 2 + bw / 2 - 4, y + 9); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,4,16,0.9)'; ctx.strokeText(name, W / 2, y - 6);
      ctx.fillStyle = mix(Ld.color, '#ffffff', 0.25); ctx.fillText(name, W / 2, y - 6);
      ctx.font = lb.head ? `600 11px ${FONT_UI}` : `italic 12px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText(lb.head || Ld.tag, W / 2, y + sz / 2 + 4);
    }
    if (this.rv) {
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4); ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = '#ffffff';
      ctx.fillText('TAP TO SKIP', W / 2, Math.min(H - 14, this.panel.y + this.panelOff - 14));
    }
    ctx.restore();
  }
  drawPanel(ctx) {
    const P0 = this.panel, P = { x: P0.x, y: P0.y + this.panelOff, w: P0.w, h: P0.h }, id = this.sel, N = this.G.nodes[id], Ld = brcmLand(N.w), col = Ld.color, portrait = this.portrait;
    if (P.y >= Game.cssH) return;
    let st = this.nodeState(id); if (st === 'hidden') st = 'locked';
    const dpr = Game.dpr, pk = P.w + 'x' + P.h + '@' + dpr;
    if (!this.panelSpr || this.panelSpr.key !== pk) {
      const m = 36, c = makeCanvas((P.w + m * 2) * dpr, (P.h + m * 2) * dpr), x = c.getContext('2d');
      x.scale(dpr, dpr); UI.panel(x, m, m, P.w, P.h);
      this.panelSpr = { key: pk, c, m };
    }
    const sp = this.panelSpr;
    ctx.drawImage(sp.c, P.x - sp.m, P.y - sp.m, P.w + sp.m * 2, P.h + sp.m * 2);
    ctx.save();
    ctx.fillStyle = col; rr(ctx, P.x + 10, P.y + 12, 4, portrait ? 84 : P.h - 24, 2); ctx.fill();
    const tx = P.x + 24, tw = (portrait ? P.x + P.w - 14 : this.btnPlay.x - 14) - tx;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = col;
    ctx.fillText(Ld.name.toUpperCase() + '   ·   ' + (OW_TYPE[N.type] || 'Level').toUpperCase(), tx, P.y + 18);
    const name = WorldGame.name(id).toUpperCase();
    let fs = portrait ? 19 : 18;
    ctx.font = `${fs}px ${FONT_DISPLAY}`;
    const idw = ctx.measureText(id).width;
    while (fs > 11 && idw * 0.7 + 14 + ctx.measureText(name).width > tw) { fs--; ctx.font = `${fs}px ${FONT_DISPLAY}`; }
    ctx.font = `${Math.round(fs * 0.7)}px ${FONT_DISPLAY}`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(id, tx, P.y + 41); const off = ctx.measureText(id).width + 10;
    ctx.font = `${fs}px ${FONT_DISPLAY}`; ctx.fillStyle = st === 'locked' ? 'rgba(255,255,255,0.6)' : '#ffffff';
    ctx.fillText(name, tx + off, P.y + 41);
    const w = N.w, type = BRCM.TYPE[(WORLDS[w] && WORLDS[w].plan || [])[N.i - 1]] || '';
    ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const reg = (N.type === 'gift' ? 'SIDE CAMP  ·  GIVES BRADY A GIFT' : type ? type.toUpperCase() + ' LEVEL' : '');
    ctx.fillText(reg, tx, P.y + (portrait ? 64 : 62));
    let cx = portrait ? tx : tx + ctx.measureText(reg).width + 14;
    const cy = P.y + (portrait ? 86 : 62);
    const chip = (text, fg, bg) => {
      ctx.font = `600 10px ${FONT_UI}`; const w2 = ctx.measureText(text).width + 14;
      if (cx + w2 > tx + tw) return false;
      ctx.fillStyle = bg; rr(ctx, cx, cy - 8, w2, 16, 8); ctx.fill();
      ctx.fillStyle = fg; ctx.fillText(text, cx + 7, cy + 0.5); cx += w2 + 6; return true;
    };
    if (st === 'locked') chip('LOCKED', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.12)');
    else {
      if (st === 'done') chip('CLEARED', '#3a2200', '#ffd84a'); else chip('NOT CLEARED YET', '#ffffff', 'rgba(255,79,216,0.45)');
      if (WorldGame.secretFound(id)) chip('SECRET EXIT FOUND', '#003a1e', '#5dffb0');
      else if (WORLD3_SECRETS[id]) chip('SECRET EXIT HIDDEN', '#003a36', '#7af0e0');
      const gc = WorldGame.goldCount(id);
      if (cx + 92 <= tx + tw) {
        for (let i = 0; i < 3; i++) {
          const qx = cx + 4 + i * 11;
          ctx.fillStyle = i < gc ? '#ffffff' : 'rgba(255,255,255,0.3)'; rr(ctx, qx, cy - 6.5, 8.5, 11, 1.5); ctx.fill();
          ctx.fillStyle = i < gc ? '#ff5fd2' : 'rgba(20,10,30,0.75)'; ctx.fillRect(qx + 1.3, cy - 5.2, 5.9, 6);
        }
        ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(`PHOTOS ${gc}/3`, cx + 40, cy + 0.5);
      }
    }
    ctx.restore();
    const b = this.btnPlay;
    b.disabled = st === 'locked';
    b.label = st === 'locked' ? 'LOCKED' : this.walk && this.walk.target === id && this.walk.playOnArrive ? 'GO!' : 'PLAY';
  }
}
const OverworldScene = BRCMapScene;

window.BRADY_MAP = { BRCMapScene, OverworldScene };
