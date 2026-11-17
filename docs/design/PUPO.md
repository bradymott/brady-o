# Super Brady-O World: Pupo, Brady-O's sidekick and steed

Design spec, 16 Nov 2026. Read from `main` at `15e1207`, plus `origin/sbw/secrets-wp1` (`ea1011d`), `sbw/mazes` and the uncommitted Pupo art on `sbw/story-piwi` (`src/05e_pupo.js`, `docs/design/STORY_PIWI.md`). **This is a design document. No game code was written and nothing in the repo was changed.** Implementation agents build from this file, together with the docs it points to.

Brady's request, restated:
- Brady-O sets off to find Chinka-O with **Pupo** as his sidekick and steed.
- He finds Pupo in boxes and rides him.
- Pupo's arms stretch. They hit bad guys, grab things across big gaps, reach up to grab objects, and climb.
- Pupo levels (one or two per land) have obstacles that only Pupo can get past.
- **Pupo Power** charges over time. Pressing its button while riding makes Pupo grow lots of arms, each with one finger stuck out, and poke every bad guy around him in the belly button. At the same time:
  - his eyes go trippy, as spiral rainbows
  - his tongue unrolls like a long Persian carpet
  - butterflies erupt from his belly button
  - "PUPO POWER!" goes across the screen in big, bold yellow letters

Pupo, in one line: big, slow, sweet, deadpan. He pokes belly buttons, which he calls "pupos". He is quick only when he is stretching, swinging, climbing or swimming.

---

## 0. Decisions at a glance

| Item | Decision |
|---|---|
| Where Pupo comes from | A **Nap Box**: a plain brown cardboard travel carton with air holes and a snoring sloth inside, sitting where a gift box would be. It opens every way a gift box does. |
| Carried between levels? | **No.** Pupo stays with Brady for the whole level run: doors, areas, backstage seams and respawns. At the level clear he climbs back into his box. On the overworld map he rides on Brady's back, as a cosmetic touch. |
| Ground speed | 0.77x Brady: a 4.8 tiles/s amble, or a 7.4 tiles/s stretchy lope when you hold a direction. Jump height is the same as Brady's. In the water he swims 1.6x faster than Brady (real sloths swim far better than they walk). |
| Stretch arms | One button, the Action button. It aims where the stick points, or forward when the stick is still, and it **auto-targets**. A paw marker always shows what it will do: poke an enemy, grab a hook, zip to a post, pull a handle, or fetch an item. Reach is 5 tiles; the poke reaches 4. |
| Automatic moves | He grips any climbable surface he touches, hangs from bars, and catches ledge lips in mid-air (the ledge catch is an assist the validator ignores). |
| When hit while riding | **Drowsy, then a nap.** On the first hit Pupo takes the blow and goes drowsy for 8 s (slower, shorter reach). A second hit while he is drowsy makes him fall asleep on the spot, and Brady hops off unhurt. You wake Pupo by walking into him: Brady pokes *his* pupo. He never runs away. |
| Pupo Power | A meter fills over 30 s of riding (pokes add to it). The button sits where the power-picker chip sits. Pressing it plays a 2.6 s show with the world frozen. It pokes up to 16 non-boss enemies on screen. Brady and Pupo can't be hurt during the show or for 1.5 s after. |
| Boss fights | Pupo waits at the arena door ("...I will... cheer."). Boss fights and their 172 tests are unchanged. |
| Pupo levels | **One existing level per land is converted into a Pupo level** (14 in all). No new levels, no new map stops and no new save key of its own. 10 more levels get Pupo as an **optional helper**: a Nap Box plus a Pupo-only bonus. |
| Save | `Save.data.tour.pupo = { met: true }` and first-time tip flags. Nothing else persists. |
| Engine | Four new files (`src/28_tour_p_pupo.js`, `pa_reach.js`, `pb_power.js`, `pc_pupoval.js`). They wrap existing methods the way the jump powers do (`28_tour_di_jumps.js`). There are **zero edits to `11_player.js`, `12_play.js` and `02_input.js`**, plus a small extension API in `09_validate.js` after secrets WP-1 lands. |

---

## 1. Riding rules

### 1.1 Finding Pupo: the Nap Box
**Look.** A gift box in this game is a bright wrapped present with a ribbon. A Nap Box is the opposite, so players learn it in one glance:
- a plain brown cardboard carton, with packing tape crossed over the lid
- a row of punched air holes
- stencilled "THIS WAY UP" arrows, and a postage-stamp sticker with the land's icon (a chili in Mexico, a cacao pod in Ecuador, and so on; never a flag)
- three cream claw tips poking out under the lid flap
- the box slowly breathing (it swells 4 % over 2.5 s), and a small hard-edged "z" floating out of an air hole every 2 s
- a hand-lettered tag: Spanish lands `FRÁGIL — PEREZOSO DORMIDO`, Portuguese lands `FRÁGIL — PREGUIÇA A DORMIR`, French `FRAGILE — PARESSEUX ENDORMI`, Dutch `BREEKBAAR — LUIAARD SLAAPT`, everywhere else `FRAGILE — SLOTH ASLEEP`

It is drawn in code: a flat fill, dark ink outline and the cream keyline, as for every procedural object (`Ink.around`, held as a static picture through `Ink.statics` because it hardly changes).

**How it opens.** It opens exactly like a gift box (`28_tour_dj_boxes.js`). It is a `T.QBLOCK` tile whose contents are `'pupo'`, with a `napBox` entity drawn over the tile. You can:
- bump it from below
- land on it
- kick it with Action
- hit it with anything thrown
- ground-pound it

The lid pops and Pupo unfolds over 1.2 s. First he yawns. In the yawn **both arms stretch out 4 tiles to the sides**, which is the first lesson in stretching, and (in the tutorial) knocks a pepper off a stall. Then he sits on the floor beside the box with an "...pupo." bubble and pats his own back.

**Mounting.** Walk into the sitting Pupo, or land on him. Brady swings up onto his back in 0.25 s. A sitting or sleeping Pupo is never hurt by anything and blocks nothing.

**How often.**
- **Pupo levels:** one Nap Box at the start of the Pupo section, plus one at **every checkpoint that comes before a Pupo-only obstacle**, on the near side. Usually 2-3 per level.
- **Helper levels:** 1.
- **Every other level:** none.
- In total, about 45 boxes in the game.

**Refill.** A used Nap Box shows its open, empty carton. Whenever Brady bumps a used Nap Box while Pupo is *not* with him (asleep elsewhere, or parked at a door), the box rattles. The sleeping Pupo vanishes in a puff of "z"s wherever he is, and pops out of this box instead ("...I was... in here... the whole time."). So a Nap Box is never wasted, and Pupo can never be lost.

### 1.2 Mounting, dismounting, carrying
| Situation | What happens |
|---|---|
| Hop off | **Down + Jump** on solid ground: Brady hops up and off, and Pupo sits where he is. On a one-way floor, Down + Jump drops *both* through it, as Brady alone does today. To hop off there, **hold Down for 1.0 s** while standing still. That works anywhere. |
| Get back on | Walk into the sitting Pupo, as when mounting. |
| Doors, areas, Wormholes in and out of backstage seams | Pupo goes along, still ridden. |
| Doors into an area where Pupo is not allowed (§1.7) | Pupo hops off on the near side ("...I'll... wait... here.") and sits by the door. Coming back through that door, Brady remounts automatically. |
| Death | If Pupo was met in this level run, Brady respawns with Pupo **sitting beside him** at the checkpoint. The checkpoint object carries `pupo: true` and the meter. |
| Level clear | Pupo waves (slowly), climbs into his box and the lid shuts. Results screen as usual. |
| A Wormhole (Road Case) exit | Pupo climbs into his own box next to the case and is shipped too. Nothing is carried into the next level. |
| Overworld map | After `tour.pupo.met`, Pupo rides piggyback on Brady on every land's map (an `owDraw` hook, cosmetic). |

### 1.3 Movement: making slow fun
The rule is **unhurried on the ground, fast in the air and on walls.**

| | Brady alone | On Pupo | Feel |
|---|---|---|---|
| Walk / run (tiles/s) | 6.2 / 9.6 | **4.8 amble / 7.4 lope** (`speedMul 0.77`, the same run-after-0.42 s rule) | The amble is a deadpan four-legged shuffle with heavy-lidded eyes. In the lope, his arms stretch far ahead and pull his body after them like a slinky: comic and readable. |
| Jump | 4.2 tiles high | **the same** (`jumpBoost 1.0`) | So no gap a level asks Brady to clear by height is closed to Pupo. |
| Swim | 4.4 t/s | **7.0 t/s** (`swimMul 1.6`) | Brady rides him like a raft. Pupo, flatly: "...finally... fast." |
| Climb (§2.5) | none | **3.2 t/s up, 4.5 down** | Hand over hand, quick and rhythmic. |
| Swing release (§2.3) | none | **up to 14 t/s** | Faster than Brady can ever run. Swinging is where Pupo is thrilling. |
| Hang shimmy (§2.6) | none | 2.6 t/s | |
| Flop (hold Down) | crouch (big only) | Pupo flattens on his belly. The box is 28 x 30, he crawls at 2.8 t/s and fits 1-tile-high gaps. | Sloths drag themselves along the ground. |

- **Riding hitbox:** 28 x 58 px. It fits every 2-tile passage, and the flop fits 1-tile passages.
- **Brady's size doesn't change the riding box.** Small or big Brady sits on top. The mushroom's grow still plays, but the box stays the riding box.
- **Ledge catch (automatic).** Pupo grabs a ledge lip and hauls himself up in 0.3 s when all of these hold:
  - he is in mid-air and falling, or near the top of a jump (`vy > -2 t/s`)
  - the stick is held toward the ledge
  - the lip is a standable tile top within 2 tiles ahead of his leading edge, between 2 tiles above and 0.5 tile below his head
  - nothing solid lies in between

  This turns most "just short" jumps into catches, which makes the slower lope forgiving. **It is an assist only: the validator ignores it, so no required jump may depend on it.**

### 1.4 When Pupo is hit: drowsy, then a nap
Our own rule, forgiving on a phone and in Pupo's character. **The hit order while riding:**

```
star (ignores the hit) → Pupo shield after Pupo Power (ignores it) → Pupo → Hard Hat → HANDS → FEET → FORM
```

1. **First hit:** Pupo takes it ("...ow.").
   - Brady stays on, with a 1.5 s grace (no flicker; see §7.9).
   - Pupo goes **drowsy** for 8 s: droopy lids and a slow "z".
   - While drowsy: reach 3.5 tiles, poke cooldown 0.5 s, climb 2.2 t/s, swing release capped at 10 t/s, meter charge halved.
   - The Pupo Power meter loses 25 %.
2. **8 s without another hit:** he perks up ("...better.").
3. **A hit while drowsy:** Pupo **falls asleep on the spot**.
   - Brady pops up off him (`vy = -9 t/s`) with 2 s of invulnerability. **He keeps his form, HANDS and FEET items.**
   - Where Pupo sleeps:
     - on the ground: he lies there snoring
     - in mid-air: he grabs the nearest grab point, bar or ledge within 5 tiles and dangles from it asleep; if there is none, he drops to the floor below
     - over a pit, lava or other deadly ground: he poofs into "z"s and is back asleep in the last Nap Box Brady passed, with the box closed again
4. **Waking him:** walk into the sleeping Pupo. Brady pokes Pupo's belly button ("...pupo?"), Pupo wakes in 0.6 s, and Brady is back on, with Pupo no longer drowsy.

A sleeping Pupo is ignored by enemies and hazards. He is never removed, and he never wanders.

**Special hits:**
- **Grabbers** (storks, the `grabber` behaviour) cannot carry Brady off Pupo. A grab while riding counts as one hit on Pupo.
- **Crushers** and **pits** kill as they do today.
- **Lava** kills as it does today.

### 1.5 Brady's own powers while riding
| Power | While riding |
|---|---|
| Mushroom (big) | Brady grows on Pupo's back. The riding box doesn't change. It is still lost to a hit only after Pupo is lost. |
| Joint (smoke puffs), HANDS gear, the land's signature item, the Backpack swap | **Paused.** The Action button belongs to Pupo, and the power-picker chip hides. Passive effects keep working: Hard Hat, magnet, sundial. Hop off to use them. |
| Jump powers (Spring Socks, Pound Cake, Magic Beans) | **Off** (the badge on the jump button greys out). A mid-air press does nothing, so there is no hover, double jump or pound on Pupo. |
| Star | Brady and Pupo glitter, and anything they touch is defeated, as with Brady alone. Star music plays. |
| LSD tab | Brady floats up off Pupo ("...have fun... up there."). Pupo sits where he was, and Brady remounts after the flight. |
| Mushroom trip, joint trip, acid trip (screen effects) | Unchanged, with one rule: **TripFX never recolours Pupo**, exactly as it never recolours characters. |
| Paper Plane, Flipper Fins, Cardboard Box | Plane: no glide while riding. Fins: Pupo swims anyway. Box: can't be used while riding. |
| Gift boxes, levers, rail switches, Brady Buttons (slapped from the side), keys | **A poke counts as Brady's Action.** It opens a gift box, pulls a lever, flips a rail switch and slaps a Brady Button (`hit('poke')` is accepted wherever the action button or a thrown hit works today). |

### 1.6 Enemies and hazards against Pupo
- **Touching an enemy** from the side counts as one hit on Pupo (§1.4).
- **Landing on an enemy** is a stomp, as for Brady. A spiky enemy is a hit.
- **Projectiles** are hits. Pupo Power turns every projectile on screen into a butterfly.
- **Spikes, lava, pits and crushers** work as for Brady (spikes = a hit on Pupo).
- **Hazard-free surfaces** work as today: updrafts, wind, ice, honey, bounce, conveyors and crumble use the same physics, scaled only by `speedMul`.
- **Brazil's `brSloth` ceiling-droppers are Pupo's cousins.** A poke makes one `befriend()` (it hangs and waves), and it is never hostile again that run.

### 1.7 Areas where Pupo can't go (`noPupo`)
These are the default. An area spec can override with `pupoOk: true` or `pupoOk: false`.
- `rail`, `ride` (boats, carts, trains)
- `autoscroll` and `autoscrollY` (the screen edge would fight the stretch)
- `scroll` archetype areas
- `carry` areas
- flip bands
- boss and mini-boss arenas
- `glide` archetype areas (the Paper Plane levels)
- backstage seams in a `noPupo` area (§3.3 of the secrets doc already bans seams in most of these)

In these areas Pupo waits at the door (§1.2).

---

## 2. Stretch arms

### 2.1 One button, the stick, and the paw marker
Only the stick direction and one button. There is no precise aiming.
- **Aim direction:** the stick snapped to 8 ways, using `Input`'s own dead zones. With the stick at rest, Pupo aims the way he faces.
- **Cone:** ±40° around the aim direction (±50° with the stick at rest, so neutral still finds a hook slightly above).
- **The auto-target** is recomputed at 15 Hz (§7.8). It picks one target from what is on screen, in the cone, within reach and in clear **line of sight**. Line of sight is a tile walk from Pupo's shoulder: solid tiles block it, except tiles inside a `pupoGrille` rectangle (§2.9), which arms pass through and bodies don't.

  | Target | Reach |
  |---|---|
  | a hostile enemy (poke) | 4 tiles |
  | a grab point: hook or post (grapple, zip) | 5 tiles |
  | a pull handle (pull) | 5 tiles |
  | a pickup, key, postcard or coin, a gift box, lever, rail switch or Brady Button, a tickle spot | 5 tiles |
- **Priority:**
  1. Any hostile enemy within 2 tiles (safety first).
  2. Otherwise the lowest score of `dist / reach + 0.5 * angle / cone`, with enemies scoring 0.2 lower.
  3. Nothing in range: a poke into the air in the aim direction (a "boop" at 4 tiles; it still opens a gift box it touches).
- **The paw marker:** a small cream paw with ink outline (14 px) hovers over the chosen target, bobbing 2 px at 1 Hz. The **Action button's icon** shows the same verb (through `Input.actionArt`):

  | Verb | Icon |
  |---|---|
  | poke | a pointing claw |
  | grab | an open paw |
  | pull | a fist |
  | fetch | a cupped paw |

  You always know what Action will do before you press it.

**Automatic vs. button:**

| Move | How |
|---|---|
| Poke, grab (hook / post), pull, fetch, tickle | **Action** (the auto-target picks which) |
| Climb a climbable surface | **Automatic** on touch, while moving toward it or in mid-air. Up/Down to move; Jump to leap off. |
| Hang from a bar | **Automatic** when Pupo's head touches it on the way up. Left/Right to shimmy; Down or Jump to drop. |
| Ledge catch | **Automatic** (§1.3) |
| Chain to the next hook while swinging | **Action** again, while the marker sits on the next hook |
| Let go of a swing | **Jump** |

### 2.2 The poke
| Number | Value |
|---|---|
| Arm out | 30 tiles/s (a 4-tile poke lands in 0.13 s) |
| Hold at the target | 0.10 s |
| Arm back | 22 tiles/s (≤ 0.18 s) |
| Cooldown after it is back | 0.20 s (0.50 s drowsy), so about 1.6 pokes a second |
| Effect | `e.hit('poke', pupo)` once per poke, at the fingertip. It works while walking, in mid-air and while hanging (not while climbing or swinging). Aiming down in mid-air pokes enemies below without bouncing. |

`TourEnemy.hit` already sends any unknown kind to the generic defeat (`knockOff`), so `'poke'` defeats what a thrown hit defeats:
- spiky enemies too: the arm is long
- not curled tin dogs or other `hit() → false` enemies, which just say "boop" and shrug
- `brSloth` is befriended (§1.6)

**Belly buttons.** Only mammals have belly buttons (a real fact), and the poke plays on it:
- **Mammals** (`belly: true` on the enemy type: chihuahuas, coatis, monkeys, warthogs, yetis, boars and so on): the claw lands *in the belly button* with a tiny ring and a "boop". The enemy freezes, giggles (a 0.25 s squash wobble) and keels over: `knockOff`, then the normal defeat.
- **Everything else** (food, fish, birds, insects, objects, robots): a **nose boop** instead, the same defeat. One time in four Pupo looks puzzled: "...no... pupo?" This is the running gag of the story, where Piwi is a wooden dummy with no belly button.

Each country file marks its mammals with `belly: true` in the enemy's `cfg`. The default is `false`.

### 2.3 Grapple: hooks (swing) and posts (zip across)
A **grab point** is a `pupoGrab` spawn with `kind: 'hook'` or `kind: 'post'`.

**Hook.** Overhead things to hang from: a papel-picado knot, a ham hook, a rattan cane.
1. Action fires the arm (≤ 0.17 s). On contact Pupo hangs from it and swings.
2. The arm reels in to **2.5 tiles** at 12 t/s. Pupo's speed at the grab carries into the swing.
3. The swing is a pendulum with `g = 40 t/s²`. The stick pumps (±0.6 rad/s² toward the stick), **Up** reels in to 1.5 tiles, and **Down** lets out to 5.
4. **Jump releases** him with his speed along the swing x1.15, plus 3 t/s upward, capped at 14 t/s (10 when drowsy).
5. **Action at another hook** in the marker passes from hand to hand, keeping the swing speed. Chains of hooks are the "monkey bars" of Pupo levels.

**Post.** An anchor on the far side of a gap: a mooring post, a beam end, a sloth cousin's outstretched hand.
- Use a post when the point is level with Pupo's shoulder or below it (from 1 tile above to 2 tiles below) and has a standable top.
- Action: the arm grabs, then Pupo **zips** along the arm at 16 t/s, pulls himself up onto the top in 0.3 s and stands there.
- It is the readable "reach across and pull yourself over" move Brady described.

**Moving grab points** (`orbit: { r, period }` or `path`): stirring paddles, clock hands, a cacao-pod conveyor. These are hooks that move. Pupo rides them until Jump.

**Validator model** (§7.6), the same way the existing `ring` piece is modelled:
- the spots where Pupo's feet are along the swing (at -0.9, -0.45, 0, 0.45 and 0.9 rad, length 2.5 tiles) become **ghost one-way floors, only while mounted**
- **reach edges** run from every standing spot within reach and in line of sight to those ghosts
- a post becomes an edge straight to its top

### 2.4 Reach up, fetch and pull
**Fetch.** Pickups, keys, postcards, coins and gift-box items within reach.
- The arm grabs the target and comes back at 22 t/s, carrying it. The target is collected when it arrives, exactly as if Brady had touched it.
- A poke at a gift box opens it (the item then comes out of the side nearest Pupo, through `ItemSpace`).

**Pull handles** (`pupoHandle`). Things that only a long arm reaches: a drawbridge chain, a hoist rope, a frozen cord.
1. The arm grabs the handle (0.17 s).
2. Pupo leans back and tugs for 0.5 s.
3. The handle's effect plays, and the arm snaps back.

The effect is one of:
- **a toggle group flip** (`g`): the existing toggle system, so everything it moves is drawn as real objects, never as dotted blocks
- **a lock opening** (`lock: id`)

`once: true` handles stay pulled; the others flip back and forth on each pull.

### 2.5 Climbing hand over hand
**Climbable surfaces** (`pupoClimb` spawns: a column 1 tile wide and `h` tiles tall) look grippy:
- bark, a scaly tail, a rope wrapped in ribbon, a soaped pole that squeaks
- a land skin each (§2.10)
- for Brady alone they are **slick**: he slides off, and nothing marks them as standable

**Rules:**
- Pupo grips on touch.
- Up climbs at 3.2 t/s and Down at 4.5. Arms alternate every 0.3 s, each stretching 0.6 tiles up before pulling.
- At the top he pulls up onto any standable tile beside the strip in 0.3 s.
- **Jump leaps off** away from the strip: `vx` 6.5 t/s away, `vy` -13 t/s.
- He can poke while climbing (Action with the stick sideways); the climb pauses for the poke.

**Validator:** one ghost one-way floor per row along the strip, only while mounted. Climbing is then a staircase of standing spots, and leaping off is an ordinary jump from any of them.

**Bending stalks** (`pupoBend { to: [dx, dy] }`, Japan): a climbable stalk that bends under Pupo's weight once he passes its middle. It carries him in a 1.5 s arc to the landing spot `to`. Validator: an edge, only while mounted, from the stalk's foot to the landing spot.

### 2.6 Hanging bars
**Bars** (`pupoBar`, a horizontal run `w` tiles wide): branches, cables, a frozen washing line.
- Pupo hangs upside down from them, with Brady hanging on to his belly fur. He looks happiest here (eyes closed).
- Left/Right shimmies at 2.6 t/s. Down or Jump drops.
- Pokes and Pupo Power both work while hanging.

**Validator:** a row of ghost floors 3 tiles under the bar (where Pupo's feet hang), only while mounted.

### 2.7 Tickle gates
A `pupoTickle` is a big, harmless, sleeping animal across the only way on. Its body is a lock (the `lock` tiles it covers). It has one belly-button spot `belly: [dx, dy]`.
1. A poke there makes it giggle in its sleep, roll over and amble off. The lock opens, with a 1.2 s animation.
2. Pokes anywhere else get "...not... there."

Brady alone can only bounce off it ("zzz").

**Validator:** the lock's key is `tickle:<id>`. It is held when a mounted standing spot has the belly spot within 4 tiles and in line of sight.

### 2.8 Snatch
A `pupoSnatch { key, path }` is a key travelling along a path: cacao pods on an overhead conveyor, Ecuador. Fetch works on it whenever it is in reach.

**Validator:** the key counts as reachable if any point on its path is within reach and in line of sight of a mounted standing spot.

### 2.9 Grilles
A `pupoGrille { w, h }` marks solid tiles that **arms pass through and bodies don't**: rusty bars, a lattice. Line of sight skips them.

It is a rectangle on the area (`area.pupoGrilles`), not a new tile type, because the tile enum in `src/00_core.js` is shared.

### 2.10 Level objects: looks per land
All objects are code-drawn: flat fill, dark ink, cream keyline. A grab point always has a **small brass ring or knot** where the hand goes, the same in every land, so "grabbable" reads at once. A climbable surface always has **a pattern of horizontal grip lines**.

| Land | Hook / post | Climb | Bar | Pull handle |
|---|---|---|---|---|
| Mexico | papel-picado cord knots; a market-awning post | the alebrije float's striped tail and neck | a string of piñata hooks | a churro-shaped pull cord |
| Ecuador | stirring-paddle handles; a cacao-tree branch stub | a moss-wrapped cacao trunk | a drying-rack pole | a giant chocolate bar on a chain |
| Brazil | a sloth cousin's outstretched hand; a hammock ring | a cecropia trunk | a hammock rope | a football in a string bag |
| Mozambique | baobab "monkey-bread" fruit | baobab bark | a long dead branch hung with weaver nests | a cashew fruit on a cord |
| Morocco | kasbah wooden beam ends | a date-palm trunk | a lantern chain | a brass tassel |
| Spain | jamón shop ham hooks | the soaped pole (it squeaks) | the tomato truck's side rail | a string of garlic |
| France | a baguette stuck in a wall | plane-tree bark with ivy | a clothesline | a bell rope with a cork handle |
| Netherlands | cheese hooks | windmill-sail lattice | a canal bike-rack rail | a drawbridge chain with a clog counterweight |
| Indonesia | thorny rattan canes (spike tiles: they hurt Brady, but Pupo's hooked claws hold them) | banyan aerial roots | a bamboo pole | a coconut on a rope |
| Vietnam | lantern hooks | cave roots | a rusty grille rail | a fishing-net float on a line |
| Japan | wind-chime hooks | bamboo (bending, §2.5) | a festival lantern line | an onigiri on a string |
| Nepal | yak-bell hooks on supply cables | a frozen rope | a supply-line cable | a frozen thermos on a string |
| Antarctica | frozen long johns on a washing line | the radio mast's rungs | an insulated pipe | a mooring rope with a fish-shaped float |
| World 22 | clock hands | a bookshelf | a fountain pen | a bookmark ribbon |

**Content rules.** No prayer flags, temple bells, torii gates or other religious objects anywhere. Sacred buildings appear only as plain distant silhouettes in backdrops, as today.

---

## 3. Pupo Power

### 3.1 The meter
| Rule | Value |
|---|---|
| Fill | 0 to 1. +1/30 per second while riding, hanging, climbing or swinging (half that while drowsy); +0.10 per enemy defeated by a poke. Nothing fills it while Pupo is asleep or parked. |
| Start | 0.5 the first time Brady mounts in a level run (1.0 in the Mexico tutorial, §6). It carries through doors and respawns. |
| A hit on Pupo | -25 % |
| Use | Back to 0 |
| Where it shows | (a) **Touch:** a ring of 10 yellow segments (`#ffd84a` on dark) around the Pupo Power button (§5). (b) **Keyboard or gamepad:** the same ring around a 12 px Pupo-face icon in the HUD's row of running effects, next to the jump-power icon (by wrapping `Play.prototype.drawHUD`), with the key letter `F`. |
| When full | The button face swaps Pupo's face for his spiral-eyed face and bobs (scale 1.0 to 1.06 at 1.2 Hz: a bob, not a flash). The first time ever, a label above it reads "PUPO POWER READY!" (`TourPicker.label`). |

### 3.2 The button
- Shown **only while Brady is on Pupo**: riding, hanging, climbing or swinging.
- Pressed with the meter full, it fires. Pressed early, it gives a soft "bonk" and the ring shakes once.
- Keyboard **F** or **L** fires it too (a keydown listener, like the picker's).

### 3.3 The effect
| Number | Value |
|---|---|
| Targets | Every **non-boss** enemy whose box overlaps the visible view grown by 1 tile, sorted by distance, at most **16**. Past 16, the rest are stunned for 3 s. Every projectile on screen becomes a butterfly. Friends giggle and are not harmed. Doom walls, chasers, hazards and bosses are untouched (bosses never share a screen with Pupo anyway, §1.7). |
| The hit | `e.hit('pupoPower', pupo)` at the poke beat. An enemy that returns `false` (curled, armoured) is stunned for 6 s instead. Each defeated enemy drops one coin and scores 200 x the chain. |
| World | **Frozen for 2.6 s.** `Play.update` runs only the Pupo Power effect, the camera and the particles. Entities, timers, rising water, scrolls and physics all hold, so Brady can't fall into a pit during the show. |
| Protection | No hits during the 2.6 s, then a **1.5 s Pupo shield** (hits ignored). The shield is shown by three tiny hard-edged stars orbiting Pupo at 1 rev/s. **Not** by the 8 Hz `invuln` flicker of `Player.draw`. |
| Where it works | Anywhere Pupo is with Brady, including mid-air, hanging, climbing and swinging. Not in `noPupo` areas. |

### 3.4 The show, beat by beat (2.6 s)
Art direction: Fiesta Toon throughout.
- Hard edges and black ink outlines (stroke a dark path 2 px wider, then fill).
- **No** glows, blurs, washes, gradients or alpha fades on large areas.
- **No full-screen flash.** Nothing full-screen changes faster than about 3 times a second.
- Gameplay stays readable, because the world is frozen and every enemy keeps its own colours.
- Colours: ink `#1c1426`, Pupo fur `#b48c62` (from `PUPO` in `05e_pupo.js`), text yellow `#ffd84a`, text drop `#c27a00`.

| Time (s) | Beat |
|---|---|
| 0.00 | **Freeze.** Two letterbox bars (solid `#1c1426`, 8 % of the view height each) slide in from the top and bottom in 0.15 s. The music ducks to 30 % and a short brassy sting starts. |
| 0.00–0.30 | **Rear-up.** Pupo rises onto his hind legs (pose `rear`) and Brady clings to his scruff, legs flying (anim `ride`, arms up). |
| 0.30–0.70 | **The arms.** One extra arm per target (up to 12 on High) sprouts from his back and sides, one every 0.035 s, in the directions of the targets. Each is a long, wiggly fur noodle (the outline wavers ±4 px at 3 Hz) ending in a paw with **one claw pointing** and two curled. **Art rule:** the arms stick out every which way like a startled octopus, never as a symmetric fan or halo behind him. Nothing may read as a many-armed figure from religious art. |
| 0.55–1.00 | **Spiral eyes.** Each eye becomes a disc with 6 hard-edged spiral bands (red `#e8413a`, orange `#ff9a2a`, yellow `#ffd84a`, green `#4ac46a`, blue `#3a8ae8`, violet `#9a5ae8`) inside an ink ring. It turns at 0.6 revolutions a second (a rotation, not a colour flash). |
| 0.70–1.30 | **The carpet tongue.** His mouth opens and the tongue unrolls as a long patterned rug, 6 tiles at 10 t/s. If he is on the ground it lays forward and down along the floor in front of him; in mid-air it hangs straight down. The rug: a deep red field, a cream border band with a zigzag, three navy-and-gold medallions, a tassel fringe at the tip, and a rolled cylinder (a circle with a spiral line) travelling at the front edge until it is unrolled. |
| 1.00 | **"PUPO POWER!"** slams in: big bold yellow letters with a 6 px black outline and a solid 4 px darker drop offset down-right (no blur). The text is centred at 30 % of the view height and 80 % of its width. It scales 1.6 to 1.0 with one overshoot in 0.18 s. Each letter bobs ±2 px at 2 Hz. |
| 1.00–1.40 | **The boop.** Every arm shoots to its target (0.12 s each, 0.03 s apart). A **belly-button dot** appears on every target's tummy (Pupo Power gives everyone a pupo, even the peppers) and the fingertip lands in it: a white ink ring grows from 0 to 14 px over 0.2 s, and the target squashes and giggles. Targets 13-16 get a second round of pokes at 1.25 s. |
| 1.20–2.20 | **Butterflies.** 24 butterflies erupt from Pupo's belly button in three bursts of 8 (at 1.20, 1.35 and 1.50 s). Their wings are two pairs of flat shapes in 6 bright colours with ink outlines, flapping at 6 Hz (a horizontal squash of a 10 px sprite). They fly up and out at 3-6 t/s with a little drift and shrink to nothing near 2.4 s. There is no alpha fading. |
| 1.60 | **Pop.** Each target bursts into confetti (the existing `burst(..., 'confetti')`) and drops its coin. The hits are applied here. |
| 1.80–2.30 | **Wrap-up.** The arms snap back like tape measures, with one overshoot. The tongue rolls back up with a "zip". The spirals slow and turn back into his eyes with a slow blink. |
| 2.30–2.60 | The letterbox slides out and the text drops off the bottom of the screen in 0.3 s. Play resumes and Pupo says, flatly, "...pupo." |

### 3.5 Cheaper versions
| | HIGH | MEDIUM (`QualityTier.level >= 2`) | LOW (`level >= 5`) | FX CALM (`TourKit.reduceMotion()`) |
|---|---|---|---|---|
| Arms | 12 (second round for 13-16) | 8 (rounds of 8) | 4 (rounds of 4; all pokes land by 1.45 s) | as the tier, with no waver |
| Eyes | 6-band spiral, turning | 4 bands, turning | 3 bands, turning | static spiral |
| Tongue rug | full pattern | border and 2 medallions | 2 plain stripes | as the tier |
| Butterflies | 24 | 12 | 6 | 6, drifting slowly up |
| Text | slam and letter bob | slam, no letter bob | slam, no letter bob | fades in by size only (no slam, no bob) |
| Letterbox | slides | slides | none | instant |
| Screen shake | 3 px at the pop | 3 px | none | none |

**Gameplay is identical at every tier.** The same targets, timing, freeze and shield.

### 3.6 Allocates nothing per frame
`PupoPowerFx` is one object built once:
- `arms[16]`, `butterflies[24]`, `targets[16]` (entity references, cleared after use) and `boops[16]`, all objects created at load
- precomputed colour strings
- the "PUPO POWER!" text drawn **once** into a cached canvas (rebuilt only when the canvas resolution changes)
- the rug pattern drawn **once** into a 256 x 48 strip canvas, drawn in slices as it unrolls

**Banned per frame:**
- `new`, array literals, closures and template strings
- `createLinearGradient` / `createRadialGradient`
- `Ink.around` (§7.8)

The arms are drawn as paths (`moveTo` / `quadraticCurveTo`), stroked twice.

The perf test checks this (§7.10).

---

## 4. Pupo levels

### 4.1 Convert levels, don't add them
**Recommendation: convert one existing level per land into a Pupo level.** Rework its middle beat around Pupo, keep its archetype, and leave its id, exits, map stop and postcards' kinds as they are.

Why:
- Adding levels changes maps, `mainCount`, the archetype caps, the 88-level tests and the save. The secrets work is already adding 14 levels and bumping the save to v3.
- Converting keeps every test that counts levels green and needs no map work.

**What a converted level gets:**
- `pupo: 'level'` on its spec
- a small Pupo badge on its map card (a paw), drawn through the map hooks
- 2-3 Nap Boxes
- 1-3 Pupo-only obstacles on the main route, each signposted and taught by what comes before it

**Fitting with the other work in flight:**

| Work | Levels it touches | How Pupo fits |
|---|---|---|
| Maze agent (`sbw/mazes`) | 5-1, 6-2, 8-2, 10-3, 11-1 | **No Pupo level or helper uses them.** |
| Secrets phase 1 (WP-6, Mexico) | 1-1 (Loading Dock past the stage, Wormhole R1), 1-2, 1-4, 1-5, the new 1-7 | The Pupo work on 1-1 (PU-5) is the middle of the level. It is built **after WP-6 merges**, on top of it, in the same file. |
| Secrets phase 2 (G1-G4) | edge zones, Wormholes, Brady Buttons, at least 2 secret rooms per land | Pupo levels avoid the Wormhole and button levels where possible. Overlaps: 4-3 (R8 Rigging at the top edge) and 6-1 (dormant D2 at the top edge). The Pupo work there is mid-level, so the edits don't overlap. **Each Pupo phase-2 group starts after the secrets group for the same lands has merged** (they share `src/29_tour_<cc>_levels.js`). |
| Save | v3 bump in secrets phase 1 | Pupo adds only a field and needs no bump of its own. But **Brady's standing rule is to reset all progress whenever levels change.** Ship the Pupo level conversions **in the same release as the v3 reset** if the timing allows. Otherwise they need a v4 bump. Tell Brady first. |

### 4.2 The Pupo levels (one per land, all different)
| Land | Level | Pupo-only obstacle (on the main route) | Pupo's Nap Boxes | Validator model |
|---|---|---|---|---|
| 1 Mexico | **1-1 Mercado Mayhem** (PARADE). Tutorial, §6. | **The Alebrije Float.** A giant papier-mâché alebrije float (a spotted jaguar-lizard with wings) has jammed the street, 9 tiles tall and filling all three lanes. Its lacquer is too slick to jump on. Pupo climbs its curly striped tail and up its neck, and pokes it on the nose on the way past ("...no... pupo."). | Street lane after beat ① (about 35 % in); backup at the checkpoint before the float | climb strips on the float |
| 2 Ecuador | **2-4 Cacao Works** (FACTORY) | **The Golden Pod.** The cooling-tunnel door opens only with the golden cacao pod, which rides an overhead pod conveyor 7 tiles up with the regular pods. Pupo snatches it as it passes. If he misses, it comes round again in 6 s. | The first catwalk; backup at the press checkpoint | `pupoSnatch` key on a path |
| 3 Brazil | **3-2 Coati Caper** (THIEF) | **The Sloth Bridge.** Quati flees across a river too wide to jump. On the far bank Pupo's cousins hang in a chain from a branch, each holding the next one's foot, and the last one holds out a hand. Pupo grabs the hand and the chain swings them across. Also: a poke catches Quati at range, and the `brSloth` droppers become friends. | Right after the first capybara ride; backup at the caiman checkpoint | post (the hand) plus hooks along the chain |
| 4 Mozambique | **4-3 Baobab Skyline** (SKY) | **The Upside-Down Commute.** The widest gust gap has no island, only a long dead branch from crown to crown with weaver nests dangling under it. Pupo hangs upside down and shimmies under it, while fruit bats hang along it, nose to nose with him ("...excuse me."). | The first crown; backup at the honey checkpoint | bar ghosts |
| 5 Morocco | **5-4 Kasbah of the Brass Owl** (FORT, lead-in only) | **The Beam-End Ladder.** The kasbah tower's mud wall is smooth, but the ends of its wooden floor beams stick out of it in a staggered zigzag, as on real kasbah walls. Pupo zips from beam end to beam end, up to the tower-room window. The goats in the argan tree watch, unimpressed. | Under the argan tree; Pupo waits at the owl arena door | a vertical chain of posts |
| 6 Spain | **6-1 La Tomatina** (HOLD) | **The Soapy Pole.** Plaza 3's barrier lifts only when someone takes the ham off the top of the soaped pole, which is how the real festival's tomato fight begins. Brady slides straight off. Pupo climbs it, squeaking, and reaches up for the ham. The last wave then starts. | By the tomato truck at the start; backup at the plaza 2 checkpoint | a climb strip plus a fetch of the ham key; the barrier is a lock |
| 7 France | **7-2 Lavender Magpie** (THIEF) | **The Dovecote.** For the third catch the magpie hides in a tall Provençal pigeon tower and peeks out of a different hole every 2 s. The holes are 5-7 tiles up a smooth stone tower. From the dovecote ledge Pupo pokes into the right hole, and out it tumbles with the stamp. | The farmhouse yard; backup at the distillery checkpoint | the thief stop's stamp as a reach target (tickle-style, line of sight into the holes) |
| 8 Netherlands | **8-1 Polder Pumps** (SWITCH) | **The Drawbridge Chain.** The canal's drawbridge is stuck up. Its pull chain hangs from the balance beam, out over the high water, 6 tiles from the bank. Pupo pulls it, the bridge comes down, and the herons are annoyed. Pulling it again lifts it, for the low-water route. | The first houseboat; backup at the valve checkpoint | a toggle-group pull handle |
| 9 Indonesia | **9-6 Orangutan Canopy** (SWING, secret) | **Thorny Rattan.** The vines run out over a ravine. Only spiny rattan canes hang across it. They hurt Brady (they are spike tiles), but Pupo's hooked claws grip them. A mother orangutan and Pupo trade a long, slow look: "...nice... arms." | The start ledge; backup at the catapult checkpoint | hooks on spike tiles |
| 10 Vietnam | **10-4 Son Doong Flood** (RISE, water) | **The Cave Pearl.** The skylight-garden door needs the cave pearl. It lies in a flooded rimstone side-pool behind a rusty grille. Brady can't get through the bars, but Pupo's arm reaches through them. Pupo also swims the rising flood fast (§1.3). | The first dry ledge; backup at the reel checkpoint | a fetch through a `pupoGrille` |
| 11 Japan | **11-3 Night of Things** (PHASE) | **Bamboo Bend.** A stream too wide to jump. Pupo climbs a tall bamboo stalk until it bends under his weight and lowers him gently onto the far bank. At night the hopping umbrella spirits have no belly buttons, and Pupo is baffled. | The grove start; backup at the wind-chime checkpoint | a `pupoBend` edge |
| 12 Nepal | **12-3 Blizzard Night** (SNEAK) | **The Ticklish Yeti.** A huge yeti sleeps across the only pass, snoring snow. Brady bounces off it. Pupo finds its belly button under the fur, one slow poke: it giggles in its sleep, rolls over and slides away down the slope on its back, still asleep. | The first boulder; backup at the shelter checkpoint | a tickle gate (lock) |
| 13 Antarctica | **13-3 Aurora Station** (FORT, lead-in only) | **Reel in the Floe.** The way on is across the station harbour, and the stepping floe has drifted out of reach. Pupo grabs its mooring rope (the fish-shaped float) and reels the floe in to the dock. The penguins on it look put out. Pulling again pushes it back out. | The station gate; Pupo waits at the plough arena door | a toggle-group pull (the floe's two positions) |
| 14 World 22 | **22-1 The Station of Clocks** (PHASE) | **Sloth O'Clock.** The station's giant clock face is the only way to the upper platform. Pupo grabs the minute hand at 2:22 and rides it round as time crawls, then lets go at the top ("...time... flies."). | The platform start; backup at the strike-the-clock checkpoint | moving hook (orbit ghosts and reach edges, as a ring) |

All 14 obstacle ideas are different, and they use every arm move:
- climb: 1-1, 6-1
- snatch: 2-4
- chain swing: 3-2
- hang: 4-3
- zip ladder: 5-4
- reach into holes: 7-2
- pull: 8-1, 13-3
- hooks that hurt Brady: 9-6
- reach through bars: 10-4
- bend: 11-3
- tickle: 12-3
- riding a moving hand: 22-1

**Rules for every Pupo level:**
- **Postcards** stay reachable with Pupo, using the Nap Boxes in the level. At most one postcard may sit behind a Pupo obstacle, and none behind an optional Pupo route.
- **Secrets** (rooms, Wormholes) never need Pupo. They follow fair-hiding rule 2 of the secrets doc: no power is needed that the level doesn't hand out.
- Every **Pupo obstacle comes after at least 15 s of riding** since the nearest Nap Box. It is signposted from the main route by its looks (§2.10), and the paw marker shows on it as soon as it is in reach.

### 4.3 Levels where Pupo is an optional helper
These levels get `pupo: 'helper'`: one Nap Box and one Pupo-only bonus (coins or a 1-up, **never a postcard, exit or key**). They must pass the validator without Pupo.

| Land | Level | Nap Box | Pupo-only bonus |
|---|---|---|---|
| Mexico | 1-5 Fiesta de la Hacienda, lead-in | the patio | hooks among the swinging piñatas lead to a candy coin arc; Pupo waits at the arena door |
| Ecuador | 2-2 Canopy of Baños | the start tree | a vine-less stretch of cacao branch posts to the 1-up |
| Brazil | 3-3 Iguaçu Falls | band 1 | a cecropia climb strip beside the second fall to a coin column |
| Mozambique | 4-6 Buried Dhow | the dhow's deck | a mast climb to the crow's-nest coins |
| Morocco | 5-3 Chefchaouen Blue | the first blue stair | laundry-line bars by day to a roof-terrace 1-up |
| Spain | 6-7 Molinos de La Mancha | the first mill | hang under a stopped sail (wind off) to the coins |
| France | 7-1 Paris Morning Rounds, bakery and café sub-areas only | the plaza | baguette hooks across the bakery ovens to coins |
| Netherlands | 8-6 Windmill Row | the start mill | a sail-lattice climb to a coin ring |
| Vietnam | 10-6 Mekong Floating Market | the plaza | lantern hooks over the canal to the 1-up |
| Japan | 11-4 Neon Tower | the street | a sign-ledge pull handle drops a gondola with coins (it stays clear of the Rigging, R18 / B5) |

Indonesia, Nepal, Antarctica and World 22 get no helper level. Their Pupo level is enough, and their other levels are mostly `noPupo` archetypes.

### 4.4 No level can be made unfinishable, with or without Pupo
- **Without him:**
  - Every Pupo obstacle has a Nap Box on its near side, after the previous checkpoint and reachable without Pupo.
  - Boxes refill (§1.1).
  - Respawns give Pupo back (§1.2).
  - The validator proves each checkpoint can reach the exit starting **without** Pupo (§7.6, check `CP STRANDS`).
- **With him:**
  - Pupo never takes anything away: Brady can hop off anywhere (Down + Jump, or hold Down).
  - The riding box fits every 2-tile passage, and the flop fits 1-tile passages.
  - `noPupo` areas park him automatically.
  - He is never carried into another level, so "arriving with him" only happens inside a level, where all of the above holds.
- **Helper and ordinary levels** pass the validator with Pupo turned off. Pupo-only bonuses never hold a postcard, exit, key or area (check `HELPER NEEDS PUPO`).

---

## 5. Controls and HUD on a phone

### 5.1 Buttons while riding
| Control | On foot (today) | On Pupo |
|---|---|---|
| Stick left / right | walk / run | amble / lope; pump a swing; shimmy a bar |
| Stick up | doors, aim (lasers) | doors; aim up; climb up; reel in a swing |
| Stick down | crouch (big), drop through with Jump, dig with Jump | flop (crawl); aim down in mid-air; climb down; let out a swing |
| **Jump** (`▲`) | jump; jump powers in mid-air | jump; let go of a hook, bar or climb (leap off); **Down + Jump: hop off** (drop through on a one-way floor) |
| **Action** (`◉`) | the picked power (throw, smoke, lasers, gear), kick a box | **stretch**: poke / grab / zip / pull / fetch / tickle, whatever the paw marker shows |
| **Pupo Power** (new round button) | hidden | fires when full |
| Hold Down for 1 s, standing still | crouch | hop off (anywhere) |
| Keyboard | arrows / WASD, Space / Z / K, X / J / Shift | the same, plus **F or L** = Pupo Power |

### 5.2 Where the Pupo Power button goes
It **takes the power-picker chip's place**: above the Action button, toward the screen centre (`TourPicker.chip()`'s position).
- Radius `clamp(L.r * 0.62, 22, 34)`, slightly larger than the chip.
- Touch radius 1.3x, mirrored for the left-handed layout.
- The chip is hidden while riding, because Action belongs to Pupo, so they never overlap. Patch `TourPicker.visible()` to return false while riding.
- The right thumb reaches both Action and Pupo Power without moving off the button cluster.
- It is registered through `Input.hud` (`[{ id: 'pupo', x, y, r }]`, read from `Input.hudPressed.pupo`). It is drawn by wrapping `Input.overlay`, since `Input.draw` doesn't draw `hud` buttons.
- The Play scene re-asserts `Input.hud` every frame while riding and sets it to `null` otherwise. The map sets it to `null` when it leaves.

### 5.3 Portrait
- The controls panel is below the game picture. The button is clamped below the game rectangle, exactly as the chip is (`TourPicker.chip()` already does this).
- The view is narrower, so:
  - auto-targets and Pupo Power use only what is on screen
  - **level rule:** in Pupo obstacles, consecutive grab points are at most 4 tiles apart, so the next one is always on screen in portrait (390 x 844)
  - the paw marker is drawn 25 % larger
- Camera:
  - while swinging, the look-ahead leads in the swing direction (0.13 of the view, as at Near zoom)
  - while climbing, Brady sits at 60 % of the view height, to show more above
- Tutorial labels use `TourPicker.label`, which already clamps to the screen width.

---

## 6. Tutorial: the first Pupo in Mexico (1-1 Mercado Mayhem)
There are no text walls. There are at most six one-line labels, each shown once ever (`Save.data.tips.pupo*`). Every other lesson comes from the level's layout and the paw marker.

1. **The box.** At the street lane after beat ① (about 35 % in), a Nap Box snores on a crate between two stalls, rattling. The player already knows gift boxes, so they bump it.
2. **The yawn.**
   - Pupo uncurls. His yawn stretches both arms 4 tiles out and accidentally pokes a pepper off the next stall: it giggles and keels over. *Lesson: his arms stretch, and that defeats enemies.*
   - He sits, says "...pupo." and pats his back.
   - Label: **"HOP ON"** with a down arrow.
   - Riding him for the first time fills the meter (1.0): "...I had... a good nap."
3. **Poke.**
   - Two chihuahuas yap in from the right, 5 tiles apart.
   - The paw marker sits on the first one, and the Action button shows the pointing claw.
   - Label: **"◉ POKE"** (gone after the first poke).
   - The belly-button giggle plays on the first one.
4. **Reach up.**
   - A candy piñata hangs on a rope 6 tiles over the street, too high to jump to.
   - Stand under it: nothing is in the forward cone, so the marker appears only when the stick goes up. Label: **"▲ STICK + ◉"**.
   - Pupo yanks the piñata and candy coins rain down.
5. **Grab and swing.**
   - The awning bounces Pupo onto the roof lane, where the papel-picado cords span the first gap. One knot has a brass ring, and the marker lands on it.
   - Press Action and he swings. Label: **"▲ JUMP TO LET GO"**.
   - The second gap has two knots, so chaining is discovered by doing it.
6. **Climb (the required obstacle).**
   - The Alebrije Float jams the plaza entrance, with the backup Nap Box at the checkpoint just before it.
   - Walking into its tail makes Pupo grip it on his own. Label: **"HOLD UP"**.
   - At the top of its neck he pulls up onto the float's back and drops into the plaza.
7. **Pupo Power.**
   - In the plaza (beat ③) the meter is full. A "stall party" of 6 peppers and elotes marches in from both sides.
   - The Pupo Power button bobs. Label: **"TAP PUPO!"** with an arrow pointing at it.
   - The whole show plays.
8. **Hop off** (taught later, by need). The first time the player holds Down on Pupo for 1 s, the label reads **"▼ + JUMP: HOP OFF"**.

The rest of 1-1 plays as it does now, with Pupo or without him. The Loading Dock and Wormhole R1 (secrets WP-6) still lie past the gate, and Pupo can come along.

---

## 7. Engine and format changes

### 7.1 New files (load order)
| File | Sorts after | Contents | Owner |
|---|---|---|---|
| `src/05e_pupo.js` (exists, uncommitted, on `sbw/story-piwi`) | 05d | Pupo's base art. Needs the **steed poses and anchors** in §7.7. | story agent |
| `src/28_tour_p_pupo.js` | `28_tour_n_mazes.js`, and secrets `k` `l` `m` | `PupoRide`: Nap Box (contents `'pupo'`, the `napBox` overlay entity, refill), `pupoFree` (Pupo sitting or sleeping, an entity), mount and dismount, riding physics, flop, drowsy and nap, grabbers, how powers combine, doors / areas / respawn / `noPupo`, drawing the ride, the action-button icon, tips, the map follower | PU-1 |
| `src/28_tour_pa_reach.js` | `p_pupo` (`_` sorts before `a`) | `PupoReach` (geometry shared with the validator: shoulder, line of sight with grilles, cone, scoring, swing release math), the arms runtime (poke / grab / zip / swing / pull / fetch / tickle / climb / hang / bend / snatch), the arm renderer, the level objects and their pieces | PU-2 |
| `src/28_tour_pb_power.js` | `pa` | `PupoPower`: meter, button, keys, targets, freeze, shield, `PupoPowerFx` (pools, cached text and rug, tiers, calm) | PU-3 |
| `src/28_tour_pc_pupoval.js` | `pb` | the Pupo validator module (§7.6), registered on `Validator.mods` | PU-4 |

All four files define objects at load and touch the engine only by wrapping prototypes and functions that already exist when they load. Write each file elsewhere, run `node --check`, then move it into `src/`.

### 7.2 How it plugs in (wrapping, like `28_tour_di_jumps.js`)
Pupo's wrappers load last, so they are outermost and run first.

| Wrapped | By | Why |
|---|---|---|
| `Player.prototype.update` | p, pa | While riding: build a reused scratch `inp` with `actionPressed`, `down` and the down-with-jump presses cleared, so the inner code never crouches, drops, digs, kicks or fires a picker power. In climb / hang / grab / zip / pull / power modes, run Pupo's own update and **return early**, as `TourRing` does. Otherwise call the inner update, then Pupo's after-step (arms, ledge catch, flop, meter). |
| global `playerPhysicsFlip` (a function declaration, reassignable as `drawBrady` is in `di_jumps`) | p | When `body.pupoRide` is set: `opts.speedMul *= 0.77`, `opts.swimMul *= 1.6`. **The validator's simulated bodies set `pupoRide` too, so game and validator share one rule.** |
| `Player.prototype.hurt` | p | The hit order of §1.4 (Pupo before HANDS and FEET; the star and the shield are checked first). |
| `Player.prototype.setPower` | p | While riding, grow or shrink Brady's art but re-apply the 28 x 58 riding box. |
| `Player.prototype.airJump` | p | Return false while riding. |
| `Player.prototype.updateAnim`, `drawBrady` | p | Pose `ride` (Brady seated), `hang`, `climb`. A reused options object, not `Object.assign`. |
| `Player.prototype.draw` | p | See §7.7. |
| `Play.prototype.enterPortal` / `loadArea` / `setCheckpoint` | p | Carry the riding state and meter, as `jumpCarry` does. The checkpoint object gets `pupo` and `meter`. `Play` is rebuilt on respawn, so the state lives on the checkpoint. |
| `Play.prototype.bumpBlock` | p | Contents `'pupo'`: open the Nap Box instead of spawning an item. |
| `Play.prototype.update` | pb | During Pupo Power, run only the effect, the camera and the particles. |
| `Play.prototype.drawHUD` | pb | The meter icon for keyboard players. |
| `Input.overlay`, `Input.actionArt`, `TourPicker.visible` | p, pb | Draw the Pupo button, show the paw verb icon, hide the chip while riding. |

`TourHooks` (secrets WP-1) is used where it fits:

| Hook | Use |
|---|---|
| `areaLoaded` | cache the area's Pupo objects; place Pupo after a respawn or a parked door |
| `playUpdate` | the grabber rule |
| `levelClear` | Pupo climbs into his box |
| `playerDie` | Pupo returns to his box |
| `camera` | the swing look-ahead; hold the camera during Pupo Power |
| `owDraw` (WP-2) | the map follower and the Pupo-level badge |

Every use is guarded with `typeof TourHooks !== 'undefined'`, so Pupo also works before secrets lands. In that case it falls back to wrapping `loadArea`.

**Extra hooks needed:**
1. **Optional, in `src/11_player.js` (owned by secrets WP-1).** Replace the dead Slothy branch of `Player.draw` (lines 545-554) with `if (this.mountDraw) { this.mountDraw(ctx, t, o); }`, plus `|| this.wideInk` in the `plain` test (line 572). See §7.7. Only needed if the no-edit route there proves fragile.
2. **Needed, in `src/09_validate.js`.** The `Validator.mods` extension API of §7.6.

No other shared file is edited.

### 7.3 Level spec additions
```js
// level
{ n: 1, name: 'Mercado Mayhem', arch: 'parade', pupo: 'level', ... }     // 'level' | 'helper'
// area
{ id: 'mercado', gen: 'layered', pupoOk: true, script: [ ... ] }          // pupoOk overrides the noPupo default (§1.7)
```

**Pieces** (all `(st, opts) => newX`; in `pa_reach.js` except `napBox`, which is in `p_pupo.js`):

| Piece | Options | Builds |
|---|---|---|
| `napBox` | `{ y }` | a `QBLOCK` with contents `'pupo'` at `y` rows above the floor, plus the `napBox` spawn |
| `pupoGap` | `{ w, hooks: n, kind: 'hook' \| 'post', look, under: 'pit' \| 'water' \| 'spikes' }` | a gap `w` wide with `n` grab points spaced ≤ 4 tiles |
| `pupoClimb` | `{ h, look, top: true }` | a wall or prop `h` tall with a climb strip and a ledge at the top |
| `pupoBars` | `{ w, look, under }` | a bar `w` long over a hazard |
| `pupoPull` | `{ g \| lock, look, once, dx, dy }` | a handle out of reach of Brady alone, and the toggle group or lock it drives |
| `pupoTickle` | `{ lock, look, belly: [dx, dy] }` | the sleeping blocker (its lock tiles) |
| `pupoFetch` | `{ key \| item \| gold, h, grille }` | a target high up, or behind a grille |
| `pupoBend` | `{ h, to: [dx, dy], look }` | a bending stalk and its landing spot |
| `pupoSnatch` | `{ key, path: [[dx, dy], ...], period }` | a moving key |

**Entity types** (`ENTITY_TYPES`):
- `napBox`, `pupoFree`
- `pupoGrab { kind, look, orbit: { r, period, phase } | path }`
- `pupoClimb { h, look, bend: { to } }`
- `pupoBar { w, look }`
- `pupoHandle { g, lock, look, once }`
- `pupoTickle { lock, look, belly }`
- `pupoGrille { w, h }`
- `pupoSnatch { key, path, period }`

All of them are ordinary spawns, so the built area carries them in `area.spawns` with no builder change. The validator reads them from there.

**Stamps:** no new letters and no new legend kinds. Use the existing kinds:
- `h: ['spawn', 'pupoGrab', { kind: 'hook', look: 'mxCord' }]`
- `x: ['piece', 'napBox', {}]`
- `c: ['piece', 'pupoClimb', { h: 8, look: 'mxAlebrijeTail' }]`

**Enemy config:** `belly: true` for mammals (§2.2).

**Skins:** each land's looks are registered through the existing per-country `skins` (`TourObj.skin(ctx, this, skinName)`) in `src/29_tour_<cc>.js`.

### 7.4 Save data
```js
Save.data.tour.pupo = { met: true }        // set on the first mount ever; the map follower and the tutorial's "full meter" key off it
Save.data.tips.pupoHop / pupoPoke / pupoReach / pupoGrab / pupoClimb / pupoPower / pupoOff   // first-time labels
```
- Nothing else persists. The meter, the riding state and parked Pupos live on the Play scene and the checkpoint.
- No save-key bump is needed for Pupo's fields: guard `Save.data.tour.pupo` for `undefined`.
- Level conversions follow Brady's reset rule (§4.1).

### 7.5 Constants (one table, in `PupoRide.K`, shared by the game and the validator)
```
DIM 28x58 · FLOP_H 30 · SPEED_MUL 0.77 · SWIM_MUL 1.6 · JUMP_BOOST 1.0 · FLOP_SPEED 2.8 t/s
REACH 5 t · POKE 4 t · CONE ±40° (neutral ±50°) · ARM_OUT 30 t/s · ARM_BACK 22 t/s · POKE_HOLD 0.10 s · POKE_COOL 0.20 s
SHOULDER (cx + facing*6, y + 14) · HOOK_LEN 2.5 t (1.5..5) · SWING_G 40 t/s² · PUMP 0.6 rad/s² · RELEASE x1.15 +3 t/s up, max 14 t/s
ZIP 16 t/s · PULLUP 0.3 s · CLIMB_UP 3.2 t/s · CLIMB_DOWN 4.5 t/s · LEAP (6.5, -13) t/s · SHIMMY 2.6 t/s
LEDGE ahead 2 t, up 2 t, down 0.5 t · DROWSY 8 s (reach 3.5, cool 0.5, climb 2.2, release 10) · METER 30 s, +0.10/poke, -0.25/hit
POWER 2.6 s freeze, 16 targets, view+1 t, shield 1.5 s
```

### 7.6 Validator: understanding mounting, reach, grapple and climb
**Approach.** Add one bit to the search state, **`m` (riding Pupo)**, next to the flip bit `f`. Model everything Pupo adds as the project already models the swing ring:
- **ghost one-way floors that exist only while `m = 1`**
- **edges that exist only while `m = 1`**

Under-approximate wherever simulating would be hard (the ledge catch is ignored, and so is current strength in water). The validator may then miss a Pupo route, but it never claims a route that isn't there.

**Changes to `src/09_validate.js`** (by PU-4, after secrets WP-1 has merged):
1. **`Validator.mods = []`**, a tiny registry: `{ proxy(area, A, st), dims(st), physBody(b, st), expand(api, node), counts(thing, st) }`. With no mod registered the search is byte-identical: `sbw_snapshot` and every `validate_levels` result stay the same.
2. **Node key:** `((((mask * 2 + f) * 2 + m) * 64 + ai) * 4096 + tx) * 1024 + ty` (safe below 2^53 for masks up to 2^12).
3. **Proxies** are keyed by `(ai, mask, m)`. With `m = 1` the Pupo mod adds:
   - **climb ghosts:** one per row along each `pupoClimb`, at the strip's column, on the side it is reached from
   - **bar ghosts:** a row 3 tiles under each `pupoBar`
   - **hook ghosts:** 5 per hook along a 2.5-tile swing, as `ring` does; orbiting hooks get 8 points around the orbit
4. **Body and physics** at `m = 1`: `D = PUPO_DIM` (28 x 58), simulated bodies get `pupoRide = true` (so `speedMul` 0.77 applies), and jump powers stay unused (as today).
5. **Expand a node** (Pupo mod):
   - **Mount.** At `m = 0`, if the node's body overlaps a tile next to or below a Nap Box (contents `'pupo'`, any open side), push the same node with `m = 1`.
   - **Hop off.** At `m = 1`, push the same node with `m = 0`.
   - **`noPupo` areas.** A door, seam or edge into one pushes the target with `m = 0`.
   - **Reach edges** at `m = 1`, from the standing body's shoulder. For each target within `REACH` in line of sight (the shared `PupoReach.los`, which honours grilles):
     - a hook ghost: push that ghost
     - a post: push its top
     - a handle: push the same node with `mask ^ (1 << g)`, or add the handle's lock key to `held`
     - a key, postcard (gold), coin, or the stamp of a thief stop: mark it reached
     - a tickle belly spot (within `POKE`): `held.add('tickle:<lock>')`
     - a snatch: any point on its path within reach
     - a bend: push the landing spot
6. **`counts`:** vkeys and switches flagged `pupo: true` count only at `m = 1`.
7. **Budget:** contents `'pupo'` are not item blocks (rules 1-3 and 8 ignore them). `sbw_items_test` treats a `'pupo'` box as "Pupo emerges", not an item to collect.

**`tools/validate_levels.js` additions:**

| Check | Kind | Rule |
|---|---|---|
| `PUPO LEVEL <id>: THE EXIT DOES NOT NEED PUPO` | warning | `pupo: 'level'` levels are validated a second time with `opts.noPupo` (Nap Boxes ignored); the main exit should then be unreachable |
| `HELPER NEEDS PUPO <thing>` | error | `pupo: 'helper'` and ordinary levels must reach every exit, postcard, key and area with `opts.noPupo` |
| `CP <n> STRANDS BRADY WITHOUT PUPO` | error | from every checkpoint of a Pupo level, a run with `opts.start` at the checkpoint and `m = 0` must reach the main exit (the Nap Boxes are in the level, so this proves each one sits on the near side) |
| `PUPO OBJECT <type> IN A NOPUPO AREA` | error | a Pupo object in an area where Pupo can't go |
| one Pupo level per land, ≤ 2 per land with helpers | `--rules` warning | |
| no `pupo` key on maze-agent levels until that branch merges | `--rules` warning | |
| `guardMax` raised to 160000 | when a level has `pupo` | Measured cost: about 2x nodes on Pupo levels only. Report the time in the PU-4 commit. |

**Fallback where simulation is too hard: scripted runs.**

`tools/sbw_pupo_shots.js --checks` (real game, WebKit, touch layout at 844 x 390 and 390 x 844) runs a **lab** of one fixture per mechanic (`tools/fixtures/sbw_pupo_lab.js`), plus a **route script** for each Pupo obstacle in a shipped level.

A route script is a list of steps:
```js
{ at: 'cp:2', ride: true, hold: 'right', until: 'climb' }, { hold: 'up', until: 'top' }, ...
```
It is kept in `tools/pupo_routes.js`. Each step checks a state (mode, area, position) before the next starts, and screenshots are saved at each obstacle.

This covers what the validator approximates:
- moving hooks
- the exact swing release
- the snatch timing
- the thief catches in 3-2 and 7-2
- the yeti and anteater roll-aways
- Pupo Power

### 7.7 Pupo's art: what PU-1 needs from the story agent
Pupo must be **steed-sized**. On all fours his back is about 1.1 tiles high and his body about 1.6 tiles long, with Brady seated on top: the pair is about 2 tiles tall. The story file currently draws him about a third of Chinka-O's height, as a pet clinging to her back.

**Requests to `sbw/story-piwi` for `src/05e_pupo.js`:**
1. **Poses:**
   - `steedIdle`, `steedWalk` (phase), `steedLope` (phase), `steedJump`
   - `climb` (phase), `hang` (exists, extended to a two-hand bar hang), `flop`, `swim` (phase)
   - `drowsy`, `sleep`, `boxPeek` (claw tips under the lid), `yawn` (arms out), `rear` (Pupo Power)
2. **`armsOff: true`**, which draws no front arms. PU-2's renderer draws stretch arms in the art's colours.
3. **`Pupo.anchors(pose, t, out)`**, which fills a passed-in object (no allocation) with:
   - `shoulderF`, `shoulderB`
   - `seat` (where Brady's hips go)
   - `belly` (the belly button)
   - `mouth`
   - `eyeL`, `eyeR` and `eyeR` radius
4. **Eye style `spiral`** with an angle parameter, or else PU-3 draws the spirals over the eye anchors.

Until the art lands, PU-1 draws a stand-in with the existing `drawSlothy` (`src/22_cast.js`, in the world build) at scale 1.6, with fixed anchors.

**Story note for the story agent.** `STORY_PIWI.md` §2b has Pupo carried off with Chinka-O and chooses against making him Brady-O's companion. Brady has now asked for the opposite. A suggested fix:
- When the hook scoops Chinka-O, Pupo, clinging to her tutu, loses his grip very slowly ("sloths do not let go... usually").
- He drops into a stack of cartons in the Mexico market and falls asleep in one.
- He has napped in boxes ever since, which is why Brady keeps finding him in them.
- The per-land "Pupo's verdict" gags still work, with Pupo poking each act's tummy after the boss.
- The finale reunion becomes Pupo poking *Chinka-O's* pupo: "...I missed it."
- Make him big enough to ride, and keep the joke that he once clung to a ballerina's back with his feet dragging.

**Drawing the ride without editing `11_player.js`.**
- `Player.draw`'s old Slothy branch already seats Brady 26 px up on a mount and uses the roomy ink box.
- Pupo's draw wrapper sets `this.mounted = true` **only for the duration of the inner draw call**, and reassigns the global `drawSlothy` to route to `Pupo.draw` (steed pose) while a flag is set.
- The `mounted` flag is never set during `update` (see §9 of the "harder than it looks" list).
- If this proves fragile, use the optional `mountDraw` / `wideInk` hook (§7.2).

### 7.8 Performance
- **Stretch arms are never inked with `Ink.around`.** Ink's scratch canvases are sized to the box they ink. A 5-tile arm inside Brady's ink box would make every frame's ink pass several times larger: the same failure as the old Brazil lag (`docs/PERFORMANCE.md` item 1). Each arm is instead drawn straight to the frame:
  1. one path (`moveTo`, then one `quadraticCurveTo` for its sag)
  2. stroked in ink at width w + 3
  3. then in fur colour at width w, with round caps
  4. fur tufts as 3 px strokes every 10 px along the curve, computed in the loop
  5. a paw of fixed shapes at the end
- **Pupo's body** goes through `Ink.around` like other characters, in a box fitted to the steed poses (measure it as `Player.draw` did for Brady). Pass `opts.key = pose + phase` so a still Pupo is a held picture (`Ink.statics`). At Medium and below he is re-inked at 30 Hz (`Ink.every`).
- **Auto-target search:**
  - runs at 15 Hz while riding, and on every Action press
  - loops `g.entities` once, plus the area's Pupo objects (cached per area at `areaLoaded` into a reused array)
  - keeps the best candidate in module fields, with no sort and no arrays
  - checks line of sight with a tile walk and no allocation
- **The riding draw** uses a reused options object for `drawBrady` and `Pupo.draw`.
- **Nap Boxes** are held ink pictures. `pupoFree` asleep re-inks only on its slow breathing frames (4 frames).
- **Pupo Power:** §3.6. Freezing the world makes those frames cheaper than normal play.
- **The validator:** about 2x the search on Pupo levels, nothing elsewhere.

### 7.9 Small traps the implementer must handle
| Trap | Handling |
|---|---|
| `invuln` makes `Player.draw` flicker Brady at 8 Hz | Pupo's grace after the first hit and the post-power shield use `p.pupoShield`, handled in the `hurt` wrapper, not `invuln`. Brady's 2 s after a nap keeps the normal `invuln` (and its usual flicker). |
| Enemies only think inside the active window | All of Pupo's interactions are on screen, so this is fine. Tickle blockers and handles must not need to think: their changes run from the player side. |
| Rising water, autoscroll and timed rooms | Pupo Power freezes them. Check that the secrets room clocks (`roomClock`) also respect the freeze: they re-base their time on `play.t`. |

### 7.10 Tests to add
| Test | Owner | What it checks |
|---|---|---|
| `tools/sbw_pupo_test.js` (node) | PU-1 | The hit state machine (ride, drowsy, nap, wake); the hit order with star, shield, hat, HANDS and FEET; mount and dismount box sizes; `setPower` keeps the riding box; door / respawn / `noPupo` carry; the physics wrapper's speed and swim scaling; box refill |
| `tools/sbw_pupo_reach_test.js` (node) | PU-2 | Line of sight with grilles; the cone and target priority (enemy within 2 tiles first, then score); swing release velocities; zip and pull-up; climb and leap; bend arc |
| `tools/sbw_pupo_power_test.js` (node, plus a WebKit part) | PU-3 | Meter math; target pick (16 cap, view + 1 tile, bosses and friends excluded, `hit → false` stunned); freeze and shield timing; tier and calm variants draw without errors; **no allocation:** Chromium with `--js-flags=--expose-gc`, 300 frames of the show, heap growth under 50 KB after the first run |
| `tools/sbw_pupo_val_test.js` plus fixtures (node) | PU-4 | A gap that needs Pupo: passes with a box, fails without one; post, hook, climb, bar, pull, tickle, fetch through a grille, bend, snatch, each with a negative; a helper that needs Pupo flags `HELPER NEEDS PUPO`; a stranding checkpoint flags `CP STRANDS`; with no mods registered, `validate_levels` is byte-identical to before |
| `tools/sbw_pupo_shots.js --checks` (WebKit) | PU-5 | The lab of every mechanic, the 1-1 tutorial route script, screenshots at 844 x 390 and 390 x 844 |
| `tools/sbw_perf_test.js` | PU-5 | Two scenarios added: riding in 1-1 and Pupo Power in the 1-1 plaza. Rewrite the baseline with the reason in the commit. |

**Must still pass:** the full list in `docs/handoff/SBW_RELAY.md`: `validate_levels --rules`, `gameplay_test`, `boss_test`, `apps_test`, `sbw_graphics_test`, `sbw_atlas_test`, `sbw_toolkit_test`, `sbw_powers_test`, `sbw_overworld_test`, `sbw_soak_test` (add the lab and the Pupo levels to its short list), `save_test`, `sbw_snapshot`, `levels_br_mz_test`, `levels_aq_w22_test`, `sbw_toolkit_shots --checks`, `sbw_items_test`, `sbw_perf_test --short`.

---

## 8. Phased build plan
Each package gets its own worktree and branch (`sbw/pupo-<pkg>`), builds privately with `BRADY_DIST=<dir>`, and runs suites one at a time on a quiet machine. Sizes: S < 1 day, M 1-3 days, L 3-6 days (agent time).

### 8.0 Before starting
- The Pupo core (PU-1 to PU-3) are new files and can **start now**.
- PU-4 waits for **secrets WP-1** to merge, because it then owns `09_validate.js` and `validate_levels.js`.
- PU-5 waits for **secrets WP-6** (Mexico) and the **Pupo art** from `sbw/story-piwi`.
- The interface between the packages is in §7.2, §7.3 and §7.5. Each package mocks what it needs until the real one lands.

### 8.1 Phase 1: mount core, stretch arms, Pupo Power, the validator, and 1-1 with the tutorial
| WP | Name | Owns (only this package edits these) | Depends on | Tests to add or pass | Size |
|---|---|---|---|---|---|
| **PU-1** | Mount core | new `src/28_tour_p_pupo.js`; new `tools/sbw_pupo_test.js` | none to start (uses a `drawSlothy` stand-in); `05e_pupo.js` steed poses to finish | `sbw_pupo_test`; `sbw_powers_test`, `sbw_items_test`, `gameplay_test` unchanged (Pupo isn't in any shipped level yet) | L (4 days) |
| **PU-2** | Stretch arms and level objects | new `src/28_tour_pa_reach.js`; new `tools/sbw_pupo_reach_test.js`; new `tools/fixtures/sbw_pupo_lab.js` (one fixture per object and per mechanic) | PU-1's `PupoRide` API (§7.2; stub it until it lands); `05e` anchors | `sbw_pupo_reach_test`; the lab builds with `sbw_toolkit_test`'s spec checks | L (4-5 days) |
| **PU-3** | Pupo Power | new `src/28_tour_pb_power.js`; new `tools/sbw_pupo_power_test.js` | PU-1 (riding state), PU-2 (the arm renderer, reused for the many arms), `05e` anchors and the `rear` pose | `sbw_pupo_power_test` including the no-allocation check; shots of every beat at High, Medium, Low and Calm | M (2-3 days) |
| **PU-4** | Validator | `src/09_validate.js` (`Validator.mods`, the `m` bit, per-state proxies and bodies; **after secrets WP-1 merges**); new `src/28_tour_pc_pupoval.js`; `tools/validate_levels.js` (the Pupo checks of §7.6); `tools/sbw_items_test.js` (one line: `'pupo'` contents); new `tools/sbw_pupo_val_test.js` and its fixtures | secrets WP-1 merged; PU-2's spawn formats and `PupoReach` geometry | `sbw_pupo_val_test`; **`validate_levels --rules` and `sbw_snapshot` byte-identical** on shipped levels; `sbw_contract_test` (secrets) still passes | M-L (3 days) |
| **PU-5** | Mexico 1-1, tutorial, integration | `src/29_tour_mx_levels.js` (1-1 only); `src/29_tour_mx.js` (Mexico skins: the Nap Box tag, alebrije float, papel-picado knots, piñata, churro handle; `belly: true` on the mammals); new `tools/sbw_pupo_shots.js`; new `tools/pupo_routes.js`; `tools/sbw_perf_test.js` scenarios and `tools/perf_baseline.json`; the soak test's short list | PU-1 to PU-4 merged; secrets WP-6 merged (same file); story art merged | `validate_levels 1-1` (including the `CP STRANDS` and `PUPO LEVEL` checks); `sbw_pupo_shots --checks`; the full suite; screenshots of every tutorial beat in landscape and portrait, **looked at before merging** | M (3 days) |
| PU-A (story agent) | Steed art | `src/05e_pupo.js` | none | the story preview sheet with the new poses; shown at phone size | S-M |

**Order:** PU-1, PU-2 and PU-3 in parallel, then PU-4 (once secrets WP-1 has merged), then PU-5. Merge, run the full suite, look at the shots, then deploy. The 1-1 change rides on the secrets v3 save reset if possible (§4.1). Tell Brady before any reset.

### 8.2 Phase 2: rollout across the lands (4 groups in parallel)
Each group owns only its lands' `src/29_tour_<cc>_levels.js` (the Pupo level, the helper level, any `pupoOk` overrides) and `src/29_tour_<cc>.js` (skins of §2.10, `belly: true` on mammals), plus its entries in `tools/pupo_routes.js`. **Each group starts after the secrets phase-2 group for the same lands has merged**, because they share those files.

| Group | Lands | Pupo levels | Helpers | Size |
|---|---|---|---|---|
| P2-G1 | ec, br, mz | 2-4, 3-2, 4-3 | 2-2, 3-3, 4-6 | L (3-4 days) |
| P2-G2 | ma, es, fr | 5-4, 6-1, 7-2 | 5-3, 6-7, 7-1 | L (3-4 days) |
| P2-G3 | nl, id, vn | 8-1, 9-6, 10-4 | 8-6, 10-6 | L (3 days) |
| P2-G4 | jp, np, aq, w22 | 11-3, 12-3, 13-3, 22-1 | 11-4 | L (3-4 days) |
| P2-M (optional) | the map | the map follower and the Pupo-level badge (the `owDraw` hook, in `p_pupo.js`; coordinate any layout key with the map agent) | none | S |

**Every group must pass, per level:**
- `validate_levels <ids>`, with all Pupo checks
- `sbw_pupo_shots --checks` with its route scripts
- `sbw_snapshot` updated for the changed levels only
- `levels_br_mz_test` and `levels_aq_w22_test` where they apply
- screenshots of each obstacle in landscape and portrait

**Shared files and who owns them:**

| File | Owner | Others |
|---|---|---|
| `src/11_player.js`, `src/12_play.js`, `src/13_ui.js`, `src/28_tour_bb_gens.js`, `src/28_tour_j_stamps.js` | secrets WP-1 | Pupo edits none of them (wrappers only). The optional `mountDraw` hook is requested from WP-1. |
| `src/09_validate.js`, `tools/validate_levels.js` | secrets WP-1, then **PU-4** after the merge | |
| `src/02_input.js`, `src/00_core.js`, `tools/build.js`, `tools/apps_test.js` | shared across the three games | Pupo edits none of them. `Input.hud` and `Input.overlay` already exist. |
| `src/05e_pupo.js` | story agent (`sbw/story-piwi`) | PU-1, PU-2 and PU-3 request poses and anchors |
| `src/29_tour_mx*.js` | secrets WP-6, then PU-5 | |
| `src/29_tour_<cc>*.js` | secrets phase-2 group, then Pupo P2 group | |
| `tools/sbw_items_test.js` | PU-4 (one line) | |
| `tools/sbw_perf_test.js`, `tools/perf_baseline.json`, `tools/sbw_soak_test.js` | PU-5 | P2 groups add their levels to the soak list through PU-5's list format |
| `src/28_tour_fd_overworld.js` | the map agent | P2-M uses the `owDraw` hook only |

---

## 9. Originality check
| Mechanic | Why it isn't a copy of another game's mount |
|---|---|
| The Nap Box | A cardboard travel carton with air holes and a snoring sloth who has been napping in it. No egg, no hatching, no special block colour. It opens like our own gift boxes and refills by "he was in here the whole time". |
| Riding | A four-legged sloth amble and a stretchy-armed lope, **slower** than Brady on foot. No saddle, no boots, no speed boost, no mount call. Pupo is a utility steed whose value is reach, climbing and swimming. |
| Being hit | Drowsy, then a nap on the spot, and you wake him by poking *his* belly button. He never panics, flees or needs chasing, and Brady never loses his own power-ups to it. |
| The poke | A stretchy finger to the belly button: Pupo's own gag from Brady's family lore. No tongue grab, nothing eaten or swallowed, nothing spat out. Non-mammals get a nose boop because they have no belly button. |
| Hooks and posts | Stretching arms reach and zip across. The swing is generic pendulum physics on our own looks (a brass ring on every grab point). No grappling item, no tongue, no whip. |
| Climbing and hanging | Sloth behaviour: hand over hand on grippy surfaces, hanging upside down from bars. No wall-jump chains, no ceiling-cling ability borrowed from a costume or suit. |
| Flop, fast swimming | Real sloth facts: sloths drag themselves on the ground and swim well. |
| No mid-air extras | Pupo has no hover, no flutter and no double jump; Brady's jump powers are switched off while riding. |
| Tickle gates, grilles, bending bamboo, snatch, reel-in | Our own puzzle objects, built on our own toolkit (locks, toggles, keys, edges). |
| Pupo Power | Brady's own design: many noodle arms poking belly buttons, spiral rainbow eyes, a carpet tongue, belly-button butterflies, big yellow letters. It isn't a screen-clearing item from any game. The arms are a startled-octopus tangle, never a deity-like pose. |
| Sounds | A slow "boop", yawns, snores and a brassy sting, through `TourKit.sfx` with fallbacks to existing sounds (`sloth`, `slothHug`, `pick`, `spring`, `disco`). No cartoon-mount call or sound-alike. |

**Content:**
- The pokes are tickly and silly, and land only on belly buttons and noses.
- The humour comes from food, animals and objects: churro handles, a ham on a soapy pole, frozen long johns, a ticklish yeti.
- No person is caricatured. The festival crowds are animals.
- No religious objects are used as props.

---

## 10. Open questions for Brady (each has a default so work goes on)
| # | Question (one plain sentence) | Default if he doesn't answer |
|---|---|---|
| 1 | When Pupo gets hit, is it OK that he gets sleepy first, then falls asleep on the spot the second time, and you wake him by poking his belly button? | Yes, as designed. |
| 2 | Should Pupo stay in the level where you find him (he naps back in his box at the end), and just ride on Brady's back on the map? | Yes. |
| 3 | Is it OK that the very first level, Mercado Mayhem, is Mexico's Pupo level, with one giant parade float only Pupo can climb? | Yes. |
| 4 | Should Pupo sit out the boss fights and cheer from the door? | Yes, so the boss fights stay as they are. |
| 5 | Is about 30 seconds of riding the right time to fill up Pupo Power? | 30 seconds. |

---

## Appendix: what will make this harder than it looks
1. **Dead Slothy code is a trap.**
   - `src/11_player.js` still has a whole mount system from the old Burning Man 2D game, keyed on `this.mounted`:
     - Action hugs enemies into friends (`hit('hug')` → `befriend`)
     - any ceiling bump while holding up or jump hangs Brady from it
     - riding gives 1.12x jumps
     - `drawSlothy` is drawn under him
   - Its `mount`/`dismount` live in `src/24_sloth.js`, which the world build **excludes**. Setting `mounted = true` today would make the next hit call `this.dismount(true)`, which doesn't exist: a TypeError on every hit.
   - Pupo uses its own flag (`p.pupo`). The `mounted` flag is touched only around the draw call.
   - Ask the WP-1 owner whether to delete the dead branches, since `11_player.js` is in no other app.
2. **Hitbox resizing is spread around.**
   - `setPower`, crouch and uncrouch all write `PLAYER_DIM` sizes.
   - The riding box must be re-applied after a power change, and `down` must be kept from the inner update.
3. **Every Brady feature is a chain of prototype wrappers**, in file-name order: gear (`dg`), picker (`dh`), jumps (`di`), boxes (`dj`), ring and zip (`h_objects`). Pupo's are outermost. When Pupo returns early (climbing, hanging, swinging), the inner wrappers skip a frame. Check that `jumpAfter` and the box rattle don't rely on running every frame.
4. **The Action button already has five owners** (lasers, gear, the signature item, smoke, the box kick). While riding, every one must be fed a cleared `actionPressed` through a reused scratch input object.
5. **`Player` and `Play` are rebuilt often.**
   - A new `Player` on every `loadArea`.
   - A whole new `Play` on every respawn.
   - Riding state and the meter must ride on `play` and on the checkpoint object, as `jumpCarry` does.
6. **The validator has one body size and one physics.** The riding bit doubles the state space on Pupo levels (`guardMax` and run time). Its owner, secrets WP-1, has just rewritten large parts of it on an unmerged branch, so PU-4 can't start until that lands.
7. **Ink cost.** Anything drawn inside `Ink.around` enlarges the scratch canvases. Stretch arms must be drawn outside ink, with a hand-made outline, or the old Brazil lag comes back.
8. **`Input.hud` buttons are hit-tested but not drawn,** and the map clears `Input.hud` when it leaves. The picker also intercepts touches near its chip, which is where the Pupo button goes. Pupo must draw its own button, re-assert `hud` each frame, and hide the chip while riding.
9. **The tile enum and the stamp letters are full or shared.**
   - Grilles, climbable surfaces and grab points are spawns and rectangles, not tiles.
   - Stamps use the existing `spawn` and `piece` legend kinds.
10. **Story and art conflict.**
    - `STORY_PIWI.md` has Pupo kidnapped with Chinka-O and pet-sized.
    - Brady now wants him as a rideable sidekick.
    - The story and the art need the changes in §7.7 before PU-5.
11. **The save rule.** Brady resets all progress whenever levels change. Converting 14 levels should ship with the secrets v3 reset, or it costs a second reset.
12. **Every item-block test treats every box as an item.** `sbw_items_test` and budget rules 1-3 and 8 must learn that a `'pupo'` box is not an item.
