// Save v2 for Super Brady-O World (LEVEL_OVERHAUL.md §3.5, W1): a fresh boot uses the v2 key; an old v1 save gives
// its settings and Brady's look to v2 once, and its progress is not carried over. Node only (no browser).
// usage: node tools/save_test.js
const loadGame = require('./load_game');
let bad = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) bad++; };
// 1. a fresh boot
{
  const G = loadGame({ load: true });
  check('the world app saves under super-brady-o-world-save-v2', G.Save.key === 'super-brady-o-world-save-v2', G.Save.key);
  check('a fresh save has empty progress and the exits table', Object.keys(G.Save.data.done).length === 0 && typeof G.Save.data.exits === 'object' && !('super-brady-o-world-save-v2' in G.store), Object.keys(G.store));
  const T = G.TourProgress.data();
  check('tour progress has the v2 fields', ['revealed', 'paths', 'flights', 'bottles', 'houses'].every(k => typeof T[k] === 'object') && T.lighthouse === false && Array.isArray(T.pending), Object.keys(T));
}
// 2. a v1 save on the device
{
  const v1 = { v: 3, unlocked: { '1-1': true, '1-2': true, '2-1': true }, done: { '1-1': true, '1-5': true }, gold: { '1-1': [true, true, false] }, secretExits: { '8-4': true },
    lives: 9, score: 12345, look: { hair: 3, skin: 2, style: 'bun', glasses: 'shades', tattoos: true, beard: true, v: 2 }, settings: { music: 0.2, sfx: 0.3, ctrlScale: 1.2, lefty: true, hq: true, shake: false, reduceMotion: true },
    tour: { at: 'ec', seen: { mx: true, ec: true }, freed: { mx: true }, lands: { aq: true } } };
  const store = { 'super-brady-o-world-save-v1': JSON.stringify(v1) };
  const G = loadGame({ load: true, store });
  const d = G.Save.data;
  check('settings come over from v1', d.settings.music === 0.2 && d.settings.lefty === true && d.settings.reduceMotion === true && d.settings.shake === false, d.settings);
  check('Brady\'s look comes over from v1', d.look.hair === 3 && d.look.skin === 2, d.look);
  check('progress is wiped', !Object.keys(d.done).length && !Object.keys(d.gold).length && !Object.keys(d.secretExits).length && !d.tour && !(d.unlocked['2-1']), { done: d.done, unlocked: d.unlocked });
  check('the v2 save is written at once and v1 is left untouched', !!store['super-brady-o-world-save-v2'] && store['super-brady-o-world-save-v1'] === JSON.stringify(v1));
  check('Mexico 1-1 is open and 1-2 is not', G.TourProgress.isUnlocked('1-1') && !G.TourProgress.isUnlocked('1-2'));
  // 3. the copy happens once: a second boot reads v2 even if v1 changes
  d.lives = 7; G.Save.save();
  store['super-brady-o-world-save-v1'] = JSON.stringify(Object.assign({}, v1, { settings: Object.assign({}, v1.settings, { music: 0.9 }) }));
  const G2 = loadGame({ load: true, store });
  check('a second boot keeps the v2 save (no second copy)', G2.Save.data.settings.music === 0.2 && G2.Save.data.lives === 7, { music: G2.Save.data.settings.music, lives: G2.Save.data.lives });
}
console.log(bad ? `${bad} SAVE CHECK(S) FAILED` : 'ALL SAVE CHECKS PASSED');
process.exit(bad ? 1 : 0);
