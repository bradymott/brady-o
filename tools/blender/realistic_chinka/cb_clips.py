"""Realistic Chinka: the 19 clips the game plays for her (the names of today's chinka.glb and BURNS_GUIDE §6.12),
from tools/blender/charkit.py's clip functions driven on this armature's own rest matrices (as realistic Brady's
bl_clips.py does), with realistic Brady's calmer walk/run; her skirt and hair bones keyed by the secondary motion of
tools/blender/chinka.py (cape removed: this gown has none); the face joints held at rest in body clips; and the face
poses face_blink / face_jaw / face_smile. Run in the open Blender: exec(open(path).read())."""
import bpy, sys, math, importlib
from mathutils import Vector, Matrix
KIT = globals().get('CLIP_KIT_DIR', '/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender')
sys.path.insert(0, KIT)
import charkit; importlib.reload(charkit)
from charkit import Rig, make_clips, CLIPS, REST, M, Rx, Ry, Rz, gait, gait_classic, set_rot
CFG = globals().get('CLIP_CFG', {})
CALM = {'roll': 0.25, 'yaw': 0.35, 'head': 1.0}
def calm(P):
    rolls = yaws = pitch = 0.0
    for n in ('hipsR', 'spine', 'spine1', 'spine2'):
        p, r, y = getattr(P, n); r *= CALM['roll']; y *= CALM['yaw']; setattr(P, n, (p, r, y)); rolls += r; yaws += y; pitch += p
    np_, nr, ny = P.neck; P.neck = (np_ - pitch * 0.25, nr - rolls * 0.5, ny - yaws * 0.5)
    hp, hr, hy = P.head; P.head = (hp - pitch * 0.25, hr * 0.2 - rolls * 0.5, hy * 0.2 - yaws * 0.5)
def clip_walk_ck(P, t, rig):
    gait(P, t, rig, 1.0, 0.38, 0.022, 0.04, 0.34, 0.9); calm(P)
def clip_run_ck(P, t, rig):
    gait_classic(P, t, rig, 0.8, 0.62, 0.045, 0.18, 0.55, 1.3, run=True)
    P.hips = (0.0, -0.03 * rig.k + 0.032 * abs(math.cos(P.ctx['phase'])), 0.0)
    P.arm('L', flex=1.15); P.arm('R', flex=1.15)
    calm(P)
CK_CLIPS = [(n, d, {'walk': clip_walk_ck, 'run': clip_run_ck}.get(n, f)) for n, d, f in CLIPS]
arm = bpy.data.objects[globals().get('RIG', 'Armature')]
PFX = globals().get('ACT_PREFIX', '')   # the cast kit keys two armatures in one file: 'F_' / 'M_'
for act in list(bpy.data.actions):
    if not PFX or act.name.startswith(PFX): bpy.data.actions.remove(act)
if arm.animation_data:
    for tr in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(tr)
rig = Rig('chinka', height=globals().get('RIG_H', 1.68), width=0.97)
EXTRA = ['HairL1', 'HairL2', 'HairR1', 'HairR2', 'HairB1', 'HairB2', 'SkirtF1', 'SkirtF2', 'SkirtB1', 'SkirtB2', 'SkirtL1', 'SkirtL2', 'SkirtR1', 'SkirtR2']
rig.extra = [(n, arm.data.bones[M + n].parent.name[len(M):], (0, 0, 0), (0, 0.1, 0)) for n in EXTRA]
hz = arm.data.bones[M + 'Hips'].head_local.z
rig.SEG = {b.name[len(M):]: (b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones}
rig.SEG['Hips'] = (Vector((0, 0, hz)), rig.SEG['Hips'][1])
rig.hips = hz
up_old = rig.height / 1.8 * 0.95
up_new = arm.data.bones[M + 'LeftUpLeg'].head_local.z
rig.seat = rig.height / 1.8 * 0.50 - (rig.height / 1.8 * 0.98 - up_old) + (hz - up_new) + CFG.get('seat_dz', 0.0)
FACE = ('Jaw', 'LeftEyelid', 'RightEyelid', 'LeftMouth', 'RightMouth')
def secondary(arm_, f, t, P, rig_):
    for n in FACE:
        pb = arm_.pose.bones[M + n]; pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f)
    g = P.ctx.get('gait', 0); ph = P.ctx.get('phase', 0.0); fl = P.ctx.get('flutter', 0.0)
    lL = P.ctx.get('legL', P.legL['thigh']); lR = P.ctx.get('legR', P.legR['thigh'])
    seated = P.ctx.get('seated', False); lying = P.ctx.get('lying', 0.0)
    fwd = max(lL, lR, 0.0); back = max(-lL, -lR, 0.0)
    if seated or lying:
        # seated: the front panel lies over the thighs and hangs down from the knees; the sides tilt part-way and drape
        set_rot(arm_, 'SkirtF1', Rx(-fwd * 1.0), f)
        set_rot(arm_, 'SkirtF2', Rx(fwd * 0.92), f)
        set_rot(arm_, 'SkirtB1', Rx(0.05), f); set_rot(arm_, 'SkirtB2', Rx(0.0), f)
        for name, s, leg in (('SkirtL', 1, lL), ('SkirtR', -1, lR)):
            lg = max(leg, 0.0)
            set_rot(arm_, name + '1', Ry(-s * 0.06) @ Rx(-lg * 0.55), f)
            set_rot(arm_, name + '2', Rx(lg * 0.5), f)
    else:
        # standing: the front follows the forward thigh (knees never poke through), the back the trailing one
        set_rot(arm_, 'SkirtF1', Rx(-(fwd * 1.05 + 0.05 * g)), f)
        set_rot(arm_, 'SkirtF2', Rx(-(0.1 * g * math.sin(2 * ph + 0.6) + 0.2 * fl) + fwd * 0.25), f)
        set_rot(arm_, 'SkirtB1', Rx(back * 0.6 + 0.04 * g + 0.12 * fl), f)
        set_rot(arm_, 'SkirtB2', Rx(0.1 * g * math.sin(2 * ph + 1.2) + 0.16 * fl), f)
        for name, s, leg in (('SkirtL', 1, lL), ('SkirtR', -1, lR)):
            flare = 0.07 * g + 0.2 * fl
            sway = 0.1 * g * math.sin(ph) if g else 0.025 * math.sin(ph)
            set_rot(arm_, name + '1', Ry(-s * (flare + sway * s)) @ Rx(-max(leg, 0.0) * 0.45), f)
            set_rot(arm_, name + '2', Ry(-s * (0.08 * g * math.sin(2 * ph + s) + 0.12 * fl)), f)
    for name, s in (('HairL', 1), ('HairR', -1)):
        set_rot(arm_, name + '1', Ry(s * (0.05 * g * math.sin(ph) + 0.02 * math.sin(ph * 0.7))) @ Rx(0.06 * g + 0.18 * fl), f)
        set_rot(arm_, name + '2', Ry(s * (0.07 * g * math.sin(2 * ph + 0.8) + 0.12 * fl)) @ Rx(0.05 * g * math.sin(2 * ph + 2.0)), f)
    set_rot(arm_, 'HairB1', Rx(0.1 * g + 0.25 * fl + 0.03 * math.sin(2 * ph)) @ Ry(0.03 * g * math.sin(ph)), f)
    set_rot(arm_, 'HairB2', Rx(0.08 * g * math.sin(2 * ph + 1.3) + 0.2 * fl), f)
rig.secondary = secondary
acts = make_clips(rig, arm, CFG.get('clips', CK_CLIPS))
def face_action(name, fn, n=6):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    ad = arm.animation_data; ad.action = act
    if hasattr(act, 'slots') and hasattr(ad, 'action_slot'): ad.action_slot = act.slots.new(id_type='OBJECT', name=arm.name)
    for f, w in ((1, 0.0), (n, 1.0)):
        for b in FACE:
            pb = arm.pose.bones[M + b]; pb.rotation_mode = 'QUATERNION'
            R, L = fn(b, w); Mr = REST[b]
            pb.rotation_quaternion = (Mr.inverted() @ R @ Mr).to_quaternion(); pb.location = Mr.inverted() @ L
            pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f)
    act.frame_range = (1, n); ad.action = None
    tr = ad.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name
    return act
I3 = Matrix.Identity(3); Z = Vector((0, 0, 0))
blink = CFG.get('blink', 0.62); jaw = CFG.get('jaw', 0.22); sm = CFG.get('smile', (0.004, 0.0035, 0.0035))
def f_blink(b, w): return (Rx(blink * w), Z) if 'Eyelid' in b else (I3, Z)
def f_jaw(b, w):
    if b == 'Jaw': return (Rx(jaw * w), Z)
    if 'Mouth' in b: return (Rx(jaw * 0.35 * w), Vector((0, 0, -0.003 * w)))
    return (I3, Z)
def f_smile(b, w):
    if 'Mouth' in b:
        s = 1 if b.startswith('Left') else -1
        return (I3, Vector((s * sm[0] * w, sm[1] * w, sm[2] * w)))
    if b == 'Jaw': return (Rx(0.03 * w), Z)
    return (I3, Z)
face_action('face_blink', f_blink); face_action('face_jaw', f_jaw); face_action('face_smile', f_smile)
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
if PFX:
    for tr in arm.animation_data.nla_tracks:
        for st in tr.strips:
            if st.action and not st.action.name.startswith(PFX): st.action.name = PFX + st.action.name
        tr.name = PFX + tr.name if not tr.name.startswith(PFX) else tr.name
print('clips', len(acts), 'seat', round(rig.seat, 3), 'hips', round(hz, 3))
