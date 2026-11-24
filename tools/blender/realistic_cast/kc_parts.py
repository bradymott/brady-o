"""Realistic cast kit, step 2: the costume parts, per body (F, M), each a separate mesh object named '<S>_<slot>_<kind>'
skinned to Arm<S> (weights from the body by nearest-face transfer, or the head for hats/glasses):
  top:    tee, long, tank, crop (F), vest          coat: long (a coat to the knee: long sleeves + flared skirt)
  bot:    pants, shorts, skirt (knee), tutu (short, flared)
  shoe:   sneakers, boots, sandals
  face:   beard, moustache (M)                    hat: cowboy, ranger, cap, sunhat, hardhat, tophat, fedora, beanie
  eyes:   shades, aviator, round, goggles (worn up on the forehead)
Garments are the body surface region, smoothed and pushed out, given a thin solidify; skirts are lofted like Chinka's.
Body faces under garments are NOT deleted (parts are mixed per character at runtime), so every garment sits 3+ mm out.
Materials are neutral (near-white cloth, light felt/straw, grey plastic): the engine tints each part per character.
Run in the open Blender after kc_humans.py: exec(open(path).read())."""
import bpy, bmesh, math, json, numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
W = '/Users/bradymott/brady-o/private/work/'
CFG = globals().get('KIT_CFG', {})
M = 'mixamorig:'
coll = bpy.data.collections.get('Kit') or bpy.data.collections.new('Kit')
if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
def ss(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)
def sel(objs, active=None):
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        if o: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def newmat(name, col, rough, metal=0.0, kind='cloth', noise=0.05, bump=0.12):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 300; nz.inputs['Detail'].default_value = 3
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 1 - noise; mr.inputs['To Max'].default_value = 1 + noise; nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    vm = nt.nodes.new('ShaderNodeVectorMath'); vm.operation = 'SCALE'; vm.inputs[0].default_value = col; nt.links.new(mr.outputs['Result'], vm.inputs['Scale'])
    nt.links.new(vm.outputs['Vector'], p.inputs['Base Color'])
    b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = 0.0005; nt.links.new(nz.outputs['Fac'], b.inputs['Height']); nt.links.new(b.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    m['burns_kind'] = kind; return m
MAT = {
    'cloth': newmat('M_KC_Cloth', (0.82, 0.82, 0.80), 0.78),
    'denim': newmat('M_KC_Denim', (0.80, 0.82, 0.86), 0.8, noise=0.12, bump=0.25),
    'leather': newmat('M_KC_Leather', (0.72, 0.70, 0.68), 0.5, kind='generic', noise=0.06),
    'felt': newmat('M_KC_Felt', (0.80, 0.78, 0.74), 0.85, kind='cloth', noise=0.08),
    'straw': newmat('M_KC_Straw', (0.86, 0.80, 0.62), 0.8, kind='generic', noise=0.18, bump=0.4),
    'plastic': newmat('M_KC_Plastic', (0.8, 0.8, 0.8), 0.32, kind='generic', noise=0.01, bump=0.02),
    'lens': newmat('M_KC_Lens', (0.06, 0.06, 0.07), 0.08, kind='generic', noise=0.0, bump=0.0),
    'metal': newmat('M_KC_Metal', (0.78, 0.76, 0.72), 0.3, metal=0.6, kind='generic', noise=0.02, bump=0.02),
    'sole': newmat('M_KC_Sole', (0.85, 0.84, 0.82), 0.6, kind='generic', noise=0.02),
    'beard': newmat('M_KC_Beard', (0.75, 0.75, 0.75), 0.7, kind='hair', noise=0.25, bump=0.5),
}
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)

for S in globals().get('ONLY', ('F', 'M')):
    body = bpy.data.objects['Cast%s_Body' % S]; rig = bpy.data.objects['Arm%s' % S]; me = body.data
    LM = json.load(open(W + 'proj/cast%s_lm.json' % S.lower()))
    B = lambda n: rig.data.bones[M + n]
    hipz = B('Hips').head_local.z; hipy = B('Hips').head_local.y
    armx = B('LeftArm').head_local.x; shz = B('LeftArm').head_local.z; elbx = B('LeftForeArm').head_local.x; wrx = B('LeftHand').head_local.x
    kneez = B('LeftLeg').head_local.z; anklez = B('LeftFoot').head_local.z; neckz = B('Neck').head_local.z
    P = np.array([v.co[:] for v in me.vertices])
    BVH = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [list(p.vertices) for p in me.polygons])
    top = float(P[:, 2].max())
    k_ = top / 1.75
    # waist: the narrowest torso level between hips and chest
    best = (9, hipz + 0.1)
    for zz in np.arange(hipz + 0.04, hipz + 0.26, 0.01):
        kk = (np.abs(P[:, 2] - zz) < 0.006) & (np.abs(P[:, 0]) < armx)
        if kk.sum() > 10:
            w = P[kk, 0].max() - P[kk, 0].min()
            if w < best[0]: best = (w, zz)
    waist = best[1]
    bust = float(P[(P[:, 2] > waist + 0.05) & (P[:, 2] < shz) & (np.abs(P[:, 0]) < armx)][:, 1].min())
    print(S, 'waist', round(waist, 3), 'hips', round(hipz, 3), 'knee', round(kneez, 3), 'ankle', round(anklez, 3), 'armx', round(armx, 3), 'shz', round(shz, 3))
    def put(name, bm, mat, smooth=True):
        old = bpy.data.objects.get(name)
        if old: bpy.data.objects.remove(old)
        m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
        for p in m.polygons: p.use_smooth = smooth
        ob = bpy.data.objects.new(name, m); coll.objects.link(ob); ob.parent = rig
        am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
        m.materials.append(MAT[mat]); ob['kit_part'] = name
        return ob
    def from_body(name, pred, off, mat, smooth_it=6, solid=0.0, keep_uv=True, shell=False, relax=6):
        bm = bmesh.new(); bm.from_mesh(me)
        inside = [pred(*v.co) for v in bm.verts]
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(inside[v.index] for v in f.verts)], context='FACES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        for it in range(smooth_it):
            bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        bm.normal_update()
        for v in bm.verts: v.co += v.normal * off(v.co)
        bverts = [v for v in bm.verts if v.is_boundary]
        # smoothing pulls curved areas back in: guarantee the clearance against the original body surface
        for it in range(2):
            for v in bm.verts:
                loc, n, _, _ = BVH.find_nearest(v.co)
                if loc is None: continue
                d = (v.co - loc).dot(n)
                # shells (shoes) only leave the body where they are inside it: no toes pressed back into the leather
                if (d < off(v.co) * 0.9 and not shell) or (shell and d < 0.002): v.co = loc + n * (off(v.co) if not shell else 0.003)
        for it in range(relax):
            newp = {}
            for v in bverts:
                nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
                if len(nb) == 2: newp[v] = v.co * 0.5 + (nb[0].co + nb[1].co) * 0.25
            for v, p in newp.items(): v.co = p
        ob = put(name, bm, mat)
        if solid:
            so = ob.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = solid; so.offset = -1.0; so.use_rim = True
        return ob
    # ---------- tops ----------
    def torso_pred(z0, sleeve_x, neck_front, neck_back, armhole=False, open_front=False):
        def f(x, y, z):
            ax = abs(x)
            if z < z0 or z > neckz + 0.03: return False
            if ax > sleeve_x: return False
            if ax > armx - 0.01 and z < shz - 0.07 and not armhole: return False      # sleeves leave the body at the armpit
            if armhole and ax > armx - 0.012 - 0.02 * ss(shz - 0.08, shz + 0.04, z): return False
            front = y < hipy - 0.02
            if front and z > neck_front - 0.6 * max(0.0, ax - 0.0) ** 1.0 * 0 and z > neck_front + 0.9 * ax: return False
            if not front and z > neck_back + 0.5 * ax: return False
            if open_front and front and ax < 0.035 + 0.02 * ss(neck_front, waist, z): return False
            return True
        return f
    cl = lambda c: 0.005 + 0.003 * ss(waist + 0.1, waist + 0.25, c.z) * ss(hipy - 0.08, hipy - 0.13, c.y)
    nf = neckz - 0.06 if S == 'F' else neckz - 0.045; nb_ = neckz - 0.01
    from_body('%s_top_tee' % S, torso_pred(hipz + 0.02, armx + 0.14, nf, nb_), cl, 'cloth')
    from_body('%s_top_long' % S, torso_pred(hipz + 0.02, wrx - 0.01, nf, nb_), cl, 'cloth')
    from_body('%s_top_tank' % S, torso_pred(hipz + 0.02, armx, nf - 0.02, nb_ - 0.03, armhole=True), cl, 'cloth')
    if S == 'F': from_body('%s_top_crop' % S, torso_pred(waist + 0.07, armx, nf - 0.02, nb_ - 0.03, armhole=True), cl, 'cloth')
    from_body('%s_top_vest' % S, torso_pred(hipz + 0.04, armx, nf - 0.06, nb_ - 0.02, armhole=True, open_front=True), lambda c: 0.011, 'cloth', solid=0.003)
    # ---------- bottoms ----------
    def legs_pred(z_lo, z_hi):
        return lambda x, y, z: z_lo < z < z_hi and abs(x) < armx + 0.05
    pl = lambda c: 0.006 + 0.005 * ss(kneez + 0.1, kneez - 0.2, c.z)
    from_body('%s_bot_pants' % S, legs_pred(anklez + 0.03, waist - 0.005), pl, 'denim')
    from_body('%s_bot_shorts' % S, legs_pred(kneez + 0.12, waist - 0.005), lambda c: 0.0055, 'cloth')
    # skirts: lofted, slightly flared, pleat-free, on the skirt bones (as Chinka's)
    def skirt(name, z_top, z_hem, flare, rows=7, seg=40, ruffle=0.0):
        def prof(zz):
            kk = (np.abs(P[:, 2] - zz) < 0.01) & (np.abs(P[:, 0]) < armx + 0.05)
            xs, ys = P[kk, 0], P[kk, 1]; return (xs.max() - xs.min()) / 2, (ys.max() - ys.min()) / 2, (ys.max() + ys.min()) / 2
        hp = prof(hipz + 0.02)
        bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); R = []
        for i in range(rows):
            t = i / (rows - 1); zz = z_top + (z_hem - z_top) * t
            if zz > hipz - 0.05: rx, ry, cy = prof(zz); e = 0.012
            else: rx, ry, cy = hp; e = 0.016
            rx += e + flare * t; ry += e + flare * 0.85 * t
            row = []
            for j in range(seg):
                th = 2 * math.pi * j / seg; r = 1 + (ruffle * t * math.sin(th * 14) if ruffle else 0)
                row.append(bm.verts.new((math.sin(th) * rx * r, cy - math.cos(th) * ry * r, zz)))
            R.append(row)
        for i in range(rows - 1):
            for j in range(seg):
                f = bm.faces.new((R[i][j], R[i + 1][j], R[i + 1][(j + 1) % seg], R[i][(j + 1) % seg]))
                for l, uv in zip(f.loops, ((j / seg, 1 - i / (rows - 1)), (j / seg, 1 - (i + 1) / (rows - 1)), ((j + 1) / seg, 1 - (i + 1) / (rows - 1)), ((j + 1) / seg, 1 - i / (rows - 1)))): l[uvl].uv = uv
        bm.normal_update()
        for f in bm.faces:
            c = f.calc_center_median()
            if f.normal.dot(Vector((c.x, c.y - hipy, 0))) < 0: f.normal_flip()
        ob = put(name, bm, 'cloth')
        so = ob.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = 0.003; so.offset = -1.0; so.use_rim = True
        G = {n: ob.vertex_groups.new(name=M + n) for n in ('Hips', 'SkirtF1', 'SkirtF2', 'SkirtB1', 'SkirtB2', 'SkirtL1', 'SkirtL2', 'SkirtR1', 'SkirtR2')}
        for v in ob.data.vertices:
            x, y, zz = v.co; t = min(max((z_top - zz) / max(z_top - z_hem, 1e-3), 0), 1)
            th = math.atan2(x, -(y - hipy))
            dirs = {'F': max(0.0, math.cos(th)), 'L': max(0.0, math.cos(th - math.pi / 2)), 'B': max(0.0, math.cos(th - math.pi)), 'R': max(0.0, math.cos(th + math.pi / 2))}
            tot = sum(w * w for w in dirs.values()); hip = 1 - ss(0.0, 0.25, t); lo = ss(0.5, 0.8, t)
            ws = {'Hips': hip}
            for k2, w in dirs.items():
                w = w * w / tot * (1 - hip)
                if w > 1e-4: ws['Skirt%s1' % k2] = w * (1 - lo); ws['Skirt%s2' % k2] = w * lo
            top4 = sorted(ws.items(), key=lambda a: -a[1])[:4]; s_ = sum(w for _, w in top4)
            for n, w in top4:
                if w > 1e-4: G[n].add([v.index], w / s_, 'REPLACE')
        return ob
    skirt('%s_bot_skirt' % S, waist - 0.005, kneez - 0.04, 0.06)
    skirt('%s_bot_tutu' % S, waist - 0.005, kneez + 0.16, 0.16, rows=5, seg=48, ruffle=0.06)
    # long coat: long sleeves pushed further out + a flared skirt to the knee
    from_body('%s_coat_long' % S, torso_pred(hipz - 0.02, wrx - 0.02, nf - 0.03, nb_ + 0.01, open_front=True), lambda c: 0.014, 'felt', solid=0.003)
    sk = skirt('%s_coat_longskirt' % S, hipz + 0.02, kneez - 0.1, 0.09)
    # ---------- shoes ----------
    from_body('%s_shoe_sneakers' % S, lambda x, y, z: z < anklez + 0.03 or (z < anklez + 0.05 and y < -0.1), lambda c: 0.009, 'sole', smooth_it=30, solid=0.0, shell=True, relax=14)
    from_body('%s_shoe_boots' % S, lambda x, y, z: z < anklez + 0.16 and abs(x) < armx, lambda c: 0.010, 'leather', smooth_it=30, solid=0.0, shell=True, relax=16)
    from_body('%s_shoe_sandals' % S, lambda x, y, z: z < 0.018, lambda c: 0.004, 'leather', smooth_it=6, solid=0.0)
    for n in ('%s_shoe_sneakers' % S, '%s_shoe_boots' % S, '%s_shoe_sandals' % S):
        ob = bpy.data.objects[n]; bm = bmesh.new(); bm.from_mesh(ob.data)
        for v in bm.verts:
            if v.co.z < 0.006: v.co.z = 0.0
        bm.to_mesh(ob.data); bm.free()
        so = ob.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = 0.004; so.offset = -1.0; so.use_rim = True
    # ---------- beard (M): the jaw/cheek/upper-lip skin, pushed out ----------
    eL = Vector(LM['eyeL']); eye_z = eL.z; seam = LM['seam']; lipF = LM['lipFront'][1]
    if S == 'M':
        def beard_pred(x, y, z):
            if y > -0.02 or z > eye_z - 0.045 or z < neckz - 0.03: return False
            if abs(x) > 0.075: return False
            lips = abs(z - seam) < 0.009 and abs(x) < 0.026 and y < lipF + 0.02
            return not lips
        from_body('M_face_beard', beard_pred, lambda c: 0.004, 'beard', smooth_it=3, solid=0.0)
        def stache_pred(x, y, z): return seam + 0.004 < z < seam + 0.018 and abs(x) < 0.03 and y < lipF + 0.012
        from_body('M_face_moustache', stache_pred, lambda c: 0.0035, 'beard', smooth_it=2, solid=0.0)
    # ---------- head pieces: built around the head, weighted to Head ----------
    hb = B('Head'); hz0 = hb.head_local.z
    hv = P[(P[:, 2] > hz0 + 0.03)]
    HC = Vector(((hv[:, 0].max() + hv[:, 0].min()) / 2, (hv[:, 1].max() + hv[:, 1].min()) / 2, (P[:, 2].max() + hz0 + 0.03) / 2))
    HR = Vector(((hv[:, 0].max() - hv[:, 0].min()) / 2, (hv[:, 1].max() - hv[:, 1].min()) / 2, (P[:, 2].max() - hz0 - 0.03) / 2))
    crown = float(P[:, 2].max())
    def head_part(name, build, mat):
        bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
        build(bm); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        ob = put(name, bm, mat); g = ob.vertex_groups.new(name=M + 'Head'); g.add(list(range(len(ob.data.vertices))), 1.0, 'REPLACE')
        sel([ob]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02); bpy.ops.object.mode_set(mode='OBJECT')
        return ob
    def lathe(bm, prof, seg, c, sx=1.0, sy=1.0, tilt=0.0):
        """revolve (r, z) pairs about the vertical through c; sx/sy scale the ring; tilt pitches it (rad, front down)"""
        rows = []
        R = Matrix.Rotation(tilt, 3, 'X')
        for r, z in prof:
            rows.append([bm.verts.new(c + R @ Vector((math.sin(2 * math.pi * j / seg) * r * sx, -math.cos(2 * math.pi * j / seg) * r * sy, z))) for j in range(seg)])
        for i in range(len(rows) - 1):
            for j in range(seg): bm.faces.new((rows[i][j], rows[i][(j + 1) % seg], rows[i + 1][(j + 1) % seg], rows[i + 1][j]))
        return rows
    hx, hy = HR.x + 0.012, HR.y + 0.012
    brow_z = eye_z + 0.032
    def band_z(back=0.0): return brow_z + 0.012
    sxr = hx / hy
    capc = Vector((HC.x, HC.y, brow_z + 0.01))
    def hat_cowboy(bm):
        prof = [(hy * 1.95, -0.005), (hy * 1.7, 0.012), (hy * 1.08, 0.0), (hy * 1.02, 0.02), (hy * 0.98, 0.09), (hy * 0.8, 0.125), (hy * 0.3, 0.13), (0.0, 0.118)]
        rows = lathe(bm, prof, 28, capc, sx=sxr, tilt=0.12)
        for j in range(28):   # curl the side brims up
            v = rows[0][j]; s = abs(math.sin(2 * math.pi * j / 28)); v.co.z += 0.045 * s * s; rows[1][j].co.z += 0.02 * s * s
    def hat_ranger(bm):
        prof = [(hy * 1.75, 0.0), (hy * 1.7, 0.006), (hy * 1.05, 0.004), (hy * 1.02, 0.03), (hy * 0.95, 0.11), (hy * 0.55, 0.15), (0.0, 0.155)]
        rows = lathe(bm, prof, 28, capc, sx=sxr, tilt=0.05)
        for j in range(28):   # the four-dent "Montana" pinch
            for i in (5, 6):
                if i < len(rows): rows[i][j].co.z -= 0.025 * abs(math.cos(2 * math.pi * j / 28 * 2))
    def hat_cap(bm):
        prof = [(hy * 1.03, 0.0), (hy * 1.0, 0.03), (hy * 0.85, 0.08), (hy * 0.45, 0.115), (0.0, 0.12)]
        lathe(bm, prof, 24, capc + Vector((0, 0.005, -0.005)), sx=sxr, tilt=0.1)
        # bill
        bz = capc.z + 0.005; by = HC.y - hy * 1.0
        vs = [bm.verts.new((HC.x + x * hx * 0.85, by - d, bz - d * 0.18)) for d in (0.0, 0.075) for x in (-1, -0.5, 0, 0.5, 1)]
        for i in range(4): bm.faces.new((vs[i], vs[i + 1], vs[i + 6], vs[i + 5]))
    def hat_sunhat(bm):
        prof = [(hy * 2.45, -0.03), (hy * 2.0, -0.01), (hy * 1.06, 0.004), (hy * 1.02, 0.03), (hy * 0.92, 0.09), (hy * 0.4, 0.115), (0.0, 0.112)]
        lathe(bm, prof, 32, capc, sx=sxr, tilt=0.08)
    def hat_hardhat(bm):
        prof = [(hy * 1.32, 0.0), (hy * 1.3, 0.01), (hy * 1.08, 0.012), (hy * 1.05, 0.05), (hy * 0.9, 0.11), (hy * 0.5, 0.145), (0.0, 0.15)]
        lathe(bm, prof, 28, capc + Vector((0, 0, 0.005)), sx=sxr, tilt=0.08)
    def hat_tophat(bm):
        prof = [(hy * 1.6, 0.0), (hy * 1.55, 0.008), (hy * 1.02, 0.008), (hy * 1.0, 0.03), (hy * 1.04, 0.19), (hy * 1.02, 0.2), (0.0, 0.2)]
        lathe(bm, prof, 28, capc, sx=sxr, tilt=0.05)
    def hat_fedora(bm):
        prof = [(hy * 1.62, 0.0), (hy * 1.55, 0.012), (hy * 1.05, 0.008), (hy * 1.02, 0.03), (hy * 0.96, 0.1), (hy * 0.6, 0.13), (0.0, 0.118)]
        rows = lathe(bm, prof, 28, capc, sx=sxr, tilt=0.1)
        for j in range(28):
            s = math.cos(2 * math.pi * j / 28)
            rows[0][j].co.z += 0.02 * max(0.0, -s)   # brim up at the back
    def hat_beanie(bm):
        prof = [(hy * 1.06, -0.012), (hy * 1.06, 0.03), (hy * 0.98, 0.08), (hy * 0.7, 0.13), (0.0, 0.15)]
        lathe(bm, prof, 24, capc + Vector((0, 0.008, 0)), sx=sxr, tilt=0.12)
    for kind, fn, mat in (('cowboy', hat_cowboy, 'straw'), ('ranger', hat_ranger, 'felt'), ('cap', hat_cap, 'cloth'), ('sunhat', hat_sunhat, 'straw'),
                          ('hardhat', hat_hardhat, 'plastic'), ('tophat', hat_tophat, 'felt'), ('fedora', hat_fedora, 'felt'), ('beanie', hat_beanie, 'cloth')):
        head_part('%s_hat_%s' % (S, kind), fn, mat)
    # glasses: two lenses on the eye line + frame; goggles up on the forehead
    eR = Vector(LM['eyeR']); ey = eL.y - LM['eyeRL'] - 0.012
    def lens(bm, c, rx, rz, depth=0.002, seg=16, ring=0.0015):
        o = [bm.verts.new(c + Vector((math.cos(2 * math.pi * j / seg) * rx, 0, math.sin(2 * math.pi * j / seg) * rz))) for j in range(seg)]
        b = [bm.verts.new(v.co + Vector((0, depth, 0))) for v in o]
        bm.faces.new(o); bm.faces.new(list(reversed(b)))
        for j in range(seg): bm.faces.new((o[j], o[(j + 1) % seg], b[(j + 1) % seg], b[j]))
    def frame_bar(bm, a, b, r=0.0016):
        d = (b - a); n = d.normalized(); u = n.orthogonal().normalized() * r; w = n.cross(u).normalized() * r
        vs = [bm.verts.new(p + q) for p in (a, b) for q in (u, w, -u, -w)]
        for i in range(4): bm.faces.new((vs[i], vs[(i + 1) % 4], vs[4 + (i + 1) % 4], vs[4 + i]))
    def glasses(rx, rz, style):
        def build(bm):
            for e in (eL, eR):
                c = Vector((e.x * 1.08, ey, e.z + (0.001 if style != 'aviator' else -0.002)))
                lens(bm, c, rx, rz)
            frame_bar(bm, Vector((eL.x * 1.08 - rx, ey, eL.z + 0.003)), Vector((eR.x * 1.08 + rx, ey, eR.z + 0.003)), 0.0013)
            for e, s in ((eL, 1), (eR, -1)):
                a = Vector((e.x * 1.08 + s * rx, ey, e.z + 0.004)); b = Vector((s * (HR.x + 0.004), HC.y + 0.01, e.z + 0.006)); frame_bar(bm, a, b, 0.0012)
        return build
    head_part('%s_eyes_shades' % S, glasses(0.021, 0.017, 'shades'), 'lens')
    head_part('%s_eyes_aviator' % S, glasses(0.02, 0.019, 'aviator'), 'lens')
    head_part('%s_eyes_round' % S, glasses(0.016, 0.016, 'round'), 'lens')
    def goggles(bm):
        for e in (eL, eR):
            lens(bm, Vector((e.x * 1.15, HC.y - hy * 0.97, brow_z + 0.035)), 0.022, 0.018, depth=0.014)
        lathe(bm, [(hy * 1.03, 0.0), (hy * 1.03, 0.012)], 24, Vector((HC.x, HC.y, brow_z + 0.028)), sx=sxr)
    head_part('%s_eyes_goggles' % S, goggles, 'metal')
    # ---------- weights from the body for the body-surface parts ----------
    def transfer(ob):
        for vg in list(ob.vertex_groups): ob.vertex_groups.remove(vg)
        sel([ob])
        dt = ob.modifiers.new('DT', 'DATA_TRANSFER'); dt.object = body; dt.use_vert_data = True
        dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
        dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
        bpy.ops.object.datalayout_transfer(modifier='DT')
        bpy.ops.object.modifier_move_to_index(modifier='DT', index=0); bpy.ops.object.modifier_apply(modifier='DT')
    for ob in [o for o in coll.objects if o.name.startswith(S + '_') and ('_top_' in o.name or '_bot_pants' in o.name or '_bot_shorts' in o.name or '_coat_long' == o.name[1:11] or '_shoe_' in o.name or '_face_' in o.name)]:
        if ob.name.endswith('skirt') or ob.name.endswith('tutu'): continue
        transfer(ob)
    print(S, {o.name: tris(o) for o in coll.objects if o.name.startswith(S + '_')})
