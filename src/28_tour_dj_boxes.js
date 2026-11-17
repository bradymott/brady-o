/* ============================================================
   World tour: gift boxes open from any side.
   An item block used to open only when Brady bumped it from below, so a box on the floor, under a low ceiling or set
   into a wall was dead. Now any of these opens it (the item then comes out of the open side nearest Brady, see
   ItemSpace in 10_entities.js):
     - landing on it from a jump or a fall (a stomp)
     - the Pound Cake ground pound, on it or right beside it
     - anything thrown, shot or launched hitting it: tacos and every signature-item shot, smoke puffs, rainbow lasers,
       gas puffs, a kicked ball, pot or jar, a rolling enemy
     - THROW pressed right next to it when Brady holds no throwing power (a kick)
   The tell: a closed box Brady stands on or touches rattles a little every second, and the first time a one-line tip
   says how. tools/sbw_items_test.js checks every box of the game can be opened and its item collected.
   ============================================================ */
const BoxOpen = {
  is(t) { return t === T.QBLOCK || t === T.QBRICK; },
  open(g, tx, ty, src, why) {
    if (!this.is(tileAt(g.area, tx, ty))) return false;
    const p = g.player;
    g.bumpBlock(tx, ty, !!(p && p.power > 0), src || p);
    if (why) g.burst(tx * TS + TS / 2, ty * TS + TS / 2, 8, '#fff2c0', 'spark');
    return true;
  },
  // the box tiles a box (x, y, w, h) touches, grown by m px
  touching(A, b, m) {
    const out = [];
    for (let ty = Math.floor((b.y - m) / TS); ty <= Math.floor((b.y + b.h + m - 0.01) / TS); ty++)
      for (let tx = Math.floor((b.x - m) / TS); tx <= Math.floor((b.x + b.w + m - 0.01) / TS); tx++) if (this.is(tileAt(A, tx, ty))) out.push([tx, ty]);
    return out;
  },
  // things that open a box they hit: shots and puffs (friendly, with a lifetime), kicked props, rolling enemies
  thrown(e) {
    if (e.remove || e.item || e.isPlatform) return false;
    const fast = Math.abs(e.vx || 0) > 2 * TS || Math.abs(e.vy || 0) > 4 * TS;
    if (e.friendly && typeof e.life === 'number') return Math.abs(e.vx || 0) + Math.abs(e.vy || 0) > 1.5 * TS;   // moving shots and puffs (not the still sparkle rings)
    if (e.thrownBy && fast) return true;
    if (e.cfg && e.cfg.roll && !e.enemy && fast) return true;
    if (e.enemy && !e.dead && e.mode === 'roll' && fast) return true;
    return false;
  },
  // the side box Brady's kick reaches: the column just in front of him, over his height
  inFront(p) {
    const A = p.g.area, tx = Math.floor((p.facing > 0 ? p.x + p.w + 3 : p.x - 3) / TS);
    for (let ty = Math.floor((p.y + 2) / TS); ty <= Math.floor((p.y + p.h - 2) / TS); ty++) if (this.is(tileAt(A, tx, ty))) return [tx, ty];
    return null;
  },
  // a closed box Brady stands on or touches (the rattle and the tip)
  near(p) {
    const A = p.g.area, under = Math.floor((p.y + p.h + 1) / TS);
    for (const tx of [Math.floor((p.x + 2) / TS), Math.floor((p.x + p.w - 2) / TS)]) if (p.onGround && this.is(tileAt(A, tx, under))) return [tx, under];
    return this.inFront(p);
  }
};
{
  // the stomp, the kick, the rattle and the tip: after Brady's own update
  const up = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const wasGround = this.onGround, vy0 = this.vy;
    const r = up.call(this, dt, inp);
    const g = this.g;
    if (!(g.level && g.level.tour) || this.dead || this.state !== 'play' || g.state !== 'play') return r;
    inp = inp || this.inp || {};
    // landing on a box from a jump or a fall
    if (this.onGround && !wasGround && vy0 > 5 * TS) {
      const ty = Math.floor((this.y + this.h + 1) / TS), xs = [Math.floor((this.x + this.w / 2) / TS), Math.floor((this.x + 2) / TS), Math.floor((this.x + this.w - 2) / TS)];
      for (const tx of xs) if (BoxOpen.open(g, tx, ty, this, 'stomp')) { this.vy = -5 * TS; this.onGround = false; break; }
    }
    // THROW next to a box with nothing to throw: a kick
    if (inp.actionPressed && !this.crouch && !(this.actionUse && this.actionUse())) {
      const b = BoxOpen.inFront(this);
      if (b) { BoxOpen.open(g, b[0], b[1], this, 'kick'); this.throwT = 0.18; Sound.play('kick', { vol: 0.6 }); }
    }
    // the tell: a closed box under or beside him rattles every second; the first time, a tip
    const n = BoxOpen.near(this);
    if (n) {
      this.boxRattle = (this.boxRattle || 0) - dt;
      if (this.boxRattle <= 0) { this.boxRattle = 1.1; g.area.bumps.push({ tx: n[0], ty: n[1], t: 0.18, amp: 2 }); }
      const tips = Save.data.tips || (Save.data.tips = {});
      if (!tips.box) { tips.box = true; g.toast('GIFT BOXES OPEN FROM ANY SIDE: LAND ON ONE, OR PRESS THROW NEXT TO IT'); Save.save(); }
    }
    return r;
  };
  // the ground pound opens the boxes under and right beside his boots too
  const pl = Player.prototype.poundLand;
  if (pl) Player.prototype.poundLand = function () {
    const r = pl.apply(this, arguments), g = this.g, A = g.area;
    const ty = Math.floor((this.y + this.h + 2) / TS), x0 = Math.floor(this.x / TS) - 1, x1 = Math.floor((this.x + this.w) / TS) + 1;
    for (let y = ty - 2; y <= ty; y++) for (let x = x0; x <= x1; x++) BoxOpen.open(g, x, y, this, 'pound');
    return r;
  };
  // anything thrown or launched opens the box it hits
  const pu = Play.prototype.update;
  Play.prototype.update = function (dt) {
    const r = pu.call(this, dt);
    if (this.level && this.level.tour && this.state === 'play' && this.area) {
      for (const e of this.entities) {
        if (!BoxOpen.thrown(e)) continue;
        for (const [tx, ty] of BoxOpen.touching(this.area, e, 3)) BoxOpen.open(this, tx, ty, e, 'shot');
      }
    }
    return r;
  };
}
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { BoxOpen }); } catch (e) { /* not in a browser */ }
