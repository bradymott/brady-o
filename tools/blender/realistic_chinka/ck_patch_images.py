"""Replace embedded images of a GLB by name from files (texture-only iterations without re-exporting).
python ck_patch_images.py file.glb NAME=path [NAME=path ...]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'realistic_brady'))
import glbio as glb
f = sys.argv[1]; js, b = glb.load(f)
for a in sys.argv[2:]:
    n, p = a.split('=', 1)
    i = next(k for k, im in enumerate(js['images']) if im.get('name') == n)
    b = glb.replace_image(js, b, i, open(p, 'rb').read(), 'image/jpeg' if p.endswith('.jpg') else 'image/png')
    print('replaced', n)
glb.save(f, js, b)
