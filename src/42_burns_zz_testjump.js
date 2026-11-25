/* ============================================================
   BRADY GOES TO BURNING MAN — TEST: JUMP TO WORLD (playtest mode)
   While BURNS_TEST_OPEN is true:
   - every story door in Black Rock City lets Brady in (no "Not yet"), and the old world-select / fast-travel map
     opens every world (BurnsOW.canEnter, BurnsHubScene.play, BurnsWorlds.visible are wrapped below)
   - the pause menu gets "TEST: JUMP TO WORLD": a scrollable list of the city and every story world in story order.
     Tapping one goes straight there (no door cutscene). From inside a story world it leaves that world the same way
     the pause menu's LEAVE does (world freed, sounds stopped) and enters the chosen one; leaving or finishing the
     jumped-to world puts Brady back in the city at that world's door.
   - jumping never marks worlds done, never unlocks them and never grants or removes story items.
   Burning Man app only (42_* modules are not in Super Art Kart). The pause menu calls in from 40_burns_j_ui.js
   through `typeof BurnsTestJump` guards.
   ============================================================ */

// temporary playtest mode, set to false to restore story locks (Brady, Nov 2026)
const BURNS_TEST_OPEN = false;

const BurnsTestJump = {
  on() { return !!BURNS_TEST_OPEN; },
  CITY: 500,
  // the list: the city, then every registered story world in story order
  entries() {
    const out = [];
    if (BurnsWorlds.get(this.CITY)) out.push(this.CITY);
    for (const id of BurnsWorlds.order) if (BurnsWorlds.get(id)) out.push(id);
    return out;
  },
  place(id) { return typeof BURNS_OW !== 'undefined' ? BURNS_OW.PLACES.find(q => q.world === id) || null : null; },
  // where Brady stands when he comes back out of a place (the same spot BurnsOW.enter uses)
  doorSpot(P) { return { x: P.x + Math.sin(P.yaw) * 3.2, y: P.y || 0, z: P.z + Math.cos(P.yaw) * 3.2, yaw: P.yaw }; },
  open(g) { g.pauseTab = 'testjump'; g.buildPause(); burnsSfx('map_open'); },

  /* ---------- jumping ---------- */
  go(g, id) {
    g.paused = false; g.pauseTab = 'main'; g.menuFrom = null;
    if (g.parentScene) {   // inside a story world: leave it exactly like the pause menu's LEAVE, then enter the next
      const city = BurnsOpen.root() || g.parentScene;
      BurnsOpen.leave(g, 'leave');
      if (id !== city.worldId) this.enterFrom(city, id);
      return;
    }
    if (g.def && g.def.open) {   // in the city
      if (id === g.worldId) { g.closePause(); return; }
      this.enterFrom(g, id);
      return;
    }
    // a world started on its own (old world select / debug): let it go, start the city, then enter from there
    Input.camDrag = false; Input.hud = null; Input.setMode('ui');
    if (Sound.engine) Sound.engine(false, 0);
    if (g.player) { try { g.saveRun(); } catch (e) { /* ignore */ } }
    g.released = true; BurnsScenes.releaseWorld(g);
    this.pending = id === this.CITY ? null : id;
    BurnsScenes.play(this.CITY);
  },
  enterFrom(city, id) {
    const P = this.place(id), back = P ? this.doorSpot(P) : null;
    if (P && typeof BurnsOW !== 'undefined') BurnsOW.saveSpot(city, back);   // CONTINUE after a quit: at that door
    this.prep(city, id);
    BurnsOpen.enter(city, id, { back, place: P ? P.short : null });
  },
  // anything a world needs from an earlier one to be playable when entered cold (granted only in test mode).
  // Every story world was checked cold on a fresh save: none needs anything (worlds that ride the bike give it
  // themselves), so this stays empty.
  NEEDS: {},
  prep(city, id) { const f = this.NEEDS[id]; if (f) { try { f(city); } catch (e) { console.error('test jump prep', e); } } },
  // the city just started for a pending jump (see go): enter once it is playing
  tick(g) {
    if (!this.pending || g.worldId !== this.CITY || g.state !== 'play' || g.paused || g.cine || g.suspended) return;
    const id = this.pending; this.pending = null; this.enterFrom(g, id);
  },

  /* ---------- the list (pause tab 'testjump') ---------- */
  frame(g) {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), wide = W >= 600, portrait = H > W;
    const top = S.t, hdrH = 44;
    const listY = wide ? top + hdrH + 26 : top + hdrH + 58, listB = H - S.b;
    const cols = portrait ? 1 : 2, gap = 8, avail = W - S.l - S.r;
    const cw = Math.min(cols === 1 ? 560 : 400, (avail - gap * (cols - 1)) / cols), x0 = (W - (cw * cols + gap * (cols - 1))) / 2;
    const rowH = portrait ? 56 : 50, step = rowH + 6;
    const n = this.entries().length, rows = Math.ceil(n / cols), content = rows * step - 6;
    const maxScroll = Math.max(0, content - (listB - listY));
    return { W, H, S, wide, top, hdrH, listY, listB, cols, cw, x0, rowH, step, n, rows, maxScroll, gap };
  },
  build(g) {
    const F = this.frame(g), list = [], ids = this.entries();
    g.jumpScroll = clamp(g.jumpScroll || 0, 0, F.maxScroll);
    const sc = g.jumpScroll;
    // fixed buttons first (they win a tap over a row beneath them)
    list.push({ x: F.S.l, y: F.top, w: 96, h: F.hdrH, label: '◀ BACK', size: 13, fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    if (F.maxScroll > 0) {
      const page = Math.max(F.step, (F.listB - F.listY) - F.step);
      list.push({ x: F.W - F.S.r - 104, y: F.top, w: 48, h: F.hdrH, label: '▲', disabled: sc <= 0, fn: () => { g.jumpScroll = Math.max(0, sc - page); g.buildPause(); } });
      list.push({ x: F.W - F.S.r - 50, y: F.top, w: 48, h: F.hdrH, label: '▼', disabled: sc >= F.maxScroll, fn: () => { g.jumpScroll = Math.min(F.maxScroll, sc + page); g.buildPause(); } });
    }
    const rows = [];
    ids.forEach((id, i) => {
      const c = F.cols === 1 ? 0 : i % F.cols, r = F.cols === 1 ? i : Math.floor(i / F.cols);
      const ry = F.listY + r * F.step - sc, rx = F.x0 + c * (F.cw + F.gap);
      const vy0 = Math.max(ry, F.listY), vy1 = Math.min(ry + F.rowH, F.listB);
      const row = { id, rx, ry, rw: F.cw, rh: F.rowH, row: true, label: '', x: rx, y: vy0, w: F.cw, h: vy1 - vy0, fn: () => this.go(g, id) };
      rows.push(row);
      if (vy1 - vy0 >= 22) list.push(row);   // the visible part of a row is its touch target
    });
    g.jumpRows = rows;
    list.focus = 0;
    return list;
  },
  // drag the list with a finger (taps still go to the rows: Input only reports a tap when the finger barely moved)
  update(g) {
    const F = this.frame(g); if (F.maxScroll <= 0) return;
    let moved = false;
    for (const t of Input.touches.values()) {
      if (t.sy < F.listY || t.sy > F.listB) continue;
      const ly = t.jumpY === undefined ? t.sy : t.jumpY; t.jumpY = t.y;
      if (Math.abs(t.y - t.sy) < 8) continue;
      const v = clamp((g.jumpScroll || 0) - (t.y - ly), 0, F.maxScroll);
      if (v !== g.jumpScroll) { g.jumpScroll = v; moved = true; }
    }
    if (moved) g.buildPause();
  },
  tag(ctx, x, y) {
    ctx.save(); ctx.font = `11px ${FONT_DISPLAY}`; const w = ctx.measureText('TEST MODE').width + 16; ctx.restore();
    BurnsUI.pill(ctx, x - w / 2, y - 10, w, 20, '#ffd84a', 'rgba(40,20,0,0.6)');
    BurnsUI.text(ctx, 'TEST MODE', x, y + 1, 11, '#2a1200', { stroke: false });
    return w;
  },
  draw(ctx, g) {
    const F = this.frame(g), sv = BurnsSave.get(), here = g.worldId;
    ctx.fillStyle = 'rgba(12,7,24,0.86)'; ctx.fillRect(0, 0, F.W, F.H);   // the game's HUD and banners stay out of the list
    // header
    const ty = F.wide ? F.top + F.hdrH / 2 : F.top + F.hdrH + 18;
    BurnsUIKit.title(ctx, 'JUMP TO WORLD', F.W / 2, ty, F.wide ? 20 : Math.min(20, F.W / 17));
    const tw = this.tag(ctx, F.W / 2 - 74, ty + 22);
    BurnsUI.text(ctx, 'Story progress is not changed', F.W / 2 - 74 + tw / 2 + 8, ty + 22, 11, 'rgba(255,255,255,0.75)', { ui: true, stroke: false, align: 'left' });
    // the rows, clipped to the list area
    ctx.save(); ctx.beginPath(); ctx.rect(0, F.listY - 2, F.W, F.listB - F.listY + 4); ctx.clip();
    for (const r of g.jumpRows || []) {
      if (r.ry + r.rh < F.listY || r.ry > F.listB) continue;
      const id = r.id, city = id === this.CITY, done = !city && !!sv.worldDone[id], cur = id === here, m = BurnsWorlds.meta(id), P = this.place(id);
      const pressed = r._press > 0, y = r.ry + (pressed ? 2 : 0);
      ctx.fillStyle = cur ? 'rgba(255,79,216,0.32)' : pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)';
      burnsRR(ctx, r.rx, y, r.rw, r.rh, 12); ctx.fill();
      ctx.strokeStyle = cur ? '#ff6ae0' : 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.2; burnsRR(ctx, r.rx, y, r.rw, r.rh, 12); ctx.stroke();
      // number badge
      const bx = r.rx + 26, by = y + r.rh / 2;
      ctx.fillStyle = m.col || '#ffd84a'; ctx.beginPath(); ctx.arc(bx, by, 17, 0, TAU); ctx.fill();
      BurnsUI.text(ctx, city ? 'BRC' : String(BurnsWorlds.num(id)), bx, by + 1, city ? 10 : 15, '#1a0a20', { stroke: false });
      // name and where/when
      const nm = city ? 'Black Rock City' : m.name, sub = city ? 'The open city' : (P ? P.name : '') + (m.day ? ' · ' + m.day : '');
      const tx = r.rx + 52, tmax = r.rw - 52 - 52;
      ctx.save(); ctx.beginPath(); ctx.rect(tx, y, tmax, r.rh); ctx.clip();
      BurnsUI.text(ctx, nm, tx, by - 9, 14, '#ffffff', { align: 'left', sw: 3 });
      BurnsUI.text(ctx, sub, tx, by + 11, 11, 'rgba(255,230,250,0.8)', { ui: true, stroke: false, align: 'left' });
      ctx.restore();
      // finished tick / you are here
      const ex = r.rx + r.rw - 26;
      if (cur) BurnsUI.text(ctx, 'HERE', ex, by, 10, '#ffd0f4', { stroke: false });
      else if (done) { ctx.fillStyle = '#4ad04a'; ctx.beginPath(); ctx.arc(ex, by, 13, 0, TAU); ctx.fill(); BurnsUI.text(ctx, '✓', ex, by + 1, 15, '#ffffff', { ui: true, stroke: false }); }
      if (r._press > 0) r._press -= 0.016;
    }
    ctx.restore();
    // scroll bar
    if (F.maxScroll > 0) {
      const H = F.listB - F.listY, k = H / (H + F.maxScroll), bh = Math.max(30, H * k), by = F.listY + (H - bh) * ((g.jumpScroll || 0) / F.maxScroll);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; burnsRR(ctx, F.W - Math.max(4, F.S.r - 8), by, 4, bh, 2); ctx.fill();
    }
    BurnsUIKit.drawButtons(ctx, (g.pauseUI || []).filter(b => !b.row));
  }
};

/* ---------- the locks, opened while BURNS_TEST_OPEN (each wrapper falls through to the real code when it's off) ---------- */
if (BURNS_TEST_OPEN) {
  // city doors: every story place lets Brady in
  if (typeof BurnsOW !== 'undefined') BurnsOW.canEnter = function () { return true; };
  // old world select / fast-travel map: every world, including the secret one
  const vis = BurnsWorlds.visible;
  BurnsWorlds.visible = function () { return this.order.slice(); };
  BurnsWorlds.visible.real = vis;
  if (typeof BurnsHubScene !== 'undefined') {
    const play = BurnsHubScene.prototype.play;
    BurnsHubScene.prototype.play = function () {
      const sv = BurnsSave.get(), w = this.sel;
      if (sv.unlocked[w]) return play.call(this);
      if (this.opts.travel) { burnsSfx('select'); this.opts.travel.go(w); return; }
      if (!BurnsWorlds.get(w)) { burnsSfx('bump'); this.toast = { text: 'The burners are still building this world. Soon!', t: 2.4 }; return; }
      burnsSfx('select'); BurnsScenes.play(w);
    };
  }
  // a pending jump (from a world played on its own) enters once the city is up
  const city = BurnsWorlds.get(BurnsTestJump.CITY);
  if (city) { const up = city.update; city.update = function (g, dt) { if (up) up.call(this, g, dt); BurnsTestJump.tick(g); }; }
}

if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsTestJump });
