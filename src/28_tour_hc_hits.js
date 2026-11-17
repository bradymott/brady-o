/* ============================================================
   World tour: what a hit costs Brady (the hit ladder). ONE place for
   the whole order, the outermost tour wrapper of Player.hurt (the
   gear, jump-power and carry wrappers in 28_tour_dg_gear.js,
   28_tour_di_jumps.js and 28_tour_hb_systems.js sit inside it and
   are now only reached for the cases this file passes through).
   Each hit takes away exactly ONE thing, first to last:
     1 the HANDS item (gear, the Hard Hat included, or the country's
       signature item),
     2 the jump power (the FEET slot: Spring Socks, Pound Cake,
       Magic Beans),
     3 the kandi bracelet (the gift's extra hit),
     4 the joint (smoke puffs) -> big,
     5 big (the magic mushroom) -> small,
     6 small with nothing left: a life.
   What is lost pops off him and falls away (it can't be picked up
   again: before this, the item floated right where he stood for
   two seconds and he walked straight back into it, so a hit often
   cost nothing at all). After every step: the normal 2 s flicker,
   so one touch never takes two things.
   Not part of the ladder: the star (no damage, unchanged), the
   Backpack (a reserve, never lost to a hit), trips and timed
   effects (LSD flight, the trip colours, magnet and sundial buffs:
   effects, not armour; a hit neither ends them nor is absorbed by
   them). Passed through unchanged to the older code: not playing,
   dead, the post-hit flicker, the star, riding (mounted), the old
   molly effect. Pits, lava, crushers and the timer call die()
   directly and still kill outright. A grab is released and a
   carried box is dropped, then the ladder takes its one step.
   ============================================================ */
const TourHits = {
  INVULN: 2.0,
  // the step the next hit takes for this Brady
  step(p) {
    if (p.handsKind && p.handsKind()) return 'hands';
    if (p.jumpPow) return 'feet';
    if (p.kandi > 0) return 'kandi';
    if (p.power === 2) return 'joint';
    if (p.power > 0) return 'big';
    return 'life';
  },
  // the lost thing pops off him and falls away
  pop(p, kind, dir) {
    const g = p.g; if (!g || !g.spawn) return;
    g.spawn(new LostPower(g, p.cx, p.y + Math.min(14, p.h * 0.3), kind, dir));
  },
  name(kind) { try { return kind === 'joint' ? 'JOINT' : kind === 'mushroom' ? 'MUSHROOM' : TourPowers.name(String(kind).split('#')[0]); } catch (e) { return ''; } }
};
// a lost power: up, a spin, down off the screen; harmless, never collected
class LostPower extends Ent {
  constructor(g, x, y, kind, dir) {
    super(g, null, 20, 20); this.x = x - 10; this.y = y - 10; this.kind = kind; this.friendly = true; this.lost = true;
    this.vx = (dir || 1) * 1.8 * TS; this.vy = -8.5 * TS; this.life = 1.3; this.rot = 0;
  }
  update(dt) { this.t += dt; this.life -= dt; this.vy += PHYS.gDown * 0.55 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += (this.vx > 0 ? 1 : -1) * 7 * dt; if (this.life <= 0) this.remove = true; }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha = clamp(this.life / 0.4, 0, 1);
    ctx.translate(this.cx, this.cy); ctx.rotate(this.rot); ctx.scale(1.1, 1.1);
    try { if (typeof TourPicker !== 'undefined') TourPicker.icon(ctx, this.kind, 0, 0, this.t, this.g); } catch (e) { /* an unknown kind: nothing drawn */ }
    ctx.restore();
  }
}
{
  const inner = Player.prototype.hurt;
  Player.prototype.hurt = function (src) {
    const g = this.g;
    if (!(g && g.level && g.level.tour) || this.dead || this.state !== 'play' || this.star > 0 || this.invuln > 0 || this.mounted || (this.fx && this.fx.molly > 0)) return inner.call(this, src);
    if (this.grabbedBy) { const gb = this.grabbedBy; this.grabbedBy = null; if (gb.release) gb.release(true); }
    if (this.carrying && this.dropCarry) this.dropCarry('DROPPED IT!');
    const step = TourHits.step(this);
    this.lastHit = step;
    if (step === 'life') { this.die(); return; }
    const away = src && src.x !== undefined ? (this.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) : -this.facing;
    if (step === 'hands') {
      const k = this.handsKind(), hat = this.hands && this.hands.id === 'hat';
      this.clearHands(); TourHits.pop(this, k, away);
      if (hat) { Sound.play('bump'); g.burst(this.cx, this.y, 14, '#ffd84a', 'debris'); g.parts.text(this.cx, this.y - 10, 'CLONK! HAT LOST', '#ffd84a'); }
      else { Sound.play('powerdown', { vol: 0.6 }); g.parts.text(this.cx, this.y - 10, 'LOST ' + TourHits.name(k) + '!', '#ffffff'); }
    } else if (step === 'feet') {
      const k = 'gear:' + this.jumpPow.id; this.jumpPow = null; this.pound = null; TourHits.pop(this, k, away);
      Sound.play('powerdown', { vol: 0.6 }); g.parts.text(this.cx, this.y - 10, 'LOST ' + TourHits.name(k) + '!', '#ffffff');
    } else if (step === 'kandi') {
      this.kandi--; Sound.play('powerdown', { vol: 0.6 });
      g.burst(this.cx, this.cy, 18, '#ff7ad8', 'confetti'); g.parts.text(this.cx, this.y - 8, 'KANDI SNAPPED!', '#ff9ad8');
    } else {
      // the size steps: the joint goes (smoke puffs), then the mushroom (big -> small)
      this.setPower(step === 'joint' ? 1 : 0, true); TourHits.pop(this, step === 'joint' ? 'joint' : 'mushroom', away);
      Sound.play('powerdown'); g.burst(this.cx, this.cy, 12, '#ff4fd8', 'spark');
    }
    this.invuln = TourHits.INVULN; this.hurtFlash = 0.3; g.shake(4);
    this.vx = away * 4 * TS; this.vy = Math.min(this.vy, -6 * TS);
  };
}
try { window.BRADY_HITS = { TourHits, LostPower }; } catch (e) { /* not in a browser */ }
