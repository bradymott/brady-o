/* ============================================================
   BRADY GOES TO BURNING MAN — shared kit for Worlds 5, 6 and 7 (BW567K)
   Everything here is an extension built on the public engine API:
     · shape helpers (one per shape) over the smooth BurnsMesh primitives
     · BW567Puppet: a rigid-skinned "entity" registered through g.addBoss()
       so custom animated models (tentacles, carts, drones, unicycles) draw
       in one call each and update every step without touching the engine
     · a 2D overlay hook (def.bw567Overlay) for minigame / choice UI
     · BW567K.choice(): a tap-to-pick dialogue choice (cutscene based)
     · game-time timers, a player speed modifier, small helpers
   ============================================================ */

const BW567K = {
  geoCache: {},
  /* ---------------- shapes (local mesh space; switch implementations here) ---------------- */
  // rounded box centred at (cx, cy, cz)
  rbox(m, cx, cy, cz, w, h, d, r, o) {
    if (m.roundBox) m.roundBox(cx, cy, cz, w, h, d, r === undefined ? Math.min(w, h, d) * 0.22 : r, o || {});
    else m.bbox(cx, cy, cz, w, h, d, r === undefined ? Math.min(w, h, d) * 0.2 : r, o || {});
    return m;
  },
  ball(m, x, y, z, r, o) { if (m.ellipsoid) m.ellipsoid(x, y, z, r, r, r, o || {}); else m.sphere(x, y, z, r, 10, 6, { smooth: true }); return m; },
  ellip(m, x, y, z, rx, ry, rz, o) {
    if (m.ellipsoid) m.ellipsoid(x, y, z, rx, ry, rz, o || {});
    else { m.push(); m.tf(x, y, z, 0, 0, 0, rx, ry, rz); m.sphere(0, 0, 0, 1, 10, 6, { smooth: true }); m.pop(); }
    return m;
  },
  // surface of revolution placed at (x, y, z); profile [[r, y, col?, e?], ...] bottom -> top
  lathe(m, x, y, z, prof, o) {
    m.push(); m.tf(x, y, z);
    if (m.lathe) m.lathe(prof, o || {});
    else for (let k = 0; k < prof.length - 1; k++) { const a = prof[k], b = prof[k + 1]; if (b[1] > a[1]) m.cyl(0, a[1], 0, a[0], b[0], b[1] - a[1], (o && o.seg) || 12, { smooth: true, caps: false }); }
    m.pop();
    return m;
  },
  // tapered capsule between two points
  limb(m, x0, y0, z0, x1, y1, z1, r0, r1, o) { if (m.limb) m.limb(x0, y0, z0, x1, y1, z1, r0, r1 === undefined ? r0 : r1, o || {}); else m.rod(x0, y0, z0, x1, y1, z1, r0, 8, { smooth: true }); return m; },
  // cylinder with rounded rims (y = bottom)
  rcyl(m, x, y, z, r, h, edge, o) { if (m.roundCyl) m.roundCyl(x, y, z, r, h, edge === undefined ? Math.min(r, h) * 0.2 : edge, o || {}); else m.cyl(x, y, z, r, r, h, 12, { smooth: true }); return m; },
  torus(m, x, y, z, R, r, o) { if (m.torus) m.torus(x, y, z, R, r, o || {}); else m.cyl(x, y - r, z, R + r, R + r, r * 2, 14, {}); return m; },
  // smooth tube along a polyline pts [[x,y,z]...] with radii rads[] (tip capped with a hemisphere)
  tube(m, pts, rads, o) {
    o = o || {};
    const n = pts.length, seg = o.seg || 9, capK = o.cap === false ? 0 : 3;
    if (n < 2 || !m.grid) { for (let i = 0; i < n - 1; i++) this.limb(m, pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], rads[i], rads[i + 1]); return m; }
    // parallel-transport frames
    const T = [], N = [], B = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; T.push([tx / l, ty / l, tz / l]);
    }
    const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    let up = Math.abs(T[0][1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    N.push(norm(cross(cross(T[0], up), T[0]))); B.push(norm(cross(T[0], N[0])));
    for (let i = 1; i < n; i++) { const b0 = cross(T[i], N[i - 1]); const ni = norm(cross(b0, T[i])); N.push(ni); B.push(norm(cross(T[i], ni))); }
    const rows = n + capK, last = n - 1;
    m.grid(seg, rows, true, (i, j, out) => {
      const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a);
      if (j < n) {
        const r = rads[j], P = pts[j];
        const nx = ca * N[j][0] + sa * B[j][0], ny = ca * N[j][1] + sa * B[j][1], nz = ca * N[j][2] + sa * B[j][2];
        out.p[0] = P[0] + nx * r; out.p[1] = P[1] + ny * r; out.p[2] = P[2] + nz * r; out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
      } else {
        const k = j - n + 1, ph = k / capK * Math.PI / 2, r = rads[last] * Math.cos(ph), P = pts[last], t = T[last], ad = rads[last] * Math.sin(ph);
        const rx = ca * N[last][0] + sa * B[last][0], ry = ca * N[last][1] + sa * B[last][1], rz = ca * N[last][2] + sa * B[last][2];
        out.p[0] = P[0] + t[0] * ad + rx * r; out.p[1] = P[1] + t[1] * ad + ry * r; out.p[2] = P[2] + t[2] * ad + rz * r;
        const nx = rx * Math.cos(ph) + t[0] * Math.sin(ph), ny = ry * Math.cos(ph) + t[1] * Math.sin(ph), nz = rz * Math.cos(ph) + t[2] * Math.sin(ph);
        out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
      }
      if (o.colFn) { const c = o.colFn(i, j, a); if (c) out.col = burnsRGB(c); }
    });
    return m;
  },
  // classic heart outline (CCW), unit height ~1, centred near the origin
  heartOutline(n) {
    const pts = []; n = n || 40;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pts.push([x / 32, (y + 3) / 30]); }
    return pts.reverse();
  },
  // puffy extrusion of a 2D outline (XY plane, CCW) centred on z = 0, thickness depth, facing +Z
  pillow(m, outline, depth, o) {
    o = o || {};
    const n = outline.length, rr = depth / 2, K = o.rings || 6;
    // outward 2D normals (averaged, mitred, clamped)
    const nrm = [];
    for (let i = 0; i < n; i++) {
      const a = outline[(i + n - 1) % n], p = outline[i], b = outline[(i + 1) % n];
      const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]];
      const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
      const n1 = [e1[1] / l1, -e1[0] / l1], n2 = [e2[1] / l2, -e2[0] / l2];
      let nx = n1[0] + n2[0], ny = n1[1] + n2[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const mit = clamp(1 / Math.max(0.35, nx * n1[0] + ny * n1[1]), 1, 1.8);
      nrm.push([nx, ny, mit]);
    }
    const inset = o.inset === undefined ? rr : o.inset;
    m.grid(n, K + 1, true, (i, j, out) => {
      const ph = -Math.PI / 2 + j / K * Math.PI, c = Math.cos(ph), s = Math.sin(ph), N = nrm[i], P = outline[i];
      const k = inset * (1 - c) * N[2];
      out.p[0] = P[0] - N[0] * k; out.p[1] = P[1] - N[1] * k; out.p[2] = rr * s;
      out.n[0] = N[0] * c; out.n[1] = N[1] * c; out.n[2] = s;
      if (o.colFn) { const cc = o.colFn(i, j, s); if (cc) out.col = burnsRGB(cc); }
    });
    // flat caps (front + back)
    const capPts = outline.map((P, i) => [P[0] - nrm[i][0] * inset * nrm[i][2], P[1] - nrm[i][1] * inset * nrm[i][2]]);
    let cx = 0, cy = 0; for (const p of capPts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
    const col0 = m.c;
    if (o.capCol) m.c = burnsRGB(o.capCol);
    for (const tri of BurnsMesh.earcut(capPts)) {
      m.poly(tri.map(i => [capPts[i][0], capPts[i][1], rr]), null, [cx, cy, -1e3]);
      m.poly(tri.map(i => [capPts[i][0], capPts[i][1], -rr]), null, [cx, cy, 1e3]);
    }
    m.c = col0;
    return m;
  },
  /* ---------------- world placement (with colliders) ---------------- */
  // rounded platform box, y = bottom (falls back to a bevelled box)
  rb(api, x, y, z, w, h, d, col, o) {
    o = o || {};
    if (api.roundBox) return api.roundBox(x, y, z, w, h, d, col, o);
    return api.box(x, y, z, w, h, d, col, Object.assign({ bevel: Math.min(w, h, d) * 0.2 }, o));
  },
  // rounded post / pillar
  post(api, x, y, z, r, h, col, o) {
    o = o || {};
    if (api.cylinder) return api.cylinder(x, y, z, r, h, col, o);
    return api.mesh(x, z, m => { m.color(col, o.e || 0); m.cyl(0, 0, 0, r, r, h, 10, { smooth: true }); m.emissive(0); return { cols: o.noCol ? [] : [{ t: 'cyl', x: 0, z: 0, r, y0: 0, y1: h }] }; }, { y });
  },
  ballAt(api, x, y, z, r, col, o) {
    o = o || {};
    if (api.sphere) return api.sphere(x, y, z, r, col, o);
    return api.mesh(x, z, m => { m.color(col, o.e || 0); m.sphere(0, r, 0, r, 10, 6, { smooth: true }); m.emissive(0); return { cols: o.noCol ? [] : [{ t: 'dome', x: 0, z: 0, r, y0: r }] }; }, { y });
  },
  /* ---------------- runtime helpers ---------------- */
  // game-time timers (pause with the game). Call BW567K.tick(g, dt) from the world update.
  after(g, sec, fn) { (g.bw567timers || (g.bw567timers = [])).push({ t: sec, fn }); },
  tick(g, dt) {
    if (g.bw567rhythm) BW567K.rhythmStep(g, dt);
    const L = g.bw567timers; if (!L || !L.length) return;
    for (const t of L.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(g); } catch (e) { Game.reportError ? Game.reportError(e) : console.error(e); } } }
    g.bw567timers = L.filter(t => !t.done);
  },
  // player speed multiplier (g.bw567speed, 1 = normal) layered over the engine's own
  speedHook(g) {
    const p = g.player; if (!p || p.bw567speedHooked) return;
    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(p), 'speedMul');
    if (!desc || !desc.get) return;
    Object.defineProperty(p, 'speedMul', { configurable: true, get() { return desc.get.call(this) * (g.bw567speed === undefined ? 1 : g.bw567speed); } });
    p.bw567speedHooked = true;
  },
  // a boss-bar wrapper for an actor-based (sub)boss
  bar(name, a, maxHp, extra) {
    const b = { name, maxHp, active: true, head() { return [a.x, a.y + a.h * 1.05, a.z]; }, update() {} };
    Object.defineProperty(b, 'hp', { get() { return Math.max(0, a.hp); }, enumerable: true, configurable: true });
    Object.defineProperty(b, 'defeated', { get() { return a.defeated; }, enumerable: true, configurable: true });
    Object.defineProperty(b, 'st', { get() { return a.data && a.data.mode; }, enumerable: true, configurable: true });
    if (extra) Object.defineProperties(b, Object.getOwnPropertyDescriptors(extra));
    return b;
  },
  /* ---------------- character looks (user's archetypes + action figures) ----------------
     who(type, seed, extra): the engine's own spec when it knows the type (it adds chatter lines
     for new types), otherwise a stand-in with matching colours and gear. Swap point for later. */
  engineKnows(type) {
    try { if (typeof BURNS_NPC_TYPES !== 'undefined' && BURNS_NPC_TYPES) return Array.isArray(BURNS_NPC_TYPES) ? BURNS_NPC_TYPES.indexOf(type) >= 0 : !!BURNS_NPC_TYPES[type]; } catch (e) { /* not there yet */ }
    try { if (BurnsRig.types) return !!(Array.isArray(BurnsRig.types) ? BurnsRig.types.indexOf(type) >= 0 : BurnsRig.types[type]); } catch (e) { /* ignore */ }
    return typeof BURNS_LINES !== 'undefined' && !!BURNS_LINES[type];
  },
  who(type, seed, extra) {
    const s = this.engineKnows(type) ? BurnsRig.npcSpec(type, seed || 0) : this.standIn(type, seed || 0);
    if (extra) Object.assign(s, extra);
    s.key = 'bw567:' + type + ':' + (seed || 0) + (extra ? ':' + hashStr(JSON.stringify(extra)) : '');
    return s;
  },
  // my own characters: a custom look on a (non-figure) base type, clearing figure-only fields
  mine(base, seed, extra) {
    const s = BurnsRig.npcSpec(base, seed || 0);
    Object.assign(s, { beard: null, goggles: false, hat: null, glasses: null, coat: null, vest: null, led: null, paint: null, prop: null, acc: [], gear: null }, extra || {});
    s.key = (extra && extra.key) || ('bw567mine:' + base + ':' + (seed || 0) + ':' + hashStr(JSON.stringify(extra || {})));
    return s;
  },
  standIn(type, seed) {
    const b = BurnsRig.npcSpec(type === 'crusty' || type === 'sparklepony' || type === 'techbro' ? type : 'burner', seed);
    const r = mulberry32(hashStr('si:' + type + ':' + seed));
    const S = Object.assign(b, { kind: type, acc: [], hat: null, goggles: false, glasses: null, coat: null, vest: null, led: null, paint: null, prop: null });
    switch (type) {
      case 'furry': Object.assign(S, { skin: '#b0a48e', skinSh: '#8e8270', face: 'kid', hair: { style: 'mohawk', col: '#ff4fd8', hi: '#38f2ff' }, seed: 7 * Math.floor(seed / 7 + 1),
        top: { kind: 'tee', col: '#f4f0e8' }, coat: { kind: 'fur', col: r.pick(['#a8987e', '#b8a890', '#9a8c78']), trim: '#ffffff' }, bottom: { kind: 'leggings', col: '#9a8c78', pattern: 'rainbow' },
        shoes: { kind: 'furboots', col: '#7a6c5a' }, acc: ['ledNecklace', 'bracelets'], body: { h: 1.0, w: 1.22 } }); break;
      case 'darkwad': Object.assign(S, { face: 'smug', glasses: 'shades', hair: { style: 'short', col: '#141418', hi: '#26262c' }, top: { kind: 'hoodie', col: '#121216' }, bottom: { kind: 'cargo', col: '#141418' }, shoes: { kind: 'sneakers', col: '#5a5a62', sole: '#3a3a40' }, acc: ['toolbelt'] }); break;
      case 'badideaguy': Object.assign(S, { face: 'goofy', goggles: true, hair: { style: 'buzz', col: '#4a3424' }, top: { kind: 'tank', col: '#f4f4f0' }, bottom: { kind: 'shorts', col: '#7a5a3a' }, shoes: { kind: 'boots', col: '#9a7a5a' }, acc: ['toolbelt', 'bracelets'] }); break;
      case 'undercovercop': Object.assign(S, { face: 'stern', glasses: 'shades', hair: { style: 'buzz', col: '#3a2a1a' }, top: { kind: 'button', col: '#ff8a2a', pattern: 'tiedye' }, vest: 'fleece', vestCol: '#16161c', bottom: { kind: 'shorts', col: '#c8b48a' }, shoes: { kind: 'sneakers', col: '#f4f4f4', sole: '#d8d8d8' }, prop: 'radio', acc: ['bracelets'], body: { h: 1.02, w: 1.15 } }); break;
      case 'crusty': Object.assign(S, { face: 'beard', goggles: true, hair: { style: 'afro', col: '#b8b4ac', hi: '#e0dcd4' }, skin: '#b88a64', skinSh: '#946a4a', top: { kind: 'tee', col: '#3a3438' }, coat: { kind: 'duster', col: '#7a5434', trim: '#efe2c8' }, bottom: { kind: 'cargo', col: '#6a6a50' }, shoes: { kind: 'boots', col: '#7a5a3a' }, acc: ['toolbelt', 'bracelets'], prop: 'bottle' }); break;
      case 'greeter_f': Object.assign(S, { face: 'greeter', hat: { kind: 'cowboy', col: '#ff4fa8' }, glasses: 'heart', hair: { style: 'long', col: '#2a1a14', hi: '#8a5a3a' }, top: { kind: 'crop', col: '#38c8c8', pattern: 'sequin' }, bottom: { kind: 'tutu', col: '#9aff5a' }, shoes: { kind: 'sneakers', col: '#ff7ad8', sole: '#ffffff' }, acc: ['lei', 'bracelets'], prop: 'bell' }); break;
      case 'greeter_m': Object.assign(S, { face: 'beard', hat: { kind: 'cowboy', col: '#d8c08a' }, glasses: 'shades', top: { kind: 'button', col: '#ff8a2a', pattern: 'tiedye' }, bottom: { kind: 'shorts', col: '#ff4fa8' }, shoes: { kind: 'sneakers', col: '#7aff5a', sole: '#ffffff' }, acc: ['lei', 'bracelets'], prop: 'bell' }); break;
      case 'billionaire': Object.assign(S, { face: 'smug', glasses: 'shades', goggles: true, hair: { style: 'short', col: '#c8a060', hi: '#f0d8a0' }, top: { kind: 'button', col: '#ffffff' }, coat: { kind: 'kimono', col: '#f8f6f0', trim: '#e8c860' }, bottom: { kind: 'chinos', col: '#f4f2ec' }, shoes: { kind: 'sneakers', col: '#ffffff', sole: '#e8c860' }, acc: ['bracelets'], body: { h: 1.04, w: 1.0 } }); break;
      case 'techbro': Object.assign(S, { face: 'smug', glasses: 'clear', hair: { style: 'short', col: '#3a2a1a' }, top: { kind: 'button', col: '#9ac0e8' }, vest: 'patches', bottom: { kind: 'chinos', col: '#c8b48a' }, shoes: { kind: 'sneakers', col: '#f4f4f4', sole: '#e0e0e0' }, acc: ['earbuds', 'bracelets'], prop: 'phone' }); break;
      case 'burnerkid': Object.assign(S, { face: 'kid', hat: { kind: 'furhat', col: '#38c8c8' }, glasses: 'shades', top: { kind: 'none' }, paint: 'rainbow', bottom: { kind: 'cargo', col: '#c8a878' }, shoes: { kind: 'furboots', col: '#ff9ad0' }, acc: ['ledNecklace', 'bracelets', 'lei'], body: { h: 0.92, w: 0.9 } }); break;
      case 'burnermom': Object.assign(S, { face: 'greeter', hair: { style: 'bun', col: '#c8c8d0', hi: '#ffffff' }, hat: { kind: 'cowboy', col: '#e8d8a8' }, glasses: 'clear', top: { kind: 'button', col: '#ff9ac8' }, vest: 'fleece', vestCol: '#5aa05a', bottom: { kind: 'jeans', col: '#6a8ac8' }, shoes: { kind: 'sneakers', col: '#f4f4f4' }, acc: ['lei', 'bracelets'], prop: 'phone', body: { h: 0.94, w: 1.05 } }); break;
      case 'annoyingdj': Object.assign(S, { face: 'goofy', hair: { style: 'short', col: '#121216', hi: '#3a3a44' }, goggles: true, glasses: 'shades', top: { kind: 'button', col: '#ff6ad0', pattern: 'tiedye' }, bottom: { kind: 'shorts', col: '#9aff3a' }, shoes: { kind: 'sneakers', col: '#38c8c8' }, acc: ['headset', 'ledNecklace', 'bracelets'] }); break;
      case 'burney': Object.assign(S, { face: 'beard', hair: { style: 'bald', col: '#3a6aff' }, hat: { kind: 'cowboy', col: '#d8c08a' }, top: { kind: 'button', col: '#2ab8a8', pattern: 'tiedye' }, vest: 'patches', bottom: { kind: 'shorts', col: '#c8b48a' }, shoes: { kind: 'boots', col: '#3a2a1a' }, tattoos: true, acc: ['bracelets', 'ledNecklace'], prop: 'phone', body: { h: 1.0, w: 1.15 } }); break;
      case 'partiedtoohard': Object.assign(S, { face: 'tired', hair: { style: 'long', col: '#8a8478', hi: '#b8b2a8' }, top: { kind: 'button', col: '#e8b8d8', pattern: 'tiedye' }, bottom: { kind: 'cargo', col: '#7a6a5a' }, shoes: { kind: 'boots', col: '#6a5040' }, acc: ['ledNecklace', 'bracelets', 'lei'] }); break;
      case 'sherpa': Object.assign(S, { face: 'tired', hat: { kind: 'cap', col: '#4a5a3a' }, top: { kind: 'tee', col: '#7a8a5a' }, bottom: { kind: 'cargo', col: '#5a5a40' }, shoes: { kind: 'boots', col: '#3a2a1a' }, acc: ['toolbelt'] }); break;
      case 'security': Object.assign(S, { face: 'stern', glasses: 'shades', hat: { kind: 'cap', col: '#111114' }, top: { kind: 'tee', col: '#141418' }, bottom: { kind: 'cargo', col: '#1e1e24' }, shoes: { kind: 'boots', col: '#111114' }, prop: 'radio', body: { h: 1.06, w: 1.3 } }); break;
      default: break;
    }
    return S;
  },
  // accessory meshes in bone space (head bone origin = neck joint; face at +z)
  acc(m, kind, o) {
    o = o || {};
    if (kind === 'mask') { m.color(o.col || '#f4ecd8').shine(1); m.push(); m.tf(0, 0.1, 0.12, 0, -0.1); BW567K.ellip(m, 0, 0, 0.02, 0.15, 0.09, 0.08, { seg: 10, rings: 6, theta0: -1.5, theta1: 1.5 }); m.pop(); m.shine(0); return; }
    if (kind === 'panama') { m.color(o.col || '#f4ecd8'); BW567K.lathe(m, 0, 0.36, 0, [[0, 0], [0.34, 0.01], [0.34, 0.035], [0.2, 0.04], [0.19, 0.17], [0, 0.19]], { seg: 14 }); m.color('#2a2a30'); BW567K.lathe(m, 0, 0.4, 0, [[0.196, 0], [0.196, 0.04]], { seg: 14 }); return; }
    if (kind === 'ears') { for (const sx of [-1, 1]) { m.color(o.col || '#a8987e'); m.push(); m.tf(sx * 0.13, 0.4, -0.02, 0, 0, -sx * 0.25); BW567K.lathe(m, 0, 0, 0, [[0.09, 0], [0.07, 0.12], [0, 0.26]], { seg: 6, sz: 0.45 }); m.color('#ff4fa8'); m.push(); m.tf(0, 0.02, 0.025); BW567K.lathe(m, 0, 0, 0, [[0.055, 0], [0.04, 0.1], [0, 0.2]], { seg: 6, sz: 0.3 }); m.pop(); m.pop(); } return; }
    if (kind === 'tail') { m.color(o.col || '#a8987e'); BW567K.tube(m, [[0, 0, 0], [0, -0.1, -0.2], [0, -0.05, -0.45], [0, 0.12, -0.62]], [0.09, 0.11, 0.09, 0.05], { seg: 7 }); m.color('#ffffff'); BW567K.ball(m, 0, 0.13, -0.64, 0.07, { seg: 6, rings: 4 }); return; }
    if (kind === 'jester') { const cs = ['#ff4fd8', '#38f2ff', '#ffe24a']; m.color('#7aff5a'); BW567K.lathe(m, 0, 0.33, -0.01, [[0.2, 0], [0.2, 0.06], [0, 0.09]], { seg: 10 }); for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.9; m.color(cs[i]); BW567K.tube(m, [[0, 0.38, 0], [Math.sin(a) * 0.12, 0.5, Math.cos(a) * 0.04 - 0.02], [Math.sin(a) * 0.3, 0.52, -0.06], [Math.sin(a) * 0.38, 0.38, -0.1]], [0.1, 0.07, 0.04, 0.02], { seg: 6 }); m.color('#ffd84a', 0.3).shine(3); BW567K.ball(m, Math.sin(a) * 0.38, 0.35, -0.1, 0.04, { seg: 6, rings: 4 }); m.emissive(0).shine(0); } return; }
    if (kind === 'medallion') { m.color('#e8c040', 0.15).shine(3); BW567K.torus(m, 0, 0.42, 0.06, 0.13, 0.012, { seg: 12, tseg: 4 }); m.push(); m.tf(0, 0.3, 0.15, 0, Math.PI / 2); BW567K.rcyl(m, 0, -0.01, 0, 0.06, 0.02, 0.01); m.pop(); m.emissive(0).shine(0); return; }
    if (kind === 'purifier') { m.color('#e8eef4').shine(2); BW567K.rbox(m, 0, 0.42, 0.15, 0.16, 0.1, 0.06, 0.03); m.color('#38f2ff', 0.9); BW567K.torus(m, 0, 0.42, 0.185, 0.035, 0.008, { seg: 10, tseg: 4 }); m.emissive(0).shine(0); return; }
    if (kind === 'cast') { m.color('#f8f8f4'); BW567K.limb(m, 0, -0.02, 0, 0, -0.22, 0, 0.075, 0.068); return; }
    if (kind === 'greetsign') { m.color('#8a6a3a'); BW567K.limb(m, 0, -0.05, 0.05, 0, 0.55, 0.05, 0.015); m.color('#d8b078'); BW567K.rbox(m, 0, 0.62, 0.05, 0.34, 0.16, 0.03, 0.01); const reg = BURNS_ATLAS.sign('GREETER', { bg: '#d8b078', fg: '#5a2a10', size: 30, pad: 4 }); m.color('#ffffff'); m.decal(0, 0.62, 0.067, 0.3, 0.3 / reg.aspect, reg); m.push(); m.tf(0, 0, 0.1, Math.PI); m.decal(0, 0.62, 0.067, 0.3, 0.3 / reg.aspect, reg); m.pop(); return; }
  },
  // monumental art from 41_burns_bigart.js (guarded: returns null when the module isn't loaded)
  bigArt(api, g, kind, x, z, o) {
    if (typeof BurnsBigArt === 'undefined' || !BurnsBigArt || !BurnsBigArt.place || !BurnsBigArt.kinds || !BurnsBigArt.kinds[kind]) return null;
    try { return BurnsBigArt.place(api, g, kind, x, z, o || {}) || {}; } catch (e) { if (Game.reportError) Game.reportError(e); return null; }
  },
  // build-time guard: make sure every actor in this world has a buildable look (falls back to a stand-in
  // if the engine's spec for a type throws), so a half-finished engine type can never block a world from loading
  sanitizeActors(api) {
    const W = api.world;
    for (const d of W.actorDefs) {
      if (d.model) continue;
      try { const spec = d.spec || (d.type === 'chinka' ? BurnsRig.chinkaSpec() : d.type === 'brady' ? BurnsRig.bradySpec('none') : BurnsRig.npcSpec(d.type || 'burner', d.seed || 0)); BurnsRig.model(spec); continue; } catch (e) { /* fall back */ }
      try { const s2 = this.standIn(d.type || 'burner', d.seed || 0); s2.key = 'bw567safe:' + (d.type || 'burner') + ':' + (d.seed || 0); BurnsRig.model(s2); d.spec = s2; continue; } catch (e) { /* plainer */ }
      const s3 = { kind: 'burner', skin: '#d8a880', hair: { style: 'short', col: '#3a2a1a' }, face: 'friendly', top: { kind: 'tee', col: '#ff4fd8' }, bottom: { kind: 'shorts', col: '#2a2a34' }, shoes: { kind: 'sneakers', col: '#2a2a2a' }, acc: [], key: 'bw567plain' };
      try { BurnsRig.model(s3); d.spec = s3; } catch (e) { d.spec = s3; }
    }
  },
  // cached skinned geometry: build(m) once per session
  geo(key, build) {
    // rebuilt once per world visit: decals point into the per-world sign atlas, which resets every visit
    const scene = (typeof Game !== 'undefined' && Game.scene) || null;
    let E = this.geoCache[key];
    if (E && E.scene === scene && E.atlasGen === BURNS_ATLAS.signGen) return E.geo;
    if (E && E.geo) { try { BurnsGL.freeGeo(E.geo); } catch (e) { /* ignore */ } }
    const m = new BurnsMesh(4096); build(m);
    E = { geo: m.geo(), scene, atlasGen: BURNS_ATLAS.signGen };
    this.geoCache[key] = E;
    return E.geo;
  },
  hurtNear(g, x, y, z, r, dmg, kb) {
    const p = g.player; if (p.dead) return false;
    if (Math.hypot(p.x - x, p.z - z) < r + p.r && p.y < y + 1.4 && p.y + p.h > y - 0.2) return p.hurt(dmg || 1, x, z, kb || 7);
    return false;
  },
  /* ---------------- dialogue choices ---------------- */
  // o: { who, prompt, options: [text...], def (index used on SKIP), done(g, i), cam }
  choice(g, o) {
    const st = { o, picked: null, focus: 0, t: 0, btns: [] };
    const steps = [];
    if (o.cam) steps.push({ cam: o.cam });
    steps.push({ do: g2 => { g2.bw567choice = st; } });
    steps.push({ until: g2 => { st.t += 1 / 120; return BW567K.choiceStep(g2, st); } });
    steps.push({ do: g2 => { g2.bw567choice = null; const i = st.picked === null ? (o.def || 0) : st.picked; BW567K.after(g2, 0.02, g3 => { if (o.done) o.done(g3, i); }); } });
    g.cutscene(steps, null, { letterbox: true });
    return st;
  },
  choiceStep(g, st) {
    if (st.t < 0.3) return false;
    const n = st.o.options.length;
    for (const t of Input.taps) for (const b of st.btns) if (t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h) { st.picked = b.i; burnsSfx('select'); return true; }
    const k = Input.uiKey;
    if (k === 'up' || k === 'left') { st.focus = (st.focus + n - 1) % n; burnsSfx('select', { vol: 0.4 }); }
    if (k === 'down' || k === 'right') { st.focus = (st.focus + 1) % n; burnsSfx('select', { vol: 0.4 }); }
    if (k === 'enter' || Input.jumpPressed || Input.actionPressed) { st.picked = st.focus; burnsSfx('select'); return true; }
    if (st.forced !== undefined) { st.picked = st.forced; return true; }
    return false;
  },
  drawChoice(ctx, g) {
    const st = g.bw567choice; if (!st || !g.cine) return;
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), o = st.o, n = o.options.length, portrait = H > W;
    const a = clamp(st.t / 0.25, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const pw = Math.min(W - S.l - S.r - 8, portrait ? 520 : 760);
    const px = (W - pw) / 2;
    ctx.font = `600 ${portrait ? 13 : 14}px ${FONT_UI}`;
    const lines = BurnsUI.wrap(ctx, o.prompt || '', pw - 36);
    const bh = portrait ? 44 : 40, gap = 8;
    const optW = portrait ? pw - 24 : (pw - 24 - gap * (n - 1)) / n;
    const optH = portrait ? bh : Math.max(bh, 46);
    const ph = 22 + lines.length * 18 + 12 + (portrait ? n * (optH + gap) : optH) + 14 + (o.who ? 16 : 0);
    const py = H - S.b - ph - H * 0.11;
    ctx.fillStyle = 'rgba(14,6,28,0.88)'; burnsRR(ctx, px, py, pw, ph, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    let y = py + 20;
    if (o.who) { BurnsUI.text(ctx, o.who, px + 18, y, 12, '#ffd84a', { align: 'left' }); y += 18; }
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const l of lines) { ctx.fillText(l, px + 18, y); y += 18; }
    y += 6;
    st.btns = [];
    for (let i = 0; i < n; i++) {
      const bx = portrait ? px + 12 : px + 12 + i * (optW + gap), by = portrait ? y + i * (optH + gap) : y;
      const foc = st.focus === i;
      ctx.fillStyle = foc ? 'rgba(255,79,216,0.45)' : 'rgba(255,255,255,0.1)'; burnsRR(ctx, bx, by, optW, optH, 12); ctx.fill();
      ctx.strokeStyle = foc ? '#ff9ad8' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = foc ? 2.5 : 1.2; ctx.stroke();
      ctx.font = `600 12px ${FONT_UI}`;
      const ol = BurnsUI.wrap(ctx, o.options[i], optW - 20).slice(0, 2);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ol.forEach((l, k) => ctx.fillText(l, bx + optW / 2, by + optH / 2 + (k - (ol.length - 1) / 2) * 15));
      st.btns.push({ x: bx, y: by, w: optW, h: optH, i });
    }
    ctx.restore();
  }
};

/* ---------------- 2D overlay hook: worlds may define def.bw567Overlay(ctx, g, fdt) ---------------- */
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    prev.call(this, ctx, g, fdt);
    if (!g || g.state !== 'play' || g.paused) return;
    try {
      if (g.bw567choice) BW567K.drawChoice(ctx, g);
      const d = g.def; if (d && d.bw567Overlay) d.bw567Overlay(ctx, g, fdt);
    } catch (e) { if (Game.reportError) Game.reportError(e); }
  };
})();

/* ---------------- rigid-skinned entity (drawn by the engine's boss pass) ----------------
   geo: BurnsMesh geometry whose vertices use bones 0..n-1. Pose with set()/child()/off().
   Register with g.addBoss(puppet). Optional: puppet.tick(dt) logic, puppet.sprites(R). */
class BW567Puppet {
  constructor(g, geo, n, o) {
    this.g = g; this.n = n; this.model = { geo }; this.ch = { bones: new Float32Array(n * 12), nb: n, face: 0 };
    this.hidden = false; this.t = 0; this._m = new Float32Array(12); this.o = o || {};
    for (let i = 0; i < n; i++) this.off(i);
  }
  set(i, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this.ch.bones, i * 12, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); return this; }
  // bones[i] = P[pk..] * TRS (hierarchies: tentacle segments, wheels)
  child(i, P, pk, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this._m, 0, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); BurnsM.a34Mul(this.ch.bones, i * 12, P, pk, this._m, 0); return this; }
  off(i) { const B = this.ch.bones, k = i * 12; B.fill(0, k, k + 12); B[k + 7] = -999; return this; }
  update(dt) { this.t += dt; if (this.tick) this.tick(dt); }
  draw(R) { if (this.sprites) this.sprites(R); }
}

/* ---------------- accessories glued to character bones (masks, hats, gadgets) ----------------
   geo built with one bone per accessory slot. attach(i, who, bone, x, y, z, yaw, pitch, roll, s)
   who: actor | 'player' | () => actor. Posed right before the engine draws it, from the bones the
   character was just drawn with, so it never lags; hidden when its wearer wasn't drawn. */
class BW567Attach extends BW567Puppet {
  constructor(g, geo, n) {
    super(g, geo, n);
    this.items = []; this._frame = -1; this._ch = this.ch;
    Object.defineProperty(this, 'ch', { configurable: true, get() { this.sync(); return this._ch; } });
  }
  attach(i, who, bone, x, y, z, yaw, pitch, roll, s) { this.items[i] = { who, bone, x: x || 0, y: y || 0, z: z || 0, yaw: yaw || 0, pitch: pitch || 0, roll: roll || 0, s: s || 1, on: true }; return this.items[i]; }
  sync() {
    const g = this.g; if (this._frame === g.frameN) return; this._frame = g.frameN;
    for (let i = 0; i < this.n; i++) {
      const it = this.items[i];
      if (!it || !it.on) { this.off(i); continue; }
      let a = typeof it.who === 'function' ? it.who() : it.who;
      if (a === 'player') a = g.player;
      const isP = a === g.player;
      if (!a || a.removed || a.hidden || (!isP && !a._vis) || !a.ch || !a.ch.bones) { this.off(i); continue; }
      BurnsM.a34Set(this._m, 0, it.x, it.y, it.z, it.yaw, it.pitch, it.roll, it.s, it.s, it.s);
      BurnsM.a34Mul(this._ch.bones, i * 12, a.ch.bones, it.bone * 12, this._m, 0);
    }
  }
}

/* ---------------- camera override (frame the DJ decks / dance floor without a cutscene) ---------------- */
BW567K.camHook = function (g) {
  if (g.bw567camHooked) return; g.bw567camHooked = true;
  const orig = g.updateCamera.bind(g);
  g.updateCamera = function (fdt) {
    const c0 = g.bw567cam;
    if (c0 && !(g.cine && g.cine.cam)) { const c = typeof c0 === 'function' ? c0(g) : c0; Object.assign(g.cam, c); g.cam.shift = Game.cssH > Game.cssW ? 0.08 : 0; g.cam.roll = 0; g.cam.near = 0.15; g.cam.far = 1500; return; }
    return orig(fdt);
  };
};

/* ---------------- tap-on-the-beat minigame (fallback for BurnsDJ; W7 dance-off) ----------------
   BW567K.rhythm(g, { title, bpm, duration, difficulty 0..1, crowd, cam, anim, onDone(result) })
   result: { score 0..1, grade 'S'|'A'|'B'|'C'|'D', crowdPeak, perfects, hits, total }
   Runs in game mode (presses register on touch-down): JUMP = ▲ lane, ACTION = ◉ lane. */
BW567K.rhythm = function (g, o) {
  o = o || {};
  const bpm = o.bpm || 124, beat = 60 / bpm, dur = o.duration || 20, diff = clamp(o.difficulty === undefined ? 0.5 : o.difficulty, 0, 1);
  const rng = mulberry32(hashStr((o.title || 'set') + ':' + Math.floor(Math.random() * 1e6)));
  const notes = [], lead = beat * 4;
  for (let t = lead, i = 0; t < lead + dur; t += beat / 2, i++) {
    const onBeat = i % 2 === 0, bar = Math.floor(i / 8);
    const p = onBeat ? 0.42 + diff * 0.35 : (diff > 0.35 ? 0.08 + diff * 0.22 : 0);
    if (rng() > p) continue;
    const last = notes[notes.length - 1];
    if (last && t - last.t < (diff > 0.6 ? beat / 2 - 0.01 : beat - 0.01)) continue;
    const lane = last && rng() < 0.55 ? last.lane : (bar + i) % 3 === 0 ? 1 - (last ? last.lane : 0) : Math.floor(rng() * 2);
    notes.push({ t, lane, res: null });
  }
  const p = g.player;
  const st = { o, bpm, beat, dur, notes, t: -0.6, lastBeat: -1, combo: 0, maxCombo: 0, sum: 0, hits: 0, perfects: 0, judge: null, judgeT: 0, hype: 0.3, done: false, endT: lead + dur + 1.2 };
  g.bw567rhythm = st;
  p.locked = true; p.vx = p.vz = 0; p.animOverride = o.anim || 'dance';
  if (o.cam) { BW567K.camHook(g); g.bw567cam = o.cam; }
  try { Sound.stopMusic && Sound.stopMusic(); } catch (e) { /* ignore */ }
  burnsSfx('select2', null, 'select');
  return st;
};
BW567K.rhythmStep = function (g, dt) {
  const st = g.bw567rhythm; if (!st || st.done) return;
  const p = g.player;
  if (g.cine || g.dialog.open) return;
  st.t += dt;
  const bt = Math.floor(st.t / st.beat);
  if (bt !== st.lastBeat && st.t >= 0) { st.lastBeat = bt; burnsSfx('kick', { vol: bt % 4 === 0 ? 0.7 : 0.45 }); if (st.o.onBeat) st.o.onBeat(g, bt); }
  const press = lane => {
    let best = null, bd = 0.2;
    for (const n of st.notes) { if (n.res || n.lane !== lane) continue; const d = Math.abs(n.t - st.t); if (d <= bd) { bd = d; best = n; } }
    if (!best) { st.judge = 'OOPS'; st.judgeT = 0.4; st.combo = 0; st.hype = Math.max(0, st.hype - 0.03); burnsSfx('bump', { vol: 0.25 }); return; }
    const pts = bd <= 0.07 ? 1 : bd <= 0.13 ? 0.75 : 0.45;
    best.res = pts === 1 ? 'PERFECT' : pts === 0.75 ? 'GREAT' : 'GOOD';
    st.sum += pts; st.hits++; if (pts === 1) st.perfects++;
    st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo); st.judge = best.res; st.judgeT = 0.5; st.hype = Math.min(1, st.hype + 0.04 * pts + st.combo * 0.002);
    burnsSfx(pts === 1 ? 'gold' : 'pick', { vol: 0.5, pitch: lane ? 1.25 : 1.0 });
    if (st.o.onHit) st.o.onHit(g, best, pts);
  };
  if (p.inp.jumpPressed) press(0);
  if (p.inp.actionPressed) press(1);
  for (const n of st.notes) if (!n.res && st.t - n.t > 0.2) { n.res = 'MISS'; st.combo = 0; st.judge = 'MISS'; st.judgeT = 0.45; st.hype = Math.max(0, st.hype - 0.05); if (st.o.onMiss) st.o.onMiss(g, n); }
  if (st.judgeT > 0) st.judgeT -= dt;
  if (st.t >= st.endT) BW567K.rhythmEnd(g);
};
BW567K.rhythmEnd = function (g) {
  const st = g.bw567rhythm; if (!st || st.done) return;
  st.done = true;
  const total = Math.max(1, st.notes.length), score = clamp(st.sum / total, 0, 1);
  const grade = score >= 0.92 ? 'S' : score >= 0.8 ? 'A' : score >= 0.6 ? 'B' : score >= 0.4 ? 'C' : 'D';
  const res = { score, grade, crowdPeak: Math.round((st.o.crowd || 0) + st.hype * 20), perfects: st.perfects, hits: st.hits, total };
  const p = g.player; p.locked = false; p.animOverride = null;
  g.bw567cam = null; g.bw567rhythm = null;
  if (st.o.music) burnsMusic(st.o.music);
  if (st.o.onDone) st.o.onDone(res);
  return res;
};
// test hook: auto-play with a given accuracy (0..1)
BW567K.rhythmAuto = function (g, acc) {
  const st = g.bw567rhythm; if (!st) return null;
  for (const n of st.notes) { if (n.res) continue; const r = Math.random(); n.res = r < acc ? 'PERFECT' : 'MISS'; if (n.res === 'PERFECT') { st.sum += 1; st.hits++; st.perfects++; } }
  st.t = st.endT; return BW567K.rhythmEnd(g);
};
BW567K.drawRhythm = function (ctx, g) {
  const st = g.bw567rhythm; if (!st || st.done) return;
  const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), portrait = H > W;
  // keep clear of the HUD: landscape sits right of the stats column (and left of pause); portrait sits below it
  const w = portrait ? Math.min(W - S.l - S.r - 16, 620) : Math.min(620, W - S.l - S.r - 252);
  const x0 = portrait ? (W - w) / 2 : Math.max(S.l + 168, (W - w) / 2), y0 = S.t + (portrait ? 156 : 34), lh = portrait ? 46 : 40, hitX = x0 + 56, span = 2.2;
  ctx.save();
  ctx.fillStyle = 'rgba(12,6,26,0.72)'; burnsRR(ctx, x0 - 8, y0 - 26, w + 16, lh * 2 + 52, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,79,216,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  BurnsUI.text(ctx, st.o.title || 'DROP THE BEAT', x0 + 4, y0 - 12, 12, '#ffd84a', { align: 'left' });
  const pct = clamp(st.t / (st.endT - 1.2), 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x0 + w * 0.5, y0 - 16, w * 0.48, 6); ctx.fillStyle = '#38f2ff'; ctx.fillRect(x0 + w * 0.5, y0 - 16, w * 0.48 * pct, 6);
  const lanes = [{ col: '#c04bff', lab: '▲ JUMP' }, { col: '#ff4b7d', lab: '◉ SPIN' }];
  for (let l = 0; l < 2; l++) {
    const y = y0 + 8 + l * lh + lh / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x0, y - lh / 2 + 3, w, lh - 6);
    ctx.strokeStyle = lanes[l].col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hitX, y, lh * 0.34, 0, TAU); ctx.stroke();
    BurnsUI.text(ctx, lanes[l].lab, x0 + 4, y, 9, lanes[l].col, { align: 'left', stroke: false });
  }
  // beat ticks
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let k = Math.floor((st.t) / st.beat); k < (st.t + span) / st.beat; k++) { const x = hitX + (k * st.beat - st.t) / span * (w - 70); if (x > hitX - 4 && x < x0 + w) ctx.fillRect(x, y0 + 10, 1.5, lh * 2 - 4); }
  for (const n of st.notes) {
    const dt = n.t - st.t; if (dt > span || dt < -0.25) continue;
    if (n.res && n.res !== 'MISS') continue;
    const x = hitX + dt / span * (w - 70), y = y0 + 8 + n.lane * lh + lh / 2, r = lh * 0.3;
    ctx.fillStyle = n.res === 'MISS' ? 'rgba(120,120,120,0.6)' : lanes[n.lane].col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    BurnsUI.text(ctx, n.lane ? '◉' : '▲', x, y + 1, 13, '#ffffff', { stroke: false });
  }
  if (st.t < 0 || st.t < st.beat * 4) { const c = Math.max(1, 4 - Math.floor(Math.max(0, st.t) / st.beat)); BurnsUI.text(ctx, st.t < 0 ? 'GET READY' : String(c), W / 2, y0 + lh * 2 + 52, 26, '#ffffff', { glow: '#ff4fd8' }); }
  if (st.judge && st.judgeT > 0) BurnsUI.text(ctx, st.judge + (st.combo > 2 ? `  x${st.combo}` : ''), hitX + 60, y0 + lh * 2 + 30, 16, st.judge === 'PERFECT' ? '#ffd84a' : st.judge === 'MISS' || st.judge === 'OOPS' ? '#ff6a6a' : '#7aff9a', { align: 'left', glow: '#ff4fd8' });
  // hype meter
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0 + w - 130, y0 + lh * 2 + 22, 120, 8); const gr = ctx.createLinearGradient(x0 + w - 130, 0, x0 + w - 10, 0); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(1, '#ffd84a'); ctx.fillStyle = gr; ctx.fillRect(x0 + w - 130, y0 + lh * 2 + 22, 120 * st.hype, 8);
  BurnsUI.text(ctx, 'HYPE', x0 + w - 136, y0 + lh * 2 + 26, 9, '#ffffff', { align: 'right', stroke: false });
  ctx.restore();
};
// DJ entry point: the shared BurnsDJ minigame when it exists, otherwise the fallback above
BW567K.dj = function (g, o) {
  if (typeof BurnsDJ !== 'undefined' && BurnsDJ && BurnsDJ.open && !o.fallback) {
    try {
      const S = BurnsDJ.open(g, { title: o.title, bpm: o.bpm, genre: o.genre || 'house', difficulty: o.difficulty, duration: Math.max(45, o.duration || 45), crowd: o.crowdAt || o.crowd, booth: o.booth, deck3d: o.deck3d, onDone: o.onDone });
      if (S) return S;
    } catch (e) { if (Game.reportError) Game.reportError(e); }
  }
  return BW567K.rhythm(g, o);
};
// is a DJ / rhythm minigame running right now?
// y for a world's status pill under the HUD stack: below the tracker / boss bar AND the live toasts
BW567K.hudY = function (g) { return (g.topStack || 40) + 2 + (g.toasts ? g.toasts.filter(t => t.t < 2.2).length : 0) * 28; };
BW567K.busy = function (g) { return !!(g.bw567rhythm || (typeof BurnsDJ !== 'undefined' && BurnsDJ && BurnsDJ.isOpen && BurnsDJ.isOpen(g))); };
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) { prev.call(this, ctx, g, fdt); if (g && g.bw567rhythm && g.state === 'play' && !g.paused) { try { BW567K.drawRhythm(ctx, g); } catch (e) { if (Game.reportError) Game.reportError(e); } } };
})();

/* ---------------- extra animations ---------------- */
// DJing: hands on the decks, head nodding on the beat, the occasional headphone check
BURNS_ANIMS.bw567dj = function (P, t) {
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const beat = t * (124 / 60) * TAU, nod = Math.abs(Math.sin(beat / 2)), cue = Math.sin(t * 0.7) > 0.6;
  S(B.CHEST, 0.18 + nod * 0.05, Math.sin(t * 1.3) * 0.12); S(B.HEAD, 0.1 + nod * 0.22, Math.sin(t * 0.9) * 0.15);
  S(B.UARM_L, -0.95 + Math.sin(beat) * 0.08, 0, 0.22); S(B.FARM_L, -0.7);
  if (cue) { S(B.UARM_R, -0.6, 0, -1.9); S(B.FARM_R, -2.2); } else { S(B.UARM_R, -0.95 - Math.sin(beat * 0.5) * 0.1, 0, -0.22); S(B.FARM_R, -0.7 + Math.sin(beat) * 0.15); }
  S(B.THIGH_L, -0.12 - nod * 0.1); S(B.SHIN_L, 0.2 + nod * 0.15); S(B.THIGH_R, -0.08); S(B.SHIN_R, 0.15 + nod * 0.1);
  P.y = -nod * 0.05; P.face = 3;
};
// debug / test access (the bundle is one IIFE)
try { if (window.BRADY_BURNS) window.BRADY_BURNS.BW567K = BW567K; } catch (e) { /* no window */ }
