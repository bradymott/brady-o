/* ============================================================
   Play scene — running a level
   ============================================================ */
class Particles {
  constructor() { this.list = []; }
  add(p) { if (this.list.length > 450) this.list.shift(); this.list.push(p); }
  burst(x, y, n, col, type) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = Math.random();
      const p = { x, y, vx: Math.cos(a) * s * 140, vy: Math.sin(a) * s * 140, life: 0.5 + Math.random() * 0.4, max: 0, col, type, size: 2 + Math.random() * 2.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, g: 0 };
      if (type === 'dust') { p.vy = -Math.random() * 50; p.vx = (Math.random() - 0.5) * 90; p.size = 3 + Math.random() * 4; p.life = 0.35 + Math.random() * 0.3; }
      if (type === 'debris') { p.vy = -200 - Math.random() * 220; p.vx = (Math.random() - 0.5) * 260; p.g = 900; p.size = 5 + Math.random() * 4; p.life = 1.2; }
      if (type === 'confetti') { p.vy = -150 - Math.random() * 200; p.vx = (Math.random() - 0.5) * 300; p.g = 400; p.size = 3 + Math.random() * 3; p.life = 1.4; p.col = `hsl(${Math.random() * 360},90%,65%)`; }
      if (type === 'bubble') { p.vy = -40 - Math.random() * 40; p.vx = (Math.random() - 0.5) * 30; p.life = 1.4; p.size = 2 + Math.random() * 3; }
      if (type === 'spark') { p.g = 200; }
      if (type === 'firework') { const sp = 120 + Math.random() * 120; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.g = 120; p.life = 1.1 + Math.random() * 0.5; p.size = 2.5; }
      p.max = p.life;
      this.add(p);
    }
  }
  text(x, y, str, col) { this.add({ x, y, vx: 0, vy: -50, life: 0.9, max: 0.9, type: 'text', str, col: col || '#ffffff', g: 0 }); }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) { L.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'dust') { p.vx *= 0.92; p.size += dt * 6; }
      if (p.type === 'bubble') p.x += Math.sin(p.life * 10) * 0.4;
      if (p.rot !== undefined) p.rot += p.vr * dt;
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const k = p.life / p.max;
      if (p.type === 'text') {
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(p.str, p.x + 1, p.y + 1);
        ctx.fillStyle = p.col; ctx.fillText(p.str, p.x, p.y);
        continue;
      }
      ctx.globalAlpha = k;
      if (p.type === 'dust') { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
      else if (p.type === 'debris' || p.type === 'confetti') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.type === 'confetti' ? p.size * 0.5 : p.size); ctx.restore(); }
      else if (p.type === 'bubble') { ctx.strokeStyle = 'rgba(220,250,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.stroke(); }
      else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
}

/* ambient weather particles per theme */
class Weather {
  constructor(kind) { this.kind = kind; this.list = []; this.n = { fireflies: 26, neonrain: 70, leaves: 22, snow: 70, sand: 50, bubbles: 30, sparks: 20, rain: 90, embers: 40, motes: 36, glitch: 14, confetti: 30, petals: 30, dust: 24 }[kind] || 0; }
  reset(cx, cy, w, h) { this.list = []; for (let i = 0; i < this.n; i++) this.list.push(this.spawn(cx + Math.random() * w, cy + Math.random() * h, true)); }
  spawn(x, y) {
    const k = this.kind;
    const p = { x, y, vx: 0, vy: 0, s: 1 + Math.random() * 2, ph: Math.random() * TAU, a: 0.4 + Math.random() * 0.6 };
    if (k === 'snow') { p.vy = 30 + Math.random() * 40; p.vx = -10 - Math.random() * 20; }
    else if (k === 'rain' || k === 'neonrain') { p.vy = 520 + Math.random() * 200; p.vx = -80; p.s = 8 + Math.random() * 10; }
    else if (k === 'leaves' || k === 'petals') { p.vy = 25 + Math.random() * 25; p.vx = -20 - Math.random() * 30; p.s = 3 + Math.random() * 2; }
    else if (k === 'sand') { p.vx = -160 - Math.random() * 120; p.vy = 10 + Math.random() * 10; }
    else if (k === 'bubbles') { p.vy = -30 - Math.random() * 40; }
    else if (k === 'embers' || k === 'sparks') { p.vy = -30 - Math.random() * 50; p.vx = (Math.random() - 0.5) * 30; }
    else if (k === 'confetti') { p.vy = 40 + Math.random() * 40; p.vx = (Math.random() - 0.5) * 40; p.col = `hsl(${Math.random() * 360},90%,65%)`; }
    else if (k === 'motes' || k === 'fireflies' || k === 'dust') { p.vx = (Math.random() - 0.5) * 12; p.vy = (Math.random() - 0.5) * 12; }
    return p;
  }
  update(dt, cx, cy, w, h, t) {
    for (const p of this.list) {
      p.ph += dt;
      p.x += (p.vx + (this.kind === 'fireflies' || this.kind === 'motes' ? Math.sin(p.ph * 0.9) * 14 : 0)) * dt;
      p.y += (p.vy + (this.kind === 'fireflies' ? Math.cos(p.ph * 1.3) * 10 : 0)) * dt;
      if (this.kind === 'leaves' || this.kind === 'petals' || this.kind === 'snow') p.x += Math.sin(p.ph * 2) * 0.5;
      if (p.x < cx - 40) p.x += w + 80; if (p.x > cx + w + 40) p.x -= w + 80;
      if (p.y < cy - 40) p.y += h + 80; if (p.y > cy + h + 40) p.y -= h + 80;
    }
  }
  draw(ctx, t) {
    const k = this.kind;
    for (const p of this.list) {
      if (k === 'snow') { ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }
      else if (k === 'rain' || k === 'neonrain') { ctx.strokeStyle = k === 'rain' ? 'rgba(200,210,255,0.35)' : (p.s > 13 ? 'rgba(255,90,220,0.35)' : 'rgba(80,240,255,0.3)'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.s * 0.15, p.y + p.s); ctx.stroke(); }
      else if (k === 'fireflies' || k === 'motes') {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(p.ph * 1.7));
        const c = k === 'fireflies' ? '255,240,140' : '200,150,255';
        ctx.fillStyle = `rgba(${c},${a * 0.25})`; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, TAU); ctx.fill();
      }
      else if (k === 'leaves' || k === 'petals') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph * 2); ctx.fillStyle = k === 'leaves' ? (p.s > 4 ? '#c8a03a' : '#7ab04a') : '#ffc0d8'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (k === 'sand') { ctx.fillStyle = 'rgba(255,220,160,0.5)'; ctx.fillRect(p.x, p.y, 3, 1); }
      else if (k === 'bubbles') { ctx.strokeStyle = 'rgba(200,240,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.s + 1, 0, TAU); ctx.stroke(); }
      else if (k === 'embers' || k === 'sparks') { ctx.fillStyle = k === 'embers' ? `rgba(255,${120 + Math.floor(p.a * 100)},40,${p.a})` : `rgba(255,220,120,${p.a})`; ctx.fillRect(p.x, p.y, 2, 2); }
      else if (k === 'confetti') { ctx.fillStyle = p.col; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph * 3); ctx.fillRect(-2, -1, 4, 2); ctx.restore(); }
      else if (k === 'glitch') { if (Math.sin(p.ph * 7) > 0.3) { ctx.fillStyle = Math.sin(p.ph) > 0 ? 'rgba(255,0,212,0.35)' : 'rgba(0,255,154,0.35)'; ctx.fillRect(p.x, p.y, 12 + p.s * 10, 3); } }
      else if (k === 'dust') { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }
    }
  }
}

class Play {
  constructor(level, opts) {
    opts = opts || {};
    this.level = level; this.id = level.id;
    this.set = 'world';
    this.rt = [];
    this.keys = new Set(); this.lampsLit = 0; this.chaseT = 4; this.strobeT = 0; this.flash = 0; this.beatClock = 0;
    this.t = 0; this.parts = new Particles();
    this.chain = 0; this.flash = 0; this.shakeAmt = 0; this.happyT = 0;
    this.timeLeft = level.time; this.hurry = false;
    this.picks = Save.data.picks || 0;
    this.checkpoint = opts.checkpoint || null;
    this.state = 'intro'; this.stateT = 0;
    this.paused = false; this.pauseUI = null;
    this.boss = null; this.bossLock = null;
    this.goldHadAtStart = (Save.data.gold[this.id] || [false, false, false]).slice();
    this.fade = { a: 1, target: 0, speed: 3, cb: null, iris: true };
    this.windForce = 0; this.windT = 0;
    const start = this.checkpoint || level.start;
    const gifts = Save.data.gifts || {};
    this.sigCarry = opts.sig || null; this.dizzy = 0;
    // atlas memory: keep only what this level draws (its country's and its areas' themes); drop the rest
    if (typeof Atlas !== 'undefined') Atlas.keep(this.atlasNames());
    // Hydration Station's gift: Brady always starts big (one more health step)
    this.loadArea(start.area, start.x, start.y, Math.max(opts.power || 0, gifts.hydration ? 1 : 0));
    this.camX = clamp(this.player.cx - Game.viewW * 0.4, 0, Math.max(0, this.area.W * TS - Game.viewW));
    this.camY = this.camTargetY(true);
    this.weather.reset(this.camX, this.camY, Game.viewW, Game.viewH);
    Input.setMode('game');
    Sound.setTempoBoost(false);
    this.mus(this.area.music);
  }

  /* ---------- area management ---------- */
  makeRuntimeArea(idx) {
    const src = this.level.areas[idx];
    const a = Object.assign({}, src);
    a.tiles = new Uint8Array(src.tiles);
    if (src.hide) a.hide = new Uint8Array(src.hide);   // runtime changes (e.g. mime blocks) stay out of the cached level
    a.contents = Object.assign({}, src.contents);
    a.multi = {}; a.bumps = []; a.crumbles = []; a.idx = idx;
    a.zones = (src.zones || []).map(z => Object.assign({}, z));
    a.beatState = {};
    computeVariants(a);
    this.area = a;
    a.entities = [];
    this.loadingEntities = a.entities;
    for (const s of src.spawns) {
      const C = ENTITY_TYPES[s.type];
      if (!C) continue;
      try { a.entities.push(new C(this, s)); } catch (e) { console.warn('spawn failed', s.type, e); }
    }
    this.loadingEntities = null;
    a.lavaY = a.H * TS + 40;
    return a;
  }
  loadArea(idx, x, y, power) {
    if (!this.rt[idx]) this.rt[idx] = this.makeRuntimeArea(idx);
    this.area = this.rt[idx];
    this.entities = this.area.entities;
    this.themeKey = this.area.theme;
    // pre-rendered art for this theme and country (draws procedurally until it arrives)
    if (typeof Atlas !== 'undefined') { const th = THEMES[this.themeKey]; Atlas.need([th && th.atlas, this.countryAtlas()]); }
    this.lavaY = this.area.lavaY;
    const keepPower = this.player ? this.player.power : (power || 0);
    this.player = new Player(this, x, y, keepPower);
    this.weather = new Weather(THEMES[this.themeKey].particles);
    this.boss = this.entities.find(e => e.boss && !e.remove) || null;
    this.refreshPlatforms();
  }
  countryAtlas() { const C = this.level && this.level.country && typeof Tour !== 'undefined' ? Tour.countries[this.level.country] : null; return C ? C.atlas || (C.sprites ? C.id : null) : null; }
  // every atlas this level can draw from: the country's, and each area's theme
  atlasNames() { const n = [this.countryAtlas()]; for (const a of this.level.areas || []) { const th = THEMES[a.theme]; if (th && th.atlas) n.push(th.atlas); } return n; }
  refreshPlatforms() { this.platforms = this.entities.filter(e => (e.isPlatform || e.solidTop) && !e.dead && !(e instanceof Spring)); }

  /* ---------- helpers used by entities ---------- */
  tint(kind) { const th = THEMES[this.area ? this.area.theme : this.level.areas[0].theme]; return (th.tint && th.tint[kind]) || '#8a6aff'; }
  spawn(e) { (this.loadingEntities || this.entities).push(e); }   // entities spawned by a constructor while an area loads join that area
  burst(x, y, n, col, type) { this.parts.burst(x, y, n, col, type); }
  shake(a) { if (Save.data.settings.shake) this.shakeAmt = Math.max(this.shakeAmt, a); }
  get viewW() { return Game.viewW; }
  onScreen(e, margin) { margin = margin || 0; return e.x + e.w > this.camX - margin && e.x < this.camX + Game.viewW + margin && e.y + e.h > this.camY - margin && e.y < this.camY + Game.viewH + margin; }
  setTile(tx, ty, t) { const a = this.area; if (tx < 0 || ty < 0 || tx >= a.W || ty >= a.H) return; a.tiles[ty * a.W + tx] = t; if (t === T.EMPTY || GROUNDLIKE[t] || t === T.PILLAR) this.dirtyVariants = true; }
  addScore(n, x, y) { Save.data.score = (Save.data.score || 0) + n; if (x !== undefined) this.parts.text(x, y - 6, String(n)); }
  chainScore(e) {
    const table = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
    if (this.chain >= table.length) { this.addLife(e.cx, e.y); }
    else this.addScore(table[this.chain], e.cx, e.y);
    this.chain++;
  }
  addPick(x, y) {
    this.picks++; Save.data.picks = this.picks;
    Save.data.score += 50;
    Sound.play('pick');
    if (x !== undefined) this.burst(x, y, 4, '#ffd84a', 'spark');
    if (this.picks >= 100) { this.picks -= 100; Save.data.picks = this.picks; this.addLife(x, y); }
  }
  addLife(x, y) {
    Save.data.lives = Math.min(99, (Save.data.lives || 0) + 1);
    Sound.play('oneup'); if (x !== undefined) this.parts.text(x, y - 10, '1UP', '#4aff8a');
    Save.save();
  }
  goldHad(idx) { return !!this.goldHadAtStart[idx]; }
  collectGold(idx, x, y) {
    const arr = Save.data.gold[this.id] || [false, false, false];
    arr[idx] = true; Save.data.gold[this.id] = arr; Save.save();
    Sound.play('chinka');
    this.burst(x, y, 30, '#ff9ad8', 'firework');
    this.parts.text(x, y - 20, this.level.tour ? 'POSTCARD FROM CHINKA!' : 'PHOTO OF CHINKA!', '#ff9ad8');
    this.addScore(5000);
    this.happyT = 1.5;
  }
  egg(name) { if (!Save.data.eggs[name]) { Save.data.eggs[name] = true; Save.save(); } }
  setCheckpoint(x, y) { this.checkpoint = { area: this.area.idx, x, y }; }
  checkpointReached(cp) { return this.checkpoint && Math.abs(this.checkpoint.x - cp.cx) < 4 && this.checkpoint.area === this.area.idx; }
  resumeMusic() { this.mus(this.boss && this.bossLock ? this.bossTrack(this.boss) : (this.player && this.player.mounted ? 'sloth' : this.area.music)); }
  // new tracks fall back to existing ones until the audio for them lands
  mus(name) {
    const fb = { land1: 'w5', land2: 'w7', land3: 'w6', land4: 'w7', land5: 'w4', land6: 'w8', land7: 'w3', land8: 'w10', land9: 'secret', land10: 'glitch', haunt: 'underground', gift_camp: 'secret', man_boss: 'final', man_giant: 'final' };
    let n = name;
    if (n === 'secret' && this.level && this.level.arch === 'gift') n = 'gift_camp';
    if ((Sound.trackNames || []).indexOf(n) < 0 && fb[n]) n = fb[n];
    if ((Sound.trackNames || []).indexOf(n) < 0 && this.level && this.level.tour) n = n === 'tourboss' ? 'boss' : 'w5';
    Sound.music(n);
  }
  bossTrack(b) {
    if (this.level && this.level.tour) { const C = Tour.countryOf(this.id); return (b.info && b.info.music) || (C && C.music.boss) || 'boss'; }
    return b.style === 'man' ? (b.phase === 2 ? 'man_giant' : 'man_boss') : 'boss';
  }
  // beats elapsed (for platforms and lasers that move with the music)
  beatNow() { const bpm = (this.area && this.area.beat && this.area.beat.bpm) || 120; return this.beatClock * bpm / 60; }
  worldScale() { return this.player && this.player.fx && this.player.fx.khole > 0 ? 0.4 : 1; }
  toast(msg) { this.toastText = msg; this.toastT = 2.6; }
  drawToast(ctx) {
    if (!(this.toastT > 0)) return;
    const W = Game.cssW, a = Math.min(1, this.toastT * 2, (2.6 - this.toastT) * 6);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // long messages shrink a little, then wrap onto more lines (power-up hints in portrait)
    const maxW = W - 52, text = String(this.toastText);
    let size = 12; ctx.font = `${size}px ${FONT_DISPLAY}`;
    while (size > 9 && ctx.measureText(text).width > maxW) { size--; ctx.font = `${size}px ${FONT_DISPLAY}`; }
    const lines = [];
    if (ctx.measureText(text).width <= maxW) lines.push(text);
    else { let cur = ''; for (const word of text.split(' ')) { const t = cur ? cur + ' ' + word : word; if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = word; } else cur = t; } if (cur) lines.push(cur); }
    const lh = size + 6, tw = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
    const w = Math.min(W - 24, tw + 30), h = Math.max(30, lines.length * lh + 12), y = Game.gameRect.y + Math.max(64, insets.t + 58) + (W < 600 ? 54 : 0);
    ctx.fillStyle = 'rgba(14,8,26,0.78)'; rr(ctx, W / 2 - w / 2, y - 15, w, h, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ffd84a'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y - 15 + h / 2 + (i - (lines.length - 1) / 2) * lh + 1));
    ctx.restore();
  }

  bumpBlock(tx, ty, big, src) {
    const A = this.area;
    const t = tileAt(A, tx, ty);
    const key = tx + ',' + ty;
    const fromPlayer = src === this.player;
    const kill = () => {
      // knock out enemies and bounce items standing on the block
      const zone = { x: tx * TS - 2, y: ty * TS - 10, w: TS + 4, h: 12 };
      for (const e of this.entities) {
        if (e.dead || e.remove) continue;
        if (overlap(zone, e)) {
          if (e.enemy && !e.boss) { if (e.hit('bump', { x: tx * TS + TS / 2, vx: (e.cx < tx * TS + TS / 2 ? -1 : 1) })) this.addScore(100, e.cx, e.y); }
          else if (e.item && e.bounceFromBelow) e.bounceFromBelow();
        }
      }
    };
    const bump = () => { A.bumps.push({ tx, ty, t: 0.18 }); kill(); };
    if (t === T.QBLOCK || t === T.HIDDEN || t === T.QBRICK) {
      let it = A.contents[key] || 'pick';
      if (it === 'picks') {
        const m = A.multi[key] || (A.multi[key] = { n: 8, t: this.t });
        m.n--;
        this.spawn(new PickPop(this, tx * TS + TS / 2, ty * TS - 8)); this.addPick();
        if (m.n <= 0 || this.t - m.t > 5) this.setTile(tx, ty, T.USED);
        else if (t === T.HIDDEN) this.setTile(tx, ty, T.QBRICK);
        bump(); return;
      }
      this.setTile(tx, ty, T.USED);
      bump();
      if (it === 'pick') { this.spawn(new PickPop(this, tx * TS + TS / 2, ty * TS - 8)); this.addPick(); return; }
      let kind = it;
      if (this.level.tour) { this.spawn(new TourItem(this, tx * TS + TS / 2, ty * TS, TourPowers.blockItem(it, this))); Sound.play('appear'); if (t === T.HIDDEN) { this.egg('hidden-block'); Sound.play('secret', { vol: 0.5 }); } return; }
      if (it === 'power') kind = (this.player && this.player.power > 0) ? 'vinyl' : 'coffee';
      if (it === 'oneup') kind = 'cassette';
      if (typeof it === 'string' && it.startsWith('bag:')) kind = it.slice(4);
      this.spawn(new Item(this, tx * TS + TS / 2, ty * TS, kind));
      Sound.play('appear');
      if (t === T.HIDDEN) { this.egg('hidden-block'); Sound.play('secret', { vol: 0.5 }); }
      return;
    }
    if (t === T.BRICK) {
      if (big) {
        this.setTile(tx, ty, T.EMPTY);
        this.burst(tx * TS + TS / 2, ty * TS + TS / 2, 8, THEMES[this.area.theme].brick.c1, 'debris');
        Sound.play('break'); this.addScore(50);
        kill();
        if (fromPlayer) this.shake(2);
      } else { bump(); Sound.play('bump'); }
      return;
    }
    if (fromPlayer && SOLID[t]) Sound.play('bump', { vol: 0.5 });
  }

  /* ---------- flow events ---------- */
  onPlayerDying(reason) { this.state = 'dying'; this.stateT = 0; Save.data.deaths = (Save.data.deaths || 0) + 1; }
  onPlayerDead() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    Save.data.lives = (Save.data.lives || 1) - 1;
    Save.save();
    this.fadeTo(1, () => {
      if (Save.data.lives <= 0) Game.setScene(new GameOverScene(this.level, this.checkpoint, this.set));
      else Game.setScene(new Play(this.level, { checkpoint: this.checkpoint }));
    });
  }
  levelClear(gate) {
    if (this.state !== 'play') return;
    this.state = 'clear'; this.stateT = 0;
    this.player.state = 'clear'; this.player.clearGate = gate; this.player.clearT = 0;
    this.player.star = 0; this.player.invuln = 0;
    this.mus('clear');
    this.secretClear = gate.secret ? (gate.secretWorld || 'world') : null;
    this.secretFoundNow = !!gate.secret;
    this.recordProgress();
    for (let i = 0; i < 3; i++) setTimeout(() => { if (Game.scene === this) { this.burst(gate.cx + (Math.random() - 0.5) * 200, gate.y - 40 - Math.random() * 80, 40, '#fff', 'firework'); Sound.play('pick', { pitch: 0.5 }); } }, 400 + i * 450);
  }
  recordProgress() {
    const d = Save.data, id = this.id;
    d.done[id] = true;
    if (this.secretClear) d.secretExits[id] = true;
    this.opened = (this.level.tour && typeof TourProgress !== 'undefined' ? TourProgress : WorldGame).complete(id, !!this.secretClear);
    if (FINALE_LEVELS[id]) d.beatGame = true;
    const elapsed = this.level.time - this.timeLeft;
    if (!d.best[id] || elapsed < d.best[id]) d.best[id] = Math.round(elapsed * 10) / 10;
    d.lastWorld = this.level.world;
    Save.save();
  }
  nextLevelId() {
    if (!this.level.tour) return null;
    const C = Tour.countryOf(this.id), i = this.level.index;
    if (!C || i >= C.levels.length) return null;
    const nid = C.world + '-' + (i + 1);
    return TourProgress.isUnlocked(nid) ? nid : null;
  }
  enterPortal(p) {
    if (this.state !== 'play' || this.player.state !== 'play') return;
    this.player.state = 'portal'; this.player.portalT = 0; this.player.vx = 0;
    if (p.kind === 'door') sfx('door', 'portal'); else Sound.play('portal');
    const tg = p.target;
    if (!tg) { this.player.state = 'play'; return; }
    if (tg.area === this.area.idx) {
      // a door inside the same building: a quick blink to the other side
      this.fadeTo(1, () => {
        const pl = this.player; pl.x = tg.x - pl.w / 2; pl.y = tg.y - pl.h; pl.vx = 0; pl.vy = 0; pl.state = 'play';
        this.camX = clamp(pl.cx - Game.viewW * 0.4, 0, Math.max(0, this.area.W * TS - Game.viewW)); this.camY = this.camTargetY(true);
        this.fadeTo(0, null, 4);
      }, 4);
      return;
    }
    this.fadeTo(1, () => {
      const power = this.player.power, pack = this.player.pack, kandi = this.player.kandi, fx = this.player.fx;
      this.sigCarry = this.player.sig;
      this.loadArea(tg.area, tg.x, tg.y, power);
      this.player.power = power; this.player.pack = pack; this.player.kandi = kandi; this.player.fx = fx;
      this.camX = clamp(this.player.cx - Game.viewW * 0.4, 0, Math.max(0, this.area.W * TS - Game.viewW));
      this.camY = this.camTargetY(true);
      this.weather.reset(this.camX, this.camY, Game.viewW, Game.viewH);
      this.mus(this.area.music);
      if (this.area.bonus) this.egg('bonus-room');
      this.fadeTo(0, null);
    }, 2.6);
  }
  bossStart(b) {
    this.bossLock = { x0: b.arenaX0, x1: b.arenaX1 };
    // Brady walks a few steps in during the intro banner: the locked camera puts the arena's left edge at the
    // bottom-left of the screen, right under the touch joystick, which hid him at the start of every fight
    const p = this.player, walkTo = Math.min(b.arenaX0 + 3.5 * TS, b.x - 2.5 * TS);
    if (p && walkTo > p.x + 4) { this.entryWalk = { x: walkTo, t: 1.3 }; }
    this.mus(this.bossTrack(b));
    // seal the arena entrance
    const tx = Math.floor(b.arenaX0 / TS) - 1;
    for (let y = 3; y < this.area.H; y++) if (tileAt(this.area, tx, y) === T.EMPTY && y < Math.floor((b.y + b.h) / TS)) this.setTile(tx, y, T.HARD);
    this.bannerText = b.name; this.bannerT = 2.2;
  }
  bossDefeated(b) {
    this.addScore(10000, b.cx, b.y);
    for (let y = 0; y < this.area.H; y++) if (tileAt(this.area, b.doorX, y) === T.HARD) { this.setTile(b.doorX, y, T.EMPTY); this.burst(b.doorX * TS + 16, y * TS + 16, 4, '#c8c8d0', 'debris'); }
    Sound.play('secret');
    this.bossLock = null; this.boss = null;
    this.bannerText = b.style === 'man' ? 'THE MAN BURNS!' : b.mid ? 'FORT CLEARED!' : 'CAMP BOSS DOWN!'; this.bannerT = 2.5;
    if (b.style === 'man') { for (let i = 0; i < 6; i++) setTimeout(() => { if (Game.scene === this) { this.burst(b.cx + (Math.random() - 0.5) * 300, b.floorY - 200 - Math.random() * 150, 40, '#fff', 'firework'); sfx('firework_burst', 'pick', { pitch: 0.6 }); } }, i * 380); }
    this.mus(this.area.music);
    this.shake(10);
  }
  fadeTo(target, cb, speed) { this.fade.target = target; this.fade.cb = cb; this.fade.speed = speed || 2.4; }

  /* ---------- camera ---------- */
  camTargetY(snap) {
    const A = this.area, p = this.player;
    const maxY = Math.max(0, A.H * TS - Game.viewH - (A.tower || A.water ? 0 : TS));
    // a tall boss (the Man on his saucer, then giant) gets a lower horizon so his head stays on screen
    let ty = p.y + p.h - Game.viewH * (A.tower ? 0.55 : (this.bossLock && this.boss && this.boss.tall) ? 0.84 : 0.68);
    if (!snap && !A.tower && !A.water) {
      // don't chase small hops: hold height while airborne unless Brady climbs high
      if (!p.onGround && p.y + p.h > this.camY + Game.viewH * 0.32 && p.y + p.h < this.camY + Game.viewH * 0.85) ty = this.camY;
    }
    return clamp(ty, 0, maxY);
  }
  updateCamera(dt) {
    const A = this.area, p = this.player;
    const maxX = Math.max(0, A.W * TS - Game.viewW);
    if (A.autoscroll && this.state === 'play') {
      this.camX = Math.min(maxX, this.camX + A.autoscroll * TS * dt * this.worldScale());
    } else {
      this.look = lerp(this.look || 0, p.facing * Game.viewW * 0.08 * clamp(Math.abs(p.vx) / PHYS.walk, 0, 1), 1 - Math.exp(-dt * 2.5));
      let tx = p.cx - Game.viewW * 0.42 + this.look;
      if (this.bossLock) {
        const w = this.bossLock.x1 - this.bossLock.x0;
        tx = w < Game.viewW ? (this.bossLock.x0 + this.bossLock.x1) / 2 - Game.viewW / 2 : clamp(tx, this.bossLock.x0 - TS, this.bossLock.x1 - Game.viewW + TS);
        // a towering boss stays in frame as long as Brady does
        const b = this.boss;
        if (b && b.focusX && w >= Game.viewW) tx = clamp(Math.max(tx, Math.min(b.focusX - Game.viewW, p.cx - 1.5 * TS)), this.bossLock.x0 - TS, this.bossLock.x1 - Game.viewW + TS);
      }
      tx = clamp(tx, 0, maxX);
      this.camX += (tx - this.camX) * (1 - Math.exp(-dt * 9));
      if (Math.abs(tx - this.camX) > Game.viewW) this.camX = tx;
    }
    const ty = this.camTargetY(false);
    const k = ty > this.camY ? 7 : 4.5;
    this.camY += (ty - this.camY) * (1 - Math.exp(-dt * k));
    this.camX = clamp(this.camX, 0, maxX);
  }

  /* ---------- update ---------- */
  input() {
    if (this.state !== 'play' || this.player.state !== 'play') return { left: false, right: false, up: false, down: false, jump: false, action: false, jumpPressed: false, actionPressed: false };
    return { left: Input.left, right: Input.right, up: Input.up, down: Input.down, jump: Input.jump, action: Input.action, jumpPressed: Input.jumpPressed, actionPressed: Input.actionPressed };
  }

  update(dt) {
    // hit-stop: a few frames of slow time after a solid boss hit, so it lands
    if (this.hitStop > 0) { this.hitStop -= dt; dt *= 0.25; }
    // fades
    if (this.fade.a !== this.fade.target) {
      this.fade.a = approach(this.fade.a, this.fade.target, dt * this.fade.speed);
      if (this.fade.a === this.fade.target && this.fade.cb) { const cb = this.fade.cb; this.fade.cb = null; cb(); return; }
    }
    if (this.paused) {
      const hit = UI.hitButtons(this.pauseUI);
      if (hit) hit.fn();
      else if (Input.pausePressed) this.closePause();
      return;
    }
    if (Input.pausePressed && (this.state === 'play' || this.state === 'intro')) { this.openPause(); return; }
    this.t += dt; this.stateT += dt;
    if (this.state === 'intro') {
      if (this.stateT > 1.7 || (this.stateT > 0.4 && (Input.jumpPressed || Input.taps.length))) { this.state = 'play'; this.stateT = 0; }
      this.player.updateAnim(dt, {}); this.player.updateHair(dt);
      this.updateCamera(dt);
      this.weather.update(dt, this.camX, this.camY, Game.viewW, Game.viewH, this.t);
      return;
    }
    if (this.state === 'tally' || this.state === 'results') { this.updateTally(dt); this.parts.update(dt); this.player.update(dt, {}); return; }
    if (this.happyT > 0) this.happyT -= dt;
    if (this.dizzy > 0) this.dizzy -= dt;
    if (this.toastT > 0) this.toastT -= dt;
    if (this.trip > 0) this.trip = Math.max(0, this.trip - dt * 0.55);
    if (this.player.fx && this.player.fx.lsd > 0) this.trip = Math.max(this.trip || 0, 0.45);
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5);
    if (this.shakeAmt > 0) this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    const A = this.area, p = this.player;

    // timer
    if (this.state === 'play' && p.state === 'play') {
      this.timeLeft -= dt * 2.0; // game seconds tick a little faster than real ones
      if (!this.hurry && this.timeLeft < 100) { this.hurry = true; Sound.setTempoBoost(true); this.bannerText = 'HURRY UP!'; this.bannerT = 1.6; }
      if (this.timeLeft <= 0) { this.timeLeft = 0; p.die('time'); }
    }
    const ws = this.worldScale();
    this.beatClock = (this.beatClock || 0) + dt * ws;
    const gifts = Save.data.gifts || {};
    // wind gusts and dust storms (a lantern cuts through the dust)
    const lantern = gifts.lantern ? 0.45 : 1;
    if (A.wind) {
      const W = A.wind === true ? { power: 2.4, period: 7 } : A.wind;
      this.windT += dt;
      const per = W.period || 7, cyc = this.windT % per, dir = Math.floor(this.windT / per) % 2 ? 1 : -1;
      const env = cyc < per * 0.2 ? 0 : cyc < per * 0.3 ? (cyc - per * 0.2) / (per * 0.1) : cyc < per * 0.72 ? 1 : cyc < per * 0.82 ? 1 - (cyc - per * 0.72) / (per * 0.1) : 0;
      this.windForce = dir * (W.power || 2.4) * TS * env;
      this.dustLevel = Math.max(env * (A.whiteout ? 0.95 : THEMES[this.themeKey].dust ? 0.85 : 0.25), (A.dust || 0) * 0.35) * lantern;
      if (env > 0.5 && !this.windSfx) { this.windSfx = true; Sound.play('wind', { vol: 0.4 }); if (A.dust || THEMES[this.themeKey].dust) Sound.play('dust', { vol: 0.5 }); }
      if (env === 0) this.windSfx = false;
    } else { this.windForce = 0; this.dustLevel = approach(this.dustLevel || 0, (A.dust || 0) * 0.35 * lantern, dt); }
    // beat / strobe / page blocks switch with the music
    if (A.beats && A.beats.length) this.updateBeats(A);
    if (A.strobe) { this.strobeT = (this.strobeT || 0) + dt; }
    // tech bros rush in from behind on the bypass
    if (A.chasers && this.state === 'play') this.updateChasers(dt, A.chasers);
    // rising lava
    if (A.risingLava && this.state === 'play') {
      if (this.t > A.risingLava.delay) this.lavaY -= A.risingLava.speed * TS * dt * ws;
      const minLava = p.y + p.h + Game.viewH * 0.9;
      if (this.lavaY > minLava) this.lavaY = minLava;
      A.lavaY = this.lavaY;
    }
    // the pack: tap the slot in the HUD (or press C / Q) to use the spare power-up
    if (Input.packTapped) { Input.packTapped = false; if (this.state === 'play' && p.state === 'play') { if (!p.usePack()) Sound.play('bump', { vol: 0.3 }); } }
    Save.data.pack = p.pack || null;
    // entities (a K-hole slows everything but Brady)
    const cx0 = this.camX - 4 * TS, cx1 = this.camX + Game.viewW + 5 * TS;
    const cy0 = this.camY - 8 * TS, cy1 = this.camY + Game.viewH + 8 * TS;
    const edt = dt * ws;
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (e.remove) continue;
      const always = e.isPlatform || e.boss || e instanceof Bolt || e.friendly || e instanceof Laser || e instanceof Subwoofer || e instanceof Geyser || e instanceof Pancake || e instanceof Horn || e instanceof FlashTrap;
      if (always || (e.x + e.w > cx0 && e.x < cx1 && e.y + e.h > cy0 && e.y < cy1)) e.update(e.item || e.friendly || e instanceof Gold || e instanceof PickPop ? dt : edt);
    }
    this.refreshPlatforms();
    // player
    const inp = this.input();
    p.update(dt, inp);
    // collisions
    if (p.state === 'play' && !p.dead) this.collide(p);
    // removals
    for (let i = this.entities.length - 1; i >= 0; i--) { const e = this.entities[i]; if (e.remove) { if (e.onRemove) e.onRemove(); this.entities.splice(i, 1); } }
    // tile animations: bumps and crumbles
    for (let i = A.bumps.length - 1; i >= 0; i--) { A.bumps[i].t -= dt; if (A.bumps[i].t <= 0) A.bumps.splice(i, 1); }
    this.updateCrumbles(dt);
    if (this.dirtyVariants) { computeVariants(A); this.dirtyVariants = false; }
    this.parts.update(dt);
    this.updateCamera(dt);
    this.weather.update(dt, this.camX, this.camY, Game.viewW, Game.viewH, this.t);
    if (this.state === 'clear') {
      if (this.stateT > 3.2) { this.state = 'tally'; this.stateT = 0; this.tally = { time: Math.ceil(this.timeLeft), bonus: Math.ceil(this.timeLeft) * 10, score0: Save.data.score }; }
    }
    // low-pass music speedup off when timer refreshed
  }

  collide(p) {
    for (const e of this.entities) {
      if (e.remove || e.friendly || e.friendT) continue;
      if (e instanceof EmberChain) { if (Math.abs(e.ox - p.cx) < e.len * 14 + 30 && Math.abs(e.oy - p.cy) < e.len * 14 + 40) e.touchPlayer(p); continue; }
      if (e.customCollide) { if (e.collidePlayer(p) !== 'body') { if (p.dead || p.state !== 'play') return; continue; } }
      if (!overlap(p, e)) continue;
      if (e.enemy && !e.dead && !e.boss) {
        if (p.star > 0) { if (e.hit('star', p)) this.chainScore(e); continue; }
        if (p.fx.molly > 0) { const r = e.hit('love', p); if (r) { this.chainScore(e); sfx('molly', null, { vol: 0.3 }); continue; } }
        const stompable = p.vy > 0 && p.prevBottom <= e.y + Math.max(10, e.h * 0.5);
        if (stompable) {
          const r = e.hit(p.spin ? 'spin' : 'stomp', p);
          if (r) {
            p.vy = -(p.inp.jump ? PHYS.stompVHeld : PHYS.stompV) * (p.spin ? 0.9 : 1); p.jumping = true; p.y = Math.min(p.y, e.y - p.h + 2);
            if (r === true) this.chainScore(e); else this.burst(p.cx, p.y + p.h, 6, '#ffffff', 'spark');
            if (p.spin) { sfx('spin', 'kick', { vol: 0.5 }); this.burst(p.cx, p.y + p.h, 8, '#ffd84a', 'spark'); }
            continue;
          }
        }
        e.touchPlayer(p);
      } else if (!e.dead || e.boss) e.touchPlayer(p);
      if (p.dead || p.state !== 'play') return;
    }
  }
  updateBeats(A) {
    // groups alternate: each pad is solid for three beats out of four, offset by two between groups
    const b = this.beatNow();
    const st = A.beatState;
    for (const k of A.beats) {
      const ph = ((b + (k.grp ? 2 : 0)) % 4 + 4) % 4;
      const on = ph < 3;
      k.warn = ph > 2.45 && ph < 3;
      k.glow = on ? Math.max(0, 1 - (ph % 1) * 1.5) : 0;
      const key = k.tx + ',' + k.ty;
      if (st[key] === on) continue;
      st[key] = on;
      this.setTile(k.tx, k.ty, on ? T.SEMI : T.EMPTY);
    }
  }
  updateChasers(dt, C) {
    this.chaseT -= dt;
    const p = this.player;
    if (this.chaseT < 1.2 && !this.chaseWarned) { this.chaseWarned = true; this.chaseWarnT = 1.2; Sound.play('artcarHorn', { vol: 0.4, pitch: 1.4 }); }
    if (this.chaseWarnT > 0) this.chaseWarnT -= dt;
    if (this.chaseT <= 0) {
      this.chaseT = (C.period || 5) * (0.8 + Math.random() * 0.4); this.chaseWarned = false;
      // he rides the lowest floor under Brady: up on a dock, Brady is safe
      const A = this.area, tx = Math.floor(p.cx / TS);
      let floor = A.H - 4;
      for (let y = Math.floor((p.y + p.h) / TS); y < A.H; y++) { const t = tileAt(A, tx, y), t2 = tileAt(A, tx, y + 1); if (SOLID[t] && SOLID[t2] && !(A.hide && A.hide[y * A.W + tx])) { floor = y; break; } }
      this.spawn(new TechBro(this, { x: this.camX - 40, y: floor * TS, chaser: true, speed: ((A.autoscroll || 2.8) * 2.4) * TS }));
    }
  }

  updateCrumbles(dt) {
    const A = this.area, p = this.player;
    if (p.onGround && p.groundTile === T.CRUMBLE && !A.crumbles.find(c => c.tx === p.groundTx && c.ty === p.groundTy)) {
      A.crumbles.push({ tx: p.groundTx, ty: p.groundTy, t: 0.5, state: 'shake' });
      Sound.play('crumble', { vol: 0.4 });
    }
    for (let i = A.crumbles.length - 1; i >= 0; i--) {
      const c = A.crumbles[i];
      c.t -= dt;
      if (c.state === 'shake' && c.t <= 0) {
        this.setTile(c.tx, c.ty, T.EMPTY); c.state = 'gone'; c.t = 5;
        this.burst(c.tx * TS + 16, c.ty * TS + 16, 6, mix(THEMES[A.theme].brick.c1, '#d8b080', 0.5), 'debris');
      } else if (c.state === 'gone' && c.t <= 0) {
        const box = { x: c.tx * TS, y: c.ty * TS, w: TS, h: TS };
        if (!overlap(box, p)) { this.setTile(c.tx, c.ty, T.CRUMBLE); A.crumbles.splice(i, 1); } else c.t = 0.5;
      }
    }
  }

  updateTally(dt) {
    const tl = this.tally;
    if (this.state === 'tally') {
      if (tl.time > 0) {
        const n = Math.min(tl.time, Math.max(1, Math.floor(dt * 240)));
        tl.time -= n; Save.data.score += n * 10;
        tl.tick = (tl.tick || 0) + dt; if (tl.tick > 0.05) { tl.tick = 0; Sound.play('coinTally', { vol: 0.5 }); }
        if (Input.taps.length || Input.jumpPressed) { Save.data.score += tl.time * 10; tl.time = 0; }
      } else { this.state = 'results'; this.stateT = 0; Save.save(); Input.setMode('ui'); this.buildResultsUI(); }
    } else if (this.state === 'results') {
      const hit = UI.hitButtons(this.resultsUI);
      if (hit) hit.fn();
    }
  }
  buildResultsUI() {
    const next = this.nextLevelId();
    const btns = [];
    const W = Game.cssW, H = Game.cssH;
    const bw = Math.min(170, W * 0.36), bh = 48, y = H * 0.5 + 90;
    const finale = this.level.tour ? Tour.isFinale(this.id) : !!FINALE_LEVELS[this.id];
    if (finale) btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: this.level.tour ? 'HOME TOGETHER ♥' : 'FIND CHINKA ♥', primary: true, fn: () => this.goNext(null) });
    else if (next) btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: 'NEXT ▶', primary: true, fn: () => this.goNext(next) });
    else btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: 'MAP ▶', primary: true, fn: () => this.goNext(null) });
    btns.push({ x: W / 2 - 8 - bw, y, w: bw, h: bh, label: 'PLAY AGAIN', fn: () => { Sound.play('select'); Game.setScene(new Play(this.level, {})); } });
    this.resultsUI = btns;
  }
  goNext(next) {
    Sound.play('select');
    if (this.level.tour && Tour.isFinale(this.id)) { Game.setScene(new TourEndingScene()); return; }
    if (!this.level.tour && FINALE_LEVELS[this.id]) { Game.setScene(new EndingScene(this.set)); return; }
    if (!next) { goToMap(this.set, this.level.world, this.id); return; }
    const [w, i] = next.split('-').map(Number);
    Game.setScene(new Play(getLevel(w, i), { power: this.player.power, sig: this.level.tour ? this.player.sig : null }));
  }

  openPause() {
    this.paused = true; Sound.play('pause'); Sound.suspend();
    Input.setMode('ui');
    this.pauseUI = buildPauseUI(this);
  }
  closePause() { this.paused = false; Sound.resume(); Input.setMode('game'); Sound.play('select'); }

  /* ---------- rendering ---------- */
  draw(ctx) {
    const S = Game.S, VW = Game.viewW, VH = Game.viewH;
    const A = this.area;
    const sx = this.shakeAmt ? (Math.random() - 0.5) * this.shakeAmt : 0, sy = this.shakeAmt ? (Math.random() - 0.5) * this.shakeAmt : 0;
    let camX = this.camX + sx, camY = this.camY + sy;
    const gx = Game.gameRect.x * Game.dpr, gy = Game.gameRect.y * Game.dpr;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, gx, gy);
    ctx.beginPath(); ctx.rect(0, 0, VW * S, VH * S); ctx.clip();
    BG.draw(ctx, this.themeKey, camX, camY, Math.max(0, A.H * TS - VH), VW, VH, S, this.t, this.flash);
    // Atmospheric separation belongs behind solids, collectibles and characters.
    // Keep each country's own sky/fog colour rather than flattening every world to grey.
    if (this.level.tour) {
      const th = THEMES[this.themeKey];
      ctx.fillStyle = rgba(th.fog || th.sky[1], 0.16);
      ctx.fillRect(0, 0, VW * S, VH * S);
    }
    // world transform
    const wt = () => ctx.setTransform(S, 0, 0, S, gx - camX * S, gy - camY * S);
    wt();
    const th = THEMES[this.themeKey];
    for (const d of A.decor) { const hw = (d.w || 0) / 2 + 80; if (d.x > camX - hw && d.x < camX + VW + hw) Decor.draw(ctx, d, this.t, th); }
    ctx.setTransform(1, 0, 0, 1, gx, gy);
    this.drawTiles(ctx, camX, camY, false);
    wt();
    if (A.risingLava) this.drawRisingLava(ctx, camX, VW);
    // entities: platforms/props first, then items, enemies, player, projectiles
    const vis = e => e.x + e.w > camX - 60 && e.x < camX + VW + 60 && e.y + e.h > camY - 160 && e.y < camY + VH + 60;
    const layers = [[], [], [], []];
    for (const e of this.entities) {
      if (e.remove || !vis(e)) continue;
      if (e.isPlatform || e instanceof Gate || e instanceof Checkpoint || e instanceof Sign || e instanceof Portal || e instanceof Spring) layers[0].push(e);
      else if (e.item || e instanceof Gold || e instanceof PickPop) layers[1].push(e);
      else if (e.friendly) layers[3].push(e);
      else layers[2].push(e);
    }
    for (const L of layers.slice(0, 3)) for (const e of L) e.draw(ctx, this.t);
    this.player.draw(ctx, this.t);
    for (const e of layers[3]) e.draw(ctx, this.t);
    // foreground: water pools, fake walls
    ctx.setTransform(1, 0, 0, 1, gx, gy);
    this.drawTiles(ctx, camX, camY, true);
    wt();
    this.parts.draw(ctx);
    this.weather.draw(ctx, this.t);
    for (const e of layers[0]) if (e instanceof Sign) e.drawBubble(ctx);
    ctx.setTransform(1, 0, 0, 1, gx, gy);
    if (A.water) this.drawUnderwater(ctx, VW * S, VH * S);
    let darkness = A.dark ? Math.max(th.darkness || 0, 0.62) : (th.darkness || 0);
    if (A.strobe) darkness = Math.max(0.2, darkness - (Math.sin(this.strobeT * 20) > 0.6 && Math.sin(this.strobeT * 1.3) > 0 ? 0.5 : 0));
    if (A.sunrise) darkness *= 1 - clamp(this.player.cx / (A.W * TS), 0, 1);
    if (darkness > 0) this.drawLighting(ctx, camX, camY, S, darkness);
    PostFX.apply(ctx, this, Math.round(VW * S), Math.round(VH * S), gx, gy);
    WorldFx.apply(ctx, this, Math.round(VW * S), Math.round(VH * S));
    if (this.level.tour && this.dizzy > 0) TourFx.apply(ctx, this, Math.round(VW * S), Math.round(VH * S));
    ctx.drawImage(Game.vignette, 0, 0); // vignette
    if (this.flash > 0 && !th.storm) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, this.flash * 0.7)})`; ctx.fillRect(0, 0, VW * S, VH * S); }
    ctx.restore();
    // screen-space UI
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    this.drawHUD(ctx);
    this.drawToast(ctx);
    if (this.state === 'intro') this.drawIntro(ctx);
    if (this.bannerT > 0) this.drawBanner(ctx);
    if (this.state === 'tally' || this.state === 'results') this.drawResults(ctx);
    if (this.chaseWarnT > 0) this.drawChaseWarning(ctx);
    if (!this.paused && this.state !== 'results') { Input.drawControls(ctx, 1); this.drawTutorial(ctx); }
    if (this.paused) drawPauseUI(ctx, this);
    // iris transition
    if (this.fade.a > 0.001) this.drawIris(ctx);
  }

  drawTiles(ctx, camX, camY, fg) {
    const A = this.area, S = Game.S, atlas = TileArt.get(this.themeKey, S);
    const x0 = Math.max(0, Math.floor(camX / TS) - 1), x1 = Math.min(A.W - 1, Math.floor((camX + Game.viewW) / TS) + 1);
    const y0 = Math.max(0, Math.floor(camY / TS) - 1), y1 = Math.min(A.H - 1, Math.floor((camY + Game.viewH) / TS) + 1);
    const pad = TPAD * S;
    const t = this.t;
    const qf = Math.floor(t * 6) % 4, cf = Math.floor(t * 10) % 4;
    const bumpOf = (x, y) => { for (const b of A.bumps) if (b.tx === x && b.ty === y) return Math.sin((1 - b.t / 0.18) * Math.PI) * 8; return 0; };
    const crumbleOf = (x, y) => { for (const c of A.crumbles) if (c.tx === x && c.ty === y && c.state === 'shake') return Math.sin(t * 80) * 1.5; return 0; };
    const p = this.player;
    // fake walls fade when Brady is inside them
    let fakeAlpha = 1;
    if (fg) {
      const near = touchesTile({ x: p.x - 10, y: p.y - 10, w: p.w + 20, h: p.h + 20 }, A, tt => tt === T.FAKE);
      this.fakeFade = approach(this.fakeFade || 1, near ? 0.3 : 1, 0.06);
      fakeAlpha = this.fakeFade;
      if (near && !this.fakeFound) { this.fakeFound = true; Sound.play('secret'); this.egg('fake-wall'); }
    }
    const hide = A.hide, lsd = p.fx && p.fx.lsd > 0;
    const beatAt = this.beatMap(A);
    for (let y = y1; y >= y0; y--) {
      for (let x = x0; x <= x1; x++) {
        const id = A.tiles[y * A.W + x];
        const hv = hide ? hide[y * A.W + x] : 0;
        if (!fg && beatAt && beatAt[y * A.W + x]) { this.drawBeatPad(ctx, beatAt[y * A.W + x], x, y, camX, camY, S); continue; }
        if (id === T.EMPTY) continue;
        if (hv === 1 || hv === 3) continue;
        if (hv === 2) { if (!fg && lsd) this.drawTripTile(ctx, x, y, camX, camY, S); continue; }
        if (fg !== (id === T.FAKE || id === T.WATER)) continue;
        const dx = Math.round((x * TS - camX) * S), dy = Math.round((y * TS - camY) * S);
        const dw = Math.round(((x + 1) * TS - camX) * S) - dx, dh = Math.round(((y + 1) * TS - camY) * S) - dy;
        let img = null, ox = 0, oy = 0;
        const v = A.variants[y * A.W + x];
        switch (id) {
          case T.GROUND: img = atlas.ground[v]; break;
          case T.FAKE: img = atlas.ground[v]; ctx.globalAlpha = fakeAlpha; break;
          case T.BRICK: img = atlas.brick; oy = -bumpOf(x, y); break;
          case T.QBRICK: img = atlas.brick; oy = -bumpOf(x, y); break;
          case T.QBLOCK: img = atlas.qblock[qf]; oy = -bumpOf(x, y); break;
          case T.USED: img = atlas.used; oy = -bumpOf(x, y); break;
          case T.HARD: img = atlas.hard; break;
          case T.HIDDEN: if (lsd) { ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 5 + x); img = atlas.qblock[qf]; } break;
          case T.SEMI: img = atlas.semi[['L', 'M', 'R', 'S'][v] || 'M']; break;
          case T.SPIKES: img = atlas.spikes; break;
          case T.SPIKES_CEIL: img = atlas.spikesCeil; break;
          case T.ICE: img = atlas.ice[v ? 1 : 0]; break;
          case T.CONV_L: img = atlas.conv.l[cf]; break;
          case T.CONV_R: img = atlas.conv.r[cf]; break;
          case T.CRUMBLE: img = atlas.crumble; ox = crumbleOf(x, y); break;
          case T.PILLAR: { const part = ['L', 'R', 'S'][v & 3] || 'S'; img = atlas.pillar[part + (v & 4 ? 't' : 'b')]; break; }
          case T.GLITCH: img = atlas.glitch[Math.floor(t * 12 + x) % 3]; break;
          case T.PICK: {
            ctx.setTransform(S, 0, 0, S, Game.gameRect.x * Game.dpr + dx, Game.gameRect.y * Game.dpr + dy);
            Sprites.pickFast(ctx, TS / 2, TS / 2 + Math.sin(t * 3 + x * 0.7) * 1.5, t, Math.cos(t * 3 + x * 0.5), (x * 3 + y) % 5);
            ctx.setTransform(1, 0, 0, 1, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr);
            continue;
          }
          case T.LAVA: this.drawLavaTile(ctx, x, y, dx, dy, dw, dh); continue;
          case T.WATER: {
            const top = y === 0 || A.tiles[(y - 1) * A.W + x] !== T.WATER;
            ctx.fillStyle = 'rgba(60,170,255,0.35)'; ctx.fillRect(dx, dy, dw, dh);
            if (top) { ctx.fillStyle = 'rgba(200,240,255,0.7)'; ctx.fillRect(dx, dy + Math.sin(t * 3 + x) * S, dw, 2 * S); }
            continue;
          }
        }
        if (img) ctx.drawImage(img, dx - pad + ox * S, dy - pad + oy * S, dw + pad * 2, dh + pad * 2);
        if (id === T.FAKE || id === T.HIDDEN) ctx.globalAlpha = 1;
      }
    }
  }
  drawLavaTile(ctx, x, y, dx, dy, dw, dh) {
    const A = this.area, S = Game.S, t = this.t;
    const L = LIQUIDS[A.liquid || THEMES[this.themeKey].liquid || 'lava'] || LIQUIDS.lava;
    const top = y === 0 || A.tiles[(y - 1) * A.W + x] !== T.LAVA;
    if (!top) { ctx.fillStyle = L[2]; ctx.fillRect(dx, dy, dw, dh); ctx.fillStyle = L[3]; ctx.fillRect(dx, dy + ((t * 20 + x * 7) % 32) * S * 0.5, dw, 3 * S); return; }
    const g = ctx.createLinearGradient(0, dy, 0, dy + dh);
    g.addColorStop(0, L[0]); g.addColorStop(0.35, L[1]); g.addColorStop(1, L[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(dx, dy + dh);
    for (let i = 0; i <= 4; i++) { const xx = dx + dw * i / 4; ctx.lineTo(xx, dy + (8 + Math.sin(t * 3 + (x * 4 + i) * 0.8) * 3) * S); }
    ctx.lineTo(dx + dw, dy + dh); ctx.closePath(); ctx.fill();
    if (L[4]) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createLinearGradient(0, dy - 20 * S, 0, dy + 10 * S);
      gg.addColorStop(0, rgba(L[4], 0)); gg.addColorStop(1, rgba(L[4], 0.35));
      ctx.fillStyle = gg; ctx.fillRect(dx, dy - 20 * S, dw, 30 * S);
      ctx.restore();
    }
    if (L[5] && Math.sin(t * 2 + x * 1.7) > 0.7) { ctx.fillStyle = L[5]; ctx.beginPath(); ctx.arc(dx + dw * ((x * 37) % 10) / 10, dy + 6 * S - ((t * 14 + x * 9) % 20) * S, 2.2 * S, 0, TAU); ctx.fill(); }
  }
  // which tiles are beat pads (cached per area)
  beatMap(A) {
    if (!A.beats || !A.beats.length) return null;
    if (!A.beatIdx) { A.beatIdx = new Array(A.W * A.H); for (const k of A.beats) A.beatIdx[k.ty * A.W + k.tx] = k; }
    return A.beatIdx;
  }
  drawBeatPad(ctx, k, x, y, camX, camY, S) {
    const dx = (x * TS - camX) * S, dy = (y * TS - camY) * S, w = TS * S;
    const on = this.area.tiles[y * this.area.W + x] === T.SEMI;
    if (typeof TOUR_BEAT_ART !== 'undefined' && TOUR_BEAT_ART[k.kind]) { ctx.save(); ctx.translate(dx, dy); ctx.scale(S, S); TOUR_BEAT_ART[k.kind](ctx, k, on, !!(k.warn && Math.floor(this.t * 16) % 2 === 0), this.t); ctx.restore(); return; }
    const pal = { beat: ['#ff4fd8', '#38f2ff'], strobe: ['#ffffff', '#c8d8ff'], page: ['#fffaf0', '#f4ecdc'] }[k.kind] || ['#ff4fd8', '#38f2ff'];
    const col = pal[k.grp ? 1 : 0];
    if (!on) { ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 1.2 * S; ctx.setLineDash([3 * S, 3 * S]); ctx.strokeRect(dx + 2 * S, dy + 1 * S, w - 4 * S, 8 * S); ctx.setLineDash([]); return; }
    const blink = k.warn && Math.floor(this.t * 16) % 2 === 0;
    if (k.kind === 'page') {
      ctx.fillStyle = blink ? 'rgba(255,250,240,0.4)' : col; ctx.fillRect(dx + 1 * S, dy, w - 2 * S, 9 * S);
      ctx.fillStyle = 'rgba(40,40,70,0.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(dx + 4 * S, dy + (2 + i * 2.4) * S, (w - 8 * S) * (0.5 + ((x * 3 + i) % 4) / 8), 0.8 * S);
      return;
    }
    ctx.fillStyle = blink ? rgba(col, 0.25) : rgba(col, 0.55 + 0.45 * (k.glow || 0));
    rr(ctx, dx + 1 * S, dy, w - 2 * S, 9 * S, 3 * S); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx + 3 * S, dy + 1.5 * S, w - 6 * S, 1.4 * S);
    if (k.glow > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(col, 0.25 * k.glow); ctx.fillRect(dx - 4 * S, dy - 10 * S, w + 8 * S, 20 * S); ctx.restore(); }
  }
  drawTripTile(ctx, x, y, camX, camY, S) {
    // LSD reveals the secret ledges: a shimmering rainbow plank
    const dx = (x * TS - camX) * S, dy = (y * TS - camY) * S, w = TS * S;
    ctx.fillStyle = `hsla(${(this.t * 120 + x * 30) % 360},100%,65%,0.75)`; rr(ctx, dx + 1 * S, dy, w - 2 * S, 8 * S, 3 * S); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(dx + 3 * S, dy + 1.5 * S, w - 6 * S, 1.2 * S);
  }
  drawChaseWarning(ctx) {
    const H = Game.cssH, gr = Game.gameRect, a = Math.floor(this.t * 10) % 2 ? 1 : 0.5;
    const y = gr.y + gr.h * 0.6, x = gr.x + 18;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#38f2ff';
    ctx.beginPath(); ctx.moveTo(x + 22, y); ctx.lineTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.closePath(); ctx.fill();
    ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'left'; ctx.fillText('TECH BRO INCOMING!', x + 30, y + 4);
    ctx.restore();
  }
  drawRisingLava(ctx, camX, VW) {
    const y = this.lavaY, t = this.t;
    if (y > this.camY + Game.viewH + 40) return;
    const L = LIQUIDS[(this.area.risingLava && this.area.risingLava.look) || 'lava'] || LIQUIDS.lava;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createLinearGradient(0, y - 80, 0, y);
    gg.addColorStop(0, rgba(L[1], 0)); gg.addColorStop(1, rgba(L[1], 0.45));
    ctx.fillStyle = gg; ctx.fillRect(camX - 10, y - 80, VW + 20, 80); ctx.restore();
    const g = ctx.createLinearGradient(0, y, 0, y + 120);
    g.addColorStop(0, L[0]); g.addColorStop(0.2, L[1]); g.addColorStop(1, L[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(camX - 10, y + 400);
    for (let x = camX - 10; x <= camX + VW + 10; x += 16) ctx.lineTo(x, y + Math.sin(t * 3 + x * 0.05) * 4 + Math.sin(t * 1.7 + x * 0.013) * 3);
    ctx.lineTo(camX + VW + 10, y + 400); ctx.closePath(); ctx.fill();
    ctx.fillRect(camX - 10, y + 400, VW + 20, Game.viewH + 400);
  }
  drawUnderwater(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(40,160,230,0.12)'); g.addColorStop(1, 'rgba(10,40,120,0.32)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(160,230,255,0.06)'; ctx.lineWidth = 3 * Game.S;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) { const y = (i / 7) * H + Math.sin(x * 0.01 + this.t * 1.2 + i) * 14 * Game.S + Math.sin(x * 0.023 - this.t) * 8 * Game.S; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  collectLights(camX, camY) {
    const VW = Game.viewW, VH = Game.viewH, A = this.area, th = THEMES[this.themeKey];
    const lights = [];
    const p = this.player;
    lights.push({ x: p.cx, y: p.cy, r: p.star > 0 ? 230 : p.fly > 0 ? 200 : 165, col: p.star > 0 ? `hsl(${(this.t * 200) % 360},100%,70%)` : '#ffd8b0', a: 0.3 });
    const toHex = c => { const m = /rgba?\((\d+),(\d+),(\d+)/.exec(c || ''); return m ? rgbToHex(+m[1], +m[2], +m[3]) : '#ffd8a0'; };
    for (const e of this.entities) {
      if (e.remove) continue;
      const L = e.light; if (!L) continue;
      const x = L.x !== undefined ? L.x : e.cx, y = L.y !== undefined ? L.y : e.cy;
      if (x < camX - 200 || x > camX + VW + 200 || y < camY - 200 || y > camY + VH + 200) continue;
      lights.push({ x, y, r: L.r, col: L.col || toHex(L.c), a: 0.5 });
    }
    const DL = { lamp: [130, '#ffe0a0', -66], torch: [120, '#ffa040', -40], brazier: [120, '#ffa040', -28], crystal: [70, th.accent, -12], crystalred: [70, '#ff3a3a', -12],
      ledtree: [95, null, -52], firebarrel: [125, '#ff8a2a', -24], candles: [60, '#ffc070', -14], campsignN: [64, '#ff4fd8', -42], disco: [90, '#ffffff', -34],
      fireart: [110, '#ff7a2a', -50], elbike: [44, null, -12], neonsign: [70, '#ff4fd8', -50], smallart: [64, null, -22], altar: [60, '#ffc070', -24], steamvent: [40, '#c8fff4', -20] };
    for (const d of A.decor) {
      const L = DL[d.kind] || (typeof TOUR_DECOR_LIGHTS !== 'undefined' && TOUR_DECOR_LIGHTS[d.kind]); if (!L || d.x < camX - 140 || d.x > camX + VW + 140) continue;
      lights.push({ x: d.x, y: d.y + L[2], r: L[0], col: L[1] || GLOW_COLS[Math.floor(d.x / 7 + this.t * (d.kind === 'ledtree' ? 2 : 0)) % 5], a: 0.55 });
    }
    const x0 = Math.max(0, Math.floor(camX / TS) - 2), x1 = Math.min(A.W - 1, Math.floor((camX + VW) / TS) + 2);
    const y0 = Math.max(0, Math.floor(camY / TS) - 2), y1 = Math.min(A.H - 1, Math.floor((camY + VH) / TS) + 2);
    let picks = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = A.tiles[y * A.W + x];
      if (t === T.LAVA && (x % 2 === 0) && (y === 0 || A.tiles[(y - 1) * A.W + x] !== T.LAVA)) lights.push({ x: x * TS + TS, y: y * TS, r: 110, col: '#ff6a1a', a: 0.45 });
      else if (t === T.PICK && picks++ < 40) lights.push({ x: x * TS + TS / 2, y: y * TS + TS / 2, r: 42, col: GLOW_COLS[(x * 3 + y) % 5], a: 0.5 });
      else if (t === T.QBLOCK) lights.push({ x: x * TS + TS / 2, y: y * TS + TS / 2, r: 52, col: '#ffc84a', a: 0.35 });
    }
    if (A.risingLava) for (let x = camX; x < camX + VW + 100; x += 120) lights.push({ x, y: this.lavaY, r: 170, col: (LIQUIDS[A.risingLava.look] || LIQUIDS.lava)[1], a: 0.5 });
    // the lamplighter's lantern: Brady carries a bigger light
    if ((Save.data.gifts || {}).lantern) lights.push({ x: p.cx, y: p.cy, r: 260, col: '#ffd890', a: 0.25 });
    return lights;
  }
  drawLighting(ctx, camX, camY, S, darkness) {
    const VW = Game.viewW, VH = Game.viewH;
    const ls = 0.5; // light map resolution (relative to logical)
    if (!this.lightCanvas || this.lightCanvas.width !== Math.ceil(VW * ls) || this.lightCanvas.height !== Math.ceil(VH * ls)) this.lightCanvas = makeCanvas(VW * ls, VH * ls);
    const lc = this.lightCanvas, lx = lc.getContext('2d');
    lx.globalCompositeOperation = 'copy';
    lx.fillStyle = `rgba(6,3,14,${darkness})`; lx.fillRect(0, 0, lc.width, lc.height);
    lx.globalCompositeOperation = 'destination-out';
    const lights = this.collectLights(camX, camY);
    for (const L of lights) {
      const x = (L.x - camX) * ls, y = (L.y - camY) * ls, r = L.r * ls;
      if (x < -r || y < -r || x > lc.width + r || y > lc.height + r) continue;
      const g = lx.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = g; lx.beginPath(); lx.arc(x, y, r, 0, TAU); lx.fill();
    }
    ctx.drawImage(lc, 0, 0, VW * S, VH * S);
    // coloured light spill (additive)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      const r = L.r * S * 0.85, x = (L.x - camX) * S, y = (L.y - camY) * S;
      if (x < -r || y < -r || x > VW * S + r || y > VH * S + r) continue;
      ctx.globalAlpha = (L.a || 0.5) * Math.min(1, darkness * 1.6 + 0.15);
      ctx.drawImage(PostFX.glow(L.col), x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  drawHUD(ctx) {
    const W = Game.cssW, top = Math.max(8, insets.t + 4), left = Math.max(12, insets.l + 6), right = Math.max(12, insets.r + 6);
    const gr = Game.gameRect;
    ctx.save();
    ctx.textBaseline = 'middle';
    const pill = (x, y, w, h) => { ctx.fillStyle = 'rgba(10,8,18,0.55)'; rr(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke(); };
    // lives
    const hy = gr.y + top;
    pill(left, hy, 74, 28);
    ctx.save(); ctx.translate(left + 16, hy + 26); ctx.scale(0.62, 0.62);
    drawBrady(ctx, { x: 0, y: 0, facing: 1, small: true, power: 0, anim: { state: 'idle', t: this.t, phase: 0 }, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'left';
    ctx.fillText('×' + Math.max(0, Save.data.lives), left + 32, hy + 15);
    // picks
    pill(left + 82, hy, 78, 28);
    ctx.save(); ctx.translate(left + 98, hy + 14); ctx.scale(0.8, 0.8); Sprites.pick(ctx, 0, 0, 0.45, 1); ctx.restore();   // a still coin, face-on (frame 4 of the 10 fps spin clips is the widest)
    ctx.fillStyle = '#ffd84a'; ctx.fillText('×' + String(this.picks).padStart(2, '0'), left + 112, hy + 15);
    // gold records
    const gx = left + 168;
    pill(gx, hy, 76, 28);
    const have = Save.data.gold[this.id] || [];
    for (let i = 0; i < 3; i++) {
      const cx = gx + 15 + i * 23, cy = hy + 14;
      if (have[i]) { ctx.save(); ctx.translate(cx, cy); ctx.scale(0.55, 0.55); Sprites.goldRecord(ctx, 0, 0, 0, false); ctx.restore(); }
      else { ctx.strokeStyle = 'rgba(255,216,74,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.stroke(); }
    }
    // the pack (tap to use), kandi bracelets, keys and running effects
    const px0 = gx + 84;
    const tour = !!this.level.tour, pl = this.player;
    if (tour) {
      // the country's signature item (with a timer ring if it runs out)
      this.packRect = null;
      const sp = pl.sig ? TourPowers.get(pl.sig.id) : null;
      ctx.fillStyle = sp ? 'rgba(40,20,60,0.75)' : 'rgba(10,8,18,0.55)'; rr(ctx, px0, hy - 2, 34, 32, 8); ctx.fill();
      ctx.strokeStyle = sp ? `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 4)})` : 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4; ctx.stroke();
      if (sp) {
        ctx.save(); ctx.translate(px0 + 17, hy + 14); ctx.scale(0.72, 0.72); if (sp.icon) sp.icon(ctx, 0, 0, this.t); ctx.restore();
        if (sp.time) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px0 + 17, hy + 14, 15, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(pl.sig.t / sp.time, 0, 1)); ctx.stroke(); }
      } else { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); TourKit.star(ctx, px0 + 17, hy + 14, 7, 3, 5); ctx.fill(); }
    } else {
    this.packRect = { x: px0, y: hy - 2, w: 34, h: 32 };
    ctx.fillStyle = this.player.pack ? 'rgba(40,20,60,0.75)' : 'rgba(10,8,18,0.55)'; rr(ctx, px0, hy - 2, 34, 32, 8); ctx.fill();
    ctx.strokeStyle = this.player.pack ? `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 4)})` : 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4; ctx.stroke();
    if (this.player.pack) { ctx.save(); ctx.translate(px0 + 17, hy + 16); ctx.scale(0.62, 0.62); Sprites.itemIcon(ctx, 0, 0, this.t, this.player.pack); ctx.restore(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('PACK', px0 + 17, hy + 15); ctx.textAlign = 'left'; }
    }
    let ix = px0 + 42;
    const icon = (fn) => { fn(ix, hy + 14); ix += 26; };
    if (this.player.kandi > 0) icon((x, y) => { for (let i = 0; i < 3; i++) { ctx.strokeStyle = GLOW_COLS[i]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(x, y - 3 + i * 3, 9, 4, 0, 0, TAU); ctx.stroke(); } });
    for (const k of this.keys) icon((x, y) => { ctx.save(); ctx.translate(x, y + 2); ctx.scale(0.6, 0.6); GimmickArt.keyShape(ctx, 0, 0, k === 'secret'); ctx.restore(); });
    const fxList = tour ? [['star', pl.star, 10, '#ffffff'], ['lsd', pl.lsdT, 10, '#a0f0ff']] : [['star', this.player.star, 10, '#ffffff'], ['bufo', this.player.fly, 12, '#c08aff'], ['joint', this.player.floaty, 9, '#e8e8f0']];
    if (!tour) for (const k in this.player.fx) fxList.push([k, this.player.fx[k], BAG_KINDS[k].time, BAG_KINDS[k].col]);
    for (const [k, v, max, col] of fxList) if (v > 0) icon((x, y) => {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 10, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v / max, 0, 1)); ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.scale(0.42, 0.42); Sprites.itemIcon(ctx, 0, 0, this.t, k === 'star' && !tour ? 'eclipse' : k); ctx.restore();
    });
    // right side: world & time
    const narrow = W < 600;
    const rx = narrow ? left + 244 + 132 > W - right - 44 ? W - right : W - right - 48 : W - right - (Input.layout && !Input.layout.lefty ? 48 : 0);
    const ry = narrow ? hy + 42 : hy;
    const wl = (WORLDS[this.level.world].label || this.level.world) + '-' + this.level.index;
    ctx.textAlign = 'right';
    if (narrow && ix > rx - 140) { /* keep the right pill below the icon row */ }
    const hy0 = hy;
    { const hy = ry;
    pill(rx - 132, hy, 132, 28);
    ctx.font = `13px ${FONT_DISPLAY}`;
    ctx.fillStyle = '#c8c0ff'; ctx.fillText(wl, rx - 82, hy + 15);
    const tl = Math.max(0, Math.ceil(this.timeLeft));
    ctx.fillStyle = this.hurry ? (Math.floor(this.t * 4) % 2 ? '#ff5a5a' : '#ffffff') : '#ffffff';
    ctx.fillText('⏱' + String(tl).padStart(3, '0'), rx - 12, hy + 15);
    // score
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(String(Save.data.score || 0).padStart(7, '0'), rx - 12, hy + 38);
    }
    // boss health
    if (this.boss && this.bossLock && !this.boss.remove) {
      const b = this.boss, bw = Math.min(300, W * 0.5), bx = (W - bw) / 2, by = hy0 + (narrow ? 82 : 34);
      ctx.fillStyle = 'rgba(10,8,18,0.7)'; rr(ctx, bx - 4, by - 4, bw + 8, 22, 6); ctx.fill();
      ctx.fillStyle = '#3a1020'; rr(ctx, bx, by + 6, bw, 8, 4); ctx.fill();
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#ff4fd8'); g.addColorStop(1, '#ffd84a');
      ctx.fillStyle = g; rr(ctx, bx, by + 6, Math.max(0, bw * b.hp / b.maxHp), 8, 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(b.name, W / 2, by + 1);
    }
    // pause button
    if (Input.layout) {
      const pb = Input.layout.pause;
      ctx.fillStyle = 'rgba(10,8,18,0.55)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, 17, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(pb.x - 5, pb.y - 6, 3.5, 12); ctx.fillRect(pb.x + 1.5, pb.y - 6, 3.5, 12);
    }
    ctx.restore();
  }
  drawTutorial(ctx) {
    // first-time hints over the touch controls on the very first level
    const first = this.level.tour ? Tour.firstLevel() : '41-1';
    if (this.id !== first || Save.data.done[first] || this.state !== 'play' || this.t > 14 || !Input.layout) return;
    if (!Input.usingTouch && !Game.forceTouchUI) return;
    const L = Input.layout, a = clamp(Math.min(this.t - 1.7, 14 - this.t), 0, 1);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tag = (x, y, txt) => {
      ctx.font = `12px ${FONT_DISPLAY}`;
      const w = ctx.measureText(txt).width + 18;
      ctx.fillStyle = 'rgba(10,8,18,0.75)'; rr(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,216,74,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.fillText(txt, x, y + 1);
    };
    const bob = Math.sin(this.t * 4) * 3;
    tag(L.stickHome.x, L.stickHome.y - L.stickHome.r - 22 + bob, '◀ SLIDE TO MOVE ▶');
    tag(L.jump.x, L.jump.y - L.jump.r - 20 + bob, this.t < 8 ? 'JUMP' : 'TAP AGAIN IN AIR: HEADBANG');
    tag(L.action.x, L.action.y - L.action.r - 20 + bob, 'RUN · THROW');
    ctx.restore();
  }
  drawIntro(ctx) {
    const W = Game.cssW, H = Game.cssH, k = Math.min(1, this.stateT * 3), out = this.stateT > 1.3 ? 1 - (this.stateT - 1.3) / 0.4 : 1;
    ctx.save(); ctx.globalAlpha = clamp(out, 0, 1);
    ctx.fillStyle = 'rgba(6,4,14,0.6)'; ctx.fillRect(0, H / 2 - 70, W, 140);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const Wd = WORLDS[this.level.world];
    const kindTag = { haunt: '  ·  HAUNTED HOUSE', fort: '  ·  FORTRESS', castle: '  ·  CASTLE', gift: '  ·  GIFT CAMP' }[this.level.kind] || '';
    const wl = (Wd.secret ? 'SECRET LAND ' + Wd.label : 'LAND ' + Wd.label) + ' - ' + this.level.index + kindTag;
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = THEMES[this.level.areas[0].theme].accent;
    ctx.fillText(wl.toUpperCase() + '  ·  ' + this.level.worldName.toUpperCase(), W / 2, H / 2 - 36);
    ctx.font = `${Math.min(40, W * 0.07)}px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff';
    ctx.fillText(this.level.name.toUpperCase(), W / 2 + (1 - k) * 60, H / 2 + 2);
    ctx.font = `13px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const hint = this.level.hint || (this.level.type === 'water' ? 'Tap jump to swim' : this.level.type === 'tower' ? 'Climb to the top' : this.level.type === 'auto' ? 'Keep up with the screen' : this.level.type === 'castle' ? 'A boss waits at the end' : 'Reach the Encore Gate');
    ctx.fillText(hint + '   ·   Lives ×' + Save.data.lives, W / 2, H / 2 + 40);
    ctx.restore();
  }
  drawBanner(ctx) {
    const W = Game.cssW, H = Game.cssH, a = Math.min(1, this.bannerT * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(34, W * 0.06)}px ${FONT_DISPLAY}`;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(this.bannerText, W / 2 + 2, H * 0.3 + 2);
    ctx.fillStyle = '#ffd84a'; ctx.fillText(this.bannerText, W / 2, H * 0.3);
    ctx.restore();
  }
  drawResults(ctx) {
    const W = Game.cssW, H = Game.cssH;
    const k = this.state === 'results' ? Math.min(1, this.stateT * 4) : 1;
    ctx.save();
    ctx.fillStyle = `rgba(6,4,14,${0.55 * k + 0.2})`; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(38, W * 0.07)}px ${FONT_DISPLAY}`;
    const g = ctx.createLinearGradient(0, H / 2 - 120, 0, H / 2 - 80); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#ff4fd8');
    ctx.fillStyle = g;
    ctx.fillText(this.secretClear ? 'SECRET EXIT!' : FINALE_LEVELS[this.id] ? 'CHINKA IS FREE!' : this.level.kind === 'castle' ? 'CASTLE CLEARED!' : this.level.kind === 'fort' ? 'FORT CLEARED!' : this.level.kind === 'haunt' ? 'ESCAPED!' : this.level.kind === 'gift' ? 'GIFTED!' : 'WELCOME HOME!', W / 2, H / 2 - 100);
    ctx.font = `14px ${FONT_UI}`; ctx.fillStyle = '#ffffff';
    ctx.fillText(this.level.name + ' cleared', W / 2, H / 2 - 66);
    ctx.font = `13px ${FONT_DISPLAY}`;
    ctx.fillStyle = '#c8c0ff'; ctx.fillText('TIME BONUS  ' + (this.tally ? this.tally.bonus : 0), W / 2, H / 2 - 34);
    ctx.fillStyle = '#ffd84a'; ctx.fillText('SCORE  ' + String(Save.data.score).padStart(7, '0'), W / 2, H / 2 - 10);
    const have = Save.data.gold[this.id] || [];
    for (let i = 0; i < 3; i++) {
      const cx = W / 2 - 50 + i * 50, cy = H / 2 + 34;
      if (have[i]) { ctx.save(); ctx.translate(cx, cy); Sprites.goldRecord(ctx, 0, 0, this.t + i, false); ctx.restore(); }
      else { ctx.strokeStyle = 'rgba(255,216,74,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, 15, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (this.secretFoundNow) { ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = '#00ff9a'; ctx.fillText('Secret exit! A hidden path opened on the map.', W / 2, H / 2 + 62); }
    else if (this.giftNow && GIFTS[this.giftNow]) { ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = GIFTS[this.giftNow].col; ctx.fillText('Burner gift: ' + GIFTS[this.giftNow].name + ' \u2014 ' + GIFTS[this.giftNow].desc, W / 2, H / 2 + 62); }
    const beat = STORY_BEATS[this.id];
    if (beat) {
      const bw = Math.min(W - 30, 560), bx = (W - bw) / 2, by = Math.max(10, insets.t + 6);
      ctx.fillStyle = 'rgba(14,10,26,0.9)'; rr(ctx, bx, by, bw, 66, 14); ctx.fill(); ctx.strokeStyle = 'rgba(122,216,106,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.translate(bx + 30, by + 58); ctx.scale(1.2, 1.2); Sprites.toad(ctx, 0, 0, this.t, { hop: true }); ctx.restore();
      ctx.fillStyle = '#e8ffe0'; ctx.font = `${W < 600 ? 11 : 12}px ${FONT_UI}`; ctx.textAlign = 'left';
      wrapText(ctx, beat, bw - 80).slice(0, 3).forEach((l, k) => ctx.fillText(l, bx + 62, by + 18 + k * 16));
      ctx.textAlign = 'center';
    }
    if (this.state === 'results') UI.drawButtons(ctx, this.resultsUI);
    ctx.restore();
  }
  drawIris(ctx) {
    const W = Game.cssW, H = Game.cssH;
    const p = this.player;
    const px = Game.gameRect.x + (p.cx - this.camX) * Game.S / Game.dpr, py = Game.gameRect.y + (p.cy - this.camY) * Game.S / Game.dpr;
    const maxR = Math.hypot(Math.max(px, W - px), Math.max(py, H - py));
    const r = maxR * (1 - easeInOut(this.fade.a));
    ctx.save();
    ctx.fillStyle = '#05030a';
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(px, py, Math.max(0, r), 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
  }
}

/* liquids: [surface, middle, deep, streak, glow, bubble] */
const LIQUIDS = {
  lava: ['#ffd23f', '#ff7a1a', '#c8320a', 'rgba(255,140,40,0.35)', '#ff781e', null],
  coffee: ['#c8925a', '#7a4a26', '#3a2010', 'rgba(255,220,180,0.18)', null, 'rgba(255,240,220,0.5)'],
  chai: ['#f0c48a', '#c8884a', '#8a5a2a', 'rgba(255,240,210,0.25)', null, 'rgba(255,250,230,0.6)'],
  hot: ['#9af4ff', '#3ac8d8', '#0a6a8a', 'rgba(220,255,255,0.3)', '#8af0ff', 'rgba(240,255,255,0.7)'],
  mud: ['#a87a52', '#7a5232', '#4a2e1a', 'rgba(255,220,170,0.15)', null, 'rgba(200,170,130,0.6)'],
  ink: ['#3a3a5a', '#16162a', '#06060e', 'rgba(120,120,200,0.18)', null, 'rgba(160,160,220,0.4)']
};

// the HUD pack slot answers taps before the on-screen stick does; C or Q on a keyboard
(function hookPackInput() {
  const origDown = Input.onDown;
  Input.onDown = function (e) {
    const sc = Game.scene, r = sc && sc.packRect;
    if (this.mode === 'game' && r && sc instanceof Play && !sc.paused) {
      const q = this.pos(e);
      if (q.x >= r.x - 8 && q.x <= r.x + r.w + 8 && q.y >= r.y - 8 && q.y <= r.y + r.h + 8) {
        if (e.cancelable) e.preventDefault();
        this.packTapped = true;
        this.touches.set(e.pointerId, { role: 'pack', ox: q.x, oy: q.y, x: q.x, y: q.y, sx: q.x, sy: q.y, t: performance.now() });
        return;
      }
    }
    return origDown.call(this, e);
  };
  window.addEventListener('keydown', e => { if ((e.code === 'KeyC' || e.code === 'KeyQ') && Input.mode === 'game') Input.packTapped = true; });
})();

/* effect visuals around Brady (drawn in world space) */
const PlayerFx = {
  under(ctx, p, t) {
    if (p.dead) return;
    if (typeof TourPlayerFx !== 'undefined' && p.g.level && p.g.level.tour) TourPlayerFx.under(ctx, p, t);
    const cx = p.cx, cy = p.y + p.h * 0.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (p.fx.molly > 0) { const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48); g.addColorStop(0, 'rgba(255,120,190,0.35)'); g.addColorStop(1, 'rgba(255,120,190,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 48, cy - 48, 96, 96); }
    if (p.fx.lsd > 0) { ctx.strokeStyle = `hsla(${(t * 200) % 360},100%,65%,0.5)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, p.w * 0.9 + Math.sin(t * 6) * 2, p.h * 0.62, 0, 0, TAU); ctx.stroke(); }
    if (p.fx.khole > 0) { for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; ctx.strokeStyle = `rgba(120,170,255,${0.4 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 14 + k * 40, 0, TAU); ctx.stroke(); } }
    ctx.restore();
  },
  over(ctx, p, t) {
    if (p.dead) return;
    if (typeof TourPlayerFx !== 'undefined' && p.g.level && p.g.level.tour) TourPlayerFx.over(ctx, p, t);
    const cx = p.cx;
    if (p.spin && !p.onGround) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const a = t * 20 + i * 2.1; ctx.beginPath(); ctx.arc(cx, p.y + p.h * 0.4, p.w * 0.95, a, a + 0.9); ctx.stroke(); }
      ctx.restore();
    }
    if (p.fx.powder > 0 && Math.random() < 0.5) p.g.burst(p.cx - p.facing * 8, p.y + p.h * Math.random(), 1, '#ffffff', 'spark');
    if (p.fx.molly > 0 && Math.random() < 0.08) p.g.parts.text(cx + (Math.random() - 0.5) * 30, p.y, '♥', '#ff7ab8');
    if (p.stunT > 0) { ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * TAU / 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 12, p.y - 4 + Math.sin(a) * 4, 2.4, 0, TAU); ctx.fill(); } }
    if (p.slowT > 0) { ctx.fillStyle = 'rgba(220,200,170,0.35)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx - p.facing * (8 + i * 6), p.y + p.h - 6 - i * 3, 5 + i, 0, TAU); ctx.fill(); } }
    if (p.grabbedBy) { ctx.fillStyle = '#ff9ad8'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('MASH JUMP!', cx, p.y - 14 + Math.sin(t * 12) * 2); }
  }
};
/* screen overlays for the baggies (device px, game view) */
const WorldFx = {
  apply(ctx, play, W, H) {
    const p = play.player; if (!p) return;
    ctx.save();
    if (p.fx.khole > 0) { const k = Math.min(1, p.fx.khole, (BAG_KINDS.khole.time - p.fx.khole) * 2); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(150,180,255,${0.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(20,30,80,0)'); g.addColorStop(1, `rgba(20,30,80,${0.45 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (p.fx.molly > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,120,200,0.25)'; ctx.fillRect(0, 0, W, H); }
    if (p.fx.powder > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const y = ((i * 97 + play.t * 900) % H); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W * 0.12, y); ctx.moveTo(W, (y + H / 2) % H); ctx.lineTo(W * 0.88, (y + H / 2) % H); ctx.stroke(); } }
    if (play.area.sunrise) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,200,140,${0.35 * clamp(p.cx / (play.area.W * TS), 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    if (play.area.strobe && Math.sin(play.strobeT * 20) > 0.6 && Math.sin(play.strobeT * 1.3) > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,210,255,0.12)'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
};
// test hook: the entity classes by spawn type (used by tools/gameplay_test.js)
window.BRADY_TYPES = ENTITY_TYPES;

