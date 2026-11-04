# Brady as a 2D platformer sprite: the Burns-engine Brady (tools/blender/brady.py, charkit) rebuilt with stylised
# proportions, a 3/4 turn toward the camera, lifted cloth colours and a set of 2D-specific clips (an exaggerated run,
# idle, jump, fall, skid, crouch, swim, hang, die, victory, throw...). Renders frames in a candidate look.
#   LOOK=toon|paint|ink OUT=<dir> FRAMES="run:0.1,idle:0,jump:0.5" SCALE=<texels per logical px> YAW=<deg toward camera>
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/brady_sprite.py
import bpy, os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..'))
import lookkit as LK
import charkit as CK
import brady as BR
from charkit import Pose, hang, sstep, TAU, Rx, Ry, Rz, PRY, set_rot, Matrix
from mathutils import Vector

M = 'mixamorig:'
# stylised proportions: (bone, scale)
# bone scales inherit down the chain: shorter legs and torso, a big head, big hands and shoes (a platformer hero at 52 px)
LEG_S, SPINE_S = 0.82, 0.92
PROPS = [('LeftUpLeg', LEG_S), ('RightUpLeg', LEG_S), ('Spine', SPINE_S), ('Head', 1.72 / SPINE_S), ('LeftHand', 1.45 / SPINE_S), ('RightHand', 1.45 / SPINE_S),
         ('LeftFoot', 1.35), ('RightFoot', 1.35)]
# 2D sprites read better with a little more contrast in the dark outfit
RECOLOUR = {'tee_black': '#2b2a33', 'jeans': '#3a4b78', 'sneaker_black': '#1c1c22', 'hair': '#6a4526', 'hair_light': '#80572f'}

# ---------------- 2D clips (t in seconds; loops are seamless by construction) ----------------
def c_run(P, t, rig):
    # a punchy platformer run: 0.5 s cycle, big stride, deep knee lift, forward lean, pumping bent arms
    period = 0.5; ph = t * TAU / period; pl, pr = ph, ph + math.pi
    def leg(p):
        thigh = 1.05 * math.sin(p)
        swing = max(0.0, math.cos(p - 0.35)); knee = 0.15 + 1.75 * swing ** 1.4
        foot = 0.35 * max(0.0, -math.sin(p + 0.6)) - 0.2 * max(0.0, math.sin(p - 0.3))
        return thigh, knee, foot
    tl, kl, fl = leg(pl); tr, kr, fr = leg(pr)
    P.leg('L', thigh=tl, knee=kl, foot=fl); P.leg('R', thigh=tr, knee=kr, foot=fr)
    bob = 0.06 * abs(math.cos(ph))
    P.hips = (0.0, -0.04 * rig.k + bob, 0.0); P.hipsR = (0.42, 0.0, -0.08 * math.sin(ph))
    P.spine = (0.05, -0.04 * math.sin(ph), 0.03 * math.sin(ph)); P.spine1 = (0.0, -0.05 * math.sin(ph), 0.04 * math.sin(ph))
    P.spine2 = (0.12, -0.06 * math.sin(ph), 0.05 * math.sin(ph))
    P.neck = (-0.15, 0, 0); P.head = (-0.25 + 0.02 * math.cos(2 * ph), 0, -0.04 * math.sin(ph))
    hang(P, 1.0)
    P.arm('L', swing=0.3 + 0.95 * math.sin(pr), flex=1.6, inward=0.25); P.arm('R', swing=0.3 + 0.95 * math.sin(pl), flex=1.6, inward=0.25)
    P.ctx.update(gait=2, phase=ph, flutter=0.3)

def c_idle(P, t, rig):
    CK.clip_idle(P, t, rig)
    P.head = (0.0, 0, 0.0)

def c_jump(P, t, rig):
    # rising: arms up, legs tucked under (0..1 over the clip)
    k = sstep(min(1.0, t / 0.3))
    P.hips = (0, 0.0, 0); P.hipsR = (0.15, 0, 0)
    P.leg('L', thigh=1.3 * k, knee=1.7 * k, foot=0.4); P.leg('R', thigh=-0.3 * k, knee=1.1 * k, foot=0.6)
    P.spine1 = (0.05, 0, 0); P.head = (-0.2, 0, 0)
    hang(P, 1.1 - 1.9 * k, 0.3); P.arm('L', swing=0.2, flex=0.4); P.arm('R', swing=0.0, flex=0.3)
    P.ctx.update(gait=0, phase=0.0, flutter=1.0)

def c_fall(P, t, rig):
    w = math.sin(t * 14) * 0.12
    P.hipsR = (-0.05, 0, 0); P.leg('L', thigh=0.5, knee=0.3, foot=0.5); P.leg('R', thigh=-0.2, knee=0.6, foot=0.5)
    P.head = (-0.1, 0, 0); hang(P, 0.3 + w, 0.4); P.arms(swing=0.2, flexout=0.5)
    P.ctx.update(gait=0, phase=0.0, flutter=1.0)

def c_skid(P, t, rig):
    P.hips = (0, -0.06, 0); P.hipsR = (-0.35, 0, 0)
    P.leg('L', thigh=0.8, knee=0.5, foot=-0.3); P.leg('R', thigh=0.2, knee=0.2, foot=0.0)
    P.spine1 = (-0.1, 0, 0); P.head = (0.15, 0, 0)
    hang(P, 0.9, 0.9); P.arm('L', swing=-0.8); P.arm('R', swing=0.9)
    P.ctx.update(gait=0, phase=0.0, flutter=0.6)

def c_crouch(P, t, rig):
    P.hips = (0, -0.42 * rig.k, 0); P.hipsR = (0.45, 0, 0)
    P.legs(thigh=1.6, knee=2.3, foot=0.0, spread=0.15); P.spine1 = (0.2, 0, 0); P.spine2 = (0.15, 0, 0); P.head = (-0.4, 0, 0)
    hang(P, 1.0, 0.9); P.arms(swing=0.4)
    P.ctx.update(gait=0, phase=0.0)

def c_swim(P, t, rig):
    s = math.sin(t * TAU / 0.9)
    P.hipsR = (1.1, 0, 0); P.hips = (0, -0.5, 0)
    P.leg('L', thigh=0.3 + 0.35 * s, knee=0.4); P.leg('R', thigh=0.3 - 0.35 * s, knee=0.4)
    P.head = (-0.6, 0, 0); P.spine1 = (-0.1, 0, 0)
    hang(P, -0.4, 0.2); P.arm('L', swing=0.4 + 0.6 * s, inward=0.3); P.arm('R', swing=0.4 - 0.6 * s, inward=0.3)
    P.ctx.update(gait=0, phase=t * TAU)

def c_hang(P, t, rig):
    P.leg('L', thigh=0.2, knee=0.3); P.leg('R', thigh=-0.1, knee=0.2)
    hang(P, -1.45, 0.1); P.arms(swing=0.0, inward=0.1); P.head = (-0.15, 0, 0)
    P.ctx.update(gait=0, phase=0.0)

def c_die(P, t, rig):
    P.hipsR = (-0.2, 0, 0); P.legs(thigh=0.3, knee=0.2, spread=0.2); P.head = (-0.35, 0, 0.15)
    hang(P, -1.0, 0.2); P.arms(swing=0.3, flexout=0.6)
    P.ctx.update(gait=0, phase=0.0, flutter=1.0)

def c_victory(P, t, rig):
    k = sstep(min(1.0, t / 0.35)); b = abs(math.sin(t * TAU / 0.5))
    P.hips = (0, 0.05 * b, 0); P.hipsR = (-0.1 * k, 0, 0)
    P.legs(thigh=0.05, knee=0.1 + 0.2 * b); P.head = (-0.25 * k, 0, 0.1 * k)
    hang(P, 1.1 - 2.5 * k, 0.35); P.arm('L', swing=0.3 * k, inward=-0.2); P.arm('R', swing=0.0, flex=0.2)
    P.ctx.update(gait=0, phase=t * TAU, flutter=b)

def c_throw(P, t, rig):
    k = sstep(min(1.0, t / 0.2))
    P.hipsR = (0.25, 0, -0.1); P.leg('L', thigh=0.6, knee=0.5); P.leg('R', thigh=-0.3, knee=0.3)
    P.spine2 = (0.1, 0, -0.2 + 0.3 * k); P.head = (-0.2, 0, 0)
    hang(P, 1.0, 0.3); P.arm('L', swing=-1.3 + 2.4 * k, flex=1.2 - 0.9 * k, inward=0.2); P.arm('R', swing=0.4, flex=1.3)
    P.ctx.update(gait=0, phase=0.0, flutter=0.5)

def c_ride(P, t, rig):
    CK.seated(P, rig, lean=0.1, knee=1.3); P.head = (-0.1, 0, 0)
    hang(P, 0.9, 0.9); P.arms(swing=0.5)
    P.ctx.update(gait=0, phase=t * TAU, seated=True)

def c_fly(P, t, rig):
    P.hipsR = (0.9, 0, 0); P.hips = (0, -0.3, 0); P.legs(thigh=-0.1, knee=0.2, foot=0.5); P.head = (-0.5, 0, 0)
    hang(P, -1.3, 0.1); P.arm('L', swing=0.1); P.arm('R', swing=0.6, flex=0.4)
    P.ctx.update(gait=0, phase=t * TAU, flutter=1.0)

CLIPS2D = [('run', 0.5, c_run), ('idle', 2.5, c_idle), ('jump', 0.5, c_jump), ('fall', 0.6, c_fall), ('skid', 0.3, c_skid),
           ('crouch', 0.3, c_crouch), ('swim', 0.9, c_swim), ('hang', 0.3, c_hang), ('die', 0.4, c_die),
           ('victory', 1.0, c_victory), ('throw', 0.4, c_throw), ('ride', 1.0, c_ride), ('fly', 1.0, c_fly)]
LOOPS2D = {'run', 'idle', 'swim', 'ride', 'fly', 'victory'}

def build(yaw_deg=28.0):
    """Build Brady with the 2D clip set. Returns (rig, arm, mesh)."""
    CK.clear_scene()
    CK.MATS.clear()
    rig = CK.Rig('brady', height=1.85, width=0.98)
    rig.extra_bones([('Bun', 'Head', (0, 1.75 * BR.K, -0.07 * BR.K), (0, 1.81 * BR.K, -0.1 * BR.K))])
    rig.secondary = BR.secondary
    BR.build_brady(rig)
    for name, col in RECOLOUR.items():
        m = CK.MATS.get(name)
        if m:
            n = next(nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED')
            n.inputs['Base Color'].default_value = (*CK.srgb_lin(col), 1)
    arm = CK.make_armature(rig); mesh = CK.make_mesh(rig, arm)
    CK.LOOPS.update(LOOPS2D)
    CK.make_clips(rig, arm, CLIPS2D)
    # face screen-right (+X), turned `yaw_deg` toward the camera (-Y) so the face and both limbs read
    arm.rotation_euler = (0, 0, math.radians(90 - yaw_deg))
    for bone, s in PROPS:
        pb = arm.pose.bones.get(M + bone)
        if pb: pb.scale = (s, s, s)
    arm.location.z = -(rig.hips - 0.0) * (1 - LEG_S)     # shorter legs: bring the feet back down to the ground
    return rig, arm, mesh

def set_pose(arm, clip, t_frac):
    """Pose from clip `clip` at fraction t_frac (0..1) of its length."""
    ad = arm.animation_data
    for tr in ad.nla_tracks: tr.mute = True
    act = bpy.data.actions[clip]; ad.action = act
    if hasattr(act, 'slots') and hasattr(ad, 'action_slot'): ad.action_slot = act.slots[0]
    f0, f1 = act.frame_range
    bpy.context.scene.frame_set(int(round(f0 + (f1 - f0) * t_frac)))

BOX_W, BOX_H, FOOT = 2.3, 2.6, 0.12       # metres framed around Brady; origin = feet centre, FOOT m above the bottom

def frame_camera(scale):
    px_m = LK.PPM * scale
    res_w, res_h = int(round(BOX_W * px_m)), int(round(BOX_H * px_m))
    LK.ortho_camera(0.0, BOX_H / 2 - FOOT, BOX_W, BOX_H, res_w, res_h)
    return px_m, res_w, res_h

def main():
    look = os.environ.get('LOOK', 'toon'); out = os.environ.get('OUT', '/tmp/brady_sprite')
    frames = [f.split(':') for f in os.environ.get('FRAMES', 'run:0.1').split(',')]
    scale = float(os.environ.get('SCALE', LK.TEX)); yaw = float(os.environ.get('YAW', '28'))
    rig, arm, mesh = build(yaw)
    LK.setup_render('BLENDER_EEVEE', samples=int(os.environ.get('SAMPLES', '32')))
    LK.apply_look(look, [mesh], outline_px=float(os.environ.get('OUTLINE', '0.8')))
    LK.lights(look, key_dir=(0.35, -0.75, 0.9))
    px_m, res_w, res_h = frame_camera(scale)
    meta = {'look': look, 'scale': scale, 'px_per_m': px_m, 'box': [BOX_W, BOX_H], 'origin': [res_w / 2, res_h - FOOT * px_m], 'frames': {}}
    for clip, fr in frames:
        set_pose(arm, clip, float(fr))
        name = f'brady_{clip}_{int(round(float(fr) * 100)):03d}'
        p = LK.render(os.path.join(out, name + '.png'))
        meta['frames'][name] = {'clip': clip, 't': float(fr)}
        print('RENDERED', p)
    with open(os.path.join(out, 'brady_meta.json'), 'w') as f: json.dump(meta, f, indent=1)

if __name__ == '__main__':
    try: main()
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
