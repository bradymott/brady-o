/* ============================================================
   World tour: shared art. The level goal (a giant passport stamp
   on a post), checkpoints (a travel signpost), Chinka's postcards
   (the 3 collectibles per level), coins (each country re-skins
   them), item crates, doors, the default boat and Brady's effects.
   ============================================================ */
const TourArt = {
  country() { const sc = Game.scene; return sc && sc.level && sc.level.tour ? Tour.countryOf(sc.level.id) : null; },
  colors() { const C = this.country(); return C ? C.colors : { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' }; },

  // the goal: walk into the stamp post and Brady's passport gets stamped
  goal(ctx, x, y, t, used, secret) {
    const col = this.colors(), A = secret ? '#2ad8a0' : col.a, Bc = secret ? '#bfffe8' : col.c;
    // the post
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 16, 4, 0, 0, TAU); ctx.fill();
    const pg = ctx.createLinearGradient(x - 4, 0, x + 4, 0); pg.addColorStop(0, '#5a5a6a'); pg.addColorStop(0.5, '#c8c8d8'); pg.addColorStop(1, '#4a4a5a');
    ctx.fillStyle = pg; ctx.fillRect(x - 3.5, y - 112, 7, 112);
    ctx.fillStyle = '#3a3a48'; rr(ctx, x - 10, y - 8, 20, 8, 3); ctx.fill();
    // pennant flags on a string
    for (let i = 0; i < 4; i++) { const fx = x - 30 + i * 10, wv = Math.sin(t * 4 + i) * 1.5; ctx.fillStyle = [col.a, col.b, col.c, '#ffffff'][i]; ctx.beginPath(); ctx.moveTo(fx, y - 84 + i * 1.5); ctx.lineTo(fx + 8, y - 84 + i * 1.5); ctx.lineTo(fx + 4, y - 74 + wv + i * 1.5); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 32, y - 82); ctx.quadraticCurveTo(x - 16, y - 78, x, y - 86); ctx.stroke();
    // the stamp disc: it spins and slams down when used
    const cy = y - 126, spin = used ? Math.cos(t * 10) : 1;
    ctx.save(); ctx.translate(x, cy); ctx.scale(Math.max(0.12, Math.abs(spin)), 1);
    ctx.shadowColor = rgba(A, 0.8); ctx.shadowBlur = 14;
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(0, 0, 25, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = A; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, 21.5, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.setLineDash([2.5, 2.5]); ctx.beginPath(); ctx.arc(0, 0, 16.5, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = A;
    if (secret) { ctx.beginPath(); TourKit.star(ctx, 0, 0, 11, 4.5, 5); ctx.fill(); }
    else {
      // a little plane in the middle of the stamp
      ctx.save(); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 2.6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(3, -10); ctx.lineTo(6, -10); ctx.lineTo(3, 0); ctx.lineTo(6, 10); ctx.lineTo(3, 10); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-12, -5); ctx.lineTo(-9, -5); ctx.lineTo(-7, 0); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = Bc; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 0.6; ctx.fillRect(Math.cos(a) * 19 - 1, Math.sin(a) * 19 - 1, 2, 2); }
    ctx.restore();
    if (used) {
      ctx.save(); ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      ctx.shadowColor = A; ctx.shadowBlur = 8; ctx.fillText('STAMPED!', x, cy - 34 + Math.sin(t * 5) * 2); ctx.restore();
    }
  },
  // checkpoint: a travel signpost; the arrows light up once reached
  checkpoint(ctx, x, y, active, t) {
    const col = this.colors();
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, 12, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a5232'; ctx.fillRect(x - 2.5, y - 70, 5, 70);
    const boards = [[-1, 58, col.a], [1, 46, col.b], [-1, 34, col.c]];
    boards.forEach(([dir, h, c], i) => {
      const wv = active ? Math.sin(t * 3 + i) * 0.04 : 0;
      ctx.save(); ctx.translate(x, y - h); ctx.rotate(wv);
      ctx.fillStyle = active ? c : '#9a8a7a';
      ctx.beginPath(); ctx.moveTo(-dir * 4, -5); ctx.lineTo(dir * 18, -5); ctx.lineTo(dir * 23, 0); ctx.lineTo(dir * 18, 5); ctx.lineTo(-dir * 4, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(Math.min(0, dir * 16) + 2, -1, 12, 1.6);
      ctx.restore();
    });
    // a little flag on top once active
    if (active) { const wv = Math.sin(t * 6) * 2; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + 2, y - 70); ctx.lineTo(x + 18, y - 66 + wv); ctx.lineTo(x + 2, y - 61); ctx.fill(); ctx.fillStyle = col.a; ctx.beginPath(); ctx.arc(x + 8, y - 66 + wv * 0.4, 2.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = active ? '#ffd84a' : '#5a4a3a'; ctx.beginPath(); ctx.arc(x, y - 71, 3.5, 0, TAU); ctx.fill();
  },
  // one of Chinka's postcards (3 per level)
  postcard(ctx, x, y, t, ghost) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.6) * 0.12);
    if (ghost) ctx.globalAlpha *= 0.45;
    ctx.shadowColor = 'rgba(255,220,140,0.9)'; ctx.shadowBlur = ghost ? 0 : 12;
    ctx.fillStyle = '#fffaf0'; rr(ctx, -14, -10, 28, 20, 2); ctx.fill();
    ctx.shadowBlur = 0;
    const col = this.colors();
    // picture half: a little sunset
    const g = ctx.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, col.b); g.addColorStop(1, col.c);
    ctx.fillStyle = g; ctx.fillRect(-12, -8, 13, 16);
    ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(-5.5, 1, 3.5, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = rgba(col.a, 0.8); ctx.fillRect(-12, 3, 13, 5);
    // the writing half + stamp + heart
    ctx.fillStyle = col.a; ctx.fillRect(6, -8, 6, 6);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.6; ctx.setLineDash([1, 1]); ctx.strokeRect(6.5, -7.5, 5, 5); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(80,60,90,0.5)'; ctx.lineWidth = 0.8;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(3, 1 + k * 3); ctx.lineTo(12, 1 + k * 3); ctx.stroke(); }
    ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(4.5, -1.5); ctx.bezierCurveTo(2, -3.5, 3, -6.5, 4.5, -5); ctx.bezierCurveTo(6, -6.5, 7, -3.5, 4.5, -1.5); ctx.fill();
    ctx.restore();
  },
  // the default coin: gold, with a little plane embossed (countries bring their own)
  coin(ctx, x, y) {
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#b8801a'; ctx.beginPath(); ctx.ellipse(x, y, 4, 1.2, -0.5, 0, TAU); ctx.fill(); ctx.fillRect(x - 1, y - 3, 2, 6);
  },
  // the item block: a souvenir crate with glowing seams (countries re-skin it)
  crate(ctx, th, f) {
    const c1 = (th && th.crate && th.crate[0]) || '#c8843a', c2 = (th && th.crate && th.crate[1]) || '#8a5222', glowC = (th && th.crate && th.crate[2]) || '#ffd84a';
    ctx.save(); ctx.shadowColor = rgba(glowC, 0.8); ctx.shadowBlur = 4 + f * 1.5;
    const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, shade(c1, 0.15)); g.addColorStop(1, c2);
    ctx.fillStyle = g; rr(ctx, 1, 1, TS - 2, TS - 2, 3); ctx.fill(); ctx.restore();
    ctx.strokeStyle = shade(c2, -0.4); ctx.lineWidth = 1.2; rr(ctx, 1, 1, TS - 2, TS - 2, 3); ctx.stroke();
    ctx.strokeStyle = rgba(shade(c2, -0.3), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(TS - 4, TS - 4); ctx.moveTo(TS - 4, 4); ctx.lineTo(4, TS - 4); ctx.stroke();
    ctx.fillStyle = rgba(glowC, 0.5 + 0.12 * f); ctx.fillRect(3, TS / 2 - 1, TS - 6, 2);
    ctx.fillStyle = '#fff8e0'; ctx.beginPath(); TourKit.star(ctx, TS / 2, TS / 2, 6.5, 3, 5); ctx.fill();
    ctx.strokeStyle = shade(c2, -0.3); ctx.lineWidth = 0.8; ctx.stroke();
    const sx = -8 + f * 12; ctx.save(); rr(ctx, 1, 1, TS - 2, TS - 2, 3); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
  },
  crateUsed(ctx, th) {
    ctx.fillStyle = '#7a6a5a'; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.fill();
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(4, 6, TS - 8, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(4, 3, TS - 8, 1.4);
  }
};

// the shared sprite calls now draw the tour versions (the 3D and kart apps don't load this file)
Object.assign(Sprites, {
  gate(ctx, x, y, t, open, secret) { TourArt.goal(ctx, x, y, t, open, secret); },
  checkpoint(ctx, x, y, active, t) { TourArt.checkpoint(ctx, x, y, active, t); },
  goldRecord(ctx, x, y, t, ghost) { TourArt.postcard(ctx, x, y, t, ghost); },
  pick(ctx, x, y, t, s) { const C = TourArt.country(); ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.2, Math.abs(s == null ? 1 : s)), 1); if (C && C.coin && C.coin.draw) C.coin.draw(ctx, 0, 0, t); else TourArt.coin(ctx, 0, 0); ctx.restore(); },
  pickFast(ctx, x, y, t, s, colIdx) {
    const C = TourArt.country(), sc = Game.S || 2, key = 'tourcoin_' + (C ? C.id : 'x');
    const img = SpriteCache.get(key, 30, 30, sc, c => { if (C && C.coin && C.coin.draw) C.coin.draw(c, 0, 0, 0); else TourArt.coin(c, 0, 0); });
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.2, Math.abs(s == null ? 1 : s)), 1); ctx.drawImage(img, -15, -15, 30, 30); ctx.restore();
  },
  itemIcon(ctx, x, y, t, kind) { ctx.save(); ctx.translate(x, y); TourItemArt.draw(ctx, kind, 0, 12, t, Game.scene); ctx.restore(); }
});
DoorArt.tourDoor = true;
const _tourDoorDraw = DoorArt.draw;
DoorArt.draw = function (ctx, x, y, look, t, near) {
  if (look !== 'tourDoor' && look !== 'tourDoor22') return _tourDoorDraw.call(this, ctx, x, y, look, t, near);
  const col = TourArt.colors(), w = 30, h = 50;
  ctx.fillStyle = '#3a2a22'; rr(ctx, x - w / 2 - 4, y - h - 4, w + 8, h + 4, 15); ctx.fill();
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shade(col.a, -0.25)); g.addColorStop(1, col.a);
  ctx.fillStyle = g; rr(ctx, x - w / 2, y - h, w, h, 13); ctx.fill();
  ctx.fillStyle = col.c; ctx.beginPath(); ctx.arc(x, y - h + 13, 6, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - h + 13, 6, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 9, y - 22, 2, 0, TAU); ctx.fill();
  if (near) { ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(t * 6)})`; rr(ctx, x - w / 2, y - h, w, h, 13); ctx.fill(); }
  // door number 22 (World 22's hidden way in)
  if (look === 'tourDoor22') { ctx.fillStyle = '#f4ecd8'; rr(ctx, x - 10, y - 34, 20, 13, 3); ctx.fill(); ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('22', x, y - 27.5); ctx.textBaseline = 'alphabetic'; }
};
// the default vehicle: a little painted boat
PlatformArt.tourBoat = function (ctx, p, t) {
  const x = p.x, y = p.y, w = p.w, col = TourArt.colors();
  ctx.fillStyle = col.a; ctx.beginPath(); ctx.moveTo(x - 8, y + 2); ctx.lineTo(x + w + 8, y + 2); ctx.lineTo(x + w - 6, y + 26); ctx.lineTo(x + 6, y + 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col.c; ctx.fillRect(x - 4, y + 8, w + 8, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 6 - i * 7 - (t * 40 % 7), y + 24 + Math.sin(t * 6 + i) * 1.5, 3 + i, 0, TAU); ctx.fill(); }
  PlatformArt.deck(ctx, x - 4, y - 2, w + 8, '#c89a6a');
};
LIQUIDS.canal = ['#5ad0b0', '#2a8a7a', '#0e4a44', 'rgba(220,255,240,0.22)', null, 'rgba(230,255,245,0.55)'];
LIQUIDS.sea = ['#7ae0ff', '#2aa0d8', '#0a4a8a', 'rgba(230,250,255,0.25)', null, 'rgba(240,255,255,0.6)'];

/* ---------- Brady's effects ---------- */
const TourPlayerFx = {
  under(ctx, p, t) {
    if (p.dead) return;
    // LSD flight: a long rainbow ribbon streaming behind Brady
    if (p.trail && p.trail.length > 2 && (p.lsdT > 0 || p.glideT > 0)) {
      const cols = ['#ff4f6a', '#ff9a3a', '#ffe14a', '#5ae07a', '#38c8ff', '#8a5aff'];
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      cols.forEach((c, k) => {
        ctx.strokeStyle = c; ctx.lineWidth = 3.2;
        ctx.beginPath();
        p.trail.forEach(([px, py], i) => { const yy = py - 7.5 + k * 3; if (i) ctx.lineTo(px, yy); else ctx.moveTo(px, yy); });
        ctx.globalAlpha = p.lsdT > 0 ? 0.9 : 0.5; ctx.stroke();
      });
      ctx.restore();
    }
  },
  over(ctx, p, t) {
    if (p.dead) return;
    if (p.sig) { const P = TourPowers.get(p.sig.id); if (P && P.drawOn) P.drawOn(p, ctx, t); }
    if (p.hands && typeof TourGear !== 'undefined') { const G = TourGear.get(p.hands.id); if (G && G.drawOn) G.drawOn(p, ctx, t); }
    if (p.power === 2 && !p.inWater && Math.random() < 0.04) p.g.burst(p.cx + p.facing * 8, p.y + 10, 1, '#e8e8f0', 'dust');
  }
};
