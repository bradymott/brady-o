import sys, os, runpy, re, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
script = sys.argv[1]; lv = sys.argv[2]
sys.path.insert(0, os.path.dirname(script))
os.environ.setdefault('BRADY_ROOT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dryroot'))
g = runpy.run_path(script, run_name='dry'); ck = sys.modules['cartkit']
B = ck.Build(os.path.basename(script)[:-3], lv); g['build'](B)
c = collections.Counter(); n = collections.Counter()
for ob in B.objs:
    if ob.type != 'MESH': continue
    k = re.sub(r'(_\d+|_[LR]|[AB])+$', '', re.sub(r'_\d+', '', ob.name)); c[k] += ob.data._bm.tris(); n[k] += 1
print(lv, sum(c.values())); print(', '.join('%s %d(x%d)' % (k, v, n[k]) for k, v in c.most_common(70)))
