"""Clothes from the body surface (T-pose): tee (sleeves to mid upper arm), trousers, sneakers. Each garment is the
body region duplicated, smoothed, pushed out along the normals and given a hem rim; then the body faces hidden under
the clothes are deleted. Weights come from the body by nearest-face transfer."""
import bpy, bmesh, numpy as np, math
from mathutils import Vector
body = bpy.data.objects[globals().get('CL_SRC', 'Brady_Body')]; me = body.data
P = np.array([v.co[:] for v in me.vertices])
CFG = globals().get('CL_CFG', {})
def tee_in(p, shrink=0.0):
    x, y, z = p
    if z < CFG.get('hem', 0.975) + shrink or z > 1.62: return False
    if abs(x) > CFG.get('sleeve', 0.335) - shrink: return False
    # crew neck: neck skin stays bare (lower in front)
    r = math.hypot(x, (y + 0.012) * 1.15)
    cut = CFG.get('neck_front', 1.528) if y < -0.02 else CFG.get('neck_back', 1.555)
    if z > cut - shrink and r < 0.085 + 0.4 * max(0.0, z - cut): return False
    if z > 1.585: return False
    return True
def pants_in(p, shrink=0.0):
    x, y, z = p
    return CFG.get('ankle', 0.095) + shrink < z < CFG.get('waist', 1.045) - shrink and abs(x) < 0.26
def shoe_in(p, shrink=0.0):
    return p[2] < CFG.get('shoe_top', 0.115) - shrink
REG = {'Tee': tee_in, 'Trousers': pants_in, 'Sneakers': shoe_in}
REG = {k: REG[k] for k in CFG.get('only', REG.keys())}
OFF = CFG.get('off', {'Tee': (0.006, 0.014), 'Trousers': (0.008, 0.014), 'Sneakers': (0.011, 0.013)})
coll = bpy.data.collections.get('Clothes') or bpy.data.collections.new('Clothes')
if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
made = {}
for name, fn in REG.items():
    bm = bmesh.new(); bm.from_mesh(me)
    inside = [fn(tuple(v.co), -0.03) for v in bm.verts]
    kill = [f for f in bm.faces if not all(inside[v.index] for v in f.verts)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    # straight hems: cut with planes (the relaxed region above overshoots each by 3 cm)
    planes = {'Tee': [((0, 0, CFG.get('hem', 0.975)), (0, 0, -1)), ((CFG.get('sleeve', 0.335), 0, 0), (1, 0, 0)), ((-CFG.get('sleeve', 0.335), 0, 0), (-1, 0, 0))],
              'Trousers': [((0, 0, CFG.get('waist', 1.045)), (0, 0, 1)), ((0, 0, CFG.get('ankle', 0.095)), (0, 0, -1))]}.get(name, [])
    for co, no in planes:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=True)
    if name == 'Tee':     # the neckline keeps the predicate cut (it is relaxed below)
        inside = [fn(tuple(v.co)) or v.co.z < 1.5 for v in bm.verts]
        kill = [f for f in bm.faces if not all(inside[v.index] for v in f.verts)]
        bmesh.ops.delete(bm, geom=kill, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.dissolve_degenerate(bm, dist=0.002, edges=bm.edges[:])
    # smooth away anatomy (nipples, navel, muscle relief, toes), keep the silhouette
    for it in range(CFG.get('smooth_shoe', 30) if name == 'Sneakers' else CFG.get('smooth', 6)):
        bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    o0, o1 = OFF[name]
    for v in bm.verts:
        x, y, z = v.co
        if name == 'Tee':     t = min(max((abs(x) - 0.2) / 0.13, 0), 1) * 0.6 + min(max((1.08 - z) / 0.1, 0), 1) * 0.4
        elif name == 'Trousers': t = min(max((0.6 - z) / 0.45, 0), 1)
        else: t = 0.0
        v.co += v.normal * (o0 + (o1 - o0) * t)
    if name == 'Sneakers':
        for v in bm.verts:
            if v.co.z < 0.012: v.co.z = 0.0
            # toe box and heel a little longer
            if v.co.y < -0.12: v.co.y -= 0.008
            if v.co.y > 0.03 and v.co.z < 0.06: v.co.y += 0.006
    # clean hems: relax each boundary loop along itself, then flatten it to a plane (z for hems, x for sleeves)
    bverts = [v for v in bm.verts if v.is_boundary]
    for it in range(12):
        newp = {}
        for v in bverts:
            nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
            if len(nb) == 2: newp[v] = v.co * 0.5 + (nb[0].co + nb[1].co) * 0.25
        for v, p in newp.items(): v.co = p
    # group boundary verts into loops
    seen = set(); loops = []
    for v in bverts:
        if v in seen: continue
        loop = []; stack = [v]
        while stack:
            w = stack.pop()
            if w in seen: continue
            seen.add(w); loop.append(w)
            stack += [e.other_vert(w) for e in w.link_edges if e.is_boundary and e.other_vert(w) not in seen]
        loops.append(loop)
    for loop in loops:
        co = np.array([v.co[:] for v in loop]); ext = co.max(0) - co.min(0)
        if ext[0] < ext[2] * 0.6 and np.abs(co[:, 0]).mean() > 0.25:      # sleeve opening: plane x = const
            xm = co[:, 0].mean()
            for v in loop: v.co.x = xm
        elif ext[2] < 0.12:                                                 # hem / cuff / waist / shoe top
            zm = co[:, 2].mean()
            for v in loop: v.co.z = zm
    bm.normal_update()
    m = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(m); bm.free()
    for p in m.polygons: p.use_smooth = True
    ob = bpy.data.objects.get(name)
    if ob is None:
        ob = bpy.data.objects.new(name, m); coll.objects.link(ob)
    ob.data = m
    for md in list(ob.modifiers): ob.modifiers.remove(md)
    so = ob.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = 0.0025; so.offset = -1.0; so.use_rim = True
    made[name] = ob
if not CFG.get('no_body_cut'):
    # delete body faces hidden under the clothes (one shrink margin so seams stay covered)
    bm = bmesh.new(); bm.from_mesh(me)
    sh = CFG.get('hide_margin', 0.025)
    def hidden(p):
        return tee_in(p, sh) or pants_in(p, sh) or shoe_in(p, 0.02)
    flag = [hidden(tuple(v.co)) for v in bm.verts]
    kill = [f for f in bm.faces if all(flag[v.index] for v in f.verts)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(me); bm.free()
print({k: len(v.data.polygons) for k, v in made.items()}, 'body faces', len(me.polygons))
