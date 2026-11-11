# mx_extras: the rebuilt Mexico's new cast (29_tour_mx.js), rendered into their own atlas `mx_x` so the live `mx`
# atlas is never re-packed. The game points these enemies at it with cfg.atlas = 'mx_x'.
#   elote      the BURST pose of 1-1's corn cob (the same model as mx_enemies_a.py, whose other poses stay in 'mx'): the
#              cob pops, husk flung out, kernels flying off as popcorn           burst                               feet 30 px
#   popcorn    what an elote pops into: a puffy cluster of popped kernels with a golden hull and a face
#                                                                                 walk(t) hop stun flat ko            feet 14 px
#   axowalk    the land axolotl of the cenote's air pocket (regrower)            walk(t) tiny(t) regrow stun flat ko feet 16 px
#   axoswim    the swimming axolotl of the cenote (regrower)                      swim(t) tiny(t) ko                  centre 14 px
#   blindfish  a pale, eyeless cave fish with whiskers                           swim(t) tell charge stun ko         centre 16 px
#   swallow    a cave swallow of the Pit of Swallows                             fly(t) ko                            centre 12 px
# Render and pack (build_country.sh packs only <cc>_enemies*.py into the country atlas):
#   W=<work>/mx_x; JOB=enemies:mx_extras LOOK=toon OUT=$W NAME=mx_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/mx_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mx_enemies_a as A
import mx_enemies_b as B
from mx_enemies_b import (TAU, X, Y, Z, V, tr, scl, rot_x, rot_y, rot_z, perp_frame, ellipsoid, sphere, blob, tube, sheet,
                          Spine, catmull)

PX = 28.1
KINDS = ['elote', 'popcorn', 'axowalk', 'axoswim', 'blindfish', 'swallow']
POSES = {
    'elote': ['burst'],
    'popcorn': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'axowalk': ['walk', 'tiny', 'regrow', 'stun', 'flat', 'ko'],
    'axoswim': ['swim', 'tiny', 'ko'],
    'blindfish': ['swim', 'tell', 'charge', 'stun', 'ko'],
    'swallow': ['fly', 'ko'],
}
FRAMES = {('popcorn', 'walk'): (6, 10), ('axowalk', 'tiny'): (6, 12), ('axoswim', 'tiny'): (6, 10)}
ORIGIN = {'elote': 'feet', 'popcorn': 'feet', 'axowalk': 'feet', 'axoswim': 'centre', 'blindfish': 'centre', 'swallow': 'centre'}
HEIGHT = {'elote': 30 / PX, 'popcorn': 0.42, 'axowalk': 0.62}
SIZE = {'axoswim': 0.56, 'blindfish': 0.66, 'swallow': 0.46}

A.COLORS.update({'elote_pop': '#fff6dc', 'elote_pop_hull': '#f2b830'})
B.COLORS.update({
    'popcorn_body': '#fff4d6', 'popcorn_shade': '#ffe8b0', 'popcorn_hull': '#f2b830', 'popcorn_hull_dk': '#c8861a',
    'popcorn_feet': '#e88a2a', 'popcorn_eye_white': '#ffffff', 'popcorn_pupil': '#1a1020', 'popcorn_mouth': '#7a2a1a',
    'popcorn_cheek': '#ffa0a0', 'popcorn_star': '#ffd84a',
})
for k in ('axowalk', 'axoswim'):
    B.COLORS.update({k + '_body': '#ffaacc', k + '_fin': '#ffc6de', k + '_gill': '#ff5a9a', k + '_limb': '#f49cc4',
                     k + '_eye_white': '#ffffff', k + '_pupil': '#1a1020', k + '_mouth': '#c84a7a', k + '_belly': '#ffd0e2',
                     k + '_spark': '#fff4a0'})
B.COLORS.update({
    'blindfish_body': '#f4e6ee', 'blindfish_back': '#e6cfdc', 'blindfish_fin': '#e8bcd2', 'blindfish_vein': '#ff9ab8',
    'blindfish_pit': '#b84a78', 'blindfish_whisker': '#c890ac', 'blindfish_mouth': '#6a2440', 'blindfish_tongue': '#ff7a9a',
    'blindfish_tooth': '#ffffff', 'blindfish_eye_white': '#ffffff', 'blindfish_pupil': '#1a1020', 'blindfish_star': '#ffd84a',
    'swallow_back': '#2e4a9a', 'swallow_wing': '#2a4088', 'swallow_wing_tip': '#1c2a62', 'swallow_throat': '#c84a2a',
    'swallow_belly': '#f6ead2', 'swallow_beak': '#2a2026', 'swallow_eye_white': '#ffffff', 'swallow_pupil': '#1a1020',
    'swallow_body': '#2a3a72',
})


def clear(kind=None):
    for k in ([kind] if kind else KINDS):
        root = bpy.data.objects.get(k)
        if root is None:
            continue
        for ob in list(root.children_recursive) + [root]:
            me = ob.data if ob.type == 'MESH' else None
            bpy.data.objects.remove(ob, do_unlink=True)
            if me is not None and me.users == 0:
                bpy.data.meshes.remove(me)


# ================================================================ ELOTE (+ burst)
A.ELOTE_POSE['burst'] = dict(sx=1.10, sz=1.04, lean=-5, lid=0.0, mouth='o', feet='stand', droop=1.0)


def build_elote(pose, t):
    root = A.new_root('elote', pose)
    A.build_elote(root, pose, t)
    if pose == 'burst':
        # kernels popping off the cob in every direction, each one a little popcorn puff
        for k in range(6):
            a = TAU * k / 6 + 0.5
            r = 0.52 + 0.06 * (k % 2)
            c = Vector((math.cos(a) * r, -0.12 if k % 2 else 0.1, 0.6 + math.sin(a) * r * 0.9))
            s = 0.12 + 0.02 * (k % 2)
            for j, (dx, dz) in enumerate(((0, 0), (s * 0.9, s * 0.4), (-s * 0.7, s * 0.6), (s * 0.1, s * 1.1))):
                A.make_part('pop%d_%d' % (k, j), sphere(c + Vector((dx, 0, dz)), s * (1.0 if j == 0 else 0.8), seg=10, rows=6),
                            'elote_pop', root, subsurf=1)
            if k % 2 == 0:
                A.make_part('hull%d' % k, ellipsoid(c + Vector((0, -s * 0.6, -s * 0.6)), X * s * 0.55, Y * s * 0.3, Z * s * 0.45, 8, 6),
                            'elote_pop_hull', root, subsurf=1)
    return root


# ================================================================ POPCORN
def build_popcorn(pose, t):
    sq, lean, lift, dz_feet = 1.0, 0.0, 0.0, 0.0
    if pose == 'walk':
        b = math.sin(TAU * t)
        lift = 0.03 * abs(b)
        sq = 1 + 0.06 * b
        lean = 5 * math.sin(TAU * t)
    elif pose == 'hop':
        sq, lift = 1.12, 0.06
    elif pose == 'stun':
        lean = -8
    elif pose == 'flat':
        sq = 0.4
    elif pose == 'ko':
        lean = -16
    M = tr(0, 0, lift) @ rot_y(lean) @ scl(1 / math.sqrt(sq), 1 / math.sqrt(sq), sq)
    b = B.Builder('popcorn', pose, M)
    # the puffy cluster: big round lumps (the popped kernel), lighter on top
    lumps = [((-0.09, 0.0, 0.17), 0.13), ((0.09, 0.0, 0.17), 0.13), ((0.0, 0.0, 0.33), 0.14), ((0.0, -0.02, 0.12), 0.12),
             ((-0.13, 0.03, 0.30), 0.10), ((0.13, 0.03, 0.30), 0.10), ((0.05, 0.05, 0.42), 0.08), ((-0.06, 0.05, 0.42), 0.075)]
    for i, (c, r) in enumerate(lumps):
        b.part('lump%d' % i, blob(c, r * 1.05, r * 0.9, r), 'body' if i % 3 else 'shade')
    # the golden hull still stuck on the bottom front
    b.part('hull', ellipsoid(V(0.07, -0.08, 0.07), X * 0.09, Y * 0.05, Z * 0.06, 12, 8), 'hull')
    b.part('hull2', ellipsoid(V(0.11, -0.10, 0.06), X * 0.035, Y * 0.02, Z * 0.025, 8, 6), 'hull_dk', subsurf=1)
    # face on the front lump
    face = V(0.06, -0.13, 0.26)
    if pose == 'ko':
        b.eye('l', face + V(-0.06, 0, 0.0), V(0.2, -1, 0.1), 0.045, shut=True)
        b.eye('r', face + V(0.05, 0.01, 0.0), V(0.5, -1, 0.1), 0.042, shut=True)
    else:
        dz = (Vector((-0.6, -0.4, 0.7)) if pose == 'stun' else None)
        b.eye('l', face + V(-0.055, 0, 0.0), V(0.2, -1, 0.1), 0.05, pupil=0.55, dazed=dz)
        b.eye('r', face + V(0.05, 0.01, 0.0), V(0.5, -1, 0.1), 0.047, pupil=0.55, dazed=(Vector((0.7, -0.4, -0.6)) if pose == 'stun' else None))
    mouth = [face + V(-0.03, -0.01, -0.07), face + V(0.0, -0.025, -0.09), face + V(0.035, -0.01, -0.07)]
    if pose in ('stun', 'ko'):
        mouth = [face + V(-0.03, -0.01, -0.08), face + V(0.0, -0.02, -0.07), face + V(0.03, -0.01, -0.085)]
    b.part('mouth', tube(mouth, 0.012, seg=6), 'mouth', subsurf=1)
    for s in (-1, 1):
        b.part('cheek%d' % s, ellipsoid(face + V(s * 0.085 + 0.01, 0.0, -0.045), X * 0.025, Y * 0.01, Z * 0.016, 8, 6), 'cheek', subsurf=1)
    # two little orange feet (tucked when hopping)
    if pose not in ('flat', 'hop'):
        for side, y in (('l', -0.06), ('r', 0.06)):
            ph = 0.0 if side == 'l' else math.pi
            dx = 0.04 * math.sin(TAU * t + ph) if pose == 'walk' else 0.0
            fz = 0.025 + (0.025 * max(0.0, math.cos(TAU * t + ph)) if pose == 'walk' else 0.0)
            if pose == 'hop':
                fz, dx = 0.0, -0.03
            b.part('foot_' + side, ellipsoid(V(dx + 0.02, y, fz - lift), X * 0.055, Y * 0.035, Z * 0.025, 10, 6), 'feet',
                   M=tr(0, 0, lift) @ rot_y(lean))
    if pose == 'stun':
        for k in range(3):
            a = TAU * k / 3
            b.part('star%d' % k, sphere(V(math.cos(a) * 0.12, math.sin(a) * 0.05, 0.56), 0.025, 8, 6), 'star', subsurf=1)
    return b.root


# ================================================================ AXOLOTL (land walker and swimmer)
AXO_PTS = [(0.42, 0.000, 1.00, 1.00), (0.38, 0.085, 0.85, 1.10), (0.28, 0.150, 0.95, 1.20), (0.15, 0.155, 1.00, 1.15),
           (0.02, 0.125, 1.00, 1.00), (-0.14, 0.095, 1.05, 0.90), (-0.28, 0.065, 1.40, 0.70), (-0.40, 0.035, 2.20, 0.50),
           (-0.48, 0.000, 1.00, 1.00)]


def axolotl(b, pose, t, legs='walk', arch=0.0, ns=1, wag_amp=0.6, er=0.08, shut=False, dazed=None, gill_up=0.0, lid=0.12):
    wag = wag_amp * math.sin(TAU * t)
    ctrl = []
    for x, r, kz, ky in AXO_PTS:
        z = arch * 0.09 * (1 - (x / 0.45) ** 2)
        w = max(0.0, -x - 0.05) / 0.45
        ctrl.append((x, wag * 0.10 * w * w, z, r, kz, ky))
    sp = Spine(ctrl)
    b.part('body', sp.mesh(rings=28, seg=22), 'body')

    def fin(u, w):
        v = 0.60 + 0.40 * u
        c, n, s, r, kz, ky = sp.frame(v)
        h = r * kz + 0.075 * math.sin(math.pi * u) ** 0.8
        return c + n * ((w * 2 - 1) * h)
    b.part('fin', sheet(fin, 8, 6, lambda u, w: 0.012 * (1 - abs(w * 2 - 1)) + 0.004), 'fin')
    for side_name, sgn in (('l', -1), ('r', 1)):
        for k in range(3):
            v = 0.30 + 0.04 * k
            a = sgn * (0.55 + 0.42 * k)
            base, nrm = sp.point(v, a), sp.normal(v, a)
            wig = 0.15 * math.sin(TAU * t + k * 1.3)
            d = (nrm * 1.0 - X * 0.40 + Z * (0.55 - 0.45 * k + wig + gill_up)).normalized()
            path = [base - nrm * 0.02, base + d * 0.09, base + d * 0.17 - X * 0.03, base + d * 0.23 - X * 0.08]
            b.part('gill_%s%d' % (side_name, k), tube(path, 0.042, 0.018, seg=8), 'gill')
            px, py = perp_frame(d)
            for j in range(3):
                q = base + d * (0.08 + 0.055 * j) - X * 0.028 * j
                off = (px if j % 2 == 0 else -px) * 0.04
                b.part('frill_%s%d%d' % (side_name, k, j), ellipsoid(q + off, px * 0.046, py * 0.028, d * 0.03, 10, 6), 'gill', subsurf=1)
    for side_name, sgn in (('l', -1), ('r', 1)):
        v, a = 0.21, sgn * 0.80
        c, n = sp.point(v, a), sp.normal(v, a)
        b.eye(side_name, c - n * 0.02, n, er, shut=shut, pupil=0.6, lid=0 if shut else lid, dazed=dazed,
              look=Vector((0.5, -0.8 * ns, 0.1)))
    if pose == 'ko' or shut:
        v, a = 0.08, ns * -2.0
        c, n = sp.point(v, a), sp.normal(v, a)
        ax, ay = perp_frame(n)
        b.part('mouth', ellipsoid(c - n * 0.01, ax * 0.03, ay * 0.03, n * 0.02, 12, 6), 'mouth', subsurf=1)
    else:
        path = []
        for k in range(11):
            s = k / 10
            v = 0.04 + 0.17 * s
            a = ns * (-(math.pi / 2 + 0.50) + 0.60 * s * s)
            path.append(sp.point(v, a) + sp.normal(v, a) * 0.008)
        b.part('mouth', tube(path, 0.02, seg=8), 'mouth')
    # four stubby legs: walking (a diagonal gait, feet on the floor), paddling, or splayed
    for name, x, y, ph in (('leg_fl', 0.17, -0.11, 0.0), ('leg_fr', 0.17, 0.11, math.pi), ('leg_bl', -0.10, -0.10, math.pi), ('leg_br', -0.10, 0.10, 0.0)):
        hip = Vector((x, y, -0.06 + arch * 0.09 * (1 - (x / 0.45) ** 2)))
        if legs == 'walk':
            sw = math.sin(TAU * t + ph)
            foot = Vector((x + 0.06 * sw, y * 1.25, -0.205 + 0.04 * max(0.0, math.cos(TAU * t + ph))))
        elif legs == 'swim':
            sw = math.sin(TAU * t + ph)
            foot = Vector((x - 0.10 + 0.05 * sw, y * 1.5, -0.14))
        elif legs == 'flat':
            foot = Vector((x + (0.12 if x > 0 else -0.12), y * 1.9, -0.13))
        else:
            foot = Vector((x + 0.02, y * 1.3, -0.205))
        knee = (hip + foot) / 2 + Vector((0.02, y * 0.15, 0.0))
        b.part(name, tube([hip, knee, foot], 0.032, 0.03, seg=8), 'limb')
        b.part(name + '_paw', ellipsoid(foot + Vector((0.02, 0, 0.005)), X * 0.042, Y * 0.034, Z * 0.022, 10, 6), 'limb', subsurf=1)
    return sp


def build_axowalk(pose, t):
    k, lift = 0.95, 0.205
    if pose == 'walk':
        M = tr(0, 0, lift * k + 0.008 * abs(math.sin(TAU * t * 2))) @ scl(k, k, k)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, pose, t, legs='walk', wag_amp=0.5, er=0.09)
    elif pose == 'tiny':
        s = 0.55
        M = tr(0, 0, lift * k * s + 0.006 * abs(math.sin(TAU * t * 2))) @ scl(k * s, k * s, k * s)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, pose, t, legs='walk', wag_amp=0.7, er=0.105, lid=0.0)
    elif pose == 'regrow':
        s = 0.8
        M = tr(0, 0, lift * k * s) @ scl(k * s * 0.95, k * s, k * s * 1.08)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, pose, 0.25, legs='stand', er=0.1, lid=0.0, gill_up=0.5)
        for j in range(4):
            a = TAU * j / 4 + 0.4
            b.part('spark%d' % j, sphere(V(0.1 + math.cos(a) * 0.45, -0.1, 0.12 + math.sin(a) * 0.3), 0.035, 8, 6), 'spark', subsurf=1)
    elif pose == 'stun':
        M = tr(0, 0, lift * k) @ rot_y(-6) @ scl(k * 1.03, k, k * 0.95)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, pose, 0.0, legs='stand', wag_amp=0.0, dazed=Vector((0.25, -0.8, 0.55)), gill_up=-0.4)
    elif pose == 'flat':
        M = tr(0, 0, 0.07) @ scl(k * 1.25, k * 1.1, k * 0.38)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, pose, 0.0, legs='flat', wag_amp=0.0, shut=True, gill_up=-0.5)
    else:   # ko: tipped over, eyes shut, gills drooping
        M = tr(0, 0, lift * k + 0.05) @ rot_y(28) @ scl(k, k, k)
        b = B.Builder('axowalk', pose, M)
        axolotl(b, 'ko', 0.0, legs='flat', wag_amp=0.0, shut=True, gill_up=-0.7)
    return b.root


def build_axoswim(pose, t):
    k = 0.92
    if pose == 'swim':
        M = tr(0, 0, 0.012 * math.sin(TAU * t)) @ rot_y(-4 * math.sin(TAU * t)) @ scl(k, k, k)
        b = B.Builder('axoswim', pose, M)
        axolotl(b, pose, t, legs='swim', wag_amp=0.9, er=0.09)
    elif pose == 'tiny':
        s = 0.55
        M = rot_y(-6 * math.sin(TAU * t)) @ scl(k * s, k * s, k * s)
        b = B.Builder('axoswim', pose, M)
        axolotl(b, pose, t, legs='swim', wag_amp=1.0, er=0.11, lid=0.0)
    else:
        b = B.Builder('axoswim', pose, scl(k, k, k))
        axolotl(b, 'ko', 0.0, legs='flat', wag_amp=0.0, shut=True, gill_up=-0.7)
        b.root.matrix_world = rot_y(150)          # turned by the root: a turn baked into the mesh loses the outline
    return b.root


# ================================================================ BLIND FISH
def build_blindfish(pose, t):
    ns = -1 if pose == 'ko' else 1
    wag = math.sin(TAU * t) if pose == 'swim' else 0.0
    curl = {'tell': 0.9, 'charge': -0.2, 'stun': 0.3}.get(pose, 0.0)
    if pose == 'ko':
        M = rot_x(180) @ rot_y(14)
    elif pose == 'stun':
        M = rot_y(-14) @ rot_x(-10)
    elif pose == 'charge':
        M = rot_y(6) @ scl(1.06, 0.95, 0.92)
    else:
        M = Matrix.Identity(4)
    M = scl(0.88, 0.88, 0.88) @ M
    b = B.Builder('blindfish', pose, M)
    # a long eel-ish cave fish: a blunt head, a fat middle, a long tapering tail
    pts = [(0.50, 0.000, 1.0, 1.0), (0.46, 0.09, 0.85, 0.75), (0.36, 0.165, 0.95, 0.7), (0.20, 0.20, 1.0, 0.66),
           (0.02, 0.19, 1.0, 0.64), (-0.16, 0.15, 1.0, 0.6), (-0.32, 0.09, 1.05, 0.58), (-0.42, 0.04, 1.1, 0.6), (-0.46, 0.0, 1.0, 1.0)]
    ctrl = []
    for x, r, kz, ky in pts:
        w = max(0.0, -x + 0.05) / 0.5
        ctrl.append((x, 0.07 * wag * w * w, curl * 0.12 * w * w + 0.03 * wag * w, r, kz, ky))
    sp = Spine(ctrl)
    b.part('body', sp.mesh(rings=26, seg=22), 'body')
    # the darker back and see-through pink veins (stripes)
    for k, vc in enumerate((0.40, 0.53, 0.66)):
        b.part('vein%d' % k, sp.mesh(rings=3, seg=22, v0=vc - 0.02, v1=vc + 0.02, scale=1.03), 'vein', subsurf=1)
    # a soft forked tail fan
    tail_c = sp.frame(1.0)[0]
    T = tr(tail_c) @ rot_z(26 * wag + curl * 30)
    def tail(u, w):
        ww = w * 2 - 1
        return T @ V(-u * (0.24 - 0.07 * (1 - abs(ww)) * u), 0.0, ww * (0.04 + 0.16 * u))
    b.part('tail', sheet(tail, 6, 6, lambda u, w: 0.012 * (1 - abs(w * 2 - 1)) * (1 - 0.6 * u) + 0.004), 'fin')
    # a frilly dorsal fin running down the back (raised high in the tell)
    hi = 0.13 if pose == 'tell' else 0.08
    def dorsal(u, w):
        v = 0.30 + 0.45 * u
        c, n, s, r, kz, ky = sp.frame(v)
        h = hi * math.sin(math.pi * u) ** 0.6 + 0.01
        return c + n * (r * kz - 0.02 + w * h) - X * 0.06 * w
    b.part('dorsal', sheet(dorsal, 8, 3, lambda u, w: 0.012 * (1 - w) + 0.004), 'fin')
    def ventral(u, w):
        v = 0.55 + 0.3 * u
        c, n, s, r, kz, ky = sp.frame(v)
        h = 0.06 * math.sin(math.pi * u) ** 0.6 + 0.01
        return c - n * (r * kz - 0.02 + w * h) - X * 0.04 * w
    b.part('ventral', sheet(ventral, 6, 3, lambda u, w: 0.012 * (1 - w) + 0.004), 'fin')
    # a big pectoral fin (flared wide in the tell)
    pc = V(0.18, -0.13 * ns, -0.05)
    flare = {'tell': 0.8, 'charge': -0.6}.get(pose, 0.0)
    pd = Vector((-0.75, -(0.35 + flare) * ns, -0.45 + 0.4 * flare + 0.25 * wag)).normalized()
    # no eyes: two soft pink pits where eyes would be, with a pale rim
    for side, sgn in (('l', -1), ('r', 1)):
        v, a = 0.15, sgn * 1.0 * ns
        c, n = sp.point(v, a), sp.normal(v, a)
        ax, ay = perp_frame(n)
        b.part('pit_' + side, ellipsoid(c + n * 0.012, ax * 0.055, ay * 0.04, n * 0.02, 12, 6), 'pit', subsurf=1)
        b.part('brow_' + side, tube([c + n * 0.01 + Z * 0.045 - X * 0.04, c + n * 0.02 + Z * 0.06, c + n * 0.01 + Z * 0.05 + X * 0.04], 0.011, seg=6),
               'back', subsurf=1)
    # whisker barbels that droop from the lip
    for k, (dy, l) in enumerate(((-0.07, 0.20), (0.07, 0.18), (-0.04, 0.14))):
        base = V(0.47, dy * ns, -0.05)
        tw = 0.04 * math.sin(TAU * t + k)
        path = [base, base + V(0.07, dy * 0.4 * ns, -0.05 + tw), base + V(0.12, dy * 0.7 * ns, -0.11 - tw), base + V(l * 0.85, dy * ns, -0.16)]
        b.part('whisker%d' % k, tube(path, 0.014, 0.008, seg=6), 'whisker', subsurf=1)
    # the mouth: a sleepy little line, a wide gape in the charge, a wobble when dazed
    if pose == 'charge':
        mc = V(0.45, -0.06 * ns, -0.03)
        b.part('gape', ellipsoid(mc, X * 0.06, Y * 0.05, Z * 0.075, 14, 8), 'mouth', subsurf=1)
        b.part('tongue', ellipsoid(mc + V(0.01, -0.02, -0.04), X * 0.035, Y * 0.03, Z * 0.025, 10, 6), 'tongue', subsurf=1)
        for k in range(4):
            b.part('tooth%d' % k, ellipsoid(mc + V(0.02, -0.035, 0.065 - 0.13 * (k // 2)) + V(0, 0.02 * (k % 2), 0), X * 0.012, Y * 0.012, Z * 0.018, 6, 4), 'tooth', subsurf=0)
    else:
        path = []
        wob = 0.015 if pose == 'stun' else 0.0
        for k in range(9):
            s = k / 8
            v = 0.02 + 0.13 * s
            a = ns * (-(math.pi / 2 + 0.55) + 0.5 * s * s)
            path.append(sp.point(v, a) + sp.normal(v, a) * 0.008 + Z * wob * math.sin(s * TAU * 1.5))
        b.part('mouth', tube(path, 0.018, seg=8), 'mouth')
    if pose == 'stun':
        for k in range(3):
            a = TAU * k / 3
            b.part('star%d' % k, sphere(V(0.15 + math.cos(a) * 0.14, math.sin(a) * 0.05, 0.3), 0.03, 8, 6), 'star', subsurf=1, M=Matrix.Identity(4))
    return b.root


# ================================================================ SWALLOW
def build_swallow(pose, t):
    ko = pose == 'ko'
    M = scl(1.15, 1.15, 1.15) @ (rot_x(180) @ rot_y(-15) if ko else rot_y(-6))
    b = B.Builder('swallow', pose, M)
    # a sleek torpedo body: dark blue back, cream belly, rust-red face
    b.part('body', ellipsoid(V(0.0, 0, 0.0), X * 0.20, Y * 0.085, Z * 0.085, 18, 10), 'back')
    b.part('belly', ellipsoid(V(0.03, -0.012, -0.03), X * 0.17, Y * 0.08, Z * 0.07, 16, 8), 'belly')
    b.part('head', sphere(V(0.17, 0, 0.03), 0.085), 'back')
    b.part('throat', ellipsoid(V(0.215, -0.02, -0.005), X * 0.05, Y * 0.065, Z * 0.05, 12, 8), 'throat')
    b.part('beak', tube([V(0.245, 0, 0.03), V(0.285, 0, 0.022), V(0.305, 0, 0.018)], 0.022, 0.006, seg=8), 'beak', subsurf=1)
    b.eye('l', V(0.19, -0.065, 0.06), V(0.4, -1, 0.25), 0.04, pupil=0.6, shut=ko, lid=0.1, look=Vector((0.7, -0.7, 0.0)))
    # a long, deeply forked tail
    for s in (-1, 1):
        path = [V(-0.16, s * 0.01, 0.0), V(-0.28, s * 0.025, 0.01 + 0.015 * s), V(-0.42, s * 0.04, 0.035 * s + 0.01)]
        b.part('tail%d' % s, tube(path, 0.04, 0.008, seg=8), 'wing_tip')
    # two long pointed wings, flapping
    flap = -70 if ko else 50 * math.cos(TAU * t)
    for side, sgn in (('far', 1), ('near', -1)):
        root = V(0.04, sgn * 0.05, 0.04)
        Mw = tr(root) @ rot_x(-sgn * flap) @ rot_z(sgn * 18)
        def wing(u, w, Mw=Mw, sgn=sgn):
            span = 0.36 * u
            chord = 0.13 * (1 - u) ** 0.8 + 0.015
            return Mw @ V(-0.03 - span * 0.45 + (w - 0.3) * chord, sgn * span, 0.0)
        b.part('wing_' + side, sheet(wing, 8, 3, lambda u, w: 0.012 * (1 - 0.7 * u) + 0.004), 'wing' if sgn < 0 else 'wing_tip', subsurf=1)
    return b.root


BUILD = {'elote': build_elote, 'popcorn': build_popcorn, 'axowalk': build_axowalk, 'axoswim': build_axoswim,
         'blindfish': build_blindfish, 'swallow': build_swallow}


def build(kind, pose, t=0.0):
    clear(kind)
    return BUILD[kind](pose, t)
