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
    this.set = (WORLDS[level.world] && WORLDS[level.world].set) || 'road';
    this.retro = this.set === 'classic';
    Sound.setRetro && Sound.setRetro(this.retro);
    this.rt = [];
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
    this.loadArea(start.area, start.x, start.y, opts.power || 0);
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
    a.contents = Object.assign({}, src.contents);
    a.multi = {}; a.bumps = []; a.crumbles = []; a.idx = idx;
    computeVariants(a);
    this.area = a;
    a.entities = [];
    for (const s of src.spawns) {
      const C = ENTITY_TYPES[s.type];
      if (!C) continue;
      try { a.entities.push(new C(this, s)); } catch (e) { console.warn('spawn failed', s.type, e); }
    }
    a.lavaY = a.H * TS + 40;
    return a;
  }
  loadArea(idx, x, y, power) {
    if (!this.rt[idx]) this.rt[idx] = this.makeRuntimeArea(idx);
    this.area = this.rt[idx];
    this.entities = this.area.entities;
    this.themeKey = this.area.theme;
    this.lavaY = this.area.lavaY;
    const keepPower = this.player ? this.player.power : (power || 0);
    this.player = new Player(this, x, y, keepPower);
    this.weather = new Weather(THEMES[this.themeKey].particles);
    this.boss = this.entities.find(e => e.boss && !e.remove) || null;
    this.refreshPlatforms();
  }
  refreshPlatforms() { this.platforms = this.entities.filter(e => (e.isPlatform || e.solidTop) && !e.dead && !(e instanceof Spring)); }

  /* ---------- helpers used by entities ---------- */
  tint(kind) { const th = THEMES[this.area ? this.area.theme : this.level.areas[0].theme]; return (th.tint && th.tint[kind]) || '#8a6aff'; }
  spawn(e) { this.entities.push(e); }
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
    this.parts.text(x, y - 20, 'PHOTO OF CHINKA!', '#ff9ad8');
    this.addScore(5000);
    this.happyT = 1.5;
  }
  egg(name) { if (!Save.data.eggs[name]) { Save.data.eggs[name] = true; Save.save(); } }
  setCheckpoint(x, y) { this.checkpoint = { area: this.area.idx, x, y }; }
  checkpointReached(cp) { return this.checkpoint && Math.abs(this.checkpoint.x - cp.cx) < 4 && this.checkpoint.area === this.area.idx; }
  resumeMusic() { this.mus(this.boss && this.bossLock ? (this.boss.style === 'buzzkill' ? 'final' : 'boss') : (this.player && this.player.mounted ? 'sloth' : this.area.music)); }
  mus(name) { Sound.music(this.retro ? Retro.track(this, name) : name); }
  toast(msg) { this.toastText = msg; this.toastT = 2.6; }
  drawToast(ctx) {
    if (!(this.toastT > 0)) return;
    const W = Game.cssW, a = Math.min(1, this.toastT * 2, (2.6 - this.toastT) * 6);
    ctx.save(); ctx.globalAlpha = a; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = Math.min(W - 40, ctx.measureText(this.toastText).width + 30), y = Game.gameRect.y + Math.max(64, insets.t + 58) + (W < 600 ? 40 : 0);
    ctx.fillStyle = 'rgba(14,8,26,0.78)'; rr(ctx, W / 2 - w / 2, y - 15, w, 30, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillText(this.toastText, W / 2, y + 1);
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
      if (it === 'power') kind = (this.player && this.player.power > 0) ? 'vinyl' : 'coffee';
      if (it === 'oneup') kind = 'cassette';
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
    const d = Save.data, id = this.id, w = this.level.world, i = this.level.index;
    d.done[id] = true;
    const n = WORLDS[w].plan.length;
    const unlock = lid => { d.unlocked[lid] = true; const ww = +lid.split('-')[0]; d.worldsSeen[ww] = true; };
    if (this.set === 'world') {
      if (this.secretClear) d.secretExits[id] = true;
      this.opened = WorldGame.complete(id, !!this.secretClear);
    } else {
      const order = this.set === 'classic' ? CLASSIC_WORLDS : MAIN_WORLDS;
      if (i < n) unlock(levelId(w, i + 1));
      else {
        const k = order.indexOf(w);
        if (k >= 0 && k < order.length - 1) unlock(levelId(order[k + 1], 1));
      }
      if (this.secretClear && WORLDS[this.secretClear]) { unlock(levelId(this.secretClear, 1)); d.secretExits[id] = true; }
    }
    if (FINALE_LEVELS[id]) d.beatGame = true;
    const elapsed = this.level.time - this.timeLeft;
    if (!d.best[id] || elapsed < d.best[id]) d.best[id] = Math.round(elapsed * 10) / 10;
    if (this.set === 'road') d.lastWorld = w; else if (this.set === 'classic') d.lastClassic = w;
    Save.save();
  }
  nextLevelId() {
    const w = this.level.world, i = this.level.index, n = WORLDS[w].plan.length;
    if (this.set === 'world' || FINALE_LEVELS[this.id]) return null;
    if (this.secretClear && WORLDS[this.secretClear]) return levelId(this.secretClear, 1);
    if (i < n) return levelId(w, i + 1);
    const order = this.set === 'classic' ? CLASSIC_WORLDS : MAIN_WORLDS;
    const k = order.indexOf(w);
    if (k >= 0 && k < order.length - 1) return levelId(order[k + 1], 1);
    return null;
  }
  enterPortal(p) {
    if (this.state !== 'play' || this.player.state !== 'play') return;
    this.player.state = 'portal'; this.player.portalT = 0; this.player.vx = 0;
    Sound.play('portal');
    if (p.warpWorld) {
      const lid = levelId(p.warpWorld, 1);
      Save.data.unlocked[lid] = true; Save.data.worldsSeen[p.warpWorld] = true;
      if (p.kind === 'glitch') { this.egg('static-dimension'); Sound.play('secret'); }
      else this.egg('warp-lounge');
      Save.save();
      this.fadeTo(1, () => Game.setScene(new Play(getLevel(p.warpWorld, 1), { power: this.player.power })), 1.5);
      return;
    }
    const tg = p.target;
    if (!tg) { this.player.state = 'play'; return; }
    this.fadeTo(1, () => {
      const power = this.player.power;
      this.loadArea(tg.area, tg.x, tg.y, power);
      this.player.power = power;
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
    this.mus(b.hush ? 'final' : 'boss');
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
    this.bannerText = b.style === 'buzzkill' ? 'BUZZKILL GOT SWATTED!' : b.hush ? 'THE PARTY IS BACK ON!' : 'CAMP BOSS DOWN!'; this.bannerT = 2.5;
    this.mus(this.area.music);
    this.shake(10);
  }
  fadeTo(target, cb, speed) { this.fade.target = target; this.fade.cb = cb; this.fade.speed = speed || 2.4; }

  /* ---------- camera ---------- */
  camTargetY(snap) {
    const A = this.area, p = this.player;
    const maxY = Math.max(0, A.H * TS - Game.viewH - (A.tower || A.water ? 0 : TS));
    let ty = p.y + p.h - Game.viewH * (A.tower ? 0.55 : 0.68);
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
      this.camX = Math.min(maxX, this.camX + A.autoscroll * TS * dt);
    } else {
      this.look = lerp(this.look || 0, p.facing * Game.viewW * 0.08 * clamp(Math.abs(p.vx) / PHYS.walk, 0, 1), 1 - Math.exp(-dt * 2.5));
      let tx = p.cx - Game.viewW * 0.42 + this.look;
      if (this.bossLock) {
        const w = this.bossLock.x1 - this.bossLock.x0;
        tx = w < Game.viewW ? (this.bossLock.x0 + this.bossLock.x1) / 2 - Game.viewW / 2 : clamp(tx, this.bossLock.x0 - TS, this.bossLock.x1 - Game.viewW + TS);
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
    if (this.toastT > 0) this.toastT -= dt;
    if (this.trip > 0) this.trip = Math.max(0, this.trip - dt * 0.55);
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
    // wind gusts
    if (A.wind) {
      this.windT += dt;
      const cyc = this.windT % 7, dir = Math.floor(this.windT / 7) % 2 ? 1 : -1;
      const env = cyc < 1.5 ? 0 : cyc < 2.2 ? (cyc - 1.5) / 0.7 : cyc < 5 ? 1 : cyc < 5.7 ? 1 - (cyc - 5) / 0.7 : 0;
      this.windForce = dir * 2.4 * TS * env;
      this.dustLevel = env * (THEMES[this.themeKey].dust ? 0.85 : 0.25);
      if (env > 0.5 && THEMES[this.themeKey].dust && !this.windSfx) Sound.play('dust', { vol: 0.5 });
      if (env > 0.5 && !this.windSfx) { this.windSfx = true; Sound.play('wind', { vol: 0.4 }); }
      if (env === 0) this.windSfx = false;
    } else { this.windForce = 0; this.dustLevel = 0; }
    // rising lava
    if (A.risingLava && this.state === 'play') {
      if (this.t > A.risingLava.delay) this.lavaY -= A.risingLava.speed * TS * dt;
      const minLava = p.y + p.h + Game.viewH * 0.9;
      if (this.lavaY > minLava) this.lavaY = minLava; // keep it menacing but never off-screen forever
      A.lavaY = this.lavaY;
    }
    // entities
    const cx0 = this.camX - 4 * TS, cx1 = this.camX + Game.viewW + 5 * TS;
    const cy0 = this.camY - 8 * TS, cy1 = this.camY + Game.viewH + 8 * TS;
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (e.remove) continue;
      if (e.isPlatform || e instanceof Slab || e.boss || e instanceof Bolt || e.friendly || (e.x + e.w > cx0 && e.x < cx1 && e.y + e.h > cy0 && e.y < cy1)) e.update(dt);
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
      if (e.remove || e.friendly) continue;
      if (e instanceof EmberChain) { if (Math.abs(e.ox - p.cx) < e.len * 14 + 30 && Math.abs(e.oy - p.cy) < e.len * 14 + 40) e.touchPlayer(p); continue; }
      if (!overlap(p, e)) continue;
      if (e.enemy && !e.dead && !e.boss) {
        if (p.star > 0) { if (e.hit('star', p)) this.chainScore(e); continue; }
        const stompable = p.vy > 0 && p.prevBottom <= e.y + Math.max(10, e.h * 0.5);
        if (stompable && e.hit('stomp', p)) {
          p.vy = -(p.inp.jump ? PHYS.stompVHeld : PHYS.stompV); p.jumping = true; p.y = Math.min(p.y, e.y - p.h + 2);
          this.chainScore(e);
          continue;
        }
        e.touchPlayer(p);
      } else if (!e.dead || e.boss) e.touchPlayer(p);
      if (p.dead || p.state !== 'play') return;
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
    const finale = !!FINALE_LEVELS[this.id];
    if (finale) btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: 'FIND CHINKA ♥', primary: true, fn: () => this.goNext(null) });
    else if (next) btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: 'NEXT ▶', primary: true, fn: () => this.goNext(next) });
    else btns.push({ x: W / 2 + 8, y, w: bw, h: bh, label: this.set === 'world' ? 'CITY MAP' : 'MAP', primary: true, fn: () => this.goNext(null) });
    btns.push({ x: W / 2 - 8 - bw, y, w: bw, h: bh, label: this.set === 'world' ? 'CITY MAP' : 'WORLD MAP', fn: () => { Sound.play('select'); goToMap(this.set, this.level.world, this.id); } });
    this.resultsUI = btns;
  }
  goNext(next) {
    Sound.play('select');
    if (FINALE_LEVELS[this.id]) { Game.setScene(new EndingScene(this.set)); return; }
    if (!next) { goToMap(this.set, this.level.world, this.id); return; }
    const [w, i] = next.split('-').map(Number);
    Game.setScene(new Play(getLevel(w, i), { power: this.player.power }));
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
    if (this.retro) { camX = Math.round(camX / 2) * 2; camY = Math.round(camY / 2) * 2; } // whole retro pixels: no shimmer
    const gx = Game.gameRect.x * Game.dpr, gy = Game.gameRect.y * Game.dpr;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, gx, gy);
    ctx.beginPath(); ctx.rect(0, 0, VW * S, VH * S); ctx.clip();
    BG.draw(ctx, this.themeKey, camX, camY, Math.max(0, A.H * TS - VH), VW, VH, S, this.t, this.flash);
    // world transform
    const wt = () => ctx.setTransform(S, 0, 0, S, gx - camX * S, gy - camY * S);
    wt();
    const th = THEMES[this.themeKey];
    for (const d of A.decor) if (d.x > camX - 80 && d.x < camX + VW + 80) Decor.draw(ctx, d, this.t, th);
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
    const darkness = A.dark ? Math.max(th.darkness || 0, 0.62) : (th.darkness || 0);
    if (darkness > 0) this.drawLighting(ctx, camX, camY, S, darkness);
    if (this.retro) Retro.apply(ctx, this, Math.round(VW * S), Math.round(VH * S), gx, gy);
    else {
      PostFX.apply(ctx, this, Math.round(VW * S), Math.round(VH * S), gx, gy);
      ctx.drawImage(Game.vignette, 0, 0); // vignette
    }
    if (this.flash > 0 && !th.storm) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.4})`; ctx.fillRect(0, 0, VW * S, VH * S); }
    ctx.restore();
    // screen-space UI
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    this.drawHUD(ctx);
    this.drawToast(ctx);
    if (this.state === 'intro') this.drawIntro(ctx);
    if (this.bannerT > 0) this.drawBanner(ctx);
    if (this.state === 'tally' || this.state === 'results') this.drawResults(ctx);
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
    for (let y = y1; y >= y0; y--) {
      for (let x = x0; x <= x1; x++) {
        const id = A.tiles[y * A.W + x];
        if (id === T.EMPTY) continue;
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
        if (id === T.FAKE) ctx.globalAlpha = 1;
      }
    }
  }
  drawLavaTile(ctx, x, y, dx, dy, dw, dh) {
    const A = this.area, S = Game.S, t = this.t;
    const top = y === 0 || A.tiles[(y - 1) * A.W + x] !== T.LAVA;
    if (!top) { ctx.fillStyle = '#c8320a'; ctx.fillRect(dx, dy, dw, dh); ctx.fillStyle = 'rgba(255,140,40,0.35)'; ctx.fillRect(dx, dy + ((t * 20 + x * 7) % 32) * S * 0.5, dw, 3 * S); return; }
    const g = ctx.createLinearGradient(0, dy, 0, dy + dh);
    g.addColorStop(0, '#ffd23f'); g.addColorStop(0.35, '#ff7a1a'); g.addColorStop(1, '#c8320a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(dx, dy + dh);
    for (let i = 0; i <= 4; i++) { const xx = dx + dw * i / 4; ctx.lineTo(xx, dy + (8 + Math.sin(t * 3 + (x * 4 + i) * 0.8) * 3) * S); }
    ctx.lineTo(dx + dw, dy + dh); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createLinearGradient(0, dy - 20 * S, 0, dy + 10 * S);
    gg.addColorStop(0, 'rgba(255,120,30,0)'); gg.addColorStop(1, 'rgba(255,120,30,0.35)');
    ctx.fillStyle = gg; ctx.fillRect(dx, dy - 20 * S, dw, 30 * S);
    ctx.restore();
  }
  drawRisingLava(ctx, camX, VW) {
    const y = this.lavaY, t = this.t;
    if (y > this.camY + Game.viewH + 40) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createLinearGradient(0, y - 80, 0, y);
    gg.addColorStop(0, 'rgba(255,100,20,0)'); gg.addColorStop(1, 'rgba(255,100,20,0.45)');
    ctx.fillStyle = gg; ctx.fillRect(camX - 10, y - 80, VW + 20, 80); ctx.restore();
    const g = ctx.createLinearGradient(0, y, 0, y + 120);
    g.addColorStop(0, '#ffd23f'); g.addColorStop(0.2, '#ff7a1a'); g.addColorStop(1, '#8a1a06');
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
      const L = DL[d.kind]; if (!L || d.x < camX - 140 || d.x > camX + VW + 140) continue;
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
    if (A.risingLava) for (let x = camX; x < camX + VW + 100; x += 120) lights.push({ x, y: this.lavaY, r: 170, col: '#ff6a1a', a: 0.5 });
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
    ctx.save(); ctx.translate(left + 98, hy + 14); ctx.scale(0.8, 0.8); Sprites.pick(ctx, 0, 0, this.t, 1); ctx.restore();
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
    // right side: world & time
    const narrow = W < 600;
    const rx = narrow ? left + 244 + 132 > W - right - 44 ? W - right : W - right - 48 : W - right - (Input.layout && !Input.layout.lefty ? 48 : 0);
    const ry = narrow ? hy + 42 : hy;
    const wl = (WORLDS[this.level.world].label || this.level.world) + '-' + this.level.index;
    ctx.textAlign = 'right';
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
    if (this.id !== '1-1' || Save.data.done['1-1'] || this.state !== 'play' || this.t > 14 || !Input.layout) return;
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
    tag(L.jump.x, L.jump.y - L.jump.r - 20 + bob, 'JUMP');
    tag(L.action.x, L.action.y - L.action.r - 20 + bob, 'RUN · THROW');
    ctx.restore();
  }
  drawIntro(ctx) {
    const W = Game.cssW, H = Game.cssH, k = Math.min(1, this.stateT * 3), out = this.stateT > 1.3 ? 1 - (this.stateT - 1.3) / 0.4 : 1;
    ctx.save(); ctx.globalAlpha = clamp(out, 0, 1);
    ctx.fillStyle = 'rgba(6,4,14,0.6)'; ctx.fillRect(0, H / 2 - 70, W, 140);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const wl = (WORLDS[this.level.world].secret ? 'SECRET WORLD ' + WORLDS[this.level.world].label : 'WORLD ' + this.level.world) + ' - ' + this.level.index;
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = THEMES[this.level.areas[0].theme].accent;
    ctx.fillText(wl.toUpperCase() + '  ·  ' + this.level.worldName.toUpperCase(), W / 2, H / 2 - 36);
    ctx.font = `${Math.min(40, W * 0.07)}px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff';
    ctx.fillText(this.level.name.toUpperCase(), W / 2 + (1 - k) * 60, H / 2 + 2);
    ctx.font = `13px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const hint = this.level.type === 'water' ? 'Tap jump to swim' : this.level.type === 'tower' ? (this.area.risingLava ? 'Climb! The lava is rising' : 'Climb to the top') : this.level.type === 'auto' ? 'Keep up with the screen' : this.level.type === 'castle' ? 'A boss waits at the end' : 'Reach the Encore Gate';
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
    ctx.fillText(this.secretClear ? 'SECRET EXIT!' : (this.level.type === 'castle' ? 'CAMP CLEARED!' : 'WELCOME HOME!'), W / 2, H / 2 - 100);
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
    if (this.secretClear && WORLDS[this.secretClear]) { ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = '#00ff9a'; ctx.fillText('A hidden world has been unlocked: ' + (WORLDS[this.secretClear] ? WORLDS[this.secretClear].name : ''), W / 2, H / 2 + 62); }
    else if (this.set === 'world' && this.secretFoundNow) { ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = '#00ff9a'; ctx.fillText('Secret exit! A new path opened on the city map.', W / 2, H / 2 + 62); }
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
