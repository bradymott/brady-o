/* ============================================================
   ITALY 14-5: IL POLPETTONE, the giant operatic meatball tenor: the act nobody cancelled. He has been warming up on
   the opera house's grand stage for weeks and he is in a mood.
   The fight: he is far too saucy to stomp (a stomp just bounces off: TOO SAUCY!). He ROLLS: a tell first (he rocks
   back, tucks in and spins on the spot with a HUP!, 0.75 s), then he bowls across the stage and crashes into the far
   wall, dizzy: that is the moment to stomp him. In between he SINGS: a deep breath (his chest swells, 0.8 s), then
   rings of song roll along the floor both ways (jump them). Phase 2 (after two hits): PARMIGIANO! cheese graters
   drop in from the flies over a shadow, then shower the floor (0.8 s tell). Phase 3 (after four): he spits little
   meatballs and rolls twice in a row, faster. Six stomps; at the end he takes a bow, and the curtain comes down.
   ============================================================ */
(function () {
const C = Tour.countries.it;
if (!C) return;
const K = TourKit, IK = Tour.itKit, INK = IK.INK, ItArt = IK.ItArt;
const TEN = { rollV: 7.2, rollV3: 8.6, roll: 0.75, breathe: 0.8, dazed: 2.3, dazed3: 1.8, waveV: 4.4 };
const says = ['FIGARO! ...WHO?', 'BRAVO! BRAVO ME!', 'ENCORE!', 'LA LA LAAAA!', 'MAMMA MIA!'];
// a ring of song rolling along the floor
const ringArt = (ctx, s, t) => { ctx.save(); const x = s.x + s.w / 2, y = s.y + s.h; ctx.strokeStyle = 'rgba(255,230,150,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 13, 9, 13, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); ItArt.note(ctx, x - 1, y - 8 + Math.sin(t * 12) * 2, 0.8, '#1a1426'); ctx.restore(); };

// a cheese grater lowered from the flies: a shadow on the floor first, then a shower of parmesan
class ItGrater extends Ent {
  constructor(g, s) { super(g, s, 44, 30); this.x = s.x - 22; this.floorY = s.floorY; this.y = g.camY - 40; this.st = 0; this.state = 'drop'; this.friendly = true; this.always = true; }
  update(dt) {
    this.t += dt; this.st += dt; const p = this.g.player;
    const ty = this.floorY - 6.2 * TS;
    if (this.state === 'drop') { this.y = approach(this.y, ty, 10 * TS * dt); if (this.st > 0.85) { this.state = 'grate'; this.st = 0; K.sfx('grate', 'crumble', { vol: 0.5, pitch: 1.6 }); } }
    else if (this.state === 'grate') {
      if (Math.random() < 0.8) this.g.burst(this.cx + (Math.random() - 0.5) * 30, this.y + this.h, 1, '#fff6c8', 'confetti');
      const box = { x: this.x + 4, y: this.y + this.h, w: this.w - 8, h: this.floorY - (this.y + this.h) };
      if (p && !p.dead && overlap(box, p)) p.hurt(this);
      if (this.st > 0.75) { this.state = 'up'; this.st = 0; }
    } else { this.y -= 10 * TS * dt; if (this.st > 1) this.remove = true; }
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t;
    ctx.save();
    // the shadow on the floor (the tell)
    const k = this.state === 'drop' ? Math.min(1, this.st / 0.85) : 1;
    ctx.fillStyle = `rgba(20,10,10,${0.2 + 0.25 * k})`; ctx.beginPath(); ctx.ellipse(this.cx, this.floorY - 2, 18 + 10 * k, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8861a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.cx, this.g.camY - 10); ctx.lineTo(this.cx, y); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(x + 6, y + h); ctx.lineTo(x + 12, y); ctx.lineTo(x + w - 12, y); ctx.lineTo(x + w - 6, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a606a'; for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) ctx.fillRect(x + 13 + q * 5 + r, y + 6 + r * 7, 2.5, 2);
    ctx.fillStyle = '#2a2a34'; rr(ctx, x + w / 2 - 6, y - 8, 12, 9, 3); ctx.fill(); ctx.stroke();
    if (this.state === 'grate') { ctx.fillStyle = 'rgba(255,246,200,0.85)'; for (let k2 = 0; k2 < 14; k2++) { const ph = (t * 3 + k2 / 14) % 1; ctx.fillRect(x + 8 + (k2 * 7) % (w - 16), y + h + ph * (this.floorY - y - h), 3, 2); } }
    ctx.restore();
  }
}
ENTITY_TYPES.itGrater = ItGrater;

const tenorBrain = {
  phases: [4, 2],
  guardText: 'TOO SAUCY!',
  wake(b) { b.phase = 1; b.dir = -1; K.say(b.g, b, 'AT LAST, AN AUDIENCE!', '#ffffff'); },
  hit(b, kind) {
    if (kind === 'stomp' || kind === 'spin') {
      if (b.vuln) { b.damage(1, { text: 'SPLAT!', col: '#ffb0a0' }); return true; }
      // the bounce word at most once every 1.1 s (repeated bounces never stack it into a pile)
      const now = b.t; this.guardText = now - (b.saucyT == null ? -9 : b.saucyT) > 1.1 ? (b.saucyT = now, 'TOO SAUCY!') : ' ';
      return 'bounce';
    }
    if (kind === 'star' && b.vuln) { b.damage(1); return true; }
    return undefined;
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'ACT TWO: PARMIGIANO!'; g.bannerT = 2.2; K.say(g, b, 'MORE CHEESE!', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE GRAND FINALE!'; g.bannerT = 2.2; K.say(g, b, 'MY MEATBALL CHORUS!', '#ffffff'); }
    b.go('recover');
  },
  hurt(b) { K.say(b.g, b, pick(['MY SAUCE!', 'OOF! AL DENTE!', 'NOT THE BASIL!']), '#ffffff'); b.go('recover'); },
  // a soft landing for Brady: the dizzy meatball (vuln) is harmless to touch; so is his bow
  touch(b, p) { if (b.act === 'bow') return true; return false; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce';
    if (b.act === 'walk') {
      // a slow, pompous waddle toward Brady, arms wide
      b.pose = 'walk'; b.face(); b.vx = b.dir * 1.3 * TS;
      if (b.at > (ph >= 3 ? 0.9 : 1.3)) {
        b.cycle++;
        const seq = ph >= 3 ? ['roll', 'spit', 'roll', 'sing', 'roll'] : ph >= 2 ? ['sing', 'roll', 'cheese', 'roll'] : ['sing', 'roll', 'roll', 'sing', 'roll'];
        b.go(seq[b.cycle % seq.length]);
      }
    } else if (b.act === 'sing') {
      b.vx = 0; b.face();
      if (b.first) { b.waves = 0; K.say(g, b, pick(says), '#fff2c8'); }
      b.pose = b.at < TEN.breathe ? 'breathe' : 'sing';
      const n = ph >= 2 ? 3 : 2;
      if (b.at > TEN.breathe + b.waves * 0.55 && b.waves < n) {
        b.waves++; K.sfx('tenor', 'gold', { vol: 0.45, pitch: 0.55 + b.waves * 0.1 }); g.shake(2);
        for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 2, { vx: d * TEN.waveV * TS, vy: 0, w: 22, h: 28, ground: true, life: 3.4, thru: true, art: ringArt, col: '#ffe8a0' });
      }
      if (b.at > TEN.breathe + n * 0.55 + 0.5) b.go('walk');
    } else if (b.act === 'roll') {
      if (b.first) { b.face(); b.stage = 0; K.say(g, b, 'HUP!', '#ffe28a'); K.sfx('hup', 'jump', { vol: 0.5, pitch: 0.5 }); b.encore = ph >= 3; }
      if (b.stage === 0) {
        // the tell: rocking back and spinning on the spot
        b.pose = 'tuck'; b.vx = 0;
        if (b.at > TEN.roll) { b.stage = 1; b.st = 0; g.shake(3); }
      } else {
        b.pose = 'roll'; b.st += dt;
        b.vx = b.dir * (ph >= 3 ? TEN.rollV3 : TEN.rollV) * TS;
        if ((b.dir < 0 && b.x <= b.arenaX0 + 2) || (b.dir > 0 && b.x >= b.arenaX1 - b.w - 2) || b.hitWall) {
          g.shake(8); Sound.play('stomp', { pitch: 0.5 }); g.burst(b.dir < 0 ? b.x : b.x + b.w, b.cy, 14, '#d82a1a', 'confetti');
          // phase 3: he bounces off and rolls back once before he gets dizzy
          if (b.encore) { b.encore = false; b.dir = -b.dir; b.stage = 0; b.at = TEN.roll * 0.4; b.st = 0; K.say(g, b, 'ENCORE!', '#ffe28a'); }
          else b.go('dazed');
        }
        if (b.st > 6) b.go('walk');
      }
    } else if (b.act === 'dazed') {
      b.pose = 'dazed'; b.vx = 0; b.vuln = true; b.guard = 'hurt';
      if (b.first) K.say(g, b, pick(['WHICH WAY IS THE AUDIENCE?', 'I SEE STARS... AND GARLIC', 'SO... DIZZY...']), '#ffe28a');
      if (b.at > (ph >= 3 ? TEN.dazed3 : TEN.dazed)) b.go('walk');
    } else if (b.act === 'cheese') {
      b.vx = 0; b.pose = 'sing';
      if (b.first) {
        K.say(g, b, 'PARMIGIANO!', '#fff2c8');
        const xs = [p ? p.cx : b.cx, b.arenaX0 + 3 * TS + Math.random() * (b.arenaX1 - b.arenaX0 - 6 * TS), b.arenaX0 + 3 * TS + Math.random() * (b.arenaX1 - b.arenaX0 - 6 * TS)];
        xs.forEach((x, k) => IK.setTimeout0(g, k * 0.35, () => { if (b.state === 'fight') g.spawn(new ItGrater(g, { x: clamp(x, b.arenaX0 + TS, b.arenaX1 - TS), y: 0, floorY: b.floorY })); }));
      }
      if (b.at > 2.0) b.go('walk');
    } else if (b.act === 'spit') {
      // phase 3: two little meatballs out of his mouth (they roll, like their cousins in the alleys)
      b.vx = 0; b.pose = 'sing'; b.face();
      if (b.first) { K.say(g, b, 'MY CHORUS!', '#ffffff'); b.spat = 0; }
      if (b.at > 0.5 + b.spat * 0.45 && b.spat < 2) {
        b.spat++; const M = ENTITY_TYPES.itMeatball;
        if (M && g.entities.filter(e => e.itChorus && !e.dead && !e.remove).length < 3) { const e = new M(g, { x: b.cx + b.dir * (b.w / 2 + 10), y: b.floorY, dir: b.dir }); e.itChorus = true; e.vy = -6 * TS; g.spawn(e); }
        Sound.play('throw', { pitch: 0.6 });
      }
      if (b.at > 1.6) b.go('walk');
    } else if (b.act === 'recover') {
      b.vx = 0; b.pose = 'recover';
      if (b.at > 1.1) b.go('walk');
    } else b.go('walk');
    b.fall(dt);
  },
  // his bow at the end (the boss framework fades him out)
  lastHit(b) { b.go('bow'); b.vuln = false; return true; },
  draw(b, ctx, t) {
    const P = b.pose, x = b.cx, y = b.y + b.h, r = b.w / 2, d = b.dir;
    ctx.save(); ctx.translate(x, y - r); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
    const rolling = P === 'roll', tuck = P === 'tuck';
    const sw = P === 'breathe' ? 1 + Math.min(1, b.at / TEN.breathe) * 0.1 : 1;
    if (rolling) ctx.rotate(b.x / r);
    else if (tuck) ctx.rotate(Math.sin(t * 30) * 0.25 - d * 0.2);
    else if (P === 'dazed') ctx.rotate(Math.sin(t * 3) * 0.12);
    ctx.scale(sw, sw);
    // breadstick arms (behind), flung wide when he sings
    if (!rolling && !tuck) {
      ctx.save(); ctx.strokeStyle = '#e8b878'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      const up = P === 'sing' ? -0.9 : P === 'walk' ? Math.sin(t * 6) * 0.3 - 0.2 : 0.3;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.8, 4); ctx.lineTo(s * (r + 26), 4 + up * 30); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.8, 0); ctx.lineTo(s * (r + 26), up * 30); ctx.stroke(); }
      ctx.restore();
    }
    // the meatball: lumpy brown sphere
    ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, rr2 = r + Math.sin(k * 2.3) * 2.5; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a3418'; for (const [dx, dy, s] of [[-18, 20, 4], [14, 24, 3.5], [24, -4, 3], [-26, -6, 3.5], [4, 32, 3], [-6, -30, 2.5]]) { ctx.beginPath(); ctx.arc(dx, dy, s, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,200,160,0.25)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.35, r * 0.2, -0.5, 0, TAU); ctx.fill();
    if (!rolling) {
      // the sauce like a swept-back mane, a basil leaf
      ctx.fillStyle = '#d82a1a'; ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.35); ctx.quadraticCurveTo(-r * 0.3, -r * 1.35, r * 0.85, -r * 0.5); ctx.quadraticCurveTo(r * 0.6, -r * 0.25, r * 0.45, -r * 0.45); ctx.quadraticCurveTo(r * 0.3, -r * 0.1, r * 0.1, -r * 0.4); ctx.quadraticCurveTo(-r * 0.2, -r * 0.05, -r * 0.45, -r * 0.3); ctx.quadraticCurveTo(-r * 0.7, -r * 0.1, -r * 0.9, -r * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4aa84a'; ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 1.0, 9, 4.5, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
      // the face (toward his facing)
      const fx = d * r * 0.18;
      const dizzy = P === 'dazed', shut = P === 'breathe' || P === 'recover' || P === 'bow';
      if (dizzy) { ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx + s * 12 - 5, -10); ctx.lineTo(fx + s * 12 + 5, -2); ctx.moveTo(fx + s * 12 + 5, -10); ctx.lineTo(fx + s * 12 - 5, -2); ctx.stroke(); } }
      else if (shut) { ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(fx + s * 12, -6, 5, 0.2, Math.PI - 0.2); ctx.stroke(); } }
      else { for (const s of [-1, 1]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(fx + s * 12, -6, 7, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(fx + s * 12 + d * 2.5, -4, 3.2, 0, TAU); ctx.fill(); } }
      // the bushy eyebrows, raised high when he sings
      ctx.fillStyle = '#3a1a0a'; const bro = P === 'sing' ? -6 : P === 'tuck' ? 3 : 0;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + s * 12, -19 + bro, 9, 3.5, s * (P === 'tuck' ? 0.4 : -0.2), 0, TAU); ctx.fill(); }
      // the mouth: a great round O when singing, a smug smile otherwise
      if (P === 'sing') { ctx.fillStyle = '#4a0a10'; ctx.beginPath(); ctx.ellipse(fx, 16, 11, 14, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8606a'; ctx.beginPath(); ctx.ellipse(fx, 24, 7, 4, 0, 0, TAU); ctx.fill(); }
      else if (P === 'breathe') { ctx.fillStyle = '#4a0a10'; ctx.beginPath(); ctx.ellipse(fx, 14, 5, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(fx, 8, 11, 0.25, Math.PI - 0.25); ctx.stroke(); }
      // the bow tie
      ctx.lineWidth = 2; ctx.fillStyle = '#1a1426'; ctx.beginPath(); ctx.moveTo(fx, r * 0.68); ctx.lineTo(fx - 14, r * 0.58); ctx.lineTo(fx - 14, r * 0.86); ctx.closePath(); ctx.moveTo(fx, r * 0.68); ctx.lineTo(fx + 14, r * 0.58); ctx.lineTo(fx + 14, r * 0.86); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(fx, r * 0.72, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    } else {
      // rolling: sauce smears round and round
      ctx.strokeStyle = '#d82a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0.4, 2.2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 3.4, 5.0); ctx.stroke();
    }
    ctx.restore();
    if (P === 'dazed') K.dizzy(ctx, b.cx, b.y - 14, t);
    if (P === 'breathe') { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; ctx.globalAlpha = ph; ctx.beginPath(); ctx.arc(b.cx + d * (60 - ph * 40), b.y + 20 + k * 8, 3, 0, TAU); ctx.fill(); } ctx.restore(); }
  }
};
tenorBrain.update0 = tenorBrain.update;
// the bow: the last stomp; he sweeps a bow to the stalls, then the framework fades him out
tenorBrain.update = function (b, dt) {
  if (b.act === 'bow') { b.vx = 0; b.pose = 'bow'; if (b.first) { K.say(b.g, b, 'GRAZIE! GRAZIE! ...I WILL GO HOME NOW', '#ffffff'); for (let k = 0; k < 14; k++) b.g.burst(b.cx, b.y, 2, ['#e8304a', '#ffd24a', '#ffffff'][k % 3], 'confetti'); } if (b.at > 1.4) b.die(); b.fall(dt); return; }
  return tenorBrain.update0(b, dt);
};
Tour.boss({ id: 'it_tenor', name: 'Il Polpettone', hp: 6, dims: [88, 88], floats: false, music: 'tour_it_boss', country: 'it', brain: tenorBrain });
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.it_tenor = [40, 40, 34, 4];

// the grand stage arena: two podiums (music stands draped in velvet) to dodge his rolls on, a prompter's box in the
// middle, footlights along the front
Tour.pieces['it.arena_stage'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 3; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 6 + q, GY - 4, T.SEMI); }
  for (let q = 0; q < 4; q++) B.set(x0 + Math.floor(w / 2) - 2 + q, GY - 7, T.SEMI);
  for (let x = x0 + 2; x < x0 + w - 1; x += 4) B.decorAt('itFootlight', x, GY, x);
  B.decorAt('itRoses', x0 + 6, GY, 1); B.decorAt('itRoses', x0 + w - 7, GY, 2);
};
Tour.itBoss = { TEN, tenorBrain, ItGrater };
})();
