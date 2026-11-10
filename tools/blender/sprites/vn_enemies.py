# vn_enemies: the Vietnam cast of Super Brady-O World (world 10) for the pre-rendered Fiesta Toon pipeline.
# All original cartoon designs (food, animals and toys; no people). Helpers: id_charkit.py (shared with Indonesia)
# and a few from id_enemies.py. Z up, every character FACES +X, the camera looks along +Y; 1 m = 28.1 px.
#
#   scooter    a wind-up tin toy scooter piled high with cargo (crates, a rolled mattress, a potted plant), a key
#              in its back                                    walk(t) notice charge stun flat ko        feet, 30 px
#   bao        a steamed bun with twisted pleats and a red dot   walk(t) hop stun flat ko               feet, 24 px
#   roll       a golden fried spring roll; it curls up and rolls walk(t) curl roll(t) stun flat ko     feet, 16 px
#   shrimp     a rainbow mantis shrimp with punching clubs (custom class)  walk(t) notice charge stun flat ko feet, 20 px
#   squid      a pink squid leaping from the bay                 up(t) down(t) ko                       centre, 26 px
#   cormorant  a dark cormorant with an orange throat            fly(t) swoop stun ko                   centre, 30 px
#   mosquito   a gangly mosquito (night: lighter values)         fly(t) swoop stun ko                   centre, 18 px
#   toad       a warty river toad with golden eyes (night: lighter)  walk(t) hop stun flat ko           feet, 18 px
#   goi        a fresh summer roll: rice paper, a pink shrimp and herbs showing through   walk(t) stun flat ko feet, 36 px
#   bat        a small cave bat with big ears (cave: lighter values)  fly(t) swoop stun ko             centre, 28 px
#   caveCrab   a pale blind cave crab with long feelers, eyes shut    walk(t) stun flat ko               feet, 16 px
#   bean       a roasted coffee bean on legs                     walk(t) stun flat ko                   feet, 30 px
#   pho        the pho cart that lends the noodle lasso (an object): a blue cart, a red awning, a steaming pot
#                                                                idle(t)                                feet, 52 px
#   puppet     the citadel's water puppets (animals only), lacquered wood on a rod: fish (kind 0), duck (1),
#              water buffalo (2)                             fish duck buffalo                      feet, 56 px
#   coin       the GOLDEN XU: an old round coin with a square hole    spin(t)                           centre, 17 px
#   star       the GOLDEN LOTUS: a gold lotus bloom with sparkles     idle(t)                           centre, 24 px
#   qblock     the item block: a red silk lantern in a carved wooden frame                               centre, 32 px
#   used       the same frame with the lantern dark                                                      centre, 32 px
# Build: tools/blender/sprites/build_country.sh vn <workdir> enemies
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import id_charkit as CK
from id_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, smooth01, ellipsoid, sphere, blob, ell_cap,
                        tube, cone, lathe, torus, prism, box_bm, superellipsoid, lathe_surf, ellipsoid_surf, oval_patch,
                        make_part, new_root, eye_one, brow, mouth_bm, biped_legs, quad_legs, gait)
import id_enemies as IE
from id_enemies import STD_POSE, fin_fan, thin_face_ink, face_poly

PX = 28.1
KINDS = ['scooter', 'bao', 'roll', 'shrimp', 'squid', 'cormorant', 'mosquito', 'toad', 'goi', 'bat', 'caveCrab', 'bean',
         'pho', 'puppet', 'coin', 'star', 'qblock', 'used']
POSES = {
    'scooter': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'bao': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'roll': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'shrimp': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'squid': ['up', 'down', 'ko'],
    'cormorant': ['fly', 'swoop', 'stun', 'ko'],
    'mosquito': ['fly', 'swoop', 'stun', 'ko'],
    'toad': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'goi': ['walk', 'stun', 'flat', 'ko'],
    'bat': ['fly', 'swoop', 'stun', 'ko'],
    'caveCrab': ['walk', 'stun', 'flat', 'ko'],
    'bean': ['walk', 'stun', 'flat', 'ko'],
    'pho': ['idle'],
    'puppet': ['fish', 'duck', 'buffalo'],
    'coin': ['spin'], 'star': ['idle'], 'qblock': ['idle'], 'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('coin', 'spin'): (6, 10), ('pho', 'idle'): (4, 6),
          ('squid', 'up'): (3, 6), ('squid', 'down'): (3, 6), ('roll', 'roll'): (6, 14)}
for _k, _ps in POSES.items():
    for _p in _ps:
        if _p == 'walk':
            FRAMES.setdefault((_k, _p), (6, 10))
        elif _p in ('fly', 'idle'):
            FRAMES.setdefault((_k, _p), (4, 10 if _p == 'fly' else 6))
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({k: 'centre' for k in ('squid', 'cormorant', 'mosquito', 'bat', 'coin', 'star', 'qblock', 'used')})
HEIGHT = {'scooter': 30 / PX, 'bao': 24 / PX, 'roll': 16 / PX, 'shrimp': 20 / PX, 'toad': 18 / PX, 'goi': 36 / PX,
          'caveCrab': 16 / PX, 'bean': 30 / PX, 'pho': 52 / PX, 'puppet': 56 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'scooter': 36 / PX, 'roll': 26 / PX, 'shrimp': 30 / PX, 'caveCrab': 28 / PX, 'squid': 26 / PX,
             'cormorant': 30 / PX, 'mosquito': 20 / PX, 'bat': 28 / PX, 'coin': 17 / PX, 'star': 24 / PX,
             'qblock': 32 / PX, 'used': 32 / PX, 'pho': 56 / PX, 'puppet': 56 / PX})

COLORS = {
    'scooter_body': '#e8323a', 'scooter_body2': '#c01e28', 'scooter_tin': '#c8ccd8', 'scooter_tyre': '#2a2a30',
    'scooter_hub': '#9a9aa8', 'scooter_lamp': '#ffd23a', 'scooter_crate': '#c8a06a', 'scooter_crate2': '#a8804a',
    'scooter_mattress': '#e8e0f0', 'scooter_stripe': '#7ab8e8', 'scooter_pot': '#c8643a', 'scooter_plant': '#3a8a3a',
    'scooter_key': '#d8d8e0', 'scooter_eye_white': '#fbfbf2', 'scooter_pupil': '#1a1020', 'scooter_mouth': '#3a1a1a',
    'bao_dough': '#fbf4e8', 'bao_pleat': '#e8dcc4', 'bao_dot': '#e8322a', 'bao_steamglow': '#ffffff', 'bao_feet': '#e8d8c0',
    'bao_eye_white': '#fbfbf2', 'bao_pupil': '#1a1020', 'bao_mouth': '#8a4a3a', 'bao_cheek': '#ffb8b0',
    'roll_skin': '#f0a840', 'roll_skin2': '#d8862a', 'roll_bubble': '#ffd88a', 'roll_end': '#c86a1a', 'roll_feet': '#a8601a',
    'roll_eye_white': '#fbfbf2', 'roll_pupil': '#1a1020', 'roll_mouth': '#5a2a0a',
    'shrimp_a': '#2ad8a0', 'shrimp_b': '#ff6a3a', 'shrimp_c': '#3a8aff', 'shrimp_d': '#ffd23a', 'shrimp_club': '#ff4a5a',
    'shrimp_club2': '#ffd8c8', 'shrimp_tail': '#ff7a3a', 'shrimp_stalk': '#3a8a6a', 'shrimp_leg': '#e8a050',
    'shrimp_eye_white': '#ffd23a', 'shrimp_pupil': '#1a1020', 'shrimp_mouth': '#3a1a2a',
    'squid_body': '#f4c4d6', 'squid_fin': '#ff9ac0', 'squid_spot': '#e88aa8', 'squid_arm': '#f0b4c8',
    'squid_eye_white': '#fbfbf2', 'squid_pupil': '#1a1020', 'squid_mouth': '#8a2a4a',
    'cormorant_body': '#2e3038', 'cormorant_body2': '#40424e', 'cormorant_wing': '#262830', 'cormorant_throat': '#ffb03a',
    'cormorant_beak': '#d8c8a0', 'cormorant_feet': '#2a2a30', 'cormorant_eye_white': '#5ae0a0', 'cormorant_pupil': '#1a1020',
    'cormorant_mouth': '#1a1a20',
    'mosquito_body': '#6a6a88', 'mosquito_body2': '#54546e', 'mosquito_stripe': '#e8e8f8', 'mosquito_wing': '#d8e8ff',
    'mosquito_leg': '#3a3a4e', 'mosquito_nose': '#ff6a5a', 'mosquito_eye_white': '#fbfbf2', 'mosquito_pupil': '#1a1020',
    'mosquito_mouth': '#2a1a2a',
    'toad_skin': '#8a9a4a', 'toad_skin2': '#76863c', 'toad_wart': '#b0c06a', 'toad_belly': '#f0e090', 'toad_eye_white': '#ffd23a',
    'toad_pupil': '#1a1020', 'toad_mouth': '#3a3a10',
    'goi_paper': '#f4f0e6', 'goi_paper2': '#e4dccc', 'goi_shrimp': '#ff8a6a', 'goi_shrimp2': '#ffc0a8', 'goi_herb': '#4aa84a',
    'goi_noodle': '#fffaf0', 'goi_feet': '#d8c8b0', 'goi_eye_white': '#fbfbf2', 'goi_pupil': '#1a1020', 'goi_mouth': '#8a5a4a',
    'bat_fur': '#8a7aa8', 'bat_fur2': '#76668e', 'bat_wing': '#6a5a88', 'bat_bone': '#3e3456', 'bat_ear': '#e8a0c0',
    'bat_eye_white': '#fbfbf2', 'bat_pupil': '#1a1020', 'bat_mouth': '#2a1a2a', 'bat_fang': '#ffffff',
    'caveCrab_shell': '#f4eef8', 'caveCrab_shell2': '#ddd2ea', 'caveCrab_claw': '#e8d8f0', 'caveCrab_leg': '#cfc4dc',
    'caveCrab_feeler': '#b8acc8', 'caveCrab_eye_white': '#fbfbf2', 'caveCrab_pupil': '#1a1020', 'caveCrab_mouth': '#6a5a7a',
    'bean_skin': '#7a4a24', 'bean_skin2': '#5e3418', 'bean_crease': '#2a1408', 'bean_shine': '#b07a48', 'bean_feet': '#3a2010',
    'bean_eye_white': '#fbfbf2', 'bean_pupil': '#1a1020', 'bean_mouth': '#1a0a04',
    'pho_cart': '#2a7ad8', 'pho_cart2': '#1e62b8', 'pho_band': '#ffd23a', 'pho_awning': '#e8323a', 'pho_awning2': '#ffffff',
    'pho_post': '#e8e8f0', 'pho_pot': '#b8b8c4', 'pho_pot2': '#8a8a96', 'pho_tyre': '#2a2a30', 'pho_bowl': '#f4f0e8',
    'pho_noodle': '#f6e6ba', 'pho_herb': '#3a9a3a', 'pho_steamglow': '#ffffff', 'pho_sign': '#fff4dc',
    'puppet_rod': '#c8a05a', 'puppet_red': '#d8322a', 'puppet_gold': '#ffc83a', 'puppet_white': '#f8f4ec', 'puppet_bill': '#ffa02a',
    'puppet_black': '#2e2a34', 'puppet_horn': '#ffd23a', 'puppet_blue': '#2a6ad8', 'puppet_eye_white': '#fbfbf2',
    'puppet_pupil': '#1a1020', 'puppet_mouth': '#3a1a1a',
    'coin_gold': '#ffd24a', 'coin_gold2': '#e8a820', 'coin_rim': '#c88a1a', 'coin_hole': '#a86a10',
    'star_gold': '#ffd24a', 'star_gold2': '#ffe890', 'star_gold3': '#e8a820', 'star_leaf': '#e8b830', 'star_glow': '#fff6c0',
    'qblock_frame': '#6a3418', 'qblock_frame2': '#8a4a24', 'qblock_silkglow': '#ff6a3a', 'qblock_silk2glow': '#ffb070',
    'qblock_rib': '#a8221a', 'qblock_gold': '#ffd23a', 'qblock_tassel': '#e8322a',
    'used_frame': '#6a5244', 'used_frame2': '#7a6254', 'used_silk': '#8a5a4a', 'used_silk2': '#9a6a58', 'used_rib': '#5a3a30',
    'used_gold': '#a8946a', 'used_tassel': '#7a4a40',
}
CK.COLORS.update(COLORS)


def clear(kind=None):
    CK.clear(kind if kind else KINDS)


VN_POSE = dict(STD_POSE)
VN_POSE.update({
    'curl': dict(sx=1.05, sz=0.95, lean=14, lid=0.70, mouth='small', feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0, lid=1.00, mouth=None, feet=None),
})


def std(kind, pose):
    return dict(VN_POSE[pose])


def bobs(pose, t, k=0.02, lean=3):
    if pose == 'walk':
        return k * abs(math.sin(TAU * t)), lean * math.sin(TAU * t)
    return 0.0, 0.0


# ================================================================ SCOOTER (a wind-up toy, charger)
def build_scooter(root, pose, t):
    P = std('scooter', pose)
    P.update(er=0.095, skin='scooter_body')
    bob, rock = bobs(pose, t, 0.015, 2)
    lean = {'notice': -6, 'charge': 8, 'stun': -6, 'ko': -16}.get(pose, 0)
    Mx = T((0, 0, bob)) @ about((0, 0, 0.1), rot_y(lean + rock))
    if pose == 'flat':
        Mx = about((0, 0, 0.05), diag(1.25, 1.2, 0.4))
    spin = 360 * t * (3 if pose == 'charge' else 1)
    for k, wx in enumerate((-0.38, 0.4)):
        c = V(wx, 0, 0.17)
        make_part('tyre%d' % k, torus(c, 0.12, 0.06, axis=Y, seg=20, rseg=8), 'scooter_tyre', root, Mx)
        make_part('hub%d' % k, CK.xf(ellipsoid(c, X * 0.07, Y * 0.08, Z * 0.07, seg=10, rows=6), about(c, rot_y(spin))), 'scooter_hub', root, Mx, subsurf=1)
    # the red tin body: a deck between the wheels, a curved front shield
    make_part('deck', superellipsoid((0.0, 0, 0.32), 0.4, 0.14, 0.08, e=0.4, seg=20, rows=8), 'scooter_body', root, Mx)
    make_part('seat', superellipsoid((-0.18, 0, 0.44), 0.22, 0.12, 0.06, e=0.4, seg=16, rows=8), 'scooter_body2', root, Mx)
    shield = [V(0.32, 0, 0.3), V(0.42, 0, 0.45), V(0.46, 0, 0.62), V(0.42, 0, 0.74)]
    make_part('shield', tube(shield, 0.12, 0.09, seg=14), 'scooter_body', root, Mx)
    make_part('bars', tube([V(0.42, -0.18, 0.86), V(0.4, 0, 0.82), V(0.42, 0.18, 0.86)], 0.025, seg=6), 'scooter_tin', root, Mx, subsurf=0)
    make_part('stem', tube([V(0.42, 0, 0.72), V(0.41, 0, 0.84)], 0.03, seg=6), 'scooter_tin', root, Mx, subsurf=0)
    make_part('lamp', sphere(V(0.52, -0.02, 0.66), 0.06, seg=12, rows=8), 'scooter_lamp', root, Mx)
    surf = ellipsoid_surf(V(0.4, 0, 0.55), 0.11, 0.1, 0.18)
    for side, az in (('r', -1.05), ('l', -1.7)):
        p, n = surf(0.56, az)
        eye_one('scooter', side, p + n * 0.01, n, root, Mx, P)
        if P.get('angry'):
            brow('scooter', side, p, n, root, Mx, P['er'], angry=1.0)
    # the impossible cargo stack
    MC = Mx @ about((-0.18, 0, 0.5), rot_y(3 * math.sin(TAU * t * 3) if pose == 'charge' else 0))
    make_part('crate', box_bm((0.36, 0.3, 0.24), bevel=0.02), 'scooter_crate', root, MC @ T((-0.2, 0, 0.62)), subsurf=0)
    make_part('crate_s', box_bm((0.37, 0.31, 0.04), bevel=0.0), 'scooter_crate2', root, MC @ T((-0.2, 0, 0.62)), subsurf=0)
    make_part('mattress', superellipsoid((-0.18, 0, 0.84), 0.26, 0.17, 0.09, e=0.5, seg=16, rows=8), 'scooter_mattress', root, MC)
    make_part('mstripe', ellipsoid(V(-0.18, -0.16, 0.84), X * 0.22, Y * 0.02, Z * 0.03, seg=12, rows=4), 'scooter_stripe', root, MC, subsurf=0)
    make_part('box2', box_bm((0.24, 0.22, 0.16), bevel=0.02), 'scooter_stripe', root, MC @ T((-0.2, 0, 1.01)), subsurf=0)
    make_part('pot', lathe([(0.0, 1.09), (0.07, 1.09), (0.09, 1.2), (0.0, 1.2)], seg=12), 'scooter_pot', root, MC @ T((-0.16, 0, 0)), subsurf=0)
    for k in range(5):
        a = math.pi * (0.15 + 0.7 * k / 4)
        make_part('leaf%d' % k, ellipsoid(V(-0.16 + math.cos(a) * 0.08, 0, 1.24 + math.sin(a) * 0.08), X * 0.05, Y * 0.02, Z * 0.08, seg=8, rows=5), 'scooter_plant', root, MC @ about(V(-0.16, 0, 1.22), rot_y(-math.degrees(a) + 90)), subsurf=1)
    # the wind-up key in its back, turning
    kc = V(-0.46, 0, 0.36)
    MK = Mx @ about(kc, rot_x(360 * t * (3 if pose == 'charge' else 1)))
    make_part('keyshaft', tube([kc + V(0.08, 0, 0), kc], 0.025, seg=6), 'scooter_key', root, Mx, subsurf=0)
    for s in (-1, 1):
        make_part('keywing%d' % s, ellipsoid(kc + V(0, s * 0.08, 0), X * 0.02, Y * 0.07, Z * 0.05, seg=10, rows=6), 'scooter_key', root, MK, subsurf=1)
    if pose == 'charge':
        for k in range(3):
            make_part('dust%d' % k, sphere(V(-0.6 - 0.12 * k, -0.1, 0.08 + 0.05 * k), 0.06 - 0.012 * k, seg=8, rows=5), 'scooter_mattress', root, None, subsurf=1)


# ================================================================ BAO (hopper)
BAO_PROF = [(0.0, 0.0), (0.33, 0.0), (0.4, 0.08), (0.42, 0.2), (0.36, 0.38), (0.22, 0.52), (0.08, 0.6), (0.0, 0.62)]


def build_bao(root, pose, t):
    P = std('bao', pose)
    P.update(er=0.08, skin='bao_dough', mouth={'walk': 'smile'}.get(pose, P['mouth']))
    sx, sz, lean = P['sx'], P['sz'], P['lean']
    bob, rock = bobs(pose, t, 0.03, 4)
    lift = 0.12 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift + 0.06)) @ rot_y(lean + rock) @ diag(sx, sx, sz)
    make_part('bun', lathe(BAO_PROF, seg=28), 'bao_dough', root, Mx)
    # the twisted pleats spiralling to the top knot
    for k in range(9):
        a = TAU * k / 9
        pts = []
        for j in range(6):
            u = j / 5
            r = 0.36 * (1 - u) + 0.03
            pts.append(V(r * math.cos(a + u * 0.9), r * math.sin(a + u * 0.9), 0.36 + 0.24 * u + 0.02))
        make_part('pleat%d' % k, tube(pts, 0.016, 0.01, seg=5), 'bao_pleat', root, Mx, subsurf=0)
    make_part('knot', sphere(V(0, 0, 0.63), 0.05, seg=10, rows=6), 'bao_pleat', root, Mx)
    make_part('dot', sphere(V(0.0, -0.03, 0.66), 0.035, seg=8, rows=5), 'bao_dot', root, Mx, subsurf=0)
    surf = lathe_surf(BAO_PROF)
    for side, az in (('r', -1.15), ('l', -1.95)):
        p, n = surf(0.27, az)
        eye_one('bao', side, p + n * 0.005, n, root, Mx, P)
    if P['mouth']:
        make_part('mouth', mouth_bm(surf, P['mouth'], 0.16, -1.3, -1.85, scale=0.9), 'bao_mouth', root, Mx)
    for side, az in (('r', -0.95), ('l', -2.2)):
        p, n = surf(0.18, az)
        make_part('cheek_' + side, ellipsoid(p + n * 0.005, X * 0.04, Y * 0.04, Z * 0.025, seg=8, rows=5), 'bao_cheek', root, Mx @ about(p, Matrix.Identity(4)), subsurf=0)
    if pose in ('walk', 'hop'):
        for k in range(2):
            ph = (t + k * 0.5) % 1
            make_part('steam%d' % k, sphere(V(-0.05 + 0.1 * k, -0.05, 0.72 + 0.3 * ph), 0.05 + 0.04 * ph, seg=8, rows=5), 'bao_steamglow', root, Mx, subsurf=1)
    if pose != 'flat':
        biped_legs('bao', root, T((0, 0, lift)), P, t, (0.0, 0.11, 0.08), (0.09, 0.06, 0.04), 0.035, 'bao_feet')


# ================================================================ ROLL (a fried spring roll; roller)
def roll_body(root, M, kind='roll'):
    c = V(0, 0, 0.0)
    make_part('body', superellipsoid(c, 0.42, 0.2, 0.2, e=0.85, seg=24, rows=12), 'roll_skin', root, M)
    for k in range(9):
        x = -0.34 + k * 0.085
        make_part('bub%d' % k, sphere(V(x, -0.17 - 0.02 * (k % 2), 0.06 * ((k * 3) % 3 - 1)), 0.035, seg=8, rows=5), 'roll_bubble', root, M, subsurf=0)
    for s in (-1, 1):
        make_part('end%d' % s, ellipsoid(V(s * 0.41, 0, 0), X * 0.04, Y * 0.17, Z * 0.17, seg=14, rows=6), 'roll_end', root, M, subsurf=1)
    make_part('seam', tube([V(-0.38, -0.12, 0.15), V(0.0, -0.15, 0.13), V(0.38, -0.12, 0.15)], 0.014, seg=5), 'roll_skin2', root, M, subsurf=0)


def build_roll(root, pose, t):
    P = std('roll', pose)
    P.update(er=0.075, skin='roll_skin')
    bob, rock = bobs(pose, t, 0.02, 2)
    c = V(0, 0, 0.24)
    if pose == 'roll':
        MR = T(c) @ rot_y(360 * t)
        roll_body(root, MR)
        return
    if pose == 'curl':
        MR = T(c) @ rot_y(25) @ diag(0.9, 1, 1.1)
        roll_body(root, MR)
        return
    sx, sz = P['sx'], P['sz']
    Mx = T((0, 0, bob)) @ T(c) @ rot_y(P['lean'] * 0.3 + rock) @ diag(sx, sx, sz)
    roll_body(root, Mx)
    surf = ellipsoid_surf((0, 0, 0), 0.42, 0.2, 0.2)
    for side, ex in (('r', 0.24), ('l', 0.12)):
        p = V(ex, -0.19, 0.06)
        n = V(0.2, -1, 0.2).normalized()
        eye_one('roll', side, p, n, root, Mx, P)
        if P.get('angry'):
            brow('roll', side, p, n, root, Mx, P['er'])
    make_part('mouth', tube([V(0.3, -0.19, -0.06), V(0.24, -0.2, -0.08), V(0.18, -0.19, -0.06)], 0.014, seg=5), 'roll_mouth', root, Mx, subsurf=1)
    if pose != 'flat':
        biped_legs('roll', root, T((0, 0, bob)), P, t, (0.0, 0.1, 0.1), (0.08, 0.05, 0.035), 0.03, 'roll_feet')


# ================================================================ SHRIMP (custom class: a mantis shrimp, charger)
def build_shrimp(root, pose, t):
    P = std('shrimp', pose)
    P.update(er=0.05, skin='shrimp_a', lid=0.0)
    bob, rock = bobs(pose, t, 0.012, 2)
    Mx = T((0, 0, bob)) @ rot_y(rock)
    if pose == 'flat':
        Mx = about((0, 0, 0.0), diag(1.2, 1.2, 0.4))
    if pose == 'ko':
        Mx = about((0, 0, 0.2), rot_y(-20))
    segs = ['shrimp_a', 'shrimp_b', 'shrimp_c', 'shrimp_d', 'shrimp_a']
    for k, m in enumerate(segs):
        x = -0.36 + k * 0.15
        make_part('seg%d' % k, blob(V(x, 0, 0.24 + 0.02 * (2 - abs(k - 2))), 0.1, 0.13, 0.13 - 0.01 * abs(k - 2), seg=16, rows=10), m, root, Mx)
    fin_fan('tail', root, Mx, V(-0.44, 0, 0.22), [V(-1, 0, 0.8), V(-1, 0, 0.2), V(-1, 0, -0.3)], (0.18, 0.2, 0.16), 'shrimp_tail')
    hc = V(0.28, 0, 0.3)
    make_part('head', blob(hc, 0.13, 0.12, 0.12, seg=16, rows=10), 'shrimp_b', root, Mx)
    # the stalked eyes and the cocked club arms
    for side, sy in (('r', -0.06), ('l', 0.06)):
        st = [hc + V(0.06, sy, 0.08), hc + V(0.1, sy * 1.6, 0.26)]
        make_part('stalk_' + side, tube(st, 0.022, seg=6), 'shrimp_stalk', root, Mx, subsurf=0)
        n = V(0.4, -0.9, 0.15).normalized()
        eye_one('shrimp', side, st[1], n, root, Mx, P, er=0.055)
    punch = {'charge': 0.2, 'notice': -0.06}.get(pose, 0.03 * math.sin(TAU * t))
    arm = [hc + V(0.06, -0.1, -0.05), hc + V(0.18 + punch * 0.5, -0.14, -0.04), hc + V(0.28 + punch, -0.14, 0.03)]
    make_part('arm', tube(arm, 0.035, 0.03, seg=8), 'shrimp_club', root, Mx)
    make_part('club', blob(arm[-1] + V(0.05, 0, 0.0), 0.08, 0.06, 0.06, seg=12, rows=8), 'shrimp_club', root, Mx)
    make_part('knuckle', sphere(arm[-1] + V(0.11, -0.01, 0.0), 0.04, seg=8, rows=5), 'shrimp_club2', root, Mx, subsurf=0)
    if pose == 'charge':
        for k in range(3):
            make_part('pow%d' % k, torus(arm[-1] + V(0.18 + 0.06 * k, 0, 0), 0.05 + 0.04 * k, 0.012, axis=X, seg=14, rseg=4), 'shrimp_club2', root, Mx, subsurf=0)
    make_part('mouth', mouth_bm(ellipsoid_surf(hc, 0.13, 0.12, 0.12), P['mouth'] if P['mouth'] != 'grin' else 'smile', hc.z - 0.05, -0.4, -1.0, scale=0.6), 'shrimp_mouth', root, Mx)
    if pose != 'flat':
        for k in range(4):
            x = -0.22 + k * 0.13
            for sy in (-0.08, 0.08):
                dx, dz = gait(t, k * 1.3 + (0 if sy < 0 else math.pi), 0.04, 0.03) if pose == 'walk' else (0.0, 0.0)
                make_part('leg%d%s' % (k, 'n' if sy < 0 else 'f'), tube([V(x, sy, 0.15), V(x + dx + 0.03, sy * 1.6, 0.03 + dz)], 0.018, 0.012, seg=5), 'shrimp_leg', root, Mx, subsurf=0)


# ================================================================ SQUID (leaper, centre)
def build_squid(root, pose, t):
    P = {'er': 0.065, 'skin': 'squid_body', 'lid': 0.1}
    Mx = Matrix.Identity(4) if pose == 'up' else rot_y(180) if pose == 'down' else rot_y(150)
    if pose == 'ko':
        P['x'] = True
    mantle = [(0.0, -0.05), (0.14, -0.02), (0.17, 0.12), (0.15, 0.28), (0.09, 0.42), (0.0, 0.48)]
    make_part('mantle', lathe(mantle, seg=20), 'squid_body', root, Mx @ diag(1, 0.85, 1))
    for s in (-1, 1):
        make_part('fin%d' % s, prism([V(s * 0.08, 0, 0.44), V(s * 0.26, 0, 0.3), V(s * 0.1, 0, 0.24)], Y * 0.03), 'squid_fin', root, Mx, subsurf=1)
    for k, (x, z) in enumerate(((-0.06, 0.32), (0.05, 0.22), (-0.03, 0.12))):
        make_part('spot%d' % k, ellipsoid(V(x, -0.13, z), X * 0.025, Y * 0.01, Z * 0.02, seg=8, rows=4), 'squid_spot', root, Mx, subsurf=0)
    surf = lathe_surf(mantle)
    for side, az in (('r', -1.25), ('l', -1.9)):
        p, n = surf(0.04, az)
        eye_one('squid', side, p, n, root, Mx @ diag(1, 0.85, 1), P)
    for k in range(6):
        x0 = -0.1 + k * 0.04
        pts = [V(x0 * (1 + 0.6 * j / 4) + 0.03 * math.sin(TAU * t + k + j), -0.02 + 0.01 * k, -0.06 - 0.09 * j) for j in range(5)]
        make_part('arm%d' % k, tube(pts, 0.025, 0.01, seg=6), 'squid_arm', root, Mx, subsurf=1)


# ================================================================ birds / bugs / bats (flyers, centre)
def build_cormorant(root, pose, t):
    P = {'er': 0.055, 'skin': 'cormorant_body', 'lid': 0.2, 'look': Vector((0.7, -0.7, 0.0))}
    flap, tilt = (math.sin(TAU * t), 0) if pose == 'fly' else (-0.6, 24) if pose == 'swoop' else (0.3, 0)
    if pose == 'stun':
        P.update(dazed=True, lid=0.5)
    Mx = rot_y(tilt) if pose != 'ko' else rot_x(180)
    if pose == 'ko':
        P['x'] = True
    bc = V(-0.05, 0, 0.0)
    make_part('body', blob(bc, 0.28, 0.13, 0.13, seg=20, rows=10), 'cormorant_body', root, Mx)
    make_part('neck', tube([V(0.18, 0, 0.04), V(0.3, 0, 0.12), V(0.38, 0, 0.14)], 0.07, 0.06, seg=10), 'cormorant_body', root, Mx)
    hc = V(0.42, 0, 0.16)
    make_part('head', blob(hc, 0.09, 0.08, 0.08, seg=14, rows=8), 'cormorant_body2', root, Mx)
    make_part('throat', blob(hc + V(0.02, -0.02, -0.06), 0.07, 0.06, 0.04, seg=10, rows=6), 'cormorant_throat', root, Mx)
    make_part('beak', cone(hc + V(0.06, 0, -0.01), hc + V(0.26, 0, -0.04), 0.035, flat=0.7, seg=10), 'cormorant_beak', root, Mx)
    make_part('hook', cone(hc + V(0.25, 0, -0.03), hc + V(0.28, 0, -0.07), 0.015, seg=6), 'cormorant_beak', root, Mx, subsurf=0)
    p, n = ellipsoid_surf(hc, 0.09, 0.08, 0.08)(hc.z + 0.02, -1.15)
    eye_one('cormorant', 'r', p, n, root, Mx, P, er=0.045)
    make_part('tail', prism([V(-0.3, 0, 0.02), V(-0.5, 0, 0.05), V(-0.5, 0, -0.04)], Y * 0.06), 'cormorant_wing', root, Mx, subsurf=0, smooth=False)
    for side, sgn, ph in (('f', 1, 0.3), ('n', -1, 0.0)):
        f = math.sin(TAU * t + ph) if pose == 'fly' else flap
        sh = V(0.02, sgn * 0.12, 0.06)
        d = V(-0.4, 0, 0.9 * f + 0.2).normalized()
        e = V(-d.z, 0, d.x)
        make_part('wing_' + side, ellipsoid(sh + d * 0.28, d * 0.32, Y * 0.03, e * 0.13, seg=16, rows=8), 'cormorant_body2' if side == 'f' else 'cormorant_wing', root, Mx)
    make_part('feet', tube([V(-0.25, 0, -0.08), V(-0.36, 0, -0.12)], 0.025, seg=6), 'cormorant_feet', root, Mx, subsurf=0)


def build_mosquito(root, pose, t):
    P = {'er': 0.06, 'skin': 'mosquito_body', 'lid': 0.1, 'look': Vector((0.6, -0.8, 0.0))}
    tilt = 20 if pose == 'swoop' else 0
    if pose == 'stun':
        P.update(dazed=True, lid=0.5)
    Mx = rot_y(tilt) if pose != 'ko' else rot_x(180)
    if pose == 'ko':
        P['x'] = True
    make_part('abdomen', blob(V(-0.16, 0, -0.02), 0.17, 0.07, 0.07, seg=14, rows=8), 'mosquito_body', root, Mx @ about(V(0, 0, 0), rot_y(-12)))
    for k in range(3):
        make_part('band%d' % k, torus(V(-0.1 - 0.08 * k, 0, 0.0 + 0.016 * k), 0.065 - 0.01 * k, 0.012, axis=X, seg=12, rseg=4), 'mosquito_stripe', root, Mx @ about(V(0, 0, 0), rot_y(-12)), subsurf=0)
    make_part('thorax', blob(V(0.03, 0, 0.02), 0.08, 0.07, 0.08, seg=12, rows=8), 'mosquito_body2', root, Mx)
    hc = V(0.13, 0, 0.04)
    make_part('head', sphere(hc, 0.07, seg=14, rows=8), 'mosquito_body', root, Mx)
    make_part('nose', tube([hc + V(0.06, 0, -0.02), hc + V(0.24, 0, -0.08)], 0.012, 0.005, seg=5), 'mosquito_nose', root, Mx, subsurf=0)
    p, n = ellipsoid_surf(hc, 0.07, 0.07, 0.07)(hc.z + 0.02, -1.2)
    eye_one('mosquito', 'r', p, n, root, Mx, P, er=0.05)
    beat = math.sin(TAU * t * 2) if pose == 'fly' else 0.4
    for sgn in (-1, 1):
        wc = V(0.0, sgn * 0.03, 0.12)
        make_part('wing%d' % sgn, ellipsoid(wc + V(-0.06, 0, 0.12), X * 0.06, Y * 0.01, Z * 0.15, seg=12, rows=6), 'mosquito_wing', root, Mx @ about(wc, rot_y(-30 + 30 * beat * sgn)), subsurf=1)
    for k in range(3):
        a0 = V(0.04 - 0.04 * k, -0.04, -0.04)
        make_part('leg%d' % k, tube([a0, a0 + V(0.06 - 0.06 * k, -0.02, -0.12), a0 + V(0.04 - 0.1 * k, -0.02, -0.22)], 0.01, 0.006, seg=4), 'mosquito_leg', root, Mx, subsurf=0)


def build_bat(root, pose, t):
    P = {'er': 0.07, 'skin': 'bat_fur', 'lid': 0.1, 'look': Vector((0.5, -0.85, -0.2))}
    flap, tilt, roll = 0.0, 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.6, 28
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.9, True, 0.5
    else:
        flap, P['x'], roll = -0.7, True, 180
    Mx = rot_y(tilt) @ (rot_y(roll) if roll else Matrix.Identity(4))
    bc = V(0, 0, -0.02)
    make_part('body', blob(bc, 0.14, 0.12, 0.16, seg=18, rows=10), 'bat_fur', root, Mx)
    make_part('belly', ell_cap(bc, (0.14, 0.12, 0.16), (0.2, -1, -0.3), 45, seg=14, rows=5), 'bat_fur2', root, Mx)
    hc, hr = V(0.02, 0, 0.18), 0.14
    make_part('head', sphere(hc, hr, seg=18, rows=10), 'bat_fur', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        base = hc + V(sgn * 0.07, 0, 0.09)
        tip = hc + V(sgn * 0.15, 0, 0.32)
        make_part('ear_' + side, cone(base, tip, 0.075, flat=0.45, seg=10), 'bat_fur', root, Mx)
        make_part('earin_' + side, cone(base + V(0, -0.03, 0.02), tip + V(0, -0.03, -0.06), 0.045, flat=0.3, seg=8), 'bat_ear', root, Mx, subsurf=1)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -1.25), ('l', -1.95)):
        p, n = hsurf(0.2, az)
        eye_one('bat', side, p - n * 0.01, n, root, Mx, P)
    p, n = hsurf(0.1, -1.6)
    if not P.get('x'):
        make_part('fang', cone(p + V(0.03, -0.01, 0.0), p + V(0.03, -0.02, -0.05), 0.016, seg=6), 'bat_fang', root, Mx, subsurf=0)
    make_part('mouth', mouth_bm(hsurf, 'smile' if pose != 'stun' else 'wobble', 0.11, -1.35, -1.85, scale=0.7), 'bat_mouth', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        shoulder = V(sgn * 0.1, 0.02, 0.04)
        up = 0.3 * flap
        fingers = [shoulder + V(sgn * 0.26, 0.05, 0.12 + up * 0.6), shoulder + V(sgn * 0.44, 0.06, 0.02 + up),
                   shoulder + V(sgn * 0.38, 0.06, -0.14 + up * 0.8), shoulder + V(sgn * 0.2, 0.05, -0.18 + up * 0.4)]
        for k in range(len(fingers) - 1):
            a, b = fingers[k], fingers[k + 1]
            notch = shoulder + ((a + b) / 2 - shoulder) * 0.78
            make_part('wing_%s%d' % (side, k), prism([shoulder, a, notch, b], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        for k, f in enumerate(fingers):
            make_part('bone_%s%d' % (side, k), tube([shoulder + V(0, -0.012, 0), f + V(0, -0.012, 0)], 0.014, 0.009, seg=6), 'bat_bone', root, Mx, subsurf=0)


# ================================================================ TOAD (hopper; night: lighter values)
def build_toad(root, pose, t):
    P = std('toad', pose)
    P.update(er=0.075, skin='toad_skin', lid=0.35 if pose == 'walk' else P['lid'], mouth='flat' if pose == 'walk' else P['mouth'])
    bob, rock = bobs(pose, t, 0.015, 2)
    lift = 0.12 if pose == 'hop' else 0.0
    sx, sz = P['sx'], P['sz']
    Mx = T((0, 0, bob + lift)) @ rot_y(P['lean'] * 0.5 + rock) @ diag(sx, sx, sz)
    bc, br = V(0, 0, 0.26), (0.32, 0.26, 0.22)
    make_part('body', blob(bc, *br, seg=24, rows=12), 'toad_skin', root, Mx)
    make_part('belly', ell_cap(bc, br, (0.5, -0.5, -0.6), 45, seg=16, rows=5), 'toad_belly', root, Mx)
    surf = ellipsoid_surf(bc, *br)
    for k, (zc, ac) in enumerate(((0.38, -2.0), (0.32, -2.5), (0.42, -2.7), (0.3, -1.7), (0.44, -2.3))):
        p, n = surf(zc, ac)
        make_part('wart%d' % k, sphere(p, 0.035, seg=8, rows=5), 'toad_wart', root, Mx, subsurf=0)
    for side, ec in (('r', V(0.2, -0.12, 0.44)), ('l', V(0.16, 0.08, 0.46))):
        make_part('bump_' + side, sphere(ec, 0.085, seg=14, rows=8), 'toad_skin2', root, Mx)
        n = (V(0.5, -0.8, 0.35) if side == 'r' else V(0.6, -0.6, 0.5)).normalized()
        eye_one('toad', side, ec + n * 0.02, n, root, Mx, P, er=0.065)
    grin = [surf(0.22, a)[0] + V(0, -0.005, 0) for a in (-0.25, -0.6, -0.95, -1.3)]
    make_part('mouth', tube(grin, 0.016, seg=6), 'toad_mouth', root, Mx, subsurf=1)
    hips = {'fl': V(0.18, -0.16, 0.14), 'fr': V(0.18, 0.16, 0.14), 'bl': V(-0.18, -0.2, 0.14), 'br': V(-0.18, 0.2, 0.14)}
    P2 = dict(P)
    if pose == 'hop':
        P2['feet'] = 'tuck'
    quad_legs('toad', root, T((0, 0, lift)), P2, t, hips, 0.03, 0.05, (0.08, 0.06, 0.03), 'toad_skin', A=0.06, H=0.04, foot_mat='toad_skin2')


# ================================================================ GOI (a fresh summer roll, walker)
def build_goi(root, pose, t):
    P = std('goi', pose)
    P.update(er=0.08, skin='goi_paper')
    bob, rock = bobs(pose, t, 0.03, 4)
    sx, sz = P['sx'], P['sz']
    Mx = T((0, 0, bob)) @ about((0, 0, 0.15), rot_y(P['lean'] + rock) @ diag(sx, sx, sz))
    c = V(0, 0, 0.72)
    make_part('roll', superellipsoid(c, 0.25, 0.22, 0.5, e=0.8, seg=24, rows=14), 'goi_paper', root, Mx)
    # what shows through the rice paper: two pink shrimp halves, herbs, noodles
    surf = ellipsoid_surf(c, 0.25, 0.22, 0.5)
    # curled pink shrimp halves (C shapes) and a band of herbs showing through the lower half of the paper
    for k, (zc, ac) in enumerate(((0.56, -1.95), (0.5, -1.3))):
        arc = []
        for j in range(8):
            u = j / 7
            a = math.pi * (0.2 + 1.4 * u)
            p, n = surf(zc + 0.08 * math.sin(a), ac + 0.22 * math.cos(a))
            arc.append(p + n * 0.012)
        make_part('shrimp%d' % k, tube(arc, 0.035, 0.02, seg=6), 'goi_shrimp', root, Mx, subsurf=0)
    make_part('herb', oval_patch(surf, 0.36, 0.05, -1.6, 0.9, rows=4, cols=10), 'goi_herb', root, Mx)
    # a sprig of herb sticking out of the top
    for k in range(3):
        a = -0.6 + 0.6 * k
        make_part('sprig%d' % k, ellipsoid(c + V(math.sin(a) * 0.12, 0, 0.55 + math.cos(a) * 0.06), X * 0.04, Y * 0.02, Z * 0.09, seg=8, rows=5), 'goi_herb', root, Mx @ about(c + V(0, 0, 0.48), rot_y(math.degrees(a))), subsurf=1)
    for side, az in (('r', -1.2), ('l', -1.95)):
        p, n = surf(1.02, az)
        eye_one('goi', side, p + n * 0.005, n, root, Mx, P)
    if P['mouth'] and pose != 'flat':
        make_part('mouth', mouth_bm(surf, P['mouth'], 0.82, -1.3, -1.85, scale=0.9), 'goi_mouth', root, Mx)
    if pose != 'flat':
        biped_legs('goi', root, T((0, 0, bob)), P, t, (0.0, 0.1, 0.24), (0.09, 0.06, 0.04), 0.035, 'goi_feet')


# ================================================================ CAVE CRAB (walker; blind)
def build_caveCrab(root, pose, t):
    P = std('caveCrab', pose)
    P.update(er=0.05, skin='caveCrab_shell', lid=1.0)            # blind: eyes always shut
    if pose == 'ko':
        P['lid'] = 0.0
    bob, _ = bobs(pose, t, 0.015, 0)
    Mx = T((0, 0, bob))
    if pose == 'flat':
        Mx = about((0, 0, 0.0), diag(1.2, 1.2, 0.4))
    if pose == 'ko':
        Mx = about((0, 0, 0.2), rot_y(20))
    view = rot_z(-30)                                              # crabs walk sideways: show it three-quarter
    MV = Mx @ view
    bc, br = V(0, 0, 0.3), (0.3, 0.22, 0.16)
    make_part('shell', blob(bc, *br, seg=24, rows=12), 'caveCrab_shell', root, MV)
    make_part('shell2', ell_cap(bc, br, (0, 0, 1), 40, seg=18, rows=5), 'caveCrab_shell2', root, MV)
    for side, sgn in (('n', -1), ('f', 1)):
        for k in range(3):
            ph = k * 1.1 + (0 if sgn < 0 else math.pi)
            dz = 0.04 * max(0, math.sin(TAU * t + ph)) if pose == 'walk' else 0
            a0 = V(-0.12 + 0.12 * k, sgn * 0.18, 0.26)
            knee = a0 + V(0.0, sgn * 0.16, 0.12 + dz)
            foot = a0 + V(0.02, sgn * 0.28, -0.24 + dz)
            make_part('leg%s%d' % (side, k), tube([a0, knee, foot], 0.022, 0.014, seg=6), 'caveCrab_leg', root, MV, subsurf=0)
        cl = V(0.28, sgn * 0.16, 0.3)
        make_part('arm_' + side, tube([V(0.2, sgn * 0.12, 0.3), cl], 0.035, seg=8), 'caveCrab_leg', root, MV, subsurf=0)
        make_part('claw_' + side, blob(cl + V(0.08, 0, 0.04), 0.1, 0.06, 0.07, seg=12, rows=8), 'caveCrab_claw', root, MV)
        make_part('pincer_' + side, cone(cl + V(0.14, 0, 0.1), cl + V(0.22, 0, 0.14), 0.03, seg=6), 'caveCrab_claw', root, MV, subsurf=0)
    # long, sensitive feelers instead of sight
    for side, sgn in (('n', -1), ('f', 1)):
        w = 0.05 * math.sin(TAU * t + sgn)
        make_part('feeler_' + side, tube([V(0.26, sgn * 0.05, 0.38), V(0.42, sgn * 0.1, 0.56 + w), V(0.6, sgn * 0.14, 0.62 + w * 2)], 0.012, 0.006, seg=5), 'caveCrab_feeler', root, MV, subsurf=0)
    surf = ellipsoid_surf(bc, *br)
    for side, az in (('r', -0.55), ('l', -0.05)):
        p, n = surf(0.38, az)
        eye_one('caveCrab', side, p, n, root, MV, P)
    make_part('mouth', mouth_bm(surf, 'smile' if pose == 'walk' else P['mouth'] or 'flat', 0.27, -0.6, 0.0, scale=0.7), 'caveCrab_mouth', root, MV)


# ================================================================ BEAN (a coffee bean, walker)
def build_bean(root, pose, t):
    P = std('bean', pose)
    P.update(er=0.08, skin='bean_skin')
    bob, rock = bobs(pose, t, 0.025, 4)
    sx, sz = P['sx'], P['sz']
    Mx = T((0, 0, bob)) @ about((0, 0, 0.15), rot_y(P['lean'] + rock) @ diag(sx, sx, sz))
    c, r = V(0, 0, 0.62), (0.28, 0.24, 0.4)
    make_part('bean', blob(c, *r, seg=24, rows=14), 'bean_skin', root, Mx)
    surf = ellipsoid_surf(c, *r)
    make_part('shine', oval_patch(surf, 0.85, 0.06, -2.1, 0.22), 'bean_shine', root, Mx)
    # the crease runs down the flat side, an S across the face toward the camera
    crease = [surf(c.z + r[2] * 0.85 - 1.7 * r[2] * j / 8, -1.57 + 0.35 * math.sin(math.pi * j / 8))[0] + V(0, -0.012, 0) for j in range(9)]
    make_part('crease', tube(crease, 0.022, seg=6), 'bean_crease', root, Mx, subsurf=1)
    for side, az in (('r', -1.05), ('l', -2.05)):
        p, n = surf(0.74, az)
        eye_one('bean', side, p, n, root, Mx, P)
    if P['mouth'] and pose != 'flat':
        make_part('mouth', mouth_bm(surf, P['mouth'], 0.5, -0.95, -1.35, scale=0.8), 'bean_mouth', root, Mx)
    if pose != 'flat':
        biped_legs('bean', root, T((0, 0, bob)), P, t, (0.0, 0.1, 0.26), (0.09, 0.06, 0.04), 0.035, 'bean_feet')


# ================================================================ PHO cart (an object: the noodle-lasso giver)
def build_pho(root, pose, t):
    M = rot_z(-18)
    for k, wx in enumerate((-0.55, 0.55)):
        make_part('tyre%d' % k, torus(V(wx, -0.2, 0.2), 0.16, 0.06, axis=Y, seg=18, rseg=8), 'pho_tyre', root, M)
    make_part('cart', box_bm((1.6, 0.7, 0.66), bevel=0.06), 'pho_cart', root, M @ T((0, 0, 0.72)), subsurf=0)
    make_part('band', box_bm((1.62, 0.72, 0.1), bevel=0.0), 'pho_band', root, M @ T((0, 0, 0.82)), subsurf=0)
    make_part('top', box_bm((1.7, 0.78, 0.06), bevel=0.02), 'pho_cart2', root, M @ T((0, 0, 1.07)), subsurf=0)
    for k, x in enumerate((-0.74, 0.74)):
        make_part('post%d' % k, tube([V(x, -0.3, 1.08), V(x, -0.3, 1.66)], 0.035, seg=6), 'pho_post', root, M, subsurf=0)
    for k in range(6):
        x0 = -0.92 + k * 0.307
        make_part('awn%d' % k, box_bm((0.31, 0.9, 0.06), bevel=0.0), 'pho_awning' if k % 2 == 0 else 'pho_awning2', root, M @ T((x0 + 0.153, -0.12, 1.7)) @ rot_x(10), subsurf=0)
    for k in range(6):
        make_part('scal%d' % k, ellipsoid(V(-0.92 + (k + 0.5) * 0.307, -0.58, 1.6), X * 0.15, Y * 0.04, Z * 0.07, seg=10, rows=6), 'pho_awning' if k % 2 else 'pho_awning2', root, M, subsurf=1)
    # the big stock pot, a bowl of pho with noodles and herbs, steam rising (unlit)
    make_part('pot', lathe([(0.0, 1.1), (0.24, 1.1), (0.26, 1.14), (0.26, 1.48), (0.28, 1.5), (0.0, 1.5)], seg=20), 'pho_pot', root, M @ T((-0.42, 0, 0)), subsurf=0)
    make_part('potband', torus((-0.42, 0, 1.3), 0.265, 0.02, seg=20, rseg=5), 'pho_pot2', root, M, subsurf=0)
    make_part('bowl', lathe([(0.0, 1.1), (0.1, 1.1), (0.2, 1.2), (0.22, 1.26), (0.0, 1.26)], seg=18), 'pho_bowl', root, M @ T((0.36, -0.1, 0)), subsurf=1)
    for k in range(4):
        a = -0.6 + 0.4 * k
        make_part('noodle%d' % k, tube([V(0.36 + 0.12 * math.cos(a), -0.1 + 0.05 * math.sin(a), 1.26), V(0.36 + 0.05 * math.cos(a + 0.6), -0.12, 1.33 + 0.02 * math.sin(TAU * t + k)), V(0.36 - 0.06 * math.cos(a), -0.1, 1.27)], 0.014, seg=5), 'pho_noodle', root, M, subsurf=0)
    for k in range(3):
        make_part('herb%d' % k, ellipsoid(V(0.3 + 0.07 * k, -0.15, 1.28), X * 0.04, Y * 0.03, Z * 0.015, seg=8, rows=4), 'pho_herb', root, M, subsurf=0)
    for k in range(3):
        ph = (t + k / 3) % 1
        make_part('steam%d' % k, sphere(V(-0.42 + 0.08 * math.sin(ph * 6 + k), -0.1, 1.62 + 0.45 * ph), 0.07 + 0.08 * ph, seg=8, rows=5), 'pho_steamglow', root, M, subsurf=1)
    # a little sign panel with a drawn bowl (no words)
    make_part('sign', box_bm((0.7, 0.04, 0.34), bevel=0.02), 'pho_sign', root, M @ T((0.2, -0.37, 0.66)), subsurf=0)
    make_part('signbowl', lathe([(0.0, -0.08), (0.12, -0.02), (0.14, 0.04), (0.0, 0.04)], seg=14), 'pho_awning', root, M @ T((0.2, -0.4, 0.66)) @ diag(1, 0.2, 1), subsurf=0)


# ================================================================ PUPPET (water puppets: animals only, on a rod)
def build_puppet(root, pose, t):
    P = {'er': 0.08, 'skin': 'puppet_red', 'lid': 0.1, 'look': Vector((0.6, -0.8, 0.0))}
    make_part('rod', tube([V(0, 0, 0.0), V(0, 0, 0.75)], 0.05, seg=8), 'puppet_rod', root, None, subsurf=0)
    if pose == 'fish':
        # a lacquered carp: red body, gold scales and fins, a curled tail
        M = T((0, 0, 1.2)) @ rot_y(-15)
        make_part('body', blob(V(0, 0, 0), 0.42, 0.18, 0.28, seg=24, rows=12), 'puppet_red', root, M)
        surf = ellipsoid_surf(V(0, 0, 0), 0.42, 0.18, 0.28)
        for k in range(3):
            for j in range(2):
                make_part('scale%d%d' % (k, j), oval_patch(surf, 0.05 - 0.12 * j, 0.04, -1.9 + 0.32 * k, 0.12, rows=4, cols=6), 'puppet_gold', root, M)
        fin_fan('tail', root, M, V(-0.38, 0, 0.0), [V(-0.6, 0, 1), V(-1, 0, 0.2), V(-0.8, 0, -0.8)], (0.3, 0.26, 0.28), 'puppet_gold')
        fin_fan('dorsal', root, M, V(0.0, 0, 0.26), [V(0.2, 0, 1), V(-0.6, 0, 0.9)], (0.18, 0.2), 'puppet_gold')
        make_part('barbel', tube([V(0.38, -0.08, -0.06), V(0.52, -0.1, -0.14), V(0.56, -0.1, -0.24)], 0.014, seg=5), 'puppet_gold', root, M, subsurf=0)
        p, n = surf(0.08, -0.85)
        eye_one('puppet', 'r', p, n, root, M, P)
        make_part('mouth', mouth_bm(surf, 'o', -0.06, -0.3, -0.55, scale=0.8), 'puppet_mouth', root, M)
    elif pose == 'duck':
        M = T((0, 0, 0.92))
        make_part('body', blob(V(0, 0, 0.2), 0.4, 0.24, 0.24, seg=24, rows=12), 'puppet_white', root, M)
        make_part('wing', ellipsoid(V(-0.08, -0.2, 0.24), X * 0.24, Y * 0.04, Z * 0.13, seg=14, rows=8), 'puppet_gold', root, M)
        make_part('neck', tube([V(0.26, 0, 0.3), V(0.32, 0, 0.5), V(0.3, 0, 0.62)], 0.09, 0.08, seg=10), 'puppet_white', root, M)
        hc = V(0.32, 0, 0.7)
        make_part('head', sphere(hc, 0.15, seg=18, rows=10), 'puppet_white', root, M)
        make_part('bill', blob(hc + V(0.18, 0, -0.03), 0.12, 0.06, 0.035, seg=12, rows=6), 'puppet_bill', root, M)
        p, n = ellipsoid_surf(hc, 0.15, 0.15, 0.15)(hc.z + 0.04, -1.0)
        eye_one('puppet', 'r', p, n, root, M, P)
        make_part('tail', cone(V(-0.36, 0, 0.26), V(-0.52, 0, 0.42), 0.08, flat=0.6, seg=10), 'puppet_white', root, M)
    else:
        # a water buffalo: black lacquer, golden swept-back horns, a red saddle cloth
        M = T((0, 0, 0.92))
        make_part('body', blob(V(-0.04, 0, 0.24), 0.44, 0.26, 0.26, seg=24, rows=12), 'puppet_black', root, M)
        make_part('cloth', ell_cap(V(-0.04, 0, 0.24), (0.44, 0.26, 0.26), (0, -0.3, 1), 32, seg=16, rows=5), 'puppet_red', root, M)
        hc = V(0.42, 0, 0.36)
        make_part('head', blob(hc, 0.17, 0.15, 0.15, seg=18, rows=10), 'puppet_black', root, M)
        make_part('muzzle', blob(hc + V(0.13, 0, -0.06), 0.09, 0.1, 0.08, seg=12, rows=8), 'puppet_blue', root, M)
        for s in (-1, 1):
            horn = [hc + V(0.0, s * 0.1, 0.1), hc + V(-0.08, s * 0.3, 0.16), hc + V(-0.24, s * 0.34, 0.14)]
            make_part('horn%d' % s, tube(horn, 0.045, 0.015, seg=8), 'puppet_horn', root, M)
        p, n = ellipsoid_surf(hc, 0.17, 0.15, 0.15)(hc.z + 0.04, -1.0)
        eye_one('puppet', 'r', p, n, root, M, P)
        make_part('tail', tube([V(-0.46, 0, 0.32), V(-0.56, 0, 0.18), V(-0.54, 0, 0.06)], 0.025, seg=6), 'puppet_black', root, M, subsurf=0)


# ================================================================ COIN: the golden xu
def build_coin(root, pose, t):
    M = rot_z(360 * t)
    prof = [(0.06, -0.035), (0.27, -0.035), (0.3, 0.0), (0.27, 0.035), (0.06, 0.035)]
    bm = lathe(prof, seg=28)
    make_part('disc', bm, 'coin_gold', root, M @ rot_x(90), subsurf=1)
    make_part('rim', torus((0, 0, 0), 0.28, 0.03, axis=Y, seg=28, rseg=6), 'coin_rim', root, M, subsurf=0)
    hole = box_bm((0.13, 0.08, 0.13), bevel=0.0)
    make_part('hole', hole, 'coin_hole', root, M, subsurf=0)
    make_part('holerim', box_bm((0.19, 0.075, 0.19), bevel=0.01), 'coin_gold2', root, M, subsurf=0)
    for k in range(4):
        a = TAU * k / 4 + TAU / 8
        make_part('mark%d' % k, box_bm((0.05, 0.08, 0.05), bevel=0.01), 'coin_gold2', root, M @ T((math.cos(a) * 0.19, 0, math.sin(a) * 0.19)), subsurf=0)


# ================================================================ STAR: the golden lotus
def build_star(root, pose, t):
    """A front-facing lotus icon: a fan of pointed gold petals in two layers over a small base, sparkles around."""
    M = T((0, 0, 0.035 * math.sin(TAU * t) - 0.2))
    for layer, (angs, ln, w, mat, y) in enumerate((((-72, -38, 38, 72), 0.34, 0.12, 'star_gold3', 0.06),
                                                    ((-20, 20), 0.4, 0.14, 'star_gold', 0.0),
                                                    ((0,), 0.44, 0.13, 'star_gold2', -0.06))):
        for k, ang in enumerate(angs):
            pet = ellipsoid(V(0, 0, ln / 2), X * w, Y * 0.05, Z * ln / 2, seg=14, rows=10)
            tip = cone(V(0, 0, ln * 0.85), V(0, 0, ln * 1.08), w * 0.45, flat=0.4, seg=8)
            Mp = M @ T((0, y, 0.02)) @ rot_y(ang)
            make_part('petal%d_%d' % (layer, k), pet, mat, root, Mp, subsurf=1)
            make_part('tip%d_%d' % (layer, k), tip, mat, root, Mp, subsurf=1)
    make_part('base', ellipsoid(V(0, -0.02, 0.0), X * 0.3, Y * 0.08, Z * 0.07, seg=18, rows=8), 'star_leaf', root, M, subsurf=1)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.42 * math.cos(a), -0.25, 0.2 * math.sin(a) + 0.2)
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, None, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: a silk lantern in a carved frame
def build_lantern_block(root, kind, spent):
    frame, frame2, silk, silk2, rib, gold, tassel = (kind + x for x in ('_frame', '_frame2', '_silkglow' if not spent else '_silk',
                                                                       '_silk2glow' if not spent else '_silk2', '_rib', '_gold', '_tassel'))
    M = rot_z(-20) @ rot_x(6)
    H = 0.46
    for sx in (-1, 1):
        for sy in (-1, 1):
            make_part('post%d%d' % (sx, sy), box_bm((0.1, 0.1, 2 * H), bevel=0.015), frame, root, M @ T((sx * (H - 0.05), sy * (H - 0.05), 0)), subsurf=0)
    for z in (-H + 0.05, H - 0.05):
        for sy in (-1, 1):
            make_part('beamx%d%.1f' % (sy, z), box_bm((2 * H, 0.1, 0.1), bevel=0.015), frame2, root, M @ T((0, sy * (H - 0.05), z)), subsurf=0)
            make_part('beamy%d%.1f' % (sy, z), box_bm((0.1, 2 * H, 0.1), bevel=0.015), frame2, root, M @ T((sy * (H - 0.05), 0, z)), subsurf=0)
    make_part('panel', box_bm((2 * H - 0.08, 2 * H - 0.08, 0.06), bevel=0.0), frame, root, M @ T((0, 0, -H + 0.05)), subsurf=0)
    make_part('lid', box_bm((2 * H + 0.04, 2 * H + 0.04, 0.06), bevel=0.02), frame2, root, M @ T((0, 0, H)), subsurf=0)
    # the round silk lantern inside, with ribs and gold caps, glowing (unlit) unless spent
    make_part('silk', ellipsoid(V(0, 0, 0), X * 0.33, Y * 0.33, Z * 0.3, seg=24, rows=12), silk, root, M)
    make_part('silk_in', ellipsoid(V(-0.08, -0.12, 0.06), X * 0.15, Y * 0.15, Z * 0.14, seg=14, rows=8), silk2, root, M)
    for k in range(6):
        a = TAU * k / 6
        rib_pts = [V(0.335 * math.sin(math.pi * u) * math.cos(a), 0.335 * math.sin(math.pi * u) * math.sin(a), 0.3 * math.cos(math.pi * u)) for u in [j / 8 for j in range(9)]]
        make_part('rib%d' % k, tube(rib_pts, 0.012, seg=5), rib, root, M, subsurf=0)
    for z in (-0.3, 0.3):
        make_part('cap%.1f' % z, lathe([(0.0, z - 0.03), (0.11, z - 0.03), (0.11, z + 0.03), (0.0, z + 0.03)], seg=14), gold, root, M, subsurf=0)
    make_part('tassel', cone(V(0, 0, -0.33), V(0, 0, -0.44), 0.04, seg=8), tassel, root, M, subsurf=0)
    # small gold corner fittings
    for sx in (-1, 1):
        for sy in (-1, 1):
            make_part('fit%d%d' % (sx, sy), sphere(V(sx * (H - 0.05), sy * (H - 0.05), H + 0.04), 0.045, seg=8, rows=5), gold, root, M, subsurf=0)


def build_qblock(root, pose, t):
    build_lantern_block(root, 'qblock', False)


def build_used(root, pose, t):
    build_lantern_block(root, 'used', True)


BUILDERS = {'scooter': build_scooter, 'bao': build_bao, 'roll': build_roll, 'shrimp': build_shrimp, 'squid': build_squid,
            'cormorant': build_cormorant, 'mosquito': build_mosquito, 'toad': build_toad, 'goi': build_goi, 'bat': build_bat,
            'caveCrab': build_caveCrab, 'bean': build_bean, 'pho': build_pho, 'puppet': build_puppet, 'coin': build_coin,
            'star': build_star, 'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    if kind not in KINDS or pose not in POSES[kind]:
        raise ValueError('unknown %s/%s' % (kind, pose))
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    thin_face_ink(root)
    return root
