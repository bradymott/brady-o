/* ============================================================
   BRADY-O BURNS — hub: a stylized 2D playa map of the ten worlds,
   the prologue story (first visit) and the costume wardrobe.
   Entry point for the title menu: new BurnsHubScene()
   ============================================================ */

// a generic wooden effigy with raised arms + glowing diamond head (2D, for story panels)
function burnsDrawMan2D(ctx, x, y, s, t, heart) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const wood = '#3a1a1a', neon = '#38f2ff';
  ctx.strokeStyle = wood; ctx.lineCap = 'round'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-8, -62); ctx.moveTo(14, 0); ctx.lineTo(8, -62); ctx.stroke();
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-10, -62); ctx.lineTo(-13, -112); ctx.lineTo(13, -112); ctx.lineTo(10, -62); ctx.closePath(); ctx.fillStyle = wood; ctx.fill(); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-14, -108); ctx.lineTo(-38, -146); ctx.lineTo(-44, -176); ctx.moveTo(14, -108); ctx.lineTo(38, -146); ctx.lineTo(44, -176); ctx.stroke();
  // neon outline
  ctx.save(); ctx.shadowColor = neon; ctx.shadowBlur = 10; ctx.strokeStyle = neon; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-9, -62); ctx.lineTo(-14, -112); ctx.lineTo(-39, -147); ctx.lineTo(-45, -177); ctx.moveTo(15, 0); ctx.lineTo(9, -62); ctx.lineTo(14, -112); ctx.lineTo(39, -147); ctx.lineTo(45, -177); ctx.stroke(); ctx.restore();
  // diamond head
  const glow = 0.75 + 0.25 * Math.sin(t * 3);
  ctx.save(); ctx.shadowColor = '#ff6ad0'; ctx.shadowBlur = 24 * glow; ctx.fillStyle = '#ffd0f0';
  ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(13, -128); ctx.lineTo(0, -112); ctx.lineTo(-13, -128); ctx.closePath(); ctx.fill(); ctx.restore();
  if (heart) { ctx.save(); ctx.shadowColor = '#ff4fa8'; ctx.shadowBlur = 16; ctx.fillStyle = '#ff4fa8'; const hs = 1 + Math.sin(t * 6) * 0.08; ctx.translate(0, -90); ctx.scale(hs, hs); ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, -2, -6, -12, 0, -5); ctx.bezierCurveTo(6, -12, 12, -2, 0, 8); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function burnsStoryBG(ctx, W, H, t, top, bot) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top || '#140a2a'); g.addColorStop(0.62, bot || '#c8603a'); g.addColorStop(0.64, '#5a3030'); g.addColorStop(1, '#2a1418');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i)); ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`; ctx.fillRect((i * 97.3) % W, (i * 41.7) % (H * 0.5), 1.6, 1.6); }
  ctx.fillStyle = '#3a1e34'; ctx.beginPath(); ctx.moveTo(0, H * 0.63); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.63 - 14 - Math.sin(x * 0.013) * 10 - Math.sin(x * 0.041) * 5); ctx.lineTo(W, H * 0.63); ctx.fill();
  const pg = ctx.createLinearGradient(0, H * 0.63, 0, H); pg.addColorStop(0, '#b87a5a'); pg.addColorStop(1, '#5a3a3a');
  ctx.fillStyle = pg; ctx.fillRect(0, H * 0.63, W, H * 0.37);
  return H * 0.72;
}
function burnsRV2D(ctx, x, y, s, col, lit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col || '#e8e0d0'; rr(ctx, -40, -34, 80, 30, 5); ctx.fill(); rr(ctx, 34, -26, 18, 22, 4); ctx.fill();
  ctx.fillStyle = '#c83a2a'; ctx.fillRect(-40, -20, 80, 4);
  ctx.fillStyle = lit ? '#ffc070' : '#2a3040'; ctx.fillRect(-30, -30, 12, 7); ctx.fillRect(-12, -30, 12, 7); ctx.fillRect(6, -30, 12, 7);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-24, -4, 6, 0, TAU); ctx.arc(30, -4, 6, 0, TAU); ctx.fill();
  if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(54, -12, 1, 54, -12, 30); g.addColorStop(0, 'rgba(255,240,200,0.7)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(24, -42, 60, 60); ctx.restore(); }
  ctx.restore();
}
function burnsPrologue() {
  const brady = (ctx, x, y, s, t, st) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: st || 'idle', t, phase: t * 12, speed: 1 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); };
  return [
    { text: 'Brady and Chinka drove for days to get to the Burn. Goggles: packed. Water: packed. Love: very packed.',
      scene(ctx, W, H, t) { const gy = burnsStoryBG(ctx, W, H, t); for (let i = 0; i < 6; i++) burnsRV2D(ctx, ((i * 150 + t * 14) % (W + 200)) - 100, gy - 6 - i * 3, 0.7 + i * 0.05, ['#e8e0d0', '#f4f4f0', '#d8c8a8'][i % 3], true); const s = Math.min(2.4, H / 160); brady(ctx, W * 0.4, gy + 20, s, t, 'idle'); drawChinka(ctx, { x: W * 0.4 + 30 * s, y: gy + 20, scale: s, t, pose: 'wave', facing: -1 }); } },
    { text: 'But out on the playa, something enormous was waking up. Something made of wood. And neon. And feelings.',
      scene(ctx, W, H, t) { const gy = burnsStoryBG(ctx, W, H, t, '#0a0618', '#5a1e4a'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(W * 0.5, gy - H * 0.3, 10, W * 0.5, gy - H * 0.3, H * 0.6); g.addColorStop(0, 'rgba(255,90,200,0.45)'); g.addColorStop(1, 'rgba(255,90,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); burnsDrawMan2D(ctx, W * 0.5, gy + 10, Math.min(2.2, H / 200), t, true); } },
    { text: 'Somewhere ahead, past miles of RVs and dust, the gate was about to open. What could possibly go wrong?',
      scene(ctx, W, H, t) { const gy = burnsStoryBG(ctx, W, H, t); for (let i = 0; i < 9; i++) burnsRV2D(ctx, W * 0.1 + i * W * 0.1, gy - 4 + Math.sin(i) * 3, 0.55, ['#e8e0d0', '#ff8a1a', '#f4f4f0'][i % 3], true); burnsDrawMan2D(ctx, W * 0.82, gy - 18, Math.min(0.9, H / 400), t, true); const s = Math.min(2.4, H / 160); brady(ctx, W * 0.25, gy + 34, s, t, 'victory'); } }
  ];
}

class BurnsHubScene {
  constructor(opts) {
    this.opts = opts || {}; this.t = 0; this.wardrobe = false;
    Input.setMode('ui'); Input.camDrag = false; Input.hud = null;
    const sv = BurnsSave.get();
    const O = BurnsWorlds.visible(), want = this.opts.select || sv.lastWorld || 1;
    this.sel = O.indexOf(want) >= 0 ? want : O[0];
    const nx = this.opts.from ? BurnsWorlds.next(this.opts.from) : null;
    if (nx && sv.unlocked[nx] && BurnsWorlds.get(nx)) this.sel = nx;
    this.newUnlock = nx && sv.worldDone[this.opts.from] ? nx : 0;
    burnsMusic('burns_hub');
    if (!sv.seenIntro && !this.opts.noIntro) {
      sv.seenIntro = true; BurnsSave.save();
      this.deferIntro = true;
    }
    this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), portrait = H > W;
    // map rect
    const top = S.t + (portrait ? 98 : 52), bottom = H - S.b - (portrait ? 190 : 58);
    const mw = portrait ? W - S.l - S.r : Math.min(W * 0.62, (bottom - top) * 1.5), mh = bottom - top;
    this.map = { x: portrait ? S.l : S.l + 4, y: top, w: mw, h: mh };
    const pw = portrait ? W - S.l - S.r : W - this.map.x - mw - S.r - 12;
    this.panel = portrait ? { x: S.l, y: bottom + 8, w: pw, h: H - S.b - bottom - 16 } : { x: this.map.x + mw + 12, y: top, w: pw, h: mh };
    const bw = 96;
    this.btns = [{ x: S.l, y: S.t, w: 92, h: 36, label: '◀ BACK', size: 12, fn: () => { burnsSfx('back'); Game.setScene(new TitleScene()); } }];
    const rx = W - S.r;
    this.btns.push({ x: rx - bw, y: S.t, w: bw, h: 36, label: 'STORY', size: 12, fn: () => this.playIntro() });
    if (BurnsSave.hasItem('costumes') || window.__burnsAllCostumes) this.btns.push({ x: rx - bw * 2 - 8, y: S.t, w: bw + 10, h: 36, label: 'WARDROBE', size: 11, fn: () => { this.wardrobe = true; this.buildWardrobe(); burnsSfx('costume'); } });
    // HOME: jump straight to Brady's tipi once the home world is unlocked
    const home = BurnsWorlds.home(), sv0 = BurnsSave.get();
    if (home && sv0.unlocked[home] && BurnsWorlds.get(home)) this.btns.push({ x: this.map.x + 8, y: this.map.y + 8, w: 84, h: 30, label: '\u2302 HOME', size: 11, fn: () => { this.sel = home; this.play(); } });
    const P = this.panel;
    this.playBtn = { x: P.x + 12, y: P.y + P.h - 58, w: P.w - 24, h: 46, label: 'PLAY', primary: true, fn: () => this.play() };
    this.btns.push(this.playBtn);
    this.btns.focus = this.btns.length - 1;
    // one pin per world in play order (labelled by position); ids without metadata get a spot on a ring
    const O = BurnsWorlds.visible();
    this.nodes = O.map((id, i) => { const m = BurnsWorlds.meta(id), a = i / O.length * TAU, h = BURNS_WORLD_META.find(k => k.id === id) ? m.hub : { x: 0.5 + Math.sin(a) * 0.4, y: 0.5 + Math.cos(a) * 0.4 }; return { id, n: BurnsWorlds.num(id), secret: BurnsWorlds.isSecret(id), home: BurnsWorlds.isHome(id), day: BurnsWorlds.dayShort(id), x: this.map.x + h.x * this.map.w, y: this.map.y + h.y * this.map.h, col: m.col }; });
    this.nodeR = clamp(Math.min(this.map.w, this.map.h) / 17, 12, 17);
    if (this.wardrobe) this.buildWardrobe();
  }
  resize() { this.build(); }
  playIntro() { Game.setScene(new StoryScene(burnsPrologue(), () => Game.setScene(new BurnsHubScene({ noIntro: true, select: this.sel })), 'burns_intro')); }
  play() {
    const w = this.sel, sv = BurnsSave.get();
    if (!sv.unlocked[w]) { const pv = BurnsWorlds.prev(w); burnsSfx('bump'); this.toast = { text: pv ? `Beat ${BurnsWorlds.label(pv)}'s boss to unlock this world.` : 'This world is locked.', t: 2.4 }; return; }
    if (!BurnsWorlds.get(w)) { burnsSfx('bump'); this.toast = { text: 'The burners are still building this world. Soon!', t: 2.4 }; return; }
    burnsSfx('select');
    BurnsScenes.play(w);
  }
  buildWardrobe() {
    const W = Game.cssW, H = Game.cssH, n = BURNS_COSTUMES.length, cols = W > H ? 4 : 2, rows = Math.ceil(n / cols);
    const cw = Math.min(170, (W - 60) / cols), ch = Math.min(90, (H - 140) / rows);
    const x0 = (W - cols * (cw + 10)) / 2, y0 = Math.max(70, (H - rows * (ch + 10)) / 2);
    this.wbtns = BURNS_COSTUMES.map((c, i) => ({ x: x0 + (i % cols) * (cw + 10), y: y0 + Math.floor(i / cols) * (ch + 10), w: cw, h: ch, label: c.name.toUpperCase(), size: 11, costume: c.id, fn: () => { BurnsSave.setCostume(c.id); burnsSfx('costume'); } }));
    this.wbtns.push({ x: W / 2 - 70, y: Math.min(H - 56, y0 + rows * (ch + 10) + 6), w: 140, h: 42, label: 'DONE', primary: true, fn: () => { this.wardrobe = false; } });
  }
  update(dt) {
    this.t += dt;
    if (this.deferIntro) { this.deferIntro = false; this.playIntro(); return; }
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    if (this.wardrobe) { const hit = UI.hitButtons(this.wbtns); if (hit) hit.fn(); return; }
    const k = Input.uiKey;
    const O = BurnsWorlds.visible(), si = Math.max(0, O.indexOf(this.sel));
    if (k === 'left' || k === 'up') { this.sel = O[(si + O.length - 1) % O.length]; burnsSfx('select', { vol: 0.4 }); return; }
    if (k === 'right' || k === 'down') { this.sel = O[(si + 1) % O.length]; burnsSfx('select', { vol: 0.4 }); return; }
    if (k === 'enter') { this.play(); return; }
    for (const tp of Input.taps) { let best = null, bd = (this.nodeR || 17) + 9; for (const n of this.nodes) { const d = Math.hypot(tp.x - n.x, tp.y - n.y); if (d < bd) { bd = d; best = n; } } if (best) { if (this.sel === best.id) this.play(); else { this.sel = best.id; burnsSfx('select'); } return; } }
    const hit = UI.hitButtons(this.btns.filter(b => b !== this.playBtn).concat([this.playBtn]));
    if (hit && (Input.taps.length || k === 'enter' || Input.jumpPressed)) hit.fn();
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, t = this.t, sv = BurnsSave.get();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a0618'); bg.addColorStop(1, '#2a1028');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.7 + i * 1.7)); ctx.fillStyle = `rgba(255,255,255,${a * 0.55})`; ctx.fillRect((i * 131.7) % W, (i * 57.3) % H, 1.5, 1.5); }
    this.drawMap(ctx, t, sv);
    // header
    const S = BurnsUI.safe();
    const hy = W < H ? S.t + 58 : S.t + 18;
    BurnsUI.text(ctx, 'BRADY GOES TO BURNING MAN', W / 2, hy, BurnsUI.fitSize(ctx, 'BRADY GOES TO BURNING MAN', Math.min(26, W / 16), W - 230), '#ff9a4a', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, `Burn Tokens ${BurnsSave.tokenCount()}  ·  Photos ${BurnsSave.photoCount()}  ·  Glow ${sv.glow}`, W / 2, hy + 22, 11, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    this.drawPanel(ctx, sv);
    UI.drawButtons(ctx, this.btns);
    if (this.toast) BurnsUI.text(ctx, this.toast.text, W / 2, H * 0.5, 13, '#ffd84a', { ui: true });
    if (this.wardrobe) this.drawWardrobe(ctx);
  }
  drawMap(ctx, t, sv) {
    const M = this.map;
    ctx.save();
    ctx.beginPath(); rr(ctx, M.x, M.y, M.w, M.h, 18); ctx.clip();
    const g = ctx.createRadialGradient(M.x + M.w * 0.5, M.y + M.h * 0.5, 10, M.x + M.w * 0.5, M.y + M.h * 0.5, Math.max(M.w, M.h) * 0.7);
    g.addColorStop(0, '#c89070'); g.addColorStop(1, '#6a3e3a'); ctx.fillStyle = g; ctx.fillRect(M.x, M.y, M.w, M.h);
    // cracked-playa texture
    ctx.strokeStyle = 'rgba(80,40,30,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) { const x = M.x + ((i * 97) % 1000) / 1000 * M.w, y = M.y + ((i * 61) % 1000) / 1000 * M.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 6); ctx.lineTo(x + 20, y - 4); ctx.stroke(); }
    // the city: concentric arcs open toward the deep playa (top), radial streets
    const cx = M.x + M.w * 0.5, cy = M.y + M.h * 0.48, R0 = Math.min(M.w, M.h) * 0.22;
    const A0 = -0.15 * Math.PI, A1 = 1.15 * Math.PI;
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(255,220,180,${0.35 - i * 0.03})`; ctx.lineWidth = i === 0 ? 3 : 2; ctx.beginPath(); ctx.arc(cx, cy, R0 + i * R0 * 0.18, A0, A1, false); ctx.stroke(); }
    for (let k = 0; k <= 8; k++) { const a = A0 + (A1 - A0) * k / 8; ctx.strokeStyle = 'rgba(255,220,180,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); ctx.lineTo(cx + Math.cos(a) * R0 * 1.95, cy + Math.sin(a) * R0 * 1.95); ctx.stroke(); }
    // camps (tiny neon dots)
    for (let i = 0; i < 140; i++) { const a = A0 + (A1 - A0) * ((i * 37) % 100) / 100, r = R0 * (1.05 + ((i * 53) % 100) / 100 * 0.9); ctx.fillStyle = BURNS_NEON[i % 7]; ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 2 + i); ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2); }
    ctx.globalAlpha = 1;
    // gate road from the bottom-right corner
    ctx.strokeStyle = 'rgba(255,230,200,0.35)'; ctx.lineWidth = 5; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(M.x + M.w * 1.02, M.y + M.h * 0.98); ctx.quadraticCurveTo(M.x + M.w * 0.86, M.y + M.h * 0.84, cx + R0 * 1.5, cy + R0 * 1.25); ctx.stroke(); ctx.setLineDash([]);
    // the Man at the centre
    burnsDrawMan2D(ctx, cx, cy + 8, Math.min(0.32, M.h / 900), t, true);
    // path between worlds
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.beginPath();
    this.nodes.filter(n => !n.secret).forEach((n, i) => i ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y)); ctx.stroke(); ctx.setLineDash([]);
    // nodes
    for (const n of this.nodes) {
      const un = !!sv.unlocked[n.id], reg = !!BurnsWorlds.get(n.id), sel = this.sel === n.id, done = !!sv.worldDone[n.id];
      const R0 = this.nodeR || 17, r = sel ? R0 + 4 + Math.sin(t * 5) * 1.5 : R0;
      if (n.secret) { // a glowing RV pin
        ctx.save(); ctx.translate(n.x, n.y); ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 14 + Math.sin(t * 4) * 6; ctx.fillStyle = '#ffd890'; rr(ctx, -r * 1.2, -r * 0.62, r * 2.4, r * 1.15, 6); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-r * 0.95, -r * 0.4, r * 0.5, r * 0.32); ctx.fillRect(-r * 0.3, -r * 0.4, r * 0.5, r * 0.32); ctx.fillStyle = '#2a2224'; ctx.beginPath(); ctx.arc(-r * 0.62, r * 0.55, r * 0.26, 0, TAU); ctx.arc(r * 0.68, r * 0.55, r * 0.26, 0, TAU); ctx.fill();
        if (sel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; rr(ctx, -r * 1.25, -r * 0.67, r * 2.5, r * 1.25, 7); ctx.stroke(); }
        ctx.restore(); BurnsUI.text(ctx, 'SECRET', n.x, n.y + r + 9, 10, '#ffd890', { glow: '#ffb040' }); continue;
      }
      if (n.home) { // Brady's home: a canvas tipi with crossed poles and a warm glowing door
        ctx.save(); ctx.translate(n.x, n.y + r * 0.15);
        if (sel || un) { ctx.shadowColor = un ? '#ffb060' : 'transparent'; ctx.shadowBlur = sel ? 22 : 10 + Math.sin(t * 3) * 3; }
        ctx.fillStyle = un ? '#f0dcae' : '#5a4a5a'; ctx.beginPath(); ctx.moveTo(0, -r * 1.25); ctx.lineTo(r * 1.05, r * 0.85); ctx.lineTo(-r * 1.05, r * 0.85); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.65)'; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
        ctx.strokeStyle = un ? '#7a4a2a' : '#3a2a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.32, -r * 1.65); ctx.lineTo(r * 0.12, -r * 0.95); ctx.moveTo(r * 0.32, -r * 1.65); ctx.lineTo(-r * 0.12, -r * 0.95); ctx.stroke();
        if (un) { ctx.fillStyle = '#c86a3a'; ctx.fillRect(-r * 0.9, r * 0.25, r * 1.8, r * 0.16); ctx.fillStyle = `rgba(255,${190 + 40 * Math.sin(t * 4) | 0},110,0.95)`; ctx.beginPath(); ctx.moveTo(0, r * 0.05); ctx.lineTo(r * 0.36, r * 0.85); ctx.lineTo(-r * 0.36, r * 0.85); ctx.closePath(); ctx.fill(); }
        else BurnsUI.text(ctx, '🔒', 0, r * 0.3, Math.round(R0 * 0.6), '#ffffff', { stroke: false });
        ctx.restore();
        if (un) { const tk = BurnsSave.tokenCount(n.id), tot = BurnsWorlds.tokenTotal(n.id); BurnsUI.text(ctx, reg ? `HOME ${tk}/${tot}` : 'HOME', n.x, n.y + r + 11, R0 < 15 ? 9 : 10, done ? '#7aff5a' : '#ffe0a0'); }
      } else {
      ctx.save();
      if (sel) { ctx.shadowColor = n.col; ctx.shadowBlur = 20; }
      ctx.fillStyle = un ? n.col : '#5a4a5a'; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
      ctx.restore();
      BurnsUI.text(ctx, un ? String(n.n) : '🔒', n.x, n.y + 1, un ? Math.round(R0 * 0.85) : Math.round(R0 * 0.7), un ? '#1a0a1a' : '#ffffff', { stroke: false });
      if (un) { const tk = BurnsSave.tokenCount(n.id), tot = BurnsWorlds.tokenTotal(n.id); BurnsUI.text(ctx, reg ? `${tk}/${tot}` : 'SOON', n.x, n.y + r + 9, R0 < 15 ? 9 : 10, done ? '#7aff5a' : '#ffffff'); }
      }
      // the day of the Burn week above every pin
      if (n.day) BurnsUI.text(ctx, n.day, n.x, n.y - r - (n.home ? 15 : 8), R0 < 15 ? 7.5 : 8.5, un ? '#ffd0f4' : 'rgba(255,255,255,0.45)', { ui: true, sw: 2.5 });
      if (this.newUnlock === n.id && this.t < 3) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${1 - this.t / 3})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(n.x, n.y, 20 + this.t * 30, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; rr(ctx, M.x, M.y, M.w, M.h, 18); ctx.stroke();
  }
  drawPanel(ctx, sv) {
    const P = this.panel, m = BurnsWorlds.meta(this.sel), un = !!sv.unlocked[this.sel], reg = !!BurnsWorlds.get(this.sel);
    UI.panel(ctx, P.x, P.y, P.w, P.h);
    const portrait = Game.cssH > Game.cssW;
    let y = P.y + 22;
    const day = BurnsWorlds.day(this.sel);
    BurnsUI.text(ctx, BurnsWorlds.label(this.sel).toUpperCase() + (day ? '  \u00b7  ' + day.toUpperCase() : ''), P.x + P.w / 2, y, BurnsUI.fitSize(ctx, BurnsWorlds.label(this.sel).toUpperCase() + (day ? '  \u00b7  ' + day.toUpperCase() : ''), 12, P.w - 20), m.col); y += 22;
    ctx.save(); ctx.font = `${Math.min(18, P.w / 12)}px ${FONT_DISPLAY}`; const nl = BurnsUI.wrap(ctx, m.name.toUpperCase(), P.w - 24); ctx.restore();
    nl.forEach(l => { BurnsUI.text(ctx, l, P.x + P.w / 2, y, Math.min(18, P.w / 12), '#ffffff'); y += 22; });
    ctx.save(); ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center';
    BurnsUI.wrap(ctx, m.sub, P.w - 24).forEach(l => { ctx.fillText(l, P.x + P.w / 2, y + 4); y += 16; });
    ctx.restore();
    y += portrait ? 4 : 14;
    if (un && reg) {
      const rows = [['token', `${BurnsSave.tokenCount(this.sel)} / ${BurnsWorlds.tokenTotal(this.sel)} Burn Tokens`], ['photo', `${BurnsSave.photoCount(this.sel)} / 3 Photos of Chinka`], ['glowstick', `Best: ${sv.glowWorld[this.sel] || 0} glow sticks`]];
      const wd = BurnsWorlds.get(this.sel), sideQ = wd ? wd.missions.filter(q => q && q.side) : [];
      if (sideQ.length) rows.splice(1, 0, ['token', `${sideQ.filter(q => (q.token ? BurnsSave.hasToken(this.sel, q.id) : sv.missions[this.sel + ':' + q.id] === 'done')).length} / ${sideQ.length} side quests done`]);
      for (const r of rows) { if (y > this.playBtn.y - 24) break; BurnsUI.icon(ctx, r[0], P.x + 26, y, 20); BurnsUI.text(ctx, r[1], P.x + 44, y, 11, '#ffffff', { align: 'left', ui: true, stroke: false }); y += portrait ? 22 : 26; }
      if (sv.worldDone[this.sel]) BurnsUI.text(ctx, '✓ BOSS DEFEATED', P.x + P.w / 2, Math.min(y + 4, this.playBtn.y - 12), 11, '#7aff5a');
    } else if (!un) { const pv = BurnsWorlds.prev(this.sel); BurnsUI.text(ctx, pv ? `Beat the boss of ${BurnsWorlds.label(pv)} to unlock.` : 'Locked.', P.x + P.w / 2, y + 10, 11, '#ffd84a', { ui: true, stroke: false }); }
    else BurnsUI.text(ctx, 'Coming soon — the burners are building it.', P.x + P.w / 2, y + 10, 11, '#ffd84a', { ui: true, stroke: false });
    this.playBtn.disabled = !(un && reg);
    this.playBtn.label = un && reg ? (BurnsSave.tokenCount(this.sel) ? 'PLAY' : 'START') : un ? 'SOON' : 'LOCKED';
  }
  drawWardrobe(ctx) {
    const W = Game.cssW, H = Game.cssH, sv = BurnsSave.get();
    ctx.fillStyle = 'rgba(6,3,14,0.85)'; ctx.fillRect(0, 0, W, H);
    UI.title(ctx, 'WARDROBE', W / 2, Math.max(36, insets.t + 30), 24);
    for (const b of this.wbtns) {
      if (!b.costume) continue;
      const c = BURNS_COSTUMES.find(k => k.id === b.costume), on = sv.costume === b.costume;
      ctx.save(); ctx.fillStyle = on ? 'rgba(255,79,216,0.35)' : 'rgba(255,255,255,0.08)'; rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
      ctx.strokeStyle = on ? '#ff4fd8' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = on ? 3 : 1; ctx.stroke();
      ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(b.x + 22, b.y + b.h / 2, 12, 0, TAU); ctx.fill();
      BurnsUI.text(ctx, c.name.toUpperCase(), b.x + 42, b.y + b.h / 2 - 9, 10, '#ffffff', { align: 'left' });
      ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left'; ctx.fillText(c.desc, b.x + 42, b.y + b.h / 2 + 10);
      ctx.restore();
    }
    UI.drawButtons(ctx, this.wbtns.filter(b => !b.costume));
  }
}

/* ---------------- exports + test/debug hooks ---------------- */
window.BRADY_BURNS = {
  BurnsHubScene, BurnsPlayScene, BurnsWorlds, BurnsSave, BurnsScenes, BurnsGL,
  BurnsManBoss, BurnsRig, BurnsProps, BurnsMesh, BurnsBehaviors, BURNS_ATLAS,
  debug: {
    scene() { return Game.scene; },
    play(w, opts) { return BurnsScenes.play(w || 1, opts || {}); },
    state() {
      const s = Game.scene; if (!(s instanceof BurnsPlayScene) || !s.player) return { scene: s && s.constructor.name };
      const p = s.player;
      return { scene: 'BurnsPlayScene', state: s.state, world: s.worldId, x: p.x, y: p.y, z: p.z, grounded: p.grounded, hydration: p.hydration, glow: s.glow, power: p.power, tokens: BurnsSave.tokenCount(s.worldId), missions: s.missions.list.map(m => [m.id, m.state, m.n]), boss: s.boss ? { hp: s.boss.hp, st: s.boss.st } : null, cine: !!s.cine, dialog: s.dialog.open, draws: s.stats.draws, cpu: s.stats.cpu, fps: s.stats.fps, q: s.q };
    },
    teleport(x, z, y) { const s = Game.scene; s.player.teleport(x, y === undefined ? s.world.height(x, z) + 0.1 : y, z); s.snapCam = true; },
    give(item) { Game.scene.giveItem(item); },
    power(id) { Game.scene.player.givePower(id); },
    complete(id) { Game.scene.missions.complete(id); },
    skipCine() { const s = Game.scene; if (s.cine) s.cine.skip(); while (s.dialog.open) s.dialog.next(); },
    // run the simulation without rendering (fast-forward)
    sim(sec, input) {
      const s = Game.scene, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (input) { Object.assign(Input, input); Input.recompute && 0; }
        s.update(1 / 120);
        if (k === 0) { Input.jumpPressed = false; Input.actionPressed = false; Input.pausePressed = false; Input.taps.length = 0; Input.uiKey = null; for (const kk in Input.hudPressed) Input.hudPressed[kk] = false; }
      }
    }
  }
};
