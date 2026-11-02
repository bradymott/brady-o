/* ============================================================
   Cast: Chinka, Slothy, the bosses and portraits
   ============================================================ */
const CHINKA = { hair: '#241612', hairHi: '#5a3a2c', skin: '#dcaa86', skinSh: '#b8835e', top: '#7a5644', topHi: '#9a7260', legs: '#141218', shoe: '#f4f4f0' };

/* Chinka: long dark wavy hair, sunglasses, big smile, brown tee, black leggings,
   white sneakers, glowing LED necklace. pose: idle | wave | cheer | run | captive */
function drawChinka(ctx, o) {
  const t = o.t || 0, pose = o.pose || 'idle', f = o.facing || 1, C = CHINKA;
  ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale); ctx.scale(f, 1);
  const bob = pose === 'run' ? -Math.abs(Math.cos(t * 12)) * 1.5 : Math.sin(t * 2.2) * 0.6;
  const ph = t * 12;
  const OL = 'rgba(150,120,170,0.4)';
  const cap = (x0, y0, x1, y1, w, col) => { outlinedCapsule(ctx, x0, y0, x1, y1, w, col); };
  // hair behind the body
  const hy = -50 + bob;
  const sway = Math.sin(t * 1.8) * 1.5 + (pose === 'run' ? -4 : 0);
  ctx.fillStyle = C.hair;
  ctx.beginPath(); ctx.moveTo(-9, hy - 4);
  ctx.bezierCurveTo(-14 + sway, hy + 10, -16 + sway, hy + 24, -10 + sway * 1.5, hy + 32);
  for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-8 + i * 3 + sway, hy + 36 - (i % 2) * 4, -6 + i * 3 + sway * 1.2, hy + 31);
  ctx.quadraticCurveTo(2, hy + 14, 4, hy - 2); ctx.closePath(); ctx.fill();
  // legs (leggings) + white sneakers
  const leg = (k, front) => {
    const th = pose === 'run' ? Math.sin(ph + k) * 0.8 : (front ? 0.06 : -0.06);
    const sh = th - (pose === 'run' ? Math.max(0, Math.sin(ph + k - 1.3)) * 1.1 : 0);
    const hx = front ? 2 : -2, hyy = -24 + bob;
    const [kx, ky] = limbEnd(hx, hyy, th, 11), [ax, ay] = limbEnd(kx, ky, sh, 11);
    cap(hx, hyy, kx, ky, 6, front ? C.legs : shade(C.legs, 0.08)); cap(kx, ky, ax, ay, 5.4, front ? C.legs : shade(C.legs, 0.08));
    ctx.fillStyle = OL; rr(ctx, ax - 4, ay - 3, 10.5, 6, 3); ctx.fill();
    ctx.fillStyle = C.shoe; rr(ctx, ax - 3.5, ay - 2.5, 9.5, 5, 2.5); ctx.fill();
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(ax - 3.5, ay + 1.2, 9.5, 1.2);
  };
  leg(Math.PI, false);
  // arms
  const arm = (front) => {
    let ua, fa;
    if (pose === 'wave' && front) { ua = 2.7; fa = 3.0 + Math.sin(t * 10) * 0.4; }
    else if (pose === 'cheer') { ua = front ? 2.8 : -2.8; fa = front ? 3.0 : -3.0; }
    else if (pose === 'captive') { ua = front ? 0.6 : -0.6; fa = front ? 2.0 : -2.0; }
    else if (pose === 'run') { ua = -Math.sin(ph) * 0.8 * (front ? 1 : -1); fa = ua + 1.2; }
    else { ua = front ? 0.15 : -0.15; fa = front ? 0.45 : 0.2; }
    const sx = front ? 3 : -3, sy = -40 + bob;
    const [ex, ey] = limbEnd(sx, sy, ua, 9), [hx2, hy2] = limbEnd(ex, ey, fa, 8.5);
    cap(sx, sy, ex, ey, 4.6, front ? C.skin : C.skinSh); cap(ex, ey, hx2, hy2, 4.2, front ? C.skin : C.skinSh);
    // short tee sleeve + bracelets
    cap(sx, sy, lerp(sx, ex, 0.35), lerp(sy, ey, 0.35), 6.2, front ? C.top : shade(C.top, -0.2));
    ctx.fillStyle = front ? '#ffd84a' : '#ff7ad8'; ctx.beginPath(); ctx.arc(lerp(ex, hx2, 0.8), lerp(ey, hy2, 0.8), 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = front ? C.skin : C.skinSh; ctx.beginPath(); ctx.arc(hx2, hy2, 2.6, 0, TAU); ctx.fill();
  };
  arm(false);
  // torso (brown tee)
  ctx.fillStyle = OL; rr(ctx, -8, -44 + bob, 16, 22, 5); ctx.fill();
  const tg = ctx.createLinearGradient(-7, 0, 7, 0); tg.addColorStop(0, shade(C.top, -0.2)); tg.addColorStop(1, C.topHi);
  ctx.fillStyle = tg; rr(ctx, -7, -43 + bob, 14, 20, 4.5); ctx.fill();
  ctx.fillStyle = C.legs; ctx.fillRect(-7, -25 + bob, 14, 3);
  // LED necklace
  for (let i = 0; i < 7; i++) { const a = 0.35 + i / 6 * 2.4; ctx.fillStyle = GLOW_COLS[(i + Math.floor(t * 4)) % 5]; ctx.beginPath(); ctx.arc(1 + Math.cos(a) * 5, -41 + bob + Math.sin(a) * 4, 1.1, 0, TAU); ctx.fill(); }
  leg(0, true);
  // head
  const R = 8.6, hx = 1.5, hcy = -50 + bob;
  ctx.fillStyle = C.skinSh; ctx.fillRect(-1.6, hcy + R * 0.55, 3.6, 4);
  ctx.fillStyle = OL; ctx.beginPath(); ctx.ellipse(hx, hcy, R + 1, R * 1.07 + 1, 0, 0, TAU); ctx.fill();
  const fg = ctx.createLinearGradient(hx - R, 0, hx + R, 0); fg.addColorStop(0, C.skinSh); fg.addColorStop(0.55, C.skin); fg.addColorStop(1, C.skin);
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(hx, hcy, R, R * 1.07, 0, 0, TAU); ctx.fill();
  // smile
  ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.moveTo(hx + R * 0.3, hcy + R * 0.42); ctx.quadraticCurveTo(hx + R * 0.6, hcy + R * 0.82, hx + R * 0.92, hcy + R * 0.36); ctx.quadraticCurveTo(hx + R * 0.6, hcy + R * 0.5, hx + R * 0.3, hcy + R * 0.42); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(hx + R * 0.34, hcy + R * 0.45); ctx.quadraticCurveTo(hx + R * 0.6, hcy + R * 0.57, hx + R * 0.88, hcy + R * 0.4); ctx.quadraticCurveTo(hx + R * 0.6, hcy + R * 0.5, hx + R * 0.34, hcy + R * 0.45); ctx.fill();
  ctx.fillStyle = C.skinSh; ctx.beginPath(); ctx.moveTo(hx + R * 0.9, hcy + R * 0.02); ctx.lineTo(hx + R * 1.08, hcy + R * 0.26); ctx.lineTo(hx + R * 0.86, hcy + R * 0.3); ctx.fill();
  // cheeks
  ctx.fillStyle = 'rgba(255,120,120,0.25)'; ctx.beginPath(); ctx.arc(hx + R * 0.35, hcy + R * 0.22, 2, 0, TAU); ctx.fill();
  // hair cap: centre part with waves falling past the face
  const hg = ctx.createLinearGradient(0, hcy - R * 1.2, 0, hcy + R); hg.addColorStop(0, C.hairHi); hg.addColorStop(0.45, C.hair); hg.addColorStop(1, C.hair);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(hx + R * 1.02, hcy - R * 0.3);
  ctx.quadraticCurveTo(hx + R * 1.0, hcy - R * 1.3, hx - R * 0.1, hcy - R * 1.2);
  ctx.quadraticCurveTo(hx - R * 1.3, hcy - R * 1.0, hx - R * 1.2, hcy + R * 0.3);
  ctx.quadraticCurveTo(hx - R * 1.2, hcy + R * 1.5, hx - R * 0.6, hcy + R * 1.9);
  ctx.quadraticCurveTo(hx - R * 0.25, hcy + R * 1.2, hx - R * 0.1, hcy + R * 0.2);
  ctx.quadraticCurveTo(hx + R * 0.25, hcy - R * 0.55, hx + R * 1.02, hcy - R * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(C.hairHi, 0.7); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(hx - R * 0.2, hcy - R * 1.05); ctx.quadraticCurveTo(hx - R * 1.0, hcy - R * 0.4, hx - R * 0.9, hcy + R * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + R * 0.2, hcy - R * 1.0); ctx.quadraticCurveTo(hx + R * 0.7, hcy - R * 0.9, hx + R * 0.95, hcy - R * 0.45); ctx.stroke();
  // sunglasses
  ctx.fillStyle = '#1a1418';
  ctx.beginPath(); ctx.ellipse(hx + R * 0.3, hcy - R * 0.05, R * 0.3, R * 0.24, 0, 0, TAU); ctx.ellipse(hx + R * 0.82, hcy - R * 0.05, R * 0.2, R * 0.22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a1418'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + R * 0.58, hcy - R * 0.1); ctx.lineTo(hx + R * 0.64, hcy - R * 0.1); ctx.moveTo(hx, hcy - R * 0.1); ctx.lineTo(hx - R * 0.35, hcy + R * 0.05); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hx + R * 0.2, hcy - R * 0.18); ctx.lineTo(hx + R * 0.32, hcy - R * 0.02); ctx.stroke();
  // goggles resting on her head (it's the playa)
  ctx.fillStyle = '#2a2a34'; ctx.fillRect(hx - R * 0.8, hcy - R * 0.98, R * 1.6, 1.4);
  ctx.fillStyle = 'rgba(255,170,90,0.9)'; ctx.beginPath(); ctx.ellipse(hx + R * 0.15, hcy - R * 1.05, 2.4, 2, 0, 0, TAU); ctx.ellipse(hx + R * 0.65, hcy - R * 1.0, 2, 1.8, 0, 0, TAU); ctx.fill();
  arm(true);
  if (pose === 'captive') { ctx.fillStyle = '#fff'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', hx + 14, hcy - 14 + Math.sin(t * 6) * 2); }
  ctx.restore();
}

/* Slothy: a big friendly sloth with goggles and a flower crown.
   pose: walk | idle | sleep | hang | hug | jump */
const SLOTH = { fur: '#8a7860', furHi: '#b0a084', furSh: '#5e5040', face: '#efe0c2', mask: '#3a2a20', claw: '#f4ecd8' };
function drawSlothy(ctx, o) {
  const t = o.t || 0, pose = o.pose || 'idle', f = o.facing || 1, S = SLOTH;
  ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale); ctx.scale(f, 1);
  const furBlob = (x, y, rx, ry, rot) => {
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, Math.max(rx, ry));
    g.addColorStop(0, S.furHi); g.addColorStop(0.6, S.fur); g.addColorStop(1, S.furSh);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(S.furSh, 0.7); ctx.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { const a = (rot || 0) + i * 0.9; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rx * 0.5, y + Math.sin(a) * ry * 0.5); ctx.lineTo(x + Math.cos(a) * rx * 0.85, y + Math.sin(a) * ry * 0.85 + 2); ctx.stroke(); }
  };
  const limb = (x0, y0, x1, y1, w) => {
    capsule(ctx, x0, y0, x1, y1, w + 1.6, rgba(S.furSh, 0.8)); capsule(ctx, x0, y0, x1, y1, w, S.fur);
    ctx.strokeStyle = S.claw; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.moveTo(x1 + c * 1.6, y1); ctx.quadraticCurveTo(x1 + c * 1.6 + 3, y1 + 2, x1 + c * 1.6 + 2, y1 + 5); ctx.stroke(); }
  };
  const head = (hx, hy, r, sleepy) => {
    furBlob(hx, hy, r * 1.08, r, 0);
    ctx.fillStyle = S.face; ctx.beginPath(); ctx.ellipse(hx + r * 0.15, hy + r * 0.12, r * 0.82, r * 0.66, 0, 0, TAU); ctx.fill();
    // the classic sloth eye-stripes
    ctx.fillStyle = S.mask;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + r * 0.15 + s * r * 0.36, hy + r * 0.08, r * 0.32, r * 0.14, s * 0.35, 0, TAU); ctx.fill(); }
    if (sleepy) { ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + r * 0.15 + s * r * 0.36, hy + r * 0.05, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke(); } }
    else { ctx.fillStyle = '#0e0806'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + r * 0.18 + s * r * 0.36, hy + r * 0.08, r * 0.1, 0, TAU); ctx.fill(); } ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + r * 0.22 + r * 0.36, hy + r * 0.04, r * 0.04, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.ellipse(hx + r * 0.2, hy + r * 0.32, r * 0.14, r * 0.1, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a2a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx + r * 0.2, hy + r * 0.38, r * 0.22, 0.25, Math.PI - 0.25); ctx.stroke();
    // goggles + flower crown
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(hx - r * 0.9, hy - r * 0.62, r * 1.8, 1.6);
    ctx.fillStyle = 'rgba(120,220,255,0.85)'; ctx.beginPath(); ctx.arc(hx - r * 0.15, hy - r * 0.68, r * 0.2, 0, TAU); ctx.arc(hx + r * 0.35, hy - r * 0.66, r * 0.2, 0, TAU); ctx.fill();
    const fl = ['#ff7ab0', '#ffd84a', '#ffffff', '#c87aff'];
    for (let i = 0; i < 5; i++) { const a = Math.PI * 1.15 + i * 0.32; const fx = hx + Math.cos(a) * r * 0.98, fy = hy + Math.sin(a) * r * 0.92; ctx.fillStyle = fl[i % 4]; for (let p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(fx + Math.cos(p * 1.26) * 1.6, fy + Math.sin(p * 1.26) * 1.6, 1.3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffb84a'; ctx.beginPath(); ctx.arc(fx, fy, 0.9, 0, TAU); ctx.fill(); }
  };
  if (pose === 'sleep') {
    furBlob(0, -10, 18, 11, 0);
    limb(-8, -6, 8, -4, 5);
    head(12, -16, 9, true);
    ctx.fillStyle = '#ffffff'; ctx.font = `${8 + Math.sin(t * 2) * 1}px ${FONT_DISPLAY}`; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2); ctx.fillText('z', 22, -30 - (t * 6 % 10)); ctx.fillText('Z', 28, -40 - (t * 6 % 10));
    ctx.restore(); return;
  }
  if (pose === 'hang') {
    // hanging upside-down from a ceiling by the claws
    limb(-10, 0, -12, 14, 5); limb(10, 0, 12, 14, 5);
    furBlob(0, 22, 13, 16, 0);
    head(2, 40, 9, false);
    ctx.restore(); return;
  }
  // walking on all fours (slow, cheerful)
  const k = pose === 'walk' ? Math.sin(t * 6) : 0;
  const lift = pose === 'jump' ? 1 : 0;
  limb(-16, -14, -18 - k * 4, -1 + lift * -2, 5);
  limb(14, -14, 16 + k * 4, -1 + lift * -2, 5);
  furBlob(0, -20, 26, 12, 0);
  limb(-12, -14, -10 + k * 4, -1, 5.5);
  limb(16, -14, 20 - k * 4, -1, 5.5);
  if (pose === 'hug') { limb(22, -20, 32, -26, 5); }
  head(24, -26 + Math.sin(t * 3) * 0.8, 10, false);
  ctx.restore();
}

/* ---------------- bosses ---------------- */
// each land's castle boss (the fortresses have their own mid-bosses, set per level)
const BOSS_STYLE = { 41: 'greeter', 42: 'barista', 43: 'dj', 44: 'witch', 45: 'geyser', 46: 'dustdevil', 47: 'rusty', 48: 'man', 49: 'bouncer', 50: 'archivist' };
const BOSS_FLOATERS = { witch: true, dustdevil: true, archivist: true, man: true };
function bossName(world) {
  const st = BOSS_STYLE[world];
  if (st && typeof bossDisplayName === 'function') return bossDisplayName(st);
  const W = WORLDS[world];
  return W ? W.names[W.plan.lastIndexOf('castle')] || W.names[W.names.length - 1] : 'Boss';
}
const BossArt = {
  draw(ctx, b, t) {
    const style = b.style || BOSS_STYLE[b.world] || 'greeter';
    const f = this[style] || this.greeter;
    const flash = b.hurtT > 0 && Math.floor(b.hurtT * 20) % 2 === 0;
    ctx.save();
    const x = b.x + b.w / 2, y = b.y + b.h;
    ctx.translate(x, y);
    const sq = b.squash || 0;
    ctx.scale(1 + sq * 0.08, 1 - sq * 0.08);
    f.call(this, ctx, b, t, b.dir || 1);
    if (flash) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-b.w, -b.h * 1.4, b.w * 2, b.h * 1.6); }
    ctx.restore();
  },
  eyes(ctx, x, y, r, dir, col) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + s * r * 1.3, y, r, r * 1.1, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col || '#1a1018'; ctx.beginPath(); ctx.arc(x + s * r * 1.3 + dir * r * 0.35, y + r * 0.15, r * 0.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + s * r * 2.2, y - r * 1.5); ctx.lineTo(x + s * r * 0.5, y - r * 0.9); ctx.stroke();
    }
  },
  shadow(ctx, w) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, -1, w, 5, 0, 0, TAU); ctx.fill(); },
  raccoon(ctx, b, t, d) {
    this.shadow(ctx, 34); ctx.scale(d, 1);
    const st = Math.sin(t * 8) * (b.vx ? 1 : 0);
    // ringed tail
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#2a2a32' : '#8a8a96'; ctx.beginPath(); ctx.ellipse(-32 - i * 4, -30 - i * 5, 9 - i * 0.6, 6, -0.8, 0, TAU); ctx.fill(); }
    // stolen tent rolled on his back
    ctx.fillStyle = '#3a8a4a'; rr(ctx, -30, -64, 30, 14, 7); ctx.fill(); ctx.fillStyle = '#2a6a3a'; ctx.fillRect(-20, -64, 3, 14); ctx.fillRect(-10, -64, 3, 14);
    ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.ellipse(-12 + st * 2, -6, 8, 6, 0, 0, TAU); ctx.ellipse(12 - st * 2, -6, 8, 6, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(-6, -46, 4, 0, -34, 36); g.addColorStop(0, '#b8b8c4'); g.addColorStop(1, '#5a5a68');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -32, 28, 28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.ellipse(6, -24, 15, 16, 0, 0, TAU); ctx.fill();
    // head with bandit mask
    ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.ellipse(14, -58, 18, 15, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, -68); ctx.lineTo(0, -80); ctx.lineTo(10, -70); ctx.moveTo(22, -70); ctx.lineTo(28, -80); ctx.lineTo(28, -66); ctx.fill();
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(16, -59, 16, 6, 0, 0, TAU); ctx.fill();
    this.eyes(ctx, 16, -59, 3.4, 1);
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(26, -51, 7, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(32, -52, 2.4, 0, TAU); ctx.fill();
    // headlamp
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(2, -71, 26, 3); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(20, -70, 3, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createLinearGradient(20, -70, 80, -40); lg.addColorStop(0, 'rgba(255,250,200,0.35)'); lg.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(22, -72); ctx.lineTo(90, -60); ctx.lineTo(90, -24); ctx.lineTo(22, -68); ctx.fill(); ctx.restore();
    // stolen cooler
    ctx.fillStyle = '#3a8ae8'; rr(ctx, 14, -34, 22, 16, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(14, -34, 22, 4);
  },
  cart(ctx, b, t, d) {
    this.shadow(ctx, 36); ctx.scale(d, 1);
    // a monstrous shopping cart overflowing with festival supplies
    ctx.fillStyle = '#3ac8ff'; rr(ctx, -28, -70, 14, 22, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; rr(ctx, -12, -76, 12, 28, 3); ctx.fill(); ctx.fillStyle = '#ff7ab0'; rr(ctx, 2, -66, 18, 18, 3); ctx.fill();
    ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-36, -54); ctx.lineTo(34, -54); ctx.lineTo(26, -16); ctx.lineTo(-30, -16); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1.2; for (let i = -30; i < 34; i += 6) { ctx.beginPath(); ctx.moveTo(i, -54); ctx.lineTo(i * 0.88, -16); ctx.stroke(); }
    for (let yy = -46; yy < -16; yy += 8) { ctx.beginPath(); ctx.moveTo(-34 + (yy + 54) * 0.12, yy); ctx.lineTo(32 - (yy + 54) * 0.2, yy); ctx.stroke(); }
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-36, -54); ctx.lineTo(-46, -66); ctx.lineTo(-52, -66); ctx.stroke();
    // angry face on the front grille
    ctx.fillStyle = '#ff2a2a'; ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(14, -44, 5, 3.5, 0.2, 0, TAU); ctx.ellipse(26, -42, 4, 3, 0.2, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.moveTo(8, -30); ctx.lineTo(30, -28); ctx.lineTo(28, -22); ctx.lineTo(10, -24); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 4, -29.5); ctx.lineTo(12 + i * 4, -26); ctx.lineTo(14 + i * 4, -29.2); ctx.fill(); }
    const spin = (b.x || 0) * 0.2;
    for (const wx of [-24, 20]) { ctx.save(); ctx.translate(wx, -7); ctx.rotate(spin); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a8a96'; ctx.fillRect(-1, -6, 2, 12); ctx.restore(); }
  },
  tumbleweed(ctx, b, t, d) {
    this.shadow(ctx, 34);
    const rot = (b.x || 0) * 0.05;
    ctx.save(); ctx.translate(0, -34); ctx.rotate(rot);
    ctx.strokeStyle = '#a8804a'; ctx.lineWidth = 1.6;
    const r2 = mulberry32(5);
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.ellipse((r2() - 0.5) * 12, (r2() - 0.5) * 12, 18 + r2() * 14, 10 + r2() * 14, r2() * TAU, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#7a5a2a'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse((r2() - 0.5) * 8, (r2() - 0.5) * 8, 26, 16, r2() * TAU, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.scale(d, 1);
    this.eyes(ctx, 4, -40, 4.2, 1);
    ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.moveTo(-14, -28); ctx.quadraticCurveTo(4, -36, 22, -28); ctx.quadraticCurveTo(14, -30, 4, -26); ctx.quadraticCurveTo(-6, -30, -14, -28); ctx.fill(); // mustache
    // sheriff hat and badge
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.ellipse(2, -66, 30, 6, -0.1, 0, TAU); ctx.fill(); rr(ctx, -12, -84, 28, 20, 8); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.fillRect(-12, -70, 28, 3);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 4 : 9; ctx.lineTo(-12 + Math.cos(a) * r, -20 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  },
  geyser(ctx, b, t, d) {
    this.shadow(ctx, 40); ctx.scale(d, 1);
    const g = ctx.createLinearGradient(0, -80, 0, 0); g.addColorStop(0, '#3aa87a'); g.addColorStop(0.3, '#e8743a'); g.addColorStop(0.65, '#c84a2a'); g.addColorStop(1, '#7a2a1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-42, 0); ctx.quadraticCurveTo(-30, -40, -12, -70); ctx.lineTo(12, -70); ctx.quadraticCurveTo(30, -40, 42, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,160,0.35)'; ctx.lineWidth = 2; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-42 + k * 6, -k * 14); ctx.quadraticCurveTo(0, -k * 14 - 6, 42 - k * 6, -k * 14); ctx.stroke(); }
    this.eyes(ctx, 6, -40, 4.5, 1);
    ctx.fillStyle = '#3a1a10'; ctx.beginPath(); ctx.ellipse(6, -22, 10, 5, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) { const k = (t * 1.4 + i / 6) % 1; ctx.fillStyle = `rgba(230,248,255,${0.55 * (1 - k)})`; ctx.beginPath(); ctx.arc(Math.sin(i * 2 + t) * 8, -74 - k * 50, 6 + k * 14, 0, TAU); ctx.fill(); }
  },
  hardhat(ctx, b, t, d) {
    this.shadow(ctx, 36); ctx.scale(d, 1);
    const st = Math.sin(t * 8) * (b.vx ? 1 : 0);
    ctx.fillStyle = '#5a3a1a'; rr(ctx, -20 + st * 2, -18, 14, 18, 4); ctx.fill(); rr(ctx, 6 - st * 2, -18, 14, 18, 4); ctx.fill();
    const g = ctx.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#a8581a'); g.addColorStop(0.5, '#e8822e'); g.addColorStop(1, '#a8581a');
    ctx.fillStyle = g; rr(ctx, -30, -64, 60, 50, 16); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-30, -44, 60, 4); ctx.fillStyle = 'rgba(230,210,170,0.4)'; ctx.fillRect(-30, -26, 60, 10);
    // shovel
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, -36); ctx.lineTo(44, -86); ctx.stroke();
    ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.moveTo(38, -90); ctx.lineTo(52, -86); ctx.lineTo(48, -104); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(30, -38, 6, 0, TAU); ctx.fill();
    // head: sunglasses, giant mustache, hard hat covered in stickers
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.ellipse(4, -74, 17, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16131a'; rr(ctx, -6, -80, 12, 6, 2); ctx.fill(); rr(ctx, 9, -80, 12, 6, 2); ctx.fill(); ctx.fillRect(4, -78, 6, 1.6);
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(-8, -66); ctx.quadraticCurveTo(6, -74, 22, -66); ctx.quadraticCurveTo(14, -62, 6, -66); ctx.quadraticCurveTo(-2, -62, -8, -66); ctx.fill();
    ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.ellipse(4, -86, 19, 12, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-18, -87, 44, 4);
    ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(-2, -92, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#3ac8ff'; ctx.fillRect(8, -96, 6, 4);
  },
  dj(ctx, b, t, d) {
    this.shadow(ctx, 40); ctx.scale(d, 1);
    // decks in front, hoodie, LED cube helmet
    ctx.fillStyle = '#16131a'; rr(ctx, -40, -30, 80, 30, 4); ctx.fill();
    for (const s of [-1, 1]) { ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(s * 22, -24, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a5a66'; ctx.save(); ctx.translate(s * 22, -24); ctx.rotate(t * 6 * s); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 0); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 5; i++) { ctx.fillStyle = GLOW_COLS[(i + Math.floor(t * 8)) % 5]; ctx.fillRect(-8 + i * 4, -28, 2.4, 2.4); }
    ctx.fillStyle = '#2a1a3a'; rr(ctx, -22, -66, 44, 38, 10); ctx.fill();
    const arm = Math.sin(t * 8) * 0.4;
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-18, -56); ctx.lineTo(-34, -84 + arm * 10); ctx.moveTo(18, -56); ctx.lineTo(30, -38); ctx.stroke();
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(-34, -86 + arm * 10, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0a10'; rr(ctx, -18, -100, 36, 34, 4); ctx.fill();
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 6; xx++) {
      const on = Math.sin(xx * 1.3 + yy * 0.9 + t * 6) > 0.2;
      ctx.fillStyle = on ? GLOW_COLS[(xx + yy + Math.floor(t * 3)) % 5] : '#1a1a24';
      ctx.fillRect(-15 + xx * 5.2, -96 + yy * 5.6, 4, 4);
    }
    ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(-20, -84, 6, 0, TAU); ctx.arc(20, -84, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -96, 22, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  },
  witch(ctx, b, t, d) {
    ctx.scale(d, 1);
    const fl = Math.sin(t * 2) * 4;
    ctx.fillStyle = 'rgba(200,170,255,0.25)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-24 + i * 12, -4 + Math.sin(t * 3 + i) * 2, 10, 0, TAU); ctx.fill(); }
    const g = ctx.createLinearGradient(0, -100, 0, 0); g.addColorStop(0, '#5a2a8a'); g.addColorStop(1, '#2a1048');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-30, -6 + fl * 0.3); ctx.quadraticCurveTo(-26, -60, -10, -78); ctx.lineTo(10, -78); ctx.quadraticCurveTo(26, -60, 30, -6 - fl * 0.3);
    for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(30 - i * 10 - 5, 2 + (i % 2) * 6, 30 - (i + 1) * 10, -6); ctx.fill();
    ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-18 + (i * 13) % 36, -60 + (i * 17) % 50, 1.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d8d8e8'; ctx.beginPath(); ctx.ellipse(-4, -84, 16, 18, 0, 0, TAU); ctx.fill(); // silver hair
    ctx.fillStyle = '#e8c4b0'; ctx.beginPath(); ctx.ellipse(4, -86, 10, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a2aaa'; ctx.beginPath(); ctx.arc(8, -88, 1.8, 0, TAU); ctx.arc(0, -88, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a2a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(4, -81, 3, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(4, -104, 9, 0.8, 5.4); ctx.fill(); ctx.fillStyle = '#d8d8e8'; ctx.beginPath(); ctx.arc(7, -106, 7.5, 0, TAU); ctx.fill(); // moon crown
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, -10); ctx.lineTo(30, -96); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(30, -100, 1, 30, -100, 18); cg.addColorStop(0, 'rgba(122,255,216,0.9)'); cg.addColorStop(1, 'rgba(122,255,216,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(30, -100, 18, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#7affd8'; ctx.beginPath(); ctx.moveTo(30, -110); ctx.lineTo(35, -100); ctx.lineTo(30, -92); ctx.lineTo(25, -100); ctx.fill();
  },
  dustdevil(ctx, b, t, d) {
    for (let i = 0; i < 18; i++) {
      const k = i / 18, w = 10 + k * 40, y = -k * 100;
      ctx.fillStyle = `rgba(${200 - k * 40},${180 - k * 40},${160 - k * 30},${0.35 + 0.25 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(Math.sin(t * 5 + i * 0.7) * 8 * k, y, w, 7, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#5a3a2a'; for (let i = 0; i < 6; i++) { const a = t * 6 + i; ctx.fillRect(Math.cos(a) * 34, -50 + Math.sin(a * 1.3) * 30, 3, 3); }
    ctx.scale(d, 1);
    ctx.fillStyle = '#7a2a1a'; ctx.beginPath(); ctx.moveTo(-14, -84); ctx.lineTo(-22, -104); ctx.lineTo(-6, -88); ctx.moveTo(14, -84); ctx.lineTo(22, -104); ctx.lineTo(6, -88); ctx.fill();
    ctx.save(); ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffd84a';
    ctx.beginPath(); ctx.ellipse(-8, -72, 5, 3, -0.3, 0, TAU); ctx.ellipse(10, -72, 5, 3, 0.3, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -60); ctx.quadraticCurveTo(0, -54, 12, -60); ctx.stroke();
  },
  guru(ctx, b, t, d) {
    ctx.scale(d, 1);
    const bob = Math.sin(t * 2) * 3;
    ctx.save(); ctx.translate(0, bob);
    ctx.fillStyle = '#c83a5a'; rr(ctx, -40, -14, 80, 14, 7); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(-40, -8, 80, 2);
    ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.ellipse(0, -18, 34, 12, 0, 0, TAU); ctx.fill(); // crossed legs
    ctx.beginPath(); ctx.moveTo(-24, -20); ctx.quadraticCurveTo(-26, -60, 0, -66); ctx.quadraticCurveTo(26, -60, 24, -20); ctx.fill();
    ctx.fillStyle = '#e8b07a'; ctx.beginPath(); ctx.ellipse(0, -76, 13, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(-11, -72); ctx.quadraticCurveTo(-14, -46, 0, -38); ctx.quadraticCurveTo(14, -46, 11, -72); ctx.quadraticCurveTo(0, -64, -11, -72); ctx.fill(); // long beard
    ctx.fillStyle = '#1a1018'; ctx.fillRect(-7, -79, 4, 1.6); ctx.fillRect(3, -79, 4, 1.6);
    ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -71, 3.6, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.save(); ctx.shadowColor = '#7aff6a'; ctx.shadowBlur = 8; ctx.fillStyle = '#7aff6a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, -86); ctx.restore();
    ctx.fillStyle = '#7a4a2a'; for (let i = 0; i < 12; i++) { const a = 0.4 + i / 11 * 2.4; ctx.beginPath(); ctx.arc(Math.cos(a) * 14, -58 + Math.sin(a) * 10, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f4e8d0'; rr(ctx, 22, -60, 30, 18, 2); ctx.fill(); ctx.fillStyle = '#c83a3a'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('NIRVANA', 37, -54); ctx.fillText('$999', 37, -47);
    ctx.restore();
  },
  bouncer(ctx, b, t, d) {
    this.shadow(ctx, 36); ctx.scale(d, 1);
    ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.ellipse(0, -40, 34, 40, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.fillStyle = '#2a2028'; ctx.beginPath(); ctx.arc(Math.cos(a) * 30, -40 + Math.sin(a) * 36, 7, 0, TAU); ctx.fill(); } // fur coat
    ctx.fillStyle = '#c89a7a'; ctx.beginPath(); ctx.arc(4, -86, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0a10'; rr(ctx, -6, -92, 22, 7, 3); ctx.fill();
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-2, -78, 14, 2.5);
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -88); ctx.quadraticCurveTo(-12, -78, -6, -74); ctx.stroke(); // earpiece
    ctx.fillStyle = '#f4f0e4'; rr(ctx, 18, -58, 18, 24, 2); ctx.fill(); ctx.fillStyle = '#c83a3a'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LIST', 27, -50);
    ctx.strokeStyle = '#a8102a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-60, -22); ctx.quadraticCurveTo(-46, -12, -32, -22); ctx.stroke();
    ctx.fillStyle = '#d8b25a'; ctx.fillRect(-62, -30, 4, 30);
  },
  triplord(ctx, b, t, d) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = `hsla(${(t * 80 + i * 60) % 360},100%,60%,0.35)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -64, 40 + i * 6 + Math.sin(t * 3 + i) * 3, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#f4eadc'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 7, -50); ctx.quadraticCurveTo(-20 + i * 10 + Math.sin(t * 3 + i) * 8, -24, -18 + i * 9, -4); ctx.stroke(); }
    const hue = (t * 60) % 360;
    ctx.fillStyle = `hsl(${hue},80%,55%)`; ctx.beginPath(); ctx.ellipse(0, -60, 40, 30, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -72, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = `hsl(${(hue + 180) % 360},90%,45%)`; ctx.beginPath(); ctx.arc(d * 4, -72, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(d * 5, -72, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-30 + i * 15, -70 - (i % 2) * 10, 3, 0, TAU); ctx.fill(); }
  },
  archivist(ctx, b, t, d) {
    this.shadow(ctx, 30); ctx.scale(d, 1);
    const g = ctx.createRadialGradient(-6, -56, 4, 0, -40, 40); g.addColorStop(0, '#a88ab8'); g.addColorStop(1, '#5a3a6a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -40, 30, 38, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8d8f0'; ctx.beginPath(); ctx.ellipse(4, -30, 16, 20, 0, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(4 + s * 10, -60, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff9ab0'; ctx.beginPath(); ctx.arc(6 + s * 10, -60, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6 + s * 10, -60, 2.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-6, -60, 10, 0, TAU); ctx.arc(14, -60, 10, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(2, -52); ctx.lineTo(8, -52); ctx.lineTo(5, -46); ctx.fill();
    ctx.fillStyle = '#2a2a32'; rr(ctx, 18, -36, 22, 14, 2); ctx.fill(); ctx.fillStyle = '#ff9ab0'; ctx.fillRect(20, -34, 18, 5);
  },
  barista(ctx, b, t, d) {
    this.shadow(ctx, 34); ctx.scale(d, 1);
    const g = ctx.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#6a6a76'); g.addColorStop(0.5, '#c8ccd8'); g.addColorStop(1, '#5a5a66');
    ctx.fillStyle = g; rr(ctx, -30, -76, 60, 70, 8); ctx.fill();
    ctx.fillStyle = '#1a1a22'; rr(ctx, -22, -66, 44, 20, 4); ctx.fill();
    ctx.save(); ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 8; ctx.fillStyle = '#ff3a3a'; ctx.fillRect(-14, -60, 10, 4); ctx.fillRect(6, -60, 10, 4); ctx.restore();
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, -40); ctx.lineTo(-46, -30); ctx.moveTo(30, -40); ctx.lineTo(46, -52); ctx.stroke();
    ctx.fillStyle = '#f4f0e4'; rr(ctx, 40, -64, 14, 14, 2); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(41, -62, 12, 4);
    for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i * 0.25) % 1; ctx.fillStyle = `rgba(240,240,250,${0.45 * (1 - k)})`; ctx.beginPath(); ctx.arc(-46 + Math.sin(k * 6) * 4, -32 - k * 30, 3 + k * 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#16131a'; ctx.fillRect(-12, -30, 24, 6);
  },
  mutant(ctx, b, t, d) {
    this.shadow(ctx, 44);
    drawArtCarSilhouette(ctx, 0, 0, 0.75, 'fish', d, t, true, '#ff4fd8');
    ctx.scale(d, 1);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(26, -30, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(28, -30, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(14 + i * 4, -18); ctx.lineTo(16 + i * 4, -12); ctx.lineTo(18 + i * 4, -18); ctx.fill(); }
  },
  pony(ctx, b, t, d) {
    // the Glitter Queen: a giant sparkle pony in a tiara
    this.shadow(ctx, 32);
    const rear = b.pose === 'rear' ? -0.35 : 0, dizzy = b.pose === 'dizzy';
    ctx.save(); ctx.rotate(rear * d); ctx.scale(3, 3); Sprites.hopper(ctx, 0, 0, t, '#ff7ad8', d, b.pose === 'gallop' && Math.sin(t * 16) > 0); ctx.restore();
    ctx.save(); ctx.translate(d * 8, -58); ctx.rotate(rear * d);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, -8); ctx.lineTo(-5, -3); ctx.lineTo(0, -11); ctx.lineTo(5, -3); ctx.lineTo(10, -8); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(0, -4, 2, 0, TAU); ctx.fill(); ctx.restore();
    if (dizzy) { ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(Math.cos(a) * 18, -80 + Math.sin(a) * 4, 3, 0, TAU); ctx.fill(); } }
  },
  greeter(ctx, b, t, d) {
    // the Head Greeter: a huge hug in a hawaiian shirt, ringing the welcome bell
    this.shadow(ctx, 36);
    const pose = b.pose || 'walk';
    if (pose === 'angel') {
      // flat on his back in the dust, flapping out a dust angel
      const k = Math.sin(t * 8);
      ctx.fillStyle = 'rgba(232,216,192,0.5)'; ctx.beginPath(); ctx.ellipse(0, -6, 56, 12, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#c98c62'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(-30, -20 - k * 10); ctx.moveTo(14, -12); ctx.lineTo(30, -20 + k * 10); ctx.moveTo(-10, -8); ctx.lineTo(-34, -4 + k * 6); ctx.moveTo(10, -8); ctx.lineTo(34, -4 - k * 6); ctx.stroke();
      ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.ellipse(0, -14, 26, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff7a5a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-16 + i * 6, -14 + (i % 2) * 6, 2.6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#c98c62'; ctx.beginPath(); ctx.arc(30, -14, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1018'; ctx.fillRect(28, -18, 2, 2); ctx.fillRect(33, -18, 2, 2);
      ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(32, -12, 4, 0.2, Math.PI - 0.2); ctx.stroke();
      return;
    }
    ctx.scale(d, 1);
    const st = Math.sin(t * 8) * (b.vx ? 1 : 0);
    ctx.fillStyle = '#3a5a8a'; rr(ctx, -20 + st * 2, -22, 15, 22, 5); ctx.fill(); rr(ctx, 5 - st * 2, -22, 15, 22, 5); ctx.fill();
    ctx.fillStyle = '#ffd8a0'; rr(ctx, -26, -66, 52, 48, 16); ctx.fill();
    ctx.fillStyle = '#ff7a5a'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-20 + (i * 13) % 40, -60 + (i * 11) % 40, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7ad86a'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-14 + (i * 17) % 30, -54 + (i * 7) % 30, 2, 0, TAU); ctx.fill(); }
    // arms: wide open, or wrapping round
    const open = pose === 'hug' ? 0.2 : pose === 'arms' ? 1.3 : 1;
    ctx.strokeStyle = '#c98c62'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -56); ctx.lineTo(-22 - 24 * open, -70 + (1 - open) * 26); ctx.moveTo(22, -56); ctx.lineTo(22 + 24 * open, -70 + (1 - open) * 26); ctx.stroke();
    // the welcome bell
    if (pose === 'bell' || pose === 'bellup') {
      const up = pose === 'bellup' ? -16 : Math.sin(t * 30) * 4;
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(46, -70); ctx.lineTo(46, -112 + up); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(30, -100 + up); ctx.quadraticCurveTo(32, -128 + up, 46, -130 + up); ctx.quadraticCurveTo(60, -128 + up, 62, -100 + up); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a8761a'; ctx.beginPath(); ctx.arc(46, -98 + up, 4, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#c98c62'; ctx.beginPath(); ctx.arc(4, -76, 15, 0, TAU); ctx.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI * 0.1 + i / 8 * Math.PI * 0.8; ctx.fillStyle = ['#ff5a9a', '#ffd84a', '#ff9a3a'][i % 3]; ctx.beginPath(); ctx.arc(Math.cos(a) * 22, -64 + Math.sin(a) * 6, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8d0a0'; ctx.beginPath(); ctx.ellipse(4, -88, 24, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(4, -90, 13, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ff5a9a'; ctx.fillRect(-9, -92, 26, 3);
    this.eyes(ctx, 6, -78, 3.6, 1);
    ctx.fillStyle = '#5a1a1a'; ctx.beginPath(); ctx.arc(8, -70, 7, 0.1, Math.PI - 0.1); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(3, -70, 10, 2.4);
    ctx.fillStyle = '#ffffff'; rr(ctx, -24, -46, 48, 9, 3); ctx.fill(); ctx.fillStyle = '#c83a5a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('WELCOME HOME', 0, -39.5);
  },
  camplead(ctx, b, t, d) {
    this.shadow(ctx, 30);
    ctx.save(); ctx.scale(2.3, 2.3);
    BurnerArt.camplead(ctx, 0, 0, b.vx ? t * 1.5 : 0, d, b.pose === 'charge' ? 'charge' : b.pose === 'yell' ? 'yell' : b.pose === 'notice' ? 'notice' : 'walk', { seed: 1 });
    ctx.restore();
    if (b.pose === 'dazed') { ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(Math.cos(a) * 18, -84 + Math.sin(a) * 4, 3, 0, TAU); ctx.fill(); } }
  },
  forklift(ctx, b, t, d) {
    // Forklift Frank and his beloved forklift
    this.shadow(ctx, 44); ctx.scale(d, 1);
    const fix = b.pose === 'fix';
    const forkY = b.pose === 'lift' ? -54 : -10;
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(28, -64, 5, 64); ctx.fillRect(36, -64, 5, 64);
    ctx.fillStyle = '#9a9aa6'; ctx.fillRect(28, forkY - 2, 30, 5); ctx.fillRect(28, forkY - 12, 5, 12);
    ctx.fillStyle = '#f2c23a'; rr(ctx, -40, -40, 70, 32, 6); ctx.fill();
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(-36, -66, 4, 28); ctx.fillRect(14, -66, 4, 28); ctx.fillRect(-38, -68, 58, 4);
    ctx.fillStyle = '#1a1a22'; for (const wx of [-26, 18]) { ctx.beginPath(); ctx.arc(wx, -8, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.arc(wx, -8, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a22'; }
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(-34, -70 + (Math.floor(t * 4) % 2) * 2, 3, 0, TAU); ctx.fill();
    if (!fix) {
      ctx.save(); ctx.translate(-10, -40); ctx.scale(1.6, 1.6); BurnerArt.dpw(ctx, 0, 0, 0, 1, 'walk', { hat: true }); ctx.restore();
    } else {
      ctx.save(); ctx.translate(-56, 0); ctx.scale(1.6, 1.6); BurnerArt.dpw(ctx, 0, 0, t, 1, 'walk', { hat: true }); ctx.restore();
      ctx.fillStyle = 'rgba(230,230,240,0.6)'; for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; ctx.beginPath(); ctx.arc(-10 + i * 10, -44 - k * 30, 5 + k * 8, 0, TAU); ctx.fill(); }
    }
    if (b.pose === 'charge') { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-46 - i * 6, -20 - i * 10); ctx.lineTo(-70 - i * 6, -20 - i * 10); ctx.stroke(); } }
  },
  rusty(ctx, b, t, d) {
    // DPW Foreman Rusty: hard hat plastered in stickers, radio, a rebar longer than you
    this.shadow(ctx, 36); ctx.scale(d, 1);
    const pose = b.pose || 'walk';
    const st = Math.sin(t * 8) * (b.vx ? 1 : 0);
    ctx.fillStyle = '#5a3a1a'; rr(ctx, -20 + st * 2, -20, 14, 20, 4); ctx.fill(); rr(ctx, 6 - st * 2, -20, 14, 20, 4); ctx.fill();
    const g = ctx.createLinearGradient(-32, 0, 32, 0); g.addColorStop(0, '#a8581a'); g.addColorStop(0.5, '#e8822e'); g.addColorStop(1, '#a8581a');
    ctx.fillStyle = g; rr(ctx, -32, -70, 64, 54, 18); ctx.fill();
    ctx.fillStyle = '#d8ff3a'; ctx.fillRect(-32, -50, 64, 5); ctx.fillRect(-6, -70, 5, 54); // hi-vis
    ctx.fillStyle = 'rgba(230,210,170,0.4)'; ctx.fillRect(-32, -28, 64, 10);
    // the rebar
    const ra = pose === 'windup' ? -2.4 : pose === 'sweep' ? 0.05 + Math.sin(t * 30) * 0.05 : -0.9;
    ctx.save(); ctx.translate(26, -50); ctx.rotate(ra);
    ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(118, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,10,0.6)'; ctx.lineWidth = 1; for (let k = 6; k < 118; k += 6) { ctx.beginPath(); ctx.moveTo(k, -2.4); ctx.lineTo(k + 2, 2.4); ctx.stroke(); }
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(118, 0, 5, 0, TAU); ctx.fill(); // safety cap (ironic)
    ctx.restore();
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(26, -50, 7, 0, TAU); ctx.fill();
    if (pose === 'radio') { ctx.fillStyle = '#1a1a22'; rr(ctx, -40, -84, 9, 16, 2); ctx.fill(); ctx.fillRect(-37, -92, 2, 8); ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(-34, -72, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.ellipse(4, -80, 18, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8481a'; ctx.beginPath(); ctx.ellipse(6, -70, 16, 6, 0, 0, Math.PI); ctx.fill(); // red beard
    ctx.fillStyle = '#16131a'; rr(ctx, -6, -86, 12, 6, 2); ctx.fill(); rr(ctx, 9, -86, 12, 6, 2); ctx.fill(); ctx.fillRect(4, -84, 6, 1.6);
    ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.ellipse(4, -93, 21, 13, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-20, -94, 48, 4);
    for (const [sx2, sy2, c] of [[-8, -100, '#ff4fd8'], [6, -103, '#38c8ff'], [16, -98, '#7aff6a'], [-2, -96, '#ffffff']]) { ctx.fillStyle = c; ctx.fillRect(sx2, sy2, 6, 4); }
    if (pose === 'radio') { ctx.fillStyle = '#3a1010'; ctx.beginPath(); ctx.ellipse(10, -72, 5, 4, 0, 0, TAU); ctx.fill(); }
  }
};

/* ---------------- THE MAN ---------------- */
// an original design: a tall wooden lattice figure with raised arms and a glowing diamond head
const ManArt = {
  figure(ctx, x, y, s, t, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const wood = '#c89a6a', dark = '#8a5a3a', glow = o.charge ? 0.4 + o.charge * 0.6 : 0.5 + 0.2 * Math.sin(t * 3);
    const lean = o.lean || 0, kneel = o.kneel || 0;
    // legs: lattice beams
    const hipY = -48 * (1 - kneel * 0.45);
    ctx.strokeStyle = wood; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-6, hipY); ctx.moveTo(12, 0); ctx.lineTo(6, hipY); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) { const yy = hipY * (k + 0.5) / 4; ctx.beginPath(); ctx.moveTo(-12 + 6 * (k + 0.5) / 4, yy); ctx.lineTo(12 - 6 * (k + 0.5) / 4, yy - 8); ctx.stroke(); }
    ctx.translate(0, hipY); ctx.rotate(-lean);
    // torso lattice
    ctx.strokeStyle = wood; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-9, -36); ctx.moveTo(7, 0); ctx.lineTo(9, -36); ctx.moveTo(-10, -36); ctx.lineTo(10, -36); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-8, -k * 9); ctx.lineTo(8, -k * 9 - 9); ctx.moveTo(8, -k * 9); ctx.lineTo(-8, -k * 9 - 9); ctx.stroke(); }
    // arms raised in a V
    const armA = o.arms ? 0.15 * Math.sin(t * 6) : 0;
    ctx.strokeStyle = wood; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-9, -34); ctx.lineTo(-30, -62 + armA * 20); ctx.moveTo(9, -34); ctx.lineTo(30, -62 - armA * 20); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(-24, -50); ctx.moveTo(14, -40); ctx.lineTo(24, -50); ctx.stroke();
    if (o.cage) { // Chinka's cage dangles from his left hand
      ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-30, -62); ctx.lineTo(-30, -52); ctx.stroke();
      ctx.save(); ctx.translate(-30, -30); ctx.scale(0.36 / s * 2.4, 0.36 / s * 2.4); drawChinka(ctx, { x: 0, y: 0, scale: 1, t, pose: 'captive', facing: 1 }); ctx.restore();
      ctx.strokeStyle = '#ffd8a0'; ctx.lineWidth = 1.2; ctx.strokeRect(-38, -52, 16, 22); for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-38 + i * 4, -52); ctx.lineTo(-38 + i * 4, -30); ctx.stroke(); }
    }
    // the diamond head, glowing
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createRadialGradient(0, -52, 2, 0, -52, 30 + (o.charge || 0) * 40); hg.addColorStop(0, `rgba(255,240,170,${glow})`); hg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = hg; ctx.fillRect(-70, -122, 140, 140); ctx.restore();
    ctx.fillStyle = o.charge > 0.7 && Math.floor(t * 20) % 2 ? '#ffffff' : '#ffe8a0';
    ctx.beginPath(); ctx.moveTo(0, -66); ctx.lineTo(-9, -52); ctx.lineTo(0, -38); ctx.lineTo(9, -52); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = o.lit ? '#38f2ff' : dark; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -52); ctx.lineTo(9, -52); ctx.moveTo(0, -66); ctx.lineTo(0, -38); ctx.stroke();
    if (o.fire) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,${120 + i * 25},40,${0.6 - i * 0.08})`; ctx.beginPath(); ctx.ellipse(-12 - i * 7, -50 + Math.sin(t * 30 + i) * 2, 6 + i * 2, 4 + i, 0, 0, TAU); ctx.fill(); } ctx.restore(); }
    if (o.angry) { ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(-3, -53, 1.6, 0, TAU); ctx.arc(3, -53, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  saucer(ctx, cx, y, t, crash) {
    const w = 5 * TS;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, y + 20, 4, cx, y + 30, 90); g.addColorStop(0, 'rgba(56,242,255,0.35)'); g.addColorStop(1, 'rgba(56,242,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 90, y - 20, 180, 140); ctx.restore();
    ctx.fillStyle = '#3a3448'; ctx.beginPath(); ctx.ellipse(cx, y + 8, w / 2 + 6, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a5470'; ctx.beginPath(); ctx.ellipse(cx, y + 4, w / 2, 7, 0, Math.PI, TAU); ctx.fill();
    for (let i = 0; i < 10; i++) { ctx.fillStyle = (i + Math.floor(t * 8)) % 2 ? '#38f2ff' : '#ff4fd8'; ctx.beginPath(); ctx.arc(cx - w / 2 + 4 + i * (w - 8) / 9, y + 11, 2.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c89a6a'; ctx.fillRect(cx - w / 2 + 6, y - 1, w - 12, 3); // plank deck
    if (crash) { ctx.fillStyle = 'rgba(80,80,90,0.6)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx - 20 + i * 14, y - 6 - (t * 40 + i * 9) % 30, 6, 0, TAU); ctx.fill(); } }
  },
  draw(ctx, b, t) {
    if (b.phase === 1 || b.state !== 'fight' && b.phase !== 2) {
      const crouch = b.pose === 'crouch';
      this.figure(ctx, b.x + b.w / 2, b.y + b.h + (crouch ? 0 : 0), 1, t, { lit: true, arms: b.pose === 'arms' || b.pose === 'throw', kneel: crouch ? 0.6 : 0, angry: b.hurtT > 0 });
      // Chinka's cage rides on the saucer deck beside him
      if (b.saucer && !b.saucer.dead) { const sx = b.saucer.x + b.saucer.w - 22, sy = b.saucer.y; ctx.save(); ctx.translate(sx, sy); ctx.scale(0.55, 0.55); drawChinka(ctx, { x: 0, y: 0, scale: 1, t, pose: 'captive', facing: -1 }); ctx.restore(); ctx.strokeStyle = '#ffd8a0'; ctx.lineWidth = 1.2; ctx.strokeRect(sx - 12, sy - 34, 24, 34); for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx - 12 + i * 6, sy - 34); ctx.lineTo(sx - 12 + i * 6, sy); ctx.stroke(); } }
      if (b.hurtT > 0 && Math.floor(b.hurtT * 20) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20); }
      return;
    }
    // phase 2: the giant
    const sc = 1 + (b.giant || 0) * 1.4;
    const footX = b.arenaX1 - 4 * TS, H = b.floorY;
    const lean = (b.lean || 0) * 1.2;
    this.figure(ctx, footX, H, sc, t, { lit: true, lean, kneel: b.lean || 0, cage: true, charge: b.act === 'neon' ? b.charge : 0, fire: b.act === 'facefire' && b.at > 0.4 && b.at < 1.8, arms: b.act === 'fireworks', angry: b.hurtT > 0 });
    if (b.act === 'neon' && b.charge > 0) { ctx.fillStyle = '#ffffff'; ctx.font = `16px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(b.charge < 1 ? 'HIDE! ' + Math.max(1, Math.ceil((1.9 - b.at) / 0.63)) : '', b.headX - 40, b.headY - 60); }
    if (b.act === 'grow') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,160,${0.3 * Math.sin(t * 30) + 0.3})`; ctx.beginPath(); ctx.arc(footX, H - 100 * sc, 60 * sc, 0, TAU); ctx.fill(); ctx.restore(); }
  }
};

/* Portraits for menus (and the kart racer if it wants them) */
const CharArt = {
  ids: ['brady', 'chinka', 'slothy', 'toadie', 'theman', 'hippie', 'techbro', 'dpw'],
  drawPortrait(ctx, id, x, y, size, t) {
    ctx.save(); ctx.translate(x, y);
    const s = size / 64;
    switch (id) {
      case 'brady': ctx.scale(s * 1.05, s * 1.05); drawBrady(ctx, { x: 0, y: 30, facing: 1, small: false, power: 0, anim: { state: 'idle', t, phase: 0 }, hair: null, look: Save.data.look, time: t }); break;
      case 'chinka': ctx.scale(s * 1.05, s * 1.05); drawChinka(ctx, { x: 0, y: 30, facing: 1, t, pose: 'wave' }); break;
      case 'slothy': ctx.scale(s * 0.95, s * 0.95); drawSlothy(ctx, { x: -6, y: 22, facing: 1, t, pose: 'idle' }); break;
      case 'toadie': ctx.scale(s * 1.6, s * 1.6); Sprites.toad(ctx, 0, 14, t, { hop: true }); break;
      case 'theman': case 'man': ctx.scale(s * 0.42, s * 0.42); ManArt.figure(ctx, 0, 70, 1, t, { lit: true }); break;
      case 'hippie': ctx.scale(s * 1.7, s * 1.7); Sprites.glump(ctx, 0, 16, t, '#ff4fd8', 1, 0, false); break;
      case 'techbro': ctx.scale(s * 1.6, s * 1.6); Sprites.rollo(ctx, 0, 16, t, '#38f2ff', 1, false, 0); break;
      case 'dpw': ctx.scale(s * 1.7, s * 1.7); Sprites.spiker(ctx, 0, 16, t, '#ff8a1a', 1); break;
    }
    ctx.restore();
  }
};
