"""Realistic cast kit, step 4: hair styles per body, as alpha cards on T_Cast_Hair.png (light ash, tinted per character;
same layout as Chinka's hair texture: cap left half, card columns right). Objects '<S>_hair_<style>' (cards + cap), weighted
Head -> HairL/R/B down long strands. Styles: long, bob, short, slick, pony, bun, curly (afro), mohawk, buzz (cap only).
Collision with the head/neck/torso (not the T-posed arms). Run after kc_regions.py."""
import bpy, bmesh, json, math, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
W = '/Users/bradymott/brady-o/private/work/'
CFG = globals().get('KH_CFG', {})
M = 'mixamorig:'
coll = bpy.data.collections['Kit']
def ss(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)
mat = bpy.data.materials.get('M_KC_Hair') or bpy.data.materials.new('M_KC_Hair')
mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
im = bpy.data.images.get('T_Cast_Hair') or bpy.data.images.load(W + 'tex/T_Cast_Hair.png'); im.name = 'T_Cast_Hair'
uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'UVMap'; t = nt.nodes.new('ShaderNodeTexImage'); t.image = im; nt.links.new(uvn.outputs[0], t.inputs['Vector'])
nt.links.new(t.outputs['Color'], p.inputs['Base Color']); rd = nt.nodes.new('ShaderNodeMath'); rd.operation = 'ROUND'; nt.links.new(t.outputs['Alpha'], rd.inputs[0]); nt.links.new(rd.outputs[0], p.inputs['Alpha'])
p.inputs['Roughness'].default_value = 0.6; mat['burns_kind'] = 'hair'; mat.use_backface_culling = False
STYLES = {
    'long':   dict(L=(0.36, 0.50), n=230, fall=0.42, front_out=0.3, wave=0.010, face_open=True, wide=1.35),
    'bob':    dict(L=(0.16, 0.22), n=170, fall=0.45, front_out=0.2, wave=0.006, face_open=True, wide=1.2),
    'short':  dict(L=(0.05, 0.085), n=150, fall=0.1, front_out=0.0, wave=0.0, back=True),
    'slick':  dict(L=(0.08, 0.12), n=110, fall=0.12, front_out=0.0, wave=0.0, back=True, swept=True),
    'pony':   dict(L=(0.06, 0.1), n=100, fall=0.05, back=True, swept=True, tail=(0.30, 22)),
    'bun':    dict(L=(0.06, 0.1), n=100, fall=0.05, back=True, swept=True, bun=24),
    'curly':  dict(L=(0.025, 0.045), n=0, fall=0.0, radial=True, mass=0.04),
    'mohawk': dict(L=(0.07, 0.11), n=60, fall=0.0, mohawk=True),
    'buzz':   dict(n=0),
}
for S in globals().get('ONLY', ('F', 'M')):
    rig = bpy.data.objects['Arm%s' % S]; LM = json.load(open(W + 'proj/cast%s_lm.json' % S.lower()))
    # the full-resolution body (the region meshes are decimated: a cap built from them comes out faceted and peaked)
    full = bpy.data.objects['Cast%s_Body' % S]
    regs = [full]
    head = full
    verts, polys = [], []
    armx_ = bpy.data.objects['Arm%s' % S].data.bones['mixamorig:LeftArm'].head_local.x
    for ob in regs:
        off = len(verts); verts += [v.co.copy() for v in ob.data.vertices]
        polys += [[i + off for i in p.vertices] for p in ob.data.polygons if all(abs(ob.data.vertices[i].co.x) < armx_ - 0.01 or ob.data.vertices[i].co.z > 1.3 for i in p.vertices)]
    bvh = BVHTree.FromPolygons(verts, polys)
    def push(p, clr):
        loc, n, i, d = bvh.find_nearest(p)
        if loc is None: return p
        return loc + n * clr if (p - loc).dot(n) < clr else p
    Ph = np.array([v.co[:] for v in head.data.vertices]); nz_ = bpy.data.objects['Arm%s' % S].data.bones['mixamorig:Neck'].head_local.z; Ph = Ph[Ph[:, 2] > nz_ + 0.03]; top = float(Ph[:, 2].max())
    eL, eR = Vector(LM['eyeL']), Vector(LM['eyeR']); eye_z = (eL.z + eR.z) / 2
    HC = Vector((0.0, float((Ph[:, 1].max() + Ph[:, 1].min()) / 2), top - 0.105 * top / 1.75))
    CROWN = Vector((0.0, HC.y + 0.01, top))
    def hairline(x, y, fore=0.062):
        ty = min(max((y - (HC.y - 0.07)) / 0.13, 0.0), 1.0)
        front = eye_z + fore - 0.03 * min(1.0, abs(x) / 0.065) ** 2
        z = front * (1 - ty) + (eye_z - 0.075) * ty
        if abs(x) > 0.056 and HC.y - 0.045 < y < HC.y + 0.065: z = max(z, eye_z + 0.014 + 0.02 * ss(HC.y + 0.03, HC.y + 0.065, y))
        return z
    # the cap (shared by every style): scalp above the hairline, out 3 mm
    bm = bmesh.new(); bm.from_mesh(head.data)
    inside = [v.co.z > hairline(v.co.x, v.co.y) - 0.004 for v in bm.verts]
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(inside[v.index] for v in f.verts)], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    for l in list(bm.loops.layers.uv): bm.loops.layers.uv.remove(l)
    uvl = bm.loops.layers.uv.new('UVMap'); bm.normal_update()
    for v in bm.verts: v.co += v.normal * 0.0035
    def az(p): return math.atan2(p.x, (p.y - CROWN.y))
    NB = 36; bmax = [0.0] * NB
    for v in bm.verts:
        if v.is_boundary: b = int((az(v.co) + math.pi) / (2 * math.pi) * NB) % NB; bmax[b] = max(bmax[b], (v.co - CROWN).length)
    for i in range(NB):
        if bmax[i] == 0: bmax[i] = max(bmax[(i - 1) % NB], bmax[(i + 1) % NB], 0.15)
    for f in bm.faces:
        a0 = az(f.calc_center_median())
        for l in f.loops:
            a = az(l.vert.co)
            if abs(a - a0) > math.pi: a += 2 * math.pi if a < a0 else -2 * math.pi
            b = int((az(l.vert.co) + math.pi) / (2 * math.pi) * NB) % NB
            l[uvl].uv = (0.006 + (((a + math.pi) / (2 * math.pi)) * 1.5 % 0.5) * 0.988, 1.0 - min(1.0, (l.vert.co - CROWN).length / bmax[b]) * 0.99)
    cap_me = bpy.data.meshes.new('%s_capsrc' % S); bm.to_mesh(cap_me); bm.free()
    capbm = bmesh.new(); capbm.from_mesh(cap_me); capbm.faces.ensure_lookup_table()
    areas = np.array([f.calc_area() for f in capbm.faces]); cdf = np.cumsum(areas) / areas.sum()
    for style, st in STYLES.items():
        rng = np.random.default_rng(hash((S, style)) % 1000)
        name = '%s_hair_%s' % (S, style)
        old = bpy.data.objects.get(name)
        if old: bpy.data.objects.remove(old)
        bm = bmesh.new(); bm.from_mesh(cap_me); uvl = bm.loops.layers.uv['UVMap']
        ncap = len(bm.verts)
        if st.get('mass'):     # an inflated, rounded hair mass (afro): more volume on top and at the back
            bm.normal_update()
            for v in bm.verts:
                up = max(0.0, (v.co - HC).normalized().z)
                lump = 1 + 0.22 * math.sin(v.co.x * 160 + 1.3) * math.sin(v.co.y * 150) * math.sin(v.co.z * 170 + 0.7)
                v.co += v.normal * st['mass'] * (0.55 + 0.45 * up) * lump * ss(eye_z - 0.05, eye_z + 0.03, v.co.z)
        weights = []      # per card vertex: (region, dist from root)
        def card(pts, width, colk, region, Lr):
            nseg = len(pts) - 1
            u0 = (512 + colk * 128 + 6) / 1024; u1 = (512 + (colk + 1) * 128 - 6) / 1024
            rows = []; acc = 0.0
            for k, q in enumerate(pts):
                if k: acc += (pts[k] - pts[k - 1]).length
                tdir = (pts[min(k + 1, nseg)] - pts[max(k - 1, 0)]).normalized()
                outv = (q - HC); outv.z *= 0.3; outv = outv.normalized() if outv.length > 1e-5 else Vector((0, 1, 0))
                wv = tdir.cross(outv).normalized(); w_ = width * (1 - 0.35 * (k / nseg) ** 2)
                rows.append((bm.verts.new(q - wv * w_ / 2), bm.verts.new(q + wv * w_ / 2), acc))
                weights.append((region, acc)); weights.append((region, acc))
            for k in range(nseg):
                a, b, _ = rows[k]; c, d2, _ = rows[k + 1]
                f = bm.faces.new((a, b, d2, c))
                v0 = 1 - (k / nseg) * Lr; v1 = 1 - ((k + 1) / nseg) * Lr
                for l, uv in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))): l[uvl].uv = uv
        def root():
            for tries in range(30):
                f = capbm.faces[int(np.searchsorted(cdf, rng.random()))]
                vs = [v.co for v in f.verts]; a, b = rng.random(), rng.random()
                if a + b > 1: a, b = 1 - a, 1 - b
                p0 = vs[0] + (vs[1] - vs[0]) * a + (vs[-1] - vs[0]) * b
                if p0.z > hairline(p0.x, p0.y) + 0.01: return p0 - f.normal * 0.002, f.normal.copy()
            return p0, f.normal.copy()
        for ci in range(st['n']):
            p0, n0 = root()
            if st.get('mohawk') and abs(p0.x) > 0.022: continue
            side = 1 if p0.x > 0 else -1; front = p0.y < HC.y - 0.04
            L = rng.uniform(*st['L']); nseg = 8 if L > 0.15 else 4
            clr = 0.005 + rng.uniform(0, 0.004)
            if st.get('radial') or st.get('mohawk'):
                d = (p0 - HC).normalized() if st.get('radial') else Vector((0, 0.15, 1)).normalized()
                if st.get('mass'): p0 = p0 + n0 * st['mass'] * (0.4 + 0.45 * max(0.0, d.z)) * ss(eye_z - 0.05, eye_z + 0.03, p0.z)
                pts = [p0 + d * (L * k / nseg) + Vector((math.sin(k * 1.7 + ci) * 0.004, 0, 0)) for k in range(nseg + 1)]
                card(pts, rng.uniform(0.02, 0.03), int(rng.integers(0, 4)), 'H', 1.0 * L / 0.5 * 0.9 if L < 0.5 else 0.875); continue
            if st.get('swept') or st.get('back'):
                away = Vector((side * 0.25, 1.0, -0.15)) if not st.get('swept') else Vector((0, 1.0, -0.05))
                if not st.get('swept') and front: away = Vector((side * 0.9, 0.6, -0.3))
            else:
                away = Vector((side * 0.7, 0.25 if not front else -0.05, -0.45))
                if p0.y > HC.y + 0.03: away = Vector((side * 0.3, 1.0, -0.6))
            d = (away - n0 * away.dot(n0)).normalized()
            fall = Vector((side * (st.get('front_out', 0) if front else 0.05), (-0.12 if front else 0.12), -1.0)).normalized()
            pts = [p0.copy()]; p = p0.copy(); seg = L / nseg
            amp = st.get('wave', 0) * rng.uniform(0.6, 1.3); ph = rng.uniform(0, 6.3); acc = 0.0
            for k in range(nseg):
                t_ = (k + 1) / nseg
                d = (d * (1 - st['fall']) + fall * st['fall']).normalized() if st['fall'] else d
                p = p + d * seg; acc += seg
                p = push(p, min(clr, 0.003 + 0.02 * t_) + 0.003 * t_)
                if st.get('face_open') and eye_z - 0.13 < p.z < eye_z + 0.05 and p.y < HC.y - 0.015 and abs(p.x) < 0.09:
                    p.x = math.copysign(0.09, p.x if abs(p.x) > 1e-4 else side); p = push(p, clr)
                if p.z < eye_z - 0.05 and abs(p.x) > 0.16: p.x = math.copysign(0.16, p.x); p = push(p, clr)
                if amp: p = p + d.cross(Vector((0, 0, 1))).normalized() * amp * math.sin(acc / L * 7 + ph) * ss(0.06, 0.2, acc)
                pts.append(p.copy())
            region = 'B' if (p0.y > HC.y - 0.01 and not front) else ('L' if p0.x > 0 else 'R')
            card(pts, rng.uniform(0.024, 0.036) * st.get('wide', 1.0), int(rng.integers(0, 2)) if st.get('wide') else int(rng.integers(0, 4)), region, 896 / 1024 * min(1.0, L / 0.5 + 0.25))
        # pony tail / bun at the back of the crown
        if st.get('tail') or st.get('bun'):
            base = Vector((0.0, HC.y + 0.095, eye_z + 0.02))
            base = push(base, 0.012)
            if st.get('tail'):
                TL, nt_ = st['tail']
                for ci in range(nt_):
                    a = 2 * math.pi * ci / nt_; o = Vector((math.cos(a) * 0.014, 0.0, math.sin(a) * 0.014))
                    pts = [base + o * (1 - 0.3 * k / 6) + Vector((0, 0.04 * math.sin(k / 6 * 1.2), -TL * k / 6)) for k in range(7)]
                    for q in pts: q.y = max(q.y, HC.y + 0.09)
                    card(pts, 0.03, int(rng.integers(0, 3)), 'B', 0.75)
            if st.get('bun'):
                bc = base + Vector((0, 0.025, 0.04))
                for ci in range(st['bun']):
                    a = 2 * math.pi * ci / st['bun']; b_ = rng.uniform(-0.6, 0.6)
                    pts = [bc + Vector((math.cos(a + k * 0.5) * 0.035 * math.cos(b_), math.sin(a + k * 0.5) * 0.028 * math.cos(b_), 0.03 * math.sin(b_) + 0.004 * k)) for k in range(5)]
                    card(pts, 0.03, int(rng.integers(0, 3)), 'H', 0.3)
        ob_me = bpy.data.meshes.new(name); bm.to_mesh(ob_me); bm.free()
        for p_ in ob_me.polygons: p_.use_smooth = True
        ob = bpy.data.objects.new(name, ob_me); coll.objects.link(ob); ob.parent = rig
        am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
        ob_me.materials.append(mat); ob['kit_part'] = name
        G = {n: ob.vertex_groups.new(name=M + n) for n in ('Head', 'HairL1', 'HairL2', 'HairR1', 'HairR2', 'HairB1', 'HairB2')}
        G['Head'].add(list(range(ncap)), 1.0, 'REPLACE')
        for i, (region, s_) in enumerate(weights):
            vi = ncap + i
            if region == 'H': G['Head'].add([vi], 1.0, 'REPLACE'); continue
            wh = 1 - ss(0.08, 0.2, s_); w2 = ss(0.24, 0.4, s_); w1 = (1 - wh) * (1 - w2)
            for n, w in (('Head', wh), ('Hair%s1' % region, w1), ('Hair%s2' % region, (1 - wh) * w2)):
                if w > 1e-3: G[n].add([vi], w, 'REPLACE')
        print(name, sum(len(p_.vertices) - 2 for p_ in ob_me.polygons))
    capbm.free(); bpy.data.meshes.remove(cap_me)
