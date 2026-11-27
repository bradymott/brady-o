/* ============================================================
   FOLEY BEACH: the boss, MR. THUNDER (29-6), a pea in a biscuit tin who plays the storm in Piwi's seaside show and
   has never once been thanked for it. He cannot be stomped (it bounces off the lid). Every hit is a good take played
   back at him: he bows. On the stage: a microphone on its stand (THROW takes it; the stick steers it along the tin
   sheet, the rice tray, the windcloth and Mr. Thunder himself; THROW captures what it points at while that sounds;
   THROW again plays it back; JUMP lets go), and the three machines, each with its own visible noise.
   1 THE CLAP     his lid lifts (a full second, LID UP!) before a broadside clap: the tin sheet flaps with it (jagged
                  ripples). Capture the tin on the clap and play it back: a bow. The clap rolls a shock ring along the
                  floor half a second later: jump it.
   2 THE HAIL     his painted cloud wheels in over the rice tray (the tell), then a rattle of hail (a shadow under
                  every stone first); the tray pours dry rice under the cloud while it hails (dots). Capture the
                  rice, and play it back once the tray has EMPTIED, not before.
   3 THE GUST     his crank handle winds slowly (the tell), then a gust pushes Brady and flings a few shells at head
                  height (jump them); the windcloth whirs (long loops) and slowly unwinds. When everything has gone
                  quiet, the pea says a tiny "thank you": point the mic at him, capture it, play it back. The biggest
                  bow of his career.
   Six good takes. He takes his last bow, the lid comes down, and the rain stops.
   ============================================================ */
(function () {
const K = Tour.foleyKit; if (!K || !K.FoleyMic) return;
const INK = K.INK, FA = K.FArt, FX = K.FX;
const { APRI, TIN, TIN2, TIN3, IVORY, FELT, FELT2, FELT3, BRASS, WOOD, WOOD2 } = K;

/* ---------------- his drawing ---------------- */
// pose: idle | lid | clap | wheel | hail | wind | gust | quiet | thanks | bow | hurt; lid (0..1), crank angle
function drawThunder(ctx, x, y, s, o) {
  const t = o.t || 0, lid = o.lid || 0, bow = o.bow || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  // the stool he stands on
  ctx.fillStyle = WOOD; ctx.fillRect(-36, -14, 72, 8); ctx.strokeRect(-36, -14, 72, 8); ctx.fillStyle = WOOD2; ctx.fillRect(-30, -6, 6, 6); ctx.fillRect(24, -6, 6, 6);
  ctx.rotate(-bow * 0.25);
  // the tin: petrol blue with ivory scallops
  const ty = -14;
  ctx.fillStyle = TIN; ctx.fillRect(-40, ty - 44, 80, 44); ctx.strokeRect(-40, ty - 44, 80, 44);
  ctx.fillStyle = TIN2; ctx.beginPath(); ctx.ellipse(0, ty, 40, 9, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IVORY; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(k * 11, ty - 30, 5.5, 0, Math.PI); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = TIN3; ctx.fillRect(-34, ty - 40, 5, 34);
  // the crank handle on its side
  const ca = o.crank || 0;
  ctx.strokeStyle = FELT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, ty - 22); ctx.lineTo(50, ty - 22); ctx.stroke();
  ctx.save(); ctx.translate(50, ty - 22); ctx.rotate(ca); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.lineTo(9, -14); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  // the inside (dark felt) and the pea
  const ly = ty - 44;
  ctx.fillStyle = FELT2; ctx.beginPath(); ctx.ellipse(0, ly, 40, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  const py = ly - 6 - lid * 14 - (o.pose === 'thanks' ? 6 : 0);
  if (lid > 0.15 || o.pose === 'thanks' || o.pose === 'quiet' || o.pose === 'bow') {
    ctx.save(); ctx.beginPath(); ctx.rect(-40, ly - 60, 80, 60); ctx.clip();
    ctx.fillStyle = '#8ac84a'; ctx.beginPath(); ctx.arc(0, py, 13, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b0e070'; ctx.beginPath(); ctx.arc(-4, py - 4, 4, 0, TAU); ctx.fill();
    // a little moustache and bow tie (the pea is a showman)
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-4, py - 2, 1.6, 0, TAU); ctx.arc(4, py - 2, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.moveTo(0, py + 3); ctx.quadraticCurveTo(-7, py + 1, -9, py + 5); ctx.quadraticCurveTo(-4, py + 4, 0, py + 4); ctx.quadraticCurveTo(4, py + 4, 9, py + 5); ctx.quadraticCurveTo(7, py + 1, 0, py + 3); ctx.fill();
    ctx.fillStyle = FELT3; ctx.beginPath(); ctx.moveTo(0, py + 12); ctx.lineTo(-7, py + 8); ctx.lineTo(-7, py + 16); ctx.closePath(); ctx.moveTo(0, py + 12); ctx.lineTo(7, py + 8); ctx.lineTo(7, py + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (o.pose === 'thanks' || o.pose === 'bow') { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, py + 5, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.restore();
  }
  // the lid: hinged at the back, lifting
  ctx.save(); ctx.translate(-40, ly); ctx.rotate(-lid * 1.1);
  ctx.fillStyle = TIN3; ctx.beginPath(); ctx.ellipse(40, -2, 42, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IVORY; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.ellipse(40 + Math.cos(a) * 8, -4 + Math.sin(a) * 2, 6, 3, 0, 0, TAU); } ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ---------------- the arena's mic: its targets are the three machines and Mr. Thunder ---------------- */
class FoleyBossMic extends K.FoleyMic {
  constructor(g, s) { super(g, s); this.bossMode = true; }
  machines() { const b = this.g.boss && !this.g.boss.remove ? [this.g.boss] : []; return this.g.entities.filter(e => e instanceof K.FoleyMachine).concat(b).sort((a, c) => a.x - c.x); }
  fTouch(p) { const b = this.g.boss; return !!b && b.state === 'fight' && K.onMark(p, this.tx, this.fy, 0.9); }
  tap() {
    const g = this.g, M = this.machines(), m = M[this.sel], b = g.boss;
    if (!this.got) {
      if (!m || !m.sounding()) { K.say(g, this.cx, this.y - 80, m && m.boss ? 'TOO NOISY TO HEAR HIM: WAIT FOR QUIET' : 'NOT SOUNDING NOW: WAIT FOR IT', '#ffd8a0', 'mic'); TourKit.sfx('bonk', 'bump', { vol: 0.3 }); return; }
      this.got = m.boss ? 'pea' : m.kind; this.gotT = g.t; TourKit.sfx('rec', 'select', { vol: 0.5, pitch: 1.4 }); K.say(g, this.cx, this.y - 80, 'GOT IT! THROW TO PLAY IT BACK', '#9aff9a', 'mic'); return;
    }
    const kind = this.got; this.got = null; FX.noise(g, this.cx, this.y - 50, K.MACHINES[kind].noise); TourKit.sfx('play', 'select', { vol: 0.5, pitch: 0.9 });
    if (b) brain.playback(b, kind, this);
  }
}
{ const d0 = FoleyBossMic.prototype.draw; FoleyBossMic.prototype.draw = function (ctx) { const x = this.cx, y = this.fy * TS - 3.3 * TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a5a64'; ctx.fillRect(x - 46, y, 4, 3.3 * TS); ctx.fillRect(x + 42, y, 4, 3.3 * TS); ctx.fillStyle = TIN; ctx.beginPath(); ctx.moveTo(x - 56, y + 8); ctx.lineTo(x, y - 10); ctx.lineTo(x + 56, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = IVORY; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x + k * 20, y + 8, 6, 0, Math.PI); ctx.fill(); } ctx.restore(); d0.call(this, ctx); }; }
ENTITY_TYPES.foleyBossMic = FoleyBossMic;
// the arena's machines answer to Mr. Thunder (they sound when he makes them)
class FoleyBossMachine extends K.FoleyMachine {
  constructor(g, s) { super(g, s); this.on = false; }
  sounding() { return !!this.on; }
}
ENTITY_TYPES.foleyBossMachine = FoleyBossMachine;

/* ---------------- the brain ---------------- */
const lines = { bow: ['*BOW* THANK YOU, THANK YOU!', 'THEY LOVE ME!', '*BOW* ENCORE? ENCORE!', 'MY PUBLIC!'], stomp: 'NOT THE LID!' };
const shellArt = (c, s) => FA.shell(c, s.x + s.w / 2, s.y + s.h / 2 + 4, 9, APRI, true, -1);
const waveArt = (c, s) => { c.save(); c.strokeStyle = '#9ad0e0'; c.lineWidth = 4; c.beginPath(); for (let k = 0; k <= 8; k++) c.lineTo(s.x + k * s.w / 8, s.y + s.h - (k % 2 ? s.h : 4)); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.restore(); };
const hailArt = (c, s) => { c.save(); c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, TAU); c.fill(); c.stroke(); c.restore(); };
const brain = {
  phases: [4, 2],
  guardText: lines.stomp,
  mach(b, kind) { return b.g.entities.find(e => e instanceof FoleyBossMachine && e.kind === kind); },
  quiet(b) { for (const e of b.g.entities) if (e instanceof FoleyBossMachine) e.on = false; },
  wake(b) { b.phase = 1; b.baseY = b.y; b.lid = 0; b.crank = 0; b.cloud = 0; TourKit.sfx('thunder', 'thunder', { vol: 0.5 }); K.bossLine(b.g, 'A STORM! FOR ME! WITH NO THANK-YOU? UNTHINKABLE!', '#e8f0ff'); },
  phase(b, n) {
    this.quiet(b); b.cloud = 0;
    if (n === 2) { b.g.bannerText = 'THE HAIL!'; b.g.bannerT = 2; K.bossLine(b.g, 'HAIL! THE CROWD ADORES HAIL.', '#e8f0ff'); }
    if (n === 3) { b.g.bannerText = 'THE GUST!'; b.g.bannerT = 2; K.bossLine(b.g, 'AND NOW... MY GUST. HUSH, EVERYONE.', '#e8f0ff'); }
    b.go('recover');
  },
  hurt(b) { K.bossLine(b.g, pick(lines.bow), '#ffd84a'); b.bowT = 1.4; this.quiet(b); b.go('recover'); },
  // a take played back at him from the mic
  playback(b, kind, mic) {
    const g = b.g, ph = b.phase || 1;
    if (b.hurtT > 0 || b.state !== 'fight') return;
    const fail = txt => K.say(g, mic.cx, mic.y - 80, txt, '#ff9a9a', 'mic');
    if (ph === 1) { if (kind === 'tin') { b.damage(1); return; } return fail('THAT\'S NOT HIS CLAP: THE TIN SHEET IS'); }
    if (ph === 2) {
      if (kind !== 'rice') return fail('THAT\'S NOT HIS HAIL: THE RICE TRAY IS');
      if (b.act !== 'empty') return fail('NOT YET: PLAY IT WHEN THE TRAY IS EMPTY');
      b.damage(1); return;
    }
    if (kind === 'pea') { b.damage(1); return; }
    fail(kind === 'wind' ? 'THAT\'S HIS GUST. HE WANTS TO HEAR HIMSELF SAY THANK YOU' : 'NOT THAT: HIS OWN TINY "THANK YOU"');
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce'; b.vx = 0; b.dir = -1;
    b.y = approach(b.y, b.baseY - 1.2 * TS, 3 * TS * dt);
    if (b.bowT > 0) b.bowT -= dt;
    b.lid = approach(b.lid || 0, (b.act === 'lid' || b.act === 'clap' || b.act === 'quiet' || b.act === 'thanks') ? 1 : 0, dt * 3);
    b.pose = b.act;
    if (b.act === 'walk' || b.act === 'recover') { if (b.at > (b.act === 'recover' ? 1.8 : 1.0)) b.go(ph === 1 ? 'lid' : ph === 2 ? 'wheel' : 'wind'); return; }
    // ---- 1: the clap ----
    if (b.act === 'lid') { if (b.first) { K.bossLine(g, 'LID UP! HERE COMES MY CLAP...', '#e8f0ff'); TourKit.sfx('creak', 'select', { vol: 0.4, pitch: 0.6 }); } if (b.at > 1.0) { b.go('clap'); const m = this.mach(b, 'tin'); if (m) m.on = true; FX.noise(g, b.cx, b.y + 10, 'jag', { scale: 1.6 }); TourKit.sfx('clap', 'thunder', { vol: 0.6 }); g.shake(4); } }
    else if (b.act === 'clap') {
      if (Math.floor(b.at * 4) !== Math.floor((b.at - dt) * 4)) FX.noise(g, b.cx, b.y + 10, 'jag', { quiet: true, scale: 1.3 });
      if (b.at > 0.5 && !b.waved) { b.waved = true; tourFire(g, b.cx - 50, b.floorY - 22, { vx: -5 * TS, w: 36, h: 20, life: 6, ground: true, col: '#9ad0e0', art: waveArt }); }
      if (b.at > 1.1) { const m = this.mach(b, 'tin'); if (m) m.on = false; b.waved = false; b.go('wait'); }
    } else if (b.act === 'wait') { if (b.at > 3.0) b.go('walk'); }
    // ---- 2: the hail ----
    else if (b.act === 'wheel') { if (b.first) K.bossLine(g, 'MY CLOUD! WHEEL IT IN!', '#e8f0ff'); b.cloud = Math.min(1, b.at / 1.2); if (b.at > 1.3) { b.go('hail'); b.hailN = 0; const m = this.mach(b, 'rice'); if (m) { m.on = true; m.empty = false; } } }
    else if (b.act === 'hail') {
      b.cloud = 1;
      // a stone every 0.45 s: its shadow first (0.6 s), then it falls, never twice on the same spot in a row
      b.hailList = b.hailList || [];
      // (none on the mic's little tin awning: hail rattles off it)
      const mic = b.g.entities.find(e => e instanceof FoleyBossMic);
      if (b.at > b.hailN * 0.45 && b.at < 3.0) { b.hailN++; const xs = [p ? p.cx : b.cx, b.arenaX0 + (2 + (b.hailN * 7) % 18) * TS]; let x = xs[b.hailN % 2] + (b.hailN % 3 - 1) * 20; if (mic && Math.abs(x - mic.cx) < 1.8 * TS) { FX.noise(g, mic.cx, mic.fy * TS - 3.2 * TS, 'clack', { quiet: true, scale: 0.5 }); x = -1; } if (x > 0) b.hailList.push({ x, t: 0 }); }
      for (const h of b.hailList) { h.t += dt; if (h.t > 0.6 && !h.fell) { h.fell = true; tourFire(g, h.x - 8, b.floorY - 9 * TS, { vy: 14 * TS, w: 16, h: 16, life: 1.2, thru: true, col: '#ffffff', art: hailArt }); } }
      b.hailList = b.hailList.filter(h => h.t < 1.6);
      if (b.at > 3.4) { const m = this.mach(b, 'rice'); if (m) { m.on = false; m.empty = true; } K.bossLine(g, 'THE TRAY\'S EMPTY! WHAT A SHOWER!', '#e8f0ff'); b.go('empty'); }
    } else if (b.act === 'empty') { b.cloud = Math.max(0, 1 - b.at / 2.6); if (b.at > 2.8) { const m = this.mach(b, 'rice'); if (m) m.empty = false; b.go('walk'); } }
    // ---- 3: the gust ----
    else if (b.act === 'wind') { b.crank = (b.crank || 0) + dt * 2.2; if (b.first) K.bossLine(g, 'WIND THE HANDLE... SLOWLY...', '#e8f0ff'); if (b.at > 1.4) { b.go('gust'); const m = this.mach(b, 'wind'); if (m) m.on = true; TourKit.sfx('gust', 'wind', { vol: 0.6 }); } }
    else if (b.act === 'gust') {
      b.crank += dt * 9; if (p && !p.dead) p.pushX = (p.pushX || 0) - 2.6 * TS;
      if (Math.floor(b.at * 3) !== Math.floor((b.at - dt) * 3)) FX.noise(g, b.cx - 40, b.y + 30, 'loops', { dir: -1, quiet: true });
      if ((b.at > 0.5 && !b.s1) || (b.at > 1.4 && !b.s2)) { if (b.at > 1.4) b.s2 = true; else b.s1 = true; tourFire(g, b.cx - 50, b.floorY - 40, { vx: -6 * TS, w: 18, h: 16, life: 4, thru: true, col: APRI, art: shellArt }); }
      if (b.at > 2.2) { b.s1 = b.s2 = false; b.go('unwind'); }
    } else if (b.act === 'unwind') { b.crank += dt * 9 * Math.max(0, 1 - b.at / 1.4); if (b.at > 1.0) { const m = this.mach(b, 'wind'); if (m) m.on = false; } if (b.at > 1.4) { b.go('quiet'); } }
    else if (b.act === 'quiet') { if (b.at > 0.5 && !b.said) { b.said = true; K.bossLine(g, '(...thank you...)', '#c8ffb0'); } if (b.at > 2.6) { b.said = false; b.go('walk'); } }
    else b.go('walk');
  },
  lastHit(b) { this.quiet(b); K.bossLine(b.g, '*THE BIGGEST BOW OF MY CAREER*', '#ffd84a'); return false; },
  draw(b, ctx, t) {
    const pose = b.state === 'dying' || b.bowT > 0 ? 'bow' : b.act === 'quiet' ? 'thanks' : b.pose || 'idle';
    const bow = b.state === 'dying' ? 1 : b.bowT > 0 ? Math.sin(Math.min(1, (1.4 - b.bowT) / 0.4) * Math.PI / 2) : 0;
    drawThunder(ctx, b.cx, b.y + b.h, 1, { t, lid: b.lid || 0, crank: b.crank || 0, pose, bow });
  }
};
// the boss is one of the mic's targets: he "sounds" only when the stage is quiet and he says his tiny thank you
const boss = { id: 'foley_thunder', name: 'Mr. Thunder', hp: 6, dims: [80, 70], floats: true, music: 'tour_foley_boss', country: 'foley', brain };
Tour.boss(boss);
{
  // Boss.prototype is the engine's boss class: give the thunder its mic-target face
  const BC = ENTITY_TYPES.boss;
  if (BC && !BC.prototype.sounding) BC.prototype.sounding = function () { return this.style === 'foley_thunder' && this.act === 'quiet' && this.at > 0.5 && this.state === 'fight'; };
}
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.foley_thunder = [70, 70, 60, 10];
// the big cues over the scene: his tells (LID UP! / the cloud on its rail over the tray / the handle winding), the
// hail's shadows, the tray's EMPTY!, the thank-you's ring
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.remove || b.style !== 'foley_thunder' || b.state !== 'fight') return;
  const t = play.t, rice = brain.mach(b, 'rice');
  // the painted cloud on its rail, wheeling in over the rice tray
  if (b.cloud > 0 && rice) {
    const cx = rice.cx + (1 - b.cloud) * 8 * TS, cy = b.floorY - 7.5 * TS;
    ctx.save(); ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rice.cx - 3 * TS, cy - 30); ctx.lineTo(rice.cx + 9 * TS, cy - 30); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 16); ctx.stroke();
    ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.ellipse(cx, cy, 48, 18, 0, 0, TAU); ctx.ellipse(cx - 22, cy - 10, 20, 14, 0, 0, TAU); ctx.ellipse(cx + 20, cy - 12, 24, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a5a74'; ctx.fillRect(cx - 40, cy + 10, 80, 4); ctx.restore();
  }
  // the hail's shadows on the floor
  for (const h of b.hailList || []) if (!h.fell) { const k = h.t / 0.6; ctx.save(); ctx.fillStyle = `rgba(20,10,30,${0.25 + 0.4 * k})`; ctx.beginPath(); ctx.ellipse(h.x, b.floorY - 2, 10 + 8 * k, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  // the tray, emptied: the moment to play the rice back
  if (b.act === 'empty' && rice) K.nowCue(ctx, rice.cx, rice.y - 30, t, 'EMPTY! PLAY IT BACK', '#ffd84a');
  if (b.act === 'lid') K.nowCue(ctx, b.cx, b.y - 40, t, 'LID UP!', '#e8f0ff');
  if (b.act === 'clap') K.nowCue(ctx, b.cx - 60, b.y - 40, t, 'CLAP!', '#9ad0e0');
  if (b.act === 'wind') K.nowCue(ctx, b.cx, b.y - 40, t, 'WINDING...', '#e8f0ff');
  if (b.act === 'quiet' && b.at > 0.5) { FA.ring(ctx, b.cx, b.y + 10, 30 + Math.sin(t * 8) * 4, 0.9, '#c8ffb0', 3); K.nowCue(ctx, b.cx, b.y - 40, t, 'thank you', '#c8ffb0'); }
});

// the arena: the mic on its little dais near the left, the tin sheet, the rice tray and the windcloth along the stage
Tour.pieces['foley.arena_tin'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.spawn('foleyBossMic', x0 + 6, GY - 1, { lock: 'foley:boss', want: null });
  B.spawn('foleyBossMachine', x0 + 2, GY - 1, { kind: 'tin' });
  B.spawn('foleyBossMachine', x0 + 10, GY - 1, { kind: 'rice' });
  B.spawn('foleyBossMachine', x0 + 14, GY - 1, { kind: 'wind' });
  B.decorAt('foleyLamp', x0 + 1, GY, 1); B.decorAt('foleyLamp', x0 + w - 1, GY, 2);
};
Object.assign(K, { thunderBrain: brain, drawThunder, FoleyBossMic, FoleyBossMachine });
})();
