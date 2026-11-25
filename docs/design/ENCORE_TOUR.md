# Super Brady-O World: the Encore Tour (worlds 14 to 18)

Design brief, 25 Nov 2026. Brady's request, in his words:

> "make me a bunch more levels that are very different from one another and make the gameplay more fun and diverse and interesting. add new countries, new level types and new worlds. make them all follow the worlds and levels that have already been created, and make them get progressively harder so that the game will be fun and challenging to play towards the end."

Five new main lands follow Nepal on the tour route. Each has **six levels**: four main levels, a boss level and one secret level. That is 30 new levels (102 becomes 132) and 25 new level types.

## 1. Story: nobody cancelled the second half of the tour

- Nepal's Grand Finale (12-5) is still the ending. Nothing about lands 1 to 13, World 22 or the three bonus lands changes.
- After the finale, Chinka-O turns Piwi's tour poster over. On the back: **five more tour dates.** The posters are up, the acts are booked and paid in advance, and the scenery was shrunk and posted ahead weeks ago.
- So the trip goes on. Brady-O and Pupo cancel each show and put each landmark back; Chinka-O goes ahead to talk to the venues and leaves her postcards (the collectible, unchanged) with tips.
- Each land's boss is **the act nobody cancelled**. It has been waiting on stage for weeks and it is in a mood.
- Piwi is not in these lands (he is pocket-sized in his jar, or running his puppet theatre, depending on how far Brady has played). His bookings, his "P" posters and his wind-up stagehands may appear. Chinka-O is free; she is never captured again.
- The last date is **The Moon**: "LIVE ON THE MOON. No atmosphere. Great acoustics."
- Tone and rules are those of `docs/design/STORY_PIWI.md`: PG, silly, warm. Humour from food, animals, objects and folklore; never from people.

| World | cc | Land | Shrunk scenery | The act nobody cancelled (boss, x-5) |
|---|---|---|---|---|
| 14 | `it` | Italy | the leaning tower (Piwi "fixed" the lean; it pops back crooked) | a giant operatic meatball tenor |
| 15 | `ke` | Kenya | the snow cap of the great mountain | Big Kiboko, the hippo who does water ballet |
| 16 | `au` | Australia | the harbour's white sails | the Drop Bear (the tall tale, real after all) |
| 17 | `is` | Iceland | the great geyser, corked | the Night Troll, who turns to stone in sunlight |
| 18 | `moon` | The Moon | a crater (he took the hole) | Madame Moo, the cow who jumped over the moon; the headliner |

Boss names are suggestions; the land's builder may improve them. Use no real person, brand or other game.

## 2. Unlocking, ids, save

- The five stops are in `TOUR_ROUTE` (`src/28_tour_a_core.js`) after Nepal, flagged `encore: true`, with `d0` (difficulty 0.88 to 0.95). They are ordinary main lands: each opens when the land before it is beaten, so Italy opens when Nepal's boss falls. `Tour.isFinale` still fires on 12-5.
- Level ids: `<world>-1` to `-4` main, `-5` the boss (the last main level, `arch: 'lair'`), `-6` the secret level (`secret: true`), reached by a hidden exit in one of the main levels.
- **The save key stays v5.** These lands only add levels; no existing level changes, so Brady keeps his progress and walks straight on from Nepal. Do not change any level in worlds 1 to 13, 22 to 25.

## 3. The difficulty ladder

The Encore Tour is the hard part of the game, and each land is harder than the one before. Brady asked for a game that is challenging towards the end. Hard means demanding and fair, never cheap.

| Land | Target |
|---|---|
| 14 Italy | As hard as Nepal's hardest. New ideas are taught safely first, then tested. A checkpoint about every 45 tiles. |
| 15 Kenya | Longer runs between checkpoints (about 55 tiles), enemies placed where the mechanic is already asking something. |
| 16 Australia | Two ideas at once in the last third of each level. Fewer free power-ups after the first quarter. |
| 17 Iceland | Tight timing windows, moving hazards over pits, one checkpoint per long level plus one before the last stretch. |
| 18 The Moon | The hardest levels in the game. Every earlier idea of the land combined in the final third. The boss has three real phases. |

Fairness rules (all lands):
- Teach each new idea in a spot where failing costs nothing, then test it, then twist it. Never ask for a blind jump or a guess.
- Every danger has a tell (a wind-up, a shadow, a sound, a flash) of at least 0.5 s.
- The level checker must prove every level finishable with no power-up beyond what the level hands out. Hard comes from timing, combination and length, not from pixel-perfect jumps: keep jumps at most 85 % of Brady's reach.
- Phone play: Brady plays with touch controls on an iPhone. Nothing may need two simultaneous precise inputs beyond move + jump + one action.

## 4. The 25 new level types

Every non-boss level is a **new archetype** (`arch`), never one of the 35 already in the game (`lair` for the bosses is exempt). Each must feel different in the hands, not only look different. Register each new arch's map label in the land's own file: `Object.assign(TourLandscape.ARCH_LABEL, { scoot: 'SCOOT', … })`.

The concept lines below are the starting point. The builder designs the detail, and may swap an idea that does not turn out fun for a better one, provided the arch name stays unique across the whole game and the level type is not already in another land.

### 14 Italy (`it`): cobbles, kitchens, opera
| Id | arch | Idea |
|---|---|---|
| 14-1 | `scoot` | **Scooter Dash.** Brady rides a little scooter through cobbled alleys at speed: he controls brake, boost and hop. Laundry lines, market crates, pigeons, ramps onto rooftops. Not an on-rails ride: the player drives. |
| 14-2 | `dough` | **The Pizzeria.** Stretchy pizza dough: platforms that sag under Brady and then fling him, dough ropes that stretch and snap back, ovens on conveyor belts. The longer he stands, the further it throws. |
| 14-3 | `lean` | **The Leaning Tower.** A tower climb where the whole building tips left, then right: loose barrels and crates slide, pendulum bells swing, floors become slopes. The tilt has a clear rhythm and a tell. |
| 14-4 | `aria` | **Night at the Opera.** A blackbird diva sings. Her long notes are updraft columns Brady rides between balconies; when she breathes in they stop. Chandeliers, curtains, spotlights. |
| 14-5 | `lair` | The opera stage: the meatball tenor. |
| 14-6 | `espresso` (secret) | **Doppio.** Espresso cups put the whole level in fast-forward for a few seconds each: Brady runs at double speed through a gauntlet built for it. |

### 15 Kenya (`ke`): the savannah
| Id | arch | Idea |
|---|---|---|
| 15-1 | `stampede` | **The Great Migration.** Run with the wildebeest herd: their backs are the platforms, the herd is the level's moving floor, and it must be kept up with across the plain and over a crocodile river. |
| 15-2 | `necks` | **Giraffe Grove.** Giraffes are living lifts and bridges: each bends its neck towards the acacia leaves Brady holds up, so he steers them to build his route. |
| 15-3 | `flock` | **Flamingo Lake.** Flamingos standing in the shallow soda lake are the stepping posts. They take off when startled and land again in patterns; some flocks carry Brady across. |
| 15-4 | `shade` | **High Noon.** The sun is the hazard: a heat gauge fills in the open and empties in shade. Umbrella acacias, drifting cloud shadows, an elephant who walks along casting a moving patch of shade. |
| 15-5 | `lair` | The waterhole: the water-ballet hippo. |
| 15-6 | `burrow` (secret) | **Meerkat Manor.** A warren of burrows: pop into one hole and out of another, with sentries who whistle when they see Brady above ground. |

### 16 Australia (`au`): the outback and the coast
Animals and objects only. No sacred sites (the great red rock does not appear), no cultural objects as toys.
| Id | arch | Idea |
|---|---|---|
| 16-1 | `pouch` | **Pouch Express.** Brady rides in a kangaroo's pouch. Hold jump to charge a giant hop; the longer the hold, the further the leap. Red desert, termite mounds, dry creek beds. |
| 16-2 | `convoy` | **Road Train.** A mile-long truck convoy at speed down an outback highway. Hop from trailer to trailer against the wind, duck road signs, cross the gaps as trucks change lanes and overtake. |
| 16-3 | `sonar` | **Platypus Creek.** Muddy water at dusk: nothing shows until Brady sends a ping (the action button), which lights the platforms, the snags and the yabbies for a couple of seconds. |
| 16-4 | `web` | **The Canopy.** Giant spider webs strung through gum trees: webs are trampolines and ladders, but every landing sends a tremor down the strands, and a tremor that reaches the spider brings it over. |
| 16-5 | `lair` | A gum tree at night: the Drop Bear (he drops; watch for the shadow). |
| 16-6 | `giant` (secret) | **The Big Things.** The roadside giants: a level among enormous fruit, a giant prawn, a giant boot. Brady is tiny; everything rolls. |

### 17 Iceland (`is`): fire and ice
Distinct from Antarctica (13): this land is volcanic, steaming and green-black, not a white ice sheet.
| Id | arch | Idea |
|---|---|---|
| 17-1 | `aurora` | **Northern Lights.** A night level where the aurora's ribbons are walkable light: they ripple across the sky in waves, fade and return. Brady runs the ribbon as it moves. |
| 17-2 | `berg` | **The Glacier Lagoon.** Floating icebergs that tip and roll over when Brady stands off-centre, with seals as counterweights. Keep moving, keep balanced. |
| 17-3 | `quake` | **The Rift.** Two halves of the land drift apart and grind together: chasms open and close, ledges line up for a moment, walls crush. A slow, readable rhythm. |
| 17-4 | `basalt` | **The Organ Pipes.** Six-sided basalt columns that rise and sink under weight like organ keys, each at its own speed, inside a volcano with a lava lake below. |
| 17-5 | `lair` | A cave mouth before dawn: the Night Troll. Sunlight turns him to stone (mirrors exist in the toolkit). |
| 17-6 | `shy` (secret) | **The Hidden Folk.** Platforms and doors that exist only while Brady is facing away from them. Walk backwards to cross. |

### 18 The Moon (`moon`): the last tour date
| Id | arch | Idea |
|---|---|---|
| 18-1 | `lowg` | **One Small Hop.** Low gravity: huge floaty jumps, long hang time, dust geysers, crater rims. The jump Brady has known for 100 levels now behaves differently and the level is built for it. |
| 18-2 | `drift` | **Spacewalk.** Outside Piwi's orbiting venue, on a tether: no ground. Short puffs from an air canister push Brady; he keeps his momentum. Drifting debris, airlocks, a limited tank refilled at valves. |
| 18-3 | `rover` | **Moon Buggy.** Brady drives a springy six-wheeled buggy over craters and ridges: throttle, brake, jump, lean in the air to land flat. |
| 18-4 | `mag` | **The Moon Base.** Magnet boots: on metal panels Brady can walk up walls and across ceilings, switching the boots on and off with the action button; off the metal he floats in low gravity. |
| 18-5 | `lair` | The lunar stage: the headliner. Three real phases; the last boss of the game. |
| 18-6 | `stars` (secret) | **Connect the Stars.** Stepping on stars in the right order draws a constellation, and each finished constellation becomes a bridge of light. |

Not allowed (too close to another company's game): small round planets with their own gravity; a shadow double that copies Brady; anything resembling a Nintendo item, block, pipe, enemy or level.

## 5. What each land needs

Built like the three bonus lands, which are the working examples of a self-contained, code-drawn land: `src/29_tour_eye.js` + `29_tour_eye_levels.js` (The Red-Eye), `29_tour_lost*.js`, `29_tour_fest*.js`, with `tools/boss_tests/eye.js` and `tools/sbw_eye_shots.js`.

1. `src/29_tour_<cc>.js`: looks (themes, painted backdrops, tiles, props, all code-drawn in the flat Fiesta Toon look with the ink outline), enemies (at least four new critters with behaviours that fit the land), the new mechanics' entity types, the boss, music, the route-map pin, `Tour.country({ id, … })`. The stop itself is already in `TOUR_ROUTE`; do not call `Tour.addStop`.
2. `src/29_tour_<cc>_levels.js`: the six levels via `Tour.amend`, and the land's walkable map (`TOUR_OW_MAPS.<cc>`).
3. Every level: three postcards, at least two power-up opportunities, at least one secret room or hidden area with a visible tell and a way back out, a hidden exit to x-6 in one main level, fairly hinted.
4. The boss: a fight with its own mechanic that follows from the land, its own arena and lead-in, `tools/boss_tests/<cc>.js`.
5. `tools/sbw_<cc>_shots.js <outdir> [--checks]`: plays each level's new mechanic in the browser the way a player does, and takes phone-size screenshots (844x390 landscape, 390x844 portrait).
6. The shared lists: every new entity type in `TourHats.HEADS` or `TourHats.NOT` (`src/28_tour_sc_hats.js`), safe touches in `tools/sbw_hits_test.js`. Keep such edits to a few lines in a clearly marked block for the land, so five branches merge cleanly.
7. If time allows, in this order: a Souvenir Stand; a Wormhole in a Loading Dock (`docs/design/SECRETS_CONTRACTS.md`); a Pupo level (`docs/design/PUPO.md`, existing kit only). These are extras; six good levels and a good boss come first.

## 6. Rules that always hold
- Original content only. Nothing resembling Nintendo or any other game, even renamed. No brand names.
- The player is the code-drawn Brady: black tee and trousers, man bun, dark square shades, no stubble, blackwork sleeves. Chinka-O: ballerina in a pink tutu, drawn warmly. Pupo: round, never spiky.
- Never caricature people; crowds and passengers are animals or objects. Sacred buildings only as plain distant silhouettes. No national or religious headwear. PG-13.
- Every secret has a visible tell and a way back out; no secret may need a power the level does not hand out.
- Never edit `src/40` to `src/43` or `src/28_tour_b_build.js`. Other shared files: tiny additive edits only. New behaviour is added by wrapping from the land's own files.
