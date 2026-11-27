/* ============================================================
   TABLE FOR TWO: the boss, MADAME MANNERS (36-5), a serving fork with immaculate posture. She has the booth Chinka-O
   booked, and she will not eat until Brady has been offered everything twice. She can withstand anything except
   being offered the last bite. Stomping her is bad manners (it bounces off). Every hit is a courtesy returned with
   THROW from one of the two saucers on the booth's table (the saucer marks):
   1 THE BREAD     one tine curls (0.9 s, the tell) before she jabs the bread at Brady along the table (jump it, or be
                   out of reach). It lands on the saucer at his end: stand on it and tap THROW to offer it back.
   2 THE PICKLE    she rises to hover over the middle of the table. Two tines tap the porcelain (0.9 s, clink-clink)
                   before she sweeps the pickle across the setting at Brady (jump it). She turns to watch it go:
                   her open side is the one she turned her back on, and its saucer lights: get there (under her) and
                   send the saucer back.
   3 THE OLIVE     all four tines dip (0.8 s) before a feint: she offers the last olive with her tines closed round it
                   (THROW now and she snatches it back and jabs). Then the tines spread wide, visibly: that is the
                   real offer. THROW from a saucer then.
   Six courtesies. She finally eats the olive, takes a bow, and Brady and Chinka-O get the booth to themselves:
   Chinka-O's live postcard against the sugar bowl has the last word, and Brady gets the bill.
   ============================================================ */
(function () {
const TK = Tour.tableKit, INK = TK.INK, TabArt = TK.TabArt, K = TourKit;
const { RED, IVORY, NAVY, NAVY2, GOLD, OLIVE } = TK;

/* ---------------- her drawing (also the hostess in 36-5's lead-in, smaller) ---------------- */
// pose: idle | curl | jab | tap | sweep | dip | feint | spread | lift | offer | snatch | eat | bow | hurt
function drawManners(ctx, x, y, s, pose, t, dir) {
  ctx.save(); ctx.translate(x, y); ctx.scale((dir || -1) * s, s); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  const bow = pose === 'bow' ? 0.9 : pose === 'jab' || pose === 'sweep' ? 0.35 : pose === 'snatch' ? 0.2 : pose === 'eat' ? -0.1 : 0;
  // the handle: midnight blue, a little ivory fleur, standing on a round foot
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(0, -4, 20, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, -6); ctx.quadraticCurveTo(-13, -50, -6, -84); ctx.lineTo(6, -84); ctx.quadraticCurveTo(13, -50, 9, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(0, -50); ctx.quadraticCurveTo(5, -42, 0, -34); ctx.quadraticCurveTo(-5, -42, 0, -50); ctx.fill(); ctx.beginPath(); ctx.arc(-4, -40, 2.4, 0, TAU); ctx.arc(4, -40, 2.4, 0, TAU); ctx.fill();
  ctx.fillStyle = GOLD; rr(ctx, -9, -92, 18, 9, 4); ctx.fill(); ctx.stroke();
  // everything above the gold collar bows forward from it
  ctx.translate(0, -90); ctx.rotate(bow);
  // the head of the fork: polished silver-ivory, her face on it
  ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-24, -10, -22, -46); ctx.lineTo(22, -46); ctx.quadraticCurveTo(24, -10, 5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-16, -40, 4, 24);
  // the tines: four, each with its own act
  const spread = pose === 'spread' || pose === 'offer' ? 1 : 0, dip = pose === 'dip' || pose === 'feint' ? 1 : 0;
  for (let k = 0; k < 4; k++) {
    const tx = -16 + k * 10.7; let a = (k - 1.5) * 0.16 * spread, len = 34, curl = 0;
    if (pose === 'curl' && k === 3) curl = 1;
    if (pose === 'tap' && (k === 0 || k === 3)) a += Math.sin(t * 26) * 0.25;
    if (dip) { a += (k - 1.5) * -0.05; len = 26; }
    ctx.save(); ctx.translate(tx, -44); ctx.rotate(a); ctx.fillStyle = '#e8ecf4';
    if (curl) { ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-3, -16); ctx.quadraticCurveTo(-3, -30, 8, -28); ctx.quadraticCurveTo(14, -24, 8, -18); ctx.lineTo(3, -16); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { rr(ctx, -3, -len, 6, len + 2, 3); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  // what she holds on her tines: bread (1), the last olive (3)
  if (pose === 'curl' || pose === 'lift' || pose === 'offer' || pose === 'feint') { ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.ellipse(0, -82, 14, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#8a5220'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -86); ctx.lineTo(-2, -79); ctx.moveTo(2, -86); ctx.lineTo(6, -79); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; }
  if (pose === 'spread' || pose === 'dip') TabArt.olive(ctx, 0, -84, 10);
  if (pose === 'eat') TabArt.olive(ctx, 0, -20, 8 * Math.max(0, 1 - (t % 2)));
  // her face: lashes, a little red smile, eyes that close when she bows
  const shut = pose === 'bow' || pose === 'eat' || pose === 'hurt';
  for (const ex of [-8, 8]) {
    if (shut) { ctx.beginPath(); ctx.arc(ex, -26, 4, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, -27, 4.2, 5.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(ex + 1, -26, 2.2, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 1.6; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(ex - 3 + q * 3, -32); ctx.lineTo(ex - 4 + q * 3.5, -36); ctx.stroke(); } ctx.lineWidth = 2.4;
  }
  ctx.fillStyle = RED; ctx.beginPath(); if (pose === 'snatch' || pose === 'hurt') ctx.ellipse(0, -14, 4, 3, 0, 0, TAU); else { ctx.moveTo(-6, -15); ctx.quadraticCurveTo(0, -9, 6, -15); ctx.quadraticCurveTo(0, -12, -6, -15); } ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,140,0.45)'; ctx.beginPath(); ctx.arc(-14, -18, 4, 0, TAU); ctx.arc(14, -18, 4, 0, TAU); ctx.fill();
  ctx.restore();
}
TK.drawManners = drawManners;

/* ---------------- the saucers (THROW marks) ---------------- */
class TabSaucer extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.tabProp = true; this.side = s.side; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.glow = 0; this.item = null; }
  madame() { const b = this.g.boss; return b && !b.remove && b.style === 'table_manners' ? b : null; }
  tabTouch(p) { const b = this.madame(); return !!b && b.state === 'fight' && TK.onMark(p, this.tx, this.fy, 0.9); }
  tabInput(p, inp) { if (!inp.actionPressed) return; const b = this.madame(); if (b) brain.offer(b, this, p); }
  update(dt) { this.t += dt; this.glow = approach(this.glow, this.lit ? 1 : 0, dt * 4); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.fy * TS;
    ctx.save();
    if (this.glow > 0.02) { ctx.fillStyle = `rgba(255,230,140,${0.45 * this.glow * (0.7 + 0.3 * Math.sin(this.t * 8))})`; ctx.beginPath(); ctx.ellipse(x, y - 4, 34, 12, 0, 0, TAU); ctx.fill(); }
    TabArt.plate(ctx, x, y - 4, 22, 6, { band: RED });
    if (this.item === 'bread') { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.ellipse(x, y - 12, 12, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    const p = this.g.player; if (p && this.tabTouch(p) && (this.lit || this.item)) TK.handCue(ctx, x, y - 2 * TS - 30, this.t, 'THROW');
  }
}
ENTITY_TYPES.tabSaucer = TabSaucer;

// a courtesy on its way back to her (harmless): it flies in an arc from the saucer to her tines
class TabToss extends Ent {
  constructor(g, x, y, b, kind) { super(g, null, 20, 14); this.x0 = x; this.y0 = y; this.b = b; this.kind = kind; this.k = 0; this.x = x; this.y = y; this.friendly = true; }
  update(dt) { this.k += dt / 0.55; const b = this.b, tx = b.cx, ty = b.y + 20, k = Math.min(1, this.k); this.x = this.x0 + (tx - this.x0) * k; this.y = this.y0 + (ty - this.y0) * k - Math.sin(k * Math.PI) * 60; if (this.k >= 1) this.remove = true; }
  touchPlayer() {}
  draw(ctx) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; if (this.kind === 'bread') { ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 12, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); } else TabArt.plate(ctx, this.x, this.y, 16, 5, { band: RED }); ctx.restore(); }
}

/* ---------------- the brain ---------------- */
const lines = { thanks: ['THANK YOU, DEAR.', 'HOW VERY CIVIL.', 'MANNERS! FROM YOU?', 'WELL, I NEVER.'], stomp: 'ELBOWS OFF!' };
const breadArt = (c, s) => { c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; c.fillStyle = '#d8a050'; c.beginPath(); c.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); };
const pickleArt = (c, s) => { c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; c.fillStyle = '#6a8a2a'; c.translate(s.x + s.w / 2, s.y + s.h / 2); c.rotate(s.x / 12); c.beginPath(); c.ellipse(0, 0, s.w / 2, s.h / 2.4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#8aa84a'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * 6, -2, 1.6, 0, TAU); c.fill(); } c.restore(); };
const brain = {
  phases: [4, 2],
  guardText: lines.stomp,
  saucers(b) { return b.g.entities.filter(e => e instanceof TabSaucer).sort((a, c) => a.x - c.x); },
  wake(b) { b.phase = 1; b.homeX = b.x; b.baseY = b.y; K.say(b.g, b, 'A GUEST! WITHOUT A RESERVATION!', '#fff4e0'); },
  // Brady's end of the table: the saucer nearer him
  near(b) { const p = b.g.player, S = this.saucers(b); return S.reduce((m, s) => !m || Math.abs(s.cx - p.cx) < Math.abs(m.cx - p.cx) ? s : m, null); },
  light(b, which) { for (const s of this.saucers(b)) s.lit = s === which; },
  phase(b, n) {
    const g = b.g; this.light(b, null);
    for (const s of this.saucers(b)) s.item = null;
    if (n === 2) { g.bannerText = 'THE PICKLE!'; g.bannerT = 2; K.say(g, b, 'ONE DOES NOT REACH ACROSS THE TABLE. ONE SWEEPS.', '#fff4e0'); }
    if (n === 3) { g.bannerText = 'THE LAST OLIVE!'; g.bannerT = 2; K.say(g, b, 'THE LAST OLIVE. AFTER YOU... OR AFTER ME?', '#fff4e0'); }
    b.go('recover');
  },
  hurt(b) { K.say(b.g, b, pick(lines.thanks), '#ffd84a'); b.go('recover'); },
  // a courtesy offered from a saucer (THROW on its mark)
  offer(b, saucer, p) {
    const g = b.g, ph = b.phase || 1;
    if (b.hurtT > 0) return;
    if (ph === 1 && b.act === 'wait' && saucer.item === 'bread') {
      saucer.item = null; g.spawn(new TabToss(g, saucer.cx, saucer.y - 6, b, 'bread'));
      b.damage(1); return;
    }
    if (ph === 2 && b.act === 'open' && saucer.lit) { this.light(b, null); g.spawn(new TabToss(g, saucer.cx, saucer.y - 6, b, 'saucer')); b.damage(1); return; }
    if (ph === 3 && b.act === 'spread') { this.light(b, null); b.damage(1); return; }
    if (ph === 3 && b.act === 'feint') { K.say(g, b, 'TOO EAGER!', '#ff9a9a'); b.go('snatch'); return; }
    g.parts.text(p.cx, p.y - 14, ph === 1 ? 'NOTHING TO OFFER YET' : ph === 2 ? 'NOT FROM THAT SIDE: HER OPEN SIDE' : 'WAIT FOR THE TINES TO SPREAD', '#ffd8a0');
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce'; b.vx = 0;
    const S = this.saucers(b);
    // where she stands: at her end of the table (phases 1 and 3), hovering over the middle (phase 2)
    const midX = (b.arenaX0 + b.arenaX1) / 2 - b.w / 2, homeX = b.arenaX1 - 5 * TS - b.w / 2;
    const wantX = ph === 2 ? midX : homeX, wantY = ph === 2 ? b.baseY - 2.25 * TS : b.baseY;
    b.x = approach(b.x, wantX, 4 * TS * dt); b.y = approach(b.y, wantY, 3 * TS * dt);
    if (b.act !== 'open' && b.act !== 'sweep') b.face();
    b.pose = 'idle';
    if (b.act === 'walk' || b.act === 'recover') { if (b.at > (b.act === 'recover' ? 1.2 : 0.9)) b.go(ph === 1 ? 'curl' : ph === 2 ? 'tap' : 'dip'); }
    // ---- 1: the bread ----
    else if (b.act === 'curl') {
      b.pose = 'curl'; if (b.first) { K.say(g, b, 'A LITTLE BREAD?', '#fff4e0'); TourKit.sfx('ting', 'select', { vol: 0.4, pitch: 1.8 }); }
      if (b.at > 0.9) {
        b.go('jab'); const d = p && p.cx < b.cx ? -1 : 1;
        tourFire(g, b.cx + d * 30, b.floorY - 10, { vx: d * 8 * TS, w: 26, h: 18, life: 2.4, ground: true, col: '#d8a050', art: breadArt });
        b.breadT = 0; b.breadTo = S.length ? S.reduce((m, s) => !m || Math.abs(s.cx - (b.cx + d * 9 * TS)) < Math.abs(m.cx - (b.cx + d * 9 * TS)) ? s : m, null) : null;
      }
    } else if (b.act === 'jab') {
      b.pose = 'jab';
      if (b.at > 1.1) { if (b.breadTo) { b.breadTo.item = 'bread'; this.light(b, b.breadTo); } b.go('wait'); K.say(g, b, 'WELL? AREN\'T YOU GOING TO OFFER IT BACK?', '#fff4e0'); }
    } else if (b.act === 'wait') {
      b.pose = 'idle'; if (b.at > 3.0) { for (const s of S) s.item = null; this.light(b, null); K.say(g, b, 'HMPH. I SHALL KEEP IT.', '#fff4e0'); b.go('walk'); }
    }
    // ---- 2: the pickle ----
    else if (b.act === 'tap') {
      b.pose = 'tap'; if (b.first) K.say(g, b, 'CLINK-CLINK!', '#e8ecff');
      if (Math.random() < 0.2) g.burst(b.cx + (Math.random() - 0.5) * 30, b.y + 4, 1, '#ffffff', 'spark');
      if (b.at > 0.9) { b.go('sweep'); const d = p && p.cx < b.cx ? -1 : 1; b.sweepDir = d; b.dir = d; tourFire(g, b.cx + d * 20, b.floorY - 9, { vx: d * 7 * TS, w: 30, h: 16, life: 3.2, ground: true, col: '#6a8a2a', art: pickleArt }); }
    } else if (b.act === 'sweep') {
      b.pose = 'sweep'; b.dir = b.sweepDir;
      // she turns to watch the pickle go: her back (her open side) is the other side, and its saucer lights
      if (b.at > 0.8) { b.go('open'); b.dir = b.sweepDir; const open = S.find(s => sign(s.cx - b.cx) === -b.sweepDir); this.light(b, open); }
    } else if (b.act === 'open') {
      b.pose = 'idle'; b.dir = b.sweepDir; if (b.at > 3.2) { this.light(b, null); b.go('walk'); }
    }
    // ---- 3: the olive ----
    else if (b.act === 'dip') { b.pose = 'dip'; if (b.first) K.say(g, b, 'THE LAST OLIVE...', '#fff4e0'); if (b.at > 0.8) { b.go('feint'); K.say(g, b, 'AFTER YOU!', '#fff4e0'); } }
    else if (b.act === 'feint') { b.pose = 'feint'; if (b.at > 1.0) { b.go('spread'); K.say(g, b, 'NO, REALLY. AFTER YOU.', '#ffd84a'); this.light(b, this.near(b)); } }
    else if (b.act === 'spread') { b.pose = 'spread'; if (b.at > 1.8) { this.light(b, null); b.go('walk'); } }
    else if (b.act === 'snatch') {
      b.pose = 'snatch';
      if (b.first) { b.snatchJab = false; }
      if (b.at > 0.6 && !b.snatchJab) { b.snatchJab = true; const d = p && p.cx < b.cx ? -1 : 1; tourFire(g, b.cx + d * 30, b.floorY - 10, { vx: d * 9 * TS, w: 26, h: 18, life: 2.2, ground: true, col: '#6a8a2a', art: (c, s2) => TabArt.olive(c, s2.x + s2.w / 2, s2.y + s2.h / 2, 9) }); }
      if (b.at > 1.4) b.go('walk');
    } else b.go('walk');
    if (ph !== 1 && b.act !== 'open') for (const s of S) if (!(ph === 3 && b.act === 'spread')) s.lit = false;
  },
  lastHit(b) { for (const s of this.saucers(b)) { s.lit = false; s.item = null; } K.say(b.g, b, 'OH... VERY WELL. *NOM*', '#ffd84a'); return false; },
  draw(b, ctx, t) {
    const pose = b.state === 'dying' ? 'eat' : b.hurtT > 0.4 ? 'hurt' : b.pose || 'idle';
    drawManners(ctx, b.cx, b.y + b.h, 0.88, pose, t, b.dir || -1);
  }
};
const boss = { id: 'table_manners', name: 'Madame Manners', hp: 6, dims: [50, 132], floats: true, music: 'tour_table_boss', country: 'table', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.table_manners = [70, 70, 40, 10];

// the booth: the table's top, two saucers (one at each end), the sugar bowl with Chinka-O's live postcard against
// it at the far end, candles
Tour.pieces['table.arena_booth'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.spawn('tabSaucer', x0 + 5, GY - 1, { side: -1 });
  B.spawn('tabSaucer', x0 + w - 3, GY - 1, { side: 1 });
  B.decorAt('tabCandle', x0 + 2, GY, 1); B.decorAt('tabCandle', x0 + w - 1, GY, 2);
  B.spawn('tabPostcardLive', x0 + 9, GY - 5, { shelf: true });
};

/* ---------------- Chinka-O's live postcard, propped against the sugar bowl ---------------- */
// on the booth's far end: a postcard with Chinka-O in it (the game's own Chinka-O), waving from the far end of the
// picture. When Madame Manners is beaten she gets the last word, and Brady gets the bill.
class TabPostcardLive extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 2 * TS); this.x = s.x - TS; this.y = s.y - 2 * TS; this.back = true; this.friendly = true; this.endT = -1; }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss;
    if (this.endT < 0 && g.bossDone && !this.spoke) { this.spoke = true; this.endT = 0; }
    if (this.endT < 0 && b && b.style === 'table_manners' && (b.state === 'dying' || b.remove) && !this.spoke) { this.spoke = true; this.endT = 0; }
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 0.4 && !this.said1) { this.said1 = true; g.parts.text(this.cx, this.y - 30, 'THE BOOTH IS OURS, DARLING.', '#ffd8f0'); }
      if (this.endT > 1.8 && !this.said2) { this.said2 = true; g.parts.text(this.cx, this.y - 30, 'AND YOU\'RE PAYING. ♥ C', '#ffd8f0'); }
      if (this.endT > 1.2 && !this.bill) { this.bill = true; const p = g.player; if (p) { g.burst(p.cx, p.y - 30, 10, '#ffffff', 'confetti'); g.parts.text(p.cx, p.y - 44, 'THE BILL', '#ffffff'); } }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the little wall shelf it stands on, over the booth's table
    if (this.s.shelf) { ctx.fillStyle = '#5e341c'; ctx.fillRect(x - 44, y, 100, 8); ctx.strokeRect(x - 44, y, 100, 8); ctx.fillRect(x - 36, y + 8, 6, 14); ctx.fillRect(x + 42, y + 8, 6, 14); }
    Decor.tabSugar(ctx, x + 20, y);
    // the postcard leaning on the bowl: a cream card, a little scene of a far table under a lamp, Chinka-O in it
    ctx.save(); ctx.translate(x - 8, y); ctx.rotate(-0.18);
    ctx.fillStyle = '#fbf3e0'; ctx.fillRect(-26, -56, 52, 56); ctx.strokeRect(-26, -56, 52, 56);
    ctx.fillStyle = '#3a2a4e'; ctx.fillRect(-22, -52, 44, 40);
    ctx.fillStyle = 'rgba(255,220,140,0.5)'; ctx.beginPath(); ctx.arc(10, -46, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0403a'; ctx.fillRect(-18, -20, 36, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(-22, -52, 44, 40); ctx.clip();
    if (typeof ChinkaO !== 'undefined') { try { ChinkaO.draw(ctx, { x: 2, y: -14, scale: 0.42, facing: -1, t, pose: this.endT >= 0 ? 'wave' : 'idle' }); } catch (e) { /* the card stays a picture */ } }
    ctx.restore();
    ctx.fillStyle = '#e0403a'; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('WISH YOU WERE HERE', 0, -4);
    ctx.restore();
    ctx.restore();
  }
}
ENTITY_TYPES.tabPostcardLive = TabPostcardLive;
TK.mannersBrain = brain; TK.TabSaucer = TabSaucer;
})();
