// Super Brady-O World: Brady's powers in the real game (headless Chrome).
// Sections: picker (the power picker and the action button), air (a second jump press without a jump power),
// jumps (double jump, ground pound, fart float), trips (joint / LSD / mushroom screen moments, the effects setting).
// usage: BRADY_DIST=<dist> node tools/sbw_powers_test.js [section ...]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const labSrc = fs.readFileSync(path.join(__dirname, 'fixtures', 'sbw_lab_levels.js'), 'utf8');
const want = process.argv.slice(2);
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(labSrc);
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
    window.S = () => window.BRADY.Game.scene; window.P = () => window.BRADY.Game.scene.player;
    window.lab = (path, opts) => {
      const B = window.BRADY, T = window.BRADY_TOUR; let spec = window.SBW_LAB; for (const k of path.split('.')) spec = spec[k]; if (spec.spec) spec = spec.spec;
      const lvl = T.TourBuild.fromSpec(T.Tour.countries[spec.host || 'mx'], spec, 90);
      B.Save.data.lives = 9; const g = new B.Play(lvl, opts || {}); B.Game.setScene(g); sim(2); g.player.invuln = 999;
      for (const e of g.entities) if (e.enemy) e.remove = true; sim(0.05); return g;
    };
    window.foe = (g, p, dx, type) => { const C = window.BRADY_TYPES[type || 'mxElote']; const e = new C(g, { x: p.cx + dx, y: p.y + p.h, dir: -1 }); g.spawn(e); e.vx = 0; e.cool = 99; return e; };
    window.TP = () => window.BRADY_POWERS.TourPicker;
  });
  const section = async (name, fn) => { if (want.length && !want.includes(name)) return; try { await fn(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };

  /* ---------- the power picker ---------- */
  await section('picker', async () => {
    const r = await page.evaluate(() => {
      const out = {}, I = window.BRADY.Input;
      let g = lab('gear.stands'), p = P();
      out.none = { list: TP().list(p).length, visible: TP().visible(g) };
      p.collect('sig:taco'); sim(0.05);
      out.one = { list: TP().list(p), visible: TP().visible(g), use: p.actionUse() };
      p.collect('joint'); sim(0.05);
      out.two = { list: TP().list(p), active: TP().active(p), visible: TP().visible(g) };
      p.collect('gear:plane'); sim(1.6);
      out.three = { list: TP().list(p), active: TP().active(p), hands: p.handsKind(), pack: p.pack };
      // the action button fires the active power: the plane flies
      sim(0.05, { actionPressed: true }); out.planeThrown = !!(p.hands && p.hands.thrown); sim(2.5);
      // cycle: 1 -> 2 -> 3 -> back to 1; each step changes what THROW does
      const seq = []; for (let k = 0; k < 3; k++) { I.pickCycle = 1; sim(0.05); seq.push(TP().active(p)); }
      out.seq = seq;
      // pick the taco (in the Backpack): it comes into Brady's hands, the plane goes to the Backpack; nothing is lost
      I.pickSlot = TP().list(p).indexOf('sig:taco') + 1; sim(0.05);
      out.taco = { active: TP().active(p), sig: p.sig && p.sig.id, pack: p.pack, list: TP().list(p).length };
      const t0 = g.entities.filter(e => e.constructor.name === 'TacoShot').length; sim(0.05, { actionPressed: true });
      out.taco.thrown = g.entities.filter(e => e.constructor.name === 'TacoShot').length - t0;
      // smoke: the taco stays in hand while THROW blows smoke
      I.pickSlot = TP().list(p).indexOf('joint') + 1; sim(0.5);
      const s0 = g.entities.filter(e => e.constructor.name === 'SmokePuff').length; sim(0.05, { actionPressed: true });
      out.smoke = { puffs: g.entities.filter(e => e.constructor.name === 'SmokePuff').length - s0, sig: p.sig && p.sig.id };
      // LSD: lasers become active while flying; when the flight ends the previous pick comes back
      p.collect('lsd'); sim(0.05); out.lsd = { active: TP().active(p) };
      p.lsdT = 0.01; sim(0.1); out.lsd.after = TP().active(p);
      // the choice is remembered through a door (a new Player in another area)
      I.pickSlot = TP().list(p).indexOf('sig:taco') + 1; sim(0.05);
      const before = TP().active(p); g.sigCarry = p.sig; g.handsCarry = p.hands; g.packCarry = p.pack; g.loadArea(0, p.x, p.y, p.power); p = P(); p.power = 2;
      out.door = { before, after: TP().active(p) };
      // the HUD slot tap (old Backpack key C / Q) cycles too
      const a0 = TP().active(p); I.packTapped = true; sim(0.05); out.hud = { from: a0, to: TP().active(p) };
      return out;
    });
    check('picker hidden with fewer than two powers', r.none.list === 0 && !r.none.visible && !r.one.visible && r.one.use === 'hands', { none: r.none, one: r.one });
    check('picker shows with two powers; the newest pickup is active', r.two.visible && r.two.list.length === 2 && r.two.active === 'joint', r.two);
    check('three powers: hands + Backpack + smoke, the plane (newest) is active and in hand', r.three.list.length === 3 && r.three.active === 'gear:plane' && r.three.hands === 'gear:plane' && r.three.pack === 'sig:taco', r.three);
    check('the action button uses the active power (plane thrown)', r.planeThrown);
    check('cycling visits every power and wraps around', new Set(r.seq).size === 3 && r.seq[2] === r.three.active, r.seq);
    check('picking the Backpack item swaps it into hands (plane to the Backpack, nothing lost) and THROW tosses tacos', r.taco.active === 'sig:taco' && r.taco.sig === 'taco' && r.taco.pack === 'gear:plane' && r.taco.list === 3 && r.taco.thrown === 1, r.taco);
    check('picking smoke: THROW blows smoke, the taco stays in hand', r.smoke.puffs === 1 && r.smoke.sig === 'taco', r.smoke);
    check('LSD lasers become active, and the previous pick returns when the flight ends', r.lsd.active === 'lsd' && r.lsd.after === 'joint', r.lsd);
    check('the pick is remembered through a door', r.door.before === 'sig:taco' && r.door.after === 'sig:taco', r.door);
    check('the HUD slot (and C / Q) cycles the picker', r.hud.from !== r.hud.to, r.hud);
    // touch: a tap on the chip cycles; the chip never overlaps the jump / action buttons or the pause button
    const layout = await page.evaluate(() => { const L = window.BRADY.Input.layout, c = TP().chip(); return { c, a: L.action, j: L.jump, pz: L.pause }; });
    const gap = (u, v) => Math.hypot(u.x - v.x, u.y - v.y) - u.r - v.r;
    check('chip clear of the action, jump and pause buttons', gap(layout.c, layout.a) > 2 && gap(layout.c, layout.j) > 2 && gap(layout.c, layout.pz) > 2, layout);
    const before = await page.evaluate(() => TP().active(P()));
    await page.touchscreen.tap(layout.c.x, layout.c.y);
    await page.evaluate(() => sim(0.05));
    const after = await page.evaluate(() => TP().active(P()));
    check('a tap on the chip switches the power (and does not jump or throw)', before !== after, { before, after });
  });

  /* ---------- a second jump press in mid-air ---------- */
  await section('air', async () => {
    const r = await page.evaluate(() => {
      const g = lab('gear.stands'), p = P();
      sim(0.05, { jumpPressed: true, jump: true }); sim(0.15, { jump: true });
      const vy0 = p.vy, rot0 = p.anim.state;
      sim(1 / 120, { jumpPressed: true, jump: true }); const st = p.anim.state, vy1 = p.vy;
      sim(0.2, { jump: true });
      return { vy0: Math.round(vy0), vy1: Math.round(vy1), st, rot0, spin: !!p.spin, jumpPow: p.jumpPow || null };
    });
    check('no jump power: a second press in mid-air changes nothing (no spin, no state, no velocity kick)', !r.spin && r.st === r.rot0 && r.st !== 'headbang' && Math.abs(r.vy1 - r.vy0) < 60, r);
    const buf = await page.evaluate(() => {
      const g = lab('gear.stands'), p = P();
      const floor = p.y + p.h; sim(0.05, { jumpPressed: true, jump: true }); sim(0.25, { jump: true });
      let k = 0; while (!(p.vy > 0 && floor - (p.y + p.h) < 14) && k++ < 400) sim(1 / 120);
      sim(1 / 120, { jumpPressed: true, jump: true });   // pressed ~14 px above the floor, still in the air
      const air = !p.onGround; let jumped = false;
      for (let i = 0; i < 30 && !jumped; i++) { sim(1 / 120, { jump: true }); if (p.vy < -300) jumped = true; }
      return { air, jumped, vy: Math.round(p.vy) };
    });
    check('jump buffering kept: a press just before landing jumps on touchdown', buf.air && buf.jumped, buf);
  });

  /* ---------- jump powers ---------- */
  await section('jumps', async () => {
    const r = await page.evaluate(() => {
      const out = {}, T = window.BRADY_TOUR;
      const J = { jumpPressed: true, jump: true };
      const up = (p, sec) => { sim(1 / 120, J); sim(sec || 0.25, { jump: true }); };
      // spring socks: a second, lower jump once per airtime; reset on landing
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:socks'); sim(0.5);
        const y0 = p.y; up(p, 0.2); const vyA = p.vy; sim(1 / 120, J); const vyB = p.vy; sim(0.05, { jump: true }); const flip = p.anim.state;
        sim(0.05); sim(1 / 120, J); const vyC = p.vy; let top = p.y; for (let k = 0; k < 240 && !p.onGround; k++) { sim(1 / 120); top = Math.min(top, p.y); }
        const landed = p.onGround; up(p, 0.2); sim(1 / 120, J); const again = p.vy;
        out.socks = { vyA: Math.round(vyA), vyB: Math.round(vyB), vyC: Math.round(vyC), flip, rise: Math.round((y0 - top) / 32 * 10) / 10, landed, again: Math.round(again), slot: p.jumpPow && p.jumpPow.id, hands: p.hands }; }
      // pound cake: tuck, slam, land: enemies within 3.5 tiles stunned ~2.5 s, harmless, stompable; far ones not; a brick under him breaks
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:cake'); sim(0.5); p.invuln = 0;
        const near = foe(g, p, 80), far = foe(g, p, 230, 'mxPepper'); sim(0.05);
        up(p, 0.25); sim(1 / 120, J); const tuck = p.pound && p.pound.phase; sim(0.1); const tuckState = p.anim.state, hover = Math.abs(p.vy) < 1;
        sim(0.12); const slam = p.pound && p.pound.phase, slamVy = Math.round(p.vy / 32);
        let k = 0; while (!p.onGround && k++ < 200) sim(1 / 120);
        const stunNear = +(near.stunT || 0).toFixed(2), stunFar = +(far.stunT || 0).toFixed(2), wave = g.entities.some(e => e.constructor.name === 'PoundWave');
        // harmless while stunned: touching it doesn't hurt
        p.invuln = 0; const pw = p.power; near.touchPlayer(p); const harmless = p.power === pw && !p.dead && !(p.invuln > 0);
        sim(1.4); const stillStunned = near.stunT > 0; sim(1.4); const recovered = !(near.stunT > 0);
        // a brick floor under his boots breaks and he keeps falling
        const A = g.area, tx = Math.floor(p.cx / 32), ty = Math.floor((p.y + p.h + 2) / 32); const before = A.tiles[ty * A.W + tx];
        A.tiles[ty * A.W + tx] = 2; A.tiles[ty * A.W + tx + 1] = 2; A.tiles[ty * A.W + tx - 1] = 2; A.tiles[(ty + 1) * A.W + tx] = 0; A.tiles[(ty + 1) * A.W + tx + 1] = 0; A.tiles[(ty + 1) * A.W + tx - 1] = 0;
        up(p, 0.25); sim(1 / 120, J); k = 0; while (!(p.pound == null && p.onGround) && k++ < 400) sim(1 / 120);
        out.cake = { tuck, tuckState, hover, slam, slamVy, stunNear, stunFar, wave, harmless, stillStunned, recovered, brick: A.tiles[ty * A.W + tx], brickWas: 2, floorWas: before, fellThrough: p.y + p.h > ty * 32 + 8 }; }
      // stunned enemies can be stomped
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:cake'); sim(0.5); const e = foe(g, p, 70); sim(0.05); up(p, 0.25); sim(1 / 120, J); let k = 0; while (!p.onGround && k++ < 200) sim(1 / 120);
        p.x = e.cx - p.w / 2; p.y = e.y - p.h - 40; p.vy = 300; sim(0.3); out.stomp = { dead: !!(e.dead || e.remove) }; }
      // magic beans: each tap a puff (down) and a lift; 6 puffs a meter, then it fizzles; the meter refills on the ground;
      // the trousers come down while floating and snap back up on landing; a puff knocks out an enemy below
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:beans'); sim(0.5); const jp = p.jumpPow, y0 = p.y;
        up(p, 0.45); const gas = [], sp0 = g.spawn.bind(g); let puffs = 0, lifts = 0, top = p.y; g.spawn = e => { if (e.constructor.name === 'GasPuff') puffs++; return sp0(e); };
        for (let i = 0; i < 7; i++) { const vy = p.vy; sim(1 / 120, J); if (p.vy < vy - 60) lifts++; gas.push(+jp.gas.toFixed(2)); sim(0.22); top = Math.min(top, p.y); }
        g.spawn = sp0; const puffs0 = 0;
        const pantsAir = +jp.pants.toFixed(2), squat = p.anim.state;
        let k = 0; while (!p.onGround && k++ < 600) sim(1 / 120); sim(0.3); const pantsLand = jp.pants, snapped = jp.snapT !== undefined;
        sim(1.2); const refill = +jp.gas.toFixed(2);
        out.beans = { gas, lifts, puffs: puffs - puffs0, rise: Math.round((y0 - top) / 32 * 10) / 10, pantsAir, squat, pantsLand, refill };
        // a puff on an enemy below
        const e = foe(g, p, 0); e.y = p.y + p.h - e.h; p.y -= 2.4 * 32; p.vy = 0; p.onGround = false; sim(1 / 120); p.coyote = 0; jp.down = true; sim(1 / 120, J); sim(0.5);
        out.beans.kill = !!(e.dead || e.remove || e.knocked); }
      // no jump power: nothing; while carrying: nothing; a hit drops the jump power before FORM
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:socks'); sim(0.5); p.carrying = { item: 'egg', from: null, fallY: p.y };
        up(p, 0.2); const vy = p.vy; sim(1 / 120, J); out.carry = { vy0: Math.round(vy), vy1: Math.round(p.vy) }; p.carrying = null;
        sim(1); p.setPower(1, true); p.invuln = 0; p.hurt({ x: p.x + 30, w: 10 }); out.hit = { slot: p.jumpPow, power: p.power, dropped: g.entities.some(e => e.dropped && e.kind === 'gear:socks') };
        sim(0.1); const it = g.entities.find(e => e.dropped && e.kind === 'gear:socks'); if (it) { p.invuln = 0; it.touchPlayer(p); } out.hit.regrab = p.jumpPow && p.jumpPow.id; }
      // one at a time: a new one replaces the old; gear stands and item blocks hand them out
      { lab('gear.stands'); const g = S(), p = P(); p.collect('gear:socks'); p.collect('gear:beans'); out.replace = p.jumpPow.id;
        out.names = ['socks', 'cake', 'beans'].map(id => T.TourPowers.name('gear:' + id)); out.block = T.TourPowers.blockItem('cake', g); }
      return out;
    });
    const so = r.socks;
    check('spring socks: a second mid-air jump, a bit lower than the first, with the flip pose', so.vyB < -400 && so.vyB > -500 && so.flip === 'flip', so);
    check('spring socks: once per airtime, and again after landing', so.vyC > so.vyB + 100 && so.landed && so.again < -400, so);
    check('spring socks sit in the jump slot, not in HANDS', so.slot === 'socks' && !so.hands, so);
    const c = r.cake;
    check('pound cake: tucks (hovering a beat), then slams straight down', c.tuck === 'tuck' && c.tuckState === 'tuck' && c.hover && c.slam === 'slam' && c.slamVy >= 19, c);
    check('pound cake: the landing shockwave stuns enemies within 3.5 tiles for ~2.5 s, not the far ones', c.stunNear > 2.2 && c.stunNear <= 2.5 && c.stunFar === 0 && c.wave, c);
    check('pound cake: stunned enemies are harmless and wake up after ~2.5 s', c.harmless && c.stillStunned && c.recovered, c);
    check('pound cake: a brick under his boots breaks and he falls through', c.brick === 0 && c.fellThrough, c);
    check('pound cake: a stunned enemy can be stomped', r.stomp.dead, r.stomp);
    const b = r.beans;
    check('magic beans: each tap a puff and a lift; six puffs per meter, the seventh fizzles', b.lifts === 6 && b.puffs === 6 && b.gas[5] === 0 && b.gas[6] === 0, b);
    check('magic beans: hovering is limited (the meter caps the climb)', b.rise > 3 && b.rise < 11, b);
    check('magic beans: trousers down in the squat, back up after landing; the meter refills on the ground', b.pantsAir > 0.9 && b.squat === 'squat' && b.pantsLand === 0 && b.refill === 1, b);
    check('magic beans: a green puff knocks out an ordinary enemy below', b.kill, b);
    check('no jump power while carrying something (CARRY levels stay fair)', Math.abs(r.carry.vy1 - r.carry.vy0) < 60, r.carry);
    check('a hit drops the jump power (before FORM); it floats and can be grabbed back', r.hit.slot === null && r.hit.power === 1 && r.hit.dropped && r.hit.regrab === 'socks', r.hit);
    check('one jump power at a time; names; item blocks hand them out', r.replace === 'beans' && r.names.join() === 'SPRING SOCKS,POUND CAKE,MAGIC BEANS' && r.block === 'gear:cake', r);
  });

  /* ---------- trip moments ---------- */
  await section('trips', async () => {
    const r = await page.evaluate(() => {
      const B = window.BRADY, T = window.BRADY_POWERS.TripFX, st = B.Save.data.settings, out = {};
      const run = calm => {
        st.reduceMotion = calm; const o = {};
        let g = lab('gear.stands'), p = P(); p.hurt = () => {};
        // the joint: green for about 1.35 s with a slow-mo, then clear
        p.collect('joint'); sim(0.08); o.jointStart = +T.levels(g).joint.toFixed(2); sim(0.3); o.jointMid = +T.levels(g).joint.toFixed(2); o.slowmo = +T.timeScale(g).toFixed(2);
        const t0 = g.t; sim(0.5); o.worldDt = +((g.t - t0) / 0.5).toFixed(2); sim(1.2); o.jointEnd = T.levels(g).joint;
        // LSD: strong first, subtle while flying, gone after the flight
        p.collect('lsd'); sim(1.2); o.lsdPeak = +T.levels(g).lsd.toFixed(2); sim(4); o.lsdLow = +T.levels(g).lsd.toFixed(2); o.flying = p.lsdT > 0;
        sim(9); o.lsdEnd = +T.levels(g).lsd.toFixed(3);
        // the mushroom
        p.collect('mushroom'); sim(0.8); o.shroom = +T.levels(g).shroom.toFixed(2); sim(5); o.shroomEnd = T.levels(g).shroom;
        // draw a frame with every trip on (no errors), and check the breath copy only happens at full motion
        g.tripJoint = 0.8; g.lsdK = 1; g.dizzy = 2; B.PostFX = window.BRADY_POWERS.PostFX; window.BRADY_POWERS.PostFX.tripWarp = null;
        B.Game.ctx.setTransform(1, 0, 0, 1, 0, 0); g.draw(B.Game.ctx); o.breath = !!window.BRADY_POWERS.PostFX.tripWarp;
        o.frames = T.frames.length;
        return o;
      };
      out.full = run(false); out.calm = run(true); st.reduceMotion = false;
      return out;
    });
    const f = r.full, c = r.calm;
    check('joint pickup: a green moment that starts at once, holds, then clears (~1.35 s)', f.jointStart > 0 && f.jointMid > 0.9 && f.jointEnd === 0, f);
    check('joint pickup: the world eases into slow-mo (and out)', f.slowmo < 0.7 && f.worldDt < 0.95, { slowmo: f.slowmo, worldDt: f.worldDt });
    check('LSD: strong at first, a subtle level while flying, gone after the flight', f.lsdPeak > 0.9 && f.lsdLow > 0.2 && f.lsdLow < 0.4 && f.flying && f.lsdEnd === 0, f);
    check('mushroom: same family, starts and ends', f.shroom > 0.9 && f.shroomEnd === 0, f);
    check('fractal frames cached (built a few rows at a time)', f.frames > 0, f.frames);
    check('full effects: the world breathes (a warped copy of the view)', f.breath, f);
    check('reduced effects: no slow-mo, no breath, the trips still start and end', c.slowmo === 1 && c.worldDt > 0.98 && !c.breath && c.jointMid > 0.9 && c.jointEnd === 0 && c.lsdEnd === 0, c);
    // the pause menu offers the switch in tour levels
    const pause = await page.evaluate(() => { const g = S(); g.openPause(); const labels = g.pauseUI.map(b => b.label); const fx = g.pauseUI.find(b => /^FX /.test(b.label)); const before = fx.label; fx.fn(); const after = g.pauseUI.find(b => /^FX /.test(b.label)).label; fx.fn(); g.closePause(); return { labels, before, after }; });
    check('pause menu: an FX FULL / FX CALM switch', pause.before === 'FX FULL' && pause.after === 'FX CALM', pause);
  });

  check('no page errors', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
