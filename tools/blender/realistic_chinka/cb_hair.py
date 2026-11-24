"""Realistic Chinka, step 5: hair (long, dark, softly wavy, worn down past the shoulders, a near-centre part), brows
and upper lashes as alpha cards on T_Chinka_Hair.png (layout in hair_tex.py).
  CK_HairCap   the scalp above the hairline, pushed out 3.5 mm, UV = azimuth x distance-from-crown (strands radiate
               from the crown and fade at the hairline)
  CK_HairCards ~200 ribbons grown from roots on the cap: away from the part and down under 'gravity', pushed out of the
               head, body and bodice (BVH), with a growing wave; two layers (inner dense, outer wispy); weights Head ->
               HairL/R/B 1 -> 2 down each strand
  CK_Brows     arcs over the painted brow shape; CK_Lashes along the upper lid margins, weighted to the eyelid joints
Run in the open Blender after cb_gown.py: exec(open(path).read())."""
import bpy, bmesh, json, math, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
W = '/Users/bradymott/brady-o/private/work/'
LM = json.load(open(W + 'proj/chinka_lm.json'))
CFG = globals().get('HAIR_CFG', {})
rng = np.random.default_rng(CFG.get('seed', 5))
body = bpy.data.objects['Chinka_Body']; rig = bpy.data.objects['Armature']; M = 'mixamorig:'
coll = bpy.data.collections.get('Hair') or bpy.data.collections.new('Hair')
if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
def ss(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)
def put(name, bm):
    old = bpy.data.objects.get(name)
    if old: bpy.data.objects.remove(old)
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
    for p in m.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, m); coll.objects.link(ob); ob.parent = rig
    am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
    return ob
eL, eR = Vector(LM['eyeL']), Vector(LM['eyeR']); eye_z = (eL.z + eR.z) / 2
Pb = [v.co.copy() for v in body.data.vertices]
top = max(p.z for p in Pb)
HC = Vector((0.0, -0.035, top - 0.105))                   # head centre (for directions)
CROWN = Vector((0.0, -0.005, top))
PART_X = CFG.get('part_x', 0.008)
def hairline(x, y):
    ty = min(max((y + 0.10) / 0.13, 0.0), 1.0)
    front = eye_z + CFG.get('fore', 0.064) - 0.03 * min(1.0, abs(x) / 0.065) ** 2
    back = CFG.get('nape', 1.47)
    z = front * (1 - ty) + back * ty
    if abs(x) > 0.056 and -0.075 < y < 0.035: z = max(z, eye_z + 0.014 + 0.02 * ss(0.0, 0.035, y))   # above and behind the ears
    return z
# collision: body + bodice
cols = [body] + [bpy.data.objects[n] for n in ('CK_Bodice',) if n in bpy.data.objects]
verts, polys = [], []
for ob in cols:
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); me = ev.to_mesh()
    off = len(verts); verts += [ob.matrix_world @ v.co for v in me.vertices]
    # torso, neck and head only: the T-posed arms would push the hair out sideways
    polys += [[i + off for i in p.vertices] for p in me.polygons if all(abs(me.vertices[i].co.x) < 0.175 or me.vertices[i].co.z > 1.45 for i in p.vertices)]
    ev.to_mesh_clear()
bvh = BVHTree.FromPolygons(verts, polys)
def push(p, clr):
    loc, n, i, d = bvh.find_nearest(p)
    if loc is None: return p
    v = p - loc
    if v.dot(n) < clr: return loc + n * clr
    return p

# ---------------- cap ----------------
bm = bmesh.new(); bm.from_mesh(body.data)
inside = [v.co.z > hairline(v.co.x, v.co.y) - 0.004 for v in bm.verts]
bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(inside[v.index] for v in f.verts)], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
for l in list(bm.loops.layers.uv): bm.loops.layers.uv.remove(l)
uvl = bm.loops.layers.uv.new('UVMap')
bm.normal_update()
for it in range(3): bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
bm.normal_update()
for v in bm.verts: v.co += v.normal * CFG.get('cap_off', 0.0035)
# volume: lift the crown a little (hair has body)
for v in bm.verts:
    d = (v.co - HC); k = ss(eye_z + 0.03, top, v.co.z)
    v.co += d.normalized() * 0.004 * k
def az(p): return math.atan2(p.x - PART_X, (p.y - CROWN.y))          # 0 = straight back, +-pi = front (the part)
NB = 48
bmax = [0.0] * NB
for v in bm.verts:
    if v.is_boundary:
        b = int((az(v.co) + math.pi) / (2 * math.pi) * NB) % NB
        bmax[b] = max(bmax[b], (v.co - CROWN).length)
for i in range(NB):
    if bmax[i] == 0: bmax[i] = max(bmax[(i - 1) % NB], bmax[(i + 1) % NB])
for f in bm.faces:
    a0 = az(f.calc_center_median())
    for l in f.loops:
        a = az(l.vert.co)
        if abs(a - a0) > math.pi: a += 2 * math.pi if a < a0 else -2 * math.pi
        b = int((az(l.vert.co) + math.pi) / (2 * math.pi) * NB) % NB
        u = ((a + math.pi) / (2 * math.pi)) * 0.5 * 3.0 % 0.5            # three repeats around
        u = 0.006 + u * 0.988
        vv = 1.0 - min(1.0, (l.vert.co - CROWN).length / max(bmax[b], 1e-3)) * 0.99
        l[uvl].uv = (u, vv)
cap = put('CK_HairCap', bm)
cap.vertex_groups.new(name=M + 'Head').add(list(range(len(cap.data.vertices))), 1.0, 'REPLACE')
cap_bm = bmesh.new(); cap_bm.from_mesh(cap.data); cap_bm.faces.ensure_lookup_table()
areas = np.array([f.calc_area() for f in cap_bm.faces]); cdf = np.cumsum(areas) / areas.sum()

# ---------------- cards ----------------
def sample_root():
    f = cap_bm.faces[int(np.searchsorted(cdf, rng.random()))]
    vs = [v.co for v in f.verts]; a, b = rng.random(), rng.random()
    if a + b > 1: a, b = 1 - a, 1 - b
    p = vs[0] + (vs[1] - vs[0]) * a + (vs[-1] - vs[0]) * b
    return p, f.normal.copy()
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
cl = bm.loops.layers.float_color.new('Col')
strands = []     # (verts list per row, region, root distances)
NCARD = CFG.get('cards', 250)
for ci in range(NCARD):
    for tries in range(20):
        p0, n0 = sample_root()
        if p0.z > hairline(p0.x, p0.y) + 0.012 and not (p0.y < -0.06 and rng.random() < 0.45): break
    layer = 0 if ci < NCARD * 0.6 else 1
    front = p0.y < -0.045
    side = 1 if p0.x > PART_X else -1
    # length: back longest; strands near the face a little shorter
    L = rng.uniform(0.48, 0.60) if not front else rng.uniform(0.38, 0.50)
    if p0.y < -0.08: L *= 0.9
    nseg = CFG.get('nseg', 10)
    # initial direction: away from the part line along the scalp, then down
    away = Vector((side * 0.7, 0.25 if not front else -0.05, -0.45))
    if p0.y > 0.02: away = Vector((side * 0.3, 1.0, -0.6))
    d = (away - n0 * away.dot(n0)).normalized()
    fall = Vector((side * (0.3 if front else 0.05), (-0.12 if front else 0.12), -1.0)).normalized()
    p0 = p0 - n0 * 0.002                      # roots just under the cap surface (no tips standing up at the crown)
    pts = [p0.copy()]; p = p0.copy()
    clr = 0.006 + 0.004 * layer + rng.uniform(0, 0.003)
    amp = rng.uniform(0.008, 0.016); ph = rng.uniform(0, 6.3); fr = rng.uniform(2.2, 3.4)
    seg = L / nseg
    for k in range(nseg):
        t = (k + 1) / nseg
        d = (d * (1 - 0.4) + fall * 0.4).normalized()
        p = p + d * seg
        p = push(p, min(clr, 0.004 + 0.02 * t) + 0.004 * t)
        # the face stays open: no strand crosses in front of the cheeks, eyes or mouth
        if eye_z - 0.13 < p.z < eye_z + 0.05 and p.y < HC.y - 0.015 and abs(p.x) < 0.094:
            p.x = math.copysign(0.094, p.x if abs(p.x) > 1e-4 else side); p = push(p, clr + 0.004 * t)
        # hanging hair stays within the shoulders (it falls in front of or behind them, never out sideways)
        if p.z < 1.50:
            lim = 0.16 + 0.03 * ss(1.50, 1.40, p.z) * 0
            if abs(p.x) > lim: p.x = math.copysign(lim, p.x); p = push(p, clr + 0.004 * t)
        pts.append(p.copy())
    # wave: sideways offsets growing after 12 cm
    out_pts = []
    acc_len = 0.0
    for k, q in enumerate(pts):
        if k: acc_len += (pts[k] - pts[k - 1]).length
        tdir = (pts[min(k + 1, nseg)] - pts[max(k - 1, 0)]).normalized()
        outv = Vector((q.x, q.y - HC.y, 0)).normalized() if abs(q.x) + abs(q.y - HC.y) > 1e-4 else Vector((0, 1, 0))
        wv = tdir.cross(outv).normalized()
        a_ = amp * ss(0.08, 0.25, acc_len)
        out_pts.append((q + wv * a_ * math.sin(acc_len / L * fr * 2 * math.pi + ph), tdir, outv, acc_len))
    width = rng.uniform(0.028, 0.042) * (0.85 if layer else 1.0)
    colk = rng.integers(0, 2) if layer == 0 else rng.integers(2, 4)
    u0 = (512 + colk * 128 + 6) / 1024; u1 = (512 + (colk + 1) * 128 - 6) / 1024
    rows = []
    for k, (q, tdir, outv, s_) in enumerate(out_pts):
        wv = tdir.cross(outv).normalized()
        w_ = width * (1 - 0.35 * (k / nseg) ** 2)
        a = bm.verts.new(q - wv * w_ / 2); b = bm.verts.new(q + wv * w_ / 2)
        rows.append((a, b, s_))
    for k in range(nseg):
        a, b, s0 = rows[k]; c, d2, s1 = rows[k + 1]
        f = bm.faces.new((a, b, d2, c))
        v0 = 1 - (k / nseg) * (896 / 1024); v1 = 1 - ((k + 1) / nseg) * (896 / 1024)
        for l, uv in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
            l[uvl].uv = uv
            sh = 0.75 + 0.25 * (1 - (uv[1] < 0.9) * 0.0) if layer == 0 else 1.0
            l[cl] = (sh, sh, sh, 1)
    region = 'B' if (p0.y > -0.01 and not front) else ('L' if p0.x > PART_X else 'R')
    strands.append((rows, region, L))
cards = put('CK_HairCards', bm)
G = {n: cards.vertex_groups.new(name=M + n) for n in ('Head', 'HairL1', 'HairL2', 'HairR1', 'HairR2', 'HairB1', 'HairB2')}
vi = 0
for rows, region, L in strands:
    for (a, b, s_) in rows:
        wh = 1 - ss(0.08, 0.22, s_); w2 = ss(0.26, 0.42, s_); w1 = (1 - wh) * (1 - w2)
        for idx in (vi, vi + 1):
            for n, w in (('Head', wh), ('Hair%s1' % region, w1), ('Hair%s2' % region, (1 - wh) * w2)):
                if w > 1e-3: G[n].add([idx], w, 'REPLACE')
        vi += 2

# ---------------- brows + lashes ----------------
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); cl = bm.loops.layers.float_color.new('Col')
r_eye = LM['eyeRL']
def strip(top_pts, bot_pts, u0, u1, vt, vb):
    rows = [(bm.verts.new(a), bm.verts.new(b)) for a, b in zip(top_pts, bot_pts)]; n = len(rows)
    for k in range(n - 1):
        ua = u0 + (u1 - u0) * k / (n - 1); ub = u0 + (u1 - u0) * (k + 1) / (n - 1)
        f = bm.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]))
        for l, uv in zip(f.loops, ((ua, vt), (ub, vt), (ub, vb), (ua, vb))): l[uvl].uv = uv; l[cl] = (1, 1, 1, 1)
    return [v for r in rows for v in r]
lash_verts = {}
for e, sd in ((eL, 1), (eR, -1)):
    # brow: inner -> outer
    top_, bot_ = [], []
    for k in range(9):
        t = k / 8; dx = -0.017 + 0.04 * t
        zc = 0.0135 + 0.006 * math.sin(t * math.pi * 0.85) - 0.003 * max(0.0, t - 0.8) * 5
        hw = 0.0028 * (1 - 0.6 * t) * 1.15
        base = Vector((e.x + sd * dx, e.y - 0.03, e.z + zc))
        loc, n, _, _ = bvh.find_nearest(base)
        top_.append(loc + n * 0.0011 + Vector((0, 0, hw))); bot_.append(loc + n * 0.0008 - Vector((0, 0, hw)))
    strip(top_, bot_, 0.505, 0.995, 1 - 900 / 1024, 1 - 956 / 1024)
    # upper lashes along the lid margin (outer -> inner), roots on the lid, tips forward and up
    a_ = 0.0128; b_ = 0.0042; zc = 0.0005
    roots, tips = [], []
    for k in range(10):
        u = -1.0 + 2.0 * k / 9 * 1.02
        dz = zc + b_ * math.sqrt(max(0.0, 1 - min(1.0, u * u)))
        base = Vector((e.x + sd * u * a_, e.y - r_eye - 0.004, e.z + dz))
        loc, n, _, _ = bvh.find_nearest(base)
        Lh = 0.0085 * (1 - 0.4 * abs(u)) * (1.15 if u > 0.3 else 1.0)
        dv = (n * 0.45 + Vector((sd * 0.15 * u, -0.6, 0.55))).normalized()
        roots.append(loc + n * 0.0005); tips.append(loc + dv * Lh)
    lash_verts['Left' if sd > 0 else 'Right'] = strip(roots, tips, 0.505, 0.995, 1 - 962 / 1024, 1 - 1020 / 1024)
bm.verts.index_update(); lash_ids = {s_: [v.index for v in vs] for s_, vs in lash_verts.items()}
bl = put('CK_BrowsLashes', bm)
gH = bl.vertex_groups.new(name=M + 'Head')
gH.add(list(range(len(bl.data.vertices))), 1.0, 'REPLACE')
for s, ids in lash_ids.items():
    g = bl.vertex_groups.new(name=M + s + 'Eyelid')
    g.add(ids, 1.0, 'REPLACE'); gH.add(ids, 0.0, 'REPLACE')
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
print('hair', tris(cap), tris(cards), tris(bl))

# preview/bake source material for every hair part
m = bpy.data.materials.get('M_CK_Hair') or bpy.data.materials.new('M_CK_Hair')
m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
im = bpy.data.images.get('T_Chinka_Hair') or bpy.data.images.load(W + 'tex/T_Chinka_Hair.png'); im.name = 'T_Chinka_Hair'; im.reload()
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; t = nt.nodes.new('ShaderNodeTexImage'); t.image = im; nt.links.new(uv.outputs[0], t.inputs['Vector'])
vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
nt.links.new(t.outputs['Color'], mx.inputs['A']); nt.links.new(vc.outputs['Color'], mx.inputs['B']); nt.links.new(mx.outputs['Result'], p.inputs['Base Color'])
rd = nt.nodes.new('ShaderNodeMath'); rd.operation = 'ROUND'; nt.links.new(t.outputs['Alpha'], rd.inputs[0]); nt.links.new(rd.outputs[0], p.inputs['Alpha'])
p.inputs['Roughness'].default_value = 0.6
m['burns_kind'] = 'hair'; m.use_backface_culling = False
try: m.surface_render_method = 'DITHERED'
except Exception: pass
for ob in (cap, cards, bl):
    ob.data.materials.clear(); ob.data.materials.append(m)
    if not ob.data.color_attributes.get('Col'):
        ca = ob.data.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
        ca.data.foreach_set('color', [1.0] * (len(ob.data.loops) * 4))
