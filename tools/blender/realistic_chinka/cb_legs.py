"""Realistic characters, step 2b (after cb_tpose.py): straighten the legs' sideways splay (MPFB stands with the feet
apart; charkit's clips assume vertical legs, as realistic Brady's rest has) and apply it as the rest pose.
Globals: BODY (mesh object), RIG (armature object). Run in the open Blender under a 3D-view context override."""
import bpy
from mathutils import Vector
h = bpy.data.objects[globals().get('BODY', 'Chinka_Body')]; rig = bpy.data.objects[globals().get('RIG', 'Armature')]; M = 'mixamorig:'
def sel(objs):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
sel([rig]); bpy.ops.object.mode_set(mode='POSE')
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
for side in ('Left', 'Right'):
    for b in ('UpLeg', 'Leg'):
        bpy.context.view_layer.update()
        pb = rig.pose.bones[M + side + b]
        cur = (pb.tail - pb.head).normalized()
        want = Vector((0, cur.y, cur.z)).normalized()
        q = cur.rotation_difference(want); Mp = pb.matrix.to_3x3()
        pb.rotation_quaternion = (pb.rotation_quaternion.to_matrix() @ (Mp.inverted() @ q.to_matrix() @ Mp)).to_quaternion()
bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode='OBJECT')
sel([h]); md = next(m for m in h.modifiers if m.type == 'ARMATURE'); bpy.ops.object.modifier_apply(modifier=md.name)
sel([rig]); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
am = h.modifiers.new('Armature', 'ARMATURE'); am.object = rig
sel([h])
while h.modifiers[0].name != 'Armature': bpy.ops.object.modifier_move_up(modifier='Armature')
print('legs straight', [tuple(round(c, 3) for c in rig.data.bones[M + 'Left' + b].head_local) for b in ('UpLeg', 'Leg', 'Foot')])
