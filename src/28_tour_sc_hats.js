/* ============================================================
   World tour: RULE 7's animal hats (docs/design/SECRETS_WARPS_SWITCHES.md §4.3 row B1, §4.5).
   Once Brady slaps the Brady Button for RULE 7: NO HATS ON ANIMALS, every ANIMAL wears one tiny novelty hat: a paper
   party cone, a flower crown, a mini top hat, a propeller beanie, a chef's toque or a bobble hat. One hat per creature
   type (a hash of its type name, so a screen of mixed animals shows a mix of hats). Cosmetic only.
   - Who wears one: ONLY the types in TourHats.HEADS (animals: enemies, friends, critters). Everything else (doors,
     smoke puffs, lasers, flames, items, blocks, signs, platforms, food and toy enemies, machines, Brady, Chinka-O,
     Pupo, Piwi, bosses) is listed in TourHats.NOT. tools/sbw_hats_test.js fails when a registered type is in neither
     list, so a new land's types must be sorted into one of them.
   - Where it sits: HEADS[type] = [fx, fxFlip, fy, size]: the top of the head in the type's usual pose, as fractions
     of its hitbox (fx: from the hitbox centre when it faces right (dir 1), + is right; fxFlip: the same, mirrored,
     when it faces left; fy: from its feet, - is up); size: the hat's scale (0: from the critter's size). Read off
     each type's drawn art (tools/sbw_hats_shots.js --sheet draws every type on a grid with its hat for a look).
   - The hat follows the critter's squash and bob, its dance (rule 3), and hides in poses with no head to wear it on
     (rolled up, curled, burrowed, disguised, knocked out, upside down, asleep, crouched in ambush).
   - The six hats are drawn once each into a small canvas (no per-frame allocation); the beanie's propeller spins live.
   - Settings: ANIMAL HATS: ON / OFF (src/28_tour_sb_buttons.js, Save.data.settings.hatsFx).
   ============================================================ */
const TourHats = {
  KINDS: ['cone', 'crown', 'tophat', 'beanie', 'toque', 'bobble'],
  INK: '#1c1426',
  // [fx, fxFlip, fy, size]: see the header. One row per animal type.
  HEADS: {},
  // types drawn as another type's art: their hat goes where that type's would (a rival drawn from a skin of its own,
  // like 4-1's ostrich, has a row 'look:<skin>')
  ALIAS: { tourRival: e => e.s && (e.s.art || (e.s.look && 'look:' + e.s.look)), tourThief: e => e.s && (e.s.art || (e.s.look && 'look:' + e.s.look)) },
  // poses with no head to wear a hat on
  SKIP_MODES: new Set(['ko', 'flat', 'roll', 'curl', 'ball', 'under', 'dig', 'disguise', 'gone', 'fade', 'hang', 'drop', 'climb', 'stuck', 'flip', 'topple', 'shell', 'folded', 'deflate', 'invert', 'tiny', 'mimic', 'wait', 'hide', 'hidden', 'ceil', 'sleep', 'crouch']),
  NOT: null,   // filled below
  // the type key an entity was spawned as ('roomBig:frCat' -> 'frCat'; behaviour children by their class)
  typeOf(e) {
    let k = e.s && e.s.type;
    if (k && k.indexOf('roomBig:') === 0) k = k.slice(8);
    if (!k) k = this.byClass(e.constructor);
    const al = k && this.ALIAS[k]; if (al) { const a = al(e); return a && this.HEADS[a] ? a : null; }
    return k || null;
  },
  // the spawn type of a class, worked out once (a class registered under two names is left out: ambiguous)
  classMap: null,
  byClass(C) {
    if (!this.classMap) {
      const m = new Map(), dup = new Set();
      for (const k in ENTITY_TYPES) { const c = ENTITY_TYPES[k]; if (typeof c !== 'function' || k.indexOf('roomBig:') === 0) continue; if (m.has(c)) dup.add(c); else m.set(c, k); }
      for (const c of dup) m.delete(c);
      this.classMap = m;
    }
    return this.classMap.get(C) || null;
  },
  // the hat a type wears: a hash of its name (FNV-1a), the same every run
  kindOf(type) {
    let h = 0x811c9dc5;
    for (let i = 0; i < type.length; i++) { h ^= type.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return this.KINDS[(h >>> 0) % this.KINDS.length];
  },
  // the entity's hat info, worked out once per entity: { kind, head } or false
  info(e) {
    if (e._hatInfo !== undefined) return e._hatInfo;
    const type = this.typeOf(e), head = type && this.HEADS[type];
    e._hatInfo = head && !e.boss ? { kind: this.kindOf(type), head, type } : false;
    return e._hatInfo;
  },
  wears(e) {
    if (e.dead || e.remove || e.knocked || e.boss || e.isButton) return false;
    const I = this.info(e); if (!I) return false;
    const m = e.artMode !== undefined ? e.artMode : e.mode;
    if (m && this.SKIP_MODES.has(m)) return false;
    // a leaper waiting under the water, a wall crawler on a wall or a ceiling
    if (e.state === 'wait' || (e.side && e.side !== 'floor')) return false;
    return true;
  },

  /* ---------- the six hats: drawn once each into a canvas at R px per unit; a head is 16 units wide ---------- */
  R: 4, BOX: { x: -14, y: -30, w: 28, h: 36 },
  sprites: null,
  sprite(kind) {
    if (!this.sprites) this.sprites = {};
    let c = this.sprites[kind];
    if (c) return c;
    const B = this.BOX, R = this.R;
    c = document.createElement('canvas'); c.width = B.w * R; c.height = B.h * R;
    const x = c.getContext('2d');
    if (x) { x.setTransform(R, 0, 0, R, -B.x * R, -B.y * R); x.lineJoin = 'round'; x.lineCap = 'round'; this.paint(x, kind); }
    this.sprites[kind] = c;
    return c;
  },
  // stroke the outline thick, then fill: one clean ink line round the whole silhouette
  sil(c, path, fill) { c.strokeStyle = this.INK; c.lineWidth = 3; path(c); c.stroke(); c.fillStyle = fill; path(c); c.fill(); },
  paint(c, kind) {
    const I = this.INK;
    if (kind === 'cone') {
      // a paper party cone, leaning a little, two yellow stripes, a pompom on top
      const P = c2 => { c2.beginPath(); c2.moveTo(-8, 2); c2.lineTo(2, -21); c2.lineTo(8.5, 2); c2.quadraticCurveTo(0, 4.2, -8, 2); c2.closePath(); };
      this.sil(c, P, '#ff4f9a');
      c.save(); P(c); c.clip();
      c.fillStyle = '#ffd84a'; for (const y of [-14, -6]) { c.beginPath(); c.moveTo(-12, y + 4); c.lineTo(12, y - 3); c.lineTo(12, y + 1); c.lineTo(-12, y + 8); c.closePath(); c.fill(); }
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(-3, 0); c.lineTo(1, -16); c.lineTo(-1, 0); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.restore();
      c.strokeStyle = I; c.lineWidth = 1.4; P(c); c.stroke();
      this.sil(c, c2 => { c2.beginPath(); c2.arc(2, -22, 3.6, 0, TAU); }, '#5ad0ff');
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(1, -23, 1.2, 0, TAU); c.fill();
    } else if (kind === 'crown') {
      // a flower crown: a leafy band and three big daisies
      const F = [[-7, -2, '#ff6ab0'], [0, -4, '#ffd84a'], [7, -2, '#6ac8ff']];
      const band = c2 => { c2.beginPath(); c2.ellipse(0, 1, 10, 3, 0, 0, TAU); };
      c.strokeStyle = I; c.lineWidth = 3; band(c); c.stroke();
      for (const f of F) { c.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - 1.57; c.moveTo(f[0] + Math.cos(a) * 2.8 + 2.6, f[1] + Math.sin(a) * 2.8); c.arc(f[0] + Math.cos(a) * 2.8, f[1] + Math.sin(a) * 2.8, 2.6, 0, TAU); } c.stroke(); }
      c.fillStyle = '#3aa84a'; band(c); c.fill();
      c.fillStyle = '#7ad85a'; for (const lx of [-10, -3.5, 3.5, 10]) { c.beginPath(); c.ellipse(lx, 0.5, 2.6, 1.4, lx < 0 ? -0.5 : 0.5, 0, TAU); c.fill(); }
      for (const f of F) {
        c.fillStyle = f[2]; c.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - 1.57; c.moveTo(f[0] + Math.cos(a) * 2.8 + 2.6, f[1] + Math.sin(a) * 2.8); c.arc(f[0] + Math.cos(a) * 2.8, f[1] + Math.sin(a) * 2.8, 2.6, 0, TAU); } c.fill();
        c.fillStyle = '#ffffff'; c.globalAlpha = 0.4; c.beginPath(); c.arc(f[0] - 1.5, f[1] - 3, 1.3, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.fillStyle = f[2] === '#ffd84a' ? '#ff8a2a' : '#fff4a0'; c.strokeStyle = I; c.lineWidth = 1; c.beginPath(); c.arc(f[0], f[1], 1.7, 0, TAU); c.fill(); c.stroke();
      }
    } else if (kind === 'tophat') {
      // a mini top hat: wide brim, tall crown, a red band, a shine
      const P = c2 => { c2.beginPath(); c2.ellipse(0, 0.5, 11, 3, 0, 0, TAU); c2.rect(-7, -17, 14, 17); };
      c.strokeStyle = I; c.lineWidth = 3; P(c); c.stroke();
      c.fillStyle = '#2a2436'; P(c); c.fill();
      c.fillStyle = '#ee3040'; c.fillRect(-7, -6, 14, 3.6);
      c.fillStyle = '#5a5070'; c.fillRect(-5.2, -15.5, 2.2, 8.5); c.fillRect(-5.2, -2, 2.2, 1.5);
      c.strokeStyle = I; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-7, -6); c.lineTo(7, -6); c.moveTo(-7, -2.4); c.lineTo(7, -2.4); c.stroke();
      c.beginPath(); c.ellipse(0, -17, 7, 1.6, 0, 0, TAU); c.fillStyle = '#3e3650'; c.fill(); c.stroke();
    } else if (kind === 'beanie') {
      // a propeller beanie: four bright panels, a band, the stalk (the propeller spins live, TourHats.draw)
      const P = c2 => { c2.beginPath(); c2.moveTo(-10, 2); c2.arc(0, 2, 10, Math.PI, 0); c2.closePath(); };
      c.strokeStyle = I; c.lineWidth = 3; P(c); c.stroke(); c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -13); c.stroke();
      c.save(); P(c); c.clip();
      const cols = ['#ee3040', '#ffd84a', '#3a8ae8', '#3ac85a'];
      for (let k = 0; k < 4; k++) { c.fillStyle = cols[k]; c.beginPath(); c.moveTo(0, 2); c.arc(0, 2, 12, Math.PI + k * Math.PI / 4, Math.PI + (k + 1) * Math.PI / 4); c.closePath(); c.fill(); }
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.35; c.beginPath(); c.ellipse(-4, -3, 2.2, 3.5, -0.5, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.restore();
      c.strokeStyle = I; c.lineWidth = 1.1; for (let k = 1; k < 4; k++) { const a = Math.PI + k * Math.PI / 4; c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.cos(a) * 10, 2 + Math.sin(a) * 10); c.stroke(); }
      c.fillStyle = '#ee3040'; c.strokeStyle = I; c.lineWidth = 1.2; c.beginPath(); c.rect(-10.4, -0.5, 20.8, 3); c.fill(); c.stroke();
      c.strokeStyle = '#d8d0e0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -13); c.stroke();
    } else if (kind === 'toque') {
      // a chef's toque: a pleated white band and a big puffy top, cool grey shading so it reads as cloth
      const top = c2 => { c2.beginPath(); c2.arc(-5, -10, 5.4, 0, TAU); c2.moveTo(10.4, -10); c2.arc(5, -10, 5.4, 0, TAU); c2.moveTo(5.6, -14); c2.arc(0, -14, 5.6, 0, TAU); c2.rect(-7.5, -10, 15, 12); };
      c.strokeStyle = I; c.lineWidth = 3; top(c); c.stroke();
      c.fillStyle = '#ffffff'; top(c); c.fill();
      c.fillStyle = '#d8dcec'; c.beginPath(); c.arc(5, -9, 4, 0.2, 2.2); c.fill(); c.beginPath(); c.arc(-5, -9, 4, 0.6, 2.6); c.fill();
      c.strokeStyle = '#b8bcd0'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-3, -15); c.quadraticCurveTo(-1, -12, -2, -9); c.moveTo(3, -15); c.quadraticCurveTo(1, -12, 2, -9); c.stroke();
      c.fillStyle = '#f2f2fa'; c.strokeStyle = I; c.lineWidth = 1.3; c.beginPath(); c.rect(-7.5, -4, 15, 6); c.fill(); c.stroke();
      c.strokeStyle = '#a8acc0'; c.lineWidth = 1; c.beginPath(); for (const px of [-4.5, -1.5, 1.5, 4.5]) { c.moveTo(px, -3); c.lineTo(px, 1); } c.stroke();
    } else {
      // a bobble hat: a knitted dome with a stripe, a ribbed cuff, a fat pompom
      const P = c2 => { c2.beginPath(); c2.moveTo(-9.5, 0); c2.bezierCurveTo(-9.5, -13, 9.5, -13, 9.5, 0); c2.closePath(); };
      this.sil(c, c2 => { c2.beginPath(); c2.arc(0, -12.5, 4.8, 0, TAU); }, '#ffffff');
      c.strokeStyle = I; c.lineWidth = 3; P(c); c.stroke(); c.beginPath(); c.rect(-10.5, -2.5, 21, 5); c.stroke();
      c.fillStyle = '#ff7a2a'; P(c); c.fill();
      c.save(); P(c); c.clip(); c.fillStyle = '#2a8ae8'; c.fillRect(-12, -7, 24, 3); c.restore();
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.3; c.beginPath(); c.ellipse(-4, -6, 2, 2.6, -0.4, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#e8402a'; c.strokeStyle = I; c.lineWidth = 1.3; c.beginPath(); c.rect(-10.5, -2.5, 21, 5); c.fill(); c.stroke();
      c.strokeStyle = '#a82a1a'; c.lineWidth = 1; c.beginPath(); for (let px = -8; px <= 8; px += 2.7) { c.moveTo(px, -1.5); c.lineTo(px, 1.6); } c.stroke();
      c.strokeStyle = '#c8c8d8'; c.lineWidth = 1; c.beginPath(); c.moveTo(-2, -14); c.lineTo(-1, -12); c.moveTo(2, -11); c.lineTo(1.5, -13.5); c.moveTo(-2.5, -10.5); c.lineTo(-1, -11); c.stroke();
    }
  },
  // one hat at (x, y): the middle of its brim, s world px per unit, tilted rot; spin: the beanie's propeller angle
  drawAt(ctx, kind, x, y, s, rot, spin) {
    const B = this.BOX, img = this.sprite(kind);
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s);
    ctx.drawImage(img, B.x, B.y, B.w, B.h);
    if (kind === 'beanie') {
      const w = 7.5 * Math.cos(spin || 0);
      ctx.fillStyle = this.INK; ctx.fillRect(-Math.abs(w) - 0.9, -14.9, Math.abs(w) * 2 + 1.8, 3.4);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(w < 0 ? w : 0, -14, Math.abs(w), 1.6);
      ctx.fillStyle = '#ee3040'; ctx.fillRect(w < 0 ? 0 : -w, -14, Math.abs(w), 1.6);
      ctx.fillStyle = this.INK; ctx.beginPath(); ctx.arc(0, -13.2, 1.3, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  // the hat on e's head, in world coordinates (the world transform is set)
  draw(ctx, e, play) {
    const I = e._hatInfo, H = I.head, flip = (e.dir || 1) < 0;
    let hx = e.x + e.w / 2 + (flip ? -H[1] : H[0]) * e.w, hy = e.y + e.h + H[2] * e.h;
    // the atlas art's squash and stretch about the feet (TourSprite.squash; no arrays here)
    if (e.cfg && e.artMode !== undefined && e instanceof TourEnemy && TourSprite.of(e) && !(TourKit.reduceMotion && TourKit.reduceMotion())) {
      const t = (e.t || 0) + (e.seed || 0) * 0.37, m = e.artMode;
      let sy = 1;
      if (m === 'idle' || m === 'wave') sy = 1 + Math.sin(t * 3.2) * 0.035;
      else if (m === 'walk') sy = 1 + Math.abs(Math.sin(t * 7.5)) * 0.05 - 0.025;
      else if (m === 'notice') sy = 0.88;
      else if (m === 'throw') sy = e.st > 0.2 ? 1.1 : 0.94;
      else if (m === 'hop') sy = e.vy < 0 ? 1.12 : 0.97;
      else if (m === 'charge') sy = 0.95;
      hy = e.y + e.h + (hy - e.y - e.h) * sy;
    }
    const s = H[3] || clamp(Math.sqrt(e.w * e.h) / 30, 0.5, 0.85), wob = Math.sin(play.t * 3 + e.x * 0.05) * 0.06;
    this.drawAt(ctx, I.kind, hx, hy, s, (flip ? -0.12 : 0.12) + wob, play.t * 14 + e.x);
  }
};

/* ---------- every registered type that is NOT an animal (no hat). tools/sbw_hats_test.js checks each type is in
   exactly one of HEADS and NOT. Grouped: the base game; the tour's toolkit; then each land's own. ---------- */
TourHats.NOT = new Set([].concat(
  // the old Black Rock City game: hazards, platforms, pickups, doors, burners (people), spirits, gimmicks
  'jelly snapper leaper emberchain bolt mplat fplat gold spring checkpoint gate portal sign driver hippie raver camplead greeter spinner pony influencer techbro crusty creeper dpw witch ledjelly devil thief poet glyph inkblot gifter geyser pancake bubbler roller barrel laser sweeper subwoofer horn poiring key lock lamp flashtrap giftbooth vent devilzone moop dropper banner discoball surfer jellypad boss'.split(' '),
  // the tour's toolkit: stands, drafts, curtains and doors, trapdoors, rails, levers, shutters, catapults, rings,
  // zip lines, fans, switches, walls, teleports, crates, plates, lamps, blocks, wheels, balloons, mirrors, arenas,
  // the thief and rival controllers (their critter is looked up through ALIAS), watchers (wind-up tin dogs), hiding
  // spots, bottles, shops, balls, maze shutters, Pupo and his reach pieces, the secret rooms' props and heads,
  // warps, the backstage wind-up mouse (a toy), the Brady Buttons
  'gearStand tourDraft tourCurtain trapdoor railCart railSwitch railTrack lever shutter catapult ring zipLine fan toggleSwitch toggleGate breakWall teleport surfaceSkin crate plate flipLine lampPost phaseBlocks tourDoom pedestal wheelHub seesaw balloon sunSource mirror sunReceptor holdArena tourThief tourRival watcher alarmShutter hideSpot bottle souvenirShop tourBall mazeShutter napBox pupoFree pupoGrab pupoClimb pupoBar pupoHandle pupoTickle pupoGrille pupoSnatch pupoFerry pupoGondola roomCage roomPot roomLamp roomHole roomDealer roomChest roomKeeper roomFlag warp bkMouse button'.split(' '),
  // animals with no head to wear a hat on: the leapers shoot out of the water (or a basket) head first and dive back;
  // the oyster is a shell; the branch bat and the moray hang upside down or hide in a hole; the manta (a three-tile
  // slipstream ray) and the walrus (a sleeping trampoline across three seats) are scenery-sized
  'aqSeal aqOrca brPiranhaLeap idFlyfish jpKoi maCobra mxAxolotl vnSquid frOyster mzBranchBat idMoray idManta eyeWalrus'.split(' '),
  // Antarctica: snowballs, the rover (a machine), storms, icicles, blocks, floes, snow piles, the shop keeper (already in a woolly hat), banners, winds
  'aqSnowball aqRover aqStorm aqIcicle aqBlock aqFloe aqSnowPile aqKeeper aqLeadIcicle aqBanner aqKatabatic'.split(' '),
  // Brazil: coconuts, sweets, drums, cannons, logs, balls, the kite, floats, tells, targets, the cousin's hammock, thermals, the rainbow bridge
  'brCoconut brBrigadeiro brPandeiro brCannon brLogDrop brFootball brBallCannon brKite brBeatFloat brBeatCannon brHollowTell brKickTarget brTrainingBall brCousin brThermal brRainbowBridge'.split(' '),
  // Ecuador: bananas, cacao pods, ice cubes, icicles, surges, vents, levers, gravity zones, presses, belts
  'ecBanana ecCacao ecIceCube ecIcicle ecSurge ecVent ecLever ecGravZone ecPress ecBeltLever ecPodBelt'.split(' '),
  // Spain: tomatoes, oranges, horchata, firecrackers, olives, trucks, crackers, crates, rockets, windmills, boards, plugs, brakes
  'esTomato esOrange esHorchata esPetardo esOlive esTruck esCrackers esTomatoProp esCrate esRocket esWindmill esWindBoard esCorkPlug esSailBrake'.split(' '),
  // The Red-Eye: meal trays, carry-ons, bin drops, the lurching clock, sliders, exhaust, tells
  'eyeTray eyeBag eyeBinDrop eyeLurch eyeSlider eyeExhaust eyeSlideTell'.split(' '),
  // Australia (16): the ping, webs, the road and its wheels, giant fruit and its stall, the bear's shadow, the creek mud
  'auPing auWeb auRoad auWheels auFruit auFruitStall auShadow auMud auPuff auOpal'.split(' '),
  // Italy (14): meatballs, moka pots, tomatoes, sour notes (food and objects), the tenor's graters, ramps, crates, oil,
  // dough, ovens, the tilt clock, sliders, racks, barrels, bells' songs, the blackbird diva (in her tiara), cups, washing lines
  'itMeatball itMoka itTomato itNote itGrater itRamp itCrates itOil itDough itOven itTilt itSlider itRack itBarrel itDiva itSong itCup itLine itFacade itFlourTell itSackTell itRopeTell'.split(' '),
  // Festival Fields: wheelie bins, balloon dogs (balloons), beds
  'festBin festBalloon festBed'.split(' '),
  // Kenya (15): scenery and moving parts (gullies, thickets, the herd's spawner, rivers, lakes, the sun, clouds, puddles,
  // the leaf sapling), and the big animals that are platforms or scenery-sized (wildebeest, giraffes, flamingos, the
  // elephant, the river croc that is only eyes or a lunging jaw, the eagle that is mostly a shadow)
  'kePuff keCanopy keReedLedge keDungBall keShaft keGap keThicket keHerd keRiver keLake keSun keCloud kePuddle keLeafBush keGnu keGiraffe keFlamingo keElephant keCroc keEagle'.split(' '),
  // France: bread, pastries, pans, keychains, accordions, macarons, chandeliers, lamp posts, mirrors, ovens, decoys, parcels, hatches, the dovecote
  'frBaguette frCroissant frPoele frKeychain frAccordion frMacaron frChandelier frLampPost frMirror frOven frDecoy frParcel frHatch frDovecote'.split(' '),
  // Indonesia: the rafflesia (a flower), the scarecrow, satay, the cask, the surf rack, floats, kites, the sunrise, bombs, hot rocks, plankton, glow, trees, gongs, groves, durians, winds, steam, vents
  'idRafflesia idScarecrow idSate idCask idRack idSurfRig idFloat idKite idSunrise idBombs idHotRocks idPlankton idBiolum idDurianTree idGong idGongDoor idGrove idDurianProp idRavineWind idLeadTree idSteamPuff idGust idBlueVent idUrchin'.split(' '),
  // Japan: rice balls, eggs, takoyaki, wasabi, capsules, the lucky cat (a figurine), umbrellas, tops, lanterns, poles, chutes, bars, tunnels, plates, chopsticks, steam, pitchers, targets, shutters, claws, floors, revolving walls, ponds, stones, belts, clocks, signs, petals, winds
  'jpOnigiri jpTamago jpTako jpWasabi jpCapsule jpLuckyCat jpUmbrella jpUmbrellaFly jpTop jpChochin jpPole jpShoot jpLowBar jpTunnel jpPlateLoop jpChopsticks jpSteam jpPitcher jpTarget jpShutter jpClaw jpNightingale jpRevolve jpPond jpStone jpBeltPlates jpBeltSwitcher jpNeonClock jpNeonSign jpPetalDraft jpValleyWind'.split(' '),
  // Lost & Found: suitcases, flaps, belts, brollies, scanners, socks
  'lostCase lostFlap lostBelt lostBrolly lostScanner lostSock'.split(' '),
  // The Moon (world 18): wind-up stagehands (tin robots), golf balls, geysers, golf rain, air valves, junk, magnet
  // panels, star pads and bridges, the prop crescent
  'moonHand moonGolf moonGeyser moonGolfRain moonValve moonJunk moonMagPanel moonStarPad moonStarBridge moonCrescent moonGame'.split(' '),
  // The Spare Bone Quarry (world 37, hidden land A12): the dust brush (a brush), a dropped tail, the trackways, vertebrae,
  // rib rungs, clay presses, soft floors, chisels, limb sockets, the rooms' props, the fossil slab's way in
  'bonePill boneBrush boneTail boneTrack boneVert boneRibs bonePress boneSoft boneChisel boneLimbGate boneRoomProp boneSlabGate'.split(' '),
  // Morocco: tagines, teapots, oranges, storms, pots, mirages, gales, lanterns, slabs, lines, portcullises, hooks, chains, grilles, winds
  'maTagine maTeapot maOrange maStorm maPot maMirage maGale maKickPot maShopLantern maMirageSlab maPhaseLine maPortcullis maLidHook maChain maRoofGrille maDownWind'.split(' '),
  // Mexico: peppers, elotes, popcorn, the piñata burro, lava blobs, salsa, melon carts, swingers, cannons, rails, sunbeams, bubbles, the Casa's gates
  'mxPepper mxElote mxPopcorn mxBurro mxLava mxSalsa mxMelonCart mxSwinger mxCannon mxRail mxSunbeam mxBubbleCrack casaGate casaX'.split(' '),
  // Mozambique: cashews, mangoes, the jet, the stampede (a dust cloud), cannons, shells, chili baskets, beams, shutters, gusts
  'mzCashew mzMango mzJet mzStampede mzCannon mzShellPot mzShellBucket mzShellBottle mzChiliBasket mzBeam mzKeyShutter mzGustFx'.split(' '),
  // the Netherlands: cheese, clogs, tulip bulbs, snowmen, stroopwafels, chutes, goudas, hatches, winds, bike hooks
  'nlCheese nlClog nlBulb nlSnowman nlStroop nlChute nlGouda nlHatch nlCanalWind nlBikeHook'.split(' '),
  // Nepal: momos, roti, snowballs, tin bots, Piwi bobbleheads, snow globes, the yak pen, walls, bridges, blizzards, icicles, cameras, roofs, landmarks, Chinka-O, gales, belts, winds, chutes, ramps, banners, jars
  'npMomo npRoti npSnowball npTinBot npBobble npGlobe npPen npSnowWall npBridge npBlizzard npIcicle npCamera npRoof npLandmark npChinka npGale npCrateWall npWallBelt npGustWind npGustBridge npBallChute npBallWall npRiseRamp npIceBridge npFortBanner npJar npCrateBelt npYetiWatch'.split(' '),
  // Vietnam: flying conical hats, the coffee phin, tin scooters, bao, rolls, gỏi, beans, hooks, phở, boats, rafts, signals, ice, roasters, kettles, pedals, lanterns, puppets, goods, gates, rain clouds, the cave's bat swarm
  'vnNon vnPhinDrip vnScooter vnBao vnRoll vnGoi vnBean vnHook vnPho vnBoat vnRaft vnTrainSignal vnIce vnRoaster vnKettle vnPedal vnArenaLantern vnPuppet vnGoods vnTradeGate vnRainCloud vnCaveBats'.split(' '),
  // World 22: alarm clocks, envelopes, hourglasses, echoes, loops, mirrors, panes, strikes, pendulums, copies, slabs, lakes, doors, keys, ink, falling time; 22-6's pages and stamps
  // Iceland (17): aurora ribbons, icebergs, rift slabs, organ pipes, lava blobs, the hidden folk's planks / gates / eye, the sun shields, the secret rooms' bells / organ keys / lanterns, the steam tell
  'isRibbon isBerg isPlate isPipe isEmber isShyEye isShyPlat isShyWall isSunShield isBell isOrganKey isFolkLight isSteamTell'.split(' '),
  // Table for Two (36, a hidden land): the crouton butler (bread), the plates, napkins, creases, cloths, rafts, gates, the
  // bread plate, the hostess and Madame Manners' saucers (cutlery), soup bubbles, room marks, the live postcard, the shadow
  'tabCrumb tabBubble tabPlate tabNapkin tabCrease tabCloth tabRaft tabGate tabBreadPlate tabHostess tabSaucer tabPostcardLive tabRoomMark tabShadowDoor'.split(' '),
  'w22Alarm w22Envelope w22Hourglass w22Echo w22Loop w22Mirror w22Pane w22Strike w22Pendulum w22Copy w22Slab w22Lake w22ReflectDoor w22Key w22Ink w22TimeFall w22NumDoorE rbPage rbStamp rbTornPage'.split(' '),
  // Wrong Side of the Wash (26): the drying nets and their critters (drawn behind the cloth on the far face), the
  // beetle's trouser wall, the peephole tell, sweaters, seams, felt, pockets, peg jaws, loose sheets, the bakery hem
  'washNet washCrawler washBeetleGate washPeep washSweater washSeam washFeltArt washPocket washJaws washLooseSheet washHem'.split(' '),
  // Pupo Standard Time (hidden land A7): thought bubbles, cushions, lashes, lids, mouths, flowers, jaws, rulers, things,
  // pictures, the tell, the bench and hollow (12-1), the full stop, the sentence, Pupo at his lectern, the parrot's echo
  'pstThought pstCushionPad pstLashes pstLid pstMouth pstFlower pstJaw pstRuler pstThing pstPic pstZ pstBench pstHollow pstStop pstStrip pstSpeaker pstEcho'.split(' ')
));

/* ---------- the animals: [fx, fxFlip, fy, size] (see the header) ---------- */
Object.assign(TourHats.HEADS, {
  // 4-1's racing ostrich (a tourRival drawn from its own skin)
  'look:mzOstrichRival': [0.6, -0.38, -1.8, 0.6],
  mxChihuahua: [0.72, 0.72, -1.5, 0], mxAxolotlWalk: [0.43, 0.44, -0.9, 0], mxAxolotlSwim: [0.37, 0.38, -1.11, 0], mxBlindFish: [0.3, 0.3, -0.95, 0],
  mxSwallow: [-0.39, -0.38, -1.56, 0], mxHeron: [0.27, 0.28, -1.45, 0], mxFish: [0.35, 0.35, -0.95, 0], mxBat: [0.03, 0.04, -1.25, 0],
  mxArmadillo: [0.45, 0.45, -0.85, 0], mxXolo: [0.7, 0.7, -1.25, 0.75],
  ecAlpaca: [0.82, 0.82, -1.2, 0.6], ecCondor: [0.4, 0.4, -0.8, 0], ecFrog: [0.21, 0.22, -1.34, 0], ecIguanaSalt: [0.55, 0.55, -1, 0],
  ecGlassFrog: [0.11, 0.09, -0.95, 0], ecHummingbird: [0.1, 0.1, -1.25, 0], ecCrab: [0, 0.01, -1.15, 0], ecDipper: [0.13, 0.14, -1.4, 0],
  ecSeaLionLand: [0.45, 0.45, -0.75, 0], ecIguana: [0.55, 0.55, -1, 0], ecSeaLion: [0.45, 0.45, -0.75, 0], ecPuffer: [0.25, 0.25, -1, 0],
  ecPenguin: [0.48, 0.49, -0.95, 0], ecBooby: [-0.33, 0.33, -1.26, 0.6],
  brCrab: [-0.01, 0, -1.1, 0], brGull: [0.42, 0.42, -0.85, 0], brCoati: [0.3, 0.3, -1.1, 0], brJaguar: [0.45, 0.45, -1.3, 0],
  brPiranha: [0.3, 0.3, -1, 0], brToucanito: [0.25, 0.25, -0.85, 0], brParrot: [0.3, 0.3, -0.95, 0], brSloth: [0.03, -0.03, -1.25, 0],
  brSwift: [0.05, 0.05, -0.8, 0],
  mzWarthog: [0.5, 0.5, -1, 0], mzWeaver: [0.28, 0.28, -0.9, 0], mzPrawn: [0.45, 0.45, -0.7, 0.6], mzMonkey: [0.25, 0.25, -1.18, 0],
  mzGhostCrab: [0, 0.01, -1.05, 0], mzDungBeetle: [0.3, 0.3, -0.65, 0], mzPangolin: [0.45, 0.45, -0.45, 0.6], mzChameleon: [0.4, 0.4, -0.75, 0],
  mzMoleRat: [0.25, 0.25, -1.2, 0], mzFruitBat: [-0.03, -0.02, -1.2, 0],
  maScarab: [0.4, 0.4, -0.8, 0], maFennec: [0.38, 0.38, -1.2, 0], maGoat: [0.6, 0.6, -1.15, 0], maSnail: [0.45, 0.45, -0.95, 0],
  maMoth: [0.35, 0.35, -1.1, 0], maCat: [0.44, 0.45, -1.3, 0], maStork: [0.66, 0.66, -0.85, 0.6], maWatchGoat: [0.47, 0.48, -1.07, 0],
  esBat: [0.03, 0.03, -1.55, 0], esJelly: [0.06, 0.07, -1.05, 0], esShark: [0.35, 0.35, -0.75, 0], esStork: [0.66, 0.66, -0.85, 0.6],
  esPulpo: [0.05, 0.05, -1.45, 0], esGamba: [0.66, 0.68, -1.54, 0], esLizard: [0.5, 0.5, -0.6, 0.55], esKestrel: [0.38, 0.39, -0.9, 0],
  esLynx: [0.55, 0.55, -1.12, 0], esSheep: [0.5, 0.5, -1.05, 0],
  frPigeon: [0.57, 0.58, -1, 0], frPoodle: [0.57, 0.58, -1.5, 0], frCat: [0.62, 0.63, -1.55, 0], frCoq: [0.43, 0.45, -1.2, 0],
  frBoar: [0.5, 0.5, -0.85, 0], frSnail: [0.5, 0.5, -1.15, 0], frMole: [0.2, 0.2, -1, 0], frMagpie: [0.3, 0.31, -0.42, 0],
  frCrab: [-0.04, 0.03, -1.55, 0], frGull: [0.55, 0.55, -0.95, 0], frTrufflePig: [0.5, 0.5, -1.05, 0],
  nlHerring: [0.35, 0.35, -1.45, 0], nlGull: [0.31, 0.32, -0.98, 0], nlCargoGull: [-0.42, -0.42, -1.85, 0], nlBee: [0.35, 0.35, -1.05, 0],
  nlHeron: [0.42, 0.43, -1.18, 0],
  idMacaque: [0.36, 0.37, -1.7, 0], idTokay: [0.55, 0.55, -0.75, 0], idHornbill: [0.35, 0.35, -1.15, 0], idDuck: [0.41, 0.43, -1.36, 0],
  idDragonfly: [0.5, 0.5, -0.7, 0.5], idCivet: [0.42, 0.43, -0.98, 0], idBat: [0.05, 0.05, -1.2, 0], idLionfish: [0.3, 0.3, -1.05, 0.6],
  idGecko: [-0.25, 0.25, -0.95, 0], idJelly: [0.04, 0.05, -1.1, 0], idGlowJelly: [0.07, -0.07, -1.11, 0], idAngler: [0.1, 0.1, -1, 0],
  idMonkey: [0.46, 0.47, -1.42, 0], idTroop: [0.7, 0.72, -1.25, 0], idMotherOrangutan: [-0.05, 0.05, -1.82, 0.85],
  vnSilkworm: [-0.06, -0.05, -0.9, 0], vnShrimp: [0.3, 0.3, -0.65, 0.6], vnCormorant: [0.42, 0.42, -0.95, 0], vnMosquito: [0.15, 0.15, -0.85, 0],
  vnToad: [0.31, 0.32, -1.1, 0], vnBat: [0.05, 0.06, -1.45, 0], vnCaveCrab: [0.2, 0.2, -1.05, 0],
  jpBeetle: [0.38, 0.38, -0.85, 0], jpCrow: [0.36, 0.37, -0.9, 0], jpTanuki: [0.12, 0.12, -1.65, 0], jpShiba: [0.26, 0.26, -1.2, 0],
  jpHeron: [0.26, 0.35, -0.99, 0],
  npMonal: [0.35, 0.35, -1.05, 0], npMarmot: [0.13, 0.15, -1.13, 0], npChough: [0.35, 0.36, -0.95, 0], npYeti: [0.05, 0.05, -1.02, 0.7],
  npYetiSleep: [0.05, 0.05, -1.02, 0.7], npMarmotWatch: [0.13, 0.15, -1.15, 0], npBat: [0.03, 0.04, -1.72, 0],
  aqSkua: [0.34, 0.35, -0.95, 0], aqSkidder: [0.35, 0.35, -1.05, 0], aqPenguin: [0.29, 0.3, -1.25, 0], aqConga: [0.3, 0.3, -1.15, 0],
  aqKrill: [0.45, 0.45, -0.8, 0.5], aqEggSkua: [0.35, 0.35, -0.95, 0],
  w22Moth: [0.25, 0.25, -0.85, 0],
  eyeGoose: [0.41, 0.42, -1.84, 0], eyeGoon: [0.37, 0.39, -1.1, 0],
  festDuck: [0.43, 0.44, -1.6, 0],
  lostCrab: [0.12, 0.12, -1.45, 0], lostMoth: [0.1, 0.11, -1.55, 0], lostBeagle: [0.4, 0.4, -1.12, 0],
  // Australia (16)
  auEmu: [0.4, 0.42, -1.45, 0], auMagpie: [0.37, 0.39, -1.1, 0], auKooka: [0.33, 0.35, -1.15, 0], auYabby: [0.3, 0.3, -1.2, 0],
  auCocky: [0.18, 0.2, -1.35, 0], auWombat: [0.55, 0.55, -1.3, 0], auHuntsman: [0.22, 0.22, -1.14, 0], auRoomSheep: [0.47, 0.47, -1.0, 0],
  // Kenya (15)
  keBeetle: [-0.05, -0.05, -0.8, 0], keWarthog: [0.38, 0.38, -0.95, 0], keVulture: [0.47, 0.47, -0.9, 0], keWeaver: [0.27, 0.27, -0.75, 0], keSentry: [0.1, 0.1, -1.15, 0],
  // Iceland (17)
  isFox: [0.55, 0.55, -1.0, 0], isPuffin: [0.15, 0.15, -1.6, 0], isRam: [0.5, 0.5, -1.0, 0], isTern: [0.3, 0.3, -0.6, 0],
  lostCrab: [0.12, 0.12, -1.45, 0], lostMoth: [0.1, 0.11, -1.55, 0], lostBeagle: [0.4, 0.4, -1.12, 0],
  // Italy (14): the city pigeon, the alley cat
  itPigeon: [0.39, 0.4, -1.5, 0], itCat: [0.53, 0.53, -1.25, 0], itPigeonTell: [0.39, 0.4, -1.5, 0],
  // The Moon (world 18): the moon bunny, the dust mite, the luna moth
  moonBunny: [0.3, 0.3, -1.3, 0], moonMite: [0.2, 0.2, -1.05, 0], moonMoth: [0.02, 0.02, -0.95, 0],
  // The Spare Bone Quarry (world 37): the socket mouse, the plaster newt (and its rib-climbing cousin), the replica rook
  boneMouse: [0.15, 0.15, -1.0, 0], boneNewt: [0.43, 0.43, -0.9, 0], boneClimber: [0, 0, -1.1, 0], boneRook: [0.3, 0.3, -1.05, 0],
  // Table for Two (36): the pepper flea, the knife-rest dachshund, the butter-curl snail
  tabPepper: [0.15, 0.15, -1.55, 0], tabRest: [0.62, 0.62, -1.3, 0], tabButter: [0.45, 0.45, -1.0, 0],
  // Wrong Side of the Wash (26): the peg beetle, the lint lamb, the hanger heron, the sock moth
  washBeetle: [0.45, 0.45, -1.3, 0], washLamb: [0.55, 0.55, -1.1, 0], washHeron: [0.4, 0.4, -1.42, 0], washMoth: [0.08, 0.08, -1.2, 0],
  // Pupo Standard Time (hidden land A7): the pillow louse, the secondhand slug, the napkin bat, the snore pea
  pstLouse: [0.4, 0.4, -1.1, 0], pstSlug: [0.55, 0.55, -1.45, 0], pstBat: [0.02, 0.02, -1.2, 0], pstPea: [0.02, 0.02, -1.15, 0]

});

// drawn after the entity layers and Brady, over every animal on screen (and its dance, rule 3)
TourHooks.on('afterEntities', (play, ctx) => {
  if (!TourRules.fxOn('hats') || !play.level || !play.level.tour) return;
  const E = play.entities, dance = TourRules.fxOn('dance');
  for (let k = 0; k < E.length; k++) {
    const e = E[k];
    if (!TourHats.wears(e) || !play.onScreen(e, 40)) continue;
    if (dance && TourRules.dances(e)) { ctx.save(); TourRules.danceXf(play, ctx, e); TourHats.draw(ctx, e, play); ctx.restore(); }
    else TourHats.draw(ctx, e, play);
  }
});
/* ---------- the map critters (TourOWScenes.critter: the little animals on each land's map) ----------
   MAP[kind] = [x, y]: the top of the critter's head, facing right, from its feet (the map's own units). The kinds left
   out (ostrich, camel, swan, caiman) are long-necked or flat, with no head top to sit a hat on at that size. */
TourHats.MAP = { dog: [5, -12], booby: [2, -17.6], coati: [5, -8.5], hornbill: [1.5, -14], fennec: [5.5, -11.8], stork: [3, -21], hedgehog: [6, -6.2],
  goose: [5, -20.3], gecko: [4, -5.8], buffalo: [8, -11.2], shiba: [5, -12.8], redpanda: [5, -12.8], penguin: [1, -15], yak: [9, -13.3], monkey: [1, -17.7],
  turtle: [8, -5.2], walrus: [9, -15.3], pig: [7, -9.7], tortoise: [10, -6.5] };
if (typeof TourOWScenes !== 'undefined' && TourOWScenes.critter) {
  const cr0 = TourOWScenes.critter;
  TourOWScenes.critter = function (c, kind, x, y, S, f) {
    cr0.call(this, c, kind, x, y, S, f);
    const h = TourHats.MAP[kind]; if (!h || !TourRules.fxOn('hats')) return;
    f = f || 1;
    TourHats.drawAt(c, TourHats.kindOf('map:' + kind), x + f * h[0], y + h[1], 0.36, f * 0.14, 1);
  };
}
// a land's painted map (a cached canvas) is painted again when the ANIMAL HATS switch has changed since
if (typeof TourOverworld !== 'undefined' && TourOverworld.prototype.ensureCache) {
  const ec0 = TourOverworld.prototype.ensureCache;
  TourOverworld.prototype.ensureCache = function () {
    const h = TourRules.fxOn('hats');
    if (this._hats !== undefined && this._hats !== h) this.dirty = true;
    this._hats = h;
    return ec0.apply(this, arguments);
  };
}
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourHats = TourHats; } } catch (e) { /* not in a browser */ }
