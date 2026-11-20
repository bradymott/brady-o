"""The 19 body clips from tools/blender/charkit.py's clip functions, driven on the realistic armature (its own rest
matrices), plus the face poses. Hips displacement is relative to the rest Hips head."""
import bpy, sys, math, importlib
from mathutils import Vector, Matrix
sys.path.insert(0, CLIP_KIT_DIR)
import charkit; importlib.reload(charkit)
from charkit import Rig, make_clips, CLIPS, REST, M, Rx, Ry, Rz, hang, gait, gait_classic
TAU = math.tau
# ---- realistic gait: the charkit gaits with the side-to-side roll/yaw of hips and spine cut, the neck and head
# counter-rotating so the head stays level and facing forward (only the vertical bob is left)
CALM = globals().get('CALM', {'roll': 0.25, 'yaw': 0.35, 'head': 1.0})
def calm(P):
    rolls = yaws = pitch = 0.0
    for n in ('hipsR', 'spine', 'spine1', 'spine2'):
        p, r, y = getattr(P, n); r *= CALM['roll']; y *= CALM['yaw']; setattr(P, n, (p, r, y)); rolls += r; yaws += y; pitch += p
    k = CALM['head']
    np_, nr, ny = P.neck; P.neck = (np_ - pitch * 0.25 * k, nr - rolls * 0.5 * k, ny - yaws * 0.5 * k)
    hp, hr, hy = P.head; P.head = (hp - pitch * 0.25 * k, hr * 0.2 - rolls * 0.5 * k, hy * 0.2 - yaws * 0.5 * k)
def clip_walk_rb(P, t, rig):
    gait(P, t, rig, 1.0, 0.42, 0.025, 0.05, 0.38, 0.95); calm(P)
def clip_run_rb(P, t, rig):
    gait_classic(P, t, rig, 0.8, 0.75, 0.05, 0.22, 0.62, 1.4, run=True)
    P.hips = (0.0, -0.03 * rig.k + 0.035 * abs(math.cos(P.ctx['phase'])), 0.0)
    P.arm('L', flex=1.15); P.arm('R', flex=1.15)
    calm(P)
# ---- the player's action states (whole-body spin/flip/pound rotation is applied by the engine on top)
def clip_spin(P, t, rig):
    P.arms(lift=0.18, swing=0.0, inward=0.0, flex=0.12, flexout=0.0, hand=0.0)
    P.legs(thigh=0.2, knee=0.35, foot=0.1, spread=0.1); P.spine = (0.06, 0, 0); P.head = (0.04, 0, 0)
def tuck(P):
    P.legs(thigh=2.05, knee=2.35, foot=0.35, spread=0.12)
    P.arms(lift=1.25, swing=1.15, inward=0.35, flex=1.25, flexout=0.0, hand=0.2)
    P.hips = (0.0, 0.05 * rig.k, 0.0); P.spine = (0.3, 0, 0); P.spine1 = (0.2, 0, 0); P.spine2 = (0.15, 0, 0); P.neck = (0.1, 0, 0); P.head = (0.15, 0, 0)
def clip_flip(P, t, rig): tuck(P)
def clip_pound(P, t, rig): tuck(P)
def clip_bike(P, t, rig):
    ph = t / 0.6 * TAU; s, c = math.sin(ph), math.cos(ph)
    P.hips = (0.0, CFG.get('bike_hip', -0.2), 0.0); P.hipsR = (0.22, 0, 0)
    P.spine = (0.12, 0, 0); P.spine1 = (0.08, 0, 0); P.spine2 = (0.05, 0, 0); P.neck = (-0.15, 0, 0); P.head = (-0.2, 0, 0)
    P.arms(lift=0.95, swing=0.85, inward=0.12, flex=0.45, flexout=0.0, hand=0.1)
    P.leg('L', thigh=1.1 + 0.32 * s, knee=1.15 + 0.35 * s + 0.15 * c, foot=0.2 + 0.1 * c, spread=0.08)
    P.leg('R', thigh=1.1 - 0.32 * s, knee=1.15 - 0.35 * s - 0.15 * c, foot=0.2 - 0.1 * c, spread=0.08)
def clip_climb(P, t, rig):
    ph = t / 0.56 * TAU; s = math.sin(ph)
    P.arm('L', lift=-1.25 + 0.45 * s, swing=0.35, inward=0.0, flex=0.5 - 0.3 * s, flexout=0.0, hand=0.0)
    P.arm('R', lift=-1.25 - 0.45 * s, swing=0.35, inward=0.0, flex=0.5 + 0.3 * s, flexout=0.0, hand=0.0)
    P.leg('L', thigh=0.7 - 0.45 * s, knee=1.1 - 0.4 * s, foot=0.2, spread=0.1); P.leg('R', thigh=0.7 + 0.45 * s, knee=1.1 + 0.4 * s, foot=0.2, spread=0.1)
    P.spine = (0.12, 0, 0); P.head = (-0.35, 0, 0)
import charkit as _ck
_ck.LOOPS.update({'spin', 'flip', 'pound', 'bike', 'climb'})
RB_CLIPS = [(n, d, {'walk': clip_walk_rb, 'run': clip_run_rb}.get(n, f)) for n, d, f in CLIPS] + \
           [('spin', 0.45, clip_spin), ('flip', 0.42, clip_flip), ('pound', 0.5, clip_pound), ('bike', 0.6, clip_bike), ('climb', 0.56, clip_climb)]
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
acts = make_clips(rig, arm, CFG.get('clips', RB_CLIPS))
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
