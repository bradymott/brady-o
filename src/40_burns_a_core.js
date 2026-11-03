/* ============================================================
   BRADY GOES TO BURNING MAN — 3D action-adventure engine (core)
   ------------------------------------------------------------
   Files (concatenated alphabetically):
     40_burns_a_core.js    math, save, audio helpers, registry, data tables
     40_burns_b_gl.js      WebGL renderer (sky, ground, static chunks,
                           rigid-skinned meshes, sprites, portraits)
     40_burns_c_mesh.js    mesh builder + texture atlas painter
     40_burns_d_rig.js     character rigs, costumes, procedural animation
     40_burns_e_props.js   prop library (RVs, domes, scaffolds, the Man...)
     40_burns_f_world.js   world runtime: terrain, colliders, movers, build API
     40_burns_g_actors.js  NPCs, enemies, behaviours, projectiles, bosses
     40_burns_h_player.js  Brady controller, power-ups, vehicles
     40_burns_i_play.js    BurnsPlayScene: loop, camera, missions, cutscenes
     40_burns_j_ui.js      HUD, dialogue, pause, banners, minimap
     40_burns_k_hub.js     BurnsHubScene (playa map) + intro story
   Worlds register themselves from 42_burns_world1.js, 43_..., etc.
   Authoring guide: docs/BURNS_GUIDE.md
   Conventions: Y up, metres, yaw 0 faces +Z, forward = (sin yaw, 0, cos yaw).
   ============================================================ */

const BURNS_VERSION = 1;

/* ---------------- math ---------------- */
const BurnsM = {
  wrap(a) { return a - TAU * Math.floor((a + Math.PI) / TAU); },
  damp(cur, target, k, dt) { return cur + (target - cur) * (1 - Math.exp(-k * dt)); },
  dampAngle(cur, target, k, dt) { return cur + BurnsM.wrap(target - cur) * (1 - Math.exp(-k * dt)); },
  smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
  hash(i) { let h = (i | 0) * 374761393; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  // value noise in 2D (cheap, deterministic) — used for terrain and painting
  noise2(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const h = (a, b) => BurnsM.hash(a * 7919 + b * 104729);
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = h(xi, zi), b = h(xi + 1, zi), c = h(xi, zi + 1), d = h(xi + 1, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },
  fwdX(yaw) { return Math.sin(yaw); },
  fwdZ(yaw) { return Math.cos(yaw); },
  yawTo(dx, dz) { return Math.atan2(dx, dz); },
  dist2(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; },
  // column-major 4x4 perspective; shiftY moves the image up (NDC units)
  persp(o, fovy, asp, n, f, shiftY) {
    const t = 1 / Math.tan(fovy / 2);
    o.fill(0); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
    o[9] = -(shiftY || 0);
    return o;
  },
  // view matrix + camera basis (r = right, u = up, f = forward)
  lookAt(o, B, ex, ey, ez, tx, ty, tz) {
    let zx = ex - tx, zy = ey - ty, zz = ez - tz, l = Math.hypot(zx, zy, zz) || 1;
    zx /= l; zy /= l; zz /= l;
    // x = up(0,1,0) × z
    let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
    o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
    o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez); o[15] = 1;
    B.rx = xx; B.ry = xy; B.rz = xz; B.ux = yx; B.uy = yy; B.uz = yz; B.fx = -zx; B.fy = -zy; B.fz = -zz;
    B.ex = ex; B.ey = ey; B.ez = ez;
    return o;
  },
  mul4(o, a, b) {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      o[i * 4 + j] = a[j] * b[i * 4] + a[4 + j] * b[i * 4 + 1] + a[8 + j] * b[i * 4 + 2] + a[12 + j] * b[i * 4 + 3];
    }
    return o;
  },
  // frustum planes (6 x vec4) from a column-major view-projection matrix
  planes(out, m) {
    const p = (i, a, b, c, d) => { const l = Math.hypot(a, b, c) || 1; out[i * 4] = a / l; out[i * 4 + 1] = b / l; out[i * 4 + 2] = c / l; out[i * 4 + 3] = d / l; };
    p(0, m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    p(1, m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    p(2, m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    p(3, m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    p(4, m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    p(5, m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
    return out;
  },
  sphereVisible(P, x, y, z, r) {
    for (let i = 0; i < 6; i++) if (P[i * 4] * x + P[i * 4 + 1] * y + P[i * 4 + 2] * z + P[i * 4 + 3] < -r) return false;
    return true;
  },
  boxVisible(P, x0, y0, z0, x1, y1, z1) {
    for (let i = 0; i < 6; i++) {
      const a = P[i * 4], b = P[i * 4 + 1], c = P[i * 4 + 2], d = P[i * 4 + 3];
      if (a * (a > 0 ? x1 : x0) + b * (b > 0 ? y1 : y0) + c * (c > 0 ? z1 : z0) + d < 0) return false;
    }
    return true;
  },
  /* ---- affine 3x4, row-major, stored at offset in a Float32Array (12 floats) ----
     [m0 m1 m2 m3 | m4 m5 m6 m7 | m8 m9 m10 m11]  columns 0-2 = rotation/scale, column 3 = translation */
  a34Set(o, k, tx, ty, tz, yaw, pitch, roll, sx, sy, sz) {
    // R = Ry(yaw) * Rx(pitch) * Rz(roll), then scale
    const cy = Math.cos(yaw), sny = Math.sin(yaw), cx = Math.cos(pitch), snx = Math.sin(pitch), cz = Math.cos(roll), snz = Math.sin(roll);
    // Rx*Rz
    const a00 = cz, a01 = -snz, a02 = 0;
    const a10 = cx * snz, a11 = cx * cz, a12 = -snx;
    const a20 = snx * snz, a21 = snx * cz, a22 = cx;
    // Ry * (Rx*Rz)
    o[k] = (cy * a00 + sny * a20) * sx; o[k + 1] = (cy * a01 + sny * a21) * sy; o[k + 2] = (cy * a02 + sny * a22) * sz; o[k + 3] = tx;
    o[k + 4] = a10 * sx; o[k + 5] = a11 * sy; o[k + 6] = a12 * sz; o[k + 7] = ty;
    o[k + 8] = (-sny * a00 + cy * a20) * sx; o[k + 9] = (-sny * a01 + cy * a21) * sy; o[k + 10] = (-sny * a02 + cy * a22) * sz; o[k + 11] = tz;
    return o;
  },
  // o[ko] = A[ka] * B[kb]   (affine 3x4 composition)
  a34Mul(o, ko, A, ka, B, kb) {
    const a0 = A[ka], a1 = A[ka + 1], a2 = A[ka + 2], a3 = A[ka + 3], a4 = A[ka + 4], a5 = A[ka + 5], a6 = A[ka + 6], a7 = A[ka + 7], a8 = A[ka + 8], a9 = A[ka + 9], a10 = A[ka + 10], a11 = A[ka + 11];
    const b0 = B[kb], b1 = B[kb + 1], b2 = B[kb + 2], b3 = B[kb + 3], b4 = B[kb + 4], b5 = B[kb + 5], b6 = B[kb + 6], b7 = B[kb + 7], b8 = B[kb + 8], b9 = B[kb + 9], b10 = B[kb + 10], b11 = B[kb + 11];
    o[ko] = a0 * b0 + a1 * b4 + a2 * b8; o[ko + 1] = a0 * b1 + a1 * b5 + a2 * b9; o[ko + 2] = a0 * b2 + a1 * b6 + a2 * b10; o[ko + 3] = a0 * b3 + a1 * b7 + a2 * b11 + a3;
    o[ko + 4] = a4 * b0 + a5 * b4 + a6 * b8; o[ko + 5] = a4 * b1 + a5 * b5 + a6 * b9; o[ko + 6] = a4 * b2 + a5 * b6 + a6 * b10; o[ko + 7] = a4 * b3 + a5 * b7 + a6 * b11 + a7;
    o[ko + 8] = a8 * b0 + a9 * b4 + a10 * b8; o[ko + 9] = a8 * b1 + a9 * b5 + a10 * b9; o[ko + 10] = a8 * b2 + a9 * b6 + a10 * b10; o[ko + 11] = a8 * b3 + a9 * b7 + a10 * b11 + a11;
  },
  // transform a point by the affine at offset k
  a34Pt(M, k, x, y, z, out) {
    out[0] = M[k] * x + M[k + 1] * y + M[k + 2] * z + M[k + 3];
    out[1] = M[k + 4] * x + M[k + 5] * y + M[k + 6] * z + M[k + 7];
    out[2] = M[k + 8] * x + M[k + 9] * y + M[k + 10] * z + M[k + 11];
    return out;
  }
};

/* ---------------- colours ---------------- */
const BURNS_RGB = {};
function burnsRGB(c) { // '#rrggbb' -> [r,g,b] 0..255 (cached)
  if (Array.isArray(c)) return c;
  let v = BURNS_RGB[c];
  if (!v) { v = hexToRgb(c); BURNS_RGB[c] = v; }
  return v;
}
function burnsRGBf(c) { const v = burnsRGB(c); return [v[0] / 255, v[1] / 255, v[2] / 255]; }
function burnsHSL(h, s, l) { // h 0..360, s/l 0..1 -> hex
  h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
const BURNS_NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff', '#ff3b5c'];

/* ---------------- audio: play new names, fall back to existing ones ---------------- */
const BURNS_SFX_FALLBACK = {
  footstep: '', land: 'stomp', jump3d: 'jump', doublejump: 'jumpBig', groundpound: 'stomp', spin: 'throw', token_get: 'gold',
  ticket: 'secret', dialogue_blip: '', yell: 'crowd', greeter_bell: 'pick', camera_flash: 'laser', pitch_blah: 'bump',
  neon_flash: 'thunder', flame_jet: 'flame', firework_launch: 'fire', firework_burst: 'break', bike_bell: 'pick',
  bike_pedal: '', pickup_bag: 'powerup', molly: 'powerup', khole: 'powerdown', powder: 'powerup', lsd: 'secret',
  costume: 'appear', map_open: 'cardFlip', man_roar: 'thunder', man_stomp: 'stomp', crowd_cheer: 'crowd', hurt3d: 'hurt'
};
const BURNS_MUSIC_FALLBACK = {
  burns_hub: 'map', burns_intro: 'story', burns_w1: 'w5', burns_w2: 'w6', burns_w3: 'w7', burns_w4: 'w7', burns_w5: 'w6',
  burns_w6: 'w8', burns_w7: 'w9', burns_w8: 'w8', burns_w9: 'w9', burns_w10: 'final', man_boss: 'boss', man_giant: 'final',
  burns_victory: 'clear', burns_ending: 'ending'
};
function burnsHas(list, name) { try { return !!(list && list.indexOf(name) >= 0); } catch (e) { return false; } }
function burnsSfx(name, opts, fallback) {
  try {
    if (burnsHas(Sound.sfxNames, name)) { Sound.play(name, opts); return; }
    const fb = fallback !== undefined ? fallback : BURNS_SFX_FALLBACK[name];
    if (fb) Sound.play(fb, opts);
  } catch (e) { /* audio must never break the game */ }
}
function burnsMusic(name, fallback) {
  try {
    if (!name) { Sound.stopMusic && Sound.stopMusic(); return; }
    if (burnsHas(Sound.trackNames, name)) { Sound.music(name); return; }
    const fb = fallback || BURNS_MUSIC_FALLBACK[name];
    if (fb) Sound.music(fb);
  } catch (e) { /* ignore */ }
}

/* ---------------- the app's title screen ----------------
   "Brady Goes to Burning Man" is its own app: BurnsAppStart (40_burns_l_app.js) is its title. Inside the old
   combined build the 2D game's TitleScene is the fallback until the app title has been shown once. */
function burnsToTitle() {
  if (window.__burnsApp || typeof TitleScene === 'undefined') Game.setScene(new BurnsAppStart());
  else Game.setScene(new TitleScene());
}

/* ---------------- save data: Save.data.burns ---------------- */
const BurnsSave = {
  defaults() {
    return {
      v: BURNS_VERSION,
      unlocked: { 1: true },     // worldId -> true
      tokens: {},                // 'w:missionId' -> true
      photos: {},                // 'w:photoId' -> true
      items: {},                 // key items: ticket, map, www, bike, costumes, artcar ...
      costume: 'none',           // BURNS_COSTUMES id
      costumesOwned: { none: true },
      glow: 0,                   // glow sticks banked (lifetime)
      glowWorld: {},             // worldId -> best glow sticks in one visit
      worldDone: {},             // worldId -> true once its boss is beaten
      missions: {},              // 'w:missionId' -> 'done' (non-token mission progress)
      flags: {},                 // free-form story flags: 'w:flag' -> value
      seenIntro: false,
      seenWorldIntro: {},        // worldId -> true
      lastWorld: 1,
      checkpoint: {},            // worldId -> checkpoint id (resume point)
      pack: {},                  // Brady's backpack: itemId -> count (ground scores, quest items)
      settings: { camSens: 1, invertY: false, autoCam: true, cam: 'normal', gfx: 'auto' }
    };
  },
  get() {
    if (!Save.data) Save.load();
    let d = Save.data.burns;
    const def = this.defaults();
    if (!d || typeof d !== 'object') { d = def; Save.data.burns = d; }
    for (const k in def) if (d[k] === undefined) d[k] = def[k];
    for (const k in def.settings) if (d.settings[k] === undefined) d.settings[k] = def.settings[k];
    if (!d.unlocked[1]) d.unlocked[1] = true;
    if (this._migrated !== d) {   // once per loaded save
      this._migrated = d;
      // progression follows BURNS_WORLD_ORDER: every finished world unlocks the next one in the
      // sequence (migrates saves made under older orders, e.g. finished 2 -> unlock 16). Nothing is re-locked.
      let changed = false;
      for (const id of BURNS_WORLD_ORDER) { if (!d.worldDone[id]) continue; const nx = BurnsWorlds.next(id); if (nx && !d.unlocked[nx]) { d.unlocked[nx] = true; changed = true; } }
      // ground scores arrived with world 16: saves that already got past it keep their baggies
      if (!d.flags['0:groundscore'] && BURNS_WORLD_ORDER.some(id => d.worldDone[id] && BURNS_WORLD_ORDER.indexOf(id) > BURNS_WORLD_ORDER.indexOf(16))) { d.flags['0:groundscore'] = true; changed = true; }
      if (changed) this.save();
    }
    return d;
  },
  save() { try { Save.save(); } catch (e) { /* ignore */ } },
  hasToken(w, id) { return !!this.get().tokens[w + ':' + id]; },
  addToken(w, id) { const d = this.get(); const k = w + ':' + id; if (d.tokens[k]) return false; d.tokens[k] = true; this.save(); return true; },
  tokenCount(w) { const d = this.get(); let n = 0; for (const k in d.tokens) if (w === undefined || k.split(':')[0] === String(w)) n++; return n; },
  hasPhoto(w, id) { return !!this.get().photos[w + ':' + id]; },
  addPhoto(w, id) { const d = this.get(); const k = w + ':' + id; if (d.photos[k]) return false; d.photos[k] = true; this.save(); return true; },
  photoCount(w) { const d = this.get(); let n = 0; for (const k in d.photos) if (w === undefined || k.split(':')[0] === String(w)) n++; return n; },
  hasItem(id) { return !!this.get().items[id]; },
  addItem(id) { const d = this.get(); if (d.items[id]) return false; d.items[id] = true; this.save(); return true; },
  flag(w, k, v) { const d = this.get(); const key = w + ':' + k; if (v !== undefined) { d.flags[key] = v; this.save(); } return d.flags[key]; },
  // ground scores (baggies) exist only after the story flag (world 16, Bam Bam's pill)
  groundScore() { return !!this.get().flags['0:groundscore']; },
  setGroundScore(on) { this.flag(0, 'groundscore', on === undefined ? true : !!on); return this.groundScore(); },
  unlockWorld(w) { if (!w) return false; const d = this.get(); if (!d.unlocked[w]) { d.unlocked[w] = true; this.save(); return true; } return false; },
  isUnlocked(w) { return !!this.get().unlocked[w]; },
  setCostume(id) { const d = this.get(); d.costume = id; d.costumesOwned[id] = true; this.save(); }
};

/* ---------------- world registry ---------------- */
// Play order by world id. Ids never change (files, saves and tokens are keyed by id); the
// "World N" a player sees is the position in this list. Finishing a world unlocks the next one here.
const BURNS_WORLD_ORDER = [1, 2, 16, 17, 3, 4, 5, 6, 11, 7, 8, 9, 12, 13, 14, 10, 15];
// secret worlds stay off the hub until unlocked (15 "Exodus" unlocks after the finale, world 10)
const BURNS_WORLD_SECRET = { 15: true };
// Metadata for every world (shown on the hub even before a world file registers). hub = pin position on the map (0..1).
// day / dayShort: the day of the Burn week (intro card, loading card, hub pin). home: Brady's revisitable home world.
const BURNS_WORLD_META = [
  { id: 1, name: 'The Line', sub: 'Gate Road', hub: { x: 0.88, y: 0.88 }, col: '#ff9a4a', day: 'Sunday, arrival', dayShort: 'SUN' },
  { id: 2, name: 'No Camp', sub: 'The city at night', hub: { x: 0.75, y: 0.72 }, col: '#ff4fd8', day: 'Sunday night \u2192 Monday', dayShort: 'SUN NIGHT' },
  { id: 16, name: 'Rhythm Wave', sub: 'The bamboo dance floor', hub: { x: 0.68, y: 0.89 }, col: '#ffb84a', day: 'Monday', dayShort: 'MON' },
  { id: 17, name: 'Root Society', sub: 'Home sweet tipi', hub: { x: 0.60, y: 0.68 }, col: '#e8c890', day: 'Tuesday', dayShort: 'TUE', home: true },
  { id: 3, name: 'Costume Cult', sub: 'Pick a look. Get your bike back.', hub: { x: 0.54, y: 0.87 }, col: '#ffe24a', day: 'Tuesday', dayShort: 'TUE' },
  { id: 4, name: 'The Orgy Dome', sub: 'Meet the informant. Keep your pants on.', hub: { x: 0.37, y: 0.81 }, col: '#ff3b5c', day: 'Tuesday night', dayShort: 'TUE NIGHT' },
  { id: 5, name: 'Costco Soul Trading Co.', sub: 'The great gifting warehouse', hub: { x: 0.20, y: 0.70 }, col: '#38f2ff', day: 'Wednesday', dayShort: 'WED' },
  { id: 6, name: 'The Art Car Hunt', sub: 'Commandeer the fire octopus', hub: { x: 0.11, y: 0.50 }, col: '#ff7a2a', day: 'Wednesday night', dayShort: 'WED NIGHT' },
  { id: 11, name: 'Sound Camp Crawl', sub: 'Follow the bass, camp to camp', hub: { x: 0.18, y: 0.30 }, col: '#7aff5a', day: 'Thursday night', dayShort: 'THU NIGHT' },
  { id: 7, name: 'Sunrise Set', sub: 'A heart-topped sound car at dawn', hub: { x: 0.32, y: 0.16 }, col: '#ffb0d8', day: 'Friday dawn', dayShort: 'FRI DAWN' },
  { id: 8, name: 'Hell Station', sub: 'Fuel up. Fight DPW.', hub: { x: 0.50, y: 0.09 }, col: '#ff5a2a', day: 'Friday', dayShort: 'FRI' },
  { id: 9, name: 'Deep Playa Showdown', sub: 'The Man, again', hub: { x: 0.68, y: 0.16 }, col: '#9a6bff', day: 'Friday night', dayShort: 'FRI NIGHT' },
  { id: 12, name: 'The Temple', sub: 'Quiet, heavy, beautiful', hub: { x: 0.82, y: 0.30 }, col: '#f0d8a8', day: 'Saturday dawn', dayShort: 'SAT DAWN' },
  { id: 13, name: 'The Workshops', sub: 'Build something. Break nothing.', hub: { x: 0.9, y: 0.47 }, col: '#38c8ff', day: 'Saturday', dayShort: 'SAT' },
  { id: 14, name: 'Skydive Into the Burn', sub: 'Plane, freefall, parachute', hub: { x: 0.79, y: 0.62 }, col: '#9ad8ff', day: 'Saturday afternoon', dayShort: 'SAT PM' },
  { id: 10, name: 'The Man Pavilion', sub: 'Ride in. Bring her home.', hub: { x: 0.50, y: 0.48 }, col: '#ffd84a', day: 'Saturday night', dayShort: 'SAT NIGHT' },
  { id: 15, name: 'Exodus', sub: 'The long road home', hub: { x: 0.09, y: 0.82 }, col: '#ffb040', secret: true, day: 'Monday', dayShort: 'MON' }
];
const BurnsWorlds = {
  defs: {},
  // def: see docs/BURNS_GUIDE.md ("World definition")
  register(def) {
    if (!def || typeof def.id !== 'number') throw new Error('BurnsWorlds.register: def.id (number) required');
    if (typeof def.build !== 'function') throw new Error('BurnsWorlds.register: def.build(api) required');
    const meta = BURNS_WORLD_META.find(m => m.id === def.id) || {};
    def.name = def.name || meta.name || ('World ' + def.id);
    def.sub = def.sub || meta.sub || '';
    def.missions = def.missions || [];
    for (const m of def.missions) {
      if (!m) continue;
      if (m.side && m.token === undefined) m.token = false;        // side quests are not Burn Tokens unless they say so
      if (m.requires && !Array.isArray(m.requires)) {               // requires: { use: 'powder', missions: [...] }
        if (m.requires.use && !m.use) m.use = m.requires.use;
        m.requires = m.requires.missions || [];
      }
    }
    this.defs[def.id] = def;
    return def;
  },
  get(id) { return this.defs[id] || null; },
  meta(id) {
    const m = BURNS_WORLD_META.find(k => k.id === id) || { id, name: 'World ' + id, sub: '', hub: { x: 0.5, y: 0.5 }, col: '#ffffff' };
    const d = this.defs[id];   // a registered world's own name/sub/day win over the placeholder metadata
    return d ? Object.assign({}, m, { name: d.name || m.name, sub: d.sub || m.sub, day: d.day || m.day, dayShort: d.dayShort || (d.day && d.day !== m.day ? null : m.dayShort), home: d.home !== undefined ? !!d.home : m.home }) : m;
  },
  // day of the Burn week: 'Tuesday night' / 'TUE NIGHT'
  day(id) { return this.meta(id).day || ''; },
  dayShort(id) {
    const m = this.meta(id); if (m.dayShort) return m.dayShort;
    const d = String(m.day || '').toUpperCase(); if (!d) return '';
    const w = d.split(/[ ,]+/); return w[0].slice(0, 3) + (w[1] && /NIGHT|DAWN|AFTERNOON|MORNING/.test(w[1]) ? ' ' + (w[1] === 'AFTERNOON' ? 'PM' : w[1]) : '');
  },
  isHome(id) { return !!this.meta(id).home; },
  home() { const m = BURNS_WORLD_META.find(k => k.home); const reg = Object.keys(this.defs).map(Number).find(k => this.defs[k].home); return reg || (m ? m.id : null); },
  tokenTotal(id) { const d = this.defs[id]; return d ? d.missions.filter(m => m.token !== false).length : 6; },
  // ---- play order (BURNS_WORLD_ORDER) ----
  order: BURNS_WORLD_ORDER,
  num(id) { const i = this.order.indexOf(id); return i < 0 ? id : i + 1; },          // id -> "World N" position (1-based)
  idAt(n) { return this.order[n - 1] || null; },                                      // position -> id
  label(id) { return this.isSecret(id) ? 'Secret World' : 'World ' + this.num(id); },
  isSecret(id) { return !!BURNS_WORLD_SECRET[id]; },
  // ids the hub shows: the play order, minus secret worlds that are still locked
  visible() { const sv = BurnsSave.get(); return this.order.filter(id => !this.isSecret(id) || sv.unlocked[id]); },
  next(id) { const i = this.order.indexOf(id); return i >= 0 && i < this.order.length - 1 ? this.order[i + 1] : null; },
  prev(id) { const i = this.order.indexOf(id); return i > 0 ? this.order[i - 1] : null; },
  isFinale(id) { return id === 10; }
};

/* ---------------- costumes (geometry lives in 40_burns_d_rig.js) ---------------- */
const BURNS_COSTUMES = [
  { id: 'none', name: 'Classic Brady', desc: 'Black tee, black jeans, black heart.', col: '#2a2a34' },
  { id: 'furcoat', name: 'Furry Coat Rock Star', desc: 'Faux fur, real attitude.', col: '#ff8ad8' },
  { id: 'tutu', name: 'Tutu & Goggles', desc: 'Tulle for days. Goggles for dust.', col: '#ff9ad0' },
  { id: 'spaceman', name: 'LED Spaceman', desc: 'Visible from orbit.', col: '#38f2ff' },
  { id: 'unicorn', name: 'Unicorn Onesie', desc: 'Magical. Breathable-ish.', col: '#f4f0ff' },
  { id: 'pirate', name: 'Desert Pirate', desc: 'Arr, the playa be thirsty.', col: '#a0402a' },
  { id: 'disco', name: 'Disco-Ball Suit', desc: 'A thousand tiny suns.', col: '#d8e4ff' }
];

/* ---------------- power-ups (ground score) ---------------- */
// All pickups are cartoony labeled baggies / items. Nobody is ever shown using them.
const BURNS_POWERUPS = {
  molly: { name: 'LOVE BOMB', label: 'MOLLY', dur: 12, col: '#ff5fb8', sfx: 'molly', icon: 'heart', tip: 'Touch burners to turn them into friendly dancers!' },
  khole: { name: 'K-HOLE', label: 'KETAMINE', dur: 8, col: '#9a7bff', sfx: 'khole', icon: 'k', tip: 'Everything slows down. Except you.' },
  powder: { name: 'PARTY POWDER', label: 'PARTY POWDER', dur: 10, col: '#f4f4ff', sfx: 'powder', icon: 'flake', tip: 'Super speed! Super jumps! Super talking!' },
  lsd: { name: 'TRIP', label: 'LSD', dur: 15, col: '#38f2ff', sfx: 'lsd', icon: 'tab', tip: 'Hidden paths reveal themselves...' },
  shrooms: { name: 'GIANT', label: 'MUSHROOMS', dur: 10, col: '#ff7a2a', sfx: 'pickup_bag', icon: 'shroom', tip: 'You are HUGE. Stomp everything.' },
  weed: { name: 'FLOATY', label: 'WEED', dur: 12, col: '#7ad86a', sfx: 'pickup_bag', icon: 'leaf', tip: 'Hold JUMP to float like a balloon.' },
  bufo: { name: 'TOAD FLIGHT', label: 'BUFO', dur: 6, col: '#d8b040', sfx: 'pickup_bag', icon: 'toad', tip: 'Hold JUMP to fly!' },
  liquor: { name: 'PUKE BALLS', label: 'LIQUOR', dur: 16, col: '#7aff5a', sfx: 'pickup_bag', icon: 'bottle', ammo: 8, tip: 'ACTION throws bouncing puke balls.' },
  water: { name: 'HYDRATE', label: 'WATER', instant: true, heal: 2, col: '#5ad0ff', sfx: 'pickup_bag', icon: 'drop', tip: 'Hydrate or die-drate.' }
};
const BURNS_KEY_ITEMS = {
  ticket: { name: 'TICKET', desc: 'Your way through the gate.', col: '#ffd84a' },
  map: { name: 'PLAYA MAP', desc: 'Shows the minimap with markers.', col: '#7ad8ff' },
  www: { name: 'WHAT WHERE WHEN', desc: 'Lists missions and events on the map.', col: '#ff9ad8' },
  bike: { name: 'YELLOW BIKE', desc: 'Summon it with the BIKE button.', col: '#ffe24a' },
  costumes: { name: 'COSTUME TRUNK', desc: 'Change costumes from the hub.', col: '#ff4fd8' },
  artcar: { name: 'ART CAR KEYS', desc: 'You can drive art cars.', col: '#ff7a2a' }
};
const BURNS_HYDRATION_MAX = 6;
// camera modes (HUD VIEW button, V key, settings): normal third person, over-the-shoulder, first person, far
const BURNS_CAM_MODES = ['normal', 'close', 'first', 'far'];
const BURNS_CAM_LABELS = { normal: 'THIRD PERSON', close: 'CLOSE', first: 'FIRST PERSON', far: 'FAR' };

/* ---------------- the backpack: ground scores, quest items, trade goods ----------------
   Every power-up id is an item; worlds add more with BurnsPack.define(id, {name, desc, col, icon, kind, use(g)}).
   Counts live in Save.data.burns.pack (shared by all worlds). The play scene wraps this as g.pack. */
const BURNS_PACK_ITEMS = {};
const BurnsPack = {
  define(id, def) { BURNS_PACK_ITEMS[id] = Object.assign({ id }, def || {}); if (!BURNS_PACK_ITEMS[id].name) BURNS_PACK_ITEMS[id].name = String(id).toUpperCase(); return BURNS_PACK_ITEMS[id]; },
  get(id) {
    const d = BURNS_PACK_ITEMS[id]; if (d) return d;
    const P = BURNS_POWERUPS[id];
    if (P) return { id, name: P.name, label: P.label, desc: P.tip, col: P.col, icon: P.icon, power: id, kind: 'score' };
    return { id, name: String(id).toUpperCase(), desc: '', col: '#e8e0d0', kind: 'goods' };
  },
  isScore(id) { return !!BURNS_POWERUPS[id] && !BURNS_POWERUPS[id].instant; },   // ground scores (gated by the story flag)
  usable(id) { const d = this.get(id); return !!(d.use || d.power); },
  count(id) { return BurnsSave.get().pack[id] | 0; },
  total() { const p = BurnsSave.get().pack; let n = 0; for (const k in p) n += Math.max(0, p[k] | 0); return n; },
  add(id, n) { const p = BurnsSave.get().pack; p[id] = (p[id] | 0) + (n === undefined ? 1 : n | 0); if (p[id] <= 0) delete p[id]; BurnsSave.save(); return p[id] | 0; },
  take(id, n) { n = n === undefined ? 1 : n | 0; const p = BurnsSave.get().pack; if ((p[id] | 0) < n) return false; p[id] -= n; if (p[id] <= 0) delete p[id]; BurnsSave.save(); return true; },
  list() { const p = BurnsSave.get().pack; return Object.keys(p).filter(k => p[k] > 0).map(k => ({ id: k, n: p[k] | 0, def: this.get(k) })); }
};
BurnsPack.define('water', { name: 'WATER BOTTLE', desc: 'Saved for later. USE: +2 hydration.', col: '#5ad0ff', icon: 'drop', use(g) { g.player.givePower('water'); return true; } });

/* ---------------- goods: what rewards, gifts and trades hand over ----------------
   'molly' | {pack:'molly', n} | {pack:{molly:2}} | {glow:n} | {item:id} | {costume:id} | {power:id} | {heal:n}
   | {text} | {fn(g), text} | arrays of any of these. One object may combine keys: {glow: 10, pack: 'molly'}. */
const BurnsGoods = {
  list(goods) {
    const out = [];
    const one = gd => {
      if (gd === null || gd === undefined || gd === false) return;
      if (Array.isArray(gd)) { gd.forEach(one); return; }
      if (typeof gd === 'string') { out.push({ k: 'pack', id: gd, n: 1 }); return; }
      if (typeof gd !== 'object') return;
      if (gd.pack) { if (typeof gd.pack === 'string') out.push({ k: 'pack', id: gd.pack, n: Math.max(1, gd.n | 0) }); else for (const id in gd.pack) out.push({ k: 'pack', id, n: Math.max(1, gd.pack[id] | 0) }); }
      if (gd.glow) out.push({ k: 'glow', n: gd.glow | 0 });
      if (gd.item) out.push({ k: 'item', id: gd.item });
      if (gd.costume) out.push({ k: 'costume', id: gd.costume });
      if (gd.power) out.push({ k: 'power', id: gd.power });
      if (gd.heal) out.push({ k: 'heal', n: gd.heal | 0 });
      if (gd.fn) out.push({ k: 'fn', fn: gd.fn, text: gd.text });
      else if (gd.text) out.push({ k: 'text', text: gd.text });
    };
    one(goods);
    return out;
  },
  label(e) {
    switch (e.k) {
      case 'pack': return (e.n > 1 ? e.n + ' × ' : '') + BurnsPack.get(e.id).name;
      case 'glow': return e.n + ' GLOW STICK' + (e.n === 1 ? '' : 'S');
      case 'item': { const K = BURNS_KEY_ITEMS[e.id]; return K ? K.name : String(e.id).toUpperCase(); }
      case 'costume': { const c = BURNS_COSTUMES.find(k => k.id === e.id); return (c ? c.name : String(e.id)).toUpperCase() + ' COSTUME'; }
      case 'power': { const P = BURNS_POWERUPS[e.id]; return P ? P.name : String(e.id).toUpperCase(); }
      case 'heal': return '+' + e.n + ' HYDRATION';
      default: return e.text ? String(e.text).toUpperCase() : '';
    }
  },
  text(goods) { return this.list(goods).map(e => this.label(e)).filter(Boolean).join(' + '); },
  // what Brady can hand over: glow sticks he carries this visit + backpack items
  need(goods) { const n = { glow: 0, pack: {} }; for (const e of this.list(goods)) { if (e.k === 'glow') n.glow += e.n; else if (e.k === 'pack') n.pack[e.id] = (n.pack[e.id] || 0) + e.n; } return n; },
  canPay(g, goods) { const n = this.need(goods); if (n.glow > ((g && g.glow) || 0)) return false; for (const id in n.pack) if (BurnsPack.count(id) < n.pack[id]) return false; return true; },
  missing(g, goods) {
    const n = this.need(goods), out = [], have = (g && g.glow) || 0;
    if (n.glow > have) out.push((n.glow - have) + ' MORE GLOW STICK' + (n.glow - have === 1 ? '' : 'S'));
    for (const id in n.pack) { const c = BurnsPack.count(id); if (c < n.pack[id]) out.push((n.pack[id] - c > 1 ? (n.pack[id] - c) + ' × ' : '') + BurnsPack.get(id).name); }
    return out.join(' + ');
  },
  pay(g, goods) {
    if (!this.canPay(g, goods)) return false;
    const n = this.need(goods);
    if (n.glow && g) { if (g.spendGlow) g.spendGlow(n.glow); else g.glow -= n.glow; }
    for (const id in n.pack) BurnsPack.take(id, n.pack[id]);
    if (g && g.syncHudButtons) g.syncHudButtons();
    return true;
  },
  // give goods to Brady; returns the text of what he got. o: {quiet} (no toast)
  grant(g, goods, o) {
    o = o || {};
    const list = this.list(goods), sv = BurnsSave.get();
    for (const e of list) {
      if (e.k === 'pack') { if (g && g.pack) g.pack.add(e.id, e.n, { quiet: true }); else BurnsPack.add(e.id, e.n); }
      else if (e.k === 'glow') { if (g) g.glow += e.n; }
      else if (e.k === 'item') { if (g && g.giveItem) g.giveItem(e.id, true); else BurnsSave.addItem(e.id); }
      else if (e.k === 'costume') { sv.costumesOwned[e.id] = true; BurnsSave.save(); }
      else if (e.k === 'power') { if (g && g.player) g.player.givePower(e.id); }
      else if (e.k === 'heal') { if (g && g.player) g.player.heal(e.n); }
      else if (e.k === 'fn') { try { e.fn(g); } catch (err) { console.warn('burns: goods fn failed', err); } }
    }
    const txt = list.map(e => this.label(e)).filter(Boolean).join(' + ');
    if (!o.quiet && txt && g && g.toast) { g.toast('GOT: ' + txt); burnsSfx('gift', null, 'pick'); }
    return txt;
  }
};


/* ---------------- 2D helpers owned by the engine (the app ships without the 2D game) ---------------- */
function burnsRR(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
// buttons, panels and titles for the engine's menus (same look and behaviour as the shared UI kit)
const BurnsUIKit = {
  drawButton(ctx, b, focused) {
    ctx.save();
    const pressed = b._press > 0, y = b.y + (pressed ? 2 : 0);
    ctx.shadowColor = b.primary ? 'rgba(255,79,216,0.55)' : 'rgba(0,0,0,0.5)'; ctx.shadowBlur = b.primary ? 18 : 8; ctx.shadowOffsetY = pressed ? 1 : 4;
    const g = ctx.createLinearGradient(0, y, 0, y + b.h);
    if (b.primary) { g.addColorStop(0, '#ff6ae0'); g.addColorStop(1, '#a42ccf'); }
    else if (b.disabled) { g.addColorStop(0, '#3a3644'); g.addColorStop(1, '#24202e'); }
    else { g.addColorStop(0, '#3a3456'); g.addColorStop(1, '#1e1a30'); }
    ctx.fillStyle = g; burnsRR(ctx, b.x, y, b.w, b.h, Math.min(16, b.h / 2)); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = focused ? '#ffd84a' : b.primary ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = focused ? 2.5 : 1.2;
    burnsRR(ctx, b.x, y, b.w, b.h, Math.min(16, b.h / 2)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; burnsRR(ctx, b.x + 4, y + 3, b.w - 8, b.h * 0.38, Math.min(12, b.h / 3)); ctx.fill();
    ctx.fillStyle = b.disabled ? 'rgba(255,255,255,0.4)' : '#ffffff';
    ctx.font = `${b.size || Math.min(16, b.h * 0.36)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, y + b.h / 2 + 1);
    ctx.restore();
    if (b._press > 0) b._press -= 0.016;
  },
  drawButtons(ctx, list) { list.forEach((b, i) => this.drawButton(ctx, b, list.focus === i && !Input.usingTouch)); },
  hitButtons(list) {
    if (!list || !list.length) return null;
    for (const t of Input.taps) for (const b of list) if (!b.disabled && t.x >= b.x - 6 && t.x <= b.x + b.w + 6 && t.y >= b.y - 6 && t.y <= b.y + b.h + 6) { b._press = 0.12; return b; }
    const k = Input.uiKey;
    if (k) {
      if (list.focus === undefined) list.focus = 0;
      if (k === 'down' || k === 'right') { list.focus = (list.focus + 1) % list.length; burnsSfx('select', { vol: 0.4 }); }
      if (k === 'up' || k === 'left') { list.focus = (list.focus - 1 + list.length) % list.length; burnsSfx('select', { vol: 0.4 }); }
      if (k === 'enter') return list[list.focus];
    }
    if (Input.jumpPressed && list.focus !== undefined) return list[list.focus];
    return null;
  },
  panel(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(34,26,56,0.96)'); g.addColorStop(1, 'rgba(14,10,26,0.96)');
    ctx.fillStyle = g; burnsRR(ctx, x, y, w, h, 20); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.5; burnsRR(ctx, x, y, w, h, 20); ctx.stroke();
    ctx.restore();
  },
  title(ctx, text, x, y, size) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${size}px ${FONT_DISPLAY}`;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(text, x + 2, y + 3);
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd0f4');
    ctx.fillStyle = g; ctx.fillText(text, x, y); ctx.restore();
  }
};
