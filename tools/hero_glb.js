// Packing textured skinned "hero" characters (docs/BURNS_GUIDE.md §6.12). gltfpack drops the names of skinned mesh nodes
// and meshes, and merges materials that differ only by name; the hero loader needs both (the _LOD1/_LOD2 suffixes and
// the skin/cloth/hair material names). So before gltfpack runs, each primitive of a hero file gets
// extras.burns_name = "<node name>|<mesh name>" (primitive extras survive -ke), and hero files are packed with
// -km (keep named materials) and -vt 14 (14-bit UVs: about a tenth of a texel on a 2K atlas instead of half).
// A hero file is a .glb with a skin AND embedded images; every other model is left exactly as before (null).
const fs = require('fs');
const HERO_FLAGS = '-km -vt 14';
function readGLB(buf) {
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546C67) return null;
  const jl = buf.readUInt32LE(12); if (buf.readUInt32LE(16) !== 0x4E4F534A) return null;
  return { json: JSON.parse(buf.slice(20, 20 + jl).toString()), rest: buf.slice(20 + jl) };
}
function isHero(json) { return !!(json.skins && json.skins.length && json.images && json.images.length); }
// returns a tagged copy of the glb (Buffer), or null when it isn't a hero file
function tagHeroGLB(buf) {
  const G = readGLB(buf); if (!G || !isHero(G.json)) return null;
  const J = G.json;
  for (const N of J.nodes || []) {
    if (N.mesh === undefined) continue;
    const M = J.meshes[N.mesh]; if (!M) continue;
    for (const p of M.primitives || []) p.extras = Object.assign({}, p.extras || {}, { burns_name: (N.name || '') + '|' + (M.name || '') });
  }
  let js = Buffer.from(JSON.stringify(J)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const h = Buffer.alloc(20);
  h.writeUInt32LE(0x46546C67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(20 + js.length + G.rest.length, 8); h.writeUInt32LE(js.length, 12); h.writeUInt32LE(0x4E4F534A, 16);
  return Buffer.concat([h, js, G.rest]);
}
// pack one file the way tools/build.js does (gltfpack -kn -ke [+ hero flags], then the caller gzips); returns the bytes
function packGLB(gltfpack, inFile, tmpOut, execSync) {
  const tagged = tagHeroGLB(fs.readFileSync(inFile));
  let src = inFile;
  if (tagged) { src = tmpOut + '.tagged.glb'; fs.writeFileSync(src, tagged); }
  try { execSync(`"${gltfpack}" -kn -ke ${tagged ? HERO_FLAGS + ' ' : ''}-i "${src}" -o "${tmpOut}"`, { stdio: 'ignore' }); }
  finally { if (tagged) { try { fs.unlinkSync(src); } catch (e) { /* ignore */ } } }
  const bytes = fs.readFileSync(tmpOut); fs.unlinkSync(tmpOut);
  return bytes;
}
module.exports = { tagHeroGLB, packGLB, isHero, HERO_FLAGS };
