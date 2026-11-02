/* ============================================================
   Art for gimmicks, moving-platform skins, doors and set-piece
   props (RVs, sculptures, griddles, fuel tanks, saucer, pages...).
   Props are decor entries with a width/height drawn over hidden
   collision tiles: d.x = centre, d.y = bottom, d.w/d.h in px.
   ============================================================ */
const GimmickArt = {
  geyser(ctx, g, t) {
    const x = g.cx, y = g.y + g.h;
    const gr = ctx.createLinearGradient(0, g.y, 0, y); gr.addColorStop(0, '#f0b080'); gr.addColorStop(1, '#a8603a');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(g.x, y); ctx.quadraticCurveTo(g.x + 8, g.y + 6, x - 10, g.y + 2); ctx.lineTo(x + 10, g.y + 2); ctx.quadraticCurveTo(g.x + g.w - 8, g.y + 6, g.x + g.w, y); ctx.fill();
    ctx.fillStyle = '#3a8aa8'; ctx.beginPath(); ctx.ellipse(x, g.y + 3, 9, 3, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.4)'; ctx.lineWidth = 1.2; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(g.x + k * 6, y - k * 8); ctx.quadraticCurveTo(x, y - k * 8 - 4, g.x + g.w - k * 6, y - k * 8); ctx.stroke(); }
    if (g.stage === 'warn') for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(220,250,255,0.8)'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 20 + i * 2) * 6, g.y - 2 - ((t * 30 + i * 6) % 14), 2.4, 0, TAU); ctx.fill(); }
    if (g.stage === 'erupt') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const yy = g.y - i * 26, w = 12 + i * 2 + Math.sin(t * 20 + i) * 3; ctx.fillStyle = `rgba(200,245,255,${0.5 - i * 0.05})`; ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 13 + i) * 3, yy, w, 18, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  },
  geyserBurst(ctx, g, t) {
    const x = g.cx, y = g.y + g.h;
    if (g.k < 0.8) { for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(220,250,255,0.85)'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 20 + i * 2) * 14, y - 4 - ((t * 40 + i * 5) % 12), 3, 0, TAU); ctx.fill(); } return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { const yy = y - i * 24, w = 14 + Math.sin(t * 20 + i) * 4; ctx.fillStyle = `rgba(190,245,255,${0.55 - i * 0.05})`; ctx.beginPath(); ctx.ellipse(x, yy, w, 18, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  pancake(ctx, p, t) {
    const x = p.cx, y = p.y + p.h;
    const lift = p.flipT > 0 ? Math.sin((0.7 - p.flipT) / 0.7 * Math.PI) * 40 : 0;
    for (let i = 0; i < 2; i++) { ctx.fillStyle = i ? '#e8a85a' : '#d8944a'; ctx.beginPath(); ctx.ellipse(x, y - 5 - i * 8, 28, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f8d090'; ctx.beginPath(); ctx.ellipse(x, y - 7 - i * 8, 25, 4, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(x, y - 24 - lift); if (p.flipT > 0) ctx.rotate((0.7 - p.flipT) / 0.7 * Math.PI * 2);
    ctx.fillStyle = '#e8a85a'; ctx.beginPath(); ctx.ellipse(0, 0, 28, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f8d090'; ctx.beginPath(); ctx.ellipse(0, -2, 25, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff6c0'; rr(ctx, -5, -6, 10, 4, 1.5); ctx.fill(); // butter
    ctx.restore();
    if (p.warn) { ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('FLIP!', x, p.y - 12); }
  },
  bubbler(ctx, b, t) {
    const x = b.cx, y = b.y + b.h;
    ctx.fillStyle = '#ff7ad8'; rr(ctx, x - 14, y - 16, 28, 16, 5); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y - 18, 7, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 22, 5, 0, TAU); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = GLOW_COLS[(i + Math.floor(t * 3)) % 5]; ctx.beginPath(); ctx.arc(x - 8 + i * 8, y - 8, 2, 0, TAU); ctx.fill(); }
  },
  bubble(ctx, b, t) {
    const x = b.cx, y = b.y + 2, r = b.r;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.5, 2, x, y - r * 0.3, r * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.6, `hsla(${(t * 60 + b.x) % 360},90%,75%,0.18)`); g.addColorStop(1, 'rgba(180,220,255,0.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 1.25, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `hsla(${(t * 90 + b.x) % 360},90%,80%,0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x - r * 0.5, y - r * 1.0, r * 0.25, r * 0.12, -0.6, 0, TAU); ctx.fill();
  },
  rolling(ctx, r, t) {
    ctx.save(); ctx.translate(r.cx, r.cy); ctx.rotate(r.spinA);
    if (r.boulder) {
      ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr2 = 19 + ((i * 7) % 3) * 1.4; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,190,0.25)'; ctx.beginPath(); ctx.arc(-5, -6, 7, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(6, 5, 5, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = '#a8804a'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 9, a, a + 2.4); ctx.stroke(); }
      ctx.strokeStyle = '#c8a060'; for (let i = 0; i < 6; i++) { const a = i * 1.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a + 2.5) * 10, Math.sin(a + 2.5) * 10); ctx.stroke(); }
    }
    ctx.restore();
  },
  barrelShape(ctx, x, y, lit) {
    const g = ctx.createLinearGradient(x, 0, x + 26, 0); g.addColorStop(0, '#8a1a1a'); g.addColorStop(0.5, lit ? '#ff5a3a' : '#d83a2a'); g.addColorStop(1, '#7a1414');
    ctx.fillStyle = g; rr(ctx, x, y, 26, 28, 4); ctx.fill();
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y + 7, 26, 2); ctx.fillRect(x, y + 19, 26, 2);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x + 13, y + 10); ctx.lineTo(x + 18, y + 17); ctx.lineTo(x + 8, y + 17); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x + 13, y + 16.5);
  },
  barrel(ctx, b, t) {
    const lit = b.fuse > 0 && Math.sin(t * (12 + (1.5 - b.fuse) * 30)) > 0;
    this.barrelShape(ctx, b.x, b.y + 2, lit);
    if (b.fuse > 0) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(b.cx + 6, b.y - 2, 2 + Math.random() * 2, 0, TAU); ctx.fill(); }
  },
  laser(ctx, l, t) {
    const x = l.cx;
    ctx.fillStyle = '#2a2a34'; rr(ctx, x - 7, l.y - 6, 14, 8, 2); ctx.fill(); rr(ctx, x - 7, l.y + l.h - 4, 14, 6, 2); ctx.fill();
    if (l.on) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0); g.addColorStop(0, 'rgba(255,60,200,0)'); g.addColorStop(0.5, 'rgba(255,90,220,0.9)'); g.addColorStop(1, 'rgba(255,60,200,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 8, l.y, 16, l.h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x - 1, l.y, 2, l.h);
      ctx.restore();
    } else if (l.warn) { ctx.strokeStyle = `rgba(255,90,220,${0.3 + 0.3 * Math.sin(t * 40)})`; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, l.y); ctx.lineTo(x, l.y + l.h); ctx.stroke(); ctx.setLineDash([]); }
  },
  sweeper(ctx, s, t) {
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(s.ox, s.oy, 8, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(56,242,255,0.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(s.ox, s.oy); ctx.lineTo(s.ox + Math.cos(s.a) * s.len, s.oy + Math.sin(s.a) * s.len); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,255,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  },
  subwoofer(ctx, s, t) {
    const cx = s.cx, k = s.pulse;
    for (let i = 0; i < 2; i++) { const cy = s.y + 22 + i * 46; ctx.fillStyle = '#0a0a10'; ctx.beginPath(); ctx.arc(cx, cy, 18 + k * 3, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4a56'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(cx, cy, 7 + k * 2, 0, TAU); ctx.fill(); }
    if (k > 0.1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,79,216,${k * 0.6})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, s.y + 45, 30 + (1 - k) * 30, 0, TAU); ctx.stroke(); ctx.restore(); }
  },
  honk(ctx, h, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const k = (t * 2.5 + i / 4) % 1; ctx.strokeStyle = `rgba(255,220,120,${0.5 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.ox + 10, h.oy - 40, 10 + k * h.len * 0.8, Math.PI * 0.82, Math.PI * 1.18); ctx.stroke(); }
    ctx.restore();
  },
  poiring(ctx, r, t) {
    ctx.strokeStyle = 'rgba(200,200,210,0.5)'; ctx.lineWidth = 1;
    for (let k = 0; k < r.arms; k++) { const a = r.a + k / r.arms * TAU; ctx.beginPath(); ctx.moveTo(r.ox, r.oy); ctx.lineTo(r.ox + Math.cos(a) * r.len * 15, r.oy + Math.sin(a) * r.len * 15); ctx.stroke(); }
    for (const [x, y, end] of r.orbs()) Sprites.ember(ctx, x, y, end ? 8 : 5, t);
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.arc(r.ox, r.oy, 4, 0, TAU); ctx.fill();
  },
  keyShape(ctx, x, y, silver) {
    ctx.fillStyle = silver ? '#e8f0ff' : '#ffd84a'; ctx.strokeStyle = silver ? '#8a9ab8' : '#a8761a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y - 10, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = silver ? '#c8d8f0' : '#a8761a'; ctx.beginPath(); ctx.arc(x, y - 10, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = silver ? '#e8f0ff' : '#ffd84a'; ctx.fillRect(x - 1.6, y - 4, 3.2, 14); ctx.fillRect(x + 1.6, y + 4, 4, 2.5); ctx.fillRect(x + 1.6, y + 7.5, 3, 2.5);
  },
  key(ctx, k, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(k.cx, k.cy, 2, k.cx, k.cy, 26); g.addColorStop(0, k.silver ? 'rgba(220,235,255,0.5)' : 'rgba(255,220,100,0.5)'); g.addColorStop(1, 'rgba(255,220,100,0)'); ctx.fillStyle = g; ctx.fillRect(k.cx - 26, k.cy - 26, 52, 52); ctx.restore();
    ctx.save(); ctx.translate(k.cx, k.cy + 4); ctx.rotate(Math.sin(t * 2) * 0.2); this.keyShape(ctx, 0, 0, k.silver); ctx.restore();
  },
  lock(ctx, l, t) {
    const x = l.x + 6, y = l.y, w = TS, h = l.h;
    if (l.lookName === 'vip') {
      // a VIP velvet-rope gate between brass posts
      ctx.fillStyle = '#c8a03a'; ctx.fillRect(x + 2, y, 5, h); ctx.fillRect(x + w - 7, y, 5, h);
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 4.5, y, 4, 0, TAU); ctx.arc(x + w - 4.5, y, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#a8102a'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 5, y + 14 + i * 26); ctx.quadraticCurveTo(x + w / 2, y + 26 + i * 26, x + w - 5, y + 14 + i * 26); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VIP', x + w / 2, y + h / 2 + 2);
    } else {
      ctx.fillStyle = '#6a4a2a'; rr(ctx, x, y, w, h, 3); ctx.fill();
      ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 4, y + 6, w - 8, h / 2 - 8); ctx.strokeRect(x + 4, y + h / 2 + 2, w - 8, h / 2 - 8);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 - 1, 1.6, 0, TAU); ctx.fill(); ctx.fillRect(x + w / 2 - 0.8, y + h / 2, 1.6, 3);
    }
    if (l.open) { ctx.fillStyle = `rgba(255,255,255,${l.openT || 0})`; ctx.fillRect(x, y, w, h); }
  },
  lamp(ctx, l, t) {
    const x = l.cx, y = l.y + l.h;
    ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 2, y - 76, 4, 76); ctx.fillRect(x - 6, y - 4, 12, 4);
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 74); ctx.quadraticCurveTo(x + 10, y - 82, x + 14, y - 72); ctx.stroke();
    ctx.fillStyle = l.lit ? '#ffd890' : '#5a4a3a'; rr(ctx, x + 9, y - 72, 10, 13, 3); ctx.fill();
    if (l.lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x + 14, y - 66, 1, x + 14, y - 66, 34); g.addColorStop(0, 'rgba(255,210,120,0.8)'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 20, y - 100, 68, 68); ctx.restore(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LIGHT ME', x + 14, y - 80 + Math.sin(t * 4) * 1.5); }
  },
  flashtrap(ctx, f, t) {
    const x = f.cx, y = f.y;
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 14, y - 40); ctx.lineTo(x - 14, y); ctx.moveTo(x + 14, y - 40); ctx.lineTo(x + 14, y); ctx.stroke();
    ctx.fillStyle = '#0e0a16'; rr(ctx, f.x, y, f.w, f.h, 5); ctx.fill();
    const col = f.stage === 'count' ? '#ff4fd8' : '#38f2ff';
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = f.stage === 'idle' ? 6 : 14; ctx.strokeStyle = col; ctx.lineWidth = 2; rr(ctx, f.x + 2, y + 2, f.w - 4, f.h - 4, 4); ctx.stroke();
    ctx.fillStyle = col; ctx.font = `${f.stage === 'count' ? 16 : 8}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.stage === 'count' ? String(Math.max(1, f.count)) : 'NEON', x, y + f.h / 2 + 1);
    ctx.restore();
    if (f.stage === 'count') { ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HIDE!', x, y + f.h + 12); }
  },
  vent(ctx, v, t) {
    const look = v.lookName;
    const base = { steam: '#8a6a5a', port: '#1a1a22', mist: '#c8c8d0', thermal: null, bubbles: '#8a5a3a' }[look];
    if (base) { ctx.fillStyle = base; rr(ctx, v.x + 2, v.y, v.w - 4, 10, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(v.x + 6, v.y + 2, v.w - 12, 3); }
    for (const q of v.puffs) {
      const k = q.life / 1.4;
      if (look === 'bubbles') { ctx.strokeStyle = `rgba(220,250,255,${k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + (1 - k) * 3, 0, TAU); ctx.stroke(); }
      else if (look === 'port' || look === 'thermal') { ctx.strokeStyle = look === 'port' ? `rgba(255,79,216,${0.4 * k})` : `rgba(255,220,160,${0.35 * k})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x, q.y - 14); ctx.stroke(); }
      else { ctx.fillStyle = `rgba(245,245,250,${0.35 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, 6 + (1 - k) * 12, 0, TAU); ctx.fill(); }
    }
  },
  dropper(ctx, d, t) {
    const sx = d.shake ? Math.sin(t * 60) * 1.5 : 0;
    ctx.fillStyle = '#5a3e2a'; ctx.fillRect(d.x - 6, d.y, d.w + 12, 6);
    ctx.fillStyle = '#8a3a4a'; rr(ctx, d.x + 2 + sx, d.y + 6, d.w - 4, d.h - 6, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(d.x + 5 + sx, d.y + 10, d.w - 10, 2);
  },
  banner(ctx, b, t) {
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b.x, b.y - 90); ctx.lineTo(b.x, b.y); ctx.moveTo(b.x + b.w, b.y - 90); ctx.lineTo(b.x + b.w, b.y); ctx.stroke();
    const wave = Math.sin(t * 4) * 2;
    ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + b.h + wave); for (let i = 6; i >= 0; i--) ctx.lineTo(b.x + b.w * i / 6, b.y + b.h - (i % 2) * 5 - wave); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('DUCK!', b.cx, b.y + b.h / 2);
  },
  discoball(ctx, d, t) {
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(d.ax, d.ay); ctx.lineTo(d.bx, d.by); ctx.stroke();
    Sprites.eclipse(ctx, d.bx, d.by, t);
  }
};

/* ---------- moving-platform skins ---------- */
const PlatformArt = {
  deck(ctx, x, y, w, col, trim) { ctx.fillStyle = col; rr(ctx, x, y, w, 8, 3); ctx.fill(); ctx.fillStyle = trim || 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, y + 1, w - 6, 1.5); },
  rv(ctx, p, t) {
    // an RV in the convoy: the roof is the platform
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#f2f0e9'; rr(ctx, x - 4, y, w + 8, 52, 8); ctx.fill();
    ctx.fillStyle = '#c8bfae'; ctx.fillRect(x - 4, y + 30, w + 8, 4);
    ctx.fillStyle = ['#3a78d4', '#c43c5c', '#2e8b57', '#d68a1f'][Math.floor(Math.abs(p.hx) / 97) % 4]; ctx.fillRect(x - 4, y + 22, w + 8, 5);
    ctx.fillStyle = '#2a3a4a'; for (let i = 0; i < Math.floor(w / 26); i++) rr(ctx, x + 6 + i * 26, y + 9, 18, 10, 2), ctx.fill();
    ctx.fillStyle = '#1a1a22'; for (const wx of [x + 10, x + w - 10]) { ctx.beginPath(); ctx.arc(wx, y + 52, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a6a76'; ctx.beginPath(); ctx.arc(wx, y + 52, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a22'; }
    ctx.fillStyle = 'rgba(230,210,170,0.5)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + w + 8 + i * 6 - (t * 30 % 6), y + 52 - i * 2, 4 + i * 2, 0, TAU); ctx.fill(); }
    this.deck(ctx, x - 2, y - 2, w + 4, '#d8d0c0');
  },
  cup(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 10, y + 40); ctx.lineTo(x + 10, y + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f4f0e4'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + w + 2, y + 16, 9, -1.3, 1.3); ctx.stroke();
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x + 6, y + 14, w - 12, 6);
    ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.ellipse(cx, y + 2, w / 2 - 2, 4, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 8 + i * 8, y - 2 - k * 20); ctx.quadraticCurveTo(cx - 4 + i * 8, y - 8 - k * 20, cx - 8 + i * 8, y - 14 - k * 20); ctx.stroke(); }
  },
  trapeze(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1.4;
    const ax = p.ancX, ay = p.ancY - 6 * TS;
    ctx.beginPath(); ctx.moveTo(p.ancX - 10, p.ancY); ctx.lineTo(x + 6, y); ctx.moveTo(p.ancX + 10, p.ancY); ctx.lineTo(x + w - 6, y); ctx.stroke();
    ctx.fillStyle = '#c8282a'; rr(ctx, x, y, w, 7, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; for (let i = 0; i < w; i += 12) ctx.fillRect(x + i + 3, y + 1, 5, 5);
  },
  acro(ctx, p, t) {
    // a flyer balanced on her base's feet; her back is the platform, she tips when you linger
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    const tilt = p.tiltT > 1.3 ? p.tiltDir * Math.min(0.3, (p.tiltT - 1.3) * 0.4) : 0;
    const groundY = p.hy + 14 + 30;
    ctx.strokeStyle = '#c98c62'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 6, groundY); ctx.lineTo(cx - 4, y + 12); ctx.moveTo(cx + 6, groundY); ctx.lineTo(cx + 4, y + 12); ctx.stroke(); // base's legs up
    ctx.fillStyle = '#7ad86a'; rr(ctx, cx - 14, groundY - 4, 28, 8, 4); ctx.fill(); // base lying on a mat
    ctx.save(); ctx.translate(cx, y + 4); ctx.rotate(tilt);
    ctx.fillStyle = '#ff7a5a'; rr(ctx, -w / 2, -4, w, 9, 4); ctx.fill(); // flyer's body
    ctx.fillStyle = '#c98c62'; ctx.beginPath(); ctx.arc(w / 2 + 2, -2, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c98c62'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 - 8, -6); ctx.moveTo(w / 2 - 4, 0); ctx.lineTo(w / 2 + 6, -8); ctx.stroke();
    ctx.restore();
  },
  hook(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y - 200); ctx.lineTo(cx, y - 18); ctx.stroke();
    ctx.strokeStyle = '#f2c23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, y - 12, 6, -0.4, Math.PI + 0.6); ctx.stroke();
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, y - 8); ctx.lineTo(x + 4, y); ctx.moveTo(cx, y - 8); ctx.lineTo(x + w - 4, y); ctx.stroke();
    Sprites.platform(ctx, x, y, w, THEMES.highway, 'fall', t);
  },
  forklift(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(x + w - 6, y - 60, 5, 60 + 200);
    ctx.fillStyle = '#f2c23a'; ctx.fillRect(x, y + 8, w, 5); ctx.fillRect(x + w - 8, y - 20, 6, 30);
    Sprites.platform(ctx, x, y, w - 6, THEMES.highway, 'fall', t);
  },
  saucer(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    ctx.fillStyle = '#4a4458'; ctx.beginPath(); ctx.ellipse(cx, y + 6, w / 2 + 4, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(56,242,255,0.5)'; ctx.beginPath(); ctx.ellipse(cx, y + 2, w / 2 - 10, 5, 0, Math.PI, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = (i + Math.floor(t * 6)) % 2 ? '#38f2ff' : '#ff4fd8'; ctx.beginPath(); ctx.arc(x + 6 + i * (w - 12) / 5, y + 8, 2, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(56,242,255,0.12)'; ctx.beginPath(); ctx.moveTo(cx - 12, y + 12); ctx.lineTo(cx + 12, y + 12); ctx.lineTo(cx + 24, y + 70); ctx.lineTo(cx - 24, y + 70); ctx.fill(); ctx.restore();
  },
  artcar(ctx, p, t) { drawArtCarDeck(ctx, p.x, p.y, p.w, t, THEMES[p.g ? p.g.area.theme : 'deepplaya'] || THEMES.deepplaya); },
  text(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#fffaf0'; rr(ctx, x, y - 2, w, 14, 2); ctx.fill();
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#1a1a2a'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['ONCE UPON A', 'TIME THERE WAS', 'A BURNER', 'THE END?'][Math.floor(Math.abs(p.hx) / 50) % 4], x + w / 2, y + 5);
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x + w - 3 + (Math.floor(t * 2) % 2) * 100, y, 2, 10); // blinking cursor
  },
  bus(ctx, p, t) {
    // the disco bus: a long double-decker of lights; Brady rides the roof
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#1a0e2e'; rr(ctx, x - 6, y + 2, w + 12, 66, 10); ctx.fill();
    for (let i = 0; i < Math.floor(w / 28); i++) { ctx.fillStyle = GLOW_COLS[(i + Math.floor(t * 4)) % 5]; rr(ctx, x + 6 + i * 28, y + 14, 20, 16, 4); ctx.fill(); }
    ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x - 6, y + 36, w + 12, 4);
    for (let i = 0; i < w / 10; i++) { ctx.fillStyle = (i + Math.floor(t * 8)) % 3 ? '#38f2ff' : '#ffd84a'; ctx.beginPath(); ctx.arc(x + 4 + i * 10, y + 46, 1.8, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#0a0a10'; for (const wx of [x + 22, x + w - 22]) { ctx.beginPath(); ctx.arc(wx, y + 68, 11, 0, TAU); ctx.fill(); }
    Sprites.eclipse(ctx, x + w - 26, y - 22, t);
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w - 26, y - 34); ctx.lineTo(x + w - 26, y); ctx.stroke();
    this.deck(ctx, x - 4, y - 2, w + 8, '#2a2438', 'rgba(255,79,216,0.6)');
  },
  busdeck(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 6, y + 3 * TS); ctx.moveTo(x + w - 6, y + 8); ctx.lineTo(x + w - 6, y + 3 * TS); ctx.stroke();
    this.deck(ctx, x, y, w, '#38f2ff', 'rgba(255,255,255,0.7)');
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VIP DECK', x + w / 2, y + 14);
  },
  tire(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#1a1a22'; rr(ctx, x, y, w, 14, 7); ctx.fill(); ctx.fillStyle = '#3a3a44'; rr(ctx, x + 6, y + 4, w - 12, 6, 3); ctx.fill();
  },
  tray(ctx, p, t) {
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + 4); ctx.rotate(p.tilt || 0);
    ctx.fillStyle = '#c8a070'; rr(ctx, -p.w / 2, -4, p.w, 9, 3); ctx.fill(); ctx.fillStyle = '#f4f0e4'; for (let i = 0; i < 3; i++) { ctx.fillRect(-p.w / 2 + 6 + i * 20, -12, 8, 8); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-p.w / 2 + 7 + i * 20, -11, 6, 2); ctx.fillStyle = '#f4f0e4'; }
    ctx.restore();
  },
  cargo(ctx, p, t) {
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + 6); ctx.rotate(p.tilt || 0);
    if ((p.design || 0) % 2) { ctx.fillStyle = '#8a3a5a'; rr(ctx, -p.w / 2, -6, p.w, 16, 5); ctx.fill(); ctx.fillStyle = '#a84a6a'; rr(ctx, -p.w / 2 + 3, -12, p.w - 6, 8, 4); ctx.fill(); }
    else { ctx.fillStyle = '#16131a'; rr(ctx, -p.w / 2, -6, p.w, 18, 3); ctx.fill(); for (const s of [-1, 1]) { ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.arc(s * p.w / 4, 3, 6, 0, TAU); ctx.fill(); } }
    ctx.restore();
  },
  steamSpring(ctx, x, y, comp, t) {
    ctx.fillStyle = '#c8ccd8'; rr(ctx, x - 12, y - 12 + comp * 4, 24, 12 - comp * 4, 3); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 8, y - 10 + comp * 4, 16, 3);
    for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i / 3) % 1; ctx.fillStyle = `rgba(250,250,255,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + Math.sin(i * 2 + t) * 4, y - 16 - k * 26, 4 + k * 6, 0, TAU); ctx.fill(); }
  },
  pumpSpring(ctx, x, y, comp, t) {
    ctx.fillStyle = '#3a6aa8'; rr(ctx, x - 5, y - 26 + comp * 8, 10, 26 - comp * 8, 3); ctx.fill(); ctx.fillStyle = '#1a1a22'; rr(ctx, x - 12, y - 30 + comp * 8, 24, 5, 2); ctx.fill(); ctx.fillRect(x - 12, y - 3, 24, 3);
  }
};

/* ---------- doors inside haunted houses ---------- */
const DoorArt = {
  draw(ctx, x, y, look, t, near) {
    const w = 30, h = 50;
    ctx.save();
    if (look === 'mirror') {
      ctx.fillStyle = '#2a2436'; rr(ctx, x - w / 2 - 3, y - h - 3, w + 6, h + 3, 14); ctx.fill();
      const g = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y); g.addColorStop(0, '#c8d8ff'); g.addColorStop(0.5, '#5a6a9a'); g.addColorStop(1, '#e8f0ff');
      ctx.fillStyle = g; rr(ctx, x - w / 2, y - h, w, h, 12); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 3)})`; ctx.fillRect(x - 8, y - h + 8, 3, h - 16);
    } else if (look === 'locker') {
      ctx.fillStyle = '#5a7a8a'; rr(ctx, x - w / 2, y - h, w, h, 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 8, y - h + 6 + i * 4, 16, 1.5);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 8, y - h / 2 - 3, 3, 8);
    } else if (look === 'rvdoor') {
      ctx.fillStyle = '#e8e0d0'; rr(ctx, x - w / 2, y - h, w, h, 6); ctx.fill();
      ctx.fillStyle = '#2a3a4a'; rr(ctx, x - w / 2 + 5, y - h + 6, w - 10, 14, 3); ctx.fill();
      ctx.fillStyle = '#8a8a96'; ctx.fillRect(x + w / 2 - 8, y - h / 2, 5, 3);
    } else {
      ctx.fillStyle = '#5a3a24'; rr(ctx, x - w / 2, y - h, w, h, 4); ctx.fill();
      ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.4; ctx.strokeRect(x - w / 2 + 4, y - h + 5, w - 8, h / 2 - 6); ctx.strokeRect(x - w / 2 + 4, y - h / 2 + 2, w - 8, h / 2 - 6);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + w / 2 - 6, y - h / 2, 2, 0, TAU); ctx.fill();
    }
    if (near) { ctx.fillStyle = 'rgba(255,240,200,0.18)'; rr(ctx, x - w / 2 - 4, y - h - 4, w + 8, h + 4, 8); ctx.fill(); }
    ctx.restore();
  }
};

/* ---------- set-piece props (drawn as decor over invisible collision) ---------- */
Object.assign(Decor, {
  rv(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    const body = ['#f2f0e9', '#e8e0d0', '#f7f4ed', '#ded7c7'][d.look || 0], stripe = ['#3a78d4', '#c43c5c', '#2e8b57', '#d68a1f'][d.look || 0];
    ctx.fillStyle = body; rr(ctx, x0, y0, w, h - 8, 10); ctx.fill();
    ctx.fillStyle = stripe; ctx.fillRect(x0, y0 + h * 0.45, w, 5); ctx.fillStyle = shade(stripe, 0.3); ctx.fillRect(x0, y0 + h * 0.45 + 6, w, 3);
    ctx.fillStyle = '#2a3a4a'; rr(ctx, x0 + 4, y0 + 8, 22, 14, 4); ctx.fill();
    for (let i = 1; i < Math.floor(w / 34); i++) { rr(ctx, x0 + 8 + i * 32, y0 + 10, 20, 11, 2); ctx.fill(); }
    ctx.fillStyle = '#c8bfae'; rr(ctx, x0 + w - 26, y0 + 14, 14, h - 24, 2); ctx.fill(); // door
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y - 14, w, 6);
    ctx.fillStyle = '#1a1a22'; for (const wx of [x0 + 18, x0 + w - 18]) { ctx.beginPath(); ctx.arc(wx, y - 6, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a7a86'; ctx.beginPath(); ctx.arc(wx, y - 6, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a22'; }
    ctx.fillStyle = '#d8d0c0'; rr(ctx, x0 + 10, y0 - 5, 20, 6, 2); ctx.fill(); // roof AC
    ctx.fillStyle = 'rgba(230,210,170,0.4)'; ctx.fillRect(x0, y0 + h - 22, w, 6); // playa dust
    if (d.honk) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x0 + 2, y0 + h * 0.62, 3, 0, TAU); ctx.fill(); }
  },
  awning(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#8a8a96'; ctx.fillRect(x0 + d.w - 3, y0, 2, d.h);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#ffd84a' : '#3a78d4'; ctx.fillRect(x0 + i * d.w / 4, y0 - 4, d.w / 4 + 0.5, 6); }
  },
  flagpole(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 3, top, 6, d.h);
    ctx.fillStyle = '#6a6a76'; rr(ctx, x0, top, d.w, 8, 3); ctx.fill();
    const col = ['#ff5a6a', '#ffd84a', '#38c8ff', '#7aff8a'][(d.flag || 0) % 4];
    const wave = Math.sin(t * 6 + x) * 4;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 3, top - 30); ctx.quadraticCurveTo(x + 16, top - 34 + wave, x + 28, top - 28 + wave); ctx.lineTo(x + 28, top - 14 + wave); ctx.quadraticCurveTo(x + 16, top - 20 + wave, x + 3, top - 16); ctx.fill();
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 1, top - 34, 2, 34);
  },
  queuer(ctx, x, y, t, th, d) {
    // somebody waiting for coffee: their head is a stepping stone
    const look = d.look || 0, cols = ['#ff7a5a', '#38c8ff', '#7ad86a', '#c87aff', '#ffd84a', '#ff9ad8'];
    const sway = Math.sin(t * 1.5 + x) * 1;
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(x - 6, y - 18, 4, 18); ctx.fillRect(x + 2, y - 18, 4, 18);
    ctx.fillStyle = cols[look % 6]; rr(ctx, x - 9 + sway, y - 40, 18, 24, 6); ctx.fill();
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(x + 9 + sway, y - 30, 6, 7); // mug
    headCircle(ctx, x + sway, y - 50, 9, SKINS[look % 5]);
    ctx.fillStyle = ['#3a2418', '#c8a03a', '#ff5ab8', '#16131a', '#8a3a3a', '#5a3a2a'][look % 6]; ctx.beginPath(); ctx.arc(x + sway, y - 53, 9.6, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#1a1018'; ctx.fillRect(x - 4 + sway, y - 51, 2, 1.4); ctx.fillRect(x + 2 + sway, y - 51, 2, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; if (Math.sin(t * 0.7 + x) > 0.85) ctx.fillText('*sigh*', x, y - 66);
  },
  canvas(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2;
    for (let i = 0; i < d.w / 16; i++) { ctx.fillStyle = i % 2 ? '#c8282a' : '#f4e0c0'; ctx.fillRect(x0 + i * 16, y - 6, 16.5, 6); }
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0, y - 7, d.w, 2);
  },
  stagebox(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#2a1a1a'; ctx.fillRect(x0, y0, d.w, d.h); ctx.fillStyle = '#5a2a2a'; ctx.fillRect(x0, y0, d.w, 5);
    ctx.fillStyle = '#ffd84a'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('OPEN MIC', x, y0 + 18);
    Decor.micstand(ctx, x0 - 8, y0 + d.h, t);
  },
  speakerstack(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#121216'; ctx.fillRect(x0, y0, d.w, d.h);
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 1, y0 + 1, d.w - 2, d.h - 2);
  },
  truss(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.strokeStyle = '#a8a8b4'; ctx.lineWidth = 1.4;
    ctx.strokeRect(x0, y0 + 4, d.w, 10);
    for (let i = 0; i < d.w; i += 10) { ctx.beginPath(); ctx.moveTo(x0 + i, y0 + 4); ctx.lineTo(x0 + i + 10, y0 + 14); ctx.stroke(); }
    if (d.long) for (let i = 8; i < d.w; i += 24) { ctx.fillStyle = GLOW_COLS[(i / 24 + Math.floor(t * 3)) % 5]; ctx.beginPath(); ctx.arc(x0 + i, y0 + 18, 3, 0, TAU); ctx.fill(); }
  },
  cone(ctx, x, y, t, th, d) {
    if (!d.w) { ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x, y - 18); ctx.lineTo(x + 7, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 9, 8, 2.5); return; }
    // a speaker cone membrane (bouncy)
    const bump = Math.max(0, Math.sin(t * 8)) * 3;
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.ellipse(x, y + 2, d.w / 2, 10, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#3a3448'; ctx.beginPath(); ctx.ellipse(x, y + 2 - bump, d.w / 2 - 6, 7, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(x, y - 2 - bump, 5, 0, TAU); ctx.fill();
  },
  griddle(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2;
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(x0 - 4, y, d.w + 8, 10);
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(x0 - 8, y - 2, 6, 14); ctx.fillRect(x0 + d.w + 2, y - 2, 6, 14);
    ctx.fillStyle = '#ff6a1a'; for (let i = 0; i < d.w; i += 18) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); ctx.fillRect(x0 + i + 4, y + 10, 10, 3); } ctx.globalAlpha = 1;
  },
  syrup(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2;
    ctx.fillStyle = 'rgba(160,80,20,0.85)'; ctx.beginPath(); ctx.moveTo(x0, y - TS); for (let i = 0; i <= d.w; i += 8) ctx.lineTo(x0 + i, y - TS - 2 + Math.sin(i * 0.4 + t) * 1.5); ctx.lineTo(x0 + d.w, y - TS + 6); ctx.lineTo(x0, y - TS + 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,120,0.5)'; ctx.fillRect(x0 + 4, y - TS - 1, d.w - 8, 1.4);
  },
  couch2(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#8a3a5a'; rr(ctx, x0, y0 + 4, d.w, d.h - 4, 6); ctx.fill();
    ctx.fillStyle = '#a84a6a'; rr(ctx, x0 + 3, y0, d.w - 6, 10, 5); ctx.fill(); rr(ctx, x0, y0 - 14, d.w, 16, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + 6, y0 + 2, d.w - 12, 2);
  },
  oldart(ctx, x, y, t, th, d) {
    // rusty art from '98: a lopsided steel sun on a pole of welded junk
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#8a4a2a'; ctx.fillRect(x - 5, y0 + 12, 10, d.h - 12);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#a85a2a', '#7a3a1a'][i % 2]; ctx.fillRect(x0 + 2 + (i % 2) * 8, y0 + 18 + i * (d.h - 24) / 4, d.w - 4 - (i % 2) * 16, 6); }
    ctx.fillStyle = '#c87a3a'; ctx.beginPath(); ctx.arc(x, y0 + 6, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c87a3a'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 12, y0 + 6 + Math.sin(a) * 12); ctx.lineTo(x + Math.cos(a) * 20, y0 + 6 + Math.sin(a) * 20); ctx.stroke(); }
    ctx.fillStyle = '#4a2410'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText("'98", x, y0 + 9);
  },
  porch(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x0, y0, d.w, d.h); ctx.fillStyle = '#6a4a2a'; for (let i = 0; i < d.w; i += 12) ctx.fillRect(x0 + i, y0, 2, d.h);
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x0 - 2, y0 - 3, d.w + 4, 4);
    ctx.fillStyle = '#c8a070'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('GET OFF MY PLAYA', x, y0 + 14);
  },
  stone(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    const g = ctx.createLinearGradient(x0, 0, x0 + d.w, 0); g.addColorStop(0, '#8a8a9a'); g.addColorStop(1, '#5a5a6a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + 2, y); ctx.lineTo(x0, y0 + 6); ctx.quadraticCurveTo(x, y0 - 6, x0 + d.w, y0 + 4); ctx.lineTo(x0 + d.w - 2, y); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,160,255,${0.4 + 0.3 * Math.sin(t * 2 + x)})`; ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(['☽', '✦', '☉', '✧'][(d.rune || 0) % 4], x, y0 + 28); ctx.restore();
  },
  camptower(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 2;
    ctx.strokeRect(x0 + 2, y0, d.w - 4, d.h);
    for (let yy = y0; yy < y; yy += 24) { ctx.beginPath(); ctx.moveTo(x0 + 2, yy); ctx.lineTo(x0 + d.w - 2, yy + 24); ctx.moveTo(x0 + d.w - 2, yy); ctx.lineTo(x0 + 2, yy + 24); ctx.stroke(); }
    ctx.fillStyle = '#ff7a5a'; rr(ctx, x0 - 4, y0 - 4, d.w + 8, 8, 3); ctx.fill();
    if (d.flags) { ctx.fillStyle = GLOW_COLS[Math.floor(x) % 5]; ctx.beginPath(); ctx.moveTo(x, y0 - 4); ctx.lineTo(x, y0 - 30); ctx.lineTo(x + 16, y0 - 24 + Math.sin(t * 5) * 2); ctx.lineTo(x, y0 - 18); ctx.fill(); }
  },
  van(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#e8d8a8'; rr(ctx, x0, y0 + 6, d.w, d.h - 14, 12); ctx.fill();
    ctx.fillStyle = '#5ab8a8'; ctx.fillRect(x0, y0 + d.h * 0.5, d.w, 10);
    ctx.fillStyle = '#2a3a4a'; rr(ctx, x0 + 8, y0 + 14, 26, 16, 4); ctx.fill(); rr(ctx, x0 + 40, y0 + 14, 26, 16, 4); ctx.fill();
    ctx.fillStyle = '#ff9ad8'; ctx.beginPath(); ctx.arc(x0 + 100, y0 + 26, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x0 + 100, y0 + 26, 3, 0, TAU); ctx.fill(); // painted flower
    ctx.fillStyle = '#1a1a22'; for (const wx of [x0 + 24, x0 + d.w - 24]) { ctx.beginPath(); ctx.arc(wx, y - 7, 10, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x0 + d.w - 8, y0 + 8, 10, 4); // hood propped up
  },
  sculpture(ctx, x, y, t, th, d) {
    // a giant art piece: solid silhouette, rim-lit with LED strips (no full-screen tint on the live canvas)
    const night = th.night || th.darkness > 0;
    const glow = GLOW_COLS[Math.floor(x / 50) % 5];
    const s = d.h / 110;
    ctx.save(); ctx.globalAlpha = 0.9;
    drawSculpture(ctx, x, y, s * 1.05, d.form, night ? '#2a3050' : '#8a7a6a', null);
    ctx.restore();
    if (night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 2 + x); drawSculpture(ctx, x, y - 2, s * 1.05, d.form, glow, null); ctx.restore(); ctx.save(); ctx.globalAlpha = 0.85; drawSculpture(ctx, x, y + 1, s * 1.0, d.form, '#20263e', null); ctx.restore(); }
  },
  ringlight(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#ff9ad8'; rr(ctx, x0, y0, d.w, d.h, 4); ctx.fill(); ctx.fillStyle = '#ffd0f0'; ctx.fillRect(x0, y0, d.w, 4);
    ctx.fillStyle = '#ffffff'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('#BURNLIFE', x, y0 + 14);
  },
  fueltank(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    const g = ctx.createLinearGradient(0, y0, 0, y); g.addColorStop(0, '#e8e8f0'); g.addColorStop(0.5, '#a8a8b4'); g.addColorStop(1, '#6a6a76');
    ctx.fillStyle = g; rr(ctx, x0, y0, d.w, d.h - 6, d.h / 2.4); ctx.fill();
    ctx.fillStyle = '#ff3a3a'; ctx.fillRect(x0 + 8, y0 + d.h * 0.4, d.w - 16, 8); ctx.fillStyle = '#fff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('FUEL', x, y0 + d.h * 0.4 + 7);
    ctx.fillStyle = '#4a4a56'; ctx.fillRect(x0 + 10, y - 8, 6, 8); ctx.fillRect(x0 + d.w - 16, y - 8, 6, 8);
  },
  scaffold(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.strokeStyle = 'rgba(200,200,210,0.6)'; ctx.lineWidth = 1.5;
    for (let i = 0; i <= d.w; i += 48) { ctx.beginPath(); ctx.moveTo(x0 + i, y0); ctx.lineTo(x0 + i, y); ctx.stroke(); }
    for (let i = 0; i < d.w; i += 48) { ctx.beginPath(); ctx.moveTo(x0 + i, y0); ctx.lineTo(x0 + i + 48, y); ctx.stroke(); }
  },
  fence(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h - 40;
    ctx.strokeStyle = 'rgba(255,122,26,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < d.w; i += 8) { ctx.beginPath(); ctx.moveTo(x0 + i, y0); ctx.lineTo(x0 + i + 20, y); ctx.moveTo(x0 + i + 20, y0); ctx.lineTo(x0 + i, y); ctx.stroke(); }
    ctx.fillStyle = '#3a2a20'; for (let i = 0; i <= d.w; i += 96) ctx.fillRect(x0 + i, y0, 4, y - y0);
  },
  dock(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(x0, y0, d.w, d.h); ctx.fillStyle = '#f2c23a'; for (let i = 0; i < d.w; i += 12) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, d.w, 6); ctx.clip(); ctx.fillRect(x0 + i, y0, 6, 6); ctx.restore(); }
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x0, y0 + 6, d.w, 2);
  },
  coverwall(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#c8a070'; ctx.fillRect(x0, y0, d.w, d.h); ctx.fillStyle = 'rgba(90,60,30,0.4)'; for (let i = 0; i < d.h; i += 7) ctx.fillRect(x0, y0 + i, d.w, 1);
    ctx.fillStyle = '#ff4fd8'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('COVER', x, y0 + 12);
  },
  word(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = 'rgba(255,250,240,0.9)'; rr(ctx, x0, y0, d.w, 12, 3); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(d.text || 'WORD', x, y0 + 10.5);
  },
  hut(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = 'rgba(40,20,40,0.35)'; ctx.fillRect(x0 + 6, y0 + 6, d.w - 12, d.h - 6);
    ctx.fillStyle = '#c8a03a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VIP LOUNGE', x, y0 - 6);
  },
  bellpost(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 2, y - d.h, 4, d.h);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x - 8, y - d.h + 18); ctx.quadraticCurveTo(x - 7, y - d.h + 4, x, y - d.h + 3); ctx.quadraticCurveTo(x + 7, y - d.h + 4, x + 8, y - d.h + 18); ctx.closePath(); ctx.fill();
  },
  // haunted house furniture
  bunk(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x0, y - 50, 4, 50); ctx.fillRect(x0 + d.w - 4, y - 50, 4, 50); ctx.fillStyle = '#8a3a4a'; ctx.fillRect(x0, y - 22, d.w, 8); ctx.fillRect(x0, y - 48, d.w, 8); ctx.fillStyle = 'rgba(255,220,200,0.6)'; ctx.beginPath(); ctx.arc(x0 + 10, y - 26, 4, 0, TAU); ctx.fill(); },
  fridge(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#e8e8f0'; rr(ctx, x0 + 8, y - 56, d.w - 16, 56, 4); ctx.fill(); ctx.fillStyle = '#8a8a96'; ctx.fillRect(x0 + d.w - 14, y - 46, 2, 14); ctx.fillStyle = '#ff7ad8'; ctx.fillRect(x0 + 14, y - 40, 6, 6); },
  dinette(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#c8a070'; ctx.fillRect(x0, y - 20, d.w, 4); ctx.fillRect(x + -2, y - 16, 4, 16); ctx.fillStyle = '#f4f0e4'; ctx.fillRect(x - 10, y - 26, 6, 6); },
  closet(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#5a3a24'; rr(ctx, x0 + 4, y - 56, d.w - 8, 56, 3); ctx.fill(); ctx.strokeStyle = '#3a2418'; ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x - 3, y - 28, 1.5, 0, TAU); ctx.arc(x + 3, y - 28, 1.5, 0, TAU); ctx.fill(); },
  mirror(ctx, x, y, t, th, d) { DoorArt.draw(ctx, x, y, 'mirror', t, false); },
  speaker(ctx, x, y, t, th, d) { ctx.fillStyle = '#121216'; ctx.fillRect(x - 14, y - 44, 28, 44); ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(x, y - 14, 9, 0, TAU); ctx.arc(x, y - 34, 6, 0, TAU); ctx.fill(); },
  discobox(ctx, x, y, t, th, d) { Sprites.eclipse(ctx, x, y - 50, t); ctx.strokeStyle = '#8a8a96'; ctx.beginPath(); ctx.moveTo(x, y - 64); ctx.lineTo(x, y - 90); ctx.stroke(); },
  junkpile(ctx, x, y, t, th, d) { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#8a3a4a', '#3a6a8a', '#c8a03a', '#5a8a4a', '#8a5aa8', '#d8d0c0'][i]; rr(ctx, x - 24 + (i * 13) % 40, y - 10 - Math.floor(i / 3) * 12, 16, 12, 3); ctx.fill(); } },
  bikes(ctx, x, y, t, th, d) { Decor.lostbike(ctx, x - 8, y, t); Decor.lostbike(ctx, x + 10, y, t); },
  shoebox(ctx, x, y, t, th, d) { ctx.fillStyle = '#c8a070'; ctx.fillRect(x - 18, y - 12, 36, 12); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 18, y - 14, 36, 3); ctx.fillStyle = '#3a2418'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('ONE SHOE', x, y - 4); },
  lostsign(ctx, x, y, t, th, d) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1.5, y - 40, 3, 40); ctx.fillStyle = '#f4e8d0'; rr(ctx, x - 22, y - 56, 44, 18, 2); ctx.fill(); ctx.fillStyle = '#8a3a3a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LOST & FOUND', x, y - 44); },
  crate(ctx, x, y, t, th, d) { ctx.fillStyle = '#a8784a'; ctx.fillRect(x - 14, y - 26, 28, 26); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.strokeRect(x - 14, y - 26, 28, 26); ctx.beginPath(); ctx.moveTo(x - 14, y - 26); ctx.lineTo(x + 14, y); ctx.stroke(); },
  // camp decor
  coffeecart(ctx, x, y, t) { ctx.fillStyle = '#c83a3a'; rr(ctx, x - 16, y - 30, 32, 22, 3); ctx.fill(); ctx.fillStyle = '#f4f0e4'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('COFFEE', x, y - 18); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x - 10, y - 5, 5, 0, TAU); ctx.arc(x + 10, y - 5, 5, 0, TAU); ctx.fill(); },
  spotlightstand(ctx, x, y, t) { ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x, y - 30); ctx.lineTo(x + 8, y); ctx.stroke(); ctx.fillStyle = '#5a5a66'; rr(ctx, x - 7, y - 40, 14, 12, 3); ctx.fill(); ctx.fillStyle = `rgba(255,240,180,${0.6 + 0.4 * Math.sin(t * 3 + x)})`; ctx.beginPath(); ctx.arc(x + 6, y - 34, 4, 0, TAU); ctx.fill(); },
  drum(ctx, x, y, t) { ctx.fillStyle = '#c8282a'; ctx.fillRect(x - 12, y - 18, 24, 18); ctx.fillStyle = '#f4e0c0'; ctx.beginPath(); ctx.ellipse(x, y - 18, 12, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1; for (let i = -10; i < 12; i += 6) { ctx.beginPath(); ctx.moveTo(x + i, y - 16); ctx.lineTo(x + i + 4, y - 2); ctx.stroke(); } },
  stool(ctx, x, y) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 8, y - 22, 16, 4); ctx.fillRect(x - 7, y - 18, 2, 18); ctx.fillRect(x + 5, y - 18, 2, 18); },
  kandistand(ctx, x, y, t) { ctx.fillStyle = '#c8a070'; ctx.fillRect(x - 16, y - 18, 32, 4); ctx.fillRect(x - 14, y - 14, 3, 14); ctx.fillRect(x + 11, y - 14, 3, 14); for (let i = 0; i < 5; i++) { ctx.strokeStyle = GLOW_COLS[i]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x - 12 + i * 6, y - 22, 3, 4, 0, 0, TAU); ctx.stroke(); } },
  lantern(ctx, x, y, t) { ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 1.5, y - 44, 3, 44); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 48, 1, x, y - 48, 22); g.addColorStop(0, 'rgba(255,200,110,0.8)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, y - 70, 44, 44); ctx.restore(); ctx.fillStyle = '#ffc860'; ctx.beginPath(); ctx.ellipse(x, y - 48, 5, 7, 0, 0, TAU); ctx.fill(); },
  tirestack(ctx, x, y) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(x, y - 5 - i * 9, 14, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(x, y - 6 - i * 9, 6, 2, 0, 0, TAU); ctx.fill(); } },
  waterjug(ctx, x, y, t) { ctx.fillStyle = 'rgba(120,200,255,0.85)'; rr(ctx, x - 10, y - 30, 20, 30, 5); ctx.fill(); ctx.fillStyle = '#3a8ac8'; ctx.fillRect(x - 4, y - 36, 8, 7); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 6, y - 26, 3, 20); },
  misting(ctx, x, y, t) { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 1.5, y - 60, 3, 60); ctx.fillRect(x - 20, y - 60, 40, 3); for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(220,240,255,${0.3 + 0.2 * Math.sin(t * 5 + i)})`; ctx.beginPath(); ctx.arc(x - 16 + i * 8, y - 50 + (t * 20 + i * 7) % 20, 5, 0, TAU); ctx.fill(); } },
  toolbox(ctx, x, y) { ctx.fillStyle = '#c83a3a'; rr(ctx, x - 12, y - 12, 24, 12, 2); ctx.fill(); ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 12, 5, Math.PI, TAU); ctx.stroke(); },
  barrelstack(ctx, x, y) { GimmickArt.barrelShape(ctx, x - 26, y - 28, false); GimmickArt.barrelShape(ctx, x, y - 28, false); GimmickArt.barrelShape(ctx, x - 13, y - 56, false); },
  hazardsign(ctx, x, y) { ctx.fillStyle = '#9a9aa4'; ctx.fillRect(x - 1.5, y - 36, 3, 36); ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.lineTo(x + 12, y - 32); ctx.lineTo(x - 12, y - 32); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a1018'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 35); },
  neonarrow(ctx, x, y, t) { ctx.save(); ctx.shadowColor = '#38f2ff'; ctx.shadowBlur = 10; ctx.strokeStyle = '#38f2ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 14, y - 40); ctx.lineTo(x + 10, y - 40); ctx.moveTo(x + 2, y - 48); ctx.lineTo(x + 12, y - 40); ctx.lineTo(x + 2, y - 32); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#3a3448'; ctx.fillRect(x - 1, y - 30, 2, 30); },
  cauldron(ctx, x, y, t) { ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x, y - 12, 13, 0, Math.PI); ctx.lineTo(x - 13, y - 14); ctx.fill(); ctx.fillStyle = '#7affd8'; ctx.beginPath(); ctx.ellipse(x, y - 14, 12, 3, 0, 0, TAU); ctx.fill(); for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; ctx.fillStyle = `rgba(122,255,216,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(x - 5 + i * 5, y - 16 - k * 16, 3, 0, TAU); ctx.fill(); } },
  towelrack(ctx, x, y) { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 14, y - 30, 2, 30); ctx.fillRect(x + 12, y - 30, 2, 30); ctx.fillRect(x - 14, y - 30, 28, 2); ctx.fillStyle = '#ff7a5a'; ctx.fillRect(x - 10, y - 28, 9, 16); ctx.fillStyle = '#38c8ff'; ctx.fillRect(x + 1, y - 28, 9, 12); },
  mudpot(ctx, x, y, t) { ctx.fillStyle = '#6a4a32'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 5, 0, 0, TAU); ctx.fill(); if (Math.sin(t * 3 + x) > 0.4) { ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.arc(x + Math.sin(x) * 6, y - 7, 3, Math.PI, TAU); ctx.fill(); } },
  inkwell(ctx, x, y) { ctx.fillStyle = '#1a1a2a'; rr(ctx, x - 9, y - 16, 18, 16, 4); ctx.fill(); ctx.fillStyle = '#3a3a5a'; ctx.fillRect(x - 5, y - 20, 10, 5); },
  quill(ctx, x, y, t) { ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 40); ctx.stroke(); ctx.fillStyle = '#f4ecdc'; ctx.beginPath(); ctx.moveTo(x + 8, y - 40); ctx.quadraticCurveTo(x + 22, y - 30, x + 4, y - 14); ctx.fill(); },
  bookpile(ctx, x, y) { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#8a2a2a', '#2a4a7a', '#4a6a3a', '#7a5a2a'][i]; ctx.fillRect(x - 14 + (i % 2) * 3, y - 6 - i * 6, 28, 6); } },
  stage(ctx, x, y, t, th, d) { const x0 = x - d.w / 2, y0 = y - d.h; ctx.fillStyle = '#2a1a3a'; ctx.fillRect(x0, y0 + 8, d.w, 6); ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x0, y0 + 6, d.w, 2); ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 4, y0 + 14); ctx.lineTo(x0 + 4, y0 + 120); ctx.moveTo(x0 + d.w - 4, y0 + 14); ctx.lineTo(x0 + d.w - 4, y0 + 120); ctx.stroke(); },
  giftbooth(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, y0 = y - d.h;
    ctx.fillStyle = '#c8a070'; ctx.fillRect(x0 + 6, y0 + 40, d.w - 12, d.h - 40);
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x0 + 2, y0 + 36, d.w - 4, 6);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : (GIFTS[d.gift] || GIFTS.kandi).col; ctx.beginPath(); ctx.moveTo(x0 + i * d.w / 8, y0 + 12); ctx.lineTo(x0 + (i + 1) * d.w / 8, y0 + 12); ctx.lineTo(x0 + (i + 0.5) * d.w / 8, y0 + 24); ctx.fill(); }
    ctx.fillStyle = '#3a2418'; ctx.fillRect(x0 + 2, y0, 4, d.h); ctx.fillRect(x0 + d.w - 6, y0, 4, d.h);
    ctx.fillStyle = (GIFTS[d.gift] || GIFTS.kandi).col; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('FREE GIFT', x, y0 + 8);
    ctx.save(); ctx.translate(x, y0 + 52 + Math.sin(t * 3) * 3); GiftIcon.draw(ctx, d.gift, t); ctx.restore();
  }
});
// the four burner gifts as little icons
const GiftIcon = {
  draw(ctx, gift, t) {
    if (gift === 'kandi') { for (let i = 0; i < 4; i++) { ctx.strokeStyle = GLOW_COLS[i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -4 + i * 3, 11, 5, 0, 0, TAU); ctx.stroke(); } }
    else if (gift === 'lantern') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 22); g.addColorStop(0, 'rgba(255,210,120,0.8)'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(-22, -22, 44, 44); ctx.restore(); ctx.fillStyle = '#ffc860'; rr(ctx, -6, -8, 12, 16, 4); ctx.fill(); ctx.fillStyle = '#3a2418'; ctx.fillRect(-7, -10, 14, 3); ctx.fillRect(-7, 7, 14, 3); }
    else if (gift === 'bike') { ctx.strokeStyle = '#7affd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-9, 4, 6, 0, TAU); ctx.arc(9, 4, 6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(-1, -6); ctx.lineTo(9, 4); ctx.moveTo(-1, -6); ctx.lineTo(6, -7); ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(120,210,255,0.9)'; rr(ctx, -7, -10, 14, 20, 4); ctx.fill(); ctx.fillStyle = '#3a8ac8'; ctx.fillRect(-3, -14, 6, 5); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-4, -6, 2, 12); }
  }
};
