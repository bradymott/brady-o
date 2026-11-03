/* ============================================================
   BRADY GOES TO BURNING MAN — World 17 kit: ROOT SOCIETY, Brady's home
   Shared helpers for the home world (everything prefixed BW17 / bw17):
     · the home clock: sleeping in the tipi moves it (morning, noon, golden hour,
       dusk, night, pre-dawn, sunrise). It drives our own sky palettes, scales the
       baked light pools and glow billboards (lanterns glow at night, not at noon)
       and swaps the music;
     · the 2D overlay (clock chip, minigame panels, choice picker, the playa ID card,
       the ice melt meter) drawn on top of the engine HUD;
     · small minigames run as cutscenes (mash, timing bar, sit still, choices);
     · story-day helpers (the home world is revisited all week);
     · backpack items and the world's music tracks.
   The cast (Jefr's crew, the friends, the Man's Men) lives in 42_burns_w17_b_cast.js.
   ============================================================ */

const BW17 = {
  ID: 17,
  state: null,
  debugWin: false,          // tests: minigames succeed at once
  // sky keyframes [hour, palette]; the palettes are registered below as BURNS_PALETTES.bw17*
  SKY: [[0, 'bw17night'], [4.4, 'bw17night'], [5.2, 'bw17predawn'], [5.95, 'bw17dawn'], [7.4, 'bw17morning'], [10, 'bw17day'],
    [16.6, 'bw17day'], [17.8, 'bw17gold'], [19.1, 'bw17dusk'], [20.4, 'bw17night'], [24, 'bw17night']],
  DAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

/* ---------------- music: warm, deep, tribal-melodic house (day) + a darker night groove ---------------- */
(() => {
  if (typeof Sound === 'undefined' || !Sound.addTrack) return;
  const dots = n => '.'.repeat(n), rp = (s, n) => s.repeat(n);
  // D minor, 120 BPM: breathy vox lead over pluck arps, rolling sub, hand drums and shakers
  Sound.addTrack('burns_w17', {
    bpm: 120, bars: 16, rv: 0.34, dl: 0.2, pump: 0.32, sw: 0.06,
    ch: 'Dm7 Dm7 Bbmaj7 Bbmaj7 Gm7 Gm7 A7sus4 A7 Dm7 Dm7 Bbmaj7 C Gm7 Bbmaj7 A7sus4 A7',
    ld: 'D5:6 F5:2 A5:4 G5:4 | F5:6 E5:2 D5:8 | D5:4 F5:4 Bb5:6 A5:2 | A5:12 .:4 |' +
        'G5:6 A5:2 Bb5:4 D6:4 | C6:6 Bb5:2 G5:8 | E5:4 G5:4 A5:4 C#6:4 | D6:8 .:8 |' +
        'A5:2 .:2 D6:2 .:2 F6:4 E6:4 | D6:6 C6:2 A5:8 | Bb5:2 .:2 D6:2 .:2 F6:4 E6:2 D6:2 | C6:12 .:4 |' +
        'Bb5:4 D6:4 G6:4 F6:4 | D6:8 Bb5:8 | A5:4 C#6:4 E6:4 G6:4 | F6:6 E6:2 D6:8',
    li: 'vox', lv: 0.11, hx: 0.035,
    l2: rp('.:16 | ', 8) + 'A4:2 .:6 D5:2 .:6 | ' + rp('.:16 | ', 3) + 'F5:2 .:6 A5:2 .:6 | ' + rp('.:16 | ', 2) + '.:16',
    l2i: 'mbox', l2v: 0.06,
    bp: 'r..r..r.r..o..f.', bi: 'sub', bv: 0.32,
    ap: '0.2.1.3.0.2.1.4.', ai: 'pluck', av: 0.03, ao: 60,
    a2: dots(64) + rp('..c...c...c.c...', 12), a2i: 'mbox', a2v: 0.022, a2o: 64,
    pd: 'c---------------', pi: 'pad', pv: 0.034, po: 52,
    dr: ['k...k...k...k...', '....c.......c...', '..o...o...o...o.', 'n.nnn.nnn.nnn.nn', '..b..d.b..b.d.b.', dots(240) + 't.t.m.m.b.b.bbbb', 'x' + dots(255)], dv: 0.42
  });
  // night: same family, deeper and more driving (the domes are open)
  Sound.addTrack('burns_w17n', {
    bpm: 122, bars: 16, rv: 0.3, dl: 0.22, pump: 0.42,
    ch: 'Dm Dm Bb C Dm Dm Gm A Dm Dm Bb C Gm Bb A A',
    ld: 'A5:3 .:1 A5:2 F5:2 D5:4 .:4 | C6:3 .:1 A5:2 G5:2 F5:8 | Bb5:3 .:1 Bb5:2 A5:2 F5:4 D5:4 | E5:4 G5:4 C6:8 |' +
        'A5:3 .:1 A5:2 F5:2 D6:4 C6:4 | A5:8 .:8 | Bb5:4 D6:4 G5:4 Bb5:4 | C#6:8 E6:8 |' +
        'F6:3 .:1 F6:2 E6:2 D6:4 A5:4 | C6:3 .:1 C6:2 Bb5:2 A5:8 | Bb5:3 .:1 Bb5:2 A5:2 G5:4 F5:4 | E5:4 G5:4 C6:8 |' +
        'Bb5:4 D6:4 G6:4 D6:4 | F6:6 E6:2 D6:8 | C#6:4 E6:4 A6:4 E6:4 | C#6:8 .:8',
    li: 'saw2', lv: 0.1, hx: 0.04,
    bp: '..r-..r-..r-..o-', bi: 'sub', bv: 0.32,
    ap: '0.1.2.3.0.1.2.3.', ai: 'pluck', av: 0.032, ao: 60,
    pd: 'c---------------', pi: 'pad', pv: 0.03, po: 52,
    dr: ['k...k...k...k...', '....c.......c...', '..o...o...o...o.', 'hh.hhh.hhh.hhh.h', '...b..d...b..dd.', dots(240) + 's.s.s.s.ssssSSSS', 'x' + dots(127)], dv: 0.44
  });
  if (typeof BURNS_MUSIC_FALLBACK !== 'undefined') { BURNS_MUSIC_FALLBACK.burns_w17 = BURNS_MUSIC_FALLBACK.burns_w17 || 'burns_hub'; BURNS_MUSIC_FALLBACK.burns_w17n = BURNS_MUSIC_FALLBACK.burns_w17n || 'burns_w11'; }
})();

/* ---------------- sky palettes for the home clock ---------------- */
(() => {
  if (typeof BURNS_PALETTES === 'undefined') return;
  const P = BURNS_PALETTES, A = (base, o) => Object.assign({}, P[base] || P.day, o);
  P.bw17day = A('day', { hor: '#f6dcb6', fog: '#ecd4b2', fogD: 0.0042, haze: 0.42, dust: 0.3, mid: '#86b8ea', sun: [150, 52], clouds: 0.42, cloudCol: '#fff6ec' });
  P.bw17morning = A('day', { zen: '#4a82d4', hor: '#ffe2bc', mid: '#a8c8ec', midK: 0.3, fog: '#f0d8bc', fogD: 0.0046, haze: 0.45, dust: 0.32, sun: [40, 16], sunCol: '#fff0d0', key: '#ffe6c4', keyK: 0.88, sky: '#c4d0ec', gnd: '#c8a68a', clouds: 0.38, rays: 0.8 });
  P.bw17gold = A('dusk', { zen: '#3f62b4', hor: '#ffbf7c', mid: '#f2a888', midK: 0.32, fog: '#e8b892', fogD: 0.006, haze: 0.45, dust: 0.35, sun: [236, 9], sunCol: '#ffc27c', key: '#ffcc92', keyK: 0.98, sky: '#b6aed2', gnd: '#aa8466', emB: 1.22, stars: 0, moonK: 0, clouds: 0.46, cloudCol: '#ffd6ae', rays: 1.35, cityK: 0.12 });
  P.bw17dusk = A('dusk', { sun: [246, -0.5], hor: '#ff9a6a', zen: '#2c2254', mid: '#b2607e', midK: 0.38, stars: 0.3, moonK: 0.5, emB: 1.4, rays: 1.2 });
  P.bw17night = A('night', { sky: '#46467e', gnd: '#30263a', keyK: 0.46, fogD: 0.0085, dust: 0.25, stars: 1, moonK: 1, emB: 1.75, cityK: 0.62, milkyway: 1.2 });
  P.bw17predawn = A('night', { zen: '#0e1236', hor: '#5a3a62', mid: '#2a2250', midK: 0.3, fog: '#3a2e44', sun: [18, -7], sky: '#5a5a90', gnd: '#3c3048', stars: 0.75, moonK: 0.7, keyK: 0.45, cityK: 0.4 });
  P.bw17dawn = A('dawn', { zen: '#33478a', hor: '#ffb48c', mid: '#c780a2', midK: 0.38, fog: '#e8b4a6', sun: [18, 2.2], sunCol: '#ffc48a', key: '#ffc4a0', keyK: 0.82, stars: 0.08, rays: 1.7, belt: 1.25, emB: 1.35 });
})();

/* ---------------- story day (the home world is visited all week long) ---------------- */
// the furthest world the player has unlocked, as an index into the play order
BW17.reach = function () {
  const sv = BurnsSave.get(), O = BurnsWorlds.order || BURNS_WORLD_ORDER;
  let best = O.indexOf(17);
  for (let i = 0; i < O.length; i++) if (sv.unlocked[O[i]] && O[i] !== 15 && i > best) best = i;
  if (sv.unlocked[15] && sv.worldDone[10]) best = Math.max(best, O.indexOf(15));
  return best;
};
// has the story reached world `id` (e.g. 8 = Friday)?
BW17.storyAt = function (id) { const O = BurnsWorlds.order || BURNS_WORLD_ORDER, i = O.indexOf(id); return i >= 0 && BW17.reach() >= i; };
BW17.dayName = function () {
  const O = BurnsWorlds.order || BURNS_WORLD_ORDER, id = O[BW17.reach()] || 17;
  const d = String((BurnsWorlds.day && BurnsWorlds.day(id)) || 'Tuesday').split(/[ ,]/)[0];
  return BW17.DAYS.indexOf(d) >= 0 ? d : 'Tuesday';
};

/* ---------------- timers (game time, paused with the game) ---------------- */
BW17.after = function (g, sec, fn) { const S = BW17.state; if (!S) return; S.timers.push({ t: sec, fn }); };
BW17.stepTimers = function (g, dt) {
  const S = BW17.state; if (!S || !S.timers.length) return;
  for (const T of S.timers) { T.t -= dt; if (T.t <= 0 && !T.done) { T.done = true; try { T.fn(g); } catch (e) { BW17.err(e); } } }
  S.timers = S.timers.filter(T => !T.done);
};
BW17.err = function (e) { try { console.error(e); if (typeof Game !== 'undefined' && Game.reportError) Game.reportError(e); } catch (e2) { /* ignore */ } };

/* ---------------- the home clock ---------------- */
BW17.hourText = function (h) {
  h = ((h % 24) + 24) % 24; const H = Math.floor(h), M = Math.floor((h - H) * 60 / 5) * 5;
  return `${(H % 12) || 12}:${M < 10 ? '0' : ''}${M} ${H < 12 ? 'AM' : 'PM'}`;
};
BW17.phase = function (h) {
  h = h === undefined ? BW17.state.clock : h; h = ((h % 24) + 24) % 24;
  if (h >= 20.4 || h < 4.4) return 'night';
  if (h < 5.95) return 'predawn';
  if (h < 7.4) return 'dawn';
  if (h < 16.6) return 'day';
  if (h < 19.1) return 'gold';
  return 'dusk';
};
BW17.isNight = function (h) { const p = BW17.phase(h); return p === 'night' || p === 'predawn' || p === 'dusk'; };
// set the palettes + tod from the clock (cheap: a short keyframe search)
BW17.applySky = function (g) {
  const S = BW17.state, K = BW17.SKY, h = ((S.clock % 24) + 24) % 24;
  let i = 0; while (i < K.length - 2 && h >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], t = clamp((h - a[0]) / Math.max(0.001, b[0] - a[0]), 0, 1);
  g.palA = a[1]; g.palB = b[1]; g.tod = t; g.todTarget = null;
  // night factor from the blended sun elevation (same rule as the camps + big art modules)
  const A = BURNS_PALETTES[a[1]], B = BURNS_PALETTES[b[1]], el = lerp(A.sun[1], B.sun[1], t);
  S.nightK = clamp((8 - el) / 14, 0, 1);
};
// move the clock: instantly, or tween at `rate` hours per second
BW17.setClock = function (g, h, rate) {
  const S = BW17.state; if (!S) return;
  h = ((h % 24) + 24) % 24;
  if (rate) { let d = h - S.clock; if (d < 0) d += 24; S.clockTo = S.clock + d; S.clockRate = rate; }
  else { S.clock = h; S.clockTo = null; BW17.applySky(g); BW17.applyLights(g, true); BW17.applyMusic(g); BW17.applyPresence(g); }
  BurnsSave.flag(17, 'clock', Math.round(h * 100) / 100);
};
BW17.stepClock = function (g, dt) {
  const S = BW17.state;
  if (S.clockTo !== null && S.clockTo !== undefined) {
    S.clock = Math.min(S.clockTo, S.clock + dt * S.clockRate);
    if (S.clock >= S.clockTo - 1e-6) { S.clock = ((S.clockTo % 24) + 24) % 24; S.clockTo = null; BW17.applyMusic(g); }
    if (S.clock >= 24) S.clock -= 24;
    BW17.applySky(g);
    S.presT = (S.presT || 0) - dt; if (S.presT <= 0) { S.presT = 0.5; BW17.applyPresence(g); BW17.applyLights(g); }
  }
};

/* ---------------- night lighting: baked pools + glow billboards follow the clock ---------------- */
BW17.lightInit = function (g) {
  const S = BW17.state, W = g.world;
  try {
    if (W.lightC && W.lightmap && typeof makeCanvas === 'function') {
      S.lmBak = makeCanvas(W.lightC.width, W.lightC.height);
      S.lmBak.getContext('2d').drawImage(W.lightC, 0, 0);
    }
  } catch (e) { S.lmBak = null; }
  // static glow billboards (skip the big-art module's animated ones, which carry s0)
  S.glows = [];
  for (const G of W.glows) { if (G.s0 !== undefined || G.bw17keep) continue; if (!G.bw17c0) G.bw17c0 = G.c.slice(); S.glows.push(G); }
  S.lmK = -1; S.glK = -1;
};
BW17.applyLights = function (g, force) {
  const S = BW17.state, W = g.world; if (!S || !W) return;
  const k = Math.round((S.nightK || 0) * 10) / 10;
  if (S.lmBak && (force || k !== S.lmK)) {
    S.lmK = k;
    try {
      const x = W.lightX || W.lightC.getContext('2d');
      x.save(); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, W.lightC.width, W.lightC.height);
      x.globalAlpha = lerp(0.1, 1, k); x.drawImage(S.lmBak, 0, 0); x.restore();
      if (W.lightmap && W.lightmap.T) W.lightmap.T.dirty = true;
    } catch (e) { S.lmBak = null; }
  }
  if (force || k !== S.glK) {
    S.glK = k; const gk = lerp(0.28, 1, k);
    for (const G of S.glows) { const c = G.bw17c0; G.c[0] = c[0] * gk; G.c[1] = c[1] * gk; G.c[2] = c[2] * gk; }
  }
};


/* ---------------- actors that only appear at some hours ---------------- */
// def.bw17when: 'night' | 'day' | fn(g) ; def.bw17hide: fn(g) -> true hides
BW17.applyPresence = function (g) {
  const S = BW17.state; if (!S) return;
  for (const a of g.actors) {
    const d = a.def; if (!d.bw17when && !d.bw17hide) continue;
    let show = true;
    if (d.bw17when === 'night') show = BW17.isNight(); else if (d.bw17when === 'day') show = !BW17.isNight(); else if (typeof d.bw17when === 'function') show = !!d.bw17when(g, a);
    if (d.bw17hide && d.bw17hide(g, a)) show = false;
    if (a.hidden === show) a.hidden = !show;
  }
};

/* ---------------- 2D overlay (drawn after the engine HUD) ---------------- */
(() => {
  if (typeof BurnsUI === 'undefined' || !BurnsUI.drawOverlay) return;
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    prev.call(this, ctx, g, fdt);
    if (!g || g.worldId !== 17 || !BW17.state || BW17.state.g !== g || g.state !== 'play' || g.paused) return;
    try { BW17.overlay(ctx, g, fdt || 1 / 60); } catch (e) { BW17.err(e); }
  };
})();
BW17.overlay = function (ctx, g, fdt) {
  const S = BW17.state, W = Game.cssW, H = Game.cssH, sf = BurnsUI.safe();
  // the clock chip, beside the glow-stick counter
  if (!g.cine && !window.__burnsHideHUD) {
    const ds = Math.min(24, W / 26), x = sf.l + 6 + 92, y = sf.t + 8 + ds * 1.4;
    const ph = BW17.phase(), icon = ph === 'night' || ph === 'predawn' ? '☾' : ph === 'dusk' || ph === 'gold' ? '◐' : '☀';
    const txt = `${BW17.dayName().slice(0, 3).toUpperCase()} ${BW17.hourText(S.clock)}`;
    BurnsUI.pill(ctx, x, y, 112, 24, 'rgba(10,6,24,0.55)', S.clockTo !== null && S.clockTo !== undefined ? 'rgba(255,207,138,0.8)' : null);
    BurnsUI.text(ctx, icon, x + 13, y + 12.5, 13, ph === 'night' || ph === 'predawn' ? '#c8d0ff' : '#ffd27a', { stroke: false });
    BurnsUI.text(ctx, txt, x + 62, y + 12.5, 11, '#fff2dc', { ui: true, stroke: false });
  }
  if (S.meter && !g.cine) BW17.drawMeter(ctx, g, S.meter, sf);
  if (S.mg) BW17.drawMinigame(ctx, g, S.mg);
  if (S.choice) BW17.drawChoice(ctx, g, S.choice);
  if (S.card) BW17.drawCard(ctx, g, S.card, fdt);
};
// a small labelled bar under the tracker: {label, k (0..1), col}
BW17.drawMeter = function (ctx, g, M, sf) {
  const W = Game.cssW, w = Math.min(220, W * 0.5), x = (W - w) / 2, y = sf.t + 40;
  BurnsUI.pill(ctx, x, y, w, 22, 'rgba(10,6,24,0.6)', 'rgba(255,255,255,0.3)');
  const k = clamp(M.k, 0, 1); ctx.save(); ctx.fillStyle = M.col || '#9adcff'; burnsRR(ctx, x + 3, y + 3, (w - 6) * k, 16, 8); ctx.fill(); ctx.restore();
  BurnsUI.text(ctx, M.label, W / 2, y + 11.5, 11, '#ffffff', { ui: true });
};

/* ---------------- minigames (run as cutscenes: Brady is locked, taps / ACTION count) ---------------- */
// cfg: { kind: 'mash' | 'timing' | 'still', title, sub, need (mash presses / timing hits), time (s), rounds, zone [a,b], speed,
//        labels: [per-round text], done(g, ok, score) }
BW17.minigame = function (g, cfg) {
  const S = BW17.state;
  const st = { cfg, t: 0, n: 0, prev: true, cursor: 0, dir: 1, round: 0, hits: 0, flash: 0, result: null, msg: '', still: 0 };
  g.cutscene([
    { do: () => { S.mg = st; } },
    { until: g2 => BW17.mgStep(g2, st, 1 / 120) },
    { do: g2 => { S.mg = null; const ok = st.result === true; BW17.after(g2, 0.05, g3 => { if (cfg.done) cfg.done(g3, ok, st.hits || st.n); }); } }
  ], null, { letterbox: false });
  return st;
};
BW17.pressed = function (st) {
  const pr = !!(Input.taps.length || Input.actionPressed || Input.jumpPressed || Input.uiKey === 'enter');
  const edge = pr && !st.prev; st.prev = pr; return edge;
};
BW17.mgStep = function (g, st, dt) {
  const c = st.cfg; st.t += dt; st.flash = Math.max(0, st.flash - dt);
  if (BW17.debugWin) { st.result = true; st.hits = c.rounds || c.need || 1; st.n = c.need || 1; return true; }
  const press = BW17.pressed(st);
  if (st.done) { st.doneT -= dt; return st.doneT <= 0; }
  const finish = (ok, msg) => { st.result = ok; st.msg = msg; st.done = true; st.doneT = 0.9; burnsSfx(ok ? 'clear' : 'bump', { vol: 0.6 }); };
  if (st.t < 0.35) return false;
  if (c.kind === 'mash') {
    if (press) { st.n++; st.flash = 0.12; burnsSfx('select', { vol: 0.35, pitch: 0.8 + st.n / (c.need || 10) * 0.6 }); if (c.onPress) c.onPress(g, st); }
    if (st.n >= (c.need || 10)) finish(true, c.win || 'NICE!');
    else if (st.t > (c.time || 5) + 0.35) finish(false, c.lose || 'TOO SLOW!');
  } else if (c.kind === 'timing') {
    const sp = (c.speed || 1.1) * (1 + st.round * 0.18);
    st.cursor += st.dir * sp * dt; if (st.cursor > 1) { st.cursor = 2 - st.cursor; st.dir = -1; } if (st.cursor < 0) { st.cursor = -st.cursor; st.dir = 1; }
    if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) { st.round++; if (st.round >= (c.rounds || 3)) finish(st.hits >= (c.need || c.rounds || 3), st.hits >= (c.need || c.rounds || 3) ? (c.win || 'PERFECT!') : (c.lose || 'SO CLOSE!')); } return false; }
    if (press) {
      const z = c.zone || [0.42, 0.58], hit = st.cursor >= z[0] && st.cursor <= z[1];
      if (hit) { st.hits++; st.flash = 0.35; burnsSfx('pick', { vol: 0.6 }); } else burnsSfx('bump', { vol: 0.4 });
      st.lastHit = hit; st.wait = 0.55; if (c.onPress) c.onPress(g, st, hit);
    }
  } else if (c.kind === 'still') {
    if (press) { st.still = 0; st.fails = (st.fails || 0) + 1; st.flash = 0.4; burnsSfx('bump', { vol: 0.35 }); if (c.onFidget) c.onFidget(g, st); }
    else st.still += dt;
    if (st.still >= (c.time || 8)) finish(true, c.win || 'ZEN.');
    if ((st.fails || 0) >= (c.maxFails || 99)) finish(false, c.lose || 'TOO FIDGETY.');
  }
  return false;
};
BW17.drawMinigame = function (ctx, g, st) {
  const c = st.cfg, W = Game.cssW, H = Game.cssH, port = H > W;
  const pw = Math.min(W - 40, 430), ph = 128, px = (W - pw) / 2, py = port ? H * 0.58 : H - ph - Math.max(18, BurnsUI.safe().b + 8);
  ctx.save(); ctx.globalAlpha = clamp(st.t / 0.2, 0, 1);
  ctx.fillStyle = 'rgba(14,8,28,0.88)'; burnsRR(ctx, px, py, pw, ph, 16); ctx.fill();
  ctx.strokeStyle = st.flash > 0 ? '#ffd84a' : 'rgba(255,154,216,0.75)'; ctx.lineWidth = 2; ctx.stroke();
  BurnsUI.text(ctx, c.title || '', W / 2, py + 22, 15, '#ffd84a');
  const labels = c.labels, sub = st.done ? st.msg : (labels && labels[Math.min(st.round, labels.length - 1)]) || c.sub || '';
  BurnsUI.text(ctx, sub, W / 2, py + 44, 11, st.done ? (st.result ? '#7aff5a' : '#ff8a8a') : '#ffffff', { ui: true, stroke: false });
  const bx = px + 22, bw = pw - 44, by = py + 62;
  if (c.kind === 'mash') {
    const k = clamp(st.n / (c.need || 10), 0, 1), tl = clamp(1 - (st.t - 0.35) / (c.time || 5), 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; burnsRR(ctx, bx, by, bw, 20, 10); ctx.fill();
    ctx.fillStyle = c.col || '#ff9ad8'; burnsRR(ctx, bx, by, Math.max(20, bw * k), 20, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(bx, by + 28, bw * tl, 4);
    BurnsUI.text(ctx, st.done ? '' : 'TAP / ACTION AS FAST AS YOU CAN!', W / 2, by + 46, 11, '#ffe0f4', { ui: true, stroke: false });
  } else if (c.kind === 'timing') {
    const z = c.zone || [0.42, 0.58];
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; burnsRR(ctx, bx, by, bw, 22, 11); ctx.fill();
    ctx.fillStyle = 'rgba(122,255,90,0.55)'; burnsRR(ctx, bx + bw * z[0], by, bw * (z[1] - z[0]), 22, 6); ctx.fill();
    const cx = bx + bw * st.cursor; ctx.fillStyle = st.wait > 0 ? (st.lastHit ? '#7aff5a' : '#ff6a6a') : '#ffffff'; burnsRR(ctx, cx - 4, by - 6, 8, 34, 4); ctx.fill();
    for (let i = 0; i < (c.rounds || 3); i++) { ctx.fillStyle = i < st.hits ? '#ffd84a' : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(W / 2 + (i - ((c.rounds || 3) - 1) / 2) * 18, by + 42, 5, 0, TAU); ctx.fill(); }
    BurnsUI.text(ctx, st.done ? '' : 'TAP / ACTION IN THE GREEN!', W / 2, by + 56, 10, '#e0ffe0', { ui: true, stroke: false });
  } else if (c.kind === 'still') {
    const k = clamp(st.still / (c.time || 8), 0, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(W / 2, by + 16, 18, 0, TAU); ctx.stroke();
    ctx.strokeStyle = st.flash > 0 ? '#ff8a8a' : '#9adcff'; ctx.beginPath(); ctx.arc(W / 2, by + 16, 18, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    BurnsUI.text(ctx, st.done ? '' : 'DON\'T TOUCH ANYTHING. BREATHE.', W / 2, by + 50, 11, '#dff4ff', { ui: true, stroke: false });
  }
  ctx.restore();
};

/* ---------------- choice picker (cutscene based: tap an option) ---------------- */
// o: { who, prompt, options: [text], def (index used on SKIP), done(g, i) }
BW17.choose = function (g, o) {
  const S = BW17.state, st = { o, picked: null, focus: 0, t: 0, btns: [], prev: true };
  g.cutscene([
    { do: () => { S.choice = st; } },
    { until: g2 => { st.t += 1 / 120; return BW17.choiceStep(g2, st); } },
    { do: g2 => { S.choice = null; const i = st.picked === null ? (o.def || 0) : st.picked; BW17.after(g2, 0.02, g3 => { if (o.done) o.done(g3, i); }); } }
  ], null, { letterbox: false });
  return st;
};
BW17.choiceStep = function (g, st) {
  if (st.forced !== undefined) { st.picked = st.forced; return true; }
  if (st.t < 0.3) { st.prev = true; return false; }
  const n = st.o.options.length;
  for (const t of Input.taps) for (const b of st.btns) if (t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h) { st.picked = b.i; burnsSfx('select'); return true; }
  const k = Input.uiKey;
  if (k === 'up' || k === 'left') { st.focus = (st.focus + n - 1) % n; burnsSfx('select', { vol: 0.4 }); }
  if (k === 'down' || k === 'right') { st.focus = (st.focus + 1) % n; burnsSfx('select', { vol: 0.4 }); }
  const pr = !!(Input.actionPressed || Input.jumpPressed || k === 'enter'), edge = pr && !st.prev; st.prev = pr;
  if (edge) { st.picked = st.focus; burnsSfx('select'); return true; }
  return false;
};
BW17.drawChoice = function (ctx, g, st) {
  const W = Game.cssW, H = Game.cssH, sf = BurnsUI.safe(), o = st.o, n = o.options.length, port = H > W;
  ctx.save(); ctx.globalAlpha = clamp(st.t / 0.2, 0, 1);
  const pw = Math.min(W - sf.l - sf.r - 8, port ? 520 : 760), px = (W - pw) / 2;
  ctx.font = `600 ${port ? 13 : 14}px ${FONT_UI}`;
  const lines = BurnsUI.wrap(ctx, o.prompt || '', pw - 36);
  const cols = port ? 1 : Math.min(n, n > 3 ? 2 : n), rows = Math.ceil(n / cols);
  const optW = (pw - 24 - 8 * (cols - 1)) / cols, optH = port ? 42 : 46;
  const ph = 26 + lines.length * 18 + 12 + rows * (optH + 8) + 6 + (o.who ? 16 : 0), py = Math.max(sf.t + 8, H - sf.b - ph - H * 0.06);
  ctx.fillStyle = 'rgba(14,6,28,0.92)'; burnsRR(ctx, px, py, pw, ph, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,207,138,0.8)'; ctx.lineWidth = 2; ctx.stroke();
  let y = py + 20;
  if (o.who) { BurnsUI.text(ctx, o.who, px + 18, y, 12, '#ffd84a', { align: 'left' }); y += 18; }
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const l of lines) { ctx.fillText(l, px + 18, y); y += 18; }
  y += 6; st.btns = [];
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cy = Math.floor(i / cols), bx = px + 12 + cx * (optW + 8), by = y + cy * (optH + 8), foc = st.focus === i;
    ctx.fillStyle = foc ? 'rgba(255,170,90,0.45)' : 'rgba(255,255,255,0.1)'; burnsRR(ctx, bx, by, optW, optH, 12); ctx.fill();
    ctx.strokeStyle = foc ? '#ffd27a' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = foc ? 2.5 : 1.2; ctx.stroke();
    ctx.font = `600 12px ${FONT_UI}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    const ol = BurnsUI.wrap(ctx, o.options[i], optW - 20).slice(0, 2);
    ol.forEach((l, k) => ctx.fillText(l, bx + optW / 2, by + optH / 2 + (k - (ol.length - 1) / 2) * 14));
    st.btns.push({ x: bx, y: by, w: optW, h: optH, i });
  }
  ctx.restore();
};

/* ---------------- the playa ID card (Butt ID) ---------------- */
BW17.showCard = function (g, dur) { const S = BW17.state; if (!S) return; S.card = { t: 0, dur: dur || 4.2 }; burnsSfx('camera_flash', { vol: 0.5 }); };
BW17.drawCard = function (ctx, g, C, fdt) {
  C.t += fdt; if (C.t > C.dur || (C.t > 0.8 && Input.taps.length)) { BW17.state.card = null; return; }
  const W = Game.cssW, H = Game.cssH, k = easeOut(clamp(C.t / 0.35, 0, 1)), out = clamp((C.dur - C.t) / 0.3, 0, 1);
  const cw = Math.min(W * 0.86, 360), ch = cw * 0.62, x = (W - cw) / 2, y = H * 0.42 - ch / 2;
  ctx.save(); ctx.globalAlpha = out; ctx.fillStyle = `rgba(6,3,14,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, y + ch / 2); ctx.rotate((1 - k) * -0.5 - 0.04); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.translate(-W / 2, -(y + ch / 2));
  BW17.paintCard(ctx, x, y, cw, ch);
  ctx.restore();
};
BW17.paintCard = function (ctx, x, y, cw, ch) {
  // laminated card: pink header band, the photo (a cartoon behind + a peach sticker), fields, a hologram
  ctx.save();
  ctx.fillStyle = '#fff8ee'; burnsRR(ctx, x, y, cw, ch, cw * 0.05); ctx.fill();
  ctx.save(); burnsRR(ctx, x, y, cw, ch, cw * 0.05); ctx.clip();
  const gr = ctx.createLinearGradient(x, y, x + cw, y); gr.addColorStop(0, '#ff7ab8'); gr.addColorStop(1, '#ffb347');
  ctx.fillStyle = gr; ctx.fillRect(x, y, cw, ch * 0.2);
  ctx.restore();
  ctx.strokeStyle = '#d8b48a'; ctx.lineWidth = 2; burnsRR(ctx, x, y, cw, ch, cw * 0.05); ctx.stroke();
  const fs = cw / 22;
  BurnsUI.text(ctx, 'BLACK ROCK CITY · PLAYA ID', x + cw / 2, y + ch * 0.1, fs * 0.95, '#ffffff', { stroke: false });
  // photo
  const px = x + cw * 0.05, py = y + ch * 0.27, pw = cw * 0.36, ph = ch * 0.6;
  ctx.fillStyle = '#9ad8ff'; ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#e8c890'; ctx.fillRect(px, py + ph * 0.78, pw, ph * 0.22);
  // the backside (jeans), seen from behind, bent over a little
  ctx.fillStyle = '#23232c';
  ctx.beginPath(); ctx.ellipse(px + pw * 0.36, py + ph * 0.56, pw * 0.2, ph * 0.2, 0, 0, TAU); ctx.ellipse(px + pw * 0.64, py + ph * 0.56, pw * 0.2, ph * 0.2, 0, 0, TAU); ctx.fill();
  ctx.fillRect(px + pw * 0.2, py + ph * 0.64, pw * 0.18, ph * 0.22); ctx.fillRect(px + pw * 0.62, py + ph * 0.64, pw * 0.18, ph * 0.22);
  ctx.fillStyle = '#2a2a34'; ctx.fillRect(px + pw * 0.18, py + ph * 0.28, pw * 0.64, ph * 0.16);
  // the censor: a big cartoon peach sticker + a strip of mosaic
  const cx = px + pw * 0.5, cy = py + ph * 0.56, r = pw * 0.27;
  ctx.fillStyle = '#ffa86a'; ctx.beginPath(); ctx.arc(cx - r * 0.32, cy, r * 0.78, 0, TAU); ctx.arc(cx + r * 0.32, cy, r * 0.78, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff8a5a'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.05, r * 0.06, r * 0.62, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd0a0'; ctx.beginPath(); ctx.ellipse(cx - r * 0.55, cy - r * 0.3, r * 0.18, r * 0.12, -0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.ellipse(cx + r * 0.25, cy - r * 0.86, r * 0.34, r * 0.14, -0.5, 0, TAU); ctx.fill();
  const ms = pw / 9; for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffb38a' : '#f08a6a'; ctx.globalAlpha = 0.85; ctx.fillRect(px + i * ms, py + ph * 0.86 + j * ms * 0.7, ms, ms * 0.7); }
  ctx.globalAlpha = 1;
  BurnsUI.text(ctx, 'CENSORED', px + pw / 2, py + ph * 0.13, fs * 0.72, '#ff3b7a', { stroke: true, sw: 3 });
  // fields
  const fx = x + cw * 0.46; let fy = y + ch * 0.32;
  const field = (k, v) => { ctx.font = `600 ${fs * 0.62}px ${FONT_UI}`; ctx.fillStyle = '#a07a5a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(k, fx, fy); ctx.font = `${fs * 0.95}px ${FONT_DISPLAY}`; ctx.fillStyle = '#3a2414'; ctx.fillText(v, fx, fy + fs * 0.85); fy += fs * 2.05; };
  field('NAME', 'BRADY'); field('CAMP', 'ROOT SOCIETY'); field('HOME', 'TIPI #1 (HOME!)'); field('DISTINGUISHING FEATURES', 'SEE PHOTO');
  // hologram sticker
  const hx = x + cw * 0.88, hy = y + ch * 0.82, hg = ctx.createLinearGradient(hx - 16, hy - 16, hx + 16, hy + 16);
  hg.addColorStop(0, '#9af8ff'); hg.addColorStop(0.5, '#ff9ad8'); hg.addColorStop(1, '#ffe27a'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, cw * 0.055, 0, TAU); ctx.fill();
  ctx.restore();
};

/* ---------------- backpack items (quest items, trade goods, little treats) ---------------- */
(() => {
  if (typeof BurnsPack === 'undefined' || !BurnsPack.define) return;
  const D = (id, o) => BurnsPack.define(id, o);
  D('w17buttid', { name: 'PLAYA ID (BUTT ED.)', desc: 'Official. Laminated. Cheeky. USE to admire it.', col: '#ffb0d8', icon: 'ticket', kind: 'quest',
    use(g) { if (g.worldId === 17 && BW17.state) BW17.showCard(g, 4); else g.toast('PLAYA ID: BRADY · (SEE PHOTO)'); return false; } });
  D('w17ice', { name: 'BAG OF ICE', desc: 'Melting. Hurry.', col: '#bff0ff', icon: 'drop', kind: 'quest' });
  D('w17usb', { name: 'THE ROOT DRIVE', desc: 'DJ Rhizome\'s USB stick. Her whole set lives here.', col: '#7aff5a', icon: 'flake', kind: 'quest' });
  D('w17phone', { name: 'INFLUENCER\'S PHONE', desc: '384 unread notifications. It is vibrating with rage.', col: '#ff9ad8', icon: 'camera', kind: 'quest' });
  D('w17gerald', { name: 'GERALD', desc: 'A kombucha mother in a jar. Kev\'s best friend.', col: '#d8b45a', icon: 'bottle', kind: 'quest' });
  D('w17bacon', { name: 'GIFTED BACON', desc: 'Still sizzling. For Sparky.', col: '#ff8a5a', icon: 'heart', kind: 'quest' });
  D('w17cheese', { name: 'GRILLED CHEESE', desc: 'Gooey. For Pixel.', col: '#ffd84a', icon: 'heart', kind: 'quest' });
  D('w17pancake', { name: 'PLAYA PANCAKES', desc: 'Fluffy. Slightly dusty. For Auntie Nebula.', col: '#e8b070', icon: 'heart', kind: 'quest' });
  D('w17belt', { name: 'FAN BELT', desc: 'For the Disco Duck.', col: '#3a3a42', icon: 'ziptie', kind: 'quest' });
  D('w17battery', { name: 'CAR BATTERY', desc: 'Heavy. Hums a little. For the Disco Duck.', col: '#38f2ff', icon: 'flake', kind: 'quest' });
  D('w17filter', { name: 'GLITTER TIGHTS', desc: 'A playa-grade air filter. Trust the process.', col: '#c8a0ff', icon: 'heart', kind: 'quest' });
  D('w17booch', { name: 'KEV\'S KOMBUCHA', desc: 'Fizzy. Alive. USE: +2 hydration.', col: '#d8b45a', icon: 'bottle',
    use(g) { g.player.heal(2); g.toast('FIZZY! +2 HYDRATION'); burnsSfx('splash', { vol: 0.5 }); return true; } });
  D('w17tea', { name: 'CALM TEA', desc: 'Steeped with patience. USE: full hydration.', col: '#9adc8a', icon: 'drop',
    use(g) { g.player.heal(6); g.toast('AHHH. FULL HYDRATION'); burnsSfx('splash', { vol: 0.5 }); return true; } });
})();

/* ---------------- small geometry helpers shared by the builders ---------------- */
// a glowing paper lantern (static mesh); returns nothing, add a light yourself
BW17.lantern = function (m, x, y, z, col, s) {
  s = s || 1; m.color(col || '#ffcf8a', 0.9).shine(0); m.ellipsoid(x, y, z, 0.17 * s, 0.22 * s, 0.17 * s, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 7 });
  m.color('#3a2a1a', 0); m.roundCyl(x, y + 0.2 * s, z, 0.07 * s, 0.05 * s, 0.01, { seg: 8 }); m.roundCyl(x, y - 0.25 * s, z, 0.07 * s, 0.04 * s, 0.01, { seg: 8 }); m.emissive(0);
};
// a string of little bulbs between two points with a sag (static mesh + glow lights)
BW17.bulbs = function (m, lights, a, b, n, sag, cols, glowEvery) {
  cols = cols || ['#ffcf8a']; m.color('#2a2420'); const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t)]); }
  for (let i = 0; i < n; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.012, 0.012, { seg: 3 });
  for (let i = 1; i < n; i++) { const c = cols[i % cols.length]; m.color(c, 1); m.ball(pts[i][0], pts[i][1] - 0.06, pts[i][2], 0.05, { seg: 6, rings: 4 }); if (lights && (i % (glowEvery || 3) === 0)) lights.push({ x: pts[i][0], y: pts[i][1] - 0.06, z: pts[i][2], s: 0.45, c }); }
  m.emissive(0);
};

// test access (the bundle is one IIFE)
try { window.BRADY_BURNS_W17 = BW17; } catch (e) { /* no window */ }
