/* ============================================================
   Chinka-O: Brady-O's wife, as she appears in the Piwi Squirmin'
   story of Super Brady-O World (Nov 2026; docs/design/STORY_PIWI.md).
   Brady's spec (16 Nov 2026): a ballerina in a pink tutu; she is
   Ecuadorian, with black hair, a warm brown skin tone and dark
   eyes. Drawn warmly, as a flattering cartoon of a real, loved
   person. Long wavy black hair worn down with a pink bow (so her
   silhouette is nothing like Brady-O's man bun), a pink leotard and
   a layered tutu, pale pink tights, satin slippers with crossed
   ribbons. Never a helpless prize: unimpressed, funny, always one
   pirouette from escaping. Her giant sloth Pupo (05e_pupo.js) was
   left behind and is Brady-O's sidekick; 'hug' is her reunion with
   him (draw Pupo 'happy' just in front of her).
   Same conventions as Brady (05_brady.js): code paths, feet-centre
   origin, facing +x, about Brady's height; in the game it goes
   through Ink.around with Brady's cream rim so the black hair reads
   on dark backdrops. Not referenced by the game yet.
     ChinkaO.draw(ctx, { x, y, scale, facing, t, pose })
       pose: idle | walk | tiptoe | pirouette | unimpressed | wave | seated | reunion | hug
       'seated' puts the seat at the origin (the swing in Piwi's show
       cage, Showtrunk.cage); every other pose stands on its feet.
   ============================================================ */
const CHINKA_O = {
  hair: '#17121a', hairHi: '#4a4258', skin: '#b67a52', skinSh: '#93603c', skinHi: '#d29a6e', lip: '#a8404e', eye: '#2a1810',
  leo: '#ff7fb0', leoSh: '#d8578c', leoHi: '#ffb3d0', tutu: '#ffa8cb', tutuSh: '#f07aa8', tutuHi: '#ffe0ee',
  tights: '#f6c3d0', tightsSh: '#dca0b2', slipper: '#ff9cc2', ribbon: '#ffd6e6', bow: '#ff4f93', ink: '#1c1426',
  bag: '#ffd23a', bagStripe: '#22a6b8', corn: '#fff6dc'
};
const CHINKA_O_DIM = { hip: -25, torso: 17, headR: 8.9, upper: 9, fore: 8.4, thigh: 11.5, shin: 11.5 };

function chinkaOPose(pose, t) {
  const P = { bob: 0, lean: 0, hip: CHINKA_O_DIM.hip, thF: 0.08, shF: 0, thB: -0.08, shB: 0, uaF: 0.3, faF: 0.75, uaB: -0.3, faB: -0.75,
    head: 0, mouth: 'smile', eyes: 'open', brow: 0, sway: 0, fold: false, seated: false, hearts: false, toeTap: 0, bag: false,
    pointeF: 0, pointeB: 0, spin: 1, shush: false };
  switch (pose) {
    case 'walk': {
      // a light dancer's walk, up on the balls of her feet
      const ph = t * 9.5;
      P.thF = Math.sin(ph) * 0.5; P.thB = -P.thF;
      P.shF = P.thF - Math.max(0, Math.sin(ph - 1.3)) * 0.7; P.shB = P.thB - Math.max(0, Math.sin(ph + Math.PI - 1.3)) * 0.7;
      P.uaF = 0.5 - Math.sin(ph) * 0.3; P.faF = 1.0; P.uaB = -0.5 - Math.sin(ph) * 0.3; P.faB = -1.0;
      P.bob = -Math.abs(Math.cos(ph)) * 1.4; P.lean = 0.04; P.sway = -2 + Math.sin(ph) * 1.2; P.pointeF = P.pointeB = 0.45;
      break;
    }
    case 'tiptoe': {
      // sneaking out of the cage en pointe: knee high, one finger to her lips, eyes sideways
      const ph = t * 4;
      P.pointeF = P.pointeB = 1; P.thF = 0.75 + Math.sin(ph) * 0.15; P.shF = -0.55; P.thB = -0.12; P.shB = 0.02;
      P.uaF = 0.55; P.faF = 2.7; P.shush = true; P.uaB = -1.25; P.faB = -0.9; P.lean = 0.12; P.bob = -2 + Math.sin(ph) * 0.6;
      P.eyes = 'side'; P.mouth = 'o';
      break;
    }
    case 'pirouette': {
      // up on one pointe, the other foot at her knee, arms rounded overhead; the whole figure turns
      P.pointeB = 1; P.thB = 0; P.shB = 0; P.thF = 1.15; P.shF = -1.35;
      P.uaF = 2.05; P.faF = 3.3; P.uaB = -2.95; P.faB = -3.55; P.bob = -3; P.mouth = 'smile'; P.eyes = 'closed';
      P.spin = Math.cos(t * 9); P.sway = Math.sin(t * 9) * 3;
      break;
    }
    case 'unimpressed': {
      // arms folded, hip popped, one eyebrow up, the front toe tapping
      P.fold = true; P.lean = -0.06; P.head = -0.1; P.mouth = 'flat'; P.brow = 1; P.eyes = 'lidded';
      P.thF = 0.18; P.shF = 0.02; P.thB = -0.12; P.toeTap = Math.max(0, Math.sin(t * 7)) * 0.35;
      break;
    }
    case 'wave': {
      P.uaF = 2.2 + Math.sin(t * 2) * 0.05; P.faF = 2.75 + Math.sin(t * 10) * 0.4; P.mouth = 'grin'; P.head = 0.06;
      P.bob = Math.sin(t * 2.2) * 0.5; P.uaB = -0.35; P.faB = -1.0;
      break;
    }
    case 'seated': {
      // on the swing in Piwi's show cage, legs crossed, a bag of popcorn: not struggling, not impressed
      P.seated = true; P.hip = 0; P.bag = true; P.pointeF = 0.6; P.pointeB = 0.3;
      P.thB = 1.52; P.shB = 0.05; P.thF = 1.3; P.shF = 0.62 + Math.sin(t * 2.4) * 0.12;
      const eat = (t % 3.2) < 0.7;   // a piece of popcorn, now and then
      P.uaB = -0.35; P.faB = 0.9; P.uaF = 0.55; P.faF = eat ? 2.75 : 1.55; P.mouth = eat ? 'o' : 'flat'; P.eyes = 'lidded'; P.head = eat ? -0.05 : 0.05;
      P.bob = Math.sin(t * 1.6) * 0.4;
      break;
    }
    case 'reunion': {
      // a grand leap, legs split front and back, arms flung up, hearts
      const h = Math.abs(Math.sin(t * 4));
      P.bob = -8 - h * 5; P.uaF = 2.0; P.faF = 2.45; P.uaB = -2.25; P.faB = -2.7;
      P.thF = 1.25; P.shF = 1.15; P.thB = -1.15; P.shB = -1.3; P.pointeF = P.pointeB = 1;
      P.mouth = 'grin'; P.eyes = 'happy'; P.hearts = true; P.head = -0.08; P.sway = -3 * h;
      break;
    }
    case 'hug': {
      // arms out round something big and furry, up on her toes, eyes shut, beaming
      P.uaF = 1.45; P.faF = 2.05; P.uaB = 1.3; P.faB = 1.95; P.lean = 0.12; P.mouth = 'grin'; P.eyes = 'happy';
      P.pointeF = P.pointeB = 0.7; P.thF = 0.1; P.thB = -0.25; P.shB = -0.4; P.hearts = true; P.head = 0.08;
      break;
    }
    default: { // idle: first position, arms softly rounded, weight shifting
      P.bob = Math.sin(t * 2.2) * 0.6; P.sway = Math.sin(t * 1.8) * 1.4; P.lean = Math.sin(t * 1.1) * 0.015;
      P.thF = 0.12; P.thB = -0.12;
    }
  }
  return P;
}

const ChinkaO = {
  C: CHINKA_O,
  // the head: centre x,y (s scale); P { mouth, eyes, brow }
  head(ctx, x, y, s, t, P) {
    const C = CHINKA_O, R = CHINKA_O_DIM.headR;
    P = P || { mouth: 'smile', eyes: 'open', brow: 0 };
    ctx.save(); ctx.translate(x, y); if (s && s !== 1) ctx.scale(s, s);
    // the face
    const fg = ctx.createLinearGradient(-R, 0, R, 0); fg.addColorStop(0, C.skinSh); fg.addColorStop(0.5, C.skin); fg.addColorStop(1, C.skinHi);
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0.6, 0, R * 0.96, R * 1.07, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.skinSh; ctx.beginPath(); ctx.moveTo(R * 0.86, -R * 0.02); ctx.lineTo(R * 1.12, R * 0.26); ctx.lineTo(R * 0.84, R * 0.32); ctx.fill();
    ctx.fillStyle = 'rgba(255,110,120,0.32)'; ctx.beginPath(); ctx.arc(R * 0.32, R * 0.32, 2.2, 0, TAU); ctx.fill();
    // mouth
    const m = P.mouth;
    if (m === 'grin') {
      ctx.fillStyle = '#5a1620'; ctx.beginPath(); ctx.moveTo(R * 0.18, R * 0.46); ctx.quadraticCurveTo(R * 0.55, R * 1.02, R * 0.96, R * 0.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(R * 0.24, R * 0.48); ctx.quadraticCurveTo(R * 0.56, R * 0.62, R * 0.92, R * 0.44); ctx.lineTo(R * 0.88, R * 0.56); ctx.quadraticCurveTo(R * 0.56, R * 0.66, R * 0.28, R * 0.56); ctx.closePath(); ctx.fill();
    } else if (m === 'flat') {
      ctx.strokeStyle = C.lip; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(R * 0.3, R * 0.6); ctx.quadraticCurveTo(R * 0.62, R * 0.62, R * 0.9, R * 0.44); ctx.stroke();
    } else if (m === 'o') {
      ctx.fillStyle = '#5a1620'; ctx.beginPath(); ctx.ellipse(R * 0.62, R * 0.58, 1.5, 1.8, 0, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = C.lip; ctx.beginPath(); ctx.moveTo(R * 0.28, R * 0.44); ctx.quadraticCurveTo(R * 0.6, R * 0.86, R * 0.94, R * 0.38); ctx.quadraticCurveTo(R * 0.6, R * 0.54, R * 0.28, R * 0.44); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(R * 0.32, R * 0.47); ctx.quadraticCurveTo(R * 0.6, R * 0.6, R * 0.9, R * 0.42); ctx.quadraticCurveTo(R * 0.6, R * 0.53, R * 0.32, R * 0.47); ctx.fill();
    }
    // big dark eyes with lashes
    const ev = P.eyes || 'open';
    for (const [ex, er] of [[R * 0.3, 1.9], [R * 0.82, 1.5]]) {
      const ey = -R * 0.1;
      if (ev === 'closed' || ev === 'happy') {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(ex, ey + (ev === 'happy' ? 0.8 : 0), er, Math.PI * 1.15, Math.PI * 1.85, ev === 'happy'); ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, ey, er * 1.0, er * 1.15, 0, 0, TAU); ctx.fill();
        const lx = ev === 'side' ? -er * 0.4 : er * 0.15;
        ctx.fillStyle = C.eye; ctx.beginPath(); ctx.ellipse(ex + lx, ey + 0.2, er * 0.72, er * 0.85, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + lx - er * 0.25, ey - er * 0.3, er * 0.28, 0, TAU); ctx.fill();
        if (ev === 'lidded') { ctx.fillStyle = C.skinSh; ctx.fillRect(ex - er * 1.2, ey - er * 1.4, er * 2.4, er * 1.05); }
        // lashes: a bold upper line flicking out at the corner
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.beginPath();
        const ly = ev === 'lidded' ? ey - er * 0.35 : ey - er * 0.75;
        ctx.moveTo(ex - er * 1.05, ly + er * 0.35); ctx.quadraticCurveTo(ex, ly - er * 0.25, ex + er * 1.1, ly + er * 0.1); ctx.lineTo(ex + er * 1.5, ly - er * 0.35); ctx.stroke();
      }
    }
    // brows: the near one goes up when she's unimpressed
    ctx.strokeStyle = C.hair; ctx.lineWidth = 1.3; ctx.beginPath();
    ctx.moveTo(R * 0.02, -R * 0.5 - P.brow * 2.2); ctx.quadraticCurveTo(R * 0.3, -R * 0.68 - P.brow * 2.6, R * 0.58, -R * 0.54 - P.brow * 1.6);
    ctx.moveTo(R * 0.66, -R * 0.52); ctx.quadraticCurveTo(R * 0.84, -R * 0.62, R * 1.0, -R * 0.5); ctx.stroke();
    // the hair cap: black, a side sweep and waves past the face
    const hg = ctx.createLinearGradient(0, -R * 1.2, 0, R); hg.addColorStop(0, C.hairHi); hg.addColorStop(0.4, C.hair); hg.addColorStop(1, C.hair);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(R * 1.04, -R * 0.36);
    ctx.quadraticCurveTo(R * 1.04, -R * 1.36, -R * 0.1, -R * 1.26);
    ctx.quadraticCurveTo(-R * 1.38, -R * 1.02, -R * 1.26, R * 0.3);
    ctx.quadraticCurveTo(-R * 1.26, R * 1.5, -R * 0.62, R * 1.95);
    ctx.quadraticCurveTo(-R * 0.22, R * 1.2, -R * 0.12, R * 0.15);
    ctx.quadraticCurveTo(R * 0.22, -R * 0.62, R * 1.04, -R * 0.36);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(C.hairHi, 0.9); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 1.08); ctx.quadraticCurveTo(-R * 1.0, -R * 0.4, -R * 0.9, R * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R * 0.15, -R * 1.06); ctx.quadraticCurveTo(R * 0.7, -R * 0.96, R * 0.96, -R * 0.5); ctx.stroke();
    // the pink bow
    ctx.save(); ctx.translate(-R * 0.35, -R * 1.12); ctx.rotate(-0.35);
    ctx.fillStyle = C.bow; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4.4, -2.6); ctx.lineTo(-4.2, 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4.4, -2.6); ctx.lineTo(4.2, 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  },
  draw(ctx, o) {
    const t = o.t || 0, f = o.facing || 1, C = CHINKA_O, D = CHINKA_O_DIM;
    const P = Object.assign(chinkaOPose(o.pose || 'idle', t), o.override || {});
    ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale);
    // the pirouette turns her: squeeze the figure through its edge-on moment and flip at the back
    const sp = P.spin; ctx.scale(f * (Math.sign(sp) || 1) * Math.max(0.3, Math.abs(sp)), 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hipY = P.hip + P.bob, top = hipY - D.torso;
    const rot = (x, y) => { const c = Math.cos(P.lean), s = Math.sin(P.lean), dx = x, dy = y - hipY; return [dx * c - dy * s, hipY + dx * s + dy * c]; };
    const [hcx, hcy] = rot(1.4, top - D.headR + 0.2);
    // the long wavy black hair behind her
    const sway = P.sway + Math.sin(t * 1.8) * 0.8;
    ctx.save(); ctx.translate(hcx, hcy); ctx.rotate(P.head * 0.5);
    ctx.fillStyle = C.hair; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    const len = 27;
    ctx.beginPath(); ctx.moveTo(-8, -6);
    ctx.bezierCurveTo(-15 + sway, 4, -16 + sway, 14, -12 + sway * 1.4, len - 4);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-11 + i * 3.2 + sway * 1.3, len + 2 - (i % 2) * 4, -8 + i * 3.2 + sway * 1.2, len - 2);
    ctx.quadraticCurveTo(-1, 12, 2, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rgba(C.hairHi, 0.7); ctx.lineWidth = 0.8;
    for (const k of [-10, -6]) { ctx.beginPath(); ctx.moveTo(k + 1, 0); ctx.bezierCurveTo(k - 3 + sway, 8, k + 2 + sway, 14, k - 1 + sway * 1.3, len - 6); ctx.stroke(); }
    ctx.restore();
    // legs: pale pink tights, satin slippers with crossed ribbons; en pointe the slipper stands on its toe
    const leg = (front) => {
      const th = front ? P.thF : P.thB, sh = front ? P.shF : P.shB, hx = front ? 2.4 : -2.2;
      const [kx, ky] = limbEnd(hx, hipY, th, D.thigh), [ax, ay] = limbEnd(kx, ky, sh, D.shin);
      const lc = front ? C.tights : C.tightsSh;
      outlinedCapsule(ctx, hx, hipY, kx, ky, 5.6, lc); outlinedCapsule(ctx, kx, ky, ax, ay, 4.6, lc);
      const pt = front ? P.pointeF : P.pointeB;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(-sh * 0.9 - (front ? P.toeTap : 0) + pt * 1.25);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(2.6, 0, 6.2, 3.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.slipper; ctx.beginPath(); ctx.ellipse(2.6, 0, 5.3, 2.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(3.6, -0.9, 2.4, 0.7, 0, 0, TAU); ctx.fill();
      ctx.restore();
      // the ribbons crossing up the ankle
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      const r1 = () => { ctx.beginPath(); ctx.moveTo(ax - 2, ay); ctx.lineTo(lerp(ax, kx, 0.28) + 2, lerp(ay, ky, 0.28)); ctx.moveTo(ax + 2, ay); ctx.lineTo(lerp(ax, kx, 0.28) - 2, lerp(ay, ky, 0.28)); ctx.stroke(); };
      r1(); ctx.strokeStyle = C.ribbon; ctx.lineWidth = 0.8; r1();
    };
    // arms: bare, slim, soft ballet hands
    const arm = (front, folded) => {
      let ua = front ? P.uaF : P.uaB, fa = front ? P.faF : P.faB;
      if (folded) { ua = front ? 0.28 : 0.12; fa = front ? -1.62 : 1.62; }
      const [sx, sy] = rot(front ? 3.4 : -3.2, top + 2.2);
      const [ex, ey] = limbEnd(sx, sy, ua, D.upper), [hx2, hy2] = limbEnd(ex, ey, fa, D.fore);
      const sk = front ? C.skin : C.skinSh;
      outlinedCapsule(ctx, sx, sy, ex, ey, 4.3, sk); outlinedCapsule(ctx, ex, ey, hx2, hy2, 3.9, sk);
      ctx.fillStyle = sk; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(hx2, hy2, 2.6, 2.2, Math.atan2(hy2 - ey, hx2 - ex), 0, TAU); ctx.fill(); ctx.stroke();
      return [hx2, hy2];
    };
    if (!P.fold) arm(false);
    leg(false);
    if (!P.seated) leg(true);
    // the torso: pink leotard; the tutu stands out round her hips in three layers
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(P.lean); ctx.translate(0, -hipY);
    const tg = ctx.createLinearGradient(-7, 0, 8, 0); tg.addColorStop(0, C.leoSh); tg.addColorStop(0.6, C.leo); tg.addColorStop(1, C.leoHi);
    ctx.fillStyle = tg; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5.6, top + 2.4); ctx.quadraticCurveTo(1, top + 0.6, 6.6, top + 2.4); ctx.lineTo(6.4, top + 8); ctx.quadraticCurveTo(5.2, hipY - 2, 5.8, hipY + 1); ctx.lineTo(-5.4, hipY + 1); ctx.quadraticCurveTo(-4.6, hipY - 2, -5.8, top + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    // bare shoulders and collarbone above the leotard, thin straps
    ctx.fillStyle = C.skinSh; ctx.beginPath(); ctx.moveTo(-5, top + 2.4); ctx.quadraticCurveTo(1, top - 1.8, 6.2, top + 2.4); ctx.quadraticCurveTo(1, top + 1.2, -5, top + 2.4); ctx.fill();
    ctx.strokeStyle = C.leoSh; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-3.6, top + 2.6); ctx.lineTo(-3.0, top - 0.2); ctx.moveTo(4.8, top + 2.6); ctx.lineTo(4.4, top - 0.2); ctx.stroke();
    ctx.strokeStyle = rgba(C.leoHi, 0.9); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(3, top + 5); ctx.quadraticCurveTo(4.6, top + 9, 3.6, hipY - 3); ctx.stroke();
    const tutu = (w, h, dy, col, n) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI, k = i % 2 ? 1 : 0.86; const px = Math.cos(a) * w * k, py = hipY + dy + Math.sin(a) * h * 0.35 * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI, k = i % 2 ? 1 : 0.8; ctx.lineTo(Math.cos(a) * w * k, hipY + dy + Math.sin(a) * h * k); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    const tf = P.seated ? 0.8 : 1;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    tutu(17 * tf, 6.4, -1.2, C.tutuSh, 16); tutu(15.5 * tf, 5.4, -2.2, C.tutu, 14); tutu(12 * tf, 3.8, -3.0, C.tutuHi, 12);
    ctx.fillStyle = C.leoSh; ctx.fillRect(-5.6, hipY - 4.6, 11.8, 1.6);
    // the head (tilts on the neck)
    ctx.fillStyle = C.skinSh; ctx.fillRect(0, top - 3.4, 3.4, 4);
    ctx.save(); ctx.translate(1.4, top); ctx.rotate(P.head); ctx.translate(-1.4, -top);
    ChinkaO.head(ctx, 1.4, top - D.headR + 0.2, 1, t, P);
    ctx.restore();
    ctx.restore();
    if (P.seated) leg(true);
    if (P.fold) { arm(false, true); arm(true, true); }
    else {
      const [hx, hy] = arm(true);
      if (P.bag) {
        // a striped paper bag of popcorn held in her lap (no brand on it)
        const [bx, by] = rot(7.4, hipY - 3.6);
        ctx.save(); ctx.translate(bx, by); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
        ctx.fillStyle = C.corn; for (const [dx, dy] of [[-2.4, -7.4], [0.4, -8.4], [2.8, -7.2], [-0.8, -6.6], [1.8, -6.2]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.7, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = C.bag; ctx.beginPath(); ctx.moveTo(-4.6, -6.4); ctx.lineTo(4.6, -6.4); ctx.lineTo(3.6, 2); ctx.lineTo(-3.6, 2); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip(); ctx.fillStyle = C.bagStripe; for (const sx of [-3, 0.6]) ctx.fillRect(sx, -7, 1.8, 10); ctx.restore(); ctx.stroke();
        ctx.restore();
        if (P.mouth === 'o') { ctx.fillStyle = C.corn; ctx.beginPath(); ctx.arc(hx + 1.6, hy - 1, 1.5, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7; ctx.stroke(); }
      }
    }
    if (P.pirouetteLines !== false && o.pose === 'pirouette') {
      // speed arcs round her waist
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2;
      for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(0, hipY + 1 + k * 5, 20 - k * 3, 4, 0, 0.2 + t * 3, 1.6 + t * 3); ctx.stroke(); }
    }
    if (P.hearts) {
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.9 + i / 3) % 1), hx = hcx + (i - 1) * 9 + Math.sin(t * 3 + i) * 2, hy = hcy - 16 - k * 22;
        const hs = (1 + i * 0.15) * Math.min(1, (1 - k) * 3); ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs);
        ctx.fillStyle = '#ff4f8a'; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-5, -1, -2.6, -5, 0, -2.2); ctx.bezierCurveTo(2.6, -5, 5, -1, 0, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }
};
