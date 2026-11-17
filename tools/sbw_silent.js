// Silent browser tests: headless Chrome and WebKit still play the game's music out of the Mac's speakers.
// silence(contextOrPage) adds an init script (runs before the game's own code on every page load) that sends every
// real-time AudioContext's output through a gain of exactly 0, and mutes <audio>/<video>. The game itself is not
// changed: it builds the same nodes and runs on the same clock; only what reaches the speakers is zero.
// OfflineAudioContext renders (tools/sbw_audio_test.js) are left alone by design.
// From inside the page: window.__sbwSilent.report() -> { contexts, gains: [0, ...], direct: 0, media: n }.
// usage: const { silence } = require('./sbw_silent'); await silence(ctx);   // before page.goto
// BRADY_SOUND=1 turns it off (to listen on purpose).
const SCRIPT = `(() => {
  if (window.__sbwSilent) return;
  const W = window, Base = W.BaseAudioContext || W.AudioContext || W.webkitAudioContext;
  const Offline = W.OfflineAudioContext || W.webkitOfflineAudioContext;
  const st = { contexts: 0, mutes: [], direct: 0, media: 0 };
  W.__sbwSilent = st;
  st.report = () => ({ contexts: st.contexts, gains: st.mutes.map(m => m.gain.value), direct: st.direct, media: st.media });
  if (Base) {
    const P = Base.prototype;
    let owner = P, d = null;
    while (owner && !(d = Object.getOwnPropertyDescriptor(owner, 'destination'))) owner = Object.getPrototypeOf(owner);
    if (d && d.get) {
      const real = d.get, mutes = new WeakMap(), reals = new WeakSet();
      const offline = c => Offline && c instanceof Offline;
      const muteOf = c => {
        let m = mutes.get(c);
        if (!m) { const r = real.call(c); reals.add(r); m = c.createGain(); m.gain.value = 0; mutes.set(c, m); st.mutes.push(m); st.contexts++; m.connect(r); }
        return m;
      };
      Object.defineProperty(owner, 'destination', { configurable: true, enumerable: d.enumerable, get() { return offline(this) ? real.call(this) : muteOf(this); } });
      // belt and braces: anything that still reaches a real destination directly is rerouted through the mute
      const AN = (W.AudioNode || {}).prototype, conn = AN && AN.connect;
      if (conn) AN.connect = function (dest) {
        if (dest && reals.has(dest) && !st.mutes.includes(this)) { st.direct++; arguments[0] = muteOf(this.context); }
        return conn.apply(this, arguments);
      };
    }
  }
  const M = W.HTMLMediaElement && W.HTMLMediaElement.prototype;
  if (M && M.play) { const play = M.play; M.play = function () { this.muted = true; this.volume = 0; st.media++; return play.apply(this, arguments); }; }
})();`;

async function silence(target) {
  if (process.env.BRADY_SOUND === '1' || !target || !target.addInitScript) return target;
  await target.addInitScript(SCRIPT);
  return target;
}
// page side: how many real-time contexts exist, and is each one's output gain zero
async function silentReport(page) { return page.evaluate(() => window.__sbwSilent ? window.__sbwSilent.report() : null); }
module.exports = { silence, silentReport, SCRIPT };
