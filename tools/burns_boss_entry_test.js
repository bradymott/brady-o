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
        if (s.cine || s.dialog.open) { if (o.stopOnCine && s.cine) break; H.flush(); }
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
  // ---- any world: the same moves, wherever the boss lives ----
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, G = window.BRADY.Game, I = window.BRADY.Input, H = window.__H;
    const settle = () => { const s = G.scene; if (s.state === 'load') s.load(); H.step(4); H.flush(); H.step(30); H.flush(); H.clearInput(); return s.state; };
    H.boss = 'boss';
    // play world w on its own (debug), on a fresh or the kept save
    H.enterW = (w, fresh) => { if (fresh) { localStorage.clear(); window.BRADY.Save.load(); } B.debug.play(w); return settle(); };
    // the playtest jump: a fresh save, Black Rock City, pause menu TEST: JUMP TO WORLD -> w
    H.coldJump = (w) => { localStorage.clear(); window.BRADY.Save.load(); B.debug.play(B.BurnsTestJump.CITY); settle(); const c = G.scene; B.BurnsTestJump.go(c, w); return settle(); };
    // leave mid-fight to the city and come straight back (pause menu, the same way LEAVE does)
    H.leaveCity = () => { const s = G.scene; B.BurnsTestJump.go(s, B.BurnsTestJump.CITY); return G.scene.worldId; };
    H.reenter = (w) => { const c = G.scene; B.BurnsTestJump.go(c, w); return settle(); };
    // every mission the boss needs, done as a player would have it (busywork far from the arena is completed directly)
    H.reqsW = (id) => { const s = G.scene, M = s.missions, need = new Set(), add = r => { if (typeof r !== 'string' || r.indexOf(':') >= 0 || need.has(r)) return; need.add(r); const m = M.get(r); for (const q of (m && m.def.requires) || []) add(q); };
      for (const r of M.get(id || H.boss).def.requires || []) add(r);
      for (let k = 0; k < 12; k++) { let did = false; for (const m of M.list) { if (!need.has(m.id) || m.state === 'done') continue; if ((m.def.requires || []).every(r => M.reqDone(r))) { M.complete(m.id, null, true); H.flush(); H.step(10); H.flush(); did = true; } } if (!did) break; }
      H.flush(); H.step(30); H.grabAll(); const miss = [...need].filter(r => !B.BurnsSave.hasToken(s.worldId, r) && (M.get(r).def.token !== false)); for (const r of miss) B.BurnsSave.addToken(s.worldId, r); B.BurnsSave.save(); /* a token the busywork left out of reach: banked as if picked up */ return M.state(id || H.boss); };
    H.grabAll = () => { const s = G.scene, p = s.player, x0 = p.x, z0 = p.z; for (const P of s.pickups.items) if (!P.taken && P.base === 'token' && P.mission !== H.boss) { p.teleport(P.x, P.y0 - 0.9, P.z); p.grounded = false; H.step(2); H.flush(); } H.flush(); H.step(20); p.teleport(x0, s.world.height(x0, z0), z0); H.step(10); };
    H.tp = (x, z, yaw) => { const s = G.scene, p = s.player; if (p.vehicle) p.vehicle.dismount(p); p.teleport(x, s.world.height(x, z), z, yaw || 0); s.camYaw = yaw || 0; s.snapCam = true; H.step(10); };
    H.faint = () => { const s = G.scene, p = s.player; p.invT = 0; p.hydration = 0; p.hurt(99, p.x, p.z + 1, 1, true); H.step(120 * 4); H.flush(); H.step(60); };
    H.info2 = () => { const s = G.scene, p = s.player, it = s.interactTarget && s.interactTarget(), nav = B.BurnsNav ? B.BurnsNav.targets(s)[0] : null;
      return { world: s.worldId, x: Math.round(p.x), z: Math.round(p.z), boss: s.missions.state(H.boss), fight: !!(s.boss && s.boss.active && !s.boss.defeated), cine: !!s.cine, hint: s._bossHint || null, button: it ? it.label : null, guide: nav ? nav.label : null, locked: !!p.locked || undefined, ride: p.vehicle ? p.vehicle.kind || 'vehicle' : undefined, dlg: s.dialog.open || undefined, st: s.state !== 'play' ? s.state : undefined }; };
    H.shot2 = () => { const s = G.scene; G.forceTouchUI = true; s.fade = 0; s.fadeTarget = 0; s.banners = s.banners.filter(b => /NOT YET|FIGHT|FOREMAN|THE MAN|RUSTY|QUEEN|CHAD|GIANT|SAUCER/.test(b.title || '')); s.dayCardT = -1; s.lastFrame = performance.now() - 33; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx); };
  });
  const tag = process.env.TAG ? '-' + process.env.TAG : '';
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const shot = async (name) => { if (!out) return; await ev(() => window.__H.shot()); await page.screenshot({ path: path.join(out, name + '.png') }); };
  const shot2 = async (name) => { if (!out) return; await ev(() => { window.__H.step(2); window.__H.shot2(); }); await page.screenshot({ path: path.join(out, name + tag + '.png') }); };
  const settleW = async () => { for (let i = 0; i < 100 && (await ev(() => window.__H.s().state)) !== 'play'; i++) { await page.waitForTimeout(200); await ev(() => { window.__H.step(2); window.__H.flush(); }); } };
  const inW = async (w, fresh) => { await ev((a) => window.__H.enterW(a[0], a[1]), [w, fresh]); await settleW(); };
  const cold = async (w) => { await ev(a => window.__H.coldJump(a), w); await settleW(); };
  const fight2 = async () => { await ev(() => { window.__H.step(30); window.__H.flush(); window.__H.step(60); }); return ev(() => window.__H.info2()); };
  const walkIn = (x0, z0, x1, z1) => ev(a => { const H = window.__H; H.tp(a[0], a[1], Math.atan2(a[2] - a[0], a[3] - a[1])); return H.walk(a[2], a[3], { stopOnCine: true, max: 120 * 30 }); }, [x0, z0, x1, z1]);
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

  /* ---------------- World 9: the Man in the storm (arena (40,-190) r34; the walk-in circle is at its south edge) ---------------- */
  const W9 = { x: 40, z: -190 };
  if (want('w9a')) {   // straight in from the Outpost side, through the walk-in circle
    await inW(9, true); await ev(() => window.__H.reqsW());
    await walkIn(36, -120, W9.x, W9.z);
    i = await fight2(); check('w9a straight walk-in starts the fight', i.fight && i.boss === 'active', i);
  }
  if (want('w9b')) {   // in from the west side (the Wire Moth / trash fence side): never touches the walk-in circle
    await inW(9, true); await ev(() => window.__H.reqsW());
    await walkIn(-40, -196, W9.x, -196);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w9-side-entry');
    i = await fight2(); check('w9b side walk-in (west) starts the fight', i.fight && i.boss === 'active', i);
  }
  if (want('w9c')) {   // from behind (north, the fence side)
    await inW(9, true); await ev(() => window.__H.reqsW());
    await walkIn(44, -250, 44, -200);
    i = await fight2(); check('w9c walk-in from behind starts the fight', i.fight && i.boss === 'active', i);
  }
  if (want('w9d')) {   // a cold playtest jump: nothing done yet, walk into the arena
    await cold(9);
    await walkIn(36, -130, W9.x, -182);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w9-no-reqs');
    check('w9d cold jump, no requirements: told what to do, no fight', !i.fight && !!i.hint, i);
    check('w9d the guide arrow points at the next step (not the arena)', !!i.guide && !/MAN/.test(i.guide), i);
    await ev(() => { window.__H.press(); window.__H.step(30); }); i = await ev(() => window.__H.info2()); await shot2('w9-no-reqs-pressed');
    check('w9d FIGHT button explains', i.button === 'FIGHT: THE MAN' || !!i.hint, i);
  }
  if (want('w9e')) {   // lose (faint) and walk back
    await inW(9, true); await ev(() => window.__H.reqsW());
    await walkIn(36, -120, W9.x, W9.z); await fight2();
    await ev(() => window.__H.faint());
    i = await ev(() => window.__H.info2()); check('w9e fainted mid-fight: respawned', !i.cine, i);
    await walkIn(-30, -196, W9.x, -196);
    i = await fight2(); check('w9e after losing: walking back in (side), the fight is on', i.fight && i.boss === 'active', i);
  }
  if (want('w9f')) {   // leave to the city mid-fight and come back (playtest jump path), then in from the east
    await cold(9); await ev(() => window.__H.reqsW());
    await walkIn(36, -120, W9.x, W9.z); i = await fight2(); check('w9f fight on before leaving', i.fight, i);
    await ev(() => window.__H.leaveCity()); await ev(() => window.__H.reenter(9)); await settleW();
    await walkIn(110, -194, W9.x, -194);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w9-reentered-side');
    i = await fight2(); check('w9f left mid-fight, re-entered, side walk-in: fight starts', i.fight && i.boss === 'active', i);
  }
  if (want('w9g')) {   // reload mid-fight, Continue, in from the east
    await inW(9, true); await ev(() => window.__H.reqsW());
    await walkIn(36, -120, W9.x, W9.z); await fight2(); await ev(() => window.__H.s().saveRun());
    await inW(9, false);
    await walkIn(110, -186, W9.x, -186);
    i = await fight2(); check('w9g reload + Continue, side walk-in: fight starts', i.fight && i.boss === 'active', i);
  }

  /* ---------------- World 8: Foreman Rusty (DPW yard (0,-118) r30 inside a container wall; gate at z -86, walk-in circle r7) ---------------- */
  const W8 = { x: 0, z: -118 };
  if (want('w8a')) {   // straight through the gate
    await inW(8, true); await ev(() => window.__H.reqsW());
    await walkIn(0, -70, W8.x, -110);
    i = await fight2(); check('w8a straight in through the gate starts the fight', i.fight && i.boss === 'active', i);
  }
  if (want('w8b')) {   // through the gap beside the gate bar (east side of the opening)
    await inW(8, true); await ev(() => window.__H.reqsW());
    await walkIn(9, -70, 9, -108);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w8-side-entry');
    i = await fight2(); check('w8b in beside the gate (missing the circle) starts the fight', i.fight && i.boss === 'active', i);
  }
  if (want('w8c')) {   // a cold playtest jump: nothing fueled, walk into the yard
    await cold(8);
    await walkIn(0, -70, W8.x, -108);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w8-no-reqs');
    check('w8c cold jump, no requirements: told what to do, no fight', !i.fight && !!i.hint, i);
    check('w8c the guide arrow points at the next step (not the yard)', !!i.guide && !/RUSTY/.test(i.guide), i);
    await ev(() => { const H = window.__H; H.tp(0, -112, Math.PI); H.press(); H.step(30); }); i = await ev(() => window.__H.info2());
    check('w8c FIGHT button explains', !i.fight && !!i.hint, i);
  }
  if (want('w8d')) {   // lose (faint) and walk back the way the arrow points
    await inW(8, true); await ev(() => window.__H.reqsW());
    await walkIn(0, -70, W8.x, -110); await fight2();
    await ev(() => window.__H.faint());
    i = await ev(() => window.__H.info2()); check('w8d fainted mid-fight: respawned outside', i.z > -88, i);
    await shot2('w8-after-faint');
    await ev(() => { const H = window.__H; H.tp(0, -76, Math.PI); H.walk(0, -110, { max: 120 * 20 }); });
    i = await fight2(); check('w8d after losing: walking back in along the road, the fight is on', i.fight && i.boss === 'active' && i.z < -88, i);
  }
  if (want('w8e')) {   // leave to the city mid-fight and come back
    await cold(8); await ev(() => window.__H.reqsW());
    await walkIn(0, -70, W8.x, -110); i = await fight2(); check('w8e fight on before leaving', i.fight, i);
    await ev(() => window.__H.leaveCity()); await ev(() => window.__H.reenter(8)); await settleW();
    await walkIn(-9, -70, -9, -108);
    i = await fight2(); check('w8e left mid-fight, re-entered, in beside the gate: fight starts', i.fight && i.boss === 'active', i);
  }
  if (want('w8f')) {   // reload mid-fight, Continue
    await inW(8, true); await ev(() => window.__H.reqsW());
    await walkIn(0, -70, W8.x, -110); await fight2(); await ev(() => window.__H.s().saveRun());
    await inW(8, false);
    await walkIn(0, -70, W8.x, -110);
    i = await fight2(); check('w8f reload + Continue, through the gate: fight starts', i.fight && i.boss === 'active', i);
  }

  /* ---------------- World 7: the Glitter Queen (dance floor (0,-66) r22; only the sunrise scene used to start her) ---------------- */
  if (want('w7a')) {   // the sunrise is done, then a reload (the Queen never came back down)
    await inW(7, true); await ev(() => window.__H.reqsW()); await ev(() => window.__H.s().saveRun());
    await inW(7, false);
    await walkIn(0, -20, 0, -60);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w7-reload-floor');
    i = await fight2(); check('w7a after a reload, walking onto the dance floor brings the Queen down', i.fight && i.boss === 'active', i);
  }
  if (want('w7b')) {   // cold jump: on the floor before the sunrise
    await cold(7);
    await walkIn(-30, -66, -4, -66);
    i = await ev(() => window.__H.info2()); await shot2('w7-no-reqs');
    check('w7b cold jump, before the sunrise: told what to do, no fight', !i.fight && !!i.hint, i);
    await ev(() => { const H = window.__H; H.tp(0, -60, Math.PI); H.press(); H.step(30); }); i = await ev(() => window.__H.info2());
    check('w7b FIGHT button explains', !i.fight && !!i.hint, i);
  }
  if (want('w7c')) {   // leave to the city mid-fight, come back, step on from the side
    await cold(7); await ev(() => window.__H.reqsW()); await walkIn(0, -20, 0, -60); i = await fight2(); check('w7c fight on before leaving', i.fight, i);
    await ev(() => window.__H.leaveCity()); await ev(() => window.__H.reenter(7)); await settleW();
    await walkIn(40, -70, 10, -70);
    i = await fight2(); check('w7c left mid-fight, re-entered, side walk-on: Queen fights', i.fight && i.boss === 'active', i);
  }
  if (want('w7d')) {   // faint mid-fight, walk back
    await inW(7, true); await ev(() => window.__H.reqsW()); await fight2(); await ev(() => window.__H.faint());
    await walkIn(0, -20, 0, -60);
    i = await fight2(); check('w7d after fainting the fight is still on', i.fight && i.boss === 'active', i);
  }

  /* ---------------- World 6: Chad (waits at the Big Empty (0,-134); used to come only during a party) ---------------- */
  if (want('w6a')) {   // party won, then a reload: walk up to Chad
    await inW(6, true); await ev(() => window.__H.reqsW()); await ev(() => { const H = window.__H; H.step(120 * 5); H.flush(); H.s().saveRun(); });
    await inW(6, false);
    await walkIn(-30, -110, 0, -134);
    await ev(() => window.__H.step(120)); i = await ev(() => window.__H.info2()); await shot2('w6-reload-bigempty');
    i = await fight2(); check('w6a after a reload, walking into the Big Empty starts the showdown', i.fight && i.boss === 'active', i);
    await ev(() => window.__H.faint());
    i = await ev(() => window.__H.info2()); check('w6a fainted mid-fight: the arrow points at Chad, not the empty lot', /CHAD/.test(i.guide || '') && i.fight, i);
  }
  if (want('w6b')) {   // cold jump: Chad before any party
    await cold(6);
    await walkIn(-30, -110, 8, -142);
    i = await ev(() => window.__H.info2()); await shot2('w6-no-reqs');
    check('w6b cold jump: told what to do, no fight', !i.fight && !!i.hint, i);
    await ev(() => { const H = window.__H; H.tp(10, -144, Math.PI); H.press(); H.step(30); }); i = await ev(() => window.__H.info2());
    check('w6b FIGHT button explains', !i.fight && !!i.hint && i.button === 'FIGHT: CHAD', i);
  }

  /* ---------------- World 2: the escape (starts by SLEEPing in Kevin's tent; the arrow used to point at the RV) ---------------- */
  if (want('w2a')) {
    await inW(2, true); await ev(() => window.__H.reqsW('escape')); await ev(() => window.__H.s().saveRun());
    await inW(2, false);

    const rv = await ev(() => { const W = window.BRADY_BURNS.BURNS_W2; return W ? W.RLD : null; });
    if (rv) { await walkIn(rv[0] - 20, rv[1], rv[0], rv[1]); await ev(() => window.__H.step(60)); }
    i = await ev(() => Object.assign(window.__H.info2(), { escape: window.__H.s().missions.state('escape') })); await shot2('w2-at-rv');
    check('w2a at the RV before sleeping: told to sleep in Kevin\'s tent', !!i.hint && /tent/i.test(i.hint), i);
    check('w2a ...and the arrow points at Kevin\'s tent', /SLEEP|TENT/.test(i.guide || ''), i);
    const ok = await ev(() => { const H = window.__H, s = H.s(), W = window.BRADY_BURNS.BURNS_W2; if (!W) return 'no test hook'; const T = W.state.tent; H.tp(T.x + 1, T.z + 1); H.walk(T.x, T.z, { r: 0.8, max: 600 }); const lab = (s.interactTarget() || {}).label; H.press(); H.flush(); H.step(60); return lab + ':' + s.missions.state('escape'); });
    check('w2a SLEEP in the tent starts the escape', /SLEEP:active/.test(ok), ok);
  }

  /* ---------------- World 10: the Man (crowd barrier r70; one walk-in circle at (0,68) r9) ---------------- */
  if (want('w10a')) {   // in through the edge of the barrier gap
    await inW(10, true); await ev(() => { window.__H.boss = 'saucer'; }); await ev(() => window.__H.reqsW('saucer'));
    await ev(() => { const H = window.__H; H.tp(10.5, 88, Math.PI); H.walk(10.5, 50, { stopOnCine: true }); H.walk(0, 20, { stopOnCine: true }); });
    await ev(() => window.__H.step(60)); i = await ev(() => window.__H.info2()); await shot2('w10-gap-edge');
    i = await fight2(); check('w10a in by the gap edge: the saucer fight starts', i.fight && i.boss === 'active', i);
    await ev(() => { window.__H.boss = 'boss'; });
  }
  if (want('w10b')) {   // reload during the giant phase (spawns at the Giant camp flag, inside the circle)
    await inW(10, true); await ev(() => window.__H.reqsW('saucer'));
    await ev(() => { const B = window.BRADY_BURNS, sv = B.BurnsSave.get(); B.BurnsSave.addToken(10, 'saucer'); sv.checkpoint[10] = 'cp_giant'; B.BurnsSave.save(); });
    await inW(10, false); await ev(() => { window.__H.boss = 'giant'; });
    await ev(() => { const H = window.__H; H.walk(0, 20, { stopOnCine: true, max: 120 * 10 }); H.step(60); });
    i = await ev(() => window.__H.info2()); await shot2('w10-giant-reload');
    i = await fight2(); check('w10b reload in the giant phase: the giant fight resumes', i.fight && i.boss === 'active', i);
    await ev(() => { window.__H.boss = 'boss'; });
  }
  if (want('w10c')) {   // cold jump, walked in on foot
    await cold(10); await ev(() => { window.__H.boss = 'saucer'; });
    await ev(() => { const H = window.__H, s = H.s(); if (s.player.vehicle) s.player.vehicle.dismount(s.player); H.tp(0, 80, Math.PI); H.walk(0, 30, { stopOnCine: true }); H.step(60); });
    i = await ev(() => window.__H.info2()); await shot2('w10-no-reqs');
    check('w10c cold jump on foot: told what to do, no fight', !i.fight && !!i.hint, i);
    await ev(() => { window.__H.boss = 'boss'; });
  }

  /* ---------------- World 16: the yellow bike (only the post-contest scene used to start it) ---------------- */
  if (want('w16a')) {
    await inW(16, true); await ev(() => window.__H.reqsW('contest')); await ev(() => { const B = window.BRADY_BURNS; B.BurnsSave.addToken(16, 'contest'); B.BurnsSave.save(); });
    await inW(16, false);
    const r = await ev(() => { const H = window.__H, s = H.s(), p = s.player; p.teleport(13, 4.3, -37.2, Math.PI); H.step(30); const lab = (s.interactTarget() || {}).label || null; H.press(); H.flush(); H.step(30); return { lab, bike: s.missions.state('bike'), ride: s.missions.state('ride') }; });
    await shot2('w16-bike-tree');
    check('w16a contest won, reloaded: TAKE THE BIKE works', r.lab === 'TAKE THE BIKE' && r.bike === 'done', r);
  }

  /* ---------------- Worlds 3, 4, 5: big walk-in circles, but a ring just outside them, and no word before the requirements ---------------- */
  for (const [w, name, ax, az, x0, z0, x1, z1] of [[3, 'Baron (bike graveyard)', -62, -78, -62, -104, -62, -96], [4, 'Velvet (dome, inside the door)', 22, -62, 22, -30, 22, -40.5], [5, 'Barter Baron (dock)', -29, -112, -60, -109.5, -45, -109.5]]) {
    if (want('w' + w + 'a')) {   // requirements done; stop just inside the arena, outside the old circle
      await inW(w, true); await ev(() => window.__H.reqsW());
      await walkIn(x0, z0, x1, z1); await ev(() => window.__H.step(60));
      i = await ev(() => window.__H.info2()); await shot2('w' + w + '-edge');
      i = await fight2(); check('w' + w + 'a ' + name + ': standing at the arena edge starts the fight', i.fight && i.boss === 'active', i);
    }
    if (want('w' + w + 'b')) {   // cold jump: in the arena with nothing done
      await cold(w);
      await walkIn(x0, z0, ax, az + 6); await ev(() => window.__H.step(60));
      i = await ev(() => window.__H.info2()); await shot2('w' + w + '-no-reqs');
      check('w' + w + 'b ' + name + ' cold jump: told what to do, no fight', !i.fight && !!i.hint, i);
    }
  }

  /* ---------------- won but never finished: quit during the victory scene, come back ---------------- */
  for (const [w, id] of [[1, 'boss'], [9, 'boss'], [17, 'lookouts']]) {
    if (!want('fin' + w)) continue;
    await inW(w, true);
    await ev(a => { const B = window.BRADY_BURNS; B.BurnsSave.addToken(a[0], a[1]); for (const k of ['intro']) B.BurnsSave.flag(a[0], k, true); B.BurnsSave.save(); }, [w, id]);
    await inW(w, false);
    i = await ev(() => { const H = window.__H, s = H.s(); for (let k = 0; k < 12; k++) { H.step(120); H.flush(); } return { state: s.state, finishing: !!s.finishing, done: !!window.BRADY_BURNS.BurnsSave.get().worldDone[s.worldId] }; });
    check('fin' + w + ' finale won but world not finished: it finishes on the next visit', i.done && (i.finishing || i.state !== 'play'), i);
  }
  await browser.close(); server.close();
  const fails = results.filter(r => !r.ok);
  if (errors.length) console.log('page errors:', errors.slice(0, 5).join(' | '));
  console.log(fails.length || errors.length ? 'FAIL: ' + fails.map(f => f.name).concat(errors.slice(0, 3)).join(' | ') : 'PASS: every route into the arena leads to the fight');
  process.exitCode = fails.length || errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });   // (exit: an open browser would keep node alive)
