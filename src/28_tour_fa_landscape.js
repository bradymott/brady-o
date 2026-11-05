/* Country dioramas for the tour. All coordinates are CSS pixels; stamps remain
   the existing input targets, and progression, saves and flight logic stay intact. */
const TourLandscape = {
  // sky, water, far hills, land, light land, path, regional landmark
  looks: {
    mx: ['#f5c887','#48a8b5','#b98b85','#75a565','#b7cf7b','#f9dea0','pyramid'],
    ec: ['#b9e6e7','#409eae','#799aa0','#5d9f7b','#a5c68d','#f4e4b7','volcano'],
    br: ['#bce5ee','#39a8bb','#6d9faa','#68aa69','#b3cf79','#fff0b3','rio'],
    mz: ['#c8edef','#42b9c3','#8eb4a2','#85b875','#e2d99b','#fff0c8','palm'],
    ma: ['#f1d7b4','#559fae','#bf9d98','#bf9870','#e4c896','#fff0c9','gate'],
    es: ['#f6ddb2','#56b9c7','#b4aaa4','#8ca56c','#d7c789','#fff0bf','dome'],
    fr: ['#ddddea','#689eaf','#a09db9','#85ac91','#c1d1a6','#f8edcd','tower'],
    nl: ['#d7ebee','#5ea4b7','#9aadb7','#8bb481','#c6d494','#fff0c4','mill'],
    id: ['#f3d7c8','#58b7be','#9899ae','#64a47f','#b9c582','#ffe6b4','temple'],
    vn: ['#d5e8cf','#6aafa9','#91b5a5','#659b74','#bac784','#f5e5ac','karst'],
    jp: ['#f1dce7','#79b3c0','#a39ebc','#86ae94','#d1d7ab','#fff1d5','torii'],
    np: ['#dceaf4','#7cacc4','#a3b4cc','#a6b9ae','#e6e6d8','#f7e8c8','stupa'],
    aq: ['#d6edf6','#4b97ba','#92b8cd','#bed9df','#edf7ee','#eaf4fb','ice'],
    w22:['#d8c6ec','#8876b9','#a19acc','#9ba5c2','#d3d4b5','#fff0c8','temple']
  },
  look(id) { return this.looks[id] || this.looks.mx; },
  // Original vector miniatures, inspired by the actual destinations.
  landmark(ctx, kind, x, y, size, ink, accent) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 2;
    ctx.strokeStyle = ink || '#3d5362'; ctx.fillStyle = accent || '#ffdf95';
    const poly = pts => { ctx.beginPath(); pts.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const line = (a,b,c,d) => { ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); };
    switch (kind) {
      case 'pyramid':
        poly([[-23,0],[-23,-6],[-17,-6],[-17,-13],[-11,-13],[-11,-20],[-6,-20],[-6,-27],[6,-27],[6,-20],[11,-20],[11,-13],[17,-13],[17,-6],[23,-6],[23,0]]);
        line(-4,0,-4,-21); line(4,0,4,-21); for(let i=1;i<6;i++) line(-4,-i*3,4,-i*3); break;
      case 'volcano': case 'ice': case 'karst':
        poly([[-25,0],[-13,-18],[-7,-35],[0,-29],[8,-36],[17,-12],[25,0]]);
        ctx.fillStyle = '#f6f2df'; poly([[-13,-18],[-7,-35],[0,-29],[8,-36],[14,-20],[7,-23],[1,-19],[-6,-25]]); break;
      case 'rio':
        poly([[-25,0],[-17,-20],[-10,-25],[-4,-11],[5,-33],[12,-37],[20,-19],[26,0]]);
        ctx.strokeStyle = '#fff4d8'; ctx.lineWidth=3; line(11,-37,11,-52); line(3,-46,19,-46); break;
      case 'tower':
        poly([[-19,0],[-9,-20],[-3,-42],[0,-55],[3,-42],[9,-20],[19,0],[9,0],[0,-13],[-9,0]]);
        line(-9,-19,9,-19); line(-5,-31,5,-31); break;
      case 'mill':
        poly([[-12,0],[-8,-27],[7,-27],[12,0]]); poly([[-11,-27],[0,-38],[11,-27]]);
        ctx.strokeStyle='#fff3d7'; ctx.lineWidth=4; line(-19,-43,19,-9); line(19,-43,-19,-9); ctx.fillStyle='#334f63'; ctx.beginPath();ctx.arc(0,-26,3,0,TAU);ctx.fill(); break;
      case 'torii':
        ctx.fillStyle = '#db6c64'; poly([[-17,0],[-15,-31],[-9,-31],[-10,0]]);poly([[10,0],[9,-31],[15,-31],[17,0]]);
        poly([[-25,-36],[-14,-33],[14,-33],[25,-36],[23,-30],[-23,-30]]); poly([[-20,-23],[20,-23],[20,-19],[-20,-19]]); break;
      case 'palm':
        ctx.strokeStyle='#8b7555';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(5,-17,1,-34);ctx.stroke();
        ctx.strokeStyle='#3c816a';ctx.lineWidth=5;
        for(let i=0;i<5;i++){const a=-Math.PI+i*Math.PI/4;ctx.beginPath();ctx.moveTo(1,-34);ctx.quadraticCurveTo(Math.cos(a)*15,-43+Math.sin(a)*4,Math.cos(a)*24,-28+Math.sin(a)*14);ctx.stroke();}break;
      case 'gate':
        poly([[-23,0],[-23,-34],[-16,-34],[-16,-29],[16,-29],[16,-34],[23,-34],[23,0]]);
        ctx.fillStyle='#826e71';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(-8,-13);ctx.bezierCurveTo(-15,-23,15,-23,8,-13);ctx.lineTo(8,0);ctx.fill();break;
      case 'dome': case 'stupa':
        poly([[-22,0],[-22,-8],[22,-8],[22,0]]);ctx.beginPath();ctx.arc(0,-8,16,Math.PI,TAU);ctx.fill();ctx.stroke();
        poly([[-5,-24],[-5,-34],[5,-34],[5,-24]]);line(0,-34,0,-46);if(kind==='stupa'){ctx.strokeStyle='#e68a7d';line(-23,-25,23,-25);}break;
      default:
        for(let i=0;i<4;i++){const w=22-i*4,yy=-i*9;poly([[-w,yy],[0,yy-12],[w,yy],[w-4,yy+3],[-w+4,yy+3]]);}line(-8,-3,-8,2);line(8,-3,8,2);
    }
    ctx.restore();
  },
  scenery(ctx, R, id, t) {
    const c = this.look(id), X=R.x, Y=R.y, W=R.w, H=R.h;
    ctx.save();ctx.beginPath();rr(ctx,X,Y,W,H,18);ctx.clip();
    const sky=ctx.createLinearGradient(0,Y,0,Y+H);sky.addColorStop(0,c[0]);sky.addColorStop(1,c[1]);ctx.fillStyle=sky;ctx.fillRect(X,Y,W,H);
    // Broad, quiet shapes keep the five route nodes easy to find.
    ctx.fillStyle='rgba(255,250,229,0.58)';ctx.beginPath();ctx.arc(X+W*.81,Y+H*.18,22,0,TAU);ctx.fill();
    for(let i=0;i<3;i++){const xx=X+W*(.12+i*.34)+Math.sin(t*.12+i)*4,yy=Y+H*(.12+(i%2)*.08);ctx.fillStyle='rgba(255,255,255,0.38)';rr(ctx,xx,yy,47,7,4);ctx.fill();}
    ctx.fillStyle=c[2];ctx.beginPath();ctx.moveTo(X,Y+H*.56);
    for(let i=0;i<=8;i++)ctx.lineTo(X+W*i/8,Y+H*(i%2?.43:.26));ctx.lineTo(X+W,Y+H);ctx.lineTo(X,Y+H);ctx.fill();
    // Raised island: dark water shadow, sandy shoreline, green plateau.
    for(const [dy,col] of [[9,c[1]],[4,c[5]],[0,c[3]]]){ctx.save();ctx.translate(0,dy);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(X+W*.06,Y+H*.83);ctx.bezierCurveTo(X-W*.04,Y+H*.56,X+W*.18,Y+H*.08,X+W*.51,Y+H*.18);ctx.bezierCurveTo(X+W*.95,Y+H*.07,X+W*1.04,Y+H*.61,X+W*.89,Y+H*.82);ctx.quadraticCurveTo(X+W*.56,Y+H*1.08,X+W*.06,Y+H*.83);ctx.fill();ctx.restore();}
    ctx.strokeStyle=c[4];ctx.lineWidth=2;
    for(let i=0;i<9;i++){const xx=X+W*(.13+((i*37)%73)/100),yy=Y+H*(.35+((i*19)%49)/100);ctx.beginPath();ctx.moveTo(xx-4,yy);ctx.lineTo(xx-2,yy-4);ctx.lineTo(xx,yy);ctx.stroke();}
    this.landmark(ctx,c[6],X+W*.81,Y+H*.36,Math.min(40,W*.13),c[2],c[5]);
    this.landmark(ctx,c[6],X+W*.13,Y+H*.63,Math.min(22,W*.08),c[2],c[4]);
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1.5;
    for(let i=0;i<4;i++){const xx=X+W*(.2+i*.2),yy=Y+H*.97;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+5,yy-3,xx+12,yy);ctx.stroke();}
    ctx.restore();
  }
};

(() => {
  const oldPanel = TourMapScene.prototype.drawPanel;
  TourMapScene.prototype.layoutPanel = function() {
    const C=Tour.countries[this.sel],R=this.panelR; this.stamps=[];if(!C)return;
    const terrain={x:R.x+8,y:R.y+61,w:R.w-16,h:Math.max(80,R.h-110)};
    this.terrainR=terrain;
    const pts=[[.16,.86],[.49,.73],[.82,.49],[.49,.28],[.16,.08]];
    C.levels.forEach((L,k)=>{
      // Countries have five stages; support additional stages without overlapping targets.
      const p=pts[k]||[.2+(k%2)*.5,.1],cx=terrain.x+terrain.w*p[0],cy=terrain.y+terrain.h*p[1];
      const w=Math.max(44,Math.min(94,terrain.w*.29)),h=44;
      this.stamps.push({i:k+1,x:cx-w/2,y:cy-h/2,w,h,cx,cy,labelW:w});
    });
  };
  TourMapScene.prototype.drawPanel = function(ctx) {
    const C=Tour.countries[this.sel],R=this.panelR,s=Tour.stops[this.sel];
    if(!C||TourMap.stopState(s)==='locked'){oldPanel.call(this,ctx);return;}
    const c=TourLandscape.look(this.sel),A=this.terrainR;
    ctx.save();
    ctx.fillStyle='#152c3c';rr(ctx,R.x,R.y,R.w,R.h,19);ctx.fill();ctx.strokeStyle='rgba(255,244,214,0.35)';ctx.lineWidth=1;ctx.stroke();
    ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle=c[5];ctx.font=`${Math.min(19,R.w/13)}px ${FONT_DISPLAY}`;ctx.fillText(s.name.toUpperCase(),R.x+16,R.y+23);
    ctx.fillStyle='#c2d7db';ctx.font=`10px ${FONT_UI}`;ctx.fillText(C.tagline||s.sub||'Choose your next adventure',R.x+16,R.y+43,R.w-32);
    TourLandscape.scenery(ctx,A,this.sel,this.t);
    // Winding trail, with completed stretches in gold and future stretches dotted.
    for(let k=1;k<this.stamps.length;k++){
      const a=this.stamps[k-1],b=this.stamps[k],open=TourProgress.isUnlocked(C.world+'-'+b.i);
      const trail=()=>{ctx.beginPath();ctx.moveTo(a.cx,a.cy);ctx.bezierCurveTo(a.cx,a.cy+(b.cy-a.cy)*.55,b.cx,b.cy-(b.cy-a.cy)*.55,b.cx,b.cy);};
      ctx.lineCap='round';ctx.strokeStyle='rgba(45,67,63,0.35)';ctx.lineWidth=10;trail();ctx.stroke();
      ctx.strokeStyle=open?c[5]:'rgba(255,244,215,0.65)';ctx.lineWidth=6;ctx.setLineDash(open?[]:[2,7]);trail();ctx.stroke();ctx.setLineDash([]);
    }
    const active=this.stamps.find(b=>TourProgress.isUnlocked(C.world+'-'+b.i)&&!Save.data.done[C.world+'-'+b.i]);
    this.stamps.forEach((b,k)=>{
      const id=C.world+'-'+b.i,L=C.levels[k],open=TourProgress.isUnlocked(id),done=!!Save.data.done[id],boss=L.style==='castle',foc=this.focus===k&&!Input.usingTouch;
      const r=Math.max(8,Math.min(13,b.h*.3)),x=b.cx,y=b.cy-3;
      ctx.fillStyle='rgba(30,55,54,0.23)';ctx.beginPath();ctx.ellipse(x,y+r+3,r+4,4,0,0,TAU);ctx.fill();
      if(active===b||foc){ctx.strokeStyle='#fff7d8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+5,0,TAU);ctx.stroke();}
      ctx.fillStyle=done?'#f5c75e':open?'#fff7df':'#657e7d';ctx.strokeStyle='#30474f';ctx.lineWidth=2;
      if(boss){rr(ctx,x-r,y-r,r*2,r*2,3);ctx.fill();ctx.stroke();for(let q=-1;q<=1;q++)ctx.fillRect(x+q*r*.7-2,y-r-4,4,6);ctx.fillStyle='#30474f';rr(ctx,x-3,y+1,6,r-1,2);ctx.fill();}
      else{ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=open?'#30474f':'#c6d4cc';ctx.textAlign='center';ctx.font=`${r}px ${FONT_DISPLAY}`;ctx.fillText(done?'✓':open?String(b.i):'·',x,y+1);}
      // Labels are inside the touch rectangle, fitted to its width.
      const labelY=y+r+6;ctx.font=`${Math.max(7,Math.min(9,A.w/34))}px ${FONT_UI}`;ctx.textAlign='center';
      const name=L.name;const labelW=Math.min(b.labelW,ctx.measureText(name).width+10);
      ctx.fillStyle=open?'#193d48':'#405d62';rr(ctx,x-labelW/2,labelY-5,labelW,12,5);ctx.fill();ctx.fillStyle=open?'#fff5d9':'#c3d1cc';ctx.fillText(name,x,labelY+1,labelW-6);
      const gold=Save.data.gold[id]||[];
      for(let q=0;q<3;q++){ctx.fillStyle=gold[q]?'#ffdc71':'rgba(35,69,69,0.3)';ctx.fillRect(x-7+q*6,y-r-6,4,3);}
      if(active===b){ctx.fillStyle='#fff4d4';ctx.beginPath();ctx.moveTo(x-4,y-r-13);ctx.lineTo(x+4,y-r-13);ctx.lineTo(x,y-r-8);ctx.fill();}
    });
    if(C.power){const y=R.y+R.h-25;ctx.save();ctx.translate(R.x+24,y);ctx.scale(.65,.65);if(C.power.icon)C.power.icon(ctx,0,0,this.t);ctx.restore();ctx.textAlign='left';ctx.font=`9px ${FONT_DISPLAY}`;ctx.fillStyle=c[5];ctx.fillText(C.power.name.toUpperCase(),R.x+42,y-5,R.w-52);ctx.font=`9px ${FONT_UI}`;ctx.fillStyle='#b7cdd1';ctx.fillText(C.power.hint||'',R.x+42,y+9,R.w-52);}
    ctx.restore();
  };
})();
