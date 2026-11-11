// Real-time cost of the music scheduler on the main thread: plays each song for N seconds in a live
// AudioContext (Chromium or WebKit) and times every scheduler tick (which includes building every voice
// and, for v2 songs, rendering plucked-string buffers on first use). Also counts audio nodes created.
// usage: node cpu.js <engine.js> <defs.json> <seconds> <browser> song...
const fs = require('fs'), path = require('path');
const PW = require('/Users/bradymott/brady-o/node_modules/playwright');
const [engine, defsFile, secs, br, ...songs] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(defsFile, 'utf8')), src = fs.readFileSync(engine, 'utf8');
(async () => {
  const browser = await PW[br].launch(br === 'chromium' ? { args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  const out = [];
  for (const name of songs) {
    const page = await browser.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('about:blank');
    const r = await page.evaluate(async ({ src, name, def, secs }) => {
      let nodes = 0;
      const BA = window.BaseAudioContext || window.AudioContext || window.webkitAudioContext;
      for (const k of ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource', 'createStereoPanner', 'createWaveShaper', 'createBuffer']) {
        const f = BA.prototype[k]; if (f) BA.prototype[k] = function () { nodes++; return f.apply(this, arguments); };
      }
      const times = [], late = []; let maxGap = 0; const T0 = performance.now();
      const si = (fn, ms) => setInterval(() => { const t0 = performance.now(); fn(); const d = performance.now() - t0; times.push(d); if (t0 - T0 > secs * 500) late.push(d); }, ms);
      const S = new Function('window', 'setInterval', src + '\n;return Sound;')(window, si);
      if (def) S.addTrack(name, def);
      S.setMusicVolume(0.6); S.unlock(); S.music(name);
      await new Promise(r => setTimeout(r, secs * 1000));
      S.stopMusic();
      const tt = times.slice().sort((a, b) => a - b), tot = tt.reduce((a, b) => a + b, 0);
      return { name, ticks: tt.length, msPerSec: tot / secs, steadyMsPerSec: late.reduce((a, b) => a + b, 0) / (secs / 2), p99: tt[Math.floor(tt.length * 0.99)], max: tt[tt.length - 1], nodesPerSec: nodes / secs };
    }, { src, name, def: D.defs.sbw[name] || null, secs: +secs });
    r.errors = errs; out.push(r);
    console.log(`${br} ${name.padEnd(16)} scheduler ${r.msPerSec.toFixed(2)} ms/s (2nd half ${r.steadyMsPerSec.toFixed(2)})  tick p99 ${r.p99.toFixed(2)} ms  max ${r.max.toFixed(2)} ms  nodes ${r.nodesPerSec.toFixed(0)}/s ${errs.length ? 'ERR ' + errs.join(';') : ''}`);
    await page.close();
  }
  await browser.close();
})();
