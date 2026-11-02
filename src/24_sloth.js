/* ============================================================
   Slothy — Brady's ride. Found asleep in hammocks; touch to wake
   him and climb on. He jumps higher, can hang from ceilings
   (press up when you bump one) and hugs enemies into friends
   (action button). If Brady gets hit, Slothy takes it and naps.
   ============================================================ */
class Hammock extends Ent {
  constructor(g, s) {
    super(g, s, 56, 34);
    this.x = s.x - 28; this.y = s.y - 34; this.hasSloth = s.loose ? false : true; this.cool = 0;
    this.loose = !!s.loose; this.napT = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.loose) {
      // a sloth that fell asleep where Brady dropped him; he slowly fades if left too long
      this.napT += dt;
      if (this.napT > 25) { this.remove = true; this.g.burst(this.cx, this.cy, 10, '#c8b89a', 'dust'); }
    }
  }
  touchPlayer(p) {
    if (this.cool > 0 || p.mounted || p.dead || p.state !== 'play') return;
    if (!this.hasSloth && !this.loose) return;
    this.hasSloth = false; if (this.loose) this.remove = true;
    p.mount(this.g);
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    if (!this.loose) {
      // two posts and a striped hammock
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 30, y - 40, 4, 40); ctx.fillRect(x + 26, y - 40, 4, 40);
      ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 26, y - 36); ctx.lineTo(x - 20, y - 26); ctx.moveTo(x + 26, y - 36); ctx.lineTo(x + 20, y - 26); ctx.stroke();
      const sag = this.hasSloth ? 14 : 8;
      const cols = ['#ff7a5a', '#ffd84a', '#38c8ff', '#7aff8a'];
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x - 20, y - 26 + i * 1.6); ctx.quadraticCurveTo(x, y - 26 + sag + i * 2.4 + Math.sin(this.t * 1.5) * 1.5, x + 20, y - 26 + i * 1.6); ctx.stroke();
      }
      if (this.hasSloth) drawSlothy(ctx, { x: x - 6, y: y - 14 + Math.sin(this.t * 1.5) * 1.5, facing: 1, t: this.t, pose: 'sleep' });
      if (this.hasSloth && this.g.player && Math.abs(this.g.player.cx - x) < 90) {
        ctx.fillStyle = '#fff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('WAKE SLOTHY', x, y - 52 + Math.sin(this.t * 4) * 2);
      }
    } else {
      drawSlothy(ctx, { x, y, facing: 1, t: this.t, pose: 'sleep' });
    }
  }
}
ENTITY_TYPES.hammock = Hammock;

Player.prototype.mount = function (g) {
  this.mounted = true; this.hang = false;
  const bottom = this.y + this.h, cx = this.cx;
  this.w = 30; this.h = this.power > 0 ? 58 : 46; this.x = cx - this.w / 2; this.y = bottom - this.h;
  if (!regionFree(g.area, this.x, this.y, this.w, this.h)) { this.h = 40; this.y = bottom - this.h; }
  this.crouch = false;
  Sound.play('mount'); Sound.play('sloth', { vol: 0.6 });
  g.toast('SLOTHY! ACTION BUTTON = HUG · UP ON A CEILING = HANG');
  g.burst(this.cx, this.y + this.h, 12, '#c8b89a', 'dust');
  g.slothMusic = true; Sound.music('sloth');
};
Player.prototype.dismount = function (hit) {
  if (!this.mounted) return;
  const g = this.g;
  this.mounted = false; this.hang = false;
  const bottom = this.y + this.h, cx = this.cx;
  const d = this.power > 0 ? PLAYER_DIM.big : PLAYER_DIM.small;
  this.w = d.w; this.h = d.h; this.x = cx - d.w / 2; this.y = bottom - d.h;
  // Slothy plops down for a nap right here
  const sp = { type: 'hammock', x: cx - this.facing * 20, y: bottom, loose: true };
  const hm = new Hammock(g, sp); hm.cool = 1.2; hm.y = bottom - hm.h;
  g.spawn(hm);
  Sound.play('dismount');
  if (hit) { this.invuln = 1.6; this.vy = -9 * TS; this.vx = -this.facing * 3 * TS; g.shake(4); g.toast('SLOTHY NEEDS A NAP'); }
  g.slothMusic = false; g.resumeMusic();
};
