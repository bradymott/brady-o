import bpy, bmesh, numpy as np, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
H = '/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad/head/'
P_ = '/Users/bradymott/brady-o/private/work/proj/'
rng = np.random.default_rng(21)
CFG = globals().get('HAIR_CFG', {})
BUN = Vector(CFG.get('bun', (0.0, 0.065, 1.865)))
CEN = Vector(CFG.get('center', (0.0, -0.015, 1.745)))
sc = bpy.context.scene
body = bpy.data.objects['Brady_Body']
sd = body.modifiers['Subdiv']; sdv = sd.show_viewport; sd.show_viewport = False
dg = bpy.context.evaluated_depsgraph_get()
ev = body.evaluated_get(dg)
me = ev.to_mesh()
verts = np.array([v.co[:] for v in me.vertices])
uvl = me.uv_layers.active.data
# per vertex uv
vuv = np.zeros((len(verts), 2))
for p in me.polygons:
    for li in p.loop_indices:
        vuv[me.loops[li].vertex_index] = uvl[li].uv
alb = np.load(P_ + 'albedo_final.npy')
valid = np.load(P_ + 'valid.npy')
N = alb.shape[0]
ix = np.clip((vuv[:, 0] * N).astype(int), 0, N - 1); iy = np.clip((vuv[:, 1] * N).astype(int), 0, N - 1)
lum = (alb[iy, ix].astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722]))
seen = valid[iy, ix]
# scalp group weights on evaluated mesh: map via vertex group in evaluated mesh (mask keeps groups)
gi = body.vertex_groups['scalp'].index
scalp = np.zeros(len(verts))
for v in me.vertices:
    for g in v.groups:
        if g.group == gi: scalp[v.index] = g.weight
rel = verts - np.array(CEN)
# hair classification
nape_line = CFG.get('nape_z', 1.675) + CFG.get('nape_side', 0.05) * np.clip((np.abs(verts[:, 0]) - 0.03) / 0.05, 0, 1)
unseen_hair = (scalp > 0.3) | ((verts[:, 1] > CFG.get('back_y', -0.03)) & (verts[:, 2] > nape_line))
px = alb[iy, ix].astype(np.float32)
satv = (px.max(1) - px.min(1)) / np.maximum(px.max(1), 1e-4)
photo_hair = (lum < CFG.get('hair_lum', 0.045)) | ((satv < CFG.get('hair_sat', 0.3)) & (lum < CFG.get('hair_lum2', 0.12)))
hair = np.where(seen, photo_hair, unseen_hair)
side_zone = (np.abs(verts[:, 0]) > CFG.get('side_x', 0.05)) & (verts[:, 2] > CFG.get('side_z', 1.745)) & (verts[:, 1] > CFG.get('side_y', -0.09))
hair |= side_zone
_gie = body.vertex_groups['ears'].index
_earw = np.zeros(len(verts))
for v in me.vertices:
    for g in v.groups:
        if g.group == _gie: _earw[v.index] = g.weight
hair &= _earw < 0.05
hair &= verts[:, 2] > CFG.get('min_z', 1.66)
# nape: hair pulled up, keep nape skin clean below this height at the back
hair &= ~((verts[:, 1] > -0.02) & (verts[:, 2] < nape_line))
adj = [[] for _ in verts]
for e in me.edges:
    a, b_ = e.vertices; adj[a].append(b_); adj[b_].append(a)
# parametric hairline: polar angle from the bun axis vs azimuth, best split per azimuth bin
bax = (BUN - CEN).normalized()
r0 = Vector((0, -1, 0)); r0 = (r0 - bax * r0.dot(bax)).normalized(); r1 = bax.cross(r0)
D = rel / np.linalg.norm(rel, axis=1, keepdims=True)
TH = np.arccos(np.clip(D @ np.array(bax), -1, 1))
PH = np.arctan2(D @ np.array(r1), D @ np.array(r0))
head_mask = (verts[:, 2] > 1.60)
NB = 48
thl = np.zeros(NB)
for k in range(NB):
    a0 = -math.pi + 2 * math.pi * k / NB; a1 = a0 + 2 * math.pi / NB
    m = head_mask & (PH >= a0) & (PH < a1)
    th = TH[m]; hh = hair[m]
    if len(th) < 5: thl[k] = np.nan; continue
    best = -1e9; bt = 0
    for t in np.linspace(0.2, 2.0, 120):
        sc_ = (hh & (th < t)).sum() - 1.3 * ((~hh) & (th < t)).sum()
        if sc_ > best: best = sc_; bt = t
    thl[k] = bt
# fill nan + circular smoothing
idx = np.arange(NB); ok = ~np.isnan(thl)
thl = np.interp(idx, idx[ok], thl[ok], period=NB)
for it in range(CFG.get('hl_smooth', 2)):
    thl = 0.25 * np.roll(thl, 1) + 0.5 * thl + 0.25 * np.roll(thl, -1)
np.save(H + 'hairline_theta.npy', thl)
kk = ((PH + math.pi) / (2 * math.pi) * NB)
lim = np.interp(kk, np.arange(NB + 1), np.append(thl, thl[0]))
hair = head_mask & (TH < lim + CFG.get('hl_margin', -0.02))
hair |= side_zone
hair &= _earw < 0.05
hair &= ~((verts[:, 1] > -0.02) & (verts[:, 2] < nape_line))
# faces fully hair
# fill interior holes: non-hair vertices not connected to the main non-hair region become hair
from collections import deque
seed = int(np.argmin(verts[:, 2]))
reach = np.zeros(len(verts), bool); reach[seed] = True; dq = deque([seed])
while dq:
    i = dq.popleft()
    for j in adj[i]:
        if not reach[j] and not hair[j]:
            reach[j] = True; dq.append(j)
filled = (~hair) & (~reach)
print('filled hole verts', int(filled.sum()))
hair |= filled
np.save(H + 'hair_vmask.npy', hair)
faces_all = [p for p in me.polygons if all(hair[v] for v in p.vertices)]
# build cap mesh
bm = bmesh.new()
vmap = {}
nrm = np.array([v.normal[:] for v in me.vertices])
# distance from cap boundary (in edges) for thickness taper
inner = hair.copy()
depth = np.zeros(len(verts))
for k in range(1, 8):
    newinner = inner.copy()
    for i in np.nonzero(inner)[0]:
        if any(not inner[j] for j in adj[i]): newinner[i] = False
    inner = newinner; depth[inner] = k
faces = [p for p in faces_all if all(depth[v] >= CFG.get('cap_inset', 1) for v in p.vertices)]
partial = [p for p in me.polygons if 2 <= sum(hair[v] for v in p.vertices) < len(p.vertices) and max(_earw[list(p.vertices)]) < 0.05]
print('cap faces', len(faces), 'partial', len(partial))
def vnew(vi):
    if vi not in vmap:
        if hair[vi]:
            if CFG.get('vol', False):
                ramp = min(depth[vi] / CFG.get('ramp_rings', 4.0), 1.0) ** 0.7
                nz = np.clip((nrm[vi, 2] + 0.1) / 0.9, 0, 1) ** 1.2
                full = CFG.get('side_t', 0.008) + (CFG.get('top_t', 0.015) - CFG.get('side_t', 0.008)) * nz
                full *= 1 + CFG.get('bun_bulge', 0.3) * np.clip(1 - TH[vi] / 1.1, 0, 1)
                full *= np.clip((verts[vi, 2] - 1.68) / 0.06, 0.3, 1.0)
                t = CFG.get('cap_min', 0.0005) + (full - CFG.get('cap_min', 0.0005)) * ramp
            else:
                t = CFG.get('cap_min', 0.0025) + (CFG.get('cap_max', 0.008) - CFG.get('cap_min', 0.0025)) * min(depth[vi] / CFG.get('ramp_rings', 4.0), 1.0)
                t *= CFG.get('side_f', 0.45) + (1.3 - CFG.get('side_f', 0.45)) * np.clip((nrm[vi, 2] - 0.15) / 0.75, 0, 1) ** 1.5
                t += CFG.get('lift', 0.0) * np.clip((verts[vi, 2] - 1.78) / 0.05, 0, 1) * np.clip((0.03 - verts[vi, 1]) / 0.06, 0, 1) * min(depth[vi] / 3.0, 1.0)
                t *= 1 + CFG.get('bun_bulge', 0.8) * np.clip(1 - TH[vi] / 1.1, 0, 1)
                t *= np.clip((verts[vi, 2] - 1.68) / 0.07, 0.2, 1.0)
                t = max(t, CFG.get('t_floor', 0.0025) * min(max(depth[vi] - 1, 0), 1.0) + 0.0012)
        else:
            t = CFG.get('cap_min', 0.0025) * 0.5
        vmap[vi] = bm.verts.new(Vector(verts[vi]) + Vector(nrm[vi]) * t)
    return vmap[vi]
for p in faces:
    try: bm.faces.new([vnew(v) for v in p.vertices])
    except ValueError: pass
pf = []
_pl = bm.faces.layers.int.new('partial')
for p in partial:
    try:
        _f = bm.faces.new([vnew(v) for v in p.vertices]); _f[_pl] = 1; pf.append(_f)
    except ValueError: pass
if pf and CFG.get('refine', True):
    edges = list({e for f in pf for e in f.edges})
    for it in range(CFG.get('refine_levels', 1)):
        res_ = bmesh.ops.subdivide_edges(bm, edges=edges, cuts=1, use_grid_fill=True)
        bm.faces.ensure_lookup_table()
        if it + 1 < CFG.get('refine_levels', 1):
            edges = [e for e in bm.edges if any(not (lambda c: True)(c) for c in [0])]
    # trim by the continuous hairline test
    def lim_at(ph):
        kk_ = (ph + math.pi) / (2 * math.pi) * NB
        return float(np.interp(kk_, np.arange(NB + 1), np.append(thl, thl[0])))
    def cont_hair(c):
        r_ = c - CEN; d_ = r_.normalized()
        th_ = math.acos(max(-1, min(1, d_.dot(bax))))
        ph_ = math.atan2(d_.dot(r1), d_.dot(r0))
        ok = th_ < lim_at(ph_) + CFG.get('hl_margin', -0.02)
        ok |= (abs(c.x) > CFG.get('side_x', 0.05)) and (c.z > CFG.get('side_z', 1.745)) and (c.y > CFG.get('side_y', -0.09))
        nl = CFG.get('nape_z', 1.675) + CFG.get('nape_side', 0.05) * min(max((abs(c.x) - 0.03) / 0.05, 0), 1)
        if c.y > -0.02 and c.z < nl: ok = False
        return ok
    from mathutils.kdtree import KDTree
    _bv = [i for i in range(len(verts)) if hair[i] and any(not hair[j] for j in adj[i])]
    _kd = KDTree(len(_bv))
    for _k, _i in enumerate(_bv): _kd.insert(Vector(verts[_i]), _k)
    _kd.balance()
    dead = [f for f in bm.faces if f[_pl] == 1 and not cont_hair(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
bm.verts.ensure_lookup_table()
# a few smoothing passes on cap
for _it in range(CFG.get('smooth_it', 1)):
    bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
if CFG.get('vol', False) and CFG.get('cap_subdiv', 1):
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True, smooth=1.0)
    for _it in range(2):
        bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
# polar UV around bun
b = (BUN - CEN).normalized()
ref = Vector((0, -1, 0)); ref = (ref - b * ref.dot(b)).normalized(); ref2 = b.cross(ref)
def polar(co):
    d = (co - CEN).normalized()
    th = math.acos(max(-1, min(1, d.dot(b))))
    x = d.dot(ref); y = d.dot(ref2)
    ph = math.atan2(y, x)
    return th, ph
thmax = max(polar(v.co)[0] for v in bm.verts)
def lim_at2(ph):
    kk_ = (ph + math.pi) / (2 * math.pi) * NB
    # cap boundary in this azimuth: max theta of cap verts near this azimuth (robust to side zone)
    return float(np.interp(kk_, np.arange(NB + 1), np.append(capmax, capmax[0])))
_pp = [polar(v.co) for v in bm.verts]
capmax = np.zeros(NB)
for th_, ph_ in _pp:
    k_ = int((ph_ + math.pi) / (2 * math.pi) * NB) % NB
    capmax[k_] = max(capmax[k_], th_)
for it_ in range(2):
    capmax = np.maximum(capmax, 0.5 * (np.roll(capmax, 1) + np.roll(capmax, -1)))
uvL = bm.loops.layers.uv.new('Flow' if CFG.get('vol', False) else 'UVMap')
for f in bm.faces:
    ps = [polar(l.vert.co) for l in f.loops]
    phs = [p[1] for p in ps]
    if max(phs) - min(phs) > math.pi:  # seam fix
        phs = [p + 2 * math.pi if p < 0 else p for p in phs]
    for l, (th, _), ph in zip(f.loops, ps, phs):
        php = ph if ph <= math.pi else ph - 2 * math.pi
        u = 0.012 + 0.22 * min(abs(php) / math.pi, 1.0)
        v = 0.04 + 0.85 * min(th / max(lim_at2(ph if ph <= math.pi else ph - 2 * math.pi), 0.3), 1.0)
        l[uvL].uv = (u, v)
# force a soft root band along the cap border: ring 0 -> v .997, ring 1 -> <= .95
ring = {}
front = [v for v in bm.verts if v.is_boundary]
for v in front: ring[v] = 0
for r_ in (1, 2, 3):
    nxt = []
    for v in front:
        for e in v.link_edges:
            w = e.other_vert(v)
            if w not in ring: ring[w] = r_; nxt.append(w)
    front = nxt
for f in bm.faces:
    for l in f.loops:
        r_ = ring.get(l.vert)
        if r_ == 0: l[uvL].uv = (l[uvL].uv[0], 0.997)
        elif r_ == 1: l[uvL].uv = (l[uvL].uv[0], 0.975)
        elif r_ == 2: l[uvL].uv = (l[uvL].uv[0], 0.95)
        elif r_ == 3: l[uvL].uv = (l[uvL].uv[0], min(l[uvL].uv[1], 0.92))
fadeL = bm.loops.layers.float_color.new('Fade')
FADE = CFG.get('fade', (0.0, 0.45, 0.85))
for f in bm.faces:
    for l in f.loops:
        r_ = ring.get(l.vert)
        fv = FADE[r_] if (r_ is not None and r_ < len(FADE)) else 1.0
        l[fadeL] = (fv, fv, fv, 1.0)
capme = bpy.data.meshes.new('Hair_Cap')
bm.to_mesh(capme); bm.free()
for p in capme.polygons: p.use_smooth = True
old = bpy.data.objects.get('Hair_Cap')
if old: bpy.data.objects.remove(old)
cap = bpy.data.objects.new('Hair_Cap', capme)
coll = bpy.data.collections.get('Hair') or bpy.data.collections.new('Hair')
if coll.name not in sc.collection.children: sc.collection.children.link(coll)
coll.objects.link(cap)
# ---------- cards following flow lines on the cap surface
capbvh = BVHTree.FromObject(cap, dg) if False else None
cv = [Vector(v.co) for v in capme.vertices]; cf = [list(p.vertices) for p in capme.polygons]
capbvh = BVHTree.FromPolygons(cv, cf)
gie = body.vertex_groups['ears'].index
earw = np.zeros(len(verts))
for v in me.vertices:
    for g in v.groups:
        if g.group == gie: earw[v.index] = g.weight
headbvh = BVHTree.FromPolygons([Vector(v) for v in verts], [list(p.vertices) for p in me.polygons if max(earw[list(p.vertices)]) < 0.2 and verts[list(p.vertices)][:, 2].min() > 1.55])
# boundary vertices of cap = hairline (start points)
bnd = [Vector(verts[i]) for i in range(len(verts)) if hair[i] and any(not hair[j] for j in adj[i])]
print('hairline verts', len(bnd))
def snap(p, off):
    loc, n, i, d = headbvh.find_nearest(p)
    return loc + n * off, n
def trace(start, off, steps=10):
    # move along great circle from start toward bun, projected on head surface + offset
    pts = []; ns = []
    d0 = (start - CEN); d1 = (BUN - CEN)
    a0 = d0.normalized(); a1 = d1.normalized()
    ang = a0.angle(a1)
    axis = a0.cross(a1).normalized()
    for k in range(steps + 1):
        t = k / steps
        q = Matrix.Rotation(ang * t * CFG.get('reach', 0.92), 3, axis) @ a0
        # radial cast from centre outward to the head surface
        hit = capbvh.ray_cast(CEN + q * 0.25, -q)
        if hit[0] is None:
            hit = headbvh.ray_cast(CEN + q * 0.25, -q)
        if hit[0] is None:
            hit = headbvh.find_nearest(CEN + q * 0.1)
        loc, n = hit[0], hit[1]
        # off grows towards the bun to build volume
        o = off * (0.8 + 0.4 * t)
        pts.append(loc + n * o); ns.append(n)
    return pts, ns
cards = bmesh.new(); cuv = cards.loops.layers.uv.new('UVMap')
def add_card(pts, ns, width, u0, u1, v0=0.995, v1=0.04, taper=0.45):
    rows = []
    for k, (p, n) in enumerate(zip(pts, ns)):
        if k < len(pts) - 1: t = (pts[k + 1] - p)
        else: t = (p - pts[k - 1])
        side = n.cross(t).normalized()
        w = width * (1 - taper * k / (len(pts) - 1))
        rows.append((cards.verts.new(p - side * w / 2), cards.verts.new(p + side * w / 2)))
    for k in range(len(rows) - 1):
        f = cards.faces.new((rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]))
        va = v0 + (v1 - v0) * k / (len(rows) - 1); vb = v0 + (v1 - v0) * (k + 1) / (len(rows) - 1)
        for l, uv in zip(f.loops, ((u0, va), (u1, va), (u1, vb), (u0, vb))):
            l[cuv].uv = uv
# choose start points along hairline, plus interior starts
starts = []
bnd_np = np.array([b[:] for b in bnd])
for i in rng.integers(0, len(bnd), CFG.get('n_edge', 110)):
    p0 = Vector(bnd_np[i]) + Vector(rng.normal(0, 0.004, 3))
    starts.append((p0, CFG.get('off1', 0.0025)))
# interior: random cap verts
civ = rng.choice(len(cv), CFG.get('n_inner', 60), replace=False)
for i in civ:
    starts.append((cv[i].copy(), CFG.get('off2', 0.0055)))
for s, off in starts:
    off = off * rng.uniform(0.6, 1.8) * min(max((s.z - 1.68) / 0.06, 0.25), 1.0)
    pts, ns = trace(s, off, steps=CFG.get('steps', 8))
    w = rng.uniform(*CFG.get('w', (0.010, 0.018)))
    uw = w * CFG.get('u_per_m', 4.0)
    uw = max(0.02, min(uw, 0.08))
    u0 = rng.uniform(0.255, 0.497 - uw)
    add_card(pts, ns, w, u0, u0 + uw)

# ---- wisps / baby hairs: short sparse cards starting just in front of the hairline, lying on the skin
def outward(p):
    d = (p - CEN).normalized(); a1 = (BUN - CEN).normalized()
    ax = d.cross(a1).normalized()
    return Matrix.Rotation(-CFG.get('wisp_out', 0.06), 3, ax) @ d
for i in rng.integers(0, len(bnd), CFG.get('n_wisp', 70)):
    p0 = Vector(bnd_np[i])
    q = outward(p0)
    hit = headbvh.ray_cast(CEN + q * 0.25, -q)
    if hit[0] is None: continue
    s0 = hit[0]
    pts, ns = trace(s0, 0.0006, steps=3)
    # shorten: keep only the first ~30% of the path towards the bun
    L = CFG.get('wisp_len', 0.30)
    pts2 = [pts[0].lerp(pts[-1], 0)] + [pts[0] + (p - pts[0]) * L for p in pts[1:]]
    ns2 = ns
    # re-snap to surface
    pts3 = []
    for p, n in zip(pts2, ns2):
        loc, nn, _, _ = headbvh.find_nearest(p); pts3.append(loc + nn * 0.0008)
    w = rng.uniform(0.004, 0.009); uw = w * 6.0
    u0 = rng.uniform(0.503, 0.622 - uw)
    add_card(pts3, ns2, w, u0, u0 + uw, v0=0.99, v1=rng.uniform(0.45, 0.7), taper=0.2)
# ---- loose curly strands at the temples and behind the ears, hanging down
lc = [b for b in bnd if abs(b.x) > 0.055 and b.z < 1.79 and b.y > -0.09]
for k in range(CFG.get('n_loose', 10)):
    if not lc: break
    p0 = lc[int(rng.integers(0, len(lc)))]
    loc, n, _, _ = headbvh.find_nearest(p0)
    side = Vector((np.sign(p0.x), 0, 0))
    L = rng.uniform(0.04, 0.075)
    pts = []; ns = []
    for j in range(8):
        t = j / 7
        p = loc + n * (0.002 + 0.01 * t) + Vector((0, 0.01 * t, -L * t)) + side * 0.004 * math.sin(t * 7)
        pts.append(p); ns.append((n + side).normalized())
    w = rng.uniform(0.003, 0.005); uw = 0.02
    u0 = rng.uniform(0.63, 0.995 - uw)
    add_card(pts, ns, w, u0, u0 + uw, v0=0.99, v1=0.35, taper=0.3)
cme = bpy.data.meshes.new('Hair_Cards'); cards.to_mesh(cme); cards.free()
for p in cme.polygons: p.use_smooth = True
old = bpy.data.objects.get('Hair_Cards')
if old: bpy.data.objects.remove(old)
co = bpy.data.objects.new('Hair_Cards', cme); coll.objects.link(co)
ev.to_mesh_clear()
sd.show_viewport = sdv
print('cards', len(cme.polygons), 'cap', len(capme.polygons))
# ---- material + vertex colour: texture carries the colour; Col darkens the sides, lifts grey at the temples
_m = bpy.data.materials['M_HairCards']
for _n in ('Hair_Cap', 'Hair_Cards'):
    _o = bpy.data.objects[_n]; _o.data.materials.clear(); _o.data.materials.append(_m)
    _ca = _o.data.color_attributes.get('Col') or _o.data.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    _vals = np.zeros((len(_o.data.loops), 4), np.float32)
    _co = np.array([_o.data.vertices[l.vertex_index].co[:] for l in _o.data.loops])
    side = np.clip((np.abs(_co[:, 0]) - 0.04) / 0.04, 0, 1) * np.clip((1.83 - _co[:, 2]) / 0.06, 0, 1)
    temple = np.clip((np.abs(_co[:, 0]) - 0.05) / 0.02, 0, 1) * np.clip((1.80 - _co[:, 2]) / 0.04, 0, 1) * np.clip((0.0 - _co[:, 1]) / 0.05, 0, 1)
    f = (1.0 - 0.3 * side)[:, None] * np.array([1, 1, 1])
    f = f * (1 - temple[:, None]) + np.array([2.4, 2.45, 2.6]) * temple[:, None]
    _vals[:, :3] = f; _vals[:, 3] = 1
    _ca.data.foreach_set('color', _vals.ravel())
# ---- volumetric cap: own non-overlapping UVs for the photo bake, own material
if CFG.get('vol', False):
    _cap = bpy.data.objects['Hair_Cap']
    if 'UVMap' not in _cap.data.uv_layers: _cap.data.uv_layers.new(name='UVMap')
    _cap.data.uv_layers.active = _cap.data.uv_layers['UVMap']
    for _ob in bpy.context.view_layer.objects: _ob.select_set(False)
    _cap.select_set(True); bpy.context.view_layer.objects.active = _cap
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    _cm = bpy.data.materials.get('M_HairCap')
    if _cm: _cap.data.materials.clear(); _cap.data.materials.append(_cm)
    print('cap tris', sum(len(p.vertices) - 2 for p in _cap.data.polygons))
