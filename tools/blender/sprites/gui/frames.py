# frames.py -- <outdir> <atlas_base> id [id ...]: crop frames/strips out of a packed atlas to PNGs, print alpha stats
import sys, os, json, numpy as np
sys.path.insert(0, '/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/art/tools/blender/sprites')
import imgkit as IK
argv = sys.argv[sys.argv.index('--') + 1:]
out, base, ids = argv[0], argv[1], argv[2:]
s = open(base + '.js').read(); m = json.loads(s[s.index(',') + 1:s.rindex(')')])
a = IK.load(base + '.webp'); os.makedirs(out, exist_ok=True)
for i in ids:
    f = m['frames'].get(i) or m['strips'].get(i)
    c = a[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
    al = c[..., 3]
    print('FRAME', os.path.basename(base), i, c.shape, 'alpha<0.99 frac %.3f' % (al < 0.99).mean(), 'cols min alpha', [round(float(al[:, k].min()), 2) for k in (0, 1, 2, c.shape[1] - 2, c.shape[1] - 1)])
    if i == 'ground':
        # per tile-column boundary: min alpha along the boundary columns (64 texels per tile at scale 2)
        tw = c.shape[1] // 8
        print('  boundary min alpha', [round(float(al[c.shape[0]//3:, k * tw - 1:k * tw + 1].min()), 2) for k in range(1, 8)])
        print('  row-boundary min alpha', [round(float(al[k * tw - 1:k * tw + 1, :].min()), 2) for k in (1, 2)])
    bg = IK.solid(c.shape[1], c.shape[0], (1.0, 0.0, 1.0)); IK.over(bg, c, 0, 0)
    IK.save(bg, os.path.join(out, os.path.basename(base) + '_' + i + '.png'))
