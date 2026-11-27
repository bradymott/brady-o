# Brief: build one HIDDEN land for Super Brady-O World (the road to 200)

You are building ONE new hidden land (five or six stages, the last one its boss) for a 2D platformer web game, Super Brady-O World. Three other agents are building three other lands at the same time, each in its own git worktree. You know nothing else about this project: read what this brief points to before writing code.

## Who it is for
Brady owns the game, plays it on an iPhone and is not a programmer. The game has 132 hand-made levels in 22 lands; he asked for 200. His words: "secret worlds that you can only access by finding hard to find things", "make a few that are really hard to find", climbing "on the cages, up and down and around the enemies", "every secret room different", "you don't always exit out the entry door", "I like puzzles". He cares most about polish, variety and fun.

## Read first (in your worktree)
1. `docs/design/CHATGPT_RELAY.md`: section A, YOUR land only (pitch, look, stages, boss, critters, hidden entrance); section B (the mini-game rooms assigned to you, below); section D (the tone of Chinka-O's notes); section F (play shorthand, phone-scale drawing, the extra room for a sixth stage, "two details to settle by feel").
2. `docs/design/chatgpt_lands/SHEET_KEY.md` and `README.md`, then OPEN your land's three pictures with the Read tool: `docs/design/chatgpt_lands/<your folder>/cast.jpg`, `building-blocks.jpg`, `entrance.jpg`. They are reference for names, shapes and colours only: redraw everything in the game's own code-drawn style. Brady, Chinka-O, Pupo and Piwi are the game's own models, never the sheet's.
3. `docs/design/TOOLKIT_STATUS.md`: what the level engine offers and how to write a level.
4. `docs/handoff/LAND_BUILDER_BRIEF.md` and `docs/design/ENCORE_TOUR.md` sections 3, 5, 6: the method, the fairness rules and "the rules that always hold" from the last five lands. They apply to you, except where this brief differs.
5. `docs/handoff/SECRET_ROOMS_BRIEF.md` and `docs/design/SECRET_ROOMS.md`: what a good secret room is here.
6. Working examples to copy the structure from. A hidden bonus land: `src/29_tour_eye.js` + `src/29_tour_eye_levels.js`, `src/29_tour_lost*.js` (`Tour.addStop`, `secret: true, bonus: true`), tests `tools/boss_tests/eye.js`, `tools/sbw_eye_shots.js`. A land with invented mechanics, a multi-phase boss and distinct mini-game rooms: `src/29_tour_moon*.js`, `src/29_tour_it*.js`, `src/29_tour_is*.js`, `tools/sbw_moon_shots.js`. A door from an existing level into a secret land: the exit `to: 'land:<cc>'` (grep `land:` in `src/28_tour_a_core.js`; Morocco's Door 22 in `src/29_tour_ma_levels.js`).

## The twelve lands (yours is named in your task message)
| A | cc | world | Land | Host land of the entrance | Stages | Secret rooms |
|---|---|---|---|---|---|---|
| A1 | `wash` | 26 | Wrong Side of the Wash | France (7) | 6 | B1-B5, then Sock Divorce |
| A2 | `post` | 27 | Postmark Sound | Vietnam (10) | 6 | B6-B10, Peel Here |
| A3 | `orch` | 28 | The Orchard After Closing | Japan (11) | 6 | B11-B15, One Loose Pip |
| A4 | `foley` | 29 | Foley Beach | Brazil (3) | 6 | B16-B20, Rain for One |
| A5 | `gal` | 30 | The Unflattering Gallery | Italy (14) | 6 | B21-B25, Eyes Front |
| A6 | `umb` | 31 | The Umbrella Repair District | Amsterdam (8) | 6 | B26-B30, Missing Rib |
| A7 | `pst` | 32 | Pupo Standard Time | Nepal (12) | 6 | B31-B35, A Little Privacy |
| A8 | `seats` | 33 | Below the Cheap Seats | Festival Fields (23) | 6 | B36-B40, Curtain Call Sheet |
| A9 | `salt` | 34 | The Table Salt Sea | Morocco (5) | 5 | B41-B45 |
| A10 | `shad` | 35 | The Department of Unclaimed Shadows | The Moon (18) | 5 | B46-B50 |
| A11 | `table` | 36 | Table for Two | Spain (6) | 5 | B51-B55 |
| A12 | `bone` | 37 | The Spare Bone Quarry | Ecuador (2) | 5 | B56-B60 |

Level ids are `<world>-1` up to `<world>-6` (or `-5`). The LAST stage is the boss stage (`arch: 'lair'`): a short lead-in that uses the stage idea ChatGPT names for it, then the boss arena. Every other stage is a new `arch` with a name used nowhere else in the game (check with grep), registered in `TourLandscape.ARCH_LABEL`.

## What each stage is
- ChatGPT's line for each stage is the design: one new kind of play per stage, taught where failing costs nothing, tested, then the "late on / the last one" twist as the stage's hardest moment. You design the detail and may change what does not turn out fun, keeping the idea.
- **Controls are a stick, JUMP and RUN/THROW, nothing else.** Simplify anything that needs more (hold-and-peel, record-and-trim, two precise inputs at once). A prop takes the THROW button only while Brady is visibly touching it or standing on its mark. A mini-game or mounted prop: stick aims or selects, JUMP confirms or hops, THROW plays the prop.
- A stage is a real level of about the length of the Encore levels (look at 14-x to 18-x), not a single room: the idea is repeated, varied and combined with the land's critters and ordinary platforming, with three postcards, at least two power-up chances and checkpoints about every 45 to 55 tiles.
- **Difficulty:** about Nepal's level: `d0: 0.8` on your stop. Fair for a thumb: every danger has a tell of at least 0.5 s, no blind jumps, jumps at most 85 % of Brady's reach, generous timing windows. The last ordinary stage and the boss are the hardest. **If your own scripted player needs retries to pass something, it is too tight: widen it.**
- Climbing stages (nets, trellises, scaffolds, ribs, lashes, rib rungs): Brady asked for these by name. Push into the surface to grip, steer in all four directions, enemies share the surface and must be climbed around; JUMP at a marked hole or collar crosses to the other face, JUMP elsewhere lets go. Draw the far face clearly different (ChatGPT's section F notes say how).

## The boss
Three phases as written, each with its tell, each beaten by the land's own trick rather than by stomping alone. Its own arena. `tools/boss_tests/<cc>.js` passes under `node tools/boss_test.js <cc>`. It must be beatable by an ordinary thumb: your boss test player wins without retries.

## One secret room per stage, all different
- Each stage has ONE secret room holding the mini-game the table assigns it, in order (first stage = first B number; a sixth stage gets the extra room from section F; "every finale room can be entered before the boss"). Re-skin each to your land (the "land" ChatGPT names beside each game in B is only where the idea came from).
- A room is a 10 to 25 second game with a rule that reads in two seconds, shown in motion as Brady enters; a miss resets that turn and costs nothing. Prize scales with the challenge. The prize cage opens at the moment the room is won (see `src/29_tour_zz_lamps.js`).
- **A room's game must fit ONE 844x390 landscape view, in the middle band: clear of the top bar, the stick (bottom-left) and the buttons (bottom-right).** Every room is its own place with its own backdrop: no two rooms in the land look alike. No overlapping toasts, titles or counters: title first, then the rule, the clock and counters in one fixed spot.
- At least half of the rooms let Brady out somewhere other than where he came in (a chute further along, a ledge with a bonus). No exit skips a checkpoint's worth of level without the player choosing it.
- Hide each room fairly: found by curiosity (a ceiling gap into a run above the level, a floor to drop through, a wall to walk into, a spot only the stage's mechanic reaches), with ONE subtle tell that is the same idea across your land. No door with a sign.

## The hidden entrance to your land (the best secret you build)
- Your land is a bonus land: `Tour.addStop({ id: '<cc>', world: <world>, name, sub: 'a hidden land', lon, lat, secret: true, bonus: true, d0: 0.8, pin })`. It must not appear on the route map, the album or anywhere else until its entrance has been used. Put its pin near the host land, clear of other pins.
- The entrance goes in ONE existing level of the host land, as an extra exit `to: 'land:<cc>'`, with the scenic prop and the ONE clue `SHEET_KEY.md` describes, entered the way it says (simplify the input if it needs more than stick + two buttons; waiting, crouching, walking behind, jumping up through an underside are all fine). Keep the clue at the scale of the props around it. **Never signposted:** no sign, no arrow, no coin trail, no hint text on the level card. But fair: the clue is visibly "wrong" to a player who looks, and it sits beside a route a curious player passes (not in a dead corner nobody visits, not on the forced path where it would be tripped over by accident).
- Choose the host level yourself (a main level of the host land that suits the prop; read the host land's levels file) and say which in your report. **Do not edit the host land's files.** Add the entrance from your own file by wrapping/amending the host level (your files load after every land's). The host level must still pass the level checker, its existing exits, postcards and totals must be unchanged, and nothing in an existing save may break: the save key stays `super-brady-o-world-save-v5`.
- Using the entrance plays a short arrival (a few seconds: Brady slips through, the land's name appears), opens the land, and from then on the land is on the route map and its first stage can be entered from there too.
- Your shots tool must find and use the entrance with real inputs, and screenshot the host spot BEFORE (clue visible, at game scale) and the arrival.

## Also yours
- At least four critters as named on your cast sheet, each with the behaviour-joke ChatGPT gives it, code-drawn, inked, readable on a phone; your themes, layered parallax backdrops, tiles, props; the land's walkable map (`TOUR_OW_MAPS.<cc>`), route-map pin, music.
- **Prize box:** your land's box (full, hit, empty) as on `building-blocks.jpg`, added to `src/29_tour_zz_boxes.js` in one commented block for your land (see how `eye` and `lost` are done there).
- **Care package note:** one note from Chinka-O for finishing your land's postcards, in the voice of section D (warm, specific, a small domestic joke; she is his wife), added to `NOTES` in `src/29_tour_zz_postcards.js` in one line. Arrival postcard text in the same voice.
- **Never:** real-looking people (any portrait or bust is of Piwi Squirmin', the ventriloquist dummy, or an animal or object); sacred buildings, far-off towers or spires, strings of coloured flags (plain shapes or left out); brand names; anything resembling another company's game. She is **Chinka-O**. Do not rename anyone.

## Your files
- Yours to create: `src/29_tour_y_<cc>.js`, `src/29_tour_y_<cc>_levels.js` and more `src/29_tour_y_<cc>_*.js` as needed (the `y_` makes them load after every existing land and before the `zz_` glue), `tools/boss_tests/<cc>.js`, `tools/sbw_<cc>_shots.js`.
- Shared files, ONE clearly commented block for your land in each, as few lines as possible (three other branches edit the same files; they are merged by keeping both sides): `src/28_tour_sc_hats.js` (`TourHats.HEADS` / `TourHats.NOT`), `tools/sbw_hits_test.js`, `tools/sbw_rooms_test.js`, `src/29_tour_zz_boxes.js`, `src/29_tour_zz_postcards.js`. If another shared test has a hard-coded list or total that blocks you, make the smallest additive edit and report it.
- Never edit: `src/40`-`src/43`, `src/28_tour_b_build.js`, any other land's `src/29_tour_*` files, the save key. If the toolkit lacks something, add it by wrapping from your own file.
- All files are joined in name order into one script. A file that fails `node --check` breaks the whole game: check before you build.

## The machine
- A Linux cloud container, 4 CPU cores shared by four builders. Chromium only (no WebKit, no real phone): everything is code-drawn on canvas in the flat "Fiesta Toon" look with the dark ink outline.
- Your worktree is `/home/user/wt/<cc>` on branch `hidden/<cc>`. Build privately: `BRADY_DIST=/home/user/wt/dist-<cc> node tools/build.js` (about 5 s; first copy `icons/` and `icon.b64` from `/home/user/wt/dist-main/` into it). Run every tool with the same `BRADY_DIST`.
- `require('playwright')` works from any folder; `chromium.launch()` needs no options. **Never run `npm install`, never install Playwright or browsers** (a local `node_modules` breaks the browser).
- **Browser tools run one at a time across all builders.** Before any tool that opens a browser: `mkdir /home/user/wt/test.lock` (retry with a short wait until it succeeds), and `rmdir /home/user/wt/test.lock` straight after, also when the tool fails. Hold it for one tool run, a few minutes at most. A lock older than 20 minutes is stale: remove it. Node-only tools (`validate_levels`, `dump_level`, `sbw_toolkit_test`, `sbw_hats_test`, `sbw_hits_test`, `save_test`) need no lock.
- The level checker over the whole game takes about 25 minutes here: check only your own levels and your host level (`node tools/validate_levels.js <ids> --jobs 2`). `node tools/dump_level.js <id>` prints a level as ASCII with the reachable spots. Never tell the checker something the player cannot really do: your shots tool plays that same stretch in the real game.
- New browser tools call `silence(context)` from `tools/sbw_silent.js` before `page.goto`.
- Commit early and often on your branch (the container can be reclaimed; uncommitted work is lost). Each message ends with the two lines your task message gives. **Do not push, do not merge, do not touch other worktrees, do not start sub-agents.**

## Work order
One stage at a time: write it, validate it, play it in the browser, LOOK at the screenshots with the Read tool, fix, commit. Get the land's skeleton and stage 1 working end to end first, then the hidden entrance (it proves the unlock), then the other stages, the boss, the rooms, the extras. If your context is running low, stop at a committed, passing state and say exactly what is left.

## Done means
1. Every stage as above; the checker proves each finishable with all three postcards, every room, every exit; pace and power-up budget pass.
2. `tools/sbw_<cc>_shots.js <outdir> [--checks]` plays each stage's mechanic, each room (won once, failed once, each exit used), the entrance and the boss with real inputs, and saves 844x390 landscape screenshots of every stage, every room on entry, the entrance before and after, the boss, the map, plus 390x844 portrait of the first stage, the boss and the map, and a panorama of each stage. You have opened them and fixed what reads badly: game under the stick or buttons or top bar, overlapping text, enemies or Brady lost against the backdrop, two rooms that look alike.
3. These pass with your build: `validate_levels` on your ids and the host level, `boss_test <cc>`, your shots `--checks`, `sbw_hats_test`, `sbw_hits_test`, `sbw_toolkit_test`, `save_test`, `apps_test`, `sbw_overworld_test`, `sbw_rooms_test` (your rooms), `sbw_soak_test --jobs 1 --levels <your ids and the host level>`, `gameplay_test <dir>`. Zero page errors. If one of these counts lands or levels and needs telling about a new bonus land, make the smallest additive edit and report it.

## Learned from the first land reviewed (the organiser sends work back for these)
- Rooms must not share one shell: each room has its own floor and wall material and its own arrangement of door, game, cage and prize, not only a different back wall.
- Every floating line of text (boss lines, call-outs, hints) sits on a dark rounded pill, clear of the boss, Brady, the HUD, the stick and the buttons. Never pale text over the sky or over a character.
- The boss arena has a real layered backdrop of the land, duller than the boss and Brady. Anything the player must touch is big and pulses.
- Your shots tool has a `bot` mode (see `tools/sbw_moon_shots.js bot`) that plays each stage start to finish with enemies ON and invulnerability OFF, and the boss with damage on. Report deaths per stage; widen anything that kills the bot twice in one spot.
- Give helper scripts in any shared folder your own land's name.
- `tools/sbw_toolkit_test.js` (bonus land: up to 6 main levels) and `tools/sbw_boxes_shots.js` (land count `>= 22`) may need the same one-line edits the first builder made.

## Your report (your final message; it goes to the organising agent, not to Brady)
- Per stage: id, name, arch, one line on how it plays and what makes it hard; its secret room (how found, the tell, the game, the prize, where the exit leads).
- The boss: phases and how each is beaten.
- The hidden entrance: host level, exactly where, the clue, how it is entered.
- What differs from ChatGPT's text and why.
- Every edit outside your own files (file, lines, why).
- Exact test results (command and its last line), anything failing or skipped, plainly.
- Absolute paths of the most telling screenshots (entrance before/after, each stage, each room, boss), one line of honest verdict each.
- What is not done, known rough edges.
- Your branch's last commit hash.
