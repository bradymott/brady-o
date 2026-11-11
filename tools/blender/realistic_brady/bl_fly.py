import bpy, bmesh, numpy as np, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
CFG = globals().get('FLY_CFG', {})
rng = np.random.default_rng(CFG.get('seed', 3))
BUN = Vector(CFG.get('bun', (0.0, 0.062, 1.895))); CEN = Vector((0.0, -0.015, 1.745))
cap = bpy.data.objects['Hair_Cap']; me = cap.data
cv = [v.co.copy() for v in me.vertices]; cf = [list(p.vertices) for p in me.polygons]
bvh = BVHTree.FromPolygons(cv, cf)
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); col = bm.loops.layers.float_color.new('Col')
def add(pts, ns, width, u0, u1, v0, v1, c):
    rows = []
    for k, (p, n) in enumerate(zip(pts, ns)):
        t = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]).normalized()
        side = n.cross(t).normalized(); w = width * (1 - 0.6 * k / (len(pts) - 1))
        rows.append((bm.verts.new(p - side * w / 2), bm.verts.new(p + side * w / 2)))
    for k in range(len(rows) - 1):
        f = bm.faces.new((rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]))
        va = v0 + (v1 - v0) * k / (len(rows) - 1); vb = v0 + (v1 - v0) * (k + 1) / (len(rows) - 1)
        for l, uv in zip(f.loops, ((u0, va), (u1, va), (u1, vb), (u0, vb))):
            l[uvl].uv = uv; l[col] = c
n_done = 0
for i in range(CFG.get('n', 50)):
    # random point on the cap, biased to the top and temples (silhouette from front / 3/4)
    p = cv[int(rng.integers(0, len(cv)))]
    if p.z < CFG.get('min_z', 1.76): continue
    loc, nrm, _, _ = bvh.find_nearest(p)
    d0 = (loc - CEN).normalized(); a1 = (BUN - CEN).normalized()
    ax = d0.cross(a1).normalized(); ang = d0.angle(a1)
    L = rng.uniform(*CFG.get('len', (0.15, 0.35)))     # fraction of the way to the bun
    lift = rng.uniform(*CFG.get('lift', (0.002, 0.007)))
    pts = []; ns = []
    for s in range(5):
        t = s / 4
        q = Matrix.Rotation(ang * L * t, 3, ax) @ d0
        hit = bvh.ray_cast(CEN + q * 0.3, -q)
        if hit[0] is None: break
        pts.append(hit[0] + hit[1] * (0.001 + lift * math.sin(t * math.pi * 0.9))); ns.append(hit[1])
    if len(pts) < 5: continue
    w = rng.uniform(0.004, 0.009); uw = w * 6
    u0 = rng.uniform(0.503, 0.622 - uw)
    g = 1.0 + (1.6 if rng.random() < CFG.get('grey_p', 0.15) else 0.0)
    add(pts, ns, w, u0, u0 + uw, 0.99, rng.uniform(0.35, 0.6), (g, g, g * 1.02, 1))
    n_done += 1
mesh = bpy.data.meshes.new('Hair_Flyaways'); bm.to_mesh(mesh); bm.free()
for p_ in mesh.polygons: p_.use_smooth = True
old = bpy.data.objects.get('Hair_Flyaways')
if old: bpy.data.objects.remove(old)
ob = bpy.data.objects.new('Hair_Flyaways', mesh); bpy.data.collections['Hair'].objects.link(ob)
ob.data.materials.append(bpy.data.materials['M_HairCards'])
print('flyaways', n_done, sum(len(f.vertices) - 2 for f in mesh.polygons))
