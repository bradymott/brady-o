// Brady Goes to Burning Man: the home-screen icon, drawn in code (SVG) and rendered with Playwright.
//   The Man: a lattice stick figure, arms raised, outlined in rainbow neon with a red heart, at night over the
//   playa with a warm glow on the horizon.
// Writes assets/icons/burning-man/: icon.svg (1024 master), icon-maskable.svg, icon-1024.png, icon-512.png,
// icon-192.png, icon-180.png (apple-touch: opaque, square corners) and icon-maskable-512.png (the Man inside
// the 80% safe circle). tools/build.js copies the PNGs into the burning-man site.
// usage: node tools/make_burns_icon.js [--preview <dir>]   (preview: sizes + a mock home-screen row)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'icons', 'burning-man');
const argv = process.argv.slice(2), PREVIEW = argv.indexOf('--preview') >= 0 ? argv[argv.indexOf('--preview') + 1] : null;

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// o.k: scale of the Man about the centre (maskable uses a smaller Man so it sits inside the safe zone)
function svg(o) {
  const k = o.k || 1, cx = 512, cy = o.cy || 520;
  const r = rng(7);
  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = r() * 1024, y = r() * 560, big = r() < 0.12, a = 0.35 + r() * 0.6;
    if (Math.abs(x - 512) < 230 && y > 60 && y < 560) continue;    // keep the space around the Man clean
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 3.4 : 1.6 + r() * 1.2}" fill="#fff" opacity="${a.toFixed(2)}"/>`;
  }
  // the Man, in a 1024 box centred on (512, 512); then scaled about (cx, cy)
  const LIMB = 50, ARM = 46;
  const torso = 'M 400 300 L 624 300 L 582 566 Q 512 512 442 566 Z';   // a rounded arch between the legs
  const limbs = [
    [[452, 548], [418, 870]], [[572, 548], [606, 870]],                       // legs
    [[418, 312], [318, 224], [266, 96]], [[606, 312], [706, 224], [758, 96]], // arms, raised in a V
    [[512, 300], [512, 236]]                                                  // neck
  ];
  const limbPath = limbs.map(p => 'M ' + p.map(q => q.join(' ')).join(' L ')).join(' ');
  const head = 'M 512 92 L 572 172 L 512 252 L 452 172 Z';
  // lattice: diagonal struts inside the body (clipped), thin and warm - texture up close, invisible at 60 px
  let lat = '';
  for (let y = 60; y < 920; y += 34) lat += `M 200 ${y} L 824 ${y + 300} M 824 ${y} L 200 ${y + 300} `;
  const heart = 'M 512 470 C 446 424 450 360 488 356 C 502 354 510 364 512 376 C 514 364 522 354 536 356 C 574 360 578 424 512 470 Z';
  const man = (stroke, w, extra) => `<path d="${torso}" fill="${extra || 'none'}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>
      <path d="${limbPath}" fill="none" stroke="${stroke}" stroke-width="${w + LIMB}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${head}" fill="${extra || 'none'}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  // arms are a touch thinner than legs: draw them separately for the body pass
  const body = `<path d="${torso}" fill="#160a1e"/><path d="${head}" fill="#160a1e"/>
      <path d="${limbs.slice(0, 2).map(p => 'M ' + p.map(q => q.join(' ')).join(' L ')).join(' ')}" fill="none" stroke="#160a1e" stroke-width="${LIMB}" stroke-linecap="round"/>
      <path d="${limbs.slice(2).map(p => 'M ' + p.map(q => q.join(' ')).join(' L ')).join(' ')}" fill="none" stroke="#160a1e" stroke-width="${ARM}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const T = `translate(${cx} ${cy}) scale(${k}) translate(-512 -512)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#090418"/><stop offset="0.38" stop-color="#241045"/><stop offset="0.6" stop-color="#6a1d63"/>
      <stop offset="0.69" stop-color="#c8424f"/><stop offset="0.735" stop-color="#ff9a55"/><stop offset="0.745" stop-color="#e2705a"/><stop offset="0.76" stop-color="#6a2c40"/>
      <stop offset="0.86" stop-color="#3a1830"/><stop offset="1" stop-color="#1a0b1c"/>
    </linearGradient>
    <radialGradient id="horizon" cx="512" cy="768" r="560" gradientTransform="translate(0 768) scale(1 0.32) translate(0 -768)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd27a" stop-opacity="0.95"/><stop offset="0.35" stop-color="#ff7a3a" stop-opacity="0.55"/><stop offset="1" stop-color="#ff3a5a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx="512" cy="430" r="470" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff4fd8" stop-opacity="0.6"/><stop offset="0.45" stop-color="#8a3aff" stop-opacity="0.28"/><stop offset="1" stop-color="#2a0f4a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="neon" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="900">
      <stop offset="0" stop-color="#b45cff"/><stop offset="0.16" stop-color="#4f7bff"/><stop offset="0.3" stop-color="#2ff0ff"/>
      <stop offset="0.48" stop-color="#5dff7a"/><stop offset="0.64" stop-color="#ffe94a"/><stop offset="0.8" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ff2f6a"/>
    </linearGradient>
    <radialGradient id="heartG" cx="512" cy="400" r="90" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff0f4"/><stop offset="0.28" stop-color="#ff5a7a"/><stop offset="1" stop-color="#e0102e"/>
    </radialGradient>
    <radialGradient id="headG" cx="512" cy="172" r="80" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#c8fbff"/><stop offset="1" stop-color="#5ae8ff"/>
    </radialGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="glow2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
    <clipPath id="bodyClip"><path d="${torso}"/><path d="${limbs.slice(0, 2).map(p => `M ${p[0][0] - 25} ${p[0][1]} L ${p[0][0] + 25} ${p[0][1]} L ${p[1][0] + 25} ${p[1][1]} L ${p[1][0] - 25} ${p[1][1]} Z`).join(' ')}"/></clipPath>
  </defs>
  <rect width="1024" height="1024" fill="url(#sky)"/>
  ${stars}
  <rect width="1024" height="1024" fill="url(#halo)"/>
  <!-- far mountains on the horizon -->
  <path d="M 0 752 L 0 728 C 90 712 150 706 230 718 C 300 728 350 700 430 704 C 520 708 560 724 640 716 C 720 708 800 690 880 704 C 950 716 990 714 1024 708 L 1024 752 Z" fill="#3a1640" opacity="0.92"/>
  <rect y="600" width="1024" height="330" fill="url(#horizon)"/>
  <!-- the playa: a few dusty light streaks toward the Man -->
  <path d="M 512 776 L 120 1024 L 300 1024 Z M 512 776 L 904 1024 L 724 1024 Z" fill="#ffb46a" opacity="0.06"/>
  <g transform="${T}">
    <!-- the base: a low pavilion catching the warm light -->
    <ellipse cx="512" cy="900" rx="300" ry="46" fill="#ff8a4a" opacity="0.35" filter="url(#soft)"/>
    <path d="M 326 900 L 698 900 L 752 968 L 272 968 Z" fill="#1e0c1c"/>
    <path d="M 326 900 L 698 900" stroke="#ffc070" stroke-width="12" stroke-linecap="round" filter="url(#glow2)" opacity="0.9"/>
    <path d="M 326 900 L 698 900" stroke="#ffd896" stroke-width="5" stroke-linecap="round"/>
    <g filter="url(#glow)" opacity="0.95">${man('url(#neon)', 34)}</g>
    <g filter="url(#glow2)" opacity="0.9">${man('url(#neon)', 20)}</g>
    ${man('url(#neon)', 14)}
    ${body}
    <g clip-path="url(#bodyClip)"><path d="${lat}" stroke="#ff9a4a" stroke-width="5" opacity="0.38" fill="none"/></g>
    <path d="${head}" fill="url(#headG)"/>
    <path d="${head}" fill="#ffffff" opacity="0.55" filter="url(#glow2)"/>
    <path d="${heart}" fill="#ff1f4a" filter="url(#soft)" opacity="0.95"/>
    <path d="${heart}" fill="url(#heartG)"/>
  </g>
</svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const master = svg({ k: 1 }), mask = svg({ k: 0.74, cy: 520 });
  fs.writeFileSync(path.join(OUT, 'icon.svg'), master);
  fs.writeFileSync(path.join(OUT, 'icon-maskable.svg'), mask);
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 })).newPage();
  const shot = async (src, N, file) => {
    await page.setViewportSize({ width: N, height: N });
    await page.setContent(`<html><body style="margin:0;background:#000">${src.replace('width="1024" height="1024"', `width="${N}" height="${N}"`)}</body></html>`);
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: N, height: N }, omitBackground: false });
    fs.writeFileSync(file, buf);
    return buf;
  };
  await shot(master, 1024, path.join(OUT, 'icon-1024.png'));
  await shot(master, 512, path.join(OUT, 'icon-512.png'));
  await shot(master, 192, path.join(OUT, 'icon-192.png'));
  await shot(master, 180, path.join(OUT, 'icon-180.png'));
  await shot(mask, 512, path.join(OUT, 'icon-maskable-512.png'));
  console.log('icons written to', path.relative(process.cwd(), OUT));
  if (PREVIEW) {
    fs.mkdirSync(PREVIEW, { recursive: true });
    const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    const old = process.env.OLD_ICON_DIR;
    const others = (process.env.OTHER_ICONS || '').split(',').filter(Boolean);
    // a mock iPhone home-screen row: icons at 60 pt with the iOS corner mask, labels underneath
    const row = (scale) => {
      const S = 60 * scale, rad = S * 0.2237, gap = 27 * scale, f = 11 * scale;
      const items = [];
      if (old) items.push(['Old', b64(path.join(old, 'icon-180.png'))]);
      items.push(['Burning Man', b64(path.join(OUT, 'icon-180.png'))]);
      for (const o of others) items.push([path.basename(path.dirname(o)), b64(o)]);
      items.push(['Maskable', b64(path.join(OUT, 'icon-maskable-512.png')), true]);
      const w = items.length * S + (items.length + 1) * gap;
      return { w, h: S + 50 * scale, html: `<div style="width:${w}px;height:${S + 50 * scale}px;background:linear-gradient(160deg,#1b3a5a,#5a3a7a 60%,#c86a5a);display:flex;gap:${gap}px;padding:${16 * scale}px ${gap}px;box-sizing:border-box;font:${f}px -apple-system,Helvetica,Arial,sans-serif;color:#fff">` +
        items.map(([n, src, circ]) => `<div style="width:${S}px;text-align:center"><img src="${src}" style="width:${S}px;height:${S}px;border-radius:${circ ? S / 2 : rad}px;display:block;box-shadow:0 ${scale}px ${3 * scale}px rgba(0,0,0,.35)"><div style="margin-top:${5 * scale}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</div></div>`).join('') + '</div>' };
    };
    for (const sc of [1, 3]) {
      const R = row(sc);
      await page.setViewportSize({ width: R.w, height: R.h });
      await page.setContent(`<html><body style="margin:0">${R.html}</body></html>`);
      await page.waitForTimeout(100);
      fs.writeFileSync(path.join(PREVIEW, `homescreen-row-${sc}x.png`), await page.screenshot({ clip: { x: 0, y: 0, width: R.w, height: R.h } }));
    }
    // the icon at 1024, 180 and 60 side by side (60 is what a phone shows at 1x)
    await page.setViewportSize({ width: 1400, height: 1060 });
    await page.setContent(`<html><body style="margin:0;background:#222;display:flex;gap:24px;align-items:flex-start;padding:18px"><img src="${b64(path.join(OUT, 'icon-1024.png'))}" style="width:1024px"><div style="display:flex;flex-direction:column;gap:24px"><img src="${b64(path.join(OUT, 'icon-180.png'))}" style="width:180px"><img src="${b64(path.join(OUT, 'icon-180.png'))}" style="width:60px;height:60px"><img src="${b64(path.join(OUT, 'icon-maskable-512.png'))}" style="width:180px;border-radius:90px"></div></body></html>`);
    await page.waitForTimeout(100);
    fs.writeFileSync(path.join(PREVIEW, 'icon-sizes.png'), await page.screenshot());
    console.log('previews in', PREVIEW);
  }
  await browser.close();
})();
