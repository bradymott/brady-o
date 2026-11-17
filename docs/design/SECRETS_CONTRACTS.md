# Secrets, warps and switches: the contracts (WP-1)

This is the exact API that WP-2 to WP-6 of `docs/design/SECRETS_WARPS_SWITCHES.md` code against. WP-1 (branch `sbw/secrets-wp1`) landed it together with the only edits to shared engine files. **Nobody else edits `src/09_validate.js`, `src/11_player.js`, `src/12_play.js`, `src/13_ui.js`, `src/28_tour_bb_gens.js`, `src/28_tour_j_stamps.js` or `tools/validate_levels.js`.** If you need a hook that isn't here, ask for it (`docs/handoff/REQUESTS.md`) instead of adding it.

With nothing registered, the game is unchanged: all 88 levels build byte-identical, and the validator explores exactly the same nodes with the same results.

Every contract below is exercised by `node tools/sbw_contract_test.js` (node only, about 10 s). If you change how you use a contract, run it.

**Contents**
1. [Where things live](#1-where-things-live)
2. [TourHooks: the hook lists](#2-tourhooks-the-hook-lists)
3. [Seams (WP-3)](#3-seams-wp-3)
4. [Exit kinds and warps (WP-3, WP-2)](#4-exit-kinds-and-warps-wp-3-wp-2)
5. [Needs and the rules (WP-5, WP-2)](#5-needs-and-the-rules-wp-5-wp-2)
6. [Room types (WP-4)](#6-room-types-wp-4)
7. [Buttons (WP-5)](#7-buttons-wp-5)
8. [Locks: needsAll, needs and the treasure X (WP-4)](#8-locks-needsall-needs-and-the-treasure-x-wp-4)
9. [The validator and validate_levels](#9-the-validator-and-validate_levels)
10. [Changes to the plan, and what downstream packages now do differently](#10-changes-to-the-plan-and-what-downstream-packages-now-do-differently)

---

## 1. Where things live

| Thing | File | Used by |
|---|---|---|
| `TourHooks`, `TourNeeds`, `TourSeams` | new `src/28_tour_a2_hooks.js` (sorts before `28_tour_a_core.js`; defines objects only, touches nothing at load) | everyone |
| hook call sites | `src/11_player.js`, `src/12_play.js`, `src/13_ui.js` | — |
| seams, room types, `zone`, `needs`, `paceTo`, `level.buttons` in the builder | `src/28_tour_bb_gens.js` (`generateV2`, `tourSecretsArea`, `tourSpecSeams`, `tourMirrorArea`) | WP-3, WP-4, WP-6 |
| stamp legend `seam`, `xmark`, lock `{ needsAll, needs }` | `src/28_tour_j_stamps.js` | WP-3, WP-4, WP-6 |
| seams, warps, buttons, `needs`, `needsAll`, per-area pace, `escape`, `secretRules` | `src/09_validate.js` | everyone (through validate_levels) |
| per-level and `--rules` checks | `tools/validate_levels.js` (also exports `checkLevel`, `secretChecks`, `secretRules`, `secretsInfo`) | everyone |
| the contract test | `tools/sbw_contract_test.js` | everyone |

The three objects are also on `window.BRADY_TOUR` (added at the end of `28_tour_j_stamps.js`) for browser tests. In node tests use `G.run('TourHooks')`.

---

## 2. TourHooks: the hook lists

Register with `TourHooks.on(name, fn)` (it returns `fn`) and remove with `TourHooks.off(name, fn)`. Do this at the top level of your own file; it runs at load and calls nothing.

- `TourHooks.run(name, ...args)` calls the handlers in order and returns the first truthy result (or `null`).
- `TourHooks.each(name, ...args)` calls every handler and ignores the results.
- A handler that throws is skipped and logged once with `console.error`. It is also counted in `window.__sbwErrors`, so the soak and gameplay tests fail on it. It never stops a frame.
- Every engine call site checks `typeof TourHooks !== 'undefined'` and the list's length, so an empty list costs nothing.

| Hook | Signature | Called from | Used by |
|---|---|---|---|
| `offEdge` | `(play, player, side, seam) -> true` if you took Brady through | `Player.update`, just before the pit-death line. One call covers all four edges (§3) | WP-3 |
| `playerDie` | `(play, player, reason) -> true` cancels this death | the start of `Player.die` | WP-4 (the hourglass's soft catch), anything else that must not kill |
| `playUpdate` | `(play, dt)` | `Play.update`, every frame after Brady moved and collided (whatever the state) | WP-3, WP-4, WP-5: per-frame logic that must not depend on an entity being awake (plan §7.11) |
| `areaLoaded` | `(play, area)` | the end of every `Play.loadArea` (the first area too) | WP-4: arm room clocks and re-base timers (§6) |
| `camera` | `(play, dt)` | the end of `Play.updateCamera`; may set `play.camX` / `play.camY` | WP-4: the treasure-map peek |
| `entityDraw` | `(play, ctx, e) -> true` if you drew `e` yourself | `Play.draw`, for every visible entity in the four layers (not Brady). `ctx` is saved before and restored after | WP-5: hats and dancing |
| `afterEntities` | `(play, ctx, layers)` | `Play.draw`, after the entity layers and Brady, in world coordinates. `layers` holds the four draw lists | WP-5, WP-3: overlays |
| `levelClear` | `(play, gate)` | `Play.levelClear`, right after the progress is recorded | WP-3: a warp's transit |
| `resultsTitle` | `(play) -> string` | `Play.drawResults` (by way of `TourHooks.titleFor`) | anyone. The exit kind's `title` covers warps (§4) |
| `pausePages` | `(play) -> { label, fn, size? }` or null | `buildPauseUI`: one full-width row each, at the bottom. The menu moves up 27 px per row so it still fits a 390 px landscape phone | WP-5: its rules page |
| `settings` | `(scene) -> { label, value, fn }` or null | `SettingsScene.build`: one row each, after MOTION EFFECTS. A tap runs `fn`, then the scene rebuilds | WP-5: the hats-and-dancing switch |
| `owDraw`, `owTap`, `routeDraw` | defined by WP-2 | the lists exist. **The call sites are WP-2's** (`28_tour_fd_overworld.js`, `28_tour_f_map.js`) | WP-2, WP-5 |
| `peek` | a function slot, not a list: `TourHooks.peek = (play, x, y, secs) => ...` | nothing in the engine calls it. WP-4 fills it, building it on the `camera` hook | WP-4 |

Examples:

```js
// WP-3: the seam swap (Play.prototype.seamTo is yours, in 28_tour_k_backstage.js)
TourHooks.on('offEdge', (play, p, side, seam) => { play.seamTo(seam, side); return true; });

// WP-4: an hourglass catch is one hit and a respawn, never a death
TourHooks.on('playerDie', (play, p, reason) => {
  if (play.area.roomType !== 'hourglass' || reason !== 'lava') return false;
  p.hurt({ x: p.x, w: p.w }); const a = play.area.anchors.in; p.x = a.x - p.w / 2; p.y = a.y - p.h; p.vx = p.vy = 0;
  return true;
});

// WP-5: dancing (a cosmetic squash on the beat; hitboxes untouched)
TourHooks.on('entityDraw', (play, ctx, e) => {
  if (!TourRules.fxOn() || !(e.enemy || e.friendly)) return false;
  const k = 1 + 0.06 * Math.sin(play.t * 8), fx = e.x + e.w / 2, fy = e.y + e.h;
  ctx.translate(fx, fy); ctx.scale(1 / k, k); ctx.translate(-fx, -fy);
  e.draw(ctx, play.t); return true;
});

// WP-5: the pause row and the setting
TourHooks.on('pausePages', play => play.level.tour ? { label: 'BUTTONS', fn: () => TourRules.openPage(play) } : null);
TourHooks.on('settings', () => ({ label: 'ANIMAL FX', value: Save.data.settings.ruleFx === false ? 'HIDE' : 'SHOW',
  fn: () => { Save.data.settings.ruleFx = Save.data.settings.ruleFx === false; } }));
```

---

## 3. Seams (WP-3)

**Built area field.** `area.seams = [{ side, a, b, toRef, target: { area, x, y }, needs?, tell? }]`.
- `side` is `'top' | 'bottom' | 'left' | 'right'`.
- `a..b` is the tile span along that edge: columns for top and bottom, rows for left and right.
- `target` is resolved by `generateV2` from `toRef` ('area' or 'area@anchor'), exactly like door targets. A ref that doesn't resolve is a build problem, and the validator then reports `SEAM <aid>/<side> HAS NO TARGET`.
- The field exists only on areas that have seams. Write `area.seams || []`.

**Three ways to write a seam:**

```js
// 1. In a stamp's legend: every cell of the letter is one span (the cells are left open)
legend: { r: ['seam', 'right', 'dock@in'], t: ['seam', 'top', 'rigging', { needs: 'rule:9' }] }

// 2. On the area spec: the return seam (plan §5.1), or a list
{ id: 'rigging', gen: 'room', role: 'backstage', zone: 'rigging', stamp: 'rigging',
  back: { side: 'bottom', span: [3, 6], to: 'crater@riggingDrop', tell: 'rope' } }
{ id: 'stage', ..., seams: [{ side: 'left', a: 10, b: 13, to: 'wings' }] }
// A stamp may carry back too (a room area uses its stamp's back when the area has none)

// 3. From a piece (WP-3's rigging / loadingDock / underStage / wings): record it on the builder
Tour.pieces.loadingDock = function (st, o) {
  /* ...build the route over or under the gate and the floor to the right edge... */
  TourSeams.add(st.B, { side: 'right', a: st.gy - 3, b: st.gy - 1, to: o.to });
  return x;
};
```

**Mirroring.** Seams from pieces and stamps are in build coordinates and flip with a mirrored area: left and right swap, and top and bottom spans are mirrored. Seams written on the spec (`back`, `seams`) are in the area **as played** and are not flipped.

**Crossing.** `TourSeams.hit(area, body, push)` is shared by the game and the validator, so they always agree:

| side | crossing when | position along the edge |
|---|---|---|
| top | the whole body is above the area: `b.y + b.h < 0` | the body's centre column is inside `a..b` |
| bottom | the body's top is past the last row: `b.y > H*TS - 8` (before the pit-death line at `H*TS + 20`) | the centre column |
| left | pressing left (`push < 0`) with `b.x <= 1` | the body's centre row |
| right | pressing right (`push > 0`) with `b.x + b.w >= W*TS - 1` | the centre row |

**In the game.**
1. Every frame, `Player.update` calls `TourHooks.offEdgeCheck(play, player, inp)`, but only in an area that has `seams`. This happens after the hazards and before the pit line.
2. It finds the crossed seam, skips it if its `needs` aren't met (§5), and runs `offEdge(play, player, side, seam)`.
3. If a handler returns true, the player update stops for that frame. Otherwise nothing changes: the pit still kills, and the wall still stops Brady.

WP-3 owns everything after that: the curtain-whip wipe, `loadArea` into `seam.target` with velocity kept, the arrival trap or mat, and the camera snap.

**In the validator.**
- A standing spot on the edge column whose body-centre row is inside a side seam goes through it (`TourSeams.nodeHit`).
- A simulated jump or fall that crosses a seam returns `{ seam }` before the "left the area" give-up, and the search goes on from the target (`TourSeams.hit` inside `simulate`).
- A swimming cell on the edge inside the span goes through too (`TourSeams.cellHit`; water seams such as R16).
- The search arrives standing at the target point, as with doors. **So make each seam's target anchor a spot where Brady can stand.**
- Seams whose `needs` aren't met for the pass are ignored.

**Build rules** (`Validator.secretRules(level)`, flagged by validate_levels; each fails the level):
- At most one seam per side per area.
- A seam needs a target.
- The edge must be open somewhere along the span.
- No seams in an autoscroll, climbing-camera (`autoscrollY`), rail, boss-arena, flip or CARRY area.
- **Under-Stage:** a bottom seam must cover one whole open pit (from the bottom row; a one-way floor counts as floor), so the seam pit is wholly safe and every other pit stays deadly. That pit must also carry a tell: a spawn whose type is in `TourSeams.TELLS` (default `{ tourCrashMat: true }`; add your own types there), or a spawn with `tell: true`, over the span. A seam with `tell` set (the rigging's rope return) counts too.

**The way back.** For every area a seam leads into, `Validator.escape` searches from that area's `in` anchor (or from the seam's landing spot) and must reach the seam's source area. Otherwise validate_levels reports `SEAM <aid>/<side> HAS NO WAY BACK`.

---

## 4. Exit kinds and warps (WP-3, WP-2)

Player-facing, these are **Wormholes** (Brady's naming decision). Code identifiers stay neutral: `warp`.

**Spec** (plan §5.1, with the neutral names: exit keys `warp`, `warp2`, ... and `via: 'warp'` instead of `case`):

```js
exits: {
  main:  { to: '1-5' },
  warp:  { to: '2-7', via: 'warp', label: 'ECUADOR', hint: '...' },
  warp2: { to: '1-6', via: 'warp', label: 'HOME', needs: 'rule:9' }
}
```

**The kind.**

```js
TourHooks.exitKind('warp', { title: 'WORMHOLE!', marksDone: true });
```

- `title` replaces the results title for that exit.
- `marksDone` decides whether taking the exit sets `Save.data.done[id]`. The default is `true`, which keeps the plan's decision that a warp clears its level. `false` is available if Brady changes his mind.
- Helpers: `TourHooks.kindOf(level, key)`, `TourHooks.marksDone(level, key)` and `TourHooks.titleFor(play)`.

**The warp spawn.** It is `{ type: 'warp', exit: 'warp', label?, needs? }`, from `['spawn', 'warp', { exit: 'warp' }]` in a stamp or from WP-3's warp piece. `exit` defaults to `'warp'`.
- **In the validator** it is a gate with key `exit` and a box 40 wide and 56 tall, standing on its tile (`VALIDATOR_EXITS.warp` in `09_validate.js`). WP-3's entity must trigger from a box at least that generous: an Up press while Brady overlaps it.
- **In the game**, the entity is WP-3's. Subclass the tour gate: `class TourWarp extends ENTITY_TYPES.gate`, registered as `ENTITY_TYPES.warp`, with `this.exitKey = s.exit || 'warp'`. Then `g.levelClear(this)` records the exit and runs the `levelClear` hooks. If the entity's `s.needs` aren't met (`TourNeeds.ok(s.needs)`), it draws padlocked and never triggers.

**validate_levels.**
- `WARP <KEY> UNREACHABLE`; the duplicate `EXIT ... UNREACHABLE` line is not printed for warps.
- `WARP <KEY> LABEL MISSING` or `TOO LONG` (14 characters at most).
- `WARP IN <aid>: NO EXIT '<key>'` for a warp whose exit key the level doesn't have.
- `EXIT <KEY> BAD NEEDS`.

**Not WP-1's.** The map end of a warp belongs to WP-2: `TourProgress.exit` with the plan's `case` and `shipment` reveals (WP-2 picks neutral names), `arrive`, the plan's `caseLinks`, the trails, and `nextLevelId`. Note: in the tour, `Play.nextLevelId` already returns null (`28_tour_fb_mapgraph.js`), so every tour clear goes back to the map. That suits shipments.

---

## 5. Needs and the rules (WP-5, WP-2)

`needs` is `'rule:<n>'` (that rule revoked) or `'rules:<k>'` (any k rules revoked), or an array of these (all must hold). It may appear on:
- an exit
- a spawn (any type, through the stamp legend's options or a piece)
- a lock (§8)
- a seam
- an area (copied to `area.needs`; the validator doesn't use it)

| Call | Meaning |
|---|---|
| `TourNeeds.met(needs, rules)` | `rules` is a Set or array of rule numbers, or `'all'`. No needs: true |
| `TourNeeds.ok(needs)` | in the game: against `TourNeeds.revoked()` |
| `TourNeeds.revoked()` | a Set of rule numbers from **`Save.data.tour.rules`** (`{ 7: { at: '1-4' } }`, plan §5.3; WP-2 creates the field, and a missing field means nothing is revoked). `TourNeeds.provider = () => Set` replaces this lookup (WP-5 may use it) |
| `TourNeeds.valid(needs)` | format check |
| `TourNeeds.inLevel(level)` | does the built level use needs anywhere |

**Every entity that may carry `needs` checks `TourNeeds.ok(this.s.needs)` itself.** The engine does not strip dormant spawns, because they must still draw their dormant look.

**`TOUR_RULES`** (WP-5's file) must be a top-level `const TOUR_RULES = { <n>: { ..., opens: [targets] } }`, where the targets parse with `Tour.target`: `'1-7'`, `'land:fest'` and so on. `validate_levels --rules` reads it if it exists and checks:
- every rule's button is placed exactly once in the game
- every `opens` target exists
- every placed button has a rule

---

## 6. Room types (WP-4)

**Spec** (plan §5.1): `{ id, gen: 'room', role: 'secret', room: 'closing', stamp, closing: { t: 12, ... } }`.

**Registry.**

```js
TourHooks.room('hourglass', {
  // optional: rewrite the area spec before its gen runs (keep A.id; it is forced back if you drop it)
  spec: (A, ctx) => Object.assign({}, A, { gen: 'rise', W: A.W || 24, H: A.H || 40, risingWater: { speed: (A.hourglass || {}).speed || 0.8, delay: 2 }, paceTo: 'rim' }),
  // optional: after the gen, before door refs resolve: built = { area, anchors, B }
  build: (ctx, A, built) => { built.area.spawns.push({ type: 'roomClock', x: 3 * TS, y: 6 * TS, t: (A.hourglass || {}).t || 20 }); },
  timed: true
});
```

- The built area gets `area.roomType = A.room`.
- `'pantry'` (today's room) needs no def.
- An unregistered type is a build problem (a warning in validate_levels) and builds as a plain room.
- `TourHooks.ROOM_TYPES` lists the nine names.
- Your type's options live in `A[A.room]`.

**Timers re-base on entry** (this differs from what the plan implies). The engine's area hazards run on the level clock (`play.t`), not on the time since Brady entered the area: rising water and lava start after `delay` seconds of the level. A runtime area is also created once and kept (`play.rt[idx]`). So a timed room must re-arm itself in `areaLoaded`:

```js
TourHooks.on('areaLoaded', (play, A) => {
  if (A.roomType !== 'hourglass') return;
  const base = play.level.areas[A.idx].risingWater;            // the built (shared) object: never mutate it
  A.risingWater = Object.assign({}, base, { delay: play.t + (base.delay || 0) });
  A.waterTop = A.H * TS + 40;                                    // the sand starts at the bottom again
});
```

**No soft-locks.** validate_levels checks that from every area with a `roomType` other than pantry, the search (rules on) reaches some other area. Otherwise it reports `ROOM <aid> (<type>) HAS NO WAY OUT`.

**Not simulated.** The validator does not simulate clocks, stall games or alarms. Build shutters, pop-holes and klaxon doors as open tiles plus entities (closing happens at run time), so the search sees them open (plan §2.1, §2.4). Fairground prizes use a lock with `needsAll` plus a `vkey` on the counter (§8).

---

## 7. Buttons (WP-5)

Player-facing, these are **Brady Buttons**. Code identifiers stay neutral: `button`.

- **Spawn:** `{ type: 'button', rule: 7, needs? }`, from `['spawn', 'button', { rule: 7 }]` or WP-5's piece.
- **Built level:** `level.buttons = [7]`, the rule numbers in spawn order. The field exists only when the level has a button, so write `level.buttons || []`.
- **Validator:** a required target. `res.buttons[7] = true` once a standing body or a simulated body overlaps its box, 44 by 44 standing on its tile (`VALIDATOR_BUTTON`). `res.buttonRules` lists the rules required in the pass, and `res.ok` and `done()` require every one. validate_levels reports `BUTTON <n> UNREACHABLE`.
- **The slap**, from the side with Action, never a stomp: the entity's logic, or a `playUpdate` handler. Brady is next to it, so the entity is awake.
- **Saving** belongs to WP-5: `TourRules.revoke(n)` writes `Save.data.tour.rules[n]`.

---

## 8. Locks: needsAll, needs and the treasure X (WP-4)

Stamp legend:

```js
legend: {
  P: ['lock', 'pot', { needsAll: ['ing:chili', 'ing:cacao', 'ing:tomato'] }],   // opens when all three keys are held
  N: ['lock', 'pad9', { needs: 'rule:9' }],                                    // shut until rule 9 is revoked
  X: ['xmark', 'x1'],                                                           // the Treasure Map's X: a one-tile floor lock
  c: ['key', 'ing:chili'], m: ['key', 'map:x1'] ...
}
```

- `needsAll` and `needs` are copied onto both the `area.locks` entry and the `lock` spawn.
- `xmark` is `B.lock(x, y, y, id, 'xmark')`: one HARD tile with look `'xmark'`.

**Validator.**
- A lock with `needsAll` opens when every listed key is held.
- A lock whose `needs` aren't met never opens, even with its key.
- Keys are level-wide, so a map key in one room opens an X in another area.

**WP-4 must** subclass `ENTITY_TYPES.lock` at run time, following the pattern the tour gate uses in `28_tour_b_build.js`. The engine's `Lock` (`src/10c_gimmicks.js`, not WP-1's file) only checks `g.keys.has(this.id)`, and draws every look as a door. WP-1 did not touch it. The subclass:
- honours `s.needsAll` (all ids in `g.keys`) and `s.needs` (`TourNeeds.ok`)
- draws the `xmark` look
- opens the X on a stomp or Pound Cake

---

## 9. The validator and validate_levels

**`Validator.run(level, opts)`** takes these new options:

| Option | Meaning |
|---|---|
| `rules` | Set or array of rule numbers, or `'all'`. Decides which `needs` hold. Default: none revoked |
| `start` | `{ area, x, y }`: search from somewhere other than `level.start` |
| `until` | `res => boolean`: stop as soon as it holds |

New results:
- `res.buttons`, `res.buttonRules`
- `res.seams`: `'<aid>/<side>' -> true` for every seam the search went through
- `res.pace.areas`: `[{ aid, ok, margin, route, why? }]`

**`exitKeys`** leaves out exits whose `needs` aren't met for the pass.

**Per-area pace (plan §5.6.6).** Every area other than the first that has a chase, rising lava, rising water or a climbing camera gets the same 25 % rule.
- **The route** runs from where the search first enters the area to its goal.
- **The goal** is `area.paceTo` (an anchor name, copied from the spec) if set. Otherwise it is the area's gate. Otherwise it is its door or seam out that lies furthest along the hazard: the highest for a rising hazard, the furthest from the start side for a chase. Set `paceTo` on any room whose way in is also its way out (the Hourglass Well: `paceTo: 'rim'`).
- **The hazard's time** uses the same formulas as the main area, with the goal's x for a chase.
- **A miss fails the level:** `PACE <aid> margin <m>`.
- The first area's rule is unchanged. On `main` today exactly one level has a hazard in a later area: 7-3's `chaussee`, a non-lethal tide chase. It passes the new rule (margin 1.06).

**`Validator.escape(level, k, to, opts)`.** Can the search get from area k's entry to any area in `to` (default: any other area)?

**`Validator.secretRules(level)`.** The seam build rules of §3, returning `{ errors, warnings }`.

**validate_levels.**
- A level that uses `needs` (`TourNeeds.inLevel`) is checked twice:
  - rules off: dormant exits and spawns are skipped
  - rules on (`'all'`): every exit, postcard, area and button must be reached. Failures carry ` (rules on)`.
- Then come the seam rules, the way back, the room way out, warp labels, warp exit keys, needs formats and per-area pace (§3, §4, §6).
- **`--rules` adds:**
  - every `TOUR_RULES` button placed exactly once
  - every rule's `opens` target exists
  - no button without a rule
  - a new room type at most twice per land
  - **rollout warnings:** lands without a warp, and lands with fewer than 3 room types. Each is printed as one line listing the lands.
- **`--release`** turns the rollout warnings into errors (plan §6.4).
- **`arch: 'bonus'`** levels are exempt from the archetype caps, like `lair`.

---

## 10. Changes to the plan, and what downstream packages now do differently

What the plan said, what WP-1 did, and why:

1. **`offEdge` has one call site, not three.** The plan put calls at the pit check (`11_player.js:440`) and at the left and right clamps (`:451`). In the code, `tileAt` makes both sides HARD, so Brady can never pass the side clamps. One call, just before the pit line, now checks all four edges through `TourSeams.hit`. The signature gained the seam: `(play, player, side, seam)`.
2. **WP-1 owns seam detection; WP-3 only does the swap.** The geometry lives in `TourSeams`, so the validator and the game cannot disagree. Side seams need Brady to press into the wall, which matches "he pushes into the edge" in plan §3.3. In the validator, standing on the edge column counts.
3. **Extra hooks the plan didn't list**, because the packages needed them and couldn't otherwise reach the engine files they no longer own:
   - `playerDie`: the hourglass's soft catch
   - `playUpdate`: per-frame logic outside entities
   - `camera`: the peek
   - `entityDraw`: dancing is a transform around an entity's own draw, which a draw-after hook can't do
   - `levelClear`: a warp's transit
   - `resultsTitle` and exit-kind titles
4. **Timed rooms must re-base their timers in `areaLoaded`** (§6). The plan implied that area timers start on entry; they run on the level clock.
5. **The Under-Stage tell can be a spawn of a `TourSeams.TELLS` type, any spawn with `tell: true`, or `tell` on the seam itself.** The plan applied the tell rule to every bottom seam, and that includes the Rigging's rope-slide return, whose tell is the rope drawn by the room. So `back` takes `tell`.
6. **Two checks beyond the plan:** `ROOM <aid> HAS NO WAY OUT` (the "no soft-locks" ground rule of §2) and `WARP IN <aid>: NO EXIT`.
7. **The "no seams in autoscroll, rail, arena, flip, CARRY" rule is a per-level validate_levels failure**, not a `--rules` line. It is also stricter: climbing-camera (`autoscrollY`) areas count too, because the bottom edge kills there.
8. **The rollout warnings are collapsed into one line each**, and `--release` turns them into errors. Without that, all 14 lands would print two warnings each on every run until phase 2.
9. **The plan said `Validator.run(level, { rules: Set|'all' })`.** WP-1 also accepts arrays, and a Set from another realm (node tests).
10. **New built fields appear only when used:** `area.seams`, `area.roomType`, `area.zone`, `area.needs`, `area.paceTo` and `level.buttons`. This keeps the shipped levels byte-identical, so read them with `|| []` and the like.
11. **`back` is turned into a seam, not copied raw.** The plan said "copies room, zone, back and needs onto the area".
12. **The runtime lock (`src/10c_gimmicks.js`) is not WP-1's file and was not changed.** WP-4 subclasses it (§8).
13. **Line numbers in the plan are stale.** They moved with the merged branches and with these edits:
    - pit line `11_player.js:441`, now `:445`
    - `recordProgress` at `12_play.js:404`
    - the validator's give-up line inside `simulate`
    - `pace()` now dispatches to `paceAreas()`
14. **For WP-2:**
    - the `owDraw`, `owTap` and `routeDraw` lists exist, and the call sites are yours
    - `Save.data.tour.rules` is the field `TourNeeds` reads; `TourProgress.data()` does not create it yet
    - warp exits still mark their level done (`marksDone` defaults to true)
15. **For WP-3:**
    - the warp box in the validator is 40 by 56 (§4)
    - record piece seams with `TourSeams.add(st.B, ...)`
    - add your tell spawn types to `TourSeams.TELLS`
16. **The "COURSE CLEAR" in the plan doesn't exist in the code.** Tour clears are titled `WELCOME HOME!`, `CASTLE CLEARED!` or `SECRET EXIT!` (`Play.drawResults`). A warp's own title (for example `WORMHOLE!`) comes from the exit kind.
17. **Names (Brady's decisions of 16 Nov, at the top of the design doc).** The player sees **Wormholes** and **Brady Buttons**, and the villain has changed, so no player-facing string here uses the plan's old names. Code identifiers are neutral: exit `via: 'warp'`, exit keys `warp` / `warp2`, spawn types `warp` and `button`, `level.buttons`, `res.buttons`, flags `WARP ...` and `BUTTON ...`. `TOUR_RULES`, `rule:<n>` needs and `Save.data.tour.rules` keep their names (neutral).
