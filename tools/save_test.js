// Save v3 for Super Brady-O World (SECRETS_WARPS_SWITCHES.md §5.3; Brady, 17 Nov 2026: "wipe my save i dont care"):
// a fresh boot uses the v3 key; an old v2 save (or v1) gives its settings and Brady's look to v3 once, and its
// progress is not carried over: the intro story plays again, Pupo is not met, no powers carry, no secrets found.
// The v2 save on the device is left untouched. Node only (no browser).
// usage: node tools/save_test.js
const loadGame = require('./load_game');
let bad = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) bad++; };
const KEY = 'super-brady-o-world-save-v3', V2 = 'super-brady-o-world-save-v2', V1 = 'super-brady-o-world-save-v1';
// 1. a fresh boot
{
  const G = loadGame({ load: true });
  check('the world app saves under ' + KEY, G.Save.key === KEY, G.Save.key);
  check('the legacy key is v2 (settings and look come over once)', G.Save.legacyKey === V2, G.Save.legacyKey);
  check('a fresh save has empty progress and the exits table', Object.keys(G.Save.data.done).length === 0 && typeof G.Save.data.exits === 'object' && !(KEY in G.store), Object.keys(G.store));
  const T = G.TourProgress.data();
  check('tour progress has the v2 fields', ['revealed', 'paths', 'flights', 'bottles', 'houses'].every(k => typeof T[k] === 'object') && T.lighthouse === false && Array.isArray(T.pending), Object.keys(T));
  check('tour progress has the secrets fields (rules, warpLinks, arrive, hop)', typeof T.rules === 'object' && !Object.keys(T.rules).length && typeof T.warpLinks === 'object' && T.arrive === null && T.hop === null, { rules: T.rules, warpLinks: T.warpLinks });
  check('a fresh save: intro story not seen, Pupo not met, nothing carried', !G.Save.data.seenTourIntro && !T.pupo && !T.carry, { seen: G.Save.data.seenTourIntro, pupo: T.pupo, carry: T.carry });
}
// 2. a real-shaped v2 save on the device (Brady's mid-playthrough save): wiped, settings and look kept
{
  const v2 = { v: 3, unlocked: { '1-1': true, '1-2': true, '1-3': true, '1-4': true, '2-1': true }, done: { '1-1': true, '1-2': true, '1-3': true }, gold: { '1-1': [true, true, false], '1-2': [true, false, true] },
    secretExits: { '1-1': true }, exits: { '1-1': { main: true, secret: true }, '1-2': { main: true }, '1-3': { main: true } }, lives: 9, score: 54321, picks: 61, seenTourIntro: true,
    look: { hair: 3, skin: 2, style: 'bun', glasses: 'shades', tattoos: true, beard: false, v: 2 }, settings: { music: 0.2, sfx: 0.3, ctrlScale: 1.2, lefty: true, hq: true, shake: false, reduceMotion: true, zoom: 'far' },
    tips: { pupoFirst: true }, best: { '1-1': 88.2 },
    tour: { at: 'mx', seen: { mx: true }, freed: {}, lands: {}, revealed: { 'house:mx-tienda': true }, paths: { 'mx:0>6': true }, pending: [], cards: { mx: true },
      carry: { form: 'big', hands: { kind: 'gear', id: 'plane', uses: 2 }, jump: 'beans' }, pupo: { met: true, meter: 0.5 } } };
  const store = { [V2]: JSON.stringify(v2) };
  const G = loadGame({ load: true, store });
  const d = G.Save.data;
  check('settings come over from v2', d.settings.music === 0.2 && d.settings.lefty === true && d.settings.reduceMotion === true && d.settings.shake === false && d.settings.zoom === 'far', d.settings);
  check('Brady\'s look comes over from v2', d.look.hair === 3 && d.look.skin === 2, d.look);
  check('progress is wiped (levels, postcards, exits, coins, best times)', !Object.keys(d.done).length && !Object.keys(d.gold).length && !Object.keys(d.secretExits).length && !Object.keys(d.exits).length && !d.unlocked['1-2'] && !d.picks && !Object.keys(d.best).length, { done: d.done, unlocked: d.unlocked });
  check('the intro story plays again, Pupo is not met, no powers carry', !d.seenTourIntro && !d.tour && !(d.tips && d.tips.pupoFirst), { seen: d.seenTourIntro, tour: d.tour, tips: d.tips });
  const T = G.TourProgress.data();
  check('the fresh tour state has no carry, no Pupo, no secrets', !T.carry && !T.pupo && !Object.keys(T.rules).length && !Object.keys(T.warpLinks).length && !T.arrive, Object.keys(T));
  check('the v3 save is written at once and v2 is left untouched', !!store[KEY] && store[V2] === JSON.stringify(v2));
  check('Mexico 1-1 is open and 1-2 is not', G.TourProgress.isUnlocked('1-1') && !G.TourProgress.isUnlocked('1-2'));
  // 3. the copy happens once: a second boot reads v3 even if v2 changes
  d.lives = 7; G.Save.save();
  store[V2] = JSON.stringify(Object.assign({}, v2, { settings: Object.assign({}, v2.settings, { music: 0.9 }) }));
  const G2 = loadGame({ load: true, store });
  check('a second boot keeps the v3 save (no second copy)', G2.Save.data.settings.music === 0.2 && G2.Save.data.lives === 7, { music: G2.Save.data.settings.music, lives: G2.Save.data.lives });
}
// 4. only a v1 save on the device (very old): v3 starts fresh with defaults (only the newest old save is read)
{
  const store = { [V1]: JSON.stringify({ v: 3, done: { '1-1': true }, settings: { music: 0.1 } }) };
  const G = loadGame({ load: true, store });
  check('a v1-only device starts v3 fresh', !Object.keys(G.Save.data.done).length && store[V1] && !(V2 in store), Object.keys(store));
}
// 5. the secrets fields survive a save round trip
{
  const store = {};
  const G = loadGame({ load: true, store });
  const T = G.TourProgress.data();
  T.rules[3] = { at: '1-4' }; T.warpLinks.ec = { '2-7': '1-4' }; T.arrive = { cc: 'ec', at: '2-7', from: '1-4' };
  G.Save.data.exits['1-4'] = { warp: true };
  G.Save.save();
  const G2 = loadGame({ load: true, store }), T2 = G2.TourProgress.data();
  check('rules, warp links, the arrival and warp exits round-trip', T2.rules[3] && T2.rules[3].at === '1-4' && T2.warpLinks.ec['2-7'] === '1-4' && T2.arrive && T2.arrive.at === '2-7' && G2.Save.data.exits['1-4'].warp === true, { rules: T2.rules, links: T2.warpLinks, arrive: T2.arrive });
}
console.log(bad ? `${bad} SAVE CHECK(S) FAILED` : 'ALL SAVE CHECKS PASSED');
process.exit(bad ? 1 : 0);
