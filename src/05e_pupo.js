/* ============================================================
   Pupo: Chinka-O's giant pet sloth, and Brady-O's sidekick and
   steed (Nov 2026; story: docs/design/STORY_PIWI.md, gameplay:
   docs/design/PUPO.md). Piwi took Chinka-O and left Pupo behind,
   so he sets off with Brady-O to get her back. Slow, sweet,
   deadpan. He pokes belly buttons, which he calls "pupos" (that is
   how he got his name); Piwi is wooden and has none.
   A chunky, huggable giant sloth, big enough for Brady-O to ride:
   shaggy tan fur, a cream face mask with the dark eye stripes, a
   pale belly with his own little pupo, three long claws a hand.
   His arms are drawn by Pupo.arm() at ANY length (a furry tube with
   tufts and rings along it and a hand on the end, pointing finger
   optional), so the stretch-arm mechanics and PUPO POWER! can be
   built on it. Code-drawn, feet-centre origin, facing +x; in the
   game it goes through Ink.around like Brady. Not referenced yet.
     Pupo.draw(ctx, { x, y, scale, facing, t, pose, rider, reach, angle })
       pose: idle | walk | ride | poke | stretch | happy | sad | power
       walk / ride are on all fours; ride calls rider(ctx, saddleX, saddleY) to draw Brady-O on his back
       (draw Brady with anim.state 'ride', his hips on the saddle point); stretch: reach (art units, default 90)
       and angle (radians from straight ahead, + is up)
     Pupo.saddle(t)                    the saddle point { x, y } for the walk cycle at time t
     Pupo.arm(ctx, x0, y0, x1, y1, o) one arm, shoulder to hand; o { w, col, point, t, ink }
     Pupo.head(ctx, x, y, s, t, mood) mood: calm | blink | happy | puzzled | sad | spiral
   ============================================================ */
const PUPO = {
  fur: '#b48c62', furSh: '#86643f', furDk: '#6e5032', furHi: '#d4b088', belly: '#e6cfaa', mask: '#f2e2c6', stripe: '#3e2c20',
  nose: '#2a1c16', claw: '#f4ead8', blush: 'rgba(255,120,130,0.55)', tear: '#7ad0ff', ink: '#1c1426',
  rainbow: ['#ff4f5a', '#ff9a2e', '#ffd23a', '#5ac85a', '#2aa6e8', '#8a5af0'],
  carpet: '#c8323e', carpetSh: '#8a1e2a', carpetGold: '#ffc83a', carpetBlue: '#1e5aa8', fringe: '#fff0d0',
  bow: '#ff4f93'
};
const Pupo = {
  C: PUPO,
  // a shaggy blob: an ellipse with a fringe of soft points
  shag(ctx, x, y, rx, ry, col, n, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.fillStyle = col; ctx.beginPath();
    const N = n || 18;
    for (let i = 0; i <= N; i++) { const a = i / N * TAU, k = i % 2 ? 1.0 : 1.09; const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // a hand at the end of an arm, pointing along `ang`; point: the index claw sticks straight out
  hand(ctx, x, y, ang, s, point) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (s && s !== 1) ctx.scale(s, s);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(0.5, 0, 5.4, 4.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.furSh; ctx.beginPath(); ctx.ellipse(0.5, 0, 4.4, 3.7, 0, 0, TAU); ctx.fill();
    const claw = (dy, len, curl) => {
      ctx.beginPath(); ctx.moveTo(3.4, dy);
      if (curl) ctx.quadraticCurveTo(3.4 + len * 0.8, dy, 3.4 + len * 0.55, dy + len * 0.6);
      else ctx.quadraticCurveTo(3.4 + len * 0.6, dy - 0.3, 3.4 + len, dy + 0.4);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.8; ctx.stroke(); ctx.strokeStyle = C.claw; ctx.lineWidth = 1.5; ctx.stroke();
    };
    // pointing: the index claw straight out along the top edge, the other two curled tight under it (never the
    // middle one alone: that would read as a rude gesture)
    if (point) { claw(-2.4, 9, false); claw(0.4, 3.6, true); claw(2.6, 3.4, true); }
    else { claw(-2.2, 6, true); claw(0, 6.6, true); claw(2.2, 6, true); }
    ctx.restore();
  },
  // one arm at any length: a furry tube, tufts on its upper edge, a ring every 9 units (so a long stretch reads as
  // stretched, not as a pole), and the hand
  arm(ctx, x0, y0, x1, y1, o) {
    o = o || {}; const C = PUPO, w = o.w || 7, col = o.col || C.fur, t = o.t || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    outlinedCapsule(ctx, x0, y0, x1, y1, w, col);
    // tufts along the side facing up
    const side = ny < 0 ? 1 : -1;
    ctx.fillStyle = col; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    for (let d = 7; d < L - 6; d += 7) {
      const bx = x0 + ux * d + nx * side * w * 0.45, by = y0 + uy * d + ny * side * w * 0.45;
      ctx.beginPath(); ctx.moveTo(bx - ux * 2.6, by - uy * 2.6); ctx.lineTo(bx + nx * side * 2.6 + ux * 0.8 + Math.sin(t * 2 + d) * 0.4, by + ny * side * 2.6 + uy * 0.8); ctx.lineTo(bx + ux * 2.6, by + uy * 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (L > 30) {
      ctx.strokeStyle = shade(col, -0.28); ctx.lineWidth = 1;
      for (let d = 12; d < L - 8; d += 9) { const cx = x0 + ux * d, cy = y0 + uy * d; ctx.beginPath(); ctx.moveTo(cx + nx * w * 0.42, cy + ny * w * 0.42); ctx.quadraticCurveTo(cx + ux * 1.6, cy + uy * 1.6, cx - nx * w * 0.42, cy - ny * w * 0.42); ctx.stroke(); }
    }
    Pupo.hand(ctx, x1, y1, Math.atan2(dy, dx), o.handScale || 1, o.point);
  },
  head(ctx, x, y, s, t, mood) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); if (s && s !== 1) ctx.scale(s, s);
    Pupo.shag(ctx, 0, 0, 7.6, 6.8, C.fur, 18);
    ctx.fillStyle = C.mask; ctx.beginPath(); ctx.ellipse(1.2, 0.8, 5.8, 4.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(0.4, -4.6, 4.4, 1.7, 0, 0, TAU); ctx.fill();
    const eyes = [[-1.8, -1], [3.6, 1]];
    if (mood === 'spiral') {
      // PUPO POWER eyes: flat, hard-edged rainbow rings with an ink spiral over them
      for (const [ex] of eyes) {
        for (let i = 0; i < 6; i++) { ctx.fillStyle = C.rainbow[(i + Math.floor(t * 8)) % 6]; ctx.beginPath(); ctx.arc(ex, 0, 2.9 - i * 0.45, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = C.ink; ctx.lineWidth = 0.55; ctx.beginPath();
        for (let a = 0; a < 12; a += 0.35) { const r = a * 0.24, px = ex + Math.cos(a + t * 9) * r, py = Math.sin(a + t * 9) * r; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(ex, 0, 2.95, 0, TAU); ctx.stroke();
      }
    } else {
      // the dark stripes that run back from his eyes (the sloth's built-in smile)
      ctx.fillStyle = C.stripe;
      for (const [ex, dir] of eyes) { ctx.beginPath(); ctx.ellipse(ex + dir * 1.0, mood === 'sad' ? 0.8 : 0.2, 2.6, 1.3, dir * (mood === 'sad' ? 0.35 : -0.35), 0, TAU); ctx.fill(); }
      const blink = mood === 'blink' || ((mood === 'calm' || !mood) && (t % 5) < 0.35);
      ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink;
      for (const [ex] of eyes) {
        if (mood === 'happy' || blink) { ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(ex, mood === 'happy' ? 0.6 : 0, 1.1, Math.PI * 1.1, Math.PI * 1.9, mood === 'happy'); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(ex, mood === 'sad' ? 0.4 : 0, 1.05, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 0.35, -0.35, 0.38, 0, TAU); ctx.fill(); ctx.fillStyle = C.ink; }
      }
      if (mood === 'sad') { ctx.fillStyle = C.tear; ctx.beginPath(); ctx.ellipse(4.4, 2.4 + (t % 2) * 1.5, 0.7, 1.0, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.4; ctx.stroke(); }
      if (mood === 'puzzled') { ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3.2, -2.6); ctx.lineTo(-0.6, -2.0); ctx.moveTo(2.4, -2.2); ctx.lineTo(5.0, -2.8); ctx.stroke(); }
    }
    ctx.fillStyle = C.nose; ctx.beginPath(); ctx.ellipse(1.0, 2.2, 1.3, 0.9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.beginPath();
    if (mood === 'puzzled') { ctx.moveTo(-0.4, 4.1); ctx.lineTo(2.4, 3.9); }
    else if (mood === 'sad') ctx.arc(1.0, 4.6, 1.4, Math.PI + 0.4, TAU - 0.4);
    else if (mood === 'spiral') { ctx.moveTo(-1, 3.4); ctx.lineTo(3, 3.4); }
    else ctx.arc(1.0, 2.6, mood === 'happy' ? 2.0 : 1.5, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.fillStyle = C.blush; ctx.beginPath(); ctx.arc(-3.6, 2.6, 1.1, 0, TAU); ctx.arc(5.6, 2.4, 1.0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // where Brady-O sits on the walk cycle
  saddle(t) { return { x: -4, y: -47 + Math.sin(t * 6) * 0.8 }; },
  // the long patterned carpet tongue of PUPO POWER, unrolling from (x, y) along +x for len units (flat, hard edges)
  carpet(ctx, x, y, len, t) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); ctx.rotate(0.18);
    const w = 9, wav = (u) => Math.sin(u * 0.12 - t * 6) * 2.2 * Math.min(1, u / 20);
    const edge = (sgn) => { for (let u = 0; u <= len; u += 4) ctx.lineTo(u, wav(u) + sgn * w / 2); };
    ctx.beginPath(); ctx.moveTo(0, -w / 2); edge(-1); for (let u = len; u >= 0; u -= 4) ctx.lineTo(u, wav(u) + w / 2); ctx.closePath();
    ctx.fillStyle = C.carpet; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
    // a border band and a row of diamonds
    for (let u = 6; u < len - 4; u += 10) {
      const y0 = wav(u);
      ctx.fillStyle = C.carpetGold; ctx.beginPath(); ctx.moveTo(u - 3.4, y0); ctx.lineTo(u, y0 - 3); ctx.lineTo(u + 3.4, y0); ctx.lineTo(u, y0 + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.carpetBlue; ctx.beginPath(); ctx.moveTo(u - 1.4, y0); ctx.lineTo(u, y0 - 1.3); ctx.lineTo(u + 1.4, y0); ctx.lineTo(u, y0 + 1.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.carpetSh; ctx.fillRect(u + 4, y0 - w / 2 + 0.8, 2, 1.2); ctx.fillRect(u + 4, y0 + w / 2 - 2, 2, 1.2);
    }
    // the fringe at the end
    ctx.strokeStyle = C.fringe; ctx.lineWidth = 1.1;
    for (let k = -3; k <= 3; k++) { const yy = wav(len) + k * 1.3; ctx.beginPath(); ctx.moveTo(len, yy); ctx.lineTo(len + 4, yy + Math.sin(t * 10 + k) * 0.8); ctx.stroke(); }
    ctx.restore();
  },
  butterfly(ctx, x, y, s, t, col) {
    const C = PUPO, f = Math.abs(Math.sin(t * 14)); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    for (const sg of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sg * 3.2 * (0.35 + f * 0.65), -2, 3.2 * (0.35 + f * 0.65), 3.4, sg * 0.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(sg * 2.4 * (0.35 + f * 0.65), 2.4, 2.4 * (0.35 + f * 0.65), 2.2, -sg * 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = C.ink; ctx.fillRect(-0.7, -4, 1.4, 8);
    ctx.restore();
  },
  draw(ctx, o) {
    const C = PUPO, t = o.t || 0, pose = o.pose || 'idle', f = o.facing || 1;
    ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale); ctx.scale(f, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (pose === 'walk' || pose === 'ride') {
      // ON ALL FOURS: a slow, rolling sloth walk; the long front arms knuckle along on their claws
      const ph = t * 3, bob = Math.sin(t * 6) * 0.8;
      const leg = (hx, hy, footX, k, front, near) => {
        const s = Math.sin(ph + k), lift = Math.max(0, Math.cos(ph + k)) * 4;
        const fx = footX + s * 6, fy = -lift;
        const col = near ? C.fur : C.furSh;
        if (front) Pupo.arm(ctx, hx, hy + bob, fx, fy - 2, { w: 9, col, t });
        else { outlinedCapsule(ctx, hx, hy + bob, fx, fy - 3, 10, col); Pupo.hand(ctx, fx, fy - 2, 0.15, 0.9, false); }
      };
      leg(17, -27, 25, Math.PI, true, false); leg(-20, -24, -20, 0, false, false);
      Pupo.shag(ctx, -3, -29 + bob, 30, 17, C.fur, 26);
      ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(-6, -38 + bob, 18, 5, -0.05, 0, TAU); ctx.fill();
      ctx.fillStyle = C.belly; ctx.beginPath(); ctx.ellipse(0, -19 + bob, 18, 6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.furDk; ctx.lineWidth = 1; for (const [sx, sy] of [[-22, -32], [-14, -40], [8, -42], [-28, -24]]) { ctx.beginPath(); ctx.moveTo(sx, sy + bob); ctx.quadraticCurveTo(sx + 3, sy + 3 + bob, sx + 1, sy + 6 + bob); ctx.stroke(); }
      if (pose === 'ride' && o.rider) { const sd = Pupo.saddle(t); ctx.save(); o.rider(ctx, sd.x, sd.y); ctx.restore(); }
      leg(-14, -22, -12, Math.PI, false, true); leg(22, -28, 31, 0, true, true);
      // the head, on a short neck, swinging slowly
      ctx.save(); ctx.translate(30, -34 + bob); ctx.rotate(Math.sin(t * 1.5) * 0.05);
      Pupo.head(ctx, 0, 0, 1.75, t, 'calm');
      ctx.restore();
      ctx.restore(); return;
    }
    // SITTING UP: a big pear of fur on short legs
    const sitBody = (bob) => {
      Pupo.shag(ctx, 0, -25 + bob, 19, 25, C.fur, 24);
      ctx.fillStyle = C.belly; ctx.beginPath(); ctx.ellipse(3, -20 + bob, 11, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(-6, -38 + bob, 7, 9, 0.3, 0, TAU); ctx.fill();
      // his own pupo
      ctx.strokeStyle = C.furSh; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(4, -17 + bob, 1.6, 0.4, Math.PI * 1.8); ctx.stroke();
    };
    const legs = () => {
      outlinedCapsule(ctx, -8, -8, -13, -2, 9, C.furSh); outlinedCapsule(ctx, 8, -8, 13, -2, 9, C.fur);
      Pupo.hand(ctx, -13, -2, Math.PI, 0.9, false); Pupo.hand(ctx, 13, -2, 0, 0.9, false);
    };
    let bob = Math.sin(t * 1.6) * 0.6, mood = 'calm', headX = 6, headY = -51, headTilt = 0;
    const shB = [-11, -37], shF = [12, -37];
    if (pose === 'power') {
      // PUPO POWER! (a key pose): a ring of arms, every finger out; rainbow spiral eyes; the carpet tongue; butterflies
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * 0.95 + i / (n - 1) * Math.PI * 1.9 + Math.sin(t * 5 + i) * 0.05, len = 34 + (i % 2) * 8;
        const sx = Math.cos(a) * 12, sy = -28 + Math.sin(a) * 14;
        Pupo.arm(ctx, sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, { w: 6.5, col: i % 2 ? C.fur : C.furSh, point: true, t });
      }
      legs(); sitBody(0);
      Pupo.head(ctx, 6, -51, 1.75, t, 'spiral');
      Pupo.carpet(ctx, 8, -45, 70, t);
      const bc = ['#ff7ad8', '#ffd23a', '#7ae0ff', '#9aff6a', '#ff9a2e'];
      for (let i = 0; i < 6; i++) { const k = (t * 0.6 + i / 6) % 1, a = -1.2 + i * 0.5; Pupo.butterfly(ctx, 4 + Math.cos(a) * k * 46, -17 - Math.sin(a + 1.2) * k * 30 - k * 10, 0.7 + k * 0.5, t + i, bc[i % 5]); }
      ctx.restore(); return;
    }
    let armB = null, armF = null;
    if (pose === 'poke') {
      // the slow poke: 2.6 s out, *boop*, a contented hold, back again (6 s round)
      const c = t % 6, k = c < 2.6 ? easeInOut(c / 2.6) : c < 4.6 ? 1 : 1 - easeInOut((c - 4.6) / 1.4);
      armF = { x: lerp(18, 34, k), y: lerp(-14, -24, k), point: true };
      if (c > 2.6 && c < 3.4) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; const r = 2 + (c - 2.6) * 10; ctx.beginPath(); ctx.arc(armF.x + 9, armF.y + 1, r, 0, TAU); ctx.stroke(); }
      mood = c > 2.6 && c < 4.6 ? 'happy' : 'calm';
    } else if (pose === 'stretch') {
      // one arm out to any length: the stretch-arm base pose
      const L = o.reach || 90, a = -(o.angle == null ? 0.25 : o.angle);
      armF = { x: shF[0] + Math.cos(a) * L, y: shF[1] + Math.sin(a) * L, point: true };
      mood = 'calm'; headTilt = 0.08;
    } else if (pose === 'happy') {
      mood = 'happy'; bob = -Math.abs(Math.sin(t * 2.2)) * 2;
      armF = { x: 26 + Math.sin(t * 1.5) * 3, y: -60 + Math.sin(t * 1.5) * 3 }; armB = { x: -26, y: -58 };
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.5 + i / 2) % 1, hx = -6 + i * 18, hy = -72 - k * 16, hs = Math.min(1, (1 - k) * 3);
        ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs); ctx.fillStyle = '#ff7aa8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-5, -1, -2.6, -5, 0, -2.2); ctx.bezierCurveTo(2.6, -5, 5, -1, 0, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else if (pose === 'sad') {
      // left behind: slumped, head down, hugging Chinka-O's pink hair bow
      mood = 'sad'; headX = 9; headY = -45; headTilt = 0.35; bob = 2;
      armF = { x: 6, y: -28 }; armB = { x: 0, y: -30 };
    }
    // the back arm, the body, the front arm, the head
    legs();
    const ab = armB || { x: -18, y: -8 };
    Pupo.arm(ctx, shB[0], shB[1] + bob, ab.x, ab.y + bob, { w: 7, col: C.furSh, t });
    sitBody(bob);
    if (pose === 'sad') {
      ctx.save(); ctx.translate(4, -30 + bob); ctx.rotate(-0.3); ctx.fillStyle = C.bow; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -3.6); ctx.lineTo(-5.6, 3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, -3.6); ctx.lineTo(5.6, 3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.translate(headX, headY + bob); ctx.rotate(headTilt); Pupo.head(ctx, 0, 0, 1.75, t, mood); ctx.restore();
    const af = armF || { x: 18, y: -9 };
    Pupo.arm(ctx, shF[0], shF[1] + bob, af.x, af.y + (armF && pose !== 'stretch' ? bob : 0), { w: 7.5, col: C.fur, point: !!af.point, t });
    ctx.restore();
  }
};

// preview hook (tools/story_preview/sheet.js): the new story cast, plus Brady and the ink for scale and line
try { window.BRADY_STORY = { Piwi, ChinkaO, Pupo, Showtrunk, drawBrady: o => drawBrady(o.ctx, o), ink: () => Ink }; } catch (e) { /* not in a browser */ }
