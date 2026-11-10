/* ============================================================
   BRADY GOES TO BURNING MAN — skinned characters in play (BurnsSkinActor)
   The bridge between the engine's procedural characters (BurnsChar, animated by name through BURNS_ANIMS) and the
   skinned glTF characters of §6.9 (BurnsSkinnedChar, clips from a file). An entity keeps driving its BurnsChar exactly
   as before; at draw time the bridge reads the BurnsChar's placement, animation name and clock, plays the matching
   clip on a BurnsSkinnedChar and draws THAT with R.skinW instead. When the animation has no clip (bike, climb, flips,
   zip lines, the DJ booth...) or the asset isn't loaded, every hook returns false and the caller draws the procedural
   model as it always did, so nothing in play depends on a model file being there. See docs/BURNS_GUIDE.md §6.11.

   Who is swapped:  Brady (the player, the dialogue portrait, Art Cart's driver)  <- models/brady.glb.gz
                    Chinka (actors of type 'chinka', the Man's captive, Art Cart's driver, portraits) <- models/chinka.glb.gz
   A missing file falls back to models/mannequin.glb.gz (the stand-in of §6.9, one asset shared by both kinds; Chinka's
   stand-in is tinted pink so the two read apart). No file at all (or window.__burnsNoSkinActor = true): procedural.

   Hooks (one-liners in the existing files, every one of the form `BurnsSkinActor.x(...) || <the old draw>`):
     draw(g, R, kind, ch, tint, rim)   one BurnsChar at its own placement (the player, the Man's captive, portraits)
     drawActor(g, R, a)                an actor (type 'chinka' only; beyond 45 m the cheaper procedural LOD)
     drawDriver(R, car, ch, kind)      an Art Cart driver seated through cartPoseDriver's placement under the car's body bone
   ============================================================ */

const BURNS_SKINACTOR = {
  // engine animation name -> clip name. Anything missing here is "not handled": the caller draws the procedural model.
  MAP: {
    idle: 'idle', walk: 'walk', run: 'run', charge: 'run', jump: 'jump', fall: 'jump', land: 'land', hurt: 'hurt', yell: 'hurt',
    knocked: 'knocked', dance: 'dance', shuffle: 'dance', wave: 'wave', talk: 'talk', phone: 'talk', hug: 'hug', sit: 'sit',
    sleep: 'sleep', cheer: 'cheer', captive: 'captive', photo: 'photo', drive: 'drive',
    cartDrive: 'drive', cartFire: 'fire', cartHit: 'hurt', cartCheer: 'cheer', cartSulk: 'sulk'
  },
  // when the asset lacks a clip, the next one down (every chain ends at idle, which every asset has)
  FALLBACK: { run: 'walk', walk: 'idle', jump: 'idle', land: 'idle', hurt: 'idle', knocked: 'hurt', dance: 'idle', wave: 'idle', talk: 'idle', hug: 'wave', sit: 'idle', sleep: 'sit', cheer: 'wave', captive: 'hurt', photo: 'idle', drive: 'sit', fire: 'drive', sulk: 'drive' },
  ONESHOT: { jump: 1, land: 1, knocked: 1, fire: 1 },   // play once and hold the last frame; everything else loops
  FILES: { brady: 'brady', chinka: 'chinka' },           // kind -> models/<stem>.glb(.gz)
  STAND_IN: 'mannequin',
  LOD_D2: 45 * 45,        // actors beyond this draw the procedural LOD (a few hundred triangles vs ~8k skinned)
  SPARKLE_D2: 25 * 25,    // Chinka's glints are emitted only this close to the camera
  SPARKLE_N: 2,           // ...and this many a frame (budget: <= 6)
  CART_SCALE: 1.22        // Art Cart drivers are drawn this much bigger than life so they read from the chase camera
};

class BurnsSkinActor {
  constructor(kind, asset, standIn) {
    this.kind = kind; this.asset = asset; this.standIn = !!standIn;
    this.S = new BurnsSkinnedChar(asset);
    this.unit = +(asset.extras && asset.extras.unit) || 1;   // optional file extra: metres per model unit
    this.tint = this.standIn && kind === 'chinka' ? [1, 0.55, 0.8, 0.35] : null;
    this._anim = null; this._animT = 0; this._clip = null; this.active = false;
    this._x = NaN; this._y = NaN; this._z = NaN; this._yaw = NaN; this._sc = NaN;
    this.seated = null;   // Art Cart: the palette under the car's body bone
  }
  // the clip an engine animation maps to on this asset (with the fallback chain), or null when not handled
  clipFor(anim) {
    let c = BURNS_SKINACTOR.MAP[anim]; if (!c) return null;
    const clips = this.asset.clips;
    while (c && !clips[c]) c = BURNS_SKINACTOR.FALLBACK[c];
    return c && clips[c] ? c : null;
  }
  /* follow a BurnsChar: placement, animation name, clock and speed. Returns false when the current animation has no
     clip (the caller then draws the procedural model). The time step comes from the BurnsChar's own clock (animT), so
     slow motion, freezes and the debug fast-forward all stay in step, and a second call in the same frame costs
     nothing. */
  sync(ch) {
    const S = this.S;
    if (ch.poseFn) { this._anim = null; this.active = false; return false; }   // a custom pose function (pilot seats, zip lines…)
    const clip = this.clipFor(ch.anim);
    if (!clip) { this._anim = ch.anim; this._animT = ch.animT; this.active = false; return false; }
    const same = ch.anim === this._anim;
    let dt = same && ch.animT >= this._animT ? ch.animT - this._animT : ch.animT;
    if (dt > 2) dt = 2; if (dt < 0) dt = 0;
    this._anim = ch.anim; this._animT = ch.animT;
    const speed = (clip === 'walk' || clip === 'run') && ch.k && ch.k.rate ? ch.k.rate : 1;
    if (clip !== this._clip || (!same && BURNS_SKINACTOR.ONESHOT[clip])) {
      S.play(clip, { loop: !BURNS_SKINACTOR.ONESHOT[clip], fade: this.active ? 0.15 : 0, speed, restart: true });
      this._clip = clip;
    } else S.speed = speed;
    const sc = ch.scale * this.unit * (this.cart ? BURNS_SKINACTOR.CART_SCALE : 1);   // kart drivers read bigger, like the cartoon rigs
    const moved = ch.x !== this._x || ch.y !== this._y || ch.z !== this._z || ch.yaw !== this._yaw || sc !== this._sc;
    S.x = this._x = ch.x; S.y = this._y = ch.y; S.z = this._z = ch.z; S.yaw = this._yaw = ch.yaw; S.scale = this._sc = sc;
    S.tint = ch.tint || this.tint; S.face = ch.face || 0;
    if (dt > 0) S.update(dt);
    // walk/run: the clip follows the BurnsChar's stride phase (ground covered; the clock when it isn't moving)
    if ((clip === 'walk' || clip === 'run') && ch._stridePhase !== undefined && S.anim) S.animT = ch._stridePhase * S.anim.duration;
    if (dt > 0 || moved || !S.computed) S.compute();
    this.active = true;
    return true;
  }
  // the palette in the car's frame: cartPoseDriver places the BurnsChar at the seat (car-local), so the same placement
  // goes under the car's body bone (bones[0..11]), exactly as the rigid driver's bones do
  seat(car) {
    // cartPoseDriver places the character so the procedural rig's hips (0.88 m above its origin) sit on the seat; a
    // skinned seated clip keeps its hips wherever it was authored, so lift or drop the palette until its hips sit there too
    const S = this.S, P = S.palette, n = S.nb * 12, B = car.bones, W = this.seated || (this.seated = new Float32Array(n));
    const hp = S.jointPoint('mixamorig:Hips', 0, 0, 0, this._hp || (this._hp = [0, 0, 0]));
    const dy = 0.88 * S.scale - (hp[1] - S.y);
    const T = this._seatP || (this._seatP = new Float32Array(n));
    T.set(P.subarray(0, n)); for (let k = 7; k < n; k += 12) T[k] += dy;
    for (let k = 0; k < n; k += 12) BurnsM.a34Mul(W, k, B, 0, T, k);
    return W;
  }
  // rising white-gold glints around Chinka (the play scene's fx), a couple a frame within 25 m of the camera
  sparkle(g) {
    const S = this.S, cam = g.cam, fx = g.fx; if (!fx || !cam) return;
    const dx = S.x - cam.x, dz = S.z - cam.z; if (dx * dx + dz * dz > BURNS_SKINACTOR.SPARKLE_D2) return;
    const h = (this.asset.height || 1.8) * S.scale;
    BurnsSkinActor.sparkled += BURNS_SKINACTOR.SPARKLE_N;
    for (let i = 0; i < BURNS_SKINACTOR.SPARKLE_N; i++) {
      const a = Math.random() * Math.PI * 2, r = (0.2 + Math.random() * 0.3) * S.scale;
      fx.add(S.x + Math.sin(a) * r, S.y + (0.2 + Math.random() * 0.8) * h, S.z + Math.cos(a) * r, 0, 0.5 + Math.random() * 0.6, 0, 0.55 + Math.random() * 0.35, 0.26, 0.04, i % 2 ? [1, 0.86, 0.5] : [1, 1, 1], 0.9, 'star', 1 | 32, Math.random() * 3, 2);
    }
  }
  draw(R, tint, rim) {
    const S = this.S;
    if (R.pass === 'shadow') R.skinW(this.asset.geo, S.palette, S.nb, null, 0, 0);
    else { R.skinW(this.asset.geo, S.palette, S.nb, tint || S.tint, S.face, rim === undefined ? 0.35 : rim); BurnsSkinActor.drawn++; }
  }
}
/* ---------------- registry, preload and the hooks ---------------- */
Object.assign(BurnsSkinActor, {
  assets: {}, standIn: {}, ready: false, _p: null, drawn: 0, sparkled: 0,
  off() { return typeof window !== 'undefined' && !!window.__burnsNoSkinActor; },
  // a fresh bridge for a kind ('brady' | 'chinka'), or null until its asset (or the stand-in) is loaded
  for(kind) { const A = this.assets[kind]; return A && !this.off() ? new BurnsSkinActor(kind, A, this.standIn[kind]) : null; },
  // the bridge cached on a BurnsChar (rebuilt when the asset changes, e.g. the stand-in replaced by the real file)
  of(kind, ch) {
    if (!ch || this.off()) return null;
    const A = this.assets[kind]; if (!A) return null;
    let B = ch._skinActor;
    if (!B || B.kind !== kind || B.asset !== A) { B = ch._skinActor = new BurnsSkinActor(kind, A, this.standIn[kind]); }
    return B;
  },
  // kind from an Art Cart driver id or type ('brady', 'chinka'; anything else -> null)
  kindOf(idOrType) {
    if (idOrType === 'brady' || idOrType === 'chinka') return idOrType;
    if (typeof idOrType === 'string' && typeof cartDriver === 'function') { const d = cartDriver(idOrType); if (d && d.id === idOrType && (d.type === 'brady' || d.type === 'chinka')) return d.type; }
    return null;
  },
  /* fetch models/index.json (written by tools/build.js), then brady.glb(.gz) and chinka.glb(.gz), each falling back
     to mannequin.glb(.gz); a kind with no file at all stays procedural. Burning Man ships assets/models/burning-man;
     Art Cart's own build ships only assets/models/art-cart, so there the hooks stay dormant unless the character files
     are added to that folder too (the combined build lists everything). */
  preload() {
    if (this._p) return this._p;
    if (typeof BurnsSkin === 'undefined' || typeof BurnsGLTF === 'undefined' || typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) { this.ready = true; return (this._p = Promise.resolve()); }
    this._p = fetch('models/index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
      const have = new Set(Array.isArray(list) ? list : []);
      const pick = stem => { const f = stem + '.glb'; if (have.has(f + '.gz') && BurnsGLTF.canInflate()) return f + '.gz'; return have.has(f) ? f : null; };
      const jobs = [];
      for (const kind of Object.keys(BURNS_SKINACTOR.FILES)) {
        let file = pick(BURNS_SKINACTOR.FILES[kind]), standIn = false;
        if (!file) { file = pick(BURNS_SKINACTOR.STAND_IN); standIn = true; }
        if (!file) continue;
        jobs.push(BurnsSkin.preload('models/' + file, standIn ? BURNS_SKINACTOR.STAND_IN : kind)
          .then(A => { this.assets[kind] = A; this.standIn[kind] = standIn; })
          .catch(e => { console.warn('skin actor ' + kind + ' failed: ' + (e && e.message || e)); }));
      }
      return Promise.all(jobs);
    }).then(() => { this.ready = true; });
    return this._p;
  },
  /* ---- the hooks ---- */
  // one BurnsChar at its own placement. true = drawn skinned (in whichever pass R is in); false = draw the procedural model
  draw(g, R, kind, ch, tint, rim) {
    const B = this.of(kind, ch); if (!B || !B.sync(ch)) return false;
    B.draw(R, tint, rim);
    if (kind === 'chinka' && g && R.pass !== 'shadow') B.sparkle(g);
    return true;
  },
  // an actor of the play scene (type 'chinka'); far actors keep the procedural LOD
  drawActor(g, R, a) {
    if (a.type !== 'chinka' || (a._d2 !== undefined && a._d2 > BURNS_SKINACTOR.LOD_D2)) return false;
    return this.draw(g, R, 'chinka', a.ch);
  },
  // an Art Cart driver (race or showroom): car = { bones, M }, ch = the driver's BurnsChar already placed by cartPoseDriver
  drawDriver(R, car, ch, idOrType) {
    const kind = this.kindOf(idOrType); if (!kind || !car || !car.bones) return false;
    const B = this.of(kind, ch); if (!B) return false;
    B.cart = true;
    if (!B.sync(ch)) return false;
    const W = B.seat(car), S = B.S;
    if (R.pass === 'shadow') R.skinW(B.asset.geo, W, S.nb, null, 0, 0);
    else { R.skinW(B.asset.geo, W, S.nb, S.tint, S.face, 0.45); this.drawn++; }
    return true;
  },
  stats() {
    const out = { ready: this.ready, off: this.off(), drawn: this.drawn, sparkled: this.sparkled, kinds: {} };
    for (const k of Object.keys(BURNS_SKINACTOR.FILES)) { const A = this.assets[k]; out.kinds[k] = A ? { asset: A.name, standIn: !!this.standIn[k], clips: A.clipNames.slice(), tris: A.tris, nb: A.nb } : null; }
    return out;
  }
});
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsSkinActor, BURNS_SKINACTOR });
  // the Burning Man and Art Cart apps (and the combined build) fetch the character files at start; the 2D app has no engine
  if (typeof BRADY_APP === 'undefined' || BRADY_APP !== 'world') setTimeout(() => { try { BurnsSkinActor.preload(); } catch (e) { console.warn('skin actors: ' + (e && e.message || e)); } }, 700);
  setTimeout(() => { const B = window.BRADY_BURNS; if (B && B.debug) B.debug.skinActor = () => BurnsSkinActor.stats(); }, 0);
}
