# Super Brady-O World: the boss redesign (November 2026)

Brady's verdict on the first bosses: "all killed by jumping on their heads three times, a white box flashed around
them, you couldn't hit them without dying, it looked awful and it was boring." This document is the brief for the
rebuilt fights. Every boss must be **unique**, **fit its country**, **use objects from the world it lives in**, be beaten
in **its own way** (never plain "stomp the head three times"), and be **involved and fun**: a real fight with phases,
tells, a twist, and a satisfying finish.

## 1. What the framework now gives you (`src/10d_bosses.js`, `src/28_tour_d_actors.js`)
Read the `Boss` class. New since the first bosses:
- **Custom hit rules:** `brain.hit(b, kind, src)` sees every hit first. Kinds: `stomp`, `spin` (headbang), `bump`
  (Brady's head from below), `disc` (smoke puffs), `laser`, `star`, `prop` (a kicked or thrown world object, `src` is the
  `TourProp`), `hazard` (anything the arena does to the boss: you call `b.hit('hazard', thing)` yourself), and any
  signature-item kind your country fires (`taco`, `bell`, `tomato`...). Return `true` after calling `b.damage(n, opts)`
  yourself, `'bounce'` (Brady bounces off safely, your `guardText` floats up), `false` (nothing), or `undefined` to fall
  through to the defaults (stomp while `b.vuln`, disc chips, star).
- **`b.damage(n, { text, col, quiet })`** floats a word, tints the flash colour, and `quiet` skips the hurt reaction.
  Damage gives Brady 0.7 s of grace, slows time for a few frames (hit-stop) and draws a shockwave ring: hits now
  visibly land. The boss is harmless to the touch for the whole hurt second.
- **Phases:** `brain.phases = [hp, hp]` (descending thresholds) calls `brain.phase(b, n)` once when hp drops to or
  below each threshold (`n` = 2, 3...). Use it to change the arena, the moves, the music feel, the boss's look.
- **`brain.touch(b, p)`**: full control of body contact when you need it (return `true` when handled).
- **`brain.lastHit(b)`**: intercept the killing blow (a second form, a chase, an escape).
- **`TourProp`**: a physical world object. Brady pushes it, kicks it by running into it, stomps it to launch it; bosses
  `fling(vx, vy)` it. Moving fast, it hits the boss (`b.hit('prop', prop)`), knocks out enemies, and hurts Brady if
  `hurts` is set and he did not throw it. Config in the class comment: size, art, kick speed, bounce, roll, hp, life,
  breakOnWall, callbacks. Register props as entity types (`entities: { mxMelon: TourProp.make({...}) }`) so arenas and
  brains can spawn them.
- The hurt flash is now a silhouette tint; never draw your own white box. Draw a readable **tell** for every attack and
  a clear **weak moment** (the framework draws a ▼ while `b.vuln`; you can draw more).
- Arena pieces: `arena_<name>(st, { x0, w, GY })` in your country's `pieces` builds the room (platforms, pits, switches,
  decor, props via `st.spawn`). Keep it validator-friendly (every ledge reachable by the physics in the guide).

## 2. Design rules
1. One **signature mechanic** per boss, different from every other boss (listed below; do not drift into another
   boss's trick). Stomping may be *part* of a fight only after a setup that is itself the mechanic, and never the whole
   fight.
2. **Three phases minimum** (use `phases`), each adding a move or changing the arena. The last phase should feel
   desperate and spectacular.
3. **Readable:** every attack has a wind-up tell of at least 0.5 s with a pose or sound; every weak moment is clearly
   drawn. A player who dies should know why.
4. **Fair:** Brady's hits never cost him a hit back (the framework handles grace); no attack is unavoidable; no
   instant-kill walls of projectiles. Difficulty rises through the countries (Mexico gentle, Nepal hard).
5. **Fun:** keep the comedy: shouted lines (`K.say`), reactions to being hit, a defeat gag (`lastHit` or `hurt`).
6. **World objects:** the arena is full of the country's things, and the fight uses them.
7. **Original:** no borrowed characters or iconic moves from other games. Respect rule for people and sacred things
   (see WORLD_TOUR_GUIDE.md §11).
8. Keep the boss's `dims`, `floats`, `music` keys; keep the boss id and name unless the brief says otherwise. The castle
   level's `arena:` name may change if you build a new arena piece.

## 3. The fourteen fights
Each entry: the boss, the mechanic (mandatory), the phases (a starting point: make them your own), the finish.

### Mexico 1-5: El Gran Piñatón (`29_tour_mx.js`)
Mechanic: **break the piñata from below.** He hangs from a rope on a pulley across the arena ceiling and swings, so stomps are
impossible (`'bounce'`). Brady must **headbutt him from underneath** (`bump`) while he swings low, like a real piñata
party, using the market's **bouncy awnings** (springs / `SURF.BOUNCE` platforms) to reach him when the rope shortens.
Phases: 1 swings and spits candy (candy is collectible); 2 the rope shortens, he throws spinning cones and the lights go
"blindfold" dark in pulses (`g` darkness flicker, keep it short); 3 the rope snaps: he drops and rolls around the floor
as a spiky ball (roll = prickly) and only a **stomp while he is dizzy after hitting a wall** finishes him (one hit).
Finish: he bursts into a candy rain, Brady is buried in sweets.

### Ecuador 2-5: El Tortugón (`29_tour_ec.js`)
Mechanic: **flip him with the volcano vents.** The arena floor has three vent grates. Brady stomps a lever block (a
`B.beat`-style switch or a `TourProp` lever) to pop the next vent; when the tortoise walks over a popping vent he is
launched and lands **on his back**, legs waving: now his belly is open (`vuln`). Stomps on the shell always bounce.
Phases: 1 slow walk and shell slam (shockwave); 2 he withdraws and spins across the floor like a disc, bouncing off
walls, and the low-gravity zones of Ecuador switch on and off (`B.zone`) so Brady floats; 3 the floor tilts: moving
platforms, two vents fire at once. Finish: he sulks into his shell and the shell rolls off like a ball.

### Brazil 3-5: O Tucanão (`29_tour_br.js`)
Mechanic: **footballs.** He flies; the only thing that reaches him is a kicked **football** (`TourProp`, ricochets like
the signature item). Balls keep spawning from a ball cannon at the arena side. A ball in the face knocks him out of
the air to the floor where he staggers (open to a stomp for a second hit, optional bonus).
Phases: 1 swoops and drops coconuts; 2 carnival drums: beat blocks pulse and he dives on the beat, beak stuck in the
floor for one beat (`bump` from below or a ball hurts him more); 3 he calls a flock of small toucans (existing flyer
enemy) and the arena's floor narrows with pits. Finish: the final ball sends him into the goal net at the back of the
arena, GOOOOL text.

### Mozambique 4-5: O Eremita (`29_tour_mz.js`)
Mechanic: **take away his shells.** He is a hermit crab who hides in a shell; when hurt he scuttles to the next shell
(there are three around the arena: a clay pot, a bucket, a bottle, each a `TourProp`). Brady can **kick the empty
shells away into the sea** on either side of the arena; the piri-piri fire breath (signature) **heats** a shell he is in
so he jumps out, hot and vulnerable. With no shells left he is exposed for the final hits.
Phases: 1 pincer lunges from the shell; 2 he throws coconuts from the baobab above and tide pools flood the floor
edges (water); 3 shell-less: fast scuttling, claw sweeps, a sulking sprint. Finish: he grabs a tiny thimble and runs off.

### Morocco 5-5: Berrad the Magnificent (`29_tour_ma.js`)
An original object character (redesigned Nov 2026: the earlier blue genie was too close to a film character, and
"djinn" carries religious meaning). Berrad ("teapot" in Moroccan Arabic) is a grand, pompous brass teapot with a curly
spout for a nose, a crown-like finial on his lid and a zellige band round his middle; he floats on his own steam.
Mechanic: **run him out of steam, then stomp his lid.** His charcoal brazier (a heavy clay kanoun on brass wheels, a
`TourProp`) sits on the floor. Every attack (a volley of tea glasses, a scalding pour from his spout, a spinning-top
dash) costs steam; then he must settle into the brazier's ring to come back to the boil. If Brady has **kicked the
brazier across the room**, Berrad chases it; while he sits in its ring only his lid shows: **stomp the lid** for
damage. Phases: 1 tea glasses; 2 sandstorm (wind zone, `B.zone`) and two mirage braziers (props that pop); 3 he swells,
the brazier rides off on a little flying rug and the carpet (signature) appears so Brady can follow. Finish: the lid
clamps shut, the brazier rattles and he whistles like a kettle, grumbling. Lines: "TEA? I INSIST. I AM MAGNIFICENT!",
"RUNNING OUT OF STEAM...", "MY LID! MIND MY LID!".

### Morocco 5-4 (mini-boss, FORT): The Brass Owl (`29_tour_ma.js`)
The Baron's clockwork sentry on the kasbah tower, 3 hp. Three tagine lids hang on roof hooks, each with a chain on the
wall. Every 4 s its head turns right round (CLANK, 0.6 s tell); a soft cone shows where it is looking. Pull a chain
while it looks away and that lid drops on it (`hazard` hit). Pull while it watches and it screeches, hops clear and
blows three brass feathers. Phase 2: it flies a lap under the roof and lands under a different lid each time. Stomping
it just clanks. Finish: its head spins faster and faster and it falls apart into a heap of teaspoons.

### Spain 6-5: Paellasaurus (`29_tour_es.js`)
Mechanic: **tomato artillery.** He is a boiling paella pan on legs; stomps burn (`'bounce'`, TOO HOT). Tomato crates
around the arena spill **tomatoes** (`TourProp`, splat on walls); a tomato in the pan cools a patch, and **three tomatoes
in a row put the fire out**: then he is cold and sluggish and one stomp cracks the crust (damage). Phases: 1 charges and
rice spits; 2 Las Fallas rockets launch from the floor (telegraphed), the crates move on the beat-floor lights; 3 he
flips the pan: the arena fills with sliding tomato pulp (`T.ICE` tiles via `iceStyle`) and he skates. Finish: the pan
clatters over and a shower of paella rains.

### France 7-5: Le Grand Soufflé (`29_tour_fr.js`)
Mechanic: **the oven lever and the mirrors.** The castle of mirrors. The soufflé puffs up and floats; Brady cannot stomp
a puff. Two **mirror panels** on the walls tilt when Brady hits them from below (`bump` on special blocks, or props);
when both mirrors aim at the oven window, the oven **flashes** and the soufflé collapses (damage) if he is in the beam.
Phases: 1 crepe frisbees; 2 the mime's invisible walls (signature) appear and he hides behind them; 3 he splits into
three mini-soufflés, only one is real (the real one reflects in the mirrors). Finish: he deflates with a long whistle
and a sad "oh là là".

### Amsterdam 8-5: The Cheese King (`29_tour_nl.js`)
Mechanic: **cheese-wheel volley.** He rolls giant **cheese wheels** (`TourProp`, roll) down the weigh-house ramps at
Brady; Brady **kicks them back** (or stomps to launch) and a returned wheel knocks him off his throne (damage). The
bike bell (signature) stuns a rolling wheel. Phases: 1 one wheel at a time; 2 two ramps, frozen-canal ice on the floor
(slippery); 3 the throne moves on a drawbridge that lifts and lowers (moving platform) so timing matters. Finish: he is
buried under his own wheels, crown spinning.

### Bali 9-5: Boss Kera (`29_tour_id.js`)
Mechanic: **drop the durians.** The monkey king sits in the temple-garden trees (respectful background only, no sacred
figures). He steals Brady's items and laughs at stomps (`'bounce'`). Brady must **stomp the branches** (semi platforms)
so **durians** (`TourProp`, spiky, heavy) fall on him; one durian to the head knocks him down the trunk (damage).
Phases: 1 banana peels (slide) and coconut lobs; 2 a monkey troop (small enemies) that carry durians away; 3 he swings
across on vines (the night-level swings) and the trees shake back. Finish: a durian lands in his lap, he eats it,
surrenders, gives the items back.

### Vietnam 10-5: Ong Phin (`29_tour_vn.js`)
Mechanic: **steam him with the kettle.** He is a coffee filter (phin) on a cup; he drips scalding coffee. A big
**kettle** on a chain hangs from the ceiling; Brady **stomps the kettle's foot pedal** (prop/switch) to swing it, and
when the kettle crashes into Ong Phin it blasts him with steam (damage, he is "over-brewed"). Phases: 1 drips and
slides on spilled coffee; 2 paper lanterns light the arena and he blows them out (dark pulses, light from lanterns);
3 the water-puppet stage rises: puppets pop up as moving obstacles. Finish: he drips empty, sighs, and sits down for a
cup.

### Japan 11-5: The Great Kappa (`29_tour_jp.js`)
Mechanic: **the bow.** Folklore: a kappa must return a bow and spills the water from the dish on his head. Brady
**crouches** (holds down) near him when he stops to glare: the kappa bows back, the water spills, and he is weak
(`vuln`) until he refills from the koi pond. Brady can **push the pond's stepping-stone props** to block the pond, so the
refill takes longer. Phases: 1 cucumber throws, shell slides; 2 he summons koi that leap from the pond; 3 the pond
floods the floor (rising water, he is fast in water). Finish: a final deep bow, he gives Brady a cucumber.

### Nepal 12-5: Baron Bric-a-Brac, the finale (`29_tour_np.js`)
Mechanic: **the stolen landmarks.** The Baron has the shrunken landmarks of all twelve countries in jars. Each phase he
throws one as a weapon (a mini volcano, a mini windmill, a mini tower...) and Brady must **catch and return it**: a thrown
landmark that lands becomes a `TourProp`; kicking it back into the Baron (or his airship) hurts him and frees that
landmark (it pops into the background, growing back). Phases: 1 the Baron on his airship above the Himalayan roof,
three landmarks; 2 he lands in a bric-a-brac mech built from the stolen things (walking, stomping, laser monocle);
3 the mech breaks, he runs and the last landmark must be returned while prayer flags (respectful, decoration only)
and wind zones buffet the ledge. Finish: every landmark restored, Chinka arrives, the ending scene. This is the hardest
and most spectacular fight; keep it beatable.

### Antarctica 13-4: Big Tusk (`29_tour_aq.js`)
Mechanic: **icicles and ice blocks.** The walrus belly-flops and slides on the ice. Brady **bumps the ceiling** under
icicles (`bump` on the ice ceiling tiles or icicle props) to drop them on him, and kicks **ice blocks** (`TourProp`,
slide) so his slide hits them and he tumbles (damage). Phases: 1 flops; 2 penguins skid across; 3 the floe cracks:
floor sections sink (falling platforms), water below. Finish: he slides off the floe with a splash and a thumbs-up.

### World 22 (22-4): The Other Brady (`29_tour_w22.js`)
Mechanic: **the mirror.** The Other Brady **mirrors Brady's movement** across the arena's centre line (moves when Brady
moves, jumps when Brady jumps). He cannot be stomped (he stomps back). The arena has hazards only on his side (spike
pits, a 22-second clock); Brady must move so that the mirror walks the Other Brady **into the hazards** (hazard damage).
Every 22 seconds the clock strikes 22:22 and everything freezes for 2.2 seconds: Brady may then walk through the mirror
and **stomp him once**. Phases: 1 simple mirror; 2 the mirror inverts (he moves opposite); 3 two mirrors (a third copy).
Finish: the mirror cracks and the Other Brady waves goodbye.

## 4. Tests you must write
`tools/boss_test.js` runs every module in `tools/boss_tests/<cc>.js`. Write yours: at least
(a) the boss wakes when Brady enters and the fight starts, (b) the signature mechanic damages him (and the thing that
should NOT work does not), (c) each phase triggers, (d) the boss can be fully beaten through its mechanic (drive the
real inputs / props, not `b.damage` shortcuts, at least for one hit; the rest may use damage) and the door opens,
(e) a screenshot of the most spectacular moment. The old per-boss checks in `tools/gameplay_test.js` are being retired;
do not edit that file.

Run: `BRADY_DIST=<your private dist> node tools/build.js && node tools/boss_test.js <cc>` and
`node tools/validate_levels.js <world>-5` (the castle level must still validate).
