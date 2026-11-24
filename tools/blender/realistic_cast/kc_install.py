"""Realistic cast kit: finish the exported kit and install it (outside Blender; run after kc_export.py and
strip_face_channels.js): the manifest (private/work/proj/cast_kit.json from kc_regions.py) is completed from the file's
own node names (hair styles, eyes), embedded as the scene extra burns_kit, and the file copied to
assets/models/burning-man/cast.glb (Burning Man only: Art Kart's build never ships it).
python kc_install.py <exported cast.glb> <repo root>"""
import sys, os, json, re, shutil
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'realistic_brady'))
import glbio as glb
src, repo = sys.argv[1], sys.argv[2]
W = '/Users/bradymott/brady-o/private/work/'
man = json.load(open(W + 'proj/cast_kit.json'))
js, b = glb.load(src)
names = {n.get('name', '') for n in js['nodes']}
parts = {}
for n in sorted(names):
    m = re.match(r'^([FM])_([a-z]+)_([a-zA-Z]+)$', n)
    if not m: continue
    S, slot, kind = m.groups()
    old = man['parts'].get(n, {})
    parts[n] = {'sex': S, 'slot': slot, 'kind': kind, 'hides': old.get('hides', []), 'tris': old.get('tris', 0)}
for S in ('F', 'M'):
    man['bodies'][S]['regions'] = sorted(p['kind'] for n, p in parts.items() if p['sex'] == S and p['slot'] == 'body' and not p['kind'].startswith('eye'))
man['parts'] = parts
sc = js['scenes'][js.get('scene', 0)]; ex = sc.get('extras', {}); ex.pop('blendermcp_server_running', None)
ex['burns_kit'] = man; sc['extras'] = ex
glb.save(src, js, b)
dst = os.path.join(repo, 'assets', 'models', 'burning-man', 'cast.glb')
shutil.copyfile(src, dst)
print('kit parts', len(parts), {S: man['bodies'][S]['regions'] for S in ('F', 'M')}, '->', dst, os.path.getsize(dst))
