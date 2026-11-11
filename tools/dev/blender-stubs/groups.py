import sys, os, runpy, collections, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
script = sys.argv[1]; sys.path.insert(0, os.path.dirname(script))
os.environ.setdefault('BRADY_ROOT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dryroot'))
g = runpy.run_path(script, run_name='dry'); ck = sys.modules['cartkit']
for lv in sys.argv[2:] or ('hi', 'lo'):
    B = ck.Build('x', lv, g.get('LEVEL_OV')); g['build'](B); c = collections.Counter(); n = collections.Counter()
    for ob in B.objs:
        if ob.type != 'MESH': continue
        k = re.sub(r'_?\d+', '#', ob.name); c[k] += ob.data._bm.tris(); n[k] += 1
    print(lv, sum(c.values()), ' '.join('%s:%d(x%d)' % (k, v, n[k]) for k, v in c.most_common(400)))
