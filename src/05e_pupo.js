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
   its own ink outline, a sag, darker stripe bands every 13 units so
   a long stretch reads as a stretched arm and not as a pole, tufts,
   and a hand on the end, pointing finger optional), so the stretch
   arms and PUPO POWER! are built on it. Code-drawn, feet-centre
   origin, facing +x; in the game the body goes through Ink.around
   like Brady (the long arms do NOT: they carry their own outline).
     Pupo.draw(ctx, o)   o: { x, y, scale, facing, t, pose, mood, rider, reach, angle, armsOff, phase, flat }
       pose: idle (= sit) | walk | ride | swim | flop | sleep | hang | climb | yawn | rear | poke | stretch | happy | sad | power
       walk / ride / swim are on all fours; ride calls rider(ctx, saddleX, saddleY) to draw Brady-O on his back
       (draw Brady with anim.state 'ride', his feet origin 25 units below the saddle point); hang (upside down from a
       bar, origin = the bar) calls rider(ctx, x, y) with the point under his back where Brady-O hangs on; climb calls
       rider(ctx, x, y) with the point on his back where Brady-O clings.
       mood: calm | blink | happy | puzzled | sad | drowsy | sleep | yawn | spiral (o.spiral = the spiral's angle)
       armsOff: no front arm (the stretch-arm renderer draws it), phase: the walk / climb cycle (default t)
     Pupo.anchors(pose, t, out)   fills out.seat / shoulderF / shoulderB / belly / mouth / eyeL / eyeR / head ({ x, y })
                                  and out.eyeR_r, out.headS (art units, facing +x, feet origin); allocates nothing
     Pupo.saddle(t)                    the saddle point { x, y } for the walk cycle at time t
     Pupo.arm(ctx, x0, y0, x1, y1, o) one arm, shoulder to hand; o { w, col, point, t, sag, handScale, bands }
     Pupo.hand(ctx, x, y, ang, s, point) a hand pointing along ang; point: the index claw straight out
     Pupo.spiralEye(ctx, x, y, r, ang, bands) a flat rainbow spiral disc in an ink ring (PUPO POWER!)
     Pupo.head(ctx, x, y, s, t, mood, spiral)
   Nothing here allocates per call except the generic shapes' own canvas paths.
   ============================================================ */
const PUPO = {
  fur: '#b48c62', furSh: '#86643f', furDk: '#6e5032', furHi: '#d4b088', belly: '#e6cfaa', mask: '#f2e2c6', stripe: '#3e2c20',
  nose: '#2a1c16', claw: '#f4ead8', blush: 'rgba(255,120,130,0.55)', tear: '#7ad0ff', ink: '#1c1426',
  rainbow: ['#e8413a', '#ff9a2a', '#ffd84a', '#4ac46a', '#3a8ae8', '#9a5ae8'],
  carpet: '#c8323e', carpetSh: '#8a1e2a', carpetGold: '#ffc83a', carpetBlue: '#1e5aa8', fringe: '#fff0d0',
  bow: '#ff4f93', butterflies: ['#ff7ad8', '#ffd23a', '#7ae0ff', '#9aff6a', '#ff9a2e']
};
// the eyes on the head, in head units: [x, y, stripe direction]
const PUPO_EYES = [-1.8, -1, -1, 3.6, 1, 1];
const PUPO_FUR_STROKES = [-22, -32, -14, -40, 8, -42, -28, -24];
const Pupo = {
  C: PUPO,
  // a shaggy blob: an ellipse with a fringe of soft points
  shag(ctx, x, y, rx, ry, col, n, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.fillStyle = col; ctx.beginPath();
    const N = n || 18;
    for (let i = 0; i <= N; i++) { const a = i / N * TAU, k = i % 2 ? 1.0 : 1.09; const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  },
  claw(ctx, dy, len, curl) {
    const C = PUPO;
    ctx.beginPath(); ctx.moveTo(3.4, dy);
    if (curl) ctx.quadraticCurveTo(3.4 + len * 0.8, dy, 3.4 + len * 0.55, dy + len * 0.6);
    else ctx.quadraticCurveTo(3.4 + len * 0.6, dy - 0.3, 3.4 + len, dy + 0.4);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.8; ctx.stroke(); ctx.strokeStyle = C.claw; ctx.lineWidth = 1.5; ctx.stroke();
  },
  // a hand at the end of an arm, pointing along `ang`; point: the index claw sticks straight out
  hand(ctx, x, y, ang, s, point) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (s && s !== 1) ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(0.5, 0, 5.4, 4.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.furSh; ctx.beginPath(); ctx.ellipse(0.5, 0, 4.4, 3.7, 0, 0, TAU); ctx.fill();
    // pointing: the index claw straight out along the top edge, the other two curled tight under it (never the
    // middle one alone: that would read as a rude gesture)
    if (point) { this.claw(ctx, -2.4, 9, false); this.claw(ctx, 0.4, 3.6, true); this.claw(ctx, 2.6, 3.4, true); }
    else { this.claw(ctx, -2.2, 6, true); this.claw(ctx, 0, 6.6, true); this.claw(ctx, 2.2, 6, true); }
    ctx.restore();
  },
  /* one arm at any length: a furry tube on a gentle curve (o.sag: how far the middle bows sideways, art units), with
     its own hand-made ink outline (stroked 3 units wider in ink, then the fur), darker stripe bands every 13 units on
     long arms (a stretched slinky, not a pole), a few tufts on the upper edge, and the hand. Allocates nothing. */
  arm(ctx, x0, y0, x1, y1, o) {
    const C = PUPO, w = (o && o.w) || 7, col = (o && o.col) || C.fur, t = (o && o.t) || 0, sag = (o && o.sag) || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const qx = (x0 + x1) / 2 + nx * sag, qy = (y0 + y1) / 2 + ny * sag;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(qx, qy, x1, y1);
    ctx.strokeStyle = C.ink; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    // the light side of the tube: a thin highlight along the upper edge
    const side = ny < 0 ? 1 : -1;
    if (L > 14) {
      ctx.beginPath(); ctx.moveTo(x0 + nx * side * w * 0.28, y0 + ny * side * w * 0.28); ctx.quadraticCurveTo(qx + nx * side * w * 0.28, qy + ny * side * w * 0.28, x1 + nx * side * w * 0.28 - ux * 4, y1 + ny * side * w * 0.28 - uy * 4);
      ctx.strokeStyle = C.furHi; ctx.lineWidth = Math.max(1, w * 0.2); ctx.stroke();
    }
    // stripe bands and tufts, placed along the curve
    const bands = !(o && o.bands === false) && L > 30;
    ctx.lineCap = 'butt';
    for (let d = 10; d < L - 8; d += 6.5) {
      const u = d / L, a = 1 - u, px = a * a * x0 + 2 * a * u * qx + u * u * x1, py = a * a * y0 + 2 * a * u * qy + u * u * y1;
      let tx = 2 * a * (qx - x0) + 2 * u * (x1 - qx), ty = 2 * a * (qy - y0) + 2 * u * (y1 - qy); const tl = Math.sqrt(tx * tx + ty * ty) || 1; tx /= tl; ty /= tl;
      const mx = -ty * side, my = tx * side, k = Math.round(d / 6.5);
      if (bands && k % 2 === 0) {
        // a band across the arm: dark fur with an ink seam on each side
        ctx.beginPath(); ctx.moveTo(px + mx * w * 0.5, py + my * w * 0.5); ctx.lineTo(px - mx * w * 0.5, py - my * w * 0.5);
        ctx.strokeStyle = C.furSh; ctx.lineWidth = 3.2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + tx * 1.8 + mx * w * 0.5, py + ty * 1.8 + my * w * 0.5); ctx.lineTo(px + tx * 1.8 - mx * w * 0.5, py + ty * 1.8 - my * w * 0.5);
        ctx.strokeStyle = C.furDk; ctx.lineWidth = 0.7; ctx.stroke();
      } else if (k % 2 === 1 || !bands) {
        // a tuft on the upper edge
        const bx = px + mx * w * 0.45, by = py + my * w * 0.45, wig = Math.sin(t * 2 + d) * 0.4;
        ctx.beginPath(); ctx.moveTo(bx - tx * 2.6, by - ty * 2.6); ctx.lineTo(bx + mx * 2.8 + tx * 0.8 + wig, by + my * 2.8 + ty * 0.8); ctx.lineTo(bx + tx * 2.6, by + ty * 2.6); ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9; ctx.stroke();
      }
    }
    ctx.lineCap = 'round';
    // the hand points along the end of the curve
    Pupo.hand(ctx, x1, y1, Math.atan2(y1 - qy, x1 - qx), (o && o.handScale) || 1, o && o.point);
  },
  // a flat rainbow spiral in an ink ring: `bands` hard-edged bands (6 / 4 / 3) swirling about the centre, turned by ang
  spiralEye(ctx, x, y, r, ang, bands) {
    const C = PUPO, n = bands || 6, step = TAU / n, twist = 2.6;
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, r + Math.max(1, r * 0.18), 0, TAU); ctx.fill();
    for (let i = 0; i < n; i++) {
      const a0 = ang + i * step;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 1; k <= 5; k++) { const rr0 = r * k / 5, a = a0 + twist * k / 5; ctx.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); }
      for (let k = 0; k <= 3; k++) { const a = a0 + twist + step * k / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      for (let k = 4; k >= 1; k--) { const rr0 = r * k / 5, a = a0 + step + twist * k / 5; ctx.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); }
      ctx.closePath(); ctx.fillStyle = C.rainbow[(i * 6 / n) | 0]; ctx.fill();
    }
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, r * 0.16), 0, TAU); ctx.fill();
  },
  head(ctx, x, y, s, t, mood, spiral) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); if (s && s !== 1) ctx.scale(s, s);
    Pupo.shag(ctx, 0, 0, 7.6, 6.8, C.fur, 18);
    ctx.fillStyle = C.mask; ctx.beginPath(); ctx.ellipse(1.2, 0.8, 5.8, 4.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(0.4, -4.6, 4.4, 1.7, 0, 0, TAU); ctx.fill();
    const E = PUPO_EYES;
    if (mood === 'spiral') {
      // PUPO POWER eyes: big flat spirals that turn (a rotation, never a colour flash)
      for (let i = 0; i < 6; i += 3) Pupo.spiralEye(ctx, E[i], E[i + 1] * 0.5, 3.1, spiral || 0, 6);
    } else {
      // the dark stripes that run back from his eyes (the sloth's built-in smile)
      ctx.fillStyle = C.stripe;
      for (let i = 0; i < 6; i += 3) { const ex = E[i], dir = E[i + 2]; ctx.beginPath(); ctx.ellipse(ex + dir * 1.0, mood === 'sad' ? 0.8 : 0.2, 2.6, 1.3, dir * (mood === 'sad' ? 0.35 : -0.35), 0, TAU); ctx.fill(); }
      const shut = mood === 'blink' || mood === 'sleep' || ((mood === 'calm' || !mood) && (t % 5) < 0.35);
      ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink;
      for (let i = 0; i < 6; i += 3) {
        const ex = E[i];
        if (mood === 'happy' || shut) { ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(ex, mood === 'happy' ? 0.6 : 0, 1.1, Math.PI * 1.1, Math.PI * 1.9, mood === 'happy'); ctx.stroke(); }
        else if (mood === 'drowsy' || mood === 'yawn') {
          // heavy lids: the lower half of the eye under a flat lid line
          ctx.beginPath(); ctx.arc(ex, 0.2, 1.05, 0, Math.PI); ctx.fill();
          ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(ex - 1.4, 0.15); ctx.lineTo(ex + 1.4, 0.15); ctx.stroke();
        } else { ctx.beginPath(); ctx.arc(ex, mood === 'sad' ? 0.4 : 0, 1.05, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 0.35, -0.35, 0.38, 0, TAU); ctx.fill(); ctx.fillStyle = C.ink; }
      }
      if (mood === 'sad') { ctx.fillStyle = C.tear; ctx.beginPath(); ctx.ellipse(4.4, 2.4 + (t % 2) * 1.5, 0.7, 1.0, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.4; ctx.stroke(); }
      if (mood === 'puzzled') { ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3.2, -2.6); ctx.lineTo(-0.6, -2.0); ctx.moveTo(2.4, -2.2); ctx.lineTo(5.0, -2.8); ctx.stroke(); }
    }
    ctx.fillStyle = C.nose; ctx.beginPath(); ctx.ellipse(1.0, 2.2, 1.3, 0.9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
    if (mood === 'yawn' || mood === 'spiral') {
      // the open mouth (a yawn, or the carpet tongue coming out)
      ctx.fillStyle = '#5a1a26'; ctx.beginPath(); ctx.ellipse(1.2, 4.0, 1.9, mood === 'yawn' ? 1.7 : 1.3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      if (mood === 'puzzled') { ctx.moveTo(-0.4, 4.1); ctx.lineTo(2.4, 3.9); }
      else if (mood === 'sad') ctx.arc(1.0, 4.6, 1.4, Math.PI + 0.4, TAU - 0.4);
      else if (mood === 'sleep' || mood === 'drowsy') { ctx.moveTo(0, 3.6); ctx.lineTo(2.2, 3.6); }
      else ctx.arc(1.0, 2.6, mood === 'happy' ? 2.0 : 1.5, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
    ctx.fillStyle = C.blush; ctx.beginPath(); ctx.arc(-3.6, 2.6, 1.1, 0, TAU); ctx.arc(5.6, 2.4, 1.0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // where Brady-O sits on the walk cycle (allocates: preview use only; the game reads Pupo.anchors)
  saddle(t) { return { x: -4, y: -47 + Math.sin(t * 6) * 0.8 }; },
  /* the named points of a pose (art units, facing +x, feet origin), written into `out` (made once by the caller with
     Pupo.newAnchors()); used to seat Brady-O, start the stretch arms at the shoulders, put PUPO POWER!'s spirals on the
     eyes, the tongue at the mouth and the butterflies at the belly button */
  newAnchors() { const p = () => ({ x: 0, y: 0 }); return { seat: p(), shoulderF: p(), shoulderB: p(), belly: p(), mouth: p(), eyeL: p(), eyeR: p(), head: p(), eyeR_r: 3, headS: 1.75 }; },
  setPt(q, x, y) { q.x = x; q.y = y; },
  anchors(pose, t, out, o) {
    const S = 1.75, set = Pupo.setPt;
    let hx, hy, bob;
    if (pose === 'walk' || pose === 'ride' || pose === 'swim' || pose === 'flop' || pose === 'sleep') {
      const flat = pose === 'flop' || pose === 'sleep' ? 0.62 : 1;
      bob = pose === 'sleep' ? 0 : Math.sin(t * 6) * 0.8;
      set(out.seat, -4, (-47 + bob) * flat); set(out.shoulderF, 22, (-28 + bob) * flat); set(out.shoulderB, 17, (-27 + bob) * flat);
      set(out.belly, 2, (-17 + bob) * flat);
      hx = 30; hy = pose === 'sleep' ? -16 : (-34 + bob) * flat;
    } else if (pose === 'hang') {
      bob = Math.sin(t * 1.6) * 0.8;
      set(out.seat, -4, 42 + bob); set(out.shoulderF, 22, 26 + bob); set(out.shoulderB, 17, 26 + bob); set(out.belly, 2, 18 + bob);
      hx = 30; hy = 38 + bob;
    } else if (pose === 'climb') {
      const ph = (o && o.phase != null) ? o.phase : t;
      bob = Math.sin(ph * TAU) * 1.2;
      set(out.seat, -24, -46 + bob); set(out.shoulderF, 9, -40 + bob); set(out.shoulderB, 5, -38 + bob); set(out.belly, 6, -18 + bob);
      hx = 8; hy = -52 + bob;
    } else {
      bob = pose === 'rear' || pose === 'power' ? 0 : Math.sin(t * 1.6) * 0.6;
      const up = pose === 'rear' || pose === 'power' ? -6 : 0;
      set(out.seat, -4, -50 + up); set(out.shoulderF, 12, -37 + bob + up); set(out.shoulderB, -11, -37 + bob + up); set(out.belly, 4, -17 + bob + up);
      hx = 6; hy = -51 + bob + up;
    }
    set(out.head, hx, hy);
    set(out.eyeL, hx + PUPO_EYES[0] * S, hy + PUPO_EYES[1] * 0.5 * S); set(out.eyeR, hx + PUPO_EYES[3] * S, hy + PUPO_EYES[4] * 0.5 * S);
    set(out.mouth, hx + 1.2 * S, hy + 4.0 * S); out.eyeR_r = 3.1 * S; out.headS = S;
    return out;
  },
  // the long patterned carpet tongue (preview art; the game's PUPO POWER! draws its own cached rug strip)
  carpet(ctx, x, y, len, t) {
    const C = PUPO; ctx.save(); ctx.translate(x, y); ctx.rotate(0.18);
    const w = 9;
    ctx.beginPath(); ctx.moveTo(0, -w / 2);
    for (let u = 0; u <= len; u += 4) ctx.lineTo(u, Math.sin(u * 0.12 - t * 6) * 2.2 * Math.min(1, u / 20) - w / 2);
    for (let u = len; u >= 0; u -= 4) ctx.lineTo(u, Math.sin(u * 0.12 - t * 6) * 2.2 * Math.min(1, u / 20) + w / 2);
    ctx.closePath();
    ctx.fillStyle = C.carpet; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
    for (let u = 6; u < len - 4; u += 10) {
      const y0 = Math.sin(u * 0.12 - t * 6) * 2.2 * Math.min(1, u / 20);
      ctx.fillStyle = C.carpetGold; ctx.beginPath(); ctx.moveTo(u - 3.4, y0); ctx.lineTo(u, y0 - 3); ctx.lineTo(u + 3.4, y0); ctx.lineTo(u, y0 + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.carpetBlue; ctx.beginPath(); ctx.moveTo(u - 1.4, y0); ctx.lineTo(u, y0 - 1.3); ctx.lineTo(u + 1.4, y0); ctx.lineTo(u, y0 + 1.3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  // a butterfly: two pairs of flat wings (a horizontal squash for the flap), ink outlines, an ink body
  butterfly(ctx, x, y, s, t, col) {
    const C = PUPO, f = Math.abs(Math.sin(t * 14)), k = 0.35 + f * 0.65; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    for (let sg = -1; sg <= 1; sg += 2) {
      ctx.beginPath(); ctx.ellipse(sg * 3.2 * k, -2, 3.2 * k, 3.4, sg * 0.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(sg * 2.4 * k, 2.4, 2.4 * k, 2.2, -sg * 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = C.ink; ctx.fillRect(-0.7, -4, 1.4, 8);
    ctx.restore();
  },

  /* ---------- the body poses ---------- */
  // one leg on all fours: a front leg is a short arm on its knuckles, a back leg a capsule and a paw
  leg(ctx, hx, hy, footX, ph, k, front, near, bob, lift0, t, swing) {
    const C = PUPO, s = Math.sin(ph + k), lift = Math.max(0, Math.cos(ph + k)) * lift0;
    const fx = footX + s * swing, fy = -lift;
    const col = near ? C.fur : C.furSh;
    if (front) Pupo.arm(ctx, hx, hy + bob, fx, fy - 2, { w: 9, col, t, bands: false });
    else { outlinedCapsule(ctx, hx, hy + bob, fx, fy - 3, 10, col); Pupo.hand(ctx, fx, fy - 2, 0.15, 0.9, false); }
  },
  // on all fours (walk, ride, swim, flop, sleep); upside (hang) draws it flipped under a bar with the head upright
  allFours(ctx, o, pose, t) {
    const C = PUPO, ph = (o.phase != null ? o.phase : t) * (pose === 'swim' ? 5 : 3);
    const still = pose === 'sleep' || pose === 'hang' || o.still;
    const bob = still ? 0 : Math.sin(t * 6) * 0.8;
    const lift0 = pose === 'flop' || still ? 0 : pose === 'swim' ? 6 : 4, swing = pose === 'flop' ? 2 : still ? 0 : 6;
    const legPh = still ? 0 : ph;
    if (pose === 'flop' || pose === 'sleep') { ctx.save(); ctx.scale(1.12, 0.62); }
    const armsOff = !!o.armsOff;
    if (!armsOff) this.leg(ctx, 17, -27, 25, legPh, Math.PI, true, false, bob, lift0, t, swing);
    this.leg(ctx, -20, -24, -20, legPh, 0, false, false, bob, lift0, t, swing);
    Pupo.shag(ctx, -3, -29 + bob, 30, 17, C.fur, 26);
    ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(-6, -38 + bob, 18, 5, -0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = C.belly; ctx.beginPath(); ctx.ellipse(0, -19 + bob, 18, 6, 0, 0, TAU); ctx.fill();
    // his own pupo, low on the belly
    ctx.strokeStyle = C.furSh; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(2, -17 + bob, 1.4, 0.4, Math.PI * 1.8); ctx.stroke();
    ctx.strokeStyle = C.furDk; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i += 2) { const sx = PUPO_FUR_STROKES[i], sy = PUPO_FUR_STROKES[i + 1]; ctx.beginPath(); ctx.moveTo(sx, sy + bob); ctx.quadraticCurveTo(sx + 3, sy + 3 + bob, sx + 1, sy + 6 + bob); ctx.stroke(); }
    if ((pose === 'ride' || pose === 'swim') && o.rider) { ctx.save(); o.rider(ctx, -4, -47 + bob); ctx.restore(); }
    this.leg(ctx, -14, -22, -12, legPh, Math.PI, false, true, bob, lift0, t, swing);
    if (!armsOff) this.leg(ctx, 22, -28, 31, legPh, 0, true, true, bob, lift0, t, swing);
    if (pose === 'flop' || pose === 'sleep') ctx.restore();
    // the head, on a short neck, swinging slowly (resting on the paws when asleep)
    const mood = o.mood || (pose === 'sleep' ? 'sleep' : 'calm');
    if (pose === 'hang') {
      ctx.save(); ctx.scale(1, -1); ctx.translate(30, 36 + bob); ctx.rotate(-0.25); Pupo.head(ctx, 0, 0, 1.75, t, mood, o.spiral); ctx.restore();
    } else {
      ctx.save(); ctx.translate(30, pose === 'sleep' ? -16 : (-34 + bob) * (pose === 'flop' ? 0.62 : 1)); ctx.rotate(pose === 'sleep' ? 0.15 : Math.sin(t * 1.5) * 0.05);
      Pupo.head(ctx, 0, 0, 1.75, t, mood, o.spiral);
      ctx.restore();
    }
  },
  // SITTING UP: a big pear of fur on short legs
  sitBody(ctx, bob) {
    const C = PUPO;
    Pupo.shag(ctx, 0, -25 + bob, 19, 25, C.fur, 24);
    ctx.fillStyle = C.belly; ctx.beginPath(); ctx.ellipse(3, -20 + bob, 11, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.furHi; ctx.beginPath(); ctx.ellipse(-6, -38 + bob, 7, 9, 0.3, 0, TAU); ctx.fill();
    // his own pupo
    ctx.strokeStyle = C.furSh; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(4, -17 + bob, 1.6, 0.4, Math.PI * 1.8); ctx.stroke();
  },
  sitLegs(ctx) {
    const C = PUPO;
    outlinedCapsule(ctx, -8, -8, -13, -2, 9, C.furSh); outlinedCapsule(ctx, 8, -8, 13, -2, 9, C.fur);
    Pupo.hand(ctx, -13, -2, Math.PI, 0.9, false); Pupo.hand(ctx, 13, -2, 0, 0.9, false);
  },
  // CLIMBING: upright against a pole in front of him (facing +x), arms reaching up hand over hand, Brady-O on his back
  climb(ctx, o, t) {
    const C = PUPO, ph = o.phase != null ? o.phase : t, k = Math.sin(ph * TAU), bob = k * 1.2;
    // the far arm and the far leg grip the pole
    if (!o.armsOff) Pupo.arm(ctx, 5, -38 + bob, 16, -60 - Math.max(0, -k) * 8, { w: 7, col: C.furSh, t, bands: false });
    outlinedCapsule(ctx, -2, -10, 12, -4 + k * 3, 9, C.furSh); Pupo.hand(ctx, 13, -4 + k * 3, -0.3, 0.9, false);
    // Brady-O clings on behind him (drawn first, so Pupo's body is in front and the two never blur together)
    if (o.rider) { ctx.save(); o.rider(ctx, -24, -46 + bob); ctx.restore(); }
    ctx.save(); ctx.translate(0, bob); ctx.rotate(-0.08); this.sitBody(ctx, 0); ctx.restore();
    outlinedCapsule(ctx, 4, -10, 14, -12 - k * 3, 9, C.fur); Pupo.hand(ctx, 15, -12 - k * 3, -0.3, 0.9, false);
    ctx.save(); ctx.translate(8, -52 + bob); ctx.rotate(-0.12); Pupo.head(ctx, 0, 0, 1.75, t, o.mood || 'calm', o.spiral); ctx.restore();
    if (!o.armsOff) Pupo.arm(ctx, 9, -40 + bob, 18, -62 - Math.max(0, k) * 8, { w: 7.5, col: C.fur, t, bands: false });
  },
  draw(ctx, o) {
    const C = PUPO, t = o.t || 0, f = o.facing || 1;
    let pose = o.pose || 'idle';
    ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale); ctx.scale(f, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (pose === 'walk' || pose === 'ride' || pose === 'swim' || pose === 'flop' || pose === 'sleep') { this.allFours(ctx, o, pose, t); ctx.restore(); return; }
    if (pose === 'hang') {
      // upside down under a bar (the origin): hands and feet up on the bar, back hanging down, Brady-O under his back
      ctx.save(); ctx.scale(1, -1); this.allFours(ctx, o, 'hang', t); ctx.restore();
      if (o.rider) { ctx.save(); o.rider(ctx, -4, 42); ctx.restore(); }
      ctx.restore(); return;
    }
    if (pose === 'climb') { this.climb(ctx, o, t); ctx.restore(); return; }
    let bob = Math.sin(t * 1.6) * 0.6, mood = o.mood || 'calm', headX = 6, headY = -51, headTilt = 0;
    const shBx = -11, shBy = -37, shFx = 12, shFy = -37;
    if (pose === 'power') {
      // PUPO POWER! (a preview key pose; the game composes the show itself): arms every which way, spiral eyes
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * 0.95 + i / (n - 1) * Math.PI * 1.9 + Math.sin(t * 5 + i) * 0.05, len = 34 + (i % 2) * 8;
        const sx = Math.cos(a) * 12, sy = -28 + Math.sin(a) * 14;
        Pupo.arm(ctx, sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, { w: 6.5, col: i % 2 ? C.fur : C.furSh, point: true, t, sag: (i % 3 - 1) * 4 });
      }
      this.sitLegs(ctx); this.sitBody(ctx, 0);
      Pupo.head(ctx, 6, -51, 1.75, t, 'spiral', t * 0.6 * TAU);
      Pupo.carpet(ctx, 8, -45, 70, t);
      for (let i = 0; i < 6; i++) { const k = (t * 0.6 + i / 6) % 1, a = -1.2 + i * 0.5; Pupo.butterfly(ctx, 4 + Math.cos(a) * k * 46, -17 - Math.sin(a + 1.2) * k * 30 - k * 10, 0.7 + k * 0.5, t + i, C.butterflies[i % 5]); }
      ctx.restore(); return;
    }
    let abx = -18, aby = -8, afx = 18, afy = -9, afPoint = false, armB = false, armF = false, yawn = 0;
    if (pose === 'rear') { bob = 0; ctx.translate(0, -2); ctx.scale(1, 1.06); }
    if (pose === 'poke') {
      // the slow poke: 2.6 s out, *boop*, a contented hold, back again (6 s round)
      const c = t % 6, k = c < 2.6 ? easeInOut(c / 2.6) : c < 4.6 ? 1 : 1 - easeInOut((c - 4.6) / 1.4);
      afx = lerp(18, 34, k); afy = lerp(-14, -24, k); afPoint = true; armF = true;
      if (c > 2.6 && c < 3.4) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; const r = 2 + (c - 2.6) * 10; ctx.beginPath(); ctx.arc(afx + 9, afy + 1, r, 0, TAU); ctx.stroke(); }
      mood = o.mood || (c > 2.6 && c < 4.6 ? 'happy' : 'calm');
    } else if (pose === 'stretch') {
      // one arm out to any length: the stretch-arm base pose
      const L = o.reach || 90, a = -(o.angle == null ? 0.25 : o.angle);
      afx = shFx + Math.cos(a) * L; afy = shFy + Math.sin(a) * L; afPoint = true; armF = true; headTilt = 0.08;
    } else if (pose === 'yawn') {
      // the wake-up yawn: both arms stretch out sideways to o.reach (art units), mouth wide open
      const L = o.reach || 40; yawn = 1;
      abx = shBx - L; aby = shBy - 8; afx = shFx + L; afy = shFy - 8; armB = true; armF = true; mood = o.mood || 'yawn'; headTilt = -0.2;
    } else if (pose === 'happy') {
      mood = 'happy'; bob = -Math.abs(Math.sin(t * 2.2)) * 2;
      afx = 26 + Math.sin(t * 1.5) * 3; afy = -60 + Math.sin(t * 1.5) * 3; abx = -26; aby = -58; armB = true; armF = true;
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.5 + i / 2) % 1, hx = -6 + i * 18, hy = -72 - k * 16, hs = Math.min(1, (1 - k) * 3);
        ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs); ctx.fillStyle = '#ff7aa8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-5, -1, -2.6, -5, 0, -2.2); ctx.bezierCurveTo(2.6, -5, 5, -1, 0, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else if (pose === 'sad') {
      // left behind: slumped, head down, hugging Chinka-O's pink hair bow
      mood = 'sad'; headX = 9; headY = -45; headTilt = 0.35; bob = 2;
      afx = 6; afy = -28; abx = 0; aby = -30; armB = true; armF = true;
    }
    // the back arm, the body, the front arm, the head
    this.sitLegs(ctx);
    if (!(o.armsOff && pose === 'yawn')) Pupo.arm(ctx, shBx, shBy + bob, abx, aby + (armB ? bob : 0), { w: 7, col: C.furSh, t, bands: false });
    this.sitBody(ctx, bob);
    if (pose === 'sad') {
      ctx.save(); ctx.translate(4, -30 + bob); ctx.rotate(-0.3); ctx.fillStyle = C.bow; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -3.6); ctx.lineTo(-5.6, 3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, -3.6); ctx.lineTo(5.6, 3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.translate(headX, headY + bob); ctx.rotate(headTilt); Pupo.head(ctx, 0, 0, 1.75, t, mood, o.spiral); ctx.restore();
    if (!o.armsOff) Pupo.arm(ctx, shFx, shFy + bob, afx, afy + (armF && pose !== 'stretch' ? bob : 0), { w: 7.5, col: C.fur, point: afPoint, t, bands: pose === 'stretch' || yawn > 0 });
    ctx.restore();
  }
};

// preview hook (tools/story_preview/sheet.js): the new story cast, plus Brady and the ink for scale and line
try { window.BRADY_STORY = { Piwi, ChinkaO, Pupo, Showtrunk, drawBrady: o => drawBrady(o.ctx, o), ink: () => Ink }; } catch (e) { /* not in a browser */ }
