/* ============================================================
   World tour: the Encore Tour's story (docs/design/ENCORE_TOUR.md §1).
   Worlds 14 to 18 follow Nepal's Grand Finale. Loads after every land.
   - The opening: once Nepal's boss has fallen, the next visit to the
     map plays four panels (Chinka-O turns the tour poster over).
   - The acts: each Encore boss wakes under the banner
     "THE ACT NOBODY CANCELLED", and Pupo has a line when it falls.
   - The ending: four panels the first time the Moon's boss is beaten.
   Nothing here changes a level or a fight.
   ============================================================ */
(() => {
if (typeof Tour === 'undefined' || typeof StoryScene === 'undefined' || typeof TourCast === 'undefined') return;
const ENCORE = ['it', 'ke', 'au', 'is', 'moon'];
const built = () => ENCORE.filter(cc => Tour.countries[cc]);
const lastBuilt = () => { const b = built(); return b.length ? Tour.countries[b[b.length - 1]] : null; };

// the tour poster, front or back, held up between the cast
function poster(ctx, x, y, s, back, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.3) * 0.03 - 0.05); ctx.scale(s, s);
  ctx.fillStyle = '#1c1426'; ctx.fillRect(-46, -66, 92, 132);
  ctx.fillStyle = back ? '#fff6e0' : '#d6307a'; ctx.fillRect(-42, -62, 84, 124);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (back) {
    ctx.fillStyle = '#1c1426'; ctx.font = `bold 9px ${FONT_UI}`; ctx.fillText('PLUS', 0, -46);
    ctx.font = `bold 8px ${FONT_UI}`;
    ['ITALY', 'KENYA', 'AUSTRALIA', 'ICELAND'].forEach((n, i) => ctx.fillText(n, 0, -28 + i * 15));
    ctx.fillStyle = '#d6307a'; ctx.font = `bold 10px ${FONT_UI}`; ctx.fillText('THE MOON', 0, 36);
    ctx.fillStyle = '#1c1426'; ctx.font = `6px ${FONT_UI}`; ctx.fillText('no refunds', 0, 52);
  } else {
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 13px ${FONT_UI}`; ctx.fillText('PIWI!', 0, -40);
    ctx.fillStyle = '#fff6e0'; ctx.font = `bold 8px ${FONT_UI}`; ctx.fillText('WORLD TOUR', 0, -22);
    ctx.fillStyle = 'rgba(255,246,224,0.75)'; for (let i = 0; i < 6; i++) ctx.fillRect(-28, -8 + i * 10, 56 - (i % 3) * 8, 4);
  }
  ctx.restore();
}
// a small Earth in the sky (the Moon's panels)
function earth(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a8ad8'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.fillStyle = '#5ac05a';
  ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.2, r * 0.42, r * 0.3, 0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.4, y + r * 0.3, r * 0.34, r * 0.46, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x - r * 0.1, y + r * 0.55, r * 0.6, r * 0.12, 0.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.2, y - r * 0.6, r * 0.5, r * 0.1, -0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(10,10,40,0.28)'; ctx.beginPath(); ctx.arc(x + r * 0.5, y + r * 0.2, r * 1.1, 0, TAU); ctx.fill();
  ctx.restore();
}
// the grey ground of the Moon over a night stage
function moonStage(ctx, W, H, t) {
  const st = storyStage(ctx, W, H, t, 'tour_dusk');
  ctx.fillStyle = '#0c0a1e'; ctx.fillRect(0, 0, W, st.gy);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { const x = (i * 137.5) % W, y = (i * 71.3) % Math.max(1, st.gy - 20), a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i)); ctx.globalAlpha = a; ctx.fillRect(x, y, 1.6, 1.6); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c1426'; ctx.fillRect(0, st.gy - 3, W, H - st.gy + 3);
  ctx.fillStyle = '#b8bcc8'; ctx.fillRect(0, st.gy, W, H - st.gy);
  ctx.fillStyle = '#9498a8'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(((i * 211) % W), st.gy + 14 + (i % 3) * 16, 18 + (i % 4) * 7, 4 + (i % 3) * 2, 0, 0, TAU); ctx.fill(); }
  earth(ctx, W * 0.8, st.gy * 0.3, Math.min(W, H) * 0.09);
  return st;
}

function EncoreIntroPanels() {
  const C = TourCast;
  return [
    { text: 'Home at last? Not quite. Chinka-O turned Piwi\'s tour poster over. On the back, in very small print: "PLUS FIVE MORE DATES."',
      scene(ctx, W, H, t, pt) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_himalaya'); C.pupo(ctx, W * 0.16, gy, s * 0.8, t, 'idle', 1); C.brady(ctx, W * 0.34, gy, s, t, 'idle', 1); C.chinka(ctx, W * 0.72, gy, s, t, 'idle', -1); poster(ctx, W * 0.54, gy - 60 * s, s * 0.5, pt > 1.1, t); } },
    { text: 'The posters are up. The acts are booked, and paid in advance. The scenery was shrunk and posted ahead weeks ago. Nobody cancelled the second half of the tour.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_dusk'); for (let i = 0; i < 5; i++) poster(ctx, W * (0.14 + i * 0.18), gy - (62 + (i % 2) * 22) * s, s * 0.36, i % 2 === 1, t + i); C.pupo(ctx, W * 0.5, gy, s * 0.8, t, 'sad', 1); } },
    { text: 'Chinka-O: "Then we cancel it ourselves. I\'ll go ahead and talk to the venues. You two put the landmarks back." Pupo: "...more... trip."',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_title'); C.pupo(ctx, W * 0.2, gy, s * 0.8, t, 'happy', 1); C.brady(ctx, W * 0.4, gy, s, t, 'idle', 1); C.chinka(ctx, W * 0.62, gy, s, t, 'wave', -1); } },
    { text: 'THE ENCORE TOUR. Italy. Kenya. Australia. Iceland. And the last date on the poster... no, that can\'t be right. The MOON? Fly on from Nepal\'s port.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'tour_title'); C.pupo(ctx, W * 0.34, gy, s * 0.9, t, 'ride', 1, true); poster(ctx, W * 0.68, gy - 62 * s, s * 0.55, true, t); } }
  ];
}
function EncoreEndPanels() {
  const C = TourCast;
  return [
    { text: 'The headliner takes her bow. The very last show of Piwi Squirmin\'s World Tour is cancelled, and the crater pops back into the Moon with a soft, dusty FWOOMP.',
      scene(ctx, W, H, t) { const { gy, s } = moonStage(ctx, W, H, t); C.brady(ctx, W * 0.4, gy, s, t, 'idle', 1); C.pupo(ctx, W * 0.2, gy, s * 0.8, t, 'happy', 1); } },
    { text: 'Chinka-O: "Every tour date, and every landmark back where it belongs." Brady-O: "And you did a pirouette on the Moon." Chinka-O: "Somebody had to."',
      scene(ctx, W, H, t) { const { gy, s } = moonStage(ctx, W, H, t); C.brady(ctx, W * 0.32, gy, s, t, 'idle', 1); C.chinka(ctx, W * 0.56, gy - Math.abs(Math.sin(t * 1.2)) * 26 * s, s, t, 'pirouette', -1); } },
    { text: 'Pupo looks down at the Earth for a very long time. "...home... is the round one." Then, very slowly, he pokes the Moon. "...no pupo. ...just holes."',
      scene(ctx, W, H, t) { const { gy, s } = moonStage(ctx, W, H, t); C.pupo(ctx, W * 0.5, gy, s, t, 'poke', 1); } },
    { text: 'So the three of them went home the long way round, with two passports that had run out of pages. THE END. (Again.)  Thank you for playing, Brady.',
      scene(ctx, W, H, t) { const { gy, s } = moonStage(ctx, W, H, t); C.pupo(ctx, W * 0.3, gy, s * 0.9, t, 'ride', 1, true); C.chinka(ctx, W * 0.62, gy, s, t, 'wave', -1); } }
  ];
}

/* the opening: the first visit to the map after Nepal's boss has fallen (and at least one Encore land exists) */
const Encore = {
  ENCORE, EncoreIntroPanels, EncoreEndPanels,
  introDue() { const np = Tour.countries.np; return !!np && built().length > 0 && TourProgress.bossDone(np) && !Save.data.seenEncoreIntro; },
  endDue(id) { const L = lastBuilt(); return !!L && id === L.world + '-' + L.mainCount && L.id === 'moon' && !Save.data.seenEncoreEnd; },
  music() { const n = Sound.trackNames || []; return n.indexOf('tour_title') >= 0 ? 'tour_title' : undefined; }
};
if (typeof TourMapScene !== 'undefined' && typeof goToMap === 'function') {
  const go0 = goToMap;
  goToMap = function (set, world, fromId) {
    if (set === 'world' && Encore.introDue()) {
      Game.setScene(new StoryScene(EncoreIntroPanels(), () => { Save.data.seenEncoreIntro = true; Save.save(); go0(set, world, fromId); }, Encore.music()));
      return;
    }
    return go0(set, world, fromId);
  };
}
/* the ending: the first time the last Encore boss is beaten */
if (typeof Play !== 'undefined') {
  const next0 = Play.prototype.goNext;
  Play.prototype.goNext = function (next) {
    if (this.level && this.level.tour && Encore.endDue(this.id)) {
      const self = this;
      Sound.play('select');
      Game.setScene(new StoryScene(EncoreEndPanels(), () => { Save.data.seenEncoreEnd = true; Save.data.seenEncoreIntro = true; Save.save(); goToMap(self.set, self.level.world, self.id); }, Encore.music()));
      return;
    }
    return next0.call(this, next);
  };
}

/* the acts nobody cancelled: the boss banner, and Pupo's verdict when the act falls */
if (typeof BOSS_BRAINS !== 'undefined' && typeof Boss !== 'undefined' && typeof TourKit !== 'undefined') {
  const VERDICTS = { it: '...needs sauce.', ke: '...big pupo.', au: '...it fell on me.', is: '...rock pupo.', moon: '...over the moon.' };
  const ccOf = style => ENCORE.find(cc => String(style).indexOf(cc + '_') === 0);
  for (const id in BOSS_BRAINS) {
    if (!ccOf(id)) continue;
    const B = BOSS_BRAINS[id], wake = B.wake;
    B.wake = function (b) { if (wake) wake.call(this, b); b.g.bannerText = 'THE ACT NOBODY CANCELLED: ' + b.name; b.g.bannerT = Math.max(b.g.bannerT || 0, 2.6); };
  }
  const die = Boss.prototype.die;
  Boss.prototype.die = function () {
    die.call(this);
    const cc = ccOf(this.style), g = this.g, p = g && g.player;
    if (cc && p && !p.dead) TourKit.say(g, p, 'PUPO: ' + VERDICTS[cc].toUpperCase(), '#f0d8b0');
  };
  Encore.VERDICTS = VERDICTS;
}
try { window.BRADY_ENCORE = Encore; } catch (e) { /* not in a browser */ }
})();
