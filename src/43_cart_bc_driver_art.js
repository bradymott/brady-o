/* Art Cart's sculpted driver art. Scoped by spec.cartArt; the adventure cast is unchanged.
   Retains all 16 animation joints and each driver's original costume and silhouette.
   No downloaded likeness assets or mannequin substitutions are used for these drivers. */
const CartDriverArt = {
  cache: {},
  head(m, A) {
    const { S, skin, fem, lo } = A, B = BURNS_BONES;
    const seed = hashStr(S.kind || 'driver'), old = /crusty|partied|ranger/.test(S.kind);
    const wide = fem ? 0.96 : 1 + (seed % 5 - 2) * 0.018;
    // A single continuous face: cheek planes, recessed temples, a defined jaw and chin.
    // The face is geometry rather than a smile texture wrapped over a ball.
    const levels = [[0.00,0.068,0.075],[0.035,0.103,0.119],[0.09,0.142,0.153],
      [0.15,0.162,0.165],[0.22,0.174,0.169],[0.29,0.171,0.168],
      [0.35,0.125,0.125],[0.395,0.062,0.067],[0.424,0.002,0.002]];
    const profile = y => {
      const f = y / 0.424 * (levels.length - 1), i = Math.min(levels.length - 2, Math.floor(f));
      const yy = y;
      for (let j=0;j<levels.length-1;j++) if(yy>=levels[j][0]&&yy<=levels[j+1][0]){
        const a=levels[j],b=levels[j+1],t=(yy-a[0])/(b[0]-a[0]);
        return [lerp(a[1],b[1],t)*wide,lerp(a[2],b[2],t)];
      }
      return [levels[i][1],levels[i][2]];
    };
    m.setBone(B.HEAD); m.color(skin).shine(0);
    m.surf(lo ? 20 : 40, lo ? 14 : 28, (u,v,p) => {
      const th=u*TAU, y=v*0.424, r=profile(y), front=Math.max(0,Math.cos(th));
      const cheek=Math.exp(-Math.pow((y-0.19)/0.06,2))*Math.pow(Math.sin(th*2),2)*front*0.009;
      p[0]=Math.sin(th)*r[0]; p[1]=y; p[2]=0.008+Math.cos(th)*r[1]+cheek;
    }, {wrapU:true,out:[0,0.21,0],colFn:(u,v)=>{
      const front=Math.max(0,Math.cos(u*TAU)), y=v*0.424;
      const beard=S.kind==='brady'||S.beard||/crusty|dpw/.test(S.kind);
      return burnsRGB(shade(skin, beard&&front>0.4&&y<0.135 ? -0.22 : -0.025+0.025*front));
    }});
    for(const s of [-1,1]){
      m.color(shade(skin,-0.05));m.ellipsoid(s*0.175*wide,0.211,-0.003,0.026,0.047,0.03,{seg:lo?8:12,rings:lo?5:8});
      m.color(shade(skin,-0.21));m.ellipsoid(s*0.187*wide,0.211,0.013,0.011,0.026,0.008,{seg:8,rings:5});
    }
    // Nose bridge, rounded tip and nostril wings blend into the cheek plane.
    m.color(skin);m.limb(0,0.259,0.16,0,0.185,0.208,0.014,0.023,{seg:lo?8:14});
    m.ellipsoid(0,0.18,0.207,0.026,0.019,0.025,{seg:lo?10:16,rings:8});
    for(const s of [-1,1]){
      m.ellipsoid(s*0.022,0.176,0.191,0.016,0.012,0.015,{seg:8,rings:5});
      m.color(shade(skin,-0.35));m.ellipsoid(s*0.018,0.168,0.199,0.006,0.003,0.007,{seg:6,rings:4});m.color(skin);
    }
    const eyes=S.glasses||S.hood||S.goggles;
    if(!eyes) for(const s of [-1,1]){
      const x=s*0.065, y=old?0.239:0.247;
      m.color(shade(skin,-0.18));m.ellipsoid(x,y,0.159,0.047,0.026,0.012,{seg:lo?10:16,rings:8});
      m.color('#f3ece0').shine(1);m.ellipsoid(x,y,0.168,0.036,0.018,0.01,{seg:lo?10:18,rings:8});
      m.color(S.kind==='chinka'?'#563823':'#597b78').shine(2);m.ellipsoid(x-s*0.003,y,0.178,0.013,0.014,0.004,{seg:12,rings:8});
      m.color('#101820');m.ellipsoid(x-s*0.003,y,0.182,0.006,0.008,0.002,{seg:8,rings:5});
      m.color('#fff9e9',0.2);m.ball(x-s*0.006,y+0.006,0.184,0.0035,{seg:6,rings:4});m.emissive(0).shine(0);
      m.color(S.hair?.col||'#302320');
      m.limb(x-s*0.033,y+0.035,0.164,x+s*0.028,y+0.031,0.16,0.009,0.006,{seg:lo?6:10});
    }
    // A restrained smile with modeled lips; no giant white strip or painted cheek dots.
    const lip= fem?'#ab6861':shade(skin,-0.22), n=lo?8:18;
    for(let i=0;i<n;i++){
      const x0=(i/n-0.5)*0.091,x1=((i+1)/n-0.5)*0.091;
      const yy=x=>0.113+0.011*Math.pow(x/0.046,2);
      m.color('#704b43');m.limb(x0,yy(x0),0.176,x1,yy(x1),0.176,0.0025,0.0025,{seg:4});
      m.color(lip);m.limb(x0,yy(x0)-0.007,0.174,x1,yy(x1)-0.007,0.174,0.004,0.004,{seg:4});
    }
    if(old&&!lo)for(const s of [-1,1]){
      m.color(shade(skin,-0.13));m.limb(s*0.107,0.222,0.147,s*0.133,0.216,0.127,0.002,0.001,{seg:4});
    }
    m.shine(0);
  },
  bun(m,A) {
    const col=A.S.hair.col, hi=shade(col,0.12), B=BURNS_BONES;
    m.setBone(B.HEAD);m.color(col).shine(0);
    // Pulled-back hair ends above the nape; no sheet or curtain behind the neck.
    A.hairCap({front:0.67,side:1.25,sideburn:1.58,back:1.76,vol:0.014,lumps:0.001,lumpN:16});
    m.color(col).shine(0);
    m.ellipsoid(0,0.414,-0.115,0.091,0.072,0.084,{seg:A.lo?12:24,rings:A.lo?8:14});
    m.color('#111218');m.push();m.tf(0,0.374,-0.093,0,0.5);m.torus(0,0,0,0.043,0.009,{seg:16,tseg:5});m.pop();
    if(!A.lo) for(let i=0;i<9;i++){
      const t=i/8, a=-1.2+t*2.4;
      m.color(i%3?col:hi);m.limb(Math.sin(a)*0.073,0.431+Math.cos(a)*0.048,-0.148,
        Math.sin(a+0.25)*0.068,0.401,-0.184,0.006,0.004,{seg:6});
    }
    m.shine(0);
  },
  hair(m,A) {
    if(A.S.kind==='brady'){this.bun(m,A);return true;}
    const H=A.S.hair||{},style=H.style;
    if(!['wavy','long','down','wig','bob','pony'].includes(style))return false;
    const B=BURNS_BONES,col=H.col||'#271c20',short=style==='bob';
    m.setBone(B.HEAD);m.color(col).shine(0);
    A.hairCap({front:0.72,side:1.32,sideburn:1.85,back:2.2,vol:0.025,lumps:0.003,lumpN:9});
    m.setBone(B.HAIR);
    const n=A.lo?9:17;
    for(let i=0;i<n;i++){
      const th=0.93+i/(n-1)*(TAU-1.86),drop=short?0.39:0.59+0.05*Math.sin(i*2.3);
      const width=A.lo?0.049:0.034;
      m.color(i%4===0?shade(col,0.055):col).shine(0);
      m.surf(A.lo?6:10,A.lo?8:15,(u,v,p)=>{
        const a=u*TAU,phase=v*7.5+i*0.72;
        const rr=0.17+Math.sin(v*Math.PI)*0.035, wave=Math.sin(phase)*0.028*v;
        const radius=width*Math.pow(Math.sin(Math.PI*(0.12+v*0.88)),0.6);
        const theta=th+0.22*Math.sin(phase)*v;
        p[0]=Math.sin(theta)*(rr+wave)+Math.cos(a)*radius;
        p[1]=0.345-v*drop-0.34;
        p[2]=0.012+Math.cos(theta)*(rr+wave)*1.08-0.012*v+Math.sin(a)*radius*0.62+0.12;
      },{wrapU:true,out:true});
    }
    m.shine(0);return true;
  },
  shades(m,A) {
    m.setBone(BURNS_BONES.HEAD);
    for(const s of [-1,1]){
      m.push();m.tf(s*0.068,0.249,0.18,s*0.17);
      m.color('#0d1017').shine(1);m.roundBox(0,0,0,0.112,0.073,0.025,0.012,{k:A.lo?1:3,m:1});
      m.color('#172535').shine(2);m.roundBox(0,0,0.014,0.091,0.05,0.008,0.008,{k:2,m:1});
      if(!A.lo){m.color('#4e667c').shine(1);m.limb(-0.033,0.016,0.02,0.01,0.019,0.02,0.002,0.001,{seg:4});}
      m.pop();m.color('#0d1017').shine(1);
      m.limb(s*0.114,0.26,0.168,s*0.176,0.25,-0.006,0.007,0.007,{seg:6});
    }
    m.color('#0c1017').shine(1);m.limb(-0.024,0.255,0.194,0.024,0.255,0.194,0.007,0.007,{seg:6});m.shine(0);
  },
  tailor(m,A) {
    if(A.lo)return;
    const {S,B,C,h,w}=A;
    m.setBone(B.CHEST);
    // Collar binding, shoulder seams and draped hem give cloth a constructed edge.
    if(S.top&&S.top.kind!=='none'){
      m.color(shade(C.top,0.12)).shine(0);
      m.push();m.tf(0,0.471*h,0,0,0,0,1,1,0.7);m.torus(0,0,0,0.069,0.009,{seg:20,tseg:5});m.pop();
      for(const s of [-1,1]){
        m.limb(s*0.077,0.466*h,0.052,s*0.176*w,0.408*h,0.065,0.004,0.003,{seg:5});
        m.color(shade(C.top,0.065));m.limb(s*0.105*w,0.035*h,0.104,s*0.123*w,0.115*h,0.11,0.006,0.002,{seg:5});
      }
    }
    if(S.kind==='brady'){
      for(const s of [-1,1]){
        m.setBone(s>0?B.FARM_L:B.FARM_R);m.color('#111318').shine(1);
        m.push();m.tf(0,-0.201*h,0,0,0,0,1,1,0.86);m.torus(0,0,0,0.043,0.008,{seg:14,tseg:5});m.pop();
      }
    }
    m.shine(0);
  },
  spec(id) {
    const d=cartDriver(id), S=d.type==='brady'?BurnsRig.bradySpec('none'):d.type==='chinka'?BurnsRig.chinkaSpec():BurnsRig.npcSpec(d.type,3,{prop:null});
    S.cartArt=true;S.key='cart-atelier-v1:'+id;S.prop=null;S.prop2=null;
    S.acc=(S.acc||[]).concat('cartTailoring');
    if(d.type==='brady'){
      S.hair={style:'bun',col:'#34271f',hi:'#534034'};
      S.top={kind:'tee',col:'#17191e'};
      S.bottom={kind:'chinos',col:'#14161b',pattern:null,belt:'#0b0d11'};
      S.shoes={kind:'sneakers',col:'#101216',sole:'#181b21',laceCol:'#202329',stripe:'#202329'};
      S.tattoos=true;S.glasses='shades';S.skin='#d6aa8b';S.body={h:1.04,w:1.05};
    }
    if(d.type==='chinka'){
      S.hair={style:'wavy',col:'#211b20',hi:'#49353c'};
      S.body={h:0.97,w:0.92,fem:true};S.skin='#d0a080';
    }
    return S;
  }
};
BURNS_GEAR.acc.cartTailoring=(m,A)=>CartDriverArt.tailor(m,A);
// High-contrast blackwork geometry covers both upper arms and forearms, not a decal medallion.
BURNS_ATLAS.addPattern('cartSacredSleeve',(x)=>{
  x.strokeStyle='#191c22';x.lineWidth=2.1;
  for(let row=-1;row<5;row++)for(let col=-1;col<5;col++){
    const cx=col*32+(row%2?16:0),cy=row*28;
    x.beginPath();x.arc(cx,cy,22,0,TAU);x.stroke();
    x.beginPath();for(let k=0;k<7;k++){const a=k/6*TAU,px=cx+Math.cos(a)*18,py=cy+Math.sin(a)*18;k?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
  }
  x.lineWidth=3;for(const y of [4,60,124]){x.beginPath();x.moveTo(0,y);x.lineTo(128,y);x.stroke();}
});
const cartOriginalDriverModel=CartDrivers.model.bind(CartDrivers);
CartDrivers.model=function(id){
  const d=cartDriver(id);if(d.type==='man')return cartOriginalDriverModel(id);
  if(CartDriverArt.cache[id])return CartDriverArt.cache[id];
  const S=CartDriverArt.spec(id), M=BurnsRig.model(S);
  M.cartArt=true;
  // Adult stylization: scale the complete head (including hair and headwear) coherently,
  // while preserving the neck and every animation pivot.
  if(!S.fursuit)for(const G of [M.geo,M.lod,M.far]){
    const F=new Float32Array(G.data),U8=new Uint8Array(G.data);
    for(let i=0;i<G.nv;i++){
      const b=U8[i*24+15]&63;
      if(b===BURNS_BONES.HEAD&&F[i*6+1]>0){
        F[i*6]*=0.87;F[i*6+1]*=0.87;F[i*6+2]*=0.87;
      }else if(b===BURNS_BONES.HAIR){
        F[i*6]*=0.87;F[i*6+1]=(F[i*6+1]+0.34)*0.87-0.34;F[i*6+2]=(F[i*6+2]-0.12)*0.87+0.12;
      }
    }
  }
  if(d.type==='brady'){
    const old=BURNS_ATLAS.pattern('tattoo'), ink=BURNS_ATLAS.pattern('cartSacredSleeve');
    for(const G of [M.geo,M.lod,M.far]){
      const U=new Uint16Array(G.data),U8=new Uint8Array(G.data);
      for(let i=0;i<G.nv;i++){
        const b=U8[i*24+15]&63;if(![3,4,5,6].includes(b))continue;
        const u=U[i*12+10]/65535,v=U[i*12+11]/65535;
        if(u>=old.u0-0.001&&u<=old.u1+0.001&&v>=old.v0-0.001&&v<=old.v1+0.001){
          U[i*12+10]=Math.round(lerp(ink.u0,ink.u1,clamp((u-old.u0)/(old.u1-old.u0),0,1))*65535);
          U[i*12+11]=Math.round(lerp(ink.v0,ink.v1,clamp((v-old.v0)/(old.v1-old.v0),0,1))*65535);
        }
      }
    }
  }
  return CartDriverArt.cache[id]={model:M,scale:1};
};
// Character files shared with Burning Man must not overwrite Art Cart's intentional art direction.
for(const method of ['draw','drawDriver']){
  const original=BurnsSkinActor[method];
  BurnsSkinActor[method]=function(...args){
    const ch=method==='draw'?args[3]:args[2];
    if(ch&&ch.model&&ch.model.cartArt)return false;
    return original.apply(this,args);
  };
}
if(typeof window!=='undefined')window.BRADY_BURNS.CartDriverArt=CartDriverArt;
