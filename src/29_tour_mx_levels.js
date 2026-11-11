/* ============================================================
   MEXICO: the levels in the v2 format (LEVEL_OVERHAUL.md §2, world 1).
   Mexico is the first country Brady plays, so it teaches every new
   idea once, gently: the secret room, the hidden exit, the Souvenir
   Stand, a new power-up per level and the headline enemy.
   1-1 Mercado Mayhem      PARADE  three stacked lanes of a market; the bodega under the street
   1-2 Xochimilco Forks    RAIL    a trajinera on branching canals; the lock gate lifts the boat
   1-3 Cenote of Light     DIVE    sunbeams make light-only stones appear; the air pocket
   1-4 Volcán Escape       TOWER   six different bands up a crater while the lava rises
   1-5 Fiesta de la Hacienda LAIR  the patio, the pantry, El Gran Piñatón's tall arena
   1-6 Pit of Swallows     FALL    (secret) freefall through swallow flocks to an underground river
   Art, enemies, pieces and the boss live in 29_tour_mx.js; the atlases in 29_tour_mx_sprites.js.
   ============================================================ */
(() => {
const C = Tour.countries.mx;
if (!C) return;
const COL = C.colors, K = TourKit;
const PAPEL = ['#ff3d8b', '#ffb81a', '#18c2c2', '#8a4aff', '#5ad04a', '#ff6a3a'];
const INK = '#2a1a22';

/* ---------------- decor for the new set pieces ---------------- */
Object.assign(Decor, {
  // the market's entrance arch: two painted pillars, a cut-paper banner reading MERCADO, a little lamp each side
  mxMercadoArch(ctx, x, y, t) {
    const w = 150, h = 170, x0 = x - w / 2;
    ctx.save(); ctx.lineJoin = 'round';
    for (const px of [x0, x0 + w - 22]) {
      ctx.fillStyle = '#e8b878'; ctx.fillRect(px, y - h, 22, h); ctx.fillStyle = '#c8884a'; ctx.fillRect(px + 16, y - h, 6, h);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = PAPEL[k % 6]; ctx.fillRect(px + 3, y - h + 18 + k * 28, 16, 6); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px, y - h, 22, h);
    }
    // the arch beam with its sign
    ctx.fillStyle = '#ff3d8b'; rr(ctx, x0 - 8, y - h - 26, w + 16, 34, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.font = `bold 20px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MERCADO', x, y - h - 8);
    // papel picado hanging under the beam
    for (let k = 0; k < 8; k++) { const fx = x0 + 22 + k * 13.5, sw = Math.sin(t * 2.5 + k) * 1.5; ctx.fillStyle = PAPEL[(k + 2) % 6]; ctx.beginPath(); ctx.moveTo(fx, y - h + 8); ctx.lineTo(fx + 11, y - h + 8); ctx.lineTo(fx + 11 + sw, y - h + 24); ctx.lineTo(fx + 5.5 + sw, y - h + 20); ctx.lineTo(fx + sw, y - h + 24); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  // a tall mooring post striped like a barber's pole of the canal (its collision is the hidden tiles under it)
  mxTallPost(ctx, x, y, t, th, d) {
    const h = d.h, x0 = x - 7;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x0, y - h, 14, h + 70);
    for (let k = 0; k < h / 12; k++) { ctx.fillStyle = PAPEL[k % 6]; ctx.fillRect(x0, y - h + 4 + k * 12, 14, 4); }
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x0 - 2, y - h - 4, 18, 6); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y - h, 14, h + 70);
  },
  // the taco boat under the vendor's stall
  mxVendorHull(ctx, x, y, t) {
    const yy = y + Math.sin(t * 1.8) * 1.5, w = 6 * TS + 16, x0 = x - w / 2;
    ctx.fillStyle = '#18a8a8'; ctx.beginPath(); ctx.moveTo(x0, yy - 2.2 * TS); ctx.lineTo(x0 + w, yy - 2.2 * TS); ctx.lineTo(x0 + w - 14, yy + 18); ctx.lineTo(x0 + 14, yy + 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0 + 6, yy - 2.2 * TS + 10, w - 12, 5); ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x0 + 10, yy - 2.2 * TS + 22, w - 20, 5);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, yy - 2.2 * TS); ctx.lineTo(x0 + w, yy - 2.2 * TS); ctx.lineTo(x0 + w - 14, yy + 18); ctx.lineTo(x0 + 14, yy + 18); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#fff4d8'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('TACOS', x, yy - 2.2 * TS + 40);
  },
  // the bright mirror of an air pocket's surface seen from below, with bubbles collecting under it
  mxAirShine(ctx, x, y, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, 70); g.addColorStop(0, 'rgba(230,255,250,0.55)'); g.addColorStop(1, 'rgba(230,255,250,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 70, y - 110, 140, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x - 60, y - 68 + Math.sin(t * 2) * 1.5, 120, 3);
    ctx.restore();
    for (let q = 0; q < 5; q++) { const u = (t * 0.6 + q / 5) % 1; ctx.fillStyle = 'rgba(232,252,255,0.8)'; ctx.beginPath(); ctx.arc(x - 30 + q * 15, y - u * 60, 2.5, 0, TAU); ctx.fill(); }
  },
  // a short string of papel picado hanging under a ceiling
  mxPapelHang(ctx, x, y, t) { for (let k = 0; k < 4; k++) { const fx = x - 30 + k * 15, sw = Math.sin(t * 2 + k + x) * 1.5; ctx.fillStyle = PAPEL[(k + Math.floor(x / 64)) % 6]; ctx.beginPath(); ctx.moveTo(fx, y - 60); ctx.lineTo(fx + 13, y - 60); ctx.lineTo(fx + 13 + sw, y - 42); ctx.lineTo(fx + 6.5 + sw, y - 46); ctx.lineTo(fx + sw, y - 42); ctx.closePath(); ctx.fill(); } ctx.strokeStyle = 'rgba(60,40,60,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 34, y - 60); ctx.lineTo(x + 32, y - 60); ctx.stroke(); },
  // a swallow's mud nest stuck to the ceiling
  mxMudNest(ctx, x, y, t) { ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.arc(x, y - 30, 14, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#6a4a2a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 10 + k * 5, y - 26 + (k % 2) * 3, 3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(x, y - 24, 4, 0, TAU); ctx.fill(); },
  // the hacienda's gate: thick adobe posts, an iron-studded double door swung open, bougainvillea over the lintel
  mxHaciendaGate(ctx, x, y, t) {
    ctx.save();
    for (const px of [x - 70, x + 46]) { ctx.fillStyle = '#e8c89a'; ctx.fillRect(px, y - 150, 24, 150); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px, y - 150, 24, 150); }
    ctx.fillStyle = '#d8b88a'; ctx.fillRect(x - 78, y - 168, 156, 22); ctx.strokeRect(x - 78, y - 168, 156, 22);
    for (let k = 0; k < 16; k++) { ctx.fillStyle = ['#ff3d8b', '#ff6ab0', '#c82a6a'][k % 3]; ctx.beginPath(); ctx.arc(x - 74 + k * 10, y - 170 + Math.sin(k * 2) * 4, 6, 0, TAU); ctx.fill(); }
    for (const [dx, dir] of [[-46, -1], [46, 1]]) { ctx.fillStyle = '#7a4a24'; ctx.save(); ctx.translate(x + dx, y); ctx.scale(dir * 0.35, 1); ctx.fillRect(0, -140, 60, 140); ctx.restore(); }
    ctx.fillStyle = '#ffd84a'; ctx.font = `bold 12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HACIENDA', x, y - 153);
    ctx.restore();
  },
  // a glassy obsidian cluster
  mxObsidian(ctx, x, y, t) {
    for (const [dx, h, w] of [[-10, 34, 9], [0, 46, 11], [11, 28, 8]]) { ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(x + dx - w, y); ctx.lineTo(x + dx - w * 0.3, y - h); ctx.lineTo(x + dx + w * 0.4, y - h + 6); ctx.lineTo(x + dx + w, y); ctx.fill(); ctx.strokeStyle = 'rgba(180,140,255,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + dx - w * 0.3, y - h); ctx.lineTo(x + dx - w * 0.1, y - 4); ctx.stroke(); }
  },
  // a string of papel picado across the pit, with gaps to fall through
  mxPapelLine(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, x1 = x + d.w / 2, yy = y - 24;
    ctx.strokeStyle = 'rgba(60,40,60,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    for (let fx = x0 + 34; fx < x1 - 20; fx += 15) {
      const tx = Math.floor(fx / TS); if ((d.holes || []).some(([a, b]) => tx >= a && tx <= b)) continue;
      const k = Math.floor(fx / 15), sw = Math.sin(t * 3 + k) * 1.5;
      ctx.fillStyle = PAPEL[k % 6]; ctx.beginPath(); ctx.moveTo(fx, yy); ctx.lineTo(fx + 13, yy); ctx.lineTo(fx + 13 + sw, yy + 18); ctx.lineTo(fx + 6.5 + sw, yy + 14); ctx.lineTo(fx + sw, yy + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(fx + 6.5, yy + 7, 2, 0, TAU); ctx.fill();
    }
  },
  // a flower whose updraft brakes your fall
  mxUpFlower(ctx, x, y, t) {
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t; ctx.fillStyle = k % 2 ? '#ff6ab0' : '#ffd84a'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 9, y - 12 + Math.sin(a) * 4, 7, 4, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(x, y - 12, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.6)'; for (let q = 0; q < 5; q++) { const u = (t * 0.8 + q / 5) % 1; ctx.beginPath(); ctx.arc(x - 30 + q * 15, y - 20 - u * 150, 2, 0, TAU); ctx.fill(); }
  },
  // the hole in the pit wall with a swallow darting in and out (the tell for the nest room)
  mxNestHole(ctx, x, y, t, th, d) {
    const dir = d.seed ? -1 : 1, hx = x + dir * 10;
    ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse(hx, y - 34, 16, 26, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a6a4a'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(hx - 14 + k * 4.5, y - 8 + Math.sin(k) * 2, 4, 0, TAU); ctx.fill(); }
    const u = (t * 0.45) % 1, bx = hx + dir * (130 * (1 - u)), by = y - 34 - Math.sin(u * Math.PI) * 50;
    if (u < 0.95) { ctx.save(); ctx.translate(bx, by); ctx.scale(-dir, 1); ctx.fillStyle = '#2a3a6a'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-13, -4); ctx.lineTo(-10, 0); ctx.lineTo(-13, 4); ctx.fill(); const f = Math.sin(t * 20); ctx.beginPath(); ctx.moveTo(-1, -1); ctx.lineTo(2, -9 - f * 4); ctx.lineTo(4, -1); ctx.fill(); ctx.fillStyle = '#f4e4c8'; ctx.beginPath(); ctx.arc(4, 1.5, 2.5, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  // a cut-paper flag planted on the crater rim
  mxRimFlag(ctx, x, y, t) {
    ctx.fillStyle = '#4a3a3a'; ctx.fillRect(x - 2, y - 70, 4, 70);
    for (let k = 0; k < 4; k++) { const sw = Math.sin(t * 3 + k) * 3; ctx.fillStyle = PAPEL[k]; ctx.beginPath(); ctx.moveTo(x + 2, y - 70 + k * 9); ctx.lineTo(x + 30 + sw, y - 68 + k * 9); ctx.lineTo(x + 2, y - 62 + k * 9); ctx.fill(); }
  },
  // a little flower raft floating in the canal (under a checkpoint flag)
  mxRaftFlag(ctx, x, y, t) {
    const yy = y + 16 + Math.sin(t * 2) * 1.5;
    ctx.fillStyle = '#5a8a3a'; rr(ctx, x - 26, yy, 52, 9, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = PAPEL[k % 6]; ctx.beginPath(); ctx.arc(x - 21 + k * 7, yy - 1, 3, 0, TAU); ctx.fill(); }
  },
  // the landing stage at either end of the canals: a flower arch over the dock
  mxDockArch(ctx, x, y, t, th, d) {
    const w = 110, x0 = x - w / 2 + (d.seed ? 0 : 30);
    ctx.save();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x0, y - 120, 6, 120); ctx.fillRect(x0 + w - 6, y - 120, 6, 120);
    for (let k = 0; k <= 18; k++) { const a = Math.PI + k / 18 * Math.PI, fx = x0 + w / 2 + Math.cos(a) * w / 2, fy = y - 120 + Math.sin(a) * 26; ctx.fillStyle = PAPEL[k % 6]; ctx.beginPath(); ctx.arc(fx, fy, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff4d8'; rr(ctx, x0 + 14, y - 136, w - 28, 18, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ff3d8b'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.seed ? '¡ADIÓS!' : 'XOCHIMILCO', x0 + w / 2, y - 127);
    ctx.restore();
  },
  // the cellar canal under the street: brick vaults, a lantern, jars and a strip of dark water behind the walkway
  mxVault(ctx, x, y, t, th, d) {
    const w = 8 * TS, h = 4 * TS + 6, x0 = x - w / 2, seed = d.seed || 0;
    ctx.save();
    const g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, '#3a2016'); g.addColorStop(1, '#5a3420');
    ctx.fillStyle = g; ctx.fillRect(x0, y - h, w + 1, h);
    // brick courses
    for (let r = 0; r < 8; r++) for (let k = -1; k < 9; k++) { const bx = x0 + k * 32 + (r % 2) * 16, by = y - h + r * 16; ctx.fillStyle = (k + r + seed) % 3 ? 'rgba(140,80,50,0.35)' : 'rgba(110,60,40,0.35)'; ctx.fillRect(Math.max(x0, bx + 1), by + 1, Math.min(30, x0 + w - bx - 1), 14); }
    // the vault arch with a dark niche and shelves of jars
    const ax = x0 + w / 2;
    ctx.fillStyle = '#1e100c'; ctx.beginPath(); ctx.moveTo(ax - 70, y); ctx.lineTo(ax - 70, y - h + 50); ctx.arc(ax, y - h + 50, 70, Math.PI, TAU); ctx.lineTo(ax + 70, y); ctx.fill();
    ctx.strokeStyle = '#a8704a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(ax, y - h + 50, 73, Math.PI, TAU); ctx.stroke();
    ctx.fillStyle = '#6a3e1c'; ctx.fillRect(ax - 60, y - 58, 120, 5);
    for (let k = 0; k < 6; k++) { const jx = ax - 50 + k * 20, jh = 14 + ((k * 7 + seed) % 10), col = ['#c84a2a', '#e8a83a', '#5a8a3a', '#d86a8a', '#e8d8a8'][(k + seed) % 5]; ctx.fillStyle = 'rgba(232,244,255,0.3)'; rr(ctx, jx - 7, y - 58 - jh, 14, jh, 4); ctx.fill(); ctx.fillStyle = col; rr(ctx, jx - 6, y - 58 - jh * 0.7, 12, jh * 0.7 - 1, 3); ctx.fill(); }
    // canal water behind the walkway: a dark strip with moving glints
    ctx.fillStyle = '#123a44'; ctx.fillRect(x0, y - 14, w + 1, 14);
    ctx.fillStyle = 'rgba(120,220,230,0.45)'; for (let k = 0; k < 5; k++) { const gx = x0 + ((k * 53 + t * 20 + seed * 9) % w); ctx.fillRect(gx, y - 9 + (k % 2) * 4, 12, 1.5); }
    // a lantern on the pier between the vaults (lit decor)
    if (seed % 2 === 0) { const lx = x0 + 10; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, y - h); ctx.lineTo(lx, y - h + 26); ctx.stroke(); ctx.fillStyle = `rgba(255,${200 + Math.sin(t * 6 + seed) * 20},110,0.95)`; rr(ctx, lx - 6, y - h + 26, 12, 14, 3); ctx.fill(); }
    ctx.restore();
  },
  // the fiesta stage at the end of the market: a tiled dais under a sun banner and papel picado
  mxStage(ctx, x, y, t) {
    const w = 18 * TS, x0 = x - w / 2 - TS / 2, top = y - 2 * TS;
    ctx.save();
    // the dais: a skirt of painted tiles under the plank top, with posts
    ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x0, top + 6, w, 2 * TS - 6);
    for (let k = 0; k < 18; k++) { const tx = x0 + k * TS; ctx.fillStyle = k % 2 ? '#f4f0e0' : '#2a7ad8'; ctx.fillRect(tx + 4, top + 14, TS - 8, TS - 8); ctx.fillStyle = k % 2 ? '#2a7ad8' : '#ffd84a'; ctx.beginPath(); ctx.arc(tx + TS / 2, top + 14 + (TS - 8) / 2, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a2416'; for (const px of [x0, x0 + w - 8]) ctx.fillRect(px, top + 6, 8, 2 * TS - 6);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x0, top + 6, w, 2 * TS - 6);
    // poles and three strings of papel picado over the dais
    ctx.fillStyle = '#6a4a2a'; for (const px of [x0 + 4, x0 + w - 8]) ctx.fillRect(px, top - 150, 5, 150);
    for (let s = 0; s < 3; s++) { const yy = top - 140 + s * 26, a = x0 + 6, b = x0 + w - 6; ctx.strokeStyle = 'rgba(60,40,60,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a, yy); ctx.quadraticCurveTo(x, yy + 22, b, yy); ctx.stroke();
      for (let k = 0; k < 18; k++) { const fx = a + 6 + k * (b - a - 12) / 17, fy = yy + Math.sin((fx - a) / (b - a) * Math.PI) * 11, sw = Math.sin(t * 2 + k + s) * 1.4; ctx.fillStyle = PAPEL[(k + s * 2) % 6]; ctx.beginPath(); ctx.moveTo(fx - 6, fy); ctx.lineTo(fx + 6, fy); ctx.lineTo(fx + 6 + sw, fy + 13); ctx.lineTo(fx + sw, fy + 10); ctx.lineTo(fx - 6 + sw, fy + 13); ctx.closePath(); ctx.fill(); } }
    ctx.translate(-w * 0.28, top - 70);
    // the sun banner
    ctx.translate(x, 0); ctx.rotate(Math.sin(t * 0.8) * 0.03);
    ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * 18, Math.sin(a - 0.12) * 18); ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a + 0.12) * 18, Math.sin(a + 0.12) * 18); ctx.fill(); }
    ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    K.eyes(ctx, 0, -3, 0, 6, 3, false); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 4, 7, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  }
});
TOUR_DECOR_LIGHTS.mxVault = [130, '#ffc070', -100];

/* ---------------- entities ---------------- */
// a sunbeam slanting down into the cenote. It lights a column (light-only stones shimmer into view inside it); with a
// period it comes and goes as clouds pass over the mouth of the cenote (a 1 s warning flicker before it fades)
class MxSunbeam extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, (s.h || 14) * TS); this.x = s.x - this.w / 2; this.y = s.y - this.h; this.period = s.period || 0; this.ph = s.phase || 0; this.k = 1; this.back = true; }
  update(dt) {
    this.t += dt;
    if (this.period) { const u = ((this.t + this.ph) % this.period) / this.period; this.k = u < 0.55 ? 1 : u < 0.62 ? 1 - (u - 0.55) / 0.07 : u < 0.9 ? 0 : (u - 0.9) / 0.1; this.warn = u > 0.47 && u < 0.55; }
  }
  get lights() { if (this.k < 0.05) return null; const out = []; for (let y = this.y + 2 * TS; y < this.y + this.h; y += 3 * TS) out.push({ x: this.cx + (y - this.y) * 0.18, y, r: 120 * this.k, c: 'rgba(220,255,240,', a: 0.35 }); return out; }
  draw(ctx) {
    const k = this.k * (this.warn ? 0.6 + 0.4 * Math.sin(this.t * 30) : 1); if (k < 0.02) return;
    const x = this.cx, y0 = this.y, h = this.h, w = this.w;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, `rgba(230,255,240,${0.42 * k})`); g.addColorStop(1, 'rgba(200,255,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.35, y0); ctx.lineTo(x + w * 0.35, y0); ctx.lineTo(x + w * 0.35 + h * 0.18 + w * 0.3, y0 + h); ctx.lineTo(x - w * 0.35 + h * 0.18 - w * 0.3, y0 + h); ctx.closePath(); ctx.fill();
    // motes drifting in the light
    ctx.fillStyle = `rgba(255,255,230,${0.7 * k})`; for (let q = 0; q < 8; q++) { const u = ((this.t * 0.08 + q / 8) % 1), mx = x + Math.sin(q * 2.3 + this.t * 0.7) * w * 0.3 + u * h * 0.18, my = y0 + u * h; ctx.beginPath(); ctx.arc(mx, my, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// a crack in the cenote floor: bubbles rise from it (the tell of the hidden way down)
class MxBubbleCrack extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 8); this.x = s.x - TS; this.y = s.y - 8; this.back = true; }
  update(dt) { this.t += dt; if (Math.random() < dt * 6 && this.g.onScreen(this, 80)) this.g.burst(this.cx + (Math.random() - 0.5) * 30, this.y, 1, '#e8fcff', 'bubble'); }
  draw(ctx) {
    const x = this.cx, y = this.y + 8;
    ctx.strokeStyle = '#1a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 22, y - 2); ctx.lineTo(x - 8, y - 5); ctx.lineTo(x - 2, y - 1); ctx.lineTo(x + 9, y - 6); ctx.lineTo(x + 22, y - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(232,252,255,0.8)'; for (let q = 0; q < 6; q++) { const u = (this.t * 0.5 + q / 6) % 1; ctx.beginPath(); ctx.arc(x + Math.sin(q * 3 + this.t * 2) * 10, y - 6 - u * 90, 2 + q % 3, 0, TAU); ctx.fill(); }
  }
}
Object.assign(ENTITY_TYPES, { mxSunbeam: MxSunbeam, mxBubbleCrack: MxBubbleCrack });

/* ---------------- pieces ---------------- */
const P = {
  // a sign post with a tip (Mexico teaches every new idea once): { text, n }
  tip(st, o) { const x = st.x, n = o.n || 3; st.floor(x, x + n - 1); st.sign(x + Math.floor(n / 2), o.text || ''); return x + n; },
  // the cellar lane's backdrop: brick vaults and the dark canal behind the walkway, from x0 to the cursor
  cellarDress(st, o) {
    const B = st.B, y = st.gy, x1 = o.to || st.x;
    for (let x = o.from || 0; x < x1; x += 8) B.decor.push({ kind: 'mxVault', x: (x + 4) * TS, y: y * TS, w: 8 * TS, h: 4 * TS, seed: (x / 8) | 0 });
    return st.x;
  }
};
Object.assign(P, {
  // rail: an item block hanging over the channel: { item, dy (rows over the deck, 4) }
  boatBlock(st, o) { const x = st.x; st.block(x + 1, (st.deck || st.gy) - (o.dy || 4), o.item || 'power', o.hidden ? T.HIDDEN : null); st.coins(x, x + 2, (st.deck || st.gy) - (o.dy || 4) - 2); return x + 3; },
  // rail: a tall mooring post (three tiles) to hop onto, a postcard or coins on top: { h, gold }
  highPost(st, o) {
    const x = st.x, B = st.B, d = st.deck || st.gy, h = o.h || 3;
    B.fill(x, d - h, x, d - 1, T.HARD); for (let y = d - h; y < d; y++) B.setHide(x, y, 1);
    B.prop('mxTallPost', x, d - h, 1, h, 'none', {});
    if (o.gold) st.gold(x, d - h - 2, o.gold === true ? 'must' : o.gold); else st.coins(x, x, d - h - 2);
    return x + 6;
  },
  // rail: a willow over the water hides a door (walk the boat under it and press UP): { to }
  willowDoor(st, o) {
    const x = st.x, d = st.deck || st.gy;
    st.B.spawn('tourCurtain', x + 2, d - 1, { look: 'willow', skin: 'mxWillow', h: 4 });
    st.B.spawn('portal', x + 2, d - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    return x + 6;
  },
  // checkpoints: on the canals a flag on a flower raft (the boat pulls up wherever Brady respawns); elsewhere the usual
  cp(st, o) {
    if (st.mode !== 'rail') return Tour.pieces.cp(st, o);
    const x = st.x, d = st.deck || st.gy;
    st.B.decorAt('mxRaftFlag', x + 2, d, 0); st.spawn('checkpoint', x + 2, d - 1);
    return x + 5;
  },
  // rail: the start dock (a sign) and the far landing's flower arch; the landing gets an anchor for doors
  embarcadero(st, o) {
    const B = st.B, d = st.deck || st.gy, L = st.len;
    if (o.sign) B.spawn('sign', 3, d - 1, { text: o.sign });
    B.decorAt('mxDockArch', 1, d, 0);
    B.decorAt('mxDockArch', L + 17, d, 1);
    B.anchor('landing', L + 3, d - 1);
    return st.x;
  }
});
Object.assign(P, {
  // swim: a sunbeam column at the cursor: { period (s, clouds pass), phase, w, open (opens the rock above) }
  sunbeam(st, o) {
    const x = st.x + (o.dx || 2), B = st.B;
    if (o.open !== false) for (let xx = x - 1; xx <= x + 1; xx++) for (let y = 0; y < 2; y++) B.set(xx, y, T.EMPTY);
    B.spawn('mxSunbeam', x, st.floorY - 1, { w: o.w || 3, h: st.floorY, period: o.period || 0, phase: o.phase || 0 });
    return st.x + (o.n || 5);
  },
  // swim: a fins stand on the cave floor at the entrance, with its tip
  finsStand(st, o) {
    const x = st.x; st.B.fill(x, st.floorY, x + 4, st.floorY, T.GROUND);
    Tour.pieces.gearStand(st, { item: 'fins', here: true, x: x + 1 }); st.B.spawns[st.B.spawns.length - 1].x = (x + 2) * TS + TS / 2;
    st.B.vkeys[st.B.vkeys.length - 1].tiles = [[x + 2, st.floorY - 1], [x + 2, st.floorY - 2]];
    if (o.sign) st.B.spawn('sign', x + 4, st.floorY - 1, { text: o.sign });
    return x + 6;
  },
  // swim: light-only stones in a sunbeam: an arch of shelves (always solid, visible only in light): { n }
  lightStones(st, o) {
    const x = st.x, B = st.B, F = st.floorY;
    B.spawn('mxSunbeam', x + 6, F - 1, { w: 4, h: F, period: o.period || 0, phase: o.phase || 0 });
    for (let xx = x + 5; xx <= x + 7; xx++) for (let y = 0; y < 2; y++) B.set(xx, y, T.EMPTY);
    // a ring of shimmering stone: a little room with one way in at the top-left, coins and a block inside
    const x0 = x + 3, x1 = x + 10, y0 = 5, y1 = 11;
    for (let xx = x0; xx <= x1; xx++) for (const yy of [y0, y1]) { B.set(xx, yy, T.HARD); B.setHide(xx, yy, 3); }
    for (let yy = y0; yy <= y1; yy++) for (const xx of [x0, x1]) { B.set(xx, yy, T.HARD); B.setHide(xx, yy, 3); }
    for (let xx = x0 + 1; xx <= x0 + 2; xx++) { B.set(xx, y0, T.EMPTY); B.setHide(xx, y0, 0); }
    st.coins(x0 + 2, x1 - 2, y1 - 2); st.block(x0 + 4, y0 + 3, o.item || 'pick');
    return x + 13;
  },
  // swim: a niche up in the ceiling rock between roots, with a block: { item }
  rootNiche(st, o) {
    const x = st.x, B = st.B;
    B.fill(x, 2, x + 6, 4, T.GROUND); B.fill(x + 2, 2, x + 4, 4, T.EMPTY);
    st.block(x + 3, 2, o.item || 'oneup');
    for (const rx of [x + 1, x + 5]) { B.fill(rx, 5, rx, 7, T.HARD); B.decorAt('mxRoot', rx, 8, 0); }
    st.coins(x + 2, x + 4, 6);
    return x + 7;
  },
  // swim: a pocket of air up in the ceiling with a way into the dry grotto: { to }
  airPocket(st, o) {
    const x = st.x, B = st.B;
    B.fill(x, 2, x + 7, 3, T.GROUND); B.fill(x + 2, 1, x + 5, 3, T.EMPTY); B.fill(x + 2, 0, x + 5, 0, T.GROUND);
    B.decorAt('mxAirShine', x + 4, 4, 0);
    B.spawn('portal', x + 4, 3, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null });
    st.coins(x + 2, x + 5, 6);
    if (o.sign) B.spawn('sign', x + 7, st.floorY - 1, { text: o.sign });
    return x + 9;
  },
  // swim: a crack in the floor behind roots; bubbles rise from it; press DOWN on it to slip through: { to }
  floorCrack(st, o) {
    const x = st.x, B = st.B, F = st.floorY;
    B.spawn('mxBubbleCrack', x + 3, F - 1, {});
    B.spawn('portal', x + 3, F - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    return x + 6;
  },
  // swim: the way out of the cenote: a sunlit chamber, the gate on a ledge under the mouth: { exit }
  cenoteExit(st, o) {
    const x = st.x, B = st.B, F = st.floorY, w = 18;
    B.fill(x, 0, x + w, 1, T.GROUND); B.fill(x + 6, 0, x + 12, 1, T.EMPTY);
    B.spawn('mxSunbeam', x + 9, F - 1, { w: 6, h: F });
    B.fill(x + 7, 7, x + 13, 7, T.GROUND);
    B.spawn('gate', x + 10, 6, { exit: o.exit || 'main' });
    st.coins(x + 2, x + 5, 10); st.arc(x + 7, x + 13, 5, 2);
    B.fill(x + w + 1, 0, x + w + 2, B.H - 1, T.GROUND);
    st.x = x + w + 1; return x + w + 1;
  }
});
Object.assign(P, {
  // climb: a cracked painted tile in the crater wall is a way into the obsidian vault: { to }
  vaultDoor(st, o) {
    const B = st.B, y = st.y;
    B.fill(1, y - 4, 1, y - 1, T.HARD);
    B.spawn('tourDraft', 2, y - 1, { look: 'painted' });
    B.spawn('portal', 2, y - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    B.anchor(o.back || 'vaultBack', 4, y - 1);
  },
  // climb: a little ledge on the crater wall with a postcard: { kind, left }
  sideGold(st, o) {
    const B = st.B, W = st.W, y = st.y - 4, x0 = o.left ? 1 : W - 5;
    B.fill(x0, y, x0 + 3, y, T.GROUND); st.gold(x0 + 2, y - 2, o.kind || 'must');
  },
  // climb: the final double chimney: two vents side by side, a hop across in the middle, lava on your heels
  vdouble(st, o) {
    const B = st.B, W = st.W, h = o.h || 14, y0 = st.y, y1 = y0 - h, mid = st.mid;
    const L = [3, 5], R = [W - 6, W - 4];
    for (const [a, b] of [L, R]) { B.zone(a, y1 - 6, b - a + 1, h + 6, 0, -110 * TS, 7.2 * TS, 'steam', { pull: 3 }); B.spawn('vent', a + 1, y0 - 1, { w: b - a + 1, look: 'steam' }); }
    // the wall between them with a shelf half way: ride the left chimney up, hop over to the right one
    B.fill(mid - 1, y1 + 3, mid, y0 - 1, T.HARD);
    B.fill(7, y0 - 7, mid - 2, y0 - 7, T.GROUND); B.fill(mid + 1, y0 - 5, W - 8, y0 - 5, T.GROUND);
    for (let y = y1 + 1; y < y0 - 1; y += 2) { B.pickAt(4, y); B.pickAt(W - 5, y); }
    st.top(y1 - 3, [[3, 5], [W - 6, W - 4]]);
  },
  // climb: the crater rim at the top: a wide ledge, the gate, a postcard on a lip out over the lava
  craterRim(st, o) {
    const B = st.B, W = st.W, y = st.y - 4;
    B.fill(1, y, W - 2, y + 1, T.GROUND); B.fill(st.mid - 2, y, st.mid + 1, y + 1, T.EMPTY); for (let x = st.mid - 2; x <= st.mid + 1; x++) B.set(x, y, T.SEMI);
    B.spawn('gate', W - 5, y - 1, { exit: 'main' });
    B.fill(3, y - 5, 6, y - 5, T.SEMI); st.gold(4, y - 7, 'risky');
    B.decorAt('mxRimFlag', 8, y, 0);
    st.y = y - 1;
  }
});
Object.assign(P, {
  // shaft: the Paper Plane stand on the lip at the top, with its tip
  lipStand(st, o) {
    const B = st.B; Tour.pieces.gearStand(st, { item: 'plane', here: true }); const s = B.spawns[B.spawns.length - 1]; s.x = 7 * TS + TS / 2; s.y = 6 * TS;
    B.vkeys[B.vkeys.length - 1].tiles = [[7, 5], [7, 4]];
    if (o.sign) B.spawn('sign', 4, 5, { text: o.sign });
  },
  // shaft: a flock of swallows wheeling across the shaft (harmless; they nudge you sideways): { n }
  swallows(st, o) { const y = st.down(o.gap || 5); st.spawn('mxSwallow', st.rng.int(5, st.W - 6), y, { range: 4 }); st.down(4); },
  // shaft: a string of papel picado across the shaft; fall through the gaps, touching the flags slows you
  papelLine(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 6), gaps = o.gaps || [[st.rng.int(3, 7), 0], [st.rng.int(12, W - 6), 0]];
    const holes = gaps.map(([a]) => [a, a + 2]);
    B.decor.push({ kind: 'mxPapelLine', x: W * TS / 2, y: y * TS, w: W * TS, holes, seed: y });
    let x = 1;
    while (x < W - 1) { const hole = holes.find(([a, b]) => x >= a && x <= b); if (hole) { x = hole[1] + 1; continue; } let x2 = x; while (x2 + 1 < W - 1 && !holes.some(([a]) => x2 + 1 === a)) x2++; B.zone(x, y - 1, x2 - x + 1, 2, 0, -60 * TS, 1.5 * TS, 'drag', {}); x = x2 + 1; }
    for (const [a, b] of holes) st.coins(a, b, y + 1);
    st.down(3);
  },
  // shaft: a ledge on the side wall with an item block over it: { item, left }
  blockLedge(st, o) { const B = st.B, W = st.W, y = st.down(o.gap || 6), x0 = o.left ? 1 : W - 7; B.fill(x0, y, x0 + 5, y, T.GROUND); st.block(x0 + 3, y - 4, o.item || 'power'); if (o.gold) st.gold(o.left ? x0 + 1 : x0 + 5, y - 2, o.gold); st.down(3); },
  // shaft: a gap in the wall where a swallow keeps flying in: the nest room behind it: { to, left }
  nestHole(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 6), left = o.left !== false, x0 = left ? 1 : W - 6;
    B.fill(x0, y, x0 + 4, y, T.GROUND);
    const wx = left ? 0 : W - 1; B.set(wx, y - 1, T.EMPTY); B.set(wx, y - 2, T.EMPTY);
    B.decorAt('mxNestHole', wx, y, left ? 0 : 1);
    B.spawn('portal', left ? 1 : W - 2, y - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    B.anchor(o.back || 'nestBack', left ? 3 : W - 4, y - 1);
    st.down(3);
  },
  // shaft: two spike shelves close together, their gaps offset; a postcard in the narrow slot between them
  spikePair(st, o) {
    const B = st.B, W = st.W;
    const sh = (y, hx) => { for (let x = 1; x <= W - 2; x++) { if (x >= hx && x <= hx + 3) continue; B.set(x, y, T.GROUND); B.set(x, y - 1, T.SPIKES); } };
    const y1 = st.down(o.gap || 7), h1 = o.h1 != null ? o.h1 : st.mid; sh(y1, h1);
    if (o.updraft !== false) { B.zone(h1, y1 - 7, 4, 6, 0, -70 * TS, 2 * TS, 'updraft', { pull: 1 }); B.decorAt('mxUpFlower', h1 + 2, y1 - 1, 0); }
    const y2 = st.down(5), h2 = o.h2 != null ? o.h2 : h1 + 4; sh(y2, h2);
    // a safe patch of the lower shelf right under the first gap: land, then walk to the second gap
    for (let x = h1; x <= h1 + 3; x++) B.set(x, y2 - 1, T.EMPTY);
    st.gold(Math.round((h1 + h2) / 2) + 1, y2 - 3, 'risky');
    st.coins(h1, h1 + 3, y1 + 2);
    st.down(3);
  }
});
for (const k in P) Tour.pieces['mx.' + k] = P[k];

/* ---------------- country looks for library objects ---------------- */
const skins = {
  // 1-2: the canals instead of rails: the low channel's water, raised channels on stone arches with a lock at each end
  mxCanal(ctx, e, t) {
    const g = e.g, d = e.decks, A = g.area, x0 = Math.max(0, Math.floor(g.camX / TS) - 3), x1 = Math.min(A.W, Math.ceil((g.camX + Game.viewW) / TS) + 3);
    const Hp = A.H * TS, wl = d.lower * TS + 20, wu = d.upper * TS + 20;
    ctx.save();
    // the raised channels first: a stone aqueduct on piers, a lock at each end where the water steps up
    const stone = (x, y, w, h) => { ctx.fillStyle = '#c8b498'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(90,70,50,0.45)'; ctx.lineWidth = 1; for (let yy = y + 10; yy < y + h; yy += 10) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); } ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); };
    for (const f of e.forks) {
      if (f.x1 + 2 < x0 || f.x0 - 2 > x1) continue;
      const a0 = (f.x0 + 3) * TS, a1 = (f.x1 - 2) * TS;
      // piers down into the low water, little arches between them
      for (let x = f.x0 + 5; x <= f.x1 - 4; x += 5) stone(x * TS - 7, wu + 18, 14, wl - wu - 10);
      // papel picado strung between the piers
      for (let x = f.x0 + 5; x < f.x1 - 4; x += 5) {
        const ax = x * TS + 7, bx = (x + 5) * TS - 7, ay = wu + 24;
        ctx.strokeStyle = 'rgba(60,40,60,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, ay + 26, bx, ay); ctx.stroke();
        for (let k = 1; k < 8; k++) { const u = k / 8, fx = ax + (bx - ax) * u, fy = ay + Math.sin(u * Math.PI) * 13, sw = Math.sin(t * 2.4 + k + x) * 1.3; ctx.fillStyle = PAPEL[(k + x) % 6]; ctx.beginPath(); ctx.moveTo(fx - 5, fy); ctx.lineTo(fx + 5, fy); ctx.lineTo(fx + 5 + sw, fy + 11); ctx.lineTo(fx + sw, fy + 8); ctx.lineTo(fx - 5 + sw, fy + 11); ctx.closePath(); ctx.fill(); }
      }
      // the trough: water on top, a flower rim
      stone(a0, wu + 4, a1 - a0, 16);
      ctx.fillStyle = 'rgba(70,190,175,0.95)'; ctx.fillRect(a0 + 2, wu - 1, a1 - a0 - 4, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = f.x0 + 3; x < f.x1 - 2; x++) ctx.fillRect(x * TS + ((t * 20 + x * 11) % 24), wu + 1, 7, 1.5);
      for (let x = f.x0 + 3; x < f.x1 - 2; x += 2) { ctx.fillStyle = PAPEL[(x * 7) % 6]; ctx.beginPath(); ctx.arc(x * TS + 8, wu + 12, 2.6, 0, TAU); ctx.fill(); }
      // the locks: a stone chamber, the water half way, a timber gate with cross braces and a wheel on top
      for (const lx of [f.x0, f.x1 - 3]) {
        const X = lx * TS, Wd = 3 * TS;
        stone(X - 8, wu - 18, 12, wl - wu + 26); stone(X + Wd - 4, wu - 18, 12, wl - wu + 26);
        ctx.fillStyle = 'rgba(70,190,175,0.8)'; ctx.fillRect(X + 4, (wu + wl) / 2 + 6, Wd - 8, wl - (wu + wl) / 2 - 6);
        const gx = lx === f.x0 ? X + 4 : X + Wd - 12;
        ctx.fillStyle = '#7a5230'; ctx.fillRect(gx, wu - 6, 8, wl - wu + 2); ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, wu); ctx.lineTo(gx + 8, wl - 10); ctx.moveTo(gx + 8, wu); ctx.lineTo(gx, wl - 10); ctx.stroke();
        ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(gx + 4, wu - 14, 7, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gx - 3, wu - 14); ctx.lineTo(gx + 11, wu - 14); ctx.moveTo(gx + 4, wu - 21); ctx.lineTo(gx + 4, wu - 7); ctx.stroke();
      }
    }
    // the low channel: teal water from the waterline down, ripples drifting with the current
    const gr = ctx.createLinearGradient(0, wl, 0, Hp); gr.addColorStop(0, 'rgba(62,180,166,0.94)'); gr.addColorStop(1, 'rgba(18,84,92,0.98)');
    ctx.fillStyle = gr; ctx.fillRect(x0 * TS, wl, (x1 - x0) * TS, Hp - wl);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    for (let x = x0; x < x1; x++) { const k = (x * 37) % 4, ox = (t * 24 + x * 13) % 32; ctx.beginPath(); ctx.moveTo(x * TS + ox, wl + 5 + k * 4); ctx.lineTo(x * TS + ox + 9, wl + 5 + k * 4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x0 * TS, wl, (x1 - x0) * TS, 2);
    ctx.restore();
  },
  // the lock's lever post: a painted pole with a flower sign; its arrow shows the channel it picks
  mxLockLever(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, k = e.k;
    ctx.save();
    ctx.fillStyle = '#ff3d8b'; rr(ctx, x - 4, y - 50, 8, 50, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; for (let q = 0; q < 4; q++) ctx.fillRect(x - 4, y - 44 + q * 11, 8, 4);
    ctx.fillStyle = '#fff4d8'; rr(ctx, x - 16, y - 70, 32, 20, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    for (let q = 0; q < 5; q++) { ctx.fillStyle = PAPEL[q]; ctx.beginPath(); ctx.arc(x - 12 + q * 6, y - 73, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = e.up ? '#2a9a5a' : '#2a6ad8'; ctx.beginPath(); if (e.up) { ctx.moveTo(x - 7, y - 54); ctx.lineTo(x + 7, y - 54); ctx.lineTo(x, y - 66); } else { ctx.moveTo(x - 7, y - 66); ctx.lineTo(x + 7, y - 66); ctx.lineTo(x, y - 54); } ctx.fill();
    ctx.save(); ctx.translate(x, y - 26); ctx.rotate(-0.9 + k * 1.8); ctx.fillStyle = '#c8902a'; rr(ctx, -2, -20, 4, 20, 2); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, -21, 4.5, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    ctx.restore();
  },
  // a weeping willow over the water hiding a channel; pink petals drift from it (the tell)
  mxWillow(ctx, e, t) {
    const x0 = e.x - 10, y0 = e.y - 40, w = e.w + 20, h = e.h + 40, part = e.part || 0;
    ctx.save(); ctx.globalAlpha = 1 - part * 0.6;
    for (let k = 0; k < 12; k++) {
      const x = x0 + 3 + k * (w - 6) / 11, sway = Math.sin(t * 1.4 + k) * 3 * (1 + part * 3) * (k < 6 ? -1 : 1);
      ctx.strokeStyle = k % 2 ? '#3f8a3a' : '#5aa84a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway * 0.5, y0 + h * 0.5, x + sway, y0 + h - 6); ctx.stroke();
      for (let q = 0; q < 7; q++) { const yy = y0 + 8 + q * (h - 16) / 6, xx = x + sway * (q / 7); ctx.fillStyle = q % 2 ? '#86d06a' : '#4e9d43'; ctx.beginPath(); ctx.ellipse(xx + (q % 2 ? 3 : -3), yy, 3.6, 1.9, q % 2 ? 0.6 : -0.6, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    // petals drifting down out of it
    for (let k = 0; k < 6; k++) { const ph = (t * 0.35 + k / 6) % 1, px = x0 + (k * 23) % w + Math.sin(t * 2 + k) * 8, py = y0 + 10 + ph * (h + 30); ctx.globalAlpha = 1 - ph; ctx.fillStyle = k % 2 ? '#ff8ac8' : '#ffc0e0'; ctx.beginPath(); ctx.ellipse(px, py, 3, 1.6, t * 3 + k, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
};

/* ---------------- stamps ---------------- */
const stamps = {
  // 1-1's start: the market entrance under the MERCADO arch (with the old hidden 1UP over the entrance)
  entrada: {
    floor: 7,
    rows: [
      '..............',
      '..............',
      '..............',
      '.......h......',
      '..............',
      '..............',
      '...@.....a....',
      '##############'
    ],
    legend: { a: ['decor', 'mxMercadoArch'] }, hidden: ['oneup']
  },
  // 1-2's secret: the boathouse behind the willows (P2 on the rafters), a back door to the far landing
  embarcadero: {
    floor: 11,
    rows: [
      '##################################',
      '#................................#',
      '#..o.o.o.o.....*.......o.o.o.o...#',
      '#.............---................#',
      '#........................?.......#',
      '#....---.................----....#',
      '#................................#',
      '#..........r.........r...........#',
      '#.......------...------..........#',
      '#................................#',
      '#.@.......................D......#',
      '##################################',
      '##################################'
    ],
    legend: { r: ['decor', 'mxFlowers'] },
    items: ['oneup'],
    doors: [{ to: 'canal@landing', look: 'tourDoor' }],
    gold: { '*': 'hidden' }
  },
  // 1-3's air pocket: a dry grotto. A sunbeam through a crack shows light-only stones up to the ledge with the mushroom
  // and the postcard; bubble columns from the pool lift you; a little axolotl walks the shore
  gruta: {
    floor: 11,
    rows: [
      '##################################',
      '#######..........#################',
      '#................................#',
      '#..o.o.o...........*.............#',
      '#...............-----.....?......#',
      '#.........ll.............---.....#',
      '#.....ll.........................#',
      '#............................ll..#',
      '#..........u.....................#',
      '#.......a............e...........#',
      '#.@D.......................WWWW..#',
      '###########################WWWW###',
      '##################################',
      '##################################'
    ],
    legend: { l: ['tile', 'HARD', { hide: 3 }], u: ['piece', 'bubbler', { look: 'mxBubbles' }], a: ['spawn', 'mxSunbeam', { w: 9, h: 10 }], e: ['enemy', 'mxAxolotlWalk'] },
    items: ['power'],
    doors: [{ to: 'cenote@pocketBack' }],
    gold: { '*': 'hidden' }
  },
  // 1-4's obsidian vault behind the painted tile: glassy black rock, a 1UP, P2 up on the shelf
  boveda: {
    floor: 10,
    rows: [
      '##########################',
      '#........................#',
      '#...o.o.o.o.o............#',
      '#.................*......#',
      '#...............-----....#',
      '#.......?................#',
      '#............------......#',
      '#........................#',
      '#..k................k....#',
      '#.@D.....................#',
      '##########################',
      '##########################'
    ],
    legend: { k: ['decor', 'mxObsidian'] },
    items: ['oneup'],
    doors: [{ to: 'crater@vaultBack' }],
    gold: { '*': 'hidden' }
  },
  // 1-5's start: the hacienda's gate, a lantern each side
  porton: {
    floor: 9,
    rows: [
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '..@.....p...',
      '############'
    ],
    legend: { p: ['decor', 'mxHaciendaGate'] }
  },
  // 1-5's pantry behind the cupboard: jars, chili sacks, a 1UP on the top shelf, P2
  despensa: {
    floor: 10,
    rows: [
      '##############################',
      '#............................#',
      '#..o.o.o.o...................#',
      '#..............*.............#',
      '#............-----...........#',
      '#.....?......................#',
      '#...-----..........------....#',
      '#............................#',
      '#..k.......j.........k.......#',
      '#.@D.........................#',
      '##############################',
      '##############################'
    ],
    legend: { k: ['decor', 'mxChiliSack'], j: ['decor', 'mxPots'] },
    items: ['oneup'],
    doors: [{ to: 'patio@pantryBack' }],
    gold: { '*': 'hidden' }
  },
  // 1-6's swallow nest in the pit wall: mud nests, an LSD tab, P2
  nido: {
    floor: 9,
    rows: [
      '############################',
      '#..........................#',
      '#..n.....n.....n...........#',
      '#..........*...............#',
      '#........-----.....?.......#',
      '#..........................#',
      '#..o.o.o.o.o...............#',
      '#..........................#',
      '#.@D.......................#',
      '############################',
      '############################'
    ],
    legend: { n: ['decor', 'mxMudNest'] },
    items: ['lsd'],
    doors: [{ to: 'sotano@nestBack' }],
    gold: { '*': 'hidden' }
  },
  // La Tiendita, the Souvenir Stand Xolo keeps (1-1's hidden exit): papel picado, jars, the counter ($ is the shop)
  stand: {
    floor: 9,
    rows: [
      '############################',
      '#..........................#',
      '#..p.....p.....p.....p.....#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#.@...j....$...x.....j..G..#',
      '############################',
      '############################'
    ],
    legend: { p: ['decor', 'mxPapelHang'], j: ['decor', 'mxPots'], x: ['decor', 'mxKeeperXolo'] }
  },
  // 1-1's finale: the fiesta stage at the end of the market, the gate on the dais
  escenario: {
    floor: 7,
    rows: [
      '..........................',
      '..........................',
      '..........o.o.o.o.........',
      '..........................',
      '.................G........',
      '......------------------..',
      '...............z..........',
      '##########################'
    ],
    legend: { z: ['decor', 'mxStage'] }
  }
};

/* ---------------- the levels ---------------- */
const L1 = { n: 1, name: 'Mercado Mayhem', arch: 'parade', theme: 'mx_mercado',
  gimmick: 'Three lanes at once: rooftops, street and the cellar canal. Awnings bounce you up, trapdoors drop you down',
  hint: 'Hold jump on an awning to bounce up to the rooftops',
  postcard: 'Brady! The market has three floors and the melons use all of them. ♥ C',
  enemies: [['mxPepper', 3], ['mxElote', 2], ['mxChihuahua', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: {
    main: { to: '1-2' },
    secret: { to: 'house:mx-tienda', hint: 'Chili dust puffs out from under a crate in the market...' }
  },
  areas: [
    { id: 'mercado', gen: 'layered', W: 214, H: 30, lanes: { roof: 12, street: 21, cellar: 27 }, camera: 'lanes',
      script: [
        ['startStamp', { id: 'entrada', lane: 'street' }],
        // ① Xolo's taco, a mushroom, awnings that bounce up to the roofs
        ['xolo', { lane: 'street' }],
        ['itemBlock', { lane: 'street', item: 'power', y: 4 }],
        ['tip', { lane: 'street', text: 'AWNINGS ARE BOUNCY! HOLD JUMP ON ONE TO REACH THE ROOFTOPS' }],
        ['stalls', { lane: 'street', n: 2 }],
        ['rooftops', { lane: 'roof', n: 2 }],
        ['flat', { lane: 'cellar', n: 30 }],
        ['sync'],
        // ② melons down the street; gaps and papel-picado ropes on the roofs; the corn that pops
        ['melons', { lane: 'street' }],
        ['enemies', { lane: 'street', kind: 'mxElote', n: 1, len: 8 }],
        ['step', { lane: 'street', h: -3 }],
        ['banner', { lane: 'roof', len: 4, look: 'mxPapelPicado' }],
        ['gap', { lane: 'roof', n: 3 }],
        ['tip', { lane: 'roof', text: 'A PAPER PLANE! HOLD JUMP WHILE FALLING TO GLIDE. THROW IT AT THINGS FAR AWAY' }],
        ['gearStand', { lane: 'roof', item: 'plane' }],
        ['postcard', { lane: 'roof', kind: 'must', dy: -3 }],
        ['gap', { lane: 'street', n: 3 }],
        ['trapdoor', { lane: 'street', to: 'bodega@in', crate: true, back: 'bodegaBack', look: 'mxTrapdoor' }],
        ['flat', { lane: 'cellar', n: 6 }],
        ['spring', { lane: 'cellar', gold: false }],
        ['enemies', { lane: 'cellar', n: 2 }],
        ['sync'],
        'cp',
        // ③ the plaza joins all three lanes
        ['stamp', { id: 'plaza', lane: 'street' }],
        ['pinatas', { lane: 'street' }],
        ['itemBlock', { lane: 'street', item: 'socks', y: 4 }],   // the first jump power, with its tip sign
        ['tip', { lane: 'street', text: 'SPRING SOCKS! TAP JUMP AGAIN IN THE AIR FOR A SECOND JUMP' }],
        ['fountain', { lane: 'street' }],
        ['rooftops', { lane: 'roof', n: 1 }],
        ['flat', { lane: 'cellar', n: 10 }],
        ['sync'],
        ['stamp', { id: 'escenario', lane: 'street' }],
        ['sync'],
        ['cellarDress', { lane: 'cellar' }]
      ] },
    { id: 'bodega', gen: 'room', role: 'secret', theme: 'mx_bodega', dark: true, stamp: 'bodega' }
  ] };

const L2 = { n: 2, name: 'Xochimilco Forks', arch: 'rail', theme: 'mx_canal',
  gimmick: 'Ride a trajinera through branching canals: a lever picks the channel, the lock lifts the boat',
  hint: 'Touch a lever post and tap THROW to pick the high channel',
  postcard: 'The axolotls here keep shrinking and growing back. Like my patience with the Baron. ♥ C',
  enemies: [['mxHeron', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '1-3' } },
  areas: [
    { id: 'canal', gen: 'rail', len: 230, H: 18, decks: { upper: 7, lower: 13 }, vehicle: 'mxTrajinera', vehicleW: 9, track: 'mxCanal', below: 'liquid', scroll: 2.5,
      script: [
        ['embarcadero', { sign: 'AXOLOTLS SHRINK WHEN STOMPED. STOMP THEM AGAIN BEFORE THEY GROW BACK!' }],
        // ① posts and flower arches while the boat drifts; the taco boat; the first axolotl
        ['boatBlock', { item: 'power' }],
        'posts', 'vendor', ['arch', {}], ['axolotls', { n: 1 }], 'posts',
        // ② the first lock: the lever picks the garden channel (lifted) or the market channel
        ['fork', { len: 46, skin: 'mxLockLever', gold: false,
          upper: [['chinampa', {}], ['highPost', { gold: 'must' }], ['boatBlock', { item: 'power', dy: 6 }], ['bridge', { enemy: false }], 'herons'],
          lower: [['bridge', { enemy: false }], 'posts', ['chinampa', {}], 'posts'] }],
        'cp',
        // ③ the double fork with axolotls on both channels; a willow hides the third channel
        ['fork', { len: 32, skin: 'mxLockLever', gold: false, upper: [['axolotls', { n: 2 }], ['arch', { gold: true }]], lower: [['axolotls', { n: 2 }], ['willowDoor', { to: 'embarcadero@in' }]] }],
        ['fork', { len: 30, skin: 'mxLockLever', gold: false, upper: [['axolotls', { n: 1 }], 'herons'], lower: [['axolotls', { n: 2 }], ['chinampa', { gold: 'risky' }]] }],
        ['arch', {}], ['boatBlock', { item: 'lsd', dy: 8 }]
      ] },
    { id: 'embarcadero', gen: 'room', role: 'secret', theme: 'mx_canal', stamp: 'embarcadero' }
  ] };

const L3 = { n: 3, name: 'Cenote of Light', arch: 'dive', theme: 'mx_cenote',
  gimmick: 'Swim a flooded cenote. Stones that are only there in the sunbeams, an air pocket, currents',
  hint: 'Grab the Flipper Fins: swim faster, tap THROW to dash',
  postcard: 'Brady, the cenote stones only show up in the sunlight. Shy rocks! ♥ C',
  enemies: [['mxFish', 2], ['mxBlindFish', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: {
    main: { to: '1-4' },
    secret: { to: '1-6', hint: 'Bubbles rise from a crack behind the roots...' }
  },
  areas: [
    { id: 'cenote', gen: 'swim', H: 18, width: 360, ending: false,
      script: [
        // ① the entrance beam, the fins, hanging roots and the lightwell
        ['sunbeam', { dx: -5, n: 0 }],
        ['finsStand', { sign: 'FLIPPER FINS! SWIM FAST, TAP THROW TO DASH. A BLIND FISH ONLY HEARS YOU WHEN YOU HURRY' }],
        ['roots', { n: 3 }],
        'lightwell',
        ['rootNiche', { item: 'pick' }],
        ['airPocket', { to: 'gruta@in' }],
        ['anchor', { name: 'pocketBack' }],
        // ② light reveals: shimmering stones only inside the sunbeams
        ['lightStones', { item: 'oneup' }],
        ['enemies', { kind: 'mxAxolotlSwim', n: 1, len: 6 }],
        'slalom',
        ['roots', { n: 3, fish: false }],
        ['floorCrack', { to: 'grieta@in' }],
        ['lightStones', { item: 'pick', period: 7 }],
        'cp',
        // ③ currents push you through beams that come and go
        ['current', { w: 12, dir: 1 }],
        ['sunbeam', { period: 6 }],
        ['enemies', { kind: 'mxBlindFish', n: 1, len: 6 }],
        ['current', { w: 14, dir: -1 }],
        ['postcard', { kind: 'risky', dx: -8, dy: -8 }],
        ['sunbeam', { period: 6, phase: 3 }],
        'shaft',
        ['current', { w: 10, dir: 1 }],
        ['cenoteExit', {}]
      ] },
    { id: 'gruta', gen: 'room', role: 'sub', stamp: 'gruta' },
    { id: 'grieta', gen: 'swim', role: 'secret', H: 16, width: 60, ending: false, theme: 'mx_cenote',
      script: [['roots', { n: 2, fish: false }], ['sunbeam', {}], ['postcard', { kind: 'high', dx: -2, dy: -6 }], ['cenoteExit', { exit: 'secret' }]] }
  ] };

const L4 = { n: 4, name: 'Volcán Escape', arch: 'tower', theme: 'mx_volcan',
  gimmick: 'Climb out of the crater: steam vents, crumbling obsidian, rolling armadillos; the lava wakes up behind you',
  hint: 'Ride the steam up the chimneys. Keep climbing: the lava is rising!',
  postcard: 'The Baron tried to bottle the volcano. It did not agree. ♥ C',
  enemies: [['mxArmadillo', 1], ['mxBat', 1]],
  mapCell: [2, 1], mapFrom: 2,
  exits: { main: { to: '1-5' } },
  areas: [
    { id: 'crater', gen: 'climb', variant: 'interior', W: 26, H: 132, risingLava: { delay: 8, speed: 0.55 }, summit: false,
      script: [
        // ① vents carry you up the chimneys (the lava waits 8 s)
        ['blockBand', { item: 'power', left: true }],
        ['vledges', { n: 3 }],
        'vvent',
        ['vaultDoor', { to: 'boveda@in' }],
        // ② the lava rises; obsidian ledges crumble
        ['vledges', { n: 4, crumble: true }],
        ['blockBand', { item: 'star' }],
        ['vledges', { n: 3, flip: true, enemy: 'mxBat' }],
        ['blockBand', { item: 'beans', left: true }],   // a jump power (bonus): fart-float up the chimney
        // ③ armadillos, lava blobs, the double chimney
        'vroll',
        ['sideGold', { kind: 'must' }],
        'vblobs',
        ['vledges', { n: 3, crumble: true, enemy: 'mxArmadillo' }],
        ['vvent', { h: 10 }],
        'vdouble',
        ['craterRim', {}]
      ] },
    { id: 'boveda', gen: 'room', role: 'secret', theme: 'mx_volcan', dark: true, stamp: 'boveda' }
  ] };

const L5 = { n: 5, name: 'Fiesta de la Hacienda', arch: 'lair', theme: 'mx_hacienda', boss: 'mx_pinata',
  gimmick: 'Swinging piñatas, candy cannons, the balcony; then El Gran Piñatón on his pulley rope in the tall patio',
  hint: 'Break the piñata from BELOW: headbutt him when he swings low. Bounce off the awnings when he rises!',
  postcard: 'You did it! The Palace of Fine Arts popped back to full size. Next stop: Ecuador! ♥ C',
  enemies: [['mxSalsa', 2], ['mxBurro', 2], ['mxPepper', 1]],
  mapCell: [1, 2], mapFrom: [3, 5],
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'patio', gen: 'strip', W: 72, H: 18, theme: 'mx_hacienda_in',
      script: [
        ['startStamp', { id: 'porton' }],
        ['itemBlock', { item: 'power' }],
        // the lead-in teaches what the fight needs: swinging piñatas, things from below, bouncing high
        ['swingers', { n: 3 }],
        ['cannons', {}],
        ['postcard', { kind: 'risky', dx: -8, dy: -7 }],
        'balcony',
        ['secretDoor', { to: 'despensa@in', look: 'fake', back: 'pantryBack' }],
        ['enemies', { n: 1, kind: 'mxBurro' }],
        'sig',
        ['itemBlock', { item: 'power' }],
        ['door', { to: 'fiesta@in', perch: 0, look: 'tourDoor' }]
      ] },
    { id: 'despensa', gen: 'room', role: 'secret', stamp: 'despensa' },
    { id: 'fiesta', gen: 'arena', role: 'arena', layout: 'fiesta', arenaW: 24, H: 22 }
  ] };

// 1-6's pit: limestone walls lit from far above, swallows' nests, roots (procedural until its Blender scene exists)
if (!THEMES.mx_sotano && THEMES.mx_cenote) THEMES.mx_sotano = Object.assign({}, THEMES.mx_cenote, {
  name: 'Pit of Swallows', music: 'tour_mx_deep', particles: 'dust', underwater: false, rays: '#fff8d8',
  sky: ['#fff6d8', '#d8c098', '#6a5038'], horizonGlow: '#fff4c0', darkness: 0.05, fog: '#e8d8b0',
  layers: [{ kind: 'mxCenote', color: '#b8a070', base: 0, f: 0.08 }]
});
const L6 = { n: 6, name: 'Pit of Swallows', arch: 'fall', secret: true, theme: 'mx_sotano',
  gimmick: 'Freefall down a giant pit: swallow flocks, strings of papel picado, flowers whose updrafts brake you',
  hint: 'Hold jump to glide with the Paper Plane. Fall through the gaps in the flags',
  postcard: 'A secret pit full of swallows! They swoop like little paper planes. ♥ C',
  enemies: [['mxSwallow', 1], ['mxBat', 1]],
  mapCell: [1, 1], mapFrom: 2,
  exits: { main: { to: 'node:1-5' } },
  areas: [
    { id: 'sotano', gen: 'shaft', W: 22, H: 182,
      script: [
        ['lipStand', { sign: 'A PAPER PLANE! HOLD JUMP WHILE FALLING TO GLIDE DOWN THE PIT' }],
        // ① swallows and coin rings
        ['ledges', { n: 2 }],
        ['swallows', {}],
        ['ledges', { n: 1, flip: true }],
        ['ringFall', { n: 1, goldKind: 'high' }],
        ['blockLedge', { item: 'power', gold: 'must' }],
        ['swallows', {}],
        ['ledges', { n: 1 }],
        // ② papel picado lines: fall through the gaps
        ['papelLine', {}],
        ['nestHole', { to: 'nido@in' }],
        ['papelLine', {}],
        ['shelf', { cp: true }],
        ['swallows', {}],
        ['ledges', { n: 1, flip: true }],
        ['papelLine', {}],
        // ③ flower updrafts brake you over the spike shelves
        ['spikePair', {}],
        ['ledges', { n: 1, enemy: 'mxBat' }],
        ['spikePair', { h1: 5, h2: 9 }]
      ] },
    { id: 'nido', gen: 'room', role: 'secret', stamp: 'nido' }
  ] };

Tour.amend('mx', { stamps, skins, levels: [L1, L2, L3, L4, L5, L6] });
})();
