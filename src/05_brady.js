/* ============================================================
   Brady — procedural character art, pose animation, hair physics
   ============================================================ */
const BRADY_DIM = {
  big: { hip: 25, shoulder: 43, headY: 52, headR: 9.4, thigh: 11.5, shin: 11.5, upper: 9.5, fore: 9, torsoW: 17.5, legW: 6.8, armW: 5.6, hairN: 7, hairL: 4.6, hairW: 17 },
  small: { hip: 8.5, shoulder: 15, headY: 21.5, headR: 8.6, thigh: 4.6, shin: 4.4, upper: 5, fore: 4.6, torsoW: 13, legW: 5.4, armW: 4.2, hairN: 6, hairL: 3.2, hairW: 14 }
};
const CLOTH = {
  jacket: '#191922', jacketHi: '#34344a', jeans: '#121219', jeansHi: '#2a2a3a', boot: '#08080b', sole: '#34343e',
  outline: 'rgba(150,150,205,0.42)', tee: '#0c0c10'
};

function bradyPose(anim, small) {
  const t = anim.t, ph = anim.phase;
  const P = { lean: 0, bob: 0, thF: 0.05, shF: 0, thB: -0.05, shB: 0, uaF: 0.15, faF: 0.45, uaB: -0.15, faB: 0.2, head: 0, crouch: 0, mouth: 'flat', eyes: 'open', phone: false, squash: 1 };
  switch (anim.state) {
    case 'idle': {
      P.bob = Math.sin(t * 2.4) * 0.6;
      P.uaF = 0.12 + Math.sin(t * 2.4) * 0.03; P.uaB = -0.12;
      break;
    }
    case 'run': {
      const amp = clamp(anim.speed, 0.3, 1.15);
      P.thF = Math.sin(ph) * 0.85 * amp; P.thB = Math.sin(ph + Math.PI) * 0.85 * amp;
      P.shF = P.thF - (0.15 + Math.max(0, Math.sin(ph - 1.4)) * 1.3) * amp;
      P.shB = P.thB - (0.15 + Math.max(0, Math.sin(ph + Math.PI - 1.4)) * 1.3) * amp;
      P.uaF = -Math.sin(ph) * 0.8 * amp; P.faF = P.uaF + 1.2;
      P.uaB = -Math.sin(ph + Math.PI) * 0.8 * amp; P.faB = P.uaB + 1.2;
      P.bob = -Math.abs(Math.cos(ph)) * 1.6 * amp + 0.8;
      P.lean = 0.12 * amp;
      break;
    }
    case 'jump': {
      P.thF = 1.0; P.shF = 0.2; P.thB = -0.35; P.shB = -1.0;
      P.uaF = 2.7; P.faF = 3.0; P.uaB = -0.9; P.faB = -0.4; P.lean = 0.05;
      break;
    }
    case 'fall': {
      const w = Math.sin(t * 14) * 0.15;
      P.thF = 0.45; P.shF = 0.05; P.thB = -0.2; P.shB = -0.6;
      P.uaF = 2.1 + w; P.faF = 2.4 + w; P.uaB = -2.0 - w; P.faB = -2.3 - w;
      break;
    }
    case 'skid': {
      P.lean = -0.3; P.thF = 0.75; P.shF = 0.55; P.thB = 0.15; P.shB = -0.2;
      P.uaF = 1.2; P.faF = 1.6; P.uaB = -1.3; P.faB = -1.0;
      break;
    }
    case 'crouch': {
      P.crouch = 1; P.thF = 1.5; P.shF = -0.4; P.thB = 1.2; P.shB = -0.7;
      P.uaF = 0.6; P.faF = 1.4; P.uaB = 0.3; P.faB = 1.0; P.lean = 0.25;
      break;
    }
    case 'swim': {
      const k = Math.sin(t * 7);
      P.thF = 0.35 + k * 0.45; P.shF = P.thF - 0.3; P.thB = -0.35 - k * 0.45; P.shB = P.thB - 0.3;
      const s = anim.stroke;
      P.uaF = 2.6 - s * 1.9; P.faF = P.uaF + 0.3; P.uaB = 2.4 - s * 1.6; P.faB = P.uaB + 0.2;
      P.lean = 0.6;
      break;
    }
    case 'die': {
      P.uaF = 2.6; P.faF = 2.9; P.uaB = -2.6; P.faB = -2.9; P.thF = 0.3; P.thB = -0.3; P.shF = 0; P.shB = 0;
      P.mouth = 'o'; P.eyes = 'x';
      break;
    }
    case 'victory': {
      const j = Math.min(1, t * 3);
      P.uaF = 2.9 * j; P.faF = 3.1 * j; P.uaB = -0.3; P.faB = 0.4; P.mouth = 'grin';
      P.bob = Math.abs(Math.sin(t * 6)) * -2;
      break;
    }
    case 'airguitar': {
      P.thF = 0.4; P.shF = 0.1; P.thB = -0.4; P.shB = -0.1;
      P.uaF = 0.5 + Math.sin(t * 16) * 0.3; P.faF = 1.7 + Math.sin(t * 16) * 0.35;
      P.uaB = 1.25; P.faB = 1.65;
      P.head = Math.sin(t * 8) * 0.22; P.bob = Math.abs(Math.sin(t * 8)) * -1.5; P.mouth = 'o';
      P.lean = 0.08 + Math.sin(t * 8) * 0.05;
      break;
    }
    case 'headbang': {
      P.head = Math.sin(t * 13) * 0.55; P.lean = 0.2 + Math.sin(t * 13) * 0.18;
      P.uaF = 2.8; P.faF = 3.0; P.uaB = -0.3; P.faB = 0.2; P.mouth = 'o';
      P.thF = 0.3; P.thB = -0.3;
      break;
    }
    case 'phone': {
      P.uaF = 0.7; P.faF = 2.5; P.uaB = 0.2; P.faB = 1.2; P.head = 0.22; P.phone = true;
      P.bob = Math.sin(t * 1.5) * 0.4;
      break;
    }
    case 'throw': {
      P.uaF = 1.5; P.faF = 1.55; P.uaB = -0.6; P.faB = -0.3; P.lean = 0.12;
      if (anim.base === 'run') { P.thF = Math.sin(ph) * 0.8; P.thB = -P.thF; P.shF = P.thF - 0.4; P.shB = P.thB - 0.4; }
      break;
    }
    case 'ride': {
      P.thF = 1.3; P.shF = -0.15; P.thB = 1.15; P.shB = -0.3; P.uaF = 0.95; P.faF = 1.7; P.uaB = 0.7; P.faB = 1.5; P.lean = 0.12; P.mouth = 'grin';
      P.bob = Math.sin(t * 6) * 0.6;
      break;
    }
    case 'hang': {
      P.uaF = 2.9; P.faF = 3.1; P.uaB = 2.7; P.faB = 3.0; P.thF = 0.25; P.thB = -0.2; P.shF = 0.1; P.shB = -0.1;
      break;
    }
    case 'fly': {
      P.lean = 0.45; P.uaF = 2.3; P.faF = 2.5; P.uaB = -0.5; P.faB = -0.2; P.thF = 0.15; P.shF = -0.1; P.thB = -0.6; P.shB = -0.9; P.mouth = 'grin';
      break;
    }
    case 'float': {
      P.bob = Math.sin(t * 2) * 1.5; P.uaF = 1.4 + Math.sin(t * 2) * 0.2; P.faF = 1.8; P.uaB = -1.3; P.faB = -1.7;
      P.thF = 0.2; P.shF = 0.05; P.thB = -0.1; P.shB = -0.2; P.head = 0.12; P.mouth = 'smile';
      break;
    }
    case 'enter': {
      P.uaF = 0.1; P.faF = 0.2; P.uaB = -0.1; P.faB = -0.2;
      break;
    }
  }
  if (anim.blink) P.eyes = P.eyes === 'x' ? 'x' : 'closed';
  if (anim.happy && P.mouth === 'flat') P.mouth = 'grin';
  return P;
}

function limbEnd(x, y, a, l) { return [x + Math.sin(a) * l, y + Math.cos(a) * l]; }
function capsule(ctx, x0, y0, x1, y1, w, col) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}
function outlinedCapsule(ctx, x0, y0, x1, y1, w, col) {
  capsule(ctx, x0, y0, x1, y1, w + 2, CLOTH.outline);
  capsule(ctx, x0, y0, x1, y1, w, col);
}

// Hair chain helper (lives on the player)
function makeHair(n, x, y) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x, y: y + i * 3, px: x, py: y + i * 3 });
  return pts;
}
function stepHair(hair, ax, ay, facing, L, dt, wind) {
  hair[0].x = ax; hair[0].y = ay; hair[0].px = ax; hair[0].py = ay;
  const g = 1400 * dt * dt;
  for (let i = 1; i < hair.length; i++) {
    const p = hair[i];
    const vx = (p.x - p.px) * 0.86, vy = (p.y - p.py) * 0.86;
    p.px = p.x; p.py = p.y;
    p.x += vx + (wind || 0) * dt * dt; p.y += vy + g;
    // rest bias: hair hangs down-and-back
    const restX = ax - facing * L * 0.24 * i, restY = ay + L * 0.96 * i;
    p.x += (restX - p.x) * 0.045; p.y += (restY - p.y) * 0.03;
  }
  for (let it = 0; it < 2; it++) {
    for (let i = 1; i < hair.length; i++) {
      const a = hair[i - 1], b = hair[i];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
      const k = L / d;
      b.x = a.x + dx * k; b.y = a.y + dy * k;
    }
  }
  // keep hair out of the face: no point further forward than the anchor
  for (let i = 1; i < hair.length; i++) {
    const p = hair[i];
    if ((p.x - ax) * facing > 1.5) p.x = ax + facing * 1.5;
  }
}
// where the hair attaches (world coords) for a given player state
function hairAnchor(px, py, facing, small, pose) {
  const D = small ? BRADY_DIM.small : BRADY_DIM.big;
  const crouchDrop = pose ? pose.crouch * (small ? 3 : 14) : 0;
  return { x: px - facing * D.headR * 0.55, y: py - D.headY - D.headR * 0.55 + crouchDrop + (pose ? -pose.bob : 0) };
}

function drawHairMass(ctx, pts, wTop, wTip, base, hi, sx, sy, facing) {
  // pts in world coords -> local coords
  const L = pts.map(p => ({ x: (p.x - sx) * facing, y: p.y - sy }));
  const n = L.length;
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = L[Math.max(0, i - 1)], b = L[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(wTop, wTip, Math.pow(i / (n - 1), 0.9)) / 2;
    left.push([L[i].x - dy * w, L[i].y + dx * w]); right.push([L[i].x + dy * w, L[i].y - dx * w]);
  }
  const g = ctx.createLinearGradient(0, L[0].y - 4, 0, L[n - 1].y + 4);
  g.addColorStop(0, hi); g.addColorStop(0.35, base); g.addColorStop(1, shade(base, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) { const m = [(left[i - 1][0] + left[i][0]) / 2, (left[i - 1][1] + left[i][1]) / 2]; ctx.quadraticCurveTo(left[i - 1][0], left[i - 1][1], m[0], m[1]); }
  // pointed, slightly split tip
  const tip = L[n - 1];
  ctx.lineTo(left[n - 1][0], left[n - 1][1]);
  ctx.quadraticCurveTo(tip.x - 1, tip.y + 4, tip.x, tip.y + 2);
  ctx.quadraticCurveTo(tip.x + 1, tip.y + 4, right[n - 1][0], right[n - 1][1]);
  for (let i = n - 2; i >= 0; i--) { const m = [(right[i + 1][0] + right[i][0]) / 2, (right[i + 1][1] + right[i][1]) / 2]; ctx.quadraticCurveTo(right[i + 1][0], right[i + 1][1], m[0], m[1]); }
  ctx.lineTo(right[0][0], right[0][1]);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
  // strands
  ctx.strokeStyle = rgba(hi, 0.45); ctx.lineWidth = 0.8;
  for (let s = -1; s <= 1; s += 2) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const w = lerp(wTop, wTip, i / (n - 1)) * 0.22 * s; const x = (left[i][0] + right[i][0]) / 2 + w, y = (left[i][1] + right[i][1]) / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
}

/*
  drawBrady(ctx, o)
  o: { x, y (feet centre, world), facing, small, power (0..2), anim, hair (world pts), look, alpha, star, time, scale }
  look: { hair, skin, style: 'bun'|'down', glasses: 'shades'|'clear'|'none', tattoos: bool, beard: bool }
*/
const INK = '#17141c';

// an arm segment with an optional blackwork (geometric) tattoo between fractions a..b
function inkedLimb(ctx, x0, y0, x1, y1, w, skinCol, inkA, inkB, small) {
  outlinedCapsule(ctx, x0, y0, x1, y1, w, skinCol);
  if (inkB <= inkA) return;
  const ax = lerp(x0, x1, inkA), ay = lerp(y0, y1, inkA), bx = lerp(x0, x1, inkB), by = lerp(y0, y1, inkB);
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux;
  capsule(ctx, ax, ay, bx, by, w * 0.84, 'rgba(23,20,28,0.3)');
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round';
  if (small) {
    ctx.lineWidth = 0.8;
    for (const k of [0.15, 0.55, 0.9]) { const cx = ax + dx * k, cy = ay + dy * k; ctx.beginPath(); ctx.moveTo(cx + px * w * 0.38, cy + py * w * 0.38); ctx.lineTo(cx - px * w * 0.38, cy - py * w * 0.38); ctx.stroke(); }
    return;
  }
  const n = Math.max(3, Math.round(len / 1.9));
  const at = (k, off) => [ax + dx * k + px * off, ay + dy * k + py * off];
  // zig-zag spine
  ctx.lineWidth = 0.75; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const [x, y] = at(i / n, (i % 2 ? 1 : -1) * w * 0.3); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  // solid diamonds in alternate cells, dots in the others
  for (let i = 0; i < n; i++) {
    const [cx, cy] = at((i + 0.5) / n, 0), r = w * 0.2;
    if (i % 2 === 0) {
      ctx.beginPath(); ctx.moveTo(cx + ux * r * 1.5, cy + uy * r * 1.5); ctx.lineTo(cx + px * r, cy + py * r);
      ctx.lineTo(cx - ux * r * 1.5, cy - uy * r * 1.5); ctx.lineTo(cx - px * r, cy - py * r); ctx.closePath(); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(cx, cy, w * 0.07, 0, TAU); ctx.fill(); }
  }
  // border bands at each end of the piece
  ctx.lineWidth = 0.95;
  for (const k of [0, 1]) { const [x0b, y0b] = at(k, w * 0.4), [x1b, y1b] = at(k, -w * 0.4); ctx.beginPath(); ctx.moveTo(x0b, y0b); ctx.lineTo(x1b, y1b); ctx.stroke(); }
}

function drawBrady(ctx, o) {
  const D = o.small ? BRADY_DIM.small : BRADY_DIM.big;
  const P = bradyPose(o.anim, o.small);
  const look = o.look || {};
  const style = look.style || 'bun', glasses = look.glasses || 'shades';
  const tattoos = look.tattoos !== false, beard = look.beard !== false;
  const hair = HAIR_COLORS[look.hair] || HAIR_COLORS[0];
  const skin = SKIN_TONES[look.skin] || SKIN_TONES[1];
  const f = o.facing;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.scale) ctx.scale(o.scale, o.scale);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;

  if (o.fly) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const hue = (o.time * 200 + i * 120) % 360, rr2 = D.headY * (0.55 + i * 0.12);
      ctx.strokeStyle = `hsla(${hue},100%,65%,0.35)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -D.headY * 0.5, rr2 * 0.7, rr2, o.time * (1 + i * 0.4), 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  if (o.floaty) {
    ctx.save();
    for (let i = 0; i < 6; i++) { const k = (o.time * 0.4 + i / 6) % 1; ctx.fillStyle = `rgba(235,235,245,${0.28 * (1 - k)})`; ctx.beginPath(); ctx.arc(Math.sin(i * 2.3 + o.time) * 10 * k, -D.headY - 4 - k * 26, 4 + k * 9, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // star aura
  if (o.star) {
    const hue = (o.time * 360) % 360;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ag = ctx.createRadialGradient(0, -D.headY * 0.55, 4, 0, -D.headY * 0.55, D.headY * 0.95);
    ag.addColorStop(0, `hsla(${hue},100%,70%,0.45)`); ag.addColorStop(1, `hsla(${(hue + 80) % 360},100%,60%,0)`);
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, -D.headY * 0.55, D.headY * 0.95, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // long hair worn down: physics chain drawn behind the body
  if (style === 'down' && o.hair) {
    ctx.save(); ctx.scale(f, 1);
    drawHairMass(ctx, o.hair, D.hairW * 1.12, o.small ? 5 : 7, hair.base, hair.hi, o.x, o.y, f);
    ctx.restore();
  }
  // sway of the bun's loose ends, taken from the hair chain
  let sway = 0, swayY = 0;
  if (o.hair && o.hair.length > 2) { sway = clamp((o.hair[2].x - o.hair[0].x) * f, -8, 8); swayY = clamp(o.hair[2].y - o.hair[0].y, -8, 12); }

  ctx.scale(f, 1);
  const crouchDrop = P.crouch * (o.small ? 3 : 14);
  const hipY = -D.hip + crouchDrop - P.bob;
  const shY = -D.shoulder + crouchDrop - P.bob;
  const lean = P.lean;
  const hipX = 0, shX = Math.sin(lean) * (D.shoulder - D.hip);
  const neon = o.power === 2;
  const trim = '#ff4fd8';
  const sleeveK = 0.36; // short sleeves cover this much of the upper arm

  const drawArm = (sx, sy, ua, fa, back) => {
    const [ex, ey] = limbEnd(sx, sy, ua, D.upper);
    const [hx, hy] = limbEnd(ex, ey, fa, D.fore);
    const sk = back ? skin.sh : skin.base;
    inkedLimb(ctx, sx, sy, ex, ey, D.armW, sk, tattoos ? sleeveK - 0.05 : 1, tattoos ? 1.0 : 0, o.small);
    inkedLimb(ctx, ex, ey, hx, hy, D.armW - 0.5, sk, 0, tattoos ? 0.62 : 0, o.small);
    // tee sleeve over the shoulder, with a flat hem
    const [mx, my] = [lerp(sx, ex, sleeveK), lerp(sy, ey, sleeveK)];
    {
      const ddx = ex - sx, ddy = ey - sy, L0 = Math.hypot(ddx, ddy) || 1, ux = ddx / L0, uy = ddy / L0, hw = (D.armW + 1.6) / 2;
      const ang = Math.atan2(uy, ux);
      const sleevePath = grow => { ctx.beginPath(); ctx.arc(sx, sy, hw + grow, ang + Math.PI / 2, ang - Math.PI / 2); ctx.lineTo(mx + uy * (hw + grow) + ux * grow, my - ux * (hw + grow) + uy * grow); ctx.lineTo(mx - uy * (hw + grow) + ux * grow, my + ux * (hw + grow) + uy * grow); ctx.closePath(); };
      ctx.fillStyle = CLOTH.outline; sleevePath(1); ctx.fill();
      ctx.fillStyle = back ? shade(CLOTH.tee, -0.3) : '#16151c'; sleevePath(0); ctx.fill();
    }
    if (neon) capsule(ctx, lerp(sx, ex, sleeveK * 0.85), lerp(sy, ey, sleeveK * 0.85), mx, my, 1.1, rgba(trim, 0.95));
    ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(hx, hy, D.armW * 0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = skin.sh; ctx.lineWidth = 0.6; ctx.stroke();
    return [hx, hy];
  };

  // ---- back arm
  const [hbx, hby] = drawArm(shX - 2.5, shY + 2, P.uaB, P.faB, true);

  // ---- legs with black sneakers
  const legFoot = (th, sh, col, front) => {
    const hx = hipX + (front ? 2 : -2), hy = hipY;
    const [kx, ky] = limbEnd(hx, hy, th, D.thigh);
    const [ax, ay] = limbEnd(kx, ky, sh, D.shin);
    outlinedCapsule(ctx, hx, hy, kx, ky, D.legW, col);
    outlinedCapsule(ctx, kx, ky, ax, ay, D.legW - 0.6, col);
    if (neon && front) capsule(ctx, hx + 1.5, hy, kx + 1.5, ky, 0.9, rgba(trim, 0.9));
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(-sh * 0.35);
    const bw = o.small ? 7.5 : 10, bh = o.small ? 4 : 5.2;
    ctx.fillStyle = CLOTH.outline; rr(ctx, -bw * 0.36 - 1, -bh * 0.5 - 1, bw + 2, bh + 2, 3); ctx.fill();
    ctx.fillStyle = CLOTH.boot;
    ctx.beginPath(); ctx.moveTo(-bw * 0.36, bh * 0.5); ctx.lineTo(-bw * 0.36, -bh * 0.35); ctx.quadraticCurveTo(-bw * 0.1, -bh * 0.6, bw * 0.25, -bh * 0.2);
    ctx.quadraticCurveTo(bw * 0.64, -bh * 0.05, bw * 0.64, bh * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#26262e'; ctx.fillRect(-bw * 0.36, bh * 0.5 - 1.5, bw, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-bw * 0.1, -bh * 0.22, bw * 0.38, 0.8);
    ctx.restore();
  };
  legFoot(P.thB, P.shB, shade(CLOTH.jeans, -0.2), false);

  // ---- torso: black crew-neck tee
  ctx.save();
  const tw = D.torsoW;
  ctx.translate(hipX, hipY); ctx.rotate(lean);
  const th = D.shoulder - D.hip;
  ctx.fillStyle = CLOTH.outline; rr(ctx, -tw / 2 - 1, -th - 2.5, tw + 2, th + 5, o.small ? 4 : 5); ctx.fill();
  const jg = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
  jg.addColorStop(0, shade(CLOTH.tee, -0.3)); jg.addColorStop(0.6, '#15141b'); jg.addColorStop(1, '#2a2834');
  ctx.fillStyle = jg; rr(ctx, -tw / 2, -th - 1.5, tw, th + 3, o.small ? 3.5 : 4.5); ctx.fill();
  // crew neck and a couple of soft folds
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(tw * 0.18, -th - 1.2, tw * 0.22, o.small ? 1.4 : 2.2, 0, 0, Math.PI); ctx.stroke();
  if (!o.small) { ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(-tw * 0.1, -th * 0.55); ctx.quadraticCurveTo(tw * 0.1, -th * 0.4, tw * 0.3, -th * 0.6); ctx.stroke(); }
  // waistband of black jeans
  ctx.fillStyle = '#060608'; ctx.fillRect(-tw / 2, -1.2, tw, 2.4);
  if (neon) {
    ctx.save(); ctx.shadowColor = trim; ctx.shadowBlur = 5; ctx.strokeStyle = trim; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(tw * 0.18, -th - 1.2, tw * 0.22, o.small ? 1.4 : 2.2, 0, 0, Math.PI); ctx.moveTo(-tw / 2 + 1, -1.8); ctx.lineTo(tw / 2 - 1, -1.8); ctx.stroke(); ctx.restore();
  }
  ctx.restore();

  // ---- front leg
  legFoot(P.thF, P.shF, CLOTH.jeans, true);

  // ---- head
  const headCX = shX + 1 + Math.sin(lean) * 4, headCY = -D.headY + crouchDrop - P.bob;
  if (style === 'down') {
    // a lock of long hair falling over the near shoulder
    const R0 = D.headR, sw = Math.sin(o.time * 2.2) * 0.8 + (o.anim.state === 'run' ? -1.5 : 0) + Math.sin(P.head) * 4;
    const len = o.small ? R0 * 1.25 : R0 * 2.5;
    const x0 = headCX - R0 * 0.55, y0 = headCY + R0 * 0.15;
    ctx.fillStyle = hair.base;
    ctx.beginPath(); ctx.moveTo(x0 - R0 * 0.35, y0);
    ctx.quadraticCurveTo(x0 - R0 * 0.45 + sw * 0.5, y0 + len * 0.6, x0 - R0 * 0.1 + sw, y0 + len);
    ctx.quadraticCurveTo(x0 + R0 * 0.25 + sw, y0 + len * 0.55, x0 + R0 * 0.45, y0);
    ctx.closePath(); ctx.fill();
  }
  ctx.save();
  ctx.translate(headCX, headCY + D.headR * 0.6);
  ctx.rotate(P.head);
  ctx.translate(0, -D.headR * 0.6);
  const R = D.headR;
  // neck
  ctx.fillStyle = skin.sh; ctx.fillRect(-2.2, R * 0.6, 4.4, (o.small ? 2 : 4));
  // man bun sits behind the head
  if (style === 'bun') {
    const bx = -R * 0.62 + sway * 0.12, by = -R * 0.98, br = R * 0.46;
    const bg = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.4, 1, bx, by, br * 1.2);
    bg.addColorStop(0, hair.hi); bg.addColorStop(0.55, hair.base); bg.addColorStop(1, shade(hair.base, -0.3));
    // loose curly ends spring out of the bun
    ctx.strokeStyle = hair.hi; ctx.lineCap = 'round'; ctx.lineWidth = o.small ? 1.4 : 1.6;
    for (let k = 0; k < 3; k++) {
      const a0 = -2.4 + k * 0.55, l = R * (0.75 + k * 0.12);
      const tx = bx + Math.cos(a0) * l - sway * 0.25 * (k + 1) * 0.5, ty = by + Math.sin(a0) * l + swayY * 0.12;
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(a0) * br * 0.5, by + Math.sin(a0) * br * 0.5);
      ctx.bezierCurveTo(bx + Math.cos(a0 - 0.6) * l * 0.8, by + Math.sin(a0 - 0.6) * l * 0.8, bx + Math.cos(a0 + 0.5) * l, by + Math.sin(a0 + 0.5) * l, tx, ty);
      ctx.stroke();
    }
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(bx, by, br * 1.05, br * 0.9, -0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.strokeStyle = rgba(hair.hi, 0.7); ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(bx, by, br * 0.55, -2.6, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + br * 0.1, by + br * 0.1, br * 0.28, 0.5, 3.6); ctx.stroke();
    // hair tie
    ctx.fillStyle = '#0a0a0e'; ctx.beginPath(); ctx.ellipse(bx + br * 0.55, by + br * 0.55, br * 0.22, br * 0.32, -0.5, 0, TAU); ctx.fill();
  }
  // face
  ctx.fillStyle = CLOTH.outline; ctx.beginPath(); ctx.ellipse(0.5, 0.5, R + 1, R * 1.06 + 1, 0, 0, TAU); ctx.fill();
  const fg = ctx.createLinearGradient(-R, 0, R, 0);
  fg.addColorStop(0, skin.sh); fg.addColorStop(0.55, skin.base); fg.addColorStop(1, skin.base);
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0.5, 0.5, R, R * 1.06, 0, 0, TAU); ctx.fill();
  // stubble along the jaw and upper lip
  if (beard) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(0.5, 0.5, R, R * 1.06, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = rgba(shade(hair.base, -0.15), 0.3);
    ctx.beginPath(); ctx.moveTo(-R * 0.35, R * 0.1); ctx.quadraticCurveTo(-R * 0.1, R * 0.95, R * 0.55, R * 1.1);
    ctx.quadraticCurveTo(R * 1.15, R * 0.9, R * 1.08, R * 0.3); ctx.lineTo(R * 0.95, R * 0.32);
    ctx.quadraticCurveTo(R * 0.62, R * 0.18, R * 0.32, R * 0.3); ctx.quadraticCurveTo(R * 0.05, R * 0.4, -R * 0.1, R * 0.05); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // ear
  ctx.fillStyle = skin.sh; ctx.beginPath(); ctx.ellipse(-R * 0.25, R * 0.15, R * 0.18, R * 0.26, 0, 0, TAU); ctx.fill();
  // eyes (hidden behind dark shades)
  const ey = -R * 0.05;
  if (glasses !== 'shades') {
    const eye = (ex, sc) => {
      if (P.eyes === 'closed') { ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex - 1.6 * sc, ey + 0.5); ctx.quadraticCurveTo(ex, ey + 1.6, ex + 1.6 * sc, ey + 0.5); ctx.stroke(); return; }
      if (P.eyes === 'x') { ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(ex - 1.5, ey - 1.5); ctx.lineTo(ex + 1.5, ey + 1.5); ctx.moveTo(ex + 1.5, ey - 1.5); ctx.lineTo(ex - 1.5, ey + 1.5); ctx.stroke(); return; }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, ey + 0.2, 1.6 * sc, 2.0, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4a3a24'; ctx.beginPath(); ctx.ellipse(ex + 0.55 * sc, ey + 0.35, 1.15 * sc, 1.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0e0806'; ctx.beginPath(); ctx.arc(ex + 0.65 * sc, ey + 0.4, 0.6 * sc, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + 0.95 * sc, ey - 0.35, 0.45, 0, TAU); ctx.fill();
    };
    eye(R * 0.3, 0.9); eye(R * 0.78, 0.7);
  }
  // brows
  ctx.strokeStyle = shade(hair.base, -0.25); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(R * 0.08, ey - 3.6); ctx.lineTo(R * 0.5, ey - 3.9); ctx.moveTo(R * 0.66, ey - 3.8); ctx.lineTo(R * 0.94, ey - 3.5); ctx.stroke();
  // nose
  ctx.fillStyle = skin.sh; ctx.beginPath(); ctx.moveTo(R * 0.92, ey + 0.8); ctx.lineTo(R * 1.1, ey + 3.2); ctx.lineTo(R * 0.86, ey + 3.4); ctx.fill();
  // mouth: an easy grin by default
  const mouth = P.mouth === 'flat' ? 'smile' : P.mouth;
  if (mouth === 'grin' || (mouth === 'smile' && !o.small)) {
    ctx.fillStyle = '#5a2018';
    ctx.beginPath(); ctx.moveTo(R * 0.36, R * 0.44); ctx.quadraticCurveTo(R * 0.64, R * (mouth === 'grin' ? 0.86 : 0.72), R * 0.92, R * 0.4); ctx.quadraticCurveTo(R * 0.64, R * 0.5, R * 0.36, R * 0.44); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(R * 0.4, R * 0.46); ctx.quadraticCurveTo(R * 0.64, R * 0.58, R * 0.88, R * 0.43); ctx.quadraticCurveTo(R * 0.64, R * 0.51, R * 0.4, R * 0.46); ctx.fill();
  } else if (mouth === 'o') { ctx.fillStyle = '#4a1a14'; ctx.beginPath(); ctx.ellipse(R * 0.66, R * 0.55, 1.6, 2, 0, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = '#5a2a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R * 0.38, R * 0.48); ctx.quadraticCurveTo(R * 0.62, R * 0.68, R * 0.88, R * 0.44); ctx.stroke(); }
  if (o.power === 2 && o.held !== 'joint') { ctx.fillStyle = 'rgba(255,90,110,0.38)'; ctx.beginPath(); ctx.ellipse(R * 0.45, R * 0.25, R * 0.28, R * 0.16, 0, 0, TAU); ctx.fill(); }
  if (o.floaty) {
    // a joint, and a lazy grin
    ctx.save(); ctx.translate(R * 0.95, R * 0.5); ctx.rotate(0.15);
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(0, -0.9, 7, 1.8); ctx.fillStyle = '#ff7a2a'; ctx.fillRect(7, -0.9, 1.4, 1.8); ctx.restore();
  }
  // hair
  const hg = ctx.createLinearGradient(0, -R * 1.2, 0, R);
  hg.addColorStop(0, hair.hi); hg.addColorStop(0.5, hair.base); hg.addColorStop(1, shade(hair.base, -0.2));
  ctx.fillStyle = hg;
  ctx.beginPath();
  if (style === 'bun') {
    // slicked back toward the bun, hairline set back from the forehead
    ctx.moveTo(R * 0.8, -R * 0.68);
    ctx.quadraticCurveTo(R * 0.92, -R * 1.12, 0, -R * 1.16);
    ctx.quadraticCurveTo(-R * 1.2, -R * 1.02, -R * 1.12, R * 0.05);
    ctx.quadraticCurveTo(-R * 1.0, R * 0.55, -R * 0.62, R * 0.62);   // nape
    ctx.quadraticCurveTo(-R * 0.55, R * 0.1, -R * 0.12, -R * 0.2);   // above the ear
    ctx.quadraticCurveTo(R * 0.15, -R * 0.82, R * 0.8, -R * 0.68);   // hairline
  } else {
    ctx.moveTo(R * 1.05, -R * 0.25);
    ctx.quadraticCurveTo(R * 1.1, -R * 1.25, 0, -R * 1.18);
    ctx.quadraticCurveTo(-R * 1.25, -R * 1.05, -R * 1.18, R * 0.2);
    ctx.quadraticCurveTo(-R * 1.15, R * 1.05, -R * 0.55, R * 1.25);
    ctx.quadraticCurveTo(-R * 0.45, R * 0.45, -R * 0.05, R * 0.05);
    ctx.quadraticCurveTo(R * 0.25, -R * 0.45, R * 0.55, -R * 0.42);
    ctx.quadraticCurveTo(R * 0.85, -R * 0.38, R * 1.05, -R * 0.25);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  // combed-back strands
  ctx.strokeStyle = rgba(hair.hi, 0.65); ctx.lineWidth = 0.8;
  for (let k = 0; k < (o.small ? 2 : 3); k++) {
    ctx.beginPath(); ctx.moveTo(R * (0.7 - k * 0.15), -R * (0.6 + k * 0.15)); ctx.quadraticCurveTo(R * (0.1 - k * 0.1), -R * (1.02 + k * 0.04), -R * (0.55 + k * 0.1), -R * (0.75 - k * 0.12)); ctx.stroke();
  }
  // glasses: square frames, dark lenses by default
  if (glasses !== 'none') {
    const lens = (x0, x1) => {
      const y0 = ey - R * 0.3, y1 = ey + R * 0.26;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.quadraticCurveTo(x1 + 0.3, y1, x1 - 0.6, y1); ctx.lineTo(x0 + 0.6, y1); ctx.quadraticCurveTo(x0 - 0.3, y1, x0, y0); ctx.closePath();
    };
    ctx.save();
    for (const [a, b] of [[R * 0.02, R * 0.56], [R * 0.66, R * 1.02]]) {
      lens(a, b);
      if (glasses === 'shades') { const lg = ctx.createLinearGradient(0, ey - R * 0.3, 0, ey + R * 0.3); lg.addColorStop(0, '#2c2632'); lg.addColorStop(1, '#0c0a10'); ctx.fillStyle = lg; }
      else ctx.fillStyle = 'rgba(200,230,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = '#100e14'; ctx.lineWidth = o.small ? 1.1 : 1.2; ctx.stroke();
      // glint
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(a + (b - a) * 0.25, ey - R * 0.2); ctx.lineTo(a + (b - a) * 0.5, ey - R * 0.02); ctx.stroke();
    }
    ctx.strokeStyle = '#100e14'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(R * 0.56, ey - R * 0.16); ctx.lineTo(R * 0.66, ey - R * 0.16);     // bridge
    ctx.moveTo(R * 0.02, ey - R * 0.2); ctx.lineTo(-R * 0.3, ey - R * 0.05); ctx.stroke();          // temple arm to the ear
    ctx.restore();
  }
  if (o.fly && !o.trip) {
    // the bufo toad rides on Brady's head while he flies
    ctx.save(); ctx.translate(-R * 0.1, -R * 1.25); ctx.scale(0.45, 0.45); Sprites.bufo(ctx, 0, 0, o.time, false); ctx.restore();
  }
  if (P.phone) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const pg = ctx.createRadialGradient(R * 1.4, R * 0.3, 1, R * 1.4, R * 0.3, R * 1.4);
    pg.addColorStop(0, 'rgba(140,200,255,0.35)'); pg.addColorStop(1, 'rgba(140,200,255,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(R * 1.4, R * 0.3, R * 1.4, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();

  // ---- front arm
  const [hfx, hfy] = drawArm(shX + 2.5, shY + 2, P.uaF, P.faF, false);
  if (o.power === 2 && !o.small && o.held === 'joint') {
    // a little rolled joint in hand, its tip glowing
    ctx.save(); ctx.translate(hbx, hby); ctx.rotate(-0.5);
    ctx.fillStyle = '#fbf6ea'; rr(ctx, -1.2, -9, 2.4, 9, 1); ctx.fill();
    ctx.fillStyle = `rgba(255,${130 + 60 * Math.sin((o.time || 0) * 6)},40,1)`; ctx.beginPath(); ctx.arc(0, -9.5, 1.5, 0, TAU); ctx.fill();
    ctx.restore();
  } else if (o.power === 2 && !o.small) {
    // a bottle in hand
    ctx.save(); ctx.translate(hbx, hby); ctx.rotate(0.3);
    ctx.fillStyle = '#4a8a3a'; rr(ctx, -2.2, -9, 4.4, 9, 1.6); ctx.fill(); ctx.fillRect(-1, -12, 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-1.4, -8, 0.8, 6);
    ctx.restore();
  }
  if (P.phone) {
    ctx.save(); ctx.translate(hfx, hfy); ctx.rotate(-0.3);
    ctx.fillStyle = '#0a0a0e'; rr(ctx, -2.5, -5.5, 5, 9, 1.2); ctx.fill();
    ctx.fillStyle = '#8ac8ff'; ctx.fillRect(-1.8, -4.6, 3.6, 7);
    ctx.restore();
  }
  if (o.anim.state === 'victory' || o.anim.state === 'headbang') {
    // rock horns
    ctx.strokeStyle = skin.base; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hfx - 1, hfy - 1); ctx.lineTo(hfx - 1.5, hfy - 4.5); ctx.moveTo(hfx + 1.3, hfy - 1); ctx.lineTo(hfx + 1.8, hfy - 4.5); ctx.stroke();
  }
  ctx.restore();
}
