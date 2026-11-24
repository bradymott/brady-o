"""Realistic Chinka, step 4: the ivory-and-gold gown Brady chose for the 3D games (ivory fabric, pleated skirt, gold
accents) plus her LED necklace, gold hoops and bangles, gold flats. T-pose, Blender space (front = -Y).
  Bodice  - the body surface from the waist up, pushed out, sleeveless with straps, a modest V neckline; gold trim
            along the neckline and armholes (vertex attribute 'Trim' read by the material).
  Belt    - a gold band at the natural waist.
  Skirt   - a lofted, accordion-pleated A-line from the waist to the floor; inner hem band; weights on Hips and the
            eight skirt bones (front/back/left/right x upper/lower) by angle and height.
  Flats   - gold slippers from the foot surface.
  Jewelry - LED bead necklace (emissive beads + gold chain), twisted gold hoops, wrist bangles, an upper-arm cuff.
Body faces hidden under the bodice and between waist and knees are deleted. Weights of body-surface garments come from
the body by nearest-face data transfer. Run in the open Blender: exec(open(path).read())."""
import bpy, bmesh, json, math, numpy as np
from mathutils import Vector, Matrix
W = '/Users/bradymott/brady-o/private/work/'
LM = json.load(open(W + 'proj/chinka_lm.json'))
CFG = globals().get('GOWN_CFG', {})
body = bpy.data.objects['Chinka_Body']; me = body.data; rig = bpy.data.objects['Armature']; M = 'mixamorig:'
coll = bpy.data.collections.get('Gown') or bpy.data.collections.new('Gown')
if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def put(name, bm, smooth=True):
    old = bpy.data.objects.get(name)
    if old: bpy.data.objects.remove(old)
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
    for p in m.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, m); coll.objects.link(ob); ob.parent = rig
    am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
    return ob
def ss(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)
WAIST = CFG.get('waist', 1.085)        # bottom of the belt = top of the skirt
BELT = CFG.get('belt', 0.04)
APEX = 1.22
VBOT = CFG.get('v_bottom', APEX + 0.055)
def neck_ok(x, y, z, shrink=0.0):
    """inside the bodice (above the waist): torso only, sleeveless, straps over the shoulders, V neckline, scoop back"""
    ax = abs(x)
    if z < WAIST - 0.01 + shrink: return False
    arm = 0.172 - 0.034 * ss(1.24, 1.36, z)          # armhole: the cut moves inward toward the shoulder
    if ax > arm - shrink: return False
    top_front = VBOT + 1.15 * ax
    strap = 0.058 + shrink < ax < 0.118 - shrink
    if y < -0.035:                                     # front
        if z > top_front - shrink and not (strap and z < 1.47): return False
    else:                                              # back: scoop
        if z > 1.33 - shrink and not (strap and z < 1.47): return False
    if z > 1.465: return False
    return True
P = np.array([v.co[:] for v in me.vertices])

# ---------------- bodice ----------------
def from_body(name, pred, off, smooth_it=4, solid=0.0018):
    bm = bmesh.new(); bm.from_mesh(me)
    inside = [pred(*v.co) for v in bm.verts]
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(inside[v.index] for v in f.verts)], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    for it in range(smooth_it):
        bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * off(v.co)
    # relax hems
    bverts = [v for v in bm.verts if v.is_boundary]
    for it in range(6):
        newp = {}
        for v in bverts:
            nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
            if len(nb) == 2: newp[v] = v.co * 0.5 + (nb[0].co + nb[1].co) * 0.25
        for v, p in newp.items(): v.co = p
    ob = put(name, bm)
    if solid:
        so = ob.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = solid; so.offset = -1.0; so.use_rim = True
        bpy.context.view_layer.objects.active = ob
    return ob
bod = from_body('CK_Bodice', neck_ok, lambda c: 0.0035 + 0.003 * ss(1.15, 1.25, c.z) * ss(-0.12, -0.15, c.y), smooth_it=CFG.get('bodice_smooth', 12))
# trim attribute: distance (m) to the bodice's open edges (neckline, armholes, straps), not the waist
bm = bmesh.new(); bm.from_mesh(bod.data)
edge_pts = [v.co.copy() for v in bm.verts if v.is_boundary and v.co.z > WAIST + 0.02]
from mathutils.kdtree import KDTree
kd = KDTree(len(edge_pts))
for i, p in enumerate(edge_pts): kd.insert(p, i)
kd.balance()
d = [kd.find(v.co)[2] for v in bm.verts]
bm.free()
at = bod.data.attributes.new('Trim', 'FLOAT', 'POINT'); at.data.foreach_set('value', d)

# ---------------- belt ----------------
def belt_pred(x, y, z, shrink=0.0): return WAIST - 0.015 < z < WAIST + BELT + 0.015 and abs(x) < 0.2
belt = from_body('CK_Belt', belt_pred, lambda c: 0.009, smooth_it=8, solid=0.003)
bm = bmesh.new(); bm.from_mesh(belt.data)
for v in bm.verts:
    if v.co.z < WAIST: v.co.z = WAIST
    if v.co.z > WAIST + BELT: v.co.z = WAIST + BELT
bm.to_mesh(belt.data); bm.free()

# ---------------- skirt ----------------
def ring_profile(zz):
    """the body's half-widths and centre at this height (legs and hips together), from the vertices"""
    k = (np.abs(P[:, 2] - zz) < 0.012) & (np.abs(P[:, 0]) < 0.26)
    if k.sum() < 8: return None
    xs, ys = P[k, 0], P[k, 1]
    return (xs.max() - xs.min()) / 2, (ys.max() - ys.min()) / 2, (ys.max() + ys.min()) / 2
top_p = ring_profile(WAIST + 0.005); hip_p = ring_profile(0.86)
NP = CFG.get('pleats', 36); SEG = NP * 4
HEM = CFG.get('hem', 0.035)
levels = []
nz = CFG.get('levels', 13)
for i in range(nz):
    t = i / (nz - 1); zz = WAIST + 0.006 + (HEM - WAIST - 0.006) * t
    # A-line: hug the hips (ease 2.5 cm), then flare to the floor
    pr = ring_profile(zz) if zz > 0.80 else None
    rx_h, ry_h, cy_h = hip_p
    if pr:     # follow the body from the waist into the hips (ease grows a little with depth)
        e = 0.014 + 0.012 * min(1.0, (WAIST - zz) / 0.2)
        rx, ry, cy = pr[0] + e, pr[1] + e, pr[2]
    else:
        f = (0.86 - zz) / 0.86
        rx = rx_h + 0.024 + f * CFG.get('flare_x', 0.15); ry = ry_h + 0.026 + f * CFG.get('flare_y', 0.13); cy = cy_h - 0.01 * f
    levels.append((zz, rx, ry, cy, t))
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
rows = []
for zz, rx, ry, cy, t in levels:
    depth = 0.006 + 0.016 * t                          # pleat depth grows toward the hem
    row = []
    for j in range(SEG):
        th = 2 * math.pi * j / SEG
        pl = [0.0, 1.0, 0.0, -1.0][j % 4] * depth      # accordion: out, mid, in, mid
        r = 1.0 + pl / max(rx, ry)
        x = math.sin(th) * rx * r; y = cy - math.cos(th) * ry * r
        row.append(bm.verts.new((x, y, zz)))
    rows.append(row)
for i in range(len(rows) - 1):
    for j in range(SEG):
        a, b, c, d2 = rows[i][j], rows[i][(j + 1) % SEG], rows[i + 1][(j + 1) % SEG], rows[i + 1][j]
        f = bm.faces.new((a, d2, c, b))
        for l, (u, v) in zip(f.loops, ((j / SEG, 1 - i / (nz - 1)), (j / SEG, 1 - (i + 1) / (nz - 1)), ((j + 1) / SEG, 1 - (i + 1) / (nz - 1)), ((j + 1) / SEG, 1 - i / (nz - 1)))):
            l[uvl].uv = (u, v)
bm.normal_update()
# outward normals (faces should face away from the axis)
for f in bm.faces:
    c = f.calc_center_median(); out = Vector((c.x, c.y - levels[0][3], 0))
    if f.normal.dot(out) < 0: f.normal_flip()
# inner hem band: the bottom 22 cm duplicated inward, faces flipped (the inside of the skirt is seen from low angles)
band_rows = [i for i, l in enumerate(levels) if l[0] < 0.26]
inner = {}
for i in band_rows:
    for j in range(SEG):
        v = rows[i][j]; c = Vector((0, levels[i][3], v.co.z)); dirv = (v.co - c); dirv.z = 0; dirv.normalize()
        inner[(i, j)] = bm.verts.new(v.co - dirv * 0.0025)
for i in band_rows[:-1]:
    for j in range(SEG):
        a, b, c, d2 = inner[(i, j)], inner[(i, (j + 1) % SEG)], inner[(i + 1, (j + 1) % SEG)], inner[(i + 1, j)]
        f = bm.faces.new((a, b, c, d2))
        for l, (u, v) in zip(f.loops, ((j / SEG, 0.02), ((j + 1) / SEG, 0.02), ((j + 1) / SEG, 0.0), (j / SEG, 0.0))): l[uvl].uv = (u, v)
last = band_rows[-1]
for j in range(SEG):          # rim at the hem
    a, b = rows[last][j], rows[last][(j + 1) % SEG]; c, d2 = inner[(last, (j + 1) % SEG)], inner[(last, j)]
    f = bm.faces.new((a, b, c, d2))
    for l in f.loops: l[uvl].uv = (j / SEG, 0.0)
bm.normal_update()
sk = put('CK_Skirt', bm)
# skirt weights: Hips at the top, then the four directions x two segments
names = ['Hips', 'SkirtF1', 'SkirtF2', 'SkirtB1', 'SkirtB2', 'SkirtL1', 'SkirtL2', 'SkirtR1', 'SkirtR2']
G = {n: sk.vertex_groups.new(name=M + n) for n in names}
cy0 = levels[0][3]
for v in sk.data.vertices:
    x, y, zz = v.co
    t = min(max((WAIST - zz) / (WAIST - HEM), 0), 1)
    th = math.atan2(x, -(y - cy0))                     # 0 = front, +pi/2 = her left (+x)
    dirs = {'F': max(0.0, math.cos(th)), 'L': max(0.0, math.cos(th - math.pi / 2)), 'B': max(0.0, math.cos(th - math.pi)), 'R': max(0.0, math.cos(th + math.pi / 2))}
    tot = sum(w * w for w in dirs.values())
    hip = 1 - ss(0.0, 0.14, t)
    lo = ss(0.38, 0.62, t)
    ws = {'Hips': hip}
    for k_, w in dirs.items():
        w = w * w / tot * (1 - hip)
        if w < 1e-4: continue
        ws['Skirt%s1' % k_] = w * (1 - lo); ws['Skirt%s2' % k_] = w * lo
    top4 = sorted(ws.items(), key=lambda a: -a[1])[:4]; s = sum(w for _, w in top4)
    for n, w in top4:
        if w > 1e-4: G[n].add([v.index], w / s, 'REPLACE')

# ---------------- flats ----------------
def shoe_pred(x, y, z, shrink=0.0): return z < 0.052 - shrink or (z < 0.075 and y < -0.12)
fl = from_body('CK_Flats', shoe_pred, lambda c: 0.0035, smooth_it=10, solid=0.0)
bm = bmesh.new(); bm.from_mesh(fl.data)
for v in bm.verts:
    if v.co.z < 0.004: v.co.z = 0.0
bm.to_mesh(fl.data); bm.free()
so = fl.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = 0.004; so.offset = -1.0; so.use_rim = True

# ---------------- jewelry ----------------
def ring_mesh(bm, center, axis, R, r, seg=24, tseg=6, twist=0, uv=(0.5, 0.5)):
    """a torus (optionally twisted: a rope of two strands) around `axis`"""
    ax = Vector(axis).normalized(); a1 = ax.orthogonal().normalized(); a2 = ax.cross(a1)
    uvl = bm.loops.layers.uv.active
    rowsv = []
    for i in range(seg):
        u = 2 * math.pi * i / seg; cdir = a1 * math.cos(u) + a2 * math.sin(u)
        rr = r * (1 + (0.35 * math.cos(twist * u * 2) if twist else 0))
        row = []
        for k in range(tseg):
            w = 2 * math.pi * k / tseg + (twist * u if twist else 0)
            p = Vector(center) + cdir * (R + rr * math.cos(w)) + ax * rr * math.sin(w)
            row.append(bm.verts.new(p))
        rowsv.append(row)
    for i in range(seg):
        for k in range(tseg):
            f = bm.faces.new((rowsv[i][k], rowsv[(i + 1) % seg][k], rowsv[(i + 1) % seg][(k + 1) % tseg], rowsv[i][(k + 1) % tseg]))
            for l in f.loops: l[uvl].uv = uv
bm = bmesh.new(); bm.loops.layers.uv.new('UVMap')
# hoops at the earlobes
for s in (1, -1):
    lobe = Vector((s * CFG.get('lobe_x', 0.071), CFG.get('lobe_y', -0.045), CFG.get('lobe_z', 1.512)))
    ring_mesh(bm, lobe + Vector((s * 0.003, 0, -0.011)), (1, 0, 0), 0.0105, 0.0022, seg=20, tseg=6, twist=3)
# bangles at the wrists, a cuff on the upper arm (T-pose: arms along x)
for s in (1, -1):
    for xx, R, r in ((0.585, 0.034, 0.0028), (0.600, 0.034, 0.0024), (0.27, 0.041, 0.003)):
        ring_mesh(bm, (s * xx, -0.031, 1.331), (1, 0, 0), R, r, seg=22, tseg=5)
jw = put('CK_Gold', bm)
# necklace: a chain around the base of the neck dipping in front, LED beads along it
bm = bmesh.new(); bm.loops.layers.uv.new('UVMap')
pts = []
NB = CFG.get('beads', 26)
for i in range(NB * 4):
    u = 2 * math.pi * i / (NB * 4)
    x = math.sin(u) * 0.072; yb = -0.028 - math.cos(u) * 0.066
    zz = 1.405 + 0.02 * math.cos(u) * 0 - 0.045 * max(0.0, math.cos(u)) ** 2
    pts.append(Vector((x, yb, zz)))
# push the chain out of the skin: nearest body point + 3 mm
from mathutils.bvhtree import BVHTree
bvh = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [list(p.vertices) for p in me.polygons])
for i, p in enumerate(pts):
    loc, n, _, dd = bvh.find_nearest(p)
    if loc is not None: pts[i] = loc + n * 0.0032
uvl = bm.loops.layers.uv.active
for i in range(len(pts)):
    a, b = pts[i], pts[(i + 1) % len(pts)]
    ring_mesh  # (chain drawn as a thin tube below)
tube = []
for p in pts: tube.append(p)
seg = len(tube); tseg = 4
vv = []
for i in range(seg):
    t_ = (tube[(i + 1) % seg] - tube[i - 1]).normalized(); a1 = t_.orthogonal().normalized(); a2 = t_.cross(a1)
    vv.append([bm.verts.new(tube[i] + (a1 * math.cos(2 * math.pi * k / tseg) + a2 * math.sin(2 * math.pi * k / tseg)) * 0.0011) for k in range(tseg)])
for i in range(seg):
    for k in range(tseg):
        f = bm.faces.new((vv[i][k], vv[(i + 1) % seg][k], vv[(i + 1) % seg][(k + 1) % tseg], vv[i][(k + 1) % tseg]))
        for l in f.loops: l[uvl].uv = (0.5, 0.5)
chain = put('CK_Chain', bm)
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
cols = CFG.get('led', ['#ff3fb0', '#38e8ff', '#ffd25a', '#a35cff', '#7dff5a'])
bead_col = bm.loops.layers.float_color.new('LED')
for i in range(NB):
    p = pts[i * 4]
    loc, n, _, dd = bvh.find_nearest(p)
    c = p + (n * 0.0025 if n is not None else Vector())
    sub = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=CFG.get('bead_r', 0.0048))
    h_ = cols[i % len(cols)].lstrip('#'); rgb = [int(h_[k:k + 2], 16) / 255 for k in (0, 2, 4)]
    for v in sub['verts']: v.co += c
    for f in {f for v in sub['verts'] for f in v.link_faces}:
        for l in f.loops: l[uvl].uv = (0.5, 0.5); l[bead_col] = (*rgb, 1.0)
beads = put('CK_LED', bm)

# ---------------- weights from the body (bodice, belt, flats, chain, beads, gold) ----------------
def transfer(ob):
    for vg in list(ob.vertex_groups): ob.vertex_groups.remove(vg)
    sel([ob])
    dt = ob.modifiers.new('DT', 'DATA_TRANSFER'); dt.object = body; dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
    dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
    bpy.ops.object.datalayout_transfer(modifier='DT')
    bpy.ops.object.modifier_move_to_index(modifier='DT', index=0); bpy.ops.object.modifier_apply(modifier='DT')
    for fx in ('Jaw', 'LeftEyelid', 'RightEyelid', 'LeftMouth', 'RightMouth'):
        g = ob.vertex_groups.get(M + fx)
        if g:      # jewelry near the face follows the head, not the jaw/lid joints
            hg = ob.vertex_groups.get(M + 'Head') or ob.vertex_groups.new(name=M + 'Head')
            for v in ob.data.vertices:
                w = next((x.weight for x in v.groups if x.group == g.index), 0)
                if w: hg.add([v.index], min(1, next((x.weight for x in v.groups if x.group == hg.index), 0) + w), 'REPLACE')
            ob.vertex_groups.remove(g)
for ob in (bod, belt, fl, chain, beads):
    transfer(ob)
# earrings: head only; bangles/cuff: the arm bone they sit on
jw_ = jw
for vg in list(jw_.vertex_groups): jw_.vertex_groups.remove(vg)
gH = jw_.vertex_groups.new(name=M + 'Head')
gA = {s: jw_.vertex_groups.new(name=M + s + 'Arm') for s in ('Left', 'Right')}
gF = {s: jw_.vertex_groups.new(name=M + s + 'ForeArm') for s in ('Left', 'Right')}
for v in jw_.data.vertices:
    x = v.co.x; s = 'Left' if x > 0 else 'Right'
    if abs(x) < 0.15: gH.add([v.index], 1, 'REPLACE')
    elif abs(x) < 0.4: gA[s].add([v.index], 1, 'REPLACE')
    else: gF[s].add([v.index], 1, 'REPLACE')

# ---------------- delete hidden body faces ----------------
if not CFG.get('no_body_cut'):
    bm = bmesh.new(); bm.from_mesh(me)
    def hidden(c):
        x, y, z = c
        return neck_ok(x, y, z, 0.02) or (0.50 < z < WAIST + BELT - 0.01 and abs(x) < 0.3 and not (z > WAIST - 0.02 and abs(x) > 0.15))
    flag = [hidden(v.co) for v in bm.verts]
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(flag[v.index] for v in f.verts)], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(me); bm.free()
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
print({o.name: tris(o) for o in (body, bod, belt, sk, fl, jw, chain, beads)})
