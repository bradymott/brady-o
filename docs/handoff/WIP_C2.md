# WIP C2 "royale": Battle Royale, The Sound Camp, The Man (royale final)

State: Nov 19 2026, after the origin/main merge. Not committed (the organizer commits). Design: `docs/ART_CART_CAREER.md` §3 and "The Man (royale final)". How to build a new royale arena: `docs/ART_CART_LEVEL_RECIPE.md`, section "Royale arena".

## Files
- `src/43_cart_i_royale.js`: the rules (objective and mode `royale`).
  - Damage: `CART_ROY_DMG`, with the kind fallback `CART_ROY_KIND` and heals `CART_ROY_HEAL`. HP is 120.
  - Rams, knock-out (lights out, hop, dizzy stars, POOF), spawn protection, storm, repair kits, aim assist.
  - AI (`cartRoyAI`), HUD (health, alive count, clock, radar, rival bars, off-screen arrows), spectating, results.
  - Debug helpers: `debug.royale()`, `debug.hurt(i, n)`, `debug.dmgTable()`.
- `src/43_cart_i_royale_sound.js`: THE SOUND CAMP (arena `sound`, `levelCar: 'heart'`). Hazards: pulsing LED floor tiles, 6 sub bass waves, 4 cupid drones with love bombs.
- `src/43_cart_i_royale_the_man.js`: arena `man`.
  - Phase 1 is a royale with fire pits and ember vents.
  - Phase 2 is the boss: stomp shockwave, fire sweep and ember rain, each followed by a kneeling weak point (x2 damage). Then death and collapse, or a loss.
  - `opts.phase: 2` starts at the boss.
  - The arena loads without crashing in any mode; outside royale only its hazards run.
- `tools/cart_royale_test.js`, parts `all | match | damage | boss | human | shots`.
  - `SHOTS=<regex>` retakes a subset of screenshots.
  - The page's own loop is frozen during each capture, so the shots show the staged moment.
- Shared-file hooks (small): `d_sim` and `e_scene`, as listed in the previous WIP. New this round, in `e_scene`'s results row: a narrow (portrait) panel shows the car name only, so it does not overlap the score.

## Done this round, VERIFIED (`tools/cart_royale_test.js`, dist in the scratchpad `dist-C2`)
- **Full run `all 3`: exit 0, no page errors.** Every number below is AI-only, with an autopilot player.

  | Arena | Avg match | Avg first KO | Avg autopilot survival |
  |---|---|---|---|
  | Sound Camp | 176 s | 40.0 s | 85 s |
  | The Man, phase 1 | 165 s | 49.7 s | 125 s |
  | Playa stand-in | 223 s | 29.8 s | 118 s |

- **Damage: every weapon, item and car special does damage.** The fixes this round:
  - ducks and breach: test placement (ducks: a rival drives through a landed duck; breach: a rival under the landing);
  - water heals, glow rams hurt, the shield blocks.
- **Driver specials (decided): small but real damage**, numbers in `CART_ROY_DMG`.
  - Through `hit()` with kind `'drv'`: AIR HORN 8, LIGHTS OUT 8, RAVE TRAIN (afterparty) 10.
  - Through `hit()` with cartoon kinds: BONKED (bungee) 14, ROAD WORK 12, HOLD MY WATER 14 (including its backfire on yourself).
  - Logged-only tags (a `'hit'` log with kind `'drv'` and no `hit()`; damaged through the `s.log` intercept, 0.8 s cooldown per car): LECTURE 6, 5 MPH 5, PART THE TRAFFIC 6.
  - CAN I BORROW THAT? does no damage (it steals).
  - The test asserts damage for airhorn, lightsout and afterparty. Measured on 5–7 placed rivals: airhorn 48, lightsout 40, afterparty 50, lecture 42, fivemph 20, parting 30.
- **Own hits don't hurt:** `src === k` does no royale damage (your own mines, slime, splash). Only the cartoon effect applies.
- **Boss:**
  - Every weapon and attacking item hurts the Man, slime and warp included.
  - Mines and slime count "at his feet" within plinth + 4.6 m.
  - Scripted fight (kept alive): defeated in 238 s. The unassisted perfect autopilot won in 286 s.
  - A lost fight puts THE MAN on top and sets `stageWon: false`.
- **Boss vs a human-like autopilot (new, `pgBossHuman`):**
  - The bot is imperfect. Per threat it misses the hop outright 18% of the time; otherwise it hops with a timing error of −0.12 to +0.22 s.
  - It fires 0.25–1.4 s late, wastes 25% of its shots and items, and fetches a repair kit under 45 HP. It gets a gift every 13 s.
  - **Result: 14/16 wins (88%).** Winning fights take 93–282 s (average 160 s); the 2 losses came at 100 s and 189 s.
  - The test asserts a win rate of 55–92% and an average winning fight of 100–260 s.
- **Boss autopilot fixes:**
  - The orbit radius now suits the weapon (rings and dashes close in, droppers and side guns skim the plinth).
  - Forward weapons turn in toward the Man when ready. Before this, short-range cars stalemated for 10 minutes.
  - **Repair kits now work during the boss fight** (they were drawn there but could not be picked up).
- **Render:** 46 views, landscape and portrait. Peak 65 draws / 326k tris; budget 120 / 420k. One earlier capture read 410k (a frame later in the fight).
- **Screens, one quick pass (landscape + portrait):** HUD, radar, rival bars, KO stars, cupid reticle, boss telegraphs, weak point (kneeling, white bar) and results are all readable.
  - Fixed: the portrait boss bar now sits under the health panel, left of the radar (it covered the Man's chest).
  - Fixed: the portrait results rows overlapped.
- `tools/cart_battle_test.js`: ok.

## Weak / not done
- In landscape the chase camera cuts off the Man's upper body when you are close, and the boss bar sits over his head. Readable, not pretty.
- While spectating, the drive buttons are still drawn.
- The spectate camera can sit inside a pile of cars.
- No dedicated sounds for the royale.
- The human-like bot steers perfectly. Real first-time players will likely do worse than 88%; re-tune after Brady plays. The levers are `CART_MAN.hp` (480), the stomp damage (20) and the attack timings in `cartManNext`.
- `Input.taps` (tap to skip spectating) is unchecked on a real phone.

## For C1 / organizer
- Filter `a.royale` arenas out of the old battle and secret menus (already requested from C1).
- Wire `opts.onResult` / `s.royaleResult` / `s.stageWon` into the run screens.

## How to run
```
export NODE_PATH=/Users/bradymott/brady-o/node_modules
BRADY_DIST=<dir> node tools/build.js
BRADY_DIST=<dir> node tools/cart_royale_test.js <outDir> [all|match|damage|boss|human|shots] [seeds=3]
```
