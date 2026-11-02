/* ============================================================
   Burning Man cast: enemies, items and props (all original)
   These replace the earlier sprite looks while keeping the same
   function signatures used by the entity code.
   ============================================================ */
const GLOW_COLS = ['#38f2ff', '#ff4fd8', '#7aff6a', '#ffd84a', '#ff7a3a'];
function faceEyes(ctx, x, y, sp, r, dir, mood) {
  for (const s of [-1, 1]) {
    const ex = x + s * sp;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, y, r * 0.8, r, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(ex + dir * r * 0.3, y + r * 0.15, r * 0.48, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + dir * r * 0.45, y - r * 0.2, r * 0.18, 0, TAU); ctx.fill();
    if (mood === 'angry') { ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - r, y - r * (s < 0 ? 1.4 : 0.9)); ctx.lineTo(ex + r, y - r * (s < 0 ? 0.9 : 1.4)); ctx.stroke(); }
  }
}
function stepLegs(ctx, x, y, t, col, sp, w, h) {
  const k = Math.sin(t * 10);
  ctx.fillStyle = col;
  rr(ctx, x - sp - w / 2, y - h - Math.max(0, k) * 2, w, h, w / 2); ctx.fill();
  rr(ctx, x + sp - w / 2, y - h - Math.max(0, -k) * 2, w, h, w / 2); ctx.fill();
}
function enemyLook(kind) {
  const th = (Game.scene && Game.scene.area) ? Game.scene.area.theme : '';
  const base = th.replace(/_(cave|fort)$/, '');
  if (kind === 'flapper') return ['camps', 'temple', 'deepplaya', 'esplanade', 'trip', 'sunrise'].indexOf(base) >= 0 ? 'witch' : 'mosquito';
  if (kind === 'boomer') return base === 'neon' ? 'slot' : 'dome';
  return kind;
}

Object.assign(Sprites, {
  /* ---------- Hippie (walker) ---------- */
  glump(ctx, x, y, t, col, dir, sq, flat) {
    softShadow(ctx, x, y, 22);
    if (flat) {
      ctx.save(); ctx.translate(x, y); ctx.scale(1.3, 0.35);
      Sprites.glump(ctx, 0, 0, t, col, dir, 0, false); ctx.restore();
      ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 9, y - 12 + Math.sin(a) * 3, 1.6, 0, TAU); ctx.fill(); }
      return;
    }
    const bob = Math.abs(Math.sin(t * 10)) * 1.2;
    // bell-bottoms
    stepLegs(ctx, x, y, t, '#3a5aa8', 3.5, 5.5, 8);
    // tie-dye tee
    const g = ctx.createRadialGradient(x, y - 13 - bob, 1, x, y - 13 - bob, 9);
    g.addColorStop(0, '#ffe24a'); g.addColorStop(0.35, '#ff5a8a'); g.addColorStop(0.7, '#5ac8ff'); g.addColorStop(1, '#8a4aff');
    ctx.fillStyle = g; rr(ctx, x - 7, y - 19 - bob, 14, 12, 4); ctx.fill();
    ctx.fillStyle = '#e8b98a'; ctx.beginPath(); ctx.arc(x + dir * 7.5, y - 13 - bob, 2.4, 0, TAU); ctx.fill();
    // peace medallion
    ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x + dir * 1.5, y - 14 - bob, 2.2, 0, TAU); ctx.moveTo(x + dir * 1.5, y - 16.2 - bob); ctx.lineTo(x + dir * 1.5, y - 11.8 - bob); ctx.stroke();
    // head + long hair + headband + round shades
    const hy = y - 24 - bob;
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(x - dir * 2, hy + 3, 8.5, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8b98a'; ctx.beginPath(); ctx.arc(x + dir * 1, hy, 6.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(x + dir * 1, hy + 4.5, 4.5, 3, 0, 0, Math.PI); ctx.fill(); // beard
    ctx.fillStyle = col; ctx.fillRect(x - 6, hy - 4.5, 13, 2);
    ctx.fillStyle = 'rgba(255,140,40,0.85)'; ctx.beginPath(); ctx.arc(x + dir * 3.6, hy - 0.5, 2, 0, TAU); ctx.arc(x - dir * 0.6, hy - 0.5, 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + dir * 1.6, hy - 0.5); ctx.lineTo(x + dir * 1.4, hy - 0.5); ctx.stroke();
    ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x + dir * 2, hy + 2.5, 1.8, 0.2, Math.PI - 0.2); ctx.stroke();
  },

  /* ---------- Tech Bro (+ electric unicycle shell) ---------- */
  rollo(ctx, x, y, t, col, dir, curled, spin) {
    softShadow(ctx, x, y, 22);
    if (curled) {
      // the electric unicycle he was riding, with the bro clinging on
      const cy = y - 12;
      ctx.save(); ctx.translate(x, cy);
      ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
      ctx.save(); ctx.rotate(spin);
      ctx.strokeStyle = '#38f2ff'; ctx.lineWidth = 1.6; ctx.shadowColor = '#38f2ff'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU * 0.7); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#c8ccd8'; rr(ctx, -13, -3, 26, 6, 3); ctx.fill();
      ctx.fillStyle = '#5a5e6a'; ctx.fillRect(-12, -1, 24, 1.5);
      // bro peeking over the top
      ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(0, -11, 5, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#6a5a4a'; ctx.beginPath(); ctx.ellipse(0, -14.5, 5.4, 2.2, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#16161e'; rr(ctx, -4.5, -13, 9, 3, 1.5); ctx.fill();
      ctx.restore();
      return;
    }
    stepLegs(ctx, x, y, t, '#2a2e3a', 3.2, 5, 9);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x - 5, y - 4, 4, 2); ctx.fillRect(x + 1, y - 4, 4, 2); // white sneakers
    // light-blue shirt + grey fleece vest
    ctx.fillStyle = '#9ac4f0'; rr(ctx, x - 7, y - 21, 14, 13, 4); ctx.fill();
    ctx.fillStyle = '#5a5e6a'; rr(ctx, x - 7, y - 21, 5, 13, 3); ctx.fill(); rr(ctx, x + 2, y - 21, 5, 13, 3); ctx.fill();
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(x + dir * 8, y - 13, 2.2, 0, TAU); ctx.fill();
    // phone in hand
    ctx.fillStyle = '#16161e'; rr(ctx, x + dir * 8 - 1.5, y - 17, 3, 5, 0.8); ctx.fill();
    // head: swoopy hair, VR headset pushed onto eyes, smug grin, earbud
    const hy = y - 26;
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(x, hy, 6.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a5a4a'; ctx.beginPath(); ctx.moveTo(x - 6.5, hy - 1); ctx.quadraticCurveTo(x - 4, hy - 9, x + dir * 6, hy - 6); ctx.quadraticCurveTo(x + dir * 2, hy - 4, x - 6.5, hy - 1); ctx.fill();
    ctx.fillStyle = '#16161e'; rr(ctx, x - 5.5 + dir, hy - 3, 11, 4.2, 2); ctx.fill();
    ctx.fillStyle = '#38f2ff'; ctx.fillRect(x - 3.5 + dir, hy - 2, 7, 1);
    ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x - 1 + dir * 2, hy + 3); ctx.quadraticCurveTo(x + dir * 3, hy + 4.2, x + dir * 4.5, hy + 2.2); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - dir * 5.8, hy + 1, 1, 0, TAU); ctx.fill();
  },

  /* ---------- DPW worker (can't be stomped: spiked hard hat) ---------- */
  spiker(ctx, x, y, t, col, dir) {
    softShadow(ctx, x, y, 24);
    stepLegs(ctx, x, y, t, '#6a3a1a', 4, 6, 7);
    ctx.fillStyle = '#c8701e'; rr(ctx, x - 9, y - 18, 18, 13, 4); ctx.fill();               // dusty coveralls
    ctx.fillStyle = 'rgba(230,210,170,0.35)'; ctx.fillRect(x - 9, y - 10, 18, 4);            // playa dust
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x - 9, y - 14, 18, 1.4);                         // reflective stripe
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(x + dir * 9, y - 12, 2.4, 0, TAU); ctx.fill();
    const hy = y - 22;
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(x, hy, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c84a3a'; ctx.beginPath(); ctx.moveTo(x - 6, hy + 1); ctx.lineTo(x + 6, hy + 1); ctx.lineTo(x + 5, hy + 6); ctx.lineTo(x - 5, hy + 6); ctx.fill(); // bandana
    ctx.fillStyle = '#1a1018'; ctx.fillRect(x - 4 + dir, hy - 2, 2.2, 1.4); ctx.fillRect(x + 1.5 + dir, hy - 2, 2.2, 1.4);   // squint
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 5 + dir, hy - 4.5); ctx.lineTo(x - 1 + dir, hy - 3); ctx.moveTo(x + 5 + dir, hy - 4.5); ctx.lineTo(x + 1 + dir, hy - 3); ctx.stroke();
    // hard hat bristling with rebar
    ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.ellipse(x, hy - 4, 8, 5, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 9, hy - 4.6, 18, 2);
    ctx.fillStyle = '#9a9aa4';
    for (let i = -2; i <= 2; i++) { const sx = x + i * 3.2; ctx.beginPath(); ctx.moveTo(sx - 1, hy - 8 + Math.abs(i)); ctx.lineTo(sx, hy - 15 + Math.abs(i) * 1.5 + Math.sin(t * 4 + i) * 0.4); ctx.lineTo(sx + 1, hy - 8 + Math.abs(i)); ctx.fill(); }
  },

  /* ---------- Pagan witch on a broom / mosquito drone ---------- */
  flapper(ctx, x, y, t, col, dir) {
    const look = enemyLook('flapper');
    const cy = y - 10;
    if (look === 'mosquito') {
      const fl = Math.sin(t * 60) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(220,235,255,0.45)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - dir * 2 + s * 1, cy - 6, 10, 3.5 + fl * 2, s * (0.5 + fl * 0.3) - dir * 0.2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 2 + i * 2, cy + 2); ctx.lineTo(x - 6 + i * 4, cy + 9); ctx.lineTo(x - 8 + i * 5, cy + 12); ctx.stroke(); }
      ctx.fillStyle = '#4a2a2a'; ctx.beginPath(); ctx.ellipse(x - dir * 6, cy + 1, 7, 3.5, dir * 0.25, 0, TAU); ctx.fill(); // abdomen
      ctx.fillStyle = 'rgba(255,60,60,0.5)'; ctx.beginPath(); ctx.ellipse(x - dir * 7, cy + 1.5, 4, 2, dir * 0.25, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.arc(x + dir * 1, cy - 1, 4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + dir * 5, cy - 2, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(x + dir * 6, cy - 3, 1.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + dir * 7.5, cy - 1); ctx.lineTo(x + dir * 15, cy + 3); ctx.stroke(); // proboscis
      return;
    }
    // witch: broom, flowing cloak, pointy hat with a moon
    const bob = Math.sin(t * 3) * 1.5;
    ctx.save(); ctx.translate(x, cy + bob); ctx.scale(dir, 1);
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(14, 2); ctx.stroke();
    ctx.fillStyle = '#d8a83a'; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-22, 1); ctx.lineTo(-22, 11); ctx.closePath(); ctx.fill();
    const cl = Math.sin(t * 8);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.quadraticCurveTo(-14, -2 + cl * 2, -16, 2 + cl * 3); ctx.lineTo(-4, 5); ctx.lineTo(4, 4); ctx.lineTo(4, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, -0.2); rr(ctx, -4, -8, 8, 12, 3); ctx.fill();
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(1, -11, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a3aa8'; ctx.beginPath(); ctx.ellipse(-2, -9, 5, 6, 0, 0, TAU); ctx.fill(); // hair
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(2, -11, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(3.5, -11.5, 0.9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.moveTo(-6, -13); ctx.lineTo(8, -13); ctx.lineTo(-1, -27); ctx.closePath(); ctx.fill(); ctx.fillRect(-7, -14, 15, 2);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0.5, -19, 2, 0.6, 5.4); ctx.fill();
    ctx.fillStyle = '#7affd8'; ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(10, -6); ctx.lineTo(12, -3); ctx.lineTo(10, 0); ctx.fill(); // crystal
    ctx.restore();
    // sage smudge trail
    ctx.fillStyle = 'rgba(220,220,230,0.25)'; for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x - dir * (18 + i * 6), cy + 6 + bob + Math.sin(t * 4 + i) * 2, 2 + i, 0, TAU); ctx.fill(); }
  },

  /* ---------- Sparkle Pony (hopper) ---------- */
  hopper(ctx, x, y, t, col, dir, air) {
    softShadow(ctx, x, y, 20);
    const st = air ? 1.15 : 1;
    ctx.fillStyle = '#f4e8ff';
    if (air) { ctx.fillRect(x - 6, y - 8, 3.5, 8); ctx.fillRect(x + 3, y - 8, 3.5, 8); }
    else { rr(ctx, x - 7, y - 6, 4, 6, 2); ctx.fill(); rr(ctx, x + 3, y - 6, 4, 6, 2); ctx.fill(); }
    const by = y - 12 * st;
    const g = ctx.createLinearGradient(x - 8, by - 8, x + 8, by + 6);
    g.addColorStop(0, '#fff0ff'); g.addColorStop(1, '#ffb0e8');
    ctx.fillStyle = g; rr(ctx, x - 8, by - 6, 16, 12, 6); ctx.fill();
    // rainbow mane + tail
    const rb = ['#ff5a6a', '#ffd84a', '#5ae0a0', '#5ab0ff', '#b07aff'];
    rb.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x - dir * 9, by - 2 + i * 1.6, 3, 1.2, -dir * 0.4, 0, TAU); ctx.fill(); });
    // unicorn hood head
    const hy = by - 10;
    ctx.fillStyle = '#fff0ff'; ctx.beginPath(); ctx.arc(x + dir * 2, hy, 6.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(x + dir * 3, hy + 1, 3.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x + dir * 1, hy - 5); ctx.lineTo(x + dir * 5, hy - 15); ctx.lineTo(x + dir * 4, hy - 4); ctx.fill();
    rb.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - dir * 2 + i * 0.6 * dir, hy - 5 + i, 1.5, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(x + dir * 4.4, hy, 0.9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a02a4a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x + dir * 3.6, hy + 2.2, 1.3, 0.2, Math.PI - 0.2); ctx.stroke();
    if (Math.sin(t * 9) > 0.6) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 31) * 10, y - 20 + Math.cos(t * 23) * 8, 1.1, 0, TAU); ctx.fill(); }
  },

  /* ---------- Orgy Dome turret (or slot machine in Reno) ---------- */
  boomer(ctx, x, y, t, col, dir, pulse) {
    softShadow(ctx, x, y, 30);
    if (enemyLook('boomer') === 'slot') {
      const g = ctx.createLinearGradient(x - 13, 0, x + 13, 0); g.addColorStop(0, '#8a1a2a'); g.addColorStop(0.5, '#e83a4a'); g.addColorStop(1, '#7a1020');
      ctx.fillStyle = g; rr(ctx, x - 13, y - 32, 26, 30, 4); ctx.fill();
      ctx.fillStyle = '#ffd84a'; rr(ctx, x - 11, y - 35, 22, 6, 3); ctx.fill();
      ctx.fillStyle = '#16131a'; rr(ctx, x - 10, y - 26, 20, 10, 2); ctx.fill();
      const sym = ['7', '♥', '$']; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff'; ctx.fillText(sym[(i + Math.floor(t * (pulse > 0.1 ? 20 : 2))) % 3], x - 6 + i * 6, y - 21); }
      ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 13, y - 22); ctx.lineTo(x + 17, y - 30 + pulse * 6); ctx.stroke();
      ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x + 17, y - 31 + pulse * 6, 2.4, 0, TAU); ctx.fill();
      return;
    }
    // a little geodesic dome with a creepy face peeking through the curtain
    geodome(ctx, x, y - 2, 15, '#f4e8f0', 'rgba(170,120,150,0.6)');
    ctx.fillStyle = '#ff7ab0'; ctx.beginPath(); ctx.arc(x + dir * 3, y - 2, 8, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#c03a7a'; ctx.fillRect(x + dir * 3 - 0.5, y - 10, 1, 8);
    const peek = 3 + pulse * 4;
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(x + dir * (3 + peek * 0.4), y - 6 - peek * 0.4, 4.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; rr(ctx, x + dir * (3 + peek * 0.4) - 3.5, y - 8 - peek * 0.4, 7, 2, 1); ctx.fill(); // aviators
    ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + dir * (3 + peek * 0.4) - 2.5, y - 4.6 - peek * 0.4); ctx.lineTo(x + dir * (3 + peek * 0.4) + 2.5, y - 4.6 - peek * 0.4); ctx.stroke(); // mustache
    ctx.fillStyle = '#ffd84a'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('FREE HUGS', x - dir * 2, y - 19);
  },
  bassball(ctx, x, y, t, dir, col, kind) {
    if (kind === 'coin') {
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 12), 1);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a8761a'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore(); return;
    }
    if (kind === 'cone') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 10 * dir);
      ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, 0, 8, 2); ctx.restore(); return;
    }
    if (kind === 'skeeter') { Sprites.flapperMini(ctx, x, y, t, dir); return; }
    if (kind === 'wave') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(col || '#38f2ff', 0.8 - i * 0.22); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x - dir * i * 5, y, 9 - i, -1, 1); ctx.stroke(); }
      ctx.restore(); return;
    }
    // default: a glowing pink "free hug" heart with grabby little hands
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 3; i++) { ctx.fillStyle = rgba(col || '#ff4fa8', 0.12); ctx.beginPath(); ctx.arc(x - dir * i * 6, y, 8 - i, 0, TAU); ctx.fill(); }
    ctx.restore();
    const p = 1 + Math.sin(t * 14) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.fillStyle = '#ff4fa8';
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, -1, -6, -10, 0, -4); ctx.bezierCurveTo(6, -10, 12, -1, 0, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-3.5, -3, 2, 1.2, -0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(-2, 0, 1, 0, TAU); ctx.arc(2, 0, 1, 0, TAU); ctx.fill();
    ctx.restore();
  },
  flapperMini(ctx, x, y, t, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8);
    ctx.fillStyle = 'rgba(220,235,255,0.5)'; ctx.beginPath(); ctx.ellipse(0, -5, 8, 3 + Math.sin(t * 60) * 1.5, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a1a1a'; ctx.beginPath(); ctx.ellipse(-dir * 4, 1, 6, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(dir * 3, -1, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(dir * 4, -2, 1.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dir * 5, 0); ctx.lineTo(dir * 12, 3); ctx.stroke();
    ctx.restore();
  },

  /* ---------- Creeper in a fur coat (slowly follows you) ---------- */
  wisp(ctx, x, y, t, col) {
    const bob = Math.sin(t * 4) * 1.5;
    softShadow(ctx, x, y + 13, 20);
    ctx.save(); ctx.translate(x, y + bob);
    // fluffy pink fur coat
    ctx.fillStyle = '#ff9ad8';
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, 3 + Math.sin(a) * 6, 4.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffc8ec'; rr(ctx, -6, -3, 12, 13, 5); ctx.fill();
    // arms out for a hug
    const reach = Math.sin(t * 3) * 2;
    ctx.fillStyle = '#ff9ad8'; ctx.beginPath(); ctx.ellipse(-11 - reach, 0, 5, 3, -0.4, 0, TAU); ctx.ellipse(11 + reach, 0, 5, 3, 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(-15 - reach, -1, 2.2, 0, TAU); ctx.arc(15 + reach, -1, 2.2, 0, TAU); ctx.fill();
    // head: aviators, mustache, sly grin, fedora
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(0, -9, 5.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8a03a'; rr(ctx, -5, -11, 4.4, 3, 1.2); ctx.fill(); rr(ctx, 0.6, -11, 4.4, 3, 1.2); ctx.fill();
    ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-3.5, -6.5); ctx.quadraticCurveTo(0, -7.5, 3.5, -6.5); ctx.stroke();
    ctx.strokeStyle = '#7a2a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0.6, -5.6, 2, 0.3, Math.PI - 0.6); ctx.stroke();
    ctx.fillStyle = '#2a1a2a'; ctx.fillRect(-7, -15, 14, 1.6); rr(ctx, -4.5, -19, 9, 4.5, 1.5); ctx.fill();
    ctx.restore();
  },

  /* ---------- Bass thumper (slams down) ---------- */
  slab(ctx, x, y, w, h, t, angry) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#2a2a34'); g.addColorStop(1, '#0a0a10');
    ctx.fillStyle = g; rr(ctx, x, y, w, h - 4, 5); ctx.fill();
    ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#16161e'; ctx.fillRect(x + 3, y + h - 6, w - 6, 4);
    const pulse = angry ? 1 + Math.sin(t * 40) * 0.08 : 1;
    for (const s of [-1, 1]) {
      const cx = x + w / 2 + s * w * 0.24, cy = y + h * 0.42;
      ctx.fillStyle = '#050508'; ctx.beginPath(); ctx.arc(cx, cy, 10 * pulse, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 10 * pulse, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 6 * pulse, 0, TAU); ctx.stroke();
      ctx.fillStyle = angry ? '#ff3a3a' : '#8a8a96'; ctx.beginPath(); ctx.arc(cx + (angry ? 0 : s * 1), cy + 1, 3.2, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + w * 0.12, y + h * 0.16); ctx.lineTo(x + w * 0.4, y + h * (angry ? 0.24 : 0.2)); ctx.moveTo(x + w * 0.88, y + h * 0.16); ctx.lineTo(x + w * 0.6, y + h * (angry ? 0.24 : 0.2)); ctx.stroke();
    ctx.fillStyle = '#8a8a96'; rr(ctx, x + w * 0.3, y + h * 0.7, w * 0.4, 5, 2); ctx.fill();
    if (angry) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(56,242,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w / 2, y + h, w * 0.7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.restore(); }
  },

  /* ---------- Hot-spring creatures ---------- */
  snapper(ctx, x, y, t, col, dir) {
    // a giant brine shrimp: translucent, feathery legs, big eyes
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(255,140,170,0.55)';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(4, -9, -12, -3); ctx.quadraticCurveTo(-18, 0, -12, 3); ctx.quadraticCurveTo(4, 9, 14, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,210,0.9)'; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const lx = 8 - i * 3, k = Math.sin(t * 14 + i * 0.8) * 3; ctx.beginPath(); ctx.moveTo(lx, 3); ctx.lineTo(lx - 2, 8 + k); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-20, -3 + Math.sin(t * 10) * 2); ctx.moveTo(-12, 0); ctx.lineTo(-20, 3 - Math.sin(t * 10) * 2); ctx.stroke();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(12, -4, 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1018'; ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(10, -1); ctx.stroke();
    ctx.restore();
  },

  /* ---------- items ---------- */
  pick(ctx, x, y, t, s, colIdx) {
    // a glow stick, slowly tumbling
    const col = GLOW_COLS[(colIdx || 0) % GLOW_COLS.length];
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.6 + (s || 0) * 0.4);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 13); g.addColorStop(0, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = col; rr(ctx, -2.6, -9, 5.2, 18, 2.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; rr(ctx, -1.2, -7.5, 1.6, 15, 0.8); ctx.fill();
    ctx.fillStyle = '#d8d8e0'; rr(ctx, -2.2, -11, 4.4, 2.6, 1); ctx.fill();
    ctx.restore();
  },
  pickFast(ctx, x, y, t, s, colIdx) {
    const sc = Game.S || 2, ci = (colIdx || 0) % GLOW_COLS.length;
    const img = SpriteCache.get('glow' + ci, 30, 30, sc, c => Sprites.pick(c, 0, 0, 0, 0, ci));
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + x * 0.1) * 0.35);
    ctx.drawImage(img, -15, -15, 30, 30); ctx.restore();
  },
  coffee(ctx, x, y, t) {
    // psychedelic mushroom
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hue = (t * 120) % 360;
    const gg = ctx.createRadialGradient(x, y - 14, 1, x, y - 14, 22); gg.addColorStop(0, `hsla(${hue},100%,70%,0.45)`); gg.addColorStop(1, `hsla(${hue + 90},100%,60%,0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y - 14, 22, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#f4eadc'; rr(ctx, x - 4.5, y - 13, 9, 13, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 1, y - 12, 3, 11);
    const g = ctx.createLinearGradient(x - 12, y - 26, x + 12, y - 12);
    g.addColorStop(0, `hsl(${hue},90%,60%)`); g.addColorStop(0.5, `hsl(${(hue + 120) % 360},90%,60%)`); g.addColorStop(1, `hsl(${(hue + 240) % 360},90%,60%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 13, 12.5, 11, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    // spiral spots
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.1;
    for (const [sx, sy] of [[-6, -17], [3, -20], [7, -15]]) { ctx.beginPath(); for (let a = 0; a < TAU * 1.5; a += 0.4) { const r = a * 0.5; ctx.lineTo(x + sx + Math.cos(a + t * 4) * r, y + sy + Math.sin(a + t * 4) * r); } ctx.stroke(); }
    // face
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(x - 1.8, y - 8, 0.9, 0, TAU); ctx.arc(x + 1.8, y - 8, 0.9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x, y - 6.5, 1.5, 0.3, Math.PI - 0.3); ctx.stroke();
  },
  bottle(ctx, x, y, t) {
    // a bottle of something strong (makes Brady throw green puke balls)
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, -12, 1, 0, -12, 18); gg.addColorStop(0, 'rgba(140,255,90,0.35)'); gg.addColorStop(1, 'rgba(140,255,90,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -12, 18, 0, TAU); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, '#3a6a2a'); g.addColorStop(0.5, '#7ac85a'); g.addColorStop(1, '#2a4a1a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, -14); ctx.quadraticCurveTo(-6, -18, -2.5, -20); ctx.lineTo(-2.5, -26); ctx.lineTo(2.5, -26); ctx.lineTo(2.5, -20); ctx.quadraticCurveTo(6, -18, 6, -14); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c84a2a'; ctx.fillRect(-3, -29, 6, 4);
    ctx.fillStyle = '#f4ead0'; rr(ctx, -5, -12, 10, 8, 1.5); ctx.fill();
    ctx.fillStyle = '#2a1a1a'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('XXX', 0, -8);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-4, -18, 1.4, 16);
    ctx.restore();
  },
  pukeball(ctx, x, y, t, r) {
    r = r || 7;
    const sq = 1 + Math.sin(t * 20) * 0.1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sq, 1 / sq);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#d8ff8a'); g.addColorStop(0.6, '#7ad83a'); g.addColorStop(1, '#3a8a1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8a84a'; ctx.beginPath(); ctx.arc(r * 0.3, r * 0.2, r * 0.2, 0, TAU); ctx.arc(-r * 0.4, r * 0.35, r * 0.14, 0, TAU); ctx.fill(); // chunks
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(140,220,70,0.6)'; ctx.beginPath(); ctx.arc(x - Math.cos(t * 9) * r, y - r * 0.8, 1.6, 0, TAU); ctx.fill();
  },
  eclipse(ctx, x, y, t) {
    // disco ball
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, -18); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 1.5; ctx.strokeStyle = `hsla(${(i * 45 + t * 200) % 360},100%,65%,0.6)`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.clip();
    for (let gy = -10; gy < 10; gy += 3) for (let gx = -10; gx < 10; gx += 3) {
      const k = Math.sin(gx * 0.9 + gy * 1.3 + t * 8);
      ctx.fillStyle = k > 0.6 ? '#ffffff' : k > 0 ? '#d8d8e8' : '#6a6a7a';
      ctx.fillRect(gx + ((gy / 3) % 2 ? 1.5 : 0) + Math.sin(t) * 1.5, gy, 2.4, 2.4);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.stroke();
    ctx.restore();
  },
  cassette(ctx, x, y, t) {
    // water bottle = extra life ("hydrate or die-drate")
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2.5) * 0.08);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, -14, 1, 0, -14, 20); gg.addColorStop(0, 'rgba(120,220,255,0.4)'); gg.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -14, 20, 0, TAU); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(-7, 0, 7, 0); g.addColorStop(0, 'rgba(120,200,255,0.75)'); g.addColorStop(0.5, 'rgba(220,245,255,0.9)'); g.addColorStop(1, 'rgba(90,170,230,0.8)');
    ctx.fillStyle = g; rr(ctx, -7, -24, 14, 24, 4); ctx.fill();
    ctx.fillStyle = '#3a8ae8'; rr(ctx, -4, -29, 8, 6, 1.5); ctx.fill();
    ctx.fillStyle = 'rgba(40,120,220,0.5)'; ctx.fillRect(-7, -12 + Math.sin(t * 4) * 0.8, 14, 12);
    ctx.fillStyle = '#ffffff'; rr(ctx, -6, -19, 12, 6, 1); ctx.fill();
    ctx.fillStyle = '#3a8ae8'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1UP', 0, -16);
    ctx.restore();
  },
  goldRecord(ctx, x, y, t, ghost) {
    // a polaroid of Chinka (three hidden in every level)
    ctx.save();
    if (ghost) ctx.globalAlpha *= 0.4;
    ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, y, 2, x, y, 30); gg.addColorStop(0, 'rgba(255,170,220,0.5)'); gg.addColorStop(1, 'rgba(255,120,200,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.18);
    ctx.fillStyle = '#fbfaf4'; rr(ctx, -12, -14, 24, 28, 1.5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    const sg = ctx.createLinearGradient(0, -11, 0, 7); sg.addColorStop(0, '#ff9a6a'); sg.addColorStop(1, '#ffd8a0');
    ctx.fillStyle = sg; ctx.fillRect(-9.5, -11.5, 19, 18);
    // Chinka's silhouette: long hair, sunglasses
    ctx.fillStyle = '#2a1a16'; ctx.beginPath(); ctx.ellipse(0, -3, 5.5, 7, 0, 0, TAU); ctx.fill(); ctx.fillRect(-5.5, -3, 11, 9);
    ctx.fillStyle = '#d9a580'; ctx.beginPath(); ctx.arc(0, -4, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.fillRect(-3, -5, 6, 1.6);
    ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(6, 10); ctx.bezierCurveTo(1, 7, 3, 4, 6, 6.2); ctx.bezierCurveTo(9, 4, 11, 7, 6, 10); ctx.fill();
    ctx.restore();
    const tw = (t * 1.3) % 1;
    if (tw < 0.3 && !ghost) {
      const a = Math.sin(tw / 0.3 * Math.PI);
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff'; ctx.translate(x + 10, y - 12);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(1.2, -1.2); ctx.lineTo(6, 0); ctx.lineTo(1.2, 1.2); ctx.lineTo(0, 6); ctx.lineTo(-1.2, 1.2); ctx.lineTo(-6, 0); ctx.lineTo(-1.2, -1.2); ctx.fill();
      ctx.restore();
    }
  },
  bufo(ctx, x, y, t, air) {
    // the desert toad that lets Brady fly
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, -8, 1, 0, -8, 22); gg.addColorStop(0, `hsla(${(t * 90) % 360},100%,70%,0.35)`); gg.addColorStop(1, 'rgba(160,120,255,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -8, 22, 0, TAU); ctx.fill(); ctx.restore();
    const st = air ? 1.15 : 1;
    ctx.fillStyle = '#6a7a4a'; ctx.beginPath(); ctx.ellipse(0, -7 * st, 11, 7.5 * st, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a9a5a'; for (const [bx, by] of [[-5, -10], [3, -12], [6, -7], [-2, -5]]) { ctx.beginPath(); ctx.arc(bx, by * st, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d8d0a0'; ctx.beginPath(); ctx.ellipse(1, -3, 7, 3, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#7a8a4a'; ctx.beginPath(); ctx.arc(-4, -13 * st, 3.2, 0, TAU); ctx.arc(4, -13 * st, 3.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-4, -13.5 * st, 2.2, 0, TAU); ctx.arc(4, -13.5 * st, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.fillRect(-5.4, -14 * st, 2.8, 1); ctx.fillRect(2.6, -14 * st, 2.8, 1);
    ctx.fillStyle = '#5a6a3a'; ctx.beginPath(); ctx.ellipse(-9, -1, 4, 2, 0.3, 0, TAU); ctx.ellipse(9, -1, 4, 2, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
  },
  joint(ctx, x, y, t) {
    // a joint that makes Brady float
    ctx.save(); ctx.translate(x, y - 10); ctx.rotate(-0.4 + Math.sin(t * 2) * 0.1);
    ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.moveTo(-10, -1.6); ctx.lineTo(9, -2.6); ctx.lineTo(9, 2.6); ctx.lineTo(-10, 1.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8a87a'; ctx.fillRect(-11, -1.6, 3, 3.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,40,0.9)'; ctx.beginPath(); ctx.arc(9.5, 0, 2.4, 0, TAU); ctx.fill(); ctx.restore();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.6 + i * 0.25) % 1;
      ctx.fillStyle = `rgba(230,230,240,${0.35 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(x + 9 + Math.sin(k * 6 + i) * 4, y - 14 - k * 22, 2 + k * 5, 0, TAU); ctx.fill();
    }
  },
  spring(ctx, x, y, comp) {
    // mini trampoline
    const h = 16 - comp * 6;
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 10, y - h); ctx.moveTo(x + 12, y); ctx.lineTo(x + 10, y - h); ctx.stroke();
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.ellipse(x, y - h, 15, 4 + comp * 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff4fa8'; ctx.beginPath(); ctx.ellipse(x, y - h, 15, 4 + comp * 2, 0, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = '#ff4fa8'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x - 4, y - h - 1, 6, 1.4, 0, 0, TAU); ctx.fill();
  },
  checkpoint(ctx, x, y, active, t) {
    // camp flag pole with a "B-O" banner and string lights
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(x - 1.5, y - 76, 3, 76);
    ctx.fillStyle = '#2a2a32'; rr(ctx, x - 8, y - 4, 16, 4, 2); ctx.fill();
    const wave = t * 4;
    const col = active ? '#ff4fd8' : '#7a7a86';
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x + 1.5, y - 74);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x + 1.5 + i * 3.4, y - 74 + Math.sin(wave + i * 0.6) * (active ? 2.5 : 1));
    for (let i = 8; i >= 0; i--) ctx.lineTo(x + 1.5 + i * 3.4, y - 56 + Math.sin(wave + i * 0.6) * (active ? 2.5 : 1));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = active ? '#fff' : '#b8b8c0'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('B-O', x + 15, y - 65 + Math.sin(wave + 2.4) * (active ? 2.5 : 1));
    // string lights down to the ground
    for (let i = 0; i < 6; i++) {
      const lx = x + 4 + i * 4, ly = y - 50 + i * 8 + Math.sin(i) * 2;
      ctx.fillStyle = active ? GLOW_COLS[(i + Math.floor(t * 4)) % 5] : '#4a4a52';
      ctx.beginPath(); ctx.arc(lx, ly, 1.6, 0, TAU); ctx.fill();
    }
    if (active) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x + 14, y - 64, 1, x + 14, y - 64, 30); g.addColorStop(0, 'rgba(255,80,216,0.45)'); g.addColorStop(1, 'rgba(255,80,216,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 14, y - 64, 30, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  gate(ctx, x, y, t, open, secret) {
    // "WELCOME HOME" arch with a bell that Brady rings to finish
    const w = 84, h = 150;
    const wood = secret ? '#3a2a5a' : '#8a5a34', woodHi = secret ? '#6a5aa0' : '#c8925a';
    for (const s of [-1, 1]) {
      const px = x + s * (w / 2) - 6;
      const g = ctx.createLinearGradient(px, 0, px + 12, 0); g.addColorStop(0, shade(wood, -0.3)); g.addColorStop(0.5, woodHi); g.addColorStop(1, shade(wood, -0.35));
      ctx.fillStyle = g; ctx.fillRect(px, y - h + 22, 12, h - 22);
    }
    ctx.fillStyle = wood; ctx.beginPath(); ctx.moveTo(x - w / 2 - 14, y - h + 26); ctx.lineTo(x, y - h + 4); ctx.lineTo(x + w / 2 + 14, y - h + 26); ctx.lineTo(x + w / 2 + 14, y - h + 34); ctx.lineTo(x, y - h + 12); ctx.lineTo(x - w / 2 - 14, y - h + 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4e8d0'; rr(ctx, x - 36, y - h + 32, 72, 16, 3); ctx.fill();
    ctx.strokeStyle = shade(wood, -0.3); ctx.lineWidth = 1.2; rr(ctx, x - 36, y - h + 32, 72, 16, 3); ctx.stroke();
    ctx.fillStyle = secret ? '#7a2aff' : '#c83a2a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(secret ? 'SECRET CAMP' : 'WELCOME HOME', x, y - h + 40.5);
    // string lights across the arch
    for (let i = 0; i <= 12; i++) {
      const k = i / 12, lx = x - w / 2 + k * w, ly = y - h + 52 + Math.sin(k * Math.PI) * 12;
      ctx.fillStyle = ((i + Math.floor(t * 6)) % 3 === 0) ? '#fff6c0' : GLOW_COLS[i % 5];
      ctx.beginPath(); ctx.arc(lx, ly, 2, 0, TAU); ctx.fill();
    }
    // the bell
    const swing = open ? Math.sin(t * 14) * 0.5 * Math.max(0, 1 - (t % 100) * 0) : Math.sin(t * 2) * 0.06;
    ctx.save(); ctx.translate(x, y - h + 60); ctx.rotate(swing);
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 0); ctx.stroke();
    const bg = ctx.createLinearGradient(-9, 0, 9, 0); bg.addColorStop(0, '#a8761a'); bg.addColorStop(0.5, '#ffe28a'); bg.addColorStop(1, '#8a5a12');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-6, 6, -10, 14); ctx.lineTo(10, 14); ctx.quadraticCurveTo(6, 6, 5, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a3a0a'; ctx.beginPath(); ctx.arc(0, 15, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createLinearGradient(0, y - h + 50, 0, y);
    cg.addColorStop(0, rgba(secret ? '#7a2aff' : '#ffd08a', open ? 0.28 : 0.12)); cg.addColorStop(1, rgba(secret ? '#00ff9a' : '#ff8a5a', open ? 0.35 : 0.14));
    ctx.fillStyle = cg; ctx.fillRect(x - w / 2 + 6, y - h + 50, w - 12, h - 50);
    ctx.restore();
  },
  portal(ctx, x, y, t, kind) {
    // a porta-potty doorway (blue; gold for warps; rainbow for the trip dimension)
    const body = kind === 'warp' ? '#e8b83a' : kind === 'glitch' ? `hsl(${(t * 90) % 360},80%,55%)` : kind === 'secret' ? '#7a4ac8' : '#3a7ac8';
    const top = y - 30, bot = y + 30;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, bot, 18, 3, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, shade(body, -0.35)); g.addColorStop(0.45, shade(body, 0.15)); g.addColorStop(1, shade(body, -0.4));
    ctx.fillStyle = g; rr(ctx, x - 16, top, 32, 60, 3); ctx.fill();
    ctx.fillStyle = shade(body, 0.3); rr(ctx, x - 18, top - 5, 36, 7, 3); ctx.fill();
    ctx.fillStyle = shade(body, -0.15); rr(ctx, x - 12, top + 6, 24, 50, 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, top + 14, 4, 0.6, 5.7); ctx.fill();
    ctx.fillStyle = shade(body, -0.15); ctx.beginPath(); ctx.arc(x + 1.6, top + 13.4, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8d8e0'; ctx.fillRect(x + 7, top + 30, 3, 6);
    const occ = Math.sin(t * 1.3) > 0.8;
    ctx.fillStyle = occ ? '#ff3a3a' : '#3aff6a'; ctx.fillRect(x + 6, top + 22, 5, 3);
    if (kind !== 'normal') {
      ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(x, y, 4, x, y, 40); gg.addColorStop(0, rgba(kind === 'warp' ? '#ffd84a' : kind === 'secret' ? '#c08aff' : '#7affd8', 0.35)); gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 40, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  sign(ctx, x, y, t) {
    // a little toad holding up a hand-painted sign
    Sprites.toad(ctx, x - 2, y, t, { sign: true });
  },
  toad(ctx, x, y, t, o) {
    o = o || {};
    const hop = o.hop ? Math.abs(Math.sin(t * 6)) * 4 : 0;
    softShadow(ctx, x, y, 16);
    ctx.save(); ctx.translate(x, y - hop);
    // tutu
    ctx.fillStyle = o.tutu || '#ff7ad8';
    ctx.beginPath(); ctx.ellipse(0, -6, 11, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-2, -7, 7, 1.6, 0, 0, TAU); ctx.fill();
    // body
    const g = ctx.createRadialGradient(-3, -16, 1, 0, -12, 12); g.addColorStop(0, '#9adc6a'); g.addColorStop(1, '#4a8a3a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -12, 9, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8f0c8'; ctx.beginPath(); ctx.ellipse(0, -9, 5.5, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.ellipse(-6, -1.5, 4, 2, 0.3, 0, TAU); ctx.ellipse(6, -1.5, 4, 2, -0.3, 0, TAU); ctx.fill();
    // eyes + goggles on forehead
    ctx.fillStyle = '#6aa84a'; ctx.beginPath(); ctx.arc(-4.5, -19, 4, 0, TAU); ctx.arc(4.5, -19, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4.5, -19.5, 2.8, 0, TAU); ctx.arc(4.5, -19.5, 2.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(-4, -19.3, 1.5, 0, TAU); ctx.arc(5, -19.3, 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(-9, -24.5, 18, 1.6);
    ctx.fillStyle = 'rgba(80,200,255,0.8)'; ctx.beginPath(); ctx.arc(-3.5, -25, 2.2, 0, TAU); ctx.arc(3.5, -25, 2.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a4a1a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -13.5, 3, 0.25, Math.PI - 0.25); ctx.stroke();
    if (o.sign) {
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(10, -30); ctx.stroke();
      ctx.fillStyle = '#e8d4b0'; rr(ctx, 2, -42, 18, 13, 2); ctx.fill(); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#c83a5a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 11, -35.5 + Math.sin(t * 4) * 0.6);
    }
    ctx.restore();
  },
  platform(ctx, x, y, w, th, kind, t) {
    if (kind === 'fall') {
      // a flimsy pallet
      ctx.fillStyle = '#a8784a'; for (let i = 0; i < w; i += 9) { rr(ctx, x + i, y, 7.5, 6, 1.5); ctx.fill(); }
      ctx.fillStyle = '#7a5430'; ctx.fillRect(x + 2, y + 6, w - 4, 4); ctx.fillRect(x + 2, y + 10, 4, 4); ctx.fillRect(x + w - 6, y + 10, 4, 4); ctx.fillRect(x + w / 2 - 2, y + 10, 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 1, y + 0.5, w - 2, 1);
      return;
    }
    if (th.semi.style === 'cloud') {
      ctx.fillStyle = th.semi.c2; for (let i = 0; i < w / 14; i++) { ctx.beginPath(); ctx.arc(x + 7 + i * 14, y + 8, 9, 0, TAU); ctx.fill(); }
      ctx.fillStyle = th.semi.c1; for (let i = 0; i < w / 14; i++) { ctx.beginPath(); ctx.arc(x + 7 + i * 14, y + 5, 8, 0, TAU); ctx.fill(); }
      return;
    }
    // an art car: the deck is the platform, a decorated body hangs below
    drawArtCarDeck(ctx, x, y, w, t, th);
  }
});

function drawArtCarDeck(ctx, x, y, w, t, th) {
  const night = th.night || th.dark || (th.darkness > 0);
  const design = Math.floor(Math.abs(x) / 97) % 4;
  const bodyCols = [['#ff7a3a', '#c83a1a'], ['#3ac8ff', '#1a6aa8'], ['#ff4fd8', '#8a1a7a'], ['#ffd84a', '#c88a1a']][design];
  const cx = x + w / 2;
  // body
  const g = ctx.createLinearGradient(0, y, 0, y + 40);
  g.addColorStop(0, bodyCols[0]); g.addColorStop(1, bodyCols[1]);
  ctx.fillStyle = g;
  ctx.beginPath();
  if (design === 0) { // fish
    ctx.ellipse(cx, y + 18, w / 2 + 6, 17, 0, 0, TAU); ctx.moveTo(x - 4, y + 18); ctx.lineTo(x - 18, y + 4); ctx.lineTo(x - 18, y + 32); ctx.closePath();
  } else if (design === 1) { // whale
    ctx.moveTo(x - 8, y + 6); ctx.quadraticCurveTo(x - 10, y + 36, cx, y + 36); ctx.quadraticCurveTo(x + w + 16, y + 34, x + w + 10, y + 6); ctx.closePath();
  } else if (design === 2) { // disco snail
    ctx.arc(cx + w * 0.15, y + 12, 18, Math.PI, TAU); rr(ctx, x - 6, y + 10, w + 12, 22, 8);
  } else { // cupcake
    ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + w + 4, y + 4); ctx.lineTo(x + w - 4, y + 34); ctx.lineTo(x + 4, y + 34); ctx.closePath();
  }
  ctx.fill();
  if (design === 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + w - 4, y + 14, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(x + w - 3, y + 14, 2, 0, TAU); ctx.fill(); }
  if (design === 2) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = 0; a < TAU * 2; a += 0.3) ctx.lineTo(cx + w * 0.15 + Math.cos(a) * a * 1.6, y + 4 + Math.sin(a) * a * 1.6); ctx.stroke(); }
  // wheels
  ctx.fillStyle = '#0a0a10';
  for (const wx of [x + 8, x + w - 8]) { ctx.beginPath(); ctx.arc(wx, y + 36, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.arc(wx, y + 36, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#0a0a10'; }
  // deck
  ctx.fillStyle = '#2a2a34'; rr(ctx, x, y, w, 6, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 2, y + 0.5, w - 4, 1);
  // railings + light strips
  ctx.save(); if (night) { ctx.shadowColor = bodyCols[0]; ctx.shadowBlur = 8; }
  for (let i = 0; i < w / 8; i++) { ctx.fillStyle = (i + Math.floor(t * 6)) % 2 ? '#fff6c0' : GLOW_COLS[(i + design) % 5]; ctx.beginPath(); ctx.arc(x + 4 + i * 8, y + 9, 1.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}

/* ---------- new decorations ---------- */
Object.assign(Decor, {
  sagebrush(ctx, x, y, t) {
    ctx.fillStyle = '#7a8a62';
    ctx.beginPath(); ctx.arc(x - 6, y - 6, 7, 0, TAU); ctx.arc(x + 5, y - 7, 8, 0, TAU); ctx.arc(x, y - 12, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a8b88a'; ctx.beginPath(); ctx.arc(x - 2, y - 13, 3, 0, TAU); ctx.arc(x + 6, y - 10, 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 5); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 5); ctx.stroke();
  },
  milemarker(ctx, x, y) {
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(x - 1, y - 26, 2, 26);
    ctx.fillStyle = '#2a7a3a'; rr(ctx, x - 7, y - 34, 14, 12, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('447', x, y - 28);
  },
  roadsign(ctx, x, y) {
    ctx.fillStyle = '#9a9aa4'; ctx.fillRect(x - 1.5, y - 40, 3, 40);
    ctx.fillStyle = '#f2c23a'; ctx.save(); ctx.translate(x, y - 46); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
    ctx.fillStyle = '#16131a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('DUST', x, y - 46);
  },
  cattleskull(ctx, x, y) {
    ctx.fillStyle = '#f0e8d8'; ctx.beginPath(); ctx.ellipse(x, y - 5, 5, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f0e8d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, y - 9); ctx.quadraticCurveTo(x - 12, y - 12, x - 13, y - 6); ctx.moveTo(x + 4, y - 9); ctx.quadraticCurveTo(x + 12, y - 12, x + 13, y - 6); ctx.stroke();
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.arc(x - 2, y - 6, 1.3, 0, TAU); ctx.arc(x + 2, y - 6, 1.3, 0, TAU); ctx.fill();
  },
  steamvent(ctx, x, y, t) {
    ctx.fillStyle = '#c8743a'; ctx.beginPath(); ctx.ellipse(x, y - 3, 10, 5, 0, Math.PI, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i * 0.25) % 1; ctx.fillStyle = `rgba(240,248,255,${0.4 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 5 + i) * 5, y - 8 - k * 50, 5 + k * 12, 0, TAU); ctx.fill(); }
  },
  reeds(ctx, x, y, t) {
    ctx.strokeStyle = '#5a8a4a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2, y); ctx.quadraticCurveTo(x + i * 3, y - 14, x + i * 4 + Math.sin(t + i) * 2, y - 24 - Math.abs(i) * 2); ctx.stroke(); }
    ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(x + 1, y - 26, 1.6, 5, 0.2, 0, TAU); ctx.fill();
  },
  mineralcone(ctx, x, y, t) {
    const g = ctx.createLinearGradient(0, y - 30, 0, y); g.addColorStop(0, '#3aa87a'); g.addColorStop(0.4, '#e8743a'); g.addColorStop(1, '#8a3a2a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x - 6, y - 14, x - 3, y - 30); ctx.lineTo(x + 3, y - 30); ctx.quadraticCurveTo(x + 6, y - 14, x + 14, y); ctx.fill();
    const k = (t * 1.5) % 1; ctx.fillStyle = `rgba(200,240,255,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(x, y - 32 - k * 20, 2 + k * 4, 0, TAU); ctx.fill();
  },
  rubberduck(ctx, x, y, t) {
    const b = Math.sin(t * 2) * 1;
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(x, y - 5 + b, 7, 4.5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + 4, y - 11 + b, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x + 7, y - 11 + b); ctx.lineTo(x + 11, y - 10 + b); ctx.lineTo(x + 7, y - 9 + b); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(x + 5, y - 12 + b, 0.8, 0, TAU); ctx.fill();
  },
  gatesign(ctx, x, y) {
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 14, y - 30, 3, 30); ctx.fillRect(x + 11, y - 30, 3, 30);
    ctx.fillStyle = '#f4e8d0'; rr(ctx, x - 18, y - 40, 36, 14, 2); ctx.fill();
    ctx.fillStyle = '#c83a2a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10 MPH', x, y - 33);
  },
  cone(ctx, x, y) {
    ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 2, y - 16); ctx.lineTo(x + 2, y - 16); ctx.lineTo(x + 6, y); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 9, 8, 2.4); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - 8, y - 2, 16, 2);
  },
  bikerack(ctx, x, y, t) {
    for (let i = 0; i < 2; i++) {
      const bx = x - 10 + i * 18, c = GLOW_COLS[(i + Math.floor(x)) % 5];
      ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(bx - 6, y - 6, 6, 0, TAU); ctx.arc(bx + 6, y - 6, 6, 0, TAU); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bx - 6, y - 6); ctx.lineTo(bx - 1, y - 15); ctx.lineTo(bx + 6, y - 6); ctx.moveTo(bx - 1, y - 15); ctx.lineTo(bx + 4, y - 15); ctx.lineTo(bx + 6, y - 6); ctx.stroke();
      ctx.fillStyle = c; ctx.fillRect(bx + 2, y - 18, 6, 1.6);
    }
  },
  greeterbell(ctx, x, y, t) {
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 12, y - 46); ctx.lineTo(x + 12, y - 46); ctx.lineTo(x + 12, y); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 44); ctx.rotate(Math.sin(t * 2) * 0.1);
    ctx.fillStyle = '#e8b83a'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-5, 7, -9, 14); ctx.lineTo(9, 14); ctx.quadraticCurveTo(5, 7, 4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  ledtree(ctx, x, y, t) {
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.stroke();
    ctx.lineWidth = 1.6;
    const br = [[-16, -56], [14, -60], [-8, -68], [6, -48], [18, -42], [-18, -40]];
    for (const [bx, by] of br) { ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.quadraticCurveTo(x + bx * 0.3, y + by * 0.6, x + bx, y + by); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    br.forEach(([bx, by], i) => {
      const c = GLOW_COLS[(i + Math.floor(t * 2)) % 5];
      const g = ctx.createRadialGradient(x + bx, y + by, 0, x + bx, y + by, 9); g.addColorStop(0, rgba(c, 0.9)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + bx, y + by, 9, 0, TAU); ctx.fill();
    });
    ctx.restore();
  },
  elbike(ctx, x, y, t) {
    const c = GLOW_COLS[Math.floor(x) % 5];
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.strokeStyle = c; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x - 9, y - 8, 8, 0, TAU); ctx.arc(x + 9, y - 8, 8, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 9, y - 8); ctx.lineTo(x - 2, y - 20); ctx.lineTo(x + 9, y - 8); ctx.moveTo(x - 2, y - 20); ctx.lineTo(x + 6, y - 20); ctx.lineTo(x + 9, y - 8); ctx.moveTo(x - 4, y - 23); ctx.lineTo(x, y - 23); ctx.moveTo(x + 6, y - 20); ctx.lineTo(x + 7, y - 25); ctx.stroke();
    ctx.restore();
  },
  campsignN(ctx, x, y, t, th, d) { this.campsign(ctx, x, y, t, th, d, true); },
  campsign(ctx, x, y, t, th, d, night) {
    const names = ['PANCAKE CAMP', 'BASS DOME', 'HUG DECO', 'TEA HOUSE', 'SLOTH SANCTUARY', 'CAMP 22', 'DUSTY GOGGLES', 'NAP STATION'];
    const name = names[(d && d.seed || 0) % names.length];
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 1.5, y - 36, 3, 36);
    ctx.font = `6px ${FONT_DISPLAY}`; const w = ctx.measureText(name).width + 10;
    ctx.fillStyle = night ? '#120a20' : '#f4e8d0'; rr(ctx, x - w / 2, y - 48, w, 13, 2); ctx.fill();
    ctx.save(); if (night) { ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 8; }
    ctx.fillStyle = night ? '#ff4fd8' : '#7a2a6a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, x, y - 41);
    ctx.restore();
  },
  firebarrel(ctx, x, y, t) {
    ctx.fillStyle = '#3a3a44'; rr(ctx, x - 8, y - 18, 16, 18, 2); ctx.fill();
    ctx.fillStyle = '#2a2a32'; ctx.fillRect(x - 8, y - 13, 16, 1.5); ctx.fillRect(x - 8, y - 6, 16, 1.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 24, 1, x, y - 24, 30); g.addColorStop(0, 'rgba(255,160,60,0.6)'); g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 24, 30, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { const fl = Math.sin(t * 13 + i * 2 + x) * 2; ctx.fillStyle = ['#ffb84a', '#ff7a2a', '#fff2a0'][i]; ctx.beginPath(); ctx.moveTo(x - 6 + i * 2, y - 18); ctx.quadraticCurveTo(x - 4 + i * 3, y - 28 + i * 3, x + fl, y - 34 + i * 4); ctx.quadraticCurveTo(x + 4 - i, y - 26, x + 6 - i * 2, y - 18); ctx.fill(); }
    ctx.restore();
  },
  disco(ctx, x, y, t) {
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x, y - 44); ctx.stroke();
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 12, y - 72, 24, 3); ctx.fillRect(x - 11, y - 72, 2, 72); ctx.fillRect(x + 9, y - 72, 2, 72);
    Sprites.eclipse(ctx, x, y - 34, t);
  },
  couch(ctx, x, y, t) {
    ctx.fillStyle = '#a83a5a'; rr(ctx, x - 18, y - 16, 36, 10, 4); ctx.fill(); rr(ctx, x - 20, y - 12, 40, 10, 4); ctx.fill();
    ctx.fillStyle = '#c84a6a'; rr(ctx, x - 16, y - 24, 32, 10, 4); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x - 8, y - 15, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x - 18, y - 2, 3, 2); ctx.fillRect(x + 15, y - 2, 3, 2);
  },
  tapestry(ctx, x, y, t, th, d) {
    const hue = ((d && d.seed) || 0) * 37 % 360;
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 18, y - 60, 2, 60); ctx.fillRect(x + 16, y - 60, 2, 60); ctx.fillRect(x - 18, y - 62, 36, 3);
    const sw = Math.sin(t * 1.5 + x) * 1.5;
    ctx.fillStyle = `hsl(${hue},70%,50%)`; ctx.beginPath(); ctx.moveTo(x - 16, y - 59); ctx.lineTo(x + 16, y - 59); ctx.lineTo(x + 16 + sw, y - 28); ctx.lineTo(x - 16 + sw, y - 28); ctx.fill();
    ctx.strokeStyle = `hsl(${(hue + 160) % 360},80%,70%)`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x + sw * 0.5, y - 44, 8, 0, TAU); ctx.moveTo(x + sw * 0.5, y - 52); ctx.lineTo(x + sw * 0.5, y - 36); ctx.moveTo(x - 8 + sw * 0.5, y - 44); ctx.lineTo(x + 8 + sw * 0.5, y - 44); ctx.stroke();
  },
  beanbag(ctx, x, y) {
    ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.ellipse(x, y - 7, 13, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 11, 5, 2.4, -0.3, 0, TAU); ctx.fill();
  },
  lostbike(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y - 4); ctx.rotate(0.15);
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(-9, 0, 7, 0, TAU); ctx.arc(9, 2, 7, 0, TAU); ctx.moveTo(-9, 0); ctx.lineTo(-2, -10); ctx.lineTo(9, 2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(230,220,200,0.35)'; ctx.beginPath(); ctx.ellipse(x, y - 1, 16, 3, 0, 0, TAU); ctx.fill();
  },
  smallart(ctx, x, y, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const c = GLOW_COLS[Math.floor(x / 7) % 5];
    ctx.strokeStyle = rgba(c, 0.9); ctx.lineWidth = 1.6; ctx.shadowColor = c; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x - 14, y - 10); ctx.lineTo(x + 14, y - 10); ctx.closePath(); ctx.moveTo(x, y - 40); ctx.lineTo(x, y); ctx.stroke();
    ctx.restore();
  },
  candles(ctx, x, y, t) {
    for (let i = 0; i < 3; i++) {
      const cx = x - 8 + i * 8, h = 6 + (i % 2) * 4;
      ctx.fillStyle = '#f4eadc'; ctx.fillRect(cx - 2, y - h, 4, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, y - h - 3, 0, cx, y - h - 3, 10); g.addColorStop(0, 'rgba(255,210,120,0.8)'); g.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, y - h - 3, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.ellipse(cx + Math.sin(t * 9 + i) * 0.5, y - h - 3, 1.4, 2.6, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  },
  prayerflags(ctx, x, y, t) {
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 30, y - 50); ctx.quadraticCurveTo(x, y - 40, x + 30, y - 52); ctx.stroke();
    const cols = ['#3a7ac8', '#f4f4f4', '#c83a3a', '#3ac85a', '#f2c23a'];
    for (let i = 0; i < 7; i++) { const k = i / 6, fx = x - 28 + k * 56, fy = y - 50 + Math.sin(k * Math.PI) * 9 - k * 2; ctx.fillStyle = cols[i % 5]; ctx.fillRect(fx - 3, fy, 6, 8 + Math.sin(t * 3 + i) * 1); }
  },
  altar(ctx, x, y, t) {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - 14, y - 12, 28, 12); ctx.fillStyle = '#a8744a'; ctx.fillRect(x - 16, y - 14, 32, 3);
    this.candles(ctx, x, y - 14, t);
  },
  photowall(ctx, x, y, t) {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - 20, y - 46, 40, 46);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#f4f0e4'; ctx.save(); ctx.translate(x - 12 + (i % 3) * 12, y - 36 + Math.floor(i / 3) * 16); ctx.rotate((i % 2 ? 0.1 : -0.12)); ctx.fillRect(-4, -5, 8, 10); ctx.fillStyle = 'rgba(80,60,80,0.5)'; ctx.fillRect(-3, -4, 6, 6); ctx.restore(); }
  },
  fireart(ctx, x, y, t) {
    ctx.fillStyle = '#4a4a54'; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 4, y - 30); ctx.lineTo(x + 4, y - 30); ctx.lineTo(x + 10, y); ctx.fill();
    const k = Math.sin(t * 3 + x) > 0.4;
    if (k) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, y - 30, 0, y - 80); g.addColorStop(0, 'rgba(255,200,90,0.9)'); g.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 6, y - 30); ctx.quadraticCurveTo(x - 10, y - 55, x + Math.sin(t * 20) * 3, y - 82); ctx.quadraticCurveTo(x + 10, y - 55, x + 6, y - 30); ctx.fill();
      ctx.restore();
    }
  },
  bigshroom(ctx, x, y, t) {
    const hue = (Math.floor(x) * 13 + t * 30) % 360;
    ctx.fillStyle = '#f4eadc'; ctx.fillRect(x - 4, y - 26, 8, 26);
    ctx.fillStyle = `hsl(${hue},80%,55%)`; ctx.beginPath(); ctx.ellipse(x, y - 26, 20, 15, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 12 + i * 8, y - 32 - (i % 2) * 4, 2.4, 0, TAU); ctx.fill(); }
  },
  eyeplant(ctx, x, y, t) {
    ctx.strokeStyle = '#3aaa6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 14, x, y - 26); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = `hsl(${(t * 60) % 360},80%,50%)`; ctx.beginPath(); ctx.arc(x + Math.sin(t) * 2, y - 30, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + Math.sin(t) * 2, y - 30, 1.3, 0, TAU); ctx.fill();
  },
  car(ctx, x, y, t) {
    // Brady's car, loaded with gear and a bike on the back
    ctx.fillStyle = '#2a3a5a'; rr(ctx, x - 30, y - 18, 60, 13, 4); ctx.fill(); rr(ctx, x - 18, y - 28, 34, 11, 4); ctx.fill();
    ctx.fillStyle = 'rgba(170,210,255,0.5)'; rr(ctx, x - 15, y - 26, 13, 8, 2); ctx.fill(); rr(ctx, x + 1, y - 26, 12, 8, 2); ctx.fill();
    ctx.fillStyle = '#e8d4b0'; rr(ctx, x - 20, y - 36, 38, 8, 3); ctx.fill();
    ctx.fillStyle = '#c84a3a'; ctx.fillRect(x - 6, y - 36, 4, 8);
    ctx.fillStyle = '#0a0a10'; ctx.beginPath(); ctx.arc(x - 18, y - 4, 5, 0, TAU); ctx.arc(x + 18, y - 4, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe6a0'; ctx.fillRect(x + 27, y - 15, 3, 3);
  },
  campgear(ctx, x, y) {
    ctx.fillStyle = '#3a8ae8'; rr(ctx, x - 14, y - 12, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 14, y - 12, 18, 3);
    ctx.fillStyle = '#c84a3a'; rr(ctx, x + 2, y - 18, 12, 18, 3); ctx.fill();
    ctx.fillStyle = '#2a8a4a'; ctx.beginPath(); ctx.moveTo(x - 10, y - 12); ctx.lineTo(x - 4, y - 24); ctx.lineTo(x + 2, y - 12); ctx.fill();
  },
  slotmachine(ctx, x, y, t) { Sprites.boomer(ctx, x, y, t, '#ff4fd8', 1, 0); },
  cart(ctx, x, y) {
    ctx.strokeStyle = '#a8acb8'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x + 12, y - 22); ctx.lineTo(x + 9, y - 8); ctx.lineTo(x - 11, y - 8); ctx.closePath(); ctx.stroke();
    for (let i = -10; i < 12; i += 4) { ctx.beginPath(); ctx.moveTo(x + i, y - 22); ctx.lineTo(x + i * 0.85, y - 8); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x - 18, y - 26); ctx.stroke();
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x - 9, y - 3, 3, 0, TAU); ctx.arc(x + 7, y - 3, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7ab0'; ctx.fillRect(x - 8, y - 20, 6, 8); ctx.fillStyle = '#3ac8ff'; ctx.fillRect(x, y - 19, 7, 7);
  }
});
