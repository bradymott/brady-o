// Burning Man soundtrack test: every house track is rendered offline (OfflineAudioContext, headless Chromium)
// through a copy of Sound's master chain, then measured: tempo, a kick on every beat, peak/loudness,
// spectrum balance, silence, and continuity across the loop seam. Also checks that every world and every
// music name the game asks for resolves to a house track, and that the live sequencer plays them.
// usage: node tools/burns_music_test.js [--wav <dir>] [--secs 32] [--only bm_title,bm_cityday]
//        (BRADY_DIST=<folder> for a private build). Exits 1 on any failure.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const WAV = arg('--wav', null), SECS = +arg('--secs', 32), ONLY = arg('--only', null);
const DIST = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const URL = 'file://' + path.join(DIST, 'site/burning-man/index.html');
const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); return c; };

// ---------- analysis (runs in the page so the audio never crosses the wire) ----------
function analyse(L, R, sr, o) {
  const N = L.length, db = x => 20 * Math.log10(Math.max(1e-12, x));
  const mono = new Float32Array(N); for (let i = 0; i < N; i++) mono[i] = 0.5 * (L[i] + R[i]);
  const biq = (x, type, f, q, gainDb) => {
    const w = 2 * Math.PI * f / sr, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), A = Math.pow(10, (gainDb || 0) / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
    else { const sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq); a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; }
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x0; y2 = y1; y1 = y0; y[i] = y0; }
    return y;
  };
  const skip = Math.floor(sr * (o.skip || 0.6));
  // peak / rms
  let pk = 0, ss = 0; for (let i = 0; i < N; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > pk) pk = a; if (i >= skip) ss += 0.5 * (L[i] * L[i] + R[i] * R[i]); }
  const rms = Math.sqrt(ss / Math.max(1, N - skip));
  // loudness (BS.1770-style K-weighting, 400 ms blocks, absolute + relative gates)
  const kw = x => biq(biq(x, 'shelf', 1681.97, 0.7071, 3.9998), 'hp', 38.13, 0.5003);
  const KL = kw(L), KR = kw(R), blk = Math.floor(sr * 0.4), hop = Math.floor(sr * 0.1), bl = [];
  for (let s = skip; s + blk <= N; s += hop) { let e = 0; for (let i = s; i < s + blk; i++) e += KL[i] * KL[i] + KR[i] * KR[i]; bl.push(e / blk); }
  const lu = e => -0.691 + 10 * Math.log10(Math.max(1e-12, e));
  let g1 = bl.filter(e => lu(e) > -70), m1 = g1.reduce((a, b) => a + b, 0) / Math.max(1, g1.length);
  const g2 = g1.filter(e => lu(e) > lu(m1) - 10), lufs = lu(g2.reduce((a, b) => a + b, 0) / Math.max(1, g2.length));
  // quietest 2 s window (silence check)
  let minWin = 0; { const w = sr * 2; let best = Infinity; for (let s = skip; s + w <= N; s += sr / 2) { let e = 0; for (let i = s; i < s + w; i += 4) e += mono[i] * mono[i]; best = Math.min(best, Math.sqrt(e / (w / 4))); } minWin = db(best); }
  // spectrum: averaged Hann FFT
  const F = 8192, re = new Float64Array(F), im = new Float64Array(F), pw = new Float64Array(F / 2), win = new Float64Array(F);
  for (let i = 0; i < F; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / F);
  const fft = () => { for (let i = 1, j = 0; i < F; i++) { let bit = F >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= F; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < F; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } } };
  let frames = 0;
  for (let s = skip; s + F <= N; s += F / 2) { for (let i = 0; i < F; i++) { re[i] = mono[s + i] * win[i]; im[i] = 0; } fft(); for (let k = 0; k < F / 2; k++) pw[k] += re[k] * re[k] + im[k] * im[k]; frames++; }
  const bands = { sub: [20, 60], bass: [60, 250], mid: [250, 2000], high: [2000, 8000], air: [8000, 20000] }, share = {}; let tot = 0;
  for (const b in bands) { let e = 0; for (let k = 0; k < F / 2; k++) { const f = k * sr / F; if (f >= bands[b][0] && f < bands[b][1]) e += pw[k]; } share[b] = e; tot += e; }
  for (const b in share) share[b] = Math.round(1000 * share[b] / Math.max(1e-20, tot)) / 10;
  // onset envelope from the low band (kick), 5 ms hops
  const lo = biq(biq(mono, 'lp', 120, 0.7), 'lp', 120, 0.7), H = Math.floor(sr * 0.005), env = [];
  for (let s = 0; s + H <= N; s += H) { let e = 0; for (let i = s; i < s + H; i++) e += lo[i] * lo[i]; env.push(Math.sqrt(e / H)); }
  const on = env.map((v, i) => i ? Math.max(0, Math.log(1e-6 + v) - Math.log(1e-6 + env[i - 1])) : 0);
  // tempo: autocorrelation of the onset curve; refine on the 4-beat lag
  let bpm = 0, conf = 0;
  if (o.bpm) {
    const acf = lag => { let a = 0; for (let i = Math.floor(skip / H); i + lag < on.length; i++) a += on[i] * on[i + lag]; return a; };
    const hz = sr / H; let best = -1, bl1 = 0;
    for (let lag = Math.floor(hz * 60 / 150); lag <= Math.ceil(hz * 60 / 90); lag++) { const a = acf(lag); if (a > best) { best = a; bl1 = lag; } }
    let b4 = -1, l4 = 0; for (let lag = bl1 * 4 - 6; lag <= bl1 * 4 + 6; lag++) { const a = acf(lag); if (a > b4) { b4 = a; l4 = lag; } }
    const am = acf(l4 - 1), ap = acf(l4 + 1), d = (am - ap) / (2 * (am - 2 * b4 + ap) || 1);
    bpm = 240 / ((l4 + d) / hz); conf = best / Math.max(1e-9, acf(Math.floor(bl1 * 1.5)));
  }
  // kicks where the arrangement says: low band jumps at each expected time
  let kHit = 0, kMiss = []; const kt = o.kicks || [];
  for (const t of kt) {
    const i = Math.round(t * sr / H); if (i < 8 || i + 8 >= env.length) { kHit++; continue; }
    let before = 0, after = 0; for (let k = i - 6; k < i - 1; k++) before = Math.max(before, env[k]); for (let k = i; k < i + 6; k++) after = Math.max(after, env[k]);
    if (after > before * 1.6) kHit++; else kMiss.push(Math.round(t * 100) / 100);
  }
  // seam: level before vs after, and the largest sample jump near it vs elsewhere
  let seam = null;
  if (o.seamT) {
    const i0 = Math.floor(o.seamT * sr), w = Math.floor(o.barSec * 2 * sr);
    const r = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += mono[i] * mono[i]; return Math.sqrt(e / (b - a)); };
    const hpS = biq(mono, 'hp', 4000, 0.7), jumps = []; for (let i = 1; i < N; i++) jumps.push(Math.abs(hpS[i] - hpS[i - 1]));
    let near = 0; for (let i = i0 - Math.floor(sr * 0.05); i < i0 + Math.floor(sr * 0.05); i++) near = Math.max(near, jumps[i]);
    const sorted = jumps.slice(skip).sort((a, b) => a - b), p999 = sorted[Math.floor(sorted.length * 0.999)], mx = sorted[sorted.length - 1];
    seam = { before: db(r(i0 - w, i0)), after: db(r(i0, i0 + w)), jumpNear: near, jumpP999: p999, jumpMax: mx };
  }
  return { peak: db(pk), rms: db(rms), lufs, minWin, share, bpm, conf, kicks: kt.length, kHit, kMiss: kMiss.slice(0, 6), seam };
}

module.exports = { analyse };
if (require.main === module) (async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 874, height: 402 } })).newPage(); page.setDefaultTimeout(600000);
  const errs = []; page.on('pageerror', e => errs.push('PE ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await page.goto(URL); await page.waitForTimeout(2500);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the game loop: the renders need the CPU
  await page.evaluate(`window.__an = ${analyse.toString()}`);
  const H = await page.evaluate(() => { const B = window.BRADY_BURNS.BurnsHouse; return { names: B.names, info: B.names.map(n => B.info(n)) }; });
  const names = ONLY ? ONLY.split(',') : H.names;
  ok(H.names.length >= 25, 'expected 25+ house tracks, got ' + H.names.length);

  // ---- 1. every world and every music name in the code resolves to a house track ----
  const R = await page.evaluate(() => {
    const B = window.BRADY_BURNS, W = B.BurnsWorlds.defs, out = [];
    for (const id of Object.keys(W)) { const m = W[id].music || ('burns_w' + id); out.push([id, W[id].name, m, B.BurnsHouse.resolve(m)]); }
    return out;
  });
  for (const [id, nm, m, r] of R) ok(r && H.names.indexOf(r) >= 0, `world ${id} ${nm}: music ${m} -> ${r}`);
  const used = new Set();
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'src')).filter(f => /^4[0-2]_burns_/.test(f))) {
    const s = fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
    for (const re of [/burnsMusic\('([a-z0-9_]+)'/g, /\bmusic: '([a-z0-9_]+)'/g, /\bswell: '([a-z0-9_]+)'/g, /BW16\.track\('([a-z0-9_]+)'/g, /burnsMusic\(BW16\.track\('([a-z0-9_]+)'/g]) for (const m of s.matchAll(re)) used.add(m[1]);
  }
  used.add('burns_w17n'); used.add('burns_hub');
  const unres = await page.evaluate(list => list.filter(n => { const r = window.BRADY_BURNS.BurnsHouse.resolve(n); return !r || !window.BRADY_BURNS.BurnsHouse.TRK[r]; }), [...used]);
  ok(!unres.length, 'music names with no house track: ' + unres.join(', '));
  console.log(`worlds: ${R.length} resolve; music names used in code: ${used.size} (${unres.length} unresolved)`);
  console.log(R.map(([id, nm, m, r]) => `  ${String(id).padStart(3)} ${nm.padEnd(32)} ${m.padEnd(16)} -> ${r}`).join('\n'));

  // ---- 2. render + measure every track ----
  const rows = [];
  for (const name of names) {
    const inf = H.info.find(i => i.name === name), beat = !!inf.sections.find(s => s.layers.some(l => /^kick/.test(l)));
    const res = await page.evaluate(async ([name, secs, wantWav]) => {
      const B = window.BRADY_BURNS.BurnsHouse, T = B.info(name), sd = 60 / (T.bpm * 4);
      secs = Math.min(60, Math.max(secs, T.introSteps * sd + 26));   // tracks with an intro: hear it and ~26 s of the groove after
      const r = await B.renderOffline(name, { secs });
      const kicks = B.kickTimes(name, 0, secs - 0.3);
      const a = window.__an(r.L, r.R, r.sr, { bpm: T.bpm, kicks });
      // the loop seam: start 8 bars before the end of the loop, render 16 bars
      const st = T.introSteps + T.loopSteps - 8 * 16, s2 = 16 * 16 * sd + 0.3;
      const r2 = await B.renderOffline(name, { secs: s2, startStep: st });
      const a2 = window.__an(r2.L, r2.R, r2.sr, { skip: 0.5, seamT: 0.02 + 8 * 16 * sd, barSec: 16 * sd, bpm: T.bpm, kicks: B.kickTimes(name, st, s2 - 0.3) });
      let wav = null;
      if (wantWav) { const n = r.L.length, b = new Int16Array(n * 2); for (let i = 0; i < n; i++) { b[2 * i] = Math.max(-1, Math.min(1, r.L[i])) * 32767; b[2 * i + 1] = Math.max(-1, Math.min(1, r.R[i])) * 32767; } let s = ''; const u = new Uint8Array(b.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); wav = btoa(s); }
      return { a, seam: a2.seam, seamK: [a2.kicks, a2.kHit], sr: r.sr, wav };
    }, [name, SECS, !!WAV]);
    if (WAV && res.wav) {
      fs.mkdirSync(WAV, { recursive: true });
      const pcm = Buffer.from(res.wav, 'base64'), h = Buffer.alloc(44);
      h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
      h.writeUInt32LE(res.sr, 24); h.writeUInt32LE(res.sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
      fs.writeFileSync(path.join(WAV, name + '.wav'), Buffer.concat([h, pcm]));
    }
    const a = res.a, s = res.seam;
    rows.push({ name, inf, a, s, beat, seamK: res.seamK });
    // ---- assertions per track ----
    ok(a.peak < -1, `${name}: peak ${a.peak.toFixed(1)} dBFS (want < -1)`);
    ok(a.rms > -40, `${name}: silent? rms ${a.rms.toFixed(1)} dBFS`);
    ok(a.minWin > -55, `${name}: a 2 s window is near-silent (${a.minWin.toFixed(1)} dBFS)`);
    if (beat) {
      ok(Math.abs(a.bpm - inf.bpm) < 0.6, `${name}: tempo ${a.bpm.toFixed(2)} BPM, want ${inf.bpm}`);
      ok(a.kicks > 0 && a.kHit / a.kicks >= 0.97, `${name}: kicks detected ${a.kHit}/${a.kicks} (missed at ${a.kMiss.join(', ')})`);
      ok(a.share.sub + a.share.bass >= 25 && a.share.sub + a.share.bass <= 85, `${name}: low end share ${(a.share.sub + a.share.bass).toFixed(1)}% (want 25-85)`);
      ok(a.share.mid >= 6, `${name}: mids ${a.share.mid}% (want >= 6)`);
      ok(a.share.high + a.share.air >= 0.4, `${name}: highs ${(a.share.high + a.share.air).toFixed(1)}% (want >= 0.4)`);
      ok(res.seamK[0] === 0 || res.seamK[1] / res.seamK[0] >= 0.97, `${name}: seam kicks ${res.seamK[1]}/${res.seamK[0]}`);
    } else {
      ok(a.kicks === 0, `${name}: beatless track has kicks`);
      ok(a.share.mid + a.share.high >= 10, `${name}: ambient bed too dark/thin`);
    }
    // the engine never restarts audio at the loop (scheduling is continuous), so the seam is musical: no dropout,
    // no level cliff beyond an intended drop, and no transient there unless the next section opens with a crash
    const loopFirst = inf.sections.find(x => x.kind === 'loop'), crash = loopFirst && loopFirst.fx.some(f => f === 'crash' || f === 'boom');
    ok(s.after > -45 && s.before > -45, `${name}: dropout at the loop seam (${s.before.toFixed(1)} / ${s.after.toFixed(1)} dB)`);
    ok(Math.abs(s.after - s.before) < (crash ? 12 : 6), `${name}: seam level jump ${(s.after - s.before).toFixed(1)} dB`);
    ok(crash || s.jumpNear < s.jumpP999 * 3, `${name}: click at the loop seam (jump ${s.jumpNear.toFixed(4)} vs p99.9 ${s.jumpP999.toFixed(4)})`);
    console.log(`${name.padEnd(14)} ${String(inf.bpm).padStart(3)}bpm ${(inf.key || '').padEnd(11)} measured ${beat ? a.bpm.toFixed(2).padStart(6) : '  --  '} | peak ${a.peak.toFixed(1).padStart(5)} rms ${a.rms.toFixed(1).padStart(5)} LUFS ${a.lufs.toFixed(1).padStart(5)} | kicks ${a.kHit}/${a.kicks} | sub ${a.share.sub} bass ${a.share.bass} mid ${a.share.mid} high ${a.share.high} air ${a.share.air} | seam ${(s.after - s.before).toFixed(1)}dB jump ${(s.jumpNear / Math.max(1e-9, s.jumpP999)).toFixed(2)}x`);
  }
  // loudness consistency
  const beatL = rows.filter(r => r.beat).map(r => r.a.lufs).sort((a, b) => a - b), med = beatL[Math.floor(beatL.length / 2)];
  for (const r of rows) {
    const lim = r.beat ? [-2.5, 2.5] : [-7, 1.5];
    ok(r.a.lufs - med >= lim[0] && r.a.lufs - med <= lim[1], `${r.name}: loudness ${r.a.lufs.toFixed(1)} LUFS vs median ${med.toFixed(1)} (allowed ${lim.join('..')})`);
  }
  if (beatL.length) console.log(`loudness: beat tracks ${beatL[0].toFixed(1)}..${beatL[beatL.length - 1].toFixed(1)} LUFS (median ${med.toFixed(1)})`);

  // ---- 3. live: the real sequencer plays a routed track, switches, pauses and resumes ----
  if (!ONLY) {
    const live = await page.evaluate(async () => {
      const B = window.BRADY_BURNS, S = window.BRADY.Sound || (typeof Sound !== 'undefined' ? Sound : null), out = {};
      const snd = S || window.Sound; if (!snd) return { err: 'no Sound' };
      snd.unlock();
      const wait = ms => new Promise(r => setTimeout(r, ms));
      out.validate = snd._validate();
      B.BurnsHouse.cityNight = false;
      window.BRADY_BURNS.debug && 0;
      const bm = n => { try { window.BRADY_BURNS.burnsMusic(n); } catch (e) { out.err = String(e); } };
      bm('burns_w7'); await wait(900); out.a = [snd.currentTrack, B.BurnsHouse.live];
      bm('burns_hub'); await wait(900); out.b = [snd.currentTrack, B.BurnsHouse.live];
      B.BurnsHouse.setCityNight(true); await wait(900); out.c = [snd.currentTrack, B.BurnsHouse.live];
      snd.suspend(); const n0 = B.BurnsHouse.live.n; await wait(600); out.paused = B.BurnsHouse.live.n - n0;
      snd.resume(); await wait(900); out.resumed = B.BurnsHouse.live.n - n0;
      bm('man_boss'); await wait(600); out.d = [snd.currentTrack, B.BurnsHouse.live];
      bm(null); await wait(300); out.e = snd.currentTrack;
      B.BurnsHouse.setCityNight(false);
      return out;
    });
    console.log('live:', JSON.stringify(live));
    ok(live.a && live.a[0] === 'bm_sunrise' && live.a[1] && live.a[1].name === 'bm_sunrise' && live.a[1].n > 4, 'live: burns_w7 should play bm_sunrise');
    ok(live.b && live.b[0] === 'bm_cityday', 'live: the city by day plays bm_cityday');
    ok(live.c && live.c[0] === 'bm_citynight', 'live: the city at night plays bm_citynight');
    ok(live.paused <= 2 && live.resumed > 3, `live: pause/resume (steps while paused ${live.paused}, after resume ${live.resumed})`);
    ok(live.d && live.d[0] === 'bm_man', 'live: man_boss plays bm_man');
    ok(!live.e, 'live: stopping music');
    ok(live.validate && Object.keys(live.validate).every(k => !/^bm_/.test(k)), 'Sound._validate flags a house track');
  }
  ok(!errs.length, 'page errors: ' + errs.slice(0, 5).join(' | '));
  await browser.close();
  console.log(fails.length ? `\nFAIL (${fails.length}):\n  ` + fails.join('\n  ') : '\nPASS: all house tracks measured clean');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
