# compare.py -- <old_base> <new_base> <out.png> [prefix]: per-frame diff of two packed atlases + side-by-side sheet
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # tools/blender/sprites (imgkit)
import imgkit as IK
argv = sys.argv[sys.argv.index('--') + 1:]
def meta(base):
    s = open(base + '.js').read(); j = s[s.index(',') + 1:s.rindex(')')]; return json.loads(j)
def img(base):
    return IK.load(base + '.webp')
old, new, out = argv[0], argv[1], argv[2]; pre = argv[3] if len(argv) > 3 else ''
mo, mn = meta(old), meta(new); io, inn = img(old), img(new)
def crop(a, f): return a[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
rows = []
for kind in ('frames', 'strips'):
    for fid, fn in mn[kind].items():
        if not fid.startswith(pre): continue
        fo = mo[kind].get(fid)
        if not fo: print('NEW ONLY', fid); continue
        a, b = crop(io, fo), crop(inn, fn)
        h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
        d = np.abs(a[:h, :w] - b[:h, :w]).mean()
        print('CMP %-22s old %4dx%-4d new %4dx%-4d origin old (%s,%s) new (%s,%s) meanabs %.4f' % (fid, fo['w'], fo['h'], fn['w'], fn['h'], fo.get('ox'), fo.get('oy'), fn.get('ox'), fn.get('oy'), d))
        rows.append((a, b))
rows = rows[:12]
W = sum(max(a.shape[1], b.shape[1]) + 8 for a, b in rows) + 8; H = max(a.shape[0] + b.shape[0] for a, b in rows) + 24
sheet = IK.solid(W, H, (0.6, 0.65, 0.7)); x = 8
for a, b in rows:
    IK.over(sheet, a, x, 8); IK.over(sheet, b, x, 16 + a.shape[0]); x += max(a.shape[1], b.shape[1]) + 8
IK.save(sheet, out); print('WROTE', out)
