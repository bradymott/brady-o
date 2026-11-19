/* ============================================================
   World tour: secrets, stage C (SECRETS_WARPS_SWITCHES.md §4, WP-5; contracts SECRETS_CONTRACTS.md §5, §7).
   PIWI'S HOUSE RULES and the BRADY BUTTONS. Piwi Squirmin' has banned fun worldwide; each of his rules is enforced by
   a big DO NOT PRESS button his crew hid somewhere in the world. Brady slaps one (from the side: Action or Up next to
   it; jumping on it only goes "bzzt") and the rule is REVOKED for good: the change ripples across the game (dancing,
   hats...) and extra content opens (a bonus land, a bonus level).
   Here: TOUR_RULES (only the rules whose button is placed: validate_levels --rules checks each is placed once), the
   button entity (spawn { type: 'button', rule }), TourRules.revoke (saved at once in Save.data.tour.rules), the cut to
   the map (the REVOKED card, then a little world map with the land that opened), the dancing and the Settings switches (ANIMAL HATS,
   DANCING; the hats themselves are in 28_tour_sc_hats.js), the HOUSE RULES page in the pause menu and the map's brass badges.
   ============================================================ */
// n -> { title, sign (what changed, one line), opens: [targets], fx: 'dance' | 'hats' | null }
const TOUR_RULES = {
  3: { title: 'NO DANCING', sign: 'EVERYONE MAY NOW DANCE!', opens: ['land:fest'], fx: 'dance' },
  7: { title: 'NO HATS ON ANIMALS', sign: 'ALL ANIMALS MAY NOW WEAR HATS!', opens: [], fx: 'hats' }
};
// all six of Piwi's rules, for the HOUSE RULES page (the ones not placed yet show as hidden)
const TOUR_RULE_LIST = [1, 3, 7, 9, 10, 12];

const TourRules = {
  isRevoked(n) { const T = Save.data.tour; return !!(T && T.rules && T.rules[n]); },
  count() { const T = Save.data.tour; return T && T.rules ? Object.keys(T.rules).length : 0; },
  // this rule's effect is on and its Settings switch shows it (ANIMAL HATS for 'hats'; DANCING for 'dance' and
  // rule 1's 'party')
  fxOn(kind) {
    if (!this.fxShown(kind)) return false;
    for (const n in TOUR_RULES) if (TOUR_RULES[n].fx === kind && this.isRevoked(n)) return true;
    return false;
  },
  /* the two switches: Save.data.settings.hatsFx (ANIMAL HATS) and .danceFx (DANCING), ON unless false. A save from
     before the split has only the old combined ruleFx (HATS & DANCING): while a switch has never been flipped it
     follows that, so a player who had turned the combined one off finds both off. */
  fxKey(kind) { return kind === 'hats' ? 'hatsFx' : 'danceFx'; },
  fxShown(kind) { const S = Save.data.settings, v = S[this.fxKey(kind)]; return v === undefined ? S.ruleFx !== false : v !== false; },
  fxToggle(kind) {
    const S = Save.data.settings;
    S.hatsFx = this.fxShown('hats'); S.danceFx = this.fxShown('dance');
    S[this.fxKey(kind)] = !S[this.fxKey(kind)];
    Save.save(); this.syncFx();
  },
  anyFx() { for (const n in TOUR_RULES) if (TOUR_RULES[n].fx && this.isRevoked(n)) return true; return false; },
  /* revoke(n, at): saved at once; returns the reveals it queued (empty when it was revoked already). Opens:
     'land:<cc>' -> the bonus land (tour.lands, its first level, the NEW LAND! reveal on the route map),
     '<w>-<i>' -> that level (unlocked; a secret stop is revealed on its land's map) */
  revoke(n, at) {
    const R = TOUR_RULES[n], T = TourProgress.data();
    if (!R || T.rules[n]) return [];
    T.rules[n] = { at: at || null };
    const out = [];
    const queue = r => { out.push(r); if (!T.pending.some(q => JSON.stringify(q) === JSON.stringify(r))) T.pending.push(r); };
    for (const o of [].concat(R.opens || [])) {
      const tg = Tour.target(o, null);
      if (tg.kind === 'land' && Tour.countries[tg.id]) {
        const S = Tour.countries[tg.id];
        if (!T.lands[tg.id]) queue({ kind: 'land', id: tg.id });
        T.lands[tg.id] = true; Save.data.unlocked[S.world + '-1'] = true;
      } else if (tg.kind === 'level' && Tour.specOf(tg.id)) {
        Save.data.unlocked[tg.id] = true;
        const L = Tour.specOf(tg.id);
        if (L.secret && !T.revealed[tg.id]) queue({ kind: 'stop', cc: tg.cc, id: tg.id });
      }
    }
    Save.save();
    this.syncFx();
    return out;
  },
  // what a rule opened, in words: 'FESTIVAL FIELDS'
  opensText(n) {
    const R = TOUR_RULES[n]; if (!R) return '';
    return [].concat(R.opens || []).map(o => { const t = Tour.target(o, null); if (t.kind === 'land') return (Tour.countries[t.id] || Tour.stops[t.id] || { name: t.id }).name.toUpperCase(); const L = Tour.specOf(t.id); return L ? t.id + ' ' + L.name.toUpperCase() : o; }).join(', ');
  },
  F: {}, font(px) { return this.F[px] || (this.F[px] = px + 'px ' + FONT_DISPLAY); }
};
TourNeeds.provider = null;   // TourNeeds reads Save.data.tour.rules directly (the same field)

/* ---------- the Brady Button: spawn { type: 'button', rule } ---------- */
{
  const INK = '#1a1018';
  class TourButton extends Ent {
    constructor(g, s) {
      super(g, s, 44, 44);
      this.rule = +s.rule; this.isButton = true; this.solidTop = true;
      this.pressed = TourRules.isRevoked(this.rule); this.press = this.pressed ? 1 : 0; this.squeak = 0; this.wasOn = false;
      this.plate = 'RULE ' + this.rule; this.ok = !!TOUR_RULES[this.rule];
    }
    update(dt) {
      this.t += dt; if (this.squeak > 0) this.squeak -= dt;
      const p = this.g.player; if (!p || p.dead || p.state !== 'play' || this.g.state !== 'play') return;
      // landing on top: a deflated squeak, nothing else
      const on = p.onGround && Math.abs(p.y + p.h - this.y) < 4 && p.x + p.w > this.x + 4 && p.x < this.x + this.w - 4;
      if (on && !this.wasOn && this.squeak <= 0) { this.squeak = 0.8; this.g.parts.text(this.cx, this.y - 14, this.pressed ? '♪' : 'bzzt... not like that', '#ffd0e0'); Sound.play('bump', { vol: 0.35, pitch: 0.6 }); }
      this.wasOn = on;
      // a slap from the side: Brady beside it (his body level with the dome), Action or Up
      const beside = p.y + p.h > this.y + 10 && p.y < this.y + this.h && Math.abs(p.cx - this.cx) < this.w / 2 + p.w / 2 + 10;
      if (beside && !on && (Input.actionPressed || Input.upPressed)) this.slap(p);
    }
    slap(p) {
      if (this.press < 0.5) this.press = 1;
      p.facing = this.cx > p.cx ? 1 : -1; p.throwT = 0.2;
      if (this.pressed) { Sound.play('select', { pitch: 1.4 }); this.g.parts.text(this.cx, this.y - 16, '♪ ♫', '#ffe28a'); return; }
      this.pressed = true;
      const reveals = TourRules.revoke(this.rule, this.g.id);
      Sound.play('secret'); TourKit.sfx('reveal', 'oneup');
      this.g.burst(this.cx, this.y, 30, '#ffd84a', 'confetti'); this.g.burst(this.cx, this.y, 20, '#b46aff', 'confetti'); this.g.shake(6);
      if (this.ok) this.g.buttonFx = TourRuleCut.start(this.rule, reveals);
    }
    draw(ctx) {
      const x = this.cx, by = this.y + this.h, t = this.t, lit = this.pressed;
      ctx.save(); ctx.lineJoin = 'round';
      // the pneumatic tube up into the scenery
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 14, by - 30); ctx.lineTo(x + 14, by - 300); ctx.stroke();
      ctx.strokeStyle = '#c8b07a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 13, by - 30); ctx.lineTo(x + 13, by - 300); ctx.stroke();
      // the mahogany pedestal, the brass plaque
      ctx.fillStyle = '#6a2e1e'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 16, by); ctx.lineTo(x - 12, by - 30); ctx.lineTo(x + 12, by - 30); ctx.lineTo(x + 16, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a4a2e'; ctx.fillRect(x - 10, by - 28, 4, 26);
      ctx.fillStyle = '#d8b04a'; rr(ctx, x - 13, by - 27, 26, 21, 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2410'; ctx.font = TourRules.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (lit) { ctx.fillText('REVOKED', x, by - 20, 24); ctx.fillText(this.plate, x, by - 13, 24); }
      else { ctx.fillText('DO NOT', x, by - 22.5, 24); ctx.fillText('PRESS', x, by - 16.5, 24); ctx.fillText(this.plate, x, by - 10.5, 24); }
      // the brass bezel and the frosted purple dome (lit gold once pressed)
      const k = this.press, dy = k * 3;
      ctx.fillStyle = '#c89a3a'; ctx.beginPath(); ctx.ellipse(x, by - 31, 18, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (lit) { ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 5); ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(x, by - 38, 26, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = lit ? '#ffd84a' : '#7a5a9a'; ctx.beginPath(); ctx.ellipse(x, by - 33 + dy, 15, 13 - dy, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - 6, by - 39 + dy, 4, 2.5, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = lit ? '#a8681a' : '#d8c070'; ctx.font = TourRules.font(9); ctx.fillText('P', x, by - 37 + dy);
      if (!lit) {
        // the warning stripes on the pedestal foot and a hand-drawn arrow: "it's a button"
        ctx.fillStyle = '#f2d23a'; ctx.fillRect(x - 15, by - 5, 30, 4); ctx.fillStyle = INK; for (let q = -14; q < 14; q += 6) ctx.fillRect(x + q, by - 5, 3, 4);
      }
      ctx.restore();
    }
    get light() { return { r: 70, c: this.pressed ? 'rgba(255,220,120,' : 'rgba(180,120,255,', x: this.cx, y: this.y + 10 }; }
  }
  ENTITY_TYPES.button = TourButton;
}

/* ---------- the cut to the map: the REVOKED card, then a little world map with what opened ---------- */
{
  const PU = Play.prototype;
  const up0 = PU.update;
  PU.update = function (dt) {
    const F = this.buttonFx;
    if (F) {
      F.t += dt;
      // a tap, jump or Enter after the stamp skips ahead; the world waits meanwhile
      const skip = Input.jumpPressed || Input.actionPressed || Input.taps.length || Input.uiKey === 'enter';
      if (skip && F.t > 1.4) F.t = Math.max(F.t, F.land ? (F.t < 2.2 ? 2.2 : 5) : 5);
      Input.taps.length = 0; Input.uiKey = null;
      if (F.t >= 5.2) this.buttonFx = null;
      return;
    }
    if (this.rulesPage) {
      this.rulesPage.age = (this.rulesPage.age || 0) + dt;
      if (this.rulesPage.age > 0.3 && (Input.taps.length || Input.pausePressed || Input.jumpPressed || Input.uiKey === 'enter' || Input.uiKey === 'back')) { this.rulesPage = false; Sound.play('back'); }
      Input.taps.length = 0; Input.uiKey = null;
      return;
    }
    return up0.call(this, dt);
  };
  const dr0 = PU.draw;
  PU.draw = function (ctx) {
    dr0.call(this, ctx);
    if (this.buttonFx || this.rulesPage) {
      ctx.save(); ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      if (this.buttonFx) TourRuleCut.draw(ctx, this, this.buttonFx);
      else TourRuleCut.page(ctx, this.t, this.rulesPage);
      ctx.restore();
    }
  };
}
const TourRuleCut = {
  INK: '#2a1a10', CROWN: ['#ff7ab0', '#ffd84a', '#7ad8ff', '#b4ff7a', '#ff9a3a'], ITALIC: 'italic 12px ' + FONT_UI, SMALL: '11px ' + FONT_UI, TINY: '10px ' + FONT_UI,
  // the cut's texts, made once when the button is slapped
  start(rule, reveals) {
    const R = TOUR_RULES[rule], land = (reveals.find(r => r.kind === 'land') || {}).id || null, s = land && Tour.stops[land];
    return { t: 0, rule, reveals, land, title: 'RULE ' + rule + ': ' + (R ? R.title : '?'), banner: s ? 'NEW LAND: ' + s.name.toUpperCase() + '!' : '' };
  },
  // the HOUSE RULES page's lines, made once when it opens
  lines() {
    const T = TourProgress.data();
    return TOUR_RULE_LIST.map(n => {
      const R = TOUR_RULES[n], r = T.rules[n];
      if (!R || !r) return { done: false, title: 'RULE ?: ████████', sub: '' };
      const L = r.at && Tour.specOf(r.at);
      return { done: true, title: 'RULE ' + n + ': ' + R.title, sub: 'Button in ' + (L ? r.at + ' ' + L.name : '?') + ' · opened ' + TourRules.opensText(n) };
    });
  },
  // the parchment card with Piwi's rule and the REVOKED stamp; the land that opened on a little world map
  draw(ctx, play, F) {
    const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH, t = F.t, R = TOUR_RULES[F.rule];
    const fade = clamp(t / 0.3, 0, 1) * clamp((5.2 - t) / 0.3, 0, 1);
    ctx.globalAlpha = fade; ctx.fillStyle = 'rgba(10,6,20,0.72)'; ctx.fillRect(0, 0, W, Game.cssH); ctx.globalAlpha = 1;
    const mapT = F.land ? clamp((t - 2.2) / 0.4, 0, 1) : 0;
    const cw = Math.min(W - 40, 420), ch = Math.min(H - 60, 190);
    // the card slides up out of the way when the map comes in
    const cx = W / 2, cy = H / 2 - mapT * (H * 0.75), x0 = cx - cw / 2, y0 = cy - ch / 2;
    if (cy + ch / 2 > 0) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.025); ctx.translate(-cx, -cy);
      ctx.fillStyle = '#f6ead0'; ctx.strokeStyle = this.INK; ctx.lineWidth = 3; rr(ctx, x0, y0, cw, ch, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 1.5; rr(ctx, x0 + 8, y0 + 8, cw - 16, ch - 16, 5); ctx.stroke();
      ctx.fillStyle = '#6a3a9a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = TourRules.font(11); ctx.fillText('PIWI\'S HOUSE RULES', cx, y0 + 28);
      ctx.fillStyle = this.INK; ctx.font = TourRules.font(cw < 360 ? 22 : 30); ctx.fillText(F.title, cx, y0 + ch * 0.36, cw - 30);
      ctx.font = this.ITALIC; ctx.fillStyle = '#5a4a3a'; ctx.fillText('— by order of Piwi Squirmin\'', cx, y0 + ch * 0.5);
      // the stamp slams down at 0.6 s
      const sk = clamp((t - 0.6) / 0.18, 0, 1);
      if (sk > 0) {
        const s = 1 + (1 - sk) * 1.6;
        ctx.save(); ctx.translate(cx + cw * 0.12, y0 + ch * 0.66); ctx.rotate(-0.12); ctx.scale(s, s); ctx.globalAlpha = 0.25 + 0.75 * sk;
        ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 4; rr(ctx, -96, -23, 192, 46, 6); ctx.stroke();
        ctx.fillStyle = '#d0203a'; ctx.font = TourRules.font(30); ctx.fillText('REVOKED', 0, 2);
        ctx.restore();
        if (t < 0.85 && !F.thud) { F.thud = true; Sound.play('stomp', { vol: 0.8 }); play.shake(5); }
      }
      if (t > 1.0) { ctx.fillStyle = '#1a6a3a'; ctx.font = TourRules.font(13); ctx.fillText(R ? R.sign : '', cx, y0 + ch - 18, cw - 30); }
      ctx.restore();
    }
    if (F.land && mapT > 0) this.miniMap(ctx, W, H, t, F.land, mapT, F.banner);
    if (t > 1.4 && t < 4.9) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = TourRules.font(9); ctx.textAlign = 'center'; ctx.fillText('TAP TO CONTINUE', W / 2, H - 14); }
  },
  // a little route map centred on the land that opened: its pin pops, a banner says its name
  miniMap(ctx, W, H, t, cc, k, banner) {
    const s = Tour.stops[cc]; if (!s) return;
    TourMap.build();
    const mw = Math.min(W - 40, 460), mh = Math.min(H - 70, 240), x0 = (W - mw) / 2, y0 = (H - mh) / 2 + (1 - easeOut(k)) * H * 0.6;
    ctx.save();
    ctx.beginPath(); rr(ctx, x0, y0, mw, mh, 14); ctx.clip();
    ctx.fillStyle = '#1a6ac0'; ctx.fillRect(x0, y0, mw, mh);
    const z = mw / 70, cx = x0 + mw / 2, cy = y0 + mh / 2;
    if (TourMap.paths) {
      ctx.save(); ctx.translate(cx - s.lon * z, cy + s.lat * z); ctx.scale(z, z);
      ctx.fillStyle = '#7ac06a'; for (const p of TourMap.paths.land) ctx.fill(p);
      ctx.strokeStyle = '#f2dca0'; ctx.lineWidth = 2 / z; for (const p of TourMap.paths.land) ctx.stroke(p);
      ctx.restore();
    }
    // the pin pops at 2.8 s
    const pk = TourPanelFx.backOut(clamp((t - 2.8) / 0.45, 0, 1)), C = Tour.countries[cc], cols = C ? C.colors : { a: '#ff4f8a' };
    if (t > 2.6) TourPanelFx.crack(ctx, cx, cy, clamp((t - 2.6) / 0.6, 0, 1));
    if (pk > 0.01) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pk, pk);
      ctx.fillStyle = cols.a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.stroke();
      if (C && C.emblem) C.emblem(ctx, 0, 0, 10, t); else { ctx.fillStyle = '#fff'; ctx.font = TourRules.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(s.world), 0, 1); }
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; rr(ctx, x0, y0, mw, mh, 14); ctx.stroke();
    if (t > 3.1) TourPanelFx.banner(ctx, banner, W / 2, y0 + 30, clamp((t - 3.1) / 0.25, 0, 1), 5.2 - t);
  },
  // the HOUSE RULES page (pause menu): each rule revoked (where, what it opened) or still hidden
  page(ctx, t, lines) {
    if (!lines || !lines.length) lines = this.lines();
    const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH;
    ctx.fillStyle = 'rgba(8,4,16,0.86)'; ctx.fillRect(0, 0, W, Game.cssH);
    const cw = Math.min(W - 30, 520), ch = Math.min(H - 30, 300), x0 = (W - cw) / 2, y0 = (H - ch) / 2;
    ctx.fillStyle = '#3a2a1a'; ctx.strokeStyle = '#d8b04a'; ctx.lineWidth = 2; rr(ctx, x0, y0, cw, ch, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6ead0'; rr(ctx, x0 + 10, y0 + 10, cw - 20, ch - 20, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6a3a9a'; ctx.font = TourRules.font(14);
    ctx.fillText('PIWI\'S HOUSE RULES', W / 2, y0 + 30);
    ctx.font = this.SMALL; ctx.fillStyle = '#5a4a3a'; ctx.fillText('Find the BRADY BUTTONS hidden backstage and slap them!', W / 2, y0 + 48, cw - 40);
    const rh = Math.min(34, (ch - 80) / lines.length);
    ctx.textAlign = 'left';
    for (let k = 0; k < lines.length; k++) {
      const y = y0 + 68 + k * rh + rh / 2, Ln = lines[k], done = Ln.done;
      ctx.fillStyle = done ? '#1a6a3a' : '#4a3a2a'; ctx.font = TourRules.font(11);
      ctx.fillText(Ln.title, x0 + 24, y - (done ? 6 : 0), cw * 0.5);
      if (done) {
        ctx.font = this.TINY; ctx.fillStyle = '#5a4a3a';
        ctx.fillText(Ln.sub, x0 + 24, y + 8, cw - 60);
        ctx.save(); ctx.translate(x0 + cw - 70, y); ctx.rotate(-0.15); ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 2; rr(ctx, -38, -10, 76, 20, 3); ctx.stroke();
        ctx.fillStyle = '#d0203a'; ctx.font = TourRules.font(11); ctx.textAlign = 'center'; ctx.fillText('REVOKED', 0, 1); ctx.restore(); ctx.textAlign = 'left';
      }
    }
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(60,40,30,0.7)'; ctx.font = TourRules.font(9); ctx.fillText('TAP TO CLOSE', W / 2, y0 + ch - 18);
  }
};
// the pause menu row (once a button has been found) and the Settings switch (once an effect is on)
TourHooks.on('pausePages', play => play.level && play.level.tour && TourRules.count() ? { label: 'HOUSE RULES (' + TourRules.count() + ')', fn: () => { play.closePause(); play.rulesPage = TourRuleCut.lines(); Sound.play('select'); } } : null);
// two switches, each once its rule is revoked: ANIMAL HATS (rule 7) and DANCING (rule 3; rule 1's party blimp and
// rainbow beam follow it too). Each takes effect at once.
TourHooks.on('settings', () => TourRules.isRevoked(7) ? { label: 'ANIMAL HATS', value: TourRules.fxShown('hats') ? 'ON' : 'OFF', fn: () => TourRules.fxToggle('hats') } : null);
TourHooks.on('settings', () => TourRules.isRevoked(3) || TourRules.isRevoked(1) ? { label: 'DANCING', value: TourRules.fxShown('dance') ? 'ON' : 'OFF', fn: () => TourRules.fxToggle('dance') } : null);

/* ---------- the effects: everyone dances (rule 3); the animals' hats (rule 7) are in src/28_tour_sc_hats.js ---------- */
// who dances: the tour's enemies and friends (not bosses, not the buttons)
TourRules.dances = e => !!((e.enemy || e.friendly) && !e.boss && !e.dead && !e.isButton);
// the dance: a squash and a sway on a 120 bpm beat, each critter a little out of step (cosmetic: the hitbox is
// untouched). The hats (afterEntities) wear the same transform, so a hat stays on its dancing head.
TourRules.danceXf = (play, ctx, e) => {
  const ph = play.t * 12.566 + e.x * 0.05, k = 1 + 0.07 * Math.sin(ph), fx = e.x + e.w / 2, fy = e.y + e.h;
  ctx.translate(fx, fy); ctx.rotate(Math.sin(ph * 0.5) * 0.06); ctx.scale(1 / k, k); ctx.translate(-fx, -fy);
};
// the dance handler is only in the entityDraw list while dancing is on (an entityDraw handler costs a save/restore
// round every entity every frame), synced when an area loads, a rule is revoked or the Settings switch flips
const tourDance = (play, ctx, e) => {
  if (!TourRules.dances(e) || !play.level || !play.level.tour) return false;
  TourRules.danceXf(play, ctx, e);
  e.draw(ctx, play.t);
  return true;
};
TourRules.syncFx = function () {
  const on = this.fxOn('dance'), has = TourHooks.entityDraw.indexOf(tourDance) >= 0;
  if (on && !has) TourHooks.on('entityDraw', tourDance); else if (!on && has) TourHooks.off('entityDraw', tourDance);
};
TourHooks.on('areaLoaded', () => TourRules.syncFx());

/* ---------- the maps: a brass dome by every stop whose button Brady slapped; the overworld menu page ---------- */
TourHooks.on('owDraw', (ow, ctx) => {
  const T = TourProgress.data();
  for (const n in T.rules) {
    const at = T.rules[n].at; if (!at || Tour.countryOf(at) !== ow.C) continue;
    const p = ow.G.pos[at], node = ow.by[at]; if (!p || !node || !node.visible) continue;
    const x = p.x - 26, y = p.y - 16;
    ctx.save(); ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#c89a3a'; ctx.beginPath(); ctx.ellipse(x, y + 4, 8, 2.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(x, y + 3, 6, 6, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
});
{
  const om0 = TourOverworld.prototype.openMenu;
  TourOverworld.prototype.openMenu = function () {
    om0.call(this);
    if (!TourRules.count() || !this.menu) return;
    const M = this.menu, last = M[M.length - 1];
    // the HOUSE RULES row above TITLE (the menu moves up a little to make room)
    for (const b of M) b.y -= 27;
    M.splice(M.length - 1, 0, { x: last.x, y: last.y, w: last.w, h: last.h, label: 'HOUSE RULES (' + TourRules.count() + ')', fn: () => { this.menu = null; this.rulesOpen = TourRuleCut.lines(); Sound.play('select'); } });
    last.y += 54;
  };
  const up0 = TourOverworld.prototype.update;
  TourOverworld.prototype.update = function (dt, inp) {
    if (this.rulesOpen) { this.t += dt; this.rulesOpen.age = (this.rulesOpen.age || 0) + dt; if (this.rulesOpen.age > 0.3 && inp && (inp.taps.length || inp.enter || inp.back)) { this.rulesOpen = false; Input.setMode('game'); Sound.play('back'); } return; }
    return up0.call(this, dt, inp);
  };
  const dh0 = TourOverworld.prototype.drawHud;
  TourOverworld.prototype.drawHud = function (ctx) { dh0.call(this, ctx); if (this.rulesOpen) { ctx.save(); TourRuleCut.page(ctx, this.t, this.rulesOpen); ctx.restore(); } };
}
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; Object.assign(window.BRADY_TOUR, { TourRules, TOUR_RULES }); } } catch (e) { /* not in a browser */ }
