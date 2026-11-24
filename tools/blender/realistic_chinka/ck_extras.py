"""Set scene extras on an exported character GLB (and drop the Blender MCP marker the exporter copies):
python ck_extras.py file.glb burns_smile=0.45 [key=value ...]"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'realistic_brady'))
import glbio as glb
f = sys.argv[1]; js, b = glb.load(f)
sc = js['scenes'][js.get('scene', 0)]; ex = sc.get('extras', {})
ex.pop('blendermcp_server_running', None)
for a in sys.argv[2:]:
    k, v = a.split('=', 1); ex[k] = json.loads(v)
sc['extras'] = ex; glb.save(f, js, b); print('scene extras', ex)
