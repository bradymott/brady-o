/* ============================================================
   BRADY GOES TO BURNING MAN — the house soundtrack (BurnsHouse)
   ------------------------------------------------------------
   Every place in the game has its own house track, all generated in code (no samples, no files):
   deep house for the city by day, deeper and more driving at night, melodic/organic house at Root
   Society, tech house at the sound camps, a warm sunrise set, tension for Hell Station and the bosses,
   a big release for the Burn and a beatless bed for the Temple. One sound family throughout: the same
   kick, hats, claps, bass voice, Rhodes keys and pads, in different keys, tempos and arrangements.

   How it plugs in
     - Each track is registered with the shared sequencer (Sound.addTrack(name, { eng, bpm, xf, xfi })).
       Sound keeps doing what it always did (unlock on first touch, music volume, pause, fade between
       tracks); this file supplies the step engine that turns one 16th-note step into sound.
     - burnsMusic(name) (40_burns_a_core.js) asks BURNS_MUSIC_ROUTE.fn which house track a game name means
       (BurnsHouse.ROUTE below). The city picks its day or night track itself (BurnsHouse.setCityNight).
   Cost (iPhone)
     - Drums, percussion and FX are short stereo AudioBuffers rendered ONCE per AudioContext (~0.3 s of CPU
       on first use, ~2.5 MB); each hit is one buffer source + one gain.
     - The bass is ONE persistent mono voice (2-3 oscillators) re-pitched per note; pads are 2 oscillators per
       chord tone, retriggered only when the chord changes; keys are 2-operator FM (2 oscillators per note).
     - Typical load: 20-35 live oscillators/sources, 6 persistent biquads. No ScriptProcessor, no per-sample JS
       at play time. The scheduler runs inside Sound's existing 25 ms timer (~10 steps/s).
   Track format (BurnsHouse.add(name, def))
     bpm, key/mood/title (docs), prog: chord per bar ('Am9 Dm9,G7' = two halves), kick: 'deep'|'punch'|'tech'|'soft',
     pump: side-chain depth, sw: 16th swing, lvl: per-layer levels, trim: track gain,
     drums: { layerName: '16 chars per bar, 1-9 = velocity' } (layer names: kick clap snr ch oh shk rim ride cgh cgl bgo perc,
       a trailing digit picks a variant pattern: 'ch2'), bass: { tone, pat: 'r..o..f.' (r root o octave f fifth
       t third s seventh n ninth l low fifth c approach '-' hold, UPPER = accent) }, pad/stab/keys/motif: tone + pattern,
     intro / loop: sections [bars, 'layer layer:level ...', [lpFrom, lpTo], 'fx fx'] (fx: crash boom riser roll swell gap).
   ============================================================ */
const BurnsHouse = (() => {
  'use strict';
  const TRK = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const PCN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], m11: [0, 3, 7, 10, 14, 17], m6: [0, 3, 7, 9],
    '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14], '13': [0, 4, 10, 14, 21], maj7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14],
    '6': [0, 4, 7, 9], '69': [0, 4, 9, 14], sus2: [0, 2, 7], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], '9sus4': [0, 5, 10, 14],
    add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], 'maj7#11': [0, 4, 7, 11, 18], '5': [0, 7], m7b5: [0, 3, 6, 10], '7b9': [0, 4, 7, 10, 13]
  };
  const pcOf = x => ((x % 12) + 12) % 12;
  function parseChord(s) {
    const r = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(s);
    if (!r || !QUAL.hasOwnProperty(r[3])) throw new Error('BurnsHouse: bad chord ' + s);
    const acc = a => (a === '#' ? 1 : a === 'b' ? -1 : 0);
    const root = pcOf(PCN[r[1]] + acc(r[2]));
    return { name: s, root, iv: QUAL[r[3]], bass: r[4] ? pcOf(PCN[r[4]] + acc(r[5])) : root };
  }
  // close voicing around `center`; rootless (3rd/5th/7th/9th) when the chord has four or more tones
  function voicing(ch, center, rootless) {
    let iv = ch.iv;
    if (rootless && iv.length >= 4) iv = iv.slice(1);
    const notes = iv.map(i => { const pc = pcOf(ch.root + i); let m = center - 6 + pcOf(pc - (center - 6)); return m; }).sort((a, b) => a - b);
    for (let i = 1; i < notes.length; i++) if (notes[i] - notes[i - 1] < 2) { notes[i - 1] += 12; notes.sort((a, b) => a - b); i = 0; }
    return notes;
  }
  function noteNum(s) {
    const r = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!r) throw new Error('BurnsHouse: bad note ' + s);
    return 12 * (+r[3] + 1) + PCN[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
  }
  // 'E5:3 .:1 G5:4' -> [{s, m, d}] (steps), total steps
  function parseMotif(str) {
    const out = []; let pos = 0;
    for (const tk of str.replace(/\|/g, ' ').trim().split(/\s+/)) {
      const [nm, dd] = tk.split(':'), d = dd ? +dd : 2;
      if (nm !== '.') out.push({ s: pos, m: noteNum(nm), d });
      pos += d;
    }
    return { notes: out, len: pos };
  }

  /* ---------------- one-shot sounds, rendered once per AudioContext ---------------- */
  function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function biquad(x, type, f, q, sr) {   // RBJ biquad, in place
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
    let b0, b1, b2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; } else { b0 = al; b1 = 0; b2 = -al; }
    const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x0; y2 = y1; y1 = y0; x[i] = y0; }
    return x;
  }
  function noise(n, r) { const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = r() * 2 - 1; return x; }
  function metal(n, sr, freqs) {   // 808-style bank of square waves
    const x = new Float32Array(n), ph = freqs.map(() => 0);
    for (let i = 0; i < n; i++) { let v = 0; for (let k = 0; k < freqs.length; k++) { ph[k] += freqs[k] / sr; v += (ph[k] % 1) < 0.5 ? 1 : -1; } x[i] = v / freqs.length; }
    return x;
  }
  function toBuf(ctx, x, pan, peak) {
    const sr = ctx.sampleRate, n = x.length, b = ctx.createBuffer(2, n, sr);
    let mx = 1e-9; for (let i = 0; i < n; i++) { const a = Math.abs(x[i]); if (a > mx) mx = a; }
    const k = (peak || 1) / mx, fade = Math.min(n, Math.floor(sr * 0.012));
    for (let i = n - fade; i < n; i++) x[i] *= (n - i) / fade;   // tails end in silence: no clicks
    const p = Math.max(-1, Math.min(1, pan || 0)), gl = Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, gr = Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2;
    const L = b.getChannelData(0), R = b.getChannelData(1);
    for (let i = 0; i < n; i++) { L[i] = x[i] * k * gl; R[i] = x[i] * k * gr; }
    return b;
  }
  const KICKS = {   // f0 -> f1 pitch sweep (pt s), body decay dt after a short hold, click level, soft-clip drive
    deep: { f0: 155, f1: 48, pt: 0.04, dt: 0.12, hold: 0.03, click: 0.22, drive: 1.6 },
    soft: { f0: 140, f1: 50, pt: 0.045, dt: 0.11, hold: 0.025, click: 0.12, drive: 1.3 },
    punch: { f0: 210, f1: 50, pt: 0.032, dt: 0.1, hold: 0.025, click: 0.4, drive: 2.0 },
    tech: { f0: 250, f1: 49, pt: 0.024, dt: 0.085, hold: 0.018, click: 0.55, drive: 2.6 }
  };
  function renderKick(sr, p, r) {
    const n = Math.floor(sr * 0.42), x = new Float32Array(n), cl = biquad(noise(Math.floor(sr * 0.01), r), 'bp', 3200, 0.8, sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, f = p.f1 + (p.f0 - p.f1) * Math.exp(-t / p.pt);
      ph += 2 * Math.PI * f / sr;
      const env = (t < 0.0015 ? t / 0.0015 : 1) * Math.exp(-Math.max(0, t - p.hold) / p.dt);
      const c = i < cl.length ? cl[i] * Math.exp(-t / 0.0018) * p.click * 4 : 0;
      x[i] = Math.tanh(p.drive * (Math.sin(ph) * env + c)) / Math.tanh(p.drive);
    }
    return x;
  }
  const BANK = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function bank(ctx) {
    let B = BANK && BANK.get(ctx);
    if (B) return B;
    const sr = ctx.sampleRate, r = rng32(0xB0BA), N = s => Math.floor(sr * s);
    B = { kick: {} };
    for (const k of Object.keys(KICKS)) B.kick[k] = toBuf(ctx, renderKick(sr, KICKS[k], r), 0, 1);
    { // clap: four quick bursts and a short tail
      const n = N(0.36), x = biquad(biquad(noise(n, r), 'bp', 1250, 1.1, sr), 'hp', 700, 0.7, sr);
      for (let i = 0; i < n; i++) { const t = i / sr; let e = 0; for (let k = 0; k < 3; k++) { const tk = t - k * 0.0095; if (tk >= 0 && tk < 0.0095) e = Math.max(e, Math.exp(-tk / 0.0032)); } const tt = t - 0.0285; if (tt >= 0) e = Math.max(e, Math.exp(-tt / 0.075)); x[i] *= e; }
      B.clap = toBuf(ctx, x, 0, 1);
    }
    { // snare: tuned body + bright noise
      const n = N(0.3), x = new Float32Array(n), nz = biquad(noise(n, r), 'hp', 1800, 0.7, sr); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (175 + 40 * Math.exp(-t / 0.01)) / sr; x[i] = Math.sin(ph) * Math.exp(-t / 0.045) * 0.7 + nz[i] * Math.exp(-t / 0.075) * 0.8; }
      B.snr = toBuf(ctx, x, 0, 1);
    }
    const hatF = [263, 400, 421, 474, 587, 845].map(f => f * 2.1);
    const hat = (len, tau, pan, f) => { const n = N(len), m = biquad(biquad(metal(n, sr, hatF), 'bp', f || 10500, 0.9, sr), 'hp', 7200, 0.7, sr), nz = biquad(noise(n, r), 'hp', 8500, 0.7, sr); for (let i = 0; i < n; i++) { const t = i / sr; m[i] = (m[i] * 0.7 + nz[i] * 0.45) * (t < 0.0008 ? t / 0.0008 : 1) * Math.exp(-t / tau); } return toBuf(ctx, m, pan, 1); };
    B.ch = hat(0.09, 0.016, 0.15);
    B.oh = hat(0.42, 0.095, -0.12, 9800);
    B.ride = (() => { const n = N(1.1), m = biquad(metal(n, sr, hatF.map(f => f * 0.83)), 'bp', 6200, 1.4, sr), nz = biquad(noise(n, r), 'hp', 7000, 0.7, sr); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * 4180 / sr; m[i] = (m[i] * 0.6 + nz[i] * 0.2 + Math.sin(ph) * 0.18) * Math.exp(-t / 0.33); } return toBuf(ctx, m, 0.3, 1); })();
    B.shk = (() => { const n = N(0.12), x = biquad(biquad(noise(n, r), 'bp', 7200, 1.6, sr), 'hp', 4500, 0.7, sr); for (let i = 0; i < n; i++) { const t = i / sr; x[i] *= Math.min(1, t / 0.009) * Math.exp(-Math.max(0, t - 0.009) / 0.03); } return toBuf(ctx, x, 0.4, 1); })();
    B.rim = (() => { const n = N(0.08), x = new Float32Array(n), nz = biquad(noise(n, r), 'bp', 2500, 2, sr); for (let i = 0; i < n; i++) { const t = i / sr; x[i] = (Math.sin(2 * Math.PI * 1650 * t) * 0.6 + Math.sin(2 * Math.PI * 480 * t) * 0.5) * Math.exp(-t / 0.009) + nz[i] * Math.exp(-t / 0.004) * 0.8; } return toBuf(ctx, x, -0.25, 1); })();
    const drum = (f, drop, tau, slap, pan) => { const n = N(tau * 6), x = new Float32Array(n), nz = biquad(noise(n, r), 'bp', 2200, 1.2, sr); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * f * (1 + drop * Math.exp(-t / 0.012)) / sr; x[i] = Math.sin(ph) * (t < 0.001 ? t / 0.001 : 1) * Math.exp(-t / tau) + nz[i] * Math.exp(-t / 0.005) * slap; } return toBuf(ctx, x, pan, 1); };
    B.cgh = drum(338, 0.12, 0.085, 0.5, -0.45);
    B.cgl = drum(226, 0.1, 0.11, 0.35, -0.3);
    B.bgo = drum(520, 0.08, 0.06, 0.45, 0.5);
    B.perc = (() => { const n = N(0.1), x = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; x[i] = (Math.sin(2 * Math.PI * 2480 * t) + 0.4 * Math.sin(2 * Math.PI * 1240 * t)) * Math.exp(-t / 0.014); } return toBuf(ctx, x, 0.55, 1); })();
    B.crash = (() => { const n = N(2.6), m = biquad(metal(n, sr, hatF.map(f => f * 0.61).concat([1730, 2290])), 'hp', 3800, 0.7, sr), nz = biquad(noise(n, r), 'hp', 5200, 0.7, sr); for (let i = 0; i < n; i++) { const t = i / sr; m[i] = (m[i] * 0.55 + nz[i] * 0.6) * (t < 0.002 ? t / 0.002 : 1) * Math.exp(-t / 0.62); } return toBuf(ctx, m, 0, 1); })();
    B.boom = (() => { const n = N(1.7), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (36 + 34 * Math.exp(-t / 0.18)) / sr; x[i] = Math.tanh(1.6 * Math.sin(ph) * (t < 0.003 ? t / 0.003 : 1) * Math.exp(-t / 0.5)); } return toBuf(ctx, x, 0, 1); })();
    B.swell = (() => { const n = N(1.6), x = biquad(noise(n, r), 'hp', 2400, 0.7, sr); for (let i = 0; i < n; i++) { const t = i / sr, u = t / 1.6; x[i] *= Math.pow(u, 3.2); } for (let i = n - N(0.006); i < n; i++) x[i] *= (n - i) / N(0.006); return toBuf(ctx, x, 0, 1); })();
    B.noise = (() => { const n = N(2), b = ctx.createBuffer(2, n, sr); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; } return b; })();
    try {   // soft saw (rolled-off harmonics) for pads and stabs
      const H = 40, re = new Float32Array(H), im = new Float32Array(H);
      for (let h = 1; h < H; h++) im[h] = (1 / h) * Math.pow(1 - h / H, 1.5);
      B.soft = ctx.createPeriodicWave(re, im);
    } catch (e) { B.soft = null; }
    if (BANK) BANK.set(ctx, B);
    return B;
  }

  /* ---------------- voices ---------------- */
  const ended = (src, list) => { src.onended = () => { for (const n of list) { try { n.disconnect(); } catch (e) { /* ignore */ } } }; };
  function wave(ctx, B, o, w) { if (w === 'soft' && B.soft) o.setPeriodicWave(B.soft); else o.type = w === 'soft' ? 'sawtooth' : w; }
  function hit(I, buf, t, v, dest, rate) {
    if (!buf || v <= 0) return;
    const c = I.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; if (rate) s.playbackRate.value = rate;
    g.gain.value = v; s.connect(g); g.connect(dest); s.start(t); ended(s, [s, g]);
  }
  // FM voice (Rhodes keys, marimba, kalimba, bells)
  const FM = {
    keys: { ratio: 1, idx: 1.5, ie: 0.12, id: 0.22, a: 0.003, dcy: 0.9, sus: 0.22, rel: 0.35 },
    marimba: { ratio: 4, idx: 0.75, ie: 0.04, id: 0.04, a: 0.002, dcy: 0.28, sus: 0, rel: 0.25 },
    kalimba: { ratio: 3, idx: 0.9, ie: 0.06, id: 0.05, a: 0.002, dcy: 0.45, sus: 0, rel: 0.35 },
    bell: { ratio: 3.5, idx: 1.1, ie: 0.05, id: 0.3, a: 0.003, dcy: 1.6, sus: 0, rel: 1.2 },
    glass: { ratio: 2, idx: 0.6, ie: 0.2, id: 0.4, a: 0.02, dcy: 1.2, sus: 0.3, rel: 0.8 }
  };
  function fm(I, dest, t, m, dur, v, p) {
    const c = I.ctx, f = mtof(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * p.ratio;
    mg.gain.setValueAtTime(f * p.idx, t); mg.gain.setTargetAtTime(f * p.idx * p.ie, t, p.id);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + p.a);
    g.gain.setTargetAtTime(v * p.sus, t + p.a, p.dcy * 0.35);
    const rel = t + Math.max(dur, p.a + 0.01);
    g.gain.setTargetAtTime(0, rel, p.rel / 3);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(dest);
    const stop = rel + p.rel * 2.2 + 0.05;
    car.start(t); mod.start(t); car.stop(stop); mod.stop(stop); ended(car, [car, mod, mg, g]);
  }
  // pluck (subtractive): soft saw through a snappy low-pass
  function pluck(I, dest, t, m, dur, v, p) {
    const c = I.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), f = mtof(m);
    wave(c, I.B, o, 'soft'); o.frequency.value = f;
    fl.type = 'lowpass'; fl.Q.value = p.q || 2; fl.frequency.setValueAtTime(Math.min(16000, (p.cut || 900) * (1 + (p.fe || 4))), t); fl.frequency.setTargetAtTime(p.cut || 900, t, p.fd || 0.07);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.setTargetAtTime(0, t + 0.003, Math.min(dur, p.dcy || 0.18) * 0.5);
    o.connect(fl); fl.connect(g); g.connect(dest);
    o.start(t); o.stop(t + Math.min(dur, p.dcy || 0.18) * 3 + 0.1); ended(o, [o, fl, g]);
  }
  // chord stab: one soft-saw per note through one enveloped filter
  function stab(I, t, notes, dur, v, p) {
    const c = I.ctx, fl = c.createBiquadFilter(), g = c.createGain(), list = [fl, g], k = v / Math.sqrt(notes.length);
    fl.type = 'lowpass'; fl.Q.value = p.q || 1.6;
    fl.frequency.setValueAtTime(Math.min(15000, p.cut * (1 + p.fe)), t); fl.frequency.setTargetAtTime(p.cut, t, p.fd);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k, t + 0.003);
    g.gain.setTargetAtTime(k * (p.sus || 0), t + 0.003, p.dcy);
    g.gain.setTargetAtTime(0, t + dur, 0.03);
    fl.connect(g); g.connect(I.stabBus);
    const stop = t + dur + 0.2;
    let first = null;
    notes.forEach((m, i) => { const o = c.createOscillator(); wave(c, I.B, o, p.w || 'soft'); o.frequency.value = mtof(m); o.detune.value = (i % 2 ? 1 : -1) * (p.det || 6); o.connect(fl); o.start(t); o.stop(stop); list.push(o); if (!first) first = o; });
    ended(first, list);
  }
  // pad chord: two oscillators per note, one panned left and one right
  function pad(I, t, notes, dur, v, p) {
    const c = I.ctx, gL = c.createGain(), gR = c.createGain(), list = [gL, gR], k = v / Math.sqrt(notes.length);
    const a = p.a || 0.7, rel = p.rel || 1.0, end = t + Math.max(dur, a + 0.05);
    for (const g of [gL, gR]) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k, t + a); g.gain.setTargetAtTime(0, end, rel / 3); }
    gL.connect(I.padMerge, 0, 0); gR.connect(I.padMerge, 0, 1);
    const stop = end + rel * 2.5 + 0.05; let first = null;
    for (const m of notes) for (let s = 0; s < 2; s++) {
      const o = c.createOscillator(); wave(c, I.B, o, p.w || 'soft');
      o.frequency.value = mtof(m); o.detune.value = (s ? 1 : -1) * (p.det || 7);
      o.connect(s ? gR : gL); o.start(t); o.stop(stop); list.push(o); if (!first) first = o;
    }
    ended(first, list);
  }
  const BASS = {
    deep: { w: 'triangle', sub: 0.9, body: 0.45, cut: 320, q: 1.2, fe: 1.2, fd: 0.06, dcy: 0.35, sus: 0.75 },
    warm: { w: 'sawtooth', sub: 0.85, body: 0.4, cut: 420, q: 2.5, fe: 2.2, fd: 0.06, dcy: 0.25, sus: 0.6 },
    rolling: { w: 'sawtooth', sub: 0.8, body: 0.5, cut: 520, q: 4, fe: 3.2, fd: 0.045, dcy: 0.16, sus: 0.45 },
    tech: { w: 'square', sub: 0.85, body: 0.38, cut: 600, q: 5, fe: 3.5, fd: 0.035, dcy: 0.12, sus: 0.35 },
    acid: { w: 'sawtooth', sub: 0.7, body: 0.45, cut: 380, q: 9, fe: 4.5, fd: 0.07, dcy: 0.14, sus: 0.4 },
    reese: { w: 'sawtooth', sub: 0.85, body: 0.42, cut: 480, q: 1.4, fe: 0.8, fd: 0.1, dcy: 0.4, sus: 0.85, reese: 14 },
    pulse: { w: 'sine', sub: 1, body: 0, cut: 200, q: 0.7, fe: 0, fd: 0.1, dcy: 0.6, sus: 0.8 }
  };
  function bassNote(I, t, m, dur, v) {
    const b = I.bass, p = b.p, f = mtof(m);
    for (const o of b.osc) o.o.frequency.setTargetAtTime(f * o.k, t, 0.004);
    const A = b.amp.gain;
    A.setTargetAtTime(v, t, 0.0025); A.setTargetAtTime(v * p.sus, t + 0.025, p.dcy); A.setTargetAtTime(0, t + dur, 0.014);
    if (p.body) { const F = b.lp.frequency; F.setTargetAtTime(Math.min(8000, p.cut * (1 + p.fe * v / I.lvl.bass)), t, 0.002); F.setTargetAtTime(p.cut, t + 0.006, p.fd); }
  }

  /* ---------------- compile a track ---------------- */
  const LV = { kick: 0.85, clap: 0.5, snr: 0.4, ch: 0.44, oh: 0.34, shk: 0.32, rim: 0.3, ride: 0.24, cgh: 0.36, cgl: 0.36, bgo: 0.28, perc: 0.22,
    bass: 0.42, pad: 0.24, stab: 0.3, keys: 0.42, motif: 0.26 };
  const MASTER = 0.8;   // keeps the soundtrack at the old music's loudness (~-19 LUFS), so the SFX balance is unchanged
  const DRUMS = ['kick', 'clap', 'snr', 'ch', 'oh', 'shk', 'rim', 'ride', 'cgh', 'cgl', 'bgo', 'perc'];
  function compile(name, D) {
    const T = { name, D, bpm: D.bpm, pump: D.pump == null ? 0.4 : D.pump, sw: D.sw || 0, kick: D.kick || 'deep', trim: D.trim || 1 };
    T.lvl = Object.assign({}, LV, D.lvl || {});
    T.prog = D.prog.trim().split(/\s+/).map(tok => tok.split(',').map(parseChord));
    T.motifs = {};
    for (const k of Object.keys(D)) if (/^motif\d*$/.test(k)) T.motifs[k] = Object.assign({}, D[k], parseMotif(D[k].notes));
    const sec = (list, kind) => list.map(([bars, on, lp, fx]) => {
      const L = {};
      for (const tk of on.trim().split(/\s+/)) { if (!tk) continue; const [nm, lv] = tk.split(':'); L[nm] = lv == null ? 1 : +lv; }
      return { bars, steps: bars * 16, on: L, lp: lp || [17000, 17000], fx: (fx || '').split(/\s+/).filter(Boolean), kind };
    });
    T.intro = sec(D.intro || [], 'intro'); T.loop = sec(D.loop, 'loop');
    T.introSteps = T.intro.reduce((a, s) => a + s.steps, 0); T.loopSteps = T.loop.reduce((a, s) => a + s.steps, 0);
    const pl = T.prog.length;
    if ((T.introSteps / 16) % pl || (T.loopSteps / 16) % pl) throw new Error('BurnsHouse ' + name + ': sections must be a whole number of progressions');
    for (const S of T.intro.concat(T.loop)) for (const k of Object.keys(S.on)) {
      const base = k.replace(/\d+$/, '');
      if (DRUMS.indexOf(base) >= 0) { if (!D.drums || !D.drums[k]) throw new Error('BurnsHouse ' + name + ': no pattern ' + k); }
      else if (!D[k]) throw new Error('BurnsHouse ' + name + ': no layer ' + k);
    }
    return T;
  }
  // where step n falls: { S section, s step in section, k step in its region, region 'intro'|'loop' }
  function locate(T, n) {
    let list = T.intro, k = n;
    if (n >= T.introSteps) { list = T.loop; k = (n - T.introSteps) % T.loopSteps; }
    let s = k;
    for (const S of list) { if (s < S.steps) return { S, s, k, region: list === T.intro ? 'intro' : 'loop' }; s -= S.steps; }
    return { S: list[list.length - 1], s: 0, k, region: 'loop' };
  }
  function chordAt(T, n, at) {
    const L = at || locate(T, n), bar = Math.floor(L.k / 16), seg = T.prog[bar % T.prog.length], half = Math.floor((L.k % 16) / (16 / seg.length));
    return seg[Math.min(seg.length - 1, half)];
  }
  const lvlOf = (T, S, layer) => (S.on[layer] || 0) * (T.lvl[layer.replace(/\d+$/, '')] || 0);

  /* ---------------- an instance: one track playing ---------------- */
  function open(T, io) {
    const c = io.ctx, B = bank(c), G = v => { const g = c.createGain(); g.gain.value = v; return g; };
    const I = { T, ctx: c, B, io, nodes: [], srcs: [], first: true, padUntil: -1, padChord: null, rnd: rng32(0x5EED ^ T.name.length * 7919) };
    const nodes = I.nodes;
    I.trim = G(T.trim * MASTER); I.trim.connect(io.out);
    I.drumBus = G(1); I.drumBus.connect(I.trim);
    const drumRev = G(0.1); I.drumBus.connect(drumRev); drumRev.connect(io.rev);
    I.duck = G(1);
    I.lp = c.createBiquadFilter(); I.lp.type = 'lowpass'; I.lp.Q.value = 0.9; I.lp.frequency.value = 17000;
    I.duck.connect(I.lp); I.lp.connect(I.trim);
    const musRev = G(T.D.rev == null ? 0.28 : T.D.rev); I.lp.connect(musRev); musRev.connect(io.rev);
    // pads: stereo merger -> slow-moving low-pass -> duck
    const P = T.D.pad || {};
    I.padMerge = c.createChannelMerger(2);
    I.padLP = c.createBiquadFilter(); I.padLP.type = 'lowpass'; I.padLP.Q.value = P.q || 0.8; I.padLP.frequency.value = P.cut || 1200;
    I.padMerge.connect(I.padLP); I.padLP.connect(I.duck);
    const lfo = c.createOscillator(), lfoG = G((P.cut || 1200) * (P.lfoAmt == null ? 0.35 : P.lfoAmt));
    lfo.frequency.value = P.lfo || 0.06; lfo.connect(lfoG); lfoG.connect(I.padLP.frequency);
    I.stabBus = G(1); I.stabBus.connect(I.duck);
    const stabDly = G(T.D.stab ? (T.D.stab.dly == null ? 0.3 : T.D.stab.dly) : 0); I.stabBus.connect(stabDly); stabDly.connect(io.dly);
    I.keysBus = G(1); I.keysBus.connect(I.duck);
    const keysDly = G(T.D.keys ? (T.D.keys.dly || 0.12) : 0); I.keysBus.connect(keysDly); keysDly.connect(io.dly);
    I.motifBus = G(1); I.motifBus.connect(I.duck);
    const motifDly = G(0.32); I.motifBus.connect(motifDly); motifDly.connect(io.dly);
    I.fxBus = G(1); I.fxBus.connect(I.trim); const fxRev = G(0.35); I.fxBus.connect(fxRev); fxRev.connect(io.rev);
    // the bass: one persistent mono voice
    const bp = BASS[(T.D.bass && T.D.bass.tone) || 'warm'], amp = G(0), osc = [];
    const sub = c.createOscillator(); sub.type = 'sine'; const subG = G(bp.sub); sub.connect(subG); subG.connect(amp); osc.push({ o: sub, k: 1 });
    let lp = null;
    if (bp.body) {
      lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = bp.q; lp.frequency.value = bp.cut;
      const bodyG = G(bp.body); lp.connect(bodyG); bodyG.connect(amp); nodes.push(lp, bodyG);
      const o1 = c.createOscillator(); o1.type = bp.w; o1.connect(lp); osc.push({ o: o1, k: 1 });
      if (bp.reese) { const o2 = c.createOscillator(); o2.type = bp.w; o2.detune.value = bp.reese; o1.detune.value = -bp.reese; o2.connect(lp); osc.push({ o: o2, k: 1 }); }
    }
    amp.connect(I.duck);
    I.bass = { p: bp, osc, amp, lp };
    const t0 = c.currentTime;
    for (const o of osc) { o.o.frequency.value = 55; o.o.start(t0); I.srcs.push(o.o); }
    lfo.start(t0); I.srcs.push(lfo);
    nodes.push(I.trim, I.drumBus, drumRev, I.duck, I.lp, musRev, I.padMerge, I.padLP, lfo, lfoG, I.stabBus, stabDly, I.keysBus, keysDly, I.motifBus, motifDly, I.fxBus, fxRev, sub, subG, amp);
    for (const o of osc) if (nodes.indexOf(o.o) < 0) nodes.push(o.o);
    I.lvl = T.lvl;
    return I;
  }
  function close(I) {
    if (!I || I.closed) return;
    I.closed = true;
    const t = I.ctx.currentTime;
    for (const s of I.srcs) { try { s.stop(t + 0.05); } catch (e) { /* ignore */ } }
  }

  function sectionStart(I, S, t, sd, from) {
    // filter sweep for the section (from: fraction already played, when a track starts mid-section)
    const T = I.T, f = I.lp.frequency, dur = S.steps * sd, a = S.lp[0], b = S.lp[1], k0 = from || 0;
    const fa = a * Math.pow(b / a, k0);
    f.cancelScheduledValues(t); f.setValueAtTime(fa, t);
    if (a !== b) f.exponentialRampToValueAtTime(b, t + dur * (1 - k0));
    if (from) return;
    const L = T.lvl;
    if (S.fx.indexOf('crash') >= 0) hit(I, I.B.crash, t, 0.16, I.fxBus);
    if (S.fx.indexOf('boom') >= 0) hit(I, I.B.boom, t, 0.42, I.fxBus);
    if (S.fx.indexOf('swell') >= 0) { const st = t + dur - 1.6; if (st > I.ctx.currentTime) hit(I, I.B.swell, st, 0.16, I.fxBus); }
    if (S.fx.indexOf('riser') >= 0) {   // filtered noise rising across the whole section
      const c = I.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      s.buffer = I.B.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(320, t); bp.frequency.exponentialRampToValueAtTime(7500, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + dur - 0.02); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
      s.connect(bp); bp.connect(g); g.connect(I.fxBus); s.start(t); s.stop(t + dur + 0.05); ended(s, [s, bp, g]);
    }
    void L;
  }

  function step(I, n, t, sd) {
    if (!I || I.closed) return;
    const T = I.T, at = locate(T, n), S0 = at.S, s = at.s, s16 = s % 16, D = T.D;
    const S = I.solo ? Object.assign({}, S0, { on: Object.keys(S0.on).filter(k => I.solo.indexOf(k.replace(/\d+$/, '')) >= 0).reduce((o, k) => (o[k] = S0.on[k], o), {}) }) : S0;
    if (s === 0) sectionStart(I, S, t, sd, 0);
    else if (I.first) sectionStart(I, S, t, sd, s / S.steps);
    const sw = (s16 & 1) ? T.sw * sd : 0, gap = S.fx.indexOf('gap') >= 0 && s >= S.steps - 2;
    const ch = chordAt(T, n, at);
    const jit = () => (I.rnd() - 0.5) * 0.004;
    // drums
    if (!gap) for (const layer in S.on) {
      const base = layer.replace(/\d+$/, '');
      if (DRUMS.indexOf(base) < 0) continue;
      const pat = D.drums[layer], c = pat[s % pat.length];
      if (c === '.' || c === '-') continue;
      const v = (+c / 9) * lvlOf(T, S, layer) * (base === 'kick' || base === 'clap' ? 1 : 0.9 + 0.2 * I.rnd());
      if (base === 'kick') {
        hit(I, I.B.kick[T.kick], t, v, I.trim);
        if (T.pump) { const g = I.duck.gain; g.setTargetAtTime(1 - T.pump, t, 0.0025); g.setTargetAtTime(1, t + 0.03, sd * 1.25); }
      } else hit(I, I.B[base], t + sw + (base === 'clap' || base === 'snr' ? 0 : jit()), v, I.drumBus);
    }
    // snare roll into the next section
    if (S.fx.indexOf('roll') >= 0 && s >= S.steps - 32 && !gap) {
      const r = s - (S.steps - 32), every = r < 16 ? (r % 4 === 0) : r < 24 ? (r % 2 === 0) : true;
      if (every) hit(I, I.B.snr, t, T.lvl.snr * (0.25 + 0.75 * r / 32), I.drumBus);
    }
    // bass
    for (const layer in S.on) {
      if (!/^bass\d*$/.test(layer) || gap) continue;
      const Bd = D[layer], pat = Bd.pat, c = pat[s % pat.length];
      if (c === '.' || c === '-') continue;
      let len = 1; while (len < 16 && pat[(s + len) % pat.length] === '-') len++;
      const lc = c.toLowerCase(), r = (Bd.lo || 31) + pcOf(ch.bass - (Bd.lo || 31));
      let m;
      if (lc === 'c') { const nx = chordAt(T, n + 16 - s16), r2 = (Bd.lo || 31) + pcOf(nx.bass - (Bd.lo || 31)); m = r2 - 1; }
      else { const off = { r: 0, o: 12, f: 7, l: -5, t: ch.iv[1], s: ch.iv[3] != null ? ch.iv[3] : 10, n: 14 }[lc]; if (off == null) continue; m = r + off; }
      bassNote(I, t + sw, m, len * sd * (Bd.gate || 0.82), lvlOf(T, S, layer) * (c === lc ? 0.85 : 1));
    }
    // pads: retrigger on chord change (or when the layer comes in)
    const padOn = lvlOf(T, S, 'pad');
    if (padOn && D.pad && (s16 === 0 || I.first) && (n >= I.padUntil || ch !== I.padChord)) {
      let len = 16 - s16;
      for (let k = 1; k < 4; k++) { const n2 = n + len, L2 = locate(T, n2); if (!lvlOf(T, L2.S, 'pad') || chordAt(T, n2, L2) !== ch) break; len += 16; }
      const c0 = D.pad.center || 62, notes = voicing(ch, c0, true);
      if (D.pad.root !== false) notes.unshift(c0 - 18 + pcOf(ch.root - (c0 - 18)));   // the root, under the voicing
      pad(I, t, notes, len * sd, padOn, D.pad);
      I.padUntil = n + len; I.padChord = ch;
    }
    if (!padOn) I.padUntil = -1;
    // chord layers: stabs and keys
    for (const layer in S.on) {
      const isStab = /^stab\d*$/.test(layer), isKeys = /^keys\d*$/.test(layer);
      if (!isStab && !isKeys) continue;
      const L = D[layer], pat = L.pat, c = pat[s % pat.length];
      if (c === '.' || c === '-' || gap) continue;
      let len = 1; while (len < 16 && pat[(s + len) % pat.length] === '-') len++;
      const v = (+c / 9) * lvlOf(T, S, layer), notes = voicing(ch, L.center || 64, L.rootless !== false);
      if (isStab) stab(I, t + sw, notes, Math.max(L.gate || 0.12, len * sd * 0.9), v, L);
      else for (const m of notes) fm(I, I.keysBus, t + sw, m, len * sd * 0.92, v / Math.sqrt(notes.length), FM[L.tone || 'keys']);
    }
    // motifs: absolute notes over their own cycle, aligned to the region start
    for (const layer in S.on) {
      const M = T.motifs[layer]; if (!M) continue;
      const v = lvlOf(T, S, layer), pos = at.k % M.len;
      for (const nt of M.notes) if (nt.s === pos) {
        if (M.tone === 'pluck') pluck(I, I.motifBus, t + sw, nt.m, nt.d * sd, v, M);
        else fm(I, I.motifBus, t + sw, nt.m, nt.d * sd * 0.95, v, FM[M.tone || 'marimba']);
      }
    }
    I.first = false;
    I.n = n; lastI = I;
  }
  let lastI = null;

  /* ---------------- registry ---------------- */
  function add(name, D) {
    const T = compile(name, D);
    TRK[name] = T;
    const eng = { open: io => open(T, io), step, close };
    try { if (typeof Sound !== 'undefined' && Sound.addTrack) Sound.addTrack(name, { eng, bpm: D.bpm, xf: D.xf || 1.6, xfi: D.xfi || 0.45, dtb: D.dtb || 0.75 }); } catch (e) { /* audio is optional */ }
    return T;
  }

  /* ---------------- offline render (tests): the same voices through a copy of Sound's master chain ---------------- */
  function renderOffline(name, o) {
    o = o || {};
    const T = TRK[name]; if (!T) return Promise.reject(new Error('no track ' + name));
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const sr = o.sr || 44100, secs = o.secs || 30, ctx = new OAC(2, Math.ceil(sr * secs), sr);
    const vol = (o.vol == null ? 0.8 : o.vol) * 0.85;   // Burning Man's default music setting x Sound's MUSIC_SCALE
    const G = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.22;
    const master = G(0.5); comp.connect(master); master.connect(ctx.destination);
    const musicBus = G(vol); musicBus.connect(comp);
    const conv = ctx.createConvolver(), r = rng32(77);
    { const len = Math.floor(sr * 1.7), b = ctx.createBuffer(2, len, sr), pre = Math.floor(sr * 0.012);
      for (let chn = 0; chn < 2; chn++) { const d = b.getChannelData(chn); let lp = 0; for (let i = 0; i < len; i++) { const x = i / len, k = 0.18 + 0.62 * (1 - x); lp += k * ((r() * 2 - 1) - lp); d[i] = i < pre ? 0 : lp * Math.pow(1 - x, 2.6); } }
      conv.buffer = b; }
    const revOut = G(0.6); conv.connect(revOut); revOut.connect(comp);
    const revIn = G(vol); revIn.connect(conv);
    const dIn = G(1), dl = ctx.createDelay(2), dLp = ctx.createBiquadFilter(), dFb = G(0.36);
    dl.delayTime.value = Math.min(1.5, (T.D.dtb || 0.75) * 60 / T.bpm); dLp.type = 'lowpass'; dLp.frequency.value = 2300; dLp.Q.value = 0.5;
    dIn.connect(dl); dl.connect(dLp); dLp.connect(dFb); dFb.connect(dl); dLp.connect(musicBus);
    const out = G(1); out.connect(musicBus);
    const rs = G(1), ds = G(1); rs.connect(revIn); ds.connect(dIn);
    const I = open(T, { ctx, out, rev: rs, dly: ds });
    if (o.solo) I.solo = o.solo;
    const sd = 60 / (T.bpm * 4), n0 = o.startStep || 0, steps = Math.ceil(secs / sd);
    for (let i = 0; i < steps; i++) step(I, n0 + i, 0.02 + i * sd, sd);
    return ctx.startRendering().then(buf => ({ sr, L: buf.getChannelData(0), R: buf.getChannelData(1), sd, t0: 0.02 }));
  }
  // where the kicks fall (seconds from the render start) - lets the test check "a kick on every beat"
  function kickTimes(name, startStep, secs) {
    const T = TRK[name], sd = 60 / (T.bpm * 4), out = [];
    for (let i = 0; i * sd < secs; i++) {
      const n = (startStep || 0) + i, at = locate(T, n);
      if (at.S.fx.indexOf('gap') >= 0 && at.s >= at.S.steps - 2) continue;
      for (const layer in at.S.on) { if (layer.replace(/\d+$/, '') !== 'kick') continue; const c = T.D.drums[layer][at.s % T.D.drums[layer].length]; if (c !== '.' && c !== '-') { out.push(0.02 + i * sd); break; } }
    }
    return out;
  }
  function info(name) {
    const T = TRK[name]; if (!T) return null;
    return { name, title: T.D.title, bpm: T.bpm, key: T.D.key, mood: T.D.mood, introSteps: T.introSteps, loopSteps: T.loopSteps,
      introBars: T.introSteps / 16, loopBars: T.loopSteps / 16, sections: T.intro.concat(T.loop).map(S => ({ bars: S.bars, kind: S.kind, layers: Object.keys(S.on), fx: S.fx })) };
  }

  return { add, TRK, info, get live() { return lastI ? { name: lastI.T.name, n: lastI.n, closed: !!lastI.closed, offline: lastI.ctx !== undefined && typeof OfflineAudioContext !== 'undefined' && lastI.ctx instanceof OfflineAudioContext } : null; }, renderOffline, kickTimes, locate: (name, n) => locate(TRK[name], n), get names() { return Object.keys(TRK); } };
})();

/* ============================================================
   THE TRACKS. All original. Shared vocabulary so the soundtrack feels like one artist's album.
   ============================================================ */
(() => {
  const H = BurnsHouse, rp = (s, n) => s.repeat(n);
  // drum building blocks (16 steps per bar; 1-9 velocity)
  const K4 = '9...9...9...9...', CL = '....9.......9...', OH = '..7...7...7...7.';
  const CHS = '5.3.6.3.5.3.6.34', CHB = '6.4.7.4.6.4.7.45', CH16 = '6353635363536354', SHK = '3.5.3.5.3.5.3.5.', SHK16 = '3536353635363537';
  try {
    // ---------- Title: the playa at golden hour ----------
    H.add('bm_title', {
      title: 'Golden Hour', key: 'F minor', mood: 'melodic deep house, warm and hopeful', bpm: 120, kick: 'deep', pump: 0.42, sw: 0.09,
      prog: 'Fm9 Fm9 Dbmaj9 Dbmaj9 Abmaj9 Abmaj9 Eb6 Eb6',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK },
      bass: { tone: 'deep', pat: 'r-...r..r-..o.f.' },
      pad: { cut: 1300, center: 63, a: 1.2, rel: 1.4 },
      keys: { pat: '..6...5.....6...', center: 63 },
      motif: { tone: 'marimba', notes: '.:4 C6:2 .:2 Ab5:2 .:6 | .:16 | .:4 Eb6:2 .:2 C6:2 .:2 Bb5:4 | .:16' },
      intro: [[8, 'pad shk keys:.6', [500, 1800]]],
      loop: [[8, 'kick ch oh shk bass pad keys', [1800, 6000], 'crash'], [16, 'kick clap ch oh shk bass pad keys motif', [8000, 9000]],
        [8, 'pad keys motif shk', [2500, 1200], 'swell'], [8, 'kick clap ch oh bass pad keys:.8 motif', [1500, 9000], 'riser'],
        [16, 'kick clap ch oh shk bass pad keys motif', [12000, 12000], 'crash'], [8, 'kick ch oh shk bass pad', [9000, 1800]]]
    });
    // ---------- Story cards and the prologue: beatless, warm ----------
    H.add('bm_story', {
      title: 'Before the Dust', key: 'Eb major', mood: 'beatless, warm, a little wistful', bpm: 100, kick: 'soft', pump: 0, trim: 1.25,
      prog: 'Ebmaj9 Ebmaj9 Cm9 Cm9 Abmaj9 Abmaj9 Bb6 Bbsus4',
      drums: { shk: '..2...3...2...3.' },
      bass: { tone: 'pulse', pat: 'r---------------', gate: 1 },
      pad: { cut: 1500, center: 62, a: 1.6, rel: 1.8, lfo: 0.05 },
      keys: { pat: '6...........4...', center: 65 },
      motif: { tone: 'bell', notes: '.:8 G5:8 | .:16 | .:8 Bb5:4 G5:4 | .:16 | .:8 C6:8 | .:16 | .:8 D6:4 Bb5:4 | .:16' },
      loop: [[8, 'pad keys bass:.7', [1200, 2500]], [8, 'pad keys motif bass:.7 shk', [2500, 2500]], [8, 'pad keys:.7 motif shk', [2500, 1200]]]
    });
    // ---------- Results: a chord hit, then an easy groove ----------
    H.add('bm_results', {
      title: 'Afterglow', key: 'D major', mood: 'celebratory, then laid-back', bpm: 118, kick: 'deep', pump: 0.35, sw: 0.1,
      prog: 'Dmaj9 Bm9 Gmaj9 A6',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK, kick2: '9...............' },
      bass: { tone: 'warm', pat: 'r-..r...o-..r.f.' },
      pad: { cut: 1600, center: 64, a: 0.4, rel: 1.2 },
      stab: { pat: '9-------........', cut: 1500, fe: 2, fd: 0.2, dcy: 0.5, sus: 0.3, gate: 0.9, center: 66, dly: 0.35 },
      keys: { pat: '..6.....6...5...', center: 64 },
      intro: [[4, 'kick2 stab pad', [9000, 9000], 'crash boom']],
      loop: [[8, 'kick clap ch oh shk bass pad keys', [3000, 7000]], [8, 'kick clap ch oh shk bass pad:.6 keys', [7000, 3000]]]
    });
    // ---------- Black Rock City by day ----------
    H.add('bm_cityday', {
      title: 'Dust & Daylight', key: 'A minor', mood: 'deep house, sunlit and dusty', bpm: 122, kick: 'deep', pump: 0.45, sw: 0.1,
      prog: 'Am9 Am9 Dm9 Dm9 Fmaj9 Fmaj9 Em7 Em7',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK, rim: '..........5....3', cgh: '......4.....3.4.', cgl: '...4..........4.' },
      bass: { tone: 'warm', pat: 'r-..r..rr-..o.f.' },
      pad: { cut: 1100, center: 62, a: 0.9, rel: 1.2 },
      keys: { pat: '...6..5.....6...', center: 64 },
      motif: { tone: 'kalimba', notes: '.:2 E6:2 .:4 C6:2 .:6 | .:16 | .:2 D6:2 .:4 A5:2 .:6 | .:8 G5:4 .:4' },
      loop: [[16, 'kick clap ch oh shk bass pad keys', [2200, 7000]], [16, 'kick clap ch oh shk rim cgh cgl bass pad keys motif', [7000, 9000]],
        [8, 'shk cgh cgl pad keys motif bass:.6', [3000, 1400], 'swell'], [8, 'kick ch oh shk rim bass pad keys', [1400, 8000], 'riser roll gap'],
        [16, 'kick clap ch oh shk rim cgh cgl bass pad keys motif', [10000, 10000], 'crash'], [8, 'kick clap ch oh shk bass pad', [8000, 2200]]]
    });
    // ---------- Black Rock City at night ----------
    H.add('bm_citynight', {
      title: 'Neon Esplanade', key: 'F# minor', mood: 'deeper, rolling, driving', bpm: 124, kick: 'punch', pump: 0.5, sw: 0.07,
      prog: 'F#m9 F#m9 F#m9 F#m9 Dmaj9 Dmaj9 E6 E6',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..5...5...5...5.', rim: '...3.....3....5.' },
      bass: { tone: 'rolling', pat: '..rr.rr...rr.ro.', lo: 30 },
      bass2: { tone: 'rolling', pat: 'r.rr.rr.r.rr.rof', lo: 30 },
      pad: { cut: 800, center: 61, a: 1.0, rel: 1.4, lfo: 0.04 },
      stab: { pat: '...7......6..5..', cut: 900, fe: 3, fd: 0.06, dcy: 0.09, gate: 0.12, center: 64, dly: 0.45, q: 2.5 },
      loop: [[16, 'kick clap ch oh bass pad:.7', [1500, 4500]], [16, 'kick clap ch oh shk rim bass2 pad stab', [4500, 7000]],
        [8, 'ch:.6 shk pad stab', [2000, 900], 'swell'], [8, 'kick ch oh shk bass pad stab', [900, 6000], 'riser roll gap'],
        [16, 'kick clap ch oh shk ride rim bass2 pad stab', [8000, 8000], 'crash boom'], [8, 'kick clap ch oh bass pad', [6000, 1500]]]
    });
    // ---------- 1 The Line ----------
    H.add('bm_line', {
      title: 'Gate Road Idle', key: 'G minor', mood: 'dusty deep house, patient', bpm: 120, kick: 'deep', pump: 0.4, sw: 0.12,
      prog: 'Gm9 Gm9 Cm9 Cm9 Ebmaj9 Ebmaj9 Dm7 Dm7',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK16, cgh: '..4...3...4..3..', perc: '.......3.......3' },
      bass: { tone: 'deep', pat: 'r-..r-.r..r-o-..' },
      pad: { cut: 1000, center: 62, a: 1, rel: 1.2 },
      keys: { pat: '6-....4.....5...', center: 62 },
      loop: [[16, 'kick clap ch shk bass pad keys', [1800, 5000]], [16, 'kick clap ch oh shk cgh perc bass pad keys', [5000, 8000]],
        [8, 'shk cgh pad keys', [2500, 1200]], [8, 'kick ch oh shk cgh bass pad keys', [1200, 7000], 'riser'],
        [16, 'kick clap ch oh shk cgh perc bass pad keys', [9000, 9000], 'crash'], [8, 'kick ch shk bass pad', [7000, 1800]]]
    });
    // ---------- 2 No Camp: fire circle ----------
    H.add('bm_nocamp', {
      title: 'Fire Circle', key: 'D minor', mood: 'afro/tribal house, hand drums around the fire', bpm: 122, kick: 'soft', pump: 0.35, sw: 0.12,
      prog: 'Dm7 Dm7 Dm7 Dm7 Bbmaj7 Bbmaj7 C6 C6',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK16, cgh: '..5.4..5..4.5.4.', cgl: '5.....5....5..5.', bgo: '.4..4..3.4..4..3', rim: '...4.....4.4....' },
      bass: { tone: 'deep', pat: 'r..r..r...r..rf.' },
      pad: { cut: 900, center: 60, a: 1.4, rel: 1.5 },
      stab: { pat: '......5.......4.', cut: 1200, fe: 2, fd: 0.08, dcy: 0.12, gate: 0.14, center: 62, dly: 0.4 },
      motif: { tone: 'marimba', notes: 'A5:2 .:2 F5:2 .:2 D5:2 .:6 | .:16 | A5:2 .:2 C6:2 .:2 A5:2 .:2 G5:4 | .:16' },
      loop: [[16, 'kick ch shk cgh cgl bass pad', [1500, 5000]], [16, 'kick clap ch oh shk cgh cgl bgo rim bass pad stab', [5000, 7000]],
        [8, 'shk cgh cgl bgo pad motif', [2500, 1500]], [8, 'kick ch shk cgh cgl bgo bass pad motif', [1500, 7000], 'riser'],
        [16, 'kick clap ch oh shk cgh cgl bgo rim bass pad stab motif', [9000, 9000], 'crash'], [8, 'kick ch shk cgh cgl bass pad', [7000, 1500]]]
    });
    // ---------- 3 Costume Cult: glam, disco-house ----------
    H.add('bm_costume', {
      title: 'Sequins & Dust', key: 'Db major', mood: 'disco house, filtered, sparkly but restrained', bpm: 124, kick: 'punch', pump: 0.5, sw: 0.04,
      prog: 'Ebm9 Ab9 Dbmaj9 Gbmaj7',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK, perc: '......4.......4.' },
      bass: { tone: 'warm', pat: 'r.o.r.o.r.o.r.ot' },
      pad: { cut: 1500, center: 63, a: 0.6, rel: 1 },
      keys: { pat: '..6..6....6..6..', center: 65 },
      stab: { pat: '.......7.......6', cut: 2000, fe: 2, fd: 0.05, dcy: 0.08, gate: 0.1, center: 68, dly: 0.25 },
      loop: [[8, 'kick clap ch oh bass keys', [900, 3500]], [16, 'kick clap ch oh shk perc bass pad keys stab', [3500, 9000]],
        [8, 'pad keys shk', [2000, 1000], 'swell'], [8, 'kick ch oh bass keys pad', [800, 9000], 'riser roll gap'],
        [16, 'kick clap ch oh shk perc bass pad keys stab', [12000, 12000], 'crash'], [8, 'kick clap ch oh bass keys', [6000, 900]]]
    });
    // ---------- 4 The Orgy Dome: slow, velvet ----------
    H.add('bm_dome', {
      title: 'Velvet Dome', key: 'Eb minor', mood: 'slow sensual deep house', bpm: 116, kick: 'soft', pump: 0.38, sw: 0.14,
      prog: 'Ebm9 Ebm9 Bmaj7 Bbm7',
      drums: { kick: K4, clap: CL, ch: '4.3.5.3.4.3.5.3.', oh: OH, shk: SHK, rim: '.......4.......3' },
      bass: { tone: 'deep', pat: 'r-..r-...rr-o...' },
      pad: { cut: 900, center: 61, a: 1.2, rel: 1.5 },
      keys: { pat: '..7-....5-..6...', center: 63 },
      loop: [[8, 'kick ch shk bass pad keys', [1500, 4000]], [16, 'kick clap ch oh shk rim bass pad keys', [4000, 6000]],
        [8, 'pad keys shk', [3000, 1500]], [16, 'kick clap ch oh shk rim bass pad keys', [6000, 6000], 'crash'], [8, 'kick ch shk bass pad keys', [5000, 1500]]]
    });
    // ---------- 5 Costco Soul Trading Co.: jazzy house ----------
    H.add('bm_costco', {
      title: 'Bulk Aisle Soul', key: 'C major', mood: 'jazzy house, playful but tasteful', bpm: 120, kick: 'deep', pump: 0.4, sw: 0.11,
      prog: 'Cmaj9 Am9 Dm9 G13',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK, rim: '..4.......4..4..' },
      bass: { tone: 'warm', pat: 'r..r..o.r.s.o.f.' },
      pad: { cut: 1300, center: 62, a: 0.8, rel: 1 },
      keys: { pat: '6..5..6...5.6...', center: 64 },
      motif: { tone: 'marimba', notes: 'E6:2 .:2 D6:2 C6:2 .:8 | .:16 | C6:2 .:2 A5:2 G5:2 .:8 | .:4 B5:2 .:2 D6:2 .:6' },
      loop: [[8, 'kick ch shk bass keys', [2000, 6000]], [16, 'kick clap ch oh shk rim bass pad keys motif', [6000, 9000]],
        [8, 'keys pad shk', [3000, 1500]], [8, 'kick ch oh bass keys pad', [1500, 8000], 'riser'],
        [16, 'kick clap ch oh shk rim bass pad keys motif', [10000, 10000], 'crash'], [8, 'kick clap ch shk bass keys', [8000, 2000]]]
    });
    // ---------- 6 The Art Car Hunt: tech house with fire ----------
    H.add('bm_artcar', {
      title: 'Octopus Ink', key: 'F minor', mood: 'tech house, percussive, hot', bpm: 126, kick: 'tech', pump: 0.48, sw: 0.06,
      prog: 'Fm7 Fm7 Fm7 Fm7 Dbmaj7 Dbmaj7 Eb Eb',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..5...5...5...5.', cgh: '..5..4....5..4..', perc: '...4..4....4..4.', rim: '.3...3.3...3...3' },
      bass: { tone: 'tech', pat: '..r..r.r..r..rr.', lo: 29 },
      stab: { pat: '...6....7.......', cut: 800, fe: 3.5, fd: 0.05, dcy: 0.07, gate: 0.1, center: 62, dly: 0.4, q: 3 },
      pad: { cut: 700, center: 60, a: 1, rel: 1.2 },
      loop: [[16, 'kick clap ch oh rim bass', [2500, 6000]], [16, 'kick clap ch oh shk cgh perc rim bass stab', [6000, 8000]],
        [8, 'ch:.7 shk cgh perc pad stab', [2500, 1200]], [8, 'kick ch oh shk perc bass stab', [1200, 8000], 'riser roll gap'],
        [16, 'kick clap ch oh shk ride cgh perc rim bass stab pad:.6', [9000, 9000], 'crash boom'], [8, 'kick clap ch oh rim bass', [8000, 2500]]]
    });
    // ---------- 7 Sunrise Set: warm and emotional ----------
    H.add('bm_sunrise', {
      title: 'First Light', key: 'Ab major', mood: 'melodic house at dawn, warm, emotional', bpm: 122, kick: 'deep', pump: 0.45, sw: 0.06,
      prog: 'Dbmaj9 Dbmaj9 Eb6 Eb6 Cm7 Cm7 Fm9 Fm9',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK16, ride: '..4...4...4...4.' },
      bass: { tone: 'warm', pat: 'r-..r-.rr-..o-..' },
      pad: { cut: 1600, center: 64, a: 1.3, rel: 1.6, lfo: 0.05 },
      keys: { pat: '6.......5...4...', center: 65 },
      motif: { tone: 'pluck', cut: 1400, fe: 3, notes: 'Ab5:3 .:1 C6:3 .:1 Eb6:4 C6:4 | .:16 | G5:3 .:1 Bb5:3 .:1 Eb6:4 Bb5:4 | .:16 | G5:3 .:1 C6:3 .:1 Eb6:4 G6:4 | .:16 | F5:3 .:1 Ab5:3 .:1 C6:4 Eb6:4 | .:16' },
      intro: [[8, 'pad keys:.7', [600, 2500]]],
      loop: [[16, 'kick ch oh shk bass pad keys', [2500, 8000], 'crash'], [16, 'kick clap ch oh shk bass pad keys motif', [8000, 10000]],
        [8, 'pad keys motif', [3000, 2000], 'swell'], [8, 'pad keys motif shk bass:.6', [2000, 9000], 'riser roll'],
        [16, 'kick clap ch oh shk ride bass pad keys motif', [12000, 12000], 'crash boom'], [8, 'kick ch oh shk bass pad keys', [10000, 2500]]]
    });
    // ---------- 8 Hell Station: tension ----------
    H.add('bm_hell', {
      title: 'Running on Fumes', key: 'E phrygian', mood: 'dark tech house, metallic tension', bpm: 126, kick: 'tech', pump: 0.5, sw: 0.04,
      prog: 'Em7 Em7 Fmaj7 Em7',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '..5...5...5...5.', perc: '.5..5...5..5.5..', rim: '..3..3..3..3.3..', snr: '............4...' },
      bass: { tone: 'acid', pat: 'r.rr.r.o.rr.r.f.', lo: 28 },
      stab: { pat: '........6.....5.', cut: 700, fe: 4, fd: 0.04, dcy: 0.06, gate: 0.09, center: 60, dly: 0.5, q: 4 },
      pad: { cut: 600, center: 59, a: 1.5, rel: 1.5, lfo: 0.09, lfoAmt: 0.5 },
      loop: [[8, 'kick ch perc bass pad:.6', [1200, 3000]], [16, 'kick clap ch oh perc rim bass stab pad:.6', [3000, 6000]],
        [8, 'ch:.6 perc pad stab', [1500, 900], 'swell'], [8, 'kick ch perc rim bass stab', [900, 7000], 'riser roll gap'],
        [16, 'kick clap ch oh ride perc rim snr bass stab pad:.6', [8000, 8000], 'crash boom'], [8, 'kick clap ch perc bass', [6000, 1200]]]
    });
    // ---------- 9 Deep Playa Showdown: dust storm ----------
    H.add('bm_deep', {
      title: 'Whiteout', key: 'B minor', mood: 'deep, dubby, hypnotic in the dust', bpm: 124, kick: 'punch', pump: 0.48, sw: 0.06,
      prog: 'Bm9 Bm9 Gmaj9 Gmaj9 Em9 Em9 F#7sus4 F#7sus4',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, rim: '..3...3....3..3.' },
      bass: { tone: 'rolling', pat: '..r...r...r..rr.', lo: 30 },
      stab: { pat: '...6.......5....', cut: 1000, fe: 2.5, fd: 0.07, dcy: 0.1, gate: 0.14, center: 64, dly: 0.6, q: 2 },
      pad: { cut: 900, center: 62, a: 1.4, rel: 1.6, lfo: 0.03 },
      loop: [[16, 'kick ch oh shk bass pad:.7 stab', [1200, 4000]], [16, 'kick clap ch oh shk rim bass pad stab', [4000, 6500]],
        [8, 'shk pad stab', [2000, 800], 'swell'], [8, 'kick ch shk bass pad stab', [800, 7000], 'riser roll gap'],
        [16, 'kick clap ch oh shk rim bass pad stab', [8000, 8000], 'crash boom'], [8, 'kick ch oh bass pad', [6000, 1200]]]
    });
    // ---------- 10 The Man Pavilion: the approach ----------
    H.add('bm_pavilion', {
      title: 'The Approach', key: 'C minor', mood: 'melodic, building tension', bpm: 124, kick: 'punch', pump: 0.45, sw: 0.04,
      prog: 'Cm9 Cm9 Abmaj7 Abmaj7 Fm9 Fm9 G7sus4 G7sus4',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '..5...5...5...5.', snr: '............4.3.' },
      bass: { tone: 'reese', pat: 'r-.r-.r-r-.r-.o-', lo: 31 },
      pad: { cut: 1200, center: 62, a: 1.2, rel: 1.4 },
      motif: { tone: 'pluck', cut: 1100, fe: 3, notes: 'G5:2 .:2 C6:2 .:2 Eb6:2 .:2 D6:4 | .:16 | Eb6:2 .:2 C6:2 .:2 Ab5:2 .:2 G5:4 | .:16 | F5:2 .:2 Ab5:2 .:2 C6:2 .:2 Eb6:4 | .:16 | D6:2 .:2 B5:2 .:2 G5:2 .:2 F5:4 | .:16' },
      loop: [[16, 'kick ch bass pad:.7', [1000, 4000]], [16, 'kick clap ch oh bass pad motif', [4000, 8000]],
        [8, 'pad motif', [3000, 1500], 'swell'], [8, 'kick ch oh bass pad motif', [1500, 9000], 'riser roll gap'],
        [16, 'kick clap ch oh ride snr bass pad motif', [11000, 11000], 'crash boom'], [8, 'kick ch oh bass pad', [8000, 1000]]]
    });
    // ---------- Boss fights (worlds 3, 4, 8) ----------
    H.add('bm_boss', {
      title: 'Showdown', key: 'A minor', mood: 'tense, driving tech house', bpm: 126, kick: 'tech', pump: 0.52, sw: 0.03,
      prog: 'Am7 Am7 Bbmaj7 Am7',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '..6...6...6...6.', snr: '..........4..4.4', perc: '.4..4..4..4..4..' },
      bass: { tone: 'tech', pat: 'r.rr.rr.r.rr.ro.', lo: 28 },
      stab: { pat: '.7.....6.7......', cut: 900, fe: 3.5, fd: 0.04, dcy: 0.06, gate: 0.09, center: 62, dly: 0.35, q: 3 },
      pad: { cut: 700, center: 60, a: 1, rel: 1, lfo: 0.12, lfoAmt: 0.5 },
      loop: [[8, 'kick clap ch oh perc bass stab pad:.6', [3000, 7000], 'crash'], [8, 'kick clap ch oh ride perc snr bass stab pad:.6', [7000, 9000]],
        [4, 'ch perc bass stab', [2000, 8000], 'riser roll gap'], [12, 'kick clap ch oh ride perc snr bass stab pad', [10000, 10000], 'crash boom']]
    });
    // ---------- The Man (phase 1) ----------
    H.add('bm_man', {
      title: 'Effigy', key: 'G minor', mood: 'dark, heavy, menacing groove', bpm: 128, kick: 'tech', pump: 0.55, sw: 0.03,
      prog: 'Gm7 Gm7 Ebmaj7 D7sus4',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '..6...6...6...6.', snr: '....5.......5..4', perc: '..4..4..4..4..4.' },
      bass: { tone: 'reese', pat: 'r.r.r.rrr.r.r.ro', lo: 31 },
      stab: { pat: '7..7..7.........', cut: 800, fe: 3, fd: 0.05, dcy: 0.08, gate: 0.11, center: 60, dly: 0.3, q: 2.5 },
      pad: { cut: 650, center: 58, a: 1.2, rel: 1.2, lfo: 0.1, lfoAmt: 0.5 },
      loop: [[8, 'kick clap ch oh perc bass pad', [2500, 6000], 'crash'], [8, 'kick clap ch oh ride perc bass stab pad', [6000, 8000]],
        [4, 'ch perc bass:.7 stab pad', [1500, 8000], 'riser roll gap'], [12, 'kick clap snr ch oh ride perc bass stab pad', [10000, 10000], 'crash boom']]
    });
    // ---------- The giant Man (phase 2): peak time ----------
    H.add('bm_giant', {
      title: 'Giant', key: 'C# minor', mood: 'peak-time, relentless', bpm: 128, kick: 'tech', pump: 0.58, sw: 0.02,
      prog: 'C#m7 C#m7 Amaj7 B6',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '6.6.6.6.6.6.6.6.', snr: '....5.......5.55', perc: '.4.4..4..4.4..4.', cgh: '..5..5....5..5..' },
      bass: { tone: 'acid', pat: 'rrorrorrrrorrfro', lo: 30 },
      stab: { pat: '..7..7..7..7..7.', cut: 1100, fe: 3, fd: 0.04, dcy: 0.06, gate: 0.08, center: 63, dly: 0.25, q: 3 },
      pad: { cut: 1200, center: 61, a: 0.8, rel: 1 },
      loop: [[8, 'kick clap ch oh ride perc bass stab pad', [6000, 10000], 'crash boom'], [8, 'kick clap snr ch oh ride perc cgh bass stab pad', [10000, 10000]],
        [4, 'ch ride perc bass stab', [3000, 10000], 'riser roll gap'], [12, 'kick clap snr ch oh ride perc cgh bass stab pad', [12000, 12000], 'crash boom']]
    });
    // ---------- The Burn: the big release ----------
    H.add('bm_burn', {
      title: 'The Burn', key: 'D major', mood: 'euphoric melodic house, the big release', bpm: 124, kick: 'punch', pump: 0.5, sw: 0.04, trim: 1.05,
      prog: 'Bm9 Gmaj9 Dmaj9 A6',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..5...5...5...5.' },
      bass: { tone: 'warm', pat: 'r-.r..r-r-.r..o-' },
      pad: { cut: 1800, center: 64, a: 1.2, rel: 1.6, lfo: 0.05 },
      keys: { pat: '7.......6...5...', center: 66 },
      stab: { pat: '..7...7...7...7.', cut: 1600, fe: 2.5, fd: 0.06, dcy: 0.1, gate: 0.12, center: 66, dly: 0.3 },
      motif: { tone: 'pluck', cut: 1600, fe: 3, notes: 'F#6:3 .:1 D6:3 .:1 B5:4 A5:4 | .:16 | D6:3 .:1 B5:3 .:1 G5:4 F#5:4 | .:16 | A5:3 .:1 D6:3 .:1 F#6:4 E6:4 | .:16 | C#6:3 .:1 E6:3 .:1 A6:4 E6:4 | .:16' },
      intro: [[8, 'pad keys', [700, 3000]], [8, 'pad keys motif shk bass:.6', [3000, 10000], 'riser roll gap']],
      loop: [[16, 'kick clap ch oh shk ride bass pad keys stab motif', [12000, 12000], 'crash boom'], [16, 'kick clap ch oh shk ride bass pad keys motif', [12000, 9000]],
        [8, 'pad keys motif', [3000, 2000], 'swell'], [8, 'pad keys motif shk bass:.6', [2000, 10000], 'riser roll gap']]
    });
    // ---------- 11 Sound Camp Crawl (also the camp sandbox) ----------
    H.add('bm_soundcamp', {
      title: 'Esplanade Peak Hour', key: 'A minor', mood: 'tech house, chunky and bouncy', bpm: 126, kick: 'tech', pump: 0.5, sw: 0.08,
      prog: 'Am7 Am7 Am7 Am7 Fmaj7 Fmaj7 G6 G6',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..5...5...5...5.', perc: '...4..4.....4...', rim: '.3...3.3.3...3..' },
      bass: { tone: 'tech', pat: '..r..rr...r..ro.', lo: 28 },
      stab: { pat: '...7..6.......6.', cut: 1100, fe: 3, fd: 0.05, dcy: 0.08, gate: 0.1, center: 64, dly: 0.35, q: 2.5 },
      pad: { cut: 800, center: 60, a: 1, rel: 1 },
      loop: [[16, 'kick clap ch oh rim bass stab', [3000, 7000]], [16, 'kick clap ch oh shk perc rim bass stab', [7000, 9000]],
        [8, 'ch:.6 shk perc stab pad', [2500, 1200]], [8, 'kick ch oh shk perc bass stab', [1200, 9000], 'riser roll gap'],
        [16, 'kick clap ch oh shk ride perc rim bass stab pad:.6', [10000, 10000], 'crash boom'], [8, 'kick clap ch oh bass', [8000, 3000]]]
    });
    // ---------- 12 The Temple: beatless ----------
    H.add('bm_temple', {
      title: 'The Temple', key: 'B minor', mood: 'ambient, beatless, reverent', bpm: 70, kick: 'soft', pump: 0, trim: 1.5, rev: 0.45,
      prog: 'Bm9 Bm9 Gmaj9 Gmaj9 Dmaj9 Dmaj9 Asus2 Asus2',
      bass: { tone: 'pulse', pat: 'r---------------', gate: 1 },
      pad: { cut: 2400, center: 64, a: 2.4, rel: 2.5, lfo: 0.04 },
      lvl: { motif: 0.4, keys: 0.5, pad: 0.26 },
      motif: { tone: 'bell', notes: '.:8 F#5:8 | .:16 | .:8 D6:8 | .:16 | .:8 A5:8 | .:16 | .:8 E6:4 C#6:4 | .:16' },
      keys: { pat: '5...............', center: 66, tone: 'glass' },
      loop: [[8, 'pad bass:.6 keys', [1400, 2600]], [8, 'pad bass:.6 motif keys', [2600, 2600]], [8, 'pad bass:.5 motif', [2600, 1400]]]
    });
    // ---------- 13 The Workshops: organic, playful ----------
    H.add('bm_workshops', {
      title: 'Contact Improv', key: 'D dorian', mood: 'organic house, light and curious', bpm: 118, kick: 'soft', pump: 0.35, sw: 0.13,
      prog: 'Dm9 Dm9 G9 G9',
      drums: { kick: K4, clap: CL, shk: SHK16, cgh: '..5..4.5..4..5..', cgl: '5.....5...5.....', bgo: '...4.....4..4...', perc: '......3.......3.', oh: OH },
      bass: { tone: 'deep', pat: 'r..r..r...r.o...' },
      pad: { cut: 1100, center: 62, a: 1, rel: 1.2 },
      motif: { tone: 'kalimba', notes: 'A5:2 .:2 C6:2 .:2 E6:2 .:2 D6:2 .:2 | .:16 | B5:2 .:2 D6:2 .:2 F6:2 .:2 E6:2 .:2 | .:16' },
      keys: { pat: '..5.....5.......', center: 62 },
      loop: [[8, 'kick shk cgh cgl bass pad', [1500, 5000]], [16, 'kick clap shk cgh cgl bgo perc oh bass pad motif keys', [5000, 8000]],
        [8, 'shk cgh cgl bgo pad motif', [2500, 1500]], [16, 'kick clap shk cgh cgl bgo perc oh bass pad motif keys', [8000, 8000], 'crash'], [8, 'kick shk cgh cgl bass pad', [6000, 1500]]]
    });
    // ---------- 14 Skydive ----------
    H.add('bm_skydive', {
      title: 'Freefall', key: 'E minor', mood: 'airy progressive house, wide open', bpm: 124, kick: 'punch', pump: 0.45, sw: 0.04,
      prog: 'Em9 Em9 Cmaj9 Cmaj9 G6 G6 D6 D6',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..4...4...4...4.' },
      bass: { tone: 'rolling', pat: '..r-..r-..r-..o-', lo: 31 },
      pad: { cut: 2000, center: 66, a: 1.2, rel: 1.6, lfo: 0.05 },
      motif: { tone: 'pluck', cut: 1500, fe: 3, notes: 'B5:2 .:2 E6:2 .:2 G6:2 .:6 | .:16 | G5:2 .:2 C6:2 .:2 E6:2 .:6 | .:16 | B5:2 .:2 D6:2 .:2 G6:2 .:6 | .:16 | A5:2 .:2 D6:2 .:2 F#6:2 .:6 | .:16' },
      loop: [[16, 'kick ch oh shk bass pad', [2000, 7000]], [16, 'kick clap ch oh shk ride bass pad motif', [7000, 10000]],
        [8, 'pad motif', [3000, 2000], 'swell'], [8, 'pad motif shk bass:.6', [2000, 10000], 'riser roll gap'],
        [16, 'kick clap ch oh shk ride bass pad motif', [12000, 12000], 'crash boom'], [8, 'kick ch oh shk bass pad', [9000, 2000]]]
    });
    // ---------- 15 Exodus (and the chase) ----------
    H.add('bm_exodus', {
      title: 'Exodus', key: 'E major', mood: 'balearic house, sleepy sunrise highway', bpm: 116, kick: 'soft', pump: 0.35, sw: 0.12,
      prog: 'Emaj9 Emaj9 C#m9 C#m9 Amaj9 Amaj9 B6 B6',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK, cgh: '......4.......3.' },
      bass: { tone: 'deep', pat: 'r-..r-..r-.ro-..' },
      pad: { cut: 1500, center: 64, a: 1.2, rel: 1.4, lfo: 0.05 },
      keys: { pat: '6...5.......5...', center: 66 },
      motif: { tone: 'kalimba', notes: '.:4 G#5:2 .:2 B5:4 .:4 | .:16 | .:4 E5:2 .:2 G#5:4 .:4 | .:16 | .:4 C#6:2 .:2 E6:4 .:4 | .:16 | .:4 D#6:2 .:2 F#5:4 .:4 | .:16' },
      loop: [[16, 'kick ch shk bass pad keys', [2000, 6000]], [16, 'kick clap ch oh shk cgh bass pad keys motif', [6000, 8000]],
        [8, 'pad keys motif shk', [3000, 1500]], [16, 'kick clap ch oh shk cgh bass pad keys motif', [8000, 8000], 'crash'], [8, 'kick ch shk bass pad keys', [6000, 2000]]]
    });
    H.add('bm_chase', {
      title: 'Lights in the Mirror', key: 'F minor', mood: 'urgent, driving tension', bpm: 128, kick: 'tech', pump: 0.52, sw: 0.03,
      prog: 'Fm7 Fm7 Gbmaj7 Fm7',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, ride: '..6...6...6...6.', perc: '.4..4..4..4..4..', snr: '..........4..4.4' },
      bass: { tone: 'acid', pat: 'r.rr.rr.r.rr.ro.', lo: 29 },
      stab: { pat: '.6.....6.6......', cut: 900, fe: 3.5, fd: 0.04, dcy: 0.06, gate: 0.09, center: 62, dly: 0.3, q: 3 },
      pad: { cut: 700, center: 60, a: 1, rel: 1, lfo: 0.12, lfoAmt: 0.5 },
      loop: [[8, 'kick clap ch oh perc bass stab pad:.6', [4000, 8000], 'crash'], [8, 'kick clap ch oh ride perc snr bass stab pad:.6', [8000, 10000]],
        [4, 'ch perc bass stab', [2000, 9000], 'riser roll gap'], [12, 'kick clap ch oh ride perc snr bass stab pad', [10000, 10000], 'crash boom']]
    });
    // ---------- 16 Rhythm Wave (and its wonky twin) ----------
    H.add('bm_rhythm', {
      title: 'Bamboo Floor', key: 'D dorian', mood: 'organic afro house, marimba and hand drums', bpm: 122, kick: 'soft', pump: 0.38, sw: 0.1,
      prog: 'Dm9 Gm9 Cmaj7 Fmaj7 Dm9 Gm9 Bbmaj7 A7sus4',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK16, rim: '..5..5.5..5...5.', cgh: '..5.4..5..4.5.4.', cgl: '5.....5....5..5.', bgo: '.4..4..3.4..4..3' },
      bass: { tone: 'deep', pat: 'r-..r.r-..o-r.f.' },
      pad: { cut: 1100, center: 62, a: 1, rel: 1.2 },
      motif: { tone: 'marimba', notes: 'A5:2 .:1 C6:1 D6:2 .:2 F6:2 E6:2 D6:2 C6:2 | D6:2 .:2 A5:2 .:2 G5:4 .:4 | E6:2 .:1 D6:1 C6:2 .:2 G5:2 .:6 | .:16' },
      loop: [[16, 'kick ch shk rim cgh cgl bass pad', [1800, 5000]], [16, 'kick clap ch oh shk rim cgh cgl bgo bass pad motif', [5000, 8000]],
        [8, 'shk rim cgh cgl bgo pad motif', [2500, 1500]], [8, 'kick ch shk rim cgh cgl bass pad motif', [1500, 8000], 'riser'],
        [16, 'kick clap ch oh shk rim cgh cgl bgo bass pad motif', [9000, 9000], 'crash'], [8, 'kick ch shk cgh cgl bass pad', [8000, 1800]]]
    });
    H.add('bm_wonk', {
      title: 'Bamboo Floor (Melted)', key: 'D dorian', mood: 'woozy, slowed, dubbed-out', bpm: 108, kick: 'soft', pump: 0.3, sw: 0.16, rev: 0.4, dtb: 0.5,
      prog: 'Dm9 Gm9 Cmaj7 Fmaj7',
      drums: { kick: '9.........9.....', clap: '........9.......', shk: SHK, rim: '..5...5...5.5...', cgl: '5.....5.........' },
      bass: { tone: 'reese', pat: 'r-------r-----o-' },
      pad: { cut: 900, center: 62, a: 1.4, rel: 1.6, lfo: 0.25, lfoAmt: 0.7, det: 22 },
      motif: { tone: 'glass', notes: 'A5:4 .:4 D6:4 .:4 | .:16 | E6:4 .:4 C6:4 .:4 | .:16' },
      loop: [[8, 'kick clap shk rim cgl bass pad motif', [1200, 2500]], [8, 'kick clap shk rim cgl bass pad motif', [2500, 1200]]]
    });
    // ---------- 17 Root Society (home): day and night ----------
    H.add('bm_root', {
      title: 'Root Society', key: 'D minor', mood: 'melodic organic house, home', bpm: 120, kick: 'deep', pump: 0.42, sw: 0.1,
      prog: 'Dm9 Dm9 Bbmaj9 Bbmaj9 Gm9 Gm9 A7sus4 A7sus4',
      drums: { kick: K4, clap: CL, ch: CHS, oh: OH, shk: SHK16, cgh: '..5..4.5..4..5..', cgl: '5.....5....5....', bgo: '.....4.......4..' },
      bass: { tone: 'warm', pat: 'r..r..r.r..o..f.' },
      pad: { cut: 1300, center: 62, a: 1.1, rel: 1.4, lfo: 0.05 },
      keys: { pat: '..6.....5...6...', center: 64 },
      motif: { tone: 'marimba', notes: 'D6:2 .:2 A5:2 .:2 F5:2 .:2 E5:2 F5:2 | .:16 | D6:2 .:2 Bb5:2 .:2 F5:2 .:2 D5:4 | .:16 | G5:2 .:2 Bb5:2 .:2 D6:2 .:2 F6:4 | .:16 | E6:2 .:2 C#6:2 .:2 A5:2 .:2 G5:4 | .:16' },
      loop: [[16, 'kick clap ch shk cgh cgl bass pad keys', [2000, 6000]], [16, 'kick clap ch oh shk cgh cgl bgo bass pad keys motif', [6000, 9000]],
        [8, 'shk cgh cgl pad keys motif', [3000, 1500], 'swell'], [8, 'kick ch shk cgh cgl bass pad keys motif', [1500, 9000], 'riser roll'],
        [16, 'kick clap ch oh shk cgh cgl bgo bass pad keys motif', [11000, 11000], 'crash'], [8, 'kick ch shk cgh cgl bass pad', [9000, 2000]]]
    });
    H.add('bm_rootnight', {
      title: 'Root Society After Dark', key: 'D minor', mood: 'deeper, driving, the domes are open', bpm: 123, kick: 'punch', pump: 0.5, sw: 0.07,
      prog: 'Dm9 Dm9 Bbmaj7 Bbmaj7 Gm9 Gm9 A7sus4 A7sus4',
      drums: { kick: K4, clap: CL, ch: CH16, oh: OH, shk: SHK16, ride: '..5...5...5...5.', cgh: '..5..4....5..4..', rim: '...3.....3....3.' },
      bass: { tone: 'rolling', pat: '..rr.rr...rr.ro.', lo: 31 },
      pad: { cut: 900, center: 61, a: 1.2, rel: 1.4, lfo: 0.04 },
      stab: { pat: '...7......6..5..', cut: 950, fe: 3, fd: 0.06, dcy: 0.09, gate: 0.12, center: 64, dly: 0.45, q: 2.5 },
      motif: { tone: 'marimba', notes: 'D6:2 .:2 A5:2 .:10 | .:16 | D6:2 .:2 Bb5:2 .:10 | .:16 | G5:2 .:2 D6:2 .:10 | .:16 | E6:2 .:2 A5:2 .:10 | .:16' },
      loop: [[16, 'kick clap ch oh shk bass pad:.7 stab', [1800, 5000]], [16, 'kick clap ch oh shk rim cgh bass pad stab motif', [5000, 8000]],
        [8, 'ch:.6 shk pad stab motif', [2000, 900], 'swell'], [8, 'kick ch shk cgh bass pad stab', [900, 7000], 'riser roll gap'],
        [16, 'kick clap ch oh shk ride rim cgh bass pad stab motif', [9000, 9000], 'crash boom'], [8, 'kick clap ch oh bass pad', [7000, 1800]]]
    });
  } catch (e) { if (typeof console !== 'undefined') console.error(e); }
})();

/* ---------------- which house track each game music name means ---------------- */
BurnsHouse.ROUTE = {
  burns_title: 'bm_title', burns_intro: 'bm_story', burns_victory: 'bm_results', credits: 'bm_results',
  burns_hub: '@city', burns_w1: 'bm_line', burns_w2: 'bm_nocamp', burns_w3: 'bm_costume', burns_w4: 'bm_dome', burns_w5: 'bm_costco',
  burns_w6: 'bm_artcar', burns_w7: 'bm_sunrise', burns_w8: 'bm_hell', burns_w9: 'bm_deep', burns_w10: 'bm_pavilion',
  burns_w11: 'bm_soundcamp', burns_w12: 'bm_temple', secret: 'bm_temple', burns_w13: 'bm_workshops', gift_camp: 'bm_workshops', castle: 'bm_workshops',
  burns_w14: 'bm_skydive', burns_w15: 'bm_exodus', burns_w15_chase: 'bm_chase', star: 'bm_chase',
  burns_w16: 'bm_rhythm', land9: 'bm_rhythm', burns_w16_wonk: 'bm_wonk', glitch: 'bm_wonk',
  burns_w17: 'bm_root', burns_w17n: 'bm_rootnight', land3: 'bm_soundcamp',
  boss: 'bm_boss', man_boss: 'bm_man', man_giant: 'bm_giant', burns_ending: 'bm_burn', ending: 'bm_burn'
};
BurnsHouse.cityNight = false;
BurnsHouse.resolve = function (name) {
  if (!name) return null;
  if (BurnsHouse.TRK[name]) return name;
  const r = BurnsHouse.ROUTE[name];
  if (r === '@city') return BurnsHouse.cityNight ? 'bm_citynight' : 'bm_cityday';
  return r || null;
};
// the open city calls this as its sky changes; switches tracks only while a city track is playing
BurnsHouse.setCityNight = function (night) {
  night = !!night;
  if (night === BurnsHouse.cityNight) return;
  BurnsHouse.cityNight = night;
  try { const cur = Sound.currentTrack; if (cur === 'bm_cityday' || cur === 'bm_citynight') burnsMusic('burns_hub'); } catch (e) { /* ignore */ }
};
// anything the game asks for that has no house track still gets one (the day groove) - never the old chiptune
BURNS_MUSIC_ROUTE.fn = function (name) { return BurnsHouse.resolve(name) || 'bm_cityday'; };
try { if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsHouse, burnsMusic }); } catch (e) { /* no window */ }
