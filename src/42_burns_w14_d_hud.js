/* ============================================================
   BRADY-O BURNS — World 14: flight HUD + touch controls
   Plane:   left stick = pitch + bank (bank to turn), right lever = throttle,
            ⇅ flips the stick (pilot / arcade), JUMP! at the drop zone.
   Freefall: stick = steer (up = track forward), PULL button.
   Canopy:  LEFT / RIGHT toggle handles (hold), both = brake / flare.
   Keyboard: arrows/WASD = stick, Space = throttle up / flare, X/Shift =
   throttle down / jump / pull. Gamepad: left stick, A, X.
   Instruments: altimeter (feet, with the pull window), airspeed, wind
   arrow, landing-target + next-ring arrows, Captain Dusty's radio.
   Hooks the engine (guarded, world 14 only): BurnsUI.drawControls,
   BurnsUI.drawOverlay, and per-scene g.syncHudButtons / g.updateCamera.
   ============================================================ */

const BW14_HUD = {
  lay: null,
  // a flashing call-out (no countdown, unlike g.warn): GREEN LIGHT, STALL, FLARE...
  flash(g, text, secs) { if (g && g.bw14) g.bw14.flashMsg = { text, t: secs || 1.2, dur: secs || 1.2 }; },
  layout(g) {
    const W = Game.cssW, H = Game.cssH, portrait = H > W, L = Input.layout, r = L ? L.r : 46, S = BurnsUI.safe();
    const lh = portrait ? r * 4.0 : clamp(H * 0.5, r * 2.6, r * 3.8), lx = W - S.r - r * 1.25;
    const y1 = H - S.b - r * (portrait ? 1.6 : 0.85), y0 = y1 - lh;
    const lay = {
      W, H, portrait, r, S,
      thr: { x: lx, y0, y1, w: r * 1.05 },
      btnThr: { id: 'bw14thr', x: lx, y: (y0 + y1) / 2, r: lh / 2 * 0.86 },
      btnJump: portrait ? { id: 'bw14jump', x: W / 2 + 20, y: H - S.b - r * 1.9, r: r * 1.12 } : { id: 'bw14jump', x: lx - r * 2.45, y: y1 - r * 0.55, r: r * 1.12 },
      btnPull: { id: 'bw14pull', x: W - S.r - r * 1.55, y: H - S.b - r * (portrait ? 2.3 : 1.55), r: r * 1.35 },
      btnL: { id: 'bw14L', x: S.l + r * 1.7, y: H - S.b - r * (portrait ? 2.3 : 1.65), r: r * 1.3 },
      btnR: { id: 'bw14R', x: W - S.r - r * 1.7, y: H - S.b - r * (portrait ? 2.3 : 1.65), r: r * 1.3 },
      btnInv: portrait ? { id: 'bw14inv', x: lx, y: y0 - 34, r: 18 } : { id: 'bw14inv', x: lx - r * 1.55, y: y0 + 22, r: 19 },
      btnAgain: { id: 'bw14again', x: W / 2 - Math.min(110, W * 0.2), y: portrait ? H * 0.43 : H * 0.62 + 4, r: portrait ? 40 : 34 },
      btnGo: { id: 'bw14go', x: W / 2 + Math.min(110, W * 0.2), y: portrait ? H * 0.43 : H * 0.62 + 4, r: portrait ? 40 : 34 }
    };
    // instrument cluster: bottom centre (landscape) or a right-hand column (portrait)
    if (portrait) lay.inst = { x: W - S.r - 58, y: Math.min(H * 0.3, 260), col: true };
    else lay.inst = { x: W / 2, y: H - S.b - 34, col: false };
    this.lay = lay;
    return lay;
  },
  // the touch buttons the current phase needs (merged into Input.hud by the scene hook)
  buttons(g) {
    const S = g.bw14, F = S && S.fly; if (!F || !F.active) return [];
    const lay = this.layout(g), out = [];   // always fresh (orientation changes)
    if (F.mode === 'plane') { out.push(lay.btnThr, lay.btnInv); if (S.dzReady) out.push(lay.btnJump); }
    else if (F.mode === 'free') out.push(lay.btnPull);
    else if (F.mode === 'canopy' || F.mode === 'deploy') out.push(lay.btnL, lay.btnR);
    else if (F.mode === 'landed' && S.card && S.card.ready) { if (!S.card.hard) out.push(lay.btnGo); if (S.card.again) out.push(lay.btnAgain); }
    return out;
  },
  install(g) {
    if (g.bw14hudHooked) return; g.bw14hudHooked = true;
    const sync0 = g.syncHudButtons.bind(g);
    g.syncHudButtons = function () {
      sync0();
      const S = g.bw14, F = S && S.fly;
      if (F && F.active && Input.hud && !g.paused && g.state === 'play') {
        const extra = BW14_HUD.buttons(g);
        Input.hud = Input.hud.filter(b => b.id !== 'bike' && b.id !== 'cam').concat(extra);
      }
    };
    const cam0 = g.updateCamera.bind(g);
    g.updateCamera = function (fdt) {
      const S = g.bw14, F = S && S.fly;
      if (F && F.active && !(g.cine && g.cine.cam) && F.mode !== 'idle') { F.camera(fdt); return; }
      if (S && S.camHold && !(g.cine && g.cine.cam)) { Object.assign(g.cam, S.camHold); return; }
      return cam0(fdt);
    };
  },

  /* ---------------- drawing helpers ---------------- */
  panel(ctx, x, y, w, h, a) { ctx.fillStyle = `rgba(12,6,26,${a === undefined ? 0.62 : a})`; rr(ctx, x, y, w, h, Math.min(12, h / 2)); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; ctx.stroke(); },
  roundBtn(ctx, b, held, label, col, sub, pulse) {
    ctx.save(); ctx.translate(b.x, b.y); const s = (held ? 0.92 : 1) * (pulse ? 1 + Math.sin(performance.now() / 140) * 0.05 : 1); ctx.scale(s, s);
    const gg = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 2, 0, 0, b.r);
    gg.addColorStop(0, rgba(col, held ? 0.95 : 0.78)); gg.addColorStop(1, rgba(shade(col, -0.45), held ? 0.9 : 0.62));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(b.r * (label.length > 5 ? 0.3 : 0.38))}px ${FONT_DISPLAY}`; ctx.fillText(label, 0, sub ? -b.r * 0.12 : 1);
    if (sub) { ctx.font = `${Math.round(Math.max(9, b.r * 0.2))}px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(sub, 0, b.r * 0.32); }
    ctx.restore();
  },
  stick(ctx, lay) {
    const L = Input.layout; if (!L) return;
    const st = Input.stick, hx = st.active ? st.ox : L.stickHome.x, hy = st.active ? st.oy : L.stickHome.y;
    ctx.save(); ctx.globalAlpha = st.active ? 0.9 : 0.55;
    ctx.fillStyle = 'rgba(10,6,24,0.35)'; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, L.stickHome.r, 0, TAU); ctx.fill(); ctx.stroke();
    let kx = hx, ky = hy;
    if (st.active) { const dx = st.x - st.ox, dy = st.y - st.oy, d = Math.hypot(dx, dy), m = L.stickHome.r * 0.62; kx = hx + (d > m ? dx / d * m : dx); ky = hy + (d > m ? dy / d * m : dy); }
    const kg = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, L.r * 0.55); kg.addColorStop(0, 'rgba(255,255,255,0.85)'); kg.addColorStop(1, 'rgba(120,220,255,0.5)');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(kx, ky, L.r * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
    return { hx, hy, r: L.stickHome.r };
  },
  /* ---------------- controls (replace the engine's while flying) ---------------- */
  drawControls(ctx, g) {
    const S = g.bw14, F = S.fly, lay = this.layout(g), touch = Input.usingTouch || Game.forceTouchUI;
    const inv = !!bw14Flag('invert');
    if (F.mode === 'plane') {
      if (touch) {
        const st = this.stick(ctx, lay);
        if (st) { BurnsUI.text(ctx, inv ? '▲ CLIMB' : '▲ DIVE', st.hx, st.hy - st.r - 10, 10, 'rgba(255,255,255,0.8)', { ui: true }); BurnsUI.text(ctx, inv ? '▼ DIVE' : '▼ CLIMB', st.hx, st.hy + st.r + 10, 10, 'rgba(255,255,255,0.8)', { ui: true }); }
        // throttle lever
        const T = lay.thr, P = F.pl, held = !!Input.hudHeld.bw14thr;
        this.panel(ctx, T.x - T.w / 2, T.y0, T.w, T.y1 - T.y0, 0.55);
        const fy = lerp(T.y1, T.y0, P.thr);
        const gr = ctx.createLinearGradient(0, T.y1, 0, T.y0); gr.addColorStop(0, 'rgba(56,242,255,0.55)'); gr.addColorStop(1, 'rgba(255,79,216,0.8)');
        ctx.fillStyle = gr; rr(ctx, T.x - T.w / 2 + 5, fy, T.w - 10, Math.max(0, T.y1 - fy - 5), 6); ctx.fill();
        ctx.fillStyle = held ? '#ffffff' : '#ffe24a'; rr(ctx, T.x - T.w / 2 - 6, fy - 9, T.w + 12, 18, 9); ctx.fill();
        BurnsUI.text(ctx, 'THROTTLE', T.x, T.y0 - 11, 10, '#ffffff', { ui: true });
        BurnsUI.text(ctx, Math.round(P.thr * 100) + '%', T.x, fy, 11, '#1a0a20', { stroke: false });
        // flip-the-stick toggle
        const b = lay.btnInv; ctx.save(); ctx.fillStyle = 'rgba(12,6,26,0.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        BurnsUI.text(ctx, '⇅', b.x, b.y + 1, b.r * 0.9, '#ffffff', { stroke: false });
        BurnsUI.text(ctx, inv ? 'ARCADE' : 'PILOT', b.x, b.y - b.r - 7, 9, '#d8fbff', { ui: true });
      }
      if (S.dzReady) { if (touch) this.roundBtn(ctx, lay.btnJump, !!Input.hudHeld.bw14jump, 'JUMP!', '#ff3b5c', 'GREEN LIGHT', true); }
    } else if (F.mode === 'free') {
      if (touch) { this.stick(ctx, lay); this.roundBtn(ctx, lay.btnPull, !!Input.hudHeld.bw14pull, 'PULL', this.pullCol(F), 'RIPCORD', F.agl < BW14_CFG.PULL_HI + 10); }
    } else if (F.mode === 'canopy' || F.mode === 'deploy') {
      if (touch) {
        const D = F.dv;
        this.toggleBtn(ctx, lay.btnL, !!Input.hudHeld.bw14L, D.L, 'LEFT');
        this.toggleBtn(ctx, lay.btnR, !!Input.hudHeld.bw14R, D.R, 'RIGHT');
        BurnsUI.text(ctx, 'HOLD BOTH TO FLARE', lay.W / 2, lay.portrait ? lay.btnL.y - lay.btnL.r - 14 : lay.H - lay.S.b - 14, 11, F.agl < 9 ? '#ffe24a' : 'rgba(255,255,255,0.8)', { ui: true });
      }
    } else if (F.mode === 'landed') {
      if (S.card && S.card.ready) {
        if (S.card.again) this.roundBtn(ctx, lay.btnAgain, !!Input.hudHeld.bw14again, S.card.hard ? 'RETRY' : 'AGAIN', '#ff4fd8', touch ? 'JUMP AGAIN' : 'X / SHIFT');
        if (!S.card.hard) this.roundBtn(ctx, lay.btnGo, !!Input.hudHeld.bw14go, 'GO!', '#38c858', touch ? 'TO THE BIKE' : 'SPACE');
      }
    }
  },
  pullCol(F) { const a = F.agl, C = BW14_CFG; return a > C.PULL_HI ? '#5a6a8a' : a >= C.PULL_LO ? '#2ac858' : a >= C.PULL_DEAD ? '#ffb020' : '#ff3b3b'; },
  toggleBtn(ctx, b, held, k, label) {
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = `rgba(12,6,26,${0.45 + k * 0.25})`; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = held ? '#ffe24a' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5; ctx.stroke();
    // the toggle handle: a loop that slides down as you pull
    const y = lerp(-b.r * 0.45, b.r * 0.3, k);
    ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -b.r * 0.95); ctx.lineTo(0, y - b.r * 0.2); ctx.stroke();
    ctx.fillStyle = held ? '#ffe24a' : '#ff9ad8'; rr(ctx, -b.r * 0.32, y - b.r * 0.2, b.r * 0.64, b.r * 0.4, b.r * 0.2); ctx.fill();
    ctx.fillStyle = '#1a0a20'; rr(ctx, -b.r * 0.2, y - b.r * 0.08, b.r * 0.4, b.r * 0.16, b.r * 0.08); ctx.fill();
    ctx.restore();
    BurnsUI.text(ctx, label, b.x, b.y + b.r * 0.72, Math.round(b.r * 0.26), '#ffffff');
  },

  /* ---------------- instruments + radio + markers + landing card ---------------- */
  drawOverlay(ctx, g) {
    const S = g.bw14, F = S.fly, lay = this.lay || this.layout(g), C = BW14_CFG;
    if (!F || !F.active || g.state !== 'play' || g.paused) return;
    const cine = !!g.cine;
    if (!cine) {
      if (F.mode === 'plane') { this.markers(ctx, g, F); this.instruments(ctx, g, F, lay); }
      else if (F.mode === 'free' || F.mode === 'deploy' || F.mode === 'canopy') { this.lzMarker(ctx, g, F); this.instruments(ctx, g, F, lay); }
      if (F.mode === 'landed' && S.card) this.card(ctx, g, S.card, lay);
    }
    this.radio(ctx, g, F, lay);
    const fm = S.flashMsg;
    if (fm && fm.t > 0 && !cine) { fm.t -= g.lastFdt || 1 / 60; const a = (0.65 + 0.35 * Math.sin(g.time * 16)) * clamp(fm.t * 3, 0, 1); BurnsUI.text(ctx, fm.text, lay.W / 2, lay.portrait ? lay.H * 0.3 : lay.H * 0.3, Math.min(34, lay.W / 15), `rgba(255,${200 + 55 * a | 0},${90 + 60 * a | 0},${a})`, { glow: '#ff4fd8' }); }
    if (S.ctlHint && S.ctlHint.t > 0 && !cine && !g.dialog.open) {
      // controls card: left side in landscape (between the HUD pills and the stick), lower middle in portrait
      const a = clamp(S.ctlHint.t, 0, 1), fs = lay.portrait ? 11 : 10.5;
      ctx.save(); ctx.globalAlpha = a; ctx.font = `600 ${fs}px ${FONT_UI}`;
      const maxW = lay.portrait ? Math.min(lay.W - 30, lay.thr.x - lay.thr.w / 2 - 24) : Math.min(300, lay.W * 0.36), lines = [];
      S.ctlHint.lines.forEach((l, i) => BurnsUI.wrap(ctx, l, maxW - 20).forEach(w2 => lines.push([w2, i])));
      const w = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l[0]).width)) + 22), h = lines.length * (fs + 4) + 12;
      const x = lay.portrait ? Math.max(12, (lay.thr.x - lay.thr.w / 2 - 12) / 2 - w / 2 + 6) : lay.S.l + 4, y = lay.portrait ? lay.H * 0.665 : Math.min(150, lay.H * 0.36);
      this.panel(ctx, x, y, w, h, 0.6);
      lines.forEach((l, i) => BurnsUI.text(ctx, l[0], x + w / 2, y + 9 + fs / 2 + i * (fs + 4), fs, l[1] ? '#d8fbff' : '#ffe24a', { ui: true, stroke: false }));
      ctx.restore();
    }
  },
  ft(m) { return Math.max(0, Math.round(m * BW14_CFG.FT / 10) * 10).toLocaleString('en-US'); },
  instruments(ctx, g, F, lay) {
    const C = BW14_CFG, I = lay.inst, plane = F.mode === 'plane';
    const alt = plane ? F.pl.y - BW14_PLANE.GEAR_H - g.world.height(F.pl.x, F.pl.z) : (F.agl === undefined ? F.dv.y : F.agl);
    const spd = plane ? F.pl.V : Math.hypot(F.dv.vx, F.dv.vz, F.dv.vy);
    const kt = Math.round(spd * 2.4);
    const boxes = [['ALT', this.ft(alt) + ' FT', plane ? '#d8fbff' : this.altCol(alt)], [plane ? 'SPEED' : (F.mode === 'free' ? 'FALL' : 'SPEED'), kt + ' KT', plane && F.pl.V < BW14_PH.VSTALL + 2 && !F.pl.ground ? '#ff6a6a' : '#ffffff']];
    const bw = 92, bh = 40;
    const pos = i => I.col ? [I.x - bw / 2, I.y + i * (bh + 8)] : [I.x - (bw * 3 + 16) / 2 + i * (bw + 8), I.y - bh / 2];
    boxes.forEach((b, i) => { const [x, y] = pos(i); this.panel(ctx, x, y, bw, bh); BurnsUI.text(ctx, b[0], x + bw / 2, y + 11, 9, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); BurnsUI.text(ctx, b[1], x + bw / 2, y + 27, 14, b[2]); });
    // wind compass (screen-up = the way the camera looks)
    { const [x, y] = pos(2), cx = x + bw / 2, cy = y + bh / 2, W = C.WIND, gx = W.x + F.gust.x, gz = W.z + F.gust.z, ws = Math.hypot(gx, gz);
      this.panel(ctx, x, y, bw, bh);
      const camYaw = Math.atan2(g.cam.tx - g.cam.x, g.cam.tz - g.cam.z), wa = Math.atan2(gx, gz) - camYaw;
      ctx.save(); ctx.translate(cx - 22, cy); ctx.rotate(-wa); ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(7, 4); ctx.lineTo(2, 2); ctx.lineTo(2, 11); ctx.lineTo(-2, 11); ctx.lineTo(-2, 2); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill(); ctx.restore();
      BurnsUI.text(ctx, 'WIND', cx + 14, y + 11, 9, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); BurnsUI.text(ctx, Math.round(ws * 1.94) + ' KT', cx + 14, y + 27, 12, '#ffe24a'); }
    // freefall / canopy: the altitude gauge with the pull window
    if (!plane) this.altGauge(ctx, g, F, lay, alt);
    // plane: rings + throttle readout for keyboard players
    if (plane) {
      const S = g.bw14, nr = F.rings.filter(r => r.done).length;
      const [x, y] = I.col ? pos(3) : [I.x - (bw * 3 + 16) / 2 - bw - 8, I.y - bh / 2];
      this.panel(ctx, x, y, bw, bh); BurnsUI.text(ctx, 'RINGS', x + bw / 2, y + 11, 9, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); BurnsUI.text(ctx, nr + '/' + F.rings.length, x + bw / 2, y + 27, 14, '#ffd84a');
      if (!(Input.usingTouch || Game.forceTouchUI)) { const [x2, y2] = I.col ? pos(4) : [I.x + (bw * 3 + 16) / 2 + 8, I.y - bh / 2]; this.panel(ctx, x2, y2, bw, bh); BurnsUI.text(ctx, 'THROTTLE', x2 + bw / 2, y2 + 11, 9, 'rgba(255,255,255,0.7)', { ui: true, stroke: false }); BurnsUI.text(ctx, Math.round(F.pl.thr * 100) + '%', x2 + bw / 2, y2 + 27, 14, '#ff9ad8'); }
      void S;
    }
  },
  altCol(a) { const C = BW14_CFG; return a > C.PULL_HI ? '#d8fbff' : a >= C.PULL_LO ? '#7aff5a' : a >= C.PULL_DEAD ? '#ffd84a' : '#ff6a6a'; },
  altGauge(ctx, g, F, lay, alt) {
    const C = BW14_CFG, top = C.EXIT_ALT + 40;
    let x, y0, y1, w = 16;
    if (lay.portrait) { x = lay.W - lay.S.r - 12; y0 = lay.inst.y + 3 * 48 + 20; y1 = Math.min(lay.H - lay.S.b - lay.r * 4.2, y0 + 300); }
    else { x = lay.W - lay.S.r - 16; y0 = 190; y1 = lay.H - lay.S.b - lay.r * 3.2; if (y1 - y0 < 90) { y0 = 160; } }
    if (y1 - y0 < 60) return;
    const Y = a => lerp(y1, y0, clamp(a / top, 0, 1));
    this.panel(ctx, x - w / 2 - 4, y0 - 6, w + 8, y1 - y0 + 12, 0.5);
    const band = (a0, a1, col) => { ctx.fillStyle = col; ctx.fillRect(x - w / 2, Y(a1), w, Y(a0) - Y(a1)); };
    band(0, C.PULL_DEAD, 'rgba(255,60,60,0.75)'); band(C.PULL_DEAD, C.PULL_LO, 'rgba(255,190,40,0.8)'); band(C.PULL_LO, C.PULL_HI, 'rgba(60,220,90,0.85)'); band(C.PULL_HI, top, 'rgba(120,150,200,0.45)');
    const my = Y(alt);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 12, my); ctx.lineTo(x - w / 2 - 2, my - 6); ctx.lineTo(x - w / 2 - 2, my + 6); ctx.closePath(); ctx.fill();
    BurnsUI.text(ctx, F.mode === 'free' ? 'PULL' : 'FLARE', x, Y((C.PULL_LO + C.PULL_HI) / 2), 8, '#ffffff', { stroke: false });
    if (F.mode === 'canopy' && alt < 14) { const fy = Y(6); ctx.strokeStyle = '#ffe24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w, fy); ctx.lineTo(x + w, fy); ctx.stroke(); }
  },
  // project a world point; returns {x,y,on} with edge-clamping for off-screen targets
  proj(g, x, y, z) {
    const R = g.R, o = {}, W = Game.cssW, H = Game.cssH, m = 34;
    const ok = R.project(x, y, z, W, H, o);
    if (ok && o.x > m && o.x < W - m && o.y > m && o.y < H - m) return { x: o.x, y: o.y, on: true, w: o.w };
    // behind or off screen: direction from the screen centre
    const cam = g.cam, B = R.B; let dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
    let sx = dx * B.rx + dy * B.ry + dz * B.rz, sy = -(dx * B.ux + dy * B.uy + dz * B.uz);
    const l = Math.hypot(sx, sy) || 1; sx /= l; sy /= l;
    // edge arrows live in a box that stays clear of the HUD pills and the bottom controls
    const top = 70, bot = H * (H > W ? 0.66 : 0.6), cy = (top + bot) / 2, hh = (bot - top) / 2;
    const k = Math.min((W / 2 - m - 40) / Math.max(1e-3, Math.abs(sx)), hh / Math.max(1e-3, Math.abs(sy)));
    return { x: W / 2 + sx * k, y: cy + sy * k, on: false, ang: Math.atan2(sy, sx) };
  },
  arrowAt(ctx, p, col, label) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (!p.on) { ctx.rotate(p.ang); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -11); ctx.lineTo(-3, 0); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(10,4,20,0.8)'; ctx.lineWidth = 2; ctx.stroke(); }
    else { const s = 1 + Math.sin(performance.now() / 160) * 0.12; ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 0); ctx.lineTo(0, 14); ctx.lineTo(-14, 0); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    if (label) { ctx.save(); ctx.font = `600 11px ${FONT_UI}`; const hw = ctx.measureText(label).width / 2 + 6; ctx.restore(); BurnsUI.text(ctx, label, clamp(p.x, hw, Game.cssW - hw), clamp(p.y + (p.on ? 26 : 24), 20, Game.cssH - 20), 11, col, { ui: true }); }
  },
  markers(ctx, g, F) {
    const S = g.bw14, P = F.pl;
    const r = F.nextRing();
    if (r) { const p = this.proj(g, r.x, r.y, r.z), d = Math.hypot(r.x - P.x, r.y - P.y, r.z - P.z); this.arrowAt(ctx, p, r.col, 'RING ' + (r.i + 1) + ' · ' + Math.round(d) + ' m'); }
    else if (S.dz) { const D = S.dz, p = this.proj(g, D.x, Math.max(D.alt, P.y), D.z), dd = Math.hypot(D.x - P.x, D.z - P.z); this.arrowAt(ctx, p, '#ff3b5c', (P.y - BW14_PLANE.GEAR_H < D.alt ? 'CLIMB TO ' + this.ft(D.alt) + ' FT · ' : 'DROP ZONE · ') + Math.round(dd) + ' m'); }
    // the next updraft, while climbing
    if (!r && S.dz && P.y - BW14_PLANE.GEAR_H < S.dz.alt) { let best = null, bd = 1e9; for (const t of F.thermalRings) { if (t.cool > 0 || t.y < P.y - 10) continue; const d = Math.hypot(t.x - P.x, t.z - P.z) + Math.abs(t.y - P.y); if (d < bd) { bd = d; best = t; } } if (best) { const p = this.proj(g, best.x, best.y, best.z); if (p.on) this.arrowAt(ctx, p, '#ffd84a', 'UPDRAFT'); } }
  },
  lzMarker(ctx, g, F) {
    const L = BW14_CFG.LZ, D = F.dv, p = this.proj(g, L.x, 0.5, L.z), d = Math.hypot(L.x - D.x, L.z - D.z);
    this.arrowAt(ctx, p, '#ff4fd8', 'TARGET · ' + Math.round(d) + ' m');
  },
  radio(ctx, g, F, lay) {
    const R = F.radio; if (!R) return;
    const a = clamp(Math.min(R.t * 5, (R.dur - R.t) * 3), 0, 1); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.font = `600 12px ${FONT_UI}`;
    // landscape: in the free band between the stick and the right-hand buttons
    const Ls = Input.layout, bandL = lay.portrait ? 12 : (Ls ? Ls.stickHome.x + Ls.stickHome.r + 8 : 170), bandR = lay.portrait ? lay.W - 12 : lay.btnJump.x - lay.btnJump.r - 8;
    const maxW = Math.min(bandR - bandL, 520), lines = BurnsUI.wrap(ctx, R.text, maxW - 70).slice(0, 3), w = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 74), h = 22 + lines.length * 15;
    const landed = F.mode === 'landed';
    const x = (bandL + bandR) / 2 - w / 2, y = landed ? lay.H - lay.S.b - h - 6 : lay.portrait ? lay.H * 0.6 : lay.H - lay.S.b - 62 - h;
    this.panel(ctx, x, y, w, h, 0.72);
    ctx.fillStyle = '#ff9a4a'; rr(ctx, x + 8, y + 8, 46, h - 16, 8); ctx.fill();
    BurnsUI.text(ctx, '📻', x + 31, y + h / 2 - 5, 16, '#ffffff', { stroke: false }); BurnsUI.text(ctx, 'RADIO', x + 31, y + h / 2 + 11, 8, '#2a1020', { stroke: false });
    BurnsUI.text(ctx, R.who, x + 62, y + 12, 10, '#ffd84a', { align: 'left', ui: true, stroke: false });
    lines.forEach((l, i) => BurnsUI.text(ctx, l, x + 62, y + 27 + i * 15, 12, '#ffffff', { align: 'left', ui: true, stroke: false }));
    ctx.restore();
  },
  card(ctx, g, c, lay) {
    const W = lay.W, H = lay.H, k = clamp(c.t / 0.4, 0, 1), w = Math.min(W - 30, 400), x = W / 2 - w / 2, y = lay.portrait ? H * 0.09 : H * 0.12, h = lay.portrait ? H * 0.32 : H * 0.48;
    ctx.save(); ctx.globalAlpha = k;
    this.panel(ctx, x, y, w, h, 0.78);
    BurnsUI.text(ctx, c.title, W / 2, y + 26, Math.min(26, W / 16), c.col, { glow: c.col });
    let yy = y + 54;
    for (const row of c.rows) { BurnsUI.text(ctx, row[0], x + 22, yy, 12, 'rgba(255,255,255,0.75)', { align: 'left', ui: true, stroke: false }); BurnsUI.text(ctx, row[1], x + w - 22, yy, 13, row[2] || '#ffffff', { align: 'right' }); yy += 21; }
    if (c.stars !== undefined) { let s = ''; for (let i = 0; i < 3; i++) s += i < c.stars ? '★' : '☆'; BurnsUI.text(ctx, s, W / 2, yy + 8, 24, '#ffd84a', { glow: '#ff9a2a' }); yy += 30; }
    if (c.quip) { ctx.font = `italic 12px ${FONT_UI}`; BurnsUI.wrap(ctx, c.quip, w - 40).slice(0, 2).forEach((l, i) => BurnsUI.text(ctx, l, W / 2, yy + i * 15, 12, '#ffd0f4', { ui: true, stroke: false })); }
    ctx.restore();
  }
};

/* ---------------- engine hooks (guarded: only world 14 while flying) ---------------- */
// keyboard: I flips the stick (pilot <-> arcade) in World 14
try { window.addEventListener('keydown', e => { const g = Game.scene; if (e.code === 'KeyI' && !e.repeat && g && g.bw14 && g.state === 'play' && !g.paused) g.bw14.invKey = true; }); } catch (e) { /* no window */ }
(() => {
  // free World 14's own puppet meshes (plane, canopy) with the rest of the world's GPU buffers
  const rel0 = BurnsScenes.releaseWorld;
  BurnsScenes.releaseWorld = function (scene) {
    rel0.call(this, scene);
    try { const S = scene && scene.bw14; if (S && S.geos && BurnsGL.gl) for (const geo of S.geos) BurnsGL.freeGeo(geo); } catch (e) { /* ignore */ }
  };
  const dc0 = BurnsUI.drawControls;
  BurnsUI.drawControls = function (ctx, g) {
    const S = g && g.bw14, F = S && S.fly;
    if (F && F.active && F.mode !== 'idle' && F.mode !== 'parked') { try { BW14_HUD.drawControls(ctx, g); } catch (e) { if (Game.reportError) Game.reportError(e); } return; }
    return dc0.call(this, ctx, g);
  };
  const ov0 = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    ov0.call(this, ctx, g, fdt);
    const S = g && g.bw14;
    if (!S || g.state !== 'play' || g.paused) return;
    try { BW14_HUD.drawOverlay(ctx, g); } catch (e) { if (Game.reportError) Game.reportError(e); }
  };
})();
