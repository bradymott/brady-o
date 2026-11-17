/* ============================================================
   World tour: the story's touches on the boss fights
   (docs/design/STORY_PIWI.md §3.3, §3.4). Loads after every country,
   so all the bosses are registered. Nothing here changes a fight.
   - Tonight's act: when a land's boss wakes, its intro banner says
     what Piwi hired it as ("THE WARM-UP ACT: EL GRAN PIÑATÓN").
   - Pupo's verdict: when the act falls, Pupo pokes (or looks for)
     its belly button: one slow line over Brady-O.
   - World 22's encore: when the Other Brady's mirror cracks, Piwi
     pops out from behind it. Before the Nepal finale he flees to
     rehearse; after it, he puts on his last show for an audience
     of Chinka-O, and gets three stars.
   ============================================================ */
(() => {
if (typeof BOSS_BRAINS === 'undefined' || typeof Boss === 'undefined') return;
const K = TourKit;
const ACTS = {
  mx_pinata: 'THE WARM-UP ACT', ec_tortoise: 'THE WALKING STAGE', br_toucan: 'THE FLYING USHER', mz_hermit: 'THE PROPS MASTER',
  ma_berrad: 'THE MAGICIAN', es_paella: 'COOKING WITH PIWI', fr_souffle: 'THE PASTRY CHEF', nl_cheese: 'THE ONLY PAYING FAN',
  id_kera: 'THE SCRIPT THIEF', vn_phin: 'THE CATERER', jp_kappa: 'THE CO-STAR', aq_walrus: 'THE CRITIC', np_baron: 'THE GRAND FINALE'
};
const VERDICTS = {
  mx_pinata: '...good... pupo.', ec_tortoise: '...your pupo... is inside... your house.', br_toucan: '...next... year.',
  mz_hermit: '...which shell... has... the pupo.', ma_berrad: '...hot... pupo.', es_paella: '...I found... one rice.',
  fr_souffle: '...sorry.', nl_cheese: '...a pupo... in the cheese.', id_kera: '...best... friend.', vn_phin: '...one sip... still slow.',
  jp_kappa: '...bowing... back...', aq_walrus: '...too polite... to look.'
};
for (const id in ACTS) {
  const B = BOSS_BRAINS[id]; if (!B) continue;
  const wake = B.wake;
  B.wake = function (b) { if (wake) wake.call(this, b); b.g.bannerText = ACTS[id] + ': ' + b.name; b.g.bannerT = Math.max(b.g.bannerT || 0, 2.6); };
}
const die = Boss.prototype.die;
Boss.prototype.die = function () {
  die.call(this);
  const g = this.g, p = g && g.player, v = VERDICTS[this.style];
  if (v && p && !p.dead) K.say(g, p, 'PUPO: ' + v.toUpperCase(), '#f0d8b0');
  if (this.style === 'w22_other' && g) g.spawn(new W22Encore(g, { x: (this.arenaX0 + this.arenaX1) / 2, y: this.floorY }));
};

/* World 22: Piwi behind the mirror, with his carved understudy of Brady-O */
class W22Encore extends Ent {
  constructor(g, s) {
    super(g, s, 30, 60); this.friendly = true; this.t = 0; this.post = !!Save.data.beatGame; this.i = -1; this.next = 1.2; this.gone = false;
    this.script = this.post ? [
      ['piwi', 'talk', '...FINE. NO TRUNK. NO SCENERY. NO ACTS.'],
      ['piwi', 'talk', 'ONE LAST SHOW? FOR AN AUDIENCE OF... THREE?'],
      ['piwi', 'gloat', 'TA-DAAA! THANK YOU! THANK YOU!'],
      ['chinka', 'unimpressed', 'TWO STARS FOR THE SHOW. ONE FOR THE BOW.'],
      ['piwi', 'startled', 'THREE STARS!'],
      ['pupo', 'idle', 'PUPO: ...I MADE YOU... A PUPO.'],
      ['piwi', 'gloat', 'PUPPET THEATRE, MEXICO CITY. MATINÉES DAILY. NO HOOKS!']
    ] : [
      ['piwi', 'startled', 'MY UNDERSTUDY! RUINED!'],
      ['piwi', 'talk', 'FINE! SEE YOU AT THE FINALE, MISTER BUN!']
    ];
    this.pose = 'startled';
  }
  update(dt) {
    this.t += dt; this.next -= dt;
    if (this.next <= 0 && this.i < this.script.length - 1) {
      this.i++; this.next = 2.6;
      const [who, pose, line] = this.script[this.i];
      if (who === 'piwi') this.pose = pose; else if (who === 'chinka') this.chinkaPose = pose;
      const at = who === 'pupo' ? this.g.player : this;
      if (at) K.say(this.g, at, line, who === 'chinka' ? '#ff9ad8' : who === 'pupo' ? '#f0d8b0' : '#ffd23a');
      if (this.i === this.script.length - 1) this.leaveT = 2.6;
    }
    if (this.leaveT != null) { this.leaveT -= dt; if (this.leaveT <= 0) { this.x += (this.post ? 0 : 7 * TS) * dt; this.fade = Math.min(1, (this.fade || 0) + dt); if (this.fade >= 1) this.remove = true; } }
  }
  draw(ctx) {
    const a = 1 - (this.fade || 0); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const x = this.cx, y = this.y + this.h;
    // the understudy: a carved wooden Brady-O, limp on Piwi's arm
    Ink.around(ctx, x - 70, y - 90, 140, 96, c => {
      c.save(); c.translate(x - 20, y); c.rotate(0.25); c.scale(0.8, 0.8);
      drawBrady(c, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'idle', t: 0, phase: 0 }, hair: null, look: Save.data.look, time: 0 });
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(214,150,90,0.55)'; c.fillRect(-60, -90, 120, 100); c.globalCompositeOperation = 'source-over'; c.restore();
      Piwi.draw(c, { x: x + 6, y, scale: 1.25, t: this.t, pose: this.pose || 'startled', facing: -1 });
      if (this.post && this.i >= 1) ChinkaO.draw(c, { x: x + 52, y, scale: 1, t: this.t, pose: this.chinkaPose || 'unimpressed', facing: -1 });
    }, { pad: 10, width: 1.0, color: '#120e16', rim: '#e7e3d7', hero: true });
    ctx.restore();
  }
}
try { window.BRADY_STORY_ACTS = { ACTS, VERDICTS, W22Encore }; } catch (e) { /* not in a browser */ }
})();
