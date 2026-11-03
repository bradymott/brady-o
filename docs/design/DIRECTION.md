# Direction (latest; overrides older notes where they conflict)

## Three separate apps (not three games in one app)
Each is its own installable app: its own web address, home-screen icon, name, title screen and save data.

| App name (exactly) | Was | What it is |
|---|---|---|
| **Brady Goes to Burning Man** | "Brady-O Burns" | The flagship 3D open-world adventure (all `src/40`–`42` Burns code). |
| **Super Brady-O World** | same | The 2D overworld platformer (60 levels). |
| **Art Cart** | "Art Car Kart" | The kart racer / battle game. |

**Branding rule:** nothing in *Brady Goes to Burning Man* says "Brady-O": no titles, menus, dialogue, credits or signs. The hero is just **Brady**.

## Brady Goes to Burning Man: the vision
**Graphics come first.**
- The owner's #1 priority: it must look amazing.
- Real-time shadows, rich lighting (HDR, tone-mapping, bloom, ambient occlusion), gorgeous skies (sunrise, sunset, night stars), glowing playa at night, dust and atmosphere, detailed materials.
- All within an iPhone budget.

**Open world, like the big open-world adventures (our own design).**
- Massive open landscapes: walk, bike or drive around a whole Black Rock City and deep playa.
- Missions start from people and places in the world, and side quests, interactables and mini-games are everywhere.

**Sub-worlds.**
- Entering certain places (a camp, the Man's pavilion, the Temple, the airport…) transitions into that place's own world/level.
- Today's story worlds (1–17) become these places.

**Cinematic.**
- Story-moving cinematics when a level is completed and Brady moves on: letterbox, camera moves, title cards with the day of the week, music swells.
- Fun to watch as well as play.

**Camera choice** (switchable any time, plus a setting):
1. **First-person:** you see Brady's hands and whatever he's carrying for the mission.
2. **Close third-person:** just behind Brady's head.
3. **Far third-person:** zoomed out, Brady small in a big landscape.

## Super Brady-O World: now a trip AROUND THE WORLD (no Burning Man at all)
A classic-feeling 2D overworld platformer with better graphics. **Super Brady-O travels the world.**
- Each world is a different country.
- The overworld is a world map across continents; Brady flies from country to country.

**Countries in route order** (the owner's picks; Paris was his example; he added Morocco and Japan):
1. Mexico
2. Ecuador (with the Galápagos)
3. Brazil
4. Mozambique
5. Morocco (Marrakech souks, Sahara, the Atlas mountains)
6. Valencia (Spain)
7. Paris (France)
8. Amsterdam (Netherlands)
9. Bali (Indonesia)
10. Vietnam
11. Japan (Mount Fuji, cherry blossoms, bullet trains, Tokyo neon; folklore creatures as enemies; no existing Japanese characters or franchises)
12. Nepal (finale in the Himalayas)

Plus two secret lands: e.g. Antarctica, and the hidden **World 22**, a nod to the owner's novel "22".

**Every country is unique:**
- its own background landmarks and palette;
- its own funny local enemies and hazards;
- its own level gimmicks;
- music in an original style inspired by local instruments;
- a castle boss.
- Levels must all be really different.

**Humor:**
- Build the gags from food, animals, objects, landmarks and folklore, e.g. Paris: walking baguettes and mimes throwing crepes.
- Never caricature the people of a country or their sacred figures and sites. Temples, stupas and prayer flags are respectful background only.

**Landmark rights:**
- Skip landmarks with image-rights claims; Rio's Christ the Redeemer statue is one. Use Sugarloaf Mountain, beaches and the skyline instead.
- Show the Eiffel Tower in daylight or with generic lights, not its signature night light show.
- Stylize modern architecture.

**Story:** to be finalized by the 2D lead. A fun villain who steals or shrinks the world's landmarks works well, with Chinka travelling with Brady or sending postcard clues. The final showdown is in Nepal.

### Power-ups (the owner's design)
**Core set, found in every country.** These rework the existing items in `src/11_player.js`. Each power is one small cartoon pickup: touching it gives the power.

| Power-up | Replaces | What it does |
|---|---|---|
| **Magic mushroom** | today's psychedelic mushroom (`coffee`) | Brady grows big. For a few seconds the whole screen goes colorful and dizzy: hue cycling, a gentle wobble, kaleidoscope sparkles. Respect the reduced-motion setting. **Original look:** a tall, wavy cap with swirling rainbow stripes. Never a red cap with white spots, and no face. |
| **Joint** | the liquor bottle (`vinyl`, green puke balls) | Brady blows puffs of smoke at enemies, and a puff defeats an enemy. The puffs are soft grey-white clouds and rings that billow, drift and fade, with a lazy, funny sound. It's the "big plus projectile" tier (power 2). |
| **LSD tab** | the flight item (today's `bufo` flight / `joint` float) | Timed flight: Brady flies freely for a while. A long rainbow streams behind him, he shoots rainbow lasers, and his face is pure joy (a huge grin) the whole time. It ends with a gentle glide down and a warning flicker before it runs out. **Look:** a little paper tab with a rainbow and a smiley printed on it. |
| Keep | | Invincibility, extra lives, the water bottle and coins (re-skin per country as needed). |

**Country power-ups,** in addition to the core set. Each country has one signature item used in its own levels. The owner suggested the tacos, the carpet and the nunchucks; the rest are proposals he can swap.

| Country | Power-up | What it does |
|---|---|---|
| Mexico | **Taco toss** | Throw tacos; salsa splats stun. |
| Ecuador | **Blue-footed booby boots** | Mega-bouncy jumps; landing makes a shockwave. |
| Brazil | **Football** | Kick a ball that ricochets off walls and enemies. |
| Mozambique | **Piri-piri chili** | Breathe fire for a few seconds. |
| Morocco | **Flying carpet** | Ride it through the sky section of the level. |
| Valencia | **Tomato fight** | Lob splatting tomatoes; the splats leave slippery puddles that enemies slide on. |
| Paris | **Mime gloves** | Draw invisible walls and stairs to block crepes and climb. |
| Amsterdam | **Dutch bike** | Ride fast, hop canals, ring the bell to stun. |
| Bali | **Surfboard** | Surf the wave levels. |
| Vietnam | **Noodle lasso** | Swing across gaps on a pho noodle. |
| Japan | **Nunchucks** | A spinning melee attack that also knocks projectiles away. |
| Nepal | **Yak ride** | Charge up mountain slopes and smash through snow walls. |

**Tone:** cartoon, silly and affectionate. Pickups and effects are comedic, never instructional, and enemies are defeated with goofy poofs.

**Rating:** drug items mean a mature rating (17+) if this is ever submitted to an app store.

## Art Cart
- **Art cars to choose:** original art cars inspired by the playa's most famous legends:
  - a heart-topped sound car
  - a mirror-ball fish
  - a fire-breathing mechanical octopus
  - dragons
  - a giant rubber duck
  - a temple/pyramid sound car
  - more like these
- **Every car is our own design and our own name.** No replicas of real art cars, their artwork, names or logos.
- **Drivers:** the action-figure cast (`docs/design/CAST_ACTION_FIGURES.md`), plus Brady, Chinka and the Man.
- **Weapons:** every car has its OWN signature weapon that reloads every 5–10 seconds (deploy it when ready), on top of pickups: "kart racing plus way more attacking".
- **Not only tracks:** also open arenas, such as a dirt-bike course, a skate park and an open-playa battle area, with racing and objectives.

## Ground rules (unchanged)
See `docs/HANDOFF_LOCAL_AGENTS.md` §2:
- original designs only;
- real camps and art as layouts and structures, never replicas;
- real people as name-drops only;
- no brands;
- PG-13.
