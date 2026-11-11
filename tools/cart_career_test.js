// Career / Battle Royale / secret levels test (43_cart_h_career.js, 43_cart_hb_final.js, 43_cart_hc_screens.js).
//   node tools/cart_career_test.js [outDir=shots/career]
// Plays the framework through the debug API (BRADY_CART.debug.career): run order rules for two cars, stage win / lose,
// save + resume across a page reload, stat points (award, allocation changing the real kart numbers, AI scaling), the
// level's special in everyone's gift-box pool, the Burn the Man final played to the end (the Man burns), the Battle
// Royale unlocking the secret level, secret-level gating and the game-won state, an old save loading, and no King of
// the Hill / Capture the Flag anywhere. Screenshots of every new screen in landscape (844x390) and portrait (390x844).
// Exits non-zero on a failed check or a page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'career'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
// an Art Cart save from before the career update (trophies, best times, a King of the Hill win, a driver who is no longer one)
const OLD_SAVE = { v: 3, settings: { music: 0, sfx: 0 }, cart: { driver: 'man', car: 'whale', autoGas: true, gfx: 'auto', trophies: { dust: 1 }, best: { esplanade: { lap: 31.2, total: 96.5 } }, wins: { 'skate:hill': 2, 'playa:vibe': 1, 'mx:flag': 1 }, mastered: { skate: true }, guideSeen: true } };
let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) fails++; };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(s => { window.__cartFixedQ = 0.7; if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('art-cart-save-v1', s); } }, JSON.stringify(OLD_SAVE));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  const boot = async () => { await page.goto(url + 'art-cart/'); await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.career, null, { timeout: 180000 }); };
  await boot();
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async (name, ms) => { await page.waitForTimeout(ms || 700); try { await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); } catch (e) { console.log('  (screenshot failed: ' + name + ')'); } };
  const orient = async portrait => { await page.setViewportSize(portrait ? { width: 390, height: 844 } : { width: 844, height: 390 }); await page.waitForTimeout(250); await ev(() => { const s = window.BRADY.Game.scene; if (s && s.build) s.build(); if (s && s.resize) s.resize(); }); };

  // ---- an old save loads: trophies, best times and wins stay; progress starts empty; retired objectives gone ----
  const mig = await ev(() => {
    const B = window.BRADY_BURNS, sv = B.cartSave(), C = window.BRADY_CART.debug.career;
    return { trophy: sv.trophies.dust, best: sv.best.esplanade && sv.best.esplanade.total, wins: sv.wins['skate:hill'], mastered: sv.mastered.skate, driver: sv.driver, car: sv.car, prog: C.prog('whale'),
      objectives: B.CART_ARENAS.map(a => a.id + ':' + a.objectives.join(',')), hillFlag: B.CART_ARENAS.some(a => a.objectives.includes('hill') || a.objectives.includes('flag')), scene: window.BRADY.Game.scene.constructor.name };
  });
  check('old save: trophies, best times and wins kept', mig.trophy === 1 && mig.best === 96.5 && mig.wins === 2 && mig.mastered === true, mig);
  check('old save: a driver who is no longer one falls back, the car stays', mig.driver === 'brady' && mig.car === 'whale', [mig.driver, mig.car]);
  check('old save: per-car progress starts empty', mig.prog.points === 0 && !mig.prog.career && !mig.prog.royale, mig.prog);
  check('King of the Hill and Capture the Flag are on no arena', !mig.hillFlag, mig.objectives);
  check('secret-level arenas offer exactly their three games', mig.objectives.filter(s => /^(skate|mx|deep|moon|mud|temple):/.test(s)).every(s => s.split(':')[1].split(',').length === 3), mig.objectives);
  const retired = await ev(() => { const B = window.BRADY_BURNS, s = new B.CartRaceScene({ mode: 'battle', arena: 'skate', objective: 'hill', car: 'heart', seed: 3 }); return s.objective; });
  check('a scene asked for King of the Hill plays Vibe Check', retired === 'vibe', retired);

  // ---- run order: own level first, the other eleven shuffled, the final last; per car, fixed at run start ----
  const ord = await ev(() => {
    const C = window.BRADY_CART.debug.career, B = window.BRADY_BURNS; C.reset();
    const a = C.start('heart', 'career', 111), b = C.start('whale', 'career', 222), a2 = C.run('heart', 'career'), all = B.CART_CARS.map(c => c.id);
    const ok = (r, car) => r.order.length === 13 && r.order[0] === car && r.order[12] === 'man' && new Set(r.order.slice(1, 12)).size === 11 && r.order.slice(1, 12).every(id => id !== car && all.includes(id));
    const c = C.start('heart', 'royale', 333);
    return { a: a.order, b: b.order, okA: ok(a, 'heart'), okB: ok(b, 'whale'), okC: ok(c, 'heart'), same: JSON.stringify(a.order) === JSON.stringify(a2.order), differ: JSON.stringify(a.order.slice(1, 12)) !== JSON.stringify(c.order.slice(1, 12)) };
  });
  check('career run (Bass Valentine): own level first, 11 others once each, the final last', ord.okA, ord.a);
  check('career run (Whale of a Time): own level first, 11 others once each, the final last', ord.okB, ord.b);
  check('the order is saved with the run (fixed)', ord.same);
  check('different runs shuffle differently', ord.differ && ord.okC);

  // ---- stage 1: the car's own level; its special joins everyone's gift-box pool ----
  const st1 = await ev(() => { const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug; const r = C.play('heart', 'career'); const s = D.scene(); return { r: { state: r.state, mode: r.mode, track: r.track }, poolCar: s.poolCar, run: s.run, want: window.BRADY_BURNS.CART_CAREER_TRACKS.heart, slot: s.player.slot, n: s.karts.length }; });
  check('stage 1 loads the car\'s own career level', st1.r.state === 'intro' && st1.r.mode === 'career' && st1.r.track === st1.want, st1);
  check('the player starts at the back of the grid', st1.slot === st1.n - 1, [st1.slot, st1.n]);
  const pool = await ev(() => { const B = window.BRADY_BURNS; let n = 0, m = 0; for (let i = 0; i < 3000; i++) { if (B.cartRollItem(5, 8, Math.random, null, 'fish', 'brady', 'heart') === 'throb') n++; if (B.cartRollItem(5, 8, Math.random, null, 'fish', 'brady', null) === 'throb') m++; } return { onLevel: n, elsewhere: m, scenePool: window.BRADY.Game.scene.poolCar }; });
  check('on Bass Valentine\'s level a rival rolls HEART THROB; elsewhere it does not', pool.onLevel > 150 && pool.elsewhere === 0 && pool.scenePool === 'heart', pool);
  await ev(() => window.BRADY_CART.debug.skipIntro()); await ev(() => window.BRADY_CART.debug.sim(3, { auto: true }));
  await shot('race-career-stage1-land');

  // ---- losing: no advance, RETRY replays the same stage; winning top 3 advances ----
  const lose = await ev(() => window.BRADY_CART.debug.career.lose());
  await shot('results-fail-land', 900);
  await orient(true); await shot('results-fail-port', 700); await orient(false);
  const afterLose = await ev(() => { const C = window.BRADY_CART.debug.career; return { run: C.run('heart', 'career').stage, btns: (window.BRADY.Game.scene.btns || []).map(b => b.label) }; });
  check('a stage lost (8th): no advance, RETRY / MAP offered', lose && !lose.pass && afterLose.run === 0 && afterLose.btns.some(l => /RETRY/.test(l)) && afterLose.btns.some(l => /MAP/.test(l)), [lose, afterLose]);
  const retry = await ev(() => { const C = window.BRADY_CART.debug.career; const r = C.press('RETRY'); const s = window.BRADY.Game.scene; s.loadAll(); return { r, stage: s.run && s.run.stage, track: s.trackId }; });
  check('RETRY replays the same stage', retry.stage === 0 && retry.r.scene === 'CartRaceScene', retry);
  const win3 = await ev(() => window.BRADY_CART.debug.career.win(3));
  await shot('results-pass-land', 900);
  await orient(true); await shot('results-pass-port', 700); await orient(false);
  const cont = await ev(() => { const C = window.BRADY_CART.debug.career; const r = C.press('CONTINUE'); return { r, stage: C.run('heart', 'career').stage, best: C.run('heart', 'career').best }; });
  check('3rd place advances; CONTINUE goes to the run map', win3.pass && cont.stage === 1 && cont.best[0] === 3 && cont.r.state === 'run', [win3, cont]);
  await shot('run-map-career-land', 1500);
  await orient(true); await shot('run-map-career-port', 1200); await orient(false);

  // ---- save + resume across a reload ----
  const before = await ev(() => window.BRADY_CART.debug.career.run('heart', 'career'));
  await boot();
  const after = await ev(() => window.BRADY_CART.debug.career.run('heart', 'career'));
  check('the run survives a reload (resume at stage 2, same order)', after && after.stage === 1 && JSON.stringify(after.order) === JSON.stringify(before.order), after && after.stage);
  const nextStage = await ev(() => { const C = window.BRADY_CART.debug.career, r = C.play('heart', 'career'); return { stage: window.BRADY.Game.scene.run.stage, owner: window.BRADY.Game.scene.run.owner, level: window.BRADY.Game.scene.poolCar, track: r.track }; });
  check('resume plays stage 2 with the 2nd car\'s level and special', nextStage.stage === 1 && nextStage.owner === after.order[1] && nextStage.level === after.order[1], nextStage);

  // ---- through to the final ----
  const toFinal = await ev(() => { const C = window.BRADY_CART.debug.career; for (let i = 1; i < 12; i++) { C.play('heart', 'career'); const o = C.win(1 + (i % 3)); if (!o.pass) return { fail: i }; } return { stage: C.run('heart', 'career').stage, opts: C.opts('heart', 'career') }; });
  check('eleven more stages won: the final is next (Burn the Man on Burn Night)', toFinal.stage === 12 && toFinal.opts.final === 'plunger' && toFinal.opts.track === 'burn', toFinal);
  await ev(() => { const s = window.BRADY.Game.scene; s.leave(); });
  await shot('run-map-final-land', 1500);

  // ---- BURN THE MAN: played through the plungers to the Man burning ----
  const fin = await ev(() => { const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug; C.play('heart', 'career'); const s = D.scene(); return { rules: !!s.plg, name: s.name, laps: s.laps, man: !!s.man, burn: s.man && s.man.burn }; });
  check('the final loads with plungers, the Man unlit', fin.rules && fin.man && fin.burn === 0 && fin.name === 'BURN THE MAN', fin);
  await shot('final-intro-land', 900);
  await ev(() => { const D = window.BRADY_CART.debug; D.skipIntro(); D.sim(2.5, { auto: true }); });
  const spawned = await ev(() => window.BRADY_CART.debug.career.final());
  check('a plunger stands on the track at the start', spawned.alive && spawned.n === 1, spawned);
  await shot('final-race-land', 900);
  await orient(true); await shot('final-race-port', 900); await orient(false);
  // three pushes by the player (rivals parked so the outcome is the player's)
  const pushes = await ev(() => { const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug; D.freezeAll(true); const log = []; for (let i = 0; i < 3; i++) { for (let w = 0; w < 30 && !C.final().alive; w++) D.sim(0.25, { auto: true }); C.plunge(); D.sim(1.2, { auto: true }); log.push(C.final()); } return log; });
  const last = pushes[pushes.length - 1], me = last.counts.find(c => c.player);
  check('driving into a plunger pushes it; a new one appears; three pushes win', pushes[0].counts.find(c => c.player).plg === 1 && pushes[1].n >= 2 && me.plg === 3 && last.playerWon, pushes.map(p => [p.n, p.counts.find(c => c.player).plg, p.state]));
  await ev(() => window.BRADY_CART.debug.sim(2.2, { auto: true }));
  const burn = await ev(() => window.BRADY_CART.debug.career.final());
  check('on the third the Man ignites and burns', burn.igniteT > 0 && burn.burn > 0.5, burn);
  await ev(() => { window.BRADY_CART.debug.sim(0.6, {}); });
  await shot('final-burn-land', 1000);
  await orient(true); await shot('final-burn-port', 900); await orient(false);
  const finRes = await ev(() => { const D = window.BRADY_CART.debug, s = D.scene(); for (let i = 0; i < 20 && s.state !== 'results'; i++) D.sim(0.5, {}); return { state: s.state, out: s.runOut, place: s.player.rank, prog: window.BRADY_CART.debug.career.prog('heart') }; });
  check('Burn the Man won: the Career is won and its stat point awarded', finRes.state === 'results' && finRes.out.pass && finRes.out.done && finRes.out.prize && finRes.prog.careerWon === 1 && finRes.prog.points === 1, finRes);
  await shot('results-final-land', 900);
  const prize = await ev(() => window.BRADY_CART.debug.career.press('CONTINUE'));
  check('CONTINUE after the final shows the prize', prize && prize.state === 'prize', prize);
  await shot('prize-career-land', 1500);
  await orient(true); await shot('prize-career-port', 1200); await orient(false);

  // ---- stat points change the real kart, every mode; rivals sharpen a little ----
  const stat = await ev(() => {
    const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug, o = { mode: 'quick', track: 'esplanade', car: 'heart', driver: 'chinka', seed: 9 };
    D.start(o); const k0 = C.kart();
    const okAlloc = C.alloc('heart', 'speed', 1), over = C.alloc('heart', 'speed', 1);
    D.start(o); const k1 = C.kart();
    C.alloc('heart', 'speed', -1); C.alloc('heart', 'accel', 1); D.start(o); const k2 = C.kart();
    D.start(Object.assign({}, o, { mode: 'tt' })); const kt = C.kart();
    return { k0, k1, k2, kt, okAlloc, over, pts: C.points('heart') };
  });
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  check('a stat point on SPEED raises the kart\'s top speed (+1 pip)', stat.okAlloc && Math.abs(stat.k1.vmax - stat.k0.vmax - 0.75) < 1e-6 && stat.k1.stats.speed === stat.k0.stats.speed + 1, [stat.k0.vmax, stat.k1.vmax]);
  check('only earned points can be spent (1 point, no second +)', stat.over === false && stat.pts.earned === 1, stat.pts);
  check('re-assigned to ACCEL: speed back, acceleration up', Math.abs(stat.k2.vmax - stat.k0.vmax) < 1e-6 && Math.abs(stat.k2.acc - stat.k0.acc - 2.7) < 1e-6, [stat.k2.vmax, stat.k2.acc, stat.k0.acc]);
  check('points apply in other modes too (time trial)', Math.abs(stat.kt.acc - stat.k2.acc) < 1e-6, stat.kt.acc);
  check('rivals sharpen a little with the player\'s stat points', avg(stat.k1.aiSkill) > avg(stat.k0.aiSkill) + 0.003 && avg(stat.k1.aiSkill) < avg(stat.k0.aiSkill) + 0.03, [avg(stat.k0.aiSkill), avg(stat.k1.aiSkill)]);
  const drv = await ev(() => { const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug, B = window.BRADY_BURNS; const has = B.CartRaceScene && window.BRADY_BURNS.cartSave && (window.BRADY_BURNS.CART_CARS, true); D.start({ mode: 'quick', track: 'esplanade', car: 'whale', driver: 'brady', seed: 9 }); const a = C.kart(); return { a, brady: (eval('typeof CART_DRIVERS') !== 'undefined'), has }; });
  check('the driver\'s stat pip applies (Brady: speed)', drv.a.stats.speed === 4, drv.a.stats);

  // ---- Battle Royale: same shape; winning it unlocks the secret level ----
  const roy = await ev(() => {
    const C = window.BRADY_CART.debug.career; C.start('heart', 'royale', 444);
    const first = C.play('heart', 'royale'), s = window.BRADY.Game.scene, o = { mode: first.mode, arena: first.arena, objective: first.objective, run: s.run };
    const lockedBefore = C.secret('heart').unlocked;
    for (let i = 0; i < 13; i++) { if (i) C.play('heart', 'royale'); const r = C.win(i === 12 ? 1 : 2); if (!r.pass) return { fail: i, r }; if (i === 12) o.last = r; }
    return { o, lockedBefore, sec: C.secret('heart'), prog: C.prog('heart') };
  });
  if (roy.fail !== undefined) { check('every royale stage won through the debug API', false, roy); roy.o = { run: {} }; roy.sec = { games: [] }; roy.prog = {}; }
  check('royale stage 1 is the car\'s royale arena (Vibe Check stand-in until the royale mode lands)', roy.o.run.owner === 'heart' && (roy.o.mode === 'royale' || (roy.o.mode === 'battle' && roy.o.objective === 'vibe')), roy.o);
  check('winning the Battle Royale: stat point + secret level unlocked', !roy.lockedBefore && roy.sec.unlocked && roy.prog.royaleWon === 1 && roy.prog.points === 2 && roy.o.last.unlocked, [roy.sec, roy.prog.points]);
  check('Bass Valentine\'s secret level: Vibe Check + Glow Grab, its own game "coming soon" (no completion yet)', roy.sec.games[0] === null && roy.sec.games[1] === 'vibe' && roy.sec.games[2] === 'glow' && !roy.sec.ready && roy.sec.openable, roy.sec);
  await ev(() => window.BRADY_CART.debug.career.press('CONTINUE'));
  await shot('prize-royale-land', 1500);

  // ---- secret gating, the three games, the game won with a car ----
  const gate = await ev(() => {
    const C = window.BRADY_CART.debug.career, sv = window.BRADY_BURNS.cartSave();
    const locked = C.secret('snail');
    // Turbo Escargot: Career and Royale won (set directly: the full flow is checked above with Bass Valentine)
    const p = sv.prog.snail = sv.prog.snail || {}; p.careerWon = 1; p.royaleWon = 1; p.points = 2;
    const open = C.secret('snail'), games = [];
    for (const g of open.games) { C.playSecret('snail', g); const s = window.BRADY.Game.scene; games.push({ g, mode: s.mode, arena: s.arenaId, obj: s.objective, car: s.carId }); const r = C.win(g === 'vibe' ? 2 : 1); games[games.length - 1].pass = r.pass; games[games.length - 1].complete = r.complete; }
    const second = C.win; void second;
    return { locked, open, games, complete: C.complete('snail'), soon: C.secret('fish') };
  });
  check('a secret level is locked until its car wins the Battle Royale', !gate.locked.unlocked && gate.open.unlocked, [gate.locked.unlocked, gate.open.unlocked]);
  check('Turbo Escargot\'s secret level: Trick Attack, Vibe Check, Glow Grab in Bowl-O-Rama', gate.open.ready && gate.games.length === 3 && gate.games.every(g => g.arena === 'skate' && g.car === 'snail') && gate.games.map(g => g.obj).join() === 'trick,vibe,glow', gate.games);
  check('a mini-game needs 1st: 2nd in Vibe Check does not clear it', gate.games[1].pass === false && gate.games[0].pass && gate.games[2].pass, gate.games.map(g => g.pass));
  const fin2 = await ev(() => { const C = window.BRADY_CART.debug.career; C.playSecret('snail', 'vibe'); return { r: C.win(1), complete: C.complete('snail') }; });
  check('all three secret games won: the game is won with Turbo Escargot', fin2.r.pass && fin2.r.complete && fin2.complete, fin2);
  check('cars without a secret arena yet show "coming soon"', !gate.soon.ready && gate.soon.games.length === 0 && /ROLLER/.test(gate.soon.name), gate.soon);
  const cel = await ev(() => window.BRADY_CART.debug.career.press('CONTINUE'));
  check('CONTINUE shows the game-won celebration', cel && cel.state === 'complete', cel);
  await shot('complete-land', 1500);
  await orient(true); await shot('complete-port', 1200); await orient(false);

  // ---- every new menu screen, both orientations ----
  const screens = [
    ['home', { state: 'mode' }], ['quick', { state: 'quick' }], ['car', { state: 'car', car: 'heart', kind: 'career' }], ['garage', { state: 'garage', car: 'heart' }],
    ['run-career', { state: 'run', car: 'whale', kind: 'career' }], ['run-royale', { state: 'run', car: 'heart', kind: 'royale' }],
    ['secret', { state: 'secret' }], ['secret-games-snail', { state: 'secretGames', car: 'snail' }], ['secret-games-heart', { state: 'secretGames', car: 'heart' }]
  ];
  for (const portrait of [false, true]) {
    await page.setViewportSize(portrait ? { width: 390, height: 844 } : { width: 844, height: 390 }); await page.waitForTimeout(300);
    for (const [name, o] of screens) {
      const r = await ev(o => { const m = window.BRADY_CART.debug.career.menu(o); const s = window.BRADY.Game.scene; if (o.state === 'car') s.mode = 'career'; return { state: m, btns: s.btns.map(b => b.label), cards: s.cards.length }; }, o);
      if (name === 'home') check('home menu: CAREER, BATTLE ROYALE, SECRET LEVELS, QUICK RACE, POWER-UPS', ['CAREER', 'BATTLE ROYALE', 'SECRET LEVELS', 'QUICK RACE', 'POWER-UPS'].every(l => r.btns.includes(l)), r.btns);
      if (name === 'secret') check('secret levels: 12 cards', r.cards === 12, r.cards);
      if (name === 'run-career') check('run map: 13 stage tiles', r.cards === 13, r.cards);
      await shot(name + (portrait ? '-port' : '-land'), name.startsWith('run') || name.startsWith('secret') ? 1600 : 1300);
    }
  }
  // the home menu's flows: CAREER → driver → car → run map; QUICK RACE → GRAND PRIX → driver; SECRET LEVELS; POWER-UPS
  const flow = await ev(() => {
    const s0 = window.BRADY_CART.debug.career.menu({ state: 'mode' }), s = window.BRADY.Game.scene, by = l => s.btns.find(b => b.label === l), st = [];
    by('CAREER').fn(); st.push(s.state); s.confirmDriver(); st.push(s.state); s.confirmCar(); st.push(s.state + ':' + s.kind);
    s.state = 'mode'; s.build(); by('QUICK RACE').fn(); st.push(s.state); s.cards[0].fn(); st.push(s.state + ':' + s.mode); s.back(); st.push(s.state);
    s.state = 'mode'; s.build(); by('SECRET LEVELS').fn(); st.push(s.state); s.back(); by('POWER-UPS').fn(); st.push(s.state);
    return { s0, st };
  });
  check('menu flows reach their screens', flow.st.join() === 'driver,car,run:career,quick,driver:gp,quick,secret,guide', flow.st);
  await shot('guide-land', 900);

  await browser.close(); srv.close();
  if (errs.length) { console.log('PAGE ERRORS:\n' + errs.slice(0, 12).join('\n')); fails++; }
  console.log(fails ? fails + ' FAILED' : 'career test ok', '· shots in', out);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
