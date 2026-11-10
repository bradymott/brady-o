# sheet.py -- <out.png> <scale> <atlas_base> id [id ...]: contact sheet of atlas frames (bottom-aligned), upscaled by scale
import sys, os, json, numpy as np
sys.path.insert(0, '/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/art/tools/blender/sprites')
import imgkit as IK
argv = sys.argv[sys.argv.index('--') + 1:]
out, sc, base, ids = argv[0], float(argv[1]), argv[2], argv[3:]
s = open(base + '.js').read(); m = json.loads(s[s.index(',') + 1:s.rindex(')')])
a = IK.load(base + '.webp')
if ids == ['all']: ids = sorted(m['frames'])
elif len(ids) == 1 and ids[0].endswith('*'): ids = sorted(i for i in m['frames'] if i.startswith(ids[0][:-1]))
crops = []
for i in ids:
    f = m['frames'][i]; c = a[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
    if sc != 1: c = IK.resize(c, max(1, int(c.shape[1] * sc)), max(1, int(c.shape[0] * sc)))
    crops.append(c)
cols = min(10, len(crops)); rows = (len(crops) + cols - 1) // cols
cw = max(c.shape[1] for c in crops) + 6; ch = max(c.shape[0] for c in crops) + 6
sh = IK.solid(cols * cw + 6, rows * ch + 6, (0.62, 0.78, 0.92))
for k, c in enumerate(crops):
    r, q = divmod(k, cols); IK.over(sh, c, 6 + q * cw, 6 + r * ch + (ch - 6 - c.shape[0]))
IK.save(sh, out); print('WROTE', out, len(crops))
