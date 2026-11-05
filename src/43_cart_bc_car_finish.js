/* Finishing geometry for all twelve Blender cars. Merged into their original
   vertex buffer once on load: the car still costs one draw and uses the same rig. */
const CartCarFinish = {
  apply(R, lo) {
    if(R.finished)return R;
    const G=R.geo,F=new Float32Array(G.data),U=new Uint8Array(G.data);
    const m=new BurnsMesh(G.nv+4096);
    m.append({nv:G.nv,buf:G.data,ind:G.idx,bmin:G.bounds.slice(0,3),bmax:G.bounds.slice(3)});
    for(let b=1;b<=4;b++){
      if(!R.names[b]||!R.names[b].startsWith('wheel_'))continue;
      const side=R.J[b*3]>=0?1:-1;
      let face=0,r=0;
      for(let i=0;i<G.nv;i++)if((U[i*24+15]&63)===b){
        face=Math.max(face,F[i*6]*side);
        r=Math.max(r,Math.hypot(F[i*6+1],F[i*6+2]));
      }
      if(!(r>0.1&&r<2&&face<1))continue;
      // The outer face is measured from the actual mesh, so this fits every car and LOD.
      const x=side*(face+0.009),lip=r*0.62;
      m.setBone(b);
      m.color('#232a35').shine(1);m.push();m.tf(x,0,0,0,0,Math.PI/2);
      if(!lo)m.lathe([[0,-0.009],[lip,-0.009],[lip,0.009],[0,0.009]],{seg:20});
      m.color('#c0ccdb').shine(3);m.torus(0,0,0,lip,0.016,{seg:lo?8:24,tseg:lo?3:5});m.pop();
      for(let k=0;k<5;k++){
        const a=k/5*TAU,c=Math.cos(a),s=Math.sin(a);
        m.color('#8d9dad').shine(3);
        m.limb(x+side*0.014,c*r*0.15,s*r*0.15,x+side*0.014,c*lip*0.9,s*lip*0.9,0.019,0.025,{seg:lo?3:5,ends:false});
        if(!lo){m.color('#d7dde5').shine(3);m.ball(x+side*0.035,c*r*0.23,s*r*0.23,0.013,{seg:6,rings:4});}
      }
      m.color('#7c899b').shine(2);
      if(lo)m.box(x+side*0.02,0,0,0.025,r*0.22,r*0.22);
      else m.ellipsoid(x+side*0.02,0,0,0.027,r*0.14,r*0.14,{seg:12,rings:8});
      // Subtle ribs on the rubber sidewall, not luminous wheel caps.
      if(!lo)for(let k=0;k<24;k++){
        const a=k/24*TAU,c=Math.cos(a),s=Math.sin(a);
        m.color('#303139').shine(0);m.limb(side*(face-0.005),c*r*0.86,s*r*0.86,side*(face-0.003),c*r*0.94,s*r*0.94,0.003,0.002,{seg:3,ends:false});
      }
    }
    m.shine(0);
    // glTF's uint16 index budget is an explicit constraint, even for showroom meshes.
    if(m.nv<=65535){R.geo=m.geo();R.tris=R.geo.count/3;R.nv=R.geo.nv;}
    R.finished=true;return R;
  }
};
