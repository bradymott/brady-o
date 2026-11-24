// World 1 boss entry (the Man at the Gate): every way Brady can reach the arena must lead to a startable fight.
// usage: BRADY_DIST=<folder> node tools/burns_boss_entry_test.js [shots-dir]
// Drives the real stick/jump/action input (Input.up / Input.jumpPressed / Input.actionPressed) through the scene's
// own update loop; mission busywork far from the gate (the roof-top ticket chase, the greeter fights) is completed
// directly, everything at the gate and in the arena is played.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site'), out = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (out) fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const f = path.resolve(site, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(site + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port + '/burning-man/index.html';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const results = [], errors = [];
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  page.setDefaultTimeout(600000);
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug, null, { polling: 100 });
  // in-page helpers
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, G = window.BRADY.Game, I = window.BRADY.Input;
    const H = window.__H = {};
    H.s = () => G.scene;
    H.clearInput = () => { I.up = I.down = I.left = I.right = false; I.jump = false; I.jumpPressed = false; I.actionPressed = false; };
    H.step = (n) => { const s = G.scene; for (let k = 0; k < n; k++) { s.update(1 / 120); I.jumpPressed = false; I.actionPressed = false; } };
    H.flush = () => { const s = G.scene; for (let k = 0; k < 4000 && (s.cine || s.dialog.open); k++) { if (s.cine) s.cine.skip(); while (s.dialog.open) s.dialog.next(); H.step(2); } };
    // fresh or kept save, enter World 1 and settle
    H.enter = (fresh) => {
      if (fresh) { localStorage.clear(); window.BRADY.Save.load(); }
      B.debug.play(1); const s = G.scene; if (s.state === 'load') s.load(); H.step(4); H.flush(); H.step(30); H.clearInput(); return s.state;
    };
    // walk with the stick toward (x, z); jump = hop over things on the way
    H.walk = (x, z, o) => {
      o = o || {}; const s = G.scene, p = s.player; let n = 0;
      for (; n < (o.max || 120 * 40); n++) {
        if (s.cine || s.dialog.open) { if (o.stopOnCine) break; H.flush(); }
        const d = Math.hypot(x - p.x, z - p.z); if (d < (o.r || 1.2)) break;
        s.camYaw = Math.atan2(x - p.x, z - p.z); I.up = true;
        if (o.jump && p.grounded && n % 30 === 0) { I.jumpPressed = true; I.jump = true; }
        if (o.jump && !p.grounded && p.jumps === 1 && p.vy < 1) { I.jumpPressed = true; }
        s.update(1 / 120); I.jumpPressed = false; I.actionPressed = false;
      }
      H.clearInput(); return [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10];
    };
    H.press = () => { I.actionPressed = true; H.step(1); };
    // walk up to someone (teleport most of the way: the line is long) and press ACTION until they talk
    H.talk = (id) => { const s = G.scene, a = s.actor(id), p = s.player; let said = false;
      for (let k = 0; k < 6 && !said; k++) { const ang = Math.atan2(p.x - a.x, p.z - a.z) || 0, d = 1.7; if (Math.hypot(p.x - a.x, p.z - a.z) > 6) p.teleport(a.x + Math.sin(ang) * 4, s.world.height(a.x, a.z), a.z + Math.cos(ang) * 4); H.walk(a.x, a.z, { r: d, max: 600 }); H.press(); said = s.dialog.open; if (!said) H.step(30); }
      while (s.dialog.open) { s.dialog.next(); H.step(1); } H.flush(); H.step(4); return said; };
    // hop the closed gate barrier: run up to it, jump, double jump at the top while pushing forward
    H.hop = (x) => { const s = G.scene, p = s.player; H.walk(x, -234, { max: 2400 });
      for (let k = 0; k < 4 && p.z > -241.5; k++) { H.walk(x, -236.5, { max: 600, r: 0.4 }); s.camYaw = Math.PI; I.up = true; I.jump = true; I.jumpPressed = true; H.step(1);
        for (let n = 0; n < 240 && !(p.grounded && n > 10); n++) { s.camYaw = Math.PI; I.up = true; I.jump = true; if (n === 28) I.jumpPressed = true; s.update(1 / 120); I.jumpPressed = false; } H.clearInput(); H.step(10); }
      return p.z < -241; };
    H.info = () => { const s = G.scene, S = B.BURNS_W1 ? B.BURNS_W1.state : null, p = s.player, m = s.missions;
      return { scene: s.constructor.name, world: s.worldId, x: Math.round(p.x), z: Math.round(p.z), boss: m.state('boss'), ticket: m.state('ticket'), greeters: m.state('greeters'), hasTicket: s.hasItem('ticket'),
        gate: !!(S && S.gateOpen), flag: !!B.BurnsSave.flag(1, 'gate'), started: !!(S && S.bossStarted), fight: !!(s.boss && s.boss.active && !s.boss.defeated), prompt: s.prompt || null, cine: !!s.cine, hint: s._w1hint || null }; };
    H.shot = () => { const s = G.scene; G.forceTouchUI = true; s.fade = 0; s.fadeTarget = 0; s.banners = s.banners.filter(b => /NOT YET|FIGHT|THE MAN|GATE/.test(b.title || '')); s.dayCardT = -1; s.lastFrame = performance.now() - 33; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx); };
    // the two requirements, as a real player gets them: talk to Lucky (ticket chase starts), catch it; talk to Mama Dusty, beat the greeters
    H.doTicket = () => { const s = G.scene; H.talk('lucky'); s.missions.complete('ticket'); H.flush(); H.step(60); };
    H.doGreeters = () => { const s = G.scene; H.talk('dusty'); s.missions.complete('greeters'); H.flush(); for (const a of s.actors.slice()) if (a.def.boss && !a.defeated) s.removeActor(a); s.boss = null; H.step(60); };
    // the requirements that are in the save after both missions (tokens are what count, saved on pickup)
    H.grabTokens = () => { const s = G.scene; for (const P of s.pickups.items) if (!P.taken && P.base === 'token') { s.player.teleport(P.x, P.y0 - 0.9, P.z); s.player.grounded = false; H.step(2); H.flush(); } H.flush(); H.step(30); return B.BurnsSave.hasToken(1, 'ticket') && B.BurnsSave.hasToken(1, 'greeters'); };
  });
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const shot = async (name) => { if (!out) return; await ev(() => window.__H.shot()); await page.screenshot({ path: path.join(out, name + '.png') }); };
  const check = (name, ok, info) => { results.push({ name, ok, info }); console.log((ok ? 'ok   ' : 'FAIL ') + name + '  ' + JSON.stringify(info)); };
  const ready = async (fresh) => { const st = await ev(f => window.__H.enter(f), fresh); for (let i = 0; i < 100 && (await ev(() => window.__H.s().state)) !== 'play'; i++) { await page.waitForTimeout(200); await ev(() => { window.__H.step(2); window.__H.flush(); }); } return st; };
  // prepare: both requirements done, tokens banked (the save Brady would have walking up to the gate)
  const reqs = async () => { const ok = await ev(() => { const H = window.__H; H.doTicket(); H.doGreeters(); return H.grabTokens(); }); if (!ok) throw new Error('setup: requirement tokens not banked'); };
  const fightStarted = async () => { await ev(() => { window.__H.step(30); window.__H.flush(); window.__H.step(60); }); return ev(() => window.__H.info()); };
  const toGate = () => ev(() => { const H = window.__H, s = H.s(); s.player.teleport(0, 0, -212, Math.PI); s.camYaw = Math.PI; H.step(10); H.walk(0, -226); });
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null, want = n => !only || only.indexOf(n) >= 0;
  let i;

  if (want('1')) {   // happy path: talk to Moe, walk straight in (the original walk-in trigger)
    await ready(true); await reqs(); await toGate();
    await ev(() => window.__H.talk('moe'));
    i = await ev(() => window.__H.info()); check('1 Moe opens the gate', i.gate, i);
    await ev(() => { const H = window.__H; H.walk(0, -228); H.walk(0, -262, { stopOnCine: true }); });
    i = await fightStarted(); check('1 straight walk-in starts the fight', i.fight && i.boss === 'active', i);
    await shot('1-happy-fight');
  }
  if (want('2')) {   // gate open, walking in along the side of the road toward where the guide arrow points
    await ready(true); await reqs(); await toGate();
    await ev(() => { const H = window.__H; H.talk('moe'); H.walk(14, -230); H.walk(14, -246, { stopOnCine: true }); H.walk(0, -290, { stopOnCine: true }); });
    i = await ev(() => window.__H.info()); await shot('2-side-entry');
    i = await fightStarted(); check('2 side walk-in (missing the walk-in circle) starts the fight', i.fight && i.boss === 'active', i);
    await shot('2-side-entry-after');
  }
  if (want('3')) {   // both requirements done, never talked to Moe: the arrow pointed at the Man, so he hops the barrier
    await ready(true); await reqs(); await toGate();
    const g0 = await ev(() => (window.BRADY_BURNS.BurnsNav.targets(window.__H.s())[0] || null));
    console.log('     guide before the gate:', JSON.stringify(g0));
    const over = await ev(() => window.__H.hop(0));
    await ev(() => window.__H.walk(0, -262, { stopOnCine: true }));
    i = await ev(() => window.__H.info()); await shot('3-hopped-barrier');
    check('3 hopped the closed barrier', over, i);
    i = await fightStarted();
    check('3 in the arena with both requirements (gate never opened): fight starts', i.fight && i.boss === 'active', i);
    await shot('3-hopped-barrier-fight');
  }
  if (want('4')) {   // no ticket, no greeting: hop the barrier, stand in the ring, press ACTION
    await ready(true); await toGate();
    const over = await ev(() => window.__H.hop(0));
    await ev(() => { const H = window.__H; H.walk(0, -262, { stopOnCine: true }); H.step(60); });
    i = await ev(() => window.__H.info()); await shot('4-no-reqs-in-ring');
    check('4 hopped in without the requirements: told what to do', over && !i.fight && !!i.hint, i);
    await ev(() => { window.__H.press(); window.__H.step(30); });
    i = await ev(() => window.__H.info()); await shot('4-no-reqs-pressed-fight');
    check('4 without the requirements: FIGHT explains, no fight', !i.fight && i.boss !== 'active' && !!i.hint, i);
  }
  if (want('5')) {   // lose to the Man (faint), back at the gate flag, walk back in
    await ready(true); await reqs(); await toGate();
    await ev(() => { const H = window.__H; H.talk('moe'); H.walk(0, -228); H.walk(0, -262, { stopOnCine: true }); H.flush(); H.step(30); const s = H.s(); s.player.hydration = 0; s.player.hurt(99, s.player.x, s.player.z + 1, 1, true); H.step(120 * 4); });
    i = await ev(() => window.__H.info()); check('5 fainted mid-fight: back at a camp flag', i.z > -240, i);
    await toGate(); await ev(() => window.__H.walk(0, -262, { stopOnCine: true }));
    i = await fightStarted(); check('5 after losing: walking back in, the fight is on', i.fight && i.boss === 'active', i);
  }
  if (want('6')) {   // leave mid-fight (city / reload + Continue): same save, a fresh visit
    await ready(true); await reqs(); await toGate();
    await ev(() => { const H = window.__H; H.talk('moe'); H.walk(0, -228); H.walk(0, -262, { stopOnCine: true }); H.flush(); H.step(60); H.s().saveRun(); });
    await ready(false);
    i = await ev(() => window.__H.info()); check('6 back in World 1: gate still open', i.gate && i.boss === 'available', i);
    await toGate(); await ev(() => window.__H.walk(0, -262, { stopOnCine: true }));
    i = await fightStarted(); check('6 back in World 1 after leaving mid-fight: fight starts', i.fight && i.boss === 'active', i);
    await shot('6-return-visit-fight');
  }
  if (want('7')) {   // a save with both tokens but no gate flag: walk up, stand in the arena via a hop, or use FIGHT
    await ready(true); await reqs();
    await ev(() => { const B = window.BRADY_BURNS; B.BurnsSave.flag(1, 'gate', false); B.BurnsSave.save(); });
    await ready(false); await toGate();
    const gd = await ev(() => (window.BRADY_BURNS.BurnsNav.targets(window.__H.s())[0] || null));
    check('7 guide points at Moe while the gate is shut', !!gd && /MOE/.test(gd.label || ''), gd);
    await ev(() => { const H = window.__H; H.hop(-6); H.walk(0, -262, { stopOnCine: true }); });
    i = await fightStarted(); check('7 save without the gate flag: fight starts', i.fight && i.boss === 'active', i);
    await shot('7-no-gate-flag-fight');
  }
  if (want('8')) {   // tokens done, ticket ITEM missing, gate flag set (a mid-fight leave in an older save)
    await ready(true); await reqs();
    await ev(() => { const B = window.BRADY_BURNS, sv = B.BurnsSave.get(); delete sv.items.ticket; B.BurnsSave.flag(1, 'gate', true); B.BurnsSave.save(); });
    await ready(false);
    i = await ev(() => window.__H.info()); check('8 gate restored without the ticket item', i.gate && i.hasTicket, i);
    await toGate(); await ev(() => window.__H.walk(0, -262, { stopOnCine: true }));
    i = await fightStarted(); check('8 fight starts', i.fight && i.boss === 'active', i);
  }
  if (want('9')) {   // gate flag saved but the greeters token never banked (left on the ground): the fight still starts
    await ready(true);
    await ev(() => { const B = window.BRADY_BURNS; B.BurnsSave.addToken(1, 'ticket'); B.BurnsSave.addItem('ticket'); B.BurnsSave.flag(1, 'intro', true); B.BurnsSave.flag(1, 'gate', true); B.BurnsSave.save(); });
    await ready(false); await toGate();
    await ev(() => window.__H.walk(0, -262, { stopOnCine: true }));
    i = await fightStarted(); check('9 gate flag without the greeters token: fight starts', i.fight && i.boss === 'active', i);
  }
  if (want('10')) {  // the fight ends: beating the Man still finishes the world (and the arena stays quiet afterwards)
    await ready(true); await reqs(); await toGate();
    await ev(() => { const H = window.__H; H.talk('moe'); H.walk(0, -262, { stopOnCine: true }); H.flush(); H.step(30); const s = H.s(), b = s.boss; b.hp = 0; b.defeated = true; b.cfg.onDefeat(s); for (let k = 0; k < 40; k++) { H.step(30); H.flush(); } });
    i = await ev(() => { const s = window.__H.s(); return Object.assign(window.__H.info(), { state: s.state, scene: s.constructor.name }); });
    check('10 beating the Man still ends the level (no restart)', i.boss === 'done' && !i.fight && i.state !== 'play', i);
  }
  await browser.close(); server.close();
  const fails = results.filter(r => !r.ok);
  if (errors.length) console.log('page errors:', errors.slice(0, 5).join(' | '));
  console.log(fails.length || errors.length ? 'FAIL: ' + fails.map(f => f.name).concat(errors.slice(0, 3)).join(' | ') : 'PASS: every route into the arena leads to the fight');
  process.exitCode = fails.length || errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
