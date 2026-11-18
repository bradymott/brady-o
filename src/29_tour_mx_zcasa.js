/* ============================================================
   Mexico 1-7 CASA DE SORPRESAS (SECRETS_WARPS_SWITCHES.md §4.4): the bonus level that Piwi's House Rule 7
   (NO HATS ON ANIMALS, its Brady Button on Brazil 3-1's Loading Dock) opens. A big old house round a courtyard,
   and a sampler of surprises: work out the house.
   The house (one maze area, two storeys of three cells):
     upstairs:   the gallery (the attic door)  | the roof terrace (the old cistern, padlocked; a hole down to the
                 courtyard)                    | Piwi's wing (his piñata pound; a painted parrot hides a door)
     downstairs: the zaguán (the start; Xolo's tiendita; the stairs; the front gate)  | the courtyard (the well,
                 the bouncy castle, a scuffed patch of soil, the garden gate, padlocked) | the garden (the exit)
   The way through: the garden key is at the rim of the cistern on the roof; the cistern's key is in the attic,
   where nobody ever walks: on the ceiling. Everything else is a surprise to find:
     Xolo's tiendita after hours (closing), the topsy-turvy attic (topsy, new here), the hourglass cistern
     (hourglass, new here), Piwi's piñata pound (ambush), the piñata-donkey bouncy castle (bouncy), the parrot's
     map room (treasure, new here: its X is in the courtyard), the Under-Stage down the courtyard well, the Wings
     out past the front gate. Every room is a different kind, none used elsewhere in Mexico.
   This file also wires Rule 7 to open the level (its stop and a gold trail from 1-5 appear on Mexico's map),
   the three new room kinds (topsy, hourglass, treasure), the treasure X, the keys and padlocks, the looks
   (themes, painted backdrops, props, door skins) and the map scene. Code-drawn, Fiesta Toon.
   It sorts after 29_tour_mx_levels.js, _secrets.js and _sprites.js: Mexico's six levels and its wired atlases
   exist when 1-7 is added. Where everything is: docs/design/BACKSTAGE_STATUS.md.
   ============================================================ */
(function () {
const C = Tour.countries.mx;
if (!C) return;
const INK = '#2a1a22';
const PAPEL = ['#ff3d8b', '#ffb81a', '#18c2c2', '#8a4aff', '#5ad04a', '#ff6a3a'];
const FONT7 = '7px ' + FONT_DISPLAY, FONT8 = '8px ' + FONT_DISPLAY, FONT9 = '9px ' + FONT_DISPLAY, FONT11 = '11px ' + FONT_DISPLAY, FONT14 = '14px ' + FONT_DISPLAY;

/* ================= the keys and padlocks ================= */
const keyArt = (tag, label) => (ctx, x, y, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  // an old iron key: a ring bow, the shank, two teeth
  ctx.fillStyle = '#5a5866'; ctx.beginPath(); ctx.arc(-7, -2, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8c4d0'; ctx.beginPath(); ctx.arc(-7, -2, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a5866'; ctx.fillRect(-2, -4, 15, 4); ctx.strokeRect(-2, -4, 15, 4);
  ctx.fillRect(9, 0, 3, 5); ctx.strokeRect(9, 0, 3, 5); ctx.fillRect(4, 0, 3, 4); ctx.strokeRect(4, 0, 3, 4);
  // its paper tag on a string
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, 3); ctx.lineTo(-11, 9); ctx.stroke();
  ctx.fillStyle = tag; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, -19, 8, 17, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1020'; ctx.font = '5px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, -10.5, 12.8, 15);
  ctx.restore();
};
const mapArt = (ctx, x, y, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
  // a torn, rolled map: parchment, a dotted trail, a red X
  ctx.fillStyle = '#f2dca0'; ctx.beginPath(); ctx.moveTo(-12, -9); ctx.lineTo(10, -11); ctx.lineTo(12, -4); ctx.lineTo(9, 1); ctx.lineTo(12, 9); ctx.lineTo(-11, 10); ctx.lineTo(-13, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.ellipse(-12, 0, 3, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a2a'; for (let k = 0; k < 4; k++) ctx.fillRect(-6 + k * 3.5, 4 - k * 2.5, 2, 2);
  ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(9, -1); ctx.moveTo(9, -6); ctx.lineTo(4, -1); ctx.stroke();
  ctx.restore();
};
TourMaze.addKeys({
  mxCasaKeyCistern: { name: 'THE CISTERN KEY', toast: 'THE CISTERN KEY! IT OPENS THE OLD CISTERN ON THE ROOF', col: '#7ad8ff', glow: '#e0f4ff', icon: keyArt('#7ad8ff', 'ALJIBE') },
  mxCasaKeyGarden: { name: 'THE GARDEN KEY', toast: 'THE GARDEN KEY! THE GARDEN GATE IS IN THE COURTYARD', col: '#5ad04a', glow: '#e0ffd8', icon: keyArt('#7ae06a', 'HUERTA') },
  mxCasaMap: { name: 'A TREASURE MAP', toast: 'A TREASURE MAP! THE X IS IN THE COURTYARD, BY THE ORANGE TREE', col: '#ffd84a', glow: '#fff2c0', icon: mapArt }
});

// a padlocked gate (the garden gate, the cistern's grille): a lock with its own look; opens with its key
class CasaGate extends ENTITY_TYPES.mazeShutter {
  constructor(g, s) { super(g, s); this.kind = s.kind || 'gate'; }
  draw(ctx) {
    const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x0 = this.x + 2, w = this.w - 4, h = this.h, y0 = this.y, t = this.g.t;
    if (k >= 1) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    if (this.kind === 'grille') {
      // the cistern's iron grille: bars, a hoop, the padlock; it rises when opened
      const yy = y0 - k * h;
      ctx.fillStyle = '#4a4654'; ctx.fillRect(x0, yy, w, 5); ctx.strokeRect(x0, yy, w, 5);
      for (let q = 0; q < 4; q++) { const bx = x0 + 4 + q * (w - 10) / 3; ctx.fillStyle = '#5a5866'; ctx.fillRect(bx, yy + 4, 4, h - 6); ctx.strokeRect(bx, yy + 4, 4, h - 6); }
      ctx.fillStyle = '#4a4654'; ctx.fillRect(x0, yy + h * 0.55, w, 4); ctx.strokeRect(x0, yy + h * 0.55, w, 4);
    } else {
      // the garden gate: a wooden door with iron straps and a little grille window onto the green beyond; swings open
      const sw = 1 - k * 0.9;
      ctx.fillStyle = '#8a4e22'; ctx.fillRect(x0, y0, w * sw, h); ctx.strokeRect(x0, y0, w * sw, h);
      ctx.fillStyle = '#a8642e'; for (let q = 0; q < 3; q++) ctx.fillRect(x0 + 2 + q * w * sw / 3, y0 + 2, w * sw / 3 - 4, h - 4);
      ctx.fillStyle = '#3a3440'; ctx.fillRect(x0, y0 + 12, w * sw, 4); ctx.fillRect(x0, y0 + h - 18, w * sw, 4);
      if (sw > 0.6) { ctx.fillStyle = '#7ad06a'; rr(ctx, x0 + w * sw / 2 - 7, y0 + 24, 14, 14, 3); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + w * sw / 2, y0 + 24); ctx.lineTo(x0 + w * sw / 2, y0 + 38); ctx.moveTo(x0 + w * sw / 2 - 7, y0 + 31); ctx.lineTo(x0 + w * sw / 2 + 7, y0 + 31); ctx.stroke(); }
    }
    if (!this.open) {
      // the padlock and a tag with the key it wants
      const px = this.cx, py = y0 + h * 0.62 + Math.sin(t * 3) * 1;
      ctx.strokeStyle = '#c8c4d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py - 4, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#d8a83a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; rr(ctx, px - 8, py - 4, 16, 14, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillRect(px - 1, py + 1, 2, 5);
      const I = this.s.icon && TourMaze.KEYS[this.s.icon];
      if (I) { ctx.fillStyle = 'rgba(255,248,230,0.92)'; ctx.beginPath(); ctx.arc(px, y0 - 14, 13, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); ctx.save(); ctx.translate(px + 3, y0 - 15); ctx.scale(0.62, 0.62); I.icon(ctx, 0, 0, t); ctx.restore(); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.casaGate = CasaGate;

/* the Treasure Map's X: a scuffed patch of soil in the courtyard floor (a one-tile lock, 'map:<id>'). Stand on it
   holding the map and Brady digs: a chest pops up with a 1UP and a shower of golden limes. Without the map it only
   says the soil is loose. Once the map is held the X glows and sparkles. */
class CasaX extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.dug = false; this.digT = 0; this.paid = false; this.back = true; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const p = this.g.player;
    if (!this.dug && p && !p.dead && p.state === 'play' && p.onGround && Math.abs(p.y + p.h - this.y) < 4 && p.x + p.w > this.x + 10 && p.x < this.x + this.w - 10) {
      if (this.g.keys.has(this.id)) this.dig(p);
      else if (this.msgT <= 0) { this.msgT = 3; this.g.parts.text(this.cx, this.y - 34, 'THE SOIL IS LOOSE HERE...', '#ffe8b0'); }
    }
    if (this.dug) {
      this.digT += dt;
      if (!this.paid && this.digT > 0.7) {
        this.paid = true;
        this.g.addLife(this.cx, this.y - 50);
        for (let k = 0; k < 8; k++) { this.g.spawn(new PickPop(this.g, this.cx + (k - 3.5) * 7, this.y - 30)); this.g.addPick(); }
        this.g.burst(this.cx, this.y - 30, 26, '#ffd84a', 'confetti');
      }
    }
  }
  touchPlayer() {}
  dig(p) {
    this.dug = true; this.open = true; this.digT = 0;
    for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
    p.vy = -6 * TS; p.onGround = false;
    Sound.play('break', { vol: 0.7 }); TourKit.sfx('dig', 'crumble', { vol: 0.6 }); this.g.shake(3);
    this.g.burst(this.cx, this.y, 22, '#a8784a', 'debris');
    this.g.toast('X MARKS THE SPOT! A BURIED TREASURE CHEST!');
  }
  draw(ctx) {
    const x = this.cx, y = this.y, t = this.t, has = this.g.keys.has(this.id);
    ctx.save(); ctx.lineJoin = 'round';
    if (!this.dug) {
      // the scuff: darker turned soil with pebbles; the X shows faintly, bright once Brady has the map
      ctx.fillStyle = 'rgba(90,56,30,0.75)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b08050'; ctx.fillRect(x - 12, y + 1, 3, 2); ctx.fillRect(x + 8, y + 2, 3, 2); ctx.fillRect(x - 2, y + 5, 2, 2);
      ctx.globalAlpha = has ? 0.95 : 0.5; ctx.strokeStyle = has ? '#ff3a4a' : '#5a3418'; ctx.lineWidth = has ? 4 : 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 2); ctx.lineTo(x - 8, y + 8); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
      if (has) for (let k = 0; k < 4; k++) { const a = t * 2.4 + k * 1.57, r = 16 + Math.sin(t * 5 + k) * 3; ctx.fillStyle = k % 2 ? '#fff4a0' : '#ffffff'; TourRoomArt.star(ctx, x + Math.cos(a) * r, y - 6 + Math.sin(a) * r * 0.45, 3.2); }
    } else {
      // the hole and the chest, risen out of it with its lid open
      ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x, y + 2, 16, 5, 0, 0, TAU); ctx.fill();
      const rise = Math.min(1, this.digT * 2.2), cy = y - 6 - rise * 18, open = clamp((this.digT - 0.45) * 3, 0, 1);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#8a4a1a'; rr(ctx, x - 16, cy - 14, 32, 18, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 16, cy - 9, 32, 3); ctx.fillRect(x - 3, cy - 14, 6, 18);
      ctx.save(); ctx.translate(x - 16, cy - 14); ctx.rotate(-open * 1.5); ctx.fillStyle = '#a85a22'; rr(ctx, 0, -9, 32, 9, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      if (open > 0.2 && this.digT < 3) { ctx.globalAlpha = Math.min(1, 3 - this.digT); ctx.fillStyle = '#fff2a0'; for (let k = 0; k < 5; k++) TourRoomArt.star(ctx, x - 10 + k * 5, cy - 22 - Math.sin(t * 6 + k) * 4, 3); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.casaX = CasaX;

/* ================= pieces (the house's own stamp letters use them) ================= */
// a padlocked gate h rows tall standing on the row under the letter: { id, kind: 'gate' | 'grille', icon, need }
Tour.pieces['mx.casaGate'] = TourMaze.lock('casaGate', {});
// the Treasure Map's X in the floor row (the letter sits in the floor): { id }
Tour.pieces['mx.casaX'] = function (st, o) {
  const B = st.B, n = B.spawns.length, y = st.gy - 1;
  B.lock(st.x, y, y, o.id, 'xmark');
  B.set(st.x, y, T.GROUND);   // it looks like the rest of the floor (still the lock's tile)
  for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'casaX';
  return st.x;
};
// a door hidden in a fake wall (a cracked painted plaster section with dust puffing out): { to, back }; the letter
// sits on the floor row Brady stands in, the wall is 3 wide round it with a lintel row on top. Unlike the toolkit's
// secretDoor it lays no ground (the house is a maze: ground would fill the storey below)
Tour.pieces['mx.casaHidden'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1;
  for (let dx = -1; dx <= 1; dx++) { B.set(x + dx, y - 3, T.HARD); for (let dy = 0; dy < 3; dy++) B.set(x + dx, y - dy, T.FAKE); }
  B.spawn('tourDraft', x, y, { look: 'painted' });
  B.spawn('portal', x, y, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
  if (o.back) B.anchor(o.back, x + 3, y);
  return x;
};

/* ================= the house: one maze area, 3 x 2 cells of 28 x 14 ================= */
// a 28-wide row from a base and [column, letter] marks (no hand-counting)
const R = (base, ...marks) => { const a = base.split(''); for (const [i, ch] of marks) a[i] = ch; return a.join(''); };
const WALL = '############################', ROOM = '#..........................#', OPEN_R = '#...........................', OPEN_L = '...........................#', OPEN = '............................';
const HOUSE = {
  n: ['enemy', 'mxChihuahua'], m: ['enemy', 'mxPepper'], r: ['enemy', 'mxElote'],
  t: ['decor', 'mxCasaTree'], k: ['decor', 'mxPots'], j: ['decor', 'mxNopal'], a: ['decor', 'mxAgaveP'], p: ['decor', 'mxCasaPapel']
};
const cell = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, HOUSE, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const house = {
  // the zaguán (the start): the big front doors (a curtain stirs in the doorway: the Wings are out there), Xolo's
  // tiendita behind its half-down shutter, the stairs up
  zaguan: cell([
    WALL, ROOM, ROOM, ROOM,
    R(ROOM, [8, 'o'], [10, 'o'], [12, 'o']),
    ROOM,
    R(ROOM, [7, '-'], [8, '-'], [9, '-'], [10, '-'], [11, '-'], [12, '-'], [13, '-']),
    ROOM,
    R(ROOM, [17, '?']),
    R(OPEN_R, [0, 'e']), R(OPEN, [0, 'e']),
    R(OPEN, [0, 'e'], [1, 'f'], [2, 'q'], [4, '@'], [6, 'u'], [8, 'w'], [10, 'D'], [12, 'l'], [19, 'n']),
    WALL, WALL
  ], { items: ['power'], doors: [{ to: 'tiendita@in', look: 'mxCasaShopDoor' }],
    legend: { e: ['seam', 'left', 'wings@in'], f: ['decor', 'mxCasaZaguan'], q: ['anchor', 'wingsBack'], l: ['anchor', 'shopBack'], w: ['spawn', 'bkMouse', { dir: -1 }],
      u: ['spawn', 'sign', { text: 'CASA DE SORPRESAS! PIWI LOCKED THE GARDEN GATE AND HID THE KEY SOMEWHERE IN THE HOUSE. WORK OUT THE HOUSE!' }] } }),
  // the courtyard: the bougainvillea trellis (P1 at its top), the well (it goes somewhere...), the scuffed soil by
  // the orange tree, the piñata-donkey bouncy castle, Pupo's Nap Box, the garden gate (padlocked)
  patio: cell([
    WALL,
    R(ROOM, [8, 'p'], [20, 'p']),
    R(ROOM, [4, '*']),
    R(ROOM, [2, '-'], [3, '-'], [4, '-'], [5, '-'], [6, '-']),
    ROOM, ROOM,
    R(ROOM, [6, '-'], [7, '-'], [8, '-'], [9, '-'], [10, '-'], [23, 'o'], [24, 'o'], [25, 'o']),
    ROOM,
    R(ROOM, [23, '#'], [24, '#'], [25, '#'], [26, '#']),
    R(OPEN, [1, '-'], [2, '-'], [3, '-'], [4, '-'], [5, '-']),
    OPEN,
    R(OPEN, [3, 't'], [9, 'c'], [10, 'm'], [12, 'B'], [14, 'x'], [16, 'B'], [17, 'z'], [20, 'u'], [22, 'D'], [24, 'i'], [25, 'Z']),
    R(WALL, [6, 'X'], [13, 'd'], [14, 'd'], [15, 'd']),
    R(WALL, [13, 'd'], [14, 'd'], [15, 'd'])
  ], { gold: { '*': 'must' }, doors: [{ to: 'castillo@in', look: 'mxCasaBouncyDoor' }],
    legend: { d: ['seam', 'bottom', 'under@in', { tell: 'well' }], x: ['decor', 'mxCasaWell'], z: ['anchor', 'underBack'], i: ['anchor', 'bouncyBack'],
      X: ['piece', 'mx.casaX', { id: 'map:casa' }],
      Z: ['piece', 'mx.casaGate', { id: 'casa:garden', h: 3, kind: 'gate', icon: 'mxCasaKeyGarden', need: 'LOCKED! PIWI DROPPED THE GARDEN KEY DOWN THE OLD CISTERN, UP ON THE ROOF' }],
      u: ['spawn', 'sign', { text: 'THE GARDEN GATE IS LOCKED. THE WELL GOES DOWN A LONG WAY. THE X? ASK THE PARROT' }] } }),
  // the garden: orange trees, nopales, the gate out
  garden: cell([
    WALL, ROOM, ROOM, ROOM,
    R(ROOM, [9, 'o'], [11, 'o'], [13, 'o']),
    ROOM,
    R(ROOM, [8, '-'], [9, '-'], [10, '-'], [11, '-'], [12, '-'], [13, '-'], [14, '-']),
    ROOM, ROOM,
    OPEN_L, OPEN_L,
    R(OPEN_L, [4, 't'], [9, 'j'], [12, 'm'], [17, 't'], [21, 'G'], [25, 'a'])
  ].concat([WALL, WALL])),
  // the gallery upstairs: the stairs come up here; the attic door
  gallery: cell([
    WALL, ROOM, ROOM, ROOM,
    R(ROOM, [11, 'o'], [13, 'o'], [15, 'o']),
    ROOM,
    R(ROOM, [10, '-'], [11, '-'], [12, '-'], [13, '-'], [14, '-'], [15, '-'], [16, '-']),
    ROOM, ROOM,
    OPEN_R, OPEN_R,
    R(OPEN_R, [7, 'u'], [12, 'D'], [14, 'l'], [21, 'n'], [24, 'k']),
    WALL, WALL
  ], { doors: [{ to: 'atico@in', look: 'mxCasaAtticDoor' }],
    legend: { l: ['anchor', 'atticBack'], u: ['spawn', 'sign', { text: 'UPSTAIRS. THE ATTIC IS A BIT... TOPSY-TURVY. MIND YOUR HEAD (AND YOUR FEET)' }] } }),
  // the roof terrace: the water tank, the old cistern behind its padlocked grille (climb its roof to get past), the
  // hole down into the courtyard, the washing line
  roof: cell([
    WALL, ROOM, ROOM, ROOM, ROOM,
    R(ROOM, [3, 'o'], [5, 'o'], [7, 'o']),
    R(ROOM, [2, '-'], [3, '-'], [4, '-'], [5, '-'], [6, '-'], [7, '-'], [8, '-']),
    ROOM,
    R(ROOM, [10, 'H'], [11, 'H'], [12, 'H'], [13, 'H'], [14, 'H'], [15, 'H'], [16, 'H'], [19, 'o'], [20, 'o'], [21, 'o'], [22, 'o']),
    R(OPEN, [16, 'H']),
    R(OPEN, [16, 'H']),
    R(OPEN, [4, 'x'], [8, 'B'], [10, 'Z'], [12, 'l'], [13, 'D'], [16, 'H'], [18, 'u'], [25, 'Y']),
    WALL, WALL
  ], { doors: [{ to: 'aljibe@in', look: 'mxCasaHatch' }],
    legend: { x: ['decor', 'mxCasaTank'], Y: ['decor', 'mxCasaLaundry'], l: ['anchor', 'cisternBack'],
      Z: ['piece', 'mx.casaGate', { id: 'casa:cistern', h: 3, kind: 'grille', icon: 'mxCasaKeyCistern', need: 'PIWI\'S PADLOCK. HE HID THE KEY "WHERE NOBODY EVER WALKS"' }],
      u: ['spawn', 'sign', { text: '↓ THE COURTYARD (NO WAY BACK UP THIS WAY)' }] } }),
  // Piwi's wing: his piñata pound; a painting of a parrot with a torn map, and dust puffing from a crack beside it
  wing: cell([
    WALL, ROOM, ROOM,
    R(ROOM, [5, 'o'], [7, 'o'], [9, 'o']),
    ROOM,
    R(ROOM, [4, '-'], [5, '-'], [6, '-'], [7, '-'], [8, '-'], [9, '-'], [10, '-']),
    ROOM, ROOM, ROOM,
    OPEN_L, OPEN_L,
    R(OPEN_L, [5, 'u'], [8, 'D'], [10, 'l'], [14, 'm'], [18, 'Y'], [21, 'V'])
  ].concat([WALL, WALL]), { doors: [{ to: 'pound@in', look: 'mxCasaPoundDoor' }],
    legend: { l: ['anchor', 'poundBack'], Y: ['decor', 'mxCasaParrotPainting'], V: ['piece', 'mx.casaHidden', { to: 'estudio@in', back: 'studyBack' }],
      u: ['spawn', 'sign', { text: 'PIWI\'S PIÑATA POUND. CONFISCATED FUN. KEEP OUT! (THAT MEANS YOU, BRADY-O)' }] } })
};

/* ================= the rooms ================= */
// what a room's door and prize boxes are (the room kinds build the room itself from this; TourRooms.keep)
const roomStamp = (to, look, items, decor) => {
  const legend = {}, row = R(ROOM, [2, '@'], [3, 'D']).split('');
  items.forEach((it, k) => { row[7 + k * 3] = '?'; });
  (decor || []).forEach((d, k) => { const ch = 'xjk'[k]; legend[ch] = ['decor', d]; row[16 + k * 3] = ch; });
  return { floor: 11, rows: [WALL].concat(Array.from({ length: 9 }, () => ROOM), [row.join(''), WALL, WALL, WALL]), items, doors: [{ to, look: look || 'tourDoor' }], legend };
};
const stamps = {
  casaTienda: roomStamp('casa@shopBack', 'tourDoor', ['power', 'oneup'], ['mxPots']),
  casaCastillo: roomStamp('casa@bouncyBack', 'mxCasaBouncyFlap', ['oneup']),
  casaPound: roomStamp('casa@poundBack', 'mxCasaPoundDoor', ['star']),
  casaAtico: roomStamp('casa@atticBack', 'mxCasaAtticDoor', ['power']),
  casaAljibe: roomStamp('casa@cisternBack', 'mxCasaHatch', ['sundial']),
  casaEstudio: roomStamp('casa@studyBack', 'tourDoor', ['magnet']),
  // under the courtyard well (backstage): a crash mat to land on, P2 up the catwalks, coins in a hidden brick; the
  // stage door back up to the courtyard
  casaUnder: {
    floor: 12,
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
      'H...................*..........H',
      'H.................-----........H',
      'H..............................H',
      'H.........o.o.o................H',
      'H...........-----..............H',
      'H..............................H',
      'H......h.......................H',
      'H.....-----....................H',
      'H..............................H',
      'H..............................H',
      'H..@.a...k...x.....m......D....H',
      '##bbbb##########################',
      '################################'
    ],
    gold: { '*': 'hidden' }, hidden: ['picks'],
    doors: [{ to: 'casa@underBack', look: 'tourDoor' }],
    legend: { a: ['decor', 'bkMatTag'], k: ['decor', 'bkGhostLight'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}] }
  },
  // out past the front gate (backstage): the house's wings, a prop table of spare piñatas, P3 up the catwalks, a 1UP
  // hidden over the ghost light; walk off the right edge to go back in
  casaWings: {
    floor: 12,
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
      'H......................................H',
      'H.............*........................H',
      'H...........-----......................H',
      'H......................................H',
      'H......................................H',
      'H...................-----..............H',
      'H...h..................................H',
      'H......................................H',
      'H.........................----.........e',
      'H......................................e',
      'H..k..r....t....x...m.....q...a...@....e',
      '########################################',
      '########################################'
    ],
    gold: { '*': 'high' }, hidden: ['oneup'],
    legend: { e: ['seam', 'right', 'casa@wingsBack'], k: ['decor', 'bkGhostLight'], r: ['decor', 'bkRack'], t: ['decor', 'mxCasaPropTable'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}], q: ['decor', 'bkFlatBack'], a: ['decor', 'bkCrewSign'] }
  }
};

/* ================= three new room kinds (docs/design/SECRETS_WARPS_SWITCHES.md §2.6-2.8) ================= */
const cellOf = (g, ch) => { for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) if (g.g[y][x] === ch) return [x, y]; return null; };

/* ---------- topsy: the Topsy Attic. Everything has "fallen up": past the painted line gravity flips and Brady walks
   the ceiling among upside-down furniture to what waits there; past the second line he drops back down. ---------- */
TourRooms.def('topsy', {
  title: 'TOPSY-TURVY ATTIC!', rule: 'EVERYTHING UP HERE HAS FALLEN UP. STEP OVER THE PAINTED LINE AND WALK ON THE CEILING',
  make(o, keep, ctx, A, rng) {
    const W = 40, g = new RoomGrid(W, 14, 11), Y = 10;
    g.west(keep);
    const b0 = 9, b1 = 29;
    g.zones.push([b0, 0, b1 - b0 + 1, 14, 0, 0, 0, 'flip']);
    g.spawn(b0, Y, 'flipLine', { w: b1 - b0 + 1, h: 14, look: null });
    // the fallen-up furniture on the ceiling (solid, drawn by the room: a wardrobe, a trunk, a rocking chair)
    g.data.props = [['wardrobe', 13, 1, 2, 3], ['trunk', 18, 1, 3, 2], ['chair', 24, 1, 2, 3]];
    for (const [, x, y, w, h] of g.data.props) g.fill(x, y, x + w - 1, y + h - 1, '#');
    // coins along the ceiling and in the arcs over the furniture (a flipped jump goes "down")
    g.coins(10, 12, 2); g.coins(13, 14, 5); g.coins(16, 17, 2); g.coins(18, 20, 4); g.coins(22, 23, 2); g.coins(24, 25, 5);
    // the prize on the ceiling, past the furniture
    if (o.key) { g.spawn(27, 1, 'key', { id: o.key, look: o.keyLook || null }); g.need('what waits on the ceiling', 27, 1); }
    // the far side: the right way up again; a shelf, the prize boxes, a second door out
    g.hline(31, 35, 7, '-');
    TourRoomKit.prize(o, keep).forEach((it, k) => g.box(32 + k * 2, 4, it));
    if (keep.door) { g.door(37, Y, keep.door); g.need('the far door', 37, Y); }
    // dusty boxes on the floor (the right way up) and the attic's own clutter
    g.coins(5, 7, Y); g.decor(6, Y, 'mxCasaAtticBoxes'); g.decor(33, Y, 'mxCasaAtticBoxes');
    g.data.band = [b0, b1];
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won || !kit.o.key) return;
    if (play.keys.has(kit.o.key)) TourRooms.win(play, A, R, { text: 'GOT IT! (UPSIDE DOWN)', coins: 4 });
  },
  build(ctx, A, built, o, grid) {
    // the furniture tiles draw as furniture, not as wall
    const area = built.area;
    for (const [kind, x, y, w, h] of grid.data.props) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) area.hide[yy * area.W + xx] = 1;
      area.decor.push({ kind: 'mxCasaFallen', x: (x + w / 2) * TS, y: y * TS, w: w * TS, h: h * TS, prop: true, seed: kind === 'wardrobe' ? 0 : kind === 'trunk' ? 1 : 2 });
    }
    // the rug, the lamp and the portrait that fell up too (no tiles: decoration on the ceiling)
    area.decor.push({ kind: 'mxCasaFallen', x: 11 * TS, y: TS, w: 3 * TS, h: TS, seed: 3 }, { kind: 'mxCasaFallen', x: 21.5 * TS, y: TS, w: TS, h: 3 * TS, seed: 4 }, { kind: 'mxCasaFallen', x: 27.5 * TS, y: TS, w: 2 * TS, h: 2 * TS, seed: 5 });
  }
});

/* ---------- hourglass: the Hourglass Well. Sand pours in from a giant hourglass the moment Brady lands at the
   bottom; climb to the rim before it catches him. Being caught is never a death and never a hit: the sand spits
   him back out at the bottom and pours again. ---------- */
TourRooms.def('hourglass', {
  title: 'THE HOURGLASS WELL!', rule: 'SAND POURS IN THE MOMENT YOU LAND. CLIMB TO THE RIM BEFORE IT CATCHES YOU!', timed: true,
  make(o, keep, ctx, A, rng) {
    const W = 22, H = o.H || 33, F = H - 3, g = new RoomGrid(W, H, F), Y = F - 1, top = 6;
    g.west(keep);
    // the rim: a floor with a one-way hatch in it; the prize, the key and the way out up there
    g.hline(1, W - 2, top, '#'); g.hline(8, 12, top, '-');
    g.anchor(14, top - 1, 'rim'); g.need('the rim', 14, top - 1);
    TourRoomKit.prize(o, keep).forEach((it, k) => g.box(3 + k * 2, top - 3, it));
    if (o.key) { g.spawn(17, top - 1, 'key', { id: o.key, look: o.keyLook || null }); g.need('the key at the rim', 17, top - 1); }
    if (keep.door) g.door(19, top - 1, keep.door);
    // jar stacks and rope rungs: ledges side to side, three rows apart; coins up the walls
    let left = true, n = 0;
    for (let y = F - 3; y > top + 1; y -= 3, n++) {
      const a = left ? 1 : 11, b = left ? 10 : W - 2;
      g.hline(a, b, y, '-');
      if (n % 2 === 0) g.coins(left ? 2 : 13, left ? 5 : 16, y - 2);
      left = !left;
    }
    g.put(W - 4, Y, 's');
    g.decor(10, top - 1, 'mxCasaHourglass');
    g.area = { paceTo: 'rim' };
    g.data.top = top;
    return g;
  },
  build(ctx, A, built, o) {
    built.area.risingLava = { speed: o.speed || 0.5, delay: o.delay || 2.5, look: 'sand' };
  },
  enter(play, A, R, kit) {
    if (!R.won) { play.bannerText = 'CLIMB!'; play.bannerT = 1.4; }
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = play.player;
    if (p.onGround && p.y + p.h <= kit.data.top * TS + 2) {
      TourRooms.win(play, A, R, { text: 'MADE IT OUT OF THE SAND!', coins: 6 });
      if (A.risingLava) A.risingLava = Object.assign({}, A.risingLava, { speed: 0 });
    }
  }
});
// the sand: a liquid look for rising "lava" (soft: never kills in an hourglass room)
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.sand) LIQUIDS.sand = ['#f6e2a8', '#e2bc66', '#b08436', 'rgba(255,240,200,0.18)', null, 'rgba(255,250,230,0.5)'];
// the sand re-arms on every visit (area hazards run on the level clock); once the rim is reached it stays still
TourHooks.on('areaLoaded', (play, A) => {
  if (!A || A.roomType !== 'hourglass') return;
  const base = play.level.areas[A.idx].risingLava; if (!base) return;
  const R = A.roomState || {};
  A.risingLava = Object.assign({}, base, R.won ? { speed: 0 } : { delay: play.t + (base.delay || 0) });
  play.lavaY = A.lavaY = A.H * TS + 40;
});
// caught by the sand: spat out at the bottom, no hit, the sand pours again
TourHooks.on('playerDie', (play, p, reason) => {
  const A = play.area;
  if (!A || A.roomType !== 'hourglass' || reason !== 'lava') return false;
  const L = play.level.areas[A.idx], a = (L.anchors && (L.anchors.in || L.anchors.start)) || { x: 3 * TS, y: (A.H - 3) * TS };
  p.x = a.x - p.w / 2; p.y = a.y - p.h; p.vx = 0; p.vy = 0; p.onGround = false; p.invuln = Math.max(p.invuln || 0, 1.5);
  play.lavaY = A.lavaY = A.H * TS + 40;
  A.risingLava = Object.assign({}, L.risingLava, { delay: play.t + 1.6 });
  play.camY = play.camTargetY(true);
  play.bannerText = 'PFFFT! THE SAND SPAT YOU OUT'; play.bannerT = 1.6;
  Sound.play('powerdown', { vol: 0.5 }); play.burst(p.cx, p.cy, 24, '#e2bc66', 'dust');
  return true;
});

/* ---------- treasure: the Treasure Map Room. A cartographer's den; the torn map on its stand. Taking it shows where
   the X lies in the level's main area; back there the X sparkles, and standing on it digs up the treasure. ---------- */
TourRooms.def('treasure', {
  title: 'THE TREASURE MAP ROOM!', rule: 'A TORN MAP ON A STAND. TAKE IT: X MARKS THE SPOT... SOMEWHERE OUTSIDE',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 32, g = K.room(W), Y = K.Y;
    g.west(keep);
    // shelves of books and rolled maps up to the stand
    g.hline(8, 12, 7, '-'); g.hline(14, 20, 4, '-');
    if (o.map) { g.spawn(18, 3, 'key', { id: o.map, look: o.mapLook || null }); g.need('the map', 18, 3); }
    g.coins(14, 17, 2); g.coins(8, 12, 5);
    K.prize(o, keep).forEach((it, k) => g.box(25 + k * 2, 7, it));
    g.decor(6, Y, 'mxCasaGlobe'); g.decor(22, Y, 'mxCasaParrot');
    g.data.where = o.where || 'IN THE COURTYARD';
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.peekT > 0) R.peekT -= dt;
    if (R.won || !kit.o.map) return;
    if (play.keys.has(kit.o.map)) { TourRooms.win(play, A, R, { text: false, coins: 0 }); R.peekT = 3.4; Sound.play('secret', { vol: 0.5 }); }
  },
  draw(play, ctx, A, R, kit) {
    if (!(R.peekT > 0)) return;
    // the peek: the map held up to the screen: a plan of the courtyard with its well, the orange tree and the X
    const k = clamp(Math.min(R.peekT, 3.4 - R.peekT) / 0.3, 0, 1), cx = play.camX + Game.viewW / 2, cy = play.camY + Game.viewH * 0.6;
    const w = Math.min(300, Game.viewW - 40), h = 150;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, cy); ctx.rotate(-0.03);
    ctx.fillStyle = '#f2dca0'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(ctx, -w / 2, -h / 2, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 1.5; rr(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 4); ctx.stroke();
    ctx.fillStyle = '#6a3a1a'; ctx.font = FONT11; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('THE COURTYARD', 0, -h / 2 + 20);
    // the plan: the arcade, the well, the tree, the gate, a dotted trail to the X
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 20, -h / 2 + 34, w - 40, h - 62);
    const fx = -w / 2 + 20, fw = w - 40, fy = h / 2 - 28;
    ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(fx + fw * 0.5, fy - 6, 9, 4, 0, 0, TAU); ctx.fill(); ctx.font = FONT7; ctx.fillText('WELL', fx + fw * 0.5, fy - 16);
    ctx.fillStyle = '#4a9a3a'; ctx.beginPath(); ctx.arc(fx + fw * 0.12, fy - 18, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(fx + fw * 0.1, fy - 20, 2.5, 0, TAU); ctx.arc(fx + fw * 0.15, fy - 15, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a3a1a'; ctx.fillText('GATE', fx + fw * 0.9, fy - 16); ctx.fillRect(fx + fw * 0.88, fy - 10, 8, 10);
    ctx.fillStyle = '#8a5a2a'; for (let q = 0; q < 6; q++) ctx.fillRect(fx + fw * 0.88 - q * fw * 0.095, fy - 4 - Math.sin(q) * 6, 3, 3);
    const xx = fx + fw * 0.22, yy = fy - 6, pulse = 1 + Math.sin(play.t * 8) * 0.12;
    ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 4 * pulse; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xx - 7, yy - 7); ctx.lineTo(xx + 7, yy + 7); ctx.moveTo(xx + 7, yy - 7); ctx.lineTo(xx - 7, yy + 7); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#d0203a'; ctx.font = FONT9; ctx.fillText('BY THE ORANGE TREE. STAND ON THE X', 0, h / 2 - 12, w - 20);
    ctx.restore();
  }
});

/* ================= the level ================= */
const L7 = { n: 7, name: 'Casa de Sorpresas', mapLabel: 'Casa', arch: 'bonus', secret: true, mapHidden: true, theme: 'mx_casa', time: 900,
  gimmick: 'A big old house round a courtyard, full of surprises. Piwi locked the garden gate: work out the house to find the key',
  hint: 'The garden key is down the old cistern on the roof. Its key is somewhere nobody ever walks... look up',
  postcard: 'A whole house of surprises! Even the attic is upside down. The animals look great in their hats. ♥ C',
  enemies: [['mxChihuahua', 2], ['mxPepper', 2], ['mxBurro', 1]],
  mapCell: [2, 2], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'casa', gen: 'maze', cells: [3, 2], cell: [28, 14],
      script: [[house.gallery, house.roof, house.wing], [house.zaguan, house.patio, house.garden]],
      links: [{ from: [0, 1], to: [0, 0], at: [22, 11], toAt: [3, 11], look: 'mxCasaStairs' }, { kind: 'drop', from: [1, 0], to: [1, 1], at: [19, 0] }] },
    { id: 'tiendita', gen: 'room', role: 'secret', theme: THEMES.mx_mercado_cave ? 'mx_mercado_cave' : 'mx_casa_study', stamp: 'casaTienda', room: 'closing',
      closing: { title: 'XOLO\'S TIENDITA: AFTER HOURS', rule: 'XOLO DOZES BEHIND THE COUNTER. GRAB WHAT YOU CAN BEFORE THE SHUTTERS COME DOWN, TOP SHELF FIRST!', keeper: 'xolo', word: '¡CERRADO!', t: 14 } },
    { id: 'atico', gen: 'room', role: 'secret', theme: 'mx_casa_attic', stamp: 'casaAtico', room: 'topsy',
      topsy: { title: 'THE TOPSY-TURVY ATTIC', rule: 'EVERYTHING UP HERE HAS FALLEN UP! STEP OVER THE PAINTED LINE AND WALK ON THE CEILING', key: 'casa:cistern', keyLook: 'mxCasaKeyCistern' } },
    { id: 'aljibe', gen: 'room', role: 'secret', theme: 'mx_casa_cistern', stamp: 'casaAljibe', room: 'hourglass',
      hourglass: { title: 'THE HOURGLASS CISTERN', rule: 'PIWI FILLED THE OLD CISTERN WITH SAND. IT POURS THE MOMENT YOU LAND: CLIMB TO THE RIM!', key: 'casa:garden', keyLook: 'mxCasaKeyGarden', speed: 0.5, delay: 2.5 } },
    { id: 'pound', gen: 'room', role: 'secret', theme: 'mx_casa_pound', stamp: 'casaPound', room: 'ambush',
      ambush: { title: 'PIWI\'S PIÑATA POUND', rule: 'PIWI LOCKED UP EVERY PIÑATA IN MEXICO... AND THEY\'RE CROSS! STOMP THEM ALL', critters: ['mxBurro', 'mxPepper'], waves: [2, 3] } },
    { id: 'castillo', gen: 'room', role: 'secret', theme: 'mx_casa_castle', stamp: 'casaCastillo', room: 'bouncy',
      bouncy: { title: 'THE PIÑATA-DONKEY BOUNCY CASTLE', rule: 'THE FLOOR BOUNCES! ONLY THE TOWERS ARE FIRM. THE PRIZE IS ON THE TALLEST', skin: ['#ff5fa0', '#ffd84a', '#18c2c2'] } },
    { id: 'estudio', gen: 'room', role: 'secret', theme: 'mx_casa_study', stamp: 'casaEstudio', room: 'treasure',
      treasure: { title: 'THE PARROT\'S MAP ROOM', rule: 'A TORN TREASURE MAP ON A STAND. TAKE IT: X MARKS THE SPOT... SOMEWHERE IN THE COURTYARD', map: 'map:casa', mapLook: 'mxCasaMap' } },
    { id: 'under', gen: 'room', role: 'backstage', zone: 'under', theme: 'bk_under', stamp: 'casaUnder' },
    { id: 'wings', gen: 'room', role: 'backstage', zone: 'wings', theme: 'bk_wings', stamp: 'casaWings' }
  ] };

/* ================= the looks ================= */
// tiles: attic boards, cistern stone, a pound of stacked crates
const boards = {
  style: 'wood', cap: '#a8743e', capHi: '#d8a468', dirt: '#7a4e26', dirt2: '#4a2c14', rock: '#6a4428',
  paint(ctx, rng, o) {
    ctx.fillStyle = '#6a4224'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#7e5230'; for (let y = 1; y < TS; y += 8) ctx.fillRect(0, y, TS, 6);
    ctx.fillStyle = 'rgba(30,16,8,0.45)'; ctx.fillRect(((o.variant || 0) % 3) * 9 + 4, 0, 1.5, TS);
    if (rng() < 0.3) { ctx.fillStyle = '#4a2c14'; ctx.beginPath(); ctx.arc(6 + rng() * 20, 6 + rng() * 20, 1.6, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#a8743e'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#d8a468'; ctx.fillRect(x0, 0, x1 - x0, 1.5); }
};
const stone = {
  style: 'mineral', cap: '#b8b0a0', capHi: '#e8e0cc', dirt: '#8a8478', dirt2: '#5a564e', rock: '#9a9488',
  paint(ctx, rng, o) {
    ctx.fillStyle = '#7a766c'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#8e897e'; ctx.fillRect(1, 1, 14, 14); ctx.fillRect(17, 1, 14, 14); ctx.fillRect(9, 17, 14, 14);
    ctx.fillStyle = 'rgba(226,188,102,0.35)'; if (rng() < 0.4) ctx.fillRect(0, TS - 6, TS, 6);
  },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8bca4'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#f0e2b8'; ctx.fillRect(x0, 0, x1 - x0, 2); }
};
const crates = {
  style: 'crate', c1: '#9a7a4a', c2: '#6a4e2a', mortar: '#3a2a18',
  paint(ctx) {
    ctx.fillStyle = '#8a6a3e'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#5a4022'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, TS - 4, TS - 4); ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TS - 3, TS - 3); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(0.6, 0.6, TS - 1.2, TS - 1.2);
  }
};
const shelfSemi = { style: 'wood', c1: '#b8763e', c2: '#7a4a22',
  paint(ctx, part, x0, x1) { ctx.fillStyle = '#7a4a22'; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = '#c8864a'; ctx.fillRect(x0, 0, x1 - x0, 4); ctx.fillStyle = INK; ctx.fillRect(x0, 9, x1 - x0, 1.5); } };
// painted backdrops (drawn once into the theme's strip)
Object.assign(BGPaint, {
  // the attic: raw boards, sloping rafters, a round window with dusty light, cobwebs, old picture frames
  mxCasaAttic(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 22) { ctx.fillStyle = rgba(shade(L.color, (rng() - 0.5) * 0.25), 0.9); ctx.fillRect(x, 0, 20, H); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 20, 0, 2, H); }
    for (let x = 0; x < BG_W; x += 256) {
      // the roof slope: two rafters meeting over each bay, a tie beam
      ctx.strokeStyle = shade(L.color, -0.45); ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, L.base - 40); ctx.lineTo(x + 128, 40); ctx.lineTo(x + 256, L.base - 40); ctx.stroke();
      ctx.fillStyle = shade(L.color, -0.4); ctx.fillRect(x, L.base - 150, 256, 12);
      // the round window and its dusty beam
      ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.arc(x + 128, 150, 30, 0, TAU); ctx.fill();
      ctx.strokeStyle = shade(L.color, -0.5); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x + 128, 150, 30, 0, TAU); ctx.moveTo(x + 98, 150); ctx.lineTo(x + 158, 150); ctx.moveTo(x + 128, 120); ctx.lineTo(x + 128, 180); ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,180,0.12)'; ctx.beginPath(); ctx.moveTo(x + 110, 160); ctx.lineTo(x + 146, 160); ctx.lineTo(x + 200, L.base); ctx.lineTo(x + 60, L.base); ctx.closePath(); ctx.fill();
      // a cobweb in the corner of each bay
      ctx.strokeStyle = 'rgba(240,235,225,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 40, 80); ctx.lineTo(x + 40 + Math.cos(k * 0.4) * 50, 80 + Math.sin(k * 0.4) * 50); ctx.stroke(); } for (let r = 12; r < 50; r += 12) { ctx.beginPath(); ctx.arc(x + 40, 80, r, 0, 1.6); ctx.stroke(); }
      // an old frame leaning against the wall
      ctx.fillStyle = '#c8943a'; ctx.fillRect(x + 190, L.base - 70, 46, 60); ctx.fillStyle = '#5a7a8a'; ctx.fillRect(x + 196, L.base - 64, 34, 48);
    }
  },
  // the cistern: damp stone courses, sand drifting down the walls, an old rope
  mxCasaCistern(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, 0.1), shade(L.color, -0.45)); ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < H; y += 26) for (let x = (y / 26) % 2 ? -24 : 0; x < BG_W; x += 48) { ctx.fillStyle = rgba(shade(L.color, (rng() - 0.5) * 0.3), 0.6); rr(ctx, x + 2, y + 2, 44, 22, 4); ctx.fill(); }
    for (let x = 30; x < BG_W; x += 90 + rng() * 80) { ctx.fillStyle = 'rgba(226,188,102,0.22)'; ctx.fillRect(x, 0, 4 + rng() * 6, H); }
    for (let x = 60; x < BG_W; x += 300) { ctx.strokeStyle = '#a8906a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 12, H * 0.5, x - 6, H); ctx.stroke(); }
  },
  // Piwi's pound: purple-grey walls, chain-link pens of confiscated piñatas, CONFISCATED stencils
  mxCasaPound(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 200) {
      const px = x + 16, pw = 168, py = L.base - 200;
      ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(px, py, pw, 190);
      // piñatas behind the wire: stars and donkeys
      for (let k = 0; k < 3; k++) {
        const cx = px + 30 + k * 54, cy = py + 60 + (k % 2) * 60, col = PAPEL[Math.floor(rng() * PAPEL.length)];
        ctx.fillStyle = col; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, r = q % 2 ? 9 : 22; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,204,216,0.5)'; ctx.lineWidth = 1.5;
      for (let q = 0; q < pw; q += 10) { ctx.beginPath(); ctx.moveTo(px + q, py); ctx.lineTo(px + q + 10, py + 190); ctx.moveTo(px + q + 10, py); ctx.lineTo(px + q, py + 190); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,90,110,0.55)'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CONFISCATED', px + pw / 2, py - 14);
    }
  },
  // inside the inflatable: fat pillow stripes in piñata colours, seams, a mesh window
  mxCasaCastle(ctx, L, rng, H) {
    const cols = ['#ff5fa0', '#ffd84a', '#18c2c2', '#ff8a3a'];
    for (let x = 0, k = 0; x < BG_W; x += 64, k++) { ctx.fillStyle = cols[k % cols.length]; ctx.fillRect(x, 0, 64, H); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 10, 0, 12, H); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 58, 0, 6, H); }
    for (let y = 60; y < H; y += 90) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, y, BG_W, 5); }
    for (let x = 100; x < BG_W; x += 340) { ctx.fillStyle = '#9adcf0'; rr(ctx, x, L.base - 260, 120, 80, 30); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; for (let q = 0; q < 120; q += 8) { ctx.beginPath(); ctx.moveTo(x + q, L.base - 260); ctx.lineTo(x + q, L.base - 180); ctx.stroke(); } }
  },
  // the parrot's map room: bookshelves, rolled maps in a barrel, a big framed map with a dotted trail
  mxCasaStudy(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 256) {
      // a bookcase
      ctx.fillStyle = shade(L.color, -0.45); ctx.fillRect(x + 10, L.base - 300, 110, 300);
      for (let s = 0; s < 4; s++) { const sy = L.base - 290 + s * 72; ctx.fillStyle = shade(L.color, -0.6); ctx.fillRect(x + 14, sy + 60, 102, 8); for (let b = 0; b < 8; b++) { ctx.fillStyle = PAPEL[Math.floor(rng() * PAPEL.length)]; const bh = 36 + rng() * 22; ctx.fillRect(x + 18 + b * 12, sy + 60 - bh, 10, bh); } }
      // a framed map
      ctx.fillStyle = '#c8943a'; ctx.fillRect(x + 140, L.base - 260, 100, 76); ctx.fillStyle = '#f2dca0'; ctx.fillRect(x + 146, L.base - 254, 88, 64);
      ctx.fillStyle = '#7ab06a'; ctx.beginPath(); ctx.ellipse(x + 180, L.base - 222, 28, 16, 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a5a2a'; for (let q = 0; q < 7; q++) ctx.fillRect(x + 156 + q * 9, L.base - 204 - Math.sin(q) * 8, 3, 3);
      ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 214, L.base - 230); ctx.lineTo(x + 224, L.base - 220); ctx.moveTo(x + 224, L.base - 230); ctx.lineTo(x + 214, L.base - 220); ctx.stroke();
    }
  }
});
{
  // the courtyard: Mexico's blue afternoon over the house's own arcade with bougainvillea (the hacienda's arches strip)
  const H0 = THEMES.mx_hacienda_in || THEMES.mx_hacienda || THEMES.mx_mercado;
  const arches = (H0.layers && H0.layers[1]) || { kind: 'mxArches', color: '#f2d8b0', base: 360, f: 0.15 };
  THEMES.mx_casa = Object.assign({}, H0, {
    name: 'Casa de Sorpresas', music: 'tour_mx', particles: 'petals', rays: '#fff0c0',
    sky: ['#3ab0e0', '#9adcf0', '#fff0c8'], horizonGlow: '#ffe0a0', celestial: { type: 'sun', x: 0.8, y: 0.16, r: 34, color: '#fff8dc', glow: '#ffd27a' }, stars: 0, darkness: 0, cloudsDyn: true,
    layers: [{ kind: 'mxVolcano', color: '#9ab0c8', base: 300, h: 120, f: 0.02, blur: true, snow: true, at: 520 }, arches],
    fog: '#ffe8d0', decor: ['mxPots', 'mxNopal', 'mxPots', 'mxAgaveP']
  });
  // the rooms (an interior theme each, so none falls back to the courtyard's cave look)
  const base = Object.assign({}, THEMES.mx_bodega || H0, {
    music: 'tour_mx', particles: 'dust', cave: true, celestial: { type: 'none' }, stars: 0, cloudsDyn: false, rays: null,
    ground: boards, semi: shelfSemi, brick: crates, hard: { c1: '#8a6a4a', c2: '#5a3e24' }, decor: ['mxPots'], atlas: null
  });
  const mk = (name, extra) => Object.assign({}, base, { name }, extra);
  THEMES.mx_casa_attic = mk('The Attic', { sky: ['#3a2416', '#5a3820', '#7a4e2a'], horizonGlow: '#ffc890', darkness: 0.15, fog: '#5a3820', layers: [{ kind: 'mxCasaAttic', color: '#8a5a32', base: 420, f: 0.12 }] });
  THEMES.mx_casa_cistern = mk('The Old Cistern', { sky: ['#2a3038', '#4a5058', '#6a6a62'], horizonGlow: '#e2bc66', darkness: 0.18, fog: '#6a6a62', ground: stone, hard: { c1: '#9a9488', c2: '#5a564e' }, particles: 'dust', layers: [{ kind: 'mxCasaCistern', color: '#6a6e74', base: 0, f: 0.1 }] });
  THEMES.mx_casa_pound = mk('Piwi\'s Piñata Pound', { sky: ['#1e1626', '#3a2a46', '#4a3a56'], horizonGlow: '#b46aff', darkness: 0.2, fog: '#3a2a46', layers: [{ kind: 'mxCasaPound', color: '#4a3e58', base: 420, f: 0.12 }] });
  THEMES.mx_casa_castle = mk('The Bouncy Castle', { sky: ['#ff9ac8', '#ffd0e4', '#fff0f6'], horizonGlow: '#ffffff', darkness: 0, fog: '#ffd0e4', particles: 'confetti', layers: [{ kind: 'mxCasaCastle', color: '#ff5fa0', base: 420, f: 0.1 }] });
  THEMES.mx_casa_study = mk('The Parrot\'s Map Room', { sky: ['#2a1a12', '#4a2e1c', '#6a4228'], horizonGlow: '#ffd890', darkness: 0.12, fog: '#4a2e1c', layers: [{ kind: 'mxCasaStudy', color: '#7a4e2e', base: 420, f: 0.12 }] });
}

/* ---------- props (Decor: drawn every frame, plain shapes, no per-frame objects) ---------- */
const RAILS = ['#ff5fa0', '#ffd84a', '#18c2c2'];
Object.assign(Decor, {
  // the zaguán's big front doors, swung open onto the street, a velvet curtain stirring in the doorway (the Wings)
  mxCasaZaguan(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const x0 = x - 16;
    ctx.fillStyle = '#e8c890'; ctx.fillRect(x0 - 6, y - 140, 64, 8); ctx.strokeRect(x0 - 6, y - 140, 64, 8);
    // the open door leaf against the wall
    ctx.fillStyle = '#8a4e22'; ctx.beginPath(); ctx.moveTo(x0 + 34, y - 132); ctx.lineTo(x0 + 52, y - 124); ctx.lineTo(x0 + 52, y - 6); ctx.lineTo(x0 + 34, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3440'; ctx.fillRect(x0 + 38, y - 100, 10, 3); ctx.fillRect(x0 + 38, y - 40, 10, 3);
    // the curtain in the doorway
    const sw = Math.sin(t * 2.2) * 5;
    ctx.fillStyle = '#5a0c22'; ctx.beginPath(); ctx.moveTo(x0 - 6, y - 132); ctx.lineTo(x0 + 26, y - 132); ctx.quadraticCurveTo(x0 + 30 + sw, y - 66, x0 + 22 + sw * 1.6, y); ctx.lineTo(x0 - 6, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a1430'; ctx.fillRect(x0 + 6, y - 132, 5, 132); ctx.fillStyle = '#e8b83a'; ctx.fillRect(x0 - 6, y - 132, 32, 5);
    ctx.restore();
  },
  // a potted orange tree
  mxCasaTree(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#c8642a'; ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x + 14, y - 22); ctx.lineTo(x + 10, y); ctx.lineTo(x - 10, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 54, 6, 32);
    const sw = Math.sin(t * 1.3) * 1.5;
    ctx.fillStyle = '#3f8a3a'; ctx.beginPath(); ctx.arc(x + sw, y - 70, 26, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#57a84a'; ctx.beginPath(); ctx.arc(x - 8 + sw, y - 78, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff9a2a'; for (const [dx, dy] of [[-12, -64], [10, -78], [14, -58], [-2, -88], [-16, -82]]) { ctx.beginPath(); ctx.arc(x + dx + sw, y + dy, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a string of papel picado across the courtyard
  mxCasaPapel(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.2;
    const y0 = y - 20, w = 150;
    ctx.beginPath(); ctx.moveTo(x - w, y0); ctx.quadraticCurveTo(x, y0 + 18, x + w, y0); ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const u = (k + 0.5) / 12, fx = x - w + u * 2 * w, fy = y0 + 18 * 2 * u * (1 - u) * 2 * 0.5 + 1, sw = Math.sin(t * 3 + k) * 1.5;
      ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.fillRect(fx - 8 + sw, fy, 16, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(fx - 4 + sw, fy + 4, 3, 3); ctx.fillRect(fx + 1 + sw, fy + 4, 3, 3); ctx.fillRect(fx - 2 + sw, fy + 9, 4, 2);
    }
    ctx.restore();
  },
  // the courtyard well: a stone ring over the dark shaft (bricks either side are its rim), a pulley frame, the bucket
  // on its rope with a yellow tag swinging in the draught, and a glimpse of a crash mat right at the bottom
  mxCasaWell(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#1a1018'; ctx.fillRect(x - 47, y, 94, 2 * TS);
    ctx.fillStyle = '#f2d23a'; ctx.fillRect(x - 40, y + 2 * TS - 8, 80, 8); ctx.fillStyle = '#1a1416'; for (let q = -36; q < 40; q += 14) ctx.fillRect(x + q, y + 2 * TS - 8, 6, 8);
    // the frame and the pulley
    ctx.fillStyle = '#7a4e26'; ctx.fillRect(x - 46, y - 92, 8, 92); ctx.strokeRect(x - 46, y - 92, 8, 92); ctx.fillRect(x + 38, y - 92, 8, 92); ctx.strokeRect(x + 38, y - 92, 8, 92);
    ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(x - 58, y - 88); ctx.lineTo(x, y - 116); ctx.lineTo(x + 58, y - 88); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a5866'; ctx.beginPath(); ctx.arc(x, y - 82, 7, 0, TAU); ctx.fill(); ctx.stroke();
    const sw = Math.sin(t * 1.7) * 4;
    ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 82); ctx.lineTo(x + sw, y - 34); ctx.stroke();
    ctx.fillStyle = '#8a8a96'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x - 9 + sw, y - 34); ctx.lineTo(x + 9 + sw, y - 34); ctx.lineTo(x + 7 + sw, y - 20); ctx.lineTo(x - 7 + sw, y - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2d23a'; rr(ctx, x + 10 + sw * 1.4, y - 30, 24, 10, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1416'; ctx.font = '5px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CREW', x + 22 + sw * 1.4, y - 25);
    ctx.restore();
  },
  // the roof's water tank on its stand
  mxCasaTank(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a5866'; ctx.fillRect(x - 24, y - 26, 4, 26); ctx.fillRect(x + 20, y - 26, 4, 26);
    ctx.fillStyle = '#2a2a34'; rr(ctx, x - 28, y - 74, 56, 50, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a4a58'; ctx.fillRect(x - 28, y - 60, 56, 4); ctx.fillRect(x - 28, y - 42, 56, 4);
    ctx.fillStyle = '#3a3a46'; ctx.beginPath(); ctx.ellipse(x, y - 74, 16, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a washing line with tea towels and a sombrero-shaped party hat pegged to dry
  mxCasaLaundry(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a4e26'; ctx.fillRect(x - 64, y - 90, 5, 90); ctx.fillRect(x + 40, y - 90, 5, 90);
    ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 61, y - 86); ctx.quadraticCurveTo(x - 10, y - 74, x + 42, y - 86); ctx.stroke();
    const cols = ['#ff5fa0', '#ffffff', '#18c2c2', '#ffd84a'];
    for (let k = 0; k < 4; k++) { const fx = x - 50 + k * 24, fy = y - 82 + Math.sin(k * 0.8) * 3, sw = Math.sin(t * 2 + k) * 2; ctx.fillStyle = cols[k]; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx - 8, fy); ctx.lineTo(fx + 8, fy); ctx.lineTo(fx + 7 + sw, fy + 22); ctx.lineTo(fx - 7 + sw, fy + 22); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // a painting of a parrot holding a torn map, hung beside a hairline crack (the tell for the hidden map room)
  mxCasaParrotPainting(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const y0 = y - 108;
    ctx.fillStyle = '#c8943a'; ctx.fillRect(x - 26, y0, 52, 60); ctx.strokeRect(x - 26, y0, 52, 60);
    ctx.fillStyle = '#9adcf0'; ctx.fillRect(x - 20, y0 + 6, 40, 48);
    ctx.fillStyle = '#4ab04a'; ctx.beginPath(); ctx.ellipse(x - 2, y0 + 30, 10, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(x - 2, y0 + 16, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x + 4, y0 + 15); ctx.lineTo(x + 11, y0 + 18); ctx.lineTo(x + 4, y0 + 21); ctx.fill();
    ctx.fillStyle = '#f2dca0'; ctx.fillRect(x + 4, y0 + 30, 12, 12); ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 7, y0 + 33); ctx.lineTo(x + 13, y0 + 39); ctx.moveTo(x + 13, y0 + 33); ctx.lineTo(x + 7, y0 + 39); ctx.stroke();
    ctx.fillStyle = '#6a3a1a'; ctx.font = FONT7; ctx.textAlign = 'center'; ctx.fillText('→', x + 34, y0 + 44 + Math.sin(t * 4) * 1.5);
    ctx.restore();
  },
  // the hourglass's neck high in the cistern, pouring a stream of sand down to wherever the sand has risen to
  mxCasaHourglass(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const y0 = y - 5 * TS;
    ctx.fillStyle = '#c8943a'; ctx.fillRect(x - 60, y0 - 6, 120, 10); ctx.strokeRect(x - 60, y0 - 6, 120, 10);
    ctx.fillStyle = 'rgba(220,240,255,0.55)'; ctx.beginPath(); ctx.moveTo(x - 54, y0 + 4); ctx.lineTo(x + 54, y0 + 4); ctx.lineTo(x + 6, y0 + 52); ctx.lineTo(x - 6, y0 + 52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2bc66'; ctx.beginPath(); ctx.moveTo(x - 30, y0 + 28); ctx.lineTo(x + 30, y0 + 28); ctx.lineTo(x + 5, y0 + 52); ctx.lineTo(x - 5, y0 + 52); ctx.closePath(); ctx.fill();
    // the stream: down to the sand (the play's sand line when it is pouring)
    const g = typeof Game !== 'undefined' && Game.scene, A = g && g.area, sandY = A && A.risingLava && A.risingLava.speed > 0 && g.lavaY ? g.lavaY : null;
    if (sandY != null && sandY > y0 + 52) {
      ctx.fillStyle = 'rgba(226,188,102,0.85)'; ctx.fillRect(x - 2.5, y0 + 52, 5, sandY - y0 - 52);
      ctx.fillStyle = 'rgba(255,240,200,0.7)'; for (let k = 0; k < 6; k++) { const ph = (t * 1.8 + k / 6) % 1; ctx.fillRect(x - 1, y0 + 52 + ph * (sandY - y0 - 52), 2, 6); }
    }
    ctx.restore();
  },
  // the attic's dusty boxes
  mxCasaAtticBoxes(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c8a06a'; ctx.fillRect(x - 22, y - 22, 26, 22); ctx.strokeRect(x - 22, y - 22, 26, 22);
    ctx.fillStyle = '#a87e4a'; ctx.fillRect(x + 2, y - 14, 20, 14); ctx.strokeRect(x + 2, y - 14, 20, 14);
    ctx.fillStyle = '#d8b880'; ctx.fillRect(x - 14, y - 34, 18, 12); ctx.strokeRect(x - 14, y - 34, 18, 12);
    ctx.fillStyle = 'rgba(80,50,30,0.6)'; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('PAPEL', x - 9, y - 9);
    ctx.restore();
  },
  // furniture that has fallen up onto the ceiling (seed: 0 wardrobe, 1 trunk, 2 rocking chair, 3 rug, 4 lamp, 5 portrait)
  mxCasaFallen(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, k = d.seed;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    if (k === 0) { ctx.fillStyle = '#8a4e22'; ctx.fillRect(x0 + 2, y, w - 4, h - 4); ctx.strokeRect(x0 + 2, y, w - 4, h - 4); ctx.fillStyle = '#a8642e'; ctx.fillRect(x0 + 6, y + 8, w / 2 - 8, h - 22); ctx.fillRect(x + 2, y + 8, w / 2 - 8, h - 22); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 5, y + h * 0.5, 3, 6); ctx.fillRect(x + 2, y + h * 0.5, 3, 6); ctx.fillStyle = '#6a3a1a'; ctx.fillRect(x0 + 6, y + h - 6, 6, 6); ctx.fillRect(x0 + w - 12, y + h - 6, 6, 6); }
    else if (k === 1) { ctx.fillStyle = '#4a7a9a'; rr(ctx, x0 + 2, y, w - 4, h - 2, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d8a83a'; ctx.fillRect(x0 + 2, y + h * 0.45, w - 4, 5); ctx.fillRect(x - 5, y + h * 0.3, 10, 12); ctx.fillStyle = '#ff5fa0'; ctx.fillRect(x0 + 10, y + 6, 14, 8); }
    else if (k === 2) { ctx.fillStyle = '#c87a3a'; ctx.fillRect(x0 + 6, y, w - 12, h * 0.55); ctx.strokeRect(x0 + 6, y, w - 12, h * 0.55); ctx.fillRect(x0 + 6, y + h * 0.55, w - 12, 6); ctx.strokeRect(x0 + 6, y + h * 0.55, w - 12, 6); ctx.beginPath(); ctx.moveTo(x0 + 8, y + h * 0.6); ctx.lineTo(x0 + 6, y + h - 6); ctx.moveTo(x0 + w - 8, y + h * 0.6); ctx.lineTo(x0 + w - 6, y + h - 6); ctx.stroke(); ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y + h - 30, w * 0.6, 0.35, Math.PI - 0.35); ctx.stroke(); }
    else if (k === 3) { ctx.fillStyle = '#c0392b'; ctx.fillRect(x0, y, w, 7); ctx.fillStyle = '#ffd84a'; for (let q = 4; q < w - 4; q += 10) ctx.fillRect(x0 + q, y + 2, 5, 3); ctx.strokeRect(x0, y, w, 7); }
    else if (k === 4) { ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 8, y, 16, 5); ctx.fillRect(x - 2, y, 4, h - 22); ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(x - 14, y + h); ctx.lineTo(x + 14, y + h); ctx.lineTo(x + 8, y + h - 22); ctx.lineTo(x - 8, y + h - 22); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#c8943a'; ctx.fillRect(x0, y, w, h); ctx.strokeRect(x0, y, w, h); ctx.fillStyle = '#5a7a8a'; ctx.fillRect(x0 + 5, y + 5, w - 10, h - 10); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y + h - 18, 7, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // the parrot on its perch in the map room (it bobs and says where the X is)
  mxCasaParrot(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#7a4e26'; ctx.fillRect(x - 2, y - 70, 4, 70); ctx.fillRect(x - 14, y - 4, 28, 4); ctx.fillRect(x - 16, y - 70, 32, 4); ctx.strokeRect(x - 16, y - 70, 32, 4);
    const b = Math.sin(t * 3) * 2;
    ctx.fillStyle = '#4ab04a'; ctx.beginPath(); ctx.ellipse(x, y - 86 + b, 9, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a7ad8'; ctx.beginPath(); ctx.moveTo(x - 3, y - 76 + b); ctx.lineTo(x - 7, y - 60); ctx.lineTo(x + 3, y - 76 + b); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(x + 1, y - 100 + b, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x + 6, y - 102 + b); ctx.quadraticCurveTo(x + 14, y - 100 + b, x + 8, y - 94 + b); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 2, y - 102 + b, 2, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 2.6, y - 102 + b, 1, 0, TAU); ctx.fill();
    if (Math.floor(t / 3) % 2) { ctx.fillStyle = '#fff8e0'; rr(ctx, x - 70, y - 136, 72, 20, 6); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SQUAWK! X MARKS', x - 34, y - 130); ctx.fillText('THE SPOT!', x - 34, y - 122); }
    ctx.restore();
  },
  // a little globe on a stand
  mxCasaGlobe(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a4e26'; ctx.fillRect(x - 10, y - 4, 20, 4); ctx.fillRect(x - 2, y - 24, 4, 20);
    ctx.fillStyle = '#4aa8e8'; ctx.beginPath(); ctx.arc(x, y - 40, 16, 0, TAU); ctx.fill(); ctx.stroke();
    const sp = (t * 0.6) % 1;
    ctx.fillStyle = '#5ad04a'; ctx.beginPath(); ctx.ellipse(x - 14 + sp * 28, y - 42, 6, 9, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c8943a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 40, 20, -1.9, 1.9); ctx.stroke();
    ctx.restore();
  },
  // the Wings' prop table: spare piñatas, a maraca, a spare dummy hand
  mxCasaPropTable(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 40, y - 30, 80, 6); ctx.strokeRect(x - 40, y - 30, 80, 6); ctx.fillRect(x - 36, y - 24, 5, 24); ctx.fillRect(x + 31, y - 24, 5, 24);
    for (let k = 0; k < 3; k++) { const cx = x - 24 + k * 22, cy = y - 44; ctx.fillStyle = PAPEL[k * 2]; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, r = q % 2 ? 4 : 10; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#f2d23a'; ctx.fillRect(x - 40, y - 64, 40, 10); ctx.fillStyle = '#1a1416'; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('PROPS · CASA', x - 20, y - 57);
    ctx.restore();
  }
});

/* ---------- door looks (TOUR_SKINS: drawn for the door at e = { x, y, w, h, cx, near, door }) ---------- */
const skins = {
  // Xolo's tiendita: a shop window with its shutter half down, a CERRADO sign, light under the shutter
  mxCasaShopDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#e8be86'; ctx.fillRect(x - 58, y - 84, 116, 84); ctx.strokeRect(x - 58, y - 84, 116, 84);
    ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x - 62, y - 92, 124, 12); ctx.strokeRect(x - 62, y - 92, 124, 12);
    ctx.fillStyle = '#fff4e0'; ctx.font = FONT8; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LA TIENDITA DE XOLO', x, y - 86);
    // the window, its shutter half down, warm light under it
    ctx.fillStyle = '#ffd890'; ctx.fillRect(x - 52, y - 72, 30, 50); ctx.fillRect(x + 22, y - 72, 30, 50);
    ctx.fillStyle = '#8a8a96'; ctx.fillRect(x - 52, y - 72, 30, 30); ctx.fillRect(x + 22, y - 72, 30, 30);
    ctx.fillStyle = '#a8a8b4'; for (let q = 0; q < 30; q += 6) { ctx.fillRect(x - 52, y - 72 + q, 30, 3); ctx.fillRect(x + 22, y - 72 + q, 30, 3); }
    ctx.strokeRect(x - 52, y - 72, 30, 50); ctx.strokeRect(x + 22, y - 72, 30, 50);
    // the door
    ctx.fillStyle = e.near ? '#3a2416' : '#7a4a22'; rr(ctx, x - 15, y - 50, 30, 50, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 9, y - 25, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.save(); ctx.translate(x, y - 40); ctx.rotate(Math.sin(t * 2) * 0.1); rr(ctx, -14, 0, 28, 10, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '6px ' + FONT_DISPLAY; ctx.fillText('CERRADO', 0, 5.5); ctx.restore();
  },
  // the stairs up (an arched doorway, tiled steps rising inside it)
  mxCasaStairs(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#e8be86'; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 24, y - 52); ctx.arc(x, y - 52, 24, Math.PI, 0); ctx.lineTo(x + 24, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x - 17, y - 50); ctx.arc(x, y - 50, 17, Math.PI, 0); ctx.lineTo(x + 17, y); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#2a8ad8' : '#f4f0e0'; ctx.fillRect(x - 17 + k * 7, y - 8 - k * 9, 34 - k * 7, 8); }
    ctx.fillStyle = '#ffd84a'; ctx.font = FONT7; ctx.textAlign = 'center'; ctx.fillText('↑ ARRIBA', x, y - 82);
  },
  // the attic door: narrow, with a little ÁTICO plaque and a ladder painted beside it
  mxCasaAtticDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = e.near ? '#3a2416' : '#6a8a4a'; rr(ctx, x - 14, y - 52, 28, 52, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a6a3a'; ctx.fillRect(x - 10, y - 46, 20, 18); ctx.fillRect(x - 10, y - 24, 20, 18);
    ctx.fillStyle = '#f4f0e0'; rr(ctx, x - 16, y - 66, 32, 11, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ÁTICO ↕', x, y - 60);
  },
  // the cistern hatch: a stone housing with a wooden hatch door, a bucket hook
  mxCasaHatch(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#9a9488'; rr(ctx, x - 26, y - 62, 52, 62, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a766c'; for (let q = 0; q < 3; q++) ctx.fillRect(x - 24, y - 52 + q * 16, 48, 3);
    ctx.fillStyle = e.near ? '#2a1a10' : '#8a5a2a'; rr(ctx, x - 13, y - 44, 26, 44, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2bc66'; ctx.fillRect(x - 10, y - 4, 20, 4);
    ctx.fillStyle = '#f4f0e0'; rr(ctx, x - 22, y - 78, 44, 12, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ALJIBE', x, y - 72);
  },
  // Piwi's pound: a purple door with a hatch, his gold P, a KEEP OUT plate
  mxCasaPoundDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = e.near ? '#2a1a30' : '#5a4a6a'; rr(ctx, x - 16, y - 56, 32, 56, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8b04a'; ctx.font = FONT14; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', x, y - 36);
    ctx.fillStyle = '#f2d23a'; rr(ctx, x - 26, y - 74, 52, 14, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.fillText('PIÑATA POUND', x, y - 67);
  },
  // the bouncy castle: a big inflatable piñata donkey with a flap for a door
  mxCasaBouncyDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, wob = Math.sin(t * 3) * 1.5;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the body (a fat cushion), the fringe stripes, four stubby legs
    ctx.fillStyle = '#ff5fa0'; rr(ctx, x - 62, y - 60 + wob, 124, 52, 22); ctx.fill(); ctx.stroke();
    for (let r = 0; r < 3; r++) { ctx.fillStyle = PAPEL[(r + 1) % PAPEL.length]; ctx.fillRect(x - 52, y - 50 + r * 12 + wob, 104, 5); }
    ctx.fillStyle = '#ffd84a'; for (const lx of [-50, -26, 18, 42]) { rr(ctx, x + lx, y - 12, 14, 12, 4); ctx.fill(); ctx.stroke(); }
    // the head and ears, the tail
    ctx.fillStyle = '#ff5fa0'; rr(ctx, x + 40, y - 96 + wob, 30, 46, 12); ctx.fill(); ctx.stroke(); rr(ctx, x + 52, y - 90 + wob, 34, 22, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x + 44, y - 94 + wob); ctx.lineTo(x + 46, y - 120 + wob); ctx.lineTo(x + 54, y - 94 + wob); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 56, y - 94 + wob); ctx.lineTo(x + 64, y - 118 + wob); ctx.lineTo(x + 66, y - 92 + wob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 70, y - 82 + wob, 2.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#18c2c2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 62, y - 44 + wob); ctx.quadraticCurveTo(x - 82, y - 40, x - 76, y - 20); ctx.stroke();
    // the flap
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = e.near ? '#7a2a4a' : '#c83a7a'; rr(ctx, x - 14, y - 44 + wob, 28, 36, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4e0'; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¡BOING!', x, y - 50 + wob);
  },
  // the flap seen from inside the bouncy castle
  mxCasaBouncyFlap(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = e.near ? '#7a2a4a' : '#c83a7a'; rr(ctx, x - 15, y - 50, 30, 50, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 8, y - 42, 4, 30);
  }
};

Tour.amend('mx', { stamps, skins, levels: [L7] });

/* ================= Piwi's House Rule 7 opens 1-7 ================= */
// RULE 7: NO HATS ON ANIMALS (its Brady Button is on Brazil 3-1's Loading Dock) now also opens the Casa: the level is
// unlocked, and Mexico's map grows a gold trail from 1-5 (the hacienda) to the Casa's stop, which pops up
if (typeof TOUR_RULES !== 'undefined' && TOUR_RULES[7] && typeof TourRules !== 'undefined') {
  TOUR_RULES[7].opens = ['1-7'];
  const rv0 = TourRules.revoke;
  TourRules.revoke = function (n, at) {
    const out = rv0.call(this, n, at);
    if (!out.length) return out;
    const T = TourProgress.data();
    // a rule-opened secret level gets its trail first (the map draws the trail, then the stop pops at its end)
    for (const r of out.slice()) {
      if (r.kind !== 'stop') continue;
      const L = Tour.specOf(r.id), Cc = Tour.countries[r.cc]; if (!L || !Cc) continue;
      const to = TourProgress.stopIndex(Cc, r.id), from = [].concat(L.mapFrom != null ? L.mapFrom : to - 1)[0];
      if (from == null || from < 0 || T.paths[r.cc + ':' + from + '>' + to]) continue;
      const pr = { kind: 'path', cc: r.cc, from, to, gold: true };
      if (T.pending.some(q => JSON.stringify(q) === JSON.stringify(pr))) continue;
      const k = T.pending.findIndex(q => JSON.stringify(q) === JSON.stringify(r));
      T.pending.splice(k < 0 ? T.pending.length : k, 0, pr);
      out.splice(out.indexOf(r), 0, pr);
    }
    Save.save();
    return out;
  };
  // the REVOKED card says what opened in Mexico
  if (typeof TourRuleCut !== 'undefined') {
    const dr0 = TourRuleCut.draw;
    TourRuleCut.draw = function (ctx, play, F) {
      dr0.call(this, ctx, play, F);
      if (F.rule !== 7 || !F.reveals || !F.reveals.some(r => r.kind === 'stop' && r.id === '1-7') || F.t < 1.6 || F.t > 5) return;
      const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH, k = clamp((F.t - 1.6) / 0.3, 0, 1) * clamp((5 - F.t) / 0.3, 0, 1);
      ctx.save(); ctx.globalAlpha = k;
      const w = Math.min(W - 30, 380), x0 = (W - w) / 2, y0 = Math.min(H - 64, H / 2 + 104);
      ctx.fillStyle = '#ff3d8b'; ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 2.5; rr(ctx, x0, y0, w, 34, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = FONT11; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('NEW IN MEXICO: 1-7 CASA DE SORPRESAS!', W / 2, y0 + 17, w - 20);
      ctx.restore();
    };
  }
}

/* ================= Mexico's map: the Casa's stop, its gold trail from the hacienda, its little scene ================= */
if (typeof TOUR_OW_MAPS !== 'undefined' && TOUR_OW_MAPS.mx) {
  const M = TOUR_OW_MAPS.mx;
  M.nodes = M.nodes || {}; if (!M.nodes['1-7']) M.nodes['1-7'] = [560, 440];
  M.paths = M.paths || {}; if (!M.paths['1-5>1-7']) M.paths['1-5>1-7'] = [[690, 360]];
  M.labels = M.labels || {}; if (!M.labels['1-7']) M.labels['1-7'] = 'Casa';
  M.scenes = M.scenes || {}; if (!M.scenes['1-7']) M.scenes['1-7'] = 'casa';
}
if (typeof TourOWScenes !== 'undefined' && !TourOWScenes.kinds.casa) {
  // a little house round a courtyard: a ring of terracotta roofs, a well in the middle, an orange tree, papel picado
  TourOWScenes.kinds.casa = {
    paint(c, S) {
      const p = S.anchor(40); if (!p) return; S.mem.p = p;
      this.base(c, S, p, 44, 24, '#e8cfa0', '#c8a878');
      const T = TourOWScenes;
      // the house: three wings round the courtyard
      for (const [dx, dy, w] of [[-26, -10, 18], [0, -16, 30], [26, -10, 18]]) { T.R(c, p.x + dx - w / 2, p.y + dy - 12, w, 12, S.col('#f2d8b0')); T.P(c, [[p.x + dx - w / 2 - 2, p.y + dy - 12], [p.x + dx, p.y + dy - 20], [p.x + dx + w / 2 + 2, p.y + dy - 12]], S.col('#d0603a')); }
      c.fillStyle = '#3a2a3a'; c.fillRect(p.x - 2, p.y - 34, 4, 6);
      // the well and the orange tree in the courtyard
      T.O(c, p.x - 4, p.y + 4, 4, S.col('#9a9488'), 2.5); c.fillStyle = '#1a1018'; c.beginPath(); c.ellipse(p.x - 4, p.y + 3.5, 2.2, 1.2, 0, 0, TAU); c.fill();
      T.O(c, p.x + 12, p.y, 5, S.col('#3f8a3a')); c.fillStyle = S.col('#ff9a2a'); c.beginPath(); c.arc(p.x + 10, p.y - 1, 1.3, 0, TAU); c.arc(p.x + 14, p.y + 1, 1.3, 0, TAU); c.fill();
    },
    live(ctx, S, t) {
      const p = S.mem.p; if (!p) return;
      // papel picado fluttering over the courtyard
      ctx.lineWidth = 0.8; ctx.strokeStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(p.x - 20, p.y - 6); ctx.quadraticCurveTo(p.x, p.y - 1, p.x + 20, p.y - 6); ctx.stroke();
      for (let k = 0; k < 5; k++) { const u = (k + 0.5) / 5, x = p.x - 20 + u * 40, y = p.y - 6 + 5 * 4 * u * (1 - u) * 0.5; ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.fillRect(x - 2.5, y + Math.sin(t * 4 + k) * 0.8, 5, 5); }
    }
  };
}

// the map's info card names a bonus level as one
if (typeof TourLandscape !== 'undefined' && TourLandscape.ARCH_LABEL && !TourLandscape.ARCH_LABEL.bonus) TourLandscape.ARCH_LABEL.bonus = 'BONUS';

try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourCasa = { level: L7, house, stamps }; } } catch (e) { /* not in a browser */ }
})();
