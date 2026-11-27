/* ============================================================
   THE SPARE BONE QUARRY (world 37, cc 'bone'): hidden land A12 (docs/design/CHATGPT_RELAY.md §A12).
   "A crate of fossil replicas tipped down a quarry. The pieces have put themselves together from memory."
   Ochre strata, bone-white arcs, petrol-green impressions and persimmon joint caps. Every fossil here is a PLASTER
   REPLICA of an animal nobody ever invented properly: comic, never gruesome.
   Its door: in Ecuador 2-1, behind the trail's last rock ledge, jump up into the underside of the fossil slab (the
   footprint with pressed toes and a RAISED heel is the clue): 29_tour_y_bone_d_entry.js.
   This file: the stop, the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the
   map's sprites, the music and the country. The mechanics: 29_tour_y_bone_a_mech.js; the secret rooms:
   29_tour_y_bone_b_rooms.js; the boss: 29_tour_y_bone_c_boss.js; the levels and the map: 29_tour_y_bone_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'bone', world: 37, name: 'The Spare Bone Quarry', sub: 'a hidden land', lon: -88, lat: -13, secret: true, bonus: true, d0: 0.8, pin: 'bone' });
const COL = { a: '#f06a2a', b: '#2e6a5a', c: '#f4ead2' };
const INK = '#24160e';
const OCHRE = '#d98a32', OCHRE_HI = '#f2b44e', OCHRE_LO = '#a85a22', RUST = '#7a3a18';
const BONE = '#f4ead2', BONE_LO = '#d8c8a4', BONE_SH = '#b8a47c', PERS = '#f06a2a', PETROL = '#2e6a5a', PETROL_LO = '#1e4a40';

/* ---------------- tiles ---------------- */
// quarry strata: ochre bands under a sandy top, the odd petrol-green ammonite pressed in
const strataGround = {
  style: 'strata', cap: OCHRE_HI, capHi: '#ffd88a', dirt: OCHRE, dirt2: OCHRE_LO, rock: RUST,
  paint(ctx, rng) {
    // strata bands that wander a little from tile to tile (a few painted variants), pebbles, now and then a chip of bone
    ctx.fillStyle = OCHRE; ctx.fillRect(0, 0, TS, TS);
    const o1 = (rng() - 0.5) * 6, o2 = (rng() - 0.5) * 6;
    ctx.fillStyle = '#c87a2a'; ctx.beginPath(); ctx.moveTo(0, 8 + o1); ctx.lineTo(TS, 10 + o2); ctx.lineTo(TS, 18 + o2); ctx.lineTo(0, 16 + o1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = OCHRE_LO; ctx.beginPath(); ctx.moveTo(0, 24 + o2 * 0.5); ctx.lineTo(TS, 23 + o1 * 0.5); ctx.lineTo(TS, TS); ctx.lineTo(0, TS); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,60,20,0.55)'; ctx.fillRect(0, 16 + o1, TS, 1.2);
    if (rng() < 0.5) { ctx.fillStyle = '#e8a04a'; ctx.beginPath(); ctx.ellipse(4 + rng() * 22, 4 + rng() * 3, 2.5, 1.5, 0, 0, TAU); ctx.fill(); }
    if (rng() < 0.07) { ctx.fillStyle = '#efe2c4'; const x = 6 + rng() * 18, y = 14 + rng() * 12; ctx.fillRect(x, y, 6, 2); ctx.beginPath(); ctx.arc(x, y + 1, 1.6, 0, TAU); ctx.arc(x + 6, y + 1, 1.6, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = OCHRE_LO; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = OCHRE_HI; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#ffd88a'; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.fillStyle = '#e09a3a'; for (let x = x0 + 5; x < x1; x += 19) { ctx.beginPath(); ctx.ellipse(x, 5, 3, 1.4, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
  }
};
// a bone shelf on a persimmon ball joint (the one-way platform)
const boneSemi = {
  style: 'boneshelf', c1: BONE, c2: BONE_SH,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = BONE_SH; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.lineTo(x1 - 1, 10); ctx.lineTo(x0 + 1, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = BONE; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5);
    ctx.fillStyle = PERS; for (let x = x0 + 16; x < x1; x += 32) { ctx.beginPath(); ctx.arc(x, 13, 3.5, 0, TAU); ctx.fill(); }
  }
};
// a plaster block (bricks): chalk white with a stencilled crate number
const plasterBrick = {
  style: 'plaster', c1: '#efe6d2', c2: '#b8a888', mortar: '#7a6a50',
  paint(ctx) {
    ctx.fillStyle = '#8a7a5a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(1.5, 1.5, TS - 3, TS - 3);
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(1.5, TS - 8, TS - 3, 6.5);
    ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.arc(9, 11, 2, 0, TAU); ctx.arc(22, 19, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the hard strata rock (overhangs, walls): darker rust bands that run on across tiles
const strataHard = {
  c1: '#9a5226', c2: '#6a3416',
  paint(ctx) {
    ctx.fillStyle = '#8a4620'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#a85a28'; ctx.fillRect(0, 2, TS, 8);
    ctx.fillStyle = '#743a18'; ctx.fillRect(0, 14, TS, 4);
    ctx.fillStyle = '#b8682e'; ctx.fillRect(0, 21, TS, 6);
    ctx.fillStyle = '#5a2a10'; ctx.fillRect(0, 10, TS, 1.2); ctx.fillRect(0, 27, TS, 1.2);
    ctx.fillStyle = '#c87a3a'; ctx.fillRect(5, 4, 6, 1.5); ctx.fillRect(18, 23, 7, 1.5);
  }
};
const quarry = { ground: strataGround, semi: boneSemi, brick: plasterBrick, hard: strataHard, pillar: { c1: BONE, c2: BONE_SH, cap: PERS, style: 'column' }, accent: PERS, tint: {}, bloom: 0.12, liquid: null };
// wet clay (37-3): a grey-brown slick top
const clayGround = Object.assign({}, strataGround, { style: 'clay', cap: '#b89a7a', capHi: '#e0c8a8', paintCap(ctx, x0, x1) {
  ctx.fillStyle = '#6a5040'; ctx.fillRect(x0, 0, x1 - x0, 11); ctx.fillStyle = '#a88a6a'; ctx.fillRect(x0, 0, x1 - x0, 8);
  ctx.fillStyle = '#d8bc98'; ctx.fillRect(x0, 0, x1 - x0, 2); ctx.fillStyle = '#c8aa86'; for (let x = x0 + 9; x < x1; x += 21) { ctx.beginPath(); ctx.ellipse(x, 4, 5, 1.5, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
} });

/* ---------------- shared drawings ---------------- */
const BoneArt = {
  // a long bone between two knobbly ends (x0,y0)->(x1,y1), thickness w; caps: persimmon joint caps on the ends
  bone(ctx, x0, y0, x1, y1, w, caps, col) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = col || BONE;
    ctx.beginPath(); ctx.moveTo(w * 0.6, -w * 0.42); ctx.quadraticCurveTo(L / 2, -w * 0.3, L - w * 0.6, -w * 0.42); ctx.lineTo(L - w * 0.6, w * 0.42); ctx.quadraticCurveTo(L / 2, w * 0.3, w * 0.6, w * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const ex of [0, L]) { ctx.fillStyle = caps ? PERS : (col || BONE); ctx.beginPath(); ctx.arc(ex, -w * 0.32, w * 0.42, 0, TAU); ctx.arc(ex, w * 0.32, w * 0.42, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(w * 0.7, -w * 0.3, L - w * 1.4, w * 0.16);
    ctx.restore();
  },
  // a persimmon ball joint
  joint(ctx, x, y, r) { ctx.save(); ctx.fillStyle = PERS; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffb07a'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, TAU); ctx.fill(); ctx.restore(); },
  // an ammonite spiral
  ammonite(ctx, x, y, r, col) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = col || '#3e8a74';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); for (let a = 0; a < 11; a += 0.25) { const q = r * (1 - a / 12); ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.stroke();
    ctx.restore();
  },
  // a footprint pressed into clay: kind 0 three-toed bird, 1 round paw, 2 hoof, 3 flipper, 4 long-toed lizard;
  // dir: which way the toes point (1 right, -1 left, 0 up); s: size; pressed (dark hollow) or raised
  print(ctx, x, y, kind, dir, s, col, raised) {
    ctx.save(); ctx.translate(x, y); if (dir === 1) ctx.rotate(Math.PI / 2); else if (dir === -1) ctx.rotate(-Math.PI / 2); ctx.scale(s, s);
    ctx.fillStyle = col || PETROL_LO; ctx.strokeStyle = raised ? '#fff0c8' : 'rgba(255,230,170,0.75)'; ctx.lineWidth = 1.2 / s;
    const blob = (bx, by, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, rot || 0, 0, TAU); ctx.fill(); ctx.stroke(); };
    if (kind === 0) { ctx.lineWidth = 3.2; ctx.strokeStyle = col || PETROL_LO; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -6); ctx.moveTo(0, 2); ctx.lineTo(-6, -5); ctx.moveTo(0, 2); ctx.lineTo(6, -5); ctx.stroke(); }
    else if (kind === 1) { blob(0, 2, 5, 4); for (const [bx, by] of [[-5, -4], [-1.8, -6.5], [1.8, -6.5], [5, -4]]) blob(bx, by, 1.8, 2.2); }
    else if (kind === 2) { blob(-2.6, 0, 2.6, 6, -0.1); blob(2.6, 0, 2.6, 6, 0.1); }
    else if (kind === 3) { ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-9, -2, -4, -7); ctx.quadraticCurveTo(0, -4, 4, -7); ctx.quadraticCurveTo(9, -2, 0, 6); ctx.fill(); ctx.stroke(); }
    else { blob(0, 3, 3.5, 3); ctx.lineWidth = 2; ctx.strokeStyle = col || PETROL_LO; for (const a of [-0.9, -0.3, 0.3, 0.9]) { ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(Math.sin(a) * 9, -Math.cos(a) * 8); ctx.stroke(); } }
    ctx.restore();
  },
  // a museum label card on a stalk: one or two short words
  label(ctx, x, y, text, w) {
    w = w || 40; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1.5, y - 14, 3, 14);
    ctx.fillStyle = '#fbf4e0'; rr(ctx, x - w / 2, y - 30, w, 17, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 21.5);
    ctx.restore();
  },
  // the tipped crate the replicas came in
  crate(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1); ctx.rotate(-0.12); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c89a5a'; ctx.fillRect(-34, -44, 68, 44); ctx.strokeRect(-34, -44, 68, 44);
    ctx.fillStyle = '#a8783a'; ctx.fillRect(-34, -32, 68, 4); ctx.fillRect(-34, -14, 68, 4);
    ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('REPLICAS', 0, -20); ctx.fillText('THIS WAY UP ↓', 0, -4);
    ctx.restore();
    BoneArt.bone(ctx, x + 30, y - 6, x + 62, y - 2, 9, true);
  }
};

/* ---------------- painted backdrops ---------------- */
const painters = {
  // far quarry walls: stepped benches cut into the strata, each bench a band of a lighter ochre
  boneTerraces(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    let x = 0;
    while (x < BG_W) {
      const w = 140 + rng() * 120, h = 60 + rng() * 70, steps = 3 + Math.floor(rng() * 2);
      wrapDraw(x, w, X => {
        for (let k = 0; k < steps; k++) {
          const y = b - h + k * (h / steps), inset = k * 18;
          ctx.fillStyle = shade(c, 0.12 - k * 0.07); ctx.fillRect(X - inset, y, w + inset * 2, h / steps + 2);
          ctx.fillStyle = shade(c, 0.28 - k * 0.05); ctx.fillRect(X - inset, y, w + inset * 2, 3);
        }
      });
      x += w;
    }
    ctx.fillStyle = shade(c, -0.12); ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(c, -0.2); for (let k = 0; k < 30; k++) ctx.fillRect(rng() * BG_W, b + rng() * (H - b), 18 + rng() * 30, 3);
  },
  // the giant replica bones sticking out of the near quarry face: arcs and ribs with persimmon caps, half buried
  boneArcs(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    for (let x = 0; x <= BG_W; x += 32) ctx.lineTo(x, b - 10 - Math.abs(Math.sin(x * 0.013)) * 30 - Math.abs(Math.sin(x * 0.041 + 2)) * 12);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(L.color, 0.12); for (let x = 0; x <= BG_W; x += 32) ctx.fillRect(x, b - 10 - Math.abs(Math.sin(x * 0.013)) * 30 - Math.abs(Math.sin(x * 0.041 + 2)) * 12, 32, 3);
    const boneCol = L.bone || '#e8dcc0';
    for (let x = 60 + rng() * 60; x < BG_W - 40; x += 170 + rng() * 120) {
      const kind = Math.floor(rng() * 3), y = b - 20;
      wrapDraw(x - 90, 180, X => {
        const cx = X + 90;
        if (kind === 0) { // a rib arch
          ctx.strokeStyle = shade(boneCol, -0.35); ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, y + 20, 70, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
          ctx.strokeStyle = boneCol; ctx.lineWidth = 10; ctx.stroke();
        } else if (kind === 1) { // a big leg bone leaning out
          ctx.save(); ctx.globalAlpha = 0.95; BoneArt.bone(ctx, cx - 50, y + 10, cx + 30, y - 60, 16, true, boneCol); ctx.restore();
        } else { // a skull-ish knob of a hip with a socket
          ctx.fillStyle = boneCol; ctx.strokeStyle = shade(boneCol, -0.4); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, y - 10, 46, 30, 0.2, Math.PI, 0); ctx.fill(); ctx.stroke();
          ctx.fillStyle = shade(boneCol, -0.3); ctx.beginPath(); ctx.arc(cx + 8, y - 18, 10, 0, TAU); ctx.fill();
        }
      });
    }
  },
  // 37-2's scree slopes: long diagonal fans of grey-ochre stones under the quarry rim
  boneScree(ctx, L, rng, H) {
    const b = L.base;
    // the quarry wall behind: tall slabs with vertical cut marks, its top edge ragged
    ctx.fillStyle = shade(L.color, 0.06); ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b - 190);
    for (let x = 0; x <= BG_W; x += 48) ctx.lineTo(x, b - 190 - Math.abs(Math.sin(x * 0.02)) * 26 - (x % 96 ? 6 : 0));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.12); ctx.lineWidth = 3; for (let x = 20; x < BG_W; x += 37) { ctx.beginPath(); ctx.moveTo(x, b - 170); ctx.lineTo(x + 6, b - 40); ctx.stroke(); }
    // fans of loose scree spilling down from notches in the wall (curved, never a tidy triangle), stones on them
    for (let k = 0; k < 5; k++) {
      const x = 80 + k * 200 + rng() * 60, w = 150 + rng() * 80;
      wrapDraw(x - w / 2, w, X => {
        const cx = X + w / 2, top = b - 150 - rng() * 30;
        ctx.fillStyle = shade(L.color, -0.08); ctx.beginPath(); ctx.moveTo(cx - 14, top); ctx.quadraticCurveTo(cx - w * 0.2, b - 60, cx - w / 2, b + 10); ctx.lineTo(cx + w / 2, b + 10); ctx.quadraticCurveTo(cx + w * 0.15, b - 70, cx + 14, top); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.color, 0.2); for (let q = 0; q < 16; q++) { const t = rng(), yy = top + t * (b - top), half = 14 + t * w * 0.45; ctx.beginPath(); ctx.ellipse(cx - half + rng() * half * 2, yy, 4 + rng() * 3, 2.5, 0, 0, TAU); ctx.fill(); }
      });
    }
    ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(0, b, BG_W, H - b);
  },
  // 37-3's casting shed: plank wall, shelves of plaster casts (feet, a jaw, a tail), dripping clay buckets
  boneShed(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 44) { ctx.fillStyle = shade(L.color, (x / 44) % 2 ? -0.06 : 0.04); ctx.fillRect(x, 0, 44, H); ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(x, 0, 2, H); }
    for (const y of [b - 220, b - 130]) {
      ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(0, y, BG_W, 8);
      for (let x = 20 + rng() * 40; x < BG_W; x += 70 + rng() * 50) {
        const k = Math.floor(rng() * 4); ctx.fillStyle = '#e8e0cc'; ctx.strokeStyle = shade(L.color, -0.5); ctx.lineWidth = 2;
        if (k === 0) { ctx.beginPath(); ctx.ellipse(x, y - 12, 16, 12, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); BoneArt.print(ctx, x, y - 10, 0, 0, 0.9, '#9a8a6a'); }
        else if (k === 1) { ctx.fillRect(x - 14, y - 22, 28, 22); ctx.strokeRect(x - 14, y - 22, 28, 22); BoneArt.print(ctx, x, y - 11, 1, 0, 0.9, '#9a8a6a'); }
        else if (k === 2) { ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.quadraticCurveTo(x, y - 30, x + 18, y); ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = '#8a7a6a'; ctx.fillRect(x - 9, y - 18, 18, 18); ctx.fillStyle = '#a88a6a'; ctx.fillRect(x - 9, y - 18, 18, 5); }
      }
    }
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, b - 40, BG_W, 6);
  },
  // 37-4's cutting floor: a workshop wall with chisels on a board, a big chalk diagram of a joint, seam lines
  boneWorkshop(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.12); for (let y = 0; y < b; y += 36) ctx.fillRect(0, y, BG_W, 2);
    for (let x = 80; x < BG_W; x += 340) {
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(x, b - 230, 150, 90); ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 3; ctx.strokeRect(x, b - 230, 150, 90);
      for (let k = 0; k < 6; k++) { const cx = x + 16 + k * 23; ctx.fillStyle = PERS; ctx.fillRect(cx - 3, b - 222, 6, 26); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(cx - 2, b - 196, 4, 30 - k * 2); }
      // a chalk diagram: a bone with a dashed seam that forks
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + 250, b - 180, 70, 22, -0.1, 0, TAU); ctx.stroke();
      ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x + 190, b - 182); ctx.lineTo(x + 250, b - 178); ctx.lineTo(x + 290, b - 195); ctx.moveTo(x + 250, b - 178); ctx.lineTo(x + 292, b - 168); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = shade(L.color, -0.28); ctx.fillRect(0, b - 30, BG_W, H - b + 30);
  },
  // 37-5's dig pit at dusk: a deep excavation, string grid lines, little survey pegs, a lamp or two
  boneDigPit(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b - 140); ctx.lineTo(120, b - 150); ctx.lineTo(180, b - 30); ctx.lineTo(BG_W - 180, b - 30); ctx.lineTo(BG_W - 120, b - 150); ctx.lineTo(BG_W, b - 140); ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(180, b - 30, BG_W - 360, 4);
    ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = 1.5;
    for (let x = 200; x < BG_W - 180; x += 64) { ctx.beginPath(); ctx.moveTo(x, b - 30); ctx.lineTo(x, b + 60); ctx.stroke(); }
    for (let y = b - 10; y < b + 60; y += 24) { ctx.beginPath(); ctx.moveTo(180, y); ctx.lineTo(BG_W - 180, y); ctx.stroke(); }
    for (const x of [140, BG_W - 140]) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, b - 210, 4, 64); ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.arc(x, b - 212, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,216,138,0.25)'; ctx.beginPath(); ctx.arc(x, b - 212, 28, 0, TAU); ctx.fill(); }
  },
  // the dig's clutter at the pit's edge: scaffold towers, stacked crates of replicas, bones sticking out of the spoil
  // heaps (kept dark and dull so the boss and Brady pop)
  boneDigClutter(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b - 20);
    for (let x = 0; x <= BG_W; x += 64) ctx.lineTo(x, b - 20 - Math.abs(Math.sin(x * 0.009 + 1)) * 40);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let x = 40 + rng() * 40; x < BG_W - 60; x += 150 + rng() * 90) {
      const k = Math.floor(rng() * 3);
      wrapDraw(x - 60, 120, X => {
        const cx = X + 60;
        if (k === 0) { ctx.strokeStyle = shade(c, 0.18); ctx.lineWidth = 4; for (const dx of [-26, 26]) { ctx.beginPath(); ctx.moveTo(cx + dx, b); ctx.lineTo(cx + dx, b - 130); ctx.stroke(); } for (let y = b - 20; y > b - 130; y -= 36) { ctx.beginPath(); ctx.moveTo(cx - 26, y); ctx.lineTo(cx + 26, y); ctx.moveTo(cx - 26, y); ctx.lineTo(cx + 26, y - 36); ctx.stroke(); } ctx.fillStyle = shade(c, 0.25); ctx.fillRect(cx - 32, b - 134, 64, 8); }
        else if (k === 1) { for (let q = 0; q < 3; q++) { ctx.fillStyle = shade(c, 0.12 + q * 0.04); ctx.fillRect(cx - 40 + (q % 2) * 26, b - 30 - q * 28, 46, 28); ctx.fillStyle = shade(c, -0.1); ctx.fillRect(cx - 40 + (q % 2) * 26, b - 20 - q * 28, 46, 3); } }
        else { ctx.strokeStyle = shade(c, 0.3); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 20, b - 10); ctx.lineTo(cx + 10, b - 70); ctx.stroke(); ctx.fillStyle = shade(c, 0.3); ctx.beginPath(); ctx.arc(cx + 12, b - 74, 9, 0, TAU); ctx.arc(cx + 2, b - 78, 9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 30, b - 8); ctx.quadraticCurveTo(cx + 50, b - 60, cx + 70, b - 70); ctx.stroke(); }
      });
    }
  },
  /* ---------- the secret rooms' own backdrops (all different) ---------- */
  // 37-1 RESERVED FOR A GIANT: the museum's great hall: green walls, a cornice, a huge skeleton's legs, a height chart
  roomHall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#2e6a5a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#245448'; for (let x = 0; x < BG_W; x += 128) ctx.fillRect(x, 0, 10, H);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 40, BG_W, 14); ctx.fillStyle = '#c8b898'; ctx.fillRect(0, 54, BG_W, 4);
    for (const x of [120, 900]) { BoneArt.bone(ctx, x, b - 10, x + 20, b - 190, 22, true, '#e8dcc0'); BoneArt.bone(ctx, x + 70, b - 10, x + 52, b - 190, 22, true, '#e8dcc0'); }
    ctx.fillStyle = '#c8b898'; ctx.fillRect(0, b - 6, BG_W, H - b + 6);
    ctx.fillStyle = '#b8a888'; for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, b - 6, 2, H - b + 6);
  },
  // 37-2 THE BACK OF THE QUEUE: the gift shop: shelves of plaster bones and snow-globes, a CLOSED blind on the counter
  roomShop(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#f2d6a8'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#e8c690'; for (let x = 0; x < BG_W; x += 48) ctx.fillRect(x, 0, 24, H);
    for (const y of [90, 160, 230]) {
      ctx.fillStyle = '#8a5a2a'; ctx.fillRect(0, y, BG_W, 8);
      for (let x = 16; x < BG_W; x += 40) { const k = (x / 40 + y) % 3; if (k < 1) BoneArt.bone(ctx, x, y - 8, x + 26, y - 8, 8, false); else if (k < 2) { ctx.fillStyle = '#bfe4f0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 12, y - 12, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x + 4, y - 4, 16, 4); } else BoneArt.ammonite(ctx, x + 12, y - 11, 9, '#e8a04a'); }
    }
    ctx.fillStyle = '#c86a3a'; ctx.fillRect(0, b - 20, BG_W, H - b + 20);
  },
  // 37-3 OUT OF ORDER: the cast room: white tiles, a plaster mixer, sacks, dust in the air
  roomCast(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#dfe6e8'; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = '#c4ccd0'; ctx.lineWidth = 2; for (let x = 0; x < BG_W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let x = 60; x < BG_W; x += 260) { ctx.fillStyle = '#c8b88a'; ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { rr(ctx, x + k * 14, b - 46 - k * 30, 60, 34, 8); ctx.fill(); ctx.stroke(); } }
    ctx.fillStyle = '#7a8a90'; ctx.fillRect(0, b - 12, BG_W, H - b + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 40; k++) ctx.fillRect(rng() * BG_W, rng() * b, 2, 2);
  },
  // 37-4 NO FISHING: the tar pool grotto: dark rock, reeds, a brown-black pool with an oily sheen, fossil fish in the wall
  roomTar(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#4a362a'; for (let k = 0; k < 18; k++) { const x = rng() * BG_W, y = rng() * b; ctx.beginPath(); ctx.ellipse(x, y, 40 + rng() * 60, 16 + rng() * 20, rng(), 0, TAU); ctx.fill(); }
    for (let x = 90; x < BG_W; x += 210) { ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, 120, 34, 14, 0, 0, TAU); ctx.stroke(); for (let q = -24; q <= 24; q += 8) { ctx.beginPath(); ctx.moveTo(x + q, 108); ctx.lineTo(x + q, 132); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x + 34, 120); ctx.lineTo(x + 50, 108); ctx.lineTo(x + 50, 132); ctx.closePath(); ctx.stroke(); }
    ctx.strokeStyle = '#5a7a3a'; ctx.lineWidth = 3; for (let x = 10; x < BG_W; x += 23) { ctx.beginPath(); ctx.moveTo(x, b + 10); ctx.quadraticCurveTo(x + 6, b - 40, x + 2 + (x % 7), b - 70 - (x % 30)); ctx.stroke(); }
  },
  // 37-5 THE CLEARLY EMPTY JAR: the specimen store: dark shelves of labelled jars, one hanging bulb
  roomStore(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#2a2436'; ctx.fillRect(0, 0, BG_W, H);
    for (const y of [100, 180, 260]) {
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(0, y, BG_W, 7);
      for (let x = 14; x < BG_W; x += 34) { const h = 22 + ((x * 7 + y) % 3) * 6; ctx.fillStyle = 'rgba(190,230,220,0.35)'; ctx.strokeStyle = 'rgba(220,240,240,0.6)'; ctx.lineWidth = 1.5; rr(ctx, x, y - h, 22, h, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x + 3, y - h * 0.6, 16, 7); }
    }
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(BG_W / 2, 30, 9, 0, TAU); ctx.fill(); const g = ctx.createRadialGradient(BG_W / 2, 30, 4, BG_W / 2, 30, 220); g.addColorStop(0, 'rgba(255,232,160,0.35)'); g.addColorStop(1, 'rgba(255,232,160,0)'); ctx.fillStyle = g; ctx.fillRect(BG_W / 2 - 220, 0, 440, 260);
    ctx.fillStyle = '#3a3048'; ctx.fillRect(0, b - 10, BG_W, H - b + 10);
  }
};
const SKY_DAY = ['#4a9ad8', '#9ad0f0', '#fbe8c8'];
// each secret room its own floor and walls: the museum hall's green marble, the gift shop's checked lino, the cast
// room's white tiles, the tar cave's black basalt, the specimen store's dark planks
const MATS = {
  marble: { base: '#2a5a4c', line: '#cfe8dc', cap: '#e8e2cc', capLo: '#a8a088', pat(ctx, rng) { ctx.strokeStyle = 'rgba(210,240,225,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); let x = rng() * TS, y = 0; ctx.moveTo(x, y); while (y < TS) { x += (rng() - 0.5) * 12; y += 6; ctx.lineTo(x, y); } ctx.stroke(); } },
  checker: { base: '#c84a3a', line: '#f2e2c4', cap: '#f2e2c4', capLo: '#a83a2a', pat(ctx) { ctx.fillStyle = '#f2e2c4'; ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); } },
  tile: { base: '#e8eef0', line: '#b8c4c8', cap: '#8a969c', capLo: '#5a666c', pat(ctx) { ctx.strokeStyle = '#b8c4c8'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, TS / 2 - 1, TS / 2 - 1); ctx.strokeRect(TS / 2, 1, TS / 2 - 1, TS / 2 - 1); ctx.strokeRect(1, TS / 2, TS / 2 - 1, TS / 2 - 1); ctx.strokeRect(TS / 2, TS / 2, TS / 2 - 1, TS / 2 - 1); } },
  basalt: { base: '#2a2228', line: '#4a3e44', cap: '#1a1012', capLo: '#0a0606', pat(ctx, rng) { ctx.fillStyle = '#3a3036'; ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(TS - 6, 4); ctx.lineTo(TS - 3, TS / 2); ctx.lineTo(TS - 8, TS - 3); ctx.lineTo(5, TS - 5); ctx.lineTo(2, TS / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,180,200,0.2)'; ctx.fillRect(6 + rng() * 14, 8, 6, 2); } },
  planks: { base: '#4a3424', line: '#2a1a10', cap: '#6a4a30', capLo: '#3a2414', pat(ctx, rng) { ctx.fillStyle = '#5a4030'; ctx.fillRect(0, 0, TS, 10); ctx.fillRect(0, 21, TS, 11); ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 10, TS, 1.5); ctx.fillRect(0, 21, TS, 1.5); ctx.fillRect(8 + rng() * 14, 0, 1.5, 10); ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(20, 26, 1.5, 0, TAU); ctx.fill(); } }
};
const mat = k => {
  const M = MATS[k];
  const ground = { style: 'room_' + k, cap: M.cap, capHi: M.cap, dirt: M.base, dirt2: M.capLo, rock: M.base,
    paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng); },
    paintCap(ctx, x0, x1) { ctx.fillStyle = M.capLo; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = M.cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5); } };
  return { ground, hard: { c1: M.base, c2: M.capLo, paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng); } } };
};
const room = (name, painter, extra) => Object.assign({}, quarry, { name, music: 'tour_bone_room', particles: 'none', rays: null, sky: ['#2a2024', '#3a2a2a', '#4a3a30'], horizonGlow: '#ffd88a', celestial: { type: 'none' }, stars: 0, layers: [{ kind: painter, base: 400, f: 0.05 }], fog: '#4a3a30', decor: [] }, extra || {});
const themes = {
  bone_quarry: Object.assign({}, quarry, {
    name: 'The Spare Bone Quarry', music: 'tour_bone', particles: 'dust', rays: '#fff0c8',
    sky: SKY_DAY, horizonGlow: '#ffe0a8', celestial: { type: 'sun', x: 0.78, y: 0.14, r: 30, color: '#fff8e0', glow: '#ffd88a' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#b8a8c8', base: 270, amp: 120, f: 0.03, blur: true, snow: true }, { kind: 'boneTerraces', color: '#e0a868', base: 330, f: 0.08 }, { kind: 'boneArcs', color: '#b8743a', bone: '#efe2c4', base: 390, f: 0.2 }],
    fog: '#ffe8c8', decor: ['boneTuft', 'boneRock', 'boneTuft', 'boneAmmo']
  }),
  bone_scree: Object.assign({}, quarry, {
    name: 'Assembly Optional', music: 'tour_bone', particles: 'dust', rays: '#fff0c8',
    sky: ['#5a8ac8', '#a8c8e0', '#f8dcb0'], horizonGlow: '#ffd0a0', celestial: { type: 'sun', x: 0.2, y: 0.18, r: 28, color: '#fff8e0', glow: '#ffd88a' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'boneTerraces', color: '#c8a078', base: 300, f: 0.05 }, { kind: 'boneScree', color: '#a8906e', base: 360, f: 0.12 }, { kind: 'boneArcs', color: '#8a5a32', bone: '#e8dcc0', base: 410, f: 0.25 }],
    fog: '#f0d8b8', decor: ['boneRock', 'boneTuft', 'boneAmmo']
  }),
  bone_clay: Object.assign({}, quarry, { ground: clayGround,
    name: 'Make an Impression', music: 'tour_bone_shed', particles: 'dust', rays: null,
    sky: ['#6a5a4a', '#8a7a62', '#a8967a'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'boneShed', color: '#9a7a5a', base: 380, f: 0.1 }],
    fog: '#a8907a', darkness: 0.05, decor: ['boneBucket', 'boneRock']
  }),
  bone_cut: Object.assign({}, quarry, {
    name: 'Clean Break', music: 'tour_bone_shed', particles: 'dust', rays: null,
    sky: ['#4a5a6a', '#6a7a8a', '#8a9aa8'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'boneWorkshop', color: '#7a6a5a', base: 390, f: 0.1 }],
    fog: '#8a8a8a', darkness: 0.05, decor: ['boneBucket', 'boneRock']
  }),
  bone_dig: Object.assign({}, quarry, {
    name: 'Some Reassembly Required', music: 'tour_bone', particles: 'dust', rays: '#ffd8a0',
    sky: ['#3a2a5a', '#a85a6a', '#f8b878'], horizonGlow: '#ffb878', celestial: { type: 'sun', x: 0.5, y: 0.42, r: 34, color: '#ffe0a0', glow: '#ff9a6a' }, stars: 0.3,
    layers: [{ kind: 'mountains', color: '#6a4a6a', base: 280, amp: 110, f: 0.03, blur: true, snow: true }, { kind: 'boneTerraces', color: '#a8643a', base: 330, f: 0.07 }, { kind: 'boneArcs', color: '#6a3a22', bone: '#d8c8a8', base: 400, f: 0.2 }],
    fog: '#c87a5a', decor: ['boneRock', 'boneTuft']
  }),
  bone_arena: Object.assign({}, quarry, {
    name: 'The Dig', music: 'tour_bone_boss', particles: 'dust', rays: null,
    sky: ['#24183a', '#6a3a5a', '#c8705a'], horizonGlow: '#ff9a6a', celestial: { type: 'none' }, stars: 0.6,
    layers: [{ kind: 'mountains', color: '#4a3050', base: 250, amp: 90, f: 0.03, blur: true, snow: true }, { kind: 'boneTerraces', color: '#6a3a2a', base: 300, f: 0.06 }, { kind: 'boneArcs', color: '#4a2a1e', bone: '#8a7a64', base: 350, f: 0.12 }, { kind: 'boneDigClutter', color: '#3a2218', base: 400, f: 0.22 }],
    fog: '#5a3a3a', decor: []
  }),
  bone_room_hall: room('The Great Hall', 'roomHall', mat('marble')),
  bone_room_shop: room('The Gift Shop', 'roomShop', mat('checker')),
  bone_room_cast: room('The Cast Room', 'roomCast', mat('tile')),
  bone_room_tar: room('The Tar Pool', 'roomTar', Object.assign({ liquid: 'canal' }, mat('basalt'))),
  bone_room_store: room('The Specimen Store', 'roomStore', mat('planks'))
};

/* ---------------- props (Decor: drawn each frame, plain shapes only) ---------------- */
const decor = {
  // a tuft of dry paramo grass
  boneTuft(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = '#a88a3a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.quadraticCurveTo(x + k * 3, y - 10, x + k * 5 + Math.sin(t * 1.5 + k) * 1.5, y - 16 - Math.abs(k) * -1); ctx.stroke(); }
    ctx.strokeStyle = '#e0c060'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k += 2) { ctx.beginPath(); ctx.moveTo(x + k * 2, y - 2); ctx.lineTo(x + k * 4, y - 13); ctx.stroke(); }
    ctx.restore();
  },
  // a lump of quarry rock
  boneRock(ctx, x, y, t, th, d) {
    const s = 0.7 + (((d && d.seed) || 0) % 4) * 0.12;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#b8743a';
    ctx.beginPath(); ctx.moveTo(x - 13 * s, y); ctx.lineTo(x - 10 * s, y - 9 * s); ctx.lineTo(x - 1 * s, y - 14 * s); ctx.lineTo(x + 11 * s, y - 9 * s); ctx.lineTo(x + 13 * s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0a060'; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 8 * s); ctx.lineTo(x - 1 * s, y - 12 * s); ctx.lineTo(x + 3 * s, y - 8 * s); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  // an ammonite lying in the dust
  boneAmmo(ctx, x, y, t, th, d) { BoneArt.ammonite(ctx, x, y - 8, 8, ((d && d.seed) || 0) % 2 ? '#3e8a74' : '#c8a060'); },
  // a bucket of wet plaster with a trowel in it
  boneBucket(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#7a8a96';
    ctx.beginPath(); ctx.moveTo(x - 11, y - 20); ctx.lineTo(x + 11, y - 20); ctx.lineTo(x + 9, y); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x, y - 20, 11, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 2, y - 34, 3, 14); ctx.strokeRect(x + 2, y - 34, 3, 14);
    ctx.restore();
  },
  // the tipped crate of replicas (37-1's start)
  boneCrate(ctx, x, y, t) { BoneArt.crate(ctx, x, y, 1); },
  // a museum label on a stalk (decor seed picks the word)
  boneLabel(ctx, x, y, t, th, d) { BoneArt.label(ctx, x, y, ['APPROX.', 'REPLICA', 'PROBABLY', 'A FOOT?', 'UNSURE'][((d && d.seed) || 0) % 5], 44); },
  // a lantern on a survey pole
  boneLamp(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 2, y - 50, 4, 50); ctx.strokeRect(x - 2, y - 50, 4, 50);
    ctx.fillStyle = '#ffd88a'; rr(ctx, x - 7, y - 64, 14, 14, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
};
const decorLights = { boneLamp: [80, '#ffd88a', -57] };

/* ---------------- door looks: the dig team's plywood hatch, a crack in the strata ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'boneHatch' || look === 'boneCrack') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'boneHatch') {
        ctx.fillStyle = '#c89a5a'; rr(ctx, x - 20, y - 58, 40, 58, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#a8783a'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 18, y - 52 + k * 14, 36, 3);
        ctx.fillStyle = PERS; ctx.beginPath(); ctx.arc(x + 12, y - 28, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
        if (near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 66 + Math.sin(t * 6) * 2); }
      } else {
        ctx.fillStyle = '#2a140a'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 12, y - 30); ctx.lineTo(x - 4, y - 46); ctx.lineTo(x + 3, y - 58); ctx.lineTo(x + 10, y - 40); ctx.lineTo(x + 14, y - 18); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 66 + Math.sin(t * 6) * 2); }
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// SOCKET MOUSE: an orange mouse living in a hollow bone socket. It moves house every time a bigger joint comes free:
// when Brady gets close it twitches its whiskers (the tell), then springs out on its tail in a high arc AWAY from him
// (it is moving house, not attacking: only its landing and its scurry can bump into him), and scurries to a new socket (it lives in the hollow bone it carries along on its back... sort of).
const mouseArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const home = m === 'idle' || m === 'notice', air = m === 'hop';
  if (home) {
    // the hollow bone socket it lives in, the mouse peeking out
    const tw = m === 'notice' ? Math.sin(t * 60) * 1.5 : 0;
    ctx.fillStyle = '#f2b44e'; ctx.beginPath(); ctx.arc(2, -15, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb0a0'; ctx.beginPath(); ctx.arc(-5, -20, 4, 0, TAU); ctx.arc(8, -20, 4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5, -16, 1.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(8, -13 + tw); ctx.lineTo(15, -14 - tw); ctx.moveTo(8, -12); ctx.lineTo(15, -10 + tw); ctx.stroke(); ctx.lineWidth = 1.7;
    ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-11, -12); ctx.quadraticCurveTo(0, -9, 11, -12); ctx.lineTo(11, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BONE_LO; ctx.beginPath(); ctx.ellipse(0, -11, 11, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BONE_SH; ctx.beginPath(); ctx.arc(-6, -5, 2.5, 0, TAU); ctx.fill();
    if (m === 'notice') { ctx.fillStyle = '#ffd84a'; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('!', 2, -28); }
    ctx.restore(); return;
  }
  // out: springing on its curled tail, or scurrying
  const st = air ? 0 : Math.sin(t * 22) * 2;
  ctx.strokeStyle = '#e07a50'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-8, -6); if (air) { ctx.bezierCurveTo(-16, 0, -10, 8, -14, 10); } else ctx.quadraticCurveTo(-18, -8, -20, -2); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.fillStyle = '#f2a03a';
  ctx.beginPath(); ctx.ellipse(-1, -7, 9, 6, air ? -0.3 : 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2b44e'; ctx.beginPath(); ctx.arc(7, -11, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffb0a0'; ctx.beginPath(); ctx.arc(4, -17, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(9, -12, 1.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(12.5, -10, 1.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (const lx of [-5, 3]) { ctx.beginPath(); ctx.moveTo(lx, -2); ctx.lineTo(lx + st, 0); ctx.stroke(); }
  ctx.restore();
};
// PLASTER NEWT: a spotted petrol-green newt. Stomp it once and its tail drops off (it wriggles away on its own); the
// newt holds up THREE replacement tails, picks one and carries on, faster. The second stomp is the real one.
const newtArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const tail = !(e.tailless > 0), st = Math.sin(t * 14) * 2;
  if (tail) { ctx.fillStyle = e.hp > 1 ? '#3e8a6a' : '#c8b898'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(-22, -10 + Math.sin(t * 6) * 3, -26, -2); ctx.quadraticCurveTo(-18, -2, -8, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); if (e.hp <= 1) { ctx.fillStyle = PERS; ctx.beginPath(); ctx.arc(-9, -4, 2.5, 0, TAU); ctx.fill(); ctx.stroke(); } }
  ctx.fillStyle = '#3e8a6a';
  for (const lx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(lx, -4); ctx.lineTo(lx - 3 + st * (lx > 0 ? 1 : -1), 1); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -7, 11, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(12, -10, 6, 4.5, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BONE; for (const [sx, sy] of [[-5, -9], [1, -10], [6, -7], [-2, -5]]) { ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14, -13, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(15, -13, 1.3, 0, TAU); ctx.fill();
  // the three replacement tails it holds up while it decides
  if (e.tailless > 0) for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(-2 + k * 8, -18 - k % 2 * 3); ctx.rotate(-0.4 + k * 0.4); ctx.fillStyle = ['#c8b898', '#e8a04a', '#8ac8b8'][k]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-3, -8, 0, -14); ctx.quadraticCurveTo(3, -8, 3, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
};
// DUST BRUSH: a grumpy orange-handled dig brush on two green boots. It runs ahead of shoes to erase the evidence: when
// Brady comes near it scowls and scrubs the ground (the tell, a dust puff), then dashes at him sweeping.
const brushArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const run = m === 'charge', wind = m === 'notice', step = run ? Math.sin(t * 26) * 3 : Math.sin(t * 8) * 1.5;
  ctx.rotate(run ? 0.25 : wind ? Math.sin(t * 40) * 0.08 : 0);
  ctx.fillStyle = PETROL; rr(ctx, -9 + step, -6, 7, 6, 2); ctx.fill(); ctx.stroke(); rr(ctx, 2 - step, -6, 7, 6, 2); ctx.fill(); ctx.stroke();
  // the bristles
  ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(12, -5); ctx.lineTo(9, -17); ctx.lineTo(-9, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = BONE_SH; ctx.lineWidth = 1; for (let k = -9; k <= 9; k += 3) { ctx.beginPath(); ctx.moveTo(k, -6); ctx.lineTo(k * 0.8, -16); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // the ferrule with its face, and the handle
  ctx.fillStyle = PERS; rr(ctx, -10, -27, 20, 11, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-3, -22, 2.6, 0, TAU); ctx.arc(4, -22, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-2, -22, 1.2, 0, TAU); ctx.arc(5, -22, 1.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(-1, -24.5); ctx.moveTo(8, -26); ctx.lineTo(3, -24.5); ctx.stroke();
  ctx.fillStyle = '#e8763a'; rr(ctx, -4, -42, 8, 16, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, -38, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
  if (run && Math.random() < 0.3 && e.g) e.g.burst(x - (e.dir || 1) * 14, y - 2, 1, '#e8c898', 'dust');
};
// REPLICA ROOK: a dark green bird with an orange eye-ring and a bone-white beak. It drifts about pecking at its own
// reflection in freshly varnished bone; when Brady comes under it, it squawks and swoops.
const rookArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(-(e.dir || 1), 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const f = Math.sin(t * (m === 'swoop' ? 22 : 10));
  ctx.fillStyle = '#245a48'; ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(14, -10 - f * 10, 24, -4 - f * 8); ctx.quadraticCurveTo(14, 0, 4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2e6a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(18, 6); ctx.lineTo(16, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-9, -5, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-24, -3); ctx.lineTo(-14, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PERS; ctx.beginPath(); ctx.arc(-10, -6, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-10.5, -6, 1.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = BONE_LO; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(-3, 11); ctx.moveTo(2, 6); ctx.lineTo(2, 11); ctx.stroke();
  ctx.restore();
};
// the newt's dropped tail: it wriggles away on its own for a moment (harmless scenery)
class BoneTail extends Ent {
  constructor(g, s) { super(g, s, 16, 8); this.x = s.x - 8; this.y = s.y - 8; this.life = 1.6; this.dir = s.dir || 1; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; this.x += this.dir * 40 * dt; if (this.t > this.life) this.remove = true; }
  touchPlayer() {}
  draw(ctx) { ctx.save(); ctx.globalAlpha = clamp((this.life - this.t) * 2, 0, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#3e8a6a'; ctx.beginPath(); const w = Math.sin(this.t * 20) * 3; ctx.moveTo(this.x, this.y + 6); ctx.quadraticCurveTo(this.x + 8, this.y + w, this.x + 16, this.y + 6); ctx.quadraticCurveTo(this.x + 8, this.y + 8, this.x, this.y + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
}
ENTITY_TYPES.boneTail = BoneTail;
// the socket mouse's own think: in its socket until Brady comes within 5 tiles; whiskers twitch (0.6 s), then it
// springs out at him on its tail; after landing it scurries about and moves into a new socket a few seconds later
const mouseThink = (e, dt) => {
  const p = e.g.player;
  e.st = (e.st || 0) + dt;
  if (!e.phase) e.phase = 'home';
  if (e.phase === 'home') { e.vx = 0; e.mode = 'idle'; if (e.cool <= 0 && p && !p.dead && Math.abs(p.cx - e.cx) < 5 * TS && Math.abs(p.cy - e.cy) < 3 * TS) { e.phase = 'notice'; e.st = 0; e.dir = -(sign(p.cx - e.cx) || e.dir); TourKit.sfx('squeak', 'select', { vol: 0.35, pitch: 2.2 }); } }
  else if (e.phase === 'notice') { e.vx = 0; e.mode = 'notice'; if (e.st > 0.6) { e.phase = 'spring'; e.st = 0; e.vy = -10 * TS; e.vx = e.dir * 2.4 * TS; e.onGround = false; e.g.burst(e.cx, e.y + e.h, 4, BONE, 'dust'); } }
  else if (e.phase === 'spring') { e.mode = 'hop'; if (e.onGround && e.st > 0.15) { e.phase = 'scurry'; e.st = 0; e.vx = e.dir * e.speed; } }
  else { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (e.st > 2.6 && e.onGround) { e.phase = 'home'; e.st = 0; e.cool = 1.6; Tour.boneKit.pill(e.g, e.cx, e.y - 8, 'NEW HOUSE!', '#ffd88a'); } }
};
const enemies = {
  boneMouse: { cls: TourEnemy.make({ w: 22, h: 22, speed: 1.6, edgeTurn: true, art: mouseArt, burst: '#f2a03a', think: mouseThink, init: e => { const tp0 = e.touchPlayer; e.touchPlayer = p => { if (e.phase === 'home' || !e.phase) return; return tp0.call(e, p); }; } }), place: 'walk' },
  boneNewt: { cls: TourEnemy.make({ w: 28, h: 16, speed: 0.9, hp: 2, edgeTurn: true, art: newtArt, burst: '#3e8a6a',
    think: (e, dt) => { if (e.tailless > 0) { e.tailless -= dt; e.vx = 0; e.mode = 'idle'; if (e.tailless <= 0) { e.speed = 1.5 * TS; e.vx = e.dir * e.speed; Tour.boneKit.pill(e.g, e.cx, e.y - 10, 'THAT ONE.', '#c8f0d8'); } return; } e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; },
    onHurt: e => { e.tailless = 0.9; e.g.spawn(new BoneTail(e.g, { x: e.cx - e.dir * 14, y: e.y + e.h, dir: -e.dir })); Tour.boneKit.pill(e.g, e.cx, e.y - 12, 'MY TAIL!', '#c8f0d8'); } }), place: 'walk' },
  boneBrush: { cls: TourEnemy.make({ w: 24, h: 40, speed: 0.8, behavior: 'charge', range: 7, chargeSpeed: 4.2, windup: 0.8, chargeT: 1.1, edgeTurn: true, art: brushArt, burst: '#f06a2a',
    onNotice: e => { Tour.boneKit.pill(e.g, e.cx, e.y - 12, 'SWEEP SWEEP!', '#ffd88a'); e.g.burst(e.cx, e.y + e.h, 6, '#e8c898', 'dust'); TourKit.sfx('brush', 'select', { vol: 0.35, pitch: 0.7 }); } }), place: 'walk' },
  boneRook: { cls: TourFlyer.make({ w: 30, h: 20, range: 3, speed: 0.7, swoop: true, art: rookArt, burst: '#2e6a5a',
    onSwoop: e => { if (e.g.onScreen(e)) Tour.boneKit.pill(e.g, e.cx, e.y - 10, 'CAW!', '#c8f0d8'); } }), place: 'fly' }
};

/* ---------------- the route map: a little bone in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6 + Math.sin(t * 1.5) * 0.05);
  ctx.fillStyle = BONE; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.fillRect(-r * 0.55, -r * 0.16, r * 1.1, r * 0.32);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.62, sy * r * 0.2, r * 0.24, 0, TAU); ctx.fill(); }
  ctx.fillStyle = PERS; ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, TAU); ctx.fill();
  ctx.restore();
};

/* ---------------- the land's map: sprites ---------------- */
Object.assign(TourOWPaint.art, {
  // a quarry bench cut into the land: two stepped ochre ledges
  boneBench(c, r) { this.P(c, [[-r, 0], [-r, -r * 0.4], [-r * 0.3, -r * 0.4], [-r * 0.3, -r * 0.8], [r, -r * 0.8], [r, 0]], '#e0a060'); c.fillStyle = '#c87a3a'; c.fillRect(-r, -r * 0.12, r * 2, r * 0.12); },
  // a giant replica bone lying on the map
  boneBig(c, r) { BoneArt.bone(c, -r, 0, r, -r * 0.4, r * 0.35, true); },
  // a rib arch
  boneRibs(c, r) { c.strokeStyle = INK; c.lineWidth = r * 0.32; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(k * r * 0.5 - r * 0.5, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.strokeStyle = BONE; c.lineWidth = r * 0.2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(k * r * 0.5 - r * 0.5, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } },
  // the tipped crate where the arrival trail starts
  boneCrateS(c, r) { c.save(); c.rotate(-0.15); this.P(c, [[-r, 0], [-r, -r * 0.9], [r, -r * 0.9], [r, 0]], '#c89a5a'); c.fillStyle = '#a8783a'; c.fillRect(-r, -r * 0.6, r * 2, r * 0.1); c.restore(); },
  // the fossil sitting down at last (the boss's stop)
  boneSit(c, r) { BoneArt.bone(c, -r * 0.8, -r * 0.2, r * 0.6, -r * 0.6, r * 0.3, true); BoneArt.joint(c, r * 0.7, -r * 0.7, r * 0.22); c.fillStyle = BONE; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.ellipse(r * 0.8, -r * 1.05, r * 0.35, r * 0.22, 0.3, 0, TAU); c.fill(); c.stroke(); }
});
// a quarry rim instead of a coast: a soft shadow, a rust cliff band, then the ochre floor
TourOWLands.coast.boneRim = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(8, 14); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(40,20,10,0.35)'; c.fill(); c.restore();
  c.save(); c.translate(0, 9); OWGeo.path(c, ring, true); c.fillStyle = '#8a4620'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#f2c070'; c.lineWidth = 12; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the quarry floor under the trails: strata bands, scattered ammonites and bones
TourOWScenes.groundPaint.bone = function (c, ow) {
  const R = TourOWPaint.rng('boneground'), A = TourOWPaint.art, ink = TourOWPaint.INK;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(160,90,30,0.28)'; c.lineWidth = 3;
  for (let k = 0; k < 14; k++) { const y = 180 + k * 40 + R() * 10; c.beginPath(); c.moveTo(200, y); for (let x = 200; x < 1340; x += 60) c.lineTo(x, y + Math.sin(x * 0.01 + k) * 8); c.stroke(); }
  for (let k = 0; k < 16; k++) { c.save(); c.translate(240 + R() * 1060, 200 + R() * 500); BoneArt.ammonite(c, 0, 0, 5 + R() * 4, R() < 0.5 ? '#3e8a74' : '#c8a060'); c.restore(); }
  for (let k = 0; k < 8; k++) { c.save(); c.translate(260 + R() * 1000, 220 + R() * 460); c.strokeStyle = ink; c.lineWidth = 1.2; A.boneBig.call(TourOWPaint, c, 8 + R() * 6); c.restore(); }
};
TourLandscape.looks.bone = ['#9ad0f0', '#4a9ad8', '#c87a3a', '#e0a060', '#f2c070', '#f4ead2', 'boneQuarry'];
{
  // the land's landmark miniature: a sitting fossil on a quarry bench
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'boneQuarry') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.fillStyle = '#e0a060'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-26, -12); ctx.lineTo(-8, -12); ctx.lineTo(-8, -20); ctx.lineTo(26, -20); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    BoneArt.bone(ctx, -14, -26, 14, -40, 7, true);
    ctx.restore();
  };
}

/* ---------------- music: a jaunty dig-site marimba, a clanky shed shuffle, a music-box room tune, the boss ---------- */
const tracks = {
  tour_bone: {
    bpm: 118, bars: 8, rv: 0.25, hx: 0.05, sw: 0.12,
    ch: 'D D G A D Bm G A',
    ld: 'F#6:2 A6:2 D7:4 A6:2 F#6:2 | E6:4 F#6:2 E6:2 D6:8 | G6:2 B6:2 D7:4 B6:2 G6:2 | A6:4 C#7:4 E7:8 |' +
        'F#6:2 A6:2 D7:2 C#7:2 B6:4 A6:4 | B6:2 D7:2 F#7:4 D7:4 B6:4 | G6:2 B6:2 E7:4 D7:2 B6:2 | A6:4 G6:2 E6:2 D6:8',
    li: 'marimba', lv: 0.14,
    bp: 'r..f..r.r..f..o.', bi: 'pluck', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k.....k...k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.32
  },
  tour_bone_shed: {
    bpm: 104, bars: 8, rv: 0.3, sw: 0.15, hx: 0.05,
    ch: 'Am Am Dm E Am Am F E7',
    ld: 'E6:2 .:2 A6:2 .:2 C7:4 B6:4 | A6:2 G#6:2 A6:4 E6:8 | F6:2 .:2 A6:2 .:2 D7:4 C7:4 | B6:4 G#6:4 E6:8 |' +
        'C7:2 B6:2 A6:2 E6:2 A6:4 C7:4 | E7:4 D7:2 C7:2 B6:8 | A6:2 C7:2 F7:4 E7:2 D7:2 | C7:4 B6:4 G#6:8',
    li: 'clav', lv: 0.12,
    bp: 'r.r.f...r.r.o...', bi: 'slapb', bv: 0.28,
    ap: '.c...c...c...c..', ai: 'vibes', av: 0.05, ao: 58,
    dr: ['k...k...k...k...', '..s...s...s...s.', 'h.hhh.h.h.hhh.h.'], dv: 0.3
  },
  tour_bone_room: {
    bpm: 92, bpb: 3, bars: 8, rv: 0.5, dl: 0.2, hx: 0.03,
    ch: 'C G Am F C G F G',
    ld: 'E6:3 G6:3 C7:6 | D7:3 B6:3 G6:6 | C7:3 A6:3 E6:6 | F6:6 A6:6 | E7:3 D7:3 C7:6 | B6:3 D7:3 G6:6 | A6:3 C7:3 F7:6 | D7:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.22,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.16
  },
  tour_bone_boss: {
    bpm: 136, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Em Em C D Em Em Am B7',
    ld: 'E6:2 G6:2 B6:2 E7:2 D7:4 B6:4 | C7:2 B6:2 A6:2 G6:2 E6:8 | C7:2 E7:2 G7:2 E7:2 D7:4 C7:4 | D7:4 F#7:4 A7:8 |' +
        'B6:2 A6:2 G6:2 E6:2 G6:4 B6:4 | A6:2 G6:2 F#6:2 G6:2 E6:8 | A6:2 C7:2 E7:2 A7:2 G7:4 E7:4 | F#7:4 D#7:4 B6:8',
    li: 'marimba', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'brass', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  }
};

Tour.country({
  id: 'bone', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: a quarry of fossil replicas that put themselves together from memory',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_bone', boss: 'tour_bone_boss', map: null },
  landmark: 'the quarry where the replicas landed', emblem,
  arrival: 'Brady! A whole crate of plaster fossils fell down a quarry and put themselves back together from memory. Nobody remembered properly. I love them already. ♥ C',
  coin: { name: 'BONE CHIPS', draw(ctx, x, y) {
    ctx.fillStyle = '#f2c070'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = BONE; ctx.fillRect(x - 4.5, y - 1.6, 9, 3.2); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * 4.8, y + sy * 1.8, 1.9, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 5, y - 6, 2, 2);
  } },
  levels: []
});
// a floating line on a dark rounded pill (every word the land floats: readable on any sky), kept clear of Brady's
// head and the top bar, inside the view
class BonePill extends Ent {
  constructor(g, x, y, text, col) { super(g, null, 4, 4); this.x = x; this.y = y; this.text = String(text); this.col = col || '#ffd88a'; this.life = 1.7; this.friendly = true; }
  update(dt) { this.t += dt; this.y -= 10 * dt; if (this.t > this.life) this.remove = true; }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, a = Math.min(1, (this.life - this.t) * 3, this.t * 8);
    ctx.save(); ctx.globalAlpha = a; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(this.text).width + 18;
    let x = clamp(this.x, g.camX + w / 2 + 6, g.camX + Game.viewW - w / 2 - 6), y = this.y;
    if (p && Math.abs(x - p.cx) < w / 2 + 16 && y > p.y - 30 && y < p.y + p.h) y = p.y - 30;
    y = Math.max(y, g.camY + 64);
    ctx.fillStyle = 'rgba(36,22,14,0.86)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = this.col; ctx.fillText(this.text, x, y + 1); ctx.restore();
  }
}
ENTITY_TYPES.bonePill = BonePill;
const pill = (g, x, y, text, col) => { if (g && g.spawn) g.spawn(new BonePill(g, x, y, text, col)); };
// for the other bone files and the tests
Tour.boneKit = { pill, COL, INK, BoneArt, OCHRE, OCHRE_HI, OCHRE_LO, RUST, BONE, BONE_LO, BONE_SH, PERS, PETROL, PETROL_LO };
})();
