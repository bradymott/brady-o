/* ============================================================
   SUPER BRADY-O WORLD — the 2D overworld campaign.
   10 lands (ids 41-50), 60 levels, a walkable overworld map.

   Story: the Man (the giant wooden effigy) fell in love with Chinka and
   carried her to the top of his pavilion. Brady crosses the playa land
   by land to bring her home.

   Every level is meant to feel different: each entry in a land's `spec`
   names the level's signature idea. `plan` is the generator archetype
   used today; `kinds` is the node type shown on the overworld
   (level / haunt / fort / castle / gift).
   Gift camps are hidden side camps behind secret exits; each hands Brady a
   permanent burner gift (saved in Save.data.gifts).
   ============================================================ */

/* ---------- lands ---------- */
const WORLD_LANDS = [
  { id: 41, name: 'Gate Road', tag: 'The endless line of RVs', color: '#e8a060', mood: 'dusk' },
  { id: 42, name: 'Center Camp', tag: 'Big top, bad coffee, acrobats', color: '#f0c070', mood: 'day' },
  { id: 43, name: 'The Esplanade', tag: 'Sound camps and lasers', color: '#ff4fd8', mood: 'night' },
  { id: 44, name: 'Theme Camp Row', tag: 'Witches, crusties and pancakes', color: '#8ad86a', mood: 'day' },
  { id: 45, name: 'Hot Springs', tag: 'Off the playa: steam and mud', color: '#5ac8e8', mood: 'day' },
  { id: 46, name: 'Deep Playa', tag: 'Sculptures, dust and wanderers', color: '#c89ae8', mood: 'night' },
  { id: 47, name: 'Hell Station', tag: 'DPW turf: fuel, rebar, forklifts', color: '#ff7a3a', mood: 'dusk' },
  { id: 48, name: 'The Man Base', tag: 'Where the Man keeps Chinka', color: '#ffd84a', mood: 'night' },
  { id: 49, name: 'Sunrise Set', tag: 'Secret: dance till dawn', color: '#ffb0a0', mood: 'dawn', secret: true },
  { id: 50, name: 'World 22', tag: 'Secret: the last page', color: '#9affd8', mood: 'void', secret: true }
];

/* ---------- levels per land ---------- */
// plan: broad archetype (shown on the map); kinds: overworld node type; spec: the level's signature idea.
// pool: the land's burner roster. The full per-level recipes live in LEVEL_DESIGNS (08c_designs.js).
Object.assign(WORLDS, {
  41: { set: 'world', label: '1', name: 'Gate Road', theme: 'gate', pool: ['driver', 'greeter', 'camplead', 'hippie'],
    plan: ['ow', 'auto', 'ow', 'under', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'haunt', 'level', 'castle', 'gift'],
    names: ['Mile 1: The Line', 'RV Rooftop Convoy', 'Dust-Out Detour', 'The Stowaway RV', 'Six Days on the Road', 'Greeter Station', 'Kandi Camp'],
    spec: ['first steps: hop the roofs and awnings of idling RVs; six-day drivers shuffle; a greeter gifts a mushroom',
      'auto-scroll: the road is washed out, ride RV roofs that inch forward and brake',
      'dust gusts and whiteouts, tumbleweeds, a flag line; a VIP key behind a fake wall opens the secret exit to Kandi Camp',
      'haunted puzzle house: an RV maze of bunks, hatches and teleporting doors; falling luggage; find the cab key',
      'a honking traffic jam: horn blasts shove you back; stressed camp leads charge and yell',
      'castle: greeter bells and greeters, then the Head Greeter (hug grabs, bell shockwaves, dust angels)',
      'gift camp: kandi kids gift power-ups; earn kandi bracelets (one extra hit at the start of every level)'] },
  42: { set: 'world', label: '2', name: 'Center Camp', theme: 'bigtop', pool: ['camplead', 'crusty', 'poet', 'raver', 'hippie'],
    plan: ['ow', 'ow', 'under', 'tower', 'sky', 'castle'],
    kinds: ['level', 'level', 'level', 'fort', 'level', 'castle'],
    names: ['Coffee Line Crawl', 'Big Top Trapeze', 'Slam Poetry Pit', 'Chai Tower', 'Acro Yoga Heights', "Barista Bot's Espresso Works"],
    spec: ['the coffee line: hop along the heads of people waiting over spilled coffee; cup lifts and espresso steam vents',
      'inside the big top: swing on trapezes over safety nets, bounce high on the canvas, dodge the fire act',
      'underground open mic: slam poets on pedestals fire verse volleys; hippies snap',
      'fortress climb up a chai stand: teacup lifts, teetering trays, boiling chai rising below; the Head Camp Lead waits on the roof',
      'sky level of acro-yoga human platforms that lift you, then tilt you off if you linger',
      'castle: conveyors of cups, coffee spills and cup lifts, then Barista Bot (steam blasts, espresso cups, foam)'] },
  43: { set: 'world', label: '3', name: 'The Esplanade', theme: 'esplanade', pool: ['raver', 'spinner', 'influencer', 'creeper'],
    plan: ['ow', 'ow', 'under', 'auto', 'under', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'haunt', 'castle', 'gift'],
    names: ['Bass Drop Boulevard', 'Laser Grid Rave', 'Inside the Subwoofer', 'Disco Bus Ride', 'Strobe House', "DJ Wub-Lord's Stage", 'Lamplighter Camp'],
    spec: ['dance-floor platforms that hold you on the beat; subwoofer stacks send bass waves along the ground',
      'laser gates switch on and off with the music; sweeping lasers; influencers flash cameras',
      'inside a giant speaker: bounce on cones, ride port-tube updrafts in the dark; secret porta-potty to Lamplighter Camp',
      'auto-scroll riding one long disco bus through the crowd: duck banners, dodge disco balls and crowd surfers, grab photos off the trusses',
      'haunted strobe house: strobe blocks blink in and out, mirrors are doors, creepers lunge; find the key',
      'castle: beat pads, bass waves and lasers, then DJ Wub-Lord (bass drops, laser sweeps, summoned ravers)',
      'gift camp in the dark: light the lamp posts to see; earn a lantern that lights dark and dusty levels'] },
  44: { set: 'world', label: '4', name: 'Theme Camp Row', theme: 'camps', pool: ['crusty', 'witch', 'hippie', 'pony', 'thief'],
    plan: ['ow', 'ow', 'under', 'ow', 'sky', 'castle'],
    kinds: ['level', 'level', 'haunt', 'level', 'level', 'castle'],
    names: ['Pancake Camp Breakfast', 'Witchy Woods', 'The Lost & Found', 'Crusty Corner', 'Bubble Camp Heights', "Grand Witch Moonbeam's Coven"],
    spec: ['a hot griddle with flipping pancakes that fling you skyward; sticky syrup and slick butter',
      'dusk woods: pagan witches on brooms drop crystals; crystal spikes and standing stones; LSD shows hidden ledges',
      'haunted lost-and-found maze of lockers, junk piles and fake walls; a silver key opens the secret exit to Sunrise Set',
      'crusty old burners rant "it was better in 98!" (slows you); bouncy curbside couches and art from 98',
      'ride giant soap bubbles up between camp towers before they pop',
      'castle: crystals and standing stones, then Grand Witch Moonbeam (crystal rain, broom witches, swoops)'] },
  45: { set: 'world', label: '5', name: 'Hot Springs', theme: 'hotsprings', pool: ['hippie', 'crusty', 'creeper', 'thief'],
    plan: ['ow', 'water', 'ow', 'under', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'level', 'castle', 'gift'],
    names: ['Road Trip Detour', 'Hot Pool Plunge', 'Geyser Field', 'Steam Caverns', 'Mud Slide Canyon', "Geyser Guardian's Grotto", 'Bike Repair Camp'],
    spec: ['desert detour off the highway: rolling tumbleweeds and a broken-down van to climb',
      'swim the hot pools: warm currents drift you sideways, bubble columns lift you',
      'geysers erupt on a timer and launch you; mineral terraces; a high road leads to the secret exit to Bike Repair Camp',
      'steam vents in the dark: ride the updrafts between ledges over scalding pools',
      'slick mud slopes, boulders rolling downhill, pits of mud',
      'castle over hot water: geysers and steam, then the Geyser Guardian (geysers under your feet, mud balls)',
      'gift camp: bike pumps and tire swings; a tune-up makes Brady run faster'] },
  46: { set: 'world', label: '6', name: 'Deep Playa', theme: 'deepplaya', pool: ['influencer', 'pony', 'thief', 'devil', 'ledjelly', 'creeper'],
    plan: ['ow', 'sky', 'ow', 'auto', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'level', 'castle', 'gift'],
    names: ['Sculpture Garden', 'LED Jellyfish Drift', 'Influencer Alley', 'Art Car Caravan', 'Whiteout', "Dust Devil Diablo's Vortex", 'Hydration Station'],
    spec: ['climb giant art sculptures at night (a hand, whale ribs, a head, a flower); bike thieves',
      'drift over the dark: bounce on floating LED jellyfish bells, avoid the stinging tentacles',
      'influencers flash cameras (daze), sparkle ponies steal your power-up; a key opens the VIP hut with the secret exit to Hydration Station',
      'auto-scroll hopping between night art cars whose hydraulics bounce the decks',
      'total dust storm: see only by glow sticks; dust devils carry you over the ruts',
      'castle in the wind: dust devils, then Dust Devil Diablo (pulls you in, flings debris, splits)',
      'gift camp: misting updrafts and water jugs; one more health step (start every level big)'] },
  47: { set: 'world', label: '7', name: 'Hell Station', theme: 'dpwyard', pool: ['dpw', 'techbro', 'camplead', 'thief'],
    plan: ['ow', 'ow', 'castle', 'auto', 'ow', 'castle'],
    kinds: ['level', 'level', 'fort', 'level', 'level', 'castle'],
    names: ['Fuel Line', 'Forklift Frenzy', 'Rebar Yard', 'Tech Bro Bypass', 'Trash Fence Tunnel', "Foreman Rusty's Depot"],
    spec: ['fuel tanks with flame cannons, leaky barrels that explode, DPW crews (two stomps, thrown wrenches)',
      'conveyor belts, forklift lifts and a crane hook carrying a pallet over rebar',
      'fortress of scaffolding planks over rebar beds; mid-boss Forklift Frank',
      'auto-scroll: tech bros on electric unicycles rush in from behind (get up on the docks); pitch bubbles; a high road to the secret exit to Sunrise Set',
      'the trash fence funnels a howling wind; flying MOOP',
      'castle: barrels, forklifts and rebar, then DPW Foreman Rusty (wrenches, rebar swings, fuel barrels)'] },
  48: { set: 'world', label: '8', name: 'The Man Base', theme: 'manbase', pool: ['spinner', 'dpw', 'raver', 'greeter', 'influencer'],
    plan: ['ow', 'ow', 'tower', 'castle', 'castle'],
    kinds: ['level', 'level', 'level', 'fort', 'castle'],
    names: ['The Long Walk', 'Fire Conclave', 'Saucer Scaffold', 'Neon Gauntlet', "The Man's Pavilion"],
    spec: ['the walk out to the Man: one set piece from every land, every burner at once',
      'flame cannons firing in rolling waves; fire-spinner poi rings; fire spinners',
      "climb the flying-saucer base's scaffolding: orbiting saucer rings and saucer lifts",
      'fortress of neon traps: when the sign counts down, hide behind cover; laser gates; mid-boss the Glitter Queen',
      'final castle: THE MAN (atop his saucer, then giant: neon flashes you must hide from, fire from his face, firework arms)'] },
  49: { set: 'world', label: 'S', name: 'Sunrise Set', theme: 'sunrise', secret: true, pool: ['raver', 'pony', 'witch', 'influencer'],
    plan: ['ow', 'sky', 'auto', 'sky', 'castle'],
    kinds: ['level', 'level', 'level', 'level', 'castle'],
    names: ['First Light', 'Golden Hour Glide', 'Last Art Car Home', 'Dancing on Air', 'The Last Song'],
    spec: ['hard: the party is ending, platforms crumble as dancers leave; the sky brightens as you go',
      'hard: ride warm thermals up and glide across long gaps on the tailwind',
      'hard auto-scroll: chase the last art car home across its falling cargo',
      'hard: every platform holds you only on the beat',
      'the hardest boss, Bouncer Brutus; a fake panel above the exit hides the super-secret exit to World 22'] },
  50: { set: 'world', label: '22', name: 'World 22', theme: 'pages', secret: true, pool: ['glyph', 'inkblot', 'witch'],
    plan: ['ow', 'sky', 'under', 'castle'],
    kinds: ['level', 'level', 'level', 'castle'],
    names: ['Page One', 'Between the Lines', 'The Margins', 'Twenty-Two'],
    spec: ['a world made of paper: pages turn in and out, words hang in the air as ledges, letters walk',
      'ride lines of text that slide like a typewriter carriage',
      'ink-dark margins: pools of ink, ink blots, darkness',
      'the Archivist boss'] }
});

const CLASSIC_WORLDS = []; // Brady-O Classic was retired
const WORLD3_REGIONS = [41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

/* ---------- overworld graph ---------- */
// Every level is a node; the map lays them out by land. kind: normal (clear the level) or secret (find its secret exit).
const WORLD_NODES = [];
for (const L of WORLD_LANDS) {
  const W = WORLDS[L.id];
  W.names.forEach((nm, k) => WORLD_NODES.push({ id: L.id + '-' + (k + 1), land: L.id, type: W.kinds[k], name: nm, label: L.name + ' · ' + nm, boss: W.kinds[k] === 'castle' }));
}
const WORLD_PATHS = [];
{
  const P = (from, to, kind) => WORLD_PATHS.push({ from, to, kind: kind || 'normal' });
  // main route through each land (switch camps are side branches)
  const main = { 41: [1, 2, 3, 4, 5, 6], 42: [1, 2, 3, 4, 5, 6], 43: [1, 2, 3, 4, 5, 6], 44: [1, 2, 3, 4, 5, 6], 45: [1, 2, 3, 4, 5, 6],
    46: [1, 2, 3, 4, 5, 6], 47: [1, 2, 3, 4, 5, 6], 48: [1, 2, 3, 4, 5], 49: [1, 2, 3, 4, 5], 50: [1, 2, 3, 4] };
  for (const w in main) { const s = main[w]; for (let k = 0; k < s.length - 1; k++) P(w + '-' + s[k], w + '-' + s[k + 1]); }
  // each land's castle opens the next land
  P('41-6', '42-1'); P('42-6', '43-1'); P('43-6', '44-1'); P('44-6', '45-1'); P('45-6', '46-1'); P('46-6', '47-1'); P('47-6', '48-1');
  // gift camps behind secret exits
  P('41-3', '41-7', 'secret'); P('43-3', '43-7', 'secret'); P('45-3', '45-7', 'secret'); P('46-3', '46-7', 'secret');
  // Sunrise Set: a hidden land with two ways in
  P('44-3', '49-1', 'secret'); P('47-4', '49-1', 'secret');
  // World 22: the super-secret exit at the end of Sunrise Set
  P('49-5', '50-1', 'secret');
}
// levels whose secret exit the generator must build
const WORLD3_SECRETS = {};
for (const p of WORLD_PATHS) if (p.kind === 'secret') WORLD3_SECRETS[p.from] = true;

// Provisional positions so the current map keeps working until the new overworld lands.
// (clock 2..10 around the city arc, r = distance from the Man)
const BRC_NODES = WORLD_NODES.map((n, k) => {
  const li = n.land - 41, idx = +n.id.split('-')[1];
  return Object.assign({}, n, { clock: 2.4 + (li * 0.83) % 7.2 + idx * 0.09, r: 140 + ((idx * 53 + li * 37) % 300), w: n.land });
});
const BRC_PATHS = WORLD_PATHS;

/* Progress helpers for Super Brady-O World (used by the map and by level completion) */
const WorldGame = {
  start: '41-1',
  isUnlocked(id) { return id === this.start || !!Save.data.unlocked[id]; },
  isDone(id) { return !!Save.data.done[id]; },
  secretFound(id) { return !!Save.data.secretExits[id]; },
  goldCount(id) { const g = Save.data.gold[id]; return g ? g.filter(Boolean).length : 0; },
  node(id) { return WORLD_NODES.find(n => n.id === id); },
  land(id) { return WORLD_LANDS.find(L => L.id === +String(id).split('-')[0]); },
  name(id) { const [w, i] = id.split('-').map(Number); return WORLDS[w] ? WORLDS[w].names[i - 1] : id; },
  pathOpen(p) {
    const ok = p.kind === 'secret' ? !!Save.data.secretExits[p.from] : !!Save.data.done[p.from];
    return ok && (!p.needs || p.needs.every(n => Save.data.done[n]));
  },
  // called when a level is finished; returns the ids newly unlocked
  complete(id, secret) {
    const opened = [];
    for (const p of WORLD_PATHS) {
      if (!this.pathOpen(p)) continue;
      if (!Save.data.unlocked[p.to]) { Save.data.unlocked[p.to] = true; opened.push(p.to); }
    }
    return opened;
  },
  play(id) {
    const [w, i] = id.split('-').map(Number);
    if (!Save.data.world3) Save.data.world3 = {};
    Save.data.world3.node = id; Save.save();
    Game.setScene(new Play(getLevel(w, i), { set: 'world' }));
  }
};
