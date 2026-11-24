/* ============================================================
   BRADY GOES TO BURNING MAN — boss gates: a boss fight can never be walked past
   A world's walk-in trigger is one way into its boss fight; this makes sure it is never the only one.

   BurnsBossGate.add(api, o) (call from def.build) watches the arena every step:
   - Brady anywhere in the arena, boss not beaten, fight not running and no cutscene playing:
       requirements met -> the fight starts (o.start), however he got in (side, back, over a wall, on a bike,
       after a faint, on a return visit or after a reload)
       requirements missing -> a short NOT YET! line says what to do (again every few seconds while he stays), and
       the guide arrow points at that next step until it changes
   - an ACTION button (o.button: {x, z, y?, r, label}) where a player would stand and look for one: it starts the
     fight, or says what is missing
   - g._bossHint holds the current NOT YET line (tests read it)
   o = { mission: 'boss' | fn(g) -> id, inArena(g, p), running(g) (fight, its intro or its ending in progress),
         start(g), ready(g)?, missing(g)?, when(g)? (the gate only works while this is true), button?,
         repeat? (seconds between NOT YET lines while he stays; default 7, Infinity = once per walk-in for busy places),
         guide?(g) (where the arrow points after a NOT YET, instead of the next required mission) }

   BurnsBossGate.finale(api, ids) (call from def.build): if Brady comes into a world whose last mission(s) are already
   done but the world was never finished (he quit or reloaded during the victory scene), the world finishes for him
   instead of leaving him in a quiet arena with nothing left to do and the next world still locked.

   Burning Man only (42_* modules are not in Super Art Kart). BurnsWorlds.register and the world api are unchanged;
   the guide redirect goes through BurnsNav.guides (or a world's own def.guide calls BurnsBossGate.guide).
   ============================================================ */

const BurnsBossGate = {
  add(api, o) {
    const G = { o, hintT: -99 };
    api.update(g => { g._bossGate = G; BurnsBossGate.watch(g, G); });
    if (o.button) { const B = o.button; api.interact({ x: B.x, z: B.z, y: B.y, r: B.r || 6, label: B.label || 'FIGHT!', when: g => BurnsBossGate.pending(g, G), fn: g => BurnsBossGate.tryStart(g, G, true) }); }
    BurnsBossGate.hookGuide(api);
    return G;
  },
  // worlds without their own def.guide get the redirect through BurnsNav.guides (worlds with one call guide() first)
  hookGuide(api) {
    if (typeof BurnsNav === 'undefined' || !api.world || !api.world.def) return;
    const id = api.world.def.id;
    if (id === undefined || api.world.def.guide || BurnsNav.guides[id]) return;
    BurnsNav.guides[id] = g => BurnsBossGate.guide(g);
  },
  missionId(g, G) { const m = G.o.mission; return typeof m === 'function' ? m(g) : m || 'boss'; },
  mission(g, G) { return g.missions.get(BurnsBossGate.missionId(g, G)); },
  // the fight can be started now or later: not beaten, not running, its intro not playing
  pending(g, G) {
    const m = BurnsBossGate.mission(g, G);
    return !!(m && m.state !== 'done' && !G.o.running(g) && (!G.o.when || G.o.when(g)));
  },
  ready(g, G) {
    if (G.o.ready) return !!G.o.ready(g);
    const m = BurnsBossGate.mission(g, G);
    return !!m && (m.state === 'available' || m.state === 'active');
  },
  // the first mission still to do on the way to `id` (follows requirements down to one that can be started)
  nextReq(g, id, depth) {
    const m = g.missions.get(id); depth = depth || 0;
    if (!m || m.state === 'done') return null;
    if (m.state !== 'locked' || depth > 6) return m;
    for (const r of m.def.requires || []) {
      if (g.missions.reqDone(r) || typeof r !== 'string' || r.indexOf(':') >= 0) continue;
      const d = BurnsBossGate.nextReq(g, r, depth + 1); if (d) return d;
    }
    return m;
  },
  next(g, G) {
    const m = BurnsBossGate.mission(g, G); if (!m) return null;
    for (const r of m.def.requires || []) { if (g.missions.reqDone(r)) continue; return typeof r === 'string' && r.indexOf(':') < 0 ? BurnsBossGate.nextReq(g, r) : null; }
    return null;
  },
  missing(g, G) {
    if (G.o.missing) { const s = G.o.missing(g); if (s) return s; }
    const m = BurnsBossGate.mission(g, G); if (!m) return '';
    const nx = BurnsBossGate.next(g, G), first = m.def.lockedDesc || 'Not ready for this fight yet.';
    if (!nx) return first;
    const d = nx.def, line = first + ' Next: ' + String(d.short || d.name).replace(/[.!]+$/, '');
    return d.hint && line.length + d.hint.length < 110 ? line + ' (' + d.hint + ').' : line + '.';
  },
  tryStart(g, G, pressed, fresh) {
    if (!BurnsBossGate.pending(g, G)) return false;
    if (BurnsBossGate.ready(g, G)) { g._bossHint = null; G.guideTo = null; G.o.start(g); return true; }
    const msg = BurnsBossGate.missing(g, G);
    g._bossHint = msg;
    const nx = BurnsBossGate.next(g, G); G.guideTo = G.o.guide ? { custom: true } : nx ? { id: nx.id, state: nx.state } : null;
    if (pressed || fresh || !(g.time - G.hintT < (G.o.repeat || 7))) {
      G.hintT = g.time;
      g.banner('NOT YET!', msg, { col: '#ff9a4a', small: true });
      if (pressed) burnsSfx('bump', { vol: 0.5 });
      if (typeof BurnsNav !== 'undefined' && BurnsNav.refresh) BurnsNav.refresh(g);
    }
    return false;
  },
  watch(g, G) {
    const p = g.player;
    if (!p || g.state !== 'play' || g.cine || g.dialog.open || p.dead || g.faintT > 0 || g.finishing) return;
    const inside = G.o.inArena(g, p);
    if (!inside) { if (G.hinted) { G.hinted = false; g._bossHint = null; } return; }
    if (!BurnsBossGate.pending(g, G)) return;
    const fresh = !G.hinted;   // just walked in: say it now
    G.hinted = true;
    BurnsBossGate.tryStart(g, G, false, fresh);
  },
  // the guide arrow: after a NOT YET, the next step (until that mission moves on); otherwise the world's default
  guide(g) {
    const G = g._bossGate; if (!G || !G.guideTo || typeof BurnsNav === 'undefined') return undefined;
    if (G.guideTo.custom) { if (!BurnsBossGate.pending(g, G)) { G.guideTo = null; return undefined; } return G.o.guide(g); }
    const m = g.missions.get(G.guideTo.id);
    if (!m || m.state !== G.guideTo.state || m.state === 'done' || (g.boss && g.boss.active && !g.boss.defeated)) { G.guideTo = null; return undefined; }
    const d = m.def, a = d.giver && m.state === 'available' && g.actor(d.giver);
    if (a && !a.removed && !a.hidden) return [{ x: a.x, z: a.z, y: a.y, label: 'TALK TO ' + (a.def.name || 'THEM') }];
    const t = BurnsNav.missionTargets(g, m);
    return t.length ? t : undefined;
  },

  /* ---------- a finale that was won but never finished ---------- */
  finale(api, ids) {
    const F = { ids: [].concat(ids), t: null };
    api.update((g, dt) => BurnsBossGate.finaleWatch(g, F, dt));
    return F;
  },
  finaleWatch(g, F, dt) {
    if (F.t === -1) return;
    const sv = BurnsSave.get();
    // decided once, on the first step of the visit: was the finale already won when Brady came in?
    if (F.t === null) { F.t = !sv.worldDone[g.worldId] && F.ids.every(id => g.missions.isDone(id)) ? 2.5 : -1; return; }
    if (g.state !== 'play' || g.cine || g.dialog.open || g.finishing || (g.player && g.player.dead)) return;
    F.t -= dt;
    if (F.t > 0) return;
    F.t = -1;
    if (sv.worldDone[g.worldId]) return;
    const m = g.missions.get(F.ids[F.ids.length - 1]);
    g.banner('YOU DID IT!', (m ? m.def.name + ' is done. ' : '') + 'On to the next adventure!', { col: '#ffd84a' });
    g.finishWorld();
  }
};

if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsBossGate });
