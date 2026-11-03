# Brady: the owner's likeness as a rigged, animated glTF character for the Burns engine (BurnsSkin, docs/BURNS_GUIDE.md
# §6.9), built on tools/blender/charkit.py. Long wavy medium-brown hair tied in a loose high bun with curls escaping at
# the temples and nape, a high forehead receding at the temples, a longer face with a strong jaw and chin, a prominent
# straight nose, a wide toothy grin, a short stubble goatee with a light beard shadow, round-rectangular dark shades,
# black tee, jeans, black sneakers, and blackwork mandala medallions on both upper arms (per-face ink on the arm skin;
# the forearms are bare but for a thin elbow band). Lean athletic build, 1.85 m, fair skin with a tan.
# Mixamo bone names (25) plus one `Bun` bone for the hair's secondary motion; the 19 clips come from charkit.CLIPS.
#
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/brady.py
# Writes assets/models/shared/brady.glb and assets/blender/brady.blend. CHAR_PREVIEWS=<dir> also renders EEVEE
# previews there (rest, idle, walk, dance), for checking the look without the engine.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from charkit import *

K = 1.85 / 1.8          # authored at the mannequin's 1.8 m and scaled up
SK = Matrix.Scale(K, 4)
ARM_Y = 1.43            # the T-pose arm axis height

def mandala(t, ang, c, L=0.2, r=0.058):
    """A blackwork medallion on the outer side of an upper arm, centred on the skin the tee sleeve leaves bare (the
    sleeve's rounded end covers t < 0.47; the elbow is t = 1): a bold disc with a clear centre and six spokes, an outer
    ring and a dotted halo, measured in metres over the arm surface so it reads at the mesh's ~1.5 cm faces."""
    # polar position on the arm surface: the outer (lateral) side is +y in the T-pose, which hangs outward
    phi = math.atan2(c[2], c[1] - ARM_Y)                  # 0 = outer side, pi = inner
    u = (t - 0.73) * L; v = r * phi
    d = math.hypot(u, v); th = math.atan2(v, u)
    if d < 0.009: return 0                                    # clear centre
    if d < 0.036: return 1                                    # the solid disc
    if 0.042 < d < 0.05: return 1                             # outer ring
    if 0.056 < d < 0.066 and math.cos(10 * th) > 0.3: return 1   # dotted halo
    return 0

def elbow_band(t, ang, c):
    return 1 if 0.03 < t < 0.07 else 0

def curl(rig, name, s, x, y0, z0, turns, drop, rad, mats, bones, soft=0.6, phase=0.0):
    """A corkscrew lock of hair: a helix of radius rad descending `drop` metres with `turns` turns, as a tube."""
    pts = []; n = 8
    for i in range(n):
        v = i / (n - 1); a = phase + v * TAU * turns
        pts.append((x + s * rad * math.sin(a) * 1.2, y0 - drop * v, z0 + rad * math.cos(a)))
    rig.part(name, bm_tube(catmull(pts, 9), [0.008, 0.0105, 0.0105, 0.01, 0.0095, 0.0085, 0.007, 0.005, 0.0], 4, caps='fan'), mats, bones, soft)

def build_brady(rig):
    skin = mat('skin', '#e0ac86', rough=0.72); ink = mat('ink', '#1c1a22', rough=0.78)
    shadow = mat('beard_shadow', '#d6a27f', rough=0.8); stubble = mat('stubble', '#d2a07a', rough=0.85); lipshadow = mat('lip_shadow', '#d8a67f', rough=0.85)
    lip = mat('lip', '#b4746a', rough=0.7); teeth = mat('teeth', '#f4f1ea', rough=0.4)
    tee = mat('tee_black', '#1b1a20', rough=0.9); jeans = mat('jeans', '#2b3758', rough=0.85)
    shoe = mat('sneaker_black', '#141418', rough=0.6); sole = mat('sneaker_sole', '#d8d4cc', rough=0.7)
    hair = mat('hair', '#5b3b22', rough=0.55); hair_hi = mat('hair_light', '#6e4a2c', rough=0.55)
    shades = mat('sunglasses', '#0b0b10', rough=0.2, coat=1.0); brow = mat('brow', '#3a2414', rough=0.8); tie = mat('hair_tie', '#2a2a2e', rough=0.8)
    L, Rr = 'Left', 'Right'
    def part(name, bm, mats, bones, soft=1.0, wfn=None):
        bm_xf(bm, SK); rig.part(name, bm, mats, bones, soft, wfn)
    # lean torso (tee), belly, hips (jeans)
    part('chest', rbox((0, 1.28, 0), (0.4, 0.38, 0.215), 0.1, 4, taper=(0.72, 0.85)), tee, ['Spine1', 'Spine2', 'Spine', 'Hips', L + 'Shoulder', Rr + 'Shoulder'], 1.3)
    part('belly', rbox((0, 1.06, -0.005), (0.28, 0.17, 0.185), 0.07, 3), tee, ['Spine', 'Hips', 'Spine1'], 1.3)
    part('hips', rbox((0, 0.93, 0), (0.3, 0.22, 0.205), 0.08, 3), jeans, ['Hips', L + 'UpLeg', Rr + 'UpLeg', 'Spine'], 1.2)
    part('belt', bm_torus(0.155, 0.013, 24, 6, AY, (0, 1.0, 0), sy=0.68), mat('belt', '#2a1d14', rough=0.7), ['Hips', 'Spine'], 1.2)
    # neck and a longer head with a strong jaw and chin
    part('neck', capsule((0, 1.45, -0.01), (0, 1.58, -0.01), 0.054, None, 14, 3, 2), skin, ['Neck', 'Spine2', 'Head'])
    part('head', ellipsoid((0, 1.68, -0.012), 0.088, 0.128, 0.105, 20, 12), skin, ['Head', 'Neck'], 0.6)
    part('jaw', ellipsoid((0, 1.625, 0.004), 0.085, 0.098, 0.102, 20, 9, math.pi * 0.4, math.pi), skin, ['Head', 'Neck'], 0.6)
    for s in (1, -1):
        part('ear%d' % s, ellipsoid((s * 0.09, 1.675, -0.015), 0.014, 0.028, 0.02, 10, 6), skin, ['Head'], 0.6)
    # the nose: prominent and straight, a long bridge down to a rounded tip well in front of the face
    part('nose_bridge', capsule((0, 1.712, 0.09), (0, 1.66, 0.114), 0.011, 0.016, 14, 3, 3), skin, ['Head'], 0.6)
    part('nose_tip', ellipsoid((0, 1.657, 0.117), 0.019, 0.016, 0.017, 16, 9), skin, ['Head'], 0.6)
    for s in (1, -1):
        part('nostril%d' % s, ellipsoid((s * 0.016, 1.652, 0.107), 0.011, 0.008, 0.012, 10, 6), skin, ['Head'], 0.6)
    # a wide toothy grin: two thin lip arcs, teeth between, laugh lines at the corners, a stubble goatee around it
    part('goatee_chin', ellipsoid((0, 1.574, 0.082), 0.03, 0.017, 0.016, 10, 5), stubble, ['Head'], 0.6)   # flush with the chin: a tone, not a bump
    part('lip_up', bm_torus(0.029, 0.0038, 16, 5, AZ, (0, 1.619, 0.102), sweep=(math.pi * 1.04, math.pi * 1.96), sy=0.45), lip, ['Head'], 0.6)
    part('lip_lo', bm_torus(0.027, 0.0042, 16, 5, AZ, (0, 1.609, 0.102), sweep=(math.pi * 1.06, math.pi * 1.94), sy=0.5), lip, ['Head'], 0.6)
    part('teeth', bm_box(0.036, 0.0075, 0.005, (0, 1.61, 0.103)), teeth, ['Head'], 0.6)
    for s in (1, -1):
        part('laugh%d' % s, bm_torus(0.018, 0.002, 10, 4, AZ, (s * 0.05, 1.63, 0.086), sweep=(math.pi * (1.0 if s > 0 else 0.0), math.pi * (1.5 if s > 0 else 0.5))), shadow, ['Head'], 0.6)
    # brows above round-rectangular shades
    for s in (1, -1):
        part('brow%d' % s, bm_xf(rbox((s * 0.043, 1.727, 0.09), (0.056, 0.011, 0.014), 0.005, 2), tilt((s * 0.043, 1.728, 0.09), 0.0, -0.25, s * -0.15)), brow, ['Head'], 0.6)
        part('lens%d' % s, rbox((s * 0.044, 1.69, 0.101), (0.064, 0.042, 0.02), 0.017, 3), shades, ['Head'], 0.6)
        part('temple%d' % s, rbox((s * 0.092, 1.694, 0.02), (0.011, 0.012, 0.14), 0.004, 1), shades, ['Head'], 0.6)
    part('bridge', rbox((0, 1.697, 0.106), (0.03, 0.011, 0.011), 0.004, 1), shades, ['Head'], 0.6)
    # hair: a high cap (the hairline recedes at the temples, a peak in the middle), side sheets, a loose high bun, curls
    part('hair', ellipsoid((0, 1.752, -0.035), 0.1, 0.082, 0.13, 20, 7, 0.0, math.pi * 0.5), hair, ['Head'], 0.6)
    part('hair_peak', ellipsoid((0, 1.742, 0.07), 0.034, 0.022, 0.035, 12, 6), hair, ['Head'], 0.6)
    part('hair_back', hair_sheet((0, 1.752, -0.03), 0.1, 0.13, 1.752, 1.6, 0.24, 0.024, 5, 12, flare=0.0, wave=0.012), hair, ['Head', 'Neck'], 0.6)
    part('bun', ellipsoid((0, 1.8, -0.088), 0.064, 0.054, 0.06, 14, 8), hair_hi, ['Bun', 'Head'], 0.5)
    part('bun_wisp', ellipsoid((0.025, 1.835, -0.08), 0.036, 0.024, 0.034, 8, 5), hair, ['Bun', 'Head'], 0.5)
    part('bun_wisp2', ellipsoid((-0.03, 1.79, -0.12), 0.03, 0.022, 0.03, 8, 5), hair, ['Bun', 'Head'], 0.5)
    part('bun_tie', bm_torus(0.034, 0.007, 14, 5, aim((0, 0.5, -1)), (0, 1.766, -0.06)), tie, ['Bun', 'Head'], 0.5)
    for side, s in ((L, 1), (Rr, -1)):
        # short sleeve (tee), the mandala upper arm, a bare forearm, hand
        part(side + '_deltoid', ellipsoid((s * 0.185, 1.44, 0), 0.075, 0.07, 0.07, 12, 7), tee, [side + 'Shoulder', side + 'Arm', 'Spine2'])
        part(side + '_sleeve', capsule((s * 0.2, ARM_Y, 0), (s * 0.3, ARM_Y, 0), 0.068, 0.062, 12, 4, 2), tee, [side + 'Arm', side + 'Shoulder', side + 'ForeArm', 'Spine2'])
        bm, _ = limb((s * 0.265, ARM_Y, 0), (s * 0.465, ARM_Y, 0), 0.06, 0.052, 24, 3, 16, mandala)
        part(side + '_arm', bm, [skin, ink], [side + 'Arm', side + 'ForeArm', side + 'Shoulder'])
        bm, _ = limb((s * 0.455, ARM_Y, 0), (s * 0.725, ARM_Y, 0), 0.053, 0.042, 10, 3, 6, elbow_band)
        part(side + '_forearm', bm, [skin, ink], [side + 'ForeArm', side + 'Hand', side + 'Arm'])
        part(side + '_hand', rbox((s * 0.795, 1.425, 0), (0.165, 0.09, 0.045), 0.02, 2), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        part(side + '_thumb', capsule((s * 0.75, 1.425, 0.03), (s * 0.79, 1.425, 0.065), 0.016, 0.013, 10, 3, 2), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        # thigh, shin (jeans), black sneaker, pale sole
        part(side + '_thigh', capsule((s * 0.1, 0.93, 0), (s * 0.1, 0.5, 0), 0.08, 0.064, 12, 4, 3), jeans, [side + 'UpLeg', side + 'Leg', 'Hips'])
        part(side + '_shin', capsule((s * 0.1, 0.51, 0), (s * 0.1, 0.1, 0), 0.062, 0.052, 12, 4, 3), jeans, [side + 'Leg', side + 'Foot', side + 'UpLeg'])
        part(side + '_shoe', rbox((s * 0.105, 0.065, 0.075), (0.12, 0.09, 0.3), 0.03, 3), shoe, [side + 'Foot', side + 'ToeBase', side + 'Leg'], 0.8)
        part(side + '_sole', rbox((s * 0.105, 0.018, 0.075), (0.125, 0.035, 0.31), 0.012, 2), sole, [side + 'Foot', side + 'ToeBase'], 0.8)
        part(side + '_lace', rbox((s * 0.105, 0.105, 0.12), (0.06, 0.012, 0.09), 0.004, 1), sole, [side + 'Foot', side + 'ToeBase'], 0.8)

def secondary(arm, f, t, P, rig):
    """The bun bobs with the gait and flutters on jumps and hits."""
    g = P.ctx.get('gait', 0); ph = P.ctx.get('phase', 0.0); fl = P.ctx.get('flutter', 0.0)
    amp = 0.1 * g + 0.25 * fl + 0.03
    set_rot(arm, 'Bun', Rx(-amp * math.sin(2 * ph + 0.5)) @ Ry(0.5 * amp * math.sin(ph)), f)

def main():
    clear_scene()
    rig = Rig('brady', height=1.85, width=0.98)
    rig.extra_bones([('Bun', 'Head', (0, 1.75 * K, -0.07 * K), (0, 1.81 * K, -0.1 * K))])
    rig.secondary = secondary
    build_brady(rig)
    pv = os.environ.get('CHAR_PREVIEWS'); previews = []
    if pv:
        os.makedirs(pv, exist_ok=True)
        previews = [(os.path.join(pv, 'brady_rest.png'), None, 1, (0.4, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_face.png'), 'idle', 10, (0.5, -1, 0.25), 0.33, (0, -0.02, 1.66 * K)),
                    (os.path.join(pv, 'brady_side.png'), 'idle', 10, (1, -0.2, 0.2), 0.33, (0, -0.02, 1.66 * K)),
                    (os.path.join(pv, 'brady_walk.png'), 'walk', 8, (0.6, -1, 0.2), 1.0, None),
                    (os.path.join(pv, 'brady_dance.png'), 'dance', 14, (0.3, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_drive.png'), 'drive', 10, (0.0, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_sleep.png'), 'sleep', 10, (1.0, -0.6, 0.35), 1.0, None),
                    (os.path.join(pv, 'brady_captive.png'), 'captive', 20, (-0.3, 1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_photo.png'), 'photo', 12, (0.0, -1, 0.1), 1.0, None),
                    (os.path.join(pv, 'brady_arm.png'), 'idle', 10, (1, -0.25, 0.1), 0.3, (0.27 * K, 0, 1.15 * K))]
    out = os.environ.get('CHAR_OUT') or os.path.join(MODELS, 'brady.glb')
    blend = os.environ.get('CHAR_BLEND') or os.path.join(BLEND_DIR, 'brady.blend')
    build(rig, out, blend, previews)

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; traceback.print_exc(); sys.exit(1)
