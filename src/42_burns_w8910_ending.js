/* ============================================================
   BRADY GOES TO BURNING MAN — the ending (after World 10's Burn)
   BURNS_W8910_END.start(g)  leaves the finale and plays the epilogue: three
                             story cards on the engine's BurnsStoryScene (3D skies
                             over the playa: dawn, afternoon, first light)
   BurnsW8910Credits         the credits roll (stats from Save.data.burns, every
                             registered world and its boss), then the secret
                             teaser "Monday morning... EXODUS", which unlocks the
                             hidden World 15.
   Engine-only: nothing here uses the 2D game's modules (src/03-27).
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
    Game.setScene(new BurnsW8910Epilogue());
  },
  // the epilogue beats, as story cards ({ day, title, line, pal: [sky, sky2, tod], man, rv })
  cards() {
    return [
      { day: 'Sunday morning', title: 'After the Burn', pal: ['night', 'dawn', 0.7], man: false, embers: true,
        line: 'The Man is a warm pile of embers, and somebody is already making pancakes on it.' },
      { day: 'Sunday afternoon', title: 'Everyone came by', pal: ['dawn', 'day', 0.8], man: false,
        line: 'Rusty brought warm coffee. The Fence Bots said beep. Captain Prudence swept the ashes into a labeled bag.' },
      { day: 'Monday, first light', title: 'Same time next year', pal: ['night', 'dawn', 0.85], man: false, rv: true,
        line: 'Then Brady and Chinka rode one yellow bike, very slowly, toward the sunrise. Same time next year.' }
    ];
  }
};

/* ---------------- the epilogue: the engine's story cards; the last tap leads on to the credits ---------------- */
class BurnsW8910Epilogue extends BurnsStoryScene {
  constructor() { super({ cards: BURNS_W8910_END.cards(), music: 'burns_ending', then: () => Game.setScene(new BurnsW8910Credits()) }); }
  draw(ctx) {
    super.draw(ctx);
    // the morning after: where the Man stood, a low glow and embers drifting up from the horizon
    const c = this.cards[this.ci]; if (!c || !c.embers) return;
    const W = Game.cssW, H = Game.cssH, t = this.t, x = W * 0.5, y = H * 0.66, s = Math.min(1, H / 520);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(x, y, 2, x, y, 90 * s); gl.addColorStop(0, `rgba(255,140,60,${0.45 + 0.08 * Math.sin(t * 5)})`); gl.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - 100 * s, y - 100 * s, 200 * s, 110 * s);
    for (let i = 0; i < 16; i++) { const k = (t * 0.22 + i / 16) % 1; ctx.fillStyle = `rgba(255,${150 + (i % 3) * 35},70,${(1 - k) * 0.85})`; ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.4 + t * 0.8) * 26 * s * (0.4 + k), y - 4 - k * 110 * s, (1.4 + (i % 3) * 0.6) * s, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------------- fireworks sparks for the credits sky ---------------- */
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
    // (the secret world stays a secret until the teaser)
    const order = (BurnsWorlds.order || BURNS_WORLD_META.map(m => m.id)).filter(id => BurnsWorlds.get(id) && !BurnsWorlds.get(id).hidden && !(BurnsWorlds.isSecret && BurnsWorlds.isSecret(id)));
    let tokens = 0, tokTot = 0; for (const id of order) { tokens += BurnsSave.tokenCount(id); tokTot += BurnsWorlds.tokenTotal(id); }
    const photos = order.reduce((n, id) => n + BurnsSave.photoCount(id), 0);
    const bosses = [];
    for (const id of order) { const d = BurnsWorlds.get(id); const b = (d.missions || []).filter(m => m.type === 'boss').map(m => m.name); for (const n of b) if (bosses.indexOf(n) < 0) bosses.push(n); }
    this.lines = [
      ['BRADY GOES TO', 'h2'], ['BURNING MAN', 'h'], ['', ''], ['Chinka is safe. The Man burned. Everybody hydrated. Mostly.', 's'], ['', ''],
      ['STARRING', 'k'], ['Brady  ·  man bun, broken heart, unbreakable', 'v'], ['Chinka  ·  the actual hero, honestly', 'v'], ['The Man  ·  a very big, very silly effigy', 'v'], ['El Pulpo  ·  a fire-breathing octopus with a full tank', 'v'], ['', ''],
      ['THE ROAD TO THE BURN', 'k'], ...order.map(id => [`${BurnsWorlds.label(id)}  ·  ${BurnsWorlds.get(id).name}`, 'v']), ['', ''],
      ['BOSSES (NOBODY WAS HARMED. SOME WERE HUGGED.)', 'k'], ...bosses.map(n => [n, 'v']), ['', ''],
      ['BURNERS MET ALONG THE WAY', 'k'], ['Greeters who hug like they mean it', 'v'], ['DPW, who have not showered since July', 'v'], ['Captain Prudence, Safety Third', 'v'], ['Bad Idea Burt, still nailing it', 'v'], ['The lamplighters, who light the way', 'v'], ['Two robots at the trash fence (unconfirmed)', 'v'], ['Darkwads (you didn\'t see them)', 'v'], ['Sparkle ponies, tech bros, healers, billionaires, crusties', 'v'], ['and the whole glowing crowd', 'v'], ['', ''],
      ['YOUR BURN', 'k'], [`Burn Tokens  ${tokens} / ${tokTot}`, 'v'], [`Photos of Chinka  ${photos} / ${order.length * 3}`, 'v'], [`Glow sticks banked  ${sv.glow || 0}`, 'v'], ['', ''],
      ['Leave no trace. Hug your sloth. Hydrate.', 's'], ['', ''], ['', ''],
      ['THANKS FOR PLAYING', 'h']
    ];
    this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), bot = H - S.b;
    if (this.stage === 'roll') this.btns = [{ x: W - S.r - 110, y: bot - 42, w: 110, h: 40, label: 'SKIP ▶▶', fn: () => this.toTeaser() }];
    else if (this.stage === 'teaser' && this.st > 4.2) { const bw = Math.min(180, (W - 40) / 2); this.btns = [{ x: W / 2 - bw - 10, y: bot - 50, w: bw, h: 44, label: 'PLAYA MAP', primary: true, fn: () => Game.setScene(new BurnsHubScene({})) }, { x: W / 2 + 10, y: bot - 50, w: bw, h: 44, label: 'TITLE', fn: () => burnsToTitle() }]; }
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
    const hit = BurnsUIKit.hitButtons(this.btns); if (hit) hit.fn();
  }
  // one credits line, drawn with the engine's UI text (the header in the app's logo style), shrunk to fit
  line(ctx, txt, k, x, y, W, t) {
    if (k === 'h') { const s = BurnsUI.fitSize(ctx, txt, Math.min(56, W * 0.11), W * 0.9); BurnsUI.text(ctx, txt, x, y + Math.sin(t * 2) * 2, s, '#ffffff', { glow: '#ff4fd8' }); return; }
    if (k === 'h2') { const s = BurnsUI.fitSize(ctx, txt, Math.min(30, W * 0.065), W * 0.9); BurnsUI.text(ctx, txt, x, y, s, '#ffd84a', { glow: '#ff9a2a' }); return; }
    if (k === 'k') { BurnsUI.text(ctx, txt, x, y, BurnsUI.fitSize(ctx, txt, 13, W * 0.92), '#ffd84a', { stroke: false }); return; }
    const size = k === 's' ? 15 : 16;
    BurnsUI.text(ctx, txt, x, y, BurnsUI.fitSize(ctx, txt, size, W * 0.92, true), k === 's' ? '#ffe8f6' : '#ffffff', { ui: true, stroke: false });
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, t = this.t;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    if (this.stage === 'teaser') { this.drawTeaser(ctx, W, H); BurnsUIKit.drawButtons(ctx, this.btns); return; }
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
    let y = H + 20 - t * 38;
    for (const [txt, k] of this.lines) {
      if (txt && y > -40 && y < H + 40) this.line(ctx, txt, k, W / 2, y, W, t);
      y += k === 'h' ? 80 : k === 'h2' ? 46 : 30;
    }
    if (y < -60) this.done = true;
    BurnsUIKit.drawButtons(ctx, this.btns);
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
      ctx.save(); ctx.globalAlpha = a3; BurnsUI.text(ctx, 'A secret world has appeared on the playa map.', W / 2, H * 0.56, BurnsUI.fitSize(ctx, 'A secret world has appeared on the playa map.', 13, W - 32, true), '#ffffff', { ui: true, stroke: false }); BurnsUI.text(ctx, 'The line out is longer than the line in.', W / 2, H * 0.6, 12, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); ctx.restore();
    }
  }
}
