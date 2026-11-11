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
  await page.evaluate(() => {
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; if (inp.actionPressed && k > 0) I.actionPressed = false; }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
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
    window.boss = () => S().entities.find(e => e.boss && !e.remove);
    // Brady walks into the arena; the boss wakes and its intro plays out
    window.enterArena = (dx) => { const p = P(), b = boss(); p.x = b.arenaX0 + (dx || 64); p.y = b.floorY - p.h - 4; p.vy = 0; sim(2.6); return b; };
  });
  const dir = path.join(__dirname, 'boss_tests');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().filter(f => !want.length || want.includes(f.replace('.js', '')));
  for (const f of files) {
    console.log('== ' + f);
    try { await require(path.join(dir, f))({ page, check, shot, errors }); }
    catch (e) { check(f + ' runs', false, String(e.message || e).slice(0, 300)); }
  }
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL BOSS CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
