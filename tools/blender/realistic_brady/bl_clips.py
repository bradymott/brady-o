"""The 19 body clips from tools/blender/charkit.py's clip functions, driven on the realistic armature (its own rest
matrices), plus the face poses. Hips displacement is relative to the rest Hips head."""
import bpy, sys, math, importlib
from mathutils import Vector, Matrix
sys.path.insert(0, CLIP_KIT_DIR)
import charkit; importlib.reload(charkit)
from charkit import Rig, make_clips, CLIPS, REST, M, Rx, Ry, Rz
arm = bpy.data.objects['Armature']
CFG = globals().get('CLIP_CFG', {})
for act in list(bpy.data.actions): bpy.data.actions.remove(act)
if arm.animation_data:
    for tr in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(tr)
rig = Rig('brady', height=1.85, width=0.98)
hz = arm.data.bones[M + 'Hips'].head_local.z
rig.SEG = {b.name[len(M):]: (b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones}
rig.SEG['Hips'] = (Vector((0, 0, hz)), rig.SEG['Hips'][1])
rig.hips = hz
up_old = rig.height / 1.8 * 0.95              # old rig's hip-joint (UpLeg) height
up_new = arm.data.bones[M + 'LeftUpLeg'].head_local.z
rig.seat = rig.height / 1.8 * 0.50 - (rig.height / 1.8 * 0.98 - up_old) + (hz - up_new) + CFG.get('seat_dz', 0.0)
FACE = ('Jaw', 'LeftEyelid', 'RightEyelid', 'LeftMouth', 'RightMouth')
def face_rest(arm_, f, t, P, rig_):
    for n in FACE:
        pb = arm_.pose.bones[M + n]; pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f)
    # talk: a little jaw chatter so the dialogue clip has a moving mouth
    if CFG.get('talk_jaw', True) and P.ctx.get('talk'):
        pass
rig.secondary = face_rest
acts = make_clips(rig, arm, CFG.get('clips'))
# face poses: frame 1 rest, last frame posed, only face joints
def face_action(name, fn, n=6):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    ad = arm.animation_data; ad.action = act
    if hasattr(act, 'slots') and hasattr(ad, 'action_slot'):
        ad.action_slot = act.slots.new(id_type='OBJECT', name=arm.name)
    for f, w in ((1, 0.0), (n, 1.0)):
        for b in FACE:
            pb = arm.pose.bones[M + b]; pb.rotation_mode = 'QUATERNION'
            R, L = fn(b, w)
            Mr = REST[b]
            pb.rotation_quaternion = (Mr.inverted() @ R @ Mr).to_quaternion()
            pb.location = Mr.inverted() @ L
            pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f)
    act.frame_range = (1, n)
    ad.action = None
    tr = ad.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name
    return act
I3 = Matrix.Identity(3); Z = Vector((0, 0, 0))
blink = CFG.get('blink', 0.62); jaw = CFG.get('jaw', 0.30); sm = CFG.get('smile', (0.0045, 0.004, 0.0035))
def f_blink(b, w): return (Rx(blink * w), Z) if 'Eyelid' in b else (I3, Z)
def f_jaw(b, w):
    if b == 'Jaw': return (Rx(jaw * w), Z)
    if 'Mouth' in b: return (Rx(jaw * 0.35 * w), Vector((0, 0, -0.004 * w)))
    return (I3, Z)
def f_smile(b, w):
    if 'Mouth' in b:
        s = 1 if b.startswith('Left') else -1
        return (I3, Vector((s * sm[0] * w, sm[1] * w, sm[2] * w)))     # out, back (+y is back in Blender), up
    if b == 'Jaw': return (Rx(0.03 * w), Z)
    return (I3, Z)
face_action('face_blink', f_blink); face_action('face_jaw', f_jaw); face_action('face_smile', f_smile)
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
print('clips', len(acts), 'seat', round(rig.seat, 3), 'hips', round(hz, 3))
