// Non-browser regression checks for the country map, render paths and touch targets.
// node tools/sbw_graphics_test.js (build first; BRADY_DIST=<folder> for a private build)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const calls = [];
const ctx = new Proxy({}, {
  get(t,k) {
    if(k in t) return t[k];
    if(k === 'measureText') return s => ({width:String(s).length * 6});
    if(k === 'getTransform') return () => ({a:1,b:0,c:0,d:1,e:0,f:0});
    if(k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({addColorStop(){}});
    return (...args) => { for(const a of args) if(typeof a === 'number') assert(Number.isFinite(a), `${k}: nonfinite coordinate`); calls.push(k); };
  }, set(t,k,v) {t[k]=v;return true;}
});
const canvas = () => ({width:900,height:450,style:{},getContext:()=>ctx,addEventListener(){}});
const w = {console,Math,Date,JSON,setTimeout,clearTimeout,performance:{now:()=>0},
  navigator:{userAgent:'node',getGamepads:()=>[]},localStorage:{getItem:()=>null,setItem(){}},
  matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},requestAnimationFrame(){},
  document:{readyState:'loading',createElement:canvas,getElementById:canvas,addEventListener(){},body:{}},
  Image:function(){},Path2D:function(){return ctx}};
w.window=w;vm.createContext(w);
const root=path.join(__dirname,'..'),dist=process.env.BRADY_DIST || path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'site/super-brady-o-world/index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
vm.runInContext(scripts.find(s=>s.includes('const BRADY_APP')),w);
const B=w.BRADY,{Tour,TourProgress,TourMapScene}=w.BRADY_TOUR;
B.Save.data=B.Save.defaults();
for(const id of Tour.allLevelIds()) {B.Save.data.done[id]=true; B.Save.data.gold[id]=[true,true,true];}
let layouts=0;
for(const [W,H] of [[874,402],[390,844],[667,375],[568,320],[320,568]]) {
  B.Game.cssW=W;B.Game.cssH=H;
  for(const id in Tour.countries) {
    const m=Object.create(TourMapScene.prototype);
    Object.assign(m,{sel:id,cam:{z:4},plane:{lon:0,lat:0},t:1,focus:0});m.build();m.drawPanel(ctx);
    assert.equal(m.stamps.length,Tour.countries[id].levels.length);
    for(const b of m.stamps) {
      assert([b.x,b.y,b.w,b.h].every(Number.isFinite));
      assert(b.x>=m.panelR.x && b.x+b.w<=m.panelR.x+m.panelR.w);
      assert(b.y>=m.panelR.y && b.y+b.h<=m.panelR.y+m.panelR.h);
    }
    for(let a=0;a<m.stamps.length;a++)for(let b=a+1;b<m.stamps.length;b++) {
      const x=m.stamps[a],y=m.stamps[b];
      assert(!(x.x<y.x+y.w&&x.x+x.w>y.x&&x.y<y.y+y.h&&x.y+x.h>y.y), `${id} ${W}x${H}: overlapping hit targets`);
    }
    layouts++;
  }
}
// More than five stops: secret levels and branches (mapCell / mapFrom), a stop hidden until unlocked, and a plain
// 9-stop snake. Every stop gets its own non-overlapping, contained target at every viewport size.
const stampsOk=(m,tag)=>{
  for(const b of m.stamps){assert([b.x,b.y,b.w,b.h,b.cx,b.cy].every(Number.isFinite),tag+': finite');
    assert(b.x>=m.panelR.x&&b.x+b.w<=m.panelR.x+m.panelR.w&&b.y>=m.panelR.y&&b.y+b.h<=m.panelR.y+m.panelR.h,tag+': inside the panel');
    assert(b.w>=40&&b.h>=40,tag+': targets at least 40px');}
  for(let a=0;a<m.stamps.length;a++)for(let c=a+1;c<m.stamps.length;c++){const x=m.stamps[a],y=m.stamps[c];
    assert(!(x.x<y.x+y.w&&x.x+x.w>y.x&&x.y<y.y+y.h&&x.y+x.h>y.y),`${tag}: stops ${x.i} and ${y.i} overlap`);}
};
{
  const C=Tour.countries.mx,orig=C.levels,base=orig.map(L=>Object.assign({},L));
  const branchy=base.concat([Object.assign({},base[0],{name:'Secret Cenote',mapCell:[0,2],mapFrom:1}),Object.assign({},base[1],{name:'Hidden Grotto',mapCell:[2,2],mapFrom:3,mapHidden:true})]);
  const plain=L=>{const o=Object.assign({},L);delete o.mapCell;delete o.mapFrom;return o;};
  const nine=base.map(plain).concat(base.slice(0,4).map((L,k)=>Object.assign(plain(L),{name:'Extra '+(k+1)})));
  let cases=0;
  for(const [W,H] of [[874,402],[390,844],[667,375],[568,320],[320,568]]){
    B.Game.cssW=W;B.Game.cssH=H;
    for(const [tag,levels,unlockHidden] of [['branches',branchy,false],['branches+hidden open',branchy,true],['nine',nine,false]]){
      C.levels=levels;B.Save.data=B.Save.defaults();
      for(let k=1;k<=levels.length;k++){B.Save.data.done['1-'+k]=true;}
      if(!unlockHidden){delete B.Save.data.done['1-6'];}   // 1-7 (hidden) needs 1-6 done
      const m=Object.create(TourMapScene.prototype);Object.assign(m,{sel:'mx',cam:{z:4},plane:{lon:0,lat:0},t:1,focus:0});m.build();m.drawPanel(ctx);
      const want=tag==='branches'?6:levels.length;
      assert.equal(m.stamps.length,want,`${tag} ${W}x${H}: ${want} stops shown`);
      if(tag.startsWith('branches')){const s6=m.stamps.find(b=>b.i===6);assert(s6&&s6.from===1,'secret stop 6 branches from stop 2');}
      if(tag==='branches+hidden open'){const s7=m.stamps.find(b=>b.i===7);assert(s7&&s7.from===3,'hidden stop 7 appears, branching from stop 4');}
      stampsOk(m,`${tag} ${W}x${H}`);cases++;
    }
  }
  C.levels=orig;
  console.log(`PASS ${cases} more-than-five-stop layouts (branches, hidden stop, nine stops)`);
}
// Render dispatch: atlas art has its outline baked in, so only the procedural fallback goes through Ink, decided
// per frame actually drawn (an atlas can be loaded yet have no art for this kind or mode).
const Enemy=w.BRADY_TYPES.mxElote;
const g={t:1,level:{country:'mx'},burst(){}};
const e=new Enemy(g,{x:100,y:100});
const old=B.Ink.ent;let inked=0;B.Ink.ent=(c,e,fn)=>{inked++;fn(c);};
e.draw(ctx); assert.equal(inked,1,'no atlas: procedural art is inked');
B.Atlas.atlases.mx={ready:true,meta:{frames:{},anims:{}},img:{},scale:3};
e.draw(ctx);assert.equal(inked,2,'atlas loaded but without this enemy: the procedural fallback is still inked');
const fr={x:0,y:0,w:30,h:30,ox:15,oy:30};
B.Atlas.atlases.mx.meta.frames[e.cfg.sprite+'_walk_000']=fr;
e.mode='walk';e.draw(ctx);assert.equal(inked,2,'atlas frame drawn: no second ink pass');
e.mode='stun';e.draw(ctx);assert.equal(inked,2,'missing mode falls back to an atlas frame: no ink');
e.knocked=true;e.draw(ctx);assert.equal(inked,2,'knocked out: falls back to the walk frame, no ink');
e.knocked=false;delete B.Atlas.atlases.mx;B.Ink.ent=old;
// Fresh saves still open only the first stage; layout must not mutate progression.
B.Save.data=B.Save.defaults();
assert(TourProgress.isUnlocked('1-1'));assert(!TourProgress.isUnlocked('1-2'));
console.log(`PASS ${layouts} country/viewport layouts, contained and nonoverlapping touch targets, both enemy art paths, fresh-save progression`);
