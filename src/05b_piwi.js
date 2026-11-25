/* ============================================================
   Piwi Squirmin': the villain of Super Brady-O World (Nov 2026).
   A wooden ventriloquist dummy with nobody working him: a prim,
   giggly show-off who has decided Princess Papaya is the leading lady of
   his world-tour variety show. Story and character sheet:
   docs/design/STORY_PIWI.md.
   Our own design: a big lacquered head with a hinged jaw (two jaw
   slots run from the mouth corners to the chin), glossy painted
   copper hair with one carved curl, round glassy eyes that glance
   sideways, painted rosy cheeks, a too-small magenta pinstripe
   jacket, a lemon polka-dot bow tie, teal trousers that stop short
   of his wooden ankles, peg joints at the wrists, snipped strings
   trailing from both wrists and a brass pull-ring in his back.
   Drawn like Brady (05_brady.js): code paths, feet-centre origin,
   facing +x; in the game it goes through Ink.around for the line.
   Not referenced by the game yet (phase A of the story change).
     Piwi.draw(ctx, { x, y, scale, facing, t, pose })
       pose: idle | walk | talk | gloat | startled | defeated
     Piwi.head(ctx, x, y, s, t, opts)   just the head (bobble toys, portraits, the map)
   ============================================================ */
const PIWI = {
  wood: '#f2c79c', woodSh: '#cf9866', woodDk: '#9a6436', woodHi: '#fff3e2',
  hair: '#c4501e', hairSh: '#7e2f10', hairHi: '#ffc08a',
  jacket: '#d6307a', jacketSh: '#97184f', lapel: '#a81f5c', stripe: 'rgba(255,214,232,0.55)',
  shirt: '#fff4e2', tie: '#ffd23a', tieSh: '#d8a414', tieDot: '#2a1a3a',
  pants: '#1d6e74', pantsSh: '#124a50', shoe: '#2a2030', sole: '#120c16', lace: '#ffd23a',
  cheek: 'rgba(255,84,112,0.78)', iris: '#2aa6c8', lip: '#b02c48', mouth: '#3a1020', tooth: '#fffaf0',
  brass: '#f0b83a', brassSh: '#a87418', string: '#fff1d8', ink: '#1c1426'
};
const PIWI_DIM = { hip: -20, torso: 14, headR: 11, upper: 7, fore: 6.5, thigh: 8, shin: 8.5 };

function piwiPose(pose, t) {
  const P = { bob: 0, lean: 0, hip: PIWI_DIM.hip, thF: 0.04, shF: 0, thB: -0.04, shB: 0, uaF: 0.1, faF: 0.22, uaB: -0.1, faB: 0.06,
    head: 0, neck: 0, jaw: 0, eyes: 'open', look: -1, lookY: 0, brow: 0, mouth: 'grin', spin: 0 };
  // the jaw clacks shut hard: open a beat, snap closed (a dummy's jaw has no in-between)
  const clack = (rate, amp) => (Math.sin(t * rate) > -0.2 ? amp * (0.6 + 0.4 * Math.abs(Math.sin(t * rate * 0.5))) : 0);
  switch (pose) {
    case 'walk': {
      // a scuttle: short stiff steps, knees that flop, a head that bobbles on its dowel
      const ph = t * 13;
      P.thF = Math.sin(ph) * 0.62; P.thB = -P.thF;
      P.shF = P.thF * 0.15 - Math.max(0, Math.sin(ph - 1.1)) * 0.75; P.shB = P.thB * 0.15 - Math.max(0, Math.sin(ph + Math.PI - 1.1)) * 0.75;
      P.uaF = -Math.sin(ph) * 0.7; P.faF = P.uaF + 0.25; P.uaB = Math.sin(ph) * 0.7; P.faB = P.uaB + 0.25;
      P.bob = -Math.abs(Math.cos(ph)) * 1.8 + 0.6; P.lean = 0.12; P.head = Math.sin(ph) * 0.09; P.look = 1;
      break;
    }
    case 'talk': {
      P.bob = Math.sin(t * 2.2) * 0.5; P.jaw = clack(17, 3.6); P.look = 0.7;
      P.uaF = 1.0 + Math.sin(t * 3.1) * 0.25; P.faF = 2.1 + Math.sin(t * 3.1) * 0.3; P.head = Math.sin(t * 3.1) * 0.05; P.brow = 1;
      break;
    }
    case 'gloat': {
      // one hand on his hip, the other fanned under his chin, head back, laughing (clack-clack-clack)
      P.uaB = -1.1; P.faB = 0.6; P.uaF = 2.5; P.faF = 3.3; P.head = -0.16; P.jaw = clack(21, 4.4);
      P.eyes = 'smug'; P.look = 1; P.brow = 1.5; P.lean = -0.06; P.bob = Math.abs(Math.sin(t * 10.5)) * -1.2;
      break;
    }
    case 'startled': {
      // feet off the floor, everything flung out, the head pops up on its neck spring
      P.bob = -5 - Math.abs(Math.sin(t * 9)) * 2; P.thF = 0.55; P.shF = -0.25; P.thB = -0.5; P.shB = 0.3;
      P.uaF = 2.5; P.faF = 2.0; P.uaB = -2.5; P.faB = -2.0; P.neck = 6 + Math.sin(t * 24) * 1.2; P.jaw = 4.2;
      P.eyes = 'wide'; P.look = 0; P.brow = 3.2; P.head = Math.sin(t * 30) * 0.05; P.mouth = 'o';
      break;
    }
    case 'defeated': {
      // slumped where he fell, like a dummy nobody is holding: legs out, head lolled, jaw hanging
      P.hip = -5; P.thF = 1.5; P.shF = 1.62; P.thB = 1.42; P.shB = 1.5; P.lean = 0.28;
      P.uaF = 0.35; P.faF = 0.15; P.uaB = -0.2; P.faB = -0.05; P.head = 0.55; P.jaw = 3; P.eyes = 'dizzy'; P.mouth = 'o';
      P.bob = Math.sin(t * 1.2) * 0.3;
      break;
    }
    default: { // idle: a prim little sway, the eyes snap from side to side
      P.bob = Math.sin(t * 2.2) * 0.5; P.head = Math.sin(t * 1.1) * 0.04;
      P.look = Math.sin(t * 0.9) > 0 ? -1 : 1; P.lookY = Math.sin(t * 0.9) > 0 ? 0.2 : 0;
    }
  }
  return P;
}

const Piwi = {
  C: PIWI,
  // the head: centre x,y; s scale; opts { jaw (0..5 px), eyes, look, lookY, brow, mouth }
  head(ctx, x, y, s, t, o) {
    o = o || {}; const C = PIWI, R = PIWI_DIM.headR, d = Math.max(0, o.jaw || 0);
    ctx.save(); ctx.translate(x, y); if (s && s !== 1) ctx.scale(s, s);
    const mY = 4.6, sl = -1.2, sr = 8.4;          // mouth line, the two jaw slots (x)
    const skull = () => { ctx.beginPath(); ctx.ellipse(0, 0, R * 1.02, R, 0, 0, TAU); };
    // ear (the back of his head faces -x)
    ctx.fillStyle = C.woodSh; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(-R * 0.86, 1.2, 2.6, 3.4, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
    // the skull: lacquered wood, lit from the upper left
    const g = ctx.createRadialGradient(-3, -5, 1, 0, 0, R * 1.15); g.addColorStop(0, C.woodHi); g.addColorStop(0.45, C.wood); g.addColorStop(1, C.woodSh);
    ctx.fillStyle = g; skull(); ctx.fill();
    // the jaw drops: a dark mouth behind it, then the jaw block drawn lower
    if (d > 0.05) {
      ctx.save(); skull(); ctx.rect(sl - 0.2, mY, sr - sl + 0.4, R); ctx.clip();
      ctx.fillStyle = C.mouth; ctx.fillRect(sl, mY, sr - sl, R + d);
      ctx.restore();
      ctx.fillStyle = C.mouth; ctx.fillRect(sl, mY, sr - sl, d + 0.5);
      ctx.fillStyle = C.tooth; ctx.fillRect(sl + 0.8, mY, sr - sl - 1.6, Math.min(1.4, d * 0.4));   // a painted row of teeth
      ctx.fillStyle = '#d8485a'; ctx.beginPath(); ctx.ellipse((sl + sr) / 2 + 0.6, mY + d - 0.2, (sr - sl) * 0.3, Math.min(1.6, d * 0.4), 0, Math.PI, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(sl, mY + d, sr - sl, R + 2); ctx.clip(); ctx.translate(0, d);
      ctx.fillStyle = g; skull(); ctx.fill(); ctx.restore();
    }
    // the jaw slots and chin: the jaw block's edges, from the mouth corners down past the chin
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.95; ctx.lineCap = 'round';
    const chinY = (x0) => Math.sqrt(Math.max(0, R * R - x0 * x0 / 1.04)) - 0.4;
    ctx.beginPath(); ctx.moveTo(sl, mY - 0.4); ctx.lineTo(sl, chinY(sl) + d); ctx.moveTo(sr, mY - 0.4); ctx.lineTo(sr, chinY(sr) + d); ctx.stroke();
    if (d > 0.05) { ctx.beginPath(); ctx.moveTo(sl, mY + d); ctx.lineTo(sr, mY + d); ctx.stroke(); }
    // the outline of the jaw block where it hangs below the skull
    if (d > 0.4) {
      ctx.save(); ctx.beginPath(); ctx.rect(sl, mY + d, sr - sl, R + 2); ctx.clip(); ctx.translate(0, d);
      skull(); ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore();
    }
    // painted rosy cheeks, either side of the jaw slots
    ctx.fillStyle = C.cheek; ctx.beginPath(); ctx.ellipse(-4.8, 3.2, 2.5, 1.9, 0, 0, TAU); ctx.ellipse(10.2, 2.6, 1.3, 1.8, 0, 0, TAU); ctx.fill();
    // the painted grin: a crisp upturned line with lip colour at the corners
    if (d <= 0.05) {
      ctx.strokeStyle = C.lip; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(sl - 0.6, mY - 1.0);
      if (o.mouth === 'o') ctx.quadraticCurveTo((sl + sr) / 2, mY + 0.6, sr + 0.6, mY - 1.0);
      else ctx.quadraticCurveTo((sl + sr) / 2, mY + 1.9, sr + 0.6, mY - 1.2);
      ctx.stroke();
    }
    // nose: a little round peg
    ctx.fillStyle = C.woodSh; ctx.beginPath(); ctx.ellipse(5.2, 1.2, 1.5, 1.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(4.8, 0.7, 0.5, 0, TAU); ctx.fill();
    // eyes: round glassy marbles, the far one smaller
    const eyes = o.eyes || 'open', look = o.look == null ? -1 : o.look, ly = o.lookY || 0;
    const eye = (ex, ey, r) => {
      const big = eyes === 'wide' ? 1.2 : 1;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(ex, ey, r * big, r * 1.08 * big, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (eyes === 'dizzy') {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let a = 0; a < 9; a += 0.4) { const rr2 = a * r * 0.09, px = ex + Math.cos(a + t * 6) * rr2, py = ey + Math.sin(a + t * 6) * rr2; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); return;
      }
      const pr = eyes === 'wide' ? r * 0.36 : r * 0.62;
      const px = ex + look * (r * big - pr) * 0.85, py = ey + ly * r * 0.5;
      ctx.fillStyle = C.iris; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(px, py, pr * 0.55, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.4, Math.max(0.5, pr * 0.32), 0, TAU); ctx.fill();
      if (eyes === 'smug') {
        // heavy lacquered lids, half shut
        ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, r + 0.2, r * 1.08 + 0.2, 0, 0, TAU); ctx.clip();
        ctx.fillStyle = C.woodSh; ctx.fillRect(ex - r - 1, ey - r * 1.2 - 1, r * 2 + 2, r * 1.15 + 1); ctx.restore();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(ex - r, ey - 0.1 * r); ctx.lineTo(ex + r, ey - 0.1 * r); ctx.stroke();
      }
    };
    eye(0.4, -2.6, 3.4); eye(7.6, -2.9, 2.8);
    // brows: thin painted arches, high on the forehead
    const b = o.brow || 0;
    ctx.strokeStyle = C.hairSh; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0.4, -3.4 - b * 0.6, 4.6, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
    ctx.beginPath(); ctx.arc(7.7, -3.6 - b * 0.6, 3.6, Math.PI * 1.2, Math.PI * 1.85); ctx.stroke();
    // the hair: a glossy painted helmet with a side parting and one carved curl at the front
    ctx.fillStyle = C.hair; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-R * 1.02, 0.5);
    ctx.bezierCurveTo(-R * 1.16, -R * 0.9, -R * 0.5, -R * 1.32, R * 0.18, -R * 1.18);
    ctx.bezierCurveTo(R * 0.72, -R * 1.1, R * 1.06, -R * 0.82, R * 1.04, -R * 0.3);
    ctx.bezierCurveTo(R * 0.76, -R * 0.62, R * 0.32, -R * 0.66, -0.5, -R * 0.62);
    ctx.bezierCurveTo(-R * 0.42, -R * 0.55, -R * 0.74, -R * 0.2, -R * 0.68, 0.6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // the carved curl over the forehead
    ctx.beginPath(); ctx.moveTo(R * 0.2, -R * 1.12); ctx.bezierCurveTo(R * 0.7, -R * 1.62, R * 1.12, -R * 1.18, R * 0.82, -R * 0.96);
    ctx.bezierCurveTo(R * 0.64, -R * 0.84, R * 0.5, -R * 1.08, R * 0.68, -R * 1.18); ctx.stroke();
    // the part and the gloss
    ctx.strokeStyle = C.hairSh; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-R * 0.25, -R * 1.18); ctx.quadraticCurveTo(-R * 0.1, -R * 0.9, -0.5, -R * 0.64); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,236,214,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-1.5, -1, R * 0.92, Math.PI * 1.13, Math.PI * 1.38); ctx.stroke();
    ctx.fillStyle = C.hairHi; ctx.beginPath(); ctx.ellipse(R * 0.6, -R * 1.2, 1.4, 0.8, -0.4, 0, TAU); ctx.fill();
    // the lacquer gloss on the skull
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-5.4, -0.6, 1.0, 2.2, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
  },
  draw(ctx, o) {
    const t = o.t || 0, f = o.facing || 1, C = PIWI, D = PIWI_DIM;
    const P = Object.assign(piwiPose(o.pose || 'idle', t), o.override || {});
    ctx.save(); ctx.translate(o.x, o.y); if (o.scale) ctx.scale(o.scale, o.scale); ctx.scale(f, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hipY = P.hip + P.bob;
    // leg: a wooden dowel shin with the too-short trouser leg over it and a two-tone shoe
    const leg = (front) => {
      const th = front ? P.thF : P.thB, sh = front ? P.shF : P.shB, hx = front ? 2.4 : -2.2;
      const [kx, ky] = limbEnd(hx, hipY, th, D.thigh), [ax, ay] = limbEnd(kx, ky, sh, D.shin);
      const pc = front ? C.pants : C.pantsSh;
      outlinedCapsule(ctx, kx, ky, ax, ay, 2.6, front ? C.wood : C.woodSh);
      outlinedCapsule(ctx, hx, hipY, kx, ky, 5.2, pc);
      const cx2 = lerp(kx, ax, 0.5), cy2 = lerp(ky, ay, 0.5);
      outlinedCapsule(ctx, kx, ky, cx2, cy2, 4.8, pc);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(cx2, cy2, 2.3, sh + 0.3, sh + Math.PI - 0.3); ctx.stroke();   // the cuff
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(-sh * 0.92);
      ctx.fillStyle = C.ink; rr(ctx, -3.8, -1.6, 11.6, 5.6, 2.6); ctx.fill();
      ctx.fillStyle = front ? C.shoe : shade(C.shoe, -0.15); rr(ctx, -3.1, -1.0, 10.4, 4.4, 2.1); ctx.fill();
      ctx.fillStyle = C.sole; ctx.fillRect(-3.1, 2.4, 10.4, 1.0);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(4.6, 0.2, 1.8, 0.7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.lace; ctx.fillRect(0.6, -1.0, 2.2, 1.1);
      ctx.restore();
    };
    // the body pivots on the hip by P.lean
    const R2 = (x, y) => { const c = Math.cos(P.lean), s = Math.sin(P.lean), dx = x, dy = y - hipY; return [dx * c - dy * s, hipY + dx * s + dy * c]; };
    const shY = hipY - D.torso + 1.5;
    const arm = (front) => {
      const ua = front ? P.uaF : P.uaB, fa = front ? P.faF : P.faB;
      const [sx, sy] = R2(front ? 4.2 : -4.0, shY);
      const [ex, ey] = limbEnd(sx, sy, ua, D.upper), [hx2, hy2] = limbEnd(ex, ey, fa, D.fore);
      const sk = front ? C.wood : C.woodSh;
      outlinedCapsule(ctx, ex, ey, hx2, hy2, 2.8, sk);
      // the snipped string, trailing from the wrist peg
      if (!o.noStrings) {
        const wx = lerp(ex, hx2, 0.72), wy = lerp(ey, hy2, 0.72), sw = Math.sin(t * 2.6 + (front ? 0 : 1.7)) * 3;
        ctx.strokeStyle = 'rgba(28,20,38,0.55)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx - 4 + sw, wy + 7, wx - 7 + sw * 1.4, wy + 13); ctx.stroke();
        ctx.strokeStyle = C.string; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx - 4 + sw, wy + 7, wx - 7 + sw * 1.4, wy + 13); ctx.stroke();
        ctx.fillStyle = C.woodDk; ctx.beginPath(); ctx.arc(wx, wy, 0.8, 0, TAU); ctx.fill();
      }
      // the jacket sleeve: too short, it stops halfway down the forearm
      outlinedCapsule(ctx, sx, sy, ex, ey, 4.8, front ? C.jacket : C.jacketSh);
      outlinedCapsule(ctx, ex, ey, lerp(ex, hx2, 0.32), lerp(ey, hy2, 0.32), 4.6, front ? C.jacket : C.jacketSh);
      // a white cuff peeking out, then the wooden mitt with a thumb
      const cfx = lerp(ex, hx2, 0.38), cfy = lerp(ey, hy2, 0.38);
      ctx.fillStyle = C.shirt; ctx.beginPath(); ctx.arc(cfx, cfy, 1.6, 0, TAU); ctx.fill();
      const hd = Math.atan2(hy2 - ey, hx2 - ex);
      ctx.save(); ctx.translate(hx2, hy2); ctx.rotate(hd);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(1.2, 0, 3.6, 3.0, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = sk; ctx.beginPath(); ctx.ellipse(1.2, 0, 2.8, 2.25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = sk; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0.4, -2.3, 1.0, 1.6, -0.6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.woodDk; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(2.6, -1.0); ctx.lineTo(3.8, -0.8); ctx.moveTo(2.6, 0.6); ctx.lineTo(3.8, 0.8); ctx.stroke();
      ctx.restore();
    };
    arm(false);
    leg(false); leg(true);
    // the torso: a jacket a size too small (cropped hem, shirt showing, a straining button)
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(P.lean); ctx.translate(0, -hipY);
    const top = hipY - D.torso, bot = hipY - 2.6;
    ctx.fillStyle = C.pantsSh; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; rr(ctx, -5.6, hipY - 3.4, 11.4, 4.4, 1.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.shirt; ctx.fillRect(-5.2, bot - 1.6, 10.4, 2.4);
    const jt = (k) => { ctx.beginPath(); ctx.moveTo(-6.6, top + 1.2); ctx.quadraticCurveTo(0, top - 1.4 * k, 6.6, top + 1.2); ctx.lineTo(7.4, bot - 1.2); ctx.quadraticCurveTo(0.4, bot + 0.6, -7.2, bot - 1.2); ctx.closePath(); };
    const jg = ctx.createLinearGradient(-7, 0, 7, 0); jg.addColorStop(0, C.jacketSh); jg.addColorStop(0.55, C.jacket); jg.addColorStop(1, C.jacket);
    ctx.fillStyle = jg; jt(1); ctx.fill();
    ctx.save(); jt(1); ctx.clip(); ctx.strokeStyle = C.stripe; ctx.lineWidth = 0.55;
    for (let x = -6; x <= 7; x += 2.2) { ctx.beginPath(); ctx.moveTo(x, top - 2); ctx.lineTo(x + 0.6, bot + 1); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; jt(1); ctx.stroke();
    // lapels and the shirt front
    ctx.fillStyle = C.shirt; ctx.beginPath(); ctx.moveTo(-1.6, top + 0.4); ctx.lineTo(4.4, top + 0.4); ctx.lineTo(1.6, top + 7.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.lapel; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-2.6, top + 0.2); ctx.lineTo(1.4, top + 7.6); ctx.lineTo(-1.8, top + 4.2); ctx.lineTo(-3.4, top + 3.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5.4, top + 0.2); ctx.lineTo(1.8, top + 7.6); ctx.lineTo(4.6, top + 4.2); ctx.lineTo(6.2, top + 3.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the one straining button, with stress lines
    ctx.fillStyle = C.brass; ctx.beginPath(); ctx.arc(1.8, top + 9.4, 1.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,10,40,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (const s of [-1, 1]) { ctx.moveTo(1.8 + s * 1.8, top + 9.4); ctx.lineTo(1.8 + s * 4.2, top + 8.4); ctx.moveTo(1.8 + s * 1.8, top + 9.8); ctx.lineTo(1.8 + s * 4.0, top + 11.0); }
    ctx.stroke();
    // the brass pull-ring in his back (nobody is pulling it)
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(-8.6, top + 5.6, 2.1, 0, TAU); ctx.stroke();
    ctx.strokeStyle = C.brass; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-8.6, top + 5.6, 2.1, 0, TAU); ctx.stroke();
    ctx.fillStyle = C.brassSh; ctx.fillRect(-7.4, top + 5.0, 1.4, 1.2);
    // collar points and the bow tie
    ctx.fillStyle = C.shirt; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-2.4, top - 0.4); ctx.lineTo(1.2, top + 1.0); ctx.lineTo(-0.8, top + 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5.0, top - 0.4); ctx.lineTo(1.6, top + 1.0); ctx.lineTo(3.8, top + 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    const tw = Math.sin(t * 3) * 0.06;
    ctx.save(); ctx.translate(1.4, top + 0.6); ctx.rotate(tw);
    ctx.fillStyle = C.tie; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5.2, -2.6); ctx.lineTo(-5.0, 2.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(5.2, -2.6); ctx.lineTo(5.0, 2.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.tieSh; ctx.beginPath(); ctx.ellipse(0, 0, 1.5, 1.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.tieDot; for (const [dx, dy] of [[-3.4, -0.6], [-2.6, 1.4], [3.4, -0.6], [2.6, 1.4]]) { ctx.beginPath(); ctx.arc(dx, dy, 0.55, 0, TAU); ctx.fill(); }
    ctx.restore();
    // the neck dowel; when he is startled the head pops up on a coiled spring
    const nY = top - 0.5, headY = nY - 1.4 - P.neck - D.headR + 0.6;
    if (P.neck > 0.5) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const yy = nY - k * P.neck / 6, xx = 1.4 + (k % 2 ? 2.2 : -2.2); k ? ctx.lineTo(xx, yy) : ctx.moveTo(1.4, yy); }
      ctx.stroke();
      ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.save(); ctx.translate(1.4, headY + D.headR * 0.8); ctx.rotate(P.head); ctx.translate(-1.4, -(headY + D.headR * 0.8));
    Piwi.head(ctx, 1.4, headY, 1, t, P);
    ctx.restore();
    ctx.restore();   // torso lean
    arm(true);
    ctx.restore();
  },
  // a little sign, a flag and the map: his monogram on a magenta disc
  badge(ctx, x, y, r) {
    const C = PIWI; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = C.jacket; ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.tie; ctx.font = `${Math.round(r * 1.3)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 0, r * 0.08);
    ctx.restore();
  }
};
