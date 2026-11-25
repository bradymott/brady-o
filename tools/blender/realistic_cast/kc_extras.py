"""Realistic cast kit, fix round (run on the game scene right after kc_game.py, before the clips):
  hats     solid shells (both sides, no slivers seen edge-on), the sun hat's brim smaller and tilted up
  hair     clean solid shapes instead of alpha cards, opaque on the body texture set (no extra draw):
           hair_cap (smooth, some volume), hair_buzz (thin), hair_slick, add-ons hair_bun, hair_pony, hair_bobsheets,
           hair_longsheets (a few broad smooth sheets), hair_mohawk (a fin), hair_curly (a rounded mass)
  extras   eyes_heart, acc_ledneck (glows), acc_glowstick (glows, right hand), acc_flowers (crown), prop_sign,
           prop_clipboard (right hand), face_beardbig
  faces    body_headB / body_headC: two more head shapes per body (same topology, UVs and face weights)
Every new part gets _LOD1/_LOD2 siblings. Run in the open Blender: exec(open(path).read())."""
import bpy, bmesh, json, math, numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
W = '/Users/bradymott/brady-o/private/work/'
exec(open('/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/ck_util.py').read())
coll = bpy.data.collections['Kit']; M = 'mixamorig:'
def sel(objs, active=None):
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        if o: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def ss(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)
MG = bpy.data.materials['M_KCG_Generic']
def matcopy(name, kind, emit=0.0):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = MG.copy(); m.name = name; m['burns_kind'] = kind
    if emit:
        nt = m.node_tree; p = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        for l in list(p.inputs['Emission Color'].links): nt.links.remove(l)
        p.inputs['Emission Color'].default_value = (1, 1, 1, 1); p.inputs['Emission Strength'].default_value = emit   # a constant glow: no extra texture, tinted per character by vertex colour
    return m
MHO = matcopy('M_KCG_HairO', 'hair'); MGL = matcopy('M_KCG_Glow', 'generic', 3.0)
meta = json.load(open(W + 'proj/kc_atlas_meta.json')); (su0, sv0), (su1, sv1) = meta['swatch']
def uv_of_part(name):
    ob = bpy.data.objects[name]; uv = ob.data.uv_layers['UVMap'].data
    a = np.array([d.uv[:] for d in uv]); return Vector(np.median(a, 0).tolist())
WHITE = uv_of_part('F_top_tee')                 # a neutral near-white cloth texel (tinted per character)
def put(name, bm, mat, rig, weights, uvmode='white', uvfn=None):
    for o in [o for o in bpy.data.objects if o.name in (name, name + '_LOD1', name + '_LOD2')]: bpy.data.objects.remove(o)
    uvl = bm.loops.layers.uv.active or bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            if uvmode == 'white': l[uvl].uv = (WHITE.x, WHITE.y)
            elif uvmode == 'swatch':   # hair: the near-white cloth texel too (a flat colour; the tint can only darken it, so it starts light)
                l[uvl].uv = (WHITE.x, WHITE.y)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    me.uv_layers[0].name = 'UVMap'
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob); ob.parent = rig; ob['kit_part'] = name
    am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
    me.materials.append(mat)
    G = {}
    for v in me.vertices:
        for g, w in weights(v.co):
            if g not in G: G[g] = ob.vertex_groups.new(name=M + g)
            G[g].add([v.index], w, 'REPLACE')
    limit_normalize(ob)
    return ob
def solidify(ob, t, off=0.0):
    sel([ob]); md = ob.modifiers.new('Sol', 'SOLIDIFY'); md.thickness = t; md.offset = off; md.use_rim = True; md.use_even_offset = True
    bpy.ops.object.modifier_move_to_index(modifier='Sol', index=0); bpy.ops.object.modifier_apply(modifier='Sol')
def lods(ob, k1=0.4, k2=0.15):
    for L, k in ((1, k1), (2, k2)):
        n = ob.copy(); n.data = ob.data.copy(); n.name = '%s_LOD%d' % (ob.name, L); n.data.name = n.name; coll.objects.link(n); n.parent = ob.parent
        n['kit_part'] = ob.name
        t = tris(n); tgt = max(24, int(t * k))
        if t > tgt:
            sel([n]); md = n.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = tgt / t; md.use_collapse_triangulate = True
            bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
        limit_normalize(n)
        for md in n.modifiers:
            if md.type == 'ARMATURE': md.object = ob.parent
def head_only(co): return [('Head', 1.0)]
for S in ('F', 'M'):
    rig = bpy.data.objects['Arm%s' % S]; full = bpy.data.objects['Cast%s_Body' % S]
    LM = json.load(open(W + 'proj/cast%s_lm.json' % S.lower()))
    eL, eR = Vector(LM['eyeL']), Vector(LM['eyeR']); ez = eL.z; r_eye = LM['eyeRL']
    Bn = lambda n: rig.data.bones[M + n]
    neckz = Bn('Neck').head_local.z; hz0 = Bn('Head').head_local.z
    P = np.array([v.co[:] for v in full.data.vertices]); Ph = P[P[:, 2] > neckz + 0.03]
    top = float(Ph[:, 2].max()); HC = Vector((0.0, float((Ph[:, 1].max() + Ph[:, 1].min()) / 2), top - 0.105 * top / 1.75))
    hx, hy = float((Ph[:, 0].max() - Ph[:, 0].min()) / 2), float((Ph[:, 1].max() - Ph[:, 1].min()) / 2)
    armx = Bn('LeftArm').head_local.x
    verts = [v.co.copy() for v in full.data.vertices]
    bvh = BVHTree.FromPolygons(verts, [list(p.vertices) for p in full.data.polygons if all(abs(full.data.vertices[i].co.x) < armx - 0.01 or full.data.vertices[i].co.z > 1.3 for i in p.vertices)])
    def push(p, clr):
        loc, n, i, d = bvh.find_nearest(p)
        if loc is None: return p
        return loc + n * clr if (p - loc).dot(n) < clr else p
    # ---------------- hats: solid, and the sun hat's brim tamed ----------------
    for kind in ('cowboy', 'ranger', 'cap', 'sunhat', 'hardhat', 'tophat', 'fedora', 'beanie'):
        name = '%s_hat_%s' % (S, kind); ob = bpy.data.objects.get(name)
        if not ob: continue
        for o in [o for o in bpy.data.objects if o.name in (name + '_LOD1', name + '_LOD2')]: bpy.data.objects.remove(o)
        bm = bmesh.new(); bm.from_mesh(ob.data)
        c = Vector((HC.x, HC.y, 0))
        if kind in ('sunhat', 'cowboy', 'ranger', 'fedora'):
            rc = hy * 1.1; k = {'sunhat': 0.55, 'cowboy': 0.8, 'ranger': 0.85, 'fedora': 0.9}[kind]
            for v in bm.verts:
                d = Vector((v.co.x - c.x, v.co.y - c.y, 0)); r = d.length
                if r > rc:
                    r2 = rc + (r - rc) * k; v.co.x = c.x + d.x / r * r2; v.co.y = c.y + d.y / r * r2
                    v.co.z += (r2 - rc) * (0.22 if kind == 'sunhat' else 0.08)
        # the front edge sits at or above the brows (faces stay visible under every brim)
        fr = [v.co.z for v in bm.verts if abs(v.co.x) < 0.04 and v.co.y < HC.y - hy * 0.6]
        need = ez + (0.032 if kind not in ('beanie', 'cap') else 0.026)
        lift = max(0.0, need - min(fr)) if fr else 0.0
        for v in bm.verts: v.co.z += lift
        print('hat', S, kind, 'lift %.3f' % lift)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.to_mesh(ob.data); bm.free()
        solidify(ob, 0.004 if kind not in ('beanie', 'cap') else 0.003, 0.0)
        limit_normalize(ob); lods(ob, 0.5, 0.25)
    # ---------------- hair: clean solid shapes ----------------
    for o in [o for o in bpy.data.objects if o.name.startswith(S + '_hair_')]: bpy.data.objects.remove(o)
    def hairline(x, y, fore=0.064):
        ty = min(max((y - (HC.y - 0.07)) / 0.13, 0.0), 1.0)
        front = ez + fore - 0.03 * min(1.0, abs(x) / 0.065) ** 2
        z = front * (1 - ty) + (ez - 0.07) * ty
        if abs(x) > 0.056 and HC.y - 0.045 < y < HC.y + 0.065: z = max(z, ez + 0.016 + 0.02 * ss(HC.y + 0.03, HC.y + 0.065, y))
        return z
    # one smooth shell around the head, cast from the head centre: rows from the crown down to a designed hairline,
    # optionally continuing down as long or bob hair (no cut edges from the body mesh, no cards)
    hfaces = [list(p.vertices) for p in full.data.polygons if all(verts[i].z > neckz - 0.02 and abs(verts[i].x) < 0.11 for i in p.vertices)]
    hbvh = BVHTree.FromPolygons(verts, hfaces)
    def on_head(a, th):
        d = Vector((math.sin(th) * math.sin(a), math.sin(th) * math.cos(a), math.cos(th)))
        hit = hbvh.ray_cast(HC + d * 0.3, -d)
        return (hit[0] if hit[0] is not None else HC + d * 0.09), d
    def edge_z(a, kind):
        """the hairline height at azimuth a (0 = back, +-pi = front)"""
        f = abs(a) / math.pi                      # 0 back .. 1 front
        if kind == 'slick': f = f
        back, ear, temple, front = ez - 0.085, ez + 0.01, ez + 0.028, ez + 0.042
        if f < 0.45: return back + (ear - back) * ss(0.0, 0.45, f)
        if f < 0.7: return ear + (temple - ear) * ss(0.45, 0.7, f)
        return temple + (front - temple) * ss(0.7, 1.0, f)
    def theta_at(a, z):
        lo, hi = 0.0, 2.6
        for _ in range(22):
            m = (lo + hi) / 2
            if on_head(a, m)[0].z > z: lo = m
            else: hi = m
        return lo
    def shell(off, vol_top=0.0, vol_back=0.0, lump=0.0, na=40, nt=11, drop=0.0, arc=1.95, kind='cap'):
        """off: thickness over the scalp; drop > 0 continues the back/sides (|a| < arc) down by that many metres"""
        bm = bmesh.new(); rows = []
        A = [-math.pi + 2 * math.pi * k / na for k in range(na)]
        for i in range(1, nt + 1):
            t = i / nt; row = []
            for a in A:
                th = t * theta_at(a, edge_z(a, kind)); p, d = on_head(a, th)
                up = max(0.0, d.z); bk = max(0.0, d.y)
                L = 1 + (lump * math.sin(a * 7 + 0.5) * math.sin(th * 9) if lump else 0)
                o = (off + vol_top * up * up + vol_back * bk) * L
                o *= 1 - 0.7 * ss(0.8, 1.0, t)        # the hairline tucks in toward the skin
                row.append(p + d * o)
            rows.append(row)
        top_v = bm.verts.new(on_head(0, 0)[0] + Vector((0, 0, off + vol_top)))
        R = [[bm.verts.new(p) for p in row] for row in rows]
        for k in range(na): bm.faces.new((top_v, R[0][(k + 1) % na], R[0][k]))
        for i in range(nt - 1):
            for k in range(na): bm.faces.new((R[i][k], R[i][(k + 1) % na], R[i + 1][(k + 1) % na], R[i + 1][k]))
        if drop > 0:
            # the back and sides continue down: from a row high on the head, over the scalp, then hanging
            nd = 9; cols = [k for k in range(na) if abs(A[k]) < arc]
            first = int(nt * 0.45); D = []
            for i in range(first, nt + 9):
                row = []
                for k in cols:
                    a = A[k]
                    if i < nt:
                        t = (i + 1) / nt; th = t * theta_at(a, edge_z(a, kind)); p, d = on_head(a, th)
                        lift = ss(first, first + 2.5, i)                       # starts under the cap, comes out over it
                        p = p + d * (off + vol_top * max(0, d.z) ** 2 + vol_back * max(0, d.y) - 0.003 + (0.009 + 0.004 * lift) * lift)
                    else:
                        s = (i - nt + 1) / 9.0; base_p = D[-1][len(row)] if s <= 1 / 9.0 + 1e-6 else None
                        prev = D[nt - first - 1][len(row)]
                        hor = Vector((math.sin(a), math.cos(a), 0)).normalized()
                        ln = drop * (1 - 0.07 * abs(math.sin(a * 2.5)))         # a softly scalloped tip line
                        p = prev + hor * (0.012 * s + 0.02 * s * s) + Vector((0, 0.008 * s, -ln * s))
                        p = push(p, 0.014 + 0.016 * ss(0.0, 0.3, s))
                        if abs(a) > 1.6 and p.y < HC.y - 0.01 and abs(p.x) < 0.09 and p.z > ez - 0.16: p.x = math.copysign(0.09, a)
                    row.append(p)
                D.append(row)
            RD = [[bm.verts.new(p) for p in row] for row in D]
            for i in range(len(RD) - 1):
                for j in range(len(cols) - 1): bm.faces.new((RD[i][j], RD[i][j + 1], RD[i + 1][j + 1], RD[i + 1][j]))
            for it in range(4): bmesh.ops.smooth_vert(bm, verts=[v for row in RD[2:] for v in row], factor=0.35, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        return bm
    def cap_uv(co):
        d = co - HC; a = math.atan2(d.x, d.y); return ((a / math.pi + 1) * 0.5, 1 - min(1.0, max(0.0, (top - co.z) / 0.14)))
    hb = lambda co: [('Head', 1.0)]
    def strand_w(co, region):
        s_ = max(0.0, (ez + 0.0) - co.z)
        wh = 1 - ss(0.04, 0.16, s_); w2 = ss(0.2, 0.36, s_); w1 = (1 - wh) * (1 - w2)
        return [(n, w) for n, w in (('Head', wh), ('Hair%s1' % region, w1), ('Hair%s2' % region, (1 - wh) * w2)) if w > 1e-3] or [('Head', 1.0)]
    def hair_w(co):
        d = co - HC; a = math.atan2(d.x, d.y)
        return strand_w(co, 'B' if abs(a) < 1.2 else ('L' if a > 0 else 'R'))
    for name, kw in (('hair_buzz', dict(off=0.003)), ('hair_cap', dict(off=0.007, vol_top=0.012, vol_back=0.008)), ('hair_slick', dict(off=0.0045, vol_top=0.004, vol_back=0.004)),
                     ('hair_curly', dict(off=0.022, vol_top=0.03, vol_back=0.015, lump=0.25)),
                     ('hair_long', dict(off=0.007, vol_top=0.01, vol_back=0.008, drop=0.34)), ('hair_bob', dict(off=0.008, vol_top=0.012, vol_back=0.01, drop=0.13, arc=2.1))):
        bm = shell(**kw)
        ob = put('%s_%s' % (S, name), bm, MHO, rig, hair_w if kw.get('drop') else hb, 'swatch', cap_uv)
        if kw.get('drop'): solidify(ob, 0.005, 1.0); limit_normalize(ob)
        lods(ob, 0.45, 0.2)
    # bun / pony / mohawk add-ons
    pb, db = on_head(0.0, 0.95)                          # the bun: high on the back of the head, sunk into the hair
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=0.04)
    for v in bm.verts: v.co = Vector((v.co.x, v.co.y * 0.8, v.co.z * 0.85)) + pb + db * 0.03
    ob = put('%s_hair_bun' % S, bm, MHO, rig, hb, 'swatch', cap_uv); lods(ob, 0.5, 0.25)
    pp, dp = on_head(0.0, 1.35)                          # the ponytail: tied at the back of the head, hanging
    bm = bmesh.new(); rings = []
    for i in range(9):
        t = i / 8; c = pp + dp * (0.006 + 0.03 * ss(0.0, 0.3, t)) + Vector((0, 0.012 * t, -0.3 * t * t ** 0.3))
        c = push(c, 0.02) if t > 0.3 else c
        r = 0.02 if t < 0.12 else 0.026 * (1 - 0.65 * t) + 0.005
        rings.append([bm.verts.new(c + Vector((math.cos(a) * r, math.sin(a) * r * 0.75, 0))) for a in [2 * math.pi * k / 10 for k in range(10)]])
    for i in range(8):
        for k in range(10): bm.faces.new((rings[i][k], rings[i][(k + 1) % 10], rings[i + 1][(k + 1) % 10], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[-1]))); bm.faces.new(rings[0])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ob = put('%s_hair_pony' % S, bm, MHO, rig, lambda co: strand_w(co, 'B'), 'swatch', lambda co: (0.5, min(1, max(0, (co.z - (ez - 0.4)) / 0.5)))); lods(ob, 0.5, 0.25)
    # the mohawk: a rounded ridge from the forehead over the crown to the nape, following the head
    bm = bmesh.new(); rings = []; NR = 14
    for i in range(NR):
        u = i / (NR - 1)
        az, th = (math.pi, 0.6 * (1 - u / 0.3)) if u < 0.3 else (0.0, 1.35 * (u - 0.3) / 0.7)
        p, d = on_head(az, max(th, 1e-3)); side = Vector((1, 0, 0)); prof = math.sin(u * math.pi) ** 0.6
        hgt = 0.006 + 0.03 * prof; wid = 0.012 + 0.006 * prof
        rings.append([bm.verts.new(p + d * (0.004 + math.sin(f) * hgt) + side * math.cos(f) * wid) for f in [math.pi * k / 7 for k in range(8)]] + [bm.verts.new(p - d * 0.004)])
    for i in range(NR - 1):
        for k in range(9): bm.faces.new((rings[i][k], rings[i][(k + 1) % 9], rings[i + 1][(k + 1) % 9], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ob = put('%s_hair_mohawk' % S, bm, MHO, rig, hb, 'swatch'); lods(ob, 0.6, 0.3)
    # ---------------- accessories ----------------
    ey = eL.y - r_eye - 0.012
    def heart(bm, c, sz):
        pts = []
        for k in range(20):
            t = 2 * math.pi * k / 20; x = 16 * math.sin(t) ** 3; z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
            pts.append(c + Vector((x * sz, 0, z * sz)))
        o = [bm.verts.new(p) for p in pts]; b = [bm.verts.new(p + Vector((0, 0.003, 0))) for p in pts]
        bm.faces.new(o); bm.faces.new(list(reversed(b)))
        for j in range(20): bm.faces.new((o[j], o[(j + 1) % 20], b[(j + 1) % 20], b[j]))
    bm = bmesh.new()
    for e in (eL, eR): heart(bm, Vector((e.x * 1.08, ey, e.z + 0.002)), 0.0013)
    ob = put('%s_eyes_heart' % S, bm, MG, rig, head_only, 'white'); lods(ob, 0.7, 0.4)
    # round glasses with coloured lenses (lenses and rims one colour: a pink pair, a blue pair...)
    bm = bmesh.new()
    for e in (eL, eR):
        c = Vector((e.x * 1.08, ey, e.z + 0.002)); res = bmesh.ops.create_circle(bm, cap_ends=True, segments=16, radius=0.02)
        for v in res['verts']: v.co = Vector((v.co.x, 0, v.co.y)) + c
    res = bmesh.ops.create_cube(bm, size=1.0)   # the bridge
    for v in res['verts']: v.co = Vector((v.co.x * 0.03, v.co.y * 0.003, v.co.z * 0.003)) + Vector((0, ey, eL.z + 0.008))
    ob = put('%s_eyes_tinted' % S, bm, MG, rig, head_only, 'white'); solidify(ob, 0.002, 0.0); limit_normalize(ob); lods(ob, 0.8, 0.5)
    # LED necklace: beads around the neck base
    bm = bmesh.new()
    nb = Bn('Neck').head_local; rn = 0.068 if S == 'M' else 0.06
    for k in range(13):
        a = -1.75 + 3.5 * k / 12; p = Vector((math.sin(a) * rn, nb.y - math.cos(a) * rn * 0.9, nb.z - 0.03 - 0.035 * max(0.0, math.cos(a)) ** 2))
        p = push(p, 0.006)
        sph = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.0065)
        for v in sph['verts']: v.co += p
    ob = put('%s_acc_ledneck' % S, bm, MGL, rig, lambda co: [('Neck', 0.5), ('Spine2', 0.5)], 'white'); lods(ob, 0.6, 0.3)
    # flower crown
    bm = bmesh.new()
    for k in range(9):
        a = -1.9 + 3.8 * k / 8; c = HC + Vector((math.sin(a) * (hx + 0.012), -math.cos(a) * (hy + 0.012), 0.0)); c.z = hairline(c.x, c.y) + 0.02
        c = push(c, 0.012)
        for pk in range(5):
            b2 = 2 * math.pi * pk / 5; sph = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.009)
            for v in sph['verts']: v.co = Vector((v.co.x, v.co.y * 0.5, v.co.z)) + c + Vector((math.cos(b2) * 0.009, 0, math.sin(b2) * 0.009))
    ob = put('%s_acc_flowers' % S, bm, MG, rig, head_only, 'white'); lods(ob, 0.5, 0.25)
    # neck pieces: plain beads (kandi, gold chain), a fluffy boa (boa, lei)
    bm = bmesh.new()
    for k in range(15):
        a = -1.9 + 3.8 * k / 14; p = Vector((math.sin(a) * rn * 1.05, nb.y - math.cos(a) * rn * 0.95, nb.z - 0.035 - 0.05 * max(0.0, math.cos(a)) ** 2))
        p = push(p, 0.006); sph = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.0055)
        for v in sph['verts']: v.co += p
    ob = put('%s_acc_beads' % S, bm, MG, rig, lambda co: [('Neck', 0.4), ('Spine2', 0.6)], 'white'); lods(ob, 0.6, 0.3)
    bm = bmesh.new()
    for k in range(18):
        a = 2 * math.pi * k / 18; p = Vector((math.sin(a) * (rn + 0.045), nb.y - math.cos(a) * (rn + 0.035), nb.z - 0.05 - 0.04 * max(0.0, math.cos(a)) ** 2))
        p = push(p, 0.024); sph = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.028 + 0.005 * math.sin(k * 2.3))
        for v in sph['verts']: v.co += p
    ob = put('%s_acc_boa' % S, bm, MG, rig, lambda co: [('Neck', 0.3), ('Spine2', 0.7)], 'white'); lods(ob, 0.5, 0.25)
    # held props, right hand. T-pose: the arm along -x, palm down; anything long lies along x so it hangs upright
    # when the arm is down (the clips' idle/talk)
    hand = Bn('RightHand').head_local; P0 = hand + Vector((-0.07, -0.005, -0.02))
    def box(sx, sy, sz, c, bm=None):
        bm = bm or bmesh.new(); r = bmesh.ops.create_cube(bm, size=1.0)
        for v in r['verts']: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + c
        return bm
    def cyl(p0, p1, r, seg=10, bm=None, r1=None):
        bm = bm or bmesh.new(); d = p1 - p0
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r1 is None else r1, depth=d.length)
        R = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        for v in res['verts']: v.co = (R @ v.co) + (p0 + p1) / 2
        return bm
    X = Vector((1, 0, 0)); hand_w = lambda co: [('RightHand', 1.0)]
    ob = put('%s_acc_glowstick' % S, cyl(P0 - X * 0.09, P0 + X * 0.06, 0.009, 8), MGL, rig, hand_w, 'white'); lods(ob, 1.0, 0.6)
    ob = put('%s_prop_radio' % S, box(0.12, 0.035, 0.055, P0 + Vector((-0.01, 0, -0.01))), MG, rig, hand_w, 'white'); lods(ob, 1.0, 1.0)
    ob = put('%s_prop_phone' % S, box(0.14, 0.07, 0.01, P0 + Vector((-0.02, 0, -0.012))), MG, rig, hand_w, 'white'); lods(ob, 1.0, 1.0)
    ob = put('%s_prop_cup' % S, cyl(P0 - X * 0.05 + Vector((0, 0, -0.025)), P0 + X * 0.05 + Vector((0, 0, -0.025)), 0.038, 12, r1=0.043), MG, rig, hand_w, 'white'); lods(ob, 1.0, 0.6)
    bm = cyl(P0 - X * 0.12 + Vector((0, 0, -0.025)), P0 + X * 0.06 + Vector((0, 0, -0.025)), 0.034, 12)
    cyl(P0 + X * 0.06 + Vector((0, 0, -0.025)), P0 + X * 0.11 + Vector((0, 0, -0.025)), 0.014, 8, bm)
    ob = put('%s_prop_bottle' % S, bm, MG, rig, hand_w, 'white'); lods(ob, 1.0, 0.6)
    ob = put('%s_prop_clipboard' % S, box(0.3, 0.23, 0.012, P0 + Vector((-0.06, 0, -0.03))), MG, rig, hand_w, 'white'); lods(ob, 1.0, 1.0)
    top_ = P0 + Vector((0.82, -0.07, 0.05))
    bm = cyl(P0 - X * 0.05, top_, 0.011, 6)
    box(0.26, 0.014, 0.4, top_ + Vector((0.1, -0.01, 0.06)), bm)
    ob = put('%s_prop_sign' % S, bm, MG, rig, hand_w, 'white'); lods(ob, 1.0, 1.0)
    # the big beard (Gus): the beard pushed out and down over the jaw
    if S == 'M' and 'M_face_beard' in bpy.data.objects:
        src = bpy.data.objects['M_face_beard']; ob = src.copy(); ob.data = src.data.copy(); ob.name = 'M_face_beardbig'; ob.data.name = 'M_face_beardbig'; coll.objects.link(ob); ob['kit_part'] = 'M_face_beardbig'
        for o in [o for o in bpy.data.objects if o.name in ('M_face_beardbig_LOD1', 'M_face_beardbig_LOD2')]: bpy.data.objects.remove(o)
        seam = LM['seam']
        for v in ob.data.vertices:
            k = ss(seam + 0.01, seam - 0.05, v.co.z)
            v.co += v.normal * 0.016 * k + Vector((0, -0.006 * k, -0.025 * k * ss(0.02, 0.0, abs(v.co.x))))
        lods(ob, 0.4, 0.15)
    # ---------------- two more head shapes (same topology, UVs and weights) ----------------
    src = bpy.data.objects['%s_body_head' % S]
    for tag, sh in (('B', dict(jaw=0.13, cheek=0.0045, nose=0.35, brow=0.004, chin=0.006, wide=0.045, long=-0.004)), ('C', dict(jaw=-0.1, cheek=-0.003, nose=-0.18, brow=-0.002, chin=-0.004, wide=-0.04, long=0.008))):
        name = '%s_body_head%s' % (S, tag)
        for o in [o for o in bpy.data.objects if o.name in (name, name + '_LOD1', name + '_LOD2')]: bpy.data.objects.remove(o)
        ob = src.copy(); ob.data = src.data.copy(); ob.name = name; ob.data.name = name; coll.objects.link(ob); ob['kit_part'] = name
        from mathutils.kdtree import KDTree
        bmh = bmesh.new(); bmh.from_mesh(ob.data); allb = [v.co.copy() for v in bmh.verts if v.is_boundary]; bmh.free()
        def mk(pts):
            k_ = KDTree(max(1, len(pts)))
            for i_, c_ in enumerate(pts): k_.insert(c_, i_)
            k_.balance(); return k_ if pts else None
        lipc = Vector((0.0, LM['lipFront'][1], LM['seam']))
        inner = lambda c: (c - eL).length < 0.026 or (c - eR).length < 0.026 or (c - lipc).length < 0.032   # eye and mouth openings
        kdn = mk([c for c in allb if not inner(c)]); kdo = mk([c for c in allb if inner(c)])   # every other open edge is a seam with the neck
        bnd = allb
        for v in ob.data.vertices:
            o0 = v.co.copy(); keep = min(ss(0.0, 0.022, kdn.find(o0)[2]) if kdn else 1.0, ss(0.0, 0.007, kdo.find(o0)[2]) if kdo else 1.0)
            x, y, z = v.co; front = ss(0.02, -0.04, y)
            band = ss(ez - 0.01, ez - 0.045, z) * (1 - ss(ez - 0.105, ez - 0.135, z))
            face = front * ss(ez - 0.005, ez - 0.035, z) * ss(neckz - 0.01, neckz + 0.03, z)
            v.co.x = x * (1 + sh['jaw'] * band * front * ss(0.012, 0.035, abs(x)) + sh['wide'] * face)
            v.co.z -= sh['long'] * front * ss(ez - 0.06, ez - 0.12, z) * ss(neckz - 0.02, neckz + 0.02, z)
            g = lambda c, s: math.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) / (2 * s * s))
            ch = sum(g((sd * 0.05, eL.y - 0.004, ez - 0.05), 0.024) for sd in (1, -1)) * ss(ez - 0.012, ez - 0.03, z)
            v.co += v.normal * sh['cheek'] * ch
            nose = g((0.0, LM['lipFront'][1] - 0.018, (ez + LM['lipTop']) / 2 - 0.004), 0.011); v.co.x += x * sh['nose'] * nose
            brow = sum(g((sd * 0.03, eL.y - 0.012, ez + 0.016), 0.012) for sd in (1, -1)); v.co += v.normal * sh['brow'] * brow
            chin = g((0.0, LM['lipFront'][1] + 0.01, LM['seam'] - 0.045), 0.015); v.co.y -= sh['chin'] * chin
            v.co = o0.lerp(v.co, keep)
        ob.data.update(); lods(ob, 0.38, 0.14)

# ---------------- pattern masks on the tops, brow/lip colour on the extra heads (colour attribute 'BurnsMask') ----------
# tops: R stripes, G tie-dye swirl, B two-tone (sleeves + yoke); the game blends a second colour in by one channel
# (BurnsCast recipe 'pattern'). Heads B/C: RGB multiplies (darker brows, rosier or deeper lips). Alpha stays 1.
def set_mask(ob, fn):
    me = ob.data
    if 'BurnsMask' in me.color_attributes: me.color_attributes.remove(me.color_attributes['BurnsMask'])
    ca = me.color_attributes.new('BurnsMask', 'BYTE_COLOR', 'POINT')
    for v in me.vertices: ca.data[v.index].color = fn(v.co) + (1.0,)
for S in ('F', 'M'):
    rig = bpy.data.objects['Arm%s' % S]; Bn = lambda n: rig.data.bones[M + n]
    shx = abs(Bn('RightArm').head_local.x) - 0.015; yoke = Bn('Spine2').head_local.z + 0.11; cz = Bn('Spine1').head_local.z
    def top_mask(co):
        x, y, z = co
        st = ss(-0.3, 0.3, math.sin(2 * math.pi * z / 0.1))
        a = math.atan2(z - cz, x); r = math.hypot(x, z - cz)
        td = ss(0.25, 0.75, 0.5 + 0.5 * math.sin(4 * a + r * 38 + (0 if y < 0 else 1.3)))
        tt = max(ss(shx - 0.01, shx + 0.02, abs(x)), ss(yoke - 0.01, yoke + 0.02, z))
        return (st, td, tt)
    for kind in ('tee', 'long', 'tank', 'crop'):
        for suf in ('', '_LOD1', '_LOD2'):
            ob = bpy.data.objects.get('%s_top_%s%s' % (S, kind, suf))
            if ob: set_mask(ob, top_mask)
    LM = json.load(open(W + 'proj/cast%s_lm.json' % S.lower())); eL = Vector(LM['eyeL']); ez = eL.z
    def g3(co, c, s): return math.exp(-((co[0] - c[0]) ** 2 + (co[1] - c[1]) ** 2 + (co[2] - c[2]) ** 2) / (2 * s * s))
    for tag, brow, lip in (('B', 0.62, (1.0, 0.78, 0.8)), ('C', 0.8, (0.82, 0.68, 0.68))):
        def head_mask(co, brow=brow, lip=lip):
            b = sum(g3(co, (sd * 0.032, eL.y - 0.01, ez + 0.019), 0.011) for sd in (1, -1)) * (1 if co[1] < eL.y else 0)
            l = math.exp(-(co[0] ** 2 / (2 * 0.021 ** 2) + ((co[1] - LM['lipFront'][1]) ** 2 + (co[2] - LM['seam']) ** 2) / (2 * 0.009 ** 2)))
            k = 1 - (1 - brow) * min(1.0, b)
            return tuple(k * (1 - (1 - lc) * min(1.0, l)) for lc in lip)
        for suf in ('', '_LOD1', '_LOD2'):
            ob = bpy.data.objects.get('%s_body_head%s%s' % (S, tag, suf))
            if ob: set_mask(ob, head_mask)
print('kit extras ok', len([o for o in coll.objects if o.type == 'MESH']))
