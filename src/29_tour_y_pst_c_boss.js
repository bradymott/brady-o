/* ============================================================
   PUPO STANDARD TIME: 32-6 FINISH MY SENTENCE and its boss, THE INTERRUPTER (docs/design/CHATGPT_RELAY.md A7).
   The great dream parrot reads Pupo's sentence back and will not let him finish it. Pupo sits at his little lectern
   on the left, saying his words one at a time; along the desk the sentence is written on a strip of paper, with a
   slot after each word. The full stop is a fat ink ball: Brady pushes it by walking into it.
   The lead-in (the study): comma seeds rain from a parrot's echo on the bookshelf; push the full stop along the strip
   to the slot after "MORE", the end of the part worth keeping: the door to the arena unlocks.
   The fight, three phases, two hits each; every hit is the full stop in the right slot at the right moment:
   1 THE COMMAS     it sucks in its cheeks (0.8 s) and spits a mouthful of comma seeds at Brady. With the stop just
                    behind Pupo's first word, the seeds plop harmlessly on the desk and the parrot chokes on its
                    unfinished interruption.
   2 THE CLAUSE     it raises a wing (0.8 s) and sweeps a whole clause of words along the floor (jump it). With the
                    stop behind Pupo's second word, the sweep is cut off where it starts.
   3 THE SHOUT      its beak opens round an empty speech bubble (1 s) before the final shout (a ring of sound: jump
                    it). Stand beside the blank space in the sentence, quietly, until Pupo says "please" himself; then
                    put the stop in the slot after it.
   The parrot, appalled by its own manners, passes the biscuits.
   ============================================================ */
(function () {
const PSAY = (...a) => Tour.pstKit.say(...a);
const K = Tour.pstKit; if (!K) return;
const { PstArt, INK, HONEY, HONEY_HI, HONEY_LO, PLUM, PLUM_HI, PLUM_LO, MINT, MINT_HI, MINT_LO, CREAM, CREAM_LO } = K;
const KK = TourKit;
const WORDS = ['I', 'WOULD', 'LIKE', 'MORE...'];

/* ---------------- the full stop: a fat ink ball, pushed by walking into it ---------------- */
class PstStop extends Ent {
  constructor(g, s) { super(g, s, 28, 28); this.friendly = false; this.home = this.x; this.slots = s.slots || []; this.slotIn = -1; this.rot = 0; this.min = (s.minX != null ? s.minX : -1e9); this.max = (s.maxX != null ? s.maxX : 1e9); }
  reset(hx) { this.x = hx != null ? hx : this.home; this.vx = 0; this.slotIn = -1; this.leftT = 0.3; this.g.burst(this.cx, this.cy, 10, '#2a2a4a', 'dust'); }
  update(dt) {
    this.t += dt; if (this.leftT > 0) this.leftT -= dt; if (this.lockT > 0) this.lockT -= dt;
    const A = this.g.area;
    // roll and slow down; never past a wall or off the edge of its strip
    if (this.slotIn < 0) {
      const last = this.slots.length ? this.slots[this.slots.length - 1] * TS + TS / 2 - this.w / 2 : this.max - this.w;
      const nx = clamp(this.x + this.vx * dt, this.min, Math.min(this.max - this.w, last));
      const ahead = Math.floor((this.vx > 0 ? nx + this.w : nx) / TS), row = Math.floor((this.y + this.h - 4) / TS);
      if (!SOLID[tileAt(A, ahead, row)]) { this.rot += (nx - this.x) / 14; this.x = nx; } else this.vx = 0;
      this.vx = approach(this.vx, 0, 7 * TS * dt);
      // a slot catches it when it rolls in slowly enough
      for (let k = 0; k < this.slots.length; k++) { const sx = this.slots[k] * TS + TS / 2; if (Math.abs(this.cx - sx) < 10 && !(this.leftT > 0)) { this.slotIn = k; this.lockT = 0.6; this.x = sx - this.w / 2; this.vx = 0; Sound.play('land', { vol: 0.5, pitch: 0.7 }); PSAY(this.g, this.cx, this.y - 10, 'FULL STOP.', '#ffffff'); break; } }
    }
  }
  touchPlayer(p) {
    if (p.dead) return;
    const d = sign(this.cx - p.cx);
    if (p.y + p.h <= this.y + 8) { if (p.vy >= 0) { p.y = this.y - p.h; p.vy = 0; p.onGround = true; } return; }
    // pushed from the side: it rolls ahead of Brady (out of a slot too, if he pushes it on)
    if (d > 0 && p.vx > 0 && !(this.lockT > 0) && !(d > 0 && this.slotIn === this.slots.length - 1)) { if (this.slotIn >= 0) { this.slotIn = -1; this.leftT = 0.35; } this.vx = p.vx * 1.05; }
    // a sentence reads one way: the stop only rolls forward, and Brady walks back past it (in front of it) freely,
    // so after a hit he can always get behind it again without a jump
    if (d > 0 && p.vx >= 0) p.x = Math.min(p.x, this.x - p.w + 2);
  }
  draw(ctx) {
    const x = this.cx, y = this.cy;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, this.y + this.h, 15, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1430'; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,184,240,0.6)'; ctx.beginPath(); ctx.arc(x - 4 + Math.cos(this.rot) * 2, y - 5 + Math.sin(this.rot) * 2, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
ENTITY_TYPES.pstStop = PstStop;
// the sentence strip on the desk: the words, the slots after them, and (in the arena) the blank before "please"
class PstStrip extends Ent {
  constructor(g, s) { super(g, s, (s.n || 20) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - 4; this.friendly = true; this.back = true; this.words = s.words || []; this.slots = s.slots || []; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const y = this.y + 4;
    ctx.save(); ctx.fillStyle = '#fff8ec'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillRect(this.x, y - 2, this.w, 8); ctx.strokeRect(this.x, y - 2, this.w, 8);
    ctx.font = '13px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineJoin = 'round';
    for (const [tx, wd, col] of this.words) { ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.strokeText(wd, tx * TS + TS / 2, y - 6); ctx.fillStyle = col === CREAM_LO ? '#b8a8c8' : col === MINT_LO ? MINT : HONEY_HI; ctx.fillText(wd, tx * TS + TS / 2, y - 6); }
    for (const sx of this.slots) { const x = sx * TS + TS / 2, k = 0.5 + 0.5 * Math.sin(this.t * 4); ctx.fillStyle = `rgba(255,214,115,${0.25 + 0.3 * k})`; ctx.beginPath(); ctx.ellipse(x, y + 1, 18 + k * 5, 6 + k * 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1430'; ctx.beginPath(); ctx.ellipse(x, y + 2, 13, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd673'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffd673'; ctx.beginPath(); ctx.moveTo(x, y - 30 - k * 6); ctx.lineTo(x - 7, y - 40 - k * 6); ctx.lineTo(x + 7, y - 40 - k * 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstStrip = PstStrip;
// Pupo at his lectern, saying his slow sentence (a speech bubble with the word he is on)
class PstSpeaker extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 3 * TS); this.friendly = true; this.back = true; this.word = ''; this.wordT = 0; }
  say(w, t) { this.word = w; this.wordT = t || 2.2; }
  update(dt) { this.t += dt; if (this.wordT > 0) this.wordT -= dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save();
    Ink.around(ctx, x - 50, y - 90, 100, 92, c => Pupo.draw(c, { x: x - 6, y, scale: 0.72, facing: 1, t, pose: 'idle', mood: this.word === 'PLEASE' ? 'happy' : 'calm' }), { pad: 4, width: 1.6 });
    ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x + 14, y - 36, 26, 36); ctx.strokeRect(x + 14, y - 36, 26, 36); ctx.fillStyle = '#fff8ec'; ctx.fillRect(x + 10, y - 40, 34, 6); ctx.strokeRect(x + 10, y - 40, 34, 6);
    if (this.wordT > 0 && this.word) { const w = Math.max(54, this.word.length * 9 + 24); PstArt.bubble(ctx, x - w / 2 + 10, y - 132, w, 34); PstArt.tail(ctx, x + 4, y - 96, x - 2, y - 76, 3, 4); ctx.fillStyle = this.word === 'PLEASE' ? '#3a8a5a' : PLUM; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.word, x + 10, y - 116); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstSpeaker = PstSpeaker;

/* ---------------- the lead-in's parts: the parrot's echo on the shelf (comma seeds), the strip's lock ---------------- */
// a little carved parrot head on a shelf: it sucks its cheeks (0.7 s) and spits three comma seeds in a fan
class PstEcho extends Ent {
  constructor(g, s) { super(g, s, 30, 30); this.friendly = true; this.period = s.period || 3.2; this.c = s.phase || 0; this.k = 0; }
  update(dt) {
    this.t += dt; this.c += dt;
    const q = this.c % this.period; this.k = q > this.period - 0.7 ? (q - (this.period - 0.7)) / 0.7 : 0;
    if (this.c >= this.period) { this.c -= this.period; if (this.g.onScreen(this, 80)) { for (const vx of [-90, 0, 90]) tourFire(this.g, this.cx, this.y + this.h, { vx, vy: 60, grav: 700, w: 14, h: 14, life: 3, art: commaArt }); TourKit.sfx('ptoo', 'bump', { vol: 0.35, pitch: 1.6 }); } }
  }
  touchPlayer() {}
  draw(ctx) { parrotHead(ctx, this.cx, this.y + this.h, 0.5, this.k, this.t); }
}
ENTITY_TYPES.pstEcho = PstEcho;
const commaArt = (c, s) => { c.save(); c.fillStyle = '#1a1430'; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.arc(s.x + s.w / 2, s.y + s.h / 2 - 2, 5, 0, TAU); c.fill(); c.beginPath(); c.moveTo(s.x + s.w / 2 + 3, s.y + s.h / 2); c.quadraticCurveTo(s.x + s.w / 2 + 2, s.y + s.h / 2 + 8, s.x + s.w / 2 - 4, s.y + s.h / 2 + 10); c.lineWidth = 3; c.strokeStyle = '#1a1430'; c.stroke(); c.restore(); };
// the parrot's head (the echo and the boss share it): mint and plum, a honey beak, puffed cheeks k (0..1)
function parrotHead(ctx, x, y, s, k, t, beak) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.fillStyle = MINT; ctx.beginPath(); ctx.ellipse(0, -30, 26, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PLUM; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 16, -20, 10 + k * 8, 9 + k * 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = MINT_HI; ctx.beginPath(); ctx.moveTo(-8, -58); ctx.quadraticCurveTo(-4, -76, 6, -70); ctx.quadraticCurveTo(0, -64, 4, -58); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-9, -38, 6, 0, TAU); ctx.arc(9, -38, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-8, -37, 2.6, 0, TAU); ctx.arc(10, -37, 2.6, 0, TAU); ctx.fill();
  const op = beak || 0;
  ctx.fillStyle = HONEY; ctx.beginPath(); ctx.moveTo(-9, -28); ctx.quadraticCurveTo(0, -36, 12, -28); ctx.quadraticCurveTo(14, -16 + op * 4, 4, -12 - op * 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = HONEY_LO; ctx.beginPath(); ctx.moveTo(-6, -22 + op * 10); ctx.quadraticCurveTo(2, -14 + op * 14, 8, -20 + op * 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// the strip's slot after "MORE": the stop in it unlocks the door (the key 'pst:stop'); the checker: a virtual key there
TourHooks.on('playUpdate', (play) => {
  const A = play.area; if (!A || !A.pstLead) return;
  const st = play.entities.find(e => e instanceof PstStop && !e.remove);
  if (st && st.slotIn >= 0 && !play.keys.has('pst:stop')) { play.keys.add('pst:stop'); play.bannerText = 'THE PART WORTH KEEPING'; play.bannerT = 1.6; Sound.play('secret', { vol: 0.6 }); }
});
Tour.pieces['pst.echo'] = function (st, o) { st.B.spawn('pstEcho', st.x, st.gy - 1, { period: o.period || 3.2, phase: o.phase || 0 }); return st.x; };
// the lead-in strip: { n, words: [[dx, word]], slot: dx, stop: dx } at the letter (on the floor row)
Tour.pieces['pst.sentence'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1;
  B.spawn('pstStrip', x, y, { n: o.n, words: o.words.map(([dx, w, c]) => [x + dx, w, c]), slots: [x + o.slot] });
  B.spawn('pstStop', x + o.stop, y, { slots: [x + o.slot], minX: x * TS, maxX: (x + o.n) * TS });
  B.vkey('pst:stop', [[x + o.slot, y]]);
  return x;
};

/* ---------------- the arena: the desk, Pupo's lectern, the sentence and its three slots ---------------- */
Tour.pieces['pst.arena_desk'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o, y = GY - 1;
  B.spawn('pstSpeaker', x0 + 1, y, {});
  const slots = [x0 + 7, x0 + 11, x0 + 17];
  B.spawn('pstStrip', x0 + 3, y, { n: 17, words: [[x0 + 5, 'I'], [x0 + 9, 'WOULD'], [x0 + 13, 'LIKE'], [x0 + 15, '. . .', CREAM_LO], [x0 + 19, 'PLEASE?', MINT_LO]], slots });
  B.spawn('pstStop', x0 + 4, y, { slots, minX: (x0 + 3) * TS, maxX: (x0 + 20) * TS });
  B.decorAt('pstInkpot', x0 + w - 2, GY, 1); B.decorAt('pstLamp', x0 + 3, GY, 2);
};

/* ---------------- The Interrupter ---------------- */
const SAY = ['I-', 'BUT-', 'ACTUALLY-', 'IF I MAY-', 'SORRY, BUT-', 'WELL-'];
const brain = {
  phases: [4, 2],
  guardText: 'EXCUSE ME!',
  wake(b) { b.phase = 1; PSAY(b.g, b.cx, b.y - 34, 'AND THEN HE SAID, AND THEN HE SAID-', '#c4f2d2'); b.homeX = b.x; this.restart(b); },
  parts(b) { const g = b.g; return { stop: g.entities.find(e => e instanceof PstStop && !e.remove), pupo: g.entities.find(e => e instanceof PstSpeaker && !e.remove) }; },
  // in phase 3 the stop waits just before the blank (x0+14), so Brady stands behind it, beside the blank, and nudges it 3 tiles
  restart(b) { const { stop, pupo } = this.parts(b); if (stop) stop.reset((b.phase || 1) >= 3 ? (b.arenaX0 / TS + 14) * TS + TS / 2 - stop.w / 2 : null); b.word = 0; b.wordT = 0.4; b.please = false; b.quietT = 0; if (pupo) pupo.say('', 0); },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'A WHOLE CLAUSE!'; g.bannerT = 2; PSAY(g, b.cx, b.y - 34, 'LET ME JUST SWEEP THAT ASIDE-', '#c4f2d2'); }
    if (n === 3) { g.bannerText = 'THE LAST WORD'; g.bannerT = 2; PSAY(g, b.cx, b.y - 34, 'I SHALL HAVE THE LAST WORD!', '#c4f2d2'); }
    this.restart(b); b.go('recover');
  },
  hurt(b) { PSAY(b.g, b.cx, b.y - 34, pick(['...!', 'I WAS INTERRUPTED!', 'HOW RUDE OF ME!', 'MMPH!']), '#c4f2d2'); this.restart(b); b.go('recover'); },
  lastHit(b) { PSAY(b.g, b.cx, b.y - 34, 'OH. OH DEAR. HOW RUDE OF ME. BISCUIT?', '#fff4dc'); b.biscuit = 1; return false; },
  // a stop in this phase's slot?
  inSlot(b) { const { stop } = this.parts(b); return stop && stop.slotIn === (b.phase || 1) - 1; },
  // Pupo's slow sentence: a word every 1.8 s; in phase 3 "please" comes only after a long quiet beside the blank
  speak(b, dt) {
    const g = b.g, p = g.player, { pupo, stop } = this.parts(b); if (!pupo) return;
    b.wordT -= dt;
    if (b.wordT <= 0 && b.word < WORDS.length) { pupo.say(WORDS[b.word], 1.6); b.word++; b.wordT = 1.8; }
    if (b.word >= WORDS.length && b.wordT <= 0) { b.word = 0; b.wordT = 1.2; }
    if ((b.phase || 1) >= 3 && !b.please) {
      // quiet = near the blank (3 tiles either side) and not running; a hop over a shout only pauses the count,
      // walking away resets it; the blank must still be blank (the stop not already in the last slot)
      const blank = this.blankX(b), near = p && !p.dead && Math.abs(p.cx - blank) < 3.2 * TS && Math.abs(p.vx) < 3 * TS;
      if (stop && stop.slotIn === 2) b.quietT = 0;
      else if (near) { if (p.onGround) b.quietT = (b.quietT || 0) + dt; }
      else b.quietT = 0;
      if (!(b.wordT > 0.2) && b.quietT > 0) pupo.say('. . .', 0.4);
      if (b.quietT > 1.5) {
        b.please = true; b.pleaseT = 12; pupo.say('PLEASE', 12); Sound.play('select', { vol: 0.7, pitch: 1.5 });
        g.bannerText = 'NOW! PUSH THE FULL STOP IN!'; g.bannerT = 2.6;
        for (const e of g.entities) if (e.constructor && e.constructor.name === 'TourShot') { g.burst(e.cx, e.cy, 4, '#fff4dc', 'dust'); e.remove = true; }
      }
    }
    if (b.please) { b.pleaseT -= dt; if (b.pleaseT <= 0) { b.please = false; b.quietT = 0; } }
  },
  blankX(b) { return (b.arenaX0 / TS + 15) * TS + TS / 2; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce';
    this.speak(b, dt);
    if (b.act === 'walk') b.go('perch');
    if (ph >= 3 && b.please) {
      // "please": the parrot holds its tongue (no shouts) until the stop drops into the last slot, which is the hit
      b.pose = 'hush'; b.face(); b.y = approach(b.y, b.floorY - b.h - 40, 120 * dt);
      if (this.inSlot(b)) { PSAY(g, b.cx, b.y - 34, '...', '#c4f2d2'); b.damage(1, { text: 'THANK YOU!' }); }
      return;
    }
    if (b.act === 'perch' || b.act === 'recover') {
      // perched on its inkstand, bobbing, chattering over Pupo
      b.pose = 'perch'; b.face(); b.y = approach(b.y, b.floorY - b.h - 40, 120 * dt); b.x = approach(b.x, b.homeX, 120 * dt);
      if (Math.random() < 0.006) PSAY(g, b.cx, b.y - 34, pick(SAY), '#c4f2d2');
      if (b.at > (b.act === 'recover' ? 1.4 : ph >= 3 ? 2.4 : 2.0)) b.go(ph === 1 ? 'suck' : ph === 2 ? 'wing' : 'beak');
    } else if (b.act === 'suck') {
      // phase 1's tell: the cheeks puff up (0.8 s)
      b.pose = 'suck'; if (b.first) TourKit.sfx('inhale', 'float', { vol: 0.4, pitch: 0.6 });
      if (b.at > 1.1) {
        if (this.inSlot(b)) { for (let k = 0; k < 5; k++) g.burst(b.cx - 30 - k * 12, b.floorY - 4, 3, '#1a1430', 'dust'); PSAY(g, b.cx, b.y - 34, 'PTOO- ...OH.', '#c4f2d2'); b.damage(1, { text: 'FULL STOP!' }); return; }
        const dx = p ? p.cx - b.cx : -200;
        for (let k = 0; k < 5; k++) tourFire(g, b.cx - 20, b.y + 40, { vx: dx * 0.6 + (k - 2) * 50, vy: -220 - k * 15, grav: 620, w: 14, h: 14, life: 3, art: commaArt });
        TourKit.sfx('ptoo', 'bump', { vol: 0.5, pitch: 1.4 }); b.go('perch');
      }
    } else if (b.act === 'wing') {
      // phase 2's tell: a wing goes up (0.8 s), then a whole clause sweeps along the floor
      b.pose = 'wing'; if (b.first) PSAY(g, b.cx, b.y - 34, 'TO SWEEP THAT ASIDE-', '#c4f2d2');
      if (b.at > 1.1) {
        if (this.inSlot(b)) { PSAY(g, b.cx, b.y - 34, 'TO SWEEP- ...OH.', '#c4f2d2'); g.shake(4); b.damage(1, { text: 'FULL STOP!' }); return; }
        tourFire(g, b.arenaX1 - 20, b.floorY - 13, { vx: -3.4 * TS, vy: 0, w: 50, h: 26, life: 7, thru: true, art: clauseArt, text: 'AND ANOTHER THING' });
        TourKit.sfx('swoosh', 'float', { vol: 0.5, pitch: 0.7 }); b.go('perch');
      }
    } else if (b.act === 'beak') {
      // phase 3's tell: the beak opens round an empty speech bubble (1 s) before the shout
      b.pose = 'beak';
      if (b.at > 1.0) {
        if (this.inSlot(b) && b.please) { PSAY(g, b.cx, b.y - 34, '...', '#c4f2d2'); b.damage(1, { text: 'THANK YOU!' }); return; }
        if (this.inSlot(b)) { const { stop } = this.parts(b); if (stop) { stop.slotIn = -1; stop.vx = -4 * TS; stop.leftT = 0.8; } PSAY(g, b.cx, b.y - 34, 'NOT UNTIL HE SAYS IT!', '#c4f2d2'); }
        tourFire(g, b.cx - 30, b.floorY - 40, { vx: -3.6 * TS, vy: 0, w: 26, h: 44, life: 6, thru: true, art: shoutArt });
        TourKit.sfx('squawk', 'bump', { vol: 0.6, pitch: 0.5 }); g.shake(3); b.go('perch');
      }
    } else b.go('perch');
  },
  draw(b, ctx, t) {
    const x = b.cx, y = b.y + b.h, P = b.pose || 'perch', flap = Math.sin(t * 6);
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    // the inkstand perch under it
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 40, b.floorY - 40, 80, 40); ctx.strokeRect(x - 40, b.floorY - 40, 80, 40);
    ctx.fillStyle = '#1a1430'; ctx.beginPath(); ctx.ellipse(x - 18, b.floorY - 40, 12, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 46, b.floorY - 44, 92, 6); ctx.strokeRect(x - 46, b.floorY - 44, 92, 6);
    // body, cream bib, plum wings (one raised for the sweep), honey feet
    ctx.fillStyle = MINT; ctx.beginPath(); ctx.ellipse(x, y - 34, 28, 36, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(x - 6, y - 30, 16, 24, 0, 0, TAU); ctx.fill();
    const wingUp = P === 'wing' ? Math.min(1, b.at / 0.4) : 0;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(x + sd * 22, y - 48); ctx.rotate(sd * (0.5 + flap * 0.08) - (sd > 0 ? wingUp * 1.6 : 0));
      ctx.fillStyle = PLUM; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 30, 10, sd * 18, 46); ctx.quadraticCurveTo(sd * 4, 30, 0, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(sd * 8, 26); ctx.lineTo(sd * 18, 46); ctx.lineTo(sd * 4, 34); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = HONEY; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sd * 10, y - 2, 7, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    // the head: cheeks puff for the commas, the beak opens round an empty bubble for the shout
    const k = P === 'suck' ? Math.min(1, b.at / 0.8) : 0, beak = P === 'beak' ? Math.min(1, b.at / 0.5) : 0;
    parrotHead(ctx, x - 6, y - 52, 0.95, k, t, beak);
    if (P === 'hush') { ctx.fillStyle = PLUM; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x - 4, y - 72, 22, 9, -0.3, 0, TAU); ctx.fill(); ctx.stroke(); PstArt.bubble(ctx, x - 70, y - 150, 50, 30); ctx.fillStyle = PLUM; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('...', x - 45, y - 135); }
    if (P === 'beak') { PstArt.bubble(ctx, x - 90, y - 150, 70, 34); PstArt.tail(ctx, x - 30, y - 114, x - 14, y - 90, 3, 4); }
    // phase 3's cues: a hush ring on the floor at the blank filling while Brady waits; then NOW! over the stop
    if ((b.phase || 1) >= 3 && !b.biscuit && b.state !== 'dying') {
      const bx = this.blankX(b), fy = b.floorY, st = g0(b);
      if (!b.please) {
        const k = Math.min(1, (b.quietT || 0) / 1.5);
        ctx.fillStyle = 'rgba(26,20,48,0.55)'; ctx.beginPath(); ctx.ellipse(bx - TS, fy - 3, 3.1 * TS, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(140,230,170,0.75)'; ctx.beginPath(); ctx.ellipse(bx - TS, fy - 3, 3.1 * TS * k, 9 * k, 0, 0, TAU); ctx.fill();
        ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.strokeText('SHH... WAIT FOR "PLEASE"', bx - TS, fy + 14); ctx.fillStyle = '#ffffff'; ctx.fillText('SHH... WAIT FOR "PLEASE"', bx - TS, fy + 14);
      } else if (st) {
        const j = Math.abs(Math.sin(t * 6)) * 8, sx = st.cx, sy = st.y - 18 - j, tx = st.slots[2] * TS + TS / 2;
        ctx.fillStyle = '#5ee08a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx - 16, sy - 10); ctx.lineTo(sx + 10, sy - 10); ctx.lineTo(sx + 10, sy - 20); ctx.lineTo(sx + 30, sy - 2); ctx.lineTo(sx + 10, sy + 16); ctx.lineTo(sx + 10, sy + 6); ctx.lineTo(sx - 16, sy + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.font = '16px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeText('NOW!', sx + 6, sy - 36); ctx.fillStyle = '#5ee08a'; ctx.fillText('NOW!', sx + 6, sy - 36);
        ctx.strokeStyle = '#5ee08a'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(tx, fy - 2, 20 + j, 7, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    if (b.biscuit) { ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.arc(x - 40, y - 60, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7a4a2a'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(x - 44 + (q % 2) * 7, y - 64 + Math.floor(q / 2) * 7, 1.4, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
};
const g0 = b => b.g.entities.find(e => e instanceof PstStop && !e.remove);
const clauseArt = (c, s) => { c.save(); c.fillStyle = '#fff8ec'; c.strokeStyle = INK; c.lineWidth = 2; rr(c, s.x, s.y, s.w, s.h, 6); c.fill(); c.stroke(); c.fillStyle = PLUM; c.font = '8px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AND', s.x + s.w / 2, s.y + 8); c.fillText('ANOTHER', s.x + s.w / 2, s.y + 18); c.restore(); };
const shoutArt = (c, s) => { c.save(); c.strokeStyle = 'rgba(255,240,200,0.95)'; c.lineWidth = 4; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(s.x + s.w / 2 + k * 6, s.y + s.h / 2, 14 + k * 6, Math.PI * 0.65, Math.PI * 1.35); c.stroke(); } c.fillStyle = '#fff4dc'; c.font = '9px ' + FONT_DISPLAY; c.textAlign = 'center'; c.fillText('!!', s.x + s.w / 2, s.y - 2); c.restore(); };
Tour.boss({ id: 'pst_parrot', name: 'The Interrupter', hp: 6, dims: [64, 96], music: 'tour_pst_boss', country: 'pst', brain });
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.pst_parrot = [60, 60, 80, 48];
Tour.pstKit.boss = { brain, PstStop, PstSpeaker, WORDS };
})();
