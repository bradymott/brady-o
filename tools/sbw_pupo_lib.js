// Shared by the Pupo tests (tools/sbw_pupo_test.js, sbw_pupo_reach_test.js, sbw_pupo_power_test.js): the real game
// modules in a Node VM (tools/load_game.js), a stand-in for Game (99_main.js is not loaded), the lab fixtures
// (tools/fixtures/sbw_pupo_lab.js) built as Play scenes and stepped at the game's fixed 1/120 s step.
const loadGame = require('./load_game');
const LAB = require('./fixtures/sbw_pupo_lab.js');

function boot() {
  const G = loadGame();
  G.run('(' + function () {
    Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
    globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
      setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette: { width: 1, height: 1 }, canvas: { width: 844, height: 390, style: {} } };
    globalThis.__lab = function (spec, opts) {
      Save.data = Save.defaults(); Save.data.lives = 9; Save.data.tips = { box: true, picker: true };
      const lvl = TourBuild.fromSpec(Tour.countries[spec.host || 'mx'], spec, 90);
      const g = new Play(lvl, opts || {}); Game.scene = g;
      g.state = 'play'; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999;
      return g;
    };
    globalThis.__step = function (g, sec, inp) {
      const I = Input, n = Math.round(sec * 120);
      for (let k = 0; k < n; k++) {
        if (inp) { for (const key in inp) I[key] = inp[key]; if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; } }
        Game.scene.update(1 / 120);
        I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false;
      }
      if (inp) for (const key in inp) I[key] = false;
    };
  } + ')()');
  G.LAB = LAB;
  G.lab = (name, opts) => G.run('__lab')(LAB.levels[name], opts);
  G.step = (g, sec, inp) => G.run('__step')(g, sec, inp);
  G.scene = () => G.run('Game.scene');
  return G;
}
// a tiny check printer: PASS / FAIL lines and a count
function checker() {
  const c = { bad: 0, n: 0, rows: [] };
  c.check = (name, ok, info) => { c.n++; c.rows.push([name, !!ok]); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info) : '')); if (!ok) c.bad++; };
  c.section = (want, name, fn) => { if (want.length && !want.includes(name)) return; console.log('== ' + name); try { fn(); } catch (e) { c.check(name + ' runs', false, String(e.stack).slice(0, 800)); } };
  c.done = () => { console.log(`${c.n - c.bad}/${c.n} passed`); process.exit(c.bad ? 1 : 0); };
  return c;
}
module.exports = { boot, checker, LAB };
