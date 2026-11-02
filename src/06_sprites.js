/* ============================================================
   Sprites — enemies, items, props, decorations (vector art)
   All functions draw in world-logical units; (x,y) = bottom-centre
   unless noted.
   ============================================================ */
function eyePair(ctx, x, y, sp, r, dir, angry, col) {
  for (let i = -1; i <= 1; i += 2) {
    const ex = x + i * sp;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, y, r * 0.8, r, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col || '#16101a'; ctx.beginPath(); ctx.ellipse(ex + dir * r * 0.3, y + r * 0.15, r * 0.45, r * 0.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + dir * r * 0.4, y - r * 0.2, r * 0.18, 0, TAU); ctx.fill();
    if (angry) {
      ctx.strokeStyle = '#16101a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - r * 0.9, y - r * (i < 0 ? 1.5 : 0.9)); ctx.lineTo(ex + r * 0.9, y - r * (i < 0 ? 0.9 : 1.5)); ctx.stroke();
    }
  }
}
function softShadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y - 0.5, w / 2, 2.5, 0, 0, TAU); ctx.fill();
}

const SpriteCache = {
  map: {},
  get(key, w, h, scale, fn) {
    const k = key + '@' + scale.toFixed(2);
    let c = this.map[k];
    if (!c) { c = makeCanvas(w * scale, h * scale); const x = c.getContext('2d'); x.scale(scale, scale); x.translate(w / 2, h / 2); fn(x); this.map[k] = c; }
    return c;
  }
};
const Sprites = {
  pickFast(ctx, x, y, t, s) {
    const sc = Game.S || 2;
    const face = s >= 0 ? 'a' : 'b';
    const img = SpriteCache.get('pick' + face, 30, 30, sc, c => Sprites.pick(c, 0, 0, 0, face === 'a' ? 1 : -1));
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.12, Math.abs(s)), 1);
    ctx.drawImage(img, -15, -15, 30, 30); ctx.restore();
  },
  glump(ctx, x, y, t, col, dir, sq, flat) {
    softShadow(ctx, x, y, 26);
    if (flat) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 4, 15, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#16101a'; ctx.lineWidth = 1.2;
      for (const ex of [x - 5, x + 5]) { ctx.beginPath(); ctx.moveTo(ex - 2, y - 6); ctx.lineTo(ex + 2, y - 3); ctx.moveTo(ex + 2, y - 6); ctx.lineTo(ex - 2, y - 3); ctx.stroke(); }
      return;
    }
    const s = 1 + sq * 0.12, h = 26 / s, w = 28 * s;
    // feet
    const step = Math.sin(t * 10);
    ctx.fillStyle = shade(col, -0.55);
    ctx.beginPath(); ctx.ellipse(x - 7, y - 2.5 - Math.max(0, step) * 2, 6, 3.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 7, y - 2.5 - Math.max(0, -step) * 2, 6, 3.5, 0, 0, TAU); ctx.fill();
    // body
    const g = ctx.createRadialGradient(x - 5, y - h * 0.75, 2, x, y - h * 0.45, w * 0.7);
    g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 3);
    ctx.bezierCurveTo(x - w / 2 - 1, y - h * 0.8, x - w * 0.25, y - h - 1, x, y - h);
    ctx.bezierCurveTo(x + w * 0.25, y - h - 1, x + w / 2 + 1, y - h * 0.8, x + w / 2, y - 3);
    ctx.quadraticCurveTo(x, y + 1, x - w / 2, y - 3);
    ctx.fill();
    ctx.strokeStyle = shade(col, -0.65); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - w * 0.22, y - h * 0.72, 3.5, 2, -0.5, 0, TAU); ctx.fill();
    eyePair(ctx, x + dir * 2, y - h * 0.55, 5, 3.6, dir, true);
    ctx.strokeStyle = '#16101a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 3 + dir * 2, y - h * 0.22); ctx.quadraticCurveTo(x + dir * 2, y - h * 0.3, x + 3 + dir * 2, y - h * 0.22); ctx.stroke();
  },

  rollo(ctx, x, y, t, col, dir, curled, spin) {
    softShadow(ctx, x, y, 26);
    if (curled) {
      ctx.save(); ctx.translate(x, y - 13); ctx.rotate(spin);
      const g = ctx.createRadialGradient(-4, -5, 2, 0, 0, 14);
      g.addColorStop(0, shade(col, 0.4)); g.addColorStop(1, shade(col, -0.4));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
      ctx.strokeStyle = shade(col, -0.6); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 4.5, 0, 2.5, Math.sqrt(169 - (i * 4.5) ** 2), 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
      ctx.restore();
      return;
    }
    const step = Math.sin(t * 9);
    ctx.fillStyle = shade(col, -0.55);
    for (const lx of [-8, -2, 5, 10]) ctx.fillRect(x + lx - 1.5, y - 6 + (lx % 2 ? step : -step), 3.5, 6);
    // head/snout
    ctx.fillStyle = shade(col, 0.25);
    ctx.beginPath(); ctx.ellipse(x + dir * 12, y - 10, 7, 5.5, dir * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.arc(x + dir * 18, y - 9, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + dir * 11, y - 12.5, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(x + dir * 11.8, y - 12.3, 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, 0.1); ctx.beginPath(); ctx.ellipse(x + dir * 8, y - 16, 2, 3.5, -dir * 0.4, 0, TAU); ctx.fill();
    // shell dome
    const g = ctx.createLinearGradient(0, y - 26, 0, y - 4);
    g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x - dir * 2, y - 8, 14, 16, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(col, -0.6); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - dir * 2 + i * 5, y - 8); ctx.quadraticCurveTo(x - dir * 2 + i * 5.6, y - 18, x - dir * 2 + i * 3, y - 23 + Math.abs(i) * 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - dir * 6, y - 19, 4, 2, -0.4, 0, TAU); ctx.fill();
  },

  spiker(ctx, x, y, t, col, dir) {
    softShadow(ctx, x, y, 24);
    const cy = y - 11;
    ctx.fillStyle = '#e8eaf2';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + i / 8 * Math.PI + Math.sin(t * 3 + i) * 0.04;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - 0.17) * 10, cy + Math.sin(a - 0.17) * 10);
      ctx.lineTo(x + Math.cos(a) * 19, cy + Math.sin(a) * 19);
      ctx.lineTo(x + Math.cos(a + 0.17) * 10, cy + Math.sin(a + 0.17) * 10);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(x - 4, cy - 4, 2, x, cy, 13);
    g.addColorStop(0, shade(col, 0.4)); g.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, cy, 13, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = shade(col, -0.65); ctx.lineWidth = 1.2; ctx.stroke();
    const step = Math.sin(t * 10);
    ctx.fillStyle = shade(col, -0.6);
    ctx.beginPath(); ctx.ellipse(x - 6, y - 2 - Math.max(0, step) * 1.5, 4, 2.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6, y - 2 - Math.max(0, -step) * 1.5, 4, 2.5, 0, 0, TAU); ctx.fill();
    eyePair(ctx, x + dir * 3, cy - 1, 4, 3, dir, true);
  },

  flapper(ctx, x, y, t, col, dir) {
    const cy = y - 10;
    const fl = Math.sin(t * 16);
    ctx.fillStyle = shade(col, -0.2);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x + s * 5, cy - 2);
      ctx.quadraticCurveTo(x + s * 16, cy - 12 * fl - 6, x + s * 22, cy - 8 * fl);
      ctx.quadraticCurveTo(x + s * 18, cy + 2, x + s * 14, cy - 1 * fl + 2);
      ctx.quadraticCurveTo(x + s * 11, cy + 5, x + s * 5, cy + 3);
      ctx.closePath(); ctx.fill();
    }
    const g = ctx.createRadialGradient(x - 2, cy - 3, 1, x, cy, 9);
    g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, 8, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 6, cy - 5); ctx.lineTo(x - 4, cy - 12); ctx.lineTo(x - 1, cy - 7); ctx.moveTo(x + 6, cy - 5); ctx.lineTo(x + 4, cy - 12); ctx.lineTo(x + 1, cy - 7); ctx.fill();
    ctx.save(); ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 6; ctx.fillStyle = '#ffd84a';
    ctx.beginPath(); ctx.arc(x - 3 + dir, cy - 1, 1.8, 0, TAU); ctx.arc(x + 3 + dir, cy - 1, 1.8, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 2, cy + 4); ctx.lineTo(x - 1, cy + 6.5); ctx.lineTo(x, cy + 4); ctx.moveTo(x + 2, cy + 4); ctx.lineTo(x + 1, cy + 6.5); ctx.lineTo(x, cy + 4); ctx.fill();
  },

  hopper(ctx, x, y, t, col, dir, air) {
    softShadow(ctx, x, y, 22);
    const stretch = air ? 1.25 : 1;
    ctx.fillStyle = shade(col, -0.3);
    if (air) { ctx.fillRect(x - 9, y - 7, 4, 7); ctx.fillRect(x + 5, y - 7, 4, 7); }
    else { ctx.beginPath(); ctx.ellipse(x - 9, y - 3, 6, 3, 0, 0, TAU); ctx.ellipse(x + 9, y - 3, 6, 3, 0, 0, TAU); ctx.fill(); }
    const by = y - 9 * stretch;
    const g = ctx.createRadialGradient(x - 3, by - 4, 1, x, by, 13);
    g.addColorStop(0, shade(col, 0.4)); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, by, 12, 8 * stretch, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = shade(col, -0.6); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = shade(col, 0.2);
    ctx.beginPath(); ctx.arc(x - 5, by - 7 * stretch, 4.5, 0, TAU); ctx.arc(x + 5, by - 7 * stretch, 4.5, 0, TAU); ctx.fill();
    eyePair(ctx, x, by - 7.5 * stretch, 5, 3, dir, false);
    ctx.strokeStyle = '#16101a'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(x - 6, by + 2); ctx.quadraticCurveTo(x, by + 5, x + 6, by + 2); ctx.stroke();
  },

  boomer(ctx, x, y, t, col, dir, pulse) {
    softShadow(ctx, x, y, 30);
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(x - 10, y - 6, 4, 6); ctx.fillRect(x + 6, y - 6, 4, 6);
    const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
    g.addColorStop(0, '#2a2a32'); g.addColorStop(0.5, '#4a4a56'); g.addColorStop(1, '#22222a');
    ctx.fillStyle = g; rr(ctx, x - 14, y - 32, 28, 27, 3); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; rr(ctx, x - 14, y - 32, 28, 27, 3); ctx.stroke();
    const p = 1 + pulse * 0.25;
    ctx.fillStyle = '#050508'; ctx.beginPath(); ctx.arc(x + dir * 2, y - 18, 9 * p, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6a6a76'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + dir * 2, y - 18, 9 * p, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + dir * 2, y - 18, 5 * p, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#8a8a96'; ctx.beginPath(); ctx.arc(x + dir * 2, y - 18, 2.2 * p, 0, TAU); ctx.fill();
    ctx.save(); ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 6; ctx.fillStyle = '#ff3a3a';
    ctx.fillRect(x - 9, y - 30, 5, 2); ctx.fillRect(x + 4, y - 30, 5, 2); ctx.restore();
    if (pulse > 0.1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(col, pulse);
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + dir * 2, y - 18, 12 + (1 - pulse) * 10, -0.8, 0.8); ctx.stroke(); ctx.restore();
    }
  },

  bassball(ctx, x, y, t, dir, col) {
    // x,y centre
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 4; i++) { ctx.fillStyle = rgba(col, 0.12); ctx.beginPath(); ctx.arc(x - dir * i * 6, y, 9 - i, 0, TAU); ctx.fill(); }
    ctx.restore();
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 10);
    g.addColorStop(0, '#5a5a6a'); g.addColorStop(1, '#0a0a10');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + dir * 3, y - 2, 2, 2.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x + dir * 3.6, y - 1.6, 1.2, 0, TAU); ctx.fill();
  },

  leaper(ctx, x, y, t, lava, dir) {
    // x,y centre
    const c1 = lava ? '#ff8a2a' : '#4ab0ff', c2 = lava ? '#c81e0a' : '#1a4a9a';
    if (lava) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(x, y, 2, x, y, 22); gg.addColorStop(0, 'rgba(255,140,40,0.5)'); gg.addColorStop(1, 'rgba(255,60,10,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.restore(); }
    const g = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 13);
    g.addColorStop(0, shade(c1, 0.4)); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y - 13 * dir); ctx.bezierCurveTo(x + 11, y - 6 * dir, x + 10, y + 9 * dir, x, y + 10 * dir); ctx.bezierCurveTo(x - 10, y + 9 * dir, x - 11, y - 6 * dir, x, y - 13 * dir); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, y + 9 * dir); ctx.lineTo(x, y + 16 * dir + Math.sin(t * 20) * 2); ctx.lineTo(x + 4, y + 9 * dir); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 4, y - 3 * dir, 3, 0, TAU); ctx.arc(x + 4, y - 3 * dir, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(x - 4, y - 2 * dir, 1.5, 0, TAU); ctx.arc(x + 4, y - 2 * dir, 1.5, 0, TAU); ctx.fill();
  },

  slab(ctx, x, y, w, h, t, angry, theme) {
    // x,y = top-left
    const c = THEMES[theme] ? THEMES[theme].hard.c1 : '#6a6a7a';
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, shade(c, 0.2)); g.addColorStop(1, shade(c, -0.4));
    ctx.fillStyle = g; rr(ctx, x, y, w, h - 6, 6); ctx.fill();
    ctx.strokeStyle = shade(c, -0.6); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#c8ccd8';
    for (let i = 0; i < w / 8; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, y + h - 7); ctx.lineTo(x + i * 8 + 4, y + h); ctx.lineTo(x + i * 8 + 8, y + h - 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 6, y + 6, w - 12, 2);
    // face
    const fx = x + w / 2, fy = y + h * 0.42;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(fx - 10, fy, 6, angry ? 4 : 6, 0, 0, TAU); ctx.ellipse(fx + 10, fy, 6, angry ? 4 : 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(fx - 9, fy + 1, 2.6, 0, TAU); ctx.arc(fx + 9, fy + 1, 2.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#16101a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx - 17, fy - 8); ctx.lineTo(fx - 4, fy - (angry ? 3 : 6)); ctx.moveTo(fx + 17, fy - 8); ctx.lineTo(fx + 4, fy - (angry ? 3 : 6)); ctx.stroke();
    ctx.fillStyle = '#16101a'; rr(ctx, fx - 9, fy + 9, 18, angry ? 6 : 3, 2); ctx.fill();
    if (angry) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) ctx.fillRect(fx - 8 + i * 4.5, fy + 9, 2.5, 2.5); }
  },

  wisp(ctx, x, y, t, col) {
    // x,y centre
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, y, 2, x, y, 26);
    gg.addColorStop(0, rgba(col, 0.45)); gg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
    ctx.restore();
    const g = ctx.createLinearGradient(0, y - 16, 0, y + 12);
    g.addColorStop(0, rgba('#ffffff', 0.9)); g.addColorStop(1, rgba(col, 0.6));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 10, y + 2);
    ctx.quadraticCurveTo(x - 11, y - 14, x + Math.sin(t * 6) * 3, y - 18);
    ctx.quadraticCurveTo(x + 11, y - 14, x + 10, y + 2);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(x + 10 - i * 5 - 2.5, y + 12 + Math.sin(t * 8 + i) * 3, x + 10 - (i + 1) * 5, y + 4);
    ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.ellipse(x - 4, y - 4, 2, 3, 0, 0, TAU); ctx.ellipse(x + 4, y - 4, 2, 3, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 3, 2.5, 2, 0, 0, TAU); ctx.fill();
  },

  jelly(ctx, x, y, t, col) {
    // x,y centre of dome
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, y, 2, x, y, 24); gg.addColorStop(0, rgba(col, 0.35)); gg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 24, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const tx = x - 8 + i * 4;
      ctx.beginPath(); ctx.moveTo(tx, y + 2);
      for (let k = 1; k <= 4; k++) ctx.lineTo(tx + Math.sin(t * 5 + i + k) * 2.5, y + 2 + k * 4.5);
      ctx.stroke();
    }
    const pulse = 1 + Math.sin(t * 5) * 0.08;
    const g = ctx.createRadialGradient(x - 3, y - 6, 1, x, y - 2, 13);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, rgba(col, 0.75)); g.addColorStop(1, rgba(shade(col, -0.4), 0.7));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y + 2, 12 * pulse, 13 / pulse, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(x - 4, y - 3, 1.6, 0, TAU); ctx.arc(x + 4, y - 3, 1.6, 0, TAU); ctx.fill();
  },

  snapper(ctx, x, y, t, col, dir) {
    // x,y centre
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    const wag = Math.sin(t * 12) * 0.3;
    ctx.fillStyle = shade(col, -0.25);
    ctx.save(); ctx.translate(-12, 0); ctx.rotate(wag); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, -7); ctx.lineTo(-7, 0); ctx.lineTo(-9, 7); ctx.closePath(); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(0, -9, 0, 9);
    g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 15, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = shade(col, -0.6); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(5, 2); ctx.lineTo(15, 5); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(7 + i * 2.6, 1.6); ctx.lineTo(8.3 + i * 2.6, 4); ctx.lineTo(9.6 + i * 2.6, 1.6); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(7, -3, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(8, -3, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, -0.2); ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(2, -14); ctx.lineTo(5, -8); ctx.fill();
    ctx.restore();
  },

  icicle(ctx, x, y, shake) {
    // x,y = top centre
    const sx = shake ? Math.sin(performance.now() * 0.08) * 1.2 : 0;
    const g = ctx.createLinearGradient(x - 7, 0, x + 7, 0);
    g.addColorStop(0, '#e8f8ff'); g.addColorStop(0.5, '#a8dcff'); g.addColorStop(1, '#6aaee0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 7 + sx, y); ctx.lineTo(x + 7 + sx, y); ctx.lineTo(x + sx, y + 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,110,170,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 3 + sx, y + 2, 1.5, 14);
  },

  ember(ctx, x, y, r, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.3, 'rgba(255,170,50,0.9)'); g.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  },

  // ----- items -----
  pick(ctx, x, y, t, s) {
    // x,y centre; s = horizontal spin scale
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.12, Math.abs(s)), 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, 0, 1, 0, 0, 14); gg.addColorStop(0, 'rgba(255,210,90,0.35)'); gg.addColorStop(1, 'rgba(255,210,90,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(-8, -9, 8, 9);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.45, s > 0 ? '#ffc23a' : '#e89a1a'); g.addColorStop(1, '#b8640a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-4, 6, -9, -1, -8.5, -5);
    ctx.bezierCurveTo(-8, -10, 8, -10, 8.5, -5);
    ctx.bezierCurveTo(9, -1, 4, 6, 0, 10);
    ctx.fill();
    ctx.strokeStyle = '#7a4006'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-3.5, -4.5, 2.2, 1.2, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  coffee(ctx, x, y, t) {
    // bottom centre
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, y - 12, 1, x, y - 12, 20); gg.addColorStop(0, 'rgba(255,180,120,0.35)'); gg.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y - 12, 20, 0, TAU); ctx.fill(); ctx.restore();
    // steam
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(x + i * 3, y - 25); for (let k = 1; k < 5; k++) ctx.lineTo(x + i * 3 + Math.sin(t * 5 + k + i) * 2, y - 25 - k * 2.4); ctx.stroke(); }
    ctx.fillStyle = '#e8e2d8';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 22); ctx.lineTo(x + 9, y - 22); ctx.lineTo(x + 7, y); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 16); ctx.lineTo(x + 8.5, y - 16); ctx.lineTo(x + 7.6, y - 6); ctx.lineTo(x - 7.6, y - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4fd8'; ctx.font = `bold 7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('B', x, y - 10.5);
    ctx.fillStyle = '#2a2430'; rr(ctx, x - 10.5, y - 25, 21, 4, 1.5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x - 9, y - 22, 18, 22);
  },
  vinyl(ctx, x, y, t, r, label) {
    // centre
    r = r || 12;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 8);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#3a3a44'); g.addColorStop(1, '#08080a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.7;
    for (let k = r * 0.5; k < r; k += 2) { ctx.beginPath(); ctx.arc(0, 0, k, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = label || '#ff4fd8'; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.4, 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  eclipse(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + t * 2, l = 13 + Math.sin(t * 9 + i * 1.7) * 4;
      ctx.strokeStyle = `hsla(${(t * 200 + i * 30) % 360},100%,65%,0.8)`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#05020c'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff4d8'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-3, -1, 1.5, 0, TAU); ctx.arc(3, -1, 1.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  cassette(ctx, x, y, t) {
    // bottom centre
    const by = y - 16;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, by, 1, x, by, 20); gg.addColorStop(0, 'rgba(120,255,160,0.35)'); gg.addColorStop(1, 'rgba(120,255,160,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, by, 20, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2a2a32'; rr(ctx, x - 13, by - 9, 26, 18, 2); ctx.fill();
    ctx.fillStyle = '#4aff8a'; ctx.fillRect(x - 11, by - 7, 22, 7);
    ctx.fillStyle = '#16131a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1UP', x, by - 3.3);
    ctx.fillStyle = '#0a0a0e'; rr(ctx, x - 8, by + 1, 16, 6, 2); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(x + s * 4.5, by + 4); ctx.rotate(t * 6);
      ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0a0a0e'; ctx.fillRect(-0.5, -2.2, 1, 4.4); ctx.restore();
    }
  },
  goldRecord(ctx, x, y, t, ghost) {
    // centre
    ctx.save();
    if (ghost) ctx.globalAlpha *= 0.35;
    ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x, y, 2, x, y, 30); gg.addColorStop(0, 'rgba(255,220,100,0.55)'); gg.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const s = Math.cos(t * 2.5);
    ctx.translate(x, y); ctx.scale(Math.max(0.15, Math.abs(s)), 1);
    const g = ctx.createRadialGradient(-5, -5, 1, 0, 0, 15);
    g.addColorStop(0, '#fff8d0'); g.addColorStop(0.5, '#ffcc3a'); g.addColorStop(1, '#a8660a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,0,0.5)'; ctx.lineWidth = 0.7;
    for (let k = 7; k < 15; k += 2) { ctx.beginPath(); ctx.arc(0, 0, k, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffcc3a'; ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a4006'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke();
    ctx.restore();
    // twinkle
    const tw = (t * 1.3) % 1;
    if (tw < 0.3 && !ghost) {
      const a = Math.sin(tw / 0.3 * Math.PI);
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff';
      ctx.translate(x + 8, y - 9);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(1.2, -1.2); ctx.lineTo(6, 0); ctx.lineTo(1.2, 1.2); ctx.lineTo(0, 6); ctx.lineTo(-1.2, 1.2); ctx.lineTo(-6, 0); ctx.lineTo(-1.2, -1.2); ctx.fill();
      ctx.restore();
    }
  },
  spring(ctx, x, y, comp) {
    // bottom centre, comp 0..1
    const h = 26 - comp * 12;
    ctx.fillStyle = '#3a3a44'; rr(ctx, x - 14, y - 5, 28, 5, 2); ctx.fill();
    ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    const coils = 4;
    for (let i = 0; i <= coils * 2; i++) { const yy = y - 5 - (h - 10) * i / (coils * 2); ctx.lineTo(x + (i % 2 ? 9 : -9), yy); }
    ctx.stroke();
    const g = ctx.createLinearGradient(0, y - h - 2, 0, y - h + 6);
    g.addColorStop(0, '#ff7ab0'); g.addColorStop(1, '#c03a7a');
    ctx.fillStyle = g; rr(ctx, x - 15, y - h - 1, 30, 7, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 12, y - h, 24, 1.3);
  },
  checkpoint(ctx, x, y, active, t) {
    // bottom centre: a mic stand with a banner
    ctx.fillStyle = '#2a2a32'; rr(ctx, x - 10, y - 4, 20, 4, 2); ctx.fill();
    ctx.fillStyle = '#8a8a96'; ctx.fillRect(x - 1.5, y - 60, 3, 56);
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.ellipse(x, y - 64, 4, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.ellipse(x, y - 66, 3, 3.5, 0, 0, TAU); ctx.fill();
    const wave = t * 5;
    const col = active ? '#ff4fd8' : '#6a6a76';
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x + 2, y - 56);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x + 2 + i * 3, y - 56 + Math.sin(wave + i * 0.6) * (active ? 2 : 0.8));
    for (let i = 8; i >= 0; i--) ctx.lineTo(x + 2 + i * 3, y - 42 + Math.sin(wave + i * 0.6) * (active ? 2 : 0.8));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = active ? '#ffffff' : '#9a9aa4'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('B-O', x + 14, y - 49 + Math.sin(wave + 4 * 0.6) * (active ? 2 : 0.8));
    if (active) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 64, 1, x, y - 64, 22); g.addColorStop(0, 'rgba(255,80,216,0.5)'); g.addColorStop(1, 'rgba(255,80,216,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 64, 22, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  gate(ctx, x, y, t, open, secret) {
    // bottom centre: neon "Encore Gate" arch, 3 tiles wide, 5 tall
    const w = 76, h = 150;
    const c1 = secret ? '#00ff9a' : '#ff4fd8', c2 = secret ? '#ff00d4' : '#38f2ff';
    // pillars
    for (const s of [-1, 1]) {
      const px = x + s * (w / 2) - 7;
      const g = ctx.createLinearGradient(px, 0, px + 14, 0); g.addColorStop(0, '#1a1a22'); g.addColorStop(0.5, '#3a3a48'); g.addColorStop(1, '#14141a');
      ctx.fillStyle = g; ctx.fillRect(px, y - h + 30, 14, h - 30);
      ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px - 3, y - 8, 20, 8);
      // speaker on pillar
      ctx.fillStyle = '#050508'; ctx.beginPath(); ctx.arc(px + 7, y - 40, 5.5, 0, TAU); ctx.arc(px + 7, y - 70, 5.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px + 7, y - 40, 5.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(px + 7, y - 70, 5.5, 0, TAU); ctx.stroke();
    }
    // arch
    ctx.save();
    ctx.shadowColor = c1; ctx.shadowBlur = 14;
    ctx.strokeStyle = c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h + 34); ctx.arc(x, y - h + 34, w / 2, Math.PI, 0); ctx.stroke();
    ctx.shadowColor = c2; ctx.strokeStyle = c2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - h + 34, w / 2 - 7, Math.PI, 0); ctx.stroke();
    ctx.restore();
    // bulbs
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + i / 10 * Math.PI;
      const on = ((i + Math.floor(t * 8)) % 3) === 0;
      ctx.fillStyle = on ? '#fff6c0' : '#8a7a4a';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * (w / 2 + 5), y - h + 34 + Math.sin(a) * (w / 2 + 5), 2.2, 0, TAU); ctx.fill();
    }
    // sign
    ctx.fillStyle = '#0a0a10'; rr(ctx, x - 30, y - h + 18, 60, 16, 4); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 1.2; rr(ctx, x - 30, y - h + 18, 60, 16, 4); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(secret ? '???' : 'ENCORE', x, y - h + 26.5);
    // shimmering curtain of light
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createLinearGradient(0, y - h + 34, 0, y);
    cg.addColorStop(0, rgba(c1, open ? 0.25 : 0.12)); cg.addColorStop(1, rgba(c2, open ? 0.4 : 0.18));
    ctx.fillStyle = cg; ctx.fillRect(x - w / 2 + 7, y - h + 34, w - 14, h - 34);
    for (let i = 0; i < 6; i++) { const lx = x - w / 2 + 12 + ((i * 11 + t * 30) % (w - 24)); ctx.fillStyle = rgba('#ffffff', 0.12); ctx.fillRect(lx, y - h + 40, 1.5, h - 46); }
    ctx.restore();
  },
  portal(ctx, x, y, t, kind) {
    // centre
    const cols = kind === 'glitch' ? ['#00ff9a', '#ff00d4'] : kind === 'warp' ? ['#ffd84a', '#ff6a2a'] : kind === 'secret' ? ['#38f2ff', '#c08aff'] : ['#c04bff', '#38f2ff'];
    ctx.save(); ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    g.addColorStop(0, rgba(cols[1], 0.7)); g.addColorStop(0.6, rgba(cols[0], 0.3)); g.addColorStop(1, rgba(cols[0], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 22, 30, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = rgba(i % 2 ? cols[0] : cols[1], 0.85); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let a = 0; a < TAU * 1.6; a += 0.2) {
        const r = 2 + a * 4.2, aa = a + t * (3 + i) + i * 2;
        const px = Math.cos(aa) * r * 0.75, py = Math.sin(aa) * r;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = rgba(cols[0], 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 16, 26, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  },
  sign(ctx, x, y, t) {
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 2, y - 22, 4, 22);
    const g = ctx.createLinearGradient(0, y - 34, 0, y - 18); g.addColorStop(0, '#c89a5a'); g.addColorStop(1, '#8a5a30');
    ctx.fillStyle = g; rr(ctx, x - 13, y - 36, 26, 18, 3); ctx.fill();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.2; rr(ctx, x - 13, y - 36, 26, 18, 3); ctx.stroke();
    ctx.fillStyle = '#3a2410'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', x, y - 26.5 + Math.sin(t * 4) * 0.8);
  },
  platform(ctx, x, y, w, th, kind, t) {
    // x,y top-left
    const st = th.semi.style;
    if (kind === 'fall') {
      const g = ctx.createLinearGradient(0, y, 0, y + 14); g.addColorStop(0, '#c8a070'); g.addColorStop(1, '#7a5230');
      ctx.fillStyle = g; rr(ctx, x, y, w, 14, 4); ctx.fill();
      ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, y + 1.5, w - 6, 1.3);
      ctx.fillStyle = '#ff6a6a'; for (let i = 0; i < w / 16; i++) { ctx.beginPath(); ctx.arc(x + 8 + i * 16, y + 8, 1.6, 0, TAU); ctx.fill(); }
      return;
    }
    if (st === 'cloud') {
      ctx.fillStyle = th.semi.c2; for (let i = 0; i < w / 14; i++) { ctx.beginPath(); ctx.arc(x + 7 + i * 14, y + 8, 9, 0, TAU); ctx.fill(); }
      ctx.fillStyle = th.semi.c1; for (let i = 0; i < w / 14; i++) { ctx.beginPath(); ctx.arc(x + 7 + i * 14, y + 5, 8, 0, TAU); ctx.fill(); }
      return;
    }
    const g = ctx.createLinearGradient(0, y, 0, y + 14);
    g.addColorStop(0, '#d8dce8'); g.addColorStop(1, '#5a5e6a');
    ctx.fillStyle = g; rr(ctx, x, y, w, 12, 3); ctx.fill();
    ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = th.accent;
    ctx.save(); ctx.shadowColor = th.accent; ctx.shadowBlur = 6;
    for (let i = 0; i < w / 16; i++) { const on = (Math.floor(t * 4) + i) % 2; ctx.globalAlpha = on ? 1 : 0.35; ctx.fillRect(x + 6 + i * 16, y + 5, 6, 2); }
    ctx.restore();
  }
};

/* ----- Bosses ----- */
const BOSS_LOOKS = {
  1: { name: 'Mister Mutebox', body: '#5a4a8a', acc: '#ffcf7a', horns: false },
  2: { name: 'Glitch Diva', body: '#3a1a5a', acc: '#ff4fd8', horns: true },
  3: { name: 'Thornback', body: '#4a6a3a', acc: '#a6e36a', horns: true },
  4: { name: 'Frostjaw', body: '#5a8acc', acc: '#e8f6ff', horns: true },
  5: { name: 'Sandstorm Sultan', body: '#c47a3a', acc: '#ffd84a', horns: false },
  6: { name: 'The Deep Hum', body: '#1a5a7a', acc: '#3ad6ff', horns: false },
  7: { name: 'Gearhead Grim', body: '#7a7a84', acc: '#ffa84a', horns: true },
  8: { name: 'Thunderclap', body: '#4a4a7a', acc: '#ffe14f', horns: true },
  9: { name: 'Magmaw', body: '#7a1a14', acc: '#ff6a2a', horns: true },
  10: { name: 'THE HUSH', body: '#0a0610', acc: '#ffffff', horns: false, hush: true },
  11: { name: 'The Roadie', body: '#2a2a30', acc: '#ffd84a', horns: false },
  12: { name: 'NULL', body: '#003a24', acc: '#00ff9a', horns: true },
  22: { name: 'The Archivist', body: '#5a3a6a', acc: '#ff9ab0', horns: false }
};
function drawBoss(ctx, b, t) {
  if (typeof BossArt !== 'undefined') return BossArt.draw(ctx, b, t);
  const L = BOSS_LOOKS[b.world] || BOSS_LOOKS[1];
  const x = b.x + b.w / 2, y = b.y + b.h;
  const flash = b.hurtT > 0 && Math.floor(b.hurtT * 20) % 2 === 0;
  ctx.save();
  if (L.hush) {
    // shadow figure: hooded silhouette with white eyes, wisps
    const sway = Math.sin(t * 2) * 4;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ag = ctx.createRadialGradient(x, y - 50, 10, x, y - 50, 90);
    ag.addColorStop(0, 'rgba(160,90,255,0.3)'); ag.addColorStop(1, 'rgba(160,90,255,0)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y - 50, 90, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = flash ? '#ffffff' : '#07040c';
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.quadraticCurveTo(x - 46 + sway, y - 60, x - 22, y - 92);
    ctx.quadraticCurveTo(x, y - 116, x + 22, y - 92);
    ctx.quadraticCurveTo(x + 46 + sway, y - 60, x + 40, y);
    for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(x + 40 - i * 13.3 - 6, y - 10 + Math.sin(t * 6 + i) * 6, x + 40 - (i + 1) * 13.3, y);
    ctx.fill();
    ctx.fillStyle = flash ? '#000' : '#ffffff';
    ctx.save(); ctx.shadowColor = '#c08aff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(x - 9 + b.dir * 3, y - 80, 4, 2.2 + (b.state === 'charge' ? 2 : 0), -0.2, 0, TAU); ctx.ellipse(x + 9 + b.dir * 3, y - 80, 4, 2.2 + (b.state === 'charge' ? 2 : 0), 0.2, 0, TAU); ctx.fill();
    ctx.restore();
    // finger to lips gesture
    ctx.strokeStyle = flash ? '#000' : '#1a1024'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 26, y - 30); ctx.quadraticCurveTo(x + 22, y - 56, x + 4 + b.dir * 3, y - 68); ctx.stroke();
    ctx.restore();
    return;
  }
  const sq = b.squash || 0;
  ctx.translate(x, y); ctx.scale(b.dir, 1); ctx.scale(1 + sq * 0.1, 1 - sq * 0.1);
  const w = b.w, h = b.h;
  // feet
  const step = Math.sin(t * 8) * (b.vx ? 1 : 0);
  ctx.fillStyle = shade(L.body, -0.5);
  ctx.beginPath(); ctx.ellipse(-w * 0.25, -6 - Math.max(0, step) * 3, w * 0.16, 7, 0, 0, TAU); ctx.ellipse(w * 0.25, -6 - Math.max(0, -step) * 3, w * 0.16, 7, 0, 0, TAU); ctx.fill();
  // body
  const g = ctx.createRadialGradient(-w * 0.15, -h * 0.7, 4, 0, -h * 0.45, w * 0.75);
  g.addColorStop(0, flash ? '#ffffff' : shade(L.body, 0.35)); g.addColorStop(0.6, flash ? '#ffdddd' : L.body); g.addColorStop(1, shade(L.body, -0.5));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -h * 0.48, w * 0.5, h * 0.46, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = shade(L.body, -0.7); ctx.lineWidth = 2; ctx.stroke();
  // belly plate
  ctx.fillStyle = rgba(L.acc, 0.25); ctx.beginPath(); ctx.ellipse(w * 0.08, -h * 0.35, w * 0.3, h * 0.25, 0, 0, TAU); ctx.fill();
  if (L.horns) {
    ctx.fillStyle = L.acc;
    ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.85); ctx.quadraticCurveTo(-w * 0.45, -h * 1.15, -w * 0.15, -h * 1.1); ctx.lineTo(-w * 0.18, -h * 0.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.22, -h * 0.88); ctx.quadraticCurveTo(w * 0.4, -h * 1.18, w * 0.42, -h * 1.0); ctx.lineTo(w * 0.32, -h * 0.82); ctx.fill();
  }
  // face
  const ey = -h * 0.62;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(w * 0.05, ey, 8, 9, 0, 0, TAU); ctx.ellipse(w * 0.3, ey, 7, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#16101a';
  ctx.beginPath(); ctx.arc(w * 0.08 + 2, ey + 1, 4, 0, TAU); ctx.arc(w * 0.32 + 2, ey + 1, 3.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#16101a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-w * 0.06, ey - 12); ctx.lineTo(w * 0.14, ey - 7); ctx.moveTo(w * 0.4, ey - 11); ctx.lineTo(w * 0.24, ey - 7); ctx.stroke();
  // mouth: zipped (they stole the music!)
  ctx.fillStyle = '#16101a'; rr(ctx, w * 0.0, -h * 0.4, w * 0.36, 8, 3); ctx.fill();
  ctx.strokeStyle = L.acc; ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(w * 0.02 + i * w * 0.06, -h * 0.4 + 1); ctx.lineTo(w * 0.02 + i * w * 0.06, -h * 0.4 + 7); ctx.stroke(); }
  ctx.restore();
}

/* ----- Decorations ----- */
const Decor = {
  draw(ctx, d, t, th) {
    const f = this[d.kind];
    if (f) f.call(this, ctx, d.x, d.y, t, th, d);
  },
  lamp(ctx, x, y, t) {
    ctx.fillStyle = '#1a1a24'; ctx.fillRect(x - 2, y - 76, 4, 76); ctx.fillRect(x - 5, y - 6, 10, 6);
    ctx.fillRect(x - 2, y - 76, 14, 3);
    ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.moveTo(x + 6, y - 73); ctx.lineTo(x + 16, y - 73); ctx.lineTo(x + 14, y - 66); ctx.lineTo(x + 8, y - 66); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x + 11, y - 66, 2, x + 11, y - 40, 60);
    g.addColorStop(0, 'rgba(255,220,140,0.4)'); g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 7, y - 66); ctx.lineTo(x + 15, y - 66); ctx.lineTo(x + 40, y); ctx.lineTo(x - 18, y); ctx.fill();
    ctx.restore();
  },
  bush(ctx, x, y, t, th) {
    const c = th.ground.cap;
    ctx.fillStyle = shade(c, -0.3);
    ctx.beginPath(); ctx.arc(x - 12, y - 8, 10, 0, TAU); ctx.arc(x + 12, y - 8, 10, 0, TAU); ctx.arc(x, y - 13, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(c, -0.05);
    ctx.beginPath(); ctx.arc(x - 12, y - 10, 7, 0, TAU); ctx.arc(x + 11, y - 10, 7, 0, TAU); ctx.arc(x, y - 15, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x - 3, y - 20, 4, 0, TAU); ctx.fill();
  },
  fence(ctx, x, y) {
    ctx.fillStyle = '#d8d2c8';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 9 - 3, y); ctx.lineTo(x + i * 9 - 3, y - 20); ctx.lineTo(x + i * 9, y - 24); ctx.lineTo(x + i * 9 + 3, y - 20); ctx.lineTo(x + i * 9 + 3, y); ctx.fill(); }
    ctx.fillRect(x - 22, y - 16, 44, 3); ctx.fillRect(x - 22, y - 8, 44, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 22, y - 13, 44, 1);
  },
  mailbox(ctx, x, y) {
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 2, y - 22, 4, 22);
    ctx.fillStyle = '#2a4a8a'; rr(ctx, x - 9, y - 32, 18, 11, 5); ctx.fill();
    ctx.fillStyle = '#ff3a3a'; ctx.fillRect(x + 8, y - 36, 2, 8); ctx.fillRect(x + 8, y - 36, 5, 3);
  },
  tree(ctx, x, y, t, th) {
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - 4, y - 40, 8, 40);
    const c = shade(th.ground.cap, -0.35);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y - 56, 22, 0, TAU); ctx.arc(x - 16, y - 44, 15, 0, TAU); ctx.arc(x + 16, y - 44, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(c, 0.15); ctx.beginPath(); ctx.arc(x - 6, y - 62, 10, 0, TAU); ctx.fill();
  },
  neonsign(ctx, x, y, t, th, d) {
    const words = ['OPEN', 'LIVE', 'B-O', 'ROCK', 'NITE', '22'];
    const w = words[(d.seed || 0) % words.length];
    const col = (d.seed || 0) % 2 ? '#ff4fd8' : '#38f2ff';
    const on = Math.sin(t * 9 + (d.seed || 0)) > -0.92;
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 2, y - 40, 4, 40);
    ctx.fillStyle = '#0a0a12'; rr(ctx, x - 22, y - 62, 44, 22, 4); ctx.fill();
    ctx.save(); if (on) { ctx.shadowColor = col; ctx.shadowBlur = 10; }
    ctx.fillStyle = on ? col : '#3a3a44'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w, x, y - 50.5);
    ctx.strokeStyle = on ? col : '#3a3a44'; ctx.lineWidth = 1.2; rr(ctx, x - 22, y - 62, 44, 22, 4); ctx.stroke();
    ctx.restore();
  },
  acunit(ctx, x, y) {
    ctx.fillStyle = '#5a5a68'; rr(ctx, x - 14, y - 20, 28, 20, 2); ctx.fill();
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(x, y - 10, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a7a88'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + Math.cos(i * 1.57 + performance.now() * 0.01) * 6, y - 10 + Math.sin(i * 1.57 + performance.now() * 0.01) * 6); ctx.stroke(); }
  },
  antenna(ctx, x, y, t) {
    ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 60); ctx.moveTo(x - 12, y - 45); ctx.lineTo(x + 12, y - 45); ctx.moveTo(x - 8, y - 55); ctx.lineTo(x + 8, y - 55); ctx.stroke();
    if (Math.sin(t * 4) > 0) { ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x, y - 62, 2.5, 0, TAU); ctx.fill(); }
  },
  vent(ctx, x, y) { ctx.fillStyle = '#4a4a58'; ctx.fillRect(x - 8, y - 24, 16, 24); ctx.fillRect(x - 11, y - 28, 22, 5); },
  fern(ctx, x, y, t, th) {
    ctx.strokeStyle = shade(th.ground.cap, -0.2); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.35 + Math.sin(t * 1.5 + x) * 0.05;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(a) * 12, y - 18, x + Math.sin(a) * 22, y - 20 + Math.abs(i) * 4); ctx.stroke();
    }
  },
  mushroom(ctx, x, y, t) {
    ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x - 3, y - 12, 6, 12);
    ctx.save(); ctx.shadowColor = '#7affd8'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#4ad8c8'; ctx.beginPath(); ctx.ellipse(x, y - 12, 11, 7, 0, Math.PI, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - 4, y - 15, 1.6, 0, TAU); ctx.arc(x + 3, y - 16, 1.3, 0, TAU); ctx.fill();
  },
  flower(ctx, x, y, t, th, d) {
    const cols = ['#ff7ab0', '#ffd84a', '#7ac8ff', '#ffffff'];
    const c = cols[(d.seed || 0) % 4];
    const sway = Math.sin(t * 2 + x) * 1.5;
    ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - 8, x + sway, y - 14); ctx.stroke();
    ctx.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.beginPath(); ctx.arc(x + sway + Math.cos(a) * 3, y - 14 + Math.sin(a) * 3, 2.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffcc3a'; ctx.beginPath(); ctx.arc(x + sway, y - 14, 1.6, 0, TAU); ctx.fill();
  },
  stump(ctx, x, y) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 10, y - 12, 20, 12); ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(x, y - 12, 10, 3, 0, 0, TAU); ctx.fill(); },
  snowpine(ctx, x, y) {
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 3, y - 10, 6, 10);
    for (let i = 0; i < 3; i++) {
      const ty = y - 10 - i * 14, w = 20 - i * 5;
      ctx.fillStyle = '#1f4a5a'; ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.lineTo(x, ty - 20); ctx.lineTo(x + w, ty); ctx.fill();
      ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.moveTo(x - w * 0.6, ty - 8); ctx.lineTo(x, ty - 20); ctx.lineTo(x + w * 0.6, ty - 8); ctx.quadraticCurveTo(x, ty - 12, x - w * 0.6, ty - 8); ctx.fill();
    }
  },
  crystal(ctx, x, y, t, th) {
    const c = th.accent;
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 10 + Math.sin(t * 2 + x) * 4;
    ctx.fillStyle = rgba(c, 0.85);
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 3, y - 22); ctx.lineTo(x + 1, y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 1, y); ctx.lineTo(x + 4, y - 15); ctx.lineTo(x + 8, y); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x - 3, y - 18); ctx.lineTo(x - 2, y - 4); ctx.fill();
  },
  crystalred(ctx, x, y, t) { this.crystal(ctx, x, y, t, { accent: '#ff3a3a' }); },
  rockpile(ctx, x, y, t, th) {
    ctx.fillStyle = th.ground.rock; ctx.beginPath(); ctx.ellipse(x - 6, y - 4, 9, 6, 0, 0, TAU); ctx.ellipse(x + 7, y - 3, 7, 4, 0, 0, TAU); ctx.ellipse(x, y - 9, 6, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(x - 2, y - 11, 2, 0, TAU); ctx.fill();
  },
  snowman(ctx, x, y, t) {
    ctx.fillStyle = '#f4faff';
    ctx.beginPath(); ctx.arc(x, y - 11, 11, 0, TAU); ctx.arc(x, y - 28, 8, 0, TAU); ctx.fill();
    // long dark hair on the snowman — a little tribute
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.ellipse(x - 2, y - 33, 9, 5, 0, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 33); ctx.quadraticCurveTo(x - 12, y - 22, x - 9, y - 16); ctx.lineTo(x - 5, y - 26); ctx.fill();
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.arc(x + 2, y - 29, 1.2, 0, TAU); ctx.arc(x + 6, y - 29, 1.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(x + 6, y - 26); ctx.lineTo(x + 13, y - 25); ctx.lineTo(x + 6, y - 24); ctx.fill();
    ctx.fillStyle = '#16131a'; ctx.fillRect(x - 8, y - 22, 16, 3);
  },
  cactus(ctx, x, y) {
    ctx.fillStyle = '#3a8a4a';
    rr(ctx, x - 5, y - 36, 10, 36, 5); ctx.fill();
    rr(ctx, x - 15, y - 26, 6, 14, 3); ctx.fill(); ctx.fillRect(x - 15, y - 16, 12, 5);
    rr(ctx, x + 9, y - 30, 6, 12, 3); ctx.fill(); ctx.fillRect(x + 3, y - 22, 12, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 2, y - 33, 2, 30);
  },
  bones(ctx, x, y) {
    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath(); ctx.ellipse(x, y - 6, 8, 6, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.arc(x - 3, y - 7, 1.6, 0, TAU); ctx.arc(x + 3, y - 7, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x + 8, y - 3, 12, 3);
  },
  ruin(ctx, x, y, t, th) {
    ctx.fillStyle = shade(th.pillar.c1, -0.1); ctx.fillRect(x - 7, y - 40, 14, 40);
    ctx.fillStyle = th.pillar.cap; ctx.fillRect(x - 10, y - 44, 20, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 3, y - 38, 2, 38); ctx.fillRect(x + 3, y - 38, 2, 38);
  },
  palm(ctx, x, y, t) {
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 30, x + 2, y - 60); ctx.stroke();
    ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.7 + Math.sin(t + i) * 0.05; ctx.beginPath(); ctx.moveTo(x + 2, y - 60); ctx.quadraticCurveTo(x + 2 + Math.cos(a) * 18, y - 60 + Math.sin(a) * 18 - 6, x + 2 + Math.cos(a) * 30, y - 60 + Math.sin(a) * 30 + 10); ctx.stroke(); }
  },
  seaweed(ctx, x, y, t) {
    ctx.strokeStyle = '#2a8a5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.moveTo(x + s * 3, y); for (let k = 1; k <= 6; k++) ctx.lineTo(x + s * 3 + Math.sin(t * 2 + k * 0.8 + s) * 4, y - k * 7); ctx.stroke(); }
  },
  coral(ctx, x, y, t) {
    ctx.strokeStyle = '#ff7a9a'; ctx.lineCap = 'round';
    const br = (x0, y0, a, len, d) => { if (d > 2) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; ctx.lineWidth = 5 - d * 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, a - 0.5, len * 0.7, d + 1); br(x1, y1, a + 0.5, len * 0.7, d + 1); };
    br(x, y, -Math.PI / 2, 12, 0);
  },
  anemone(ctx, x, y, t) {
    ctx.strokeStyle = '#c45aff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2, y); ctx.quadraticCurveTo(x + i * 3, y - 8, x + i * 4 + Math.sin(t * 3 + i) * 3, y - 14); ctx.stroke(); }
    ctx.fillStyle = '#7a2a9a'; ctx.beginPath(); ctx.ellipse(x, y - 2, 8, 4, 0, 0, TAU); ctx.fill();
  },
  shell(ctx, x, y) { ctx.fillStyle = '#ffd0b0'; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x, y - 14, x + 7, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c88a6a'; ctx.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + i * 3, y - 9 + Math.abs(i) * 2); ctx.stroke(); } },
  gear(ctx, x, y, t) { drawGearShape(ctx, x, y - 18, 14, '#5a5a64', 10, t * (x % 2 ? 1 : -1)); ctx.fillStyle = '#8a8a94'; ctx.beginPath(); ctx.arc(x, y - 18, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 14, 4, 14); },
  barrel(ctx, x, y) {
    const g = ctx.createLinearGradient(x - 10, 0, x + 10, 0); g.addColorStop(0, '#3a5a8a'); g.addColorStop(0.5, '#5a8ac4'); g.addColorStop(1, '#2a4a7a');
    ctx.fillStyle = g; rr(ctx, x - 10, y - 26, 20, 26, 3); ctx.fill();
    ctx.fillStyle = '#2a3a5a'; ctx.fillRect(x - 10, y - 20, 20, 2); ctx.fillRect(x - 10, y - 8, 20, 2);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x, y - 17); ctx.lineTo(x + 4, y - 11); ctx.lineTo(x - 4, y - 11); ctx.fill();
  },
  hazard(ctx, x, y) {
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 1.5, y - 30, 3, 30);
    ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.moveTo(x, y - 46); ctx.lineTo(x + 11, y - 28); ctx.lineTo(x - 11, y - 28); ctx.fill();
    ctx.fillStyle = '#16131a'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y - 33);
  },
  steam(ctx, x, y, t) {
    ctx.fillStyle = '#4a4a54'; ctx.fillRect(x - 5, y - 10, 10, 10);
    for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i * 0.25) % 1; ctx.fillStyle = `rgba(230,230,240,${0.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 6 + i) * 4, y - 12 - k * 40, 4 + k * 8, 0, TAU); ctx.fill(); }
  },
  vane(ctx, x, y, t) {
    ctx.strokeStyle = '#3a3a54'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 40); ctx.scale(Math.cos(t * 2), 1);
    ctx.fillStyle = '#3a3a54'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(10, -2); ctx.lineTo(14, 0); ctx.lineTo(10, 2); ctx.fill(); ctx.fillRect(-14, -6, 4, 12); ctx.restore();
  },
  rod(ctx, x, y) { ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 50); ctx.stroke(); ctx.fillStyle = '#c8c8e0'; ctx.beginPath(); ctx.arc(x, y - 52, 3, 0, TAU); ctx.fill(); },
  flag(ctx, x, y, t) {
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(x - 1, y - 44, 2, 44);
    ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.moveTo(x + 1, y - 44); for (let i = 0; i <= 6; i++) ctx.lineTo(x + 1 + i * 3, y - 44 + Math.sin(t * 8 + i) * 2); for (let i = 6; i >= 0; i--) ctx.lineTo(x + 1 + i * 3, y - 34 + Math.sin(t * 8 + i) * 2); ctx.fill();
  },
  torch(ctx, x, y, t) {
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 5, y - 34, 10, 5);
    const fl = Math.sin(t * 17 + x) * 1.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 40, 1, x, y - 40, 34); g.addColorStop(0, 'rgba(255,170,60,0.55)'); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 40, 34, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb84a'; ctx.beginPath(); ctx.moveTo(x - 5, y - 34); ctx.quadraticCurveTo(x - 4, y - 46, x + fl, y - 50); ctx.quadraticCurveTo(x + 4, y - 44, x + 5, y - 34); ctx.fill();
    ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.ellipse(x, y - 38, 2, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  banner(ctx, x, y, t, th) {
    ctx.fillStyle = '#2a2030'; ctx.fillRect(x - 12, y - 96, 24, 3);
    const c = th.accent;
    ctx.fillStyle = shade(c, -0.4); ctx.beginPath(); ctx.moveTo(x - 10, y - 93);
    ctx.lineTo(x + 10, y - 93); ctx.lineTo(x + 10 + Math.sin(t * 2) * 1, y - 50); ctx.lineTo(x, y - 58); ctx.lineTo(x - 10 + Math.sin(t * 2) * 1, y - 50); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y - 78, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(c, -0.4); ctx.beginPath(); ctx.arc(x + 2, y - 79, 4, 0, TAU); ctx.fill();
  },
  brazier(ctx, x, y, t) {
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(x - 10, y - 20); ctx.lineTo(x + 10, y - 20); ctx.lineTo(x + 5, y - 10); ctx.lineTo(x - 5, y - 10); ctx.fill(); ctx.fillRect(x - 2, y - 10, 4, 10);
    this.torch(ctx, x, y + 12, t);
  },
  statue(ctx, x, y, t, th) {
    ctx.fillStyle = shade(th.hard.c1, -0.2); ctx.fillRect(x - 12, y - 10, 24, 10);
    ctx.fillStyle = th.hard.c1; ctx.beginPath(); ctx.arc(x, y - 44, 7, 0, TAU); ctx.fill(); rr(ctx, x - 8, y - 38, 16, 28, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 46); ctx.quadraticCurveTo(x - 13, y - 30, x - 9, y - 24); ctx.lineTo(x - 4, y - 40); ctx.fill();
  },
  amp(ctx, x, y) {
    ctx.fillStyle = '#16141a'; rr(ctx, x - 16, y - 30, 32, 30, 2); ctx.fill();
    ctx.fillStyle = '#c8b070'; ctx.fillRect(x - 15, y - 29, 30, 5);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x - 14, y - 22, 28, 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 13, y - 20 + i * 3.3); ctx.lineTo(x + 13, y - 20 + i * 3.3); ctx.stroke(); }
    ctx.fillStyle = '#16141a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 10 + i * 6, y - 26.5, 1.3, 0, TAU); ctx.fill(); }
  },
  micstand(ctx, x, y) { ctx.strokeStyle = '#6a6a76'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x, y - 6); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y - 46); ctx.lineTo(x + 10, y - 52); ctx.stroke(); ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.ellipse(x + 12, y - 53, 3, 5, 0.9, 0, TAU); ctx.fill(); },
  cable(ctx, x, y) { ctx.strokeStyle = '#0a0a0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y - 1); ctx.bezierCurveTo(x - 10, y - 6, x, y + 2, x + 6, y - 3); ctx.bezierCurveTo(x + 14, y - 8, x + 18, y, x + 24, y - 1); ctx.stroke(); },
  setlist(ctx, x, y) { ctx.fillStyle = '#f4f0e8'; ctx.save(); ctx.translate(x, y - 2); ctx.rotate(-0.1); ctx.fillRect(-7, -4, 14, 4); ctx.restore(); },
  glitchbox(ctx, x, y, t) {
    if (Math.sin(t * 13 + x) < -0.6) return;
    ctx.fillStyle = Math.sin(t * 7 + x) > 0 ? 'rgba(255,0,212,0.5)' : 'rgba(0,255,154,0.5)';
    ctx.fillRect(x - 8 + Math.sin(t * 30) * 2, y - 24, 16, 16);
  },
  chainsdecor(ctx, x, y) { ctx.strokeStyle = '#3a3036'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x, y - 90 + i * 9, i % 2 ? 2 : 3.5, 5, 0, 0, TAU); ctx.stroke(); } }
};
