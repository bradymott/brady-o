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
// plan: generator archetype in use now; kinds: overworld node type; spec: the level's signature idea
Object.assign(WORLDS, {
  41: { set: 'world', label: '1', name: 'Gate Road', theme: 'gate', pool: ['glump', 'rollo', 'hopper'],
    plan: ['ow', 'auto', 'ow', 'under', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'haunt', 'level', 'castle', 'gift'],
    names: ['Mile 1: The Line', 'RV Rooftop Convoy', 'Dust-Out Detour', 'The Stowaway RV', 'Six Days on the Road', 'Greeter Station', 'Kandi Camp'],
    spec: ['first steps among idling RVs; six-day drivers shuffle', 'auto-scroll across the roofs of a crawling RV convoy',
      'dust gusts and whiteouts; secret exit to Kandi Camp', 'haunted puzzle house: a giant RV maze of doors hiding stowaways',
      'exhausted drivers, honking horns, stressed camp leads who yell', 'castle: the Head Greeter boss (hugs, bell shockwaves, dust angels)',
      'gift camp: earn kandi bracelets (start every level with one extra hit)'] },
  42: { set: 'world', label: '2', name: 'Center Camp', theme: 'camps', pool: ['glump', 'rollo', 'hopper', 'flapper'],
    plan: ['ow', 'sky', 'under', 'tower', 'ow', 'castle'],
    kinds: ['level', 'level', 'level', 'fort', 'level', 'castle'],
    names: ['Coffee Line Crawl', 'Big Top Trapeze', 'Slam Poetry Pit', 'Chai Tower', 'Acro Yoga Heights', "Barista Bot's Espresso Works"],
    spec: ['the coffee line as a platforming obstacle course', 'swing on trapezes and bounce on the big-top canvas',
      'underground open-mic: poets fire verse projectiles', 'fortress climb up a teetering chai-stand tower',
      'acro-yoga human platforms that lift and tilt', 'castle: the Barista Bot boss'] },
  43: { set: 'world', label: '3', name: 'The Esplanade', theme: 'esplanade', pool: ['glump', 'boomer', 'flapper', 'hopper'],
    plan: ['ow', 'ow', 'under', 'auto', 'under', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'haunt', 'castle', 'gift'],
    names: ['Bass Drop Boulevard', 'Laser Grid Rave', 'Inside the Subwoofer', 'Disco Bus Ride', 'Strobe House', "DJ Wub-Lord's Stage", 'Lamplighter Camp'],
    spec: ['platforms pulse to the beat; bass shockwaves', 'laser grids switch on and off with the music',
      'inside a giant speaker cabinet; secret exit to Lamplighter Camp', 'auto-scroll on top of a party bus through the crowd',
      'haunted strobe-lit house: things only move in the dark', 'castle: DJ Wub-Lord boss', 'gift camp: earn a lantern that lights dark and dusty levels'] },
  44: { set: 'world', label: '4', name: 'Theme Camp Row', theme: 'camps', pool: ['rollo', 'spiker', 'wisp', 'boomer'],
    plan: ['ow', 'ow', 'under', 'ow', 'sky', 'castle'],
    kinds: ['level', 'level', 'haunt', 'level', 'level', 'castle'],
    names: ['Pancake Camp Breakfast', 'Witchy Woods', 'The Lost & Found', 'Crusty Corner', 'Bubble Camp Heights', "Grand Witch Moonbeam's Coven"],
    spec: ['griddle platforms and flipping pancakes', 'pagan witches on brooms and crystal hazards',
      'haunted lost-and-found maze of doors and fake walls; secret exit to Sunrise Set', 'crusty old burners slow you with "it was better in 98" rants',
      'float on giant soap bubbles between camp towers', 'castle: Grand Witch Moonbeam boss'] },
  45: { set: 'world', label: '5', name: 'Hot Springs', theme: 'springs', pool: ['glump', 'rollo', 'hopper'],
    plan: ['ow', 'water', 'ow', 'under', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'level', 'castle', 'gift'],
    names: ['Road Trip Detour', 'Hot Pool Plunge', 'Geyser Field', 'Steam Caverns', 'Mud Slide Canyon', "Geyser Guardian's Grotto", 'Bike Repair Camp'],
    spec: ['desert detour with tumbleweeds and a broken-down van', 'swim the hot pools; currents and bubbles',
      'geysers launch you on a timer; secret exit to Bike Repair Camp', 'steam vents in the dark; ride the updrafts',
      'slippery mud slopes and rolling boulders', 'castle: the Geyser Guardian boss', 'gift camp: a tuned-up ride (Brady runs faster)'] },
  46: { set: 'world', label: '6', name: 'Deep Playa', theme: 'deepplaya', pool: ['spiker', 'flapper', 'wisp', 'hopper'],
    plan: ['ow', 'sky', 'ow', 'auto', 'ow', 'castle', 'ow'],
    kinds: ['level', 'level', 'level', 'level', 'level', 'castle', 'gift'],
    names: ['Sculpture Garden', 'LED Jellyfish Drift', 'Influencer Alley', 'Art Car Caravan', 'Whiteout', "Dust Devil Diablo's Vortex", 'Hydration Station'],
    spec: ['climb giant art sculptures at night', 'drift between floating LED jellyfish',
      'influencers flash cameras, sparkle ponies steal power-ups; secret exit to Hydration Station',
      'auto-scroll hopping between moving art cars', 'total dust storm: see only by glow sticks',
      'castle: Dust Devil Diablo boss', 'gift camp: one more drop of max hydration (health)'] },
  47: { set: 'world', label: '7', name: 'Hell Station', theme: 'highway', pool: ['spiker', 'rollo', 'boomer', 'glump'],
    plan: ['ow', 'ow', 'tower', 'auto', 'under', 'castle'],
    kinds: ['level', 'level', 'fort', 'level', 'level', 'castle'],
    names: ['Fuel Line', 'Forklift Frenzy', 'Rebar Yard', 'Tech Bro Bypass', 'Trash Fence Tunnel', "Foreman Rusty's Depot"],
    spec: ['fuel tanks, leaking barrels and DPW crews', 'conveyors, forklift lifts and crane hooks',
      'fortress of scaffolding and rebar spikes', 'auto-scroll chased by tech bros on electric unicycles; secret exit to Sunrise Set',
      'wind tunnels along the trash fence', 'castle: DPW Foreman Rusty boss'] },
  48: { set: 'world', label: '8', name: 'The Man Base', theme: 'burn', pool: ['glump', 'rollo', 'spiker', 'flapper', 'wisp', 'boomer'],
    plan: ['ow', 'ow', 'tower', 'under', 'castle'],
    kinds: ['level', 'level', 'level', 'fort', 'castle'],
    names: ['The Long Walk', 'Fire Conclave', 'Saucer Scaffold', 'Neon Gauntlet', "The Man's Pavilion"],
    spec: ['the walk out to the Man, every hazard so far mixed together', 'fire spinners and flame cannons',
      "climb the flying-saucer base's scaffolding", 'fortress of neon traps and flashing lights',
      'final castle: THE MAN boss (atop his saucer, then grows giant: neon flashes, face fire, firework arms)'] },
  49: { set: 'world', label: 'S', name: 'Sunrise Set', theme: 'sunrise', secret: true, pool: ['glump', 'flapper', 'hopper', 'boomer'],
    plan: ['ow', 'sky', 'auto', 'ow', 'castle'],
    kinds: ['level', 'level', 'level', 'level', 'castle'],
    names: ['First Light', 'Golden Hour Glide', 'Last Art Car Home', 'Dancing on Air', 'The Last Song'],
    spec: ['hard: dawn platforming', 'hard: long glides between clouds', 'hard: auto-scroll on the last art car of the night',
      'hard: every jump on the beat', 'the hardest boss; a hidden super-secret exit opens World 22'] },
  50: { set: 'world', label: '22', name: 'World 22', theme: 'w22', secret: true, pool: ['wisp', 'flapper', 'spiker'],
    plan: ['ow', 'sky', 'under', 'castle'],
    kinds: ['level', 'level', 'level', 'castle'],
    names: ['Page One', 'Between the Lines', 'The Margins', 'Twenty-Two'],
    spec: ['surreal, glitchy, made of pages', 'floating text platforms', 'ink-dark caverns', 'the Archivist boss'] }
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
