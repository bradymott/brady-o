/* ============================================================
   ART CART — Career, Battle Royale and secret levels: the framework.
   Progress is per car (Save.data.cart.prog[carId]): a Career run and a
   Battle Royale run (the car's own level first, the other eleven cars'
   levels in an order shuffled once when the run starts, then the final),
   stat points earned by winning them (spent in the garage, applied in every
   mode), the secret level that winning the Royale unlocks (three mini-games)
   and the "game won with this car" state.
   Design: docs/ART_CART_CAREER.md. Screens: 43_cart_hc_screens.js. The career
   final (Burn the Man): 43_cart_hb_final.js.

   HOW OTHER FILES PLUG IN (they load after this one: 43_cart_i_* , 43_cart_j_*). Assign entries; never redeclare
   these names with const/let (the bundle is one scope):
     CART_CAREER_TRACKS[carId] = trackId   the car's career level (a CART_TRACKS id); 'man' = the career final
     CART_ROYALE_ARENAS[carId] = arenaId   the car's royale arena (a CART_ARENAS id); 'man' = the royale final
     CART_STAGE_MODES.royale = true        set by the royale file once new CartRaceScene({ mode: 'royale', arena })
                                           plays a royale; until then royale stages run as Vibe Check (mode 'battle')
     CART_RACE_RULES[id] = rules           race rules picked with opts.final = id (same hooks as CART_ARENA_RULES,
                                           plus noRaceHud, noLaps, desc, aiOffset(s, k, off), camera(s, dt), finish(s))
   Stage scenes get opts.run = { car, kind: 'career'|'royale'|'secret', stage, owner, seed, game } and
   opts.levelCar (the car whose level it is: its signature special joins everyone's gift-box pool there).
   A scene may decide pass/fail itself by setting s.stageWon = true | false before results (the royale final: the
   Man must be destroyed); otherwise the player's place decides (top 3 advance; finals and mini-games need 1st).
   Driver stat point: a CART_DRIVERS entry's .stat ('speed' | 'accel' | 'handling' | 'weight') is read if present.
   ============================================================ */
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
var CART_ROYALE_ARENAS = (typeof CART_ROYALE_ARENAS !== 'undefined' && CART_ROYALE_ARENAS) || {};
var CART_STAGE_MODES = (typeof CART_STAGE_MODES !== 'undefined' && CART_STAGE_MODES) || {};
var CART_RACE_RULES = (typeof CART_RACE_RULES !== 'undefined' && CART_RACE_RULES) || {};
// stand-ins from the existing eight tracks and seven arenas until each car's own level is built
const CART_STANDIN_TRACKS = { heart: 'neon', fish: 'deepplaya', octo: 'centercamp', dragon: 'dawn', duck: 'esplanade', pyramid: 'dawn', cupcake: 'esplanade', galleon: 'storm', snail: 'gateroad', jelly: 'deepplaya', shark: 'storm', whale: 'gateroad', man: 'burn' };
const CART_STANDIN_ARENAS = { heart: 'playa', fish: 'skate', octo: 'temple', dragon: 'mx', duck: 'mud', pyramid: 'temple', cupcake: 'moon', galleon: 'deep', snail: 'skate', jelly: 'moon', shark: 'mx', whale: 'deep', man: 'playa' };
for (const id in CART_STANDIN_TRACKS) if (!CART_CAREER_TRACKS[id]) CART_CAREER_TRACKS[id] = CART_STANDIN_TRACKS[id];
for (const id in CART_STANDIN_ARENAS) if (!CART_ROYALE_ARENAS[id]) CART_ROYALE_ARENAS[id] = CART_STANDIN_ARENAS[id];
/* secret levels: one per car, exactly three mini-games (its own, Vibe Check, Glow Grab). arena null = not built yet;
   game null = the level's own game is not built yet ("coming soon", never faked) */
const CART_SECRET_LEVELS = {
  snail: { arena: 'skate', game: 'trick' }, shark: { arena: 'mx', game: 'race' }, heart: { arena: 'playa', game: null },
  whale: { arena: 'deep', game: 'pearl' }, jelly: { arena: 'moon', game: 'crater' }, duck: { arena: 'mud', game: 'rescue' },
  pyramid: { arena: 'temple', game: 'relic' },
  fish: { arena: null, game: null, soon: 'ROLLER RINK' }, octo: { arena: null, game: null, soon: 'THE FORGE' }, dragon: { arena: null, game: null, soon: 'JOUSTING GROUNDS' },
  cupcake: { arena: null, game: null, soon: 'CANDY CRATER' }, galleon: { arena: null, game: null, soon: 'TREASURE ISLE' }
};
const CART_STAT_KEYS = ['speed', 'accel', 'handling', 'weight'];
const CART_RUN_KINDS = { career: { name: 'CAREER', final: 'BURN THE MAN', col: '#ffd84a' }, royale: { name: 'BATTLE ROYALE', final: 'THE MAN', col: '#ff4f8a' } };
const CART_RUN_LEN = 13;   // the car's own level + the other eleven + the final

/* King of the Hill and Capture the Flag are retired: off every arena's list (old saves' wins for them stay harmless,
   and a scene asked for one plays Vibe Check, see the CartRaceScene constructor). Secret-level arenas offer exactly
   their three games. */
const CART_RETIRED_OBJECTIVES = { hill: 1, flag: 1 };
function cartTidyArenas() {
  for (const A of CART_ARENAS) {
    if (A._tidy) continue; A._tidy = true;
    A.objectives = A.objectives.filter(o => !CART_RETIRED_OBJECTIVES[o]);
    for (const car in CART_SECRET_LEVELS) { const L = CART_SECRET_LEVELS[car]; if (L.arena !== A.id) continue; A.secretOf = car; A.objectives = cartSecretGames(car).filter(Boolean); }
  }
}
cartTidyArenas();

/* ---------------- save: per-car progress under Save.data.cart.prog ---------------- */
function cartProgAll() { const sv = cartSave(); if (!sv.prog || typeof sv.prog !== 'object') sv.prog = {}; return sv.prog; }
function cartProg(id) {
  const all = cartProgAll(); let p = all[id];
  if (!p || typeof p !== 'object') p = all[id] = {};
  if (!p.alloc || typeof p.alloc !== 'object') p.alloc = {};
  for (const s of CART_STAT_KEYS) p.alloc[s] = Math.max(0, p.alloc[s] | 0);
  if (!p.secret || typeof p.secret !== 'object') p.secret = {};
  p.points = Math.max(0, p.points | 0);
  return p;
}
// a fresh run: the car's own level, the other eleven cars' levels shuffled (fixed for the whole run), the final
function cartRunNew(car, kind, seed) {
  seed = seed !== undefined ? seed >>> 0 : ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
  const rng = mulberry32(seed ^ hashStr(car + kind)), others = cartShuffle(CART_CARS.map(c => c.id).filter(id => id !== car), rng);
  const R = { order: [car].concat(others, ['man']), stage: 0, best: [], tries: 0, seed, started: Date.now() };
  cartProg(car)[kind] = R; Save.save();
  return R;
}
function cartRun(car, kind) { const R = cartProg(car)[kind]; return R && Array.isArray(R.order) && R.order.length === CART_RUN_LEN ? R : null; }
// the level a stage plays: { kind, owner, name, track | arena, standIn, final }
function cartStage(kind, owner) {
  if (kind === 'career') {
    let tr = CART_CAREER_TRACKS[owner]; if (!CART_TRACKS[tr]) tr = CART_STANDIN_TRACKS[owner] || 'esplanade';
    return { kind, owner, track: tr, name: owner === 'man' ? 'BURN THE MAN' : CART_TRACKS[tr].name, place: CART_TRACKS[tr].name, standIn: tr === CART_STANDIN_TRACKS[owner] && owner !== 'man', final: owner === 'man' ? 'plunger' : null };
  }
  let ar = CART_ROYALE_ARENAS[owner]; if (!CART_ARENAS.some(a => a.id === ar)) ar = CART_STANDIN_ARENAS[owner] || 'playa';
  const A = cartArena(ar), ready = !!CART_STAGE_MODES.royale;
  return { kind, owner, arena: ar, name: owner === 'man' ? 'THE MAN' : A.name, place: A.name, standIn: ar === CART_STANDIN_ARENAS[owner] && owner !== 'man', royale: ready, final: owner === 'man' ? 'man' : null };
}
// the CartRaceScene options for the run's current stage (or stage i)
function cartStageOpts(car, kind, i) {
  const R = cartRun(car, kind) || cartRunNew(car, kind), sv = cartSave(), st = i === undefined ? Math.min(R.stage, CART_RUN_LEN - 1) : i;
  const owner = R.order[st], S = cartStage(kind, owner);
  const o = { car, driver: sv.driver, autoGas: sv.autoGas !== false, run: { car, kind, stage: st, owner, seed: R.seed }, levelCar: owner !== 'man' ? owner : null };
  if (kind === 'career') Object.assign(o, { mode: 'career', track: S.track }, S.final ? { final: S.final } : {});
  else Object.assign(o, S.royale ? { mode: 'royale', arena: S.arena } : { mode: 'battle', arena: S.arena, objective: 'vibe' });
  return o;
}
function cartPlayStage(car, kind, i) { Sound.play('select'); const s = new CartRaceScene(cartStageOpts(car, kind, i)); Game.setScene(s); return s; }
// secret levels
function cartSecretGames(car) { const L = CART_SECRET_LEVELS[car]; if (!L || !L.arena || !CART_ARENAS.some(a => a.id === L.arena)) return []; return [L.game && CART_OBJECTIVES[L.game] ? L.game : null, 'vibe', 'glow']; }
function cartSecretReady(car) { const G = cartSecretGames(car); return G.length === 3 && G.every(Boolean); }   // all three games built
function cartSecretOpenable(car) { return cartSecretGames(car).length === 3; }   // its arena exists (its own game may still be coming)
function cartSecretUnlocked(car) { return (cartProg(car).royaleWon | 0) > 0; }
function cartSecretName(car) { const L = CART_SECRET_LEVELS[car]; return L && L.arena ? cartArena(L.arena).name : (L && L.soon) || 'SECRET LEVEL'; }
function cartSecretOpts(car, game) { const L = CART_SECRET_LEVELS[car], sv = cartSave(); return { mode: 'battle', arena: L.arena, objective: game, car, driver: sv.driver, autoGas: sv.autoGas !== false, run: { car, kind: 'secret', game, stage: 0, owner: car } }; }
function cartSecretWon(car) { const G = cartSecretGames(car), p = cartProg(car); return G.length === 3 && G.every(g => g && p.secret[g]); }
// the game is won with a car once its Career, Battle Royale and all three secret games are won
function cartCarComplete(car) { const p = cartProg(car); return (p.careerWon | 0) > 0 && (p.royaleWon | 0) > 0 && cartSecretWon(car); }

/* ---------------- stat points ---------------- */
function cartPointsFree(car) { const p = cartProg(car); let u = 0; for (const s of CART_STAT_KEYS) u += p.alloc[s]; return Math.max(0, p.points - u); }
function cartPointsUsed(car) { const p = cartProg(car); let u = 0; for (const s of CART_STAT_KEYS) u += p.alloc[s]; return u; }
// +1 / -1 pip on one stat (capped at the 5-pip maximum with the driver's point); false when it can't
function cartAlloc(car, stat, d) {
  const p = cartProg(car), C = cartCar(car); if (!CART_STAT_KEYS.includes(stat)) return false;
  if (d > 0) { if (cartPointsFree(car) <= 0 || C.stats[stat] + p.alloc[stat] >= 5) return false; p.alloc[stat]++; }
  else { if (p.alloc[stat] <= 0) return false; p.alloc[stat]--; }
  Save.save(); return true;
}
// per stat: [base, driver pip (0/1, only where it fits), stat points]
function cartStatParts(car, drvId) {
  const C = cartCar(car), p = cartProg(car), D = drvId ? cartDriver(drvId) : null, out = {};
  for (const s of CART_STAT_KEYS) { const b = C.stats[s], pts = Math.min(p.alloc[s], 5 - b), drv = D && D.stat === s && b + pts < 5 ? 1 : 0; out[s] = [b, drv, pts]; }
  return out;
}
// the stats a kart drives with: the car's, + the driver's fixed point, + (the player's car) its stat points; max 5
function cartKartStats(car, drv, player) {
  if (player && typeof player === 'object') player = !!player.player;   // makeKart passes its field entry
  const b = car.stats, o = { speed: b.speed, accel: b.accel, handling: b.handling, weight: b.weight };
  if (player) { const a = cartProg(car.id).alloc; for (const s of CART_STAT_KEYS) o[s] = Math.min(5, o[s] + a[s]); }
  if (drv && CART_STAT_KEYS.includes(drv.stat)) o[drv.stat] = Math.min(5, o[drv.stat] + 1);
  return o;
}
// rivals sharpen a little with every stat point the player drives with (a maxed car must stay beatable)
function cartAiScale(s) { return s && s.carId ? 0.007 * cartPointsUsed(s.carId) : 0; }

/* ---------------- a stage's result ----------------
   called once when a run stage reaches its results; records the place, advances the run, awards points */
const CartCareer = {
  result(s) {
    const run = s.run; if (!run || s.runOut) return s.runOut;
    const me = (s.results || []).find(r => r.player), place = me ? me.rank : 99, p = cartProg(run.car);
    const out = s.runOut = { kind: run.kind, place, pass: false, stage: run.stage, prize: false, done: false, complete: false, unlocked: false, stale: false };
    if (run.kind === 'secret') {
      out.pass = typeof s.stageWon === 'boolean' ? s.stageWon : place === 1;
      if (out.pass && run.game) { const was = cartCarComplete(run.car); p.secret[run.game] = (p.secret[run.game] | 0) + 1; out.complete = !was && cartCarComplete(run.car); }
      Save.save(); return out;
    }
    const R = cartRun(run.car, run.kind), final = run.owner === 'man';
    out.final = final;
    out.pass = typeof s.stageWon === 'boolean' ? s.stageWon : final ? place === 1 : place <= 3;
    if (!R || R.seed !== run.seed || R.stage !== run.stage) { out.stale = true; return out; }   // an old run or a replay: nothing to record
    R.tries++;
    if (out.pass) {
      R.best[run.stage] = Math.min(R.best[run.stage] || 99, place); R.stage++;
      if (R.stage >= CART_RUN_LEN) {
        out.done = true; const key = run.kind + 'Won', was = cartCarComplete(run.car);
        p[key] = (p[key] | 0) + 1;
        if (p[key] === 1) { p.points++; out.prize = true; if (run.kind === 'royale') out.unlocked = true; }
        out.complete = !was && cartCarComplete(run.car);
      }
    }
    Save.save(); return out;
  },
  // where CONTINUE goes after a stage
  next(s) {
    const o = s.runOut || {}, run = s.run; s.release();
    if (o.prize) return Game.setScene(new KartMenuScene({ state: 'prize', car: run.car, kind: run.kind, complete: o.complete }));
    if (o.complete) return Game.setScene(new KartMenuScene({ state: 'complete', car: run.car }));
    if (run.kind === 'secret') return Game.setScene(new KartMenuScene({ state: 'secretGames', car: run.car }));
    Game.setScene(new KartMenuScene({ state: 'run', car: run.car, kind: run.kind }));
  },
  map(s) { const run = s.run; s.release(); Game.setScene(new KartMenuScene(run.kind === 'secret' ? { state: 'secretGames', car: run.car } : { state: 'run', car: run.car, kind: run.kind })); },
  buttons(s) {
    const P = s.panelRect(), o = s.runOut || {}, bw = Math.min(170, (P.w - 48) / 2), y = P.y + P.h - 56, cx = P.x + P.w / 2, B = [];
    if (o.pass) { B.push({ x: cx + 6, y, w: bw, h: 44, label: 'CONTINUE ▶', primary: true, fn: () => this.next(s) }); B.push({ x: cx - bw - 6, y, w: bw, h: 44, label: o.done || s.run.kind === 'secret' ? 'PLAY AGAIN' : 'RETRY', fn: () => s.restart() }); }
    else { B.push({ x: cx + 6, y, w: bw, h: 44, label: 'RETRY ▶', primary: true, fn: () => s.restart() }); B.push({ x: cx - bw - 6, y, w: bw, h: 44, label: s.run.kind === 'secret' ? '◀ GAMES' : '◀ MAP', fn: () => this.map(s) }); }
    B.focus = 0; return B;
  },
  // the results panel of a run stage: the place, the verdict, the standings
  drawResults(s, ctx) {
    const P = s.panelRect(), a = clamp(s.stateT * 3, 0, 1), o = s.runOut || {}, run = s.run, W = Game.cssW, wide = P.w >= 470;
    ctx.save(); ctx.globalAlpha = a; BurnsUIKit.panel(ctx, P.x, P.y, P.w, P.h);
    const head = run.kind === 'secret' ? cartSecretName(run.car) + ' · ' + (CART_OBJECTIVES[run.game] || {}).name : CART_RUN_KINDS[run.kind].name + ' · STAGE ' + (run.stage + 1) + '/' + CART_RUN_LEN;
    BurnsUI.text(ctx, head, P.x + P.w / 2, P.y + 22, 11, '#ffd84a', CART_TXT_U);
    const medal = ['#ffd84a', '#dfe6f2', '#ffa65a'][o.place - 1] || '#c8b8e0';
    // the place: big, with a medal ring for the podium
    const lx = wide ? P.x + 98 : P.x + P.w / 2, ly = wide ? P.y + 112 : P.y + 70, rr = wide ? 50 : 30;
    ctx.save(); ctx.shadowColor = medal; ctx.shadowBlur = o.pass ? 22 : 0;
    const g = ctx.createRadialGradient(lx - rr * 0.3, ly - rr * 0.35, 2, lx, ly, rr); g.addColorStop(0, rgba(medal, 0.95)); g.addColorStop(1, rgba(shade(medal, -0.5), 0.9));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, rr, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, rr - 4, 0, TAU); ctx.stroke();
    BurnsUI.text(ctx, o.place < 99 ? cartOrdinal(o.place) : '--', lx, ly + 1, wide ? 30 : 19, '#ffffff', { sw: 4 });
    // the verdict
    const need = run.kind === 'secret' || o.final ? 'WIN IT TO ' + (run.kind === 'secret' ? 'CLEAR THIS GAME' : 'TAKE THE ' + CART_RUN_KINDS[run.kind].name) : 'FINISH TOP 3 TO ADVANCE';
    const verdict = o.pass ? (o.done ? CART_RUN_KINDS[run.kind].name + ' WON!' : run.kind === 'secret' ? 'GAME CLEARED!' : 'YOU ADVANCE!') : 'NOT THIS TIME';
    const vy = wide ? ly + rr + 30 : ly + rr + 20, vx = lx;
    BurnsUI.text(ctx, verdict, vx, vy, wide ? 19 : 17, o.pass ? '#7aff8a' : '#ff8a8a', { glow: o.pass ? '#1a8a3a' : null });
    BurnsUI.text(ctx, o.pass ? (o.prize ? '+1 STAT POINT!' : o.done ? 'Run complete' : 'Next: stage ' + (run.stage + 2)) : need, vx, vy + 20, 11, o.pass && o.prize ? '#ffd84a' : 'rgba(255,255,255,0.8)', CART_TXT_U);
    if (o.stale && o.pass) BurnsUI.text(ctx, '(replay: progress unchanged)', vx, vy + 36, 9, 'rgba(255,255,255,0.55)', CART_TXT_U);
    // standings
    const rx = wide ? P.x + 200 : P.x + 16, rw = wide ? P.w - 216 : P.w - 32, ry0 = wide ? P.y + 46 : vy + (o.stale ? 50 : 40), rh = wide ? 24 : 21, bottom = P.y + P.h - 64;
    const unit = s.plg ? ' ⚡' : '', isB = s.isBattle && !s.isRace;
    for (let i = 0; i < s.results.length; i++) {
      const r = s.results[i], y = ry0 + i * rh; if (y + rh / 2 > bottom) break;
      ctx.fillStyle = r.player ? 'rgba(255,216,74,0.2)' : i < 3 && !o.final && run.kind !== 'secret' ? 'rgba(122,255,138,0.07)' : 'rgba(255,255,255,0.05)';
      burnsRR(ctx, rx, y - rh / 2 + 2, rw, rh - 4, 7); ctx.fill();
      BurnsUI.text(ctx, cartOrdinal(r.rank), rx + 20, y, 11, r.rank === 1 ? '#ffd84a' : '#ffffff', CART_TXT_C);
      BurnsUI.text(ctx, r.player ? 'YOU · ' + r.car : r.car, rx + 40, y, 11, r.player ? '#ffd84a' : '#ffffff', CART_TXT_UL);
      const val = s.plg ? (r.score | 0) + unit : isB ? (s.objective === 'vibe' ? (r.out ? 'OUT' : r.score + ' ♥') : String(r.score)) : (r.est ? '~' : '') + cartFmtTime(r.t);
      BurnsUI.text(ctx, val, rx + rw - 10, y, 11, '#9affc8', CART_TXT_URS);
    }
    BurnsUIKit.drawButtons(ctx, s.btns || []);
    ctx.restore();
    void W;
  },
  // the intro card's second line for a run stage
  introSub(s) {
    const run = s.run;
    if (run.kind === 'secret') return 'SECRET LEVEL · ' + (CART_OBJECTIVES[s.objective] || {}).name;
    const owner = run.owner === 'man' ? null : cartCar(run.owner);
    return CART_RUN_KINDS[run.kind].name + ' · STAGE ' + (run.stage + 1) + '/' + CART_RUN_LEN + (owner ? ' · ' + owner.name + '\'S LEVEL' : ' · THE FINAL');
  }
};

/* ---------------- the scene hooks (wrapping CartRaceScene's results, buttons and exits for run stages) ---------------- */
{
  const P = CartRaceScene.prototype, finish = P.finishRace, buttons = P.buildButtons, draw = P.drawResults, leave = P.leave;
  P.finishRace = function () {
    if (this.state === 'results') return;
    if (this.rules && this.rules.finish) this.rules.finish(this); else finish.call(this);
    // dev-only (debug.career.win): force the player's place
    if (this.forcePlace && this.results) {
      const me = this.results.find(r => r.player), rest = this.results.filter(r => !r.player), at = clamp(this.forcePlace, 1, this.results.length) - 1;
      rest.splice(at, 0, me); rest.forEach((r, i) => { r.rank = i + 1; }); this.results = rest; this.player.rank = at + 1;
      if (this.rules && this.rules.forced) this.rules.forced(this, at + 1);
      if (typeof this.stageWon === 'boolean') this.stageWon = at === 0;   // a final that decides itself (the Man destroyed / burned) follows the forced place
    }
    if (this.run) { CartCareer.result(this); this.buildButtons(); }
  };
  P.buildButtons = function () { if (this.run && this.state === 'results') { this.btns = CartCareer.buttons(this); return; } buttons.call(this); };
  P.drawResults = function (ctx) { if (this.run && this.state === 'results') return CartCareer.drawResults(this, ctx); draw.call(this, ctx); };
  P.leave = function () { if (this.run) return CartCareer.map(this); leave.call(this); };
}

/* ---------------- debug API (tests; dev-only helpers live under BRADY_CART.debug.career) ---------------- */
if (typeof window !== 'undefined' && window.BRADY_CART) window.BRADY_CART.debug.career = {
  // wipe one car's progress (or every car's)
  reset(car) { const all = cartProgAll(); if (car) delete all[car]; else for (const k in all) delete all[k]; Save.save(); return true; },
  // start a fresh run (seed optional) and return it
  start(car, kind, seed) { return JSON.parse(JSON.stringify(cartRunNew(car, kind || 'career', seed))); },
  run(car, kind) { const R = cartRun(car, kind || 'career'); return R ? JSON.parse(JSON.stringify(R)) : null; },
  prog(car) { return JSON.parse(JSON.stringify(cartProg(car))); },
  stage(car, kind, i) { const R = cartRun(car, kind || 'career'); return R ? cartStage(kind || 'career', R.order[i === undefined ? Math.min(R.stage, CART_RUN_LEN - 1) : i]) : null; },
  opts(car, kind, i) { return cartStageOpts(car, kind || 'career', i); },
  // load the run's current stage (no menus); returns debug.state()
  play(car, kind, i) { const s = cartPlayStage(car, kind || 'career', i); s.loadAll(); return window.BRADY_CART.debug.state(); },
  playSecret(car, game) { const s = new CartRaceScene(cartSecretOpts(car, game)); Game.setScene(s); s.loadAll(); return window.BRADY_CART.debug.state(); },
  // DEV ONLY: end the current stage at once with the player in `place` (default 1st) and return the run outcome
  win(place) {
    const s = Game.scene; if (!(s instanceof CartRaceScene)) return null;
    if (s.state === 'load') s.loadAll();
    if (s.state === 'intro' || s.state === 'count') { s.state = 'race'; s.stateT = 0; }
    s.forcePlace = place || 1; if (s.plg && s.rules.forceEnd) s.rules.forceEnd(s, s.forcePlace);
    s.finishRace(); return s.runOut ? Object.assign({}, s.runOut) : null;
  },
  lose() { return this.win(8); },
  // press CONTINUE / RETRY / MAP on a run stage's results
  press(label) { const s = Game.scene, b = (s.btns || []).find(x => x.label.indexOf(label || 'CONTINUE') >= 0); if (!b) return null; b.fn(); const g = Game.scene; return { scene: g.constructor.name, state: g.state }; },
  points(car) { return { earned: cartProg(car).points, free: cartPointsFree(car), alloc: Object.assign({}, cartProg(car).alloc) }; },
  alloc(car, stat, d) { return cartAlloc(car, stat, d === undefined ? 1 : d); },
  // the stats the player's kart in the current scene really drives with (physics numbers)
  kart() { const s = Game.scene, k = s && s.player; return k ? { car: k.car.id, vmax: +k.vmax.toFixed(3), acc: +k.acc.toFixed(3), turn: +k.turn.toFixed(3), grip: +k.grip.toFixed(3), mass: +k.mass.toFixed(3), stats: cartKartStats(k.car, k.drv, true), aiSkill: s.karts.filter(q => !q.player).map(q => +q.ai.skill.toFixed(3)) } : null; },
  secret(car) { return { unlocked: cartSecretUnlocked(car), ready: cartSecretReady(car), openable: cartSecretOpenable(car), games: cartSecretGames(car), won: Object.assign({}, cartProg(car).secret), complete: cartCarComplete(car), name: cartSecretName(car) }; },
  complete(car) { return cartCarComplete(car); },
  // the career final: the plunger state, and (DEV ONLY) drop the player right onto the live plunger
  final() { const s = Game.scene, P = s && s.plg; if (!P) return null; return { alive: P.alive, n: P.n, x: +P.x.toFixed(1), z: +P.z.toFixed(1), counts: s.karts.map(k => ({ id: k.id, player: k.player, plg: k.plg })), winner: P.winner ? P.winner.id : null, playerWon: !!(P.winner && P.winner.player), igniteT: +P.igniteT.toFixed(2), burn: s.man ? +s.man.burn.toFixed(3) : null, state: s.state }; },
  plunge() { const s = Game.scene, P = s && s.plg; if (!P || !P.alive) return false; const k = s.player, a = P.yaw - Math.PI / 2; window.BRADY_CART.debug.place(-1, P.x - Math.sin(a) * 6, P.z - Math.cos(a) * 6, a, { speed: 8 }); return true; },
  menu(o) { Game.setScene(new KartMenuScene(o)); return Game.scene.state; }
};
if (typeof window !== 'undefined' && window.BRADY_BURNS) for (const k of ['CART_CAREER_TRACKS', 'CART_ROYALE_ARENAS', 'CART_STAGE_MODES', 'CART_RACE_RULES', 'CART_SECRET_LEVELS', 'CartCareer']) Object.defineProperty(window.BRADY_BURNS, k, { get: () => eval(k), configurable: true });
