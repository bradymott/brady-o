"""Realistic Chinka, step 6: trim to the LOD0 budget (BURNS_GUIDE §6.12: 25-35 k triangles, <= 3 draws) before the
atlas: delete the foot skin inside the flats, decimate the body with the face, ears and hands protected (Decimate's
vertex group: weight 1 = may collapse, 0 = keep), lighten the flats, chain and gold. Add the non-deforming end bones
charkit's clips key (HeadTop_End, Left/RightToe_End). Run in the open Blender after cb_all.py."""
import bpy, bmesh, numpy as np
CFG = globals().get('PREP_CFG', {})
rig = bpy.data.objects['Armature']; M = 'mixamorig:'
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def decimate(ob, ratio, group=None):
    sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = ratio; md.use_collapse_triangulate = True
    if group: md.vertex_group = group; md.vertex_group_factor = 1.0
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
body = bpy.data.objects['Chinka_Body']
# feet inside the flats
bm = bmesh.new(); bm.from_mesh(body.data)
inside = [v.co.z < 0.040 or (v.co.z < 0.06 and v.co.y < -0.14) for v in bm.verts]
bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(inside[v.index] for v in f.verts)], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.to_mesh(body.data); bm.free()
# decimation weights: face/ears 0, scalp (under the cap) 0.6, neck 0.4, hands 0.35, everything else 1
g = body.vertex_groups.get('__dec') or body.vertex_groups.new(name='__dec')
for v in body.data.vertices:
    x, y, z = v.co
    if z > 1.44:
        w = 0.0 if (y < -0.02 or abs(x) > 0.06) and z < 1.64 else 0.6
    elif z > 1.38 and abs(x) < 0.08: w = 0.4
    elif abs(x) > 0.57: w = 0.35
    else: w = 1.0
    g.add([v.index], w, 'REPLACE')
t0 = tris(body)
decimate(body, CFG.get('body_ratio', 0.62), '__dec')
body.vertex_groups.remove(body.vertex_groups['__dec'])
print('body', t0, '->', tris(body))
for name, target in (('CK_Flats', CFG.get('flats', 700)), ('CK_Chain', CFG.get('chain', 420)), ('CK_Gold', CFG.get('gold', 1000))):
    ob = bpy.data.objects[name]
    for md in list(ob.modifiers):
        if md.type == 'SOLIDIFY': sel([ob]); bpy.ops.object.modifier_apply(modifier=md.name)
    t = tris(ob)
    if t > target: decimate(ob, target / t)
    print(name, t, '->', tris(ob))
for name in ('CK_Bodice', 'CK_Belt'):
    ob = bpy.data.objects[name]
    for md in list(ob.modifiers):
        if md.type == 'SOLIDIFY': sel([ob]); bpy.ops.object.modifier_apply(modifier=md.name)
# end bones (non-deforming) for charkit
sel([rig]); bpy.ops.object.mode_set(mode='EDIT'); E = rig.data.edit_bones
def endb(name, parent, d):
    b = E.get(M + name) or E.new(M + name); p = E[M + parent]
    b.head = p.tail.copy(); b.tail = p.tail + d; b.parent = p; b.use_connect = False; b.use_deform = False
from mathutils import Vector
endb('HeadTop_End', 'Head', Vector((0, 0, 0.04)))
endb('LeftToe_End', 'LeftToeBase', Vector((0, -0.03, 0)))
endb('RightToe_End', 'RightToeBase', Vector((0, -0.03, 0)))
bpy.ops.object.mode_set(mode='OBJECT')
tot = sum(tris(o) for o in bpy.data.objects if o.type == 'MESH' and o.parent == rig)
print('LOD0 total (pre-join)', tot, {o.name: tris(o) for o in bpy.data.objects if o.type == 'MESH' and o.parent == rig})
