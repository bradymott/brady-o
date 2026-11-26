/* ============================================================
   Keep it (Brady, 26 Nov 2026):
   1. TIMED POWERS THROUGH DOORS. "A lot of the times when you get the invincibility thing it's in a secret
      room, and the secret room doesn't allow you to keep it. When you exit the door, it would be good if you
      could keep it." A door, pipe, hatch, seam (the backstage edges) or any other area change builds a new
      Player (Play.loadArea), which started with no star, no LSD flight, no toad / float and no jump power
      left over. Now the time left on each of them comes along, and the star's music keeps playing (the area's
      own track waits until the star wears off: Player.update -> Play.resumeMusic, as before).
   2. COINS ADD UP. The coin counter used to roll over to 00 at 100 (a 1UP), so on most levels it looked as if
      the coins from the last level were gone. Now it is a running total that never rolls over (kept in the save
      as before: Save.data.picks, so between levels, lands and sessions), and every 100 coins collected still
      give a 1UP: Save.data.coinsEarned counts every coin picked up, ever (an old save starts it at its coins).
      Spending at a Souvenir Stand or losing coins to a thief takes from the total, not from the 1UP count.
   3. TITLE MUSIC. The title screen asked for the old festival anthem before any touch, and browsers keep audio
      locked until the first touch; most first touches are TAP TO PLAY, which leaves the title at once, so the
      title was silent. Now it has its own warm theme ('sbw_title'), which starts on the first touch or key on
      the title (the audio unlocks then: 02_input.js; the title asks for it in its constructor, 28_tour_gt_title.js); until then a small "TAP FOR MUSIC" note shows on the
      title. The music setting / mute is respected (the music bus volume), and the story / map songs cross-fade
      in as before (Sound.music fades the old track out).
   ============================================================ */

/* ---------- 1. timed powers through doors ---------- */
const TourKeep = {
  // what a new area's Player gets from the old one (the rest already travels: form, pack, kandi, fx, sig, hands, buffs)
  take(p) {
    if (!p || p.dead || p.state === 'dead') return null;
    const k = {};
    if (p.star > 0) k.star = p.star;
    if (p.lsdT > 0) k.lsdT = p.lsdT;
    if (p.glideT > 0) k.glideT = p.glideT;
    if (p.fly > 0) k.fly = p.fly;
    if (p.floaty > 0) k.floaty = p.floaty;
    if (p.invuln > 0) k.invuln = p.invuln;
    if (p.jumpPow && p.jumpPow.id) k.jumpPow = Object.assign({}, p.jumpPow, { pants: 0, down: false });
    return k;
  },
  give(q, k) {
    if (!q || !k) return;
    for (const f of ['star', 'lsdT', 'glideT', 'fly', 'floaty', 'invuln']) if (k[f] > 0 && !(q[f] >= k[f])) q[f] = k[f];
    if (k.jumpPow && !q.jumpPow) q.jumpPow = k.jumpPow;
  }
};
{
  const la = Play.prototype.loadArea;
  Play.prototype.loadArea = function (idx, x, y, power) {
    // the first area of a level (the constructor) has no Player yet: nothing to keep
    const keep = this.player ? TourKeep.take(this.player) : null;
    const r = la.call(this, idx, x, y, power);
    if (keep) TourKeep.give(this.player, keep);
    return r;
  };
  // the star's song plays on through a door (enterPortal / seamTo ask for the area's song right after the swap);
  // when the star wears off Player.update calls resumeMusic, which asks again with the star at 0
  const mus = Play.prototype.mus;
  Play.prototype.mus = function (name) {
    const p = this.player;
    if (name !== 'star' && name !== 'clear' && p && p.star > 0 && this.state === 'play' && !p.dead) return mus.call(this, 'star');
    return mus.call(this, name);
  };
}

/* ---------- 2. coins add up ---------- */
Play.prototype.addPick = function (x, y) {
  const d = Save.data;
  this.picks++; d.picks = this.picks;
  d.score += 50;
  Sound.play('pick');
  if (x !== undefined) this.burst(x, y, 4, '#ffd84a', 'spark');
  // every 100 coins picked up give a 1UP (an old save counts from the coins it holds)
  const was = Number.isFinite(d.coinsEarned) ? d.coinsEarned : Math.max(0, this.picks - 1);
  d.coinsEarned = was + 1;
  if (Math.floor(d.coinsEarned / 100) > Math.floor(was / 100)) this.addLife(x, y);
};
// a thief that pockets coins without telling the save (TourBehave's flee) would hand them back at the next level
if (typeof TourHooks !== 'undefined') TourHooks.on('playUpdate', play => { if (Save.data && Number.isFinite(play.picks) && Save.data.picks !== play.picks) Save.data.picks = play.picks; });

/* ---------- 3. title music ---------- */
// "Postcards Home": G major, 116 bpm, 16 bars (about 33 s a loop). A whistled tune over harp and strings, in the
// family of the tour's own songs (tour_title, tour_map): the opening leap, a lift in bar 11, home in bar 16.
Sound.addTrack && Sound.addTrack('sbw_title', {
  bpm: 116, bars: 16, rv: 0.28, dl: 0.14, pump: 0.2, sw: 0.06,
  ch: 'G D Em C G Bm C D Em C G D C Am D G',
  ld: 'D5:2 G5:2 B5:4 A5:2 G5:2 D5:4 | F#5:2 A5:2 D6:4 C6:2 B5:2 A5:4 | G5:2 B5:2 E6:4 D6:2 B5:2 G5:4 | A5:4 G5:2 E5:2 G5:8 |' +
      'D5:2 G5:2 B5:4 D6:4 B5:4 | D6:2 C6:2 B5:4 A5:4 F#5:4 | E5:2 G5:2 C6:4 B5:2 A5:2 G5:4 | A5:12 .:4 |' +
      'B5:4 G5:2 B5:2 E6:4 D6:4 | C6:4 B5:2 A5:2 G5:4 E5:4 | D5:2 G5:2 B5:2 D6:2 G6:6 F#6:2 | E6:4 D6:4 A5:8 |' +
      'E6:2 D6:2 C6:4 G5:4 E5:4 | C6:2 B5:2 A5:4 E5:4 C6:4 | B5:2 C6:2 D6:4 C6:2 B5:2 A5:4 | G5:12 .:4',
  li: 'whistle', lv: 0.13,
  l2: 'B4:16 | A4:16 | B4:16 | C5:16 | B4:16 | B4:16 | C5:16 | A4:8 F#4:8 | B4:16 | C5:16 | D5:16 | A4:16 | G4:16 | A4:16 | A4:8 F#4:8 | G4:16',
  l2i: 'strings', l2v: 0.05,
  bp: 'r...r.f.r...o.f.', bi: 'pluckb', bv: 0.27,
  ap: '0.2.1.3.0.2.1.3.', ai: 'harp', av: 0.045, ao: 64,
  pd: 'c---------------', pi: 'pad', pv: 0.03, po: 55,
  dr: ['k.......k..k....', '....c.......c...', 'h.h.h.h.h.h.h.h.', 'w...........w...'], dv: 0.36
});
if (typeof SBWTitleScene !== 'undefined') {
  // until the audio is unlocked: a small note in the corner that a touch brings the music
  const dr0 = SBWTitleScene.prototype.draw;
  SBWTitleScene.prototype.draw = function (ctx) {
    const r = dr0.call(this, ctx);
    if (!(Sound.musicBus && Sound.musicBus()) && !this.go && this.t > 1.2 && Save.data.settings.music > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (this.t - 1.2) * 2) * (0.6 + 0.25 * Math.sin(this.t * 3));
      ctx.font = `11px ${FONT_UI}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
      ctx.fillText('♪ TAP FOR MUSIC', Game.cssW - Math.max(14, insets.r + 10), Math.max(10, insets.t + 8));
      ctx.restore();
    }
    return r;
  };
}
try { window.BRADY_KEEP = TourKeep; } catch (e) { /* not in a browser */ }
