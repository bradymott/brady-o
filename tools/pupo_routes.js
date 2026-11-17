// Pupo route scripts (docs/design/PUPO.md §7.6, "scripted runs"): for each Pupo obstacle and Pupo-only bonus in a
// shipped level, a short scripted ride through the real level, played by tools/sbw_pupo_routes_test.js (Node, the game
// modules in a VM) and tools/sbw_pupo_shots.js (the built game in WebKit, with screenshots at every `shot` step).
// They cover what the level checker only approximates: the snatch timing, the swing release, the bar shimmy in the
// wind, the climb's pull-up, the pull handle.
//
// A route: { name, level, start: { box: n } (Brady beside the level's n-th Nap Box, by x; he opens it and gets on),
//   boxShot: a name for the shots of the box shut and Pupo's yawn, safe (Brady can't be hurt: enemies and presses still
//   act), steps: [...] }
// Steps (each runs at the game's fixed 1/120 s step; `until` and `check` are expressions over the state S below):
//   { run: 1|-1, until, max }          hold right / left; a little bot jumps gaps and walls ahead (held jump)
//   { hold: { right, up, ... }, until, max, press: 'action'|'jump'|'down', every }   hold keys, press one now and then
//   { grab: { up, right... }, until, max }   aim with the stick and press Action whenever the paw marker shows a target
//   { swing: 1|-1, until, max }        swing hand to hand: Action at the next hook, Jump to let go toward the far side
//   { put: [tx, feetRow] }              move Brady (and Pupo, if ridden) to stand at that tile (skips a stretch)
//   { wait: s }, { check: expr, name }, { shot: name }   (a shot is taken by the browser tool; the Node test skips it)
// S: x, y (tiles: Brady's centre and his feet), mode (Pupo's: '', 'swing', 'climb', 'hang'...), ride, ground, dead,
//    drowsy, key (a function: key('goldpod')), coins (the coin count), area (the area id), t (route seconds), riding
//    (seconds on Pupo so far), meter, text (the last floating line said near Brady)
// Owner of the entries: the land's Pupo group (P2-G1: ec, br, mz).
const ROUTES = [
  // ---- the first Nap Box of each Pupo level: he comes out and Brady gets on ----
  { name: '2-4 the first Nap Box', level: '2-4', start: { box: 0 }, boxShot: 'ec24-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the first catwalk' }] },
  { name: '3-2 the first Nap Box', level: '3-2', start: { box: 0 }, boxShot: 'br32-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo after the first capybara ride' }] },
  { name: '4-3 the first Nap Box', level: '4-3', start: { box: 0 }, boxShot: 'mz43-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo on the first crown' }] },
  // ---- Ecuador ----
  { name: '2-4 the golden pod', level: '2-4', start: { box: 1 }, boxShot: 'ec24-cp', safe: true, steps: [
    { run: 1, until: 'x >= 203 && ground', max: 40 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ec24-pod-before' },
    { check: '!key("goldpod")', name: 'the cooling tunnel is shut before the pod is taken' },
    { grab: { up: true }, until: 'key("goldpod")', max: 14, shotAt: { when: 'armOut', name: 'ec24-pod-during' } },
    { wait: 0.4 },
    { run: 1, until: 'x >= 220', max: 12 },
    { check: 'ride && x >= 220', name: 'through the cooling tunnel door on Pupo' },
    { shot: 'ec24-pod-after' }
  ] },
  { name: '2-2 the cacao larder', level: '2-2', start: { box: 0 }, boxShot: 'ec22', safe: true, steps: [
    { run: 1, until: 'x >= 30.5', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ec22-larder-before' },
    { grab: { up: true }, until: 'key("larder")', max: 6, shotAt: { when: 'mode === "pull"', name: 'ec22-larder-pull' } },
    { wait: 0.6 },
    { run: 1, until: 'coins >= 6', max: 6 },
    { check: 'coins >= 6', name: 'the larder\'s chocolate coins collected' },
    { shot: 'ec22-larder-after' }
  ] },
  // ---- Brazil ----
  { name: '3-2 the sloth bridge', level: '3-2', start: { box: 1 }, boxShot: 'br32-cp', safe: true, steps: [
    { run: 1, until: 'x >= 194 && ground', max: 40 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'br32-bridge-before' },
    { swing: 1, until: '(ground && x >= 210) || dead', max: 14, shotAt: { mode: 'swing', name: 'br32-bridge-during' } },
    { check: 'ride && ground && x >= 210 && !dead', name: 'across the piranha river on the cousins\' hands, still riding' },
    { shot: 'br32-bridge-after' }
  ] },
  { name: '3-3 the cecropia coin column', level: '3-3', start: { box: 0 }, boxShot: 'br33', safe: true, steps: [
    { run: 1, until: 'x >= 28.6', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'br33-column-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: 'coins >= 7', max: 8, shotAt: { t: 1.2, name: 'br33-column-during' } },
    { check: 'coins >= 7', name: 'the whole coin column, climbing' },
    { shot: 'br33-column-after' },
    { hold: { down: true }, until: 'ground', max: 6 },
    { check: 'ride && ground', name: 'back down the trunk on Pupo' }
  ] },
  // ---- Mozambique ----
  { name: '4-3 the upside-down commute', level: '4-3', start: { box: 1 }, boxShot: 'mz43-cp', safe: true, steps: [
    { put: [121, 13] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'mz43-commute-before' },
    { grab: { up: true }, until: 'mode === "hang"', max: 4 },
    { hold: { right: true }, until: 'x >= 131', max: 8 },
    { shot: 'mz43-commute-during' },
    { hold: { right: true }, until: 'x >= 141.5', max: 8 },
    { check: 'mode === "hang"', name: 'still hanging at the far end (the headwind never moved him)' },
    { hold: { down: true }, until: 'ground', max: 3 },
    { check: 'ride && ground && x >= 141 && !dead', name: 'dropped onto the far crown, riding' },
    { check: 'said("EXCUSE ME")', name: 'the bats were passed: "...excuse me."' },
    { shot: 'mz43-commute-after' }
  ] },
  { name: '4-6 the crow\'s nest', level: '4-6', start: { box: 0 }, boxShot: 'mz46', safe: true, steps: [
    { run: -1, until: 'x <= 23.6', max: 6 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'mz46-mast-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: 'y <= 12', max: 6, shotAt: { t: 2.2, name: 'mz46-mast-during' } },
    { hold: { up: true }, until: '!mode && ground && y <= 5.5', max: 6 },
    { check: 'ride && y <= 5.5', name: 'up the mast and onto the crow\'s nest' },
    { hold: { right: true }, until: 'coins >= 7', max: 2 },
    { check: 'coins >= 7', name: 'the crow\'s-nest coins' },
    { shot: 'mz46-mast-after' }
  ] }
];

// The runner, shared by the Node test and the browser tool: its source is evaluated where the game's globals live
// (getLevel, Play, Game, Input, Save, PupoReach, TS, T, SOLID; window.BRADY and window.BRADY_PUPO in the page). __pupoRoute.start(route) builds the
// level; __pupoRoute.go() runs until the next shot or the end and returns { shot } or { done, ok, fails, info }.
function RUNNER() {
  // the game's names: globals in the Node VM; in the page the app exports them on window.BRADY / window.BRADY_PUPO
  const W = typeof window !== 'undefined' && window.BRADY && window.BRADY_PUPO ? window : null, B = W && W.BRADY;
  const names = W ? [B.Save, B.Play, B.Game, B.Input, B.getLevel, B.TS, B.T, B.SOLID, W.BRADY_PUPO.PupoReach] : [Save, Play, Game, Input, getLevel, TS, T, SOLID, PupoReach];
  return (function (Save, Play, Game, Input, getLevel, TS, T, SOLID, PupoReach) {
  const tileAt = (A, tx, ty) => tx < 0 || tx >= A.W ? T.HARD : ty < 0 || ty >= A.H ? T.EMPTY : A.tiles[ty * A.W + tx];
  const R = globalThis.__pupoRoute = {
    route: null, i: 0, t: 0, fails: [], passes: [], g: null, said: [], stepT: 0, riding: 0, shotsTaken: {}, coinN: 0,
    S() {
      const g = this.g, p = g.player, P = g.pupo || {};
      return { x: p.cx / TS, y: (p.y + p.h) / TS, mode: P.mode || '', ride: !!p.pupoRide, ground: !!p.onGround, dead: !!p.dead || g.player !== p,
        drowsy: P.drowsyT > 0, coins: this.coinN, key: k => g.keys.has(k), area: g.area && g.area.aid, t: this.t, riding: this.riding,
        meter: P.meter || 0, said: s => this.said.some(w => w.indexOf(s) >= 0), armOut: !!(P.arm && P.arm.phase >= 2 && P.arm.kind && P.arm.kind !== 'air') };
    },
    test(expr) { const S = this.S(); return !!(new Function('S', 'with (S) { return (' + expr + '); }'))(S); },
    start(route) {
      this.route = route; this.i = 0; this.t = 0; this.fails = []; this.passes = []; this.said.length = 0; this.stepT = 0; this.riding = 0; this.shotsTaken = {};
      const [w, n] = route.level.split('-').map(Number);
      Save.data.lives = 9; Save.data.tips = Object.assign(Save.data.tips || {}, { box: true, picker: true });
      const g = new Play(getLevel(w, n), {}); Game.setScene ? Game.setScene(g) : (Game.scene = g);
      g.state = 'play'; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; this.g = g;
      // what Pupo and the critters say: kept to check the lines
      const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { this.said.push(String(s)); return t0(x, y, s, c); };
      const a0 = g.addPick.bind(g); g.addPick = (x, y) => { this.coinN++; return a0(x, y); };
      this.frames(0.3, {});
      const boxes = []; g.area.spawns.forEach(s => { if (s.type === 'napBox') boxes.push(s); }); boxes.sort((a, b) => a.x - b.x);
      const b = boxes[route.start.box || 0], tx = Math.floor(b.x / TS), ty = Math.floor(b.y / TS) - 1, p = g.player;
      // stand beside the box (on its left), open it (as a bump would), and walk into Pupo once he has unfolded
      p.x = (tx - 1) * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS - p.h; p.vx = p.vy = 0;
      { const A = g.area; let fy = ty + 1; while (fy < A.H && !(SOLID[tileAt(A, tx - 1, fy)] || tileAt(A, tx - 1, fy) === T.SEMI)) fy++; p.y = fy * TS - p.h; }
      g.camX = Math.max(0, Math.min(g.area.W * TS - Game.viewW, p.cx - Game.viewW * 0.42)); if (g.camTargetY) g.camY = g.camTargetY(true);
      this.frames(0.3, {});
      this.box = { tx, ty };
      // the box, its opening and the mount run as the route's first steps (so the browser tool can photograph them)
      const pre = route.boxShot ? 'box-' + route.boxShot : null;
      this.steps = [].concat(pre ? [{ shot: pre + '-closed' }] : [], [{ bump: true }, { wait: 0.75 }], pre ? [{ shot: pre + '-yawn' }] : [], [{ wait: 0.85 }, { mount: true }], route.steps);
    },
    mount() {
      const g = this.g, p = g.player, f = g.pupo && g.pupo.free;
      // (Brady standing in him when he appears must step off first: he is 'armed' once Brady is clear)
      if (f) for (let tries = 0; tries < 3 && !p.pupoRide; tries++) {
        // step away from Pupo (and from the box, on his right) until he is clear of Brady, then walk back into him
        if (!f.armed) for (let k = 0; k < 120 && !f.armed; k++) this.frames(1 / 120, f.cx > p.cx + 4 || tries === 1 ? { left: true } : { right: true });
        for (let k = 0; k < 120 && !p.pupoRide; k++) this.frames(1 / 120, f.cx > p.cx ? { right: true } : { left: true });
      }
      this.frames(0.4, {});
      this.coinN = 0; this.t = 0; this.riding = 0;
      if (!p.pupoRide) this.fails.push('could not get on Pupo at Nap Box ' + (this.route.start.box || 0));
    },
    // step the game: inp held, pressed flags on the first frame only
    frames(sec, inp) {
      const I = Input, n = Math.max(1, Math.round(sec * 120));
      for (let k = 0; k < n; k++) {
        for (const key in inp) I[key] = inp[key];
        if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; }
        if (this.route && this.route.safe && this.g.player) this.g.player.invuln = Math.max(this.g.player.invuln || 0, 0.5);
        (this.g.__upd || this.g.update).call(this.g, 1 / 120);
        I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false;
        if (I.taps) I.taps.length = 0;
        this.t += 1 / 120; if (this.g.player && this.g.player.pupoRide) this.riding += 1 / 120;
      }
      for (const key in inp) I[key] = false;
    },
    // a tiny bot for `run`: hold the direction, jump (held) at a gap or a wall ahead
    runInput(dir) {
      const g = this.g, p = g.player, A = g.area, inp = { right: dir > 0, left: dir < 0 };
      if (p.onGround) {
        const fx = Math.floor((dir > 0 ? p.x + p.w + 10 : p.x - 10) / TS), fy = Math.floor((p.y + p.h + 4) / TS), hy = Math.floor((p.y + p.h - 8) / TS);
        const floor = SOLID[tileAt(A, fx, fy)] || tileAt(A, fx, fy) === T.SEMI || tileAt(A, fx, fy) === T.CONV_L || tileAt(A, fx, fy) === T.CONV_R;
        const wall = SOLID[tileAt(A, fx, hy)];
        if (!floor || wall) { inp.jump = true; inp.jumpPressed = true; }
      } else if (p.vy < 0) inp.jump = true;
      return inp;
    },
    // grab: aim with the stick, press Action whenever the marker sits on something (and the arm is home)
    grabInput(aim) {
      const g = this.g, P = g.pupo, inp = Object.assign({}, aim);
      if (P && !P.mode && P.tg && P.tg.kind && (!P.arm || P.arm.phase === 0)) inp.actionPressed = true;
      return inp;
    },
    // swing: Action at the next hook ahead; Jump to let go when no hook is left and the swing heads for the far side
    swingInput(dir) {
      const g = this.g, P = g.pupo, p = g.player, inp = { right: dir > 0, left: dir < 0 };
      if (P.mode === 'swing') {
        const s = P.sw, tg = PupoReach.scan(p, g, P, inp), ahead = tg.kind === 'hook' && tg.e !== s.e && (tg.e.hx - s.e.hx) * dir > 0;
        if (ahead && s.om * dir > 0) inp.actionPressed = true;
        else if (!ahead) { let more = false; for (const e of g.entities) if (e.pupoGrabPt && e.kind === 'hook' && (e.hx - s.e.hx) * dir > 0 && Math.abs(e.hx - s.e.hx) < 6 * TS) more = true; if (!more && s.om * dir > 0.5 && s.th * dir > 0.15) { inp.jumpPressed = true; inp.jump = true; } }
      } else if (!P.mode) {
        const tg = PupoReach.scan(p, g, P, { right: dir > 0, left: dir < 0, up: true });
        if (tg.kind === 'hook' && (!P.arm || P.arm.phase === 0)) { inp.actionPressed = true; inp.up = true; }
        else if (p.onGround && !this.jumped) { inp.jumpPressed = true; inp.jump = true; this.jumped = true; }
        else if (!p.onGround) inp.jump = true;
      }
      return inp;
    },
    go() {
      const steps = this.steps;
      while (this.i < steps.length) {
        const s = steps[this.i];
        if (s.shot) { this.i++; if (!this.shotsTaken[s.shot]) { this.shotsTaken[s.shot] = true; return { shot: s.shot }; } continue; }
        if (s.check) { (this.test(s.check) ? this.passes : this.fails).push(s.name || s.check); if (!this.test(s.check)) this.fails[this.fails.length - 1] += '  ' + JSON.stringify(this.info()); this.i++; continue; }
        if (s.wait) { this.frames(s.wait, {}); this.i++; continue; }
        if (s.bump) { this.g.bumpBlock(this.box.tx, this.box.ty, false, this.g.player); this.i++; continue; }
        if (s.mount) { this.mount(); this.i++; if (!this.g.player.pupoRide) break; continue; }
        if (s.put) { const g = this.g, p = g.player; p.x = s.put[0] * TS + TS / 2 - p.w / 2; p.y = s.put[1] * TS - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * TS - Game.viewW, p.cx - Game.viewW * 0.42)); this.frames(0.5, {}); this.i++; continue; }
        const max = s.max || 10;
        if (this.stepT === 0) this.lastPress = -1e9;
        let ok = false;
        while (this.stepT < max) {
          if (s.until && this.test(s.until)) { ok = true; break; }
          let inp;
          if (s.run) inp = this.runInput(s.run);
          else if (s.grab) inp = this.grabInput(s.grab);
          else if (s.swing) inp = this.swingInput(s.swing);
          else { inp = Object.assign({}, s.hold || {}); if (s.press && this.stepT - this.lastPress >= (s.every || 1e9)) { this.lastPress = this.stepT; if (s.press === 'action') inp.actionPressed = true; else if (s.press === 'jump') { inp.jumpPressed = true; inp.jump = true; } else if (s.press === 'down') { inp.downPressed = true; inp.down = true; } } }
          this.frames(1 / 120, inp); this.stepT += 1 / 120;
          if (s.shotAt && !this.shotsTaken[s.shotAt.name] && ((s.shotAt.when && this.test(s.shotAt.when)) || (s.shotAt.mode && this.g.pupo && this.g.pupo.mode === s.shotAt.mode && (this.swT = (this.swT || 0) + 1 / 120) > 0.35) || (s.shotAt.t && this.stepT >= s.shotAt.t))) { this.shotsTaken[s.shotAt.name] = true; return { shot: s.shotAt.name }; }
        }
        if (!ok && s.until && this.test(s.until)) ok = true;
        if (!ok && s.until) this.fails.push('step ' + this.i + ' (' + JSON.stringify(s).slice(0, 90) + ') timed out  ' + JSON.stringify(this.info()));
        this.i++; this.stepT = 0; this.swT = 0;
        if (!ok && s.until) break;
      }
      return { done: true, ok: !this.fails.length, fails: this.fails, passes: this.passes, info: this.info() };
    },
    info() { const S = this.S(); return { x: +S.x.toFixed(2), y: +S.y.toFixed(2), mode: S.mode, ride: S.ride, ground: S.ground, dead: S.dead, coins: S.coins, t: +this.t.toFixed(1), riding: +this.riding.toFixed(1) }; }
  };
  return R;
  }).apply(null, names);
}
module.exports = { ROUTES, RUNNER_SRC: '(' + RUNNER.toString() + ')()' };
