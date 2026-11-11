/* ============================================================
   UI — buttons, title, world map, look editor, settings,
   pause, game over, credits
   ============================================================ */
const UI = {
  drawButton(ctx, b, focused) {
    ctx.save();
    const pressed = b._press > 0;
    const y = b.y + (pressed ? 2 : 0);
    ctx.shadowColor = b.primary ? 'rgba(255,79,216,0.55)' : 'rgba(0,0,0,0.5)'; ctx.shadowBlur = b.primary ? 18 : 8; ctx.shadowOffsetY = pressed ? 1 : 4;
    const g = ctx.createLinearGradient(0, y, 0, y + b.h);
    if (b.primary) { g.addColorStop(0, '#ff6ae0'); g.addColorStop(1, '#a42ccf'); }
    else if (b.disabled) { g.addColorStop(0, '#3a3644'); g.addColorStop(1, '#24202e'); }
    else { g.addColorStop(0, '#3a3456'); g.addColorStop(1, '#1e1a30'); }
    ctx.fillStyle = g; rr(ctx, b.x, y, b.w, b.h, Math.min(16, b.h / 2)); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = focused ? '#ffd84a' : b.primary ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = focused ? 2.5 : 1.2;
    rr(ctx, b.x, y, b.w, b.h, Math.min(16, b.h / 2)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, b.x + 4, y + 3, b.w - 8, b.h * 0.38, Math.min(12, b.h / 3)); ctx.fill();
    ctx.fillStyle = b.disabled ? 'rgba(255,255,255,0.4)' : '#ffffff';
    ctx.font = `${b.size || Math.min(16, b.h * 0.36)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, y + b.h / 2 + 1);
    ctx.restore();
    if (b._press > 0) b._press -= 0.016;
  },
  drawButtons(ctx, list) { list.forEach((b, i) => this.drawButton(ctx, b, list.focus === i && !Input.usingTouch)); },
  hitButtons(list) {
    if (!list || !list.length) return null;
    for (const t of Input.taps) for (const b of list) if (!b.disabled && t.x >= b.x - 6 && t.x <= b.x + b.w + 6 && t.y >= b.y - 6 && t.y <= b.y + b.h + 6) { b._press = 0.12; return b; }
    const k = Input.uiKey;
    if (k) {
      if (list.focus === undefined) list.focus = 0;
      if (k === 'down' || k === 'right') { list.focus = (list.focus + 1) % list.length; Sound.play('select', { vol: 0.4 }); }
      if (k === 'up' || k === 'left') { list.focus = (list.focus - 1 + list.length) % list.length; Sound.play('select', { vol: 0.4 }); }
      if (k === 'enter') return list[list.focus];
    }
    if (Input.jumpPressed && list.focus !== undefined) return list[list.focus];
    return null;
  },
  panel(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(34,26,56,0.96)'); g.addColorStop(1, 'rgba(14,10,26,0.96)');
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 20); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.5; rr(ctx, x, y, w, h, 20); ctx.stroke();
    ctx.restore();
  },
  title(ctx, text, x, y, size) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${size}px ${FONT_DISPLAY}`;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(text, x + 2, y + 3);
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd0f4');
    ctx.fillStyle = g; ctx.fillText(text, x, y); ctx.restore();
  }
};

/* Animated scenic backdrop used by menus */
function drawMenuBackdrop(ctx, themeKey, t, speed) {
  const S = Game.dpr * Game.cssH / (VIEW_ROWS * TS);
  const vw = Game.cssW * Game.dpr / S, vh = VIEW_ROWS * TS;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  BG.draw(ctx, themeKey, t * (speed || 30), 0, 0, vw, vh, S, t, 0);
  ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
  return { S: S / Game.dpr };
}
const LOGO_TEXT = (typeof BRADY_APP !== 'undefined' && BRADY_APP === 'world') ? 'SUPER BRADY-O WORLD' : 'BRADY-O';
function drawLogo(ctx, x, y, size, t, txt) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${size}px ${FONT_DISPLAY}`;
  const text = txt || LOGO_TEXT;
  // long titles shrink to fit the screen instead of running off the edges
  const fit = Math.min(1, (Game.cssW * 0.92) / Math.max(1, ctx.measureText(text).width));
  ctx.translate(x, y); ctx.scale(fit, fit); x = 0; y = 0;
  const wob = Math.sin(t * 2) * 2;
  // glow
  ctx.shadowColor = 'rgba(255,79,216,0.9)'; ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = '#ff4fd8'; ctx.fillText(text, x, y + wob);
  ctx.shadowBlur = 0;
  // extruded layers
  for (let i = 6; i > 0; i--) { ctx.fillStyle = `rgba(${40 + i * 10},10,${60 + i * 12},1)`; ctx.fillText(text, x + i * 0.8, y + wob + i * 1.4); }
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffe8fb'); g.addColorStop(0.5, '#ff9ae8'); g.addColorStop(1, '#8a3aff');
  ctx.fillStyle = g; ctx.fillText(text, x, y + wob);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeText(text, x, y + wob);
  ctx.restore();
}

/* ---------------- Title: four games ---------------- */
const GAMES_ALL = [
  { id: 'burns', title: 'BURNING MAN', sub: 'Brady goes to Burning Man (3D)', col: '#ff6a2a' },
  { id: 'world', title: 'SUPER BRADY-O WORLD', sub: 'Super Brady-O travels the world', col: '#7ad86a' },
  { id: 'kart', title: 'ART CART', sub: 'Battle-race wild art cars', col: '#ff4fd8' }
];
// the standalone Super Brady-O World app shows only its own game
const GAMES = (typeof BRADY_APP !== 'undefined' && BRADY_APP === 'world') ? GAMES_ALL.filter(g => g.id === 'world') : GAMES_ALL;
// Brady-O Burns (3D) lives in its own modules; find its entry scene however it was exported
function burnsScene() {
  if (typeof BurnsHubScene !== 'undefined') return BurnsHubScene;
  return window.BRADY_BURNS && (window.BRADY_BURNS.BurnsHubScene || window.BRADY_BURNS.Scene) || null;
}
function startGame(id) {
  Sound.play('select');
  if (id === 'burns') {
    const B = burnsScene();
    if (B) Game.setScene(new B());
    else if (Game.scene && Game.scene.toastMsg !== undefined) Game.scene.toastMsg = 'BRADY-O BURNS IS STILL BEING BUILT';
  } else if (id === 'world') {
    // Super Brady-O World: the trip around the world
    if (typeof Tour !== 'undefined') {
      const go = () => goToMap('world');
      if (!Save.data.seenTourIntro) Game.setScene(new StoryScene(TourIntroPanels(), () => { Save.data.seenTourIntro = true; Save.save(); go(); }, (Sound.trackNames || []).indexOf('tour_title') >= 0 ? 'tour_title' : 'story'));
      else go();
      return;
    }
    const go = () => goToMap('world', 41, Save.data.world3 && Save.data.world3.node);
    if (!Save.data.seenWorldIntro) Game.setScene(new StoryScene(worldIntroPanels(), () => { Save.data.seenWorldIntro = true; Save.save(); go(); }, 'sloth'));
    else go();
  } else if (id === 'kart') {
    const K = kartScenes();
    if (K) Game.setScene(new K.KartMenuScene());
    else if (Game.scene && Game.scene.toastMsg !== undefined) Game.scene.toastMsg = 'ART CART IS STILL WARMING UP';
  }
}
// the kart racer and the city map live in their own modules; find them however they were exported
function kartScenes() {
  if (typeof KartMenuScene !== 'undefined') return { KartMenuScene, KartRaceScene: typeof KartRaceScene !== 'undefined' ? KartRaceScene : null };
  return (window.BRADY_KART && window.BRADY_KART.KartMenuScene) ? window.BRADY_KART : null;
}
function cityMapScene() {
  if (typeof BRCMapScene !== 'undefined') return BRCMapScene;
  return window.BRADY_MAP && (window.BRADY_MAP.BRCMapScene || window.BRADY_MAP.Scene) || null;
}
function goToMap(set, world, fromId) {
  if (set === 'world' && typeof TourMapScene !== 'undefined') { Game.setScene(new TourMapScene({ from: fromId })); return; }
  if (set === 'world') {
    const M = cityMapScene();
    if (M) Game.setScene(new M({ from: fromId }));
    else Game.setScene(new MapScene(world || 41, 'world'));
  } else Game.setScene(new MapScene(world, set));
}
function isLevelUnlocked(id) { return !!Save.data.unlocked[id] || id === '41-1'; }
function setProgress(set) {
  if (set === 'world' && typeof TourProgress !== 'undefined') { const tt = TourProgress.totals(); return { done: tt.done, total: tt.total }; }
  let done = 0, total = 0;
  for (const w of WORLD3_REGIONS) {
    if (((WORLDS[w].set) || 'road') !== set) continue;
    for (let i = 1; i <= WORLDS[w].plan.length; i++) { total++; if (Save.data.done[levelId(w, i)]) done++; }
  }
  return { done, total };
}

class TitleScene {
  constructor() {
    this.t = 0; this.taps = 0; this.headbang = 0; this.anim = { state: 'idle', t: 0, phase: 0 }; this.toastMsg = ''; this.toastT = 0;
    Input.setMode('ui');
    Sound.setRetro && Sound.setRetro(false);
    Sound.music('title');
    this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH, portrait = H > W;
    const top = Math.max(10, insets.t + 4), side = Math.max(14, insets.l + 8, insets.r + 8);
    this.logo = { x: W / 2, y: top + (portrait ? 54 : 40), size: portrait ? Math.min(52, W * 0.13) : Math.min(58, H * 0.14) };
    const gap = 12;
    let cw, ch, cols, y0;
    let by;
    if (GAMES.length === 1) {
      // a single hero card for the standalone app
      cw = Math.min(W - side * 2, portrait ? 560 : 520); ch = Math.min(portrait ? 330 : H * 0.5, cw * (portrait ? 0.95 : 0.6));
      y0 = this.logo.y + (portrait ? 70 : 46);
      this.cards = [{ ...GAMES[0], x: (W - cw) / 2, y: y0, w: cw, h: ch }];
      by = y0 + ch + 14;
    } else if (portrait) {
      // the 3D adventure gets a full-width hero card, the other two sit side by side
      cw = (W - side * 2 - gap) / 2; ch = Math.min(250, (H - 330) / 2, cw * 1.45);
      y0 = this.logo.y + 66 + Math.max(0, (H - 330 - 2 * ch) * 0.25);
      this.cards = GAMES.map((g, i) => i === 0 ? { ...g, x: side, y: y0, w: W - side * 2, h: ch } : { ...g, x: side + (i - 1) * (cw + gap), y: y0 + ch + gap, w: cw, h: ch });
      by = y0 + 2 * (ch + gap) + 4;
    } else {
      cols = 3; cw = (W - side * 2 - gap * 2) / 3; ch = Math.min(H * 0.52, cw * 0.85); y0 = this.logo.y + 46;
      this.cards = GAMES.map((g, i) => ({ ...g, x: side + i * (cw + gap), y: y0, w: cw, h: ch }));
      by = y0 + ch + 12;
    }
    const bw = Math.min(150, (W - side * 2 - gap) / 2);
    this.btns = [
      { x: W / 2 - bw - gap / 2, y: by, w: bw, h: 40, label: 'LOOK', fn: () => { Sound.play('select'); Game.setScene(new LookScene()); } },
      { x: W / 2 + gap / 2, y: by, w: bw, h: 40, label: 'SETTINGS', fn: () => { Sound.play('select'); Game.setScene(new SettingsScene(this)); } }
    ];
    this.btns.focus = 0;
    this.bradyPos = { x: W - side - 26, y: Math.max(64, top + 56), s: 0.9 };
  }
  resize() { this.build(); }
  update(dt) {
    this.t += dt; this.anim.t += dt; if (this.toastT > 0) this.toastT -= dt;
    if (this.toastMsg) { this.toastT = 2.4; this.toastShown = this.toastMsg; this.toastMsg = ''; }
    for (const tp of Input.taps) for (const c of this.cards) if (tp.x >= c.x && tp.x <= c.x + c.w && tp.y >= c.y && tp.y <= c.y + c.h) { c.press = 0.15; startGame(c.id); return; }
    const k = Input.uiKey;
    if (k === 'left' || k === 'right') { this.sel = ((this.sel || 0) + (k === 'right' ? 1 : GAMES.length - 1)) % GAMES.length; Sound.play('select', { vol: 0.4 }); }
    if ((k === 'enter' || (Input.jumpPressed && !Input.usingTouch)) && this.sel !== undefined) { startGame(GAMES[this.sel].id); return; }
    const hit = UI.hitButtons(this.btns);
    if (hit && hit.fn && (Input.taps.length || k === 'enter')) { hit.fn(); return; }
    // tap Brady in the corner five times: headbang easter egg
    for (const tp of Input.taps) {
      const b = this.bradyPos;
      if (Math.hypot(tp.x - b.x, tp.y - (b.y - 20)) < 30) {
        this.taps++;
        if (this.taps >= 5) { this.taps = 0; this.headbang = 3; this.anim.t = 0; Sound.play('headbang'); Save.data.eggs.headbang = true; Save.save(); }
        else Sound.play('select', { pitch: 1 + this.taps * 0.15 });
      }
    }
    const sw = Input.swipes.join('');
    if (sw.endsWith('UUDDLRLR')) {
      Input.swipes.length = 0;
      Save.data.lives = Math.min(99, Save.data.lives + 30); Save.data.eggs.code = true; Save.data.look.hair = HAIR_COLORS.length - 1; Save.save();
      Sound.play('oneup'); this.toastShown = '+30 LIVES + NEON VIOLET HAIR. ROCK ON.'; this.toastT = 2.6;
    }
    if (this.headbang > 0) { this.headbang -= dt; this.anim.state = 'headbang'; } else this.anim.state = (this.t % 14) > 10 ? 'airguitar' : 'idle';
  }
  drawCard(ctx, c, t) {
    const sel = this.sel !== undefined && GAMES[this.sel].id === c.id && !Input.usingTouch;
    ctx.save();
    ctx.shadowColor = rgba(c.col, 0.6); ctx.shadowBlur = sel ? 26 : 14; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#120a1e'; rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.clip();
    const artH = c.h * 0.66;
    this.cardArt(ctx, c, t, c.x, c.y, c.w, artH);
    const g = ctx.createLinearGradient(0, c.y + artH - 30, 0, c.y + c.h); g.addColorStop(0, 'rgba(18,10,30,0)'); g.addColorStop(0.35, 'rgba(18,10,30,0.92)'); g.addColorStop(1, '#120a1e');
    ctx.fillStyle = g; ctx.fillRect(c.x, c.y + artH - 30, c.w, c.h - artH + 30);
    ctx.restore();
    ctx.strokeStyle = sel ? '#ffd84a' : rgba(c.col, 0.7); ctx.lineWidth = sel ? 3 : 1.6; rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.min(15, c.w / 11);
    ctx.font = `${fs}px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff'; ctx.fillText(c.title, c.x + c.w / 2, c.y + c.h * 0.74);
    ctx.font = `${Math.min(12, c.w / 15)}px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText(c.sub, c.x + c.w / 2, c.y + c.h * 0.74 + fs + 2);
    let prog = '';
    if (c.id === 'kart') { const k = Save.data.kart; const tr = k && k.trophies ? Object.keys(k.trophies).length : 0; prog = tr ? tr + ' trophies' : '8 racers · 8 tracks'; }
    else if (c.id === 'burns') { const b = Save.data.burns; const tk = b && b.tokens ? Object.keys(b.tokens).length : 0; prog = tk ? `${tk} burn tokens` : '10 worlds in 3D'; }
    else if (typeof TourProgress !== 'undefined') { const p = TourProgress.totals(); prog = `${p.done}/${p.total} levels · ${Tour.mainCountries().length} countries`; }
    else { const p = setProgress(c.id); prog = `${p.done}/${p.total} levels`; }
    ctx.font = `${Math.min(11, c.w / 16)}px ${FONT_DISPLAY}`; ctx.fillStyle = c.col; ctx.fillText(prog, c.x + c.w / 2, c.y + c.h - 14);
    ctx.restore();
  }
  cardArt(ctx, c, t, x, y, w, h) {
    ctx.save(); ctx.translate(x, y);
    if (c.id === 'burns') {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a0614'); g.addColorStop(0.7, '#7a1e10'); g.addColorStop(1, '#ff7a2a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,${150 + (i * 13) % 100},60,${0.5 + 0.5 * Math.sin(t * 3 + i)})`; ctx.fillRect((i * 37 + t * 20) % w, h - ((t * 30 + i * 23) % h), 2, 2); }
      ctx.save(); ctx.translate(w / 2, h * 0.92); ctx.scale(h / 210, h / 210);
      ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(0, -120, 10, 0, -100, 140); fg.addColorStop(0, 'rgba(255,190,80,0.7)'); fg.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.fillStyle = fg; ctx.fillRect(-160, -260, 320, 280); ctx.globalCompositeOperation = 'source-over';
      drawManFigure(ctx, 0, -10, 1.3, '#1a0606', '#ff8a3a');
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) { const fx = Math.sin(i * 7.3) * 30, fh = 60 + Math.sin(t * 5 + i) * 20 + (i % 3) * 20; const gg = ctx.createLinearGradient(fx, -20, fx, -20 - fh - 40); gg.addColorStop(0, 'rgba(255,220,120,0.8)'); gg.addColorStop(1, 'rgba(255,60,10,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(fx - 12, -20); ctx.quadraticCurveTo(fx - 14, -20 - fh * 0.6, fx + Math.sin(t * 4 + i) * 6, -20 - fh - 40); ctx.quadraticCurveTo(fx + 14, -20 - fh * 0.6, fx + 12, -20); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.translate(w * 0.26, h * 0.95); ctx.scale(h / 120, h / 120);
      drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'run', t, phase: t * 13, speed: 1 }, hair: null, look: Save.data.look, time: t });
      ctx.restore();
    } else if (c.id === 'world' && typeof TourTitle !== 'undefined') {
      TourTitle.cardArt(ctx, t, 0, 0, w, h);
    } else if (c.id === 'world') {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0c0a1e'); g.addColorStop(1, '#2a1a3a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.42, R = Math.min(w, h) * 0.42;
      ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) { ctx.strokeStyle = `rgba(255,200,150,${0.25 + k * 0.05})`; ctx.beginPath(); ctx.arc(cx, cy, R * (0.55 + k * 0.07), Math.PI * 0.17, Math.PI * 0.83); ctx.stroke(); }
      for (let k = 0; k < 17; k++) { const a = Math.PI * (0.17 + k * 0.66 / 16); ctx.strokeStyle = 'rgba(255,200,150,0.3)'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55); ctx.lineTo(cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97); ctx.stroke(); }
      for (let i = 0; i < 40; i++) { const a = Math.PI * (0.18 + (i * 0.618 % 1) * 0.64), rr2 = R * (0.58 + (i * 0.37 % 1) * 0.36); ctx.fillStyle = GLOW_COLS[i % 5]; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillRect(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, 2, 2); }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(0.35, 0.35); drawManFigure(ctx, 0, 0, 1, '#ffd8a0', '#38f2ff'); ctx.restore();
      ctx.save(); ctx.translate(w * 0.6, h * 0.98); ctx.scale(h / 140, h / 140);
      drawSlothy(ctx, { x: 0, y: 0, facing: -1, t, pose: 'walk' });
      drawBrady(ctx, { x: 6, y: -24, facing: -1, small: false, power: 0, anim: { state: 'ride', t, phase: 0 }, hair: null, look: Save.data.look, time: t });
      ctx.restore();
    } else {
      // ART CAR KART: a fish art car tearing across the playa at sunset
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1e0836'); g.addColorStop(0.45, '#8a2a7a'); g.addColorStop(0.72, '#ff8a5a'); g.addColorStop(1, '#ffc27a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const hy = h * 0.66;
      ctx.fillStyle = 'rgba(255,220,150,0.9)'; ctx.beginPath(); ctx.arc(w * 0.28, hy, h * 0.13, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#5a2a5a'; ctx.beginPath(); ctx.moveTo(0, hy);
      for (let i = 0; i <= 12; i++) ctx.lineTo(i * w / 12, hy - (Math.sin(i * 1.7) * 0.5 + 0.6) * h * 0.07);
      ctx.lineTo(w, hy); ctx.fill();
      const pg = ctx.createLinearGradient(0, hy, 0, h); pg.addColorStop(0, '#e2b48e'); pg.addColorStop(1, '#c8946e');
      ctx.fillStyle = pg; ctx.fillRect(0, hy, w, h - hy);
      // racing lines rushing toward the viewer
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { const k = ((i / 6) + t * 0.9) % 1, yy = hy + (h - hy) * k * k; ctx.beginPath(); ctx.moveTo(w * 0.5 - k * w * 0.9, yy); ctx.lineTo(w * 0.5 - k * w * 0.7, yy); ctx.moveTo(w * 0.5 + k * w * 0.7, yy); ctx.lineTo(w * 0.5 + k * w * 0.9, yy); ctx.stroke(); }
      const sc = h / 150, cx = w * 0.52, cy = h * 0.9 + Math.sin(t * 22) * 0.8;
      // dust plume
      for (let i = 0; i < 7; i++) { const k = ((t * 1.4 + i / 7) % 1); ctx.fillStyle = `rgba(240,220,195,${0.55 * (1 - k)})`; ctx.beginPath(); ctx.arc(cx - (70 + k * 70) * sc, cy - (8 + k * 22) * sc, (8 + k * 18) * sc, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
      // shadow
      ctx.fillStyle = 'rgba(60,30,30,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 7, 0, 0, TAU); ctx.fill();
      // fish body
      const fb = ctx.createLinearGradient(0, -60, 0, -8); fb.addColorStop(0, '#ff7ae6'); fb.addColorStop(1, '#c8248e');
      ctx.fillStyle = fb; ctx.beginPath(); ctx.ellipse(6, -32, 58, 24, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-46, -32); ctx.lineTo(-80, -58); ctx.quadraticCurveTo(-70, -32, -80, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb0f0'; ctx.beginPath(); ctx.moveTo(-6, -54); ctx.quadraticCurveTo(10, -76, 28, -54); ctx.fill();
      // scales
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(-26 + i * 16 + j * 8, -38 + j * 12, 7, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke(); }
      // eye and grin
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(46, -38, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a0a1a'; ctx.beginPath(); ctx.arc(48, -38, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7a0a4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(52, -24, 9, 0.2, 1.4); ctx.stroke();
      // LED strip
      for (let i = 0; i < 10; i++) { ctx.fillStyle = ['#38f2ff', '#ffd84a', '#7aff8a'][(i + Math.floor(t * 8)) % 3]; ctx.beginPath(); ctx.arc(-40 + i * 10, -14, 2, 0, TAU); ctx.fill(); }
      // wheels
      for (const wx of [-30, 34]) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(wx, -6, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); const a = t * 30; ctx.moveTo(wx + Math.cos(a) * 6, -6 + Math.sin(a) * 6); ctx.lineTo(wx - Math.cos(a) * 6, -6 - Math.sin(a) * 6); ctx.stroke(); }
      // Brady riding on top
      ctx.save(); ctx.translate(4, -50); ctx.scale(0.95, 0.95);
      drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'ride', t, phase: 0 }, hair: null, look: Save.data.look, time: t });
      ctx.restore();
      ctx.restore();
      // waving checkered flag
      ctx.save(); ctx.translate(w - 22, 12);
      ctx.fillStyle = '#ddd'; ctx.fillRect(-1, 0, 2, h * 0.36);
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) { ctx.fillStyle = (r + q) % 2 ? '#111' : '#fff'; const wv = Math.sin(t * 6 - q * 0.9) * 2; ctx.fillRect(-1 - (q + 1) * 5, r * 5 + wv, 5, 5); }
      ctx.restore();
    }
    ctx.restore();
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    drawMenuBackdrop(ctx, (typeof BRADY_APP !== 'undefined' && BRADY_APP === 'world' && THEMES.tour_title) ? 'tour_title' : 'esplanade', this.t, 30);
    ctx.fillStyle = 'rgba(8,4,20,0.35)'; ctx.fillRect(0, 0, W, H);
    drawLogo(ctx, this.logo.x, this.logo.y, this.logo.size, this.t);
    for (const c of this.cards) this.drawCard(ctx, c, this.t);
    UI.drawButtons(ctx, this.btns);
    // Brady (and his headbang easter egg) in the corner
    const b = this.bradyPos;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.s, b.s);
    drawBrady(ctx, { x: 0, y: 0, facing: -1, small: true, power: Save.data.eggs.headbang ? 2 : 0, anim: this.anim, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
    ctx.save(); ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center';
    ctx.fillText(GAMES.length === 1 ? 'Super Brady-O World v' + GAME_VERSION + ' · an original game' : 'Brady-O v' + GAME_VERSION + ' · original games', W / 2, H - Math.max(10, insets.b + 6));
    if (this.toastT > 0) { ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = '#4aff8a'; ctx.fillText(this.toastShown, W / 2, this.logo.y + this.logo.size * 0.75); }
    ctx.restore();
  }
}
function totalLevels() { let n = 0; for (const w of WORLD_ORDER) n += WORLDS[w].plan.length; return n; }
function countGold(world) {
  let have = 0, total = 0;
  for (const w of (world ? [world] : WORLD_ORDER)) for (let i = 1; i <= WORLDS[w].plan.length; i++) {
    total += 3; const g = Save.data.gold[levelId(w, i)]; if (g) have += g.filter(Boolean).length;
  }
  return { have, total };
}
function worldUnlocked(w) { for (let i = 1; i <= WORLDS[w].plan.length; i++) if (isLevelUnlocked(levelId(w, i))) return true; return false; }
function visibleWorlds(set) {
  set = set || 'road';
  if (set === 'classic') return CLASSIC_WORLDS.slice();
  if (set === 'world') return WORLD3_REGIONS.filter(w => !WORLDS[w].secret || worldUnlocked(w));
  return WORLD_ORDER.filter(w => !WORLDS[w].secret || worldUnlocked(w));
}

/* ---------------- World map ---------------- */
class MapScene {
  constructor(world, set) {
    this.set = set || 'road';
    this.worlds = visibleWorlds(this.set);
    this.wi = Math.max(0, this.worlds.indexOf(world));
    this.t = 0; this.slide = 0;
    Input.setMode('ui');
    Sound.setRetro && Sound.setRetro(this.set === 'classic');
    Sound.music(this.set === 'classic' ? 'retro_title' : 'map');
    this.pickDefault();
    this.build();
  }
  get world() { return this.worlds[this.wi]; }
  pickDefault() {
    const w = this.world, n = WORLDS[w].plan.length;
    let sel = 1;
    for (let i = 1; i <= n; i++) if (isLevelUnlocked(levelId(w, i))) sel = i;
    for (let i = 1; i <= n; i++) if (isLevelUnlocked(levelId(w, i)) && !Save.data.done[levelId(w, i)]) { sel = i; break; }
    this.sel = sel; this.bradyNode = sel; this.bradyT = 1;
  }
  nodes() {
    const W = Game.cssW, H = Game.cssH, n = WORLDS[this.world].plan.length;
    const portrait = H > W;
    const top = portrait ? H * 0.28 : H * 0.3, bot = portrait ? H * 0.62 : H * 0.6;
    const left = Math.max(70, insets.l + 60), right = W - Math.max(70, insets.r + 60);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const k = n > 1 ? i / (n - 1) : 0.5;
      if (portrait) {
        const row = Math.floor(i / 4), col = i % 4, colR = row % 2 ? 3 - col : col;
        pts.push({ x: left + (right - left) * colR / 3, y: top + row * (bot - top) / Math.max(1, Math.ceil(n / 4) - 1) });
      } else pts.push({ x: left + (right - left) * k, y: lerp(bot, top, 0.5) + Math.sin(k * Math.PI * 2.2 + 0.6) * (bot - top) * 0.42 });
    }
    return pts;
  }
  build() {
    const W = Game.cssW, H = Game.cssH;
    const bw = Math.min(200, W * 0.42);
    const bottom = H - Math.max(16, insets.b + 10);
    this.btns = [
      { x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => { Sound.play('back'); Game.setScene(new TitleScene()); } },
      { x: W / 2 - bw / 2, y: bottom - 54, w: bw, h: 52, label: 'PLAY', primary: true, fn: () => this.play() }
    ];
    this.arrowL = { x: Math.max(8, insets.l), y: H / 2 - 30, w: 44, h: 60 };
    this.arrowR = { x: W - Math.max(8, insets.r) - 44, y: H / 2 - 30, w: 44, h: 60 };
  }
  resize() { this.build(); }
  play() {
    const id = levelId(this.world, this.sel);
    if (!isLevelUnlocked(id)) { Sound.play('bump'); return; }
    Sound.play('select');
    if (this.set === 'road') Save.data.lastWorld = this.world; else if (this.set === 'classic') Save.data.lastClassic = this.world;
    Save.save();
    Game.setScene(new Play(getLevel(this.world, this.sel), {}));
  }
  changeWorld(d) {
    const nw = this.wi + d;
    if (nw < 0 || nw >= this.worlds.length) return;
    this.wi = nw; this.slide = -d; Sound.play('select'); this.pickDefault();
    Sound.music(this.set === 'classic' ? 'retro_title' : this.world === 12 ? 'glitch' : WORLDS[this.world].secret ? 'secret' : 'map');
  }
  update(dt) {
    this.t += dt;
    this.slide = approach(this.slide, 0, dt * 4);
    if (this.bradyT < 1) this.bradyT = Math.min(1, this.bradyT + dt * 3);
    // keyboard / controller: arrows pick levels and worlds, enter or jump plays
    const key = Input.uiKey;
    if (key === 'up' || key === 'down') { Input.uiKey = null; this.changeWorld(key === 'up' ? -1 : 1); return; }
    if (key === 'enter' || (Input.jumpPressed && !Input.usingTouch)) { Input.uiKey = null; this.play(); return; }
    if (key === 'left' || key === 'right') Input.uiKey = null;
    const hit = UI.hitButtons(this.btns);
    if (hit) { hit.fn(); return; }
    const inRect = (tp, r) => tp.x >= r.x && tp.x <= r.x + r.w && tp.y >= r.y && tp.y <= r.y + r.h;
    for (const tp of Input.taps) {
      if (inRect(tp, this.arrowL)) { this.changeWorld(-1); return; }
      if (inRect(tp, this.arrowR)) { this.changeWorld(1); return; }
      const pts = this.nodes();
      for (let i = 0; i < pts.length; i++) {
        if (Math.hypot(tp.x - pts[i].x, tp.y - pts[i].y) < 26) {
          const id = levelId(this.world, i + 1);
          if (!isLevelUnlocked(id)) { Sound.play('bump'); return; }
          if (this.sel === i + 1) { this.play(); return; }
          this.bradyFrom = this.sel; this.sel = i + 1; this.bradyT = 0; Sound.play('select');
          return;
        }
      }
    }
    if (Input.lastSwipe) { const s = Input.lastSwipe; Input.lastSwipe = null; if (Math.abs(s.dx) > Math.abs(s.dy)) this.changeWorld(s.dx < 0 ? 1 : -1); }
    const k = key;
    if (k === 'left' || k === 'right') {
      const d = k === 'left' ? -1 : 1, n = WORLDS[this.world].plan.length;
      const ns = this.sel + d;
      if (ns < 1) this.changeWorld(-1); else if (ns > n) this.changeWorld(1);
      else if (isLevelUnlocked(levelId(this.world, ns))) { this.bradyFrom = this.sel; this.sel = ns; this.bradyT = 0; Sound.play('select', { vol: 0.5 }); }
    }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, w = this.world, Wd = WORLDS[w];
    drawMenuBackdrop(ctx, Wd.theme, this.t, 18);
    ctx.fillStyle = 'rgba(6,4,14,0.35)'; ctx.fillRect(0, 0, W, H);
    const unlockedW = worldUnlocked(w);
    ctx.save();
    ctx.translate(this.slide * W * 0.3, 0); ctx.globalAlpha = 1 - Math.abs(this.slide);
    // header
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = THEMES[Wd.theme].accent;
    ctx.fillText((this.set === 'classic' ? 'CLASSIC · ' : '') + (Wd.secret ? 'SECRET WORLD ' + Wd.label : 'WORLD ' + (this.set === 'classic' ? w - 30 : w)), W / 2, Math.max(30, insets.t + 24));
    UI.title(ctx, Wd.name.toUpperCase(), W / 2, Math.max(58, insets.t + 52), Math.min(32, W * 0.06));
    const cg = countGold(w);
    let done = 0; for (let i = 1; i <= Wd.plan.length; i++) if (Save.data.done[levelId(w, i)]) done++;
    ctx.font = `12px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${done}/${Wd.plan.length} cleared   ·   ${cg.have}/${cg.total} photos of Chinka`, W / 2, Math.max(82, insets.t + 76));
    // path
    const pts = this.nodes();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
    pts.forEach((p, i) => {
      const id = levelId(w, i + 1), un = isLevelUnlocked(id), dn = Save.data.done[id], sel = this.sel === i + 1;
      const castle = Wd.plan[i] === 'castle';
      const r = sel ? 21 : 17;
      ctx.save();
      if (sel) { ctx.shadowColor = THEMES[Wd.theme].accent; ctx.shadowBlur = 18; }
      const g = ctx.createRadialGradient(p.x - 5, p.y - 6, 2, p.x, p.y, r);
      if (!un) { g.addColorStop(0, '#4a4656'); g.addColorStop(1, '#24202e'); }
      else if (dn) { g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#d88a1a'); }
      else { g.addColorStop(0, '#ff9ae8'); g.addColorStop(1, '#9a2acf'); }
      ctx.fillStyle = g; ctx.beginPath();
      if (castle) { ctx.moveTo(p.x - r, p.y + r * 0.8); ctx.lineTo(p.x - r, p.y - r * 0.5); ctx.lineTo(p.x - r * 0.5, p.y - r * 0.5); ctx.lineTo(p.x - r * 0.5, p.y - r); ctx.lineTo(p.x + r * 0.5, p.y - r); ctx.lineTo(p.x + r * 0.5, p.y - r * 0.5); ctx.lineTo(p.x + r, p.y - r * 0.5); ctx.lineTo(p.x + r, p.y + r * 0.8); ctx.closePath(); }
      else ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = sel ? 2.5 : 1.5; ctx.stroke();
      ctx.fillStyle = un ? '#1a0a24' : 'rgba(255,255,255,0.5)'; ctx.font = `${sel ? 15 : 13}px ${FONT_DISPLAY}`;
      ctx.fillText(un ? String(i + 1) : '🔒', p.x, p.y + 1);
      // gold pips
      const gd = Save.data.gold[id] || [];
      for (let k = 0; k < 3; k++) { ctx.fillStyle = gd[k] ? '#ffd84a' : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(p.x - 9 + k * 9, p.y + r + 8, 3, 0, TAU); ctx.fill(); }
      if (Save.data.secretExits[id]) { ctx.fillStyle = '#00ff9a'; ctx.beginPath(); ctx.arc(p.x + r - 2, p.y - r + 2, 4, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    // Brady on the map
    const from = pts[(this.bradyFrom || this.sel) - 1] || pts[0], to = pts[this.sel - 1] || pts[0];
    const k = easeInOut(this.bradyT);
    const bx = lerp(from.x, to.x, k), by = lerp(from.y, to.y, k) - 22 - Math.abs(Math.sin(k * Math.PI)) * 14;
    ctx.save(); ctx.translate(bx, by); ctx.scale(1.1, 1.1);
    drawBrady(ctx, { x: 0, y: 0, facing: to.x >= from.x ? 1 : -1, small: true, power: 0, anim: { state: this.bradyT < 1 ? 'run' : 'idle', t: this.t, phase: this.t * 14, speed: 1 }, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
    // selected level info
    const id = levelId(w, this.sel);
    ctx.textAlign = 'center';
    const infoY = H - Math.max(16, insets.b + 10) - 104;
    ctx.font = `${Math.min(20, W * 0.045)}px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Wd.label || (this.set === 'classic' ? w - 30 : w)}-${this.sel}  ${Wd.names[this.sel - 1].toUpperCase()}`, W / 2, infoY);
    const best = Save.data.best[id];
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const typeName = { ow: 'Overworld', under: 'Underground', sky: 'Sky', water: 'Underwater', tower: 'Tower climb', castle: 'Boss fortress', auto: 'Auto-scroll' }[Wd.plan[this.sel - 1]];
    ctx.fillText(typeName + (best ? `  ·  best ${best}s` : '') + (isLevelUnlocked(id) ? '' : '  ·  locked'), W / 2, infoY + 20);
    ctx.restore();
    if (!unlockedW) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.font = `20px ${FONT_DISPLAY}`; ctx.fillStyle = '#fff'; ctx.fillText('LOCKED', W / 2, H / 2); ctx.restore(); }
    // arrows
    const arrow = (r, d, on) => { if (!on) return; ctx.save(); ctx.fillStyle = 'rgba(10,8,18,0.5)'; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); const cx = r.x + r.w / 2, cy = r.y + r.h / 2; ctx.moveTo(cx + d * 8, cy); ctx.lineTo(cx - d * 6, cy - 12); ctx.lineTo(cx - d * 6, cy + 12); ctx.fill(); ctx.restore(); };
    arrow(this.arrowL, -1, this.wi > 0); arrow(this.arrowR, 1, this.wi < this.worlds.length - 1);
    this.btns[1].disabled = !isLevelUnlocked(id);
    UI.drawButtons(ctx, this.btns);
  }
}

/* ---------------- Look editor ---------------- */
class LookScene {
  constructor() { this.t = 0; this.anim = { state: 'idle', t: 0, phase: 0 }; this.hair = null; Input.setMode('ui'); this.build(); }
  build() {
    const W = Game.cssW, H = Game.cssH;
    const L = Save.data.look;
    const portrait = H > W;
    this.preview = portrait ? { x: W / 2, y: H * 0.5, s: Math.min(3, W / 120) } : { x: W * 0.27, y: H * 0.84, s: Math.min(4.2, H / 92) };
    this.swX = portrait ? 24 : W * 0.5; this.swY = portrait ? H * 0.56 : Math.max(70, insets.t + 62); this.swW = portrait ? W - 48 : W * 0.46;
    this.size = Math.min(38, this.swW / 9 - 5);
    const ty = this.swY + 26 + this.size * 2 + 64;
    const bw = (this.swW - 10) / 2, bh = 34;
    const toggle = (label, i, fn) => ({ x: this.swX + (i % 2) * (bw + 10), y: ty + Math.floor(i / 2) * (bh + 8), w: bw, h: bh, label, size: 11, fn: () => { fn(); Sound.play('select'); Save.save(); this.build(); } });
    const cyc = (v, arr) => arr[(arr.indexOf(v) + 1) % arr.length];
    this.btns = [
      { x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => { Sound.play('back'); Save.save(); Game.setScene(new TitleScene()); } },
      toggle('HAIR: ' + (L.style === 'down' ? 'WORN DOWN' : 'MAN BUN'), 0, () => { L.style = L.style === 'down' ? 'bun' : 'down'; }),
      toggle('GLASSES: ' + ({ shades: 'SHADES', clear: 'CLEAR', none: 'NONE' }[L.glasses] || 'SHADES'), 1, () => { L.glasses = cyc(L.glasses || 'shades', ['shades', 'clear', 'none']); }),
      toggle('TATTOOS: ' + (L.tattoos === false ? 'OFF' : 'ON'), 2, () => { L.tattoos = L.tattoos === false; }),
      toggle('STUBBLE: ' + (L.beard === false ? 'OFF' : 'ON'), 3, () => { L.beard = L.beard === false; })
    ];
  }
  resize() { this.build(); }
  swatches() {
    const out = [];
    const size = this.size;
    let col = 0;
    HAIR_COLORS.forEach((h, i) => { if (h.secret && !Save.data.eggs.code) return; out.push({ kind: 'hair', i, x: this.swX + (col++) * (size + 5), y: this.swY + 26, s: size }); });
    for (let i = 0; i < SKIN_TONES.length; i++) out.push({ kind: 'skin', i, x: this.swX + i * (size + 5), y: this.swY + 26 + size + 40, s: size });
    return out;
  }
  update(dt) {
    this.t += dt; this.anim.t += dt;
    this.anim.state = (this.t % 9) > 6 ? 'airguitar' : 'idle';
    const hit = UI.hitButtons(this.btns); if (hit) { hit.fn(); return; }
    for (const tp of Input.taps) for (const sw of this.swatches()) {
      if (tp.x >= sw.x && tp.x <= sw.x + sw.s && tp.y >= sw.y && tp.y <= sw.y + sw.s) { Save.data.look[sw.kind] = sw.i; Sound.play('select'); Save.save(); }
    }
    const ha = hairAnchor(0, 0, 1, false, bradyPose(this.anim, false));
    if (!this.hair) this.hair = makeHair(BRADY_DIM.big.hairN, ha.x, ha.y);
    stepHair(this.hair, ha.x, ha.y, 1, BRADY_DIM.big.hairL, dt, Math.sin(this.t) * 900 + (this.anim.state === 'airguitar' ? Math.sin(this.anim.t * 16) * 9000 : 0));
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    drawMenuBackdrop(ctx, 'backstage', this.t, 10);
    ctx.fillStyle = 'rgba(6,4,14,0.45)'; ctx.fillRect(0, 0, W, H);
    UI.title(ctx, 'LOOK', W / 2, Math.max(34, insets.t + 30), 28);
    const p = this.preview;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 26 * p.s, 5 * p.s, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s);
    drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: this.anim, hair: this.hair, look: Save.data.look, time: this.t });
    ctx.restore();
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffd84a';
    const size = this.size;
    ctx.fillText('HAIR  ·  ' + (HAIR_COLORS[Save.data.look.hair] || HAIR_COLORS[0]).name.toUpperCase(), this.swX, this.swY + 10);
    ctx.fillText('SKIN  ·  ' + SKIN_TONES[Save.data.look.skin].name.toUpperCase(), this.swX, this.swY + 26 + size + 24);
    for (const sw of this.swatches()) {
      const c = sw.kind === 'hair' ? HAIR_COLORS[sw.i] : SKIN_TONES[sw.i];
      const g = ctx.createLinearGradient(sw.x, sw.y, sw.x + sw.s, sw.y + sw.s);
      g.addColorStop(0, sw.kind === 'hair' ? c.hi : c.base); g.addColorStop(1, sw.kind === 'hair' ? c.base : c.sh);
      ctx.fillStyle = g; rr(ctx, sw.x, sw.y, sw.s, sw.s, 10); ctx.fill();
      const on = Save.data.look[sw.kind] === sw.i;
      ctx.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = on ? 3 : 1; rr(ctx, sw.x, sw.y, sw.s, sw.s, 10); ctx.stroke();
    }
    ctx.restore();
    UI.drawButtons(ctx, this.btns);
  }
}

/* ---------------- Settings ---------------- */
class SettingsScene {
  constructor(back) { this.t = 0; this.back = back; this.confirmReset = false; Input.setMode('ui'); this.build(); }
  build() {
    const W = Game.cssW, H = Game.cssH, st = Save.data.settings;
    const pw = Math.min(460, W - 40), px = (W - pw) / 2;
    const motionRow = typeof TourKit !== 'undefined';   // Super Brady-O World: a reduced-motion switch
    const rowH = Math.min(50, (H - 140) / ((motionRow ? 8 : 7) + (typeof Play !== 'undefined' && Play.zoomNear ? 1 : 0)));
    let y = Math.max(70, insets.t + 64);
    const row = (label, value, fn) => { const b = { x: px, y, w: pw, h: rowH - 8, label: `${label}:  ${value}`, size: 13, fn }; y += rowH; return b; };
    const pct = v => Math.round(v * 100) + '%';
    const cycle = (v, arr) => arr[(arr.indexOf(v) + 1) % arr.length];
    this.btns = [
      { x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => { Sound.play('back'); Save.save(); Game.setScene(this.back && this.back.resume ? this.back : new TitleScene()); } },
      row('MUSIC', pct(st.music), () => { st.music = cycle(Math.round(st.music * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setMusicVolume(st.music); this.build(); }),
      row('SOUND FX', pct(st.sfx), () => { st.sfx = cycle(Math.round(st.sfx * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setSfxVolume(st.sfx); Sound.play('pick'); this.build(); }),
      row('BUTTON SIZE', { 0.85: 'SMALL', 1: 'MEDIUM', 1.2: 'LARGE' }[st.ctrlScale] || 'MEDIUM', () => { st.ctrlScale = cycle(st.ctrlScale, [0.85, 1, 1.2]); Game.resize(); this.build(); }),
      row('CONTROLS', st.lefty ? 'JUMP ON LEFT' : 'JUMP ON RIGHT', () => { st.lefty = !st.lefty; Game.resize(); this.build(); }),
      row('SCREEN SHAKE', st.shake ? 'ON' : 'OFF', () => { st.shake = !st.shake; this.build(); }),
      row('QUALITY', st.hq ? 'ULTRA' : 'HIGH', () => { st.hq = !st.hq; Game.resize(); this.build(); }),
      ...(typeof Play !== 'undefined' && Play.zoomNear ? [row('ZOOM', Play.zoomNear() ? 'NEAR (BIGGER)' : 'FAR (SEE MORE)', () => { st.zoom = Play.zoomNear() ? 'far' : 'near'; this.build(); })] : []),
      ...(motionRow ? [row('MOTION EFFECTS', TourKit.reduceMotion() ? 'REDUCED' : 'FULL', () => { st.reduceMotion = !TourKit.reduceMotion(); this.build(); })] : []),
      row('RESET PROGRESS', this.confirmReset ? 'TAP AGAIN TO ERASE' : 'ERASE ALL', () => { if (this.confirmReset) { const look = Save.data.look; Save.reset(); Save.data.look = look; Save.save(); this.confirmReset = false; Sound.play('powerdown'); } else this.confirmReset = true; this.build(); })
    ];
    Save.save();
  }
  resize() { this.build(); }
  update(dt) { this.t += dt; const hit = UI.hitButtons(this.btns); if (hit) { Sound.play('select'); hit.fn(); } }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    drawMenuBackdrop(ctx, 'citadel', this.t, 12);
    ctx.fillStyle = 'rgba(6,4,14,0.55)'; ctx.fillRect(0, 0, W, H);
    UI.title(ctx, 'SETTINGS', W / 2, Math.max(34, insets.t + 30), 28);
    UI.drawButtons(ctx, this.btns);
    ctx.save(); ctx.textAlign = 'center'; ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Sound off? Check the silent switch on your iPhone.  ·  Keyboard & Bluetooth controllers work too.', W / 2, H - Math.max(14, insets.b + 8));
    ctx.restore();
  }
}

/* ---------------- Pause ---------------- */
function buildPauseUI(play) {
  const W = Game.cssW, H = Game.cssH;
  const bw = Math.min(240, W * 0.6), bh = 44, x = (W - bw) / 2;
  let y = H / 2 - 100;
  const st = Save.data.settings;
  const list = [
    { x, y, w: bw, h: bh + 4, label: 'RESUME', primary: true, fn: () => play.closePause() },
    { x, y: y += 58, w: bw, h: bh, label: 'RESTART LEVEL', fn: () => { play.paused = false; Sound.resume(); Game.setScene(new Play(play.level, {})); } },
    { x, y: y += 54, w: bw, h: bh, label: play.level && play.level.tour ? 'WORLD MAP' : play.set === 'world' ? 'CITY MAP' : 'WORLD MAP', fn: () => { play.paused = false; Sound.resume(); Save.save(); goToMap(play.set, play.level.world, play.id); } },
    ...(play.level && play.level.tour && typeof TourKit !== 'undefined' ? [
      // the world tour: a third switch for the trip effects (the same setting as MOTION EFFECTS in Settings)
      { x, y: y += 54, w: bw / 3 - 4, h: bh, label: st.music > 0 ? 'MUSIC ON' : 'MUSIC OFF', size: 10, fn: () => { st.music = st.music > 0 ? 0 : 0.6; Sound.setMusicVolume(st.music); Save.save(); play.pauseUI = buildPauseUI(play); } },
      { x: x + bw / 3 + 2, y, w: bw / 3 - 4, h: bh, label: st.sfx > 0 ? 'SFX ON' : 'SFX OFF', size: 10, fn: () => { st.sfx = st.sfx > 0 ? 0 : 0.8; Sound.setSfxVolume(st.sfx); Save.save(); play.pauseUI = buildPauseUI(play); } },
      { x: x + bw * 2 / 3 + 4, y, w: bw / 3 - 4, h: bh, label: TourKit.reduceMotion() ? 'FX CALM' : 'FX FULL', size: 10, fn: () => { st.reduceMotion = !TourKit.reduceMotion(); Save.save(); play.pauseUI = buildPauseUI(play); } }
    ] : [
      { x, y: y += 54, w: bw / 2 - 5, h: bh, label: st.music > 0 ? 'MUSIC ON' : 'MUSIC OFF', size: 12, fn: () => { st.music = st.music > 0 ? 0 : 0.6; Sound.setMusicVolume(st.music); Save.save(); play.pauseUI = buildPauseUI(play); } },
      { x: x + bw / 2 + 5, y, w: bw / 2 - 5, h: bh, label: st.sfx > 0 ? 'SFX ON' : 'SFX OFF', size: 12, fn: () => { st.sfx = st.sfx > 0 ? 0 : 0.8; Sound.setSfxVolume(st.sfx); Save.save(); play.pauseUI = buildPauseUI(play); } }
    ]),
    // camera zoom (Play.viewRows): Near shows everything 20 % larger, Far shows more of the level
    ...(play.viewRows ? [{ x, y: y += 54, w: bw, h: bh, label: Play.zoomNear() ? 'ZOOM: NEAR' : 'ZOOM: FAR', size: 12, fn: () => { st.zoom = Play.zoomNear() ? 'far' : 'near'; Save.save(); Game.setRows(play.viewRows()); play.pauseUI = buildPauseUI(play); } }] : [])
  ];
  list.focus = 0;
  return list;
}
function drawPauseUI(ctx, play) {
  const W = Game.cssW, H = Game.cssH;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,14,0.6)'; ctx.fillRect(0, 0, W, H);
  UI.panel(ctx, W / 2 - Math.min(150, W * 0.4), H / 2 - 160, Math.min(300, W * 0.8), play.pauseUI && play.pauseUI.length > 5 ? 336 : 330);
  UI.title(ctx, 'PAUSED', W / 2, H / 2 - 130, 24);
  ctx.textAlign = 'center'; ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`${play.level.worldName} · ${play.level.name}`, W / 2, H / 2 - 110);
  UI.drawButtons(ctx, play.pauseUI);
  ctx.restore();
}

/* ---------------- Game over ---------------- */
class GameOverScene {
  constructor(level, checkpoint, set) {
    this.level = level; this.t = 0; this.set = set || 'road'; Input.setMode('ui'); Sound.music(this.set === 'classic' ? 'retro_die' : 'gameover');
    const W = Game.cssW, H = Game.cssH, bw = Math.min(220, W * 0.6);
    this.btns = [
      { x: (W - bw) / 2, y: H / 2 + 20, w: bw, h: 50, label: 'CONTINUE', primary: true, fn: () => { Save.data.lives = 5; Save.save(); Sound.play('select'); Game.setScene(new Play(level, { checkpoint })); } },
      { x: (W - bw) / 2, y: H / 2 + 82, w: bw, h: 44, label: 'MAP', fn: () => { Save.data.lives = 5; Save.save(); Sound.play('select'); goToMap(this.set, level.world, level.id); } }
    ];
    this.btns.focus = 0;
  }
  update(dt) { this.t += dt; if (this.t < 0.8) return; const h = UI.hitButtons(this.btns); if (h) h.fn(); }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    drawMenuBackdrop(ctx, this.level && this.level.tour && THEMES.tour_dusk ? 'tour_dusk' : 'citadel', this.t, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    UI.title(ctx, 'GAME OVER', W / 2, H / 2 - 50, Math.min(48, W * 0.09));
    ctx.save(); ctx.textAlign = 'center'; ctx.font = `13px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(this.level && this.level.tour ? 'Baron Bric-a-Brac wins this round. Not the trip.' : 'The Man wins this round. Not the war.', W / 2, H / 2 - 12); ctx.restore();
    UI.drawButtons(ctx, this.btns);
  }
}

/* ---------------- Credits / ending ---------------- */
class CreditsScene {
  constructor(set) {
    this.set = set || 'road';
    this.t = 0; Input.setMode('ui'); Sound.music('credits');
    const burns = this.set === 'burns';
    const g = countGold(), sp = setProgress('world');
    const B = (Save.data.burns || {}), nk = o => o ? Object.keys(o).length : 0;
    const bosses = [];
    if (burns) bosses.push('The Man (four times. He really loves her.)', 'The Greeter Gauntlet', 'The Velvet Creeper', 'Chad, Founder & CEO', 'The Glitter Queen', 'DPW Foreman Rusty');
    else if (typeof WORLD3_REGIONS !== 'undefined') for (const w of WORLD3_REGIONS) { const n = bossName(w); if (n && bosses.indexOf(n) < 0) bosses.push(n); }
    // Branding: the Burning Man game never says "Brady-O" (the hero is just Brady).
    const head = burns ? 'BRADY GOES TO BURNING MAN' : this.set === 'world' ? 'SUPER BRADY-O WORLD' : 'BRADY-O';
    const tag = burns ? 'ONE WEEK IN BLACK ROCK CITY' : 'A TRIP AROUND THE WORLD';
    const nWorlds = (typeof BURNS_WORLD_ORDER !== 'undefined') ? BURNS_WORLD_ORDER.length : 17;
    this.lines = [
      [head, 'h'], [tag, 'k'], ['', ''], ['Chinka is safe. The Man burned. Nobody hydrated enough.', 's'], ['', ''],
      ['STARRING', 'k'], ['Brady  ·  long hair, man bun, zero chill', 'v'], ['Chinka  ·  the actual hero, honestly', 'v'], ['Slothy  ·  very fast, for a sloth', 'v'], ['Toadie & the Toad Crew  ·  hydration consultants', 'v'], ['', ''],
      ['AND INTRODUCING', 'k'], ['The Man  ·  forty feet of wood with a crush on Chinka', 'v'], ['', ''],
      ['BURNERS WHO GOT IN THE WAY', 'k'], ['Hippies who want to talk about your aura', 'v'], ['Tech bros on electric unicycles', 'v'], ['Orgy dome creepers in fur coats', 'v'], ['Sparkle ponies who forgot water', 'v'], ['Fake spiritual pagan witches', 'v'], ['DPW. Obviously DPW.', 'v'], ['', ''],
      [burns ? 'BOSSES' : 'CAMP BOSSES', 'k'], ...bosses.map(n => [n, 'v']), ['', ''],
      ...(burns ? [
        ['YOUR STATS', 'k'], [`Burn Tokens: ${nk(B.tokens)}`, 'v'], [`Photos of Chinka: ${nk(B.photos)}`, 'v'], [`Worlds cleared: ${nk(B.worldDone)} / ${nWorlds}`, 'v'], ['', ''],
        ['Six-day drivers, stressed camp leads and greeters', 's'], ['Influencers, sparkle ponies and crusty old burners', 's'], ['It was better last year. It always is.', 's'], ['', '']
      ] : [
        ['YOUR STATS', 'k'], [`Photos of Chinka: ${g.have} / ${g.total}`, 'v'], [`Levels cleared: ${sp.done} / ${sp.total}`, 'v'], [`Score: ${Save.data.score}`, 'v'], [`Times the Man got you: ${Save.data.deaths || 0}`, 'v'], ['', ''],
        [g.have >= g.total ? 'Every photo of Chinka. She framed them all.' : 'Some photos of Chinka are still out on the playa...', 's'],
        [WORLDS[50] && worldUnlocked(50) ? 'You found World 22.' : 'Legend speaks of a World 22.', 's'], ['', '']
      ]),

      ['Leave no trace. Hug your sloth.', 's'], ['', ''], ['', ''],
      ['THANKS FOR PLAYING', 'h']
    ];
    if (this.set === 'world' && typeof tourCreditsLines !== 'undefined') this.lines = [[head, 'h'], [tag, 'k'], ['', ''], ...tourCreditsLines(), ['THANKS FOR PLAYING', 'h']];
    if (this.set === 'world') { Save.data.beatGame = true; Save.save(); }
    const W = Game.cssW, H = Game.cssH;
    this.btns = [{ x: W - Math.max(14, insets.r + 8) - 110, y: H - Math.max(14, insets.b + 8) - 42, w: 110, h: 40, label: 'MENU ▶', fn: () => Game.setScene(new TitleScene()) }];
  }
  update(dt) { this.t += dt; const h = UI.hitButtons(this.btns); if (h) h.fn(); if (Math.random() < 0.05) this.fw = { x: Math.random(), y: Math.random() * 0.5, t: 0 }; }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    drawMenuBackdrop(ctx, this.set === 'world' ? (THEMES.tour_dusk ? 'tour_dusk' : 'deepplaya') : 'burn', this.t, 25);
    ctx.fillStyle = 'rgba(6,4,14,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = H + 20 - this.t * 40;
    for (const [txt, k] of this.lines) {
      if (y > -40 && y < H + 40) {
        if (k === 'h') { drawLogo(ctx, W / 2, y, Math.min(56, W * 0.1), this.t, txt); }
        else { ctx.font = k === 'k' ? `13px ${FONT_DISPLAY}` : k === 's' ? `italic 15px ${FONT_UI}` : `16px ${FONT_UI}`; ctx.fillStyle = k === 'k' ? '#ffd84a' : '#ffffff'; ctx.fillText(txt, W / 2, y); }
      }
      y += k === 'h' ? 80 : 30;
    }
    if (y < 0) this.t = 0;
    ctx.restore();
    UI.drawButtons(ctx, this.btns);
  }
}
