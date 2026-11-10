# nl_enemies: the Netherlands tour of Super Brady-O World in the Fiesta Toon look (original cartoon designs; humour from
# food, animals and objects). Conventions as in docs/SPRITE_BRIEF.md (Z up, characters FACE +X, camera along +Y from -Y,
# 1 m = 28.1 px, feet kinds on z = 0, centre kinds centred, materials <kind>_<part>); the character toolkit is
# fr_charkit.py (shared with fr_enemies.py).
#
#   herring    a silver herring on two stubby legs, sprinkled with chopped onion            walk(t) hop stun flat ko
#   cheese     a waxed Gouda wheel that walks on little feet, tucks and rolls                walk(t) curl roll(t) stun flat ko
#   clog       a yellow wooden clog with a painted tulip, stomping along                     walk(t) stun flat ko
#   gull       a herring gull: white head, grey wings with black tips, red-spotted beak      fly(t) swoop stun ko
#   bee        a round fuzzy bee with glassy wings                                           fly(t) swoop stun ko
#   snowman    a three-ball snowman with a carrot nose, a red scarf and a black hat (2 hp)   walk(t) idle(t) throw(t) stun flat ko
#   stroop     a stroopwafel on edge, waffle grid and caramel seam, tucks and rolls          walk(t) curl roll(t) stun flat ko
#   coin       the STROOPWAFEL coin, spinning about Z                                        spin(t)
#   star       the GOLDEN CLOG, hovering                                                     idle(t)
#   qblock     the item block: a wooden cheese crate with a painted Gouda emblem             idle (one frame)
#   used       the spent crate, its lid gone                                                 idle (one frame)
#   bulb       (extra, for the level overhaul's nlBulb burrower) a tulip bulb with a sprout;  walk(t) idle(t: blooming) stun flat ko
#              not referenced by the game yet
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_charkit as CK
from fr_charkit import (TAU, PX, X, Y, Z, V, tr, rot_x, rot_y, rot_z, scl, about, xf, ellipsoid, sphere, blob, superellipsoid,
                        tube, cone, sheet, lathe, lathe_y, torus_bm, box_bm, prism, on_ellipsoid, ellipsoid_surf, Spine,
                        mouth_bm, biped_legs, quad_legs, pose_matrix, perp_frame)
import fr_enemies as FE        # face(), std_table(), wing_frame(), lumpy()

KINDS = ['herring', 'cheese', 'clog', 'gull', 'bee', 'snowman', 'stroop', 'coin', 'star', 'qblock', 'used', 'bulb']
POSES = {
    'herring': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'cheese': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'clog': ['walk', 'stun', 'flat', 'ko'],
    'gull': ['fly', 'swoop', 'stun', 'ko'],
    'bee': ['fly', 'swoop', 'stun', 'ko'],
    'snowman': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'stroop': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'coin': ['spin'], 'star': ['idle'], 'qblock': ['idle'], 'used': ['idle'],
    'bulb': ['walk', 'idle', 'stun', 'flat', 'ko'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('bee', 'fly'): (4, 16), ('bulb', 'walk'): (6, 9), ('bulb', 'idle'): (4, 6)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'gull': 'centre', 'bee': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'herring': 22 / PX, 'cheese': 26 / PX, 'clog': 22 / PX, 'snowman': 40 / PX, 'stroop': 26 / PX, 'bulb': 24 / PX}
SIZE = {'gull': 30 / PX, 'bee': 22 / PX, 'coin': 17 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX}
SIZE.update(HEIGHT)

COLORS = {
    'herring_back': '#4a6a8a', 'herring_side': '#b8c8d8', 'herring_belly': '#eef4fa', 'herring_fin': '#6a8aa8', 'herring_onion': '#fbfbf0',
    'herring_eye_white': '#ffffff', 'herring_pupil': '#1a1020', 'herring_mouth': '#2a3a4a', 'herring_feet': '#e8907a', 'herring_stripe': '#8aa8c4',
    'cheese_wax': '#d8322a', 'cheese_body': '#ffc83a', 'cheese_face': '#ffd860', 'cheese_rim': '#e8a82a', 'cheese_label': '#2a5ad8',
    'cheese_eye_white': '#ffffff', 'cheese_pupil': '#1a1020', 'cheese_mouth': '#8a3a10', 'cheese_feet': '#a8322a',
    'clog_wood': '#ffd23a', 'clog_wood_dark': '#e0a820', 'clog_inside': '#8a5a2a', 'clog_tulip': '#e8322a', 'clog_leaf': '#2a8a3a',
    'clog_eye_white': '#ffffff', 'clog_pupil': '#1a1020', 'clog_mouth': '#8a4a10', 'clog_feet': '#c8901a',
    'gull_body': '#ffffff', 'gull_wing': '#b8c4d0', 'gull_tip': '#2a2a34', 'gull_beak': '#ffd23a', 'gull_spot': '#e8322a',
    'gull_feet': '#ff9a6a', 'gull_eye_white': '#fff4c0', 'gull_pupil': '#1a1020', 'gull_tail': '#e8eef4',
    'bee_body': '#ffd23a', 'bee_stripe': '#2a2228', 'bee_fuzz': '#fff0a0', 'bee_wing': '#e4f4ff', 'bee_sting': '#2a2228',
    'bee_eye_white': '#ffffff', 'bee_pupil': '#1a1020', 'bee_mouth': '#5a3a10', 'bee_feet': '#2a2228',
    'snowman_snow': '#f6faff', 'snowman_shade': '#dce8f6', 'snowman_carrot': '#ff8a1a', 'snowman_scarf': '#e8322a', 'snowman_scarf2': '#ffffff',
    'snowman_hat': '#22222c', 'snowman_band': '#2a5ad8', 'snowman_twig': '#6a4a2a', 'snowman_coal': '#2a2a30', 'snowman_ball': '#ffffff',
    'snowman_eye_white': '#ffffff', 'snowman_pupil': '#1a1020', 'snowman_mouth': '#2a2a30', 'snowman_feet': '#4a5a7a',
    'stroop_waffle': '#d89a4a', 'stroop_grid': '#a8642a', 'stroop_caramel': '#7a3a12', 'stroop_edge': '#c8823a',
    'stroop_eye_white': '#ffffff', 'stroop_pupil': '#1a1020', 'stroop_mouth': '#5a2a0a', 'stroop_feet': '#6a3a1a',
    'coin_gold': '#e8b02a', 'coin_gold_dark': '#c8901a', 'coin_grid': '#a8681a', 'coin_caramel': '#8a4a12', 'coin_glint': '#ffffff',
    'star_gold': '#ffd24a', 'star_gold_dark': '#e0a020', 'star_inside': '#c88a1a', 'star_tulip': '#fff4c0', 'star_sparkle': '#fffbe0',
    'star_eye_white': '#ffffff', 'star_pupil': '#1a1020', 'star_mouth': '#9a5a10',
    'qblock_wood': '#c88a4a', 'qblock_wood_dark': '#9a6230', 'qblock_slat': '#d8a060', 'qblock_cheese': '#ffc83a', 'qblock_wax': '#d8322a',
    'qblock_paint': '#2a5ad8', 'qblock_nail': '#3a3a44',
    'used_wood': '#8a7a6a', 'used_dark': '#6a5a4a', 'used_inside': '#4a3a2a', 'used_slat': '#9a8a7a',
    'bulb_skin': '#c89a6a', 'bulb_skin_dark': '#a87a4a', 'bulb_flesh': '#f4e8d0', 'bulb_root': '#e8d8b8', 'bulb_leaf': '#3a9a4a',
    'bulb_petal': '#e8322a', 'bulb_petal2': '#ff6a5a', 'bulb_eye_white': '#ffffff', 'bulb_pupil': '#1a1020', 'bulb_mouth': '#6a3a1a', 'bulb_feet': '#8a6a3a',
}
CK.COLORS.update(COLORS)
face, std_table, wing_frame, lumpy = FE.face, FE.std_table, FE.wing_frame, FE.lumpy

# ================================================================ HERRING (feet, a 0.9 m fish on stubby legs)
def build_herring(b, pose, t, P):
    pts = [(0.42, 0.0, 0.42, 0.01, 1.0, 1.0), (0.36, 0.0, 0.43, 0.1, 1.0, 0.8), (0.2, 0.0, 0.44, 0.17, 1.0, 0.7),
           (0.0, 0.0, 0.44, 0.18, 1.0, 0.7), (-0.2, 0.0, 0.43, 0.13, 1.0, 0.7), (-0.34, 0.0, 0.42, 0.06, 1.0, 0.7), (-0.4, 0.0, 0.42, 0.03, 1.0, 0.7)]
    sp = Spine(pts)
    b.part('body', sp.mesh(rings=20, seg=20), 'side')
    b.part('back', sp.mesh(rings=16, seg=12, v0=0.05, v1=0.95, a0=-1.1, a1=1.1), 'back', subsurf=1)
    b.part('belly', sp.mesh(rings=14, seg=10, v0=0.1, v1=0.85, a0=math.pi - 1.0, a1=math.pi + 1.0), 'belly', subsurf=1)
    b.part('stripe', tube([V(0.3, -0.13, 0.44), V(0.0, -0.165, 0.43), V(-0.28, -0.1, 0.42)], 0.014, seg=6), 'stripe', subsurf=1)
    # forked tail and fins
    for s in (1, -1):
        b.part('tail%d' % s, prism([V(-0.38, 0, 0.42), V(-0.55, 0, 0.42 + s * 0.15), V(-0.5, 0, 0.42 + s * 0.03)], Y * 0.03), 'fin', subsurf=1)
    b.part('dorsal', prism([V(0.08, 0, 0.6), V(-0.1, 0, 0.6), V(-0.05, 0, 0.7)], Y * 0.03), 'fin', subsurf=1)
    # a sprinkle of chopped onion on the back
    for k, (x, z) in enumerate(((0.12, 0.61), (-0.02, 0.62), (-0.14, 0.6), (0.05, 0.63), (-0.08, 0.63))):
        b.part('onion%d' % k, box_bm((0.04, 0.04, 0.03), bevel=0.008, segments=1), 'onion', subsurf=0, M=b.M @ tr(x, -0.02 * k, z) @ rot_y(20 * k))
    hc, hr = V(0.3, 0, 0.45), (0.14, 0.12, 0.13)
    for side, az in (('r', -0.6), ('l', -1.35)):
        p, n = on_ellipsoid(hc, hr, az, 0.25)
        b.eye(side, p - n * 0.015, n, 0.075, lid=P['lid'], lid_mat='side', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(hc + V(0.12, -0.06, -0.06), 0.03, 0.015, 0.03, seg=8, rows=5), 'mouth', subsurf=0)
    elif m:
        b.part('mouth', tube([hc + V(0.06, -0.1, -0.06), hc + V(0.1, -0.09, -0.07), hc + V(0.13, -0.06, -0.05)], 0.012, seg=6), 'mouth', subsurf=1)
    biped_legs(b, P, t, (0.0, 0, 0.3), (0.07, 0.05, 0.03), 0.03, 'feet', A=0.09, H=0.06, y=0.08)

HERRING = std_table({'hop': dict(sx=1.0, sz=1.0, lean=-18, lid=0.0, mouth='o', feet='tuck')}, walk_bob=0.03, wobble=4.0)
HERRING['hop'] = dict(M=lambda t, P=HERRING['hop']['P']: tr(0, 0, 0.1) @ pose_matrix(P), P=HERRING['hop']['P'])

# ================================================================ CHEESE (feet, a 0.9 m Gouda wheel)
def gouda(b, c, R, Mx=None):
    """A wheel facing the camera (axis Y): yellow cheese, a red wax coat over the back and the rim, a blue label."""
    M = (Mx or Matrix.Identity(4))
    prof = [(0.0, -0.17), (R * 0.8, -0.17), (R * 0.97, -0.13), (R, -0.04), (R, 0.04), (R * 0.97, 0.13), (R * 0.8, 0.17), (0.0, 0.17)]
    b.part('wheel', xf(lathe_y(prof, seg=40), tr(c) @ M), 'wax')
    b.part('face', xf(lathe_y([(0.0, -0.18), (R * 0.84, -0.18), (R * 0.86, -0.15), (0.0, -0.15)], seg=40), tr(c) @ M), 'body', subsurf=1)
    b.part('label', xf(ellipsoid(V(-R * 0.35, -0.19, R * 0.42), X * 0.09, Y * 0.01, Z * 0.06, seg=12, rows=5), tr(c) @ M), 'label', subsurf=0)

def build_cheese(b, pose, t, P):
    R = 0.36
    if pose == 'roll':
        c = V(0, 0, R + 0.02)
        gouda(b, c, R, rot_y(-360 * t))
        return
    c = V(0, 0, R + (0.14 if pose != 'curl' else 0.02))
    gouda(b, c, R)
    for side, ex in (('r', 0.17), ('l', -0.03)):
        b.eye(side, c + V(ex, -0.19, 0.08), V(0.2, -1, 0).normalized(), 0.085, lid=P['lid'], lid_mat='body', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(c + V(0.08, -0.19, -0.13), 0.04, 0.01, 0.045, seg=10, rows=5), 'mouth', subsurf=0)
    elif m:
        k = {'grin': 0.045, 'smile': 0.035, 'small': 0.02}.get(m, 0.0)
        b.part('mouth', tube([c + V(0.0 + 0.16 * u, -0.19, -0.11 - k * math.sin(math.pi * u) + (0.012 * math.sin(3 * math.pi * u) if m == 'wobble' else 0)) for u in (0, 0.25, 0.5, 0.75, 1)], 0.016, seg=6), 'mouth', subsurf=1)
    if pose != 'curl':
        biped_legs(b, P, t, (0.0, 0, 0.14), (0.08, 0.05, 0.035), 0.035, 'feet', y=0.1)

CHEESE = std_table({'curl': dict(sx=1.0, sz=1.0, lean=0, lid=0.7, mouth='small', feet='tuck'),
                    'roll': dict(sx=1.0, sz=1.0, lean=0, lid=1.0, mouth=None, feet=None)}, walk_bob=0.025, wobble=3.0)

# ================================================================ CLOG (feet, a yellow wooden clog)
def clog_shell(b, z0=0.0, mats=('wood', 'wood_dark', 'inside')):
    """A wooden clog seen from the side: a tall heel with its opening tipped toward the camera, a long body, the toe
    rising to a rounded point; a darker sole band."""
    pts = [(0.46, 0, z0 + 0.32, 0.02, 1.0, 0.9), (0.42, 0, z0 + 0.29, 0.08, 1.0, 0.9), (0.3, 0, z0 + 0.22, 0.15, 1.0, 0.9),
           (0.1, 0, z0 + 0.21, 0.19, 1.0, 0.95), (-0.1, 0, z0 + 0.23, 0.21, 1.0, 1.0), (-0.26, 0, z0 + 0.25, 0.2, 1.0, 1.0),
           (-0.36, 0, z0 + 0.25, 0.14, 1.0, 1.0), (-0.4, 0, z0 + 0.25, 0.04, 1.0, 1.0)]
    b.part('body', Spine(pts).mesh(rings=22, seg=22), mats[0])
    b.part('sole', tube([V(0.3, -0.0, z0 + 0.06), V(0.0, 0, z0 + 0.04), V(-0.34, 0, z0 + 0.07)], 0.05, seg=8), mats[1], subsurf=1)
    oc = V(-0.16, -0.04, z0 + 0.42)
    Mo = tr(oc) @ rot_x(-35)
    b.part('opening', xf(ellipsoid(V(0, 0, 0), X * 0.17, Y * 0.12, Z * 0.035, seg=20, rows=8), Mo), mats[2], subsurf=1)
    b.part('rim', xf(torus_bm(V(0, 0, 0.01), Z, 0.165, 0.025, seg=24, sides=6), Mo @ scl(1.0, 0.72, 1.0)), mats[1], subsurf=1)

def build_clog(b, pose, t, P):
    clog_shell(b, 0.06)
    tc = V(-0.02, -0.2, 0.3)
    b.part('stem', tube([tc + V(0, 0, -0.08), tc + V(0.005, 0, 0.03)], 0.01, seg=5), 'leaf', subsurf=0)
    b.part('leaf', blob(tc + V(0.03, 0, -0.05), 0.035, 0.008, 0.015, seg=8, rows=4), 'leaf', subsurf=0)
    b.part('tulip', blob(tc + V(0, 0, 0.05), 0.035, 0.01, 0.04, seg=10, rows=5), 'tulip', subsurf=0)
    hc, hr = V(0.26, 0, 0.32), (0.18, 0.17, 0.15)
    for side, az in (('r', -0.6), ('l', -1.3)):
        p, n = on_ellipsoid(hc, hr, az, 0.45)
        b.eye(side, p - n * 0.02, n, 0.075, lid=P['lid'], lid_mat='wood', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(hc + V(0.12, -0.14, -0.08), 0.035, 0.015, 0.035, seg=8, rows=5), 'mouth', subsurf=0)
    elif m:
        b.part('mouth', tube([hc + V(0.05, -0.15, -0.07), hc + V(0.11, -0.14, -0.09), hc + V(0.16, -0.1, -0.07)], 0.014, seg=6), 'mouth', subsurf=1)
    biped_legs(b, P, t, (0.0, 0, 0.1), (0.07, 0.05, 0.03), 0.03, 'feet', A=0.08, H=0.04, y=0.11)

CLOG = std_table(walk_bob=0.05, wobble=6.0)

# ================================================================ GULL (centre flyer)
def build_gull(b, pose, t, P):
    bc = V(-0.02, 0, 0.0)
    b.part('body', blob(bc, 0.27, 0.14, 0.14), 'body')
    hc, hr = V(0.26, 0, 0.08), (0.12, 0.11, 0.11)
    b.part('head', blob(hc, *hr), 'body')
    b.part('beak', cone(hc + V(0.1, 0, -0.02), hc + V(0.24, 0, -0.04), 0.035, flat=0.7, seg=8), 'beak', subsurf=1)
    b.part('spot', sphere(hc + V(0.19, -0.02, -0.05), 0.016, seg=6, rows=4), 'spot', subsurf=0)
    for side, az in (('r', -0.5), ('l', -1.25)):
        p, n = on_ellipsoid(hc, hr, az, 0.28)
        b.eye(side, p - n * 0.012, n, 0.05, pupil=0.4, lid=P.get('lid', 0.35), lid_mat='body', dazed=pose == 'stun', shut='x' if pose == 'ko' else None)
        b.brow(side, p - n * 0.012, n, 0.05, angry=0.7)
    def tail(u, v):
        return V(-0.24 - 0.14 * u, (v * 2 - 1) * (0.05 + 0.03 * u), 0.02)
    b.part('tail', sheet(tail, 3, 3, 0.012), 'tail')
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.0, 0.1 * side, 0.05), side, flap, sweep)
        def wing(u, v, W=W):
            span = 0.62 * u
            le = 0.08 + 0.04 * math.sin(math.pi * u) - 0.18 * u ** 3
            chord = 0.24 * (1 - u ** 1.5) + 0.05
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 7, 4, lambda u, v: 0.02 - 0.008 * u), 'wing')
        b.part('tip_' + side_name, sheet(lambda u, v, W=W: wing(0.78 + 0.22 * u, v, W) + (W.to_3x3() @ Z) * 0.01, 3, 3, 0.008), 'tip', subsurf=1)
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('foot_' + side_name, blob(V(-0.12, 0.05 * side, -0.15), 0.05, 0.03, 0.012, seg=8, rows=5), 'feet', subsurf=1)

GULL = {
    'fly': dict(flap=lambda t: 10 + 40 * math.cos(TAU * t), sweep=10, M=lambda t: tr(0, 0, 0.03 * math.sin(TAU * t))),
    'swoop': dict(flap=lambda t: 30, sweep=50, M=lambda: rot_y(24)),
    'stun': dict(flap=lambda t: -55, sweep=6, M=lambda: rot_y(-10), lid=0.6),
    'ko': dict(flap=lambda t: -70, sweep=10, M=lambda: rot_y(-15)),
}

# ================================================================ BEE (centre flyer, small)
def build_bee(b, pose, t, P):
    bc, br = V(-0.02, 0, 0.0), (0.24, 0.19, 0.19)
    b.part('body', lumpy(bc, 0.2, lobes=9, depth=0.05, seed=2, sx=1.2), 'body', subsurf=1)
    for k, x in enumerate((-0.12, 0.0)):
        b.part('stripe%d' % k, xf(torus_bm(V(0, 0, 0), X, 0.185 - 0.02 * abs(x) * 3, 0.045, seg=20, sides=6), tr(bc + V(x, 0, 0))), 'stripe', subsurf=1)
    b.part('sting', cone(bc + V(-0.24, 0, -0.01), bc + V(-0.33, 0, -0.03), 0.04, seg=8), 'sting', subsurf=1)
    hc, hr = V(0.2, 0, 0.04), (0.13, 0.12, 0.12)
    b.part('head', blob(hc, *hr), 'stripe')
    for k, y in enumerate((-0.06, 0.06)):
        tip = hc + V(0.1, y, 0.2)
        b.part('ant%d' % k, tube([hc + V(0.03, y * 0.6, 0.1), hc + V(0.07, y, 0.17), tip], 0.012, seg=5), 'stripe', subsurf=0)
        b.part('antb%d' % k, sphere(tip, 0.025, seg=6, rows=4), 'stripe', subsurf=0)
    for side, az in (('r', -0.45), ('l', -1.2)):
        p, n = on_ellipsoid(hc, hr, az, 0.2)
        b.eye(side, p - n * 0.012, n, 0.06, lid=P.get('lid', 0.1), lid_mat='stripe', dazed=pose == 'stun', shut='x' if pose == 'ko' else None)
    flap = P['flap'](t)
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(-0.02, 0.06 * side, 0.14), side, flap, 20)
        b.part('wing_' + side_name, xf(ellipsoid(V(-0.05, 0.16, 0.0), X * 0.12, Y * 0.17, Z * 0.012, seg=14, rows=6), W), 'wing', subsurf=1)
    for k in range(3):
        b.part('leg%d' % k, tube([bc + V(0.08 - k * 0.08, -0.06, -0.15), bc + V(0.06 - k * 0.08, -0.07, -0.24)], 0.014, seg=5), 'feet', subsurf=0)

BEE = {
    'fly': dict(flap=lambda t: 60 * math.cos(TAU * t), M=lambda t: tr(0, 0, 0.02 * math.sin(TAU * t))),
    'swoop': dict(flap=lambda t: 40, M=lambda: rot_y(20)),
    'stun': dict(flap=lambda t: -40, M=lambda: rot_y(-12), lid=0.5),
    'ko': dict(flap=lambda t: -60, M=lambda: rot_y(-15)),
}

# ================================================================ SNOWMAN (feet, 1.42 m, 2 hp)
def build_snowman(b, pose, t, P):
    arm = P.get('arm', lambda t: 0.0)(t)
    c0, c1, c2 = V(0, 0, 0.3), V(0.02, 0, 0.74), V(0.04, 0, 1.08)
    b.part('base', lumpy(c0, 0.3, lobes=7, depth=0.04, seed=1, sz=0.92), 'snow', subsurf=1)
    b.part('mid', lumpy(c1, 0.22, lobes=6, depth=0.04, seed=3), 'snow', subsurf=1)
    hr = (0.19, 0.18, 0.18)
    b.part('head', blob(c2, *hr), 'snow')
    for k, z in enumerate((0.64, 0.78)):
        p, n = on_ellipsoid(c1, (0.22, 0.22, 0.22), -1.0, (z - c1.z) / 0.22)
        b.part('coal%d' % k, sphere(p + n * 0.01, 0.03, seg=8, rows=5), 'coal', subsurf=0)
    # the scarf, the carrot, the hat
    b.part('scarf', torus_bm(c2 + V(-0.01, 0, -0.16), Z, 0.15, 0.05, seg=20, sides=8), 'scarf', subsurf=1)
    b.part('scarf_end', tube([c2 + V(-0.08, -0.12, -0.18), c2 + V(-0.13, -0.16, -0.32), c2 + V(-0.16, -0.15, -0.44)], 0.045, 0.04, seg=8), 'scarf', subsurf=1)
    b.part('scarf_stripe', tube([c2 + V(-0.12, -0.165, -0.3), c2 + V(-0.135, -0.17, -0.34)], 0.046, seg=8), 'scarf2', subsurf=1)
    b.part('carrot', cone(c2 + V(0.16, -0.03, -0.01), c2 + V(0.38, -0.03, -0.03), 0.045, seg=10), 'carrot', subsurf=1)
    b.part('brim', xf(lathe([(0.0, 0.0), (0.22, 0.0), (0.22, 0.03), (0.0, 0.03)], seg=24), tr(c2 + V(-0.02, 0, 0.14)) @ rot_y(-8)), 'hat', subsurf=1)
    b.part('crown', xf(lathe([(0.15, 0.0), (0.14, 0.24), (0.0, 0.24)], seg=20), tr(c2 + V(-0.02, 0, 0.16)) @ rot_y(-8)), 'hat', subsurf=1)
    b.part('band', xf(lathe([(0.152, 0.0), (0.15, 0.05)], seg=20), tr(c2 + V(-0.02, 0, 0.17)) @ rot_y(-8)), 'band', subsurf=0)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = on_ellipsoid(c2, hr, az, 0.2)
        b.eye(side, p - n * 0.012, n, 0.07, lid=P['lid'], lid_mat='snow', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(c2 + V(0.12, -0.1, -0.1), 0.035, 0.015, 0.035, seg=8, rows=5), 'mouth', subsurf=0)
    elif m:
        for k in range(5):
            u = k / 4
            b.part('m%d' % k, sphere(c2 + V(0.04 + 0.12 * u, -0.15 + 0.02 * u, -0.08 - 0.03 * math.sin(math.pi * u)), 0.016, seg=6, rows=4), 'coal', subsurf=0)
    # twig arms: the front one raises a snowball to throw
    sh = c1 + V(0.0, -0.16, 0.06)
    b.part('arm_back', tube([c1 + V(-0.16, 0.05, 0.05), c1 + V(-0.36, 0.05, 0.18), c1 + V(-0.44, 0.05, 0.26)], 0.02, 0.014, seg=5), 'twig', subsurf=0)
    a = math.radians(-20 + 130 * arm)
    hand = sh + V(math.cos(a) * 0.36, 0, math.sin(a) * 0.36)
    b.part('arm_front', tube([sh, sh.lerp(hand, 0.5) + V(0, 0, 0.02), hand], 0.022, 0.015, seg=5), 'twig', subsurf=0)
    for k in (-1, 1):
        b.part('finger%d' % k, tube([hand, hand + V(math.cos(a + k * 0.6) * 0.08, 0, math.sin(a + k * 0.6) * 0.08)], 0.012, seg=4), 'twig', subsurf=0)
    if pose in ('throw',) and arm > 0.2:
        b.part('ball', sphere(hand + V(0.02, -0.02, 0.06), 0.07, seg=12, rows=8), 'ball', subsurf=1)
    # little boots so it can shuffle
    biped_legs(b, P, t, (0.02, 0, 0.06), (0.09, 0.06, 0.04), 0.03, 'feet', A=0.06, H=0.03, y=0.13)

SNOWMAN = std_table({'throw': dict(sx=1.0, sz=1.0, lean=-4, lid=0.0, mouth='o', feet='stand', arm=lambda t: math.sin(math.pi * t))},
                    walk_bob=0.02, wobble=2.0)

# ================================================================ STROOP (feet, a stroopwafel on edge)
def stroopwafel(b, c, R, Mx=None, prefix='', mats=('waffle', 'grid', 'caramel', 'edge'), n=5):
    """Two thin waffle discs with a caramel seam between them, standing on edge facing the camera (axis Y), a
    diamond grid pressed into the front face."""
    M = tr(c) @ (Mx or Matrix.Identity(4))
    for k, y0 in enumerate((-0.11, 0.03)):
        b.part(prefix + 'disc%d' % k, xf(lathe_y([(0.0, y0), (R * 0.96, y0), (R, y0 + 0.02), (R, y0 + 0.06), (R * 0.96, y0 + 0.08), (0.0, y0 + 0.08)], seg=40), M), mats[0])
    b.part(prefix + 'seam', xf(lathe_y([(0.0, -0.03), (R * 0.985, -0.03), (R * 0.985, 0.03), (0.0, 0.03)], seg=40), M), mats[2], subsurf=1)
    for k in range(-n, n + 1):
        off = k * R * 0.32
        for sgn in (1, -1):
            # diagonal grid lines clipped to the disc
            pts = []
            for u in [i / 10 for i in range(11)]:
                s = -R + 2 * R * u
                x, z = s * 0.7071 + off * 0.7071 * sgn, s * 0.7071 * sgn - off * 0.7071
                x, z = (s + off) * 0.7071, (s - off) * 0.7071 * sgn
                if x * x + z * z < (R * 0.9) ** 2:
                    pts.append(V(x, -0.115, z))
            if len(pts) >= 2:
                b.part(prefix + 'grid%d_%d' % (k, sgn), xf(tube(pts, 0.012, seg=4), M), mats[1], subsurf=0)

def build_stroop(b, pose, t, P):
    R = 0.36
    if pose == 'roll':
        stroopwafel(b, V(0, 0, R + 0.02), R, rot_y(-360 * t))
        return
    c = V(0, 0, R + (0.14 if pose != 'curl' else 0.02))
    stroopwafel(b, c, R)
    for side, ex in (('r', 0.17), ('l', -0.03)):
        b.eye(side, c + V(ex, -0.13, 0.08), V(0.2, -1, 0).normalized(), 0.085, lid=P['lid'], lid_mat='waffle', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(c + V(0.08, -0.13, -0.13), 0.04, 0.01, 0.045, seg=10, rows=5), 'mouth', subsurf=0)
    elif m:
        k = {'grin': 0.045, 'smile': 0.035, 'small': 0.02}.get(m, 0.0)
        b.part('mouth', tube([c + V(0.0 + 0.16 * u, -0.13, -0.11 - k * math.sin(math.pi * u) + (0.012 * math.sin(3 * math.pi * u) if m == 'wobble' else 0)) for u in (0, 0.25, 0.5, 0.75, 1)], 0.016, seg=6), 'mouth', subsurf=1)
    if pose != 'curl':
        biped_legs(b, P, t, (0.0, 0, 0.14), (0.08, 0.05, 0.035), 0.035, 'feet', y=0.1)

STROOP = std_table({'curl': dict(sx=1.0, sz=1.0, lean=0, lid=0.7, mouth='small', feet='tuck'),
                    'roll': dict(sx=1.0, sz=1.0, lean=0, lid=1.0, mouth=None, feet=None)}, walk_bob=0.025, wobble=3.0)

# ================================================================ COIN: the stroopwafel coin
def build_coin(b, pose, t, P):
    stroopwafel(b, V(0, 0, 0), 0.28, mats=('gold', 'grid', 'caramel', 'gold_dark'), n=3)
    b.part('glint', ellipsoid(V(-0.1, -0.13, 0.13), X * 0.05, Y * 0.01, Z * 0.03, seg=10, rows=5), 'glint', subsurf=1)

COIN = {'spin': dict(M=lambda t: rot_z(360 * t))}

# ================================================================ STAR: the golden clog
def build_star(b, pose, t, P):
    clog_shell(b, -0.25, mats=('gold', 'gold_dark', 'inside'))
    tc = V(-0.02, -0.2, 0.04)
    b.part('tulip', blob(tc + V(0, 0, 0.04), 0.04, 0.01, 0.045, seg=10, rows=5), 'tulip', subsurf=0)
    face(b, V(0.26, 0, 0.0), (0.18, 0.17, 0.15), {'lid': 0.1, 'mouth': 'smile'}, az=(-0.6, -1.3), el=0.45, r=0.07, lid_mat='gold', mscale=0.7)
    for k, (x, z, s) in enumerate(((-0.42, 0.28, 0.06), (0.44, 0.22, 0.05), (0.05, 0.36, 0.04))):
        for d in (X, Z):
            b.part('spark%d%s' % (k, 'x' if d is X else 'z'), ellipsoid(V(x, -0.25, z), d * s * 1.8, Y * 0.01, (Z if d is X else X) * s * 0.35, seg=8, rows=4), 'sparkle', subsurf=0)

STAR = {'idle': dict(M=lambda t: tr(V(0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(5 * math.sin(TAU * t)))}

# ================================================================ QBLOCK / USED: the cheese crate
def build_qblock(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.94
    b.part('core', box_bm((W, D, H), bevel=0.04, segments=2), 'wood_dark', subsurf=0)
    for k in range(4):   # front slats
        z = -H / 2 + (k + 0.5) * H / 4
        b.part('slat%d' % k, box_bm((W - 0.04, 0.03, H / 4 - 0.05), bevel=0.01, segments=1), 'wood' if k % 2 else 'slat', subsurf=0, smooth=False,
               M=b.M @ tr(0, -D / 2 - 0.012, z))
    for sx in (-1, 1):
        b.part('post%d' % sx, box_bm((0.1, 0.05, H + 0.01), bevel=0.01, segments=1), 'wood_dark', subsurf=0, M=b.M @ tr(sx * (W / 2 - 0.05), -D / 2 - 0.03, 0))
        for sz in (-1, 1):
            b.part('nail%d%d' % (sx, sz), sphere(V(sx * (W / 2 - 0.05), -D / 2 - 0.06, sz * (H / 2 - 0.08)), 0.025, seg=6, rows=4), 'nail', subsurf=0)
    # the painted Gouda emblem: a yellow disc with a red wax wedge and a blue ring
    ec = V(0, -D / 2 - 0.035, 0.0)
    b.part('ring', xf(torus_bm(V(0, 0, 0), Y, 0.3, 0.025, seg=32, sides=6), tr(ec)), 'paint', subsurf=0)
    b.part('disc', xf(lathe_y([(0.0, -0.01), (0.25, -0.01), (0.26, 0.0), (0.25, 0.01), (0.0, 0.01)], seg=32), tr(ec)), 'cheese', subsurf=0)
    wedge = [ec + V(0, -0.015, 0)] + [ec + V(0.255 * math.cos(a), -0.015, 0.255 * math.sin(a)) for a in [math.radians(-20 + 15 * i) for i in range(5)]]
    b.part('wedge', prism(wedge, Y * 0.01), 'wax', subsurf=0, smooth=False)
    # the lid slats on top
    for k in range(3):
        b.part('lid%d' % k, box_bm((W - 0.06, D / 3 - 0.04, 0.03), bevel=0.01, segments=1), 'slat' if k % 2 else 'wood', subsurf=0, M=b.M @ tr(0, -D / 3 + k * D / 3, H / 2 + 0.012))

def build_used(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.94
    b.part('core', box_bm((W, D, H), bevel=0.04, segments=2), 'dark', subsurf=0)
    for k in range(4):
        z = -H / 2 + (k + 0.5) * H / 4
        b.part('slat%d' % k, box_bm((W - 0.04, 0.03, H / 4 - 0.05), bevel=0.01, segments=1), 'wood' if k % 2 else 'slat', subsurf=0, smooth=False,
               M=b.M @ tr(0, -D / 2 - 0.012, z))
    b.part('inside', box_bm((W - 0.1, D - 0.1, 0.03)), 'inside', subsurf=0, M=b.M @ tr(0, 0, H / 2 + 0.002))

# ================================================================ BULB (extra; feet, a tulip bulb)
def build_bulb(b, pose, t, P):
    bloom = P.get('bloom', lambda t: 0.0)(t)
    c = V(0, 0, 0.36)
    b.part('bulb', lathe([(0.0, -0.22), (0.18, -0.18), (0.27, -0.02), (0.24, 0.14), (0.12, 0.28), (0.04, 0.36), (0.0, 0.38)], seg=24), 'skin', M=b.M @ tr(c))
    b.part('papery', lathe([(0.2, -0.12), (0.272, -0.02), (0.245, 0.1), (0.15, 0.22)], seg=24), 'skin_dark', subsurf=1, M=b.M @ tr(c) @ scl(1.02, 1.02, 1.0))
    for k in range(5):   # roots
        a = -0.6 + 0.3 * k
        b.part('root%d' % k, tube([c + V(0.05 * math.sin(a), 0.0, -0.21), c + V(0.12 * math.sin(a), -0.02, -0.28), c + V(0.14 * math.sin(a), 0.0, -0.32)], 0.012, seg=4), 'root', subsurf=0)
    # the sprout (and in 'idle' a bloom opening)
    top = c + V(0.0, 0, 0.38)
    stem_h = 0.18 + 0.22 * bloom
    b.part('sprout', tube([top, top + V(0.02, 0, stem_h * 0.5), top + V(0.0, 0, stem_h)], 0.03, 0.025, seg=6), 'leaf', subsurf=1)
    for s in (-1, 1):
        b.part('leaf%d' % s, cone(top + V(0, 0, 0.02), top + V(s * 0.14, 0, 0.16), 0.05, flat=0.3, seg=8), 'leaf', subsurf=1)
    if bloom > 0.05:
        bt = top + V(0.0, 0, stem_h)
        for k in range(3):
            a = (k - 1) * (0.25 + 0.35 * bloom)
            b.part('petal%d' % k, xf(ellipsoid(V(0, 0, 0.06), X * 0.05, Y * 0.035, Z * 0.08, seg=10, rows=6), tr(bt) @ rot_y(math.degrees(a))), 'petal' if k != 1 else 'petal2', subsurf=1)
    hr = (0.25, 0.25, 0.3)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = on_ellipsoid(c, hr, az, 0.12)
        b.eye(side, p - n * 0.015, n, 0.08, lid=P['lid'], lid_mat='skin', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m:
        surf = ellipsoid_surf(c, 0.26, 0.26, 0.3)
        b.part('mouth', mouth_bm(surf, m, c.z - 0.1, math.radians(-10), math.radians(-95), scale=0.8), 'mouth')
    biped_legs(b, P, t, (0.0, 0, 0.14), (0.07, 0.05, 0.03), 0.03, 'feet', A=0.07, H=0.05, y=0.1)

BULB = std_table({'idle': dict(sx=1.0, sz=1.0, lean=0, lid=0.0, mouth='o', feet='stand', bloom=lambda t: 0.5 + 0.5 * math.sin(TAU * t))},
                 walk_bob=0.025, wobble=4.0)

BUILDERS = {
    'herring': (build_herring, HERRING), 'cheese': (build_cheese, CHEESE), 'clog': (build_clog, CLOG), 'gull': (build_gull, GULL),
    'bee': (build_bee, BEE), 'snowman': (build_snowman, SNOWMAN), 'stroop': (build_stroop, STROOP),
    'coin': (build_coin, COIN), 'star': (build_star, STAR), 'qblock': (build_qblock, {'idle': {}}), 'used': (build_used, {'idle': {}}),
    'bulb': (build_bulb, BULB),
}
build, clear = CK.make_api(BUILDERS)
