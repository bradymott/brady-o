# PREVIEW ONLY: build a car script against the bpy/bmesh stubs and write an approximate .glb (no bevels; boolean cuts
# approximated by deleting finely subdivided faces inside the cutter cylinders), so the design can be looked at in the
# game without Blender. The shipped .glb must come from Blender.
#   python3 preview_glb.py <script.py> <out_dir>
import sys, os, runpy, json, struct, math, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
script, out_dir = sys.argv[1], sys.argv[2]
sys.path.insert(0, os.path.dirname(script))
os.environ.setdefault('BRADY_ROOT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dryroot'))
g = runpy.run_path(script, run_name='dry')
ck = sys.modules['cartkit']
from mathutils import Vector
import bmesh

def lin(c): return c
def mat_json(m):
    n = m.node_tree.nodes[0].inputs
    col = list(n['Base Color'].default_value or (0.8, 0.8, 0.8, 1))[:3]
    rough = float(n['Roughness'].default_value or 0); metal = float(n['Metallic'].default_value or 0); coat = float(n['Coat Weight'].default_value or 0)
    em = list(n['Emission Color'].default_value or (0, 0, 0, 1))[:3]; es = float(n['Emission Strength'].default_value or 0)
    J = {'name': m.name, 'pbrMetallicRoughness': {'baseColorFactor': col + [1], 'metallicFactor': metal, 'roughnessFactor': rough}}
    ext = {}
    if coat: ext['KHR_materials_clearcoat'] = {'clearcoatFactor': coat, 'clearcoatRoughnessFactor': 0.03}
    if es > 0 and any(em): J['emissiveFactor'] = em; ext['KHR_materials_emissive_strength'] = {'emissiveStrength': es}
    if ext: J['extensions'] = ext
    ex = {k: v for k, v in m.items()}
    if ex: J['extras'] = ex
    return J

def subdivide(bm, cell, near):
    """split faces near a cutter into small pieces (preview of boolean cuts); others are copied as they are."""
    out = bmesh.new(); mp = {}
    for f in bm.faces:
        P = [v.co for v in f.verts]
        if not near(P):
            vs = []
            for v in f.verts:
                if id(v) not in mp: mp[id(v)] = out.verts.new(v.co)
                vs.append(mp[id(v)])
            try: out.faces.new(vs).material_index = f.material_index
            except ValueError: pass
            continue
        if len(P) == 4:
            nu = max(1, int(math.ceil(max((P[1] - P[0]).length, (P[2] - P[3]).length) / cell))); nv = max(1, int(math.ceil(max((P[3] - P[0]).length, (P[2] - P[1]).length) / cell)))
            G = [[out.verts.new((P[0] * (1 - u) + P[1] * u) * (1 - v) + (P[3] * (1 - u) + P[2] * u) * v) for u in (i / nu for i in range(nu + 1))] for v in (j / nv for j in range(nv + 1))]
            for j in range(nv):
                for i in range(nu): out.faces.new([G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]]).material_index = f.material_index
            continue
        tris = [(P[0], P[i], P[i + 1]) for i in range(1, len(P) - 1)]
        for a, b, c in tris:
            L = max((b - a).length, (c - b).length, (a - c).length); n = max(1, int(math.ceil(L / cell)))
            grid = {}
            for i in range(n + 1):
                for j in range(n + 1 - i):
                    u, v = i / n, j / n; grid[(i, j)] = out.verts.new(a + (b - a) * u + (c - a) * v)
            for i in range(n):
                for j in range(n - i):
                    nf = out.faces.new([grid[(i, j)], grid[(i + 1, j)], grid[(i, j + 1)]]); nf.material_index = f.material_index
                    if i + j < n - 1: nf = out.faces.new([grid[(i + 1, j)], grid[(i + 1, j + 1)], grid[(i, j + 1)]]); nf.material_index = f.material_index
    return out

def write(B, path):
    objs = [o for o in B.objs]
    cut_cyl = []
    for c in B.cutters:   # cylinders along X: centre and radius from the cutter's verts
        vs = [v.co for v in c.data._bm.verts]; cx = sum(v.x for v in vs) / len(vs); cy = sum(v.y for v in vs) / len(vs); cz = sum(v.z for v in vs) / len(vs)
        r = max(math.hypot(v.y - cy, v.z - cz) for v in vs); cut_cyl.append((cy, cz, r, min(v.x for v in vs), max(v.x for v in vs)))
    nodes, meshes, mats, matidx = [], [], [], {}
    bin_ = bytearray(); views = []; accs = []
    def add(data, fmt, count, typ, ctype, target, minmax=None):
        while len(bin_) % 4: bin_.append(0)
        off = len(bin_); bin_.extend(data); views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data), 'target': target})
        a = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': count, 'type': typ}
        if minmax: a['min'], a['max'] = minmax
        accs.append(a); return len(accs) - 1
    roots = [o for o in objs if o.parent is None]
    kids = {}
    for o in objs:
        if o.parent is not None: kids.setdefault(id(o.parent), []).append(o)
    def node_for(o, is_root):
        N = {'name': o.name}
        if is_root and o.location is not None: l = o.location; N['translation'] = [l.x, l.z, -l.y]
        props = {k: v for k, v in o.items()}
        if props: N['extras'] = props
        if o.type == 'MESH': mesh_for(o, N)
        ch = [node_for(k, False) for k in kids.get(id(o), [])]
        nodes.append(N); idx = len(nodes) - 1
        if ch: N['children'] = ch
        return idx
    def mesh_for(o, N):
        bm = o.data._bm
        if any(m['type'] == 'BOOLEAN' for m in o.modifiers) and cut_cyl:
            bm = subdivide(bm, 0.06, lambda P: any(min(p.x for p in P) <= x1 and max(p.x for p in P) >= x0 and min(p.y for p in P) <= cy + r and max(p.y for p in P) >= cy - r and min(p.z for p in P) <= cz + r and max(p.z for p in P) >= cz - r for cy, cz, r, x0, x1 in cut_cyl)); keep = []
            for f in bm.faces:
                c = f.calc_center_median()
                if any(x0 <= c.x <= x1 and math.hypot(c.y - cy, c.z - cz) < r for cy, cz, r, x0, x1 in cut_cyl): continue
                keep.append(f)
            bm.faces[:] = keep
        fn = []
        for f in bm.faces:
            P = [v.co for v in f.verts]; n = Vector((0, 0, 0))
            for i in range(1, len(P) - 1): n += (P[i] - P[0]).cross(P[i + 1] - P[0])
            fn.append(n.normalized() if n.length > 1e-12 else Vector((0, 0, 1)))
        # winding: make each connected piece consistent (shared edges run opposite ways), then outward by signed volume
        F = list(bm.faces); E = {}
        for i, f in enumerate(F):
            vs = f.verts
            for k in range(len(vs)):
                a, b = id(vs[k]), id(vs[(k + 1) % len(vs)]); E.setdefault(frozenset((a, b)), []).append((i, a, b))
        flip = [None] * len(F)
        def dirs(i, fl):
            vs = F[i].verts[::-1] if fl else F[i].verts
            return {(id(vs[k]), id(vs[(k + 1) % len(vs)])) for k in range(len(vs))}
        for s0 in range(len(F)):
            if flip[s0] is not None: continue
            flip[s0] = False; comp = [s0]; q = [s0]
            while q:
                i = q.pop(); di = dirs(i, flip[i])
                vs = F[i].verts
                for k in range(len(vs)):
                    for (j, a, b) in E[frozenset((id(vs[k]), id(vs[(k + 1) % len(vs)])))]:
                        if j == i or flip[j] is not None: continue
                        # neighbour j must traverse the shared edge in the opposite direction to face i
                        fj = (a, b) in di
                        flip[j] = fj; comp.append(j); q.append(j)
            cen = Vector((0, 0, 0)); cnt = 0
            for i in comp:
                for v in F[i].verts: cen += v.co; cnt += 1
            cen = cen / max(1, cnt); vol = 0.0
            for i in comp:
                vs = F[i].verts[::-1] if flip[i] else F[i].verts
                for k in range(1, len(vs) - 1): vol += (vs[0].co - cen).dot((vs[k].co - cen).cross(vs[k + 1].co - cen))
            if vol < 0:
                for i in comp: flip[i] = not flip[i]
        vf = {}
        for i, f in enumerate(bm.faces):
            for v in f.verts: vf.setdefault(id(v), []).append(i)
        cosl = math.cos(math.radians(40))
        prims = {}
        flat = getattr(o, 'flat', False)
        col_attr = o.data.color_attributes.items.get('Col') if o.data.color_attributes.items else None
        vindex = {id(v): k for k, v in enumerate(bm.verts)}
        for i, f in enumerate(bm.faces):
            n0 = -fn[i] if flip[i] else fn[i]
            vs = f.verts[::-1] if flip[i] else f.verts
            pr = prims.setdefault(f.material_index, {'pos': [], 'nrm': [], 'col': [], 'idx': [], 'map': {}})
            corner = []
            for v in vs:
                acc = Vector((0, 0, 0))
                for j in vf[id(v)]:
                    nj = -fn[j] if flip[j] else fn[j]
                    if nj.dot(n0) >= cosl: acc += nj
                nn = acc.normalized() if acc.length > 1e-9 else n0
                corner.append((v.co, nn, col_attr.data[vindex[id(v)]].color if col_attr and id(v) in vindex else None))
            for k in range(1, len(corner) - 1):
                for c in (corner[0], corner[k], corner[k + 1]):
                    p, nn, cc = c
                    key = (round(p.x, 5), round(p.y, 5), round(p.z, 5), round(nn.x, 3), round(nn.y, 3), round(nn.z, 3))
                    if key not in pr['map']:
                        pr['map'][key] = len(pr['pos']) // 3
                        pr['pos'] += [p.x, p.z, -p.y]; pr['nrm'] += [nn.x, nn.z, -nn.y]
                        if cc is not None: pr['col'] += list(cc)
                    pr['idx'].append(pr['map'][key])
        P = []
        for mi, pr in sorted(prims.items()):
            cnt = len(pr['pos']) // 3
            if not cnt: continue
            xs, ys, zs = pr['pos'][0::3], pr['pos'][1::3], pr['pos'][2::3]
            a = {'POSITION': add(struct.pack('<%df' % len(pr['pos']), *pr['pos']), None, cnt, 'VEC3', 5126, 34962, ([min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)])),
                 'NORMAL': add(struct.pack('<%df' % len(pr['nrm']), *pr['nrm']), None, cnt, 'VEC3', 5126, 34962)}
            if len(pr['col']) == cnt * 4: a['COLOR_0'] = add(struct.pack('<%df' % len(pr['col']), *pr['col']), None, cnt, 'VEC4', 5126, 34962)
            ms = o.data.materials
            m = ms[mi] if mi < len(ms) else (ms[0] if ms else None)
            STATS['t'] += len(pr['idx']) // 3; STATS['v'] += cnt
            prim = {'attributes': a, 'indices': add(struct.pack('<%dI' % len(pr['idx']), *pr['idx']), None, len(pr['idx']), 'SCALAR', 5125, 34963)}
            if m is not None:
                if id(m) not in matidx: matidx[id(m)] = len(mats); mats.append(mat_json(m))
                prim['material'] = matidx[id(m)]
            P.append(prim)
        if P: meshes.append({'name': o.name, 'primitives': P}); N['mesh'] = len(meshes) - 1
    root_idx = [node_for(o, True) for o in roots if o not in B.cutters]
    doc = {'asset': {'version': '2.0', 'generator': 'cartkit preview stub'}, 'scene': 0, 'scenes': [{'nodes': root_idx}], 'nodes': nodes,
           'meshes': meshes, 'materials': mats, 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(bin_)}],
           'extensionsUsed': ['KHR_materials_clearcoat', 'KHR_materials_emissive_strength']}
    js = json.dumps(doc).encode()
    while len(js) % 4: js += b' '
    while len(bin_) % 4: bin_.append(0)
    glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(glb)
    tris = sum(len(m['primitives']) and 0 for m in meshes)
    return len(glb)

STATS = {'t': 0, 'v': 0}
os.makedirs(out_dir, exist_ok=True)
stem = os.path.basename(script)[:-3]
for lv, ov in (('hi', {'hi': {'ico': 1}}), ('lo', None)):
    B = ck.Build(stem, lv, ov); g['build'](B)
    B.cutters = [c for c in B.cutters]
    objs = [o for o in B.objs if all(o is not c for c in B.cutters)]
    B.objs = objs
    p = os.path.join(out_dir, stem + ('' if lv == 'hi' else '_lo') + '.glb')
    print(lv, p, write(B, p), 'bytes', 'tris', STATS['t'], 'verts', STATS['v']); STATS.update(t=0, v=0)
