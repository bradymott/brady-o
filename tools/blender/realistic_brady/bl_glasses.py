import bpy, bmesh, math
from mathutils import Vector, Matrix
G = globals().get('GL_CFG', {})
ROOT = Vector(G.get('root', (0.0, -0.174, 1.739)))
lw, lh, rr = G.get('lw', 0.052), G.get('lh', 0.042), 0.007
bridge = G.get('bridge', 0.019); rim = G.get('rim', 0.0042)
WRAP = G.get('wrap', 0.012)
def rrect(w, h, r, n=5):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-(w / 2 - r), h / 2 - r, 90), (-(w / 2 - r), -(h / 2 - r), 180), (w / 2 - r, -(h / 2 - r), 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts
def P(X, y, d=0.0):
    # local: x right, y = depth (back +), z up ; wrap bends the outer ends back
    return Vector((X, d + WRAP * (X / 0.07) ** 2, y))
def obj(name, bm, coll, mat):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.get(name)
    if ob is None:
        ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    ob.data = me
    for m in list(ob.modifiers): ob.modifiers.remove(m)
    me.materials.clear(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    return ob
coll = bpy.data.collections['Sunglasses']
root = bpy.data.objects['Sunglasses']; root.location = ROOT; root.rotation_euler = (math.radians(G.get('tilt', 6)), 0, 0)
mf = bpy.data.materials['M_GlassesFrame']; ml = bpy.data.materials['M_GlassesLens']
# frame: two rims + bridge, as a closed ring extruded in depth
bm = bmesh.new()
T = G.get('depth', 0.0045)
for s in (-1, 1):
    cx = s * (bridge / 2 + lw / 2)
    outer = rrect(lw + 2 * rim, lh + 2 * rim, rr + rim); inner = rrect(lw, lh, rr)
    rings = []
    for d in (-T / 2, T / 2):
        vo = [bm.verts.new(P(cx + x, y, d)) for x, y in outer]; vi = [bm.verts.new(P(cx + x, y, d)) for x, y in inner]
        rings.append((vo, vi))
    n = len(outer)
    (fo, fi), (bo, bi) = rings
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((fo[i], fo[j], fi[j], fi[i]))          # front face
        bm.faces.new((bo[j], bo[i], bi[i], bi[j]))          # back face
        bm.faces.new((fo[j], fo[i], bo[i], bo[j]))          # outer wall
        bm.faces.new((fi[i], fi[j], bi[j], bi[i]))          # inner wall
# bridge bar
bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.LocRotScale(P(0, lh / 2 - 0.004, 0), None, Vector((bridge + 0.004, T, 0.0035))))
fr = obj('Sunglasses_Frame', bm, coll, mf)
bev = fr.modifiers.new('bev', 'BEVEL'); bev.width = 0.0008; bev.segments = 2; bev.limit_method = 'ANGLE'
fr.parent = root; fr.matrix_parent_inverse.identity(); fr.location = (0, 0, 0)
# lenses: slightly curved plates, 2 mm thick, opaque
bm = bmesh.new()
for s in (-1, 1):
    cx = s * (bridge / 2 + lw / 2)
    inner = rrect(lw + 0.001, lh + 0.001, rr)
    f = [bm.verts.new(P(cx + x, y, -0.0005)) for x, y in inner]
    b = [bm.verts.new(P(cx + x, y, 0.0015)) for x, y in inner]
    bm.faces.new(f[::-1]); bm.faces.new(b)
    n = len(f)
    for i in range(n):
        j = (i + 1) % n; bm.faces.new((f[i], f[j], b[j], b[i]))
le = obj('Sunglasses_Lenses', bm, coll, ml)
le.parent = root; le.matrix_parent_inverse.identity(); le.location = (0, 0, 0)
# temples: swept slim bars from the frame corners back over the ears
def sweep(bm, pts, w, h):
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        up = Vector((0, 0, 1)); side = t.cross(up).normalized(); up = side.cross(t).normalized()
        rings.append([bm.verts.new(p + side * sx * w / 2 + up * sy * h / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for a, b in zip(rings[:-1], rings[1:]):
        for k in range(4): bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
bm = bmesh.new()
ex = bridge / 2 + lw + rim
earY = G.get('ear_y', 0.135); earX = G.get('ear_x', 0.088); earZ = G.get('ear_z', 0.010)
for s in (-1, 1):
    p0 = P(s * ex, lh / 2 - 0.006, 0)
    pts = [p0 + Vector((s * 0.001, 0.002, 0)), Vector((s * (ex + 0.008), 0.03, lh / 2 - 0.007)), Vector((s * (earX - 0.004), earY * 0.7, earZ + 0.002)),
           Vector((s * earX, earY, earZ)), Vector((s * (earX - 0.001), earY + 0.012, earZ - 0.008)), Vector((s * (earX - 0.003), earY + 0.02, earZ - 0.024))]
    sweep(bm, pts, 0.0032, 0.0055)
te = obj('Sunglasses_Temples', bm, coll, mf)
te.parent = root; te.matrix_parent_inverse.identity(); te.location = (0, 0, 0)
# materials: slim satin black frame, opaque dark lens with soft reflection
p = next(n for n in mf.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value = (0.008, 0.008, 0.009, 1); p.inputs['Roughness'].default_value = 0.32; p.inputs['Coat Weight'].default_value = 0.0
p = next(n for n in ml.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value = (0.006, 0.006, 0.007, 1); p.inputs['Roughness'].default_value = 0.14
p.inputs['Alpha'].default_value = 1.0; p.inputs['Specular IOR Level'].default_value = 0.5; p.inputs['Coat Weight'].default_value = 0.6; p.inputs['Coat Roughness'].default_value = 0.08
print('glasses tris', sum(sum(len(f.vertices) - 2 for f in o.data.polygons) for o in (fr, le, te)))
