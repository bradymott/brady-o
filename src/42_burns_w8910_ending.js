/* ============================================================
   BRADY GOES TO BURNING MAN — the ending (after World 10's Burn)
   BURNS_W8910_END.start(g)  leaves the finale, plays the epilogue
                             (StoryScene panels), then the credits
   BurnsW8910Credits         a credits roll (stats from Save.data.burns,
                             every registered world and its boss), then the
                             secret teaser: "Monday morning... EXODUS", which
                             unlocks the hidden World 15.
   ============================================================ */

const BURNS_W8910_END = {
  start(g) {
    try {
      Input.camDrag = false; Input.hud = null; Input.setMode('ui');
      if (Sound.engine) Sound.engine(false, 0);
      if (g && g.player) g.saveRun();
      if (g) { g.released = true; BurnsScenes.releaseWorld(g); }
    } catch (e) { /* never block the ending */ }
    const sv = BurnsSave.get(); sv.beaten = true; BurnsSave.save();
    Game.setScene(new BurnsW8910Epilogue(this.panels(), () => Game.setScene(new BurnsW8910Credits()), 'burns_ending'));
  },
  // epilogue panels drawn live with the game's 2D art
  panels() {
    const brady = (ctx, x, y, s, t, st, facing) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawBrady(ctx, { x: 0, y: 0, facing: facing || 1, small: false, power: 0, anim: { state: st || 'idle', t, phase: t * 12, speed: 1 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); };
    const chinka = (ctx, x, y, s, t, pose, facing) => drawChinka(ctx, { x, y, scale: s, t, pose, facing: facing || -1 });
    const embers = (ctx, x, y, s, t, n) => { for (let i = 0; i < n; i++) { const k = (t * 0.35 + i / n) % 1, a = i * 2.39; ctx.fillStyle = `rgba(255,${140 + (i % 3) * 40},60,${(1 - k) * 0.9})`; ctx.beginPath(); ctx.arc(x + Math.sin(a + t) * 30 * s * k + Math.cos(a) * 20 * s, y - k * 120 * s, (1.6 + (i % 3)) * s * 0.6, 0, TAU); ctx.fill(); } };
    const pile = (ctx, x, y, s, t) => {
      ctx.save(); ctx.translate(x, y);
      const g = ctx.createRadialGradient(0, -6 * s, 4, 0, -6 * s, 70 * s); g.addColorStop(0, 'rgba(255,150,60,0.55)'); g.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = g; ctx.fillRect(-80 * s, -80 * s, 160 * s, 90 * s);
      ctx.fillStyle = '#2a1a18'; ctx.beginPath(); ctx.moveTo(-60 * s, 0); ctx.quadraticCurveTo(-30 * s, -34 * s, 0, -30 * s); ctx.quadraticCurveTo(34 * s, -30 * s, 62 * s, 0); ctx.fill();
      for (let i = 0; i < 9; i++) { const a = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7); ctx.fillStyle = `rgba(255,${110 + i * 12},40,${a})`; ctx.beginPath(); ctx.ellipse((i - 4) * 12 * s, -8 * s - Math.abs(i - 4) * -2 * s - 10 * s, 6 * s, 3 * s, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      embers(ctx, x, y - 20 * s, s, t, 18);
    };
    return [
      { text: 'Sunday morning. The Man is a warm pile of embers, and somebody is already making pancakes on it.',
        scene(ctx, W, H, t) { const gy = burnsStoryBG(ctx, W, H, t, '#2a2a5a', '#ffb07a'); const s = Math.min(2.4, H / 160); pile(ctx, W * 0.62, gy + 6, s * 0.9, t); brady(ctx, W * 0.28, gy + 26, s, t, 'idle', 1); chinka(ctx, W * 0.28 + 26 * s, gy + 26, s, t, 'idle', -1); } },
      { text: 'Everyone came by. Rusty brought warm coffee. The Fence Bots said beep. Captain Prudence swept the ashes into a labeled bag.',
        scene(ctx, W, H, t) {
          const gy = burnsStoryBG(ctx, W, H, t, '#3a4a8a', '#ffc890'); const s = Math.min(2.4, H / 160);
          const cols = ['#ff8a1a', '#c8ccd4', '#ffd21a', '#ff4fd8', '#38f2ff', '#7aff5a', '#ff9ad0'];
          for (let i = 0; i < 7; i++) { const x = W * (0.12 + i * 0.125), y = gy + 18 + (i % 2) * 6, b = Math.abs(Math.sin(t * 3 + i)) * 4; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.ellipse(x, y - 22 * s * 0.6 - b, 7 * s * 0.6, 12 * s * 0.6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 40 * s * 0.6 - b, 6 * s * 0.6, 0, TAU); ctx.fill(); ctx.strokeStyle = cols[i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 5, y - 30 * s * 0.6 - b); ctx.lineTo(x + 12, y - 44 * s * 0.6 - b + Math.sin(t * 8 + i) * 3); ctx.stroke(); }
          brady(ctx, W * 0.45, gy + 34, s, t, 'victory', 1); chinka(ctx, W * 0.45 + 26 * s, gy + 34, s, t, 'cheer', -1);
        } },
      { text: 'Then Brady and Chinka rode one yellow bike, very slowly, toward the sunrise. Same time next year. Same time next year.',
        scene(ctx, W, H, t, pt) {
          const gy = burnsStoryBG(ctx, W, H, t, '#4a5aa0', '#ffd0a0'); const s = Math.min(2.4, H / 160);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sun = ctx.createRadialGradient(W * 0.78, gy - 8, 4, W * 0.78, gy - 8, H * 0.5); sun.addColorStop(0, 'rgba(255,220,150,0.9)'); sun.addColorStop(0.2, 'rgba(255,170,90,0.4)'); sun.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H); ctx.restore();
          const x = W * 0.2 + Math.min(1, pt / 9) * W * 0.4;
          ctx.save(); ctx.translate(x, gy + 24); ctx.scale(s, s);
          ctx.strokeStyle = '#ffd21a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(-14, -8, 8, 0, TAU); ctx.arc(14, -8, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(0, -22); ctx.lineTo(14, -8); ctx.moveTo(0, -22); ctx.lineTo(-4, -8); ctx.stroke();
          drawBrady(ctx, { x: 2, y: -18, facing: 1, small: false, power: 0, anim: { state: 'ride', t, phase: t * 8 }, hair: null, look: Save.data.look, time: t });
          ctx.restore();
          chinka(ctx, x - 12 * s, gy + 6, s * 0.95, t, 'wave', 1);
          for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(255,90,150,${1 - k})`; ctx.font = `${14 + i * 4}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('♥', x + Math.sin(t * 2 + i) * 10, gy - 40 * s - k * 50); }
        } }
    ];
  }
};

/* ---------------- the epilogue: the shared story pages, but the last tap leads on to the credits ---------------- */
class BurnsW8910Epilogue extends StoryScene {
  draw(ctx) {
    // (StoryScene labels its last page "TAP TO START", which reads oddly at the end of the game)
    const own = Object.prototype.hasOwnProperty.call(ctx, 'fillText'), f = ctx.fillText;
    ctx.fillText = function (txt, x, y, w) { return w === undefined ? f.call(this, txt === 'TAP TO START' ? 'TAP TO CONTINUE' : txt, x, y) : f.call(this, txt === 'TAP TO START' ? 'TAP TO CONTINUE' : txt, x, y, w); };
    try { super.draw(ctx); } finally { if (own) ctx.fillText = f; else delete ctx.fillText; }
  }
}

/* ---------------- a glowing, extruded title (the game's logo style) for any text, shrunk to fit ---------------- */
function burnsW8910Title(ctx, txt, x, y, size, t, maxW) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${size}px ${FONT_DISPLAY}`;
  const w = ctx.measureText(txt).width;
  if (maxW && w > maxW) { size *= maxW / w; ctx.font = `${size}px ${FONT_DISPLAY}`; }
  const wob = Math.sin(t * 2) * 2, e = size / 52;
  ctx.shadowColor = 'rgba(255,79,216,0.9)'; ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = '#ff4fd8'; ctx.fillText(txt, x, y + wob);
  ctx.shadowBlur = 0;
  for (let i = 6; i > 0; i--) { ctx.fillStyle = `rgba(${40 + i * 10},10,${60 + i * 12},1)`; ctx.fillText(txt, x + i * 0.8 * e, y + wob + i * 1.4 * e); }
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffe8fb'); g.addColorStop(0.5, '#ff9ae8'); g.addColorStop(1, '#8a3aff');
  ctx.fillStyle = g; ctx.fillText(txt, x, y + wob);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeText(txt, x, y + wob);
  ctx.restore();
}

/* ---------------- fireworks sparks for the credits sky (self-contained: the 3D app ships without the 2D game's particles) ---------------- */
class BurnsW8910Sparks {
  constructor() { this.p = []; }
  burst(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 40 + Math.random() * 110; this.p.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.9 + Math.random() * 0.8, col, r: 1.6 + Math.random() * 1.6 }); }
    if (this.p.length > 600) this.p.splice(0, this.p.length - 600);
  }
  update(dt) {
    for (const q of this.p) { q.t += dt; q.vy += 60 * dt; const k = 1 - Math.min(0.9, dt * 0.9); q.vx *= k; q.vy *= k; q.x += q.vx * dt; q.y += q.vy * dt; }
    this.p = this.p.filter(q => q.t < q.life);
  }
  draw(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const q of this.p) { ctx.globalAlpha = Math.max(0, 1 - q.t / q.life); ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------------- the credits roll + the secret teaser ---------------- */
class BurnsW8910Credits {
  constructor() {
    this.t = 0; this.stage = 'roll'; this.st = 0; this.parts = new BurnsW8910Sparks();
    Input.setMode('ui');
    const sv = BurnsSave.get();
    const order = (BurnsWorlds.order || BURNS_WORLD_META.map(m => m.id)).filter(id => BurnsWorlds.get(id));
    let tokens = 0, tokTot = 0; for (const id of order) { tokens += BurnsSave.tokenCount(id); tokTot += BurnsWorlds.tokenTotal(id); }
    const photos = order.reduce((n, id) => n + BurnsSave.photoCount(id), 0);
    const label = id => (BurnsWorlds.label ? BurnsWorlds.label(id) : 'World ' + id);
    const bosses = [];
    for (const id of order) { const d = BurnsWorlds.get(id); const b = (d.missions || []).filter(m => m.type === 'boss').map(m => m.name); for (const n of b) if (bosses.indexOf(n) < 0) bosses.push(n); }
    this.lines = [
      ['BRADY GOES TO', 'h2'], ['BURNING MAN', 'h'], ['', ''], ['Chinka is safe. The Man burned. Everybody hydrated. Mostly.', 's'], ['', ''],
      ['STARRING', 'k'], ['Brady  ·  man bun, broken heart, unbreakable', 'v'], ['Chinka  ·  the actual hero, honestly', 'v'], ['The Man  ·  a very big, very silly effigy', 'v'], ['El Pulpo  ·  a fire-breathing octopus with a full tank', 'v'], ['', ''],
      ['THE ROAD TO THE BURN', 'k'], ...order.map(id => [`${label(id)}  ·  ${BurnsWorlds.get(id).name}`, 'v']), ['', ''],
      ['BOSSES (NOBODY WAS HARMED. SOME WERE HUGGED.)', 'k'], ...bosses.map(n => [n, 'v']), ['', ''],
      ['BURNERS MET ALONG THE WAY', 'k'], ['Greeters who hug like they mean it', 'v'], ['DPW, who have not showered since July', 'v'], ['Captain Prudence, Safety Third', 'v'], ['Bad Idea Burt, still nailing it', 'v'], ['The lamplighters, who light the way', 'v'], ['Two robots at the trash fence (unconfirmed)', 'v'], ['Darkwads (you didn\'t see them)', 'v'], ['Sparkle ponies, tech bros, healers, billionaires, crusties', 'v'], ['and the whole glowing crowd', 'v'], ['', ''],
      ['YOUR BURN', 'k'], [`Burn Tokens  ${tokens} / ${tokTot}`, 'v'], [`Photos of Chinka  ${photos} / ${order.length * 3}`, 'v'], [`Glow sticks banked  ${sv.glow || 0}`, 'v'], ['', ''],
      ['Leave no trace. Hug your sloth. Hydrate.', 's'], ['', ''], ['', ''],
      ['THANKS FOR PLAYING', 'h']
    ];
    this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH, pad = Math.max(14, insets.r + 8), bot = H - Math.max(14, insets.b + 8);
    if (this.stage === 'roll') this.btns = [{ x: W - pad - 110, y: bot - 42, w: 110, h: 40, label: 'SKIP ▶▶', fn: () => this.toTeaser() }];
    else if (this.stage === 'teaser' && this.st > 4.2) this.btns = [{ x: W / 2 - 190, y: bot - 50, w: 180, h: 44, label: 'PLAYA MAP', primary: true, fn: () => Game.setScene(new BurnsHubScene({})) }, { x: W / 2 + 10, y: bot - 50, w: 180, h: 44, label: 'TITLE', fn: () => Game.setScene(new TitleScene()) }];
    else this.btns = [];
  }
  resize() { this.build(); }
  toTeaser() {
    if (this.stage === 'teaser') return;
    this.stage = 'teaser'; this.st = 0; this.build();
    burnsMusic(null);
    BurnsSave.unlockWorld(15); BurnsSave.flag(10, 'exodus', true);
  }
  update(dt) {
    this.t += dt; this.st += dt; this.parts.update(dt);
    if (this.stage === 'roll') {
      if (Math.random() < 0.06) this.parts.burst(Math.random() * Game.cssW, Game.cssH * (0.08 + Math.random() * 0.3), 30, BURNS_NEON[Math.floor(Math.random() * 7)]);
      if (this.done) this.toTeaser();
    } else if (this.st > 4.2 && !this.btns.length) this.build();
    const hit = UI.hitButtons(this.btns); if (hit) hit.fn();
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, t = this.t;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    if (this.stage === 'teaser') { this.drawTeaser(ctx, W, H); UI.drawButtons(ctx, this.btns); return; }
    // the night of the Burn: sky, stars, the burning Man on the horizon
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07040f'); g.addColorStop(0.7, '#2a1024'); g.addColorStop(1, '#5a2418'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const a = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.7 + i * 1.3)); ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`; ctx.fillRect((i * 131.7) % W, (i * 57.3) % (H * 0.6), 1.4, 1.4); }
    const gy = H * 0.86, mx = W * 0.5, s = Math.min(1.1, H / 520);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const glow = ctx.createRadialGradient(mx, gy - 90 * s, 10, mx, gy - 90 * s, H * 0.55); glow.addColorStop(0, `rgba(255,140,50,${0.5 + 0.1 * Math.sin(t * 7)})`); glow.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H); ctx.restore();
    burnsDrawMan2D(ctx, mx, gy, s, t, true);
    for (let i = 0; i < 26; i++) { const k = (t * 0.6 + i / 26) % 1, x = mx + Math.sin(i * 2.1 + t) * 40 * s * (1 - k * 0.5), y = gy - k * 230 * s; ctx.fillStyle = `rgba(255,${150 + (i % 4) * 25},60,${(1 - k) * 0.85})`; ctx.beginPath(); ctx.ellipse(x, y, (8 - k * 6) * s, (16 - k * 12) * s, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#120a10'; ctx.beginPath(); ctx.moveTo(0, gy); for (let x = 0; x <= W; x += 14) ctx.lineTo(x, gy - 6 - Math.abs(Math.sin(x * 0.07)) * 9 - (x % 28 === 0 ? 6 : 0)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    this.parts.draw(ctx);
    ctx.fillStyle = 'rgba(6,4,14,0.4)'; ctx.fillRect(0, 0, W, H);
    // the roll
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = H + 20 - t * 38;
    for (const [txt, k] of this.lines) {
      if (y > -40 && y < H + 40) {
        if (k === 'h' || k === 'h2') burnsW8910Title(ctx, txt, W / 2, y, k === 'h' ? Math.min(52, W * 0.1) : Math.min(30, W * 0.06), t, W * 0.9);
        else {
          // one line each, shrunk to fit a narrow (portrait) screen
          const base = k === 'k' ? 13 : k === 's' ? 15 : 16, fam = k === 'k' ? FONT_DISPLAY : FONT_UI, sty = k === 's' ? 'italic ' : '';
          ctx.font = `${sty}${base}px ${fam}`;
          const tw = ctx.measureText(txt).width, max = W * 0.92;
          if (tw > max) ctx.font = `${sty}${Math.max(9, base * max / tw).toFixed(1)}px ${fam}`;
          ctx.fillStyle = k === 'k' ? '#ffd84a' : '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6; ctx.fillText(txt, W / 2, y); ctx.shadowBlur = 0;
        }
      }
      y += k === 'h' ? 80 : k === 'h2' ? 46 : 30;
    }
    ctx.restore();
    if (y < -60) this.done = true;
    UI.drawButtons(ctx, this.btns);
  }
  drawTeaser(ctx, W, H) {
    const st = this.st;
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    // dawn creeping over an empty playa and a long, long line of tail lights
    const k = clamp((st - 1.6) / 2.5, 0, 1);
    if (k > 0) {
      const g = ctx.createLinearGradient(0, H * 0.3, 0, H); g.addColorStop(0, `rgba(30,30,70,${k})`); g.addColorStop(0.6, `rgba(255,160,110,${k * 0.6})`); g.addColorStop(0.62, `rgba(90,60,60,${k})`); g.addColorStop(1, `rgba(40,24,24,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) { const x = (i / 60) * W * 1.2 - (st * 6) % (W / 30), y = H * 0.62 + 2 + (i % 2); ctx.fillStyle = `rgba(255,40,40,${k * (0.5 + 0.5 * Math.sin(st * 3 + i))})`; ctx.fillRect(x, y, 3, 2); }
    }
    const a1 = clamp(st / 1.2, 0, 1) * (1 - clamp((st - 3.2) / 0.8, 0, 1) * 0.5);
    BurnsUI.text(ctx, 'Monday morning…', W / 2, H * 0.3, Math.min(26, W / 18), `rgba(255,255,255,${a1})`, { ui: true, stroke: false });
    if (st > 2.6) {
      const a2 = clamp((st - 2.6) / 0.8, 0, 1);
      ctx.save(); ctx.globalAlpha = a2; BurnsUI.text(ctx, 'EXODUS', W / 2, H * 0.45, Math.min(64, W / 7), '#ffd84a', { glow: '#ff7a2a' }); ctx.restore();
    }
    if (st > 3.6) {
      const a3 = clamp((st - 3.6) / 0.8, 0, 1);
      ctx.save(); ctx.globalAlpha = a3; BurnsUI.text(ctx, 'A secret world has appeared on the playa map.', W / 2, H * 0.56, 13, '#ffffff', { ui: true, stroke: false }); BurnsUI.text(ctx, 'The line out is longer than the line in.', W / 2, H * 0.6, 12, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); ctx.restore();
    }
  }
}
