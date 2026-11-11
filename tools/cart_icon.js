// Super Art Kart home-screen icon, drawn in code (canvas 2D in headless Chromium), so it can be re-made any time.
//   node tools/cart_icon.js <outDir> [design=A]          -> <outDir>/icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png
//   node tools/cart_icon.js --sheet <file.png> [dir]      -> a contact sheet of all designs at 512 / 180 / 60 px (+ each size in [dir])
// Designs: A "Heart Racer" (Bass Valentine's heart as a grinning kart), B "Duck Dash" (the rubber duck car),
//          C "Head-On" (a cheeky art car coming straight at you). The chosen one is DEFAULT below.
// Every icon fills the whole square (no transparent corners: iOS would paint them black); the maskable one keeps the
// art inside the centre 80% (the safe zone) and only the background bleeds to the edges.
// The game's own build copies icons from dist/icons/kart/ (see tools/build.js); install a set there to ship it.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const DEFAULT = 'A';
const NAMES = { A: 'Heart Racer', B: 'Duck Dash', C: 'Head-On' };

// runs in the page: draw(ctx, N, design, maskable)
const PAGE_CODE = String.raw`
const INK = '#2a0838';
function star(x, cx, cy, n, r0, r1, rot) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r0 : r1; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  x.closePath();
}
function rays(x, cx, cy, n, R, col, rot) {
  x.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n, w = Math.PI / n * 0.55; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); x.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); x.closePath(); x.fill(); }
}
function outlined(x, fill, lw) { x.fillStyle = fill; x.fill(); x.lineWidth = lw || 12; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke(); }
function speedLines(x, lines) {
  x.lineCap = 'round';
  for (const [x0, y0, x1, w] of lines) {
    x.strokeStyle = INK; x.lineWidth = w + 10; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y0); x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y0); x.stroke();
  }
}
function wheel(x, cx, cy, r) {
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); outlined(x, '#1c0e26', 12);
  x.beginPath(); x.arc(cx, cy, r * 0.46, 0, Math.PI * 2); outlined(x, '#ffd84a', 8);
  x.beginPath(); x.arc(cx - r * 0.1, cy - r * 0.12, r * 0.14, 0, Math.PI * 2); x.fillStyle = '#fff6c8'; x.fill();
}
function eye(x, cx, cy, rx, ry, px, py) {
  x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); outlined(x, '#ffffff', 10);
  x.beginPath(); x.ellipse(cx + px, cy + py, rx * 0.5, ry * 0.52, 0, 0, Math.PI * 2); x.fillStyle = INK; x.fill();
  x.beginPath(); x.arc(cx + px - rx * 0.16, cy + py - ry * 0.2, rx * 0.17, 0, Math.PI * 2); x.fillStyle = '#ffffff'; x.fill();
}
function heartPath(x, cx, cy, w, h) {
  // a fat cartoon heart, w wide, h tall, centred on (cx, cy)
  const t = cy - h * 0.5, b = cy + h * 0.5, l = cx - w / 2, r = cx + w / 2;
  x.beginPath();
  x.moveTo(cx, t + h * 0.24);
  x.bezierCurveTo(cx - w * 0.06, t - h * 0.04, l - w * 0.02, t - h * 0.02, l, t + h * 0.3);
  x.bezierCurveTo(l + w * 0.01, t + h * 0.6, cx - w * 0.2, b - h * 0.14, cx, b);
  x.bezierCurveTo(cx + w * 0.2, b - h * 0.14, r - w * 0.01, t + h * 0.6, r, t + h * 0.3);
  x.bezierCurveTo(r + w * 0.02, t - h * 0.02, cx + w * 0.06, t - h * 0.04, cx, t + h * 0.24);
  x.closePath();
}
function puff(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); outlined(x, '#ffe7c2', 9); }

const DESIGNS = {
  // A: Bass Valentine's heart IS the kart: headlight eyes, a cheeky grin, a wheelie out of a gold starburst
  A: {
    bg(x) {
      const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#7a1fd0'); g.addColorStop(0.55, '#d42aa8'); g.addColorStop(1, '#ff9a3a');
      x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      x.save(); x.globalAlpha = 0.55; rays(x, 300, 236, 14, 520, '#ffd84a', 0.1); x.restore();
      const r = x.createRadialGradient(300, 236, 10, 300, 236, 230); r.addColorStop(0, 'rgba(255,248,200,0.95)'); r.addColorStop(0.5, 'rgba(255,216,74,0.45)'); r.addColorStop(1, 'rgba(255,216,74,0)');
      x.fillStyle = r; x.fillRect(0, 0, 512, 512);
    },
    art(x) {
      speedLines(x, [[22, 170, 120, 20], [8, 252, 92, 24], [30, 334, 118, 18]]);
      puff(x, 108, 404, 34); puff(x, 66, 386, 26); puff(x, 140, 430, 22);
      x.save(); x.translate(282, 262); x.rotate(-0.13);
      // chassis + wheels
      x.beginPath(); x.roundRect(-150, 92, 300, 40, 20); outlined(x, '#ffd84a', 12);
      wheel(x, -112, 130, 56); wheel(x, 118, 130, 56);
      // the heart body
      heartPath(x, 0, -18, 330, 300);
      const hg = x.createLinearGradient(0, -170, 0, 140); hg.addColorStop(0, '#ff8ad8'); hg.addColorStop(0.5, '#ff2f9a'); hg.addColorStop(1, '#d4106e');
      outlined(x, hg, 14);
      x.beginPath(); x.ellipse(-92, -112, 40, 22, -0.6, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,0.75)'; x.fill();
      // headlight eyes looking ahead, brows down: up to no good
      eye(x, -28, -40, 40, 46, 14, 4); eye(x, 70, -40, 40, 46, 14, 4);
      x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 14;
      x.beginPath(); x.moveTo(-66, -104); x.lineTo(-2, -88); x.stroke();
      x.beginPath(); x.moveTo(40, -88); x.lineTo(104, -106); x.stroke();
      // grin with a tongue
      x.beginPath(); x.moveTo(-36, 26); x.quadraticCurveTo(28, 112, 106, 16); x.quadraticCurveTo(34, 48, -36, 26); x.closePath(); outlined(x, '#5a0a30', 10);
      x.save(); x.clip(); x.beginPath(); x.ellipse(42, 84, 34, 24, 0, 0, Math.PI * 2); x.fillStyle = '#ff7a9a'; x.fill(); x.restore();
      x.restore();
      // sparkles
      x.fillStyle = '#ffffff'; star(x, 440, 96, 4, 8, 30, 0); x.fill(); star(x, 96, 92, 4, 6, 20, 0.3); x.fill();
    }
  },
  // B: the rubber duck kart: a glossy yellow duck leaning into the turn, on purple with a gold burst
  B: {
    bg(x) {
      const g = x.createLinearGradient(0, 0, 512, 512); g.addColorStop(0, '#3a0a7a'); g.addColorStop(1, '#a0189a');
      x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      x.save(); x.globalAlpha = 0.45; rays(x, 290, 250, 16, 520, '#ffd84a', 0); x.restore();
      x.fillStyle = '#ff4fc8'; star(x, 300, 248, 12, 150, 205, 0.12); x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke();
    },
    art(x) {
      speedLines(x, [[20, 200, 110, 20], [10, 290, 96, 24], [36, 372, 120, 18]]);
      x.save(); x.translate(270, 266); x.rotate(-0.1);
      // kart tub
      x.beginPath(); x.moveTo(-170, 70); x.lineTo(170, 70); x.quadraticCurveTo(176, 140, 120, 150); x.lineTo(-130, 150); x.quadraticCurveTo(-180, 140, -170, 70); x.closePath(); outlined(x, '#ff2f9a', 12);
      x.beginPath(); x.roundRect(-150, 92, 300, 18, 9); x.fillStyle = '#ffffff'; x.globalAlpha = 0.5; x.fill(); x.globalAlpha = 1;
      wheel(x, -110, 150, 50); wheel(x, 120, 150, 50);
      // duck body (tail up at the back) + head
      x.beginPath(); x.moveTo(-180, -40); x.quadraticCurveTo(-150, 0, -120, 10); x.quadraticCurveTo(-140, 96, 20, 96); x.quadraticCurveTo(170, 96, 150, 10); x.quadraticCurveTo(110, -30, 20, -10); x.quadraticCurveTo(-90, 0, -180, -40); x.closePath();
      const yg = x.createLinearGradient(0, -60, 0, 100); yg.addColorStop(0, '#fff27a'); yg.addColorStop(1, '#ffb800'); outlined(x, yg, 13);
      x.beginPath(); x.arc(70, -86, 84, 0, Math.PI * 2); outlined(x, yg, 13);
      x.beginPath(); x.ellipse(36, -128, 30, 16, -0.6, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fill();
      // beak
      x.beginPath(); x.moveTo(132, -84); x.quadraticCurveTo(206, -96, 214, -64); x.quadraticCurveTo(196, -40, 134, -50); x.closePath(); outlined(x, '#ff7a1a', 11);
      x.beginPath(); x.moveTo(140, -64); x.quadraticCurveTo(180, -62, 208, -64); x.strokeStyle = INK; x.lineWidth = 6; x.stroke();
      // eye + cocky brow
      eye(x, 92, -112, 26, 32, 10, 2);
      x.lineCap = 'round'; x.lineWidth = 12; x.strokeStyle = INK; x.beginPath(); x.moveTo(62, -158); x.lineTo(122, -146); x.stroke();
      // wing
      x.beginPath(); x.moveTo(-60, 24); x.quadraticCurveTo(-10, 70, 50, 34); x.quadraticCurveTo(0, 30, -60, 24); x.closePath(); outlined(x, '#ffc81a', 9);
      x.restore();
      x.fillStyle = '#ffffff'; star(x, 444, 92, 4, 8, 28, 0); x.fill(); star(x, 120, 112, 4, 6, 18, 0.3); x.fill();
    }
  },
  // C: an art car coming straight at you: headlight eyes, big grin, a heart on the roof, zoom lines all around
  C: {
    bg(x) {
      const r = x.createRadialGradient(256, 250, 20, 256, 250, 380); r.addColorStop(0, '#ffe680'); r.addColorStop(0.35, '#ff4fd8'); r.addColorStop(1, '#4a0c8a');
      x.fillStyle = r; x.fillRect(0, 0, 512, 512);
      x.save(); x.globalAlpha = 0.35; rays(x, 256, 250, 20, 520, '#ffffff', 0); x.restore();
    },
    art(x) {
      x.save(); x.translate(256, 270); x.rotate(-0.08);
      // wheels peeking out
      x.beginPath(); x.roundRect(-196, 40, 70, 112, 24); outlined(x, '#1c0e26', 12);
      x.beginPath(); x.roundRect(126, 40, 70, 112, 24); outlined(x, '#1c0e26', 12);
      // body
      x.beginPath(); x.moveTo(-170, -10); x.quadraticCurveTo(-176, -100, -100, -112); x.lineTo(100, -112); x.quadraticCurveTo(176, -100, 170, -10); x.lineTo(176, 110); x.quadraticCurveTo(176, 140, 140, 140); x.lineTo(-140, 140); x.quadraticCurveTo(-176, 140, -176, 110); x.closePath();
      const bg = x.createLinearGradient(0, -112, 0, 140); bg.addColorStop(0, '#9a4aff'); bg.addColorStop(1, '#5a14b0'); outlined(x, bg, 13);
      // windshield
      x.beginPath(); x.moveTo(-110, -96); x.lineTo(110, -96); x.lineTo(130, -30); x.lineTo(-130, -30); x.closePath(); outlined(x, '#7ae8ff', 10);
      x.beginPath(); x.moveTo(-70, -90); x.lineTo(-40, -90); x.lineTo(-64, -36); x.lineTo(-94, -36); x.closePath(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fill();
      // heart on the roof
      heartPath(x, 0, -150, 110, 96); outlined(x, '#ff2f9a', 11);
      // headlight eyes
      eye(x, -84, 22, 40, 40, 0, 8); eye(x, 84, 22, 40, 40, 0, 8);
      x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 13;
      x.beginPath(); x.moveTo(-124, -16); x.lineTo(-48, -4); x.stroke(); x.beginPath(); x.moveTo(48, -4); x.lineTo(124, -16); x.stroke();
      // grille grin
      x.beginPath(); x.moveTo(-70, 76); x.quadraticCurveTo(0, 150, 70, 76); x.closePath(); outlined(x, '#ffffff', 10);
      x.beginPath(); x.moveTo(-70, 76); x.lineTo(70, 76); x.strokeStyle = INK; x.lineWidth = 7; x.stroke();
      for (const tx of [-34, 0, 34]) { x.beginPath(); x.moveTo(tx, 76); x.lineTo(tx, 102 - Math.abs(tx) * 0.25); x.stroke(); }
      x.restore();
      x.fillStyle = '#ffffff'; star(x, 438, 88, 4, 8, 30, 0); x.fill(); star(x, 78, 96, 4, 7, 22, 0.3); x.fill();
    }
  }
};
window.drawIcon = (x, N, design, maskable) => {
  const D = DESIGNS[design];
  x.save(); x.scale(N / 512, N / 512);
  D.bg(x);
  // 'any' icons: art at 94% (iOS rounds the corners); maskable: art inside the centre 80% safe circle
  const k = maskable ? 0.78 : 0.94;
  x.translate(256 * (1 - k), 256 * (1 - k)); x.scale(k, k);
  D.art(x);
  x.restore();
};
`;

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 })).newPage();
  await page.setContent('<!doctype html><body style="margin:0;background:#120a1c"></body>');
  await page.addScriptTag({ content: PAGE_CODE });
  try { return await fn(page); } finally { await browser.close(); }
}
const render = (page, design, N, maskable) => page.evaluate(([d, N, m]) => {
  const c = document.createElement('canvas'); c.width = N; c.height = N;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  if (N < 256) {   // small sizes: draw big, then step down (crisper outlines than drawing tiny)
    const big = document.createElement('canvas'); big.width = big.height = 512; window.drawIcon(big.getContext('2d'), 512, d, m);
    x.drawImage(big, 0, 0, N, N);
  } else window.drawIcon(x, N, d, m);
  return c.toDataURL('image/png').split(',')[1];
}, [design, N, maskable]);

(async () => {
  const a = process.argv.slice(2);
  if (a[0] === '--sheet') {
    const file = path.resolve(a[1]), dir = a[2] ? path.resolve(a[2]) : null;
    if (dir) fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await withPage(async page => {
      if (dir) for (const d of Object.keys(NAMES)) for (const N of [512, 180, 60]) fs.writeFileSync(path.join(dir, `icon-${d}-${N}.png`), Buffer.from(await render(page, d, N, false), 'base64'));
      const b64 = await page.evaluate(([names, def]) => {
        const ids = Object.keys(names), CW = 600, c = document.createElement('canvas'); c.width = CW * ids.length; c.height = 560;
        const x = c.getContext('2d'); x.fillStyle = '#1a1024'; x.fillRect(0, 0, c.width, c.height);
        const shot = (d, N, mask) => { const k = document.createElement('canvas'); k.width = k.height = N; const kk = k.getContext('2d'); kk.imageSmoothingQuality = 'high';
          if (N < 256) { const big = document.createElement('canvas'); big.width = big.height = 512; window.drawIcon(big.getContext('2d'), 512, d, mask); kk.drawImage(big, 0, 0, N, N); } else window.drawIcon(kk, N, d, mask); return k; };
        const rounded = (img, X, Y, S) => { x.save(); x.beginPath(); x.roundRect(X, Y, S, S, S * 0.225); x.clip(); x.drawImage(img, X, Y, S, S); x.restore(); };
        ids.forEach((d, i) => {
          const X = i * CW + 24;
          x.fillStyle = '#ffffff'; x.font = 'bold 30px system-ui, sans-serif'; x.fillText(d + ' - ' + names[d] + (d === def ? '  (chosen)' : ''), X, 44);
          rounded(shot(d, 512, false), X, 64, 300);
          x.font = '15px system-ui, sans-serif'; x.fillStyle = '#c9b8e8'; x.fillText('512 (shown at 300)', X, 386);
          rounded(shot(d, 180, false), X + 320, 64, 180); x.fillText('180 (iOS)', X + 320, 262);
          // 60 px, as on the home screen, with its label
          rounded(shot(d, 60, false), X + 320, 300, 60); x.fillStyle = '#ffffff'; x.font = '12px -apple-system, system-ui'; x.fillText('Super Art Kart', X + 308, 376); x.fillStyle = '#c9b8e8'; x.font = '15px system-ui'; x.fillText('60 (home screen)', X + 392, 336);
          // maskable in a circle mask (Android), to show the safe zone holds
          const m = shot(d, 512, true); x.save(); x.beginPath(); x.arc(X + 70, 470, 66, 0, Math.PI * 2); x.clip(); x.drawImage(m, X + 4, 404, 132, 132); x.restore();
          x.fillText('maskable, circle-cropped', X + 150, 474);
        });
        return c.toDataURL('image/png').split(',')[1];
      }, [NAMES, DEFAULT]);
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    });
    console.log('sheet:', file);
    return;
  }
  if (!a[0]) { console.error('usage: node tools/cart_icon.js <outDir> [design]  |  node tools/cart_icon.js --sheet <file.png> [dir]'); process.exit(2); }
  const out = path.resolve(a[0]), design = (a[1] || DEFAULT).toUpperCase();
  if (!NAMES[design]) { console.error('unknown design ' + design); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  await withPage(async page => {
    for (const [name, N, mask] of [['icon-180.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]])
      fs.writeFileSync(path.join(out, name), Buffer.from(await render(page, design, N, mask), 'base64'));
  });
  console.log('icons (' + design + ' ' + NAMES[design] + '):', out);
})().catch(e => { console.error(e); process.exit(1); });
