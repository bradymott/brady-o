# Dry run of a cartkit car script without Blender: runs build(B) for both levels against the stubs and prints triangle
# counts (before bevel modifiers and booleans, which the stub doesn't apply), bones, parts, empties and materials.
#   python3 dryrun.py /abs/tools/blender/bass_valentine.py
import sys, os, runpy, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
script = sys.argv[1]
sys.path.insert(0, os.path.dirname(script))
os.environ.setdefault('BRADY_ROOT', '/private/tmp/claude-501/-Users-bradymott-brady-o/300b6139-7b8a-41ee-8c06-1aa73a659be0/scratchpad/dryroot')
g = runpy.run_path(script, run_name='dry')
ck = sys.modules['cartkit']
for lv in ('hi', 'lo'):
    B = ck.Build(os.path.basename(script)[:-3], lv); g['build'](B)
    per = collections.Counter(); bev = 0; tot = 0; nv = 0
    for ob in B.objs:
        if ob.type != 'MESH': continue
        t = ob.data._bm.tris(); tot += t; nv += len(ob.data._bm.verts)
        r = ob
        while r.parent is not None: r = r.parent
        per[r.name] += t
        bev += sum(1 for m in ob.modifiers if m['type'] == 'BEVEL')
    heavy = sorted(((ob.data._bm.tris(), ob.name) for ob in B.objs if ob.type == 'MESH'), reverse=True)[:14]
    mats = set(id(m) for ob in B.objs if ob.type == 'MESH' for m in ob.data.materials)
    print('%s: %d tris (pre-bevel/boolean), %d verts, %d objects, %d with bevel, %d materials, %d cutters' % (lv, tot, nv, sum(1 for o in B.objs if o.type == 'MESH'), bev, len(mats), len(B.cutters)))
    print('  bones:', dict(per))
    print('  empties:', sorted(o.name for o in B.objs if o.type == 'EMPTY' and o.name not in B.bones))
    print('  heaviest:', ', '.join('%s %d' % (n, t) for t, n in heavy))
    print('  body props:', {k: v for k, v in B.body.items()})
    vc = [ob.name for ob in B.objs if ob.type == 'MESH' and ob.data.color_attributes.items]
    print('  vertex colours on:', vc, 'export_try:', getattr(B, 'export_try', None))
