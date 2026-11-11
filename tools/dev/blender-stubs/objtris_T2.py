import sys, os, runpy, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
script = sys.argv[1]; lv = sys.argv[2]; pat = sys.argv[3] if len(sys.argv) > 3 else '.'
sys.path.insert(0, os.path.dirname(script))
os.environ.setdefault('BRADY_ROOT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dryroot'))
g = runpy.run_path(script, run_name='dry'); ck = sys.modules['cartkit']
B = ck.Build(os.path.basename(script)[:-3], lv); g['build'](B)
rows = [(ob.data._bm.tris(), ob.name) for ob in B.objs if ob.type == 'MESH' and re.search(pat, ob.name)]
tot = sum(t for t, n in rows)
print(lv, 'match', pat, tot); print(', '.join('%s %d' % (n, t) for t, n in sorted(rows, reverse=True)[:60]))
