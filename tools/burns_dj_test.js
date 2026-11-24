// DJ decks test (src/41_burns_dj.js): the two-deck DJ minigame, played with real touches (CDP touch events, both
// orientations) by scripted players, with the audio measured from the live output (nobody here can listen).
//   node tools/burns_dj_test.js [--only expertP,beginnerP,...] [--out <dir>]      (BRADY_DIST=<folder> for a private build)
// Runs (each in real time, the music is real):
//   audio      expert, portrait, with recorders on each deck (before and after its fader) and on the master:
//              (a) both faders up -> both records' kicks are in the mix, (b) LOCKED -> the two kicks land within a few
//              ms for 16+ bars with no drift, not locked -> they don't, (c) faders change each deck's level as drawn,
//              (d) nothing clips, (e) after the set no DJ voice is still running and the world's music is back.
//              Saves good_mix.wav. Also: pause silences the decks, resume carries on, tab-hide pauses.
//   wreck      landscape: PLAY on the 1, then faders up without matching -> TRAINWRECK; saves trainwreck.wav
//   beginnerP  portrait, the Wobble Dome headline set (normal, story mission): a clumsy beginner must get B or better
//   beginnerL  landscape, the same; screenshots of every step (first-time teaching) in both orientations
//   idle       touches nothing after DROP IN: must still reach the results card (low grade), no stall
//   expertL    landscape expert: must get S
//   djoff      the DJ-off (World 11, difficulty 1 = easy): a beginner passes (C or better) and the mission completes
//   forfeit    LEAVE THE BOOTH from the pause menu: onDone(forfeit) fires, world music back
// Exits 1 on any failure. Screenshots + WAVs go to --out (default shots/bm-review/dj-2 in the repo).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const OUT = path.resolve(arg('--out', path.join(__dirname, '..', 'shots', 'bm-review', 'dj-2')));
const ONLY = arg('--only', null);
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gz': 'application/octet-stream' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
const fails = [];
const check = (ok, what, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) fails.push(what); return ok; };
const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
const rnd = (() => { let s = 12345; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 0.82;

// counts every audio source the page starts, so "nothing left running" can be checked after a set
const INIT = () => {
  const live = new Set(); window.__srcLive = live;
  const P = AudioScheduledSourceNode.prototype, st = P.start;
  P.start = function (...a) { this.__t0 = performance.now(); live.add(this); this.addEventListener('ended', () => live.delete(this)); return st.apply(this, a); };
};

// ---------------- in-page helpers (installed once per page) ----------------
const PAGE = () => {
  const B = () => window.BRADY_BURNS, DJ = () => B().BurnsDJ;
  window.__dj = {
    state() {
      const S = DJ().session; if (!S) return null;
      const L = S.L || S.layout(), M = S.mix, cr = window.BRADY.Game.canvas.getBoundingClientRect();
      const o = { phase: S.phase, step: S.step, mixN: S.mixN, nMixes: S.nMixes, live: S.live, lock: S.lock, paused: S.paused, tier: S.tier, teach: S.teach, resT: S.resT || 0,
        hint: S.hint ? { title: S.hint.title, sub: S.hint.sub, ctl: S.hint.ctl } : null, ctl: L.ctl, crate: L.crate, startBtn: L.startBtn, menu: L.menu, pause: L.pause, off: { x: cr.left, y: cr.top },
        energy: S.energy, result: S.result, tol: S.tol, big: S.big && S.big.title, port: L.port };
      if (M) {
        const D = M.decks, A = D[S.live], Bd = D[1 - S.live];
        o.decks = D.map(d => ({ fader: d.fader, pitch: d.pitch, native: d.native, bpm: d.bpm(), playing: d.playing, low: d.low, trk: d.trk && d.trk.id, loop: !!d.loop }));
        o.rel = S.rel(); o.pos = S.pos(); o.tempoOK = S.m.tempoOK;
        if (A.playing) { const np = S.nextPhrase(0); o.toOne = (np.t - M.heard()) * 1000; o.beatMs = 60000 / A.bpm(); }
        if (S.crate) o.cards = S.crate.cards.map(c => ({ q: c.q, vibe: c.vibe, key: c.key, tempo: c.tempo, id: c.t.id })), o.chosen = !!S.crate.chosen;
      }
      return o;
    },
    // recorders on: each deck before its fader, after its fader, and Sound's master (AudioWorklet, audio thread)
    async tap() {
      const S = DJ().session, M = S.mix, c = M.ctx; if (!c) return false;
      const code = `class Rec extends AudioWorkletProcessor { constructor(){ super(); this.buf = []; this.n = 0; this.on = true; this.port.onmessage = e => { this.on = false; }; }
        process(inp, out) { const x = inp[0]; if (!this.on) return false; const L = x[0] ? x[0].slice() : new Float32Array(128), R = x[1] ? x[1].slice() : L; this.buf.push([L, R]); this.n += 128;
          if (this.n >= 4096) { const n = this.n, l = new Float32Array(n), r = new Float32Array(n); let k = 0; for (const [a, b] of this.buf) { l.set(a, k); r.set(b, k); k += a.length; } this.port.postMessage({ f: currentFrame - n + 128, l, r }, [l.buffer, r.buffer]); this.buf = []; this.n = 0; } return true; } }
        registerProcessor('dj-rec', Rec);`;
      if (!c.__recMod) { c.__recMod = true; await c.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))); }
      const io = window.BRADY.Sound.musicBus(), sink = c.createGain(); sink.gain.value = 0; sink.connect(c.destination);
      const mk = (src, name, stereo) => { const n = new AudioWorkletNode(c, 'dj-rec', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit' }); const rec = { name, f0: null, chunks: [], node: n, stereo };
        n.port.onmessage = e => { if (rec.f0 === null) rec.f0 = e.data.f; if (stereo) rec.chunks.push([e.data.l, e.data.r]); else { const l = e.data.l, r = e.data.r, m = new Float32Array(l.length / 2); for (let i = 0; i < m.length; i++) m[i] = 0.25 * (l[2 * i] + l[2 * i + 1] + r[2 * i] + r[2 * i + 1]); rec.chunks.push(m); } };
        src.connect(n); n.connect(sink); return rec; };
      // where each deck scheduled a kick (only used to know where to look; the onsets are measured in the audio)
      const E = window.BRADY_BURNS.BurnsHouse.engine, step0 = E.__orig || E.step; E.__orig = step0; const ks = [[], []];
      E.step = function (I, n, tt, sd) { const S2 = window.BRADY_BURNS.BurnsDJ.session; if (S2 && S2.mix) for (let i = 0; i < 2; i++) { const d = S2.mix.decks[i]; if (d.inst === I && d.kick && d.kick.at(n)) ks[i].push({ t: tt, id: d.trk && d.trk.id }); } return step0.apply(this, arguments); };
      const T = window.__taps = { ks, sr: c.sampleRate, recs: [mk(M.ch[0].in, 'A_pre'), mk(M.ch[1].in, 'B_pre'), mk(M.ch[0].fad, 'A_post'), mk(M.ch[1].fad, 'B_post'), mk(io.master, 'master', true)], tl: [] };
      T.timer = setInterval(() => { const S2 = DJ().session; if (!S2 || !S2.mix) return; const D = S2.mix.decks, r = S2.rel(); T.tl.push({ t: c.currentTime, lock: S2.lock, ms: r.ok ? r.ms : null, bpmd: r.bpm, live: S2.live, f: [D[0].fader, D[1].fader], g: [D[0].gain, D[1].gain], p: [D[0].playing, D[1].playing], l: [D[0].low, D[1].low], step: S2.step, n: window.__srcLive.size }); }, 25);
      return true;
    },
    untap() { const T = window.__taps; if (!T) return; clearInterval(T.timer); for (const r of T.recs) { try { r.node.port.postMessage('stop'); r.node.disconnect(); } catch (e) { /* ignore */ } } },
    // the analysis, in the page (the audio never crosses the wire)
    analyse() {
      const T = window.__taps, sr = T.sr, out = {};
      const flat = (rec) => { const n = rec.chunks.reduce((a, c) => a + (rec.stereo ? c[0].length : c.length), 0); if (!rec.stereo) { const x = new Float32Array(n); let k = 0; for (const c of rec.chunks) { x.set(c, k); k += c.length; } return { x, sr: sr / 2, f0: rec.f0 }; } const l = new Float32Array(n), r = new Float32Array(n); let k = 0; for (const c of rec.chunks) { l.set(c[0], k); r.set(c[1], k); k += c[0].length; } return { l, r, sr, f0: rec.f0 }; };
      const R = {}; for (const r of T.recs) R[r.name] = flat(r);
      const lp = (x, f, s) => { const w = 2 * Math.PI * f / s, c = Math.cos(w), al = Math.sin(w) / (2 * 0.707), b0 = (1 - c) / 2, b1 = 1 - c, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al, y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = (b0 * x0 + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x0; y2 = y1; y1 = y0; y[i] = y0; } return y; };
      // kick onsets on one deck: peaks of the <150 Hz band, onset = where it first reaches 20% of the peak
      const kicks = (D) => {
        const s = D.sr, y = lp(lp(D.x, 150, s), 150, s), n = y.length, env = new Float32Array(n);
        for (let i = 0; i < n; i++) env[i] = Math.abs(y[i]);
        const hop = Math.floor(s * 0.002), sm = []; for (let i = 0; i + hop <= n; i += hop) { let m = 0; for (let k = i; k < i + hop; k++) if (env[k] > m) m = env[k]; sm.push(m); }
        const sorted = Array.from(sm).sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * 0.95)] || 1e-9, res = [];
        const minGap = Math.floor(0.3 / 0.002);
        for (let i = 4; i < sm.length - 4; i++) {
          if (sm[i] < p95 * 0.45) continue;
          let isMax = true; for (let k = Math.max(0, i - 60); k < Math.min(sm.length, i + 60); k++) if (sm[k] > sm[i]) { isMax = false; break; }
          if (!isMax) continue;
          // it must rise from quiet (a kick, not a sustained bass note)
          let pre = 1e9; for (let k = Math.max(0, i - 30); k < i - 6; k++) pre = Math.min(pre, sm[k]);
          if (pre > sm[i] * 0.5) continue;
          if (res.length && i - res[res.length - 1].i < minGap) continue;
          // onset: walk back from the peak sample to 20%
          let pk = i * hop, pv = 0; for (let k = i * hop; k < (i + 1) * hop; k++) if (env[k] > pv) { pv = env[k]; pk = k; }
          let j = pk; while (j > pk - s * 0.04 && j > 0 && env[j] > pv * 0.2) j--;
          // refine on the actual waveform (first sample above 20% of peak, scanning forward from 40 ms before)
          let st = Math.max(0, pk - Math.floor(s * 0.04)); for (; st < pk; st++) if (Math.abs(y[st]) > pv * 0.2) break;
          res.push({ i, t: (D.f0 / sr) + st / s, pk: pv });
        }
        return res;
      };
      const tl = T.tl, at = t => { let lo = 0, hi = tl.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tl[m].t <= t) lo = m; else hi = m - 1; } return tl[lo]; };
      const beatS = 60 / (window.BRADY_BURNS.BurnsDJ.session ? window.BRADY_BURNS.BurnsDJ.session.curBpm() : 126);
      // (b) kick alignment. Each deck's kick onsets are found with a template made from that deck's own kicks (the
      // average waveform around its kick peaks), so a punchy kick and a deep kick are timed alike: onset = where the
      // template first rises, carried to every kick by cross-correlation. Then each B kick is paired with A's nearest.
      // a deck's kick onsets: its scheduled kicks, each timed in the audio with a template of that deck's own kick
      const onsets = (D, sched) => {
        const s = D.sr, y = lp(lp(D.x, 300, s), 300, s), base = D.f0 / sr, idx = tt => Math.round((tt - base) * s);
        const pre = Math.round(s * 0.012), L = Math.round(s * 0.05), tpl = new Float32Array(L);
        const ok = sched.filter(tt => idx(tt) - pre - 400 >= 0 && idx(tt) + L + 400 < y.length);
        for (const tt of ok) { const i0 = idx(tt) - pre; for (let k = 0; k < L; k++) tpl[k] += y[i0 + k] / ok.length; }
        const W = Math.round(s * 0.008), res = [];
        for (const tt of ok) {
          const i0 = idx(tt) - pre; let best = -1e9, bl = 0, e2 = 0;
          for (let l = -W; l <= W; l++) { let c = 0; for (let k = 0; k < L; k++) c += tpl[k] * y[i0 + k + l]; if (c > best) { best = c; bl = l; } }
          for (let k = 0; k < L; k++) e2 += y[i0 + k] * y[i0 + k];
          if (e2 < 1e-8) continue;          // silent (paused / unloaded)
          res.push({ sched: tt, t: tt + bl / s });
        }
        return res;
      };
      // one template per record (a deck plays different records, with different kicks, across the set)
      const perTrack = (D, list) => { const ids = Array.from(new Set(list.map(k => k.id))); return ids.flatMap(id => onsets(D, list.filter(k => k.id === id).map(k => k.t))).map(o => o.t).sort((a, b) => a - b); };
      const kA = perTrack(R.A_pre, T.ks[0]), kB = perTrack(R.B_pre, T.ks[1]);
      out.kicks = { A: kA.length, B: kB.length };
      const pairs = []; let ia = 0;
      for (const tb of kB) {
        while (ia < kA.length - 1 && Math.abs(kA[ia + 1] - tb) <= Math.abs(kA[ia] - tb)) ia++;
        const ta = kA[ia]; if (ta === undefined) continue;
        const d = (tb - ta) * 1000; if (Math.abs(d) > beatS * 500) continue;
        const st = at(tb); if (!st || !st.p[0] || !st.p[1]) continue;
        pairs.push({ t: tb, d, lock: !!st.lock });
      }
      const runs = []; let cur = null;
      for (const p of pairs) { if (p.lock) { if (!cur || p.t - cur[cur.length - 1].t > beatS * 4 * 9) runs.push(cur = []); cur.push(p); } else cur = null; }
      out.locked = runs.filter(r => r.length > 2).map(r => {
        const settled = r.filter(p => p.t > r[0].t + beatS * 4), n = settled.length || 1, mt = settled.reduce((a, p) => a + p.t, 0) / n, md = settled.reduce((a, p) => a + p.d, 0) / n;
        let sxy = 0, sxx = 0; for (const p of settled) { sxy += (p.t - mt) * (p.d - md); sxx += (p.t - mt) * (p.t - mt); }
        const ad = settled.map(p => Math.abs(p.d)).sort((a, b) => a - b);
        return { bars: Math.round((r[r.length - 1].t - r[0].t) / beatS / 4), kicks: r.length, worstMs: Math.round((ad[ad.length - 1] || 0) * 100) / 100, p95Ms: Math.round((ad[Math.floor(ad.length * 0.95)] || 0) * 100) / 100, meanMs: Math.round(md * 100) / 100, driftMsPerBar: Math.round((sxx ? sxy / sxx : 0) * beatS * 4 * 1000) / 1000 };
      });
      const un = pairs.filter(p => !p.lock);
      out.unlocked = { bars: un.length, kicks: un.length, within3ms: un.filter(p => Math.abs(p.d) <= 3).length, sample: un.filter((p, i) => i % Math.max(1, Math.floor(un.length / 16)) === 0).map(p => Math.round(p.d * 10) / 10) };
      // (c) level after the fader vs before it, per 100 ms, against the fader's drawn gain
      const lvl = (pre, post, side) => {
        const s = pre.sr, w = Math.floor(s * 0.1), rows = [];
        for (let i = 0; i + w <= Math.min(pre.x.length, post.x.length); i += w) {
          let a = 0, b = 0; for (let k = i; k < i + w; k++) { a += pre.x[k] * pre.x[k]; b += post.x[k] * post.x[k]; }
          if (a < 1e-7) continue;
          const t = pre.f0 / sr + (i + w / 2) / s, st = at(t); if (!st || !st.p[side] || !st.l[side]) continue;
          // compare with the gain the faders asked for 50 ms earlier (gain moves glide in ~15 ms)
          const st2 = at(t - 0.05); if (!st2 || Math.abs(st2.g[side] - st.g[side]) > 0.02) continue;
          rows.push({ want: st.g[side], got: Math.sqrt(b / a) });
        }
        const up = rows.filter(r => r.want > 0.05);
        const err = up.map(r => Math.abs(20 * Math.log10(r.got / r.want)));
        const srt = err.slice().sort((a, b) => a - b); return { windows: rows.length, p95ErrDb: srt.length ? Math.round(srt[Math.floor(srt.length * 0.95)] * 100) / 100 : null, maxErrDb: err.length ? Math.round(Math.max(...err) * 100) / 100 : null, medErrDb: err.length ? Math.round(err.sort((a, b) => a - b)[err.length >> 1] * 100) / 100 : null, silentWhenDown: rows.filter(r => r.want === 0).every(r => r.got < 0.003), downWindows: rows.filter(r => r.want === 0).length };
      };
      out.levelA = lvl(R.A_pre, R.A_post, 0); out.levelB = lvl(R.B_pre, R.B_post, 1);
      // (a) both faders up: both decks' kicks after their faders, and the master carries both
      // (a) both faders up: in those stretches each record's kicks are in the record and come through its fader
      const segs = []; let sg = null;
      for (const s of tl) { const on = s.g[0] > 0.5 && s.g[1] > 0.5 && s.p[0] && s.p[1]; if (on) { if (!sg) segs.push(sg = { t0: s.t, t1: s.t }); sg.t1 = s.t; } else sg = null; }
      if (segs.length) {
        const inS = t => segs.some(q => t >= q.t0 && t <= q.t1), secs = segs.reduce((a, q) => a + q.t1 - q.t0, 0);
        const gainDb = (pre, post, side) => { let a = 0, b = 0; const s = pre.sr; for (let i = 0; i < pre.x.length; i += 4) { const t = pre.f0 / sr + i / s; if (!inS(t)) continue; const st = at(t); if (!st || !st.l[side]) continue; a += pre.x[i] * pre.x[i]; b += post.x[i] * post.x[i]; } return a > 0 ? Math.round(10 * Math.log10(b / a + 1e-12) * 10) / 10 : null; };
        out.bothUp = { segments: segs.length, seconds: Math.round(secs * 10) / 10, beats: Math.round(secs / beatS), kicksA: kA.filter(inS).length, kicksB: kB.filter(inS).length, throughFaderA_dB: gainDb(R.A_pre, R.A_post, 0), throughFaderB_dB: gainDb(R.B_pre, R.B_post, 1) };
      } else out.bothUp = null;
      // voices: live audio sources (all of the page) while one record plays vs while both do
      const one = tl.filter(s => s.p[0] !== s.p[1]).map(s => s.n), two = tl.filter(s => s.p[0] && s.p[1] && s.g[0] > 0.2 && s.g[1] > 0.2).map(s => s.n);
      const med = a => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : null;
      out.voices = { oneDeckMedian: med(one), bothDecksMedian: med(two), max: Math.max(0, ...tl.map(s => s.n)) };
      const Mx = R.master; let pk = 0, clip = 0; for (let i = 0; i < Mx.l.length; i++) { const a = Math.max(Math.abs(Mx.l[i]), Math.abs(Mx.r[i])); if (a > pk) pk = a; if (a >= 0.999) clip++; }
      out.master = { seconds: Math.round(Mx.l.length / sr), peak: Math.round(pk * 1000) / 1000, peakDb: Math.round(20 * Math.log10(pk) * 10) / 10, clipped: clip };
      window.__R = R;
      return out;
    },
    // 16-bit WAV of the master recording between two audio times (base64)
    wav(t0, t1) {
      const M = window.__R.master, sr = M.sr, i0 = Math.max(0, Math.floor((t0 - M.f0 / sr) * sr)), i1 = Math.min(M.l.length, Math.floor((t1 - M.f0 / sr) * sr)), n = Math.max(0, i1 - i0);
      const buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, M.l[i0 + i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, M.r[i0 + i])) * 32767, true); }
      const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return btoa(s);
    },
    // live audio sources started while the set ran
    djSources(t0, t1) { let n = 0; for (const s of window.__srcLive) if (s.__t0 >= t0 && s.__t0 <= t1) n++; return n; },
    masterRms(sec) { /* quick RMS of the master over the last `sec` via a fresh analyser */ return new Promise(res => { const io = window.BRADY.Sound.musicBus(); if (!io) { res(-200); return; } const c = io.ctx, an = c.createAnalyser(), z = c.createGain(); z.gain.value = 0; an.fftSize = 2048; io.master.connect(an); an.connect(z); z.connect(c.destination); const buf = new Float32Array(2048); let s = 0, n = 0; const iv = setInterval(() => { an.getFloatTimeDomainData(buf); for (const v of buf) { s += v * v; n++; } }, 40); setTimeout(() => { clearInterval(iv); try { io.master.disconnect(an); an.disconnect(); z.disconnect(); } catch (e) { /* ignore */ } res(n ? 10 * Math.log10(s / n + 1e-20) : -200); }, sec * 1000); }); }
  };
};

// ---------------- touch ----------------
class Touch {
  constructor(page, cdp) { this.page = page; this.cdp = cdp; this.pts = new Map(); this.nid = 1; }
  async send(type) { await this.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: Array.from(this.pts.values()) }); }
  async down(x, y) { let id = 0; while (this.pts.has(id)) id++; this.pts.set(id, { x, y, id }); await this.send('touchStart'); return id; }
  async move(id, x, y) { const p = this.pts.get(id); if (!p) return; p.x = x; p.y = y; await this.send('touchMove'); }
  // CDP: touchEnd carries no points; lifting one of several fingers = a move without that finger
  async up(id) { if (!this.pts.has(id)) return; this.pts.delete(id); if (this.pts.size) await this.send('touchMove'); else await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  async releaseAll() { if (!this.pts.size) return; this.pts.clear(); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  async tap(x, y, hold) { const id = await this.down(x, y); await sleep(hold || 50); await this.up(id); }
  // drag from (x0,y0) by (dx,dy) over ms
  async drag(x0, y0, dx, dy, ms, steps) { steps = steps || Math.max(3, Math.round(ms / 30)); const id = await this.down(x0, y0); for (let k = 1; k <= steps; k++) { await sleep(ms / steps); await this.move(id, x0 + dx * k / steps, y0 + dy * k / steps); } await sleep(30); await this.up(id); }
}
const ctr = r => r.r ? { x: r.x, y: r.y } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };

// ---------------- the scripted players ----------------
// every player reads only what the screen shows: the instruction, the highlighted control, the counter, BPMs, the lanes' status
async function playSet(page, T, kind, o) {
  o = o || {};
  const st = () => page.evaluate(() => window.__dj.state());
  const shots = o.shots ? {} : null;
  let s, guard = 0, lastKey = '', startT = Date.now();
  const snap = async (name) => { if (!shots || shots[name]) return; shots[name] = true; await page.screenshot({ path: path.join(OUT, `${o.shots}_${String(Object.keys(shots).length).padStart(2, '0')}_${name}.png`) }); };
  const P = { mixActed: {} };
  while (guard++ < 20000) {
    const tb = Date.now(); s = await st(); const ta = Date.now();
    if (!s) break;
    if (Date.now() - startT > (o.maxMs || 600000)) { check(false, kind + ': set finished in time', { step: s.step, mix: s.mixN }); break; }
    const off = s.off, at = r => { const c = ctr(r); return { x: c.x + off.x, y: c.y + off.y }; };
    const key = s.phase + ':' + s.step + ':' + s.mixN + ':' + (s.tempoOK ? 1 : 0) + (s.lock ? 1 : 0);
    if (key !== lastKey) { lastKey = key; P.k = {}; await T.releaseAll(); if (o.onStep) await o.onStep(s); }
    const K = P.k;
    if (s.phase === 'intro') { await sleep(1200); const b = at(s.startBtn); await T.tap(b.x, b.y); await sleep(300); continue; }
    if (s.phase === 'results') {
      if (shots) { await sleep(1600); await snap('results'); }
      if (!K.done && s.resT > 1.3) { K.done = true; await T.tap(s.port ? 195 : 422, s.port ? 420 : 195); }
      await sleep(200); continue;
    }
    if (s.phase === 'out') { await sleep(150); continue; }
    if (s.paused) { await sleep(150); continue; }
    if (shots) {
      const nm = s.step === 'match' ? (s.tempoOK ? 'match_kicks' : 'match_tempo') : s.step;
      if (s.mixN === 0 || s.step === 'party') { if (!K.shot && (s.step !== 'pick' || (Date.now() - (K.t0 || (K.t0 = Date.now()))) > 1500)) { K.shot = true; await sleep(s.step === 'pick' ? 0 : 400); await snap('mix' + (s.mixN + (s.step === 'party' ? 0 : 1)) + '_' + nm); } }
    }
    if (kind === 'idle') { await sleep(400); continue; }
    const D = s.decks, prep = 1 - s.live, A = D[s.live], Bd = D[prep], exp = kind === 'expert', beg = kind === 'beginner';
    if (s.step === 'warm') { await sleep(200); continue; }
    if (s.step === 'pick') {
      if (s.chosen) { await sleep(150); continue; }
      if (!K.wait) K.wait = Date.now() + (exp ? 1200 : 2500 + rnd() * 2500);
      if (Date.now() < K.wait) { await sleep(150); continue; }
      // the expert takes the card with the most ✓ (the best fit); the beginner reads the marks too, half the time
      const ord = s.cards.map((c, i) => i).sort((a, b) => s.cards[b].q - s.cards[a].q);
      const i = exp ? ord[0] : rnd() < 0.5 ? ord[0] : Math.floor(rnd() * 3);
      const c = at(s.crate[i]); await T.tap(c.x, c.y); await sleep(300); continue;
    }
    if (s.step === 'cue') {
      if (s.toOne === undefined) { await sleep(100); continue; }
      // press when the 1 is heard; the beginner is up to a quarter second off, sometimes a beat late
      if (!K.plan) {
        let e = exp ? gauss() * 12 : gauss() * 160 + (rnd() < 0.2 ? s.beatMs : 0);
        if (o.wreck) e = 0;
        if (s.toOne < 600) { await sleep(100); continue; }      // too close: wait for the next phrase's countdown
        K.plan = { when: (tb + ta) / 2 + s.toOne + e - 8 };
      }
      const wait = K.plan.when - Date.now();
      if (wait > 400) { await sleep(Math.min(300, wait - 350)); continue; }
      await sleep(wait);
      const p = at(s.ctl['play' + prep]); await T.tap(p.x, p.y, 40); K.plan = null; await sleep(300); continue;
    }
    if (s.step === 'match') {
      if (o.wreck) {
        // the trainwreck: skip the matching and push the new record straight in
        if (!K.wrecked) { K.wrecked = true; await sleep(800); const fb = s.ctl['fad' + prep], fa = s.ctl['fad' + s.live], b0 = at(fb), a0 = at(fa), cap = r => (r.y + 12 + (r.h - 24) * (1 - 0)) - (r.y + r.h / 2);
          void cap; const len = fb.h - 20; const idB = await T.down(b0.x, b0.y + (fb.h / 2 - 12) - 2); for (let k = 1; k <= 12; k++) { await sleep(60); await T.move(idB, b0.x, b0.y + (fb.h / 2 - 12) - 2 - len * k / 12); } await T.up(idB); void fa; void a0; }
        await sleep(200); continue;
      }
      if (!s.tempoOK) {
        // pitch fader: read the BPM gap, drag about the right distance (beginner: +-40%), then look again
        if (K.next && Date.now() < K.next) { await sleep(100); continue; }
        const r = s.ctl['pitch' + prep], target = A.bpm / Bd.native - 1, need = target - Bd.pitch;
        const px = -need / 0.16 * (r.h - 16) * (exp ? 1 : 1 + gauss() * 0.4);
        const c = at(r), cy = c.y - (r.h / 2 - 14) * 0 - Bd.pitch / 0.08 * (r.h - 28) / 2;
        await T.drag(c.x, cy, 0, px, exp ? 250 : 500 + rnd() * 400);
        K.next = Date.now() + (exp ? 300 : 700 + rnd() * 600); continue;
      }
      if (!s.lock) {
        // jog: flick it the way the arrow says (the beginner gets it wrong sometimes)
        if (K.next && Date.now() < K.next) { await sleep(100); continue; }
        if (beg && !K.pondered) { K.pondered = true; K.next = Date.now() + 1500 + rnd() * 2500; continue; }
        const j = s.ctl['jog' + prep], c = at(j), dir = (s.rel.ms > 0 ? -1 : 1) * (beg && rnd() < 0.2 ? -1 : 1);
        const amt = Math.min(1, Math.abs(s.rel.ms) / 60);
        // a stroke along the top of the platter: rightwards = clockwise = forward
        await T.drag(c.x - j.r * 0.4 * dir, c.y - j.r * 0.7, j.r * 0.8 * dir * Math.max(0.3, amt), 0, exp ? 160 : 220);
        K.next = Date.now() + (exp ? 350 : 900); continue;
      }
    }
    if (s.step === 'blend') {
      const fb = s.ctl['fad' + prep], fa = s.ctl['fad' + s.live], len = fb.h - 24;
      const capY = (r, v) => r.y + 12 + (r.h - 24) * (1 - v) + off.y, cx = r => r.x + r.w / 2 + off.x;
      if (!K.plan) {
        // expert: waits for a phrase 1, blends over ~4 bars (12 in the audio run: 16+ bars locked) with a bass swap
        // beginner: a second or three, then pushes B up in a few chunks and pulls A down
        const bars = exp ? (o.longBlend ? 12 : 4) : 1.3 + rnd() * 1.5;
        let wait = exp ? s.toOne : 1000 + rnd() * 2000;
        if (exp && wait < 300) wait += 8 * 4 * s.beatMs;
        K.plan = { t0: (tb + ta) / 2 + wait, dur: bars * 4 * s.beatMs };
      }
      const k = (Date.now() - K.plan.t0) / K.plan.dur;
      if (k < 0) { await sleep(Math.min(200, -k * K.plan.dur)); continue; }
      if (exp) {
        // two thumbs: B up over the first 60%, A down over the last 60% (both moving in the middle); LOWs swapped halfway
        if (!K.ids) { if (!Bd.low || !K.killed) { K.killed = true; const l = at(s.ctl['low' + prep]); await T.tap(l.x, l.y); } K.ids = { b: await T.down(cx(fb), capY(fb, Bd.fader)), a: await T.down(cx(fa), capY(fa, A.fader)) }; K.fb0 = capY(fb, Bd.fader); K.fa0 = capY(fa, A.fader); }
        const kb = Math.min(1, k / 0.6), ka = Math.max(0, (k - 0.4) / 0.6);
        await T.move(K.ids.b, cx(fb), K.fb0 - len * kb); await T.move(K.ids.a, cx(fa), K.fa0 + len * Math.min(1, ka));
        if (k > 0.5 && !K.swapped) { K.swapped = true; await T.up(K.ids.b); K.ids.b = null; const l1 = at(s.ctl['low' + prep]), l2 = at(s.ctl['low' + s.live]); await T.tap(l1.x, l1.y); await T.tap(l2.x, l2.y); K.ids.b = await T.down(cx(fb), capY(fb, Bd.fader)); K.fb0 = capY(fb, Bd.fader) + len * kb; }
        if (k >= 1.02) { await T.up(K.ids.b); await T.up(K.ids.a); K.plan.t0 = Infinity; }
        await sleep(40); continue;
      }
      // beginner: three shoves on B, then two on A
      if (!K.n) K.n = 0;
      if (K.n < 3) { await T.drag(cx(fb), capY(fb, Bd.fader), 0, -len * (0.3 + rnd() * 0.15), 300); K.n++; await sleep(300 + rnd() * 500); continue; }
      if (Bd.fader < 0.8) { await T.drag(cx(fb), capY(fb, Bd.fader), 0, -len * 0.5, 250); continue; }
      await T.drag(cx(fa), capY(fa, A.fader), 0, len * (0.5 + rnd() * 0.3), 300); await sleep(300 + rnd() * 400); continue;
    }
    if (s.step === 'party') {
      const pos = s.pos;
      if (exp) {
        // a ROLL in bar 8 (lands on the 1); in later parties a filter sweep let go on the 1
        if (s.mixN % 2 === 1 && pos.pbar === 7 && pos.bib === 1 && !K.roll) { K.roll = true; const p = at(s.ctl.smp2); await T.tap(p.x, p.y); }
        if (s.mixN % 2 === 0 && pos.pbar === 6 && pos.bib === 0 && !K.filt) {
          K.filt = true; const f = s.ctl.filter, c = at(f), id = await T.down(c.x, c.y);
          for (let q = 1; q <= 10; q++) { await sleep(80); await T.move(id, c.x - (f.w / 2 - 12) * q / 10, c.y); }
          // hold until the 1 (heard), then let go
          const s2 = await st(); await sleep(Math.max(0, s2.toOne - 15)); await T.up(id);
        }
      } else if (beg && !K.pad) {
        // the beginner pokes one pad: the one the prompt glows on, or any
        if (!K.at) K.at = Date.now() + 1500 + rnd() * 6000;
        if (Date.now() > K.at) { K.pad = true; const id = s.hint && s.hint.ctl.find(c => /^smp/.test(c)) || 'smp' + Math.floor(rnd() * 4); const p = at(s.ctl[id]); await T.tap(p.x, p.y); }
      }
      await sleep(60); continue;
    }
    await sleep(100);
  }
  return s;
}

// ---------------- page / world ----------------
async function newPage(browser, port) {
  const ctx = await browser.newContext({ viewport: port ? { width: 390, height: 844 } : { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage(); page.setDefaultTimeout(600000);
  const errs = [];
  page.on('pageerror', e => errs.push('PE ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/light pool|GPU stall/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errs, T: new Touch(page, cdp) };
}
async function boot(page, url, opts) {
  opts = opts || {};
  await page.goto(url + 'burning-man/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsDJ, null, { timeout: 120000 });
  await page.evaluate(PAGE);
  await page.evaluate((taught) => { localStorage.clear(); window.BRADY.Save.load(); if (taught) window.BRADY_BURNS.BurnsSave.flag(0, 'djTaught', 1); }, !!opts.taught);
  await page.touchscreen.tap(30, 30);       // the first touch unlocks audio, like on the phone
  await page.evaluate(() => window.BRADY_BURNS.debug.play(11));
  for (let i = 0; i < 200; i++) { const st = await page.evaluate(() => { const s = window.BRADY.Game.scene; return s.state + ':' + s.constructor.name; }); if (st.startsWith('play:BurnsPlay')) break; await sleep(300); }
  for (let i = 0; i < 30; i++) { const busy = await page.evaluate(() => { window.BRADY_BURNS.debug.skipCine(); const s = window.BRADY.Game.scene; return !!s.cine || s.dialog.open; }); if (!busy) break; await sleep(150); }
  await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.banners) s.banners.length = 0; window.__burnsHideHUD = false; });
}
// open a set like World 11's headline (normal), keeping onDone's result
const openHeadline = (page, real) => page.evaluate((real) => {
  const B = window.BRADY_BURNS, g = window.BRADY.Game.scene; window.__done = null; window.__musicBefore = window.BRADY.Sound.currentTrack;
  if (real) { const S0 = B.BW11.headline(g); void S0; const S = B.BurnsDJ.session; const od = S.o.onDone; S.o.onDone = r => { window.__done = r; od(r); }; }
  else { const W = B.BW11.P.wob; B.BurnsDJ.open(g, { title: 'Wobble Dome · Headline Set', bpm: 126, genre: 'house', difficulty: 2, duration: 72, booth: { x: W.x, y: 1.6, z: W.z + 4.2, yaw: 0 }, crowd: { x: B.BW11.P.wobFloor.x, z: B.BW11.P.wobFloor.z, r: 15 }, onDone: r => { window.__done = r; } }); }
  window.__S = B.BurnsDJ.session; { const S = window.__S, c = S.close.bind(S); S.close = () => { window.__setT1 = performance.now(); c(); }; } window.__setT0 = performance.now(); return window.__musicBefore;
}, !!real);

(async () => {
  const { srv, url } = await serve(site);
  // the Mac's GPU (software GL runs the 3D view at ~1 fps, far too slow for touch timing); DJ_SW=1 forces software
  const gl = process.env.DJ_SW ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu'];
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--ignore-gpu-blocklist'].concat(gl) });
  const want = n => !ONLY || ONLY.split(',').indexOf(n) >= 0;
  const errsAll = [];
  const finish = async (P, name) => { errsAll.push(...P.errs.map(e => name + ': ' + e)); check(P.errs.length === 0, name + ': no page errors', P.errs.slice(0, 5)); await P.ctx.close(); };

  /* ---------- audio: expert portrait, measured ---------- */
  if (want('audio')) {
    const P = await newPage(browser, true); await boot(P.page, url, { taught: true });
    const before = await openHeadline(P.page, false);
    // DROP IN, then put the recorders on as soon as the decks exist
    const s0 = await P.page.evaluate(() => window.__dj.state()); const b = ctr(s0.startBtn); await sleep(1200); await P.T.tap(b.x + s0.off.x, b.y + s0.off.y);
    await sleep(300);
    check(await P.page.evaluate(() => window.__dj.tap()), 'audio: recorders on the decks and the master');
    // pause / resume / tab-hide mid-set (during the first pick)
    await P.page.waitForFunction(() => { const s = window.BRADY_BURNS.BurnsDJ.session; return s && s.step === 'pick'; }, null, { timeout: 120000 });
    const beforeDb = await P.page.evaluate(() => window.__dj.masterRms(1.0));
    const pb = await P.page.evaluate(() => window.__dj.state());
    await P.T.tap(pb.pause.x + pb.off.x, pb.pause.y + pb.off.y); await sleep(1500);
    const pausedDb = await P.page.evaluate(() => window.__dj.masterRms(1.0));
    const pausedSrc = await P.page.evaluate(() => { let n = 0; for (const s of window.__srcLive) if (s.__t0 >= window.__setT0) n++; return n; });
    check(pausedDb < -70, 'pause: the decks go silent', { masterDb: Math.round(pausedDb) });
    check(pausedSrc <= 2, 'pause: no DJ voices left running while paused (no stuck notes)', { live: pausedSrc });
    const m0 = ctr(pb.menu[0]); await P.T.tap(m0.x + pb.off.x, m0.y + pb.off.y); await sleep(1500);
    const resumedDb = await P.page.evaluate(() => window.__dj.masterRms(1.0));
    check(resumedDb > beforeDb - 12 && resumedDb > -60, 'resume: the music carries on', { before: Math.round(beforeDb), after: Math.round(resumedDb) });
    const hid = await P.page.evaluate(async () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); const p = window.BRADY_BURNS.BurnsDJ.session.paused; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); await new Promise(r => setTimeout(r, 500)); window.BRADY_BURNS.BurnsDJ.session.setPause(false); return p; });
    check(hid === true, 'tab hidden: the set pauses');
    await sleep(800);
    // play the set: an expert who lets the new record run locked for a phrase before an 8-bar blend (16+ locked bars)
    await playSet(P.page, P.T, 'expert', { longBlend: true, onStep: async (s) => { if (s.step === 'party' && s.mixN >= 1 && !P.analysed) { P.analysed = true; } } });
    const res = await P.page.evaluate(() => window.__done);
    console.log('judged', JSON.stringify(await P.page.evaluate(() => window.__S.judged.map(j => j.what + ':' + j.v.toFixed(2) + (j.auto ? '(auto)' : '')))));
    check(res && res.grade === 'S', 'audio run (expert, portrait): grade S', res && { grade: res.grade, score: res.score });
    await P.page.evaluate(() => { window.__dj.untap(); });
    const A = await P.page.evaluate(() => window.__dj.analyse());
    console.log('AUDIO', JSON.stringify(A));
    // (a) both faders up -> both records' kicks
    check(A.bothUp && A.bothUp.kicksA >= A.bothUp.beats * 0.4 && A.bothUp.kicksB >= A.bothUp.beats * 0.4 && (A.bothUp.throughFaderA_dB === null || A.bothUp.throughFaderA_dB > -10) && (A.bothUp.throughFaderB_dB === null || A.bothUp.throughFaderB_dB > -10), '(a) both faders up: both records\' kicks are in the mix', A.bothUp);
    // (b) locked: within a few ms, 16+ bars, no drift; not locked: they don't line up
    const longest = (A.locked || []).slice().sort((x, y) => y.bars - x.bars)[0];
    check(longest && longest.bars >= 16 && longest.p95Ms <= 3 && Math.abs(longest.driftMsPerBar) < 0.1, '(b) LOCKED: kicks within 3 ms over 16+ bars, no drift', longest);
    // (c) fader levels
    check(A.levelA.p95ErrDb !== null && A.levelA.p95ErrDb < 1 && A.levelB.p95ErrDb < 1 && A.levelA.silentWhenDown && A.levelB.silentWhenDown, '(c) each fader sets its deck\'s level (as drawn), down = silent', { A: A.levelA, B: A.levelB });
    // (d) clipping
    check(A.master.peak < 1 && A.master.clipped === 0, '(d) nothing clips on the master', A.master);
    // WAV of a good mix: from the first PLAY to the end of the first blend + a bit
    const tl = await P.page.evaluate(() => { const T = window.__taps.tl; const play = T.find(s => s.p[1]); const done = T.find((s, i) => i > 0 && T[i - 1].live === 0 && s.live === 1); return { a: play ? play.t - 4 : T[0].t, b: done ? done.t + 12 : T[T.length - 1].t }; });
    fs.writeFileSync(path.join(OUT, 'good_mix.wav'), Buffer.from(await P.page.evaluate(([a, b]) => window.__dj.wav(a, b), [tl.a, tl.b]), 'base64'));
    console.log('wrote', path.join(OUT, 'good_mix.wav'), Math.round(tl.b - tl.a) + ' s');
    // (e) after the set: no DJ voices, world music back
    await P.page.waitForFunction(() => !window.BRADY_BURNS.BurnsDJ.session, null, { timeout: 30000 }).catch(() => {});
    await sleep(6000);
    const left = await P.page.evaluate(() => window.__dj.djSources(window.__setT0, window.__setT1));
    const after = await P.page.evaluate(async () => ({ track: window.BRADY.Sound.currentTrack, db: await window.__dj.masterRms(1.5), open: !!window.BRADY_BURNS.BurnsDJ.session }));
    check(left === 0, '(e) no DJ voices still running after the set', { left });
    check(!after.open && after.track === before && after.db > -50, '(e) the world music is back', { before, after });
    await finish(P, 'audio');
  }

  /* ---------- trainwreck ---------- */
  if (want('wreck')) {
    const P = await newPage(browser, false); await boot(P.page, url, { taught: true });
    await openHeadline(P.page, false);
    const s0 = await P.page.evaluate(() => window.__dj.state()); const b = ctr(s0.startBtn); await sleep(1200); await P.T.tap(b.x + s0.off.x, b.y + s0.off.y); await sleep(300);
    await P.page.evaluate(() => window.__dj.tap());
    // play until the wreck has run a while, then measure and leave
    const runner = playSet(P.page, P.T, 'beginner', { wreck: true, maxMs: 200000 });
    await P.page.waitForFunction(() => { const s = window.BRADY_BURNS.BurnsDJ.session; return s && s.wrecks > 0 && s.wreckT > 9; }, null, { timeout: 200000 }).catch(() => {});
    const w = await P.page.evaluate(() => { const S = window.BRADY_BURNS.BurnsDJ.session; return { wrecks: S.wrecks, energy: S.energy, red: S.redK, hint: S.hint && S.hint.title, big: S.big && S.big.title }; });
    await P.page.screenshot({ path: path.join(OUT, 'L_trainwreck.png') });
    check(w.wrecks >= 1 && /TRAINWRECK/.test(w.hint || ''), 'trainwreck: faders up without matching = TRAINWRECK (visible, crowd reacts)', w);
    await P.page.evaluate(() => window.__dj.untap());
    const A = await P.page.evaluate(() => window.__dj.analyse());
    console.log('WRECK', JSON.stringify({ unlocked: A.unlocked, bothUp: A.bothUp, master: A.master }));
    check(A.unlocked.kicks >= 8 && A.unlocked.within3ms / A.unlocked.kicks < 0.2, '(b) not locked: the two kicks don\'t line up', A.unlocked);
    const tl = await P.page.evaluate(() => { const T = window.__taps.tl; const play = T.find(s => s.p[1]); return { a: play ? play.t - 3 : T[0].t, b: T[T.length - 1].t }; });
    fs.writeFileSync(path.join(OUT, 'trainwreck.wav'), Buffer.from(await P.page.evaluate(([a, b]) => window.__dj.wav(a, b), [tl.a, tl.b]), 'base64'));
    console.log('wrote', path.join(OUT, 'trainwreck.wav'), Math.round(tl.b - tl.a) + ' s');
    // leave from the pause menu (forfeit) so the runner ends
    const s1 = await P.page.evaluate(() => window.__dj.state()); await P.T.tap(s1.pause.x + s1.off.x, s1.pause.y + s1.off.y); await sleep(600);
    const m2 = ctr(s1.menu[2]); await P.T.tap(m2.x + s1.off.x, m2.y + s1.off.y);
    await runner;
    const d = await P.page.evaluate(() => window.__done);
    check(d && d.forfeit && d.trainwrecks >= 1, 'forfeit after a trainwreck: onDone(forfeit) with the trainwreck counted', d && { grade: d.grade, forfeit: d.forfeit, trainwrecks: d.trainwrecks });
    await finish(P, 'wreck');
  }

  /* ---------- beginners, both orientations, the real story mission, screenshots of every step ---------- */
  for (const port of [true, false]) {
    const name = 'beginner' + (port ? 'P' : 'L');
    if (!want(name)) continue;
    const P = await newPage(browser, port); await boot(P.page, url, { taught: false });
    await P.page.evaluate(() => { const g = window.BRADY.Game.scene; g.missions.start('set', true); });
    await openHeadline(P.page, true);
    await sleep(800); await P.page.screenshot({ path: path.join(OUT, (port ? 'P' : 'L') + '_00_intro.png') });
    await playSet(P.page, P.T, 'beginner', { shots: port ? 'P' : 'L' });
    const r = await P.page.evaluate(() => window.__done);
    check(r && ['S', 'A', 'B'].indexOf(r.grade) >= 0, name + ': a clumsy beginner passes the Wobble Dome headline (B or better, normal)', r && { grade: r.grade, score: r.score, acc: r.accuracy, wrecks: r.trainwrecks, clean: r.cleanMixes });
    // the story carries on: the mission completes after the cutscene
    for (let i = 0; i < 60; i++) { const done = await P.page.evaluate(() => { try { window.BRADY_BURNS.debug.skipCine(); const g = window.BRADY.Game.scene; return g.missions ? g.missions.isDone('set') : true; } catch (e) { return true; } }); if (done) break; await sleep(250); }
    check(await P.page.evaluate(() => { const g = window.BRADY.Game.scene; return !g.missions || g.missions.isDone('set') || g.constructor.name !== 'BurnsPlayScene'; }), name + ': the headline mission completes');
    await finish(P, name);
  }

  /* ---------- idle ---------- */
  if (want('idle')) {
    const P = await newPage(browser, true); await boot(P.page, url, { taught: true });
    await P.page.evaluate(() => { const B = window.BRADY_BURNS, g = window.BRADY.Game.scene, L = B.BW11.P.loop; window.__done = null; B.BurnsDJ.open(g, { title: 'Idle Test', bpm: 124, genre: 'house', difficulty: 2, duration: 50, booth: { x: L.x, y: 0.5, z: L.z + 0.35, yaw: Math.PI }, onDone: r => { window.__done = r; } }); });
    const t0 = Date.now();
    const s = await playSet(P.page, P.T, 'idle', { maxMs: 600000 });
    const r = await P.page.evaluate(() => window.__done);
    check(!!r && !r.forfeit, 'idle: a player who does nothing still reaches the results card', { secs: Math.round((Date.now() - t0) / 1000), last: s && s.step });
    check(r && (r.grade === 'D' || r.grade === 'C'), 'idle: low grade', r && { grade: r.grade, score: r.score });
    await finish(P, 'idle');
  }

  /* ---------- expert landscape ---------- */
  if (want('expertL')) {
    const P = await newPage(browser, false); await boot(P.page, url, { taught: true });
    await openHeadline(P.page, false);
    await playSet(P.page, P.T, 'expert', {});
    const r = await P.page.evaluate(() => window.__done);
    check(r && r.grade === 'S', 'expert (landscape, normal): grade S', r && { grade: r.grade, score: r.score, acc: r.accuracy });
    await finish(P, 'expertL');
  }

  /* ---------- the DJ-off (easy) ---------- */
  if (want('djoff')) {
    const P = await newPage(browser, true); await boot(P.page, url, { taught: true });
    await P.page.evaluate(() => { const B = window.BRADY_BURNS, g = window.BRADY.Game.scene; g.missions.start('djoff', true); B.BW11.djoff(g); const S = B.BurnsDJ.session; const od = S.o.onDone; S.o.onDone = r => { window.__done = r; od(r); }; });
    const tier = await P.page.evaluate(() => window.BRADY_BURNS.BurnsDJ.session.tier);
    check(tier === 0, 'DJ-off (difficulty 1) plays on easy', { tier });
    await playSet(P.page, P.T, 'beginner', {});
    const r = await P.page.evaluate(() => window.__done);
    check(r && r.grade !== 'D' && !r.forfeit, 'DJ-off: a beginner passes (C or better)', r && { grade: r.grade, score: r.score });
    for (let i = 0; i < 80; i++) { const done = await P.page.evaluate(() => { const g = window.BRADY.Game.scene; if (g.dialog && g.dialog.open) g.dialog.next(); window.BRADY_BURNS.debug.skipCine(); return g.missions.isDone('djoff'); }); if (done) break; await sleep(200); }
    check(await P.page.evaluate(() => window.BRADY.Game.scene.missions.isDone('djoff')), 'DJ-off: the mission completes');
    await finish(P, 'djoff');
  }

  /* ---------- forfeit ---------- */
  if (want('forfeit')) {
    const P = await newPage(browser, false); await boot(P.page, url, { taught: true });
    const before = await openHeadline(P.page, false);
    const s0 = await P.page.evaluate(() => window.__dj.state()); const b = ctr(s0.startBtn); await sleep(1200); await P.T.tap(b.x + s0.off.x, b.y + s0.off.y);
    await sleep(6000);
    const s1 = await P.page.evaluate(() => window.__dj.state()); await P.T.tap(s1.pause.x + s1.off.x, s1.pause.y + s1.off.y); await sleep(500);
    await P.page.screenshot({ path: path.join(OUT, 'L_pause.png') });
    const m2 = ctr(s1.menu[2]); await P.T.tap(m2.x + s1.off.x, m2.y + s1.off.y); await sleep(2500);
    await P.T.tap(422, 195); await sleep(2500);
    const r = await P.page.evaluate(() => window.__done);
    const after = await P.page.evaluate(async () => ({ track: window.BRADY.Sound.currentTrack, db: await window.__dj.masterRms(1.5), open: !!window.BRADY_BURNS.BurnsDJ.session, state: window.BRADY.Game.scene.state }));
    check(r && r.forfeit === true, 'forfeit: LEAVE THE BOOTH ends the set with forfeit', r && { grade: r.grade, forfeit: r.forfeit });
    check(!after.open && after.track === before && after.db > -50 && after.state === 'play', 'forfeit: back in the world with its music', { before, after });
    await finish(P, 'forfeit');
  }

  await browser.close(); srv.close();
  console.log(fails.length ? `\n${fails.length} FAILED:\n  ` + fails.join('\n  ') : '\nALL PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
