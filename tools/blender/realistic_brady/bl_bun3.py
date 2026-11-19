"""Bun v3: dark lumpy volumetric core (opaque curl-mass texture) + shell of small curl sprites (ring/spiral alpha)
+ a few springy ringlets. Atlas cells (region A, x 0..256): 2 cols x 8 rows of 128x128; rows 0..6 = curl sprites,
row 7 = opaque dense curl mass for the core."""
import bpy, bmesh, numpy as np, math
from mathutils import Vector, Matrix, noise
CFG = globals().get('BUN_CFG', {})
rng = np.random.default_rng(CFG.get('seed', 13))
BUN = Vector(CFG.get('bun', (0.0, 0.062, 1.895)))
CEN = Vector((0.0, -0.015, 1.745))
R = CFG.get('r', (0.05, 0.054, 0.042))
axis = (BUN - CEN).normalized()
q = Vector((0, 0, 1)).rotation_difference(axis)
coll = bpy.data.collections['Hair']
def cell_uv(col, row):
    u0 = col * 128 / 1024; v1 = 1 - row * 128 / 1024
    return u0 + 2 / 1024, u0 + 126 / 1024, v1 - 126 / 1024, v1 - 2 / 1024
# ---------- core
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); col = bm.loops.layers.float_color.new('Col')
nu, nv = 20, 12
rows = []
for j in range(nv + 1):
    th = math.pi * j / nv; row = []
    for i in range(nu):
        ph = 2 * math.pi * i / nu
        p = Vector((R[0] * math.sin(th) * math.cos(ph), R[1] * math.sin(th) * math.sin(ph), R[2] * math.cos(th)))
        lump = 1 + 0.16 * noise.noise(p * 70 + Vector((3.1, 1.7, 0.4))) + 0.08 * noise.noise(p * 160)
        if j == nv: lump = 0.6
        row.append(bm.verts.new(BUN + q @ (p * lump)))
    rows.append(row)
ua, ub, va, vb = cell_uv(0, 7)
for j in range(nv):
    for i in range(nu):
        a, b_, c, d = rows[j][i], rows[j][(i + 1) % nu], rows[j + 1][(i + 1) % nu], rows[j + 1][i]
        f = bm.faces.new((a, b_, c, d))
        for l, (s, t) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
            l[uvl].uv = (ua + (ub - ua) * ((s * 3 / nu) % 1.0 if s < nu else 1.0), va + (vb - va) * ((t * 2 / nv) % 1.0 if t < nv else 1.0))
            l[col] = (0.9, 0.9, 0.9, 1)
# fix wrap seams in UVs (tile 3x across, 2x down): recompute per face consistently
for f in bm.faces:
    us = [l[uvl].uv[0] for l in f.loops]
    if max(us) - min(us) > 0.06:
        for l in f.loops:
            if l[uvl].uv[0] < ua + (ub - ua) * 0.5: l[uvl].uv = (ub, l[uvl].uv[1])
    vs = [l[uvl].uv[1] for l in f.loops]
    if max(vs) - min(vs) > 0.06:
        for l in f.loops:
            if l[uvl].uv[1] < va + (vb - va) * 0.5: l[uvl].uv = (l[uvl].uv[0], vb)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
core_faces = len(bm.faces)
# ---------- curl sprites: small quads around the core, facing outward with random roll
def sprite(center, normal, size, cellc, cellr, c):
    t1 = normal.orthogonal().normalized(); t2 = normal.cross(t1)
    roll = rng.uniform(0, 2 * math.pi)
    a1 = t1 * math.cos(roll) + t2 * math.sin(roll); a2 = normal.cross(a1)
    # tilt the sprite a bit off the surface tangent so it reads from many angles
    tilt = rng.uniform(-0.6, 0.6)
    a2 = (a2 * math.cos(tilt) + normal * math.sin(tilt)).normalized()
    pts = [center + (a1 * sx + a2 * sy) * size / 2 for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs)
    u0, u1, v0, v1 = cell_uv(cellc, cellr)
    for l, uv in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
        l[uvl].uv = uv; l[col] = c
for k in range(CFG.get('n_sprites', 150)):
    d = Vector(rng.normal(0, 1, 3)).normalized()
    if d.z < -0.55: d.z = -d.z * 0.3
    local = Vector((d.x * R[0], d.y * R[1], d.z * R[2]))
    p = BUN + q @ (local * rng.uniform(0.85, 1.12))
    nrm = (q @ Vector((d.x / R[0], d.y / R[1], d.z / R[2]))).normalized()
    size = rng.uniform(0.022, 0.04)
    light = rng.uniform(1.0, 1.35)
    sprite(p + nrm * rng.uniform(0.002, 0.009), nrm, size, int(rng.integers(0, 2)), int(rng.integers(0, 7)), (light, light * 0.97, light * 0.93, 1))
# ---------- a few springy ringlets falling from the lower edge (curl strip region D)
def strip(points, normals, width, u0, u1, v0, v1, c0, c1):
    rows_ = []
    n = len(points)
    for k in range(n):
        t = (points[min(k + 1, n - 1)] - points[max(k - 1, 0)]).normalized()
        side = normals[k].cross(t).normalized()
        w = width * (1 - 0.4 * k / (n - 1))
        rows_.append((bm.verts.new(points[k] - side * w / 2), bm.verts.new(points[k] + side * w / 2)))
    for k in range(n - 1):
        va_ = v0 + (v1 - v0) * k / (n - 1); vb_ = v0 + (v1 - v0) * (k + 1) / (n - 1)
        ca = tuple(np.array(c0) + (np.array(c1) - np.array(c0)) * k / (n - 1)); cb = tuple(np.array(c0) + (np.array(c1) - np.array(c0)) * (k + 1) / (n - 1))
        f = bm.faces.new((rows_[k][0], rows_[k][1], rows_[k + 1][1], rows_[k + 1][0]))
        for l, uv, cc in zip(f.loops, ((u0, va_), (u1, va_), (u1, vb_), (u0, vb_)), (ca, ca, cb, cb)):
            l[uvl].uv = uv; l[col] = cc
for k in range(CFG.get('n_ringlets', 10)):
    d = Vector(rng.normal(0, 1, 3)); d.z = -abs(d.z) * 0.4; d = d.normalized()
    c = BUN + q @ Vector((d.x * R[0], d.y * R[1], d.z * R[2])) * 0.95
    dirv = (d + Vector((0, 0.2, -0.9))).normalized()
    L = rng.uniform(0.03, 0.055)
    pts = []; nrm = []
    for s in range(7):
        t = s / 6
        pts.append(c + dirv * L * t); nrm.append(d)
    uw = rng.uniform(0.03, 0.05); u0 = rng.uniform(0.632, 0.995 - uw)
    strip(pts, nrm, rng.uniform(0.008, 0.013), u0, u0 + uw, 0.99, 0.32, (1, 1, 1, 1), (1.3, 1.25, 1.15, 1))
me = bpy.data.meshes.new('Hair_Bun'); bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
old = bpy.data.objects.get('Hair_Bun')
if old: bpy.data.objects.remove(old)
ob = bpy.data.objects.new('Hair_Bun', me); coll.objects.link(ob)
ob.data.materials.append(bpy.data.materials['M_HairCards'])
tie = bpy.data.objects.get('Hair_Tie')
if tie:
    tie.location = BUN - axis * (R[2] * 0.8); tie.rotation_mode = 'QUATERNION'; tie.rotation_quaternion = q
print('bun tris', sum(len(p.vertices) - 2 for p in me.polygons), 'core faces', core_faces)
