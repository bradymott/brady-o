/* ============================================================
   The Netherlands' secret under 8-3 Bike Lane Rush (SECRETS_WARPS_SWITCHES.md §3.5 R14, §4.3 B4): the drowned-bike
   graveyard, an Under-Stage below one canal gap, with Piwi's Brady Button for HOUSE RULE 12: NO RETURNS (it opens
   the bonus land Lost & Found, 29_tour_lost*.js). Kept out of 29_tour_nl_levels.js: the level is taken as it was
   registered and given one extra piece at the end of its script (nothing earlier in the level moves) and one extra
   area. The Loading Dock with the Wormhole to Vietnam (29_tour_zz_secrets.js) is added after this and is unchanged.
   The tell, from the main route: the second little canal you hop (just past the checkpoint) is not like the
   others: its water is a murky green with bubbles rising, a bike-fishing hook dangles into it on a line from above,
   and a bicycle wheel pokes out. Drop into it: no splash of death, Brady sinks into the trap room under the canal.
   The way back: the steps up out of the graveyard come out on the towpath just past that canal.
   ============================================================ */
(function () {
const C = Tour.countries.nl;
if (!C || typeof TOUR_RULES === 'undefined') return;

// Piwi's House Rule 12 (registered here, beside its button): revoking it opens Lost & Found. Its effect on every
// land (the lost suitcase by each airstrip, the RETURNED shelf at the Souvenir Stands) is in 29_tour_lost.js.
TOUR_RULES[12] = { title: 'NO RETURNS', sign: 'LOST THINGS MAY GO HOME! (OR HOME WITH YOU)', opens: ['land:lost'], fx: null };

const INK = '#16121a';
/* ---------- the tell: murky water in the one safe canal gap, a bike-fishing hook on a line, a wheel poking out ----
   spawn { type: 'nlBikeHook', w: tiles, surf: row of the water surface (tile), tell: true } over the seam pit */
class NlBikeHook extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 4) * TS, TS); this.x = s.x - TS / 2; this.surf = (s.surf != null ? s.surf : Math.floor(s.y / TS)) * TS; this.y = this.surf - TS;
    this.n = s.w || 4;
  }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x0 = this.x, w = this.w, sy = this.surf + 6, t = this.t, A = this.g.area, depth = A ? A.H * TS - sy : 200;
    ctx.save();
    // the murky water (green-brown, not the canal's blue): it fills the gap to the bottom
    ctx.fillStyle = '#2e4a32'; ctx.fillRect(x0, sy, w, depth);
    ctx.fillStyle = '#3e6a40'; ctx.beginPath(); ctx.moveTo(x0, sy);
    for (let q = 0; q <= w; q += 8) ctx.lineTo(x0 + q, sy + Math.sin(t * 2 + q * 0.2) * 2);
    ctx.lineTo(x0 + w, sy + 10); ctx.lineTo(x0, sy + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,140,0.35)'; ctx.fillRect(x0, sy - 1, w, 2);
    // a bicycle wheel poking out of the water, and the line with its hook dangling into the gap from above
    const wx = x0 + w * 0.7;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(wx, sy + 8, 13, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.strokeStyle = '#8a8e98'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { const a = Math.PI * (1.1 + k * 0.25); ctx.beginPath(); ctx.moveTo(wx, sy + 8); ctx.lineTo(wx + Math.cos(a) * 12, sy + 8 + Math.sin(a) * 12); ctx.stroke(); }
    const hx = x0 + w * 0.3 + Math.sin(t * 1.3) * 4, hy = sy - 6 + Math.sin(t * 2) * 3;
    ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx - Math.sin(t * 1.3) * 4, sy - 420); ctx.lineTo(hx, hy - 10); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, hy - 10); ctx.lineTo(hx, hy); ctx.arc(hx - 5, hy, 5, 0, Math.PI * 0.9); ctx.stroke();
    ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(hx, hy - 24, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    // bubbles rising out of it
    ctx.fillStyle = 'rgba(220,255,220,0.8)';
    for (let k = 0; k < 5; k++) { const ph = (t * 0.6 + k * 0.21) % 1; ctx.beginPath(); ctx.arc(x0 + 10 + ((k * 37) % Math.max(10, w - 20)), sy + 30 - ph * 46, 1.8 + (k % 2), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
ENTITY_TYPES.nlBikeHook = NlBikeHook;

/* ---------- the piece: added at the end of 8-3's main script; it finds the second little canal (a 4-wide gap) and
   turns it into the Under-Stage pit: no canal water in it (a bottom seam to the graveyard), the tell over it, and the
   anchor for the way back on the towpath just past it ---------- */
Tour.pieces['nl.bikeGrave'] = function (st, o) {
  const B = st.B, H = B.H, runs = [];
  for (let x = 0; x < B.W; x++) {
    if (B.get(x, H - 1) !== T.LAVA) continue;
    let x1 = x; while (x1 + 1 < B.W && B.get(x1 + 1, H - 1) === T.LAVA) x1++;
    runs.push([x, x1]); x = x1;
  }
  const small = runs.filter(r => r[1] - r[0] + 1 === 4), R = small[o.which != null ? o.which : 1];
  if (!R) { if (st.ctx.problems) st.ctx.problems.push('nl.bikeGrave: no canal gap to use'); return st.x; }
  const [a, b] = R;
  let ly = 0; while (ly < H && B.get(a, ly) !== T.LAVA) ly++;
  for (let x = a; x <= b; x++) for (let y = ly; y < H; y++) B.set(x, y, T.EMPTY);
  B.spawn('nlBikeHook', a, ly - 1, { w: b - a + 1, surf: ly, tell: true });
  TourSeams.add(B, { side: 'bottom', a, b, to: o.to || 'bikegrave@in' });
  // the towpath after the gap: stand on its surface
  const bx = b + 2; let gy = 0; while (gy < H && !SOLID[B.get(bx, gy)]) gy++;
  B.anchor('graveBack', bx, gy - 1);
  return st.x;
};

/* ---------- the drowned-bike graveyard (an Under-Stage, theme nl_bikegrave): heaps of rusty bikes on the canal bed,
   light rippling down through the water overhead, an eel or two of weed, Piwi's stagehand mice fishing for parts, and
   the Brady Button on the old barge's deck ---------- */
Object.assign(BGPaint, {
  // the canal from below: the water's surface overhead with light rippling through, the brick canal walls
  nlCanalBed(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, 0.18); ctx.fillRect(0, 0, BG_W, 60);
    ctx.strokeStyle = 'rgba(200,255,220,0.25)'; ctx.lineWidth = 3;
    for (let y = 20; y < 70; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= BG_W; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.04 + y) * 5); ctx.stroke(); }
    // the brick walls of the canal, slimy, with mooring rings
    for (let y = 80; y < H; y += 18) for (let x = (y / 18 % 2) * 20; x < BG_W; x += 40) { ctx.fillStyle = rng() < 0.5 ? '#3a4a3a' : '#425442'; ctx.fillRect(x + 1, y + 1, 38, 16); }
    ctx.strokeStyle = 'rgba(180,160,90,0.6)'; ctx.lineWidth = 3; for (let x = 120; x < BG_W; x += 340) { ctx.beginPath(); ctx.arc(x, 150, 10, 0, TAU); ctx.stroke(); }
    // light shafts
    ctx.fillStyle = 'rgba(200,255,220,0.08)'; for (let x = 60; x < BG_W; x += 220) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 120, H); ctx.lineTo(x + 40, H); ctx.closePath(); ctx.fill(); }
  }
});
if (THEMES.bk_under) THEMES.nl_bikegrave = Object.assign({}, THEMES.bk_under, {
  name: 'The Drowned-Bike Graveyard', particles: 'bubbles', darkness: 0.22, fog: '#6ab88a', horizonGlow: '#8ae8b0',
  sky: ['#10241c', '#163024', '#1c3a2c'],
  layers: [{ kind: 'nlCanalBed', color: '#1e3a2c', base: 0, f: 0.06 }]
});
Object.assign(Decor, {
  // a heap of drowned bikes: wheels, frames and handlebars tangled with weed
  nlBikeHeap(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save(); ctx.lineJoin = 'round';
    for (let k = 0; k < 3; k++) {
      const bx = x - 22 + k * 20, by = y - 10 - (k === 1 ? 12 : 0), a = (k - 1) * 0.5 + (s % 3) * 0.2;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(a);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.4; for (const wx of [-10, 10]) { ctx.beginPath(); ctx.arc(wx, 0, 9, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = ['#8a4a2a', '#2a6ab0', '#b83a3a'][(s + k) % 3]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-3, -9); ctx.lineTo(7, -9); ctx.lineTo(10, 0); ctx.moveTo(-3, -9); ctx.lineTo(0, 0); ctx.lineTo(7, -9); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const sx = x - 26 + k * 17; ctx.beginPath(); ctx.moveTo(sx, y); ctx.quadraticCurveTo(sx + Math.sin(t * 1.5 + k) * 6, y - 20, sx + Math.sin(t * 1.2 + k) * 8, y - 34 - (k % 2) * 8); ctx.stroke(); }
    ctx.restore();
  },
  // the bike-fishing hook's line coming down through the ceiling (seen from below)
  nlHookDown(ctx, x, y, t) {
    const hx = x + Math.sin(t * 1.3) * 4, hy = y - 110 + Math.sin(t * 2) * 4;
    ctx.save(); ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 420); ctx.lineTo(hx, hy - 10); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, hy - 10); ctx.lineTo(hx, hy); ctx.arc(hx - 5, hy, 5, 0, Math.PI * 0.9); ctx.stroke();
    ctx.restore();
  }
});
const stamps = {
  nlBikeGrave: {
    floor: 12,
    rows: (() => {
      const W = 36, H = 14, g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
      const put = (x, y, c) => { g[y][x] = c; }, h = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) put(x, y, c); };
      h(0, W - 1, 0, 'H'); h(0, W - 1, 12, '#'); h(0, W - 1, 13, '#'); for (let y = 1; y < 12; y++) { put(0, y, 'H'); put(W - 1, y, 'H'); }
      h(10, 16, 4, '-'); for (let x = 11; x <= 15; x += 2) put(x, 3, 'o'); h(24, 30, 4, '-'); for (let x = 25; x <= 29; x += 2) put(x, 3, 'o');
      h(6, 10, 7, '-'); put(13, 8, 'h');
      put(2, 11, '@'); put(4, 11, 'k'); put(7, 11, 'x'); put(13, 11, 'm'); put(17, 11, 'x'); put(21, 11, 'u'); put(25, 11, 'e'); put(27, 11, 'q'); put(30, 11, 'D'); put(33, 11, 'r');
      return g.map(r => r.join(''));
    })(),
    hidden: ['oneup'],
    doors: [{ to: 'fietspad@graveBack', look: 'nlStairsUp' }],
    legend: {
      k: ['decor', 'nlHookDown'], x: ['decor', 'nlBikeHeap'], r: ['decor', 'nlBikeHeap'], q: ['decor', 'bkCrewSign'], e: ['decor', 'bkGhostLight'],
      m: ['spawn', 'bkMouse', {}], u: ['spawn', 'button', { rule: 12 }]
    }
  }
};
const L3 = C.levels[2];
if (L3 && L3.name === 'Bike Lane Rush' && !L3.areas.some(a => a.id === 'bikegrave')) {
  const A0 = L3.areas[0];
  const spec = Object.assign({}, L3, {
    n: 3,
    areas: [Object.assign({}, A0, { script: A0.script.concat([['bikeGrave', { tight: true }]]) })].concat(L3.areas.slice(1), [
      { id: 'bikegrave', gen: 'room', role: 'backstage', zone: 'under', theme: 'nl_bikegrave', stamp: 'nlBikeGrave' }
    ])
  });
  Tour.amend('nl', { stamps, levels: [spec] });
} else Tour.amend('nl', { stamps });
})();
