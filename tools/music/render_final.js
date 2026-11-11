// final renders: full songs (intro + one loop + 6 s past the loop point) and 30-second excerpts, before and after
const { renderMany } = require('./render.js');
const B = require('./defs_before.json'), A = require('./defs_after.json'), fs = require('fs');
const after = ['tour_title', 'tour_map', 'tour_map_mx', 'tour_mx', 'tour_mx_canal', 'tour_mx_deep', 'tour_mx_volcan', 'tour_mx_boss'];
const len = { tour_title: 66.2, tour_map: 76.8, tour_map_mx: 76.8, tour_mx: 68.9, tour_mx_canal: 63.75, tour_mx_deep: 64.3, tour_mx_volcan: 69.5, tour_mx_boss: 52 };
(async () => {
  const jobs = [];
  for (const n of after) {
    jobs.push({ name: n, def: A.defs.sbw[n], seconds: Math.ceil(len[n] + 6), out: `after/${n}_full.wav` });
    jobs.push({ name: n, def: A.defs.sbw[n], seconds: 30, out: `after/${n}_30s.wav` });
  }
  const r = await renderMany('../music/src/01_audio.js', jobs, { log: true });
  fs.writeFileSync('after/render_stats.json', JSON.stringify(r, null, 1));
  const bj = [];
  for (const n of ['tour_title', 'title', 'tour_map', 'tour_mx', 'tour_mx_deep', 'tour_mx_volcan', 'tour_mx_boss'])
    bj.push({ name: n, def: B.defs.sbw[n] || null, seconds: 30, out: `before/${n === 'title' ? 'title_screen_title' : n}_30s.wav` });
  await renderMany('engine_before/01_audio.js', bj, { log: true });
})();
