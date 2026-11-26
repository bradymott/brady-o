/* ============================================================
   The Showtrunk: how Piwi Squirmin' travels (Nov 2026,
   docs/design/STORY_PIWI.md). A battered steamer trunk plastered
   with travel stickers, flown by two brass rotors on masts. Its lid
   stands open as a little stage: velvet curtains, footlights and a
   bulb-lit marquee that says PIWI! Under it, on a chain, hangs the
   gilded show cage where Chinka-O sits on a swing with her popcorn.
   It replaced the old villain's blimp on the title, the route
   map, the land maps and the Nepal fight. Not referenced yet.
     Showtrunk.draw(ctx, { x, y, scale, t, piwi: pose | null, chinka: true | false, party })
       origin: the middle of the trunk's base; the cage hangs below it
     Showtrunk.cage(ctx, x, y, s, t, chinka)   origin: the hook at the top of the cage
     Showtrunk.mini(ctx, x, y, t, s)          the map icon, about 44 px wide at s = 1
   ============================================================ */
const SHOWTRUNK = {
  body: '#1f5966', bodyHi: '#2f7a88', bodySh: '#143c46', brass: '#f0b83a', brassSh: '#a87418', strap: '#7a4224', strapHi: '#9a5a34',
  curtain: '#3b3fb8', curtainSh: '#262886', lining: '#ffd23a', marquee: '#d6307a', bulb: '#fff2a8', gold: '#f2c14a', goldSh: '#b07e1c',
  stickers: ['#ff9a2e', '#22c4b4', '#ff4f8a', '#7ad84a', '#ffd23a', '#ffffff', '#7a5af0'], ink: '#1c1426'
};

const Showtrunk = {
  C: SHOWTRUNK,
  rotor(ctx, x, y, w, t, k) {
    const C = SHOWTRUNK; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); ctx.ellipse(0, 0, w, w * 0.16, 0, 0, TAU); ctx.fill();
    const a = t * 38 + k;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * w, -Math.sin(a) * w * 0.16); ctx.lineTo(Math.cos(a) * w, Math.sin(a) * w * 0.16); ctx.stroke();
    ctx.strokeStyle = C.brass; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = C.brass; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 2.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // the gilded show cage; Chinka-O sits on its swing
  cage(ctx, x, y, s, t, chinka) {
    const C = SHOWTRUNK; ctx.save(); ctx.translate(x, y); if (s && s !== 1) ctx.scale(s, s);
    const sw = Math.sin(t * 1.4) * 0.05; ctx.rotate(sw);
    const W = 23, top = 14, H = 70;   // half width, dome start, base
    ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    // the back bars
    ctx.lineWidth = 1.2; ctx.strokeStyle = C.goldSh;
    for (let i = -2; i <= 2; i++) { const bx = i * W / 2.6; ctx.beginPath(); ctx.moveTo(bx * 0.9, top + 2); ctx.lineTo(bx * 0.9, H - 3); ctx.stroke(); }
    // the swing and its rider
    const swing = Math.sin(t * 1.9) * 2.2;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, top); ctx.lineTo(-9 + swing, 46); ctx.moveTo(9, top); ctx.lineTo(9 + swing, 46); ctx.stroke();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 0.8; ctx.stroke();
    if (chinka && typeof ChinkaO !== 'undefined') ChinkaO.draw(ctx, { x: swing, y: 45, scale: 0.72, t, pose: 'seated', facing: 1 });
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; rr(ctx, -12 + swing, 44.6, 24, 3, 1.5); ctx.fill(); ctx.stroke();
    // the front bars, the dome, the base
    const bar = (x0, x1, w) => { ctx.strokeStyle = C.ink; ctx.lineWidth = w + 1.4; ctx.beginPath(); ctx.moveTo(x0, top + 1); ctx.lineTo(x1, H - 2); ctx.stroke(); ctx.strokeStyle = C.gold; ctx.lineWidth = w; ctx.stroke(); };
    for (const i of [-3, -1.3, 1.3, 3]) bar(i * W / 3.4, i * W / 3.2, 1.3);
    ctx.fillStyle = 'rgba(255,214,90,0.0)'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-W, top + 6); ctx.bezierCurveTo(-W, -4, W, -4, W, top + 6); ctx.stroke();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-W, top + 6); ctx.lineTo(-W * 0.96, H - 2); ctx.moveTo(W, top + 6); ctx.lineTo(W * 0.96, H - 2); ctx.stroke();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; rr(ctx, -W - 3, H - 4, W * 2 + 6, 7, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.goldSh; ctx.fillRect(-W - 1, H + 0.6, W * 2 + 2, 1.4);
    ctx.fillStyle = C.marquee; rr(ctx, -10, H + 3, 20, 7, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.bulb; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('STAR', 0, H + 6.8);
    // the hook and the star finial
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 2, 3.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -1.6, 2.6, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
    ctx.restore();
  },
  draw(ctx, o) {
    const C = SHOWTRUNK, t = o.t || 0;
    ctx.save(); ctx.translate(o.x, o.y + Math.sin(t * 1.5) * 3); if (o.scale) ctx.scale(o.scale, o.scale);
    ctx.rotate(Math.sin(t * 1.1) * 0.025);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const W = 50, H = 40, LH = 60;
    // the cage on its chain
    if (o.chinka !== false) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke();
      ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 1.1; ctx.setLineDash([2, 1.5]); ctx.stroke(); ctx.setLineDash([]);
      Showtrunk.cage(ctx, 0, 15, 1, t, true);
    }
    // the masts and their rotors
    for (const s of [-1, 1]) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(s * (W - 4), -H + 4); ctx.lineTo(s * (W + 4), -H - LH + 2); ctx.stroke();
      ctx.strokeStyle = C.brass; ctx.lineWidth = 2.2; ctx.stroke();
    }
    // the lid, standing open behind the stage: velvet curtains, the lining, the marquee
    const ly = -H - LH;
    ctx.fillStyle = C.bodySh; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; rr(ctx, -W + 3, ly, W * 2 - 6, LH + 2, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.lining; rr(ctx, -W + 7, ly + 5, W * 2 - 14, LH - 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(214,140,20,0.55)'; for (let i = 0; i < 9; i++) { const sx = -W + 14 + (i % 5) * 18 + (i > 4 ? 9 : 0), sy = ly + 15 + (i > 4 ? 14 : 0); ctx.beginPath(); TourKit.star(ctx, sx, sy, 2.6, 1.1, 5); ctx.fill(); }
    for (const s of [-1, 1]) {
      const cx = s * (W - 7), sway = Math.sin(t * 1.3 + s) * 1.2;
      ctx.fillStyle = C.curtain; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, ly + 4); ctx.lineTo(cx - s * 20, ly + 4); ctx.quadraticCurveTo(cx - s * 12 + sway, ly + 26, cx - s * 6, ly + LH - 2); ctx.lineTo(cx, ly + LH - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.curtainSh; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - s * 8, ly + 6); ctx.quadraticCurveTo(cx - s * 6 + sway, ly + 26, cx - s * 3, ly + LH - 3); ctx.stroke();
      ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(cx - s * 10 + sway * 0.5, ly + 25, 2, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // the valance: scallops across the top
    ctx.fillStyle = C.curtain; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1;
    for (let i = 0; i < 8; i++) { const vx = -W + 7 + i * (W * 2 - 14) / 8, vw = (W * 2 - 14) / 8; ctx.beginPath(); ctx.moveTo(vx, ly + 4); ctx.lineTo(vx + vw, ly + 4); ctx.quadraticCurveTo(vx + vw / 2, ly + 13, vx, ly + 4); ctx.fill(); ctx.stroke(); }
    // the marquee, bulbs chasing round it
    const mw = 30, mh = 12, my = ly - mh + 3;
    ctx.fillStyle = C.marquee; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; rr(ctx, -mw, my, mw * 2, mh, 4); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const on = (i + Math.floor(t * 8)) % 3 !== 0, k = i / 14;
      const bx = k < 0.5 ? -mw + 3 + k * 2 * (mw * 2 - 6) : mw - 3 - (k - 0.5) * 2 * (mw * 2 - 6), by = k < 0.5 ? my + 2 : my + mh - 2;
      ctx.fillStyle = on ? C.bulb : '#a8406a'; ctx.beginPath(); ctx.arc(bx, by, 1.1, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = C.lining; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.party ? 'PARTY!' : 'PIWI!', 0, my + mh / 2 + 0.6);
    // the star of the show stands on the stage
    if (o.piwi && typeof Piwi !== 'undefined') Piwi.draw(ctx, { x: 4, y: -H + 1, scale: 0.92, t, pose: o.piwi, facing: o.piwiFacing || 1 });
    // the trunk itself
    ctx.fillStyle = C.body; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; rr(ctx, -W, -H, W * 2, H, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.bodyHi; rr(ctx, -W + 3, -H + 3, W * 2 - 6, 6, 3); ctx.fill();
    ctx.fillStyle = C.bodySh; ctx.fillRect(-W + 3, -6, W * 2 - 6, 3);
    // travel stickers from every stop
    const st = [[-38, -24, 7, 0], [-14, -30, 6, 1], [10, -20, 7.5, 2], [36, -27, 6.5, 3], [-30, -11, 5.5, 4], [24, -10, 6, 6]];
    for (const [sx, sy, r, k] of st) {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate((k - 2.5) * 0.18);
      ctx.fillStyle = C.stickers[k]; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9;
      if (k % 2) { rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, 1.5); } else { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = k === 5 ? '#ff4f8a' : 'rgba(255,255,255,0.85)';
      if (k === 0) { ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill(); }
      else if (k === 2) { ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.4); ctx.lineTo(0, -r * 0.5); ctx.lineTo(r * 0.6, r * 0.4); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); TourKit.star(ctx, 0, 0, r * 0.5, r * 0.22, 5); ctx.fill(); }
      ctx.restore();
    }
    // straps, buckles, brass corners, the lock
    for (const s of [-1, 1]) {
      ctx.fillStyle = C.strap; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.fillRect(s * 20 - 3.5, -H, 7, H); ctx.strokeRect(s * 20 - 3.5, -H, 7, H);
      ctx.fillStyle = C.brass; rr(ctx, s * 20 - 4.5, -H + 13, 9, 6, 1.5); ctx.fill(); ctx.stroke();
      for (const yy of [-H, -6]) { ctx.fillStyle = C.brass; ctx.beginPath(); ctx.moveTo(s * W, yy); ctx.lineTo(s * (W - 9), yy); ctx.lineTo(s * (W - 9), yy + 3); ctx.lineTo(s * (W - 3), yy + 3); ctx.lineTo(s * (W - 3), yy + 6); ctx.lineTo(s * W, yy + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    ctx.fillStyle = C.brass; rr(ctx, -5, -H + 1, 10, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, -H + 5, 1.4, 0, TAU); ctx.fill(); ctx.fillRect(-0.5, -H + 5, 1, 3);
    // footlights along the stage edge
    for (let i = 0; i < 7; i++) { const fx = -W + 12 + i * (W * 2 - 24) / 6; ctx.fillStyle = C.bulb; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(fx, -H, 2.2, Math.PI, TAU); ctx.fill(); ctx.stroke(); }
    // the rotors on top of the masts
    for (const s of [-1, 1]) Showtrunk.rotor(ctx, s * (W + 4), -H - LH + 1, 24, t, s);
    ctx.restore();
  },
  // the route-map and land-map icon: trunk, marquee line, two rotors, the cage with a dot of dark hair in it
  mini(ctx, x, y, t, s) {
    const C = SHOWTRUNK; s = s || 1;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.4) * 2); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 34, 14, 3, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
    // chain and cage
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 11); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.beginPath(); ctx.moveTo(-6, 15); ctx.bezierCurveTo(-6, 9, 6, 9, 6, 15); ctx.lineTo(6, 24); ctx.lineTo(-6, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHINKA_O.hair; ctx.beginPath(); ctx.arc(0, 17, 2.6, 0, TAU); ctx.fill(); ctx.fillRect(-2.6, 17, 5.2, 4);
    ctx.fillStyle = CHINKA_O.tutu; ctx.fillRect(-3.4, 20.4, 6.8, 2.6); ctx.fillStyle = CHINKA_O.skin; ctx.beginPath(); ctx.arc(0.8, 17.6, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, 15); ctx.bezierCurveTo(-6, 9, 6, 9, 6, 15); ctx.lineTo(6, 24); ctx.moveTo(-6, 15); ctx.lineTo(-6, 24); ctx.moveTo(-2, 11); ctx.lineTo(-2, 24); ctx.moveTo(2, 11); ctx.lineTo(2, 24); ctx.stroke();
    ctx.fillStyle = C.gold; rr(ctx, -7.5, 23.5, 15, 3, 1.2); ctx.fill(); ctx.stroke();
    // masts and rotors
    for (const sd of [-1, 1]) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(sd * 14, -4); ctx.lineTo(sd * 17, -19); ctx.stroke(); ctx.strokeStyle = C.brass; ctx.lineWidth = 1.2; ctx.stroke();
      const a = t * 30 + sd; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(sd * 17, -19, 9, 1.8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sd * 17 - Math.cos(a) * 9, -19); ctx.lineTo(sd * 17 + Math.cos(a) * 9, -19); ctx.stroke();
    }
    // lid with its marquee strip, then the trunk
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
    ctx.fillStyle = C.curtain; rr(ctx, -13, -17, 26, 13, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.lining; ctx.fillRect(-6, -14, 12, 10);
    ctx.fillStyle = C.marquee; rr(ctx, -9, -22, 18, 6, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.bulb; for (let i = 0; i < 4; i++) if ((i + Math.floor(t * 6)) % 2) ctx.fillRect(-6 + i * 4, -19.6, 1.6, 1.6);
    // a tiny Piwi on the stage: copper hair, magenta jacket
    ctx.fillStyle = PIWI.jacket; ctx.fillRect(-2, -9, 4.2, 5); ctx.fillStyle = PIWI.wood; ctx.beginPath(); ctx.arc(0, -11.4, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = PIWI.hair; ctx.beginPath(); ctx.arc(0, -12.6, 3, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = C.body; rr(ctx, -15, -5, 30, 12, 2.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.strap; ctx.fillRect(-9, -5, 3, 12); ctx.fillRect(6, -5, 3, 12);
    ctx.fillStyle = C.stickers[0]; ctx.beginPath(); ctx.arc(-1, 1, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = C.stickers[1]; ctx.fillRect(10.5, -2.5, 3, 3); ctx.fillStyle = C.stickers[2]; ctx.fillRect(-14, 1, 3, 2.6);
    ctx.restore();
  }
};

