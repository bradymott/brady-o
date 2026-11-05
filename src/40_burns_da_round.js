/* ============================================================
   BRADY GOES TO BURNING MAN — rounded characters (smooth, toy-like 3D)
   Ellipsoid heads with wrapped face art, tapered-capsule limbs, mitten
   hands, round shoes, sculpted hair with volume, soft gloss. Same 16 bones
   and offsets as burnsBody() (40_burns_d_rig.js), so every animation, actor,
   costume and controller works unchanged. Each model also carries a
   low-detail LOD (model.lod) used for distant characters.

   Extending (see docs/BURNS_GUIDE.md §6.5):
     BurnsRig.defineType(name, { spec(s, rng, opts), lines, anim })
     BurnsRig.defineAcc(name, (m, A) => {...})     accessories   (spec.acc: [...])
     BurnsRig.defineProp(name, (m, A) => {...})    held props    (spec.prop)
     BurnsRig.defineHat(name, (m, A, hat) => {...}) hats         (spec.hat: {kind, col})
     BURNS_ATLAS.addFace(name, recipe), BURNS_ATLAS.addPattern(name, painter)
   ============================================================ */

const BURNS_NPC_TYPES = {};
const BURNS_GEAR = { acc: {}, prop: {}, hat: {}, glasses: {} };

const BurnsRound = (() => {
  const B = BURNS_BONES, TZ = 0.64;
  // head ellipsoid (HEAD-bone local) and the face window wrapped on it
  const HD = { cx: 0, cy: 0.205, cz: 0.012, rx: 0.188, ry: 0.205, rz: 0.19 };
  const TF = 1.25, PH0 = 0.72, PH1 = 2.62;
  const EYE = { th: 0.365, ph: 1.531, y: 0.213 };
  const sm = (a, b, x) => BurnsM.smoothstep(a, b, x);
  const pp = t => { const f = ((t % 2) + 2) % 2; return f <= 1 ? f : 2 - f; };   // ping-pong 0..1..0
  const headPt = (th, ph, off, o) => { o = o || [0, 0, 0]; const s = Math.sin(ph); o[0] = HD.cx + (HD.rx + off) * s * Math.sin(th); o[1] = HD.cy + (HD.ry + off) * Math.cos(ph); o[2] = HD.cz + (HD.rz + off) * s * Math.cos(th); return o; };
  const has = (S, k) => !!(S.acc && S.acc.indexOf(k) >= 0);
  const lerpHex = (a, b, t) => { const x = burnsRGB(a), y = burnsRGB(b); return [Math.round(lerp(x[0], y[0], t)), Math.round(lerp(x[1], y[1], t)), Math.round(lerp(x[2], y[2], t))]; };

  /* ---------- torso profile (CHEST-bone local): [x-radius, y]; z-radius = r * TZ ---------- */
  function torsoProfile(h, w, fem) {
    return [[0, -0.075], [0.15 * w, -0.07], [0.162 * w, 0.0], [(fem ? 0.15 : 0.166) * w, 0.12 * h], [(fem ? 0.172 : 0.182) * w, 0.24 * h], [0.198 * w, 0.34 * h], [0.199 * w, 0.405 * h], [0.18 * w, 0.452 * h], [0.128 * w, 0.488 * h], [0.064, 0.506 * h], [0, 0.512 * h]];
  }
  function profR(P, y) { for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; if (y >= a[1] && y <= b[1]) return lerp(a[0], b[0], (y - a[1]) / Math.max(1e-6, b[1] - a[1])); } return y < P[0][1] ? P[0][0] : 0; }
  // insert crisp colour bands: colAt(y) -> hex; cuts = heights of hard colour changes
  function bands(P, cuts, colAt) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i]; out.push([a[0], a[1], colAt(a[1])]);
      if (i < P.length - 1) { const b = P[i + 1]; for (const yc of cuts) if (yc > a[1] + 1e-4 && yc < b[1] - 1e-4) { const r = lerp(a[0], b[0], (yc - a[1]) / (b[1] - a[1])); out.push([r, yc, colAt(yc - 1e-3)], [r, yc, colAt(yc + 1e-3)]); } }
    }
    return out;
  }

  /* ---------- hair cap: a shell over the skull that sinks into the scalp at its rim ---------- */
  // o: { front, side, sideburn, back, vol, lumps, lumpN, edge, seg, rings, uv, bang }
  function hairCap(m, A, o) {
    const lo = A.lo, seg = lo ? 14 : (o.seg || 30), rings = lo ? 6 : (o.rings || 11);
    const pf = o.front === undefined ? 0.66 : o.front, ps = o.side === undefined ? 1.3 : o.side, sb = o.sideburn === undefined ? 1.7 : o.sideburn, pb = o.back === undefined ? 2.25 : o.back;
    const vol = o.vol === undefined ? 0.026 : o.vol, lump = o.lumps || 0, ln = o.lumpN || 7;
    const tbl = [[0, pf], [0.2, pf + 0.1], [0.36, ps], [0.43, sb], [0.5, Math.min(1.42, sb)], [0.62, Math.max(1.6, Math.min(pb, 1.75))], [1, pb]];
    const phiMax = th => { const a = Math.min(1, Math.abs(th) / Math.PI); for (let i = 0; i < tbl.length - 1; i++) if (a <= tbl[i + 1][0]) { const t = (a - tbl[i][0]) / (tbl[i + 1][0] - tbl[i][0]); return lerp(tbl[i][1], tbl[i + 1][1], t * t * (3 - 2 * t)); } return pb; };
    const P = [0, 0, 0];
    m.surf(seg, rings, (u, v, out) => {
      const th = (u - 0.5) * TAU, ph = Math.max(0.0001, v * phiMax(th));
      let d = 0.006 + vol * Math.pow(1 - v, 1.3) * (o.backVol ? 1 + o.backVol * sm(1.6, 3.1, Math.abs(th)) : 1);
      if (lump) d += lump * (0.5 + 0.5 * Math.sin(th * ln + v * 5.3)) * Math.sin(Math.min(1, v * 1.4) * Math.PI);
      if (o.bang) d += o.bang * sm(0.6, 0.0, Math.abs(th)) * sm(0.55, 0.95, v);
      d = lerp(d, -0.014, sm(0.84, 1, v));
      headPt(th, ph, d, P); out[0] = P[0]; out[1] = P[1]; out[2] = P[2];
    }, { wrapU: true, out: [HD.cx, HD.cy, HD.cz], uvFn: o.uv ? ((u, v) => [lerp(o.uv.u0, o.uv.u1, pp(u * 6)), lerp(o.uv.v0, o.uv.v1, v)]) : null });
  }
  // long hair hanging down the back (HAIR bone; coordinates given in HEAD-local, shifted here)
  // o: { len (bottom y), width (half-angle around the back), vol, wave, ragged, flare, col, inner }
  function hairMass(m, A, o) {
    const lo = A.lo, nu = lo ? 8 : 16, nv = lo ? 5 : 10;
    const half = o.width || 1.45, bot = o.len === undefined ? -0.3 : o.len, top = HD.cy + 0.06;
    const fn = inset => (u, v, out) => {
      const th = Math.PI + (u - 0.5) * 2 * half, y = lerp(top, bot + (o.ragged ? o.ragged * Math.sin(th * 9) : 0), v);
      // follow the skull at the top, fall straight below the widest point, flare at the ends
      const ph = Math.acos(clamp((y - HD.cy) / HD.ry, -1, 1));
      const r = (y > HD.cy ? Math.sin(ph) : 1) + (o.flare || 0.12) * v * v;
      const wav = o.wave ? o.wave * Math.sin(v * 13 + th * 2.4) * sm(0.15, 0.5, v) : 0;
      const t = o.vol === undefined ? 0.032 : o.vol;
      const edge = sm(0.0, 0.18, 1 - Math.abs(u - 0.5) * 2);          // thin out toward the sides
      const R = r, add = (t * edge + 0.006) * (1 - inset) - inset * 0.004 + wav * edge;
      out[0] = HD.cx + (HD.rx * R + add) * Math.sin(th);
      out[1] = y;
      out[2] = HD.cz + (HD.rz * R + add) * Math.cos(th) - 0.012 * v;
    };
    m.push(); m.tf(0, -0.34, 0.12);
    m.surf(nu, nv, fn(0), { out: [HD.cx, HD.cy - 0.1, HD.cz + 0.06], uvFn: o.uv ? ((u, v) => [lerp(o.uv.u0, o.uv.u1, pp(u * 4)), lerp(o.uv.v0, o.uv.v1, v)]) : null });
    m.color(shade(o.col, -0.25)); m.surf(nu, nv, fn(1), { out: [HD.cx, HD.cy - 0.1, HD.cz + 0.06], flip: true });
    m.pop();
  }

  /* ---------- the builder ---------- */
  // lo: false = full detail, true = LOD (beyond 16 m), 'far' = crowd LOD (beyond 45 m: no small accessories)
  function build(S, lo) {
    const m = new BurnsMesh(lo ? 3072 : 8192);
    m.lo = !!lo; m.far = lo === 'far';
    const body = burnsBody(S.body);
    const h = body.h, w = body.w;
    const costume = S.costume && S.costume !== 'none' ? S.costume : null;
    const skin = S.skin || '#e8b996', skinSh = S.skinSh || shade(skin, -0.12);
    const top = Object.assign({ kind: 'tee', col: '#222' }, S.top || {});
    const bot = Object.assign({ kind: 'jeans', col: '#222' }, S.bottom || {});
    const shoe = Object.assign({ kind: 'sneakers', col: '#222' }, S.shoes || {});
    const C = { top: top.col, bot: bot.col, shoe: shoe.col, sole: shoe.sole || shade(shoe.col, -0.3) };
    if (costume === 'spaceman') { C.top = '#e8eef8'; C.bot = '#e8eef8'; C.shoe = '#b8c0d0'; C.sole = '#6a7080'; }
    if (costume === 'unicorn') { C.top = '#f6f0ff'; C.bot = '#f6f0ff'; C.shoe = '#ffb0e0'; C.sole = '#ff8ad0'; }
    if (costume === 'disco') { C.top = '#c8d0e0'; C.bot = '#c8d0e0'; C.shoe = '#e8e8f0'; C.sole = '#9aa0b0'; }
    const fem = S.body && S.body.fem !== undefined ? !!S.body.fem : (S.face === 'lashes' || S.kind === 'chinka');
    const fur = S.fursuit || null;
    const A = {
      m, S, lo: !!lo, h, w, B, body, costume, skin, skinSh, C, top, bot, shoe, fem, HD, EYE, TZ,
      headPt, hairCap: o => hairCap(m, A, o), hairMass: o => hairMass(m, A, o), pp, has: k => has(S, k),
      torso: null, torsoR: y => profR(A.torso, y), torsoPt(th, y, off, o) { const r = profR(A.torso, y) + (off || 0); o = o || [0, 0, 0]; o[0] = r * Math.sin(th); o[1] = y; o[2] = r * TZ * Math.cos(th) + (off || 0) * (1 - TZ) * Math.cos(th); return o; },
      seg: (hi, l) => lo ? (lo === 'far' && l > 4 ? Math.max(4, Math.round(l * 0.7)) : l) : hi, far: lo === 'far',
      parent: null, wicks: []
    };
    A.torso = torsoProfile(h, w, fem);
    const pat = n => n ? BURNS_ATLAS.pattern(n) : null;
    const disco = costume === 'disco';
    const topPat = pat(top.pattern) || (disco ? pat('disco') : null);
    const botPat = pat(bot.pattern) || (disco ? pat('disco') : bot.kind === 'jeans' ? pat('denim') : null);
    const tatt = S.tattoos ? pat(S.tattoos === 'blue' ? 'tattooBlue' : S.tattoos === 'small' ? 'tattooSmall' : 'tattoo') : null;
    const paint = S.paint ? pat(S.paint) : null;
    const suit = costume === 'spaceman' || costume === 'unicorn' || disco;
    const topKind = suit ? 'suit' : top.kind;
    const bare = topKind === 'none';
    const longSleeve = topKind === 'hoodie' || (top.long && !bare) || topKind === 'long' || topKind === 'suit' || !!fur;
    const shortSleeve = !longSleeve && (topKind === 'tee' || topKind === 'button');
    const skinGloss = fur ? 0 : 1;

    /* ===== hips / pelvis ===== */
    m.setBone(B.HIPS);
    const legSkin = (bot.kind === 'shorts' || bot.kind === 'kilt' || bot.kind === 'tutu') && !suit && !fur;
    m.color(fur ? fur.col : C.bot).shine(disco ? 3 : 0);
    m.ellipsoid(0, -0.045, 0, 0.168 * w, 0.122, 0.168 * w * 0.74, { seg: A.seg(16, 10), rings: A.seg(9, 6) });
    m.shine(0);
    if (!fur && !suit && (bot.kind === 'jeans' || bot.kind === 'cargo' || bot.kind === 'chinos' || bot.kind === 'shorts' || bot.belt) && !has(S, 'utilityBelt') && !has(S, 'dutyBelt') && !has(S, 'paintApron')) {
      m.color(bot.belt || '#16120e'); m.push(); m.tf(0, 0.045, 0, 0, 0, 0, 1, 1, 0.74); m.torus(0, 0, 0, 0.17 * w, 0.02, { seg: A.seg(18, 10), tseg: A.seg(6, 4) }); m.pop();
      if (!lo) { m.color('#9a9aa2').shine(3); m.roundBox(0, 0.045, 0.17 * w * 0.74 + 0.012, 0.05, 0.036, 0.012, 0.006); m.shine(0); }
    }
    if (bot.kind === 'kilt' && !fur) {
      const kc = bot.col; m.color(kc);
      const kl = bot.len || 0.34, prof = [[(kl > 0.5 ? 0.3 : 0.235) * w, -kl], [0.225 * w, -Math.min(0.2, kl * 0.6)], [0.19 * w, -0.02], [0.172 * w, 0.06]];
      m.lathe(prof, { seg: A.seg(16, 10), sz: 0.78, uv: botPat || null, rMod: (t) => 1 + 0.03 * Math.sin(t * 16) });
      m.color(shade(kc, -0.3)); m.lathe(prof.map(p => [p[0] - 0.006, p[1]]), { seg: A.seg(16, 10), sz: 0.78, flip: true });
      if (bot.utility && !lo) { m.color(shade(kc, -0.15)); for (const sd of [1, -1]) m.roundBox(sd * 0.15 * w, -0.12, 0.13, 0.08, 0.1, 0.03, 0.01); }
    }
    if (bot.kind === 'tutu' || costume === 'tutu') {
      const tiers = bot.tiers || (costume === 'tutu' ? ['#ff6ac0', '#ffd0ea', '#ff9ad0'] : [bot.col, shade(bot.col, 0.25), shade(bot.col, -0.12)]);
      tiers.forEach((tc, i) => {
        const y = -0.04 - i * 0.045, R0 = (0.33 + i * 0.03) * w;
        m.color(tc).shine(1);
        m.lathe([[0.16 * w, y + 0.03], [R0 * 0.8, y + 0.012], [R0, y - 0.025], [R0 * 0.93, y - 0.045], [0.16 * w, y - 0.02], [0.16 * w, y + 0.03]], { seg: A.seg(22, 12), sz: 0.85, rMod: th => 1 + 0.07 * Math.sin(th * 13 + i * 1.3) });
        m.shine(0);
      });
    }
    // coat skirt (fur / kimono / duster / pirate) and short jackets end at the hips
    const coat = costume === 'furcoat' ? { kind: 'fur', col: '#ff8ad8', trim: '#ffffff' } : costume === 'pirate' ? { kind: 'pirate', col: '#5a2a14', trim: '#d8a020' } : S.coat;
    if (coat && coat.kind !== 'jacket') {
      const robe = coat.kind === 'robe', L = coat.kind === 'kimono' ? 0.55 : coat.kind === 'duster' || coat.kind === 'pirate' ? 0.66 : robe ? 0.82 : 0.52, gap = robe ? 0.08 : 0.32;
      const T = coat.kind === 'fur' ? 0.045 : 0.025, cuv = coat.kind === 'fur' ? pat(coat.col === '#c8a070' ? 'leopard' : 'fur') : coat.pattern ? pat(coat.pattern) : null;
      const prof = [[(robe ? 0.3 : 0.25) * w + T, -L], [(robe ? 0.26 : 0.23) * w + T, -L * 0.6], [0.19 * w + T, -0.04], [0.172 * w + T, 0.07]];
      m.color(coat.col); m.lathe(prof, { seg: A.seg(18, 10), sz: 0.8, theta0: gap, theta1: TAU - gap, uv: cuv, rMod: coat.tattered ? ((th, t) => 1 + 0.05 * Math.sin(th * 9) * (1 - t)) : null });
      m.color(shade(coat.col, -0.35)); m.lathe(prof.map(p => [p[0] - 0.012, p[1]]), { seg: A.seg(18, 10), sz: 0.8, theta0: gap, theta1: TAU - gap, flip: true });
      if (coat.trim && coat.kind === 'pirate' && !lo) { m.color(coat.trim).shine(2); for (const sd of [1, -1]) { const a = sd * 0.32, r = 0.2 * w + T; m.limb(Math.sin(a) * r, 0.06, Math.cos(a) * r * 0.8 + 0.01, Math.sin(a) * (0.25 * w + T), -L, Math.cos(a) * (0.25 * w + T) * 0.8 + 0.01, 0.012, 0.012, { seg: 5 }); } m.shine(0); }
    }

    /* ===== torso ===== */
    m.setBone(B.CHEST);
    const torsoCol = fur ? fur.col : bare ? skin : C.top;
    let rows;
    if (fur) rows = bands(A.torso, [], () => fur.col);
    else if (bare) rows = bands(A.torso, [], () => skin);
    else if (topKind === 'crop') rows = bands(A.torso, [0.17 * h, 0.425 * h], y => y < 0.17 * h || y > 0.425 * h ? skin : C.top);
    else if (topKind === 'tank' || topKind === 'vest') rows = bands(A.torso, [0.43 * h], y => y > 0.43 * h ? skin : C.top);
    else if (topKind === 'offshoulder') rows = bands(A.torso, [0.39 * h], y => y > 0.39 * h ? skin : C.top);
    else if (topKind === 'halter') rows = bands(A.torso, [0.16 * h, 0.4 * h], y => y < 0.16 * h || y > 0.4 * h ? skin : C.top);
    else if (topKind === 'bikini') rows = bands(A.torso, [0.285 * h, 0.405 * h], y => y < 0.285 * h || y > 0.405 * h ? skin : C.top);
    else if (topKind === 'corset') rows = bands(A.torso, [0.39 * h], y => y > 0.39 * h ? skin : C.top);
    else rows = bands(A.torso, [0.49 * h], y => y > 0.49 * h ? skin : C.top);
    const tUV = topPat && !bare ? topPat : (paint && bare ? paint : (fur && fur.pattern ? pat(fur.pattern) : null));
    m.color(torsoCol).shine(disco ? 3 : bare ? skinGloss : 0);
    m.lathe(rows, { seg: A.seg(20, 10), sz: TZ, uv: tUV, rMod: fem ? ((th, t) => 1 + 0.07 * Math.pow(Math.max(0, Math.cos(th)), 3) * sm(0.45, 0.62, t) * sm(0.86, 0.68, t)) : null });
    m.shine(0);
    if (fur && fur.belly) { m.color(fur.belly); m.ellipsoid(0, 0.27 * h, 0.2 * w * TZ * 0.82, 0.12 * w, 0.18 * h, 0.05); }
    if (!fur && (topKind === 'tee' || topKind === 'button' || topKind === 'hoodie' || topKind === 'long') && !lo) { m.color(shade(C.top, -0.18)); m.push(); m.tf(0, 0.476 * h, 0.004, 0, -0.18, 0, 1, 1, 0.82); m.torus(0, 0, 0, 0.078, 0.012, { seg: 14, tseg: 4 }); m.pop(); }
    if (top.emblem && !bare) { const R = BURNS_ATLAS.pattern(top.emblem); if (R) { const y = 0.3 * h, z = profR(A.torso, y) * TZ; m.color(C.top); m.push(); m.tf(0, y, z + 0.004); m.decal(0, 0, 0, 0.17 * w, 0.17 * w, R); m.pop(); } }
    if (topKind === 'hoodie') {
      m.color(shade(C.top, -0.12)); m.ellipsoid(0, 0.47 * h, -0.105, 0.15 * w, 0.075, 0.085);
      if (!lo) { m.color(shade(C.top, -0.08)); m.roundBox(0, 0.13 * h, 0.2 * w * TZ * 0.92, 0.2 * w, 0.1, 0.03, 0.014); m.color('#f4f4f0'); for (const sd of [1, -1]) m.limb(sd * 0.035, 0.45 * h, 0.12, sd * 0.04, 0.33 * h, 0.13, 0.006, 0.006, { seg: 4 }); }
    }
    if (topKind === 'button' && !lo) {
      m.color('#f4f0e8'); for (let i = 0; i < 4; i++) { const y = (0.12 + i * 0.09) * h; m.ball(0, y, profR(A.torso, y) * TZ + 0.004, 0.011, { seg: 6, rings: 4 }); }
      m.color(shade(C.top, -0.08)); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.05, 0.47 * h, 0.085, sd * 0.5, -0.5, sd * 0.3); m.ellipsoid(0, 0, 0, 0.045, 0.012, 0.035, { seg: 8, rings: 4 }); m.pop(); }
      if (top.open && top.under) { m.color(top.under); m.ellipsoid(0, 0.32 * h, 0.2 * w * TZ * 0.95, 0.06, 0.16 * h, 0.02, { seg: 8, rings: 5 }); }
    }
    if (S.led) {
      m.color(S.led, 1);
      m.limb(0, 0.05, profR(A.torso, 0.25 * h) * TZ + 0.006, 0, 0.44 * h, profR(A.torso, 0.4 * h) * TZ + 0.004, 0.008, 0.008, { seg: 4 });
      m.push(); m.tf(0, 0.02, 0, 0, 0, 0, 1, 1, TZ); m.torus(0, 0, 0, 0.165 * w, 0.009, { seg: A.seg(16, 8), tseg: 3 }); m.pop();
      m.push(); m.tf(0, 0.47 * h, 0, 0, 0, 0, 1, 1, 0.8); m.torus(0, 0, 0, 0.1, 0.009, { seg: A.seg(14, 8), tseg: 3 }); m.pop();
      m.emissive(0);
    }
    // vests: hivis / patches open at the front, fleece closed
    if (S.vest) {
      const vc = S.vest === 'hivis' ? '#d8ff3a' : S.vest === 'fleece' ? (S.vestCol || '#2a3a5a') : S.vest === 'tactical' ? '#16161a' : (S.vestCol || '#5a4a3a');
      const open = S.vest === 'hivis' || S.vest === 'patches', T = S.vest === 'tactical' ? 0.03 : 0.02;
      const vprof = A.torso.filter(p => p[1] > 0.0 && p[1] < 0.47 * h).map(p => [p[0] + T, p[1]]);
      const vo = { seg: A.seg(18, 10), sz: TZ + 0.02, uv: S.vest === 'hivis' ? pat('hivis') : null };
      if (open) { vo.theta0 = 0.42; vo.theta1 = TAU - 0.42; }
      m.color(vc); m.lathe(vprof, vo);
      if (open) { m.color(shade(vc, -0.35)); m.lathe(vprof.map(p => [p[0] - 0.008, p[1]]), Object.assign({}, vo, { uv: null, flip: true })); }
      if (S.vest === 'fleece' && !lo) { m.color(shade(vc, -0.1)); m.push(); m.tf(0, 0.465 * h, 0, 0, 0, 0, 1, 1, 0.85); m.torus(0, 0, 0, 0.1, 0.022, { seg: 14, tseg: 5 }); m.pop(); }
      if (S.vest === 'patches' && !lo) BURNS_NEON.slice(0, 5).forEach((c, i) => { const th = Math.PI + (i % 3 - 1) * 0.5, y = (0.18 + Math.floor(i / 3) * 0.13) * h, p = A.torsoPt(th, y, T + 0.004); m.color(c); m.push(); m.tf(p[0], p[1], p[2], th); m.roundBox(0, 0, 0, 0.07, 0.07, 0.01, 0.01); m.pop(); });
      if (S.vest === 'tactical' && !lo) { m.color('#24242a'); for (const sd of [1, -1]) for (let k = 0; k < 2; k++) { const p = A.torsoPt(sd * 0.32, (0.16 + k * 0.1) * h, T + 0.012); m.push(); m.tf(p[0], p[1], p[2], sd * 0.32); m.roundBox(0, 0, 0, 0.07, 0.075, 0.035, 0.012); m.pop(); } }
    }
    // coats: torso shell, collar
    if (coat) {
      const T = coat.kind === 'fur' ? 0.04 : 0.024, cuv = coat.kind === 'fur' ? pat(coat.col === '#c8a070' ? 'leopard' : 'fur') : coat.pattern ? pat(coat.pattern) : null;
      const cprof = A.torso.filter(p => p[1] > -0.07 && p[1] < 0.49 * h).map(p => [p[0] + T, p[1]]);
      const cg = coat.kind === 'robe' ? 0.12 : 0.3, co = { seg: A.seg(18, 10), sz: TZ + 0.03, theta0: cg, theta1: TAU - cg, uv: cuv };
      m.color(coat.col); m.lathe(cprof, co);
      m.color(shade(coat.col, -0.35)); m.lathe(cprof.map(p => [p[0] - 0.01, p[1]]), Object.assign({}, co, { uv: null, flip: true }));
      const trim = coat.trim || coat.col;
      if (coat.kind === 'fur' || coat.kind === 'jacket') {
        m.color(trim); m.push(); m.tf(0, 0.455 * h, -0.005, 0, -0.15, 0, 1, 1, 0.82);
        m.torus(0, 0, 0, 0.115 * w, coat.kind === 'fur' ? 0.05 : 0.04, { seg: A.seg(16, 8), tseg: A.seg(7, 4) }); m.pop();
        if (!lo) for (const sd of [1, -1]) { const p = A.torsoPt(sd * 0.42, 0.37 * h, T + 0.012); m.push(); m.tf(p[0], p[1], p[2], sd * 0.42, 0.18, sd * 0.32); m.ellipsoid(0, 0, 0, 0.045, 0.1, 0.014, { seg: 8, rings: 5 }); m.pop(); }
      } else if (coat.kind === 'pirate' && !lo) { m.color(trim).shine(2); for (const sd of [1, -1]) { const p0 = A.torsoPt(sd * 0.3, 0.0, T + 0.004), p1 = A.torsoPt(sd * 0.36, 0.46 * h, T + 0.004); m.limb(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 0.012, 0.012, { seg: 5 }); } m.shine(0); }
      else if (coat.kind === 'kimono' && !lo) { m.color(trim); for (const sd of [1, -1]) { const p0 = A.torsoPt(sd * 0.3, 0.05, T + 0.004), p1 = A.torsoPt(sd * 0.55, 0.48 * h, T); m.limb(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 0.016, 0.016, { seg: 5 }); } }
    }
    // neck (on the head so the jaw line stays clean)
    m.setBone(B.HEAD);
    m.color(fur ? fur.col : (costume === 'spaceman' ? '#d0d8e8' : skin)).shine(skinGloss);
    m.limb(0, 0.085, -0.012, 0, -0.075, -0.012, fem ? 0.05 : 0.057, fem ? 0.052 : 0.06, { seg: A.seg(10, 6) });
    m.shine(0);

    /* ===== head ===== */
    if (S.cartArt && typeof CartDriverArt !== 'undefined' && !(fur && fur.head)) CartDriverArt.head(m, A);
    else if (fur && fur.head) fur.head(m, A);
    else {
      const R = BURNS_ATLAS.face(S.face || 'friendly');
      m.color(skin).shine(skinGloss);
      m.ellipsoid(HD.cx, HD.cy, HD.cz, HD.rx, HD.ry, HD.rz, {
        seg: A.seg(22, 12), rings: A.seg(15, 8), theta0: -Math.PI, theta1: Math.PI,
        uvFn: (x, y, z) => {
          const th = Math.atan2(x / HD.rx, z / HD.rz), ph = Math.acos(clamp(y / HD.ry, -1, 1));
          return [lerp(R.u0, R.u1, clamp(0.5 + th / (2 * TF), 0, 1)), lerp(R.v0, R.v1, clamp((ph - PH0) / (PH1 - PH0), 0, 1))];
        }
      });
      m.color(shade(skin, -0.015)); m.ellipsoid(0, 0.172, HD.cz + HD.rz * 0.975, 0.022, 0.03, 0.026, { seg: A.seg(10, 6), rings: A.seg(7, 4) });
      m.color(shade(skin, -0.07));
      for (const sd of [1, -1]) { const p = headPt(sd * Math.PI / 2, 1.66, -0.012); m.ellipsoid(p[0], p[1], p[2] - 0.008, 0.024, 0.05, 0.036, { seg: A.seg(8, 6), rings: A.seg(6, 4) }); }
      m.shine(0);
    }
    if (S.beard) BURNS_GEAR.acc.beard3d(m, A, S.beard);
    // hair (hidden under helmets / hoods)
    const hood = costume === 'spaceman' || costume === 'unicorn' || S.hood;
    if (!hood && !fur) {
      if (!(S.cartArt && typeof CartDriverArt !== 'undefined' && CartDriverArt.hair(m, A))) buildHair(m, A);
    }
    else if (costume === 'unicorn' && S.hair && S.hair.style === 'bun') { m.setBone(B.HAIR); m.color(S.hair.col).shine(2); m.push(); m.tf(0, -0.34, 0.12); m.ellipsoid(0, 0.44, -0.2, 0.08, 0.075, 0.075); m.pop(); m.shine(0); m.setBone(B.HEAD); }
    // head gear
    m.setBone(B.HEAD);
    const gl = costume === 'spaceman' ? 'visor' : S.glasses;
    if (S.cartArt && gl === 'shades' && typeof CartDriverArt !== 'undefined') CartDriverArt.shades(m, A);
    else if (gl && BURNS_GEAR.glasses[gl] && (!A.far || gl === 'visor' || gl === 'wrap')) BURNS_GEAR.glasses[gl](m, A);
    if (S.goggles || costume === 'tutu') BURNS_GEAR.acc.goggles(m, A, S.goggles === true || !S.goggles ? (costume === 'tutu' ? 'tutu' : 'classic') : S.goggles);
    const hat = costume === 'pirate' ? { kind: 'tricorn', col: '#1a1010' } : costume === 'furcoat' ? { kind: 'furhat', col: '#ff8ad8' } : S.hat;
    if (hat && BURNS_GEAR.hat[hat.kind]) { m.setBone(B.HEAD); BURNS_GEAR.hat[hat.kind](m, A, hat); }
    if (costume === 'spaceman') BURNS_GEAR.acc.spaceHelmet(m, A);
    if (costume === 'unicorn') BURNS_GEAR.acc.unicornHood(m, A);

    /* ===== arms ===== */
    for (const side of [1, -1]) {
      const UA = side > 0 ? B.UARM_L : B.UARM_R, FA = side > 0 ? B.FARM_L : B.FARM_R;
      m.setBone(UA);
      const armSkin = !longSleeve, armCol = fur ? (fur.limb || fur.col) : longSleeve ? C.top : skin;
      const armUV = fur && fur.limbPattern ? pat(fur.limbPattern) : (armSkin && tatt ? tatt : (longSleeve && topPat ? topPat : null));
      m.color(fur ? fur.col : (shortSleeve || longSleeve || topKind === 'vest') && !bare ? C.top : skin).shine(armSkin && !shortSleeve ? skinGloss : 0);
      m.ellipsoid(0, -0.026, 0, 0.063, 0.064, 0.061, { seg: A.seg(12, 8), rings: A.seg(8, 5) });
      m.color(armCol).shine(armSkin ? skinGloss : disco ? 3 : 0);
      m.limb(0, 0, 0, 0, -0.25 * h, 0, 0.062, 0.053, { seg: A.seg(12, 7), uv: armUV, uvRepeat: 2 });
      m.shine(0);
      if (shortSleeve && !bare && !fur) {
        m.color(C.top); m.lathe([[0, 0.09], [0.045, 0.082], [0.068, 0.03], [0.072, -0.07], [0.069, -0.115], [0.06, -0.125]], { seg: A.seg(12, 8), uv: topPat || null });
      }
      if (S.led) { m.color(S.led, 1); m.limb(0, -0.02, 0.062, 0, -0.24 * h, 0.054, 0.007, 0.007, { seg: 4 }); m.emissive(0); }
      if (coat) { const T = coat.kind === 'fur' ? 0.03 : 0.016; m.color(coat.col); m.limb(0, 0.01, 0, 0, -0.26 * h, 0, 0.078 + T, 0.07 + T, { seg: A.seg(12, 7), uv: coat.kind === 'fur' ? pat('fur') : null }); }
      if (costume === 'spaceman' && !lo) { m.color('#38f2ff', 1); m.limb(side * 0.064, -0.03, 0, side * 0.056, -0.24, 0, 0.007, 0.007, { seg: 4 }); m.emissive(0); }
      m.setBone(FA);
      m.color(armCol).shine(armSkin ? skinGloss : disco ? 3 : 0);
      m.limb(0, 0, 0, 0, -0.205, 0, 0.054, 0.043, { seg: A.seg(12, 7), uv: armUV, uvRepeat: 2 });
      m.shine(0);
      if (longSleeve && !fur) { m.color(shade(C.top, -0.14)); m.push(); m.tf(0, -0.205, 0); m.torus(0, 0, 0, 0.046, 0.012, { seg: A.seg(12, 8), tseg: 4 }); m.pop(); }
      if (coat) {
        const T = coat.kind === 'fur' ? 0.028 : 0.014; m.color(coat.col); m.limb(0, 0, 0, 0, -0.17, 0, 0.068 + T, 0.06 + T, { seg: A.seg(12, 7), uv: coat.kind === 'fur' ? pat('fur') : null, ends: false });
        if (coat.kind === 'robe' || coat.kind === 'kimono') { const bell = [[0.07, 0.0], [0.09, -0.1], [0.13, -0.19], [0.125, -0.205]]; m.color(coat.col); m.lathe(bell, { seg: A.seg(12, 8) }); m.color(shade(coat.col, -0.3)); m.lathe(bell.map(q => [q[0] - 0.008, q[1]]), { seg: A.seg(12, 8), flip: true }); }
        else { m.color(coat.trim || shade(coat.col, -0.2)); m.push(); m.tf(0, -0.185, 0); m.torus(0, 0, 0, 0.06 + T, coat.kind === 'fur' || coat.kind === 'jacket' ? 0.026 : 0.014, { seg: A.seg(12, 8), tseg: A.seg(5, 4), }); m.pop(); }
      }
      if (S.led) { m.color(S.led, 1); m.limb(0, -0.01, 0.052, 0, -0.19, 0.044, 0.007, 0.007, { seg: 4 }); m.emissive(0); }
      if (costume === 'tutu') { m.color('#ff9ad0'); m.lathe([[0.062, -0.08], [0.07, -0.13], [0.064, -0.19]], { seg: A.seg(12, 7), uv: pat('fur'), rMod: th => 1 + 0.08 * Math.sin(th * 7) }); }
      if (has(S, 'bracelets')) { m.color(side > 0 ? '#ffd84a' : '#ff7ad8', 0.6); m.push(); m.tf(0, -0.19, 0); m.torus(0, 0, 0, 0.047, 0.01, { seg: 10, tseg: 4 }); m.pop(); m.emissive(0); }
      // hand: a soft mitten with a thumb
      const handCol = fur ? (fur.paw || fur.col) : costume === 'spaceman' ? '#d0d8e8' : (S.gloves ? S.gloves : skin);
      if (fur && fur.paws) fur.paws(m, A, side, 'hand');
      else {
        m.color(handCol).shine(costume === 'spaceman' ? 2 : skinGloss);
        m.ellipsoid(0, -0.283, 0.004, 0.031, 0.066, 0.047, { seg: A.seg(10, 6), rings: A.seg(7, 5) });
        m.ellipsoid(-side * 0.008, -0.256, 0.042, 0.016, 0.031, 0.017, { seg: A.seg(7, 5), rings: A.seg(5, 4) });
        if (S.gloves && !lo) { m.color(skin).shine(skinGloss); m.ellipsoid(0, -0.33, 0.006, 0.027, 0.03, 0.04, { seg: 8, rings: 5 }); }
        m.shine(0);
      }
    }

    /* ===== legs ===== */
    for (const side of [1, -1]) {
      const TH = side > 0 ? B.THIGH_L : B.THIGH_R, SH = side > 0 ? B.SHIN_L : B.SHIN_R, FT = side > 0 ? B.FOOT_L : B.FOOT_R;
      const tight = bot.kind === 'leggings', baggy = !!bot.baggy;
      const tr = tight ? 0.078 : baggy ? 0.1 : 0.087, sr = tight ? 0.06 : baggy ? 0.082 : 0.066;
      const legCol = fur ? (fur.limb || fur.col) : C.bot, legUV = fur && fur.limbPattern ? pat(fur.limbPattern) : botPat;
      m.setBone(TH);
      if (legSkin) {
        if (bot.kind === 'shorts') { m.color(C.bot); m.lathe([[0, 0.07], [0.075, 0.06], [0.104, 0.0], [0.104, -0.17], [0.098, -0.205], [0.082, -0.212]], { seg: A.seg(12, 8), uv: botPat, rMod: bot.fade ? null : null }); if (bot.fade) { m.color(bot.fade); m.lathe([[0.1045, -0.1], [0.1045, -0.17], [0.099, -0.204], [0.083, -0.211]], { seg: A.seg(12, 8) }); } }
        m.color(skin).shine(skinGloss); m.limb(0, -0.02, 0, 0, -0.41 * h, 0, 0.08, 0.064, { seg: A.seg(12, 7) }); m.shine(0);
      } else {
        m.color(legCol).shine(disco ? 3 : 0);
        m.limb(0, 0, 0, 0, -0.41 * h, 0, tr, tr * 0.79, { seg: A.seg(12, 7), uv: legUV, uvRepeat: 2 });
        m.shine(0);
        if ((bot.kind === 'cargo' || bot.cargo) && !lo) { m.color(shade(C.bot, -0.08)); m.push(); m.tf(side * (tr - 0.005), -0.2 * h, 0, side * Math.PI / 2); m.roundBox(0, 0, 0, 0.1, 0.12, 0.03, 0.012); m.color(shade(C.bot, -0.16)); m.roundBox(0, 0.055, 0.004, 0.105, 0.03, 0.034, 0.01); m.pop(); }
        if (bot.patches && !lo) { m.color(side > 0 ? '#8a6a4a' : '#5a6a7a'); const p = [side * 0.03, -0.12 * h, tr * 0.92]; m.push(); m.tf(p[0], p[1], p[2], side * 0.25); m.roundBox(0, 0, 0, 0.06, 0.07, 0.01, 0.01); m.pop(); }
      }
      if (S.led) { m.color(S.led, 1); m.limb(side * 0.083, -0.02, 0, side * 0.07, -0.39 * h, 0, 0.007, 0.007, { seg: 4 }); m.emissive(0); }
      m.setBone(SH);
      const flare = disco ? 1.45 : 1;
      if (legSkin || bot.kind === 'shorts') { m.color(skin).shine(skinGloss); m.limb(0, 0, 0, 0, -0.36 * h, 0, 0.064, 0.049, { seg: A.seg(12, 7) }); m.shine(0); }
      else if (fur) { m.color(legCol); m.limb(0, 0, 0, 0, -0.36 * h, 0, sr + 0.006, sr * 0.82, { seg: A.seg(12, 7), uv: legUV, uvRepeat: 2 }); }
      else if (bot.capri) {
        m.color(skin).shine(skinGloss); m.limb(0, 0, 0, 0, -0.36 * h, 0, 0.06, 0.048, { seg: A.seg(12, 7) }); m.shine(0);
        m.color(legCol); m.lathe([[0, 0.06], [sr * 0.85, 0.05], [sr, 0.0], [sr * 0.95, -0.17 * h], [sr * 0.9, -0.19 * h]], { seg: A.seg(12, 8), uv: legUV, uvRepeat: 2 });
        m.color(shade(legCol, 0.12)); m.push(); m.tf(0, -0.185 * h, 0); m.torus(0, 0, 0, sr * 0.95, 0.014, { seg: A.seg(12, 8), tseg: 4 }); m.pop();
      }
      else {
        m.color(legCol).shine(disco ? 3 : 0);
        m.lathe([[0, 0.06], [sr * 0.85, 0.05], [sr, 0.0], [sr * 0.86, -0.22 * h], [sr * 0.88 * flare, -0.33 * h], [sr * 0.98 * flare, -0.375 * h], [sr * 0.8 * flare, -0.39 * h]], { seg: A.seg(12, 8), uv: legUV, uvRepeat: 2 });
        m.shine(0);
        if (bot.rolled) { m.color(shade(legCol, 0.1)); m.push(); m.tf(0, -0.35 * h, 0); m.torus(0, 0, 0, sr * 0.92 * flare, 0.016, { seg: A.seg(12, 8), tseg: 4 }); m.pop(); }
      }
      if (S.socks && (legSkin || bot.kind === 'shorts')) { m.color(S.socks.col || '#f4f4f0'); m.lathe([[0.054, -0.37 * h], [0.056, -0.25 * h], [0.06, -0.21 * h], [0.05, -0.2 * h]], { seg: A.seg(12, 7) }); if (S.socks.stripe && !lo) { m.color(S.socks.stripe); for (const y of [-0.235, -0.255]) { m.push(); m.tf(0, y * h, 0); m.torus(0, 0, 0, 0.058, 0.0065, { seg: 12, tseg: 3 }); m.pop(); } } }
      if (S.led) { m.color(S.led, 1); m.limb(side * 0.064, 0, 0, side * 0.055, -0.36 * h, 0, 0.007, 0.007, { seg: 4 }); m.emissive(0); }
      // shoes
      m.setBone(FT);
      if (fur && fur.paws) fur.paws(m, A, side, 'foot');
      else buildShoe(m, A, side, SH, FT);
    }
    /* ===== accessories, held props, extra parts ===== */
    // the crowd LOD keeps only accessories that change the silhouette
    const FAR = { wings: 1, flameWings: 1, fairyWings: 1, cape: 1, boa: 1, backpack: 1, lanternPoles: 1, trashcanHelmet: 1, colanderHelmet: 1, fireHood: 1, flameTassets: 1, spikedShoulders: 1, harness: 0, utilVest: 1, studdedVest: 1 };
    for (const a of S.acc || []) { const k = typeof a === 'string' ? a : a.kind; const fn = BURNS_GEAR.acc[k]; if (fn && (!A.far || FAR[k])) { m.setBone(B.CHEST); fn(m, A, typeof a === 'string' ? null : a); } }
    if (S.prop && !(A.far && !{ ringlight: 1, greeterSign: 1, skullstaff: 1, wizardstaff: 1, foambat: 1, staff: 1, hoop: 1 }[S.prop])) { const fn = BURNS_GEAR.prop[S.prop]; if (fn) { m.setBone(B.PROP); fn(m, A, 'right'); } }
    if (S.prop2) { const fn = BURNS_GEAR.prop[S.prop2]; if (fn) { A.parent = A.parent || BURNS_PARENT.slice(); A.parent[B.TAIL] = B.FARM_L; A.leftHand = true; m.setBone(B.TAIL); fn(m, A, 'left'); } }
    if (costume === 'unicorn') { m.setBone(B.TAIL); ['#ff3b5c', '#ffe24a', '#38c8ff', '#9a6bff'].forEach((c, i) => { m.color(c); m.limb((i - 1.5) * 0.035, 0, 0, (i - 1.5) * 0.05, -0.34, -0.18, 0.026, 0.012, { seg: 6 }); }); }
    if (costume === 'spaceman') BURNS_GEAR.acc.spacePack(m, A);
    if (costume === 'disco') { m.setBone(B.CHEST); m.color('#2a1a3a'); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.07, 0.45 * h, 0.1, sd * 0.4, -0.9, sd * 0.45); m.ellipsoid(0, 0, 0, 0.07, 0.012, 0.05, { seg: 8, rings: 4 }); m.pop(); } }
    if (costume === 'unicorn') { m.setBone(B.CHEST); m.color('#ffd0ec'); m.ellipsoid(0, 0.22 * h, A.torsoR(0.22 * h) * TZ - 0.012, 0.11 * w, 0.15 * h, 0.035); }
    if (costume === 'pirate') BURNS_GEAR.acc.pirateKit(m, A);
    if (fur && fur.tail) { m.setBone(B.TAIL); fur.tail(m, A); }
    return { geo: m.geo(), A };
  }

  /* ---------- hair styles ---------- */
  function buildHair(m, A) {
    const S = A.S, H = S.hair || { style: 'short', col: '#3a2a1a' };
    const col = H.col, hi = H.hi || shade(col, 0.3), style = H.style, hu = BURNS_ATLAS.pattern('hair');
    m.setBone(B.HEAD);
    if (style === 'bald') { m.color(shade(A.skin, 0.04)).shine(2); m.ellipsoid(0, HD.cy + 0.004, HD.cz - 0.02, HD.rx - 0.004, HD.ry - 0.004, HD.rz - 0.03, { phi1: 0.9, seg: A.seg(14, 8), rings: 4 }); m.shine(0); return; }
    m.color(col).shine(2);
    const cap = {
      bun: { front: 0.6, side: 1.25, sideburn: 1.62, back: 2.2, vol: 0.016, lumps: 0.003, lumpN: 14, uv: hu },
      down: { front: 0.74, side: 1.35, sideburn: 1.75, back: 2.35, vol: 0.03, lumps: 0.005, uv: hu },
      long: { front: 0.72, side: 1.38, sideburn: 1.75, back: 2.35, vol: 0.028, lumps: 0.004, uv: hu },
      wig: { front: 1.05, side: 1.4, sideburn: 1.8, back: 2.35, vol: 0.04, lumps: 0.006, bang: 0.018, uv: hu },
      wavy: { front: 0.7, side: 1.42, sideburn: 1.85, back: 2.35, vol: 0.034, lumps: 0.008, lumpN: 9, uv: hu },
      short: { front: 0.72, side: 1.22, sideburn: 1.6, back: 2.05, vol: 0.034, lumps: 0.006, uv: hu },
      buzz: { front: 0.68, side: 1.2, sideburn: 1.5, back: 2.05, vol: 0.004, lumps: 0 },
      pony: { front: 0.62, side: 1.25, sideburn: 1.6, back: 2.15, vol: 0.014, lumps: 0.003, lumpN: 14, uv: hu },
      mohawk: { front: 0.68, side: 1.2, sideburn: 1.4, back: 2.05, vol: 0.002, lumps: 0 },
      afro: { front: 0.78, side: 1.3, sideburn: 1.65, back: 2.2, vol: 0.12, lumps: 0.018, lumpN: 11, backVol: 0.3 },
      curly: { front: 0.74, side: 1.4, sideburn: 1.85, back: 2.4, vol: 0.06, lumps: 0.016, lumpN: 11, backVol: 0.4 },
      bob: { front: 0.78, side: 1.46, sideburn: 2.0, back: 2.25, vol: 0.045, lumps: 0.006, uv: hu, bang: 0.01 },
      spiky: { front: 0.7, side: 1.22, sideburn: 1.55, back: 2.0, vol: 0.022, lumps: 0.004, uv: hu },
      slick: { front: 0.6, side: 1.25, sideburn: 1.6, back: 2.15, vol: 0.012, lumps: 0.002, lumpN: 16, uv: hu },
      messy: { front: 0.7, side: 1.3, sideburn: 1.7, back: 2.2, vol: 0.04, lumps: 0.02, lumpN: 9, uv: hu },
      swoop: { front: 0.75, side: 1.25, sideburn: 1.55, back: 2.1, vol: 0.03, lumps: 0.004, uv: hu }
    }[style] || { front: 0.72, vol: 0.03, uv: hu };
    if (style === 'buzz' || style === 'mohawk') m.color(shade(col, 0.08));
    A.hairCap(cap);
    m.shine(0);
    if (style === 'buzz') return;
    if (style === 'mohawk') {
      const mc = S.mohawkCol || BURNS_NEON[(S.seed || 1) % 7]; m.color(mc).shine(2);
      if (S.mohawkCol) { const n = A.lo ? 5 : 9; for (let i = 0; i < n; i++) { const t = i / (n - 1) * 2 - 1, ph = Math.abs(t) * 1.25, z = t < 0 ? 1 : -1, L = 0.21 - Math.abs(t + 0.15) * 0.07; const a = [0, HD.cy + Math.cos(ph) * HD.ry, HD.cz + z * Math.sin(ph) * HD.rz], b = [0, HD.cy + Math.cos(ph) * (HD.ry + L), HD.cz + z * Math.sin(ph) * (HD.rz + L)]; m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.045, 0.004, { seg: A.seg(6, 4), sx: 0.4 }); } }
      else m.ellipsoid(0, HD.cy + HD.ry - 0.005, HD.cz - 0.03, 0.03, 0.1, 0.19, { seg: A.seg(10, 6), rings: A.seg(8, 5), colFn: (x, y) => y > 0.05 ? shade(mc, 0.3) : null });
      m.shine(0); return;
    }
    if (style === 'swoop' && !A.lo) { m.color(col).shine(2); const a = headPt(0.5, 0.55, 0.03), b = headPt(-0.1, 0.45, 0.11), c = headPt(-0.6, 0.85, 0.06); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.06, 0.05, { seg: 8 }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.05, 0.015, { seg: 8 }); m.shine(0); return; }
    if (style === 'messy' && !A.lo) { m.color(col).shine(1); const r = mulberry32(57); for (let i = 0; i < 16; i++) { const th = (r() - 0.5) * 5.6, ph = 0.25 + r() * 1.3, p = headPt(th, ph, 0.03), q = headPt(th + (r() - 0.5) * 0.7, ph + (r() - 0.5) * 0.5, 0.075); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.026, 0.008, { seg: 5 }); } m.shine(0); return; }
    if (style === 'slick') return;
    if (style === 'spiky' && !A.lo) { m.color(col).shine(2); for (let i = 0; i < 9; i++) { const th = (i - 4) * 0.42, ph = 0.25 + (i % 3) * 0.2, p = headPt(th, ph, 0.01), q = headPt(th, ph - 0.25, 0.09); m.limb(p[0], p[1], p[2], q[0], q[1] + 0.02, q[2], 0.03, 0.004, { seg: 5 }); } m.shine(0); return; }
    if (style === 'curly' && !A.lo) { m.color(col).shine(1); const r = mulberry32(31); for (let i = 0; i < 22; i++) { const th = Math.PI * (0.42 + r() * 0.58) * (r() < 0.5 ? 1 : -1), ph = 0.35 + r() * 1.75, p = headPt(th, ph, 0.045 + r() * 0.025); m.ball(p[0], p[1], p[2], 0.026 + r() * 0.016, { seg: 7, rings: 5 }); } m.shine(0); }
    if (style === 'short' && !A.lo) { m.color(col).shine(2); const p = headPt(0.15, 0.62, 0.02); m.push(); m.tf(p[0], p[1], p[2], 0.2, -0.5, 0.1); m.ellipsoid(0, 0, 0, 0.07, 0.03, 0.05, { seg: 8, rings: 5 }); m.pop(); m.shine(0); return; }
    if (style === 'afro' || style === 'curly' || style === 'short') return;
    m.setBone(B.HAIR); m.color(col).shine(2);
    if (style === 'bun') {
      // a real round man bun: coiled knot on the crown, a hair tie, a few loose curly ends (HAIR bone springs)
      m.push(); m.tf(0, -0.34, 0.12);
      m.ellipsoid(0, 0.435, -0.12, 0.09, 0.08, 0.087, { seg: A.seg(14, 8), rings: A.seg(10, 6), uvFn: (x, y, z) => [lerp(hu.u0, hu.u1, pp(Math.atan2(x, z) / Math.PI * 3)), lerp(hu.v0, hu.v1, clamp(0.5 - y * 5, 0, 1))] });
      if (!A.lo) m.ellipsoid(0.018, 0.47, -0.105, 0.052, 0.042, 0.05, { seg: 10, rings: 6 });
      m.color('#0a0a0e').shine(1); m.push(); m.tf(0, 0.375, -0.13, 0, 0.35, 0); m.torus(0, 0, 0, 0.05, 0.014, { seg: A.seg(12, 8), tseg: 4 }); m.pop();
      if (!A.lo) { m.color(hi).shine(2); m.limb(0.04, 0.47, -0.16, 0.085, 0.42, -0.21, 0.012, 0.004, { seg: 5 }); m.limb(-0.035, 0.48, -0.17, -0.08, 0.44, -0.22, 0.011, 0.004, { seg: 5 }); m.limb(0.0, 0.5, -0.12, 0.02, 0.535, -0.17, 0.01, 0.003, { seg: 5 }); }
      m.pop(); m.shine(0); return;
    }
    if (style === 'pony') {
      m.push(); m.tf(0, -0.34, 0.12);
      m.limb(0, 0.33, -0.2, 0, 0.12, -0.25, 0.055, 0.03, { seg: A.seg(10, 6), mid: 0.25 }); m.limb(0, 0.12, -0.25, 0.01, -0.02, -0.22, 0.03, 0.012, { seg: A.seg(8, 5) });
      m.color('#0a0a0e'); m.push(); m.tf(0, 0.33, -0.2, 0, 0.6, 0); m.torus(0, 0, 0, 0.045, 0.012, { seg: 10, tseg: 4 }); m.pop();
      m.pop(); m.shine(0); return;
    }
    if (style === 'bob') { m.color(col).shine(2); A.hairMass({ len: HD.cy - 0.2, width: 1.95, vol: 0.05, flare: 0.1, col, uv: hu, hiCol: hi }); m.shine(0); return; }
    if (style === 'down' || style === 'long' || style === 'wig' || style === 'wavy') {
      const wavy = style === 'wavy';
      A.hairMass({ len: style === 'down' ? -0.32 : -0.3, width: 1.5, vol: wavy ? 0.045 : 0.035, wave: wavy ? 0.018 : 0, ragged: wavy ? 0.03 : 0.012, flare: wavy ? 0.22 : 0.12, col, uv: hu });
      m.shine(0);
      // front locks over the shoulders
      m.setBone(B.HEAD); m.color(col).shine(2);
      const locks = A.lo ? [1, -1] : (style === 'down' ? [1, -1] : [1, -1, 1.3, -1.3]);
      for (const sd of locks) {
        const s = Math.sign(sd), k = Math.abs(sd), p = headPt(s * 1.38 * k, 1.5, 0.012);
        const q = [s * (0.15 + 0.03 * k), -0.16, 0.05], r2 = [s * (0.17 + 0.03 * k), -0.3, 0.07];
        if (wavy) { m.limb(p[0], p[1], p[2], q[0] + s * 0.02, q[1], q[2], 0.028, 0.024, { seg: 6 }); m.limb(q[0] + s * 0.02, q[1], q[2], r2[0], r2[1], r2[2], 0.024, 0.01, { seg: 6 }); }
        else m.limb(p[0], p[1], p[2], q[0], q[1] - 0.08, q[2], 0.026, 0.01, { seg: 6 });
      }
      m.shine(0);
    }
  }

  /* ---------- shoes ---------- */
  function buildShoe(m, A, side, SH, FT) {
    const S = A.S, shoe = A.shoe, C = A.C, cos = A.costume, lo = A.lo;
    let kind = cos === 'pirate' ? 'boots' : shoe.kind;
    if (shoe.missing && (shoe.missing === 'right' ? side < 0 : side > 0)) kind = 'sock';
    if (kind === 'barefoot' || kind === 'sandals' || kind === 'sock') {
      m.color(kind === 'sock' ? (shoe.sockCol || '#b8a890') : A.skin).shine(kind === 'sock' ? 0 : 1);
      m.ellipsoid(0, -0.03, 0.05, 0.052, 0.036, 0.12, { seg: A.seg(12, 8), rings: A.seg(7, 5) });
      m.limb(0, 0.02, -0.01, 0, -0.03, 0.0, 0.046, 0.044, { seg: A.seg(10, 6) });
      if (!lo && kind !== 'sock') for (let i = 0; i < 5; i++) m.ball(-side * (i - 2) * 0.018 + side * 0.004, -0.045, 0.16 - Math.abs(i - 1.5) * 0.008, 0.011 - i * 0.0008, { seg: 5, rings: 3 });
      m.shine(0);
      if (kind === 'sandals') { m.color(shoe.col || '#7a5a3a'); m.roundBox(0, -0.061, 0.05, 0.11, 0.016, 0.27, 0.008); m.color(shade(shoe.col || '#7a5a3a', -0.2)); m.push(); m.tf(0, -0.04, 0.09, 0, 0.2); m.torus(0, 0, 0, 0.05, 0.008, { seg: 10, tseg: 3, sy: 0.6 }); m.pop(); m.push(); m.tf(0, -0.01, 0.0, 0, 0.0); m.torus(0, 0, 0, 0.049, 0.008, { seg: 10, tseg: 3 }); m.pop(); }
      return;
    }
    const col = cos === 'pirate' ? '#3a2010' : (kind === 'furboots' ? shoe.col : C.shoe), sole = C.sole;
    if (kind === 'boots' || kind === 'combat' || kind === 'workboots') {
      m.setBone(SH); m.color(col).shine(1);
      m.lathe([[0.072, -0.4], [0.074, -0.3], [0.072, -0.2], [0.064, -0.185], [0, -0.18]], { seg: A.seg(12, 8) });
      if (!lo && (shoe.laces || kind === 'combat')) { m.color(shade(col, -0.35)); for (let i = 0; i < 4; i++) { m.push(); m.tf(0, -0.36 + i * 0.045, 0.07, 0, 0, 0); m.roundBox(0, 0, 0, 0.05, 0.008, 0.012, 0.004); m.pop(); } }
      if (shoe.wraps && !lo) { m.color(shoe.wrapCol || shade(col, -0.2)); for (let i = 0; i < 3; i++) { m.push(); m.tf(0, -0.36 + i * 0.06, 0, 0, 0.25 * (i % 2 ? 1 : -1), 0); m.torus(0, 0, 0, 0.075, 0.009, { seg: 12, tseg: 3 }); m.pop(); } }
      m.shine(0); m.setBone(FT);
    }
    if (kind === 'furboots' || (cos === 'tutu' && kind !== 'boots')) {
      m.setBone(SH); m.color(cos === 'tutu' ? '#ff9ad0' : col);
      m.lathe([[0.096, -0.41], [0.1, -0.3], [0.095, -0.16], [0.085, -0.12], [0, -0.11]], { seg: A.seg(12, 8), uv: BURNS_ATLAS.pattern(shoe.pattern || 'fur'), rMod: (th, t) => 1 + 0.06 * Math.sin(th * 7 + t * 9) });
      m.setBone(FT);
    }
    m.color(kind === 'furboots' ? col : col).shine(kind === 'sneakers' || kind === 'hightops' || kind === 'dad' ? 2 : 1);
    const big = kind === 'combat' || kind === 'workboots' || kind === 'hightops' ? 1.06 : 1;
    m.roundBox(0, -0.012, 0.045, 0.128 * big, 0.092, 0.258 * big, 0.043);
    m.ellipsoid(0, -0.024, 0.118 * big, 0.064 * big, 0.049, 0.074, { seg: A.seg(12, 8), rings: A.seg(7, 5), uvFn: shoe.print ? ((x, y, z) => { const R = BURNS_ATLAS.pattern(shoe.print); return [lerp(R.u0, R.u1, pp(x * 8 + 0.5)), lerp(R.v0, R.v1, pp(z * 6))]; }) : null });
    if (kind === 'hightops') { m.lathe([[0.064, 0.02], [0.066, 0.1], [0.06, 0.12], [0, 0.125]], { seg: A.seg(12, 8), uv: shoe.print ? BURNS_ATLAS.pattern(shoe.print) : null }); }
    m.shine(0); m.color(sole);
    m.roundBox(0, -0.049, 0.05, 0.133 * big, 0.028, 0.27 * big, 0.013);
    if (kind === 'boots' || kind === 'combat' || kind === 'workboots') { m.color(shade(sole, -0.2)); m.roundBox(0, -0.057, -0.035, 0.11, 0.02, 0.06, 0.008); }
    if (!lo && (kind === 'sneakers' || kind === 'hightops' || kind === 'dad')) {
      m.color(shoe.laceCol || '#f4f4f0'); for (let i = 0; i < 3; i++) m.roundBox(0, 0.032 - i * 0.006, 0.06 + i * 0.03, 0.05, 0.008, 0.012, 0.004);
      m.color(shoe.stripe || shade(C.shoe, 0.3)); m.limb(side * 0.066, -0.01, -0.02, side * 0.066, -0.026, 0.12, 0.006, 0.006, { seg: 4 });
    }
    if (kind === 'dad' && !lo) { m.color('#c8c8d0'); m.roundBox(0, -0.035, 0.048, 0.142, 0.012, 0.29, 0.006); }
  }

  return { build, headPt, HD, EYE, TF, PH0, PH1, profR, torsoProfile };
})();

/* ================= gear: accessories ================= */
(() => {
  const B = BURNS_BONES, G = BURNS_GEAR, HD = BurnsRound.HD, hp = BurnsRound.headPt;
  const acc = (n, f) => { G.acc[n] = f; }, prop = (n, f) => { G.prop[n] = f; }, hat = (n, f) => { G.hat[n] = f; }, gls = (n, f) => { G.glasses[n] = f; };
  const ring = (m, x, y, z, R, r, sx, sz, seg, pitch) => { m.push(); m.tf(x, y, z, 0, pitch || 0, 0, sx || 1, 1, sz || 1); m.torus(0, 0, 0, R, r, { seg: seg || 14, tseg: 4 }); m.pop(); };
  // wraparound band on the head at height y (HEAD local). o: { th (half-angle), h, off, col, e, gloss }
  const band = (m, y, o) => { const ph = Math.acos(clamp((y - HD.cy) / HD.ry, -1, 1)), r = Math.sin(ph) + (o.off || 0.02) / HD.rx, hh = o.h || 0.04; m.push(); m.tf(0, 0, HD.cz); m.lathe([[r * HD.rx - 0.004, y - hh / 2], [r * HD.rx + 0.004, y - hh * 0.2], [r * HD.rx + 0.004, y + hh * 0.2], [r * HD.rx - 0.004, y + hh / 2]], { seg: o.seg || 16, theta0: -(o.th || 1.2), theta1: o.th || 1.2, sz: HD.rz / HD.rx }); m.pop(); };

  /* ---- glasses ---- */
  const lensPos = (sd, off) => hp(sd * 0.37, 1.53, off || 0.02);
  gls('shades', (m, A) => { // dark square sunglasses (Brady)
    m.color('#14161e').shine(3);
    for (const sd of [1, -1]) { const p = lensPos(sd, 0.018); m.push(); m.tf(p[0], p[1], p[2], sd * 0.36); m.roundBox(0, 0, 0, 0.092, 0.066, 0.016, 0.013, { k: A.lo ? 1 : 2, m: 1 }); m.pop(); }
    m.color('#0a0a10').shine(2);
    const a = lensPos(1, 0.026), b = lensPos(-1, 0.026);
    m.limb(a[0] + 0.045, a[1] + 0.034, a[2] - 0.016, b[0] - 0.045, b[1] + 0.034, b[2] - 0.016, 0.008, 0.008, { seg: 5 });
    for (const sd of [1, -1]) { const p = hp(sd * 0.78, 1.47, 0.012), q = hp(sd * 1.62, 1.5, 0.004); m.limb(p[0], p[1] + 0.02, p[2], q[0], q[1], q[2], 0.007, 0.006, { seg: 4 }); }
    if (!A.lo) { m.color('#5a6080').shine(3); const p = lensPos(1, 0.028); m.ball(p[0] + 0.02, p[1] + 0.018, p[2] + 0.006, 0.008, { seg: 6, rings: 4 }); }
    m.shine(0);
  });
  gls('heart', (m, A) => {
    m.color('#ff3b7a', 0.45).shine(3);
    const hpts = []; for (let i = 0; i < 16; i++) { const t = i / 16 * TAU; hpts.push([16 * Math.pow(Math.sin(t), 3) * 0.0032, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.0032]); }
    for (const sd of [1, -1]) { const p = lensPos(sd, 0.02); m.push(); m.tf(p[0], p[1], p[2] - 0.006, sd * 0.36); m.extrude(hpts.slice().reverse(), 0.014, { convex: false }); m.pop(); }
    m.emissive(0); m.color('#ff8ad8').shine(2); const a = lensPos(1, 0.024), b = lensPos(-1, 0.024); m.limb(a[0] - 0.04, a[1] + 0.01, a[2], b[0] + 0.04, b[1] + 0.01, b[2], 0.006, 0.006, { seg: 4 });
    for (const sd of [1, -1]) { const p = hp(sd * 0.8, 1.48, 0.01), q = hp(sd * 1.62, 1.5, 0.004); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.006, 0.005, { seg: 4 }); }
    m.shine(0);
  });
  gls('clear', (m, A) => {
    m.color('#1a1a22').shine(2);
    for (const sd of [1, -1]) {
      const c = lensPos(sd, 0.02), x0 = -0.045, x1 = 0.045, y0 = -0.032, y1 = 0.032;
      m.push(); m.tf(c[0], c[1], c[2], sd * 0.36);
      m.limb(x0, y1, 0, x1, y1, 0, 0.006, 0.006, { seg: 4 }); m.limb(x0, y0, 0, x1, y0, 0, 0.006, 0.006, { seg: 4 }); m.limb(x0, y0, 0, x0, y1, 0, 0.006, 0.006, { seg: 4 }); m.limb(x1, y0, 0, x1, y1, 0, 0.006, 0.006, { seg: 4 });
      m.pop();
    }
    const a = lensPos(1, 0.022), b = lensPos(-1, 0.022); m.limb(a[0] - 0.045, a[1] + 0.012, a[2] + 0.004, b[0] + 0.045, b[1] + 0.012, b[2] + 0.004, 0.005, 0.005, { seg: 4 });
    for (const sd of [1, -1]) { const p = hp(sd * 0.8, 1.48, 0.01), q = hp(sd * 1.62, 1.5, 0.004); m.limb(p[0], p[1] + 0.02, p[2], q[0], q[1], q[2], 0.005, 0.005, { seg: 4 }); }
    m.shine(0);
  });
  gls('round', (m, A) => { // round mirrored lenses (greeter)
    for (const sd of [1, -1]) { const p = lensPos(sd, 0.02); m.push(); m.tf(p[0], p[1], p[2], sd * 0.36, Math.PI / 2, 0); m.color(A.S.lensCol || '#9a4aff', 0.15).shine(3); m.roundCyl(0, -0.006, 0, 0.044, 0.012, 0.005, { seg: A.lo ? 8 : 14 }); m.emissive(0); m.color('#d8c070').shine(2); m.torus(0, 0, 0, 0.046, 0.005, { seg: 14, tseg: 3 }); m.pop(); }
    const a = lensPos(1, 0.024), b = lensPos(-1, 0.024); m.limb(a[0] - 0.045, a[1] + 0.008, a[2], b[0] + 0.045, b[1] + 0.008, b[2], 0.005, 0.005, { seg: 4 });
    for (const sd of [1, -1]) { const p = hp(sd * 0.8, 1.5, 0.01), q = hp(sd * 1.62, 1.5, 0.004); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.005, 0.005, { seg: 4 }); }
    m.shine(0);
  });
  gls('aviator', (m, A) => { // teardrop aviators (gold frame, mirrored lens)
    for (const sd of [1, -1]) { const p = lensPos(sd, 0.02); m.push(); m.tf(p[0] + sd * 0.004, p[1] - 0.006, p[2], sd * 0.36, 0, sd * -0.25); m.color(A.S.lensCol || '#ff8a2a', 0.12).shine(3); m.ellipsoid(0, 0, 0, 0.05, 0.04, 0.011, { seg: A.lo ? 8 : 14, rings: 5 }); m.emissive(0); m.pop(); }
    m.color('#d8b048').shine(3); const a = lensPos(1, 0.026), b = lensPos(-1, 0.026);
    m.limb(a[0] + 0.04, a[1] + 0.03, a[2] - 0.012, b[0] - 0.04, b[1] + 0.03, b[2] - 0.012, 0.005, 0.005, { seg: 4 }); m.limb(a[0] - 0.035, a[1] + 0.018, a[2] + 0.004, b[0] + 0.035, b[1] + 0.018, b[2] + 0.004, 0.005, 0.005, { seg: 4 });
    for (const sd of [1, -1]) { const p = hp(sd * 0.8, 1.48, 0.01), q = hp(sd * 1.62, 1.5, 0.004); m.limb(p[0], p[1] + 0.016, p[2], q[0], q[1], q[2], 0.005, 0.005, { seg: 4 }); }
    m.shine(0);
  });
  gls('wrap', (m, A) => { // wraparound shades
    m.color('#101016').shine(3); band(m, BurnsRound.EYE.y + 0.004, { th: 1.25, h: 0.07, off: 0.024, seg: A.lo ? 10 : 18 });
    m.color('#2a2a34').shine(2); for (const sd of [1, -1]) { const p = hp(sd * 1.3, 1.5, 0.018), q = hp(sd * 1.65, 1.5, 0.004); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.007, 0.006, { seg: 4 }); }
    m.shine(0);
  });
  gls('visor', (m, A) => { m.color('#38f2ff', 0.9); band(m, BurnsRound.EYE.y, { th: 1.3, h: 0.09, off: 0.03, seg: A.lo ? 10 : 18 }); m.emissive(0); });

  /* ---- goggles pushed up on the forehead ---- */
  acc('goggles', (m, A, kind) => {
    m.setBone(B.HEAD);
    const brass = kind === 'brass', tut = kind === 'tutu', y = 0.33;
    m.color('#1a1614').shine(1); m.push(); m.tf(0, y, HD.cz, 0, -0.32, 0); { const ph = Math.acos((y - HD.cy) / HD.ry), r = Math.sin(ph); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 1, HD.rz / HD.rx); m.torus(0, 0, 0, HD.rx * r + 0.012, 0.012, { seg: A.lo ? 12 : 22, tseg: 4, sy: 1.4 }); m.pop(); } m.pop();
    for (const sd of [1, -1]) {
      const p = hp(sd * 0.36, 0.98, 0.022);
      m.push(); m.tf(p[0], p[1], p[2], sd * 0.36, Math.PI / 2 - 0.85, 0);
      m.color(brass ? '#b8862a' : '#3a3a3a').shine(2); m.roundCyl(0, -0.02, 0, 0.05, 0.04, 0.012, { seg: A.lo ? 8 : 14 });
      m.color(tut ? '#ff8a2a' : brass ? '#3a3020' : '#ffb040', tut || !brass ? 0.35 : 0.05).shine(3); m.roundCyl(0, 0.012, 0, 0.04, 0.012, 0.005, { seg: A.lo ? 8 : 14 }); m.emissive(0);
      m.pop();
    }
    m.shine(0);
  });
  /* ---- 3D beard + mustache ---- */
  acc('beard3d', (m, A, bd) => {
    m.setBone(B.HEAD);
    const col = bd.col || '#9a9a9a', len = bd.len || 0.06, lump = bd.lumps === undefined ? 0.012 : bd.lumps;
    m.color(col).shine(1);
    const P = [0, 0, 0];
    if (bd.mustacheOnly) { // a huge bushy mustache
      const a = hp(0.42, 2.0, 0.012), c = hp(0, 1.93, 0.03), b = hp(-0.42, 2.0, 0.012);
      m.limb(a[0], a[1] - 0.03, a[2], c[0], c[1], c[2], 0.016, 0.034, { seg: A.lo ? 6 : 10 }); m.limb(c[0], c[1], c[2], b[0], b[1] - 0.03, b[2], 0.034, 0.016, { seg: A.lo ? 6 : 10 });
      m.shine(0); return;
    }
    m.surf(A.lo ? 8 : 16, A.lo ? 4 : 7, (u, v, out) => {
      const th = (u - 0.5) * 2 * 1.45, ph = lerp(1.78, 2.95, v);
      const k = Math.sin(u * Math.PI);                      // thickest at the chin
      let d = 0.006 + (bd.trim ? 0.01 : 0.022) * k + lump * Math.sin(u * 23 + v * 7) * k;
      d = lerp(d, -0.01, BurnsM.smoothstep(0.1, 0.0, Math.min(u, 1 - u)));
      hp(th, ph, d, P);
      const drop = (bd.trim ? 0.3 : 1) * len * k * k * BurnsM.smoothstep(0.3, 1, v);
      out[0] = P[0]; out[1] = P[1] - drop; out[2] = P[2] + drop * 0.35;
    }, { out: [HD.cx, HD.cy + 0.05, HD.cz] });
    if (!bd.noMustache) { const a = hp(0.3, 1.98, 0.014), b = hp(-0.3, 1.98, 0.014), c = hp(0, 1.93, 0.024); m.limb(a[0], a[1] - 0.012, a[2], c[0], c[1], c[2], 0.012, 0.02, { seg: 6 }); m.limb(c[0], c[1], c[2], b[0], b[1] - 0.012, b[2], 0.02, 0.012, { seg: 6 }); }
    m.shine(0);
  });
  /* ---- neck / chest pieces ---- */
  acc('ledNecklace', (m, A) => { const h = A.h, n = A.lo ? 5 : 9, bo = A.lo ? { seg: 6, rings: 4 } : { seg: 10, rings: 5 }; for (let i = 0; i < n; i++) { const a = -1.2 + i / (n - 1) * 2.4, p = A.torsoPt(a * 0.55, 0.455 * h - Math.cos(a) * 0.045, 0.012); m.color(BURNS_NEON[i % 5], 1); m.ball(p[0], p[1], p[2], 0.018, bo); } m.emissive(0); });   // round beads up close (they read as LEDs in close-ups)
  acc('lei', (m, A) => { const h = A.h, n = A.lo ? 7 : 13; for (let i = 0; i < n; i++) { const a = -1.5 + i / (n - 1) * 3, p = A.torsoPt(a * 0.62, 0.45 * h - Math.cos(a) * 0.08, 0.016); m.color(['#ff4f8a', '#ffe24a', '#ff8a2a', '#ffffff'][i % 4]).shine(1); m.ball(p[0], p[1], p[2], 0.03, { seg: 7, rings: 5 }); } m.shine(0); });
  acc('beads', (m, A) => { // layered bead strands with a pendant
    const h = A.h, cols = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff8a2a'];
    for (let s = 0; s < (A.lo ? 1 : 3); s++) { const n = 11 + s * 2; for (let i = 0; i < n; i++) { const a = -1.3 + i / (n - 1) * 2.6, p = A.torsoPt(a * (0.5 + s * 0.06), 0.46 * h - Math.cos(a) * (0.05 + s * 0.035), 0.012); m.color(cols[(i + s) % 5]).shine(2); m.ball(p[0], p[1], p[2], 0.011, { seg: 5, rings: 3 }); } }
    const p = A.torsoPt(0, 0.34 * A.h, 0.014); m.color('#d8b048').shine(3); m.push(); m.tf(p[0], p[1], p[2], 0, Math.PI / 2); m.roundCyl(0, -0.005, 0, 0.025, 0.01, 0.004, { seg: 10 }); m.pop(); m.shine(0);
  });
  acc('bandana', (m, A) => { // paisley neck scarf: a wrap and a triangle on the chest
    const h = A.h, uv = BURNS_ATLAS.pattern('paisley'), col = A.S.bandanaCol || '#8a6a8a';
    m.color(col); m.push(); m.tf(0, 0.475 * h, 0.0, 0, -0.2, 0, 1, 1, 0.82); m.torus(0, 0, 0, 0.082, 0.026, { seg: A.lo ? 10 : 16, tseg: 5 }); m.pop();
    const p0 = A.torsoPt(0.62, 0.47 * h, 0.012), p1 = A.torsoPt(-0.62, 0.47 * h, 0.012), p2 = A.torsoPt(0, 0.31 * h, 0.02);
    m.poly([p1, p0, p2], [[uv.u0, uv.v0], [uv.u1, uv.v0], [(uv.u0 + uv.u1) / 2, uv.v1]], [0, 0.4 * h, 0]);
    m.poly([p0, p1, p2], [[uv.u1, uv.v0], [uv.u0, uv.v0], [(uv.u0 + uv.u1) / 2, uv.v1]], [0, 0.4 * h, 0.3]);
  });
  acc('straps', (m, A) => { // crossbody leather straps
    const h = A.h, col = A.S.strapCol || '#4a2e1a';
    m.color(col).shine(1);
    for (const sd of [1, -1]) {
      const pts = []; for (let i = 0; i <= 5; i++) { const t = i / 5, th = lerp(sd * 0.85, -sd * 0.55, t), y = lerp(0.47, 0.02, t) * h; pts.push(A.torsoPt(th, y, 0.034)); }
      for (let i = 0; i < pts.length - 1; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.014, 0.014, { seg: 5, sx: 1, sz: 0.5 });
      if (A.lo) break;
    }
    if (!A.lo) { m.color('#b8a070').shine(3); const p = A.torsoPt(0.2, 0.3 * h, 0.05); m.ball(p[0], p[1], p[2], 0.016, { seg: 6, rings: 4 }); }
    m.shine(0);
  });
  acc('utilityBelt', (m, A) => { // heavy belt, big round buckle, pouches, tool sheath (HIPS)
    m.setBone(B.HIPS); const w = A.w;
    m.color('#3a2414').shine(1); m.push(); m.tf(0, 0.04, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.176 * w, 0.03, { seg: A.lo ? 10 : 18, tseg: 4, sy: 1.3 }); m.pop();
    m.color('#c8b070').shine(3); m.push(); m.tf(0, 0.04, 0.176 * w * 0.76 + 0.018, 0, Math.PI / 2); m.roundCyl(0, -0.01, 0, 0.04, 0.02, 0.008, { seg: 12 }); m.pop();
    if (!A.lo) {
      m.color('#5a4024').shine(1); for (const [th, s] of [[0.95, 1], [-0.95, 1.1], [2.3, 0.9]]) { const x = Math.sin(th) * 0.19 * w, z = Math.cos(th) * 0.19 * w * 0.76; m.push(); m.tf(x, -0.02, z, th); m.roundBox(0, 0, 0, 0.075 * s, 0.09 * s, 0.045, 0.014); m.color('#6a4a2a'); m.roundBox(0, 0.04 * s, 0.003, 0.08 * s, 0.025, 0.05, 0.01); m.color('#5a4024'); m.pop(); }
      m.color('#4a3018'); const x = Math.sin(-1.9) * 0.19 * w, z = Math.cos(-1.9) * 0.19 * w * 0.76; m.limb(x, 0.02, z, x - 0.02, -0.2, z - 0.01, 0.025, 0.018, { seg: 6 });
    }
    m.shine(0);
  });
  acc('dutyBelt', (m, A) => { // black belt, silver buckle, pouches + radio holster (gate staff, undercover cop)
    m.setBone(B.HIPS); const w = A.w;
    m.color('#121214').shine(1); m.push(); m.tf(0, 0.045, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.174 * w, 0.024, { seg: A.lo ? 10 : 18, tseg: 4, sy: 1.2 }); m.pop();
    m.color('#c8c8d0').shine(3); m.roundBox(0, 0.045, 0.174 * w * 0.76 + 0.016, 0.055, 0.04, 0.012, 0.006);
    if (!A.lo) { m.color('#1a1a1e').shine(1); for (const th of [0.9, -0.9, 2.4]) { const x = Math.sin(th) * 0.19 * w, z = Math.cos(th) * 0.19 * w * 0.76; m.push(); m.tf(x, 0.0, z, th); m.roundBox(0, 0, 0, 0.065, 0.08, 0.045, 0.012); m.pop(); }
      const x = Math.sin(-2.3) * 0.2 * w, z = Math.cos(-2.3) * 0.2 * w * 0.76; m.push(); m.tf(x, -0.02, z, -2.3); m.roundBox(0, 0, 0, 0.06, 0.13, 0.04, 0.012); m.color('#2a2a2e'); m.limb(0.015, 0.06, 0, 0.015, 0.2, 0, 0.006, 0.004, { seg: 4 }); m.pop(); }
    m.shine(0);
  });
  acc('chain', (m, A) => { if (A.lo) return; m.setBone(B.HIPS); const w = A.w; m.color('#c8c8d0').shine(3); const a = [0.12 * w, 0.035, 0.13 * w * 0.76], b = [0.19 * w, -0.08, 0.05], c = [0.17 * w, -0.13, -0.02]; for (let i = 0; i < 6; i++) { const t0 = i / 6, t1 = (i + 1) / 6, P = t => { const q = 1 - t; return [q * q * a[0] + 2 * q * t * b[0] + t * t * c[0], q * q * a[1] + 2 * q * t * b[1] + t * t * c[1], q * q * a[2] + 2 * q * t * b[2] + t * t * c[2]]; }; const p = P(t0), q = P(t1); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.005, 0.005, { seg: 4 }); } m.shine(0); });
  acc('thighStraps', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.THIGH_L : B.THIGH_R); m.color('#121214').shine(1); m.push(); m.tf(0, -0.27 * A.h, 0, 0, 0.12, 0); m.torus(0, 0, 0, 0.074, 0.01, { seg: A.lo ? 8 : 14, tseg: 3, sy: 1.5 }); m.pop(); if (!A.lo) { m.color('#c8c8d0').shine(3); m.ball(sd * 0.075, -0.27 * A.h, 0.01, 0.009, { seg: 5, rings: 3 }); } } m.shine(0); });
  acc('kandi', (m, A) => { // stacks of colourful bracelets on both wrists
    const cols = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff8a2a', '#9a6bff'];
    for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.FARM_L : B.FARM_R); for (let i = 0; i < (A.lo ? 1 : 3); i++) { m.color(cols[(i * 2 + (sd > 0 ? 0 : 3)) % 6]).shine(2); m.push(); m.tf(0, -0.205 + i * 0.02, 0); m.torus(0, 0, 0, 0.047, 0.009, { seg: 10, tseg: 3 }); m.pop(); } }
    m.shine(0);
  });
  acc('bracelets', () => {}); // built with the arms
  acc('kneepads', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.SHIN_L : B.SHIN_R); m.color(A.S.kneeCol || '#c8a878').shine(1); m.push(); m.tf(0, -0.02, 0.06, 0, -0.15); m.ellipsoid(0, 0, 0, 0.068, 0.085, 0.035, { seg: A.lo ? 8 : 12, rings: A.lo ? 5 : 7 }); m.pop(); if (!A.lo) { m.color('#3a2414'); m.push(); m.tf(0, -0.02, 0); m.torus(0, 0, 0, 0.07, 0.008, { seg: 12, tseg: 3 }); m.pop(); } } m.shine(0); });
  acc('kneeBrace', (m, A) => { m.setBone(B.SHIN_L); m.color('#1a1a22').shine(1); m.lathe([[0.07, -0.08], [0.075, -0.03], [0.075, 0.03], [0.07, 0.06]], { seg: A.lo ? 8 : 12 }); if (!A.lo) { m.color('#c8c8d0').shine(3); for (const sd of [1, -1]) m.limb(sd * 0.072, -0.07, 0, sd * 0.072, 0.05, 0, 0.007, 0.007, { seg: 4 }); m.color('#3a3a44'); m.push(); m.tf(0, 0, 0.074, 0, Math.PI / 2); m.torus(0, 0, 0, 0.025, 0.008, { seg: 10, tseg: 3 }); m.pop(); } m.shine(0); });
  acc('messenger', (m, A) => { // canvas messenger bag at the hip on a crossbody strap
    const h = A.h; m.color('#3a2a1a');
    const a = A.torsoPt(-0.85, 0.47 * h, 0.03), b = A.torsoPt(0.6, 0.15 * h, 0.05); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.012, 0.012, { seg: 4 });
    m.setBone(B.HIPS); const x = 0.2 * A.w, z = 0.04; m.color('#c8b088').shine(0); m.push(); m.tf(x + 0.04, -0.06, z, Math.PI / 2 - 0.2); m.roundBox(0, 0, 0, 0.24, 0.18, 0.07, 0.025); m.color('#b8a078'); m.roundBox(0, 0.045, 0.012, 0.245, 0.1, 0.075, 0.02);
    if (!A.lo) { m.color('#3a6aa0'); m.push(); m.tf(0, 0.04, 0.05, 0, Math.PI / 2); m.roundCyl(0, -0.003, 0, 0.03, 0.006, 0.002, { seg: 10 }); m.pop(); }
    m.pop();
  });
  acc('backpack', (m, A) => { // black backpack with straps
    const h = A.h, col = A.S.packCol || '#121214'; m.color(col).shine(1);
    for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.55, 0.46 * h, 0.012), b = A.torsoPt(sd * 0.45, 0.12 * h, 0.022); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.014, 0.014, { seg: 4, sz: 0.5 }); }
    m.roundBox(0, 0.27 * h, -A.torsoR(0.27 * h) * A.TZ - 0.07, 0.28, 0.34 * h, 0.13, 0.05);
    if (!A.lo) { m.color(shade(col, 0.08)); m.roundBox(0, 0.18 * h, -A.torsoR(0.2 * h) * A.TZ - 0.14, 0.22, 0.14, 0.04, 0.02); }
    m.shine(0);
  });
  acc('crossbag', (m, A) => { const h = A.h; m.color('#5a3a22'); const a = A.torsoPt(0.85, 0.47 * h, 0.03), b = A.torsoPt(-0.6, 0.1 * h, 0.05); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.012, 0.012, { seg: 4 }); m.setBone(B.HIPS); m.color('#6a4a2a'); m.push(); m.tf(-0.21 * A.w, -0.03, 0.05, -Math.PI / 2 + 0.3); m.roundBox(0, 0, 0, 0.16, 0.13, 0.06, 0.022); m.pop(); });
  acc('spikedBand', (m, A) => { m.setBone(B.FARM_R); m.color('#1a1a1e').shine(1); m.lathe([[0.052, -0.2], [0.054, -0.17], [0.05, -0.15]], { seg: 10 }); if (!A.lo) { m.color('#d8d8e0').shine(3); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.limb(Math.sin(a) * 0.05, -0.175, Math.cos(a) * 0.05, Math.sin(a) * 0.072, -0.175, Math.cos(a) * 0.072, 0.009, 0.001, { seg: 4 }); } } m.shine(0); });
  acc('cast', (m, A) => { // white plaster cast on the right forearm
    m.setBone(B.FARM_R); m.color('#f4f0e8').shine(1); m.limb(0, 0.02, 0, 0, -0.2, 0, 0.068, 0.06, { seg: A.lo ? 8 : 12 }); m.ellipsoid(0, -0.26, 0.004, 0.04, 0.05, 0.052, { seg: 8, rings: 6 });
    if (!A.lo) { m.color('#ff4fd8'); m.limb(-0.03, -0.06, 0.064, 0.02, -0.12, 0.062, 0.004, 0.004, { seg: 3 }); m.color('#3a6aff'); m.limb(0.03, -0.03, 0.06, 0.035, -0.14, 0.058, 0.004, 0.004, { seg: 3 }); }
    m.shine(0);
  });
  acc('goldChain', (m, A) => { const h = A.h, n = A.lo ? 6 : 14; m.color('#e8b830').shine(3); let prev = null; for (let i = 0; i <= n; i++) { const a = -1.25 + i / n * 2.5, p = A.torsoPt(a * 0.55, 0.47 * h - Math.cos(a) * 0.1, 0.018); if (prev) m.limb(prev[0], prev[1], prev[2], p[0], p[1], p[2], 0.008, 0.008, { seg: 4 }); prev = p; } const p = A.torsoPt(0, 0.355 * h, 0.03); m.push(); m.tf(p[0], p[1], p[2], 0, Math.PI / 2); m.roundCyl(0, -0.006, 0, 0.045, 0.012, 0.005, { seg: 12 }); m.pop(); m.shine(0); });
  acc('badge', (m, A) => { const p = A.torsoPt(0.42, 0.34 * A.h, 0.045); m.color('#e8c040', 0.2).shine(3); m.push(); m.tf(p[0], p[1], p[2], 0.42, Math.PI / 2); const st = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 0.02 : 0.04; st.push([Math.sin(a) * r, 0, Math.cos(a) * r]); } m.poly(st, null, [0, -1, 0]); m.roundCyl(0, -0.006, 0, 0.022, 0.008, 0.003, { seg: 8 }); m.pop(); m.emissive(0); m.shine(0); });
  acc('watch', (m, A) => { m.setBone(B.FARM_L); m.color('#1a1a1e').shine(1); m.push(); m.tf(0, -0.19, 0); m.torus(0, 0, 0, 0.046, 0.01, { seg: 10, tseg: 3 }); m.pop(); m.color('#d8d8e0').shine(3); m.push(); m.tf(0.05, -0.19, 0, 0, 0, -Math.PI / 2); m.roundCyl(0, -0.006, 0, 0.022, 0.012, 0.004, { seg: 10 }); m.pop(); m.shine(0); });
  acc('wings', (m, A) => { const h = A.h; m.color('#f0e0ff', 0.3).shine(2); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.1, 0.35 * h, -0.14, sd * 0.55, 0, sd * 0.25); m.ellipsoid(sd * 0.17, 0.08, 0, 0.18, 0.13, 0.01, { seg: 12, rings: 5 }); m.ellipsoid(sd * 0.13, -0.11, 0, 0.12, 0.09, 0.01, { seg: 10, rings: 5 }); m.pop(); } m.emissive(0); m.shine(0); });
  acc('cape', (m, A) => { const h = A.h, w = A.w, c = BURNS_NEON[(A.S.seed || 0) % 7], prof = [[0.3 * w, -0.42], [0.25 * w, -0.05], [0.21 * w, 0.3 * h], [0.15 * w, 0.47 * h]]; m.color(c); m.lathe(prof, { seg: A.lo ? 6 : 10, theta0: Math.PI - 1.05, theta1: Math.PI + 1.05, sz: 0.75 }); m.color(shade(c, -0.35)); m.lathe(prof.map(p => [p[0] - 0.01, p[1]]), { seg: A.lo ? 6 : 10, theta0: Math.PI - 1.05, theta1: Math.PI + 1.05, sz: 0.75, flip: true }); });
  acc('toolbelt', (m, A) => { m.setBone(B.HIPS); const w = A.w; m.color('#5a3a1a'); m.push(); m.tf(0, 0.04, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.178 * w, 0.025, { seg: A.lo ? 10 : 16, tseg: 4, sy: 1.3 }); m.pop(); if (!A.lo) { m.color('#9a9a9a').shine(2); m.roundBox(0.18 * w, -0.04, 0.08, 0.05, 0.12, 0.06, 0.012); m.color('#c83a2a'); m.roundBox(-0.18 * w, -0.03, 0.08, 0.045, 0.1, 0.05, 0.012); m.shine(0); } });
  acc('headset', (m, A) => { m.setBone(B.HEAD); m.color('#1a1a1a').shine(1); m.push(); m.tf(0, HD.cy + 0.01, HD.cz - 0.01, 0, 0, Math.PI / 2, 1, 1, 1); m.torus(0, 0, 0, 0.215, 0.012, { seg: 16, tseg: 4 }); m.pop(); const p = hp(Math.PI / 2, 1.66, 0.02); m.push(); m.tf(p[0], p[1], p[2], 0, 0, Math.PI / 2); m.roundCyl(0, -0.015, 0, 0.045, 0.035, 0.012, { seg: 10 }); m.pop(); if (!A.lo) m.limb(p[0], p[1] - 0.02, p[2] + 0.02, 0.06, 0.1, 0.17, 0.006, 0.006, { seg: 4 }); m.shine(0); });
  acc('earbuds', (m, A) => { m.setBone(B.HEAD); m.color('#ffffff').shine(2); for (const sd of [1, -1]) { const p = hp(sd * Math.PI / 2, 1.68, 0.02); m.ball(p[0], p[1], p[2], 0.016, { seg: 6, rings: 4 }); } m.shine(0); });
  acc('gloves', () => {}); // spec.gloves colour handles the hands
  /* ---- fire spinner kit ---- */
  acc('fireHood', (m, A) => { // close knit hood over the whole head, orange visor slit
    m.setBone(B.HEAD); const kn = BURNS_ATLAS.pattern('knit'), col = A.S.hoodCol || '#5a4636';
    m.color(col);
    m.ellipsoid(HD.cx, HD.cy + 0.005, HD.cz - 0.004, HD.rx + 0.014, HD.ry + 0.016, HD.rz + 0.012, { seg: A.lo ? 12 : 20, rings: A.lo ? 8 : 13, theta0: -Math.PI, theta1: Math.PI, uvFn: (x, y, z) => [lerp(kn.u0, kn.u1, A.pp(Math.atan2(x, z) / Math.PI * 2.5)), lerp(kn.v0, kn.v1, clamp(0.5 - y * 2.2, 0, 1))] });
    m.lathe([[0.075, -0.09], [0.11, -0.02], [0.12, 0.04], [0.09, 0.075]], { seg: A.lo ? 10 : 16, sz: 0.9, uv: kn });
    m.color('#ff8a2a', 0.85).shine(3); band(m, BurnsRound.EYE.y + 0.004, { th: 0.85, h: 0.036, off: 0.03, seg: A.lo ? 8 : 14 }); m.emissive(0); m.shine(0);
  });
  acc('sunMedallion', (m, A) => { const p = A.torsoPt(0, 0.36 * A.h, 0.04); m.color('#ffb020', 0.3).shine(3); m.push(); m.tf(p[0], p[1], p[2], 0, Math.PI / 2); m.roundCyl(0, -0.008, 0, 0.05, 0.016, 0.006, { seg: 14 }); if (!A.lo) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; m.limb(Math.sin(a) * 0.05, 0.004, Math.cos(a) * 0.05, Math.sin(a) * 0.08, 0.004, Math.cos(a) * 0.08, 0.008, 0.002, { seg: 3 }); } m.pop(); m.emissive(0); m.shine(0); });
  acc('flameWings', (m, A) => { // flame-shaped feathered wings rising behind the shoulders
    const h = A.h, cols = ['#ff5a1a', '#ff8a2a', '#ffb030', '#ffe24a'];
    for (const sd of [1, -1]) for (let i = 0; i < (A.lo ? 3 : 6); i++) {
      const a = 0.2 + i * 0.22, L = 0.42 - i * 0.035, x0 = sd * 0.1, y0 = 0.4 * h, z0 = -0.12;
      m.color(cols[i % 4], 0.45 + i * 0.05);
      m.limb(x0, y0, z0, x0 + sd * Math.sin(a) * L, y0 + Math.cos(a) * L, z0 - 0.08, 0.035, 0.004, { seg: 5, sx: 1, sz: 0.35 });
    }
    m.emissive(0);
  });
  acc('bracers', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.FARM_L : B.FARM_R); m.color('#c8ccd8').shine(3); m.lathe([[0.056, -0.19], [0.062, -0.14], [0.064, -0.07], [0.058, -0.03]], { seg: A.lo ? 8 : 12 }); if (!A.lo) { m.color('#6a4a2a').shine(1); m.push(); m.tf(0, -0.11, 0); m.torus(0, 0, 0, 0.066, 0.006, { seg: 12, tseg: 3 }); m.pop(); m.setBone(sd > 0 ? B.UARM_L : B.UARM_R); m.push(); m.tf(0, -0.12, 0); m.torus(0, 0, 0, 0.06, 0.008, { seg: 12, tseg: 3 }); m.pop(); } } m.shine(0); });
  acc('sash', (m, A) => { const h = A.h, uv = BURNS_ATLAS.pattern('paisley'); m.color('#8a3a1a'); const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(A.torsoPt(lerp(0.8, -0.5, t), lerp(0.45, 0.02, t) * h, 0.03)); } for (let i = 0; i < 4; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.022, 0.022, { seg: 5, sz: 0.4, uv }); });
  acc('flameTassets', (m, A) => { // flame-patterned cloth panels hanging front and back from the belt
    m.setBone(B.HIPS); const uv = BURNS_ATLAS.pattern('flamecloth'), w = A.w;
    m.color('#c83a10').shine(0); m.push(); m.tf(0, 0.045, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.175 * w, 0.022, { seg: A.lo ? 10 : 16, tseg: 4 }); m.pop();
    m.color('#d8d8e0').shine(3); m.push(); m.tf(0, 0.045, 0.175 * w * 0.76 + 0.014, 0, Math.PI / 2); m.roundCyl(0, -0.008, 0, 0.032, 0.016, 0.006, { seg: 12 }); m.pop(); m.shine(0);
    for (const th of A.lo ? [0, Math.PI] : [0, 0.5, -0.5, Math.PI, Math.PI - 0.55, Math.PI + 0.55]) {
      const x = Math.sin(th) * 0.18 * w, z = Math.cos(th) * 0.18 * w * 0.8;
      m.push(); m.tf(x, 0.02, z, th, 0.12); m.color('#ff8a2a');
      m.poly([[0.055, 0, 0.006], [-0.055, 0, 0.006], [-0.04, -0.42, 0.03], [0, -0.48, 0.03], [0.04, -0.42, 0.03]], [[uv.u1, uv.v0], [uv.u0, uv.v0], [uv.u0 + (uv.u1 - uv.u0) * 0.15, uv.v1], [(uv.u0 + uv.u1) / 2, uv.v1], [uv.u0 + (uv.u1 - uv.u0) * 0.85, uv.v1]], [0, -0.2, -1]);
      m.poly([[-0.055, 0, 0.002], [0.055, 0, 0.002], [0.04, -0.42, 0.026], [0, -0.48, 0.026], [-0.04, -0.42, 0.026]], null, [0, -0.2, 1]);
      m.pop();
    }
  });
  acc('kneeMedallions', (m, A) => { for (const sd of [1, -1]) { m.setBone(sd > 0 ? B.SHIN_L : B.SHIN_R); m.push(); m.tf(0, -0.02, 0.062, 0, Math.PI / 2 - 0.15); m.color('#ff8a1a', 0.15).shine(3); m.roundCyl(0, -0.01, 0, 0.06, 0.022, 0.01, { seg: A.lo ? 8 : 14 }); if (!A.lo) { m.color('#ffd060').shine(3); m.torus(0, 0.01, 0, 0.042, 0.008, { seg: 12, tseg: 3 }); } m.pop(); m.emissive(0); } m.shine(0); });
  /* ---- gate staff / cop / darkwad bits ---- */
  acc('elwire', (m, A) => { // glowing EL wire taped along the body (a lit-up darkwad)
    const c = A.S.elCol || '#38f2ff'; m.color(c, 1);
    const h = A.h; m.push(); m.tf(0, 0.03, 0, 0, 0, 0, 1, 1, A.TZ + 0.06); m.torus(0, 0, 0, 0.18 * A.w, 0.008, { seg: 16, tseg: 3 }); m.pop();
    const p0 = A.torsoPt(0.4, 0.05, 0.01), p1 = A.torsoPt(0.2, 0.44 * h, 0.01), p2 = A.torsoPt(-0.4, 0.05, 0.01), p3 = A.torsoPt(-0.2, 0.44 * h, 0.01); m.limb(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 0.007, 0.007, { seg: 3 }); m.limb(p2[0], p2[1], p2[2], p3[0], p3[1], p3[2], 0.007, 0.007, { seg: 3 });
    for (const [b, L, r] of [[B.UARM_L, -0.24, 0.07], [B.UARM_R, -0.24, 0.07], [B.FARM_L, -0.2, 0.06], [B.FARM_R, -0.2, 0.06], [B.THIGH_L, -0.38, 0.1], [B.THIGH_R, -0.38, 0.1], [B.SHIN_L, -0.34, 0.085], [B.SHIN_R, -0.34, 0.085]]) { m.setBone(b); m.limb(0, -0.02, r, 0, L, r * 0.85, 0.007, 0.007, { seg: 3 }); }
    m.emissive(0);
  });
  /* ---- costume pieces ---- */
  acc('spaceHelmet', (m, A) => {
    m.setBone(B.HEAD); m.color('#e8eef8').shine(2);
    const rx = HD.rx + 0.045, ry = HD.ry + 0.045, rz = HD.rz + 0.045;
    m.ellipsoid(HD.cx, HD.cy, HD.cz, rx, ry, rz, { seg: A.lo ? 12 : 20, rings: 4, phi1: 0.92 });
    m.ellipsoid(HD.cx, HD.cy, HD.cz, rx, ry, rz, { seg: A.lo ? 8 : 12, rings: A.lo ? 4 : 7, phi0: 0.92, phi1: 2.45, theta0: 1.05, theta1: TAU - 1.05 });
    m.ellipsoid(HD.cx, HD.cy, HD.cz, rx, ry, rz, { seg: A.lo ? 12 : 20, rings: 3, phi0: 2.45, phi1: 2.85 });
    m.color('#9aa0b0'); m.push(); m.tf(0, -0.01, HD.cz); m.torus(0, 0, 0, 0.17, 0.03, { seg: A.lo ? 12 : 18, tseg: 5 }); m.pop();
    if (!A.lo) { m.color('#9aa0b0'); m.limb(0.12, 0.38, -0.05, 0.13, 0.62, -0.06, 0.008, 0.006, { seg: 4 }); m.color('#ff4fd8', 1); m.ball(0.13, 0.64, -0.06, 0.03, { seg: 8, rings: 5 }); m.emissive(0); }
    m.shine(0);
  });
  acc('spacePack', (m, A) => { m.setBone(B.CHEST); const h = A.h; m.color('#d0d8e8').shine(2); m.roundBox(0, 0.3 * h, -A.torsoR(0.3 * h) * A.TZ - 0.075, 0.3, 0.36, 0.14, 0.05); m.shine(0); if (!A.lo) { const zb = -A.torsoR(0.3 * h) * A.TZ - 0.148; m.color('#38f2ff', 1); m.ball(0.08, 0.38 * h, zb, 0.022, { seg: 6, rings: 4 }); m.color('#ff4fd8', 1); m.ball(-0.08, 0.38 * h, zb, 0.022, { seg: 6, rings: 4 }); m.color('#7aff5a', 1); m.limb(-0.08, 0.26 * h, zb, 0.08, 0.26 * h, zb, 0.01, 0.01, { seg: 4 }); m.color('#38f2ff', 1); for (const sd of [1, -1]) { const p0 = A.torsoPt(sd * 0.55, 0.12 * h, 0.006), p1 = A.torsoPt(sd * 0.55, 0.44 * h, 0.006); m.limb(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 0.008, 0.008, { seg: 4 }); } m.emissive(0); } });
  acc('unicornHood', (m, A) => {
    m.setBone(B.HEAD); m.color('#f6f0ff');
    const rx = HD.rx + 0.03, ry = HD.ry + 0.03, rz = HD.rz + 0.03;
    m.ellipsoid(HD.cx, HD.cy, HD.cz, rx, ry, rz, { seg: A.lo ? 12 : 20, rings: 4, phi1: 0.95 });
    m.ellipsoid(HD.cx, HD.cy, HD.cz, rx, ry, rz, { seg: A.lo ? 8 : 12, rings: A.lo ? 4 : 7, phi0: 0.95, phi1: 2.55, theta0: 1.15, theta1: TAU - 1.15 });
    m.color('#ffd84a', 0.3).shine(3); m.push(); m.tf(0, 0.39, 0.1, 0, 0.5, 0); m.lathe([[0.05, 0], [0.04, 0.08], [0.025, 0.17], [0, 0.27]], { seg: A.lo ? 6 : 10, rMod: (th, t) => 1 + 0.12 * Math.sin(th * 2 + t * 18) }); m.pop(); m.emissive(0); m.shine(0);
    m.color('#ffb0e0'); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.12, 0.39, -0.01, 0, 0, -sd * 0.35); m.lathe([[0.035, 0], [0.025, 0.06], [0, 0.11]], { seg: 6, sz: 0.5 }); m.pop(); }
    ['#ff3b5c', '#ff8a2a', '#ffe24a', '#7aff5a', '#38c8ff', '#9a6bff'].forEach((c, i) => { const p = hp(Math.PI, 0.45 + i * 0.26, 0.04); m.color(c); m.ball(p[0], p[1], p[2], 0.038, { seg: 7, rings: 5 }); });
  });
  acc('pirateKit', (m, A) => { // sash + sword
    m.setBone(B.HIPS); const w = A.w;
    m.color('#c8202a'); m.push(); m.tf(0, 0.05, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.18 * w, 0.035, { seg: A.lo ? 10 : 16, tseg: 4 }); m.pop();
    if (!A.lo) { m.limb(0.1, 0.03, 0.14, 0.13, -0.2, 0.15, 0.025, 0.015, { seg: 6, sz: 0.4 }); m.color('#c8c8d0').shine(3); m.push(); m.tf(-0.2 * w, -0.1, 0.06, 0, 0, 0.35); m.limb(0, 0, 0, 0, -0.42, 0, 0.012, 0.004, { seg: 5, sx: 1, sz: 0.3 }); m.color('#d8a020'); m.torus(0, 0.02, 0, 0.04, 0.008, { seg: 10, tseg: 3 }); m.pop(); m.shine(0); }
  });

  /* ================= hats ================= */
  const crownOn = (m, y, tilt) => { m.push(); m.tf(0, y, HD.cz - 0.012, 0, tilt || -0.08, 0); };
  hat('cowboy', (m, A, H) => {
    const c = H.col; crownOn(m, 0.34);
    m.color(c);
    const brim = (flip) => m.surf(A.lo ? 12 : 22, 3, (u, v, o) => { const th = u * TAU, r = lerp(0.15, 0.33, v), curl = Math.pow(v, 2) * 0.075 * Math.pow(Math.abs(Math.sin(th)), 1.5) - 0.018 * v * Math.pow(Math.cos(th), 2); o[0] = Math.sin(th) * r; o[1] = curl + (flip ? -0.012 : 0); o[2] = Math.cos(th) * r; }, { wrapU: true, flip: !flip, out: false });
    brim(false); m.color(shade(c, -0.12)); brim(true); m.color(c);
    m.lathe([[0.15, -0.01], [0.155, 0.06], [0.15, 0.13], [0.12, 0.175], [0.05, 0.185], [0, 0.18]], { seg: A.lo ? 10 : 16, sz: 1.05, rMod: (th, t) => 1 - 0.13 * Math.pow(Math.max(0, Math.cos(th)), 6) * BurnsM.smoothstep(0.4, 1, t) });
    m.color(shade(c, -0.4)); m.push(); m.tf(0, 0.035, 0, 0, 0, 0, 1, 1, 1.05); m.torus(0, 0, 0, 0.155, 0.014, { seg: A.lo ? 10 : 16, tseg: 4 }); m.pop();
    m.pop();
  });
  hat('hardhat', (m, A, H) => { const c = H.col; m.color(c).shine(2); m.ellipsoid(0, 0.3, HD.cz - 0.005, 0.212, 0.165, 0.226, { phi1: Math.PI / 2, seg: A.lo ? 12 : 18, rings: A.lo ? 4 : 7 }); m.push(); m.tf(0, 0.3, HD.cz - 0.005); m.lathe([[0.212, 0.012], [0.25, -0.004], [0.254, -0.016], [0.212, -0.01]], { seg: A.lo ? 12 : 18, sz: 1.07 }); m.pop(); if (!A.lo) { m.color(shade(c, -0.12)); m.limb(0, 0.465, -0.17, 0, 0.47, 0.17, 0.018, 0.018, { seg: 6 }); } m.shine(0); });
  hat('cap', (m, A, H) => { const c = H.col; m.color(c); m.ellipsoid(0, 0.32, HD.cz - 0.01, 0.198, 0.13, 0.205, { phi1: Math.PI / 2, seg: A.lo ? 12 : 18, rings: A.lo ? 4 : 7 }); m.color(shade(c, -0.08)); m.push(); m.tf(0, 0.328, 0.17, 0, 0.12); m.ellipsoid(0, 0, 0, 0.16, 0.012, 0.13, { theta0: -Math.PI / 2, theta1: Math.PI / 2, seg: A.lo ? 6 : 12, rings: 4 }); m.ellipsoid(0, -0.001, 0, 0.16, 0.012, 0.13, { theta0: -Math.PI / 2, theta1: Math.PI / 2, phi0: Math.PI / 2, phi1: Math.PI, seg: A.lo ? 6 : 12, rings: 2 }); m.pop(); if (!A.lo) { m.color(c); m.ball(0, 0.45, HD.cz - 0.01, 0.016, { seg: 6, rings: 4 }); } });
  hat('ranger', (m, A, H) => { const c = H.col; crownOn(m, 0.335, -0.02); m.color(c); m.lathe([[0.15, 0.012], [0.3, 0.0], [0.305, -0.012], [0.15, -0.006]], { seg: A.lo ? 12 : 20 }); m.lathe([[0.15, 0.0], [0.15, 0.08], [0.12, 0.15], [0.02, 0.19], [0, 0.19]], { seg: A.lo ? 8 : 16, rMod: (th, t) => 1 - 0.14 * Math.pow(Math.abs(Math.cos(th * 2)), 4) * BurnsM.smoothstep(0.3, 1, t) }); m.color('#3a2a1a'); m.push(); m.tf(0, 0.025, 0); m.torus(0, 0, 0, 0.152, 0.014, { seg: 16, tseg: 4 }); m.pop(); m.pop(); });
  hat('tophat', (m, A, H) => { const c = H.col; crownOn(m, 0.34); m.color(c).shine(1); m.lathe([[0.15, 0.012], [0.26, 0.008], [0.262, -0.008], [0.15, -0.006]], { seg: A.lo ? 12 : 20 }); m.roundCyl(0, 0, 0, 0.152, 0.28, 0.02, { seg: A.lo ? 10 : 16 }); m.color(BURNS_NEON[(A.S.seed || 0) % 7]); m.push(); m.tf(0, 0.04, 0); m.torus(0, 0, 0, 0.155, 0.02, { seg: 16, tseg: 4, sy: 1.6 }); m.pop(); m.shine(0); m.pop(); });
  hat('furhat', (m, A, H) => { const c = H.col; m.color(c); m.surf(A.lo ? 10 : 18, A.lo ? 5 : 9, (u, v, o) => { const th = u * TAU, ph = v * 1.7, r = 1 + 0.07 * Math.sin(th * 7 + v * 5) * Math.sin(v * 3); o[0] = Math.sin(ph) * Math.sin(th) * 0.235 * r; o[1] = 0.36 + Math.cos(ph) * 0.15 * r; o[2] = HD.cz - 0.015 + Math.sin(ph) * Math.cos(th) * 0.24 * r; }, { wrapU: true, out: [0, 0.3, 0], uvFn: (u, v) => { const R = BURNS_ATLAS.pattern('fur'); return [lerp(R.u0, R.u1, A.pp(u * 6)), lerp(R.v0, R.v1, v)]; } }); });
  hat('bandana', (m, A, H) => { const c = H.col; m.color(c); A.hairCap({ front: 0.7, side: 1.25, sideburn: 1.35, back: 1.95, vol: 0.03, uv: BURNS_ATLAS.pattern('paisley') }); if (!A.lo) { const p = hp(Math.PI, 1.85, 0.03); m.ellipsoid(p[0], p[1], p[2] - 0.01, 0.04, 0.03, 0.03, { seg: 8, rings: 5 }); m.limb(p[0], p[1], p[2] - 0.02, p[0] + 0.03, p[1] - 0.11, p[2] - 0.04, 0.022, 0.008, { seg: 5, sz: 0.4 }); m.limb(p[0], p[1], p[2] - 0.02, p[0] - 0.03, p[1] - 0.1, p[2] - 0.05, 0.02, 0.008, { seg: 5, sz: 0.4 }); } });
  hat('tricorn', (m, A, H) => { const c = H.col; crownOn(m, 0.35); m.color(c); m.lathe([[0.15, 0], [0.15, 0.08], [0.12, 0.13], [0, 0.14]], { seg: A.lo ? 10 : 16 }); const brim = flip => m.surf(A.lo ? 12 : 24, 3, (u, v, o) => { const th = u * TAU + Math.PI, lobe = Math.pow(Math.max(0, Math.cos(th * 3)), 0.6), r = lerp(0.15, 0.3, v) * (1 - 0.25 * (1 - lobe) * v); o[0] = Math.sin(th) * r; o[1] = v * v * 0.14 * (1 - lobe * 0.6) + (flip ? -0.012 : 0); o[2] = Math.cos(th) * r; }, { wrapU: true, flip: !flip }); brim(false); m.color(shade(c, -0.1)); brim(true); if (!A.lo) { m.color('#d8a020').shine(3); m.roundBox(0, 0.12, 0.2, 0.07, 0.05, 0.012, 0.01); m.shine(0); } m.pop(); });
  hat('sunhat', (m, A, H) => { // floppy wide-brim sun hat with sparkle
    const c = H.col, sq = BURNS_ATLAS.pattern('sequin'); crownOn(m, 0.345, -0.1); m.color(c).shine(2);
    const brim = flip => m.surf(A.lo ? 14 : 28, 4, (u, v, o) => { const th = u * TAU, r = lerp(0.15, 0.42, v), droop = -0.07 * Math.pow(v, 1.6) + 0.025 * Math.sin(th * 5) * v * v; o[0] = Math.sin(th) * r; o[1] = droop + (flip ? -0.012 : 0); o[2] = Math.cos(th) * r; }, { wrapU: true, flip: !flip, uvFn: flip ? null : ((u, v) => [lerp(sq.u0, sq.u1, A.pp(u * 8)), lerp(sq.v0, sq.v1, v)]) });
    brim(false); m.color(shade(c, -0.15)); brim(true); m.color(c);
    m.lathe([[0.15, 0], [0.152, 0.07], [0.125, 0.13], [0.05, 0.15], [0, 0.15]], { seg: A.lo ? 10 : 16 });
    const rb = ['#ff3b5c', '#ffe24a', '#38c8ff', '#7aff5a']; for (let i = 0; i < (A.lo ? 1 : 4); i++) { m.color(rb[i]); m.push(); m.tf(0, 0.015 + i * 0.012, 0); m.torus(0, 0, 0, 0.153, 0.007, { seg: 16, tseg: 3 }); m.pop(); }
    m.shine(0); m.pop();
  });
  hat('fedora', (m, A, H) => { // straw fedora
    const c = H.col, cv = BURNS_ATLAS.pattern('canvas'); crownOn(m, 0.34, -0.06); m.color(c);
    const brim = flip => m.surf(A.lo ? 12 : 22, 3, (u, v, o) => { const th = u * TAU, r = lerp(0.15, 0.275, v), up = 0.04 * v * v * (0.5 + 0.5 * Math.cos(th + Math.PI)) - 0.012 * v; o[0] = Math.sin(th) * r; o[1] = up + (flip ? -0.01 : 0); o[2] = Math.cos(th) * r; }, { wrapU: true, flip: !flip, uvFn: (u, v) => [lerp(cv.u0, cv.u1, A.pp(u * 6)), lerp(cv.v0, cv.v1, v)] });
    brim(false); m.color(shade(c, -0.1)); brim(true); m.color(c);
    m.lathe([[0.15, 0], [0.152, 0.08], [0.14, 0.14], [0.09, 0.165], [0, 0.15]], { seg: A.lo ? 10 : 16, sz: 1.08, uv: cv, rMod: (th, t) => 1 - 0.1 * Math.pow(Math.max(0, Math.cos(th)), 4) * BurnsM.smoothstep(0.5, 1, t) });
    m.color(H.band || '#3a2a1a'); m.push(); m.tf(0, 0.03, 0, 0, 0, 0, 1, 1, 1.08); m.torus(0, 0, 0, 0.153, 0.014, { seg: 16, tseg: 4, sy: 1.4 }); m.pop();
    m.pop();
  });
  hat('jester', (m, A, H) => { // multicoloured jester hat with bells
    const cols = H.cols || ['#c8202a', '#ffd21a', '#5a2aa0', '#2a9a4a'];
    m.color(cols[0]); A.hairCap({ front: 0.7, side: 1.2, sideburn: 1.35, back: 1.9, vol: 0.035 });
    const dirs = [[-1, 0.2], [0, -0.35], [1, 0.2]];
    dirs.forEach(([sx, sz], i) => {
      const a = [sx * 0.08, 0.38, HD.cz + sz * 0.15], b = [sx * 0.22, 0.52, HD.cz + sz * 0.35], c = [sx * 0.32, 0.4, HD.cz + sz * 0.5];
      m.color(cols[(i + 1) % cols.length]); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.06, 0.04, { seg: A.lo ? 6 : 10 }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.04, 0.012, { seg: A.lo ? 6 : 10 });
      m.color('#ffd84a', 0.2).shine(3); m.ball(c[0], c[1] - 0.02, c[2], 0.03, { seg: 8, rings: 5 }); m.emissive(0); m.shine(0);
    });
    m.color(cols[1]); m.push(); m.tf(0, 0.3, HD.cz, 0, -0.2); m.torus(0, 0, 0, 0.192, 0.022, { seg: A.lo ? 12 : 20, tseg: 4 }); m.pop();
  });

  /* ================= held props (PROP bone = right hand; prop2 uses the left hand) ================= */
  prop('clipboard', m => { m.color('#8a6a3a'); m.roundBox(0, 0.02, 0.06, 0.2, 0.27, 0.016, 0.01); m.color('#f4f4ec'); m.roundBox(0, 0.0, 0.069, 0.17, 0.22, 0.006, 0.003); m.color('#9a9aa0').shine(3); m.roundBox(0, 0.14, 0.07, 0.07, 0.03, 0.022, 0.008); m.shine(0); });
  prop('phone', m => { m.color('#1a1a22').shine(3); m.roundBox(0, 0.02, 0.06, 0.075, 0.14, 0.012, 0.01); m.color('#5ab0ff', 0.9); m.roundBox(0, 0.02, 0.0665, 0.065, 0.12, 0.003, 0.004); m.emissive(0); m.shine(0); });
  prop('bell', (m, A) => { m.color('#6a4a2a'); m.limb(0, 0.12, 0.02, 0, -0.02, 0.02, 0.016, 0.016, { seg: 6 }); m.color('#ffd84a', 0.15).shine(3); m.push(); m.tf(0, -0.03, 0.02); m.lathe([[0.1, -0.14], [0.085, -0.11], [0.06, -0.06], [0.05, -0.02], [0.03, 0.0], [0, 0.005]], { seg: A.lo ? 8 : 14 }); m.pop(); m.emissive(0); m.color('#6a5a2a'); m.ball(0, -0.16, 0.02, 0.02, { seg: 6, rings: 4 }); m.shine(0); });
  prop('coffee', (m, A) => { m.color('#f4f0e8'); m.push(); m.tf(0, -0.07, 0.06); m.lathe([[0, 0], [0.042, 0], [0.05, 0.12], [0, 0.12]], { seg: A.lo ? 8 : 12 }); m.color('#6a3a1a'); m.lathe([[0.046, 0.04], [0.048, 0.08]], { seg: A.lo ? 8 : 12 }); m.color('#e8e0d8'); m.lathe([[0.052, 0.12], [0.05, 0.135], [0, 0.14]], { seg: A.lo ? 8 : 12 }); m.pop(); });
  prop('radio', (m, A) => { m.color('#1a1a1a').shine(1); m.roundBox(0, 0.0, 0.05, 0.065, 0.13, 0.04, 0.012); m.color('#3a3a3a'); m.limb(0.02, 0.06, 0.05, 0.02, 0.17, 0.05, 0.007, 0.005, { seg: 4 }); m.color('#ff3b3b', 1); m.ball(-0.015, 0.05, 0.072, 0.008, { seg: 5, rings: 3 }); m.emissive(0); m.shine(0); });
  prop('walkie', (m, A) => { m.color('#1a1a1e').shine(1); m.roundBox(0, 0.0, 0.05, 0.068, 0.15, 0.042, 0.014); m.color('#2a2a2e'); m.limb(0.02, 0.07, 0.05, 0.022, 0.36, 0.05, 0.008, 0.004, { seg: 5 }); m.ball(0.022, 0.365, 0.05, 0.009, { seg: 5, rings: 3 }); m.color('#3a3a44'); m.roundBox(0, -0.02, 0.072, 0.05, 0.05, 0.004, 0.004); m.color('#7aff5a', 1); m.ball(-0.018, 0.06, 0.072, 0.006, { seg: 5, rings: 3 }); m.emissive(0); m.shine(0); });
  prop('flashlight', (m, A) => { m.color('#2a2a30').shine(2); m.push(); m.tf(0, 0, 0.05, 0, Math.PI / 2); m.limb(0, -0.12, 0, 0, 0.1, 0, 0.022, 0.022, { seg: 8 }); m.lathe([[0.022, 0.1], [0.034, 0.14], [0.034, 0.16], [0, 0.16]], { seg: 10 }); m.color('#fff8d0', 1); m.ball(0, 0.162, 0, 0.026, { seg: 8, rings: 3, phi1: Math.PI / 2 }); m.emissive(0); m.pop(); m.shine(0); });
  prop('spray', (m, A) => { m.color('#38c8ff').shine(2); m.push(); m.tf(0, -0.08, 0.05); m.lathe([[0, 0], [0.032, 0], [0.034, 0.12], [0.02, 0.14], [0, 0.14]], { seg: 10 }); m.color('#f4f4f0'); m.roundBox(0, 0.16, 0.005, 0.03, 0.04, 0.03, 0.008); m.pop(); m.shine(0); });
  prop('bottle', (m, A) => { m.color(A.S.bottleCol || '#6a4a1a', 0.05).shine(3); m.push(); m.tf(0, -0.1, 0.045); m.lathe([[0, 0], [0.038, 0], [0.04, 0.12], [0.032, 0.15], [0.014, 0.18], [0.014, 0.21], [0, 0.215]], { seg: A.lo ? 8 : 12 }); m.color('#e8dcc0'); m.lathe([[0.0405, 0.04], [0.0405, 0.09]], { seg: A.lo ? 8 : 12 }); m.pop(); m.emissive(0); m.shine(0); });
  prop('water', (m, A) => { m.color('#9ad8ff', 0.15).shine(3); m.push(); m.tf(0, -0.1, 0.045); m.lathe([[0, 0], [0.038, 0], [0.04, 0.15], [0.02, 0.18], [0, 0.18]], { seg: 10 }); m.color('#3a6aff'); m.lathe([[0.022, 0.18], [0.022, 0.21], [0, 0.21]], { seg: 8 }); m.pop(); m.emissive(0); m.shine(0); });
  prop('ringlight', (m, A) => { m.color('#2a2a2a'); m.limb(0, -0.05, 0.05, 0, 0.75, 0.05, 0.012, 0.012, { seg: 5 }); m.color('#ffffff', 1); m.push(); m.tf(0, 0.8, 0.06, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.14, 0.025, { seg: A.lo ? 10 : 18, tseg: 5 }); m.pop(); m.emissive(0); m.color('#1a1a22').shine(3); m.roundBox(0, 0.8, 0.06, 0.07, 0.13, 0.012, 0.01); m.shine(0); });
  prop('camera', (m, A) => { // vintage film camera
    m.push(); m.tf(0, 0.0, 0.07, Math.PI / 2); m.color('#1a1a1e').shine(1); m.roundBox(0, 0, 0, 0.13, 0.08, 0.05, 0.012); m.color('#c8c8d0').shine(3); m.roundBox(0, 0.03, 0, 0.132, 0.025, 0.052, 0.008); m.push(); m.tf(0, 0, 0.025, 0, Math.PI / 2); m.color('#2a2a2e'); m.roundCyl(0, 0, 0, 0.03, 0.04, 0.006, { seg: 12 }); m.color('#5a7aa0', 0.1).shine(3); m.roundCyl(0, 0.035, 0, 0.022, 0.008, 0.003, { seg: 10 }); m.pop(); m.emissive(0); m.pop(); m.shine(0);
  });
  prop('tin', (m, A) => { m.color('#c8b070').shine(3); m.push(); m.tf(0, -0.02, 0.06, 0, Math.PI / 2); m.roundCyl(0, -0.02, 0, 0.05, 0.04, 0.008, { seg: 12 }); m.pop(); m.shine(0); });
  prop('guide', (m, A) => { m.color('#e8d8a8'); m.roundBox(0, 0.0, 0.06, 0.14, 0.19, 0.02, 0.006); m.color('#c83a2a'); m.roundBox(0, 0.05, 0.071, 0.12, 0.04, 0.004, 0.003); });
  prop('greeterSign', (m, A) => { // a little wooden GREETER sign on a stick
    const R = BURNS_ATLAS.pattern('greeterSign');
    m.color('#8a6a3a'); m.limb(0, -0.1, 0.05, 0, 0.42, 0.05, 0.012, 0.012, { seg: 5 });
    m.color('#c89a5a'); m.roundBox(0, 0.52, 0.05, 0.3, 0.16, 0.025, 0.012);
    m.color('#ffffff'); m.push(); m.tf(0, 0.52, 0.064); m.decal(0, 0, 0, 0.27, 0.135, R); m.pop(); m.push(); m.tf(0, 0.52, 0.036, Math.PI); m.decal(0, 0, 0, 0.27, 0.135, R); m.pop();
  });
  prop('badgeFlash', (m, A) => { m.color('#e8c040', 0.25).shine(3); m.push(); m.tf(0, 0.02, 0.06, 0, Math.PI / 2); m.roundCyl(0, -0.006, 0, 0.035, 0.012, 0.004, { seg: 10 }); m.pop(); m.color('#2a1a10'); m.roundBox(0, -0.04, 0.06, 0.08, 0.1, 0.012, 0.01); m.emissive(0); m.shine(0); });
  // fire tools (wicks are reported to the behaviour through model.wicks)
  const wick = (m, A, bone, x, y, z, r) => { m.color('#2a1a10').shine(0); m.ball(x, y, z, r || 0.04, { seg: A.lo ? 6 : 10, rings: A.lo ? 4 : 6 }); A.wicks.push({ bone, p: [x, y, z] }); };
  prop('poi', (m, A, hand) => { const bone = hand === 'left' ? B.TAIL : B.PROP; m.color('#3a3a3a').shine(2); m.limb(0, 0, 0.03, 0, -0.36, 0.03, 0.006, 0.006, { seg: 4 }); m.shine(0); wick(m, A, bone, 0, -0.4, 0.03, 0.045); });
  prop('fan', (m, A, hand) => { const bone = hand === 'left' ? B.TAIL : B.PROP; m.color('#c8c8d0').shine(3); m.push(); m.tf(0, 0, 0.04); m.torus(0, 0, 0, 0.06, 0.01, { seg: 12, tseg: 3 }); for (let i = 0; i < 5; i++) { const a = -1.1 + i * 0.55; m.limb(Math.sin(a) * 0.06, -Math.cos(a) * 0.06, 0, Math.sin(a) * 0.3, -Math.cos(a) * 0.3, 0, 0.007, 0.006, { seg: 4 }); } m.pop(); m.shine(0); for (let i = 0; i < 5; i++) { const a = -1.1 + i * 0.55; wick(m, A, bone, Math.sin(a) * 0.32, -Math.cos(a) * 0.32, 0.04, 0.03); } });
  prop('staff', (m, A) => { m.color('#c8c8d0').shine(3); m.limb(-0.55, -0.02, 0.05, 0.55, -0.02, 0.05, 0.016, 0.016, { seg: 6 }); m.color('#2a2a30'); m.limb(-0.08, -0.02, 0.05, 0.08, -0.02, 0.05, 0.022, 0.022, { seg: 6 }); m.shine(0); wick(m, A, B.PROP, -0.6, -0.02, 0.05, 0.05); wick(m, A, B.PROP, 0.6, -0.02, 0.05, 0.05); });
  prop('hoop', (m, A) => { m.color('#c8c8d0').shine(3); m.push(); m.tf(0, -0.45, 0.05, 0, Math.PI / 2); m.torus(0, 0, 0, 0.45, 0.012, { seg: A.lo ? 16 : 28, tseg: 4 }); m.pop(); m.shine(0); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.6; wick(m, A, B.PROP, Math.sin(a) * 0.47, -0.45 + Math.cos(a) * 0.47, 0.05, 0.035); } });
})();

/* ================= atlas extras: patterns and faces for the figures ================= */
(() => {
  const P = (n, f) => BURNS_ATLAS.addPattern(n, f);
  P('hair', (x, r) => { for (let i = 0; i < 70; i++) { const px = r() * 128, w = 0.8 + r() * 1.6; x.strokeStyle = r() < 0.55 ? `rgba(0,0,0,${0.12 + r() * 0.14})` : `rgba(255,255,255,${0.08 + r() * 0.12})`; x.lineWidth = w; x.beginPath(); x.moveTo(px, -4); x.bezierCurveTo(px + (r() - 0.5) * 10, 40, px + (r() - 0.5) * 10, 90, px + (r() - 0.5) * 6, 132); x.stroke(); } });
  P('paisley', (x, r) => { x.fillStyle = 'rgba(70,40,70,0.35)'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 9; i++) { const cx = (i % 3) * 44 + 20 + (Math.floor(i / 3) % 2) * 18, cy = Math.floor(i / 3) * 44 + 20; x.save(); x.translate(cx, cy); x.rotate(r() * 6); x.fillStyle = ['rgba(240,220,230,0.8)', 'rgba(200,120,170,0.8)', 'rgba(250,200,120,0.75)'][i % 3]; x.beginPath(); x.moveTo(0, -14); x.bezierCurveTo(14, -12, 12, 10, 0, 12); x.bezierCurveTo(-8, 10, -10, -4, -2, -6); x.bezierCurveTo(4, -8, 2, -12, 0, -14); x.fill(); x.strokeStyle = 'rgba(60,20,50,0.6)'; x.lineWidth = 1.2; x.stroke(); x.fillStyle = 'rgba(60,20,50,0.5)'; x.beginPath(); x.arc(2, 2, 3, 0, TAU); x.fill(); x.restore(); } });
  P('knit', (x) => { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.strokeStyle = (i + j) % 2 ? 'rgba(255,230,190,0.18)' : 'rgba(0,0,0,0.22)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(i * 8, j * 8); x.lineTo(i * 8 + 4, j * 8 + 7); x.lineTo(i * 8 + 8, j * 8); x.stroke(); } });
  P('chainmail', (x) => { x.fillStyle = 'rgba(60,40,30,0.25)'; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { x.strokeStyle = (i + j) % 3 ? 'rgba(220,220,230,0.85)' : 'rgba(150,100,60,0.85)'; x.lineWidth = 1.8; x.beginPath(); x.arc(i * 11 + (j % 2) * 5.5, j * 11, 4.4, 0, TAU); x.stroke(); } });
  P('flamecloth', (x, r) => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#ff5a1a'); g.addColorStop(0.6, '#ff8a2a'); g.addColorStop(1, '#ffe24a'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 7; i++) { const bx = i * 20 - 4; x.fillStyle = 'rgba(255,250,220,0.85)'; x.beginPath(); x.moveTo(bx, 128); x.quadraticCurveTo(bx - 4, 80, bx + 8, 40 + r() * 30); x.quadraticCurveTo(bx + 10, 90, bx + 18, 128); x.fill(); } });
  P('spots', (x, r) => { for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(60,45,40,${0.35 + r() * 0.3})`; x.beginPath(); x.ellipse(r() * 128, r() * 128, 4 + r() * 6, 3 + r() * 5, r() * 3, 0, TAU); x.fill(); } for (let i = 0; i < 500; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; x.lineWidth = 1; const px = r() * 128, py = r() * 128; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 2, py + 5); x.stroke(); } });
  P('furstripes', (x) => { ['#ff5aa8', '#ff9a3a', '#38c8c8'].forEach((c, i) => { x.fillStyle = c; for (let k = 0; k < 2; k++) x.fillRect(0, (i + k * 3) * 21.4, 128, 21.4); }); });
  P('graffiti', (x, r) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 18; i++) { x.strokeStyle = BURNS_NEON[i % 7]; x.lineWidth = 3 + r() * 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(r() * 128, r() * 128); x.quadraticCurveTo(r() * 128, r() * 128, r() * 128, r() * 128); x.stroke(); } });
  P('psych', (x, r) => { for (let i = 0; i < 14; i++) { x.fillStyle = burnsHSL(i * 47, 0.9, 0.55); x.beginPath(); x.ellipse(r() * 128, r() * 128, 10 + r() * 22, 6 + r() * 14, r() * 3, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(30,10,40,0.5)'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(r() * 128, r() * 128, 8 + r() * 18, 0, TAU); x.stroke(); } });
  P('paisley2', (x, r) => { x.fillStyle = '#ff8a2a'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 10; i++) { const cx = r() * 128, cy = r() * 128; x.save(); x.translate(cx, cy); x.rotate(r() * 6); x.fillStyle = ['#2ab0a0', '#5ac83a', '#ffe24a', '#2a6a9a'][i % 4]; x.beginPath(); x.moveTo(0, -18); x.bezierCurveTo(18, -14, 15, 12, 0, 15); x.bezierCurveTo(-10, 12, -12, -5, -3, -8); x.bezierCurveTo(5, -10, 3, -15, 0, -18); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(2, 3, 3.5, 0, TAU); x.fill(); x.restore(); } });
  P('suede', (x, r) => { for (let i = 0; i < 160; i++) { x.fillStyle = r() < 0.5 ? `rgba(255,240,210,${0.05 + r() * 0.08})` : `rgba(40,20,10,${0.06 + r() * 0.1})`; x.beginPath(); x.ellipse(r() * 128, r() * 128, 2 + r() * 9, 2 + r() * 6, r() * 3, 0, TAU); x.fill(); } });
  P('gateEmblem', (x) => { // our own emblem: a rising sun over a flame, and the word GATE
    x.fillStyle = '#ffffff'; x.strokeStyle = '#ffffff'; x.lineWidth = 3.5;
    x.beginPath(); x.arc(64, 54, 18, Math.PI, TAU); x.stroke();
    for (let i = 0; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI; x.beginPath(); x.moveTo(64 + Math.cos(a) * 24, 54 + Math.sin(a) * 24); x.lineTo(64 + Math.cos(a) * 32, 54 + Math.sin(a) * 32); x.stroke(); }
    x.beginPath(); x.moveTo(64, 34); x.quadraticCurveTo(74, 46, 64, 56); x.quadraticCurveTo(56, 48, 64, 34); x.fill();
    x.fillRect(30, 56, 68, 3);
    x.font = `26px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GATE', 64, 84);
  });
  P('greeterSign', (x) => { x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#5a2a10'; x.font = `22px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(64, 64); x.scale(1, 1.9); x.fillText('GREETER', 0, 0); x.restore(); x.fillStyle = '#ff4fa8'; x.beginPath(); x.arc(14, 64, 5, 0, TAU); x.arc(114, 64, 5, 0, TAU); x.fill(); });
  P('stickers', (x, r) => { for (let i = 0; i < 16; i++) { x.save(); x.translate(r() * 128, r() * 128); x.rotate((r() - 0.5) * 1.2); x.fillStyle = BURNS_NEON[i % 7]; const w = 14 + r() * 20, h = 10 + r() * 14; if (i % 3) x.fillRect(-w / 2, -h / 2, w, h); else { x.beginPath(); x.arc(0, 0, w / 2.6, 0, TAU); x.fill(); } x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(-w / 3, -2, w / 1.6, 3); x.restore(); } });
  // faces for the figures
  const F = (n, q) => BURNS_ATLAS.addFace(n, q);
  F('crusty', { eyes: 'squint', brows: { col: '#d8d8d8', thick: 4.2, w: 8, tilt: -1.2, y: 19 }, wrinkles: true, stubble: 0.25, mouth: 'flat', mouthY: 47 });
  F('gateStaff', { eyes: 'normal', brows: { col: '#3a2418', tilt: -1, w: 6 }, mouth: 'flat', lips: 'rgba(170,70,80,0.55)', eyeSc: 0.95 });
  F('greeterF', { eyes: 'normal', lashes: true, brows: { col: '#2a1a12', w: 6, tilt: 1 }, mouth: 'grin', mouthW: 12, lips: 'rgba(230,40,110,0.45)', blush: true });
  F('greeterM', { eyes: 'normal', brows: { col: '#2a1a12', w: 7, tilt: 1 }, mouth: 'grin', mouthW: 13, stubble: 0.25 });
  F('scheming', { eyes: 'normal', eyeSc: 0.9, brows: { col: '#3a2a1a', w: 7, tilt: 2.5 }, mouth: 'smirk', stubble: 0.32 });
  F('cop', { eyes: 'normal', brows: { col: '#2a1a12', w: 7, tilt: -2.5, thick: 3.2 }, mouth: 'flat', stubble: 0.3 });
  F('furry', (x, row, H) => { // big green cartoon eyes with black markings, little muzzle drawn by geometry
    const ey = 26;
    for (const ex of [19, 45]) {
      x.fillStyle = '#1a1414'; x.beginPath(); x.ellipse(ex, ey, 12, 11, ex < 32 ? 0.3 : -0.3, 0, TAU); x.fill();
      if (row === 2) { x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(ex - 6, ey - 3); x.lineTo(ex + 4, ey); x.lineTo(ex - 6, ey + 3); x.stroke(); continue; }
      if (row === 3) { x.fillStyle = '#ff3b7a'; x.beginPath(); x.moveTo(ex, ey + 6); x.bezierCurveTo(ex - 10, ey - 1, ex - 5, ey - 9, ex, ey - 3); x.bezierCurveTo(ex + 5, ey - 9, ex + 10, ey - 1, ex, ey + 6); x.fill(); continue; }
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(ex, ey, 9, 9.5, 0, 0, TAU); x.fill();
      x.fillStyle = '#3ad86a'; x.beginPath(); x.arc(ex + 0.5, ey + 1, 6.4, 0, TAU); x.fill();
      x.fillStyle = '#0a0a0a'; x.beginPath(); x.arc(ex + 0.8, ey + 1.4, 3.4, 0, TAU); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(ex + 3, ey - 2.5, 2, 0, TAU); x.fill();
    }
    if (row === 1) { x.fillStyle = '#5a1a20'; x.beginPath(); x.ellipse(32, 52, 5, 4, 0, 0, TAU); x.fill(); }
  });
})();

/* ================= NPC types (registry) ================= */
(() => {
  const T = (n, d) => { BURNS_NPC_TYPES[n] = d; };
  const neonOf = r => r.pick(BURNS_NEON);
  T('burner', { spec(s, r) {
    const pickTop = kinds => ({ kind: r.pick(kinds), col: neonOf(r), col2: neonOf(r) });
    s.top = r.chance(0.45) ? { kind: 'none' } : pickTop(['tank', 'crop', 'vest', 'tee']);
    if (s.top.kind === 'none' && r.chance(0.6)) s.paint = r.pick(['led', 'rainbow', 'tiedye']);
    s.bottom = { kind: r.pick(['shorts', 'kilt', 'leggings', 'shorts']), col: r.pick(['#2a2a34', '#5a3a2a', neonOf(r), '#1a1a1a']) };
    s.shoes = { kind: r.pick(['boots', 'sneakers', 'furboots']), col: r.pick(['#3a2a1a', '#1a1a1a', neonOf(r)]) };
    s.hat = r.chance(0.5) ? { kind: r.pick(['cowboy', 'furhat', 'bandana', 'cap', 'tophat']), col: r.pick(['#8a5a2a', '#f4f0ff', neonOf(r), '#1a1a1a']) } : null;
    s.goggles = r.chance(0.5); s.glasses = r.chance(0.4) ? 'shades' : null;
    if (r.chance(0.4)) s.acc.push('ledNecklace');
    if (r.chance(0.3)) s.acc.push('cape');
  } });
  T('furcoat', { spec(s, r) {
    s.top = { kind: 'tee', col: '#1a1a1a' }; s.coat = { kind: 'fur', col: r.pick(['#ff8ad8', '#f4f0ff', '#9a6bff', '#ffd84a', '#38f2ff', '#c8a070']), trim: '#ffffff' };
    s.bottom = { kind: 'jeans', col: '#1a1a22' }; s.shoes = { kind: 'boots', col: '#1a1a1a' };
    s.hat = r.chance(0.5) ? { kind: 'furhat', col: '#f4f0ff' } : null; s.glasses = 'shades'; s.goggles = !s.hat && r.chance(0.5);
  } });
  T('tutu', { spec(s, r) {
    s.top = { kind: r.pick(['tank', 'crop']), col: neonOf(r) }; s.bottom = { kind: 'tutu', col: r.pick(['#ff9ad0', '#9adcff', '#ffe28a', '#c8a0ff']) };
    s.shoes = { kind: 'furboots', col: r.pick(['#ff9ad0', '#ffffff', '#38f2ff']) }; s.goggles = true; s.hair.style = r.pick(['long', 'pony', 'afro', 'wig']);
    if (s.hair.style === 'wig') s.hair.col = r.pick(['#ff9ad0', '#9adcff', '#c8a0ff']);
  } });
  T('ledsuit', { spec(s, r) { s.top = { kind: 'long', col: '#14141c' }; s.bottom = { kind: 'leggings', col: '#14141c' }; s.shoes = { kind: 'sneakers', col: '#14141c', sole: '#333' }; s.led = neonOf(r); s.acc.push('ledNecklace'); s.glasses = 'shades'; } });
  T('campLead', { anim: 'clipboard', spec(s, r) { s.top = { kind: 'tee', col: r.pick(['#ff4fd8', '#ffe24a', '#38f2ff', '#ff7a2a']) }; s.bottom = { kind: 'cargo', col: '#6a6a4a' }; s.shoes = { kind: 'boots', col: '#3a2a1a' }; s.face = 'stressed'; s.prop = 'clipboard'; s.acc.push('headset'); } });
  T('driver', { spec(s, r) { s.top = { kind: 'hoodie', col: r.pick(['#5a5a64', '#3a4a5a', '#5a3a3a', '#4a5a3a']) }; s.bottom = { kind: 'jeans', col: '#3a3a4a' }; s.shoes = { kind: 'sneakers', col: '#8a8a8a' }; s.face = 'tired'; s.prop = 'coffee'; s.hair.style = r.pick(['short', 'long', 'buzz']); } });
  T('ranger', { spec(s, r) { s.top = { kind: 'button', col: '#b8a070' }; s.bottom = { kind: 'cargo', col: '#6a5a3a' }; s.shoes = { kind: 'boots', col: '#3a2a1a' }; s.hat = { kind: 'ranger', col: '#8a6a3a' }; s.face = 'stern'; s.prop = 'radio'; s.glasses = 'shades'; } });
  T('dpw', { spec(s, r) { s.top = { kind: 'tee', col: '#6a5a4a' }; s.vest = 'hivis'; s.bottom = { kind: 'cargo', col: '#5a4a3a' }; s.shoes = { kind: 'boots', col: '#2a1a10' }; s.hat = { kind: 'hardhat', col: '#ff8a1a' }; s.face = 'beard'; s.hair.col = '#5a4a3a'; s.acc.push('toolbelt'); s.body.w = 1.1 + r() * 0.2; s.beard = { col: '#5a4a3a', trim: true }; } });
  T('techbro', { anim: 'phone', spec(s, r) { s.top = { kind: 'button', col: '#9ac0e8', long: true }; s.vest = 'fleece'; s.vestCol = r.pick(['#2a3a5a', '#4a4a52', '#1a2a3a']); s.bottom = { kind: 'chinos', col: '#c8b48a' }; s.shoes = { kind: 'sneakers', col: '#f4f4f4', sole: '#e0e0e0' }; s.face = 'smug'; s.prop = 'phone'; s.acc.push('earbuds'); s.hair.style = r.pick(['short', 'buzz']); s.glasses = r.chance(0.3) ? 'shades' : null; } });
  T('sparklepony', { spec(s, r) { s.top = { kind: 'crop', col: r.pick(['#ff9ad0', '#c8a0ff', '#9adcff']), pattern: 'sequin' }; s.bottom = { kind: 'shorts', col: '#f4f0ff', pattern: 'sequin' }; s.shoes = { kind: 'furboots', col: r.pick(['#ff9ad0', '#ffffff', '#c8a0ff']) }; s.hair = { style: 'wig', col: r.pick(['#ff9ad0', '#c8a0ff', '#9adcff', '#ffe28a']), hi: '#ffffff' }; s.face = 'lashes'; s.acc.push('wings'); s.glasses = r.chance(0.5) ? 'heart' : null; s.body.w = 0.85; s.body.h = 0.94; s.body.fem = true; } });
  T('influencer', { anim: 'photo', spec(s, r) { s.top = { kind: 'tee', col: '#f4f0e8' }; s.coat = { kind: 'kimono', col: r.pick(['#ffd0e0', '#e8d0ff', '#fff0c8']), trim: '#ffffff' }; s.bottom = { kind: 'shorts', col: '#e8d8c0' }; s.shoes = { kind: 'sneakers', col: '#ffffff', sole: '#e8e8e8' }; s.face = 'lashes'; s.prop = 'ringlight'; s.glasses = 'shades'; s.hair = { style: r.pick(['long', 'wig', 'pony']), col: r.pick(['#e8c870', '#3a2a1a', '#ff9ad0']), hi: '#ffffff' }; s.hat = r.chance(0.5) ? { kind: 'cowboy', col: '#f4f0e8' } : null; s.body.fem = true; } });
  /* ---- the burner action figures (docs/BURNS_GUIDE.md §6.3) ---- */
  T('crusty', { lines: ['It was better in the old days.', 'Back then the Man was twelve feet tall.', 'You call that dust?', 'This beer is the temperature of the playa. Perfect.', 'Art cars used to be art. Now they\'re ads with wheels.', 'The burn peaked on Baker Beach, kid.'],
    spec(s, r, o) {
      const tans = [['#b98258', '#94603a'], ['#c8906a', '#a06c48'], ['#a8714a', '#80522e']]; const t = tans[Math.floor(r() * tans.length)];
      s.skin = t[0]; s.skinSh = t[1]; s.face = 'crusty';
      s.hair = { style: 'curly', col: r.pick(['#a8a8a8', '#b8b4ac', '#9a9894']), hi: '#e8e8e8' };
      s.beard = { col: shade(s.hair.col, 0.04), len: 0.07 + r() * 0.03 };
      s.goggles = 'brass';
      s.top = { kind: 'tee', col: '#3a342e' };
      s.coat = { kind: 'jacket', col: r.pick(['#8a5a34', '#7a5030', '#946240']), trim: '#e8dcc0', pattern: 'suede' };
      s.bottom = o.variant === 'kilt' ? { kind: 'kilt', col: '#7a7258', utility: true } : { kind: 'cargo', col: r.pick(['#6a6e52', '#626a54', '#70705a']), patches: true };
      s.shoes = { kind: 'workboots', col: '#7a5a3a', sole: '#3a2a1a', laces: true };
      s.acc = ['bandana', 'straps', 'utilityBelt', 'kandi', 'kneepads', 'messenger'];
      s.prop = o.prop !== undefined ? o.prop : r.pick(['camera', 'bottle', 'bottle', null]);
      s.body.w = 1.0 + r() * 0.1; s.body.h = 0.96 + r() * 0.05;
    } });
  T('firespinner', { anim: 'idle', lines: ['Stand back. Way back.', 'Fire is just spicy air.', 'Watch the eyebrows.'],
    spec(s, r, o) {
      s.face = 'stern'; s.hood = true; s.hoodCol = r.pick(['#5a4636', '#4a3a30', '#3a3036']);
      s.top = { kind: 'crop', col: '#6a5040', pattern: 'chainmail' };
      s.bottom = { kind: 'pants', col: r.pick(['#6a4a32', '#5a4030']), pattern: 'suede' };
      s.shoes = { kind: 'boots', col: '#c8a070', sole: '#5a4030', laces: true, wraps: true, wrapCol: '#8a6a4a' };
      s.acc = ['fireHood', 'sunMedallion', 'flameWings', 'bracers', 'sash', 'flameTassets', 'kneeMedallions'];
      const tool = o.tool || r.pick(['poi', 'poi', 'fans', 'staff']);
      s.tool = tool; s.prop = tool === 'fans' ? 'fan' : tool; s.prop2 = tool === 'poi' ? 'poi' : tool === 'fans' ? 'fan' : null;
      s.body.w = 0.95 + r() * 0.1;
    } });
  T('gatestaff', { lines: ['Ticket and ID!', 'Pop the trunk, please.', 'Anyone in the bathroom?', 'Welcome... after inspection.'],
    spec(s, r) {
      s.face = 'gateStaff'; s.body.fem = true; s.body.w = 0.9; s.body.h = 0.95;
      s.hair = { style: 'bob', col: r.pick(['#5a3a24', '#4a3020', '#6a4428']), hi: r.pick(['#d8b070', '#e8c888']) };
      s.glasses = 'wrap';
      s.top = { kind: 'tee', col: '#141418', emblem: 'gateEmblem' };
      s.bottom = { kind: 'shorts', col: '#18181e', pattern: 'denim' };
      s.shoes = { kind: 'combat', col: '#141418', sole: '#0a0a0c', laces: true };
      s.gloves = '#141416';
      s.acc = ['dutyBelt', 'chain', 'thighStraps', 'kandi'];
      s.prop = 'walkie';
    } });
  const greeterWoman = (s, r) => {
    s.face = 'greeterF'; s.body.fem = true; s.body.w = 0.9; s.body.h = 0.95;
    s.hair = { style: 'long', col: '#2a1a14', hi: '#9a6a44' };
    s.hat = { kind: 'sunhat', col: '#ff4fa8' }; s.glasses = 'round'; s.lensCol = '#9a4aff';
    s.top = { kind: 'halter', col: '#38c8c8', pattern: 'sequin' };
    s.bottom = { kind: 'tutu', col: '#9aff3a', tiers: ['#9aff3a', '#ff4fa8', '#ffe24a', '#ff8a2a'] };
    s.shoes = { kind: 'hightops', col: '#ffffff', sole: '#f0f0f0', print: 'graffiti' };
    s.acc = ['beads', 'kandi'];
  };
  const greeterMan = (s, r) => {
    s.face = 'greeterM';
    s.hair = { style: 'short', col: '#2a1a12', hi: '#5a3a24' }; s.beard = { col: '#2a1a12', trim: true, len: 0.02 };
    s.hat = { kind: 'fedora', col: '#e0c890', band: '#5a3a1a' }; s.glasses = 'aviator'; s.lensCol = '#ff8a2a';
    s.top = { kind: 'button', col: '#ff8a2a', pattern: 'paisley2', open: true, under: '#2ab0a0' };
    s.bottom = { kind: 'shorts', col: '#ff4fa8', fade: '#9aff3a', cargo: true };
    s.socks = { col: '#ffffff', stripe: '#2ab0a0' };
    s.shoes = { kind: 'sneakers', col: '#ff4fd8', sole: '#ffffff', print: 'rainbow', laceCol: '#9aff3a' };
    s.acc = ['beads', 'kandi']; s.body.w = 1.05 + r() * 0.1;
  };
  T('greeter_f', { anim: 'wave', lines: ['WELCOME HOOOME!', 'Is this your first burn?! Roll in the dust!', 'Hugs are mandatory. Legally. Probably.'], spec(s, r, o) { greeterWoman(s, r); s.prop = o.prop !== undefined ? o.prop : 'greeterSign'; } });
  T('greeter_m', { anim: 'wave', lines: ['WELCOME HOME, BROTHER!', 'Ring the bell! RING IT!', 'Dust angels! Everybody down!'], spec(s, r, o) { greeterMan(s, r); s.prop = o.prop !== undefined ? o.prop : 'greeterSign'; } });
  T('greeter', { anim: 'wave', lines: ['WELCOME HOME!', 'Hugs! Hugs for everyone!', 'Roll in the dust, first-timer!'],
    spec(s, r, o) { const woman = o.variant ? (o.variant === 'f' || o.variant === 'woman') : (s.seed || 0) % 2 === 1; if (woman) greeterWoman(s, r); else greeterMan(s, r); s.prop = o.prop !== undefined ? o.prop : 'greeterSign'; } });
  T('darkwad', { lines: ['...', 'Lights are for tourists.', 'I\'m basically a ninja.', 'You didn\'t see me.'],
    spec(s, r) {
      s.face = 'smug'; s.hair = { style: 'spiky', col: '#16120e', hi: '#3a3028' }; s.glasses = 'shades';
      s.top = { kind: 'long', col: '#121214' }; s.bottom = { kind: 'cargo', col: '#141416', baggy: true }; s.shoes = { kind: 'sneakers', col: '#6a6a72', sole: '#3a3a40' };
      s.acc = ['backpack', 'dutyBelt']; s.packCol = '#121214';
      if (s.lit) { s.acc.push('elwire'); s.elCol = s.lit === true ? '#38f2ff' : s.lit; }
    } });
  T('badideaguy', { anim: 'dare', lines: ['Hear me out...', 'What\'s the worst that could happen? Besides this.', 'I call it "physics, but optional".'],
    spec(s, r) {
      s.face = 'scheming'; s.hair = { style: 'short', col: r.pick(['#5a3a24', '#3a2a1a', '#8a6a3a']), hi: '#b08a5a' }; s.goggles = 'classic';
      s.top = { kind: 'tank', col: '#f4f4f0' }; s.bottom = { kind: 'shorts', col: '#6a4a2a', cargo: true };
      s.shoes = { kind: 'workboots', col: '#9a7a5a', sole: '#4a3a2a', laces: true };
      s.acc = ['cast', 'crossbag', 'dutyBelt', 'spikedBand', 'kneeBrace'];
    } });
  T('undercovercop', { anim: 'idle', lines: ['Groovy.', 'Greetings, fellow burner. Groovy.', 'I am simply here for the... vibes.', 'Nice... ground score you have there.'],
    spec(s, r) {
      s.face = 'cop'; s.hair = { style: 'buzz', col: '#4a3a2a' }; s.hat = { kind: 'jester' }; s.glasses = 'aviator'; s.lensCol = '#3a3a2a';
      s.top = { kind: 'button', col: '#ff4fd8', pattern: 'psych' }; s.vest = 'tactical';
      s.bottom = { kind: 'shorts', col: '#c8b488', cargo: true }; s.socks = { col: '#ffffff', stripe: null };
      s.shoes = { kind: 'dad', col: '#f0f0f4', sole: '#d8d8e0' };
      s.acc = ['goldChain', 'badge', 'dutyBelt', 'watch']; s.prop = 'bottle'; s.bottleCol = '#c8a060';
      s.body.w = 1.08 + r() * 0.08;
    } });
  T('furry', { anim: 'idle', lines: ['*happy tail wag*', 'Is it hot or is it just this suit? It\'s the suit.', 'Free hugs! Fur included!'],
    spec(s, r) {
      s.face = 'furry'; s.hair = { style: 'bald' };
      s.fursuit = { col: '#a8a090', belly: '#f4f0e8', pattern: 'spots', limb: '#ff8a5a', limbPattern: 'furstripes', head: BURNS_FURRY.head, paws: BURNS_FURRY.paws, tail: BURNS_FURRY.tail };
      s.top = { kind: 'none' }; s.bottom = { kind: 'pants', col: '#a8a090' }; s.shoes = { kind: 'paws' };
      s.acc = ['harness']; s.body.w = 1.08;
    } });
  // aliases kept for older world code
  BURNS_NPC_TYPES.gate = BURNS_NPC_TYPES.gatestaff;
})();

/* ---------------- the furry's suit parts ---------------- */
const BURNS_FURRY = (() => {
  const B = BURNS_BONES, HD = BurnsRound.HD, hp = BurnsRound.headPt;
  return {
    head(m, A) {
      const S = A.S, F = S.fursuit, R = BURNS_ATLAS.face(S.face || 'furry'), sp = BURNS_ATLAS.pattern('spots');
      // a bigger, rounder head in fur with the cartoon eyes wrapped on the front
      m.color(F.col);
      const TF = BurnsRound.TF, PH0 = BurnsRound.PH0, PH1 = BurnsRound.PH1, k = 1.12;
      m.ellipsoid(HD.cx, HD.cy + 0.01, HD.cz, HD.rx * k, HD.ry * k, HD.rz * k, { seg: A.seg(22, 12), rings: A.seg(15, 8), theta0: -Math.PI, theta1: Math.PI, uvFn: (x, y, z) => { const th = Math.atan2(x, z), ph = Math.acos(clamp(y / (HD.ry * k), -1, 1)); return [lerp(R.u0, R.u1, clamp(0.5 + th / (2 * TF), 0, 1)), lerp(R.v0, R.v1, clamp((ph - PH0) / (PH1 - PH0), 0, 1))]; } });
      // white muzzle + black nose
      m.color(F.belly); m.ellipsoid(0, 0.12, HD.cz + HD.rz * k - 0.01, 0.09, 0.065, 0.085, { seg: A.seg(12, 8), rings: A.seg(8, 5) });
      m.color('#1a1414').shine(3); m.ellipsoid(0, 0.15, HD.cz + HD.rz * k + 0.068, 0.03, 0.022, 0.022, { seg: 8, rings: 5 }); m.shine(0);
      // big pointed ears with pink inner fur
      for (const sd of [1, -1]) {
        m.push(); m.tf(sd * 0.13, 0.38, -0.01, sd * 0.25, -0.15, -sd * 0.3);
        m.color(F.col); m.lathe([[0.075, 0], [0.065, 0.08], [0.035, 0.17], [0, 0.23]], { seg: A.seg(10, 6), sz: 0.45 });
        m.color('#ff5aa8'); m.push(); m.tf(0, 0.02, 0.018); m.lathe([[0.05, 0], [0.042, 0.07], [0.02, 0.15], [0, 0.18]], { seg: A.seg(8, 5), sz: 0.3 }); m.pop();
        m.pop();
      }
      // pink + teal tuft
      if (!A.lo) { const cols = ['#ff5aa8', '#38c8c8', '#ff5aa8', '#38c8c8', '#ff8ad0']; for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.35, p = hp(a * 0.6, 0.25, 0.03); m.color(cols[i]); m.limb(p[0], p[1], p[2], p[0] + Math.sin(a) * 0.08, p[1] + 0.12, p[2] + 0.06, 0.035, 0.005, { seg: 6 }); } }
    },
    paws(m, A, side, which) {
      const F = A.S.fursuit;
      if (which === 'hand') {
        m.color(F.paw || F.col); m.ellipsoid(0, -0.285, 0.006, 0.055, 0.075, 0.062, { seg: A.seg(12, 8), rings: A.seg(8, 5) });
        if (!A.lo) { m.color('#2a2020').shine(2); for (let i = 0; i < 3; i++) m.limb((i - 1) * 0.026, -0.34, 0.04, (i - 1) * 0.03, -0.37, 0.05, 0.01, 0.002, { seg: 4 }); m.shine(0); m.color('#ff8ab8'); m.ellipsoid(0, -0.29, 0.06, 0.03, 0.035, 0.008, { seg: 8, rings: 4 }); }
      } else {
        m.color(F.paw || F.col); m.ellipsoid(0, -0.01, 0.06, 0.09, 0.07, 0.15, { seg: A.seg(12, 8), rings: A.seg(8, 5) });
        m.color(shade(F.col, -0.3)); m.roundBox(0, -0.058, 0.06, 0.15, 0.025, 0.28, 0.012);
        if (!A.lo) { m.color('#2a2020').shine(2); for (let i = 0; i < 3; i++) m.limb((i - 1) * 0.04, -0.02, 0.19, (i - 1) * 0.045, -0.04, 0.225, 0.012, 0.002, { seg: 4 }); m.shine(0); }
      }
    },
    tail(m, A) { const F = A.S.fursuit; m.color(F.col); m.limb(0, 0, -0.02, 0, -0.12, -0.28, 0.07, 0.09, { seg: A.seg(10, 6), mid: 0.15 }); m.color('#3a3030'); m.limb(0, -0.12, -0.28, 0, -0.2, -0.42, 0.09, 0.03, { seg: A.seg(10, 6) }); }
  };
})();
BURNS_GEAR.acc.harness = (m, A) => { // black harness with badges, kandi, a gadget pack, LED wristband and a teal tube
  const h = A.h, B = BURNS_BONES; m.color('#121214').shine(1);
  for (const sd of [1, -1]) { const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(A.torsoPt(lerp(sd * 0.9, -sd * 0.4, t), lerp(0.47, 0.05, t) * h, 0.03)); } for (let i = 0; i < 4; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.016, 0.016, { seg: 4, sz: 0.5 }); }
  m.push(); m.tf(0, 0.2 * h, 0, 0, 0, 0, 1, 1, A.TZ + 0.12); m.torus(0, 0, 0, A.torsoR(0.2 * h) + 0.02, 0.016, { seg: A.lo ? 10 : 16, tseg: 4 }); m.pop();
  if (!A.lo) {
    BURNS_NEON.slice(0, 5).forEach((c, i) => { const p = A.torsoPt(-0.5 + i * 0.25, (0.32 + (i % 2) * 0.05) * h, 0.045); m.color(c).shine(2); m.push(); m.tf(p[0], p[1], p[2], -0.5 + i * 0.25, Math.PI / 2); m.roundCyl(0, -0.004, 0, 0.022, 0.008, 0.003, { seg: 8 }); m.pop(); });
    m.color('#2a2a30'); const g = A.torsoPt(0.6, 0.12 * h, 0.05); m.push(); m.tf(g[0], g[1], g[2], 0.6); m.roundBox(0, 0, 0, 0.09, 0.07, 0.05, 0.014); m.color('#7aff5a', 1); m.ball(0.02, 0.02, 0.026, 0.008, { seg: 5, rings: 3 }); m.emissive(0); m.pop();
    m.color('#38c8c8').shine(2); const a = A.torsoPt(0.75, 0.47 * h, 0.04), b = A.torsoPt(0.2, 0.25 * h, 0.07), c = A.torsoPt(-0.6, 0.1 * h, 0.06); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.016, 0.016, { seg: 6 }); m.limb(b[0], b[1], b[2], c[0], c[1], c[2], 0.016, 0.016, { seg: 6 });
    m.setBone(B.FARM_R); m.color('#38f2ff', 1); m.push(); m.tf(0, -0.2, 0); m.torus(0, 0, 0, 0.06, 0.012, { seg: 12, tseg: 3 }); m.pop(); m.emissive(0);
    BURNS_GEAR.acc.kandi(m, A);
  }
  m.shine(0);
};

/* ================= switch-over: BurnsRig uses the rounded builder ================= */
(() => {
  const R = BurnsRig;
  R.buildBlocky = R.buildHuman;
  R.types = BURNS_NPC_TYPES; R.gear = BURNS_GEAR;
  // public extension API (docs/BURNS_GUIDE.md §6.5)
  R.defineType = (name, def) => { BURNS_NPC_TYPES[name] = def || {}; return def; };
  R.defineAcc = (name, fn) => { BURNS_GEAR.acc[name] = fn; };
  R.defineProp = (name, fn) => { BURNS_GEAR.prop[name] = fn; };
  R.defineHat = (name, fn) => { BURNS_GEAR.hat[name] = fn; };
  R.defineGlasses = (name, fn) => { BURNS_GEAR.glasses[name] = fn; };
  const warned = {};
  // type + seed (+ def options: variant, prop, tool) -> spec
  R.npcSpec = function (type, seed, opts) {
    opts = opts || {};
    const r = mulberry32(hashStr(type + ':' + (seed || 0)));
    const skinT = SKIN_TONES[Math.floor(r() * SKIN_TONES.length)], hairC = HAIR_COLORS[Math.floor(r() * 8)];
    const s = { kind: type, seed, skin: skinT.base, skinSh: skinT.sh, hair: { style: r.pick(['short', 'long', 'pony', 'short', 'bald', 'mohawk', 'afro', 'buzz']), col: hairC.base, hi: hairC.hi }, face: r.pick(['friendly', 'goofy', 'lashes', 'friendly']), body: { h: 0.92 + r() * 0.14, w: 0.88 + r() * 0.24 }, acc: [] };
    let T = BURNS_NPC_TYPES[type];
    if (!T) { if (!warned[type]) { warned[type] = true; console.warn(`BurnsRig: unknown NPC type "${type}", using a generic burner (define it with BurnsRig.defineType)`); } T = BURNS_NPC_TYPES.burner; }
    if (T.spec) T.spec(s, r, opts);
    if (opts.prop !== undefined) s.prop = opts.prop;
    s.key = 'npc:' + type + ':' + (seed || 0) + (opts.variant ? ':' + opts.variant : '') + (opts.prop !== undefined ? ':p' + opts.prop : '') + (opts.tool ? ':t' + opts.tool : '') + (s.lit ? ':lit' + s.lit : '');
    return s;
  };
  R.model = function (spec) {
    BURNS_ATLAS.init();   // face/pattern regions must exist before building (safe to call repeatedly)
    const key = spec.key || JSON.stringify(spec);
    let mdl = this.cache[key];
    if (!mdl) {
      const body = burnsBody(spec.body);
      if (window.__burnsBlocky) { mdl = this.buildBlocky(spec); }
      else {
        const hi = BurnsRound.build(spec, false), lo = BurnsRound.build(spec, true), far = BurnsRound.build(spec, 'far');
        // a second held prop (spec.prop2) rides the TAIL bone, re-parented to the left forearm like PROP on the right
        if (hi.A.parent) { body.off = body.off.map(o => o.slice()); body.off[BURNS_BONES.TAIL] = body.off[BURNS_BONES.PROP].slice(); }
        // baked ambient occlusion in the rest pose: under the chin, armpits, between the legs, collars and hems
        if (!window.__burnsNoAO) { const J = BurnsAO.joints(body, hi.A.parent, BURNS_NB); for (const G of [hi.geo, lo.geo]) BurnsAO.bake(G.data, 0, G.nv, G.idx, 0, G.count, { joints: J, res: 40, k: 0.9 }); }
        mdl = { geo: hi.geo, lod: lo.geo, far: far.geo, nb: BURNS_NB, body, headY: body.headY, height: body.height, spec, parent: hi.A.parent || null, wicks: hi.A.wicks };
      }
      this.cache[key] = mdl;
    }
    return mdl;
  };
})();

