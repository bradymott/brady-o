# BRADY GOES TO BURNING MAN: Theme Camps Guide

The legendary Black Rock City sound camps, rebuilt at real scale from their real layouts: dome counts and sizes, stage types, how the pieces are arranged, the docking art car, the tipi village. Everything you see on them is **our own decor**. No real stage art, logos, artworks, sculptures, art-car artwork or likenesses are copied. Camp names appear as place names. Drop a camp into any world, or onto the open-world city map, with one call.

- Module: `src/41_burns_camps.js` (loads after the engine and `41_burns_bigart.js`, before the worlds)
- Sandbox: `src/42_burns_world98.js`, world id **98**, debug only (not in `BURNS_WORLD_ORDER`, not on the hub). Open it with `window.BRADY_BURNS.debug.play(98)`. Every camp, by day (`g.tod = 0`) and night (`g.tod = 1`), plus a row of far-LOD silhouettes on the horizon.
- Test access: `window.BRADY_BURNS_CAMPS` (also `window.BRADY_BURNS.BurnsCamps`).

---

## 1. Quick start

```js
build(api, g) {
  const rs = BurnsCamps.place(api, g, 'rootSociety', 0, -120, {
    rotY: 0,                  // the camp's front (its street side, local +Z) faces this yaw
    crowd: 1,                 // crowd size multiplier: 0 / false = no dancers, 0.5 = half, 2 = double
    onEnter(g, camp, area) { if (area.id === 'mainDome') g.toast('THE 90 FT DOME'); }
  });
  api.checkpoint('cp_rs', rs.spots.gate.x, rs.spots.gate.z, { name: 'Root Society' });
  const home = rs.spots.bradyTipi;          // Brady's tipi door, world {x, y, z, yaw}
}
```

That's it: geometry, colliders, lights, lasers, fire, DJs, dancers, the art car, enter/exit events and the far-LOD silhouette are all wired. The camp needs its **footprint** clear (§4); Root Society's art car also needs its **tour lane** clear.

---

## 2. API

### `BurnsCamps.place(api, g, kind, x, z, opts) -> camp`

Call it inside `build(api, g)`. `x, z` is the camp origin (§4 gives each camp's local layout around it).

| Option | Default | Meaning |
|---|---|---|
| `rotY` (or `yaw`) | `0` | Rotation. The camp's local +Z (its front, the street side) faces `rotY`. |
| `scale` | `1` | Uniform scale, clamped 0.75–1.3. Real scale is 1; keep it there unless you must squeeze a camp in. |
| `y` | terrain height | Base height. |
| `id` | the kind (`kind2`… for repeats) | Unique id in this world. |
| `night` | `'auto'` | `'auto'` follows the sky palettes (`g.tod`). `true` / `false` / a number 0..1 / `g => bool` force it. Drives lasers, beat-synced point lights, flame bursts, CO2, mirror-ball sparkles. |
| `crowd` | `1` | Dancer multiplier (`false`/`0` none). DJs and named staff stay. |
| `djs` | `true` | `false` leaves the booths empty (your world places its own DJs). |
| `lod` | `'full'` | `'full'` the whole camp; `'far'` only the cheap silhouette (skylines, open-world overview); `'auto'` both, swapped by camera distance (`lodNear`, default 150 m + 35% of the camp radius, with hysteresis). |
| `lights` | auto | Baked light pools are only added when the world ever gets dark; `true` forces them, `false` skips them. |
| `fire` | night only | `false` no flame effects, `'always'` day and night. Flames are decorative (they never hurt). |
| `cover` | — | Overrides the Man's-flash `cover` flag on every collider. |
| `onEnter(g, camp, area)`, `onExit(g, camp, area)` | — | Brady enters / leaves the camp footprint (`area.id === 'camp'`) or a named area (§4). |
| `onArrive(g, camp)` | — | The first time Brady enters the footprint in a visit. |
| `mission` | — | A mission id (use `BurnsCamps.mission(kind, id)`), started and completed on arrival; the token spawns where Brady stands. |
| `djPrompt` | `false` | `true` adds a **PLAY A SET** ACTION prompt at every fixed booth (the shared `BurnsDJ` minigame, §2.3). An object is passed through as `BurnsDJ.open` options. |
| `onEntrance(g, camp)`, `entranceR` | — | A trigger at the camp's entrance (open-world hook: load the camp's own sub-world here). |
| `marker` | `false` | `true` adds a minimap marker in the camp's colour. |
| Root Society | | `withArtCar: false` (no car), `drive: false` (it stays docked), `drive: [[lx, lz]…]` (your own tour, camp-local, from the dock back to the dock), `tour: 'short'` (a short loop round the plaza), `dockTime` (s, default 40), `carSpeed` (m/s, default 6.2), `drivable: false`, `onDock / onUndock / onBoard (g, camp, car)`. |
| Space Cowboys | | `truck: false`, `drive: false`, `dockTime` (35). |
| Thunderdome | | `fighters: false` (an empty dome for your own bout). |

### The camp handle

| Field | Meaning |
|---|---|
| `kind`, `id`, `name`, `x`, `z`, `rot`, `s`, `y0` | What and where. |
| `toWorld(lx, ly, lz)` / `toLocal(wx, wz)` | Camp-local ↔ world. |
| `foot` | Footprint: local `x0, z0, x1, z1` and world `corners`. |
| `entrance` | World `{x, z, yaw, r}`: where you walk in (yaw faces into the camp). |
| `spots` | Named world points `{x, y, z, yaw}` (§4). |
| `stages` | `[{id, name, booth: {x, y, z, yaw}, floor: {x, z, r}, bpm, genre, dj}]`. `booth` is where the DJ stands (facing the crowd), `floor` the dance floor. Vehicle stages (`artCar`, `truck`) compute `booth` from the moving vehicle. `camp.stage(id)`. |
| `areas` | `[{id, name, x, z, r | hx, hz, yaw, dome}]`: named areas for enter/exit events. `camp.area` = the one Brady is in, `camp.inCamp`. |
| `routes` | Vehicle tours as world polylines (`routes.artCar`, `routes.truck`). |
| `vehicles`, `artCar` | Vehicle controllers (§3). |
| `actors` | The actor definitions it placed (DJs, dancers, staff). Live actors: `g.actors`. |
| `cols`, `chunks` | Its colliders and its own static chunks (`chunks.full`, `chunks.far`). |
| `night()` | Current night factor. |

### Other calls
- `BurnsCamps.silhouette(api, g, kind, x, z, opts)`: `place` with `lod: 'far'`.
- `BurnsCamps.info(kind)` → `{name, desc, real, foot, radius, height, entrance, bpm, clear}`; `BurnsCamps.list()` → kinds.
- `BurnsCamps.camps(g)`, `BurnsCamps.camp(g, id)`, `BurnsCamps.where(g)` → `{camp, area}` Brady is in.
- `BurnsCamps.mission(kind, id, extra)` → a ready-made "Find <camp>" mission (custom, manual) for `def.missions`.
- `BurnsCamps.djSet(g, camp, stageId, opts)`: opens `BurnsDJ` at that booth with that floor's crowd, the stage's BPM and genre. The stage's DJ steps aside and comes back after. Fires `bcmSet` / `bcmSetDone`. `opts.onDone(result)`.
- `BurnsCamps.vehicle(g, camp)`, `undock(g, camp)` (send it on its tour now), `recall(g, camp)` (cut the tour short).
- `BurnsCamps.showFull(g, camp, bool)`: force the full camp or its silhouette.
- `BurnsCamps.nightK(g, camp)`.

### Mission events (`g.missions.event`)

| Event | Data | When |
|---|---|---|
| `bcmEnter` / `bcmExit` | `{camp, area}` | Brady enters / leaves the footprint (`area.id === 'camp'`) or a named area. |
| `bcmArrive` | camp | First entry into the footprint this visit. |
| `bcmBoard` | `{camp, car}` | Brady lands on a camp vehicle's deck. |
| `bcmDrive` | `{camp, car}` | Brady takes the wheel. |
| `bcmUndock` / `bcmDock` | `{camp, car}` | The vehicle leaves / parks flush in its dock. |
| `bcmSet` / `bcmSetDone` | `{camp, stage, result}` | A DJ set starts / ends at a camp booth. |
| `bcmBonk` | `{camp, actor}` | A Thunderdome fighter lands a foam-bat hit. |

---

## 3. What the module adds (no engine edits)

- **Real geodesic domes.** Even-frequency icosahedral hemispheres (a flat ring of struts at the base, like real 2V/4V domes): round struts and hubs, fabric panels inset between the struts with a drape gradient, an inner lining (some panels glow like projection mapping), LED rings on the horizontal struts, doorways cut into the frame with portals. Base-ring walls with door gaps make them **enterable**.
- **Camera inside domes.** While Brady is inside a dome (or his tipi), the camera is kept inside the shell, so the fabric never blocks the view.
- **A tiered arcade builder** (the coliseum): curved walls with real arch openings (spandrels and vaults on both faces), piers with engaged half-columns, entablatures with LED strips, walkable galleries with balustrades.
- **Camp vehicles.** A tour is one smooth path from the dock round the playa back into the dock. The autopilot follows it with a speed profile (slow through the camp, cruising on the playa, braking to a stop flush in the dock), crawls when Brady stands in front of it, and carries a DJ and dancers. Brady can **board** it any time (moving platform) and **drive** it (DRIVE prompt). Hop out within ~4.5 m of the dock, roughly lined up, and it eases into the dock; leave it anywhere else and after ~14 s (with Brady away) it drives back to its tour.
- **Night show.** Laser fans (screen-correct beams that stay 3–6 px wide at any range), beat-synced point lights (the engine keeps the 12–16 most relevant), flame bursts on the beat, CO2 blasts on the drop, mirror-ball sparkles inside the domes.
- **LOD.** Each camp builds into its own chunks (48 m cells), so `lod: 'auto'` can swap between the full camp and a silhouette of a few hundred to a few thousand vertices.
- **Bungee fighters** (`bcmBungee` behaviour) and **vehicle riders** (`bcmRider`).

Things to know:
- Like `BurnsBigArt`, the module wraps `g.fx.draw` (per-frame sprites) and `g.updateCamera` (the dome clamp) on the running scene, and appends its ACTION prompts to `g.interactables` (re-adding them if a world replaces the array).
- Camp chunks are hidden for LOD by parking their bounds out of view, never by touching their buffers.
- Signs use the per-world sign atlas (2–4 per camp). Placing every camp in one world fits; the atlas shrinks signs gracefully when it runs low.

---

## 4. The camps

Footprints are camp-local X × Z at scale 1 before rotation (front = local +Z = the street). "Real" is what the research found about the real camp; "Ours" is what the game builds.

### 4.1 `rootSociety`: Root Society (the showpiece, Brady's home)
- **Real.** One of the largest and loudest sound camps. Its public dance space is set by its geodesic domes: a **90 ft main dome** full of intricate lighting and stacks of subwoofers, and a **60 ft dome**. The living side is a communal village of about **27 tipis** around a **30 ft dome** used as the common kitchen and meeting space; the camp sleeps 100+. Per the owner: **three big dome stages**, an **outdoor coliseum stage**, and a **stage art car styled like the coliseum** that docks in front of it to extend the stage, then drives off round the playa.
- **Ours.**
  - **The coliseum** (arc centre (0, −6)): a 210° arcade, inner radius 13.2 m, three tiers (4.6 / 4.0 / 3.6 m) plus an attic, 13.3 m tall. Real arch openings with keystones, engaged half-columns, entablatures with amber / leaf-green / teal LED strips, an LED crown, moving heads on the attic, fire braziers on top. A 1.6 m stage deck, a riser and an LED-fronted booth under our own **root mandala** (an amber ring with wandering glowing roots). Flown line arrays at both ends, sub stacks on the deck front. The tier-2 gallery is walkable (balustrades, spectators) from a ramp on each side; backstage stairs come up through the ground arches at ±37.5°.
  - **The coliseum car** (art car): 12.4 × 4.6 m, deck at 1.6 m like the stage. A little arcade skirt (LED-lit), two corner towers of arches with braziers and line arrays, a booth, a railing on the crowd side, fold-out rear stairs, a driver's console. It **docks flush along the stage front** (centre (0, 1.3), heading +X; its open side meets the stage edge so the deck becomes a thrust stage), waits `dockTime`, drives off through the plaza, tours a loop round the whole camp (~620 m, ~2.5 min), and comes back in to dock. A DJ and two dancers ride it. Boardable, drivable, hop-out-to-dock.
  - **Three dome stages**: 90 ft (r 13.7 m) at (−40, 14), 60 ft (r 9.1) at (40, 14), 50 ft (r 7.6) at (−34, 44), doors facing the plaza. 4V frames with fabric skins (a few lower panels left open), linings with glowing "projection" panels, LED rings, a round riser with an LED edge, an LED-fronted booth, a curved LED screen hugging the back wall, sub stacks, flown arrays from the frame, a mirror ball (sparkles at night).
  - **The lounge** (36, 42): two hypar shade sails, a back drape, couches, poufs, a low table, a chai bar ("CHAI · WATER · HUGS"), lanterns and string lights, three sitters.
  - **The gate** (0, 54): twisted root pillars meeting in an arch with LED nodes and the camp sign; banner poles along the street; a TONIGHT board listing our own DJs.
  - **The tipi village** (centre (0, −54)): 27 tipis (11 on an inner ring, 16 outer), painted bands and dots, poles through the smoke flaps, door flaps facing the common dome, lantern posts. **Brady's tipi** (inner ring, front right) is bigger, enterable (lining, bedroll, lantern, backpack) and signed BRADY'S TIPI (HOME!). The **30 ft common dome** (2V) has two doors, a long table with benches, a kitchen counter and lanterns.
- **Footprint** 112 × 140 m (x −56…56, z −80…60). **Height** 14 m. **Entrance** (0, 58), facing in. **The car's tour needs x −76…76, z −96…66 clear** (`tour: 'short'` stays inside x ±21, z −1…62).
- **Stages** `coliseum` (house, 124), `mainDome` (melodic), `dome60` (techno), `dome50` (breaks), `artCar` (moving).
- **Areas** `coliseum`, `mainDome`, `dome60`, `dome50` (domes), `lounge`, `tipis`, `commonDome`, `bradyTipi`.
- **Spots** `gate, plaza, stage, booth, dock, gallery, galleryRamp, mainDome, mainDomeDoor, dome60, dome60Door, dome50, dome50Door, lounge, village, commonDome, bradyTipi, bradyTipiInside, entrance`.
- **Mission ideas** "Catch the car": board it mid-tour; "Park the coliseum": drive it back into the dock; a set on the moving car (`djSet(g, rs, 'artCar')`); a tour of the three domes; tipi-village side quests from the common dome.

### 4.2 `playground`: Playground
- **Real.** Founded by DJ **Carl Cox**; the camp was first built in 2014. A huge production: a big main stage plus a welcoming lounge to relax in (reported as the "Arrival" stage and the "Dune" lounge). **Name-drop only**: the founder appears as a name on the schedule board ("MIDNIGHT · CARL COX") and in crowd chatter. No likeness, no lines.
- **Ours.** A festival-scale main stage: a 34 × 12 m deck at 2.0 m with side wings and back stairs; a **curved LED wall** (30 × 10.8 m, our own "sunrise rings" art) and two angled portrait screens; a **ground-support box-truss roof** (four towers, a perimeter grid, cross trusses, a dark roof skin with an LED edge, 16 moving heads); two 12-box **line arrays**; a **cardioid sub line** of eight stacks in front; four front fills; four **CO2 jets** (white blasts on the drop at night); a booth on a riser. A **front-of-house tower** in the crowd (walkable deck, mixing desk, steps). An entrance truss arch with the PLAYGROUND sign and the schedule board. **The lounge** (40, 4): three dune-like striped sails on ribs, sand seating mounds with cushions, a curved sand-and-brass bar with an LED kick, lanterns, rugs, three sitters.
- **Footprint** 79 × 70 m (x −27…52, z −30…40). **Height** 17 m. **Entrance** (0, 38).
- **Stages** `main` (techno, 126). **Areas** `main`, `lounge`. **Spots** `stage, booth, floor, foh, gate, schedule, lounge`.

### 4.3 `opulentTemple`: Opulent Temple
- **Real.** Co-founded and led by Syd Gris; first built in 2003 (with a huge open-air steel tension dome); one of the longest-running large sound camps, known for big stage design and legendary guest DJs. A 2009 account describes the DJ booth flanked by **12 ft video screens and 18 ft sound towers**. Wednesday "Sacred Dance" white parties.
- **Ours.** A stepped marble plinth (three tiers, gold edges); a half-ring **colonnade** of ten 10.5 m fluted columns with gold capitals and **fire cauldrons**, a curved entablature with a pink LED frieze and purple drapes swagged between the columns; a golden **lotus-sun portal** (a gold arch with a neon lining, a glowing sun disc ringed by petals) around the decks; **18 ft gold-framed sound towers** and **12 ft LED screens** (our own mandala pattern) either side, as reported; four **flame cannons** on the front edge (big bursts every 16 beats), cauldron flames every 8; a **steel tension crown** over the dance floor (six masts, cables to a lit compression ring, lantern strings, torches), a nod to the 2003 tension dome; two marble obelisks at the entrance with the sign.
- **Footprint** 48 × 59 m. **Height** 15 m. **Entrance** (0, 33). **Stages** `temple` (trance, 128). **Areas** `temple`. **Spots** `stage, booth, floor, gate, crown`.

### 4.4 `campQuestionMark`: Camp Question Mark
- **Real.** A big bass-music sound camp; its co-founders first came to Black Rock City in 1999; it keeps "question books" filled with thoughtful questions. Its signature (per the owner) is a giant glowing question mark.
- **Ours.** A **14 m glowing "?"**: a dark smooth tube body with a glowing face and LED dots along its curve, a big glowing dot, braced on a plinth. A round 1.4 m stage with LED rings under it, a booth with a "?" LED front, two **bass walls** (3×3 subs + tops). **The coffee lounge** (26, 4): a night-blue sail on poles, an espresso bar (chrome machine, cups, LED kick), a chalkboard menu ("WHAT'S YOUR QUESTION?"), couches and a table of **open question books**, lanterns.
- **Footprint** 50 × 43 m. **Height** 15 m. **Entrance** (0, 23). **Stages** `bass` (bass, 140). **Areas** `stage`, `lounge`. **Spots** `question, booth, floor, lounge, books, coffee`.

### 4.5 `disorient`: Disorient
- **Real.** A sound, visual and performance-art collective born in New York; at Burning Man since 2001; its colours are pink and orange. A big art compound with a big dance floor.
- **Ours (no logo).** A **neon portal stage**: six concentric pink/orange rings receding into a tunnel behind the booth, a glowing back disc and a fan of neon rays; striped speaker stacks; a **fabric-walled compound** (pink/orange panels on poles, open at the front); a striped sail over the floor; a **glowing tile floor** in front of the stage; a **neon arch tunnel** entrance with the sign.
- **Footprint** 36 × 45 m. **Height** 15 m. **Entrance** (0, 26). **Stages** `portal` (techno, 128). **Areas** `compound`. **Spots** `portal, booth, floor, tunnel`.

### 4.6 `deepEnd`: The Deep End
- **Real.** An OG large-scale daytime party camp from the early-to-mid 2000s.
- **Ours.** A pool party: a big shade of two hypar sails on six tall poles over a **pool-tile dance floor** (tiles, lane lines, caustics, painted DEEP END / 9 FT / NO RUNNING markers, white coping, chrome ladders); a **lifeguard-tower DJ booth** (2.6 m platform, red sign board, back ladder, buoy, a striped umbrella) with speakers; a **high dive** (5 m platform with a ladder) and a springboard; floats, beach balls, loungers, striped umbrellas; a **snack bar** ("SNACK BAR · H2O").
- **Footprint** 34 × 29 m. **Height** 9 m. **Entrance** (0, 15). **Stages** `tower` (house, 122). **Areas** `pool`. **Spots** `tower, booth, floor, highDive, springboard, snackBar`.

### 4.7 `thunderdome`: Death Guild Thunderdome
- **Real.** Death Guild's Thunderdome, a fixture since the late 1990s: two fighters in bungee harnesses swing at each other with foam bats inside a big climbable dome while spectators climb all over it.
- **Ours.** A rusted-steel **4V lattice dome** (r 10.5 m, no fabric) with an LED base ring, a gate with the sign, an apex ring with bungee anchors and four **fire cannons**. **Three walkable spectator ledges** (1.5 / 3.0 / 4.5 m) hug the outside: hop up them. **Two bungee fighters** (Death Guild crew, foam bats) bounce on their cords, lunge and bonk (star bursts, `bcmBonk`), while spectators on the lattice shout. An MC tower by the gate.
- **Footprint** 26 × 31 m. **Height** 12 m. **Entrance** (0, 15). **Areas** `arena` (dome). **Spots** `arena, apex, gate, mcTower, ledge1, ledge2, ledge3`. **Option** `fighters: false`.

### 4.8 `centerCamp`: Center Camp
- **Real.** Black Rock City's central public gathering place: a huge circular shade structure around an open courtyard, with a café and stages for performances, open to everyone.
- **Ours.** A **ring canopy** (r 13…27 m) of sun-bleached tensile panels (a few terracotta) on 24 short outer poles and 24 tall inner masts, scalloped edges; a central **16 m spire** with banners and bunting to the masts; the round **café counter** (espresso machines, cups, a menu board "COFFEE · CHAI · LEMONADE"); an **open-mic stage** with a slam poet; couches and rugs round the ring.
- **Footprint** 56 × 59 m. **Height** 17 m. **Entrance** (0, 29). **Stages** `openMic` (110). **Areas** `cafe`, `ring`. **Spots** `cafe, openMic, couch, spire`.

### 4.9 `spaceCowboys`: Space Cowboys (OG, 1997+)
- **Real.** A San Francisco party collective that camped at Burning Man before theme camps had a name and took the name with its 1997 camp. Around 2000 it fielded the playa's first big sound vehicle, a converted off-road military truck, born from a collaboration with the Space Lounge camp (the first large-scale sound system on the playa).
- **Ours.** A **space-western saloon**: a false front with stepped top, neon stars, the sign, chrome rocket fins and a radar dish, glowing windows, swinging doors, a **porch stage** with a neon-trimmed roof; a **rocket water tower**; hay bales, a corral, a wagon wheel; and **our own mutant sound truck** (6×6, rounded olive cab, roll-bar lights, a speaker wall facing the crowd behind, a booth, star rails, a rear ladder) that parks by the saloon and tours the camp. (The real truck's make is a brand, so ours is generic.)
- **Footprint** 44 × 44 m. **Height** 12 m. **Entrance** (0, 27). **Stages** `porch` (disco, 125), `truck` (moving). **Areas** `saloon`. **Spots** `porch, booth, floor, waterTower, truckDock`.

### 4.10 `solSystem`: Sol System (OG, 2004 "Sol Henge")
- **Real.** A San Francisco collective whose 2004 camp, fondly known as "Sol Henge", was one of that year's big sound productions.
- **Ours.** A **henge**: ten uplit trilithons (4.4 m) around the dance floor, an inner horseshoe of five taller ones (5.8 m) around the DJ's **altar stone**, a golden **sun disc** with rays on a frame above it, and eight **planets** glowing on tall poles outside (one ringed).
- **Footprint** 38 × 38 m. **Height** 9 m. **Entrance** (0, 17). **Stages** `altar` (melodic, 126). **Areas** `henge`. **Spots** `altar, booth, floor, sun, gate`.

Not built: camps whose names contain a brand or trademark were skipped (none of the ten does). World 11's own venues stay in World 11; these are the canonical versions for the open world.

---

## 5. Placing them in the story worlds and the open world

- **World 17 (Root Society, home).** `BurnsCamps.place(api, g, 'rootSociety', x, z, { onArrive })`. Brady's tipi is `camp.spots.bradyTipi` (door, facing it) and `bradyTipiInside`; his tipi is enterable (an inner lining, a bedroll, a lantern, his backpack) and its area is `bradyTipi`. The common dome (`commonDome`) is the kitchen/meeting space. Side quests can use `onEnter` areas, the `artCar` stage (`djSet(g, rs, 'artCar')` plays on the moving car), and the car events.
- **World 11 (Sound Camp Crawl)** already ships its own local camps; to switch, place `rootSociety`, `opulentTemple`, `campQuestionMark`, `playground`, `disorient`, `deepEnd`, `thunderdome` with `djs: false` (W11 places its own named DJs) and hang its offerings off `camp.spots`.
- **Open world.** Lay the city out with `BurnsCamps.silhouette()` (or `lod: 'auto'` near the player's path). Each camp's `entrance` (+ `onEntrance`) is the door into its sub-world, where it is placed with `lod: 'full'`. `BurnsCamps.info(kind).clear` is the area to keep clear (Root Society's car tour reaches well past its footprint).

---

## 6. Cost (performance)

COST_SECTION

---

## 7. Testing

- Sandbox: `window.BRADY_BURNS.debug.play(98)`; set `scene.tod = 1` for night. Every camp is placed with `djPrompt: true`.
- Scripted tests (Playwright, 874×402 and 402×874, deviceScaleFactor 2, mobile + touch) drive Brady with real inputs: through every dome, tipi and arena door; up onto every stage to its DJ booth; up the coliseum's gallery ramp and backstage stairs; up the Thunderdome's spectator ledges; aboard the docked art car and across onto the stage; DRIVE it, hop out near the dock (it docks flush); a full autopilot tour (undock, tour, dock flush); riding the deck while it drives; the sound truck's tour. A real-time pass uses CDP touch on the on-screen stick, ACTION and EXIT: walk into the 90 ft dome (the camera stays inside), drive the coliseum car, and PLAY A SET at the coliseum booth. All with zero page errors.
