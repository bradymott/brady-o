/* ============================================================
   BRADY GOES TO BURNING MAN — World 17's side quests out in Black Rock City (world 500)
   Twelve of Root Society's side quests happen around the city, so they live there now (BurnsOW.addQuests,
   guide §19.6). Brady's friends live at home (World 17) and hang out at their haunts in the city:
   Granny Grip at The Glide, Auntie Nebula at the Steeping Sloth, Kombucha Kev at Root Society's gate,
   Biscuit at the Deep End (they won't let him in the pool in the suit), and Pixel on the night streets.
     w17c_sunrise  SUNRISE AT THE HEART   Nebula: wake at five, reach the heart car on the deep playa before sunrise
     w17c_foam     SUDS UP                Kev: get foamed at the Deep End (3:15 & Esplanade)
     w17c_skate    THE GLIDE              Granny: lace up at The Glide (open playa, 3:30), hit 8 rings
     w17c_radio    GERALD, COME HOME      Kev: announce on DUST FM (2:35), fetch Gerald from Ice Ice Playa
     w17c_darkwads DARKWAD OUTREACH       Pixel (night): light up four darkwads on the night streets
     w17c_ice      ICE, ICE, FURRY        Biscuit: a bag of ice from Ice Ice Playa (2:25) before it melts
     w17c_food     MEALS ON WHEELS        Kev: bacon, grilled cheese, pancakes from the Esplanade kiosks to the friends
     w17c_phone    DIGITAL DETOX          Glimmer: swipe the influencer's phone, lock it in Phone Jail (the Steeping Sloth)
     w17c_hugs     HUG QUOTA              Hugo (Center Camp): eight hugs, needs a LOVE BOMB
     w17c_tea      TEA TIME               Nebula: sit perfectly still on the cushion
     w17c_duck     ART CAR CPR            Captain Quack: belt, battery, filter, crank the Disco Duck, then drive it
     w17c_trade    MUTUAL SIMULTANEOUS GIFTING   Barter Bart: make a trade
   Saves from before the move: a quest done in World 17 is marked done here (BW17C.migrate).
   ============================================================ */

const BW17C = { state: null, L: null };
// the old World 17 ids -> their city ids
BW17C.MOVED = { s_sunrise: 'w17c_sunrise', s_foam: 'w17c_foam', s_skate: 'w17c_skate', s_radio: 'w17c_radio', s_darkwads: 'w17c_darkwads', s_ice: 'w17c_ice',
  s_food: 'w17c_food', s_phone: 'w17c_phone', s_hugs: 'w17c_hugs', s_tea: 'w17c_tea', s_duck: 'w17c_duck', s_trade: 'w17c_trade' };
BW17C.done = id => typeof BurnsOW !== 'undefined' && BurnsOW.questDone ? BurnsOW.questDone(id) : !!BurnsSave.flag(500, 'q:' + id);
// where the set pieces stand: [clock hour, radius] (the playa side of the Esplanade, the heart out on the deep playa)
BW17C.SPOTS = {
  duck: [2.2, 255], ice: [2.4, 280], radio: [2.6, 281], trade: [2.8, 281], bacon: [3.2, 284], rink: [3.45, 262],
  cheese: [3.75, 284], bike: [4.0, 282], pancake: [4.3, 284], content: [4.6, 278], tea: [4.9, 278], hugs: [6.1, 287], heart: [12.75, 360]
};
// darkwads lurk on the night streets (clock hour, radius: on radial roads between the lettered streets, beside lived-in blocks)
BW17C.DARKWADS = [[3.5, 368], [4.0, 412], [2.5, 457], [4.5, 412]];

/* ---------------- old saves: a quest done in World 17 stays done in the city ----------------
   World 17 counts seven Burn Tokens now; the two that moved out (the sunrise, the duck) leave its count with them. */
BW17C.migrate = function (g) {
  let sv; try { sv = BurnsSave.get(); } catch (e) { return; }
  if (!sv || !sv.missions || !sv.tokens) return;
  let ch = false;
  for (const old in BW17C.MOVED) {
    const nu = BW17C.MOVED[old], was = sv.missions['17:' + old] === 'done' || !!sv.tokens['17:' + old];
    if (was && sv.missions['500:' + nu] !== 'done') { sv.missions['500:' + nu] = 'done'; sv.flags['500:q:' + nu] = true; ch = true; }
    if (was && g && g.worldId === 500 && g.missions) { const m = g.missions.get(nu); if (m && m.state !== 'done') m.state = 'done'; }
    if (sv.tokens['17:' + old]) { delete sv.tokens['17:' + old]; ch = true; }
  }
  if (ch) BurnsSave.save();
};

/* ---------------- what the friends say (pitch on accept, a reminder while it runs, a line while it's locked) ---------------- */
BW17C.Q = {
  w17c_sunrise: { pitch: ['Now the most important thing a first-timer can do.', 'The heart car plays a sunrise set out on the deep playa. Lee Burridge is on the decks. You will cry. Bring water.', 'Go to sleep. I\'ll wake you at five. Then RIDE.'],
    remind: g => 'The heart car, deep playa toward 12:45. Before the sun!', locked: ['Meet the neighbours at home first, sweetie. Then I\'ll show you a sunrise.'],
    onAccept(g) { BW17C.sunriseStart(g); } },
  w17c_tea: { pitch: ['Tea ceremony at the Steeping Sloth, sweetie. Right here.', 'Sit on the cushion. Be still. Do NOT touch anything. The tea knows.', 'If you can do that, you can do anything out here.'],
    remind: () => 'Cushion. SIT. Still. The tea is watching.', locked: ['Come and meet the neighbours at home first. Then tea.'] },
  w17c_foam: { pitch: ['Brady. Buddy. Pal. I say this with love.', 'You smell like a porta-potty\'s diary.', 'The Deep End (3:15 on the Esplanade) is running a foam party. Go. Get sudsy. Come back a new man.'],
    remind: () => 'The Deep End foam party. 3:15. GO. I can smell you from here.', locked: ['Kitchen duty first, new kid. Then we talk.'] },
  w17c_radio: { pitch: ['GERALD IS GONE.', 'Gerald. My SCOBY. The kombucha mother. Seven years we\'ve been together.', 'DUST FM is just down the Esplanade (2:35). Get on the air. Somebody out there has seen my baby.'],
    remind: g => { const m = g.missions.get('w17c_radio'); return g.pack && g.pack.has('w17gerald') ? 'You have him?! Bring him here!' : m && m.data.sighted ? 'Ice Ice Playa! On the counter! GO!' : 'DUST FM, 2:35 on the Esplanade. Tell the playa!'; },
    locked: ['Kitchen duty first. Then I\'ll tell you about Gerald. Who is missing. Gerald.'] },
  w17c_food: { pitch: ['Gifting run! The kiosks down the Esplanade are cooking and our people are starving.', 'Bacon for Granny at The Glide, grilled cheese for Biscuit at the Deep End, pancakes for Auntie Nebula at the Steeping Sloth.', 'Ask nicely. Say thank you. Never say "how much".'],
    remind: g => { const m = g.missions.get('w17c_food'); return `${m ? m.n : 0} of 3. Bacon to Granny, cheese to Biscuit, pancakes to Nebula!`; } },
  w17c_skate: { pitch: ['You walk? Every day? With your FEET? Oh, honey.', 'Lace up at the counter, then hit every glowing ring before the song ends.', 'Beat it and you can keep my spare skates. They\'ve got history. Don\'t ask.'],
    remind: () => 'LACE UP at the counter, then every ring in order!', locked: ['Come say hi at home first, kiddo. Granny hugs are mandatory.'] },
  w17c_phone: { pitch: ['Okay so. That influencer on the stage? SO fake. She narrates everybody\'s "authentic moments".', 'Sneak up behind her, swipe that phone, and lock it in the Phone Jail at the Steeping Sloth, next door.', 'Don\'t get in her shot. She\'ll make you do a dance for the fans.'],
    remind: g => g.pack && g.pack.has('w17phone') ? 'Phone Jail! At the Steeping Sloth! Run!' : 'From BEHIND. Not in her shot. Swipe it!', locked: ['You\'re new new, huh? Go meet your neighbours first.'] },
  w17c_ice: { pitch: ['Hiiii. It\'s me, Biscuit. They won\'t let me in the pool. In the suit. Rude.', 'The fursuit is non-negotiable. The heatstroke is optional.', 'Could you get me a bag of ice from Ice Ice Playa (2:25)? Quick, before it melts. And before I do.'],
    remind: g => g.pack && g.pack.has('w17ice') ? 'ICE! Bring it HERE! Hurry!' : 'Ice Ice Playa, 2:25 on the Esplanade. Please. I\'m... becoming soup.', locked: ['*chirp* Come meet me at home first! Tipi with the pink sign!'] },
  w17c_darkwads: { pitch: ['Darkwads: people who come to the brightest city on Earth and wear zero lights.', 'There are four out on these streets right now, invisible, waiting to clothesline a cyclist.', 'Here: a headlamp and a dozen glow sticks. Three sticks each. Brightness is a moral choice.'],
    remind: g => { const m = g.missions.get('w17c_darkwads'); return `${m ? m.n : 0} of 4 lit. Look for the glint off their sunglasses.`; }, locked: ['Help me with the cable at home first. Then we talk darkwads.'],
    onAccept(g) { g.player.lightR = 8; g.glow += 12; g.toast('PIXEL GIFTED A HEADLAMP + 12 GLOW STICKS'); } },
  w17c_hugs: { pitch: ['Hey! Free hugs! I mean, I give them. I\'m also behind on my quota.', 'Eight hugs by sundown or they take my sign away.', 'Pro tip: use a LOVE BOMB from your backpack and EVERYBODY wants a hug. Then just bump into people.'],
    remind: g => { const m = g.missions.get('w17c_hugs'); return `${m ? m.n : 0} of 8! Use your LOVE BOMB and bump into people. Go go go!`; } },
  w17c_duck: { pitch: ['She\'s dead, kid. The Disco Duck. Broke down mid-quack.', 'I need a fan belt from the bike shop (4:00), a battery from DUST FM (2:35), and an air filter.', 'For the filter, ask the sparkle pony by the Content House. Don\'t ask why. You\'ll see.'],
    remind: g => { const m = g.missions.get('w17c_duck'); return m && m.n >= 3 ? 'That\'s everything! FIX IT on the duck and crank her!' : `Parts: ${m ? m.n : 0} of 3. Belt from the bike shop, battery from DUST FM, filter from the sparkle pony.`; } },
  w17c_trade: { pitch: ['We don\'t barter here. We practise mutual simultaneous gifting.', 'You hand me something. I hand you something. At the same time. Totally different.', 'Ground scores, glow sticks, whatever\'s in your backpack. Let\'s gift.'] }
};

/* ---------------- the missions (pushed into world 500; no Burn Tokens, like the city's own side quests) ---------------- */
BW17C.mk = (k, o) => Object.assign({ id: 'w17c_' + k, side: true, token: false, type: 'custom', start: 'manual' }, o);
BW17C.MISSIONS = [
  BW17C.mk('sunrise', { name: 'Sunrise at the Heart', short: 'Reach the heart car before sunrise', giver: 'w17c_nebula', requires: ['17:neighbors'],
    desc: 'Auntie Nebula wakes you at five. Ride from your tipi to the heart-topped sound car on the deep playa before the sun comes up.', hint: 'The heart car, deep playa toward 12:45. Bike!',
    reward: [{ glow: 25 }, { text: 'A heart flag for your tipi' }], onStart(g, m) { m.left = undefined; }, onUpdate(g, m, dt) { BW17C.sunriseStep(g, m, dt); }, onComplete(g) { BW17.giveDecor(g, 'heartflag'); }, onFail(g) { BW17C.skyOff(g, true); } }),
  BW17C.mk('foam', { name: 'Suds Up', short: 'Stand in the foam at the Deep End', giver: 'w17c_kev', requires: ['17:kitchen'],
    desc: 'Kev says you smell like a porta-potty\'s diary. The Deep End is throwing a foam party: go stand in the foam.', hint: 'The Deep End, 3:15 & Esplanade',
    reward: [{ glow: 15 }, 'water', { text: 'Smelling like lavender' }], onUpdate(g, m, dt) { BW17C.foamStep(g, m, dt); }, onComplete(g) { BW17C.meter(null); }, onFail(g) { BW17C.meter(null); } }),
  BW17C.mk('skate', { name: 'The Glide', short: 'Lace up, then hit all 8 rings', giver: 'w17c_granny', requires: ['17:neighbors'], count: 8, progressLabel: 'Rings',
    desc: 'Granny Grip\'s roller-disco challenge: lace up at The Glide, then skate through every glowing ring before the song ends.', hint: 'The Glide roller disco, open playa at 3:30',
    reward: [{ glow: 25 }, { text: 'Granny\'s spare skates for your tipi' }], onStart(g, m) { m.left = undefined; }, onUpdate(g, m, dt) { BW17C.skateStep(g, m, dt); }, onComplete(g) { BW17C.skatesOff(g); BW17.giveDecor(g, 'skates'); }, onFail(g) { BW17C.skatesOff(g); } }),
  BW17C.mk('radio', { name: 'Gerald, Come Home', short: 'Announce it on DUST FM, find Gerald', giver: 'w17c_kev', requires: ['17:kitchen'],
    desc: 'Kev\'s SCOBY, Gerald, is missing. Put a lost-and-found announcement out on DUST FM 94.5, then go get him.', hint: 'DUST FM 94.5, 2:35 on the Esplanade (the tall antenna)',
    reward: [{ glow: 20 }, { pack: { w17booch: 2 } }], onStart(g) { BW17C.clearItems(g, ['w17gerald']); } }),
  BW17C.mk('darkwads', { name: 'Darkwad Outreach', short: 'Light up 4 darkwads (3 glow sticks each)', giver: 'w17c_pixel', requires: ['17:cable'], count: 4, progressLabel: 'Darkwads lit',
    desc: 'Four darkwads lurk unlit on the night streets. Light them up: ACTION with three glow sticks each.', hint: 'Night only. The streets round 3:30 & Arcade.',
    reward: [{ glow: 30 }, { text: 'Fairy lights for your tipi' }], onComplete(g) { BW17.giveDecor(g, 'fairy'); } }),
  BW17C.mk('ice', { name: 'Ice, Ice, Furry', short: 'Ice from Ice Ice Playa to Biscuit before it melts', giver: 'w17c_biscuit', requires: ['17:neighbors'],
    desc: 'Biscuit the fursuiter is overheating at the Deep End. Get a bag of ice from Ice Ice Playa and run it back before it melts.', hint: 'Ice Ice Playa, 2:25 on the Esplanade. A bike helps.',
    reward: [{ costume: 'furcoat' }, { heal: 6 }], onUpdate(g, m, dt) { BW17C.iceStep(g, m, dt); }, onFail(g) { BW17C.meter(null); if (g.pack && g.pack.has('w17ice')) g.pack.take('w17ice'); g.player.hold(null); } }),
  BW17C.mk('food', { name: 'Meals on Wheels', short: 'Bacon → Granny, cheese → Biscuit, pancakes → Nebula', giver: 'w17c_kev', requires: ['17:kitchen', '17:neighbors'], count: 3, progressLabel: 'Meals delivered',
    desc: 'The gifting kiosks down the Esplanade are cooking. Pick up bacon, grilled cheese and pancakes, then deliver them to your friends around the city.', hint: 'Kiosks at 3:10, 3:45 and 4:20 on the Esplanade',
    reward: [{ glow: 20 }, 'water'], onStart(g) { BW17C.clearItems(g, ['w17bacon', 'w17cheese', 'w17pancake']); } }),
  BW17C.mk('phone', { name: 'Digital Detox', short: 'Swipe the influencer\'s phone, lock it in Phone Jail', giver: 'w17c_glimmer', requires: ['17:neighbors'],
    desc: 'Sneak up behind the influencer at the #ContentHouse, swipe her phone without getting in her shot, and lock it in the Phone Jail at the Steeping Sloth.', hint: '#ContentHouse, 4:35 on the Esplanade. Phone Jail next door.',
    reward: [{ glow: 25 }, 'water'], onUpdate(g, m) { BW17C.phoneStep(g, m); },
    onFail(g) { const a = g.actor('w17c_brielle'); if (a) a.def.hasPhone = true; if (g.pack && g.pack.has('w17phone')) g.pack.take('w17phone'); g.player.hold(null); } }),
  BW17C.mk('hugs', { name: 'Hug Quota', short: 'Hug 8 burners (use a LOVE BOMB)', giver: 'w17c_hugo', requires: ['17:arrive'], count: 8, progressLabel: 'Hugs', use: 'molly', useHint: 'USE A LOVE BOMB!',
    desc: 'Hugo is behind on his free-hug quota. Use a LOVE BOMB from your backpack, then bump into eight burners.', hint: 'Hugo is at Center Camp (6:00)',
    reward: [{ glow: 25 }, { heal: 6 }], onStart(g) { if (g.pack && !g.pack.has('molly')) { g.pack.add('molly'); g.toast('HUGO GIFTED YOU A LOVE BOMB → BACKPACK'); } }, onUpdate(g, m, dt) { BW17C.hugStep(g, m, dt); } }),
  BW17C.mk('tea', { name: 'Tea Time', short: 'SIT on the cushion and stay perfectly still', giver: 'w17c_nebula', requires: ['17:neighbors'],
    desc: 'The tea ceremony at the Steeping Sloth: sit on the cushion and don\'t touch anything while it steeps.', hint: 'The Steeping Sloth tea lounge, 4:55 on the Esplanade',
    reward: [{ heal: 6 }, 'w17tea', { glow: 10 }], onUpdate(g, m, dt) { BW17C.teaStep(g, m, dt); }, onFail(g) { BW17C.unsit(g); } }),
  BW17C.mk('duck', { name: 'Art Car CPR', short: 'Fan belt, battery, air filter for the Disco Duck', giver: 'w17c_quack', requires: ['17:arrive'], count: 3, progressLabel: 'Duck parts',
    desc: 'The Disco Duck broke down on the open playa. Fetch three parts, then crank her up.', hint: 'The duck is on the open playa off 2:10',
    reward: [{ glow: 25 }, { text: 'The Disco Duck is yours to drive' }], onStart(g) { BW17C.clearItems(g, ['w17belt', 'w17battery', 'w17filter']); }, onUpdate(g, m, dt) { BW17C.crankStep(g, m, dt); },
    onComplete(g) { BW17C.clearItems(g, ['w17belt', 'w17battery', 'w17filter']); } }),
  BW17C.mk('trade', { name: 'Mutual Simultaneous Gifting', short: 'Make a trade with Bart', giver: 'w17c_bart', requires: ['17:arrive'],
    desc: 'Bart at the Totally Not a Trading Post doesn\'t barter. He "gifts simultaneously". Make one trade.', hint: 'Totally Not a Trading Post, 2:50 on the Esplanade',
    reward: [{ glow: 15 }, { text: 'A deep sense of moral ambiguity' }], onEvent(g, m, name) { if (name === 'trade') BW17C.after(g, 0.4, g2 => g2.missions.complete('w17c_trade')); } })
];

/* ---------------- little helpers ---------------- */
BW17C.D = (g, x, z) => Math.hypot(g.player.x - x, g.player.z - z);
BW17C.clearItems = function (g, ids) { if (!g.pack) return; for (const id of ids) { const n = g.pack.count(id); if (n) g.pack.take(id, n); } };
BW17C.after = function (g, t, fn) { const S = BW17C.state; if (S && S.g === g) S.timers.push({ t, fn }); };
BW17C.meter = function (M) { if (BW17C.state) BW17C.state.meter = M; };
BW17C.ok = g => !!(BW17C.state && BW17C.state.g === g);
// the city's night: the blended sun elevation of its sky (the same rule as the camps + big art)
BW17C.nightK = function (g) {
  try {
    const A = BurnsEnv.resolve(g.palA || 'dusk'), B = g.palB ? BurnsEnv.resolve(g.palB) : A, el = lerp(A.sun[1], B.sun[1], g.tod || 0);
    return clamp((8 - el) / 14, 0, 1);
  } catch (e) { return 0; }
};
BW17C.isNight = g => BW17C.nightK(g) > 0.55;
// a giver with a list: remind about the running one, else offer the next available one in order, else idle lines
BW17C.offer = function (g, a, ids, idle) {
  const M = g.missions;
  const act = ids.find(id => M.state(id) === 'active');
  if (act) { const Q = BW17C.Q[act]; g.say(a, [Q && Q.remind ? Q.remind(g) : M.get(act).def.hint]); return true; }
  const av = ids.find(id => M.state(id) === 'available');
  if (av) {
    const Q = BW17C.Q[av] || { pitch: ['Got a job for you.'] };
    if (Q.gate && !Q.gate(g, a)) return true;
    g.say(a, Q.pitch, () => { if (M.start(av)) { M.track(av); if (Q.onAccept) Q.onAccept(g, a); } });
    return true;
  }
  const lk = ids.find(id => M.state(id) === 'locked');
  if (lk && BW17C.Q[lk] && BW17C.Q[lk].locked) { g.say(a, BW17C.Q[lk].locked); return true; }
  if (idle) g.say(a, idle);
  return false;
};
BW17C.duckPart = function (g, m) { m.n = Math.min(3, m.n + 1); g.toast(`DUCK PARTS: ${m.n}/3`); if (m.n >= 3) { g.banner('ALL THREE PARTS!', 'Back to the Disco Duck: FIX IT', { col: '#ffd21a' }); m.data.marker = 'w17c_quack'; } };

/* ---------------- the set pieces, people and prompts ---------------- */
BW17C.build = function (api, g) {
  const O = BURNS_OW, at = (h, r) => O.at(h, r), out = h => O.yawOut(h);
  const S = BW17C.state = { g, timers: [], meter: null, sky: null, skates: false, stink: false, sit: null, crank: null, hugged: new Set(), foam: [], foamAt: null, nightK: -1 };
  BW17C.migrate(g);
  const L = BW17C.L = {};
  const piece = (k, fn) => { const [h, r] = BW17C.SPOTS[k], q = at(h, r), yaw = out(h); L[k + 'Yaw'] = yaw; L[k] = fn(q[0], q[1], yaw); return L[k]; };
  piece('rink', (x, z, y) => BW17.B.rink(api, x, z, y));
  piece('ice', (x, z, y) => BW17.B.iceDepot(api, x, z, y));
  piece('radio', (x, z, y) => BW17.B.radio(api, x, z, y));
  piece('tea', (x, z, y) => BW17.B.teaLounge(api, x, z, y));
  piece('content', (x, z, y) => BW17.B.contentHouse(api, x, z, y));
  piece('bike', (x, z, y) => BW17.B.bikeShop(api, x, z, y));
  piece('bacon', (x, z, y) => Object.assign(BW17.B.kiosk(api, x, z, y, { name: 'SIZZLE SANCTUARY · BACON', food: 'bacon', col: '#c84a3a' }), { yaw: y + Math.PI }));
  piece('cheese', (x, z, y) => Object.assign(BW17.B.kiosk(api, x, z, y, { name: 'SAY CHEESE! · GRILLED', food: 'cheese', col: '#e8a82a', fg: '#6a3a10' }), { yaw: y + Math.PI }));
  piece('pancake', (x, z, y) => Object.assign(BW17.B.kiosk(api, x, z, y, { name: 'FLAPJACK FLASHBACK', food: 'pancake', col: '#7a4aaa', fg: '#3a1a5a' }), { yaw: y + Math.PI }));
  // the trading post (a counter under a little shade, gifts on the counter)
  piece('trade', (x, z, y) => {
    api.mesh(x, z, m => {
      m.color('#8a6a44').shine(1); m.roundBox(0, 0.5, 0, 3.0, 1.0, 1.0, 0.08, { top: '#a8865c' });
      m.color('#3a6a8a'); m.push(); m.tf(0, 2.5, 0.2, 0, 0.25); m.roundBox(0, 0, 0, 3.4, 0.06, 1.8, 0.03); m.pop();
      for (const sx of [-1.5, 1.5]) { m.color('#5a4030'); m.limb(sx, 0, -0.4, sx, 2.6, -0.4, 0.04, 0.04, { seg: 4 }); }
      for (let k = 0; k < 6; k++) { m.color(BURNS_NEON[k]).shine(2); m.ball(-1.1 + k * 0.44, 1.12, 0, 0.12, { seg: 8, rings: 5 }); }
      m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.5, hz: 0.5, y0: 0, y1: 1.0 }], lights: [{ x: 0, y: 0, z: 1, s: 0, c: '#ffcf8a', pool: 5, i: 0.4 }] };
    }, { yaw: y });
    BW17.sign(api, 'TOTALLY NOT A\nTRADING POST', x + Math.sin(y) * 1.0 + Math.cos(y) * 1.8, z + Math.cos(y) * 1.0 - Math.sin(y) * 1.8, y, { h: 0.9, y: 1.4, bg: '#f4e8c8', fg: '#3a2414', border: '#3a2414', size: 34 });
    return { host: [x - Math.sin(y) * 1.0, z - Math.cos(y) * 1.0] };
  });
  // the Disco Duck, broken down on the open playa (drivable once she's fixed: the flag is shared with old saves)
  { const [h, r] = BW17C.SPOTS.duck, q = at(h, r), yaw = out(h) + Math.PI / 2; L.duck = q; L.duckYaw = yaw;
    S.duckCar = api.artCar({ x: q[0], z: q[1], yaw, build: m => BW17.B.duckModel(m), maxSpeed: 7.5, label: 'DRIVE THE DUCK', horn: 'artcarHorn',
      hornLines: ['QUACK QUACK!', 'IT\'S THE DISCO DUCK!', 'Duck! Duck! DUCK!'], driveHint: 'DRIVING THE DISCO DUCK · JUMP = QUACK', when: () => !!BurnsSave.flag(17, 'duckFixed') }); }
  // the heart car on the deep playa, a DJ silhouette at the decks, a crowd that never went to bed
  { const [h, r] = BW17C.SPOTS.heart, q = at(h, r); L.heartCar = BW17.B.heartCar(api, q[0], q[1], 0); L.heartFloor = L.heartCar.floor;
    BW17.B.heartDJ(api, L.heartCar.booth[0], L.heartCar.boothY, L.heartCar.booth[1], Math.PI);
    const f = L.heartFloor, rng = mulberry32(1747);
    for (let i = 0; i < 16; i++) { const a = rng() * TAU, rr = 2 + Math.sqrt(rng()) * 6, x = f[0] + Math.sin(a) * rr, z = f[1] + Math.cos(a) * rr;
      if (api.extra) api.extra(x, z, { yaw: Math.atan2(L.heartCar.booth[0] - x, L.heartCar.booth[1] - z) + (rng() - 0.5) * 0.5, anim: 'dance', look: i % 4, phase: [0, 0.41][i % 2] }); }
    BW17.sign(api, 'THE HEART\nSUNRISE SETS', f[0] + 9, f[1] - 4, 0.3, { h: 0.85, bg: '#2a0a1a', fg: '#ffd0e4', border: '#ff3b7a', glow: '#ff4f8a', size: 32 }); }
  // foam cannons round the Deep End's pool
  { const de = O.state && O.state.camps ? O.state.camps.find(c => c.kind === 'deepEnd') : null, f = de && de.spots && de.spots.floor;
    const c0 = f ? [f.x, f.z] : (() => { const q = O.address('The Deep End'); return [q[0], q[1]]; })();
    L.foam = [c0[0], c0[1], 6.5]; S.foamAt = L.foam;
    for (let i = 0; i < 3; i++) { const a = (i - 1) * 1.1 + Math.atan2(-c0[0], -c0[1]), cx = c0[0] + Math.sin(a) * 8.5, cz = c0[1] + Math.cos(a) * 8.5, yy = Math.atan2(c0[0] - cx, c0[1] - cz); S.foam.push([cx, 2.6, cz, yy]);
      api.mesh(cx, cz, m => { m.color('#3a3a44').shine(2); m.limb(0, 0, 0, 0, 2.4, 0, 0.06, 0.05, { seg: 6 }); m.push(); m.tf(0, 2.55, 0, 0, Math.PI / 2 - 0.35); m.color('#38c8ff').shine(2); m.roundCyl(0, -0.4, 0, 0.22, 0.8, 0.05, { seg: 12 }); m.pop(); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 2.4, camPass: true }] }; }, { yaw: yy }); } }
  /* --- the people --- */
  const npc = d => api.npc(d);
  const near = (q, yaw, dx, dz) => [q[0] + Math.cos(yaw) * (dx || 0) + Math.sin(yaw) * (dz || 0), q[1] - Math.sin(yaw) * (dx || 0) + Math.cos(yaw) * (dz || 0)];
  // Kombucha Kev at Root Society's gate on the Esplanade
  { const rs = O.state && O.state.camps ? O.state.camps.find(c => c.kind === 'rootSociety') : null, gs = rs && rs.spots && rs.spots.gate;
    const q = gs ? [gs.x, gs.z] : at(2.0, 312), yaw = gs ? gs.yaw || out(2) : out(2) + Math.PI; const k = near(q, out(2), 4.2, -3);
    L.kev = k; npc({ id: 'w17c_kev', name: 'KOMBUCHA KEV', type: 'w17Kev', seed: 1, x: k[0], z: k[1], yaw: O.yawIn(2) + 0.4, talk: (g2, a) => BW17C.talkKev(g2, a) });
    BW17.sign(api, 'FREE KOMBUCHA\n(ASK ABOUT GERALD)', k[0] + Math.cos(out(2)) * 1.6, k[1] - Math.sin(out(2)) * 1.6, O.yawIn(2), { h: 0.7, y: 1.2, bg: '#f4e8c8', fg: '#3a5a2a', border: '#7aff5a', size: 30 }); }
  // Granny at The Glide, the rink DJ, skaters
  { const R = L.rink, gq = near(R.rental, L.rinkYaw, 2.6, 0.6); L.granny = gq;
    npc({ id: 'w17c_granny', name: 'GRANNY GRIP', type: 'w17Granny', seed: 1, x: gq[0], z: gq[1], yaw: L.rinkYaw, talk: (g2, a) => BW17C.talkGranny(g2, a) });
    npc({ id: 'w17c_rinkdj', name: 'DJ ROLLERBLADE RUNNER', type: 'annoyingdj', seed: 4, x: R.booth[0] - Math.sin(L.rinkYaw) * 0.6, z: R.booth[1] - Math.cos(L.rinkYaw) * 0.6, yaw: L.rinkYaw + Math.PI, anim: 'dj', chat: ['Couples skate in five!', 'Everybody clap! Not you, you\'ll fall!', 'This next one goes out to Granny Grip!'] });
    const c = R.center, cy = Math.cos(L.rinkYaw), sy = Math.sin(L.rinkYaw), W = (lx, lz) => [c[0] + lx * cy + lz * sy, c[1] - lx * sy + lz * cy];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, p0 = W(Math.sin(a) * 11, Math.cos(a) * 6);
      npc({ type: ['tutu', 'ledsuit', 'furcoat', 'burner'][i % 4], seed: 50 + i, x: p0[0], z: p0[1], behavior: 'walk', path: Array.from({ length: 12 }, (_, k) => { const t = a + k / 12 * TAU; return W(Math.sin(t) * 11, Math.cos(t) * 6); }), speed: 3.2, walkAnim: 'shuffle', ambient: true }); } }
  // Auntie Nebula + Steepy at the Steeping Sloth
  { const T = L.tea, nq = near(T.front, L.teaYaw, -2.4, 0.4); L.nebula = nq;
    npc({ id: 'w17c_nebula', name: 'AUNTIE NEBULA', type: 'w17Nebula', seed: 1, x: nq[0], z: nq[1], yaw: L.teaYaw, talk: (g2, a) => BW17C.talkNebula(g2, a) });
    npc({ id: 'w17c_steepy', name: 'STEEPY', type: 'healer', seed: 2, x: T.bar[0], z: T.bar[1], yaw: L.teaYaw, lines: ['The tea is ready when you stop asking if the tea is ready.', 'Sit. Breathe. Do not touch the cushion tassels.'] }); }
  // Biscuit at the Deep End's gate (no fursuits in the pool)
  { const q = O.address('The Deep End'), h = BURNS_OW.clock(q[0], q[1]), b = at(h - 0.035, Math.hypot(q[0], q[1]) - 4); L.biscuit = b;
    npc({ id: 'w17c_biscuit', name: 'BISCUIT', type: 'furry', seed: 3, x: b[0], z: b[1], yaw: O.yawIn(h), talk: (g2, a) => BW17C.talkBiscuit(g2, a) });
    BW17.sign(api, 'NO FURSUITS\nIN THE POOL', b[0] + Math.cos(out(h)) * 2.2, b[1] - Math.sin(out(h)) * 2.2, O.yawIn(h), { h: 0.7, y: 1.3, bg: '#e8f8ff', fg: '#c83a3a', border: '#38c8ff', size: 30 }); }
  // Pixel (night shift) on the streets with her darkwads
  { const [h, r] = BW17C.DARKWADS[0], q = at(h, r - 11); L.pixel = q;
    npc({ id: 'w17c_pixel', name: 'PIXEL', type: 'w17Pixel', seed: 1, x: q[0], z: q[1], yaw: O.yawIn(h), talk: (g2, a) => BW17C.talkPixel(g2, a) }); }
  BW17C.DARKWADS.forEach(([h, r], i) => { const q = at(h, r); npc({ id: 'w17c_dw' + i, type: 'darkwad', seed: 40 + i, x: q[0], z: q[1], yaw: O.yawIn(h) + i, behavior: 'darkwad', radius: 3, cost: 3, chatter: false,
    onLit(g2) { if (g2.missions.state('w17c_darkwads') === 'active') g2.missions.progress('w17c_darkwads'); } }); });
  // Hugo at Center Camp with his sign
  { const [h, r] = BW17C.SPOTS.hugs, q = at(h, r); L.hugo = q;
    npc({ id: 'w17c_hugo', name: 'HUGO', type: 'greeter', variant: 'm', seed: 6, prop: 'w17HugSign', x: q[0], z: q[1], yaw: O.yawIn(h), talk: (g2, a) => BW17C.offer(g2, a, ['w17c_hugs'], ['Quota met! They\'re letting me keep the sign! Come here. One more. For the road.']) }); }
  // Captain Quack by his duck
  { const q = near(L.duck, L.duckYaw, -3.4, 1); L.quack = q;
    npc({ id: 'w17c_quack', name: 'CAPTAIN QUACK', type: 'crusty', seed: 21, variant: 'kilt', x: q[0], z: q[1], yaw: L.duckYaw + Math.PI / 2, talk: (g2, a) => BW17C.talkQuack(g2, a) }); }
  // the duck's parts: Wendy at the bike shop, Deep Dust at DUST FM, Glimmer by the Content House
  npc({ id: 'w17c_wendy', name: 'WRENCH WENDY', type: 'burner', seed: 9, x: L.bike.bench[0], z: L.bike.bench[1], yaw: L.bikeYaw, anim: 'clipboard', talk: (g2, a) => BW17C.talkWendy(g2, a) });
  npc({ id: 'w17c_deepdust', name: 'DJ DEEP DUST', type: 'annoyingdj', seed: 7, x: L.radio.mic[0], z: L.radio.mic[1], yaw: L.radioYaw + Math.PI, anim: 'dj', talk: (g2, a) => BW17C.talkDeepDust(g2, a) });
  { const q = near(L.content.stage, L.contentYaw, 6, -1.5); L.glimmer = q;
    npc({ id: 'w17c_glimmer', name: 'GLIMMER', type: 'sparklepony', seed: 7, x: q[0], z: q[1], yaw: L.contentYaw, behavior: 'idle', talk: (g2, a) => BW17C.talkGlimmer(g2, a) }); }
  // the influencer on her stage
  npc({ id: 'w17c_brielle', name: 'BRIELLE (@DUSTYDREAMZ)', type: 'influencer', seed: 3, x: L.content.stage[0], z: L.content.stage[1], y: 0.6, fixedY: true, yaw: L.contentYaw, aimYaw: L.contentYaw, behavior: 'w17Streamer', chatter: false,
    talk(g2, a) { g2.say(a, a.def.hasPhone === false ? ['I looked up. There\'s a... whole sky? Was that always there?', 'Leave me alone, I\'m having an authentic moment. A real one.'] : ['Hey besties! Oh. You\'re not a bestie. Move, you\'re in the light.']); } });
  // the ice man (the city's Frosty works Center Camp; Ivy runs Ice Ice Playa) + a little line
  npc({ id: 'w17c_ivy', name: 'ICEBERG IVY', type: 'burner', seed: 17, x: L.ice.window[0], z: L.ice.window[1], yaw: L.iceYaw, talk: (g2, a) => BW17C.talkIvy(g2, a) });
  if (api.extra) { const ln = L.ice.line; for (let i = 0; i < 3; i++) { const q = near(ln, L.iceYaw, -i * 1.4, 0); api.extra(q[0], q[1], { yaw: L.iceYaw + Math.PI / 2, anim: 'idle', look: i % 4 }); } }
  // the kiosk hosts (Meals on Wheels)
  const host = (k, id, name, type, seed, item, food, lines) => { const K = L[k]; npc({ id, name, type, seed, x: K.host[0], z: K.host[1], yaw: K.yaw + Math.PI, talk: (g2, a) => BW17C.talkHost(g2, a, item, food, lines) });
    if (api.extra) for (let i = 0; i < 3; i++) { const q = near(K.front, L[k + 'Yaw'], (i - 1) * 1.1, 1.4 + (i % 2) * 0.6); api.extra(q[0], q[1], { yaw: K.yaw, anim: i % 2 ? 'dance' : 'idle', look: (i + 1) % 4 }); } };
  host('bacon', 'w17c_bacon', 'SIR LOIN', 'burner', 13, 'w17bacon', 'GIFTED BACON', ['Bacon! Gifted hourly since 2009. Ask about our bacon philosophy.']);
  host('cheese', 'w17c_cheese', 'BRIE ANNA', 'tutu', 8, 'w17cheese', 'GRILLED CHEESE', ['Grilled cheese! Gooey enough to fix a broken heart. Medically.']);
  host('pancake', 'w17c_pancake', 'FLAPJACK JACK', 'crusty', 14, 'w17pancake', 'PLAYA PANCAKES', ['Pancakes! The secret ingredient is dust. Not on purpose.']);
  // Barter Bart and his trades
  npc({ id: 'w17c_bart', name: 'BARTER BART', type: 'crusty', seed: 4, x: L.trade.host[0], z: L.trade.host[1], yaw: L.tradeYaw,
    trades: [
      { id: 'pirate', give: 'weed', get: { costume: 'pirate' }, label: 'A baggie for a pirate coat' },
      { id: 'disco', give: 'khole', get: { costume: 'disco' }, label: 'A K-hole for a disco-ball suit' },
      { id: 'mg', give: 'molly', get: { glow: 30 }, label: 'A LOVE BOMB for 30 glow sticks' },
      { id: 'water', give: { glow: 10 }, get: 'water', once: false, label: 'Glow sticks for a water bottle' },
      { id: 'booch', give: { glow: 15 }, get: 'w17booch', once: false, label: 'Glow sticks for Kev\'s kombucha' }
    ],
    talk(g2, a) {
      const st = g2.missions.state('w17c_trade'), open = () => { if (g2.openTrade) g2.openTrade(a); };
      if (st === 'available') g2.say(a, BW17C.Q.w17c_trade.pitch, () => { if (g2.missions.start('w17c_trade')) g2.missions.track('w17c_trade'); open(); });
      else if (st === 'locked') g2.say(a, ['Gifting\'s for burners with a camp, friend. Find yours first.']);
      else g2.say(a, ['Welcome back. Remember: it\'s not trading if we both smile.'], open);
    } });
  /* --- prompts --- */
  const I = it => api.interact(it), act = id => g.actor(id);
  I({ x: L.rink.rental[0], z: L.rink.rental[1], r: 2.4, label: 'LACE UP', when: g2 => g2.missions.state('w17c_skate') === 'active' && !BW17C.state.skates, fn: g2 => { BW17C.skatesOn(g2); g2.missions.get('w17c_skate').data.left = 45; } });
  I({ x: L.content.behind[0], z: L.content.behind[1], y: 0.6, r: 2.2, label: 'SWIPE', when: g2 => g2.missions.state('w17c_phone') === 'active' && act('w17c_brielle') && act('w17c_brielle').def.hasPhone !== false, fn: g2 => {
    const a = act('w17c_brielle'); a.def.hasPhone = false; g2.pack.add('w17phone'); g2.player.hold('phone'); burnsSfx('pick');
    a.say('MY PHONE?! ...wait. Is that... the SKY?', 3); g2.banner('SWIPED!', 'Now lock it in the PHONE JAIL at the Steeping Sloth', { col: '#ff9ad8' });
    g2.missions.get('w17c_phone').def.marker = { x: L.tea.jail[0], z: L.tea.jail[1] };
  } });
  I({ x: L.tea.jail[0], z: L.tea.jail[1], r: 2.0, label: 'LOCK IT UP', when: g2 => g2.missions.state('w17c_phone') === 'active' && g2.pack && g2.pack.has('w17phone'), fn: g2 => {
    g2.pack.take('w17phone'); g2.player.hold(null); burnsSfx('door', null, 'pick'); g2.shake(0.15);
    g2.banner('PHONE JAILED', 'Twenty-five to life. With good behaviour, Monday.', { col: '#7aff5a' }); g2.missions.complete('w17c_phone');
  } });
  I({ x: L.tea.cushion[0], z: L.tea.cushion[1], r: 1.8, label: 'SIT', when: g2 => g2.missions.state('w17c_tea') === 'active' && !BW17C.state.sit, fn: g2 => BW17C.sit(g2) });
  I({ x: L.duck[0], z: L.duck[1], r: 4.2, label: 'FIX IT', when: g2 => g2.missions.state('w17c_duck') === 'active' && g2.missions.get('w17c_duck').n >= 3 && !BW17C.state.crank, fn: g2 => BW17C.crankStart(g2) });
  // Gerald waits on Ice Ice Playa's counter (out of sight until the broadcast goes out)
  api.pickup('pack:w17gerald', L.ice.window[0] + Math.cos(L.iceYaw) * 1.3, 1.45, L.ice.window[1] - Math.sin(L.iceYaw) * 1.3, { mission: 'w17c_radio', gate: true, label: 'GERALD',
    follow(g2, P) { const m = g2.missions.get('w17c_radio'); P.y0 = m && m.data.sighted ? 1.45 : -60; },
    onTake(g2) { g2.player.hold('coffee'); g2.banner('GERALD!', 'Take him home to Kev at the Root Society gate', { col: '#d8b45a' }); const m = g2.missions.get('w17c_radio'); m.data.marker = 'w17c_kev'; m.def.marker = { x: L.kev[0], z: L.kev[1] }; } });
  // map pins: where each job's giver hangs out
  const pin = (id, q) => { const m = g.missions.get(id); if (m) m.def.marker = { x: q[0], z: q[1] }; };
  pin('w17c_sunrise', L.nebula); pin('w17c_tea', L.nebula); pin('w17c_foam', L.kev); pin('w17c_radio', L.kev); pin('w17c_food', L.kev); pin('w17c_skate', L.granny);
  pin('w17c_darkwads', L.pixel); pin('w17c_ice', L.biscuit); pin('w17c_phone', L.glimmer); pin('w17c_hugs', L.hugo); pin('w17c_duck', L.quack); pin('w17c_trade', L.trade.host);
  // Pixel's headlamp stays with Brady once he has it
  if (BW17C.done('w17c_darkwads')) g.player.lightR = Math.max(g.player.lightR || 0, 8);
};

/* ---------------- talk ---------------- */
BW17C.talkKev = function (g, a) {
  const M = g.missions;
  if (M.state('w17c_radio') === 'active' && g.pack && g.pack.has('w17gerald')) { g.say(a, ['GERALD! My boy! You\'re so... slimy and perfect.', 'Thank you, Brady. Here: kombucha. Made by Gerald himself.'], () => { g.pack.take('w17gerald'); g.player.hold(null); M.complete('w17c_radio'); }); return; }
  BW17C.offer(g, a, ['w17c_foam', 'w17c_radio', 'w17c_food'], ['Kombucha! Free! Fizzy! Alive! Mostly alive!', 'Gerald says hi. Gerald is a SCOBY. Gerald is family.']);
};
BW17C.talkNebula = function (g, a) {
  const M = g.missions;
  if (M.state('w17c_food') === 'active' && g.pack && g.pack.has('w17pancake')) { g.say(a, ['Pancakes! With dust! Just like 2001. Thank you, sweetie.'], () => { g.pack.take('w17pancake'); M.progress('w17c_food'); }); return; }
  BW17C.offer(g, a, ['w17c_tea', 'w17c_sunrise'], ['Twenty-fifth Burn, sweetie. I know everything and everyone.', 'Rule one: water. Rule two: tea. Rule three: never trust a man in a fur coat at noon.']);
};
BW17C.talkGranny = function (g, a) {
  const M = g.missions;
  if (M.state('w17c_food') === 'active' && g.pack && g.pack.has('w17bacon')) { g.say(a, ['Bacon! Protein for the wheels. You\'re a good egg, kiddo.'], () => { g.pack.take('w17bacon'); M.progress('w17c_food'); }); return; }
  BW17C.offer(g, a, ['w17c_skate'], ['Seventy-four and still undefeated at roller disco.', 'Couples skate later. You\'re cute, but I\'m spoken for. By the rink.']);
};
BW17C.talkBiscuit = function (g, a) {
  const M = g.missions;
  if (M.state('w17c_ice') === 'active' && g.pack && g.pack.has('w17ice')) { g.say(a, ['ICE! *melting happy noises* You saved me! You SAVED me!', 'Take my spare fur coat. You\'ll need a disguise sooner or later. Trust me.'], () => { g.pack.take('w17ice'); g.player.hold(null); BW17C.meter(null); a.ch.play('hug', null, true); g.fx.hearts(a.x, a.y + 2, a.z, 14); M.complete('w17c_ice'); }); return; }
  if (M.state('w17c_food') === 'active' && g.pack && g.pack.has('w17cheese')) { g.say(a, ['Grilled cheese! *happy chirp* It\'s like a hug you can eat.'], () => { g.pack.take('w17cheese'); M.progress('w17c_food'); }); return; }
  BW17C.offer(g, a, ['w17c_ice'], ['*happy chirp*', 'They said no fursuits in the pool. I said discrimination. They said hygiene.']);
};
BW17C.talkPixel = function (g, a) {
  BW17C.offer(g, a, ['w17c_darkwads'], ['Night shift. Somebody has to keep this city glowing.', 'Six pixels per glow stick. I counted.']);
};
BW17C.talkQuack = function (g, a) {
  const st = g.missions.state('w17c_duck');
  if (st === 'done') { g.say(a, ['She quacks! She grooves! She\'s yours to drive, kid. Bring her back with gas in her.']); return; }
  BW17C.offer(g, a, ['w17c_duck'], ['Thirty years I\'ve driven this duck. Never once did she break down. Until today.']);
};
BW17C.talkWendy = function (g, a) {
  const dm = g.missions.get('w17c_duck');
  if (dm && dm.state === 'active' && !dm.data.belt) { g.say(a, ['A fan belt for the Disco Duck? Captain Quack owes me six belts.', 'Fine. Seven. Tell him I said quack.'], () => { dm.data.belt = true; g.pack.add('w17belt'); BW17C.duckPart(g, dm); }); return; }
  g.say(a, ['Flats, chains, wobbly handlebars, existential dread. I fix all of it.', 'Except the dread. Bring your own tools for the dread.']);
};
BW17C.talkGlimmer = function (g, a) {
  const M = g.missions, dm = M.get('w17c_duck');
  if (dm && dm.state === 'active' && !dm.data.filter) { g.say(a, ['An air filter? For a DUCK? Babe. I have glitter tights. Triple-layer. Dust doesn\'t stand a chance.', 'Trade you for... a hug. Okay, done. Gifted!'], () => { dm.data.filter = true; g.pack.add('w17filter'); BW17C.duckPart(g, dm); g.fx.hearts(a.x, a.y + 2, a.z, 6); }); return; }
  BW17C.offer(g, a, ['w17c_phone'], ['Do you have water? And a snack? And a cup? And sunscreen? No? Same.', 'That influencer is SO fake. I\'m an authentic sparkle pony.']);
};
BW17C.talkDeepDust = function (g, a) {
  const M = g.missions, dm = M.get('w17c_duck'), rm = M.get('w17c_radio');
  if (rm && rm.state === 'active' && !rm.data.aired) { BW17C.onAir(g, a, rm); return; }
  if (dm && dm.state === 'active' && !dm.data.battery) { g.say(a, ['A battery for the Disco Duck? We keep backups for the transmitter. Eleven of them. Don\'t ask why.'], () => { dm.data.battery = true; g.pack.add('w17battery'); BW17C.duckPart(g, dm); }); return; }
  g.say(a, ['DUST FM 94.5! All dust, all day! Next up: forty minutes of wind.']);
};
// the broadcast: Brady reads it out, the playa hears it, a caller rings in
BW17C.onAir = function (g, a, rm) {
  const p = g.player, L = BW17C.L, mic = L.radio.mic;
  g.cutscene([
    { do: g2 => { p.teleport(mic[0] + Math.sin(L.radioYaw) * 1.1, 0, mic[1] + Math.cos(L.radioYaw) * 1.1, L.radioYaw + Math.PI); } },
    { cam: { x: mic[0] + Math.sin(L.radioYaw + 0.9) * 4.2, y: 2.2, z: mic[1] + Math.cos(L.radioYaw + 0.9) * 4.2, tx: mic[0], ty: 1.4, tz: mic[1], fov: 0.85 } },
    { say: [a, ['You\'re live on DUST FM 94.5, the voice of the playa! Go!']] },
    { say: ['brady', ['Ahem. MISSING: a slimy beige disc named Gerald. Answers to nothing.', 'Gerald, if you can hear me, I\'m not mad. Kev is. Come home.', 'REWARD: one hug and a lifetime supply of fizz.']] },
    { do: g2 => { rm.data.aired = true; burnsSfx('crowd_cheer', { vol: 0.5 }); g2.banner('ON AIR', 'The whole playa heard that', { col: '#ff4a4a' }); } },
    { wait: 1.2 },
    { say: [{ name: 'CALLER ON LINE TWO' }, ['Uh, hi. Is Gerald a jar? With a sock on it?', 'He\'s been on the counter at Ice Ice Playa all morning. Looking cool. Literally.']] },
    { do: g2 => { rm.data.sighted = true; g2.banner('GERALD SIGHTED!', 'Ice Ice Playa (2:25), on the counter', { col: '#d8b45a' }); rm.def.marker = { x: L.ice.window[0], z: L.ice.window[1] }; } }
  ]);
};
BW17C.talkIvy = function (g, a) {
  const m = g.missions.get('w17c_ice');
  if (m && m.state === 'active' && !g.pack.has('w17ice')) {
    g.say(a, ['Ice is the one thing you can buy out here. Cash only. No chit-chat.', '...It\'s for an overheating furry? Oh my god. Take it. TAKE IT. RUN.'], () => {
      g.pack.add('w17ice'); g.player.hold('icebag'); m.data.melt = 45; m.data.marker = 'w17c_biscuit'; m.def.marker = { x: BW17C.L.biscuit[0], z: BW17C.L.biscuit[1] };
      g.banner('GOT ICE!', 'Back to Biscuit at the Deep End before it melts!', { col: '#9adcff' });
    }); return;
  }
  g.say(a, ['Ice. Cash. Next.']);
};
BW17C.talkHost = function (g, a, item, food, lines) {
  const fm = g.missions.get('w17c_food');
  if (fm && fm.state === 'active' && !fm.data['got_' + item]) { g.say(a, lines.concat(['For your people? Say no more.']), () => { fm.data['got_' + item] = true; g.pack.add(item, 1, { quiet: true }); g.toast(food + ' → BACKPACK'); }); return; }
  g.say(a, lines);
};

/* ---------------- mechanics ---------------- */
// SUDS UP: stink lines follow Brady until he soaks in the Deep End's foam for six seconds
BW17C.foamStep = function (g, m, dt) {
  const p = g.player, F = BW17C.L && BW17C.L.foam; if (!F) return;
  if (Math.random() < dt * 5) g.fx.add(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.6 + Math.random(), p.z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3, 0.8, (Math.random() - 0.5) * 0.3, 1.1, 0.35, 0.7, [0.55, 0.85, 0.3], 0.45, 'puff', 4);
  if (BW17C.D(g, F[0], F[1]) < F[2]) {
    m.data.soak = (m.data.soak || 0) + dt;
    BW17C.meter({ label: 'GETTING SUDSY', k: m.data.soak / 6, col: '#e8f8ff' });
    if (Math.random() < dt * 3) g.playerBubble(['SO. MUCH. FOAM.', 'I\'m a cloud!', 'Bubbles in my ears!'][Math.floor(Math.random() * 3)], 1.2);
    if (m.data.soak >= 6) { BW17C.meter(null); g.fx.confetti(p.x, p.y + 2, p.z, 30); g.banner('SQUEAKY CLEAN!', 'Brady smells like a lavender dream', { col: '#bff0ff' }); g.missions.complete('w17c_foam'); }
  } else if (BW17C.state.meter && BW17C.state.meter.label === 'GETTING SUDSY') BW17C.meter(null);
};
// THE GLIDE: skates on (fast and floaty), 8 rings in order, 45 s
BW17C.skatesOn = function (g) {
  const S = BW17C.state, p = g.player; if (S.skates) return; S.skates = true;
  const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(p), 'speedMul');
  try { Object.defineProperty(p, 'speedMul', { configurable: true, get() { return (desc && desc.get ? desc.get.call(this) : 1) * 1.45; } }); } catch (e) { /* ignore */ }
  burnsSfx('costume', { vol: 0.6 }); g.toast('SKATES ON! ROLL!');
};
BW17C.skatesOff = function (g) { const S = BW17C.state, p = g.player; if (!S || !S.skates) return; S.skates = false; try { delete p.speedMul; } catch (e) { /* ignore */ } };
BW17C.skateStep = function (g, m, dt) {
  const S = BW17C.state, p = g.player, R = BW17C.L.rink;
  if (!S.skates) return;
  if (m.data.left === undefined) m.data.left = 45;
  m.data.left -= dt; m.left = m.data.left + 0.5;
  if (Math.hypot(p.vx, p.vz) > 4 && Math.random() < dt * 10) g.fx.add(p.x, p.y + 0.08, p.z, 0, 0.2, 0, 0.3, 0.2, 0.05, [1, 0.4, 0.9], 0.9, 'spark', 1);
  const i = m.n, q = R.rings[i];
  if (q && BW17C.D(g, q[0], q[1]) < 2.3) { burnsSfx('pick', { pitch: 1 + i * 0.08 }); g.fx.ring(q[0], 1.2, q[1], 2.2, BURNS_NEON[i % 7], 0.5); g.missions.progress('w17c_skate'); }
  if (m.data.left <= 0 && m.state === 'active') { m.left = undefined; g.missions.fail('w17c_skate', 'The song ended! Lace up again.'); }
};
// ICE: a melt meter from the moment the ice is in the backpack
BW17C.iceStep = function (g, m, dt) {
  if (!m.data.melt) return;
  m.data.melt -= dt; BW17C.meter({ label: `ICE MELTING · ${Math.ceil(Math.max(0, m.data.melt))}s`, k: m.data.melt / 45, col: '#9adcff' });
  if (Math.random() < dt * 4) g.fx.add(g.player.x + (Math.random() - 0.5) * 0.4, g.player.y + 1.0, g.player.z + (Math.random() - 0.5) * 0.4, 0, -1.5, 0, 0.5, 0.1, 0.05, [0.6, 0.85, 1], 0.9, 'drop', 2);
  if (m.data.melt <= 0) { BW17C.meter(null); g.missions.fail('w17c_ice', 'It\'s water now. Very sad water.'); }
};
// DIGITAL DETOX: her vision cone fails the quest
BW17C.phoneStep = function (g, m) {
  const a = g.actor('w17c_brielle'); if (!a || a.def.hasPhone === false || g.cine || m.t < 1.5) return;
  if (BurnsBehaviors.sees(a, g, 8.5, 0.85)) {
    a.say('EW! You\'re in my shot! Now do a dance for the fans!', 2.4); burnsSfx('camera_flash'); g.screenFlash('#ffffff', 0.5);
    g.missions.fail('w17c_phone', 'She saw you! You\'re content now.');
  }
};
// HUG QUOTA: bump into burners (bigger reach on a LOVE BOMB); people in the crowds count too, each one once
BW17C.hugStep = function (g, m, dt) {
  const S = BW17C.state, p = g.player, love = p.power === 'molly' && p.powerT > 0, R = love ? 2.4 : 1.25;
  if (m.n >= 8) { if (m.used) g.missions.complete('w17c_hugs'); return; }
  m.data.cd = (m.data.cd || 0) - dt; if (m.data.cd > 0 || g.cine || g.dialog.open) return;
  const hug = (x, y, z, a) => {
    m.data.cd = 0.35; g.fx.hearts(x, y + 1.8, z, 8); burnsSfx('molly', { vol: 0.4 });
    if (a) { a.ch.play('hug', null, true); a.say(['Aww!', 'Welcome home!', 'Hugs are free!', 'You smell... interesting!', 'Mmmmph!'][Math.floor(Math.random() * 5)], 1.4); }
    else g.playerBubble(['Hug!', 'Mmmph!', 'Gotcha!'][Math.floor(Math.random() * 3)], 0.9);
    g.missions.progress('w17c_hugs');
  };
  for (const a of g.actors) {
    if (a.hidden || a.removed || !a.friendly || a.boss || a.defeated && !a.def.ambient || a.def.talk || a.def.trades || a.data.bw17hug || (a.def.id && !a.def.ambient)) continue;
    if (Math.abs(a.x - p.x) > R || Math.abs(a.z - p.z) > R || Math.hypot(a.x - p.x, a.z - p.z) > R || Math.abs(a.y - p.y) > 1.5) continue;
    a.data.bw17hug = true; hug(a.x, a.y, a.z, a); return;
  }
  const C = g.world && g.world.crowd;
  if (C && C.list) for (const it of C.list) {
    if (S.hugged.has(it) || Math.abs(it.x - p.x) > R || Math.abs(it.z - p.z) > R || Math.hypot(it.x - p.x, it.z - p.z) > R) continue;
    S.hugged.add(it); hug(it.x, it.y || 0, it.z, null); return;
  }
};
// TEA TIME: sit on the cushion, eight seconds without moving the stick or pressing anything
BW17C.sit = function (g) {
  const S = BW17C.state, p = g.player, T = BW17C.L.tea;
  p.teleport(T.cushion[0], 0.3, T.cushion[1], BW17C.L.teaYaw + Math.PI); p.animOverride = 'sit'; p.locked = true; p.vx = p.vz = 0;
  S.sit = { t: 0, still: 0, fails: 0 }; g.modal = 'w17c'; burnsSfx('select');
};
BW17C.unsit = function (g) { const S = BW17C.state, p = g.player; if (!S || !S.sit) return; S.sit = null; p.animOverride = null; p.locked = false; if (g.modal === 'w17c') g.modal = null; BW17C.meter(null); };
BW17C.teaStep = function (g, m, dt) {
  const S = BW17C.state, st = S.sit, p = g.player; if (!st) return;
  st.t += dt;
  const fidget = st.t > 0.4 && (p.inp.mag > 0.35 || S.press);
  if (fidget) { st.still = 0; st.fails++; burnsSfx('bump', { vol: 0.35 }); const a = g.actor('w17c_steepy'); if (a) a.say(['...again.', 'The tea felt that.', 'Breathe. Then breathe less loudly.'][Math.floor(Math.random() * 3)], 1.6); }
  else st.still += dt;
  BW17C.meter({ label: st.fails ? `STAY STILL · ${4 - st.fails} TRIES LEFT` : 'STAY STILL... THE TEA IS STEEPING', k: st.still / 8, col: '#9adc8a' });
  if (st.fails >= 4) { BW17C.unsit(g); const a = g.actor('w17c_steepy'); if (a) a.say('Too fidgety. Come back when your soul has settled.', 2.4); return; }
  if (st.still >= 8) { BW17C.unsit(g); g.say(g.actor('w17c_steepy') || { name: 'STEEPY' }, ['...', 'You have steeped. Drink.'], () => g.missions.complete('w17c_tea')); }
};
// ART CAR CPR: FIX IT, then mash ACTION to crank her over (14 cranks in 6 s)
BW17C.crankStart = function (g) {
  const S = BW17C.state, p = g.player; S.crank = { t: 0, n: 0 }; p.locked = true; p.vx = p.vz = 0; p.animOverride = 'bell'; g.modal = 'w17c';
  g.toast('MASH ACTION TO CRANK HER!');
};
BW17C.crankStep = function (g, m, dt) {
  const S = BW17C.state, st = S.crank, p = g.player; if (!st) return;
  st.t += dt;
  if (st.t > 0.3 && S.pressA) { st.n++; burnsSfx('select', { vol: 0.35, pitch: 0.8 + st.n / 14 * 0.6 }); g.shake(0.05); }
  BW17C.meter({ label: `CRANK THE DUCK! ${st.n}/14`, k: st.n / 14, col: '#ffd21a' });
  const end = () => { S.crank = null; p.locked = false; p.animOverride = null; if (g.modal === 'w17c') g.modal = null; BW17C.meter(null); };
  if (st.n >= 14) {
    end(); BurnsSave.flag(17, 'duckFixed', true); burnsSfx('artcarHorn'); g.shake(0.3);
    const D = S.duckCar; if (D) for (let i = 0; i < 30; i++) g.fx.add(D.x + (Math.random() - 0.5) * 3, 5 + Math.random(), D.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3, 2.2, 0.4, 0.6, [0.85, 0.95, 1], 0.6, 'bubble', 2 | 4);
    g.banner('QUAAACK!', 'The Disco Duck lives! ACTION by her seat to DRIVE', { col: '#ffd21a', big: true });
    g.missions.complete('w17c_duck');
  } else if (st.t > 6.3) { end(); const a = g.actor('w17c_quack'); if (a) a.say('She coughed! Crank harder!', 2); }
};

/* ---------------- SUNRISE AT THE HEART: a five o'clock wake-up, a run across the deep playa ---------------- */
BW17C.skyApply = function (g) { const k = BW17.skyAt(BW17C.state.sky.clock); g.palA = k.a; g.palB = k.b; g.tod = k.t; g.todTarget = null; };
BW17C.skyOff = function (g, fade) {
  const S = BW17C.state; if (!S || !S.sky) return;
  const restore = g2 => { S.sky = null; if (BURNS_OW.state) BURNS_OW.state.palKey = null; try { BurnsOW.applyStoryTime(g2, true); } catch (e) { /* ignore */ } burnsMusic(g2.def.music || 'burns_hub'); };
  if (fade) g.cutscene([{ fade: 'out', dur: 0.6 }, { do: restore }, { wait: 0.2 }, { fade: 'in', dur: 0.8 }], null, { letterbox: false });
  else restore(g);
};
BW17C.sunriseStart = function (g) {
  const S = BW17C.state, p = g.player, home = BURNS_OW.PLACES.find(q => q.kind === 'home');
  const door = home ? [home.x + Math.sin(home.yaw) * 2.6, home.z + Math.cos(home.yaw) * 2.6, home.yaw] : [BW17C.L.kev[0], BW17C.L.kev[1], 0];
  g.cutscene([
    { fade: 'out', dur: 0.7 },
    { do: g2 => { S.sky = { clock: 5.05, rate: 0.016 }; BW17C.skyApply(g2); if (p.vehicle) p.vehicle.dismount(p); p.teleport(door[0], 0, door[1], door[2]); g2.camYaw = door[2]; g2.snapCam = true; if (g2.tiles) g2.tiles.prime(door[0], door[1], 160); burnsMusic('burns_w7'); } },
    { wait: 0.3 },
    { fade: 'in', dur: 0.8 },
    { title: { day: '5:05 AM', name: 'Sunrise at the Heart', sub: 'Ride to the heart car before the sun' }, wait: false }
  ], g2 => { g2.banner('IT\'S 5 AM', 'Get to the heart car on the deep playa before sunrise!', { col: '#ff9ad0', big: true }); if (g2.bike) g2.toast('BIKE BUTTON (OR B) TO RIDE!'); });
};
BW17C.sunriseStep = function (g, m, dt) {
  const S = BW17C.state, sky = S.sky, L = BW17C.L;
  if (!sky || m.data.arrived) return;
  m.def.marker = { x: L.heartFloor[0], z: L.heartFloor[1] };
  m.left = Math.max(0, (5.92 - sky.clock) / sky.rate) + 0.5;
  if (BW17C.D(g, L.heartFloor[0], L.heartFloor[1]) < 13) { m.data.arrived = true; m.left = undefined; BW17C.sunriseScene(g); }
  else if (sky.clock >= 5.92) { m.left = undefined; g.missions.fail('w17c_sunrise', 'The sun beat you there!'); }
};
BW17C.sunriseScene = function (g) {
  const S = BW17C.state, L = BW17C.L, p = g.player, H = L.heartCar, f = L.heartFloor;
  if (p.vehicle) p.vehicle.dismount(p);
  g.cutscene([
    { swell: 'burns_w7' },
    { do: g2 => { S.sky.rate = Math.max(0.04, (6.25 - S.sky.clock) / 9); S.sky.to = 6.25; p.teleport(f[0], 0, f[1] - 2, Math.atan2(H.booth[0] - f[0], H.booth[1] - f[1])); p.animOverride = 'dance'; } },
    { orbit: { x: H.booth[0], y: 3, z: H.booth[1], r0: 26, r1: 18, h0: 3, h1: 7, a0: Math.PI + 0.9, a1: Math.PI + 0.25, ty: 6, dur: 5, fov: 0.95 } },
    { say: [{ name: 'SUNRISE CROWD' }, ['He\'s playing the sunrise set on the heart. Every year I think it can\'t get better.', 'Every year it gets better.']] },
    { do: g2 => { for (let i = 0; i < 4; i++) BW17C.after(g2, i * 0.7, g3 => g3.fx.hearts(H.heart[0] + (Math.random() - 0.5) * 6, 9, H.heart[1] + (Math.random() - 0.5) * 2, 8)); burnsSfx('crowd_cheer'); } },
    { crane: { from: { x: f[0] - 6, y: 1.4, z: f[1] - 9, tx: H.booth[0], ty: 7, tz: H.booth[1], fov: 0.9 }, to: { x: f[0] - 2, y: 2.2, z: f[1] - 6, tx: H.booth[0], ty: 9, tz: H.booth[1] + 30, fov: 1.0 }, dur: 4.5 } },
    { say: ['brady', ['Oh. Oh no. I\'m crying. Is this what burners are?']] },
    { do: g2 => { p.animOverride = null; S.sky.clock = 6.25; S.sky.rate = 0; BW17C.skyApply(g2); g2.missions.complete('w17c_sunrise'); } }
  ], g2 => { BW17C.after(g2, 2.5, g3 => BW17C.skyOff(g3, true)); });
};

/* ---------------- per frame in the city ---------------- */
BW17C.update = function (g, dt) {
  const S = BW17C.state; if (!S || S.g !== g) return;
  // this step's presses (read here: the player clears them before the missions update; the sit and crank games need them)
  { const I = g.player.inp; S.pressA = !!I.actionPressed; S.press = !!(I.actionPressed || I.jumpPressed); }
  // timers
  if (S.timers.length) { for (const tm of S.timers) tm.t -= dt; const due = S.timers.filter(tm => tm.t <= 0); S.timers = S.timers.filter(tm => tm.t > 0); for (const tm of due) { try { tm.fn(g); } catch (e) { BW17.err(e); } } }
  // the five o'clock clock (only while the sunrise run holds the sky)
  if (S.sky) {
    if (S.sky.rate) { S.sky.clock = Math.min(S.sky.to || 99, S.sky.clock + dt * S.sky.rate); BW17C.skyApply(g); }
    if (g.missions.state('w17c_sunrise') !== 'active' && !g.cine && !S.timers.length) BW17C.skyOff(g, false);
  }
  // who's out at night: Pixel and the darkwads (and the headlamp stays on)
  S.nightT = (S.nightT || 0) - dt;
  if (S.nightT <= 0) {
    S.nightT = 0.5; const night = BW17C.isNight(g);
    for (const a of g.actors) { const id = a.def.id; if (!id || id.indexOf('w17c_') !== 0) continue; if (id === 'w17c_pixel' || id.indexOf('w17c_dw') === 0) { const hide = !night && g.missions.state('w17c_darkwads') !== 'active'; if (a.hidden !== hide) a.hidden = hide; } }
  }
  // foam at the Deep End (only when someone's close enough to see it)
  const F = BW17C.L && BW17C.L.foam;
  if (F && Math.hypot(g.cam.x - F[0], g.cam.z - F[1]) < 70) {
    for (const q of S.foam) if (Math.random() < dt * 9) { const sp = 3 + Math.random() * 2, a = q[3] + (Math.random() - 0.5) * 0.5; g.fx.add(q[0] + Math.sin(q[3]) * 0.4, q[1], q[2] + Math.cos(q[3]) * 0.4, Math.sin(a) * sp, 2.5 + Math.random(), Math.cos(a) * sp, 2.2, 0.5, 1.6, [0.96, 0.98, 1], 0.75, 'puff', 2 | 4); }
    if (Math.random() < dt * 6) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * F[2]; g.fx.add(F[0] + Math.sin(a) * r, 0.3, F[1] + Math.cos(a) * r, 0, 0.15, 0, 3, 1.2, 1.8, [0.95, 0.97, 1], 0.6, 'puff', 4); }
  }
  // a mini-game owns the chatter only while it runs
  if (g.modal === 'w17c' && !S.sit && !S.crank) g.modal = null;
};
// the ring course while skating
BW17C.drawSprites = function (g, R) {
  const S = BW17C.state; if (!S || S.g !== g || !S.skates) return;
  const sm = g.missions.get('w17c_skate'), rings = BW17C.L.rink.rings, SP = BURNS_SPRITES.R;
  if (sm && sm.state === 'active') for (let i = sm.n; i < Math.min(sm.n + 3, rings.length); i++) { const q = rings[i], c = burnsRGBf(BURNS_NEON[i % 7]); R.bbs.bb(q[0], 1.3, q[1], 2.8, 2.8, SP.ring, c, i === sm.n ? 0.95 : 0.4, true); }
};
// the HUD: a meter under the tracker, the clock chip on the five o'clock run
BW17C.drawHUD = function (ctx, g, W, H, sf) {
  const S = BW17C.state; if (!S || S.g !== g || g.paused) return;
  sf = sf || BurnsUI.safe();
  if (S.sky) {
    const ds = Math.min(24, W / 26), x = sf.l + 6 + 92, y = sf.t + 8 + ds * 1.4, h = S.sky.clock;
    BurnsUI.pill(ctx, x, y, 112, 24, 'rgba(10,6,24,0.55)', 'rgba(255,207,138,0.8)');
    BurnsUI.text(ctx, h < 5.95 ? '☾' : '☀', x + 13, y + 12.5, 13, h < 5.95 ? '#c8d0ff' : '#ffd27a', { stroke: false });
    BurnsUI.text(ctx, BW17.hourText(h), x + 62, y + 12.5, 11, '#fff2dc', { ui: true, stroke: false });
  }
  if (S.meter) { const M = S.meter, w = Math.min(240, W * 0.55), x = (W - w) / 2, y = (g.topStack || sf.t + 40) + 4;
    BurnsUI.pill(ctx, x, y, w, 22, 'rgba(10,6,24,0.6)', 'rgba(255,255,255,0.3)');
    const k = clamp(M.k, 0, 1); ctx.save(); ctx.fillStyle = M.col || '#9adcff'; burnsRR(ctx, x + 3, y + 3, (w - 6) * k, 16, 8); ctx.fill(); ctx.restore();
    BurnsUI.text(ctx, M.label, W / 2, y + 11.5, 11, '#ffffff', { ui: true }); }
};

/* ---------------- hand it all to the city ---------------- */
if (typeof BurnsOW !== 'undefined' && BurnsOW.addQuests && typeof BURNS_OW !== 'undefined') {
  BurnsOW.addQuests({
    from: 17,
    // our places, by name, for any address in the city ('The Glide', 'DUST FM', ...)
    spots: (() => {
      const o = {};
      for (const [k, v] of [['The Glide', 'rink'], ['Ice Ice Playa', 'ice'], ['DUST FM', 'radio'], ['The Steeping Sloth', 'tea'], ['#ContentHouse', 'content'], ['The Disco Duck', 'duck'], ['Totally Not a Trading Post', 'trade'], ['The Heart (Sunrise Sets)', 'heart']]) o[k] = BURNS_OW.at(BW17C.SPOTS[v][0], BW17C.SPOTS[v][1]);
      return o;
    })(),
    missions: BW17C.MISSIONS,
    build(api, g) { BW17C.build(api, g); },
    update(g, dt) { BW17C.update(g, dt); },
    drawSprites(g, R) { BW17C.drawSprites(g, R); },
    drawHUD(ctx, g, W, H, S) { BW17C.drawHUD(ctx, g, W, H, S); }
  });
}
try { window.BRADY_BURNS_W17C = BW17C; } catch (e) { /* no window */ }
