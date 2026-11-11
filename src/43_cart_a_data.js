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
     wins:{arena:objective:n}, gfx,
     prog:{carId:{career, royale (runs), careerWon, royaleWon, points, alloc:{stat:n}, secret:{game:n}, celebrated}} }   (43_cart_h_career.js)
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
    col: '#4a82b8', col2: '#f4f4f8', light: '#38c8ff' },
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

/* ---------------- drivers: Brady, Chinka and ten burner cliches (C3, Nov 11) ----------------
   type: an engine character type (40_burns_db_cast.js); 'brady' / 'chinka' are special.
   stat: the one stat pip the driver adds to any car they drive; special: the driver's own gift-box special (its
   effect, icon and HUD live in 43_cart_j_drivers.js; the two new characters' types 'messiah' and 'partyboy' are
   defined there too). The rest of the old cast (and the Man, now the boss) are no
   longer drivers: they stay in the world as crowd and roadside heroes (by engine type), and a saved driver that is no
   longer here falls back to Brady (cartSave). */
const CART_DRIVERS = [
  { id: 'brady', name: 'BRADY', type: 'brady', line: 'First burn. Fastest burn.', col: '#ff4fd8', stat: 'speed', special: 'firstburn' },
  { id: 'chinka', name: 'CHINKA', type: 'chinka', line: 'Already lapped you, babe.', col: '#ffd27a', stat: 'handling', special: 'lapped' },
  { id: 'sparklepony', short: 'SPARKLE', name: 'SPARKLE PONY', type: 'sparklepony', line: 'Can I borrow your boost? And your water?', col: '#c8a0ff', stat: 'accel', special: 'borrow' },
  { id: 'dpw', name: 'DPW PUNK', type: 'dpw', line: 'Built this road. Own this road.', col: '#ff8a1a', stat: 'weight', special: 'roadwork' },
  { id: 'deathguild', short: 'DEATH GUILD', name: 'DEATH GUILD', type: 'deathguild', line: 'Two cars enter. Foam bats only.', col: '#8a8a92', stat: 'weight', special: 'bungee' },
  { id: 'crusty', short: 'CRUSTY', name: 'CRUSTY OLD BURNER', type: 'crusty', line: 'Racing was better on Baker Beach.', col: '#c8925a', stat: 'handling', special: 'lecture' },
  { id: 'ranger', short: 'RANGER', name: 'OVERZEALOUS RANGER', type: 'ranger', line: 'I am going to need you to slow down.', col: '#9ab07a', stat: 'handling', special: 'fivemph' },
  { id: 'annoyingdj', short: 'DJ', name: 'ANNOYING DJ', type: 'annoyingdj', line: 'MAKE SOME NOOOISE!', col: '#7aff5a', stat: 'accel', special: 'airhorn' },
  { id: 'darkwad', name: 'DARKWAD', type: 'darkwad', line: 'Headlights? Never heard of them.', col: '#8a7aa8', stat: 'speed', special: 'lightsout' },
  { id: 'badideaguy', short: 'BAD IDEA', name: 'BAD IDEA GUY', type: 'badideaguy', line: 'Hold my water bottle. Watch this.', col: '#ffd84a', stat: 'speed', special: 'holdwater' },
  { id: 'messiah', short: 'MESSIAH', name: 'MESSIAH COMPLEX', type: 'messiah', line: 'Make way. I am kind of a big deal.', col: '#fff0c8', stat: 'accel', special: 'parting' },
  { id: 'partyboy', short: 'PARTY BOY', name: 'PARTY BOY', type: 'partyboy', line: 'Where\'s the afterparty? Is THIS the afterparty?', col: '#38f2ff', stat: 'weight', special: 'afterparty' }
];

/* ---------------- pickups (gift boxes on the course; our own festival items) ---------------- */
const CART_ITEMS = {
  glow: { name: 'GLOW RUSH', desc: 'A bundle of glow sticks: big speed boost.', col: '#4affd2' },
  water: { name: 'WATER BOTTLE', desc: 'Shake off any effect, get a vibe back and a small boost.', col: '#5ac8ff' },
  tumble: { name: 'TUMBLEWEED', desc: 'Drop it behind you. It rolls with the wind.', col: '#c8995a' },
  devil: { name: 'DUST DEVIL', desc: 'A whirlwind that races up the course, hunts the cars ahead and whirls them into the air.', col: '#e8c890' },
  potty: { name: 'PORTA-POTTY', desc: 'Parachutes a porta-potty onto the course ahead.', col: '#5a9aff' },
  foam: { name: 'FOAM PARTY', desc: 'A foam cannon erupts around you: every car close by gets buried in foam, slow and slippery, and a foam pool is left behind.', col: '#f4f8ff' },
  shield: { name: 'DISCO SHIELD', desc: 'A mirror-ball bubble that blocks the next hit.', col: '#ff9af0' },
  whistle: { name: 'RANGER WHISTLE', desc: '"SLOW DOWN!" Every car ahead of you brakes.', col: '#ffd84a' },
  // sky drops (effects in 43_cart_da_items.js)
  skymail: { name: 'SKY MAIL', desc: 'Three missiles drop out of the sky onto the cars ahead. Swerve when the red target locks!', col: '#ff5a3a' },
  bombs: { name: 'BOMBS AWAY', desc: 'A line of bombs rains down on the road ahead. Watch the shadows grow; the craters burn for a while.', col: '#ffb02a' },
  ducks: { name: 'DUCK DOWNPOUR', desc: 'It rains rubber ducks! Dozens litter the track ahead: bump one and it squeaks, scatters and slows you down.', col: '#ffe24a' }
};
// the gift-box pool shown spinning in the roulette (car signatures and arena powers join it at roll time)
const CART_ITEM_IDS = Object.keys(CART_ITEMS);
// odds by race position bucket: 1st, 2nd–3rd, 4th–5th, 6th–8th (battle uses the middle row). The sky drops are
// the big attacks: almost never for the leader, common at the back.
const CART_ITEM_ODDS = [
  { tumble: 4, devil: 1, potty: 1, foam: 2, shield: 3, water: 1, glow: 1, whistle: 0, skymail: 0, bombs: 0, ducks: 1 },
  { tumble: 3, devil: 2, potty: 2, foam: 2, shield: 2, water: 1, glow: 2, whistle: 1, skymail: 1, bombs: 1, ducks: 2 },
  { tumble: 1, devil: 2, potty: 2, foam: 2, shield: 1, water: 2, glow: 3, whistle: 1, skymail: 2, bombs: 2, ducks: 2 },
  { tumble: 0, devil: 2, potty: 1, foam: 1, shield: 1, water: 2, glow: 4, whistle: 2, skymail: 3, bombs: 2, ducks: 2 }
];
/* ---------------- signature specials: one per car, rolled only by that car (effects in 43_cart_da_items.js) ----------------
   Not only attacks and boosts: three of them fly (dragon, whale, jelly), the snail bounces, the shark swims under the
   sand, the pyramid teleports, the fish is a shield, the octopus throws. Odds by the same buckets as CART_ITEM_ODDS. */
const CART_SPECIALS = {
  heart: { id: 'throb', name: 'HEART THROB', desc: 'Three giant heartbeats. Every rival in range is lovestruck: slow, dreamy and drifting toward you.', col: '#ff4f8a' },
  fish: { id: 'decoys', name: 'MIRROR SCHOOL', desc: 'Three mirror-ball decoy fish circle your car. They dazzle anyone who touches them and swallow incoming shots.', col: '#bfe0ff' },
  octo: { id: 'toss', name: 'TENTACLE TOSS', desc: 'Two copper arms grab the closest rivals ahead and fling them over your car to land behind you.', col: '#ff9a4a' },
  dragon: { id: 'glide', name: 'DRAGON FLIGHT', desc: 'Wings out! Fly over the pack for five seconds and scorch anyone below.', col: '#7aff5a' },
  duck: { id: 'surf', name: 'BUBBLE BATH SURF', desc: 'Surf a wave of bath foam: a speed surge that bowls rivals aside and leaves a foamy trail.', col: '#9af0ff' },
  pyramid: { id: 'warp', name: 'PRISM WARP', desc: 'Lift into a beam of light and reappear 45 m up the road. A laser trap stays where you left.', col: '#3aff8a' },
  cupcake: { id: 'frosting', name: 'FROSTING FLOOD', desc: 'Pipes a river of sticky frosting across the road ahead. Drive in and you are stuck. Hop it!', col: '#ff8ac8' },
  galleon: { id: 'wave', name: 'ROGUE WAVE', desc: 'A huge wave rolls up the course ahead and wipes out every car it catches. Surf behind it.', col: '#4ab0ff' },
  snail: { id: 'shell', name: 'SHELL BOUNCE', desc: 'Into the shell! Bounce up the road in giant hops, untouchable, splashing slime on every landing.', col: '#b07aff' },
  jelly: { id: 'hover', name: 'STORM HOVER', desc: 'Float above the road for five seconds and rain lightning on every car that passes below.', col: '#5af2ff' },
  shark: { id: 'dive', name: 'SAND DIVE', desc: 'Dive under the playa: only the fin shows and nothing can touch you. Burst out and launch anyone nearby.', col: '#38c8ff' },
  whale: { id: 'breach', name: 'SKY BREACH', desc: 'The blowhole fires the whole bus into the sky. Swim over the pack, then belly-flop with a tidal splash.', col: '#4ab0ff' }
};
for (const car in CART_SPECIALS) { const P = CART_SPECIALS[car]; CART_ITEMS[P.id] = { name: P.name, desc: P.desc, col: P.col, car }; }
const CART_SPECIAL_ODDS = [0.05, 0.11, 0.15, 0.19];   // chance a gift box holds the car's own special, by bucket

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
  vibe: { name: 'VIBE CHECK', short: 'Last car standing', desc: 'Every car has 4 vibes. Each hit costs one. Lose them all and your lights go out. Last car glowing wins.', time: 180, unit: '♥' },
  glow: { name: 'GLOW GRAB', short: 'Collect the glow orbs', desc: 'Grab glowing orbs. Get hit and you drop some. First to 15 wins.', goal: 15, time: 150, unit: '●' },
  hill: { name: 'KING OF THE HILL', short: 'Hold the zone', desc: 'Park inside the glowing zone to score. The zone moves. First to 30 seconds wins.', goal: 30, time: 150, unit: 's' },
  flag: { name: 'CAPTURE THE FLAG', short: 'Bring the flag home', desc: 'Grab the camp flag and drive it into the capture ring. Getting hit drops it. First to 3 captures.', goal: 3, time: 180, unit: '⚑' },
  race: { name: 'SCRAMBLE RACE', short: '3 laps over the jumps', desc: 'A three-lap race around the course: jumps, whoops and berms.', time: 0 }
};
/* Arena files (43_cart_g_*.js) register themselves here:
   CART_ARENAS.push({ id, name, sub, objectives, col, tod, powers: [itemIds], blurb })
   CART_ARENA_RULES[id] = { gravity, music, onLoad(s), onUpdate(s, dt, racing), onStep(s, k, dt, racing),
     vertical(s, k, dt, racing) -> true when it handled the car's vertical motion, onHit(s, k, kind, src, o),
     aiGoal(s, k, nearestRival) -> { goal: [x, z], prey } | null, hud(s, ctx, W, H, top, left), draw(s, R, S, t), lights(s, add) }
   CART_ITEMS[id] = { name, desc, col, arena: id }  +  CART_ITEM_FX[id] = { use(s, k), update(s, dt, racing), shot(s, shot, dt), draw(s, R, shot, S, t) }
   CART_OBJECTIVES[id] = { name, short, desc, time, goal, unit, fx: { init(s), update(s, dt) -> true to end, rank(s) -> karts sorted, score(k) } }
   CART_ARENA_ICONS[id] = (ctx, s, t, col) => {}   (the menu card icon, drawn centred at the origin)
   An arena's powers drop only there until the player has won every one of its objectives ("mastered"); then they
   join the gift-box pool in every race. */
const CART_ARENA_RULES = {};
const CART_ITEM_FX = {};
const CART_ARENA_ICONS = {};
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
  if (!k.mastered) k.mastered = {};
  return k;
}
// an arena is mastered once every one of its objectives has been won at least once
function cartArenaMastered(id) { const A = cartArena(id), w = cartSave().wins; return A.objectives.every(o => (w[A.id + ':' + o] || 0) > 0); }
// the arena-only items the player has unlocked for the circuit races
function cartMasteredItems() { const sv = cartSave(), out = []; for (const A of CART_ARENAS) if (sv.mastered[A.id] && A.powers) for (const p of A.powers) if (CART_ITEMS[p]) out.push(p); return out; }
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
function cartRollItem(rank, n, rng, arenaId, carId, drvId, poolCar) {
  const b = n <= 1 ? 1 : rank <= 1 ? 0 : rank <= 3 ? 1 : rank <= 5 ? 2 : 3, O = CART_ITEM_ODDS[b];
  // the car's own signature special, or the driver's own special (C3): together 1.4x the car-only rate (still rarer for
  // the leader), split evenly between the two
  const SP = carId && CART_SPECIALS[carId], DV = drvId ? CART_DRIVERS.find(d => d.id === drvId) : null, DS = DV && DV.special && CART_ITEMS[DV.special] ? DV.special : null;
  if ((SP || DS) && rng() < CART_SPECIAL_ODDS[b] * (SP && DS ? 1.4 : 1)) return SP && DS ? (rng() < 0.5 ? SP.id : DS) : SP ? SP.id : DS;
  // on a car's own level that car's signature special is in everyone's pool (poolCar: the level's car)
  const PS = poolCar && poolCar !== carId && CART_SPECIALS[poolCar];
  if (PS && rng() < 0.12) return PS.id;
  // in an arena with its own powers, almost half the boxes hold one; in races, mastered arena powers join the pool
  const A = arenaId ? cartArena(arenaId) : null;
  if (A && A.powers && A.powers.length && rng() < 0.45) return A.powers[Math.floor(rng() * A.powers.length)];
  if (!arenaId) { const M = cartMasteredItems(); if (M.length && rng() < 0.22) return M[Math.floor(rng() * M.length)]; }
  let tot = 0; for (const k in O) tot += O[k];
  let r = rng() * tot; for (const k in O) { r -= O[k]; if (r <= 0) return k; }
  return 'glow';
}
