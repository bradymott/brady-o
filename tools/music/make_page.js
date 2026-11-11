// Writes after/listen_ab.html: before / after players per song, what changed, and the measurements.
const fs = require('fs');
const B = JSON.parse(fs.readFileSync('analysis_before.json', 'utf8')), A = JSON.parse(fs.readFileSync('analysis_after.json', 'utf8'));
const meas = (arr, f) => arr.find(x => x.file === f) || null;
const SONGS = [
  { id: 'tour_title', title: 'Title theme (the Brady-O main theme)', where: 'Title screen and the opening story panels. Before, the title screen played an older festival house track and the story panels a short brass loop; both are shown.',
    before: [['tour_title', 'Old story-panel theme'], ['title_screen_title', 'Old title-screen track']],
    what: 'C major, 116 beats a minute, 4/4. Form: 2-bar intro (celesta hints) · A: the hook on two trumpets in thirds · B: lifts to F, violins sing a long tune and the trumpets answer with bits of the hook · A again under a violin counter-melody · 4-bar bridge in A minor (celesta and pizzicato strings play the motif in minor) · 2-bar fanfare with a snare roll, back to A. One loop is 62 seconds.',
    hook: 'G A | C· E· D C A | G … then C· E· G A G | E D | D· E· G E D | C· A· C D E | F· E· D B D | C', band: 'Trumpets in thirds, violins, celesta, pizzicato strings, nylon guitar, plucked upright bass, soft pad, a gentle drum kit.' },
  { id: 'tour_map', title: 'Map theme', where: 'The walkable world map (every land except Mexico).', before: [['tour_map', 'Old map theme']],
    what: 'F major, 100 beats a minute with a gentle shuffle. A: accordion hums the motif · A again on flute · B: accordion and flute trade two-bar phrases · A on both, in thirds. One loop is 77 seconds (it never repeats a bar in a row like the old 19-second loop did).',
    hook: 'C D | F A G F D | C … F A C D C | A G', band: 'Accordion and flute leads, ukulele strum, upright bass, brushes, celesta sparkles at the phrase ends.' },
  { id: 'tour_map_mx', title: 'Map theme, Mexico flavour', where: "The world map while Mexico is selected: the same tune in Mexico's colours (cheap to repeat for every land).", before: [['tour_map', 'Old map theme']],
    what: 'Same tune and form as the map theme; lighter shuffle.', hook: 'as the map theme', band: 'Soft trumpets in thirds, violin, vihuela strum, guitarrón, claves and shaker, a harp sparkle.' },
  { id: 'tour_mx', title: 'Mexico level theme', where: 'Every Mexico level (all areas use this song today).', before: [['tour_mx', 'Old Mexico level theme']],
    what: 'D major, a 6/8 son at 108 dotted-quarter beats a minute. Intro: the vihuela strums alone, guitarrón joins, violins hold a note, trumpets pick up. A (16 bars): the hook on two trumpets in thirds, climbing, with the classic 3-against-2 hemiola cadence (D G B | C# B A). B (16 bars): violins in thirds sing, trumpets answer. A again with violins soaring above. Interlude: harp arpeggios of the motif over zapateado heel-stomps and a rattling jawbone (quijada). 2-bar hemiola turnaround. Underneath, the strum alternates 6/8 and 3/4 (sesquiáltera), the mariachi heartbeat. One loop is 64 seconds.',
    hook: 'A B | D· F# E D B | A … D· F# A B | A· F# E D | B A G F# E | E G# B D B | C# A B G E | D', band: 'Trumpets, violins, vihuela, guitarrón, harp, light percussion (kick, shaker, claves, zapateado, quijada).' },
  { id: 'tour_mx_canal', title: 'Mexico: Xochimilco canals (calm)', where: 'New, for the canal level 1-2. Not heard in the game yet: the level builder only plays the land\'s main song (see the report).', before: [],
    what: 'G major waltz (vals), 96 beats a minute. Harp intro · A: violin sings, then flute takes the tune with the violin a third below · B: a warmer middle with a borrowed C-minor colour, flute a sixth under the violin. One loop is 60 seconds.',
    hook: '(D E) | G B A G | E D | G B D E | D C B A', band: 'Violin, flute, harp, guitar on beats 2 and 3, guitarrón, soft pad, water drops and a triangle.' },
  { id: 'tour_mx_deep', title: 'Mexico: Cenote (underwater, echoing)', where: 'For the cenote 1-3 and the Pit of Swallows (same note as above).', before: [['tour_mx_deep', 'Old cenote theme']],
    what: 'E dorian, slow 6/8 (56 dotted-quarter beats a minute). Marimba states the motif with long dotted echoes; a celesta repeats it an octave up while the marimba harmonises; slow harp, a pad, a heartbeat hand drum, bubbles and drops. One loop is 60 seconds.',
    hook: 'B C# | E· G F# E C# | B …', band: 'Marimba, celesta, harp, pad, upright bass, bubbles.' },
  { id: 'tour_mx_volcan', title: 'Mexico: Volcán (driving minor)', where: 'For the volcano level 1-4 (same note as above).', before: [['tour_mx_volcan', 'Old volcano theme']],
    what: 'E minor, 152 beats a minute, a driving polka-rock beat. A: the hook in minor on trumpets in thirds · A again with violins · B: violins and trumpets trade phrases in G major · breakdown: toms, violin tremolo, the motif stretched into long notes · A · snare-roll turnaround. One loop is 66 seconds.',
    hook: 'B C | E· G· F# E C | B …', band: 'Trumpets, violins, vihuela chops, guitarrón, drum kit with toms and a quijada.' },
  { id: 'tour_mx_boss', title: 'Mexico boss: El Gran Piñatón', where: 'The boss fight.', before: [['tour_mx_boss', 'Old boss theme']],
    what: 'D minor 6/8, 120 dotted-quarter beats a minute. Alarm (repeated A on trumpets) · A: the hook in minor · A again with violins · B: rising 3/4 hemiola sequences (B-flat, C, D minor, E7) and fast arpeggios · C: zapateado and pizzicato hook · D: the hook an octave up on trumpets and violins · alarm turnaround. One loop is 50 seconds.',
    hook: 'A Bb | D· F E D Bb | A …', band: 'Trumpets, violins, pizzicato, vihuela, guitarrón, toms and zapateado.' }
];
const row = m => m ? `<td>${m.lufs}</td><td>${m.truePeak}</td><td>${m.width}</td><td>${m.centroidHz}</td><td>${m.bands.bass}%</td>` : '<td colspan=5>-</td>';
let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brady-O Music A/B</title>
<style>
:root{--bg:#fbf7f0;--ink:#2a2118;--mute:#7a6a58;--card:#fff;--line:#eadfce;--acc:#d2452b;--acc2:#1a8c8c}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#1d1813;--ink:#f3eadc;--mute:#b3a28c;--card:#28211a;--line:#3d3328;--acc:#ff7a5c;--acc2:#4fd0d0}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:920px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;margin:0 0 6px}
.lead{color:var(--mute);margin:0 0 20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:16px 0}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}
@media (max-width:640px){.pair{grid-template-columns:1fr}}
.lab{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.b .lab{color:var(--mute)}.a .lab{color:var(--acc)}
audio{width:100%;margin:4px 0 8px}
.small{font-size:14px;color:var(--mute)}
code{background:var(--line);padding:1px 5px;border-radius:5px;font-size:14px}
table{border-collapse:collapse;width:100%;font-size:14px;margin-top:8px}th,td{border-bottom:1px solid var(--line);padding:6px 4px;text-align:left}
.wrap{overflow-x:auto}
</style></head><body><main>
<h1>Brady-O music: before and after</h1>
<p class="lead">A pilot for the new music direction: the title, the map and Mexico. Each song has the old version and the new one (a 30-second taste and the full song, which runs past its loop point so you can hear it wrap around). Whether it is catchier is your call: only your ears can judge that. Everything is original, rendered from the game's own sound engine.</p>
<div class="card"><h2>The main motif</h2><p>Every new song quotes one short tune, so the game has a musical identity: two pick-up notes, then a skip up and back down: <b>"so la | do mi re do la | so"</b> in a 3+3+2 rhythm. In the title it is <code>G A | C E D C A | G</code>; Mexico sings it in 6/8 as <code>A B | D F# E D B | A</code>; the volcano and the boss turn it minor.</p></div>`;
for (const s of SONGS) {
  const aF = meas(A, s.id + '_full.wav');
  html += `<div class="card"><h2>${s.title}</h2><p class="small">${s.where}</p><p>${s.what}</p><p><b>Hook:</b> <code>${s.hook}</code><br><b>Band:</b> ${s.band}</p><div class="pair"><div class="b">`;
  if (!s.before.length) html += '<div class="lab">Before</div><p class="small">No old song (the canals used the main Mexico theme).</p>';
  for (const [f, lab] of s.before) html += `<div class="lab">Before: ${lab}</div><div class="small">30 s</div><audio controls preload="none" src="../before/${f}_30s.wav"></audio><div class="small">60 s</div><audio controls preload="none" src="../before/${f}_60s.wav"></audio>`;
  html += `</div><div class="a"><div class="lab">After</div><div class="small">30 s</div><audio controls preload="none" src="${s.id}_30s.wav"></audio><div class="small">Full song + loop</div><audio controls preload="none" src="${s.id}_full.wav"></audio></div></div>`;
  html += `<div class="wrap"><table><tr><th></th><th>Loudness (LUFS)</th><th>Peak (dBTP)</th><th>Stereo width</th><th>Brightness (Hz)</th><th>Bass share</th></tr>`;
  for (const [f] of s.before) html += `<tr><td>Before</td>${row(meas(B, f + '_60s.wav'))}</tr>`;
  html += `<tr><td>After</td>${row(aF)}</tr></table></div></div>`;
}
html += `<div class="card"><h2>How to read the numbers</h2><p class="small">Loudness: about the same as before on purpose, so the music still sits under the sound effects. Peak: nothing clips (0 dB is the ceiling). Stereo width: side-to-middle energy; the old songs were almost mono. Brightness: the spectral centre; the old songs were dark and boomy (most of their energy was bass), the new ones put the tune in front. The written-out scores are in <code>scores.txt</code> next to this page.</p></div>
</main></body></html>`;
fs.writeFileSync('after/listen_ab.html', html);
console.log('wrote after/listen_ab.html');
