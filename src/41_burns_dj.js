/* ============================================================
   BRADY GOES TO BURNING MAN — BurnsDJ: the shared DJ-decks minigame (two decks and a mixer)
   ------------------------------------------------------------
   BurnsDJ.open(g, { title, bpm, genre, difficulty, duration, crowd, onDone(result) })
     g           the running BurnsPlayScene
     title       set name shown on the decks ('LIVE ON EL PULPO')
     bpm         the tempo asked for: deck A starts on the dance track closest to it (116..128 today)
     genre       'house' | 'techno' | 'disco' | 'trance' | 'melodic' | 'breaks' | 'bass' (picks deck A's record)
     difficulty  1..3 (1 easy, 2 normal, 3 hard), 0..1 (fractions), or 'easy' | 'normal' | 'hard'
     duration    seconds asked for; under 70 the set is two mixes, 70 or more three (a set runs ~2-3 minutes)
     crowd       optional: a number (how many dancers, or 0..1 = starting crowd energy), an array of actors,
                 or {x, z, r} (where the crowd stands). Default: friendly actors in front of the booth,
                 topped up with temporary dancers.
     onDone(r)   r = { score 0..1, grade 'S'|'A'|'B'|'C'|'D', crowdPeak 0..1, perfects, greats, oks, misses,
                       maxCombo, accuracy, forfeit, title, bpm, mixes, cleanMixes, trainwrecks }
                 (perfects..misses count the judged moments of the set: each pick, cue, lock, blend and
                 party phrase; maxCombo = the longest run without a miss)
   Optional extras: booth {x, y, z, yaw}, exclude [actor ids], intro: false (skip the title card), deck3d
   (true/false: a 3D DJ table under Brady's hands; default: only when nothing is built in front of him),
   music (a dance-track id for deck A, e.g. 'burns_w6'), deckA {name, artist} (deck A's label),
   quotes {S, A, B, C, D}, tutorial (true: walk through every step even if the player has seen it).
   BurnsDJ.isOpen(g) tells whether a set is running; BurnsDJ.session is the live set.
   onDone fires after the player dismisses the results card (or leaves the booth from the pause menu:
   forfeit = true). It may open another set straight away.
   Tests: BurnsDJ.session.autoplay(q 0..1) plays the set by itself (1 = expert, 0.5 = sloppy, 0 = idle).

   How a set plays (real DJing, simplified for two thumbs). Both decks are real music: the decks run two
   house tracks from 41_burns_music.js at once, each at its own tempo, through its own channel
   (upfader, LOW kill) into one master filter.
     1 PICK      three records in the crate (name, BPM, key, energy). The crowd shows what it wants
                 (more energy / a breather / keep it rolling); close BPM and a matching key help.
     2 CUE       press PLAY on the free deck on the 1 of a phrase (the phrase counter shows bars 1-8).
                 It plays in Brady's "headphones": quietly to him, not to the crowd.
     3 MATCH     move that deck's pitch fader until its kicks stop sliding against the live deck's, then
                 nudge its jog wheel until they land together. Close enough snaps and LOCKS.
     4 BLEND     bring the new deck's fader up and the old one down across a phrase. Locked + smooth =
                 a great mix; unlocked = a trainwreck. LOW kills make a bass swap.
     5 PARTY     a phrase on the new record: one-shot pads (HORN, HEY, ROLL, SWEEP), LOOP, the FILTER.
                 At musical moments (into the 1, at the end of a phrase) they lift the crowd; spam annoys it.
   Then the next pick, two or three mixes in all, then the results card. Nothing ever waits forever:
   fumbled steps get help (auto-pick, auto-cue, auto-nudge, the engineer blends) and the set rolls on.
   Easy: wide windows, SYNC button, quick help. Hard: tight windows, no SYNC, help comes late.
   Keys (desktop): 1 2 3 pick · Space PLAY · Up/Down pitch · Left/Right nudge · W/S fader A · I/K fader B ·
   Z / M LOW kill A / B · C V B N pads · X loop (hold = half bar) · E / R hold filter · Y sync · P/Esc pause.

   While a set runs the world is paused (it's a modal minigame): only the crowd, particles, lights and
   lasers animate. The scene's update, camera and HUD overlay are wrapped on the instance and restored
   when the set closes; the world's music comes back.
   ============================================================ */

// the records the decks know: the game's own house tracks (41_burns_music.js). BPM and key are read from the track.
// energy 1..5, vibe: a short tag for the crate card. All names are invented.
const BURNS_DJ_TRACKS = [
  { id: 'bm_soundcamp', bpm: 126, genre: 'house', name: 'Esplanade Peak Hour', artist: 'The Lamplight Choir', energy: 4, vibe: 'chunky tech house' },
  { id: 'bm_artcar', bpm: 126, genre: 'techno', name: 'Octopus Ink (Fire Edit)', artist: 'Tentacle Theory', energy: 4, vibe: 'hot & percussive' },
  { id: 'bm_hell', bpm: 126, genre: 'techno', name: 'Running on Fumes', artist: 'Moop Patrol', energy: 4, vibe: 'dark & metallic' },
  { id: 'bm_citynight', bpm: 124, genre: 'house', name: 'Neon Esplanade', artist: 'Gate Road Kids', energy: 3, vibe: 'deep & rolling' },
  { id: 'bm_deep', bpm: 124, genre: 'techno', name: 'Whiteout (Extended)', artist: 'Dust Devil Collective', energy: 3, vibe: 'dubby & hypnotic' },
  { id: 'bm_costume', bpm: 124, genre: 'disco', name: 'Sequins & Dust', artist: 'Sequin Storm', energy: 3, vibe: 'filtered disco' },
  { id: 'bm_skydive', bpm: 124, genre: 'trance', name: 'Freefall', artist: 'The Early Risers Club', energy: 3, vibe: 'airy progressive' },
  { id: 'bm_rootnight', bpm: 123, genre: 'house', name: 'Root Society After Dark', artist: 'Mycelium Sound System', energy: 3, vibe: 'deeper & driving' },
  { id: 'bm_pavilion', bpm: 124, genre: 'melodic', name: 'The Approach', artist: 'Night Shift Pavilion', energy: 3, vibe: 'building tension' },
  { id: 'bm_sunrise', bpm: 122, genre: 'melodic', name: 'First Light', artist: 'Heart Car Hotline', energy: 3, vibe: 'warm & emotional' },
  { id: 'bm_rhythm', bpm: 122, genre: 'house', name: 'Bamboo Floor', artist: 'Sub Lima', energy: 3, vibe: 'marimba & hand drums' },
  { id: 'bm_nocamp', bpm: 122, genre: 'house', name: 'Fire Circle', artist: 'Ember Hand Drummers', energy: 3, vibe: 'tribal & warm' },
  { id: 'bm_cityday', bpm: 122, genre: 'house', name: 'Dust & Daylight', artist: 'The Disco Sherpas', energy: 2, vibe: 'sunlit deep house' },
  { id: 'bm_boss', bpm: 126, genre: 'techno', name: 'Showdown', artist: 'Lockjaw Unit', energy: 4, vibe: 'tense & driving' },
  { id: 'bm_burn', bpm: 124, genre: 'melodic', name: 'The Burn', artist: 'Effigy Orchestra', energy: 4, vibe: 'euphoric release' },
  { id: 'bm_man', bpm: 128, genre: 'bass', name: 'Effigy Stomp', artist: 'Wooden Feelings', energy: 5, vibe: 'dark & heavy' },
  { id: 'bm_chase', bpm: 128, genre: 'breaks', name: 'Lights in the Mirror', artist: 'Whirlwind Kevin', energy: 5, vibe: 'urgent acid' },
  { id: 'bm_giant', bpm: 128, genre: 'techno', name: 'Giant', artist: 'Tentacle Theory', energy: 5, vibe: 'peak-time pressure' },
  { id: 'bm_title', bpm: 120, genre: 'disco', name: 'Golden Hour', artist: 'Esplanade Kids', energy: 2, vibe: 'golden & hopeful' },
  { id: 'bm_root', bpm: 120, genre: 'melodic', name: 'Root Society', artist: 'The Lamplight Choir', energy: 2, vibe: 'organic & homey' },
  { id: 'bm_line', bpm: 120, genre: 'house', name: 'Gate Road Idle', artist: 'Will Call Waiting', energy: 2, vibe: 'patient & dusty' },
  { id: 'bm_costco', bpm: 120, genre: 'house', name: 'Bulk Aisle Soul', artist: 'The Sample Tray Trio', energy: 2, vibe: 'jazzy & playful' },
  { id: 'bm_results', bpm: 118, genre: 'house', name: 'Afterglow', artist: 'Soft Landing', energy: 2, vibe: 'laid-back & happy' },
  { id: 'bm_workshops', bpm: 118, genre: 'house', name: 'Contact Improv', artist: 'Curious Hands', energy: 2, vibe: 'light & curious' },
  { id: 'bm_dome', bpm: 116, genre: 'house', name: 'Velvet Dome', artist: 'Slow Burners', energy: 1, vibe: 'slow & sensual' },
  { id: 'bm_exodus', bpm: 116, genre: 'house', name: 'Exodus', artist: 'Sunrise Highway', energy: 1, vibe: 'balearic & sleepy' }
];
// Camelot wheel numbers (A = minor, B = major); modes count as their minor
const BURNS_DJ_CAMELOT = {
  m: { 'G#': 1, Ab: 1, 'D#': 2, Eb: 2, 'A#': 3, Bb: 3, F: 4, C: 5, G: 6, D: 7, A: 8, E: 9, B: 10, 'F#': 11, Gb: 11, 'C#': 12, Db: 12 },
  M: { B: 1, Cb: 1, 'F#': 2, Gb: 2, Db: 3, 'C#': 3, Ab: 4, 'G#': 4, Eb: 5, 'D#': 5, Bb: 6, 'A#': 6, F: 7, C: 8, G: 9, D: 10, A: 11, E: 12 }
};
const BURNS_DJ_PADS = [
  { id: 'horn', label: 'HORN', col: '#ffb02a', sub: 'use sparingly' },
  { id: 'hey', label: 'HEY!', col: '#ff4fd8', sub: 'vocal shout' },
  { id: 'roll', label: 'ROLL', col: '#7aff5a', sub: 'into the 1' },
  { id: 'sweep', label: 'SWEEP', col: '#38f2ff', sub: 'into the 1' }
];
const BURNS_DJ_JUDGE = { perfect: { v: 1, col: '#ffe24a', txt: 'PERFECT' }, great: { v: 0.8, col: '#38f2ff', txt: 'GREAT' }, ok: { v: 0.55, col: '#ffffff', txt: 'OK' }, miss: { v: 0.25, col: '#ff3b5c', txt: 'MISS' } };
const BURNS_DJ_SHOUT_UP = ['WOOO!', 'THIS SLAPS!', 'BASS FACE!', 'ONE MORE!', 'I LOVE YOU, STRANGER!', 'MY TOTEM IS SHAKING!', 'HANDS UP!', 'YESSS!', 'WHO IS THIS?!', 'WHAT A BLEND!'];
const BURNS_DJ_SHOUT_DOWN = ['Is the DJ okay?', 'Boooo!', '*checks phone*', 'My kombucha has more bass.', 'Trainwreck!', 'Was that on purpose?', 'Two songs at once?!'];
const BURNS_DJ_QUOTES = {
  S: ['LEGENDARY. The playa will talk about this one.', 'Somebody call the Temple, that set was spiritual.', 'Every blend locked. The dust is dancing on its own.'],
  A: ['Huge set! The crowd wants more.', 'That mix was butter. Playa butter.', 'Strangers are hugging. Mission accomplished.'],
  B: ['Solid set. Feet are moving.', 'Good blends, a couple of bumps.', 'The crowd approves. Mostly.'],
  C: ['Some people danced. Some people left for grilled cheese.', 'It was... a set.', 'Nice hat, though.'],
  D: ['The crowd went to find a different camp.', 'That was a trainwreck. A beautiful, dusty trainwreck.', 'Even the porta-potties booed.']
};
const BURNS_DJ_CUE = 0.3;      // how loud the headphone cue sounds (Brady hears it, the crowd doesn't)
const BURNS_DJ_TRIM = 0.86;    // the decks' master trim: two full decks sit about where one world track does + 3 dB

/* ---------- custom animations: Brady at the decks + the crowd reacting ---------- */
(() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  // k: { bpm, pump 0..1 (fist pump), cue 0..1 (hand on the headphones), rub 0..1 (working a jog), lean }
  BURNS_ANIMS.burnsDJBrady = (P, t, k) => {
    k = k || {};
    const bpm = k.bpm || 124, b = t * bpm / 60 * TAU, beatK = Math.pow(Math.max(0, Math.cos(b)), 3), s2 = Math.sin(b * 0.5);
    const pump = clamp(k.pump || 0, 0, 1), cue = clamp(k.cue || 0, 0, 1), rub = clamp(k.rub || 0, 0, 1);
    const scr = Math.sin(t * 22) * 0.25 * rub;
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
  // k: { bpm, e 0..1 energy, st 0..3 variant, cheer 0..1, boo 0..1 }
  BURNS_ANIMS.burnsDJCrowd = (P, t, k) => {
    k = k || {};
    const bpm = k.bpm || 124, boo = clamp(k.boo || 0, 0, 1), e = clamp(k.e === undefined ? 0.5 : k.e, 0, 1) * (1 - boo * 0.8), st = (k.st || 0) % 4, ch = clamp(k.cheer || 0, 0, 1);
    const b = t * bpm / 60 * TAU, beatK = Math.pow(Math.max(0, Math.cos(b)), 2), s = Math.sin(b), s2 = Math.sin(b * 0.5), c2 = Math.cos(b * 0.5);
    const amp = 0.25 + e * 0.75, hands = clamp((e - 0.45) * 2.2 + ch, 0, 1), jump = clamp((e - 0.72) * 3.2 + ch, 0, 1);
    S(P, B.THIGH_L, -0.1 - beatK * 0.25 * amp); S(P, B.SHIN_L, 0.2 + beatK * 0.45 * amp);
    S(P, B.THIGH_R, -0.1 - beatK * 0.25 * amp); S(P, B.SHIN_R, 0.2 + beatK * 0.45 * amp);
    S(P, B.HIPS, 0, s2 * 0.22 * amp, s2 * 0.06 * amp);
    S(P, B.CHEST, 0.06 + beatK * 0.08 * amp, -s2 * 0.18 * amp, -s2 * 0.05);
    S(P, B.HEAD, 0.05 + beatK * 0.22 * amp - hands * 0.25 + boo * 0.3, s2 * 0.15 * amp + boo * Math.sin(t * 9) * 0.25);
    const lowL = -0.9 + s * 0.45 * amp, lowR = -0.9 - s * 0.45 * amp;
    const upL = -2.95 + s2 * 0.25, upR = -2.95 - s2 * 0.25;
    const handsL = st === 1 ? clamp(hands * 1.5, 0, 1) : hands, handsR = st === 2 ? clamp(hands * 1.6, 0, 1) : st === 3 ? hands * 0.6 : hands;
    // booing: one hand covers an ear
    S(P, B.UARM_L, lerp(lerp(lowL, upL, handsL), -0.35, boo), 0, lerp(lerp(0.25, 0.35 + c2 * 0.25, handsL), 1.3, boo));
    S(P, B.FARM_L, lerp(lerp(-1.3, -0.25, handsL), -2.3, boo));
    S(P, B.UARM_R, lerp(lowR, upR, handsR), 0, lerp(-0.25, -0.35 - c2 * 0.25, handsR));
    S(P, B.FARM_R, lerp(-1.3, -0.25, handsR));
    const hop = jump * Math.max(0, Math.sin(((t * bpm / 60) % 1) * Math.PI));
    P.y = -beatK * 0.07 * amp + hop * (0.24 + ch * 0.18);
    S(P, B.HAIR, beatK * 0.3 + hop * 0.4);
    P.face = (e > 0.7 || ch > 0.3) ? 3 : boo > 0.5 ? 1 : 0;
  };
})();

/* ---------- the module ---------- */
const BurnsDJ = {
  session: null,
  tracks: BURNS_DJ_TRACKS,
  // 1..3 integers (1 easy, 2 normal, 3 hard), fractions 0..1, or names
  normDiff(d) {
    const N = { easy: 0, normal: 0.5, medium: 0.5, hard: 1, expert: 1 };
    if (typeof d === 'string') return N[d.toLowerCase()] !== undefined ? N[d.toLowerCase()] : 0.5;
    if (typeof d !== 'number' || !isFinite(d)) return 0.5;
    if (d >= 1 && Math.abs(d - Math.round(d)) < 1e-9) return clamp((d - 1) / 2, 0, 1);
    if (d < 1) return clamp(d, 0, 1);
    return clamp((d - 1) / 2, 0, 1);
  },
  // the records available in this build, with BPM, key and Camelot code read from the tracks themselves
  library() {
    if (this._lib) return this._lib;
    const H = typeof BurnsHouse !== 'undefined' ? BurnsHouse : null, out = [];
    for (const t of BURNS_DJ_TRACKS) {
      const inf = H && H.info(t.id); if (H && !inf) continue;
      const key = (inf && inf.key) || 'A minor';
      out.push(Object.assign({}, t, { bpm: (inf && inf.bpm) || t.bpm, key, cam: this.camelot(key) }));
    }
    this._lib = out.length ? out : BURNS_DJ_TRACKS.map(t => Object.assign({ key: 'A minor', cam: '8A' }, t));
    return this._lib;
  },
  track(id) { return this.library().find(t => t.id === id) || null; },
  // 'F# minor' -> '11A', 'Db major' -> '3B', 'E phrygian' -> '9A'
  camelot(key) {
    const r = /^([A-G])([#b]?)\s*(\w*)/.exec(String(key || '')); if (!r) return '8A';
    const root = r[1] + r[2], maj = /^maj/i.test(r[3]) || /^(ionian|lydian|mixolydian)$/i.test(r[3]);
    const n = (maj ? BURNS_DJ_CAMELOT.M : BURNS_DJ_CAMELOT.m)[root] || 8;
    return n + (maj ? 'B' : 'A');
  },
  // 2 = fits (same, relative major/minor, one step on the wheel), 1 = two steps, 0 = clash
  keyFit(a, b) {
    const pa = /^(\d+)([AB])$/.exec(a), pb = /^(\d+)([AB])$/.exec(b); if (!pa || !pb) return 1;
    const na = +pa[1], nb = +pb[1], d = Math.min((na - nb + 12) % 12, (nb - na + 12) % 12);
    if (d === 0) return 2;
    if (pa[2] === pb[2]) return d === 1 ? 2 : d === 2 ? 1 : 0;
    return 0;
  },
  // two records at the same tempo (closest to the request), genre first (kept for older callers)
  pickTracks(bpm, genre, music) {
    bpm = clamp(+bpm || 124, 80, 170);
    if (music && typeof BurnsHouse !== 'undefined') music = BurnsHouse.resolve(music) || music;
    const L = this.library();
    const own = music && L.find(t => t.id === music);
    if (own) { const mates = L.filter(t => t.bpm === own.bpm && t !== own); return [own, mates.find(t => t.genre === own.genre) || mates[0] || own]; }
    const tempos = Array.from(new Set(L.map(t => t.bpm)));
    tempos.sort((a, b) => (Math.abs(a - bpm) + (L.filter(t => t.bpm === a).length < 2 ? 4 : 0)) - (Math.abs(b - bpm) + (L.filter(t => t.bpm === b).length < 2 ? 4 : 0)));
    const T = tempos[0], at = L.filter(t => t.bpm === T);
    const g = (genre || '').toLowerCase();
    at.sort((a, b) => (b.genre === g ? 1 : 0) - (a.genre === g ? 1 : 0));
    return [at[0], at[1] || at[0]];
  },
  // where each kick falls in a track (intro, then the loop repeating): kicks.at(step) -> 0/1, cue = the
  // start of the first section with a kick (a record is cued there: beat 1 of a phrase, drums in)
  kicks(id) {
    const C = this._kicks || (this._kicks = {});
    if (C[id]) return C[id];
    const H = typeof BurnsHouse !== 'undefined' ? BurnsHouse : null, T = H && H.TRK[id];
    if (!T) return (C[id] = { at: s => (s % 4 === 0 ? 1 : 0), cue: 0 });
    const intro = T.introSteps, loop = T.loopSteps, n = intro + loop, arr = new Uint8Array(n);
    let cue = -1;
    for (let i = 0; i < n; i++) {
      const at = H.locate(id, i), S = at.S;
      if (S.fx.indexOf('gap') >= 0 && at.s >= S.steps - 2) continue;
      for (const layer in S.on) {
        if (layer.replace(/\d+$/, '') !== 'kick') continue;
        const pat = T.D.drums[layer], c = pat[at.s % pat.length];
        if (c !== '.' && c !== '-') { arr[i] = 1; if (cue < 0) cue = i - at.s; break; }
      }
    }
    const at = s => { s = Math.max(0, Math.floor(s)); return arr[s < n ? s : intro + (s - intro) % loop]; };
    return (C[id] = { at, cue: Math.max(0, cue) });
  },
  isOpen(g) { return !!(this.session && this.session.active && (!g || this.session.g === g)); },
  open(g, o) {
    o = o || {};
    if (!g || !g.player || !g.world) { if (o.onDone) try { o.onDone(BurnsDJ.blankResult(true)); } catch (e) { /* ignore */ } return null; }
    if (this.session && this.session.active) {
      if (this.session.g === g) return this.session;
      this.session.detach();
      if (this.session.mix) this.session.mix.destroy();
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
  blankResult(forfeit) { return { score: 0, grade: 'D', crowdPeak: 0, perfects: 0, greats: 0, oks: 0, misses: 0, maxCombo: 0, accuracy: 0, forfeit: !!forfeit, mixes: 0, cleanMixes: 0, trainwrecks: 0 }; },
  grade(score) { return score >= 0.9 ? 'S' : score >= 0.78 ? 'A' : score >= 0.62 ? 'B' : score >= 0.42 ? 'C' : 'D'; },
  gradeCol: { S: '#ffd84a', A: '#ff4fd8', B: '#38f2ff', C: '#7aff5a', D: '#9a8aa8' },
  label(v) { return v >= 0.95 ? 'perfect' : v >= 0.75 ? 'great' : v >= 0.45 ? 'ok' : 'miss'; }
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

/* ============================================================
   THE AUDIO: two decks and a mixer on Sound's audio context.
   deck (BurnsHouse step engine, own tempo) -> channel in -> LOW shelf -> upfader --+
                                    reverb send -> follows the fader -> music reverb |
                            echo send -> own tempo-synced echo -> back into the channel |
   sum -> high-pass -> low-pass (the FILTER) -> trim -> Sound's music bus (volume, compressor, master)
   One-shot pads go straight to the trim. With no audio (never unlocked, or audio off) the decks still
   keep time on a performance.now() clock, so the game plays the same, silently.
   ============================================================ */
class BurnsDJDeck {
  constructor(M, side) {
    this.M = M; this.side = side; this.trk = null; this.T = null; this.inst = null; this.kick = null;
    this.playing = false; this.n = 0; this.next = 0; this.pitch = 0; this.nudge = 0; this.loop = null; this.cueStep = 0; this.corr = 0;
    this.fader = 0; this.low = true; this.cue = false; this.gain = 0; this.meter = 0;
  }
  get native() { return this.T ? this.T.bpm : (this.trk ? this.trk.bpm : 124); }
  bpm() { return this.native * (1 + this.pitch); }                    // what the BPM display shows
  sd() { return 60 / (this.native * (1 + this.pitch) * (1 + this.nudge) * 4); }   // seconds per 16th right now
  load(trk) {
    this.unload();
    this.trk = trk; this.T = (typeof BurnsHouse !== 'undefined' && BurnsHouse.TRK[trk.id]) || null;
    const K = BurnsDJ.kicks(trk.id); this.kick = K; this.cueStep = K.cue;
    this.pitch = 0; this.nudge = 0; this.loop = null; this.n = 0; this.corr = 0; this.playing = false;
  }
  unload() { this.stopAudio(); this.trk = null; this.T = null; this.playing = false; this.loop = null; this.nudge = 0; this.corr = 0; }
  // play: step 0 (the cue point) sounds at time t0 (t0 may be in the past: the record is already that far in)
  start(t0) {
    if (!this.trk) return;
    const now = this.M.now(), sd = this.sd();
    let n = 0; if (t0 < now + 0.015) n = Math.ceil((now + 0.015 - t0) / sd);
    this.n = n; this.next = t0 + n * sd; this.playing = true; this.corr = 0;
    this.openAudio();
  }
  stop() { this.playing = false; this.stopAudio(); }
  openAudio() {
    const M = this.M; if (!M.ctx || !this.T || this.inst || !M.alive) return;
    const ch = M.ch[this.side];
    try { this.inst = BurnsHouse.engine.open(this.T, { ctx: M.ctx, out: ch.in, rev: ch.rev, dly: ch.dIn }); } catch (e) { this.inst = null; }
    try { ch.dl.delayTime.setValueAtTime(Math.min(1.5, ((this.T.D && this.T.D.dtb) || 0.75) * 60 / this.bpm()), M.ctx.currentTime); } catch (e) { /* ignore */ }
  }
  stopAudio() {
    const I = this.inst; if (!I) return;
    this.inst = null;
    try { BurnsHouse.engine.close(I, true); } catch (e) { /* ignore */ }
    setTimeout(() => { for (const nd of I.nodes || []) { try { nd.disconnect(); } catch (e) { /* ignore */ } } }, 300);
  }
  stepIdx(n) { const L = this.loop; return L && n >= L.from ? L.from + ((n - L.from) % L.len + L.len) % L.len : n; }
  // schedule every 16th up to `until`
  pump(until) {
    if (!this.playing) return;
    let guard = 0;
    while (this.next < until && guard++ < 64) {
      const sd = this.sd();
      if (this.inst) { try { BurnsHouse.engine.step(this.inst, this.cueStep + this.stepIdx(this.n), this.next, sd); } catch (e) { /* never break the clock */ } }
      let c = 0;
      if (this.corr) { c = clamp(this.corr, -0.006, 0.006); this.corr -= c; if (Math.abs(this.corr) < 1e-6) this.corr = 0; }
      this.next += sd - c; this.n++;
    }
  }
  // beats since this record's cue point, at time t (counting through loops: the record "slips" under a loop)
  beatAt(t) { return (this.n - (this.next - t) / this.sd()) / 4; }
  timeOfStep(s) { return this.next + (s - this.n) * this.sd(); }
  kickAt(n) { return this.kick ? this.kick.at(this.cueStep + this.stepIdx(n)) : (n % 4 === 0 ? 1 : 0); }
}

class BurnsDJMixer {
  constructor(S) {
    this.S = S; this.alive = true; this.filter = 0; this.t0p = performance.now(); this.held = false; this.ch = [];
    let io = null;
    try { if (typeof Sound !== 'undefined' && Sound.unlock) Sound.unlock(); io = typeof Sound !== 'undefined' && Sound.musicBus ? Sound.musicBus() : null; } catch (e) { io = null; }
    this.io = io && io.ctx && io.ctx.state !== 'closed' ? io : null;
    this.ctx = this.io ? this.io.ctx : null;
    this.decks = [new BurnsDJDeck(this, 0), new BurnsDJDeck(this, 1)];
    this.nodes = [];
    if (this.ctx) { try { this.build(); } catch (e) { this.ctx = null; this.io = null; } }
    this.timer = setInterval(() => this.tick(), 25);
  }
  now() { return this.ctx ? this.ctx.currentTime : (performance.now() - this.t0p) / 1000; }
  // what the player hears now (scheduled time minus the output latency)
  heard() { const c = this.ctx; return this.now() - (c ? Math.min(0.2, (c.outputLatency || 0) + (c.baseLatency || 0)) : 0); }
  latency() { const c = this.ctx; return c ? Math.min(0.2, (c.outputLatency || 0) + (c.baseLatency || 0)) : 0; }
  build() {
    const c = this.ctx, io = this.io, nodes = this.nodes;
    const G = v => { const g = c.createGain(); g.gain.value = v; nodes.push(g); return g; };
    const F = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; nodes.push(b); return b; };
    this.trim = G(0); this.trim.connect(io.music);
    this.trim.gain.setTargetAtTime(BURNS_DJ_TRIM, c.currentTime, 0.04);
    this.hp = F('highpass', 12, 0.8); this.lp = F('lowpass', 20000, 0.8);
    this.sum = G(1); this.sum.connect(this.hp); this.hp.connect(this.lp); this.lp.connect(this.trim);
    this.smp = G(1); this.smp.connect(this.trim);
    this.smpRev = G(0.22); this.smp.connect(this.smpRev); this.smpRev.connect(io.rev);
    for (let i = 0; i < 2; i++) {
      const ch = { in: G(1), low: F('lowshelf', 220, 0.7), fad: G(0), rev: G(1), revF: G(0), dIn: G(1), dl: c.createDelay(2), dLp: F('lowpass', 2300, 0.5), dFb: G(0.34) };
      nodes.push(ch.dl);
      ch.low.gain.value = 0;
      ch.in.connect(ch.low); ch.low.connect(ch.fad); ch.fad.connect(this.sum);
      ch.rev.connect(ch.revF); ch.revF.connect(io.rev);
      ch.dIn.connect(ch.dl); ch.dl.connect(ch.dLp); ch.dLp.connect(ch.dFb); ch.dFb.connect(ch.dl); ch.dLp.connect(ch.in);
      this.ch.push(ch);
    }
  }
  tick() {
    if (!this.alive) return;
    const S = this.S;
    // the set is gone (scene changed, error): never leave music running
    if (!S || !S.active || (typeof Game !== 'undefined' && Game.scene !== S.g)) { this.destroy(); return; }
    if (this.held) return;
    const until = this.now() + 0.14;
    for (const d of this.decks) d.pump(until);
  }
  // per frame: channel gains from the faders, the cue and the LOW kills; the master filter
  apply() {
    const c = this.ctx;
    for (let i = 0; i < 2; i++) {
      const d = this.decks[i];
      const fg = d.fader <= 0.001 ? 0 : Math.pow(d.fader, 1.5);
      d.gain = d.playing ? Math.max(fg, d.cue ? BURNS_DJ_CUE : 0) : 0;
      d.crowd = d.playing ? fg : 0;     // what the crowd hears from this deck
      if (!c) continue;
      const ch = this.ch[i], now = c.currentTime;
      if (ch._g === undefined || Math.abs(ch._g - d.gain) > 0.002) { ch._g = d.gain; ch.fad.gain.setTargetAtTime(d.gain, now, 0.012); ch.revF.gain.setTargetAtTime(d.gain, now, 0.012); }
      const lg = d.low ? 0 : -30;
      if (ch._l !== lg) { ch._l = lg; ch.low.gain.setTargetAtTime(lg, now, 0.02); }
    }
    if (c) {
      const v = clamp(this.filter, -1, 1), now = c.currentTime;
      if (this._f === undefined || Math.abs(this._f - v) > 0.004) {
        this._f = v;
        const lp = v < 0 ? 20000 * Math.pow(260 / 20000, -v) : 20000, hp = v > 0 ? 12 * Math.pow(3200 / 12, v) : 12, q = 0.8 + Math.abs(v) * 2.4;
        this.lp.frequency.setTargetAtTime(lp, now, 0.03); this.hp.frequency.setTargetAtTime(hp, now, 0.03);
        this.lp.Q.setTargetAtTime(v < 0 ? q : 0.8, now, 0.03); this.hp.Q.setTargetAtTime(v > 0 ? q : 0.8, now, 0.03);
      }
    }
  }
  // pause: silence and unload the voices (no stuck notes); resume shifts the records' clocks past the gap
  hold(on) {
    if (on === this.held || !this.alive) return;
    this.held = on;
    const c = this.ctx;
    if (on) {
      this.heldAt = this.now();
      if (c) this.trim.gain.setTargetAtTime(0, c.currentTime, 0.015);
      for (const d of this.decks) d.stopAudio();
    } else {
      const gap = this.now() - this.heldAt + 0.06;
      for (const d of this.decks) if (d.playing) { d.next += gap; d.openAudio(); }
      if (c) this.trim.gain.setTargetAtTime(BURNS_DJ_TRIM, c.currentTime + 0.05, 0.03);
    }
  }
  // the set is over: fade out, stop every voice, disconnect everything
  destroy() {
    if (!this.alive) return;
    this.alive = false;
    try { clearInterval(this.timer); } catch (e) { /* ignore */ }
    const c = this.ctx;
    for (const d of this.decks) { d.playing = false; d.stopAudio(); }
    for (const v of this.voices || []) { try { v.stop(c.currentTime + 0.1); } catch (e) { /* ignore */ } }
    if (c) {
      try { this.trim.gain.cancelScheduledValues(c.currentTime); this.trim.gain.setTargetAtTime(0, c.currentTime, 0.04); } catch (e) { /* ignore */ }
      const nodes = this.nodes;
      setTimeout(() => { for (const n of nodes) { try { n.disconnect(); } catch (e) { /* ignore */ } } }, 450);
    }
  }
  // one-shot pads, quantised to the live record's grid. Returns the time the pad "lands" (for judging), or null.
  // horn / hey: on the next 8th note. roll / sweep: from the next 16th up to the next bar line (at least a beat).
  pad(id, deck) {
    const now = this.now(), d = deck && deck.playing ? deck : null, sd = d ? d.sd() : 60 / (124 * 4);
    const nStep = d ? Math.ceil((now + 0.03 - d.next) / sd) + d.n : 0;   // the next 16th
    const tStep = s => d ? d.timeOfStep(s) : now + 0.03 + (s - nStep) * sd;
    let s8 = nStep; if (d && s8 % 2) s8++;
    let barEnd = Math.ceil(nStep / 16) * 16; if (barEnd - nStep < 4) barEnd += 16;
    const c = this.ctx, B = c ? BurnsDJSounds.bank(c) : null;
    const play = (buf, t, v, rate) => {
      if (!c || !buf || t < c.currentTime - 0.01) return;
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; if (rate) s.playbackRate.value = rate;
      g.gain.value = v; s.connect(g); g.connect(this.smp); s.start(Math.max(t, c.currentTime));
      s.onended = () => { try { s.disconnect(); g.disconnect(); } catch (e) { /* ignore */ } };
      this.track(s);
    };
    if (id === 'horn') {
      const t = tStep(s8), b = 2 * sd * 4 / 4;   // an 8th = 2 steps
      if (B) { play(B.hornS, t, 0.16); play(B.hornS, t + b, 0.16); play(B.hornL, t + b * 2, 0.17); }
      return t;
    }
    if (id === 'hey') { const t = tStep(s8); if (B) { play(B.hey, t, 0.3); play(B.hey, t + 0.012, 0.12, 0.985); } return t; }
    if (id === 'roll') {
      const n = barEnd - nStep;
      for (let k = 0; k < n; k++) {
        const s = nStep + k, rem = barEnd - s, every = rem > 8 ? 2 : 1;
        if ((s - nStep) % every) continue;
        const v = 0.07 + 0.2 * Math.pow(k / Math.max(1, n - 1), 1.4);
        if (B) { play(B.snr, tStep(s), v); if (rem <= 4) play(B.snr, tStep(s) + sd * 0.5, v * 0.8); }
      }
      return tStep(barEnd);
    }
    if (id === 'sweep') {
      const t0 = tStep(nStep), t1 = tStep(barEnd);
      if (c && B && t1 > t0 + 0.05) {
        const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
        s.buffer = B.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.6;
        bp.frequency.setValueAtTime(350, t0); bp.frequency.exponentialRampToValueAtTime(9000, t1);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t1 - 0.01); g.gain.linearRampToValueAtTime(0, t1 + 0.03);
        s.connect(bp); bp.connect(g); g.connect(this.smp); s.start(t0); s.stop(t1 + 0.06);
        s.onended = () => { try { s.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) { /* ignore */ } };
        this.track(s);
        play(B.crash, t1, 0.06);
      }
      return t1;
    }
    return null;
  }
  track(src) { const V = this.voices || (this.voices = []); if (V.length > 40) this.voices = V.filter(v => !v._done); src.addEventListener('ended', () => { src._done = true; }); this.voices.push(src); }
}

/* the pads' sounds: rendered once per audio context (~60 ms of CPU), all original and gentle */
const BurnsDJSounds = {
  B: typeof WeakMap !== 'undefined' ? new WeakMap() : null,
  bank(ctx) {
    let B = this.B && this.B.get(ctx); if (B) return B;
    const sr = ctx.sampleRate, N = s => Math.floor(sr * s);
    let seed = 0xD1A5; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const biq = (x, type, f, q) => {
      const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
      let b0, b1, b2; if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
      const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x0; y2 = y1; y1 = y0; x[i] = y0; }
      return x;
    };
    const buf = (x, peak) => {
      const n = x.length, b = ctx.createBuffer(2, n, sr); let mx = 1e-9; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(x[i]));
      const k = (peak || 1) / mx, fade = Math.min(n, N(0.01)); for (let i = n - fade; i < n; i++) x[i] *= (n - i) / fade;
      const L = b.getChannelData(0), R = b.getChannelData(1); for (let i = 0; i < n; i++) { L[i] = x[i] * k; R[i] = x[i] * k; }
      return b;
    };
    // the horn: a brassy stack around Bb4 that scoops up into pitch, a little vibrato, softly saturated
    const horn = len => {
      const n = N(len), x = new Float32Array(n), f = 466; let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr, ff = f * (1 - 0.06 * Math.exp(-t / 0.025)) * (1 + 0.004 * Math.sin(t * 2 * Math.PI * 6.5)); ph += ff / sr;
        let v = 0; for (let h = 1; h <= 10; h++) v += Math.sin(2 * Math.PI * ph * h) * Math.pow(0.78, h) / h * (h === 2 ? 1.4 : 1);
        const env = Math.min(1, t / 0.008) * Math.min(1, (len - t) / 0.03);
        x[i] = Math.tanh(1.8 * v * env);
      }
      const bp = biq(Float32Array.from(x), 'bp', 1500, 0.8); for (let i = 0; i < n; i++) x[i] = x[i] * 0.55 + bp[i] * 0.9;
      return buf(x, 0.9);
    };
    B = { hornS: horn(0.17), hornL: horn(0.5) };
    // "hey!": a short glottal buzz through moving vowel formants (eh -> ee), breath at the start
    {
      const n = N(0.34), src = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / sr, f = 215 - 40 * (t / 0.34); ph += f / sr; const p = ph % 1; src[i] = (p < 0.4 ? Math.sin(Math.PI * p / 0.4) : 0) - 0.25; }
      const seg = (f1, f2, f3) => { const a = biq(Float32Array.from(src), 'bp', f1, 6), b = biq(Float32Array.from(src), 'bp', f2, 9), c = biq(Float32Array.from(src), 'bp', f3, 10); const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = a[i] + b[i] * 0.7 + c[i] * 0.35; return o; };
      const eh = seg(580, 1800, 2550), ee = seg(330, 2250, 3000), nz = biq(Float32Array.from({ length: n }, () => r() * 2 - 1), 'bp', 1600, 1.2), x = new Float32Array(n);
      for (let i = 0; i < n; i++) { const t = i / sr, k = clamp((t - 0.1) / 0.14, 0, 1), env = Math.min(1, t / 0.03) * Math.exp(-Math.max(0, t - 0.12) / 0.09); x[i] = (eh[i] * (1 - k) + ee[i] * k) * env + nz[i] * Math.exp(-t / 0.025) * 0.25; }
      B.hey = buf(x, 0.9);
    }
    // a tight snare for the roll
    { const n = N(0.22), x = new Float32Array(n), nz = biq(Float32Array.from({ length: n }, () => r() * 2 - 1), 'hp', 1900, 0.7); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / sr; ph += (190 + 50 * Math.exp(-t / 0.01)) / sr; x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.04) * 0.6 + nz[i] * Math.exp(-t / 0.06) * 0.8; }
      B.snr = buf(x, 1); }
    // a soft crash on the 1 after the sweep
    { const n = N(1.6), x = biq(Float32Array.from({ length: n }, () => r() * 2 - 1), 'hp', 5000, 0.7); for (let i = 0; i < n; i++) x[i] *= Math.exp(-i / sr / 0.45); B.crash = buf(x, 0.8); }
    { const n = N(2), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; B.noise = b; }
    if (this.B) this.B.set(ctx, B);
    return B;
  }
};

/* ============================================================
   THE SET
   ============================================================ */
const BURNS_DJ_W = { pick: 1.5, cue: 2, lock: 3, blend: 4, party: 1.5 };   // how much each judged moment counts
class BurnsDJSession {
  constructor(g, o) {
    this.g = g; this.o = o; this.active = false;
    this.diff = BurnsDJ.normDiff(o.difficulty);
    this.tier = this.diff < 0.3 ? 0 : this.diff < 0.7 ? 1 : 2;
    const tr = BurnsDJ.pickTracks(o.bpm || 124, o.genre, o.music);
    this.firstTrack = Object.assign({}, tr[0], o.deckA || {});
    this.bpm = this.firstTrack.bpm; this.spb = 60 / this.bpm;
    this.title = String(o.title || 'LIVE SET').toUpperCase();
    this.genre = String(o.genre || this.firstTrack.genre || 'house').toUpperCase();
    this.dur = clamp(+o.duration || 60, 30, 150);
    this.nMixes = this.dur >= 70 ? 3 : 2;
    this.seed = hashStr(this.title + ':' + this.bpm + ':' + this.dur + ':' + this.diff);
    this.rng = mulberry32(this.seed);
    let taught = false; try { taught = !!BurnsSave.flag(0, 'djTaught'); } catch (e) { /* no save */ }
    this.teach = o.tutorial === true || (o.tutorial !== false && !taught);
    const p = g.player, b = o.booth || {};
    this.booth = { x: b.x !== undefined ? b.x : p.x, y: b.y !== undefined ? b.y : p.y, z: b.z !== undefined ? b.z : p.z, yaw: b.yaw !== undefined ? b.yaw : p.yaw };
    this.reset();
  }
  /* ---------------- set-up ---------------- */
  reset() {
    const d = this.diff;
    this.phase = 'intro'; this.rt = 0; this.t = 0; this.paused = false; this.pauseSel = 0;
    // how close counts (BPM, ms) and how soon help arrives (seconds / phrases)
    this.tol = { bpm: lerp(0.9, 0.25, d), ms: lerp(75, 22, d), cueMs: lerp(120, 45, d) };
    this.help = { pick: lerp(16, 28, d), cuePhrases: this.tier === 0 ? 1 : this.tier === 1 ? 2 : 3, tempo: lerp(9, 32, d), phase: lerp(4, 24, d), blendPhrases: this.tier === 0 ? 1 : this.tier === 1 ? 2 : 3, dead: this.tier === 2 ? 8 : 4 };
    if (this.teach) { this.help.pick += 14; this.help.tempo += 10; this.help.phase += 6; }
    this.energy = clamp(typeof this.o.crowd === 'number' && this.o.crowd > 0 && this.o.crowd <= 1 ? this.o.crowd : 0.35, 0.05, 0.9);
    this.peak = this.energy; this.eAcc = 0; this.eTime = 0;
    this.judged = []; this.mixN = 0; this.wrecks = 0; this.live = 0; this.lock = false;
    this.step = 'warm'; this.stepT = 0; this.crate = null; this.want = 'up'; this.played = [this.firstTrack.id];
    this.m = this.newMix(); this.party = null; this.autoBlend = null;
    this.wreckT = 0; this.wreckOn = false; this.deadT = 0; this.mudT = 0;
    this.smpLog = []; this.filt = { v: 0, held: false, keys: 0, on: null }; this.loopKey = null;
    this.pops = []; this.big = null; this.shouts = []; this.flashK = 0; this.redK = 0; this.dropK = 0; this.riser = 0; this.co2 = []; this.result = null; this.quote = null;
    this.ptr = new Map(); this.q = []; this.keysDown = {};
    this.lastBeat = -1; this.beatK = 0; this.barK = 0; this.jogSpin = [0, 0]; this.jogV = [0, 0]; this.banner = null; this.timers = []; this.camK = this.camK || 0;
    this.hint = null; this.padK = [0, 0, 0, 0]; this.btnK = {};
  }
  newMix() { return { n: this.mixN || 0, t0: 0, pick: null, cueMiss: 0, cueAuto: false, matchT0: 0, tempoOK: false, tempoHold: 0, assistT: false, assistP: false, sync: false, lockT: 0, blendStart: 0, wreck: 0, swap: false, touched: false, phrasesSinceLock: 0, judged: {} }; }
  /* ---------------- install / uninstall on the scene ---------------- */
  install() {
    const g = this.g, S = this, p = g.player;
    this.active = true;
    this.saved = {
      update: Object.getOwnPropertyDescriptor(g, 'update'), cam: Object.getOwnPropertyDescriptor(g, 'updateCamera'),
      state: g.state, locked: p.locked, anim: p.animOverride, music: (typeof Sound !== 'undefined' && Sound.currentTrack) || null, camFrom: g.camState ? g.camState() : null
    };
    g.update = function (dt) { S.stepFrame(dt); };
    g.updateCamera = function (fdt) { S.camera(fdt); };
    g.state = 'dj'; g.burnsDJ = this;
    if (g.syncHudButtons) g.syncHudButtons();
    Input.setMode('ui'); Input.taps.length = 0;
    if (p.vehicle && p.vehicle.kind === 'bike') p.vehicle.dismount(p);
    if (!p.vehicle) p.teleport(this.booth.x, this.booth.y, this.booth.z, this.booth.yaw);
    p.vx = p.vy = p.vz = 0; p.invT = 0; p.hurtT = 0; p.spinT = 0; p.pound = 0; p.locked = true;
    if (this.o.booth && this.o.booth.yaw !== undefined) p.yaw = this.booth.yaw;
    this.gatherCrowd();
    p.yaw = this.booth.yaw;
    p.ch.play('burnsDJBrady', { bpm: this.bpm }); p.animOverride = null;
    this.fx3d = { djFx: true, update() {}, draw: R => { try { S.draw3d(R); } catch (e) { /* visuals only */ } } };
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
    const cv = Game.canvas;
    this.h = {
      down: e => S.ev('down', e), move: e => S.ev('move', e), up: e => S.ev('up', e), cancel: e => S.ev('up', e),
      kd: e => S.key(e, true), ku: e => S.key(e, false),
      // phone locked / app switched mid-set: pause (silences the decks; resuming carries on where it was)
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
    if (this.mix) { this.mix.destroy(); }
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
    try { burnsMusic(this.saved.music || (this.g.def && this.g.def.music) || null); } catch (e) { /* ignore */ }
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
      list.sort((a, b) => Math.hypot(a.x - bx, a.z - bz) - Math.hypot(b.x - bx, b.z - bz));
      list = list.slice(0, 22);
    }
    if (!(o.booth && o.booth.yaw !== undefined) && list.length >= 3) {
      let sx = 0, sz = 0; for (const a of list) { sx += a.x; sz += a.z; }
      this.booth.yaw = Math.atan2(sx / list.length - bx, sz / list.length - bz);
    }
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
        try {
          const act = g.spawnActor({ type: types[i % types.length], seed: 900 + (i % 9), x, z, y, fixedY: true, yaw: Math.atan2(bx - x, bz - z), behavior: 'idle', chatter: false, noTalk: true, collide: false, ambient: true, djTemp: true });
          temps.push(act);
        } catch (e) { /* ignore */ }
      }
    }
    this.temps = temps;
    this.crowd = list.concat(temps).map((a, i) => ({ a, orig: { k: a.ch.k, yaw: a.yaw }, st: i % 4, jit: (this.rng() - 0.5) * 0.04, cheer: 0, sayT: 1 + this.rng() * 4 }));
    for (const c of this.crowd) c.a.ch.play('burnsDJCrowd', { bpm: this.bpm, e: this.energy, st: c.st, cheer: 0 });
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
    const e = this.energy, t = this.phase === 'play' ? this.t : this.rt, boo = clamp(this.redK * 1.5, 0, 1);
    for (const c of this.crowd) {
      const a = c.a; if (a.removed) continue;
      c.cheer = Math.max(0, c.cheer - dt * 0.7);
      const k = a.ch.k && a.ch.anim === 'burnsDJCrowd' ? a.ch.k : {};
      k.bpm = this.curBpm(); k.e = clamp(e + (c.st - 1.5) * 0.05, 0, 1); k.st = c.st; k.cheer = c.cheer; k.boo = boo * (c.st % 2 ? 1 : 0.6);
      if (a.ch.anim !== 'burnsDJCrowd') a.ch.play('burnsDJCrowd', k); else a.ch.k = k;
      a.ch.animT = Math.max(0, t + c.jit + 0.001);
      a.yaw = BurnsM.dampAngle(a.yaw, Math.atan2(this.booth.x - a.x, this.booth.z - a.z), 2, dt);
      if (this.phase === 'play') {
        c.sayT -= dt;
        if (c.sayT <= 0) {
          c.sayT = 3 + this.rng() * 7;
          const L = this.wreckOn ? BURNS_DJ_SHOUT_DOWN : e > 0.62 ? BURNS_DJ_SHOUT_UP : e < 0.22 ? BURNS_DJ_SHOUT_DOWN : null;
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
  curBpm() { const D = this.mix && this.mix.decks[this.live]; return D && D.trk ? D.bpm() : this.bpm; }
  /* ---------------- input ---------------- */
  ev(type, e) {
    if (!this.active || Game.scene !== this.g) { this.detach(); return; }
    const r = Game.canvas.getBoundingClientRect();
    this.q.push({ type, id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top, ts: e.timeStamp });
  }
  key(e, down) {
    if (!this.active || Game.scene !== this.g) { this.detach(); return; }
    const map = { Digit1: 'c0', Digit2: 'c1', Digit3: 'c2', Space: 'play', Enter: 'enter', ArrowUp: 'pup', ArrowDown: 'pdn', ArrowLeft: 'nl', ArrowRight: 'nr',
      KeyW: 'fau', KeyS: 'fad', KeyI: 'fbu', KeyK: 'fbd', KeyZ: 'low0', KeyM: 'low1', KeyC: 'smp0', KeyV: 'smp1', KeyB: 'smp2', KeyN: 'smp3', KeyX: 'loop', KeyE: 'flo', KeyR: 'fhi', KeyY: 'sync', Escape: 'pause', KeyP: 'pause' };
    const a = map[e.code]; if (!a) return;
    if (e.cancelable) e.preventDefault();
    const rep = a === 'pup' || a === 'pdn';
    if (down && this.keysDown[a] && !rep) return;
    this.keysDown[a] = down;
    this.q.push({ type: down ? 'kdown' : 'kup', key: a, ts: e.timeStamp });
  }
  // test hook: inject a pointer event at CSS px (same path as real touches)
  inject(type, x, y, id) { this.q.push({ type, id: id === undefined ? 9001 : id, x, y, ts: performance.now() }); }
  // the audio time the player heard when an input event happened (performance.now() based timestamp)
  heardAt(ts) {
    const M = this.mix; if (!M) return 0;
    const now = performance.now(), back = ts && ts <= now + 1 && now - ts < 400 ? (now - ts) / 1000 : 0;
    return M.heard() - back;
  }
  hit(x, y) {
    const L = this.L || this.layout(); if (!L) return null;
    const inR = (r, pad) => r && x >= r.x - (pad || 0) && x <= r.x + r.w + (pad || 0) && y >= r.y - (pad || 0) && y <= r.y + r.h + (pad || 0);
    const inC = (c, k) => c && Math.hypot(x - c.x, y - c.y) <= c.r * (k || 1);
    if (this.phase === 'intro') return inR(L.startBtn, 10) ? 'start' : 'intro';
    if (this.phase === 'results' || this.phase === 'out') return 'cont';
    if (this.paused) { for (let i = 0; i < (L.menu || []).length; i++) if (inR(L.menu[i], 6)) return 'menu' + i; return 'none'; }
    if (inC(L.pause, 1.5)) return 'pause';
    if (this.step === 'pick' && this.crate && !this.crate.chosen) for (let i = 0; i < 3; i++) if (inR(L.crate[i], 4)) return 'crate' + i;
    const C = L.ctl;
    if (C.sync && this.syncOn() && inR(C.sync, 6)) return 'sync';
    for (const id of ['play0', 'play1', 'loop0', 'loop1', 'low0', 'low1', 'smp0', 'smp1', 'smp2', 'smp3', 'fad0', 'fad1', 'filter', 'pitch0', 'pitch1']) if (inR(C[id], id.startsWith('fad') || id.startsWith('pitch') ? 8 : 3)) return id;
    for (const id of ['jog0', 'jog1']) if (inC(C[id], 1.08)) return id;
    return 'none';
  }
  events() {
    const q = this.q; this.q = [];
    for (const e of q) {
      if (e.type === 'down') {
        const c = this.hit(e.x, e.y);
        const P = { c, x: e.x, y: e.y, x0: e.x, y0: e.y, t0: this.rt, ts: e.ts, v0: this.ctlValue(c), lastT: performance.now(), ang: null };
        this.ptr.set(e.id, P);
        this.press(c, P);
      } else if (e.type === 'move') {
        const P = this.ptr.get(e.id); if (!P) continue;
        this.drag(P, e.x, e.y, e.ts);
        P.x = e.x; P.y = e.y;
      } else if (e.type === 'up') {
        const P = this.ptr.get(e.id); if (!P) continue;
        this.ptr.delete(e.id);
        this.release(P);
      } else if (e.type === 'kdown') this.keyPress(e.key, true, e.ts);
      else if (e.type === 'kup') this.keyPress(e.key, false, e.ts);
    }
  }
  ctlValue(c) {
    if (!c || !this.mix) return 0;
    const D = this.mix.decks;
    if (c === 'fad0' || c === 'fad1') return D[+c[3]].fader;
    if (c === 'pitch0' || c === 'pitch1') return D[+c[5]].pitch;
    if (c === 'filter') return this.filt.v;
    return 0;
  }
  touching(c) { for (const P of this.ptr.values()) if (P.c === c) return true; return false; }
  press(c, P) {
    if (!c) return;
    if (c === 'start') { this.start(); return; }
    if (c === 'intro') { if (this.rt > 1.0) this.start(); return; }
    if (c === 'cont') { if (this.phase === 'results' && this.resT > 1.1) this.leave(); return; }
    if (c.startsWith('menu')) { this.menu(+c.slice(4)); return; }
    if (c === 'pause') { this.setPause(true); return; }
    if (this.phase !== 'play' || this.paused) return;
    if (c !== 'none') this.lastTouch = this.rt;
    try { if (this.mix && this.mix.ctx && this.mix.ctx.state !== 'running' && typeof Sound !== 'undefined') Sound.unlock(); } catch (e) { /* ignore */ }
    this.btnK[c] = 1;
    if (c.startsWith('crate')) this.choose(+c.slice(5), false);
    else if (c === 'play0' || c === 'play1') this.playPress(+c[4], this.heardAt(P.ts));
    else if (c === 'loop0' || c === 'loop1') { P.loopSide = +c[4]; this.loopDown(P.loopSide); }
    else if (c === 'low0' || c === 'low1') this.lowToggle(+c[3]);
    else if (c.startsWith('smp')) this.padPress(+c[3]);
    else if (c === 'sync') this.sync();
    else if (c === 'filter') this.filt.held = true;
    else if (c === 'fad0' || c === 'fad1') this.faderTouched(+c[3]);
  }
  drag(P, x, y, ts) {
    if (this.phase !== 'play' || this.paused || !this.mix) return;
    const L = this.L || this.layout(), C = L.ctl, D = this.mix.decks;
    if (P.c === 'fad0' || P.c === 'fad1') { const r = C[P.c]; this.setFader(+P.c[3], P.v0 - (y - P.y0) / Math.max(40, r.h - 20)); }
    else if (P.c === 'pitch0' || P.c === 'pitch1') { const r = C[P.c], i = +P.c[5]; this.setPitch(i, P.v0 - (y - P.y0) / Math.max(40, r.h - 16) * 0.16); }
    else if (P.c === 'filter') { const r = C.filter; this.filt.v = clamp(P.v0 + (x - P.x0) / Math.max(30, r.w / 2 - 10), -1, 1); }
    else if (P.c === 'jog0' || P.c === 'jog1') {
      const i = +P.c[3], J = C[P.c], now = performance.now(), dtm = Math.max(8, now - P.lastT) / 1000;
      const rx = P.x - J.x, ry = P.y - J.y, rl = Math.hypot(rx, ry) || 1, dx = x - P.x, dy = y - P.y;
      const tang = (rx * dy - ry * dx) / rl;     // clockwise (forward) is positive
      this.jogSpin[i] += tang / Math.max(20, J.r);
      this.jogV[i] = clamp(tang / dtm, -2400, 2400);
      this.jogNudge(i, this.jogV[i] / 700 * 0.15);
      P.lastT = now;
    }
  }
  release(P) {
    if (P.c === 'filter') { this.filt.held = this.touching('filter'); if (!this.filt.held) this.filterLetGo(); }
    if ((P.c === 'loop0' || P.c === 'loop1') && this.mix) this.loopUp(P.loopSide, this.rt - P.t0);
    if ((P.c === 'jog0' || P.c === 'jog1') && this.mix) { const i = +P.c[3]; this.jogV[i] = 0; this.mix.decks[i].nudge = 0; }
  }
  keyPress(k, down, ts) {
    if (k === 'pause' && down) { if (this.phase === 'play') this.setPause(!this.paused); return; }
    if (this.paused) { if (down && (k === 'pup' || k === 'pdn')) this.pauseSel = (this.pauseSel + (k === 'pup' ? 2 : 1)) % 3; if (down && (k === 'enter' || k === 'play')) this.menu(this.pauseSel); return; }
    if (this.phase === 'intro') { if (down && (k === 'enter' || k === 'play')) this.start(); return; }
    if (this.phase === 'results') { if (down && (k === 'enter' || k === 'play') && this.resT > 1.1) this.leave(); return; }
    if (this.phase !== 'play' || !this.mix) return;
    this.lastTouch = this.rt;
    const prep = 1 - this.live;
    if (!down) {
      if (k === 'flo' || k === 'fhi') { this.filt.keys = 0; this.filterLetGo(); }
      if (k === 'nl' || k === 'nr') this.mix.decks[prep].nudge = 0;
      if (k === 'loop' && this.loopKey) { this.loopUp(this.loopKey.side, this.rt - this.loopKey.t0); this.loopKey = null; }
      return;
    }
    if (k[0] === 'c' && k.length === 2 && this.step === 'pick') this.choose(+k[1], false);
    else if (k === 'play') this.playPress(prep, this.heardAt(ts));
    else if (k === 'pup' || k === 'pdn') this.setPitch(prep, this.mix.decks[prep].pitch + (k === 'pup' ? 1 : -1) * 0.2 / this.mix.decks[prep].native);
    else if (k === 'low0' || k === 'low1') this.lowToggle(+k[3]);
    else if (k.startsWith('smp')) this.padPress(+k[3]);
    else if (k === 'loop') { this.loopKey = { side: this.live, t0: this.rt }; this.loopDown(this.live); }
    else if (k === 'sync') this.sync();
    else if (k === 'fau' || k === 'fad') this.faderTouched(0);
    else if (k === 'fbu' || k === 'fbd') this.faderTouched(1);
  }
  // held keys: faders glide, nudges and the filter
  keysHeld(dt) {
    const K = this.keysDown, D = this.mix.decks, prep = 1 - this.live;
    if (K.fau) this.setFader(0, D[0].fader + dt * 0.9); if (K.fad) this.setFader(0, D[0].fader - dt * 0.9);
    if (K.fbu) this.setFader(1, D[1].fader + dt * 0.9); if (K.fbd) this.setFader(1, D[1].fader - dt * 0.9);
    if (K.nl) this.jogNudge(prep, -0.04); else if (K.nr) this.jogNudge(prep, 0.04);
    this.filt.keys = K.flo ? -1 : K.fhi ? 1 : 0;
    if (this.filt.keys) this.filt.v = approach(this.filt.v, this.filt.keys, dt * 0.7);
  }
  /* ---------------- phases ---------------- */
  start() {
    if (this.phase !== 'intro') return;
    this.phase = 'play';
    try { if (typeof Sound !== 'undefined' && Sound.stopMusic) Sound.stopMusic(); } catch (e) { /* audio is optional */ }
    if (this.mix) this.mix.destroy();
    this.mix = new BurnsDJMixer(this);
    const A = this.mix.decks[0];
    A.load(BurnsDJ.track(this.firstTrack.id) ? Object.assign({}, BurnsDJ.track(this.firstTrack.id), this.o.deckA || {}) : this.firstTrack);
    A.fader = 1; A.start(this.mix.now() + 0.08);
    this.live = 0; this.t0 = this.mix.heard(); this.stepT = 0; this.lastTouch = this.rt;
    burnsSfx('select2');
  }
  setPause(on) {
    if (this.phase !== 'play' || on === this.paused) return;
    this.paused = on; this.pauseSel = 0;
    if (this.mix) this.mix.hold(on);
    if (on) { burnsSfx('pause', null, 'select'); for (const P of this.ptr.values()) this.release(P); this.ptr.clear(); this.keysDown = {}; }
    else this.bigMsg('BACK IN THE MIX', '', '#38f2ff', 1.0);
  }
  menu(i) {
    burnsSfx('select');
    if (i === 0) this.setPause(false);
    else if (i === 1) { this.paused = false; if (this.mix) { this.mix.destroy(); this.mix = null; } this.reset(); this.phase = 'intro'; this.rt = 0.8; for (const c of this.crowd) c.cheer = 0; }
    else if (i === 2) { this.paused = false; if (this.mix) this.mix.hold(false); this.endSet(true); }
  }
  endSet(forfeit) {
    if (this.phase === 'results') return;
    // forfeit: the moments never reached count as misses
    if (forfeit) { for (let k = this.mixN; k < this.nMixes; k++) for (const w of ['pick', 'cue', 'lock', 'blend', 'party']) if (!(k === this.mixN && this.m.judged[w])) this.judged.push({ what: w, v: 0.1, label: 'miss', mix: k }); }
    for (const P of this.ptr.values()) this.release(P); this.ptr.clear();
    this.result = this.computeResult(!!forfeit);
    this.phase = 'results'; this.resT = 0; this.hint = null; this.filt.v = 0;
    try { if (!forfeit || this.mixN > 0) BurnsSave.flag(0, 'djTaught', 1); } catch (e) { /* no save */ }
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
    let wS = 0, vS = 0, run = 0, maxRun = 0; const n = { perfect: 0, great: 0, ok: 0, miss: 0 };
    for (const j of this.judged) { const w = BURNS_DJ_W[j.what] || 1; wS += w; vS += w * j.v; n[j.label]++; if (j.label === 'miss') run = 0; else maxRun = Math.max(maxRun, ++run); }
    const acc = wS > 0 ? vS / wS : 0;
    const eAvg = this.eTime > 0 ? this.eAcc / this.eTime : this.energy;
    let score = clamp(0.72 * acc + 0.14 * eAvg + 0.14 * this.energy, 0, 1);
    if (forfeit) score *= 0.85;
    const blends = this.judged.filter(j => j.what === 'blend');
    return { score: Math.round(score * 1000) / 1000, grade: BurnsDJ.grade(score), crowdPeak: Math.round(this.peak * 1000) / 1000, perfects: n.perfect, greats: n.great, oks: n.ok, misses: n.miss, maxCombo: maxRun,
      accuracy: Math.round(acc * 1000) / 1000, forfeit: !!forfeit, title: this.title, bpm: Math.round(this.curBpm() * 10) / 10, mixes: this.mixN, cleanMixes: blends.filter(j => j.v >= 0.75).length, trainwrecks: this.wrecks };
  }
  judge(what, v, text, o) {
    o = o || {};
    v = clamp(v, 0, 1);
    const label = BurnsDJ.label(v);
    this.m.judged[what] = true;
    this.judged.push({ what, v, label, mix: this.mixN, auto: !!o.auto });
    const J = BURNS_DJ_JUDGE[label];
    if (o.energy) this.bump(o.energy);
    this.bigMsg(text || J.txt, o.sub !== undefined ? o.sub : (o.auto ? 'the house helped' : J.txt), J.col, 1.3);
    if (label === 'miss' && !o.auto) this.g.shake(0.08);
    return label;
  }
  bump(de) { this.energy = clamp(this.energy + de, 0, 1); this.peak = Math.max(this.peak, this.energy); }
  pop(text, col, at) { this.pops.push({ text, col, at: at || 'center', t: 0 }); if (this.pops.length > 8) this.pops.shift(); }
  bigMsg(title, sub, col, dur, count) { this.big = { title, sub, col, t: 0, dur: dur || 1.2, count: !!count }; }
  flashText(text, col) { this.bigMsg(text, '', col, 0.9); }
  /* ---------------- the clock ---------------- */
  // the live record's position: beats, bar, bar within the 8-bar phrase (0..7), beat within the bar (0..3)
  pos(t) {
    const L = this.mix && this.mix.decks[this.live];
    if (!L || !L.playing) return { beat: 0, bar: 0, pbar: 0, bib: 0, frac: 0 };
    const b = L.beatAt(t === undefined ? this.mix.heard() : t), bar = Math.floor(b / 4);
    return { beat: b, bar, pbar: ((bar % 8) + 8) % 8, bib: ((Math.floor(b) % 4) + 4) % 4, frac: b - Math.floor(b) };
  }
  // scheduled time of the live record's next phrase 1 (at least `minBars` bars away)
  nextPhrase(minBars) {
    const L = this.mix.decks[this.live], b = L.beatAt(this.mix.heard()) + (minBars || 0) * 4 + 1e-6;
    return { t: L.timeOfStep(Math.ceil(b / 32) * 128), beat: Math.ceil(b / 32) * 32 };
  }
  // B against A right now: phase (ms, + = B early), tempo difference (BPM)
  rel() {
    const M = this.mix, A = M.decks[this.live], B = M.decks[1 - this.live];
    if (!A.playing || !B.playing) return { ms: 0, bpm: B.trk ? B.bpm() - A.bpm() : 0, ok: false };
    const t = M.now(), d = B.beatAt(t) - A.beatAt(t), fr = d - Math.round(d);
    return { ms: fr * 60000 / A.bpm(), beats: fr, bpm: B.bpm() - A.bpm(), ok: true };
  }
  // help comes sooner for a player who isn't touching anything (stuck or away)
  idleK() { return this.rt - (this.lastTouch || 0) > 8 ? 0.55 : 1; }
  syncOn() { return this.tier === 0 && this.step === 'match' && !this.lock; }
  /* ---------------- per-frame logic (replaces the scene update) ---------------- */
  stepFrame(dt) {
    const g = this.g;
    if (!this.active) return;
    try {
      if (Input.mode !== 'ui') Input.setMode('ui');
      g.t += dt; g.time += dt; this.rt += dt;
      this.events();
      if (this.timers) { for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0 && !tm.done) { tm.done = true; tm.fn(); } } this.timers = this.timers.filter(tm => !tm.done); }
      if (!this.paused) {
        if (this.phase === 'intro') { if (this.introT !== undefined && this.rt > this.introT) this.start(); }
        else if (this.phase === 'play') { this.mix.tick(); this.t = this.mix.heard() - this.t0; if (this.auto) this.autoStep(dt); this.play(dt); }
        else if (this.phase === 'results') { this.resT += dt; if (this.mix) { this.mix.tick(); this.mix.apply(); } if (this.auto && this.auto.cont && this.resT > 1.3) this.leave(); }
        else if (this.phase === 'out') { this.outT += dt; if (this.outT > 0.45) { this.close(); return; } }
      }
      this.updateCrowd(dt);
      this.fxStep(dt);
      if (this.fx3d && this.fx3d.ch) this.poseDeck();
      for (const j of g.world.jets) { j.t += dt; const ph = ((j.t + j.phase) % j.period); j.active = ph < j.on; j.warn = !j.active && ph > j.period - 0.6; }
      const p = g.player;
      p.ch.k = p.ch.k || {}; const pk = p.ch.anim === 'burnsDJBrady' ? p.ch.k : {};
      pk.bpm = this.curBpm(); pk.pump = Math.max(0, (pk.pump || 0) - dt * 1.4);
      const cueing = this.phase === 'play' && (this.step === 'cue' || this.step === 'match');
      pk.cue = cueing ? 1 : Math.max(0, (pk.cue || 0) - dt * 3);
      pk.rub = this.ptr.size && Array.from(this.ptr.values()).some(P => P.c && P.c.startsWith('jog')) ? 1 : Math.max(0, (pk.rub || 0) - dt * 4);
      if (p.ch.anim !== 'burnsDJBrady') p.ch.play('burnsDJBrady', pk); else p.ch.k = pk;
      p.ch.animT = this.phase === 'play' ? Math.max(0, this.t) : this.rt;
    } catch (e) { Game.reportError(e); this.abort(); }
  }
  play(dt) {
    const M = this.mix, D = M.decks, A = D[this.live], B = D[1 - this.live], P = this.pos(), spb = 60 / A.bpm();
    this.stepT += dt;
    this.keysHeld(dt);
    // beat clock (the live record, as heard)
    const beat = Math.floor(P.beat);
    if (beat !== this.lastBeat) { this.lastBeat = beat; this.beatK = 1; if (P.bib === 0) { this.barK = 1; if (P.pbar === 0) this.onPhrase(); } }
    this.beatK = Math.max(0, this.beatK - dt / (spb * 0.8)); this.barK = Math.max(0, this.barK - dt / (spb * 2));
    // jog nudges fade when the finger stops moving
    for (let i = 0; i < 2; i++) {
      if (this.touching('jog' + i)) { this.jogV[i] *= Math.pow(0.0001, dt); this.jogNudge(i, this.jogV[i] / 700 * 0.15); }
      else if (!(i === 1 - this.live && (this.keysDown.nl || this.keysDown.nr)) && !(this.auto && i === 1 - this.live)) D[i].nudge = 0;
    }
    // the filter springs back to the middle when let go
    if (!this.filt.held && !this.filt.keys) this.filt.v = approach(this.filt.v, 0, dt * 3.5);
    M.filter = this.filt.v;
    this.filterJudge(dt, P);
    // the auto-blend (the house engineer) moves the faders
    if (this.autoBlend) { const AB = this.autoBlend, k = clamp((M.heard() - AB.t0) / AB.dur, 0, 1); B.fader = Math.max(B.fader, clamp(k / 0.6, 0, 1)); A.fader = Math.min(A.fader, clamp((1 - k) / 0.6, 0, 1)); }
    // locked decks stay locked: B follows A's tempo and the phase is trimmed continuously
    if (this.lock && A.playing && B.playing) {
      B.pitch = A.bpm() / B.native - 1; B.nudge = 0;
      const r = this.rel(); if (!B.corr && Math.abs(r.ms) > 0.4) B.corr = -r.ms / 1000;
    }
    M.apply();
    // step machine
    const S = this.step;
    if (S === 'warm') { if (this.stepT > (this.teach ? 16 : 8) * spb && P.bib === 0) this.openCrate(); }
    else if (S === 'pick') { if (this.crate && !this.crate.chosen && this.stepT > this.help.pick * this.idleK()) this.choose(this.autoPickIdx(), true); }
    else if (S === 'cue') this.cueStep(P);
    else if (S === 'match') this.matchStep(dt);
    if (this.step === 'blend' || (this.step === 'match' && B.playing)) this.blendStep(dt);
    if (this.step === 'party' && M.heard() >= this.party.end + 0.35 * spb) this.partyEnd();   // a little grace: letting go on the closing 1 counts
    this.crowdStep(dt, A, B);
    this.hint = this.makeHint(P);
    this.peak = Math.max(this.peak, this.energy);
  }
  onPhrase() {
    if (this.step === 'cue' && this.m.cueArmed) { this.m.cueArmed = false; }
    // the blend never happens: the house engineer does it (sooner if nobody touched a fader at all)
    if (this.step === 'blend' && !this.autoBlend) {
      const bars = (this.mix.heard() - this.m.lockT) * this.mix.decks[this.live].bpm() / 240;
      if (bars > (this.help.blendPhrases + (this.m.touched ? 2 : 0)) * 8 - 3) this.startAutoBlend();
    }
    // a loop left on for too long lets go on the phrase
    for (const d of this.mix.decks) if (d.loop && this.mix.heard() - d.loop.t > d.loop.max) { d.loop = null; this.pop('LOOP OFF', '#ffffff', 'loop' + d.side); }
  }
  /* ---------- 1 PICK ---------- */
  openCrate() {
    const A = this.mix.decks[this.live], cur = BurnsDJ.track(A.trk.id) || A.trk, E = cur.energy || 3, master = A.bpm();
    // what the crowd wants next
    let want;
    if (this.mixN === this.nMixes - 1 && E <= 4) want = 'up';
    else if (E >= 4 && this.rng() < 0.5) want = 'down';
    else if (E <= 2) want = 'up';
    else want = this.rng() < 0.6 ? 'up' : 'roll';
    if (E >= 5 && want === 'up') want = 'roll';
    if (E <= 1 && want === 'down') want = 'roll';
    this.want = want;
    const pool = BurnsDJ.library().filter(t => this.played.indexOf(t.id) < 0 && Math.abs(t.bpm - master) <= master * 0.075);
    const score = t => {
      const ed = (t.energy || 3) - E;
      const vibe = want === 'up' ? (ed >= 2 ? 0.85 : ed === 1 ? 1 : ed === 0 ? 0.45 : 0.1) : want === 'down' ? (ed <= -1 ? 1 : ed === 0 ? 0.45 : 0.1) : (ed === 0 ? 1 : Math.abs(ed) === 1 ? 0.55 : 0.15);
      const kf = BurnsDJ.keyFit(cur.cam || '8A', t.cam || '8A'), key = kf === 2 ? 1 : kf === 1 ? 0.6 : 0.15;
      const gap = Math.abs(t.bpm - master), tempo = gap <= 2 ? 1 : gap <= 4 ? 0.75 : gap <= 6 ? 0.45 : 0.2;
      return { t, q: 0.45 * vibe + 0.3 * key + 0.25 * tempo, vibe, key, tempo, kf, gap };
    };
    const all = pool.map(score).sort((a, b) => b.q - a.q);
    if (all.length < 3) { for (const t of BurnsDJ.library()) if (t.id !== A.trk.id && !all.find(x => x.t.id === t.id)) all.push(score(t)); all.sort((a, b) => b.q - a.q); }
    const R = this.rng, pickFrom = (a, b) => all[Math.min(all.length - 1, a + Math.floor(R() * Math.max(1, b - a)))];
    const good = pickFrom(0, Math.min(2, all.length));
    const rest = all.filter(x => x !== good);
    const poor = rest[rest.length - 1 - Math.floor(R() * Math.min(3, Math.max(1, rest.length - 1)))];
    const mids = rest.filter(x => x !== poor), mid = mids[Math.floor(mids.length * (0.25 + R() * 0.4))] || mids[0];
    const cards = [good, mid, poor].filter(Boolean);
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp; }
    this.crate = { cards, best: Math.max(...cards.map(c => c.q)), chosen: null, t: 0 };
    this.step = 'pick'; this.stepT = 0;
    this.m = this.newMix(); this.m.t0 = this.mix.heard();
    burnsSfx('select', { vol: 0.5 });
  }
  autoPickIdx() { const C = this.crate.cards; let best = 0; for (let i = 1; i < C.length; i++) if (C[i].q > C[best].q) best = i; return (best + 1 + Math.floor(this.rng() * (C.length - 1))) % C.length; }
  choose(i, auto) {
    const C = this.crate; if (!C || C.chosen || this.step !== 'pick' || !C.cards[i]) return;
    const c = C.cards[i]; C.chosen = c; C.idx = i;
    const v = auto ? 0.4 : c.q >= C.best - 1e-6 ? 1 : c.q >= 0.72 ? 0.85 : c.q >= 0.5 ? 0.65 : 0.45;
    this.m.pick = c;
    this.judge('pick', v, auto ? 'THE CRATE PICKED' : v >= 1 ? 'GREAT PICK!' : v >= 0.8 ? 'GOOD PICK' : v >= 0.6 ? 'IT\'LL WORK' : 'RISKY PICK', { auto, sub: auto ? 'the house helped' : (c.vibe >= 0.8 ? 'the crowd will love it' : c.vibe < 0.3 ? 'not what they asked for' : '') });
    const prep = this.mix.decks[1 - this.live], master = this.mix.decks[this.live].bpm();
    prep.load(c.t); prep.fader = 0; prep.low = true; prep.cue = false;
    // the record starts a little off the master tempo (its own BPM, nudged so there's always something to match)
    const gap = prep.native - master, d = this.diff;
    let start = prep.native;
    if (Math.abs(gap) < lerp(0.7, 1.4, d)) start = master + (gap >= 0 ? 1 : -1) * lerp(0.8, 1.8, d) * (0.8 + this.rng() * 0.4);
    prep.pitch = clamp(start / prep.native - 1, -0.08, 0.08);
    this.played.push(c.t.id);
    burnsSfx('pick', { vol: 0.5 });
    this.later(0.7, () => { if (this.step === 'pick') { this.step = 'cue'; this.stepT = 0; this.m.cueBeat0 = this.pos().beat; } });
  }
  /* ---------- 2 CUE: PLAY on the 1 ---------- */
  cueStep(P) {
    const m = this.m, A = this.mix.decks[this.live];
    // a whole bar of the new phrase went by without a press: that phrase is missed
    const b = P.beat;
    if (m.lastPhraseSeen === undefined) m.lastPhraseSeen = Math.floor(b / 32);
    const ph = Math.floor((b - 4) / 32);
    if (ph > m.lastPhraseSeen) { m.lastPhraseSeen = ph; if (b - m.cueBeat0 > 8) { m.cueMiss++; if (m.cueMiss < this.help.cuePhrases) this.pop('WAIT FOR THE NEXT 1', '#ffe24a', 'play' + (1 - this.live)); } }
    // help: the house presses PLAY on the next 1
    if (m.cueMiss >= (this.idleK() < 1 ? 1 : this.help.cuePhrases) && !m.cueAuto) {
      const np = this.nextPhrase(0), t = np.t;
      if (t - this.mix.now() < 0.2) { m.cueAuto = true; this.playPress(1 - this.live, t, true); }
    }
    void A;
  }
  playPress(side, heardT, auto) {
    const M = this.mix, D = M.decks, A = D[this.live], B = D[side];
    if (side === this.live) { this.flashText('DECK ' + 'AB'[side] + ' IS LIVE', '#ff9ad8'); return; }
    if (!B.trk) { this.flashText(this.step === 'pick' ? 'PICK A RECORD FIRST' : 'NO RECORD YET', '#ff9ad8'); return; }
    // pressed again while it plays in the headphones: back to the cue point, wait for the next 1
    if (B.playing) {
      if (this.lock || this.step !== 'match') return;
      B.stop(); B.cue = false; this.step = 'cue'; this.stepT = 0; this.m.cueBeat0 = this.pos().beat; this.m.lastPhraseSeen = undefined;
      this.flashText('CUED AGAIN', '#38f2ff'); return;
    }
    if (this.step !== 'cue') return;
    if (B.fader > 0.2 && this.tier < 2) { B.fader = 0; this.pop('FADER ' + 'AB'[side] + ' DOWN TILL IT\'S LOCKED', '#ffe24a', 'fad' + side); }
    // where in A's phrase the press landed (as heard)
    const bA = A.beatAt(heardT), nb = Math.round(bA), errS = (bA - nb) * 60 / A.bpm();
    const dp = nb - Math.round(nb / 32) * 32;
    let v, text, sub = '';
    const msOff = Math.round(errS * 1000);
    if (auto) { v = 0.3; text = 'AUTO-CUE'; }
    else if (dp === 0) { v = Math.abs(errS) * 1000 <= this.tol.cueMs ? 1 : 0.85; text = v >= 1 ? 'RIGHT ON THE 1!' : 'ON THE 1'; sub = Math.abs(msOff) > 20 ? Math.abs(msOff) + ' ms ' + (msOff > 0 ? 'late' : 'early') : ''; }
    else if (Math.abs(dp) <= 2) { v = 0.65; text = dp > 0 ? 'A BEAT LATE' : 'A BEAT EARLY'; sub = 'close counts'; }
    else if (Math.abs(dp) <= 4) { v = 0.55; text = 'NEAR THE 1'; sub = 'close counts'; }
    else { v = 0.45; text = 'NOT ON THE 1'; sub = 'it still plays: wait for the 1 next time'; }
    this.judge('cue', v, text, { auto, sub: auto ? 'the house pressed PLAY' : sub });
    // start B: quantised to the phrase (easy/normal) so its bars land on A's bars
    const snap = Math.abs(errS) * 1000 <= this.tol.ms ? 0 : errS;
    let base = nb;
    if (this.tier < 2) base = Math.abs(dp) <= 4 ? nb - dp : nb - (nb - Math.round(nb / 4) * 4);
    B.start(A.timeOfStep(base * 4) + snap);
    B.cue = true;
    this.step = 'match'; this.stepT = 0; this.m.matchT0 = M.heard(); this.m.tempoOK = false;
    burnsSfx('select2', { vol: 0.4, pitch: 1.2 });
  }
  /* ---------- 3 MATCH: pitch, then nudge, then LOCK ---------- */
  matchStep(dt) {
    const m = this.m, D = this.mix.decks, A = D[this.live], B = D[1 - this.live];
    if (this.lock || !B.playing) return;
    const r = this.rel(), touchingPitch = this.touching('pitch' + B.side) || this.keysDown.pup || this.keysDown.pdn;
    const el = this.mix.heard() - m.matchT0;
    // tempo
    if (Math.abs(r.bpm) < this.tol.bpm) {
      m.tempoHold += dt;
      if (!m.tempoOK && (!touchingPitch || m.tempoHold > 0.6)) {
        m.tempoOK = true; B.pitch = A.bpm() / B.native - 1;
        this.pop('TEMPO MATCHED', '#7aff5a', 'pitch' + B.side); burnsSfx('select2', { vol: 0.35, pitch: 1.4 });
      }
    } else { m.tempoHold = 0; if (m.tempoOK && Math.abs(r.bpm) > this.tol.bpm * 1.5) m.tempoOK = false; }
    if (m.tempoOK && !touchingPitch) B.pitch = A.bpm() / B.native - 1;
    // help: glide the pitch home
    if (!m.tempoOK && el > this.help.tempo * this.idleK()) { m.assistT = true; const target = A.bpm() / B.native - 1; B.pitch = approach(B.pitch, target, dt * 0.012); if (!m.helpMsgT) { m.helpMsgT = 1; this.pop('THE HOUSE HELPS WITH THE PITCH', '#ffe24a', 'pitch' + B.side); } }
    // phase: close enough snaps (only when the tempo is matched)
    if (m.tempoOK) {
      if (!m.tempoT) m.tempoT = this.mix.heard();
      const jogging = this.touching('jog' + B.side) || this.keysDown.nl || this.keysDown.nr;
      if (Math.abs(r.ms) <= this.tol.ms && (!jogging || Math.abs(r.ms) < this.tol.ms * 0.6)) this.lockIn(false);
      else if (this.mix.heard() - m.tempoT > this.help.phase * this.idleK() && !m.assistP) { m.assistP = true; B.corr = -r.ms / 1000; this.pop('THE HOUSE NUDGES DECK ' + 'AB'[B.side], '#ffe24a', 'jog' + B.side); }
      else if (m.assistP && Math.abs(r.ms) <= this.tol.ms) this.lockIn(false);
    }
  }
  sync() {
    if (!this.syncOn()) return;
    const D = this.mix.decks, A = D[this.live], B = D[1 - this.live]; if (!B.playing) return;
    B.pitch = A.bpm() / B.native - 1; this.m.tempoOK = true; this.m.sync = true;
    this.lockIn(true);
  }
  lockIn(viaSync) {
    if (this.lock) return;
    const m = this.m, D = this.mix.decks, A = D[this.live], B = D[1 - this.live], r = this.rel();
    B.pitch = A.bpm() / B.native - 1; B.nudge = 0; B.corr = -r.ms / 1000;
    this.lock = true; m.lockT = this.mix.heard();
    const el = m.lockT - m.matchT0;
    let v = viaSync ? 0.8 : (m.assistT && m.assistP) ? 0.35 : (m.assistT || m.assistP) ? 0.55 : el < 10 ? 1 : el < 18 ? 0.88 : 0.76;
    this.judge('lock', v, viaSync ? 'SYNCED' : v >= 0.95 ? 'LOCKED IN!' : 'LOCKED', { auto: m.assistT && m.assistP, sub: viaSync ? 'kicks together' : 'the kicks hit as one' });
    burnsSfx('gold', { vol: 0.3 });
    this.step = 'blend'; this.stepT = 0; this.m.phrasesSinceLock = 0;
  }
  /* ---------- 4 BLEND: faders ---------- */
  faderTouched(i) { if (this.autoBlend) { this.autoBlend = null; this.pop('YOUR FADERS', '#ffffff', 'fad' + i); } this.m.touched = true; }
  setFader(i, v) {
    const d = this.mix.decks[i]; v = clamp(v, 0, 1);
    if (Math.abs(v - d.fader) < 1e-4) return;
    this.faderTouched(i);
    // pushed a deck that isn't locked into the crowd's ears
    if (i !== this.live && v > 0.25 && d.playing && !this.lock && d.fader <= 0.25) this.flashText('LOCK THE KICKS FIRST!', '#ff3b5c');
    d.fader = v;
  }
  setPitch(i, v) {
    const D = this.mix.decks, d = D[i]; if (!d.trk) return;
    if (i !== this.live && this.lock) { if (!this.btnK.lockMsg || this.rt - this.btnK.lockMsg > 2) { this.btnK.lockMsg = this.rt; this.pop('LOCKED ✓', '#7aff5a', 'pitch' + i); } return; }
    d.pitch = clamp(v, -0.08, 0.08);
  }
  jogNudge(i, v) {
    const D = this.mix.decks, d = D[i]; if (!d.playing) return;
    if (i !== this.live && this.lock) return;
    d.nudge = clamp(v, -0.12, 0.12);
  }
  lowToggle(i) { const d = this.mix.decks[i]; d.low = !d.low; burnsSfx('select', { vol: 0.3, pitch: d.low ? 1.2 : 0.8 }); }
  startAutoBlend() {
    if (this.autoBlend || this.step !== 'blend') return;
    this.autoBlend = { t0: this.mix.heard(), dur: 8 * 60 / this.mix.decks[this.live].bpm() * 2 };
    this.m.autoBlend = true;
    this.pop('THE HOUSE ENGINEER BLENDS', '#ffe24a', 'fad' + (1 - this.live));
  }
  blendStep(dt) {
    const M = this.mix, D = M.decks, out = D[this.live], inc = D[1 - this.live], m = this.m, now = M.heard();
    if (!inc.playing) return;
    if (!m.blendStart && inc.fader > 0.12) m.blendStart = now;
    if (inc.fader > 0.3 && out.fader > 0.3 && (inc.low !== out.low)) m.swap = true;
    if (inc.fader >= 0.8 && out.fader <= 0.1) this.completeMix();
  }
  completeMix() {
    const M = this.mix, D = M.decks, out = D[this.live], inc = D[1 - this.live], m = this.m, now = M.heard();
    const spb = 60 / out.bpm(), bars = (now - (m.blendStart || now)) / (4 * spb);
    let v;
    if (m.autoBlend) v = 0.4;
    else {
      v = bars >= 4 ? 1 : bars >= 2 ? 0.93 : bars >= 1 ? 0.8 : 0.62;
      if (m.wreck > 0.4) v -= Math.min(0.55, 0.14 + m.wreck * 0.08);
      if (m.swap) v += 0.06;
      if (!this.lock) v = Math.min(v, 0.35);
      v = clamp(v, 0.15, 1);
    }
    const wreck = m.wreck > 0.4 || !this.lock;
    if (!m.judged.lock) { m.judged.lock = true; this.judged.push({ what: 'lock', v: 0.2, label: 'miss', mix: this.mixN }); }
    const text = m.autoBlend ? 'MIXED (WITH HELP)' : wreck ? 'TRAINWRECK MIX' : v >= 1 ? (m.swap ? 'SILKY BASS SWAP!' : 'SILKY MIX!') : v >= 0.9 ? 'SMOOTH MIX!' : v >= 0.75 ? 'NICE MIX' : 'SLAMMED IN';
    const pk = m.pick, fit = pk ? (pk.vibe >= 0.8 ? 0.08 : pk.vibe < 0.3 ? -0.05 : 0.02) : 0;
    this.judge('blend', v, text, { auto: m.autoBlend, energy: 0.03 + 0.12 * v + fit, sub: m.autoBlend ? 'the house helped' : bars >= 1 ? 'over ' + Math.round(bars) + ' bar' + (Math.round(bars) === 1 ? '' : 's') : '' });
    if (v >= 0.75) { this.dropFx(v >= 0.95 ? 1 : 0.7); this.crowdCheer(v, v >= 0.95 ? 'WHAT A BLEND!' : 'OOOH!'); burnsSfx('crowd_cheer', { vol: 0.5 }); }
    if (pk && pk.vibe >= 0.8) this.later(1.2, () => this.crowdCheer(0.5, this.want === 'down' ? 'Ahh, breathing room!' : this.want === 'up' ? 'YES! HARDER!' : 'Keep it rolling!'));
    // the old record runs out; the new one is live
    out.fader = 0; out.cue = false; out.loop = null;
    const old = out; this.later(0.4, () => { if (this.mix && old !== this.mix.decks[this.live]) old.unload(); });
    inc.cue = false; inc.fader = Math.max(inc.fader, 0.8);
    this.live = inc.side; this.lock = false; this.autoBlend = null; this.mixN++;
    // the party phrase: until a phrase 1 at least 4 bars away (8 when teaching)
    const np = this.nextPhrase(this.teach ? 6 : 3);
    this.party = { start: now, end: np.t, best: 0, used: 0 };
    this.step = 'party'; this.stepT = 0;
  }
  /* ---------- 5 PARTY: pads, loop, filter ---------- */
  partyEnd() {
    const Pt = this.party;
    if (!this.m.judged.party) this.judge('party', Pt.used ? Pt.best : 0.5, Pt.used ? (Pt.best >= 0.95 ? 'PARTY STARTER!' : Pt.best >= 0.75 ? 'CROWD LIFTED' : 'KEEPING IT GOING') : 'STEADY GROOVE', { sub: Pt.used ? '' : 'try a ROLL into the 1 next time' });
    this.party = null;
    if (this.mixN >= this.nMixes) this.endSet(false);
    else this.openCrate();
  }
  // was time t (scheduled) on a musical spot of the live record? 1 = phrase 1, 0.85 = halfway (bar 5), 0.7 = any bar 1
  spot(t) {
    const L = this.mix.decks[this.live]; if (!L.playing) return 0.5;
    const b = L.beatAt(t), nb = Math.round(b), off = Math.abs(b - nb);
    if (off > 0.3) return 0.5;
    if (nb % 32 === 0) return 1;
    if (nb % 16 === 0) return 0.85;
    if (nb % 4 === 0) return 0.7;
    return 0.5;
  }
  partyCredit(v, text, at, counted) {
    const now = this.mix.heard();
    if (this.party && !counted) { this.party.best = Math.max(this.party.best, v); this.party.used++; }
    this.bump((v - 0.5) * 0.16 + (v >= 0.85 ? 0.03 : 0));
    this.pop(text, v >= 0.85 ? '#ffe24a' : v >= 0.65 ? '#7aff5a' : v >= 0.45 ? '#ffffff' : '#ff6a6a', at);
    if (v >= 0.85) { this.crowdCheer(0.5 + 0.4 * v, BURNS_DJ_SHOUT_UP[Math.floor(this.rng() * BURNS_DJ_SHOUT_UP.length)]); const p = this.g.player; if (p.ch.anim === 'burnsDJBrady') p.ch.k.pump = 1; }
    void now;
  }
  padPress(i) {
    const M = this.mix; if (!M) return;
    const pad = BURNS_DJ_PADS[i], L = M.decks[this.live], now = M.heard(), spb = 60 / (L.trk ? L.bpm() : this.bpm);
    this.padK[i] = 1;
    const tl = M.pad(pad.id, L); if (tl === null) return;
    // spam: lots of pads in 4 bars, the same pad twice in 2 bars, or the horn twice in 8 bars
    const recent = this.smpLog.filter(s => now - s.t < 16 * spb), same = recent.filter(s => s.id === pad.id && now - s.t < 8 * spb);
    const horn = pad.id === 'horn' && this.smpLog.some(s => s.id === 'horn' && now - s.t < 32 * spb);
    this.smpLog.push({ id: pad.id, t: now }); if (this.smpLog.length > 20) this.smpLog.shift();
    let v = this.spot(tl), text = v >= 1 ? 'ON THE 1!' : v >= 0.85 ? 'NICE TIMING' : v >= 0.7 ? 'ON THE BAR' : pad.label;
    if (recent.length >= 3) { v = 0.15; text = 'EASY, TIGER'; }
    else if (horn) { v = 0.2; text = 'EASY ON THE HORN'; }
    else if (same.length) { v = Math.min(v, 0.35); text = 'AGAIN?'; }
    if (this.party) { this.party.best = Math.max(this.party.best, v); this.party.used++; }
    const delay = Math.max(0, tl - M.now());
    this.later(delay, () => { if (this.phase === 'play' || this.phase === 'results') this.partyCredit(v, text, 'smp' + i, true); });
  }
  loopDown(side) {
    const d = this.mix.decks[side]; if (!d.playing) return;
    if (d.loop) { this.loopRelease(d); return; }
    const nh = Math.floor(d.beatAt(this.mix.heard()) * 4);
    d.loop = { from: Math.floor(nh / 16) * 16, len: 16, t: this.mix.heard(), max: 9 * 4 * 60 / d.bpm(), held: true };
    this.pop('LOOP 1 BAR', '#38f2ff', 'loop' + side);
  }
  loopUp(side, heldFor) {
    const d = this.mix.decks[side]; if (!d.loop) return;
    if (d.loop.half) { this.loopRelease(d); return; }
    d.loop.held = false;
  }
  // held LOOP: after a moment it rolls half a bar until let go
  loopHoldCheck() {
    for (const P of this.ptr.values()) if (P.c === 'loop0' || P.c === 'loop1') {
      const d = this.mix.decks[P.loopSide];
      if (d.loop && d.loop.held && !d.loop.half && this.rt - P.t0 > 0.35) { const nh = Math.floor(d.beatAt(this.mix.heard()) * 4); d.loop.from = Math.floor(nh / 8) * 8; d.loop.len = 8; d.loop.half = true; this.pop('ROLL ½ BAR', '#38f2ff', 'loop' + d.side); }
    }
    if (this.loopKey) { const d = this.mix.decks[this.loopKey.side]; if (d.loop && !d.loop.half && this.rt - this.loopKey.t0 > 0.35) { const nh = Math.floor(d.beatAt(this.mix.heard()) * 4); d.loop.from = Math.floor(nh / 8) * 8; d.loop.len = 8; d.loop.half = true; } }
  }
  loopRelease(d) {
    const now = this.mix.heard(), L = d.loop; d.loop = null;
    const spb = 60 / d.bpm(), held = now - L.t;
    if (d.side !== this.live) return;
    if (held < 2 * spb) { this.pop('LOOP OFF', '#ffffff', 'loop' + d.side); return; }
    let v = this.spot(now); if (held > 8 * 4 * spb) v = Math.min(v, 0.35);
    this.partyCredit(v, v >= 1 ? 'LOOP RELEASE ON THE 1!' : v >= 0.7 ? 'LOOP RELEASE' : 'LOOP OFF', 'loop' + d.side);
  }
  filterJudge(dt, P) {
    const F = this.filt, a = Math.abs(F.v), now = this.mix.heard(), spb = 60 / this.curBpm();
    if (a > 0.4) { if (!F.on) F.on = { t: now }; F.on.dur = now - F.on.t; if (F.on.dur > 32 * spb) this.bump(-dt * 0.02); }
    else if (F.on && a < 0.15) this.filterLetGo();
    void P;
  }
  // the filter swept for at least two beats and let go: on a 1 it's a "filter drop"
  filterLetGo() {
    const F = this.filt, on = F.on; if (!on || !this.mix) return;
    F.on = null;
    const spb = 60 / this.curBpm(), now = this.mix.heard(), dur = now - on.t;
    if (dur >= 2 * spb) { const v = this.spot(now); this.partyCredit(dur > 32 * spb ? 0.4 : v, v >= 1 ? 'FILTER DROP ON THE 1!' : v >= 0.7 ? 'FILTER DROP' : 'FILTER OPEN', 'filter'); }
  }
  /* ---------- the crowd's ears ---------- */
  crowdStep(dt, A, B) {
    const M = this.mix, spb = 60 / A.bpm(), cur = BurnsDJ.track(A.trk.id) || {}, base = 0.26 + 0.07 * (cur.energy || 3);
    this.energy += (base - this.energy) * dt * 0.025;
    // trainwreck: two records the crowd can hear, kicks not locked
    const both = A.playing && B.playing && A.crowd > 0.18 && B.crowd > 0.18, r = both ? this.rel() : null;
    const wreck = both && (!this.lock || Math.abs(r.ms) > 30) && (Math.abs(r.ms) > 16 || Math.abs(r.bpm) > 0.3);
    if (wreck) {
      this.wreckT += dt; this.m.wreck = (this.m.wreck || 0) + dt;
      this.energy -= dt * 0.12 * Math.min(1, A.crowd + B.crowd);
      this.redK = Math.min(1, this.redK + dt * 3);
      if (!this.wreckOn && this.wreckT > 0.35) { this.wreckOn = true; this.wrecks++; this.bigMsg('TRAINWRECK!', 'the kicks are fighting', '#ff3b5c', 1.4); burnsSfx('throw', { vol: 0.6, pitch: 0.7 }); this.g.shake(0.25); this.crowdCheer(0, 'Trainwreck!'); }
    } else { this.wreckT = 0; this.wreckOn = false; this.redK = Math.max(0, this.redK - dt * 1.5); }
    // dead air: nothing up on the faders
    const lvl = A.crowd + B.crowd;
    if (lvl < 0.2 && (A.playing || B.playing)) {
      this.deadT += dt; this.energy -= dt * 0.12;
      if (this.deadT > 2 * spb && !this.deadMsg) { this.deadMsg = true; this.bigMsg('DEAD AIR!', 'bring a fader up', '#ff3b5c', 1.4); this.crowdCheer(0, 'Hello?!'); }
      if (this.deadT > this.help.dead * 4 * spb) { A.fader = Math.max(A.fader, 0.85); this.pop('THE HOUSE BRINGS IT BACK', '#ffe24a', 'fad' + A.side); }
    } else { this.deadT = 0; this.deadMsg = false; }
    // two full kick drums and two bass lines: muddy (a hint, not a penalty)
    if (A.crowd > 0.5 && B.crowd > 0.5 && A.low && B.low && this.lock) this.mudT += dt; else this.mudT = 0;
    this.energy = clamp(this.energy, 0, 1);
    if (this.mix.heard() - this.t0 > 1) { this.eAcc += this.energy * dt; this.eTime += dt; }
    void M;
  }
  /* ---------- what to do now: one instruction and the control(s) to touch ---------- */
  makeHint(P) {
    const D = this.mix.decks, A = D[this.live], B = D[1 - this.live], a = 'AB'[A.side], b = 'AB'[B.side], tc = this.teach;
    const H = (ctl, title, sub, teach) => ({ ctl, title, sub, teach: tc ? teach : null });
    if (this.deadT > 0.4) return H(['fad' + A.side], 'DEAD AIR!', 'Push fader ' + a + ' up', 'Silence empties a dance floor fast.');
    if (this.wreckOn) return H(['fad' + B.side], 'TRAINWRECK!', 'Pull fader ' + b + ' down' + (this.lock ? '' : ' and lock the kicks first'), 'The crowd can hear two beats fighting each other.');
    const S = this.step;
    if (S === 'warm') return H([], 'DECK ' + a + ' IS LIVE', 'Your crowd is dancing to it', 'This record plays to the crowd. Next you\'ll pick a record for deck ' + b + ' and blend it in.');
    if (S === 'pick') { const w = this.want === 'up' ? '▲ MORE ENERGY' : this.want === 'down' ? '▼ A BREATHER' : '▶ KEEP IT ROLLING'; return H(['crate'], 'PICK THE NEXT RECORD', 'The crowd wants ' + w, 'Close BPM and a key that fits (✓) make the mix easier. A poor pick still works.'); }
    if (S === 'cue') { const left = 32 - ((P.beat % 32) + 32) % 32; return H(['play' + B.side], 'PRESS PLAY ON THE 1', left <= 4.5 ? 'Get ready: ' + Math.max(1, Math.ceil(left)) + '...' : 'Start deck ' + b + ' when bar 1 of the phrase begins', 'Deck ' + b + ' plays in your headphones first: you hear it quietly, the crowd doesn\'t.'); }
    if (S === 'match') {
      const r = this.rel();
      if (!this.m.tempoOK) { const up = r.bpm < 0; return H(['pitch' + B.side].concat(this.syncOn() ? ['sync'] : []), 'MATCH THE TEMPO', 'Slide ' + b + '\'s PITCH ' + (up ? '▲ up' : '▼ down') + ' till its kicks stop sliding' + (this.syncOn() ? ' (or SYNC)' : ''), 'Watch the two kick rows above: when ' + b + '\'s stop drifting, the tempos match. Its BPM turns green.'); }
      return H(['jog' + B.side].concat(this.syncOn() ? ['sync'] : []), 'LINE UP THE KICKS', 'Spin ' + b + '\'s jog ' + (r.ms > 0 ? '◀ back' : 'forward ▶') + ' until the kicks meet', 'Close enough snaps together and LOCKS. You\'ll hear the two kicks hit as one.');
    }
    if (S === 'blend') {
      if (B.fader < 0.8) return H(['fad' + B.side], 'BRING DECK ' + b + ' IN', 'Fader ' + b + ' up across the phrase' + (this.mudT > 4 ? ' · try a LOW swap' : ''), 'Slow and steady sounds best. Tip: kill ' + b + '\'s LOW, then swap the LOWs halfway: a bass swap.');
      return H(['fad' + A.side], 'NOW TAKE ' + a + ' OUT', 'Fader ' + a + ' down', 'Fade the old record out and the new one is yours.');
    }
    if (S === 'party') {
      const pb = P.pbar, bib = P.bib;
      if (pb === 7) return H(['smp2', 'smp3', 'filter'], 'BAR 8: INTO THE 1', 'ROLL or SWEEP now, or let the FILTER go on the 1', 'These build up and land on the next phrase. Musical moments lift the crowd.');
      if (pb === 0 && bib < 2) return H(['smp1', 'smp0'], 'ON THE 1!', 'A HEY! (or the horn, once)', 'One shout on the 1 is a party. Ten is annoying.');
      return H(['filter', 'loop' + A.side], 'KEEP THE PARTY GOING', 'FILTER sweeps · LOOP a bar · pads', 'Hold LOOP to roll half a bar. Let go of loops and the filter on a 1.');
    }
    return null;
  }
  /* ---------------- autoplayer (tests + attract mode) ---------------- */
  // q: 1 = expert, 0.5 = sloppy, 0 = does nothing (the house helps). cont: leave the results card automatically
  autoplay(q, cont) { this.auto = { q: clamp(q, 0, 1), cont: cont !== false, R: mulberry32(this.seed ^ 0x9e37), k: null }; if (this.phase === 'intro') this.start(); return this; }
  autoStep(dt) {
    const A = this.auto, q = A.q, R = A.R; if (q <= 0.02) return;
    const M = this.mix, D = M.decks, L = D[this.live], B = D[1 - this.live], now = M.heard(), spb = 60 / L.bpm();
    const key = this.step + ':' + this.mixN; if (A.k !== key) { A.k = key; A.s = {}; }
    const s = A.s, gauss = () => (R() + R() + R() - 1.5) * 0.82;
    if (this.step === 'pick' && this.crate && !this.crate.chosen) {
      if (s.at === undefined) s.at = this.stepT + lerp(4, 1.2, q);
      if (this.stepT >= s.at) {
        const C = this.crate.cards, ord = C.map((c, i) => i).sort((a, b) => C[b].q - C[a].q);
        this.choose(q > 0.8 ? ord[0] : q > 0.4 ? ord[Math.floor(R() * 2)] : Math.floor(R() * C.length), false);
      }
    } else if (this.step === 'cue') {
      if (s.at === undefined) { const np = this.nextPhrase(0.3); s.at = np.t + gauss() * lerp(0.3, 0.008, q) + (q < 0.4 ? spb * Math.round(gauss() * 2) : 0); }
      if (now >= s.at) { this.playPress(B.side, s.at); s.at = Infinity; }
    } else if (this.step === 'match' && !this.lock) {
      const r = this.rel();
      if (!this.m.tempoOK) {
        if (s.err === undefined) { s.err = gauss() * lerp(0.012, 0, q); s.t = 0; }
        s.t += dt; s.err *= Math.pow(lerp(0.4, 0.01, q), dt);
        const target = L.bpm() / B.native - 1 + s.err;
        if (s.t > lerp(1.5, 0.4, q)) this.setPitch(B.side, approach(B.pitch, target, dt * lerp(0.012, 0.05, q)));
      } else if (Math.abs(r.ms) > this.tol.ms * 0.5) this.jogNudge(B.side, -Math.sign(r.ms) * lerp(0.025, 0.06, q));
      else B.nudge = 0;
    } else if (this.step === 'blend' && !this.autoBlend) {
      if (s.at === undefined) s.at = q >= 0.8 ? this.nextPhrase(0).t - M.latency() : now + lerp(3, 0.6, q);
      if (now >= s.at) {
        const bars = q >= 0.8 ? 4.2 : lerp(1.2, 2.6, q), k = (now - s.at) / (bars * 4 * spb);
        this.setFader(B.side, clamp(k / 0.5, 0, 1)); this.setFader(L.side, clamp((1 - k) / 0.5, 0, 1));
        if (q >= 0.9) { if (k < 0.5) B.low = false; else { B.low = true; L.low = false; } }
      }
    } else if (this.step === 'party') {
      const P = this.pos();
      if (q >= 0.8) {
        if (P.pbar === 7 && P.bib === 1 && !s.roll) { s.roll = true; this.padPress(this.mixN % 2 ? 3 : 2); }
      } else if (q >= 0.3 && !s.pad) { if (s.at === undefined) s.at = now + 1 + R() * 4; if (now >= s.at) { s.pad = true; this.padPress(Math.floor(R() * 4)); } }
    }
  }
  /* ---------------- 3D: camera, lights, lasers, CO2 ---------------- */
  camTarget(out) {
    const b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), port = Game.cssH > Game.cssW * 1.05;
    const back = port ? 3.4 : 4.2, up = port ? 2.85 : 2.5, look = 12;
    let x = b.x - f * back, y = b.y + up, z = b.z - c * back;
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
    if (this.camK === undefined || this.camK === 0) { const F = this.saved.camFrom; if (!F || Math.hypot(F.x - T.x, F.z - T.z) > 40) this.camK = 1; }
    const k = this.camK = Math.min(1, (this.camK || 0) + fdt / 1.1), e = easeInOut(k), A = this.saved.camFrom || T;
    cam.x = lerp(A.x, T.x, e); cam.y = lerp(A.y, T.y, e); cam.z = lerp(A.z, T.z, e);
    cam.tx = lerp(A.tx, T.tx, e); cam.ty = lerp(A.ty, T.ty, e); cam.tz = lerp(A.tz, T.tz, e);
    cam.fov = lerp(A.fov || 0.95, T.fov, e);
    const bounce = this.beatK * 0.035 * (0.4 + this.energy);
    cam.y += bounce; cam.ty += bounce * 0.5;
    if (g.shakeA > 0) { const s = g.shakeA * 0.3; cam.x += (Math.random() - 0.5) * s; cam.y += (Math.random() - 0.5) * s; g.shakeA = Math.max(0, g.shakeA - fdt * 1.8); }
    const L = this.L, H = Game.cssH;
    const top = L ? L.viewTop : 0, bot = L ? L.viewBot : H * 0.55;
    cam.shift = clamp(1 - (top + bot) / H, 0, 0.75) * e + (port ? 0.06 : 0.02) * (1 - e);
    cam.roll = 0; cam.near = 0.15; cam.far = 1500;
    const b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), on = this.phase === 'play' || this.phase === 'results';
    const beatN = Math.max(0, this.lastBeat), col = this.redK > 0.3 ? [1, 0.15, 0.1] : beatN % 2 ? [1, 0.31, 0.85] : [0.22, 0.95, 1];
    g.plights.push({ x: b.x + f * 1.2, y: b.y + 1.8, z: b.z + c * 1.2, r: 7, c: col, i: 0.6 + (on ? this.beatK * 0.9 : 0) });
    if (on) {
      const e2 = this.energy, hue = (this.t * 40 + beatN * 25) % 360, wc = this.redK > 0.3 ? [1, 0.1, 0.05] : burnsRGBf(burnsHSL(hue, 0.9, 0.55));
      g.plights.push({ x: b.x + f * 8, y: b.y + 5, z: b.z + c * 8, r: 16, c: wc, i: 0.4 + e2 * 0.9 + this.dropK * 1.5 });
      if (this.dropK > 0.05) g.plights.push({ x: b.x + f * 4, y: b.y + 6, z: b.z + c * 4, r: 22, c: [1, 1, 1], i: this.dropK * 2 * (Math.floor(this.rt * 16) % 2 ? 1 : 0.2) });
    }
  }
  // bones: 0 table, 1 platter A, 2 platter B (spinning at each record's speed)
  poseDeck() {
    const B = this.fx3d.ch.bones, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    const ox = b.x + f * 0.62, oz = b.z + c * 0.62, sp = this.spin || [0, 0];
    BurnsM.a34Set(B, 0, ox, b.y, oz, b.yaw, 0, 0, 1, 1, 1);
    BurnsM.a34Set(B, 12, ox + rx * 0.52, b.y + 1.0, oz + rz * 0.52, b.yaw - sp[0], 0, 0, 1, 1, 1);
    BurnsM.a34Set(B, 24, ox - rx * 0.52, b.y + 1.0, oz - rz * 0.52, b.yaw - sp[1] + 1.3, 0, 0, 1, 1, 1);
  }
  dropFx(k) {
    const g = this.g, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw);
    this.dropK = k; this.flashK = Math.max(this.flashK, 0.35 * k);
    burnsSfx('neon_flash', { vol: 0.35 * k });
    g.shake(0.2 * k);
    this.co2.push({ t: 0, dur: 1.3 });
    g.fx.confetti(b.x + f * 6, b.y + 4.5, b.z + c * 6, Math.round(40 * k));
    const p = g.player; if (p.ch.anim === 'burnsDJBrady') p.ch.k.pump = 1;
  }
  fxStep(dt) {
    const g = this.g, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    this.dropK = Math.max(0, this.dropK - dt * 0.6); this.flashK = Math.max(0, this.flashK - dt * 2.5);
    for (let i = 0; i < 4; i++) this.padK[i] = Math.max(0, this.padK[i] - dt * 4);
    for (const k in this.btnK) if (typeof this.btnK[k] === 'number' && k !== 'lockMsg') this.btnK[k] = Math.max(0, this.btnK[k] - dt * 4);
    this.spin = this.spin || [0, 0];
    if (this.mix) for (let i = 0; i < 2; i++) { const d = this.mix.decks[i]; if (d.playing && !this.paused) this.spin[i] += dt * 0.5555 * TAU * (d.bpm() / d.native) * (1 + d.nudge); }
    this.riser = this.phase === 'play' ? Math.max(Math.abs(this.filt.v) * 0.9, this.riser - dt * 2) : 0;
    this.pops = this.pops.filter(p => (p.t += dt) < 1.1);
    if (this.big) { this.big.t += dt; if (this.big.t > this.big.dur) this.big = null; }
    for (const C of this.co2) {
      C.t += dt;
      if (C.t < C.dur) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
        const x = b.x + rx * sd * 3.2 + f * 1.4, z = b.z + rz * sd * 3.2 + c * 1.4;
        g.fx.add(x + (Math.random() - 0.5) * 0.3, b.y + 0.6, z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 1.6 + f * 1.5, 11 + Math.random() * 5, (Math.random() - 0.5) * 1.6 + c * 1.5, 1.1 + Math.random() * 0.5, 0.6, 3.2, [0.95, 0.97, 1], 0.5, 'smoke', 4);
      }
    }
    this.co2 = this.co2.filter(C => C.t < C.dur + 0.1);
    if (this.riser > 0.1 && Math.random() < this.riser * 0.6) g.fx.add(b.x + f * 2 + (Math.random() - 0.5) * 6, b.y + 0.3, b.z + c * 2 + (Math.random() - 0.5) * 6, 0, 3 + this.riser * 6, 0, 0.8, 0.25, 0.05, [1, 0.9, 0.5], 1, 'spark', 1);
    if (this.phase === 'play' && this.energy > 0.6 && Math.random() < (this.energy - 0.55) * 0.3) g.fx.notes(b.x + f * (6 + Math.random() * 6) + (Math.random() - 0.5) * 8, b.y + 2.5, b.z + c * (6 + Math.random() * 6) + (Math.random() - 0.5) * 8);
    if (this.mix && this.phase === 'play') this.loopHoldCheck();
  }
  draw3d(R) {
    if (!this.active) return;
    const S = BURNS_SPRITES.R, b = this.booth, f = Math.sin(b.yaw), c = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    const on = this.phase === 'play' || this.phase === 'results', t = on ? this.t : this.rt, e = this.energy, beatN = Math.max(0, this.lastBeat);
    const dA = burnsRGBf('#ff4fd8'), dB = burnsRGBf('#38f2ff');
    R.bbs.bb(b.x + f * 0.9 + rx * 0.7, b.y + 1.15, b.z + c * 0.9 + rz * 0.7, 1.5, 1.5, S.glow, dA, 0.55 + this.beatK * 0.4, true);
    R.bbs.bb(b.x + f * 0.9 - rx * 0.7, b.y + 1.15, b.z + c * 0.9 - rz * 0.7, 1.5, 1.5, S.glow, dB, 0.55 + this.beatK * 0.4, true);
    R.bbs.bb(b.x + f * 1.0, b.y + 0.9, b.z + c * 1.0, 3.4, 1.4, S.glow, this.redK > 0.3 ? [1, 0.2, 0.1] : [1, 0.85, 0.6], 0.25 + e * 0.3, true);
    if (!on) return;
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
    const pal = this.redK > 0.3 ? [[1, 0.15, 0.1], [1, 0.3, 0.1]] : [[0.3, 1, 0.4], [0.22, 0.95, 1], [1, 0.3, 0.85], [1, 0.9, 0.3]];
    const n = 4 + Math.round(e * 6), sweep = Math.sin(t * Math.PI * this.curBpm() / 120), build = this.riser;
    const ai = 0.25 + e * 0.6 + this.dropK * 0.6;
    for (const sd of [-1, 1]) {
      const ex = b.x + rx * sd * 2.4 + f * 0.6, ez = b.z + rz * sd * 2.4 + c * 0.6, ey = b.y + 3.2;
      const col = pal[(Math.floor(beatN / 4) + (sd > 0 ? 1 : 0)) % pal.length];
      R.bbs.bb(ex, ey, ez, 0.9, 0.9, S.glow, col, 0.9, true);
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : i / (n - 1) - 0.5;
        const ang = (u * 1.3 * (1 - build * 0.85) + sweep * 0.45 * sd), el = 0.05 + 0.25 * Math.sin(t * 1.3 + i) * (1 - build) + build * 0.35;
        const dl = 40, hx = Math.sin(b.yaw + ang), hz = Math.cos(b.yaw + ang);
        laser(ex, ey, ez, ex + hx * dl, ey + el * dl, ez + hz * dl, 0.055 + this.dropK * 0.04, col, ai * (0.7 + 0.3 * Math.sin(t * 7 + i)));
      }
    }
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(t * 1.1 + i * 2.1), x0 = b.x + rx * (i - 1) * 3 + f * 0.5, z0 = b.z + rz * (i - 1) * 3 + c * 0.5, y0 = b.y + 6.5;
      const tx = b.x + f * (9 + i * 2) + rx * sw * 6, tz = b.z + c * (9 + i * 2) + rz * sw * 6;
      const dx = tx - x0, dy = (b.y) - y0, dz = tz - z0, px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(px, py) || 1;
      const col = burnsRGBf(burnsHSL((t * 30 + i * 120) % 360, 0.8, 0.6)), a = 0.12 + e * 0.2 + this.beatK * 0.1;
      R.bbs.quad((x0 + tx) / 2, (y0 + b.y) / 2, (z0 + tz) / 2, -py / l * 2.2, px / l * 2.2, px / 2, py / 2, S.beam, col[0] * a, col[1] * a, col[2] * a, 0);
    }
  }
  /* ---------------- 2D: layout (deck A left, mixer in the middle, deck B right) ---------------- */
  layout() {
    const W = Game.cssW, H = Game.cssH, port = H > W * 1.05, s = BurnsUI.safe();
    const L = { W, H, port, s, ctl: {} }, C = L.ctl, pw = W - s.l - s.r, bot = H - s.b;
    L.pause = { x: W - s.r - 20, y: s.t + 20, r: 18 };
    const easy = this.tier === 0;
    let deckY, deckH, mixW, deckW, lanesY, lanesH, laneH, cntH;
    if (port) {
      const fxH = clamp(H * 0.066, 44, 60), fxY = bot - fxH;
      deckH = clamp(H * 0.215, 150, 200); deckY = fxY - 8 - deckH;
      laneH = clamp(H * 0.022, 15, 20); cntH = 20; lanesH = cntH + 4 + laneH * 2 + 4;
      lanesY = deckY - 8 - lanesH;
      mixW = clamp(pw * 0.33, 112, 150); deckW = (pw - mixW - 12) / 2;
      const pdw = (pw - 18) / 4;
      for (let i = 0; i < 4; i++) C['smp' + i] = { x: s.l + i * (pdw + 6), y: fxY, w: pdw, h: fxH };
    } else {
      deckH = clamp(H * 0.45, 150, 196); deckY = bot - deckH;
      laneH = 15; cntH = 18; lanesH = cntH + 3 + laneH * 2 + 3;
      lanesY = deckY - 6 - lanesH;
      mixW = clamp(pw * 0.34, 236, 320); deckW = (pw - mixW - 16) / 2;
    }
    const gap = port ? 6 : 8, mx = s.l + deckW + gap;
    L.panel = { x: 0, y: lanesY - 8, w: W, h: H - (lanesY - 8) };
    // the two decks
    L.deck = [];
    for (let i = 0; i < 2; i++) {
      const x0 = i === 0 ? s.l : mx + mixW + gap, w = deckW, y = deckY, h = deckH, out = i === 0;
      const dk = { x: x0, y, w, h }; L.deck.push(dk);
      const pW = port ? 24 : 26;
      C['pitch' + i] = { x: out ? x0 : x0 + w - pW, y: y + 18, w: pW, h: h - 20 };
      if (port) {
        const ix = out ? x0 + pW + 6 : x0, iw = w - pW - 6, r = Math.max(30, Math.min(iw, h - 18 - 56) / 2);
        C['jog' + i] = { x: ix + iw / 2, y: y + 18 + r + 2, r };
        const by = y + 18 + r * 2 + 8, bh = Math.max(36, Math.min(48, y + h - by));
        C['play' + i] = { x: out ? ix : ix + iw / 2 + 3, y: by, w: iw / 2 - 3, h: bh };
        C['loop' + i] = { x: out ? ix + iw / 2 + 3 : ix, y: by, w: iw / 2 - 3, h: bh };
        dk.label = { x: ix, y, w: iw, h: 16 };
      } else {
        const bW = 62, jx0 = out ? x0 + pW + 8 : x0 + bW + 8, jw = w - pW - bW - 16, r = Math.max(36, Math.min(jw, h - 22) / 2);
        C['jog' + i] = { x: jx0 + jw / 2, y: y + 20 + (h - 20) / 2, r };
        const bx = out ? x0 + w - bW : x0, ph = (h - 20) * 0.56;
        C['play' + i] = { x: bx, y: y + 18, w: bW, h: ph - 4 };
        C['loop' + i] = { x: bx, y: y + 18 + ph, w: bW, h: h - 20 - ph };
        dk.label = { x: jx0 - 4, y, w: jw + 8, h: 16 };
      }
    }
    // the mixer
    L.mixer = { x: mx, y: deckY, w: mixW, h: deckH };
    {
      let cx = mx, cw = mixW;
      if (!port) {
        const sw = 54;
        C.smp0 = { x: mx, y: deckY, w: sw, h: (deckH - 6) / 2 }; C.smp1 = { x: mx, y: deckY + (deckH + 6) / 2, w: sw, h: (deckH - 6) / 2 };
        C.smp2 = { x: mx + mixW - sw, y: deckY, w: sw, h: (deckH - 6) / 2 }; C.smp3 = { x: mx + mixW - sw, y: deckY + (deckH + 6) / 2, w: sw, h: (deckH - 6) / 2 };
        cx = mx + sw + 6; cw = mixW - 2 * (sw + 6);
      }
      const lowH = port ? 28 : 26, filH = port ? 30 : 28;
      C.low0 = { x: cx, y: deckY, w: cw / 2 - 3, h: lowH }; C.low1 = { x: cx + cw / 2 + 3, y: deckY, w: cw / 2 - 3, h: lowH };
      const fy = deckY + lowH + 6, fh = deckH - lowH - filH - 14, fw = clamp(cw * 0.32, 36, 50);
      C.fad0 = { x: cx + cw * 0.25 - fw / 2, y: fy, w: fw, h: fh }; C.fad1 = { x: cx + cw * 0.75 - fw / 2, y: fy, w: fw, h: fh };
      C.filter = { x: cx, y: deckY + deckH - filH, w: cw, h: filH };
      L.mixC = { x: cx, w: cw };
    }
    // phrase counter + the two kick lanes (+ SYNC on easy)
    const lw = pw - (easy ? 62 : 0);
    L.lanes = { x: s.l, y: lanesY, w: lw, h: lanesH, cnt: { x: s.l, y: lanesY, w: lw, h: cntH } };
    L.lane = [{ x: s.l, y: lanesY + cntH + (port ? 4 : 3), w: lw, h: laneH }, { x: s.l, y: lanesY + cntH + (port ? 4 : 3) * 2 + laneH, w: lw, h: laneH }];
    C.sync = easy ? { x: s.l + pw - 56, y: lanesY + cntH + 3, w: 56, h: laneH * 2 + 4 } : null;
    L.top = { y: s.t + 2, h: port ? 54 : 36 };
    L.viewTop = L.top.y + L.top.h; L.viewBot = L.panel.y;
    // the crate: rows in portrait, columns in landscape
    L.prompt = { y: L.viewTop + (port ? 6 : 2), h: (port ? 44 : 34) + (this.teach ? (port ? 28 : 14) : 0) };
    if (port) {
      const y0 = L.prompt.y + L.prompt.h + 18, y1 = L.panel.y - 6, ch = Math.min(96, (y1 - y0 - 12) / 3);
      L.crate = [0, 1, 2].map(i => ({ x: s.l, y: y0 + i * (ch + 6), w: pw, h: ch }));
    } else {
      const y0 = L.prompt.y + L.prompt.h + 16, y1 = deckY - 6, cw = (pw - 16) / 3;
      L.crate = [0, 1, 2].map(i => ({ x: s.l + i * (cw + 8), y: y0, w: cw, h: y1 - y0 }));
    }
    const bw = Math.min(260, W * 0.6);
    L.introY = port ? H * 0.16 : L.viewTop + 12;
    L.startBtn = { x: (W - bw) / 2, y: port ? H * 0.16 + 78 : L.viewTop + 66, w: bw, h: 44 };
    L.menu = [0, 1, 2].map(i => ({ x: (W - bw) / 2, y: H * 0.3 + i * 54, w: bw, h: 44 }));
    this.L = L;
    return L;
  }
  /* ---------------- 2D: drawing ---------------- */
  draw(ctx, fdt) {
    const g = this.g, W = Game.cssW, H = Game.cssH;
    const L = this.layout();
    ctx.save();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const slide = easeOut(clamp(this.rt / 0.6, 0, 1)), outK = this.phase === 'out' ? clamp(this.outT / 0.4, 0, 1) : 0;
    const off = (1 - slide) * (H - L.panel.y) + outK * (H - L.panel.y);
    const glowCol = this.redK > 0.3 ? '255,59,92' : this.lastBeat % 2 ? '255,79,216' : '56,242,255';
    const gg = ctx.createLinearGradient(0, L.panel.y - 90 + off, 0, L.panel.y + off);
    gg.addColorStop(0, `rgba(${glowCol},0)`); gg.addColorStop(1, `rgba(${glowCol},${0.12 + this.beatK * 0.18 * (0.5 + this.energy)})`);
    ctx.fillStyle = gg; ctx.fillRect(0, L.panel.y - 90 + off, W, 90);
    ctx.save(); ctx.translate(0, off);
    this.drawPanel(ctx, L);
    ctx.restore();
    if (this.phase !== 'intro' || this.rt > 0.3) this.drawTop(ctx, L);
    this.drawShouts(ctx, L);
    if (this.phase === 'play' && !this.paused) { this.drawPrompt(ctx, L); if (this.step === 'pick') this.drawCrate(ctx, L); this.drawHighlights(ctx, L); }
    this.drawCenter(ctx, L);
    this.drawPops(ctx, L);
    if (this.redK > 0.02) { ctx.fillStyle = `rgba(255,30,60,${this.redK * 0.12 * (0.6 + this.beatK * 0.4)})`; ctx.fillRect(0, 0, W, H); }
    if (this.phase === 'intro') this.drawIntro(ctx, L);
    if (this.phase === 'results' || this.phase === 'out') this.drawResults(ctx, L);
    if (this.paused) this.drawPause(ctx, L);
    if (this.flashK > 0.01) { ctx.fillStyle = `rgba(255,255,255,${this.flashK * 0.5})`; ctx.fillRect(0, 0, W, H); }
    if (g.flashA > 0) { ctx.fillStyle = rgba(g.flashC || '#ffffff', Math.min(1, g.flashA)); ctx.fillRect(0, 0, W, H); g.flashA = Math.max(0, g.flashA - fdt * 1.6); }
    g.fade = approach(g.fade, g.fadeTarget, fdt * g.fadeRate);
    if (g.fade > 0.001) { ctx.fillStyle = `rgba(6,3,12,${g.fade})`; ctx.fillRect(0, 0, W, H); }
    if (outK > 0) { ctx.fillStyle = `rgba(6,3,12,${outK * 0.6})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  drawPanel(ctx, L) {
    const P = L.panel, W = L.W;
    ctx.save();
    const bg = ctx.createLinearGradient(0, P.y, 0, P.y + P.h); bg.addColorStop(0, '#1d1a26'); bg.addColorStop(0.08, '#14121b'); bg.addColorStop(1, '#09080d');
    ctx.fillStyle = bg; burnsRR(ctx, P.x - 2, P.y, P.w + 4, P.h + 20, 18); ctx.fill();
    ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
    for (let y = P.y + 6; y < P.y + P.h; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    const edge = ctx.createLinearGradient(0, 0, W, 0); edge.addColorStop(0, '#ff4fd8'); edge.addColorStop(0.5, '#ffe24a'); edge.addColorStop(1, '#38f2ff');
    ctx.strokeStyle = edge; ctx.lineWidth = 2 + this.beatK * 2; ctx.globalAlpha = 0.55 + this.beatK * 0.45;
    ctx.beginPath(); ctx.moveTo(14, P.y + 1); ctx.lineTo(W - 14, P.y + 1); ctx.stroke();
    ctx.restore();
    if (L.port || this.step !== 'pick' || this.phase !== 'play') this.drawLanes(ctx, L);
    for (let i = 0; i < 2; i++) this.drawDeck(ctx, L, i);
    this.drawMixer(ctx, L);
    for (let i = 0; i < 4; i++) this.drawPad(ctx, L.ctl['smp' + i], i);
    if (L.ctl.sync) this.drawSync(ctx, L.ctl.sync);
  }
  deckCol(i) { return i === 0 ? '#ff4fd8' : '#38f2ff'; }
  // phrase counter (bars 1-8 of the live record, the 1 in yellow) + both records' kicks on one time line
  drawLanes(ctx, L) {
    const M = this.mix, C = L.lanes.cnt, play = this.phase === 'play' || this.phase === 'results';
    const P = play && M ? this.pos() : { pbar: 0, bib: 0, beat: 0 };
    ctx.save();
    // counter
    const bs = Math.min(18, C.h - 2), bx0 = C.x + (L.port ? 50 : 46);
    BurnsUI.text(ctx, 'PHRASE', C.x + 2, C.y + C.h / 2, 9, 'rgba(255,255,255,0.6)', { align: 'left', stroke: false, ui: true });
    for (let k = 0; k < 8; k++) {
      const x = bx0 + k * (bs + 3), on = play && P.pbar === k, one = k === 0;
      ctx.fillStyle = on ? (one ? '#ffe24a' : '#ffffff') : one ? 'rgba(255,226,74,0.22)' : 'rgba(255,255,255,0.08)';
      if (on) { ctx.shadowColor = one ? '#ffe24a' : '#ffffff'; ctx.shadowBlur = 8; }
      burnsRR(ctx, x, C.y + (C.h - bs) / 2, bs, bs, 4); ctx.fill(); ctx.shadowBlur = 0;
      BurnsUI.text(ctx, String(k + 1), x + bs / 2, C.y + C.h / 2 + 0.5, 10, on ? '#1a1024' : one ? '#ffe24a' : 'rgba(255,255,255,0.5)', { stroke: false });
    }
    const dx0 = bx0 + 8 * (bs + 3) + 6;
    for (let k = 0; k < 4; k++) { ctx.fillStyle = play && P.bib === k ? (k === 0 ? '#ff3b5c' : '#ffe24a') : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(dx0 + k * 11, C.y + C.h / 2, k === 0 ? 4 : 3.3, 0, TAU); ctx.fill(); }
    // status: tempo / phase / LOCKED
    const st = this.laneStatus();
    if (st) { ctx.font = `600 10px ${FONT_UI}`; const tw = ctx.measureText(st.txt).width + 16, x = C.x + C.w - tw; if (x > dx0 + 44) { ctx.fillStyle = rgba(st.col, 0.18); burnsRR(ctx, x, C.y + 1, tw, C.h - 2, (C.h - 2) / 2); ctx.fill(); BurnsUI.text(ctx, st.txt, x + tw / 2, C.y + C.h / 2 + 0.5, 10, st.col, { stroke: false, ui: true }); } }
    // lanes
    const tv = M ? M.heard() : 0, span = 3.0, cxF = 0.36;
    for (let i = 0; i < 2; i++) {
      const r = L.lane[i], col = this.deckCol(i), d = M && M.decks[i];
      ctx.fillStyle = 'rgba(8,6,14,0.85)'; burnsRR(ctx, r.x, r.y, r.w, r.h, 5); ctx.fill();
      const live = d && d.playing && d.crowd > 0.05;
      ctx.strokeStyle = rgba(col, live ? 0.8 : 0.3); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.beginPath(); burnsRR(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 4); ctx.clip();
      const nowX = r.x + r.w * cxF, pps = r.w / span;
      if (d && d.trk && play) {
        const locked = this.lock && i !== this.live;
        const drawBeat = (tb, kick, bar, phrase, ghost) => {
          const x = nowX + (tb - tv) * pps; if (x < r.x - 8 || x > r.x + r.w + 8) return;
          const past = x < nowX - 2;
          if (kick) {
            const kc = locked ? '#7aff5a' : col;
            ctx.globalAlpha = ghost ? 0.3 : past ? 0.35 : 1;
            ctx.fillStyle = kc; burnsRR(ctx, x - 3, r.y + 2, 6, r.h - 4, 3); ctx.fill();
            if (phrase) { ctx.strokeStyle = '#ffe24a'; ctx.lineWidth = 1.5; ctx.stroke(); }
            else if (bar) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); }
          } else { ctx.globalAlpha = ghost ? 0.2 : 0.4; ctx.fillStyle = phrase ? '#ffe24a' : '#ffffff'; ctx.fillRect(x - 0.5, r.y + r.h * (bar ? 0.2 : 0.38), 1, r.h * (bar ? 0.6 : 0.24)); }
          ctx.globalAlpha = 1;
        };
        if (d.playing) {
          const b0 = Math.floor(d.beatAt(tv - span * cxF)) - 1, b1 = Math.ceil(d.beatAt(tv + span * (1 - cxF))) + 1;
          for (let b = Math.max(0, b0); b <= b1; b++) { const s = b * 4; drawBeat(d.timeOfStep(s), d.kickAt(s), b % 4 === 0, b % 32 === 0); }
        } else if (i !== this.live && M.decks[this.live].playing && this.step === 'cue') {
          // cued: where its kicks will land if PLAY goes down on the next 1
          const np = this.nextPhrase(0), sd = d.sd();
          for (let b = 0; b < 12; b++) drawBeat(np.t + b * 4 * sd, d.kick ? d.kick.at(d.cueStep + b * 4) : 1, b % 4 === 0, b === 0, true);
          if (nowX + (np.t - tv) * pps > r.x + r.w - 20) BurnsUI.text(ctx, 'AB'[i] + ' STARTS ON THE NEXT 1 ▶', r.x + r.w - 8, r.y + r.h / 2, 9, '#38f2ff', { align: 'right', stroke: false, ui: true });
        }
      } else if (play) BurnsUI.text(ctx, i === 1 - this.live && this.step === 'pick' ? 'PICK A RECORD ▲' : '— empty —', r.x + r.w * 0.62, r.y + r.h / 2, 9, 'rgba(255,255,255,0.4)', { stroke: false, ui: true });
      // now line + deck chip
      ctx.fillStyle = '#ffffff'; ctx.fillRect(nowX - 1, r.y, 2, r.h);
      ctx.restore();
      ctx.fillStyle = col; burnsRR(ctx, r.x + 3, r.y + 2, 15, r.h - 4, 3); ctx.fill();
      BurnsUI.text(ctx, 'AB'[i], r.x + 10.5, r.y + r.h / 2 + 0.5, 10, '#1a1024', { stroke: false });
    }
    // locked: a green bracket joining the lanes at the now line
    if (this.lock && play) { const x = L.lane[0].x + L.lane[0].w * cxF; ctx.strokeStyle = '#7aff5a'; ctx.lineWidth = 3; ctx.shadowColor = '#7aff5a'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(x, L.lane[0].y + 2); ctx.lineTo(x, L.lane[1].y + L.lane[1].h - 2); ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.restore();
  }
  laneStatus() {
    if (this.phase !== 'play' || !this.mix) return null;
    const D = this.mix.decks, B = D[1 - this.live];
    if (this.lock) return { txt: '● LOCKED', col: '#7aff5a' };
    if (!B.playing) return this.step === 'cue' ? { txt: 'CUED · ' + B.bpm().toFixed(1) + ' BPM', col: '#38f2ff' } : null;
    const r = this.rel();
    if (!this.m.tempoOK) return { txt: 'AB'[B.side] + ' ' + (r.bpm > 0 ? '+' : '') + r.bpm.toFixed(1) + ' BPM', col: Math.abs(r.bpm) < 1 ? '#ffe24a' : '#ff6a6a' };
    return { txt: Math.abs(Math.round(r.ms)) + ' ms ' + (r.ms > 0 ? 'early' : 'late'), col: Math.abs(r.ms) < this.tol.ms * 1.6 ? '#ffe24a' : '#ff6a6a' };
  }
  drawDeck(ctx, L, i) {
    const C = L.ctl, M = this.mix, d = M ? M.decks[i] : null, col = this.deckCol(i), dk = L.deck[i], play = this.phase === 'play' || this.phase === 'results';
    const live = play && i === this.live, prep = play && !live;
    ctx.save();
    // label: letter, state, BPM
    const lb = dk.label;
    ctx.fillStyle = col; burnsRR(ctx, lb.x, lb.y, 16, 15, 4); ctx.fill();
    BurnsUI.text(ctx, 'AB'[i], lb.x + 8, lb.y + 8, 11, '#1a1024', { stroke: false });
    let st = '', stc = 'rgba(255,255,255,0.5)';
    if (d && d.trk) { if (live) { st = 'LIVE'; stc = '#ff3b5c'; } else if (d.playing && d.cue && d.fader < 0.3) { st = '🎧 CUE'; stc = '#38f2ff'; } else if (d.playing) { st = 'ON'; stc = '#7aff5a'; } else { st = 'READY'; stc = '#ffe24a'; } }
    else if (play) st = 'EMPTY';
    BurnsUI.text(ctx, st, lb.x + 21, lb.y + 8, 9, stc, { align: 'left', stroke: false, ui: true });
    if (d && d.trk) {
      const A = M.decks[this.live], both = prep && d.playing, diff = both ? d.bpm() - A.bpm() : 0;
      const bc = !both ? '#ffffff' : this.lock || Math.abs(diff) < this.tol.bpm ? '#7aff5a' : Math.abs(diff) < 1.5 ? '#ffe24a' : '#ff6a6a';
      BurnsUI.text(ctx, d.bpm().toFixed(1), lb.x + lb.w, lb.y + 8, 11, bc, { align: 'right', stroke: false });
    }
    ctx.restore();
    this.drawPitch(ctx, C['pitch' + i], d, i);
    this.drawJog(ctx, C['jog' + i], d, i);
    // PLAY: pulses on the cued deck, counts down the last bar
    const pb = C['play' + i], cued = prep && d && d.trk && !d.playing && this.step === 'cue';
    let ptxt = '▶', psub = 'PLAY', pcol = '#2a2833', glow = 0;
    if (d && d.playing) { ptxt = '▶'; pcol = live ? '#1e5a2a' : '#1a4a5a'; psub = live ? 'LIVE' : 'PLAYING'; }
    if (cued) {
      const P = this.pos(), left = 32 - ((P.beat % 32) + 32) % 32;
      glow = 0.6 + 0.4 * Math.sin(this.rt * 8); pcol = '#6a5a10';
      if (left <= 4.2) { ptxt = String(Math.max(1, Math.ceil(left))); psub = 'GET READY'; }
      else if (left > 31) { ptxt = 'NOW'; psub = 'PLAY!'; pcol = '#2a7a20'; }
      else psub = 'ON THE 1';
    }
    this.btn(ctx, pb, ptxt, psub, pcol, cued ? '#ffe24a' : col, glow, this.btnK['play' + i]);
    const lp = C['loop' + i], lon = d && d.loop;
    this.btn(ctx, lp, lon ? (d.loop.half ? '½' : '1') : '⟲', lon ? 'LOOPING' : 'LOOP', lon ? '#1a4a6a' : '#22202a', lon ? '#38f2ff' : 'rgba(255,255,255,0.25)', lon ? 0.5 + 0.5 * this.beatK : 0, this.btnK['loop' + i]);
  }
  btn(ctx, r, txt, sub, fill, stroke, glow, press) {
    if (!r) return;
    ctx.save();
    const k = press || 0;
    if (glow) { ctx.shadowColor = stroke; ctx.shadowBlur = 8 + glow * 14; }
    const bg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); bg.addColorStop(0, shade(fill, 0.25 + k * 0.3)); bg.addColorStop(1, shade(fill, -0.25));
    ctx.fillStyle = bg; burnsRR(ctx, r.x + k, r.y + k, r.w - 2 * k, r.h - 2 * k, 9); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = stroke; ctx.lineWidth = glow ? 2 : 1.2; ctx.stroke();
    const big = Math.min(r.h * 0.42, r.w * 0.36, 22);
    BurnsUI.text(ctx, txt, r.x + r.w / 2, r.y + r.h * (sub ? 0.42 : 0.5), txt.length > 3 ? big * 0.7 : big, '#ffffff', { stroke: false });
    if (sub) BurnsUI.text(ctx, sub, r.x + r.w / 2, r.y + r.h - Math.min(9, r.h * 0.18), Math.min(8.5, r.w * 0.16), 'rgba(255,255,255,0.75)', { stroke: false, ui: true });
    ctx.restore();
  }
  drawPitch(ctx, r, d, i) {
    if (!r) return;
    const col = this.deckCol(i);
    ctx.save();
    ctx.fillStyle = '#0b0a10'; burnsRR(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    const cx = r.x + r.w / 2, top = r.y + 14, len = r.h - 28;
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - 1, top, 2, len);
    for (let k = 0; k <= 8; k++) { const y = top + len * k / 8; ctx.fillRect(cx - (k === 4 ? 7 : 4), y, k === 4 ? 14 : 8, 1); }
    // where the pitch would match the live record (a green tick) while matching
    if (d && d.trk && i !== this.live && this.phase === 'play' && this.step === 'match' && !this.lock && this.tier < 2) {
      const tgt = clamp(this.mix.decks[this.live].bpm() / d.native - 1, -0.08, 0.08), ty = top + len / 2 - tgt / 0.08 * len / 2;
      ctx.fillStyle = 'rgba(122,255,90,0.55)'; ctx.fillRect(r.x + 2, ty - 1, r.w - 4, 2);
    }
    const v = d ? clamp(d.pitch / 0.08, -1, 1) : 0, ky = top + len / 2 - v * len / 2;
    const kg = ctx.createLinearGradient(0, ky - 8, 0, ky + 8); kg.addColorStop(0, '#e8e8f4'); kg.addColorStop(1, '#6a6a7a');
    ctx.fillStyle = kg; burnsRR(ctx, r.x + 2, ky - 8, r.w - 4, 16, 4); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(r.x + 4, ky - 1, r.w - 8, 2);
    BurnsUI.text(ctx, '+', cx, r.y + 7, 10, 'rgba(255,255,255,0.7)', { stroke: false });
    BurnsUI.text(ctx, '−', cx, r.y + r.h - 7, 10, 'rgba(255,255,255,0.7)', { stroke: false });
    if (d && d.trk && Math.abs(d.pitch) > 0.0004) BurnsUI.text(ctx, (d.pitch > 0 ? '+' : '') + (d.pitch * 100).toFixed(1), cx, ky + (v > 0 ? 16 : -16), 8, '#ffffff', { stroke: true, ui: true, sw: 2.5 });
    ctx.restore();
  }
  drawJog(ctx, J, d, i) {
    if (!J) return;
    const col = this.deckCol(i), x = J.x, y = J.y, R = J.r, ang = (this.spin ? this.spin[i] : 0) + this.jogSpin[i];
    ctx.save();
    const og = ctx.createRadialGradient(x - R * 0.3, y - R * 0.4, R * 0.1, x, y, R);
    og.addColorStop(0, '#5a5a6a'); og.addColorStop(0.7, '#25242e'); og.addColorStop(1, '#121118');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    // LED ring: one lap per bar of this record
    const segs = 32, playing = d && d.playing && this.mix;
    const barPos = playing ? ((d.beatAt(this.mix.heard()) % 4) + 4) % 4 / 4 : 0, lit = Math.floor(barPos * segs);
    for (let k = 0; k < segs; k++) {
      const a0 = -Math.PI / 2 + k / segs * TAU + 0.02, a1 = a0 + TAU / segs - 0.05, on = playing && k <= lit;
      ctx.strokeStyle = on ? (k % 8 === 0 ? '#ffffff' : col) : 'rgba(255,255,255,0.08)'; ctx.globalAlpha = on ? (k === lit ? 1 : 0.65) : 1;
      ctx.lineWidth = R * 0.06; ctx.beginPath(); ctx.arc(x, y, R * 0.9, a0, a1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const pg = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 0.82); pg.addColorStop(0, '#1c1b24'); pg.addColorStop(1, '#0a0a0e');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, R * 0.82, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let rr = R * 0.38; rr < R * 0.8; rr += R * 0.055) { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const sh = ctx.createLinearGradient(-R * 0.8, 0, R * 0.8, 0); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.65, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -R * 0.34); ctx.lineTo(0, -R * 0.78); ctx.stroke();
    const lg = ctx.createRadialGradient(-R * 0.08, -R * 0.1, 1, 0, 0, R * 0.34); lg.addColorStop(0, shade(col, 0.35)); lg.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = d && d.trk ? lg : '#2a2833'; ctx.beginPath(); ctx.arc(0, 0, R * 0.33, 0, TAU); ctx.fill();
    ctx.restore();
    // the record's name around the label (short)
    if (d && d.trk) {
      const nm = d.trk.name.length > 16 ? d.trk.name.slice(0, 15) + '…' : d.trk.name;
      BurnsUI.text(ctx, nm, x, y + R * 0.52, Math.max(7, Math.min(9, R * 0.13)), 'rgba(255,255,255,0.8)', { stroke: true, ui: true, sw: 2.5 });
      BurnsUI.text(ctx, d.trk.cam || '', x, y - R * 0.5, Math.max(7, Math.min(9, R * 0.13)), 'rgba(255,255,255,0.6)', { stroke: true, ui: true, sw: 2.5 });
    }
    BurnsUI.text(ctx, 'AB'[i], x, y + 1, R * 0.26, '#ffffff', { stroke: false });
    const touched = this.touching('jog' + i);
    if (touched || (d && d.nudge)) { ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x, y, R + 2, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.restore();
  }
  drawMixer(ctx, L) {
    const C = L.ctl, M = this.mix, D = M ? M.decks : null;
    ctx.save();
    const mx = L.mixer; ctx.fillStyle = 'rgba(255,255,255,0.03)'; burnsRR(ctx, mx.x, mx.y - 2, mx.w, mx.h + 4, 10); ctx.fill();
    for (let i = 0; i < 2; i++) {
      const d = D && D[i], col = this.deckCol(i);
      // LOW kill
      const lr = C['low' + i], on = !d || d.low;
      this.btn(ctx, lr, on ? 'LOW' : 'LOW ✕', null, on ? shade(col, -0.55) : '#3a0a14', on ? rgba(col, 0.7) : '#ff3b5c', on ? 0 : 0.4, this.btnK['low' + i]);
      // upfader
      const r = C['fad' + i], v = d ? d.fader : (i === 0 ? 1 : 0), top = r.y + 12, len = r.h - 24;
      ctx.fillStyle = '#07060b'; burnsRR(ctx, r.x + r.w / 2 - 4, top - 4, 8, len + 8, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k <= 10; k++) ctx.fillRect(r.x + r.w / 2 - (k % 5 ? 9 : 13), top + len * k / 10, k % 5 ? 4 : 6, 1);
      // level meter next to the slot
      const lvl = d && d.playing ? d.gain * (0.6 + this.beatK * 0.4) : 0, mxX = i === 0 ? r.x + r.w / 2 + 10 : r.x + r.w / 2 - 15, mh = len;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(mxX, top, 5, mh);
      for (let k = 0; k < 10; k++) { if (k / 10 >= lvl) break; ctx.fillStyle = k > 7 ? '#ff3b5c' : k > 5 ? '#ffe24a' : col; ctx.fillRect(mxX + 1, top + mh - (k + 1) * mh / 10 + 1, 3, mh / 10 - 2); }
      const ky = top + len * (1 - v), kh = 26;
      const kg = ctx.createLinearGradient(0, ky - kh / 2, 0, ky + kh / 2); kg.addColorStop(0, '#f0f0f8'); kg.addColorStop(1, '#7a7a8a');
      ctx.fillStyle = kg; burnsRR(ctx, r.x + 2, ky - kh / 2, r.w - 4, kh, 6); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(r.x + 6, ky - 1.5, r.w - 12, 3);
      BurnsUI.text(ctx, 'AB'[i], r.x + r.w / 2, ky + 7, 9, '#1a1024', { stroke: false });
      if (this.touching('fad' + i)) { ctx.strokeStyle = col; ctx.lineWidth = 2; burnsRR(ctx, r.x + 1, ky - kh / 2 - 1, r.w - 2, kh + 2, 7); ctx.stroke(); }
    }
    // FILTER: low-pass to the left, high-pass to the right, springs back to the middle
    const F = C.filter, fv = this.filt.v, cy = F.y + F.h / 2;
    ctx.fillStyle = '#07060b'; burnsRR(ctx, F.x, F.y, F.w, F.h, F.h / 2); ctx.fill();
    ctx.strokeStyle = Math.abs(fv) > 0.05 ? '#ffe24a' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(F.x + F.w / 2 - 1, F.y + 5, 2, F.h - 10);
    const kx = F.x + F.w / 2 + fv * (F.w / 2 - F.h / 2);
    if (Math.abs(fv) > 0.02) { ctx.fillStyle = 'rgba(255,226,74,0.35)'; ctx.fillRect(Math.min(kx, F.x + F.w / 2), cy - 3, Math.abs(kx - F.x - F.w / 2), 6); }
    ctx.fillStyle = '#e8e8f4'; ctx.beginPath(); ctx.arc(kx, cy, F.h / 2 - 3, 0, TAU); ctx.fill();
    const wide = F.w > 170;
    BurnsUI.text(ctx, wide ? 'LOW-PASS' : 'LP', F.x + 10, cy, 7.5, 'rgba(255,255,255,0.5)', { align: 'left', stroke: false, ui: true });
    BurnsUI.text(ctx, wide ? 'HIGH-PASS' : 'HP', F.x + F.w - 10, cy, 7.5, 'rgba(255,255,255,0.5)', { align: 'right', stroke: false, ui: true });
    BurnsUI.text(ctx, 'FILTER', kx, cy + 0.5, 7, '#1a1024', { stroke: false, ui: true });
    ctx.restore();
  }
  drawPad(ctx, r, i) {
    if (!r) return;
    const P = BURNS_DJ_PADS[i], col = P.col, k = this.padK[i];
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 4 + k * 20;
    const pg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); pg.addColorStop(0, shade(col, -0.45 + k * 0.5)); pg.addColorStop(1, shade(col, -0.78 + k * 0.4));
    ctx.fillStyle = pg; burnsRR(ctx, r.x + k * 2, r.y + k * 2, r.w - k * 4, r.h - k * 4, 10); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(col, 0.75 + k * 0.25); ctx.lineWidth = 1.5; ctx.stroke();
    BurnsUI.text(ctx, P.label, r.x + r.w / 2, r.y + r.h * 0.42, Math.min(15, r.w * 0.22), '#ffffff', { stroke: false });
    BurnsUI.text(ctx, P.sub, r.x + r.w / 2, r.y + r.h * 0.76, Math.min(8.5, r.w * 0.13), 'rgba(255,255,255,0.65)', { stroke: false, ui: true });
    ctx.restore();
  }
  drawSync(ctx, r) {
    const on = this.syncOn();
    this.btn(ctx, r, 'SYNC', on ? 'easy mode' : null, on ? '#2a6a3a' : '#1a1a22', on ? '#7aff5a' : 'rgba(255,255,255,0.15)', on ? 0.4 : 0, this.btnK.sync);
  }
  drawTop(ctx, L) {
    const W = L.W, s = L.s, y = L.top.y, port = L.port;
    ctx.save();
    ctx.font = `13px ${FONT_DISPLAY}`;
    const sub = `${this.curBpm().toFixed(0)} BPM · ${this.genre} · MIX ${Math.min(this.nMixes, this.mixN + 1)}/${this.nMixes}`;
    const tw = Math.min(port ? W - s.l - s.r - 60 : W * 0.3, Math.max(ctx.measureText(this.title).width, 120) + 24);
    BurnsUI.pill(ctx, s.l, y + 2, tw, 32, 'rgba(10,6,20,0.72)', 'rgba(255,79,216,0.5)');
    ctx.save(); ctx.beginPath(); ctx.rect(s.l + 8, y + 2, tw - 16, 32); ctx.clip();
    BurnsUI.text(ctx, this.title, s.l + 12, y + 13, 11, '#ffffff', { align: 'left', stroke: false });
    BurnsUI.text(ctx, sub, s.l + 12, y + 26, 9, '#ff9ad8', { align: 'left', stroke: false, ui: true });
    ctx.restore();
    // crowd energy meter (+ what the crowd wants)
    const mw = port ? W - s.l - s.r - 8 : Math.min(340, W * 0.38), mx = port ? s.l + 4 : (W - mw) / 2, my = port ? y + 38 : y + 6;
    ctx.fillStyle = 'rgba(10,6,20,0.72)'; burnsRR(ctx, mx, my, mw, 20, 10); ctx.fill();
    const e = this.energy, eg = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    eg.addColorStop(0, '#3a6aff'); eg.addColorStop(0.35, '#7aff5a'); eg.addColorStop(0.65, '#ffe24a'); eg.addColorStop(0.85, '#ff7a2a'); eg.addColorStop(1, '#ff4fd8');
    ctx.save(); ctx.beginPath(); burnsRR(ctx, mx + 3, my + 3, (mw - 6) * Math.max(0.02, e), 14, 7); ctx.clip();
    ctx.fillStyle = eg; ctx.fillRect(mx, my, mw, 20);
    ctx.restore();
    const pk = mx + 3 + (mw - 6) * this.peak; ctx.fillStyle = '#ffffff'; ctx.fillRect(pk - 1, my + 2, 2, 16);
    const mood = this.wreckOn ? 'BOOING' : e > 0.85 ? 'ON FIRE' : e > 0.65 ? 'WILD' : e > 0.45 ? 'GROOVING' : e > 0.25 ? 'NODDING' : 'BORED';
    const wantTxt = this.phase === 'play' && (this.step === 'pick' || this.step === 'cue' || this.step === 'match') ? ' · WANTS ' + (this.want === 'up' ? '▲ ENERGY' : this.want === 'down' ? '▼ A BREATHER' : '▶ MORE OF THIS') : '';
    BurnsUI.text(ctx, 'CROWD · ' + mood + wantTxt, mx + mw / 2, my + 10.5, 9.5, '#ffffff', { sw: 3 });
    const pb = L.pause;
    ctx.fillStyle = 'rgba(10,6,24,0.6)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, pb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(pb.x - 5, pb.y - 6, 3.5, 12); ctx.fillRect(pb.x + 1.5, pb.y - 6, 3.5, 12);
    ctx.restore();
  }
  // one instruction at a time (and, the first time, one line on why)
  drawPrompt(ctx, L) {
    const h = this.hint; if (!h) return;
    const W = L.W, y = L.prompt.y, port = L.port, tsz = port ? 17 : 15;
    const lines = h.teach ? BurnsUI.wrap((ctx.font = `600 11px ${FONT_UI}`, ctx), h.teach, port ? W - 40 : W - 60).slice(0, port ? 2 : 1) : [];
    const hh = (port ? 44 : 34) + lines.length * 14;
    ctx.save();
    if (this.big && !port) ctx.globalAlpha = 0.25;
    const gr = ctx.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, 'rgba(14,6,28,0.82)'); gr.addColorStop(1, 'rgba(14,6,28,0.55)');
    ctx.fillStyle = gr; burnsRR(ctx, 8, y, W - 16, hh, 12); ctx.fill();
    const col = /TRAINWRECK|DEAD AIR/.test(h.title) ? '#ff3b5c' : '#ffe24a';
    BurnsUI.text(ctx, h.title, W / 2, y + tsz * 0.75 + 2, tsz, col, { glow: col });
    BurnsUI.text(ctx, h.sub, W / 2, y + tsz + (port ? 15 : 12), port ? 12 : 11, '#ffffff', { ui: true, sw: 3 });
    lines.forEach((l, k) => BurnsUI.text(ctx, l, W / 2, y + tsz + (port ? 31 : 26) + k * 14, 11, '#cfc4ff', { ui: true, stroke: false }));
    ctx.restore();
  }
  drawCrate(ctx, L) {
    const C = this.crate; if (!C) return;
    const port = L.port, A = this.mix.decks[this.live], cur = BurnsDJ.track(A.trk.id) || A.trk;
    C.cards.forEach((c, i) => {
      const r = L.crate[i], t = c.t, chosen = C.chosen === c, faded = C.chosen && !chosen;
      ctx.save(); ctx.globalAlpha = faded ? 0.35 : 1;
      ctx.fillStyle = chosen ? 'rgba(40,90,60,0.92)' : 'rgba(16,10,30,0.9)'; burnsRR(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.strokeStyle = chosen ? '#7aff5a' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = chosen ? 2.5 : 1.2; ctx.stroke();
      // a little record sleeve
      const sz = Math.min(r.h - 16, port ? 70 : 40), sx = r.x + 8, sy = port ? r.y + (r.h - sz) / 2 : r.y + 8;
      const hue = (hashStr(t.id) % 360), sg = ctx.createLinearGradient(sx, sy, sx + sz, sy + sz); sg.addColorStop(0, burnsHSL(hue, 0.7, 0.45)); sg.addColorStop(1, burnsHSL((hue + 60) % 360, 0.7, 0.25));
      ctx.fillStyle = sg; burnsRR(ctx, sx, sy, sz, sz, 6); ctx.fill();
      ctx.fillStyle = '#0a0a0e'; ctx.beginPath(); ctx.arc(sx + sz / 2, sy + sz / 2, sz * 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = burnsHSL(hue, 0.8, 0.6); ctx.beginPath(); ctx.arc(sx + sz / 2, sy + sz / 2, sz * 0.1, 0, TAU); ctx.fill();
      BurnsUI.text(ctx, String(i + 1), sx + 8, sy + 9, 10, '#ffffff', { sw: 2.5 });
      // text
      const tx = sx + sz + 10, tw = r.x + r.w - tx - 8;
      ctx.save(); ctx.beginPath(); ctx.rect(tx, r.y, tw, r.h); ctx.clip();
      const ty = port ? r.y + 16 : r.y + 14;
      BurnsUI.text(ctx, t.name, tx, ty, port ? 13 : 12, '#ffffff', { align: 'left', stroke: false });
      BurnsUI.text(ctx, t.artist + ' · ' + t.vibe, tx, ty + 15, 9.5, 'rgba(255,255,255,0.65)', { align: 'left', stroke: false, ui: true });
      // BPM, key, energy, each with a fit mark (✓ ~ ✗); hard mode shows the facts only
      const mark = v => this.tier === 2 ? '' : v >= 0.95 ? ' ✓' : v >= 0.5 ? ' ~' : ' ✗', mc = v => this.tier === 2 ? '#ffffff' : v >= 0.95 ? '#7aff5a' : v >= 0.5 ? '#ffe24a' : '#ff6a6a';
      let row = port ? ty + 34 : ty + 32;
      const items = [[t.bpm + ' BPM' + mark(c.tempo), mc(c.tempo)], [t.cam + mark(c.key), mc(c.key)], ['ENERGY ' + '▮'.repeat(t.energy || 3) + mark(c.vibe), mc(c.vibe)]];
      let xx = tx;
      ctx.font = `600 10px ${FONT_UI}`;
      for (const [s, cc] of items) { const w = ctx.measureText(s).width + 12; if (xx + w > tx + tw && xx > tx) { xx = tx; row += 20; } ctx.fillStyle = rgba(cc, 0.16); burnsRR(ctx, xx, row - 9, w, 18, 9); ctx.fill(); BurnsUI.text(ctx, s, xx + w / 2, row + 0.5, 10, cc, { stroke: false, ui: true }); xx += w + 6; }
      ctx.restore();
      ctx.restore();
    });
    // what's playing now, for reference
    const r0 = L.crate[0];
    BurnsUI.text(ctx, 'NOW: ' + cur.name + ' · ' + A.bpm().toFixed(0) + ' BPM · ' + (cur.cam || '') + ' · ENERGY ' + '▮'.repeat(cur.energy || 3), L.W / 2, r0.y - 9, 9.5, 'rgba(255,255,255,0.75)', { ui: true, sw: 3 });
  }
  // a pulsing ring on the control(s) to touch now
  drawHighlights(ctx, L) {
    const h = this.hint; if (!h || !h.ctl) return;
    const C = L.ctl, k = 0.5 + 0.5 * Math.sin(this.rt * 6);
    ctx.save();
    ctx.strokeStyle = '#ffe24a'; ctx.shadowColor = '#ffe24a'; ctx.shadowBlur = 10 + k * 10; ctx.lineWidth = 2.5 + k * 1.5;
    let first = null;
    for (const id of h.ctl) {
      if (id === 'crate') { if (this.crate && !this.crate.chosen) for (const r of L.crate) { burnsRR(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 13); ctx.stroke(); } continue; }
      const c = C[id]; if (!c) continue;
      if (c.r) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 5 + k * 3, 0, TAU); ctx.stroke(); if (!first) first = { x: c.x, y: c.y - c.r - 6 }; }
      else { burnsRR(ctx, c.x - 3 - k * 2, c.y - 3 - k * 2, c.w + 6 + k * 4, c.h + 6 + k * 4, 10); ctx.stroke(); if (!first) first = /^(fad|pitch)/.test(id) ? { side: true, x: c.x + c.w / 2 < L.W / 2 ? c.x + c.w + 8 : c.x - 8, y: c.y + c.h / 2, dir: c.x + c.w / 2 < L.W / 2 ? -1 : 1 } : { x: c.x + c.w / 2, y: c.y - 6 }; }
    }
    ctx.shadowBlur = 0;
    // a bouncing arrow on the first one
    if (first && first.side) { const b = Math.abs(Math.sin(this.rt * 5)) * 7, ax = first.x - first.dir * b; ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.moveTo(ax, first.y); ctx.lineTo(ax - first.dir * 10, first.y - 7); ctx.lineTo(ax - first.dir * 10, first.y + 7); ctx.closePath(); ctx.fill(); }
    else if (first) { const ay = first.y - 6 - Math.abs(Math.sin(this.rt * 5)) * 7; ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.moveTo(first.x, ay + 8); ctx.lineTo(first.x - 7, ay - 2); ctx.lineTo(first.x + 7, ay - 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  drawPops(ctx, L) {
    for (const p of this.pops) {
      const c = L.ctl[p.at], a = clamp(1 - p.t / 1.1, 0, 1) * clamp(p.t / 0.08, 0, 1);
      let x = L.W / 2, y = (L.viewTop + L.viewBot) / 2 + 40;
      if (c) { x = c.r ? c.x : c.x + c.w / 2; y = (c.r ? c.y - c.r : c.y) - 14; }
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `600 ${p.text.length > 14 ? 10 : 12}px ${FONT_UI}`; const hw = ctx.measureText(p.text).width / 2 + 8;
      x = clamp(x, L.s.l + hw, L.W - L.s.r - hw);
      BurnsUI.text(ctx, p.text, x, y - p.t * 24, p.text.length > 14 ? 10 : 12, p.col, { glow: p.col, ui: true, sw: 3 });
      ctx.restore();
    }
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
    const b = this.big; if (!b) return;
    const W = L.W, top = L.viewTop + (L.port ? 64 : 40), cy = Math.max(top + 10, (top + L.viewBot) / 2);
    const k = b.t / b.dur, a = clamp(b.t / 0.08, 0, 1) * clamp((b.dur - b.t) / 0.25, 0, 1), sc = 1 + Math.max(0, 0.25 - b.t) * 1.2;
    ctx.save(); ctx.globalAlpha = a;
    BurnsUI.text(ctx, b.title, W / 2, cy - k * 6, Math.min(L.port ? 28 : 24, W / 13) * sc, b.col, { glow: b.col });
    if (b.sub) BurnsUI.text(ctx, b.sub, W / 2, cy + (L.port ? 24 : 20), 11, '#ffffff', { ui: true });
    ctx.restore();
  }
  drawIntro(ctx, L) {
    const W = L.W, a = clamp((this.rt - 0.35) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const port = L.port, cy = L.introY;
    BurnsUI.text(ctx, 'LIVE SET', W / 2, cy, 12, '#ff9ad8', { ui: true });
    ctx.font = `26px ${FONT_DISPLAY}`; const tsz = Math.min(26, 26 * (W - 40) / Math.max(1, ctx.measureText(this.title).width));
    BurnsUI.text(ctx, this.title, W / 2, cy + 24, tsz, '#ffffff', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, `${this.nMixes} MIXES · ${['EASY', 'NORMAL', 'HARD'][this.tier]}${this.teach ? ' · FIRST TIME: STEP BY STEP' : ''}`, W / 2, cy + 46, 11, '#ffe24a', { ui: true });
    if (!this.introT) {
      const B = L.startBtn, pulse = 1 + Math.sin(this.rt * 5) * 0.03;
      ctx.save(); ctx.translate(B.x + B.w / 2, B.y + B.h / 2); ctx.scale(pulse, pulse);
      const bg = ctx.createLinearGradient(0, -B.h / 2, 0, B.h / 2); bg.addColorStop(0, '#ff6ae0'); bg.addColorStop(1, '#b0208a');
      ctx.fillStyle = bg; ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 18; burnsRR(ctx, -B.w / 2, -B.h / 2, B.w, B.h, 22); ctx.fill(); ctx.shadowBlur = 0;
      BurnsUI.text(ctx, '▶ DROP IN', 0, 1, 16, '#ffffff');
      ctx.restore();
      if (port || L.viewBot - L.viewTop >= 150) BurnsUI.text(ctx, 'Pick a record · PLAY on the 1 · match the kicks · fade it in · party', W / 2, B.y + B.h + 18, 10, 'rgba(255,255,255,0.85)', { ui: true });
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
    const rows = [['CLEAN MIXES', r.cleanMixes + ' / ' + this.nMixes], ['TRAINWRECKS', String(r.trainwrecks)], ['CROWD PEAK', Math.round(r.crowdPeak * 100) + '%'], ['ACCURACY', Math.round(r.accuracy * 100) + '%']];
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
try { if (window.BRADY_BURNS) { window.BRADY_BURNS.BurnsDJ = BurnsDJ; window.BRADY_BURNS.BurnsDJSounds = BurnsDJSounds; } } catch (e) { /* ignore */ }
