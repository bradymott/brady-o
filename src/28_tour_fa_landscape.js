/* Country dioramas for the tour map's country panel: a little island with a winding trail, the level stops, a
   regional landmark and the boss fort. All coordinates are CSS pixels; the stamps stay the panel's input targets,
   and progression, saves and flight logic are untouched.

   Stop layout is data-driven: the island is a grid of cells and every level sits in its own cell, so stops never
   overlap however many there are. By default the levels snake through the grid (bottom row left to right, the next
   row right to left, ...). A level can pin its cell with `mapCell: [col, row]` (row 0 = the bottom row) and say
   which stop its trail comes from with `mapFrom: <0-based level index>`: that is how secret levels and branching
   paths go in. `mapHidden: true` keeps a stop (and its trail) off the map until it is unlocked; its cell stays
   reserved so nothing moves when it appears. A free cell gets the landmark.

   Landmarks are original, non-sacred miniatures (sacred sites stay in level backgrounds, never as map icons). */
const TourLandscape = {
  // sky, water, far hills, land, light land, path, landmark
  looks: {
    mx: ['#f5c887', '#48a8b5', '#b98b85', '#75a565', '#b7cf7b', '#f9dea0', 'cactus'],
    ec: ['#b9e6e7', '#409eae', '#799aa0', '#5d9f7b', '#a5c68d', '#f4e4b7', 'volcano'],
    br: ['#bce5ee', '#39a8bb', '#6d9faa', '#68aa69', '#b3cf79', '#fff0b3', 'sugarloaf'],
    mz: ['#c8edef', '#42b9c3', '#8eb4a2', '#85b875', '#e2d99b', '#fff0c8', 'palm'],
    ma: ['#f1d7b4', '#559fae', '#bf9d98', '#bf9870', '#e4c896', '#fff0c9', 'gate'],
    es: ['#f6ddb2', '#56b9c7', '#b4aaa4', '#8ca56c', '#d7c789', '#fff0bf', 'orange'],
    fr: ['#ddddea', '#689eaf', '#a09db9', '#85ac91', '#c1d1a6', '#f8edcd', 'tower'],
    nl: ['#d7ebee', '#5ea4b7', '#9aadb7', '#8bb481', '#c6d494', '#fff0c4', 'mill'],
    id: ['#f3d7c8', '#58b7be', '#9899ae', '#64a47f', '#b9c582', '#ffe6b4', 'terraces'],
    vn: ['#d5e8cf', '#4f9e9a', '#7fa894', '#5f9a6f', '#b3c67e', '#f5e5ac', 'karst'],
    jp: ['#f1dce7', '#79b3c0', '#a39ebc', '#86ae94', '#d1d7ab', '#fff1d5', 'train'],
    np: ['#cfe2f2', '#4f8fb8', '#8492b8', '#78a67f', '#c9dca5', '#f7e8c8', 'peaks'],
    aq: ['#d6edf6', '#4b97ba', '#92b8cd', '#bed9df', '#edf7ee', '#eaf4fb', 'iceberg'],
    w22: ['#d8c6ec', '#8876b9', '#a19acc', '#9ba5c2', '#d3d4b5', '#fff0c8', 'portal']
  },
  look(id) { return this.looks[id] || this.looks.mx; },
  STYLE: { run: 'RUN', night: 'NIGHT', auto: 'CHASE', ride: 'RIDE', swim: 'SWIM', climb: 'CLIMB', castle: 'BOSS', puzzle: 'PUZZLE' },

  /* grid(levels): { cols, rows, cells: [[col, row] per level], from: [index of the stop each trail comes from] } */
  grid(levels) {
    const n = levels.length, cols = Math.max(1, Math.min(3, n));
    const cells = [], from = [];
    let rows = Math.ceil(n / cols), maxCol = cols - 1;
    levels.forEach((L, k) => {
      let c;
      if (L.mapCell) c = L.mapCell.slice(0, 2);
      else { const row = Math.floor(k / cols), i = k % cols; c = [row % 2 ? cols - 1 - i : i, row]; }
      cells.push(c); rows = Math.max(rows, c[1] + 1); maxCol = Math.max(maxCol, c[0]);
      from.push(L.mapFrom != null ? L.mapFrom : k - 1);
    });
    return { cols: maxCol + 1, rows, cells, from };
  },

  // Original vector miniatures. Origin = bottom centre, the art fits about 50 x 50 units at size 40.
  landmark(ctx, kind, x, y, size, ink, accent) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 2;
    ctx.strokeStyle = ink || '#3d5362'; ctx.fillStyle = accent || '#ffdf95';
    const poly = pts => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const line = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
    const blob = (cx, cy, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke(); };
    switch (kind) {
      case 'cactus': {   // a saguaro with two arms and a flower
        ctx.fillStyle = '#4f9a62';
        const arm = (x0, dir) => { ctx.beginPath(); ctx.moveTo(x0, -14); ctx.lineTo(x0 + dir * 9, -14); ctx.quadraticCurveTo(x0 + dir * 13, -14, x0 + dir * 13, -19); ctx.lineTo(x0 + dir * 13, -27); ctx.arc(x0 + dir * 10, -27, 3, 0, Math.PI, true); ctx.lineTo(x0 + dir * 7, -19); ctx.lineTo(x0, -19); ctx.closePath(); ctx.fill(); ctx.stroke(); };
        arm(-4, -1); arm(4, 1);
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-5, -34); ctx.arc(0, -34, 5, Math.PI, 0); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; line(-1.5, -4, -1.5, -34); line(1.8, -4, 1.8, -32);
        ctx.strokeStyle = ink; ctx.lineWidth = 1.5; blob(0, -40, 2.6, '#ff6f91'); break;
      }
      case 'volcano':   // a snow cone with a puff of smoke
        poly([[-25, 0], [-9, -30], [9, -30], [25, 0]]);
        ctx.fillStyle = '#f6f2df'; poly([[-9, -30], [9, -30], [13, -23], [7, -20], [2, -24], [-3, -19], [-13, -23]]);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5;
        for (const [px, py, pr] of [[2, -36, 4], [7, -41, 5], [13, -46, 4]]) { ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); ctx.stroke(); }
        break;
      case 'sugarloaf':   // two rounded granite domes over the bay with a cable car between them (no statue)
        ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-24, -20, -13, -21); ctx.quadraticCurveTo(-5, -21, -3, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.bezierCurveTo(-6, -30, 2, -42, 10, -42); ctx.bezierCurveTo(19, -42, 24, -26, 26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(70,120,80,0.55)'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.bezierCurveTo(-5, -10, 0, -14, 6, -13); ctx.bezierCurveTo(14, -11, 22, -9, 26, 0); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 1; line(-13, -21, 10, -42);
        ctx.fillStyle = '#e8584f'; ctx.lineWidth = 1.2; ctx.fillRect(-2.5, -34, 5, 4); ctx.strokeRect(-2.5, -34, 5, 4); line(0, -34, 0, -36.5);
        break;
      case 'tower':
        poly([[-19, 0], [-9, -20], [-3, -42], [0, -55], [3, -42], [9, -20], [19, 0], [9, 0], [0, -13], [-9, 0]]);
        line(-9, -19, 9, -19); line(-5, -31, 5, -31); break;
      case 'mill':
        poly([[-12, 0], [-8, -27], [7, -27], [12, 0]]); poly([[-11, -27], [0, -38], [11, -27]]);
        ctx.strokeStyle = '#fff3d7'; ctx.lineWidth = 4; line(-19, -43, 19, -9); line(19, -43, -19, -9); ctx.fillStyle = '#334f63'; ctx.beginPath(); ctx.arc(0, -26, 3, 0, TAU); ctx.fill(); break;
      case 'palm':
        ctx.strokeStyle = '#8b7555'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(5, -17, 1, -34); ctx.stroke();
        ctx.strokeStyle = '#3c816a'; ctx.lineWidth = 5;
        for (let i = 0; i < 5; i++) { const a = -Math.PI + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(1, -34); ctx.quadraticCurveTo(Math.cos(a) * 15, -43 + Math.sin(a) * 4, Math.cos(a) * 24, -28 + Math.sin(a) * 14); ctx.stroke(); }
        break;
      case 'gate':
        poly([[-23, 0], [-23, -34], [-16, -34], [-16, -29], [16, -29], [16, -34], [23, -34], [23, 0]]);
        ctx.fillStyle = '#826e71'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, -13); ctx.bezierCurveTo(-15, -23, 15, -23, 8, -13); ctx.lineTo(8, 0); ctx.fill(); break;
      case 'orange': {   // an orange tree in a terracotta pot
        ctx.fillStyle = '#c96a3f'; poly([[-8, 0], [-10, -9], [10, -9], [8, 0]]);
        ctx.strokeStyle = ink; ctx.lineWidth = 3; line(0, -9, 0, -20); ctx.lineWidth = 2;
        ctx.fillStyle = '#4c9a58'; ctx.beginPath(); ctx.arc(-8, -27, 10, 0, TAU); ctx.arc(8, -27, 10, 0, TAU); ctx.arc(0, -36, 11, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(-8, -27, 10, 0.5, 3.6); ctx.stroke(); ctx.beginPath(); ctx.arc(8, -27, 10, -0.5, 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -36, 11, 3.4, 6.0); ctx.stroke();
        ctx.lineWidth = 1.2;
        for (const [ox, oy] of [[-11, -29], [-3, -38], [6, -33], [11, -24], [-4, -24], [5, -42]]) blob(ox, oy, 3, '#ff9a2e');
        break;
      }
      case 'terraces': {   // stepped rice terraces down a hill, with a little palm
        const bands = ['#9ccf6b', '#86c05e', '#72b153', '#5f9f48'];
        for (let i = 0; i < 4; i++) {
          const yy = -30 + i * 8, hw = 10 + i * 6;
          ctx.fillStyle = bands[i]; ctx.beginPath(); ctx.moveTo(-hw, yy + 8); ctx.quadraticCurveTo(-hw, yy, -hw + 5, yy); ctx.lineTo(hw - 5, yy); ctx.quadraticCurveTo(hw, yy, hw, yy + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; line(-hw + 4, yy + 3, hw - 4, yy + 3); ctx.strokeStyle = ink; ctx.lineWidth = 2;
        }
        ctx.strokeStyle = '#8b7555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -30); ctx.quadraticCurveTo(17, -38, 15, -46); ctx.stroke();
        ctx.strokeStyle = '#3c816a'; ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) { const a = -Math.PI + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(15, -46); ctx.quadraticCurveTo(15 + Math.cos(a) * 7, -50 + Math.sin(a) * 2, 15 + Math.cos(a) * 11, -43 + Math.sin(a) * 6); ctx.stroke(); }
        break;
      }
      case 'karst': {   // three tall limestone towers rising from the bay, a sailing junk in front
        const tower = (cx, w, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - w, 0); ctx.bezierCurveTo(cx - w - 2, -h * 0.5, cx - w * 0.9, -h, cx, -h); ctx.bezierCurveTo(cx + w * 0.9, -h, cx + w + 2, -h * 0.5, cx + w, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); };
        tower(-14, 7, 32, '#8eb59a'); tower(12, 8, 38, '#7aa688'); tower(-1, 8, 46, '#6c9b7c');
        ctx.fillStyle = 'rgba(80,140,90,0.7)'; ctx.beginPath(); ctx.ellipse(-1, -43, 7, 3.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c0583e'; ctx.lineWidth = 1.5; poly([[14, -6], [14, -20], [24, -8]]);
        ctx.fillStyle = '#6a4a35'; poly([[6, -3], [27, -3], [24, 1], [9, 1]]);
        break;
      }
      case 'train': {   // a bullet train crossing a viaduct, a stand of bamboo behind
        ctx.strokeStyle = '#5c9c55'; ctx.lineWidth = 3;
        for (const bx of [-20, -15, -10]) line(bx, 0, bx + 1, -36);
        ctx.strokeStyle = '#7bbf6a'; ctx.lineWidth = 2; for (const [bx, by] of [[-20, -28], [-15, -33], [-10, -24]]) { line(bx, by, bx + 6, by - 4); line(bx, by + 6, bx - 5, by + 2); }
        ctx.strokeStyle = ink; ctx.lineWidth = 2;
        ctx.fillStyle = '#c9c3b6'; ctx.fillRect(-26, -10, 54, 4); ctx.strokeRect(-26, -10, 54, 4);
        for (const px of [-18, 2, 22]) { ctx.fillRect(px - 2, -6, 4, 6); ctx.strokeRect(px - 2, -6, 4, 6); }
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-24, -10); ctx.lineTo(-24, -20); ctx.lineTo(12, -20); ctx.quadraticCurveTo(28, -19, 30, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2f6fb3'; ctx.fillRect(-24, -14, 50, 2.2);
        ctx.fillStyle = '#334f63'; for (let wx = -21; wx < 10; wx += 6) ctx.fillRect(wx, -18.5, 3.5, 3); ctx.beginPath(); ctx.moveTo(15, -19); ctx.quadraticCurveTo(23, -18, 25, -15); ctx.lineTo(16, -15); ctx.closePath(); ctx.fill();
        break;
      }
      case 'peaks':   // a Himalayan ridge: three jagged snow peaks
        ctx.fillStyle = '#8a97b9'; poly([[-27, 0], [-15, -26], [-6, -14], [3, -44], [13, -22], [18, -30], [27, 0]]);
        ctx.fillStyle = '#f7f6ef'; poly([[-15, -26], [-10, -18], [-13, -19], [-18, -20]]);
        poly([[3, -44], [9, -31], [5, -33], [1, -28], [-2, -33]]); poly([[18, -30], [21, -22], [17, -24], [15, -25]]);
        break;
      case 'iceberg':
        ctx.fillStyle = '#eef8fb'; poly([[-24, 0], [-18, -18], [-9, -24], [-2, -38], [8, -26], [16, -30], [24, 0]]);
        ctx.fillStyle = 'rgba(120,180,210,0.5)'; ctx.beginPath(); ctx.moveTo(-2, -38); ctx.lineTo(8, -26); ctx.lineTo(4, 0); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
        break;
      case 'portal':   // World 22's glowing ring with a star
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffd86b'; ctx.beginPath(); ctx.ellipse(0, -22, 15, 20, 0, 0, TAU); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = ink; ctx.beginPath(); ctx.ellipse(0, -22, 18, 23, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -22, 12, 17, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#fff3c4'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.2 : 7.5; ctx.lineTo(Math.cos(a) * r, -22 + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      default:
        poly([[-20, 0], [0, -30], [20, 0]]);
    }
    ctx.restore();
  },

  scenery(ctx, R, id, t, lm) {
    const c = this.look(id), X = R.x, Y = R.y, W = R.w, H = R.h;
    ctx.save(); ctx.beginPath(); rr(ctx, X, Y, W, H, 18); ctx.clip();
    const sky = ctx.createLinearGradient(0, Y, 0, Y + H); sky.addColorStop(0, c[0]); sky.addColorStop(1, c[1]); ctx.fillStyle = sky; ctx.fillRect(X, Y, W, H);
    ctx.fillStyle = 'rgba(255,250,229,0.58)'; ctx.beginPath(); ctx.arc(X + W * .81, Y + H * .16, Math.min(22, H * 0.1), 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { const xx = X + W * (.12 + i * .34) + Math.sin(t * .12 + i) * 4, yy = Y + H * (.08 + (i % 2) * .07); ctx.fillStyle = 'rgba(255,255,255,0.38)'; rr(ctx, xx, yy, 47, 7, 4); ctx.fill(); }
    ctx.fillStyle = c[2]; ctx.beginPath(); ctx.moveTo(X, Y + H * .56);
    for (let i = 0; i <= 8; i++) ctx.lineTo(X + W * i / 8, Y + H * (i % 2 ? .38 : .22)); ctx.lineTo(X + W, Y + H); ctx.lineTo(X, Y + H); ctx.fill();
    // the island: water shadow, sandy shore, green plateau
    for (const [dy, col] of [[9, c[1]], [4, c[5]], [0, c[3]]]) { ctx.save(); ctx.translate(0, dy); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + W * .04, Y + H * .84); ctx.bezierCurveTo(X - W * .06, Y + H * .5, X + W * .14, Y + H * .06, X + W * .5, Y + H * .12); ctx.bezierCurveTo(X + W * .96, Y + H * .02, X + W * 1.06, Y + H * .6, X + W * .92, Y + H * .84); ctx.quadraticCurveTo(X + W * .56, Y + H * 1.06, X + W * .04, Y + H * .84); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = c[4]; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const xx = X + W * (.13 + ((i * 37) % 73) / 100), yy = Y + H * (.35 + ((i * 19) % 49) / 100); ctx.beginPath(); ctx.moveTo(xx - 4, yy); ctx.lineTo(xx - 2, yy - 4); ctx.lineTo(xx, yy); ctx.stroke(); }
    if (lm) { ctx.fillStyle = 'rgba(30,55,54,0.2)'; ctx.beginPath(); ctx.ellipse(lm.x, lm.y, lm.size * 0.6, lm.size * 0.1, 0, 0, TAU); ctx.fill(); this.landmark(ctx, c[6], lm.x, lm.y, lm.size, '#2f4752', c[5]); }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const xx = X + W * (.2 + i * .2), yy = Y + H * .97; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 5, yy - 3, xx + 12, yy); ctx.stroke(); }
    ctx.restore();
  },

  // fit text to a width: whole, or cut with an ellipsis
  fit(ctx, s, w) {
    if (ctx.measureText(s).width <= w) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ctx.measureText(s.slice(0, m).trimEnd() + '…').width <= w) lo = m; else hi = m - 1; }
    return s.slice(0, lo).trimEnd() + '…';
  },
  // up to `max` lines: words wrap, whatever is left goes on the last line, each line ellipsised to the width
  wrap(ctx, s, w, max) {
    const lines = []; let cur = '';
    for (const wd of s.split(' ')) {
      const next = cur ? cur + ' ' + wd : wd;
      if (!cur || ctx.measureText(next).width <= w) cur = next; else { lines.push(cur); cur = wd; }
    }
    lines.push(cur);
    if (lines.length > max) { const rest = lines.slice(max - 1).join(' '); lines.length = max - 1; lines.push(rest); }
    return lines.map(l => this.fit(ctx, l, w));
  },
  lock(ctx, x, y, s, col) {   // a padlock centred at (x, y), s = its height
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, s * 0.16);
    ctx.beginPath(); ctx.arc(x, y - s * 0.12, s * 0.26, Math.PI, 0); ctx.lineTo(x + s * 0.26, y + s * 0.02); ctx.moveTo(x - s * 0.26, y + s * 0.02); ctx.lineTo(x - s * 0.26, y - s * 0.12); ctx.stroke();
    rr(ctx, x - s * 0.4, y, s * 0.8, s * 0.55, s * 0.1); ctx.fill();
    ctx.restore();
  }
};

(() => {
  const oldPanel = TourMapScene.prototype.drawPanel;
  TourMapScene.prototype.layoutPanel = function () {
    const C = Tour.countries[this.sel], R = this.panelR; this.stamps = []; this.terrainR = null; this.landmarkAt = null;
    if (!C) return;
    const head = 56, foot = C.power ? 44 : 12;
    const A = { x: R.x + 8, y: R.y + head, w: R.w - 16, h: Math.max(90, R.h - head - foot) };
    this.terrainR = A;
    const G = TourLandscape.grid(C.levels), cw = A.w / G.cols, ch = A.h / G.rows;
    // the stop's parts, top to bottom: postcard marks, circle, name (1-2 lines), level type. Compact cells: 1 line, no type.
    const compact = ch < 62, r = Math.max(9, Math.min(14, ch * 0.15)), lh = cw > 100 ? 13 : 12;
    const blockH = 7 + 2 * r + 4 + (compact ? lh + 2 : 2 * lh + 12);
    this.stopLook = { r, lh, compact, cw, ch };
    const used = {};
    this.stampAt = {};
    C.levels.forEach((L, k) => {
      const [col, row] = G.cells[k]; used[col + ',' + row] = true;
      if (L.mapHidden && !TourProgress.isUnlocked(C.world + '-' + (k + 1))) return;
      const x = A.x + col * cw, y = A.y + (G.rows - 1 - row) * ch;
      const slack = Math.max(0, ch - 4 - blockH), jit = (col % 2 ? -1 : 1) * Math.min(slack / 2, ch * 0.1);
      const top = y + 2 + slack / 2 + jit;
      const st = { i: k + 1, x: x + 2, y: y + 2, w: cw - 4, h: ch - 4, cx: x + cw / 2, cy: top + 7 + r, top, from: G.from[k] };
      this.stamps.push(st); this.stampAt[k] = st;
    });
    // the landmark: in a free cell (top row first), otherwise small in the hills at the back
    let free = null;
    for (let row = G.rows - 1; row >= 0 && !free; row--) for (let col = 0; col < G.cols; col++) if (!used[col + ',' + row]) { free = [col, row]; break; }
    if (free) { const s = Math.min(cw * 0.62, ch * 0.72, 72); this.landmarkAt = { x: A.x + (free[0] + 0.5) * cw, y: A.y + (G.rows - 1 - free[1]) * ch + ch * 0.5 + s * 0.5, size: s }; }
    else this.landmarkAt = { x: A.x + A.w * 0.9, y: A.y + A.h * 0.3, size: Math.min(26, A.h * 0.16) };
  };
  TourMapScene.prototype.drawPanel = function (ctx) {
    const C = Tour.countries[this.sel], R = this.panelR, s = Tour.stops[this.sel];
    if (!C || TourMap.stopState(s) === 'locked' || !this.terrainR) { oldPanel.call(this, ctx); return; }
    const c = TourLandscape.look(this.sel), A = this.terrainR, K = this.stopLook;
    ctx.save();
    ctx.fillStyle = '#152c3c'; rr(ctx, R.x, R.y, R.w, R.h, 19); ctx.fill(); ctx.strokeStyle = 'rgba(255,244,214,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = c[5]; ctx.font = `${Math.min(20, R.w / 12)}px ${FONT_DISPLAY}`; ctx.fillText(s.name.toUpperCase(), R.x + 16, R.y + 21, R.w - 32);
    ctx.fillStyle = '#c9dde0'; ctx.font = `11px ${FONT_UI}`; ctx.fillText(TourLandscape.fit(ctx, C.tagline || s.sub || 'Choose your next adventure', R.w - 32), R.x + 16, R.y + 41);
    TourLandscape.scenery(ctx, A, this.sel, this.t, this.landmarkAt);
    // the trail: done stretches solid, future ones dotted
    ctx.lineCap = 'round';
    this.stamps.forEach(b => {
      const a = this.stampAt[b.from]; if (!a) return;
      const open = TourProgress.isUnlocked(C.world + '-' + b.i);
      const trail = () => { ctx.beginPath(); ctx.moveTo(a.cx, a.cy); const my = (a.cy + b.cy) / 2; if (Math.abs(a.cy - b.cy) < 4) ctx.bezierCurveTo((a.cx * 2 + b.cx) / 3, a.cy + 10, (a.cx + b.cx * 2) / 3, b.cy - 10, b.cx, b.cy); else ctx.bezierCurveTo(a.cx + (a.cx > A.x + A.w / 2 ? 26 : -26), my, b.cx + (b.cx > A.x + A.w / 2 ? 26 : -26), my, b.cx, b.cy); };
      ctx.strokeStyle = 'rgba(45,67,63,0.35)'; ctx.lineWidth = 10; trail(); ctx.stroke();
      ctx.strokeStyle = open ? c[5] : 'rgba(255,244,215,0.7)'; ctx.lineWidth = 6; ctx.setLineDash(open ? [] : [2, 7]); trail(); ctx.stroke(); ctx.setLineDash([]);
    });
    const active = this.stamps.find(b => TourProgress.isUnlocked(C.world + '-' + b.i) && !Save.data.done[C.world + '-' + b.i]);
    const r = K.r, lh = K.lh, labelW = Math.max(40, K.cw - 8);
    this.stamps.forEach((b, k) => {
      const id = C.world + '-' + b.i, L = C.levels[b.i - 1], open = TourProgress.isUnlocked(id), done = !!Save.data.done[id], boss = L.style === 'castle', foc = this.focus === k && !Input.usingTouch;
      const x = b.cx, y = b.cy;
      // postcards found (three marks above the stop)
      const gold = Save.data.gold[id] || [];
      for (let q = 0; q < 3; q++) { ctx.fillStyle = gold[q] ? '#ffdc71' : 'rgba(35,69,69,0.35)'; rr(ctx, x - 9.5 + q * 7, b.top, 5, 4, 1); ctx.fill(); }
      ctx.fillStyle = 'rgba(30,55,54,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + r + 2, r + 3, 3, 0, 0, TAU); ctx.fill();
      if (active === b || foc) { ctx.strokeStyle = foc ? '#ffd84a' : '#fff7d8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, r + 4.5, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = done ? '#f5c75e' : open ? '#fff7df' : '#6d8483'; ctx.strokeStyle = '#30474f'; ctx.lineWidth = 2;
      if (boss) {   // the boss fort: battlements and a door
        rr(ctx, x - r, y - r * 0.8, r * 2, r * 1.8, 3); ctx.fill(); ctx.stroke();
        for (let q = -1; q <= 1; q++) { ctx.fillRect(x + q * r * 0.7 - 2.5, y - r * 0.8 - 4, 5, 5); ctx.strokeRect(x + q * r * 0.7 - 2.5, y - r * 0.8 - 4, 5, 5); }
        if (open) { ctx.fillStyle = '#30474f'; rr(ctx, x - 3.5, y + r * 0.1, 7, r * 0.9, 3); ctx.fill(); }
        else TourLandscape.lock(ctx, x, y - r * 0.15, r * 1.1, '#2b3e45');
      } else {
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        if (!open) TourLandscape.lock(ctx, x, y - r * 0.12, r * 1.15, '#2b3e45');
        else { ctx.fillStyle = '#30474f'; ctx.textAlign = 'center'; ctx.font = `${Math.round(r * 1.05)}px ${FONT_DISPLAY}`; ctx.fillText(done ? '✓' : String(b.i), x, y + 1); }
      }
      // the name on a pill, one or two lines, then the level type
      ctx.font = `${lh - 1.5}px ${FONT_UI}`; ctx.textAlign = 'center';
      const lines = TourLandscape.wrap(ctx, L.name, labelW - 8, K.compact ? 1 : 2);
      let pw = 0; for (const l of lines) pw = Math.max(pw, ctx.measureText(l).width);
      const ly = y + r + 4, type = K.compact ? '' : TourLandscape.STYLE[L.style] || 'RUN';
      if (type) { ctx.font = `bold 10px ${FONT_UI}`; pw = Math.max(pw, ctx.measureText(type).width); }
      ctx.fillStyle = open ? 'rgba(18,52,62,0.93)' : 'rgba(52,78,82,0.9)'; rr(ctx, x - pw / 2 - 5, ly, pw + 10, lines.length * lh + (type ? 12 : 2), 5); ctx.fill();
      ctx.font = `${lh - 1.5}px ${FONT_UI}`; ctx.fillStyle = open ? '#fff5d9' : '#cfdcd7';
      lines.forEach((l, i) => ctx.fillText(l, x, ly + 1 + lh * (i + 0.5)));
      if (type) { ctx.font = `bold 10px ${FONT_UI}`; ctx.fillStyle = boss ? '#ffb27a' : open ? '#8fd6c4' : '#a9bdb8'; ctx.fillText(type, x, ly + lines.length * lh + 6.5); }
      if (active === b) { ctx.fillStyle = '#fff4d4'; ctx.strokeStyle = '#30474f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + r + 3, y - r - 6); ctx.lineTo(x + r + 11, y - r - 6); ctx.lineTo(x + r + 7, y - r); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    });
    // the country's souvenir (signature power-up)
    if (C.power) {
      const y = R.y + R.h - 24;
      ctx.save(); ctx.translate(R.x + 24, y); ctx.scale(0.75, 0.75); if (C.power.icon) C.power.icon(ctx, 0, 0, this.t); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffd84a'; ctx.fillText(TourLandscape.fit(ctx, 'SOUVENIR: ' + C.power.name.toUpperCase(), R.w - 54), R.x + 44, y - 6);
      ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = '#c3d6da'; ctx.fillText(TourLandscape.fit(ctx, C.power.hint || '', R.w - 54), R.x + 44, y + 9);
    }
    ctx.restore();
  };
})();
