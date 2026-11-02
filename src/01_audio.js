// ============================================================================
// 01_audio.js - Brady-O sound engine. Everything is synthesized live with the
// Web Audio API (no samples). One top-level binding: Sound.
// All music is original. Every public method is a silent no-op on failure.
// ============================================================================
const Sound = (() => {
  'use strict';
  const noop = () => {};
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  let AC = null;
  try {
    AC = (typeof window !== 'undefined' && window) ? (window.AudioContext || window.webkitAudioContext || null) : null;
  } catch (e) { AC = null; }

  // ---------------------------------------------------------------- state --
  let ctx = null, dead = !AC, unlockedOnce = false, userPaused = false;
  let master = null, comp = null, musicBus = null, sfxBus = null, sfxDry = null, mRevIn = null, conv = null;
  let chipNoise = null;
  // per-voice modifiers set by the sequencer right before a voice is created
  const VM = { cm: 1, wr: 0 };
  let delayIn = null, delayNode = null;
  let noiseBuf = null, distCurve = null, crushCurve = null;
  const waves = {};
  let musicVol = 0.6, sfxVol = 0.8, boost = false;
  const MUSIC_SCALE = 0.85;   // music sits a little under the SFX

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteNum(s) {
    if (typeof s === 'number') return s;
    const r = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!r) return null;
    return 12 * (+r[3] + 1) + PC[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
  }

  // -------------------------------------------------------------- helpers --
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function filt(type, f, q) {
    const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b;
  }
  // disconnect a voice's nodes once its source has finished
  function done(src, list) {
    src.onended = () => {
      for (let i = 0; i < list.length; i++) {
        try { const n = list[i]; if (typeof n === 'function') n(); else n.disconnect(); } catch (e) { /* ignore */ }
      }
    };
  }

  function makeIR(sec, pw) {
    const sr = ctx.sampleRate, len = Math.max(1, Math.floor(sr * sec)), b = ctx.createBuffer(2, len, sr);
    const pre = Math.floor(sr * 0.012);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) {
        const x = i / len, k = 0.18 + 0.62 * (1 - x);   // gets darker as it decays
        lp += k * ((Math.random() * 2 - 1) - lp);
        d[i] = i < pre ? 0 : lp * Math.pow(1 - x, pw);
      }
    }
    return b;
  }

  function makeCurves() {
    const n = 1024; distCurve = new Float32Array(n); crushCurve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      distCurve[i] = Math.tanh(x * 5) * 0.75;
      crushCurve[i] = Math.round(x * 7) / 7;            // amplitude quantizer = "bit crush" feel
    }
  }

  function setWave(o, w) {
    if (w === 'sawtooth' || w === 'square' || w === 'triangle' || w === 'sine') { o.type = w; return; }
    try {
      let pw = waves[w];
      if (!pw) {
        const N = 64, re = new Float32Array(N), im = new Float32Array(N);
        if (w === 'ntri') {
          // NES-style 4-bit stepped triangle: Fourier series computed numerically
          const S = 512;
          for (let n = 1; n < N; n++) {
            let a = 0, b = 0;
            for (let i = 0; i < S; i++) {
              const ph = i / S, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2, q = (Math.round(tri * 15) / 15) * 2 - 1, ang = 2 * Math.PI * n * ph;
              a += q * Math.cos(ang); b += q * Math.sin(ang);
            }
            re[n] = (2 * a) / S; im[n] = (2 * b) / S;
          }
        } else {
          // soft = warm saw; p12/p25 = softened pulses; n12/n25 = raw chip pulses
          const chip = w[0] === 'n', duty = (w === 'p12' || w === 'n12') ? 0.125 : 0.25;
          for (let n = 1; n < N; n++) {
            if (w === 'soft') im[n] = n < 26 ? (1 / n) * (1 - n / 26) : 0;
            else if (chip || n < 40) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty) * (chip ? 1 : Math.exp(-n / 30));
          }
        }
        pw = waves[w] = ctx.createPeriodicWave(re, im);
      }
      o.setPeriodicWave(pw);
    } catch (e) { o.type = w === 'soft' ? 'sawtooth' : 'square'; }
  }

  // ----------------------------------------------------------------- init --
  function init() {
    if (ctx || dead) return;
    try {
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
      comp = ctx.createDynamicsCompressor();
      const cp = (k, v) => { try { comp[k].value = v; } catch (e) { /* ignore */ } };
      cp('threshold', -16); cp('knee', 10); cp('ratio', 3.5); cp('attack', 0.004); cp('release', 0.22);
      master = gain(0.5); comp.connect(master); master.connect(ctx.destination);
      musicBus = gain(musicVol * MUSIC_SCALE); musicBus.connect(comp);
      sfxBus = gain(sfxVol); sfxBus.connect(comp);
      sfxDry = gain(sfxVol); sfxDry.connect(comp);          // chiptune SFX: no reverb
      // short generated-impulse reverb
      conv = ctx.createConvolver(); conv.buffer = makeIR(1.7, 2.6);
      const revOut = gain(0.6); conv.connect(revOut); revOut.connect(comp);
      mRevIn = gain(musicVol * MUSIC_SCALE); mRevIn.connect(conv);
      const sfxRev = gain(0.14); sfxBus.connect(sfxRev); sfxRev.connect(conv);
      // tempo-synced feedback echo for the music
      delayIn = gain(1); delayNode = ctx.createDelay(2); delayNode.delayTime.value = 0.375;
      const dLp = filt('lowpass', 2300, 0.5), dFb = gain(0.36);
      delayIn.connect(delayNode); delayNode.connect(dLp); dLp.connect(dFb); dFb.connect(delayNode); dLp.connect(musicBus);
      // 1 second of white noise shared by every noise voice
      const sr = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, sr, sr);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      // 1-bit "chip" noise (held for 3 samples) for the 8-bit drum kit and SFX
      chipNoise = ctx.createBuffer(1, sr, sr);
      const cd = chipNoise.getChannelData(0);
      for (let i = 0, x = 1; i < cd.length; i++) { if (i % 3 === 0) x = Math.random() < 0.5 ? -0.8 : 0.8; cd[i] = x; }
      makeCurves();
      if (userPaused) { try { const p = ctx.suspend(); if (p && p.catch) p.catch(noop); } catch (e) { /* ignore */ } }
    } catch (e) {
      dead = true;
      try { if (ctx && ctx.close) ctx.close(); } catch (e2) { /* ignore */ }
      ctx = null;
    }
  }

  // --------------------------------------------------------------- voices --
  // envelope: linear attack, decay toward sustain, exponential-ish release
  function env(prm, t, pk, a, dcy, sus, relAt, rel) {
    prm.setValueAtTime(0, t);
    prm.linearRampToValueAtTime(pk, t + a);
    if (sus < 1) prm.setTargetAtTime(pk * sus, t + a, Math.max(0.005, dcy));
    prm.setTargetAtTime(0, Math.max(relAt, t + a + 0.002), Math.max(0.005, rel / 3));
  }

  // subtractive voice: 1-2 oscillators -> (shaper) -> filter -> amp
  function synth(t, f, d, v, out, p) {
    const n = p.w.length, g = ctx.createGain(), nodes = [g];
    let head = g;
    if (p.cut) {
      const fl = ctx.createBiquadFilter(); fl.type = p.ft || 'lowpass'; fl.Q.value = p.q || 0.7;
      const c = clamp(p.cut * VM.cm * (p.kt ? Math.pow(f / 261.6, p.kt) : 1), 60, 16000);
      if (p.fe) { fl.frequency.setValueAtTime(clamp(c * (1 + p.fe), 60, 18000), t); fl.frequency.setTargetAtTime(c, t, p.fd || 0.1); }
      else fl.frequency.setValueAtTime(c, t);
      fl.connect(head); head = fl; nodes.push(fl);
    }
    if (p.wob && head !== g) {   // filter wobble (dub / psychedelic bass), rate from the track tempo
      const wl = ctx.createOscillator(), wg = ctx.createGain();
      wl.frequency.value = VM.wr || 3; wg.gain.value = p.wob;
      wl.connect(wg); wg.connect(head.frequency); wl.start(t); wl.stop(t + d + (p.rel || 0.08) * 2.5 + 0.05); nodes.push(wl, wg);
    }
    if (p.dist) { const sh = ctx.createWaveShaper(); sh.curve = distCurve; sh.connect(head); head = sh; nodes.push(sh); }
    const a = p.a || 0.005, rel = p.rel || 0.08, relAt = t + Math.max(d, a + 0.01), stopAt = relAt + rel * 2.5 + 0.03;
    env(g.gain, t, v * (n > 1 ? 0.62 : 1), a, p.dcy || 0.2, p.sus == null ? 0.7 : p.sus, relAt, rel);
    g.connect(out);
    let lg = null;
    if (p.vib && (d > 0.22 || p.vib0)) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = p.vr || 5.5;
      lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(p.vib, t + (p.vib0 ? 0.01 : Math.min(0.4, d * 0.6)));
      lfo.connect(lg); lfo.start(t); lfo.stop(stopAt); nodes.push(lfo, lg);
    }
    let first = null;
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(); setWave(o, p.w[i]);
      o.frequency.setValueAtTime(f * (i > 0 && p.m2 ? p.m2 : 1), t);
      let dt = (n > 1 && p.det) ? (i ? p.det : -p.det) : 0;
      if (p.jit) dt += (Math.random() * 2 - 1) * p.jit;
      if (dt) o.detune.setValueAtTime(dt, t);
      if (lg) lg.connect(o.detune);
      o.connect(head); o.start(t); o.stop(stopAt); nodes.push(o);
      if (!first) first = o;
    }
    done(first, nodes);
  }

  // 2-operator FM voice (bells, electric piano)
  function fmv(t, f, d, v, out, p) {
    const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.frequency.value = f; m.frequency.value = f * p.ratio;
    mg.gain.setValueAtTime(f * p.idx, t); mg.gain.setTargetAtTime(f * p.idx * (p.ie || 0.15), t, p.id || 0.15);
    m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(out);
    const a = p.a || 0.002, rel = p.rel || 0.4, relAt = t + Math.max(d, a + 0.01), stopAt = relAt + rel * 2.5 + 0.03;
    env(g.gain, t, v, a, p.dcy || 0.5, p.sus == null ? 0 : p.sus, relAt, rel);
    c.start(t); m.start(t); c.stop(stopAt); m.stop(stopAt);
    done(c, [c, m, mg, g]);
  }

  // instrument presets. w: oscillator waves, det: detune cents, m2: 2nd osc freq ratio,
  // cut/q/ft: filter, kt: key tracking, fe/fd: filter env amount/time, a/dcy/sus/rel: amp env,
  // vib/vr: vibrato cents/rate, jit: random detune, dist: waveshaper, pc: power-chord voice
  const INST = {
    saw2:   { w: ['sawtooth', 'sawtooth'], det: 8, cut: 1700, kt: 0.5, fe: 1.6, fd: 0.12, q: 1.1, a: 0.012, dcy: 0.3, sus: 0.65, rel: 0.12, vib: 14, vr: 5.3 },
    brass:  { w: ['sawtooth', 'soft'], det: 6, cut: 1100, kt: 0.4, fe: 2.2, fd: 0.09, q: 0.9, a: 0.03, dcy: 0.4, sus: 0.75, rel: 0.15, vib: 10, vr: 5 },
    sq2:    { w: ['square', 'p25'], det: 6, cut: 2000, kt: 0.3, fe: 1, fd: 0.1, q: 0.8, a: 0.006, dcy: 0.2, sus: 0.6, rel: 0.09, vib: 10, vr: 5.6 },
    pulse:  { w: ['p25'], cut: 2800, kt: 0.3, fe: 1.2, fd: 0.06, q: 0.8, a: 0.003, dcy: 0.1, sus: 0.35, rel: 0.06 },
    pluck:  { w: ['sawtooth'], cut: 700, kt: 0.6, fe: 5, fd: 0.06, q: 2.5, a: 0.002, dcy: 0.15, sus: 0, rel: 0.12 },
    harp:   { w: ['triangle', 'p12'], det: 3, cut: 2600, fe: 1.5, fd: 0.05, a: 0.002, dcy: 0.35, sus: 0, rel: 0.3 },
    tri:    { w: ['triangle', 'sine'], det: 4, a: 0.035, dcy: 0.4, sus: 0.85, rel: 0.16, vib: 16, vr: 5 },
    pad:    { w: ['soft', 'soft'], det: 10, cut: 1100, kt: 0.3, fe: 0.5, fd: 0.6, q: 0.6, a: 0.4, dcy: 1, sus: 0.8, rel: 0.7 },
    organ:  { w: ['triangle', 'sine'], m2: 2, cut: 3500, a: 0.012, dcy: 0.3, sus: 0.9, rel: 0.08, vib: 6, vr: 6.5 },
    reed:   { w: ['p12', 'p25'], det: 5, cut: 1500, kt: 0.5, q: 3.5, a: 0.02, dcy: 0.3, sus: 0.8, rel: 0.1, vib: 22, vr: 5.8 },
    crush:  { w: ['square', 'p12'], det: 22, jit: 25, cut: 5000, a: 0.002, dcy: 0.12, sus: 0.5, rel: 0.04 },
    dist:   { w: ['sawtooth', 'sawtooth'], m2: 1.4983, dist: true, cut: 2400, q: 1, a: 0.004, dcy: 0.35, sus: 0.55, rel: 0.06, pc: true },
    glass:  { w: ['triangle'], a: 0.002, dcy: 0.3, sus: 0, rel: 0.25 },
    bell:   { fm: 1, ratio: 3.5, idx: 1.6, ie: 0.05, id: 0.25, a: 0.002, dcy: 0.7, sus: 0, rel: 0.5 },
    ep:     { fm: 1, ratio: 1, idx: 1.4, ie: 0.2, id: 0.25, a: 0.004, dcy: 0.9, sus: 0.25, rel: 0.25 },
    sub:    { w: ['triangle', 'sine'], cut: 900, a: 0.006, dcy: 0.3, sus: 0.8, rel: 0.07 },
    sawb:   { w: ['sawtooth', 'sine'], cut: 380, kt: 0.3, fe: 2.5, fd: 0.07, q: 3, a: 0.004, dcy: 0.18, sus: 0.55, rel: 0.06 },
    pluckb: { w: ['square', 'sine'], cut: 500, kt: 0.4, fe: 3, fd: 0.06, q: 2, a: 0.003, dcy: 0.2, sus: 0.15, rel: 0.12 },
    acid:   { w: ['sawtooth'], cut: 260, kt: 0.2, fe: 7, fd: 0.09, q: 10, a: 0.003, dcy: 0.15, sus: 0.45, rel: 0.05 },
    reese:  { w: ['sawtooth', 'sawtooth'], det: 16, cut: 520, kt: 0.2, q: 1.4, a: 0.01, dcy: 0.4, sus: 0.85, rel: 0.08 },
    wob:    { w: ['sawtooth', 'square'], det: 7, cut: 260, q: 7, wob: 1000, a: 0.01, dcy: 0.3, sus: 0.9, rel: 0.08 },
    stab:   { w: ['sawtooth', 'square'], det: 7, cut: 1700, kt: 0.3, fe: 2, fd: 0.05, q: 1.6, a: 0.002, dcy: 0.12, sus: 0.2, rel: 0.08 },
    piano:  { fm: 1, ratio: 1, idx: 2.4, ie: 0.06, id: 0.1, a: 0.002, dcy: 1.3, sus: 0, rel: 0.3 },
    strings:{ w: ['sawtooth', 'sawtooth'], det: 12, cut: 2400, kt: 0.2, q: 0.6, a: 0.09, dcy: 0.5, sus: 0.9, rel: 0.3, vib: 9, vr: 5.5 },
    swell:  { w: ['soft', 'sawtooth'], det: 12, cut: 1600, kt: 0.2, q: 0.6, a: 1.0, dcy: 1.5, sus: 1, rel: 1.0, vib: 8, vr: 5 },
    slapb:  { w: ['square', 'sawtooth'], det: 4, cut: 700, kt: 0.4, fe: 4, fd: 0.04, q: 3, a: 0.002, dcy: 0.13, sus: 0.45, rel: 0.05 },
    buzz:   { w: ['sawtooth', 'sawtooth'], det: 18, cut: 1500, kt: 0.3, q: 6, a: 0.008, dcy: 0.3, sus: 0.8, rel: 0.08, vib: 35, vr: 11, vib0: 1 },
    gtr:    { w: ['sawtooth', 'square'], det: 8, dist: true, cut: 2600, q: 1.2, a: 0.003, dcy: 0.4, sus: 0.6, rel: 0.1, vib: 20, vr: 5.5 },
    twang:  { w: ['sawtooth', 'triangle'], det: 4, cut: 1500, kt: 0.5, fe: 2.5, fd: 0.08, q: 1.6, a: 0.002, dcy: 0.45, sus: 0.05, rel: 0.25, vib: 10, vr: 5 },
    whistle:{ w: ['sine', 'triangle'], det: 3, a: 0.03, dcy: 0.3, sus: 0.85, rel: 0.12, vib: 18, vr: 5.5 },
    wobl:   { w: ['triangle', 'sawtooth'], det: 14, jit: 18, cut: 1800, q: 3, a: 0.05, dcy: 0.4, sus: 0.8, rel: 0.25, vib: 55, vr: 1.4, vib0: 1 },
    vox:    { w: ['sawtooth', 'sawtooth'], det: 9, ft: 'bandpass', cut: 950, kt: 0.3, q: 1.6, a: 0.08, dcy: 0.4, sus: 0.85, rel: 0.3, vib: 16, vr: 5 },
    // chiptune voices (no filter): square, raw 25% / 12.5% pulses, 4-bit triangle
    c50:    { w: ['square'], a: 0.002, dcy: 0.3, sus: 0.7, rel: 0.02 },
    c25:    { w: ['n25'], a: 0.002, dcy: 0.3, sus: 0.7, rel: 0.02 },
    c25v:   { w: ['n25'], a: 0.002, dcy: 0.35, sus: 0.75, rel: 0.03, vib: 18, vr: 6 },
    c12:    { w: ['n12'], a: 0.002, dcy: 0.25, sus: 0.6, rel: 0.02 },
    ctri:   { w: ['ntri'], a: 0.002, dcy: 0.5, sus: 1, rel: 0.02 },
    sax:    { w: ['sawtooth', 'p25'], det: 4, cut: 1300, kt: 0.5, fe: 0.8, fd: 0.12, q: 2.2, a: 0.04, dcy: 0.4, sus: 0.8, rel: 0.12, vib: 22, vr: 5.2 },
    honky:  { w: ['triangle', 'sawtooth'], det: 18, cut: 2400, kt: 0.3, fe: 1, fd: 0.05, q: 0.8, a: 0.002, dcy: 0.35, sus: 0, rel: 0.2 },
    hpsi:   { w: ['sawtooth', 'p12'], det: 3, cut: 3500, kt: 0.2, fe: 1.5, fd: 0.04, q: 0.7, a: 0.001, dcy: 0.3, sus: 0, rel: 0.15 },
    calliope:{ w: ['square', 'triangle'], m2: 2, cut: 3000, a: 0.01, dcy: 0.3, sus: 0.85, rel: 0.06, vib: 25, vr: 7, vib0: 1 },
    theremin:{ w: ['sine', 'triangle'], det: 2, a: 0.12, dcy: 0.5, sus: 0.9, rel: 0.3, vib: 40, vr: 6, vib0: 1 },
    clav:   { w: ['p12', 'square'], det: 3, cut: 2200, kt: 0.3, fe: 1.5, fd: 0.03, q: 3, a: 0.001, dcy: 0.1, sus: 0.2, rel: 0.04 },
    ssaw:   { w: ['sawtooth', 'sawtooth'], det: 20, cut: 2200, kt: 0.4, fe: 1.2, fd: 0.1, q: 0.8, a: 0.01, dcy: 0.3, sus: 0.75, rel: 0.18, vib: 10, vr: 5.2 },
    vibes:  { fm: 1, ratio: 4, idx: 0.9, ie: 0.1, id: 0.12, a: 0.002, dcy: 1.4, sus: 0, rel: 0.4 },
    mbox:   { fm: 1, ratio: 5, idx: 0.9, ie: 0.05, id: 0.1, a: 0.002, dcy: 0.8, sus: 0, rel: 0.4 },
    bigbell:{ fm: 1, ratio: 2.76, idx: 3, ie: 0.08, id: 0.35, a: 0.002, dcy: 2.2, sus: 0, rel: 1.2 }
  };

  function voice(name, t, m, d, v, out) {
    const p = INST[name] || INST.sq2;
    const f = mtof(m);
    if (p.fm) fmv(t, f, d, v, out, p); else synth(t, f, d, v, out, p);
  }

  // ---------------------------------------------------------------- drums --
  function nsrc(t, dur, rate) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    if (rate) s.playbackRate.value = rate;
    s.start(t, Math.random() * 0.7); s.stop(t + dur + 0.02);
    return s;
  }
  function nhit(t, dur, v, out, type, f, q, a, rate) {
    const s = nsrc(t, dur, rate), fl = filt(type, f, q), g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(v, 0.0001), t + (a || 0.001));
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); done(s, [s, fl, g]);
  }
  function thit(t, f0, f1, dur, v, out, type, pd) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + (pd || dur * 0.5));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(v, 0.0001), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02); done(o, [o, g]);
  }
  function clap(t, v, out) {
    const s = nsrc(t, 0.25), fl = filt('bandpass', 1300, 1.1), g = ctx.createGain(), G = g.gain;
    G.setValueAtTime(0, t);
    for (let i = 0; i < 3; i++) { const tt = t + i * 0.011; G.setValueAtTime(v, tt); G.exponentialRampToValueAtTime(v * 0.15, tt + 0.009); }
    G.setValueAtTime(v * 0.8, t + 0.033); G.exponentialRampToValueAtTime(0.0006, t + 0.22);
    s.connect(fl); fl.connect(g); g.connect(out); done(s, [s, fl, g]);
  }
  // k kick, s snare, g ghost snare, c clap, h hat, o open hat, x crash, r rim,
  // t low tom, m mid tom, b hand drum (high), d hand drum (low), n shaker, l clock tick, z glitch.
  // UPPERCASE = accented.
  function cowbell(t, v, out) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = filt('bandpass', 1100, 1.2), g = ctx.createGain();
    o1.type = 'square'; o2.type = 'square'; o1.frequency.value = 562; o2.frequency.value = 845;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.16);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + 0.18); o2.stop(t + 0.18); done(o1, [o1, o2, bp, g]);
  }
  // 1-bit noise hit for the 8-bit kit
  function chit(t, dur, v, out, rate) {
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = chipNoise; s.loop = true; s.playbackRate.value = rate || 1;
    g.gain.setValueAtTime(Math.max(v, 0.0001), t); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    s.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); done(s, [s, g]);
  }
  function drumNes(c, t, a, out) {
    switch (c) {
      case 'k': thit(t, 220, 55, 0.14, a * 0.7, out, 'triangle', 0.08); break;
      case 's': case 'c': case 'g': chit(t, c === 'g' ? 0.05 : 0.13, a * (c === 'g' ? 0.1 : 0.26), out, 0.45); break;
      case 'o': chit(t, 0.16, a * 0.12, out, 1); break;
      case 'x': chit(t, 0.6, a * 0.14, out, 0.7); break;
      case 't': thit(t, 260, 90, 0.18, a * 0.7, out, 'triangle', 0.12); break;
      case 'm': thit(t, 360, 140, 0.15, a * 0.65, out, 'triangle', 0.1); break;
      default: chit(t, 0.03, a * 0.12, out, 1); break;
    }
  }
  function clank(t, v, out) {   // two inharmonic squares through a resonant band-pass = struck metal
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = filt('bandpass', 1900, 3), g = ctx.createGain();
    o1.type = 'square'; o2.type = 'square'; o1.frequency.value = 183; o2.frequency.value = 271;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.26);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + 0.28); o2.stop(t + 0.28); done(o1, [o1, o2, bp, g]);
  }
  // extra kit: w cowbell, j tambourine, v vinyl crackle, u bubble, a metal clank, e car honk,
  // f fire whoosh, p typewriter key, q dust swoosh, y laser zap, i small bell ding
  function drum(ch, t, v, out, kit) {
    const up = ch >= 'A' && ch <= 'Z', a = Math.max(0.0001, v * (up ? 1.25 : 0.85));
    if (kit === 'nes') { drumNes(ch.toLowerCase(), t, a, out); return; }
    switch (ch.toLowerCase()) {
      case 'w': cowbell(t, a * 0.2, out); break;
      case 'j': nhit(t, 0.11, a * 0.16, out, 'bandpass', 8500, 2.5, 0.004); break;
      case 'v': nhit(t, 0.012, a * 0.05 * (0.4 + Math.random()), out, 'highpass', 2500); break;
      case 'u': { const f = 260 + Math.random() * 480; thit(t, f, f * 2.4, 0.09, a * 0.16, out, 'sine', 0.07); break; }
      case 'a': clank(t, a * 0.3, out); nhit(t, 0.03, a * 0.22, out, 'bandpass', 3200, 2); break;
      case 'e': {
        const f = 440 * (0.95 + Math.random() * 0.1), o = { ft: 'lowpass', ff: 1500, hold: 0.8, a: 0.01 };
        tone(t, 'sawtooth', f, 0, 0.2, a * 0.06, out, o); tone(t, 'sawtooth', f * 1.26, 0, 0.2, a * 0.05, out, o); break;
      }
      case 'f': noise(t, 0.55, a * 0.3, out, { ft: 'lowpass', f: 300, f1: 2200, st: 0.15, f2: 400, q: 1, a: 0.02 }); break;
      case 'p': nhit(t, 0.018, a * 0.22, out, 'highpass', 2500); thit(t, 1700, 1100, 0.02, a * 0.08, out, 'triangle'); break;
      case 'q': noise(t, 1.4, a * 0.2, out, { ft: 'bandpass', f: 400, f1: 1500, st: 0.7, f2: 500, q: 1, a: 0.5 }); break;
      case 'y': thit(t, 2400, 260, 0.14, a * 0.08, out, 'square', 0.12); break;
      case 'i': thit(t, 2640, 2620, 0.6, a * 0.12, out, 'sine', 0.5); break;
      case 'k': thit(t, 160, 42, 0.38, a, out, 'sine', 0.11); nhit(t, 0.014, a * 0.22, out, 'lowpass', 2500); break;
      case 's': nhit(t, 0.17, a * 0.5, out, 'bandpass', 1900, 0.7); thit(t, 220, 160, 0.09, a * 0.35, out, 'triangle'); break;
      case 'g': nhit(t, 0.07, a * 0.16, out, 'bandpass', 2200, 0.8); break;
      case 'c': clap(t, a * 0.55, out); break;
      case 'h': nhit(t, 0.045, a * 0.2, out, 'highpass', 7500); break;
      case 'o': nhit(t, 0.28, a * 0.17, out, 'highpass', 6500); break;
      case 'x': nhit(t, 1.4, a * 0.22, out, 'highpass', 4200, 0.5); break;
      case 'r': thit(t, 1700, 1500, 0.035, a * 0.22, out, 'triangle'); nhit(t, 0.02, a * 0.12, out, 'highpass', 3000); break;
      case 't': thit(t, 170, 85, 0.32, a * 0.7, out, 'sine', 0.2); break;
      case 'm': thit(t, 250, 140, 0.26, a * 0.6, out, 'sine', 0.16); break;
      case 'b': thit(t, 440, 340, 0.12, a * 0.45, out, 'sine', 0.04); nhit(t, 0.02, a * 0.14, out, 'bandpass', 3000, 1); break;
      case 'd': thit(t, 125, 78, 0.34, a * 0.75, out, 'sine', 0.08); nhit(t, 0.03, a * 0.12, out, 'lowpass', 1200); break;
      case 'n': nhit(t, 0.07, a * 0.13, out, 'bandpass', 5500, 1.5, 0.02); break;
      case 'l': thit(t, 2600, 2450, 0.03, a * 0.2, out, 'triangle'); nhit(t, 0.015, a * 0.08, out, 'highpass', 6000); break;
      case 'z': {
        const f = 300 + Math.random() * 2400;
        nhit(t, 0.06, a * 0.3, out, 'bandpass', f, 3, 0.001, 0.2 + Math.random() * 1.6);
        thit(t, f * 0.5, f * (Math.random() < 0.5 ? 0.25 : 1.5), 0.05, a * 0.1, out, 'square');
        break;
      }
      default: break;
    }
  }

  // ------------------------------------------------------------ SFX kit --
  // tone: one oscillator with an optional pitch sweep (f1, then f2), filter and vibrato.
  // o: { a attack, hold (0..1 of dur held at full level), st sweep time, lin, f2,
  //      ft/ff/fq/ff1 filter, vib cents, vr rate }
  function tone(t, w, f0, f1, dur, v, out, o) {
    o = o || {};
    const os = ctx.createOscillator(), g = ctx.createGain(), nodes = [os, g];
    setWave(os, w);
    const st = Math.min(o.st || dur, dur);
    os.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) {
      if (o.lin) os.frequency.linearRampToValueAtTime(f1, t + st);
      else os.frequency.exponentialRampToValueAtTime(f1, t + st);
      if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    }
    let head = g;
    if (o.ft) {
      const fl = filt(o.ft, o.ff || 2000, o.fq);
      if (o.ff1) { fl.frequency.setValueAtTime(o.ff || 2000, t); fl.frequency.exponentialRampToValueAtTime(o.ff1, t + dur); }
      fl.connect(g); head = fl; nodes.push(fl);
    }
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vr || 6; lg.gain.value = o.vib;
      l.connect(lg); lg.connect(os.detune); l.start(t); l.stop(t + dur + 0.03); nodes.push(l, lg);
    }
    const a = o.a || 0.004, pk = Math.max(v, 0.0001);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a);
    if (o.hold) g.gain.setValueAtTime(pk, t + Math.max(a + 0.001, dur * o.hold));
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    os.connect(head); g.connect(out); os.start(t); os.stop(t + dur + 0.03); done(os, nodes);
  }
  // filtered noise burst with optional sweep (f -> f1 -> f2) and LFO on the filter
  function noise(t, dur, v, out, o) {
    o = o || {};
    const s = nsrc(t, dur, o.rate), fl = filt(o.ft || 'bandpass', o.f || 1000, o.q), g = ctx.createGain();
    const nodes = [s, fl, g];
    if (o.f1) {
      fl.frequency.setValueAtTime(o.f || 1000, t);
      fl.frequency.exponentialRampToValueAtTime(o.f1, t + Math.min(o.st || dur, dur));
      if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    }
    if (o.lfo) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.lfo[0]; lg.gain.value = o.lfo[1];
      l.connect(lg); lg.connect(fl.frequency); l.start(t); l.stop(t + dur + 0.03); nodes.push(l, lg);
    }
    const a = o.a || 0.003, pk = Math.max(v, 0.0001);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a);
    if (o.hold) g.gain.setValueAtTime(pk, t + Math.max(a + 0.001, dur * o.hold));
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); done(s, nodes);
  }
  // quick note run: list of midi notes spaced by `step` seconds
  function run(t, w, list, step, len, v, out, p, o) {
    for (let i = 0; i < list.length; i++) {
      const last = i === list.length - 1;
      tone(t + i * step, w, mtof(list[i]) * p, 0, last ? len * 3 : len, v, out, o);
    }
  }
  const R = Math.random;
  const LP = (ff, x) => Object.assign({ ft: 'lowpass', ff }, x || {});

  // Each SFX: (t, pitchMul, vol, out)
  const SFX = {
    jump: (t, p, v, o) => {
      tone(t, 'p25', 260 * p, 640 * p, 0.17, 0.26 * v, o, LP(3200, { st: 0.12 }));
      tone(t, 'triangle', 130 * p, 320 * p, 0.12, 0.16 * v, o, { st: 0.1 });
    },
    jumpBig: (t, p, v, o) => {
      tone(t, 'p25', 185 * p, 470 * p, 0.24, 0.2 * v, o, LP(2500, { st: 0.18 }));
      tone(t, 'triangle', 92 * p, 235 * p, 0.22, 0.2 * v, o, { st: 0.18 });
    },
    stomp: (t, p, v, o) => {
      tone(t, 'square', 480 * p, 110 * p, 0.12, 0.15 * v, o, LP(1800));
      noise(t, 0.08, 0.3 * v, o, { ft: 'lowpass', f: 900 });
      tone(t, 'sine', 170 * p, 50, 0.15, 0.4 * v, o);
    },
    pick: (t, p, v, o) => {   // bright two-note chime, a fifth up
      tone(t, 'p12', 1318.5 * p, 0, 0.075, 0.2 * v, o, LP(6500, { hold: 0.8 }));
      tone(t + 0.07, 'p12', 1975.5 * p, 0, 0.34, 0.2 * v, o, LP(7500, { hold: 0.15 }));
      tone(t + 0.07, 'sine', 3951 * p, 0, 0.22, 0.06 * v, o);
    },
    powerup: (t, p, v, o) => {
      run(t, 'p25', [60, 64, 67, 71, 72, 76, 79, 83, 84], 0.048, 0.07, 0.17 * v, o, p, LP(4000));
      run(t + 0.02, 'triangle', [48, 52, 55, 59, 60, 64, 67, 71, 72], 0.048, 0.07, 0.18 * v, o, p);
    },
    powerdown: (t, p, v, o) => {
      const l = [79, 74, 71, 67, 62, 59, 55];
      for (let i = 0; i < l.length; i++) {
        const f = mtof(l[i]) * p;
        tone(t + i * 0.075, 'p25', f, f * 0.94, i === l.length - 1 ? 0.3 : 0.09, 0.19 * v, o, LP(2200));
      }
    },
    appear: (t, p, v, o) => {
      tone(t, 'p25', 180 * p, 720 * p, 0.42, 0.11 * v, o, LP(2500, { lin: 1, hold: 0.7, vib: 70, vr: 22 }));
      tone(t, 'triangle', 90 * p, 360 * p, 0.42, 0.12 * v, o, { lin: 1, hold: 0.7 });
    },
    bump: (t, p, v, o) => {
      tone(t, 'sine', 140 * p, 55, 0.14, 0.45 * v, o);
      noise(t, 0.06, 0.25 * v, o, { ft: 'lowpass', f: 500 });
      tone(t, 'square', 90 * p, 60, 0.08, 0.05 * v, o, LP(400));
    },
    break: (t, p, v, o) => {
      noise(t, 0.32, 0.45 * v, o, { ft: 'lowpass', f: 2800 * p, f1: 350 });
      for (let i = 0; i < 5; i++) noise(t + i * 0.035 + R() * 0.012, 0.06, 0.24 * v, o, { ft: 'bandpass', f: (1200 + R() * 2600) * p, q: 3 });
      tone(t, 'square', 220 * p, 60, 0.15, 0.1 * v, o, LP(900));
    },
    throw: (t, p, v, o) => {   // spinning vinyl: scratch sweep + whoosh
      noise(t, 0.28, 0.55 * v, o, { ft: 'bandpass', f: 700 * p, f1: 3200 * p, st: 0.12, f2: 900 * p, q: 2.5 });
      tone(t, 'sawtooth', 220 * p, 540 * p, 0.25, 0.12 * v, o, LP(1500, { st: 0.1, f2: 260 * p }));
    },
    kick: (t, p, v, o) => {
      tone(t, 'square', 700 * p, 180 * p, 0.08, 0.12 * v, o, LP(2400));
      noise(t, 0.04, 0.22 * v, o, { ft: 'highpass', f: 2000 });
      tone(t, 'sine', 220 * p, 80, 0.1, 0.3 * v, o);
    },
    hurt: (t, p, v, o) => {
      tone(t, 'sawtooth', 520 * p, 170 * p, 0.36, 0.21 * v, o, LP(1800, { vib: 80, vr: 28 }));
      tone(t, 'square', 490 * p, 160 * p, 0.36, 0.1 * v, o, LP(1200));
    },
    oneup: (t, p, v, o) => {
      run(t, 'p25', [79, 84, 88, 91], 0.09, 0.08, 0.12 * v, o, p, LP(5000, { hold: 0.6 }));
      [79, 84, 88, 91].forEach((m, i) => voice('bell', t + i * 0.09, m + 12 * Math.log2(p), i === 3 ? 0.4 : 0.08, 0.06 * v, o));
    },
    die: (t, p, v, o) => {   // short sad descending phrase (~1.2 s)
      const l = [[76, 0, 0.17], [72, 0.2, 0.17], [69, 0.4, 0.2]];
      for (const n of l) {
        tone(t + n[1], 'p25', mtof(n[0]) * p, 0, n[2], 0.12 * v, o, LP(2400, { hold: 0.7 }));
        tone(t + n[1], 'triangle', mtof(n[0] - 12) * p, 0, n[2], 0.12 * v, o, { hold: 0.7 });
      }
      tone(t + 0.62, 'p25', mtof(68) * p, mtof(63) * p, 0.6, 0.12 * v, o, LP(2000, { hold: 0.5, vib: 25, vr: 6, st: 0.6 }));
      tone(t + 0.62, 'triangle', mtof(56) * p, mtof(51) * p, 0.6, 0.12 * v, o, { hold: 0.5, st: 0.6 });
    },
    gameover: (t, p, v, o) => playComp('gameover', t, v, o),
    clear: (t, p, v, o) => playComp('clear', t, v, o),
    checkpoint: (t, p, v, o) => {
      [84, 88, 91, 96].forEach((m, i) => voice('bell', t + i * 0.07, m + 12 * Math.log2(p), i === 3 ? 0.5 : 0.1, 0.09 * v, o));
      run(t, 'triangle', [72, 76, 79, 84], 0.07, 0.07, 0.08 * v, o, p);
      noise(t + 0.2, 0.5, 0.05 * v, o, { ft: 'highpass', f: 7000 });
    },
    portal: (t, p, v, o) => {
      noise(t, 1.0, 0.25 * v, o, { ft: 'bandpass', f: 300 * p, f1: 2400 * p, q: 4, lfo: [7, 500], hold: 0.5 });
      tone(t, 'sine', 200 * p, 1200 * p, 1.0, 0.12 * v, o, { vib: 300, vr: 9, hold: 0.5 });
      tone(t, 'triangle', 300 * p, 1800 * p, 0.9, 0.05 * v, o, { vib: 300, vr: 11 });
    },
    spring: (t, p, v, o) => {
      tone(t, 'sine', 140 * p, 620 * p, 0.45, 0.22 * v, o, { st: 0.12, vib: 220, vr: 16, hold: 0.3 });
      tone(t, 'triangle', 280 * p, 1240 * p, 0.3, 0.07 * v, o, { st: 0.1 });
    },
    bossHit: (t, p, v, o) => {
      tone(t, 'square', 300 * p, 90 * p, 0.2, 0.15 * v, o, LP(2000));
      noise(t, 0.15, 0.32 * v, o, { ft: 'bandpass', f: 1500, q: 0.8 });
      tone(t, 'sine', 1250 * p, 0, 0.35, 0.06 * v, o);
      tone(t, 'sine', 1830 * p, 0, 0.25, 0.045 * v, o);
      tone(t, 'sine', 120 * p, 40, 0.25, 0.4 * v, o);
    },
    bossDie: (t, p, v, o) => {
      noise(t, 2.2, 0.5 * v, o, { ft: 'lowpass', f: 4000, f1: 150, q: 0.8 });
      tone(t, 'sine', 110, 28, 1.2, 0.55 * v, o);
      for (let i = 0; i < 6; i++) noise(t + 0.15 * i + R() * 0.08, 0.35, 0.28 * v, o, { ft: 'lowpass', f: 1500, f1: 200 });
      run(t + 1.0, 'p25', [48, 55, 60, 64, 67, 72, 76, 79, 84, 88, 91], 0.055, 0.07, 0.09 * v, o, p, LP(4500));
      [84, 88, 91, 95].forEach((m, i) => voice('bell', t + 1.65 + i * 0.02, m, 0.9, 0.07 * v, o));
    },
    fire: (t, p, v, o) => {
      tone(t, 'sawtooth', 950 * p, 280 * p, 0.18, 0.14 * v, o, LP(2500));
      noise(t, 0.18, 0.24 * v, o, { ft: 'bandpass', f: 3000, f1: 800, q: 1.2 });
    },
    select: (t, p, v, o) => {
      tone(t, 'sine', 1046.5 * p, 0, 0.07, 0.18 * v, o);
      tone(t, 'p25', 2093 * p, 0, 0.05, 0.035 * v, o, LP(5000));
    },
    back: (t, p, v, o) => {
      tone(t, 'triangle', 784 * p, 0, 0.06, 0.2 * v, o);
      tone(t + 0.06, 'triangle', 523.3 * p, 0, 0.1, 0.2 * v, o);
    },
    pause: (t, p, v, o) => run(t, 'p25', [81, 88, 93], 0.085, 0.07, 0.15 * v, o, p, LP(3000)),
    splash: (t, p, v, o) => {
      noise(t, 0.45, 0.45 * v, o, { ft: 'bandpass', f: 2200, f1: 350, q: 0.9 });
      for (let i = 0; i < 4; i++) tone(t + 0.05 + i * 0.06 + R() * 0.03, 'sine', (500 + R() * 500) * p, (900 + R() * 700) * p, 0.06, 0.13 * v, o);
    },
    secret: (t, p, v, o) => {   // whole-tone shimmer
      [72, 74, 76, 78, 80, 82, 84, 86].forEach((m, i) => voice('bell', t + i * 0.085, m + 12 * Math.log2(p), i === 7 ? 0.6 : 0.12, 0.07 * v, o));
      tone(t, 'sine', 523 * p, 1046 * p, 1.1, 0.05 * v, o, { vib: 30, vr: 7, hold: 0.6, lin: 1 });
      noise(t + 0.3, 0.8, 0.04 * v, o, { ft: 'highpass', f: 8000 });
    },
    gold: (t, p, v, o) => {     // rich sparkling chord (Cmaj9)
      [72, 76, 79, 83, 86].forEach((m, i) => voice('bell', t + i * 0.03, m + 12 * Math.log2(p), 0.7, 0.07 * v, o));
      [60, 67].forEach(m => voice('pad', t, m + 12 * Math.log2(p), 0.5, 0.08 * v, o));
      const sp = [96, 98, 100, 103, 105, 108];
      for (let i = 0; i < 6; i++) voice('glass', t + 0.1 + i * 0.07, sp[(R() * sp.length) | 0], 0.05, 0.05 * v, o);
    },
    crumble: (t, p, v, o) => {
      noise(t, 0.6, 0.5 * v, o, { ft: 'lowpass', f: 900 * p, f1: 200 });
      for (let i = 0; i < 6; i++) noise(t + R() * 0.5, 0.04, 0.28 * v, o, { ft: 'bandpass', f: (800 + R() * 1600) * p, q: 4 });
    },
    swim: (t, p, v, o) => {
      tone(t, 'sine', 280 * p, 620 * p, 0.13, 0.2 * v, o);
      noise(t, 0.15, 0.09 * v, o, { ft: 'bandpass', f: 900, f1: 1800, q: 2 });
    },
    thunder: (t, p, v, o) => {
      noise(t, 0.18, 0.45 * v, o, { ft: 'highpass', f: 2500 });
      noise(t + 0.02, 0.12, 0.35 * v, o, { ft: 'bandpass', f: 1200, q: 0.6 });
      noise(t + 0.05, 2.2, 0.7 * v, o, { ft: 'lowpass', f: 240 * p, f1: 60, q: 0.7, a: 0.08, hold: 0.15, rate: 0.5 });
      tone(t + 0.05, 'sine', 55 * p, 35, 2.0, 0.22 * v, o, { a: 0.06 });
    },
    wind: (t, p, v, o) => noise(t, 1.5, 0.38 * v, o, { ft: 'bandpass', f: 350 * p, f1: 900 * p, st: 0.7, f2: 420 * p, q: 1.6, a: 0.5 }),
    laser: (t, p, v, o) => {
      tone(t, 'square', 1700 * p, 220 * p, 0.18, 0.12 * v, o, LP(4000));
      tone(t, 'sawtooth', 1720 * p, 230 * p, 0.18, 0.08 * v, o, LP(3000));
    },
    shield: (t, p, v, o) => {   // Eclipse start: filter-swept swell + bell rise
      tone(t, 'sawtooth', 130 * p, 520 * p, 0.65, 0.1 * v, o, LP(600, { ff1: 5000, hold: 0.6 }));
      tone(t, 'sine', 260 * p, 1040 * p, 0.6, 0.1 * v, o, { vib: 40, vr: 12 });
      [72, 79, 84, 91].forEach((m, i) => voice('bell', t + i * 0.08, m + 12 * Math.log2(p), 0.3, 0.06 * v, o));
    },
    coinTally: (t, p, v, o) => tone(t, 'p25', 1900 * p, 0, 0.03, 0.09 * v, o, LP(6000)),
    headbang: (t, p, v, o) => {   // distorted power-chord stab
      const k = 12 * Math.log2(p);
      voice('dist', t, 40 + k, 0.45, 0.3 * v, o);
      voice('dist', t, 52 + k, 0.45, 0.22 * v, o);
      drum('K', t, 0.8 * v, o); drum('x', t, 0.7 * v, o);
    },
    airguitar: (t, p, v, o) => {  // short original riff in E, power chords
      const k = 12 * Math.log2(p);
      const riff = [[40, 0, 0.1], [40, 0.12, 0.1], [43, 0.24, 0.2], [45, 0.46, 0.18], [40, 0.66, 0.1], [38, 0.78, 0.1], [40, 0.9, 0.55]];
      for (const n of riff) { voice('dist', t + n[1], n[0] + k, n[2], 0.28 * v, o); voice('dist', t + n[1], n[0] + 12 + k, n[2], 0.16 * v, o); }
      drum('K', t, 0.7 * v, o); drum('K', t + 0.46, 0.7 * v, o); drum('S', t + 0.66, 0.6 * v, o); drum('K', t + 0.9, 0.8 * v, o); drum('x', t + 0.9, 0.6 * v, o);
    }
  };

  // ------------------------------------------------ festival SFX helpers --
  const K = p => 12 * Math.log2(p);   // pitch multiplier -> semitones
  const VOW = { a: [800, 1150, 2900], e: [400, 2000, 2550], i: [300, 2300, 3000], o: [450, 800, 2830], u: [325, 700, 2530], m: [250, 900, 2200] };
  // buzzy source through three band-pass formants that morph between vowels.
  // pts: [[sec, Hz], ...] pitch contour, vows: [[sec, vowel], ...]
  function formant(t, pts, vows, dur, v, out, o) {
    o = o || {};
    const src = ctx.createOscillator(), g = ctx.createGain(), nodes = [src, g];
    src.type = 'sawtooth';
    src.frequency.setValueAtTime(pts[0][1], t);
    for (let i = 1; i < pts.length; i++) src.frequency.linearRampToValueAtTime(pts[i][1], t + pts[i][0]);
    const amp = [1, 0.5, 0.22];
    for (let k = 0; k < 3; k++) {
      const bp = filt('bandpass', VOW[vows[0][1]][k], 6 + k * 3), fg = gain(amp[k] * 3);
      bp.frequency.setValueAtTime(VOW[vows[0][1]][k], t);
      for (let i = 1; i < vows.length; i++) bp.frequency.linearRampToValueAtTime(VOW[vows[i][1]][k], t + vows[i][0]);
      src.connect(bp); bp.connect(fg); fg.connect(g); nodes.push(bp, fg);
    }
    if (o.vib) {
      const l = ctx.createOscillator(), lg = gain(o.vib);
      l.frequency.value = o.vr || 5; l.connect(lg); lg.connect(src.detune); l.start(t); l.stop(t + dur + 0.03); nodes.push(l, lg);
    }
    const a = o.a || 0.05, pk = Math.max(v, 0.0001);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a);
    g.gain.setValueAtTime(pk, t + Math.max(a + 0.01, dur * 0.7)); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    g.connect(out); src.start(t); src.stop(t + dur + 0.03); done(src, nodes);
  }
  // amphibian croak: saw through a band-pass, chopped by a square LFO
  function croak(t, f, dur, v, out, rate) {
    const s = ctx.createOscillator(), bp = filt('bandpass', f * 5, 1.5), am = gain(0.5), l = ctx.createOscillator(), lg = gain(0.5), g = ctx.createGain();
    s.type = 'sawtooth'; s.frequency.setValueAtTime(f, t); s.frequency.linearRampToValueAtTime(f * 0.85, t + dur);
    l.type = 'square'; l.frequency.value = rate || 26;
    s.connect(bp); bp.connect(am); am.connect(g); l.connect(lg); lg.connect(am.gain); g.connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(v, 0.0001), t + 0.015);
    g.gain.setValueAtTime(Math.max(v, 0.0001), t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    s.start(t); l.start(t); s.stop(t + dur + 0.03); l.stop(t + dur + 0.03);
    done(s, [s, bp, am, l, lg, g]);
  }
  // goofy two-reed horn note (optionally sagging in pitch)
  function horn(t, m, d, v, out, bend) {
    const f = mtof(m), f1 = bend ? f * 0.93 : 0;
    tone(t, 'sawtooth', f, f1, d, v, out, LP(1400, { hold: 0.85, a: 0.015, fq: 2, st: d }));
    tone(t, 'p25', f * 1.008, f1 * 1.008, d, v * 0.6, out, LP(1800, { hold: 0.85, a: 0.015, st: d }));
  }
  function swarm(t, dur, v, out, p) {
    for (let i = 0; i < 4; i++) {
      const f = (520 + i * 47 + R() * 30) * p;
      tone(t + R() * 0.1, 'sawtooth', f, f * (0.9 + R() * 0.15), dur, v, out, { ft: 'bandpass', ff: 1700 + i * 300, fq: 1.5, vib: 40 + i * 8, vr: 17 + i * 3.3, a: 0.2, hold: 0.7, lin: 1 });
    }
  }

  Object.assign(SFX, {
    puke: (t, p, v, o) => {     // wet comedic blurp
      tone(t, 'sawtooth', 340 * p, 110 * p, 0.32, 0.14 * v, o, LP(900, { vib: 160, vr: 24, st: 0.28 }));
      noise(t, 0.3, 0.3 * v, o, { ft: 'bandpass', f: 600 * p, f1: 250 * p, q: 3, lfo: [28, 300] });
      tone(t + 0.02, 'sine', 180 * p, 90 * p, 0.25, 0.25 * v, o);
    },
    splat: (t, p, v, o) => {
      noise(t, 0.18, 0.45 * v, o, { ft: 'lowpass', f: 2200 * p, f1: 300, q: 1.5 });
      noise(t, 0.08, 0.25 * v, o, { ft: 'bandpass', f: 1200 * p, q: 4 });
      tone(t, 'sine', 260 * p, 70, 0.12, 0.3 * v, o);
    },
    mushroom: (t, p, v, o) => { // trippy rising warble
      tone(t, 'sine', 300 * p, 1200 * p, 0.9, 0.16 * v, o, { vib: 120, vr: 7, hold: 0.6, st: 0.85 });
      tone(t, 'triangle', 450 * p, 1800 * p, 0.9, 0.08 * v, o, { vib: 160, vr: 5, hold: 0.6, st: 0.85 });
      [72, 76, 79, 83, 86, 90].forEach((m, i) => voice('glass', t + 0.1 + i * 0.11, m + K(p), 0.08, 0.05 * v, o));
    },
    bufo: (t, p, v, o) => {     // deep toad croak + cosmic whoosh
      croak(t, 78 * p, 0.38, 0.45 * v, o, 24);
      noise(t + 0.25, 1.1, 0.28 * v, o, { ft: 'bandpass', f: 200, f1: 4200, q: 3, lfo: [5, 600], hold: 0.3 });
      tone(t + 0.25, 'sine', 150 * p, 1400 * p, 1.0, 0.1 * v, o, { vib: 50, vr: 6, hold: 0.4 });
      [72, 79, 84, 91].forEach((m, i) => voice('bell', t + 0.6 + i * 0.08, m + K(p), 0.3, 0.05 * v, o));
    },
    fly: (t, p, v, o) => noise(t, 0.22, 0.55 * v, o, { ft: 'bandpass', f: 500 * p, f1: 1400 * p, st: 0.08, f2: 600 * p, q: 1.4, a: 0.03 }),
    float: (t, p, v, o) => {    // cough-cough, then an airy rise
      [0, 0.16, 0.3].forEach((d, i) => {
        noise(t + d, 0.11, (0.5 - i * 0.1) * v, o, { ft: 'bandpass', f: (900 + i * 80) * p, q: 1.2, a: 0.004 });
        tone(t + d, 'sawtooth', (170 - i * 10) * p, 120 * p, 0.09, 0.05 * v, o, LP(700));
      });
      noise(t + 0.45, 0.9, 0.12 * v, o, { ft: 'bandpass', f: 400 * p, f1: 3000 * p, q: 2, a: 0.2, hold: 0.3 });
      tone(t + 0.45, 'sine', 260 * p, 780 * p, 0.9, 0.1 * v, o, { vib: 25, vr: 5, a: 0.15, hold: 0.4, lin: 1 });
    },
    hydrate: (t, p, v, o) => {  // gulp gulp + bright chime
      tone(t, 'sine', 420 * p, 160 * p, 0.09, 0.3 * v, o);
      tone(t + 0.12, 'sine', 380 * p, 140 * p, 0.09, 0.28 * v, o);
      noise(t, 0.08, 0.08 * v, o, { ft: 'lowpass', f: 800 });
      [88, 95, 100].forEach((m, i) => voice('bell', t + 0.26 + i * 0.07, m + K(p), i === 2 ? 0.5 : 0.1, 0.08 * v, o));
    },
    disco: (t, p, v, o) => {    // disco-ball stinger
      const k = K(p);
      [55, 62, 67, 71, 74].forEach(m => voice('strings', t, m + k, 0.5, 0.06 * v, o));
      [67, 71, 74, 79].forEach(m => voice('stab', t, m + k, 0.18, 0.06 * v, o));
      tone(t, 'sawtooth', 200 * p, 1600 * p, 0.45, 0.05 * v, o, LP(1200, { ff1: 6000 }));
      drum('K', t, 0.7 * v, o); drum('o', t + 0.25, 0.8 * v, o); drum('c', t + 0.25, 0.7 * v, o);
      for (let i = 0; i < 6; i++) voice('glass', t + 0.25 + i * 0.06, [91, 95, 98, 103][i % 4] + k, 0.05, 0.05 * v, o);
    },
    sloth: (t, p, v, o) => formant(t, [[0, 140 * p], [0.35, 190 * p], [0.9, 120 * p], [1.4, 95 * p]], [[0, 'a'], [0.5, 'o'], [0.85, 'm']], 1.4, 0.32 * v, o, { vib: 15, vr: 4, a: 0.12 }),
    slothHug: (t, p, v, o) => {
      const k = K(p);
      [65, 69, 72, 76].forEach((m, i) => voice('ep', t + i * 0.05, m + k, 0.6, 0.07 * v, o));
      [53, 60].forEach(m => voice('pad', t, m + k, 0.6, 0.06 * v, o));
      voice('bell', t + 0.25, 84 + k, 0.4, 0.05 * v, o);
    },
    mount: (t, p, v, o) => {
      run(t, 'p25', [67, 74], 0.07, 0.06, 0.13 * v, o, p, LP(3000));
      tone(t, 'sine', 120 * p, 60, 0.12, 0.3 * v, o);
    },
    dismount: (t, p, v, o) => {
      tone(t, 'triangle', 600 * p, 200 * p, 0.18, 0.14 * v, o);
      noise(t, 0.18, 0.12 * v, o, { ft: 'bandpass', f: 1500, f1: 400, q: 1 });
      tone(t + 0.16, 'sine', 160 * p, 60, 0.1, 0.3 * v, o);
    },
    artcarHorn: (t, p, v, o) => { // goofy original horn tune, last note sags
      const k = K(p), seq = [[67, 0, 0.12], [71, 0.14, 0.12], [74, 0.28, 0.12], [72, 0.42, 0.12], [76, 0.56, 0.5]];
      seq.forEach((n, i) => { const last = i === seq.length - 1; horn(t + n[1], n[0] + k, n[2], 0.11 * v, o, last); horn(t + n[1], n[0] + 4 + k, n[2], 0.08 * v, o, last); });
    },
    mosquito: (t, p, v, o) => {
      tone(t, 'sawtooth', 600 * p, 540 * p, 1.0, 0.17 * v, o, { ft: 'bandpass', ff: 1800, fq: 1.5, vib: 45, vr: 22, a: 0.15, hold: 0.7, lin: 1 });
      tone(t, 'sawtooth', 606 * p, 548 * p, 1.0, 0.12 * v, o, { ft: 'bandpass', ff: 2600, fq: 2, vib: 30, vr: 17, a: 0.2, hold: 0.7, lin: 1 });
    },
    buzzkill: (t, p, v, o) => {  // villain "mwa-ha-ha" made of buzz
      const syl = [[0, 230], [0.24, 210], [0.46, 190], [0.7, 165], [0.98, 140]];
      for (const s of syl) formant(t + s[0], [[0, s[1] * p * 1.1], [0.18, s[1] * p * 0.9]], [[0, 'a'], [0.15, 'o']], 0.2, 0.4 * v, o, { vib: 60, vr: 28, a: 0.01 });
      tone(t, 'sawtooth', 700 * p, 520 * p, 1.5, 0.05 * v, o, { ft: 'bandpass', ff: 2000, fq: 1.5, vib: 60, vr: 24, a: 0.1, hold: 0.6, lin: 1 });
      tone(t, 'sawtooth', 55 * p, 45 * p, 1.4, 0.1 * v, o, LP(300, { vib: 40, vr: 30, hold: 0.5 }));
    },
    chinka: (t, p, v, o) => {   // sparkly heart chime
      const k = K(p);
      [76, 80, 83, 88, 92].forEach((m, i) => voice('bell', t + i * 0.06, m + k, i === 4 ? 0.7 : 0.15, 0.07 * v, o));
      voice('pad', t, 64 + k, 0.7, 0.05 * v, o); voice('pad', t, 71 + k, 0.7, 0.04 * v, o);
      [0, 4, 7, 12, 16].forEach((d, i) => voice('glass', t + 0.3 + i * 0.07, 100 + d + k, 0.05, 0.04 * v, o));
    },
    reunion: (t, p, v, o) => {  // big warm swell
      const k = K(p);
      [48, 55, 60, 64, 67, 71, 74].forEach(m => voice('swell', t, m + k, 1.4, 0.06 * v, o));
      noise(t, 1.1, 0.16 * v, o, { ft: 'highpass', f: 5000, a: 1.05 });
      tone(t + 1.0, 'sine', 65 * p, 50 * p, 1.2, 0.3 * v, o, { a: 0.05 });
      [84, 88, 91, 95, 98].forEach((m, i) => voice('bell', t + 1.05 + i * 0.06, m + k, 0.6, 0.05 * v, o));
    },
    toad: (t, p, v, o) => { croak(t, 240 * p, 0.09, 0.5 * v, o, 60); croak(t + 0.13, 285 * p, 0.12, 0.5 * v, o, 70); },
    crowd: (t, p, v, o) => {    // festival cheer: roar, woos and claps
      noise(t, 1.5, 0.25 * v, o, { ft: 'bandpass', f: 900, q: 0.9, a: 0.25, hold: 0.45, lfo: [4.5, 250] });
      noise(t, 1.4, 0.12 * v, o, { ft: 'bandpass', f: 2400, q: 1.2, a: 0.2, hold: 0.4, lfo: [6.3, 600] });
      for (let i = 0; i < 3; i++) {
        const f = (300 + R() * 300) * p;
        formant(t + R() * 0.3, [[0, f], [0.3, f * 1.5], [0.9, f * 1.2]], [[0, 'o'], [0.4, 'u']], 0.9 + R() * 0.3, 0.12 * v, o, { vib: 40, vr: 6 });
      }
      for (let i = 0; i < 6; i++) clap(t + 0.2 + R() * 1.0, 0.18 * v * (0.5 + R()), o);
    },
    flame: (t, p, v, o) => {    // flame-cannon whoosh
      noise(t, 0.9, 0.45 * v, o, { ft: 'lowpass', f: 300 * p, f1: 2400 * p, st: 0.15, f2: 500 * p, q: 1, a: 0.03, hold: 0.25 });
      noise(t, 0.8, 0.18 * v, o, { ft: 'bandpass', f: 1800 * p, q: 0.8, lfo: [23, 900], a: 0.02 });
      tone(t, 'sine', 90 * p, 45, 0.4, 0.35 * v, o);
    },
    dust: (t, p, v, o) => {     // dust-storm gust
      noise(t, 1.6, 0.45 * v, o, { ft: 'bandpass', f: 300 * p, f1: 1300 * p, st: 0.8, f2: 500 * p, q: 1.2, a: 0.5 });
      noise(t + 0.2, 1.3, 0.1 * v, o, { ft: 'highpass', f: 3500, a: 0.5, lfo: [11, 1500] });
      for (let i = 0; i < 5; i++) noise(t + 0.3 + R() * 1.0, 0.03, 0.1 * v, o, { ft: 'bandpass', f: 3000 + R() * 3000, q: 3 });
    },
    gift: (t, p, v, o) => {     // paper rustle + ta-da
      for (let i = 0; i < 4; i++) noise(t + i * 0.045, 0.05, 0.18 * v, o, { ft: 'bandpass', f: 2500 + R() * 2500, q: 1.5 });
      run(t + 0.2, 'p25', [72, 76, 79], 0.07, 0.07, 0.14 * v, o, p, LP(4000, { hold: 0.5 }));
      [84, 88, 91].forEach(m => voice('bell', t + 0.41, m + K(p), 0.5, 0.05 * v, o));
    },
    glowstick: (t, p, v, o) => { // light crackle-snap
      noise(t, 0.025, 0.25 * v, o, { ft: 'highpass', f: 4000 });
      noise(t + 0.03, 0.02, 0.18 * v, o, { ft: 'highpass', f: 6000 });
      tone(t + 0.02, 'sine', 2600 * p, 3200 * p, 0.12, 0.08 * v, o);
    },
    select2: (t, p, v, o) => { tone(t, 'triangle', 660 * p, 0, 0.05, 0.18 * v, o); tone(t + 0.045, 'triangle', 990 * p, 0, 0.08, 0.18 * v, o); },
    cardFlip: (t, p, v, o) => {
      noise(t, 0.07, 0.6 * v, o, { ft: 'bandpass', f: 1500 * p, f1: 5000 * p, q: 1.5 });
      tone(t + 0.06, 'triangle', 1800 * p, 0, 0.03, 0.12 * v, o);
    },
    // kart racer
    kartCountdown: (t, p, v, o) => tone(t, 'square', 880 * p, 0, 0.18, 0.14 * v, o, LP(4000, { hold: 0.7 })),
    kartGo: (t, p, v, o) => {
      tone(t, 'square', 1760 * p, 0, 0.45, 0.13 * v, o, LP(5000, { hold: 0.6 }));
      noise(t, 0.5, 0.2 * v, o, { ft: 'bandpass', f: 400, f1: 4000, q: 1.2, a: 0.05 });
    },
    kartItem: (t, p, v, o) => {
      run(t, 'p25', [76, 81, 86, 93], 0.05, 0.05, 0.2 * v, o, p, LP(5000));
      [98, 103].forEach((m, i) => voice('glass', t + 0.2 + i * 0.05, m + K(p), 0.05, 0.05 * v, o));
    },
    kartRoulette: (t, p, v, o) => { for (let i = 0; i < 10; i++) tone(t + i * 0.06, 'p12', (1200 + (i % 3) * 300) * p, 0, 0.03, 0.16 * v, o, LP(6000)); },
    kartBoost: (t, p, v, o) => {
      noise(t, 0.6, 0.35 * v, o, { ft: 'bandpass', f: 300, f1: 3000, q: 1, a: 0.02, hold: 0.3 });
      tone(t, 'sawtooth', 150 * p, 600 * p, 0.6, 0.08 * v, o, LP(800, { ff1: 4000, hold: 0.4 }));
    },
    kartDrift: (t, p, v, o) => { // tire squeal
      noise(t, 0.42, 0.55 * v, o, { ft: 'bandpass', f: 2600 * p, q: 8, lfo: [17, 300], a: 0.03, hold: 0.6 });
      tone(t, 'square', 1900 * p, 1750 * p, 0.42, 0.07 * v, o, { ft: 'bandpass', ff: 2200, fq: 4, vib: 40, vr: 21, a: 0.03, hold: 0.6 });
    },
    kartHit: (t, p, v, o) => {   // spin-out
      tone(t, 'sawtooth', 700 * p, 150 * p, 0.7, 0.08 * v, o, LP(2000, { vib: 300, vr: 9 }));
      noise(t, 0.25, 0.25 * v, o, { ft: 'lowpass', f: 2500, f1: 300 });
      for (let i = 0; i < 3; i++) noise(t + 0.15 + i * 0.17, 0.12, 0.15 * v, o, { ft: 'bandpass', f: 800, f1: 2500, q: 2 });
      drum('K', t, 0.45 * v, o);
    },
    kartLap: (t, p, v, o) => {
      run(t, 'p25', [79, 86], 0.1, 0.09, 0.14 * v, o, p, LP(5000, { hold: 0.7 }));
      voice('bell', t + 0.1, 98 + K(p), 0.3, 0.05 * v, o);
    },
    kartFinalLap: (t, p, v, o) => { // alert jingle
      run(t, 'square', [76, 76, 83, 88], 0.11, 0.09, 0.09 * v, o, p, LP(4500, { hold: 0.6 }));
      run(t, 'p25', [72, 72, 79, 84], 0.11, 0.09, 0.07 * v, o, p, LP(4000, { hold: 0.6 }));
    },
    kartFinish: (t, p, v, o) => { // fanfare
      const k = K(p), n = [[67, 0, 0.1], [72, 0.12, 0.1], [76, 0.24, 0.1], [79, 0.36, 0.3], [76, 0.7, 0.1], [79, 0.82, 0.7]];
      for (const x of n) { voice('saw2', t + x[1], x[0] + k, x[2], 0.12 * v, o); voice('saw2', t + x[1], x[0] - 5 + k, x[2], 0.06 * v, o); }
      [60, 64, 67].forEach(m => voice('strings', t + 0.82, m + k, 0.7, 0.05 * v, o));
      [0, 0.12, 0.24, 0.36].forEach(d => drum('s', t + d, 0.6 * v, o));
      drum('K', t + 0.82, 0.8 * v, o); drum('x', t + 0.82, 0.7 * v, o);
    },
    kartPuke: (t, p, v, o) => {
      SFX.puke(t, p * 0.9, v, o);
      noise(t + 0.15, 0.2, 0.2 * v, o, { ft: 'bandpass', f: 2000, f1: 500, q: 2 });
    },
    kartSwarm: (t, p, v, o) => swarm(t, 1.2, 0.11 * v, o, p)
  });

  // ------------------------------------------------- 8-bit SFX (setRetro) --
  const T8 = (t, w, f0, f1, dur, v, o, x) => tone(t, w, f0, f1, dur, v, o, Object.assign({ a: 0.002, hold: 0.6 }, x || {}));
  const C8 = { a: 0.002, hold: 0.8 };
  const RSFX = {
    jump: (t, p, v, o) => T8(t, 'n25', 290 * p, 760 * p, 0.16, 0.14 * v, o, { st: 0.14 }),
    jumpBig: (t, p, v, o) => T8(t, 'square', 200 * p, 560 * p, 0.22, 0.11 * v, o, { st: 0.2 }),
    stomp: (t, p, v, o) => { T8(t, 'square', 620 * p, 110 * p, 0.1, 0.08 * v, o, { hold: 0.2 }); chit(t, 0.06, 0.2 * v, o, 0.6); },
    pick: (t, p, v, o) => { T8(t, 'n12', 1174.7 * p, 0, 0.06, 0.14 * v, o, { hold: 0.9 }); T8(t + 0.06, 'n12', 1760 * p, 0, 0.32, 0.14 * v, o, { hold: 0.3 }); },
    powerup: (t, p, v, o) => run(t, 'n25', [55, 59, 62, 67, 71, 74, 79, 83, 86], 0.045, 0.06, 0.11 * v, o, p, C8),
    powerdown: (t, p, v, o) => run(t, 'n25', [79, 74, 70, 67, 62, 58, 55], 0.07, 0.07, 0.12 * v, o, p, C8),
    appear: (t, p, v, o) => run(t, 'n12', [60, 62, 64, 65, 67, 69, 71, 72, 74, 76], 0.035, 0.04, 0.11 * v, o, p, C8),
    bump: (t, p, v, o) => { T8(t, 'ntri', 130 * p, 55 * p, 0.1, 0.3 * v, o); chit(t, 0.04, 0.12 * v, o, 0.3); },
    break: (t, p, v, o) => { chit(t, 0.3, 0.3 * v, o, 0.35); T8(t, 'ntri', 200 * p, 50, 0.15, 0.3 * v, o); },
    throw: (t, p, v, o) => { T8(t, 'n25', 900 * p, 300 * p, 0.14, 0.1 * v, o, { st: 0.07, f2: 700 * p }); chit(t, 0.05, 0.08 * v, o, 1); },
    kick: (t, p, v, o) => { T8(t, 'square', 520 * p, 150 * p, 0.07, 0.11 * v, o); chit(t, 0.03, 0.15 * v, o, 0.8); },
    hurt: (t, p, v, o) => T8(t, 'square', 620 * p, 190 * p, 0.32, 0.1 * v, o, { vib: 120, vr: 30 }),
    oneup: (t, p, v, o) => run(t, 'n25', [79, 83, 86, 91], 0.085, 0.08, 0.12 * v, o, p, C8),
    die: (t, p, v, o) => playComp('retro_die', t, v, o),
    clear: (t, p, v, o) => playComp('retro_clear', t, v, o),
    gameover: (t, p, v, o) => {
      run(t, 'n25', [72, 67, 64, 60, 55], 0.22, 0.2, 0.08 * v, o, p, C8);
      run(t, 'ntri', [48, 43, 40, 36, 31], 0.22, 0.2, 0.3 * v, o, p, C8);
    },
    checkpoint: (t, p, v, o) => { run(t, 'n12', [72, 76, 79, 84], 0.07, 0.07, 0.08 * v, o, p, C8); T8(t, 'ntri', mtof(48) * p, 0, 0.3, 0.25 * v, o); },
    portal: (t, p, v, o) => { T8(t, 'n25', 200 * p, 1200 * p, 0.7, 0.09 * v, o, { vib: 250, vr: 12, lin: 1 }); chit(t, 0.7, 0.05 * v, o, 0.25); },
    spring: (t, p, v, o) => T8(t, 'ntri', 150 * p, 640 * p, 0.38, 0.3 * v, o, { st: 0.12, vib: 200, vr: 16, hold: 0.3 }),
    bossHit: (t, p, v, o) => { T8(t, 'square', 320 * p, 80 * p, 0.18, 0.08 * v, o); chit(t, 0.16, 0.25 * v, o, 0.5); },
    fire: (t, p, v, o) => { T8(t, 'n25', 1300 * p, 320 * p, 0.12, 0.1 * v, o, { hold: 0.2 }); chit(t, 0.08, 0.08 * v, o, 0.9); },
    select: (t, p, v, o) => T8(t, 'n25', 1318.5 * p, 0, 0.05, 0.12 * v, o, { hold: 0.8 }),
    coinTally: (t, p, v, o) => T8(t, 'n12', 2093 * p, 0, 0.025, 0.09 * v, o, { hold: 0.8 })
  };

  // ------------------------------------- BRADY-O BURNS / SUPER BRADY-O WORLD SFX --
  // gibberish speech: quick formant syllables with a pitch contour
  function babble(t, n, f0, rate, v, out, p, o) {
    const V = ['a', 'e', 'i', 'o', 'u'];
    let tt = t;
    for (let i = 0; i < n; i++) {
      const d = rate * (0.7 + R() * 0.6);
      const f = f0 * p * (1 + (R() - 0.5) * (o.spread || 0.3)) * (o.rise ? 1 + (i / n) * o.rise : 1);
      formant(tt, [[0, f], [d, f * (o.fall || 0.92)]], [[0, V[(R() * 5) | 0]], [d * 0.7, V[(R() * 5) | 0]]], d, v, out, { vib: o.vib || 0, vr: 8, a: 0.015 });
      tt += d + (o.gap || 0.02);
    }
  }

  Object.assign(SFX, {
    // movement
    footstep: (t, p, v, o) => noise(t, 0.055, 0.22 * v, o, { ft: 'bandpass', f: (1300 + R() * 1400) * p, q: 1.1, a: 0.003 }),
    land: (t, p, v, o) => {
      tone(t, 'sine', 150 * p, 55, 0.12, 0.4 * v, o);
      noise(t, 0.09, 0.22 * v, o, { ft: 'lowpass', f: 1400 });
    },
    jump3d: (t, p, v, o) => {
      tone(t, 'triangle', 230 * p, 560 * p, 0.2, 0.2 * v, o, { st: 0.15 });
      noise(t, 0.18, 0.12 * v, o, { ft: 'bandpass', f: 600 * p, f1: 2200 * p, q: 1.2, a: 0.02 });
    },
    doublejump: (t, p, v, o) => {   // higher hop + flip whoosh
      tone(t, 'p25', 420 * p, 980 * p, 0.16, 0.16 * v, o, LP(3500, { st: 0.12 }));
      noise(t + 0.04, 0.32, 0.36 * v, o, { ft: 'bandpass', f: 700 * p, f1: 3200 * p, st: 0.14, f2: 900 * p, q: 1.6, a: 0.03, lfo: [14, 400] });
    },
    groundpound: (t, p, v, o) => {  // dive whoosh, then a heavy impact
      noise(t, 0.2, 0.2 * v, o, { ft: 'bandpass', f: 3000 * p, f1: 500 * p, q: 1.2 });
      tone(t, 'triangle', 900 * p, 250 * p, 0.18, 0.08 * v, o);
      tone(t + 0.18, 'sine', 130 * p, 32, 0.4, 0.6 * v, o);
      noise(t + 0.18, 0.3, 0.45 * v, o, { ft: 'lowpass', f: 1600, f1: 200 });
      noise(t + 0.18, 0.05, 0.25 * v, o, { ft: 'highpass', f: 2500 });
    },
    spin: (t, p, v, o) => {         // headbang spin attack: swirling whoosh + two power-chord chugs
      noise(t, 0.38, 0.32 * v, o, { ft: 'bandpass', f: 900 * p, q: 2, lfo: [9, 700], a: 0.02, hold: 0.5 });
      voice('dist', t + 0.02, 40 + K(p), 0.16, 0.18 * v, o);
      voice('dist', t + 0.2, 43 + K(p), 0.14, 0.15 * v, o);
    },
    // rewards & story
    token_get: (t, p, v, o) => {    // big reward fanfare (~1.6 s)
      const k = K(p);
      [[67, 0], [72, 0.09], [76, 0.18], [79, 0.27]].forEach(n => voice('brass', t + n[1], n[0] + k, 0.1, 0.13 * v, o));
      [72, 76, 79, 84].forEach(m => voice('brass', t + 0.38, m + k, 0.9, 0.07 * v, o));
      [60, 67].forEach(m => voice('strings', t + 0.38, m + k, 1.0, 0.06 * v, o));
      [96, 100, 103, 108].forEach((m, i) => voice('bell', t + 0.45 + i * 0.06, m + k, 0.4, 0.04 * v, o));
      [0, 0.09, 0.18, 0.27].forEach(d => drum('s', t + d, 0.4 * v, o));
      drum('K', t + 0.38, 0.8 * v, o); drum('x', t + 0.38, 0.7 * v, o);
    },
    ticket: (t, p, v, o) => {
      tone(t, 'p25', 1568 * p, 0, 0.06, 0.12 * v, o, LP(6000));
      tone(t + 0.06, 'p25', 2093 * p, 0, 0.2, 0.12 * v, o, LP(7000, { hold: 0.3 }));
      noise(t, 0.05, 0.15 * v, o, { ft: 'bandpass', f: 4000, q: 1.5 });
    },
    dialogue_blip: (t, p, v, o) => tone(t, 'square', (520 + R() * 160) * p, 0, 0.035, 0.075 * v, o, LP(2200, { hold: 0.6 })),
    crowd_cheer: (t, p, v, o) => {
      SFX.crowd(t, p, v, o);
      tone(t + 0.3, 'sine', 1400 * p, 2600 * p, 0.5, 0.05 * v, o, { st: 0.25, f2: 2200 * p });
      tone(t + 0.8, 'sine', 1700 * p, 2900 * p, 0.4, 0.04 * v, o, { st: 0.2, f2: 2400 * p });
    },
    // characters
    yell: (t, p, v, o) => babble(t, 6, 300, 0.13, 0.24 * v, o, p, { spread: 0.35, vib: 30, fall: 1.15 }),
    greeter_bell: (t, p, v, o) => { // big brass bell, struck twice
      const k = K(p);
      [0, 0.5].forEach((d, i) => {
        voice('bigbell', t + d, 55 + k, 1.6, 0.16 * v * (i ? 0.8 : 1), o);
        voice('bigbell', t + d, 67.3 + k, 1.2, 0.07 * v, o);
        noise(t + d, 0.03, 0.2 * v, o, { ft: 'bandpass', f: 3500, q: 2 });
      });
    },
    camera_flash: (t, p, v, o) => {  // shutter, flash pop, recharge whine
      noise(t, 0.015, 0.3 * v, o, { ft: 'highpass', f: 3000 });
      noise(t + 0.05, 0.02, 0.25 * v, o, { ft: 'highpass', f: 2000 });
      noise(t + 0.05, 0.12, 0.18 * v, o, { ft: 'bandpass', f: 6000, q: 0.8 });
      tone(t + 0.15, 'sine', 1200 * p, 5200 * p, 0.7, 0.035 * v, o, { lin: 1, a: 0.05, hold: 0.6 });
    },
    pitch_blah: (t, p, v, o) => {   // gibberish start-up pitch, ends on a bright "ding"
      babble(t, 8, 170, 0.11, 0.28 * v, o, p, { spread: 0.25, rise: 0.4, fall: 0.95 });
      voice('bell', t + 1.15, 88 + K(p), 0.2, 0.05 * v, o);
    },
    hurt3d: (t, p, v, o) => {
      tone(t, 'sawtooth', 460 * p, 170 * p, 0.3, 0.15 * v, o, LP(1600, { vib: 60, vr: 25 }));
      noise(t, 0.08, 0.25 * v, o, { ft: 'lowpass', f: 1500 });
      formant(t, [[0, 210 * p], [0.22, 150 * p]], [[0, 'o'], [0.15, 'u']], 0.25, 0.3 * v, o, { a: 0.01 });
    },
    // the Man
    neon_flash: (t, p, v, o) => {   // huge electric flash
      noise(t, 0.08, 0.5 * v, o, { ft: 'highpass', f: 1500 });
      noise(t, 0.9, 0.25 * v, o, { ft: 'bandpass', f: 2500 * p, q: 1.5, lfo: [37, 1800], a: 0.005 });
      tone(t, 'sawtooth', 120 * p, 0, 1.0, 0.07 * v, o, LP(900, { hold: 0.4, vib: 15, vr: 50 }));
      tone(t, 'square', 3000 * p, 120 * p, 0.4, 0.05 * v, o, LP(5000));
      tone(t, 'sine', 70 * p, 40, 0.5, 0.35 * v, o);
    },
    man_roar: (t, p, v, o) => {     // deep wooden roar with creaks (~1.8 s)
      formant(t, [[0, 70 * p], [0.4, 95 * p], [1.6, 55 * p]], [[0, 'o'], [0.5, 'a'], [1.4, 'o']], 1.8, 0.55 * v, o, { vib: 25, vr: 5, a: 0.15 });
      croak(t + 0.1, 38 * p, 1.5, 0.35 * v, o, 9);
      noise(t, 1.8, 0.2 * v, o, { ft: 'lowpass', f: 300, q: 0.8, a: 0.2, hold: 0.5 });
      for (let i = 0; i < 4; i++) noise(t + 0.3 + i * 0.35 + R() * 0.1, 0.05, 0.12 * v, o, { ft: 'bandpass', f: 900 + R() * 900, q: 5 });
    },
    man_stomp: (t, p, v, o) => {
      tone(t, 'sine', 85 * p, 28, 0.7, 0.6 * v, o);
      noise(t, 0.45, 0.4 * v, o, { ft: 'lowpass', f: 500, f1: 80 });
      noise(t, 0.06, 0.3 * v, o, { ft: 'bandpass', f: 1800, q: 2 });
      croak(t + 0.05, 50 * p, 0.3, 0.15 * v, o, 14);
    },
    // hazards & effects
    flame_jet: (t, p, v, o) => {
      noise(t, 0.05, 0.3 * v, o, { ft: 'bandpass', f: 600, q: 1 });
      noise(t + 0.03, 0.85, 0.45 * v, o, { ft: 'lowpass', f: 600 * p, f1: 1800 * p, st: 0.2, q: 1.2, a: 0.04, hold: 0.6 });
      noise(t + 0.03, 0.8, 0.16 * v, o, { ft: 'bandpass', f: 2200 * p, q: 0.8, lfo: [29, 1200], a: 0.03, hold: 0.5 });
      tone(t, 'sine', 75 * p, 50, 0.6, 0.25 * v, o, { a: 0.03 });
    },
    firework_launch: (t, p, v, o) => {
      tone(t, 'sine', 700 * p, 2700 * p, 0.9, 0.07 * v, o, { vib: 30, vr: 13, st: 0.85, a: 0.02, hold: 0.5 });
      noise(t, 0.9, 0.12 * v, o, { ft: 'highpass', f: 3500, a: 0.02, hold: 0.5 });
      noise(t, 0.05, 0.3 * v, o, { ft: 'lowpass', f: 900 });
    },
    firework_burst: (t, p, v, o) => {
      tone(t, 'sine', 110 * p, 35, 0.5, 0.6 * v, o);
      noise(t, 0.6, 0.5 * v, o, { ft: 'lowpass', f: 3000, f1: 300 });
      for (let i = 0; i < 12; i++) noise(t + 0.15 + R() * 1.0, 0.025, (0.08 + R() * 0.1) * v, o, { ft: 'highpass', f: 3000 + R() * 4000 });
      [84, 88, 91, 96].forEach((m, i) => voice('glass', t + 0.1 + i * 0.05, m + K(p) + 12 * ((R() * 2) | 0), 0.05, 0.04 * v, o));
    },
    // bike
    bike_bell: (t, p, v, o) => {    // tring-tring
      const k = K(p);
      for (const d of [0, 0.07, 0.14, 0.42, 0.49, 0.56]) {
        voice('bell', t + d, 93.2 + k, 0.12, 0.06 * v, o);
        tone(t + d, 'sine', 4100 * p, 0, 0.12, 0.025 * v, o);
      }
    },
    bike_pedal: (t, p, v, o) => {   // freewheel ticks + chain whirr
      for (let i = 0; i < 6; i++) noise(t + i * 0.035, 0.012, 0.14 * v, o, { ft: 'highpass', f: 4500 * p });
      noise(t, 0.2, 0.1 * v, o, { ft: 'bandpass', f: 800 * p, f1: 1400 * p, q: 2 });
    },
    // pickups
    pickup_bag: (t, p, v, o) => {
      for (let i = 0; i < 3; i++) noise(t + i * 0.04, 0.05, 0.16 * v, o, { ft: 'bandpass', f: 2000 + R() * 2500, q: 1.3 });
      tone(t + 0.12, 'sine', 380 * p, 920 * p, 0.09, 0.22 * v, o);
    },
    molly: (t, p, v, o) => {        // warm sparkle
      const k = K(p);
      [62, 66, 69, 73].forEach((m, i) => voice('ep', t + i * 0.04, m + k, 0.8, 0.06 * v, o));
      voice('swell', t, 50 + k, 0.7, 0.07 * v, o);
      [86, 90, 93, 97, 98, 102].forEach((m, i) => voice('glass', t + 0.15 + i * 0.07, m + k, 0.05, 0.04 * v, o));
    },
    khole: (t, p, v, o) => {        // slow-motion warble (~1.6 s)
      tone(t, 'triangle', 440 * p, 110 * p, 1.6, 0.16 * v, o, { vib: 90, vr: 2.2, a: 0.1, hold: 0.5, lin: 1 });
      tone(t, 'sine', 220 * p, 55 * p, 1.6, 0.18 * v, o, { vib: 60, vr: 1.7, a: 0.1, hold: 0.5, lin: 1 });
      noise(t, 1.6, 0.08 * v, o, { ft: 'lowpass', f: 2000, f1: 200, q: 3, a: 0.3, lfo: [1.5, 300] });
    },
    powder: (t, p, v, o) => {       // fast jittery zip
      tone(t, 'square', 300 * p, 2600 * p, 0.22, 0.1 * v, o, LP(4000, { vib: 120, vr: 45 }));
      noise(t, 0.2, 0.3 * v, o, { ft: 'bandpass', f: 1500 * p, f1: 7000 * p, q: 2 });
      for (let i = 0; i < 4; i++) tone(t + 0.2 + i * 0.035, 'p12', (1800 + R() * 1500) * p, 0, 0.03, 0.06 * v, o, LP(7000));
    },
    lsd: (t, p, v, o) => {          // psychedelic shimmer (~1.3 s)
      const k = K(p);
      [72, 74, 76, 78, 80, 82, 84, 86, 88].forEach((m, i) => voice('glass', t + i * 0.07, m + k, 0.1, 0.045 * v, o));
      tone(t, 'sine', 500 * p, 1000 * p, 1.3, 0.07 * v, o, { vib: 200, vr: 3.5, a: 0.2, hold: 0.5, lin: 1 });
      tone(t, 'triangle', 750 * p, 1500 * p, 1.3, 0.05 * v, o, { vib: 240, vr: 2.5, a: 0.2, hold: 0.5, lin: 1 });
      noise(t, 1.3, 0.08 * v, o, { ft: 'bandpass', f: 800, f1: 5000, q: 6, a: 0.2, lfo: [3, 1500] });
    },
    costume: (t, p, v, o) => {      // magical outfit change: harp sweep + sparkle + bell
      const k = K(p);
      [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84].forEach((m, i) => voice('harp', t + i * 0.035, m + k, 0.15, 0.08 * v, o));
      noise(t + 0.1, 0.6, 0.1 * v, o, { ft: 'highpass', f: 6000, a: 0.1 });
      voice('bell', t + 0.42, 91 + k, 0.5, 0.06 * v, o); voice('bell', t + 0.42, 96 + k, 0.5, 0.04 * v, o);
    },
    map_open: (t, p, v, o) => {     // paper rustle + flap
      for (let i = 0; i < 5; i++) noise(t + i * 0.05 + R() * 0.02, 0.06, 0.28 * v, o, { ft: 'bandpass', f: 1800 + R() * 3000, q: 1.2 });
      tone(t + 0.22, 'sine', 140 * p, 90, 0.1, 0.15 * v, o);
    },
    key: (t, p, v, o) => {          // metallic clinks + little chime
      [0, 0.08].forEach(d => { tone(t + d, 'triangle', 3100 * p, 0, 0.15, 0.07 * v, o); tone(t + d, 'sine', 4370 * p, 0, 0.12, 0.05 * v, o); });
      run(t + 0.18, 'p25', [84, 91], 0.07, 0.08, 0.11 * v, o, p, LP(6000, { hold: 0.5 }));
    },
    door: (t, p, v, o) => {         // creak, then thud
      croak(t, 95 * p, 0.55, 0.25 * v, o, 21);
      tone(t + 0.5, 'sine', 120 * p, 55, 0.18, 0.35 * v, o);
      noise(t + 0.5, 0.08, 0.2 * v, o, { ft: 'lowpass', f: 900 });
    }
  });

  // ---------------------------------------------------------------- music --
  // Track format (all original compositions):
  //  bpm, spb steps/beat (4), bpb beats/bar (4), bars
  //  ch  chords, one token per bar ("F,G" splits a bar evenly)
  //  ld  lead line "NOTE:steps" ('.' rest, '_' tie, '|' bar line); li inst, lv vol, lg gate
  //  hx  auto-harmony volume (nearest chord tone a third-ish below the lead), hi its inst
  //  l2  optional second melody line (l2i/l2v/l2g inst/vol/gate), same syntax as ld
  //  bp  bass pattern (r root, f fifth, o octave, t third, s seventh, x sixth, l low fifth, '-' hold, '.' rest;
  //      UPPERCASE = accent); bi/bv/bo inst/vol/base note
  //  ap  arp pattern (0-9 chord-tone index, c whole chord, '-' hold); ai/av/ao
  //  a2  second arp/stab layer (a2i/a2v/a2o); pd pad pattern (pi/pv/po)
  //  dr  drum lanes (see drum()); fill lanes replace them on the last bar of every fe bars
  //  pump side-chain depth (kick ducks everything but drums), sw 16th swing, sw8 8th shuffle,
  //  bld [from, to] filter build across the loop, wr wobble cycles per beat,
  //  rv reverb send, dl echo send, dtb echo time in beats, retro (8-bit kit, dry), loop (default true)
  // Patterns cycle by their own length, so a pattern as long as the whole track
  // works as an arrangement (layers entering and leaving).
  const dots = n => '.'.repeat(n);
  const rp = (s, n) => s.repeat(n);
  const X = bars => 'x' + dots(bars * 16 - 1);          // crash every `bars` bars
  const FOUR = 'k...k...k...k...', CLAP = '....c.......c...', OFFO = '..o...o...o...o.', H16 = 'hh.hhh.hhh.hhh.h';
  const TRACKS = {};

  Object.assign(TRACKS, {
    // Title: anthemic festival opener. E major house anthem
    title: {
      bpm: 124, bars: 16, rv: 0.25, dl: 0.1, pump: 0.45,
      ch: 'E B C#m A E B A B C#m A E B C#m A F#m A,B',
      ld: 'B4:2 E5:2 G#5:4 F#5:2 E5:2 B4:4 | D#5:2 F#5:2 B5:6 A5:2 G#5:2 F#5:2 | G#5:4 E5:4 C#5:4 E5:4 | E5:6 C#5:2 A4:8 |' +
          'B4:2 E5:2 G#5:4 B5:4 G#5:4 | A5:2 G#5:2 F#5:4 D#5:4 B4:4 | C#5:4 E5:4 A5:4 C#6:4 | B5:12 .:4 |' +
          'E6:4 D#6:2 C#6:2 B5:4 G#5:4 | A5:4 C#6:4 E6:8 | G#5:6 F#5:2 E5:4 B4:4 | D#5:4 F#5:4 B5:8 |' +
          'C#6:4 B5:2 G#5:2 E5:4 G#5:4 | A5:6 G#5:2 E5:8 | F#5:4 A5:4 C#6:4 A5:4 | G#5:4 A5:4 B5:8',
      li: 'saw2', lv: 0.15, hx: 0.06,
      bp: '..r-..r-..r-..o-', bi: 'sawb', bv: 0.27,
      ap: '0.2.1.3.0.2.1.3.', ai: 'pulse', av: 0.04, ao: 64,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 52,
      dr: [FOUR, CLAP, OFFO, H16, X(8)], dv: 0.5,
      fill: ['k...k...k...k.k.', '....c...c.c.cccc', '..o...o...o.....'], fe: 8
    },
    // Map: laid-back sunset groove (balearic), D major 7ths
    map: {
      bpm: 96, bars: 8, rv: 0.3, dl: 0.15, sw: 0.12,
      ch: 'Dmaj7 Bm7 Gmaj7 A Dmaj7 F#m7 Gmaj7 Em7,A',
      ld: 'F#5:4 A5:2 C#6:2 A5:4 F#5:4 | D5:6 F#5:2 A5:8 | B5:4 A5:2 F#5:2 D5:4 B4:4 | C#5:6 E5:2 A5:8 |' +
          'F#5:4 E5:2 D5:2 A4:4 C#5:4 | E5:4 C#5:4 A4:4 C#5:4 | D5:4 F#5:4 B5:4 A5:4 | G5:6 F#5:2 E5:8',
      li: 'whistle', lv: 0.12,
      bp: 'r-..r...f-..o...', bi: 'sub', bv: 0.3,
      ap: 'c-..c-....c-....', ai: 'ep', av: 0.06, ao: 57,
      dr: ['k.......k..k....', CLAP, '..h...h...h...h.', 'n.n.n.n.n.n.n.n.'], dv: 0.42
    },
    // W1 Packing Night: cozy late-night lo-fi house, C minor 9ths, swung hats + vinyl dust
    w1: {
      bpm: 118, bars: 16, rv: 0.3, dl: 0.1, sw: 0.16, pump: 0.35,
      ch: 'Cm9 Fm9 Abmaj7 G7 Cm9 Fm9 Abmaj7 G7 Ebmaj7 Bb Abmaj7 G7 Fm9 Bb Ebmaj7,Abmaj7 G7',
      ld: 'G5:2 Bb5:2 .:2 G5:2 F5:2 Eb5:2 D5:4 | C5:4 Eb5:2 F5:2 .:4 Ab5:4 | G5:2 Eb5:2 .:2 C5:2 Eb5:2 G5:2 Bb5:4 | B4:4 D5:4 F5:6 D5:2 |' +
          'G5:2 Bb5:2 .:2 G5:2 F5:2 Eb5:2 C6:4 | Ab5:4 G5:2 F5:2 .:4 C5:4 | Eb5:2 F5:2 G5:4 C6:2 Bb5:2 G5:4 | B5:8 .:8 |' +
          'G5:4 Bb5:2 D6:2 .:4 Bb5:4 | F5:4 D5:2 Bb4:2 .:4 D5:4 | C6:2 Bb5:2 G5:2 Eb5:2 C5:4 Eb5:4 | D5:6 F5:2 G5:8 |' +
          'Ab5:2 G5:2 F5:2 Eb5:2 C5:4 G5:4 | F5:4 D5:4 Bb4:4 D5:4 | G5:4 Bb5:4 C6:4 Eb6:4 | D6:4 B5:4 G5:8',
      li: 'sq2', lv: 0.11, lg: 0.85,
      bp: 'r-.r..r-..r-.o..', bi: 'sub', bv: 0.3,
      ap: 'c---..c-..c-....', ai: 'ep', av: 0.065, ao: 55,
      dr: [FOUR, CLAP, H16, '..o.......o.....', 'v..v.....v...v..'], dv: 0.4
    },
    // W2 Reno Supply Run: neon casino swing / synth-funk on a triplet grid. Bb, I-VI-ii-V
    w2: {
      bpm: 132, spb: 3, bars: 16, rv: 0.25,
      ch: 'Bb6 G7 Cm7 F7 Bb6 G7 Cm7,F7 Bb6 Eb Edim Bb6 G7 C7 F7 Cm7 F7',
      ld: 'F5:2 G5:1 Bb5:3 G5:2 F5:1 D5:3 | B4:2 D5:1 F5:3 E5:2 F5:1 G5:3 | G5:2 Bb5:1 Eb6:3 D6:2 C6:1 Bb5:3 | A5:6 .:3 F5:2 G5:1 |' +
          'Bb5:2 G5:1 F5:3 D5:2 F5:1 Bb5:3 | B5:3 A5:2 G5:1 F5:3 D5:3 | Eb5:2 G5:1 C6:3 A5:2 C6:1 Eb6:3 | D6:6 .:6 |' +
          'G5:2 Bb5:1 Eb6:3 Bb5:2 G5:1 Eb5:3 | E5:2 G5:1 Bb5:3 Db6:3 Bb5:3 | D6:3 C6:2 Bb5:1 G5:3 F5:3 | B5:2 D6:1 F6:3 E6:3 D6:3 |' +
          'E5:2 G5:1 Bb5:3 C6:2 Bb5:1 G5:3 | A5:3 C6:3 Eb6:3 C6:3 | Bb5:2 G5:1 Eb5:3 F5:2 G5:1 Bb5:3 | A5:6 C6:2 Eb6:1 F6:3',
      li: 'brass', lv: 0.14,
      bp: 'r--t--f--t--', bi: 'slapb', bv: 0.27,
      ap: '...c-....c-.', ai: 'stab', av: 0.045, ao: 58,
      dr: ['k.....k..k..', '...c.....c..', 'h..h.hh..h.h', '.....g.....g'], dv: 0.42
    },
    // W3 Highway 447: wide-open desert road-trip rock. E mixolydian, clean twang then fuzz chugs
    w3: {
      bpm: 112, bars: 16, rv: 0.35, dl: 0.12,
      ch: 'E D A E E D A B C#m A E B C#m A D D',
      ld: 'B4:2 E5:2 G#5:2 B5:6 G#5:2 E5:2 | F#5:4 A5:2 F#5:2 D5:8 | E5:2 C#5:2 A4:4 C#5:2 E5:2 A5:4 | G#5:12 .:4 |' +
          'B5:2 G#5:2 E5:2 B4:6 E5:2 F#5:2 | A5:4 F#5:2 A5:2 D6:8 | C#6:4 B5:2 A5:2 E5:4 C#5:4 | D#5:4 F#5:4 B5:8 |' +
          'E5:6 G#5:2 C#6:8 | B5:4 A5:2 E5:2 C#5:8 | B4:2 E5:2 G#5:4 B5:4 E6:4 | D#6:6 C#6:2 B5:8 |' +
          'G#5:4 E5:4 C#5:4 E5:4 | A5:6 B5:2 C#6:8 | D6:4 C#6:2 A5:2 F#5:4 D5:4 | E5:12 .:4',
      li: 'twang', lv: 0.17,
      bp: 'r-r-r-r-r-r-o-r-', bi: 'sawb', bv: 0.25,
      a2: rp('0.2.3.2.', 16) + dots(128), a2i: 'twang', a2v: 0.035, a2o: 52,
      ap: dots(128) + rp('c--.c-..c--.c-..', 8), ai: 'dist', av: 0.045, ao: 40,
      dr: ['k.......k.k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.', '..j...j...j...j.', X(8)], dv: 0.45,
      fill: ['k.......k.k.....', '....s...s.mmt.tt', 'h.h.h.h.........'], fe: 8
    },
    // W4 Hot Springs: dreamy, bubbly, slow; drenched in reverb (swimming levels)
    w4: {
      bpm: 76, bars: 8, rv: 0.7, dl: 0.3,
      ch: 'Abmaj7 Dbmaj7 Fm9 Ebsus4 Abmaj7 Dbmaj7 Bbm7,Eb Abmaj7',
      ld: 'C6:6 Eb6:2 G5:8 | F5:4 Ab5:4 C6:8 | Ab5:6 G5:2 F5:4 C5:4 | Bb5:12 Ab5:4 |' +
          'Eb6:6 C6:2 Bb5:8 | Ab5:4 F5:4 C6:4 Db6:4 | Db6:6 C6:2 Bb5:4 G5:4 | Ab5:12 .:4',
      li: 'bell', lv: 0.14,
      bp: 'r-------r---f---', bi: 'sub', bv: 0.26,
      ap: '0.2.4.1.3.5.2.4.', ai: 'glass', av: 0.035, ao: 72,
      pd: 'c---------------', pi: 'pad', pv: 0.045, po: 56,
      dr: ['k.......k.......', '....n.......n...', 'u.....u..u......', '...u.......u..u.'], dv: 0.32
    },
    // W5 Gate Road: dusty slow-burning funk, impatient honks. E dorian
    w5: {
      bpm: 96, bars: 16, rv: 0.18, sw: 0.1,
      ch: 'Em7 A7 Em7 A7 Em7 A7 Cmaj7 B7 Am7 D7 Gmaj7 Cmaj7 Am7 D7 F#m7b5 B7',
      ld: '.:2 B4:1 D5:1 E5:2 .:2 G5:2 E5:1 D5:1 E5:4 | .:4 C#5:2 E5:2 G5:3 F#5:1 E5:4 | .:2 B4:1 D5:1 E5:2 .:2 B5:2 A5:1 G5:1 E5:4 | .:4 G5:2 A5:2 C#6:4 B5:2 A5:2 |' +
          'E6:3 D6:1 B5:2 .:2 G5:2 .:2 E5:4 | .:2 E5:2 G5:2 A5:2 C#6:2 .:2 A5:4 | G5:3 E5:1 B5:4 .:2 G5:2 E5:4 | D#5:2 F#5:2 A5:2 B5:2 .:4 F#5:4 |' +
          '.:2 E5:2 G5:2 A5:2 C6:3 B5:1 A5:4 | .:2 F#5:2 A5:2 C6:2 D6:4 C6:2 A5:2 | B5:3 A5:1 G5:2 D5:2 F#5:4 .:4 | E5:2 G5:2 B5:2 C6:2 .:2 B5:2 G5:4 |' +
          'A5:2 A5:2 .:2 A5:2 C6:4 E6:4 | D6:2 D6:2 .:2 D6:2 C6:4 A5:4 | C6:3 A5:1 F#5:4 E5:4 C5:4 | D#5:4 F#5:4 A5:4 B5:4',
      li: 'brass', lv: 0.14,
      bp: 'r..ro..r.r..f.o.', bi: 'slapb', bv: 0.28,
      ap: '.c.c..c..c.c..c.', ai: 'stab', av: 0.035, ao: 55,
      dr: ['k.....k...k.k...', '....s..g.g..s..g', H16, '..o.......o.....', 'v.....v.....v...'], dv: 0.45
    }
  });

  Object.assign(TRACKS, {
    // W6 The Esplanade: peak-hour house/techno, euphoric. Breakdown + snare roll in bars 13-16
    w6: {
      bpm: 126, bars: 16, rv: 0.3, dl: 0.12, pump: 0.5,
      ch: 'Am F C G Am F C G F G Em Am F G Dm E',
      ld: 'A5:3 A5:3 C6:2 B5:3 A5:3 E5:2 | F5:3 A5:3 C6:2 A5:3 G5:3 F5:2 | G5:3 G5:3 C6:2 E6:3 D6:3 C6:2 | B5:3 D6:3 G5:2 B5:4 .:4 |' +
          'A5:3 A5:3 C6:2 B5:3 A5:3 E6:2 | D6:3 C6:3 A5:2 F5:3 A5:3 C6:2 | E6:3 D6:3 C6:2 G5:3 E5:3 G5:2 | D6:12 B5:4 |' +
          'C6:6 A5:2 F5:8 | D6:6 B5:2 G5:8 | E6:6 D6:2 B5:4 G5:4 | C6:8 A5:4 E5:4 |' +
          'A5:4 C6:4 F6:8 | G6:6 F6:2 D6:8 | F6:4 E6:2 D6:2 A5:4 F5:4 | G#5:4 B5:4 E6:4 G#6:4',
      li: 'saw2', lv: 0.14, hx: 0.05,
      bp: rp('..r-..r-..r-..r-', 12) + rp('r---------------', 4), bi: 'sawb', bv: 0.27,
      ap: '0213021302130213', ai: 'pulse', av: 0.035, ao: 64,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 52,
      dr: [rp(FOUR, 12) + dots(64), rp(CLAP, 12) + dots(32) + rp(CLAP, 2), H16, rp(OFFO, 12) + dots(64),
        dots(224) + 's...s...s...s...ssssssssSSSSSSSS', X(8)], dv: 0.5
    },
    // W7 Theme Camp Row: playful, quirky, bouncy disco. G major, octave bass, cowbell
    w7: {
      bpm: 120, bars: 16, rv: 0.25, pump: 0.25, sw: 0.06,
      ch: 'G Em C D G Em Am7 D7 Cmaj7 Bm7 Am7 D7 Cmaj7 B7 Am7 D7',
      ld: 'D5:2 G5:2 .:2 G5:1 A5:1 B5:2 A5:2 G5:4 | E5:2 G5:2 .:2 B5:1 C6:1 B5:2 G5:2 E5:4 | C5:2 E5:2 .:2 G5:1 G#5:1 A5:2 G5:2 E5:4 | F#5:2 A5:2 D6:4 C6:2 A5:2 F#5:4 |' +
          'B5:2 D6:2 .:2 B5:1 C6:1 D6:2 B5:2 G5:4 | G5:2 B5:2 .:2 E6:1 D#6:1 E6:2 B5:2 G5:4 | A5:2 C6:2 E6:2 G6:2 E6:2 C6:2 A5:4 | F#5:4 .:2 A5:2 C6:4 .:4 |' +
          'E5:2 .:2 E5:2 G5:2 B5:4 A5:2 G5:2 | F#5:2 .:2 F#5:2 A5:2 D6:4 C#6:2 B5:2 | C6:2 .:2 C6:2 B5:2 A5:2 G5:2 E5:4 | F#5:2 G5:2 A5:2 B5:2 C6:2 D6:2 F#6:4 |' +
          'G6:4 E6:2 C6:2 B5:4 G5:4 | F#6:4 D#6:2 B5:2 A5:4 F#5:4 | E6:2 D6:2 C6:2 A5:2 G5:2 E5:2 C5:4 | D5:2 .:2 D5:2 .:2 F#5:2 A5:2 C6:4',
      li: 'sq2', lv: 0.12, lg: 0.6,
      bp: 'r-o-r-o-r-o-r-o-', bi: 'slapb', bv: 0.26,
      ap: '....c-..c-...c-.', ai: 'stab', av: 0.035, ao: 60,
      pd: 'c---------------', pi: 'strings', pv: 0.03, po: 55,
      dr: [FOUR, CLAP, OFFO, H16, '...w.....w..w...'], dv: 0.45
    },
    // W8 Deep Playa: hypnotic ambient techno; filters open across the loop, layers enter one by one
    w8: {
      bpm: 122, bars: 16, rv: 0.45, dl: 0.25, pump: 0.3, bld: [0.3, 1.5],
      ch: 'Dm Dm Bb C Dm Dm Bb C Dm Dm Bb C Gm Gm Bb A',
      ld: rp('.:16 | ', 8) +
          'A5:8 F5:4 D5:4 | E5:12 F5:4 | D5:8 F5:4 Bb5:4 | A5:6 G5:2 E5:8 |' +
          'D6:8 Bb5:4 G5:4 | A5:12 Bb5:4 | F5:6 G5:2 A5:8 | C#6:8 A5:4 E5:4',
      li: 'vox', lv: 0.13,
      bp: 'R..r..r..R..r.o.', bi: 'acid', bv: 0.22,
      ap: '0.2.4.0.2.5.', ai: 'pluck', av: 0.04, ao: 62,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 50,
      dr: [FOUR, dots(64) + rp('..h...h...h...h.', 12), dots(128) + rp(CLAP, 8), dots(128) + rp(OFFO, 8),
        dots(192) + rp('.l.l.l.l.l.l.l.l', 4), 'x' + dots(255)], dv: 0.45
    },
    // W9 The Temple: gentle, emotional, hopeful. Pads + piano
    w9: {
      bpm: 72, bars: 16, rv: 0.6, dl: 0.2,
      ch: 'Fmaj7 G Em7 Am Fmaj7 G C C Am Em7 Fmaj7 C Dm7 Em7 Fmaj7 G',
      ld: 'A5:4 C6:4 E6:6 C6:2 | D6:6 B5:2 G5:8 | E5:4 G5:4 B5:6 D6:2 | C6:12 .:4 |' +
          'A5:4 C6:4 F6:6 E6:2 | D6:4 B5:4 G5:4 D6:4 | E6:8 D6:4 C6:4 | C6:8 .:4 G5:4 |' +
          'A5:4 C6:4 E6:8 | D6:4 B5:4 G5:8 | A5:4 C6:4 F6:4 E6:4 | E6:6 D6:2 C6:8 |' +
          'F5:4 A5:4 C6:6 D6:2 | E6:4 D6:4 B5:4 G5:4 | A5:6 C6:2 E6:8 | D6:8 B5:4 G5:4',
      li: 'piano', lv: 0.17,
      ap: '0.1.2.1.3.1.2.1.', ai: 'piano', av: 0.035, ao: 48,
      pd: 'c---------------', pi: 'pad', pv: 0.05, po: 53,
      bp: 'r---------------', bi: 'sub', bv: 0.22,
      dr: [dots(128) + rp('....n.......n...', 8)], dv: 0.3
    },
    // W10 The Burn: epic, driving, fiery. E minor with a Neapolitan F, fuzz power chords
    w10: {
      bpm: 132, bars: 16, rv: 0.3,
      ch: 'Em Em C D Em Em F B Am C G D Am C F B',
      ld: 'E5:3 E5:3 G5:2 B5:4 A5:2 G5:2 | F#5:3 G5:3 A5:2 B5:8 | C6:3 B5:3 G5:2 E5:4 G5:4 | F#5:3 E5:3 D5:2 A5:8 |' +
          'E6:3 D6:3 B5:2 G5:4 B5:4 | E6:3 F#6:3 G6:2 E6:8 | F6:3 E6:3 C6:2 A5:4 C6:4 | D#6:6 B5:2 F#5:8 |' +
          'A5:6 C6:2 E6:8 | G6:6 E6:2 C6:8 | D6:6 B5:2 G5:4 B5:4 | A5:6 F#5:2 D5:8 |' +
          'E6:4 C6:4 A5:4 C6:4 | G6:4 E6:4 C6:4 E6:4 | A5:6 G5:2 F5:4 C6:4 | B5:4 D#6:4 F#6:8',
      li: 'saw2', lv: 0.14, hx: 0.05,
      bp: 'r-r-r-r-r-r-r-r-', bi: 'sawb', bv: 0.25,
      ap: 'c--.c--.c-.c-c-.', ai: 'dist', av: 0.05, ao: 40,
      dr: ['k...k...k...k.k.', '....S.......S...', 'h.h.h.h.h.h.h.h.', X(4)], dv: 0.5,
      fill: ['k...k...k...k.k.', '....S...S.mmttTT', 'h.h.h.h.........'], fe: 8
    },
    // Underground: inside-a-dome deep dub techno. Offbeat stabs into long echoes
    underground: {
      bpm: 124, bars: 8, rv: 0.45, dl: 0.5, pump: 0.4,
      ch: 'Fm7 Fm7 Dbmaj7 Eb Fm7 Fm7 Dbmaj7 Eb',
      ld: '.:16 | .:8 C6:2 .:2 Ab5:4 | .:16 | .:8 Bb5:2 .:2 G5:4 | .:16 | .:8 Eb6:2 .:2 C6:4 | .:8 F6:2 .:2 C6:4 | Bb5:8 .:8',
      li: 'vox', lv: 0.11,
      bp: 'r--.r--.r--.r-o.', bi: 'sub', bv: 0.3,
      ap: '...c-.....c-....', ai: 'stab', av: 0.045, ao: 60,
      dr: [FOUR, '..h...h...h...h.', '....r.......r...', 'n.n.n.n.n.n.n.n.'], dv: 0.42
    },
    // Castle: tense approach to a camp boss. G minor, pulsing bass, marching toms
    castle: {
      bpm: 112, bars: 16, rv: 0.35,
      ch: 'Gm Gm Eb D Gm Gm Cm D Eb F Bb Gm Eb Cm D D',
      ld: 'G5:2 .:2 G5:2 A5:2 Bb5:4 A5:4 | G5:4 D5:4 Eb5:4 D5:4 | G5:2 .:2 G5:2 Bb5:2 Eb6:4 D6:4 | F#5:8 A5:4 C6:4 |' +
          'Bb5:2 .:2 Bb5:2 C6:2 D6:4 C6:4 | Bb5:4 A5:4 G5:4 D5:4 | Eb5:4 G5:4 C6:4 Eb6:4 | D6:8 C6:4 A5:4 |' +
          'Bb5:6 G5:2 Eb5:8 | C6:6 A5:2 F5:8 | D6:6 C6:2 Bb5:4 F5:4 | G5:12 .:4 |' +
          'Eb6:4 D6:4 Bb5:4 G5:4 | C6:4 Bb5:4 G5:4 Eb5:4 | F#5:4 A5:4 D6:4 C6:4 | A5:4 F#5:4 D5:8',
      li: 'sq2', lv: 0.12,
      bp: 'rrr.rrr.rrr.rrr.', bi: 'sawb', bv: 0.22,
      ap: 'c-------c-------', ai: 'strings', av: 0.035, ao: 55,
      dr: ['k.......k.k.....', '....s.......s...', '..t...m...t...mm', 'h.h.h.h.h.h.h.h.'], dv: 0.42,
      fill: ['k.......k.k.....', '....s...mmttmmtt', 'h.h.h.h.........'], fe: 8
    },
    // Boss: aggressive breakbeat with an acid bass. A minor
    boss: {
      bpm: 140, bars: 16, rv: 0.2,
      ch: 'Am Am F E Am Am Dm E F G Am Am F G E E',
      ld: 'A4:2 A4:1 C5:1 .:2 E5:2 D#5:2 E5:2 G5:2 A5:2 | C6:3 B5:3 A5:2 G5:3 E5:3 D5:2 | F5:2 F5:1 A5:1 .:2 C6:2 B5:2 C6:2 F6:4 | E6:3 D6:3 B5:2 G#5:4 E5:4 |' +
          'A4:2 A4:1 C5:1 .:2 E5:2 D#5:2 E5:2 G5:2 A5:2 | E6:3 D6:3 C6:2 B5:3 A5:3 G5:2 | F5:2 A5:2 D6:2 F6:2 E6:3 D6:3 A5:2 | G#5:2 B5:2 E6:4 D6:2 B5:2 G#5:4 |' +
          'A5:6 G5:2 F5:4 C5:4 | B5:6 A5:2 G5:4 D5:4 | C6:3 B5:3 A5:2 E6:8 | E6:2 D6:2 C6:2 B5:2 A5:2 G5:2 E5:4 |' +
          'F5:3 A5:3 C6:2 F6:8 | G6:3 F6:3 D6:2 B5:8 | G#5:2 B5:2 E6:2 G#6:2 F6:2 E6:2 D6:2 B5:2 | E6:4 .:4 E5:2 .:6',
      li: 'saw2', lv: 0.14,
      bp: 'r.rr.ro.r.rr.f.o', bi: 'acid', bv: 0.22,
      ap: 'c..c......c..c..', ai: 'stab', av: 0.035, ao: 57,
      dr: ['k.....k...k.....k.k...k...k..k..', '....S.....g.S..g....S..g.g..S.S.', H16, '..o.......o.....', X(8)], dv: 0.5
    }
  });

  Object.assign(TRACKS, {
    // Final: Lord Buzzkill showdown. F# minor, buzzing semitone-trill motif, Neapolitan G, fuzz chugs
    final: {
      bpm: 150, bars: 16, rv: 0.25,
      ch: 'F#m F#m D C#7 F#m F#m G C#7 Bm Bm F#m F#m D E C#7 C#7',
      ld: 'F#5:1 G5:1 F#5:1 G5:1 F#5:4 .:2 C#6:2 C6:2 B5:2 | A5:3 G#5:3 F#5:2 C#5:8 | F#5:1 G5:1 F#5:1 G5:1 A5:4 .:2 D6:2 C#6:2 A5:2 | G#5:3 F5:3 B5:2 G#5:8 |' +
          'F#5:1 G5:1 F#5:1 G5:1 F#5:4 .:2 F#6:2 F6:2 E6:2 | C#6:3 A5:3 F#5:2 A5:4 C#6:4 | B5:3 D6:3 G6:2 F#6:4 D6:4 | F6:4 E6:4 C#6:4 G#5:4 |' +
          'D6:6 C#6:2 B5:8 | F#5:1 G5:1 F#5:1 G5:1 B5:4 D6:4 F#6:4 | A5:6 G#5:2 F#5:8 | C#6:4 B5:4 A5:4 G#5:4 |' +
          'F#5:4 A5:4 D6:4 F#6:4 | G#5:6 F#5:2 E5:8 | F5:2 G#5:2 B5:2 C#6:2 E6:4 F6:4 | C#6:1 D6:1 C#6:1 D6:1 C#6:4 G#5:4 F5:4',
      li: 'buzz', lv: 0.12,
      bp: 'r-r-r-r-r-r-r-r-', bi: 'reese', bv: 0.24,
      ap: 'c--.c-c-c--.c-c-', ai: 'dist', av: 0.055, ao: 42,
      dr: ['k.k.k.k.k.k.k.k.', '....S.......S...', '..h...h...h...h.', X(8)], dv: 0.46,
      fill: ['k.k.k.k.k.k.k.k.', '....S...S.SSmmtt', '..h...h.........'], fe: 8
    },
    // Star -> "Disco Fever" invincibility: fast euphoric disco. D major
    star: {
      bpm: 156, bars: 8, rv: 0.2, pump: 0.3,
      ch: 'D A Bm G D A G A',
      ld: 'F#5:2 A5:2 D6:2 A5:2 F#6:4 E6:2 D6:2 | C#6:2 E6:2 A6:4 G6:2 E6:2 C#6:4 | B5:2 D6:2 F#6:4 E6:2 D6:2 B5:4 | G5:2 B5:2 D6:4 E6:4 F#6:4 |' +
          'A6:4 F#6:2 D6:2 A5:4 D6:4 | E6:2 C#6:2 A5:2 C#6:2 E6:4 A6:4 | B5:2 D6:2 G6:2 F#6:2 E6:2 D6:2 B5:4 | C#6:2 E6:2 A5:2 E6:2 G6:8',
      li: 'sq2', lv: 0.12, lg: 0.85,
      bp: 'r-o-r-o-r-o-r-o-', bi: 'slapb', bv: 0.25,
      ap: '..c...c...c...c.', ai: 'stab', av: 0.03, ao: 62,
      pd: 'c-------c-------', pi: 'strings', pv: 0.03, po: 57,
      dr: [FOUR, CLAP, OFFO, H16, X(4)], dv: 0.45
    },
    // Credits: warm, triumphant, reunited. F major house-pop with piano
    credits: {
      bpm: 110, bars: 16, rv: 0.3, pump: 0.25,
      ch: 'F C Dm Bb F C Bb C Dm Am Bb F Gm C Bb,C F',
      ld: 'A4:4 C5:4 F5:6 E5:2 | E5:4 D5:2 C5:2 G4:8 | F5:6 E5:2 D5:4 A4:4 | Bb4:4 D5:4 F5:8 |' +
          'A5:6 G5:2 F5:4 C5:4 | G5:6 F5:2 E5:4 C5:4 | D5:4 F5:4 Bb5:4 A5:4 | G5:12 .:4 |' +
          'F5:4 A5:4 D6:6 C6:2 | C6:6 A5:2 E5:8 | D6:6 C6:2 Bb5:4 F5:4 | A5:12 C6:4 |' +
          'Bb5:6 A5:2 G5:4 D5:4 | E5:4 G5:4 C6:4 E6:4 | D6:4 C6:4 Bb5:4 E5:4 | F5:12 .:4',
      li: 'saw2', lv: 0.14, hx: 0.06,
      bp: 'r-.r..o-r-.r..o-', bi: 'sawb', bv: 0.25,
      ap: 'c..c..c...c..c..', ai: 'piano', av: 0.04, ao: 60,
      pd: 'c---------------', pi: 'pad', pv: 0.03, po: 53,
      dr: [FOUR, CLAP, OFFO, H16, X(8)], dv: 0.45,
      fill: [FOUR, '....c...c.c.cccc', '..o...o.........'], fe: 8
    },
    // Secret: mysterious night-desert ambience. D minor-major / augmented colours
    secret: {
      bpm: 90, bars: 8, rv: 0.55, dl: 0.4,
      ch: 'DmM7 Bbaug Gm6 A7 DmM7 Ebmaj7 Gm6 A7',
      ld: 'C#6:6 A5:2 F5:8 | F#5:4 A#5:4 D6:8 | E6:6 D6:2 Bb5:8 | G5:4 E5:4 C#5:8 |' +
          'D5:4 F5:4 A5:4 C#6:4 | D6:6 Bb5:2 G5:8 | E5:4 G5:4 Bb5:4 D6:4 | C#6:12 .:4',
      li: 'bell', lv: 0.13,
      ap: '0.1.2.3.4.3.2.1.', ai: 'glass', av: 0.035, ao: 62,
      pd: 'c---------------', pi: 'pad', pv: 0.04, po: 50,
      bp: 'r---------f-----', bi: 'sub', bv: 0.25,
      dr: ['d.......d..b....', '....n.......n.n.'], dv: 0.35
    },
    // Glitch -> "Trip Dimension": psychedelic, wobbly, half-time
    glitch: {
      bpm: 100, bars: 8, rv: 0.4, dl: 0.35, wr: 2,
      ch: 'Em7 Fmaj7 Em7 Dadd9 Cmaj7 Bm7 Am7 Bsus4',
      ld: 'B4:4 E5:4 G5:4 F#5:4 | E5:12 C5:4 | D5:4 E5:4 G5:4 B5:4 | A5:6 F#5:2 E5:8 |' +
          'G5:4 B5:4 E6:6 D6:2 | D6:4 B5:4 F#5:8 | E5:4 G5:4 C6:4 B5:4 | E5:8 F#5:8',
      li: 'wobl', lv: 0.13,
      bp: 'r-------r-----o-', bi: 'wob', bv: 0.22,
      ap: '0.2.1.3.2.4.3.5.', ai: 'glass', av: 0.035, ao: 64,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 52,
      dr: ['k.........k.....', '........S.......', 'h.h.h.h.hhh.h.h.', 'z.......z...z...', 'u.....u.......u.'], dv: 0.42
    },
    // Story cutscenes: whimsical but urgent. G minor, ticking clock
    story: {
      bpm: 132, bars: 8, rv: 0.25,
      ch: 'Gm D Gm D Eb Bb Cm D',
      ld: 'G5:2 A5:2 Bb5:2 G5:2 D6:4 Bb5:4 | A5:2 F#5:2 D5:2 F#5:2 A5:4 .:4 | Bb5:2 C6:2 D6:2 Bb5:2 G6:4 D6:4 | C6:2 A5:2 F#5:2 A5:2 D5:4 .:4 |' +
          'G5:2 Bb5:2 Eb6:4 D6:2 C6:2 Bb5:4 | F5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:4 | G5:2 Eb5:2 C5:2 Eb5:2 G5:2 C6:2 Eb6:4 | D6:2 .:2 D5:2 .:2 F#5:2 A5:2 C6:4',
      li: 'sq2', lv: 0.12, lg: 0.55,
      bp: 'r.r.f.r.o.r.f.r.', bi: 'pluckb', bv: 0.3,
      ap: '0.1.2.1.', ai: 'pluck', av: 0.035, ao: 55,
      dr: [FOUR, '..h...h...h...h.', '....s.......s...', 'l.l.l.l.l.l.l.l.'], dv: 0.38
    },
    // Ending: reunion with Chinka as the Man burns. 8 tender bars, then the drop into celebration
    ending: {
      bpm: 120, bars: 16, rv: 0.35, dl: 0.12, pump: 0.4,
      ch: 'Cm Ab Eb Bb Cm Ab Fm Bb Eb Bb Cm Ab Eb Bb Ab,Bb Eb',
      ld: 'G5:6 F5:2 Eb5:4 C5:4 | C5:4 Eb5:4 Ab5:8 | G5:6 Bb5:2 Eb6:8 | D6:8 C6:4 Bb5:4 |' +
          'C6:6 Bb5:2 G5:4 Eb5:4 | Eb5:4 Ab5:4 C6:8 | Ab5:4 G5:4 F5:4 C5:4 | D5:4 F5:4 Bb5:4 D6:4 |' +
          'Eb6:3 Eb6:3 D6:2 Bb5:4 G5:4 | F5:3 F5:3 G5:2 Bb5:8 | C6:3 C6:3 D6:2 Eb6:4 G6:4 | F6:6 Eb6:2 C6:8 |' +
          'G6:3 F6:3 Eb6:2 Bb5:4 G5:4 | F6:3 Eb6:3 D6:2 Bb5:8 | C6:4 Eb6:4 D6:4 F6:4 | Eb6:12 .:4',
      li: 'saw2', lv: 0.13, hx: 0.05,
      ap: rp('0.1.2.1.', 16) + rp('c..c..c...c..c..', 8), ai: 'piano', av: 0.04, ao: 55,
      pd: 'c---------------', pi: 'pad', pv: 0.04, po: 51,
      bp: rp('r---------------', 8) + rp('..r-..r-..r-..o-', 8), bi: 'sawb', bv: 0.25,
      dr: [dots(64) + rp('k...............', 3) + 'k.......k.k.k.kk' + rp(FOUR, 8), dots(128) + rp(CLAP, 8),
        dots(128) + rp(OFFO, 8), dots(128) + rp(H16, 8), dots(112) + 's.s.s.s.ssssSSSS' + dots(128),
        dots(128) + 'x' + dots(127)], dv: 0.45
    },
    // Sloth: riding Slothy. Super chill, lazy one-drop shuffle, bassoon-ish reed
    sloth: {
      bpm: 78, bars: 8, rv: 0.3, dl: 0.3, sw8: 0.45,
      ch: 'F Dm Bb C F Dm Gm,C F',
      ld: 'C5:4 .:2 A4:2 F4:8 | .:4 D5:2 E5:2 F5:6 .:2 | D5:6 C5:2 Bb4:8 | .:4 E5:2 F5:2 G5:4 E5:4 |' +
          'A5:6 G5:2 F5:4 C5:4 | .:2 D5:2 F5:2 A5:2 G5:6 F5:2 | Bb4:4 D5:4 E5:4 G5:4 | F5:4 E5:2 F5:2 .:8',
      li: 'reed', lv: 0.14,
      bp: 'r-----..r-..f-..', bi: 'sub', bv: 0.3,
      ap: '....c.......c...', ai: 'stab', av: 0.04, ao: 60,
      dr: ['........k.......', '........r.......', 'h.h.h.h.h.h.h.h.', '......b.....b...'], dv: 0.4
    },
    // Trip: psychedelic mushroom moment (short loop), drifting maj7 chords
    trip: {
      bpm: 90, bars: 4, rv: 0.5, dl: 0.4, wr: 1,
      ch: 'Cmaj7 Dbmaj7 Bbmaj7 Dbmaj7',
      ld: 'E5:4 G5:4 B5:8 | C6:8 Ab5:4 F5:4 | D6:6 A5:2 F5:8 | Ab5:4 C6:4 F6:8',
      li: 'wobl', lv: 0.13,
      ap: '0123432101234321', ai: 'glass', av: 0.03, ao: 64,
      pd: 'c---------------', pi: 'pad', pv: 0.04, po: 52,
      bp: 'r---------------', bi: 'wob', bv: 0.2,
      dr: ['k.......k.......', '....n...n.u.n...', 'u..u..u.....u...'], dv: 0.35
    },
    // Black Rock City overworld: mellow, exploratory, night. E minor 9ths
    brcmap: {
      bpm: 92, bars: 8, rv: 0.45, dl: 0.3,
      ch: 'Em9 Cmaj9 Am7 Bm7 Em9 Cmaj9 Am7 B7sus4',
      ld: 'F#5:4 G5:4 B5:8 | D6:6 B5:2 G5:8 | E5:4 G5:4 C6:4 B5:4 | A5:12 .:4 |' +
          'B5:4 D6:4 F#6:8 | E6:6 D6:2 B5:8 | C6:4 B5:4 A5:4 E5:4 | E5:8 F#5:4 A5:4',
      li: 'ep', lv: 0.12,
      ap: '0.2.1.3.2.4.3.1.', ai: 'pluck', av: 0.035, ao: 55,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 52,
      bp: 'r-----r-....f-..', bi: 'sub', bv: 0.28,
      dr: ['k.......k.......', '....r.......r...', '..h...h...h...h.', 'n.n.n.n.n.n.n.n.'], dv: 0.35
    }
  });
  TRACKS.buzzkill = TRACKS.final;

  Object.assign(TRACKS, {
    // Kart menu: bright house loop
    kart_menu: {
      bpm: 128, bars: 8, rv: 0.2, pump: 0.4,
      ch: 'Bb F Gm Eb Bb F Eb F',
      ld: 'D5:2 F5:2 Bb5:2 D6:2 C6:4 Bb5:4 | A5:2 C6:2 F6:4 E6:2 C6:2 A5:4 | Bb5:2 D6:2 G6:4 F6:2 D6:2 Bb5:4 | G5:4 Bb5:4 Eb6:8 |' +
          'F6:2 D6:2 Bb5:2 F5:2 D6:4 Bb5:4 | C6:2 A5:2 F5:2 C6:2 A5:4 F5:4 | G5:2 Bb5:2 Eb6:2 G6:2 F6:4 Eb6:4 | C6:4 A5:4 F5:8',
      li: 'sq2', lv: 0.12,
      bp: '..r-..r-..r-..r-', bi: 'sawb', bv: 0.26,
      ap: 'c..c..c...c..c..', ai: 'stab', av: 0.035, ao: 60,
      dr: [FOUR, CLAP, OFFO, H16], dv: 0.45
    },
    // Kart 1: piano house racer. F minor
    kart1: {
      bpm: 128, bars: 16, rv: 0.2, pump: 0.45,
      ch: 'Fm Db Ab Eb Fm Db Bbm C Db Eb Fm Fm Db Eb C C',
      ld: 'C6:2 Ab5:2 F5:2 Ab5:2 C6:3 Eb6:3 C6:2 | Db6:3 C6:3 Ab5:2 F5:8 | Eb6:2 C6:2 Ab5:2 C6:2 Eb6:3 Ab6:3 Eb6:2 | G6:3 F6:3 Eb6:2 Bb5:8 |' +
          'C6:2 Ab5:2 F5:2 Ab5:2 C6:3 F6:3 C6:2 | F6:3 Eb6:3 Db6:2 Ab5:8 | Db6:3 C6:3 Bb5:2 F5:4 Bb5:4 | E6:6 C6:2 G5:4 E5:4 |' +
          'Ab5:4 F5:4 Db6:8 | Bb5:4 G5:4 Eb6:8 | C6:3 Ab5:3 F5:2 C6:3 Eb6:3 F6:2 | Ab5:4 G5:4 F5:4 C6:4 |' +
          'F5:2 Ab5:2 Db6:2 F6:2 Eb6:4 Db6:4 | G5:2 Bb5:2 Eb6:2 G6:2 F6:4 Eb6:4 | E6:4 C6:4 G5:4 E5:4 | G5:2 C6:2 E6:2 G6:2 E6:2 C6:2 G5:4',
      li: 'saw2', lv: 0.13,
      bp: '..r-..r-..r-..o-', bi: 'sawb', bv: 0.26,
      ap: 'c..c..c...c..c..', ai: 'piano', av: 0.04, ao: 60,
      dr: [FOUR, CLAP, OFFO, H16, X(8)], dv: 0.47,
      fill: [FOUR, '....c...c.c.cccc', '..o...o...o.....'], fe: 8
    },
    // Kart 2: liquid drum & bass. D minor, reese bass
    kart2: {
      bpm: 172, bars: 16, rv: 0.22,
      ch: 'Dm Bb Gm A Dm Bb C A Bb C Dm Dm Gm Bb A A',
      ld: 'A5:8 F5:4 D5:4 | D6:8 C6:4 Bb5:4 | Bb5:6 A5:2 G5:8 | C#6:8 E6:8 |' +
          'F6:6 E6:2 D6:8 | F6:6 D6:2 Bb5:8 | E6:6 G6:2 C6:8 | C#6:12 E6:4 |' +
          'D6:4 F6:4 Bb5:8 | E6:4 G6:4 C6:8 | A5:6 D6:2 F6:8 | E6:6 D6:2 A5:8 |' +
          'G5:4 Bb5:4 D6:8 | F6:6 D6:2 Bb5:8 | A5:4 C#6:4 E6:4 G6:4 | E6:12 .:4',
      li: 'saw2', lv: 0.12,
      bp: 'r-------r---r---', bi: 'reese', bv: 0.24,
      ap: '0...1...2...1...', ai: 'glass', av: 0.035, ao: 62,
      pd: 'c---------------', pi: 'pad', pv: 0.03, po: 50,
      dr: ['k.........k.....k.........k..k..', '....S.......S...', 'h.h.h.h.h.h.h.h.', '.......g.....g..', X(8)], dv: 0.48
    },
    // Kart 3: synthwave night drive. C minor
    kart3: {
      bpm: 118, bars: 16, rv: 0.3, dl: 0.2,
      ch: 'Cm Ab Eb Bb Cm Ab Fm G Ab Bb Cm Cm Ab Bb G G',
      ld: 'G5:6 C6:2 Eb6:8 | Eb6:4 C6:4 Ab5:4 C6:4 | Bb5:6 G5:2 Eb5:8 | D6:6 C6:2 Bb5:4 F5:4 |' +
          'G5:6 C6:2 G6:8 | F6:4 Eb6:4 C6:4 Ab5:4 | Ab5:6 C6:2 F6:4 Eb6:4 | D6:12 B5:4 |' +
          'C6:8 Eb6:4 Ab5:4 | D6:8 F6:4 Bb5:4 | Eb6:6 D6:2 C6:4 G5:4 | C6:12 .:4 |' +
          'Ab5:4 C6:4 Eb6:4 G6:4 | F6:6 D6:2 Bb5:8 | B5:4 D6:4 G6:4 F6:4 | D6:8 B5:4 G5:4',
      li: 'saw2', lv: 0.13,
      bp: 'rrororrorrororro', bi: 'sawb', bv: 0.22,
      ap: '0123012301230123', ai: 'pulse', av: 0.035, ao: 55,
      pd: 'c---------------', pi: 'pad', pv: 0.03, po: 51,
      dr: ['k.......k.......', '....S.......S...', 'h.h.h.h.h.h.h.h.', X(8)], dv: 0.47
    },
    // Kart 4: funk racer. A dorian, slap bass, clav stabs, cowbell
    kart4: {
      bpm: 112, bars: 16, rv: 0.15, sw: 0.08,
      ch: 'Am7 D7 Am7 D7 Am7 D7 Fmaj7 E7 Dm7 G7 Cmaj7 Fmaj7 Bm7b5 E7 Am7 E7',
      ld: '.:2 E5:1 G5:1 A5:2 .:2 C6:2 A5:1 G5:1 A5:4 | .:4 F#5:2 A5:2 C6:3 B5:1 A5:4 | .:2 E5:1 G5:1 A5:2 .:2 E6:2 D6:1 C6:1 A5:4 | .:2 D6:2 C6:2 A5:2 F#5:4 D5:4 |' +
          'A5:3 G5:1 E5:2 .:2 G5:2 .:2 A5:4 | .:2 A5:2 C6:2 D6:2 F#6:2 .:2 D6:4 | E6:3 C6:1 A5:4 .:2 C6:2 F5:4 | G#5:2 B5:2 D6:2 E6:2 .:4 B5:4 |' +
          '.:2 F5:2 A5:2 C6:2 D6:3 C6:1 A5:4 | .:2 B5:2 D6:2 F6:2 G6:4 F6:2 D6:2 | E6:3 D6:1 C6:2 G5:2 B5:4 .:4 | A5:2 C6:2 E6:2 F6:2 .:2 E6:2 C6:4 |' +
          'A5:2 A5:2 .:2 A5:2 D6:4 F6:4 | G#5:2 G#5:2 .:2 G#5:2 B5:4 D6:4 | C6:3 A5:1 G5:4 E5:4 C5:4 | B4:4 D5:4 E5:4 G#5:4',
      li: 'brass', lv: 0.13,
      bp: 'r.or..r.o.r..or.', bi: 'slapb', bv: 0.27,
      ap: '.c.c..c..c.c..c.', ai: 'stab', av: 0.03, ao: 57,
      dr: ['k.....k...k.k...', '....S..g.g..S..g', H16, '..o.......o.....', 'w.......w...w...'], dv: 0.45
    },
    // Kart results: celebratory short loop. C major
    kart_results: {
      bpm: 110, bars: 8, rv: 0.25, pump: 0.25,
      ch: 'C Am F G C Am Dm7,G C',
      ld: 'E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 | A5:4 C6:2 E6:2 D6:4 C6:4 | A5:2 C6:2 F6:4 E6:2 C6:2 A5:4 | B5:6 D6:2 G5:8 |' +
          'G5:2 C6:2 E6:4 D6:2 C6:2 G5:4 | E6:4 C6:2 A5:2 C6:4 E6:4 | F6:4 D6:4 B5:4 D6:4 | C6:12 .:4',
      li: 'sq2', lv: 0.12,
      bp: 'r-o-r-o-r-o-r-o-', bi: 'slapb', bv: 0.25,
      ap: 'c..c..c...c..c..', ai: 'piano', av: 0.035, ao: 60,
      dr: [FOUR, CLAP, OFFO], dv: 0.42
    },

    // ---- "Brady-O Classic" 8-bit set: pulse / triangle / noise only, dry ----
    retro_over: {
      bpm: 140, bars: 16, retro: true,
      ch: 'C Em F G C Em F,G C Am Em F C Dm G Em,Am Dm,G',
      ld: 'G4:2 C5:2 E5:2 G5:2 .:2 E5:2 G5:4 | B4:2 E5:2 G5:2 B5:2 .:2 G5:2 E5:4 | A5:2 G5:2 F5:2 C5:2 .:2 F5:2 A5:4 | G5:4 D5:2 B4:2 G4:8 |' +
          'C6:2 B5:2 C6:2 G5:2 .:2 E5:2 C5:4 | D5:2 E5:2 G5:2 B5:2 .:2 A5:2 G5:4 | A5:2 C6:2 A5:2 F5:2 G5:2 B5:2 D6:4 | C6:8 .:8 |' +
          'E5:3 A5:3 C6:2 B5:4 A5:4 | G5:3 E5:3 B4:2 E5:8 | F5:3 A5:3 C6:2 F6:4 E6:4 | E6:6 D6:2 C6:8 |' +
          'D6:3 C6:3 A5:2 F5:4 A5:4 | B5:3 A5:3 G5:2 D5:8 | E5:2 G5:2 B5:2 E6:2 C6:2 A5:2 E5:4 | F5:2 A5:2 D6:2 F6:2 D6:2 B5:2 G5:4',
      li: 'c25v', lv: 0.075,
      bp: 'r.o.f.o.r.o.f.o.', bi: 'ctri', bv: 0.3,
      ap: '0.1.2.1.0.1.2.1.', ai: 'c12', av: 0.03, ao: 60,
      dr: ['k...s...k.k.s...', 'h.h.h.h.h.h.h.h.'], dv: 0.4
    },
    retro_under: {
      bpm: 112, bars: 8, retro: true,
      ch: 'Em Em C B Em Em Am B',
      ld: '.:8 B5:2 .:6 | .:4 G5:2 .:2 E5:2 .:6 | .:8 C6:2 .:2 G5:4 | F#5:4 .:12 |' +
          '.:8 E6:2 .:2 B5:2 .:2 | .:4 D6:2 .:2 B5:4 .:4 | .:8 C6:2 .:2 A5:4 | D#5:8 .:8',
      li: 'c12', lv: 0.07,
      bp: 'r.r.t.f.o.f.t.r.', bi: 'ctri', bv: 0.32,
      dr: ['k.......k.......', '....h.......h...'], dv: 0.35
    },
    retro_sky: {
      bpm: 116, spb: 3, bars: 8, retro: true,
      ch: 'F Dm Bb C F Dm Bb,C F',
      ld: 'C5:2 F5:1 A5:3 C6:2 A5:1 F5:3 | D5:2 F5:1 A5:3 D6:3 .:3 | D6:2 C6:1 Bb5:3 F5:2 G5:1 A5:3 | G5:6 E5:3 C5:3 |' +
          'F5:2 A5:1 C6:3 F6:3 E6:3 | D6:2 C6:1 A5:3 F5:3 A5:3 | Bb5:3 D6:3 C6:2 E6:1 G6:3 | F6:6 .:6',
      li: 'c25v', lv: 0.075,
      bp: 'r..f..o..f..', bi: 'ctri', bv: 0.3,
      ap: '0.1.2.0.1.2.', ai: 'c12', av: 0.028, ao: 60,
      dr: ['k..h.hs..h.h'], dv: 0.4
    },
    retro_castle: {
      bpm: 150, bars: 8, retro: true,
      ch: 'Dm Dm Bb A Dm Dm Gm A',
      ld: 'D5:1 E5:1 F5:1 E5:1 D5:1 E5:1 F5:1 G5:1 A5:4 F5:4 | D6:2 C#6:2 D6:2 A5:2 F5:4 D5:4 | Bb4:1 C5:1 D5:1 C5:1 Bb4:1 C5:1 D5:1 F5:1 Bb5:4 F5:4 | A5:2 G#5:2 A5:2 E5:2 C#5:4 A4:4 |' +
          'F5:1 G5:1 A5:1 G5:1 F5:1 G5:1 A5:1 Bb5:1 D6:4 A5:4 | F6:2 E6:2 D6:2 A5:2 F5:4 D5:4 | G5:1 A5:1 Bb5:1 A5:1 G5:1 A5:1 Bb5:1 D6:1 G6:4 D6:4 | E6:2 C#6:2 A5:2 G5:2 E5:2 C#5:2 A4:4',
      li: 'c25', lv: 0.07,
      bp: 'r.r.r.r.r.r.r.r.', bi: 'ctri', bv: 0.3,
      dr: ['k.k...k.k.k...k.', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.38
    },
    retro_boss: {
      bpm: 168, bars: 8, retro: true,
      ch: 'Em Em C D Em Em C B',
      ld: 'E5:2 E5:2 G5:2 E5:2 B5:2 E5:2 A#5:2 B5:2 | G5:2 F#5:2 E5:2 D5:2 E5:8 | C5:2 C5:2 E5:2 C5:2 G5:2 C5:2 F#5:2 G5:2 | A5:2 G5:2 F#5:2 E5:2 D5:8 |' +
          'E6:2 D6:2 B5:2 G5:2 E6:2 D6:2 B5:2 G5:2 | F#6:2 E6:2 D#6:2 E6:2 B5:8 | G6:2 F#6:2 E6:2 C6:2 G6:2 F#6:2 E6:2 C6:2 | B5:4 D#6:4 F#6:8',
      li: 'c25', lv: 0.07,
      bp: 'r.o.r.o.r.o.r.o.', bi: 'ctri', bv: 0.3,
      ap: '0.1.2.1.', ai: 'c12', av: 0.025, ao: 52,
      dr: ['k.k.k.k.k.k.k.k.', '....s.......s.s.', 'h.h.h.h.h.h.h.h.'], dv: 0.38
    },
    retro_title: {
      bpm: 128, bars: 8, retro: true,
      ch: 'D G A D Bm G Em,A D',
      ld: 'A4:2 D5:2 F#5:2 A5:6 F#5:2 A5:2 | B5:6 A5:2 G5:4 D5:4 | C#5:2 E5:2 A5:2 C#6:6 B5:2 A5:2 | D6:12 .:4 |' +
          'F#5:4 B5:4 D6:4 B5:4 | G5:6 B5:2 D6:8 | E6:4 D6:4 C#6:4 A5:4 | D6:8 A5:4 F#5:4',
      li: 'c25v', lv: 0.075,
      bp: 'r...r.o.r...r.o.', bi: 'ctri', bv: 0.3,
      ap: '0.1.2.1.0.1.2.1.', ai: 'c12', av: 0.028, ao: 62,
      dr: ['k...s...k.k.s...', 'h.h.h.h.h.h.h.h.'], dv: 0.38
    },
    retro_clear: {   // ~3.2 s, plays once
      bpm: 150, bars: 2, retro: true, loop: false,
      ch: 'C,F G,C',
      ld: 'G4:2 C5:2 E5:2 G5:2 A5:2 C6:2 F5:2 A5:2 | B5:2 D6:2 G5:2 B5:2 C6:6 .:2',
      li: 'c25', lv: 0.08, hx: 0.04, hi: 'c12',
      bp: 'r.r.r.r.r.r.r.r.r.r.r.r.r-----..', bi: 'ctri', bv: 0.3,
      dr: ['k...k...k...k...k...k...k.......', 'h.h.h.h.h.h.h.h.s.s.s.s.x.......'], dv: 0.38
    },
    retro_die: {     // ~1.6 s, plays once
      bpm: 150, bars: 1, retro: true, loop: false,
      ch: 'Dm,A,Dm,Dm',
      ld: 'A5:1 F5:1 D5:2 .:2 G5:1 E5:1 C#5:2 D5:2 A4:2 D4:2',
      li: 'c25', lv: 0.08,
      bp: 'r.......r...r---', bi: 'ctri', bv: 0.3
    },

    // Level clear fanfare (~3.3 s, plays once)
    clear: {
      bpm: 150, bars: 2, rv: 0.3, loop: false,
      ch: 'C,F G,C',
      ld: 'G4:2 C5:2 E5:2 G5:4 E5:2 A5:4 | B5:2 A5:2 G5:2 D6:2 C6:8',
      li: 'saw2', lv: 0.16, hx: 0.08,
      bp: 'r-..r-..r-..r-..r-..r-..r-------', bi: 'sawb', bv: 0.26,
      ap: 'c-..c-..c-..c-..c-..c-..c-------', ai: 'pulse', av: 0.06, ao: 60,
      dr: ['k...k...k...k...k...k...K.......', '....s...s.s.s.s.s...s...........', 'x' + dots(23) + 'x' + dots(7)], dv: 0.45
    },
    // Game over (~2.5 s, plays once)
    gameover: {
      bpm: 96, bars: 1, rv: 0.35, loop: false,
      ch: 'Dm,Gm,A,Dm',
      ld: 'A4:2 G4:2 F4:2 E4:2 D4:2 E4:1 C#4:1 D4:4',
      li: 'sq2', lv: 0.15,
      bp: 'r---r---r---r---', bi: 'sub', bv: 0.3,
      pd: 'c---c---c---c---', pi: 'pad', pv: 0.06, po: 50
    }
  });

  // ---------------------------------------------------- BRADY-O BURNS (3D) --
  Object.assign(TRACKS, {
    // World select on the playa: warm and hopeful. G major 7ths
    burns_hub: {
      bpm: 98, bars: 8, rv: 0.35, dl: 0.15, sw: 0.1,
      ch: 'Gmaj7 Bm7 Cmaj7 D Gmaj7 Em7 Am7 D7sus4',
      ld: 'B4:4 D5:4 F#5:4 G5:4 | A5:6 F#5:2 D5:8 | E5:4 G5:4 B5:6 A5:2 | F#5:12 .:4 |' +
          'G5:4 B5:4 D6:6 B5:2 | B5:4 G5:4 E5:8 | C6:4 B5:4 A5:4 G5:4 | A5:8 G5:4 .:4',
      li: 'whistle', lv: 0.13,
      bp: 'r---..r-f---..o-', bi: 'sub', bv: 0.28,
      ap: 'c---..c-..c-....', ai: 'ep', av: 0.06, ao: 55,
      dr: ['k.......k..k....', '....r.......r...', '..h...h...h...h.', 'n.n.n.n.n.n.n.n.'], dv: 0.38
    },
    // Story intro: 8 romantic bars (piano, Eb major), then the Man takes Chinka (C minor, low brass, timpani)
    burns_intro: {
      bpm: 84, bars: 16, rv: 0.45, dl: 0.15,
      ch: 'Eb Cm Ab Bb Eb Cm Fm7 Bb Cm Cm Ab G Cm Db Ab G',
      ld: 'G5:4 Bb5:4 Eb6:6 D6:2 | C6:6 Bb5:2 G5:8 | Ab5:4 C6:4 Eb6:4 C6:4 | D6:12 .:4 |' +
          'Eb6:4 D6:2 C6:2 Bb5:4 G5:4 | G5:4 C6:4 Eb6:8 | F6:4 Eb6:4 C6:4 Ab5:4 | Bb5:12 .:4 | ' + rp('.:16 | ', 7) + '.:16',
      li: 'piano', lv: 0.17,
      l2: rp('.:16 | ', 8) + 'C4:8 Eb4:4 D4:4 | G3:12 .:4 | Ab3:8 C4:4 Eb4:4 | D4:8 B3:8 | C4:4 Eb4:4 G4:8 | F4:6 Eb4:2 Db4:8 | C4:8 Eb4:4 Ab4:4 | G4:4 F4:4 D4:4 B3:4',
      l2i: 'brass', l2v: 0.16,
      ap: rp('0.1.2.1.', 16) + dots(128), ai: 'piano', av: 0.035, ao: 55,
      pd: 'c---------------', pi: 'strings', pv: 0.035, po: 50,
      bp: rp('r---------------', 8) + rp('r-r-r-r-r-r-r-r-', 8), bi: 'sub', bv: 0.28,
      dr: [dots(128) + rp('t.......t...t...', 7) + 't.t.t.t.tttTTTTT', dots(128) + 'x' + dots(127)], dv: 0.45
    },
    // W1 The Line / Gate Road: dusty shuffle, harmonica-ish reed, honky-tonk piano, boogie bass, honks
    burns_w1: {
      bpm: 116, bars: 16, rv: 0.25, sw8: 0.35,
      ch: 'A D A E A D E A D D A F#m Bm E A E',
      ld: 'E5:2 A5:2 C#6:4 B5:2 A5:2 E5:4 | F#5:4 A5:2 F#5:2 D5:8 | C#5:2 E5:2 A5:4 C#6:2 B5:2 A5:4 | B5:6 G#5:2 E5:8 |' +
          'A5:2 C#6:2 E6:4 C#6:2 A5:2 E5:4 | D6:4 C#6:2 A5:2 F#5:4 A5:4 | G#5:4 B5:4 E6:4 D6:4 | C#6:12 .:4 |' +
          'A5:4 D6:4 F#6:6 E6:2 | D6:4 A5:4 F#5:8 | E5:2 A5:2 C#6:2 E6:2 C#6:4 A5:4 | A5:6 G#5:2 F#5:8 |' +
          'B5:4 D6:4 F#6:4 D6:4 | E6:6 D6:2 B5:8 | C#6:4 B5:2 A5:2 E5:4 C#5:4 | B4:4 D5:4 E5:4 G#5:4',
      li: 'reed', lv: 0.14,
      bp: 'r.t.f.x.s.x.f.t.', bi: 'pluckb', bv: 0.3,
      ap: '..c-..c-..c-..c-', ai: 'honky', av: 0.04, ao: 60,
      dr: ['k.......k.k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.', dots(124) + 'e.e.', X(8)], dv: 0.42
    },
    // W2 Finding Camp: the city at night, fire spinners, tribal drums and bass. D minor
    burns_w2: {
      bpm: 110, bars: 16, rv: 0.35, dl: 0.2,
      ch: 'Dm Dm Bb C Dm Dm Bb A Gm Gm Dm Dm Bb C A A',
      ld: 'D5:6 F5:2 A5:4 G5:4 | F5:4 E5:4 D5:8 | D5:4 F5:4 Bb5:6 A5:2 | G5:6 E5:2 C5:8 |' +
          'A5:6 C6:2 D6:4 C6:4 | A5:4 G5:4 F5:8 | F5:4 G5:4 A5:4 Bb5:4 | A5:8 C#6:4 E6:4 |' +
          'D6:6 Bb5:2 G5:8 | A5:4 Bb5:4 D6:8 | F6:6 E6:2 D6:8 | A5:4 F5:4 D5:8 |' +
          'D6:4 C6:4 Bb5:4 F5:4 | E6:6 D6:2 C6:8 | C#6:4 E6:4 A5:8 | E5:4 G5:4 A5:8',
      li: 'vox', lv: 0.13,
      bp: 'r..r..r.r..r..o.', bi: 'sub', bv: 0.3,
      pd: 'c---------------', pi: 'pad', pv: 0.03, po: 50,
      dr: ['k.....k...k.....', 't..m..t.t..m.m..', 'b.bb.b.bb.b.bb.b', 'f' + dots(31)], dv: 0.42
    },
    // W3 Costume Cult & the Yellow Bike: glam cabaret disco. D minor, stomp + brass + strings
    burns_w3: {
      bpm: 124, bars: 16, rv: 0.25, pump: 0.2,
      ch: 'Dm Dm Gm A Dm Dm Bb A Gm C F Bb Gm A Dm A',
      ld: 'A4:2 D5:2 F5:2 A5:2 G5:3 F5:1 E5:4 | F5:3 E5:1 D5:4 A4:8 | Bb4:2 D5:2 G5:2 Bb5:2 A5:3 G5:1 F5:4 | E5:4 C#5:4 A4:4 .:4 |' +
          'D6:2 C6:2 A5:2 F5:2 A5:3 G5:1 F5:4 | E5:3 F5:1 G5:4 A5:8 | Bb5:2 A5:2 G5:2 F5:2 D5:4 F5:4 | E5:2 G5:2 C#6:4 A5:8 |' +
          'G5:6 A5:2 Bb5:8 | C6:6 Bb5:2 G5:8 | A5:4 C6:4 F6:8 | D6:6 C6:2 Bb5:8 |' +
          'Bb5:4 A5:2 G5:2 D6:4 Bb5:4 | C#6:4 E6:4 G6:4 E6:4 | F6:4 E6:2 D6:2 A5:4 F5:4 | E5:2 F5:2 G5:2 A5:2 C#6:8',
      li: 'brass', lv: 0.13, hx: 0.05,
      bp: 'r-o-r-o-r-o-r-o-', bi: 'slapb', bv: 0.25,
      ap: '..c-..c-..c-..c-', ai: 'honky', av: 0.035, ao: 60,
      pd: 'c---------------', pi: 'strings', pv: 0.03, po: 57,
      dr: [FOUR, CLAP, OFFO, H16, '....j.......j...', X(8)], dv: 0.45
    },
    // W4 The Orgy Dome: sleazy-but-tasteful lounge slow jam (12/8 feel). Eb, sax over Rhodes
    burns_w4: {
      bpm: 72, spb: 3, bars: 8, rv: 0.35, dl: 0.15,
      ch: 'Ebmaj7 Cm7 Fm7 Bb7 Gm7 C7 Fm7 Bb7',
      ld: 'G5:3 Bb5:2 D6:1 Eb6:6 | D6:2 C6:1 Bb5:3 G5:6 | Ab5:3 C6:2 Eb6:1 F6:3 Eb6:3 | D6:6 Ab5:3 F5:3 |' +
          'Bb5:3 D6:2 F6:7 | E6:3 D6:2 C6:1 Bb5:6 | Ab5:2 G5:1 F5:3 C6:3 Eb6:3 | D6:9 .:3',
      li: 'sax', lv: 0.14,
      bp: 'r..t..f..t..', bi: 'pluckb', bv: 0.3,
      ap: 'c-....c-....', ai: 'ep', av: 0.055, ao: 55,
      dr: ['k.....k..k..', '...c.....c..', 'h..h.hh..h.h'], dv: 0.38
    },
    // W5 Costco Soul Trading Co.: 8 bars of elevator muzak (vibes), then it turns into funk (horns, clav)
    burns_w5: {
      bpm: 104, bars: 16, rv: 0.25,
      ch: 'Cmaj7 Am7 Dm7 G7 Cmaj7 Am7 Dm7 G7 C7 C7 F7 F7 C7 C7 G7 F7',
      ld: 'E5:4 G5:4 B5:6 A5:2 | G5:6 E5:2 C5:8 | F5:4 A5:4 C6:6 B5:2 | A5:6 F5:2 D5:8 |' +
          'E5:2 F5:2 G5:4 C6:4 B5:4 | A5:6 G5:2 E5:8 | D5:4 F5:4 A5:4 C6:4 | B5:12 .:4 | ' + rp('.:16 | ', 7) + '.:16',
      li: 'vibes', lv: 0.13,
      l2: rp('.:16 | ', 8) +
          '.:2 G5:1 Bb5:1 C6:2 .:2 E6:2 C6:1 Bb5:1 C6:4 | .:4 G5:2 Bb5:2 E6:3 D6:1 C6:4 | .:2 C6:1 Eb6:1 F6:2 .:2 A5:2 C6:1 Eb6:1 F6:4 | .:4 Eb6:2 C6:2 A5:3 G5:1 F5:4 |' +
          'C6:2 C6:2 .:2 C6:2 E6:4 G6:4 | Bb5:2 Bb5:2 .:2 Bb5:2 G5:4 E5:4 | D6:3 B5:1 G5:4 F6:4 D6:4 | Eb6:2 C6:2 A5:2 F5:2 .:4 C6:4',
      l2i: 'brass', l2v: 0.14,
      bp: rp('r-----f-r-----f-', 8) + rp('r..ro..r.r..f.o.', 8), bi: 'slapb', bv: 0.27,
      ap: rp('c---..c-....c-..', 8) + dots(128), ai: 'ep', av: 0.05, ao: 57,
      a2: dots(128) + rp('.c.c..c..c.c..c.', 8), a2i: 'clav', a2v: 0.035, a2o: 60,
      dr: [rp('k.....k.k.....k.', 8) + rp('k.....k...k.k...', 8), rp('r..r..r...r..r..', 8) + rp('....S..g.g..S..g', 8),
        rp('n.n.n.n.n.n.n.n.', 8) + rp(H16, 8), dots(128) + rp('..o.......o.....', 8), dots(128) + 'x' + dots(127)], dv: 0.42
    },
    // W6 The Art Car Hunt: tribal techno with fire. F minor, acid bass, toms and flame bursts
    burns_w6: {
      bpm: 128, bars: 16, rv: 0.25, dl: 0.15, pump: 0.35,
      ch: 'Fm Fm Fm Eb Fm Fm Db Eb Fm Fm Fm Eb Db Db Eb Eb',
      ld: 'F5:2 .:1 F5:1 Ab5:2 .:2 C6:2 .:2 Bb5:2 Ab5:2 | G5:3 F5:3 C5:2 .:8 | F5:2 .:1 F5:1 Ab5:2 .:2 C6:2 .:2 Eb6:2 C6:2 | Bb5:3 G5:3 Eb5:2 .:8 |' +
          'F5:2 .:1 F5:1 Ab5:2 .:2 C6:2 .:2 Bb5:2 Ab5:2 | G5:3 Ab5:3 Bb5:2 C6:8 | Db6:3 C6:3 Ab5:2 F5:8 | G5:3 Bb5:3 Eb6:2 .:8 |' +
          'C6:4 Ab5:4 F5:4 Ab5:4 | C6:3 Db6:3 C6:2 Ab5:8 | F6:4 Eb6:4 C6:4 Ab5:4 | G5:6 Bb5:2 Eb6:8 |' +
          'F6:3 Eb6:3 Db6:2 Ab5:8 | F5:3 Ab5:3 Db6:2 F6:8 | G6:3 F6:3 Eb6:2 Bb5:8 | G5:4 Bb5:4 Eb6:4 G6:4',
      li: 'saw2', lv: 0.13,
      bp: 'R..r..r..R..r.o.', bi: 'acid', bv: 0.22,
      dr: [FOUR, 't..t..m...t..m..', 'b.b.bb.b.b.bb.b.', OFFO, 'f' + dots(63), X(8)], dv: 0.45
    },
    // W7 Sunrise Set: melodic deep house at dawn, euphoric. Ab major
    burns_w7: {
      bpm: 122, bars: 16, rv: 0.35, dl: 0.15, pump: 0.4,
      ch: 'Fm7 Dbmaj7 Abmaj7 Eb Fm7 Dbmaj7 Bbm7 Eb Dbmaj7 Eb Cm7 Fm7 Dbmaj7 Eb Abmaj7 Eb',
      ld: 'C6:3 Ab5:3 F5:2 Eb5:4 F5:4 | F5:3 Ab5:3 C6:2 Db6:8 | Eb6:3 C6:3 Ab5:2 G5:4 Ab5:4 | Bb5:12 G5:4 |' +
          'C6:3 Ab5:3 F5:2 Eb5:4 Ab5:4 | F6:3 Eb6:3 Db6:2 C6:8 | Db6:3 C6:3 Bb5:2 F5:4 Ab5:4 | G5:12 Bb5:4 |' +
          'Ab5:6 C6:2 F6:8 | G6:6 F6:2 Eb6:8 | Eb6:4 C6:4 G5:4 Bb5:4 | Ab5:6 G5:2 F5:8 |' +
          'F5:4 Ab5:4 C6:4 F6:4 | G6:6 F6:2 Eb6:4 Bb5:4 | C6:4 Eb6:4 G6:8 | F6:4 Eb6:4 Bb5:4 G5:4',
      li: 'ssaw', lv: 0.12, hx: 0.05,
      bp: '..r-..r-..r-..o-', bi: 'sub', bv: 0.3,
      ap: '0.2.1.3.0.2.1.3.', ai: 'pluck', av: 0.035, ao: 63,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 53,
      dr: [FOUR, CLAP, OFFO, H16, X(8)], dv: 0.45
    },
    // W8 Hell Station: industrial rock, clanking metal. E phrygian riff
    burns_w8: {
      bpm: 140, bars: 16, rv: 0.25,
      ch: 'Em Em F Em Em Em G F Am Am F G Em Em F B',
      ld: 'E4:2 E4:2 G4:2 E4:1 F4:1 .:2 E4:2 B4:2 A#4:2 | E4:2 E4:2 G4:2 A4:2 B4:4 .:4 | F4:2 F4:2 A4:2 F4:1 G4:1 .:2 F4:2 C5:2 B4:2 | E5:4 D5:2 B4:2 G4:4 F4:4 |' +
          'E4:2 E4:2 G4:2 E4:1 F4:1 .:2 E4:2 B4:2 A#4:2 | E4:2 E4:2 G4:2 A4:2 B4:2 D5:2 E5:4 | D5:3 B4:3 G4:2 F5:4 D5:4 | C5:4 A4:4 F4:4 E4:4 |' +
          'A4:3 C5:3 E5:2 A5:8 | G5:3 E5:3 C5:2 A4:8 | F5:3 A5:3 C6:2 B5:4 A5:4 | G5:6 B5:2 D6:8 |' +
          'E5:3 G5:3 B5:2 E6:8 | D6:3 B5:3 G5:2 E5:8 | F5:4 A5:4 C6:4 E6:4 | D#6:4 B5:4 F#5:4 D#5:4',
      li: 'gtr', lv: 0.12,
      ap: 'c-c-..c-c-..c-c.', ai: 'dist', av: 0.045, ao: 40,
      bp: 'r.r.r.r.r.r.r.r.', bi: 'sawb', bv: 0.24,
      dr: ['k.k...k.k.k...k.', '....S.......S...', 'a..a....a...a.a.', 'h.h.h.h.h.h.h.h.', X(8)], dv: 0.48,
      fill: ['k.k.k.k.k.k.k.k.', '....S...S.SSaaaa', 'a...a...a...a...'], fe: 8
    },
    // W9 Deep Playa Showdown: dark ambient techno in a dust storm. B minor, filters open across the loop
    burns_w9: {
      bpm: 124, bars: 16, rv: 0.45, dl: 0.25, pump: 0.3, bld: [0.4, 1.3],
      ch: 'Bm Bm G G Bm Bm Em F# Bm Bm G G Em Em F# F#',
      ld: 'F#5:8 D5:4 B4:4 | C#5:12 D5:4 | B4:8 D5:4 G5:4 | F#5:12 .:4 | B5:8 A5:4 F#5:4 | E5:12 F#5:4 | G5:8 E5:4 B4:4 | A#4:8 C#5:8 |' +
          'D6:8 B5:4 F#5:4 | A5:12 B5:4 | D6:8 B5:4 G5:4 | F#5:12 .:4 | E6:8 B5:4 G5:4 | F#5:12 G5:4 | A#5:8 C#6:8 | F#5:12 .:4',
      li: 'vox', lv: 0.12,
      bp: 'R..r..r..R..r.o.', bi: 'acid', bv: 0.2,
      ap: '0.2.4.0.2.5.', ai: 'pluck', av: 0.035, ao: 59,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 50,
      dr: [FOUR, '..h...h...h...h.', '....r.......r...', 'q' + dots(63), dots(128) + rp(CLAP, 8), X(16)], dv: 0.45
    },
    // W10 The Man Pavilion: epic approach, tension building (timpani, then snare, then hats)
    burns_w10: {
      bpm: 116, bars: 16, rv: 0.35, bld: [0.4, 1.4],
      ch: 'Cm Cm Ab Ab Fm Fm G G Cm Cm Ab Ab Db Db G G',
      ld: 'C5:8 Eb5:4 G5:4 | F5:6 Eb5:2 D5:8 | C5:8 Eb5:4 Ab5:4 | G5:12 .:4 | F5:8 Ab5:4 C6:4 | Bb5:6 Ab5:2 G5:8 | B4:4 D5:4 G5:4 F5:4 | D5:12 .:4 |' +
          'G5:8 C6:4 Eb6:4 | D6:6 C6:2 G5:8 | Eb6:8 C6:4 Ab5:4 | G5:12 Ab5:4 | F6:8 Db6:4 Ab5:4 | C6:6 Db6:2 F6:8 | D6:4 F6:4 B5:4 D6:4 | G6:12 .:4',
      li: 'brass', lv: 0.15, hx: 0.05,
      l2: rp('.:16 | ', 8) + 'Eb5:16 | D5:16 | C5:16 | Eb5:16 | F5:16 | Ab5:16 | G5:16 | B4:16', l2i: 'vox', l2v: 0.09,
      bp: 'r-r-r-r-r-r-r-r-', bi: 'sawb', bv: 0.24,
      ap: 'c-------c-------', ai: 'strings', av: 0.035, ao: 55,
      dr: ['k.......k.......', 't.......t...t...', dots(128) + rp('....s.......s...', 8), dots(192) + rp('h.h.h.h.h.h.h.h.', 4),
        dots(240) + 'tttmmmtttTTTTTTT', 'x' + dots(255)], dv: 0.45
    },
    // The Man boss fight: ominous and driving. G minor with a menacing Ab
    man_boss: {
      bpm: 136, bars: 16, rv: 0.25,
      ch: 'Gm Gm Ab Gm Gm Gm Eb D Cm Cm Ab Ab Gm Gm Ab D',
      ld: 'G4:2 G4:2 Bb4:2 G4:2 D5:4 C5:2 Bb4:2 | A4:2 Bb4:2 A4:2 G4:2 D4:8 | Ab4:2 Ab4:2 C5:2 Ab4:2 Eb5:4 D5:2 C5:2 | Bb4:2 C5:2 Bb4:2 A4:2 G4:8 |' +
          'G5:2 G5:2 Bb5:2 G5:2 D6:4 C6:2 Bb5:2 | A5:2 Bb5:2 C6:2 D6:2 G5:8 | G5:3 Bb5:3 Eb6:2 D6:4 Bb5:4 | F#5:4 A5:4 C6:4 D6:4 |' +
          'Eb6:6 D6:2 C6:8 | G5:4 C6:4 Eb6:8 | C6:6 Bb5:2 Ab5:8 | Eb6:4 C6:4 Ab5:8 |' +
          'D6:6 C6:2 Bb5:8 | G5:4 Bb5:4 D6:8 | Eb6:3 D6:3 C6:2 Ab5:8 | F#5:2 A5:2 C6:2 D6:2 F#6:8',
      li: 'saw2', lv: 0.13,
      ap: 'c--.c-c-c--.c-c-', ai: 'dist', av: 0.05, ao: 43,
      bp: 'r-r-r-r-r-r-r-r-', bi: 'reese', bv: 0.24,
      dr: ['k...k...k...k.k.', '....S.......S...', 'h.h.h.h.h.h.h.h.', 'a.......a.......', X(8)], dv: 0.48,
      fill: ['k...k...k...k.k.', '....S...S.SSmmtt', 'h.h.h.h.........'], fe: 8
    },
    // The giant Man phase: bigger, faster, desperate. A minor, Neapolitan Bb, buzzing lead
    man_giant: {
      bpm: 160, bars: 8, rv: 0.22,
      ch: 'Am Am F E Am Am Bb E',
      ld: 'A5:1 G#5:1 A5:1 C6:1 E6:2 A5:2 B5:1 A5:1 G#5:1 A5:1 E5:4 | C6:2 B5:2 A5:2 E6:2 D6:2 C6:2 B5:4 |' +
          'F5:1 E5:1 F5:1 A5:1 C6:2 F6:2 E6:2 C6:2 A5:4 | G#5:2 B5:2 E6:2 G#6:2 F6:4 E6:4 |' +
          'A5:1 G#5:1 A5:1 C6:1 E6:2 A6:2 G#6:2 E6:2 C6:4 | E6:2 D6:2 C6:2 B5:2 A5:2 G#5:2 A5:4 |' +
          'Bb4:2 D5:2 F5:2 Bb5:2 A5:2 F5:2 D5:4 | E5:2 F5:2 G#5:2 B5:2 D6:2 E6:2 F6:4',
      li: 'buzz', lv: 0.12,
      ap: 'c-c-c-c-c-c-c-c-', ai: 'dist', av: 0.045, ao: 45,
      bp: 'rrrrrrrrrrrrrrrr', bi: 'sawb', bv: 0.2,
      dr: ['k.k.k.k.k.k.k.k.', '....S.......S.S.', 'hhhhhhhhhhhhhhhh', 'a...a...a...a...', X(4)], dv: 0.48
    },
    // Victory jingle (~2.4 s, plays once)
    burns_victory: {
      bpm: 150, bpb: 3, bars: 2, rv: 0.3, loop: false,
      ch: 'G,C D,G',
      ld: 'D5:2 G5:2 B5:2 C6:2 E6:2 G6:2 | F#6:2 E6:2 D6:2 G6:6',
      li: 'ssaw', lv: 0.15, hx: 0.07,
      bp: 'r-r-r-r-r-r-r-r-r-------', bi: 'sawb', bv: 0.25,
      ap: 'c-.c-.c-.c-.c-.c-.c-----', ai: 'stab', av: 0.05, ao: 60,
      dr: ['k..k..k..k..k..k..K.....', '..s..s..s..s..ssss......', 'x' + dots(17) + 'x' + dots(5)], dv: 0.45
    },
    // Ending: the rescue (tender), then the Man burns (fire, the drop, triumph). D major
    burns_ending: {
      bpm: 116, bars: 16, rv: 0.35, dl: 0.12, pump: 0.4,
      ch: 'Bm G D A Bm G Em A D A Bm G D A G,A D',
      ld: 'F#5:6 E5:2 D5:4 B4:4 | B4:4 D5:4 G5:8 | F#5:6 A5:2 D6:8 | C#6:8 B5:4 A5:4 |' +
          'B5:6 A5:2 F#5:4 D5:4 | D5:4 G5:4 B5:8 | G5:4 F#5:4 E5:4 B4:4 | C#5:4 E5:4 A5:4 C#6:4 |' +
          'D6:3 D6:3 C#6:2 A5:4 F#5:4 | E5:3 E5:3 F#5:2 A5:8 | B5:3 B5:3 C#6:2 D6:4 F#6:4 | E6:6 D6:2 B5:8 |' +
          'F#6:3 E6:3 D6:2 A5:4 F#5:4 | E6:3 D6:3 C#6:2 A5:8 | B5:4 D6:4 C#6:4 E6:4 | D6:12 .:4',
      li: 'ssaw', lv: 0.12, hx: 0.05,
      ap: rp('0.1.2.1.', 16) + rp('c..c..c...c..c..', 8), ai: 'piano', av: 0.04, ao: 55,
      pd: 'c---------------', pi: 'strings', pv: 0.035, po: 50,
      bp: rp('r---------------', 8) + rp('..r-..r-..r-..o-', 8), bi: 'sawb', bv: 0.25,
      dr: [dots(64) + rp('t...............', 3) + 't.......t.t.tttt' + rp(FOUR, 8), dots(128) + rp(CLAP, 8), dots(128) + rp(OFFO, 8),
        dots(128) + rp(H16, 8), dots(112) + 's.s.s.s.ssssSSSS' + dots(128), dots(128) + 'x' + dots(127), dots(128) + 'f' + dots(127)], dv: 0.45
    }
  });

  // ---------------------------------------------- SUPER BRADY-O WORLD (2D) --
  Object.assign(TRACKS, {
    // Land 1 Gate Road: dusk in the RV line. F major, twangy guitar, lazy shuffle, a honk
    land1: {
      bpm: 104, bars: 8, rv: 0.3, sw8: 0.25,
      ch: 'Fmaj7 Am7 Bbmaj7 C Fmaj7 Am7 Gm7 C7sus4',
      ld: 'C5:4 F5:2 A5:2 G5:4 E5:4 | E5:6 G5:2 C6:8 | D6:4 C6:2 A5:2 F5:4 D5:4 | E5:6 G5:2 C5:8 |' +
          'A5:4 C6:2 E6:2 C6:4 A5:4 | G5:6 E5:2 A5:8 | Bb5:4 A5:2 G5:2 F5:4 D5:4 | F5:8 G5:4 Bb5:4',
      li: 'twang', lv: 0.16,
      bp: 'r-..r-f-r-..o-f-', bi: 'sub', bv: 0.28,
      ap: '..c-..c-..c-..c-', ai: 'ep', av: 0.045, ao: 57,
      dr: ['k.......k..k....', '....s.......s...', 'h.h.h.h.h.h.h.h.', dots(60) + 'e...'], dv: 0.4
    },
    // Land 2 Center Camp: circus big top waltz (3/4) with a calliope. C major
    land2: {
      bpm: 150, bpb: 3, bars: 16, rv: 0.25,
      ch: 'C C G7 G7 G7 G7 C C F F C A7 D7 G7 C G7',
      ld: 'E5:4 G5:4 C6:4 | B5:2 C6:2 E6:8 | D6:4 B5:4 G5:4 | F5:2 G5:2 B5:8 | D6:4 F6:4 D6:4 | C#6:2 D6:2 G5:8 | E5:4 G5:4 C6:4 | E6:12 |' +
          'A5:4 C6:4 F6:4 | E6:2 F6:2 A5:8 | G5:4 C6:4 E6:4 | C#6:4 E6:4 G6:4 | F#6:4 D6:4 A5:4 | B5:2 C6:2 D6:8 | C6:4 G5:4 E5:4 | D5:4 F5:4 B5:4',
      li: 'calliope', lv: 0.12,
      bp: 'r-..........f-..........', bi: 'sub', bv: 0.28,
      ap: '....c-..c-..', ai: 'organ', av: 0.035, ao: 60,
      dr: ['k...........', '....g...g...'], dv: 0.38
    },
    // Land 3 The Esplanade: sound camps and lasers. G minor house
    land3: {
      bpm: 128, bars: 16, rv: 0.25, dl: 0.15, pump: 0.45,
      ch: 'Gm Eb Bb F Gm Eb Cm D Eb F Gm Gm Eb F D D',
      ld: 'D6:3 D6:3 Bb5:2 G5:3 A5:3 Bb5:2 | G5:3 G5:3 Eb5:2 Bb5:8 | F5:3 Bb5:3 D6:2 F6:3 Eb6:3 D6:2 | C6:12 A5:4 |' +
          'D6:3 D6:3 Bb5:2 G5:3 A5:3 Bb5:2 | Eb6:3 D6:3 Bb5:2 G5:8 | C6:3 Eb6:3 G6:2 F6:3 Eb6:3 C6:2 | D6:12 F#5:4 |' +
          'G5:6 Bb5:2 Eb6:8 | A5:6 C6:2 F6:8 | G6:6 F6:2 D6:8 | Bb5:4 A5:4 G5:8 |' +
          'Eb6:4 G6:4 Bb5:8 | F5:4 A5:4 C6:8 | A5:4 D6:4 F#6:8 | F#6:4 E6:4 D6:4 A5:4',
      li: 'ssaw', lv: 0.12,
      bp: '..r-..r-..r-..r-', bi: 'sawb', bv: 0.26,
      ap: '0213021302130213', ai: 'pulse', av: 0.03, ao: 62,
      dr: [FOUR, CLAP, OFFO, H16, '..............y.......y.....y...', X(8)], dv: 0.47
    },
    // Land 4 Theme Camp Row: quirky, witchy 12/8 jig. A harmonic minor, harpsichord, cauldron bubbles
    land4: {
      bpm: 100, spb: 3, bars: 8, rv: 0.3, dl: 0.15,
      ch: 'Am E Am G F E Dm E',
      ld: 'A4:1 C5:1 E5:1 A5:2 G#5:1 A5:3 E5:3 | G#5:1 A5:1 B5:1 E5:3 D5:1 C5:1 B4:1 G#4:3 | C5:1 E5:1 A5:1 C6:2 B5:1 A5:3 E5:3 | D5:1 G5:1 B5:1 D6:3 C6:1 B5:1 A5:1 G5:3 |' +
          'F5:1 A5:1 C6:1 F6:2 E6:1 D6:3 C6:3 | B5:1 G#5:1 E5:1 F5:3 G#5:3 B5:3 | D6:1 C6:1 B5:1 A5:3 F5:1 E5:1 D5:1 F5:3 | E5:3 G#5:3 B4:6',
      li: 'hpsi', lv: 0.13, lg: 0.8,
      bp: 'r..f..o..f..', bi: 'pluckb', bv: 0.28,
      ap: '0..1..2..1..', ai: 'glass', av: 0.03, ao: 69,
      dr: ['k.....k.....', '...r.....r.r', 'u....u...u..'], dv: 0.38
    },
    // Land 5 Hot Springs: bubbly and watery. E major lydian colours
    land5: {
      bpm: 84, bars: 8, rv: 0.6, dl: 0.3,
      ch: 'Emaj7 C#m7 Amaj7 B7sus4 Emaj7 G#m7 Amaj9 B',
      ld: 'G#5:4 B5:4 D#6:6 B5:2 | E6:6 C#6:2 G#5:8 | C#6:4 B5:4 G#5:8 | F#5:8 E5:4 A5:4 |' +
          'B5:4 G#5:4 E5:4 D#5:4 | F#5:6 G#5:2 B5:8 | C#6:4 B5:4 A5:4 G#5:4 | F#5:12 D#5:4',
      li: 'whistle', lv: 0.13,
      ap: '0.2.4.1.3.5.2.4.', ai: 'glass', av: 0.035, ao: 71,
      pd: 'c---------------', pi: 'pad', pv: 0.04, po: 52,
      bp: 'r-------r---f---', bi: 'sub', bv: 0.26,
      dr: ['k.......k.......', '....n.......n...', 'u..u....u.u..u..', '..u.....u.....u.'], dv: 0.32
    },
    // Land 6 Deep Playa: mysterious night. F# minor 9 with a Neapolitan G
    land6: {
      bpm: 96, bars: 8, rv: 0.5, dl: 0.35,
      ch: 'F#m9 Dmaj7 Bm7 C#7sus4 F#m9 Dmaj7 Gmaj7 C#7',
      ld: 'C#6:6 A5:2 G#5:8 | F#5:4 A5:4 C#6:8 | D6:6 C#6:2 A5:8 | B5:8 F#5:4 G#5:4 |' +
          'A5:4 C#6:4 E6:8 | C#6:6 A5:2 F#5:8 | B5:4 D6:4 F#6:8 | F5:8 G#5:4 B5:4',
      li: 'bell', lv: 0.13,
      ap: '0.1.2.3.4.3.2.1.', ai: 'pluck', av: 0.03, ao: 54,
      pd: 'c---------------', pi: 'pad', pv: 0.04, po: 50,
      bp: 'r---------f-----', bi: 'sub', bv: 0.25,
      dr: ['k.........k.....', '....r.......r...', 'n.n.n.n.n.n.n.n.', 'd.......d..d....'], dv: 0.33
    },
    // Land 7 Hell Station: industrial grind. D minor riff, clanking metal
    land7: {
      bpm: 132, bars: 8, rv: 0.2,
      ch: 'Dm Dm Bb A Dm Dm Eb A',
      ld: 'D4:2 D4:2 F4:2 D4:1 Eb4:1 .:2 D4:2 A4:2 G#4:2 | D4:2 F4:2 G4:2 A4:2 C5:4 A4:4 | Bb3:2 Bb3:2 D4:2 F4:2 Bb4:4 A4:4 | A3:2 C#4:2 E4:2 G4:2 A4:8 |' +
          'D5:2 D5:2 F5:2 D5:1 Eb5:1 .:2 D5:2 A5:2 G#5:2 | F5:2 E5:2 D5:2 C5:2 A4:8 | Eb5:2 G5:2 Bb5:2 G5:2 Eb5:4 D5:4 | C#5:4 E5:4 A5:4 G5:4',
      li: 'gtr', lv: 0.12,
      ap: 'c-c-..c-c-..c-c.', ai: 'dist', av: 0.045, ao: 38,
      bp: 'r.r.r.r.r.r.r.r.', bi: 'sawb', bv: 0.24,
      dr: ['k...k.k.k...k.k.', '....S.......S...', 'a.a...a.a.a...a.', 'h.h.h.h.h.h.h.h.'], dv: 0.47
    },
    // Land 8 The Man Base: epic and menacing. C minor, brass over power chords
    land8: {
      bpm: 120, bars: 16, rv: 0.3,
      ch: 'Cm Cm Ab Bb Cm Cm Db G Fm Fm Ab Ab Fm Db G G',
      ld: 'C5:4 G5:4 Eb5:4 C5:4 | D5:6 Eb5:2 C5:8 | Ab4:4 C5:4 Eb5:6 F5:2 | D5:12 .:4 | G5:4 C6:4 Bb5:4 G5:4 | Ab5:6 G5:2 Eb5:8 | F5:4 Ab5:4 Db6:8 | B5:8 D6:4 F6:4 |' +
          'C6:6 Ab5:2 F5:8 | Eb6:6 Db6:2 C6:8 | C6:4 Eb6:4 Ab5:8 | G5:12 .:4 | F5:4 Ab5:4 C6:4 F6:4 | F6:6 Eb6:2 Db6:8 | D6:4 B5:4 G5:4 B5:4 | D6:4 F6:4 G6:8',
      li: 'brass', lv: 0.15, hx: 0.05,
      ap: 'c--.c--.c-.c-c-.', ai: 'dist', av: 0.045, ao: 48,
      bp: 'r-r-r-r-r-r-r-r-', bi: 'sawb', bv: 0.24,
      dr: ['k.......k.k.....', '....S.......S...', 't...........t.t.', 'h.h.h.h.h.h.h.h.', X(8)], dv: 0.47,
      fill: ['k.......k.k.....', '....S...S.mmttTT', 'h.h.h.h.........'], fe: 8
    },
    // Land 9 Sunrise Set: dawn, euphoric trance-house. D major
    land9: {
      bpm: 126, bars: 16, rv: 0.3, dl: 0.15, pump: 0.45,
      ch: 'D A Bm G D A G A Bm G D A Bm G Em A',
      ld: 'D5:3 F#5:3 A5:2 B5:3 A5:3 F#5:2 | E5:3 A5:3 C#6:2 B5:8 | D6:3 C#6:3 B5:2 F#5:3 A5:3 B5:2 | D6:12 B5:4 |' +
          'D6:3 F#6:3 E6:2 D6:3 C#6:3 A5:2 | C#6:3 E6:3 A5:2 E6:8 | B5:3 D6:3 G6:2 F#6:3 E6:3 D6:2 | E6:12 C#6:4 |' +
          'F#6:6 E6:2 D6:8 | D6:6 B5:2 G5:8 | A5:6 D6:2 F#6:8 | E6:6 C#6:2 A5:8 | B5:4 D6:4 F#6:4 D6:4 | G6:6 F#6:2 D6:8 | E6:4 G6:4 B5:4 E6:4 | C#6:4 E6:4 A5:4 E5:4',
      li: 'ssaw', lv: 0.12, hx: 0.05,
      bp: '..r-..r-..r-..r-', bi: 'sawb', bv: 0.26,
      ap: '0213021302130213', ai: 'pulse', av: 0.03, ao: 62,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 50,
      dr: [FOUR, CLAP, OFFO, H16, X(8)], dv: 0.47,
      fill: [FOUR, '....c...c.c.cccc', '..o...o...o.....'], fe: 8
    },
    // Land 10 World 22: strange, glitchy, literary. 7/8, bit-crushed, typewriter keys and a carriage-return ding
    land10: {
      bpm: 240, spb: 2, bpb: 7, bars: 8, rv: 0.2, dl: 0.2, crush: true,
      ch: 'Em C Am B Em C F B',
      ld: 'E5:2 G5:2 B5:2 E5:2 F#5:2 G5:4 | E5:2 C5:2 G5:2 E5:2 B5:3 .:3 | A5:2 C6:2 E6:2 A5:2 B5:2 C6:4 | D#6:3 B5:3 F#5:2 A5:6 |' +
          'G5:2 F#5:2 E5:2 B4:2 E5:2 G5:2 B5:2 | C6:2 B5:2 G5:2 E5:2 C5:6 | F5:2 A5:2 C6:2 F6:2 E6:3 C6:3 | B5:3 F#5:3 D#5:2 B4:6',
      li: 'crush', lv: 0.11,
      bp: 'r.r.f.r.o.r.f.', bi: 'pluckb', bv: 0.28,
      ap: '0.2.1.3.2.1.0.', ai: 'glass', av: 0.03, ao: 64,
      dr: ['k.....k...k...', 'p.pp.p.ppp.p.p', '....s......s..', '.........z....', dots(27) + 'i'], dv: 0.38
    },
    // Haunted camp: theremin over harpsichord, heartbeat and a ticking clock. D minor
    haunt: {
      bpm: 88, bars: 8, rv: 0.5, dl: 0.3,
      ch: 'Dm Dm Gm A7 Dm Bb Edim A7',
      ld: 'A5:8 G#5:4 A5:4 | F5:6 E5:2 D5:8 | Bb5:8 A5:4 G5:4 | C#6:12 .:4 | D6:6 C#6:2 A5:8 | F6:6 E6:2 D6:8 | G5:4 Bb5:4 C#6:4 E6:4 | E6:8 C#6:4 A5:4',
      li: 'theremin', lv: 0.13,
      ap: '0.1.2.1.3.2.1.2.', ai: 'hpsi', av: 0.03, ao: 50,
      pd: 'c---------------', pi: 'organ', pv: 0.03, po: 50,
      bp: 'r-------l-------', bi: 'sub', bv: 0.25,
      dr: ['d.......d.d.....', '....r.......r..r', 'l.l.l.l.l.l.l.l.'], dv: 0.33
    },
    // Gift camp: cozy reward room. Music box over Rhodes. F major
    gift_camp: {
      bpm: 92, bars: 8, rv: 0.35, dl: 0.15, sw: 0.1,
      ch: 'F Dm7 Bbmaj7 C F Am7 Bbmaj7,C F',
      ld: 'A5:4 C6:4 F6:6 E6:2 | D6:4 C6:4 A5:8 | Bb5:4 D6:4 F6:4 A6:4 | G6:12 .:4 | F6:4 C6:4 A5:4 C6:4 | E6:6 C6:2 A5:8 | D6:4 F6:4 E6:4 G6:4 | F6:12 .:4',
      li: 'mbox', lv: 0.14,
      ap: 'c---..c-..c-....', ai: 'ep', av: 0.05, ao: 53,
      bp: 'r-----r-f-------', bi: 'sub', bv: 0.26,
      dr: ['k.......k.......', '....r.......r...', 'n.n.n.n.n.n.n.n.'], dv: 0.32
    }
  });

  // ------------------------------------------------------------- compiler --
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
    sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6], aug: [0, 4, 8], add9: [0, 4, 7, 14],
    m9: [0, 3, 7, 10, 14], '5': [0, 7, 12], m7b5: [0, 3, 6, 10], mM7: [0, 3, 7, 11], '6': [0, 4, 7, 9],
    m6: [0, 3, 7, 9], madd9: [0, 3, 7, 14], '9': [0, 4, 7, 10, 14], '7sus4': [0, 5, 7, 10], maj9: [0, 4, 7, 11, 14]
  };
  function parseChord(s, warn) {
    const r = /^([A-G])([#b]?)(.*)$/.exec(s);
    if (!r || !has(QUAL, r[3])) { warn.push('chord ' + s); return { r: 0, iv: QUAL[''] }; }
    return { r: (PC[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0) + 12) % 12, iv: QUAL[r[3]] };
  }
  function parseLine(str, spBar, warn, tag) {
    const out = []; let pos = 0, bar = 0, last = null;
    const toks = str.replace(/\|/g, ' | ').trim().split(/\s+/);
    for (const tk of toks) {
      if (tk === '|') {
        bar++;
        if (pos !== bar * spBar) warn.push(tag + ' bar ' + bar + ' has ' + (pos - (bar - 1) * spBar) + ' steps');
        pos = bar * spBar; continue;
      }
      const parts = tk.split(':'), nm = parts[0], d = parts[1] ? +parts[1] : 2;
      if (!(d > 0)) { warn.push(tag + ' bad ' + tk); continue; }
      if (nm === '.') { pos += d; last = null; continue; }
      if (nm === '_') { if (last) last.d += d; pos += d; continue; }
      const m = noteNum(nm);
      if (m == null) { warn.push(tag + ' bad ' + tk); pos += d; continue; }
      last = { p: pos, m, d }; out.push(last); pos += d;
    }
    bar++;
    if (pos !== bar * spBar) warn.push(tag + ' bar ' + bar + ' has ' + (pos - (bar - 1) * spBar) + ' steps');
    return { notes: out, bars: bar };
  }
  // calls fn(step, char, lengthInSteps) for each trigger in a cycling pattern
  function pat(p, total, fn) {
    const L = p.length;
    for (let s = 0; s < total; s++) {
      const c = p[s % L];
      if (c === '.' || c === '-' || c === ' ') continue;
      let d = 1; while (s + d < total && p[(s + d) % L] === '-') d++;
      fn(s, c, d);
    }
  }
  const pcOf = x => ((x % 12) + 12) % 12;
  const voicing = (ch, base) => { const b = base + pcOf(ch.r - base); return ch.iv.map(i => b + i); };
  function harmBelow(m, ch) {
    for (let k = 3; k <= 9; k++) { const x = m - k; if (ch.iv.some(i => pcOf(ch.r + i) === pcOf(x))) return x; }
    return null;
  }

  const CACHE = {};
  function compile(name) {
    if (CACHE[name]) return CACHE[name];
    const T = TRACKS[name], warn = [];
    const spb = T.spb || 4, bpb = T.bpb || 4, spBar = spb * bpb, bars = T.bars, total = bars * spBar;
    const tr = T.tr || 0;
    const ev = new Array(total);
    const add = (s, e) => {
      if (s < 0 || s >= total) return;
      if (T.bld && e.c !== 'D') e.cm = T.bld[0] + (T.bld[1] - T.bld[0]) * (s / total);   // slow filter build
      (ev[s] || (ev[s] = [])).push(e);
    };
    // chord timeline
    const chordAt = new Array(total), ctoks = T.ch.trim().split(/\s+/), memo = {};
    if (ctoks.length !== bars) warn.push(name + ': ' + ctoks.length + ' chord bars, expected ' + bars);
    for (let b = 0; b < bars; b++) {
      const parts = ctoks[b % ctoks.length].split(','), seg = spBar / parts.length;
      for (let i = 0; i < spBar; i++) {
        const cs = parts[Math.min(parts.length - 1, Math.floor(i / seg))];
        chordAt[b * spBar + i] = memo[cs] || (memo[cs] = parseChord(cs, warn));
      }
    }
    // lead (+ optional automatic harmony)
    if (T.ld) {
      const L = parseLine(T.ld, spBar, warn, name + ' lead');
      if (L.bars !== bars) warn.push(name + ': lead has ' + L.bars + ' bars, expected ' + bars);
      for (const n of L.notes) {
        add(n.p, { c: 'L', m: n.m + tr, d: n.d, v: 1 });
        if (T.hx) { const h = harmBelow(n.m, chordAt[Math.min(n.p, total - 1)]); if (h != null) add(n.p, { c: 'H', m: h + tr, d: n.d, v: 1 }); }
      }
    }
    // second melody line (counter-melody / a different instrument for another section)
    if (T.l2) {
      const L2 = parseLine(T.l2, spBar, warn, name + ' lead2');
      if (L2.bars !== bars) warn.push(name + ': lead2 has ' + L2.bars + ' bars, expected ' + bars);
      for (const n of L2.notes) add(n.p, { c: 'M', m: n.m + tr, d: n.d, v: 1 });
    }
    // bass
    if (T.bp) {
      const bo = T.bo || 36;
      pat(T.bp, total, (s, c, d) => {
        const ch = chordAt[s], r = bo + pcOf(ch.r - bo), lc = c.toLowerCase();
        const off = { r: 0, f: 7, o: 12, t: ch.iv[1], s: ch.iv[3] != null ? ch.iv[3] : 10, l: -5, x: 9 }[lc];
        if (off == null) return;
        add(s, { c: 'B', m: r + off + tr, d, v: c === lc ? 1 : 1.2 });
      });
    }
    // arpeggio / chord stabs and pads
    const harm = (p, code, base) => pat(p, total, (s, c, d) => {
      const tones = voicing(chordAt[s], base).map(x => x + tr), acc = (s % spb === 0) ? 1 : 0.8;
      if (c === 'c') add(s, { c: code, m: tones, d, v: acc });
      else if (c >= '0' && c <= '9') { const k = +c, n = tones.length; add(s, { c: code, m: tones[k % n] + 12 * Math.floor(k / n), d, v: acc }); }
    });
    if (T.ap) harm(T.ap, 'A', T.ao || 60);
    if (T.pd) harm(T.pd, 'P', T.po || 55);
    if (T.a2) harm(T.a2, 'C', T.a2o || 60);
    // drums
    if (T.dr) {
      for (let s = 0; s < total; s++) {
        const bar = Math.floor(s / spBar), useF = T.fill && T.fe && (bar % T.fe === T.fe - 1);
        const lanes = useF ? T.fill : T.dr, idx = useF ? s % spBar : s;
        for (const ln of lanes) { const c = ln[idx % ln.length]; if (c !== '.' && c !== '-' && c !== ' ') add(s, { c: 'D', k: c }); }
      }
    }
    const cfg = {
      name, ev, total, warn, loop: T.loop !== false, bpm: T.bpm, spb,
      sd: 60 / (T.bpm * spb), dt: Math.min(1.5, (T.dtb || 0.75) * 60 / T.bpm),
      sw: T.sw || 0, sw8: T.sw8 || 0, pump: T.pump || 0, wr: T.wr || 0, kit: T.retro ? 'nes' : '',
      a2i: T.a2i || 'pluck', a2v: T.a2v || 0.04, l2i: T.l2i || 'brass', l2v: T.l2v || 0.12, l2g: T.l2g || 0.92,
      li: T.li || 'sq2', lv: T.lv || 0.15, lg: T.lg || 0.92, hi: T.hi || T.li || 'sq2', hv: T.hx || 0,
      bi: T.bi || 'sub', bv: T.bv || 0.28, ai: T.ai || 'pulse', av: T.av || 0.06,
      pi: T.pi || 'pad', pv: T.pv || 0.05, dv: T.dv || 0.5,
      rv: T.retro ? 0 : (T.rv || 0), dl: T.retro ? 0 : (T.dl || 0), crush: !!T.crush
    };
    CACHE[name] = cfg;
    return cfg;
  }

  // drums go to `out`; everything else to `duck` (side-chain pumped by the kick) when present
  function playEv(cfg, e, t, sd, out, duck) {
    const mo = duck || out;
    VM.cm = e.cm || 1;
    try {
      switch (e.c) {
        case 'D':
          drum(e.k, t, cfg.dv, out, cfg.kit);
          if (duck && cfg.pump && (e.k === 'k' || e.k === 'K')) {
            const gp = duck.gain;
            gp.setTargetAtTime(1 - cfg.pump, t, 0.004);
            gp.setTargetAtTime(1, t + 0.03, Math.max(0.03, sd * 0.9));
          }
          break;
        case 'L': voice(cfg.li, t, e.m, e.d * sd * cfg.lg, cfg.lv * e.v, mo); break;
        case 'H': voice(cfg.hi, t, e.m, e.d * sd * cfg.lg, cfg.hv * e.v, mo); break;
        case 'M': voice(cfg.l2i, t, e.m, e.d * sd * cfg.l2g, cfg.l2v * e.v, mo); break;
        case 'B': voice(cfg.bi, t, e.m, e.d * sd * 0.9, cfg.bv * e.v, mo); break;
        case 'A': case 'P': case 'C': {
          const inst = e.c === 'A' ? cfg.ai : e.c === 'P' ? cfg.pi : cfg.a2i;
          const vol = (e.c === 'A' ? cfg.av : e.c === 'P' ? cfg.pv : cfg.a2v) * e.v, d = e.d * sd * 0.92;
          if (Array.isArray(e.m)) {
            if (INST[inst] && INST[inst].pc) voice(inst, t, e.m[0], d, vol, mo);
            else { const k = 1 / Math.sqrt(e.m.length); for (const m of e.m) voice(inst, t, m, d, vol * k, mo); }
          } else voice(inst, t, e.m, d, vol, mo);
          break;
        }
        default: break;
      }
    } finally { VM.cm = 1; }
  }

  // schedule a whole (short) composition at once - used by the clear / gameover SFX
  function playComp(name, t, v, out) {
    const cfg = compile(name), g = gain(v);
    g.connect(out);
    for (let s = 0; s < cfg.total; s++) {
      const evs = cfg.ev[s];
      if (evs) for (const e of evs) playEv(cfg, e, t + s * cfg.sd, cfg.sd, g, null);
    }
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* ignore */ } }, (cfg.total * cfg.sd + 4) * 1000);
  }

  // ------------------------------------------------------------ sequencer --
  const LOOKAHEAD = 0.12, TICK_MS = 25;
  let mus = null, pending = null, timer = null;

  function makeOut(cfg) {
    const out = gain(0), nodes = [out];
    let dest = musicBus, duck = null;
    if (cfg.pump) { duck = gain(1); duck.connect(out); nodes.push(duck); }
    if (cfg.crush) {
      const pre = gain(2.2), sh = ctx.createWaveShaper(), post = gain(0.45);
      sh.curve = crushCurve; pre.connect(sh); sh.connect(post); post.connect(musicBus);
      dest = pre; nodes.push(pre, sh, post);
    }
    out.connect(dest);
    if (cfg.rv) { const r = gain(cfg.rv); out.connect(r); r.connect(mRevIn); nodes.push(r); }
    if (cfg.dl) { const d = gain(cfg.dl); out.connect(d); d.connect(delayIn); nodes.push(d); }
    return { out, duck, nodes };
  }
  function release(m, ms) {
    setTimeout(() => { for (const n of m.o.nodes) { try { n.disconnect(); } catch (e) { /* ignore */ } } }, ms);
  }
  function fadeOut(m) {
    if (!m) return;
    try {
      const now = ctx.currentTime, gp = m.o.out.gain;
      gp.cancelScheduledValues(now); gp.setTargetAtTime(0, now, 0.07);
    } catch (e) { /* ignore */ }
    release(m, 2500);
  }
  function startTimer() { if (!timer) { try { timer = setInterval(tick, TICK_MS); } catch (e) { timer = null; } } }
  function stopTimer() { if (timer) { try { clearInterval(timer); } catch (e) { /* ignore */ } timer = null; } }

  function startTrack(name) {
    const cfg = compile(name);
    fadeOut(mus); mus = null;
    const now = ctx.currentTime, o = makeOut(cfg);
    o.out.gain.setValueAtTime(0, now); o.out.gain.linearRampToValueAtTime(1, now + 0.06);
    if (cfg.dl) delayNode.delayTime.setTargetAtTime(cfg.dt, now, 0.05);
    mus = { name, cfg, step: 0, next: now + 0.06, o, end: 0 };
    if (!userPaused) startTimer();
    tick();
  }

  function tick() {
    try {
      if (!ctx || !mus) { stopTimer(); return; }
      const now = ctx.currentTime, m = mus, cfg = m.cfg;
      if (m.end) {
        if (now >= m.end) { mus = null; release(m, 3000); stopTimer(); }
        return;
      }
      if (m.next < now - 0.2) m.next = now + 0.03;     // fell behind (throttled tab): skip ahead
      let guard = 0;
      while (m.next < now + LOOKAHEAD && guard++ < 96) {
        const sd = cfg.sd / (boost ? 1.25 : 1), evs = cfg.ev[m.step];
        if (evs) {
          let tt = m.next;
          if (cfg.sw && (m.step & 1)) tt += cfg.sw * sd;                          // 16th swing
          if (cfg.sw8 && (m.step % cfg.spb) * 2 === cfg.spb) tt += cfg.sw8 * sd;  // 8th shuffle
          VM.wr = cfg.wr ? (cfg.wr * cfg.bpm / 60) * (boost ? 1.25 : 1) : 0;
          for (const e of evs) playEv(cfg, e, tt, sd, m.o.out, m.o.duck);
          VM.wr = 0;
        }
        m.next += sd; m.step++;
        if (m.step >= cfg.total) {
          if (cfg.loop) m.step = 0;
          else { m.end = m.next; break; }
        }
      }
    } catch (e) { /* never throw from the scheduler */ }
  }

  // ------------------------------------------------------- kart engine --
  // two detuned oscillators (saw + pulse) through a resonant low-pass, a noise
  // rumble, and a "putter" amplitude LFO; rpm 0..1 glides pitch/brightness.
  let eng = null, engR = 0, engT = -1;
  function engineStart() {
    const now = ctx.currentTime;
    const g = gain(0), am = gain(0.7), lp = filt('lowpass', 400, 3);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = gain(0.3);
    const ns = ctx.createBufferSource(), nf = filt('lowpass', 180, 0.8), ng = gain(0.6);
    o1.type = 'sawtooth'; setWave(o2, 'p25'); o2.detune.value = 14;
    o1.frequency.value = 40; o2.frequency.value = 40; lfo.type = 'triangle'; lfo.frequency.value = 12;
    ns.buffer = noiseBuf; ns.loop = true;
    o1.connect(lp); o2.connect(lp); lp.connect(am); ns.connect(nf); nf.connect(ng); ng.connect(am);
    lfo.connect(lg); lg.connect(am.gain); am.connect(g); g.connect(sfxBus);
    g.gain.setValueAtTime(0, now); g.gain.setTargetAtTime(0.1, now, 0.06);
    o1.start(now); o2.start(now); lfo.start(now); ns.start(now, Math.random() * 0.5);
    eng = { g, lp, o1, o2, lfo, nf, srcs: [o1, o2, lfo, ns], nodes: [g, am, lp, o1, o2, lfo, lg, ns, nf, ng] };
    engT = -1;
  }
  function engineStop() {
    if (!eng || !ctx) { eng = null; return; }
    const e = eng; eng = null;
    try {
      const now = ctx.currentTime;
      e.g.gain.cancelScheduledValues(now); e.g.gain.setTargetAtTime(0, now, 0.05);
      for (const s of e.srcs) { try { s.stop(now + 0.4); } catch (x) { /* ignore */ } }
      done(e.srcs[0], e.nodes);
    } catch (x) { /* ignore */ }
  }
  function engine(on, rpm01) {
    try {
      if (!on) { engineStop(); return; }
      if (!ctx || dead || userPaused || ctx.state !== 'running') return;   // silent until unlocked
      if (rpm01 != null) { const r = +rpm01; if (isFinite(r)) engR = clamp(r, 0, 1); }
      if (!eng) engineStart();
      const now = ctx.currentTime;
      const dr = eng.r == null ? 1 : Math.abs(engR - eng.r);          // light per-frame cost:
      if (dr < 0.002 || (now - engT < 0.03 && dr < 0.05)) return;      // only automate real changes
      engT = now; eng.r = engR;
      const r = engR, f = 38 + r * 115;
      eng.o1.frequency.setTargetAtTime(f, now, 0.06);
      eng.o2.frequency.setTargetAtTime(f * 1.003, now, 0.06);
      eng.lp.frequency.setTargetAtTime(320 + r * 2600, now, 0.08);
      eng.nf.frequency.setTargetAtTime(160 + r * 420, now, 0.08);
      eng.lfo.frequency.setTargetAtTime(9 + r * 34, now, 0.08);
      eng.g.gain.setTargetAtTime(0.09 + r * 0.06, now, 0.08);
    } catch (e) { /* ignore */ }
  }

  // ------------------------------------------------------------ public API --
  const lastPlay = {};
  let retro = false;
  function silentKick() {
    try {
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) { /* ignore */ }
  }
  function unlock() {
    try {
      if (dead) return;
      if (!ctx) { init(); if (!ctx) return; }
      if (ctx.state !== 'running' && !userPaused) {
        const p = ctx.resume(); if (p && p.catch) p.catch(noop);
        silentKick();
      } else if (!unlockedOnce) silentKick();
      unlockedOnce = true;
      if (pending) { const n = pending; pending = null; if (!mus || mus.name !== n) startTrack(n); }
    } catch (e) { /* ignore */ }
  }
  function play(name, opts) {
    try {
      if (!ctx || dead || userPaused || ctx.state !== 'running' || typeof name !== 'string' || !has(SFX, name)) return;
      const chip = retro && has(RSFX, name);
      const now = ctx.currentTime;
      if (now - (lastPlay[name] || -1) < 0.03) return;   // de-duplicate rapid repeats
      lastPlay[name] = now;
      let p = 1, v = 1;
      if (opts) {
        if (+opts.pitch > 0) p = clamp(+opts.pitch, 0.25, 4);
        if (opts.vol != null && isFinite(+opts.vol)) v = clamp(+opts.vol, 0, 1);
      }
      if (v <= 0) return;
      if (chip) RSFX[name](now + 0.005, p, v, sfxDry); else SFX[name](now + 0.005, p, v, sfxBus);
    } catch (e) { /* ignore */ }
  }
  function music(name) {
    try {
      if (!name) { stopMusic(); return; }
      if (typeof name !== 'string' || !has(TRACKS, name)) return;
      if (!ctx) { pending = name; return; }              // not unlocked yet: remember it
      pending = null;
      if (mus && mus.name === name) return;
      startTrack(name);
    } catch (e) { /* ignore */ }
  }
  function stopMusic() {
    try {
      pending = null;
      if (mus && ctx) fadeOut(mus);
      mus = null; stopTimer();
      engineStop();
    } catch (e) { /* ignore */ }
  }
  function setMusicVolume(v) {
    try {
      v = +v; if (!isFinite(v)) return;
      musicVol = clamp(v, 0, 1);
      if (ctx) {
        const now = ctx.currentTime;
        musicBus.gain.setTargetAtTime(musicVol * MUSIC_SCALE, now, 0.03);
        mRevIn.gain.setTargetAtTime(musicVol * MUSIC_SCALE, now, 0.03);
      }
    } catch (e) { /* ignore */ }
  }
  function setSfxVolume(v) {
    try {
      v = +v; if (!isFinite(v)) return;
      sfxVol = clamp(v, 0, 1);
      if (ctx) { sfxBus.gain.setTargetAtTime(sfxVol, ctx.currentTime, 0.03); sfxDry.gain.setTargetAtTime(sfxVol, ctx.currentTime, 0.03); }
    } catch (e) { /* ignore */ }
  }
  function setTempoBoost(on) { boost = !!on; }
  function setRetro(on) { retro = !!on; }
  function suspend() {
    try {
      userPaused = true; stopTimer();
      if (ctx && ctx.state === 'running') { const p = ctx.suspend(); if (p && p.catch) p.catch(noop); }
    } catch (e) { /* ignore */ }
  }
  function resume() {
    try {
      userPaused = false;
      if (!ctx) return;
      if (ctx.state !== 'running') { const p = ctx.resume(); if (p && p.catch) p.catch(noop); }
      if (mus) startTimer();
    } catch (e) { /* ignore */ }
  }

  const api = {
    unlock, play, music, stopMusic, setMusicVolume, setSfxVolume, setTempoBoost, setRetro, engine, suspend, resume,
    get currentTrack() { try { return mus ? mus.name : (pending || null); } catch (e) { return null; } },
    get enabled() { return !dead; },
    get retro() { return retro; },
    sfxNames: Object.keys(SFX),
    trackNames: Object.keys(TRACKS),
    // dev aid: returns authoring problems per track (empty object when all tracks are well-formed)
    _validate() {
      const out = {};
      try { for (const k of Object.keys(TRACKS)) { const w = compile(k).warn; if (w.length) out[k] = w; } } catch (e) { out.error = String(e); }
      return out;
    }
  };
  return api;
})();
