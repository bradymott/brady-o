// Non-browser regression checks for the country map, render paths and touch targets.
// node tools/graphics_test.js (build first)
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
// Actual render dispatch: loaded sprite enemies must use Ink too.
const Enemy=w.BRADY_TYPES.mxElote;
const g={t:1,level:{country:'mx'},burst(){}};
const e=new Enemy(g,{x:100,y:100});
const old=B.Ink.ent;let inked=0;B.Ink.ent=(c,e,fn)=>{inked++;fn(c);};
e.draw(ctx); assert.equal(inked,1);
B.Atlas.atlases.mx={ready:true,meta:{frames:{},anims:{}},img:{},scale:3};
e.draw(ctx);assert.equal(inked,2,'loaded atlas must keep the ink pass');B.Ink.ent=old;
// Fresh saves still open only the first stage; layout must not mutate progression.
B.Save.data=B.Save.defaults();
assert(TourProgress.isUnlocked('1-1'));assert(!TourProgress.isUnlocked('1-2'));
console.log(`PASS ${layouts} country/viewport layouts, contained and nonoverlapping touch targets, both enemy art paths, fresh-save progression`);
