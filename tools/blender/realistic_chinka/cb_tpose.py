"""Realistic Chinka, step 2 (after the MPFB human 'Chinka_Body' with likeness targets and the MPFB 'mixamo' rig):
fold finger weights into the hands and delete the finger bones, bake the targets, straighten the arms into the T-pose
realistic Brady uses (arm chain along +-X at shoulder height, so charkit's clips drive both rigs the same way), apply
it as the rest pose. Run in the open Blender: exec(open(path).read())."""
import bpy, sys
from mathutils import Vector, Matrix
mods = {m.split('.')[-1]: sys.modules[m] for m in sys.modules if m.startswith('bl_ext.user_default.mpfb.')}
TS = mods['targetservice'].TargetService
h = bpy.data.objects[globals().get('BODY', 'Chinka_Body')]
rig = h.parent if h.parent and h.parent.type == 'ARMATURE' else next(o for o in bpy.data.objects if o.type == 'ARMATURE')
rig.name = globals().get('RIG', 'Armature'); rig.data.name = rig.name
M = 'mixamorig:'
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]

# ---- fingers -> hands
for side in ('Left', 'Right'):
    hand = h.vertex_groups.get(M + side + 'Hand') or h.vertex_groups.new(name=M + side + 'Hand')
    fingers = [vg for vg in h.vertex_groups if vg.name.startswith(M + side + 'Hand') and vg.name != M + side + 'Hand']
    fi = {vg.index for vg in fingers}
    for v in h.data.vertices:
        w = sum(g.weight for g in v.groups if g.group in fi)
        if w > 0:
            cur = next((g.weight for g in v.groups if g.group == hand.index), 0.0)
            hand.add([v.index], min(1.0, cur + w), 'REPLACE')
    for vg in fingers: h.vertex_groups.remove(vg)
sel([rig]); bpy.ops.object.mode_set(mode='EDIT')
for eb in list(rig.data.edit_bones):
    n = eb.name[len(M):] if eb.name.startswith(M) else eb.name
    if n.startswith(('LeftHand', 'RightHand')) and n not in ('LeftHand', 'RightHand'): rig.data.edit_bones.remove(eb)
bpy.ops.object.mode_set(mode='OBJECT')

# ---- bake the MPFB targets into the mesh
sel([h]); TS.bake_targets(h)
if h.data.shape_keys: print('WARN shape keys left', len(h.data.shape_keys.key_blocks))

# ---- T-pose: rotate each arm bone so its chain lies along +-X (pose space), then apply as rest
sel([rig]); bpy.ops.object.mode_set(mode='POSE')
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
bpy.context.view_layer.update()
for side, sx in (('Left', 1), ('Right', -1)):
    for b in ('Arm', 'ForeArm', 'Hand'):
        pb = rig.pose.bones[M + side + b]
        bpy.context.view_layer.update()
        cur = (pb.tail - pb.head).normalized()          # armature space, current pose
        want = Vector((sx, 0, 0))
        q = cur.rotation_difference(want)                # armature-space rotation
        # convert to the bone's local rotation: R_local = (M_pose^-1) q (M_pose) applied on top of the current
        Mp = pb.matrix.to_3x3()
        R = Mp.inverted() @ q.to_matrix() @ Mp
        pb.rotation_quaternion = (pb.rotation_quaternion.to_matrix() @ R).to_quaternion()
bpy.context.view_layer.update()
for side in ('Left', 'Right'):
    print(side, [tuple(round(c, 3) for c in rig.pose.bones[M + side + b].head) for b in ('Arm', 'ForeArm', 'Hand')])
bpy.ops.object.mode_set(mode='OBJECT')
# apply the pose to the mesh (armature modifier) and as the armature's rest
sel([h])
md = next(m for m in h.modifiers if m.type == 'ARMATURE')
bpy.ops.object.modifier_apply(modifier=md.name)
sel([rig]); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
am = h.modifiers.new('Armature', 'ARMATURE'); am.object = rig
bpy.ops.object.modifier_move_to_index if False else None
print('bones', len(rig.data.bones), [b.name for b in rig.data.bones])
