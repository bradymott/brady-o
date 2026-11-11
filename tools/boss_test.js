// Boss fight checks for Super Brady-O World: every boss has its own scripted test in tools/boss_tests/<cc>.js.
// usage: node tools/boss_test.js [cc ...] [--shots dir]   (BRADY_DIST=<folder> to test a private build)
// A test module exports async ({ page, check, shot, sim }) => {} and drives the real game through page.evaluate.
// Page helpers (set up here, same as gameplay_test.js): sim(sec, inp), start(id), P() (player), S() (scene),
// ctor(type), clearEnemies(), near(type, dx, props), boss() (the arena's boss), enterArena() (Brady walks in, the
// boss wakes, the intro plays), spawnAt(type, x, y, props).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const args = process.argv.slice(2);
const si = args.indexOf('--shots');
const shots = si >= 0 ? args[si + 1] : path.join(__dirname, '..', 'shots', 'bosses');
const want = args.filter((a, i) => a !== '--shots' && i !== si + 1);
fs.mkdirSync(shots, { recursive: true });
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = [path.join(dist, 'site', 'super-brady-o-world', 'index.html'), path.join(dist, 'brady-o.html')].find(f => fs.existsSync(f));
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  const shot = n => page.screenshot({ path: path.join(shots, n), timeout: 60000 });
  // Determinism: Math.random is a seeded generator, reset to the same seed before every boss file (BOSS_SEED=<n> to
  // try another sequence), so a fight plays out the same way on every run and machine
  const SEED = +(process.env.BOSS_SEED || 1) >>> 0;
  await page.evaluate(() => {
    window.__seed = n => { let a = (n >>> 0) || 1; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; if (inp.actionPressed && k > 0) I.actionPressed = false; }
        window.__simOn = true; try { G.scene.update(1 / 120); } finally { window.__simOn = false; }
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
    // Determinism: a level only advances inside sim(). The page's own animation loop keeps drawing (for the
    // screenshots) but no longer updates the fight with real frame times, which made checks depend on machine load.
    { const PU = window.BRADY.Play.prototype, upd = PU.update; PU.update = function (dt) { if (window.__simOn) return upd.call(this, dt); }; }
    window.T = window.BRADY_TOUR;
    window.start = (id, opts) => { const B = window.BRADY; const [w, i] = id.split('-').map(Number); B.Save.data.lives = 5; B.Game.setScene(new B.Play(B.getLevel(w, i), opts || {})); window.sim(2); if (!(opts && opts.lead)) window.toArena(); };
    // v2 boss levels: a lead-in area, then the arena area (role 'arena'); start() goes straight through its door
    window.toArena = () => {
      const g = window.S(), L = g.level, k = (L.areas || []).findIndex(a => a.role === 'arena');
      if (k <= 0 || g.area.idx === k) return;
      const an = (L.areas[k].anchors || {}).in; if (!an) return;
      g.state = 'play'; g.player.state = 'play'; g.enterPortal({ kind: 'door', target: { area: k, x: an.x, y: an.y } }); window.sim(3);
    };
    window.P = () => window.BRADY.Game.scene.player;
    window.S = () => window.BRADY.Game.scene;
    window.ctor = type => window.BRADY_TYPES[type];
    window.clearEnemies = () => { const g = window.S(); for (const e of g.entities) if (e.enemy && !e.boss) e.remove = true; sim(0.02); };
    window.near = (type, dx, props) => { const g = S(), p = P(); const C = ctor(type); const e = new C(g, Object.assign({ x: p.cx + (dx || 60), y: p.y + p.h, dir: -1 }, props || {})); g.spawn(e); return e; };
    window.spawnAt = (type, x, y, props) => { const g = S(); const C = ctor(type); const e = new C(g, Object.assign({ x, y, dir: -1 }, props || {})); g.spawn(e); return e; };
    // the boss of the current area; in a v2 boss level (a lead-in, then an arena area) Brady is first taken to the arena
    window.boss = () => {
      const g = S(); let b = g.entities.find(e => e.boss && !e.remove); if (b) return b;
      const k = g.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss'));
      if (k < 0 || g.area === g.level.areas[k]) return b;
      const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * 32 + 16, y: (a.H - 4) * 32 };
      const inv = g.player.invuln || 0; g.loadArea(k, an.x, an.y, g.player.power || 0); g.player.invuln = Math.max(g.player.invuln || 0, inv); return g.entities.find(e => e.boss && !e.remove);
    };
    // Brady walks into the arena; the boss wakes and its intro plays out
    window.enterArena = (dx) => { const b = boss(), p = P(); p.x = b.arenaX0 + (dx || 64); p.y = b.floorY - p.h - 4; p.vy = 0; sim(2.6); return b; };
  });
  const dir = path.join(__dirname, 'boss_tests');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().filter(f => !want.length || want.includes(f.replace('.js', '')));
  for (const f of files) {
    console.log('== ' + f);
    await page.evaluate(n => window.__seed(n), SEED);
    try { await require(path.join(dir, f))({ page, check, shot, errors }); }
    catch (e) { check(f + ' runs', false, String(e.message || e).slice(0, 300)); }
  }
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL BOSS CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
