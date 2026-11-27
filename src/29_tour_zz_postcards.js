/* ============================================================
   World tour: what Chinka-O's postcards are worth (docs/design/POSTCARD_REWARDS.md).
   A reward ladder over the three postcards of every level:
   - a level, all three found: the results screen fans the cards out and a
     postmark thumps down; the first time, one extra life. The level's stop
     on the land map wears a postcard stamp.
   - a land, every postcard: Chinka-O sends a CARE PACKAGE (a card on the map
     with a note about the land) holding the next perk of one reward track:
     cosmetics for Brady and small helpers, alternating; after the track runs
     out each package holds three lives.
   - the whole game, every postcard: three story panels from Chinka-O and the
     Golden Cape. Save.data.allPostcards (and TourPostcards.all()) is the flag a
     future hidden land can open with.
   - the POSTCARD ALBUM (title chip, the map's pause menu, the land chip,
     Settings > POSTCARD PERKS): every postcard by land, the missing ones as
     dotted outlines with the level id; the perks page switches each perk.
   Old saves: rewards for postcards already found are granted on the first
   load, quietly, with one summary card on the map; nothing is ever taken away.
   Everything here wraps the engine; no level changes.
   ============================================================ */
(() => {
if (typeof Tour === 'undefined' || typeof TourProgress === 'undefined' || typeof Save === 'undefined') return;

/* ---------- the reward track (one perk per completed land, in the order the lands are completed) ---------- */
const PERKS = [
  { id: 'cape', kind: 'look', name: 'POSTCARD CAPE', desc: 'A cape printed with her stamps. It flaps when you run.' },
  { id: 'compass', kind: 'help', name: 'POSTCARD COMPASS', desc: 'An arrow at the screen edge points to a postcard you still need.' },
  { id: 'shades', kind: 'look', name: 'GOLDEN SHADES', desc: 'Gold rims on the shades, and a glint now and then.' },
  { id: 'gift', kind: 'help', name: 'GIFT BOX', desc: 'Every level starts with a gift dropping in: a Magic Mushroom, or a Joint if you\'re big.' },
  { id: 'hearts', kind: 'look', name: 'HEART TRAIL', desc: 'Little pink hearts follow you when you run.' },
  { id: 'magnet', kind: 'help', name: 'MAGNET START', desc: 'The Magnet Belt for the first 20 seconds of every level.' },
  { id: 'stamps', kind: 'look', name: 'STAMP STEPS', desc: 'Every landing leaves a passport stamp for a moment.' }
];
const FINAL = { id: 'gold', kind: 'look', name: 'GOLDEN CAPE', desc: 'Every postcard in the world: the cape turns gold, with her kiss on it.' };
const LIVES_PACK = 3;   // what a care package holds once the track has run out
const NOTES = {
  mx: 'Every postcard from Mexico! I ate one taco per postcard. Do not count.',
  ec: 'All of Ecuador! I stood on the equator and half of me had summer.',
  br: 'Every card from Brazil! The samba school says you can join once you stop dancing like Pupo.',
  mz: 'All of Mozambique! A crab carried this parcel halfway. Sideways.',
  ma: 'Every card from Morocco! I haggled for the box. I now own three carpets.',
  es: 'All of Spain! They threw tomatoes at me. I chose to take it as a compliment.',
  fr: 'Every French postcard! The baguette was longer than the box, so I bent it. Sorry.',
  nl: 'All of Amsterdam! I cycled to the post office. Then I cycled into a canal.',
  id: 'Every card from Bali! A monkey stole the first parcel. This is the second one. Guard it.',
  vn: 'All of Vietnam! I crossed the road with forty scooters. All forty waved.',
  jp: 'Every postcard from Japan! I bowed to a vending machine and it gave me a free tea.',
  np: 'All of Nepal! A yak carried this up a mountain and back down to the post office. Tip the yak.',
  it: 'Every card from Italy! I asked for a small pizza. There is no small pizza.',
  ke: 'All of Kenya! A giraffe licked the stamp for me. Very long tongue. Very sticky stamp.',
  au: 'Every card from Australia! Everything here wants to bite you, except the parcel. Probably.',
  is: 'All of Iceland! I posted this with a puffin. He was extremely professional.',
  moon: 'Every postcard from the MOON! The postage was outrageous. Worth it.',
  aq: 'All of Antarctica! The penguins wrapped this. Hence the smell of fish.',
  w22: 'Every card from World 22! Even the ones that did not exist yet.',
  eye: 'Every Red-Eye card! I wrote these at thirty thousand feet. Excuse the turbulence.',
  fest: 'All of Festival Fields! The llamas signed it. That smudge is a hoof.',
  lost: 'Every Lost & Found card! I found this box in Lost & Found. It had your name on it.',
  bone: 'Every card from the quarry! I sent you a spare bone with a label that says APPROX. Keep it for the next flat-pack wardrobe you build from memory, darling. The last one still has a door on its ceiling.',   // The Spare Bone Quarry (hidden land A12)
  table: 'Every card from our table! I saved you the last olive. Madame Manners says you have to offer it to me first.',   // Table for Two (36)
  wash: 'Every card from the wrong side of the wash! I folded your socks into pairs while you were out. Two of them were never pairs, darling, they only met on the line.',   // Wrong Side of the Wash (26)
  // Pupo Standard Time (hidden land A7)
  pst: 'Every card from Pupo Standard Time! I packed a biscuit for each word of Pupo\'s sentence. That is four. He says the pause counts, so there is a fifth, and he has already eaten it.',
  post: 'Every card from the harbour on my postcard! I put a stamp on your forehead while you napped so you would come back to me. It says FRAGILE. It is still there, darling. Have a look in the kettle.',   // Postmark Sound (hidden land A2)
  orch: 'Every card from the orchard! I tied a pear to the bedpost with your red sock so it would stop rolling off. It worked so well you will need scissors.',   // The Orchard After Closing (28)
  // The Umbrella Repair District (31, hidden land A6)
  umb: 'Every card from the repair district! I sent you a spare rib in a paper sleeve. Not for the umbrella, darling: for the next time you open one indoors and swear it was already like that.',
  gal: 'Every postcard from the gallery! I hung the worst Piwi portrait in the hall so the coats have something to laugh at. Mind the hook, darling: it is where your hat used to go.',   // The Unflattering Gallery (hidden land A5)
  foley: 'Every card from Foley Beach! I packed two coconut halves so you can do the horse in the kitchen. Do it quietly, darling, the neighbours think we keep one.',   // Foley Beach (hidden land A4)
  seats: 'Every card from under the cheap seats! I have put a folding chair facing the wall in the hall so you feel at home. Twice I sat on it the right way round. Both times, darling, it folded me up.',   // Below the Cheap Seats (33)
  // The Table Salt Sea (34, hidden land A9)
  salt: 'Every card from the salt sea! I have stopped trusting our shaker. It says "just a pinch" and it has said that since our wedding. I weighed it. Brady, it is a lot more than a pinch.',
  shad: 'Every postcard from the department! They gave me your shadow in a paper bag with a ticket on it. I hung it on the back of the door, darling, and it has already tried on your coat.'   // The Department of Unclaimed Shadows (hidden land A10)
};
const noteOf = C => (NOTES[C.id] || ('Every postcard from ' + C.name + '! I keep them all in a shoebox.')) + ' ♥ C';

/* ---------- the save: Save.data.postcards (made on first use; old saves have none) ----------
   { v, levels: { id: true } (all three found, life given), lands: { cc: k } (the k-th land completed), order: [cc],
     pending: [ { kind: 'care', cc } | { kind: 'summary', ... } | { kind: 'all' } | { kind: 'toast', text } ],
     off: { perkId: true } (switched off), all: bool, story: bool (the ending panels are due) }
   Save.data.allPostcards mirrors .all: true once every postcard in the game has been found (it never goes back). */
const full = id => { const g = Save.data.gold && Save.data.gold[id]; return !!(g && g[0] && g[1] && g[2]); };
const lands = () => Tour.worldList().map(w => Tour.byWorld[w]).filter(C => C && C.levels && C.levels.length);
const landDone = C => { const ids = Tour.levelIds(C); return ids.length > 0 && ids.every(full); };
const TourPostcards = {
  PERKS, FINAL, NOTES, LIVES_PACK,
  data() {
    const d = Save.data;
    let P = d.postcards;
    if (!P || typeof P !== 'object') P = d.postcards = { v: 0, levels: {}, lands: {}, order: [], pending: [], off: {}, all: false, story: false };
    for (const [k, v] of [['levels', {}], ['lands', {}], ['order', []], ['pending', []], ['off', {}]]) if (!P[k] || typeof P[k] !== 'object') P[k] = v;
    if (d.allPostcards === undefined) d.allPostcards = !!P.all;
    return P;
  },
  full, landDone,
  // the flag a future hidden land can be unlocked by
  all() { return !!(this.data().all || Save.data.allPostcards); },
  // the perk the k-th completed land brings (0-based); null past the track (then: LIVES_PACK lives)
  trackItem(k) { return k < PERKS.length ? PERKS[k] : null; },
  unlocked(id) { const P = this.data(); if (id === FINAL.id) return !!P.all; const k = PERKS.findIndex(q => q.id === id); return k >= 0 && k < P.order.length; },
  on(id) { return this.unlocked(id) && !this.data().off[id]; },
  toggle(id) { const P = this.data(); if (!this.unlocked(id)) return false; if (P.off[id]) delete P.off[id]; else P.off[id] = true; Save.save(); return !P.off[id]; },
  perkCount() { return PERKS.filter(q => this.unlocked(q.id)).length + (this.data().all ? 1 : 0); },
  perksOn() { return PERKS.concat([FINAL]).filter(q => this.on(q.id)).length; },
  // grant whatever the save has earned and not yet been given. The first sync of a save made before this file
  // (no Save.data.postcards) is quiet: one summary card for everything at once. Returns what was new.
  sync(o) {
    o = o || {};
    const d = Save.data, P = this.data(), retro = !(P.v >= 1), skip = o.skip || null;
    const out = { levels: [], lands: [], all: false, lives: 0 };
    for (const C of lands()) for (const id of Tour.levelIds(C)) if (id !== skip && full(id) && !P.levels[id]) { P.levels[id] = true; out.levels.push(id); }
    out.lives += out.levels.length;
    for (const C of lands()) if (!(C.id in P.lands) && landDone(C)) {
      P.lands[C.id] = P.order.length; P.order.push(C.id); out.lands.push(C.id);
      if (!this.trackItem(P.lands[C.id])) out.lives += LIVES_PACK;
    }
    const every = lands().every(landDone);
    if (every && !P.all) { P.all = true; out.all = true; }
    d.allPostcards = !!P.all;
    if (out.lives) d.lives = Math.min(99, (d.lives || 0) + out.lives);
    if (retro) {
      if (out.levels.length || out.lands.length || out.all) P.pending.push({ kind: 'summary', levels: out.levels.length, lands: out.lands.slice(), all: out.all, lives: out.lives });
    } else {
      // a level finished away from the results screen (the third card, then the pause menu): a toast on the map
      if (out.levels.length) P.pending.push({ kind: 'toast', text: (out.levels.length === 1 ? 'ALL 3 POSTCARDS IN ' + out.levels[0] : 'ALL 3 POSTCARDS IN ' + out.levels.length + ' LEVELS') + ': +' + out.levels.length + (out.levels.length === 1 ? ' LIFE' : ' LIVES') });
      for (const cc of out.lands) P.pending.push({ kind: 'care', cc });
      if (out.all) { P.pending.push({ kind: 'all' }); P.story = true; }
    }
    P.v = 1;
    if (out.levels.length || out.lands.length || out.all) Save.save();
    return out;
  },
  // a level cleared with all three: its own reward (the results screen shows it), then everything else
  onClear(play) {
    if (!play || !play.level || !play.level.tour || !Tour.specOf(play.id) || !Tour.countryOf(play.id)) return;
    const P = this.data(), id = play.id;
    if (full(id) && !P.levels[id]) {
      P.levels[id] = true; play.cardsNew = true;
      Save.data.lives = Math.min(99, (Save.data.lives || 0) + 1);
      if (!(P.v >= 1)) P.v = 1;   // a clear is not an old save's catch-up
    }
    play.cardsFull = full(id);
    this.sync({ skip: id });
    Save.save();
  },
  // album and map counts: exactly TourProgress.totals() (hidden lands and unrevealed secret levels stay out)
  counts() { const T = TourProgress.totals(); return { gold: T.gold, total: T.goldTotal, lands: this.data().order.length, landsTotal: lands().length, levels: Object.keys(this.data().levels).length }; },
  // the levels an album page lists: revealed ones, and any with a postcard found already
  pageLevels(C) { return Tour.levelIds(C).filter(id => !Tour.specOf(id).secret || TourProgress.isRevealed(id) || TourProgress.goldCount(id) > 0); },
  landShown(C) { return !C.secret || TourProgress.countryUnlocked(C); }
};
try { Save.data && TourPostcards.data(); } catch (e) { /* no save yet */ }

/* ---------- art: the flat inked look ---------- */
const INK = '#1c1426', CREAM = '#fffaf0', PINK = '#ff4f8a';
const colsOf = C => (C && C.colors) || { a: PINK, b: '#38c8ff', c: '#ffd84a' };
const Art = {
  // a postcard in a land's colours (the in-level card's picture), centred, w = 28 * s
  card(ctx, x, y, s, cols, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(20,10,30,0.25)'; rr(ctx, -13, -8.5, 28, 20, 2); ctx.fill();
    ctx.fillStyle = CREAM; rr(ctx, -14, -10, 28, 20, 2); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.1 / Math.max(1, s * 0.7); ctx.stroke();
    const g = ctx.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, cols.b); g.addColorStop(1, cols.c);
    ctx.fillStyle = g; ctx.fillRect(-12, -8, 13, 16);
    ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(-5.5, 1, 3.5, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = rgba(cols.a, 0.85); ctx.fillRect(-12, 3, 13, 5);
    ctx.fillStyle = cols.a; ctx.fillRect(6, -8, 6, 6);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.6; ctx.setLineDash([1, 1]); ctx.strokeRect(6.5, -7.5, 5, 5); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(80,60,90,0.5)'; ctx.lineWidth = 0.8;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(3, 1 + k * 3); ctx.lineTo(12, 1 + k * 3); ctx.stroke(); }
    Art.heart(ctx, 4.5, -3.5, 1.3, PINK);
    ctx.restore();
  },
  // a missing postcard: a dotted outline with the level id written in it
  ghost(ctx, x, y, s, label) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = 'rgba(60,40,80,0.45)'; ctx.lineWidth = 1.1 / s * 1.2; ctx.setLineDash([2.2, 2]); rr(ctx, -14, -10, 28, 20, 2); ctx.stroke(); ctx.setLineDash([]);
    if (label) { ctx.fillStyle = 'rgba(60,40,80,0.5)'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 0.5); }
    ctx.restore();
  },
  heart(ctx, x, y, s, col, ink) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 2.2); ctx.bezierCurveTo(-3.4, -0.4, -2.4, -3.4, 0, -1.6); ctx.bezierCurveTo(2.4, -3.4, 3.4, -0.4, 0, 2.2); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); if (ink) { ctx.strokeStyle = ink; ctx.lineWidth = 0.8 / s * 1.4; ctx.stroke(); }
    ctx.restore();
  },
  // a round postmark: two rings, a word, little stars and the wavy cancel lines
  postmark(ctx, x, y, r, col, word, rot, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.fillStyle = rgba('#fff6e0', 0.9); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.4, r * 0.1); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(0.8, r * 0.05); ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, TAU); ctx.stroke();
    ctx.fillStyle = col;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; ctx.beginPath(); TourKit.star(ctx, Math.cos(a) * r * 0.87, Math.sin(a) * r * 0.87, r * 0.07, r * 0.03, 5); ctx.fill(); }
    ctx.font = `${Math.round(r * (word.length > 4 ? 0.36 : 0.46))}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(word, 0, r * 0.02);
    ctx.lineWidth = Math.max(1, r * 0.07); ctx.lineCap = 'round';
    for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(r * 1.08, q * r * 0.3); ctx.bezierCurveTo(r * 1.3, q * r * 0.3 - r * 0.18, r * 1.5, q * r * 0.3 + r * 0.18, r * 1.75, q * r * 0.3); ctx.stroke(); }
    ctx.restore();
  },
  // a perforated stamp (the map badge): h is half its height
  stamp(ctx, x, y, h, col, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const w = h * 0.84, nx = 3, ny = 4, rx = w / nx / 2, ry = h / ny / 2, r = Math.min(rx, ry) * 0.55;
    ctx.beginPath(); ctx.moveTo(-w, -h);
    for (let i = 0; i < nx; i++) { const cx = -w + (i * 2 + 1) * rx; ctx.lineTo(cx - r, -h); ctx.arc(cx, -h, r, Math.PI, 0, true); }
    ctx.lineTo(w, -h);
    for (let i = 0; i < ny; i++) { const cy = -h + (i * 2 + 1) * ry; ctx.lineTo(w, cy - r); ctx.arc(w, cy, r, -Math.PI / 2, Math.PI / 2, true); }
    ctx.lineTo(w, h);
    for (let i = nx - 1; i >= 0; i--) { const cx = -w + (i * 2 + 1) * rx; ctx.lineTo(cx + r, h); ctx.arc(cx, h, r, 0, Math.PI, true); }
    ctx.lineTo(-w, h);
    for (let i = ny - 1; i >= 0; i--) { const cy = -h + (i * 2 + 1) * ry; ctx.lineTo(-w, cy + r); ctx.arc(-w, cy, r, Math.PI / 2, -Math.PI / 2, true); }
    ctx.closePath();
    ctx.fillStyle = CREAM; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.9, h * 0.1); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(-w + h * 0.3, -h + h * 0.3, 2 * w - h * 0.6, 2 * h - h * 0.6);
    Art.heart(ctx, 0, h * 0.06, h * 0.17, CREAM);
    ctx.restore();
  },
  // the care package: a kraft-paper parcel tied with string, her stamp and a pink bow
  parcel(ctx, x, y, s, cols, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin((t || 0) * 1.4) * 0.03 - 0.05);
    ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(20,10,30,0.25)'; ctx.beginPath(); ctx.ellipse(2, 30, 40, 7, 0, 0, TAU); ctx.fill();
    // the box: front and lid
    ctx.fillStyle = '#c8945a'; ctx.beginPath(); ctx.moveTo(-36, -8); ctx.lineTo(28, -8); ctx.lineTo(28, 28); ctx.lineTo(-36, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8763e'; ctx.beginPath(); ctx.moveTo(28, -8); ctx.lineTo(40, -18); ctx.lineTo(40, 18); ctx.lineTo(28, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dcac72'; ctx.beginPath(); ctx.moveTo(-36, -8); ctx.lineTo(-24, -18); ctx.lineTo(40, -18); ctx.lineTo(28, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    // string
    ctx.strokeStyle = '#f4e8d0'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-4, 28); ctx.moveTo(-36, 10); ctx.lineTo(28, 10); ctx.moveTo(-4, -8); ctx.lineTo(8, -18); ctx.moveTo(28, 10); ctx.lineTo(40, 0); ctx.stroke();
    // her stamp and a FRAGILE label
    ctx.fillStyle = cols.a; ctx.fillRect(10, 14, 12, 10); ctx.strokeStyle = CREAM; ctx.lineWidth = 0.8; ctx.setLineDash([1.4, 1.2]); ctx.strokeRect(11, 15, 10, 8); ctx.setLineDash([]);
    ctx.fillStyle = CREAM; ctx.fillRect(-33, 14, 23, 9); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(-33, 14, 23, 9);
    ctx.fillStyle = '#c42a62'; ctx.font = `4.3px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FRAGILE', -21.5, 18.8);
    // the bow
    ctx.fillStyle = '#ff7ab8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2, -16); ctx.quadraticCurveTo(2 + sd * 14, -30, 2 + sd * 12, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(2, -16, 3.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a perk's icon, about 2r across
  icon(ctx, id, x, y, r, t, dim) {
    ctx.save(); ctx.translate(x, y); if (dim) ctx.globalAlpha *= 0.35;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.2, r * 0.09);
    const s = r / 20;
    ctx.scale(s, s);
    if (id === 'cape' || id === 'gold') {
      const g = id === 'gold';
      ctx.fillStyle = g ? '#ffd23a' : CREAM;
      ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(8, -16); ctx.quadraticCurveTo(14, 2, 16, 16); ctx.quadraticCurveTo(10, 12, 5, 17); ctx.quadraticCurveTo(0, 12, -5, 17); ctx.quadraticCurveTo(-10, 12, -16, 16); ctx.quadraticCurveTo(-14, 2, -8, -16); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.clip();
      if (g) { ctx.fillStyle = '#fff3a8'; ctx.fillRect(-16, -16, 5, 34); Art.heart(ctx, 2, 4, 2.2, '#ff3d7a'); }
      else { for (const [sx, sy, c] of [[-8, -6, PINK], [4, -2, '#38c8ff'], [-4, 7, '#ffd23a']]) { ctx.fillStyle = c; ctx.fillRect(sx, sy, 6, 5); } ctx.strokeStyle = rgba(PINK, 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(6, 8, 4, 0, TAU); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = INK; ctx.fillRect(-9, -18, 18, 4);
    } else if (id === 'compass') {
      ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.rotate(0.6 + Math.sin((t || 0) * 2) * 0.15);
      ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8c0d8'; ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
    } else if (id === 'shades') {
      ctx.lineWidth = 2;
      for (const sx of [-9, 9]) { ctx.fillStyle = '#16121c'; rr(ctx, sx - 7.5, -5, 15, 11, 2.5); ctx.fill(); ctx.strokeStyle = '#e8b020'; ctx.stroke(); }
      ctx.strokeStyle = '#e8b020'; ctx.beginPath(); ctx.moveTo(-1.5, -2); ctx.lineTo(1.5, -2); ctx.stroke();
      ctx.fillStyle = '#fff6c0'; ctx.beginPath(); TourKit.star(ctx, 12, -9, 6, 1.6, 4); ctx.fill();
    } else if (id === 'gift') {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-14, -14); ctx.moveTo(10, -4); ctx.lineTo(14, -14); ctx.stroke();
      ctx.fillStyle = '#ff9ad8'; ctx.beginPath(); ctx.moveTo(-17, -13); ctx.quadraticCurveTo(0, -30, 17, -13); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#38c8ff'; ctx.fillRect(-10, -4, 20, 18); ctx.strokeRect(-10, -4, 20, 18);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(-2, -4, 4, 18); ctx.fillRect(-10, 3, 20, 4);
    } else if (id === 'hearts') {
      Art.heart(ctx, -8, 6, 3.2, '#ff9ad8', INK); Art.heart(ctx, 2, -2, 4, '#ff6fae', INK); Art.heart(ctx, 10, -12, 2.6, '#ffb8dc', INK);
    } else if (id === 'magnet') {
      ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 11, Math.PI, 0); ctx.lineTo(11, 10); ctx.moveTo(-11, 0); ctx.lineTo(-11, 10); ctx.stroke();
      ctx.lineWidth = 4.6; ctx.strokeStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(0, 0, 11, Math.PI, 0); ctx.lineTo(11, 7); ctx.moveTo(-11, 0); ctx.lineTo(-11, 7); ctx.stroke();
      ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(-11, 7); ctx.lineTo(-11, 11); ctx.moveTo(11, 7); ctx.lineTo(11, 11); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 13, 4, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (id === 'stamps') {
      Art.postmark(ctx, -2, 2, 13, PINK, 'OK', -0.25);
    } else if (id === 'lives') {
      ctx.fillStyle = '#7ad8ff'; rr(ctx, -6, -10, 12, 22, 4); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#e8f8ff'; ctx.fillRect(-4, -15, 8, 5); ctx.strokeRect(-4, -15, 8, 5);
      ctx.fillStyle = INK; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+' + LIVES_PACK, 0, 2);
    }
    ctx.restore();
  }
};
TourPostcards.Art = Art;
const itemOf = k => TourPostcards.trackItem(k) || { id: 'lives', kind: 'help', name: '+' + LIVES_PACK + ' LIVES', desc: 'The track is done: every land from now on sends lives.' };
TourPostcards.itemOf = itemOf;
// a sentence wrapped into lines (canvas measure)
function lines(ctx, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(' ')) { const t2 = line ? line + ' ' + w : w; if (ctx.measureText(t2).width > maxW && line) { out.push(line); line = w; } else line = t2; }
  if (line) out.push(line);
  return out;
}
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH');
function fitFont(ctx, text, px, maxW, family) { let s = px; ctx.font = `${s}px ${family || FONT_DISPLAY}`; while (s > 7 && ctx.measureText(text).width > maxW) { s -= 0.5; ctx.font = `${s}px ${family || FONT_DISPLAY}`; } return s; }

/* ---------- 1. a level: the clear, the results screen, the third card ---------- */
if (typeof TourHooks !== 'undefined') TourHooks.on('levelClear', play => TourPostcards.onClear(play));
if (typeof Play !== 'undefined') {
  // the third postcard of a level, picked up: a word over Brady
  const cg0 = Play.prototype.collectGold;
  Play.prototype.collectGold = function (idx, x, y) {
    const had = full(this.id);
    cg0.call(this, idx, x, y);
    if (this.level && this.level.tour && !had && full(this.id)) { this.parts.text(x, y - 42, 'ALL 3 POSTCARDS!', '#ffd84a'); this.burst(x, y, 24, '#ffd84a', 'confetti'); }
  };
  // the stamp's thump and the extra life's chime, on the results screen's own clock
  const ut0 = Play.prototype.updateTally;
  Play.prototype.updateTally = function (dt) {
    ut0.call(this, dt);
    if (this.cardsNew && this.state === 'results' && !TourKit.reduceMotion()) {
      const k = this.stateT;
      if (k > 0.15 && !this.cardsS1) { this.cardsS1 = true; Sound.play('cardFlip'); }
      if (k > 0.95 && !this.cardsS2) { this.cardsS2 = true; TourKit.sfx('stamp', 'bump', { vol: 0.9 }); this.shake && this.shake(3); }
      if (k > 1.25 && !this.cardsS3) { this.cardsS3 = true; Sound.play('oneup'); }
    }
  };
  const dr0 = Play.prototype.drawResults;
  Play.prototype.drawResults = function (ctx) {
    dr0.call(this, ctx);
    if (!this.level || !this.level.tour) return;
    const isFull = this.cardsFull != null ? this.cardsFull : full(this.id);
    if (!isFull) return;
    const W = Game.cssW, H = Play.uiH(), C = Tour.countryOf(this.id), cols = colsOf(C), cy = H / 2 + 34;
    const k = this.state === 'results' ? (TourKit.reduceMotion() ? 9 : this.stateT) : 0;
    ctx.save();
    if (this.cardsNew) {
      // the three cards fan out over their slots, then the postmark thumps down on them
      const u = TourPanelFx.backOut(clamp((k - 0.1) / 0.45, 0, 1)), sc = lerp(1, 1.62, u);
      for (let i = 0; i < 3; i++) {
        const d = i - 1, x = W / 2 + d * lerp(50, 56, u), y = cy - u * 4 + Math.abs(d) * u * 5;
        Art.card(ctx, x, y + Math.sin(this.t * 2 + i) * u * 1.2, sc, cols, d * 0.2 * u);
      }
      const v = clamp((k - 0.7) / 0.25, 0, 1);
      if (v > 0) {
        const s2 = v < 1 ? lerp(2.8, 1, v * v) : 1, R = 21;
        Art.postmark(ctx, W / 2 + 4, cy + 2, R * s2, '#d6206a', 'ALL 3!', -0.22, Math.min(1, v * 1.6));
        if (v >= 1 && k < 1.5) { const q = (k - 0.95) / 0.55; ctx.strokeStyle = `rgba(255,240,200,${0.7 * (1 - q)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2 + 4, cy + 2, R + q * 30, 0, TAU); ctx.stroke(); }
      }
      // the reward: a pink tag beside the fan
      const w2 = clamp((k - 1.2) / 0.3, 0, 1);
      if (w2 > 0) {
        ctx.globalAlpha = w2; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textBaseline = 'middle';
        const txt = '+1 LIFE', tw = ctx.measureText(txt).width + 30, tx = Math.min(W / 2 + 94, W - tw - 8), ty = cy - 8 + (1 - w2) * 8;
        ctx.fillStyle = 'rgba(20,10,30,0.4)'; rr(ctx, tx + 2, ty - 11, tw, 26, 13); ctx.fill();
        ctx.fillStyle = PINK; rr(ctx, tx, ty - 13, tw, 26, 13); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
        Art.heart(ctx, tx + 13, ty, 2.2, CREAM);
        ctx.fillStyle = CREAM; ctx.textAlign = 'left'; ctx.fillText(txt, tx + 22, ty + 1);
        ctx.font = `bold 9px ${FONT_UI}`; ctx.fillStyle = '#ffd0e8'; ctx.textAlign = 'center'; ctx.fillText('FROM CHINKA-O', tx + tw / 2, ty + 23);
      }
    } else {
      // found before: a small stamp beside the three cards
      Art.postmark(ctx, W / 2 + 84, cy, 14, '#d6206a', 'ALL 3', -0.2, 0.92);
    }
    ctx.restore();
  };
}

/* ---------- 2. the perks in a level ---------- */
const PerkFx = {
  // a level starts: the gift box and the magnet (not on a respawn at a checkpoint)
  start(play, opts) {
    if (!play.level || !play.level.tour || (opts && opts.checkpoint)) return;
    if (TourPostcards.on('gift')) play.pcGift = { t: -0.25 };
    if (TourPostcards.on('magnet')) play.pcMagnet = true;
  },
  update(play, dt) {
    const p = play.player; if (!p || !play.level || !play.level.tour) return;
    if (play.state === 'play' && !p.dead) {
      if (play.pcMagnet) { play.pcMagnet = false; if (p.buffs) { p.buffs.magnet = Math.max(p.buffs.magnet || 0, 20); play.parts.text(p.cx, p.y - 26, 'MAGNET START', '#ff9090'); } }
      const G = play.pcGift;
      if (G && !G.done) {
        G.t += dt;
        if (G.t >= 1.0) {
          G.done = true; play.pcGift = null;
          const kind = p.power === 0 ? 'mushroom' : p.power === 1 ? 'joint' : null;
          play.burst(p.cx, p.y - 6, 26, '#ff9ad8', 'confetti'); Sound.play('appear');
          if (kind) p.collect(kind, null); else play.addScore(1000, p.cx, p.y);
          play.parts.text(p.cx, p.y - 34, 'FROM CHINKA-O ♥', '#ff9ad8');
        }
      }
    }
    // hearts and stamps: a short list on the player
    const hearts = TourPostcards.on('hearts'), steps = TourPostcards.on('stamps');
    if (!hearts && !steps && !p.pcFx) return;
    const L = p.pcFx || (p.pcFx = []);
    for (let i = L.length - 1; i >= 0; i--) { const q = L[i]; q.age += dt; if (q.kind === 'heart') { q.y -= 26 * dt; q.x += Math.sin(q.age * 7 + q.ph) * 12 * dt; } if (q.age > q.life) L.splice(i, 1); }
    if (p.dead || p.mounted || play.state !== 'play') { p.pcAir = 0; return; }
    if (hearts && p.onGround && Math.abs(p.vx) > 2.5 * TS) { p.pcHT = (p.pcHT || 0) + dt; if (p.pcHT > 0.12 && L.length < 24) { p.pcHT = 0; L.push({ kind: 'heart', x: p.cx - p.facing * 10, y: p.y + p.h * 0.55, age: 0, life: 0.85, ph: Math.random() * 6, s: 0.8 + Math.random() * 0.5 }); } }
    if (!p.onGround) p.pcAir = (p.pcAir || 0) + dt;
    else { if (steps && p.pcAir > 0.28 && L.length < 24) { const C = Tour.countryOf(play.id); L.push({ kind: 'stamp', x: p.cx, y: p.y + p.h, age: 0, life: 1.6, rot: (Math.random() - 0.5) * 0.6, col: colsOf(C).a }); } p.pcAir = 0; }
  },
  // the cape, behind Brady (local frame: +x is behind him, y down from the shoulders)
  cape(ctx, p, t, gold) {
    const D = p.small ? BRADY_DIM.small : BRADY_DIM.big, S = ART_SCALE.brady, feet = p.y + p.h;
    const shY = feet - D.shoulder * S + (p.small ? 2 : 4), len = D.shoulder * S * (p.small ? 1.05 : 0.92);
    const spd = clamp(Math.abs(p.vx) / (6 * TS), 0, 1), air = p.onGround ? 0 : 1;
    const lean = 0.62 + spd * 0.5 + air * 0.25 + Math.sin(t * 3) * 0.05, wv = Math.sin(t * 14) * (1 + spd * 2);
    const hw = (p.small ? 6 : 8), bw = (p.small ? 11 : 15);
    ctx.save(); ctx.translate(p.cx - p.facing * 2, shY); ctx.scale(-p.facing, 1);
    const bx = Math.sin(lean) * len, by = Math.cos(lean) * len, nx = Math.cos(lean), ny = -Math.sin(lean);
    ctx.beginPath(); ctx.moveTo(-hw * 0.6, 0); ctx.lineTo(hw, 0);
    ctx.quadraticCurveTo(hw + bx * 0.6 + wv, by * 0.5, bx + nx * bw, by + ny * bw);
    for (let q = 2; q >= -2; q -= 1) { const f0 = q / 2, x = bx + nx * bw * f0, y = by + ny * bw * f0; ctx.quadraticCurveTo(x + nx * bw * 0.25 + Math.sin(t * 12 + q) * 1.5, y + 3 + ny * bw * 0.25, x, y); }
    ctx.quadraticCurveTo(-hw * 0.6 + bx * 0.4 - wv * 0.5, by * 0.5, -hw * 0.6, 0); ctx.closePath();
    let fill = CREAM;
    if (gold) { const g = ctx.createLinearGradient(0, 0, bx, by); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ffd23a'); g.addColorStop(1, '#e8a818'); fill = g; }
    ctx.fillStyle = fill; ctx.fill();
    ctx.save(); ctx.clip();
    if (gold) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; const sx = ((t * 40) % 60) - 20; ctx.beginPath(); ctx.moveTo(sx, -4); ctx.lineTo(sx + 6, -4); ctx.lineTo(sx - 10, len + 10); ctx.lineTo(sx - 16, len + 10); ctx.fill(); Art.heart(ctx, bx * 0.55, by * 0.55, p.small ? 1.4 : 2.1, '#ff3d7a'); }
    else {
      const sz = p.small ? 3.4 : 4.6, cc = [PINK, '#38c8ff', '#ffd23a', '#5ae07a'];
      for (let k = 0; k < 5; k++) { const a = (k + 0.7) / 5.6, px = bx * a + nx * bw * (k % 2 ? 0.5 : -0.4), py = by * a + ny * bw * (k % 2 ? 0.5 : -0.4); ctx.fillStyle = cc[k % 4]; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz * 0.85); }
      ctx.strokeStyle = rgba(PINK, 0.55); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(bx * 0.45, by * 0.45, sz * 1.1, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#120e16'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  },
  under(ctx, p, t) {
    if (p.dead || !p.g || !p.g.level || !p.g.level.tour) return;
    const L = p.pcFx;
    if (L) for (const q of L) if (q.kind === 'stamp') { const a = 1 - q.age / q.life; ctx.save(); ctx.translate(q.x, q.y - 1); ctx.scale(1, 0.42); Art.postmark(ctx, 0, 0, 9, q.col, '✓', q.rot, a * 0.8); ctx.restore(); }
    if (!p.mounted && !p.swim && (TourPostcards.on('cape') || TourPostcards.on('gold'))) PerkFx.cape(ctx, p, t, TourPostcards.on('gold'));
    if (L) for (const q of L) if (q.kind === 'heart') { ctx.save(); ctx.globalAlpha = 1 - q.age / q.life; Art.heart(ctx, q.x, q.y, q.s * 1.5, '#ff6fae', '#120e16'); ctx.restore(); }
  },
  over(ctx, p, t) {
    if (p.dead || !TourPostcards.on('shades') || !p.g || !p.g.level || !p.g.level.tour || p.mounted) return;
    // the golden shades: a glint runs across the lenses every few seconds
    const D = p.small ? BRADY_DIM.small : BRADY_DIM.big, S = ART_SCALE.brady, crouch = p.crouch ? 0.6 : 1;
    const hx = p.cx + p.facing * D.headR * S * 0.55, hy = p.y + p.h - D.headY * S * crouch - D.headR * S * 0.05;
    const k = (t % 2.6) / 0.4;
    if (k < 1) { ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); TourKit.star(ctx, hx + p.facing * (k - 0.5) * 9, hy - 2, 5.5, 1.3, 4); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(hx + p.facing * D.headR * S * 0.45, hy - D.headR * S * 0.3, 1.1, 0, TAU); ctx.fill(); ctx.restore();
  },
  // the compass: an arrow at the edge of the game view toward the nearest postcard still missing in this room
  compass(play, ctx) {
    if (!TourPostcards.on('compass') || !play.level || !play.level.tour || play.state !== 'play' || play.paused) return;
    const p = play.player; if (!p) return;
    let best = null, bd = 1e9;
    for (const e of play.entities) if (e instanceof Gold && !e.remove && !e.had && !(Save.data.gold[play.id] || [])[e.idx]) { const d = Math.hypot(e.cx - p.cx, e.cy - p.cy); if (d < bd) { bd = d; best = e; } }
    if (!best) return;
    const R = Game.gameRect, k = Game.S / Game.dpr, sx = R.x + (best.cx - play.camX) * k, sy = R.y + (best.cy - play.camY) * k;
    const m = 26, top = R.y + 58, x0 = R.x + m, x1 = R.x + R.w - m, y0 = Math.max(top, R.y + m), y1 = R.y + R.h - m;
    if (sx > x0 && sx < x1 && sy > y0 && sy < y1) return;   // on screen: no arrow
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2, dx = sx - cx, dy = sy - cy;
    const f = Math.min(dx ? Math.abs(((dx > 0 ? x1 : x0) - cx) / dx) : 1e9, dy ? Math.abs(((dy > 0 ? y1 : y0) - cy) / dy) : 1e9);
    const ax = cx + dx * f, ay = cy + dy * f, ang = Math.atan2(dy, dx), bob = Math.sin(play.t * 6) * 2.5;
    ctx.save(); ctx.translate(ax - Math.cos(ang) * bob, ay - Math.sin(ang) * bob);
    ctx.fillStyle = 'rgba(16,10,30,0.7)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.rotate(ang); ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(14, -7); ctx.lineTo(14, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const C = Tour.countryOf(play.id); Art.card(ctx, 0, 0, 0.72, colsOf(C), 0);
    ctx.restore();
  }
};
TourPostcards.PerkFx = PerkFx;
if (typeof TourCarry !== 'undefined' && TourCarry.start) { const cs0 = TourCarry.start; TourCarry.start = function (play, opts) { const r = cs0.apply(this, arguments); try { PerkFx.start(play, opts); } catch (e) { TourHooks.fault('postcards', e); } return r; }; }
if (typeof TourHooks !== 'undefined') {
  TourHooks.on('playUpdate', (play, dt) => PerkFx.update(play, dt));
  // the gift box on its little parachute, coming down onto Brady
  TourHooks.on('afterEntities', (play, ctx) => {
    const G = play.pcGift, p = play.player; if (!G || G.t <= 0 || !p) return;
    const k = clamp(G.t / 1.0, 0, 1), x = p.cx + Math.sin(G.t * 5) * 6 * (1 - k), y = p.y - 26 - (1 - easeOut(k)) * 150;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(G.t * 4) * 0.12 * (1 - k)); ctx.scale(0.9, 0.9);
    Art.icon(ctx, 'gift', 0, 0, 20, play.t);
    ctx.restore();
  });
}
if (typeof TourPlayerFx !== 'undefined') {
  const u0 = TourPlayerFx.under, o0 = TourPlayerFx.over;
  TourPlayerFx.under = function (ctx, p, t) { try { PerkFx.under(ctx, p, t); } catch (e) { TourHooks.fault('postcards', e); } return u0.call(this, ctx, p, t); };
  TourPlayerFx.over = function (ctx, p, t) { o0.call(this, ctx, p, t); try { PerkFx.over(ctx, p, t); } catch (e) { TourHooks.fault('postcards', e); } };
}
if (typeof Play !== 'undefined') {
  const hud0 = Play.prototype.drawHUD;
  Play.prototype.drawHUD = function (ctx) { hud0.call(this, ctx); try { PerkFx.compass(this, ctx); } catch (e) { TourHooks.fault('postcards', e); } };
}

/* ---------- 3. the map: care packages, the summary, the stamps on the stops ---------- */
function cardFor(item) {
  if (item.kind === 'care') { const C = Tour.countries[item.cc]; if (!C) return null; const P = TourPostcards.data(); return { kind: 'care', cc: C.id, item: itemOf(P.lands[C.id] != null ? P.lands[C.id] : P.order.length - 1) }; }
  if (item.kind === 'summary' || item.kind === 'all') return Object.assign({}, item);
  return null;
}
if (typeof TourMapScene !== 'undefined') {
  const MP = TourMapScene.prototype;
  const ready = m => {
    if (m.card || m.toastT > 0.2) return false;
    if (m.mode === 'land') { const ow = m.ow; return !!(ow && ow.idle() && !ow.menu && ow.iris && ow.iris.t >= ow.iris.dur); }
    return !m.flight && !m.rReveal && !(m.rRevealQ && m.rRevealQ.length) && m.zoomT == null;
  };
  const up0 = MP.update;
  MP.update = function (dt) {
    if (!this.pcSynced) { this.pcSynced = true; try { TourPostcards.sync(); } catch (e) { TourHooks.fault('postcards', e); } }
    try {
      const P = TourPostcards.data();
      if (P.pending.length && ready(this)) {
        const item = P.pending.shift(); Save.save();
        if (item.kind === 'toast') { this.toast(item.text); Sound.play('oneup'); }
        else { const c = cardFor(item); if (c) { this.card = c; this.card.t0 = this.t; Sound.play('chinka'); } }
      }
    } catch (e) { TourHooks.fault('postcards', e); }
    return up0.call(this, dt);
  };
  const dc0 = MP.drawCard;
  MP.drawCard = function (ctx) {
    const c = this.card;
    if (c && (c.kind === 'care' || c.kind === 'summary' || c.kind === 'all')) return drawCareCard(ctx, c, this.t - (c.t0 || 0), this.t);
    return dc0.call(this, ctx);
  };
}
// the card over the map: a parcel and her note (care), the catch-up (summary), the last parcel (all)
function drawCareCard(ctx, c, age, t) {
  const W = Game.cssW, H = Game.cssH, portrait = H > W * 1.05;
  const C = c.cc ? Tour.countries[c.cc] : null, cols = colsOf(C);
  const k = TourKit.reduceMotion() ? 1 : TourPanelFx.backOut(clamp(age / 0.35, 0, 1));
  ctx.save(); ctx.fillStyle = `rgba(6,10,30,${0.6 * clamp(age * 4, 0, 1)})`; ctx.fillRect(0, 0, W, H);
  const cw = Math.min(W - 32, portrait ? 360 : 520), ch = Math.min(H - 40, portrait ? 400 : 250), x = (W - cw) / 2, y = (H - ch) / 2;
  ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.rotate(-0.015 + Math.sin(t * 1.5) * 0.006); ctx.translate(-W / 2, -H / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.fillStyle = CREAM; rr(ctx, x, y, cw, ch, 8); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, x, y, cw, ch, 8); ctx.stroke();
  // air-mail edge
  ctx.save(); rr(ctx, x, y, cw, ch, 8); ctx.clip();
  for (let i = -2; i < (cw + ch) / 14; i++) { ctx.fillStyle = i % 2 ? '#38a8ff' : PINK; ctx.beginPath(); const sx = x + i * 14; ctx.moveTo(sx, y); ctx.lineTo(sx + 7, y); ctx.lineTo(sx + 1, y + 6); ctx.lineTo(sx - 6, y + 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx, y + ch); ctx.lineTo(sx + 7, y + ch); ctx.lineTo(sx + 13, y + ch - 6); ctx.lineTo(sx + 6, y + ch - 6); ctx.fill(); }
  ctx.restore();
  // the picture side: the parcel (portrait: on top)
  const pw = portrait ? cw : cw * 0.36, ph = portrait ? ch * 0.4 : ch;
  const g = ctx.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, cols.b); g.addColorStop(1, cols.c);
  ctx.fillStyle = g; rr(ctx, x + 12, y + 14, pw - 24, ph - (portrait ? 14 : 28), 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  const px = x + pw / 2, py = y + (portrait ? ph * 0.56 : ph * 0.52), ps = Math.min(pw / 110, ph / 90, 1.8);
  if (c.kind === 'care') Art.parcel(ctx, px, py, ps, cols, t);
  else { const q = Math.min(ps, (pw - 30) / 150); Art.parcel(ctx, px - 26 * q, py + 10 * q, q * 0.72, cols, t); Art.parcel(ctx, px + 26 * q, py + 2 * q, q * 0.8, { a: '#38c8ff' }, t + 1); if (c.kind === 'all') Art.icon(ctx, 'gold', px, py - 40 * q, 16 * q, t); }
  // the writing side
  const tx = portrait ? x + 20 : x + pw + 4, tw = portrait ? cw - 40 : cw - pw - 54;
  let ty = portrait ? y + ph + 22 : y + 30;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const title = c.kind === 'care' ? 'A CARE PACKAGE FROM ' + (C ? C.name.toUpperCase() : '') : c.kind === 'all' ? 'THE LAST PARCEL' : 'CHINKA-O CAUGHT UP ON HER MAIL';
  fitFont(ctx, title, 13, tw - 50); ctx.fillStyle = '#3a2a5a'; ctx.fillText(title, tx, ty);
  // her stamp in the corner
  if (!portrait) Art.stamp(ctx, x + cw - 26, y + 34, 14, cols.a, 0.12);
  ty += 22;
  let note = '';
  if (c.kind === 'care') note = noteOf(C);
  else if (c.kind === 'all') note = 'Every single postcard. I knew you would. Here is the last thing in the shoebox. Read my letter in the album. ♥ C';
  else {
    const n = c.levels || 0, L = (c.lands || []).length;
    note = 'You found all three postcards in ' + n + (n === 1 ? ' level' : ' levels') + (L ? ' and every postcard in ' + L + (L === 1 ? ' land' : ' lands') : '') + ' before I had stamps. Here is all of it at once. ♥ C';
  }
  ctx.font = `italic ${portrait ? 14 : 13}px ${FONT_UI}`; ctx.fillStyle = '#2a2a4a';
  const nl = lines(ctx, note, tw);
  ctx.strokeStyle = 'rgba(60,40,80,0.18)'; ctx.lineWidth = 1;
  nl.forEach((l, i) => { const ly = ty + i * 19; ctx.beginPath(); ctx.moveTo(tx, ly + 9); ctx.lineTo(tx + tw, ly + 9); ctx.stroke(); ctx.fillText(l, tx, ly); });
  ty += nl.length * 19 + 10;
  // what is inside
  const items = [];
  if (c.kind === 'care') items.push(c.item);
  else if (c.kind === 'all') items.push(FINAL);
  else { (c.lands || []).forEach((cc, i) => items.push(itemOf(i))); if (c.all) items.push(FINAL); }
  ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = cols.a === '#fffaf0' ? PINK : shade(cols.a, -0.2); ctx.fillText('INSIDE:', tx, ty);
  if (c.kind === 'summary') {
    const life = c.lives ? '+' + c.lives + (c.lives === 1 ? ' LIFE' : ' LIVES') : '';
    ctx.font = `11px ${FONT_DISPLAY}`; ctx.fillStyle = '#c42a62'; ctx.fillText(life, tx + 58, ty);
    const shown = items.filter((q, i, a) => a.findIndex(r => r.id === q.id) === i);
    const r = 14, per = Math.max(1, Math.floor(tw / (2 * r + 10)));
    shown.slice(0, per * 2).forEach((q, i) => Art.icon(ctx, q.id, tx + r + (i % per) * (2 * r + 10), ty + 24 + Math.floor(i / per) * 34, r, t));
    if (shown.length) { ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = '#4a3a5a'; const rowsN = Math.ceil(Math.min(shown.length, per * 2) / per); lines(ctx, shown.map(q => q.name.toLowerCase().replace(/(^| )\w/g, m => m.toUpperCase())).join(' · ') + '. Switch them in the album.', tw).slice(0, 3).forEach((l, i) => ctx.fillText(l, tx, ty + 24 + rowsN * 34 - 6 + i * 13)); }
    if (!shown.length) { ctx.font = `italic 11px ${FONT_UI}`; ctx.fillStyle = '#5a4a6a'; ctx.fillText('lives, for now. Finish a whole land for a care package!', tx, ty + 22); }
  } else {
    const q = items[0], r = 17;
    Art.icon(ctx, q.id, tx + r + 2, ty + 28, r, t);
    ctx.fillStyle = '#3a2a5a'; fitFont(ctx, q.name, 12, tw - 2 * r - 14); ctx.fillText(q.name, tx + 2 * r + 12, ty + 18);
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = '#4a3a5a';
    lines(ctx, q.desc + (q.kind === 'look' ? ' (Switch it in the album.)' : ''), tw - 2 * r - 14).slice(0, 3).forEach((l, i) => ctx.fillText(l, tx + 2 * r + 12, ty + 35 + i * 14));
  }
  ctx.font = `9px ${FONT_DISPLAY}`; ctx.fillStyle = 'rgba(60,40,90,0.7)'; ctx.textAlign = 'right'; ctx.fillText('TAP TO CONTINUE', x + cw - 16, y + ch - 16);
  ctx.restore();
}
TourPostcards.drawCareCard = drawCareCard;

// the land map: a stop with all three postcards wears a stamp instead of three little cards
if (typeof TourOWPaint !== 'undefined') {
  const pc0 = TourOWPaint.postcards;
  TourOWPaint.postcards = function (c, n, ow, dx) {
    if (n && n.id && full(n.id)) { Art.stamp(c, dx, -24, 6.5, ow.C.colors.a, -0.12); return; }
    return pc0.call(this, c, n, ow, dx);
  };
}
// the world map: a land with every postcard gets a gold stamp on its pin
if (typeof TourHooks !== 'undefined') {
  TourHooks.on('routeDraw', (scene, ctx, layer) => {
    if (layer !== 'over') return;
    const P = TourPostcards.data();
    for (const cc of P.order) { const s = Tour.stops[cc], C = Tour.countries[cc]; if (!s || !C || TourMap.stopState(s) === 'hidden') continue; Art.stamp(ctx, scene.sx(s.lon) - TourMap.pinR - 4, scene.sy(s.lat) - TourMap.pinR + 2, 6, '#e8a818', -0.2); }
  });
  // the land chip (top left of a land's map) opens the album at this land
  TourHooks.on('owTap', (ow, tp) => {
    const R = ow.chipR; if (!R || ow.fixed) return false;
    if (tp.x >= R.x - 4 && tp.x <= R.x + 170 && tp.y >= R.y - 4 && tp.y <= R.y + R.h + 4) { Sound.play('select'); ow.scene.leave(new PostcardAlbum(ow.scene, ow.C.id)); return true; }
    return false;
  });
  // Settings: one row once a perk is in: it opens the perks page (each perk switches there)
  TourHooks.on('settings', scene => TourPostcards.perkCount() ? { label: 'POSTCARD PERKS', value: TourPostcards.perksOn() + ' ON  ▸', fn: () => { Sound.play('select'); Game.setScene(new PostcardAlbum(scene, 'perks')); } } : null);
}
// the land map's pause menu: POSTCARD ALBUM
if (typeof TourMapScene !== 'undefined' && TourMapScene.Overworld) {
  const OP = TourMapScene.Overworld.prototype, om0 = OP.openMenu;
  OP.openMenu = function () {
    om0.call(this);
    const M = this.menu; if (!M || !M.length) return;
    const last = M[M.length - 1], S = this.scene, C = this.C;
    for (const b of M) b.y -= 27;
    M.splice(M.length - 1, 0, { x: last.x, y: last.y, w: last.w, h: last.h, label: 'POSTCARD ALBUM', fn: () => { this.menu = null; Sound.play('select'); S.leave(new PostcardAlbum(S, C.id)); } });
    last.y += 54;
  };
}

/* ---------- 4. every postcard: Chinka-O's letter ---------- */
function LetterPanels() {
  const C = TourCast, n = TourPostcards.counts().gold;
  return [
    { text: 'Every postcard. All ' + n + ' of them. Chinka-O laid them out end to end on the floor of the Showtrunk, and they went all the way round the world map. Twice.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_title'); for (let i = 0; i < 9; i++) Art.card(ctx, W * (0.08 + i * 0.105), gy - 10 * s - Math.abs(Math.sin(t * 1.2 + i)) * 8 * s, s * 1.4, Tour.byWorld[Tour.worldList()[i % Tour.worldList().length]].colors, Math.sin(i * 1.7) * 0.2); C.chinka(ctx, W * 0.5, gy, s, t, 'idle', 1); } },
    { text: 'Chinka-O: "I wrote you one from every stop. You found every single one." Brady-O: "Your handwriting is beautiful." Chinka-O: "You said that already." Brady-O: "Still true."',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_dusk'); C.brady(ctx, W * 0.36, gy, s, t, 'idle', 1); C.chinka(ctx, W * 0.62, gy, s, t, 'wave', -1); Art.heart(ctx, W * 0.49, gy - 90 * s - Math.sin(t * 2) * 6, 4 * s, '#ff6fae', INK); } },
    { text: 'In the very last parcel: a golden cape, and one more postcard. It says WISH YOU WERE HERE, and this time he was. Pupo: "...shiny... pupo."',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_title'); C.pupo(ctx, W * 0.28, gy, s * 0.85, t, 'happy', 1); Art.parcel(ctx, W * 0.55, gy - 30 * s, s * 1.2, { a: PINK }, t); Art.icon(ctx, 'gold', W * 0.55, gy - 92 * s, 22 * s, t); C.chinka(ctx, W * 0.78, gy, s, t, 'idle', -1); } }
  ];
}
TourPostcards.LetterPanels = LetterPanels;
const musicOf = () => { const n = Sound.trackNames || []; return n.indexOf('tour_title') >= 0 ? 'tour_title' : undefined; };
if (typeof goToMap === 'function' && typeof StoryScene !== 'undefined' && typeof TourCast !== 'undefined') {
  const go0 = goToMap;
  goToMap = function (set, world, fromId) {
    try {
      TourPostcards.sync();
      const P = TourPostcards.data();
      if (set === 'world' && P.story) { P.story = false; Save.save(); Game.setScene(new StoryScene(LetterPanels(), () => go0(set, world, fromId), musicOf())); return; }
    } catch (e) { TourHooks.fault('postcards', e); }
    return go0(set, world, fromId);
  };
}

/* ---------- 5. the album ---------- */
class PostcardAlbum {
  constructor(back, at) {
    this.back = back; this.t = 0; this.swipeN = Input.swipes.length;
    this.pages = ['perks'].concat(lands().map(C => C.id));
    this.page = Math.max(0, this.pages.indexOf(at || 'perks'));
    if (at && at !== 'perks' && this.page === 0) this.page = 1;
    Input.setMode('ui'); Input.hud = null;
    this.build();
  }
  resize() { this.build(); }
  build() {
    const W = Game.cssW, H = Game.cssH, side = Math.max(12, insets.l + 8, insets.r + 8), top = Math.max(8, insets.t + 4), bot = Math.max(8, insets.b + 4);
    this.portrait = H > W * 1.05;
    this.backBtn = { x: side, y: top, w: 84, h: 36, label: '◀ BACK', size: 11, fn: () => this.leave() };
    const bh = 40, by = H - bot - bh;
    this.prevBtn = { x: side, y: by, w: 58, h: bh, label: '◀', size: 14, fn: () => this.turn(-1) };
    this.nextBtn = { x: W - side - 58, y: by, w: 58, h: bh, label: '▶', size: 14, fn: () => this.turn(1) };
    this.paper = { x: side, y: top + 44 + (this.portrait ? 22 : 0), w: W - side * 2, h: by - 8 - (top + 44 + (this.portrait ? 22 : 0)) };
    this.btns = [this.backBtn, this.prevBtn, this.nextBtn];
    this.tiles = null; this.letterBtn = null;
  }
  leave() {
    Sound.play('back'); Save.save();
    const b = this.back;
    if (b && b.resume) Game.setScene(b.resume() || b);
    else if (b && typeof SettingsScene !== 'undefined' && b instanceof SettingsScene) { b.build(); Game.setScene(b); }
    else Game.setScene(new TitleScene());
  }
  turn(d) { this.page = (this.page + d + this.pages.length) % this.pages.length; this.tiles = null; this.letterBtn = null; Sound.play('cardFlip'); this.flipT = 0.25 * d; }
  update(dt) {
    this.t += dt; if (this.flipT) this.flipT = Math.abs(this.flipT) < dt * 1.5 ? 0 : this.flipT - Math.sign(this.flipT) * dt * 1.5;
    if (Input.swipes.length !== this.swipeN) { const s = Input.swipes[Input.swipes.length - 1]; this.swipeN = Input.swipes.length; if (s === 'L') { this.turn(1); return; } if (s === 'R') { this.turn(-1); return; } }
    if (Input.swipes.length < this.swipeN) this.swipeN = Input.swipes.length;
    for (const tp of Input.taps) {
      for (const b of this.btns) if (tp.x >= b.x - 6 && tp.x <= b.x + b.w + 6 && tp.y >= b.y - 6 && tp.y <= b.y + b.h + 6) { b._press = 0.12; Sound.play('select'); b.fn(); return; }
      if (this.letterBtn) { const b = this.letterBtn; if (tp.x >= b.x && tp.x <= b.x + b.w && tp.y >= b.y && tp.y <= b.y + b.h) { this.readLetter(); return; } }
      if (this.tiles) for (const T of this.tiles) if (tp.x >= T.x && tp.x <= T.x + T.w && tp.y >= T.y && tp.y <= T.y + T.h) {
        if (TourPostcards.unlocked(T.id)) { const on = TourPostcards.toggle(T.id); Sound.play(on ? 'select' : 'back'); }
        else Sound.play('bump', { vol: 0.4 });
        return;
      }
    }
    const k = Input.uiKey;
    if (k === 'left') this.turn(-1);
    else if (k === 'right') this.turn(1);
    else if (k === 'back' || Input.pausePressed) this.leave();
  }
  readLetter() { Sound.play('select'); const self = this; Game.setScene(new StoryScene(LetterPanels(), () => { Input.setMode('ui'); Game.setScene(self); }, musicOf())); }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, t = this.t;
    ctx.save(); ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    // the album's cover: a deep leather, a little stitched border
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4a2a3a'); g.addColorStop(1, '#2a1424'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,220,180,0.18)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); rr(ctx, 5, 5, W - 10, H - 10, 14); ctx.stroke(); ctx.setLineDash([]);
    // header
    const c = TourPostcards.counts(), B = this.backBtn;
    UI.drawButton(ctx, B, false);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff4e0';
    const hy = B.y + B.h / 2;
    if (this.portrait) {
      fitFont(ctx, 'POSTCARD ALBUM', 18, W - B.w * 2 - 40); ctx.fillText('POSTCARD ALBUM', W / 2 + 20, hy);
      this.countChip(ctx, W / 2, hy + 32, c);
    } else {
      fitFont(ctx, 'POSTCARD ALBUM', 20, W * 0.4); ctx.fillText('POSTCARD ALBUM', W / 2, hy);
      this.countChip(ctx, W - Math.max(12, insets.r + 8) - 4, hy, c, true);
    }
    // the page
    const P = this.paper, id = this.pages[this.page];
    ctx.save();
    if (this.flipT) { ctx.translate(W / 2, 0); ctx.scale(1 - Math.abs(this.flipT) * 1.2, 1); ctx.translate(-W / 2, 0); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, P.x + 3, P.y + 4, P.w, P.h, 10); ctx.fill();
    ctx.fillStyle = '#fbf3e0'; rr(ctx, P.x, P.y, P.w, P.h, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    // photo-mount corners
    ctx.fillStyle = '#2a1424';
    for (const [cx, cy, sx, sy] of [[P.x, P.y, 1, 1], [P.x + P.w, P.y, -1, 1], [P.x, P.y + P.h, 1, -1], [P.x + P.w, P.y + P.h, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * 3, cy + sy * 3); ctx.lineTo(cx + sx * 18, cy + sy * 3); ctx.lineTo(cx + sx * 3, cy + sy * 18); ctx.closePath(); ctx.fill(); }
    if (id === 'perks') this.drawPerks(ctx, P, t); else this.drawLand(ctx, P, Tour.countries[id], t);
    ctx.restore();
    // footer
    UI.drawButton(ctx, this.prevBtn, false); UI.drawButton(ctx, this.nextBtn, false);
    const name = id === 'perks' ? 'CARE PACKAGES' : (TourPostcards.landShown(Tour.countries[id]) ? Tour.countries[id].name.toUpperCase() : 'SECRET LAND');
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,240,220,0.85)'; ctx.font = `11px ${FONT_DISPLAY}`;
    ctx.fillText(name, W / 2, this.prevBtn.y + 14);
    ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,240,220,0.6)'; ctx.fillText('PAGE ' + (this.page + 1) + ' OF ' + this.pages.length, W / 2, this.prevBtn.y + 30);
    ctx.restore();
  }
  countChip(ctx, x, y, c, right) {
    ctx.save(); ctx.font = `12px ${FONT_DISPLAY}`;
    const txt = c.gold + ' / ' + c.total, tw = ctx.measureText(txt).width + 40, x0 = right ? x - tw : x - tw / 2;
    ctx.fillStyle = 'rgba(255,244,224,0.12)'; rr(ctx, x0, y - 14, tw, 28, 14); ctx.fill();
    Art.card(ctx, x0 + 16, y, 0.6, { a: PINK, b: '#38c8ff', c: '#ffd84a' }, -0.1);
    ctx.fillStyle = '#fff4e0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x0 + 30, y + 1);
    ctx.restore();
  }
  drawLand(ctx, P, C, t) {
    const cols = colsOf(C), pad = 14;
    if (!TourPostcards.landShown(C)) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(60,40,80,0.18)'; ctx.font = `${Math.min(90, P.h * 0.4)}px ${FONT_DISPLAY}`; ctx.fillText('?', P.x + P.w / 2, P.y + P.h * 0.42);
      ctx.fillStyle = '#5a4a6a'; ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillText('A SECRET LAND', P.x + P.w / 2, P.y + P.h * 0.7);
      ctx.font = `italic 12px ${FONT_UI}`; ctx.fillText('Not found yet. Its page stays empty until you get there.', P.x + P.w / 2, P.y + P.h * 0.7 + 22, P.w - 30);
      return;
    }
    const ids = TourPostcards.pageLevels(C), hidden = Tour.levelIds(C).length - ids.length;
    let g = 0; for (const id of ids) g += TourPostcards.full(id) ? 3 : TourProgress.goldCount(id);
    const done = TourPostcards.landDone(C), Pd = TourPostcards.data();
    // the land's band
    const bx = P.x + pad, by = P.y + pad, bw = P.w - pad * 2, bh = 30;
    ctx.fillStyle = cols.a; rr(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.2); rr(ctx, bx + 4, by + 4, bw - 8, 6, 3); ctx.fill();
    if (C.emblem) { ctx.fillStyle = cols.b; ctx.beginPath(); ctx.arc(bx + 18, by + bh / 2, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 1.5; ctx.stroke(); try { C.emblem(ctx, bx + 18, by + bh / 2, 8, t); } catch (e) { /* an emblem that wants a map */ } }
    else Art.stamp(ctx, bx + 18, by + bh / 2, 10, cols.b, -0.1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = CREAM;
    fitFont(ctx, C.name.toUpperCase(), 15, bw * 0.55); ctx.fillText(C.name.toUpperCase(), bx + 36, by + bh / 2 + 1);
    ctx.textAlign = 'right'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.fillText(g + ' / ' + ids.length * 3, bx + bw - 12, by + bh / 2 + 1);
    // the level rows (left / top) and the care package (right / bottom)
    const listW = this.portrait ? bw : bw * 0.58, listH = this.portrait ? Math.min(P.h * 0.56, (ids.length + (hidden ? 1 : 0)) * 46 + 6) : P.h - bh - pad * 3;
    const rowH = Math.min(this.portrait ? 46 : 40, (listH - 4) / Math.max(1, ids.length + (hidden ? 0.6 : 0)));
    const ly = by + bh + 8, cs = clamp(rowH / 26, 0.85, 1.25), slotW = 34 * cs;
    ids.forEach((id, i) => {
      const y = ly + i * rowH + rowH / 2, L = Tour.specOf(id), gd = Save.data.gold[id] || [], all3 = TourPostcards.full(id);
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(60,40,80,0.05)'; ctx.fillRect(bx, y - rowH / 2, listW, rowH); }
      ctx.fillStyle = L.secret ? '#ffd84a' : cols.b; rr(ctx, bx + 2, y - 10, 40, 20, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillText(id, bx + 22, y + 1);
      const sx0 = bx + listW - slotW * 3 - 30 * cs;
      ctx.textAlign = 'left'; ctx.fillStyle = '#3a2a5a'; ctx.font = `${this.portrait ? 12 : 12}px ${FONT_UI}`;
      ctx.fillText(TourLandscape.fit(ctx, L.name, sx0 - bx - 56), bx + 50, y + 1);
      for (let q = 0; q < 3; q++) { const x = sx0 + slotW * (q + 0.5); if (gd[q]) Art.card(ctx, x, y, cs * 0.92, cols, (q - 1) * 0.06); else Art.ghost(ctx, x, y, cs * 0.92, id); }
      if (all3) Art.stamp(ctx, bx + listW - 15 * cs, y, 9 * cs, cols.a, 0.12);
    });
    if (hidden) { ctx.textAlign = 'left'; ctx.font = `italic 11px ${FONT_UI}`; ctx.fillStyle = '#6a5a7a'; ctx.fillText('+ ' + (hidden === 1 ? 'a secret level' : hidden + ' secret levels') + ' not found yet', bx + 4, ly + ids.length * rowH + 12); }
    // the care package side
    const nx = this.portrait ? bx : bx + listW + 16, ny = this.portrait ? ly + listH + 12 : ly, nw = this.portrait ? bw : bw - listW - 16, nh = this.portrait ? Math.min(250, P.y + P.h - pad - ny) : P.y + P.h - pad - ny;
    if (nh < 60) return;
    ctx.save(); ctx.translate(nx + nw / 2, ny + nh / 2); ctx.rotate(done ? 0.012 : -0.01); ctx.translate(-(nx + nw / 2), -(ny + nh / 2));
    ctx.fillStyle = done ? CREAM : 'rgba(255,255,255,0.4)'; rr(ctx, nx, ny, nw, nh, 6); ctx.fill();
    ctx.strokeStyle = done ? INK : 'rgba(60,40,80,0.35)'; ctx.lineWidth = 1.3; if (!done) ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    const tx = nx + 12, tw = nw - 24;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (done) {
      const k = Pd.lands[C.id], it = itemOf(k != null ? k : 0);
      ctx.fillStyle = '#3a2a5a'; fitFont(ctx, 'CARE PACKAGE', 12, tw - 40); ctx.fillText('CARE PACKAGE', tx, ny + 18);
      Art.stamp(ctx, nx + nw - 20, ny + 22, 11, cols.a, 0.15);
      ctx.font = `italic 12px ${FONT_UI}`; ctx.fillStyle = '#2a2a4a';
      const nl = lines(ctx, noteOf(C), tw), maxL = Math.max(1, Math.floor((nh - 96) / 17));
      nl.slice(0, maxL).forEach((l, i) => ctx.fillText(l, tx, ny + 42 + i * 17));
      const iy = ny + nh - 30;
      Art.icon(ctx, it.id, tx + 16, iy, 15, t);
      ctx.fillStyle = '#3a2a5a'; fitFont(ctx, it.name, 11, tw - 40); ctx.fillText(it.name, tx + 38, iy - 6);
      ctx.font = `10px ${FONT_UI}`; ctx.fillStyle = '#6a5a7a'; ctx.fillText(it.kind === 'look' ? 'for Brady' + (TourPostcards.unlocked(it.id) ? (TourPostcards.on(it.id) ? ' · ON' : ' · OFF') : '') : it.id === 'lives' ? 'lives' : 'a helper' + (TourPostcards.unlocked(it.id) ? (TourPostcards.on(it.id) ? ' · ON' : ' · OFF') : ''), tx + 38, iy + 9);
    } else {
      Art.parcel(ctx, nx + nw / 2, ny + Math.min(nh * 0.34, 52), Math.min(1, nh / 170), { a: '#b8a8c8' }, 0);
      ctx.textAlign = 'center'; ctx.font = `italic 12px ${FONT_UI}`; ctx.fillStyle = '#5a4a6a';
      const msg = 'Find every postcard in ' + C.name + ' and Chinka-O sends a care package.';
      const nl = lines(ctx, msg, tw), y0 = ny + Math.min(nh * 0.34, 52) + 46;
      nl.forEach((l, i) => ctx.fillText(l, nx + nw / 2, y0 + i * 16));
      const nxt = itemOf(Pd.order.length);
      if (y0 + nl.length * 16 + 20 < ny + nh) { ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = '#8a7a9a'; ctx.fillText('NEXT IN THE BOX: ' + nxt.name, nx + nw / 2, y0 + nl.length * 16 + 12, tw); }
    }
    ctx.restore();
  }
  drawPerks(ctx, P, t) {
    const pad = 14, Pd = TourPostcards.data(), c = TourPostcards.counts();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3a2a5a';
    fitFont(ctx, 'CHINKA-O\'S CARE PACKAGES', 15, P.w - pad * 2); ctx.fillText('CHINKA-O\'S CARE PACKAGES', P.x + pad + 4, P.y + pad + 10);
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = '#5a4a6a';
    const sub = 'All 3 postcards in a level: +1 life (' + c.levels + ' so far). Every postcard in a land: a care package (' + c.lands + ' of ' + c.landsTotal + ' lands). Tap a perk to switch it.';
    const sl = lines(ctx, sub, P.w - pad * 2 - 8);
    sl.forEach((l, i) => ctx.fillText(l, P.x + pad + 4, P.y + pad + 30 + i * 15));
    const items = PERKS.concat([FINAL]);
    const gy = P.y + pad + 30 + sl.length * 15 + 6, cols = this.portrait ? 2 : 4, rows = Math.ceil(items.length / cols), gap = 8;
    const all = TourPostcards.all(), lbH = all ? 40 : 0;
    const tw = (P.w - pad * 2 - gap * (cols - 1)) / cols, th = Math.min(this.portrait ? 150 : 120, (P.y + P.h - pad - gy - lbH - gap * (rows - 1)) / rows);
    this.tiles = [];
    items.forEach((it, i) => {
      const x = P.x + pad + (i % cols) * (tw + gap), y = gy + Math.floor(i / cols) * (th + gap), un = TourPostcards.unlocked(it.id), on = TourPostcards.on(it.id);
      this.tiles.push({ id: it.id, x, y, w: tw, h: th });
      ctx.fillStyle = un ? (on ? '#fff8e8' : '#efe6d4') : 'rgba(60,40,80,0.06)'; rr(ctx, x, y, tw, th, 8); ctx.fill();
      ctx.strokeStyle = un ? INK : 'rgba(60,40,80,0.3)'; ctx.lineWidth = un ? 1.4 : 1; if (!un) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      const ir = Math.min(18, th * 0.14), ix = x + ir + 10, iy = y + ir + 9;
      Art.icon(ctx, it.id, ix, iy, ir, t, !un);
      ctx.textAlign = 'left'; ctx.fillStyle = un ? '#3a2a5a' : '#8a7a9a';
      fitFont(ctx, it.name, 11, tw - ir * 2 - 26); ctx.fillText(it.name, ix + ir + 8, iy - 5);
      ctx.font = `bold 9px ${FONT_UI}`; ctx.fillStyle = it.kind === 'look' ? '#c42a62' : '#2a7a9a'; ctx.fillText(it.kind === 'look' ? 'FOR BRADY' : 'HELPER', ix + ir + 8, iy + 9);
      const fs = th < 110 ? 9.5 : 10.5, lh = fs * 1.22, d0 = iy + ir + 4 + lh / 2;
      ctx.font = `${fs}px ${FONT_UI}`; ctx.fillStyle = un ? '#4a3a5a' : '#9a8aaa';
      const dl = lines(ctx, it.desc, tw - 18), maxL = Math.max(1, Math.floor((y + th - 24 - d0 + lh / 2) / lh));
      dl.slice(0, maxL).forEach((l, q) => ctx.fillText(l, x + 9, d0 + q * lh));
      // the status pill
      const pl = un ? (on ? 'ON' : 'OFF') : it.id === 'gold' ? 'EVERY POSTCARD' : ordinal(i + 1) + ' LAND';
      ctx.font = `9px ${FONT_DISPLAY}`; const pw = ctx.measureText(pl).width + 16, px = x + tw - pw - 7, py = y + th - 22;
      ctx.fillStyle = un ? (on ? '#3ac87a' : '#a89aa8') : 'rgba(60,40,80,0.12)'; rr(ctx, px, py, pw, 16, 8); ctx.fill();
      ctx.fillStyle = un ? '#ffffff' : '#7a6a8a'; ctx.textAlign = 'center'; ctx.fillText(pl, px + pw / 2, py + 8.5);
    });
    ctx.textAlign = 'left'; ctx.font = `italic 10px ${FONT_UI}`; ctx.fillStyle = '#7a6a8a';
    const after = 'After the ' + ordinal(PERKS.length).toLowerCase() + ' land, every care package holds +' + LIVES_PACK + ' lives.';
    const ay = gy + rows * (th + gap) + 4;
    if (!all && ay < P.y + P.h - 6) ctx.fillText(after, P.x + pad + 4, ay);
    this.letterBtn = null;
    if (all) {
      const bw = Math.min(260, P.w - pad * 2), b = { x: P.x + (P.w - bw) / 2, y: P.y + P.h - pad - 34, w: bw, h: 32 };
      this.letterBtn = b;
      ctx.fillStyle = PINK; rr(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.fillText('READ CHINKA-O\'S LETTER  ♥', b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
  }
}
TourPostcards.Album = PostcardAlbum;

/* ---------- 6. the title: the progress chip opens the album ---------- */
if (typeof SBWTitleScene !== 'undefined') {
  const TP = SBWTitleScene.prototype, in0 = TP.input, dr0 = TP.draw;
  const tag = sc => {
    if (!sc.chipS || !sc.cta) return null;
    const cx = sc.cta.x + sc.cta.w / 2, w = sc.chipS.w, h = sc.chipS.h;
    return { x: cx + w / 2 + 6, y: sc.chipY - h / 2, w: 74, h, chip: { x: cx - w / 2, y: sc.chipY - h / 2, w, h } };
  };
  TP.input = function () {
    const R = tag(this);
    if (R) for (const tp of Input.taps) {
      const inR = b => tp.x >= b.x - 4 && tp.x <= b.x + b.w + 4 && tp.y >= b.y - 6 && tp.y <= b.y + b.h + 6;
      if (inR(R) || inR(R.chip)) { Input.taps.length = 0; Sound.play('select'); Game.setScene(new PostcardAlbum(this, 'perks')); return; }
    }
    return in0.call(this);
  };
  TP.draw = function (ctx) {
    dr0.call(this, ctx);
    const R = tag(this); if (!R) return;
    ctx.save(); ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const pop = this.go ? Math.max(0, 1 - this.go.t * 3) : clamp((this.t - 1.2) * 3, 0, 1);
    ctx.globalAlpha = pop;
    ctx.fillStyle = 'rgba(28,20,38,0.72)'; rr(ctx, R.x, R.y, R.w, R.h, R.h / 2); ctx.fill();
    ctx.fillStyle = PINK; rr(ctx, R.x + 2, R.y + 2, R.w - 4, R.h - 4, R.h / 2 - 2); ctx.fill();
    ctx.fillStyle = CREAM; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ALBUM ▸', R.x + R.w / 2, R.y + R.h / 2 + 1);
    ctx.restore();
  };
}

/* ---------- 7. on load: an old save's catch-up (quiet; one summary card on the map) ---------- */
{
  const l0 = Save.load;
  Save.load = function () { const d = l0.apply(this, arguments); try { if (typeof BRADY_APP === 'undefined' || BRADY_APP === 'world') TourPostcards.sync(); } catch (e) { /* the tour is not in this app */ } return d; };
}

try { if (typeof window !== 'undefined') { window.BRADY_POSTCARDS = TourPostcards; window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourPostcards = TourPostcards; } } catch (e) { /* not in a browser */ }
globalThis.TourPostcards = TourPostcards;
})();
