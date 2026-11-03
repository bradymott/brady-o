# Brady: the owner's likeness as a rigged, animated glTF character for the Burns engine (BurnsSkin, docs/BURNS_GUIDE.md
# §6.9), built on tools/blender/charkit.py. Long hair in a man bun with a few loose strands, a big friendly nose, stubble,
# dark square sunglasses, black tee, jeans, black sneakers and blackwork geometric sleeve tattoos on both arms (per-face
# ink on the arm skin: bands, chevrons, triangles and dotwork from shoulder to wrist). Athletic-average build, 1.8 m.
# Mixamo bone names (25) plus one `Bun` bone for the hair's secondary motion; the 19 clips come from charkit.CLIPS.
#
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/brady.py
# Writes assets/models/shared/brady.glb and assets/blender/brady.blend. CHAR_PREVIEWS=<dir> also renders EEVEE
# previews there (rest, idle, walk, dance), for checking the look without the engine.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from charkit import *

def pattern_upper(t, ang):
    """Blackwork sleeve, shoulder (t = 0) to elbow (t = 1): a shoulder band, a zigzag chevron band, hanging triangles,
    a thin band and a row of dots. Coarse on purpose: it has to read at 3 m on 18 x 12 faces."""
    u = ang / TAU
    if 0.03 < t < 0.14: return 1                                             # shoulder band
    if 0.2 < t < 0.5:                                                        # one bold zigzag around the arm
        tri = abs(((u * 3) % 1.0) - 0.5) * 2
        return 1 if abs((t - 0.2) / 0.3 - (0.25 + tri * 0.5)) < 0.2 else 0
    if 0.55 < t < 0.75:                                                      # triangles pointing to the elbow
        k = (u * 6) % 1.0; w = 1 - (t - 0.55) / 0.2
        return 1 if abs(k - 0.5) * 2 < w else 0
    if 0.8 < t < 0.86: return 1                                              # thin band
    if 0.9 < t < 0.97: return 1 if int(u * 9) % 2 == 0 else 0                # dots
    return 0

def pattern_fore(t, ang):
    """Elbow (t = 0) to wrist (t = 1): an elbow band, triangles pointing up, a zigzag, a double wrist band."""
    u = ang / TAU
    if 0.03 < t < 0.1: return 1
    if 0.15 < t < 0.37:
        k = (u * 6) % 1.0; w = (t - 0.15) / 0.22
        return 1 if abs(k - 0.5) * 2 < w else 0
    if 0.42 < t < 0.7:
        tri = abs(((u * 3) % 1.0) - 0.5) * 2
        return 1 if abs((t - 0.42) / 0.28 - (0.25 + tri * 0.5)) < 0.2 else 0
    if 0.75 < t < 0.8: return 1
    if 0.85 < t < 0.93: return 1 if int(u * 9) % 2 == 0 else 0
    if 0.95 < t < 1.0: return 1
    return 0

def build_brady(rig):
    skin = mat('skin', '#d9a07a', rough=0.75); ink = mat('ink', '#1c1a22', rough=0.78)
    stubble = mat('stubble', '#a97d60', rough=0.82); lip = mat('lip', '#a86a5a', rough=0.7)
    tee = mat('tee_black', '#1b1a20', rough=0.9); jeans = mat('jeans', '#2b3758', rough=0.85)
    shoe = mat('sneaker_black', '#141418', rough=0.6); sole = mat('sneaker_sole', '#d8d4cc', rough=0.7)
    hair = mat('hair', '#2a1a12', rough=0.65); shades = mat('sunglasses', '#0b0b10', rough=0.2, coat=1.0)
    brow = mat('brow', '#231409', rough=0.8); tie = mat('hair_tie', '#3a2a22', rough=0.8)
    L, Rr = 'Left', 'Right'
    # torso (tee), belly, hips (jeans)
    rig.part('chest', rbox((0, 1.27, 0), (0.41, 0.40, 0.245), 0.09, 4, taper=(0.9, 0.9)), tee, ['Spine1', 'Spine2', 'Spine', 'Hips', L + 'Shoulder', Rr + 'Shoulder'], 1.3)
    rig.part('belly', rbox((0, 1.05, -0.005), (0.36, 0.18, 0.23), 0.07, 3), tee, ['Spine', 'Hips', 'Spine1'], 1.3)
    rig.part('hips', rbox((0, 0.93, 0), (0.36, 0.22, 0.24), 0.08, 3), jeans, ['Hips', L + 'UpLeg', Rr + 'UpLeg', 'Spine'], 1.2)
    rig.part('belt', bm_torus(0.185, 0.014, 24, 6, AY, (0, 1.0, 0), sy=0.68), mat('belt', '#2a1d14', rough=0.7), ['Hips', 'Spine'], 1.2)
    # neck and head
    rig.part('neck', capsule((0, 1.45, -0.01), (0, 1.58, -0.01), 0.056, None, 14, 3, 2), skin, ['Neck', 'Spine2', 'Head'])
    rig.part('head', ellipsoid((0, 1.675, -0.01), 0.095, 0.12, 0.11, 22, 14), skin, ['Head', 'Neck'], 0.6)
    rig.part('jaw', ellipsoid((0, 1.632, 0.012), 0.084, 0.082, 0.1, 22, 10, math.pi * 0.42, math.pi), stubble, ['Head', 'Neck'], 0.6)
    for s in (1, -1):
        rig.part('ear%d' % s, ellipsoid((s * 0.094, 1.672, -0.015), 0.014, 0.028, 0.02, 10, 6), skin, ['Head'], 0.6)
    # the nose: big, friendly, a bridge that runs down from under the glasses to a round tip well out in front
    rig.part('nose_bridge', capsule((0, 1.705, 0.09), (0, 1.655, 0.128), 0.015, 0.028, 14, 4, 3), skin, ['Head'], 0.6)
    rig.part('nose_tip', ellipsoid((0, 1.65, 0.132), 0.033, 0.03, 0.03, 16, 10), skin, ['Head'], 0.6)
    for s in (1, -1):
        rig.part('nostril%d' % s, ellipsoid((s * 0.026, 1.643, 0.115), 0.018, 0.014, 0.02, 10, 6), skin, ['Head'], 0.6)
    # mouth: a friendly smile in the stubble
    rig.part('smile', bm_torus(0.03, 0.0045, 16, 5, AZ, (0, 1.607, 0.1), sweep=(math.pi * 1.1, math.pi * 1.9)), lip, ['Head'], 0.6)
    # brows above the shades
    for s in (1, -1):
        rig.part('brow%d' % s, bm_xf(rbox((s * 0.043, 1.722, 0.093), (0.062, 0.013, 0.016), 0.005, 2), tilt((s * 0.043, 1.722, 0.093), 0.0, -0.25, s * -0.18)), brow, ['Head'], 0.6)
    # sunglasses: dark square lenses, a bridge and the temples back to the ears
    for s in (1, -1):
        rig.part('lens%d' % s, rbox((s * 0.044, 1.684, 0.104), (0.072, 0.046, 0.022), 0.011, 2), shades, ['Head'], 0.6)
        rig.part('temple%d' % s, rbox((s * 0.094, 1.688, 0.02), (0.011, 0.012, 0.14), 0.004, 1), shades, ['Head'], 0.6)
    rig.part('bridge', rbox((0, 1.692, 0.108), (0.03, 0.012, 0.012), 0.004, 1), shades, ['Head'], 0.6)
    # hair: a cap, the back, swept-up sides, the bun on top-back, a tie, and loose strands
    rig.part('hair', ellipsoid((0, 1.722, -0.035), 0.104, 0.1, 0.135, 20, 8, 0.0, math.pi * 0.5), hair, ['Head'], 0.6)
    rig.part('hair_back', hair_sheet((0, 1.722, -0.03), 0.104, 0.135, 1.722, 1.565, 0.22, 0.025, 7, 14), hair, ['Head', 'Neck'], 0.6)
    rig.part('bun', ellipsoid((0, 1.775, -0.095), 0.05, 0.045, 0.05, 16, 10), hair, ['Bun', 'Head'], 0.5)
    rig.part('bun_tie', bm_torus(0.03, 0.008, 14, 6, aim((0, 0.5, -1)), (0, 1.75, -0.075)), tie, ['Bun', 'Head'], 0.5)
    for s in (1, -1):
        p = catmull([(s * 0.088, 1.735, 0.045), (s * 0.1, 1.69, 0.07), (s * 0.105, 1.63, 0.065), (s * 0.098, 1.585, 0.05)], 8)
        rig.part('strand%d' % s, bm_tube(p, [0.003, 0.0055, 0.0055, 0.005, 0.0045, 0.0035, 0.0025, 0.0], 5), hair, ['Head', 'Neck'], 0.6)
    p = catmull([(0.02, 1.62, -0.095), (0.035, 1.56, -0.085), (0.03, 1.5, -0.06)], 6)
    rig.part('strand_nape', bm_tube(p, [0.006, 0.006, 0.005, 0.004, 0.002, 0.0], 6), hair, ['Head', 'Neck'], 0.6)
    for side, s in ((L, 1), (Rr, -1)):
        # short sleeve (tee), tattooed upper arm and forearm, hand
        rig.part(side + '_sleeve', capsule((s * 0.16, 1.43, 0), (s * 0.30, 1.43, 0), 0.082, 0.072, 16, 4, 2), tee, [side + 'Arm', side + 'Shoulder', side + 'ForeArm', 'Spine2'])
        bm, _ = limb((s * 0.265, 1.43, 0), (s * 0.465, 1.43, 0), 0.062, 0.053, 18, 3, 13, pattern_upper)
        rig.part(side + '_arm', bm, [skin, ink], [side + 'Arm', side + 'ForeArm', side + 'Shoulder'])
        bm, _ = limb((s * 0.455, 1.43, 0), (s * 0.725, 1.43, 0), 0.054, 0.043, 18, 3, 15, pattern_fore)
        rig.part(side + '_forearm', bm, [skin, ink], [side + 'ForeArm', side + 'Hand', side + 'Arm'])
        rig.part(side + '_hand', rbox((s * 0.795, 1.425, 0), (0.165, 0.09, 0.045), 0.02, 2), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        rig.part(side + '_thumb', capsule((s * 0.75, 1.425, 0.03), (s * 0.79, 1.425, 0.065), 0.016, 0.013, 10, 3, 2), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        # thigh, shin (jeans), black sneaker, pale sole
        rig.part(side + '_thigh', capsule((s * 0.105, 0.93, 0), (s * 0.105, 0.5, 0), 0.094, 0.073, 14, 4, 3), jeans, [side + 'UpLeg', side + 'Leg', 'Hips'])
        rig.part(side + '_shin', capsule((s * 0.105, 0.51, 0), (s * 0.105, 0.1, 0), 0.07, 0.06, 14, 4, 3), jeans, [side + 'Leg', side + 'Foot', side + 'UpLeg'])
        rig.part(side + '_shoe', rbox((s * 0.105, 0.065, 0.075), (0.12, 0.09, 0.3), 0.03, 3), shoe, [side + 'Foot', side + 'ToeBase', side + 'Leg'], 0.8)
        rig.part(side + '_sole', rbox((s * 0.105, 0.018, 0.075), (0.125, 0.035, 0.31), 0.012, 2), sole, [side + 'Foot', side + 'ToeBase'], 0.8)
        rig.part(side + '_lace', rbox((s * 0.105, 0.105, 0.12), (0.06, 0.012, 0.09), 0.004, 1), sole, [side + 'Foot', side + 'ToeBase'], 0.8)

def secondary(arm, f, t, P, rig):
    """The bun bobs with the gait and flutters on jumps and hits."""
    g = P.ctx.get('gait', 0); ph = P.ctx.get('phase', 0.0); fl = P.ctx.get('flutter', 0.0)
    amp = 0.1 * g + 0.25 * fl + 0.03
    set_rot(arm, 'Bun', Rx(-amp * math.sin(2 * ph + 0.5)) @ Ry(0.5 * amp * math.sin(ph)), f)

def main():
    clear_scene()
    rig = Rig('brady', height=1.8, width=1.0)
    rig.extra_bones([('Bun', 'Head', (0, 1.73, -0.075), (0, 1.79, -0.11))])
    rig.secondary = secondary
    build_brady(rig)
    pv = os.environ.get('CHAR_PREVIEWS'); previews = []
    if pv:
        os.makedirs(pv, exist_ok=True)
        previews = [(os.path.join(pv, 'brady_rest.png'), None, 1, (0.4, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_face.png'), 'idle', 10, (0.5, -1, 0.25), 0.33, (0, -0.02, 1.66)),
                    (os.path.join(pv, 'brady_side.png'), 'idle', 10, (1, -0.2, 0.2), 0.33, (0, -0.02, 1.66)),
                    (os.path.join(pv, 'brady_walk.png'), 'walk', 8, (0.6, -1, 0.2), 1.0, None),
                    (os.path.join(pv, 'brady_dance.png'), 'dance', 14, (0.3, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_drive.png'), 'drive', 10, (0.0, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_sleep.png'), 'sleep', 10, (1.0, -0.6, 0.35), 1.0, None),
                    (os.path.join(pv, 'brady_captive.png'), 'captive', 20, (-0.3, 1, 0.3), 1.0, None),
                    (os.path.join(pv, 'brady_photo.png'), 'photo', 12, (0.0, -1, 0.1), 1.0, None)]
    out = os.environ.get('CHAR_OUT') or os.path.join(MODELS, 'brady.glb')
    blend = os.environ.get('CHAR_BLEND') or os.path.join(BLEND_DIR, 'brady.blend')
    build(rig, out, blend, previews)

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; traceback.print_exc(); sys.exit(1)
