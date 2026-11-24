/* ============================================================
   BRADY GOES TO BURNING MAN — the realistic cast (BurnsCast)
   NPCs near the camera drawn as realistic people, composed at runtime from one shared kit file (models/cast.glb, Burning
   Man only; docs/BURNS_GUIDE.md §6.13): two MPFB base bodies (a woman, a man) cut into regions, and costume parts
   (tops, coats, bottoms, shoes, hair styles, beards, hats, glasses), all on one texture set painted near-neutral. Each
   NPC's existing look spec (BurnsRig.npcSpec / def.spec: skin, hair, top, bottom, shoes, hat, glasses, beard, coat)
   picks the parts and tints them through vertex colour; body regions an outfit fully hides are left out. Nothing about
   NPC behaviour changes: the actor keeps driving its BurnsChar, and the BurnsSkinActor bridge plays the matching clip.

   Budget rules (per frame, nearest first): at most MAX realistic characters, of which MAX_NEAR at LOD0 (hair cards:
   2 draws; everything else 1 draw, as the procedural figure it replaces). Beyond MID metres, and for types whose look is
   a full costume (fursuits, helmets, hoods, wings, lantern poles), the procedural figure as before. Instanced
   background crowds (BurnsCrowds) are untouched.
   Hooks: BurnsSkinActor.drawActor (non-Chinka actors) and the dialogue portrait (40_burns_i_play.js drawPortrait).
   ============================================================ */
const BURNS_CAST = {
  FILE: 'cast',
  NEAR: 8, MID: 24, MAX: 10, MAX_NEAR: 3,
  HEIGHT: { F: 1.66, M: 1.78 },
  PORTRAIT_K: 1.5,
  // full-costume looks stay procedural (their identity is the costume)
  EXCLUDE_TYPES: { furry: 1, firespinner: 1, fencebot_a: 1, fencebot_b: 1, deathguild: 1, lamplighter: 1, cultleader: 1, brady: 1, chinka: 1 },
  EXCLUDE_ACC: ['trashcanHelmet', 'colanderHelmet', 'fireHood', 'flameWings', 'fairyWings', 'lanternPoles', 'wings', 'cape', 'elwire'],
  // engine animations with no clip of their own: play this clip instead of dropping to the procedural figure
  ANIM: { firespin: 'dance', dj: 'dance', robot: 'dance', lantern: 'idle', dare: 'cheer', think: 'idle', radio: 'talk', welcome: 'wave', clipboard: 'talk', phone: 'talk', bell: 'wave', throw: 'wave', victory: 'cheer', yell: 'hurt', shuffle: 'dance', float: 'jump', fly: 'jump', climb: 'idle', spin: 'dance', flip: 'jump', pound: 'jump', bike: 'drive' }
};
const BURNS_CAST_NEUTRAL = {   // the kit's painted colours (sRGB): tints are target / neutral, in linear
  skinF: '#e2b8a0', skinM: '#dcb49c', hair: '#b5a28c', cloth: '#e8e8e4', denim: '#e6e8ee', felt: '#e6e2da', straw: '#ede2c4', leather: '#dcd8d4', sole: '#eceae8', plastic: '#e6e6e6', beard: '#dcdcdc'
};
class BurnsCastActor extends BurnsSkinActor {
  clipFor(anim) {
    const c = super.clipFor(anim); if (c) return c;
    const alt = BURNS_CAST.ANIM[anim]; if (alt) { const c2 = super.clipFor(alt); if (c2) return c2; }
    return this.asset.clips.idle ? 'idle' : null;
  }
}
const BurnsCast = {
  doc: null, kit: null, share: {}, variants: {}, ready: false, failed: false, _p: null,
  n: { built: 0, drawn: 0, near: 0, released: 0 }, frame: -1, chosen: new Set(), nearSet: new Set(),
  off() { return typeof window !== 'undefined' && (!!window.__burnsNoCast || !!window.__burnsNoSkinActor); },
  lin(hex) { const h = (hex || '#ffffff').replace('#', ''), v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return v.map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); },
  tint(target, neutral, k) { const a = this.lin(target), b = this.lin(neutral); return a.map((c, i) => clamp(c / Math.max(b[i], 1e-3) * (k || 1), 0, 1)); },
  /* the kit file: models/cast.glb(.gz), listed in models/index.json (Burning Man's build only) */
  preload() {
    if (this._p) return this._p;
    if (this.off() || typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) { this.failed = true; return (this._p = Promise.resolve(null)); }
    this._p = fetch('models/index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
      const have = new Set(Array.isArray(list) ? list : []), f = BURNS_CAST.FILE + '.glb';
      const file = have.has(f + '.gz') && BurnsGLTF.canInflate() ? f + '.gz' : have.has(f) ? f : null;
      if (!file) { this.failed = true; return null; }
      return BurnsGLTF.fetch('models/' + file).then(D => {
        this.doc = D; this.kit = (D.sceneExtras && D.sceneExtras.burns_kit) || null;
        if (!this.kit) throw new Error('cast.glb has no burns_kit manifest');
        this.ready = true; return D;
      });
    }).catch(e => { this.failed = true; console.warn('BurnsCast: ' + (e && e.message || e)); return null; });
    return this._p;
  },
  /* ---- spec -> recipe (sex, parts, tints) ---- */
  eligible(a) {
    if (!a || BURNS_CAST.EXCLUDE_TYPES[a.type] || !a.model || !a.model.spec) return false;
    const S = a.model.spec;
    if (S.fursuit || S.hood || S.led || S.costume && S.costume !== 'none') return false;   // LED suits glow: their look is the light
    if ((S.acc || []).some(x => BURNS_CAST.EXCLUDE_ACC.includes(x))) return false;
    const hk = S.hat && S.hat.kind; if (hk === 'skullHood' || hk === 'crown' || hk === 'jester') return false;
    if (a.def && (a.def.realistic === false || a.def.scale && Math.abs(a.def.scale - 1) > 0.25)) return false;
    return true;
  },
  recipe(spec) {
    const S = spec, K = this.kit.parts, fem = !!(S.body && S.body.fem) || /lashes|greeterF|mom/.test(S.face || '') ||
      ['crop', 'halter', 'offshoulder'].includes(S.top && S.top.kind) || ['tutu', 'leggings'].includes(S.bottom && S.bottom.kind);
    const X = fem ? 'F' : 'M', has = n => !!K[X + '_' + n], parts = [], tint = {}, N = BURNS_CAST_NEUTRAL;
    const add = (n, col, neutral, k) => { if (!has(n)) return false; parts.push(X + '_' + n); if (col) tint[X + '_' + n] = this.tint(col, neutral, k); return true; };
    // garments
    const top = (S.top && S.top.kind) || 'tee', topCol = (S.top && S.top.col) || '#dddddd';
    const topKind = { tee: 'tee', button: S.top && S.top.long ? 'long' : 'tee', long: 'long', hoodie: 'long', tank: 'tank', vest: 'tank', crop: fem ? 'crop' : 'tank', halter: fem ? 'crop' : 'tank', offshoulder: fem ? 'crop' : 'tee', none: fem ? 'crop' : null }[top] || (S.top && S.top.long ? 'long' : 'tee');
    if (topKind) add('top_' + topKind, topCol, N.cloth);
    const vestCol = S.vestCol || S.utilVestCol || (S.vest ? '#c8a020' : null);
    if (S.vest || (S.acc || []).some(x => /vest/i.test(x))) add('top_vest', vestCol || '#6a5a3a', N.cloth);
    const ck = S.coat && S.coat.kind;
    if (ck && ck !== 'jacket') { add('coat_long', S.coat.col, N.felt); add('coat_longskirt', S.coat.col, N.felt); }
    else if (ck === 'jacket' && has('top_long')) { const i = parts.indexOf(X + '_top_' + topKind); if (i >= 0) parts.splice(i, 1); add('top_long', S.coat.col, N.cloth); }
    const bk = (S.bottom && S.bottom.kind) || 'pants', bcol = (S.bottom && S.bottom.col) || '#3a4a6a';
    const bot = { jeans: 'pants', cargo: 'pants', chinos: 'pants', pants: 'pants', leggings: 'pants', shorts: 'shorts', kilt: 'skirt', tutu: 'tutu', skirt: 'skirt' }[bk] || 'pants';
    add('bot_' + bot, bcol, bot === 'pants' ? N.denim : N.cloth);
    const sk = (S.shoes && S.shoes.kind) || 'sneakers';
    const shoe = { sneakers: 'sneakers', hightops: 'sneakers', dad: 'sneakers', boots: 'boots', workboots: 'boots', combat: 'boots', furboots: 'boots', sandals: 'sandals', barefoot: null }[sk];
    if (shoe) add('shoe_' + shoe, (S.shoes && S.shoes.col) || '#444444', shoe === 'sneakers' ? N.sole : N.leather);
    // head
    const hk = S.hat && S.hat.kind, hat = { cowboy: 'cowboy', bunnyCowboy: 'cowboy', ranger: 'ranger', hardhat: 'hardhat', cap: 'cap', tophat: 'tophat', sunhat: 'sunhat', fedora: 'fedora', tricorn: 'fedora', furhat: 'beanie', beanie: 'beanie', sunBeanie: 'beanie', wrap: 'beanie' }[hk];
    if (hat) add('hat_' + hat, S.hat.col || '#6a5040', hat === 'cowboy' || hat === 'sunhat' ? N.straw : hat === 'hardhat' ? N.plastic : N.felt);
    const hs = (S.hair && S.hair.style) || 'short';
    let hair = { short: 'short', spiky: 'short', slick: 'slick', buzz: 'buzz', bald: null, long: 'long', down: 'long', wig: 'long', wavy: 'long', pony: 'pony', bun: 'bun', bob: 'bob', curly: 'curly', afro: 'curly', mohawk: 'mohawk' }[hs] || 'short';
    if (hat && hair && !['long', 'bob', 'pony'].includes(hair)) hair = 'buzz';     // short styles live under the hat
    if (S.hood) hair = null;
    if (hair) add('hair_' + hair, (S.hair && S.hair.col) || '#3b2416', N.hair);
    if (!fem && S.beard) add(S.beard.mustacheOnly || (S.beard.len !== undefined && S.beard.len < 0.01 && !S.beard.noMustache) ? 'face_moustache' : 'face_beard', S.beard.col || (S.hair && S.hair.col), N.beard);
    const gl = S.glasses, eyes = gl ? ({ aviator: 'aviator', round: 'round', clear: 'round' }[gl] || 'shades') : S.goggles ? 'goggles' : null;
    if (eyes) add('eyes_' + eyes, null);
    // the body: every region its outfit doesn't fully hide, plus the eyes
    const hidden = new Set(); for (const p of parts) for (const r of (K[p].hides || [])) hidden.add(r);
    for (const r of this.kit.bodies[X].regions) if (!hidden.has(r)) { parts.push(X + '_body_' + r); tint[X + '_body_' + r] = this.tint(this.skinOf(S), X === 'F' ? N.skinF : N.skinM); }
    parts.push(X + '_body_eyeL', X + '_body_eyeR');
    const h = (S.body && S.body.h) || 1;
    return { X, parts, tint, height: BURNS_CAST.HEIGHT[X] * h, key: X + ':' + parts.slice().sort().join(',') + ':' + Object.keys(tint).sort().map(k => tint[k].map(v => v.toFixed(2)).join('/')).join(';') };
  },
  // the procedural skin tones are bright, toy-like: a realistic albedo is about 8 % darker
  skinOf(S) { const c = this.lin(S.skin || '#c98c62').map(v => v * 0.84); return '#' + c.map(v => { v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0'); }).join(''); },
  // the composed asset of a recipe (cached; built on first use)
  variant(rc) {
    let A = this.variants[rc.key];
    if (A) return A;
    A = BurnsSkinPBR.build(this.doc, { name: 'cast:' + rc.key.slice(0, 40), skin: this.skinIndex(rc.X), parts: new Set(rc.parts), tint: rc.tint, texShare: this.share, clipPrefix: rc.X + '_' });
    A.extras = Object.assign({}, A.extras, { unit: rc.height / Math.max(this.kit.bodies[rc.X].height || 1.7, 0.5) });
    this.variants[rc.key] = A; this.n.built++;
    return A;
  },
  skinIndex(X) {
    const J = this.doc.json; if (this._skinIdx && this._skinIdx[X] !== undefined) return this._skinIdx[X];
    this._skinIdx = this._skinIdx || {};
    // the skin whose joints sit under the armature node named Arm<X>
    const nodes = J.nodes || [], target = nodes.findIndex(N => N.name === 'Arm' + X);
    const idx = (J.skins || []).findIndex(sk => sk.joints.some(j => { for (let p = j, k = 0; p >= 0 && k < 64; k++) { if (p === target) return true; p = nodes.findIndex(N => (N.children || []).includes(p)); } return false; }));
    return (this._skinIdx[X] = idx >= 0 ? idx : (X === 'F' ? 0 : 1));
  },
  /* ---- per frame: who is realistic (nearest first, within MID, capped) ---- */
  rank(g) {
    if (this.frame === g.frameN) return;
    this.frame = g.frameN; this.chosen.clear(); this.nearSet.clear();
    if (!this.ready) { if (!this._p) this.preload(); return; }
    const near = BURNS_CAST.NEAR * BURNS_CAST.NEAR, mid = BURNS_CAST.MID * BURNS_CAST.MID, list = [];
    // this frame's draw list (fresh camera distances); characters in view first, then nearest
    // hysteresis: whoever was realistic last frame keeps a 25 % distance bonus and 15 % more range, so characters at
    // the edges of the caps don't flicker between the two looks
    const was = this._was || (this._was = new Set()), wasNear = this._wasNear || (this._wasNear = new Set());
    for (const a of g._drawList || g.actors) {
      if (a.removed || a.hidden || a.cloak || a._d2 === undefined) continue;
      a._castD = a._d2 * (was.has(a) ? 0.75 : 1);
      if (a._castD > mid * (was.has(a) ? 1.32 : 1)) continue;
      if (a._castOk === undefined) a._castOk = this.eligible(a);
      if (a._castOk) list.push(a);
    }
    list.sort((p, q) => (q._inView ? 1 : 0) - (p._inView ? 1 : 0) || p._castD - q._castD);
    for (let i = 0; i < list.length && i < BURNS_CAST.MAX; i++) {
      const a = list[i]; this.chosen.add(a);
      if (this.nearSet.size < BURNS_CAST.MAX_NEAR && a._d2 * (wasNear.has(a) ? 0.8 : 1) < near) this.nearSet.add(a);
    }
    was.clear(); for (const a of this.chosen) was.add(a); wasNear.clear(); for (const a of this.nearSet) wasNear.add(a);
  },
  bridge(a, g) {
    let B = a.ch._castActor;
    const spec = a.model.spec;
    if (!B || B.spec !== spec) {
      const rc = this.recipe(spec), A = this.variant(rc);
      B = a.ch._castActor = new BurnsCastActor('cast', A, false); B.spec = spec; B.unit = A.extras.unit;
    }
    return B;
  },
  drawActor(g, R, a) {
    if (this.off() || !g || !a.ch || !a.model) return false;
    this.rank(g);
    if (!this.chosen.has(a)) return false;
    let B;
    try { B = this.bridge(a, g); } catch (e) { console.warn('BurnsCast: ' + (e && e.message || e)); a._castOk = false; return false; }
    if (!B.sync(a.ch)) return false;
    // LOD: the near few may use LOD0 (hair cards); everyone else LOD1+ (one draw)
    const keep = BurnsSkinPBR.forceLod;
    if (keep === null || keep === undefined) BurnsSkinPBR.forceLod = this.nearSet.has(a) ? null : Math.max(1, a._d2 > 15 * 15 ? 2 : 1);
    try { B.draw(R, a.ch.tint || null, a.ch.rim === undefined ? 0.35 : a.ch.rim); } finally { BurnsSkinPBR.forceLod = keep; }
    if (R.pass !== 'shadow') { this.n.drawn++; if (this.nearSet.has(a)) this.n.near++; }
    return true;
  },
  // the portrait camera is framed for the procedural figures' big heads: a realistic speaker is drawn PORTRAIT_K times
  // larger there, and the camera aims at its real head (null = not drawn by the cast: keep the procedural framing)
  portraitHeadY(who, model) {
    if (this.off() || !this.ready || !model || !model.spec || who === 'brady') return null;
    const fake = { type: (who && who.type) || model.spec.kind, model, def: (who && who.def) || {} };
    if (!this.eligible(fake)) return null;
    return this.recipe(model.spec).height * BURNS_CAST.PORTRAIT_K * 0.93 + 0.02;
  },
  // the dialogue portrait: an NPC speaker (an actor, or { name, model } built from a spec) drawn realistic
  drawPortrait(R, who, model, ch) {
    if (this.off() || !this.ready || !model || !model.spec) return false;
    const fake = { type: (who && who.type) || model.spec.kind, model, def: (who && who.def) || {} };
    if (!this.eligible(fake)) return false;
    let B = ch._castActor;
    try { if (!B || B.spec !== model.spec) { const rc = this.recipe(model.spec), A = this.variant(rc); B = ch._castActor = new BurnsCastActor('cast', A, false); B.spec = model.spec; B.unit = A.extras.unit; } } catch (e) { return false; }
    if (!B.sync(ch)) return false;
    const keep = BurnsSkinPBR.forceLod, u = B.unit; BurnsSkinPBR.forceLod = 0; B.unit = u * BURNS_CAST.PORTRAIT_K; B._sc = NaN; B.sync(ch);
    try { B.draw(R, null, 0.6); } finally { BurnsSkinPBR.forceLod = keep; B.unit = u; }
    return true;
  },
  // a world's composed characters go with it (geometry and the GPU copies of the shared textures; the file stays)
  releaseWorld(scene) {
    for (const k of Object.keys(this.variants)) { const A = this.variants[k]; BurnsSkinPBR.release(A); delete this.variants[k]; this.n.released++; }
    for (const k in this.share) BurnsSkinPBR.freeTex(this.share[k]);
    if (scene && scene.actors) for (const a of scene.actors) if (a.ch) a.ch._castActor = null;
  },
  stats() {
    let geo = 0, tris0 = 0; for (const k in this.variants) { const m = BurnsSkinPBR.memory(this.variants[k]); geo += m.geoMB; tris0 += this.variants[k].tris; }
    let tex = 0; for (const k in this.share) tex += this.share[k].bytes || 0;
    return { ready: this.ready, failed: this.failed, variants: Object.keys(this.variants).length, geoMB: +geo.toFixed(2), texMB: +(tex / 1048576).toFixed(2), chosen: this.chosen.size, near: this.nearSet.size, counters: Object.assign({}, this.n), avgTris0: Object.keys(this.variants).length ? Math.round(tris0 / Object.keys(this.variants).length) : 0 };
  }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsCast, BURNS_CAST, BurnsCastActor });
  setTimeout(() => {
    const B = window.BRADY_BURNS; if (B && B.debug) B.debug.cast = () => BurnsCast.stats();
    if (typeof BurnsScenes !== 'undefined' && !BurnsScenes.releaseWorld.__cast) {
      const rel = BurnsScenes.releaseWorld;
      BurnsScenes.releaseWorld = function (scene) { const r = rel.apply(this, arguments); try { BurnsCast.releaseWorld(scene); } catch (e) { /* ignore */ } return r; };
      BurnsScenes.releaseWorld.__cast = true;
    }
  }, 0);
  setTimeout(() => { try { BurnsCast.preload(); } catch (e) { /* ignore */ } }, 1500);
}
