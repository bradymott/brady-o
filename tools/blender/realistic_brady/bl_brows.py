import bpy, bmesh, json, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
H = '/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad/head/'
corr = json.load(open(H + 'corr.json'))
P = np.load(H + 'base_final.npy')
def lmk(i):
    c = corr[str(i)]; t = c[:3]; w = c[3:]
    return Vector((P[t] * np.array(w)[:, None]).sum(0))
body = bpy.data.objects['Brady_Body']
dg = bpy.context.evaluated_depsgraph_get()
sd = body.modifiers['Subdiv']; sv = sd.show_viewport; sd.show_viewport = False
dg.update()
ev = body.evaluated_get(dg); me = ev.to_mesh()
bvh = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [list(p.vertices) for p in me.polygons])
ev.to_mesh_clear(); sd.show_viewport = sv
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); col = bm.loops.layers.float_color.new('Col')
def resample(pts, n):
    pts = [Vector(p) for p in pts]
    d = [0]
    for a, b in zip(pts[:-1], pts[1:]): d.append(d[-1] + (b - a).length)
    out = []
    for k in range(n):
        s = d[-1] * k / (n - 1)
        j = max(i for i in range(len(d)) if d[i] <= s + 1e-9); j = min(j, len(pts) - 2)
        t = (s - d[j]) / max(d[j + 1] - d[j], 1e-9)
        out.append(pts[j].lerp(pts[j + 1], t))
    return out
def surf(p, lift):
    loc, n, i, dd = bvh.find_nearest(p)
    return loc + n * lift, n
def strip(top, bot, u0, u1, v_top, v_bot, c=(1, 1, 1, 1)):
    rows = [(bm.verts.new(a), bm.verts.new(b)) for a, b in zip(top, bot)]
    n = len(rows)
    for k in range(n - 1):
        ua = u0 + (u1 - u0) * k / (n - 1); ub = u0 + (u1 - u0) * (k + 1) / (n - 1)
        f = bm.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]))
        for l, uv in zip(f.loops, ((ua, v_top), (ub, v_top), (ub, v_bot), (ua, v_bot))):
            l[uvl].uv = uv; l[col] = c
# brows: inner -> outer
BROWS = {'R': ([107, 66, 105, 63, 70], [55, 65, 52, 53, 46]), 'L': ([336, 296, 334, 293, 300], [285, 295, 282, 283, 276])}
for side, (up, lo) in BROWS.items():
    U = resample([lmk(i) for i in up], 9); L = resample([lmk(i) for i in lo], 9)
    top = []; bot = []
    for a, b in zip(U, L):
        m = (a + b) / 2; h = (a - b) * 0.85
        ta, _ = surf(m + h, 0.0012); tb, _ = surf(m - h, 0.0008)
        top.append(ta); bot.append(tb)
    strip(top, bot, 0.752, 0.998, 1 - 732 / 1024, 1 - 858 / 1024, (2.4, 2.2, 2.0, 1))
# upper lashes: outer -> inner corner
LASH = {'R': [33, 246, 161, 160, 159, 158, 157, 173, 133], 'L': [263, 466, 388, 387, 386, 385, 384, 398, 362]}
for side, ids in LASH.items():
    pts = resample([lmk(i) for i in ids], 10)
    root = []; tip = []
    for k, p in enumerate(pts):
        loc, n = surf(p, 0.0004)
        t = abs(k / 9 - 0.5) * 2  # 0 centre, 1 corners
        Lh = 0.0075 * (1 - 0.45 * t)
        d = (n * 0.55 + Vector((0, -0.55, 0.65))).normalized()
        root.append(loc + Vector((0, 0, 0.0006))); tip.append(loc + d * Lh)
    strip(root, tip, 0.752, 0.998, 1 - 888 / 1024, 1 - 1008 / 1024, (0.9, 0.9, 0.9, 1))
mesh = bpy.data.meshes.new('Brows_Lashes'); bm.to_mesh(mesh); bm.free()
for p in mesh.polygons: p.use_smooth = True
old = bpy.data.objects.get('Brows_Lashes')
if old: bpy.data.objects.remove(old)
ob = bpy.data.objects.new('Brows_Lashes', mesh); bpy.data.collections['Hair'].objects.link(ob)
ob.data.materials.append(bpy.data.materials['M_HairCards'])
print('brows/lashes tris', sum(len(p.vertices) - 2 for p in mesh.polygons))
