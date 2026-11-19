// Screenshots (and in-browser checks) of RULE 7's animal hats and the ANIMAL HATS / DANCING switches
// (src/28_tour_sc_hats.js, src/28_tour_sb_buttons.js).
//   --sheet   a contact sheet per land: every animal type drawn big (facing right and left) with its hat, plus the
//             measured head point (a cyan cross) and the head guess from its drawn pixels (a magenta dot); writes
//             heads.json (the guesses) next to the sheets. For checking each type's HEADS row by eye.
//   scenes    World 22's numbered doors, a hidden door (willow curtain), the joint's smoke puffs, the acid trip's
//             rainbow lasers, the piri-piri chili's flames, a boss, a secret room's doors, an overworld map, hat
//             close-ups in several lands, the Settings page. Checks: a hat is only ever drawn on a type in
//             TourHats.HEADS, never on a door / puff / laser / flame / boss; the switches hide and show at once.
// Phone landscape (874x402 @2x) and portrait (402x874 @2x). Silent (tools/sbw_silent.js). Full resolution pinned.
// usage: BRADY_DIST=<dist> node tools/sbw_hats_shots.js <outdir> [--checks] [--sheet] [--portrait | --landscape] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'hats-shots'), checksOnly = args.includes('--checks'), sheetOnly = args.includes('--sheet');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

async function session(viewport, tag, fn) {
  // the sheet reads its own canvas back: file:// sprites would taint it
  const browser = await chromium.launch(sheetOnly ? { args: ['--allow-file-access-from-files', '--disable-web-security'] } : {});
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR;
    window.S = () => B.Game.scene; window.P = () => B.Game.scene.player;
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; delete d.settings.ruleFx; delete d.settings.hatsFx; delete d.settings.danceFx; T.TourProgress.data(); };
    window.rules = list => { const P0 = T.TourProgress.data(); for (const n of list) P0.rules[n] = { at: { 3: '1-4', 7: '3-1', 9: '5-1', 10: '11-4', 12: '8-3', 1: '22-5' }[n] }; T.TourRules.syncFx(); };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); g.player.invuln = 999; return g; };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.go = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = (A.anchors && (A.anchors.in || A.anchors.start)) || (k === 0 ? g.level.start : { x: 5 * 32 + 16, y: (A.H - 4) * 32 }); if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.freeze = () => { const g = S(); g._upd = g.update; g.update = function () { this.t += 1 / 120; }; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
    // every hat drawn, by type key (TourHats.draw is wrapped while a scene runs)
    window.hatLog = new Map();
    const H = T.TourHats, d0 = H.draw;
    H.draw = function (ctx, e, play) { const k = (e._hatInfo && e._hatInfo.type) || '?', c = e.constructor && e.constructor.name; window.hatLog.set(k + '|' + c, (window.hatLog.get(k + '|' + c) || 0) + 1); return d0.call(this, ctx, e, play); };
    window.hatTypes = () => { const r = {}; for (const [k, n] of window.hatLog) r[k] = n; window.hatLog.clear(); return r; };
    // put a critter of type k on the floor near Brady (dx tiles ahead), facing him
    window.drop = (k, dx, s) => { const g = S(), p = P(), C = B.ENTITY_TYPES[k]; const e = new C(g, Object.assign({ type: k, x: p.cx + dx * 32, y: p.y + p.h, dir: dx > 0 ? -1 : 1 }, s || {})); g.spawn(e); return e; };
    // a world point -> page (css) point
    window.toCss = (wx, wy) => { const G = B.Game, g = S(); return { x: G.gameRect.x + (wx - g.camX) * G.S / G.dpr, y: G.gameRect.y + (wy - g.camY) * G.S / G.dpr }; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async (name, clip) => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + '-' + name), clip }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(tag + ' ' + name + ' runs', false, String(e.stack || e.message).slice(0, 400)); } };
  await fn(page, shot, run);
  const errs = sheetOnly ? errors.filter(e => !/ERR_FILE_NOT_FOUND/.test(e)) : errors;   // the sheet asks for every land's atlas names, some of which don't exist
  check(`${tag}: no page errors`, !errs.length, errs.slice(0, 5));
  await browser.close();
}

/* ---------- the contact sheets ---------- */
// measure(e): the head guess from e's drawn pixels (white eyes, else the top of its front part), in hitbox fractions
const sheetCode = () => {
  window.measureHead = (e, g, sc, CW, CH, Z, dir) => {
    e.dir = dir; e.facing = dir;
    const ox = CW / 2 - e.cx * Z, oy = CH - 26 - (e.y + e.h) * Z;
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, CW, CH); sc.setTransform(Z, 0, 0, Z, ox, oy);
    try { e.draw(sc, g.t); } catch (err) { return { err: String(err), ox, oy }; }
    const D = sc.getImageData(0, 0, CW, CH).data, A = (x, y) => D[(y * CW + x) * 4 + 3] > 60;
    let x0 = CW, x1 = -1, y0 = CH, y1 = -1;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (A(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    let gx = CW / 2, gy = 20, how = '-';
    if (x1 >= 0) {
      let ex = 0, ey = 0, en = 0, on = 0; const yMid = y0 + (y1 - y0) * 0.6;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * CW + x) * 4; if (D[i + 3] < 200) continue; on++; if (y <= yMid && D[i] > 236 && D[i + 1] > 236 && D[i + 2] > 236) { ex += x; ey += y; en++; } }
      if (en >= 6 && en < on * 0.05) { ex /= en; ey /= en; how = 'eye'; let ty = Math.round(ey); const xx = Math.round(ex); while (ty > 0 && A(xx, ty - 1)) ty--; gx = ex; gy = ty + 3; }
      else {
        how = 'top'; const bw = x1 - x0, fa = dir > 0 ? x0 + bw * 0.3 : x0, fb = dir > 0 ? x1 : x1 - bw * 0.3;
        let top = CH; for (let y = y0; y <= y1 && top === CH; y++) for (let x = Math.round(fa); x <= fb; x++) if (A(x, y)) { top = y; break; }
        let sx = 0, sn = 0; const band = Math.max(4, (y1 - y0) * 0.14);
        for (let y = top; y < top + band; y++) for (let x = Math.round(fa); x <= fb; x++) if (A(x, y)) { sx += x; sn++; }
        gx = sn ? sx / sn : (fa + fb) / 2; gy = top + 3;
      }
    }
    const wx = (gx - ox) / Z, wy = (gy - oy) / Z;
    return { fx: +(((wx - e.cx) / e.w) * dir).toFixed(2), fy: +((wy - (e.y + e.h)) / e.h).toFixed(2), how, ox, oy };
  };
};
const sheet = async (page) => {
  const lands = await page.evaluate(() => { const T = window.BRADY_TOUR; return T.Tour.worldList().map(w => ({ w, cc: T.Tour.byWorld[w].id })); });
  await page.evaluate(sheetCode);
  const guesses = {};
  for (const L of lands) {
    await page.evaluate(L => {
      const B = window.BRADY, T = window.BRADY_TOUR, H = T.TourHats;
      fresh(); play(L.w + '-1'); freeze();
      // the land's animal types (by Tour.enemyInfo, or a friend type named for the land); a few look-alikes too
      const EXTRA = (window.SHEET_EXTRA || []);
      const mine = k => (T.Tour.enemyInfo[k] && T.Tour.enemyInfo[k].country === L.cc) || (!T.Tour.enemyInfo[k] && k.indexOf(L.cc) === 0 && /[A-Z]/.test(k[L.cc.length]));
      window._types = Object.keys(B.ENTITY_TYPES).filter(k => mine(k) && (!H.NOT.has(k) || EXTRA.indexOf(k) >= 0));
      const at = new Set([L.cc]); for (const k of window._types) { const C = B.ENTITY_TYPES[k]; if (C && C.cfg && C.cfg.atlas) at.add(C.cfg.atlas); }
      B.Atlas.need([...at]);
    }, L);
    await page.waitForTimeout(1500);
    const n = await page.evaluate(() => window._types.length);
    for (let p0 = 0; p0 < n; p0 += 6) {
      const r = await page.evaluate(p0 => {
        const B = window.BRADY, T = window.BRADY_TOUR, H = T.TourHats, g = S(), types = window._types.slice(p0, p0 + 6);
        const CW = 270, CH = 250, Z = 4, cols = 2, rows = Math.ceil(types.length / cols) || 1;
        const cv = document.createElement('canvas'); cv.width = CW * cols * 2; cv.height = CH * rows; const c = cv.getContext('2d');
        const scratch = document.createElement('canvas'); scratch.width = CW; scratch.height = CH; const sc = scratch.getContext('2d', { willReadFrequently: true });
        const out = {};
        types.forEach((k, n) => {
          const C = B.ENTITY_TYPES[k]; let e;
          try { e = new C(g, { type: k, x: 3000, y: 3000, dir: 1 }); } catch (err) { out[k] = { err: String(err) }; return; }
          if (e.state === 'wait') { e.state = 'jump'; e.vy = -100; }
          if (e.camo !== undefined) e.camo = 0;
          e.t = 0.3; const res = { R: window.measureHead(e, g, sc, CW, CH, Z, 1), L: window.measureHead(e, g, sc, CW, CH, Z, -1) };
          const had = H.HEADS[k];
          if (!had && res.R && res.L) H.HEADS[k] = [res.R.fx, res.L.fx, res.R.fy, 0];
          for (const dir of [1, -1]) {
            const m = res[dir > 0 ? 'R' : 'L']; e.dir = dir; e.facing = dir;
            const cx0 = (n % cols) * CW * 2 + (dir > 0 ? 0 : CW), cy0 = Math.floor(n / cols) * CH;
            c.save(); c.fillStyle = dir > 0 ? '#9ac8e8' : '#a8d0e8'; c.fillRect(cx0 + 1, cy0 + 1, CW - 2, CH - 2);
            c.setTransform(Z, 0, 0, Z, cx0 + m.ox, cy0 + m.oy);
            // a grid in hitbox fractions: x every quarter of w from the centre, y every quarter of h up from the feet
            c.lineWidth = 0.25; c.strokeStyle = 'rgba(0,0,40,0.22)'; c.beginPath();
            for (let q = -6; q <= 6; q++) { c.moveTo(e.cx + q * e.w / 4, e.y + e.h); c.lineTo(e.cx + q * e.w / 4, e.y + e.h - 2.5 * e.h); }
            for (let q = 0; q <= 10; q++) { c.moveTo(e.cx - e.w * 1.5, e.y + e.h - q * e.h / 4); c.lineTo(e.cx + e.w * 1.5, e.y + e.h - q * e.h / 4); }
            c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.strokeRect(e.x, e.y, e.w, e.h);
            try { e.draw(c, g.t); } catch (err) { /* noted */ }
            e._hatInfo = undefined; const I = H.info(e);
            if (I) H.draw(c, e, { t: 0 });
            c.restore();
            // the y labels (every half h) and the guess
            c.fillStyle = '#00205a'; c.font = '10px sans-serif';
            for (let q = 1; q <= 5; q++) { const y = cy0 + m.oy + (e.y + e.h - q * e.h / 2) * Z; if (y > cy0 + 16 && y < cy0 + CH) c.fillText('-' + (q / 2), cx0 + 3, y + 3); }
            c.fillStyle = '#10101a'; c.font = 'bold 12px sans-serif'; c.fillText(k + (I ? ' · ' + I.kind : ' · NO HAT') + (had ? '' : ' (guess)') + (dir > 0 ? '  >' : '  <') + '  ' + e.w + 'x' + e.h, cx0 + 4, cy0 + 13);
            c.font = '11px sans-serif'; c.fillText(m.how + ' fx ' + m.fx + ' fy ' + m.fy + (had ? '   row ' + had.join(', ') : ''), cx0 + 4, cy0 + CH - 6);
          }
          if (!had) delete H.HEADS[k];
          out[k] = { R: { fx: res.R.fx, fy: res.R.fy, how: res.R.how }, L: { fx: res.L.fx, fy: res.L.fy } };
        });
        return { url: cv.toDataURL('image/png'), out };
      }, p0);
      fs.writeFileSync(path.join(out, 'sheet-' + String(L.w).padStart(2, '0') + '-' + L.cc + '-' + (p0 / 6 + 1) + '.png'), Buffer.from(r.url.split(',')[1], 'base64'));
      Object.assign(guesses, r.out);
    }
  }
  fs.writeFileSync(path.join(out, 'heads.json'), JSON.stringify(guesses, null, 1));
  console.log('sheets and heads.json in ' + out);
};

const scenes = async (page, shot, run, tag) => {
  await run('settings', async () => {
    const r = await page.evaluate(() => {
      const B = window.BRADY, T = window.BRADY_TOUR; fresh();
      const labels = () => { const s = new B.SettingsScene(null); return s.btns.map(b => b.label); };
      const none = labels().filter(l => /HATS|DANCING/.test(l));
      rules([7]); const hatsOnly = labels().filter(l => /HATS|DANCING/.test(l));
      rules([3]); const both = labels().filter(l => /HATS|DANCING/.test(l));
      // an old save that had the combined HATS & DANCING switch off: both start OFF
      B.Save.data.settings.ruleFx = false; const old = labels().filter(l => /HATS|DANCING/.test(l)), oldFx = [T.TourRules.fxOn('hats'), T.TourRules.fxOn('dance')];
      delete B.Save.data.settings.ruleFx;
      const s = new B.SettingsScene(null); B.Game.setScene(s);
      return { none, hatsOnly, both, old, oldFx };
    });
    check(tag + ' settings: no switch before a rule is revoked', r.none.length === 0, r);
    check(tag + ' settings: ANIMAL HATS appears with rule 7, DANCING with rule 3', r.hatsOnly.length === 1 && /ANIMAL HATS:\s+ON/.test(r.hatsOnly[0]) && r.both.length === 2 && r.both.some(l => /DANCING:\s+ON/.test(l)), r);
    check(tag + ' settings: an old save with HATS & DANCING off starts with both OFF', r.old.every(l => /OFF/.test(l)) && !r.oldFx[0] && !r.oldFx[1], r);
    await shot('01-settings-page.png');
    // flip ANIMAL HATS off in a level: the hats go at once; DANCING stays on
    const frames = () => page.waitForTimeout(350);
    await page.evaluate(() => { play('1-1'); drop('mxChihuahua', 3); freeze(); hatTypes(); });
    await frames(); const on = await page.evaluate(() => Object.keys(hatTypes()).length);
    const lab = await page.evaluate(() => { const B = window.BRADY; new B.SettingsScene(null).btns.find(x => /ANIMAL HATS/.test(x.label)).fn(); hatTypes(); return new B.SettingsScene(null).btns.find(x => /ANIMAL HATS/.test(x.label)).label; });
    await frames(); const off = await page.evaluate(() => ({ n: Object.keys(hatTypes()).length, dance: window.BRADY_TOUR.TourRules.fxOn('dance'), saved: window.BRADY.Save.data.settings.hatsFx }));
    await page.evaluate(() => { new window.BRADY.SettingsScene(null).btns.find(x => /ANIMAL HATS/.test(x.label)).fn(); hatTypes(); });
    await frames(); const back = await page.evaluate(() => Object.keys(hatTypes()).length);
    const f = { on, off, back, lab };
    check(tag + ' settings: ANIMAL HATS OFF hides every hat at once, DANCING stays on, ON brings them back', on > 0 && off.n === 0 && back > 0 && /OFF/.test(lab) && off.dance && off.saved === false, f);
    await page.evaluate(() => thaw());
  });
  // a scene: level, area, Brady's tile; then something to do; shots and the hat log
  const scene = async (name, setup, file, expect) => {
    await run(name, async () => {
      const r = await page.evaluate(setup);
      await page.evaluate(() => { freeze(); hatTypes(); });
      await page.waitForTimeout(400);
      const drawn = await page.evaluate(() => hatTypes());
      const keys = Object.keys(drawn).map(k => k.split('|')[0]);
      const bad = await page.evaluate(keys => keys.filter(k => !window.BRADY_TOUR.TourHats.HEADS[k]), keys);
      check(tag + ' ' + name + ': hats only on animal types', !bad.length, { bad, drawn });
      if (expect) expect(r, keys);
      await shot(file);
      if (r && r.clip) await shot(file.replace('.png', '-closeup.png'), r.clip);
      await page.evaluate(() => thaw());
    });
  };
  const near = (e, pad) => `(() => { const a = toCss(${e}.x - ${pad}, ${e}.y - ${pad} * 1.4), b = toCss(${e}.x + ${e}.w + ${pad}, ${e}.y + ${e}.h + ${pad} * 0.4); return { x: Math.max(0, a.x), y: Math.max(0, a.y), width: b.x - a.x, height: b.y - a.y }; })()`;
  void near;
  const clipOf = `window.clipOf = (list, pad) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const e of list) { x0 = Math.min(x0, e.x); y0 = Math.min(y0, e.y); x1 = Math.max(x1, e.x + e.w); y1 = Math.max(y1, e.y + e.h); } pad = pad || 40; const a = toCss(x0 - pad, y0 - pad * 1.2), b = toCss(x1 + pad, y1 + pad * 0.5), G = window.BRADY.Game; const x = Math.max(0, a.x), y = Math.max(0, a.y); return { x, y, width: Math.min(G.cssW - x, b.x - a.x), height: Math.min(G.cssH - y, b.y - a.y) }; };`;
  await page.evaluate(clipOf);
  await scene('w22-doors', () => {
    fresh(); rules([3, 7]); play('22-2'); go('corridor', 11, 10);
    const a = drop('w22Moth', 3), b = drop('w22Alarm', 5); sim(0.3);
    const doors = S().entities.filter(e => e.constructor.name === 'W22NumDoorE' && Math.abs(e.cx - P().cx) < 300);
    return { clip: clipOf(doors.concat([a, P()]), 50), doors: doors.length };
  }, '02-w22-doors.png', (r, keys) => check(tag + ' w22-doors: the numbered doors stand there, hatless', r.doors >= 2 && keys.indexOf('w22NumDoorE') < 0 && keys.indexOf('w22Alarm') < 0 && keys.indexOf('w22Moth') >= 0, { r, keys }));
  await scene('hidden-door', () => {
    fresh(); rules([7]); play('1-2'); go('canal', 151, 11);
    const a = drop('mxChihuahua', 2), b = drop('mxXolo', -3), c = drop('mxHeron', 4); sim(0.2);
    const cur = S().entities.find(e => e.constructor.name === 'TourCurtain' && Math.abs(e.cx - P().cx) < 400);
    return { clip: clipOf([a, b, P()].concat(cur ? [cur] : []), 50), curtain: !!cur };
  }, '03-hidden-door-willow.png', (r, keys) => check(tag + ' hidden-door: the willow curtain door has no hat; the dogs and the heron do', r.curtain && keys.indexOf('tourCurtain') < 0 && keys.indexOf('mxChihuahua') >= 0, { r, keys }));
  await scene('joint', () => {
    fresh(); rules([3, 7]); play('1-1'); const p = P(); p.power = 2; p.puffs = 0; p.facing = 1;
    const a = drop('mxBat', 5), b = drop('mxPepper', 6); sim(0.05, { action: true, actionPressed: true }); sim(0.25); sim(0.05, { action: true, actionPressed: true }); sim(0.1);
    const puffs = S().entities.filter(e => e.constructor.name === 'SmokePuff').length;
    return { clip: clipOf([p, a, b], 60), puffs };
  }, '04-joint-smoke.png', (r, keys) => check(tag + ' joint: the smoke puffs fly hatless', r.puffs > 0 && keys.indexOf('?') < 0, { r, keys }));
  await scene('acid', () => {
    fresh(); rules([3, 7]); play('2-1'); const p = P(); p.lsdT = 8; p.facing = 1; S().lsdK = 0.6;
    const a = drop('ecFrog', 6), b = drop('ecAlpaca', 8); sim(0.05, { action: true, actionPressed: true }); sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(0.05);
    const lasers = S().entities.filter(e => e.constructor.name === 'RainbowLaser').length;
    return { clip: clipOf([p, a, b], 60), lasers };
  }, '05-acid-lasers.png', (r, keys) => check(tag + ' acid: the rainbow lasers fly hatless', r.lasers > 0 && keys.indexOf('?') < 0, { r, keys }));
  await scene('chili', () => {
    fresh(); rules([3, 7]); play('4-1'); const p = P(); p.hands = null; p.sig = { id: 'piri', t: 9, n: 0 }; p.facing = 1;
    const a = drop('mzWarthog', 5), b = drop('mzMonkey', 7), c = drop('mzMango', 9); sim(0.05, { action: true, actionPressed: true }); sim(0.12); sim(0.05, { action: true, actionPressed: true }); sim(0.04);
    const flames = S().entities.filter(e => e.constructor.name === 'MzFlame').length;
    return { clip: clipOf([p, a, b, c], 60), flames };
  }, '06-chili-flames.png', (r, keys) => check(tag + ' chili: the piri-piri flames fly hatless, the warthog wears one, the mango doesn\'t', r.flames > 0 && keys.indexOf('mzWarthog') >= 0 && keys.indexOf('mzMango') < 0, { r, keys }));
  await scene('boss', () => {
    fresh(); rules([3, 7]); play('3-5'); const g0 = S();
    // the boss's arena (a v2 boss level: a lead-in, then the arena area)
    const k = g0.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss'));
    if (k >= 0 && g0.area !== g0.level.areas[k]) { const A = g0.level.areas[k], an = (A.anchors && (A.anchors.in || A.anchors.start)) || { x: 3 * 32 + 16, y: (A.H - 4) * 32 }; g0.loadArea(k, an.x, an.y, 1); }
    const g = S(), boss = g.entities.find(e => e.boss && !e.remove), p = P(); p.invuln = 999;
    if (boss) { p.x = boss.arenaX0 != null ? boss.arenaX0 + 64 : p.x; if (boss.floorY) p.y = boss.floorY - p.h - 4; p.vy = 0; }
    sim(2.6); P().invuln = 999;
    const a = drop('brCoati', 7), c = drop('brCrab', 9); a.vx = c.vx = 0; sim(0.05);
    return { boss: !!boss, name: boss && boss.constructor.name, bw: boss && boss.w, clip: clipOf([P(), a, c].concat(boss ? [boss] : []), 40) };
  }, '07-boss.png', (r, keys) => check(tag + ' boss: the boss wears no hat; the critters by it do', r.boss && keys.indexOf('brCoati') >= 0 && !keys.some(k => /boss/i.test(k)), { r, keys }));
  await scene('room-doors', () => {
    fresh(); rules([3, 7]); play('1-1'); const g = S();
    // a secret room: the first area with role secret and a door back
    const k = g.level.areas.findIndex((A, i) => i > 0); const A = g.level.areas[k]; const an = (A.anchors && (A.anchors.in || A.anchors.start)) || { x: 5 * 32 + 16, y: (A.H - 4) * 32 };
    g.loadArea(k, an.x, an.y); sim(0.6); P().invuln = 999;
    const a = drop('mxAxolotlWalk', 2), b = drop('mxArmadillo', -2); sim(0.1);
    const doors = g.entities.filter(e => /Door|Portal|Warp|Gate/.test(e.constructor.name)).length;
    return { aid: A.aid, doors, clip: clipOf([P(), a, b], 70) };
  }, '08-secret-room-doors.png', (r, keys) => check(tag + ' room-doors: the room\'s doors have no hats', keys.every(k => !/door|portal|warp|gate/i.test(k)), { r, keys }));
  // close-ups: a mixed crowd of a land's animals on the floor by Brady, at phone size
  const crowd = async (name, id, list, file) => scene(name, new Function(`fresh(); rules([7]); play('${id}'); const p = P(); const L = ${JSON.stringify(list)}.map((k, i) => drop(k, 2 + i * 1.6)); sim(0.4); return { clip: clipOf(L.concat([p]), 36) };`), file);
  await crowd('crowd-mx', '1-1', ['mxChihuahua', 'mxXolo', 'mxAxolotlWalk', 'mxArmadillo', 'mxHeron'], '10-crowd-mexico.png');
  await crowd('crowd-fr', '7-1', ['frPoodle', 'frCat', 'frCoq', 'frBoar', 'frPigeon', 'frSnail'], '11-crowd-france.png');
  await crowd('crowd-np', '12-1', ['npYeti', 'npMarmot', 'npMonal', 'npChough'], '12-crowd-nepal.png');
  await crowd('crowd-es', '6-1', ['esSheep', 'esLynx', 'esLizard', 'esStork', 'esGamba'], '13-crowd-spain.png');
  await crowd('crowd-br', '3-1', ['brJaguar', 'brCoati', 'brCrab', 'brParrot', 'brToucanito'], '14-crowd-brazil.png');
  await crowd('crowd-jp', '11-1', ['jpTanuki', 'jpShiba', 'jpBeetle', 'jpCrow', 'jpHeron'], '15-crowd-japan.png');
  await crowd('crowd-ma', '5-1', ['maGoat', 'maFennec', 'maCat', 'maCobra', 'maStork'], '16-crowd-morocco.png');
  await crowd('crowd-aq', '13-1', ['aqPenguin', 'aqSeal', 'aqSkidder', 'aqSkua'], '17-crowd-antarctica.png');
  await run('map', async () => {
    await page.evaluate(() => {
      fresh(); rules([1, 3, 7, 9, 10, 12]); const T = window.BRADY_TOUR, B = window.BRADY, P0 = T.TourProgress.data();
      (P0.seen = P0.seen || {}).mx = true; (P0.cards = P0.cards || {}).mx = true; B.Save.data.unlocked['1-2'] = true;
      const m = new T.TourMapScene({ from: '1-1' }); B.Game.setScene(m); sim(2);
    });
    await shot('09-overworld-map.png');
    // close in on the walking dog (Mexico's map: ['walk', 'dog', ...] near 500, 860) and the stops' critters
    await page.evaluate(() => { const B = window.BRADY, G = B.Game, ow = S().ow; if (!ow) return; const W = G.cssW, H = G.cssH; ow.fixed = { view: { x: 0, y: 0, w: W, h: H }, z: 3.2, cam: { x: 520, y: 840 } }; ow.layoutView(); ow.clampCam(); sim(0.3); });
    await shot('09-overworld-map-zoom.png');
  });
};

(async () => {
  if (sheetOnly) {
    await session({ width: 874, height: 402 }, 'sheet', async (page) => { await sheet(page); });
  } else {
    const L = !args.includes('--portrait'), Pt = !args.includes('--landscape');
    if (L) await session({ width: 874, height: 402 }, 'landscape', (page, shot, run) => scenes(page, shot, run, 'landscape'));
    if (Pt) await session({ width: 402, height: 874 }, 'portrait', (page, shot, run) => scenes(page, shot, run, 'portrait'));
  }
  console.log(failures ? `\n${failures} hats check(s) FAILED` : '\nall hats checks passed');
  process.exit(failures ? 1 : 0);
})();
