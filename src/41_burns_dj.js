/* ============================================================
   BRADY GOES TO BURNING MAN — BurnsDJ: the shared DJ-decks minigame
   ------------------------------------------------------------
   BurnsDJ.open(g, { title, bpm, genre, difficulty, duration, crowd, onDone(result) })
     g           the running BurnsPlayScene
     title       set name shown on the decks ('LIVE ON EL PULPO')
     bpm         snapped to the nearest tempo that has real dance tracks in the
                 game (120..140 today) so the visual beat and the music line up.
     genre       'house' | 'techno' | 'disco' | 'trance' | 'melodic' | 'breaks' | 'bass'
     difficulty  1..3 (or 0..1, or 'easy' | 'normal' | 'hard')
     duration    seconds (~45..90). The set is built from 4-bar phrases.
     crowd       optional: a number (how many dancers), an array of actors,
                 or {x, z, r} (where the crowd stands). Default: friendly
                 actors in front of the booth, topped up with temporary dancers.
     onDone(r)   r = { score 0..1, grade 'S'|'A'|'B'|'C'|'D', crowdPeak 0..1, perfects,
                       greats, oks, misses, maxCombo, accuracy, forfeit }
   Optional extras: booth {x, y, z, yaw} (where Brady stands; default: where he
   is, facing the crowd), exclude [actor ids], intro: false (skip the title
   card), deck3d (true/false: a 3D DJ table under Brady's hands; default: only
   when nothing is built in front of him), music (a dance-track id to play on
   deck A, e.g. 'burns_w6'), deckA / deckB {name, artist}, quotes {S, A, B, C, D}.
   BurnsDJ.isOpen(g) tells whether a set is running; BurnsDJ.session is the live set.
   onDone fires after the player dismisses the results card (or leaves the booth
   from the pause menu: forfeit = true). It may open another set straight away.
   Keys: D F J K pads, Space DROP, Shift/S hold filter, Up/Down pitch, Right
   crossfade, X scratch, P/Esc pause. Tests: BurnsDJ.session.autoplay(q 0..1).

   How a set plays (all touch, two thumbs, ~45-90 s):
     WARM UP    tap the pads as the rings close on them (on the beat)
     BEATMATCH  drag deck B's pitch (jog or fader) until its beat grid stops drifting
     MIX IN     slide the crossfader across on the 1 of the next phrase
     GROOVE     more pads
     BUILD      HOLD the filter knob through the riser
     DROP       tap DROP on the downbeat
     PEAK       dense pads, a SCRATCH bar (rub a jog wheel), then LAST CALL
   Perfects build combos and crowd energy; misses cost energy. The crowd dances
   harder as the energy climbs. Grade S..D at the end (confetti, CO2 and lasers on S).

   While a set runs the world is paused (it's a modal minigame): only the crowd,
   particles, lights and lasers animate. The scene's update, camera and HUD
   overlay are wrapped on the instance and restored when the set closes.
   ============================================================ */

const BURNS_DJ_TRACKS = [
  { id: 'w6', bpm: 126, genre: 'house', name: 'Esplanade Peak Hour', artist: 'The Lamplight Choir' },
  { id: 'land9', bpm: 126, genre: 'trance', name: 'Sunrise Sermon', artist: 'Dawn Patrol' },
  { id: 'title', bpm: 124, genre: 'house', name: 'Welcome Home Anthem', artist: 'Gate Road Kids' },
  { id: 'underground', bpm: 124, genre: 'techno', name: 'Deep Dome Dub', artist: 'Sub Lima' },
  { id: 'burns_w9', bpm: 124, genre: 'techno', name: 'Whiteout (Extended)', artist: 'Dust Devil Collective' },
  { id: 'burns_w3', bpm: 124, genre: 'disco', name: 'Sequins & Sorrow', artist: 'Glitter Bomb' },
  { id: 'land3', bpm: 128, genre: 'house', name: 'Laser Lasso', artist: 'Esplanade Kids' },
  { id: 'burns_w6', bpm: 128, genre: 'techno', name: 'Octopus Ink (Fire Edit)', artist: 'Tentacle Theory' },
  { id: 'burns_w7', bpm: 122, genre: 'melodic', name: 'Golden Hour Hug', artist: 'Heart Car Hotline' },
  { id: 'w8', bpm: 122, genre: 'techno', name: 'Deep Playa Hypnosis', artist: 'Moop Patrol' },
  { id: 'w7', bpm: 120, genre: 'disco', name: 'Cowbell Commune', artist: 'The Disco Sherpas' },
  { id: 'boss', bpm: 140, genre: 'breaks', name: 'Acid Dust Storm', artist: 'Whirlwind Kevin' },
  { id: 'man_boss', bpm: 136, genre: 'bass', name: 'Effigy Stomp', artist: 'Wooden Feelings' }
];
const BURNS_DJ_LANES = [
  { col: '#ff4fd8', label: 'KICK', sfx: 'bump', pitch: 1.0, vol: 0.55 },
  { col: '#ffe24a', label: 'LASER', sfx: 'laser', pitch: 1.0, vol: 0.32 },
  { col: '#7aff5a', label: 'STAB', sfx: 'headbang', pitch: 1.0, vol: 0.2 },
  { col: '#38f2ff', label: 'CHIME', sfx: 'pick', pitch: 1.0, vol: 0.32 }
];
const BURNS_DJ_JUDGE = { perfect: { v: 1, col: '#ffe24a', txt: 'PERFECT' }, great: { v: 0.75, col: '#38f2ff', txt: 'GREAT' }, ok: { v: 0.45, col: '#ffffff', txt: 'OK' }, miss: { v: 0, col: '#ff3b5c', txt: 'MISS' } };
const BURNS_DJ_SHOUT_UP = ['WOOO!', 'DROP IT!', 'THIS SLAPS!', 'BASS FACE!', 'ONE MORE!', 'I LOVE YOU, STRANGER!', 'MY TOTEM IS SHAKING!', 'HANDS UP!', 'YESSS!', 'WHO IS THIS?!'];
const BURNS_DJ_SHOUT_DOWN = ['Is the DJ okay?', 'Boooo!', 'Play something we know!', '*checks phone*', 'My kombucha has more bass.', 'Trainwreck!', 'Was that on purpose?'];
const BURNS_DJ_QUOTES = {
  S: ['LEGENDARY. The playa will talk about this one.', 'Somebody call the Temple, that set was spiritual.', 'The dust is dancing on its own now.'],
  A: ['Huge set! The crowd wants more.', 'That mix was butter. Playa butter.', 'Strangers are hugging. Mission accomplished.'],
  B: ['Solid set. Feet are moving.', 'Good vibes, a couple of bumps.', 'The crowd approves. Mostly.'],
  C: ['Some people danced. Some people left for grilled cheese.', 'It was... a set.', 'Nice hat, though.'],
  D: ['The crowd went to find a different camp.', 'That was a trainwreck. A beautiful, dusty trainwreck.', 'Even the porta-potties booed.']
};

/* ---------- custom animations: Brady at the decks + the crowd reacting ---------- */
(() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  // k: { bpm, pump 0..1 (fist pump), cue 0..1 (hand on the headphones), rub 0..1 (scratching), lean }
  BURNS_ANIMS.burnsDJBrady = (P, t, k) => {
    k = k || {};
    const bpm = k.bpm || 124, b = t * bpm / 60 * TAU, beatK = Math.pow(Math.max(0, Math.cos(b)), 3), s2 = Math.sin(b * 0.5);
    const pump = clamp(k.pump || 0, 0, 1), cue = clamp(k.cue || 0, 0, 1), rub = clamp(k.rub || 0, 0, 1);
    const scr = Math.sin(t * 22) * 0.25 * rub;
    // both hands on the decks, forearms working the controls
    S(P, B.UARM_L, lerp(-0.72 + Math.sin(t * 3.1) * 0.06 + scr, -0.45, cue), 0, lerp(0.2, 1.25, cue));
    S(P, B.FARM_L, lerp(-0.8 + Math.sin(t * 4.3) * 0.12, -2.25, cue));
    S(P, B.UARM_R, lerp(-0.7 + Math.sin(t * 2.7 + 1) * 0.07, -2.95, pump), 0, lerp(-0.22, -0.25, pump));
    S(P, B.FARM_R, lerp(-0.85 + Math.sin(t * 3.7 + 2) * 0.1, -0.35 + Math.sin(t * 12) * 0.3 * pump, pump));
    S(P, B.CHEST, 0.16 + beatK * 0.07, s2 * 0.08);
    S(P, B.HEAD, 0.12 + beatK * 0.26, s2 * 0.12 + cue * 0.2, cue * 0.15);
    S(P, B.HIPS, 0, s2 * 0.1);
    S(P, B.THIGH_L, -0.12 - beatK * 0.14); S(P, B.SHIN_L, 0.22 + beatK * 0.28);
    S(P, B.THIGH_R, -0.08 - beatK * 0.12); S(P, B.SHIN_R, 0.18 + beatK * 0.24);
    P.y = -beatK * 0.05; S(P, B.HAIR, beatK * 0.35);
    P.face = pump > 0.5 ? 3 : 0;
  };
  // k: { bpm, e 0..1 energy, st 0..3 variant, cheer 0..1 }
  BURNS_ANIMS.burnsDJCrowd = (P, t, k) => {
    k = k || {};
    const bpm = k.bpm || 124, e = clamp(k.e === undefined ? 0.5 : k.e, 0, 1), st = (k.st || 0) % 4, ch = clamp(k.cheer || 0, 0, 1);
    const b = t * bpm / 60 * TAU, beatK = Math.pow(Math.max(0, Math.cos(b)), 2), s = Math.sin(b), s2 = Math.sin(b * 0.5), c2 = Math.cos(b * 0.5);
    const amp = 0.25 + e * 0.75, hands = clamp((e - 0.45) * 2.2 + ch, 0, 1), jump = clamp((e - 0.72) * 3.2 + ch, 0, 1);
    // knees on the beat, hips swaying on the half beat
    S(P, B.THIGH_L, -0.1 - beatK * 0.25 * amp); S(P, B.SHIN_L, 0.2 + beatK * 0.45 * amp);
    S(P, B.THIGH_R, -0.1 - beatK * 0.25 * amp); S(P, B.SHIN_R, 0.2 + beatK * 0.45 * amp);
    S(P, B.HIPS, 0, s2 * 0.22 * amp, s2 * 0.06 * amp);
    S(P, B.CHEST, 0.06 + beatK * 0.08 * amp, -s2 * 0.18 * amp, -s2 * 0.05);
    S(P, B.HEAD, 0.05 + beatK * 0.22 * amp - hands * 0.25, s2 * 0.15 * amp);
    // arms: low pump -> one hand up -> both hands up waving
    const lowL = -0.9 + s * 0.45 * amp, lowR = -0.9 - s * 0.45 * amp;
    const upL = -2.95 + s2 * 0.25, upR = -2.95 - s2 * 0.25;
    const handsL = st === 1 ? clamp(hands * 1.5, 0, 1) : hands, handsR = st === 2 ? clamp(hands * 1.6, 0, 1) : st === 3 ? hands * 0.6 : hands;
    S(P, B.UARM_L, lerp(lowL, upL, handsL), 0, lerp(0.25, 0.35 + c2 * 0.25, handsL));
    S(P, B.FARM_L, lerp(-1.3, -0.25, handsL));
    S(P, B.UARM_R, lerp(lowR, upR, handsR), 0, lerp(-0.25, -0.35 - c2 * 0.25, handsR));
    S(P, B.FARM_R, lerp(-1.3, -0.25, handsR));
    // jump on the beat when the crowd is wild
    const hop = jump * Math.max(0, Math.sin(((t * bpm / 60) % 1) * Math.PI));
    P.y = -beatK * 0.07 * amp + hop * (0.24 + ch * 0.18);
    S(P, B.HAIR, beatK * 0.3 + hop * 0.4);
    P.face = (e > 0.7 || ch > 0.3) ? 3 : 0;
  };
})();

/* ---------- the module ---------- */
const BurnsDJ = {
  session: null,
  tracks: BURNS_DJ_TRACKS,
  normDiff(d) {
    if (typeof d === 'string') return ({ easy: 0, normal: 0.5, medium: 0.5, hard: 1, expert: 1 })[d.toLowerCase()] !== undefined ? ({ easy: 0, normal: 0.5, medium: 0.5, hard: 1, expert: 1 })[d.toLowerCase()] : 0.5;
    if (typeof d !== 'number' || !isFinite(d)) return 0.5;
    if (d <= 1) return clamp(d, 0, 1);
    return clamp((d - 1) / 2, 0, 1);
  },
  // two decks at the same tempo (closest to the request), genre first
  pickTracks(bpm, genre, music) {
    bpm = clamp(+bpm || 124, 80, 170);
    const names = (window.Sound && Sound.trackNames) || [];
    const avail = BURNS_DJ_TRACKS.filter(t => !names.length || names.indexOf(t.id) >= 0);
    const L = avail.length ? avail : BURNS_DJ_TRACKS;
    // a caller's own dance track (o.music) becomes deck A; deck B matches its tempo
    const own = music && L.find(t => t.id === music);
    if (own) { const mates = L.filter(t => t.bpm === own.bpm && t !== own); return [own, mates.find(t => t.genre === own.genre) || mates[0] || own]; }
    const tempos = Array.from(new Set(L.map(t => t.bpm)));
    // prefer tempos with two tracks (a real mix), then closeness
    tempos.sort((a, b) => (Math.abs(a - bpm) + (L.filter(t => t.bpm === a).length < 2 ? 4 : 0)) - (Math.abs(b - bpm) + (L.filter(t => t.bpm === b).length < 2 ? 4 : 0)));
    const T = tempos[0], at = L.filter(t => t.bpm === T);
    const g = (genre || '').toLowerCase();
    at.sort((a, b) => (b.genre === g ? 1 : 0) - (a.genre === g ? 1 : 0));
    return [at[0], at[1] || at[0]];
  },
  isOpen(g) { return !!(this.session && this.session.active && (!g || this.session.g === g)); },
  open(g, o) {
    o = o || {};
    if (!g || !g.player || !g.world) { if (o.onDone) try { o.onDone(BurnsDJ.blankResult(true)); } catch (e) { /* ignore */ } return null; }
    if (this.session && this.session.active) {
      if (this.session.g === g) return this.session;
      this.session.detach();
    }
    const S = new BurnsDJSession(g, o);
    this.session = S;
    S.install();
    return S;
  },
  // the 3D DJ table (built once): a rounded table, two turntables with spinning platters, a glowing mixer
  deckGeo() {
    if (this._deckGeo) return this._deckGeo;
    const m = new BurnsMesh(4096);
    m.setBone(0);
    m.color('#1a1822').shine(1); m.roundBox(0, 0.47, 0, 1.75, 0.94, 0.62, 0.08);
    m.color('#ff4fd8', 1); m.roundBox(0, 0.62, 0.315, 1.6, 0.05, 0.02, 0.01);
    m.color('#38f2ff', 1); m.roundBox(0, 0.3, 0.315, 1.6, 0.05, 0.02, 0.01); m.emissive(0);
    for (const sd of [-1, 1]) {
      m.color('#2a2833').shine(2); m.roundBox(sd * 0.52, 0.985, 0, 0.66, 0.09, 0.5, 0.03);
      m.color('#c8c8d4').shine(3); m.push(); m.tf(sd * 0.52 + 0.24, 1.03, -0.16); m.limb(0, 0, 0, -0.05, 0.02, 0.24, 0.012, 0.01, { seg: 6 }); m.pop(); m.shine(0);
      m.color(sd > 0 ? '#ff4fd8' : '#38f2ff', 0.9); m.roundBox(sd * 0.52 - 0.27 * sd, 1.035, 0.17, 0.05, 0.02, 0.12, 0.008); m.emissive(0);
    }
    m.color('#24222c').shine(2); m.roundBox(0, 1.0, 0, 0.32, 0.12, 0.46, 0.03);
    const cols = ['#ff4fd8', '#ffe24a', '#38f2ff'];
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { m.color(cols[i], 0.6); m.push(); m.tf(sd * 0.07, 1.065, -0.14 + i * 0.09); m.roundCyl(0, 0, 0, 0.022, 0.03, 0.008, { seg: 8 }); m.pop(); }
    m.color('#ffffff', 0.8); m.roundBox(0, 1.068, 0.17, 0.16, 0.012, 0.03, 0.006); m.emissive(0).shine(0);
    // platters (centred on their bones)
    for (const bone of [1, 2]) {
      m.setBone(bone);
      m.color('#0d0d12').shine(2); m.push(); m.tf(0, 0.035, 0); m.roundCyl(0, 0, 0, 0.21, 0.02, 0.006, { seg: 20 }); m.pop();
      m.color(bone === 1 ? '#ff4fd8' : '#38f2ff', 0.7); m.push(); m.tf(0, 0.056, 0); m.roundCyl(0, 0, 0, 0.07, 0.006, 0.002, { seg: 14 }); m.pop();
      m.color('#ffffff', 0.9); m.roundBox(0.12, 0.058, 0, 0.12, 0.004, 0.012, 0.002); m.emissive(0).shine(0);
    }
    m.setBone(0);
    this._deckGeo = m.geo();
    return this._deckGeo;
  },
  blankResult(forfeit) { return { score: 0, grade: 'D', crowdPeak: 0, perfects: 0, greats: 0, oks: 0, misses: 0, maxCombo: 0, accuracy: 0, forfeit: !!forfeit }; },
  // grade thresholds (score 0..1)
  grade(score) { return score >= 0.9 ? 'S' : score >= 0.78 ? 'A' : score >= 0.62 ? 'B' : score >= 0.42 ? 'C' : 'D'; },
  gradeCol: { S: '#ffd84a', A: '#ff4fd8', B: '#38f2ff', C: '#7aff5a', D: '#9a8aa8' }
};

/* overlay hook: while a set runs, the DJ panel replaces the HUD overlay */
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    const S = g && g.burnsDJ;
    if (S && S.active) { try { S.draw(ctx, fdt); } catch (e) { Game.reportError(e); S.abort(); } return; }
    prev.call(this, ctx, g, fdt);
  };
})();

class BurnsDJSession {
  constructor(g, o) {
    this.g = g; this.o = o; this.active = false;
    this.diff = BurnsDJ.normDiff(o.difficulty);
    const tr = BurnsDJ.pickTracks(o.bpm || 124, o.genre, o.music);
    this.trackA = Object.assign({}, tr[0], o.deckA || {}); this.trackB = Object.assign({}, tr[1], o.deckB || {});
    this.bpm = this.trackA.bpm; this.spb = 60 / this.bpm;
    this.title = String(o.title || 'LIVE SET').toUpperCase();
    this.genre = String(o.genre || this.trackA.genre || 'house').toUpperCase();
    this.dur = clamp(+o.duration || 60, 30, 150);
    this.seed = hashStr(this.title + ':' + this.bpm + ':' + this.dur + ':' + this.diff);
    this.rng = mulberry32(this.seed);
    const p = g.player;
    // booth: where Brady stands (default: where he is now)
    const b = o.booth || {};
    this.booth = { x: b.x !== undefined ? b.x : p.x, y: b.y !== undefined ? b.y : p.y, z: b.z !== undefined ? b.z : p.z, yaw: b.yaw !== undefined ? b.yaw : p.yaw };
    this.reset();
  }
  /* ---------------- set-up ---------------- */
  reset() {
    const d = this.diff;
    this.phase = 'intro'; this.rt = 0; this.t = -1; this.paused = false; this.pauseSel = 0;
    this.win = { p: lerp(0.075, 0.05, d), g: lerp(0.14, 0.1, d), o: lerp(0.22, 0.16, d) };
    this.approach = lerp(1.15, 0.7, d);
    this.energy = clamp(typeof this.o.crowd === 'number' && this.o.crowd > 0 && this.o.crowd <= 1 ? this.o.crowd : 0.3, 0.05, 0.9);
    this.peak = this.energy; this.eAcc = 0; this.eTime = 0;
    this.st = { perfect: 0, great: 0, ok: 0, miss: 0, combo: 0, maxCombo: 0, wSum: 0, vSum: 0, stray: 0 };
    this.pops = []; this.big = null; this.shouts = []; this.flashK = 0; this.dropK = 0; this.riser = 0; this.co2 = []; this.result = null;
    this.pitch = { off: 0, phase: 0, locked: false, hold: 0, lockT: null, judged: false, loaded: false, alignK: 0 };
    this.xf = { pos: 0, drag: null, glide: null, crossT: null, judged: false, free: false };
    this.filter = { held: false, keys: false, ptr: null, heldTime: 0, pos: 0, judged: false, fizz: false };
    this.drop = { judged: false, res: null }; this.finish = { judged: false };
    this.scratch = { amt: 0, judged: false, last: 0, dir: 0 };
    this.padK = [0, 0, 0, 0]; this.padHit = [0, 0, 0, 0];
    this.ptr = new Map(); this.q = []; this.keysDown = {};
    this.musicSwitched = false; this.lastBeat = -1; this.beatK = 0; this.barK = 0; this.jogSpin = {}; this.cued = {}; this.banner = null; this.timers = []; this.quote = null; this.camK = this.camK || 0;
    this.chart();
  }
  // the set: sections in 4-bar phrases, then pad notes
  chart() {
    const d = this.diff, barS = 4 * this.spb, N = Math.round(this.dur / barS);
    let W = 4, B = 4, G = d < 0.3 ? 6 : 4, Bu = d < 0.3 ? 2 : 4, K = 4;
    const base = 1 + W + B + G + Bu + K + 1, k = Math.max(0, Math.round((N - base) / 4));
    for (let i = 0; i < k; i++) { if (i % 3 === 0) K += 4; else if (i % 3 === 1) G += 4; else W += 4; }
    const sec = {}; let bar = 0;
    const add = (name, n) => { sec[name] = { b0: bar, b1: bar + n, t0: bar * barS, t1: (bar + n) * barS }; bar += n; };
    add('count', 1); add('warm', W); add('match', B); add('groove', G); add('build', Bu); add('peak', K); add('outro', 1);
    this.sec = sec; this.totalBars = bar; this.endT = bar * barS;
    this.mixT = sec.groove.t0; this.dropT = sec.peak.t0; this.finishT = sec.outro.t0;
    this.scratchBar = K >= 8 ? sec.peak.b0 + 4 : -1;
    // pad notes
    const R = mulberry32(this.seed ^ 0x51ab), notes = [];
    const LANES = [[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 3], [0, 0, 3, 3], [1, 2, 1, 2], [0, 3, 0, 3], [2, 1, 2, 1], [0, 1, 0, 1], [3, 2, 3, 2], [1, 0, 2, 3]];
    const PAT = [
      [[0, 4]],
      [[0, 2, 4, 6]],
      [[0, 2, 3, 4, 6], [0, 2, 4, 5, 6], [0, 1, 2, 4, 6], [0, 2, 4, 6, 7]],
      [[0, 2, 3, 4, 6, 7], [0, 1, 2, 4, 5, 6], [0, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 6]]
    ];
    const addBar = (b, dens, lanes, opts) => {
      opts = opts || {};
      const pats = PAT[clamp(dens, 0, 3)], pat = pats[Math.floor(R() * pats.length)], lp = LANES[Math.floor(R() * LANES.length)];
      pat.forEach((step, i) => {
        if (opts.from !== undefined && step < opts.from) return;
        let lane = lp[i % lp.length]; if (lanes) lane = lanes[lane % lanes.length];
        notes.push({ t: (b * 4 + step / 2) * this.spb, lane, judged: false });
        if (opts.doubles && step === 0 && b % 4 === 1) notes.push({ t: (b * 4) * this.spb, lane: lanes ? lanes[(lane + 2) % lanes.length] : (lane + 2) % 4, judged: false });
      });
    };
    const dWarm = d < 0.3 ? 0 : 1, dGroove = d < 0.3 ? 1 : d < 0.7 ? 1 : 2, dPeak = d < 0.3 ? 1 : d < 0.7 ? 2 : 3;
    for (let b = sec.warm.b0; b < sec.warm.b1; b++) addBar(b, b === sec.warm.b0 ? 0 : dWarm);
    for (let b = sec.groove.b0 + 1; b < sec.groove.b1; b++) addBar(b, (b - sec.groove.b0) % 2 && d >= 0.3 && d < 0.7 ? 2 : dGroove, null, { doubles: d >= 0.7 });
    if (d >= 0.7) for (let b = sec.build.b0; b < sec.build.b1 - 1; b++) addBar(b, b < sec.build.b0 + 2 ? 1 : 2, [2, 3]);
    for (let b = sec.peak.b0 + 1; b < sec.peak.b1; b++) { if (b === this.scratchBar) continue; addBar(b, b === sec.peak.b1 - 1 ? Math.max(1, dPeak - 1) : dPeak, null, { doubles: d >= 0.5 }); }
    notes.sort((a, b) => a.t - b.t);
    this.notes = notes;
    this.nTotal = notes.length;
  }
  /* ---------------- install / uninstall on the scene ---------------- */
  install() {
    const g = this.g, S = this, p = g.player;
    this.active = true;
    this.saved = {
      update: Object.getOwnPropertyDescriptor(g, 'update'), cam: Object.getOwnPropertyDescriptor(g, 'updateCamera'),
      state: g.state, locked: p.locked, anim: p.animOverride, music: (window.Sound && Sound.currentTrack) || null, camFrom: g.camState ? g.camState() : null
    };
    g.update = function (dt) { S.step(dt); };
    g.updateCamera = function (fdt) { S.camera(fdt); };
    g.state = 'dj'; g.burnsDJ = this;
    if (g.syncHudButtons) g.syncHudButtons();
    Input.setMode('ui'); Input.taps.length = 0;
    // Brady to the booth
    if (p.vehicle && p.vehicle.kind === 'bike') p.vehicle.dismount(p);
    if (!p.vehicle) p.teleport(this.booth.x, this.booth.y, this.booth.z, this.booth.yaw);
    p.vx = p.vy = p.vz = 0; p.invT = 0; p.hurtT = 0; p.spinT = 0; p.pound = 0; p.locked = true;
    if (this.o.booth && this.o.booth.yaw !== undefined) p.yaw = this.booth.yaw;
    this.gatherCrowd();
    p.yaw = this.booth.yaw;
    p.ch.play('burnsDJBrady', { bpm: this.bpm }); p.animOverride = null;
    // 3D lasers / glows ride the boss draw pass
    this.fx3d = { djFx: true, update() {}, draw: R => { try { S.draw3d(R); } catch (e) { /* visuals only */ } } };
    // a 3D DJ table under Brady's hands, unless the world already built a booth there
    let wantDeck = this.o.deck3d;
    if (wantDeck === undefined) {
      wantDeck = true;
      try {
        const b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw);
        for (const hh of [0.8, 1.05]) if (g.world.raycast(b.x, b.y + hh, b.z, b.x + f * 1.3, b.y + hh, b.z + c * 1.3, false) < 1) wantDeck = false;
      } catch (e) { /* keep it */ }
    }
    if (wantDeck) { this.fx3d.model = { geo: BurnsDJ.deckGeo() }; this.fx3d.ch = { bones: new Float32Array(3 * 12), nb: 3, face: 0 }; this.poseDeck(); }
    g.addBoss(this.fx3d);
    // raw pointer + key events (precise timing, multitouch)
    const cv = Game.canvas;
    this.h = {
      down: e => S.ev('down', e), move: e => S.ev('move', e), up: e => S.ev('up', e), cancel: e => S.ev('up', e),
      kd: e => S.key(e, true), ku: e => S.key(e, false),
      // phone locked / app switched mid-set: pause (stops the music; resuming rewinds to the bar)
      vis: () => { if (document.hidden && S.active && Game.scene === S.g && S.phase === 'play' && !S.paused) S.setPause(true); }
    };
    cv.addEventListener('pointerdown', this.h.down); cv.addEventListener('pointermove', this.h.move);
    cv.addEventListener('pointerup', this.h.up); cv.addEventListener('pointercancel', this.h.cancel);
    window.addEventListener('keydown', this.h.kd); window.addEventListener('keyup', this.h.ku);
    document.addEventListener('visibilitychange', this.h.vis);
    burnsSfx('throw', { vol: 0.5 });
    if (this.o.intro === false) this.introT = 0.9;
  }
  detach() {
    if (this.h) {
      const cv = Game.canvas;
      cv.removeEventListener('pointerdown', this.h.down); cv.removeEventListener('pointermove', this.h.move);
      cv.removeEventListener('pointerup', this.h.up); cv.removeEventListener('pointercancel', this.h.cancel);
      window.removeEventListener('keydown', this.h.kd); window.removeEventListener('keyup', this.h.ku);
      document.removeEventListener('visibilitychange', this.h.vis);
      this.h = null;
    }
  }
  uninstall() {
    const g = this.g, p = g.player, sv = this.saved;
    this.detach();
    if (sv.update) Object.defineProperty(g, 'update', sv.update); else delete g.update;
    if (sv.cam) Object.defineProperty(g, 'updateCamera', sv.cam); else delete g.updateCamera;
    if (g.state === 'dj') g.state = sv.state === 'dj' ? 'play' : (sv.state || 'play');
    g.burnsDJ = null;
    g.bosses = g.bosses.filter(b => b !== this.fx3d);
    p.locked = sv.locked; p.animOverride = sv.anim || null; p.ch.play('idle');
    this.releaseCrowd();
    g.camYaw = this.booth.yaw; g.camPitch = 0.3; g.snapCam = true;
    if (g.syncHudButtons) g.syncHudButtons();
    this.active = false;
    if (BurnsDJ.session === this) BurnsDJ.session = null;
  }
  // something broke: never soft-lock the game
  abort() {
    if (!this.active) return;
    try { this.uninstall(); } catch (e) { /* ignore */ }
    try { burnsMusic(this.g.def && this.g.def.music || null); } catch (e) { /* ignore */ }
    const r = this.result || this.computeResult(true);
    if (this.o.onDone) try { this.o.onDone(r); } catch (e) { Game.reportError(e); }
  }
  /* ---------------- crowd ---------------- */
  gatherCrowd() {
    const g = this.g, o = this.o, bx = this.booth.x, bz = this.booth.z, ex = o.exclude || [];
    let list = [];
    if (Array.isArray(o.crowd)) list = o.crowd.filter(a => a && !a.removed);
    else {
      const area = o.crowd && typeof o.crowd === 'object' ? o.crowd : null;
      const cx = area ? area.x : bx, cz = area ? area.z : bz, r = area ? (area.r || 14) : 30;
      for (const a of g.actors) {
        if (a.removed || a.hidden || !a.friendly || a.boss || a.def.boss || (a.id && ex.indexOf(a.id) >= 0) || a.def.noDJ) continue;
        if (a.behName === 'follow') continue;
        const d = Math.hypot(a.x - cx, a.z - cz); if (d > r || d < 1.2) continue;
        if (Math.abs(a.y - this.booth.y) > 6) continue;
        list.push(a);
      }
      // nearest first, cap the crowd to keep draws in budget
      list.sort((a, b) => Math.hypot(a.x - bx, a.z - bz) - Math.hypot(b.x - bx, b.z - bz));
      list = list.slice(0, 22);
    }
    // face the crowd unless a booth yaw was given
    if (!(o.booth && o.booth.yaw !== undefined) && list.length >= 3) {
      let sx = 0, sz = 0; for (const a of list) { sx += a.x; sz += a.z; }
      this.booth.yaw = Math.atan2(sx / list.length - bx, sz / list.length - bz);
    }
    // top up with temporary dancers in front of the booth
    const want = typeof o.crowd === 'number' && o.crowd > 1 ? Math.min(24, Math.round(o.crowd)) : 10;
    const temps = [];
    if (list.length < want) {
      const n = Math.min(want - list.length, 14), yaw = this.booth.yaw, R = mulberry32(this.seed ^ 77);
      const types = ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'burner'];
      for (let i = 0; i < n; i++) {
        const a = yaw + (R() - 0.5) * 1.7, dd = 5 + R() * 9, x = bx + Math.sin(a) * dd, z = bz + Math.cos(a) * dd;
        let y = g.world.height(x, z);
        try { y = g.world.surface(x, z, this.booth.y + 0.5, 0.2, BURNS_SURF).y; } catch (e) { /* flat */ }
        if (Math.abs(y - this.booth.y) > 3.5) y = g.world.height(x, z);
        const t = types[i % types.length];
        try {
          const act = g.spawnActor({ type: t, seed: 900 + (i % 9), x, z, y, fixedY: true, yaw: Math.atan2(bx - x, bz - z), behavior: 'idle', chatter: false, noTalk: true, collide: false, ambient: true, djTemp: true });
          temps.push(act);
        } catch (e) { /* ignore */ }
      }
    }
    this.temps = temps;
    this.crowd = list.concat(temps).map((a, i) => ({ a, orig: { k: a.ch.k, yaw: a.yaw }, st: i % 4, jit: (this.rng() - 0.5) * 0.04, cheer: 0, sayT: 1 + this.rng() * 4 }));
    for (const c of this.crowd) { c.a.ch.play('burnsDJCrowd', { bpm: this.bpm, e: this.energy, st: c.st, cheer: 0 }); }
  }
  releaseCrowd() {
    for (const c of this.crowd || []) {
      const a = c.a; if (a.removed) continue;
      a.ch.k = c.orig.k || {}; a.ch.play('idle');
      if (a.beh && a.beh.init && a.behName === 'dance') a.beh.init(a, this.g);
    }
    for (const a of this.temps || []) this.g.removeActor(a);
    this.temps = [];
  }
  updateCrowd(dt) {
    const e = this.energy, t = this.phase === 'play' ? this.t : this.rt;
    for (const c of this.crowd) {
      const a = c.a; if (a.removed) continue;
      c.cheer = Math.max(0, c.cheer - dt * 0.7);
      const k = a.ch.k && a.ch.anim === 'burnsDJCrowd' ? a.ch.k : {};
      k.bpm = this.bpm; k.e = clamp(e + (c.st - 1.5) * 0.05, 0, 1); k.st = c.st; k.cheer = c.cheer;
      if (a.ch.anim !== 'burnsDJCrowd') a.ch.play('burnsDJCrowd', k); else a.ch.k = k;
      a.ch.animT = Math.max(0, t + c.jit + 0.001);
      a.yaw = BurnsM.dampAngle(a.yaw, Math.atan2(this.booth.x - a.x, this.booth.z - a.z), 2, dt);
      if (this.phase === 'play') {
        c.sayT -= dt;
        if (c.sayT <= 0) {
          c.sayT = 3 + this.rng() * 7;
          const L = e > 0.62 ? BURNS_DJ_SHOUT_UP : e < 0.25 ? BURNS_DJ_SHOUT_DOWN : null;
          if (L && this.shouts.length < 3) this.shout(c, L[Math.floor(this.rng() * L.length)]);
        }
      }
    }
    this.shouts = this.shouts.filter(s => (s.t += dt) < 1.8);
  }
  shout(c, text) { if (!c || !c.a || c.a.removed) return; this.shouts.push({ a: c.a, text, t: 0 }); }
  crowdCheer(k, text) {
    for (const c of this.crowd) c.cheer = Math.max(c.cheer, k * (0.6 + this.rng() * 0.4));
    if (text && this.crowd.length) this.shout(this.crowd[Math.floor(this.rng() * this.crowd.length)], text);
  }
  /* ---------------- input ---------------- */
  ev(type, e) {
    if (!this.active || Game.scene !== this.g) { this.detach(); return; }
    const r = Game.canvas.getBoundingClientRect();
    this.q.push({ type, id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top });
  }
  key(e, down) {
    if (!this.active || Game.scene !== this.g) { this.detach(); return; }
    const map = { KeyD: 'p0', KeyF: 'p1', KeyJ: 'p2', KeyK: 'p3', Digit1: 'p0', Digit2: 'p1', Digit3: 'p2', Digit4: 'p3', Space: 'drop', Enter: 'enter', ShiftLeft: 'filter', ShiftRight: 'filter', KeyS: 'filter', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Escape: 'pause', KeyP: 'pause', KeyX: 'scratch', KeyZ: 'scratch' };
    const a = map[e.code]; if (!a) return;
    if (e.cancelable) e.preventDefault();
    if (down && this.keysDown[a]) return;
    this.keysDown[a] = down;
    this.q.push({ type: down ? 'kdown' : 'kup', key: a });
  }
  // test hook: inject a pointer event at CSS px (same path as real touches)
  inject(type, x, y, id) { this.q.push({ type, id: id === undefined ? 9001 : id, x, y }); }
  hit(x, y) {
    const L = this.L || this.layout(); if (!L) return null;
    const inR = (r, pad) => r && x >= r.x - (pad || 0) && x <= r.x + r.w + (pad || 0) && y >= r.y - (pad || 0) && y <= r.y + r.h + (pad || 0);
    const inC = (c, k) => c && Math.hypot(x - c.x, y - c.y) <= c.r * (k || 1);
    if (this.phase === 'intro') return inR(L.startBtn, 10) ? 'start' : 'intro';
    if (this.phase === 'results' || this.phase === 'out') return 'cont';
    if (this.paused) { for (let i = 0; i < (L.menu || []).length; i++) if (inR(L.menu[i], 6)) return 'menu' + i; return 'none'; }
    if (inC(L.pause, 1.5)) return 'pause';
    for (let i = 0; i < 4; i++) if (inR(L.pads[i], 4)) return 'pad' + i;
    if (inC(L.drop, 1.12)) return 'drop';
    if (inC(L.filter, 1.15)) return 'filter';
    if (inR(L.xf, 12)) return 'xf';
    if (inR(L.pitchB, 10) || inC(L.jogB, 1.04)) return 'jogB';
    if (inR(L.pitchA, 10) || inC(L.jogA, 1.04)) return 'jogA';
    return 'none';
  }
  events() {
    const q = this.q; this.q = [];
    const ts = Math.max(0, this.t - 0.008);
    for (const e of q) {
      if (e.type === 'down') {
        const c = this.hit(e.x, e.y);
        this.ptr.set(e.id, { c, x: e.x, y: e.y, x0: e.x, y0: e.y, ang: null });
        this.press(c, ts, e);
      } else if (e.type === 'move') {
        const P = this.ptr.get(e.id); if (!P) continue;
        this.drag(P, e.x, e.y);
        P.x = e.x; P.y = e.y;
      } else if (e.type === 'up') {
        const P = this.ptr.get(e.id); if (!P) continue;
        this.ptr.delete(e.id);
        this.release(P, ts);
      } else if (e.type === 'kdown') this.keyPress(e.key, ts, true);
      else if (e.type === 'kup') this.keyPress(e.key, ts, false);
    }
  }
  press(c, ts, e) {
    if (!c) return;
    if (c === 'start') { this.start(); return; }
    if (c === 'intro') { if (this.rt > 1.0) this.start(); return; }
    if (c === 'cont') { if (this.phase === 'results' && this.resT > 1.1) this.leave(); return; }
    if (c.startsWith('menu')) { this.menu(+c.slice(4)); return; }
    if (c === 'pause') { this.setPause(true); return; }
    if (this.phase !== 'play') return;
    if (c.startsWith('pad')) this.padPress(+c.slice(3), ts);
    else if (c === 'drop') this.dropPress(ts);
    else if (c === 'filter') { this.filter.ptr = true; this.filterSet(true, ts); }
    else if (c === 'xf') this.xfTouch(e.x, true);
  }
  drag(P, x, y) {
    if (this.phase !== 'play' || this.paused) return;
    const dx = x - P.x, dy = y - P.y, L = this.L || this.layout();
    if (P.c === 'xf') this.xfTouch(x, false);
    else if (P.c === 'jogB' || P.c === 'jogA') {
      // vertical drag on deck B = tempo nudge (up = faster); any rub on a jog = scratch
      if (P.c === 'jogB' && this.pitchLive()) this.pitchNudge(-dy * (8 / Math.max(80, L.pitchB.h)) * 1.0);
      const J = P.c === 'jogA' ? L.jogA : L.jogB;
      const ang = Math.atan2(y - J.y, x - J.x);
      if (P.ang !== null) { let da = ang - P.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); this.jogSpin[P.c] = (this.jogSpin[P.c] || 0) + da; this.scratchRub(Math.abs(da) * J.r + Math.hypot(dx, dy) * 0.5, Math.sign(da)); }
      P.ang = ang;
    }
  }
  release(P, ts) {
    if (P.c === 'filter') { this.filter.ptr = false; this.filterSet(this.filter.keys, ts); }
    if (P.c === 'xf') this.xf.drag = null;
  }
  keyPress(k, ts, down) {
    if (k === 'pause' && down) { if (this.phase === 'play') this.setPause(!this.paused); return; }
    if (this.paused) { if (down && (k === 'up' || k === 'down')) this.pauseSel = (this.pauseSel + (k === 'up' ? 2 : 1)) % 3; if (down && (k === 'enter' || k === 'drop')) this.menu(this.pauseSel); return; }
    if (this.phase === 'intro') { if (down && (k === 'enter' || k === 'drop')) this.start(); return; }
    if (this.phase === 'results') { if (down && (k === 'enter' || k === 'drop') && this.resT > 1.1) this.leave(); return; }
    if (this.phase !== 'play') return;
    if (down && k[0] === 'p' && k.length === 2) this.padPress(+k[1], ts);
    else if (down && k === 'drop') this.dropPress(ts);
    else if (k === 'filter') { this.filter.keys = down; this.filterSet(down || this.filter.ptr, ts); }
    else if (down && (k === 'up' || k === 'down') && this.pitchLive()) this.pitchNudge(k === 'up' ? 0.25 : -0.25);
    else if (down && (k === 'left' || k === 'right')) { if (k === 'right') this.xfGlide(1); else this.xfGlide(0); }
    else if (down && k === 'scratch') this.scratchRub(120, this.scratch.dir > 0 ? -1 : 1);
  }
  /* ---------------- phases ---------------- */
  start() {
    if (this.phase !== 'intro') return;
    this.phase = 'play';
    this.t = -0.09;   // the music starts ~60 ms after it's asked for, plus output latency
    try { if (window.Sound && Sound.stopMusic) Sound.stopMusic(); burnsMusic(this.trackA.id); } catch (e) { /* audio is optional */ }
    burnsSfx('select2');
  }
  setPause(on) {
    if (this.phase !== 'play' || on === this.paused) return;
    this.paused = on; this.pauseSel = 0;
    if (on) { try { Sound.stopMusic(); } catch (e) { /* ignore */ } burnsSfx('pause', null, 'select'); for (const P of this.ptr.values()) this.release(P, this.t); this.ptr.clear(); }
    else this.resumeMusic();
  }
  // resume on the current bar: rewind to its start and restart the deck that's live
  resumeMusic() {
    const barS = 4 * this.spb, bar = Math.max(0, Math.floor(this.t / barS));
    this.t = bar * barS - 0.09;
    for (const n of this.notes) if (!n.judged && n.t >= this.t) n.plan = undefined;
    try { burnsMusic(this.t >= this.mixT - 0.1 ? this.trackB.id : this.trackA.id); } catch (e) { /* ignore */ }
    this.bigMsg('BACK IN THE MIX', 'Rewound one bar', '#38f2ff', 1.2);
  }
  menu(i) {
    burnsSfx('select');
    if (i === 0) this.setPause(false);
    else if (i === 1) { this.paused = false; try { Sound.stopMusic(); } catch (e) { /* ignore */ } this.reset(); this.phase = 'intro'; this.rt = 0.8; for (const c of this.crowd) c.cheer = 0; }
    else if (i === 2) { this.paused = false; this.endSet(true); }
  }
  endSet(forfeit) {
    if (this.phase === 'results') return;
    // anything never judged counts as a miss
    for (const n of this.notes) if (!n.judged) { n.judged = true; n.res = 'miss'; this.tally('miss', 1, true); }
    if (!this.pitch.judged) { this.pitch.judged = true; this.tally('miss', 4, true); }
    if (!this.xf.judged) { this.xf.judged = true; this.tally('miss', 4, true); }
    if (!this.filter.judged) { this.filter.judged = true; this.tally('miss', 3, true); }
    if (!this.drop.judged) { this.drop.judged = true; this.tally('miss', 6, true); }
    if (!this.finish.judged) { this.finish.judged = true; this.tally('miss', 2, true); }
    if (this.scratchBar >= 0 && !this.scratch.judged) { this.scratch.judged = true; this.tally('miss', 2, true); }
    this.result = this.computeResult(!!forfeit);
    this.phase = 'results'; this.resT = 0;
    const gr = this.result.grade, g = this.g, b = this.booth;
    if (gr === 'S' || gr === 'A') { burnsSfx('crowd_cheer'); burnsSfx('gold', { vol: 0.7 }); this.crowdCheer(1, gr === 'S' ? 'LEGEND!!' : 'ENCORE!'); }
    else if (gr === 'B') { burnsSfx('crowd_cheer', { vol: 0.7 }); this.crowdCheer(0.6, 'Nice set!'); }
    else if (gr === 'C') { burnsSfx('crowd', { vol: 0.35 }); this.crowdCheer(0.2, '*polite clapping*'); }
    else { burnsSfx('powerdown', { vol: 0.6 }); if (this.crowd.length) this.shout(this.crowd[0], 'Boooo...'); }
    if (gr === 'S' || gr === 'A') {
      const f = Math.sin(b.yaw), c = Math.cos(b.yaw);
      for (let i = 0; i < 3; i++) g.fx.confetti(b.x + f * (5 + i * 3), b.y + 5, b.z + c * (5 + i * 3), 50);
      this.co2.push({ t: 0, dur: 1.6 }); this.dropK = 1;
      if (gr === 'S') { for (let i = 0; i < 6; i++) this.later(i * 0.35, () => { g.fx.firework(b.x + f * 10 + (this.rng() - 0.5) * 14, b.y + 12 + this.rng() * 6, b.z + c * 10 + (this.rng() - 0.5) * 14, BURNS_NEON[i % 7]); burnsSfx('firework_burst', { vol: 0.5 }); }); }
    } else if (gr === 'B') g.fx.confetti(b.x + Math.sin(b.yaw) * 6, b.y + 4, b.z + Math.cos(b.yaw) * 6, 30);
  }
  later(sec, fn) { (this.timers || (this.timers = [])).push({ t: sec, fn }); }
  leave() {
    if (this.phase !== 'results') return;
    this.phase = 'out'; this.outT = 0; burnsSfx('select');
  }
  close() {
    const g = this.g, r = this.result || this.computeResult(true);
    this.uninstall();
    try { burnsMusic(this.saved.music || (g.def && g.def.music) || null); } catch (e) { /* ignore */ }
    g.fadeTo(0, 0.4);
    if (this.o.onDone) { try { this.o.onDone(r); } catch (e) { Game.reportError(e); } }
  }
  computeResult(forfeit) {
    const st = this.st, acc = st.wSum > 0 ? st.vSum / st.wSum : 0;
    const eAvg = this.eTime > 0 ? this.eAcc / this.eTime : this.energy;
    let score = clamp(0.72 * acc + 0.14 * eAvg + 0.14 * this.energy, 0, 1);
    if (forfeit) score *= 0.85;
    const grade = BurnsDJ.grade(score);
    return { score: Math.round(score * 1000) / 1000, grade, crowdPeak: Math.round(this.peak * 1000) / 1000, perfects: st.perfect, greats: st.great, oks: st.ok, misses: st.miss, maxCombo: st.maxCombo, accuracy: Math.round(acc * 1000) / 1000, forfeit: !!forfeit, title: this.title, bpm: this.bpm };
  }
  /* ---------------- per-step logic (replaces the scene update) ---------------- */
  step(dt) {
    const g = this.g;
    if (!this.active) return;
    try {
      if (Input.mode !== 'ui') Input.setMode('ui');
      g.t += dt; g.time += dt; this.rt += dt;
      this.events();
      if (this.timers) { for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0 && !tm.done) { tm.done = true; tm.fn(); } } this.timers = this.timers.filter(tm => !tm.done); }
      if (this.paused) return;
      if (this.phase === 'intro') { if (this.introT !== undefined && this.rt > this.introT) this.start(); }
      else if (this.phase === 'play') { if (this.auto) this.autoStep(dt); this.t += dt; this.play(dt); }
      else if (this.phase === 'results') { this.resT += dt; if (this.auto && this.auto.cont && this.resT > 1.3) this.leave(); }
      else if (this.phase === 'out') { this.outT += dt; if (this.outT > 0.45) { this.close(); return; } }
      this.updateCrowd(dt);
      this.fxStep(dt);
      if (this.fx3d && this.fx3d.ch) this.poseDeck();
      // keep timed flame effects alive (they can't hurt anyone while Brady is at the decks)
      for (const j of g.world.jets) { j.t += dt; const ph = ((j.t + j.phase) % j.period); j.active = ph < j.on; j.warn = !j.active && ph > j.period - 0.6; }
      const p = g.player;
      p.ch.k = p.ch.k || {}; const pk = p.ch.anim === 'burnsDJBrady' ? p.ch.k : {};
      pk.bpm = this.bpm; pk.pump = Math.max(0, (pk.pump || 0) - dt * 1.4); pk.cue = this.phase === 'play' && this.t > this.sec.match.t0 && !this.pitch.locked ? 1 : Math.max(0, (pk.cue || 0) - dt * 3);
      pk.rub = this.inScratch() ? 1 : Math.max(0, (pk.rub || 0) - dt * 4);
      if (p.ch.anim !== 'burnsDJBrady') p.ch.play('burnsDJBrady', pk); else p.ch.k = pk;
      p.ch.animT = this.phase === 'play' ? Math.max(0, this.t) : this.rt;
    } catch (e) { Game.reportError(e); this.abort(); }
  }
  play(dt) {
    const t = this.t, spb = this.spb, d = this.diff, S = this.sec;
    // beat clock
    const beat = Math.floor(t / spb);
    if (beat !== this.lastBeat && t >= 0) {
      this.lastBeat = beat; this.beatK = 1; if (beat % 4 === 0) this.barK = 1;
      if (t < S.count.t1) { const n = 4 - (beat % 4); this.bigMsg(String(n), n === 1 ? 'here we go' : '', n === 1 ? '#ffe24a' : '#ffffff', spb * 0.9, true); burnsSfx(n === 1 ? 'select2' : 'coinTally', { vol: 0.6, pitch: n === 1 ? 1.2 : 1 }); }
    }
    this.beatK = Math.max(0, this.beatK - dt / (spb * 0.8)); this.barK = Math.max(0, this.barK - dt / (spb * 2));
    // section banners (one bar ahead)
    this.sectionCues(t);
    // energy drifts down when nothing happens; average it for the score
    if (t > S.warm.t0) { this.energy = clamp(this.energy - dt * 0.011 * (1 + d * 0.6), 0, 1); this.eAcc += this.energy * dt; this.eTime += dt; }
    // pad notes that slipped past
    for (const n of this.notes) {
      if (n.judged) continue;
      if (n.t > t + 0.5) break;
      if (t > n.t + this.win.o) { n.judged = true; n.res = 'miss'; this.judge('miss', 1, n.lane); }
    }
    // ---- beatmatch ----
    const P = this.pitch;
    if (t >= S.match.t0 - spb * 2 && !P.loaded) {
      P.loaded = true; const sgn = this.rng() < 0.5 ? -1 : 1;
      P.off = sgn * lerp(2.6, 5.2, d) * (0.85 + this.rng() * 0.3); P.phase = 0.3 + this.rng() * 0.15;
    }
    if (P.loaded && !P.locked) {
      P.phase += P.off * 4 / 60 * dt;   // the drift is exaggerated so it's easy to see
      if (t >= S.match.t0) {
        const tol = lerp(0.55, 0.22, d);
        if (Math.abs(P.off) < tol) { P.hold += dt; if (P.hold > 0.5) this.lock(false); } else P.hold = 0;
        if (t > S.match.t1 - spb * 2) this.lock(true);
      }
    }
    if (P.locked) { P.alignK = Math.min(1, P.alignK + dt * 3); P.phase = lerp(P.phase, Math.round(P.phase), Math.min(1, dt * 8)); }
    // ---- crossfader mix on the phrase ----
    const X = this.xf;
    if (X.glide) { X.glide.t += dt; const k = clamp(X.glide.t / X.glide.dur, 0, 1); X.pos = lerp(X.glide.from, X.glide.to, easeInOut(k)); if (k >= 1) X.glide = null; }
    if (X.crossT === null && X.pos >= 0.5 && X.free) { X.crossT = t; this.judgeMix(); }
    if (!X.judged && t > this.mixT + spb * 2) { X.crossT = t; this.judgeMix(true); }
    if (!this.musicSwitched && t >= this.mixT - 0.06) {
      this.musicSwitched = true;
      if (this.trackB.id !== this.trackA.id) try { burnsMusic(this.trackB.id); } catch (e) { /* ignore */ }
      if (!X.judged && X.pos < 0.5 && X.free) this.flashText('NOW!', '#ffe24a');
    }
    // ---- filter build ----
    const F = this.filter, b0 = S.build.t0, b1 = S.build.t1, need = b1 - spb - b0;
    if (F.held && t >= b0 && t < b1 - spb) F.heldTime += dt;
    const inBuild = t >= b0 - spb && t < b1;
    F.pos = F.held && inBuild ? clamp((t - b0) / (b1 - b0), 0.05, 1) : Math.max(0, F.pos - dt * 3);
    this.riser = F.held && t >= b0 && t < b1 ? clamp((t - b0) / (b1 - b0), 0, 1) : Math.max(0, this.riser - dt * 2);
    if (!F.judged && t >= b1 - spb) {
      F.judged = true; const f = clamp(F.heldTime / need, 0, 1);
      const res = f > 0.94 ? 'perfect' : f > 0.72 ? 'great' : f > 0.35 ? 'ok' : 'miss';
      this.judge(res, 3, null, { text: res === 'miss' ? 'NO BUILD!' : res === 'perfect' ? 'MAX BUILD!' : 'BUILD UP!', energy: res === 'miss' ? -0.1 : 0.04 + 0.08 * f });
    }
    // ---- the drop + last call ----
    if (!this.drop.judged && t > this.dropT + this.win.o) { this.drop.judged = true; this.judge('miss', 6, null, { text: 'MISSED THE DROP!', energy: -0.2 }); this.crowdCheer(0, 'Where\'s the drop?!'); burnsSfx('throw', { vol: 0.7, pitch: 0.7 }); }
    if (!this.finish.judged && t > this.finishT + this.win.o) { this.finish.judged = true; this.judge('miss', 2, null, { text: 'LATE FINISH', energy: -0.05 }); }
    // ---- scratch bar ----
    if (this.scratchBar >= 0 && !this.scratch.judged && t >= (this.scratchBar + 1) * 4 * spb) {
      this.scratch.judged = true; const f = clamp(this.scratch.amt / 1400, 0, 1);
      const res = f > 0.85 ? 'perfect' : f > 0.55 ? 'great' : f > 0.25 ? 'ok' : 'miss';
      this.judge(res, 2, null, { text: res === 'miss' ? 'NO SCRATCH' : 'WICKA-WICKA!', energy: res === 'miss' ? -0.05 : 0.03 + f * 0.07 });
    }
    // ---- end ----
    if (t >= this.endT) this.endSet(false);
    // track peak
    this.peak = Math.max(this.peak, this.energy);
  }
  sectionCues(t) {
    const S = this.sec, barS = 4 * this.spb, pre = barS;
    const cue = (key, at, title, sub, col) => { if (!this.cued) this.cued = {}; if (!this.cued[key] && t >= at) { this.cued[key] = true; this.banner = { title, sub, col, t: 0, dur: barS * 1.6 }; } };
    cue('warm', S.warm.t0 - this.spb * 0.5, 'WARM UP THE CROWD', 'Tap each pad as its ring closes', '#ff4fd8');
    cue('match', S.match.t0 - pre * 0.5, 'BEATMATCH DECK B', 'Drag deck B up or down until its beats stop drifting', '#38f2ff');
    cue('mix', this.mixT - barS, 'MIX IT IN ON THE 1', 'Slide the crossfader to B when the phrase turns over', '#ffe24a');
    cue('groove', this.mixT + this.spb * 2, 'KEEP IT GROOVING', 'Deck B is live. Hit the pads.', '#7aff5a');
    cue('build', S.build.t0 - barS, 'BUILD IT UP!', 'HOLD the filter knob until the drop', '#ffe24a');
    cue('drop', this.dropT - this.spb * 4, 'DROP INCOMING', 'Tap DROP on the 1', '#ff3b5c');
    cue('peak', this.dropT + this.spb * 2, 'PEAK TIME', 'Give them everything', '#ff4fd8');
    if (this.scratchBar >= 0) cue('scratch', this.scratchBar * barS - this.spb * 3, 'SCRATCH IT!', 'Rub a jog wheel back and forth', '#38f2ff');
    cue('outro', this.finishT - barS, 'LAST CALL', 'Tap DROP on the final 1', '#ffd84a');
  }
  inScratch() { if (this.scratchBar < 0 || this.phase !== 'play') return false; const t0 = this.scratchBar * 4 * this.spb; return this.t >= t0 - this.spb * 0.5 && this.t < t0 + 4 * this.spb; }
  pitchLive() { return this.pitch.loaded && !this.pitch.locked && this.t >= this.sec.match.t0 - this.spb * 2; }
  pitchNudge(v) { const P = this.pitch; if (!this.pitchLive()) return; P.off = clamp(P.off + v, -8, 8); }
  lock(forced) {
    const P = this.pitch; if (P.locked) return;
    P.locked = true; P.lockT = this.t; this.xf.free = true;
    if (forced) {
      P.off = 0; P.judged = true;
      this.judge('miss', 4, null, { text: 'TRAINWRECK!', energy: -0.16 }); this.crowdCheer(0, 'Trainwreck!');
      burnsSfx('throw', { vol: 0.8, pitch: 0.8 }); this.g.shake(0.3);
    } else {
      const tt = this.t - this.sec.match.t0, res = tt < 3.2 ? 'perfect' : tt < 5.5 ? 'great' : 'ok';
      P.off = 0; P.judged = true;
      this.judge(res, 4, null, { text: 'LOCKED IN!', energy: res === 'perfect' ? 0.12 : 0.07 });
      burnsSfx('select2', { pitch: 1.3 }); burnsSfx('gold', { vol: 0.35 });
    }
    // keep the left thumb busy until the mix
    const barS = 4 * this.spb, nb = Math.ceil((this.t + 0.2) / barS);
    for (let b = nb; b < this.sec.match.b1 - 1; b++) for (const step of [0, 4]) this.notes.push({ t: (b * 4 + step / 2) * this.spb, lane: (b + step / 4) % 2, judged: false, late: true });
    this.notes.sort((a, b) => a.t - b.t); this.nTotal = this.notes.length;
  }
  xfTouch(x, isDown) {
    const L = this.L || this.layout(), X = this.xf;
    if (!X.free) { if (isDown) this.flashText(this.pitch.loaded ? 'LOCK THE BEAT FIRST' : 'NOT YET', '#ff9ad8'); return; }
    if (X.judged && X.pos >= 0.99) return;
    const k = clamp((x - L.xf.x) / L.xf.w, 0, 1);
    if (isDown) {
      const knobX = L.xf.x + X.pos * L.xf.w;
      if (Math.abs(x - knobX) > 34) { this.xfGlide(k > X.pos ? 1 : 0); return; }   // a tap: glide over
      X.drag = true;
    }
    X.glide = null; X.pos = Math.max(X.pos, k);
  }
  xfGlide(to) {
    const X = this.xf; if (!X.free) { this.flashText('LOCK THE BEAT FIRST', '#ff9ad8'); return; }
    if (to < X.pos) return;
    X.glide = { from: X.pos, to, t: 0, dur: this.spb * 0.5 };
  }
  judgeMix(late) {
    const X = this.xf; if (X.judged) return;
    X.judged = true;
    const db = (X.crossT - this.mixT) / this.spb;
    let res = Math.abs(db) <= 0.5 ? 'perfect' : Math.abs(db) <= 1.0 ? 'great' : Math.abs(db) <= 2.0 ? 'ok' : 'miss';
    if (late) res = 'miss';
    const text = res === 'perfect' ? 'SMOOTH MIX!' : res === 'miss' ? (db < 0 ? 'TOO EARLY!' : 'LATE MIX!') : db < 0 ? 'A BIT EARLY' : 'A BIT LATE';
    this.judge(res, 4, null, { text, energy: { perfect: 0.13, great: 0.08, ok: 0.03, miss: -0.14 }[res] });
    if (res === 'perfect' || res === 'great') { burnsSfx('disco', { vol: 0.6 }); this.crowdCheer(0.6, 'OOOH!'); } else if (res === 'miss') burnsSfx('throw', { vol: 0.7 });
    if (X.pos < 1) X.glide = { from: X.pos, to: 1, t: 0, dur: this.spb };
  }
  filterSet(on, ts) {
    const F = this.filter; if (on === F.held) return;
    F.held = on;
    const S = this.sec, t = this.t;
    if (on && t > S.build.t0 - this.spb && t < S.build.t1) burnsSfx('appear', { vol: 0.5, pitch: 0.8 + (t - S.build.t0) / (S.build.t1 - S.build.t0) * 0.6 });
    if (!on && !F.judged && t > S.build.t0 + this.spb * 0.5 && t < S.build.t1 - this.spb) { this.flashText('KEEP HOLDING!', '#ff3b5c'); this.energy = clamp(this.energy - 0.03, 0, 1); }
  }
  padPress(lane, ts) {
    this.padK[lane] = 1;
    const L = BURNS_DJ_LANES[lane];
    let best = null, bd = 1e9;
    for (const n of this.notes) {
      if (n.t > ts + this.win.o) break;
      if (n.judged || n.lane !== lane) continue;
      const dd = Math.abs(n.t - ts); if (dd < bd) { bd = dd; best = n; }
    }
    if (best && bd <= this.win.o) {
      best.judged = true;
      const res = bd <= this.win.p ? 'perfect' : bd <= this.win.g ? 'great' : 'ok';
      best.res = res; this.padHit[lane] = 1;
      this.judge(res, 1, lane);
      burnsSfx(L.sfx, { vol: L.vol, pitch: L.pitch * (res === 'perfect' ? 1 : 0.94) });
    } else {
      // a stray tap: breaks the combo and bores the crowd a little
      this.st.stray++; if (this.st.combo > 0) this.st.combo = 0;
      this.energy = clamp(this.energy - 0.012, 0, 1);
      this.pop('?', '#9a8aa8', lane);
    }
  }
  dropPress(ts) {
    const ok = this.win.o * 1.15;
    if (!this.drop.judged && Math.abs(ts - this.dropT) <= ok) {
      const dd = Math.abs(ts - this.dropT), res = dd <= this.win.p * 1.2 ? 'perfect' : dd <= this.win.g * 1.1 ? 'great' : 'ok';
      this.drop.judged = true; this.drop.res = res;
      this.judge(res, 6, null, { text: res === 'perfect' ? 'MASSIVE DROP!' : 'DROP!', energy: { perfect: 0.32, great: 0.22, ok: 0.12 }[res] });
      this.dropFx(res === 'perfect' ? 1 : res === 'great' ? 0.8 : 0.55);
      return;
    }
    if (!this.finish.judged && Math.abs(ts - this.finishT) <= ok) {
      const dd = Math.abs(ts - this.finishT), res = dd <= this.win.p * 1.2 ? 'perfect' : dd <= this.win.g * 1.1 ? 'great' : 'ok';
      this.finish.judged = true;
      this.judge(res, 2, null, { text: res === 'perfect' ? 'WHAT A FINISH!' : 'FINISH!', energy: 0.06 });
      this.dropFx(0.7);
      return;
    }
    this.padK.dropT = 1;
  }
  dropFx(k) {
    const g = this.g, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw);
    this.dropK = k; this.flashK = Math.max(this.flashK, 0.55 * k);
    burnsSfx('neon_flash', { vol: 0.55 * k }); burnsSfx('firework_burst', { vol: 0.6 * k }); burnsSfx('crowd_cheer', { vol: 0.8 * k });
    g.shake(0.35 * k);
    this.co2.push({ t: 0, dur: 1.3 });
    g.fx.confetti(b.x + f * 6, b.y + 4.5, b.z + c * 6, Math.round(40 * k));
    this.crowdCheer(k, k > 0.9 ? 'OHHHHH!!!' : 'YEAH!');
    const p = g.player; if (p.ch.anim === 'burnsDJBrady') p.ch.k.pump = 1;
  }
  scratchRub(px, dir) {
    if (!this.inScratch() || this.scratch.judged) return;
    const sc = this.scratch; sc.amt += px;
    if (dir && dir !== sc.dir && this.t - sc.last > 0.07) { sc.last = this.t; burnsSfx('throw', { vol: 0.45, pitch: 0.9 + this.rng() * 0.5 }); }
    if (dir) sc.dir = dir;
  }
  // value weights: pad 1, beatmatch 4, mix 4, build 3, drop 6, scratch 2, finish 2
  judge(res, w, lane, o) {
    o = o || {};
    this.tally(res, w);
    const J = BURNS_DJ_JUDGE[res], d = this.diff;
    let de = o.energy !== undefined ? o.energy : res === 'perfect' ? 0.03 + Math.min(0.02, this.st.combo * 0.001) : res === 'great' ? 0.018 : res === 'ok' ? 0.006 : -0.05 - d * 0.03;
    this.energy = clamp(this.energy + de, 0, 1);
    this.peak = Math.max(this.peak, this.energy);
    if (lane !== null && lane !== undefined) this.pop(J.txt, J.col, lane);
    else this.bigMsg(o.text || J.txt, res === 'miss' ? '' : J.txt, J.col, 1.3);
    if (res === 'miss') { this.g.shake(0.08); if (this.rng() < 0.25 && this.crowd.length) this.shout(this.crowd[Math.floor(this.rng() * this.crowd.length)], BURNS_DJ_SHOUT_DOWN[Math.floor(this.rng() * BURNS_DJ_SHOUT_DOWN.length)]); }
    else if (res === 'perfect' && this.st.combo > 0 && this.st.combo % 16 === 0) { this.crowdCheer(0.5, BURNS_DJ_SHOUT_UP[Math.floor(this.rng() * BURNS_DJ_SHOUT_UP.length)]); burnsSfx('crowd', { vol: 0.3 }); }
  }
  tally(res, w, silent) {
    const st = this.st;
    st[res === 'perfect' ? 'perfect' : res === 'great' ? 'great' : res === 'ok' ? 'ok' : 'miss']++;
    st.wSum += w; st.vSum += BURNS_DJ_JUDGE[res].v * w;
    if (res === 'miss') st.combo = 0; else if (!silent) { st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo); }
  }
  pop(text, col, lane) { this.pops.push({ text, col, lane, t: 0 }); if (this.pops.length > 10) this.pops.shift(); }
  bigMsg(title, sub, col, dur, count) { this.big = { title, sub, col, t: 0, dur: dur || 1.2, count: !!count }; }
  flashText(text, col) { this.bigMsg(text, '', col, 0.9); }
  /* ---------------- autoplayer (tests + attract mode) ---------------- */
  // q: 1 = flawless, 0.5 = sloppy, 0 = hopeless. cont: leave the results card automatically
  autoplay(q, cont) { this.auto = { q: clamp(q, 0, 1), cont: cont !== false, R: mulberry32(this.seed ^ 0x9e37) }; if (this.phase === 'intro') this.start(); return this; }
  autoStep(dt) {
    const A = this.auto, q = A.q, R = A.R, t = this.t, t1 = t + dt, spb = this.spb;
    const gauss = () => (R() + R() + R() - 1.5) * 0.82;
    const sig = lerp(0.2, 0.012, q), skip = q > 0.95 ? 0 : clamp((0.9 - q) * 0.75, 0, 0.7);
    for (const n of this.notes) {
      if (n.t > t1 + 0.4) break;
      if (n.judged) continue;
      if (n.plan === undefined) n.plan = R() < skip ? null : n.t + gauss() * sig;
      if (n.plan !== null && n.plan !== undefined && n.plan >= t - 1e-9 && n.plan < t1) { this.padPress(n.lane, n.plan); }
      else if (n.plan !== null && n.plan !== undefined && n.plan < t - 1e-9) { this.padPress(n.lane, t); n.plan = null; }
    }
    // beatmatch: steer the pitch toward zero (sloppy players wobble around it)
    const P = this.pitch;
    if (this.pitchLive() && t >= this.sec.match.t0 + lerp(3.5, 0.4, q)) {
      const target = q < 0.3 ? Math.sin(t * 2.3) * 1.6 : 0;
      P.off = approach(P.off, target, dt * lerp(1.2, 5, q));
    }
    // crossfade on the phrase
    if (this.xf.free && !this.xf.judged && !this.xf.glide) {
      if (A.mixAt === undefined) A.mixAt = this.mixT + (q > 0.9 ? 0 : q > 0.6 ? gauss() * 0.6 * spb : q > 0.3 ? 1.4 * spb : 2.6 * spb) - spb * 0.25;
      if (t >= A.mixAt) this.xfGlide(1);
    }
    // the filter build
    const S = this.sec;
    if (A.holdTo === undefined) A.holdTo = q > 0.85 ? S.build.t1 : q > 0.5 ? lerp(S.build.t0, S.build.t1 - spb, 0.8) : q > 0.25 ? lerp(S.build.t0, S.build.t1, 0.45) : S.build.t0 + spb * 0.5;
    const wantHold = t >= S.build.t0 - spb * 0.3 && t < A.holdTo && q > 0.1;
    if (wantHold !== this.filter.held) this.filterSet(wantHold, t);
    // drop + finish
    for (const [key, at] of [['dropPlan', this.dropT], ['finPlan', this.finishT]]) {
      if (A[key] === undefined && t > at - 0.5) A[key] = (q < 0.25 && R() < 0.6) ? null : at + gauss() * sig;
      if (A[key] !== null && A[key] !== undefined && A[key] < t1) { this.dropPress(Math.max(A[key], t)); A[key] = null; }
    }
    // scratch
    if (this.inScratch()) this.scratchRub(lerp(150, 2600, q) * dt, Math.sin(t * 18) > 0 ? 1 : -1);
  }
  /* ---------------- 3D: camera, lights, lasers, CO2 ---------------- */
  camTarget(out) {
    const b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), port = Game.cssH > Game.cssW * 1.05;
    const back = port ? 3.4 : 4.2, up = port ? 2.85 : 2.5, look = 12;
    let x = b.x - f * back, y = b.y + up, z = b.z - c * back;
    // don't put the camera inside the stage behind the booth
    try {
      const hx = b.x, hy = b.y + 1.75, hz = b.z, k = this.g.world.raycast(hx, hy, hz, x, y, z, true);
      if (k < 1) { const kk = Math.max(0.22, k - 0.08); x = lerp(hx, x, kk); y = lerp(hy, y, kk) + (1 - kk) * 0.9; z = lerp(hz, z, kk); }
    } catch (e) { /* no world yet */ }
    out.x = x; out.y = y; out.z = z;
    out.tx = b.x + f * look; out.ty = b.y + (port ? 1.1 : 1.4); out.tz = b.z + c * look;
    const asp = Game.cssW / Game.cssH;
    out.fov = Math.max(0.85, 2 * Math.atan(Math.tan(0.98 / 2) / asp));
    return out;
  }
  camera(fdt) {
    const g = this.g, cam = g.cam, T = this.camTarget(this._ct || (this._ct = {})), port = Game.cssH > Game.cssW * 1.05;
    // swoop in from the gameplay camera (unless it was far away: then just cut)
    if (this.camK === undefined || this.camK === 0) { const F = this.saved.camFrom; if (!F || Math.hypot(F.x - T.x, F.z - T.z) > 40) this.camK = 1; }
    const k = this.camK = Math.min(1, (this.camK || 0) + fdt / 1.1), e = easeInOut(k), A = this.saved.camFrom || T;
    cam.x = lerp(A.x, T.x, e); cam.y = lerp(A.y, T.y, e); cam.z = lerp(A.z, T.z, e);
    cam.tx = lerp(A.tx, T.tx, e); cam.ty = lerp(A.ty, T.ty, e); cam.tz = lerp(A.tz, T.tz, e);
    cam.fov = lerp(A.fov || 0.95, T.fov, e);
    // a little bounce with the kick, a jolt on the drop
    const bounce = this.beatK * 0.035 * (0.4 + this.energy);
    cam.y += bounce; cam.ty += bounce * 0.5;
    if (g.shakeA > 0) { const s = g.shakeA * 0.3; cam.x += (Math.random() - 0.5) * s; cam.y += (Math.random() - 0.5) * s; g.shakeA = Math.max(0, g.shakeA - fdt * 1.8); }
    // aim the picture into the strip above the decks
    const L = this.L, H = Game.cssH;
    const top = L ? L.viewTop : 0, bot = L ? L.viewBot : H * 0.55;
    cam.shift = clamp(1 - (top + bot) / H, 0, 0.75) * e + (port ? 0.06 : 0.02) * (1 - e);
    cam.roll = 0; cam.near = 0.15; cam.far = 1500;
    // booth lights: deck colours swap on the beat, a white strobe on drops
    const b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), on = this.phase === 'play' || this.phase === 'results';
    const beatN = Math.max(0, this.lastBeat), col = beatN % 2 ? [1, 0.31, 0.85] : [0.22, 0.95, 1];
    g.plights.push({ x: b.x + f * 1.2, y: b.y + 1.8, z: b.z + c * 1.2, r: 7, c: col, i: 0.6 + (on ? this.beatK * 0.9 : 0) });
    if (on) {
      const e2 = this.energy, hue = (this.t * 40 + beatN * 25) % 360, wc = burnsRGBf(burnsHSL(hue, 0.9, 0.55));
      g.plights.push({ x: b.x + f * 8, y: b.y + 5, z: b.z + c * 8, r: 16, c: wc, i: 0.4 + e2 * 0.9 + this.dropK * 1.5 });
      if (this.dropK > 0.05) g.plights.push({ x: b.x + f * 4, y: b.y + 6, z: b.z + c * 4, r: 22, c: [1, 1, 1], i: this.dropK * 2 * (Math.floor(this.rt * 16) % 2 ? 1 : 0.2) });
    }
  }
  // bones: 0 table, 1 platter A, 2 platter B (spinning)
  poseDeck() {
    const B = this.fx3d.ch.bones, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    const ox = b.x + f * 0.62, oz = b.z + c * 0.62, t = this.phase === 'play' ? Math.max(0, this.t) : this.rt;
    BurnsM.a34Set(B, 0, ox, b.y, oz, b.yaw, 0, 0, 1, 1, 1);
    const spinA = t * 0.5555 * TAU, spinB = this.pitch.loaded ? t * 0.5555 * TAU * (1 + (this.pitch.locked ? 0 : this.pitch.off / this.bpm)) : 0;
    BurnsM.a34Set(B, 12, ox + rx * 0.52, b.y + 1.0, oz + rz * 0.52, b.yaw - spinA, 0, 0, 1, 1, 1);
    BurnsM.a34Set(B, 24, ox - rx * 0.52, b.y + 1.0, oz - rz * 0.52, b.yaw - spinB + 1.3, 0, 0, 1, 1, 1);
  }
  fxStep(dt) {
    const g = this.g, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    this.dropK = Math.max(0, this.dropK - dt * 0.6); this.flashK = Math.max(0, this.flashK - dt * 2.5);
    for (let i = 0; i < 4; i++) this.padK[i] = Math.max(0, this.padK[i] - dt * 5), this.padHit[i] = Math.max(0, this.padHit[i] - dt * 3);
    this.pops = this.pops.filter(p => (p.t += dt) < 0.7);
    if (this.big) { this.big.t += dt; if (this.big.t > this.big.dur) this.big = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    // CO2 cannons: white jets either side of the booth
    for (const C of this.co2) {
      C.t += dt;
      if (C.t < C.dur) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
        const x = b.x + rx * sd * 3.2 + f * 1.4, z = b.z + rz * sd * 3.2 + c * 1.4;
        g.fx.add(x + (Math.random() - 0.5) * 0.3, b.y + 0.6, z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 1.6 + f * 1.5, 11 + Math.random() * 5, (Math.random() - 0.5) * 1.6 + c * 1.5, 1.1 + Math.random() * 0.5, 0.6, 3.2, [0.95, 0.97, 1], 0.5, 'smoke', 4);
      }
    }
    this.co2 = this.co2.filter(C => C.t < C.dur + 0.1);
    // a riser of sparks during the build, notes floating up when it's going off
    if (this.riser > 0.1 && Math.random() < this.riser * 0.6) g.fx.add(b.x + f * 2 + (Math.random() - 0.5) * 6, b.y + 0.3, b.z + c * 2 + (Math.random() - 0.5) * 6, 0, 3 + this.riser * 6, 0, 0.8, 0.25, 0.05, [1, 0.9, 0.5], 1, 'spark', 1);
    if (this.phase === 'play' && this.energy > 0.6 && Math.random() < (this.energy - 0.55) * 0.3) g.fx.notes(b.x + f * (6 + Math.random() * 6) + (Math.random() - 0.5) * 8, b.y + 2.5, b.z + c * (6 + Math.random() * 6) + (Math.random() - 0.5) * 8);
  }
  draw3d(R) {
    if (!this.active) return;
    const S = BURNS_SPRITES.R, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    const on = this.phase === 'play' || this.phase === 'results', t = on ? this.t : this.rt, e = this.energy, beatN = Math.max(0, this.lastBeat);
    // booth glow (deck lights)
    const dA = burnsRGBf('#ff4fd8'), dB = burnsRGBf('#38f2ff');
    R.bbs.bb(b.x + f * 0.9 + rx * 0.7, b.y + 1.15, b.z + c * 0.9 + rz * 0.7, 1.5, 1.5, S.glow, dA, 0.55 + this.beatK * 0.4, true);
    R.bbs.bb(b.x + f * 0.9 - rx * 0.7, b.y + 1.15, b.z + c * 0.9 - rz * 0.7, 1.5, 1.5, S.glow, dB, 0.55 + this.beatK * 0.4, true);
    R.bbs.bb(b.x + f * 1.0, b.y + 0.9, b.z + c * 1.0, 3.4, 1.4, S.glow, [1, 0.85, 0.6], 0.25 + e * 0.3, true);
    if (!on) return;
    // lasers: fans from emitters at the booth sweep over the crowd with the beat
    const B = R.B, beam = this._beamReg || (this._beamReg = { u0: lerp(S.streak.u0, S.streak.u1, 0.42), u1: lerp(S.streak.u0, S.streak.u1, 0.58), v0: S.streak.v0, v1: S.streak.v1 });
    const laser = (x0, y0, z0, x1, y1, z1, w, col, a) => {
      const segs = 5;
      for (let i = 0; i < segs; i++) {
        const u0 = i / segs, u1 = (i + 1) / segs;
        const ax = lerp(x0, x1, u0), ay = lerp(y0, y1, u0), az = lerp(z0, z1, u0), bx = lerp(x0, x1, u1), by = lerp(y0, y1, u1), bz = lerp(z0, z1, u1);
        const dx = bx - ax, dy = by - ay, dz = bz - az, px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(px, py) || 1;
        R.bbs.quad((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, px / 2, py / 2, -py / l * w / 2, px / l * w / 2, beam, col[0] * a, col[1] * a, col[2] * a, 0);
      }
    };
    const pal = [[0.3, 1, 0.4], [0.22, 0.95, 1], [1, 0.3, 0.85], [1, 0.9, 0.3]];
    const n = 4 + Math.round(e * 6), sweep = Math.sin(t * Math.PI * this.bpm / 120), build = this.riser;
    const ai = 0.25 + e * 0.6 + this.dropK * 0.6;
    for (const sd of [-1, 1]) {
      const ex = b.x + rx * sd * 2.4 + f * 0.6, ez = b.z + rz * sd * 2.4 + c * 0.6, ey = b.y + 3.2;
      const col = pal[(Math.floor(beatN / 4) + (sd > 0 ? 1 : 0)) % pal.length];
      R.bbs.bb(ex, ey, ez, 0.9, 0.9, S.glow, col, 0.9, true);
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : i / (n - 1) - 0.5;
        const ang = (u * 1.3 * (1 - build * 0.85) + sweep * 0.45 * sd) , el = 0.05 + 0.25 * Math.sin(t * 1.3 + i) * (1 - build) + build * 0.35;
        const dl = 40, hx = Math.sin(b.yaw + ang), hz = Math.cos(b.yaw + ang);
        laser(ex, ey, ez, ex + hx * dl, ey + el * dl, ez + hz * dl, 0.055 + this.dropK * 0.04, col, ai * (0.7 + 0.3 * Math.sin(t * 7 + i)));
      }
    }
    // spot cones from above the booth, swinging with the beat
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(t * 1.1 + i * 2.1), x0 = b.x + rx * (i - 1) * 3 + f * 0.5, z0 = b.z + rz * (i - 1) * 3 + c * 0.5, y0 = b.y + 6.5;
      const tx = b.x + f * (9 + i * 2) + rx * sw * 6, tz = b.z + c * (9 + i * 2) + rz * sw * 6;
      const dx = tx - x0, dy = (b.y) - y0, dz = tz - z0, px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(px, py) || 1;
      const col = burnsRGBf(burnsHSL((t * 30 + i * 120) % 360, 0.8, 0.6)), a = 0.12 + e * 0.2 + this.beatK * 0.1;
      R.bbs.quad((x0 + tx) / 2, (y0 + b.y) / 2, (z0 + tz) / 2, -py / l * 2.2, px / l * 2.2, px / 2, py / 2, S.beam, col[0] * a, col[1] * a, col[2] * a, 0);
    }
  }
  /* ---------------- 2D: the decks ---------------- */
  layout() {
    const W = Game.cssW, H = Game.cssH, port = H > W * 1.05, s = BurnsUI.safe();
    const L = { W, H, port, s };
    L.pause = { x: W - s.r - 20, y: s.t + 20, r: 18 };
    if (!port) {
      const ph = clamp(H * 0.4, 140, 210), py = H - ph;
      L.panel = { x: 0, y: py, w: W, h: ph };
      const top = py + 12, bot = H - Math.max(10, insets.b + 4), ih = bot - top;
      const R = clamp(Math.min(ih / 2 - 4, (W - s.l - s.r) * 0.1), 48, 84);
      const fw = clamp(R * 0.3, 20, 26);
      L.pitchA = { x: s.l, y: top + 6, w: fw, h: ih - 12 };
      L.jogA = { x: s.l + fw + 8 + R, y: top + ih / 2, r: R };
      L.pitchB = { x: W - s.r - fw, y: top + 6, w: fw, h: ih - 12 };
      L.jogB = { x: W - s.r - fw - 8 - R, y: top + ih / 2, r: R };
      const pw = clamp(R * 0.92, 50, 76), gap = 8, phh = (ih - gap) / 2;
      const lx = L.jogA.x + R + 12, rx = L.jogB.x - R - 12 - pw;
      L.pads = [{ x: lx, y: top, w: pw, h: phh }, { x: lx, y: top + phh + gap, w: pw, h: phh }, { x: rx, y: top, w: pw, h: phh }, { x: rx, y: top + phh + gap, w: pw, h: phh }];
      const mx = lx + pw + 12, mw = rx - 12 - mx;
      L.mixer = { x: mx, y: top - 4, w: mw, h: ih + 4 };
      const kr = clamp(Math.min(mw * 0.13, ih * 0.27), 22, 38);
      L.filter = { x: mx + kr + 6, y: top + ih * 0.47, r: kr };
      L.drop = { x: mx + mw - kr - 6, y: top + ih * 0.47, r: kr * 1.05 };
      L.eq = { x: L.filter.x + kr + 12, y: top + 4, w: (L.drop.x - kr - 12) - (L.filter.x + kr + 12), h: ih * 0.62 };
      L.xf = { x: mx + mw * 0.2, y: bot - 26, w: mw * 0.6, h: 22 };
      // waveforms float over the bottom of the 3D view
      const ww = Math.min(W - s.l - s.r - 24, 640), wx = (W - ww) / 2, wh = clamp(H * 0.042, 14, 20);
      L.waveA = { x: wx, y: py - wh * 2 - 14, w: ww, h: wh }; L.waveB = { x: wx, y: py - wh - 8, w: ww, h: wh };
      L.top = { y: s.t + 2, h: 36 };
      L.viewTop = L.top.y + L.top.h; L.viewBot = L.waveA.y - 4;
    } else {
      const pw = W - s.l - s.r;
      const R = clamp((pw - 70) / 4.4, 52, 86), fw = clamp(R * 0.28, 18, 24);
      const padH = clamp(H * 0.085, 56, 80), mixH = clamp(H * 0.115, 84, 112), jogH = R * 2 + 16, waveH = clamp(H * 0.024, 15, 22);
      const bot = H - Math.max(12, insets.b + 6);
      const padY = bot - padH, mixY = padY - 10 - mixH, jogY = mixY - 8 - jogH, waveY = jogY - waveH * 2 - 16;
      L.panel = { x: 0, y: waveY - 10, w: W, h: H - (waveY - 10) };
      const gap = 8, pdw = (pw - gap * 3) / 4;
      L.pads = [0, 1, 2, 3].map(i => ({ x: s.l + i * (pdw + gap), y: padY, w: pdw, h: padH }));
      L.pitchA = { x: s.l, y: jogY + 8, w: fw, h: jogH - 16 };
      L.pitchB = { x: W - s.r - fw, y: jogY + 8, w: fw, h: jogH - 16 };
      L.jogA = { x: s.l + fw + 6 + R, y: jogY + jogH / 2, r: R };
      L.jogB = { x: W - s.r - fw - 6 - R, y: jogY + jogH / 2, r: R };
      const kr = clamp(mixH * 0.36, 26, 40);
      L.mixer = { x: s.l, y: mixY, w: pw, h: mixH };
      L.filter = { x: s.l + kr + 8, y: mixY + mixH / 2, r: kr };
      L.drop = { x: W - s.r - kr - 8, y: mixY + mixH / 2, r: kr * 1.05 };
      L.xf = { x: L.filter.x + kr + 22, y: mixY + mixH - 30, w: (L.drop.x - kr - 22) - (L.filter.x + kr + 22), h: 24 };
      L.eq = { x: L.xf.x, y: mixY + 4, w: L.xf.w, h: mixH - 44 };
      L.waveA = { x: s.l, y: waveY, w: pw, h: waveH }; L.waveB = { x: s.l, y: waveY + waveH + 6, w: pw, h: waveH };
      L.top = { y: s.t + 2, h: 54 };
      L.viewTop = L.top.y + L.top.h; L.viewBot = L.panel.y;
    }
    const bw = Math.min(260, W * 0.6);
    L.introY = port ? H * 0.16 : L.viewTop + 12;
    L.startBtn = { x: (W - bw) / 2, y: port ? H * 0.16 + 78 : L.viewTop + 66, w: bw, h: 44 };
    L.menu = [0, 1, 2].map(i => ({ x: (W - bw) / 2, y: H * 0.3 + i * 54, w: bw, h: 44 }));
    this.L = L;
    return L;
  }
  draw(ctx, fdt) {
    const g = this.g, W = Game.cssW, H = Game.cssH;
    const L = this.layout();
    ctx.save();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const slide = easeOut(clamp(this.rt / 0.6, 0, 1)), outK = this.phase === 'out' ? clamp(this.outT / 0.4, 0, 1) : 0;
    const off = (1 - slide) * (H - L.panel.y) + outK * (H - L.panel.y);
    // a vignette + booth glow behind the panel
    const glowCol = this.lastBeat % 2 ? '255,79,216' : '56,242,255';
    const gg = ctx.createLinearGradient(0, L.panel.y - 90 + off, 0, L.panel.y + off);
    gg.addColorStop(0, `rgba(${glowCol},0)`); gg.addColorStop(1, `rgba(${glowCol},${0.12 + this.beatK * 0.18 * (0.5 + this.energy)})`);
    ctx.fillStyle = gg; ctx.fillRect(0, L.panel.y - 90 + off, W, 90);
    ctx.save(); ctx.translate(0, off);
    this.drawPanel(ctx, L);
    ctx.restore();
    if (this.phase !== 'intro' || this.rt > 0.3) this.drawTop(ctx, L);
    this.drawShouts(ctx, L);
    this.drawCenter(ctx, L);
    if (this.phase === 'intro') this.drawIntro(ctx, L);
    if (this.phase === 'results' || this.phase === 'out') this.drawResults(ctx, L);
    if (this.paused) this.drawPause(ctx, L);
    // flashes + scene fades (the HUD overlay normally runs these)
    if (this.flashK > 0.01) { ctx.fillStyle = `rgba(255,255,255,${this.flashK * 0.6})`; ctx.fillRect(0, 0, W, H); }
    if (g.flashA > 0) { ctx.fillStyle = rgba(g.flashC || '#ffffff', Math.min(1, g.flashA)); ctx.fillRect(0, 0, W, H); g.flashA = Math.max(0, g.flashA - fdt * 1.6); }
    g.fade = approach(g.fade, g.fadeTarget, fdt * g.fadeRate);
    if (g.fade > 0.001) { ctx.fillStyle = `rgba(6,3,12,${g.fade})`; ctx.fillRect(0, 0, W, H); }
    if (outK > 0) { ctx.fillStyle = `rgba(6,3,12,${outK * 0.6})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  drawPanel(ctx, L) {
    const P = L.panel, W = L.W, t = this.phase === 'play' ? this.t : this.rt;
    // brushed-metal body with a lit top edge
    ctx.save();
    const bg = ctx.createLinearGradient(0, P.y, 0, P.y + P.h); bg.addColorStop(0, '#1d1a26'); bg.addColorStop(0.08, '#14121b'); bg.addColorStop(1, '#09080d');
    ctx.fillStyle = bg; burnsRR(ctx, P.x - 2, P.y, P.w + 4, P.h + 20, 18); ctx.fill();
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
    for (let y = P.y + 6; y < P.y + P.h; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    const edge = ctx.createLinearGradient(0, 0, W, 0); edge.addColorStop(0, '#ff4fd8'); edge.addColorStop(0.5, '#ffe24a'); edge.addColorStop(1, '#38f2ff');
    ctx.strokeStyle = edge; ctx.lineWidth = 2 + this.beatK * 2; ctx.globalAlpha = 0.55 + this.beatK * 0.45;
    ctx.beginPath(); ctx.moveTo(14, P.y + 1); ctx.lineTo(W - 14, P.y + 1); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    this.drawWave(ctx, L.waveA, 'A');
    this.drawWave(ctx, L.waveB, 'B');
    this.drawPitch(ctx, L.pitchA, 'A');
    this.drawPitch(ctx, L.pitchB, 'B');
    this.drawJog(ctx, L.jogA, 'A', t);
    this.drawJog(ctx, L.jogB, 'B', t);
    this.drawMixer(ctx, L, t);
    for (let i = 0; i < 4; i++) this.drawPad(ctx, L.pads[i], i, t);
  }
  // the scrolling waveform strip with its beat grid
  drawWave(ctx, r, deck) {
    if (!r) return;
    const t = this.phase === 'play' ? this.t : 0, spb = this.spb, live = deck === 'A' ? (t < this.mixT) : (t >= this.mixT - 0.01);
    const loaded = deck === 'A' || this.pitch.loaded;
    const col = deck === 'A' ? '#ff4fd8' : '#38f2ff';
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,14,0.82)'; burnsRR(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = rgba(col, live ? 0.85 : 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); burnsRR(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 5); ctx.clip();
    const ph = r.x + r.w * 0.3, ppb = clamp(r.w / 22, 18, 34), cy = r.y + r.h / 2;
    const beatNow = t / spb + (deck === 'B' ? (this.pitch.locked ? 0 : this.pitch.phase) : 0);
    if (loaded) {
      // waveform columns (deterministic noise shaped by the set's sections)
      const step = 3, seedK = deck === 'A' ? 13 : 71;
      for (let x = r.x; x < r.x + r.w; x += step) {
        const bt = beatNow + (x - ph) / ppb, bf = bt - Math.floor(bt), bi = Math.floor(bt);
        if (bt < 0) continue;
        const sect = this.waveEnergy(bt * spb, deck);
        const kick = Math.exp(-bf * 7), hat = Math.exp(-Math.abs(bf - 0.5) * 18) * 0.5;
        const n = BurnsM.hash(bi * 31 + Math.floor(bf * 8) + seedK);
        const a = clamp((0.25 + kick * 0.7 + hat * 0.4 + n * 0.25) * sect, 0.04, 1) * (r.h / 2 - 1.5);
        const past = x < ph;
        ctx.fillStyle = past ? rgba(col, 0.38) : (kick > 0.5 ? '#ffffff' : col);
        ctx.globalAlpha = live ? 0.95 : 0.45;
        ctx.fillRect(x, cy - a, step - 1, a * 2);
      }
      ctx.globalAlpha = 1;
      // beat + bar grid, phrase flags
      const b0 = Math.floor(beatNow - (ph - r.x) / ppb) - 1, b1 = Math.ceil(beatNow + (r.x + r.w - ph) / ppb) + 1;
      for (let b = Math.max(0, b0); b <= b1; b++) {
        const x = ph + (b - beatNow) * ppb, bar = b % 4 === 0, phrase = b % 16 === 4;
        ctx.fillStyle = phrase ? '#ffe24a' : bar ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)';
        ctx.fillRect(x - (bar ? 1 : 0.5), r.y, bar ? 2 : 1, phrase ? r.h : bar ? r.h * 0.45 : r.h * 0.25);
      }
      // cue markers: MIX on A, DROP on B
      const mark = (time, txt, mc) => { const x = ph + (time / spb - beatNow) * ppb; if (x < r.x - 30 || x > r.x + r.w + 30) return; ctx.fillStyle = mc; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + 6, r.y); ctx.lineTo(x, r.y + 7); ctx.closePath(); ctx.fill(); ctx.fillRect(x, r.y, 1.5, r.h); BurnsUI.text(ctx, txt, x + 4, r.y + r.h - 6, 8, mc, { align: 'left', stroke: false }); };
      if (deck === 'A') mark(this.mixT, 'MIX', '#ffe24a');
      else { mark(this.mixT, 'IN', '#ffe24a'); mark(this.dropT, 'DROP', '#ff3b5c'); }
    } else {
      BurnsUI.text(ctx, 'LOADING' + '.'.repeat(1 + Math.floor(this.rt * 3) % 3), r.x + r.w / 2, cy, 9, 'rgba(255,255,255,0.5)', { stroke: false });
    }
    // playhead
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ph - 1, r.y, 2, r.h);
    ctx.restore();
    // labels
    const tr = deck === 'A' ? this.trackA : this.trackB;
    ctx.save();
    ctx.font = `600 ${Math.max(8, Math.min(10, r.h * 0.55))}px ${FONT_UI}`; ctx.textBaseline = 'middle';
    const name = `${deck}  ${loaded ? tr.name : '—'}`;
    const tw = ctx.measureText(name).width + 10;
    ctx.fillStyle = 'rgba(8,6,14,0.75)'; burnsRR(ctx, r.x + 4, r.y + 2, tw, r.h - 4, 4); ctx.fill();
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(name, r.x + 9, r.y + r.h / 2 + 0.5);
    ctx.restore();
  }
  // waveform loudness per deck at song time ts (follows the set's structure)
  waveEnergy(ts, deck) {
    const S = this.sec;
    if (deck === 'A') return ts < this.mixT ? 0.85 : 0.5;
    if (ts < this.mixT) return 0.7;
    if (ts >= S.build.t0 && ts < S.build.t1) return 0.35 + 0.65 * (ts - S.build.t0) / (S.build.t1 - S.build.t0);
    if (ts >= this.dropT) return 1;
    return 0.8;
  }
  drawPitch(ctx, r, deck) {
    if (!r) return;
    const col = deck === 'A' ? '#ff4fd8' : '#38f2ff', live = deck === 'B' && this.pitchLive();
    ctx.save();
    ctx.fillStyle = '#0b0a10'; burnsRR(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = live ? rgba(col, 0.6 + 0.4 * Math.sin(this.rt * 8)) : 'rgba(255,255,255,0.15)'; ctx.lineWidth = live ? 2 : 1; ctx.stroke();
    const cx = r.x + r.w / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - 1, r.y + 8, 2, r.h - 16);
    for (let i = 0; i <= 8; i++) { const y = r.y + 8 + (r.h - 16) * i / 8; ctx.fillRect(cx - (i === 4 ? 7 : 4), y, i === 4 ? 14 : 8, 1); }
    const v = deck === 'B' ? clamp(this.pitch.off / 8, -1, 1) : 0, ky = r.y + r.h / 2 - v * (r.h / 2 - 12);
    const kg = ctx.createLinearGradient(0, ky - 7, 0, ky + 7); kg.addColorStop(0, '#d8d8e8'); kg.addColorStop(1, '#6a6a7a');
    ctx.fillStyle = kg; burnsRR(ctx, r.x + 2, ky - 7, r.w - 4, 14, 4); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(r.x + 4, ky - 1, r.w - 8, 2);
    BurnsUI.text(ctx, '+', cx, r.y + 6, 9, 'rgba(255,255,255,0.6)', { stroke: false });
    BurnsUI.text(ctx, '−', cx, r.y + r.h - 6, 9, 'rgba(255,255,255,0.6)', { stroke: false });
    ctx.restore();
  }
  drawJog(ctx, J, deck, t) {
    if (!J) return;
    const col = deck === 'A' ? '#ff4fd8' : '#38f2ff', x = J.x, y = J.y, R = J.r;
    const bpmD = deck === 'B' ? this.bpm + (this.pitch.locked ? 0 : this.pitch.off) : this.bpm;
    const live = deck === 'A' ? this.t < this.mixT || this.phase !== 'play' : this.phase === 'play' && this.t >= this.mixT;
    const ang = (this.jogSpin && this.jogSpin['jog' + deck] || 0) + (deck === 'A' || this.pitch.loaded ? t * 0.5555 * TAU * (bpmD / this.bpm) : 0);
    ctx.save();
    // outer metal ring
    const og = ctx.createRadialGradient(x - R * 0.3, y - R * 0.4, R * 0.1, x, y, R);
    og.addColorStop(0, '#5a5a6a'); og.addColorStop(0.7, '#25242e'); og.addColorStop(1, '#121118');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, R - 1, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
    // LED ring: one lap per bar, the beat lights up
    const segs = 32, barPos = this.phase === 'play' && this.t >= 0 ? ((this.t / this.spb) % 4) / 4 : 0, lit = Math.floor(barPos * segs);
    for (let i = 0; i < segs; i++) {
      const a0 = -Math.PI / 2 + i / segs * TAU + 0.02, a1 = a0 + TAU / segs - 0.05;
      const on = i <= lit && live, beatSeg = i % 8 === 0;
      ctx.strokeStyle = on ? (beatSeg ? '#ffffff' : col) : 'rgba(255,255,255,0.08)';
      ctx.globalAlpha = on ? (i === lit ? 1 : 0.65) : 1;
      ctx.lineWidth = R * 0.06; ctx.beginPath(); ctx.arc(x, y, R * 0.9, a0, a1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // platter + grooves
    const pg = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 0.82); pg.addColorStop(0, '#1c1b24'); pg.addColorStop(1, '#0a0a0e');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, R * 0.82, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let rr2 = R * 0.38; rr2 < R * 0.8; rr2 += R * 0.055) { ctx.beginPath(); ctx.arc(x, y, rr2, 0, TAU); ctx.stroke(); }
    // spinning sheen + marker
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const sh = ctx.createLinearGradient(-R * 0.8, 0, R * 0.8, 0); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.65, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -R * 0.34); ctx.lineTo(0, -R * 0.78); ctx.stroke();
    // label
    const lg = ctx.createRadialGradient(-R * 0.08, -R * 0.1, 1, 0, 0, R * 0.34); lg.addColorStop(0, shade(col, 0.35)); lg.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, 0, R * 0.33, 0, TAU); ctx.fill();
    ctx.restore();
    BurnsUI.text(ctx, deck, x, y + 1, R * 0.26, '#ffffff', { stroke: false });
    ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.arc(x, y - R * 0.18, 2.2, 0, TAU); ctx.fill();
    // live glow / touch glow / beatmatch hint
    const touched = Array.from(this.ptr.values()).some(P => P.c === 'jog' + deck);
    if (live || touched) { ctx.strokeStyle = rgba(col, touched ? 0.95 : 0.45 + this.beatK * 0.4); ctx.lineWidth = touched ? 4 : 2.5; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x, y, R + 2, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0; }
    // BPM readout
    const bpmTxt = (deck === 'B' && !this.pitch.loaded) ? '---.-' : bpmD.toFixed(1);
    const diffB = deck === 'B' && this.pitch.loaded ? (this.pitch.locked ? 0 : this.pitch.off) : 0;
    const bcol = deck === 'B' && this.pitch.loaded ? (Math.abs(diffB) < 0.3 ? '#7aff5a' : Math.abs(diffB) < 1.5 ? '#ffe24a' : '#ff6a6a') : '#ffffff';
    ctx.fillStyle = 'rgba(6,5,10,0.85)'; burnsRR(ctx, x - 30, y + R * 0.46, 60, 17, 5); ctx.fill();
    BurnsUI.text(ctx, bpmTxt, x, y + R * 0.46 + 9, 10, bcol, { stroke: false });
    if (deck === 'B' && this.pitchLive() && this.phase === 'play') {
      const a = 0.6 + 0.4 * Math.sin(this.rt * 7);
      ctx.globalAlpha = a;
      BurnsUI.text(ctx, diffB > 0 ? '▼ DRAG DOWN' : '▲ DRAG UP', x, y - R - 9, 11, '#38f2ff', { glow: '#38f2ff' });
      ctx.globalAlpha = 1;
    }
    if (this.inScratch() && !this.scratch.judged) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.rt * 9); BurnsUI.text(ctx, '↺ RUB ↻', x, y - R - 9, 11, '#ffe24a', { glow: '#ffe24a' }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawMixer(ctx, L, t) {
    const M = L.mixer;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; burnsRR(ctx, M.x, M.y, M.w, M.h, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
    // beat LEDs 1-2-3-4
    const bpos = this.phase === 'play' && this.t >= 0 ? Math.floor(this.t / this.spb) % 4 : -1;
    const ledY = L.port ? M.y + 12 : M.y + 9, ledX = M.x + M.w / 2;
    for (let i = 0; i < 4; i++) { const x = ledX + (i - 1.5) * 16, on = i === bpos; ctx.fillStyle = on ? (i === 0 ? '#ff3b5c' : '#ffe24a') : 'rgba(255,255,255,0.12)'; if (on) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10; } ctx.beginPath(); ctx.arc(x, ledY, i === 0 ? 5 : 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
    // phase meter (beatmatch): the needle drifts while the decks disagree
    const E = L.eq;
    const pm = { x: E.x + E.w * 0.08, y: ledY + 10, w: E.w * 0.84, h: 10 };
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; burnsRR(ctx, pm.x, pm.y, pm.w, pm.h, 5); ctx.fill();
    ctx.fillStyle = 'rgba(122,255,90,0.35)'; ctx.fillRect(pm.x + pm.w / 2 - 6, pm.y, 12, pm.h);
    if (this.pitch.loaded) {
      let ph = this.pitch.phase; ph = ph - Math.round(ph);
      const nx = pm.x + pm.w / 2 + ph * pm.w * 0.9, good = this.pitch.locked || Math.abs(this.pitch.off) < 0.3;
      ctx.fillStyle = good ? '#7aff5a' : '#ff6a6a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; burnsRR(ctx, nx - 3, pm.y - 3, 6, pm.h + 6, 3); ctx.fill(); ctx.shadowBlur = 0;
      if (!this.pitch.locked) { const bA = (this.t / this.spb) % 1, bB = (this.t / this.spb + this.pitch.phase) % 1; ctx.fillStyle = `rgba(255,79,216,${Math.max(0.15, 1 - bA * 3)})`; ctx.beginPath(); ctx.arc(pm.x - 8, pm.y + pm.h / 2, 4, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(56,242,255,${Math.max(0.15, 1 - ((bB + 1) % 1) * 3)})`; ctx.beginPath(); ctx.arc(pm.x + pm.w + 8, pm.y + pm.h / 2, 4, 0, TAU); ctx.fill(); }
    }
    BurnsUI.text(ctx, this.pitch.locked ? 'SYNC' : 'PHASE', pm.x + pm.w / 2, pm.y + pm.h + 8, 8, this.pitch.locked ? '#7aff5a' : 'rgba(255,255,255,0.45)', { stroke: false });
    // EQ knobs: auto-swap the lows during the mix (decoration that tells the story)
    const mixK = clamp((this.t - (this.mixT - this.spb * 4)) / (this.spb * 8), 0, 1);
    const knobs = [['HI', 0.5, 0.5], ['MID', 0.5, 0.5], ['LOW', 1 - mixK * 0.9, 0.1 + mixK * 0.9]];
    const ky0 = pm.y + pm.h + 24, kr = clamp(E.w * 0.05, 7, 11), rowH = Math.max(kr * 2 + 6, (E.y + E.h - ky0) / 3);
    if (E.y + E.h - ky0 > kr * 2) {
      knobs.forEach((k, i) => {
        const yy = ky0 + i * rowH; if (yy + kr > E.y + E.h + 4) return;
        for (const [sd, v, c] of [[-1, k[1], '#ff4fd8'], [1, k[2], '#38f2ff']]) this.knob(ctx, E.x + E.w / 2 + sd * E.w * 0.28, yy, kr, v, c);
        BurnsUI.text(ctx, k[0], E.x + E.w / 2, yy, 7, 'rgba(255,255,255,0.5)', { stroke: false });
      });
    }
    // channel meters bouncing to the beat
    const lvA = (this.t < this.mixT ? 1 : Math.max(0, 1 - mixK)) * (0.55 + this.beatK * 0.45), lvB = (this.t >= this.mixT - this.spb * 2 ? 1 : 0.15) * (0.55 + this.beatK * 0.45) * (this.phase === 'play' ? 1 : 0.3);
    for (const [sd, lv, c] of [[-1, lvA, '#ff4fd8'], [1, lvB, '#38f2ff']]) {
      const mx = E.x + E.w / 2 + sd * E.w * 0.46 - 3, mh = E.h * 0.8, my = E.y + E.h * 0.15;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(mx, my, 6, mh);
      const n = 10; for (let i = 0; i < n; i++) { if (i / n > lv) break; ctx.fillStyle = i > 7 ? '#ff3b5c' : i > 5 ? '#ffe24a' : c; ctx.fillRect(mx + 1, my + mh - (i + 1) * mh / n + 1, 4, mh / n - 2); }
    }
    // FILTER (hold) + DROP (tap)
    this.drawFilter(ctx, L.filter);
    this.drawDrop(ctx, L.drop);
    this.drawXF(ctx, L.xf);
    ctx.restore();
  }
  knob(ctx, x, y, r, v, col) {
    const kg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); kg.addColorStop(0, '#6a6a78'); kg.addColorStop(1, '#1a1a22');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    const a = -Math.PI * 1.25 + v * Math.PI * 1.5;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 2.5, -Math.PI * 1.25, a); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); ctx.stroke();
  }
  drawFilter(ctx, F) {
    const S = this.sec, t = this.t, inB = this.phase === 'play' && t >= S.build.t0 - 4 * this.spb && t < S.build.t1, held = this.filter.held;
    const x = F.x, y = F.y, r = F.r;
    ctx.save();
    if (inB) { ctx.shadowColor = '#ffe24a'; ctx.shadowBlur = held ? 26 : 12 + Math.sin(this.rt * 8) * 6; }
    const kg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r); kg.addColorStop(0, held ? '#fff6b0' : '#7a7a88'); kg.addColorStop(1, held ? '#b08a10' : '#1c1c24');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    // sweep arc
    const v = this.filter.pos, a0 = -Math.PI * 1.25, a = a0 + v * Math.PI * 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r + 6, a0, a0 + Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = '#ffe24a'; ctx.beginPath(); ctx.arc(x, y, r + 6, a0, a); ctx.stroke();
    ctx.strokeStyle = held ? '#3a2a00' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75); ctx.stroke();
    BurnsUI.text(ctx, 'FILTER', x, y + r + 14, 9, inB ? '#ffe24a' : 'rgba(255,255,255,0.55)', { stroke: false });
    if (inB && !held && !this.filter.judged) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.rt * 10); BurnsUI.text(ctx, 'HOLD', x, y, r * 0.42, '#ffffff'); ctx.globalAlpha = 1; }
    else if (held && inB) BurnsUI.text(ctx, Math.round(v * 100) + '%', x, y, r * 0.36, '#3a2a00', { stroke: false });
    ctx.restore();
  }
  drawDrop(ctx, D) {
    const t = this.t, play = this.phase === 'play';
    const nextT = !this.drop.judged ? this.dropT : !this.finish.judged ? this.finishT : null;
    const near = play && nextT !== null && t > nextT - 4 * this.spb && t < nextT + this.win.o;
    const x = D.x, y = D.y, r = D.r;
    ctx.save();
    const pulse = near ? 0.5 + 0.5 * Math.sin(this.rt * 12) : 0;
    ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = near ? 18 + pulse * 18 : 6;
    const kg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r); kg.addColorStop(0, near ? '#ff9aac' : '#9a3a4a'); kg.addColorStop(1, near ? '#c0102a' : '#3a0a14');
    ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    BurnsUI.text(ctx, nextT === this.finishT && this.drop.judged ? 'END' : 'DROP', x, y + 1, r * 0.36, '#ffffff');
    // approach ring + beat count for the drop / finish
    if (near) {
      const dtb = (nextT - t) / this.spb;
      if (dtb > 0) {
        const k = clamp(dtb / 4, 0, 1), rr2 = r * (1 + k * 1.6);
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + (1 - k) * 0.5})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, rr2, 0, TAU); ctx.stroke();
        BurnsUI.text(ctx, String(Math.ceil(dtb)), x, y - r - 14, 14, '#ffe24a', { glow: '#ff3b5c' });
      }
    }
    ctx.restore();
  }
  drawXF(ctx, X) {
    const xf = this.xf, t = this.t, play = this.phase === 'play', near = play && xf.free && !xf.judged;
    ctx.save();
    ctx.fillStyle = '#07060b'; burnsRR(ctx, X.x, X.y + X.h / 2 - 4, X.w, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,79,216,0.5)'; ctx.fillRect(X.x + 4, X.y + X.h / 2 - 1, X.w * 0.45, 2);
    ctx.fillStyle = 'rgba(56,242,255,0.5)'; ctx.fillRect(X.x + X.w * 0.55 - 4, X.y + X.h / 2 - 1, X.w * 0.45, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(X.x + X.w / 2 - 1, X.y, 2, X.h);
    BurnsUI.text(ctx, 'A', X.x - 9, X.y + X.h / 2, 10, '#ff4fd8', { stroke: false });
    BurnsUI.text(ctx, 'B', X.x + X.w + 9, X.y + X.h / 2, 10, '#38f2ff', { stroke: false });
    const kx = X.x + xf.pos * X.w;
    if (near) { ctx.shadowColor = '#ffe24a'; ctx.shadowBlur = 16 + Math.sin(this.rt * 9) * 8; }
    const kg = ctx.createLinearGradient(0, X.y, 0, X.y + X.h); kg.addColorStop(0, '#f0f0f8'); kg.addColorStop(1, '#7a7a8a');
    ctx.fillStyle = kg; burnsRR(ctx, kx - 11, X.y - 2, 22, X.h + 4, 5); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(kx - 1, X.y + 2, 2, X.h - 4);
    if (near) {
      const dtb = (this.mixT - t) / this.spb;
      const msg = dtb > 0.5 ? `SLIDE ON THE 1 · ${Math.ceil(dtb)}` : 'SLIDE ▶ NOW!';
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(this.rt * 8);
      BurnsUI.text(ctx, msg, X.x + X.w / 2, X.y - 10, 10, dtb > 0.5 ? '#ffe24a' : '#7aff5a', { glow: '#ffe24a' });
      ctx.globalAlpha = 1;
    } else BurnsUI.text(ctx, 'CROSSFADER', X.x + X.w / 2, X.y - 9, 8, 'rgba(255,255,255,0.4)', { stroke: false });
    ctx.restore();
  }
  drawPad(ctx, r, i, t) {
    const Ln = BURNS_DJ_LANES[i], col = Ln.col, press = this.padK[i], hitK = this.padHit[i];
    ctx.save();
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    // the pad: soft rubber with an RGB glow
    ctx.shadowColor = col; ctx.shadowBlur = 6 + hitK * 22;
    const pg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); pg.addColorStop(0, shade(col, -0.45 + hitK * 0.5 + press * 0.2)); pg.addColorStop(1, shade(col, -0.75 + hitK * 0.4));
    ctx.fillStyle = pg; burnsRR(ctx, r.x + press * 2, r.y + press * 2, r.w - press * 4, r.h - press * 4, 10); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(col, 0.7 + hitK * 0.3); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; burnsRR(ctx, r.x + 4, r.y + 3, r.w - 8, r.h * 0.35, 8); ctx.fill();
    BurnsUI.text(ctx, Ln.label, cx, r.y + r.h - 10, Math.min(10, r.w * 0.14), 'rgba(255,255,255,0.75)', { stroke: false });
    // approach rings: close on the pad's edge exactly on the hit time
    if (this.phase === 'play') {
      const half = Math.min(r.w, r.h) / 2;
      for (const n of this.notes) {
        if (n.t > t + this.approach) break;
        if (n.judged || n.lane !== i) continue;
        const k = (n.t - t) / this.approach; if (k < -0.2) continue;
        const rad = half * (1 + Math.max(0, k) * 0.85);
        ctx.strokeStyle = k >= 0 ? rgba('#ffffff', 0.35 + (1 - k) * 0.65) : rgba(col, 0.7);
        ctx.lineWidth = 2.5 + (1 - Math.max(0, k)) * 2;
        ctx.beginPath(); burnsRR(ctx, cx - rad * (r.w / (2 * half)) , cy - rad * (r.h / (2 * half)), rad * (r.w / half), rad * (r.h / half), 10 + Math.max(0, k) * 12); ctx.stroke();
        ctx.fillStyle = rgba(col, 0.15 + (1 - Math.max(0, k)) * 0.35); ctx.beginPath(); ctx.arc(cx, cy - 4, 4 + (1 - Math.max(0, k)) * 6, 0, TAU); ctx.fill();
      }
    }
    // judgement pops
    for (const p of this.pops) if (p.lane === i) { const a = 1 - p.t / 0.7; ctx.globalAlpha = a; BurnsUI.text(ctx, p.text, cx, r.y - 8 - p.t * 30, p.text.length > 4 ? 12 : 14, p.col, { glow: p.col }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawTop(ctx, L) {
    const W = L.W, s = L.s, y = L.top.y;
    ctx.save();
    // title pill
    const port = L.port;
    ctx.font = `13px ${FONT_DISPLAY}`;
    const sub = `${this.bpm} BPM · ${this.genre}`;
    const tw = Math.min(port ? W - s.l - s.r - 60 : W * 0.3, Math.max(ctx.measureText(this.title).width, 90) + 24);
    BurnsUI.pill(ctx, s.l, y + 2, tw, 32, 'rgba(10,6,20,0.72)', 'rgba(255,79,216,0.5)');
    ctx.save(); ctx.beginPath(); ctx.rect(s.l + 8, y + 2, tw - 16, 32); ctx.clip();
    BurnsUI.text(ctx, this.title, s.l + 12, y + 13, 11, '#ffffff', { align: 'left', stroke: false });
    BurnsUI.text(ctx, sub, s.l + 12, y + 26, 9, '#ff9ad8', { align: 'left', stroke: false, ui: true });
    ctx.restore();
    // crowd energy meter
    const mw = port ? W - s.l - s.r - 8 : Math.min(320, W * 0.34), mx = port ? s.l + 4 : (W - mw) / 2, my = port ? y + 40 : y + 6;
    ctx.fillStyle = 'rgba(10,6,20,0.72)'; burnsRR(ctx, mx, my, mw, 22, 11); ctx.fill();
    const e = this.energy, eg = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    eg.addColorStop(0, '#3a6aff'); eg.addColorStop(0.35, '#7aff5a'); eg.addColorStop(0.65, '#ffe24a'); eg.addColorStop(0.85, '#ff7a2a'); eg.addColorStop(1, '#ff4fd8');
    ctx.save(); ctx.beginPath(); burnsRR(ctx, mx + 3, my + 3, (mw - 6) * Math.max(0.02, e), 16, 8); ctx.clip();
    ctx.fillStyle = eg; ctx.fillRect(mx, my, mw, 22);
    ctx.globalAlpha = 0.25 + this.beatK * 0.3; ctx.fillStyle = '#ffffff'; for (let x = mx - 20 + (this.rt * 40) % 20; x < mx + mw; x += 20) { ctx.beginPath(); ctx.moveTo(x, my + 19); ctx.lineTo(x + 8, my + 3); ctx.lineTo(x + 12, my + 3); ctx.lineTo(x + 4, my + 19); ctx.fill(); }
    ctx.restore();
    const pk = mx + 3 + (mw - 6) * this.peak; ctx.fillStyle = '#ffffff'; ctx.fillRect(pk - 1, my + 2, 2, 18);
    const mood = e > 0.85 ? 'ON FIRE' : e > 0.65 ? 'WILD' : e > 0.45 ? 'GROOVING' : e > 0.25 ? 'NODDING' : 'BORED';
    BurnsUI.text(ctx, 'CROWD · ' + mood, mx + mw / 2, my + 11.5, 10, '#ffffff', { sw: 3 });
    // combo + pause
    const cx = W - s.r - 46;
    if (this.st.combo >= 4 && this.phase === 'play') BurnsUI.text(ctx, `${this.st.combo}x COMBO`, port ? W - s.r - 4 : cx - 18, port ? L.viewBot - 18 : y + 17, 16 + Math.min(8, this.st.combo / 8), '#ffe24a', { glow: '#ff9a2a', align: 'right' });
    const pb = L.pause;
    ctx.fillStyle = 'rgba(10,6,24,0.6)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, pb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(pb.x - 5, pb.y - 6, 3.5, 12); ctx.fillRect(pb.x + 1.5, pb.y - 6, 3.5, 12);
    // set progress
    if (this.phase === 'play') { const k = clamp(this.t / this.endT, 0, 1); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(mx, my + 25, mw, 2); ctx.fillStyle = '#ff9ad8'; ctx.fillRect(mx, my + 25, mw * k, 2); }
    ctx.restore();
  }
  drawShouts(ctx, L) {
    if (!this.shouts.length || !this.g.R) return;
    const R = this.g.R, o = {};
    for (const s of this.shouts) {
      const a = s.a; if (a.removed) continue;
      if (!R.project(a.x, a.y + (a.h || 1.8) + 0.4, a.z, L.W, L.H, o)) continue;
      if (o.y > L.viewBot - 10 || o.y < L.viewTop) continue;
      const k = clamp(s.t / 0.15, 0, 1) * clamp((1.8 - s.t) / 0.3, 0, 1);
      ctx.save(); ctx.globalAlpha = k; ctx.font = `600 11px ${FONT_UI}`;
      const w = ctx.measureText(s.text).width + 14;
      ctx.fillStyle = 'rgba(255,255,255,0.94)'; burnsRR(ctx, o.x - w / 2, o.y - 22 - s.t * 6, w, 18, 8); ctx.fill();
      ctx.fillStyle = '#1a1024'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.text, o.x, o.y - 13 - s.t * 6);
      ctx.restore();
    }
  }
  drawCenter(ctx, L) {
    const W = L.W, cy = (L.viewTop + L.viewBot) / 2;
    // section banner (top of the 3D view)
    const bn = this.banner;
    if (bn && this.phase === 'play') {
      const a = clamp(bn.t / 0.25, 0, 1) * clamp((bn.dur - bn.t) / 0.4, 0, 1), y = L.viewTop + (L.port ? 26 : 22);
      ctx.save(); ctx.globalAlpha = a;
      const gr = ctx.createLinearGradient(0, y - 20, 0, y + 26); gr.addColorStop(0, 'rgba(20,8,36,0)'); gr.addColorStop(0.5, 'rgba(20,8,36,0.6)'); gr.addColorStop(1, 'rgba(20,8,36,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, y - 20, W, 46);
      BurnsUI.text(ctx, bn.title, W / 2 + (1 - Math.min(1, bn.t / 0.25)) * 30, y, Math.min(24, W / 18), bn.col, { glow: bn.col });
      BurnsUI.text(ctx, bn.sub, W / 2, y + 19, 11, '#ffffff', { ui: true });
      ctx.restore();
    }
    // big centre message (judgements, countdown)
    const b = this.big;
    if (b) {
      const k = b.t / b.dur, a = clamp(b.t / 0.08, 0, 1) * clamp((b.dur - b.t) / 0.25, 0, 1), sc = b.count ? 1.4 - Math.min(0.4, b.t * 2) : 1 + Math.max(0, 0.25 - b.t) * 1.2;
      ctx.save(); ctx.globalAlpha = a;
      BurnsUI.text(ctx, b.title, W / 2, cy + 4 - k * 6, Math.min(b.count ? 56 : 30, W / 12) * sc, b.col, { glow: b.col });
      if (b.sub) BurnsUI.text(ctx, b.sub, W / 2, cy + 30, 11, '#ffffff', { ui: true });
      ctx.restore();
    }
  }
  drawIntro(ctx, L) {
    const W = L.W, H = L.H, a = clamp((this.rt - 0.35) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const port = L.port, cy = L.introY;
    BurnsUI.text(ctx, 'LIVE SET', W / 2, cy, 12, '#ff9ad8', { ui: true });
    BurnsUI.text(ctx, this.title, W / 2, cy + 24, Math.min(26, W / 16), '#ffffff', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, `${this.bpm} BPM · ${this.genre} · ${['EASY', 'NORMAL', 'HARD'][Math.round(this.diff * 2)]}`, W / 2, cy + 46, 11, '#ffe24a', { ui: true });
    if (!this.introT) {
      const B = L.startBtn, pulse = 1 + Math.sin(this.rt * 5) * 0.03;
      ctx.save(); ctx.translate(B.x + B.w / 2, B.y + B.h / 2); ctx.scale(pulse, pulse);
      const bg = ctx.createLinearGradient(0, -B.h / 2, 0, B.h / 2); bg.addColorStop(0, '#ff6ae0'); bg.addColorStop(1, '#b0208a');
      ctx.fillStyle = bg; ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 18; burnsRR(ctx, -B.w / 2, -B.h / 2, B.w, B.h, 22); ctx.fill(); ctx.shadowBlur = 0;
      BurnsUI.text(ctx, '▶ DROP IN', 0, 1, 16, '#ffffff');
      ctx.restore();
      if (!port && L.viewBot - L.viewTop < 150) { /* tight landscape: tips sit on the panel labels */ }
      else BurnsUI.text(ctx, 'Pads on the beat · beatmatch · crossfade · hold the filter · DROP', W / 2, B.y + B.h + 18, 10, 'rgba(255,255,255,0.8)', { ui: true });
    }
    ctx.restore();
  }
  drawResults(ctx, L) {
    const r = this.result; if (!r) return;
    const W = L.W, H = L.H, k = clamp(this.resT / 0.5, 0, 1), port = L.port;
    ctx.save();
    ctx.fillStyle = `rgba(8,4,18,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W - 32, 420), ph = port ? 330 : Math.min(H - 30, 300), px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.globalAlpha = k; ctx.translate(0, (1 - easeOut(k)) * 30);
    BurnsUIKit.panel(ctx, px, py, pw, ph);
    BurnsUI.text(ctx, r.forfeit ? 'SET ENDED EARLY' : 'SET COMPLETE', W / 2, py + 24, 13, '#ff9ad8', { ui: true });
    BurnsUI.text(ctx, this.title, W / 2, py + 46, Math.min(18, pw / 16), '#ffffff');
    const gk = clamp((this.resT - 0.35) / 0.35, 0, 1), gcol = BurnsDJ.gradeCol[r.grade];
    const gs = (port ? 92 : 78) * (1 + (1 - easeOut(gk)) * 0.8);
    ctx.save(); ctx.globalAlpha = k * gk;
    BurnsUI.text(ctx, r.grade, W / 2, py + (port ? 116 : 104), gs, gcol, { glow: gcol, sw: 8 });
    ctx.restore();
    const rows = [['PERFECTS', String(r.perfects)], ['MAX COMBO', String(r.maxCombo)], ['CROWD PEAK', Math.round(r.crowdPeak * 100) + '%'], ['ACCURACY', Math.round(r.accuracy * 100) + '%']];
    const ry = py + (port ? 176 : 156), cw = (pw - 30) / 2;
    rows.forEach((row, i) => {
      const x = px + 15 + (i % 2) * cw, y = ry + Math.floor(i / 2) * 40;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; burnsRR(ctx, x + 4, y, cw - 8, 34, 10); ctx.fill();
      BurnsUI.text(ctx, row[0], x + cw / 2, y + 10, 8, 'rgba(255,255,255,0.6)', { stroke: false, ui: true });
      BurnsUI.text(ctx, row[1], x + cw / 2, y + 24, 14, '#ffffff', { stroke: false });
    });
    if (!this.quote) { const Q = (this.o.quotes && this.o.quotes[r.grade]) || BURNS_DJ_QUOTES[r.grade]; this.quote = Array.isArray(Q) ? Q[Math.floor(this.rng() * Q.length)] : String(Q); }
    ctx.font = `600 12px ${FONT_UI}`;
    const ql = BurnsUI.wrap(ctx, '“' + this.quote + '”', pw - 40).slice(0, 2);
    ql.forEach((l, i) => BurnsUI.text(ctx, l, W / 2, ry + 92 + i * 16, 12, '#ffd0f4', { ui: true, stroke: false }));
    if (this.resT > 1.1) BurnsUI.text(ctx, 'TAP TO CONTINUE', W / 2, py + ph - 16 + Math.sin(this.rt * 4) * 2, 11, '#ffd84a');
    ctx.restore();
  }
  drawPause(ctx, L) {
    const W = L.W, H = L.H;
    ctx.save();
    ctx.fillStyle = 'rgba(6,3,14,0.72)'; ctx.fillRect(0, 0, W, H);
    BurnsUIKit.title(ctx, 'PAUSED', W / 2, L.menu[0].y - 34, 24);
    ['RESUME', 'RESTART SET', 'LEAVE THE BOOTH'].forEach((label, i) => {
      const b = L.menu[i], foc = i === this.pauseSel;
      const bg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); bg.addColorStop(0, i === 0 ? '#ff6ae0' : '#3a2a5a'); bg.addColorStop(1, i === 0 ? '#b0208a' : '#1e1430');
      ctx.fillStyle = bg; burnsRR(ctx, b.x, b.y, b.w, b.h, 20); ctx.fill();
      ctx.strokeStyle = foc ? '#ffd84a' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = foc ? 2.5 : 1.2; ctx.stroke();
      BurnsUI.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 1, 14, '#ffffff');
    });
    ctx.restore();
  }
}

/* test / debug access (the build is one IIFE) */
try { if (window.BRADY_BURNS) window.BRADY_BURNS.BurnsDJ = BurnsDJ; } catch (e) { /* ignore */ }
