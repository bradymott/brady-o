# Burning Man prop kit: a thin layer over cartkit for the static hero props (tools/blender/bm_<prop>.py).
# Same authoring space as the cars (engine coords through E(): x = left, y = up, z = forward, metres, origin on the
# ground at the prop's centre) and the same materials; the difference is the output: ONE detail level, a single
# static bone (`body`, plus any extra root bones a prop wants emitted separately, such as a shade's `pole`), written
# to assets/models/burning-man/<stem>.glb. The game merges these into its static chunks through BurnsGLTF.emit
# (src/41_burns_glbprops.js); the procedural prop in src/40_burns_e_props.js stays as the fallback, so each model
# keeps that prop's size and origin.
#
# Run one headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_rv.py
import os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cartkit as K
from cartkit import *

OUT_BM = os.path.join(ROOT, 'assets', 'models', 'burning-man')
os.makedirs(OUT_BM, exist_ok=True)
# the prop detail table: between the cars' showroom and race levels (a prop is 3–10k triangles)
PROP_LEVEL = dict(bevel=2, cyl=16, cyl_s=10, torus=14, tube=6, ico=1, prof=32, prof_bev=3, bulbs=1.0, arch=12, rod=6, sph=14, ring=8, surf=16)

def bm_rod_open(p0, p1, r, seg, r1=None):
    """A strut from p0 to p1 without end caps (hubs or joints cover the ends): 2·seg triangles instead of 4·seg."""
    a, b = E(*p0), E(*p1); d = b - a; L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=seg, radius1=r, radius2=r if r1 is None else r1, depth=L)
    q = d.normalized().to_track_quat('Z', 'Y')
    xf(bm, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    return bm

def bm_tri_sheet(tris, inset=0.0, centre=None):
    """Flat facets from a list of engine-space triangles [(a, b, c), …], optionally shrunk toward each one's centroid
    (inset 0..1, for panels sitting between struts). One-sided; build it twice with flip for a two-sided sheet."""
    bm = bmesh.new()
    for a, b, c in tris:
        g = tuple((a[i] + b[i] + c[i]) / 3 for i in range(3))
        pts = [tuple(p[i] + (g[i] - p[i]) * inset for i in range(3)) for p in (a, b, c)]
        vs = [bm.verts.new(E(*p)) for p in pts]
        bm.faces.new(vs)
    bm.normal_update()
    if centre is not None:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def flip(bm):
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm

def scale_bm(bm, sx, sy, sz, at=(0, 0, 0)):
    """Scale a built bmesh in engine axes about engine point `at` (squashed roof caps, flattened dots)."""
    c = E(*at)
    xf(bm, Matrix.Translation(c) @ Matrix.Diagonal((sx, sz, sy, 1)) @ Matrix.Translation(-c))
    return bm

def geodesic(freq, r):
    """The engine's dome lattice (BurnsMesh.dome): icosahedron subdivided `freq` times, upper-half faces only, base
    vertices clamped to the ground. Returns (verts: [engine (x, y, z)], faces: [(i, j, k)], edges: [(i, j)])."""
    t = (1 + math.sqrt(5)) / 2
    V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
    V = [[c / math.hypot(*v) for c in v] for v in V]
    F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
    for _ in range(max(0, min(3, freq))):
        NF, cache = [], {}
        def mid(a, b):
            k = (a, b) if a < b else (b, a)
            if k in cache: return cache[k]
            p, q = V[a], V[b]; m = [(p[i] + q[i]) / 2 for i in range(3)]; l = math.hypot(*m); V.append([c / l for c in m])
            cache[k] = len(V) - 1; return cache[k]
        for f in F:
            a, b, c = mid(f[0], f[1]), mid(f[1], f[2]), mid(f[2], f[0])
            NF += [[f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]]
        F = NF
    faces, edges, seen = [], [], set()
    for f in F:
        if (V[f[0]][1] + V[f[1]][1] + V[f[2]][1]) / 3 < -0.02: continue
        faces.append(tuple(f))
        for i, j in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
            k = (i, j) if i < j else (j, i)
            if k not in seen: seen.add(k); edges.append(k)
    P = [(v[0] * r, max(0.0, v[1]) * r, v[2] * r) for v in V]
    return P, faces, edges

def catenary(p0, p1, sag, n):
    """n+1 engine points along a drooping line from p0 to p1 (a string of lights, a guy line, a slack cable)."""
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(tuple(p0[k] + (p1[k] - p0[k]) * t - (sag * math.sin(math.pi * t) if k == 1 else 0) for k in range(3)))
    return out

def run_static(stem, build_fn, preview=True, views=None, save=True, level=None, max_tris=12000):
    """Build and export one static prop: build_fn(B) adds pieces to the Build B (parent = the `body` root bone, or
    another root made with B.bone(name, at) when the game emits it separately). Writes
    assets/models/burning-man/<stem>.glb, assets/blender/<stem>.blend and shots/blender/<stem>_<view>.png."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    clear(stem)
    L = dict(PROP_LEVEL); L.update(level or {})
    B = Build(stem, 'hi', {'hi': L}); build_fn(B); B.smooth_by_angle()
    t, v, per = B.tris()
    path = os.path.join(OUT_BM, stem + '.glb'); size = B.export(path)
    lo, hi = B.bounds()
    # Blender bounds (x, y, z) -> engine (x, y=z, z=-y)
    bounds = dict(x=[round(lo.x, 3), round(hi.x, 3)], y=[round(lo.z, 3), round(hi.z, 3)], z=[round(-hi.y, 3), round(-lo.y, 3)])
    report = dict(tris=t, verts=v, bytes=size, path=path, bounds=bounds, per=per)
    if v > 65535: report['error'] = 'too many vertices for the engine (max 65535)'
    elif t > max_tris: report['warning'] = 'over the %d-triangle prop budget' % max_tris
    if preview:
        vws = views or [((0.8, -1, 0.45), 'front'), ((-0.9, 0.8, 0.4), 'rear')]
        report['previews'] = [B.preview(os.path.join(SHOTS, '%s_%s.png' % (stem, tag)), view=vw) for vw, tag in vws]
    if save: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND_DIR, stem + '.blend'), compress=True)
    print('BMKIT_REPORT ' + json.dumps({k: v for k, v in report.items() if k != 'per'}))
    print('  per root: %s' % dict(sorted(per.items(), key=lambda kv: -kv[1])))
    return report

# ---------------- the props quality pass (Nov 24): two detail levels, baked vertex colour, private scenes ----------------
# Most props are seen hundreds of times through the engine's instancer (near / mid / far levels), so every rebuilt prop
# now ships `<stem>.glb` (near) AND `<stem>_lo.glb` (mid, swapped in by src/41_burns_glbprops.js when m.lo is set).
# Lighting detail is baked into each vertex's COLOR_0 (the game multiplies it into the material colour, free at run time):
# short-range ambient occlusion from real ray casts against the whole prop (seams, folds, under trims, between parts)
# times a per-prop `shade_fn` (dust on lower edges, sun-bleached tops, grime streaks). Glowing parts stay pure white.
# The engine still bakes its own coarse AO and ground contact on placement, so this bake stays short-range and gentle.
from mathutils.bvhtree import BVHTree
PROP_LO = dict(bevel=1, cyl=10, cyl_s=6, torus=8, tube=4, ico=1, prof=14, prof_bev=1, bulbs=0.5, arch=8, rod=4, sph=8, ring=5, surf=8)
PRIVATE_WORK = os.environ.get('BRADY_PRIVATE_WORK') or os.path.join(ROOT, 'private', 'work')

def _hemi(n):
    """n cosine-weighted directions about +Z (a fixed golden-angle set, so bakes are deterministic)."""
    out = []
    for i in range(n):
        u = (i + 0.5) / n; r = math.sqrt(u); a = i * 2.399963
        out.append(Vector((r * math.cos(a), r * math.sin(a), math.sqrt(max(0.0, 1 - u)))))
    return out

def apply_all(B):
    """Apply every modifier (bevels, booleans) so the bake and the export see the final triangles."""
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in [o for o in B.objs if o.type == 'MESH']:
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        old = ob.data; ob.modifiers.clear(); ob.data = me
        if old.users == 0: bpy.data.meshes.remove(old)

def bake_vcol(B, ao_dist=0.5, ao_k=0.6, rays=16, shade_fn=None, floor=0.42):
    """Bake COLOR_0 on every piece of B: ao * shade_fn. ao = 1 - ao_k * (occlusion within ao_dist metres), floored.
    shade_fn(x, y, z, nx, ny, nz, mat_name) -> (r, g, b) multipliers in engine space (y up), default white.
    Pieces whose material glows (emission) get 1.0 so LEDs keep their full colour."""
    apply_all(B)
    meshes = [o for o in B.objs if o.type == 'MESH']
    V, P = [], []
    for ob in meshes:
        mw = ob.matrix_world; base = len(V)
        V.extend(mw @ v.co for v in ob.data.vertices)
        P.extend([base + i for i in p.vertices] for p in ob.data.polygons)
    bvh = BVHTree.FromPolygons(V, P, epsilon=0.0)
    H = _hemi(rays)
    def glows(m):
        if m is None or not m.use_nodes: return False
        n = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        return bool(n) and n.inputs['Emission Strength'].default_value > 0.05
    for ob in meshes:
        me = ob.data; mw = ob.matrix_world; nmat = mw.to_3x3().inverted().transposed()
        vmat = [None] * len(me.vertices)
        for p in me.polygons:
            for i in p.vertices:
                if vmat[i] is None: vmat[i] = p.material_index
        mats = [s.material for s in ob.material_slots]
        try: attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        except Exception as e: print('bake_vcol: no colour attribute on', ob.name, e); continue
        for i, v in enumerate(me.vertices):
            mi = vmat[i]; m = mats[mi] if mi is not None and mi < len(mats) else (mats[0] if mats else None)
            if glows(m): attr.data[i].color = (1, 1, 1, 1); continue
            p = mw @ v.co; n = (nmat @ v.normal).normalized()
            t = n.orthogonal().normalized(); b = n.cross(t)
            occ = 0.0
            o = p + n * 0.012
            for h in H:
                d = t * h.x + b * h.y + n * h.z
                hit = bvh.ray_cast(o, d, ao_dist)
                if hit[0] is not None: occ += 1.0 - (hit[3] / ao_dist) * 0.5
            ao = max(floor, 1.0 - ao_k * occ / len(H))
            r, g, bb = shade_fn(p.x, p.z, -p.y, n.x, n.z, -n.y, (m.name[3:] if m and m.name.startswith('bv_') else (m.name if m else ''))) if shade_fn else (1, 1, 1)
            attr.data[i].color = (min(1, ao * r), min(1, ao * g), min(1, ao * bb), 1.0)
        try: me.color_attributes.active_color = attr
        except Exception: pass
        try: me.color_attributes.render_color_index = me.color_attributes.find('Col')
        except Exception: pass
    B.export_try = [dict(export_vertex_color='ACTIVE'), dict(export_colors=True)]

def dusty(lo=0.55, hi=0.0, col=(0.93, 0.86, 0.74), top=None):
    """A shade_fn: playa dust that settles on the lowest `lo` metres (tinting toward `col`, strongest at the ground) and,
    with top=(r, g, b), a sun-bleach on up-facing surfaces."""
    def fn(x, y, z, nx, ny, nz, mname):
        k = max(0.0, 1.0 - y / lo) ** 1.6 if lo > 0 else 0.0
        r, g, b = (1 - k + k * col[0], 1 - k + k * col[1], 1 - k + k * col[2])
        if top and ny > 0.5:
            s = (ny - 0.5) * 2
            r, g, b = r * (1 - s + s * top[0]), g * (1 - s + s * top[1]), b * (1 - s + s * top[2])
        return r, g, b
    return fn

def slim(B, keep=(), small=0.03):
    """Cheaper bevels: at lo, only the pieces named in `keep` keep their bevel; at hi, the other pieces' bevels of `small`
    metres or less get one segment (a trim, a lamp, a window only needs to catch one highlight)."""
    obj0 = B.obj
    def obj(name, bm, m, **kw):
        if B.lo and name not in keep: kw.pop('bevel', None)
        elif not B.lo and name not in keep and kw.get('bevel') and kw['bevel'] <= small: kw['segments'] = 1
        return obj0(name, bm, m, **kw)
    B.obj = obj

def run_prop(stem, build_fn, levels=('hi', 'lo'), bake=None, level_overrides=None, views=(('front', 'front'),), max_tris=None, save=True):
    """Build, bake and export a prop at two detail levels: assets/models/burning-man/<stem>.glb (hi, near) and
    <stem>_lo.glb (lo, mid distance). build_fn(B) uses B.lo / B.pick(hi, lo) / B.L[...] for detail.
    bake: kwargs for bake_vcol (None = no vertex-colour bake). max_tris: {'hi': n, 'lo': n} budget warnings.
    The scene is saved to private/work/<stem>.blend (git-ignored), previews to shots/blender/<stem>_<level>_<view>.png."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    # a clean scene: another prop's objects would steal this one's root names (`body` -> `body.001`), and the game
    # emits roots by name
    for c in list(bpy.data.collections):
        for o in list(c.objects): bpy.data.objects.remove(o)
        bpy.data.collections.remove(c)
    clear(stem)
    lv_tables = {'hi': dict(PROP_LEVEL), 'lo': dict(PROP_LO)}
    for k, v in (level_overrides or {}).items(): lv_tables[k].update(v)
    rep = {}
    for lv in [l for l in ('lo', 'hi') if l in levels]:
        B = Build(stem, lv, lv_tables); build_fn(B); B.smooth_by_angle()
        if bake is not None: bake_vcol(B, **bake)
        t, v, per = B.tris()
        path = os.path.join(OUT_BM, stem + ('' if lv == 'hi' else '_lo') + '.glb'); size = B.export(path)
        lo_b, hi_b = B.bounds()
        rep[lv] = dict(tris=t, verts=v, bytes=size, bounds=dict(x=[round(lo_b.x, 2), round(hi_b.x, 2)], y=[round(lo_b.z, 2), round(hi_b.z, 2)], z=[round(-hi_b.y, 2), round(-lo_b.y, 2)]))
        if v > 65535: rep[lv]['error'] = 'too many vertices'
        if max_tris and t > max_tris.get(lv, 1e9): rep[lv]['warning'] = 'over budget %d' % max_tris[lv]
        for c in bpy.context.scene.collection.children: c.hide_render = c is not B.col
        rep[lv]['previews'] = [B.preview(os.path.join(SHOTS, '%s_%s_%s.png' % (stem, lv, tag)), view=VIEWS[vw] if isinstance(vw, str) else vw) for vw, tag in views]
        if lv == 'lo':
            for o in B.objs + B.cutters: o.name = o.name + '__lo'
    for col in bpy.context.scene.collection.children:
        lc = bpy.context.view_layer.layer_collection.children.get(col.name)
        if lc: lc.hide_viewport = col.name.endswith('_LO')
    if save:
        os.makedirs(PRIVATE_WORK, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PRIVATE_WORK, stem + '.blend'), compress=True)
    names = sorted(o.name for o in bpy.data.objects if o.parent is None and o.type == 'EMPTY' and not o.name.endswith('__lo'))
    rep['roots'] = names
    print('BMKIT_REPORT ' + json.dumps(rep))
    return rep
