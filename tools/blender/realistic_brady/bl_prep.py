"""Game geometry prep: inner hem bands for the tee and trousers (no full inner shell), UVs for parts that have none,
no subdivision on the body."""
import bpy, bmesh, numpy as np
from mathutils import Vector
def inner_band(name, width=0.035, thick=0.0025):
    ob = bpy.data.objects[name]
    for md in list(ob.modifiers):
        if md.type == 'SOLIDIFY': ob.modifiers.remove(md)
    me = ob.data; bm = bmesh.new(); bm.from_mesh(me)
    bverts = [v for v in bm.verts if v.is_boundary]
    B = np.array([v.co[:] for v in bverts])
    # faces near a hem: all verts within `width` of a boundary vertex
    P = np.array([v.co[:] for v in bm.verts])
    from mathutils.kdtree import KDTree
    kd = KDTree(len(B))
    for i, p in enumerate(B): kd.insert(p, i)
    kd.balance()
    near = np.array([kd.find(p)[2] < width for p in P])
    faces = [f for f in bm.faces if all(near[v.index] for v in f.verts)]
    dl = bm.verts.layers.deform.active
    uvl = bm.loops.layers.uv.active
    bm.normal_update()
    vmap = {}
    for f in faces:
        for v in f.verts:
            if v not in vmap:
                nv = bm.verts.new(v.co - v.normal * thick)
                if dl: nv[dl] = v[dl]
                vmap[v] = nv
    new_faces = []
    for f in faces:
        nf = bm.faces.new([vmap[v] for v in reversed(f.verts)])
        for l_new, l_old in zip(nf.loops, reversed(f.loops)):
            if uvl: l_new[uvl].uv = l_old[uvl].uv
        nf.smooth = True; new_faces.append(nf)
    # rim: bridge each boundary edge to its inner copy
    for e in [e for e in bm.edges if e.is_boundary and e.verts[0] in vmap and e.verts[1] in vmap and not any(f in new_faces for f in e.link_faces)]:
        a, b = e.verts
        try:
            rf = bm.faces.new((b, a, vmap[a], vmap[b]))
            if uvl:
                for l in rf.loops:
                    src = l.vert if l.vert in vmap else next(k for k, v in vmap.items() if v is l.vert)
                    l[uvl].uv = next(l2 for l2 in src.link_loops if l2.face is not rf)[uvl].uv
        except ValueError:
            pass
    bm.to_mesh(me); bm.free()
    print(name, 'inner band faces', len(faces))
for n in globals().get('BAND_OBJS', ('Tee', 'Trousers')): inner_band(n)
def smart_uv(name, angle=66.0, margin=0.02):
    ob = bpy.data.objects[name]
    if not ob.data.uv_layers: ob.data.uv_layers.new(name='UVMap')
    for o in bpy.context.view_layer.objects: o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=np.radians(angle), island_margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')
for n in ('Sunglasses_Frame', 'Sunglasses_Lenses', 'Sunglasses_Temples', 'Sneakers'):
    if not bpy.data.objects[n].data.uv_layers: smart_uv(n)
body = bpy.data.objects['Brady_Body']
for md in list(body.modifiers):
    if md.type == 'SUBSURF': body.modifiers.remove(md)
for n in ('Tee', 'Trousers', 'Sneakers', 'Sunglasses_Frame', 'Sunglasses_Lenses', 'Sunglasses_Temples'):
    print(n, len(bpy.data.objects[n].data.polygons), [u.name for u in bpy.data.objects[n].data.uv_layers])
