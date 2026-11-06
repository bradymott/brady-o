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

def surface_finish(B):
    """Baked, deterministic wear with no runtime textures or additional geometry.
    Retains neutral multipliers so the engine can recolour every camp and vehicle.
    Glass gets a restrained sky/ground gradient; lamps and polished trim stay clean.
    """
    for ob in B.objs:
        if ob.type != 'MESH' or not ob.data.vertices: continue
        me = ob.data
        attr = me.color_attributes.get('SurfaceFinish') or me.color_attributes.new(name='SurfaceFinish', type='FLOAT_COLOR', domain='POINT')
        me.color_attributes.active_color = attr
        zs = [v.co.z for v in me.vertices]; lo, hi = min(zs), max(zs)
        for v in me.vertices:
            x, z, y = v.co.x, -v.co.y, v.co.z
            mat0 = me.materials[0] if me.materials else None
            name = mat0.name.lower() if mat0 else ''
            node = next((n for n in mat0.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat0 and mat0.use_nodes else None
            rough = node.inputs['Roughness'].default_value if node else 1
            emit = node.inputs['Emission Strength'].default_value if node else 0
            if 'glass' in name:
                f = (y - lo) / max(hi - lo, .001)
                attr.data[v.index].color = (.68 + .30*f, .73 + .25*f, .80 + .20*f, 1)
            elif emit > .05 or rough < .23:
                attr.data[v.index].color = (1, 1, 1, 1)
            else:
                drift = .5 + .5 * math.sin(x * 3.1 + math.sin(z * 2.7)) * math.sin(y * 2.9 + z)
                foot = max(0, 1 - max(0, y) / 1.15)
                value = .94 + .06 * drift - .09 * foot
                attr.data[v.index].color = (value, value * (1 - .018*foot), value * (1 - .05*foot), 1)

def run_static(stem, build_fn, preview=True, views=None, save=True, level=None, max_tris=12000):
    """Build and export one static prop: build_fn(B) adds pieces to the Build B (parent = the `body` root bone, or
    another root made with B.bone(name, at) when the game emits it separately). Writes
    assets/models/burning-man/<stem>.glb, assets/blender/<stem>.blend and shots/blender/<stem>_<view>.png."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    clear(stem)
    L = dict(PROP_LEVEL); L.update(level or {})
    B = Build(stem, 'hi', {'hi': L}); build_fn(B); surface_finish(B); B.smooth_by_angle()
    t, v, per = B.tris()
    path = os.path.join(OUT_BM, stem + '.glb'); size = B.export(path, vertex_color='ACTIVE')
    lo, hi = B.bounds()
    # Blender bounds (x, y, z) -> engine (x, y=z, z=-y)
    bounds = dict(x=[round(lo.x, 3), round(hi.x, 3)], y=[round(lo.z, 3), round(hi.z, 3)], z=[round(-hi.y, 3), round(-lo.y, 3)])
    report = dict(tris=t, verts=v, bytes=size, path=path, bounds=bounds, per=per)
    if v > 65535: report['error'] = 'too many vertices for the engine (max 65535)'
    elif t > max_tris: report['warning'] = 'over the %d-triangle prop budget' % max_tris
    if preview and os.environ.get('BM_PREVIEWS', '1') != '0':
        vws = views or [((0.8, -1, 0.45), 'front'), ((-0.9, 0.8, 0.4), 'rear')]
        report['previews'] = [B.preview(os.path.join(SHOTS, '%s_%s.png' % (stem, tag)), view=vw) for vw, tag in vws]
    if save: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND_DIR, stem + '.blend'), compress=True)
    print('BMKIT_REPORT ' + json.dumps({k: v for k, v in report.items() if k != 'per'}))
    print('  per root: %s' % dict(sorted(per.items(), key=lambda kv: -kv[1])))
    return report
