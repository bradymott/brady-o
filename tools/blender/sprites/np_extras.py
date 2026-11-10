# np_extras: the NEW Nepal cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §2/§8), rendered ahead of
# the engine work into their own atlas `np_x` (not referenced by the game yet). The new poses of existing kinds (yeti
# tell / breathe / pant, marmot sleep / tell / whistle) live in np_enemies.py so the live `np` atlas has them where the
# game will look. The Tin Yak mini-boss is not modelled here (bosses stay out of the sprite set).
#   bat   12-6 Crevasse Drop: an ice-cave bat of our own: violet fur with a pale lilac belly, pink ear linings, big
#         eyes, frosty blue wing membranes so it reads against the deep blue ice      fly(t) swoop stun ko   centre, 28 px
# Render and pack:  W=/tmp/brady-sprites/np_x; JOB=enemies:np_extras LOOK=toon OUT=$W NAME=np_x SCALE=3 OUTLINE=1.25 \
#   gui/bl.sh $W.log render_country.py; gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/np_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        prism, ellipsoid_surf, make_part, new_root, eye_one, mouth_bm)

PX = 28.1
KINDS = ['bat']
POSES = {'bat': ['fly', 'swoop', 'stun', 'ko']}
ORIGIN = {'bat': 'centre'}
SIZE = {'bat': 28 / PX}
HEIGHT = {}
COLORS = {
    'bat_fur': '#8a62c0', 'bat_belly': '#c8b0e8', 'bat_ear': '#ff9ab8', 'bat_wing': '#5a8ad0', 'bat_bone': '#3a3a6a',
    'bat_fang': '#ffffff', 'bat_eye_white': '#fbfbf2', 'bat_pupil': '#1a1020', 'bat_mouth': '#3a1a3a',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


def build_bat(root, pose, t):
    P = {'er': 0.085, 'skin': 'bat_fur', 'lid': 0.1, 'look': Vector((0.5, -0.85, -0.2))}
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
    make_part('body', blob(bc, 0.17, 0.15, 0.19, seg=20, rows=12), 'bat_fur', root, Mx)
    make_part('belly', ell_cap(bc, (0.17, 0.15, 0.19), (0.2, -1, -0.3), 45, seg=16, rows=5), 'bat_belly', root, Mx)
    hc, hr = V(0.03, 0, 0.2), 0.15
    make_part('head', sphere(hc, hr, seg=20, rows=12), 'bat_fur', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        base = hc + V(sgn * 0.08, 0, 0.1)
        tip = hc + V(sgn * 0.15, 0, 0.3)
        make_part('ear_' + side, cone(base, tip, 0.07, flat=0.45, seg=10), 'bat_fur', root, Mx)
        make_part('earin_' + side, cone(base + V(0, -0.025, 0.02), tip + V(0, -0.025, -0.05), 0.04, flat=0.3, seg=8), 'bat_ear', root, Mx, subsurf=1)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -1.25), ('l', -1.95)):
        p, n = hsurf(0.22, az)
        eye_one('bat', side, p - n * 0.01, n, root, Mx, P)
    p, n = hsurf(0.12, -1.6)
    if not P.get('x'):
        for k, dx in enumerate((-0.035, 0.035)):
            make_part('fang%d' % k, cone(p + V(dx, -0.01, 0.0), p + V(dx, -0.02, -0.06), 0.017, seg=6), 'bat_fang', root, Mx, subsurf=0)
    make_part('mouth', mouth_bm(hsurf, 'smile' if pose != 'stun' else 'wobble', 0.13, -1.35, -1.85, scale=0.7), 'bat_mouth', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        shoulder = V(sgn * 0.12, 0.02, 0.05)
        up = 0.32 * flap
        fingers = [shoulder + V(sgn * 0.3, 0.05, 0.12 + up * 0.6), shoulder + V(sgn * 0.5, 0.06, 0.02 + up),
                   shoulder + V(sgn * 0.44, 0.06, -0.16 + up * 0.8), shoulder + V(sgn * 0.24, 0.05, -0.2 + up * 0.4)]
        for k in range(len(fingers) - 1):
            a, b = fingers[k], fingers[k + 1]
            notch = shoulder + ((a + b) / 2 - shoulder) * 0.78
            make_part('wing_%s%d' % (side, k), prism([shoulder, a, notch, b], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        make_part('wing_%s_end' % side, prism([shoulder, fingers[-1], shoulder + V(sgn * 0.08, 0, -0.18)], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        for k, f in enumerate(fingers):
            make_part('bone_%s%d' % (side, k), tube([shoulder + V(0, -0.012, 0), f + V(0, -0.012, 0)], 0.016, 0.01, seg=6), 'bat_bone', root, Mx, subsurf=0)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('foot_' + side, tube([V(sgn * 0.06, 0, -0.18), V(sgn * 0.07, 0, -0.27)], 0.02, 0.015, seg=6), 'bat_bone', root, Mx, subsurf=0)


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS or pose not in POSES[kind]:
        raise ValueError('unknown %r %r' % (kind, pose))
    M.clear(kind)
    root = new_root(kind, pose)
    build_bat(root, pose, t)
    return root
