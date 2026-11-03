/* ============================================================
   BRADY GOES TO BURNING MAN — World 17 side quests (the home world's job board).
   Fifteen short, funny quests round Root Society, each with its own mechanic:
     s_buttid    BUTT ID              timing minigame at the portrait studio → a censored playa ID (token)
     s_sunrise   SUNRISE AT THE HEART sleep till 5 AM, ride out before the sun clears the mountains (token)
     s_burn      THE CATHEDRAL BURNS  Friday night: sit at the perimeter, watch the Stick Cathedral burn (token)
     s_duck      ART CAR CPR          fetch three parts for the broken-down Disco Duck, crank it, drive it (token)
     s_darkwads  DARKWAD OUTREACH     night: light up four invisible darkwads with glow sticks
     s_phone     DIGITAL DETOX        sneak behind the influencer, swipe her phone, lock it in Phone Jail
     s_ice       ICE, ICE, FURRY      a bag of ice to the overheating furry before it melts
     s_foam      SUDS UP              Brady stinks: get foamed at the Deep End
     s_skate     THE GLIDE            Granny's roller-disco ring course
     s_food      MEALS ON WHEELS      bacon, grilled cheese, pancakes from the gifting kiosks to the neighbours
     s_radio     GERALD, COME HOME    a lost-and-found on DUST FM for Kev's SCOBY
     s_hugs      HUG QUOTA            eight hugs (needs a LOVE BOMB from the backpack)
     s_tea       TEA TIME             sit perfectly still while the tea steeps
     s_rootdrive THE ROOT DRIVE       catch the touring coliseum car and deliver the DJ's USB
     s_trade     MUTUAL SIMULTANEOUS GIFTING   make a trade at the Totally Not a Trading Post
   ============================================================ */

/* decor for Brady's tipi: owned + shown flags (17:decor:<id> = true on, 'off' owned but hidden) */
BW17.decorOwned = id => BurnsSave.flag(17, 'decor:' + id) !== undefined;
BW17.decorOn = id => BurnsSave.flag(17, 'decor:' + id) === true;
BW17.giveDecor = function (g, id, quiet) {
  if (!BW17.decorOwned(id)) BurnsSave.flag(17, 'decor:' + id, true);
  BW17.syncDecor(g);
  if (!quiet) g.toast('NEW TIPI DECOR: ' + (BW17.DECOR[id] || id).toUpperCase());
};
BW17.DECOR = { flamingo: 'Lawn flamingo', pirate: 'Pirate flag', disco: 'Disco ball', heartflag: 'Heart flag', fairy: 'Fairy lights', skates: 'Granny\'s spare skates', idframe: 'Framed Butt ID' };
BW17.syncDecor = function (g) { const S = BW17.state; if (!S || !S.decor) return; for (const id in S.decor) S.decor[id].visible = BW17.decorOn(id); };

/* quest givers offer what they have (one quest: describe + start; several: pick from a list) */
BW17.offer = function (g, a, ids, fallback) {
  const av = ids.filter(id => g.missions.state(id) === 'available');
  if (!av.length) { if (fallback) fallback(); return false; }
  const start = id => { const Q = BW17.QUEST[id]; g.say(a, Q.pitch, () => { if (Q.gate && !Q.gate(g, a)) return; g.missions.start(id); if (Q.onAccept) Q.onAccept(g, a); }); };
  if (av.length === 1) { start(av[0]); return true; }
  BW17.choose(g, { who: a.def.name, prompt: 'Got a minute? I\'ve got jobs.', options: av.map(id => g.missions.get(id).def.name).concat(['MAYBE LATER']), def: av.length,
    done: (g2, i) => { if (i < av.length) start(av[i]); else a.say('No rush. The playa\'s not going anywhere.', 2); } });
  return true;
};

/* ---------------- quest definitions (missions with side: true) ---------------- */
// pitch = what the giver says when you accept; gate(g, a) = extra condition at accept time
BW17.QUEST = {
  s_buttid: { pitch: ['Darling! A first-timer without a playa ID? Scandalous.', 'Step on the pink rug, turn around, and give me your best side. Your BEST side.', 'It\'s tasteful. There\'s a peach sticker. Very legal.'] },
  s_sunrise: { pitch: ['Tonight you do the most important thing a first-timer can do.', 'Sleep in your tipi till five. Then ride out to the heart on the deep playa before the sun comes up.', 'Lee Burridge is playing the sunrise set on the heart. You will cry. Bring water.'] },
  s_burn: { pitch: ['The Stick Cathedral burns TONIGHT. Out past Esplanade.', 'Get to the perimeter, sit down with everybody, and don\'t move till it falls.', 'I lit the fuses myself. Well. I helped. Mostly I held a clipboard.'] },
  s_duck: { pitch: ['She\'s dead, kid. The Disco Duck. Broke down mid-quack.', 'I need a fan belt from the bike shop, a battery from that LED kid in your village, and an air filter.', 'For the filter, ask a sparkle pony. Don\'t ask why. You\'ll see.'] },
  s_darkwads: { pitch: ['Darkwads: people who come to the brightest city on Earth and wear zero lights.', 'There are four out there right now, invisible, waiting to clothesline a cyclist.', 'Here: a headlamp and a dozen glow sticks. Light them up. Three sticks each. Brightness is a moral choice.'] },
  s_phone: { pitch: ['Honey. There\'s an influencer at the Content House narrating everybody\'s "authentic moments".', 'Sneak up behind her, swipe that phone, and lock it in the Phone Jail at the tea lounge.', 'Don\'t get in her shot. She\'ll make you do a dance.'] },
  s_ice: { pitch: ['Hiiii. It\'s me, Biscuit. I\'m... very... warm.', 'The fursuit is non-negotiable. The heatstroke is optional.', 'Could you get me a bag of ice from Ice Ice Playa? Quick, before it melts. And before I do.'] },
  s_foam: { pitch: ['Brady. Buddy. Pal. I say this with love.', 'You smell like a porta-potty\'s diary.', 'The Deep End is running a foam party. Go. Get sudsy. Come back a new man.'] },
  s_skate: { pitch: ['You walk? Every day? With your FEET? Oh, honey.', 'Down at The Glide: lace up, then hit every glowing ring before the song ends.', 'Beat it and you can keep my spare skates. They\'ve got history. Don\'t ask.'] },
  s_food: { pitch: ['Gifting run! The kiosks on Esplanade are cooking and our people are starving.', 'Bacon for Sparky, grilled cheese for Pixel, pancakes for Auntie Nebula.', 'Ask nicely. Say thank you. Never say "how much".'] },
  s_radio: { pitch: ['GERALD IS GONE.', 'Gerald. My SCOBY. The kombucha mother. Seven years we\'ve been together.', 'Go to DUST FM and put out an announcement. Somebody out there has seen my baby.'] },
  s_hugs: { pitch: ['Hey! Free hugs! I mean, I give them. I\'m also behind on my quota.', 'Eight hugs by sundown or they take my sign away.', 'Pro tip: use a LOVE BOMB from your backpack and EVERYBODY wants a hug. Then just bump into people.'] },
  s_tea: { pitch: ['Tea ceremony at the Steeping Sloth, sweetie.', 'Sit on the cushion. Be still. Do NOT touch anything. The tea knows.', 'If you can do that, you can do anything out here.'] },
  s_rootdrive: { pitch: ['Code red. DJ Rhizome left her USB stick in the common dome, and the coliseum car already rolled out.', 'Grab the Root Drive, catch the car on its lap, hop aboard and hand it over.', 'No USB, no set. No set, no vibes. No vibes, I get yelled at.'] },
  s_trade: { pitch: ['We don\'t barter here. We practise mutual simultaneous gifting.', 'You hand me something. I hand you something. At the same time. Totally different.', 'Ground scores, glow sticks, whatever\'s in your backpack. Let\'s gift.'] }
};

BW17.SIDE = [
  { id: 's_buttid', side: true, token: true, name: 'Butt ID', short: 'Pose for your playa ID (POSE on the rug)', type: 'custom', giver: 'snaps', start: 'manual', requires: ['arrive'],
    desc: 'A first-timer needs a playa ID. The portrait studio does them while you wait. From behind.', hint: 'Dust & Glamour Portrait Studio, Esplanade west', reward: [{ glow: 15 }, { text: 'A framed copy for your tipi' }],
    onComplete(g) { BW17.giveDecor(g, 'idframe'); } },
  { id: 's_sunrise', side: true, token: true, name: 'Sunrise at the Heart', short: 'Sleep till 5 AM, then ride to the heart car', type: 'custom', giver: 'nebula', start: 'manual', requires: ['neighbors'],
    desc: 'Sleep in your tipi till five, then reach the heart-topped sound car on the deep playa before the sun comes up.', hint: 'Night: sleep in your tipi. The heart car is far out on the open playa.', reward: [{ glow: 25 }, { text: 'A heart flag for your tipi' }],
    onStart(g) { g.toast('SLEEP IN YOUR TIPI: WAKE AT 5 AM'); }, onUpdate(g, m, dt) { BW17.sunriseStep(g, m, dt); }, onComplete(g) { BW17.giveDecor(g, 'heartflag'); }, onFail(g) { const S = BW17.state; S.sunrise = null; S.musicLock = false; S.clockTo = null; BW17.applyMusic(g, true); } },
  { id: 's_burn', side: true, token: true, name: 'The Cathedral Burns', short: 'Sit at the burn perimeter', type: 'custom', giver: 'sparky', start: 'manual', requires: ['neighbors'],
    desc: 'Friday night the Stick Cathedral burns. Sit at the perimeter with everybody and watch.', hint: 'Friday night. The Stick Cathedral, out past Esplanade (east).', lockedDesc: 'Meet the neighbours first.', reward: [{ glow: 30 }] },
  { id: 's_duck', side: true, token: true, name: 'Art Car CPR', short: 'Fan belt, battery, air filter for the Disco Duck', type: 'custom', giver: 'quack', start: 'manual', requires: ['arrive'], count: 3, progressLabel: 'Duck parts',
    desc: 'The Disco Duck broke down in the middle of the street. Fetch three parts, then crank her up.', hint: 'The duck is on the 6:00 street east of Root Society', reward: [{ glow: 25 }, { text: 'The Disco Duck is yours to drive' }],
    onStart(g) { BW17.clearItems(g, ['w17belt', 'w17battery', 'w17filter']); }, onComplete(g) { BW17.clearItems(g, ['w17belt', 'w17battery', 'w17filter']); } },
  { id: 's_darkwads', side: true, name: 'Darkwad Outreach', short: 'Light up 4 darkwads (3 glow sticks each)', type: 'custom', giver: 'pixel', start: 'manual', requires: ['cable'], count: 4, progressLabel: 'Darkwads lit',
    desc: 'Four darkwads lurk unlit on the dark streets. Light them up: ACTION with three glow sticks each.', hint: 'Night only. Dark streets behind Root Society and out west.', reward: [{ glow: 30 }, { text: 'Fairy lights for your tipi' }],
    onStart(g) { g.player.lightR = 8; g.glow += 12; g.toast('PIXEL GIFTED A HEADLAMP + 12 GLOW STICKS'); }, onComplete(g) { BW17.giveDecor(g, 'fairy'); } },
  { id: 's_phone', side: true, name: 'Digital Detox', short: 'Swipe the influencer\'s phone, lock it in Phone Jail', type: 'custom', giver: 'granny', start: 'manual', requires: ['neighbors'],
    desc: 'Sneak up behind the influencer at the #ContentHouse, swipe her phone without getting in her shot, and lock it in the Phone Jail.', hint: '#ContentHouse, west of the tea lounge. Phone Jail at the Steeping Sloth.', reward: [{ glow: 25 }, 'molly'],
    onUpdate(g, m) { BW17.phoneStep(g, m); }, onFail(g, m) { const a = g.actor('brielle'); if (a) a.def.hasPhone = true; if (g.pack && g.pack.has('w17phone')) g.pack.take('w17phone'); } },
  { id: 's_ice', side: true, name: 'Ice, Ice, Furry', short: 'Get ice, run it to Biscuit before it melts', type: 'custom', giver: 'biscuit', start: 'manual', requires: ['neighbors'],
    desc: 'Biscuit the fursuiter is overheating. Get a bag of ice from Ice Ice Playa and get it back before it melts.', hint: 'Ice Ice Playa, east side. A bike helps.', reward: [{ costume: 'furcoat' }, { heal: 6 }],
    onUpdate(g, m, dt) { BW17.iceStep(g, m, dt); }, onFail(g) { BW17.state.meter = null; if (g.pack && g.pack.has('w17ice')) g.pack.take('w17ice'); g.player.hold(null); } },
  { id: 's_foam', side: true, name: 'Suds Up', short: 'Stand in the foam at the Deep End', type: 'custom', giver: 'kev', start: 'manual', requires: ['kitchen'],
    desc: 'Kev says you smell like a porta-potty\'s diary. The Deep End is throwing a foam party. Go stand in the foam.', hint: 'The Deep End, Esplanade east', reward: [{ glow: 15 }, 'water', { text: 'Smelling like lavender' }],
    onUpdate(g, m, dt) { BW17.foamStep(g, m, dt); }, onComplete(g) { BW17.state.stink = 0; }, onFail(g) { BW17.state.stink = 0; } },
  { id: 's_skate', side: true, name: 'The Glide', short: 'Lace up, then hit all 8 rings', type: 'custom', giver: 'granny', start: 'manual', requires: ['neighbors'], count: 8, progressLabel: 'Rings',
    desc: 'Granny Grip\'s roller-disco challenge: lace up at The Glide, then skate through every glowing ring before the song ends.', hint: 'The Glide roller disco, east side', reward: [{ glow: 25 }, { text: 'Granny\'s spare skates for your tipi' }],
    onUpdate(g, m, dt) { BW17.skateStep(g, m, dt); }, onComplete(g) { BW17.skatesOff(g); BW17.giveDecor(g, 'skates'); }, onFail(g) { BW17.skatesOff(g); } },
  { id: 's_food', side: true, name: 'Meals on Wheels', short: 'Bacon → Sparky, cheese → Pixel, pancakes → Nebula', type: 'custom', giver: 'kev', start: 'manual', requires: ['kitchen', 'neighbors'], count: 3, progressLabel: 'Meals delivered',
    desc: 'The gifting kiosks on Esplanade are cooking. Pick up bacon, grilled cheese and pancakes, then deliver them to the village.', hint: 'Kiosks on Esplanade (west and east), then the tipi village', reward: [{ glow: 20 }, 'water'],
    onStart(g) { BW17.clearItems(g, ['w17bacon', 'w17cheese', 'w17pancake']); } },
  { id: 's_radio', side: true, name: 'Gerald, Come Home', short: 'Make an announcement on DUST FM, find Gerald', type: 'custom', giver: 'kev', start: 'manual', requires: ['kitchen'],
    desc: 'Kev\'s SCOBY, Gerald, is missing. Put a lost-and-found announcement out on DUST FM 94.5, then go get him.', hint: 'DUST FM 94.5, west side (the tall antenna)', reward: [{ glow: 20 }, { pack: { w17booch: 2 } }],
    onStart(g) { BW17.clearItems(g, ['w17gerald']); } },
  { id: 's_hugs', side: true, name: 'Hug Quota', short: 'Hug 8 burners (use a LOVE BOMB)', type: 'custom', giver: 'hugo', start: 'manual', requires: ['arrive'], count: 8, progressLabel: 'Hugs', use: 'molly', useHint: 'USE A LOVE BOMB!',
    desc: 'Hugo is behind on his free-hug quota. Use a LOVE BOMB from your backpack, then bump into eight burners.', hint: 'Hugo is by the Root Society gate on Esplanade', reward: [{ glow: 25 }, { heal: 6 }],
    onStart(g) { if (g.pack && !g.pack.has('molly')) { g.pack.add('molly'); g.toast('HUGO GIFTED YOU A LOVE BOMB → BACKPACK'); } },
    onUpdate(g, m, dt) { BW17.hugStep(g, m, dt); } },
  { id: 's_tea', side: true, name: 'Tea Time', short: 'SIT on the cushion and stay perfectly still', type: 'custom', giver: 'nebula', start: 'manual', requires: ['neighbors'],
    desc: 'The tea ceremony at the Steeping Sloth: sit on the cushion and don\'t touch anything while it steeps.', hint: 'The Steeping Sloth tea lounge, west side', reward: [{ heal: 6 }, 'w17tea', { glow: 10 }] },
  { id: 's_rootdrive', side: true, name: 'The Root Drive', short: 'Grab the USB, catch and board the coliseum car', type: 'custom', giver: 'moss', start: 'manual', requires: ['arrive'],
    desc: 'DJ Rhizome left her USB stick in the common dome and the coliseum car is touring. Grab it, catch the car, hop aboard.', hint: 'The USB is in the common dome; the car laps the whole camp', reward: [{ glow: 30 }, 'powder', { text: 'A lap on the coliseum' }],
    onUpdate(g, m) { BW17.rootDriveStep(g, m); } },
  { id: 's_trade', side: true, name: 'Mutual Simultaneous Gifting', short: 'Make a trade with Bart', type: 'custom', giver: 'bart', start: 'manual', requires: ['arrive'],
    desc: 'Bart at the Totally Not a Trading Post doesn\'t barter. He "gifts simultaneously". Make one trade.', hint: 'Totally Not a Trading Post, the 6:30 street west of Root Society', reward: [{ glow: 15 }, { text: 'A deep sense of moral ambiguity' }],
    onEvent(g, m, name) { if (name === 'trade') { BW17.after(g, 0.4, g2 => g2.missions.complete('s_trade')); } } }
];

/* ---------------- per-quest mechanics ---------------- */
const BW17_D = (g, x, z) => Math.hypot(g.player.x - x, g.player.z - z);

// Art Car CPR parts count up without completing the quest (the crank does that)
BW17.duckPart = function (g, m) { m.n = Math.min(3, m.n + 1); g.toast(`DUCK PARTS: ${m.n}/3`); if (m.n >= 3) { g.banner('ALL THREE PARTS!', 'Back to the Disco Duck: FIX IT', { col: '#ffd21a' }); m.data.marker = 'quack'; } };
BW17.clearItems = function (g, ids) { if (!g.pack) return; for (const id of ids) { const n = g.pack.count(id); if (n) g.pack.take(id, n); } };
// HUG QUOTA: bump into burners (bigger reach on a LOVE BOMB); each one counts once
BW17.hugStep = function (g, m, dt) {
  const p = g.player, love = p.power === 'molly' && p.powerT > 0, R = love ? 2.4 : 1.25;
  if (m.n >= 8) { if (m.used) g.missions.complete('s_hugs'); return; }
  m.data.cd = (m.data.cd || 0) - dt; if (m.data.cd > 0 || g.cine || g.dialog.open) return;
  for (const a of g.actors) {
    if (a.hidden || a.removed || !a.friendly || a.boss || a.defeated && !a.def.ambient || a.def.talk || a.def.trades || a.data.bw17hug || (a.def.id && !a.def.ambient)) continue;
    if (Math.abs(a.x - p.x) > R || Math.abs(a.z - p.z) > R || Math.hypot(a.x - p.x, a.z - p.z) > R || Math.abs(a.y - p.y) > 1.5) continue;
    a.data.bw17hug = true; m.data.cd = 0.35;
    a.ch.play('hug', null, true); a.say(['Aww!', 'Welcome home!', 'Hugs are free!', 'You smell... interesting!', 'Mmmmph!'][Math.floor(Math.random() * 5)], 1.4);
    g.fx.hearts(a.x, a.y + 1.8, a.z, 8); burnsSfx('molly', { vol: 0.4 });
    g.missions.progress('s_hugs');
    break;
  }
};
// SUNRISE AT THE HEART: after sleeping till 5 the clock runs; reach the heart crowd before 5:55
BW17.sunriseStep = function (g, m, dt) {
  const S = BW17.state, L = BW17.L, SR = S.sunrise;
  if (!SR) return;
  if (!SR.arrived) {
    m.left = Math.max(0, (5.92 - S.clock) / S.clockRate);
    const f = L.heartFloor;
    if (BW17_D(g, f[0], f[1]) < 13) { SR.arrived = true; m.left = undefined; BW17.sunriseScene(g); }
    else if (S.clock >= 5.92) { m.left = undefined; g.missions.fail('s_sunrise', 'The sun beat you there!'); }
  }
};
BW17.sunriseScene = function (g) {
  const S = BW17.state, L = BW17.L, p = g.player, H = L.heartCar, f = L.heartFloor;
  if (p.vehicle) p.vehicle.dismount(p);
  S.musicLock = true;
  g.cutscene([
    { swell: 'burns_w7' },
    { do: g2 => { S.clockTo = 5.98; S.clockRate = 0.004; p.teleport(f[0], 0, f[1] - 2, Math.atan2(H.booth[0] - f[0], H.booth[1] - f[1])); p.animOverride = 'dance'; } },
    { orbit: { x: H.booth[0], y: 3, z: H.booth[1], r0: 26, r1: 18, h0: 3, h1: 7, a0: Math.PI + 0.9, a1: Math.PI + 0.25, ty: 6, dur: 5, fov: 0.95 } },
    { say: [{ name: 'SUNRISE CROWD' }, ['He\'s playing the sunrise set on the heart. Every year I think it can\'t get better.', 'Every year it gets better.']] },
    { do: g2 => { for (let i = 0; i < 4; i++) BW17.after(g2, i * 0.7, g3 => g3.fx.hearts(H.top[0] + (Math.random() - 0.5) * 6, 9, H.top[1] + (Math.random() - 0.5) * 2, 8)); burnsSfx('crowd_cheer'); } },
    { crane: { from: { x: f[0] - 6, y: 1.4, z: f[1] - 9, tx: H.booth[0], ty: 7, tz: H.booth[1], fov: 0.9 }, to: { x: f[0] - 2, y: 2.2, z: f[1] - 6, tx: H.booth[0], ty: 9, tz: H.booth[1] + 30, fov: 1.0 }, dur: 4.5 } },
    { say: ['brady', ['Oh. Oh no. I\'m crying. Is this what burners are?']] },
    { do: g2 => { p.animOverride = null; S.clockTo = null; S.clock = 6.0; BW17.applySky(g2); BW17.applyLights(g2, true); S.musicLock = false; S.sunrise = null; BurnsSave.flag(17, 'clock', 6); g2.missions.complete('s_sunrise', { x: p.x, y: p.y + 1.3, z: p.z + 2 }); } }
  ]);
};

// DIGITAL DETOX: her vision cone fails the quest; SWIPE from behind; LOCK IT UP at the Phone Jail
BW17.phoneStep = function (g, m) {
  const a = g.actor('brielle'); if (!a || a.def.hasPhone === false || g.cine) return;
  if (BurnsBehaviors.sees(a, g, 8.5, 0.85)) {
    a.say('EW! You\'re in my shot! Now do a dance for the fans!', 2.4); burnsSfx('camera_flash'); g.screenFlash('#ffffff', 0.5);
    g.missions.fail('s_phone', 'She saw you! You\'re content now.');
  }
};

// ICE: a melt meter from the moment the ice is in the backpack
BW17.iceStep = function (g, m, dt) {
  const S = BW17.state; if (!m.data.melt) { S.meter = null; return; }
  m.data.melt -= dt; S.meter = { label: `ICE MELTING · ${Math.ceil(m.data.melt)}s`, k: m.data.melt / 50, col: '#9adcff' };
  if (Math.random() < dt * 4) g.fx.add(g.player.x + (Math.random() - 0.5) * 0.4, g.player.y + 1.0, g.player.z + (Math.random() - 0.5) * 0.4, 0, -1.5, 0, 0.5, 0.1, 0.05, [0.6, 0.85, 1], 0.9, 'drop', 2);
  if (m.data.melt <= 0) { S.meter = null; g.missions.fail('s_ice', 'It\'s water now. Very sad water.'); }
};

// SUDS UP: stink lines follow Brady until he soaks in the foam at the Deep End
BW17.foamStep = function (g, m, dt) {
  const S = BW17.state, p = g.player, F = BW17.L.foam;
  S.stink = 1;
  if (Math.random() < dt * 5) g.fx.add(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.6 + Math.random(), p.z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3, 0.8, (Math.random() - 0.5) * 0.3, 1.1, 0.35, 0.7, [0.55, 0.85, 0.3], 0.45, 'puff', 4);
  if (F && BW17_D(g, F[0], F[1]) < F[2]) {
    m.data.soak = (m.data.soak || 0) + dt;
    S.meter = { label: 'GETTING SUDSY', k: m.data.soak / 6, col: '#e8f8ff' };
    if (Math.random() < dt * 3) g.playerBubble(['SO. MUCH. FOAM.', 'I\'m a cloud!', 'Bubbles in my ears!'][Math.floor(Math.random() * 3)], 1.2);
    if (m.data.soak >= 6) { S.meter = null; g.fx.confetti(p.x, p.y + 2, p.z, 30); g.banner('SQUEAKY CLEAN!', 'Brady smells like a lavender dream', { col: '#bff0ff' }); g.missions.complete('s_foam'); }
  } else if (S.meter && S.meter.label === 'GETTING SUDSY') S.meter = null;
};

// THE GLIDE: skates on (fast and floaty), 8 rings in order, 45 s
BW17.skatesOn = function (g) {
  const S = BW17.state, p = g.player; if (S.skates) return; S.skates = true;
  const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(p), 'speedMul');
  try { Object.defineProperty(p, 'speedMul', { configurable: true, get() { return (desc && desc.get ? desc.get.call(this) : 1) * 1.45; } }); } catch (e) { /* ignore */ }
  burnsSfx('costume', { vol: 0.6 }); g.toast('SKATES ON! ROLL!');
};
BW17.skatesOff = function (g) { const S = BW17.state, p = g.player; if (!S || !S.skates) return; S.skates = false; try { delete p.speedMul; } catch (e) { /* ignore */ } };
BW17.skateStep = function (g, m, dt) {
  const S = BW17.state, L = BW17.L, p = g.player;
  if (!S.skates) return;
  if (m.data.left === undefined) m.data.left = 45;
  m.data.left -= dt; m.left = m.data.left;
  if (Math.hypot(p.vx, p.vz) > 4 && Math.random() < dt * 10) g.fx.add(p.x, p.y + 0.08, p.z, 0, 0.2, 0, 0.3, 0.2, 0.05, [1, 0.4, 0.9], 0.9, 'spark', 1);
  const i = m.n, R = L.rink.rings[i];
  if (R && BW17_D(g, R[0], R[1]) < 2.3) { burnsSfx('pick', { pitch: 1 + i * 0.08 }); g.fx.ring(R[0], 1.2, R[1], 2.2, BURNS_NEON[i % 7], 0.5); g.missions.progress('s_skate'); }
  if (m.data.left <= 0 && m.state === 'active') { m.left = undefined; g.missions.fail('s_skate', 'The song ended! Lace up again.'); }
};

// THE ROOT DRIVE: once Brady has the USB, board the car while it's out on its lap
BW17.rootDriveStep = function (g, m) {
  const S = BW17.state, rs = S.rs;
  if (!rs || !rs.artCar || !g.pack || !g.pack.has('w17usb')) return;
  const V = rs.artCar;
  if (!m.data.sent && V.docked) { m.data.sent = true; try { BurnsCamps.undock(g, rs); } catch (e) { /* ignore */ } g.toast('THE CAR\'S ROLLING! CATCH IT!'); }
  if (V.boarded && !m.data.done) {
    m.data.done = true; g.pack.take('w17usb'); g.player.hold(null);
    const dj = rs.actors.map(d => g.actors.find(a => a.def === d)).find(a => a && a.def.name === 'DJ RHIZOME');
    if (dj) dj.say('MY ROOT DRIVE! You absolute legend!', 2.6);
    g.fx.confetti(g.player.x, g.player.y + 2, g.player.z, 40); burnsSfx('crowd_cheer');
    g.banner('SET SAVED!', 'Ride the lap, or hop off any time', { col: '#7aff5a' });
    g.missions.complete('s_rootdrive');
  }
};

/* ---------------- placing the side-quest people, props and prompts ---------------- */
BW17.buildSide = function (api, g) {
  const L = BW17.L, S = BW17.state;
  const I = it => api.interact(it);
  const act = id => g.actor(id);
  /* --- BUTT ID: Snaps at the portrait studio --- */
  api.npc({ id: 'snaps', name: 'SNAPS', type: 'burney', seed: 3, x: L.studio.camera[0], z: L.studio.camera[1], yaw: L.studioYaw + Math.PI,
    talk(g2, a) {
      const st = g2.missions.state('s_buttid');
      if (st === 'active') g2.say(a, ['On the pink rug, sweetheart. Then POSE.']);
      else if (st === 'done') g2.say(a, ['My finest work. They\'ll hang it in a museum. A small one. Behind a curtain.']);
      else BW17.offer(g2, a, ['s_buttid'], () => g2.say(a, ['Portraits! Glamour! Tasteful posterior documentation!']));
    } });
  I({ x: L.studio.stool[0], z: L.studio.stool[1], r: 1.9, label: 'POSE', when: g2 => g2.missions.state('s_buttid') === 'active', fn: g2 => {
    const p = g2.player; p.teleport(L.studio.stool[0], 0, L.studio.stool[1], L.studioYaw + Math.PI); p.animOverride = 'victory';
    BW17.minigame(g2, { kind: 'timing', title: 'BUTT ID', labels: ['TURN AROUND...', 'A LITTLE LOWER...', 'NOW: CHEEKY!'], rounds: 3, need: 2, zone: [0.4, 0.6], speed: 1.15,
      onPress(g3, st, hit) { if (hit) { g3.screenFlash('#ffffff', 0.35); burnsSfx('camera_flash', { vol: 0.6 }); } },
      done(g3, ok) {
        p.animOverride = null; const a = act('snaps');
        if (!ok) { if (a) a.say('Blurry! Again! Find your light!', 2.2); return; }
        g3.say(a, ['Gorgeous. Censored. Laminated.', 'Here\'s your playa ID. Show it with pride. Or at the post office.'], () => {
          if (g3.pack) g3.pack.add('w17buttid', 1, { quiet: true }); BW17.showCard(g3, 4.2); g3.missions.complete('s_buttid');
        });
      } });
  } });
  /* --- SUNRISE: the heart crowd (night and dawn only) --- */
  const hf = L.heartFloor;
  const sunriseLines = ['Lee Burridge is playing the sunrise set on the heart!', 'Sunrise on the heart. Every year. Best hour of the week.', 'Shhh. The sun\'s about to come up.', 'I came out here at four just to stand right here.'];
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = 3 + (i % 3) * 2.2; api.npc({ type: ['burner', 'tutu', 'furcoat', 'ledsuit', 'sparklepony'][i % 5], seed: i % 24, x: hf[0] + Math.sin(a) * r, z: hf[1] + Math.cos(a) * r, yaw: Math.atan2(L.heartCar.booth[0] - hf[0], L.heartCar.booth[1] - hf[1]), behavior: 'dance', style: i % 6, chat: sunriseLines, ambient: true, bw17when: g2 => { const h = BW17.state.clock; return h >= 20.4 || h < 7.6; } }); }
  /* --- THE CATHEDRAL BURNS: the perimeter and the SIT spot --- */
  const pc = L.perimeter;
  I({ x: pc[0], z: pc[1], r: 2.4, label: 'SIT', when: g2 => g2.missions.state('s_burn') === 'active', fn: g2 => BW17.burnScene(g2) });
  for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.16, r = 31; api.npc({ type: ['burner', 'crusty', 'tutu', 'furcoat', 'greeter', 'ledsuit'][i % 6], seed: (i * 5) % 24, x: L.cathedral[0] + Math.sin(Math.PI + a) * r, z: L.cathedral[1] + Math.cos(Math.PI + a) * r, yaw: a, behavior: 'sit', chat: ['Tonight she burns.', 'I helped weave the west gallery.', 'Every burn is a little goodbye.'], ambient: true, bw17when: g2 => BW17.isNight() && BW17.storyAt(8) }); }
  /* --- ART CAR CPR: Captain Quack, the Disco Duck, the parts --- */
  api.npc({ id: 'quack', name: 'CAPTAIN QUACK', type: 'crusty', seed: 21, variant: 'kilt', x: L.duck[0] - 3.2, z: L.duck[1] + 1, yaw: Math.PI / 2,
    talk(g2, a) {
      const st = g2.missions.state('s_duck');
      if (st === 'active') { const m = g2.missions.get('s_duck'); g2.say(a, [m.n >= 3 ? 'That\'s everything! Hit FIX IT on the duck and crank her!' : `Parts so far: ${m.n} of 3. Belt from the bike shop, battery from your LED buddy, filter from a sparkle pony.`]); }
      else if (st === 'done') g2.say(a, ['She quacks! She grooves! She\'s yours to drive, kid. Bring her back with gas in her.']);
      else BW17.offer(g2, a, ['s_duck'], () => g2.say(a, ['Thirty years I\'ve driven this duck. Never once did she break down. Until today.']));
    } });
  I({ x: L.duck[0], z: L.duck[1], r: 4.2, label: 'FIX IT', when: g2 => g2.missions.state('s_duck') === 'active' && g2.missions.get('s_duck').n >= 3, fn: g2 => {
    BW17.minigame(g2, { kind: 'mash', title: 'CRANK THE DUCK!', sub: 'Turn her over! Faster!', need: 14, time: 5, col: '#ffd21a',
      done(g3, ok) {
        if (!ok) { const a = act('quack'); if (a) a.say('She coughed! Crank harder!', 2); return; }
        BurnsSave.flag(17, 'duckFixed', true); burnsSfx('artcarHorn'); g3.shake(0.3);
        const D = BW17.state.duckCar; if (D) for (let i = 0; i < 30; i++) g3.fx.add(D.x + (Math.random() - 0.5) * 3, 5 + Math.random(), D.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3, 2.2, 0.4, 0.6, [0.85, 0.95, 1], 0.6, 'bubble', 2 | 4);
        g3.banner('QUAAACK!', 'The Disco Duck lives! ACTION by her seat to DRIVE', { col: '#ffd21a', big: true });
        g3.missions.complete('s_duck', { x: g3.player.x, y: g3.player.y + 1.3, z: g3.player.z + 2 });
      } });
  } });
  api.npc({ id: 'wendy', name: 'WRENCH WENDY', type: 'burner', seed: 9, x: L.bike.bench[0], z: L.bike.bench[1], yaw: L.bikeYaw, anim: 'clipboard',
    talk(g2, a) {
      const dm = g2.missions.get('s_duck');
      if (dm.state === 'active' && !dm.data.belt) { g2.say(a, ['A fan belt for the Disco Duck? Captain Quack owes me six belts.', 'Fine. Seven. Tell him I said quack.'], () => { dm.data.belt = true; g2.pack.add('w17belt'); BW17.duckPart(g2, dm); }); return; }
      g2.say(a, ['Flats, chains, wobbly handlebars, existential dread. I fix all of it.', 'Except the dread. Bring your own tools for the dread.']);
    } });
  api.npc({ id: 'glimmer', name: 'GLIMMER', type: 'sparklepony', seed: 7, x: L.content.front[0] + 3, z: L.content.front[1] + 1, yaw: L.contentYaw, behavior: 'idle',
    talk(g2, a) {
      const dm = g2.missions.get('s_duck');
      if (dm.state === 'active' && !dm.data.filter) { g2.say(a, ['An air filter? For a DUCK? Babe. I have glitter tights. Triple-layer. Dust doesn\'t stand a chance.', 'Trade you for... a hug. Okay, done. Gifted!'], () => { dm.data.filter = true; g2.pack.add('w17filter'); BW17.duckPart(g2, dm); g2.fx.hearts(a.x, a.y + 2, a.z, 6); }); return; }
      g2.say(a, ['Do you have water? And a snack? And a cup? And sunscreen? No? Same.', 'That influencer is SO fake. I\'m an authentic sparkle pony.']);
    } });
  /* --- DARKWADS: four unlit people on the dark streets (night only) --- */
  L.darkwads.forEach((q, i) => api.npc({ id: 'dw' + i, type: 'darkwad', seed: 40 + i, x: q[0], z: q[1], yaw: q[2] || 0, behavior: 'darkwad', radius: 3, cost: 3, chatter: false, bw17when: 'night',
    onLit(g2) { if (g2.missions.state('s_darkwads') === 'active') g2.missions.progress('s_darkwads'); } }));
  /* --- DIGITAL DETOX: the influencer + Phone Jail --- */
  api.npc({ id: 'brielle', name: 'BRIELLE (@DUSTYDREAMZ)', type: 'influencer', seed: 3, x: L.content.stage[0], z: L.content.stage[1], y: 0.6, fixedY: true, yaw: L.contentYaw, aimYaw: L.contentYaw, behavior: 'w17Streamer', chatter: false,
    talk(g2, a) {
      if (a.def.hasPhone === false) g2.say(a, ['I looked up. There\'s a... whole sky? Was that always there?', 'Leave me alone, I\'m having an authentic moment. A real one.']);
      else g2.say(a, ['Hey besties! Oh. You\'re not a bestie. Move, you\'re in the light.']);
    } });
  I({ x: L.content.behind[0], z: L.content.behind[1], y: 0.6, r: 2.2, label: 'SWIPE', when: g2 => g2.missions.state('s_phone') === 'active' && act('brielle') && act('brielle').def.hasPhone !== false, fn: g2 => {
    const a = act('brielle'); a.def.hasPhone = false; g2.pack.add('w17phone'); g2.player.hold('phone'); burnsSfx('pick');
    a.say('MY PHONE?! ...wait. Is that... the SKY?', 3); g2.banner('SWIPED!', 'Now lock it in the PHONE JAIL at the tea lounge', { col: '#ff9ad8' });
  } });
  I({ x: L.tea.jail[0], z: L.tea.jail[1], r: 2.0, label: 'LOCK IT UP', when: g2 => g2.missions.state('s_phone') === 'active' && g2.pack && g2.pack.has('w17phone'), fn: g2 => {
    g2.pack.take('w17phone'); g2.player.hold(null); burnsSfx('door', null, 'pick'); g2.shake(0.15);
    g2.banner('PHONE JAILED', 'Twenty-five to life. With good behaviour, Monday.', { col: '#7aff5a' }); g2.missions.complete('s_phone');
  } });
  /* --- ICE: Frosty at Ice Ice Playa + a little line of people --- */
  api.npc({ id: 'frosty', name: 'FROSTY', type: 'burner', seed: 17, x: L.ice.window[0], z: L.ice.window[1] - 0.3, yaw: L.iceYaw,
    talk(g2, a) {
      if (g2.missions.state('s_ice') === 'active' && !g2.pack.has('w17ice')) {
        g2.say(a, ['Ice is the one thing you can buy out here. Cash only. No chit-chat.', '...It\'s for an overheating furry? Oh my god. Take it. TAKE IT. RUN.'], () => {
          g2.pack.add('w17ice'); g2.player.hold('icebag'); const m = g2.missions.get('s_ice'); m.data.melt = 50; m.data.marker = 'biscuit'; g2.banner('GOT ICE!', 'Back to Biscuit before it melts!', { col: '#9adcff' });
        }); return;
      }
      g2.say(a, ['Ice. Cash. Next.']);
    } });
  for (let i = 0; i < 3; i++) api.npc({ type: ['burner', 'crusty', 'tutu'][i], seed: 30 + i, x: L.ice.line[0] - i * 1.4, z: L.ice.line[1], yaw: L.iceYaw + Math.PI / 2, anim: 'idle', chat: ['This line is my whole personality now.', 'I\'ve been in this line since Monday.', 'Do they take glow sticks?'] });
  /* --- FOAM: the foam party at the Deep End (cannons spray while Brady's near) --- */
  /* --- THE GLIDE: rental counter + ring course --- */
  I({ x: L.rink.rental[0], z: L.rink.rental[1], r: 2.4, label: 'LACE UP', when: g2 => g2.missions.state('s_skate') === 'active' && !BW17.state.skates, fn: g2 => { BW17.skatesOn(g2); const m = g2.missions.get('s_skate'); m.data.left = 45; } });
  api.npc({ id: 'rinkdj', name: 'DJ ROLLERBLADE RUNNER', type: 'annoyingdj', seed: 4, x: L.rink.booth[0], z: L.rink.booth[1] - 0.6, yaw: L.rinkYaw + Math.PI, anim: 'dj', chat: ['Couples skate in five!', 'Everybody clap! Not you, you\'ll fall!', 'This next one goes out to Granny Grip!'] });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const c = L.rink.center; api.npc({ type: ['tutu', 'ledsuit', 'furcoat', 'burner'][i % 4], seed: 50 + i, x: c[0] + Math.sin(a) * 10, z: c[1] + Math.cos(a) * 5.5, behavior: 'walk', path: Array.from({ length: 12 }, (_, k) => { const t = a + k / 12 * TAU; return [c[0] + Math.sin(t) * 11, c[1] + Math.cos(t) * 6]; }), speed: 3.2, walkAnim: 'shuffle', ambient: true }); }
  /* --- MEALS ON WHEELS: kiosk hosts --- */
  const host = (id, name, type, seed, K, item, food, lines) => api.npc({ id, name, type, seed, x: K.host[0], z: K.host[1], yaw: K.yaw,
    talk(g2, a) {
      const fm = g2.missions.get('s_food');
      if (fm.state === 'active' && !fm.data['got_' + item]) { g2.say(a, lines.concat(['For your people? Say no more.']), () => { fm.data['got_' + item] = true; g2.pack.add(item, 1, { quiet: true }); g2.toast(food + ' → BACKPACK'); }); return; }
      g2.say(a, lines);
    } });
  host('bacon', 'SIR LOIN', 'burner', 13, L.kBacon, 'w17bacon', 'GIFTED BACON', ['Bacon! Gifted hourly since 2009. Ask about our bacon philosophy.']);
  host('cheese', 'BRIE ANNA', 'tutu', 8, L.kCheese, 'w17cheese', 'GRILLED CHEESE', ['Grilled cheese! Gooey enough to fix a broken heart. Medically.']);
  host('pancake', 'FLAPJACK JACK', 'crusty', 14, L.kPancake, 'w17pancake', 'PLAYA PANCAKES', ['Pancakes! The secret ingredient is dust. Not on purpose.']);
  for (const K of [L.kBacon, L.kCheese, L.kPancake]) api.crowd(K.front[0], K.front[1] + 1.2, 1.6, 2, { behaviors: ['idle', 'dance'] });
  /* --- GERALD: DUST FM --- */
  api.npc({ id: 'deepdust', name: 'DJ DEEP DUST', type: 'annoyingdj', seed: 7, x: L.radio.mic[0], z: L.radio.mic[1], yaw: L.radioYaw + Math.PI, anim: 'dj',
    talk(g2, a) {
      const rm = g2.missions.get('s_radio');
      if (rm.state === 'active' && !rm.data.aired) {
        g2.say(a, ['You\'re live on DUST FM 94.5, the voice of the playa! Go!'], () => BW17.choose(g2, { who: 'DUST FM 94.5 · ON AIR', prompt: 'How do you say it?',
          options: ['"MISSING: a slimy beige disc named Gerald. Answers to nothing."', '"Gerald, if you can hear me, I\'m not mad. Kev is. Come home."', '"REWARD: one hug and a lifetime supply of fizz."'], def: 0,
          done(g3, i) {
            rm.data.aired = true; burnsSfx('crowd_cheer', { vol: 0.5 }); g3.banner('ON AIR', 'The whole playa heard that', { col: '#ff4a4a' });
            BW17.after(g3, 1.6, g4 => { g4.say({ name: 'CALLER ON LINE TWO' }, [['Uh, hi. Is Gerald a jar? With a sock on it? He\'s been on the ice counter at Ice Ice Playa all morning.', 'Gerald? Big fan. He\'s at the ice counter. Looking cool. Literally.', 'I can\'t give you a hug but Gerald is at Ice Ice Playa. On the counter.'][i]], () => {
              rm.data.sighted = true; g4.banner('GERALD SIGHTED!', 'Ice Ice Playa, on the counter', { col: '#d8b45a' });
            }); });
          } }));
        return;
      }
      g2.say(a, ['DUST FM 94.5! All dust, all day! Next up: forty minutes of wind.']);
    } });
  /* --- HUG QUOTA: Hugo by the gate --- */
  api.npc({ id: 'hugo', name: 'HUGO', type: 'greeter', variant: 'm', seed: 6, prop: 'w17HugSign', x: L.gate[0] + 9, z: L.gate[1] + 13, yaw: Math.PI,
    talk(g2, a) {
      const st = g2.missions.state('s_hugs');
      if (st === 'active') g2.say(a, [`${g2.missions.get('s_hugs').n} of 8! Use your LOVE BOMB and bump into people. Go go go!`]);
      else if (st === 'done') g2.say(a, ['Quota met! They\'re letting me keep the sign! Come here. One more. For the road.']);
      else BW17.offer(g2, a, ['s_hugs'], () => g2.say(a, ['Free hugs! Lightly used!']));
    } });
  api.crowd(L.gate[0] - 12, L.gate[1] + 16, 5, 5, { behaviors: ['dance', 'idle', 'wander', 'dance'] });
  /* --- TEA TIME: the tea master and the cushion --- */
  api.npc({ id: 'steepy', name: 'STEEPY', type: 'healer', seed: 2, x: L.tea.bar[0], z: L.tea.bar[1], yaw: L.teaYaw, lines: ['The tea is ready when you stop asking if the tea is ready.', 'Sit. Breathe. Do not touch the cushion tassels.'] });
  I({ x: L.tea.cushion[0], z: L.tea.cushion[1], r: 1.8, label: 'SIT', when: g2 => g2.missions.state('s_tea') === 'active', fn: g2 => {
    const p = g2.player; p.teleport(L.tea.cushion[0], 0.3, L.tea.cushion[1], L.teaYaw + Math.PI); p.animOverride = 'sit';
    BW17.minigame(g2, { kind: 'still', title: 'TEA TIME', sub: 'The tea is steeping...', time: 8, maxFails: 4,
      onFidget(g3) { const a = act('steepy'); if (a) a.say(['...again.', 'The tea felt that.', 'Breathe. Then breathe less loudly.'][Math.floor(Math.random() * 3)], 1.6); },
      done(g3, ok) {
        p.animOverride = null;
        if (!ok) { const a = act('steepy'); if (a) a.say('Too fidgety. Come back when your soul has settled.', 2.4); return; }
        g3.say(act('steepy'), ['...', 'You have steeped. Drink.'], () => g3.missions.complete('s_tea'));
      } });
  } });
  /* --- THE ROOT DRIVE: Moss the stage manager, the USB in the common dome --- */
  api.pickup('pack:w17usb', L.commonDome[0] + 0.3, 1.25, L.commonDome[1] + 1.1, { mission: 's_rootdrive', gate: true, label: 'THE ROOT DRIVE', onTake(g2) { g2.player.hold('phone'); g2.banner('GOT THE ROOT DRIVE', 'Now catch the coliseum car!', { col: '#7aff5a' }); } });
  /* --- TRADING: Bart at the Totally Not a Trading Post --- */
  api.mesh(L.trade[0], L.trade[1], m => {
    m.color('#8a6a44').shine(1); m.roundBox(0, 0.5, 0, 3.0, 1.0, 1.0, 0.08, { top: '#a8865c' });
    m.color('#3a6a8a'); m.push(); m.tf(0, 2.5, 0.2, 0, 0.25); m.roundBox(0, 0, 0, 3.4, 0.06, 1.8, 0.03); m.pop();
    for (const sx of [-1.5, 1.5]) { m.color('#5a4030'); m.limb(sx, 0, -0.4, sx, 2.6, -0.4, 0.04, 0.04, { seg: 4 }); }
    for (let k = 0; k < 6; k++) { m.color(BURNS_NEON[k]).shine(2); m.ball(-1.1 + k * 0.44, 1.12, 0, 0.12, { seg: 8, rings: 5 }); }
    m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.5, hz: 0.5, y0: 0, y1: 1.0 }], lights: [{ x: 0, y: 0, z: 1, s: 0, c: '#ffcf8a', pool: 5, i: 0.4 }] };
  }, { yaw: L.tradeYaw });
  BW17.sign(api, 'TOTALLY NOT A\nTRADING POST', L.trade[0] + Math.sin(L.tradeYaw) * 1.0 + Math.cos(L.tradeYaw) * 1.8, L.trade[1] + Math.cos(L.tradeYaw) * 1.0 - Math.sin(L.tradeYaw) * 1.8, L.tradeYaw, { h: 0.9, y: 1.4, bg: '#f4e8c8', fg: '#3a2414', border: '#3a2414', size: 34 });
  api.npc({ id: 'bart', name: 'BARTER BART', type: 'crusty', seed: 4, x: L.trade[0] - Math.sin(L.tradeYaw) * 1.0, z: L.trade[1] - Math.cos(L.tradeYaw) * 1.0, yaw: L.tradeYaw,
    trades: [
      { id: 'pirate', give: 'weed', get: { costume: 'pirate' }, label: 'A baggie for a pirate coat' },
      { id: 'disco', give: 'khole', get: { costume: 'disco' }, label: 'A K-hole for a disco-ball suit' },
      { id: 'mg', give: 'molly', get: { glow: 30 }, label: 'A LOVE BOMB for 30 glow sticks' },
      { id: 'water', give: { glow: 10 }, get: 'water', once: false, label: 'Glow sticks for a water bottle' },
      { id: 'booch', give: { glow: 15 }, get: 'w17booch', once: false, label: 'Glow sticks for Kev\'s kombucha' }
    ],
    talk(g2, a) {
      const st = g2.missions.state('s_trade');
      const open = () => { if (g2.openTrade) g2.openTrade(a); };
      if (st === 'available') g2.say(a, BW17.QUEST.s_trade.pitch, () => { g2.missions.start('s_trade'); open(); });
      else g2.say(a, ['Welcome back. Remember: it\'s not trading if we both smile.'], open);
    } });
  // Gerald waits on the ice counter (hidden until the broadcast goes out)
  api.pickup('pack:w17gerald', L.ice.window[0] + 1.3, 1.45, L.ice.window[1] - 0.5, { mission: 's_radio', gate: true, label: 'GERALD',
    follow(g2, P) { const m = g2.missions.get('s_radio'); P.y0 = m && m.data.sighted ? 1.45 : -60; },
    onTake(g2) { g2.player.hold('coffee'); g2.banner('GERALD!', 'Take him home to Kev', { col: '#d8b45a' }); const m = g2.missions.get('s_radio'); m.data.marker = 'kev'; } });
  /* --- ground scores scattered round the district (cartoon baggies; they go in the backpack) --- */
  for (const [k, x, z, y] of L.baggies) api.pickup('bag:' + k, x, y || 0.9, z);
};

/* the Friday-night burn: sit at the perimeter, the Stick Cathedral burns */
BW17.burnScene = function (g) {
  const S = BW17.state, L = BW17.L, p = g.player, C = L.cathedral, pc = L.perimeter;
  if (S.burning) return; S.burning = true; S.musicLock = true;
  p.teleport(pc[0], 0, pc[1], Math.atan2(C[0] - pc[0], C[1] - pc[1])); p.animOverride = 'sit';
  const piece = S.cathedral;
  g.cutscene([
    { music: 'burns_w17n' },
    { cam: { x: pc[0] - 4, y: 1.6, z: pc[1] - 5, tx: C[0], ty: 14, tz: C[1], fov: 0.95 } },
    { say: [g.actor('sparky') || { name: 'SPARKY' }, ['Everybody sit. Here we go. Three...']] },
    { banner: ['3', '', { col: '#ffb347', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { banner: ['2', '', { col: '#ff8a3a', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { banner: ['1', '', { col: '#ff5a2a', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { do: g2 => { if (typeof BurnsBigArt !== 'undefined' && piece) BurnsBigArt.burn(g2, piece, { dur: 34 }); else for (let i = 0; i < 6; i++) g2.addTempFire(C[0] + (Math.random() - 0.5) * 12, 0.5, C[1] + (Math.random() - 0.5) * 16, 2.5, 30); g2.shake(0.5); burnsSfx('flame_jet'); burnsSfx('crowd_cheer'); } },
    { flash: '#ffb347' },
    { orbit: { x: C[0], y: 4, z: C[1], r0: 46, r1: 40, h0: 4, h1: 12, a0: Math.PI - 0.5, a1: Math.PI + 0.5, ty: 16, dur: 7, fov: 0.9 } },
    { do: g2 => { for (let i = 0; i < 8; i++) BW17.after(g2, i * 0.45, g3 => { g3.fx.firework(C[0] + (Math.random() - 0.5) * 20, 30 + Math.random() * 12, C[1] + (Math.random() - 0.5) * 20, BURNS_NEON[i % 7]); burnsSfx('firework_burst', { vol: 0.6 }); }); } },
    { crane: { from: { x: pc[0] - 3, y: 1.2, z: pc[1] - 4, tx: C[0], ty: 12, tz: C[1], fov: 0.9 }, to: { x: pc[0] - 1, y: 2.6, z: pc[1] - 7, tx: C[0], ty: 26, tz: C[1], fov: 1.0 }, dur: 4 } },
    { say: ['brady', ['It\'s so beautiful. And so... hot. My eyebrows. Sparky, is this how it happened?']] },
    { say: [g.actor('sparky') || { name: 'SPARKY' }, ['Every. Single. Time.']] },
    { do: g2 => { p.animOverride = null; S.musicLock = false; g2.missions.complete('s_burn', { x: p.x, y: p.y + 1.3, z: p.z - 2 }); } }
  ]);
};
