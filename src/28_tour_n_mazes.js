/* ============================================================
   World tour: helpers for the "figure out the route" levels
   (Morocco 5-1's souk, the Netherlands' cold store, Vietnam's
   gong market, Spain's walls, Japan's sushi loop).
   - TourMaze.lock(type, props): a stamp piece that builds a lock
     (a wall that a key opens: the level checker's lock + key) and
     gives its entity its own look.
   - keys with a look (a flower token, a cork, a plate ticket...):
     the same key for the game and the checker, drawn as the
     level's own object, with its own toast.
   - the coloured roller shutter (mazeShutter) with a little
     window that shows what waits behind it.
   - map labels for the new level types.
   ============================================================ */
const TourMaze = {
  // stamp piece: a lock h tall standing on the row under the letter: { id, h, ...props for the entity }
  lock(type, props) {
    return (st, o) => {
      const B = st.B, n = B.spawns.length, h = o.h || 3;
      B.lock(st.x, st.gy - h, st.gy - 1, o.id, 'door');
      for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') { B.spawns[k].type = type; Object.assign(B.spawns[k], props || {}, o, { id: o.id }); }
      return st.x;
    };
  },
  // keys with a look: { name, toast, col, icon(ctx, x, y, t) }
  KEYS: {},
  addKeys(map) { Object.assign(this.KEYS, map); }
};

/* a key with a look draws itself and says what it opens; the rest (g.keys, the checker) is the plain key */
{
  const K = ENTITY_TYPES.key, draw0 = K.prototype.draw, touch0 = K.prototype.touchPlayer;
  const look = e => e.s && e.s.look && TourMaze.KEYS[e.s.look];
  K.prototype.draw = function (ctx) {
    const L = look(this); if (!L) return draw0.call(this, ctx);
    const t = this.g.t, x = this.cx, y = this.cy + 2;
    ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 4); ctx.fillStyle = L.glow || '#fff4c0'; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); ctx.restore();
    Ink.around(ctx, x - 16, y - 16, 32, 32, c => { c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2) * 0.15); L.icon(c, 0, 0, t); c.restore(); }, { pad: 4 });
  };
  K.prototype.touchPlayer = function (p) {
    const L = look(this); if (!L) return touch0.call(this, p);
    if (this.remove) return;
    this.remove = true; this.g.keys.add(this.id);
    sfx('key', 'oneup'); this.g.burst(this.cx, this.cy, 18, L.col || '#ffd84a', 'confetti');
    this.g.toast(L.toast || (L.name + '!'));
  };
}

/* the roller shutter of a colour: corrugated metal, a band with its flower (or object) icon, and a small window that
   shows what waits behind it (s.peek: a key look). s.col, s.icon (a TourMaze.KEYS look whose icon is painted on it),
   s.need (the text when Brady has no key) */
class TourMazeShutter extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.col = s.col || '#c8c0b8'; }
  touchPlayer(p) {
    if (this.open || this.g.keys.has(this.id)) return super.touchPlayer(p);
    if (this.msgT <= 0) { this.msgT = 2; this.g.parts.text(this.cx, this.y - 10, this.s.need || 'LOCKED', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); }
  }
  draw(ctx) {
    const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 6, y = this.y, w = TS, h = this.h * (1 - k), t = this.g.t;
    if (h < 2) return;
    Ink.around(ctx, x - 4, y - 4, w + 8, this.h + 8, c => {
      c.fillStyle = shade(this.col, -0.15); c.fillRect(x, y, w, h);
      c.fillStyle = shade(this.col, 0.12); for (let yy = y + 3; yy < y + h; yy += 7) c.fillRect(x, yy, w, 3);
      c.fillStyle = '#3a3a44'; c.fillRect(x - 2, y + h - 4, w + 4, 4);
      // the window: what waits behind
      if (h > 60) {
        const wy = y + 10; c.fillStyle = '#1a2230'; rr(c, x + 5, wy, w - 10, 22, 4); c.fill();
        const P = this.s.peek && TourMaze.KEYS[this.s.peek];
        if (P) { c.save(); c.beginPath(); rr(c, x + 5, wy, w - 10, 22, 4); c.clip(); c.translate(x + w / 2, wy + 11); c.scale(0.6, 0.6); P.icon(c, 0, 0, t); c.restore(); }
        else { c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 8, wy + 3, 6, 16); }
        c.strokeStyle = '#c8ccd8'; c.lineWidth = 1.5; rr(c, x + 5, wy, w - 10, 22, 4); c.stroke();
      }
      // the band with the shutter's own icon
      const I = this.s.icon && TourMaze.KEYS[this.s.icon];
      if (I && h > 40) { const by = y + h - 30; c.fillStyle = '#f4f0e8'; c.beginPath(); c.arc(x + w / 2, by, 10, 0, TAU); c.fill(); c.save(); c.translate(x + w / 2, by); c.scale(0.55, 0.55); I.icon(c, 0, 0, t); c.restore(); }
    }, { pad: 4 });
  }
}
ENTITY_TYPES.mazeShutter = TourMazeShutter;

// the new level types on the map's info card
if (typeof TourLandscape !== 'undefined' && TourLandscape.ARCH_LABEL) Object.assign(TourLandscape.ARCH_LABEL, { vault: 'KEYS', gong: 'GONG', loop: 'LOOP', walls: 'WALLS' });
try { Object.assign(window.BRADY_TOUR, { TourMaze }); } catch (e) { /* not in a browser */ }
