/* ============================================================
   BRADY GOES TO BURNING MAN — Black Rock City (world 500), part 3: getting around the city
   - def.guide: what the guide arrow points at in the city (the tracked quest's spot, else the next story place)
   - def.cityMap: the pause menu's MAP page (the whole city from above, labelled; FAST TRAVEL is a button on it)
   - the e-bike: earned after World 8 (Hell Station) with the 'Juice Box' side quest (BURNS_OW_EBIKE below)
   (the engine side is 41_burns_nav.js; guide §10.1 and §19.7)
   ============================================================ */

// the e-bike quest: who gives it, where it charges, when it opens (change these freely)
const BURNS_OW_EBIKE = { after: 8, giverPlace: 8, charger: '3:00 Plaza', chargerOff: [0, -16] };

(function () {
  const O = BURNS_OW, D = BurnsWorlds.get(O.ID); if (!D) return;
  BurnsPack.define('ebattery', { name: 'E-BIKE BATTERY', desc: 'Flat as a pancake. Charge it at the solar camp at the 3:00 plaza.', col: '#38f2ff', kind: 'quest' });
  const charger = () => { const c = O.address(BURNS_OW_EBIKE.charger); return { x: c[0] + BURNS_OW_EBIKE.chargerOff[0], z: c[1] + BURNS_OW_EBIKE.chargerOff[1] }; };
  BurnsOW.ebikeCharger = charger;
  if (!D.missions.find(m => m.id === 'owEbike')) D.missions.push({
    id: 'owEbike', side: true, name: 'Juice Box', short: 'Charge the e-bike battery at the 3:00 plaza', type: 'custom', giver: 'owVolta', start: 'manual',
    unlock: () => !!BurnsSave.get().worldDone[BURNS_OW_EBIKE.after],
    desc: 'Volta at Hell Station rescued an e-bike from the DPW scrap pile. Its battery is flat: charge it at the solar camp on the 3:00 plaza and the bike is yours.',
    hint: 'The solar camp, 3:00 plaza', reward: { item: 'ebike' },
    guide: g => { const c = charger(); return { x: c.x, z: c.z, label: 'SOLAR CHARGER' }; },
    onComplete(g) { g.toast('BIKE BUTTON: E-BIKE IN THE CITY (SETTINGS: CITY BIKE)'); }
  });

  /* ---------- the guide: per-quest spots for the city's own quests ---------- */
  const set = (id, fn) => { const m = D.missions.find(q => q.id === id); if (m && m.guide === undefined) m.guide = fn; };
  set('owIce', g => 'owMelty');
  set('owPhoto', g => BurnsNav.near(g, (O.state.photos || []).filter(P => !BurnsSave.flag(O.ID, 'photo:' + P.id)).map(P => ({ x: P.x, z: P.z, label: P.label }))));
  set('owDome2', g => 'owAuntie');
  set('owRace', g => {
    const R = O.state.race, p = g.player;
    if (!R || !R.on) return 'owRae';
    if (!(p.vehicle && p.vehicle.kind === 'car')) { const cars = g.world.vehicles.filter(v => v.o.drivable !== false && v.kind === 'car'); if (cars.length) { BurnsNav.near(g, cars); return { x: cars[0].x, z: cars[0].z, label: 'THE ART CAR' }; } }
    const G = O.state.gates[R.next]; return G ? { x: G.x, z: G.z, label: `GATE ${R.next + 1}` } : undefined;
  });

  /* An address inside a hint ('The Deep End, 3:15 & Esplanade', '2:35 on the Esplanade', 'Center Camp (6:00)'), quietly:
     null when there's nothing it knows. */
  BurnsOW.hintSpot = function (hint) {
    const s = String(hint || ''), low = s.toLowerCase();
    const m = /(\d{1,2})(?::(\d\d))?\s*(?:&|on the|on)\s*([a-z]+)/i.exec(s);
    if (m) {
      const k = O.STREETS.findIndex(n => n.toLowerCase() === m[3].toLowerCase() || (m[3].length === 1 && n[0].toLowerCase() === m[3].toLowerCase()));
      if (k >= 0) { const h = (+m[1] % 12 || 12) + (+(m[2] || 0)) / 60; return O.at(h === 12 ? 0 : h, O.RINGS[k] + (k === 0 ? 7 : 4)); }
    }
    const pl = /(\d{1,2})(?::(\d\d))?\s*plaza/i.exec(s); if (pl) return O.address(pl[0]);
    for (const k in O.spots) if (low.indexOf(k) >= 0) return O.address(O.spots[k]);
    for (const P of O.PLACES) if (low.indexOf(P.name.toLowerCase()) >= 0) return [P.x, P.z];
    const K = typeof BurnsCamps !== 'undefined' ? BurnsCamps.kinds : {};
    for (const C of O.CAMPS) { const n = K[C.kind] && K[C.kind].name; if (n && low.indexOf(n.toLowerCase()) >= 0) return O.address(n); }
    if (low.indexOf('center camp') >= 0) return O.address('Center Camp');
    if (low.indexOf('temple') >= 0) return O.address('The Temple');
    return null;
  };
  // quests other worlds put in the city: the hint's address when there's no better spot (resolved once per quest)
  BurnsOW.questSpot = function (g, m) {
    const d = m.def;
    if (d._spot === undefined) { const q = BurnsOW.hintSpot(d.hint); d._spot = q ? { x: q[0], z: q[1] } : null; }
    return d._spot ? Object.assign({ label: (d.short || d.name || '').toUpperCase() }, d._spot) : null;
  };

  // the city's guide: Burn Tokens and quests first (the engine's reading of them, with hint addresses for quests that
  // have no spot of their own), then the next story place
  D.guide = function (g) {
    const out = [], p = g.player, M = g.missions;
    const tr = M.tracked && M.get(M.tracked), act = M.active(), order = [];
    if (tr && tr.state === 'active') order.push(tr);
    for (const m of act) if (order.indexOf(m) < 0) order.push(m);
    for (const m of order) {
      const d = m.def; let t;
      if (d.guide === undefined && !d.target && !d.marker && !(m.data && (m.data.guide || m.data.marker)) && d.type === 'custom') { const q = BurnsOW.questSpot(g, m); t = q ? [q] : []; }
      else t = BurnsNav.missionTargets(g, m);
      for (const q of t) { if (out.length) q.sec = true; q.mission = m.id; out.push(q); }
    }
    if (g.pickups) for (const P of g.pickups.items) if (!P.taken && !P.spare && P.base === 'token' && Math.hypot(P.x - p.x, P.z - p.z) < 120) out.unshift({ x: P.x, z: P.z, y: P.y0, label: 'BURN TOKEN', col: '#ffd84a' });
    const nx = BurnsOW.nextPlace();
    if (nx) out.push({ x: nx.x, z: nx.z, y: nx.y, label: nx.name.toUpperCase(), col: '#ffd84a', story: true, sec: out.length > 0 });
    return out;
  };

  /* ---------- the map page ---------- */
  D.cityMap = {
    title: 'Black Rock City',
    bounds: { x0: -700, x1: 700, z0: -700, z1: 890 },
    legend: '▲ YOU   ◆ STORY PLACE   ● CAMP   ■ BIG ART',
    draw(g, ctx, P, sc, t) {
      const cx = P(0, 0), arcA = h => h * Math.PI / 6 - Math.PI / 2 + Math.PI;   // clock hour -> canvas angle (6:00 down)
      // the open playa (a lighter disc) and the trash fence
      ctx.fillStyle = 'rgba(255,214,170,0.07)'; ctx.beginPath(); ctx.arc(cx[0], cx[1], O.ESP * sc, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,140,60,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (let k = 0; k <= 5; k++) { const a = k * TAU / 5, q = P(Math.sin(a) * O.FENCE, -Math.cos(a) * O.FENCE); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); ctx.setLineDash([]);
      // the city's blocks as soft tiles between the streets
      for (const b of O.blocks()) {
        if (b.reserved) continue;
        ctx.fillStyle = 'rgba(232,190,150,0.16)'; ctx.beginPath(); ctx.arc(cx[0], cx[1], b.r1 * sc, arcA(b.h0), arcA(b.h1)); ctx.arc(cx[0], cx[1], b.r0 * sc, arcA(b.h1), arcA(b.h0), true); ctx.closePath(); ctx.fill();
      }
      O.RINGS.forEach((r, i) => { ctx.strokeStyle = i ? 'rgba(255,225,190,0.42)' : 'rgba(255,235,200,0.9)'; ctx.lineWidth = i ? 1.2 : 2.6; ctx.beginPath(); ctx.arc(cx[0], cx[1], r * sc, arcA(O.H0), arcA(O.H1)); ctx.stroke(); });
      for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.5) { const a = O.at(h, O.ESP), b = O.at(h, O.OUTER), qa = P(a[0], a[1]), qb = P(b[0], b[1]); ctx.strokeStyle = h % 1 ? 'rgba(255,225,190,0.22)' : 'rgba(255,225,190,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qa[0], qa[1]); ctx.lineTo(qb[0], qb[1]); ctx.stroke(); }
      // clock times round the outside
      if (sc > 0.16) for (const h of [2, 4, 6, 8, 10]) { const q = O.at(h, O.OUTER + 34), s = P(q[0], q[1]); BurnsUI.text(ctx, h + ':00', s[0], s[1], 9, 'rgba(255,230,200,0.75)', { ui: true, sw: 2.5 }); }
      // Gate Road
      { const a = P(0, O.OUTER), b = P(0, O.FENCE_IN + 420); ctx.strokeStyle = 'rgba(255,230,200,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
      // the Man and the Temple
      if (typeof burnsDrawMan2D === 'function') burnsDrawMan2D(ctx, cx[0], cx[1] + 4, clamp(sc * 0.55, 0.08, 0.3), t, true);
      else { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(cx[0], cx[1], 5, 0, TAU); ctx.fill(); }
      const tq = P(0, -250); ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.moveTo(tq[0], tq[1] - 7); ctx.lineTo(tq[0] + 6, tq[1] + 4); ctx.lineTo(tq[0] - 6, tq[1] + 4); ctx.closePath(); ctx.fill();
    },
    labels(g) {
      const L = [], sv = BurnsSave.get(), nx = BurnsOW.nextPlace(), K = typeof BurnsCamps !== 'undefined' ? BurnsCamps.kinds : {};
      L.push({ x: 0, z: 0, text: 'THE MAN', col: '#ffd84a', pri: 90 });
      L.push({ x: 0, z: -250, text: 'TEMPLE', col: '#ffd8a0', pri: 88 });
      const cc = O.address('Center Camp'); L.push({ x: cc[0], z: cc[1], text: 'CENTER CAMP', col: '#ffffff', pri: 86, mark: 'dot' });
      for (const P of O.PLACES) {
        const done = !!sv.worldDone[P.world], next = nx && nx.world === P.world, home = P.world === 17;
        const col = next ? '#ffd84a' : home ? '#7aff5a' : done ? '#ffb0d8' : 'rgba(200,190,210,0.7)';
        L.push({ x: P.x, z: P.z, text: home ? 'HOME' : (next || done) ? P.name.toUpperCase() : '', col, pri: home ? 87 : next ? 89 : done ? 50 : 10, mark: 'diamond' });
      }
      for (const C of O.CAMPS) {
        if (C.kind === 'rootSociety') continue;   // HOME
        const k = K[C.kind], st = O.state && O.state.camps && O.state.camps.find(c => c.kind === C.kind);
        const q = st && st.entrance ? [st.entrance.x, st.entrance.z] : O.at(C.h, C.r || O.ESP + 9 + C.front);
        L.push({ x: q[0], z: q[1], text: k ? String(k.short || k.name).toUpperCase() : '', col: (k && k.mapCol) || '#ff8ad8', pri: C.kind === 'centerCamp' ? 0 : 40, mark: 'dot' });
      }
      for (const A of O.ART) { const q = O.at(A.h, A.r), I = typeof BurnsBigArt !== 'undefined' && BurnsBigArt.info ? BurnsBigArt.info(A.kind) : null; L.push({ x: q[0], z: q[1], text: I ? I.name.replace(/^The /, '').toUpperCase() : '', col: '#9af8ff', pri: 30, mark: 'square' }); }
      const ch = BurnsOW.ebikeCharger && BurnsOW.ebikeCharger(); if (ch && g.missions.state('owEbike') === 'active') L.push({ x: ch.x, z: ch.z, text: 'SOLAR CHARGER', col: BURNS_NAV.hex, pri: 60, mark: 'dot' });
      return L;
    }
  };

  // with the guide arrow on, the guide stands in for the city's own yellow story arrow (one arrow on screen)
  const hud0 = BurnsOW.drawHUD;
  BurnsOW.drawHUD = function (ctx, g, W, H, S) { if (BurnsNav.on('guide')) return; return hud0.call(this, ctx, g, W, H, S); };

  // Volta (Hell Station's door) and the solar charger at the 3:00 plaza
  if (typeof BurnsOW.addQuests === 'function') BurnsOW.addQuests({
    from: 500,
    people: [{ id: 'owVolta', at: (() => { const P = O.PLACES.find(q => q.world === BURNS_OW_EBIKE.giverPlace); return [P.x + Math.sin(P.yaw) * 7 + Math.cos(P.yaw) * 3, P.z + Math.cos(P.yaw) * 7 - Math.sin(P.yaw) * 3]; })(), type: 'dpw', seed: 12, name: 'VOLTA', behavior: 'idle',
      talk(g, a) {
        const st = g.missions.state('owEbike');
        if (st === 'available') g.say(a, ['You. Fuel-line kid. You survived the Foreman, so here.', 'Pulled an e-bike out of the scrap pile. Motor\'s fine. Battery\'s flat as a playa pancake.', 'Charge it at the solar camp on the 3:00 plaza and she\'s yours.'], () => { if (g.missions.start('owEbike')) { g.missions.track('owEbike'); g.pack.add('ebattery'); } });
        else if (st === 'active') g.say(a, ['Solar camp, 3:00 plaza. Plug it in. Go!']);
        else if (st === 'done') g.say(a, ['Ride it like you stole it. You did not steal it. I gifted it. Radically.']);
        else g.say(a, ['Hell Station is through there. Nothing gets charged round here till the fuel flows.']);
      } }],
    build(api, g) {
      const c = charger(), x = c.x, z = c.z;
      api.mesh(x, z, m => {
        m.color('#5a5a62'); for (const sx of [-3, 3]) for (const sz of [-1.6, 1.6]) m.box(sx, 1.3, sz, 0.14, 2.6, 0.14);
        m.color('#1a2a4a').shine(3); m.box(0, 2.66, 0, 7.4, 0.08, 3.8); m.shine(0);
        m.color('#38f2ff', 0.8); for (let k = -3; k <= 3; k++) m.box(k, 2.71, 0, 0.03, 0.02, 3.7); m.emissive(0);
        m.color('#2a2a30'); m.roundBox(0, 0.7, 1.2, 0.8, 1.4, 0.5, 0.06); m.color('#7aff5a', 1); m.box(0, 1.1, 1.46, 0.4, 0.12, 0.02); m.emissive(0);
        return { cols: [{ t: 'box', x: 0, z: 1.2, hx: 0.4, hz: 0.25, y0: 0, y1: 1.4 }] };
      }, { noAO: true });
      api.sign('SOLAR\nJUICE BAR', x, z + 3.4, { yaw: 0, h: 1.2, maxW: 3.2, y: 3.4, style: { bg: '#0a1a2a', fg: '#9af8ff', border: '#38f2ff' } });
      api.light(x, z, 9, '#38f2ff', 0.55);
      api.interact({ x, z: z + 2, r: 3.4, label: 'CHARGE', when: gg => gg.missions.state('owEbike') === 'active', fn: gg => {
        if (gg.pack.has('ebattery')) gg.pack.take('ebattery');
        gg.fx.burst(x, 1.2, z + 1.6, 'spark', 14, '#38f2ff'); burnsSfx('powerup');
        gg.missions.complete('owEbike', { x, y: 1.4, z: z + 2.5 });
      } });
    }
  });
})();
