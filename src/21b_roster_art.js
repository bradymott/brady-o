/* ============================================================
   Art for the burner roster, their projectiles and the baggies.
   Vector art, (x, y) = bottom-centre unless noted.
   ============================================================ */
function headCircle(ctx, x, y, r, skin) { ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function eyeDots(ctx, x, y, dir, sp, col) { ctx.fillStyle = col || '#1a1018'; ctx.beginPath(); ctx.arc(x + dir * 1.5 - sp, y, 1, 0, TAU); ctx.arc(x + dir * 1.5 + sp, y, 1, 0, TAU); ctx.fill(); }
function legs2(ctx, x, y, t, col, sp, w, h, still) { const k = still ? 0 : Math.sin(t * 10); ctx.fillStyle = col; rr(ctx, x - sp - w / 2, y - h - Math.max(0, k) * 2, w, h, w / 2); ctx.fill(); rr(ctx, x + sp - w / 2, y - h - Math.max(0, -k) * 2, w, h, w / 2); ctx.fill(); }
const SKINS = ['#e8c4a0', '#c98c62', '#a96c43', '#7c4a2c', '#f4d2bc'];

const BurnerArt = {
  draw(ctx, look, x, y, t, dir, mode, e) {
    const f = this[look];
    if (!f) return;
    ctx.save();
    if (mode === 'ko' || mode === 'flat' || mode === 'dance') { f.call(this, ctx, x, y, t, dir, mode === 'dance' ? 'walk' : mode, e || {}); ctx.restore(); return; }
    f.call(this, ctx, x, y, t, dir, mode, e || {});
    ctx.restore();
  },
  /* six-day driver: hoodie, goggles on the forehead, energy drink, arms out */
  driver(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 20);
    const lean = mode === 'lurch' ? 0.25 : 0.08;
    legs2(ctx, x, y, mode === 'lurch' ? t * 2 : t * 0.6, '#4a4a52', 3.4, 5, 8, mode === 'yawn');
    ctx.translate(x, y - 8); ctx.rotate(lean * dir);
    ctx.fillStyle = '#7a6a8a'; rr(ctx, -7, -14, 14, 15, 4); ctx.fill();
    ctx.fillStyle = 'rgba(220,200,170,0.35)'; ctx.fillRect(-7, -4, 14, 4);
    // arms forward, zombie style
    ctx.strokeStyle = '#7a6a8a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    const reach = mode === 'lurch' ? 12 : 9;
    ctx.beginPath(); ctx.moveTo(dir * 2, -11); ctx.lineTo(dir * reach, -10 + Math.sin(t * 3) * 1.5); ctx.moveTo(-dir * 1, -10); ctx.lineTo(dir * (reach - 3), -8); ctx.stroke();
    ctx.fillStyle = '#5ac8ff'; ctx.fillRect(dir * reach - 1.5, -13 + Math.sin(t * 3) * 1.5, 3, 5); // energy drink
    const sk = SKINS[(e.seed || 0) % 5];
    headCircle(ctx, dir * 1.5, -19, 6, sk);
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(dir * 1.5, -21, 6.3, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#c8a03a'; rr(ctx, -5 + dir * 1.5, -26, 11, 4, 2); ctx.fill(); ctx.fillStyle = '#3ac8c8'; ctx.beginPath(); ctx.arc(-2 + dir * 1.5, -24, 1.6, 0, TAU); ctx.arc(4 + dir * 1.5, -24, 1.6, 0, TAU); ctx.fill();
    // droopy eyes with bags
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(dir * 3 - 3, -19); ctx.lineTo(dir * 3 - 1, -19); ctx.moveTo(dir * 3 + 1, -19); ctx.lineTo(dir * 3 + 3, -19); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,120,0.6)'; ctx.beginPath(); ctx.arc(dir * 3 - 2, -17.6, 1.2, 0, Math.PI); ctx.arc(dir * 3 + 2, -17.6, 1.2, 0, Math.PI); ctx.stroke();
    if (mode === 'yawn') { ctx.fillStyle = '#3a1010'; ctx.beginPath(); ctx.ellipse(dir * 3, -15, 2, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.fillText('z', dir * 10, -28 - (t * 6) % 6); }
    else { ctx.strokeStyle = '#5a2a1a'; ctx.beginPath(); ctx.moveTo(dir * 2, -15); ctx.lineTo(dir * 5, -15.4); ctx.stroke(); }
  },
  /* half-dressed raver: fluffy leg warmers, harness, LED gloves, a furry hat with ears */
  raver(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 20);
    const hue = ((e.seed || 0) * 47) % 360;
    const fluff = `hsl(${hue},90%,65%)`;
    for (const s of [-1, 1]) { ctx.fillStyle = fluff; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + s * 4 + Math.sin(i * 2 + t * 4) * 1, y - 2 - i * 2.4, 3.6, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = '#e8c4a0'; ctx.fillRect(x - 6, y - 14, 4, 4); ctx.fillRect(x + 2, y - 14, 4, 4);
    ctx.fillStyle = '#1a1018'; rr(ctx, x - 7, y - 16, 14, 5, 2); ctx.fill(); // shorts
    ctx.fillStyle = '#e8c4a0'; rr(ctx, x - 6, y - 26, 12, 11, 4); ctx.fill(); // torso
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 5, y - 25); ctx.lineTo(x + 5, y - 17); ctx.moveTo(x + 5, y - 25); ctx.lineTo(x - 5, y - 17); ctx.stroke(); // harness
    const arm = Math.sin(t * 8) * 6;
    ctx.strokeStyle = '#e8c4a0'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 5, y - 24); ctx.lineTo(x - 10, y - 32 + arm); ctx.moveTo(x + 5, y - 24); ctx.lineTo(x + 10, y - 32 - arm); ctx.stroke();
    for (const [gx, gy] of [[x - 10, y - 32 + arm], [x + 10, y - 32 - arm]]) { ctx.fillStyle = GLOW_COLS[Math.floor(t * 6 + gx) % 5]; ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, TAU); ctx.fill(); }
    headCircle(ctx, x + dir, y - 31, 5.6, '#e8c4a0');
    ctx.fillStyle = fluff; ctx.beginPath(); ctx.arc(x + dir, y - 33, 6.4, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 36); ctx.lineTo(x - 7, y - 43); ctx.lineTo(x - 2, y - 38); ctx.moveTo(x + 5, y - 36); ctx.lineTo(x + 7, y - 43); ctx.lineTo(x + 2, y - 38); ctx.fill();
    ctx.fillStyle = '#16131a'; rr(ctx, x + dir * 1 - 4.5, y - 32.5, 9, 2.6, 1.3); ctx.fill();
    if (Math.sin(t * 11) > 0.5) { ctx.fillStyle = '#fff'; ctx.fillRect(x + Math.sin(t * 17) * 9, y - 20 + Math.cos(t * 13) * 8, 1.4, 1.4); }
  },
  /* stressed camp lead: many-pocket vest, clipboard, headset */
  camplead(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 22);
    const lean = mode === 'charge' ? 0.3 : 0;
    legs2(ctx, x, y, mode === 'charge' ? t * 2 : t, '#5a5a3a', 3.4, 5, 8, mode === 'yell' || mode === 'notice');
    ctx.translate(x, y - 8); ctx.rotate(lean * dir);
    ctx.fillStyle = '#e8e0c8'; rr(ctx, -7, -15, 14, 16, 4); ctx.fill();
    ctx.fillStyle = '#a8946a'; rr(ctx, -7, -15, 5, 16, 2); ctx.fill(); rr(ctx, 2, -15, 5, 16, 2); ctx.fill();
    ctx.fillStyle = '#8a7650'; for (const [px, py] of [[-6, -10], [3, -10], [-6, -5], [3, -5]]) ctx.fillRect(px, py, 3, 3);
    // clipboard
    ctx.save(); ctx.translate(dir * 9, -10); ctx.rotate(mode === 'yell' ? -0.5 * dir : 0.2 * dir);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-4, -6, 8, 11); ctx.fillStyle = '#f4f4f0'; ctx.fillRect(-3, -4, 6, 8); ctx.fillStyle = '#c8c8d0'; ctx.fillRect(-2, -7, 4, 2);
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 0.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-2, -2 + i * 2); ctx.lineTo(2, -2 + i * 2); ctx.stroke(); }
    ctx.restore();
    const sk = SKINS[(e.seed || 1) % 5];
    headCircle(ctx, dir * 1, -21, 6, sk);
    ctx.fillStyle = '#c83a3a'; ctx.beginPath(); ctx.arc(dir * 1, -23, 6.2, Math.PI, TAU); ctx.fill(); ctx.fillRect(dir * 1 + (dir > 0 ? 3 : -9), -24, 6, 2); // cap
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-dir * 4, -21, 5, -1.2, 1.2); ctx.stroke(); ctx.fillStyle = '#1a1018'; ctx.fillRect(-dir * 4 - 1, -18, 2, 3); // headset
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(dir * 1, -25); ctx.lineTo(dir * 4, -23.6); ctx.moveTo(dir * 6, -25); ctx.lineTo(dir * 3.5, -23.6); ctx.stroke(); // furrowed brows
    eyeDots(ctx, dir * 2, -21.5, dir, 1.6);
    if (mode === 'yell') { ctx.fillStyle = '#3a1010'; ctx.beginPath(); ctx.ellipse(dir * 3, -17.4, 2.6, 2.2, 0, 0, TAU); ctx.fill(); }
    else { ctx.strokeStyle = '#5a2a1a'; ctx.beginPath(); ctx.moveTo(dir * 1.5, -17); ctx.quadraticCurveTo(dir * 3.5, -18.5, dir * 5.5, -17); ctx.stroke(); }
    if (mode === 'notice') { ctx.fillStyle = '#ffd84a'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', dir * 2, -32); }
  },
  /* greeter: flower lei, big grin, arms wide */
  greeter(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 22);
    legs2(ctx, x, y, t, '#3a5a8a', 3.6, 5.4, 8, mode === 'hug' || mode === 'dizzy');
    ctx.fillStyle = '#ffd8a0'; rr(ctx, x - 8, y - 23, 16, 16, 5); ctx.fill(); // hawaiian shirt
    ctx.fillStyle = '#ff7a5a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 5 + (i * 7) % 12, y - 20 + (i * 5) % 12, 1.8, 0, TAU); ctx.fill(); }
    const open = mode === 'hug' ? 0.4 : 1 + Math.sin(t * 4) * 0.15;
    ctx.strokeStyle = '#c98c62'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 7, y - 20); ctx.lineTo(x - 7 - 8 * open, y - 27 + (1 - open) * 8); ctx.moveTo(x + 7, y - 20); ctx.lineTo(x + 7 + 8 * open, y - 27 + (1 - open) * 8); ctx.stroke();
    headCircle(ctx, x + dir, y - 29, 6.4, '#c98c62');
    for (let i = 0; i < 7; i++) { const a = Math.PI * 0.15 + i / 6 * Math.PI * 0.7; ctx.fillStyle = ['#ff5a9a', '#ffd84a', '#ff9a3a'][i % 3]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 8, y - 24 + Math.sin(a) * 3, 2, 0, TAU); ctx.fill(); } // lei
    ctx.fillStyle = '#e8d0a0'; ctx.beginPath(); ctx.ellipse(x + dir, y - 34, 9, 2.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + dir, y - 35, 5, Math.PI, TAU); ctx.fill(); // straw hat
    if (mode === 'dizzy') { ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 9, y - 40 + Math.sin(a) * 3, 1.6, 0, TAU); ctx.fill(); } }
    eyeDots(ctx, x + dir * 2, y - 30, dir, 2);
    ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(x + dir * 2, y - 28, 3.4, 0.2, Math.PI - 0.2); ctx.stroke();
  },
  /* fire spinner: tank top, dreads, goggles */
  spinner(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 20);
    legs2(ctx, x, y, t, '#2a2a34', 3.2, 5, 8);
    ctx.fillStyle = '#c84a2a'; rr(ctx, x - 6, y - 22, 12, 15, 4); ctx.fill();
    ctx.fillStyle = '#ffb84a'; ctx.fillRect(x - 6, y - 16, 12, 2);
    ctx.strokeStyle = '#a96c43'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 5, y - 20); ctx.lineTo(x - 2, y - 24); ctx.moveTo(x + 5, y - 20); ctx.lineTo(x + 2, y - 24); ctx.stroke();
    headCircle(ctx, x + dir, y - 27, 5.6, '#a96c43');
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 4 + i * 2, y - 31); ctx.quadraticCurveTo(x - 6 + i * 2.6 - dir * 3, y - 26, x - 7 + i * 3 - dir * 2, y - 20 + Math.sin(t * 5 + i) * 1.5); ctx.stroke(); }
    ctx.fillStyle = '#16131a'; rr(ctx, x + dir * 1 - 4.5, y - 28.5, 9, 2.6, 1.3); ctx.fill();
  },
  /* influencer: crop top, giant shades, phone on a selfie stick, ring light beside */
  influencer(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 22);
    // the ring light on its stand
    const rlx = x - dir * 14;
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(rlx, y); ctx.lineTo(rlx, y - 26); ctx.moveTo(rlx - 5, y); ctx.lineTo(rlx, y - 6); ctx.lineTo(rlx + 5, y); ctx.stroke();
    const glow = mode === 'charge' ? 0.6 + 0.4 * Math.sin(t * 30) : 0.35;
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = mode === 'charge' ? 14 : 4; ctx.strokeStyle = `rgba(255,255,240,${0.6 + glow * 0.4})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(rlx, y - 31, 6.5, 0, TAU); ctx.stroke(); ctx.restore();
    legs2(ctx, x, y, t, '#e8c4a0', 3, 4, 9, true);
    ctx.fillStyle = '#ff9ad8'; rr(ctx, x - 6, y - 12, 12, 5, 2); ctx.fill();
    ctx.fillStyle = '#e8c4a0'; rr(ctx, x - 5, y - 19, 10, 8, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 6, y - 24, 12, 6, 3); ctx.fill(); // crop top
    // selfie stick + phone
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + dir * 4, y - 20); ctx.lineTo(x + dir * 14, y - 34); ctx.stroke();
    ctx.fillStyle = '#16131a'; rr(ctx, x + dir * 14 - 3, y - 39, 6, 9, 1.2); ctx.fill();
    if (mode === 'charge') { ctx.fillStyle = `rgba(255,255,255,${glow})`; ctx.beginPath(); ctx.arc(x + dir * 14, y - 37, 3, 0, TAU); ctx.fill(); }
    headCircle(ctx, x + dir, y - 29, 5.8, '#e8c4a0');
    ctx.fillStyle = '#f2d06a'; ctx.beginPath(); ctx.arc(x + dir * 0.5, y - 31, 6.4, Math.PI * 0.9, TAU * 1.05); ctx.fill(); ctx.fillRect(x - dir * 6 - 2, y - 31, 4, 9);
    ctx.fillStyle = '#16131a'; rr(ctx, x + dir * 1 - 6, y - 31, 12, 4, 2); ctx.fill(); // huge shades
    ctx.fillStyle = '#ff4a8a'; ctx.beginPath(); ctx.ellipse(x + dir * 2.5, y - 25.5, 2, 1.1, 0, 0, TAU); ctx.fill(); // duck lips
  },
  /* tech bro on an electric unicycle (the bro himself comes from the original tech bro art) */
  techbro(ctx, x, y, t, dir, mode, e) {
    if (mode === 'flat') { Sprites.rollo(ctx, x, y, t, '#38f2ff', dir, false, 0); return; }
    const spin = t * (mode === 'rush' ? 18 : 6) * dir;
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x, y - 7, 7, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y - 7); ctx.rotate(spin); ctx.strokeStyle = '#38f2ff'; ctx.lineWidth = 1.4; ctx.shadowColor = '#38f2ff'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU * 0.7); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#c8ccd8'; rr(ctx, x - 7, y - 10, 14, 3, 1.5); ctx.fill();
    ctx.save(); ctx.translate(x, y - 10); if (mode === 'rush') ctx.rotate(dir * 0.25);
    Sprites.rollo(ctx, 0, 0, mode === 'ride' || mode === 'rush' ? 0 : t, '#38f2ff', dir, false, 0);
    ctx.restore();
    if (mode === 'rush') { ctx.strokeStyle = 'rgba(56,242,255,0.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - dir * (12 + i * 4), y - 6 - i * 7); ctx.lineTo(x - dir * (24 + i * 6), y - 6 - i * 7); ctx.stroke(); } }
  },
  /* crusty old burner: dusty duster, wide hat, long grey beard, goggles round the neck */
  crusty(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 22);
    legs2(ctx, x, y, t * 0.7, '#4a3a2a', 3.4, 5, 7, mode === 'rant');
    ctx.fillStyle = '#9a7a54'; ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x - 7, y - 23); ctx.lineTo(x + 7, y - 23); ctx.lineTo(x + 9, y - 4); ctx.closePath(); ctx.fill(); // duster coat
    ctx.fillStyle = 'rgba(230,210,180,0.4)'; ctx.fillRect(x - 9, y - 9, 18, 4);
    // cane / finger wag
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x + dir * 9, y); ctx.lineTo(x + dir * 9, y - 16); ctx.stroke();
    if (mode === 'rant') { ctx.strokeStyle = '#d8a882'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + dir * 5, y - 20); ctx.lineTo(x + dir * 12, y - 28 + Math.sin(t * 20) * 2); ctx.stroke(); }
    headCircle(ctx, x + dir, y - 27, 5.8, '#d8a882');
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.moveTo(x + dir * 1 - 5, y - 26); ctx.quadraticCurveTo(x + dir * 3, y - 10, x + dir * 1 + 5, y - 26); ctx.fill(); // long grey beard
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(x + dir, y - 32, 11, 2.6, 0, 0, TAU); ctx.fill(); rr(ctx, x + dir - 6, y - 38, 12, 6, 3); ctx.fill(); // hat
    ctx.fillStyle = '#c8a03a'; rr(ctx, x - 5, y - 23, 10, 3, 1.5); ctx.fill(); // goggles at the neck
    eyeDots(ctx, x + dir * 2, y - 28.5, dir, 1.8);
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + dir * 2 - 3, y - 31); ctx.lineTo(x + dir * 2 - 0.5, y - 30); ctx.moveTo(x + dir * 2 + 3, y - 31); ctx.lineTo(x + dir * 2 + 0.5, y - 30); ctx.stroke();
  },
  /* DPW worker: dusty coveralls, hard hat (knock it off first), rebar in hand */
  dpw(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 24);
    legs2(ctx, x, y, t, '#6a3a1a', 4, 6, 7, mode === 'windup' || mode === 'swing');
    ctx.fillStyle = '#c8701e'; rr(ctx, x - 9, y - 19, 18, 13, 4); ctx.fill();
    ctx.fillStyle = 'rgba(230,210,170,0.35)'; ctx.fillRect(x - 9, y - 11, 18, 4);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x - 9, y - 15, 18, 1.4);
    // rebar: raised in windup, swung in the swing
    const ang = mode === 'windup' ? -2.2 : mode === 'swing' ? 0.2 : -0.6;
    ctx.save(); ctx.translate(x + dir * 8, y - 14); ctx.rotate(dir * (ang + Math.PI / 2) - Math.PI / 2 + (dir < 0 ? Math.PI : 0));
    ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,10,0.6)'; ctx.lineWidth = 0.7; for (let k = 3; k < 18; k += 3) { ctx.beginPath(); ctx.moveTo(k, -1.2); ctx.lineTo(k + 1, 1.2); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#d8a882'; ctx.beginPath(); ctx.arc(x + dir * 8, y - 14, 2.4, 0, TAU); ctx.fill();
    const hy = y - 23;
    headCircle(ctx, x, hy, 6, mode === 'angry' ? '#e88a6a' : '#d8a882');
    ctx.fillStyle = '#1a1018'; ctx.fillRect(x - 4 + dir, hy - 1.5, 2.2, 1.4); ctx.fillRect(x + 1.5 + dir, hy - 1.5, 2.2, 1.4);
    ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(x + dir, hy + 3.2, 4.4, 2, 0, 0, TAU); ctx.fill(); // mustache
    if (e.hat !== false) { ctx.fillStyle = '#f2c23a'; ctx.beginPath(); ctx.ellipse(x, hy - 4, 8, 5, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 9, hy - 4.6, 18, 2); ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(x - 3, hy - 7, 1.4, 0, TAU); ctx.fill(); }
    else { ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 5 + dir, hy - 5); ctx.lineTo(x - 1 + dir, hy - 3); ctx.moveTo(x + 5 + dir, hy - 5); ctx.lineTo(x + 1 + dir, hy - 3); ctx.stroke(); ctx.fillStyle = '#ff6a3a'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('#!', x, hy - 12 - Math.abs(Math.sin(t * 6)) * 2); }
  },
  /* LED jellyfish */
  ledjelly(ctx, x, y, t, dir, mode, e) {
    const col = e.col || '#38f2ff', r = mode === 'pad' || mode === 'flash' && e.comp !== undefined ? 15 : 13;
    const top = y - (mode === 'pad' || e.comp !== undefined ? 22 : 26);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, top + 6, 2, x, top + 6, 34); g.addColorStop(0, rgba(col, mode === 'flash' ? 0.6 : 0.3)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 34, top - 28, 68, 68); ctx.restore();
    ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { const tx = x - r * 0.75 + i * r * 0.38; ctx.beginPath(); ctx.moveTo(tx, top + 6); ctx.quadraticCurveTo(tx + Math.sin(t * 3 + i) * 4, top + 16, tx + Math.sin(t * 2 + i) * 3, top + (mode === 'pad' ? 24 : 30)); ctx.stroke(); }
    const sq = (e.comp || 0) * 3;
    const bg = ctx.createLinearGradient(0, top - r, 0, top + 6); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.4, col); bg.addColorStop(1, rgba(col, 0.6));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(x, top + 6 + sq * 0.3, r + sq, r - sq, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, top - r * 0.35, r * 0.25, r * 0.15, -0.5, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = GLOW_COLS[(i + Math.floor(t * 4)) % 5]; ctx.beginPath(); ctx.arc(x - r + 2 + i * (2 * r - 4) / 5, top + 5, 1.3, 0, TAU); ctx.fill(); }
  },
  /* dust devil: a whirl of playa dust with a cheeky face */
  devil(ctx, x, y, t, dir, mode, e) {
    const H = mode === 'tall' ? (e.h || 7 * TS) : 56;
    const n = mode === 'tall' ? 16 : 10;
    for (let i = 0; i < n; i++) {
      const k = i / n, w = (mode === 'tall' ? 10 : 6) + k * (mode === 'tall' ? 26 : 14), yy = y - k * H;
      ctx.fillStyle = `rgba(${220 - k * 30},${200 - k * 30},${170 - k * 20},${0.22 + 0.2 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 6 + i * 0.8) * 4 * k, yy, w, 4 + k * 2, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#7a5a3a'; for (let i = 0; i < 4; i++) { const a = t * 7 + i * 1.6; ctx.fillRect(x + Math.cos(a) * 14, y - H * 0.5 + Math.sin(a * 1.3) * H * 0.3, 2, 2); }
    if (mode !== 'tall') { ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(x - 4 + dir * 2, y - 34, 1.6, 0, TAU); ctx.arc(x + 4 + dir * 2, y - 34, 1.6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + dir * 2, y - 31, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
  },
  /* bike thief: hoodie, bandana mask, a sack of loot on a stolen cruiser */
  thief(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 28);
    const spin = t * 10 * dir;
    for (const wx of [x - 10, x + 10]) { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, y - 6, 6, 0, TAU); ctx.stroke(); ctx.save(); ctx.translate(wx, y - 6); ctx.rotate(spin); ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = '#ff7a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y - 6); ctx.lineTo(x - 2, y - 14); ctx.lineTo(x + 10, y - 6); ctx.moveTo(x - 2, y - 14); ctx.lineTo(x + 6, y - 15); ctx.lineTo(x + dir * 8, y - 20); ctx.stroke();
    ctx.fillStyle = '#3a3a4a'; rr(ctx, x - 7, y - 28, 12, 13, 4); ctx.fill();
    if (e.loot) { ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.arc(x - dir * 9, y - 24, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('$', x - dir * 9, y - 22); }
    headCircle(ctx, x + dir * 1, y - 32, 5.4, '#c98c62');
    ctx.fillStyle = '#3a3a4a'; ctx.beginPath(); ctx.arc(x + dir * 1, y - 33, 6, Math.PI * 0.9, TAU * 1.08); ctx.fill(); // hood
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x - 4 + dir, y - 31, 8.5, 3.5); // bandana
    eyeDots(ctx, x + dir * 2, y - 33, dir, 1.5);
  },
  /* slam poet: beret, black turtleneck, notebook, snapping */
  poet(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 20);
    legs2(ctx, x, y, t, '#16131a', 3, 4.6, 9, true);
    ctx.fillStyle = '#16131a'; rr(ctx, x - 6, y - 24, 12, 16, 4); ctx.fill();
    ctx.strokeStyle = '#16131a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    if (mode === 'recite') { ctx.beginPath(); ctx.moveTo(x + dir * 4, y - 21); ctx.lineTo(x + dir * 12, y - 32); ctx.stroke(); }
    else { const s = Math.sin(t * 9) > 0; ctx.beginPath(); ctx.moveTo(x + dir * 4, y - 21); ctx.lineTo(x + dir * 10, y - 26); ctx.stroke(); if (s) { ctx.fillStyle = '#ffd84a'; ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('snap', x + dir * 14, y - 30); } }
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(x - dir * 9 - 3, y - 20, 6, 8); // notebook
    headCircle(ctx, x + dir, y - 29, 5.8, SKINS[(e.seed || 2) % 5]);
    ctx.fillStyle = '#16131a'; ctx.beginPath(); ctx.ellipse(x + dir * 0.5 - dir * 1, y - 34.5, 7, 3, -0.2 * dir, 0, TAU); ctx.fill(); ctx.fillRect(x - 1, y - 38, 2, 2); // beret
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + dir * 1, y - 29.5); ctx.lineTo(x + dir * 3.5, y - 29.5); ctx.moveTo(x + dir * 4.5, y - 29.5); ctx.lineTo(x + dir * 6.5, y - 29.5); ctx.stroke(); // eyes closed, feeling it
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(x + dir * 3, y - 24.5, 2.5, 1.4, 0, 0, TAU); ctx.fill(); // goatee
  },
  /* World 22: a walking letter */
  glyph(ctx, x, y, t, dir, mode, e) {
    legs2(ctx, x, y, t, '#1a1a2a', 3, 2.4, 7, mode === 'flat');
    ctx.fillStyle = '#1a1a2a'; ctx.font = `30px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(e.letter || 'A', x, y - 6);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3 + dir, y - 20, 2.4, 0, TAU); ctx.arc(x + 4 + dir, y - 20, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.arc(x - 3 + dir * 2, y - 20, 1.1, 0, TAU); ctx.arc(x + 4 + dir * 2, y - 20, 1.1, 0, TAU); ctx.fill();
  },
  inkblot(ctx, x, y, t, dir, mode, e) {
    const s = e.small ? 0.65 : 1;
    ctx.fillStyle = '#12121e';
    ctx.beginPath(); ctx.ellipse(x, y - 9 * s, 13 * s + Math.sin(t * 6) * 1, 9 * s, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 10 * s + i * 7 * s, y - 2 * s, 3 * s, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x - dir * 10 * s, y - 15 * s, 3 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3 * s + dir * 2, y - 12 * s, 2.4 * s, 0, TAU); ctx.arc(x + 4 * s + dir * 2, y - 12 * s, 2.4 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#12121e'; ctx.beginPath(); ctx.arc(x - 3 * s + dir * 3, y - 12 * s, 1.1 * s, 0, TAU); ctx.arc(x + 4 * s + dir * 3, y - 12 * s, 1.1 * s, 0, TAU); ctx.fill();
  },
  /* gift-giving burners */
  gifter(ctx, x, y, t, dir, mode, e) {
    softShadow(ctx, x, y, 22);
    const look = e.lookName || 'kandi';
    const pal = { kandi: ['#ff7ad8', '#7affd8'], greeter: ['#ffd8a0', '#ff5a9a'], lamplighter: ['#8a3aa8', '#ffc860'], mechanic: ['#3a6aa8', '#c8c8d0'], waterbearer: ['#5ad0ff', '#e8f8ff'] }[look] || ['#ff7ad8', '#7affd8'];
    legs2(ctx, x, y, 0, '#3a3a4a', 3.2, 5, 8, true);
    ctx.fillStyle = pal[0]; rr(ctx, x - 7, y - 23, 14, 16, 5); ctx.fill();
    if (look === 'kandi') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.strokeStyle = GLOW_COLS[i + 1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + s * 8, y - 14 - i * 2.4, 3, 1.4, 0, 0, TAU); ctx.stroke(); }
    const wave = mode === 'wave' ? Math.sin(t * 10) * 0.6 : 0;
    ctx.strokeStyle = SKINS[3]; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 6, y - 20); ctx.lineTo(x + 12, y - (mode === 'wave' ? 30 + wave * 4 : 18)); ctx.stroke();
    if (mode === 'offer') { // holding a gift box out
      ctx.fillStyle = pal[1]; ctx.fillRect(x + 9, y - 22, 9, 8); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 12.5, y - 22, 2, 8); ctx.fillRect(x + 9, y - 19, 9, 2);
      ctx.fillStyle = '#fff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('GIFT!', x, y - 44 + Math.sin(t * 4) * 2);
    }
    if (look === 'lamplighter') { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 9, y - 40); ctx.stroke(); ctx.fillStyle = '#ffc860'; ctx.beginPath(); ctx.arc(x - 9, y - 42, 4, 0, TAU); ctx.fill(); }
    if (look === 'mechanic') { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 12, y - 20, 3, 10); }
    if (look === 'waterbearer') { ctx.fillStyle = 'rgba(120,210,255,0.85)'; rr(ctx, x - 16, y - 22, 8, 12, 2); ctx.fill(); }
    headCircle(ctx, x + dir, y - 28, 6, SKINS[(Math.floor(x / 97)) % 5]);
    ctx.fillStyle = look === 'kandi' ? '#ff5ab8' : '#5a3a2a'; ctx.beginPath(); ctx.arc(x + dir, y - 30, 6.4, Math.PI, TAU); ctx.fill();
    if (look === 'kandi') { ctx.beginPath(); ctx.arc(x - 6, y - 32, 3, 0, TAU); ctx.arc(x + 6, y - 32, 3, 0, TAU); ctx.fill(); }
    eyeDots(ctx, x + dir * 2, y - 28.5, dir, 2);
    ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + dir * 2, y - 26.5, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
  }
};
// the old flying kind is always a pagan witch now
function enemyLook(kind) {
  if (kind === 'flapper') return 'witch';
  if (kind === 'boomer') return 'dome';
  return kind;
}

/* ---------- projectiles ---------- */
const ShotArt = {
  draw(ctx, s, t) {
    const f = this[s.kind] || this.spark;
    ctx.save(); f.call(this, ctx, s, t); ctx.restore();
  },
  textBubble(ctx, s, fill, ink, tail) {
    ctx.font = `${s.kind === 'textline' ? 10 : 8}px ${FONT_DISPLAY}`;
    const w = Math.max(s.w, ctx.measureText(s.text).width + 10);
    ctx.fillStyle = fill; rr(ctx, s.cx - w / 2, s.y, w, s.h, s.h / 2); ctx.fill();
    if (tail) { ctx.beginPath(); ctx.moveTo(s.cx - s.dir * w * 0.3, s.y + s.h - 1); ctx.lineTo(s.cx - s.dir * w * 0.42, s.y + s.h + 5); ctx.lineTo(s.cx - s.dir * w * 0.18, s.y + s.h - 1); ctx.fill(); }
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.text, s.cx, s.cy + 0.5);
  },
  verse(ctx, s) { ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(s.text, s.cx + 1, s.cy + 1); ctx.fillStyle = '#ffd84a'; ctx.fillText(s.text, s.cx, s.cy); },
  rant(ctx, s) { this.textBubble(ctx, s, 'rgba(232,208,160,0.92)', '#4a3020', true); },
  rantup(ctx, s) { this.textBubble(ctx, s, 'rgba(255,248,230,0.95)', '#6a4a2a', true); ctx.strokeStyle = 'rgba(120,90,60,0.6)'; ctx.lineWidth = 1; ctx.stroke(); },
  pitch(ctx, s, t) {
    ctx.strokeStyle = 'rgba(56,242,255,0.9)'; ctx.fillStyle = 'rgba(56,242,255,0.18)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(s.cx, s.cy, s.w / 2 + 4, s.h / 2 + 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(s.cx - s.w * 0.25, s.cy - s.h * 0.25, 4, 2, -0.5, 0, TAU); ctx.fill();
    ctx.font = `6px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const words = s.text.split(' '); words.forEach((wd, i) => ctx.fillText(wd, s.cx, s.cy + (i - (words.length - 1) / 2) * 7));
  },
  textline(ctx, s) { this.textBubble(ctx, s, 'rgba(255,250,240,0.95)', '#1a1a2a', false); ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1.2; ctx.stroke(); },
  wrench(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(t * 14 * s.dir); ctx.fillStyle = '#9a9aa6'; ctx.fillRect(-7, -1.6, 14, 3.2); ctx.beginPath(); ctx.arc(-7, 0, 3.4, 0, TAU); ctx.arc(7, 0, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a4a56'; ctx.fillRect(-8.5, -1, 3, 2); ctx.fillRect(5.5, -1, 3, 2); },
  clipboard(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(t * 10 * s.dir); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-6, -8, 12, 16); ctx.fillStyle = '#f4f4f0'; ctx.fillRect(-4.5, -5.5, 9, 12); },
  crystal(ctx, s) { ctx.fillStyle = s.col || '#7affd8'; ctx.beginPath(); ctx.moveTo(s.cx, s.y + s.h); ctx.lineTo(s.cx - s.w / 2, s.y + 4); ctx.lineTo(s.cx, s.y); ctx.lineTo(s.cx + s.w / 2, s.y + 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(s.cx, s.y + 2); ctx.lineTo(s.cx - 2, s.y + 6); ctx.lineTo(s.cx, s.y + s.h - 4); ctx.fill(); },
  wave(ctx, s, t, col) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(col, 0.85 - i * 0.25); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(s.cx - s.dir * i * 5, s.y + s.h, 6 - i, s.h - i * 3, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  },
  yell(ctx, s, t) { this.wave(ctx, s, t, '#ffd84a'); },
  bellwave(ctx, s, t) { this.wave(ctx, s, t, '#ffe08a'); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('DING', s.cx, s.y - 2); },
  bass(ctx, s, t) { this.wave(ctx, s, t, s.col || '#ff4fd8'); },
  espresso(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); ctx.fillStyle = '#f4f0e4'; rr(ctx, -6, -6, 12, 12, 2); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-5, -5, 10, 3); ctx.strokeStyle = '#f4f0e4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(7, 0, 3, -1.2, 1.2); ctx.stroke(); },
  mud(ctx, s) { ctx.fillStyle = '#7a5232'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 7, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.beginPath(); ctx.arc(s.cx - 2, s.cy - 2, 2.4, 0, TAU); ctx.fill(); },
  steam(ctx, s, t) { ctx.fillStyle = `rgba(245,245,255,${0.5 * Math.min(1, s.life * 2)})`; ctx.beginPath(); ctx.arc(s.cx, s.cy, 9 + (0.8 - s.life) * 10, 0, TAU); ctx.fill(); },
  foam(ctx, s) { ctx.fillStyle = 'rgba(250,244,230,0.92)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(s.x + 5 + i * (s.w - 10) / 4, s.y + s.h - 4 - (i % 2) * 3, 6, 0, TAU); ctx.fill(); } },
  firework(ctx, s, t) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 3.6, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,160,60,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.cx, s.cy); ctx.lineTo(s.cx - s.vx * 0.04, s.cy - s.vy * 0.04); ctx.stroke(); },
  neonball(ctx, s) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(s.cx, s.cy, 1, s.cx, s.cy, 10); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, s.col); g.addColorStop(1, rgba(s.col, 0)); ctx.fillStyle = g; ctx.fillRect(s.cx - 10, s.cy - 10, 20, 20); },
  plank(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(t * 3); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-16, -5, 32, 10); ctx.fillStyle = 'rgba(40,20,10,0.4)'; ctx.fillRect(-16, -1, 32, 1); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,${140 + i * 30},40,0.7)`; ctx.beginPath(); ctx.arc(-10 + i * 10, -6 - Math.abs(Math.sin(t * 9 + i)) * 5, 4, 0, TAU); ctx.fill(); } },
  flame(ctx, s, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const w = 12 - i * 2, fl = Math.sin(t * 30 + i) * 3; const g = ctx.createLinearGradient(0, s.y + s.h, 0, s.y - 8); g.addColorStop(0, 'rgba(255,250,200,0.9)'); g.addColorStop(0.4, 'rgba(255,150,40,0.75)'); g.addColorStop(1, 'rgba(255,50,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s.cx - w, s.y + s.h); ctx.quadraticCurveTo(s.cx - w + fl, s.y + s.h / 2, s.cx + fl, s.y - 6 - i * 4); ctx.quadraticCurveTo(s.cx + w - fl, s.y + s.h / 2, s.cx + w, s.y + s.h); ctx.fill(); }
  },
  luggage(ctx, s) { ctx.fillStyle = '#8a3a4a'; rr(ctx, s.x, s.y + 3, s.w, s.h - 3, 3); ctx.fill(); ctx.fillStyle = '#3a1a20'; ctx.fillRect(s.cx - 5, s.y, 10, 4); ctx.fillStyle = '#ffd84a'; ctx.fillRect(s.x + 3, s.y + 8, s.w - 6, 2); },
  moop(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(t * 9); ctx.fillStyle = s.seed ? '#5ac8ff' : '#e8e8f0'; ctx.fillRect(-6, -4, 12, 8); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-6, -1, 12, 2); },
  surfer(ctx, s, t) { ctx.translate(s.cx, s.cy); ctx.rotate(Math.sin(t * 6) * 0.4); ctx.fillStyle = GLOW_COLS[(s.seed || 0) % 5]; rr(ctx, -12, -4, 24, 8, 4); ctx.fill(); ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(13, -2, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8c4a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-8, -12); ctx.moveTo(4, -4); ctx.lineTo(8, -12); ctx.stroke(); },
  thrown(ctx, s, t) { ctx.translate(s.cx, s.cy + 12); ctx.rotate(t * 8); BurnerArt.draw(ctx, 'raver', 0, 12, t, 1, 'walk', { seed: 3 }); },
  pallet(ctx, s) { ctx.fillStyle = '#a8784a'; for (let i = 0; i < s.w; i += 8) ctx.fillRect(s.x + i, s.y, 6, 5); ctx.fillStyle = '#7a5430'; ctx.fillRect(s.x + 2, s.y + 5, s.w - 4, 4); ctx.fillRect(s.x + 2, s.y + 9, 4, 5); ctx.fillRect(s.x + s.w - 6, s.y + 9, 4, 5); },
  ink(ctx, s) { ctx.fillStyle = '#12121e'; ctx.beginPath(); ctx.moveTo(s.cx, s.y); ctx.quadraticCurveTo(s.cx + 6, s.y + s.h * 0.7, s.cx, s.y + s.h); ctx.quadraticCurveTo(s.cx - 6, s.y + s.h * 0.7, s.cx, s.y); ctx.fill(); },
  unicycle(ctx, s, t) { ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = '#38f2ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(s.cx, s.cy, 5, t * 20, t * 20 + 4); ctx.stroke(); },
  ember(ctx, s, t) { Sprites.ember(ctx, s.cx, s.cy, 5, t); },
  spark(ctx, s) { ctx.fillStyle = s.col || '#ff4fd8'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 5, 0, TAU); ctx.fill(); }
};

/* ---------- baggies (ground score) and item icons ---------- */
Object.assign(Sprites, {
  baggie(ctx, x, y, t, kind) {
    const B = BAG_KINDS[kind] || BAG_KINDS.molly;
    const bob = Math.sin(t * 3) * 1.5;
    ctx.save(); ctx.translate(x, y - 12 + bob); ctx.rotate(Math.sin(t * 2) * 0.12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 20); g.addColorStop(0, rgba(B.col, 0.45)); g.addColorStop(1, rgba(B.col, 0)); ctx.fillStyle = g; ctx.fillRect(-20, -20, 40, 40); ctx.restore();
    // a little zip baggie with a cartoon sticker
    ctx.fillStyle = 'rgba(235,245,255,0.85)'; rr(ctx, -8, -10, 16, 19, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,170,0.9)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#c83a5a'; ctx.fillRect(-8, -8, 16, 2);
    if (kind === 'molly') { ctx.fillStyle = '#ff5a9a'; ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-8, 0, -4, -6, 0, -2); ctx.bezierCurveTo(4, -6, 8, 0, 0, 6); ctx.fill(); }
    else if (kind === 'khole') { ctx.fillStyle = '#3a5aa8'; ctx.beginPath(); ctx.arc(0, 1, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8e0ff'; ctx.beginPath(); ctx.arc(0, 1, 2.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = `5px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('K', 0, 3); }
    else if (kind === 'powder') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(0, -3); ctx.lineTo(5, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(-1, 0); ctx.lineTo(1.5, 0); ctx.lineTo(-1.5, 5); ctx.lineTo(4, -1); ctx.lineTo(1.5, -1); ctx.closePath(); ctx.fill(); }
    else { for (let i = 0; i < 4; i++) { ctx.fillStyle = `hsl(${(t * 120 + i * 90) % 360},90%,60%)`; ctx.fillRect(-6 + (i % 2) * 6, -5 + Math.floor(i / 2) * 6, 5.5, 5.5); } ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 1, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // any collectible as a small icon centred on (x, y): for the pack slot and the HUD
  itemIcon(ctx, x, y, t, kind) {
    ctx.save(); ctx.translate(x, y);
    if (BAG_KINDS[kind]) { Sprites.baggie(ctx, 0, 14, t, kind); }
    else if (kind === 'coffee') Sprites.coffee(ctx, 0, 13, t);
    else if (kind === 'vinyl') Sprites.bottle(ctx, 0, 13, t);
    else if (kind === 'bufo') Sprites.bufo(ctx, 0, 11, t, false);
    else if (kind === 'joint') Sprites.joint(ctx, 0, 12, t);
    else if (kind === 'eclipse') Sprites.eclipse(ctx, 0, 0, t);
    else if (kind === 'cassette') Sprites.cassette(ctx, 0, 12, t);
    ctx.restore();
  }
});
