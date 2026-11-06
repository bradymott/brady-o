// Focused regression for story composition, shared timber Man, and distance-driven locomotion.
// Build first; run: node tools/cinematic_test.js [output-directory]
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const out=path.resolve(process.argv[2]||'shots/cinematic'),site=path.resolve(process.env.BRADY_DIST||'dist','site');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const errors=[],report={movement:[],framing:[],errors};
 const srv=http.createServer((q,r)=>{const p=decodeURIComponent(q.url.split('?')[0]),f=path.resolve(site,'.'+p+(p.endsWith('/')?'index.html':''));if(!f.startsWith(site+path.sep)||!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'application/octet-stream');fs.createReadStream(f).pipe(r)});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const ctx=await browser.newContext({viewport:{width:874,height:402},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await ctx.addInitScript(()=>{window.requestAnimationFrame=f=>1});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto('http://127.0.0.1:'+srv.address().port+'/burning-man/');
  await p.waitForFunction(()=>!!window.BRADY_BURNS,null,{polling:100});
  report.movement=await p.evaluate(async()=>{
   const B=window.BRADY_BURNS,A=await B.BurnsSkin.preload('models/brady.glb.gz'),out=[];
   for(const clip of ['walk','run'])for(const fps of [30,60,120])for(const scale of [1,2]){
    const actor=new B.BurnsSkinActor('brady',A,false),ch={anim:clip,animT:0,k:{rate:.5},scale,x:0,y:0,z:0,yaw:0};actor.sync(ch);
    const cycle=clip==='walk'?1.45:3,metres=cycle*scale*2;
    for(let i=0;i<fps;i++){ch.z+=metres/fps;ch.animT+=1/fps;actor.sync(ch)}
    const cycles=actor.S.animT/A.clips[clip].duration;
    if(Math.abs(cycles-2)>.0001)throw Error('Distance/cadence mismatch '+clip+' '+fps);
    const t=actor.S.animT;ch.animT+=1;actor.sync(ch);
    if(actor.S.animT!==t)throw Error('Feet cycle while blocked');
    ch.z+=100;ch.animT+=.016;actor.sync(ch);if(actor.S.animT!==t)throw Error('Teleport advances stride');
    out.push({clip,fps,scale,metres,cycles});
   }
   for(const asset of [A,await B.BurnsSkin.preload('models/chinka.glb.gz')])for(const clip of asset.clipNames){const ch=new B.BurnsSkinnedChar(asset);ch.play(clip,{fade:0,restart:true});for(const dt of [.05,.25,.5]){ch.update(dt);ch.compute();if(!Array.from(ch.palette).every(Number.isFinite))throw Error('Invalid rig '+clip)}}
   return out;
  });
  await p.evaluate(async()=>{const B=window.BRADY_BURNS;await B.BurnsGLBProps.preload();B.debug.play(17,{fresh:true});const s=B.debug.scene();s.load();B.debug.skipCine();s.fade=0;s.dayCardT=-1;s.banners=[];const a=s.actor('jefr');window.__storyActor=a;
   // No authored camera: the shared framing must also handle say-only story beats.
   s.cutscene([{say:[a,['Every root needs soil. You are with us now.']]}]);s.lbK=1;s.dialog.chars=999;s.draw(window.BRADY.Game.ctx)});
  for(const [tag,w,h]of [['landscape',874,402],['portrait',390,844]]){
   await p.setViewportSize({width:w,height:h});
   await p.evaluate(()=>{window.BRADY.Game.resize()});
   const r=await p.evaluate(()=>{const B=window.BRADY_BURNS,s=B.debug.scene(),a=window.__storyActor;s.draw(window.BRADY.Game.ctx);const head={},feet={};s.R.project(a.x,a.y+a.model.height,a.z,1,1,head);s.R.project(a.x,a.y,a.z,1,1,feet);const post=s.postFx(B.BurnsEnv.build('day',null,0,{},0));if(post.dof!==null)throw Error('Default story blur enabled');if(Math.abs(head.x-.5)>.06||head.y<.1||feet.y>.79)throw Error('Subject outside safe frame');return{head,feet,dof:post.dof}});
   await p.screenshot({path:path.join(out,tag+'.png'),timeout:30000});report.framing.push({tag,...r});
  }
  report.man=await p.evaluate(()=>{const B=window.BRADY_BURNS,s=B.debug.scene(),m=new B.BurnsManBoss(s,{x:0,z:0,holdChinka:false}).model,ch=new B.BurnsChar(m);ch.play('idle',{},true);ch.update(.1);ch.compute();if(ch.P.r[11]<2||ch.P.r[17]>-2)throw Error('Landmark arms not raised');if(!Array.from(ch.bones).every(Number.isFinite))throw Error('Invalid Man rig');return{triangles:m.geo.count/3,nb:m.nb}});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS',JSON.stringify(report));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>srv.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
