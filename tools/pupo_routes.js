// Pupo route scripts (docs/design/PUPO.md §7.6, "scripted runs"): for each Pupo obstacle and Pupo-only bonus in a
// shipped level, a short scripted ride through the real level, played by tools/sbw_pupo_routes_test.js (Node, the game
// modules in a VM) and tools/sbw_pupo_shots.js (the built game in WebKit, with screenshots at every `shot` step).
// They cover what the level checker only approximates: the snatch timing, the swing release, the bar shimmy in the
// wind, the climb's pull-up, the pull handle.
//
// A route: { name, level, start: { box: n, area } (Brady beside the n-th Nap Box, by x, of the first area or of area id
//   `area`; he opens it and gets on),
//   boxShot: a name for the shots of the box shut and Pupo's yawn, safe (Brady can't be hurt: enemies and presses still
//   act), steps: [...] }
// Steps (each runs at the game's fixed 1/120 s step; `until` and `check` are expressions over the state S below):
//   { run: 1|-1, until, max }          hold right / left; a little bot jumps gaps and walls ahead (held jump)
//   { hold: { right, up, ... }, until, max, press: 'action'|'jump'|'down', every }   hold keys, press one now and then
//   { grab: { up, right... }, until, max }   aim with the stick and press Action whenever the paw marker shows a target
//   { swing: 1|-1, until, max }        swing hand to hand: Action at the next hook, Jump to let go toward the far side
//   { put: [tx, feetRow] }              move Brady (and Pupo, if ridden) to stand at that tile (skips a stretch)
//   { face: 1|-1 }                      turn to face that way (a tap of the stick, without walking off a beam end)
//   { flip: g }                         flip toggle group g (as its switch would: the wind, day and night)
//   { exec: 'js' }                      run a line with (g, p) in the game (to skip ahead: a thief caught twice already)
//   { wait: s }, { check: expr, name }, { shot: name }   (a shot is taken by the browser tool; the Node test skips it)
// S: x, y (tiles: Brady's centre and his feet), mode (Pupo's: '', 'swing', 'climb', 'hang'...), ride, ground, dead,
//    drowsy, key (a function: key('goldpod')), coins (the coin count), area (the area id), t (route seconds), riding
//    (seconds on Pupo so far), meter, text (the last floating line said near Brady)
// Owner of the entries: the land's Pupo group (P2-G1: ec, br, mz; P2-G2: ma, es, fr; P2-G4: jp, np, aq, w22).
const ROUTES = [
  // ---- the first Nap Box of each Pupo level: he comes out and Brady gets on ----
  { name: '2-4 the first Nap Box', level: '2-4', start: { box: 0 }, boxShot: 'ec24-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the first catwalk' }] },
  { name: '3-2 the first Nap Box', level: '3-2', start: { box: 0 }, boxShot: 'br32-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo after the first capybara ride' }] },
  { name: '4-3 the first Nap Box', level: '4-3', start: { box: 0 }, boxShot: 'mz43-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo on the first crown' }] },
  // ---- Ecuador ----
  { name: '2-4 the golden pod', level: '2-4', start: { box: 1 }, boxShot: 'ec24-cp', safe: true, steps: [
    { run: 1, until: 'x >= 203 && ground', max: 40 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ec24-pod-before' },
    { check: '!key("goldpod")', name: 'the cooling tunnel is shut before the pod is taken' },
    { grab: { up: true }, until: 'key("goldpod")', max: 14, shotAt: { when: 'armOut', name: 'ec24-pod-during' } },
    { wait: 0.4 },
    { run: 1, until: 'x >= 220', max: 12 },
    { check: 'ride && x >= 220', name: 'through the cooling tunnel door on Pupo' },
    { check: 'said("SHINY")', name: 'Pupo, taking the golden pod: "...shiny."' },
    { shot: 'ec24-pod-after' }
  ] },
  { name: '2-2 the cacao larder', level: '2-2', start: { box: 0 }, boxShot: 'ec22', safe: true, steps: [
    { run: 1, until: 'x >= 30.5', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ec22-larder-before' },
    { grab: { up: true }, until: 'key("larder")', max: 6, shotAt: { when: 'mode === "pull"', name: 'ec22-larder-pull' } },
    { wait: 0.6 },
    { run: 1, until: 'coins >= 6', max: 6 },
    { check: 'coins >= 6', name: 'the larder\'s chocolate coins collected' },
    { check: 'said("SNACK")', name: 'Pupo, tugging the chocolate bar: "...snack... time."' },
    { shot: 'ec22-larder-after' }
  ] },
  // ---- Brazil ----
  { name: '3-2 the sloth bridge', level: '3-2', start: { box: 1 }, boxShot: 'br32-cp', safe: true, steps: [
    { run: 1, until: 'x >= 194 && ground', max: 40 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'br32-bridge-before' },
    { swing: 1, until: '(ground && x >= 210) || dead', max: 14, shotAt: { mode: 'swing', name: 'br32-bridge-during' } },
    { check: 'ride && ground && x >= 210 && !dead', name: 'across the piranha river on the cousins\' hands, still riding' },
    { check: 'said("COUSIN")', name: 'the cousins say hello' },
    { shot: 'br32-bridge-after' }
  ] },
  { name: '3-3 the cecropia coin column', level: '3-3', start: { box: 0 }, boxShot: 'br33', safe: true, steps: [
    { run: 1, until: 'x >= 28.6', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'br33-column-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: 'coins >= 7', max: 8, shotAt: { t: 1.2, name: 'br33-column-during' } },
    { check: 'coins >= 7', name: 'the whole coin column, climbing' },
    { shot: 'br33-column-after' },
    { hold: { down: true }, until: 'ground', max: 6 },
    { check: 'ride && ground', name: 'back down the trunk on Pupo' }
  ] },
  // ---- Mozambique ----
  { name: '4-3 the upside-down commute', level: '4-3', start: { box: 1 }, boxShot: 'mz43-cp', safe: true, steps: [
    { put: [121, 13] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'mz43-commute-before' },
    { grab: { up: true }, until: 'mode === "hang"', max: 4 },
    { hold: { right: true }, until: 'x >= 131', max: 8 },
    { shot: 'mz43-commute-during' },
    { hold: { right: true }, until: 'x >= 141.5', max: 8 },
    { check: 'mode === "hang"', name: 'still hanging at the far end (the headwind never moved him)' },
    { hold: { down: true }, until: 'ground', max: 3 },
    { check: 'ride && ground && x >= 141 && !dead', name: 'dropped onto the far crown, riding' },
    { check: 'said("EXCUSE ME")', name: 'the bats were passed: "...excuse me."' },
    { shot: 'mz43-commute-after' }
  ] },
  { name: '4-6 the crow\'s nest', level: '4-6', start: { box: 0 }, boxShot: 'mz46', safe: true, steps: [
    { run: -1, until: 'x <= 23.6', max: 6 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'mz46-mast-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: 'y <= 12', max: 6, shotAt: { t: 2.2, name: 'mz46-mast-during' } },
    { hold: { up: true }, until: '!mode && ground && y <= 5.5', max: 6 },
    { check: 'ride && y <= 5.5', name: 'up the mast and onto the crow\'s nest' },
    { hold: { right: true }, until: 'coins >= 7', max: 2 },
    { check: 'coins >= 7', name: 'the crow\'s-nest coins' },
    { shot: 'mz46-mast-after' }
  ] },
  // ---- P2-G2: Morocco, Spain, France ----
  { name: '5-4 the first Nap Box', level: '5-4', start: { box: 0 }, boxShot: 'ma54-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo under the argan tree' }] },
  { name: '5-4 the beam-end ladder', level: '5-4', start: { box: 1 }, boxShot: 'ma54-cp', safe: true, steps: [
    { run: 1, until: 'x >= 164 && ground', max: 40 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ma54-ladder-before' },
    { hold: {}, press: 'jump', every: 0.6, until: 't > 1.3', max: 2 },
    { check: 'y >= 18.9', name: 'a jump in the downdraft goes nowhere (still at the foot of the tower)' },
    { face: 1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { check: 'ride && y <= 17.1', name: 'zipped onto the first beam end' },
    { face: 1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { shot: 'ma54-ladder-during' },
    { face: -1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { face: 1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { face: -1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { face: 1 }, { grab: {}, until: 'mode === "zip"', max: 3 },
    { hold: {}, until: '!mode && ground', max: 2 },
    { check: 'ride && ground && y <= 7.1', name: 'up the beam ends onto the window ledge, riding' },
    { hold: { right: true }, until: 'x >= 172.4', max: 2 },
    { wait: 0.3 },
    { check: 'said("UP") && said("MEH") && said("VIEW")', name: 'Pupo sets off ("...up... we go."), the goat: "MEH.", Pupo: "...nice... view."' },
    { shot: 'ma54-ladder-after' },
    { hold: { up: true }, press: 'up', every: 0.3, until: 'area === "tower"', max: 3 },
    { check: 'area === "tower" && ride', name: 'through the window into the tower room, still riding' }
  ] },
  { name: '5-3 the washing line', level: '5-3', start: { box: 0 }, boxShot: 'ma53', safe: true, steps: [
    { run: 1, until: 'x >= 44.5 && ground && y <= 11.1', max: 14 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'ma53-line-before' },
    { grab: { up: true }, until: 'mode === "hang"', max: 4 },
    { hold: { right: true }, until: 'x >= 51', max: 6 },
    { shot: 'ma53-line-during' },
    { hold: { right: true }, until: 'x >= 58.3', max: 8 },
    { check: 'mode === "hang"', name: 'still hanging from the washing line over the lane' },
    { hold: { down: true }, until: 'ground', max: 3 },
    { check: 'ride && ground && y <= 9.1', name: 'dropped onto the roof terrace, riding' },
    { check: 'said("SHEETS")', name: 'Pupo under the washing: "...fresh... sheets."' },
    { hold: { right: true }, until: 'x >= 60', max: 2 },
    { grab: { up: true, right: true }, until: 'lives >= 10', max: 5 },
    { check: 'lives >= 10', name: 'the 1-up on the roof terrace (Pupo pokes its box open and fetches it)' },
    { shot: 'ma53-line-after' }
  ] },
  { name: '6-1 the first Nap Box', level: '6-1', start: { box: 0 }, boxShot: 'es61-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo by the tomato truck' }] },
  { name: '6-1 the soapy pole', level: '6-1', start: { box: 1 }, boxShot: 'es61-cp', safe: true, steps: [
    { put: [141, 13] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'es61-pole-before' },
    { check: '!key("ham")', name: 'plaza three is shut before the ham is taken' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: '!mode && ground', max: 6, shotAt: { t: 0.9, name: 'es61-pole-during' } },
    { check: 'ride && y <= 9.1', name: 'up the soaped pole and onto its crossbar, riding' },
    { grab: { up: true }, until: 'key("ham")', max: 4 },
    { wait: 0.5 },
    { check: 'said("SQUEAK") && said("HAM")', name: 'the pole squeaks, Pupo takes the ham: "...ham."' },
    { shot: 'es61-pole-ham' },
    { run: 1, until: 'x >= 154 && ground', max: 8 },
    { check: 'ride && x >= 154', name: 'through plaza three\'s gate on Pupo' },
    { shot: 'es61-pole-after' }
  ] },
  { name: '6-7 the Giant\'s still sail', level: '6-7', start: { box: 0 }, boxShot: 'es67', safe: true, steps: [
    { flip: 0 },
    { put: [97, 12] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'es67-sail-before' },
    { grab: { up: true }, until: 'mode === "hang"', max: 4 },
    { hold: { right: true }, until: 'x >= 103', max: 6 },
    { shot: 'es67-sail-during' },
    { hold: { right: true }, until: 'x >= 110.3', max: 8 },
    { check: 'mode === "hang"', name: 'still hanging under the Giant\'s sail over the lane' },
    { hold: { down: true }, until: 'ground', max: 3 },
    { check: 'ride && ground && y <= 10.1 && x >= 109', name: 'dropped onto the hay loft, riding' },
    { hold: { right: true }, until: 'coins >= 6', max: 2 },
    { check: 'coins >= 6', name: 'the hay loft\'s coins' },
    { check: 'said("WHEE")', name: 'Pupo under the sail: "...whee... slowly."' },
    { shot: 'es67-sail-after' }
  ] },
  { name: '7-2 the first Nap Box', level: '7-2', start: { box: 0 }, boxShot: 'fr72-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the farmhouse yard' }] },
  { name: '7-2 the dovecote', level: '7-2', start: { box: 1 }, boxShot: 'fr72-cp', safe: true, steps: [
    // the magpie caught twice already: it flies on to its third stop, the dovecote's roof
    { exec: 'const th = g.entities.find(e => e.catchIt && e.route), r = th.route[2]; th.caught = 2; th.stop = 3; th.cool = 0; th.hop = null; th.state = "wait"; th.x = r.x - th.w / 2; th.y = r.y - th.h;' },
    { put: [236, 10] },
    { hold: {}, until: 'ground', max: 2 },
    { wait: 0.5 },
    { check: '!key("stamp3") && said("COO?!")', name: 'the magpie flies up and dives into the dovecote; the gate is shut' },
    { shot: 'fr72-dove-before' },
    { grab: { up: true, right: true }, until: 'key("stamp3")', max: 14, shotAt: { when: 'armOut', name: 'fr72-dove-during' } },
    { wait: 0.6 },
    { check: 'said("SQUAWK") && said("PUPO?")', name: 'poked out of its hole ("SQUAWK!"), and no belly button: "...no... pupo?"' },
    { shot: 'fr72-dove-after' },
    { hold: { down: true }, press: 'jump', every: 1, max: 0.3 },
    { run: 1, until: 'x >= 254 && ground', max: 10 },
    { check: 'ride && x >= 254', name: 'through the shutter to the gate on Pupo' }
  ] },
  { name: '7-1 the baguette hooks', level: '7-1', start: { box: 0 }, boxShot: 'fr71', safe: true, steps: [
    { run: -1, until: 'x <= 11.7', max: 4 },
    { hold: { up: true }, press: 'up', every: 0.3, until: 'area === "boulangerie"', max: 3 },
    { check: 'ride && area === "boulangerie"', name: 'into the bakery on Pupo' },
    { put: [107, 10] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'fr71-ovens-before' },
    { swing: 1, until: '(ground && x >= 120.5) || dead', max: 14, shotAt: { mode: 'swing', name: 'fr71-ovens-during' } },
    { check: 'ride && ground && x >= 120.5 && !dead', name: 'over the hot ovens on the baguettes, onto the cooling rack, riding' },
    { hold: { right: true }, until: 'coins >= 8', max: 3 },
    { check: 'coins >= 8', name: 'the cooling rack\'s coins' },
    { check: 'said("CRUSTY")', name: 'Pupo on the first baguette: "...crusty."' },
    { shot: 'fr71-ovens-after' }
  ] },
  // ---- P2-G4: Japan, Nepal, Antarctica, World 22 (src/28_tour_ph_g4.js) ----
  { name: '11-3 the first Nap Box', level: '11-3', start: { box: 0 }, boxShot: 'jp113-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the start of the grove' }] },
  { name: '11-3 bamboo bend', level: '11-3', start: { box: 1 }, boxShot: 'jp113-cp', safe: true, steps: [
    { run: 1, until: 'x >= 176.8 && ground', max: 20 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'jp113-bamboo-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: 'mode === "bend"', max: 6 },
    { hold: {}, until: '!mode', max: 4, shotAt: { t: 0.75, name: 'jp113-bamboo-during' } },
    { hold: {}, until: 'ground', max: 2 },
    { check: 'ride && ground && x >= 189 && !dead', name: 'across the stream on the bending bamboo, riding' },
    { check: 'said("WHOA") && said("SOFT")', name: 'Pupo as it bends ("...whoa.") and on the far bank ("...soft... landing.")' },
    { check: 'coins >= 3', name: 'coins along the bamboo\'s arc' },
    { shot: 'jp113-bamboo-after' }
  ] },
  { name: '11-4 the noodle sign\'s onigiri', level: '11-4', start: { box: 0 }, boxShot: 'jp114', safe: true, steps: [
    { put: [23, 108] },
    { hold: {}, until: 'ground', max: 2 },
    { face: 1 },
    { shot: 'jp114-sign-before' },
    { grab: { up: true }, until: 'mode === "pull"', max: 4 },
    { wait: 1.8, },
    { check: 'said("SNACK")', name: 'Pupo tugs the onigiri: "...snack?"' },
    { shot: 'jp114-sign-pulled' },
    { hold: { left: true }, until: 'coins >= 10', max: 6 },
    { check: 'coins >= 10 && ride', name: 'the gondola dropped: its ten coins, on Pupo' },
    { check: 'said("TIPS")', name: 'Pupo at the gondola: "...tips."' },
    { shot: 'jp114-sign-after' }
  ] },
  { name: '12-3 the first Nap Box', level: '12-3', start: { box: 0 }, boxShot: 'np123-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo by the first boulder' }] },
  { name: '12-3 the ticklish yeti', level: '12-3', start: { box: 1 }, boxShot: 'np123-cp', safe: true, steps: [
    { put: [158, 14] },
    { run: 1, until: 'x >= 165.4 && ground', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { face: 1 },
    { shot: 'np123-yeti-before' },
    { grab: {}, until: 'said("HEE HEE")', max: 6, shotAt: { when: 'armOut', name: 'np123-yeti-during' } },
    { wait: 1.2 },
    { shot: 'np123-yeti-rolling' },
    { wait: 1.6 },
    { run: 1, until: 'x >= 178 && ground', max: 8 },
    { check: 'ride && x >= 178 && !dead', name: 'through the pass on Pupo, the yeti slid away' },
    { shot: 'np123-yeti-after' }
  ] },
  { name: '13-3 the first Nap Box', level: '13-3', start: { box: 0 }, boxShot: 'aq133-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the station gate' }] },
  { name: '13-3 reel in the floe', level: '13-3', start: { box: 0, area: 'harbour' }, boxShot: 'aq133-harbour', safe: true, steps: [
    { run: 1, until: 'x >= 27.8 && ground', max: 20 },
    { hold: { right: true }, until: 'x >= 28.3', max: 1 },
    { hold: {}, until: 'ground', max: 2 },
    { face: 1 },
    { shot: 'aq133-floe-before' },
    { grab: { right: true }, until: 'mode === "pull"', max: 4 },
    { wait: 0.8 },
    { shot: 'aq133-floe-reeling' },
    { wait: 3.6 },
    { hold: { right: true }, until: 'x >= 30.4', max: 2 },
    { hold: {}, until: 'ground', max: 2 },
    { check: 'ride && ground && x >= 29.5 && x <= 32', name: 'aboard the floe at the dock' },
    { grab: { right: true }, until: 'mode === "pull"', max: 4 },
    { wait: 1.5 },
    { shot: 'aq133-floe-during' },
    { wait: 3.2 },
    { check: 'ride && ground && x >= 41 && !dead', name: 'the floe pushed out across the harbour, Brady and Pupo aboard' },
    { hold: { right: true }, until: 'x >= 45 && ground', max: 3 },
    { check: 'ride && ground && x >= 45 && !dead', name: 'onto the far quay, riding' },
    { hold: { right: true }, until: 'x >= 54', max: 3 },
    { shot: 'aq133-floe-quay' },
    { hold: { up: true }, press: 'up', every: 0.3, until: 'area === "plough"', max: 3 },
    { check: 'area === "plough" && !ride', name: 'through the airlock into the plough arena: Pupo waits at its door' },
    { check: 'said("FLOE") && said("HMPH")', name: 'Pupo: "...come... here... floe.", the penguins: "HMPH."' },
    { shot: 'aq133-floe-after' }
  ] },
  { name: '22-1 the first Nap Box', level: '22-1', start: { box: 0 }, boxShot: 'w221-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo at the start of the platform' }] },
  { name: '22-1 sloth o\'clock', level: '22-1', start: { box: 2 }, boxShot: 'w221-wormout', safe: true, steps: [
    { run: 1, until: 'x >= 228.3 && ground', max: 8 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'w221-clock-before' },
    { hold: {}, press: 'jump', every: 0.6, until: 't > 1.3', max: 2 },
    { check: 'y >= 19.9', name: 'a jump in the falling time goes nowhere (still on the tower floor)' },
    { grab: { up: true }, until: 'mode === "swing"', max: 4 },
    { hold: {}, until: 'y <= 15', max: 8, shotAt: { t: 2.2, name: 'w221-clock-during' } },
    { hold: {}, until: 'y <= 13', max: 8 },
    { wait: 0.9 },
    { shot: 'w221-clock-top' },
    { hold: { right: true }, press: 'jump', every: 5, until: 'mode !== "swing"', max: 1 },
    { hold: { right: true }, until: 'ground', max: 3 },
    { check: 'ride && ground && y <= 13.1 && x >= 227.5 && !dead', name: 'off the minute hand onto the balcony at the top, riding' },
    { hold: { right: true }, until: 'x >= 233', max: 2 },
    { check: 'ride && ground && y <= 13.1 && x >= 233', name: 'on along the upper platform' },
    { check: 'said("2:22") && said("FLIES")', name: 'Pupo at the hand ("...2:22.") and letting go at the top ("...time... flies.")' },
    { shot: 'w221-clock-after' }
  ] },
  // ---- P2-G3: the Netherlands, Indonesia, Vietnam (owner: the P2-G3 group) ----
  { name: '8-1 the first Nap Box', level: '8-1', start: { box: 0 }, boxShot: 'nl81-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo on the first houseboat' }] },
  { name: '8-1 the drawbridge chain', level: '8-1', start: { box: 1 }, boxShot: 'nl81-cp', safe: true, steps: [
    { run: 1, until: 'x >= 133 && ground && y <= 14.1', max: 12 },
    { hold: { right: true }, until: 'x >= 136.6', max: 3 },
    { hold: {}, until: 'ground', max: 2 }, { wait: 0.3 },
    { check: 'ride && y <= 14.1 && x < 137.9', name: 'on the near dike by the stuck drawbridge' },
    { shot: 'nl81-bridge-before' },
    { face: 1 }, { grab: {}, until: 'mode === "pull"', max: 3, shotAt: { when: 'mode === "pull"', name: 'nl81-bridge-pull' } },
    { wait: 1.2 },
    { shot: 'nl81-bridge-during' },
    { check: 'said("SORRY") && said("KRAAK")', name: 'the chain pulled: the herons squawk ("KRAAK!"), Pupo: "...sorry... birds."' },
    { hold: { right: true }, until: 'x >= 151.5 && ground', max: 5 },
    { check: 'ride && ground && x >= 151.5 && y <= 14.1 && !dead', name: 'across the drawbridge onto the far dike, riding' },
    { shot: 'nl81-bridge-after' }
  ] },
  { name: '8-6 the lattice sail', level: '8-6', start: { box: 0 }, boxShot: 'nl86', safe: true, steps: [
    { run: 1, until: 'x >= 26 && ground', max: 4 },
    { hold: { right: true }, until: 'x >= 29.2', max: 3 },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'nl86-sail-before' },
    { grab: { up: true }, until: 'mode === "climb"', max: 4 },
    { hold: { up: true }, until: '!mode && ground', max: 6, shotAt: { t: 1.0, name: 'nl86-sail-during' } },
    { check: 'ride && y <= 8.1', name: 'up the slippery sail onto the mill\'s stage, riding' },
    { hold: { right: true }, until: 'x >= 32.4', max: 2 }, { hold: {}, until: 'ground', max: 1 },
    { hold: { jump: true }, press: 'jump', every: 1.2, until: 'coins >= 5', max: 4 },
    { check: 'coins >= 5', name: 'the ring of coins over the stage (one jump through its middle)' },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'nl86-sail-after' }
  ] },
  { name: '9-6 the first Nap Box', level: '9-6', start: { box: 0 }, boxShot: 'id96-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo on the start ledge' }] },
  { name: '9-6 thorny rattan', level: '9-6', start: { box: 1 }, boxShot: 'id96-cp', safe: true, steps: [
    { run: 1, until: 'x >= 148 && ground', max: 4 },
    { hold: { right: true }, until: 'x >= 151.4', max: 4 },
    { hold: {}, until: 'ground', max: 2 }, { wait: 0.3 },
    { check: 'ride && ground && x < 152.9', name: 'on the ledge at the ravine' },
    { shot: 'id96-rattan-before' },
    { swing: 1, until: '(ground && x >= 170) || dead', max: 16, shotAt: { mode: 'swing', name: 'id96-rattan-during' } },
    { check: 'ride && ground && x >= 170 && !dead', name: 'across the ravine cane to cane, riding' },
    { hold: { right: true }, until: 'x >= 173', max: 2 }, { hold: {}, until: 'ground', max: 1 },
    { wait: 2.6 },
    { check: 'said("PRICKLY") && said("NICE") && said("YOU TOO")', name: 'the first cane ("...prickly. ...fine."), the mother orangutan: "...nice... arms." "...you too."' },
    { shot: 'id96-rattan-after' }
  ] },
  { name: '10-4 the first Nap Box', level: '10-4', start: { box: 0 }, boxShot: 'vn104-first', safe: true, steps: [{ check: 'ride', name: 'on Pupo on the first dry ledge' }] },
  { name: '10-4 the cave pearl', level: '10-4', start: { box: 1 }, boxShot: 'vn104-cp', safe: true, steps: [
    { put: [7, 49] },
    { hold: {}, until: 'ground', max: 2 },
    { shot: 'vn104-pearl-before' },
    { check: '!key("pearl")', name: 'the skylight gate is shut before the pearl is taken' },
    { face: -1 }, { grab: { left: true }, until: 'key("pearl")', max: 6, shotAt: { when: 'armOut', name: 'vn104-pearl-during' } },
    { wait: 0.5 },
    { check: 'said("SHINY")', name: 'the pearl through the grille: "...shiny... and wet."' },
    { run: 1, until: 'x >= 23.5 && ground', max: 6 },   // (hopping the chamber's own Nap Box on the way)
    { shot: 'vn104-pearl-after' },
    { hold: { jump: true }, press: 'jump', every: 1, until: 'ground && y <= 45.1', max: 3 },
    { check: 'ride && y <= 45.1', name: 'through the skylight gate and up through the rock shelf, riding' }
  ] },
  { name: '10-6 the lantern hooks', level: '10-6', start: { box: 0 }, boxShot: 'vn106', safe: true, steps: [
    { hold: { left: true }, until: 'x <= 46.3', max: 3 },
    { hold: { up: true }, press: 'up', every: 0.3, until: 'area === "kenh"', max: 3 },
    { check: 'ride && area === "kenh"', name: 'into the canal lane on Pupo' },
    { run: 1, until: 'x >= 18 && ground && y <= 13.1', max: 8 },
    { hold: { right: true }, until: 'x >= 20.6', max: 2 }, { hold: {}, until: 'ground', max: 1 },
    { shot: 'vn106-hooks-before' },
    { swing: 1, until: '(ground && x >= 37.5 && y <= 13.1) || (ground && y > 17) || dead', max: 16, shotAt: { mode: 'swing', name: 'vn106-hooks-during' } },
    { check: 'ride && ground && y <= 13.1 && x >= 37.5', name: 'over the rainy lane on the lantern hooks, onto the teahouse roof' },
    { hold: { right: true }, until: 'x >= 39.5', max: 2 }, { hold: {}, until: 'ground', max: 1 },
    { grab: { up: true, right: true }, until: 'lives >= 10', max: 5 },
    { check: 'lives >= 10', name: 'the 1-up on the teahouse roof (Pupo pokes its box open and fetches it)' },
    { check: 'said("PRETTY")', name: 'Pupo on the first lantern: "...pretty."' },
    { shot: 'vn106-hooks-after' }
  ] }
];

// The runner, shared by the Node test and the browser tool: its source is evaluated where the game's globals live
// (getLevel, Play, Game, Input, Save, PupoReach, TS, T, SOLID; window.BRADY and window.BRADY_PUPO in the page). __pupoRoute.start(route) builds the
// level; __pupoRoute.go() runs until the next shot or the end and returns { shot } or { done, ok, fails, info }.
function RUNNER() {
  // the game's names: globals in the Node VM; in the page the app exports them on window.BRADY / window.BRADY_PUPO
  const W = typeof window !== 'undefined' && window.BRADY && window.BRADY_PUPO ? window : null, B = W && W.BRADY;
  const names = W ? [B.Save, B.Play, B.Game, B.Input, B.getLevel, B.TS, B.T, B.SOLID, W.BRADY_PUPO.PupoReach] : [Save, Play, Game, Input, getLevel, TS, T, SOLID, PupoReach];
  return (function (Save, Play, Game, Input, getLevel, TS, T, SOLID, PupoReach) {
  const tileAt = (A, tx, ty) => tx < 0 || tx >= A.W ? T.HARD : ty < 0 || ty >= A.H ? T.EMPTY : A.tiles[ty * A.W + tx];
  const R = globalThis.__pupoRoute = {
    route: null, i: 0, t: 0, fails: [], passes: [], g: null, said: [], stepT: 0, riding: 0, shotsTaken: {}, coinN: 0,
    S() {
      const g = this.g, p = g.player, P = g.pupo || {};
      return { x: p.cx / TS, y: (p.y + p.h) / TS, mode: P.mode || '', ride: !!p.pupoRide, ground: !!p.onGround, dead: !!p.dead || g.player !== p,
        drowsy: P.drowsyT > 0, coins: this.coinN, key: k => g.keys.has(k), area: g.area && g.area.aid, t: this.t, riding: this.riding,
        meter: P.meter || 0, lives: Save.data.lives, said: s => this.said.some(w => w.indexOf(s) >= 0), armOut: !!(P.arm && P.arm.phase >= 2 && P.arm.kind && P.arm.kind !== 'air') };
    },
    test(expr) { const S = this.S(); return !!(new Function('S', 'with (S) { return (' + expr + '); }'))(S); },
    start(route) {
      this.route = route; this.i = 0; this.t = 0; this.fails = []; this.passes = []; this.said.length = 0; this.stepT = 0; this.riding = 0; this.shotsTaken = {};
      const [w, n] = route.level.split('-').map(Number);
      Save.data.lives = 9; Save.data.tips = Object.assign(Save.data.tips || {}, { box: true, picker: true });
      const g = new Play(getLevel(w, n), {}); Game.setScene ? Game.setScene(g) : (Game.scene = g);
      g.state = 'play'; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; this.g = g;
      // what Pupo and the critters say: kept to check the lines
      const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { this.said.push(String(s)); return t0(x, y, s, c); };
      const a0 = g.addPick.bind(g); g.addPick = (x, y) => { this.coinN++; return a0(x, y); };
      this.frames(0.3, {});
      // start: { area: id } begins in that area of the level (13-3's harbour, past the module) (P2-G4)
      if (route.start.area) { const ai = g.level.areas.findIndex(a => a.aid === route.start.area); g.loadArea(ai, 6 * TS, 6 * TS); this.frames(0.3, {}); }
      const boxes = []; g.area.spawns.forEach(s => { if (s.type === 'napBox') boxes.push(s); }); boxes.sort((a, b) => a.x - b.x);
      const b = boxes[route.start.box || 0], tx = Math.floor(b.x / TS), ty = Math.floor(b.y / TS) - 1, p = g.player;
      // stand beside the box (on its left), open it (as a bump would), and walk into Pupo once he has unfolded
      p.x = (tx - 1) * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS - p.h; p.vx = p.vy = 0;
      { const A = g.area; let fy = ty + 1; while (fy < A.H && !(SOLID[tileAt(A, tx - 1, fy)] || tileAt(A, tx - 1, fy) === T.SEMI)) fy++; p.y = fy * TS - p.h; }
      g.camX = Math.max(0, Math.min(g.area.W * TS - Game.viewW, p.cx - Game.viewW * 0.42)); if (g.camTargetY) g.camY = g.camTargetY(true);
      this.frames(0.3, {});
      this.box = { tx, ty };
      // the box, its opening and the mount run as the route's first steps (so the browser tool can photograph them)
      const pre = route.boxShot ? 'box-' + route.boxShot : null;
      this.steps = [].concat(pre ? [{ shot: pre + '-closed' }] : [], [{ bump: true }, { wait: 0.75 }], pre ? [{ shot: pre + '-yawn' }] : [], [{ wait: 0.85 }, { mount: true }], route.steps);
    },
    mount() {
      const g = this.g, p = g.player, f = g.pupo && g.pupo.free;
      // (Brady standing in him when he appears must step off first: he is 'armed' once Brady is clear)
      if (f) for (let tries = 0; tries < 3 && !p.pupoRide; tries++) {
        // step away from Pupo (and from the box, on his right) until he is clear of Brady, then walk back into him
        if (!f.armed) for (let k = 0; k < 120 && !f.armed; k++) this.frames(1 / 120, f.cx > p.cx + 4 || tries === 1 ? { left: true } : { right: true });
        for (let k = 0; k < 120 && !p.pupoRide; k++) this.frames(1 / 120, f.cx > p.cx ? { right: true } : { left: true });
      }
      this.frames(0.4, {});
      this.coinN = 0; this.t = 0; this.riding = 0;
      if (!p.pupoRide) this.fails.push('could not get on Pupo at Nap Box ' + (this.route.start.box || 0));
    },
    // step the game: inp held, pressed flags on the first frame only
    frames(sec, inp) {
      const I = Input, n = Math.max(1, Math.round(sec * 120));
      for (let k = 0; k < n; k++) {
        for (const key in inp) I[key] = inp[key];
        if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; }
        if (this.route && this.route.safe && this.g.player) this.g.player.invuln = Math.max(this.g.player.invuln || 0, 0.5);
        (this.g.__upd || this.g.update).call(this.g, 1 / 120);
        I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false;
        if (I.taps) I.taps.length = 0;
        this.t += 1 / 120; if (this.g.player && this.g.player.pupoRide) this.riding += 1 / 120;
      }
      for (const key in inp) I[key] = false;
    },
    // a tiny bot for `run`: hold the direction, jump (held) at a gap or a wall ahead
    runInput(dir) {
      const g = this.g, p = g.player, A = g.area, inp = { right: dir > 0, left: dir < 0 };
      if (p.onGround) {
        const fx = Math.floor((dir > 0 ? p.x + p.w + 10 : p.x - 10) / TS), fy = Math.floor((p.y + p.h + 4) / TS), hy = Math.floor((p.y + p.h - 8) / TS);
        const floor = SOLID[tileAt(A, fx, fy)] || tileAt(A, fx, fy) === T.SEMI || tileAt(A, fx, fy) === T.CONV_L || tileAt(A, fx, fy) === T.CONV_R;
        const wall = SOLID[tileAt(A, fx, hy)];
        if (!floor || wall) { inp.jump = true; inp.jumpPressed = true; }
      } else if (p.vy < 0) inp.jump = true;
      return inp;
    },
    // grab: aim with the stick, press Action whenever the marker sits on something (and the arm is home)
    grabInput(aim) {
      const g = this.g, P = g.pupo, inp = Object.assign({}, aim);
      if (P && !P.mode && P.tg && P.tg.kind && (!P.arm || P.arm.phase === 0)) inp.actionPressed = true;
      return inp;
    },
    // swing: Action at the next hook ahead; Jump to let go when no hook is left and the swing heads for the far side
    swingInput(dir) {
      const g = this.g, P = g.pupo, p = g.player, inp = { right: dir > 0, left: dir < 0 };
      if (P.mode === 'swing') {
        const s = P.sw, tg = PupoReach.scan(p, g, P, inp), ahead = tg.kind === 'hook' && tg.e !== s.e && (tg.e.hx - s.e.hx) * dir > 0;
        if (ahead && s.om * dir > 0) inp.actionPressed = true;
        else if (!ahead) { let more = false; for (const e of g.entities) if (e.pupoGrabPt && e.kind === 'hook' && (e.hx - s.e.hx) * dir > 0 && Math.abs(e.hx - s.e.hx) < 6 * TS) more = true; if (!more && s.om * dir > 0.5 && s.th * dir > 0.15) { inp.jumpPressed = true; inp.jump = true; } }
      } else if (!P.mode) {
        const tg = PupoReach.scan(p, g, P, { right: dir > 0, left: dir < 0, up: true });
        if (tg.kind === 'hook' && (!P.arm || P.arm.phase === 0)) { inp.actionPressed = true; inp.up = true; }
        else if (p.onGround && !this.jumped) { inp.jumpPressed = true; inp.jump = true; this.jumped = true; }
        else if (!p.onGround) inp.jump = true;
      }
      return inp;
    },
    go() {
      const steps = this.steps;
      while (this.i < steps.length) {
        const s = steps[this.i];
        if (s.shot) { this.i++; if (!this.shotsTaken[s.shot]) { this.shotsTaken[s.shot] = true; return { shot: s.shot }; } continue; }
        if (s.check) { (this.test(s.check) ? this.passes : this.fails).push(s.name || s.check); if (!this.test(s.check)) this.fails[this.fails.length - 1] += '  ' + JSON.stringify(this.info()); this.i++; continue; }
        if (s.wait) { this.frames(s.wait, {}); this.i++; continue; }
        if (s.face) { this.g.player.facing = s.face; this.i++; continue; }
        if (s.flip != null) { this.g.flipToggle(s.flip); this.frames(0.6, {}); this.i++; continue; }
        if (s.exec) { (new Function('g', 'p', s.exec))(this.g, this.g.player); this.frames(0.2, {}); this.i++; continue; }
        if (s.bump) { this.g.bumpBlock(this.box.tx, this.box.ty, false, this.g.player); this.i++; continue; }
        if (s.mount) { this.mount(); this.i++; if (!this.g.player.pupoRide) break; continue; }
        if (s.put) { const g = this.g, p = g.player; p.x = s.put[0] * TS + TS / 2 - p.w / 2; p.y = s.put[1] * TS - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * TS - Game.viewW, p.cx - Game.viewW * 0.42)); this.frames(0.5, {}); this.i++; continue; }
        const max = s.max || 10;
        if (this.stepT === 0) this.lastPress = -1e9;
        let ok = false;
        while (this.stepT < max) {
          if (s.until && this.test(s.until)) { ok = true; break; }
          let inp;
          if (s.run) inp = this.runInput(s.run);
          else if (s.grab) inp = this.grabInput(s.grab);
          else if (s.swing) inp = this.swingInput(s.swing);
          else { inp = Object.assign({}, s.hold || {}); if (s.press && this.stepT - this.lastPress >= (s.every || 1e9)) { this.lastPress = this.stepT; if (s.press === 'action') inp.actionPressed = true; else if (s.press === 'jump') { inp.jumpPressed = true; inp.jump = true; } else if (s.press === 'down') { inp.downPressed = true; inp.down = true; } } }
          this.frames(1 / 120, inp); this.stepT += 1 / 120;
          if (s.shotAt && !this.shotsTaken[s.shotAt.name] && ((s.shotAt.when && this.test(s.shotAt.when)) || (s.shotAt.mode && this.g.pupo && this.g.pupo.mode === s.shotAt.mode && (this.swT = (this.swT || 0) + 1 / 120) > 0.35) || (s.shotAt.t && this.stepT >= s.shotAt.t))) { this.shotsTaken[s.shotAt.name] = true; return { shot: s.shotAt.name }; }
        }
        if (!ok && s.until && this.test(s.until)) ok = true;
        if (!ok && s.until) this.fails.push('step ' + this.i + ' (' + JSON.stringify(s).slice(0, 90) + ') timed out  ' + JSON.stringify(this.info()));
        this.i++; this.stepT = 0; this.swT = 0;
        if (!ok && s.until) break;
      }
      return { done: true, ok: !this.fails.length, fails: this.fails, passes: this.passes, info: this.info() };
    },
    info() { const S = this.S(); return { x: +S.x.toFixed(2), y: +S.y.toFixed(2), mode: S.mode, ride: S.ride, ground: S.ground, dead: S.dead, coins: S.coins, t: +this.t.toFixed(1), riding: +this.riding.toFixed(1) }; }
  };
  return R;
  }).apply(null, names);
}
module.exports = { ROUTES, RUNNER_SRC: '(' + RUNNER.toString() + ')()' };
