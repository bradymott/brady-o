/* ============================================================
   Mexico's secrets (SECRETS_WARPS_SWITCHES.md WP-6, the worked example): the backstage areas, Wormholes and the
   Brady Button in Mexico's levels. Kept out of 29_tour_mx_levels.js (other agents edit it): each level here is
   taken as it was registered and given its extra areas, exits and pieces with Tour.amend.
   Where each secret is and how to find it: docs/design/BACKSTAGE_STATUS.md.
   ============================================================ */
(function () {
const C = Tour.countries.mx;
if (!C) return;

/* ---------- 1-4 Volcán Escape: the Rigging above the crater rim ----------
   The tell: on the rim, by the gate, a sandbag on a rope dangles down from above the top of the screen over a spring,
   with a CREW ONLY sign. Hold jump on the spring: Brady flies off the top of the screen into the Rigging over the
   volcano set: catwalks, the fly gallery, Piwi's stagehand mice, a ghost light. The rope through the hole in the deck
   is the way back down onto the rim; the Wormhole at the far end goes to Ecuador's Devil's Cauldron (2-7). */
Tour.pieces['mx.rimRigging'] = function (st, o) {
  const B = st.B, y = st.y + 1;   // the rim's floor row (craterRim leaves the cursor one row above it)
  B.spawn('spring', 2, y - 1, {}); B.springs.push([2, y - 1]);
  B.decorAt('bkDangle', 2, y, 0);
  B.decorAt('bkCrewSign', 6, y, 1);
  TourSeams.add(B, { side: 'top', a: 1, b: 4, to: o.to || 'rigging@in' });
  B.anchor('riggingDrop', 8, y - 1);
};
const stamps = {
  mxRigging: {
    floor: 13,
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
      'H..............................................H',
      'H..................o.o.o.o.o.o.................H',
      'H.........................m....................H',
      'H................-----------------.............H',
      'H............o.o.o.......................o.o.o.H',
      'H..............................................H',
      'H...........------..........----........------.H',
      'H........o.o.o...........oooo..................H',
      'H..............................................H',
      'H.......------..........-----.....-----........H',
      'H..............................................H',
      'H..r..@...k...n.f.......m...q........x...w...x.H',
      '###..##############bb###########################',
      '###..###########################################',
      '###..###########################################'
    ],
    legend: {
      r: ['decor', 'bkRopeDown'], k: ['decor', 'bkGhostLight'], n: ['decor', 'bkCrewSign'], f: ['decor', 'bkFlatBack'],
      q: ['decor', 'bkRack'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}], w: ['spawn', 'warp', { exit: 'warp' }]
    }
  }
};
const L4 = C.levels[3];
if (L4 && L4.name === 'Volcán Escape' && !L4.areas.some(a => a.id === 'rigging')) {
  const A0 = L4.areas[0];
  const spec = Object.assign({}, L4, {
    n: 4,
    exits: Object.assign({}, L4.exits, { warp: { to: '2-7', via: 'warp', label: 'ECUADOR', hint: 'A sandbag dangles over a spring on the crater rim...' } }),
    areas: [Object.assign({}, A0, { script: A0.script.concat([['rimRigging', {}]]) })].concat(L4.areas.slice(1), [
      { id: 'rigging', gen: 'room', role: 'backstage', zone: 'rigging', theme: 'bk_rigging', stamp: 'mxRigging',
        back: { side: 'bottom', span: [3, 4], to: 'crater@riggingDrop', tell: 'rope' } }
    ])
  });
  Tour.amend('mx', { stamps, levels: [spec] });
} else Tour.amend('mx', { stamps });
})();
