/* ============================================================
   Every land its own prize box (Brady, 27 Nov: "maybe every world gets its own kind of box").
   22 code-drawn boxes after ChatGPT's concept pictures (docs/design/chatgpt_boxes/README.md) and the hit / empty
   poses in docs/design/CHATGPT_RELAY.md section C. Flat colour, bold dark outline, front view, one tile.
   Each land is one function draw(ctx, p) in a 32 x 32 tile box: p = 0 is the closed box, p = 1 the empty
   silhouette, anything between is the opening action (the hit plays p from 0 to 1 in HIT seconds).
   One cue shared by all 22 says "hit me from below": a closed box bobs, glows gold round its outline, has a
   shine sweeping across it and a twinkling four-point star on its top right corner. A spent box loses all of that
   and is dulled (greyer, darker) with a faint pale keyline so it still reads as a solid block on dark levels.
   Rendering: every state is painted once per land and scale into its own canvas (4 idle frames, 8 hit frames,
   1 empty) and blitted; nothing is drawn per frame but drawImage.
   Hooks (no shared file edited):
     - TileArt.get: while a tour level's tiles are drawn, the theme's tile atlas is seen through an overlay whose
       qblock / used images are the land's own box (so backstage rooms in a land use that land's box too).
     - Play.prototype.setTile: a box turning USED records the moment; Play.prototype.drawTiles draws those tiles
       for HIT seconds from the hit frames (with the usual bump) instead of the still empty image.
   Tile kinds: T.QBLOCK (item and coin boxes) draws the closed box; T.USED the empty box; T.HIDDEN stays invisible
   (and shows the land's closed box in the trippy view, as before); T.QBRICK stays a brick (a disguised coin brick).
   Proof: tools/sbw_boxes_shots.js (contact sheet + one phone shot per land), tools/sbw_boxes_test.js.
   ============================================================ */
const BoxArt = (() => {
  if (typeof TileArt === 'undefined' || typeof Play === 'undefined') return null;
  const K = '#22182c', LW = 1.6, PI = Math.PI, HOLE = '#1c1222';
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v, seg = (p, a, b) => cl((p - a) / (b - a)), ease = q => 1 - (1 - q) * (1 - q);
  const io = q => q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
  // ---- drawing helpers (tile coordinates) ----
  const fs = (c, fill, lw) => { if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = K; c.stroke(); } };
  const R = (c, x, y, w, h, r, fill, lw) => { rr(c, x, y, w, h, r); fs(c, fill, lw); };
  const O = (c, x, y, r, fill, lw) => { c.beginPath(); c.arc(x, y, Math.max(0.05, r), 0, TAU); fs(c, fill, lw); };
  const E = (c, x, y, rx, ry, a, fill, lw) => { c.beginPath(); c.ellipse(x, y, Math.max(0.05, rx), Math.max(0.05, ry), a || 0, 0, TAU); fs(c, fill, lw); };
  const G = (c, pts, fill, lw) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); fs(c, fill, lw); };
  const L = (c, pts, col, w) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const rope = (c, pts, col, w) => { L(c, pts, K, w + 1.8); L(c, pts, col, w); };
  const qrope = (c, x0, y0, cx, cy, x1, y1, col, w) => { for (const [cc, ww] of [[K, w + 1.8], [col, w]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.strokeStyle = cc; c.lineWidth = ww; c.stroke(); } };
  const shine = (c, x, y, w, h, r) => { c.fillStyle = 'rgba(255,255,255,0.3)'; rr(c, x, y, w, h, r || 1); c.fill(); };
  const rot = (c, x, y, a, fn) => { c.save(); c.translate(x, y); c.rotate(a); c.translate(-x, -y); fn(); c.restore(); };
  const scl = (c, x, y, sx, sy, fn) => { c.save(); c.translate(x, y); c.scale(sx, sy); c.translate(-x, -y); fn(); c.restore(); };
  const alpha = (c, a, fn) => { if (a <= 0.01) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); };
  const mouth = (c, x, y, w, h) => R(c, x, y, w, h || 3.4, 1.5, HOLE, 1.2);
  const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // a lid hinged at the back: q 0..0.5 lifts and thins it (front), 0.5..1 it stands up behind the box showing its inside
  const lidFront = (c, q, x, y, w, h, col, deco) => { if (q > 0.5) return; const k = q * 2, hh = h * (1 - k) + 1.4, yy = y - k * 5; R(c, x, yy, w, hh, Math.min(2.5, hh / 2), col); if (deco && k < 0.25) deco(yy); };
  const lidBack = (c, q, x, y, w, col, H) => { if (q <= 0.5) return; const k = (q - 0.5) * 2, hh = 2 + k * (H || 9); R(c, x + 1, y - hh, w - 2, hh + 2.5, 2, col); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 3, y - hh + 2, w - 6, 1.2); };
  const star4 = (c, x, y, r, fill, lw) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4 - PI / 2, rr2 = i % 2 ? r * 0.36 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); fs(c, fill, lw); };

  const LANDS = {
    // ---- Mexico: turquoise pressed tin, scalloped corners, fat coral rosette; the flower dimples, the lid pops ----
    mx: { name: 'Mexico', draw(c, p) {
      const T1 = '#2ec4b6', T2 = '#178a80', T3 = '#8ae8de', C1 = '#ff6f61', C2 = '#ffd166';
      const dim = seg(p, 0, 0.35), q = ease(seg(p, 0.3, 1));
      lidBack(c, q, 1, 8, 30, T2, 11);
      if (q > 0.5) for (let i = 0; i < 6; i++) O(c, 5 + i * 4.4, 8 - (2 + (q - 0.5) * 2 * 11), 1.5, T2, 1);
      R(c, 2, 7.5, 28, 24, 3, T1); shine(c, 4.5, 10, 23, 2);
      for (const [x, y] of [[4.6, 10.2], [27.4, 10.2], [4.6, 28.6], [27.4, 28.6]]) O(c, x, y, 1.5, T2, 1);
      if (q > 0) mouth(c, 4, 7.5, 24);
      const s = 1 - 0.32 * dim, cy = 20;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; E(c, 16 + Math.cos(a) * 5.2 * s, cy + Math.sin(a) * 5.2 * s, 3.3 * s, 2.3 * s, a, mix(C1, '#b8403a', dim * 0.8), 1.2); }
      O(c, 16, cy, 3 * s, mix(C2, '#c08a2a', dim), 1.2);
      if (dim > 0.2) O(c, 16, cy, 1.4 * s, 'rgba(60,20,10,0.45)', 0);
      lidFront(c, q, 1, 2, 30, 6.5, T3, yy => { for (let i = 0; i < 6; i++) O(c, 5 + i * 4.4, yy + 3.2, 0.9, '#ffffff', 0); });
    } },
    // ---- Ecuador: blond balsa crate, green banana latch; the banana pivots and knocks the top slat loose ----
    ec: { name: 'Ecuador', draw(c, p) {
      const W1 = '#f4d89c', W2 = '#d6ad62', W3 = '#a97a38', B1 = '#9ad23a', B2 = '#5b9a1c';
      const sw = ease(seg(p, 0, 0.55)), sl = ease(seg(p, 0.3, 1));
      R(c, 3, 29, 5, 3, 1, W3, 1.2); R(c, 24, 29, 5, 3, 1, W3, 1.2);
      R(c, 2, 4.5, 28, 26, 2, W2);
      for (const y of [12, 18.6, 25]) { R(c, 4, y, 24, 5.4, 1, W1, 1.2); c.fillStyle = 'rgba(160,110,50,0.35)'; c.fillRect(7, y + 2.4, 9, 0.8); }
      if (sl > 0) mouth(c, 4, 5.5, 24, 5.6);
      rot(c, 27.5, 8, sl * 0.42, () => { R(c, 4, 5.5, 24, 5.4, 1, W1, 1.2); c.fillStyle = 'rgba(160,110,50,0.35)'; c.fillRect(14, 7.8, 10, 0.8); });
      rot(c, 8.5, 16, -sw * 1.25, () => {
        R(c, 5.5, 14.2, 4, 3.6, 1, '#6a4a1e', 1.2);
        c.beginPath(); c.moveTo(8.5, 14.6); c.quadraticCurveTo(17, 25.5, 27, 14.5); c.quadraticCurveTo(17, 20, 8.5, 17.6); c.closePath(); fs(c, B1);
        c.beginPath(); c.moveTo(11, 17.6); c.quadraticCurveTo(17, 21.5, 24, 17); c.strokeStyle = B2; c.lineWidth = 1; c.stroke();
      });
    } },
    // ---- Brazil: purple acai carton, a berry seal with a leaf; the berry rolls up the flap, the flaps splay ----
    br: { name: 'Brazil', draw(c, p) {
      const P1 = '#8b3aaa', P2 = '#5c2178', P3 = '#b16fd0', Bl = '#4466dd', Lf = '#47b84a';
      const roll = ease(seg(p, 0, 0.5)), op = ease(seg(p, 0.3, 1));
      G(c, [[3, 9.5], [29, 9.5], [28.4, 31.5], [21.5, 31.5], [20.5, 29.4], [11.5, 29.4], [10.5, 31.5], [3.6, 31.5]], P1);
      c.fillStyle = 'rgba(255,255,255,0.12)'; for (const x of [8, 13, 19, 24]) c.fillRect(x, 13, 1.2, 14);
      if (op > 0) { c.beginPath(); c.moveTo(4.5, 9.5); c.lineTo(27.5, 9.5); c.lineTo(27.5, 12); c.lineTo(20, 12); c.arc(16, 12, 4, 0, PI); c.lineTo(4.5, 12); c.closePath(); fs(c, HOLE, 1.2); }
      rot(c, 3, 9.5, -op * 0.8, () => G(c, [[3, 9.5], [16, 9.5], [15.6, 3.5], [4, 3.5]], P3));
      rot(c, 29, 9.5, op * 0.8, () => G(c, [[16, 9.5], [29, 9.5], [28, 3.5], [16.4, 3.5]], P3));
      const by = 20 - roll * 17, ba = 1 - seg(p, 0.55, 0.85);
      alpha(c, ba, () => rot(c, 16, by, roll * 2.5, () => { O(c, 16, by, 4.6, Bl); O(c, 14.6, by - 1.6, 1.1, 'rgba(255,255,255,0.6)', 0); E(c, 19, by - 4.4, 3, 1.5, -0.5, Lf, 1.2); }));
    } },
    // ---- Mozambique: teal fishing creel tied shut by a cream rope X; the rope springs into two loops ----
    mz: { name: 'Mozambique', draw(c, p) {
      const T1 = '#1fa3a0', T2 = '#127270', T3 = '#62d3cb', Cr = '#f6ead0';
      const sp = ease(seg(p, 0, 0.6)), q = ease(seg(p, 0.25, 0.9)), hang = seg(p, 0.7, 1);
      c.beginPath(); c.moveTo(4, 7.5); c.quadraticCurveTo(1.6, 19, 4, 30); c.lineTo(28, 30); c.quadraticCurveTo(30.4, 19, 28, 7.5); c.closePath(); fs(c, T1);
      c.fillStyle = 'rgba(0,40,40,0.28)'; for (const x of [9.5, 16, 22.5]) c.fillRect(x - 0.5, 9, 1, 18);
      R(c, 1.5, 26.5, 29, 5, 1.5, T2);
      if (q > 0) mouth(c, 4, 6, 24);
      alpha(c, 1 - q, () => { R(c, 1.5, 3.2 - q * 10, 29, 5.6, 1.5, T2); shine(c, 3.5, 4 - q * 10, 25, 1.2); });
      for (const [x, y] of [[6.5, 12], [25.5, 12], [6.5, 24.5], [25.5, 24.5]]) O(c, x, y, 1.4, HOLE, 1);
      const ex = 25.5 - sp * 19 - hang * 2.5, ey = 24.5 + hang * 5;
      qrope(c, 6.5, 12, 16 - sp * 20, 18.3, ex, ey, Cr, 2.2);
      qrope(c, 25.5, 12, 16 + sp * 20, 18.3, 32 - ex, ey, Cr, 2.2);
    } },
    // ---- Morocco: terracotta cooler, two ears, blue lid with a ball knob, four-petal vent; puff, lid skips to an ear ----
    ma: { name: 'Morocco', draw(c, p) {
      const C1 = '#cf6a3e', C2 = '#9a4426', C3 = '#e99467', B1 = '#2f6fd0', B2 = '#1d4a94';
      const puff = seg(p, 0, 0.55), sk = io(seg(p, 0.25, 1));
      for (const x of [3.6, 28.4]) { E(c, x, 16.5, 3.2, 4.4, 0, C2); E(c, x, 16.5, 1.3, 2.4, 0, '#4a1c0c', 1); }
      c.beginPath(); c.moveTo(5.5, 8); c.quadraticCurveTo(1.5, 20, 7, 31.5); c.lineTo(25, 31.5); c.quadraticCurveTo(30.5, 20, 26.5, 8); c.closePath(); fs(c, C1);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(7, 12, 2, 14);
      R(c, 6, 5.8, 20, 4.2, 1.5, C3);
      if (sk > 0.15) E(c, 16, 7.6, 8.4, 1.8, 0, HOLE, 1.2);
      for (let i = 0; i < 4; i++) { const a = i * PI / 2; E(c, 16 + Math.cos(a) * 3.4, 21 + Math.sin(a) * 3.4, 2.6, 1.3, a, '#5a2412', 1); }
      O(c, 16, 21, 1, '#5a2412', 0);
      const lx = 16 + sk * 12.6, ly = 5.8 + sk * 11, la = sk * 1.42;
      rot(c, lx, ly, la, () => { E(c, lx, ly, 11, 3, 0, B1); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(lx - 7, ly - 1.4, 9, 0.9); if (sk < 0.6) O(c, lx, ly - 3.4, 2, B2, 1.2); });
      if (puff > 0 && puff < 1) alpha(c, 1 - puff, () => { O(c, 16, 21 - puff * 14, 2 + puff * 3.5, '#ffffff', 1); O(c, 12.5, 23 - puff * 10, 1.4 + puff * 2, '#ffffff', 1); });
    } },
    // ---- Spain: coral lacquer case on feet, clasped by an ivory fan; the fan snaps shut, the front drops ----
    es: { name: 'Spain', draw(c, p) {
      const R1 = '#e8504f', R2 = '#b02c33', R3 = '#f67c78', Fc = '#f9e6c2';
      const snap = ease(seg(p, 0, 0.4)), op = ease(seg(p, 0.25, 0.8)), flip = io(seg(p, 0.7, 1));
      R(c, 4, 27.5, 5.5, 4.2, 1, R2); R(c, 22.5, 27.5, 5.5, 4.2, 1, R2);
      R(c, 2.5, 9, 27, 20, 2, R1);
      G(c, [[4, 3.5], [28, 3.5], [30.5, 9.5], [1.5, 9.5]], R3); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(6, 5, 20, 1.2);
      if (op > 0) {
        R(c, 5.5, 11.5, 21, 15.5, 2, HOLE, 1.2);
        const top = 11.5 + op * 15.5; if (top < 26.5) R(c, 5.5, top, 21, 27 - top, 1, R1, 1.2);
        if (op > 0.6) { const h = (op - 0.6) / 0.4 * 4.5; G(c, [[5.5, 27], [26.5, 27], [27.5, 27 + h], [4.5, 27 + h]], R3, 1.2); }
      }
      const spread = (150 - snap * 132) * PI / 180, dir = -PI / 2 + flip * PI, cx = 16, cy = 24 - snap * 5 + flip * 8, r = 9.5 - snap * 1.5;
      for (let i = 0; i < 6; i++) { const a0 = dir - spread / 2 + spread * i / 6, a1 = a0 + spread / 6; G(c, [[cx, cy], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r]], Fc, 1.1); }
      O(c, cx, cy, 2.6, Fc, 1.2);
    } },
    // ---- France: ochre bread bin with a green roll-top and a pale grip; the grip shoots up and rolls it away ----
    fr: { name: 'France', draw(c, p) {
      const O1 = '#eab53d', O2 = '#b8821e', G1 = '#2f7d4a', G2 = '#1f5a33', Cr = '#f3e3c0';
      const up = io(seg(p, 0, 1));
      R(c, 3.5, 28.5, 5, 3.4, 1, O2); R(c, 23.5, 28.5, 5, 3.4, 1, O2);
      c.beginPath(); c.moveTo(2, 30); c.lineTo(2, 12); c.quadraticCurveTo(2, 3.5, 11, 3.5); c.lineTo(21, 3.5); c.quadraticCurveTo(30, 3.5, 30, 12); c.lineTo(30, 30); c.closePath(); fs(c, O1);
      shine(c, 9, 5.4, 14, 1.4);
      const arch = () => { c.beginPath(); c.moveTo(6, 27.5); c.lineTo(6, 14.5); c.quadraticCurveTo(6, 8, 12.5, 8); c.lineTo(19.5, 8); c.quadraticCurveTo(26, 8, 26, 14.5); c.lineTo(26, 27.5); c.closePath(); };
      arch(); fs(c, HOLE);
      const yb = 27.5 - up * 20;
      if (yb > 8.5) {
        c.save(); arch(); c.clip();
        c.fillStyle = G1; c.fillRect(5, 7, 22, yb - 7);
        c.fillStyle = G2; for (let y = yb - 3; y > 7; y -= 3) c.fillRect(5, y, 22, 0.9);
        c.restore(); arch(); fs(c, null);
      }
      const gy = Math.max(5.8, yb - 4.2);
      R(c, 12, gy, 8, 3, 1.4, Cr, 1.2); c.fillStyle = 'rgba(80,60,30,0.5)'; c.fillRect(13.6, gy + 1.2, 4.8, 0.8);
      L(c, [[6.6, 14], [6.6, 27]], 'rgba(0,0,0,0.25)', 0.8); L(c, [[25.4, 14], [25.4, 27]], 'rgba(0,0,0,0.25)', 0.8);
    } },
    // ---- Amsterdam: plank houseboat float, blue walls, red and cream ring fender; the ring lifts the hatch ----
    nl: { name: 'Amsterdam', draw(c, p) {
      const Bu = '#3d7fd6', Bu2 = '#285aa6', Nv = '#1f2f5c', Cr = '#f5ecd6', Rd = '#e23b3b';
      const q = ease(seg(p, 0.2, 0.75)), upk = ease(seg(p, 0, 0.45)), dn = ease(seg(p, 0.55, 1));
      lidBack(c, q, 2, 8, 28, '#d9cfb5', 10);
      R(c, 4, 7.5, 24, 16, 1.5, Bu);
      c.fillStyle = Bu2; for (const x of [10, 16, 22]) c.fillRect(x - 0.6, 9, 1.2, 13);
      if (q > 0) mouth(c, 5, 7.5, 22);
      G(c, [[1, 21.5], [31, 21.5], [28, 31.5], [4, 31.5]], Nv); c.fillStyle = Cr; c.fillRect(3, 24, 26, 1.3);
      for (const x of [9, 16, 23]) O(c, x, 27.8, 1.1, '#8fb4ff', 0.9);
      lidFront(c, q, 2, 3.4, 28, 5.6, Cr);
      const ry = 16 - upk * 13 + dn * 11.5, rr2 = 6.4 - dn * 1.6;
      if (upk > 0.05 || dn > 0) L(c, [[16, dn > 0.3 ? 30 : 5], [16, ry - rr2]], '#f5ecd6', 1);
      O(c, 16, ry, rr2, Rd);
      c.strokeStyle = Cr; c.lineWidth = rr2 * 0.55; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(16, ry, rr2 * 0.72, i * PI / 2 + 0.2, i * PI / 2 + 0.75); c.stroke(); }
      O(c, 16, ry, rr2 * 0.42, dn > 0.5 ? Nv : Bu2, 1.2);
    } },
    // ---- Bali: pandan parcel woven in broad green checks, orange leaf toggle; four leaf corners peel away ----
    id: { name: 'Bali', draw(c, p) {
      const G1 = '#93d651', G2 = '#3f9a3a', G3 = '#2b6a28', Or = '#f08a24';
      const slip = seg(p, 0, 0.3), peel = seg(p, 0.15, 1);
      const leaf = (x, y, a, len, w, col) => rot(c, x, y, a, () => { c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w, y - len * 0.6, x, y - len); c.quadraticCurveTo(x + w, y - len * 0.6, x + w, y); c.closePath(); fs(c, col); L(c, [[x, y - 1], [x, y - len + 2]], 'rgba(0,0,0,0.25)', 0.8); });
      const P = [[0.25, 7, -1.05], [0.15, 25, 1.05], [0.05, 11, -0.4], [0, 21, 0.4]];
      for (const [d, x, a] of P) { const k = ease(seg(peel, d, d + 0.55)); if (k > 0) leaf(x, 8, a * k, 3 + k * 9, 4.2, d < 0.1 ? G3 : G2); }
      R(c, 3, 6, 26, 25.5, 2, G1);
      c.save(); rr(c, 3, 6, 26, 25.5, 2); c.clip(); c.fillStyle = G2; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if ((i + j) % 2) c.fillRect(3 + i * 5.2, 6 + j * 5.2, 5.2, 5.2); c.restore();
      rr(c, 3, 6, 26, 25.5, 2); fs(c, null);
      if (peel > 0) mouth(c, 5, 6, 22);
      const lid = 1 - ease(seg(peel, 0, 0.5));
      if (lid > 0) G(c, [[3, 6], [29, 6], [16, 6 + 12 * lid]], G3);
      alpha(c, 1 - seg(p, 0.2, 0.45), () => { const y = 18 + slip * 6; rot(c, 16, y, slip * 0.8, () => { c.beginPath(); c.moveTo(16, y - 5); c.quadraticCurveTo(20.5, y, 16, y + 5); c.quadraticCurveTo(11.5, y, 16, y - 5); fs(c, Or); L(c, [[16, y - 3.5], [16, y + 3.5]], '#b55a10', 0.9); }); });
    } },
    // ---- Vietnam: honey bamboo cage, green lashings, domed lid, the big round front window ----
    vn: { name: 'Vietnam', draw(c, p) {
      const H1 = '#f3b73c', H2 = '#c9891b', H3 = '#ffd774', Gn = '#2f8c3f';
      const lift = ease(seg(p, 0, 0.55)), lean = ease(seg(p, 0.45, 1));
      R(c, 4.5, 11, 23, 18, 1, '#8a5a18', 1);
      for (const x of [7.5, 11.5, 16, 20.5, 24.5]) R(c, x - 1.1, 11, 2.2, 18, 1, H1, 1);
      R(c, 2.5, 26.8, 27, 4.7, 1.5, H1); R(c, 2.5, 9.6, 27, 3.6, 1.5, H1);
      R(c, 2.2, 9.6, 4, 21.9, 1.5, H1); R(c, 25.8, 9.6, 4, 21.9, 1.5, H1);
      shine(c, 3, 10.2, 2, 20);
      if (lift > 0) mouth(c, 6, 9.4, 20, 2.6);
      for (const [x, y] of [[4.2, 11.4], [27.8, 11.4], [4.2, 20], [27.8, 20], [4.2, 29], [27.8, 29]]) { L(c, [[x - 2, y - 1.8], [x + 2, y + 1.8]], Gn, 1.5); L(c, [[x + 2, y - 1.8], [x - 2, y + 1.8]], Gn, 1.5); }
      c.beginPath(); c.arc(16, 19.5, 6.4, 0, TAU); c.strokeStyle = K; c.lineWidth = 5.4; c.stroke(); c.strokeStyle = H1; c.lineWidth = 3.2; c.stroke();
      c.beginPath(); c.arc(16, 19.5, 6.6, PI * 1.1, PI * 1.5); c.strokeStyle = H3; c.lineWidth = 1; c.stroke();
      const dome = () => {
        c.beginPath(); c.ellipse(16, 10.5, 13.5, 8, 0, PI, TAU); c.closePath(); fs(c, H1);
        for (const x of [7, 11.5, 16, 20.5, 25]) L(c, [[16 + (x - 16) * 0.25, 3.2], [x, 10.3]], H2, 1.1);
        R(c, 13, 0.6, 6, 3, 1.4, H1, 1.3);
      };
      const sy = 1 - lean * 0.45;
      rot(c, 2.5, 10.5, -lift * 0.32 + lean * 0.2, () => scl(c, 16, 10.5, 1, sy, dome));
    } },
    // ---- Japan: navy cloth over a square case, cream folds, coral knot with two ears; the knot unloops ----
    jp: { name: 'Japan', draw(c, p) {
      const N1 = '#27427f', N2 = '#162a57', Cr = '#f4ead2', Co = '#ff7a5c';
      const un = ease(seg(p, 0, 0.45)), ap = ease(seg(p, 0.3, 1));
      R(c, 3, 6.5, 26, 25, 3, N1);
      L(c, [[7, 24], [12, 28]], 'rgba(255,255,255,0.15)', 1); L(c, [[25, 23], [21, 28]], 'rgba(255,255,255,0.15)', 1);
      if (ap > 0.2) mouth(c, 5, 6.5, 22, 3.4);
      const l0 = [[16, 7], [4.5, 7.5], [8, 18]], l1 = [[12, 6.5], [3, 7], [-1.5, 20]];
      const lt = l0.map((q, i) => lp(q, l1[i], ap)), rt = lt.map(q => [32 - q[0], q[1]]);
      G(c, lt, ap > 0.5 ? N2 : Cr, 1.4); G(c, rt, ap > 0.5 ? N2 : Cr, 1.4);
      if (ap > 0.4) { qrope(c, 16, 6, 21 + ap * 2, 14, 19, 22 + ap * 5, Co, 2.4); }
      const e = 1 - un;
      if (e > 0.02) { E(c, 11.5, 3.6, 4.6 * e, 2.2 * e, -0.45, Co); E(c, 20.5, 3.6, 4.6 * e, 2.2 * e, 0.45, Co); }
      O(c, 16, 6, 3 - un * 0.6, Co, 1.4);
    } },
    // ---- Nepal: ochre trekking case, two blue webbing bands, an orange buckle; the buckle springs, the lid snaps back ----
    np: { name: 'Nepal', draw(c, p) {
      const O1 = '#f39a2c', O2 = '#c06a12', O3 = '#ffc463', Bl = '#4f7fd6', Bk = '#ef6a1e';
      const spr = ease(seg(p, 0, 0.35)), q = ease(seg(p, 0.25, 1)), band = ease(seg(p, 0.6, 1));
      lidBack(c, q, 2, 12.5, 28, O2, 10);
      if (band > 0) { const h = band * 15; R(c, 19.5, 12 - h, 4.2, h + 2, 1, Bl, 1.3); R(c, 18.8, 11.5 - h, 5.6, 3.4, 1, Bk, 1.2); }
      G(c, [[2, 14], [30, 14], [30, 28], [27, 31.5], [5, 31.5], [2, 28]], O1);
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(3, 29, 26, 1.2);
      R(c, 8, 14, 4.2, 17.5, 0.8, Bl, 1.3); if (band < 0.5) R(c, 19.8, 14, 4.2, 17.5, 0.8, Bl, 1.3);
      if (q > 0) mouth(c, 4, 12.5, 24, 3.2);
      if (q <= 0.5) {
        const k = q * 2, hh = 10 * (1 - k) + 1.4, yy = 4.5 - k * 5;
        G(c, [[5, yy], [27, yy], [30, yy + 3], [30, yy + hh], [2, yy + hh], [2, yy + 3]], O1); shine(c, 6, yy + 1.4, 20, 1.2);
        if (k < 0.5) { R(c, 8, yy, 4.2, hh, 0.8, Bl, 1.3); R(c, 19.8, yy, 4.2, hh, 0.8, Bl, 1.3); R(c, 1, yy + hh - 2.5, 30, 3.6, 1, O3, 1.2); }
      }
      if (q < 0.4) { R(c, 2, 13.4, 28, 3.6, 1, Bl, 1.2); const d = spr * 4.5; R(c, 12 - d, 11.6, 4.4, 7.2, 1.2, Bk, 1.2); R(c, 15.6 + d, 11.6, 4.4, 7.2, 1.2, Bk, 1.2); c.fillStyle = '#7a2e08'; c.fillRect(13 - d, 13.4, 2.4, 0.9); }
    } },
    // ---- Italy: pistachio gelato tin, scalloped metal lid, cherry knob; the knob twitches, the lid flips like a scoop ----
    it: { name: 'Italy', draw(c, p) {
      const P1 = '#bfe4ab', P2 = '#8dbe7c', Gy = '#c9ced8', Ch = '#d7263d';
      const tw = seg(p, 0, 0.25), fl = io(seg(p, 0.18, 1));
      R(c, 3, 9.5, 26, 22, 2.5, P1);
      c.fillStyle = 'rgba(80,140,70,0.25)'; for (const x of [8, 13, 19, 24]) c.fillRect(x, 13, 1.6, 16);
      shine(c, 5, 27.5, 22, 1.2);
      if (fl > 0.15) E(c, 16, 10.4, 11.5, 2.4, 0, HOLE, 1.2);
      const lid = () => {
        c.beginPath(); c.moveTo(2, 9); c.lineTo(2, 7); c.quadraticCurveTo(2, 3.6, 6, 3.6); c.lineTo(26, 3.6); c.quadraticCurveTo(30, 3.6, 30, 7); c.lineTo(30, 9);
        for (let i = 6; i > 0; i--) { const x0 = 2 + i * 28 / 6, x1 = x0 - 28 / 6; c.quadraticCurveTo((x0 + x1) / 2, 13.4, x1, 9); }
        c.closePath(); fs(c, Gy); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(5, 5, 22, 1.2);
        L(c, [[16, 3.4], [17.5, 0.2]], '#3f6a24', 1.1); O(c, 16, 2.4 - 0.3, 2.6, Ch, 1.3); O(c, 15.2, 1.4, 0.7, 'rgba(255,255,255,0.7)', 0);
      };
      const cx = 16 - fl * 9, cy = 7 - Math.sin(fl * PI) * 9 + fl * 0.5, s = 1 - fl * 0.25;
      rot(c, cx, cy, fl * (PI - 0.35) + Math.sin(tw * PI * 4) * 0.12 * (1 - fl), () => { c.translate(cx - 16 * s, cy - 7 * s); c.scale(s, s); lid(); });
    } },
    // ---- Kenya: russet tea chest, green metal lid with hinges, brass leaf clasp; the leaf swings up and fans the lid ----
    ke: { name: 'Kenya', draw(c, p) {
      const W1 = '#a8623a', W2 = '#7a4226', Gn = '#3e8e41', Gn2 = '#286230', Au = '#f2c23a';
      const sw = ease(seg(p, 0, 0.55)), q = ease(seg(p, 0.25, 0.9)), hang = io(seg(p, 0.6, 1));
      lidBack(c, q, 1.5, 12.5, 29, Gn2, 10);
      R(c, 2, 12, 28, 19.5, 2, W1);
      c.fillStyle = W2; c.fillRect(3, 18, 26, 1); c.fillRect(3, 24.5, 26, 1); c.fillRect(6.5, 13, 1, 18); c.fillRect(24.5, 13, 1, 18);
      if (q > 0) mouth(c, 4, 12, 24, 3);
      lidFront(c, q, 1.5, 3.8, 29, 9, Gn, yy => { for (const x of [6.5, 22.5]) { R(c, x, yy, 3.2, 9, 0.8, Gn2, 1.1); O(c, x + 1.6, yy + 2.5, 0.9, Au, 0.8); O(c, x + 1.6, yy + 6.4, 0.9, Au, 0.8); } shine(c, 11, yy + 1.4, 10, 1.2); R(c, 14, yy + 7.2, 4, 4.4, 1, Au, 1.1); });
      const x = 16 + hang * 9, y = 23 - sw * 21 + hang * 14, a = Math.sin(sw * PI * 2) * 0.5 * (1 - hang) + hang * 0.35;
      rot(c, x, y + 5, a, () => {
        c.beginPath(); c.moveTo(x, y + 5); c.quadraticCurveTo(x - 6.4, y, x, y - 6); c.quadraticCurveTo(x + 6.4, y, x, y + 5); fs(c, Au);
        L(c, [[x, y + 4], [x, y - 4.4]], '#a8741a', 0.9); L(c, [[x, y + 5], [x, y + 7.4]], '#a8741a', 1.3);
      });
    } },
    // ---- Australia: plum beach cooler, shell toggle, two orange zip tabs; the tabs race apart and the flap whips up ----
    au: { name: 'Australia', draw(c, p) {
      const P1 = '#8a3f78', P2 = '#5d2552', P3 = '#b467a3', Cr = '#f7e8cf', Or = '#f28a2e';
      const zip = ease(seg(p, 0, 0.4)), wh = seg(p, 0.25, 0.8), col = ease(seg(p, 0.6, 1));
      const top = 7 + col * 3;
      if (wh > 0.5 && col < 1) { const h = (wh - 0.5) * 2 * 10 * (1 - col); c.beginPath(); c.moveTo(3, top + 1); c.quadraticCurveTo(10, top - h - 3, 16, top - h); c.quadraticCurveTo(22, top - h + 3, 29, top + 1); c.closePath(); fs(c, P3); }
      c.beginPath(); c.moveTo(2, top + 4); c.quadraticCurveTo(2, top, 6, top); c.quadraticCurveTo(16, top + col * 3, 26, top); c.quadraticCurveTo(30, top, 30, top + 4); c.lineTo(30, 28); c.quadraticCurveTo(30, 31.5, 26, 31.5); c.lineTo(6, 31.5); c.quadraticCurveTo(2, 31.5, 2, 28); c.closePath(); fs(c, P1);
      shine(c, 4.5, 28.4, 23, 1);
      if (wh > 0) { c.beginPath(); c.moveTo(5, top + 1.2); c.quadraticCurveTo(16, top + 1.2 + col * 3, 27, top + 1.2); c.lineTo(27, top + 3.6); c.quadraticCurveTo(16, top + 3.6 + col * 3, 5, top + 3.6); c.closePath(); fs(c, HOLE, 1.2); }
      L(c, [[4, top + 1.4], [28, top + 1.4]], 'rgba(255,255,255,0.35)', 0.8);
      const fh = wh < 0.5 ? 13 * (1 - wh * 2) : 0;
      if (fh > 0.5) { c.beginPath(); c.moveTo(2.5, top + 1); c.lineTo(29.5, top + 1); c.lineTo(29.5, top + fh - 3); c.quadraticCurveTo(16, top + fh + 3, 2.5, top + fh - 3); c.closePath(); fs(c, P3); }
      const shell = (x, y, a, s) => rot(c, x, y, a, () => { for (let i = 0; i < 5; i++) { const a0 = PI + i * PI / 5, a1 = a0 + PI / 5; G(c, [[x, y + 1.5 * s], [x + Math.cos(a0) * 5 * s, y + Math.sin(a0) * 5 * s], [x + Math.cos(a1) * 5 * s, y + Math.sin(a1) * 5 * s]], Cr, 1); } R(c, x - 1.8 * s, y, 3.6 * s, 2.6 * s, 0.8, Cr, 1); });
      if (fh > 4) shell(16, top + fh - 3.5, 0, 1);
      const t1 = 12 - zip * 8, t2 = 20 + zip * 8;
      R(c, t1 - 1.4, top - 1, 2.8, 5, 1, Or, 1.1); R(c, t2 - 1.4, top - 1, 2.8, 5, 1, Or, 1.1);
      if (col > 0.3) shell(t2 + 1, top + 8, PI / 2, 0.8 * col);
    } },
    // ---- Iceland: fitted charcoal basalt, turquoise enamel lid, white steam-curl handle; one fat puff lifts the lid ----
    is: { name: 'Iceland', draw(c, p) {
      const S1 = '#454b58', S2 = '#5a6273', S3 = '#252931', Tq = '#36c9c2', Tq2 = '#1d8e89';
      const un = seg(p, 0, 0.4), lift = ease(seg(p, 0.15, 0.6)), set = io(seg(p, 0.55, 1));
      R(c, 2, 8, 28, 23.5, 2, S3);
      const st = [[[3, 9], [12, 9], [11, 16], [3, 15]], [[13, 9], [22, 9], [21, 15], [12, 16]], [[23, 9], [29, 9], [29, 16], [22, 15]], [[3, 16.5], [9, 17], [10, 24], [3, 23.5]], [[11, 17], [20, 16.5], [21, 23.5], [11, 24.5]], [[22, 16.5], [29, 17.5], [29, 24], [22, 24.5]], [[3, 25], [14, 25.5], [13, 30.5], [3, 30.5]], [[15, 25.5], [29, 25.5], [29, 30.5], [14.5, 30.5]]];
      st.forEach((s, i) => G(c, s, i % 3 === 1 ? S2 : S1, 1));
      if (lift > 0) mouth(c, 4, 7.2, 24, 3.6);
      if (lift > 0 && set < 1) alpha(c, 1 - set, () => { for (const [x, r] of [[10, 3.4], [16, 4.6], [22, 3.4]]) O(c, x, 8 - lift * 3, r * lift, '#ffffff', 1.2); });
      const ly = 4 - lift * 9 + set * 9, la = set * 1.25;
      rot(c, 16, ly + 2.8, la, () => { R(c, 1 + set * 6, ly, 30 - set * 12, 5.6, 2, Tq); shine(c, 3 + set * 6, ly + 1, 26 - set * 12, 1.1); if (set < 0.2) E(c, 16, ly + 2.4, 2, 1, 0, Tq2, 1); });
      const hx = 16, hy = ly - 0.4;
      if (set < 0.5) { const turns = 1.6 * (1 - un); c.beginPath(); for (let i = 0; i <= 16; i++) { const a = -PI / 2 + i / 16 * turns * TAU, r = 0.6 + i / 16 * 3; c[i ? 'lineTo' : 'moveTo'](hx + Math.cos(a) * r * (1 + un), hy - 3.2 + Math.sin(a) * r - un * 2); } c.strokeStyle = K; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.stroke(); }
      else rope(c, [[20, 8.6], [27, 8.6]], '#ffffff', 1.6);
    } },
    // ---- The Moon: chamfered silver sample vault with a gold camera-iris hatch; the blades retract ----
    moon: { name: 'The Moon', draw(c, p) {
      const S1 = '#c4cbd7', S2 = '#8c95a6', S3 = '#eef2f7', Au = '#f2c53a', Au2 = '#b98a14';
      const ir = io(seg(p, 0, 0.75));
      G(c, [[6.5, 3], [25.5, 3], [30, 7.5], [30, 27], [25.5, 31.5], [6.5, 31.5], [2, 27], [2, 7.5]], S1);
      L(c, [[6, 5], [26, 5]], S3, 1.2);
      for (const [x, y, sx, sy] of [[2, 3, 1, 1], [30, 3, -1, 1], [2, 31.5, 1, -1], [30, 31.5, -1, -1]]) { G(c, [[x + sx * 4.5, y], [x + sx * 9, y], [x, y + sy * 9], [x, y + sy * 4.5]], S2, 1.1); O(c, x + sx * 3.6, y + sy * 3.6, 0.9, S3, 0.8); }
      O(c, 16, 17.5, 9.6, Au);
      const h = ir * 6.6;
      O(c, 16, 17.5, 7.4, Au2, 1);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + ir * 0.9; c.beginPath(); c.moveTo(16 + Math.cos(a) * h, 17.5 + Math.sin(a) * h); c.quadraticCurveTo(16 + Math.cos(a + 0.6) * 5, 17.5 + Math.sin(a + 0.6) * 5, 16 + Math.cos(a + 1.05) * 7.4, 17.5 + Math.sin(a + 1.05) * 7.4); c.strokeStyle = K; c.lineWidth = 1.1; c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(16, 17.5, 8.4, PI * 1.05, PI * 1.45); c.lineTo(16, 17.5); c.closePath(); c.fill();
      if (h > 0.3) { O(c, 16, 17.5, h, '#05070d', 1.2); if (h > 3) O(c, 16, 18.5, h * 0.55, '#111622', 0); }
      else O(c, 16, 17.5, 1.2, K, 0);
    } },
    // ---- Antarctica: blue insulated sample case, a white ice core in its riveted porthole; the core tips the hatch ----
    aq: { name: 'Antarctica', draw(c, p) {
      const I1 = '#86c9ef', I2 = '#4f9acb', I3 = '#d4f0ff', St = '#9aa6b5', St2 = '#5f6b7a';
      const rise = ease(seg(p, 0, 0.6)), q = ease(seg(p, 0.35, 1));
      lidBack(c, q, 1, 9, 30, I2, 10);
      R(c, 2, 8, 28, 23.5, 2.5, I1);
      for (const [x, y] of [[0.6, 13], [0.6, 22], [27.8, 13], [27.8, 22], [8, 28.6], [20.4, 28.6]]) R(c, x, y, 3.6, 3.6, 0.6, I2, 1.1);
      shine(c, 4.5, 26.5, 20, 1.2);
      if (q > 0) mouth(c, 4, 8, 24, 3.2);
      O(c, 16, 19.5, 7.6, St);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; O(c, 16 + Math.cos(a) * 6.3, 19.5 + Math.sin(a) * 6.3, 0.7, St2, 0); }
      if (p < 0.98) {
        O(c, 16, 19.5, 5, '#1d3a66', 1.2);
        const sy = 19.5 - rise * 15;
        c.save(); if (rise < 0.05) { c.beginPath(); c.arc(16, 19.5, 5, 0, TAU); c.clip(); }
        rot(c, 16, sy, 0.7 + rise * 0.6, () => R(c, 14.4, sy - 5, 3.6, 10, 1.4, '#f4fbff', 1.1));
        c.restore();
      } else {
        c.save(); c.globalCompositeOperation = 'destination-out'; O(c, 16, 19.5, 5, '#000', 0); c.restore();
        c.beginPath(); c.arc(16, 19.5, 5, 0, TAU); c.strokeStyle = K; c.lineWidth = 1.2; c.stroke();
        c.beginPath(); c.arc(16, 19.5, 3.8, PI * 1.1, PI * 1.45); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 0.9; c.stroke();
      }
      lidFront(c, q, 1, 3.6, 30, 5.2, I3);
    } },
    // ---- World 22: indigo rule binder, magenta edge, two offset cyan tabs; the tabs swap and the cover opens the wrong way ----
    w22: { name: 'World 22', draw(c, p) {
      const Pk = '#e8336f', Pk2 = '#b01f52', Nv = '#2a1d82', Cy = '#33e2ea', Cr = '#f6efdc';
      const sw = io(seg(p, 0, 0.45)), op = io(seg(p, 0.3, 1));
      const back = [[5, 3], [30, 3], [30, 31.5], [5, 31.5]].map((q, i) => lp(q, [[0.5, 6], [8.5, 3.5], [17.5, 31.5], [13.5, 31.5]][i], op));
      const front = [[8, 3], [30.5, 3], [30.5, 31.5], [8, 31.5]].map((q, i) => lp(q, [[23.5, 3.5], [31.5, 6], [18.5, 31.5], [14.5, 31.5]][i], op));
      G(c, back, Pk2);
      if (op < 0.6) alpha(c, 1 - op / 0.6, () => { R(c, 6, 4, 4.5, 27, 1, Cr, 1.1); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(7.4, 5, 0.6, 25); c.fillRect(8.8, 5, 0.6, 25); });
      if (op > 0.4) alpha(c, (op - 0.4) / 0.6, () => { c.beginPath(); c.moveTo(15.5, 30); c.quadraticCurveTo(10, 14, 16, 8); c.quadraticCurveTo(22, 12, 19, 22); c.quadraticCurveTo(17.5, 26, 17.5, 30); c.closePath(); fs(c, Cr, 1.3); });
      G(c, front, Pk);
      const cx = front.reduce((s, q) => s + q[0], 0) / 4, cy = front.reduce((s, q) => s + q[1], 0) / 4;
      G(c, front.map(q => [cx + (q[0] - cx) * 0.8, cy + (q[1] - cy) * 0.88]), Nv, 1.1);
      alpha(c, 1 - seg(op, 0.4, 0.8), () => { const y1 = 7.5 + sw * 11.5, y2 = 19 - sw * 11.5, bx = Math.sin(sw * PI) * 3; R(c, 2 - bx, y1, 7.5, 6, 1.4, Cy, 1.4); R(c, 2 + bx * 0.5, y2, 7.5, 6, 1.4, Cy, 1.4); });
    } },
    // ---- The Red-Eye: midnight cabin panel, ivory window rim, gold moon behind the shade; the shade flips up ----
    eye: { name: 'The Red-Eye', draw(c, p) {
      const N1 = '#1f3c8e', Cr = '#fbf3dc', Mo = '#ffc21a', Sky = '#0d1a45', Sh = '#d8dbe4';
      const blink = seg(p, 0, 0.3), fl = io(seg(p, 0.12, 0.85));
      R(c, 11, 1.5, 10, 5, 1.5, N1, 1.3);
      R(c, 2.5, 4.5, 27, 27, 4.5, N1); shine(c, 6, 6, 20, 1.2);
      R(c, 6.5, 8.5, 19, 19.5, 5, Cr); R(c, 9, 11, 14, 14.5, 3.5, Sky, 1.2);
      c.save(); rr(c, 9, 11, 14, 14.5, 3.5); c.clip();
      alpha(c, 1 - blink, () => { c.beginPath(); c.arc(15, 18.8, 5.2, 0, TAU); c.arc(18, 16.6, 4.4, 0, TAU, true); c.fillStyle = Mo; c.fill('evenodd'); });
      if (p > 0.6) { c.fillStyle = 'rgba(255,255,255,0.7)'; for (const [x, y] of [[12, 15], [19.5, 21.5], [17, 13.5]]) c.fillRect(x, y, 0.8, 0.8); }
      const sh = 5 * (1 - fl);
      if (sh > 0.3) { c.fillStyle = Sh; c.fillRect(9, 11, 14, sh); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(9, 11 + sh - 0.8, 14, 0.8); }
      c.restore();
      if (fl > 0) { const y = 11 + sh - fl * 15, r = 1.6 + fl * 1.2; R(c, 8.5, y - r, 15, r * 2, r, Sh, 1.2); E(c, 23.5, y, r * 0.6, r, 0, '#b9bdc9', 1); }
    } },
    // ---- Festival Fields: raspberry speaker cabinet, one plum woofer, yellow corner caps; the cone punts, then hangs like a jaw ----
    fest: { name: 'Festival Fields', draw(c, p) {
      const R1 = '#d93b6e', R2 = '#a3244e', Pu = '#6c3fa3', Pu2 = '#4a2878', Ye = '#ffd23a';
      const bul = Math.sin(seg(p, 0, 0.4) * PI), jaw = io(seg(p, 0.4, 1));
      R(c, 5, 28.5, 4.6, 3.4, 1, R2); R(c, 22.4, 28.5, 4.6, 3.4, 1, R2);
      R(c, 2, 2.5, 28, 27.5, 2.5, R1); shine(c, 5, 4.4, 22, 1.2);
      for (const [x, y, sx, sy] of [[2, 2.5, 1, 1], [30, 2.5, -1, 1], [2, 30, 1, -1], [30, 30, -1, -1]]) G(c, [[x, y], [x + sx * 6, y], [x, y + sy * 6]], Ye, 1.2);
      O(c, 16, 16.5, 9.4, HOLE, 1.2);
      // the woofer hinged at its lower edge: it drops forward like a loose jaw (lighter, so it reads against the hole)
      const r = 9 * (1 + bul * 0.16), ry = r * (1 - jaw * 0.62), yy = jaw > 0 ? 25.5 + jaw * 3 - ry : 16.5;
      E(c, 16, yy, r, ry, 0, mix(Pu, '#b48ae8', jaw * 0.6));
      E(c, 16, yy, r * 0.62, ry * 0.62, 0, mix(Pu2, '#8a5cc8', jaw * 0.6), 1.1); E(c, 16, yy, r * 0.26, ry * 0.26, 0, '#c9a8f0', 1);
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(16, yy, r * 0.85, ry * 0.85, 0, PI * 1.1, PI * 1.4); c.lineTo(16, yy); c.closePath(); c.fill();
    } },
    // ---- Table for Two (36, a hidden land): a midnight-blue butter dish on a red-striped foot, a cream dome lid with
    // an olive for a knob; hit, the olive knob jumps and the lid tips off to the right; empty, the lid lies tipped
    // against the dish's right side, the dish open ----
    table: { name: 'Table for Two', draw(c, p) {
      const Nv = '#2a3a8a', Nv2 = '#1a2660', Cr = '#fbf3e0', Cr2 = '#e4d6bc', Rd = '#e0403a', Ol = '#7d8a2a';
      const tip = io(seg(p, 0.15, 1)), hop = Math.sin(seg(p, 0, 0.3) * PI);
      // the red-and-cream striped foot
      R(c, 6, 27, 20, 4.5, 1.5, Cr); for (let k = 0; k < 4; k++) { c.fillStyle = Rd; c.fillRect(7.5 + k * 5, 27.5, 2.5, 3.5); }
      // the dish
      R(c, 3, 17, 26, 11, 3, Nv); shine(c, 6, 19, 20, 1.2); L(c, [[3.5, 18.6], [28.5, 18.6]], Nv2, 1);
      if (tip > 0.3) { R(c, 5, 15.5, 22, 3, 1.5, '#3a2a20', 1); }
      // the dome lid: lifts, then tips off to the right and comes to rest leaning on the dish
      const ang = tip * 1.25, px = 16 + tip * 11, py = 17 - hop * 2 - Math.sin(tip * PI) * 4 + tip * 6;
      rot(c, px, py, ang, () => {
        c.beginPath(); c.moveTo(px - 12, py); c.quadraticCurveTo(px - 12, py - 11, px, py - 11); c.quadraticCurveTo(px + 12, py - 11, px + 12, py); c.closePath(); fs(c, Cr);
        c.fillStyle = Cr2; c.fillRect(px - 12, py - 1.6, 24, 1.6);
        O(c, px, py - 13.5 - hop * 2.5, 3.6, Ol); c.fillStyle = Rd; c.beginPath(); c.arc(px + 1.4, py - 14 - hop * 2.5, 1.2, 0, TAU); c.fill();
      });
    } },
    // ---- Lost & Found: worn ochre leather suitcase, mismatched corner caps, a big blank tag; catches pop, the tag whips over ----
    // ---- The Spare Bone Quarry (hidden land A12): a petrol-green fossil specimen case, bone-white strap latch, a bone
    // across the front pinned by a persimmon knob; hit: the knob pops, the bone swings down and the lid flips up;
    // empty: the lid stands open over a dark case, the bone hangs from the front ----
    bone: { name: 'The Spare Bone Quarry', draw(c, p) {
      const G1 = '#2e6a5a', G2 = '#1e4a40', G3 = '#3e8a74', Bn = '#f4ead2', Pe = '#f06a2a';
      const sw = io(seg(p, 0, 0.45)), q = ease(seg(p, 0.25, 1));
      lidBack(c, q, 3, 11, 26, G2, 10);
      R(c, 3, 11, 26, 19, 2.5, G1); shine(c, 6, 13, 20, 1.1);
      R(c, 2, 27, 6, 4, 1, G2); R(c, 24, 27, 6, 4, 1, G2);
      if (q > 0) R(c, 5, 11, 22, 3 + q * 4, 1.2, HOLE, 1.1);
      if (q <= 0.5) { R(c, 2, 6, 28, 7, 2.5, G3); R(c, 14, 4.5, 4, 8, 1, Bn, 1.2); }
      // the bone: across the front, pinned in the middle; swinging down from its right end when hit
      rot(c, 24, 20, sw * 1.15, () => { R(c, 8, 18.6, 16, 3, 1.3, Bn, 1.1); for (const x of [8, 24]) { O(c, x, 18.6, 2.1, Bn, 1); O(c, x, 21.6, 2.1, Bn, 1); } });
      if (sw < 0.3) O(c, 16, 20.1, 2.6, Pe, 1.1); else O(c, 16 + sw * 3, 20.1 - sw * 9, 2.4 * (1 - sw * 0.4), Pe, 1);
    } },
    lost: { name: 'Lost & Found', draw(c, p) {
      const B1 = '#b07338', B2 = '#7a461d', B3 = '#d29a5c', Tl = '#2fb3a8', Or = '#f08a2e', Cr = '#f6ead0', Au = '#f2c23a';
      const c1 = seg(p, 0, 0.18), c2 = seg(p, 0.12, 0.3), wh = io(seg(p, 0.2, 0.8)), q = ease(seg(p, 0.35, 1));
      lidBack(c, q, 2, 9, 28, B2, 10);
      if (q <= 0.5) qrope(c, 12, 8, 16, -1, 20, 8, Tl, 2.2);
      R(c, 2, 7.5, 28, 24, 3.5, B1);
      E(c, 9, 22, 3, 2, 0.3, B3, 0); E(c, 23, 27, 2.4, 1.4, -0.2, B3, 0); E(c, 21, 17, 1.6, 1, 0, B3, 0);
      L(c, [[2.5, 13.5], [29.5, 13.5]], B2, 1);
      if (q > 0) { R(c, 4, 7.5, 24, 6 * q + 1, 1.5, '#4a2a1a', 1.2); }
      for (const [x, y, sx, sy, col] of [[2, 7.5, 1, 1, Tl], [30, 7.5, -1, 1, Or], [2, 31.5, 1, -1, Or], [30, 31.5, -1, -1, Tl]]) { c.beginPath(); c.moveTo(x, y + sy * 5.5); c.lineTo(x, y + sy * 2); c.quadraticCurveTo(x, y, x + sx * 2, y); c.lineTo(x + sx * 5.5, y); c.closePath(); fs(c, col, 1.2); }
      for (const [x, k] of [[7.5, c1], [21, c2]]) rot(c, x + 1.8, 12, -k * 1.2, () => R(c, x, 11.6 - k * 1.5, 3.6, 3.6, 0.8, Au, 1.1));
      const px = 16, py = q > 0.5 ? 10 : 6.5, a = -0.9 - wh * (TAU - 0.9), len = 11 - q * 2;
      const tx = px - Math.sin(a) * len, ty = py + Math.cos(a) * len;
      L(c, [[px, py], [tx, ty]], '#3a2a1a', 0.8);
      rot(c, tx, ty, -a * 0.25 + (q > 0.9 ? 0.1 : 0), () => { R(c, tx - 3.5, ty - 1, 7, 9, 1.5, Cr, 1.2); O(c, tx, ty + 0.8, 0.8, '#3a2a1a', 0); });
    } }
    ,
    // ---- Wrong Side of the Wash (26, hidden land): a folded cream handkerchief parcel clamped by one red clothes
    //      peg; the hit pops the peg sideways and the cloth springs open into a bow, the peg lying across it ----
    wash: { name: 'Wrong Side of the Wash', draw(c, p) {
      const Cr = '#f4ead2', Cr2 = '#e2d4b0', Nv = '#3e4f8e', Rd = '#e8442e', Rd2 = '#b8301e';
      const q = io(seg(p, 0.15, 0.85)), pop = Math.sin(seg(p, 0, 0.6) * PI);
      const pts = [[4 - 3 * q, 7 - 4 * q], [16, 7 + 5 * q], [28 + 3 * q, 7 - 4 * q], [28 - 3 * q, 18], [28 + 3 * q, 29 + 2 * q], [16, 29 - 5 * q], [4 - 3 * q, 29 + 2 * q], [4 + 3 * q, 18]];
      G(c, pts, Cr);
      // the stitched hem a little inside the edge, the soft folds toward the middle
      c.save(); c.setLineDash([1.6, 1.4]); c.beginPath(); pts.forEach((v, i) => { const x = 16 + (v[0] - 16) * 0.8, y = 18 + (v[1] - 18) * 0.8; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.strokeStyle = Nv; c.lineWidth = 0.8; c.stroke(); c.restore();
      c.strokeStyle = Cr2; c.lineWidth = 0.9; for (const [x, y] of [[8, 10], [24, 10], [8, 26], [24, 26]]) { c.beginPath(); c.moveTo(16, 18); c.lineTo(16 + (x - 16) * (0.6 + 0.3 * q), 18 + (y - 18) * 0.6); c.stroke(); }
      // the peg: upright and clamping (closed), popping up and turning (the hit), lying across the open cloth (empty)
      const a = -q * PI / 2, py = 17 - pop * 6;
      rot(c, 16, py, a, () => {
        G(c, [[12.8, py + 13], [13.6, py - 13], [15.6, py - 13], [15.4, py + 13]], Rd);
        G(c, [[19.2, py + 13], [18.4, py - 13], [16.4, py - 13], [16.6, py + 13]], Rd);
        c.fillStyle = Rd2; c.fillRect(13.8, py - 2, 4.4, 1);
        O(c, 16, py, 2, '#e8e2d4', 1);
      });
    } }
  };

  // ---- painting the states ----
  const HIT = 0.34, NHIT = 8, PAD_T = [TPAD, TPAD, TPAD, TPAD], PAD_H = [10, 22, 10, 6];
  const BOB = [0, -0.5, -0.9, -0.5], STAR = [2.4, 3.3, 4.1, 3.1];
  function paint(land, st, k, f, S, pad) {
    const W = TS + pad[0] + pad[2], H = TS + pad[1] + pad[3], cw = Math.ceil(W * S), ch = Math.ceil(H * S);
    const art = makeCanvas(cw, ch), a = art.getContext('2d');
    a.setTransform(S, 0, 0, S, pad[0] * S, pad[1] * S); a.lineJoin = 'round'; a.lineCap = 'round';
    if (st === 'closed') a.translate(0, BOB[f]);
    const p = st === 'closed' ? 0 : st === 'empty' ? 1 : k;
    try { LANDS[land].draw(a, p); } catch (e) { /* a drawing slip leaves the canvas as drawn so far */ }
    a.setTransform(1, 0, 0, 1, 0, 0);
    if (st === 'closed') {
      // the shared shine: a bright band sweeping across the box over the four idle frames
      a.save(); a.globalCompositeOperation = 'source-atop'; a.setTransform(S, 0, 0, S, pad[0] * S, pad[1] * S);
      const sx = -6 + f * 12; a.fillStyle = 'rgba(255,255,255,0.32)'; a.beginPath(); a.moveTo(sx, -2); a.lineTo(sx + 6, -2); a.lineTo(sx - 4, 34); a.lineTo(sx - 10, 34); a.fill(); a.restore();
    }
    if (st === 'empty') {
      // spent: greyer and darker, a touch cool
      try {
        const d = a.getImageData(0, 0, cw, ch), px = d.data;
        for (let i = 0; i < px.length; i += 4) { if (!px[i + 3]) continue; const l = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]; px[i] = (px[i] * 0.4 + l * 0.6) * 0.66; px[i + 1] = (px[i + 1] * 0.4 + l * 0.6) * 0.66; px[i + 2] = (px[i + 2] * 0.4 + l * 0.6) * 0.72 + 6; }
        a.putImageData(d, 0, 0);
      } catch (e) { a.fillStyle = 'rgba(30,24,40,0.4)'; a.globalCompositeOperation = 'source-atop'; a.fillRect(0, 0, cw, ch); a.globalCompositeOperation = 'source-over'; }
    }
    const out = makeCanvas(cw, ch), o = out.getContext('2d');
    if (st === 'closed') {
      // the shared glow: a warm gold halo round the outline
      o.shadowColor = 'rgba(255,212,100,0.95)'; o.shadowBlur = (3 + f * 0.9) * S; o.drawImage(art, 0, 0); o.shadowBlur = 0; o.shadowColor = 'transparent';
    } else if (st === 'empty') {
      // a faint pale keyline so the spent box still reads as a solid block on a dark level
      const sil = makeCanvas(cw, ch), sx = sil.getContext('2d'); sx.drawImage(art, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgba(255,244,226,0.55)'; sx.fillRect(0, 0, cw, ch);
      const r = 0.9 * S; for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; o.drawImage(sil, Math.cos(an) * r, Math.sin(an) * r); }
    }
    o.drawImage(art, 0, 0);
    o.setTransform(S, 0, 0, S, pad[0] * S, pad[1] * S);
    if (st === 'closed') star4(o, 28.4, 2.2 + BOB[f], STAR[f], '#fffbe6', 1.1);
    if (st === 'hit' && k < 0.6) { const q = k / 0.6; o.globalAlpha = 1 - q; star4(o, 28.4, 2.2 - q * 6, 4 + q * 5, '#fffbe6', 1.1); star4(o, 4, 3 - q * 5, 2 + q * 3, '#fffbe6', 1); o.globalAlpha = 1; }
    return out;
  }

  const sets = new Map();
  const BA = {
    LANDS, HIT, NHIT, PAD_H, cur: null, stats: { built: 0, hits: 0, overlay: 0 },
    has(land) { return !!LANDS[land]; },
    paint,
    // the land's states at scale S, painted once: { closed: [4], hit: [NHIT], empty }
    set(land, S) {
      if (!LANDS[land]) return null;
      const key = land + '@' + S.toFixed(3);
      let s = sets.get(key);
      if (s) return s;
      if (sets.size >= 3) { const k0 = sets.keys().next().value; if (typeof releaseCanvases === 'function') releaseCanvases(sets.get(k0)); sets.delete(k0); }
      s = { closed: [0, 1, 2, 3].map(f => paint(land, 'closed', 0, f, S, PAD_T)), hit: [], empty: paint(land, 'empty', 1, 0, S, PAD_T) };
      for (let i = 0; i < NHIT; i++) s.hit.push(paint(land, 'hit', (i + 1) / NHIT, 0, S, PAD_H));
      sets.set(key, s); this.stats.built++;
      return s;
    },
    landOf(g) {
      if (!g || !g.level || !g.level.tour) return null;
      if (g._boxLevel !== g.level) { g._boxLevel = g.level; const C = g.level.country ? { id: g.level.country } : (typeof Tour !== 'undefined' ? Tour.countryOf(g.id) : null); g._boxLand = C && LANDS[C.id] ? C.id : null; }
      return g._boxLand;
    },
    // boxes of this area opened less than HIT ago (a box only counts as hit when its bump was seen: a room closing its
    // unchosen boxes is not a hit)
    live(g) {
      const L = g._boxHits; if (!L || !L.length) return null;
      const A = g.area; let out = null;
      for (let i = L.length - 1; i >= 0; i--) {
        const h = L[i], age = g.t - h.t0;
        if (h.A !== A) continue;
        if (!(age >= 0 && age < HIT) || A.tiles[h.k] !== T.USED) { L.splice(i, 1); continue; }
        if (h.seen === undefined) { const tx = h.k % A.W, ty = (h.k / A.W) | 0; h.seen = (A.bumps || []).some(b => b.tx === tx && b.ty === ty); }
        if (!h.seen) { L.splice(i, 1); continue; }
        (out || (out = [])).push(h);
      }
      return out;
    }
  };

  // ---- hooks ----
  const overlays = new WeakMap();
  const get0 = TileArt.get;
  TileArt.get = function (themeKey, S) {
    const base = get0.call(this, themeKey, S);
    const land = BA.cur; if (!land) return base;
    const s = BA.set(land, S); if (!s) return base;
    let o = overlays.get(base);
    if (!o || o.__set !== s) { o = Object.create(base); o.qblock = s.closed; o.used = s.empty; o.__set = s; overlays.set(base, o); }
    BA.stats.overlay++;
    return o;
  };
  const set0 = Play.prototype.setTile;
  Play.prototype.setTile = function (tx, ty, t) {
    const A = this.area;
    if (t === T.USED && A && A.tiles && tx >= 0 && ty >= 0 && tx < A.W && ty < A.H) {
      const k = ty * A.W + tx, was = A.tiles[k];
      if (was === T.QBLOCK || was === T.HIDDEN || was === T.QBRICK) { const L = this._boxHits || (this._boxHits = []); L.push({ A, k, t0: this.t || 0 }); if (L.length > 24) L.shift(); }
    }
    return set0.apply(this, arguments);
  };
  const draw0 = Play.prototype.drawTiles;
  Play.prototype.drawTiles = function (ctx, camX, camY, fg) {
    const land = BA.landOf(this);
    if (!land) return draw0.apply(this, arguments);
    const A = this.area, live = fg ? null : BA.live(this);
    BA.cur = land;
    if (live) for (const h of live) A.tiles[h.k] = T.EMPTY;
    try { return draw0.apply(this, arguments); }
    finally {
      if (live) for (const h of live) A.tiles[h.k] = T.USED;
      BA.cur = null;
      if (live) {
        const S = Game.S, s = BA.set(land, S), [pl, pt, pr, pb] = PAD_H;
        for (const h of live) {
          const x = h.k % A.W, y = (h.k / A.W) | 0;
          if (A.hide && A.hide[h.k] === 1) continue;
          const b = (A.bumps || []).find(b2 => b2.tx === x && b2.ty === y), bump = b ? Math.sin((1 - b.t / 0.18) * PI) * (b.amp || 8) : 0;
          const i = Math.min(NHIT - 1, Math.floor((this.t - h.t0) / HIT * NHIT));
          const dx = Math.round((x * TS - camX) * S), dy = Math.round((y * TS - camY) * S), dw = Math.round(((x + 1) * TS - camX) * S) - dx, u = dw / TS;
          ctx.drawImage(s.hit[i], dx - pl * u, dy - (pt + bump) * u, (TS + pl + pr) * u, (TS + pt + pb) * u);
          BA.stats.hits++;
        }
      }
    }
  };
  return BA;
})();
try { if (BoxArt) window.BRADY_BOXES = BoxArt; } catch (e) { /* not in a browser */ }
