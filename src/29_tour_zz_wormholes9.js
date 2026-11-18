/* ============================================================
   Piwi's House Rule 9: NO SHORTCUTS (docs/design/SECRETS_WARPS_SWITCHES.md §3.5 D1-D6, §4.3 row B3).
   - The Brady Button: Morocco 5-1 Souk Labyrinth, in Piwi's Evidence Locker, a new dead-end storeroom off the basket
     weavers' hall (a plain plank door with a brass tube running up out of its frame and Piwi's purple seal, on the
     far side of the hole down to the cumin cellar). The maze's route, its doors and its puzzle are unchanged: the
     storeroom is one more door in one cell, and it leads nowhere but back.
   - What it changes: the six DORMANT WORMHOLES wake up. Each leads backwards to a secret level of an earlier land
     (nobody can skip ahead with them). Until the rule is revoked each is padlocked, with a tag "HELD BY ORDER OF PIWI
     SQUIRMIN' — RULE 9" (needs: 'rule:9' on the exit and the spawn, so the validator only asks for them with the
     rules on). They are added the way the shipped Loading Docks were (after a level's last step, so nothing in the
     level moves):
       D1 4-2 Dune Stampede     Loading Dock          -> 1-6 Pit of Swallows    (MEXICO)
       D2 6-1 La Tomatina       Loading Dock          -> 2-6 Galápagos Snorkel  (ECUADOR)
       D3 7-3 Mont-Saint-Michel Loading Dock past the causeway's gate -> 7-7 (BALLOONS, in the land)
       D4 9-3 Batur Eruption    Loading Dock          -> 4-6 Buried Dhow        (MOZAMBIQUE)
       D5 10-2 Ha Long Junk     the crew door on the landing past the gate (the ride scrolls, so no seam: a
                                stage door into a Loading Dock room) -> 5-6 Carpet Skies (MOROCCO)
       D6 12-2 Yak Caravan Pass the Wings, left of the start (12-2 already has a Loading Dock with the Wormhole to
                                Antarctica) -> 11-7 Fuji Thermals (JAPAN)
     Bali (9) and Vietnam (10) had no Wormhole: D4 and D5 are theirs.
   - Express trails: on the map of every land whose boss is beaten, a brass rail line straight from the airstrip to
     the port, walkable both ways (TourGraph.edges is wrapped; the map files are untouched).
   Where everything is, for Brady: docs/design/BACKSTAGE_STATUS.md.
   ============================================================ */
(function () {
if (typeof TOUR_RULES === 'undefined' || typeof TourBackstage === 'undefined' || typeof TourRules === 'undefined') return;
const NEED = 'rule:9', INK = '#160e14';
TOUR_RULES[9] = { title: 'NO SHORTCUTS', sign: 'THE OLD WORMHOLES ARE OPEN AGAIN!', opens: [], fx: null };
const F6 = '6px ' + FONT_DISPLAY, F7 = '7px ' + FONT_DISPLAY, F8 = '8px ' + FONT_DISPLAY, F9 = '9px ' + FONT_DISPLAY;

/* ---------- a dormant Wormhole wears Piwi's tag ---------- */
{
  const W = ENTITY_TYPES.warp, dr0 = W.prototype.draw;
  W.prototype.draw = function (ctx) {
    dr0.call(this, ctx);
    if (!this.locked) return;
    // a manila luggage tag on a string from the padlock: HELD BY ORDER OF PIWI SQUIRMIN' — RULE n
    const x = this.cx, y = this.y + this.h - 22, sw = Math.sin(this.t * 1.7) * 0.06;
    if (this._tagN == null) { const m = /rule:(\d+)/.exec([].concat(this.s.needs).join(' ')); this._tagN = 'RULE ' + (m ? m[1] : '?'); }
    ctx.save(); ctx.translate(x, y - 16); ctx.rotate(sw);
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 6); ctx.stroke();
    ctx.fillStyle = '#e8c890'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-30, 10); ctx.lineTo(-24, 6); ctx.lineTo(30, 6); ctx.lineTo(30, 34); ctx.lineTo(-24, 34); ctx.lineTo(-30, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-24, 20, 2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a1a2a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = F6; ctx.fillText('HELD BY ORDER', 3, 12, 52); ctx.fillText('OF PIWI SQUIRMIN\'', 3, 19, 52);
    ctx.fillStyle = '#c0203a'; ctx.font = F8; ctx.fillText(this._tagN, 3, 28, 52);
    ctx.restore();
  };
}

/* ---------- the dormant docks ---------- */
const STENCIL = { look: 'r9CrewDoor' };
// a dock room for a dormant Wormhole: the shipped dock layouts, the Wormhole padlocked until rule 9
// two layouts (the Wormhole in the middle of the room, clear of the phone's buttons; coins low enough to stay clear
// of the HUD); the left edge goes back out, or a stage door does (door: true)
const DORMANT_ROOMS = [
  ['HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
   'H..................................H',
   'H..................................H',
   'H..................................H',
   'H..................................H',
   'H.............o.o.o................H',
   'H............-------...............H',
   'H..................................H',
   'H......................-----.......H',
   'e.......xxx........................H',
   'e.......xxx.......m................H',
   'e.@..n..xxx....w.....N.......k.....H',
   '####################################',
   '####################################'],
  ['HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
   'H..................................H',
   'H..................................H',
   'H..................................H',
   'H..................................H',
   'H....................o.o.o.........H',
   'H...................-----..........H',
   'H..................................H',
   'H.........----.....................H',
   'e......xx..........................H',
   'e......xx.........m................H',
   'e.@..n.xx.......w......N...k.......H',
   '####################################',
   '####################################']
];
const dockRoom = (back, variant, key, door) => {
  const rows = DORMANT_ROOMS[(variant || 0) % DORMANT_ROOMS.length].slice();
  const S = { floor: 12, rows, legend: { e: ['seam', 'left', back], x: ['tile', 'HARD'], n: ['decor', 'bkCrewSign'], k: ['decor', 'bkCart'], m: ['spawn', 'bkMouse', {}],
    w: ['spawn', 'warp', { exit: key, needs: NEED }], N: ['decor', 'r9Notice'] } };
  if (door) {
    // reached by a stage door (no seam): the left edge is wall, a door stands by the way in
    for (let y = 9; y <= 11; y++) rows[y] = 'H' + rows[y].slice(1);
    rows[11] = rows[11].slice(0, 3) + 'D' + rows[11].slice(4);
    S.doors = [{ to: back, look: STENCIL.look }];
    delete S.legend.e;
  }
  return S;
};
const addExit = (L, o) => {
  const key = L.exits.warp ? 'warp2' : 'warp';
  const exits = Object.assign({}, L.exits); exits[key] = { to: o.to, via: 'warp', label: o.label, needs: NEED, hint: o.hint };
  return { key, exits };
};
// D1, D2, D3, D4: a Loading Dock after the last step of area `aid` (strip-like, with the main gate)
const dormantDock = (cc, n, aid, o) => {
  const C = Tour.countries[cc], L = C && C.levels[n - 1];
  if (!L || !L.areas || L.areas.some(a => a.id === o.room)) return false;
  const k = L.areas.findIndex(a => a.id === aid), A = L.areas[k];
  if (!A || !A.script) { Tour.problems.push(`${C.world}-${n}: rule 9 dock needs area ${aid} with a script`); return false; }
  const { key, exits } = addExit(L, o);
  const areas = L.areas.slice();
  areas[k] = Object.assign({}, A, { script: A.script.concat([['loadingDock', { to: o.room + '@in', back: 'r9Back' }]]) });
  areas.push({ id: o.room, gen: 'room', role: 'backstage', zone: 'dock', theme: 'bk_dock', stamp: dockRoom(aid + '@r9Back', o.variant, key) });
  Tour.amend(cc, { levels: [Object.assign({}, L, { n, exits, areas })] });
  return true;
};
dormantDock('mz', 2, 'dunas', { room: 'dock', to: '1-6', label: 'MEXICO', variant: 0, hint: 'Flight cases stacked by the finish, CREW ONLY over it...' });
dormantDock('es', 1, 'bunol', { room: 'dock', to: '2-6', label: 'ECUADOR', variant: 1, hint: 'Flight cases stacked by the finish, CREW ONLY over it...' });
dormantDock('fr', 3, 'chaussee', { room: 'dock', to: '7-7', label: 'BALLOONS', variant: 0, hint: 'Flight cases stacked by the causeway gate, CREW ONLY over it...' });
dormantDock('id', 3, 'gunung', { room: 'dock', to: '4-6', label: 'MOZAMBIQUE', variant: 1, hint: 'Flight cases stacked by the finish, CREW ONLY over it...' });

/* D5 10-2: the junk's ride scrolls, so its area can have no seam. On the landing at the end: the same tell as every
   dock (a stack of flight cases before the gate, a truss over it, a CREW ONLY arrow), and beyond the gate a crew door
   into the dock room. Added by wrapping the ride gen for that one area, after it is built: the tiles of the ride
   itself and its postcards are as before. */
{
  const rd0 = TourGens.ride;
  TourGens.ride = (ctx, A) => {
    const r = rd0(ctx, A);
    if (!A.r9Crew) return r;
    const B = r.B, g = B.spawns.find(s => s.type === 'gate' && (!s.exit || s.exit === 'main'));
    if (!g) { ctx.problems.push('r9Crew: no gate on the landing'); return r; }
    const gx = Math.floor(g.x / TS), gy = Math.round(g.y / TS);
    B.fill(gx - 6, gy - 3, gx - 5, gy - 1, T.HARD);                 // the flight cases (climb them)
    for (let x = gx - 4; x <= gx + 3; x++) B.set(x, gy - 6, T.SEMI);  // the truss over the gate
    B.decorAt('bkCase', gx - 9, gy, 3); B.decorAt('bkCrewArrow', gx - 7, gy, 0);
    B.spawn('portal', gx + 6, gy - 1, { kind: 'door', look: STENCIL.look, targetRef: A.r9Crew + '@in' });
    r.anchors.r9Back = B.anchor('r9Back', gx + 5, gy - 1);
    return r;
  };
}
{
  const C = Tour.countries.vn, L = C && C.levels[1];
  if (L && L.name === 'Ha Long Junk' && !L.areas.some(a => a.id === 'dock')) {
    const { key, exits } = addExit(L, { to: '5-6', label: 'MOROCCO', hint: 'Flight cases stacked by the landing\'s gate, CREW ONLY over it...' });
    const areas = L.areas.slice(); areas[0] = Object.assign({}, areas[0], { r9Crew: 'dock' });
    areas.push({ id: 'dock', gen: 'room', role: 'backstage', zone: 'dock', theme: 'bk_dock', stamp: dockRoom(areas[0].id + '@r9Back', 1, key, true) });
    Tour.amend('vn', { levels: [Object.assign({}, L, { n: 2, exits, areas })] });
  }
}

/* D6 12-2: the Wings, left of the start. The strip gen is wrapped for that one area: once built, the start's left
   edge opens (it is already open air), a stirring curtain flap and a stagehand mouse heading left are the tell, a
   left seam leads to the wings, and the way back lands just right of it. Nothing else in the level changes. */
{
  const s0 = TourGens.strip;
  TourGens.strip = (ctx, A) => {
    const r = s0(ctx, A);
    if (!A.r9Wings) return r;
    const B = r.B, st = r.anchors.start || r.anchors.in; if (!st) return r;
    const gy = Math.round(st.y / TS);
    for (let y = gy - 3; y < gy; y++) B.set(0, y, T.EMPTY);
    B.decorAt('bkCurtainFlap', 0, gy, 0);
    B.spawn('bkMouse', 3, gy - 1, { dir: -1, prop: 1 });
    TourSeams.add(B, { side: 'left', a: gy - 3, b: gy - 1, to: A.r9Wings + '@in' });
    r.anchors.r9WingsBack = B.anchor('r9WingsBack', 2, gy - 1);
    return r;
  };
}
const wingsStamp = (back, key) => ({
  floor: 12,
  rows: [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'H..................................H',
    'H..................................H',
    'H..................................H',
    'H..................................H',
    'H.........o.o.o....................H',
    'H........-----.....................H',
    'H...h..............................H',
    'H.................-----............H',
    'H..........................----....e',
    'H..................................e',
    'H..k..r..w..N.....x....m...q...@...e',
    '####################################',
    '####################################'
  ],
  hidden: ['oneup'],
  legend: { e: ['seam', 'right', back], k: ['decor', 'bkGhostLight'], r: ['decor', 'bkRack'], x: ['decor', 'bkCase'], q: ['decor', 'bkFlatBack'],
    N: ['decor', 'r9Notice'], m: ['spawn', 'bkMouse', {}], w: ['spawn', 'warp', { exit: key, needs: NEED }] }
});
{
  const C = Tour.countries.np, L = C && C.levels[1];
  if (L && L.name === 'Yak Caravan Pass' && !L.areas.some(a => a.id === 'wings')) {
    const { key, exits } = addExit(L, { to: '11-7', label: 'JAPAN', hint: 'A curtain stirs at the very start, and a mouse runs off left...' });
    const areas = L.areas.slice(); areas[0] = Object.assign({}, areas[0], { r9Wings: 'wings' });
    areas.push({ id: 'wings', gen: 'room', role: 'backstage', zone: 'wings', theme: 'bk_wings', stamp: wingsStamp(areas[0].id + '@r9WingsBack', key) });
    Tour.amend('np', { levels: [Object.assign({}, L, { n: 2, exits, areas })] });
  }
}

/* ---------- the looks: the crew door, the FREIGHT SUSPENDED notice ---------- */
Object.assign(Decor, {
  // a notice board on a stand by a dormant Wormhole; once rule 9 is revoked a REVOKED sticker is slapped across it
  r9Notice(ctx, x, y, t) {
    const on = TourRules.isRevoked(9);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 9, y - 34); ctx.moveTo(x + 12, y); ctx.lineTo(x + 9, y - 34); ctx.stroke();
    ctx.fillStyle = '#f2ead6'; rr(ctx, x - 30, y - 62, 60, 32, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a1a2a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = F7; ctx.fillText('FREIGHT', x, y - 55); ctx.fillText('SUSPENDED', x, y - 47, 56);
    ctx.fillStyle = '#7a4a9a'; ctx.font = F6; ctx.fillText('— RULE 9 —', x, y - 38, 56);
    if (on) { ctx.save(); ctx.translate(x, y - 46); ctx.rotate(-0.18); ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 2; rr(ctx, -27, -8, 54, 16, 2); ctx.stroke(); ctx.fillStyle = '#d0203a'; ctx.font = F9; ctx.fillText('REVOKED', 0, 1); ctx.restore(); }
    ctx.restore();
  }
});
TOUR_SKINS.r9CrewDoor = (ctx, e, t) => {
  // a black-painted stage door in a steel frame: a little round window, a push bar, a stencilled CREW ONLY
  const x = e.cx, y = e.y + e.h;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#5a5e68'; ctx.fillRect(x - 17, y - 54, 34, 54); ctx.strokeRect(x - 17, y - 54, 34, 54);
  ctx.fillStyle = '#26222c'; ctx.fillRect(x - 13, y - 50, 26, 50); ctx.strokeRect(x - 13, y - 50, 26, 50);
  ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x, y - 38, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 11, y - 24, 22, 3);
  ctx.fillStyle = '#f2d23a'; ctx.font = F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CREW', x, y - 14); ctx.fillText('ONLY', x, y - 8);
  ctx.restore();
};

/* ================= the Brady Button: Piwi's Evidence Locker off 5-1's souk ================= */
// the basket weavers' cell gets one more door, on the floor right of the hole to the cumin cellar (its own cell
// stamp, a copy with one door, an anchor and the tell added: everything else in the cell is the same)
Object.assign(BGPaint, {
  // the locker's back wall: plain lime plaster, tall plank shelves of things Piwi confiscated, each with a tag
  r9Locker(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.12); for (let y = 0; y < H; y += 26) for (let x = (y / 26 % 2) * 30; x < BG_W; x += 60) ctx.fillRect(x, y, 58, 2);
    const things = [
      (c, x, y) => { c.fillStyle = '#ff5fa0'; rr(c, x - 14, y - 22, 28, 18, 5); c.fill(); c.fillStyle = '#ffd84a'; c.fillRect(x - 14, y - 16, 28, 4); c.fillStyle = '#7ac8ff'; c.fillRect(x - 14, y - 10, 28, 3); },   // a piñata
      (c, x, y) => { c.fillStyle = '#3ac8d8'; c.beginPath(); c.moveTo(x, y - 34); c.lineTo(x + 12, y - 18); c.lineTo(x, y - 4); c.lineTo(x - 12, y - 18); c.closePath(); c.fill(); c.strokeStyle = '#ffd84a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 4); c.quadraticCurveTo(x + 8, y, x + 4, y + 2); c.stroke(); },   // a kite
      (c, x, y) => { c.fillStyle = '#f2c84a'; c.beginPath(); c.arc(x, y - 12, 12, 0, TAU); c.fill(); c.fillStyle = '#d8a83a'; c.beginPath(); c.arc(x + 4, y - 15, 3, 0, TAU); c.arc(x - 5, y - 9, 2, 0, TAU); c.fill(); },   // a cheese wheel
      (c, x, y) => { c.fillStyle = '#d8402a'; c.beginPath(); c.ellipse(x - 6, y - 16, 6, 9, -0.3, 0, TAU); c.fill(); c.fillStyle = '#3aa86a'; c.beginPath(); c.ellipse(x + 6, y - 16, 6, 9, 0.3, 0, TAU); c.fill(); c.fillStyle = '#8a5a2a'; c.fillRect(x - 7, y - 8, 3, 8); c.fillRect(x + 5, y - 8, 3, 8); },   // maracas
      (c, x, y) => { c.fillStyle = '#c8783a'; rr(c, x - 12, y - 20, 24, 20, 3); c.fill(); c.fillStyle = '#f4e8d0'; c.beginPath(); c.ellipse(x, y - 20, 12, 4, 0, 0, TAU); c.fill(); },   // a drum
      (c, x, y) => { c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x, y - 26); c.lineTo(x + 10, y); c.closePath(); c.fill(); c.fillStyle = '#ff5fa0'; c.beginPath(); c.arc(x, y - 26, 3, 0, TAU); c.fill(); }   // a party hat
    ];
    for (let x = 30; x < BG_W; x += 150) {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, 70, 6, H - 70); ctx.fillRect(x + 124, 70, 6, H - 70);
      for (let sy = 140; sy < H; sy += 90) {
        ctx.fillStyle = '#8a6440'; ctx.fillRect(x, sy, 130, 7);
        for (let k = 0; k < 3; k++) {
          const ix = x + 24 + k * 42; things[Math.floor(rng() * things.length)](ctx, ix, sy);
          ctx.fillStyle = '#e8c890'; ctx.fillRect(ix + 8, sy - 12, 12, 7); ctx.fillStyle = '#5a1a2a'; ctx.fillRect(ix + 10, sy - 10, 8, 1); ctx.fillRect(ix + 10, sy - 8, 6, 1);
        }
      }
    }
    ctx.fillStyle = 'rgba(90,26,42,0.35)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    for (let x = 105, k = 0; x < BG_W; x += 300, k++) ctx.fillText(k % 2 ? 'CONFISCATED' : 'NO REFUNDS', x, 50);
  }
});
THEMES.r9_locker = Object.assign({}, THEMES.bk_under, {
  name: 'Piwi\'s Evidence Locker', darkness: 0.12, particles: 'dust', fog: '#ffd8a0', horizonGlow: '#ffd8a0',
  sky: ['#2a1c16', '#3a281e', '#4a3426'], layers: [{ kind: 'r9Locker', color: '#b89a72', base: 0, f: 0.08 }]
});
Object.assign(Decor, {
  // a chicken-wire cage of confiscated party things, padlocked, with a CONFISCATED stencil
  r9Cage(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#ff5fa0'; rr(ctx, x - 20, y - 30, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#7ac8ff'; ctx.beginPath(); ctx.arc(x + 12, y - 14, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 14); ctx.lineTo(x + 2, y - 40); ctx.lineTo(x + 8, y - 14); ctx.fill();
    ctx.strokeStyle = 'rgba(200,204,212,0.9)'; ctx.lineWidth = 1;
    for (let q = -30; q <= 30; q += 6) { ctx.beginPath(); ctx.moveTo(x + q, y); ctx.lineTo(x + q, y - 48); ctx.stroke(); }
    for (let q = 0; q <= 48; q += 8) { ctx.beginPath(); ctx.moveTo(x - 30, y - q); ctx.lineTo(x + 30, y - q); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - 30, y - 48, 60, 48);
    ctx.fillStyle = '#d8a83a'; rr(ctx, x - 5, y - 26, 10, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2ead6'; ctx.fillRect(x - 28, y - 62, 56, 12); ctx.strokeRect(x - 28, y - 62, 56, 12);
    ctx.fillStyle = '#5a1a2a'; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CONFISCATED', x, y - 55.5, 52);
    ctx.restore();
  },
  // a stack of crates marked with Piwi's seal
  r9Crates(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (const [dx, dy, w, h] of R9_CRATES) {
      ctx.fillStyle = '#b88e54'; ctx.fillRect(x + dx, y - dy - h, w, h); ctx.strokeRect(x + dx, y - dy - h, w, h);
      ctx.fillStyle = '#7a2ac8'; ctx.beginPath(); ctx.arc(x + dx + w / 2, y - dy - h / 2, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', x + dx + w / 2, y - dy - h / 2 + 0.5);
    }
    ctx.restore();
  }
});
const R9_CRATES = [[-24, 0, 26, 22], [2, 0, 24, 18], [-14, 22, 24, 18]], RAIL_OFF = [-3.2, 3.2];
// the storeroom's door in the souk: a plain plank door, a brass pneumatic tube running up out of its frame into the
// ceiling (the same tube every Brady Button has), Piwi's purple wax seal; the plaque shows a padlock
TOUR_SKINS.r9LockerDoor = (ctx, e, t) => {
  const x = e.cx, y = e.y + e.h;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  // the tube, up past the top of the view, with a little puff now and then
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 13, y - 48); ctx.lineTo(x + 13, y - 400); ctx.stroke();
  ctx.strokeStyle = '#c8b07a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 12, y - 48); ctx.lineTo(x + 12, y - 400); ctx.stroke();
  const ph = (t * 0.5) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - ph)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x + 13, y - 60 - ph * 80, 3 + ph * 4, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#7a5434'; rr(ctx, x - 15, y - 50, 30, 50, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a4628'; for (let q = -11; q < 13; q += 8) ctx.fillRect(x + q, y - 48, 2, 46);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 15, y - 36, 30, 3); ctx.fillRect(x - 15, y - 16, 30, 3);
  // the plank nailed across: KEEP OUT, and the purple wax seal with Piwi's P
  ctx.save(); ctx.translate(x, y - 27); ctx.rotate(-0.12); ctx.fillStyle = '#d8b880'; ctx.fillRect(-19, -5, 38, 10); ctx.strokeRect(-19, -5, 38, 10);
  ctx.fillStyle = '#5a1a2a'; ctx.font = F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KEEP OUT', 0, 0.5); ctx.restore();
  ctx.fillStyle = '#7a2ac8'; ctx.beginPath(); ctx.arc(x - 6, y - 10, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', x - 6, y - 9.5);
  // the plaque over the door: a padlock (it is a storeroom: it only leads into itself)
  const py = y - 84 + Math.sin(t * 1.4 + x) * 0.8;
  ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 8, py - 10); ctx.lineTo(x - 4, py + 14); ctx.moveTo(x + 8, py - 10); ctx.lineTo(x + 4, py + 14); ctx.stroke();
  ctx.fillStyle = '#f4e8d0'; rr(ctx, x - 13, py - 10, 26, 21, 4); ctx.fill(); ctx.strokeStyle = '#2a1820'; ctx.lineWidth = 2; rr(ctx, x - 13, py - 10, 26, 21, 4); ctx.stroke();
  ctx.fillStyle = '#7a2ac8'; rr(ctx, x - 6, py - 2, 12, 9, 2); ctx.fill(); ctx.strokeStyle = '#7a2ac8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, py - 3, 4, Math.PI, 0); ctx.stroke();
  ctx.restore();
};
TOUR_SKINS.r9LockerBack = (ctx, e, t) => {
  const x = e.cx, y = e.y + e.h;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#7a5434'; rr(ctx, x - 15, y - 50, 30, 50, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe8a0'; ctx.fillRect(x - 11, y - 46, 22, 3); ctx.fillStyle = '#d8a83a'; ctx.beginPath(); ctx.arc(x + 9, y - 24, 2.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f2ead6'; ctx.font = F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SOUK', x, y - 34); ctx.fillText('→', x, y - 27);
  ctx.restore();
};
const lockerStamp = {
  floor: 12,
  rows: [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'H..................................H',
    'H..................................H',
    'H..................................H',
    'H..................................H',
    'H..........o.o.o...................H',
    'H.........-----....................H',
    'H..................................H',
    'H.................-----............H',
    'H..................................H',
    'H..................................H',
    'H.@D..i..k......m.....u....q...x...H',
    '####################################',
    '####################################'
  ],
  doors: [{ to: 'souk@lockerBack', look: 'r9LockerBack' }],
  legend: {
    i: ['spawn', 'sign', { text: 'PIWI SQUIRMIN\'S EVIDENCE LOCKER. CONFISCATED FUN: NO REFUNDS. AND NO SHORTCUTS, EVER. — PIWI' }],
    k: ['decor', 'bkGhostLight'], q: ['decor', 'r9Cage'], x: ['decor', 'r9Crates'], m: ['spawn', 'bkMouse', {}], u: ['spawn', 'button', { rule: 9 }]
  }
};
{
  const C = Tour.countries.ma, L = C && C.levels[0], A0 = L && L.areas[0];
  const rows = A0 && A0.script && A0.script[1], base = rows && rows[0];
  if (L && L.name === 'Souk Labyrinth' && base && base.rows && !L.areas.some(a => a.id === 'locker')) {
    // the weavers' floor row: '#..D1.......A...x........#' -> a door at 23 (right of the hole), its anchor at 24
    const r11 = base.rows[11];
    const cellRows = base.rows.slice(); cellRows[11] = r11.slice(0, 23) + 'D9' + r11.slice(25);
    const cell = Object.assign({}, base, { rows: cellRows, doors: (base.doors || []).concat([{ to: 'locker@in', look: 'r9LockerDoor' }]),
      legend: Object.assign({}, base.legend, { 9: ['anchor', 'lockerBack'] }) });
    const script = A0.script.map(r => r.slice()); script[1][0] = cell;
    const spec = Object.assign({}, L, { n: 1,
      areas: [Object.assign({}, A0, { script })].concat(L.areas.slice(1), [
        { id: 'locker', gen: 'room', role: 'backstage', zone: 'wings', theme: 'r9_locker', stamp: lockerStamp }
      ]) });
    Tour.amend('ma', { levels: [spec] });
  }
}

/* ================= express trails (rule 9): every land whose boss is beaten ================= */
const TourExpress = {
  on(C) { return TourRules.isRevoked(9) && !!C && !C.bonus && TourProgress.bossDone(C); },
  // a brass rail: two rails and wooden sleepers along the trail's curve (P from TourOW.curve; no allocation)
  draw(ctx, P, t) {
    if (!P || !P.pts || P.pts.length < 2) return;
    const pts = P.pts, n = pts.length;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2.4;
    for (let i = 0; i < n - 1; i += 3) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 5, ny = dx / L * 5;
      ctx.beginPath(); ctx.moveTo(a[0] - nx, a[1] - ny); ctx.lineTo(a[0] + nx, a[1] + ny); ctx.stroke();
    }
    for (const off of RAIL_OFF) {
      ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, px = pts[i][0] - dy / L * off, py = pts[i][1] + dx / L * off; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke(); ctx.strokeStyle = '#f0c25a'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // a glint running along the rails
    const k = Math.floor((t * 24) % n), p = pts[k];
    ctx.fillStyle = 'rgba(255,248,200,0.9)'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
{
  const ed0 = TourGraph.edges;
  TourGraph.edges = function (C, nodes) {
    const out = ed0.call(this, C, nodes);
    if (!TourExpress.on(C)) return out;
    let s = null, p = null; for (const n of nodes) { if (n.key === 'start') s = n; else if (n.key === 'port') p = n; }
    if (!s || !p || out.some(e => (e.a === 'start' && e.b === 'port') || (e.a === 'port' && e.b === 'start'))) return out;
    out.push({ key: 'start>port', a: 'start', b: 'port', kind: 'express', gold: false, express: true, open: true, pending: false, fresh: false, visible: s.visible && p.visible });
    return out;
  };
}
TourHooks.on('owDraw', (ow, ctx) => {
  if (!ow.edges || !TourRules.isRevoked(9)) return;
  for (const e of ow.edges) {
    if (!e.express || !e.visible) continue;
    if (!e._P) e._P = TourOW.curve(ow.G, e);
    TourExpress.draw(ctx, e._P, ow.t);
  }
});
// the first time a land's map shows its express trail: a toast (once per land, Save.data.tour.express)
{
  const OW = TourOverworld.prototype, up0 = OW.update;
  OW.update = function (dt, inp) {
    if (!this._r9Told && this.edges && !this.menu && !this.reveal && !this.clears && TourRules.isRevoked(9) && this.edges.some(e => e.express)) {
      this._r9Told = true;
      const T = TourProgress.data(); T.express = T.express || {};
      if (!T.express[this.cc]) { T.express[this.cc] = true; Save.save(); if (this.scene && this.scene.toast) this.scene.toast('EXPRESS TRAIL: AIRSTRIP ⇄ PORT!'); }
    }
    return up0.call(this, dt, inp);
  };
}

/* ---------- the REVOKED card says what woke up ---------- */
if (typeof TourRuleCut !== 'undefined') {
  const dr0 = TourRuleCut.draw;
  TourRuleCut.draw = function (ctx, play, F) {
    dr0.call(this, ctx, play, F);
    if (F.rule !== 9 || F.t < 1.6 || F.t > 5) return;
    const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH, k = clamp((F.t - 1.6) / 0.3, 0, 1) * clamp((5 - F.t) / 0.3, 0, 1);
    ctx.save(); ctx.globalAlpha = k;
    const w = Math.min(W - 30, 400), x0 = (W - w) / 2, y0 = Math.min(H - 64, H / 2 + 104);
    ctx.fillStyle = '#7a3ac8'; ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 2.5; rr(ctx, x0, y0, w, 34, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('6 WORMHOLES UNLOCKED · EXPRESS TRAILS ON BEATEN LANDS', W / 2, y0 + 17, w - 20);
    ctx.restore();
  };
}

try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourExpress = TourExpress; } } catch (e) { /* not in a browser */ }
})();
