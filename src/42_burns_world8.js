/* ============================================================
   BRADY-O BURNS — World 8: HELL STATION (hot afternoon)
   The playa's only gas station, run by DPW. El Pulpo (the fire octopus art
   car Brady commandeered) is running on fumes. Fuel it up. Survive DPW.
   Missions (Burn Tokens):
     fumes    Running on Fumes    drive the sputtering octopus into the fuel line
     permit   Permit Purgatory    paperwork: a form on the containers (forklift
                                  platforming), a stamp from a sleeping DPW,
                                  a coffee "gift", then back to the window
     fillup   Fill 'Er Up         park at pump 3, defend El Pulpo while it fuels
     nozzle   Nozzle Snatcher     a DPW grabs the nozzle mid-fill: catch him
     climb    Hell's Highest      hidden: climb the big diesel tank
     boss     Foreman Rusty       DPW Foreman Rusty on his telehandler
   DPW are comedic exaggeration: dusty, rude, unshowered since July, live here.
   ============================================================ */

const BURNS_W8 = {
  SPAWN: { x: 2.5, z: 128 }, CAR: { x: 8, z: 131 },
  LINE_END: { x: -12, z: 97 }, BAY: { x: 7.1, z: 0.4 }, PUMP3: { x: 4.75, z: 0.4 },
  YARD: { x: 0, z: -118, r: 30 }, GATE: { x: 0, z: -86 },
  TANK: { x: -58, z: -30, r: 6, h: 12 },
  state: null
};
const BURNS_W8_SKY = Object.assign({}, BURNS_PALETTES.day, {
  zen: '#3f84de', hor: '#ffe4b6', mid: '#9cc2ee', midK: 0.45, fog: '#f0cc9a', fogD: 0.0068, haze: 0.85, fogMax: 0.8,
  sun: [195, 64], sunCol: '#fff4d8', sunSize: 0.0036, sky: '#d8e2f0', gnd: '#e6bc94', key: '#fff0d4', keyK: 1.05, emB: 1.0,
  rim: '#ffe6c4', mtnCol: '#a8909a', mtnH: 3.2, clouds: 0.15, cloudCol: '#fff4ea'
});
const BURNS_W8_SKY2 = Object.assign({}, BURNS_W8_SKY, {
  zen: '#3462c4', hor: '#ffc286', mid: '#e8a0a0', midK: 0.35, fog: '#eeb27c', fogD: 0.0078, haze: 0.9,
  sun: [255, 22], sunCol: '#ffcf8a', sunSize: 0.004, key: '#ffd2a4', keyK: 0.95, sky: '#c8b8d8', gnd: '#d8a07c', rim: '#ffb890', emB: 1.15, clouds: 0.25, cloudCol: '#ffd8c0'
});
const BURNS_W8_TAUNTS = ['SPARKLE PONY SPOTTED!', 'HARD HAT AREA, GLITTER BOY!', 'HAVEN\'T SHOWERED SINCE JULY. PROUD OF IT.', 'GO BACK TO YOUR DOME!', 'I LIVE HERE. YOU VISIT.', 'YOU\'RE MOOP!', 'WHO LET YOU PAST THE BERM?!', 'MY BOOTS HAVE SEEN THINGS.'];

/* ---------------- DPW looks ---------------- */
function burnsW8Spec(seed, o) {
  const s = BurnsRig.npcSpec('dpw', seed);
  const r = mulberry32(seed * 977 + 5);
  s.skin = r.pick(['#c8875e', '#b8764e', '#8a5636', '#d89a70']); s.skinSh = shade(s.skin, -0.14);
  s.top = { kind: r.pick(['tee', 'tank', 'hoodie']), col: r.pick(['#7a6a58', '#5a4e44', '#8a7458', '#4a4a4a']) };
  s.bottom = { kind: 'cargo', col: r.pick(['#5a4a3a', '#4a4236', '#6a5a46']) };
  s.hat = { kind: r.pick(['hardhat', 'hardhat', 'cap', 'bandana']), col: r.pick(['#ff8a1a', '#ffd21a', '#e8e0d0', '#c84a2a']) };
  s.face = r.pick(['beard', 'grumpy', 'stern', 'beard']); s.goggles = r.chance(0.6); s.glasses = r.chance(0.3) ? 'shades' : null;
  s.hair = { style: r.pick(['long', 'short', 'mohawk', 'buzz', 'bald']), col: r.pick(['#6a5a4a', '#3a2a1a', '#9a8a7a', '#c8b8a0']), hi: '#d8c8b0' };
  s.acc = ['toolbelt']; if (r.chance(0.4)) s.acc.push('bracelets');
  s.body = { h: 0.98 + r() * 0.12, w: 1.12 + r() * 0.22 };
  Object.assign(s, o || {});
  s.key = 'w8dpw:' + seed + ':' + JSON.stringify(o || {});
  return s;
}

/* ---------------- DPW behaviours ---------------- */
(() => {
  const R = (n, b) => BurnsBehaviors.register(n, b);
  const stink = (a, g, dt) => { if (Math.random() < dt * 1.4) g.fx.add(a.x + (Math.random() - 0.5) * 0.6, a.y + 1.7, a.z + (Math.random() - 0.5) * 0.6, 0, 0.7, 0, 1.4, 0.25, 0.7, [0.62, 0.78, 0.36], 0.5, 'smoke', 0, Math.random() * 6, 1); };
  const taunt = (a, dt) => { if (Math.random() < dt * 0.12) a.say(burnsW8910Pick(a.def.taunts || BURNS_W8_TAUNTS), 1.8); };
  // wrench tossers: keep their distance, lob wrenches (spin deflects them)
  R('w8Wrench', {
    init(a) { a.data.cd = 1.2 + Math.random() * 1.5; },
    update(a, g, dt) {
      const D = a.data, p = g.player, d = a.distP();
      D.cd -= dt; stink(a, g, dt);
      if (d < (a.def.aggro || 16) && Math.abs(p.y - a.y) < 7) {
        a.face(p.x, p.z, dt, 5); taunt(a, dt);
        if (D.cd <= 0 && d > 2.5) {
          D.cd = a.def.cooldown || (2.1 + Math.random() * 0.8); D.throwT = 0.3;
          const hp = a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.25, 0), T = clamp(d / 13, 0.55, 1.15);
          BurnsW8910Haz.wrench(g, hp[0], hp[1] + 0.2, hp[2], p.x + p.vx * T * 0.6, p.y + 0.9, p.z + p.vz * T * 0.6, { T, from: a });
          burnsSfx('throw', { vol: 0.5 });
        }
        if (D.throwT > 0) { D.throwT -= dt; a.ch.play('throw'); } else a.ch.play(d < 4 ? 'yell' : 'idle');
        if (d < 3.5 && !a.def.fixedY) { a.moveTo(a.x - (p.x - a.x), a.z - (p.z - a.z), 2.4, dt, 0.2); a.ch.play('walk'); } else a.moveTo(a.x, a.z, 0, dt);
      } else if (!a.def.fixedY) { const dh = a.moveTo(a.home.x, a.home.z, 1.2, dt, 0.5); a.ch.play(dh > 0.6 ? 'walk' : 'idle'); }
      else a.ch.play('idle');
      BurnsBehaviors.contact(a, g, 1);
      a.physics(dt);
    }
  });
  // rebar swingers: heavy, slow, telegraphed sweep at shin height (jump it), three hits to calm down
  R('w8Rebar', {
    init(a) { a.data.mode = 'walk'; a.data.t = 0; },
    update(a, g, dt) {
      const D = a.data, p = g.player, d = a.distP();
      D.t -= dt; stink(a, g, dt);
      if (D.mode === 'walk') {
        if (d < (a.def.aggro || 13) && Math.abs(p.y - a.y) < 3) { a.moveTo(p.x, p.z, a.def.chaseSpeed || 2.7, dt, 2.4); a.ch.play('walk', { rate: 1.3 }); taunt(a, dt); if (d < 3.1 && D.t <= 0) { D.mode = 'wind'; D.t = 0.8; a.say(burnsW8910Pick(['REBAR TIME!', 'BATTER UP!', 'FORE!']), 0.9); burnsSfx('yell', { vol: 0.5 }); } }
        else { const dh = a.moveTo(a.home.x, a.home.z, 1.3, dt, 0.5); a.ch.play(dh > 0.6 ? 'walk' : 'idle'); }
      } else if (D.mode === 'wind') { a.face(p.x, p.z, dt, 6); a.moveTo(a.x, a.z, 0, dt); a.ch.play('yell'); if (D.t <= 0) { D.mode = 'swing'; D.t = 0.32; D.hit = false; burnsSfx('spin', { pitch: 0.6, vol: 0.8 }); } }
      else if (D.mode === 'swing') {
        a.ch.play('spin');
        if (!D.hit && d < 3.4 && p.y < a.y + 0.95 && p.invT <= 0) { D.hit = true; p.hurt(2, a.x, a.z, 10); }
        if (D.t <= 0) { D.mode = 'tired'; D.t = 1.5; a.say(burnsW8910Pick(['*wheeze*', 'My back...', 'Union break.']), 1.2); }
      } else if (D.mode === 'tired') { a.ch.play('hurt'); a.moveTo(a.x, a.z, 0, dt); if (D.t <= 0) { D.mode = 'walk'; D.t = 0.6; } }
      if (D.mode !== 'swing' && D.mode !== 'wind') BurnsBehaviors.contact(a, g, 1);
      a.physics(dt);
    }
  });
  // fuel raiders: march on El Pulpo during the fill-up and unplug it
  R('w8Raid', {
    init(a) { a.data.cd = 1 + Math.random() * 2; },
    update(a, g, dt) {
      const S = BURNS_W8.state, car = S.pulpo.car, D = a.data, p = g.player, d = a.distP();
      stink(a, g, dt); D.cd -= dt;
      const dc = Math.hypot(car.x - a.x, car.z - a.z);
      a.data.atCar = dc < 4.2;
      if (d < 5 && Math.abs(p.y - a.y) < 2) { a.moveTo(p.x, p.z, 3.2, dt, 0.6); a.ch.play('run', { rate: 0.8 }); taunt(a, dt); }
      else if (!a.data.atCar) { a.moveTo(car.x, car.z, 3.0, dt, 3.6); a.ch.play('walk', { rate: 1.3 }); }
      else { a.face(car.x, car.z, dt, 4); a.moveTo(a.x, a.z, 0, dt); a.ch.play('clipboard'); if (D.cd <= 0) { D.cd = 3 + Math.random() * 2; a.say(burnsW8910Pick(['WHO PARKED THIS CALAMARI?!', 'UNPLUGGING. FOR SAFETY.', 'This octopus needs a permit for its permit!', 'NOT ON MY WATCH!']), 1.8); } }
      BurnsBehaviors.contact(a, g, 1);
      a.physics(dt);
    }
  });
  // Skids, the nozzle snatcher: sprints a loop, ducks wrenches back at Brady
  R('w8Snatch', {
    init(a) { a.data.i = 0; a.data.cd = 2; },
    update(a, g, dt) {
      const P = a.def.path, D = a.data, p = g.player, d = a.distP();
      const tgt = P[D.i], dt2 = a.moveTo(tgt[0], tgt[1], d > 45 ? 1.5 : a.def.runSpeed || 6.6, dt, 0.6);
      if (dt2 < 1.2) D.i = (D.i + 1) % P.length;
      a.ch.play(d > 45 ? 'walk' : 'run', { rate: 1 });
      D.cd -= dt;
      if (d < 16 && d > 4 && D.cd <= 0) { D.cd = 2.6; const hp = a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.25, 0); BurnsW8910Haz.wrench(g, hp[0], hp[1] + 0.3, hp[2], p.x + p.vx * 0.5, p.y + 0.9, p.z + p.vz * 0.5, { T: 0.8, from: a }); }
      if (Math.random() < dt * 0.3) a.say(burnsW8910Pick(['FINDERS KEEPERS!', 'NOZZLE\'S MINE NOW!', 'CATCH ME, SPARKLE PONY!', 'IT\'S MOOP! I\'M CLEANING UP!']), 1.4);
      if (d > 45 && Math.random() < dt * 0.4) a.say('Over HERE, slowpoke!', 1.4);
      if (Math.random() < dt * 4) g.fx.dust(a.x, a.y + 0.1, a.z, 1);
      a.physics(dt);
    }
  });
  // Foreman Rusty drives the telehandler (the whole fight lives here)
  R('w8Rusty', {
    init(a) { a.data.st = 'park'; a.data.t = 0; a.data.combo = 0; a.data.calls = 0; },
    update(a, g, dt) { BURNS_W8.rustyUpdate(a, g, dt); },
    hit(a, g, kind) { return BURNS_W8.rustyHit(a, g, kind); }
  });
})();

/* ---------------- world ---------------- */
BurnsWorlds.register({
  id: 8, name: 'Hell Station', sub: 'Fuel up. Fight DPW.',
  sky: BURNS_W8_SKY, sky2: BURNS_W8_SKY2, tod: 0,
  music: 'burns_w8',
  bounds: [-150, -175, 150, 150],
  spawn: { x: 2.5, y: 0, z: 128, yaw: Math.PI },
  ground: { base: '#d6aa7c', crack: 0.32, mottle: 0.38, res: 0.5 },
  dust: 1.4,
  missions: [
    { id: 'fumes', name: 'Running on Fumes', short: 'Drive El Pulpo to the fuel line', type: 'ride', vehicle: 'car', start: 'auto', silent: true,
      target: { x: -12, z: 97, r: 6.5 }, tokenAt: { x: -7, y: 1.4, z: 100 },
      desc: 'El Pulpo is out of gas. Drive the sputtering octopus to the end of the fuel line.', hint: 'Hell Station fuel line, west side of the road',
      onComplete(g) { BURNS_W8.lineArrive(g); } },
    { id: 'permit', name: 'Permit Purgatory', short: 'Talk to Dot at the permit window', type: 'custom', giver: 'dot', start: 'manual', requires: ['fumes'], marker: { x: 29, z: 34 },
      desc: 'No permit, no petrol. Dot at the DPW permit window has... a process.', hint: 'DPW permit trailer, east of the station',
      onEvent(g, m, name, data) { if (name === 'pickup' && data && data.mission === 'permit') { BURNS_W8.permitStep(g, 2); return true; } } },
    { id: 'fillup', name: 'Fill \'Er Up', short: 'Park El Pulpo at pump 3', type: 'custom', giver: 'hank', start: 'manual', requires: ['permit'], count: 100, progressLabel: 'Fuel', marker: { x: 7, z: 0 },
      desc: 'Park El Pulpo at pump 3 and keep DPW off it while it fills. They hate art cars.', hint: 'Hell Station canopy, pump 3',
      onUpdate(g, m, dt) { BURNS_W8.fillUpdate(g, m, dt); } },
    { id: 'nozzle', name: 'Nozzle Snatcher', short: 'Catch Skids and get the nozzle back', type: 'custom', start: 'manual', requires: ['permit'], secret: true, marker: { x: 20, z: -20 },
      desc: 'A DPW named Skids ran off with the fuel nozzle. Spin, stomp or bike into him.', hint: 'Somewhere around the station. Follow the yelling.',
      onEvent(g, m, name, data) { if (name === 'pickup' && data && data.mission === 'nozzle') { g.missions.complete('nozzle', { x: data.x, y: data.y0 + 0.6, z: data.z }); return true; } },
      onComplete(g) { g.toast('NOZZLE RECOVERED! BACK TO PUMP 3!'); } },
    { id: 'climb', name: 'Hell\'s Highest', short: 'Climb the big diesel tank', type: 'climb', start: 'trigger', secret: true, target: { x: -58, z: -30, r: 4.6, y: 12 }, tokenAt: { x: -58, y: 13.6, z: -30 },
      desc: 'DO NOT CLIMB THE TANK, says the sign. The sign is not the boss of you.', hint: 'The tank farm, west of the station' },
    { id: 'boss', name: 'Foreman Rusty', short: 'Defeat Foreman Rusty!', type: 'boss', start: 'manual', requires: ['fillup', 'nozzle'], tokenDirect: true, marker: { x: 0, z: -112 },
      desc: 'Twenty-two years on the playa. Showered twice. He wants El Pulpo impounded.', hint: 'The DPW yard, north end', lockedDesc: 'Fuel up El Pulpo first.' }
  ],
  build(api, g) {
    const W8 = BURNS_W8, R = api.rng, S = BurnsW8910Shape;
    W8.state = { introDone: !!BurnsSave.flag(8, 'intro'), fuel: 0, fueling: false, raidT: 0, raiders: [], forks: [], gateOn: false, bossStarted: false };
    const st = W8.state;
    W8.paintGround(api);
    /* ---------------- El Pulpo ---------------- */
    st.pulpo = BurnsW8910Pulpo.spawn(api, { x: W8.CAR.x, z: W8.CAR.z, yaw: Math.PI, fuel: 0.05, maxSpeed: 3.2,
      when: g2 => !BURNS_W8.state.fueling && !g2.cine });
    /* ---------------- arrival: the road in ---------------- */
    api.road([[2, 150], [0, 100], [0, 40], [0, -60], [0, -84]], 10, { tracks: [-1.8, 1.8] });
    api.road([[-12, 110], [-12, 20], [-7, 8]], 7, { col: 'rgba(140,105,80,0.45)', tracks: [-1.4, 1.4] });
    const roadSign = (t, x, z, yaw, o) => api.sign(t, x, z, Object.assign({ yaw, h: t.split('\n').length > 2 ? 1.5 : 1.1, style: { bg: '#f4e4c0', fg: '#3a1408', size: 40, border: '#8a2a10' } }, o || {}));
    roadSign('HELL STATION\n▲ 1/4 MILE ▲', -6.5, 116, Math.PI / 2 + 0.2);
    roadSign('ONLY GAS\nFOR 3 MILES', 6.5, 108, -Math.PI / 2 - 0.2);
    roadSign('FUEL · DPW · DESPAIR', -6.5, 74, Math.PI / 2);
    roadSign('WAIT TIME FROM\nTHIS POINT: YES', -17, 100, Math.PI / 2);
    roadSign('DPW APPRECIATES\nYOUR PATIENCE\n(NOT REALLY)', -17, 52, Math.PI / 2);
    roadSign('NO IDLING\n(EXCEPT IN LINE)', -17, 30, Math.PI / 2);
    api.checkpoint('cp_start', -3, 122, { yaw: Math.PI, name: 'The Road In' });
    api.npc({ id: 'gail', name: 'GREASE GAIL', type: 'crusty', seed: 81, x: 13.5, z: 126, yaw: -1.2,
      lines: ['Octopus sounds sick, hon. That cough? That\'s an empty tank.', 'Hell Station\'s dead ahead. Only gas on the playa. Run by DPW.', 'Get in line, get a permit, and whatever you do, don\'t make eye contact with the foreman.', 'Here. Glow sticks. For courage.'],
      gift: { kind: 'glowstick', n: 12 } });
    api.prop('chair', { x: 14.5, z: 125, yaw: -1.4, col: '#c8843e' });
    api.prop('cooler', { x: 15.5, z: 127.5, yaw: 0.3, col: '#c83a2a' });
    api.glowLine(1.5, 118, 1.5, 104, 8); api.glowLine(-1.5, 98, -1.5, 82, 7);
    api.pickup('water', 4, 0.9, 112);
    api.pickup('bag:powder', 9, 0.9, 92);
    /* ---------------- the fuel line ---------------- */
    const lineKinds = [['boxtruck', 84], ['rv', 70], ['bus', 56], ['van', 44], ['camper', 34], ['car', 25]];
    lineKinds.forEach(([k, z], i) => api.prop(k, { x: -12, z, yaw: Math.PI, seed: 800 + i }));
    api.prop('artcar', { x: -21, z: 64, yaw: Math.PI + 0.1, len: 8, col: '#3a1a5a', sculpt: '#ffd84a' });
    api.crowd(-20, 78, 3, 3, { behaviors: ['idle', 'sit', 'idle'] });
    api.npc({ type: 'sparklepony', seed: 81, x: -6, z: 60, name: 'SEQUIN', lines: ['Can you spare some gas money? I mean gas. I mean money. I mean a ride to the Temple?', 'I\'ve been in this line since Tuesday. I came for ice. This is the gas line.', 'Is it true DPW live out here ALL YEAR? Like... on purpose?'] });
    api.glowLine(-5.5, 80, -5.5, 30, 10);
    /* Hell's Kitchen: coffee gifted to the people in line */
    api.prop('shade', { x: -32, z: 62, w: 8, d: 6, col: '#f0d8b0', lights: false });
    api.mesh(-30, 60, m => { m.color('#3a2a3a').shine(2); S.rbox(m, 0, 0.55, 0, 2.6, 1.1, 1.1, 0.18); m.color('#c8843e'); S.rbox(m, 0, 1.15, 0, 2.7, 0.1, 1.2, 0.04); m.color('#e8e8f0').shine(3); S.tube(m, -0.6, 1.2, 0, 0.22, 0.2, 0.6); S.drum(m, 0.5, 1.2, 0, 0.18, 0.35, 0.06); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.55, y0: 0, y1: 1.2 }] }; });
    api.sign('HELL\'S KITCHEN\nGIFTING COFFEE TO THE DAMNED', -32, 66.5, { y: 2.2, h: 1.0, post: false, style: { bg: '#2a0a0a', fg: '#ffb060', glow: '#ff6a2a', size: 36, border: '#ff6a2a' }, glow: '#ff6a2a' });
    api.npc({ id: 'bean', name: 'BEAN, BARISTA', type: 'burner', seed: 82, x: -30, z: 58.6, yaw: 0,
      talk(g2, a) { BURNS_W8.beanTalk(g2, a); } });
    api.pickup('bag:molly', -36, 0.9, 58);
    api.light(-32, 62, 9, '#ffb070', 0.3);
    /* ---------------- Hell Station: canopy + pump islands ---------------- */
    W8.buildStation(api);
    api.checkpoint('cp_station', -16, 12, { yaw: 0, name: 'Hell Station' });
    /* ---------------- DPW permit office ---------------- */
    W8.buildOffice(api);
    /* ---------------- container canyon (forklift platforming) ---------------- */
    W8.buildCanyon(api);
    /* ---------------- the tank farm (hidden climb) ---------------- */
    W8.buildTanks(api);
    /* ---------------- DPW living area ---------------- */
    W8.buildGhetto(api);
    /* ---------------- the boneyard ---------------- */
    W8.buildBoneyard(api);
    /* ---------------- the DPW yard (boss arena) ---------------- */
    W8.buildYard(api, g);
    /* ---------------- odds and ends ---------------- */
    for (let i = 0; i < 4; i++) api.prop('portapotty', { x: 22 + i * 1.35, z: 62, yaw: Math.PI, col: ['#2a6ac8', '#3a8a3a', '#2a6ac8', '#c8a020'][i] });
    api.sign('PORTA-POTTIES\nCLEANED: 1997', 27.6, 60, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#f4e8c8', fg: '#2a1a10', size: 36 } });
    api.prop('boxtruck', { x: 38, z: 82, yaw: -0.4, col: '#e8f4ff', cabCol: '#2a6ac8', seed: 830 });
    api.sign('ICE ICE MAYBE\nGIFTING COLD THINGS', 33, 76, { yaw: -0.4, h: 1.1, style: { bg: '#d8f0ff', fg: '#1a4a8a', size: 38, border: '#1a4a8a' } });
    api.npc({ name: 'FROSTY', type: 'tutu', seed: 83, x: 34.5, z: 79, yaw: -2.2, lines: ['It\'s a hundred and four degrees. Have a water. Have two. Have a snow cone of the soul.', 'DPW don\'t take ice. They say ice is "for tourists." They drink warm Gatorade from 2019.'], gift: { kind: 'water' } });
    api.npc({ type: 'ranger', seed: 81, name: 'RANGER DUSTIN', x: 14, z: 40, behavior: 'walk', path: [[14, 40], [14, 80], [14, 40]], speed: 1.2, lines: ['I\'m not a cop. I\'m a Ranger. DPW aren\'t cops either. They\'re worse. They have forklifts.', 'Foreman Rusty\'s been impounding art cars all week. Says they "make the playa look fun."'], gift: { kind: 'glowstick', n: 6 } });
    // roaming DPW crews
    const dpw = (x, z, seed, beh, o) => api.enemy(Object.assign({ spec: burnsW8Spec(seed), name: 'DPW', x, z, behavior: beh, hp: beh === 'w8Rebar' ? 3 : 2, drop: 3, tag: 'dpw', afterDefeat: 'chill', defeatLine: burnsW8910Pick(['Fine. Break time.', 'I\'m telling Rusty.', 'Ugh. Union rules.', 'My shift ended in August anyway.']) }, o || {}));
    dpw(-22, 40, 1, 'w8Wrench'); dpw(92, -30, 2, 'w8Wrench'); dpw(102, -78, 3, 'w8Wrench'); dpw(-42, -44, 4, 'w8Wrench');
    dpw(62, -12, 5, 'w8Wrench', { y: 5.2, fixedY: true, aggro: 13 });
    dpw(-8, -74, 6, 'w8Rebar'); dpw(-70, -84, 7, 'w8Rebar'); dpw(72, -58, 8, 'w8Rebar');
    dpw(22, -34, 9, 'charger', { chargeLine: 'BULLDOZER!', dashSpeed: 11, aggro: 15 }); dpw(-30, 16, 10, 'charger', { chargeLine: 'OUTTA MY YARD!', dashSpeed: 11, aggro: 15 });
    // the hidden photo above the canopy (LSD path)
    api.pickup('bag:lsd', -18, 0.9, -6);
    api.hidden(() => {
      const steps = [[-19, 1.4, -10], [-19.5, 2.8, -13.5], [-17, 4.2, -15.5], [-13.5, 5.6, -14.5]];
      steps.forEach(([x, y, z], i) => api.roundBox(x, y - 0.3, z, 2.4, 0.3, 2.4, burnsHSL(20 + i * 50, 0.9, 0.6), { e: 0.6, r: 0.12 }));
      api.glow(-6, 8.4, -4, 2.6, '#ff4fd8');
    });
    api.pickup('photo', -6, 8.0, -4, { id: 'p3', hidden: true });
    api.marker('station', 0, 0, 'Hell Station', { col: '#ff5a2a' });
    api.marker('office', 32, 34, 'Permits', { col: '#ffd84a' });
    api.marker('canyon', 74, -16, 'Containers', { col: '#38f2ff' });
    api.marker('ghetto', 92, -88, 'DPW Camp', { col: '#ff9a4a' });
    api.marker('yard', 0, -118, 'DPW Yard', { col: '#ff3b5c' });
    api.marker('tanks', -55, -18, 'Tank Farm', { col: '#7aff5a' });
    api.update((g2, dt) => BURNS_W8.update(g2, dt));
  },
  onStart(g) {
    const S = BURNS_W8.state, car = S.pulpo.car;
    if (g.missions.isDone('fumes')) { car.x = -12; car.z = 99; car.yaw = Math.PI; car.syncMover(); }
    if (g.missions.isDone('fillup')) { S.pulpo.fuel = 1; car.maxSpeed = 9; car.x = BURNS_W8.BAY.x; car.z = BURNS_W8.BAY.z + 6; car.syncMover(); }
    else if (g.missions.isDone('permit')) { car.maxSpeed = 3.2; }
    if (BurnsSave.flag(8, 'permitStep') >= 5 || g.missions.isDone('permit')) S.permitDone = true;
    // tokens push the afternoon toward golden hour
    g.tod = Math.min(0.85, BurnsSave.tokenCount(8) * 0.15);
    if (g.missions.isDone('boss')) { S.bossStarted = true; BURNS_W8.rustyRetired(g); }
    g.interactables = [
      { x: BURNS_W8.PUMP3.x + 0.2, z: BURNS_W8.PUMP3.z, r: 2.6, label: 'FUEL', when: g2 => BURNS_W8.canFuel(g2), fn: g2 => BURNS_W8.startFueling(g2) }
    ];
    if (!S.introDone) BURNS_W8.intro(g);
    else g.banner('HELL STATION', 'Fuel up El Pulpo. Don\'t make eye contact with DPW.', { col: '#ff5a2a' });
  },
  onRespawn(g) {
    const S = BURNS_W8.state;
    BurnsW8910Haz.clear(g);
    if (S.bossStarted && !g.missions.isDone('boss')) BURNS_W8.rustyReset(g);
  },
  env(g, env) {
    const S = BURNS_W8.state;
    S.pulpo.sync(g);
    if (S.tele) BURNS_W8.teleSync(g);
    // heat shimmer: a touch of extra haze at golden hour
    env.haze = Math.min(1, env.haze + 0.05);
  },
  drawSprites(g, R) { BurnsW8910Haz.draw(g, R); BURNS_W8.drawSprites(g, R); },
  update(g, dt) { BurnsW8910.tick(g, dt); }
});

/* ---------------- ground paint ---------------- */
BURNS_W8.paintGround = function (api) {
  const R = api.rng;
  api.paint((c, P, sc) => {
    // sun-bleached blotches and tyre tracks
    for (let i = 0; i < 170; i++) { const x = R.range(-150, 150), z = R.range(-175, 150), [px, pz] = P(x, z), r = R.range(2, 10) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gg.addColorStop(0, dark ? 'rgba(150,108,78,0.22)' : 'rgba(250,226,190,0.26)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    c.strokeStyle = 'rgba(110,80,60,0.22)'; c.lineWidth = 0.35 * sc;
    for (let i = 0; i < 40; i++) { const [ax, az] = P(R.range(-150, 150), R.range(-175, 150)), ang = R() * TAU, len = R.range(30, 110) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.5) * len * 0.5, az + Math.sin(ang + 0.5) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
    // the station apron: dark oily pad with lane lines
    const [x0, z0] = P(-20, -12), [x1, z1] = P(20, 12);
    c.fillStyle = 'rgba(70,58,58,0.62)'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
    c.fillStyle = 'rgba(255,220,80,0.55)'; for (const lx of [-3.5, 3.5, -10.5, 10.5]) { const [a, b] = P(lx - 0.9, -10), [cc, d] = P(lx + 0.9, 10); c.fillRect(a, b, cc - a, d - b); }
    c.fillStyle = 'rgba(255,255,255,0.4)'; for (const lx of [-7, 0, 7]) for (let z = -10; z < 10; z += 3) { const [a, b] = P(lx - 0.12, z), [cc, d] = P(lx + 0.12, z + 1.6); c.fillRect(a, b, cc - a, d - b); }
    for (let i = 0; i < 26; i++) { const [px, pz] = P(R.range(-18, 18), R.range(-11, 11)), r = R.range(0.6, 2.2) * sc; c.fillStyle = 'rgba(30,24,30,0.35)'; c.beginPath(); c.ellipse(px, pz, r, r * 0.7, R() * 3, 0, TAU); c.fill(); }
    // "PUMP 3" painted in the bay
    c.save(); const [tx, tz] = P(7, 6.5); c.translate(tx, tz); c.fillStyle = 'rgba(255,236,160,0.75)'; c.font = `${3.2 * sc}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PUMP 3', 0, 0); c.restore();
    // the yard: churned dirt and a big scraped circle
    const [yx, yz] = P(BURNS_W8.YARD.x, BURNS_W8.YARD.z), yr = (BURNS_W8.YARD.r + 2) * sc;
    const gy = c.createRadialGradient(yx, yz, yr * 0.1, yx, yz, yr); gy.addColorStop(0, 'rgba(120,86,62,0.55)'); gy.addColorStop(0.9, 'rgba(140,100,72,0.45)'); gy.addColorStop(1, 'rgba(140,100,72,0)'); c.fillStyle = gy; c.beginPath(); c.arc(yx, yz, yr, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(80,58,44,0.35)'; c.lineWidth = 0.6 * sc; for (let i = 0; i < 14; i++) { const a = R() * TAU, rr = R.range(4, 24) * sc; c.beginPath(); c.arc(yx, yz, rr, a, a + R.range(0.8, 2.4)); c.stroke(); }
    // tank farm berm shadow + oil
    const [bx, bz] = P(-55, -18); const gb = c.createRadialGradient(bx, bz, 0, bx, bz, 30 * sc); gb.addColorStop(0, 'rgba(90,72,64,0.35)'); gb.addColorStop(1, 'rgba(90,72,64,0)'); c.fillStyle = gb; c.fillRect(bx - 30 * sc, bz - 30 * sc, 60 * sc, 60 * sc);
  });
};

/* ---------------- builders ---------------- */
// a shipping container: rounded corners, corrugated ribs, doors on one end. y = bottom
BURNS_W8.container = function (api, x, z, yaw, y, col, o) {
  o = o || {};
  return api.mesh(x, z, m => {
    const S = BurnsW8910Shape, L = 12.2, Wd = 2.44, H = 2.6, c2 = shade(col, -0.16);
    m.color(col).shine(1); S.rbox(m, 0, H / 2, 0, Wd, H, L, 0.09, { top: shade(col, 0.06) });
    m.color(c2); m.lo = true;
    for (let k = -L / 2 + 0.6; k < L / 2 - 0.4; k += 0.55) { m.box(Wd / 2 + 0.03, H / 2, k, 0.06, H - 0.3, 0.12); m.box(-Wd / 2 - 0.03, H / 2, k, 0.06, H - 0.3, 0.12); }
    m.lo = false;
    m.color(shade(col, -0.3)); m.box(0, H / 2, L / 2 + 0.03, Wd - 0.3, H - 0.3, 0.05);
    m.color('#c8c8d0'); for (const sx of [-0.4, 0.4]) m.box(sx, H / 2, L / 2 + 0.07, 0.06, H - 0.6, 0.06);
    if (o.label) { const reg = BURNS_ATLAS.sign(o.label, { bg: null, fg: '#f4f0e8', size: 52, pad: 8 }); m.color(col, 0.0); m.decal(0, H * 0.55, L / 2 + 0.06, Wd * 0.9, Wd * 0.9 / reg.aspect, reg); }
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: Wd / 2, hz: L / 2, y0: 0, y1: H, cover: true }] };
  }, { yaw, y: y || 0 });
};
// forklift: static body + a moving fork carriage (a pallet you can ride). Returns the fork record.
BURNS_W8.forklift = function (api, x, z, yaw, lo, hi, period, phase, mast) {
  const S = BurnsW8910Shape, H = mast || Math.max(3.6, hi + 1.2);
  api.mesh(x, z, m => {
    m.color('#ffc21a').shine(2); S.rbox(m, 0, 0.95, -0.2, 1.5, 1.0, 2.6, 0.22);
    m.color('#2a2a30'); S.rbox(m, 0, 1.15, -1.4, 1.45, 1.1, 0.7, 0.18);
    for (const [wx, wz, wr] of [[0.72, 0.6, 0.42], [-0.72, 0.6, 0.42], [0.7, -1.05, 0.34], [-0.7, -1.05, 0.34]]) S.wheel(m, wx, wr, wz, wr, 0.32);
    m.color('#2a2a30'); for (const [sx, sz] of [[0.62, 0.55], [-0.62, 0.55], [0.62, -0.9], [-0.62, -0.9]]) S.pill(m, sx, 1.4, sz, sx * 0.9, 2.55, sz * 0.9, 0.05);
    m.color('#ffc21a'); S.rbox(m, 0, 2.6, -0.15, 1.35, 0.1, 1.7, 0.05);
    m.color('#3a3a40'); S.rbox(m, 0, 1.6, -0.4, 0.6, 0.15, 0.6, 0.06);
    m.color('#5a5a62').shine(2); for (const sx of [0.42, -0.42]) S.rbox(m, sx, H / 2, 1.15, 0.14, H, 0.2, 0.05);
    S.rbox(m, 0, H - 0.1, 1.15, 1.0, 0.16, 0.22, 0.05); m.shine(0);
    m.color('#ff7a1a', 1); m.ball(0, 2.75, -0.2, 0.12); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: -0.4, hx: 0.78, hz: 1.45, y0: 0, y1: 1.6, cover: true }, { t: 'box', x: 0, z: 1.15, hx: 0.55, hz: 0.12, y0: 0, y1: H, walk: false }], lights: [{ x: 0, y: 2.75, z: -0.2, s: 0.8, c: '#ff7a1a', blink: 4 }] };
  }, { yaw });
  const mv = api.mover(m => {
    m.color('#3a3a40').shine(2); S.rbox(m, 0, 0.45, -0.72, 1.3, 0.9, 0.12, 0.04);
    for (const sx of [0.35, -0.35]) S.rbox(m, sx, 0.04, 0, 0.16, 0.08, 1.5, 0.03);
    m.shine(0); m.color('#a87a4a'); S.rbox(m, 0, 0.17, 0.02, 1.5, 0.18, 1.5, 0.05);
    m.color('#8a5a32'); for (const k of [-0.6, 0, 0.6]) m.box(k, 0.1, 0.02, 0.12, 0.08, 1.48);
    return { cols: [{ t: 'box', x: 0, z: 0.02, hx: 0.8, hz: 0.8, y0: -0.05, y1: 0.27 }] };
  });
  const fx = x + Math.sin(yaw) * 2.05, fz = z + Math.cos(yaw) * 2.05;
  const F = { mv, x: fx, z: fz, yaw, lo, hi, period, phase, y: lo };
  mv.x = fx; mv.z = fz; mv.y = lo; mv.yaw = yaw;
  BURNS_W8.state.forks.push(F);
  return F;
};
BURNS_W8.buildStation = function (api) {
  const S = BurnsW8910Shape;
  // the canopy: a big rounded slab on smooth pillars, flames on the fascia
  api.mesh(0, 0, m => {
    m.color('#2a2228').shine(1); S.rbox(m, 0, 6.6, 0, 36, 1.2, 19, 0.5, { bottom: '#f4ece0', top: '#5a4a4a' }); m.shine(0);
    m.color('#ff5a1a', 0.85); S.rbox(m, 0, 6.6, 9.55, 35, 0.3, 0.12, 0.05); S.rbox(m, 0, 6.6, -9.55, 35, 0.3, 0.12, 0.05); m.emissive(0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { m.color('#e8e0d0').shine(2); S.drum(m, sx * 14, 0, sz * 6.5, 0.48, 6.0, 0.12); m.color('#ff4a1a', 0.7); S.torus(m, sx * 14, 2.2, sz * 6.5, 0.55, 0.06); m.emissive(0).shine(0); }
    for (let i = 0; i < 14; i++) { const x = -15 + i * 2.3; m.color('#fff4d8', 1); m.box(x, 5.95, 0, 1.2, 0.06, 0.4); } m.emissive(0);
    const reg = BURNS_ATLAS.sign('HELL STATION', { bg: '#1a0606', fg: '#ffd060', glow: '#ff4a1a', size: 72, border: '#ff4a1a', pad: 20 });
    m.color('#ffffff', 0.9); m.decal(0, 6.6, 9.65, 14, 14 / reg.aspect, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 6.6, 9.65, 14, 14 / reg.aspect, reg); m.pop(); m.emissive(0);
    // flame licks on the fascia corners
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { m.color('#ff7a1a', 0.9); m.push(); m.tf(sx * 15.5, 7.2, sz * 9.6, 0); m.lathe([[0, 0], [0.45, 0.2], [0.35, 0.9], [0.12, 1.6], [0, 1.9]], { seg: 10 }); m.pop(); m.color('#ffd84a', 1); m.push(); m.tf(sx * 15.5, 7.25, sz * 9.6 + sz * 0.1); m.lathe([[0, 0], [0.25, 0.15], [0.18, 0.7], [0, 1.1]], { seg: 8 }); m.pop(); } m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 18, hz: 9.5, y0: 6.0, y1: 7.2 }, ...[[-14, -6.5], [14, -6.5], [-14, 6.5], [14, 6.5]].map(([x, z]) => ({ t: 'cyl', x, z, r: 0.5, y0: 0, y1: 6.0 }))], lights: [{ x: 0, y: 6.0, z: 0, s: 0, c: '#fff0d0', pool: 16 }, { x: -15.5, y: 8, z: 9.6, s: 2, c: '#ff7a1a' }, { x: 15.5, y: 8, z: 9.6, s: 2, c: '#ff7a1a' }, { x: -15.5, y: 8, z: -9.6, s: 2, c: '#ff7a1a' }, { x: 15.5, y: 8, z: -9.6, s: 2, c: '#ff7a1a' }] };
  });
  // pump islands (number painted on each) with two pumps each
  [-10.5, -3.5, 3.5, 10.5].forEach((ix, n) => {
    api.mesh(ix, 0, m => {
      m.color('#d8d0c4').shine(1); S.rbox(m, 0, 0.12, 0, 1.6, 0.24, 6.2, 0.1); m.color('#ffd21a'); S.rbox(m, 0, 0.26, 2.95, 1.62, 0.06, 0.3, 0.03); S.rbox(m, 0, 0.26, -2.95, 1.62, 0.06, 0.3, 0.03);
      for (const pz of [-1.6, 1.6]) {
        m.color(n === 2 ? '#c8202a' : '#e8e4dc').shine(2); S.rbox(m, 0, 1.15, pz, 0.85, 1.8, 0.7, 0.16); m.color('#2a2a30'); S.rbox(m, 0, 2.15, pz, 0.95, 0.2, 0.8, 0.08);
        m.color(n === 2 ? '#38f2ff' : '#7aff5a', 0.9); S.rbox(m, 0.44, 1.5, pz, 0.04, 0.42, 0.5, 0.02); S.rbox(m, -0.44, 1.5, pz, 0.04, 0.42, 0.5, 0.02); m.emissive(0);
        m.color('#1a1a1e'); S.pill(m, 0.45, 1.0, pz + 0.2, 0.55, 0.35, pz + 0.55, 0.05); S.pill(m, 0.55, 0.35, pz + 0.55, 0.5, 0.9, pz + 0.75, 0.05);
        m.color('#2a2a30').shine(3); S.rbox(m, 0.47, 0.95, pz + 0.3, 0.12, 0.3, 0.12, 0.04); m.shine(0);
      }
      const reg = BURNS_ATLAS.sign(String(n + 1), { bg: '#ffd21a', fg: '#1a1a1e', size: 64, round: 18, pad: 14 });
      m.color('#ffffff', 0.3); m.decal(0, 2.7, 0, 0.6, 0.6, reg, { both: true }); m.emissive(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 3.1, y0: 0, y1: 0.25 }, { t: 'box', x: 0, z: -1.6, hx: 0.45, hz: 0.38, y0: 0, y1: 2.25, cover: true }, { t: 'box', x: 0, z: 1.6, hx: 0.45, hz: 0.38, y0: 0, y1: 2.25, cover: true }] };
    }, { yaw: 0 });
  });
  // price board out front
  api.sign('TODAY\'S PRICES\nDIESEL ........ 1 HUG\nGAS ........ 2 HUGS\nART CARS .. YOUR SOUL', 20, 14, { yaw: -0.5, h: 2.6, y: 2.4, style: { bg: '#1a1210', fg: '#ffe0a0', glow: '#ff8a2a', size: 40, border: '#ff8a2a' }, glow: '#ff8a2a' });
  api.sign('NO SMOKING\nNO FIRE\nNO FUN', -19.5, 9, { yaw: Math.PI / 2 + 0.3, h: 1.6, style: { bg: '#c8202a', fg: '#ffffff', size: 44, border: '#ffffff' } });
  api.sign('PUMP 4 IS\nHAUNTED', 13.6, -4.5, { yaw: -Math.PI / 2, h: 0.9, y: 1.2, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 34 } });
  // the fuel gauge post at pump 3
  api.mesh(BURNS_W8.PUMP3.x - 1.2, -3.6, m => { m.color('#2a2a30').shine(2); S.rbox(m, 0, 2.2, 0, 0.5, 4.4, 0.5, 0.15); m.shine(0); m.color('#ffd21a'); S.rbox(m, 0, 4.55, 0, 0.9, 0.5, 0.6, 0.15); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 4.8 }] }; });
  api.glowRing(0, 0, 13, 16); api.glowLine(-7, 9, -7, -9, 6); api.glowLine(0, 9, 0, -9, 6);
  api.light(0, 0, 22, '#fff0d0', 0.35);
};
BURNS_W8.buildOffice = function (api) {
  const S = BurnsW8910Shape, x = 32.5, z = 34;
  api.mesh(x, z, m => {
    // modular office trailer on blocks, window facing west (-X)
    m.color('#e8e0cc').shine(1); S.rbox(m, 0, 2.0, 0, 3.4, 2.9, 11, 0.3, { top: '#d8d0bc' }); m.shine(0);
    m.color('#8a7a68'); for (const zz of [-4, 0, 4]) S.rbox(m, 0, 0.28, zz, 3.0, 0.56, 0.7, 0.1);
    m.color('#ff8a1a'); S.rbox(m, -1.72, 1.2, 0, 0.06, 0.25, 10.6, 0.03);
    m.color('#1a2232', 0.15).shine(3); S.rbox(m, -1.7, 2.3, 0, 0.08, 1.2, 2.6, 0.05); m.emissive(0).shine(0);
    m.color('#c8b8a0'); S.rbox(m, -2.0, 1.55, 0, 0.6, 0.12, 2.8, 0.04);
    m.color('#5a4a3a'); S.rbox(m, -1.72, 1.85, -3.6, 0.06, 2.0, 1.0, 0.04);
    m.color('#5a5a62').shine(2); S.drum(m, 1.0, 3.45, 3.0, 0.5, 0.6, 0.15); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.7, hz: 5.5, y0: 0, y1: 3.45, cover: true }, { t: 'box', x: -2.0, z: 0, hx: 0.3, hz: 1.4, y0: 0, y1: 1.6 }], lights: [{ x: -2.2, y: 2.3, z: 0, s: 1.4, c: '#ffe8b0' }] };
  });
  api.sign('DPW PERMITS', x - 1.9, z, { y: 3.55, h: 0.9, post: false, yaw: -Math.PI / 2, style: { bg: '#ff8a1a', fg: '#1a1008', size: 56, border: '#1a1008' } });
  api.sign('WINDOW OPEN\n11:58 – 12:02\n(SOME DAYS)', x - 3.0, z - 3.4, { yaw: -Math.PI / 2, h: 1.3, style: { bg: '#f4e8c8', fg: '#2a1a10', size: 34 } });
  api.sign('NOW SERVING: 3\nYOUR NUMBER: 9,412', x - 3.0, z + 3.6, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#1a1a22', fg: '#ff4a4a', glow: '#ff2a2a', size: 36, border: '#ff4a4a' }, glow: '#ff2a2a' });
  api.npc({ id: 'dot', name: 'DOT, PERMITS', spec: burnsW8Spec(41, { face: 'stern', hat: { kind: 'cap', col: '#ff8a1a' }, glasses: 'clear', prop: 'clipboard', hair: { style: 'bun', col: '#9a9aa2', hi: '#d8d8e0' }, body: { h: 0.95, w: 1.1 } }), x: x - 1.25, z, y: 0.35, fixedY: true, yaw: -Math.PI / 2, anim: 'clipboard',
    talk(g2, a) { BURNS_W8.dotTalk(g2, a); } });
  api.npc({ id: 'hank', name: 'HANK, FUEL MARSHAL', spec: burnsW8Spec(42, { face: 'beard', hat: { kind: 'hardhat', col: '#ffd21a' }, prop: 'radio' }), x: -7.5, z: 101, yaw: Math.PI / 2,
    talk(g2, a) { BURNS_W8.hankTalk(g2, a); } });
  api.prop('chair', { x: -8.6, z: 103, yaw: 1.2, col: '#ff8a1a' });
  api.pickup('water', x - 3.5, 0.9, z + 6);
};
BURNS_W8.buildCanyon = function (api) {
  const W8 = BURNS_W8, C = (x, z, yaw, lvl, col, lab) => W8.container(api, x, z, yaw, lvl * 2.6, col, { label: lab });
  const cols = ['#c8402a', '#2a6ac8', '#3a8a5a', '#c88a1a', '#6a4a8a', '#8a8a92', '#c86a2a'];
  // S1: two high (top 5.2) — F1 lifts you from the ground
  C(66, -12, Math.PI / 2, 0, '#c8402a', 'HELL\nFREIGHT'); C(66, -12, Math.PI / 2, 1, '#2a6ac8');
  W8.forklift(api, 64, -7.9, Math.PI, 0.15, 5.0, 6.0, 0);
  // S2 + S3: four high (top 10.4) — F2 lifts you from S1, then jump the gap
  for (let l = 0; l < 4; l++) { C(74, -16.6, Math.PI / 2, l, cols[(l + 2) % 7]); C(88.3, -16.6, Math.PI / 2, l, cols[(l + 4) % 7]); }
  W8.forklift(api, 74, -11.35, Math.PI, 5.25, 10.5, 6.5, 2.0, 11.7);
  api.sign('CONTAINER CANYON\nFORKLIFTS ARE NOT RIDES', 58, -4, { yaw: 0.6, h: 1.3, style: { bg: '#ffd21a', fg: '#1a1008', size: 38, border: '#1a1008' } });
  // the form, the photo and rewards up top
  api.pickup('item:form', 79, 11.3, -16.6, { mission: 'permit', gate: true, label: 'FORM 27-B/6', icon: 'map', id: 'form', persist: false });
  api.pickup('photo', 93.5, 11.4, -16.6, { id: 'p1' });
  api.glowLine(68, -16.6, 79, -16.6, 7, 11.3); api.glowArc(81.0, 10.9, -16.6, 83.6, 10.9, -16.6, 1.6, 4); api.glowLine(85, -16.6, 92, -16.6, 5, 11.3);
  api.glowLine(61, -12, 70, -12, 6, 6.1); api.glowLine(64, -10, 64, -4, 4, 1.0);
  // more stacks around (scenery + cover)
  const stacks = [[56, -30, 0, 2], [70, -36, Math.PI / 2, 3], [86, -36, Math.PI / 2, 1], [100, -24, 0, 2], [100, -8, 0.05, 1], [52, -44, Math.PI / 2, 1], [82, -50, 0.1, 2], [96, -50, Math.PI / 2, 1]];
  stacks.forEach(([x, z, yaw, n], i) => { for (let l = 0; l < n; l++) C(x, z, yaw, l, cols[(i + l) % 7]); });
  api.pickup('bag:khole', 58, 0.9, -20);
  api.light(70, -14, 18, '#ffe0b0', 0.2);
};
BURNS_W8.buildTanks = function (api) {
  const S = BurnsW8910Shape, T = BURNS_W8.TANK;
  const tank = (x, z, r, h, col, label, band) => {
    api.mesh(x, z, m => {
      m.color(col).shine(2);
      S.lathe(m, 0, 0, 0, [[0, 0], [r, 0], [r, 0], [r, h * 0.92], [r * 0.92, h * 0.98], [r * 0.6, h + r * 0.12], [0, h + r * 0.16]], { seg: 32 });
      m.color(band); S.torus(m, 0, h * 0.25, 0, r + 0.04, 0.12, { seg: 32 }); S.torus(m, 0, h * 0.75, 0, r + 0.04, 0.12, { seg: 32 }); m.shine(0);
      const reg = BURNS_ATLAS.sign(label, { bg: null, fg: '#1a1210', size: 72, pad: 6 });
      m.color(col); S.arcDecal(m, 0, h * 0.5, 0, r + 0.03, Math.PI * 0.85, h * 0.18, reg); S.arcDecal(m, 0, h * 0.5, 0, r + 0.03, -Math.PI * 0.15, h * 0.18, reg);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r, y0: 0, y1: h + r * 0.14, cover: true }] };
    });
  };
  tank(T.x, T.z, T.r, T.h, '#f0ece4', 'DIESEL', '#c8202a');
  tank(-44, -8, 5, 10, '#e8e4dc', 'GAS', '#2a6ac8');
  tank(-68, -4, 4.5, 9, '#ffe8c8', '???', '#3a8a5a');
  // pipes + valves between the tanks
  api.mesh(-55, -18, m => {
    m.color('#8a8a92').shine(2);
    S.pill(m, -3, 1.2, -8, 11, 1.2, 10, 0.32); S.pill(m, -3, 1.2, -8, -13, 1.2, 14, 0.3); S.pill(m, 11, 1.2, 10, 20, 1.2, 14, 0.28);
    for (const [x, z] of [[4, 1], [-8, 3], [15, 12]]) { m.color('#c8202a'); m.push(); m.tf(x, 1.95, z, 0, Math.PI / 2, 0); S.torus(m, 0, 0, 0, 0.42, 0.07); m.pop(); m.color('#8a8a92'); S.tube(m, x, 1.2, z, 0.1, 0.1, 0.75); }
    m.shine(0);
    return { cols: [] };
  });
  // the spiral catwalk around the big tank (the hidden climb)
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU * 1.35 + 0.3, rr = T.r + 1.15, y = 0.85 + i * 0.78;
    api.roundBox(T.x + Math.sin(a) * rr, y - 0.22, T.z + Math.cos(a) * rr, 1.9, 0.22, 1.5, '#9a9aa4', { yaw: a, r: 0.08 });
    if (i % 3 === 0) api.glow(T.x + Math.sin(a) * (rr + 0.9), y + 1.0, T.z + Math.cos(a) * (rr + 0.9), 0.5, '#ffd84a');
  }
  api.glowArc(T.x + Math.sin(0.3) * (T.r + 1.2), 1.2, T.z + Math.cos(0.3) * (T.r + 1.2), T.x, T.h + 1.3, T.z, 1.5, 6);
  api.sign('DO NOT CLIMB\nTHE TANK', T.x + 8, T.z + 4, { yaw: 1.1, h: 1.2, style: { bg: '#ffd21a', fg: '#1a1008', size: 44, border: '#1a1008' } });
  api.trigger({ x: T.x, z: T.z, r: 11, once: true, onEnter: g => { if (g.missions.state('climb') === 'available') { g.missions.start('climb'); g.banner('HIDDEN CHALLENGE', 'Hell\'s Highest: climb the diesel tank!', { col: '#7aff5a' }); } } });
  // berm around the farm
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; if (Math.abs(BurnsM.wrap(a - 1.4)) < 0.35) continue; api.sphere(-55 + Math.sin(a) * 24, -0.4, -18 + Math.cos(a) * 24, 2.2, '#b8906c', { squash: 0.45, noCol: true }); }
  api.pickup('bag:bufo', -44, 11.2, -8);
  api.pickup('water', -50, 0.9, 0);
  api.light(-55, -18, 20, '#ffe8c0', 0.2);
};
BURNS_W8.buildGhetto = function (api) {
  const S = BurnsW8910Shape;
  const trailer = (x, z, yaw, col) => api.mesh(x, z, m => {
    m.color(col).shine(2); S.lathe(m, 0, 0.55, 0, [[0, 0], [1.2, 0.05], [1.3, 0.5], [1.32, 2.0], [1.15, 2.55], [0.6, 2.75], [0, 2.78]], { seg: 16, sz: 3.4 }); m.shine(0);
    m.color('#2a2a30'); for (const sx of [1, -1]) S.wheel(m, sx * 1.15, 0.38, 0.6, 0.38, 0.26);
    m.color('#1a2232', 0.1); for (const zz of [-2.2, 1.6]) { S.rbox(m, 1.25, 1.9, zz, 0.06, 0.6, 1.0, 0.05); S.rbox(m, -1.25, 1.9, zz, 0.06, 0.6, 1.0, 0.05); } m.emissive(0);
    m.color('#5a4a3a'); S.rbox(m, -1.3, 1.5, -0.4, 0.06, 1.7, 0.8, 0.05);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.32, hz: 4.3, y0: 0, y1: 3.3, cover: true }] };
  }, { yaw });
  trailer(80, -80, 0.1, '#d8d4cc'); trailer(96, -76, -0.3, '#c8c0b0'); trailer(110, -70, 0.2, '#e4d8c0');
  api.sign('DPW CAMP\nRESIDENTS ONLY\n(EST. FOREVER)', 74, -70, { yaw: 0.9, h: 1.5, style: { bg: '#3a2a1a', fg: '#ffb060', size: 38, border: '#ffb060' } });
  api.prop('shade', { x: 90, z: -92, w: 9, d: 7, col: '#8a7a6a' });
  api.prop('couch', { x: 88, z: -94, yaw: 0, col: '#5a4a3a' }); api.prop('couch', { x: 92.5, z: -91, yaw: -Math.PI / 2, col: '#6a3a2a' });
  api.prop('barrel', { x: 90, z: -88.5 }); api.prop('barrel', { x: 104, z: -98 });
  // the DPW bar (plywood + attitude)
  api.mesh(102, -94, m => { m.color('#8a6a4a'); S.rbox(m, 0, 0.55, 0, 4, 1.1, 1.0, 0.08); m.color('#6a4a2a'); S.rbox(m, 0, 1.15, 0, 4.2, 0.1, 1.2, 0.04); m.color('#e8e8f0').shine(3); for (let i = 0; i < 5; i++) S.drum(m, -1.6 + i * 0.75, 1.2, 0, 0.11, 0.35, 0.03); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2, hz: 0.5, y0: 0, y1: 1.2 }] }; });
  api.sign('THE DUSTY LUNG\nDPW ONLY\nNO SPARKLE PONIES', 102, -96.5, { y: 1.6, h: 1.3, post: false, style: { bg: '#1a1008', fg: '#ff9a4a', glow: '#ff6a1a', size: 38, border: '#ff6a1a' }, glow: '#ff6a1a' });
  api.pickup('bag:liquor', 98.5, 1.75, -94);
  // the shower trailer: out of order since July (a photo is inside)
  api.mesh(114, -92, m => {
    m.color('#7aa8c8').shine(2); S.rbox(m, 0, 1.6, 0, 3.0, 3.2, 5.2, 0.4); m.shine(0);
    m.color('#2a3a4a'); S.rbox(m, -1.48, 1.3, 0, 0.08, 2.2, 1.2, 0.05);
    m.color('#e8e8f0'); S.rbox(m, 0.6, 2.4, 1.0, 0.8, 0.12, 0.8, 0.05); S.pill(m, 0.6, 2.4, 1.0, 0.6, 3.0, 1.0, 0.04);
    return { cols: [{ t: 'box', x: 0.3, z: 2.4, hx: 1.5, hz: 0.2, y0: 0, y1: 3.2, cover: true }, { t: 'box', x: 0.3, z: -2.4, hx: 1.5, hz: 0.2, y0: 0, y1: 3.2, cover: true }, { t: 'box', x: 1.35, z: 0, hx: 0.15, hz: 2.6, y0: 0, y1: 3.2, cover: true }, { t: 'box', x: 0, z: 0, hx: 1.5, hz: 2.6, y0: 3.0, y1: 3.2 }, { t: 'box', x: -1.35, z: 1.6, hx: 0.15, hz: 1.0, y0: 0, y1: 3.2 }, { t: 'box', x: -1.35, z: -1.6, hx: 0.15, hz: 1.0, y0: 0, y1: 3.2 }] };
  });
  api.sign('SHOWERS\nOUT OF ORDER\nSINCE JULY', 111.2, -89, { yaw: -Math.PI / 2 - 0.4, h: 1.3, style: { bg: '#f4e8c8', fg: '#2a1a10', size: 36, border: '#2a1a10' } });
  api.pickup('photo', 114.6, 1.0, -92, { id: 'p2' });
  api.mud(108, -86, 2.6); api.mud(118, -84, 2.0); api.mud(112, -100, 2.2);
  // Stamp sleeps in a hammock
  api.mesh(84, -101, m => { m.color('#6a5a4a'); for (const sx of [-1.8, 1.8]) S.pill(m, sx, 0, 0, sx, 1.9, 0, 0.08); m.color('#c8402a'); m.push(); m.tf(0, 1.0, 0); m.ellipsoid(0, 0, 0, 1.6, 0.35, 0.55, { phi0: Math.PI / 2 }); m.pop(); return { cols: [] }; });
  api.npc({ id: 'stamp', name: 'STAMP', spec: burnsW8Spec(43, { face: 'sleepy', hat: { kind: 'cap', col: '#c8402a' }, body: { h: 1.0, w: 1.3 } }), x: 84, z: -101, y: 0.85, fixedY: true, yaw: Math.PI / 2, behavior: 'sleep', chatter: false,
    marker: (g2) => BURNS_W8.stampMarker(g2), onWake(g2, a) { BURNS_W8.stampTalk(g2, a); }, talk(g2, a) { BURNS_W8.stampTalk(g2, a); } });
  api.npc({ id: 'pickles', name: 'PICKLES (DPW)', spec: burnsW8Spec(44, { face: 'goofy', hat: { kind: 'bandana', col: '#7aff5a' } }), x: 92, z: -85, yaw: 2.6,
    lines: ['Hey! I\'m Pickles. I\'m the nice one. Every crew has one. It\'s a union thing.', 'I showered once. In 2019. It was a mistake. My dust layer is load-bearing now.', 'Rusty\'s not mad at you. He\'s mad at FUN. Here, hydrate.'], gift: { kind: 'water' } });
  api.pickup('bag:weed', 96, 0.9, -72);
  api.checkpoint('cp_camp', 86, -72, { yaw: Math.PI, name: 'DPW Camp' });
  api.glowRing(90, -92, 6, 10); api.glowLine(80, -70, 80, -50, 6);
  api.light(90, -92, 14, '#ffb070', 0.35);
};
BURNS_W8.buildBoneyard = function (api) {
  const S = BurnsW8910Shape;
  // a huge rusty teapot (retired art)
  api.mesh(-78, -98, m => {
    m.color('#8a4a2a').shine(1); S.lathe(m, 0, 0, 0, [[0, 0], [2.6, 0], [3.4, 1.2], [3.6, 2.8], [3.0, 4.2], [1.4, 4.8], [1.0, 5.1], [0.5, 5.6], [0, 5.7]], { seg: 22 });
    S.pill(m, 3.2, 1.8, 0, 5.6, 4.6, 0, 0.45, 0.25); m.push(); m.tf(-3.3, 2.8, 0, Math.PI / 2, 0, 0); S.torus(m, 0, 0, 0, 1.2, 0.28); m.pop();
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.3, y0: 0, y1: 4.6, cover: true }] };
  });
  api.sign('THE BONEYARD\nWHERE ART GOES\nTO RUST', -66, -84, { yaw: 0.7, h: 1.4, style: { bg: '#3a2a1a', fg: '#f4c890', size: 38, border: '#f4c890' } });
  // a one-legged metal flamingo
  api.mesh(-90, -82, m => {
    m.color('#e8708a').shine(2); S.ball(m, 0, 4.2, 0, 1.4, { sx: 1.0, squash: 0.75, sz: 1.6 }); S.pill(m, 0, 4.8, 1.2, 0, 7.0, 2.0, 0.32, 0.26); S.ball(m, 0, 7.2, 2.2, 0.5);
    m.color('#2a1a1a'); S.pill(m, 0, 7.1, 2.6, 0, 6.5, 3.2, 0.14, 0.05); m.color('#c86a7a'); S.pill(m, 0, 0, 0, 0, 3.3, 0, 0.12); m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 3.4 }, { t: 'cyl', x: 0, z: 0.4, r: 1.5, y0: 3.2, y1: 5.2 }] };
  });
  // a dead disco ball, half sunk in the dust
  api.mesh(-60, -112, m => { m.color('#b8c0d0').shine(3); m.ball(0, 1.6, 0, 3.0, { colFn: (x, y, z) => ((Math.floor(Math.atan2(x, z) * 4) + Math.floor(y * 1.6)) % 2 ? '#d8e0f0' : '#8a92a4') }); m.shine(0); return { cols: [{ t: 'dome', x: 0, z: 0, r: 3.0, y0: 0, cover: true }] }; });
  // an old loader (cover)
  api.mesh(-96, -110, m => { m.color('#c8a01a').shine(1); S.rbox(m, 0, 1.4, 0, 2.8, 1.6, 5, 0.3); S.rbox(m, 0, 2.8, -1.2, 2.2, 1.4, 2.0, 0.25); m.color('#5a5a62'); S.rbox(m, 0, 0.9, 3.2, 3.2, 1.2, 0.6, 0.2); for (const [x, z] of [[1.5, 1.6], [-1.5, 1.6], [1.5, -1.6], [-1.5, -1.6]]) S.wheel(m, x, 0.85, z, 0.85, 0.6); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 3.0, y0: 0, y1: 3.5, cover: true }] }; }, { yaw: 0.6 });
  api.pickup('bag:shrooms', -84, 0.9, -104);
  api.glowArc(-74, 1, -86, -84, 1, -96, 2.2, 6);
  api.light(-78, -98, 14, '#ffc890', 0.2);
};
BURNS_W8.buildYard = function (api, g) {
  const W8 = BURNS_W8, Y = W8.YARD, S = BurnsW8910Shape;
  const cols = ['#c8402a', '#2a6ac8', '#3a8a5a', '#c88a1a', '#6a4a8a', '#8a8a92'];
  // a ring of double-stacked containers with a gate gap at the south
  const N = 18, Rr = Y.r + 3.6;
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) / N * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.22) continue; // the gate (south = +z)
    const x = Y.x + Math.sin(a) * Rr, z = Y.z + Math.cos(a) * Rr;
    for (let l = 0; l < 2; l++) W8.container(api, x, z, a + Math.PI / 2, l * 2.6, cols[(i + l) % 6]);
  }
  api.sign('DPW YARD\nAUTHORIZED PERSONNEL ONLY\nNO SPARKLE PONIES', Y.x - 6.5, W8.GATE.z + 1, { yaw: 0.15, h: 1.6, style: { bg: '#ffd21a', fg: '#1a1008', size: 38, border: '#1a1008' } });
  W8.state.gate = api.collider({ t: 'box', x: Y.x, z: W8.GATE.z - 0.5, hx: 6.5, hz: 0.4, y0: 0, y1: 5.2, walk: false, off: true });
  W8.state.gateMv = api.mover(m => { m.color('#ffd21a'); S.rbox(m, 0, 1.2, 0, 13, 0.3, 0.3, 0.1); m.color('#1a1008'); for (let k = -6; k <= 6; k += 1.6) m.box(k, 1.2, 0, 0.7, 0.32, 0.32); m.color('#5a5a62'); S.rbox(m, 0, 0.6, 0, 13, 0.12, 0.12, 0.05); return { cols: [] }; });
  W8.state.gateMv.x = Y.x; W8.state.gateMv.z = W8.GATE.z - 0.5; W8.state.gateMv.y = -3;
  // rebar piles + pallets near the edge (not in the ram lanes)
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5, x = Y.x + Math.sin(a) * (Y.r - 3), z = Y.z + Math.cos(a) * (Y.r - 3); api.roundBox(x, 0, z, 1.6, 0.6, 1.6, '#a87a4a', { r: 0.08, yaw: a }); for (let k = 0; k < 5; k++) api.box(x + (k - 2) * 0.25, 0.6, z, 0.06, 0.06, 3.2, '#8a3a2a', { yaw: a, noCol: true }); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.light(Y.x + Math.sin(a) * Y.r * 0.8, Y.z + Math.cos(a) * Y.r * 0.8, 9, '#ffb070', 0.25); }
  api.prop('lightTower', { x: Y.x - 20, z: Y.z + 18, yaw: 2.4, aim: 0 }); api.prop('lightTower', { x: Y.x + 20, z: Y.z - 18, yaw: -0.8, aim: 0 });
  api.checkpoint('cp_yard', Y.x + 8, W8.GATE.z + 8, { yaw: Math.PI, name: 'DPW Yard Gate' });
  api.pickup('water', Y.x - 4, 0.9, W8.GATE.z + 6); api.pickup('water', Y.x + 14, 0.9, Y.z + 10); api.pickup('water', Y.x - 14, 0.9, Y.z - 10);
  api.glowRing(Y.x, Y.z, Y.r - 6, 18);
  // pallets Rusty can throw (mover pool)
  W8.state.pallets = [0, 1, 2].map(() => {
    const mv = api.mover(m => { m.color('#a87a4a'); S.rbox(m, 0, 0.1, 0, 1.6, 0.2, 1.6, 0.05); m.color('#5ad0ff', 0.2).shine(3); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) S.drum(m, x, 0.2, z, 0.34, 0.9, 0.1); m.emissive(0).shine(0); m.color('#ffffff'); S.rbox(m, 0, 0.75, 0.75, 1.2, 0.3, 0.04, 0.02); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.85, hz: 0.85, y0: 0, y1: 1.1 }] }; });
    mv.visible = false; mv.noCollide = true; return mv;
  });
  W8.telehandler(api);
  // Foreman Rusty
  const rusty = api.enemy({ id: 'rusty', name: 'FOREMAN RUSTY', spec: burnsW8Spec(45, { face: 'grumpy', hat: { kind: 'hardhat', col: '#f4f0e8' }, glasses: 'shades', goggles: false, body: { h: 1.08, w: 1.45 }, hair: { style: 'long', col: '#c8a080', hi: '#e8d0b0' }, prop: 'radio' }),
    x: Y.x, z: Y.z - 10, y: 1.3, fixedY: true, behavior: 'w8Rusty', hp: 4, boss: true, drop: 8, keepBehavior: true, chatter: false, collide: false,
    defeatLine: 'FINE! FINE. You can have your stupid gas.' });
  W8.state.rustyDef = rusty;
  api.trigger({ x: W8.GATE.x, z: W8.GATE.z - 3, r: 7, when: g2 => g2.missions.state('boss') === 'available' && !BURNS_W8.state.bossStarted, onEnter: g2 => BURNS_W8.bossIntro(g2) });
};
// the telehandler: body + boom movers (Rusty sits in the cab)
BURNS_W8.telehandler = function (api) {
  const S = BurnsW8910Shape, Y = BURNS_W8.YARD;
  const body = api.mover(m => {
    m.color('#e89a1a').shine(2); S.rbox(m, 0, 1.15, 0.2, 2.6, 1.1, 5.4, 0.35, { top: '#f0aa2a' });
    m.color('#2a2a30'); S.rbox(m, 0, 1.1, -2.4, 2.4, 1.3, 1.1, 0.3);
    m.color('#1a1a1e'); S.rbox(m, 0, 1.15, 0.2, 2.64, 0.18, 5.42, 0.08);
    for (const [x, z] of [[1.42, 1.85], [-1.42, 1.85], [1.42, -1.6], [-1.42, -1.6]]) S.wheel(m, x, 0.88, z, 0.88, 0.62, { hub: '#e89a1a' });
    // open roll-cage cab on the left
    m.color('#3a3a40').shine(2); for (const [x, z] of [[-1.25, 1.2], [-0.15, 1.2], [-1.25, -0.4], [-0.15, -0.4]]) S.pill(m, x, 1.7, z, x, 3.05, z, 0.07);
    m.color('#e89a1a'); S.rbox(m, -0.7, 3.12, 0.4, 1.4, 0.16, 1.9, 0.07); m.shine(0);
    m.color('#2a1a1e'); S.rbox(m, -0.7, 1.95, 0.25, 0.75, 0.45, 0.7, 0.12); S.rbox(m, -0.7, 2.45, -0.05, 0.75, 0.8, 0.16, 0.07);
    m.color('#ff3a1a', 1); m.ball(-0.7, 3.32, 0.4, 0.16); m.emissive(0);
    m.color('#1a1a1e'); S.tube(m, 0.85, 1.7, -2.4, 0.12, 0.1, 1.4);
    const reg = BURNS_ATLAS.sign('DPW', { bg: null, fg: '#1a1008', size: 64, pad: 6 });
    m.color('#e89a1a'); m.push(); m.tf(1.31, 1.25, 0.6, Math.PI / 2); m.decal(0, 0, 0, 1.5, 1.5 / reg.aspect, reg); m.pop(); m.push(); m.tf(-1.31, 1.25, 1.2, -Math.PI / 2); m.decal(0, 0, 0, 1.5, 1.5 / reg.aspect, reg); m.pop();
    return { cols: [{ t: 'box', x: 0.55, z: 0.2, hx: 0.75, hz: 2.7, y0: 0, y1: 1.72 }, { t: 'box', x: -0.7, z: 1.9, hx: 0.6, hz: 0.6, y0: 0, y1: 1.72 }, { t: 'box', x: -0.7, z: -1.55, hx: 0.6, hz: 1.3, y0: 0, y1: 1.72 }, { t: 'box', x: -0.7, z: 0.4, hx: 0.75, hz: 1.0, y0: 3.05, y1: 3.2 }], lights: [{ x: -0.7, y: 3.35, z: 0.4, s: 1.2, c: '#ff3a1a', blink: 6 }, { x: 0.9, y: 1.4, z: 2.95, s: 1.0, c: '#fff0c8', beam: 0 }, { x: -0.9, y: 1.4, z: 2.95, s: 1.0, c: '#fff0c8', beam: 0 }] };
  });
  const boom = api.mover(m => {
    m.color('#e89a1a').shine(2); S.rbox(m, 0, 0, 3.4, 0.62, 0.62, 7.2, 0.18); S.rbox(m, 0, 0, 6.2, 0.5, 0.5, 2.6, 0.14);
    m.color('#d8d8e0').shine(3); S.pill(m, 0, -0.5, 0.6, 0, -0.35, 3.6, 0.13); m.shine(2);
    m.color('#3a3a40'); S.rbox(m, 0, -0.2, 7.55, 1.5, 1.0, 0.18, 0.05); for (const sx of [0.45, -0.45]) S.rbox(m, sx, -0.68, 8.2, 0.14, 0.08, 1.4, 0.03);
    m.shine(0);
    return { cols: [] };
  });
  boom.noCollide = true;
  const T = { body, boom, x: Y.x, z: Y.z - 10, yaw: 0, speed: 0, pitch: 0.32, shake: 0 };
  BURNS_W8.state.tele = T;
  BURNS_W8.teleSync(null);
  return T;
};
BURNS_W8.teleSync = function (g) {
  const T = BURNS_W8.state.tele; if (!T) return;
  const c = Math.cos(T.yaw), s = Math.sin(T.yaw), sh = T.shake ? (Math.random() - 0.5) * T.shake : 0;
  T.body.x = T.x + sh; T.body.z = T.z; T.body.y = 0; T.body.yaw = T.yaw; T.body.roll = sh * 0.3;
  const px = 0.75, pz = -1.9, py = 2.0;
  T.boom.x = T.x + px * c + pz * s + sh; T.boom.z = T.z - px * s + pz * c; T.boom.y = py; T.boom.yaw = T.yaw; T.boom.pitch = T.pitch;
};
// world point of the boom tip
BURNS_W8.boomTip = function () {
  const T = BURNS_W8.state.tele, b = T.boom, L = 8.2, cp = Math.cos(b.pitch), sp = Math.sin(b.pitch);
  const ly = -L * sp - 0.6 * cp, lz = L * cp - 0.6 * sp;
  return [b.x + Math.sin(b.yaw) * lz, b.y + ly, b.z + Math.cos(b.yaw) * lz];
};

/* ---------------- per-step world logic ---------------- */
BURNS_W8.update = function (g, dt) {
  const S = BURNS_W8.state, t = g.time;
  // forklift carriages: rest low, rise, rest high, lower
  for (const F of S.forks) {
    const u = ((t + F.phase) % F.period) / F.period;
    const k = u < 0.22 ? 0 : u < 0.5 ? BurnsM.smoothstep(0.22, 0.5, u) : u < 0.72 ? 1 : 1 - BurnsM.smoothstep(0.72, 1, u);
    F.mv.y = lerp(F.lo, F.hi, k);
  }
  // the yard gate
  if (S.gateMv) S.gateMv.y = BurnsM.damp(S.gateMv.y, S.gateOn ? 0 : -3, 3, dt);
  // fuel display + El Pulpo speed
  const car = S.pulpo.car;
  car.maxSpeed = S.pulpo.fuel >= 0.99 ? 9 : 3.2;
  if (S.pulpo.fuel < 0.99 && car.rider && Math.random() < dt * 0.6) g.fx.smoke(car.x, car.y + 2, car.z, 2, '#3a3438');
  // the permit marker follows the current step
  const pm = g.missions.get('permit');
  if (pm && pm.state === 'active') { const step = BurnsSave.flag(8, 'permitStep') || 1; pm.def.marker = step === 1 ? { x: 74, z: -16 } : step === 2 || step === 4 ? { x: 84, z: -101 } : step === 3 ? { x: -30, z: 60 } : { x: 29, z: 34 }; }
};
BURNS_W8.drawSprites = function (g, R) {
  const S = BURNS_W8.state, SP = BURNS_SPRITES.R;
  // fuel gauge on pump 3's post
  if (g.missions.state('fillup') === 'active' || S.fueling) {
    const n = 12, k = S.pulpo.fuel, x = BURNS_W8.PUMP3.x - 1.2, z = -3.6 + 0.3;
    for (let i = 0; i < n; i++) { const on = i / n < k, c = on ? (i < n * 0.4 ? [1, 0.35, 0.2] : i < n * 0.75 ? [1, 0.85, 0.2] : [0.4, 1, 0.4]) : [0.25, 0.22, 0.25]; R.bbs.bb(x, 0.6 + i * 0.32, z, 0.5, 0.26, SP.square, c, on ? 1 : 0.5, false); if (on) R.bbs.bb(x, 0.6 + i * 0.32, z, 0.9, 0.5, SP.glow, c, 0.5, true); }
  }
  // rebar for the swingers
  for (const a of g.actors) {
    if (a.behName !== 'w8Rebar' || a.hidden || a.defeated) continue;
    const h = a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.28, 0), sw = a.data.mode === 'swing' ? g.time * 30 : a.data.mode === 'wind' ? 0.6 : -0.5;
    const dx = Math.sin(a.yaw + sw), dz = Math.cos(a.yaw + sw);
    R.bbs.streak(h[0] + dx * 0.9, h[1] + 0.2, h[2] + dz * 0.9, dx, 0.3, dz, 2.0, 0.12, SP.streak, [0.75, 0.32, 0.18], 1);
    if (a.data.mode === 'wind') R.flat.flat(a.x, a.y + 0.06, a.z, 6.8, 6.8, g.time * 3, SP.warn, [1, 0.4, 0.2], 0.4 + 0.3 * Math.sin(g.time * 18), true);
  }
  // warning ring under the boom slam
  if (S.slamMark) R.flat.flat(S.slamMark[0], 0.07, S.slamMark[2], 5.6, 5.6, g.time * 3, SP.warn, [1, 0.25, 0.15], 0.5 + 0.4 * Math.abs(Math.sin(g.time * 14)), true);
  // the nozzle in Skids' hands
  const sk = g.actor('skids'); if (sk && !sk.defeated && !sk.hidden) { const h = sk.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.3, 0); R.bbs.bb(h[0], h[1], h[2], 1.2, 1.2, SP.glow, [0.3, 0.9, 1], 0.8, true); }
};

/* ---------------- intro ---------------- */
BURNS_W8.intro = function (g) {
  const S = BURNS_W8.state, p = g.player, car = S.pulpo.car, C = BURNS_W8.CAR;
  p.teleport(C.x - 3, 0, C.z + 1.5, Math.PI - 0.3); p.locked = true;
  g.cutscene([
    { music: 'burns_intro' },
    { cam: { x: -26, y: 20, z: 60, tx: 0, ty: 4, tz: -10, fov: 0.85 } },
    { banner: ['WORLD 8', 'HELL STATION · THE PLAYA\'S ONLY PUMP', { col: '#ff5a2a', big: true, dur: 3 }] },
    { cam: { from: { x: -26, y: 20, z: 60, tx: 0, ty: 4, tz: -10, fov: 0.85 }, to: { x: 16, y: 5, z: 140, tx: C.x, ty: 3, tz: C.z, fov: 0.85 }, dur: 4 } },
    { do: g2 => { g2.fx.smoke(car.x, 7.5, car.z - 1.6, 8, '#3a3438'); burnsSfx('artcarHorn', { pitch: 0.6, vol: 0.6 }); g2.shake(0.2); } },
    { say: ['brady', ['Come on, Pulpo. Don\'t do this to me. Not in a hundred and four degrees.']] },
    { do: g2 => { g2.fx.smoke(car.x, 7.5, car.z - 1.6, 12, '#2a2428'); burnsSfx('bump', { pitch: 0.5 }); } },
    { say: [g.actor('gail'), ['That cough? That\'s an empty tank, hon. Your octopus needs gas.', 'Only pump on the playa is Hell Station. Run by DPW.']] },
    { say: ['brady', ['How bad can it be?']] },
    { say: [g.actor('gail'), ['*laughs for eleven seconds*']] },
    { do: g2 => { BurnsSave.flag(8, 'intro', true); S.introDone = true; p.locked = false; p.teleport(BURNS_W8.SPAWN.x, 0, BURNS_W8.SPAWN.z, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; burnsMusic('burns_w8'); } },
    { banner: ['RUNNING ON FUMES', 'Drive El Pulpo (ACTION near the seat) to the end of the fuel line.', { col: '#ffd84a' }] }
  ], null);
};

/* ---------------- story beats ---------------- */
BURNS_W8.lineArrive = function (g) {
  const p = g.player, car = BURNS_W8.state.pulpo.car;
  BurnsW8910.timer(g, 0.6, g2 => {
    if (p.vehicle) p.vehicle.dismount(p);
    g2.cutscene([
      { cam: { x: -2, y: 3.4, z: 108, tx: -8, ty: 1.8, tz: 100, fov: 0.85 } },
      { say: [g2.actor('hank'), ['Whoa whoa WHOA. Is that an art car? In MY fuel line?', 'No permit, no petrol. Permit window\'s at the DPW trailer. East side.', 'Good luck. Dot\'s been on her lunch break since the Clinton administration.']] },
      { say: ['brady', ['A permit. For gas. On the playa.']] },
      { say: [g2.actor('hank'), ['Welcome to Hell Station, sparkle pony.']] },
      { do: g3 => { car.syncMover(); } }
    ], null);
  });
};
BURNS_W8.permitStep = function (g, step) {
  BurnsSave.flag(8, 'permitStep', step);
  const m = g.missions.get('permit');
  const shorts = { 1: 'Find Form 27-B/6 on the containers', 2: 'Get the form stamped by Stamp (DPW camp)', 3: 'Get Stamp a coffee from Hell\'s Kitchen', 4: 'Bring the coffee to Stamp', 5: 'Return the stamped form to Dot' };
  if (m) m.def.short = shorts[step] || m.def.short;
  if (step === 2) { g.toast('GOT FORM 27-B/6! NOW GET IT STAMPED.'); burnsSfx('pick'); }
};
BURNS_W8.dotTalk = function (g, a) {
  const st = g.missions.state('permit'), step = BurnsSave.flag(8, 'permitStep') || 0;
  if (st === 'locked') { g.say(a, ['Window\'s closed. Window\'s always closed. Get in the fuel line first, then we\'ll talk. Maybe.']); return; }
  if (st === 'available') {
    g.say(a, ['Fuel permit? Sure. Just fill out Form 27-B/6.', 'We\'re out of forms. The last one blew onto the containers. The tall ones. With the forklifts.', 'Ride the forks up. Don\'t tell OSHA. We don\'t have OSHA. We have Rusty.'], () => { g.missions.start('permit'); BURNS_W8.permitStep(g, 1); });
    return;
  }
  if (st === 'done') { g.say(a, ['You got a permit in ONE day. They\'re writing songs about you in the DPW camp. Sad songs. About paperwork.']); return; }
  if (step === 5) {
    g.say(a, ['Stamped. Signed. Coffee-stained. It\'s... it\'s beautiful.', 'Permit approved. Pump 3. Go see Hank before I change my mind.'], () => { g.missions.complete('permit', { x: a.x - 1.8, y: 1.4, z: a.z }); BURNS_W8.state.permitDone = true; });
  } else if (step >= 2) g.say(a, ['It needs a STAMP. Stamp has the stamp. That\'s why we call him Stamp. He\'s at the DPW camp. In the hammock. Always in the hammock.']);
  else g.say(a, ['The form is on top of Container Canyon. Ride the forklift forks up. Jump the gap. Don\'t die. Dying requires Form 9.']);
};
BURNS_W8.stampMarker = function (g) {
  if (g.missions.state('permit') !== 'active') return null;
  const step = BurnsSave.flag(8, 'permitStep') || 0;
  return step === 2 || step === 4 ? '?' : null;
};
BURNS_W8.stampTalk = function (g, a) {
  const st = g.missions.state('permit'), step = BurnsSave.flag(8, 'permitStep') || 0;
  if (st !== 'active' || step < 2) { a.say('Zzz... five more... months...', 1.8); return; }
  if (a.behName === 'sleep') { a.setBehavior('idle'); a.def.anim = 'sit'; a.ch.play('sit'); }
  if (step === 2) g.say(a, ['Wha— I\'m awake. I was resting my eyes. For a week.', 'A stamp? I don\'t stamp without coffee. It\'s not a bribe. It\'s a gift. Gifting culture.', 'Hell\'s Kitchen gifts coffee to the fuel line. Iced. Oat milk. Go.'], () => BURNS_W8.permitStep(g, 3));
  else if (step === 3) g.say(a, ['Coffee. Then stamp. That\'s the circle of life.']);
  else if (step === 4) g.say(a, ['*slurrrrp* ...oh, that\'s the stuff.', '*KA-CHUNK* Stamped. Now beat it before I fall asleep standing up. Lying down. Whatever.'], () => { BURNS_W8.permitStep(g, 5); g.toast('FORM STAMPED! BACK TO DOT!'); burnsSfx('stomp', { pitch: 1.6 }); a.setBehavior('sleep'); });
  else g.say(a, ['Zzz... it\'s stamped... go away... zzz...']);
};
BURNS_W8.beanTalk = function (g, a) {
  const step = BurnsSave.flag(8, 'permitStep') || 0;
  if (g.missions.state('permit') === 'active' && step === 3) {
    g.say(a, ['A coffee for STAMP? He takes it iced, oat milk, four sugars, and a pinch of playa dust. For texture.', 'Here. Gifted with love. And spite.'], () => { BURNS_W8.permitStep(g, 4); g.toast('GOT: ONE (1) ICED COFFEE'); burnsSfx('gift', null, 'pick'); g.fx.confetti(a.x, a.y + 2, a.z, 14); });
    return;
  }
  g.say(a, ['Welcome to Hell\'s Kitchen. We gift coffee to everyone stuck in the fuel line.', 'Average wait: four hours. Average coffees: also four. Have some glow sticks while you vibrate.'], () => {
    if (!a.data.gifted) { a.data.gifted = true; g.glow += 8; g.toast('GIFTED 8 GLOW STICKS!'); burnsSfx('gift', null, 'pick'); }
  });
};
BURNS_W8.hankTalk = function (g, a) {
  const st = g.missions.state('fillup');
  if (!g.missions.isDone('fumes')) { g.say(a, ['Get your vehicle in line first. Yes, even the octopus.']); return; }
  if (!g.missions.isDone('permit')) { g.say(a, ['No permit, no petrol. The DPW trailer. East side. Bring snacks.']); return; }
  if (st === 'available') {
    g.say(a, ['A PERMIT? A real one? ...Fine. Pump 3. Drive the octopus into the bay and hit FUEL.', 'Heads up: the crew hates art cars. They might... unplug you. For safety. Their safety. From fun.'], () => { g.missions.start('fillup'); BURNS_W8.fillShort(g); });
    return;
  }
  if (st === 'active') { g.say(a, ['Pump 3! Bay\'s marked. Can\'t miss it. You\'ll miss it.']); return; }
  g.say(a, ['Full tank on an octopus. I\'ve seen it all now. Rusty\'s gonna lose it.']);
};

/* ---------------- fill 'er up ---------------- */
BURNS_W8.fillShort = function (g) {
  const m = g.missions.get('fillup'), S = BURNS_W8.state; if (!m) return;
  m.def.short = S.fueling ? 'Defend El Pulpo while it fuels' : BURNS_W8.carInBay(g) ? 'Press FUEL at pump 3' : 'Park El Pulpo at pump 3';
};
BURNS_W8.carInBay = function (g) { const car = BURNS_W8.state.pulpo.car; return Math.hypot(car.x - BURNS_W8.BAY.x, car.z - BURNS_W8.BAY.z) < 3.4 && Math.abs(car.speed) < 0.5; };
BURNS_W8.canFuel = function (g) { const S = BURNS_W8.state; return g.missions.state('fillup') === 'active' && !S.fueling && BURNS_W8.carInBay(g) && !g.player.vehicle; };
BURNS_W8.startFueling = function (g) {
  const S = BURNS_W8.state, car = S.pulpo.car;
  if (S.fueling) return;
  car.parked = true; car.speed = 0;
  S.fueling = true; S.raidT = 3; S.waves = 0;
  BURNS_W8.fillShort(g);
  g.banner('FUELING!', 'Keep DPW away from El Pulpo until the tank is full.', { col: '#ffd84a' });
  burnsSfx('splash', { vol: 0.6 }, 'pick');
};
BURNS_W8.fillUpdate = function (g, m, dt) {
  const S = BURNS_W8.state, car = S.pulpo.car;
  if (!S.fueling) { if ((m._short || '') !== m.def.short) m._short = m.def.short; BURNS_W8.fillShort(g); return; }
  S.raiders = S.raiders.filter(a => !a.removed);
  const live = S.raiders.filter(a => !a.defeated);
  const unplug = live.some(a => a.data.atCar);
  const paused = g.missions.state('nozzle') === 'active';
  if (!paused) {
    if (unplug) { S.pulpo.fuel = Math.max(0, S.pulpo.fuel - dt * 0.02); if (Math.random() < dt * 2) g.fx.burst(car.x, 2.6, car.z, 'drop', 2, '#ffb040'); }
    else S.pulpo.fuel = Math.min(1, S.pulpo.fuel + dt / 42);
  }
  const pct = Math.floor(S.pulpo.fuel * 100);
  if (pct !== m.n) m.n = pct;
  m.def.short = paused ? 'Get the nozzle back!' : unplug ? 'DPW is unplugging El Pulpo!' : 'Defend El Pulpo while it fuels';
  // raider waves from the north side
  S.raidT -= dt;
  if (!paused && S.raidT <= 0 && live.length < 4 && S.pulpo.fuel < 0.97) {
    S.raidT = 9 + Math.random() * 3; S.waves++;
    const n = S.waves < 2 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const sx = (i % 2 ? 1 : -1) * (12 + i * 3), z = -22 - Math.random() * 6;
      const a = g.spawnActor({ spec: burnsW8Spec(60 + S.waves * 7 + i), name: 'DPW', type: 'dpw', x: sx, z, behavior: 'w8Raid', hp: 2, friendly: false, drop: 2, tag: 'dpw', afterDefeat: 'chill', defeatLine: burnsW8910Pick(['Fine. Fill your squid.', 'It\'s an OCTOPUS? Huh.', 'Break time!']) });
      S.raiders.push(a);
    }
    g.toast('DPW INCOMING! PROTECT THE OCTOPUS!'); burnsSfx('yell', { vol: 0.6 });
  }
  // halfway: Skids grabs the nozzle
  if (S.pulpo.fuel >= 0.5 && !S.snatched && !g.missions.isDone('nozzle')) BURNS_W8.snatch(g);
  if (S.pulpo.fuel >= 1 && g.missions.isDone('nozzle')) BURNS_W8.fillDone(g);
};
BURNS_W8.snatch = function (g) {
  const S = BURNS_W8.state; S.snatched = true;
  const path = [[20, 6], [30, -12], [44, -24], [50, -42], [30, -54], [8, -46], [-14, -36], [-26, -16], [-24, 8], [-12, 18], [8, 16]];
  const sk = g.spawnActor({ id: 'skids', spec: burnsW8Spec(77, { hat: { kind: 'cap', col: '#38f2ff' }, face: 'smug', body: { h: 0.95, w: 1.0 } }), name: 'SKIDS (DPW)', type: 'dpw', x: BURNS_W8.PUMP3.x + 1, z: 2, behavior: 'w8Snatch', hp: 1, friendly: false, drop: 0, path, runSpeed: 6.4, always: true,
    defeatLine: 'OKAY OKAY! Take your stupid nozzle!',
    onDefeat(g2, a) { g2.spawnPickup('glowstick', a.x + 1, a.y + 0.9, a.z, { pop: true }); BURNS_W8.dropNozzle(g2, a); } });
  sk.data.i = 0;
  g.missions.start('nozzle');
  g.say(sk, ['Nice nozzle. Be a shame if someone... YOINKED it.'], null);
  burnsSfx('yell');
};
BURNS_W8.dropNozzle = function (g, a) {
  const P = g.pickups.items.find(q => q.id === 'nozzleItem');
  if (P) { P.x = a.x; P.z = a.z; P.y0 = a.y + 1.0; P.taken = false; P.obj.visible = true; }
  g.toast('THE NOZZLE! GRAB IT!');
};
BURNS_W8.fillDone = function (g) {
  const S = BURNS_W8.state, car = S.pulpo.car;
  if (!S.fueling) return;
  S.fueling = false; S.pulpo.fuel = 1; car.parked = false; car.maxSpeed = 9;
  for (const a of S.raiders) if (!a.defeated) { a.befriend(); }
  g.missions.complete('fillup', { x: car.x - 4, y: 1.4, z: car.z });
  g.setTod(Math.max(g.tod, 0.6), 0.05);
  BurnsW8910.timer(g, 1.2, g2 => {
    for (let k = 0; k < 3; k++) BurnsW8910.timer(g2, k * 0.5, g3 => { const h = S.pulpo.head(); for (let i = 0; i < 14; i++) g3.fx.add(h[0], h[1], h[2], (Math.random() - 0.5) * 2, 11 + Math.random() * 5, (Math.random() - 0.5) * 2, 0.6, 1.8, 0.6, [1, 0.55, 0.15], 1, 'flame', 1); burnsSfx('flame_jet', { vol: 0.8 }); g3.shake(0.2); });
    g2.banner('EL PULPO IS FULL!', 'Fire breath restored. The DPW yard is to the north...', { col: '#ff7a2a' });
    const h = g2.actor('hank'); if (h) h.say('The foreman\'s gonna HATE this.', 3);
  });
};

/* ---------------- Foreman Rusty ---------------- */
BURNS_W8.RUSTY_PHASES = [
  { hp: 4, list: ['ram', 'slam'], rate: 1 },
  { hp: 3, list: ['ram', 'slam', 'toss'], rate: 1.1, crew: true },
  { hp: 2, list: ['ram', 'toss', 'slam', 'toss'], rate: 1.2, crew: true },
  { hp: 1, list: ['ram', 'toss', 'ram', 'slam'], rate: 1.35, crew: true }
];
BURNS_W8.bossIntro = function (g) {
  const S = BURNS_W8.state, Y = BURNS_W8.YARD, p = g.player, a = g.actor('rusty'), T = S.tele;
  if (S.bossStarted) return; S.bossStarted = true;
  if (p.vehicle) p.vehicle.dismount(p);
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'boss' },
    { do: g2 => { p.teleport(Y.x, 0, BURNS_W8.GATE.z - 6, Math.PI); S.gateOn = true; S.gate.off = false; T.x = Y.x; T.z = Y.z - 6; T.yaw = 0; T.pitch = -0.4; } },
    { cam: { x: Y.x + 9, y: 3, z: Y.z + 10, tx: Y.x, ty: 2.5, tz: Y.z - 6, fov: 0.85 } },
    { do: g2 => { T.shake = 0.15; burnsSfx('artcarHorn', { pitch: 0.5 }); g2.shake(0.3); g2.fx.smoke(T.x + 0.85, 3, T.z - 2.4, 10, '#2a2428'); } },
    { banner: ['FOREMAN RUSTY', 'DPW · 22 Years On The Playa · Showered Twice', { col: '#ff8a1a', big: true, dur: 3.2 }] },
    { say: [a, ['WHO GAVE THE SPARKLE PONY A PERMIT?!', 'Twenty-two years I\'ve kept this playa ugly. Functional. FUN-FREE.', 'And you roll in with a fire-breathing OCTOPUS? That thing\'s getting impounded. With you in it.']] },
    { say: ['brady', ['It\'s a gift economy, Rusty. Gift me some chill.']] },
    { say: [a, ['I GIFT YOU... OVERTIME!']] },
    { do: g2 => { T.shake = 0; T.pitch = 0.32; p.teleport(Y.x, 0, Y.z + 16, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; BURNS_W8.rustyStart(g2); g2.banner('FIGHT!', 'Dodge his RAM into the containers, then SPIN or STOMP Rusty while he\'s stuck', { col: '#ffd84a' }); } }
  ]);
};
BURNS_W8.rustyStart = function (g) {
  const a = g.actor('rusty'), D = a.data;
  D.st = 'idle'; D.t = 0; D.combo = 0; a.hp = 4; a.maxHp = 4; a.defeated = false; a.friendly = false;
  g.boss = { name: 'FOREMAN RUSTY', get hp() { return a.hp; }, maxHp: 4, active: true, get defeated() { return a.defeated; }, get st() { return a.data.st; }, head() { return [a.x, a.y + 2.4, a.z]; }, update() {} };
};
BURNS_W8.rustyReset = function (g) {
  const S = BURNS_W8.state, T = S.tele, Y = BURNS_W8.YARD, a = g.actor('rusty');
  if (!a || a.defeated) return;
  T.x = Y.x; T.z = Y.z - 6; T.yaw = 0; T.speed = 0; T.pitch = 0.32; S.slamMark = null;
  for (const x of g.actors.slice()) if (x.def.rustyCrew && !x.defeated) g.removeActor(x);
  a.hp = a.maxHp; a.data.st = 'wait'; a.data.t = 0; a.data.combo = 0; a.data.calls = 0;
  g.toast('RUSTY\'S WAITING IN THE YARD. WITH A FULL HEALTH BAR. AND A GRUDGE.');
};
BURNS_W8.rustyPhase = function (a) { const P = BURNS_W8.RUSTY_PHASES; return P[clamp(4 - a.hp, 0, P.length - 1)]; };
BURNS_W8.rustyUpdate = function (a, g, dt) {
  const S = BURNS_W8.state, T = S.tele, D = a.data, p = g.player, Y = BURNS_W8.YARD;
  if (!T) return;
  const ph = BURNS_W8.rustyPhase(a), rate = ph.rate;
  D.t += dt * (D.st === 'stuck' || D.st === 'recover' ? 1 : rate);
  const toP = Math.atan2(p.x - T.x, p.z - T.z), dP = Math.hypot(p.x - T.x, p.z - T.z), inYard = Math.hypot(p.x - Y.x, p.z - Y.z) < Y.r + 4;
  T.shake = 0;
  switch (D.st) {
    case 'park': case 'done': T.speed = 0; break;
    case 'wait': T.yaw = BurnsM.dampAngle(T.yaw, toP, 1.5, dt); if (inYard && dP < 26 && !g.cine) { D.st = 'idle'; D.t = 0; a.say('ROUND TWO, GLITTER BOY!', 1.6); } break;
    case 'idle': {
      T.yaw = BurnsM.dampAngle(T.yaw, toP, 2.2, dt); T.pitch = BurnsM.damp(T.pitch, 0.32, 3, dt);
      if (!inYard) { D.t = 0; break; }
      if (D.t > 1.3) {
        if (ph.crew && D.calls < 4 - a.hp && BURNS_W8.crewCount(g) < 2) { D.calls++; D.st = 'radio'; D.t = 0; a.say(burnsW8910Pick(['CREW! GET THIS SPARKLE PONY OUTTA MY YARD!', 'CODE BROWN! I MEAN CODE GLITTER! ALL HANDS!']), 2); burnsSfx('pick', { pitch: 0.6 }); break; }
        const atk = ph.list[D.combo % ph.list.length]; D.combo++;
        D.st = atk === 'ram' ? 'rev' : atk; D.t = 0;
        if (D.st === 'rev') a.say(burnsW8910Pick(['OUTTA MY YARD!', 'IMPOUND TIME!', 'HERE COMES THE PAPERWORK!']), 1.2);
        if (D.st === 'slam') a.say(burnsW8910Pick(['BOOM SLAM!', 'HARD HAT ZONE!']), 1.2);
        if (D.st === 'toss') a.say(burnsW8910Pick(['HAVE SOME WATER! ALL OF IT!', 'HYDRATE THIS!']), 1.4);
      }
      break;
    }
    case 'rev': {
      T.yaw = BurnsM.dampAngle(T.yaw, toP, 3.5, dt); T.shake = 0.12; T.pitch = BurnsM.damp(T.pitch, -0.15, 4, dt);
      if (Math.random() < dt * 14) g.fx.smoke(T.x + Math.sin(T.yaw) * -2.4, 3.1, T.z + Math.cos(T.yaw) * -2.4, 1, '#2a2428');
      if (Math.random() < dt * 20) g.fx.dust(T.x, 0.2, T.z, 1);
      if (D.t > 1.0) { D.st = 'ram'; D.t = 0; D.dir = T.yaw; T.speed = 4; burnsSfx('artcarHorn', { pitch: 0.7, vol: 0.8 }); }
      break;
    }
    case 'ram': {
      T.speed = Math.min(15, T.speed + dt * 22);
      T.x += Math.sin(D.dir) * T.speed * dt; T.z += Math.cos(D.dir) * T.speed * dt;
      if (Math.random() < dt * 30) g.fx.dust(T.x - Math.sin(D.dir) * 2.5, 0.2, T.z - Math.cos(D.dir) * 2.5, 2);
      // flatten Brady
      const hx = T.x + Math.sin(D.dir) * 1.2, hz = T.z + Math.cos(D.dir) * 1.2;
      if (Math.hypot(p.x - hx, p.z - hz) < 2.4 && p.y < 2.2) p.hurt(2, T.x, T.z, 13);
      const dc = Math.hypot(T.x - Y.x, T.z - Y.z);
      if (dc > Y.r - 1.0) {
        // CRUNCH into the containers
        const k = (Y.r - 1.0) / dc; T.x = Y.x + (T.x - Y.x) * k; T.z = Y.z + (T.z - Y.z) * k;
        D.st = 'stuck'; D.t = 0; T.speed = 0;
        g.shake(0.8); burnsSfx('man_stomp', { pitch: 1.4 }); burnsSfx('bump');
        const fx = T.x + Math.sin(D.dir) * 3, fz = T.z + Math.cos(D.dir) * 3;
        g.fx.burst(fx, 2.5, fz, 'spark', 30, '#ffd890'); g.fx.dust(fx, 0.5, fz, 30);
        a.say(burnsW8910Pick(['MY BACK!', 'THAT CONTAINER WAS THERE BEFORE ME!', 'WHO PUT THAT THERE?! ...I PUT THAT THERE.']), 2);
        g.warn('HE\'S STUCK! SPIN OR STOMP RUSTY!', 2.2);
      } else if (D.t > 3.2) { D.st = 'brake'; D.t = 0; }
      break;
    }
    case 'brake': T.speed = approach(T.speed, 0, dt * 20); T.x += Math.sin(D.dir) * T.speed * dt; T.z += Math.cos(D.dir) * T.speed * dt; if (T.speed <= 0) { D.st = 'idle'; D.t = 0; } break;
    case 'stuck': {
      T.shake = 0.05;
      if (Math.random() < dt * 6) g.fx.smoke(T.x - Math.sin(T.yaw) * 2.3, 3.0, T.z - Math.cos(T.yaw) * 2.3, 1, '#e8e8f0');
      if (Math.random() < dt * 5) g.fx.burst(a.x, a.y + 2.2, a.z, 'star', 1, '#ffe24a');
      if (D.t > 4.4) { D.st = 'reverse'; D.t = 0; a.say('BACK IT UP! BEEP BEEP BEEP!', 1.5); }
      break;
    }
    case 'recover': case 'reverse': {
      const back = Math.atan2(Y.x - T.x, Y.z - T.z);
      T.x += Math.sin(back) * 5 * dt; T.z += Math.cos(back) * 5 * dt;
      if (Math.floor(D.t * 4) !== Math.floor((D.t - dt) * 4)) burnsSfx('pick', { pitch: 1.8, vol: 0.3 });
      if (D.t > 1.6 || Math.hypot(T.x - Y.x, T.z - Y.z) < 6) { D.st = 'idle'; D.t = 0; }
      break;
    }
    case 'slam': {
      T.yaw = BurnsM.dampAngle(T.yaw, toP, D.t < 0.9 ? 2.4 : 0, dt);
      if (D.t < 1.15) { T.pitch = BurnsM.damp(T.pitch, -0.95, 4, dt); S.slamMark = BURNS_W8.slamPoint(); }
      else if (!D.slammed) {
        T.pitch = approach(T.pitch, 0.42, dt * 9);
        if (T.pitch >= 0.42) {
          D.slammed = true; const tip = BURNS_W8.boomTip(); S.slamMark = null;
          g.shockwave({ x: tip[0], z: tip[2], y: 0, speed: 10 * rate, max: 15, h: 0.7, w: 1.0, dmg: 1, col: '#ffb040', dust: true });
          g.fx.dust(tip[0], 0.3, tip[2], 30); g.shake(0.6); burnsSfx('man_stomp');
          if (Math.hypot(p.x - tip[0], p.z - tip[2]) < 2.8 && p.y < 2.5) p.hurt(2, tip[0], tip[2], 10);
        }
      }
      if (D.t > 2.3) { D.st = 'idle'; D.t = 0; D.slammed = false; }
      break;
    }
    case 'toss': {
      T.yaw = BurnsM.dampAngle(T.yaw, toP, 2, dt);
      T.pitch = D.t < 0.8 ? BurnsM.damp(T.pitch, 0.4, 5, dt) : BurnsM.damp(T.pitch, -0.9, 8, dt);
      if (D.t > 1.0 && !D.tossed) {
        D.tossed = true;
        const mv = S.pallets.find(q => !q.visible) || S.pallets[0], tip = BURNS_W8.boomTip();
        BurnsW8910Haz.load(g, mv, tip[0], tip[1], tip[2], p.x + p.vx * 0.5, p.z + p.vz * 0.5, { T: 1.2, hold: 6, blast: 2.4 });
        burnsSfx('throw', { pitch: 0.6 });
      }
      if (D.t > 2.0) { D.st = 'idle'; D.t = 0; D.tossed = false; }
      break;
    }
    case 'radio': {
      a.ch.play('phone');
      if (D.t > 1.0 && !D.called) {
        D.called = true;
        for (let i = 0; i < 2; i++) {
          const ang = Math.PI + (i ? 0.5 : -0.5), x = Y.x + Math.sin(ang) * (Y.r - 4), z = Y.z + Math.cos(ang) * (Y.r - 4);
          g.spawnActor({ spec: burnsW8Spec(90 + D.calls * 3 + i), type: 'dpw', name: 'DPW CREW', x, z, behavior: i ? 'w8Rebar' : 'w8Wrench', hp: 2, friendly: false, drop: 2, tag: 'dpw', rustyCrew: true, afterDefeat: 'chill', defeatLine: 'Union break!' });
          g.fx.dust(x, 0.2, z, 16);
        }
      }
      if (D.t > 1.6) { D.st = 'idle'; D.t = 0; D.called = false; }
      break;
    }
  }
  // keep inside the yard
  const dc = Math.hypot(T.x - Y.x, T.z - Y.z); if (dc > Y.r - 1) { const k = (Y.r - 1) / dc; T.x = Y.x + (T.x - Y.x) * k; T.z = Y.z + (T.z - Y.z) * k; }
  BURNS_W8.teleSync(g);
  // Rusty in the seat
  const c = Math.cos(T.yaw), s = Math.sin(T.yaw), lx = -0.7, lz = 0.25;
  a.x = T.x + lx * c + lz * s; a.z = T.z - lx * s + lz * c; a.y = 1.25; a.yaw = T.yaw;
  if (D.st !== 'radio') a.ch.play(D.st === 'stuck' ? 'hurt' : D.st === 'done' ? 'sit' : D.st === 'park' ? 'sleep' : 'drive', { steer: Math.sin(g.time * 2) * 0.4 });
};
BURNS_W8.slamPoint = function () { const T = BURNS_W8.state.tele, b = T.boom, L = 8.2, cp = Math.cos(0.42), sp = Math.sin(0.42); const lz = L * cp - 0.6 * sp; return [b.x + Math.sin(T.yaw) * lz, 0, b.z + Math.cos(T.yaw) * lz]; };
BURNS_W8.crewCount = function (g) { let n = 0; for (const a of g.actors) if (a.def.rustyCrew && !a.defeated) n++; return n; };
BURNS_W8.rustyHit = function (a, g, kind) {
  const D = a.data;
  if (D.st !== 'stuck') {
    if (D.st !== 'park' && D.st !== 'done' && Math.random() < 0.5) a.say(burnsW8910Pick(['NICE TRY, GLITTER BOY!', 'I CAN\'T FEEL THAT. I CAN\'T FEEL ANYTHING. DPW.', 'HARD HAT, KID. HARD. HAT.']), 1.4);
    return false;
  }
  a.hp -= 1; a.invT = 0.8; a.hurtT = 0.4;
  g.fx.burst(a.x, a.y + 2, a.z, 'star', 18, '#ffe24a'); g.shake(0.5); burnsSfx('bossHit'); burnsSfx('yell', { pitch: 0.7 });
  const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 9, 8, dz / d * 9);
  if (a.hp <= 0) { BURNS_W8.rustyDefeated(g, a); return 'handled'; }
  D.st = 'recover'; D.t = 0; D.combo = 0;
  a.say(burnsW8910Pick(['OW! MY SCIATICA!', 'THAT\'S A WRITE-UP!', 'OVERTIME! EVERYBODY GETS OVERTIME!']), 1.8);
  if (a.hp === 2) g.banner('RUSTY\'S STEAMING', 'He\'s calling the crew. Keep making him crash.', { col: '#ff8a1a' });
  if (a.hp === 1) g.banner('ONE MORE!', 'Faster rams. Bigger tosses. Smaller patience.', { col: '#ff4a2a' });
  return 'handled';
};
BURNS_W8.rustyDefeated = function (g, a) {
  const S = BURNS_W8.state, T = S.tele, p = g.player;
  a.defeated = true; a.friendly = true; a.hp = 0; a.data.st = 'done';
  g.fx.confetti(a.x, a.y + 2, a.z, 40);
  for (const x of g.actors) if (x.def.rustyCrew && !x.defeated) x.befriend();
  g.missions.complete('boss');
  g.boss = null; S.slamMark = null; BurnsW8910Haz.clear(g);
  BurnsW8910.timer(g, 1.4, g2 => {
    g2.cutscene([
      { music: 'burns_victory' },
      { do: g3 => { T.pitch = 0.4; a.def.fixedY = false; const c = Math.cos(T.yaw), s = Math.sin(T.yaw); a.x = T.x - 2.6 * c; a.z = T.z + 2.6 * s; a.y = 0; a.setBehavior('sit'); p.teleport(a.x - 2.2 * c + Math.sin(T.yaw) * 2, 0, a.z + 2.2 * s + Math.cos(T.yaw) * 2, Math.atan2(a.x - (a.x - 2.2 * c), 0.01)); p.yaw = Math.atan2(a.x - p.x, a.z - p.z); } },
      { cam: { x: a.x + 4, y: 2.2, z: a.z + 4.5, tx: a.x, ty: 1.0, tz: a.z, fov: 0.8 } },
      { say: [a, ['Fine. FINE. You win, glitter boy.', 'Twenty-two years and nobody ever made me crash my own telehandler. Respect.']] },
      { say: ['brady', ['Have you seen a giant wooden guy? Neon heart. Carrying my wife.']] },
      { say: [a, ['The Man? Came through last night. Bought every drop of lamp oil we had.', 'Said he was "setting the mood." Took the deep-playa road north. Lady on his shoulder, yelling your name.', 'She also yelled "HYDRATE." Good woman.']] },
      { say: ['brady', ['Chinka...']] },
      { do: g3 => { const h = S.pulpo.head(); for (let i = 0; i < 24; i++) g3.fx.add(h[0], h[1], h[2], (Math.random() - 0.5) * 2, 12 + Math.random() * 6, (Math.random() - 0.5) * 2, 0.7, 2, 0.6, [1, 0.55, 0.15], 1, 'flame', 1); burnsSfx('artcarHorn'); burnsSfx('flame_jet'); } },
      { say: [a, ['Take the octopus. Full tank, on the house. Just... get it out of my yard. It\'s too fun.']] },
      { do: g3 => { p.victoryT = 3; burnsSfx('crowd_cheer'); } },
      { wait: 1.0 }
    ], g3 => g3.finishWorld());
  });
};
BURNS_W8.rustyRetired = function (g) {
  const a = g.actor('rusty'), T = BURNS_W8.state.tele;
  if (!a) return;
  a.defeated = true; a.friendly = true; a.data.st = 'done'; a.def.fixedY = false;
  const c = Math.cos(T.yaw); a.x = T.x - 2.6 * c; a.z = T.z; a.y = 0; a.setBehavior('sit');
  a.def.lines = ['Full tank, glitter boy. Go get your lady.', 'Twenty-two years. Two showers. One defeat. I\'m putting it on my resume.'];
  a.def.noTalk = false; a.def.talk = null;
};
