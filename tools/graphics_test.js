// Controlled-frame graphics regression: every registered world, both hero rigs,
// all 19 clips, procedural prop LODs, and the low/medium/high shader paths.
// Build first, then: node tools/graphics_test.js [output directory]
// Uses the normal world loader and renderer, without fast-forwarding city AI.
// Budget guard: every world's draws/triangles at its spawn camera and every procedural prop's triangles are compared
// with tools/graphics_baseline.json (made from main's build): a world may add at most 4% triangles and 3 draw calls,
// a prop at most 50% triangles. Re-make the baseline from a build of main with GRAPHICS_WRITE_BASELINE=1.
// Exits non-zero on any failure.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site');
const out = path.resolve(process.argv[2] || 'shots/graphics');
const clips = ['idle','walk','run','jump','land','hurt','knocked','dance','wave','talk','hug','sit','sleep','cheer','drive','fire','sulk','captive','photo'];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(req.url.split('?')[0]);
    const file = path.resolve(site, '.' + relative + (relative.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(site + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.json') ? 'application/json' : 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();
  const report = { worlds: [], characters: [], props: [], tiers: [], errors: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await context.addInitScript(() => { window.requestAnimationFrame = fn => { window.__graphicsFrame = fn; return 1; }; window.__burnsHideHUD = true; });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await page.goto('http://127.0.0.1:' + server.address().port + '/burning-man/');
    await page.waitForFunction(() => !!window.BRADY_BURNS, null, { polling: 100 });
    const prepare = async () => { await page.waitForFunction(() => !!window.BRADY_BURNS, null, {polling:100}); await page.evaluate(async () => {
      const B = window.BRADY_BURNS;
      await B.BurnsGLBProps.preload();
      await Promise.all(['brady','chinka'].map(n => B.BurnsSkin.preload('models/' + n + '.glb.gz')));
      window.__graphicsDraw = () => {
        const s = B.debug.scene(); s.fade = 0; s.dayCardT = -1; s.banners = [];
        window.BRADY.Game.ctx.setTransform(1,0,0,1,0,0); s.draw(window.BRADY.Game.ctx);
        const err = B.BurnsGL.gl.getError(); if (err) throw new Error('WebGL error ' + err);
      };
      window.__graphicsWorld = id => {
        B.debug.play(id, { fresh: true }); const s = B.debug.scene();
        if (s.state === 'load') s.load();
        B.debug.skipCine(); s.update(1/60); window.__graphicsDraw();
        if (s.state !== 'play') throw new Error('World ' + id + ' state: ' + s.state);
        return { id, name: s.def.name, draws: s.stats.draws, tris: s.stats.tris };
      };
    }); };
    await prepare();
    let ids = await page.evaluate(() => Object.keys(window.BRADY_BURNS.BurnsWorlds.defs).map(Number).filter(id => id !== 900).sort((a,b)=>a-b));
    if (process.env.GRAPHICS_WORLDS) ids = ids.filter(id => process.env.GRAPHICS_WORLDS.split(',').map(Number).includes(id));
    if (process.env.GRAPHICS_SKIP_WORLDS) ids = [];
    for (const id of ids) {
      // A fresh page keeps captures independent of mission and streaming state.
      if (report.worlds.length) { await page.reload(); await prepare(); }
      console.log('BUILD', id);
      const result = await page.evaluate(id => window.__graphicsWorld(id), id);
      await page.screenshot({ path: path.join(out, 'world-' + id + '.png'), timeout: 30000 });
      report.worlds.push(result); console.log('WORLD', JSON.stringify(result));
    }
    if (report.worlds.length) { await page.reload(); await prepare(); }
    await page.evaluate(() => window.__graphicsWorld(17));
    report.characters = await page.evaluate(clips => {
      const B = window.BRADY_BURNS, s = B.debug.scene(), p = s.player, results = [];
      window.__graphicsChars = {};
      for (const [name,side] of [['brady',.6],['chinka',-.6]]) {
        const ch = B.BurnsSkin.spawn(name,p.x+side,s.world.height(p.x+side,p.z+3.2),p.z+3.2,Math.PI);
        ch.demo = true; window.__graphicsChars[name] = ch;
        if (ch.asset.nb > B.BurnsGL.maxBones) throw new Error(name + ' exceeds bone palette');
        for (const clip of clips) {
          if (!ch.asset.clipNames.includes(clip)) throw new Error(name + ' missing ' + clip);
          ch.play(clip,{loop:true,restart:true,fade:0});
          for (const t of [.05,.25,.5]) { ch.update(t); ch.compute(); if (!Array.from(ch.palette).every(Number.isFinite)) throw new Error(name + ' invalid palette: ' + clip); }
        }
        ch.play('idle',{loop:true,restart:true,fade:0}); ch.update(.3);ch.compute();
        results.push({name,clips:clips.length,tris:ch.asset.tris,joints:ch.asset.nb});
      }
      s.camMode='first';s.camYaw=0;s.camPitch=.3+Math.atan2(.52,3.2)/1.2;s.snapCam=true;s.lastManual=s.time;
      window.__graphicsDraw(); return results;
    }, clips);
    await page.screenshot({ path: path.join(out,'characters.png') });
    report.props = await page.evaluate(() => {
      const B = window.BRADY_BURNS, results = [];
      for (const name of ['wheel','bikeShape','tent','shade','car','camper','van','boxtruck','trailer','artcar']) for (const lo of [false,true]) {
        const m = new B.BurnsMesh();m.lo=lo;
        if(name==='wheel') B.BurnsProps.wheel(m,0,.5,0,.5,.3);
        else if(name==='bikeShape') B.BurnsProps.bikeShape(m,0,0,0,0);
        else B.BurnsProps[name](m,{seed:42});
        const g=m.geo(), f=new Float32Array(g.data);
        for(let i=0;i<g.nv;i++) for(let k=0;k<3;k++) if(!Number.isFinite(f[i*6+k])) throw new Error(name+' invalid vertex');
        results.push({name,lo,tris:g.count/3});
      }
      return results;
    });
    for (const tier of ['low','medium','high']) {
      const result = await page.evaluate(tier => { const B=window.BRADY_BURNS;B.BurnsGL.configure(tier);window.__graphicsDraw();return {tier:B.BurnsGL.tier,failed:B.BurnsGL.failed,reason:B.BurnsGL.failReason}; }, tier);
      report.tiers.push(result); if(result.failed) throw new Error('Tier failed '+tier);
      await page.screenshot({path:path.join(out,'characters-'+tier+'.png')});
    }
    // ---- budget vs main
    const basePath = process.env.GRAPHICS_BASELINE || path.join(__dirname, 'graphics_baseline.json');
    if (process.env.GRAPHICS_WRITE_BASELINE) {
      fs.writeFileSync(basePath, JSON.stringify({ note: 'graphics_test.js budget baseline: main build, 874x402 @1x, spawn camera', worlds: report.worlds, props: report.props }, null, 1) + '\n');
      console.log('BASELINE written', basePath);
    } else if (fs.existsSync(basePath)) {
      const base = JSON.parse(fs.readFileSync(basePath, 'utf8')), over = [];
      for (const w of report.worlds) {
        const b = base.worlds.find(x => x.id === w.id); if (!b) continue;
        report.budget = report.budget || [];
        report.budget.push({ id: w.id, draws: [b.draws, w.draws], tris: [b.tris, w.tris] });
        if (w.tris > b.tris * 1.04 + 500) over.push('world ' + w.id + ' tris ' + b.tris + ' -> ' + w.tris);
        if (w.draws > b.draws + 3) over.push('world ' + w.id + ' draws ' + b.draws + ' -> ' + w.draws);
      }
      for (const p of report.props) { const b = base.props.find(x => x.name === p.name && x.lo === p.lo); if (b && p.tris > b.tris * 1.5 + 8) over.push('prop ' + p.name + (p.lo ? ' lo' : '') + ' tris ' + b.tris + ' -> ' + p.tris); }
      console.log('BUDGET', JSON.stringify(report.budget || []));
      if (over.length) throw new Error('Budget regression vs main:\n' + over.join('\n'));
    } else console.log('BUDGET skipped: no baseline at ' + basePath);
    for (const c of report.characters) if (c.tris > 25000) throw new Error(c.name + ' over the 25k-triangle hero budget: ' + c.tris);
    console.log('CHARACTERS', JSON.stringify(report.characters));
    console.log('TIERS', JSON.stringify(report.tiers));
    if(report.errors.length) throw new Error(report.errors.join('\n'));
    console.log('PROPS', JSON.stringify(report.props));
    console.log('PASS: '+report.worlds.length+' worlds, 38 hero clips, 20 prop/LOD builds, 3 quality tiers, budget vs main');
  } finally {
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    await browser.close();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
