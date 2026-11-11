# WIP C2 "royale": Battle Royale, The Sound Camp, The Man (royale final)

State at stop (Nov 11 2026). Nothing committed. Design: `docs/ART_CART_CAREER.md` §3 and "The Man (royale final)".

## Files
- NEW `src/43_cart_i_royale.js`: the rules (objective `royale`, mode `royale`). It covers damage table (`CART_ROY_DMG`, kind fallback `CART_ROY_KIND`, heals `CART_ROY_HEAL`), HP (120), rams (`cartRoyRam`), knock-out (lights out, a hop, dizzy stars, then POOF and `k.hidden`), spawn protection, closing storm, repair kits, aim assist, the AI (`cartRoyAI`), the HUD (health, alive count, clock, radar, rival bars, off-screen arrows), spectating and quick results, result (`s.royaleResult`, `opts.onResult`), and debug helpers (`debug.royale()`, `debug.hurt(i,n)`, `debug.dmgTable()`).
- NEW `src/43_cart_i_royale_sound.js`: arena `sound` (THE SOUND CAMP, Bass Valentine's royale arena, `levelCar: 'heart'`). It has the heart booth, LED dance floor, 6 giant subs, speaker walls with heart arches, cover and the LED fence. Enemies: pulsing floor tiles (amber warning, then hot pink), sub bass waves, cupid drones with love bombs.
- NEW `src/43_cart_i_royale_the_man.js`: arena `man` and the boss.
  - Phase 1 is a royale. The arena has fire pits and ember vents.
  - Phase 2 starts when the player is the last car. Its attacks are stomp shockwave, fire sweep and ember rain, and after each one he is at a weak point (kneeling, x2 damage). On death he burns and collapses.
  - A stand-in target (`B.px`) is pushed into `s.karts` only while weapons and items look for victims, so every weapon and item hurts him.
  - `opts.phase: 2` starts directly at the boss. RETRY replays from phase 2.
- NEW `tools/cart_royale_test.js` (the test).
- Small hooks in shared files:
  - `src/43_cart_d_sim.js`:
    - mode royale → `isBattle` + objective `royale`
    - `this.ofx` (the objective's fx)
    - `this.onRam` in `collideKarts`
    - `onBattleHit(k, src, kind, o)` → `ofx.onHit`
    - `ofx.aiGoal` fallback in `aiArena`
    - `ofx.finish` in `finishRace`; no mastery for royale
    - out cars with `k.hidden` don't smoke
  - `src/43_cart_e_scene.js`:
    - `this.camKart` (spectate) in `updateCamera`
    - `k.hidden` skipped in `renderScene`
    - `ofx.render` / `rules.render` render hook
    - `ofx.draw` in `pushSprites`
    - `ofx.hud` in `drawBattleHUD`

## DONE and verified (numbers from tools/cart_royale_test.js and probes; build dirs in the scratchpad)
- **AI-only full matches finish with no page errors.** 3 seeds each, at HP 100 before the last tuning:
  - Sound Camp: avg 166 s, first KO avg 30 s, autopilot player survives avg 159 s.
  - The Man phase 1: avg 153 s. One seed reached the boss.
  - Playa stand-in: 142 s, first KO 21.8 s.
  - Every knocked-out car has logged damage sources.
- **Damage:** every signature weapon, gift-box item and car special takes HP off a rival.
  - The exceptions were bombs, ducks and breach (test placement or no hit()), and water, glow and shield. All six are FIXED in code but NOT re-verified:
    - water now heals via a `useItem` wrapper
    - ducks sting through the `s.log('duck')` intercept
    - glow: the ram bug fixed (`s.onRam` was called with the wrong `this`)
    - bombs, breach and shield: test placement fixed
  - Driver specials and arena powers are reported, not asserted.
- **Boss:** every weapon and every attacking item hurts the Man. Slime (trail at his plinth) and warp (trap) were added after the run and are not re-verified.
  - The scripted autopilot fight defeated him: result `bossDefeated: true`, `stageWon: true`.
  - That was at 650 HP, which took 326 s. HP is now 480 and attacks are harsher, not re-measured.
  - The lost-fight path puts THE MAN on top of the results and sets `stageWon: false`.
- **Render:** peak 63 draws / 351k tris (Sound Camp overview) in 24 views. Budget is 120 / 420k.
- **Screenshots** are in `<scratchpad>/shots-c2/`. Seen and looked fine: Sound Camp floor, arches, HUD fight, the Man arena, boss weak point and collapse. Many boss / cupid / KO shots were badly staged; the staging in the test is now fixed but not re-run.

## HALF-DONE / not re-verified
- Last tuning: HP 120, torch 22, Man HP 480, more embers. A full `node tools/cart_royale_test.js <out> all 3` run was killed at the stop. Rerun it first.
- The sub mesh: its glowing side panels were replaced by edge strips. Not re-shot.
- The knock-out stars and POOF flash (`cartRoyDraw`) are not seen in a shot yet.
- Portrait 390x844 screenshots: the second page load timed out on the overloaded machine. Not seen.

## NOT STARTED / known gaps
- No dedicated sounds; existing sound ids are used.
- The old battle menu (`f_menu`, C1's) lists `sound` and `man` because they are in `CART_ARENAS` with `royale: true`. **C1 should filter `a.royale`** out of the battle/secret-level grids.
- Boss difficulty for a human is unmeasured. The autopilot hops perfectly and took only 8–12 HP/min from the Man. Real players will take more; tune after Brady plays.
- `Input.taps` for "tap to skip" spectating has not been checked on a real phone.

## Interfaces (for C1 / others)
- Start: `debug.start({ mode: 'royale', arena: 'sound' | 'man' | <any arena> })`. Use `phase: 2` for the boss directly.
- Registries: `CART_ROYALE_ARENAS.heart = 'sound'`, `CART_ROYALE_ARENAS.man = 'man'`, `CART_STAGE_MODES.royale = true` (all assigned, never redeclared).
- Arenas in `CART_ARENAS` carry `royale: true`; sound also carries `levelCar: 'heart'` (its `poolCar`, so HEART THROB is in everyone's gift boxes), and man carries `final: true`.
- Result: `s.royaleResult = { arena, places, cars, playerPlace, won, top3, bossDefeated, boss, time, kos, quick }`; `opts.onResult(result, s)` fires when the results show. The man final sets `s.stageWon = bossDefeated`.
- Arena hooks:
  - `E.royale = { R, ends, repairs, route(), avoid, storm }`
  - rules: `royaleWon(s)`, `bossHit(s, src, kind, o)`, `royaleHud`, `radar`, `finishResults`, `royaleFinal`, `render`

## How to run
```
export NODE_PATH=/Users/bradymott/brady-o/node_modules
BRADY_DIST=<dir> node tools/build.js
BRADY_DIST=<dir> node tools/cart_royale_test.js <outDir> [all|match|damage|boss|shots] [seeds=3]
```
The test waits up to 15 min for the page when the machine is loaded.

## Next steps for a fresh agent
1. Build, then run `cart_royale_test.js <out> all 3`. Fix any FAIL. Likely candidates:
   - avg first KO ≥ 20 s on the stand-in
   - boss fight ≤ 300 s at 480 HP
   - the six re-fixed damage cases
2. Look at every PNG in `<out>`, landscape and portrait. Check:
   - the KO stars and poof, the cupid reticle
   - the floor warn/hot top-down shots, the subs after the panel fix
   - the boss stomp, sweep and embers with the Man in view
3. Run `tools/cart_battle_test.js` (it now also runs objective `royale` in sound/man), `cart_item_test.js` and `apps_test.js`.
4. Ask C1 to filter `royale` arenas from the battle menu, and to wire `opts.onResult` / `stageWon` into the run screens.
5. Balance once Brady plays:
   - match length target 3–4 min (currently ~2.5–3 at HP 100; HP 120 should add ~20%)
   - boss threat vs a human
