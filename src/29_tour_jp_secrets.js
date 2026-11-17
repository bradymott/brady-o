/* ============================================================
   Japan's secrets (SECRETS_WARPS_SWITCHES.md §3.5 row R18, §4.3 row B5): the Rigging above Japan 11-4 Neon Tower's
   rooftop, with the Brady Button for Piwi's House Rule 10, NO LATE FLIGHTS (slapping it opens the bonus land The
   Red-Eye: 29_tour_eye*.js, where the rule itself is registered). Built the way Mexico 1-4's Rigging was
   (29_tour_mx_secrets.js): the level is taken as registered and given its extra area and one extra step at the end of
   its climb with Tour.amend, so nothing on the way up moves. No Wormhole here: the design's NEPAL case from this
   level already exists on 11-3's Loading Dock (29_tour_zz_secrets.js).
   The tell, from the rooftop: a red aircraft-warning lamp blinks on its mast at the very top edge of the screen, and
   an air-con unit's steam plume rises off the top; under them, a spring by a yellow CREW ONLY sign. Hold jump on the
   spring: Brady flies off the top of the screen into the Rigging over the tower set.
   ============================================================ */
(function () {
const C = Tour.countries.jp;
if (!C || typeof TourBackstage === 'undefined') return;
const INK = '#160e14';

// the rooftop's tell (Decor: drawn each frame, plain shapes): the aircraft-warning lamp on its mast, reaching up past
// the top of the area (y is the roof); the air-con unit and its plume rising off the top
Object.assign(Decor, {
  jpWarnLamp(ctx, x, y, t) {
    const top = Math.min(48, y - 40), on = Math.sin(t * 3.4) > -0.1;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top - 40); ctx.stroke();
    ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 1.2; for (let yy = y - 12; yy > top - 30; yy -= 18) { ctx.beginPath(); ctx.moveTo(x - 5, yy); ctx.lineTo(x + 5, yy - 9); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (const ly of [top, Math.min(y - 60, top + 120)]) {
      if (on) { ctx.fillStyle = 'rgba(255,40,40,0.28)'; ctx.beginPath(); ctx.arc(x, ly, 16, 0, TAU); ctx.fill(); }
      ctx.fillStyle = on ? '#ff3030' : '#6a1a1a'; ctx.beginPath(); ctx.arc(x, ly, 5, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  },
  jpRoofPlume(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 22, y - 26, 44, 26); ctx.strokeRect(x - 22, y - 26, 44, 26);
    ctx.fillStyle = '#5a6070'; ctx.beginPath(); ctx.arc(x, y - 13, 9, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9aa0aa'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const a = t * 12 + k * 2.1; ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x + Math.cos(a) * 8, y - 13 + Math.sin(a) * 8); ctx.stroke(); }
    ctx.fillStyle = 'rgba(240,244,255,0.55)';
    for (let k = 0; k < 7; k++) { const ph = (t * 0.35 + k / 7) % 1, py = y - 30 - ph * (y + 40), r = 7 + ph * 16; ctx.beginPath(); ctx.arc(x + Math.sin(t + k * 1.7) * 6 * ph, py, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
});

/* ---------- 11-4 Neon Tower: the Rigging above the rooftop ----------
   The climb builds its rooftop (the summit, with the gate) itself, after its last band, so a script step can't reach
   it. Instead the climb gen is wrapped: for an area spec with roofRigging set (only this one), once the climb is
   built, the rooftop gets things that take up no tiles: the spring (a spawn), the tell (decor), the top seam over
   the spring and the anchor the rope drops back down to. Nothing else in the level changes (same tiles, same
   postcards: the rng is not touched). */
const roofRigging = (r, o) => {
  const B = r.B, gate = B.spawns.find(s => s.type === 'gate' && (!s.exit || s.exit === 'main'));
  if (!gate) return;
  const top = Math.round(gate.y / TS), y = top - 1;            // the rooftop's floor row, the row Brady stands in
  B.spawn('spring', 8, y, {}); B.springs.push([8, y]);
  B.decorAt('jpWarnLamp', 7, top, 0);
  B.decorAt('jpRoofPlume', 11, top, 1);
  B.decorAt('bkCrewSign', 5, top, 2);
  TourSeams.add(B, { side: 'top', a: 6, b: 10, to: o.to || 'rigging@in' });
  r.anchors.riggingDrop = B.anchor('riggingDrop', 5, y);
};
{
  const cl0 = TourGens.climb;
  TourGens.climb = (ctx, A) => { const r = cl0(ctx, A); if (A.roofRigging) roofRigging(r, A.roofRigging); return r; };
}
const stamps = {
  jpRigging: {
    floor: 13,
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
      'H..............................................H',
      'H.............................o.o.o............H',
      'H........................u.....................H',
      'H.....................-----------..............H',
      'H..o.o.o.......................................H',
      'H.............m................................H',
      'H....------.........------.........------......H',
      'H...........o.o.o..............................H',
      'H..............................................H',
      'H.......------............------...............H',
      'H..............................................H',
      'H..r..@...k...a.f......m.....q....l.....x...x..H',
      '###..##############bb###########################',
      '###..###########################################',
      '###..###########################################'
    ],
    legend: {
      r: ['decor', 'bkRopeDown'], k: ['decor', 'bkGhostLight'], a: ['decor', 'jpWarnLamp'], f: ['decor', 'bkFlatBack'],
      q: ['decor', 'bkRack'], l: ['decor', 'jpRoofPlume'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}],
      u: ['spawn', 'button', { rule: 10 }]
    }
  }
};
const L4 = C.levels[3];
if (L4 && L4.name === 'Neon Tower' && !L4.areas.some(a => a.id === 'rigging')) {
  const A0 = L4.areas[0];
  const spec = Object.assign({}, L4, {
    n: 4,
    areas: [Object.assign({}, A0, { roofRigging: {} })].concat(L4.areas.slice(1), [
      { id: 'rigging', gen: 'room', role: 'backstage', zone: 'rigging', theme: 'bk_rigging', stamp: 'jpRigging',
        back: { side: 'bottom', span: [3, 4], to: 'biru@riggingDrop', tell: 'rope' } }
    ])
  });
  Tour.amend('jp', { stamps, levels: [spec] });
} else Tour.amend('jp', { stamps });
})();
