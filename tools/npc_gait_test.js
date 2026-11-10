// Regression for procedural NPC travel cadence and stance-foot contact.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={Math,Float32Array,TAU:Math.PI*2,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t,easeInOut:t=>t};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/40_burns_d_rig.js','utf8')+';globalThis.Char=BurnsChar;globalThis.body=burnsBody;globalThis.pose=burnsPoseNew;globalThis.travel=burnsTravelPose;',ctx);
let cases=0;
for(const run of [false,true])for(const fps of [30,60,120])for(const h of [.85,1,1.2])for(const scale of [1,2]){
 const body=ctx.body({h}),ch=new ctx.Char({nb:16,body});ch.scale=scale;ch.play(run?'run':'walk',{},true);ch.update(0);
 const cycle=(run?3:1.45)*h;
 for(let n=0;n<fps;n++){ch.z+=cycle*scale*.75/fps;ch.update(1/fps)}
 assert(Math.abs(ch._stridePhase-.75)<1e-6,'NPC cadence');const phase=ch._stridePhase;ch.update(1);assert.equal(ch._stridePhase,phase,'blocked feet');ch.z+=100;ch.update(.01);assert.equal(ch._stridePhase,phase,'teleport');
 assert(Array.from(ch.P.r).every(Number.isFinite));cases++;
 const contact=run?.32:.6,span=cycle*contact,l1=.41*h,l2=.39*h;
 for(let n=0;n<50;n++){const u=n/50*contact,P=ctx.pose();ctx.travel(P,u,body,run);const t=P.r[21],k=P.r[24],z=-l1*Math.sin(t)-l2*Math.sin(t+k),y=P.y-l1*Math.cos(t)-l2*Math.cos(t+k);assert(Math.abs(z-span*(.5-u/contact))<1e-6,'stance travel');assert(Math.abs(y+l1+l2)<1e-6,'stance height')}
}
const crowd=new ctx.Char({nb:16,body:ctx.body()});crowd.play('walk',{inPlace:true},true);crowd.update(.2);assert(crowd._stridePhase>0,'shared crowd remains animated');
console.log('PASS',cases,'NPC cadence cases, contact feet, blocked/teleport and instanced crowd');
