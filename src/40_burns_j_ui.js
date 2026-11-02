/* ============================================================
   BRADY-O BURNS — 2D overlay: HUD, touch controls, speech bubbles,
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
  pill(ctx, x, y, w, h, fill, stroke) { ctx.fillStyle = fill; rr(ctx, x, y, w, h, h / 2); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); } },
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
    this.text(ctx, 'WORLD ' + g.worldId, W / 2, H * 0.38, 14, '#ffd84a');
    this.text(ctx, (meta.name || '').toUpperCase(), W / 2, H * 0.47, Math.min(34, W / 16), '#ffffff', { glow: '#ff4fd8' });
    this.text(ctx, 'Loading the playa' + '.'.repeat(1 + Math.floor(g.t * 4) % 3), W / 2, H * 0.58, 13, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
  },
  drawNoGL(ctx, g) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    ctx.fillStyle = '#100820'; ctx.fillRect(0, 0, W, H);
    this.text(ctx, 'BRADY-O BURNS', W / 2, H * 0.3, 26, '#ff9a4a', { glow: '#ff4fd8' });
    ctx.save(); ctx.font = `14px ${FONT_UI}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    const msg = g.noglMsg || 'This 3D adventure needs WebGL, and this browser has it turned off (or the GPU is busy). Try reopening Safari, or turn off Low Power Mode.';
    this.wrap(ctx, msg, Math.min(W - 40, 520)).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 + i * 20));
    ctx.restore();
    if (g.noglBtns) UI.drawButtons(ctx, g.noglBtns);
  },
  drawMissing(ctx, g) {
    if (!g.noglBtns) g.buildNoGL();
    g.noglMsg = `World ${g.worldId} is still being built by the burners. Check back soon!`;
    this.drawNoGL(ctx, g);
  },
  /* ---------- the in-game overlay ---------- */
  drawOverlay(ctx, g, fdt) {
    const W = Game.cssW, H = Game.cssH, p = g.player, R = g.R, S = this.safe();
    g.syncHudButtons();
    g.lastFdt = fdt;
    const bossOn = g.boss && g.boss.active && !g.boss.defeated;
    g.topStack = S.t + (g.missions.tracker() ? 36 : 6) + (bossOn ? 52 : 0);
    // screen tints for power-ups
    if (p.power === 'khole' && p.powerT > 0) { const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85); v.addColorStop(0, 'rgba(80,40,160,0)'); v.addColorStop(1, `rgba(80,40,160,${0.45 + Math.sin(g.time * 2) * 0.1})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    if (p.power === 'lsd' && p.powerT > 0) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = `hsla(${(g.time * 90) % 360},90%,60%,0.16)`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (p.hydration <= 2 && !p.dead) { const a = (0.22 + Math.sin(g.time * 5) * 0.1) * (p.hydration <= 1 ? 1.4 : 1); const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9); v.addColorStop(0, 'rgba(255,40,40,0)'); v.addColorStop(1, `rgba(200,20,20,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    this.drawWorldLabels(ctx, g);
    const cine = !!g.cine;
    if (!cine && g.state === 'play') this.drawHUD(ctx, g, S);
    this.drawBossBar(ctx, g, S);
    // letterbox
    g.lbK = BurnsM.damp(g.lbK || 0, cine && g.cine.letter ? 1 : 0, 6, fdt);
    if (g.lbK > 0.01) { const bh = H * 0.1 * g.lbK; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
    if (cine && !g.dialog.open) { const sx = W - S.r - 80, sy = H - S.b - 36 - (g.lbK > 0.5 ? 0 : 0); this.pill(ctx, sx, sy, 72, 28, 'rgba(10,6,20,0.6)', 'rgba(255,255,255,0.3)'); this.text(ctx, 'SKIP ▶▶', sx + 36, sy + 14, 10, '#ffffff', { stroke: false }); g.skipRect = { x: sx, y: sy, w: 72, h: 28 }; } else g.skipRect = null;
    this.drawBanners(ctx, g, fdt);
    // warning
    if (g.warnT > 0 && g.warnText) { const a = 0.6 + 0.4 * Math.sin(g.time * 18); this.text(ctx, g.warnText, W / 2, H * 0.3, Math.min(40, W / 14), `rgba(255,${80 + 100 * a | 0},80,${a})`, { glow: '#ff2a2a' }); this.text(ctx, g.warnT.toFixed(1), W / 2, H * 0.3 + 34, 18, '#ffffff'); }
    if (g.dialog.open) this.drawDialog(ctx, g);
    if (!cine && g.state === 'play' && !g.dialog.open && !g.paused) this.drawControls(ctx, g);
    // flash + fade
    if (g.flashA > 0) { ctx.fillStyle = rgba(g.flashC || '#ffffff', Math.min(1, g.flashA)); ctx.fillRect(0, 0, W, H); g.flashA = Math.max(0, g.flashA - fdt * 1.6); }
    g.fade = approach(g.fade, g.fadeTarget, fdt * g.fadeRate);
    if (g.fade > 0.001) { ctx.fillStyle = `rgba(6,3,12,${g.fade})`; ctx.fillRect(0, 0, W, H); }
    if (g.paused) this.drawPause(ctx, g);
    if (g.state === 'results') this.drawResults(ctx, g);
    if (window.__burnsDebug) { ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(`fps ${g.stats.fps.toFixed(0)} cpu ${g.stats.cpu.toFixed(1)}ms draws ${g.stats.draws} tris ${(g.stats.tris / 1000).toFixed(0)}k q ${g.q.toFixed(2)} p ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`, 8, H - 6); }
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
      ctx.fillStyle = col || 'rgba(255,255,255,0.95)'; rr(ctx, bx, by, w, h, 10 * sc); ctx.fill();
      ctx.beginPath(); ctx.moveTo(clamp(o.x, bx + 10, bx + w - 10) - 6 * sc, by + h - 1); ctx.lineTo(clamp(o.x, bx + 10, bx + w - 10) + 6 * sc, by + h - 1); ctx.lineTo(o.x, Math.min(by + h + 10 * sc, o.y - 2)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = small ? '#ffffff' : '#1a1024'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 6 * sc + i * lh));
      ctx.restore();
    };
    for (const a of g.actors) {
      if (a.removed || a.hidden) continue;
      const top = a.y + a.h * 1.04 + 0.15;
      if (a.bubbleText && a.bubbleT > 0) bubble(a.x, top, a.z, a.bubbleText, a.friendly ? null : 'rgba(255,230,230,0.96)');
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
      if (P.taken || !P.label || (P.hidden && !(p.power === 'lsd' && p.powerT > 0))) continue;
      const d = Math.hypot(P.x - p.x, P.z - p.z); if (d > 9) continue;
      if (R.project(P.x, P.y0 + 0.75, P.z, W, H, o)) this.text(ctx, P.label, o.x, o.y, 12, '#ffffff', { glow: '#ff4fd8' });
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
  drawHUD(ctx, g, S) {
    const W = Game.cssW, H = Game.cssH, p = g.player, sv = BurnsSave.get();
    let x = S.l + 6, y = S.t + 8;
    // hydration drops
    const ds = Math.min(24, W / 26);
    for (let i = 0; i < p.maxHydration; i++) this.drop(ctx, x + 10 + i * (ds * 0.95), y + ds * 0.55, ds, '#2a9aff', clamp(p.hydration - i, 0, 1));
    y += ds * 1.4;
    // glow sticks / tokens / photos
    const row = (icon, label, col) => { this.pill(ctx, x, y, 86, 24, 'rgba(10,6,24,0.55)'); this.icon(ctx, icon, x + 13, y + 12, 20); this.text(ctx, label, x + 50, y + 12.5, 12, col || '#ffffff'); y += 28; };
    row('glowstick', String(g.glow), '#b8ff9a');
    row('token', `${BurnsSave.tokenCount(g.worldId)}/${BurnsWorlds.tokenTotal(g.worldId)}`, '#ffd84a');
    row('photo', `${BurnsSave.photoCount(g.worldId)}/3`, '#ffb0d8');
    // power-up timer
    if (p.power && p.powerT > 0) {
      const P = BURNS_POWERUPS[p.power], k = p.powerT / (p.powerMax || P.dur), cx = x + 22, cy = y + 24;
      ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fill();
      ctx.strokeStyle = P.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); ctx.restore();
      this.icon(ctx, P.icon, cx, cy, 22);
      this.text(ctx, P.name + (p.power === 'liquor' ? ` ×${p.ammo}` : ''), cx + 28, cy, 11, P.col, { align: 'left' });
    }
    // mission tracker
    const tr = g.missions.tracker();
    if (tr) {
      ctx.save(); ctx.font = `600 12px ${FONT_UI}`; const tw = Math.min(W * 0.5, ctx.measureText(tr.text).width + 34); ctx.restore();
      const tx = W / 2 - tw / 2, ty = S.t + 6;
      this.pill(ctx, tx, ty, tw, 26, 'rgba(10,6,24,0.6)', 'rgba(56,242,255,0.5)');
      this.text(ctx, '▶ ' + tr.text, W / 2, ty + 13.5, 12, '#d8fbff', { ui: true, stroke: false });
    }
    // toasts (below the tracker / boss bar stack)
    let ty2 = g.topStack || (S.t + 40);
    for (const t of g.toasts) { t.t += g.lastFdt || 1 / 60; const a = clamp(Math.min(t.t * 6, (2.2 - t.t) * 3), 0, 1); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.font = `600 12px ${FONT_UI}`; const w = ctx.measureText(t.text).width + 26; this.pill(ctx, W / 2 - w / 2, ty2, w, 24, 'rgba(255,79,216,0.85)'); this.text(ctx, t.text, W / 2, ty2 + 12.5, 12, '#ffffff', { ui: true, stroke: false }); ctx.restore(); ty2 += 28; }
    g.toasts = g.toasts.filter(t => t.t < 2.2);
    // pause button
    const L = Input.layout;
    if (L) { const pb = L.pause; ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, pb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(pb.x - 6, pb.y - 7, 4, 14); ctx.fillRect(pb.x + 2, pb.y - 7, 4, 14); ctx.restore(); }
    // minimap (with the Playa Map)
    if (sv.items.map && g.world.minimap) this.drawMinimap(ctx, g, L ? L.pause.x - (W > H ? 70 : 62) : W - 80, (L ? L.pause.y : 30) + (W > H ? 82 : 76), W > H ? 56 : 50);
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
    const W = Game.cssW, bw = Math.min(380, W * 0.5), x = W / 2 - bw / 2, y = S.t + (g.missions.tracker() ? 34 : 6);
    this.text(ctx, b.name, W / 2, y + 8, 14, '#ffd0f4', { glow: '#ff4fd8' });
    ctx.fillStyle = 'rgba(10,6,24,0.7)'; rr(ctx, x, y + 18, bw, 12, 6); ctx.fill();
    const k = b.hp / b.maxHp; const gr = ctx.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(1, '#ffd84a');
    ctx.fillStyle = gr; rr(ctx, x + 2, y + 20, (bw - 4) * k, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(10,6,24,0.8)'; for (let i = 1; i < b.maxHp; i++) ctx.fillRect(x + bw * i / b.maxHp - 1, y + 18, 2, 12);
    if (b.st === 'stunned') this.text(ctx, 'HE\'S DOWN! HIT THE GLOWING HEAD!', W / 2, y + 42, 12, '#ffe24a');
  },
  drawBanners(ctx, g, fdt) {
    const W = Game.cssW, H = Game.cssH;
    const b = g.banners[0]; if (!b) return;
    b.t += fdt;
    if (g.banners.length > 1 && !b.big && b.dur - b.t > 0.7) b.dur = b.t + 0.7;
    const inK = easeOut(clamp(b.t / 0.3, 0, 1)), outK = clamp((b.dur - b.t) / 0.35, 0, 1), a = Math.min(inK, outK);
    if (b.t > b.dur) { g.banners.shift(); return; }
    const base = Math.max((g.topStack || 40) + 30 + g.toasts.length * 28 + (g.bossLine ? 34 : 0), H * 0.26);
    const y = b.big ? Math.max(base + 30, H * 0.32) : base;
    ctx.save(); ctx.globalAlpha = a;
    if (b.big) {
      const bh = 86; const gr = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2); gr.addColorStop(0, 'rgba(20,8,36,0)'); gr.addColorStop(0.5, 'rgba(20,8,36,0.75)'); gr.addColorStop(1, 'rgba(20,8,36,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, y - bh / 2, W, bh);
      if (b.icon) this.icon(ctx, b.icon, W / 2, y - 52 - (1 - inK) * 20, 56);
      const s = 1 + (1 - inK) * 0.4;
      this.text(ctx, b.title, W / 2, y - 6, Math.min(40, W / 13) * s, b.col, { glow: b.col });
      this.text(ctx, b.sub, W / 2, y + 26, 13, '#ffffff', { ui: true });
    } else {
      this.text(ctx, b.title, W / 2 + (1 - inK) * 40, y, b.small ? 20 : 26, b.col, { glow: b.col });
      if (b.sub) this.text(ctx, b.sub, W / 2, y + (b.small ? 20 : 26), 12, '#ffffff', { ui: true });
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
      ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(b.r * (label.length > 4 ? 0.3 : 0.38))}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, sub ? -b.r * 0.12 : 1);
      if (sub) { ctx.font = `${Math.round(b.r * 0.22)}px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(sub, 0, b.r * 0.3); }
      ctx.restore();
    };
    const veh = p.vehicle;
    btn(L.jump, Input.jump, veh && veh.kind === 'car' ? 'HONK' : veh ? 'HOP' : 'JUMP', '#c04bff');
    const act = g.prompt || (veh ? (veh.kind === 'bike' ? 'BELL' : 'FIRE') : (p.power === 'liquor' && p.powerT > 0 ? 'THROW' : p.grounded ? 'SPIN' : 'POUND'));
    btn(L.action, Input.action, act, g.prompt ? '#ffb020' : '#ff4b7d');
    const H = this.hudBtnsCache = g.hudBtns;
    if (H) {
      btn(H.cam, Input.hudHeld.cam, 'CAM', '#3a6aff');
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
    ctx.beginPath(); rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.rect(P.x + P.w, P.y, -P.w, P.h);
    const gr = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); gr.addColorStop(0, 'rgba(36,20,60,0.95)'); gr.addColorStop(1, 'rgba(16,8,30,0.95)');
    ctx.fillStyle = gr; ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 2; rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; rr(ctx, P.x, P.y, P.w, P.h, 8); ctx.stroke();
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
    if (g.pauseTab === 'missions') {
      list.push({ x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    } else if (g.pauseTab === 'settings') {
      const row = (label, val, fn, i) => ({ x, y: H * 0.2 + i * 46, w: bw, h: 38, label: `${label}: ${val}`, size: 12, fn: () => { fn(); BurnsSave.save(); Save.save(); g.buildPause(); } });
      const pct = v => Math.round(v * 100) + '%', cyc = (v, a) => a[(a.indexOf(v) + 1) % a.length];
      list.push(row('MUSIC', pct(st.music), () => { st.music = cyc(Math.round(st.music * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setMusicVolume(st.music); }, 0));
      list.push(row('SOUND FX', pct(st.sfx), () => { st.sfx = cyc(Math.round(st.sfx * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); Sound.setSfxVolume(st.sfx); }, 1));
      list.push(row('CAMERA SPEED', { 0.6: 'SLOW', 1: 'NORMAL', 1.5: 'FAST' }[bs.camSens] || 'NORMAL', () => { bs.camSens = cyc(bs.camSens, [0.6, 1, 1.5]); }, 2));
      list.push(row('INVERT CAMERA Y', bs.invertY ? 'ON' : 'OFF', () => { bs.invertY = !bs.invertY; }, 3));
      list.push(row('AUTO CAMERA', bs.autoCam !== false ? 'ON' : 'OFF', () => { bs.autoCam = bs.autoCam === false; }, 4));
      list.push(row('SCREEN SHAKE', st.shake !== false ? 'ON' : 'OFF', () => { st.shake = st.shake === false; }, 5));
      list.push({ x, y: H * 0.2 + 6 * 46 + 6, w: bw, h: 40, label: '◀ BACK', primary: true, fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    } else {
      let y = Math.max(insets.t + 76, H / 2 - 110);
      const b = (label, fn, primary) => { list.push({ x, y, w: bw, h: 42, label, primary, fn }); y += 50; };
      b('RESUME', () => g.closePause(), true);
      b(BurnsSave.hasItem('www') ? 'WHAT WHERE WHEN' : 'MISSIONS', () => { g.pauseTab = 'missions'; g.buildPause(); burnsSfx('map_open'); });
      b('WORLD SELECT', () => { g.paused = false; g.quit(true); });
      b('SETTINGS', () => { g.pauseTab = 'settings'; g.buildPause(); });
      b('QUIT TO TITLE', () => { g.paused = false; g.quit(false); });
    }
    list.focus = 0;
    return list;
  },
  updatePause(g, dt) {
    if (Input.pausePressed) { if (g.pauseTab !== 'main') { g.pauseTab = 'main'; g.buildPause(); } else g.closePause(); return; }
    const hit = UI.hitButtons(g.pauseUI);
    if (hit) { burnsSfx('select'); hit.fn(); }
    if (g.pauseTab === 'missions') { for (const t of Input.taps) { if (t.y > Game.cssH * 0.15) g.missionScroll = ((g.missionScroll || 0) + (t.y > Game.cssH * 0.6 ? 1 : -1)); } }
  },
  drawPause(ctx, g) {
    const W = Game.cssW, H = Game.cssH;
    ctx.fillStyle = 'rgba(6,3,14,0.72)'; ctx.fillRect(0, 0, W, H);
    if (g.pauseTab === 'missions') { this.drawMissions(ctx, g); UI.drawButtons(ctx, g.pauseUI); return; }
    const title = g.pauseTab === 'settings' ? 'SETTINGS' : 'PAUSED';
    if (g.pauseTab !== 'settings') {
      const L = g.pauseUI, top = L[0].y - 66, bot = L[L.length - 1].y + L[L.length - 1].h + 16;
      const pw = Math.min(320, W * 0.8);
      UI.panel(ctx, W / 2 - pw / 2, top, pw, bot - top);
      UI.title(ctx, title, W / 2, top + 26, 24);
      const meta = BurnsWorlds.meta(g.worldId);
      this.text(ctx, `World ${g.worldId} · ${meta.name}`, W / 2, top + 50, 11, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
    } else UI.title(ctx, title, W / 2, Math.max(36, insets.t + 30), 24);
    UI.drawButtons(ctx, g.pauseUI);
  },
  drawMissions(ctx, g) {
    const W = Game.cssW, H = Game.cssH, www = BurnsSave.hasItem('www');
    UI.title(ctx, www ? 'WHAT WHERE WHEN' : 'MISSIONS', W / 2, Math.max(34, insets.t + 28), 22);
    const meta = BurnsWorlds.meta(g.worldId);
    this.text(ctx, `World ${g.worldId}: ${meta.name} · Tokens ${BurnsSave.tokenCount(g.worldId)}/${BurnsWorlds.tokenTotal(g.worldId)} · Photos ${BurnsSave.photoCount(g.worldId)}/3`, W / 2, Math.max(56, insets.t + 50), 11, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    const list = g.missions.list.filter(m => www || m.state !== 'locked');
    const cw = Math.min(W - 40, 640), x = (W - cw) / 2, rowH = W > H ? 46 : 58;
    const maxRows = Math.floor((H - 110) / (rowH + 6)), start = clamp(g.missionScroll || 0, 0, Math.max(0, list.length - maxRows));
    g.missionScroll = start;
    list.slice(start, start + maxRows).forEach((m, i) => {
      const y = 76 + i * (rowH + 6), d = m.def;
      ctx.fillStyle = m.state === 'active' ? 'rgba(56,242,255,0.16)' : 'rgba(255,255,255,0.07)'; rr(ctx, x, y, cw, rowH, 10); ctx.fill();
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
    this.text(ctx, `World ${g.worldId}: ${meta.name}`, W / 2, H * 0.32, 14, '#ffffff', { ui: true });
    const rows = [['token', `Burn Tokens  ${BurnsSave.tokenCount(g.worldId)} / ${BurnsWorlds.tokenTotal(g.worldId)}`], ['photo', `Photos of Chinka  ${BurnsSave.photoCount(g.worldId)} / 3`], ['glowstick', `Glow sticks  ${g.glow}`]];
    rows.forEach((r, i) => { const a = clamp((g.resultsT - 0.4 - i * 0.25) / 0.3, 0, 1); ctx.save(); ctx.globalAlpha = a; this.icon(ctx, r[0], W / 2 - 120, H * 0.44 + i * 38, 28); this.text(ctx, r[1], W / 2 - 96, H * 0.44 + i * 38, 15, '#ffffff', { align: 'left' }); ctx.restore(); });
    if (g.worldId < 10) this.text(ctx, `WORLD ${g.worldId + 1} UNLOCKED: ${BurnsWorlds.meta(g.worldId + 1).name.toUpperCase()}`, W / 2, H * 0.75, 13, '#7aff5a', { glow: '#2aff6a' });
    if (g.resultsT > 1.2) this.text(ctx, 'TAP TO CONTINUE', W / 2, H * 0.86 + Math.sin(g.t * 4) * 2, 12, '#ffd84a');
  }
};
