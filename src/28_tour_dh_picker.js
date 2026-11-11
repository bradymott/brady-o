/* ============================================================
   World tour: the power picker.
   Brady can hold several powers that want the one action button:
   the item in his hands (gear or the country's signature item), a
   second item in the Backpack, the joint's smoke puffs and, while
   he flies, the LSD tab's rainbow lasers. The picker says which one
   the action button uses:
   - touch: a small chip above the action button (shown only when
     Brady holds two or more); tap it (or swipe across it) to cycle
     through them, a little carousel and a name label show the pick;
   - keyboard: Q / E / C cycle, 1-5 pick directly; the HUD slot can
     be tapped too;
   - the action button and the HUD's first slot show the active
     power's icon, so it is always clear what THROW will do.
   Nothing is lost by switching: picking the Backpack item swaps it
   into Brady's hands (the old Backpack swap, now driven from here),
   picking smoke or lasers leaves the hands item where it is (its
   passive effects keep running). Buffs, the mushroom size and the
   star are passive and never in the list. The pick is remembered on
   the Play scene for the rest of the level run (doors included); a
   new pickup becomes the active power, and when a power ends (the
   LSD wears off) the previous pick comes back.
   ============================================================ */
const TourPicker = {
  NAMES: { joint: 'SMOKE PUFFS', lsd: 'RAINBOW LASERS' },
  // the powers Brady holds that the action button can use, in the order he got them
  list(p) {
    if (!p || !p.g || !p.g.level || !p.g.level.tour) return [];
    const g = p.g, out = [];
    const add = k => { if (k && out.indexOf(k) < 0) out.push(k); };
    const base = k => k ? String(k).split('#')[0] : k;
    if (p.lsdT > 0) add('lsd');
    add(base(p.handsKind ? p.handsKind() : null));
    if (p.pack && (p.pack.startsWith('gear:') || p.pack.startsWith('sig:'))) add(base(p.pack));
    if (p.power === 2) add('joint');
    const seq = g.powSeq || {};
    return out.sort((a, b) => (seq[a] || 0) - (seq[b] || 0));
  },
  // remember that a power was just picked up (it becomes the active one)
  got(g, key) {
    if (!g || !key) return;
    key = String(key).split('#')[0];
    g.powSeq = g.powSeq || {}; g.powN = (g.powN || 0) + 1;
    if (!g.powSeq[key]) g.powSeq[key] = g.powN;
    this.push(g, key);
  },
  push(g, key) { g.powHist = (g.powHist || []).filter(k => k !== key); g.powHist.push(key); if (g.powHist.length > 12) g.powHist.shift(); },
  // the Backpack's item (a HANDS kind) as a picker key, or null
  packKey(p) { return p.pack && (p.pack.startsWith('gear:') || p.pack.startsWith('sig:')) ? p.pack.split('#')[0] : null; },
  // the active power: the latest pick that Brady still holds and that is not riding in the Backpack (picking the
  // Backpack's item swaps it into his hands first); otherwise the old priority (lasers, hands, smoke)
  active(p) {
    const pk = this.packKey(p), L = this.list(p).filter(k => k !== pk); if (!L.length) return null;
    const H = (p.g.powHist || []);
    for (let i = H.length - 1; i >= 0; i--) if (L.indexOf(H[i]) >= 0) return H[i];
    if (L.indexOf('lsd') >= 0) return 'lsd';
    const hk = p.handsKind && p.handsKind(); if (hk && L.indexOf(hk.split('#')[0]) >= 0) return hk.split('#')[0];
    return L[0];
  },
  // what the action button does: 'lsd' | 'hands' | 'joint' | null
  use(p) {
    const k = this.active(p); if (!k) return null;
    if (k === 'lsd' || k === 'joint') return k;
    return 'hands';
  },
  // a picked Backpack item goes into Brady's hands (the item he held goes into the Backpack: nothing is lost)
  sync(p, key) {
    if (!key || key === 'lsd' || key === 'joint' || this.packKey(p) !== key || !p.usePackTour) return;
    p.usePackTour(true);
  },
  select(p, key, quiet) {
    const g = p.g, L = this.list(p); if (L.indexOf(key) < 0) return false;
    const was = this.active(p);
    this.sync(p, key); this.push(g, key);
    if (!quiet && key !== was) {
      g.pickFx = { from: was, to: key, t: 0, dir: (L.indexOf(key) >= L.indexOf(was) ? 1 : -1) };
      Sound.play('select', { vol: 0.5, pitch: 1.2 }); g.burst(p.cx, p.y + 6, 6, '#ffd84a', 'spark');
    }
    return true;
  },
  cycle(p, dir) {
    const L = this.list(p); if (L.length < 2) { if (L.length === 1) this.select(p, L[0], true); Sound.play('bump', { vol: 0.3 }); return false; }
    const i = Math.max(0, L.indexOf(this.active(p)));
    const k = L[((i + (dir || 1)) % L.length + L.length) % L.length];
    const ok = this.select(p, k);
    if (ok && p.g.pickFx) p.g.pickFx.dir = dir || 1;
    return ok;
  },
  name(key) {
    if (this.NAMES[key]) return this.NAMES[key];
    return TourPowers.name(key);
  },
  // can the active power act right now? (a thrown plane, a box: no)
  ready(p, key) {
    if (key === 'lsd') return p.lsdT > 0;
    if (key === 'joint') return p.power === 2 && p.puffs < 3;
    if (key && key.startsWith('gear:')) { const G = TourGear.get(key); if (!G || !G.action) return false; if (p.hands && p.hands.thrown) return false; if (G.id === 'fins') return !!p.inWater; if (G.id === 'pads') return !!p.crawling; return true; }
    if (key && key.startsWith('sig:')) { const P = TourPowers.get(key.slice(4)); return !!(P && P.action); }
    return false;
  },
  // the icon of a power key, without the pickup glow, centred on (x, y)
  icon(ctx, key, x, y, t, g) {
    const g0 = TourItemArt.glow; TourItemArt.glow = () => {};
    try {
      if (key === 'joint') { ctx.save(); ctx.translate(x + 2, y - 2); ctx.scale(1.15, 1.15); TourItemArt.joint(ctx, 0, 12, t); ctx.restore(); }
      else if (key === 'lsd') TourItemArt.lsd(ctx, x, y + 12, t);
      else TourGear.icon(ctx, key, x, y, t, g);
    } finally { TourItemArt.glow = g0; }
  },

  /* ---------- the chip next to the action button (touch) ---------- */
  chip() {
    const L = Input.layout; if (!L) return null;
    const a = L.action, r = clamp(L.r * 0.5, 17, 26);
    // above the action button and a little toward the screen centre: the right thumb reaches it from either button
    const side = L.lefty ? 1 : -1;
    let x = a.x + side * a.r * 0.25, y = a.y - a.r - r - Math.max(8, L.r * 0.22);
    if (L.portrait) y = Math.max(Game.gameRect.y + Game.gameRect.h + r + 6, y);
    return { x, y, r };
  },
  visible(play) {
    if (!(play instanceof Play) || !play.level || !play.level.tour || play.paused || play.state !== 'play') return false;
    const p = play.player; return !!(p && !p.dead && this.list(p).length >= 2);
  },
  drawChip(ctx) {
    const play = Game.scene; if (!this.visible(play)) return;
    const c = this.chip(); if (!c) return;
    const p = play.player, L = this.list(p), k = this.active(p), t = play.t, fx = play.pickFx;
    ctx.save();
    // the plate: a dark disc with a gold rim and a pip for each power around its lower edge
    const held = this.touchId != null;
    ctx.translate(c.x, c.y); if (held) ctx.scale(0.92, 0.92);
    ctx.fillStyle = 'rgba(14,10,26,0.62)'; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.75)'; ctx.lineWidth = 1.6; ctx.stroke();
    // two tiny chevrons: this cycles
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * (c.r - 3), -3); ctx.lineTo(s * (c.r + 0.5), 0); ctx.lineTo(s * (c.r - 3), 3); ctx.stroke(); }
    const n = L.length, i0 = L.indexOf(k);
    for (let i = 0; i < n; i++) { const ang = Math.PI / 2 + (i - (n - 1) / 2) * 0.32; ctx.fillStyle = i === i0 ? '#ffd84a' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(Math.cos(ang) * (c.r + 4.5), Math.sin(ang) * (c.r + 4.5), i === i0 ? 2.4 : 1.7, 0, TAU); ctx.fill(); }
    // the icon, with a short carousel slide when the pick changes
    const sc = c.r / 22;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, c.r - 2, 0, TAU); ctx.clip();
    if (fx && fx.t < 0.28 && fx.from) {
      const e = easeInOut(clamp(fx.t / 0.28, 0, 1)), d = fx.dir || 1;
      ctx.globalAlpha = 1 - e; ctx.save(); ctx.translate(-d * e * c.r * 1.6, 0); ctx.scale(sc * 0.8, sc * 0.8); this.icon(ctx, fx.from, 0, 0, t, play); ctx.restore();
      ctx.globalAlpha = e; ctx.save(); ctx.translate(d * (1 - e) * c.r * 1.6, 0); ctx.scale(sc * 0.8, sc * 0.8); this.icon(ctx, fx.to, 0, 0, t, play); ctx.restore();
    } else if (k) { ctx.save(); ctx.scale(sc * 0.8, sc * 0.8); this.icon(ctx, k, 0, 0, t, play); ctx.restore(); }
    ctx.restore();
    ctx.restore();
    // the name label pops above the chip for a moment after a switch
    if (fx && fx.t < 1.3 && fx.to) this.label(ctx, this.name(fx.to), c.x, c.y - c.r - 14, clamp(Math.min(fx.t * 8, (1.3 - fx.t) * 4), 0, 1));
    // first time ever: a hint over the chip
    const tips = Save.data.tips || {};
    if (play.pickTipT > 0) this.label(ctx, 'TAP TO SWITCH POWERS', c.x, c.y - c.r - 14 - (fx && fx.t < 1.3 ? 22 : 0) + Math.sin(t * 4) * 2, clamp(Math.min(play.pickTipT, 4.5 - play.pickTipT) * 2, 0, 1), true);
    else if (!tips.picker && play.pickTipT == null) { play.pickTipT = 4.5; tips.picker = true; Save.data.tips = tips; }
  },
  label(ctx, txt, x, y, a, tip) {
    ctx.save(); ctx.globalAlpha = a; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 16, W = Game.cssW;
    x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    ctx.fillStyle = 'rgba(14,8,26,0.82)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.strokeStyle = tip ? 'rgba(255,216,74,0.8)' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = tip ? '#ffd84a' : '#ffffff'; ctx.fillText(txt, x, y + 1);
    ctx.restore();
  },
  // the action button wears the active power's icon (dimmed when it can't fire right now)
  actionArt(ctx, b) {
    const play = Game.scene; if (!(play instanceof Play) || !play.level || !play.level.tour || !play.player) return false;
    const p = play.player, k = this.active(p); if (!k) return false;
    const ok = this.ready(p, k);
    ctx.save(); ctx.globalAlpha *= ok ? 1 : 0.45; const s = b.r / 19; ctx.scale(s, s); this.icon(ctx, k, 0, 0, play.t, play); ctx.restore();
    return true;
  },
  // a touch on the chip (before the jump / action buttons see it); a tap cycles forward, a swipe picks the direction
  hit(x, y) {
    if (!this.visible(Game.scene)) return false;
    const c = this.chip(), L = Input.layout; if (!c || !L) return false;
    const d = Math.hypot(x - c.x, y - c.y);
    return d < c.r * 1.3 && d < Math.hypot(x - L.action.x, y - L.action.y) && d < Math.hypot(x - L.jump.x, y - L.jump.y);
  }
};

/* ---------- Brady: the picker drives the action button ---------- */
Object.assign(Player.prototype, {
  actionUse() { return TourPicker.use(this); }
});
{
  // every pickup that can use the action button becomes the active power
  const ct0 = Player.prototype.collectTour;
  Player.prototype.collectTour = function (kind, src) {
    const r = ct0.call(this, kind, src), g = this.g;
    if (kind === 'vinyl') kind = 'joint'; else if (kind === 'bufo') kind = 'lsd';
    if (kind === 'joint' && this.power === 2) TourPicker.got(g, 'joint');
    else if (kind === 'lsd' && this.lsdT > 0) TourPicker.got(g, 'lsd');
    else if (kind && (kind.startsWith('sig:') || kind.startsWith('gear:'))) { const hk = this.handsKind(); if (hk && hk.split('#')[0] === kind.split('#')[0]) TourPicker.got(g, hk); }
    return r;
  };
  // the old Backpack swap now goes through the picker (the HUD slot, C / Q): it cycles the powers
  const upt = Player.prototype.usePackTour;
  Player.prototype.usePackTour = function (raw) {
    if (raw) return upt.call(this);
    const L = TourPicker.list(this);
    if (L.length >= 2) return TourPicker.cycle(this, 1);
    const r = upt.call(this); const hk = this.handsKind(); if (r && hk) TourPicker.push(this.g, hk.split('#')[0]); return r;
  };
}
/* ---------- input: the chip, the HUD slot, the keys ---------- */
(function hookPickerInput() {
  const down0 = Input.onDown, up0 = Input.onUp;
  Input.onDown = function (e) {
    if (this.mode === 'game' && typeof Play !== 'undefined' && Game.scene instanceof Play) {
      const q = this.pos(e);
      if (TourPicker.hit(q.x, q.y)) {
        if (e.cancelable) e.preventDefault();
        try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        TourPicker.touchId = e.pointerId;
        this.touches.set(e.pointerId, { role: 'pick', ox: q.x, oy: q.y, x: q.x, y: q.y, sx: q.x, sy: q.y, t: performance.now() });
        return;
      }
    }
    return down0.call(this, e);
  };
  Input.onUp = function (e, cancel) {
    const t = this.touches.get(e.pointerId);
    if (t && t.role === 'pick') {
      if (e.cancelable) e.preventDefault();
      this.touches.delete(e.pointerId); TourPicker.touchId = null;
      if (!cancel) { const q = this.pos(e), dx = q.x - t.sx, dy = q.y - t.sy; this.pickCycle = Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 1; }
      this.recompute(); return;
    }
    return up0.call(this, e, cancel);
  };
  window.addEventListener('keydown', e => {
    if (Input.mode !== 'game') return;
    if (e.code === 'KeyE') Input.pickCycle = 1;
    const m = /^Digit([1-5])$/.exec(e.code); if (m) Input.pickSlot = +m[1];
  });
  Input.actionArt = (ctx, b) => TourPicker.actionArt(ctx, b);
  Input.overlay = ctx => TourPicker.drawChip(ctx);
})();
// the Play scene: apply a queued cycle / pick, run the carousel timer
{
  const u0 = Play.prototype.update;
  Play.prototype.update = function (dt) {
    if (this.level && this.level.tour && !this.paused) {
      const p = this.player;
      if (this.pickFx) this.pickFx.t += dt;
      if (this.pickTipT > 0) this.pickTipT = Math.max(0, this.pickTipT - dt);
      if (p && this.state === 'play' && p.state === 'play' && !p.dead) {
        if (Input.pickCycle) { TourPicker.cycle(p, Input.pickCycle); }
        if (Input.pickSlot) { const L = TourPicker.list(p), k = L[Input.pickSlot - 1]; if (k) TourPicker.select(p, k); else Sound.play('bump', { vol: 0.3 }); }
      }
    }
    Input.pickCycle = 0; Input.pickSlot = 0;
    return u0.call(this, dt);
  };
}
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { TourPicker }); } catch (e) { /* not in a browser */ }
