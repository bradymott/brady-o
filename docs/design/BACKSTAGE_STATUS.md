# Backstage, Wormholes, Brady Buttons and Festival Fields: what is built and where to look

Branch `sbw/backstage` (17 Nov 2026). Built from `docs/design/SECRETS_WARPS_SWITCHES.md` (Brady's decisions at its top win) and the contracts in `docs/design/SECRETS_CONTRACTS.md`. Player-facing names: **Wormholes**, **Brady Buttons**, **Piwi's House Rules**. Code names stay neutral (`warp`, `button`, `seam`, `backstage`).

## Where to look (tell Brady)

Every secret has a tell you can see from the normal route. After a level is cleared once, the map's exit dots (○ / ●) count its Wormhole too.

### Mexico 1-4 Volcán Escape: the Rigging (backstage above the volcano)
- **The way in:** climb to the crater rim (the very top, by the finish gate). In the rim's left corner a **sandbag dangles down on a rope** from above the top of the screen, over a **spring**, next to a yellow **CREW ONLY** sign. Stand on the spring and **hold jump**: Brady flies off the top of the screen and a velvet curtain whips away: he is in the Rigging.
- **Inside:** the catwalks over the volcano set, a ghost light, a costume rail, Piwi's wind-up stagehand mice (harmless; they squeak and run). Climb the catwalks (or bounce off the crash mat in the deck, hold jump) to the high fly gallery.
- **Brady Button (Rule 3: NO DANCING):** on the high fly gallery. Stand beside it and press **Action** (or Up). Jumping on it only goes "bzzt". It shows the REVOKED card, then a little world map where **Festival Fields** cracks open. From then on every critter dances (Settings → HATS & DANCING to switch the effects off).
- **Wormhole → ECUADOR (2-7 Devil's Cauldron):** the trunk at the far right end of the deck; press **Up**. Brady is sucked in, the results say **WORMHOLE!**, then the map shows the wormhole crossing the globe and Brady pops out in Ecuador at 2-7 (a trail from Ecuador's airstrip to 2-7 opens so he is never stranded). 1-4 counts as cleared.
- **Way back:** the rope through the hole in the deck at the left (where he came up): drop through it and he lands back on the crater rim.

### Festival Fields (bonus land 23), opened by the Mexico button
On the world route map, a new island in the North Atlantic. Fly there from any land.

**23-1 Campsite Scramble** (a maze of six fields, any order)
- Piwi padlocked the main stage with three padlocks (red, blue, gold). Their **tent pegs** are lost round the campsite:
  - **red:** guy-rope alley (top middle field), on the roof of the big tent: hold jump on the guy-rope spring under it.
  - **gold:** the chill-out field (bottom left), on the high platform: bounce off the hammocks in the ground (hold jump).
  - **blue:** the airbed pond (bottom right), on the platform over the pond: bounce off the airbeds (hold jump).
  - The tent flap in guy-rope alley goes down to the lost-property yard (bottom middle), which joins the chill-out field and the pond.
- Postcards: P1 up the pallet steps in the gate field; P2 behind the fake wall top right of the lost-property yard; P3 in the wings (below).
- **The Wings (backstage) and a Wormhole → MEXICO (1-4):** at the very start, the curtain at the left edge of the gate field stirs and a stagehand mouse runs that way. Walk **left** off the start. Inside: the stage's wings, a Wormhole back to Mexico 1-4, a hidden 1UP over the ghost light, P3 up the catwalks. Walk off the right edge to go back.

**23-2 The Mud Bath** (a maze of mud pools that rise in every rain squall)
- The boardwalk at the start is broken: drop through the gap into the wallow. Every 16 s the mud rises to the top of the pools, holds 4 s and drains. The gaps high in the pool walls can only be swum through at high mud. Flipper fins on the stand at the start help.
- The tent flap at the bottom of the duck pond (middle) goes up to the showers and on to the exit tent.
- P1 over the shower stalls; P3 under the ceiling of the wellies pool (bottom right; high mud only); a hidden 1UP there too.
- **The Under-Stage (backstage):** the **drain swirling in the bottom of the duck pond**: swim or drop down into it (press down). Brady comes out under the main stage: P2, a hidden 1UP, a stage door back to the pond.

**23-3 The Silent Disco** (night; a dark maze of six fields)
- Piwi switched the music off. Brady's glow fades in the dark; touching a **glow-stick lantern** relights it. The dance floors still light up to a beat nobody can hear: cross when they light.
- Route: the start field → the dance-floor bridge over the spikes (P1 above it) → the tent flap at its end down to the glow-stick grove → right to the speaker stacks → climb the stacks and the dance floor to the tent flap at the top → the DJ booth and the exit gate.
- The chill tent (bottom left, off the grove) is a dead end with P2 behind a fake wall top left and a hidden 1UP; P3 is at the top of the speaker stacks.
- 23-3 is Festival Fields' last level for now (no boss yet), so its map stop is drawn as an ordinary stop.

### Wormholes across the tour (Loading Docks)
In each level below there is a **stack of flight cases before the finish gate and a yellow CREW ONLY sign on a truss over the gate**. Climb the cases, cross the truss over the gate **without touching the gate**, drop down past it and keep walking right off the edge: the Loading Dock. Its Wormhole (far right) leads to:

| Level | Wormhole to | Notes |
|---|---|---|
| 2-3 Booby Dash | BRAZIL: 3-6 Rio Hang-Glide | one land ahead |
| 3-1 Samba Sunrise | MOZAMBIQUE: 4-6 Buried Dhow | **Brady Button (Rule 7: NO HATS ON ANIMALS)** in the middle of the dock: every animal gets a little hat |
| 4-1 Ostrich Dash | HATCHLINGS: 4-4 Hatchling Night | same land |
| 5-3 Chefchaouen Blue | FRANCE: 7-6 Seine Chase | two lands ahead |
| 6-3 City of Arts by Night | AQUARIUM: 6-6 Oceanogràfic | same land |
| 7-2 Lavender Magpie | NETHERLANDS: 8-6 Windmill Row | one land ahead |
| 8-3 Bike Lane Rush | VIETNAM: 10-6 Mekong Floating Market | two lands ahead |
| 11-3 Night of Things | NEPAL: 12-7 Piwi's Prop Depot | one land ahead |
| 12-2 Yak Caravan Pass | ANTARCTICA: 13-2 Upside-Down Pole | a second way into Antarctica |
| 13-1 Ice Shelf Bowling | HOME: 1-6 Pit of Swallows | back to Mexico's secret pit |
| 22-1 The Station of Clocks | THE DESK: 22-5 The Writer's Desk | same land |

The dock's left edge goes back to the level (beyond the gate). A Wormhole within a land plays as a hop on the map: Brady spins into a wormhole at one stop and out at the other, and a sparkly trail joins them.

## How it works (code)
| File | What |
|---|---|
| `src/28_tour_s_secrets.js` | stage A: save fields (`tour.rules`, `warpLinks`, `arrive`, `hop`), Wormhole progress (in-land hops, cross-land arrivals), `Tour.addStop` and `d0` for bonus lands, the map graph's warp links, the overworld hop / arrival, the route-map trip; the `owDraw` / `owTap` / `routeDraw` call sites (by wrapping, the map files are untouched) |
| `src/28_tour_sa_backstage.js` | stage B: `Play.prototype.seamTo` (velocity, powers, Pupo kept; the velvet curtain whip), the Wormhole entity (`warp`: Up only; Brady sucked in; the screen fills with the wormhole; results WORMHOLE!), stagehand mice, backstage themes `bk_rigging` / `bk_dock` / `bk_under` / `bk_wings` (tiles, painted backdrops, props), pieces `rigging`, `wings`, `loadingDock`, `bkLift`, the dock rooms and `TourBackstage.addDock` |
| `src/28_tour_sb_buttons.js` | stage C: `TOUR_RULES`, `TourRules.revoke` (saved at once), the Brady Button entity (slap from the side; stomp = bzzt), the cut to the map (REVOKED card + mini world map), dancing and hats (`entityDraw` / `afterEntities`), Settings switch HATS & DANCING, pause-menu page HOUSE RULES (also in the map's menu), brass dome badges on the map |
| `src/29_tour_mx_secrets.js` | Mexico 1-4's Rigging, its button and Wormhole (kept out of `29_tour_mx_levels.js`) |
| `src/29_tour_fest.js`, `src/29_tour_fest_levels.js` | Festival Fields: route stop, looks (day, rain, night themes), critters (wheelie bin, mud duck in wellies, balloon dog), airbeds and trampolines, tent-peg keys and padlocks, light-up dance floors, levels 23-1, 23-2, 23-3, the land's map |
| `src/29_tour_zz_secrets.js` | the Loading Docks across the tour |
| `tools/validate_levels.js` | new check: `BACKSTAGE <aid> TRAP AT x,y`: from every spot reachable in a backstage area, a Wormhole or the way out must still be reachable (no prize up a climb with no way back) |
| `tools/sbw_backstage_test.js` | node: every seam in and back out, Pupo riding through each seam, every Wormhole (Up only, clear, save, map queue), map progress, every button, the checker's trap fixtures |
| `tools/sbw_backstage_shots.js` | browser: screenshots and in-game checks of all of the above |

Save: key `super-brady-o-world-save-v3` (one clean reset, Brady: "wipe my save i dont care"); settings and look come over from v2 once.

## Not built yet (design §4.4 / §3.5)
- Festival Fields 23-4 The Sound Limiter (boss); Lost & Found (24-1..4) and The Red-Eye (25-1..4); Mexico 1-7 Casa de Sorpresas; 22-6 The Rulebook.
- Brady Buttons for rules 1, 9, 10, 12 and what they open (dormant Wormholes, express trails, night flights, the lost suitcase).
- Rigging / Under-Stage / Wings entrances outside Mexico and Festival Fields (the rest of the tour has Loading Docks, which are added after a level's last step so nothing in the level moves).
- Bali (world 9) and Vietnam (10) have no Wormhole of their own yet (no plain strip level to put a dock on without regenerating it).
