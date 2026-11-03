/* ============================================================
   ART CART — 3D battle-kart racing on the Brady Goes to Burning Man
   engine (40_burns_*). Wild original art cars, the action-figure cast
   as drivers, a signature weapon on every car, pickups on top, Grand
   Prix cups, time trials and open battle arenas with objectives.

   Files (concatenated alphabetically after the engine):
     43_cart_a_data.js    rosters (cars, drivers, weapons, pickups), cups, tracks, arenas, save
     43_cart_b_models.js  3D art-car models (multi-bone rigs), driver models, crowd, props
     43_cart_c_world.js   track runtime, terrain features, track + arena builders (scenery)
     43_cart_d_sim.js     driving physics, AI, signature weapons, pickups, objectives
     43_cart_e_scene.js   CartRaceScene: load, loop, chase camera, rendering, HUD, touch
     43_cart_f_menu.js    KartMenuScene (the app's home): mode → driver → car → cup/track/arena

   Conventions (the engine's): Y up, metres, yaw 0 faces +Z, forward = (sin yaw, cos yaw),
   right = (-cos yaw, sin yaw); steering right lowers yaw.
   Entry: new KartMenuScene()   ·   Direct start: new CartRaceScene({mode, cup, race, track,
     arena, objective, driver, car, autoGas})
   Save: Save.data.cart = { driver, car, autoGas, trophies:{cupId:1|2|3}, best:{trackId:{lap,total}},
     wins:{arena:objective:n}, gfx }
   All art cars, names, drivers, weapons and tracks are original designs. Real art cars are
   inspiration only; nothing here copies a real car's name, artwork or logo, or any game.
   ============================================================ */

/* ---------------- the art cars ----------------
   stats 1..5: speed, accel, handling, weight. weapon: signature weapon id (CART_WEAPONS).
   look: palette used by the model builder; light: night glow colour. */
const CART_CARS = [
  { id: 'heart', name: 'BASS VALENTINE', tag: 'A rolling sound system with a giant beating heart on top.',
    nod: 'a heart-topped sound car', weapon: 'bassdrop', stats: { speed: 3, accel: 3, handling: 3, weight: 5 },
    col: '#ff2a5a', col2: '#ffb0c8', light: '#ff3a6a' },
  { id: 'fish', name: 'GLITTERFIN', tag: 'A mirror-tiled fish that swims through the dust.',
    nod: 'a mirror-ball fish', weapon: 'dazzle', stats: { speed: 4, accel: 3, handling: 4, weight: 2 },
    col: '#c8d4ec', col2: '#ff6ad8', light: '#9ad8ff' },
  { id: 'octo', name: 'CALAMARI INFERNO', tag: 'Eight copper arms. Every one of them breathes fire.',
    nod: 'a fire-breathing mechanical octopus', weapon: 'torch', stats: { speed: 3, accel: 2, handling: 3, weight: 5 },
    col: '#c8743a', col2: '#ffd06a', light: '#ff8a2a' },
  { id: 'dragon', name: 'SIR SCORCHALOT', tag: 'A scaly gentleman dragon with very bad manners.',
    nod: 'the playa\'s dragon cars', weapon: 'fireball', stats: { speed: 4, accel: 3, handling: 3, weight: 4 },
    col: '#2ab060', col2: '#ffd84a', light: '#7aff5a' },
  { id: 'duck', name: 'QUACKZILLA', tag: 'The bath toy that ate the bathtub.',
    nod: 'a giant rubber duck', weapon: 'bubbles', stats: { speed: 3, accel: 4, handling: 4, weight: 3 },
    col: '#ffd21a', col2: '#ff8a1a', light: '#ffe24a' },
  { id: 'pyramid', name: 'PYRAMID SCHEME', tag: 'Join now! Laser light show included. Returns not guaranteed.',
    nod: 'a temple-pyramid laser sound car', weapon: 'laser', stats: { speed: 4, accel: 2, handling: 3, weight: 4 },
    col: '#2a2236', col2: '#ffc83a', light: '#3aff8a' },
  { id: 'cupcake', name: 'FROSTED FURY', tag: 'Tiny, sweet and absolutely furious.',
    nod: 'the playa\'s cupcake cars', weapon: 'sprinkles', stats: { speed: 3, accel: 5, handling: 5, weight: 1 },
    col: '#ff8ac8', col2: '#fff4f8', light: '#ff9ad8' },
  { id: 'galleon', name: 'DUSTY DOUBLOON', tag: 'A pirate galleon that ran aground on dry land. On purpose.',
    nod: 'a land-sailing galleon', weapon: 'cannon', stats: { speed: 4, accel: 2, handling: 2, weight: 5 },
    col: '#8a5a32', col2: '#ffd06a', light: '#ffb84a' },
  { id: 'snail', name: 'TURBO ESCARGOT', tag: 'The fastest snail alive. Slimy about it.',
    nod: 'a giant snail car', weapon: 'slime', stats: { speed: 5, accel: 3, handling: 2, weight: 3 },
    col: '#9a6bff', col2: '#7aff5a', light: '#b07aff' },
  { id: 'jelly', name: 'JELLY JOLT', tag: 'A floating jellyfish full of static and bad intentions.',
    nod: 'a glowing jellyfish car', weapon: 'zap', stats: { speed: 3, accel: 4, handling: 4, weight: 2 },
    col: '#c86aff', col2: '#5af2ff', light: '#5af2ff' },
  { id: 'shark', name: 'DUNE CHOMPER', tag: 'Swims through sand. Bites through bumpers.',
    nod: 'a cruising land-shark car', weapon: 'chomp', stats: { speed: 4, accel: 4, handling: 3, weight: 3 },
    col: '#6a8ab0', col2: '#f4f4f8', light: '#38c8ff' },
  { id: 'whale', name: 'WHALE OF A TIME', tag: 'A happy blue whale with a very powerful blowhole.',
    nod: 'a giant whale party bus', weapon: 'geyser', stats: { speed: 3, accel: 3, handling: 3, weight: 5 },
    col: '#2a6ad8', col2: '#bfe8ff', light: '#4ab0ff' }
];

/* ---------------- signature weapons (one per car; reload 5–10 s) ----------------
   kind drives the AI: 'ring' (around), 'cone' (ahead), 'shot' (projectiles ahead), 'drop' (behind),
   'side' (broadside), 'dash' (lunge), 'target' (locks on). icon is drawn in 2D by cartIcon(). */
const CART_WEAPONS = {
  bassdrop: { name: 'BASS DROP', desc: 'A sub-bass shockwave rings out and knocks every car nearby into a spin.', reload: 8, kind: 'ring', range: 15, col: '#ff3a6a' },
  dazzle: { name: 'DAZZLE BEAM', desc: 'The mirror ball fires a sparkling beam ahead. Cars caught in it get dazzled and wobble.', reload: 7, kind: 'cone', range: 34, col: '#9ad8ff' },
  torch: { name: 'TENTACLE TORCH', desc: 'All eight arms blast fire at once. Anything close gets toasted and spins out.', reload: 9, kind: 'ring', range: 10, col: '#ff8a2a' },
  fireball: { name: 'FIREBALL VOLLEY', desc: 'Three bouncing fireballs fan out ahead. Each hit spins a car.', reload: 7, kind: 'shot', range: 45, col: '#ff6a1a' },
  bubbles: { name: 'BUBBLE BARRAGE', desc: 'Six giant bath bubbles drift ahead. Get caught and float helplessly.', reload: 6, kind: 'shot', range: 34, col: '#9af0ff' },
  laser: { name: 'LASER SWEEP', desc: 'A green laser fan sweeps across the road ahead. Touch it and you spin.', reload: 9, kind: 'cone', range: 38, col: '#3aff8a' },
  sprinkles: { name: 'SPRINKLE MINES', desc: 'Drops a trail of sprinkle bombs. They pop and flip whoever drives over them.', reload: 6, kind: 'drop', range: 26, col: '#ff8ac8' },
  cannon: { name: 'CANNON BROADSIDE', desc: 'Cannonballs fire out of both sides at once. Pull alongside and BOOM.', reload: 8, kind: 'side', range: 24, col: '#ffb84a' },
  slime: { name: 'SLIME SLICK', desc: 'A turbo burst that leaves a glowing slime trail. Followers slide right off.', reload: 7, kind: 'drop', range: 24, col: '#7aff5a' },
  zap: { name: 'ZAP PULSE', desc: 'Lightning arcs to the two closest cars and stuns them.', reload: 6, kind: 'ring', range: 20, col: '#5af2ff' },
  chomp: { name: 'CHOMP DASH', desc: 'Lunges forward with a huge bite. Rammed cars get flipped.', reload: 7, kind: 'dash', range: 16, col: '#38c8ff' },
  geyser: { name: 'BLOWHOLE GEYSER', desc: 'A water spout erupts under the car ahead and launches it skyward.', reload: 10, kind: 'target', range: 60, col: '#4ab0ff' }
};

/* ---------------- drivers: Brady, Chinka, the Man and the action-figure cast ----------------
   type: an engine character type (40_burns_db_cast.js); 'brady' / 'chinka' / 'man' are special. */
const CART_DRIVERS = [
  { id: 'brady', name: 'BRADY', type: 'brady', line: 'First burn. Fastest burn.', col: '#ff4fd8' },
  { id: 'chinka', name: 'CHINKA', type: 'chinka', line: 'Already lapped you, babe.', col: '#ff8a3a' },
  { id: 'man', name: 'THE MAN', type: 'man', line: 'Burns brightest. Drives worst.', col: '#38f2ff' },
  { id: 'crusty', short: 'CRUSTY', name: 'CRUSTY OLD BURNER', type: 'crusty', line: 'Racing was better on Baker Beach.', col: '#c8925a' },
  { id: 'firespinner', short: 'SPINNER', name: 'FIRE SPINNER', type: 'firespinner', line: 'Every lap is a fire circle.', col: '#ff7a2a' },
  { id: 'gatestaff', short: 'GATE', name: 'GATE STAFF', type: 'gatestaff', line: 'Ticket and ID. Then eat my dust.', col: '#e8e8e8' },
  { id: 'greeter_f', short: 'GREETER', name: 'GREETER (HER)', type: 'greeter_f', line: 'Welcome home! Now get out of my way!', col: '#ff6ab8' },
  { id: 'greeter_m', short: 'GREETER', name: 'GREETER (HIM)', type: 'greeter_m', line: 'Hugs at the finish line!', col: '#ffb84a' },
  { id: 'darkwad', name: 'DARKWAD', type: 'darkwad', line: 'Headlights? Never heard of them.', col: '#6a6a7a' },
  { id: 'badideaguy', short: 'BAD IDEA', name: 'BAD IDEA GUY', type: 'badideaguy', line: 'Hold my water bottle. Watch this.', col: '#ffd84a' },
  { id: 'undercovercop', short: 'COP', name: 'UNDERCOVER COP', type: 'undercovercop', line: 'Just a regular groovy burner. Pull over.', col: '#3a6aff' },
  { id: 'furry', name: 'FURRY', type: 'furry', line: 'It is SO hot in here. Worth it.', col: '#ff6ab0' },
  { id: 'deathguild', short: 'DEATH GUILD', name: 'DEATH GUILD', type: 'deathguild', line: 'Two cars enter. Foam bats only.', col: '#8a8a92' },
  { id: 'ranger', short: 'RANGER', name: 'OVERZEALOUS RANGER', type: 'ranger', line: 'I am going to need you to slow down.', col: '#9ab07a' },
  { id: 'burney', name: 'BURNEY', type: 'burney', line: 'Smile for the photo finish!', col: '#3ab0d8' },
  { id: 'playaartist', short: 'ARTIST', name: 'PLAYA ARTIST', type: 'playaartist', line: 'This lap is a sculpture.', col: '#e88a4a' },
  { id: 'dpw', name: 'DPW PUNK', type: 'dpw', line: 'Built this road. Own this road.', col: '#ff8a1a' },
  { id: 'lamplighter', short: 'LAMPLIGHTER', name: 'LAMP LIGHTER', type: 'lamplighter', line: 'Lighting the way, lap after lap.', col: '#ffe0a0' },
  { id: 'annoyingdj', short: 'DJ', name: 'ANNOYING DJ', type: 'annoyingdj', line: 'MAKE SOME NOOOISE!', col: '#7aff5a' },
  { id: 'sparklepony', short: 'SPARKLE', name: 'SPARKLE PONY', type: 'sparklepony', line: 'Can I borrow your boost? And your water?', col: '#c8a0ff' },
  { id: 'partiedtoohard', short: 'PARTIED', name: 'PARTIED TOO HARD', type: 'partiedtoohard', line: 'What lap is it? What DAY is it?', col: '#b8c8a0' },
  { id: 'burnerkid', short: 'KID', name: 'BURNER KID', type: 'burnerkid', line: 'Mom, please stop waving.', col: '#3ad8c8' },
  { id: 'burnermom', short: 'MOM', name: 'BURNER MOM', type: 'burnermom', line: 'WOOO! This is the best week of my life!', col: '#ff9ac8' },
  { id: 'cultleader', short: 'BUBBLEGUM', name: 'BROTHER BUBBLEGUM', type: 'cultleader', line: 'Join my pit crew. We have snacks.', col: '#ff4fa8' },
  { id: 'fencebot_a', name: 'FENCE BOT A', type: 'fencebot_a', line: 'BEEP. FENCE. BOOP. FAST.', col: '#7aff5a' },
  { id: 'fencebot_b', name: 'FENCE BOT B', type: 'fencebot_b', line: 'COLANDER MODE: ENGAGED.', col: '#5af2ff' }
];

/* ---------------- pickups (gift boxes on the course; our own festival items) ---------------- */
const CART_ITEMS = {
  glow: { name: 'GLOW RUSH', desc: 'A bundle of glow sticks: big speed boost.', col: '#4affd2' },
  water: { name: 'WATER BOTTLE', desc: 'Shake off any effect, get a vibe back and a small boost.', col: '#5ac8ff' },
  tumble: { name: 'TUMBLEWEED', desc: 'Drop it behind you. It rolls with the wind.', col: '#c8995a' },
  devil: { name: 'DUST DEVIL', desc: 'A whirlwind that zigzags up the course spinning cars.', col: '#e8d2a8' },
  potty: { name: 'PORTA-POTTY', desc: 'Parachutes a porta-potty onto the course ahead.', col: '#5a9aff' },
  foam: { name: 'FOAM PARTY', desc: 'Foams everyone close by. Slippery and slow.', col: '#f4f8ff' },
  shield: { name: 'DISCO SHIELD', desc: 'A mirror-ball bubble that blocks the next hit.', col: '#ff9af0' },
  whistle: { name: 'RANGER WHISTLE', desc: '"SLOW DOWN!" Every car ahead of you brakes.', col: '#ffd84a' }
};
const CART_ITEM_IDS = Object.keys(CART_ITEMS);
// odds by race position bucket: 1st, 2nd–3rd, 4th–5th, 6th–8th (battle uses the middle row)
const CART_ITEM_ODDS = [
  { tumble: 4, devil: 1, potty: 1, foam: 2, shield: 3, water: 1, glow: 1, whistle: 0 },
  { tumble: 3, devil: 3, potty: 2, foam: 2, shield: 2, water: 1, glow: 2, whistle: 1 },
  { tumble: 1, devil: 3, potty: 3, foam: 2, shield: 1, water: 2, glow: 3, whistle: 2 },
  { tumble: 0, devil: 2, potty: 2, foam: 1, shield: 1, water: 2, glow: 5, whistle: 4 }
];

/* ---------------- Grand Prix ---------------- */
const CART_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
const CART_LAPS = 3;
const CART_CUPS = [
  { id: 'dust', name: 'DUST CUP', tracks: ['esplanade', 'gateroad', 'deepplaya', 'dawn'], col: '#f0c88a', col2: '#b07a3a' },
  { id: 'fire', name: 'FIRE CUP', tracks: ['centercamp', 'storm', 'neon', 'burn'], col: '#ff7a3a', col2: '#c02a4a' }
];
// time-of-day palettes: names of BURNS_PALETTES (engine) plus our own tweaks (see CART_SKIES in the world file)
const CART_TOD = { day: 'DAY', sunset: 'SUNSET', night: 'NIGHT', dawn: 'DAWN', dust: 'DUST STORM' };

/* ---------------- battle arenas + objectives ---------------- */
const CART_OBJECTIVES = {
  vibe: { name: 'VIBE CHECK', short: 'Last car standing', desc: 'Every car has 4 vibes. Each hit costs one. Lose them all and your lights go out. Last car glowing wins.', time: 180 },
  glow: { name: 'GLOW GRAB', short: 'Collect the glow orbs', desc: 'Grab glowing orbs. Get hit and you drop some. First to 15 wins.', goal: 15, time: 150 },
  hill: { name: 'KING OF THE HILL', short: 'Hold the zone', desc: 'Park inside the glowing zone to score. The zone moves. First to 30 seconds wins.', goal: 30, time: 150 },
  flag: { name: 'CAPTURE THE FLAG', short: 'Bring the flag home', desc: 'Grab the camp flag and drive it into the capture ring. Getting hit drops it. First to 3 captures.', goal: 3, time: 180 },
  race: { name: 'SCRAMBLE RACE', short: '3 laps over the jumps', desc: 'A three-lap race around the course: jumps, whoops and berms.', time: 0 }
};
const CART_ARENAS = [
  { id: 'skate', name: 'BOWL-O-RAMA', sub: 'Skate park: bowls, half-pipes, rails and ramps', objectives: ['glow', 'hill', 'vibe', 'flag'], col: '#5ac8ff', tod: 'sunset' },
  { id: 'mx', name: 'WHOOP-DE-DOO MX', sub: 'Dirt-bike course: jumps, whoops and berms', objectives: ['race', 'flag', 'glow', 'vibe'], col: '#ff9a3a', tod: 'day' },
  { id: 'playa', name: 'DEEP PLAYA ART PARK', sub: 'Open playa battle zone around giant art', objectives: ['vibe', 'hill', 'glow', 'flag'], col: '#ff4fd8', tod: 'night' }
];

/* ---------------- lookups + save ---------------- */
function cartCar(id) { return CART_CARS.find(c => c.id === id) || CART_CARS[0]; }
function cartDriver(id) { return CART_DRIVERS.find(d => d.id === id) || CART_DRIVERS[0]; }
function cartArena(id) { return CART_ARENAS.find(a => a.id === id) || CART_ARENAS[0]; }
function cartCup(id) { return CART_CUPS.find(c => c.id === id) || CART_CUPS[0]; }
function cartSave() {
  const d = Save.data;
  if (!d.cart || typeof d.cart !== 'object') d.cart = {};
  const k = d.cart;
  if (!k.trophies) k.trophies = {};
  if (!k.best) k.best = {};
  if (!k.wins) k.wins = {};
  if (k.autoGas === undefined) k.autoGas = true;
  if (!k.driver || !CART_DRIVERS.some(x => x.id === k.driver)) k.driver = 'brady';
  if (!k.car || !CART_CARS.some(x => x.id === k.car)) k.car = 'heart';
  if (!k.gfx) k.gfx = 'auto';
  return k;
}
function cartFmtTime(t) {
  if (!isFinite(t) || t <= 0) return '--:--.--';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}
function cartFmtClock(t) { t = Math.max(0, Math.ceil(t)); const m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
function cartOrdinal(n) { return n + (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'); }
const cartWrap = a => a - TAU * Math.floor((a + Math.PI) / TAU);
// a small seeded shuffle
function cartShuffle(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
function cartRollItem(rank, n, rng) {
  const b = n <= 1 ? 1 : rank <= 1 ? 0 : rank <= 3 ? 1 : rank <= 5 ? 2 : 3, O = CART_ITEM_ODDS[b];
  let tot = 0; for (const k in O) tot += O[k];
  let r = rng() * tot; for (const k in O) { r -= O[k]; if (r <= 0) return k; }
  return 'glow';
}
