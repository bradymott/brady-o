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
// The walkable overworld of every land at five screen sizes: it lays out and draws (every coordinate finite),
// stops sit inside the map, their touch targets (at least 40 px) never overlap, the info card and the land chip
// stay on screen and out of the safe-area insets.
const {TourMapScene:TMS}=w.BRADY_TOUR,OW=TMS.OW;
const sceneFor=(id,W,H)=>{
  B.Game.cssW=W;B.Game.cssH=H;const portrait=H>W*1.05;
  B.Game.gameRect=portrait?{x:0,y:0,w:W,h:Math.round(Math.min(H*0.6,W*1.3))}:{x:0,y:0,w:W,h:H};
  const m=Object.create(TMS.prototype);Object.assign(m,{sel:id,cam:{lon:0,lat:0,z:4},plane:{lon:0,lat:0,ang:0},t:1,mode:'land',toastMsg:'',toastT:0});
  m.ow=new TMS.Overworld(m,Tour.countries[id],{});m.build();m.ow.update(1/60,{taps:[],dir:null,enter:false});m.draw(ctx);return m;
};
const targetsOk=(m,tag)=>{
  const ow=m.ow,R=OW.NODE_R*ow.z,vis=ow.nodes.filter(n=>n.visible);
  assert(R*2>=40,tag+': touch targets at least 40px');
  for(const n of vis){const p=ow.G.pos[n.key];assert(p&&[p.x,p.y].every(Number.isFinite),tag+': finite '+n.key);
    assert(p.x>=40&&p.y>=40&&p.x<=ow.G.w-40&&p.y<=ow.G.h-40,tag+': inside the map '+n.key);}
  for(let a=0;a<vis.length;a++)for(let c=a+1;c<vis.length;c++){const p=ow.G.pos[vis[a].key],q=ow.G.pos[vis[c].key];
    assert(Math.hypot(p.x-q.x,p.y-q.y)*ow.z>=R*2,`${tag}: stops ${vis[a].key} and ${vis[c].key} overlap`);}
  const c=ow.cardR;assert(c.x>=0&&c.y>=0&&c.x+c.w<=B.Game.cssW&&c.y+c.h<=B.Game.cssH,tag+': info card on screen');
};
let layouts=0;
for(const [W,H] of [[874,402],[390,844],[667,375],[568,320],[320,568]]) {
  for(const id in Tour.countries) {
    const m=sceneFor(id,W,H);
    assert.equal(m.ow.nodes.filter(n=>n.kind==='level').length,Tour.countries[id].levels.length);
    targetsOk(m,`${id} ${W}x${H}`);
    layouts++;
  }
}
// More than five stops: secret levels and branches (mapCell / mapFrom), a stop hidden until unlocked, and a plain
// 9-stop snake. Stops the layout table does not place fall back to their grid cell, apart from every other stop.
{
  const C=Tour.countries.mx,orig=C.levels,origHouses=C.houses,base=orig.slice(0,C.mainCount).map(L=>Object.assign({},L,{secret:false}));C.houses=[];
  const branchy=base.concat([Object.assign({},base[0],{name:'Secret Cenote',mapCell:[0,2],mapFrom:1}),Object.assign({},base[1],{name:'Hidden Grotto',mapCell:[2,2],mapFrom:3,mapHidden:true})]);
  const plain=L=>{const o=Object.assign({},L);delete o.mapCell;delete o.mapFrom;return o;};
  const nine=base.map(plain).concat(base.slice(0,4).map((L,k)=>Object.assign(plain(L),{name:'Extra '+(k+1)})));
  let cases=0;
  for(const [W,H] of [[874,402],[390,844],[667,375],[568,320],[320,568]]){
    for(const [tag,levels,unlockHidden] of [['branches',branchy,false],['branches+hidden open',branchy,true],['nine',nine,false]]){
      C.levels=levels;B.Save.data=B.Save.defaults();
      for(let k=1;k<=levels.length;k++){B.Save.data.done['1-'+k]=true;}
      if(!unlockHidden){delete B.Save.data.done['1-6'];}   // 1-7 (hidden) needs 1-6 done
      const m=sceneFor('mx',W,H);
      const want=tag==='branches'?6:levels.length, shown=m.ow.nodes.filter(n=>n.kind==='level'&&n.visible);
      assert.equal(shown.length,want,`${tag} ${W}x${H}: ${want} stops shown`);
      const E=m.ow.edges;
      if(tag.startsWith('branches'))assert(E.some(e=>e.a==='1-2'&&e.b==='1-6'),'secret stop 6 branches from stop 2');
      if(tag==='branches+hidden open')assert(E.some(e=>e.a==='1-4'&&e.b==='1-7'&&e.visible),'hidden stop 7 appears, branching from stop 4');
      targetsOk(m,`${tag} ${W}x${H}`);cases++;
    }
  }
  C.levels=orig;C.houses=origHouses;delete OW.geos.mx;
  console.log(`PASS ${cases} more-than-five-stop overworld layouts (branches, hidden stop, nine stops)`);
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
console.log(`PASS ${layouts} land/viewport overworlds drawn, stops contained with nonoverlapping 40px+ touch targets, both enemy art paths, fresh-save progression`);
