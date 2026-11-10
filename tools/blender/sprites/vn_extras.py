# vn_extras: the NEW Vietnam cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §4.3/§8), rendered ahead
# of the engine work into their own atlas `vn_x` (not referenced by the game yet). When the overhaul wires these
# enemies, point their cfg.atlas at 'vn_x' or move the kinds into vn_enemies.py. Helpers: id_charkit.py.
#   non        boomerang flyer: a conical straw hat (an object, nobody under it) with little white wings; it spins
#              when thrown out and back             fly(t) spin(t) perch stun ko                     centre, 28 px
#   silkworm   ceilingDrop: a plump cream silkworm hanging from its silk thread (the thread is code-drawn from the
#              origin straight up)                  hang(t) drop stun flat ko                       centre, 20 px
#   phinDrip   trailLayer: a little drip-coffee filter (phin) on legs, dripping a coffee trail
#                                                   walk(t) drip(t) stun flat ko                     feet, 26 px
# Render and pack (build_country.sh only packs <cc>_enemies*.py into the country atlas):
#   W=/tmp/brady-sprites/vn_x; JOB=enemies:vn_extras LOOK=toon OUT=$W NAME=vn_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/vn_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import id_charkit as CK
from id_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, tube, cone, lathe,
                        torus, prism, lathe_surf, ellipsoid_surf, make_part, new_root, eye_one, brow, mouth_bm, biped_legs)
from id_enemies import STD_POSE, thin_face_ink

PX = 28.1
KINDS = ['non', 'silkworm', 'phinDrip']
POSES = {
    'non': ['fly', 'spin', 'perch', 'stun', 'ko'],
    'silkworm': ['hang', 'drop', 'stun', 'flat', 'ko'],
    'phinDrip': ['walk', 'drip', 'stun', 'flat', 'ko'],
}
FRAMES = {('non', 'fly'): (4, 10), ('non', 'spin'): (6, 16), ('silkworm', 'hang'): (4, 6), ('phinDrip', 'walk'): (6, 10),
          ('phinDrip', 'drip'): (4, 6)}
ORIGIN = {'non': 'centre', 'silkworm': 'centre', 'phinDrip': 'feet'}
HEIGHT = {'phinDrip': 26 / PX}
SIZE = {'non': 28 / PX, 'silkworm': 22 / PX, 'phinDrip': 26 / PX}

COLORS = {
    'non_straw': '#f6e2a4', 'non_straw2': '#e0c47a', 'non_ring': '#e8cc84', 'non_ribbon': '#e8323a', 'non_wing': '#fbfbf6',
    'non_wing2': '#dce8f0', 'non_eye_white': '#fbfbf2', 'non_pupil': '#1a1020', 'non_mouth': '#6a3a1a',
    'silkworm_body': '#f4ecdc', 'silkworm_ring': '#e0d4bc', 'silkworm_head': '#e8dcc4', 'silkworm_spot': '#b8a890',
    'silkworm_silk': '#ffffff', 'silkworm_eye_white': '#fbfbf2', 'silkworm_pupil': '#1a1020', 'silkworm_mouth': '#6a4a3a',
    'phinDrip_metal': '#c8ccd4', 'phinDrip_metal2': '#a8acb8', 'phinDrip_lid': '#d8dce4', 'phinDrip_coffee': '#5a2e14',
    'phinDrip_drop': '#7a3e1a', 'phinDrip_cup': '#f4f0e8', 'phinDrip_feet': '#8a8e9a', 'phinDrip_eye_white': '#fbfbf2',
    'phinDrip_pupil': '#1a1020', 'phinDrip_mouth': '#3a2a2a',
}
CK.COLORS.update(COLORS)


def clear(kind=None):
    CK.clear(kind if kind else KINDS)


HAT = [(0.0, 0.0), (0.44, 0.0), (0.42, 0.03), (0.0, 0.46)]


def build_non(root, pose, t):
    P = {'er': 0.065, 'skin': 'non_straw', 'lid': 0.1, 'look': Vector((0.5, -0.85, 0.0))}
    if pose == 'stun':
        P.update(dazed=True, lid=0.5)
    elif pose == 'ko':
        P['x'] = True
    spin = 360 * t if pose == 'spin' else 0
    tilt = -8 if pose == 'fly' else 0
    M = T((0, 0, -0.12)) @ rot_x(-tilt) @ rot_z(spin)
    if pose == 'ko':
        M = T((0, 0, 0.1)) @ rot_x(180)
    make_part('hat', lathe(HAT, seg=32), 'non_straw', root, M, subsurf=1)
    for k, z in enumerate((0.1, 0.2, 0.3)):
        r = 0.44 * (1 - z / 0.46)
        make_part('ring%d' % k, torus((0, 0, z), r + 0.005, 0.01, seg=32, rseg=4), 'non_ring', root, M, subsurf=0)['outline'] = 0
    make_part('rim', torus((0, 0, 0.01), 0.47, 0.022, seg=32, rseg=6), 'non_straw2', root, M, subsurf=0)
    make_part('ribbon', torus((0, 0, 0.04), 0.4, 0.016, seg=28, rseg=4), 'non_ribbon', root, M, subsurf=0)
    if pose != 'spin':
        # a face painted on the front of the cone (the hat itself is the character)
        surf = lathe_surf(HAT)
        for side, az in (('r', -1.3), ('l', -1.85)):
            p, n = surf(0.12, az)
            eye_one('non', side, p, n, root, M, P)
        make_part('mouth', mouth_bm(surf, 'smile' if pose in ('fly', 'perch') else 'o', 0.06, -1.4, -1.75, scale=0.6), 'non_mouth', root, M)
    # little white wings on either side, flapping (folded when perched)
    flap = math.sin(TAU * t) if pose == 'fly' else (1.0 if pose == 'spin' else -0.8 if pose == 'perch' else 0.2)
    for sgn in (-1, 1):
        base = V(sgn * 0.42, 0.0, 0.06)
        ang = sgn * (20 + 45 * flap)
        Mw = M @ about(base, rot_y(-ang))
        for k in range(3):
            make_part('wing%d_%d' % (sgn, k), ellipsoid(base + V(sgn * (0.14 + 0.07 * k), 0, 0.06 - 0.04 * k), X * (0.14 - 0.02 * k), Y * 0.02, Z * 0.05, seg=10, rows=6),
                      'non_wing' if k % 2 == 0 else 'non_wing2', root, Mw, subsurf=1)


def build_silkworm(root, pose, t):
    P = dict(STD_POSE['stun' if pose == 'stun' else 'flat' if pose == 'flat' else 'ko' if pose == 'ko' else 'idle'])
    P.update(er=0.065, skin='silkworm_body')
    wig = 0.06 * math.sin(TAU * t) if pose == 'hang' else 0.0
    stretch = 1.25 if pose == 'drop' else 1.0
    if pose == 'flat':
        M = T((0, 0, -0.2)) @ rot_y(90) @ diag(1, 1, 0.5)
    elif pose == 'ko':
        M = rot_y(180)
    else:
        M = Matrix.Identity(4)
    M = diag(1.45, 1.45, 1.45) @ M
    n = 7
    for k in range(n):
        z = 0.24 - k * 0.075 * stretch
        x = wig * math.sin(k * 0.9)
        r = 0.1 - 0.004 * abs(k - 2)
        make_part('seg%d' % k, blob(V(x, 0, z), r, r, 0.06, seg=14, rows=8), 'silkworm_body' if k % 2 == 0 else 'silkworm_ring', root, M)
        if k in (2, 4):
            make_part('spot%d' % k, sphere(V(x + 0.03, -0.09, z), 0.025, seg=6, rows=4), 'silkworm_spot', root, M, subsurf=0)
    hc = V(wig * math.sin(-0.9), 0, 0.31)
    make_part('head', blob(hc, 0.11, 0.1, 0.09, seg=16, rows=10), 'silkworm_head', root, M)
    make_part('silk', tube([hc + V(0, 0, 0.07), hc + V(0, 0, 0.14)], 0.012, seg=5), 'silkworm_silk', root, M, subsurf=0)
    surf = ellipsoid_surf(hc, 0.11, 0.1, 0.09)
    for side, az in (('r', -1.25), ('l', -1.9)):
        p, n_ = surf(hc.z - 0.005, az)
        eye_one('silkworm', side, p, n_, root, M, P)
    if P['mouth']:
        make_part('mouth', mouth_bm(surf, P['mouth'], hc.z - 0.05, -1.35, -1.8, scale=0.6), 'silkworm_mouth', root, M)
    for k in range(3):
        z = 0.12 - k * 0.12 * stretch
        for sgn in (-1, 1):
            make_part('leg%d%d' % (k, sgn), sphere(V(sgn * 0.1, -0.03, z), 0.025, seg=6, rows=4), 'silkworm_ring', root, M, subsurf=0)


PHIN = [(0.0, 0.0), (0.16, 0.0), (0.2, 0.04), (0.24, 0.34), (0.26, 0.38), (0.0, 0.38)]


def build_phinDrip(root, pose, t):
    P = dict(STD_POSE[pose if pose in STD_POSE else 'idle'])
    P.update(er=0.075, skin='phinDrip_metal')
    bob = 0.02 * abs(math.sin(TAU * t)) if pose == 'walk' else 0.0
    sx, sz = P['sx'], P['sz']
    M = T((0, 0, bob + 0.24)) @ rot_y(P['lean'] * 0.6) @ diag(sx, sx, sz)
    make_part('cup', lathe(PHIN, seg=24), 'phinDrip_metal', root, M, subsurf=1)
    make_part('plate', torus((0, 0, 0.02), 0.3, 0.025, seg=24, rseg=6), 'phinDrip_metal2', root, M, subsurf=0)
    for k in range(4):
        make_part('hole%d' % k, sphere(V(-0.12 + 0.08 * k, -0.15, 0.12), 0.018, seg=6, rows=4), 'phinDrip_metal2', root, M, subsurf=0)
    lid_up = 0.04 * math.sin(TAU * t) if pose == 'drip' else 0.0
    make_part('lid', lathe([(0.0, 0.38), (0.25, 0.38), (0.22, 0.44), (0.06, 0.48), (0.0, 0.5)], seg=24), 'phinDrip_lid', root, M @ T((0, 0, lid_up)), subsurf=1)
    make_part('knob', sphere(V(0, 0, 0.53 + lid_up), 0.04, seg=8, rows=5), 'phinDrip_metal2', root, M, subsurf=0)
    surf = lathe_surf(PHIN)
    for side, az in (('r', -1.2), ('l', -1.95)):
        p, n = surf(0.24, az)
        eye_one('phinDrip', side, p, n, root, M, P)
    if P['mouth']:
        make_part('mouth', mouth_bm(surf, P['mouth'] if P['mouth'] != 'grin' else 'smile', 0.13, -1.3, -1.85, scale=0.8), 'phinDrip_mouth', root, M)
    # coffee drips falling from under the filter (and a little puddle trail)
    if pose in ('walk', 'drip'):
        for k in range(2):
            ph = (t + k * 0.5) % 1
            make_part('drop%d' % k, ellipsoid(V(-0.04 + 0.06 * k, -0.02, -0.02 - 0.18 * ph), X * 0.025, Y * 0.025, Z * 0.04, seg=8, rows=5), 'phinDrip_drop', root, M, subsurf=0)
        make_part('puddle', ellipsoid(V(-0.3, 0, 0.01), X * 0.22, Y * 0.12, Z * 0.012, seg=14, rows=4), 'phinDrip_coffee', root, None, subsurf=0)
    if pose != 'flat':
        biped_legs('phinDrip', root, T((0, 0, bob)), P, t, (0.0, 0.1, 0.25), (0.08, 0.05, 0.035), 0.03, 'phinDrip_feet')


BUILDERS = {'non': build_non, 'silkworm': build_silkworm, 'phinDrip': build_phinDrip}


def build(kind, pose, t=0.0):
    if kind not in KINDS or pose not in POSES[kind]:
        raise ValueError('unknown %s/%s' % (kind, pose))
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    thin_face_ink(root)
    for ob in root.children_recursive:
        if ob.get('sprite_part', '').startswith(('seg', 'leg', 'head')) and kind == 'silkworm':
            ob['outline'] = 0.45
    return root
