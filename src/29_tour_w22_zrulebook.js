/* ============================================================
   Piwi's House Rule 1: NO FUN, and World 22's bonus level 22-6 THE RULEBOOK
   (docs/design/SECRETS_WARPS_SWITCHES.md §4.3 row B6, §4.4, §4.5). Loads after 29_tour_w22_levels.js.
   - The Brady Button: 22-5 The Writer's Desk, in the Wings: the margin of the page, left of the start (the tell: the
     page's edge curls at the very left of the desk, a red margin line runs off-screen and a wind-up mouse runs that
     way). Until rules 3, 7, 9, 10 and 12 are all revoked it sits under a glass cloche with a sticky note "NOT YET.
     — PIWI" and can't be slapped (the spawn carries needs, so the validator asks for it only with the rules on).
     22-5 is taken as registered and given things that take up no tiles at its start (the strip gen is wrapped for
     that one area) and one extra area: nothing on the desk moves.
   - What it changes: Piwi's Showtrunk is a party blimp on every map (and one drifts over every land's map), the
     Postcard Lighthouse's beam turns rainbow, and the ending gains a short party scene (Piwi sulks, then dances).
     All three follow Settings -> HATS & DANCING.
   - What it opens: 22-6 THE RULEBOOK (arch 'bonus', secret, hidden on World 22's map until the rule is revoked, then
     a gold trail grows from 22-5 to it, as 1-7 does): inside Piwi's House Rules itself. Page-turn platforms (a page's
     corner curls up before it turns; the spine never moves), rubber-stamp crushers (they glow red and shake before
     they slam; they hurt, they never crush), footnotes to climb, the Small Print (a PICK ONE room behind a page), and
     the Rulebook itself as a mini-boss: a flapping book with stamp arms (3 hp). When it slams down it falls open:
     stomp it and tear out a page of rules. Three postcards; the main exit goes back to the map.
   - The pause menu's HOUSE RULES page lists all six rules: revoked ones say where their button was and what they
     opened; unfound ones are masked (and name their land once the Postcard Lighthouse is lit); Rule 1 under its glass
     says how many of the other five are revoked.
   Boss test: tools/boss_tests/w22_rulebook.js. Where everything is, for Brady: docs/design/BACKSTAGE_STATUS.md.
   ============================================================ */
(() => {
const C = Tour.countries.w22;
if (!C || typeof TOUR_RULES === 'undefined' || typeof TourRules === 'undefined' || typeof TourBackstage === 'undefined') return;
const K = TourKit, INK = '#1a1022';
const PRE = ['rule:3', 'rule:7', 'rule:9', 'rule:10', 'rule:12'];
TOUR_RULES[1] = { title: 'NO FUN', sign: 'FUN IS ALLOWED AGAIN. EVERYWHERE. FOREVER!', opens: ['22-6'], fx: 'party' };
const F5 = '5px ' + FONT_DISPLAY, F6 = '6px ' + FONT_DISPLAY, F7 = '7px ' + FONT_DISPLAY, F8 = '8px ' + FONT_DISPLAY, F9 = '9px ' + FONT_DISPLAY,
  F10 = '10px ' + FONT_DISPLAY, F11 = '11px ' + FONT_DISPLAY, F12 = '12px ' + FONT_DISPLAY, HAND = 'italic 9px ' + FONT_UI, HAND7 = 'italic 7px ' + FONT_UI;
const PAPER = '#f6eedc', PAPER2 = '#ebdfc4', LINE = '#9ab0d8', LEATHER = '#5a2a6a', LEATHER2 = '#3e1a4c', GOLD = '#e8b84a', RED = '#d0203a';
const party = () => TourRules.fxOn('party');

/* ================= the Brady Button under its glass ================= */
// A button spawn with needs (rule 1's) stands under a glass cloche until they are met: slapping it, or jumping on it,
// only goes "tink"; a sticky note on the glass says NOT YET. The first look at it is remembered (Save.data.tour.cloche)
// for the HOUSE RULES page. Every other button is unchanged.
{
  const Base = ENTITY_TYPES.button;
  class TourButtonGlass extends Base {
    constructor(g, s) { super(g, s); this.glass = !!s.needs; this.lift = this.glass && this.pressed ? 1 : 0; this.tink = 0; this.seen = false; }
    get covered() { return this.glass && !this.pressed && !TourNeeds.ok(this.s.needs); }
    update(dt) {
      if (!this.covered) { if (this.glass) this.lift = approach(this.lift, 1, dt * 1.2); return super.update(dt); }
      this.t += dt; if (this.tink > 0) this.tink -= dt;
      const p = this.g.player; if (!p || p.dead || p.state !== 'play' || this.g.state !== 'play') return;
      if (!this.seen && Math.abs(p.cx - this.cx) < 5 * TS && Math.abs(p.cy - this.cy) < 3 * TS) {
        this.seen = true; const T = TourProgress.data(); if (!T.cloche) { T.cloche = this.g.id || true; Save.save(); }
      }
      const on = p.onGround && Math.abs(p.y + p.h - this.y) < 4 && p.x + p.w > this.x + 4 && p.x < this.x + this.w - 4;
      const beside = p.y + p.h > this.y + 10 && p.y < this.y + this.h && Math.abs(p.cx - this.cx) < this.w / 2 + p.w / 2 + 10;
      if (((beside && (Input.actionPressed || Input.upPressed)) || (on && !this.wasOn)) && this.tink <= 0) {
        this.tink = 1.2; p.throwT = 0.2;
        this.g.parts.text(this.cx, this.y - 34, 'TINK!', '#e8f4ff'); Sound.play('bump', { vol: 0.4, pitch: 1.8 });
        this.g.toast('NOT YET. — PIWI  (' + TourRulesUI.preDone() + ' OF 5 OTHER RULES REVOKED)');
      }
      this.wasOn = on;
    }
    draw(ctx) {
      super.draw(ctx);
      if (!this.glass || this.lift >= 1) return;
      const x = this.cx, by = this.y + this.h, k = this.lift, lift = k * 90, a = 1 - k;
      ctx.save(); ctx.globalAlpha = a;
      // the glass bell jar: a tall dome, a knob, two highlights; a little wobble after a tink
      const wob = this.tink > 0 ? Math.sin(this.tink * 40) * 0.03 * this.tink : 0;
      ctx.translate(x, by - lift); ctx.rotate(wob);
      ctx.fillStyle = 'rgba(210,235,255,0.22)'; ctx.strokeStyle = 'rgba(240,250,255,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-27, 0); ctx.lineTo(-27, -44); ctx.bezierCurveTo(-27, -70, 27, -70, 27, -44); ctx.lineTo(27, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-16, -40, 3, 14, 0.15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(18, -46, 3, 30);
      ctx.fillStyle = '#c8dcf0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -64, 5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-30, -2, 60, 4);
      if (this.covered || k < 0.3) {
        // the sticky note on the glass, in Piwi's handwriting
        ctx.save(); ctx.translate(10, -30); ctx.rotate(0.12);
        ctx.fillStyle = '#ffe84a'; ctx.fillRect(-15, -13, 30, 26); ctx.fillStyle = '#e8c83a'; ctx.fillRect(-15, -13, 30, 4);
        ctx.fillStyle = '#3a1a4a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = HAND; ctx.fillText('NOT YET.', 0, -2, 28); ctx.font = HAND7; ctx.fillText('— PIWI', 2, 7, 26);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  ENTITY_TYPES.button = TourButtonGlass;
}

/* ================= 22-5: the margin of the page (the Wings) ================= */
{
  const s0 = TourGens.strip;
  TourGens.strip = (ctx, A) => {
    const r = s0(ctx, A);
    if (!A.r1Margin) return r;
    const B = r.B, st = r.anchors.start || r.anchors.in; if (!st) return r;
    const gy = Math.round(st.y / TS);
    for (let y = gy - 3; y < gy; y++) B.set(0, y, T.EMPTY);
    B.decorAt('r1MarginEdge', 0, gy, 0);
    B.spawn('bkMouse', 3, gy - 1, { dir: -1, prop: 2 });
    TourSeams.add(B, { side: 'left', a: gy - 3, b: gy - 1, to: A.r1Margin + '@in' });
    r.anchors.r1MarginBack = B.anchor('r1MarginBack', 2, gy - 1);
    return r;
  };
}
Object.assign(BGPaint, {
  // the margin: a sheet of ruled paper seen up close, the red margin line, hole punches, Piwi's doodles and notes
  r1Margin(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = 'rgba(120,150,210,0.45)'; ctx.lineWidth = 2; for (let y = 40; y < H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let x = 220; x < BG_W; x += 520) { ctx.strokeStyle = 'rgba(220,60,80,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let x = 90; x < BG_W; x += 520) for (let y = 70; y < H; y += 150) { ctx.fillStyle = 'rgba(60,40,50,0.55)'; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(70,40,110,0.4)'; ctx.font = 'italic 16px sans-serif'; ctx.textAlign = 'left';
    const notes = ['note to self: ban fun', 'rule 13: no rule 13', 'buy more glass', 'NO!!', 'fun = bad', 'remember: frown'];
    for (let k = 0; k < 9; k++) { const x = rng() * BG_W, y = 60 + rng() * (H - 120); ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2 + rng() * 0.4); ctx.fillText(notes[k % notes.length], 0, 0); ctx.restore(); }
    // doodles: a frowning face, scribbled stars, a little top hat
    ctx.strokeStyle = 'rgba(70,40,110,0.45)'; ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const x = 80 + rng() * (BG_W - 160), y = 80 + rng() * (H - 160);
      if (k % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 14, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.fillStyle = 'rgba(70,40,110,0.45)'; ctx.fillRect(x - 9, y - 7, 4, 4); ctx.fillRect(x + 5, y - 7, 4, 4); }
      else if (k % 3 === 1) { ctx.beginPath(); for (let q = 0; q < 5; q++) { const a = q * 2.513 - 1.57; ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); } ctx.closePath(); ctx.stroke(); }
      else { ctx.strokeRect(x - 10, y - 24, 20, 20); ctx.beginPath(); ctx.moveTo(x - 18, y - 4); ctx.lineTo(x + 18, y - 4); ctx.stroke(); }
    }
  }
});
THEMES.r1_margin = Object.assign({}, THEMES.bk_wings, {
  name: 'The Margin', darkness: 0.04, particles: 'motes', fog: '#fff4e0', horizonGlow: '#fff4e0',
  sky: ['#e8dcc4', '#f2e8d4', '#fbf4e6'], layers: [{ kind: 'r1Margin', color: '#f4ecda', base: 0, f: 0.06 }]
});
Object.assign(Decor, {
  // the tell at 22-5's start: the page's edge curls up at the far left and the red margin line runs off-screen
  r1MarginEdge(ctx, x, y, t) {
    const x0 = x - TS / 2, sw = Math.sin(t * 2.4) * 3;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 16, y); ctx.quadraticCurveTo(x0 + 26 + sw, y - 60, x0 + 10 + sw, y - 130); ctx.lineTo(x0, y - 130); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,60,80,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0 + 6, y); ctx.lineTo(x0 + 5 + sw * 0.5, y - 128); ctx.stroke();
    ctx.fillStyle = '#5a2a8a'; ctx.font = HAND; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(x0 + 22, y - 74); ctx.rotate(-0.1); ctx.fillText('← margin', 0, 0); ctx.restore();
    ctx.restore();
  },
  // Piwi's things in the margin: an eraser, a stub of pencil, a doodle of himself frowning
  r1Eraser(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#ff9ab0'; rr(ctx, x - 22, y - 16, 44, 16, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a8ad8'; ctx.fillRect(x + 4, y - 16, 18, 16); ctx.strokeRect(x + 4, y - 16, 18, 16); ctx.restore(); },
  r1PencilStub(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.translate(x, y); ctx.rotate(-0.08);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(-24, -12, 34, 12); ctx.strokeRect(-24, -12, 34, 12);
    ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.moveTo(10, -12); ctx.lineTo(24, -6); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.moveTo(19, -8); ctx.lineTo(24, -6); ctx.lineTo(19, -4); ctx.fill();
    ctx.restore();
  },
  r1Doodle(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = '#5a2a8a'; ctx.lineWidth = 2.5; const b = Math.sin(t * 2) * 1.5;
    ctx.beginPath(); ctx.arc(x, y - 40 + b, 16, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 46 + b); ctx.lineTo(x - 3, y - 43 + b); ctx.moveTo(x + 8, y - 46 + b); ctx.lineTo(x + 3, y - 43 + b); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 28 + b, 7, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 24 + b); ctx.lineTo(x, y); ctx.moveTo(x - 12, y - 14 + b); ctx.lineTo(x + 12, y - 14 + b); ctx.stroke();
    ctx.fillStyle = '#5a2a8a'; ctx.font = HAND; ctx.textAlign = 'center'; ctx.fillText('me (cross)', x, y - 64);
    ctx.restore();
  }
});
const marginStamp = back => ({
  floor: 12,
  rows: [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'H..................................H',
    'H..................................H',
    'H.........o.o.o....................H',
    'H..................................H',
    'H........-----.....................H',
    'H..................................H',
    'H.................-----............H',
    'H..................................H',
    'H..........................----....e',
    'H..................................e',
    'H..k...d....n...u.......m....j.@...e',
    '####################################',
    '####################################'
  ],
  legend: { e: ['seam', 'right', back], k: ['decor', 'r1Doodle'], d: ['decor', 'r1Eraser'], j: ['decor', 'r1PencilStub'], m: ['spawn', 'bkMouse', {}],
    n: ['spawn', 'sign', { text: 'THE MARGIN. PIWI\'S PRIVATE NOTES. THE BIG BUTTON IS UNDER GLASS UNTIL THE OTHER FIVE RULES ARE GONE. (HE IS VERY SURE THAT WILL NEVER HAPPEN.)' }],
    u: ['spawn', 'button', { rule: 1, needs: PRE }] }
});
{
  const k = C.levels.findIndex(L => L.name === 'The Writer\'s Desk'), L5 = C.levels[k];
  if (L5 && !L5.areas.some(a => a.id === 'margin')) {
    const areas = L5.areas.slice(); areas[0] = Object.assign({}, areas[0], { r1Margin: 'margin' });
    areas.push({ id: 'margin', gen: 'room', role: 'backstage', zone: 'wings', theme: 'r1_margin', stamp: marginStamp(areas[0].id + '@r1MarginBack') });
    Tour.amend('w22', { levels: [Object.assign({}, L5, { n: k + 1, areas })] });
  }
}

/* ================= 22-6 THE RULEBOOK: the look ================= */
Object.assign(BGPaint, {
  // far: the open book itself, a two-page spread of Piwi's rules (each one struck through with a red REVOKED stamp,
  // except RULE 1), the gutter down the middle, the page edges at the bottom
  r1Spread(ctx, L, rng, H) {
    ctx.fillStyle = '#3e2050'; ctx.fillRect(0, 0, BG_W, H);
    const RULES = ['RULE 1. NO FUN.', 'RULE 3. NO DANCING.', 'RULE 7. NO HATS ON ANIMALS.', 'RULE 9. NO SHORTCUTS.', 'RULE 10. NO LATE FLIGHTS.', 'RULE 12. NO RETURNS.'];
    for (let x = 20, sp = 0; x < BG_W; x += 520, sp++) {
      for (const side of [0, 1]) {
        const px = x + side * 250, pw = 240, top = 30, bot = L.base;
        ctx.fillStyle = side ? PAPER : PAPER2; ctx.fillRect(px, top, pw, bot - top);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(side ? px : px + pw - 22, top, 22, bot - top);
        ctx.fillStyle = '#6a3a8a'; ctx.font = 'bold 15px serif'; ctx.textAlign = 'left';
        for (let k = 0; k < 3; k++) {
          const n = (sp * 2 + side) * 3 + k, y = top + 46 + k * 90, R = RULES[n % RULES.length];
          ctx.fillStyle = '#5a2a6a'; ctx.fillText(R, px + 20, y);
          ctx.fillStyle = 'rgba(80,60,90,0.35)'; for (let q = 0; q < 4; q++) ctx.fillRect(px + 20, y + 14 + q * 12, 160 + rng() * 50, 4);
          if (n % RULES.length) { ctx.save(); ctx.translate(px + 150, y + 22); ctx.rotate(-0.2); ctx.strokeStyle = 'rgba(208,32,58,0.75)'; ctx.lineWidth = 4; ctx.strokeRect(-56, -16, 112, 32); ctx.fillStyle = 'rgba(208,32,58,0.75)'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('REVOKED', 0, 7); ctx.restore(); ctx.textAlign = 'left'; }
        }
        ctx.fillStyle = 'rgba(90,60,40,0.5)'; ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.fillText(String(22 + sp * 2 + side), px + pw / 2, bot - 14); ctx.textAlign = 'left';
      }
    }
  },
  // near: stacks of other rulebooks and giant rubber stamps standing in ink pads
  r1Stack(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 60 + rng() * 50, h = 80 + rng() * 140, cols = ['#5a2a6a', '#2a4a8a', '#8a2a3a', '#2a6a5a'], c = cols[Math.floor(rng() * 4)];
      wrapDraw(x, w + 10, X => {
        let y = L.base;
        for (let k = 0; y > L.base - h; k++) { const bh = 16 + (k % 3) * 5, bw = w - (k % 2) * 10; ctx.fillStyle = cols[(k + Math.floor(rng() * 4)) % 4]; ctx.fillRect(X + (w - bw) / 2, y - bh, bw, bh); ctx.fillStyle = 'rgba(232,184,74,0.6)'; ctx.fillRect(X + (w - bw) / 2 + 6, y - bh + 4, bw - 12, 2); y -= bh; }
        if (rng() < 0.4) { ctx.fillStyle = '#7a5434'; ctx.fillRect(X + w / 2 - 5, y - 40, 10, 34); ctx.fillStyle = c; ctx.fillRect(X + w / 2 - 18, y - 8, 36, 8); }
      });
      x += w + 30 + rng() * 80;
    }
    ctx.fillStyle = '#2a1636'; ctx.fillRect(0, L.base, BG_W, H - L.base);
  }
});
// the floor: the top edges of closed books lying side by side (gilded page edges on top, coloured covers below)
const rbGround = {
  style: 'stage', cap: '#e8d8b0', capHi: '#fff4d8', dirt: '#5a2a6a', dirt2: '#3e1a4c', rock: '#5a2a6a',
  paint(ctx, rng, o) {
    const c = ['#5a2a6a', '#2a4a8a', '#8a2a3a', '#2a6a5a'][(o.variant || 0) % 4];
    ctx.fillStyle = c; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 0, 2, TS);
    ctx.fillStyle = 'rgba(232,184,74,0.55)'; ctx.fillRect(4, 8 + ((o.variant || 0) % 3) * 6, TS - 8, 2);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#f4e8c8'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = 'rgba(160,130,90,0.55)'; for (let y = 1; y < 6; y += 2) ctx.fillRect(x0, y, x1 - x0, 0.8);
    ctx.fillStyle = GOLD; ctx.fillRect(x0, 0, x1 - x0, 1.4);
  }
};
THEMES.r1_book = Object.assign({}, THEMES.w22_desk || THEMES.w22_corridor, {
  name: 'Inside the Rulebook', music: 'tour_w22', particles: 'motes', rays: null, darkness: 0,
  sky: ['#2a1438', '#4a2a5a', '#7a4a8a'], horizonGlow: '#ffe0f0', celestial: { type: 'none' }, stars: 0,
  layers: [{ kind: 'r1Spread', color: '#3e2050', base: 330, f: 0.05 }, { kind: 'r1Stack', color: '#2a1636', base: 420, f: 0.16 }],
  fog: '#ffe8f4', ground: rbGround, decor: []
});
THEMES.r1_small = Object.assign({}, THEMES.r1_book, { name: 'The Small Print', music: 'secret', layers: [{ kind: 'r1Spread', color: '#3e2050', base: 380, f: 0.1 }] });

/* ---------- page-turn platforms: toggle groups of kind 'page' (auto: the validator tries both states) ----------
   A page is 7 tiles over a gap: the spine in the middle (a closed book standing on end: always solid) and a leaf of
   three tiles lying on one side of it. Every `period` seconds the leaf turns over to the other side. Two clocks
   (groups 0 and 1, half a period apart) alternate along a run, so Brady waits on a spine, then crosses. The tell: in
   the last 0.9 s before it turns, the leaf's outer corner curls up and a curved arrow shows over the spine. */
const RB_PERIOD = 2.6;
TourHooks.on('playUpdate', (play) => {
  const A = play.area, tg = A && A.toggles; if (!tg || !A.rbPages) return;
  for (const gi in tg) {
    const G = tg[gi]; if (G.kind !== 'page') continue;
    const want = Math.floor((play.t + G.offset) / G.period) % 2 === 1;
    if (play.toggleBit(+gi) !== want) play.flipToggle(+gi, true);
  }
});
class RbPage extends Ent {
  constructor(g, s) {
    super(g, s, 7 * TS, TS);
    this.sp = Math.floor(s.x / TS); this.row = s.row; this.gi = s.g; this.x = (this.sp - 3) * TS; this.y = this.row * TS; this.back = true;
    this.flipT = 9; this.to = false;
    if (g.area) g.area.rbPages = true;
  }
  onToggle(gi, on) { if (gi === this.gi) { this.flipT = 0; this.to = on; if (this.g.onScreen(this, 40)) Sound.play('cardFlip', { vol: 0.3 }); } }
  update(dt) { this.t += dt; this.flipT += dt; }
  draw(ctx) {
    const g = this.g, A = g.area, G = A.toggles && A.toggles[this.gi]; if (!G) return;
    const sx = this.sp * TS + TS / 2, top = this.row * TS, on = g.toggleBit(this.gi), Lw = 3 * TS;
    const left = (g.t + G.offset) % G.period, next = G.period - left;
    ctx.save(); ctx.lineJoin = 'round';
    // the spine: a closed book standing on end, down into the gap
    const bot = A.H * TS;
    ctx.fillStyle = LEATHER2; ctx.fillRect(sx - 15, top, 30, bot - top);
    ctx.fillStyle = LEATHER; ctx.fillRect(sx - 12, top, 24, bot - top);
    ctx.fillStyle = GOLD; for (let y = top + 18; y < top + 200 && y < bot; y += 34) ctx.fillRect(sx - 12, y, 24, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(sx - 15, top, 30, Math.min(bot - top, 400));
    ctx.fillStyle = PAPER; ctx.fillRect(sx - 14, top, 28, 7); ctx.fillStyle = GOLD; ctx.fillRect(sx - 14, top, 28, 1.5);
    // where the leaf will land: a faint dotted outline
    ctx.globalAlpha = 0.45; ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    if (on) ctx.strokeRect(sx - 15 - Lw, top + 1, Lw, 8); else ctx.strokeRect(sx + 15, top + 1, Lw, 8);
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    const k = clamp(this.flipT / 0.4, 0, 1);
    if (k < 1) {
      // turning: the leaf sweeps over the spine (from the side it was on to the other)
      const a = Math.PI * easeInOut(k), d = this.to ? 1 : -1, ex = sx - d * Math.cos(a) * Lw, ey = top - Math.sin(a) * Lw * 0.7;
      ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx, top + 8); ctx.lineTo(ex, ey + 8); ctx.lineTo(ex, ey); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      // lying flat: a page with ruled lines and a line of tiny print; its corner curls up just before it turns
      const d = on ? 1 : -1, x0 = d > 0 ? sx + 15 : sx - 15 - Lw, curl = next < 0.9 ? (0.9 - next) / 0.9 : 0;
      ctx.fillStyle = PAPER2; ctx.fillRect(x0, top + 6, Lw, 6);
      ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      const cw = 22 * curl, ox = d > 0 ? x0 + Lw : x0;
      ctx.beginPath();
      if (d > 0) { ctx.moveTo(x0, top); ctx.lineTo(ox - cw, top); ctx.lineTo(ox, top + 8 - cw * 1.4); ctx.lineTo(ox, top + 8); ctx.lineTo(x0, top + 8); }
      else { ctx.moveTo(x0 + Lw, top); ctx.lineTo(ox + cw, top); ctx.lineTo(ox, top + 8 - cw * 1.4); ctx.lineTo(ox, top + 8); ctx.lineTo(x0 + Lw, top + 8); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(120,150,210,0.7)'; ctx.fillRect(x0 + 8, top + 3, Lw - 30, 1.2);
      if (curl > 0) {
        const sh = Math.sin(this.t * 40) * curl * 1.5;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ox, top + 8 - cw * 1.4 + sh); ctx.lineTo(ox - d * cw, top + sh); ctx.lineTo(ox - d * cw * 0.4, top - cw * 0.5 + sh); ctx.closePath(); ctx.fill(); ctx.stroke();
        // the curved arrow over the spine: it is about to turn
        ctx.globalAlpha = 0.5 + 0.5 * curl; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, top - 26, 14, d > 0 ? Math.PI * 1.05 : Math.PI * 1.95, d > 0 ? Math.PI * 1.95 : Math.PI * 1.05, d < 0); ctx.stroke();
        const ax = sx - d * 14, ay = top - 24; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(ax - 5, ay - 4); ctx.lineTo(ax + 5, ay - 4); ctx.lineTo(ax, ay + 4); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
}
/* ---------- rubber-stamp crushers: a giant stamp on a handle from above the view; it rests high, shakes and glows
   red (and its shadow shows on the floor) before it slams down, holds a moment (DENIED!), then rises. It hurts like
   any hazard while it is down; it never crushes. Its clock is the level's, so a row of them keeps its rhythm. ---------- */
class RbStamp extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 22);
    this.fx = s.x; this.floor = s.y; this.phase = s.phase || 0; this.period = s.period || 3.2; this.k = 0; this.thud = false;
    this.place(0);
  }
  // k: 0 = up (the face 4.5 tiles over the floor) .. 1 = down on the floor
  place(k) { this.k = k; this.x = this.fx - this.w / 2; this.y = this.floor - this.h - (1 - k) * 4.5 * TS; }
  get cycle() { return (this.g.t + this.phase) % this.period; }
  get danger() { const c = this.cycle, P = this.period; return c >= P - 1.15 && c < P - 0.45; }
  // the cycle: resting high, the tell (0.75 s), the slam (0.15 s), holding down (0.55 s), rising (0.45 s)
  update(dt) {
    this.t += dt;
    const c = this.cycle, P = this.period;
    let k = 0;
    if (c >= P - 0.45) k = 1 - (c - (P - 0.45)) / 0.45;
    else if (c >= P - 1.0) k = 1;
    else if (c >= P - 1.15) k = (c - (P - 1.15)) / 0.15;
    this.place(clamp(k, 0, 1));
    if (k >= 1 && !this.thud) { this.thud = true; if (this.g.onScreen(this, 40)) { this.g.shake(2.5); K.sfx('stomp', 'stomp', { vol: 0.45, pitch: 0.7 }); } }
    if (k < 1) this.thud = false;
  }
  touchPlayer(p) { if (this.danger && !p.dead) p.hurt(this); }
  draw(ctx) {
    const x = this.fx, fy = this.floor, c = this.cycle, P = this.period, tell = c >= P - 1.9 && c < P - 1.15;
    const shake = tell ? Math.sin(this.t * 50) * 2 : 0, faceY = this.y, top = faceY - 70;
    ctx.save(); ctx.lineJoin = 'round';
    // the ink mark on the floor where it lands (always there; red and pulsing during the tell)
    ctx.globalAlpha = tell ? 0.55 + 0.35 * Math.sin(this.t * 18) : 0.22; ctx.fillStyle = RED;
    ctx.beginPath(); ctx.ellipse(x, fy - 2, this.w / 2 + 4, 5, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // the handle from above the view: a turned wooden knob on a long dowel
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - 6 + shake, top - 400, 12, 400 + 44); ctx.strokeRect(x - 6 + shake, top - 400, 12, 400 + 44);
    ctx.fillStyle = '#a8784a'; ctx.beginPath(); ctx.ellipse(x + shake, top + 44, 20, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // the mount and the red rubber face: DENIED in mirror letters underneath (we only see the edge and its print)
    ctx.fillStyle = '#6a3a1e'; rr(ctx, x - this.w / 2 - 2 + shake, faceY - 18, this.w + 4, 20, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tell ? '#ff3a5a' : RED; ctx.fillRect(x - this.w / 2 + 2 + shake, faceY + 2, this.w - 4, this.h - 4); ctx.strokeRect(x - this.w / 2 + 2 + shake, faceY + 2, this.w - 4, this.h - 4);
    ctx.fillStyle = '#ffe8ec'; ctx.font = F8; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('DENIED', x + shake, faceY + this.h / 2 + 1);
    if (tell) { ctx.fillStyle = '#ffd84a'; ctx.font = F12; ctx.fillText('!', x + 22, faceY - 26 + Math.sin(this.t * 20) * 2); }
    if (this.k >= 1 && c >= P - 1.0 && c < P - 0.45) { ctx.fillStyle = RED; ctx.font = F9; ctx.fillText('DENIED!', x, fy - this.h - 20); }
    ctx.restore();
  }
}
// footnotes: little one-way ledges, each a line of Piwi's small print with its superscript number
Object.assign(Decor, {
  r1Footnote(ctx, x, y, t, th, d) {
    const n = (d && d.seed) || 1, x0 = x - TS / 2;
    ctx.save(); ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillRect(x0 - 2, y, 2 * TS + 4, 10); ctx.strokeRect(x0 - 2, y, 2 * TS + 4, 10);
    ctx.fillStyle = '#5a2a6a'; ctx.font = F6; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(FOOTNOTES[n % FOOTNOTES.length], x0 + 2, y + 5.5, 2 * TS - 2);
    ctx.restore();
  },
  // a standing tome (its body is solid): VOLUME 2 down its spine
  r1Tome(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.fillStyle = LEATHER; ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = LEATHER2; ctx.fillRect(x0 + w - 12, y0, 12, h);
    ctx.fillStyle = GOLD; for (const f of [0.08, 0.16, 0.84, 0.92]) ctx.fillRect(x0 + 4, y0 + h * f, w - 8, 3);
    ctx.fillStyle = PAPER; ctx.fillRect(x0 + 2, y0 - 6, w - 4, 6); ctx.strokeRect(x0 + 2, y0 - 6, w - 4, 6);
    ctx.save(); ctx.translate(x, y0 + h * 0.5); ctx.rotate(-Math.PI / 2); ctx.fillStyle = GOLD; ctx.font = F11; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HOUSE RULES · VOL. 2', 0, 0, h - 40); ctx.restore();
    ctx.restore();
  },
  // the lectern in the Rulebook's arena: an ink pad and a quill
  r1Lectern(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a3a1e'; ctx.fillRect(x - 6, y - 50, 12, 50); ctx.strokeRect(x - 6, y - 50, 12, 50);
    ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.moveTo(x - 30, y - 50); ctx.lineTo(x + 30, y - 60); ctx.lineTo(x + 30, y - 52); ctx.lineTo(x - 30, y - 42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a3a'; rr(ctx, x - 26, y - 10, 30, 10, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = RED; ctx.fillRect(x - 23, y - 9, 24, 3);
    ctx.restore();
  }
});
const FOOTNOTES = ['¹ Fun is not permitted.', '² Nor is giggling.', '³ See rule 1.', '⁴ Especially on Tuesdays.', '⁵ Hats: see rule 7.', '⁶ This means YOU.'];
TOUR_SKINS.rbChapterDoor = (ctx, e, t) => {
  // a book's cover standing ajar like a door: CHAPTER THE LAST, light from inside
  const x = e.cx, y = e.y + e.h;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3); ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.ellipse(x, y - 26, 30, 34, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = PAPER; ctx.fillRect(x - 15, y - 54, 30, 54); ctx.strokeRect(x - 15, y - 54, 30, 54);
  ctx.fillStyle = LEATHER; ctx.beginPath(); ctx.moveTo(x - 15, y - 54); ctx.lineTo(x - 4, y - 58); ctx.lineTo(x - 4, y + 2); ctx.lineTo(x - 15, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a2a6a'; ctx.font = F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CHAPTER', x + 5, y - 38); ctx.fillText('THE', x + 5, y - 30); ctx.fillText('LAST', x + 5, y - 22);
  ctx.restore();
};
Object.assign(ENTITY_TYPES, { rbPage: RbPage, rbStamp: RbStamp });

/* ---------- 22-6's pieces (country pieces of w22) ---------- */
const P = {
  // the opening page: a sign, a running header
  rbHeader(st, o) {
    const x = st.x; st.floor(x, x + 5);
    st.sign(x + 2, 'YOU ARE INSIDE PIWI\'S HOUSE RULES. PAGES TURN (WAIT ON A SPINE WHEN A CORNER CURLS). STAMPS SLAM (WATCH FOR RED). AT THE END: THE RULEBOOK ITSELF.');
    return x + 6;
  },
  // a run of n page-turn platforms over a gap: { n, gold: kind of the postcard over the first spine, offset }
  rbTurn(st, o) {
    const B = st.B, n = o.n || 2, y = st.gy, period = o.period || RB_PERIOD;
    let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      const s = x + 3, gi = (k + (o.flip ? 1 : 0)) % 2;
      st.pit(x, x + 6);
      for (let yy = y; yy < B.H; yy++) { B.set(s, yy, T.HARD); B.setHide(s, yy, 1); }
      B.toggle(gi, [[s - 3, y, s - 1, y, T.SEMI]], [[s + 1, y, s + 3, y, T.SEMI]], { auto: true, kind: 'page', period, offset: gi ? period / 2 : 0 });
      for (let xx = s - 3; xx <= s + 3; xx++) if (xx !== s) { if (xx < s) B.set(xx, y, T.SEMI); B.setHide(xx, y, 1); }
      B.spawn('rbPage', s, y - 1, { row: y, g: gi });
      if (k === 0 && o.gold) st.gold(s, y - 4, o.gold);
      if (k === n - 1) st.coins(s - 1, s + 1, y - 3);
      x += 7;
    }
    st.floor(x, x + 3);
    return x + 4;
  },
  // a corridor of n rubber stamps, 5 tiles apart, each a little later than the one before: { n, period }
  rbStamps(st, o) {
    const B = st.B, n = o.n || 3, period = o.period || 3.2, x = st.x, len = n * 5 + 4;
    st.floor(x, x + len);
    for (let k = 0; k < n; k++) B.spawn('rbStamp', x + 4 + k * 5, st.gy - 1, { phase: k * 0.55, period });
    st.coins(x + 2, x + len - 2, st.gy - 2);
    return x + len + 1;
  },
  // footnotes up a standing tome: two ledges of small print, the postcard over the top: { gold }
  rbNotes(st, o) {
    const B = st.B, x = st.x, gy = st.gy;
    st.floor(x, x + 13);
    B.prop('r1Tome', x + 6, gy - 9, 3, 9, 'body');
    for (const [lx, ly, nn] of [[x + 3, gy - 3, 1], [x + 2, gy - 6, 2]]) { st.semi(lx, lx + 1, ly); B.decorAt('r1Footnote', lx, ly, nn); }
    B.decorAt('r1Footnote', x + 10, gy - 4, 3); st.semi(x + 10, x + 11, gy - 4);
    st.gold(x + 7, gy - 12, o.gold || 'high');
    st.coins(x + 6, x + 8, gy - 10);
    return x + 14;
  },
  // the Rulebook's arena: footnote ledges at each side and one higher in the middle, a lectern
  arena_rulebook(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 3; q++) { B.set(x0 + 2 + q, GY - 4, T.SEMI); B.set(x0 + w - 5 + q, GY - 4, T.SEMI); }
    B.decorAt('r1Footnote', x0 + 2, GY - 4, 4); B.decorAt('r1Footnote', x0 + w - 5, GY - 4, 5);
    B.decorAt('r1Lectern', x0 + 1, GY, 0);
  }
};
for (const k in P) Tour.pieces['w22.' + k] = P[k];

/* ---------- the Small Print (22-6's secret room, a PICK ONE room: SECRET_ROOMS.md) ---------- */
const stamps = {
  r1SmallPrint: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#.............*..............#',
      '#............................#',
      '#.....o.o.o.o................#',
      '#............................#',
      '#..........------............#',
      '#............................#',
      '#......?.....................#',
      '#.@.D........................#',
      '##############################',
      '##############################',
      '##############################'
    ],
    items: ['oneup'], doors: [{ to: 'book@spBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  }
};

/* ---------- the level ---------- */
const L6 = {
  n: 6, name: 'The Rulebook', mapLabel: 'Rulebook', arch: 'bonus', secret: true, mapHidden: true, theme: 'r1_book', boss: 'w22_rulebook', mid: true, time: 500,
  gimmick: 'Inside Piwi\'s House Rules: pages that turn under you, rubber stamps that slam, footnotes to climb. At the end: the Rulebook itself',
  hint: 'A page\'s corner curls up just before it turns: wait on its spine. The stamps glow red before they slam',
  postcard: 'You tore up the Rulebook! Piwi sulked... then I caught him tapping his foot. Party at ours! ♥ C',
  enemies: [['w22Moth', 2], ['w22Envelope', 1]],
  mapCell: [2, 1], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'book', gen: 'strip', W: 200, H: 20, script: [
      ['rbHeader', {}],
      ['itemBlock', { item: 'power', y: 4 }],
      ['rbTurn', { n: 2, gold: 'must' }],
      ['rbStamps', { n: 3 }],
      ['enemies', { kind: 'w22Moth', n: 1, len: 8 }],
      ['rbNotes', { gold: 'high' }],
      'cp',
      ['itemBlock', { item: 'power', y: 4 }],
      ['secretDoor', { to: 'smallprint@in', look: 'fake', back: 'spBack' }],
      ['rbTurn', { n: 3, flip: true }],
      ['enemies', { kind: 'w22Envelope', n: 1, len: 8 }],
      ['rbStamps', { n: 2, period: 2.8 }],
      ['door', { to: 'finale@in', look: 'rbChapterDoor', perch: 0 }]
    ] },
    { id: 'smallprint', gen: 'room', role: 'secret', theme: 'r1_small', stamp: 'r1SmallPrint', room: 'pick',
      pick: { title: 'THE SMALL PRINT', rule: 'PIWI\'S LAWYER LAID OUT THREE BOXES. THE SMALL PRINT SAYS: TAKE ONE. ONE!' } },
    { id: 'finale', gen: 'arena', role: 'arena', layout: 'rulebook', arenaW: 26, H: 16, roof: false, theme: 'r1_book' }
  ]
};

/* ================= the mini-boss: THE RULEBOOK ================= */
// A flapping book with two stamp arms. It hovers over Brady, aims (two red marks show on the floor under its stamps),
// then slams down and FALLS OPEN for a moment: stomp it and a page of rules tears out. Anywhere else a stomp bounces
// off its hard cover. Phase 2 (after one page): each slam splashes two ink blots that roll along the floor (jump them).
// Phase 3 (after two): it slams twice in a row before it falls open. The last page is RULE 1: NO FUN.
const RB_PAGES = ['RULES 3 & 7', 'RULES 9, 10 & 12', 'RULE 1: NO FUN'];
class RbTornPage extends Ent {
  constructor(g, s) { super(g, s, 40, 30); this.text = s.text || ''; this.vx = (s.dir || 1) * 1.5 * TS; this.vy = -5 * TS; this.life = 2.6; this.spin = 0; }
  update(dt) { this.t += dt; this.life -= dt; this.vy = Math.min(this.vy + 6 * TS * dt, 1.2 * TS); this.x += (this.vx + Math.sin(this.t * 5) * TS) * dt; this.y += this.vy * dt; this.spin = Math.sin(this.t * 4) * 0.4; if (this.life <= 0) this.remove = true; }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha = clamp(this.life, 0, 1); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin);
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-26, -18); ctx.lineTo(26, -18); ctx.lineTo(26, 18); for (let q = 26; q > -26; q -= 6) ctx.lineTo(q - 3, 18 + (q % 12 ? 3 : -2)); ctx.lineTo(-26, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a2a6a'; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.text, 0, -6, 48);
    ctx.save(); ctx.rotate(-0.2); ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.strokeRect(-20, 1, 40, 12); ctx.fillStyle = RED; ctx.font = F6; ctx.fillText('REVOKED', 0, 7.5); ctx.restore();
    ctx.restore();
  }
}
ENTITY_TYPES.rbTornPage = RbTornPage;
const blotArt = (ctx, s, t) => {
  const x = s.cx, y = s.y + s.h, wob = Math.sin(t * 20 + s.x) * 1.5;
  ctx.save(); ctx.fillStyle = '#2a1640'; ctx.strokeStyle = '#120a1e'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.quadraticCurveTo(x - 12, y - 10 - wob, x, y - 15); ctx.quadraticCurveTo(x + 12, y - 10 + wob, x + 11, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 3, y - 8, 2.2, 0, TAU); ctx.arc(x + 4, y - 8, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#120a1e'; ctx.beginPath(); ctx.arc(x - 3 + s.dir, y - 8, 1, 0, TAU); ctx.arc(x + 4 + s.dir, y - 8, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
// the art: a hardback in purple leather with Piwi's gold P and an embossed scowl; its covers flap like wings; two
// bendy arms hold rubber stamps. Open on the floor: the spread of pages riffling, a red ribbon with the next rule.
const rbArt = (ctx, b, t) => {
  const x = b.cx, y = b.y + b.h, P = b.pose || 'walk', ph = b.phase || 1;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  if (P === 'open') {
    // lying open on the floor, dazed: the pages riffle, the ribbon sticks up (stomp here)
    const fl = Math.sin(t * 16) * 4;
    ctx.fillStyle = LEATHER2; rr(ctx, x - 50, y - 12, 100, 12, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(x - 46, y - 10); ctx.quadraticCurveTo(x - 24, y - 24, x, y - 16); ctx.quadraticCurveTo(x + 24, y - 24, x + 46, y - 10); ctx.lineTo(x + 46, y - 6); ctx.lineTo(x - 46, y - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,110,0.55)'; ctx.lineWidth = 1.2; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(x - 40, y - 12 - q * 3); ctx.lineTo(x - 8, y - 14 - q * 3); ctx.moveTo(x + 8, y - 14 - q * 3); ctx.lineTo(x + 40, y - 12 - q * 3); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.quadraticCurveTo(x + 10, y - 34 - fl, x + 26, y - 28 - fl); ctx.lineTo(x + 22, y - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the ribbon with the next page's rules
    const rx = x - 4; ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(rx - 4, y - 16); ctx.lineTo(rx - 6, y - 52); ctx.lineTo(rx + 6, y - 52); ctx.lineTo(rx + 4, y - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe8ec'; ctx.font = F5; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(rx, y - 34); ctx.rotate(-Math.PI / 2); ctx.fillText(RB_PAGES[clamp(3 - Math.ceil(b.hp), 0, 2)], 0, 0, 34); ctx.restore();
    // the arms flopped out, stamps on the floor
    for (const d of [-1, 1]) { ctx.strokeStyle = LEATHER; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + d * 44, y - 8); ctx.quadraticCurveTo(x + d * 56, y - 18, x + d * 64, y - 6); ctx.stroke(); ctx.fillStyle = RED; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; rr(ctx, x + d * 64 - 10, y - 8, 20, 8, 2); ctx.fill(); ctx.stroke(); }
    TourKit.dizzy && TourKit.dizzy(ctx, x, y - 60, t);
    ctx.restore(); return;
  }
  const fly = P === 'walk' || P === 'reel' || P === 'rise', flap = fly ? Math.sin(t * (ph >= 3 ? 14 : 10)) : P === 'aim' ? 0.6 : P === 'slam' ? -0.4 : 0;
  const cy = y - 28, shake = P === 'aim' ? Math.sin(t * 50) * 1.5 : P === 'exit' ? Math.sin(t * 60) * 3 : 0;
  ctx.translate(shake, 0);
  // the arms with their stamps (behind the covers): raised while aiming, thrust down in the slam
  const armY = P === 'aim' ? -26 : P === 'slam' ? 22 : 8 + Math.sin(t * 6) * 3;
  for (const d of [-1, 1]) {
    const hx = x + d * 46, hy = cy + armY;
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + d * 18, cy + 6); ctx.quadraticCurveTo(x + d * 40, cy + 2, hx, hy); ctx.stroke();
    ctx.strokeStyle = LEATHER; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.fillStyle = '#8a5a34'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillRect(hx - 3, hy - 10, 6, 12); ctx.strokeRect(hx - 3, hy - 10, 6, 12);
    ctx.fillStyle = '#6a3a1e'; rr(ctx, hx - 11, hy + 1, 22, 6, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P === 'aim' ? '#ff3a5a' : RED; rr(ctx, hx - 10, hy + 6, 20, 6, 1.5); ctx.fill(); ctx.stroke();
  }
  // the back cover, the page block, the front cover: the covers flap round the spine
  const open = P === 'exit' ? 0.05 : 0.35 + flap * 0.25, cw = 32, chh = 44;
  ctx.fillStyle = LEATHER2; ctx.beginPath(); ctx.moveTo(x, cy - chh / 2); ctx.lineTo(x - cw * Math.cos(open), cy - chh / 2 - cw * Math.sin(open) * 0.5); ctx.lineTo(x - cw * Math.cos(open), cy + chh / 2 - cw * Math.sin(open) * 0.5); ctx.lineTo(x, cy + chh / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(x, cy - chh / 2 + 3); ctx.lineTo(x - (cw - 4) * Math.cos(open) * 0.9, cy - chh / 2 + 3 - (cw - 4) * Math.sin(open) * 0.45); ctx.lineTo(x - (cw - 4) * Math.cos(open) * 0.9, cy + chh / 2 - 3 - (cw - 4) * Math.sin(open) * 0.45); ctx.lineTo(x, cy + chh / 2 - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = LEATHER; ctx.beginPath(); ctx.moveTo(x, cy - chh / 2); ctx.lineTo(x + cw * Math.cos(open), cy - chh / 2 - cw * Math.sin(open) * 0.5); ctx.lineTo(x + cw * Math.cos(open), cy + chh / 2 - cw * Math.sin(open) * 0.5); ctx.lineTo(x, cy + chh / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the front cover's face: gold corners, Piwi's P crest, an embossed scowl (eyes narrow while it aims)
  const fx = x + cw * Math.cos(open) * 0.5, fy = cy - cw * Math.sin(open) * 0.25, sq = Math.cos(open);
  ctx.fillStyle = GOLD; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.save(); ctx.translate(fx, fy); ctx.scale(Math.max(0.3, sq), 1);
  ctx.fillText('HOUSE', 0, -14); ctx.fillText('RULES', 0, -7);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; const ey = P === 'aim' ? 1.5 : 3;
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-3, 2 + ey); ctx.moveTo(10, 2); ctx.lineTo(3, 2 + ey); ctx.stroke();
  ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(-6, 6, 2, 0, TAU); ctx.arc(6, 6, 2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 18, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
  // the spine with its gold bands
  ctx.fillStyle = LEATHER2; ctx.fillRect(x - 3, cy - chh / 2, 6, chh); ctx.strokeRect(x - 3, cy - chh / 2, 6, chh);
  ctx.fillStyle = GOLD; ctx.fillRect(x - 3, cy - chh / 2 + 6, 6, 2); ctx.fillRect(x - 3, cy + chh / 2 - 8, 6, 2);
  if (P === 'exit') { ctx.fillStyle = PAPER; for (let k = 0; k < 6; k++) { const a = t * 3 + k, r = 20 + ((t * 40 + k * 13) % 50); ctx.fillRect(x + Math.cos(a) * r - 4, cy + Math.sin(a) * r * 0.6 - 3, 8, 6); } }
  ctx.restore();
  // the tell for the slam: two red marks on the floor under the stamps
  if (P === 'aim' && b.state === 'fight') {
    ctx.save(); ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 18); ctx.fillStyle = RED;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 46, b.floorY - 3, 16, 5, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(x, b.floorY - 3, 34, 6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
Tour.boss({
  id: 'w22_rulebook', name: 'The Rulebook', hp: 3, dims: [72, 56], floats: true, music: 'tour_w22_boss', country: 'w22',
  brain: {
    guardText: 'HARDBACK!',
    phases: [2, 1],
    hoverY(b) { return b.floorY - b.h - 6.5 * TS; },
    wake(b) { b.g.toast('WHEN IT SLAMS DOWN IT FALLS OPEN: STOMP IT TO TEAR OUT A PAGE'); K.say(b.g, b, 'RULE 1: NO FUN!', '#ffd84a'); b.slams = 0; },
    hit(b, kind) {
      if (kind === 'stomp' || kind === 'spin') {
        if (b.act === 'open') {
          b.g.spawn(new RbTornPage(b.g, { x: b.cx, y: b.y - 10, text: RB_PAGES[clamp(3 - Math.ceil(b.hp), 0, 2)], dir: b.g.player && b.g.player.cx < b.cx ? 1 : -1 }));
          b.damage(1, { text: 'RIIIP!', col: '#ffd84a' }); return true;
        }
        return 'bounce';
      }
      return undefined;
    },
    hurt(b) { b.go('reel'); K.say(b.g, b, pick(['MY RULES!', 'THAT WAS IN INK!', 'STOP READING ME!']), '#ffd84a'); },
    phase(b, n) { this.hurt(b); b.g.bannerText = n === 2 ? 'IT\'S SPILLING INK!' : 'IT\'S IN A HURRY!'; b.g.bannerT = 1.8; },
    lastHit(b) { b.go('exit'); b.vx = 0; b.vy = 0; b.g.shake(6); return true; },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1, hy = this.hoverY(b);
      b.guard = 'bounce';
      if (b.act === 'walk') {
        // hover over Brady, flapping
        b.pose = 'walk'; b.vx = 0;
        b.hover(dt, hy + Math.sin(b.t * 2.4) * 6, p ? p.cx : b.cx);
        if (b.at > (ph >= 3 ? 1.0 : ph >= 2 ? 1.3 : 1.7)) { b.slams = 0; b.go('aim'); }
      } else if (b.act === 'aim') {
        // the tell: it stops, raises its stamps, two red marks show on the floor for 0.8 s
        b.pose = 'aim'; b.vx = 0; b.hover(dt, hy);
        if (b.first) K.sfx('whoosh', 'jump', { vol: 0.4, pitch: 1.4 });
        if (b.at > (b.slams ? 0.55 : 0.85)) { b.vy = 2 * TS; b.go('slam'); }
      } else if (b.act === 'slam') {
        b.pose = 'slam'; b.vy = Math.min(b.vy + 70 * TS * dt, 26 * TS); b.y += b.vy * dt;
        if (b.y + b.h >= b.floorY) {
          b.y = b.floorY - b.h; b.vy = 0; b.slams++;
          g.shake(7); K.sfx('stomp', 'stomp', { vol: 0.8, pitch: 0.6 }); g.burst(b.cx, b.floorY - 4, 14, '#2a1640', 'dust');
          if (ph >= 2) for (const d of [-1, 1]) tourFire(g, b.cx + d * 50, b.floorY - 8, { vx: d * (ph >= 3 ? 5.5 : 4.5) * TS, vy: 0, w: 22, h: 15, life: 3.2, thru: true, col: '#2a1640', art: blotArt, dir: d });
          if (ph >= 3 && b.slams < 2) b.go('hop'); else b.go('open');
        }
      } else if (b.act === 'hop') {
        // phase 3: up a little and across to slam again
        b.pose = 'rise'; b.vx = 0; b.hover(dt, hy + 2 * TS, p ? p.cx : b.cx);
        if (b.at > 0.5) b.go('aim');
      } else if (b.act === 'open') {
        // fallen open, dazed: the moment to stomp
        b.pose = 'open'; b.vx = 0; b.vuln = true; b.guard = 'hurt'; b.y = b.floorY - b.h;
        if (b.first) K.say(g, b, pick(['OOF... PAGE 22...', '*RIFFLE*', 'WHERE WAS I?']), '#ffd84a');
        if (b.at > (ph >= 3 ? 1.4 : 1.8)) b.go('rise');
      } else if (b.act === 'rise' || b.act === 'reel') {
        b.pose = b.act; b.vx = 0; b.hover(dt, hy);
        if (b.at > (b.act === 'reel' ? 1.1 : 0.8)) b.go('walk');
      } else if (b.act === 'exit') {
        // the last page: it snaps shut, shakes, bursts into loose pages and is gone
        b.pose = 'exit'; b.vx = 0; b.vy = 0;
        if (b.first) { K.say(g, b, 'NOT RULE ONE! ANYTHING BUT RULE ONE!', '#ffd84a'); g.spawn(new RbTornPage(g, { x: b.cx, y: b.y - 10, text: RB_PAGES[2], dir: 1 })); }
        if (Math.random() < 0.4) g.burst(b.cx, b.cy, 3, PAPER, 'confetti');
        if (b.at > 2.0) b.die();
      } else b.go('walk');
    },
    draw(b, ctx, t) { rbArt(ctx, b, t); }
  }
});
// the banner when it is beaten
{
  const bd0 = Play.prototype.bossDefeated;
  Play.prototype.bossDefeated = function (b) { bd0.call(this, b); if (b && b.style === 'w22_rulebook') { this.bannerText = 'THE RULEBOOK IS CLOSED!'; this.bannerT = 2.5; } };
}

Tour.amend('w22', { stamps, levels: [L6] });

/* ---------- World 22's map: the Rulebook's stop (top right) and its trail from the Writer's Desk ---------- */
if (typeof TOUR_OW_MAPS !== 'undefined' && TOUR_OW_MAPS.w22) {
  const M = TOUR_OW_MAPS.w22;
  M.nodes = M.nodes || {}; if (!M.nodes['22-6']) M.nodes['22-6'] = [965, 205];
  M.paths = M.paths || {}; if (!M.paths['22-5>22-6']) M.paths['22-5>22-6'] = [[420, 120], [780, 110]];
  M.labels = M.labels || {}; if (!M.labels['22-6']) M.labels['22-6'] = 'Rulebook';
}

/* ================= Rule 1's effects: the party blimp, the rainbow lighthouse, the party in the ending ================= */
const TourParty = {
  COLS: ['#ff5fa0', '#ffd84a', '#3ac8d8', '#b4ff7a', '#b46aff'],
  // Piwi's Showtrunk turned party blimp: a striped envelope with fins, bunting to the trunk-gondola, a disco ball
  blimp(ctx, x, y, t, s) {
    s = s || 1;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.3) * 2); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    // the fins
    ctx.fillStyle = '#b46aff'; ctx.beginPath(); ctx.moveTo(-26, -22); ctx.lineTo(-36, -32); ctx.lineTo(-34, -20); ctx.lineTo(-36, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the envelope, striped
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -20, 28, 12, 0, 0, TAU); ctx.clip();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = this.COLS[k % 5]; ctx.fillRect(-28 + k * 8, -32, 8, 24); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -20, 28, 12, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-8, -26, 10, 3, -0.1, 0, TAU); ctx.fill();
    // PARTY! on a banner along its side
    ctx.fillStyle = '#ffffff'; rr(ctx, -15, -25, 30, 10, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6307a'; ctx.font = F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PARTY!', 0, -19.6);
    // the ropes and the gondola (the old trunk), bunting between them, the disco ball
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(-7, 2); ctx.moveTo(10, -9); ctx.lineTo(7, 2); ctx.stroke();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = this.COLS[(k + Math.floor(t * 3)) % 5]; const bx = -8 + k * 4; ctx.beginPath(); ctx.moveTo(bx - 1.6, -4); ctx.lineTo(bx + 1.6, -4); ctx.lineTo(bx, -1); ctx.fill(); }
    ctx.fillStyle = SHOWTRUNK.body; rr(ctx, -10, 2, 20, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SHOWTRUNK.strap; ctx.fillRect(-6, 2, 2, 9); ctx.fillRect(4, 2, 2, 9);
    ctx.fillStyle = PIWI.jacket; ctx.fillRect(-1.5, -2.5, 3, 4.5); ctx.fillStyle = PIWI.wood; ctx.beginPath(); ctx.arc(0, -4.5, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(0, -10); ctx.lineTo(2, -6); ctx.fill();   // his party hat
    ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.arc(0, 15, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; const a = t * 4; ctx.fillRect(Math.cos(a) * 2 - 0.7, 14, 1.4, 1.4);
    // confetti drifting down from it
    for (let k = 0; k < 6; k++) { const ph = (t * 0.6 + k / 6) % 1; ctx.fillStyle = this.COLS[k % 5]; ctx.fillRect(-20 + k * 8 + Math.sin(t * 2 + k) * 3, 10 + ph * 30, 2.4, 2.4); }
    ctx.restore();
  }
};
{
  const air0 = TourPanelFx.airship;
  TourPanelFx.airship = function (ctx, x, y, t) { if (party()) return TourParty.blimp(ctx, x, y - 2, t, 0.85); return air0.call(this, ctx, x, y, t); };
  // the Postcard Lighthouse's beam turns rainbow
  const lh0 = TourPanelFx.lighthouse;
  TourPanelFx.lighthouse = function (ctx, x, y, t, lit) {
    if (!lit || !party()) return lh0.call(this, ctx, x, y, t, lit);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.8); ctx.globalAlpha = 0.5;
    for (let k = 0; k < 5; k++) { ctx.fillStyle = TourParty.COLS[k]; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(70, -36 + k * 5.6); ctx.lineTo(70, -30.4 + k * 5.6); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    return lh0.call(this, ctx, x, y, t, false);
  };
}
// a party blimp drifts over every land's map (between the airstrip and the port, high up), and one over the world
TourHooks.on('owDraw', (ow, ctx) => {
  if (!party() || !ow.G || !ow.G.pos) return;
  const a = ow.G.pos.start, b = ow.G.pos.port; if (!a || !b) return;
  const k = 0.5 + 0.5 * Math.sin(ow.t * 0.06), x = a.x + (b.x - a.x) * k, y = Math.min(a.y, b.y) - 70 + Math.sin(ow.t * 0.4) * 8;
  TourParty.blimp(ctx, x, y, ow.t, 1.2);
});
TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (layer !== 'over' || !party() || !scene.sx) return;
  const t = scene.t || 0, lon = -30 + Math.cos(t * 0.05) * 70, lat = 25 + Math.sin(t * 0.05) * 18;
  TourParty.blimp(ctx, scene.sx(lon), scene.sy(lat), t, 1);
});
// the ending: two more cards, Piwi at the party, sulking, then dancing
{
  const EP = TourEndingScene.prototype, up0 = EP.update, dr0 = EP.draw;
  EP.update = function (dt) {
    if (this._r1 == null) {
      this._r1 = party() ? this.lines.length : -1;
      if (this._r1 >= 0) this.lines = this.lines.concat([
        'That night the whole world throws a party: hats on the llamas, dancing in the streets. Piwi gets an invitation. He sulks in the corner, arms folded.',
        '...then a toe taps. Then a knee. Then the whole dummy. Piwi Squirmin\' dances until sunrise. RULE 1: REVOKED.'
      ]);
    }
    return up0.call(this, dt);
  };
  EP.draw = function (ctx) {
    if (!(this._r1 >= 0) || this.stage < this._r1) return dr0.call(this, ctx);
    const W = Game.cssW, H = Game.cssH, st = this.stage - this._r1, t = this.t, Cc = TourCast;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const { gy, s: s0 } = storyStage(ctx, W, H, t, 'tour_himalaya');
    const s = W < H ? Math.min(s0, W / 230) : s0;
    // night falls over the party: a dark veil, strings of bulbs, a turning disco ball
    ctx.fillStyle = 'rgba(20,8,40,0.55)'; ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < 2; r++) {
      const yb = gy - (150 + r * 40) * s; ctx.strokeStyle = 'rgba(40,30,40,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yb); ctx.quadraticCurveTo(W / 2, yb + 40 * s, W, yb); ctx.stroke();
      for (let i = 0; i < 18; i++) { const k = i / 17, bx = k * W, by = (1 - k) * (1 - k) * yb + 2 * (1 - k) * k * (yb + 40 * s) + k * k * yb; ctx.fillStyle = TourParty.COLS[(i + r + Math.floor(t * 4)) % 5]; ctx.beginPath(); ctx.arc(bx, by + 4, 3.5 * s + 1, 0, TAU); ctx.fill(); }
    }
    const dx = W / 2, dy = gy - 200 * s; ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, dy - 14 * s); ctx.stroke();
    ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.arc(dx, dy, 14 * s, 0, TAU); ctx.fill();
    for (let k = 0; k < 6; k++) { const a = t * 2 + k; ctx.fillStyle = TourParty.COLS[k % 5]; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(a) * W, dy + Math.abs(Math.sin(a)) * H); ctx.lineTo(dx + Math.cos(a + 0.05) * W, dy + Math.abs(Math.sin(a + 0.05)) * H); ctx.fill(); }
    ctx.globalAlpha = 1;
    // everyone dances (a bob on the beat); Piwi sulks on his upturned jar, then dances on it
    const bx0 = W < H ? W / 2 - 40 * s : W * 0.3, beat = Math.abs(Math.sin(t * 6)) * 6 * s;
    Cc.brady(ctx, bx0, gy - beat, s, t, 'victory', 1);
    Cc.chinka(ctx, bx0 + 38 * s, gy - beat, s, t, 'wave', -1);
    Cc.pupo(ctx, bx0 - 50 * s, gy, s * 0.9, t, 'happy', 1);
    const px = W < H ? W / 2 + 70 * s : W * 0.66, py = gy - 18 * s;
    ctx.fillStyle = 'rgba(200,240,255,0.45)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; rr(ctx, px - 16 * s, py, 32 * s, 18 * s, 4); ctx.fill(); ctx.stroke();
    if (st === 0) {
      Piwi.draw(ctx, { x: px, y: py, scale: s * 0.55, t, pose: 'defeated', facing: -1, noStrings: true });
      // his own little rain cloud
      ctx.fillStyle = '#8a8a9a'; ctx.beginPath(); ctx.arc(px - 6 * s, py - 46 * s, 8 * s, 0, TAU); ctx.arc(px + 4 * s, py - 48 * s, 10 * s, 0, TAU); ctx.arc(px + 13 * s, py - 45 * s, 7 * s, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7ab0ff'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const ry = py - 38 * s + ((t * 60 + k * 9) % 26) * s; ctx.beginPath(); ctx.moveTo(px - 8 * s + k * 6 * s, ry); ctx.lineTo(px - 9 * s + k * 6 * s, ry + 4 * s); ctx.stroke(); }
    } else {
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(t * 6) * 0.18); ctx.translate(-px, -py);
      Piwi.draw(ctx, { x: px, y: py - Math.abs(Math.sin(t * 6)) * 8 * s, scale: s * 0.55, t: t * 1.6, pose: 'walk', facing: Math.sin(t * 1.5) > 0 ? 1 : -1, noStrings: true });
      ctx.restore();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(px - 4 * s, py - 44 * s); ctx.lineTo(px, py - 56 * s); ctx.lineTo(px + 4 * s, py - 44 * s); ctx.fill();
      if (Math.random() < 0.08) this.parts.burst(px, py - 30 * s, 10, TourParty.COLS[Math.floor(Math.random() * 5)], 'confetti');
    }
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    this.parts.draw(ctx);
    const bw = Math.min(W - 40, 640), bx = (W - bw) / 2, by = Math.max(20, insets.t + 14);
    ctx.font = (W < 600 ? 13 : 15) + 'px ' + FONT_UI;
    const lines = wrapText(ctx, this.lines[Math.min(this.stage, this.lines.length - 1)], bw - 40), bh = Math.max(74, 40 + lines.length * 19);
    ctx.fillStyle = 'rgba(10,6,20,0.78)'; rr(ctx, bx, by, bw, bh, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, by + 20 + i * 19));
    ctx.font = F10; ctx.fillStyle = '#ffd84a'; ctx.fillText('TAP', W / 2, by + bh - 11);
  };
}

/* ================= the REVOKED card and the HOUSE RULES page ================= */
// where each rule's button is (for the masked rows once the Lighthouse is lit)
const BUTTON_LAND = { 1: 'w22', 3: 'mx', 7: 'br', 9: 'ma', 10: 'jp', 12: 'nl' };
const TourRulesUI = {
  preDone() { let n = 0; for (const r of PRE) if (TourNeeds.ok(r)) n++; return n; },
  OPENED: { 9: '6 OLD WORMHOLES AND EXPRESS TRAILS' }
};
{
  const dr0 = TourRuleCut.draw;
  TourRuleCut.draw = function (ctx, play, F) {
    dr0.call(this, ctx, play, F);
    if (F.rule !== 1 || F.t < 1.6 || F.t > 5) return;
    const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH, k = clamp((F.t - 1.6) / 0.3, 0, 1) * clamp((5 - F.t) / 0.3, 0, 1);
    ctx.save(); ctx.globalAlpha = k;
    const w = Math.min(W - 30, 400), x0 = (W - w) / 2, y0 = Math.min(H - 64, H / 2 + 104);
    ctx.fillStyle = '#7a3ac8'; ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 2.5; rr(ctx, x0, y0, w, 34, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = F11; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('NEW IN WORLD 22: 22-6 THE RULEBOOK!', W / 2, y0 + 17, w - 20);
    ctx.restore();
  };
  // every row: revoked (where, what it opened), under glass (rule 1, seen), or masked (its land once the Lighthouse is lit)
  TourRuleCut.lines = function () {
    const T = TourProgress.data();
    return TOUR_RULE_LIST.map(n => {
      const R = TOUR_RULES[n], r = T.rules[n];
      if (R && r) {
        const L = r.at && Tour.specOf(r.at), op = TourRulesUI.OPENED[n] || TourRules.opensText(n);
        return { done: true, title: 'RULE ' + n + ': ' + R.title, sub: 'Button in ' + (L ? r.at + ' ' + L.name : '?') + (op ? ' · opened ' + op : '') };
      }
      if (n === 1 && R && T.cloche) return { done: false, glass: true, title: 'RULE 1: ' + R.title, sub: 'Under glass in 22-5: revoke the other five first (' + TourRulesUI.preDone() + ' of 5 done)' };
      const lc = Tour.countries[BUTTON_LAND[n]];
      return { done: false, title: 'RULE ?: ████████', sub: T.lighthouse && lc ? 'Its button is somewhere in ' + lc.name : '' };
    });
  };
  TourRuleCut.page = function (ctx, t, lines) {
    if (!lines || !lines.length) lines = this.lines();
    const W = Game.cssW, H = typeof Play.uiH === 'function' ? Play.uiH() : Game.cssH;
    ctx.fillStyle = 'rgba(8,4,16,0.86)'; ctx.fillRect(0, 0, W, Game.cssH);
    const cw = Math.min(W - 24, 540), ch = Math.min(H - 24, 330), x0 = (W - cw) / 2, y0 = (H - ch) / 2;
    ctx.fillStyle = '#3a2a1a'; ctx.strokeStyle = '#d8b04a'; ctx.lineWidth = 2; rr(ctx, x0, y0, cw, ch, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6ead0'; rr(ctx, x0 + 8, y0 + 8, cw - 16, ch - 16, 6); ctx.fill();
    let nDone = 0; for (const L of lines) if (L.done) nDone++;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6a3a9a'; ctx.font = F12;
    ctx.fillText('PIWI\'S HOUSE RULES · ' + nDone + ' OF ' + lines.length + ' REVOKED', W / 2, y0 + 24, cw - 30);
    ctx.font = this.TINY; ctx.fillStyle = '#5a4a3a'; ctx.fillText('Find the BRADY BUTTONS hidden backstage and slap them!', W / 2, y0 + 39, cw - 40);
    const top = y0 + 50, rh = Math.min(40, (ch - 50 - 26) / lines.length);
    for (let k = 0; k < lines.length; k++) {
      const y = top + k * rh + rh / 2, Ln = lines[k], two = !!Ln.sub;
      if (k % 2) { ctx.fillStyle = 'rgba(160,120,80,0.10)'; ctx.fillRect(x0 + 12, y - rh / 2, cw - 24, rh); }
      ctx.textAlign = 'left';
      ctx.fillStyle = Ln.done ? '#1a6a3a' : Ln.glass ? '#3a5a8a' : '#4a3a2a'; ctx.font = F11;
      ctx.fillText(Ln.title, x0 + 18, y - (two ? 6 : 0), cw * 0.62);
      if (two) { ctx.font = this.TINY; ctx.fillStyle = Ln.done ? '#5a4a3a' : '#8a7a6a'; ctx.fillText(Ln.sub, x0 + 18, y + 8, Ln.done ? cw - 112 : cw - 40); }
      if (Ln.done) {
        ctx.save(); ctx.translate(x0 + cw - 56, y); ctx.rotate(-0.15); ctx.strokeStyle = '#d0203a'; ctx.lineWidth = 2; rr(ctx, -36, -10, 72, 20, 3); ctx.stroke();
        ctx.fillStyle = '#d0203a'; ctx.font = F11; ctx.textAlign = 'center'; ctx.fillText('REVOKED', 0, 1); ctx.restore();
      } else if (Ln.glass) {
        // a little bell jar
        const gx = x0 + cw - 40; ctx.strokeStyle = '#6a8ab0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx - 8, y + 8); ctx.lineTo(gx - 8, y - 2); ctx.bezierCurveTo(gx - 8, y - 12, gx + 8, y - 12, gx + 8, y - 2); ctx.lineTo(gx + 8, y + 8); ctx.stroke();
      }
    }
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(60,40,30,0.7)'; ctx.font = F9; ctx.fillText('TAP TO CLOSE', W / 2, y0 + ch - 14);
  };
}

try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; Object.assign(window.BRADY_TOUR, { TourParty, TourRulebook: { level: L6, pieces: P, stamps } }); } } catch (e) { /* not in a browser */ }
})();
