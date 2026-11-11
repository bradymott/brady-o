# nl_extras: the NEW Netherlands cast still missing for the level overhaul (docs/design/LEVEL_OVERHAUL.md §2/§8),
# rendered into their own atlas `nl_x` (the live `nl` atlas already has the bulb and the flying gull; nothing here
# touches it). Not referenced by the game yet: point the racer's cfg.atlas at 'nl_x' (sprite = the kind name).
#   gullBike   8-3 "Bike Lane Rush" rival: a herring gull (white, grey wings, yellow beak with the red spot) pedalling
#              a green cargo bike whose wooden front box is full of stolen herring and chips, an orange pennant
#              flying behind                                   walk (pedal, t) stun ko                  feet, 44 px
# Render and pack:  W=/tmp/brady-sprites/nl_x; JOB=enemies:nl_extras LOOK=toon OUT=$W NAME=nl_x SCALE=3 OUTLINE=1.25 \
#   gui/bl.sh $W.log render_country.py; gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/nl_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, tube, cone, lathe, torus,
                        prism, ellipsoid_surf, make_part, new_root, eye_one, brow, box_bm, superellipsoid)

PX = 28.1
KINDS = ['gullBike']
POSES = {'gullBike': ['walk', 'stun', 'ko']}
FRAMES = {('gullBike', 'walk'): (6, 12)}
ORIGIN = {'gullBike': 'feet'}
HEIGHT = {'gullBike': 44 / PX}
SIZE = {'gullBike': 52 / PX}
COLORS = {
    'gullBike_frame': '#2a7a4a', 'gullBike_frame2': '#1e5a36', 'gullBike_tyre': '#22242a', 'gullBike_rim': '#c8ccd4', 'gullBike_box': '#c8945a',
    'gullBike_box2': '#a8743e', 'gullBike_seat': '#3a2a22', 'gullBike_flag': '#ff8a1a', 'gullBike_fish': '#9aaec0', 'gullBike_fish2': '#5a6a7e',
    'gullBike_chips': '#ffd860', 'gullBike_cone': '#f4f0e8',
    'gullBike_body': '#ffffff', 'gullBike_body2': '#eef2f6', 'gullBike_wing': '#a8b6c6', 'gullBike_tip': '#3a3a48', 'gullBike_beak': '#ffd23a',
    'gullBike_spot': '#e8322a', 'gullBike_feet': '#ff9a6a', 'gullBike_eye_white': '#fff4c0', 'gullBike_pupil': '#1a1020', 'gullBike_mouth': '#2a2030',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


def wheel(root, name, c, r, spin):
    make_part(name, torus(c, r, 0.045, axis=Y, seg=28, rseg=8), 'gullBike_tyre', root, None, subsurf=0)
    make_part(name + '_rim', torus(c + V(0, -0.01, 0), r - 0.05, 0.015, axis=Y, seg=24, rseg=5), 'gullBike_rim', root, None, subsurf=0)
    for k in range(4):
        a = math.radians(spin) + k * math.pi / 4
        ob = make_part('%s_sp%d' % (name, k), tube([c + V(-math.cos(a) * (r - 0.06), -0.02, -math.sin(a) * (r - 0.06)), c + V(math.cos(a) * (r - 0.06), -0.02, math.sin(a) * (r - 0.06))], 0.008, seg=4), 'gullBike_rim', root, None, subsurf=0)
        ob['outline'] = 0
    make_part(name + '_hub', sphere(c + V(0, -0.03, 0), 0.04, seg=8, rows=5), 'gullBike_frame2', root, None, subsurf=0)


def build_gullBike(root, pose, t):
    spin = -360 * t if pose == 'walk' else (40 if pose == 'stun' else 0)
    tilt = {'stun': -6, 'ko': 0}.get(pose, 0)
    rr, rf = 0.3, 0.26
    back, front = V(-0.55, 0, rr), V(0.62, 0, rf)
    wheel(root, 'wheel_b', back, rr, spin)
    wheel(root, 'wheel_f', front, rf, spin * rr / rf)
    # frame: a long low cargo frame, the seat post, the handlebar stem
    BB = V(-0.15, 0, 0.32)
    seat = V(-0.32, 0, 0.82)
    head = V(0.28, 0, 0.82)
    for k, (a, b) in enumerate(((back, BB), (BB, seat), (seat, back), (BB, V(0.36, 0, 0.3)), (V(0.36, 0, 0.3), front), (head, front), (BB, head))):
        make_part('tube%d' % k, tube([a, b], 0.03, seg=6), 'gullBike_frame', root, None, subsurf=0)
    make_part('seat', ellipsoid(seat + V(0, 0, 0.04), X * 0.12, Y * 0.06, Z * 0.035, seg=10, rows=5), 'gullBike_seat', root, None, subsurf=0)
    make_part('bars', tube([head, head + V(-0.08, 0, 0.12), head + V(-0.18, -0.05, 0.14)], 0.022, seg=5), 'gullBike_frame2', root, None, subsurf=0)
    # the wooden cargo box between the frame and the front wheel, heaped with herring and a cone of chips
    bc = V(0.36, 0, 0.56)
    make_part('box', box_bm((0.46, 0.4, 0.34), bevel=0.02), 'gullBike_box', root, T(bc), subsurf=0)
    for k in range(3):
        ob = make_part('plank%d' % k, box_bm((0.47, 0.41, 0.015)), 'gullBike_box2', root, T(bc + V(0, 0, -0.12 + 0.11 * k)), subsurf=0)
        ob['outline'] = 0
    for k, (dx, ang) in enumerate(((-0.12, 30), (0.0, -20), (0.12, 50))):
        fc = bc + V(dx, -0.05, 0.22)
        FM_ = about(fc, rot_y(ang))
        make_part('fish%d' % k, ellipsoid(fc, X * 0.13, Y * 0.04, Z * 0.045, seg=12, rows=6), 'gullBike_fish', root, FM_, subsurf=1)
        make_part('fishtail%d' % k, prism([fc + V(-0.12, 0, 0), fc + V(-0.2, 0, 0.05), fc + V(-0.2, 0, -0.05)], Y * 0.02), 'gullBike_fish2', root, FM_, subsurf=0)
    cc = bc + V(0.12, 0.06, 0.2)
    make_part('cone', cone(cc + V(0, 0, 0.14), cc + V(0, 0, -0.08), 0.08, seg=10), 'gullBike_cone', root, None, subsurf=0)
    for k in range(5):
        ob = make_part('chip%d' % k, box_bm((0.02, 0.02, 0.1)), 'gullBike_chips', root, T(cc + V(-0.04 + 0.02 * k, 0, 0.18)) @ rot_y(-20 + 10 * k), subsurf=0)
    # the pennant on a whip behind the seat
    make_part('whip', tube([back + V(-0.05, 0.1, 0.2), back + V(-0.12, 0.1, 1.05)], 0.01, seg=4), 'gullBike_frame2', root, None, subsurf=0)
    fl = 0.04 * math.sin(TAU * t * 2)
    make_part('flag', prism([back + V(-0.12, 0.1, 1.05), back + V(-0.34, 0.1, 0.98 + fl), back + V(-0.12, 0.1, 0.9)], Y * 0.02), 'gullBike_flag', root, None, subsurf=0)
    # the gull: seated, leaning over the bars, feet on the pedals
    P = {'er': 0.07, 'skin': 'gullBike_body', 'lid': 0.0, 'look': Vector((0.6, -0.8, 0.0)), 'eye': 1.05}
    if pose == 'stun':
        P['dazed'], P['lid'] = True, 0.4
    if pose == 'ko':
        P['x'] = True
    GM = about(seat, rot_y(-28 + tilt))
    bc_g = seat + V(0.02, 0, 0.32)
    make_part('g_body', blob(bc_g, 0.24, 0.17, 0.2, seg=22, rows=12), 'gullBike_body', root, GM)
    make_part('g_tail', prism([bc_g + V(-0.18, 0, 0.0), bc_g + V(-0.4, 0, -0.04), bc_g + V(-0.38, 0, -0.12), bc_g + V(-0.16, 0, -0.1)], Y * 0.06), 'gullBike_wing', root, GM, subsurf=1)
    make_part('g_tailtip', prism([bc_g + V(-0.36, 0, -0.03), bc_g + V(-0.42, 0, -0.05), bc_g + V(-0.4, 0, -0.12), bc_g + V(-0.34, 0, -0.11)], Y * 0.065), 'gullBike_tip', root, GM, subsurf=0)
    hc = bc_g + V(0.2, 0, 0.26)
    HM = GM @ about(hc, rot_y(30))
    make_part('g_head', sphere(hc, 0.14, seg=20, rows=12), 'gullBike_body', root, HM)
    hs = ellipsoid_surf(hc, 0.14, 0.14, 0.14)
    for side, az, dz in (('r', -0.8, 0.04), ('l', -1.6, 0.05)):
        p, n = hs(hc.z + dz, az)
        eye_one('gullBike', side, p - n * 0.01, n, root, HM, P, er=0.06 if side == 'r' else 0.052)
    if not P.get('x'):
        brow('gullBike', 'r', hs(hc.z + 0.04, -0.8)[0], hs(hc.z + 0.04, -0.8)[1], root, HM, 0.06, angry=0.8)
    make_part('g_beak', cone(hc + V(0.1, 0, -0.02), hc + V(0.3, 0, -0.06), 0.05, flat=0.7, seg=10), 'gullBike_beak', root, HM)
    make_part('g_spot', sphere(hc + V(0.24, -0.03, -0.07), 0.022, seg=8, rows=5), 'gullBike_spot', root, HM, subsurf=0)
    # wings forward to the handlebar grips
    grip = head + V(-0.18, -0.08, 0.14)
    for side, y in (('far', 0.12), ('near', -0.16)):
        sh = bc_g + V(0.08, y, 0.08)
        shw = GM @ sh
        mid = (shw + grip) / 2 + V(0, 0, 0.1)
        make_part('wing_' + side, tube([shw, mid, grip + V(0, y * 0.4, 0)], 0.07, 0.04, seg=8), 'gullBike_wing', root, None, subsurf=1)
        ob = make_part('wingtip_' + side, sphere(grip + V(0.02, y * 0.4, 0.0), 0.05, seg=8, rows=5), 'gullBike_tip', root, None, subsurf=0)
    # legs pedalling round the bottom bracket
    for k, (y, ph) in enumerate(((-0.1, 0.0), (0.1, math.pi))):
        a = math.radians(spin) * 1.0 + ph
        ped = BB + V(0.13 * math.cos(a), y, 0.13 * math.sin(a))
        crank_ob = make_part('crank%d' % k, tube([BB + V(0, y, 0), ped], 0.018, seg=4), 'gullBike_frame2', root, None, subsurf=0)
        hip = GM @ (bc_g + V(0.06, y, -0.12))
        knee = (hip + ped) / 2 + V(0.12, 0, 0.06)
        make_part('leg%d' % k, tube([hip, knee, ped + V(0, 0, 0.03)], 0.024, 0.02, seg=5), 'gullBike_feet', root, None, subsurf=0)
        make_part('foot%d' % k, ellipsoid(ped + V(0.04, 0, 0.02), X * 0.07, Y * 0.04, Z * 0.02, seg=8, rows=4), 'gullBike_feet', root, None, subsurf=0)
    if pose == 'ko':
        for ob in root.children:
            pass


BUILDERS = {'gullBike': build_gullBike}


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    if pose == 'ko':
        root.rotation_euler = (0, math.radians(-12), 0)
    for ob in root.children:
        part = ob.get('sprite_part', '')
        if part.startswith('pupil_'):
            ob['outline'] = 0
        elif part.startswith(('eye_', 'lid_')):
            ob['outline'] = 0.5
    return root
