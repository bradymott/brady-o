/* ============================================================
   Level sets beyond the main adventure
   - Brady-O Classic (worlds 31-38): retro 8-bit styled campaign
   - Brady-O World   (regions 41-49): Black Rock City overworld
   ============================================================ */

/* ---------- Brady-O Classic: 8 worlds x 4 levels ---------- */
Object.assign(WORLDS, {
  31: { set: 'classic', name: 'The Driveway', theme: 'suburbs', pool: ['glump', 'glump', 'rollo'], plan: ['ow', 'under', 'ow', 'castle'],
    names: ['Loading the Car', 'Garage Crawl', 'Cul-de-Sac Sprint', "Raccoon's Garage"] },
  32: { set: 'classic', name: 'Reno Run', theme: 'neon', pool: ['glump', 'rollo', 'boomer', 'flapper'], plan: ['ow', 'sky', 'auto', 'castle'],
    names: ['Neon Strip', 'Rooftop Hop', 'Shopping Cart Chase', 'Mega-Mart Showdown'] },
  33: { set: 'classic', name: 'Highway 447', theme: 'desert', pool: ['spiker', 'hopper', 'rollo', 'glump'], plan: ['ow', 'ow', 'under', 'castle'],
    names: ['Mile Marker 0', 'Sagebrush Shuffle', 'Abandoned Mine', 'Tumbleweed Trap'] },
  34: { set: 'classic', name: 'Hot Springs', theme: 'springs', pool: ['glump', 'rollo', 'hopper'], plan: ['ow', 'water', 'water', 'castle'],
    names: ['Steamy Shore', 'Bubble Pool', 'Geyser Grotto', 'Geyser Guardian'] },
  35: { set: 'classic', name: 'Gate Road', theme: 'gate', pool: ['spiker', 'glump', 'rollo', 'hopper'], plan: ['ow', 'auto', 'ow', 'castle'],
    names: ['The Line', 'Dust Crawl', 'Greeter Gauntlet', 'Hard-Hat Hold'] },
  36: { set: 'classic', name: 'The City', theme: 'esplanade', pool: ['glump', 'rollo', 'flapper', 'boomer', 'hopper'], plan: ['ow', 'sky', 'tower', 'castle'],
    names: ['Esplanade Stroll', 'Scaffold Skyline', 'Lighthouse Climb', 'Bass Bunker'] },
  37: { set: 'classic', name: 'Deep Playa', theme: 'deepplaya', pool: ['spiker', 'flapper', 'wisp', 'hopper'], plan: ['ow', 'auto', 'under', 'castle'],
    names: ['Whiteout', 'Art Car Express', 'Inside the Sculpture', 'Dust Devil Den'] },
  38: { set: 'classic', name: 'The Burn', theme: 'burn', pool: ['glump', 'rollo', 'spiker', 'flapper', 'wisp'], plan: ['ow', 'tower', 'sky', 'castle'],
    names: ['Ember Field', 'Climb the Man', 'Firework Skies', 'Lord Buzzkill'] }
});
const CLASSIC_WORLDS = [31, 32, 33, 34, 35, 36, 37, 38];

/* ---------- Brady-O World: Black Rock City regions ---------- */
Object.assign(WORLDS, {
  41: { set: 'world', name: 'Gate Road', theme: 'gate', pool: ['spiker', 'glump', 'hopper', 'rollo'], plan: ['ow', 'auto', 'ow', 'ow', 'castle'],
    names: ['Mile 1: The Line', 'Dust Convoy', 'Ticket Check', 'The Greeters', 'Gatekeeper Gruff'] },
  42: { set: 'world', name: 'Center Camp', theme: 'camps', pool: ['glump', 'rollo', 'hopper', 'flapper'], plan: ['ow', 'sky', 'ow', 'under', 'castle'],
    names: ['K Street Hustle', 'Shade Cloth Skyway', 'Bike Rack Ruckus', 'The Coffee Tent', 'The Barista Bot'] },
  43: { set: 'world', name: 'Sound Camps', theme: 'esplanade', pool: ['glump', 'rollo', 'boomer', 'flapper', 'hopper'], plan: ['ow', 'under', 'sky', 'tower', 'auto', 'castle'],
    names: ['4:30 Bass Drop', 'Inside the Subwoofer', 'Laser Ledges', '3:00 Plaza Tower', 'Disco Bus Ride', 'DJ Wub-Lord'] },
  44: { set: 'world', name: 'Theme Camps', theme: 'camps', pool: ['glump', 'rollo', 'spiker', 'wisp', 'boomer'], plan: ['ow', 'ow', 'under', 'sky', 'ow', 'castle'],
    names: ['7:30 Welcome Mat', 'Pancake Camp', 'The Dome Maze', '9:00 Plaza Flags', 'Witchy Woods', 'Grand Witch Moonbeam'] },
  45: { set: 'world', name: 'Night Art Cars', theme: 'esplanade', pool: ['flapper', 'boomer', 'wisp', 'rollo'], plan: ['auto', 'sky', 'auto', 'ow', 'castle'],
    names: ['Hop the Fish Car', 'Neon Whale Ride', 'Cupcake Convoy', 'Laser Field', 'Mutant Vehicle Monster'] },
  46: { set: 'world', name: 'Deep Playa', theme: 'deepplaya', pool: ['spiker', 'flapper', 'wisp', 'hopper'], plan: ['ow', 'auto', 'tower', 'ow', 'sky', 'castle'],
    names: ['Into the Dust', 'Whiteout Express', 'Sculpture Climb', 'Lost & Found', 'Kite Field', 'Dust Devil Diablo'] },
  47: { set: 'world', name: 'The Man & The Temple', theme: 'burn', pool: ['glump', 'rollo', 'spiker', 'flapper', 'wisp', 'boomer'], plan: ['ow', 'tower', 'auto', 'sky', 'castle'],
    names: ['Base of the Man', 'Climbing the Man', 'Temple Procession', 'Temple Rafters', 'Lord Buzzkill'] },
  48: { set: 'world', name: 'The Trash Fence', theme: 'deepplaya', secret: true, pool: ['spiker', 'hopper', 'wisp'], plan: ['ow', 'sky', 'auto', 'castle'],
    names: ['Edge of the World', 'Fence Walkers', 'Perimeter Patrol', 'The Lost Sparkle Pony'] },
  49: { set: 'world', name: 'Sunrise Set', theme: 'sunrise', secret: true, pool: ['glump', 'flapper', 'hopper', 'boomer'], plan: ['auto', 'sky', 'castle'],
    names: ['Chasing the Sunrise', 'Dancing on Clouds', 'The Last Song'] }
});
const WORLD3_REGIONS = [41, 42, 43, 44, 45, 46, 47, 48, 49];

/*
  Black Rock City map. Positions use the city's own address system:
  clock = clock position (2:00..10:00 is the city arc, 12:00 points past the Man to the Temple)
  r     = distance from the Man. Esplanade ring = 100, lettered streets A..K = 112..232 (12 apart),
          open playa < 100, Gate Road and the perimeter > 240.
*/
const BRC_NODES = [
  { id: '41-1', clock: 6.0, r: 430, label: 'Gate Road · Mile 1' },
  { id: '41-2', clock: 6.0, r: 392, label: 'Gate Road · Mile 2' },
  { id: '41-3', clock: 6.0, r: 352, label: 'Box Office' },
  { id: '41-4', clock: 6.0, r: 312, label: 'Greeters Station', secret: true },
  { id: '41-5', clock: 6.0, r: 272, label: 'The Gate', boss: true },
  { id: '42-1', clock: 6.0, r: 232, label: '6:00 & K' },
  { id: '42-2', clock: 6.0, r: 196, label: '6:00 & H' },
  { id: '42-3', clock: 6.0, r: 160, label: '6:00 & E' },
  { id: '42-4', clock: 6.0, r: 128, label: 'Center Camp Café' },
  { id: '42-5', clock: 6.0, r: 104, label: '6:00 & Esplanade', boss: true },
  { id: '43-1', clock: 4.5, r: 104, label: '4:30 & Esplanade' },
  { id: '43-2', clock: 4.0, r: 124, label: '4:00 & B' },
  { id: '43-3', clock: 3.5, r: 148, label: '3:30 & D', secret: true },
  { id: '43-4', clock: 3.0, r: 184, label: '3:00 Plaza' },
  { id: '43-5', clock: 2.5, r: 148, label: '2:30 & D' },
  { id: '43-6', clock: 2.0, r: 104, label: '2:00 & Esplanade', boss: true },
  { id: '44-1', clock: 7.5, r: 104, label: '7:30 & Esplanade' },
  { id: '44-2', clock: 8.0, r: 124, label: '8:00 & B' },
  { id: '44-3', clock: 8.5, r: 148, label: '8:30 & D', secret: true },
  { id: '44-4', clock: 9.0, r: 184, label: '9:00 Plaza' },
  { id: '44-5', clock: 9.5, r: 148, label: '9:30 & D' },
  { id: '44-6', clock: 10.0, r: 104, label: '10:00 & Esplanade', boss: true },
  { id: '45-1', clock: 3.0, r: 84, label: 'Inner Playa · 3:00' },
  { id: '45-2', clock: 2.5, r: 70, label: 'Art Car Crossing' },
  { id: '45-3', clock: 2.0, r: 58, label: 'Neon Whale Dock' },
  { id: '45-4', clock: 1.5, r: 46, label: 'Laser Field' },
  { id: '45-5', clock: 1.0, r: 36, label: 'Mutant Vehicle Lot', boss: true },
  { id: '46-1', clock: 9.0, r: 84, label: 'Inner Playa · 9:00' },
  { id: '46-2', clock: 9.8, r: 72, label: 'Dust Storm Flats' },
  { id: '46-3', clock: 10.6, r: 62, label: 'The Big Sculpture' },
  { id: '46-4', clock: 11.2, r: 74, label: 'Lost & Found', secret: true },
  { id: '46-5', clock: 11.0, r: 48, label: 'Kite Field' },
  { id: '46-6', clock: 11.0, r: 34, label: 'Dust Devil Den', boss: true },
  { id: '47-1', clock: 6.0, r: 14, label: 'Base of the Man' },
  { id: '47-2', clock: 12.0, r: 0, label: 'The Man' },
  { id: '47-3', clock: 12.0, r: 24, label: 'Temple Procession' },
  { id: '47-4', clock: 12.0, r: 44, label: 'Temple Steps' },
  { id: '47-5', clock: 12.0, r: 58, label: 'The Temple', boss: true },
  { id: '48-1', clock: 4.0, r: 300, label: 'Trash Fence · 4:00' },
  { id: '48-2', clock: 2.8, r: 300, label: 'Trash Fence · 2:45' },
  { id: '48-3', clock: 1.6, r: 300, label: 'Trash Fence · 1:30' },
  { id: '48-4', clock: 0.6, r: 300, label: 'The Far Corner', boss: true },
  { id: '49-1', clock: 12.6, r: 96, label: 'Deep Deep Playa' },
  { id: '49-2', clock: 12.2, r: 116, label: 'Sunrise Art Car' },
  { id: '49-3', clock: 11.8, r: 136, label: 'The Last Song', boss: true }
];

/*
  Paths between nodes. kind: 'normal' (opened by the regular exit) or 'secret'
  (opened by a level's hidden exit). A node is reachable when any path into it is open.
  'needs' lists extra levels that must also be cleared before the path opens.
*/
const BRC_PATHS = [
  { from: '41-1', to: '41-2', kind: 'normal' }, { from: '41-2', to: '41-3', kind: 'normal' },
  { from: '41-3', to: '41-4', kind: 'normal' }, { from: '41-4', to: '41-5', kind: 'normal' },
  { from: '41-4', to: '42-3', kind: 'secret' },
  { from: '41-5', to: '42-1', kind: 'normal' }, { from: '42-1', to: '42-2', kind: 'normal' },
  { from: '42-2', to: '42-3', kind: 'normal' }, { from: '42-3', to: '42-4', kind: 'normal' },
  { from: '42-4', to: '42-5', kind: 'normal' },
  { from: '42-5', to: '43-1', kind: 'normal' }, { from: '42-5', to: '44-1', kind: 'normal' },
  { from: '43-1', to: '43-2', kind: 'normal' }, { from: '43-2', to: '43-3', kind: 'normal' },
  { from: '43-3', to: '43-4', kind: 'normal' }, { from: '43-3', to: '48-1', kind: 'secret' },
  { from: '43-4', to: '43-5', kind: 'normal' }, { from: '43-5', to: '43-6', kind: 'normal' },
  { from: '44-1', to: '44-2', kind: 'normal' }, { from: '44-2', to: '44-3', kind: 'normal' },
  { from: '44-3', to: '44-4', kind: 'normal' }, { from: '44-3', to: '45-3', kind: 'secret' },
  { from: '44-4', to: '44-5', kind: 'normal' }, { from: '44-5', to: '44-6', kind: 'normal' },
  { from: '43-6', to: '45-1', kind: 'normal' }, { from: '45-1', to: '45-2', kind: 'normal' },
  { from: '45-2', to: '45-3', kind: 'normal' }, { from: '45-3', to: '45-4', kind: 'normal' },
  { from: '45-4', to: '45-5', kind: 'normal' },
  { from: '44-6', to: '46-1', kind: 'normal' }, { from: '46-1', to: '46-2', kind: 'normal' },
  { from: '46-2', to: '46-3', kind: 'normal' }, { from: '46-3', to: '46-4', kind: 'normal' },
  { from: '46-4', to: '46-5', kind: 'normal' }, { from: '46-4', to: '49-1', kind: 'secret' },
  { from: '46-5', to: '46-6', kind: 'normal' },
  { from: '45-5', to: '47-1', kind: 'normal', needs: ['46-6'] }, { from: '46-6', to: '47-1', kind: 'normal', needs: ['45-5'] },
  { from: '47-1', to: '47-2', kind: 'normal' }, { from: '47-2', to: '47-3', kind: 'normal' },
  { from: '47-3', to: '47-4', kind: 'normal' }, { from: '47-4', to: '47-5', kind: 'normal' },
  { from: '48-1', to: '48-2', kind: 'normal' }, { from: '48-2', to: '48-3', kind: 'normal' },
  { from: '48-3', to: '48-4', kind: 'normal' }, { from: '48-4', to: '46-1', kind: 'normal' },
  { from: '49-1', to: '49-2', kind: 'normal' }, { from: '49-2', to: '49-3', kind: 'normal' },
  { from: '49-3', to: '47-1', kind: 'normal' }
];
// levels in Brady-O World that hide a secret exit
const WORLD3_SECRETS = { '41-4': true, '43-3': true, '44-3': true, '46-4': true };

/* Progress helpers for Brady-O World (used by the map and by level completion) */
const WorldGame = {
  start: '41-1',
  isUnlocked(id) { return id === this.start || !!Save.data.unlocked[id]; },
  isDone(id) { return !!Save.data.done[id]; },
  secretFound(id) { return !!Save.data.secretExits[id]; },
  goldCount(id) { const g = Save.data.gold[id]; return g ? g.filter(Boolean).length : 0; },
  node(id) { return BRC_NODES.find(n => n.id === id); },
  name(id) { const [w, i] = id.split('-').map(Number); return WORLDS[w] ? WORLDS[w].names[i - 1] : id; },
  pathOpen(p) {
    const ok = p.kind === 'secret' ? !!Save.data.secretExits[p.from] : !!Save.data.done[p.from];
    return ok && (!p.needs || p.needs.every(n => Save.data.done[n]));
  },
  // called when a level is finished; returns the ids newly unlocked
  complete(id, secret) {
    const opened = [];
    for (const p of BRC_PATHS) {
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
