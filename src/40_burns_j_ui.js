/* ============================================================
   BRADY GOES TO BURNING MAN — 2D overlay: HUD, touch controls, speech bubbles,
   markers, banners, dialogue box, minimap, pause menu, results.
   Everything is drawn in CSS px on the main 2D canvas after the 3D frame.
   ============================================================ */
const BurnsUI = {
  text(ctx, s, x, y, size, col, o) {
    o = o || {};
    ctx.save();
    ctx.font = `${o.ui ? '600 ' : ''}${size}px ${o.ui ? FONT_UI : FONT_DISPLAY}`;
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.strokeCol || 'rgba(10,4,20,0.85)'; ctx.lineWidth = o.sw || Math.max(2.5, size * 0.22); ctx.strokeText(s, x, y); }
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = size * 0.6; }
    ctx.fillStyle = col || '#ffffff'; ctx.fillText(s, x, y);
    ctx.restore();
  },
  wrap(ctx, text, maxW) { const words = String(text).split(' '), lines = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; },
  pill(ctx, x, y, w, h, fill, stroke) { ctx.fillStyle = fill; burnsRR(ctx, x, y, w, h, h / 2); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); } },
  drop(ctx, x, y, s, fill, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
    const path = () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(6, -2, 8, 2, 8, 5); ctx.arc(0, 5, 8, 0, Math.PI); ctx.bezierCurveTo(-8, 2, -6, -2, 0, -10); ctx.closePath(); };
    path(); ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    if (k > 0) {
      ctx.save(); path(); ctx.clip();
      const g = ctx.createLinearGradient(0, -10, 0, 13); g.addColorStop(0, '#bff0ff'); g.addColorStop(1, fill || '#2a9aff');
      ctx.fillStyle = g; ctx.fillRect(-10, 13 - 23 * k, 20, 23 * k);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-3, 3, 2, 3.5, 0.3, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  icon(ctx, name, x, y, s) {
    // draw an atlas icon region into the 2D canvas
    const r = name === 'photo' ? BURNS_ATLAS.regions.photo : BURNS_ATLAS.icon(name);
    if (!r || !BURNS_ATLAS.canvas) return;
    const w = r.pw, h = r.ph, k = s / Math.max(w, h);
    ctx.drawImage(BURNS_ATLAS.canvas, r.px, r.py, w, h, x - w * k / 2, y - h * k / 2, w * k, h * k);
  },
  safe() { return { l: Math.max(12, insets.l + 6), r: Math.max(12, insets.r + 6), t: Math.max(10, insets.t + 6), b: Math.max(10, insets.b + 6) }; },
  /* ---------- screens ---------- */
  drawLoading(ctx, g) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120a24'); gr.addColorStop(0.7, '#5a1e30'); gr.addColorStop(1, '#c86a3a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const meta = BurnsWorlds.meta(g.worldId);
    this.text(ctx, BurnsWorlds.label(g.worldId).toUpperCase(), W / 2, H * 0.38, 14, '#ffd84a');
    this.text(ctx, (meta.name || '').toUpperCase(), W / 2, H * 0.47, Math.min(34, W / 16), '#ffffff', { glow: '#ff4fd8' });
    const day = BurnsWorlds.day(g.worldId);
    if (day) this.text(ctx, day.toUpperCase(), W / 2, H * 0.47 + Math.min(34, W / 16) * 0.5 + 18, 14, '#ffb0d8', { glow: '#ff4fd8' });
    this.text(ctx, 'Loading the playa' + '.'.repeat(1 + Math.floor(g.t * 4) % 3), W / 2, H * 0.64, 13, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
  },
  drawNoGL(ctx, g) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    ctx.fillStyle = '#100820'; ctx.fillRect(0, 0, W, H);
    this.text(ctx, 'BRADY GOES TO BURNING MAN', W / 2, H * 0.3, this.fitSize(ctx, 'BRADY GOES TO BURNING MAN', 26, W - 30), '#ff9a4a', { glow: '#ff4fd8' });
    ctx.save(); ctx.font = `14px ${FONT_UI}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    const msg = g.noglMsg || 'This 3D adventure needs WebGL, and this browser has it turned off (or the GPU is busy). Try reopening Safari, or turn off Low Power Mode.';
    this.wrap(ctx, msg, Math.min(W - 40, 520)).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 + i * 20));
    ctx.restore();
    if (g.noglBtns) BurnsUIKit.drawButtons(ctx, g.noglBtns);
  },
  drawMissing(ctx, g) {
    if (!g.noglBtns) g.buildNoGL();
    g.noglMsg = `${BurnsWorlds.label(g.worldId)} is still being built by the burners. Check back soon!`;
    this.drawNoGL(ctx, g);
  },
  /* ---------- the in-game overlay ---------- */
  drawOverlay(ctx, g, fdt) {
    const W = Game.cssW, H = Game.cssH, p = g.player, R = g.R, S = this.safe();
    g.syncHudButtons();
    g.lastFdt = fdt;
    const bossOn = g.boss && g.boss.active && !g.boss.defeated;
    g._trk = this.trackerLayout(ctx, g, S);
    g.topStack = S.t + (g._trk ? g._trk.h + 10 : 6) + (bossOn ? 52 : 0);
    // def.drawUnder(g, ctx, fdt): a world's own 2D layer over the 3D frame, under the engine's HUD (screen tints, panels)
    if (g.def.drawUnder) g.def.drawUnder(g, ctx, fdt);
    // screen tints for power-ups
    if (p.power === 'khole' && p.powerT > 0) { const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85); v.addColorStop(0, 'rgba(80,40,160,0)'); v.addColorStop(1, `rgba(80,40,160,${0.45 + Math.sin(g.time * 2) * 0.1})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    if (p.power === 'lsd' && p.powerT > 0) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = `hsla(${(g.time * 90) % 360},90%,60%,0.16)`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (p.hydration <= 2 && !p.dead) { const a = (0.22 + Math.sin(g.time * 5) * 0.1) * (p.hydration <= 1 ? 1.4 : 1); const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9); v.addColorStop(0, 'rgba(255,40,40,0)'); v.addColorStop(1, `rgba(200,20,20,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    this.drawWorldLabels(ctx, g);
    const cine = !!g.cine;
    if (!cine && g.state === 'play' && !window.__burnsHideHUD) { this.drawHUD(ctx, g, S); if (g.def.drawHUD) g.def.drawHUD(ctx, g, W, H, S); }
    this.drawBossBar(ctx, g, S);
    // letterbox
    g.lbK = BurnsM.damp(g.lbK || 0, cine && g.cine.letter ? 1 : 0, 6, fdt);
    if (g.lbK > 0.01) { const bh = H * 0.1 * g.lbK; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
    if (cine && !g.dialog.open && !window.__burnsHideHUD) { const sx = W - S.r - 80, sy = H - S.b - 36 - (g.lbK > 0.5 ? 0 : 0); this.pill(ctx, sx, sy, 72, 28, 'rgba(10,6,20,0.6)', 'rgba(255,255,255,0.3)'); this.text(ctx, 'SKIP ▶▶', sx + 36, sy + 14, 10, '#ffffff', { stroke: false }); g.skipRect = { x: sx, y: sy, w: 72, h: 28 }; } else g.skipRect = null;
    if (g.state === 'play') this.drawDayCard(ctx, g, fdt);
    this.drawBanners(ctx, g, fdt);
    // warning
    if (g.warnT > 0 && g.warnText) { const a = 0.6 + 0.4 * Math.sin(g.time * 18); this.text(ctx, g.warnText, W / 2, H * 0.3, Math.min(40, W / 14), `rgba(255,${80 + 100 * a | 0},80,${a})`, { glow: '#ff2a2a' }); this.text(ctx, g.warnT.toFixed(1), W / 2, H * 0.3 + 34, 18, '#ffffff'); }
    if (g.dialog.open) this.drawDialog(ctx, g);
    if (!cine && g.state === 'play' && !g.dialog.open && !g.paused && !window.__burnsHideHUD) this.drawControls(ctx, g);
    // def.drawOverlay(g, ctx, fdt): a world's own 2D layer over the HUD, dialogue and touch controls (under the fade, pause and results)
    if (g.def.drawOverlay) g.def.drawOverlay(g, ctx, fdt);
    // flash + fade
    if (g.flashA > 0) { ctx.fillStyle = rgba(g.flashC || '#ffffff', Math.min(1, g.flashA)); ctx.fillRect(0, 0, W, H); g.flashA = Math.max(0, g.flashA - fdt * 1.6); }
    g.fade = approach(g.fade, g.fadeTarget, fdt * g.fadeRate);
    if (g.fade > 0.001) { ctx.fillStyle = `rgba(6,3,12,${g.fade})`; ctx.fillRect(0, 0, W, H); }
    if (g.paused) this.drawPause(ctx, g);
    if (g.state === 'results') this.drawResults(ctx, g);
    if (window.__burnsDebug) { ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(`fps ${g.stats.fps.toFixed(0)} cpu ${g.stats.cpu.toFixed(1)}ms draws ${g.stats.draws}+${g.stats.shDraws || 0}sh tris ${(g.stats.tris / 1000).toFixed(0)}k+${((g.stats.shTris || 0) / 1000).toFixed(0)}k q ${g.q.toFixed(2)} p ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`, 8, H - 6); }
  },
  // speech bubbles, NPC markers, pickup labels (projected from 3D)
  drawWorldLabels(ctx, g) {
    const R = g.R, W = Game.cssW, H = Game.cssH, o = {}, p = g.player, cam = g.cam;
    const bubble = (x, y, z, text, col, small) => {
      if (!R.project(x, y, z, W, H, o)) return;
      const d = o.w; if (d > 45) return;
      const sc = clamp(14 / d, 0.65, 1.1);
      ctx.save(); ctx.font = `600 ${Math.round(13 * sc)}px ${FONT_UI}`;
      const lines = this.wrap(ctx, text, 190 * sc), lh = 16 * sc;
      const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 18 * sc, h = lines.length * lh + 12 * sc;
      let bx = clamp(o.x - w / 2, 6, W - w - 6), by = clamp(o.y - h - 12 * sc, 6, H - h - 6);
      // keep clear of the HUD (counters, tracker, pause button, minimap): slide below or beside it
      for (const r of (g.hudRects || [])) {
        if (bx < r[2] && bx + w > r[0] && by < r[3] && by + h > r[1]) {
          if (r[3] + 4 + h < H - 6) by = r[3] + 4;
          else if (r[0] > W / 2) bx = Math.max(6, r[0] - w - 4); else bx = Math.min(W - w - 6, r[2] + 4);
        }
      }
      ctx.fillStyle = col || 'rgba(255,255,255,0.95)'; burnsRR(ctx, bx, by, w, h, 10 * sc); ctx.fill();
      ctx.beginPath(); ctx.moveTo(clamp(o.x, bx + 10, bx + w - 10) - 6 * sc, by + h - 1); ctx.lineTo(clamp(o.x, bx + 10, bx + w - 10) + 6 * sc, by + h - 1); ctx.lineTo(o.x, Math.min(by + h + 10 * sc, o.y - 2)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = small ? '#ffffff' : '#1a1024'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 6 * sc + i * lh));
      ctx.restore();
    };
    for (const a of g.actors) {
      if (a.removed || a.hidden) continue;
      const top = a.y + a.h * 1.04 + 0.15;
      if (a.bubbleText && a.bubbleT > 0 && !(a.bubbleChat && (g.cine || (g.modalOn && g.modalOn())))) bubble(a.x, top, a.z, a.bubbleText, a.friendly ? null : 'rgba(255,230,230,0.96)');
      // mission marker: '!' over givers of available missions, '?' over active targets
      const mk = a.def.marker ? a.def.marker(g, a) : this.markerFor(g, a);
      if (mk && R.project(a.x, top + 0.5 + Math.sin(g.time * 4) * 0.1, a.z, W, H, o) && o.w < 48) {
        const s = clamp(18 / o.w * 1.6, 0.45, 1.25);
        this.text(ctx, mk, o.x, o.y, 26 * s, mk === '!' ? '#ffd84a' : '#38f2ff', { glow: mk === '!' ? '#ff9a2a' : '#38f2ff' });
      }
    }
    if (g.bubble) bubble(p.x, p.y + p.h * p.ch.scale + 0.3, p.z, g.bubble.text, 'rgba(255,79,216,0.95)', true);
    if (g.bossLine && !g.dialog.open) {
      const y = (g.topStack || 60) + 14 + g.toasts.length * 28;
      ctx.save(); ctx.font = `${Math.min(18, W / 28)}px ${FONT_DISPLAY}`; const tw = Math.min(W - 40, ctx.measureText(g.bossLine.text).width + 30); ctx.restore();
      this.pill(ctx, W / 2 - tw / 2, y - 14, tw, 28, 'rgba(40,6,40,0.7)', 'rgba(255,79,216,0.6)');
      this.text(ctx, g.bossLine.text, W / 2, y, Math.min(18, W / 28), '#ffd0f4', { glow: '#ff4fd8' });
    }
    // nearby pickup labels
    for (const P of g.pickups.items) {
      // only label what Brady can actually collect right now (mission-gated pickups wait for their mission)
      if (P.taken || !P.label || (P.score && !g.gsOn) || (P.hidden && !(p.power === 'lsd' && p.powerT > 0)) || (P.gate && g.missions.state(P.mission) !== 'active')) continue;
      const d = Math.hypot(P.x - p.x, P.z - p.z); if (d > 9) continue;
      if (R.project(P.x, P.y0 + 0.75, P.z, W, H, o)) this.text(ctx, P.label, o.x, o.y, 12, '#ffffff', { glow: '#ff4fd8' });
    }
    // sales-pitch projectiles carry their pitch ('SYNERGY!') written on the bubble
    for (const q of g.proj.list) {
      if (q.dead || !q.text || q.kind !== 'pitch') continue;
      const d = Math.hypot(q.x - p.x, q.z - p.z); if (d > 26 || !R.project(q.x, q.y, q.z, W, H, o) || o.w < 0.5) continue;
      const sz = clamp(0.3 * H / (2 * (R.tanY || 0.5) * o.w), 8, 16), txt = String(q.text);   // about a third of the bubble's height
      ctx.save(); ctx.globalAlpha = clamp((26 - d) / 6, 0, 1);
      this.text(ctx, txt, o.x, o.y, sz, '#ffffff', { glow: '#38c8ff' });
      ctx.restore();
    }
    // talk / interact prompt
    const t = g.talkTarget(), it = !t && g.interactTarget();
    g.prompt = t ? 'TALK' : it ? (it.label || 'USE') : null;
    if (t && R.project(t.x, t.y + t.h + 0.1, t.z, W, H, o) && !t.bubbleText) this.text(ctx, '💬', o.x, o.y - 8, 18, '#ffffff', { stroke: false });
  },
  markerFor(g, a) {
    if (!a.id || a.defeated) return null;
    for (const m of g.missions.list) {
      if (m.def.giver === a.id && m.state === 'available' && m.def.start !== 'auto') return '!';
      if (m.state === 'active' && (m.def.target === a.id || (m.def.talkTo && m.def.talkTo === a.id) || (m.data && m.data.marker === a.id))) return '?';
    }
    return null;
  },
  // mission tracker pill layout: one line; in portrait a long objective wraps onto a second line instead of being cut
  trackerLayout(ctx, g, S) {
    const tr = !g.hideTracker && g.missions.tracker(); if (!tr) return null;   // g.hideTracker: a minigame owns the top of the screen
    const W = Game.cssW, H = Game.cssH, p = g.player, ds = Math.min(24, W / 26);
    ctx.save(); ctx.font = `600 12px ${FONT_UI}`;
    const full = '\u25b6 ' + tr.text, fit = (t, w) => { if (ctx.measureText(t).width <= w) return t; while (t.length > 4 && ctx.measureText(t + '\u2026').width > w) t = t.slice(0, -1); return t.trimEnd() + '\u2026'; };
    let tw = Math.min(W * 0.5, ctx.measureText(full).width + 26), tx = W / 2 - tw / 2;
    const left = S.l + 6 + 10 + p.maxHydration * ds * 0.95 + 10, right = W - S.r - 58;
    if (tx < left) { tx = left; tw = Math.min(tw, right - left); }
    let lines = [full];
    if (ctx.measureText(full).width > tw - 20) {
      if (H > W && right - left > 80) {   // portrait: widen to the free space, then wrap to two lines
        tw = right - left; tx = left;
        const wr = this.wrap(ctx, full, tw - 20);
        lines = wr.length > 2 ? [fit(wr[0], tw - 20), fit(wr.slice(1).join(' '), tw - 20)] : wr.map(l => fit(l, tw - 20));
      } else lines = [fit(full, tw - 20)];
    }
    ctx.restore();
    return { tx, tw, ty: S.t + 6, lines, h: lines.length > 1 ? 40 : 26 };
  },
  drawHUD(ctx, g, S) {
    const W = Game.cssW, H = Game.cssH, p = g.player, sv = BurnsSave.get();
    let x = S.l + 6, y = S.t + 8;
    const rects = g.hudRects || (g.hudRects = []); rects.length = 0;
    // hydration drops
    const ds = Math.min(24, W / 26);
    for (let i = 0; i < p.maxHydration; i++) this.drop(ctx, x + 10 + i * (ds * 0.95), y + ds * 0.55, ds, '#2a9aff', clamp(p.hydration - i, 0, 1));
    y += ds * 1.4;
    // glow sticks / tokens / photos
    const row = (icon, label, col) => { this.pill(ctx, x, y, 86, 24, 'rgba(10,6,24,0.55)'); this.icon(ctx, icon, x + 13, y + 12, 20); this.text(ctx, label, x + 50, y + 12.5, 12, col || '#ffffff'); y += 28; };
    row('glowstick', String(g.glow), '#b8ff9a');
    row('token', `${BurnsSave.tokenCount(g.worldId)}/${BurnsWorlds.tokenTotal(g.worldId)}`, '#ffd84a');
    row('photo', `${BurnsSave.photoCount(g.worldId)}/3`, '#ffb0d8');
    // backpack: a tappable pill (G key on keyboards)
    if (g.packVisible && g.packVisible()) {
      const n = BurnsPack.total(), fl = g.packFlash > 0 ? g.packFlash : 0;
      if (fl > 0) g.packFlash = Math.max(0, fl - (g.lastFdt || 1 / 60));
      const k = fl > 0 ? 1 + Math.sin(fl * 16) * 0.07 : 1;
      ctx.save(); ctx.translate(x + 43, y + 12); ctx.scale(k, k);
      this.pill(ctx, -43, -12, 86, 24, n ? 'rgba(70,16,60,0.7)' : 'rgba(10,6,24,0.55)', fl > 0 ? '#ff9ad8' : 'rgba(255,154,216,0.55)');
      this.bagGlyph(ctx, -30, 0.5, 19, '#ff8ad0');
      this.text(ctx, `BAG ${n}`, 7, 0.5, 12, '#ffd0f4');
      ctx.restore();
      const hb = g.hudBtns && g.hudBtns.pack; if (hb) { hb.x = x + 43; hb.y = y + 12; hb.r = 22; }
      y += 28;
    }
    rects.push([S.l, S.t, x + 96, y + 4]);   // the counters column
    // power-up timer
    if (p.power && p.powerT > 0) {
      const P = BURNS_POWERUPS[p.power], k = p.powerT / (p.powerMax || P.dur), cx = x + 22, cy = y + 24;
      ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fill();
      ctx.strokeStyle = P.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); ctx.restore();
      this.icon(ctx, P.icon, cx, cy, 22);
      this.text(ctx, P.name + (p.power === 'liquor' ? ` ×${p.ammo}` : ''), cx + 28, cy, 11, P.col, { align: 'left' });
    }
    // mission tracker
    const TK = g._trk;
    if (TK) {
      rects.push([TK.tx, TK.ty, TK.tx + TK.tw, TK.ty + TK.h + 2]);
      this.pill(ctx, TK.tx, TK.ty, TK.tw, TK.h, 'rgba(10,6,24,0.6)', 'rgba(56,242,255,0.5)');
      TK.lines.forEach((ln, i) => this.text(ctx, ln, TK.tx + TK.tw / 2, TK.ty + 13.5 + i * 13.5, 12, '#d8fbff', { ui: true, stroke: false }));
    }
    // toasts (below the tracker / boss bar stack)
    let ty2 = g.topStack || (S.t + 40);
    for (const t of g.toasts) { t.t += g.lastFdt || 1 / 60; const a = clamp(Math.min(t.t * 6, (2.2 - t.t) * 3), 0, 1); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.font = `600 12px ${FONT_UI}`; const w = ctx.measureText(t.text).width + 26; this.pill(ctx, W / 2 - w / 2, ty2, w, 24, 'rgba(255,79,216,0.85)'); this.text(ctx, t.text, W / 2, ty2 + 12.5, 12, '#ffffff', { ui: true, stroke: false }); ctx.restore(); ty2 += 28; }
    g.toasts = g.toasts.filter(t => t.t < 2.2);
    // pause button
    const L = Input.layout;
    if (L) { const pb = L.pause; ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, pb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(pb.x - 6, pb.y - 7, 4, 14); ctx.fillRect(pb.x + 2, pb.y - 7, 4, 14); ctx.restore(); }
    if (L) rects.push([L.pause.x - L.pause.r - 4, L.pause.y - L.pause.r - 4, W, L.pause.y + L.pause.r + 4]);
    // minimap (with the Playa Map)
    if (sv.items.map && g.world.minimap) { const mx = L ? L.pause.x - (W > H ? 70 : 62) : W - 80, my = (L ? L.pause.y : 30) + (W > H ? 82 : 76), mr = W > H ? 56 : 50; rects.push([mx - mr - 4, my - mr - 4, mx + mr + 4, my + mr + 4]); this.drawMinimap(ctx, g, mx, my, mr); }
  },
  drawMinimap(ctx, g, cx, cy, r) {
    const M = g.world.minimap, p = g.player, sc = M.sc * 1.6;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = 'rgba(10,6,24,0.7)'; ctx.fill(); ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI + g.camYaw);
    // map: world (x,z) -> canvas (ox + x*sc0, oz + z*sc0); we draw scaled so the player is centred
    const k = sc / M.sc;
    ctx.scale(-k, k);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(M.canvas, -(M.ox + p.x * M.sc), -(M.oz + p.z * M.sc));
    ctx.globalAlpha = 1;
    const mark = (x, z, col, s) => { const mx = (x - p.x) * M.sc, mz = (z - p.z) * M.sc; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx, mz, (s || 3.4) / k, 0, TAU); ctx.fill(); };
    for (const mk of g.world.markers) mark(mk.x, mk.z, mk.col || '#ffffff', 2.4);
    for (const c of g.world.checkpoints) mark(c.x, c.z, c.active ? '#ff4fd8' : '#8a7a9a', 2.6);
    const www = BurnsSave.hasItem('www');
    for (const m of g.missions.list) {
      const mk = m.def.marker || (m.def.target && m.def.target.x !== undefined ? m.def.target : null);
      if (!mk || m.state === 'done' || m.state === 'locked') continue;
      if (m.state === 'available' && !www) continue;
      mark(mk.x, mk.z, m.state === 'active' ? '#38f2ff' : '#ffd84a', 4);
    }
    for (const b of g.bosses) if (!b.hidden && b.x !== undefined) mark(b.x, b.z, '#ff3b5c', 5);
    ctx.restore();
    // player arrow (always points up = camera forward)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-(p.yaw - g.camYaw)); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.restore();
    this.text(ctx, 'N', cx + Math.sin(-g.camYaw + Math.PI) * (r - 7), cy - Math.cos(-g.camYaw + Math.PI) * (r - 7), 9, '#ffd84a');
  },
  drawBossBar(ctx, g, S) {
    const b = g.boss; if (!b || !b.active || b.defeated) return;
    const W = Game.cssW, bw = Math.min(380, W * 0.5), x = W / 2 - bw / 2, y = S.t + (g._trk ? g._trk.h + 8 : 6);
    this.text(ctx, b.name, W / 2, y + 8, 14, '#ffd0f4', { glow: '#ff4fd8' });
    ctx.fillStyle = 'rgba(10,6,24,0.7)'; burnsRR(ctx, x, y + 18, bw, 12, 6); ctx.fill();
    const k = b.hp / b.maxHp; const gr = ctx.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(1, '#ffd84a');
    ctx.fillStyle = gr; burnsRR(ctx, x + 2, y + 20, (bw - 4) * k, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(10,6,24,0.8)'; for (let i = 1; i < b.maxHp; i++) ctx.fillRect(x + bw * i / b.maxHp - 1, y + 18, 2, 12);
    if (b.st === 'stunned') this.text(ctx, 'HE\'S DOWN! HIT THE GLOWING HEAD!', W / 2, y + 42, 12, '#ffe24a');
  },
  // font size that makes text fit maxW (never below 55% of the asked size)
  fitSize(ctx, s, size, maxW, ui) { ctx.save(); ctx.font = `${ui ? '600 ' : ''}${size}px ${ui ? FONT_UI : FONT_DISPLAY}`; const w = ctx.measureText(String(s)).width; ctx.restore(); return w > maxW ? Math.max(size * 0.55, size * maxW / w) : size; },
  // centred text that wraps to at most n lines (shrinking a little first)
  textLines(ctx, s, x, y, size, col, maxW, n, o) {
    o = o || {}; s = String(s || ''); if (!s) return 0;
    ctx.save(); ctx.font = `${o.ui ? '600 ' : ''}${size}px ${o.ui ? FONT_UI : FONT_DISPLAY}`; let L = this.wrap(ctx, s, maxW); ctx.restore();
    if (L.length > n) { size = Math.max(size * 0.8, 9); ctx.save(); ctx.font = `${o.ui ? '600 ' : ''}${size}px ${o.ui ? FONT_UI : FONT_DISPLAY}`; L = this.wrap(ctx, s, maxW); ctx.restore(); }
    L = L.slice(0, n);
    L.forEach((l, i) => this.text(ctx, l, x, y + i * (size + 3), size, col, o));
    return L.length;
  },
  // the day-of-the-week card at the start of a visit ("TUESDAY NIGHT · World 6 · The Orgy Dome")
  drawDayCard(ctx, g, fdt) {
    if (!(g.dayCardT >= 0)) { g.dayCardBottom = 0; return; }
    const O = g.dayCardO || {}, day = O.day || BurnsWorlds.day(g.worldId); if (!day) { g.dayCardT = -1; return; }
    if (g.fade > 0.6) return;   // wait for the fade-in
    if (g.dayCardT === 0 && g.banners.length && g.banners[0].big) return;   // never on top of a big banner
    g.dayCardT += fdt; const t = g.dayCardT, D = 3.8;
    if (t > D) { g.dayCardT = -1; return; }
    const W = Game.cssW, H = Game.cssH, a = clamp(Math.min(t / 0.45, (D - t) / 0.7), 0, 1);
    const y = Math.max(H * 0.2, H * 0.1 * (g.lbK || 0) + 64);
    g.dayCardBottom = y + 46;
    ctx.save(); ctx.globalAlpha = a;
    const bh = 84, gr = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
    gr.addColorStop(0, 'rgba(20,8,36,0)'); gr.addColorStop(0.5, 'rgba(20,8,36,0.62)'); gr.addColorStop(1, 'rgba(20,8,36,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, y - bh / 2, W, bh);
    const s = 1 + (1 - easeOut(clamp(t / 0.55, 0, 1))) * 0.22, size = this.fitSize(ctx, day.toUpperCase(), Math.min(36, W / 13), W - 40) * s;
    this.text(ctx, day.toUpperCase(), W / 2, y - 9, size, '#ffd84a', { glow: '#ff9a2a' });
    const meta = BurnsWorlds.meta(g.worldId), sub = O.sub || `${BurnsWorlds.label(g.worldId)} \u00b7 ${O.name || meta.name}`;
    this.text(ctx, sub, W / 2, y + 22, this.fitSize(ctx, sub, 13, W - 40, true), '#ffffff', { ui: true });
    ctx.restore();
  },
  drawBanners(ctx, g, fdt) {
    const W = Game.cssW, H = Game.cssH;
    const b = g.banners[0]; if (!b) return;
    b.t += fdt;
    if (g.banners.length > 1 && !b.big && b.dur - b.t > 0.7) b.dur = b.t + 0.7;
    const inK = easeOut(clamp(b.t / 0.3, 0, 1)), outK = clamp((b.dur - b.t) / 0.35, 0, 1), a = Math.min(inK, outK);
    if (b.t > b.dur) { g.banners.shift(); return; }
    const base = Math.max((g.topStack || 40) + 30 + g.toasts.length * 28 + (g.bossLine ? 34 : 0), H * 0.26, g.dayCardT >= 0 && g.dayCardBottom ? g.dayCardBottom + 26 : 0);
    const y = b.big ? Math.max(base + 30, H * 0.32) : base;
    ctx.save(); ctx.globalAlpha = a;
    if (b.big) {
      const bh = 86; const gr = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2); gr.addColorStop(0, 'rgba(20,8,36,0)'); gr.addColorStop(0.5, 'rgba(20,8,36,0.75)'); gr.addColorStop(1, 'rgba(20,8,36,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, y - bh / 2, W, bh);
      if (b.icon) this.icon(ctx, b.icon, W / 2, y - 52 - (1 - inK) * 20, 56);
      const s = 1 + (1 - inK) * 0.4;
      // titles shrink and subtitles wrap (2 lines) so long text never runs off a portrait screen
      this.text(ctx, b.title, W / 2, y - 6, this.fitSize(ctx, b.title, Math.min(40, W / 13), W - 28) * s, b.col, { glow: b.col });
      this.textLines(ctx, b.sub, W / 2, y + 26, 13, '#ffffff', W - 36, 2, { ui: true });
    } else {
      const ts = this.fitSize(ctx, b.title, b.small ? 20 : 26, W - 28);
      this.text(ctx, b.title, W / 2 + (1 - inK) * 40, y, ts, b.col, { glow: b.col });
      if (b.sub) this.textLines(ctx, b.sub, W / 2, y + (b.small ? 20 : 26), 12, '#ffffff', W - 36, 2, { ui: true });
    }
    ctx.restore();
  },
  /* ---------- touch controls ---------- */
  drawControls(ctx, g) {
    const L = Input.layout; if (!L || !(Input.usingTouch || Game.forceTouchUI)) return;
    const p = g.player;
    ctx.save();
    // floating stick
    const st = Input.stick, hx = st.active ? st.ox : L.stickHome.x, hy = st.active ? st.oy : L.stickHome.y;
    ctx.globalAlpha = st.active ? 0.9 : 0.5;
    ctx.fillStyle = 'rgba(10,6,24,0.35)'; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, L.stickHome.r, 0, TAU); ctx.fill(); ctx.stroke();
    let kx = hx, ky = hy;
    if (st.active) { const dx = st.x - st.ox, dy = st.y - st.oy, d = Math.hypot(dx, dy), m = L.stickHome.r * 0.62; kx = hx + (d > m ? dx / d * m : dx); ky = hy + (d > m ? dy / d * m : dy); }
    const kg = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, L.r * 0.55); kg.addColorStop(0, 'rgba(255,255,255,0.8)'); kg.addColorStop(1, 'rgba(255,160,220,0.45)');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(kx, ky, L.r * 0.5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    const btn = (b, held, label, col, sub) => {
      ctx.save(); ctx.translate(b.x, b.y); const s = held ? 0.92 : 1; ctx.scale(s, s);
      const gg = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 2, 0, 0, b.r);
      gg.addColorStop(0, rgba(col, held ? 0.92 : 0.7)); gg.addColorStop(1, rgba(shade(col, -0.45), held ? 0.85 : 0.55));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
      // labels shrink to fit the button (long ACTION prompts: 'QUEST BOARD', 'ENTER' + a place name)
      const fit = (txt, size, font, maxW) => { ctx.font = `${size}px ${font}`; const w = ctx.measureText(txt).width; if (w > maxW) ctx.font = `${Math.max(8, Math.floor(size * maxW / w))}px ${font}`; };
      ctx.fillStyle = '#ffffff'; fit(label, Math.round(b.r * (label.length > 4 ? 0.3 : 0.38)), FONT_DISPLAY, b.r * 1.7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, sub ? -b.r * 0.12 : 1);
      if (sub) { fit(sub, Math.round(b.r * 0.22), FONT_UI, b.r * 1.75); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(sub, 0, b.r * 0.3); }
      ctx.restore();
    };
    const veh = p.vehicle;
    btn(L.jump, Input.jump, veh && veh.kind === 'car' ? 'HONK' : veh ? 'HOP' : 'JUMP', '#c04bff');
    const act = g.prompt || (veh ? (veh.kind === 'bike' ? 'BELL' : 'FIRE') : (p.power === 'liquor' && p.powerT > 0 ? 'THROW' : p.grounded ? 'SPIN' : 'POUND'));
    const ci = act.indexOf(': ');   // 'ENTER: THE TEMPLE' -> ENTER, with the place underneath
    btn(L.action, Input.action, ci > 0 ? act.slice(0, ci) : act, g.prompt ? '#ffb020' : '#ff4b7d', ci > 0 ? act.slice(ci + 2) : undefined);
    const H = this.hudBtnsCache = g.hudBtns;
    if (H) {
      btn(H.cam, Input.hudHeld.cam, 'CAM', '#3a6aff');
      if (H.view && Input.hud && Input.hud.indexOf(H.view) >= 0) btn(H.view, Input.hudHeld.view, 'VIEW', '#22a890', ({ normal: '3RD', close: 'CLOSE', first: '1ST', far: 'FAR' })[g.camMode || 'normal']);
      if (Input.hud && Input.hud.indexOf(H.bike) >= 0) btn(H.bike, Input.hudHeld.bike, veh ? 'EXIT' : 'BIKE', '#ffc21a');
    }
    ctx.restore();
  },
  /* ---------- dialogue ---------- */
  dialogRect(g) {
    const W = Game.cssW, H = Game.cssH, S = this.safe();
    const portrait = H > W;
    const w = Math.min(W - S.l - S.r - 16, 780), h = portrait ? 132 : 112;
    const x = (W - w) / 2, y = H - S.b - h - 8;
    const ps = h - 18;
    return { x, y, w, h, portrait: { x: x + 9, y: y + 9, w: ps, h: ps } };
  },
  drawDialog(ctx, g) {
    const D = g.dialog, c = D.cur; if (!c) return;
    const r = this.dialogRect(g), P = r.portrait;
    ctx.save();
    // panel with a hole where the 3D portrait shows through
    ctx.beginPath(); burnsRR(ctx, r.x, r.y, r.w, r.h, 16); ctx.rect(P.x + P.w, P.y, -P.w, P.h);
    const gr = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); gr.addColorStop(0, 'rgba(36,20,60,0.95)'); gr.addColorStop(1, 'rgba(16,8,30,0.95)');
    ctx.fillStyle = gr; ctx.fill('evenodd');
    // the 3D portrait shows through the hole; copy it again from this frame's GL image so nothing drawn before the
    // box (cutscene letterbox bars, power-up tints, speech bubbles) covers the face
    if (g.portraitFrame === g.frameN && g.R && g.R.w && BurnsGL.canvas) { const k = g.R.w / Game.cssW; try { ctx.drawImage(BurnsGL.canvas, P.x * k, P.y * k, P.w * k, P.h * k, P.x, P.y, P.w, P.h); } catch (e) { /* the frame copy is a nicety */ } }
    ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 2; burnsRR(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; burnsRR(ctx, P.x, P.y, P.w, P.h, 8); ctx.stroke();
    // name tag
    const name = c.name || '';
    if (name) { ctx.font = `13px ${FONT_DISPLAY}`; const nw = ctx.measureText(name).width + 24; this.pill(ctx, P.x + P.w + 10, r.y - 13, nw, 26, '#ff4fd8'); this.text(ctx, name, P.x + P.w + 10 + nw / 2, r.y, 13, '#ffffff', { stroke: false }); }
    // text
    ctx.font = `600 ${Game.cssW < 500 ? 14 : 15}px ${FONT_UI}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const tx = P.x + P.w + 14, tw = r.x + r.w - tx - 16;
    const shown = c.text.slice(0, Math.floor(D.chars));
    const lines = this.wrap(ctx, c.text, tw);
    let n = 0; const lh = Game.cssW < 500 ? 19 : 21;
    lines.forEach((l, i) => { const vis = shown.length - n; if (vis > 0) ctx.fillText(l.slice(0, vis), tx, r.y + 18 + i * lh); n += l.length + 1; });
    if (D.chars >= c.text.length) this.text(ctx, '▼', r.x + r.w - 20, r.y + r.h - 16 + Math.sin(g.time * 6) * 2, 12, '#ffd84a', { stroke: false });
    ctx.restore();
  },
  /* ---------- pause ---------- */
  buildPause(g) {
    const W = Game.cssW, H = Game.cssH, sv = BurnsSave.get(), st = Save.data.settings, bs = sv.settings;
    const bw = Math.min(260, W * 0.62), x = (W - bw) / 2;
    const list = [];
    if (g.pauseTab === 'pack' || g.pauseTab === 'board' || g.pauseTab === 'trade') return this.buildMenu(g);
    if (g.pauseTab === 'missions') {
      list.push({ x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    } else if (g.pauseTab === 'settings') {
      const two = H < 620, cw2 = two ? Math.min(250, (W - 60) / 2) : bw, x0 = two ? (W - cw2 * 2 - 12) / 2 : x, y0 = Math.max(insets.t + 62, H * 0.2);
      const row = (label, val, fn, i) => ({ x: two ? x0 + (i % 2) * (cw2 + 12) : x0, y: y0 + (two ? Math.floor(i / 2) : i) * 46, w: cw2, h: 38, label: `${label}: ${val}`, size: 12, fn: () => { fn(); BurnsSave.save(); Save.save(); g.buildPause(); } });
      const pct = v => Math.round(v * 100) + '%', cyc = (v, a) => a[(a.indexOf(v) + 1) % a.length];
      list.push(row('MUSIC', pct(st.music), () => { st.music = cyc(Math.round(st.music * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setMusicVolume(st.music); }, 0));
      list.push(row('SOUND FX', pct(st.sfx), () => { st.sfx = cyc(Math.round(st.sfx * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setSfxVolume(st.sfx); }, 1));
      list.push(row('CAMERA SPEED', { 0.6: 'SLOW', 1: 'NORMAL', 1.5: 'FAST' }[bs.camSens] || 'NORMAL', () => { bs.camSens = cyc(bs.camSens, [0.6, 1, 1.5]); }, 2));
      list.push(row('INVERT CAMERA Y', bs.invertY ? 'ON' : 'OFF', () => { bs.invertY = !bs.invertY; }, 3));
      list.push(row('AUTO CAMERA', bs.autoCam !== false ? 'ON' : 'OFF', () => { bs.autoCam = bs.autoCam === false; }, 4));
      list.push(row('SCREEN SHAKE', st.shake !== false ? 'ON' : 'OFF', () => { st.shake = st.shake === false; }, 5));
      list.push(row('CAMERA', BURNS_CAM_LABELS[g.camMode || 'normal'], () => { const i = BURNS_CAM_MODES.indexOf(g.camMode || 'normal'); g.setCamMode(BURNS_CAM_MODES[(i + 1) % BURNS_CAM_MODES.length], true); }, 6));
      list.push(row('GRAPHICS', String(bs.gfx || 'auto').toUpperCase() + (BurnsGL.gl2 ? '' : ' (BASIC)'), () => { const N = BURNS_GFX.names; bs.gfx = N[(N.indexOf(bs.gfx || 'auto') + 1) % N.length]; BurnsGL.configure(bs.gfx); }, 7));
      const rows = two ? 4 : 8;
      list.push({ x: W / 2 - bw / 2, y: y0 + rows * 46 + 6, w: bw, h: 40, label: '◀ BACK', primary: true, fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    } else {
      const items = [['RESUME', () => g.closePause(), true]];
      items.push([BurnsSave.hasItem('www') ? 'WHAT WHERE WHEN' : 'MISSIONS', () => { g.pauseTab = 'missions'; g.buildPause(); burnsSfx('map_open'); }]);
      if (g.missions.side().length) items.push(['SIDE QUESTS', () => { g.boardTab = g.boardTab || 'available'; g.pauseTab = 'board'; g.menuScroll = 0; g.buildPause(); burnsSfx('map_open'); }]);
      if (g.packVisible()) { const n = BurnsPack.total(); items.push([n ? `BACKPACK (${n})` : 'BACKPACK', () => { g.pauseTab = 'pack'; g.menuScroll = 0; g.buildPause(); burnsSfx('map_open'); }]); }
      // an entered place (open world) is left back into the city; the open world itself has a fast-travel map
      if (g.parentScene) items.push(['LEAVE' + (g.placeName ? ' ' + String(g.placeName).toUpperCase() : ''), () => { g.paused = false; BurnsOpen.leave(g, 'leave'); }]);
      else if (g.def.open) items.push(['MAP', () => { g.paused = false; g.openTravelMap(); }]);
      else items.push(['WORLD SELECT', () => { g.paused = false; g.quit(true); }]);
      items.push(['SETTINGS', () => { g.pauseTab = 'settings'; g.buildPause(); }]);
      items.push(['QUIT TO TITLE', () => { g.paused = false; g.quit(false); }]);
      // one column, or two when the screen is too short (landscape phones)
      const cols = items.length * 50 > H - Math.max(insets.t + 76, 60) - 24 ? 2 : 1, rows = Math.ceil(items.length / cols);
      const cw = cols === 2 ? Math.min(240, (W - 70) / 2) : bw, x0 = (W - (cols * cw + (cols - 1) * 14)) / 2;
      const y0 = Math.max(insets.t + 76, H / 2 - rows * 25 + 15);
      items.forEach((it, i) => { const c = i % cols, r = Math.floor(i / cols); list.push({ x: x0 + c * (cw + 14), y: y0 + r * 50, w: cw, h: 42, label: it[0], fn: it[1], primary: it[2] }); });
    }
    list.focus = 0;
    return list;
  },
  updatePause(g, dt) {
    if (Input.pausePressed) { if (g.pauseTab === 'pack' || g.pauseTab === 'board' || g.pauseTab === 'trade') g.menuBack(); else if (g.pauseTab !== 'main') { g.pauseTab = 'main'; g.buildPause(); } else g.closePause(); return; }
    const hit = BurnsUIKit.hitButtons(g.pauseUI);
    if (hit) { burnsSfx('select'); hit.fn(); return; }
    if (g.pauseTab === 'missions') { for (const t of Input.taps) { if (t.y > Game.cssH * 0.15) g.missionScroll = ((g.missionScroll || 0) + (t.y > Game.cssH * 0.6 ? 1 : -1)); } }
  },
  drawPause(ctx, g) {
    const W = Game.cssW, H = Game.cssH;
    ctx.fillStyle = 'rgba(6,3,14,0.72)'; ctx.fillRect(0, 0, W, H);
    if (g.pauseTab === 'missions') { this.drawMissions(ctx, g); BurnsUIKit.drawButtons(ctx, g.pauseUI); return; }
    if (g.pauseTab === 'pack' || g.pauseTab === 'board' || g.pauseTab === 'trade') { this.drawMenu(ctx, g); return; }
    const title = g.pauseTab === 'settings' ? 'SETTINGS' : 'PAUSED';
    if (g.pauseTab !== 'settings') {
      const L = g.pauseUI; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const b of L) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.h); }
      const top = y0 - 66, bot = y1 + 16, pw = Math.max(Math.min(320, W * 0.8), x1 - x0 + 40);
      BurnsUIKit.panel(ctx, W / 2 - pw / 2, top, pw, bot - top);
      BurnsUIKit.title(ctx, title, W / 2, top + 26, 24);
      const meta = BurnsWorlds.meta(g.worldId), day = BurnsWorlds.day(g.worldId);
      this.text(ctx, `${BurnsWorlds.label(g.worldId)} · ${meta.name}${day ? ' · ' + day : ''}`, W / 2, top + 50, 11, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
    } else BurnsUIKit.title(ctx, title, W / 2, Math.max(36, insets.t + 30), 24);
    BurnsUIKit.drawButtons(ctx, g.pauseUI);
  },
  /* ---------- sub-menus: backpack, quest board, trade window ---------- */
  menuFrame(g) {
    const W = Game.cssW, H = Game.cssH, S = this.safe(), tab = g.pauseTab, portrait = H > W;
    const top = Math.max(12, insets.t + 6);
    const cw = Math.min(W - S.l - S.r - 12, 680), x = (W - cw) / 2;
    const rowH = portrait ? 78 : 58;
    const listY = top + (tab === 'board' ? 96 : 68);
    const listB = H - Math.max(12, insets.b + 6) - (tab === 'trade' ? 58 : 4);
    const maxRows = Math.max(1, Math.floor((listB - listY + 6) / (rowH + 6)));
    return { W, H, top, cw, x, rowH, listY, listB, maxRows, portrait, btnW: portrait ? 84 : 96 };
  },
  // the rows a sub-menu shows: [{kind, ...}]
  menuRows(g) {
    const tab = g.pauseTab;
    if (tab === 'pack') return BurnsPack.list().map(e => ({ kind: 'pack', id: e.id, n: e.n, def: e.def }));
    if (tab === 'board') {
      const want = g.boardTab || 'available', order = { active: 0, available: 1, locked: 2, done: 3 };
      return g.missions.side().filter(m => want === 'available' ? (m.state === 'available' || m.state === 'locked') : m.state === want)
        .sort((a, b) => order[a.state] - order[b.state]).map(m => ({ kind: 'quest', m }));
    }
    if (tab === 'trade') {
      const T = g.tradeCtx || { trades: [] }, a = T.actor;
      return (T.trades || []).map((t, i) => ({ kind: 'trade', t, i, a })).filter(r => !r.t.when || r.t.when(g, r.a));
    }
    return [];
  },
  buildMenu(g) {
    const F = this.menuFrame(g), tab = g.pauseTab, list = [];
    list.push({ x: Math.max(14, insets.l + 8), y: F.top, w: 92, h: 38, label: '◀ BACK', fn: () => g.menuBack() });
    if (tab === 'board') {
      const tabs = [['available', 'AVAILABLE'], ['active', 'ACTIVE'], ['done', 'DONE']], tw = Math.min(150, (F.cw - 24) / 3);
      const side = g.missions.side(), cnt = { available: side.filter(m => m.state === 'available').length, active: side.filter(m => m.state === 'active').length, done: side.filter(m => m.state === 'done').length };
      tabs.forEach((tb, i) => list.push({ x: F.W / 2 - (tw * 3 + 16) / 2 + i * (tw + 8), y: F.top + 50, w: tw, h: 34, size: 11, label: `${tb[1]} ${cnt[tb[0]]}`, primary: (g.boardTab || 'available') === tb[0], fn: () => { g.boardTab = tb[0]; g.menuScroll = 0; g.buildPause(); } }));
    }
    const rows = this.menuRows(g);
    const start = clamp(g.menuScroll || 0, 0, Math.max(0, rows.length - F.maxRows)); g.menuScroll = start;
    g.menuVis = rows.slice(start, start + F.maxRows);
    g.menuVis.forEach((r, i) => { r.y = F.listY + i * (F.rowH + 6); });
    const bx = F.x + F.cw - F.btnW - 10, bh = 36;
    for (const r of g.menuVis) {
      const by = r.y + (F.rowH - bh) / 2;
      if (r.kind === 'pack') {
        if (BurnsPack.usable(r.id)) list.push({ x: bx, y: by, w: F.btnW, h: bh, label: 'USE', size: 13, primary: true, fn: () => { g.closePause(); g.pack.use(r.id); } });
      } else if (r.kind === 'quest') {
        const m = r.m, d = m.def;
        if (m.state === 'available' && (d.start === 'board' || (!d.giver && d.start !== 'auto' && d.start !== 'trigger'))) list.push({ x: bx, y: by, w: F.btnW, h: bh, label: 'ACCEPT', size: 12, primary: true, fn: () => g.boardAccept(m.id) });
        else if (m.state === 'active') { const tr = g.missions.tracked === m.id; list.push({ x: bx, y: by, w: F.btnW, h: bh, label: tr ? 'TRACKED' : 'TRACK', size: 11, disabled: tr, fn: () => { g.missions.track(m.id); g.buildPause(); } }); }
      } else if (r.kind === 'trade') {
        const done = g.tradeDone(r.a, r.t, r.i), ok = !done && g.canPay(r.t.give);
        list.push({ x: bx, y: by, w: F.btnW, h: bh, label: done ? 'TRADED' : 'TRADE', size: 12, primary: ok, disabled: !ok, fn: () => g.doTrade(r.a, r.t, r.i) });
      }
    }
    if (rows.length > F.maxRows) {
      const ax = F.x + F.cw - 100;
      list.push({ x: ax, y: F.top, w: 44, h: 38, label: '▲', disabled: start <= 0, fn: () => { g.menuScroll = Math.max(0, start - Math.max(1, F.maxRows - 1)); g.buildPause(); } });
      list.push({ x: ax + 50, y: F.top, w: 44, h: 38, label: '▼', disabled: start >= rows.length - F.maxRows, fn: () => { g.menuScroll = start + Math.max(1, F.maxRows - 1); g.buildPause(); } });
    }
    if (tab === 'trade') list.push({ x: F.W / 2 - 80, y: F.H - Math.max(12, insets.b + 6) - 48, w: 160, h: 44, label: 'DONE', primary: true, fn: () => g.menuBack() });
    list.focus = tab === 'trade' ? list.length - 1 : 0;
    return list;
  },
  // a tinted baggie with the item's atlas icon (or its initial)
  itemIcon(ctx, d, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(244,246,255,0.94)'; burnsRR(ctx, -s * 0.36, -s * 0.46, s * 0.72, s * 0.92, s * 0.12); ctx.fill();
    ctx.fillStyle = d.col || '#ffd84a'; burnsRR(ctx, -s * 0.36, -s * 0.46, s * 0.72, s * 0.16, s * 0.06); ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,30,0.5)'; ctx.lineWidth = 1; burnsRR(ctx, -s * 0.36, -s * 0.46, s * 0.72, s * 0.92, s * 0.12); ctx.stroke();
    ctx.restore();
    if (d.icon && BURNS_ATLAS.icon(d.icon)) this.icon(ctx, d.icon, x, y + s * 0.08, s * 0.56);
    else this.text(ctx, String(d.name || '?').charAt(0), x, y + s * 0.08, s * 0.42, shade(d.col || '#888888', -0.35), { stroke: false });
  },
  bagGlyph(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); const k = s / 20; ctx.scale(k, k);
    ctx.strokeStyle = 'rgba(20,8,30,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -7, 4.5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = col; burnsRR(ctx, -8, -7, 16, 17, 5); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = shade(col, -0.3); burnsRR(ctx, -8, -7, 16, 7, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; burnsRR(ctx, -4.5, 2, 9, 5.5, 2); ctx.fill();
    ctx.restore();
  },
  drawMenu(ctx, g) {
    const F = this.menuFrame(g), W = F.W, H = F.H, tab = g.pauseTab;
    let title = '', sub = '';
    if (tab === 'pack') {
      title = 'BACKPACK';
      sub = BurnsSave.groundScore() ? 'Ground scores and goodies. USE one when the moment is right.' : 'Sunscreen, a mystery granola bar and good intentions.';
    } else if (tab === 'board') {
      const side = g.missions.side();
      title = (g.boardTitle || g.def.boardTitle || 'QUEST BOARD').toUpperCase();
      sub = `${side.filter(m => m.state === 'done').length} / ${side.length} side quests done`;
    } else {
      const a = g.tradeCtx && g.tradeCtx.actor;
      title = ((a && ((a.def && a.def.name) || (a.type && g.typeName(a.type)))) || 'TRADE').toUpperCase();
      sub = `Wants to trade · You carry ${g.glow} glow stick${g.glow === 1 ? '' : 's'}`;
    }
    BurnsUIKit.title(ctx, title, W / 2, F.top + 19, Math.min(22, W / 18));
    this.text(ctx, sub, W / 2, F.top + 42, 11, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    const vis = g.menuVis || [];
    if (!vis.length) {
      const msg = tab === 'pack' ? (BurnsSave.groundScore() ? 'Empty. Ground scores you pick up land in here.' : 'Nothing useful in here yet.') : tab === 'board' ? ({ available: 'No new side quests right now.', active: 'No side quests in progress.', done: 'Nothing done yet. Get out there!' })[g.boardTab || 'available'] : 'Nothing to trade right now.';
      this.text(ctx, msg, W / 2, (F.listY + F.listB) / 2, 13, '#ffd0f4', { ui: true, stroke: false });
    }
    const tx = F.x + 50, tw = F.cw - 50 - F.btnW - 26, lines = F.portrait ? 2 : 1;
    const para = (s, x, y, w, col, n, size) => {
      ctx.save(); ctx.font = `${size || 11}px ${FONT_UI}`; ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const L = this.wrap(ctx, s, w); const out = L.slice(0, n);
      if (L.length > n && out.length) { let l = out[out.length - 1]; while (l.length > 4 && ctx.measureText(l + '…').width > w) l = l.slice(0, -1); out[out.length - 1] = l + '…'; }
      out.forEach((l, k) => ctx.fillText(l, x, y + k * 13)); ctx.restore(); return out.length;
    };
    for (const r of vis) {
      const y = r.y, h = F.rowH;
      let bg = 'rgba(255,255,255,0.07)';
      if (r.kind === 'quest' && r.m.state === 'active') bg = 'rgba(56,242,255,0.14)';
      if (r.kind === 'trade' && g.tradeDone(r.a, r.t, r.i)) bg = 'rgba(122,255,90,0.08)';
      ctx.fillStyle = bg; burnsRR(ctx, F.x, y, F.cw, h, 10); ctx.fill();
      if (r.kind === 'pack') {
        const d = r.def;
        this.itemIcon(ctx, d, F.x + 25, y + h / 2, 36);
        this.text(ctx, d.name + (r.n > 1 ? `  ×${r.n}` : ''), tx, y + 15, 12, d.col || '#ffffff', { align: 'left' });
        para(d.desc || (d.kind === 'quest' ? 'Quest item.' : ''), tx, y + 33, tw, 'rgba(255,255,255,0.78)', lines);
        if (!BurnsPack.usable(r.id)) this.text(ctx, d.kind === 'quest' ? 'QUEST ITEM' : 'FOR TRADING', F.x + F.cw - F.btnW / 2 - 10, y + h / 2, 9, 'rgba(255,255,255,0.55)', { stroke: false });
      } else if (r.kind === 'quest') {
        const m = r.m, d = m.def, locked = m.state === 'locked', hide = locked || (d.secret && m.state === 'available');
        ctx.save(); ctx.globalAlpha = m.state === 'done' ? 1 : d.token ? 0.9 : 0.5;
        if (d.token) this.icon(ctx, 'token', F.x + 25, y + h / 2, 26); else this.bagGlyph(ctx, F.x + 25, y + h / 2, 22, m.state === 'done' ? '#7aff5a' : '#ffb0d8');
        ctx.restore();
        this.text(ctx, hide ? '???' : d.name, tx, y + 13, 12, '#ffffff', { align: 'left' });
        const giver = d.giver && g.actor(d.giver), gname = giver ? ((giver.def && giver.def.name) || g.typeName(giver.type)) : null;
        let desc = locked ? (d.lockedDesc || 'Do other quests first.') : hide ? 'A secret. Keep exploring.' : (d.desc || '');
        if (!hide && d.hint) desc += ' · ' + d.hint;
        const n = para(desc, tx, y + 29, tw, 'rgba(255,255,255,0.78)', lines);
        const rw = d.reward ? BurnsGoods.text(d.reward) : '';
        const foot = m.state === 'available' && gname && d.start !== 'board' ? `Talk to ${gname}` + (rw ? ' · ' : '') : '';
        if (foot || rw || d.token) para((foot ? foot : '') + (rw ? 'REWARD: ' + rw : '') + (d.token ? (rw ? ' + ' : 'REWARD: ') + 'BURN TOKEN' : ''), tx, y + 29 + n * 13 + 2, tw, foot ? '#ffd84a' : '#9aff7a', 1);
        if (m.state === 'done') this.text(ctx, '✓ DONE', F.x + F.cw - F.btnW / 2 - 10, y + h / 2, 11, '#7aff5a', { stroke: false });
        else if (m.state === 'available' && !(d.start === 'board' || (!d.giver && d.start !== 'auto' && d.start !== 'trigger'))) this.text(ctx, gname ? 'SEE ' + gname.split(' ')[0] : 'FIND IT', F.x + F.cw - F.btnW / 2 - 10, y + h / 2, 9, '#ffd84a', { stroke: false });
      } else if (r.kind === 'trade') {
        const t = r.t, done = g.tradeDone(r.a, r.t, r.i);
        const give = BurnsGoods.list(t.give), gd = give.find(e => e.k === 'pack');
        this.itemIcon(ctx, gd ? BurnsPack.get(gd.id) : { name: '*', col: '#b8ff9a', icon: 'glowstick' }, F.x + 25, y + h / 2, 34);
        const top = t.label ? t.label : null;
        let yy = y + (top ? 12 : 17);
        if (top) { this.text(ctx, top, tx, yy, 11, '#ffffff', { align: 'left', ui: true }); yy += 16; }
        para('GIVE  ' + (BurnsGoods.text(t.give) || 'NOTHING'), tx, yy, tw, '#ff9ad8', 1, 12); yy += 16;
        para('GET  ' + (BurnsGoods.text(t.get) || 'GOOD VIBES'), tx, yy, tw, '#9aff7a', 1, 12);
        if (!done && !g.canPay(t.give) && F.rowH > 64) para('Need ' + BurnsGoods.missing(g, t.give), tx, yy + 15, tw, 'rgba(255,255,255,0.6)', 1, 10);
      }
    }
    BurnsUIKit.drawButtons(ctx, g.pauseUI);
  },
  drawMissions(ctx, g) {
    const W = Game.cssW, H = Game.cssH, www = BurnsSave.hasItem('www');
    BurnsUIKit.title(ctx, www ? 'WHAT WHERE WHEN' : 'MISSIONS', W / 2, Math.max(34, insets.t + 28), 22);
    const meta = BurnsWorlds.meta(g.worldId);
    this.text(ctx, `${BurnsWorlds.label(g.worldId)}: ${meta.name} · Tokens ${BurnsSave.tokenCount(g.worldId)}/${BurnsWorlds.tokenTotal(g.worldId)} · Photos ${BurnsSave.photoCount(g.worldId)}/3`, W / 2, Math.max(56, insets.t + 50), 11, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    const list = g.missions.list.filter(m => !m.def.side && (www || m.state !== 'locked'));
    const cw = Math.min(W - 40, 640), x = (W - cw) / 2, rowH = W > H ? 46 : 58;
    const maxRows = Math.floor((H - 110) / (rowH + 6)), start = clamp(g.missionScroll || 0, 0, Math.max(0, list.length - maxRows));
    g.missionScroll = start;
    list.slice(start, start + maxRows).forEach((m, i) => {
      const y = 76 + i * (rowH + 6), d = m.def;
      ctx.fillStyle = m.state === 'active' ? 'rgba(56,242,255,0.16)' : 'rgba(255,255,255,0.07)'; burnsRR(ctx, x, y, cw, rowH, 10); ctx.fill();
      ctx.globalAlpha = m.state === 'done' ? 1 : 0.35; this.icon(ctx, 'token', x + 22, y + rowH / 2, 26); ctx.globalAlpha = 1;
      const st = { done: 'DONE', active: 'ACTIVE', available: 'AVAILABLE', locked: '???' }[m.state];
      const stCol = { done: '#7aff5a', active: '#38f2ff', available: '#ffd84a', locked: '#8a7a9a' }[m.state];
      const nm = (m.state === 'locked' && !www) || (d.secret && (m.state === 'available' || m.state === 'locked')) ? '???' : d.name;
      this.text(ctx, nm, x + 44, y + 15, 12, '#ffffff', { align: 'left' });
      ctx.save(); ctx.font = `${W > H ? 11 : 11}px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const loc = (www || m.state !== 'available') && d.hint ? ' · ' + d.hint : '';
      const hiddenYet = d.secret && (m.state === 'available' || m.state === 'locked');
      const desc = hiddenYet ? 'A secret challenge. Explore far off the road.' : (m.state === 'locked' ? (d.lockedDesc || 'Finish other missions first.') : d.desc || '') + loc;
      this.wrap(ctx, desc, cw - 160).slice(0, W > H ? 1 : 2).forEach((l, k) => ctx.fillText(l, x + 44, y + 31 + k * 13));
      ctx.restore();
      this.text(ctx, st, x + cw - 50, y + rowH / 2, 10, stCol, { stroke: false });
    });
    if (list.length > maxRows) this.text(ctx, 'TAP TOP / BOTTOM TO SCROLL', W / 2, H - Math.max(14, insets.b + 8), 10, 'rgba(255,255,255,0.6)', { stroke: false });
    if (!www) this.text(ctx, 'Find the What Where When guide to see every mission and where it is.', W / 2, H - Math.max(30, insets.b + 24), 11, '#ffd0f4', { ui: true, stroke: false });
  },
  drawResults(ctx, g) {
    const W = Game.cssW, H = Game.cssH, k = clamp(g.resultsT / 0.6, 0, 1);
    ctx.fillStyle = `rgba(8,4,18,${0.82 * k})`; ctx.fillRect(0, 0, W, H);
    const meta = BurnsWorlds.meta(g.worldId);
    this.text(ctx, 'WORLD COMPLETE!', W / 2, H * 0.22, Math.min(40, W / 12) * (0.6 + 0.4 * easeOut(k)), '#ffd84a', { glow: '#ff9a2a' });
    this.text(ctx, `${BurnsWorlds.label(g.worldId)}: ${meta.name}`, W / 2, H * 0.32, 14, '#ffffff', { ui: true });
    const rows = [['token', `Burn Tokens  ${BurnsSave.tokenCount(g.worldId)} / ${BurnsWorlds.tokenTotal(g.worldId)}`], ['photo', `Photos of Chinka  ${BurnsSave.photoCount(g.worldId)} / 3`], ['glowstick', `Glow sticks  ${g.glow}`]];
    rows.forEach((r, i) => { const a = clamp((g.resultsT - 0.4 - i * 0.25) / 0.3, 0, 1); ctx.save(); ctx.globalAlpha = a; this.icon(ctx, r[0], W / 2 - 120, H * 0.44 + i * 38, 28); this.text(ctx, r[1], W / 2 - 96, H * 0.44 + i * 38, 15, '#ffffff', { align: 'left' }); ctx.restore(); });
    const nx = BurnsWorlds.next(g.worldId);
    if (nx) this.text(ctx, BurnsWorlds.isSecret(nx) ? 'A SECRET WORLD HAS BEEN UNLOCKED...' : `${BurnsWorlds.label(nx).toUpperCase()} UNLOCKED: ${BurnsWorlds.meta(nx).name.toUpperCase()}`, W / 2, H * 0.75, 13, '#7aff5a', { glow: '#2aff6a' });
    if (g.resultsT > 1.2) this.text(ctx, 'TAP TO CONTINUE', W / 2, H * 0.86 + Math.sin(g.t * 4) * 2, 12, '#ffd84a');
  }
};

/* ---------------- exports + test/debug hooks ----------------
   Made here, in the last engine module every app bundles (Art Cart has no hub or title module), so BurnsGL and the
   debug API are always there; the hub, the title app and the worlds add their own entries. */
window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, {
  BurnsPlayScene, BurnsWorlds, BurnsSave, BurnsScenes, BurnsGL, BurnsRenderer, BurnsEnv, BurnsChar,
  BurnsManBoss, BurnsRig, BurnsProps, BurnsMesh, BurnsBehaviors, BURNS_ATLAS, BURNS_SPRITES,
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
});
