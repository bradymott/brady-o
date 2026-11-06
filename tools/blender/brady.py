# Brady: the owner's likeness as a rigged, animated glTF character for the Burns engine (BurnsSkin, docs/BURNS_GUIDE.md
# §6.9), built on tools/blender/charkit.py. A lean human-proportioned hero with a continuous
# facial surface, a relaxed closed mouth, short tied-back brown hair and a high bun, stubble,
# square dark sunglasses, all-black clothing and sacred-geometry sleeves on both arms.
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
    """Continuous sacred-geometry blackwork, measured around the arm, not a solid ink disc."""
    phi = math.atan2(c[2], c[1] - ARM_Y)
    u = t * L; v = r * phi
    # Staggered hexagonal rosettes with fine negative-space petals.
    cell = 0.043
    row = round(u / (cell * 0.866))
    cx = row * cell * 0.866
    cy = round(v / cell - (row % 2) * 0.5) * cell + (row % 2) * cell * 0.5
    x, y = u - cx, v - cy
    d = math.hypot(x, y); th = math.atan2(y, x)
    petal = 0.011 + 0.008 * abs(math.cos(3 * th))
    return int(abs(d - petal) < 0.0028 or abs(d - 0.021) < 0.0022 or d < 0.003)

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
    skin = mat('skin', '#d6a582', rough=0.86); ink = mat('ink', '#252329', rough=0.86)
    shadow = mat('beard_shadow', '#d6a27f', rough=0.8); stubble = mat('stubble', '#d2a07a', rough=0.85); lipshadow = mat('lip_shadow', '#d8a67f', rough=0.85)
    lip = mat('lip', '#b4746a', rough=0.7); teeth = mat('teeth', '#f4f1ea', rough=0.4)
    tee = mat('tee_black', '#1b1a20', rough=0.9); jeans = mat('trousers_black', '#1b1c20', rough=0.92)
    shoe = mat('sneaker_black', '#141418', rough=0.6); sole = mat('sneaker_sole', '#303034', rough=0.85)
    hair = mat('hair', '#5b3b22', rough=0.55); hair_hi = mat('hair_light', '#6e4a2c', rough=0.55)
    shades = mat('sunglasses', '#0b0b10', rough=0.2, coat=1.0); brow = mat('brow', '#3a2414', rough=0.8); tie = mat('hair_tie', '#2a2a2e', rough=0.8)
    L, Rr = 'Left', 'Right'
    def part(name, bm, mats, bones, soft=1.0, wfn=None):
        bm_xf(bm, SK); rig.part(name, bm, mats, bones, soft, wfn)
    # lean torso (tee), belly, hips (jeans)
    torso = [(1.0,.148,.098),(1.06,.145,.099),(1.14,.150,.103),
             (1.24,.176,.112),(1.34,.195,.112),(1.41,.198,.102),
             (1.445,.165,.092),(1.465,.091,.066),(1.475,.054,.048)]
    rings = [[(rx*math.sin(TAU*j/24),y,rz*math.cos(TAU*j/24)) for j in range(24)] for y,rx,rz in torso]
    part('tee_torso', bm_loft(rings, closed_u=True, caps=True), tee, ['Spine1', 'Spine2', 'Spine', 'Hips', L + 'Shoulder', Rr + 'Shoulder'], 1.1)
    part('hips', rbox((0, 0.93, 0), (0.3, 0.22, 0.205), 0.08, 3), jeans, ['Hips', L + 'UpLeg', Rr + 'UpLeg', 'Spine'], 1.2)
    part('belt', bm_torus(0.155, 0.013, 24, 6, AY, (0, 1.0, 0), sy=0.68), mat('belt', '#2a1d14', rough=0.7), ['Hips', 'Spine'], 1.2)
    seam = mat('cloth_seam', '#35343a', rough=.96)
    part('collar', bm_torus(.057, .006, 32, 6, AY, (0,1.467,-.007), sy=.85), seam, ['Spine2', 'Neck'], .6)
    for side in (1,-1):
        part('tee_hem%d' % side, capsule((side*.10,1.01,.087),(side*.135,1.018,.080),.003,.002,6,2,2), seam, ['Spine','Hips'])
        for k in range(3):
            part('cloth_fold%d_%d' % (side,k), capsule((side*.08,1.10+k*.028,.093), (side*.13,1.112+k*.028,.084), .0025,.001,5,2,2), tee, ['Spine','Spine1'])
    # One continuous facial surface: jaw angle, chin, cheeks, temples and eye sockets.
    # The silhouette is authored in metres; no stacked jaw/cheek balls or painted smile.
    part('neck', capsule((0, 1.45, -0.018), (0, 1.59, -0.018), 0.049, 0.047, 16, 4, 3), skin, ['Neck', 'Spine2', 'Head'])
    rows = [(1.552, .025, .040, .018), (1.565, .050, .065, .008),
            (1.590, .074, .081, -.004), (1.620, .082, .090, -.012),
            (1.650, .085, .097, -.014), (1.680, .087, .102, -.018),
            (1.710, .085, .103, -.023), (1.740, .081, .096, -.026),
            (1.770, .070, .079, -.028), (1.791, .046, .052, -.029),
            (1.801, .001, .001, -.029)]
    bm = bmesh.new(); prev = None
    for y, rx, rz, cz in rows:
        ring = []
        for j in range(48):
            th = TAU * j / 48
            x = rx * math.sin(th); z = cz + rz * math.cos(th)
            front = max(0, math.cos(th)) ** 6
            # recessed sockets and a quiet brow ridge, with a flattened human face plane
            z += front * (-.008 * math.exp(-((y-1.69)/.018)**2)
                          + .004 * math.exp(-((y-1.721)/.012)**2))
            ring.append(bm.verts.new(E(x, y, z)))
        if prev:
            for j in range(48): bm.faces.new((prev[j], prev[(j+1)%48], ring[(j+1)%48], ring[j]))
        prev = ring
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    part('sculpted_head', bm, skin, ['Head'], .5)
    for side in (1, -1):
        part('ear%d' % side, ellipsoid((side*.087, 1.677, -.018), .013, .025, .017, 12, 8), skin, ['Head'], .5)
        part('ear_inner%d' % side, ellipsoid((side*.094, 1.678, -.006), .005, .015, .006, 8, 6), shadow, ['Head'], .5)
    part('nose_bridge', capsule((0, 1.716, .075), (0, 1.664, .104), .010, .014, 16, 4, 4), skin, ['Head'], .5)
    part('nose_tip', ellipsoid((0, 1.657, .108), .016, .012, .016, 16, 10), skin, ['Head'], .5)
    for side in (1, -1):
        part('alar%d' % side, ellipsoid((side*.013, 1.652, .098), .009, .007, .010, 12, 6), skin, ['Head'], .5)
        part('nostril%d' % side, ellipsoid((side*.011, 1.648, .104), .004, .002, .003, 8, 4), brow, ['Head'], .5)
    # Closed, relaxed lips rather than the permanent cartoon grin.
    part('upper_lip', ellipsoid((0, 1.616, .079), .026, .0035, .005, 20, 6), lip, ['Head'], .5)
    part('lower_lip', ellipsoid((0, 1.609, .080), .024, .004, .005, 20, 6), lip, ['Head'], .5)
    part('mouth_line', capsule((-.023, 1.613, .083), (.023, 1.613, .083), .0012, .0012, 6, 2, 2), brow, ['Head'], .5)
    # Fine stubble laid on the facial surface; stable geometry, no frame-to-frame noise.
    import random
    rng = random.Random(22)
    for i in range(110):
        y = rng.uniform(1.571, 1.647); th = rng.uniform(-1.42, 1.42)
        if abs(th) < .38 and y > 1.601: continue
        for a, b in zip(rows, rows[1:]):
            if a[0] <= y <= b[0]:
                t = (y-a[0])/(b[0]-a[0]); rx, rz, cz = [a[k]+t*(b[k]-a[k]) for k in (1,2,3)]; break
        x = rx*math.sin(th); z = cz+rz*math.cos(th)+.0008
        part('stubble_%03d' % i, capsule((x,y,z), (x+.0003,y+.0015,z), .00065, .00045, 3, 1, 1), brow, ['Head'], .5)
    # brows above round-rectangular shades
    for s in (1, -1):
        part('brow%d' % s, bm_xf(rbox((s * 0.043, 1.727, 0.09), (0.056, 0.011, 0.014), 0.005, 2), tilt((s * 0.043, 1.728, 0.09), 0.0, -0.25, s * -0.15)), brow, ['Head'], 0.6)
        part('lens%d' % s, rbox((s * 0.044, 1.69, 0.101), (0.064, 0.037, 0.015), 0.006, 3), shades, ['Head'], 0.6)
        part('temple%d' % s, rbox((s * 0.092, 1.694, 0.02), (0.011, 0.012, 0.14), 0.004, 1), shades, ['Head'], 0.6)
    part('bridge', rbox((0, 1.697, 0.106), (0.03, 0.011, 0.011), 0.004, 1), shades, ['Head'], 0.6)
    # hair: a high cap (the hairline recedes at the temples, a peak in the middle), side sheets, a loose high bun, curls
    part('hair', ellipsoid((0, 1.752, -0.035), 0.1, 0.082, 0.13, 20, 7, 0.0, math.pi * 0.5), hair, ['Head'], 0.6)
    part('hair_peak', ellipsoid((0, 1.742, 0.07), 0.034, 0.022, 0.035, 12, 6), hair, ['Head'], 0.6)
    part('hair_back', hair_sheet((0, 1.752, -0.03), 0.089, 0.106, 1.752, 1.665, 0.25, 0.008, 8, 24, flare=0.0, wave=0.002), hair, ['Head'], 0.6)
    part('bun', ellipsoid((0, 1.8, -0.088), 0.064, 0.054, 0.06, 14, 8), hair_hi, ['Bun', 'Head'], 0.5)
    part('bun_wisp', ellipsoid((0.025, 1.835, -0.08), 0.036, 0.024, 0.034, 8, 5), hair, ['Bun', 'Head'], 0.5)
    part('bun_wisp2', ellipsoid((-0.03, 1.79, -0.12), 0.03, 0.022, 0.03, 8, 5), hair, ['Bun', 'Head'], 0.5)
    part('bun_tie', bm_torus(0.034, 0.007, 14, 5, aim((0, 0.5, -1)), (0, 1.766, -0.06)), tie, ['Bun', 'Head'], 0.5)
    for side, s in ((L, 1), (Rr, -1)):
        # short sleeve (tee), the mandala upper arm, a bare forearm, hand
        part(side + '_deltoid', ellipsoid((s * 0.185, 1.44, 0), 0.075, 0.07, 0.07, 12, 7), tee, [side + 'Shoulder', side + 'Arm', 'Spine2'])
        part(side + '_sleeve', capsule((s * 0.2, ARM_Y, 0), (s * 0.3, ARM_Y, 0), 0.068, 0.062, 12, 4, 2), tee, [side + 'Arm', side + 'Shoulder', side + 'ForeArm', 'Spine2'])
        bm, _ = limb((s * 0.265, ARM_Y, 0), (s * 0.465, ARM_Y, 0), 0.06, 0.052, 40, 3, 32, mandala)
        part(side + '_arm', bm, [skin, ink], [side + 'Arm', side + 'ForeArm', side + 'Shoulder'])
        bm, _ = limb((s * 0.455, ARM_Y, 0), (s * 0.725, ARM_Y, 0), 0.053, 0.035, 40, 3, 36, lambda t, a, c: mandala(t, a, c, L=0.27, r=0.046))
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

