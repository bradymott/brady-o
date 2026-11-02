/* ============================================================
   Input — multitouch virtual controls, keyboard, gamepad
   ============================================================ */
const Input = {
  // held state (gameplay)
  left: false, right: false, up: false, down: false, jump: false, action: false,
  // edge state (consumed by game each frame)
  jumpPressed: false, actionPressed: false, upPressed: false, downPressed: false,
  pausePressed: false,
  // UI taps queue in CSS px
  taps: [],
  mode: 'ui',            // 'ui' | 'game'
  touches: new Map(),    // pointerId -> {role, ox, oy, x, y, sx, sy, t}
  keys: {},
  stick: { active: false, ox: 0, oy: 0, x: 0, y: 0, id: null },
  layout: null,          // computed control positions (CSS px)
  lastTouchTime: 0,
  usingTouch: false,
  anyKeyPressed: false,
  swipes: [],            // for easter-egg codes on title screen: 'U','D','L','R'

  init(canvas) {
    this.canvas = canvas;
    const opts = { passive: false };
    canvas.addEventListener('pointerdown', e => this.onDown(e), opts);
    canvas.addEventListener('pointermove', e => this.onMove(e), opts);
    canvas.addEventListener('pointerup', e => this.onUp(e), opts);
    canvas.addEventListener('pointercancel', e => this.onUp(e, true), opts);
    canvas.addEventListener('lostpointercapture', e => this.onUp(e, true), opts);
    // Stop iOS scrolling, zoom, callouts and magnifier
    const stop = e => { if (e.cancelable) e.preventDefault(); };
    canvas.addEventListener('touchstart', stop, opts);
    canvas.addEventListener('touchmove', stop, opts);
    canvas.addEventListener('touchend', e => { stop(e); Sound.unlock(); }, opts);
    canvas.addEventListener('contextmenu', stop, opts);
    document.addEventListener('gesturestart', stop, opts);
    document.addEventListener('dblclick', stop, opts);
    window.addEventListener('keydown', e => this.onKey(e, true));
    window.addEventListener('keyup', e => this.onKey(e, false));
    window.addEventListener('blur', () => this.releaseAll());
  },

  releaseAll() {
    this.touches.clear();
    this.stick.active = false; this.stick.id = null;
    this.keys = {};
    this.recompute();
  },

  computeLayout(cssW, cssH, gameRect) {
    const s = Save.data ? Save.data.settings.ctrlScale : 1;
    const lefty = Save.data ? Save.data.settings.lefty : false;
    const portrait = cssH > cssW;
    const base = Math.min(cssW, cssH);
    const r = clamp(base * 0.105, 34, 58) * s;
    const safeL = Math.max(14, insets.l), safeR = Math.max(14, insets.r), safeB = Math.max(12, insets.b);
    let jumpX, jumpY, actX, actY, stickX, stickY;
    if (portrait) {
      const ctlTop = gameRect.y + gameRect.h;
      const midY = ctlTop + (cssH - ctlTop) * 0.5;
      jumpX = cssW - safeR - r * 1.25; jumpY = midY + r * 0.35;
      actX = jumpX - r * 2.3; actY = midY - r * 0.55;
      stickX = safeL + r * 1.9; stickY = midY;
    } else {
      jumpX = cssW - safeR - r * 1.3; jumpY = cssH - safeB - r * 1.35;
      actX = jumpX - r * 2.25; actY = jumpY + r * 0.25;
      stickX = safeL + r * 2.0; stickY = cssH - safeB - r * 1.9;
    }
    if (lefty) {
      jumpX = cssW - jumpX; actX = cssW - actX; stickX = cssW - stickX;
    }
    this.layout = {
      r, portrait, lefty,
      jump: { x: jumpX, y: jumpY, r: r },
      action: { x: actX, y: actY, r: r * 0.78 },
      stickHome: { x: stickX, y: stickY, r: r * 1.15 },
      pause: { x: lefty ? safeL + 22 : cssW - safeR - 22, y: Math.max(10, insets.t) + 22, r: 20 },
      split: lefty ? cssW * 0.55 : cssW * 0.45
    };
  },

  pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  },

  classify(x, y) {
    const L = this.layout;
    if (!L) return 'none';
    if (Math.hypot(x - L.pause.x, y - L.pause.y) < L.pause.r * 1.6) return 'pause';
    const leftSide = L.lefty ? x > L.split : x < L.split;
    if (leftSide) return 'stick';
    const da = Math.hypot(x - L.action.x, y - L.action.y);
    const dj = Math.hypot(x - L.jump.x, y - L.jump.y);
    if (da < L.action.r * 1.35 && da < dj) return 'action';
    return 'jump';
  },

  onDown(e) {
    if (e.cancelable) e.preventDefault();
    Sound.unlock();
    this.usingTouch = e.pointerType !== 'mouse';
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = this.pos(e);
    const t = { role: 'tap', ox: p.x, oy: p.y, x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now() };
    if (this.mode === 'game') {
      t.role = this.classify(p.x, p.y);
      if (t.role === 'stick') {
        this.stick.active = true; this.stick.id = e.pointerId;
        this.stick.ox = p.x; this.stick.oy = p.y; this.stick.x = p.x; this.stick.y = p.y;
      } else if (t.role === 'jump') { this.jumpPressed = true; }
      else if (t.role === 'action') { this.actionPressed = true; }
      else if (t.role === 'pause') { this.pausePressed = true; }
    }
    this.touches.set(e.pointerId, t);
    this.recompute();
  },

  onMove(e) {
    const t = this.touches.get(e.pointerId);
    if (!t) return;
    if (e.cancelable) e.preventDefault();
    const p = this.pos(e);
    t.x = p.x; t.y = p.y;
    if (this.mode === 'game') {
      if (t.role === 'stick' && this.stick.id === e.pointerId) {
        this.stick.x = p.x; this.stick.y = p.y;
        // floating origin: drag the origin along if finger goes far
        const max = this.layout.r * 1.2;
        const dx = p.x - this.stick.ox, dy = p.y - this.stick.oy;
        const d = Math.hypot(dx, dy);
        if (d > max) { this.stick.ox = p.x - dx / d * max; this.stick.oy = p.y - dy / d * max; }
      } else if (t.role === 'jump' || t.role === 'action') {
        // allow rolling the thumb between buttons
        const role = this.classify(p.x, p.y);
        if ((role === 'jump' || role === 'action') && role !== t.role) {
          t.role = role;
          if (role === 'jump') this.jumpPressed = true; else this.actionPressed = true;
        }
      }
    }
    this.recompute();
  },

  onUp(e, cancel) {
    if (!cancel) Sound.unlock();
    const t = this.touches.get(e.pointerId);
    if (!t) return;
    if (e.cancelable) e.preventDefault();
    this.touches.delete(e.pointerId);
    if (this.stick.id === e.pointerId) { this.stick.active = false; this.stick.id = null; }
    if (!cancel) {
      const dist = Math.hypot(t.x - t.sx, t.y - t.sy);
      const dt = performance.now() - t.t;
      if (this.mode === 'ui' && dist < 24) this.taps.push({ x: t.x, y: t.y });
      if (this.mode === 'ui' && dist > 50 && dt < 600) {
        const dx = t.x - t.sx, dy = t.y - t.sy;
        this.swipes.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
        if (this.swipes.length > 12) this.swipes.shift();
        this.lastSwipe = { dx, dy };
      }
    }
    this.recompute();
  },

  onKey(e, down) {
    const k = e.code;
    const map = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
      KeyX: 'action', KeyJ: 'action', ShiftLeft: 'action', ShiftRight: 'action',
      Enter: 'enter', Escape: 'pause', KeyP: 'pause'
    };
    const a = map[k];
    if (!a) return;
    if (e.cancelable) e.preventDefault();
    Sound.unlock();
    this.usingTouch = false;
    const was = !!this.keys[a];
    this.keys[a] = down;
    if (down && !was) {
      this.anyKeyPressed = true;
      if (a === 'jump') this.jumpPressed = true;
      if (a === 'action') this.actionPressed = true;
      if (a === 'pause') this.pausePressed = true;
      if (a === 'up') this.upPressed = true;
      if (a === 'down') this.downPressed = true;
      if (this.mode === 'ui') {
        const sw = { left: 'L', right: 'R', up: 'U', down: 'D' }[a];
        if (sw) { this.swipes.push(sw); if (this.swipes.length > 12) this.swipes.shift(); }
        this.uiKey = a;
      }
    }
    this.recompute();
  },

  pollGamepad() {
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) { this.pad = null; return; }
    const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const now = {
      left: b(14) || ax < -0.4, right: b(15) || ax > 0.4, up: b(12) || ay < -0.5, down: b(13) || ay > 0.5,
      jump: b(0) || b(1), action: b(2) || b(3) || b(7) || b(5), pause: b(9)
    };
    const prev = this.pad || {};
    if (now.jump && !prev.jump) { this.jumpPressed = true; if (this.mode === 'ui') this.uiKey = 'enter'; }
    if (now.action && !prev.action) this.actionPressed = true;
    if (now.pause && !prev.pause) this.pausePressed = true;
    if (now.up && !prev.up) { this.upPressed = true; if (this.mode === 'ui') this.uiKey = 'up'; }
    if (now.down && !prev.down) { this.downPressed = true; if (this.mode === 'ui') this.uiKey = 'down'; }
    if (this.mode === 'ui') {
      if (now.left && !prev.left) this.uiKey = 'left';
      if (now.right && !prev.right) this.uiKey = 'right';
    }
    this.pad = now;
    this.recompute();
  },

  recompute() {
    let l = !!this.keys.left, r = !!this.keys.right, u = !!this.keys.up, d = !!this.keys.down;
    let j = !!this.keys.jump, a = !!this.keys.action;
    if (this.pad) { l = l || this.pad.left; r = r || this.pad.right; u = u || this.pad.up; d = d || this.pad.down; j = j || this.pad.jump; a = a || this.pad.action; }
    if (this.mode === 'game') {
      for (const t of this.touches.values()) {
        if (t.role === 'jump') j = true;
        if (t.role === 'action') a = true;
      }
      if (this.stick.active && this.layout) {
        const dx = this.stick.x - this.stick.ox, dy = this.stick.y - this.stick.oy;
        const dz = this.layout.r * 0.22;
        if (dx < -dz) l = true;
        if (dx > dz) r = true;
        const vz = this.layout.r * 0.55;
        if (dy > vz && dy > Math.abs(dx) * 0.7) d = true;
        if (dy < -vz && -dy > Math.abs(dx) * 0.7) u = true;
      }
    }
    if (u && !this.up) this.upPressed = true;
    if (d && !this.down) this.downPressed = true;
    this.left = l; this.right = r; this.up = u; this.down = d; this.jump = j; this.action = a;
  },

  endFrame() {
    this.jumpPressed = false; this.actionPressed = false; this.upPressed = false;
    this.downPressed = false; this.pausePressed = false; this.taps.length = 0; this.uiKey = null;
    this.anyKeyPressed = false;
  },

  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    // existing touches keep role 'tap' in ui mode; reset game controls
    for (const t of this.touches.values()) t.role = m === 'game' ? 'none' : 'tap';
    this.stick.active = false; this.stick.id = null;
    this.recompute();
  },

  drawControls(ctx, alpha) {
    const L = this.layout;
    if (!L || !this.usingTouch && !Game.forceTouchUI) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    // stick
    const st = this.stick;
    const hx = st.active ? st.ox : L.stickHome.x, hy = st.active ? st.oy : L.stickHome.y;
    if (!st.active) ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = 'rgba(10,10,20,0.35)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, L.stickHome.r, 0, TAU); ctx.fill(); ctx.stroke();
    // arrows
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.save(); ctx.translate(hx + Math.cos(a) * L.stickHome.r * 0.72, hy + Math.sin(a) * L.stickHome.r * 0.72); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    let kx = hx, ky = hy;
    if (st.active) {
      const dx = st.x - st.ox, dy = st.y - st.oy, d = Math.hypot(dx, dy), m = L.stickHome.r * 0.6;
      kx = hx + (d > m ? dx / d * m : dx); ky = hy + (d > m ? dy / d * m : dy);
    }
    const g = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, L.r * 0.55);
    g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(160,150,200,0.45)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(kx, ky, L.r * 0.5, 0, TAU); ctx.fill();

    // buttons
    const btn = (b, held, label, col) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      const s = held ? 0.92 : 1;
      ctx.scale(s, s);
      const gg = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 2, 0, 0, b.r);
      gg.addColorStop(0, rgba(col, held ? 0.85 : 0.6));
      gg.addColorStop(1, rgba(shade(col, -0.5), held ? 0.75 : 0.45));
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `${Math.round(b.r * 0.62)}px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 2);
      ctx.restore();
    };
    ctx.globalAlpha = alpha;
    btn(L.jump, this.jump, '▲', '#c04bff');
    btn(L.action, this.action, '◉', '#ff4b7d');
    ctx.restore();
  }
};

// safe-area insets (CSS px), measured from CSS env() via a probe element
const insets = { t: 0, r: 0, b: 0, l: 0 };
function measureInsets() {
  try {
    let probe = document.getElementById('inset-probe');
    if (!probe) {
      probe = document.createElement('div');
      probe.id = 'inset-probe';
      probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding-top:env(safe-area-inset-top,0px);padding-right:env(safe-area-inset-right,0px);' +
        'padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);';
      document.body.appendChild(probe);
    }
    const cs = getComputedStyle(probe);
    insets.t = parseFloat(cs.paddingTop) || 0; insets.r = parseFloat(cs.paddingRight) || 0;
    insets.b = parseFloat(cs.paddingBottom) || 0; insets.l = parseFloat(cs.paddingLeft) || 0;
  } catch (e) { /* ignore */ }
}
