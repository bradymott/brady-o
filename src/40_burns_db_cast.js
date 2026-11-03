/* ============================================================
   BRADY-O BURNS — the burner action-figure cast (figures 9–20) and the
   cast-archetype profiles, built on the character-definition API in
   40_burns_da_round.js. Our own rounded designs; outfits and gear matched
   to the user's figures (no packaging art or text).
   ============================================================ */
(() => {
  const B = BURNS_BONES, G = BURNS_GEAR, HD = BurnsRound.HD, hp = BurnsRound.headPt;
  const acc = (n, f) => { G.acc[n] = f; }, prop = (n, f) => { G.prop[n] = f; }, hat = (n, f) => { G.hat[n] = f; }, gls = (n, f) => { G.glasses[n] = f; };
  const T = (n, d) => { BURNS_NPC_TYPES[n] = d; };
  const ring = (m, y, R, r, o) => { m.push(); m.tf(0, y, 0, 0, (o && o.pitch) || 0, 0, 1, 1, (o && o.sz) || 1); m.torus(0, 0, 0, R, r, { seg: (o && o.seg) || 14, tseg: 4, sy: o && o.sy }); m.pop(); };

  /* ---------- patterns + faces ---------- */
  const P = (n, f) => BURNS_ATLAS.addPattern(n, f);
  P('tattooBlue', (x) => { x.strokeStyle = 'rgba(30,70,170,0.9)'; x.fillStyle = 'rgba(30,70,170,0.9)'; x.lineWidth = 4; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 18 + i * 30); x.bezierCurveTo(30, 0 + i * 30, 60, 40 + i * 30, 128, 14 + i * 30); x.stroke(); } for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 16 + 8, 60); x.lineTo(i * 16 + 14, 72); x.lineTo(i * 16 + 2, 72); x.closePath(); x.fill(); } });
  P('tattooSmall', (x) => { x.strokeStyle = 'rgba(20,16,24,0.85)'; x.lineWidth = 2; x.beginPath(); x.arc(40, 40, 9, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(84, 80); x.lineTo(96, 96); x.lineTo(72, 96); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(20, 100); x.quadraticCurveTo(30, 88, 40, 100); x.stroke(); });
  P('floral', (x, r) => { x.fillStyle = '#2ab0a8'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 12; i++) { const cx = r() * 128, cy = r() * 128, c = ['#ff6ab0', '#ffe24a', '#ffffff', '#ff8a3a'][i % 4]; x.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 5, 3, a, 0, TAU); x.fill(); } x.fillStyle = '#3a8a2a'; x.beginPath(); x.ellipse(cx + 10, cy + 8, 8, 3, 0.6, 0, TAU); x.fill(); x.fillStyle = '#ffe24a'; x.beginPath(); x.arc(cx, cy, 2.5, 0, TAU); x.fill(); } });
  P('pastelFloral', (x, r) => { x.fillStyle = '#e8d8f0'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 14; i++) { const cx = r() * 128, cy = r() * 128; x.fillStyle = ['#ffc8d8', '#c8e8d8', '#fff0b8', '#c8d8ff'][i % 4]; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 4.5, 2.6, a, 0, TAU); x.fill(); } } x.fillStyle = 'rgba(120,90,60,0.25)'; for (let i = 0; i < 40; i++) x.fillRect(r() * 128, r() * 128, 3 + r() * 6, 2 + r() * 4); });
  P('splatter', (x, r) => { for (let i = 0; i < 30; i++) { x.fillStyle = BURNS_NEON[i % 7]; x.globalAlpha = 0.7; const cx = r() * 128, cy = r() * 128, s = 2 + r() * 5; x.beginPath(); x.arc(cx, cy, s, 0, TAU); x.fill(); for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(cx + (r() - 0.5) * s * 4, cy + (r() - 0.5) * s * 4, s * 0.3, 0, TAU); x.fill(); } } x.globalAlpha = 1; });
  P('holo', (x) => { const g = x.createLinearGradient(0, 0, 128, 128); ['#ff9ad8', '#9adcff', '#c8a0ff', '#9affc8', '#ffe28a', '#ff9ad8'].forEach((c, i) => g.addColorStop(i / 5, c)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { x.fillStyle = (i + j) % 3 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)'; x.beginPath(); x.arc(i * 11 + (j % 2) * 5 + 4, j * 11 + 4, 3.6, 0, TAU); x.fill(); } });
  P('patchwork', (x, r) => { x.fillStyle = 'rgba(0,0,0,0)'; for (let i = 0; i < 9; i++) { x.fillStyle = ['#8a5a3a', '#5a6a3a', '#3a4a6a', '#9a3a2a', '#c8a050'][i % 5]; const px = r() * 110, py = r() * 110, w = 14 + r() * 16, h = 12 + r() * 14; x.fillRect(px, py, w, h); x.strokeStyle = 'rgba(240,230,200,0.8)'; x.setLineDash([2, 2]); x.lineWidth = 1; x.strokeRect(px + 1, py + 1, w - 2, h - 2); x.setLineDash([]); } });
  P('dpwPatch', (x) => { x.fillStyle = '#1a1a1a'; x.fillRect(14, 30, 100, 68); x.strokeStyle = '#ff8a1a'; x.lineWidth = 4; x.strokeRect(16, 32, 96, 64); x.fillStyle = '#ff8a1a'; x.font = `30px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DPW', 64, 58); x.font = `11px ${FONT_DISPLAY}`; x.fillText('DUST CREW', 64, 82); });
  const F = (n, q) => BURNS_ATLAS.addFace(n, q);
  F('dazed', (x, row, H) => { // bloodshot, half-closed, exhausted
    for (const ex of [22, 42]) { x.fillStyle = 'rgba(120,40,70,0.35)'; x.beginPath(); x.ellipse(ex, 31, 7, 4, 0, 0, TAU); x.fill(); x.fillStyle = '#fbe8e0'; x.beginPath(); x.ellipse(ex, 27, 5, 3.2, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(220,40,40,0.7)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(ex - 4, 27); x.lineTo(ex - 1, 26.5); x.moveTo(ex + 4, 27.5); x.lineTo(ex + 1, 27); x.stroke(); x.fillStyle = '#4a3020'; x.beginPath(); x.arc(ex + (row === 2 ? 2 : 0), 28, 2.2, 0, TAU); x.fill(); x.fillStyle = 'rgba(150,110,90,0.95)'; x.fillRect(ex - 6, 23.2, 12, 2.6); }
    H.stubble(0.3, false); H.nose(); H.mouth(H.mk('wavy', 'o', 'wavy', 'smile'), 32, 47, 8);
  });
  F('embarrassed', { eyes: 'normal', brows: { col: '#3a2a1a', tilt: -2, w: 5 }, mouth: 'wavy', blush: true, eyeSc: 0.9 });
  F('beatific', { eyes: 'squint', brows: { col: '#ff4fa8', tilt: 1.5, w: 6 }, mouth: 'grin', mouthW: 14, blush: true });
  F('intense', { eyes: 'normal', eyeSc: 1.1, brows: { col: '#2a1a12', tilt: -3, w: 7, thick: 3.4 }, mouth: 'flat', stubble: 0.2 });
  F('partydad', { eyes: 'normal', brows: { col: '#2a6aff', tilt: 1, w: 7, thick: 4 }, mouth: 'grin', mouthW: 12 });
  F('toothy', { eyes: 'normal', brows: { col: '#1a1410', tilt: 1.5, w: 6 }, mouth: 'grin', mouthW: 15 });
  F('mom', { eyes: 'normal', brows: { col: '#9a9aa0', w: 6, tilt: 1 }, mouth: 'grin', mouthW: 12, blush: true, wrinkles: true });
  F('serene', { eyes: 'closed', brows: { col: '#6a5a4a', w: 6 }, mouth: 'smile', blush: false });

  /* ---------- extra glasses / hats ---------- */
  const lensPos = (sd, off) => hp(sd * 0.37, 1.53, off || 0.02);
  gls('djgoggles', (m, A) => { // huge white-framed, orange-tinted
    for (const sd of [1, -1]) { const p = lensPos(sd, 0.03); m.push(); m.tf(p[0], p[1] + 0.005, p[2], sd * 0.36, Math.PI / 2, 0); m.color('#f4f4f0').shine(2); m.torus(0, 0, 0, 0.06, 0.014, { seg: 14, tseg: 4 }); m.color('#ff8a2a', 0.15).shine(3); m.roundCyl(0, -0.008, 0, 0.056, 0.014, 0.005, { seg: 14 }); m.emissive(0); m.pop(); }
    m.color('#f4f4f0').shine(2); const a = lensPos(1, 0.03), b = lensPos(-1, 0.03); m.limb(a[0] - 0.05, a[1] + 0.01, a[2], b[0] + 0.05, b[1] + 0.01, b[2], 0.008, 0.008, { seg: 4 }); m.shine(0);
  });
  gls('visorRainbow', (m, A) => { // mirrored purple-rainbow visor
    const y = BurnsRound.EYE.y + 0.006, ph = Math.acos(clamp((y - HD.cy) / HD.ry, -1, 1)), r = Math.sin(ph) * HD.rx + 0.03;
    m.push(); m.tf(0, 0, HD.cz); m.color('#a04aff', 0.2).shine(3);
    m.lathe([[r - 0.004, y - 0.04, '#5a3aff'], [r + 0.004, y - 0.012, '#c04aff'], [r + 0.004, y + 0.012, '#ff6ac8'], [r - 0.004, y + 0.036, '#ffb04a']], { seg: A.lo ? 10 : 18, theta0: -1.25, theta1: 1.25, sz: HD.rz / HD.rx });
    m.emissive(0); m.shine(0); m.pop();
  });
  gls('whiteShades', (m, A) => { G.glasses.shades(m, A); m.color('#f4f4f0').shine(2); const a = lensPos(1, 0.026), b = lensPos(-1, 0.026); m.limb(a[0] + 0.045, a[1] + 0.034, a[2] - 0.016, b[0] - 0.045, b[1] + 0.034, b[2] - 0.016, 0.01, 0.01, { seg: 5 }); m.shine(0); });
  hat('bunnyCowboy', (m, A, H) => { G.hat.cowboy(m, A, H); m.push(); m.tf(0, 0.34, HD.cz - 0.012, 0, -0.08, 0); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.07, 0.16, -0.01, 0, 0, -sd * 0.18); m.color('#f4f0e8'); m.lathe([[0.045, 0], [0.05, 0.1], [0.035, 0.2], [0, 0.25]], { seg: A.lo ? 6 : 10, sz: 0.4 }); m.color('#ff8ab8'); m.push(); m.tf(0, 0.01, 0.014); m.lathe([[0.028, 0], [0.032, 0.09], [0.02, 0.17], [0, 0.21]], { seg: A.lo ? 5 : 8, sz: 0.25 }); m.pop(); m.pop(); } m.pop(); });
  hat('crown', (m, A, H) => { // tall silver sparkly spiked headdress
    m.color('#d8dce8', 0.15).shine(3); m.push(); m.tf(0, 0.3, HD.cz, 0, -0.12); m.torus(0, 0, 0, 0.19, 0.018, { seg: A.lo ? 12 : 20, tseg: 4 }); const n = A.lo ? 7 : 13;
    for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.6, L = 0.28 - Math.abs(a) * 0.08; m.limb(Math.sin(a) * 0.19, 0, Math.cos(a) * 0.19, Math.sin(a) * 0.23, L, Math.cos(a) * 0.23, 0.026, 0.003, { seg: 5 }); }
    if (!A.lo) { m.color('#c8a0ff', 0.5); m.ball(0, 0.03, 0.2, 0.025, { seg: 8, rings: 5 }); }
    m.pop(); m.emissive(0); m.shine(0);
  });
  hat('sunBeanie', (m, A, H) => { // teal knit beanie with a spiky golden sun crown
    m.color(H.col || '#2ab0a8'); A.hairCap({ front: 0.75, side: 1.25, sideburn: 1.4, back: 1.95, vol: 0.045, uv: BURNS_ATLAS.pattern('knit') });
    m.color('#ffc030', 0.2).shine(3); m.push(); m.tf(0, 0.36, HD.cz, 0, -0.1); const n = A.lo ? 6 : 10; for (let i = 0; i < n; i++) { const a = i / n * TAU; m.limb(Math.sin(a) * 0.15, 0, Math.cos(a) * 0.16, Math.sin(a) * 0.17, 0.12, Math.cos(a) * 0.18, 0.024, 0.003, { seg: 4 }); } m.torus(0, 0, 0, 0.158, 0.014, { seg: 14, tseg: 3 }); m.pop(); m.emissive(0); m.shine(0);
  });
  hat('wrap', (m, A, H) => { // white head wrap
    m.color(H.col || '#f4f0e8'); A.hairCap({ front: 0.62, side: 1.3, sideburn: 1.45, back: 2.1, vol: 0.05, lumps: 0.008, lumpN: 5 }); if (!A.lo) { const p = hp(Math.PI, 1.0, 0.06); m.ellipsoid(p[0], p[1], p[2], 0.07, 0.05, 0.05, { seg: 8, rings: 5 }); m.limb(p[0], p[1], p[2], p[0], p[1] - 0.22, p[2] - 0.03, 0.04, 0.02, { seg: 6, sz: 0.4 }); }
  });
  hat('skullHood', (m, A, H) => { // black hood over a metal skull face-mask
    m.color(H.col || '#141416'); m.ellipsoid(HD.cx, HD.cy + 0.01, HD.cz - 0.02, HD.rx + 0.03, HD.ry + 0.035, HD.rz + 0.03, { seg: A.lo ? 10 : 18, rings: A.lo ? 6 : 10, theta0: 0.85, theta1: TAU - 0.85 });
    m.ellipsoid(HD.cx, HD.cy + 0.01, HD.cz - 0.02, HD.rx + 0.03, HD.ry + 0.035, HD.rz + 0.03, { seg: A.lo ? 6 : 10, rings: 3, phi1: 0.7 });
    m.lathe([[0.12, -0.1], [0.16, -0.02], [0.17, 0.06]], { seg: A.lo ? 10 : 16, sz: 0.85 });
    m.color('#b8b8c0').shine(3); m.ellipsoid(0, HD.cy - 0.01, HD.cz + 0.04, HD.rx * 0.82, HD.ry * 0.9, HD.rz * 0.86, { seg: A.lo ? 8 : 14, rings: A.lo ? 5 : 9, theta0: -0.95, theta1: 0.95, phi0: 0.7, phi1: 2.7 });
    m.color('#0a0a0c').shine(0); for (const sd of [1, -1]) { const p = hp(sd * 0.36, 1.55, 0.045); m.ellipsoid(p[0], p[1], p[2], 0.036, 0.03, 0.012, { seg: 8, rings: 5 }); } const n = hp(0, 1.85, 0.05); m.ellipsoid(n[0], n[1], n[2], 0.016, 0.02, 0.01, { seg: 6, rings: 4 }); if (!A.lo) for (let i = -2; i <= 2; i++) { const t = hp(i * 0.12, 2.2, 0.03); m.roundBox(t[0], t[1], t[2], 0.016, 0.03, 0.006, 0.003); }
  });

  /* ---------- extra accessories ---------- */
  acc('boa', (m, A) => { // fluffy hot-pink fur boa / stole
    const h = A.h, col = A.S.boaCol || '#ff4fa8', fu = BURNS_ATLAS.pattern('fur');
    m.color(col); m.push(); m.tf(0, 0.47 * h, -0.01, 0, -0.25, 0, 1, 1, 0.85); m.torus(0, 0, 0, 0.13 * A.w, 0.05, { seg: A.lo ? 10 : 18, tseg: A.lo ? 4 : 7 }); m.pop();
    for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.55, 0.44 * h, 0.04), b = A.torsoPt(sd * 0.4, 0.12 * h, 0.06), c = [b[0] + sd * 0.02, -0.12, b[2] - 0.02]; m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.05, 0.045, { seg: A.lo ? 6 : 10, uv: fu }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.045, 0.03, { seg: A.lo ? 6 : 10, uv: fu }); }
  });
  acc('furCuffs', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.FARM_L : B.FARM_R); m.color(A.S.boaCol || '#ff4fa8'); m.lathe([[0.058, -0.21], [0.075, -0.17], [0.075, -0.11], [0.058, -0.08]], { seg: A.lo ? 8 : 12, uv: BURNS_ATLAS.pattern('fur'), rMod: th => 1 + 0.07 * Math.sin(th * 7) }); } });
  acc('heartPendants', (m, A) => { const h = A.h, hpts = []; for (let i = 0; i < 14; i++) { const t = i / 14 * TAU; hpts.push([16 * Math.pow(Math.sin(t), 3) * 0.0028, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.0028]); }
    for (const [th, y] of [[0, 0.33], [0.3, 0.37], [-0.3, 0.36]]) { const p = A.torsoPt(th, y * h, 0.012); m.color('#ff4fa8', 0.3).shine(3); m.push(); m.tf(p[0], p[1], p[2], th); m.extrude(hpts.slice().reverse(), 0.012, { convex: false }); m.pop(); }
    m.emissive(0); G.acc.beads(m, A); m.shine(0);
  });
  acc('fairyWings', (m, A) => { // huge iridescent pink + teal translucent feather wings
    const h = A.h; for (const sd of [1, -1]) for (let i = 0; i < (A.lo ? 3 : 6); i++) {
      const a = 0.15 + i * 0.32, L = 0.62 - Math.abs(i - 2) * 0.06;
      m.color(i % 2 ? '#7af0e0' : '#ff9ad8', 0.35).shine(3);
      m.push(); m.tf(sd * 0.08, 0.38 * h, -0.15, sd * 0.35, 0, 0); m.ellipsoid(sd * Math.sin(a) * L * 0.5, Math.cos(a) * L * 0.5, 0, 0.07, L * 0.5, 0.008, { seg: A.lo ? 6 : 10, rings: 4, colFn: (x, y) => y > 0 ? (i % 2 ? '#c8a0ff' : '#ffe0f4') : null }); m.pop();
    }
    m.emissive(0); m.shine(0);
  });
  acc('legwarmers', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.SHIN_L : B.SHIN_R); m.color(A.S.warmerCol || '#d8dce8', 0.08).shine(3); m.lathe([[0.072, -0.39], [0.078, -0.25], [0.08, -0.05], [0.075, 0.03]], { seg: A.lo ? 8 : 12, uv: BURNS_ATLAS.pattern(A.S.warmerPat || 'sequin'), rMod: (th, t) => 1 + 0.05 * Math.sin(t * 30) }); if (A.S.warmerHigh) { m.setBone(sd > 0 ? B.THIGH_L : B.THIGH_R); m.lathe([[0.084, -0.42], [0.09, -0.3], [0.088, -0.2], [0.08, -0.18]], { seg: A.lo ? 8 : 12, uv: BURNS_ATLAS.pattern(A.S.warmerPat || 'sequin') }); } } m.emissive(0); m.shine(0); });
  acc('fannypack', (m, A) => { m.setBone(B.HIPS); m.color('#c8a0ff', 0.15).shine(3); m.push(); m.tf(0.04, -0.01, 0.17 * A.w * 0.74 + 0.04, 0.15); m.ellipsoid(0, 0, 0, 0.1, 0.055, 0.04, { seg: A.lo ? 8 : 12, rings: 6, uvFn: () => { const R = BURNS_ATLAS.pattern('holo'); return [(R.u0 + R.u1) / 2, (R.v0 + R.v1) / 2]; } }); m.pop(); m.color('#141418'); m.push(); m.tf(0, 0.0, 0, 0, 0, 0, 1, 1, 0.78); m.torus(0, 0, 0, 0.18 * A.w, 0.01, { seg: 14, tseg: 3 }); m.pop(); m.emissive(0); m.shine(0); });
  acc('ledPendants', (m, A) => { const h = A.h; for (const [th, y, c] of [[0, 0.36, '#ff4fd8'], [0.25, 0.39, '#38f2ff'], [-0.25, 0.39, '#7aff5a']]) { const p = A.torsoPt(th, y * h, 0.02); m.color(c, 1); m.ball(p[0], p[1], p[2], 0.022, { seg: 6, rings: 4 }); } m.emissive(0); });
  acc('lanyard', (m, A) => { const h = A.h; m.color('#2a6aff'); const a = A.torsoPt(0.5, 0.48 * h, 0.01), c = A.torsoPt(0, 0.3 * h, 0.02), b = A.torsoPt(-0.5, 0.48 * h, 0.01); m.limb(a[0], a[1], a[2], c[0], c[1], c[2], 0.006, 0.006, { seg: 3 }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.006, 0.006, { seg: 3 }); m.color('#f4f4f0'); m.push(); m.tf(c[0], c[1] - 0.05, c[2] + 0.004); m.roundBox(0, 0, 0, 0.06, 0.085, 0.006, 0.003); m.pop(); });
  acc('cameras2', (m, A) => { const h = A.h; for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.7, 0.48 * h, 0.01), c = A.torsoPt(sd * 0.25, (sd > 0 ? 0.22 : 0.28) * h, 0.06); m.color('#1a1a1e'); m.limb(a[0], a[1], a[2], c[0], c[1] + 0.03, c[2], 0.006, 0.006, { seg: 3 }); m.push(); m.tf(c[0], c[1], c[2] + 0.02, sd * 0.25); m.roundBox(0, 0, 0, 0.11, 0.07, 0.045, 0.012); m.color('#c8c8d0').shine(3); m.push(); m.tf(0, 0, 0.03, 0, Math.PI / 2); m.roundCyl(0, 0, 0, 0.024, 0.03, 0.005, { seg: 10 }); m.pop(); m.shine(0); m.pop(); } });
  acc('headphones', (m, A) => { m.setBone(B.HEAD); m.color('#1a1a1e').shine(2); m.push(); m.tf(0, HD.cy, HD.cz - 0.005, 0, 0, Math.PI / 2); m.torus(0, 0, 0, HD.ry + 0.035, 0.014, { seg: 16, tseg: 4, sy: 1.5 }); m.pop(); for (const sd of [1, -1]) { const p = hp(sd * Math.PI / 2, 1.62, 0.03); m.push(); m.tf(p[0], p[1], p[2], 0, 0, Math.PI / 2); m.color('#1a1a1e'); m.roundCyl(0, -0.025, 0, 0.065, 0.05, 0.02, { seg: 14 }); m.color('#ff4fd8', 0.6); m.roundCyl(0, -0.03, 0, 0.068, 0.012, 0.004, { seg: 14 }); m.emissive(0); m.pop(); } m.shine(0); });
  acc('spikedShoulders', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.UARM_L : B.UARM_R); m.color(A.S.padCol || '#141416').shine(1); m.ellipsoid(0, -0.01, 0, 0.09, 0.07, 0.088, { seg: A.lo ? 8 : 12, rings: 5, phi1: Math.PI / 2 }); if (!A.lo) { m.color('#d8d8e0').shine(3); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const x = Math.sin(a) * 0.05, z = Math.cos(a) * 0.05; m.limb(x, 0.02, z, x * 1.3, 0.085, z * 1.3, 0.012, 0.001, { seg: 4 }); } m.limb(0, 0.05, 0, 0, 0.12, 0, 0.014, 0.001, { seg: 4 }); } } m.shine(0); });
  acc('metalKneepads', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.SHIN_L : B.SHIN_R); m.color('#8a8a92').shine(3); m.push(); m.tf(0, -0.02, 0.064, 0, -0.15); m.ellipsoid(0, 0, 0, 0.065, 0.075, 0.03, { seg: A.lo ? 8 : 12, rings: 6, phi1: Math.PI / 2 + 0.3 }); m.pop(); m.shine(0); } });
  acc('tatters', (m, A) => { // long tattered coat tails
    m.setBone(B.HIPS); m.color(A.S.coat ? A.S.coat.col : '#141416');
    for (let i = 0; i < (A.lo ? 3 : 6); i++) { const th = Math.PI + (i - 2.5) * 0.32, x = Math.sin(th) * 0.24 * A.w, z = Math.cos(th) * 0.2; m.limb(x, -0.5, z, x * 1.05, -0.72 - (i % 3) * 0.05, z * 1.1, 0.035, 0.008, { seg: 4, sz: 0.3 }); }
  });
  acc('skullCharm', () => {});
  acc('suspenders', (m, A) => { const h = A.h, col = A.S.suspCol || '#b08a5a'; m.color(col); for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.32, 0.03, 0.026), b = A.torsoPt(sd * 0.35, 0.47 * h, 0.022), c = A.torsoPt(Math.PI - sd * 0.25, 0.03, 0.026), d = A.torsoPt(Math.PI, 0.38 * h, 0.03); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.014, 0.014, { seg: 4, sz: 0.4 }); m.limb(b[0], b[1], b[2], d[0], d[1], d[2], 0.014, 0.014, { seg: 4, sz: 0.4 }); m.limb(d[0], d[1], d[2], c[0], c[1], c[2], 0.014, 0.014, { seg: 4, sz: 0.4 }); if (A.S.carabiners && !A.lo) { m.color('#c8c8d0').shine(3); m.push(); m.tf(a[0], a[1] + 0.05, a[2] + 0.01); m.torus(0, 0, 0, 0.016, 0.004, { seg: 8, tseg: 3 }); m.pop(); m.shine(0); m.color(col); } } });
  acc('chestPockets', (m, A) => { if (A.lo) return; const h = A.h; for (const sd of [1, -1]) { const p = A.torsoPt(sd * 0.38, 0.33 * h, 0.006); m.color(shade(A.C.top, -0.08)); m.push(); m.tf(p[0], p[1], p[2], sd * 0.38); m.roundBox(0, 0, 0, 0.08, 0.085, 0.012, 0.005); m.roundBox(0, 0.04, 0.004, 0.084, 0.022, 0.014, 0.005); m.pop(); } });
  acc('orangePouches', (m, A) => { m.setBone(B.HIPS); const w = A.w; m.color('#ff8a1a'); for (const th of [0.95, -0.95]) { const x = Math.sin(th) * 0.19 * w, z = Math.cos(th) * 0.19 * w * 0.76; m.push(); m.tf(x, -0.01, z, th); m.roundBox(0, 0, 0, 0.06, 0.09, 0.04, 0.012); m.pop(); } });
  acc('utilVest', (m, A) => { const h = A.h, col = A.S.utilVestCol || '#7a5a3a'; const vprof = A.torso.filter(p => p[1] > 0.0 && p[1] < 0.47 * h).map(p => [p[0] + 0.022, p[1]]); m.color(col); m.lathe(vprof, { seg: A.lo ? 10 : 18, sz: A.TZ + 0.02, theta0: 0.45, theta1: TAU - 0.45 }); m.color(shade(col, -0.35)); m.lathe(vprof.map(p => [p[0] - 0.008, p[1]]), { seg: A.lo ? 10 : 18, sz: A.TZ + 0.02, theta0: 0.45, theta1: TAU - 0.45, flip: true }); if (!A.lo) { m.color(shade(col, -0.12)); for (const sd of [1, -1]) for (let k = 0; k < 2; k++) { const p = A.torsoPt(sd * 0.7, (0.14 + k * 0.13) * h, 0.04); m.push(); m.tf(p[0], p[1], p[2], sd * 0.7); m.roundBox(0, 0, 0, 0.07, 0.07, 0.03, 0.01); m.pop(); } } });
  acc('studdedVest', (m, A) => { // black studded denim vest with patches
    const h = A.h, vprof = A.torso.filter(p => p[1] > 0.0 && p[1] < 0.47 * h).map(p => [p[0] + 0.022, p[1]]);
    m.color('#1a1a22'); m.lathe(vprof, { seg: A.lo ? 10 : 18, sz: A.TZ + 0.02, theta0: 0.4, theta1: TAU - 0.4, uv: BURNS_ATLAS.pattern('denim') }); m.color('#0e0e12'); m.lathe(vprof.map(p => [p[0] - 0.008, p[1]]), { seg: A.lo ? 10 : 18, sz: A.TZ + 0.02, theta0: 0.4, theta1: TAU - 0.4, flip: true });
    if (!A.lo) {
      const pb = A.torsoPt(Math.PI, 0.27 * h, 0.03); m.color('#ffffff'); m.push(); m.tf(pb[0], pb[1], pb[2], Math.PI); m.decal(0, 0, 0, 0.2, 0.2, BURNS_ATLAS.pattern('dpwPatch')); m.pop();
      m.color('#d8d8e0').shine(3); for (const sd of [1, -1]) for (let k = 0; k < 4; k++) { const p = A.torsoPt(sd * 0.5, (0.12 + k * 0.09) * h, 0.03); m.ball(p[0], p[1], p[2], 0.008, { seg: 5, rings: 3 }); } m.shine(0);
      m.color('#f4f4f0'); const sk = A.torsoPt(0.65, 0.34 * h, 0.032); m.ball(sk[0], sk[1], sk[2], 0.026, { seg: 8, rings: 5 }); m.color('#141416'); m.ball(sk[0] - 0.008, sk[1] + 0.004, sk[2] + 0.022, 0.006, { seg: 4, rings: 3 }); m.ball(sk[0] + 0.008, sk[1] + 0.004, sk[2] + 0.022, 0.006, { seg: 4, rings: 3 });
    }
  });
  acc('piercings', (m, A) => { if (A.lo) return; m.setBone(B.HEAD); m.color('#d8d8e0').shine(3); for (const sd of [1, -1]) { const p = hp(sd * Math.PI / 2, 1.78, 0.012); m.push(); m.tf(p[0], p[1], p[2], 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.012, 0.003, { seg: 8, tseg: 3 }); m.pop(); } const n = hp(0.12, 1.6, 0.03); m.ball(n[0], n[1], n[2], 0.005, { seg: 4, rings: 3 }); const l = hp(-0.15, 2.15, 0.01); m.ball(l[0], l[1], l[2], 0.005, { seg: 4, rings: 3 }); m.shine(0); });
  acc('scalpTattoo', (m, A) => { if (A.lo) return; m.setBone(B.HEAD); m.color('#2a3a4a'); for (const sd of [1, -1]) for (let i = 0; i < 3; i++) { const p = hp(sd * (1.25 + i * 0.25), 0.9 + i * 0.12, 0.004); m.ellipsoid(p[0], p[1], p[2], 0.006, 0.03, 0.016, { seg: 5, rings: 3 }); } });
  acc('paintApron', (m, A) => { // paint-splattered canvas tool belt + apron stuffed with brushes
    m.setBone(B.HIPS); const w = A.w, sp = BURNS_ATLAS.pattern('splatter');
    m.color('#c8b088'); m.push(); m.tf(0, 0.04, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.178 * w, 0.024, { seg: A.lo ? 10 : 16, tseg: 4 }); m.pop();
    m.push(); m.tf(0, -0.12, 0.17 * w * 0.74 + 0.02); m.roundBox(0, 0, 0, 0.26 * w, 0.26, 0.02, 0.01, { uv: sp }); m.pop();
    if (!A.lo) { const cols = ['#c83a2a', '#3a6aff', '#ffd21a', '#2aa04a']; for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.045; m.color('#8a6a3a'); m.limb(x, -0.02, 0.17 * w * 0.74 + 0.04, x + 0.005, 0.07, 0.17 * w * 0.74 + 0.045, 0.006, 0.006, { seg: 4 }); m.color(cols[i]); m.ball(x + 0.005, 0.08, 0.17 * w * 0.74 + 0.045, 0.01, { seg: 5, rings: 3 }); } }
  });
  acc('lanternPoles', (m, A) => { // two tall poles resting on the shoulders, glowing lanterns hanging behind (CHEST bone)
    const h = A.h;
    for (const sd of [1, -1]) {
      const a = [sd * 0.17, 0.12 * h, 0.22], b = [sd * 0.28, 1.5, -0.42];
      m.color('#8a6a3a'); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.016, 0.013, { seg: 5 });
      const lx = b[0] + sd * 0.02, ly = b[1] - 0.22, lz = b[2] - 0.05;
      m.color('#2a2a2e').limb(b[0], b[1], b[2], lx, ly + 0.08, lz, 0.005, 0.005, { seg: 3 });
      m.push(); m.tf(lx, ly, lz); m.color('#ffd890', 1); m.lathe([[0, -0.08], [0.05, -0.065], [0.058, 0.0], [0.048, 0.06], [0, 0.07]], { seg: A.lo ? 6 : 10 }); m.emissive(0); m.color('#2a2a2e').shine(2); m.lathe([[0.055, 0.06], [0.03, 0.09], [0, 0.1]], { seg: 8 }); m.lathe([[0, -0.1], [0.045, -0.085], [0.05, -0.07]], { seg: 8 }); m.shine(0); m.pop();
      A.wicks.push({ bone: B.CHEST, p: [lx, ly, lz], lantern: true });
    }
  });
  acc('trashcanHelmet', (m, A) => { // dented trash can helmet with LED strips and bottle-cap eyes (homemade)
    m.setBone(B.HEAD); const r0 = 0.235;
    m.color('#8a8e94').shine(2); m.lathe([[r0 - 0.02, -0.02], [r0, 0.02], [r0 + 0.01, 0.3], [r0 + 0.025, 0.36], [r0 + 0.03, 0.38], [r0 - 0.03, 0.42], [0.04, 0.445], [0, 0.45]], { seg: A.lo ? 10 : 18, rMod: (th, t) => 1 - 0.05 * Math.pow(Math.max(0, Math.cos(th * 2 + 1)), 6) * Math.sin(t * Math.PI) });
    if (!A.lo) { m.color('#6a6e74'); for (let i = 0; i < 5; i++) { const y = 0.06 + i * 0.06; m.push(); m.tf(0, y, 0); m.torus(0, 0, 0, r0 + 0.004 + i * 0.002, 0.006, { seg: 18, tseg: 3 }); m.pop(); } }
    m.shine(0); for (const [y, c] of [[0.1, '#ff3b5c'], [0.3, '#38f2ff']]) { m.color(c, 1); m.push(); m.tf(0, y, 0); m.lathe([[r0 + 0.012, -0.008], [r0 + 0.014, 0.008]], { seg: A.lo ? 10 : 18, theta0: -1.0, theta1: 1.0 }); m.pop(); }
    for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.075, 0.2, r0 * 0.97, sd * 0.3, Math.PI / 2); m.color('#d82a2a').shine(3); m.roundCyl(0, -0.006, 0, 0.035, 0.012, 0.004, { seg: 12 }); m.color('#fff8d0', 0.9); m.ball(0, 0.008, 0, 0.012, { seg: 6, rings: 4 }); m.pop(); }
    m.emissive(0); m.shine(0); if (!A.lo) { m.color('#3a3a40'); m.limb(-0.08, 0.44, 0, 0.08, 0.44, 0, 0.012, 0.012, { seg: 4 }); }
  });
  acc('colanderHelmet', (m, A) => { // colander + cardboard + flickering EL-wire visor (homemade)
    m.setBone(B.HEAD);
    m.color('#c8ccd4').shine(3); m.ellipsoid(HD.cx, HD.cy + 0.03, HD.cz, HD.rx + 0.035, HD.ry + 0.02, HD.rz + 0.035, { phi1: 1.45, seg: A.lo ? 10 : 18, rings: A.lo ? 4 : 7 });
    if (!A.lo) { m.color('#2a2a2e'); for (let i = 0; i < 18; i++) { const p = hp((i % 6 - 2.5) * 0.45, 0.35 + Math.floor(i / 6) * 0.35, 0.034); m.ball(p[0], p[1], p[2], 0.011, { seg: 4, rings: 3 }); } m.color('#c8ccd4'); for (const sd of [1, -1]) { const p = hp(sd * Math.PI / 2, 1.0, 0.05); m.push(); m.tf(p[0], p[1], p[2], 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.03, 0.008, { seg: 8, tseg: 3 }); m.pop(); } }
    m.shine(0); m.color('#b89a6a'); m.ellipsoid(HD.cx, HD.cy - 0.01, HD.cz + 0.005, HD.rx + 0.022, HD.ry, HD.rz + 0.022, { phi0: 1.4, phi1: 2.6, seg: A.lo ? 10 : 16, rings: A.lo ? 3 : 5, uvFn: () => { const R = BURNS_ATLAS.pattern('canvas'); return [(R.u0 + R.u1) / 2, (R.v0 + R.v1) / 2]; } });
    m.color('#7aff5a', 1); const y = BurnsRound.EYE.y + 0.01, ph = Math.acos((y - HD.cy) / HD.ry), r = Math.sin(ph) * HD.rx + 0.03; m.push(); m.tf(0, 0, HD.cz); m.lathe([[r - 0.004, y - 0.022], [r + 0.004, y], [r - 0.004, y + 0.022]], { seg: A.lo ? 8 : 14, theta0: -1.0, theta1: 1.0, sz: HD.rz / HD.rx }); m.pop(); m.emissive(0);
    A.wicks.push({ bone: B.HEAD, p: [0, y, HD.cz + HD.rz + 0.03], elwire: true });
  });
  acc('botHarness', (m, A) => { const h = A.h; G.acc.straps(m, A); if (A.lo) return; m.color('#5a4a3a'); for (const sd of [1, -1]) { const p = A.torsoPt(sd * 0.75, 0.2 * h, 0.05); m.push(); m.tf(p[0], p[1], p[2], sd * 0.75); m.roundBox(0, 0, 0, 0.07, 0.08, 0.04, 0.012); m.pop(); } m.color('#3a3a40').shine(2); const a = A.torsoPt(-0.4, 0.44 * h, 0.05), b = A.torsoPt(-0.7, 0.2 * h, 0.07), c = A.torsoPt(-1.2, 0.06 * h, 0.06); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.014, 0.014, { seg: 6 }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.014, 0.014, { seg: 6 }); m.shine(0); });
  acc('robotGloves', (m, A) => { if (A.lo) return; for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.FARM_L : B.FARM_R); m.color('#5a5e66').shine(3); m.roundBox(0, -0.27, 0.004, 0.07, 0.05, 0.1, 0.014); for (let i = 0; i < 3; i++) m.ball(0, -0.3, -0.03 + i * 0.03, 0.012, { seg: 5, rings: 3 }); m.shine(0); } });
  acc('clipBottles', (m, A) => { m.setBone(B.HIPS); m.color('#9adcff', 0.12).shine(3); for (const sd of [1, -1]) { const th = sd * 1.9, x = Math.sin(th) * 0.2 * A.w, z = Math.cos(th) * 0.16; m.push(); m.tf(x, -0.08, z); m.lathe([[0, 0], [0.032, 0], [0.034, 0.14], [0.018, 0.17], [0, 0.17]], { seg: A.lo ? 6 : 10 }); m.pop(); } m.emissive(0); m.shine(0); });
  acc('crystal', (m, A) => { const h = A.h; G.acc.beads(m, A); const p = A.torsoPt(0, 0.29 * h, 0.06); m.color('#c8a0ff', 0.45).shine(3); m.push(); m.tf(p[0], p[1], p[2]); m.lathe([[0, -0.07], [0.045, -0.02], [0.04, 0.04], [0, 0.08]], { seg: 6 }); m.pop(); m.emissive(0); m.shine(0); });
  acc('respirator', (m, A) => { m.setBone(B.HEAD); m.color('#3a3a40').shine(1); const p = hp(0, 2.05, 0.02); m.ellipsoid(p[0], p[1], p[2], 0.1, 0.075, 0.06, { seg: A.lo ? 8 : 12, rings: 6 }); m.color('#ff8a1a'); for (const sd of [1, -1]) { m.push(); m.tf(p[0] + sd * 0.085, p[1] - 0.02, p[2] + 0.02, sd * 0.6, Math.PI / 2); m.roundCyl(0, -0.02, 0, 0.04, 0.035, 0.01, { seg: 12 }); m.pop(); } m.color('#1a1a1e'); m.push(); m.tf(0, HD.cy - 0.05, HD.cz - 0.02, 0, 0.3); m.torus(0, 0, 0, 0.2, 0.008, { seg: 16, tseg: 3 }); m.pop(); m.shine(0); });
  acc('dustMask', (m, A) => { m.setBone(B.HEAD); m.color(A.S.maskCol || '#f4f0e8').shine(2); m.ellipsoid(HD.cx, HD.cy, HD.cz, HD.rx + 0.008, HD.ry + 0.006, HD.rz + 0.012, { theta0: -1.45, theta1: 1.45, phi0: 1.78, phi1: 2.55, seg: A.lo ? 8 : 14, rings: 4 }); m.shine(0); });
  acc('chestRadio', (m, A) => { const p = A.torsoPt(-0.4, 0.38 * A.h, 0.035); m.color('#1a1a1e').shine(1); m.push(); m.tf(p[0], p[1], p[2], -0.4); m.roundBox(0, 0, 0, 0.065, 0.12, 0.04, 0.012); m.limb(0.02, 0.05, 0, 0.02, 0.2, 0, 0.006, 0.004, { seg: 4 }); m.pop(); m.shine(0); });
  acc('reflectiveTape', (m, A) => { if (A.lo) return; m.color('#e8eef0', 0.25).shine(3); for (const [b, ys] of [[B.UARM_L, [-0.12]], [B.UARM_R, [-0.12]], [B.FARM_L, [-0.1]], [B.FARM_R, [-0.1]], [B.SHIN_L, [-0.12, -0.24]], [B.SHIN_R, [-0.12, -0.24]], [B.THIGH_L, [-0.2]], [B.THIGH_R, [-0.2]]]) { m.setBone(b); for (const y of ys) { m.push(); m.tf(0, y, 0); m.torus(0, 0, 0, b === B.THIGH_L || b === B.THIGH_R ? 0.088 : b === B.SHIN_L || b === B.SHIN_R ? 0.074 : 0.062, 0.012, { seg: 12, tseg: 3, sy: 1.6 }); m.pop(); } } m.emissive(0); m.shine(0); });
  acc('wristband', (m, A) => { m.setBone(B.FARM_L); m.color('#2a6aff'); m.push(); m.tf(0, -0.19, 0); m.torus(0, 0, 0, 0.05, 0.014, { seg: 10, tseg: 4, sy: 1.5 }); m.pop(); });

  /* ---------- extra held props ---------- */
  prop('skullstaff', (m, A) => { m.color('#4a3a2a'); m.limb(0, -0.6, 0.05, 0, 0.9, 0.05, 0.016, 0.014, { seg: 6 }); m.color('#e8e4d8').shine(2); m.ball(0, 0.98, 0.05, 0.07, { seg: A.lo ? 8 : 12, rings: A.lo ? 5 : 8 }); m.roundBox(0, 0.92, 0.07, 0.07, 0.04, 0.05, 0.015); m.color('#141416'); for (const sd of [1, -1]) m.ball(sd * 0.025, 0.99, 0.11, 0.016, { seg: 5, rings: 3 }); m.color('#8a8a92').shine(3); if (!A.lo) for (let i = 0; i < 5; i++) m.limb(0.02, 0.85 - i * 0.05, 0.08, 0.025, 0.82 - i * 0.05, 0.085, 0.008, 0.008, { seg: 3 }); m.shine(0); });
  prop('foambat', (m, A) => { m.color('#2a2a30'); m.limb(0, -0.1, 0.05, 0, 0.15, 0.05, 0.02, 0.02, { seg: 6 }); m.color('#ff8a1a'); m.limb(0, 0.15, 0.05, 0, 0.75, 0.05, 0.05, 0.065, { seg: A.lo ? 6 : 10 }); });
  prop('canteen', (m, A) => { m.color('#7a7e70').shine(2); m.push(); m.tf(0, -0.02, 0.06, 0, Math.PI / 2); m.roundCyl(0, -0.025, 0, 0.07, 0.05, 0.02, { seg: 12 }); m.pop(); m.shine(0); });
  prop('hammer', (m, A) => { m.color('#ffd21a'); m.limb(0, -0.15, 0.05, 0, 0.42, 0.05, 0.02, 0.018, { seg: 6 }); m.color('#3a3a40').shine(2); m.roundBox(0, 0.46, 0.05, 0.08, 0.08, 0.2, 0.015); m.shine(0); });
  prop('rebar', (m, A) => { m.color('#8a4a2a'); m.limb(0, -0.3, 0.05, 0, 0.5, 0.05, 0.012, 0.012, { seg: 5 }); });
  prop('brush', (m, A) => { m.color('#c89a5a'); m.limb(0, -0.05, 0.05, 0, 0.22, 0.05, 0.008, 0.01, { seg: 5 }); m.color('#3a6aff'); m.ellipsoid(0, 0.25, 0.05, 0.014, 0.03, 0.01, { seg: 6, rings: 4 }); });
  prop('palette', (m, A) => { m.color('#c8a070'); m.push(); m.tf(0, 0.0, 0.08, 0, Math.PI / 2 - 0.3); m.ellipsoid(0, 0, 0, 0.13, 0.008, 0.1, { seg: 12, rings: 4 }); m.pop(); if (!A.lo) BURNS_NEON.slice(0, 5).forEach((c, i) => { const a = i / 5 * Math.PI + 0.3; m.color(c); m.ball(Math.cos(a) * 0.08, 0.006 + Math.sin(a) * 0.002, 0.08 + Math.sin(a) * 0.05, 0.016, { seg: 5, rings: 3 }); }); });
  prop('ledwand', (m, A) => { m.color('#c8c8d0').shine(3); m.limb(0, -0.08, 0.05, 0, 0.1, 0.05, 0.012, 0.012, { seg: 5 }); m.color('#38f2ff', 1); m.limb(0, 0.1, 0.05, 0, 0.42, 0.05, 0.016, 0.012, { seg: 6 }); m.color('#ff4fd8', 1); m.ball(0, 0.44, 0.05, 0.03, { seg: 8, rings: 5 }); m.emissive(0); m.shine(0); });
  prop('glitterbottle', (m, A) => { m.color('#ff9ad8', 0.2).shine(3); m.push(); m.tf(0, -0.1, 0.045); m.lathe([[0, 0], [0.038, 0], [0.04, 0.15], [0.02, 0.18], [0, 0.18]], { seg: 10, uv: BURNS_ATLAS.pattern('sequin') }); m.pop(); m.emissive(0); m.shine(0); });
  prop('map', (m, A) => { m.color('#e8d8b0'); m.push(); m.tf(0, 0.0, 0.07, 0.3, 0.2, 0.4); m.ellipsoid(0, 0, 0, 0.09, 0.07, 0.025, { seg: 8, rings: 5, colFn: (x, y) => y > 0.02 ? '#d8c890' : null }); m.pop(); });
  prop('can', (m, A) => { m.color('#c8202a').shine(3); m.push(); m.tf(0, -0.06, 0.05); m.roundCyl(0, 0, 0, 0.034, 0.12, 0.006, { seg: 10 }); m.pop(); m.shine(0); });
  prop('energydrink', (m, A) => { m.color('#2aff6a').shine(3); m.push(); m.tf(0, -0.06, 0.05); m.roundCyl(0, 0, 0, 0.03, 0.15, 0.005, { seg: 10 }); m.color('#1a1a1e'); m.lathe([[0.0305, 0.05], [0.0305, 0.1]], { seg: 10 }); m.pop(); m.shine(0); });
  prop('mic', (m, A) => { m.color('#1a1a1e').shine(2); m.limb(0, -0.06, 0.05, 0, 0.12, 0.05, 0.016, 0.02, { seg: 6 }); m.color('#c8c8d0').shine(3); m.ball(0, 0.15, 0.05, 0.035, { seg: 8, rings: 6 }); m.shine(0); });
  prop('wizardstaff', (m, A) => { m.color('#8a5a2a'); m.limb(0, -0.6, 0.05, 0.02, 0.85, 0.05, 0.018, 0.015, { seg: 6 }); m.color('#c8a0ff', 0.4).shine(3); m.lathe([[0, 0.85], [0.04, 0.9], [0.035, 0.98], [0, 1.03]], { seg: 6 }); m.emissive(0); m.shine(0); if (!A.lo) { BURNS_NEON.slice(0, 4).forEach((c, i) => { m.color(c); m.limb(0.02, 0.8 - i * 0.04, 0.05, 0.08 + i * 0.01, 0.62 - i * 0.05, 0.06, 0.01, 0.004, { seg: 3, sz: 0.3 }); }); m.color('#ffd21a').shine(3); m.ball(0.03, 0.7, 0.07, 0.02, { seg: 6, rings: 4 }); m.shine(0); } });
  prop('cocktail', (m, A) => { m.color('#e8f4ff', 0.12).shine(3); m.push(); m.tf(0, -0.02, 0.05); m.lathe([[0.025, 0], [0.025, 0.004], [0.006, 0.01], [0.006, 0.08], [0.06, 0.13], [0.0, 0.13]], { seg: 10 }); m.color('#ff8a2a', 0.2); m.lathe([[0.05, 0.12], [0.0, 0.12]], { seg: 10 }); m.pop(); m.emissive(0); m.shine(0); });

  /* ================= the cast (figures 9–20 + archetype profiles) ================= */
  T('deathguild', { anim: 'idle', lines: ['Two burners enter. Two burners hug.', 'Foam only. We have standards.', 'Welcome to the Dome, little bun.'],
    spec(s, r, o) {
      s.face = 'stern'; s.hood = true; s.hat = { kind: 'skullHood', col: '#141416' };
      s.top = { kind: 'long', col: '#16161a' }; s.coat = { kind: 'duster', col: '#121214', trim: '#2a2a30', tattered: true };
      s.bottom = { kind: 'cargo', col: '#141416' }; s.shoes = { kind: 'combat', col: '#0e0e10', sole: '#08080a', laces: true };
      s.acc = ['spikedShoulders', 'straps', 'utilityBelt', 'chain', 'metalKneepads', 'tatters']; s.strapCol = '#1a1a1e'; s.padCol = '#141416';
      s.prop = o.prop !== undefined ? o.prop : r.pick(['skullstaff', 'foambat', 'canteen']); s.body.w = 1.05 + r() * 0.1;
    } });
  T('ranger', { anim: 'idle', lines: ['Per the principles, your bike light is 5 lumens too dim.', 'Let me explain directions. This may take a while.', 'I\'m not a cop. I\'m a ranger. Very different. Write that down.'],
    spec(s, r, o) {
      const chill = o.variant === 'chill';
      s.face = chill ? 'friendly' : 'intense'; s.hair = { style: 'short', col: '#2a1a12' }; s.beard = { col: '#2a1a12', trim: true, len: 0.02 };
      s.hat = { kind: 'ranger', col: '#e0d0a8' }; s.glasses = chill ? 'shades' : null; s.bandanaCol = '#8aa888';
      s.top = { kind: 'button', col: '#ece0c0' }; s.bottom = { kind: 'shorts', col: '#b8a070', cargo: true };
      s.shoes = { kind: 'workboots', col: '#6a4a2a', sole: '#3a2a1a', laces: true };
      s.acc = ['bandana', 'chestPockets', 'suspenders', 'orangePouches', 'watch']; s.suspCol = '#b08a5a'; s.carabiners = true;
      s.prop = o.prop !== undefined ? o.prop : (chill ? null : 'clipboard');
    } });
  T('burney', { anim: 'photo', lines: ['Hold that pose! One more! ONE MORE!', 'Smile, bun man!', 'I\'ve got 14,000 photos of this dust storm.'],
    spec(s, r) {
      s.face = 'partydad'; s.hair = { style: 'buzz', col: '#6a5a4a' }; s.beard = { col: '#2a6aff', trim: true, len: 0.0, mustacheOnly: true };
      s.hat = { kind: 'bunnyCowboy', col: '#e0c890' };
      s.top = { kind: 'button', col: '#2ab0a8', pattern: 'floral', open: true, under: '#f4f0e8' }; s.tattoos = 'blue';
      s.bottom = { kind: 'shorts', col: '#b8a070', cargo: true }; s.shoes = { kind: 'workboots', col: '#2a2420', laces: true };
      s.acc = ['utilVest', 'goldChain', 'beads', 'watch', 'wristband']; s.utilVestCol = '#7a5a3a'; s.prop = 'camera'; s.body.w = 1.12;
    } });
  T('playaartist', { anim: 'idle', lines: ['It\'s a wire whale. Obviously.', 'I need more paint. And more wire. And sleep.', 'Art isn\'t finished. It\'s abandoned. In the deep playa.'],
    spec(s, r) {
      s.face = 'lashes'; s.body.fem = true; s.body.w = 0.9; s.hair = { style: 'wavy', col: '#6a4428', hi: '#a8784a' };
      s.hat = { kind: 'sunhat', col: '#e0c890' }; s.tattoos = 'small';
      s.top = { kind: 'offshoulder', col: '#c8c8cc', pattern: 'knit' }; s.bottom = { kind: 'pants', col: '#3a3a40', baggy: true, pattern: 'splatter', rolled: true };
      s.shoes = { kind: 'workboots', col: '#7a5a3a', laces: true };
      s.acc = ['suspenders', 'paintApron', 'beads', 'kandi']; s.suspCol = '#b89a6a'; s.prop = r.pick(['brush', 'palette']);
    } });
  T('dpw', { anim: 'idle', lines: ['Move it, sparkle pony.', 'This is a work zone. Everything is a work zone.', 'I haven\'t slept since the fence went up.'],
    spec(s, r) {
      s.face = 'cop'; s.hair = { style: 'mohawk', col: '#121214' }; s.mohawkCol = '#121214'; s.tattoos = true;
      s.top = { kind: 'tank', col: '#2a2a30' }; s.gloves = '#141416';
      s.bottom = { kind: 'jeans', col: '#3a5a8a', patches: true }; s.shoes = { kind: 'workboots', col: '#4a3a2a', sole: '#1a1410', laces: true };
      s.acc = ['studdedVest', 'spikedShoulders', 'spikedBand', 'piercings', 'scalpTattoo', 'chain', 'toolbelt']; s.padCol = '#1a1a22';
      s.prop = r.pick(['hammer', 'hammer', 'rebar']); s.body.w = 1.1 + r() * 0.15; s.beard = null;
    } });
  T('lamplighter', { anim: 'lantern', lines: ['Light the way, friend.', 'Every lantern is somebody\'s way home.', 'Walk with us a while.'],
    spec(s, r) {
      s.face = 'serene'; s.hair = { style: 'short', col: s.hair.col }; s.hat = { kind: 'wrap', col: '#f4f0e4' };
      s.top = { kind: 'long', col: '#f0ead8' }; s.coat = { kind: 'robe', col: '#f4eedc', trim: '#e0d4b8' };
      s.bottom = { kind: 'pants', col: '#e8e0c8' }; s.shoes = { kind: 'sandals', col: '#8a6a4a' };
      s.acc = ['utilityBelt', 'lanternPoles']; s.prop = null;
    } });
  T('annoyingdj', { anim: 'dj', lines: ['MAKE SOME NOOOISE!', 'One more drop. Okay, one more. One more.', 'You can\'t have the decks. I AM the decks.'],
    spec(s, r) {
      s.face = 'toothy'; s.hair = { style: 'slick', col: '#121214', hi: '#3a3a44' }; s.glasses = 'djgoggles';
      s.top = { kind: 'button', col: '#ff6ab0', pattern: 'tiedye', open: true, under: '#f4f4f0' };
      s.bottom = { kind: 'shorts', col: '#9aff3a', belt: '#ff8a1a' }; s.shoes = { kind: 'sneakers', col: '#2ac8c0', sole: '#f4f4f0' };
      s.acc = ['headphones', 'beads', 'goldChain', 'kandi']; s.prop = r.pick(['mic', 'energydrink']);
    } });
  T('sparklepony', { anim: 'idle', lines: ['Can I have some of your water? And some of your food?', 'I didn\'t bring a tent. Or shoes. Or a plan!', 'Is that a power-up? Can I have it?'],
    spec(s, r) {
      s.face = 'lashes'; s.body.fem = true; s.body.w = 0.85; s.body.h = 0.94;
      s.hair = { style: 'long', col: '#141214', hi: '#4a4450' }; s.hat = { kind: 'crown' }; s.glasses = 'visorRainbow';
      s.top = { kind: 'crop', col: '#c8a0ff', pattern: 'holo', long: true }; s.bottom = { kind: 'shorts', col: '#d8dce8', pattern: 'sequin' };
      s.shoes = { kind: 'sneakers', col: '#d8dce8', sole: '#f4f4f8' }; s.warmerHigh = true; s.warmerCol = '#d8dce8';
      s.acc = ['fairyWings', 'legwarmers', 'ledPendants', 'fannypack', 'kandi']; s.prop = r.pick(['ledwand', 'glitterbottle']);
    } });
  T('partiedtoohard', { anim: 'dazed', lines: ['What day is it? I\'ve been awake since... Tuesday?', 'Have you seen my boot? It looks like this one.', 'My camp is... somewhere... near a dome?'],
    spec(s, r) {
      s.face = 'dazed'; s.hair = { style: 'messy', col: '#8a8078', hi: '#b8b0a8' };
      s.top = { kind: 'button', col: '#e8d8f0', pattern: 'pastelFloral', open: true, under: s.skin, torn: true };
      s.bottom = { kind: 'shorts', col: '#8a7a5a', cargo: true, patches: true }; s.shoes = { kind: 'boots', col: '#7a6a5a', missing: 'right', sockCol: '#a89a88' };
      s.acc = ['beads', 'kandi', 'lanyard', 'backpack']; s.packCol = '#5a5048'; s.prop = r.pick(['map', 'water', 'can']);
    } });
  T('burnerkid', { anim: 'idle', lines: ['Please don\'t look at us.', 'She brought her MOM. My mom. My actual mom.', 'Can you, like, tell her to chill?'],
    spec(s, r) {
      s.face = 'embarrassed'; s.hat = { kind: 'sunBeanie', col: '#2ab0a8' }; s.glasses = 'whiteShades';
      s.top = { kind: 'none' }; s.paint = 'rainbow'; s.tattoos = 'small';
      s.bottom = { kind: 'cargo', col: '#c8b08a' }; s.shoes = { kind: 'furboots', col: '#ffffff', pattern: 'rainbow' };
      s.acc = ['beads', 'kandi', 'backpack', 'ledPendants']; s.packCol = '#3a6a8a'; s.prop = 'wizardstaff'; s.body.w = 0.92; s.body.h = 0.96;
    } });
  T('burnermom', { anim: 'cheer', lines: ['WOOO! BEST! WEEK! EVER!', 'Take my photo with the bun man! Both cameras!', 'Honey, look, he has TATTOOS!'],
    spec(s, r) {
      s.face = 'mom'; s.body.fem = true; s.body.w = 0.95; s.hair = { style: 'bob', col: '#c8c8cc', hi: '#f0f0f4' };
      s.hat = { kind: 'sunhat', col: '#e0c890' }; s.glasses = 'whiteShades';
      s.top = { kind: 'long', col: '#ff9ac8', pattern: 'knit' }; s.vest = 'fleece'; s.vestCol = '#4a9a5a';
      s.bottom = { kind: 'jeans', col: '#5a7aaa', capri: true }; s.shoes = { kind: 'sneakers', col: '#f4f4f4', sole: '#e0e0e0' };
      s.acc = ['beads', 'cameras2'];
    } });
  T('cultleader', { anim: 'welcome', lines: ['Join us. We have snacks.', 'Brother Bubblegum welcomes you, bun man.', 'There is no leader. Only vibes. Mostly mine.'],
    spec(s, r) {
      s.face = 'beatific'; s.hair = { style: 'swoop', col: '#ff4fa8', hi: '#ffb0d8' }; s.beard = { col: '#ff4fa8', trim: true, len: 0.03 };
      s.glasses = 'heart'; s.top = { kind: 'none' }; s.boaCol = '#ff4fa8';
      s.bottom = { kind: 'pants', col: '#f4e8f0', belt: '#ff4fa8' }; s.shoes = { kind: 'sandals', col: '#ff9ad0' };
      s.acc = ['boa', 'furCuffs', 'heartPendants']; s.body.w = 1.18; s.body.h = 1.02;
    } });
  const fenceBot = (s, r, helmet) => {
    s.face = 'stern'; s.hood = true;
    s.top = { kind: 'long', col: '#3a3430' }; s.coat = { kind: 'jacket', col: '#7a5a3a', trim: '#7a5a3a', pattern: 'patchwork' };
    s.bottom = { kind: 'cargo', col: '#6a6e52' }; s.shoes = { kind: 'workboots', col: '#b89a6a', sole: '#5a4a3a', laces: true };
    s.gloves = '#5a5e66'; s.acc = [helmet, 'botHarness', 'kneepads', 'robotGloves', 'clipBottles']; s.strapCol = '#4a3a2a'; s.kneeCol = '#6a6a5a';
  };
  T('fencebot_a', { anim: 'robot', lines: ['BEEP. I AM ONE PERCENT ROBOT. NINETY-NINE PERCENT DUST.', 'THIS HELMET WAS A TRASH CAN. IT STILL IS.', 'SCANNING FOR SNACKS. SCANNING... SCANNING...'], spec(s, r) { fenceBot(s, r, 'trashcanHelmet'); } });
  T('fencebot_b', { anim: 'robot', lines: ['BOOP. THE VISOR FLICKERS. THAT IS ART.', 'IT IS A COLANDER. DO NOT ASK.', 'WE PATROL THE FENCE. THE FENCE PATROLS US.'], spec(s, r) { fenceBot(s, r, 'colanderHelmet'); } });
  T('billionaire', { anim: 'idle', lines: ['Radical inclusion! (Not past the rope.)', 'My sherpas built this camp by hand. Their hands.', 'Have you tried my artisanal shade?'],
    spec(s, r) {
      s.face = 'smug'; s.hair = { style: 'short', col: '#c8b088', hi: '#f0e0b8' }; s.glasses = 'aviator'; s.lensCol = '#c8a040'; s.goggles = 'classic'; s.maskCol = '#e8e0f0';
      s.top = { kind: 'button', col: '#fbfaf6', long: true }; s.bottom = { kind: 'chinos', col: '#f4f2ea' }; s.shoes = { kind: 'sneakers', col: '#fbfaf6', sole: '#e8e4dc' };
      s.acc = ['dustMask', 'watch']; s.prop = 'cocktail';
    } });
  T('safetycaptain', { anim: 'clipboard', lines: ['Safety THIRD? Not on my watch.', 'Your grey water. We need to talk about your grey water.', 'Laminate everything. EVERYTHING.'],
    spec(s, r) {
      s.face = 'stressed'; s.hat = { kind: 'hardhat', col: '#ffd21a' }; s.vest = 'hivis';
      s.top = { kind: 'long', col: '#ff8a1a' }; s.bottom = { kind: 'cargo', col: '#4a4a52' }; s.shoes = { kind: 'combat', col: '#1a1a1e', laces: true };
      s.acc = ['respirator', 'chestRadio', 'reflectiveTape', 'dutyBelt']; s.prop = 'clipboard';
    } });
  T('healer', { anim: 'idle', lines: ['Your aura is... very dusty.', 'Gaze into my eyes. For an hour.', 'I cried at a trash truck today. It was beautiful.'],
    spec(s, r) {
      s.face = 'serene'; s.hair = { style: r.pick(['long', 'wavy']), col: r.pick(['#c8a070', '#6a4428', '#e8d8b8']), hi: '#f0e8d0' };
      s.top = { kind: 'long', col: '#fbf8f0' }; s.coat = { kind: 'robe', col: '#fbf8f0', trim: '#e8e0d0' };
      s.bottom = { kind: 'pants', col: '#f4f0e6' }; s.shoes = { kind: 'barefoot' }; s.acc = ['crystal', 'kandi'];
    } });
})();


/* ---------- the RED LIGHT DISTRICT crew: a glam burlesque/cabaret camp (PG-13) ----------
   Brady and Chinka hitched to the Burn in their pink RV (W1); they babysit his gear in W2.
   type 'redlight', variant: 'bikini' | 'corset' | 'fan' | 'showgirl' | 'madame' (or 0-4). Crew list: BURNS_REDLIGHT. */
const BURNS_REDLIGHT = {
  camp: 'RED LIGHT DISTRICT',
  variants: ['bikini', 'corset', 'fan', 'showgirl', 'madame'],
  crew: [
    { id: 'rlVelvet', name: 'MAMA VELVET', variant: 'madame', anim: 'welcome', lines: ['Sugar, you look like a lost lamb in a dust storm. Stay close to Mama.', 'First Burn? Oh, honey. Hydrate, moisturize, and never trust a man in a fur vest at sunrise.'] },
    { id: 'rlCandi', name: 'CANDI', variant: 'bikini', anim: 'dance', lines: ['Six hundred miles in that RV and you snored the whole way, cutie.', 'Rule one: glitter is a lifestyle. Rule two: see rule one.'] },
    { id: 'rlRoxie', name: 'ROXIE', variant: 'corset', anim: 'cheer', lines: ['Go get your girl, bun boy! We believe in you!', 'If anybody gives you trouble, they answer to the corset.'] },
    { id: 'rlPeachy', name: 'PEACHY', variant: 'fan', anim: 'dance', lines: ['These fans have seen things. Beautiful things.', 'Showtime is midnight. Front row is yours, sweet pea.'] },
    { id: 'rlBlush', name: 'BLUSH', variant: 'showgirl', anim: 'wave', lines: ['A gentleman always tips his hat. Watch and learn, darling.', 'You still owe us gas money. Kidding! Gifting economy!'] }
  ]
};
(() => {
  const B = BURNS_BONES, G = BURNS_GEAR, hp = BurnsRound.headPt;
  const acc = (n, f) => { G.acc[n] = f; }, prop = (n, f) => { G.prop[n] = f; }, hat = (n, f) => { G.hat[n] = f; };
  BURNS_ATLAS.addFace('showgirl', { eyes: 'normal', lashes: true, brows: { col: '#b08a50', tilt: 1.5, w: 6 }, mouth: 'smile', mouthW: 11, lips: '#e0204a', blush: true });
  const ringAt = (m, A, y, off, rad, seg) => { const r = A.torsoR(y), sz = Math.abs(A.torsoPt(0, y, 0)[2]) / Math.max(0.01, r); m.push(); m.tf(0, y, 0, 0, 0, 0, 1, 1, sz); m.torus(0, 0, 0, r + off, rad, { seg: seg, tseg: 3 }); m.pop(); };
  acc('bikiniStraps', (m, A) => {
    const h = A.h; m.color((A.S.top && A.S.top.col) || '#ff5ab0');
    for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.3, 0.4 * h, 0.006), b = A.torsoPt(sd * 0.85, 0.5 * h, 0.002); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.007, 0.007, { seg: 4 }); }
    if (!A.lo) { const p = A.torsoPt(0, 0.35 * h, 0.014); m.color('#fff4fa', 0.35).shine(3); m.ball(p[0], p[1], p[2], 0.013, { seg: 6, rings: 4 }); m.emissive(0); m.shine(0); }
  });
  acc('corsetLace', (m, A) => {   // black trim, front lacing and boning on a 'corset' top
    const h = A.h; m.color('#1a0a12').shine(1);
    ringAt(m, A, 0.388 * h, 0.006, 0.009, A.lo ? 10 : 18); ringAt(m, A, 0.025 * h, 0.006, 0.008, A.lo ? 10 : 18);
    if (!A.lo) {
      for (let i = 0; i < 5; i++) { const y0 = (0.06 + i * 0.062) * h, y1 = y0 + 0.062 * h, a = A.torsoPt(-0.11, y0, 0.006), b = A.torsoPt(0.11, y1, 0.006), c = A.torsoPt(0.11, y0, 0.006), d = A.torsoPt(-0.11, y1, 0.006); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.004, 0.004, { seg: 3 }); m.limb(c[0], c[1], c[2], d[0], d[1], d[2], 0.004, 0.004, { seg: 3 }); }
      m.color(shade((A.S.top && A.S.top.col) || '#c81a3a', -0.35));
      for (const th of [-1.25, -0.6, 0.6, 1.25]) { const a = A.torsoPt(th, 0.05 * h, 0.004), b = A.torsoPt(th, 0.37 * h, 0.004); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.005, 0.005, { seg: 3 }); }
    }
    m.shine(0);
  });
  prop('featherFan', (m, A) => {   // a pink ostrich-feather fan
    m.color('#2a1418').shine(2); m.limb(0, -0.02, 0.03, 0, 0.1, 0.03, 0.008, 0.006, { seg: 5 }); m.shine(0);
    const n = A.lo ? 5 : 9;
    for (let i = 0; i < n; i++) { const a = -1.15 + 2.3 * i / (n - 1); m.push(); m.tf(0, 0.1, 0.03, 0, 0, a); m.color(i % 2 ? '#ff6ac0' : '#ffb0e0'); m.ellipsoid(0, 0.17, 0, 0.036, 0.17, 0.009, { seg: A.lo ? 6 : 9, rings: 5 }); if (!A.lo) { m.color('#fff0f8'); m.ellipsoid(0, 0.32, 0, 0.026, 0.035, 0.009, { seg: 6, rings: 4 }); } m.pop(); }
  });
  prop('cane', (m, A) => { m.color('#121216').shine(2); m.limb(0, -0.78, 0.04, 0, 0.12, 0.04, 0.011, 0.011, { seg: 6 }); m.color('#f4f4f0'); m.ball(0, -0.79, 0.04, 0.014, { seg: 6, rings: 4 }); m.color('#e0b848').shine(3); m.ball(0, 0.14, 0.04, 0.026, { seg: 8, rings: 6 }); m.shine(0); });
  hat('fascinator', (m, A, H) => {   // a tiny tilted hat with a feather plume
    const p = hp(0.75, 0.62, 0.01); m.push(); m.tf(p[0], p[1], p[2], 0.75, -0.35, -0.5);
    m.color(H.col || '#e0204a').shine(2); m.roundCyl(0, 0, 0, 0.055, 0.025, 0.01);
    m.color('#ffb0e0'); for (let i = 0; i < (A.lo ? 1 : 3); i++) { m.push(); m.tf(0, 0.02, 0, 0, 0, -0.5 + 0.45 * i); m.ellipsoid(0, 0.1, 0, 0.022, 0.11, 0.006, { seg: 6, rings: 4 }); m.pop(); }
    m.pop(); m.shine(0);
  });
  const blondes = [['#f6e6b0', '#fffaf0'], ['#f0d890', '#fff4d0'], ['#e8c870', '#fff0c0'], ['#f4dca0', '#ffffff']];
  BURNS_NPC_TYPES.redlight = { anim: 'cheer', lines: ['Honey, you look thirsty. Have some water and some sparkle.', 'Red Light District, darling. We put the "glam" in "glamping."', 'Keep it classy, keep it dusty.'],
    spec(s, r, opts) {
      let v = opts && opts.variant !== undefined ? opts.variant : r.pick(['bikini', 'corset', 'fan', 'showgirl']);
      if (typeof v === 'number') v = BURNS_REDLIGHT.variants[((v % 5) + 5) % 5];
      const bl = r.pick(blondes);
      s.body.fem = true; s.body.w = 0.86; s.body.h = v === 'madame' ? 1.04 : 0.98; s.face = 'showgirl'; s.beard = null; s.goggles = false; s.glasses = null;
      s.hair = { style: r.pick(['long', 'wavy', 'curly']), col: bl[0], hi: bl[1] };
      s.shoes = { kind: 'boots', col: v === 'corset' || v === 'showgirl' ? '#1a1014' : '#ff6ac0', sole: '#2a1418' };
      s.acc = [];
      if (v === 'bikini') { s.top = { kind: 'bikini', col: '#ff5ab0', pattern: 'sequin' }; s.bottom = { kind: 'shorts', col: '#ff6ac0', pattern: 'sequin' }; s.boaCol = '#ff7ac8'; s.acc = ['bikiniStraps', 'boa', 'bracelets']; s.glasses = 'heart'; s.lensCol = '#ff4fa8'; s.prop = null; }
      else if (v === 'corset') { s.top = { kind: 'corset', col: '#d0183a', pattern: 'sequin' }; s.bottom = { kind: 'tutu', col: '#1a1014', tiers: ['#1a1014', '#d0183a', '#1a1014'] }; s.boaCol = '#fff4f8'; s.acc = ['corsetLace', 'boa', 'bracelets']; s.hair.style = 'curly'; s.prop = null; }
      else if (v === 'fan') { s.top = { kind: 'bikini', col: '#ff4fa8', pattern: 'sequin' }; s.bottom = { kind: 'tutu', col: '#ff9ad0', tiers: ['#ff6ac0', '#ffd0ea', '#ff9ad0'] }; s.acc = ['bikiniStraps', 'bracelets']; s.hair.style = 'bob'; s.hat = { kind: 'fascinator', col: '#ff2a6a' }; s.prop = 'featherFan'; s.prop2 = 'featherFan'; }
      else if (v === 'showgirl') { s.top = { kind: 'corset', col: '#c8102e', pattern: 'sequin' }; s.bottom = { kind: 'shorts', col: '#1a1014' }; s.boaCol = '#ff7ac8'; s.acc = ['corsetLace', 'boa']; s.hat = { kind: 'tophat', col: '#16101a' }; s.prop = 'cane'; }
      else { s.top = { kind: 'corset', col: '#b0102a', pattern: 'sequin' }; s.bottom = { kind: 'kilt', col: '#b0102a', len: 0.78, pattern: 'sequin' }; s.boaCol = '#ff7ac8'; s.acc = ['corsetLace', 'boa', 'goldChain']; s.hair = { style: 'bun', col: bl[0], hi: bl[1] }; s.glasses = 'round'; s.lensCol = '#ff9ad8'; s.prop = 'coffee'; }
      if (opts && opts.prop !== undefined) s.prop = opts.prop;
      s.key = 'redlight:' + v + ':' + s.hair.col + ':' + s.hair.style;
    } };
})();
