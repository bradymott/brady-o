# id_extras: the NEW Indonesia cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §4.3/§8), rendered
# ahead of the engine work into their own atlas `id_x` (not referenced by the game yet, so the live `id` atlas stays
# lean). When the overhaul wires these enemies, point their cfg.atlas at 'id_x' or move the kinds into id_enemies.py.
# (idAngler and idMoray already exist in the live 'id' atlas as 'angler' and 'moray'.)
# Same conventions as id_enemies.py (helpers: id_charkit.py). Kinds are named like the planned spawn types:
#   macaque    itemThief {flee}: a long-tailed macaque wearing a pair of stolen sunglasses
#                                           walk(t) grab flee(t) stun flat ko                 feet, 26 px
#   gecko      wallCrawl: a blue tokay gecko with orange spots, belly to the surface (the game rotates it onto walls
#              and ceilings)                crawl(t) stun flat ko                             feet, 14 px (30 long)
#   rafflesia  inhaleBlast: a giant red five-petal flower with cream warts and a deep well in the middle
#                                           idle(t) inhale blast stun flat ko                 feet, 26 px
#   hornbill   flyer: a rhinoceros hornbill, black with a white tail band, a big yellow beak and an orange casque
#                                           fly(t) swoop stun ko                              centre, 36 px
# Render and pack (build_country.sh only packs <cc>_enemies*.py into the country atlas):
#   W=/tmp/brady-sprites/id_x; JOB=enemies:id_extras LOOK=toon OUT=$W NAME=id_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/id_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import id_charkit as CK
from id_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube,
                        cone, lathe, torus, prism, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        mouth_bm, quad_legs, gait)
import id_enemies as IE

PX = 28.1
KINDS = ['macaque', 'gecko', 'rafflesia', 'hornbill']
POSES = {
    'macaque': ['walk', 'grab', 'flee', 'stun', 'flat', 'ko'],
    'gecko': ['crawl', 'stun', 'flat', 'ko'],
    'rafflesia': ['idle', 'inhale', 'blast', 'stun', 'flat', 'ko'],
    'hornbill': ['fly', 'swoop', 'stun', 'ko'],
}
FRAMES = {('macaque', 'walk'): (6, 10), ('macaque', 'flee'): (6, 14), ('gecko', 'crawl'): (6, 12),
          ('rafflesia', 'idle'): (4, 4), ('hornbill', 'fly'): (6, 10)}
ORIGIN = {'macaque': 'feet', 'gecko': 'feet', 'rafflesia': 'feet', 'hornbill': 'centre'}
HEIGHT = {'macaque': 26 / PX, 'gecko': 14 / PX, 'rafflesia': 26 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'gecko': 30 / PX, 'rafflesia': 34 / PX, 'hornbill': 36 / PX})

COLORS = {
    'macaque_fur': '#a89680', 'macaque_fur2': '#8a7a66', 'macaque_belly': '#d8ccb8', 'macaque_face': '#f0b8a8',
    'macaque_ear': '#e09a8a', 'macaque_eye_white': '#fbfbf2', 'macaque_pupil': '#1a1020', 'macaque_mouth': '#6a2a2a',
    'macaque_shades': '#1a1a24', 'macaque_frame': '#e8322a', 'macaque_shine': '#8ab8e8',
    'gecko_skin': '#6a8ad0', 'gecko_skin2': '#587ac0', 'gecko_belly': '#c8d8f0', 'gecko_spot': '#ff8a3a', 'gecko_pad': '#a8bce0',
    'gecko_eye_white': '#ffd23a', 'gecko_pupil': '#1a1020', 'gecko_mouth': '#2a3a6a',
    'rafflesia_petal': '#c8322a', 'rafflesia_petal2': '#a8261e', 'rafflesia_wart': '#f4e0c8', 'rafflesia_well': '#5a1214',
    'rafflesia_rim': '#e8a89a', 'rafflesia_spike': '#f0d0c0', 'rafflesia_leaf': '#3a7a32', 'rafflesia_vine': '#5a4a2a',
    'rafflesia_puffglow': '#e8f0c8', 'rafflesia_eye_white': '#fbfbf2', 'rafflesia_pupil': '#1a1020', 'rafflesia_mouth': '#3a0a0c',
    'hornbill_body': '#2a2630', 'hornbill_body2': '#3a3442', 'hornbill_white': '#f4f0e8', 'hornbill_beak': '#ffd23a',
    'hornbill_beak2': '#f0b020', 'hornbill_casque': '#ff7a1a', 'hornbill_skin': '#e8402a', 'hornbill_eye_white': '#fbfbf2',
    'hornbill_pupil': '#1a1020', 'hornbill_mouth': '#3a1a0a',
}
CK.COLORS.update(COLORS)
IE.MONKEY_POSE.update({
    'walk': dict(lid=0.1, mouth='grin', body='run'),
    'flee': dict(lid=0.0, mouth='grin', body='run'),
    'stun': dict(lid=0.5, mouth='wobble', body='sit', dazed=True),
})


def clear(kind=None):
    CK.clear(kind if kind else KINDS)


# ================================================================ MACAQUE (item thief, wearing stolen sunglasses)
def build_macaque(root, pose, t):
    p = {'walk': 'walk', 'grab': 'drop', 'flee': 'flee', 'stun': 'stun', 'flat': 'flat', 'ko': 'ko'}[pose]

    def shades(MH, fsurf, fc):
        if pose == 'flat':
            return
        cs = []
        for side, az in (('r', -0.2), ('l', 0.35)):
            q, n = fsurf(fc.z + 0.035, az)
            c = q + n * 0.075
            cs.append(c)
            up = Z
            sd = up.cross(n).normalized()
            make_part('lens_' + side, ellipsoid(c, n * 0.035, sd * 0.095, up * 0.075, seg=12, rows=6), 'macaque_shades', root, MH, subsurf=1)
        make_part('bridge', tube([cs[0] + Z * 0.03, cs[1] + Z * 0.03], 0.02, seg=5), 'macaque_frame', root, MH, subsurf=0)
        make_part('temple', tube([cs[1] + Z * 0.03, cs[1] + V(-0.16, 0.06, 0.04)], 0.018, seg=5), 'macaque_frame', root, MH, subsurf=0)
        make_part('shine', ellipsoid(cs[0] + V(-0.005, -0.03, 0.022), X * 0.008, Y * 0.018, Z * 0.01, seg=8, rows=4), 'macaque_shine', root, MH, subsurf=0)

    IE.build_macaque(root, 'macaque', p, t, 1.1, on_head=shades)
    if pose == 'flee':
        # running off with the loot: a fat gold coin clutched to its chest
        make_part('loot', ellipsoid(V(0.26, -0.18, 0.5), X * 0.11, Y * 0.03, Z * 0.11, seg=14, rows=6), 'hornbill_beak', root, None, subsurf=1)


# ================================================================ GECKO (wall crawler)
def build_gecko(root, pose, t):
    P = {'er': 0.065, 'skin': 'gecko_skin', 'lid': 0.0, 'pupil': 0.7, 'look': Vector((0.7, -0.7, 0.0))}
    if pose == 'stun':
        P.update(dazed=True, lid=0.45)
    elif pose == 'ko':
        P['x'] = True
    flat = pose == 'flat'
    ph = TAU * t
    view = about((0, 0, 0.1), rot_x(-38))                  # tip the back toward the camera so all four legs read
    Mx = about((0, 0, 0.12), diag(1.2, 1.2, 0.4)) @ view if flat else (rot_x(180) @ T((0, 0, -0.3)) if pose == 'ko' else view)
    wig = 0.12 * math.sin(ph) if pose == 'crawl' else 0.0
    spine = [V(0.4, 0, 0.17), V(0.2, wig * 0.5, 0.17), V(0.0, -wig * 0.5, 0.16), V(-0.2, wig * 0.6, 0.15)]
    make_part('body', CK.tube(spine, 0.11, 0.09, seg=14), 'gecko_skin', root, Mx)
    hc, hr = V(0.44, 0, 0.2), (0.15, 0.13, 0.1)
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'gecko_skin', root, Mx)
    for k, (x, y) in enumerate(((0.25, -0.08), (0.08, -0.1), (-0.1, -0.08), (0.15, 0.0), (-0.02, -0.02))):
        make_part('spot%d' % k, sphere(V(x, y, 0.25), 0.035, seg=8, rows=5), 'gecko_spot', root, Mx, subsurf=0)
    hsurf = ellipsoid_surf(hc, *hr)
    p, n = hsurf(0.25, -1.0)
    eye_one('gecko', 'r', p - n * 0.01, n, root, Mx, P)
    make_part('mouth', CK.mouth_bm(hsurf, 'smile' if pose == 'crawl' else 'wobble' if pose == 'stun' else 'o', 0.17, -0.3, -1.1, scale=0.8), 'gecko_mouth', root, Mx)
    tail = [spine[-1], V(-0.4, -wig, 0.13), V(-0.58, wig, 0.1), V(-0.7, wig * 1.5, 0.08)]
    make_part('tail', CK.tube(tail, 0.08, 0.02, seg=10), 'gecko_skin', root, Mx)
    for k, (x, ph0) in enumerate(((0.28, 0.0), (-0.12, math.pi))):
        for side, sgn in (('n', -1), ('f', 1)):
            ph2 = ph + ph0 + (math.pi if side == 'f' else 0)
            dx = 0.1 * math.sin(ph2) if pose == 'crawl' else 0.0
            dz = 0.05 * max(0, math.cos(ph2)) if pose == 'crawl' else 0.0
            hip = V(x, sgn * 0.08, 0.14)
            foot = V(x + dx + 0.06, sgn * 0.2, 0.03 + dz)
            make_part('leg%d%s' % (k, side), CK.tube([hip, (hip + foot) / 2 + V(0, 0, 0.06), foot], 0.035, 0.03, seg=8), 'gecko_skin', root, Mx)
            for j in range(4):
                a = -0.8 + j * 0.55
                toe = foot + V(math.cos(a) * 0.07, sgn * math.sin(a) * 0.05, 0)
                make_part('pad%d%s%d' % (k, side, j), sphere(toe, 0.022, seg=8, rows=5), 'gecko_pad', root, Mx, subsurf=0)
    IE.thin_face_ink(root)


# ================================================================ RAFFLESIA (inhale / blast)
def build_rafflesia(root, pose, t):
    P = {'er': 0.09, 'skin': 'rafflesia_petal', 'lid': 0.1, 'look': Vector((0.4, 0.0, 0.9))}
    breathe = 0.04 * math.sin(TAU * t) if pose == 'idle' else 0.0
    open_ = {'idle': 0.5, 'inhale': 1.0, 'blast': 0.2, 'stun': 0.4, 'flat': 0.3, 'ko': 0.4}[pose]
    if pose == 'stun':
        P.update(dazed=True, lid=0.5)
    elif pose == 'ko':
        P['x'] = True
    elif pose == 'inhale':
        P.update(eye=1.2, pupil=0.6, lid=0.0)
    elif pose == 'blast':
        P.update(lid=0.6)
    Mx = about((0, 0, 0.1), diag(1.2, 1.2, 0.4)) if pose == 'flat' else (about((0, 0, 0.2), rot_y(-14)) if pose == 'ko' else Matrix.Identity(4))
    view = rot_x(72)           # the bloom faces the camera: a five-petal star, the cup and its well in the middle
    MV = Mx @ T((0, -0.1, 0.47)) @ diag(0.62, 0.62, 0.62) @ view
    # five thick warty petals around a central cup
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        d = V(math.cos(a), math.sin(a), 0)
        c = d * (0.42 + breathe)
        pet = ellipsoid(c, d * 0.3, d.cross(Z) * 0.27, Z * 0.08, seg=18, rows=10)
        make_part('petal%d' % k, pet, 'rafflesia_petal' if k % 2 else 'rafflesia_petal2', root, MV @ about(c, Matrix.Rotation(math.radians(-12), 4, d.cross(Z))))
        for j in range(4):
            q = c + d * (0.12 * (j % 2) - 0.04) + d.cross(Z) * (0.13 * (j - 1.5) * 0.6) + Z * 0.085
            make_part('wart%d_%d' % (k, j), sphere(q, 0.035, seg=8, rows=5), 'rafflesia_wart', root, MV, subsurf=0)
    # the cup with its rim and the deep well
    make_part('cup', lathe([(0.0, 0.0), (0.3, 0.02), (0.34, 0.16), (0.3 - 0.04 * open_, 0.24)], seg=24), 'rafflesia_petal2', root, MV)
    make_part('rim', torus((0, 0, 0.24), 0.27 - 0.03 * open_, 0.035, seg=24, rseg=8), 'rafflesia_rim', root, MV, subsurf=1)
    make_part('well', ellipsoid(V(0, 0, 0.245), X * (0.17 + 0.07 * open_), Y * (0.17 + 0.07 * open_), Z * 0.02, seg=20, rows=6), 'rafflesia_well', root, MV, subsurf=1)
    for k in range(7):
        a = TAU * k / 7
        b = V(math.cos(a) * 0.1, math.sin(a) * 0.1, 0.24)
        make_part('spike%d' % k, cone(b, b + V(0, 0, 0.06), 0.018, seg=6), 'rafflesia_spike', root, MV, subsurf=0)
    # a face on the front of the cup
    for side, ax in (('r', 0.12), ('l', -0.12)):
        p, n = V(ax, 0.2, 0.27), V(0, 0.35, 1).normalized()
        eye_one('rafflesia', side, p, n, root, MV, P)
        if pose == 'blast':
            brow('rafflesia', side, p, n, root, MV, P['er'], angry=1.0)
    # leaves and a woody vine at the foot
    for k, sgn in enumerate((-1, 1)):
        lc = V(sgn * 0.45, 0.1, 0.05)
        make_part('leaf%d' % k, ellipsoid(lc, X * 0.25, Y * 0.12, Z * 0.035, seg=12, rows=6), 'rafflesia_leaf', root, Mx @ about(lc, rot_y(sgn * -15)))
    make_part('vine', CK.tube([V(-0.6, 0.15, 0.03), V(-0.2, 0.2, 0.06), V(0.3, 0.2, 0.04), V(0.65, 0.12, 0.02)], 0.035, seg=8), 'rafflesia_vine', root, Mx)
    if pose in ('inhale', 'blast'):
        # air streaks (unlit puffs): drawn in toward the well when inhaling, a cloud puffed out when blasting
        for k in range(4):
            u = (k + 0.5) / 4
            if pose == 'inhale':
                c = V(0.7 - 0.25 * u, -0.25, 0.95 - 0.3 * u + 0.12 * math.sin(k * 2))
                r = 0.05 + 0.02 * k
            else:
                c = V(0.25 + 0.3 * u, -0.25, 0.9 + 0.25 * u)
                r = 0.08 + 0.05 * k
            make_part('puff%d' % k, sphere(c, r, seg=10, rows=6), 'rafflesia_puffglow', root, Mx, subsurf=1)
    IE.thin_face_ink(root)


# ================================================================ HORNBILL (flyer)
def build_hornbill(root, pose, t):
    P = {'er': 0.06, 'skin': 'hornbill_body', 'lid': 0.15, 'look': Vector((0.7, -0.7, -0.05))}
    flap, tilt = 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.7, 26
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = 0.3, True, 0.5
    else:
        flap, P['x'] = -0.5, True
    Mx = rot_y(tilt) if pose != 'ko' else rot_x(180)
    bc, br = V(-0.05, 0, 0.0), (0.3, 0.16, 0.16)
    make_part('body', blob(bc, *br, seg=22, rows=12), 'hornbill_body', root, Mx)
    make_part('belly', ell_cap(bc, br, (0.2, -0.3, -1), 40, seg=18, rows=5), 'hornbill_body2', root, Mx)
    # the long tail: black with a broad white band
    make_part('tail', prism([V(-0.3, 0, 0.04), V(-0.72, 0, 0.1), V(-0.74, 0, -0.06), V(-0.3, 0, -0.06)], Y * 0.08), 'hornbill_white', root, Mx, subsurf=0, smooth=False)
    make_part('tail2', prism([V(-0.3, 0.0, 0.03), V(-0.5, 0, 0.07), V(-0.52, 0, -0.05), V(-0.3, 0, -0.05)], Y * 0.1), 'hornbill_body', root, Mx, subsurf=0, smooth=False)
    hc, hr = V(0.28, 0, 0.08), (0.13, 0.11, 0.12)
    make_part('head', blob(hc, *hr, seg=18, rows=10), 'hornbill_body', root, Mx)
    make_part('beak', cone(V(0.36, 0, 0.05), V(0.78, 0, -0.08), 0.085, flat=0.7, seg=14), 'hornbill_beak', root, Mx)
    make_part('beak2', cone(V(0.36, 0, 0.0), V(0.66, 0, -0.07), 0.045, flat=0.7, seg=10), 'hornbill_beak2', root, Mx)
    make_part('casque', CK.tube([V(0.32, 0, 0.15), V(0.48, 0, 0.18), V(0.62, 0, 0.17), V(0.66, 0, 0.24), V(0.58, 0, 0.27)], 0.05, 0.03, seg=10), 'hornbill_casque', root, Mx)
    hsurf = ellipsoid_surf(hc, *hr)
    p, n = hsurf(0.11, -1.1)
    eye_one('hornbill', 'r', p - n * 0.01, n, root, Mx, P)
    make_part('eyering', torus(p + n * 0.01, 0.07, 0.015, axis=n, seg=16, rseg=5), 'hornbill_skin', root, Mx, subsurf=0)
    # broad rounded wings drawn in the side view's plane: they swing up over the back and down under the belly
    for side, sgn, ph in (('f', 1, 0.35), ('n', -1, 0.0)):
        sh = V(0.0, sgn * 0.14, 0.08)
        f = math.sin(TAU * t + ph) if pose == 'fly' else flap
        d = V(-0.45, 0, 0.95 * f + 0.15).normalized()
        e = V(-d.z, 0, d.x)
        wc = sh + d * 0.3
        make_part('wing_' + side, ellipsoid(wc, d * 0.33, Y * 0.03, e * 0.16, seg=18, rows=8), 'hornbill_body2' if side == 'f' else 'hornbill_body', root, Mx)
        make_part('edge_' + side, ellipsoid(wc + d * 0.06 - e * 0.13 * (1 if d.z >= 0 else -1) + Y * sgn * -0.005, d * 0.26, Y * 0.032, e * 0.06, seg=14, rows=6), 'hornbill_white', root, Mx)


BUILDERS = {'macaque': build_macaque, 'gecko': build_gecko, 'rafflesia': build_rafflesia, 'hornbill': build_hornbill}


def build(kind, pose, t=0.0):
    if kind not in KINDS or pose not in POSES[kind]:
        raise ValueError('unknown %s/%s' % (kind, pose))
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    IE.thin_face_ink(root)
    return root
