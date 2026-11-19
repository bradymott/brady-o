// Blender's "Always sample" export writes every bone into every action, so the face_* pose clips also carry the body's
// rest pose (a T-pose): blended by BurnsFace they pull the arms out. Keep only the face joints' channels in face_* clips.
//   node tools/blender/realistic_brady/strip_face_channels.js <in.glb> [out.glb=in.glb]
const fs = require('fs');
const inp = process.argv[2], out = process.argv[3] || inp;
const FACE = /(Jaw|Eyelid|Mouth|Eye)$/;
// each pose keeps only the joints it moves, so blink does not hold the jaw shut while talking
const ONLY = { face_blink: /Eyelid$/, face_jaw: /(Jaw|Mouth)$/, face_smile: /(Jaw|Mouth)$/ };
const b = fs.readFileSync(inp), jlen = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jlen).toString());
const rest = b.slice(20 + jlen);
let dropped = 0;
for (const a of j.animations || []) {
  if (!/^face_/.test(a.name)) continue;
  const re = ONLY[a.name] || FACE, keep = a.channels.filter(c => re.test(j.nodes[c.target.node].name || ''));
  dropped += a.channels.length - keep.length;
  const used = [...new Set(keep.map(c => c.sampler))], remap = new Map(used.map((s, i) => [s, i]));
  a.samplers = used.map(s => a.samplers[s]);
  a.channels = keep.map(c => Object.assign({}, c, { sampler: remap.get(c.sampler) }));
}
let js = Buffer.from(JSON.stringify(j)); const pad = (4 - js.length % 4) % 4; js = Buffer.concat([js, Buffer.alloc(pad, 0x20)]);
const head = Buffer.alloc(20); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + js.length + rest.length, 8);
head.writeUInt32LE(js.length, 12); head.writeUInt32LE(0x4E4F534A, 16);
fs.writeFileSync(out, Buffer.concat([head, js, rest]));
console.log('face clips: dropped ' + dropped + ' channels of joints the pose does not move');
