# es_enemies: the Spain cast of Super Brady-O World (world 6) for the pre-rendered Fiesta Toon sprite pipeline.
# All original cartoon designs. Same conventions and shared helpers as ma_enemies.py (imported from it):
#   Z up, every character FACES +X, the camera looks along +Y; 1 m = 28.1 px; feet-origin kinds stand on z = 0,
#   centre-origin kinds (flyer, swimmers, items) are centred on the origin; materials '<kind>_<part>'.
#
#   tomato    a plump ripe tomato with a green star calyx and a curly stem; hops    walk(t) hop stun flat ko        feet, 24 px
#   orange    a Spanish orange with a navel, two leaves and an orange blossom; rolls walk(t) curl roll(t) stun flat ko feet, 20 px
#   horchata  a tall glass of horchata with a striped straw and a cinnamon dusting   walk(t) stun flat ko            feet, 30 px
#   bat       a little night bat with big ears and amber eyes                        fly(t) swoop stun ko            centre, 30 px
#   jelly     a pink jellyfish with a glowing bell and frilly arms (custom class)    swim(t) ko                      centre, 22 px
#   shark     a stocky blue-grey cartoon shark with a toothy grin                    swim(t) ko                      centre, 44 px
#   petardo   a red firecracker with yellow bands and a fuse; lights it to charge    walk(t) notice charge stun flat ko feet, 26 px
#   coin      the ORANGE: a small orange with a leaf                                 spin(t)                         centre, 16 px
#   star      the GOLDEN FAN: an open folding fan with a red tassel                  idle(t)                         centre, 24 px
#   qblock    the item block: a wooden fruit crate with a painted orange label       idle                            centre, 32 px
#   used      the same crate spent (grey)                                            idle                            centre, 32 px
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ma_enemies as M
from ma_enemies import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, smooth01, ellipsoid, sphere, blob, ell_cap,
                        tube, cone, lathe, torus, prism, box_bm, lathe_surf, ellipsoid_surf, oval_patch, on_face,
                        make_part, new_root, eye_one, brow, mouth_bm, biped_legs, face_poly, superellipsoid)

PX = 28.1
KINDS = ['tomato', 'orange', 'horchata', 'bat', 'jelly', 'shark', 'petardo', 'coin', 'star', 'qblock', 'used']
POSES = {
    'tomato': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'orange': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'horchata': ['walk', 'stun', 'flat', 'ko'],
    'bat': ['fly', 'swoop', 'stun', 'ko'],
    'jelly': ['swim', 'ko'],
    'shark': ['swim', 'ko'],
    'petardo': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'coin': ['spin'], 'star': ['idle'], 'qblock': ['idle'], 'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1)}
ORIGIN = {'tomato': 'feet', 'orange': 'feet', 'horchata': 'feet', 'petardo': 'feet', 'bat': 'centre', 'jelly': 'centre',
          'shark': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'}
HEIGHT = {'tomato': 24 / PX, 'orange': 20 / PX, 'horchata': 30 / PX, 'petardo': 26 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'bat': 30 / PX, 'jelly': 24 / PX, 'shark': 44 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX})

COLORS = {
    'tomato_skin': '#e8322a', 'tomato_skin2': '#c81e1e', 'tomato_shine': '#ff8a7a', 'tomato_calyx': '#2a8a3a', 'tomato_stem': '#3a6a2a',
    'tomato_feet': '#2a7a32', 'tomato_eye_white': '#fbfbf2', 'tomato_pupil': '#1a1020', 'tomato_mouth': '#5a0e0e',
    'orange_peel': '#ff8a1a', 'orange_shine': '#ffc46a', 'orange_navel': '#d86a10', 'orange_leaf': '#2e8a3a', 'orange_stem': '#6a8a3a',
    'orange_petal': '#fffaf0', 'orange_pistil': '#ffd23a', 'orange_feet': '#c86a10', 'orange_eye_white': '#fbfbf2',
    'orange_pupil': '#1a1020', 'orange_mouth': '#5a1a10',
    'horchata_glass': '#dceef6', 'horchata_milk': '#f4ead0', 'horchata_milk2': '#e8dab8', 'horchata_cinnamon': '#a8642a',
    'horchata_straw': '#e8322a', 'horchata_straw2': '#ffffff', 'horchata_feet': '#8a7a6a', 'horchata_eye_white': '#fbfbf2',
    'horchata_pupil': '#1a1020', 'horchata_mouth': '#8a2a2a',
    'bat_fur': '#6a5a8e', 'bat_fur2': '#57487a', 'bat_wing': '#8a6ab0', 'bat_bone': '#3a2e52', 'bat_ear': '#e88aa8',
    'bat_eye_white': '#ffd23a', 'bat_pupil': '#1a1020', 'bat_mouth': '#1a1020', 'bat_fang': '#ffffff',
    'jelly_bell': '#ff7ac0', 'jelly_innerglow': '#ffc8ea', 'jelly_rim': '#ff5aa8', 'jelly_arm': '#ff9ad2', 'jelly_tent': '#ffb0de',
    'jelly_eye_white': '#fbfbf2', 'jelly_pupil': '#1a1020', 'jelly_mouth': '#8a1a4a',
    'shark_skin': '#6a8aa8', 'shark_skin2': '#58789a', 'shark_belly': '#eef4fa', 'shark_fin': '#5a7a98', 'shark_tooth': '#ffffff',
    'shark_gill': '#3a5a78', 'shark_eye_white': '#fbfbf2', 'shark_pupil': '#1a1020', 'shark_mouth': '#3a1a2a',
    'petardo_paper': '#e8322a', 'petardo_band': '#ffd23a', 'petardo_cap': '#f4e8d0', 'petardo_fuse': '#5a4a3a',
    'petardo_sparkglow': '#ffd23a', 'petardo_spark2glow': '#ff7a1a', 'petardo_feet': '#7a1a1a', 'petardo_eye_white': '#fbfbf2',
    'petardo_pupil': '#1a1020', 'petardo_mouth': '#4a0e0e',
    'coin_peel': '#ff8a1a', 'coin_shine': '#ffc46a', 'coin_leaf': '#2e8a3a', 'coin_stem': '#6a8a3a',
    'star_gold': '#ffd24a', 'star_gold2': '#ffe890', 'star_rib': '#c8901a', 'star_tassel': '#c8222a', 'star_glow': '#fff6c0',
    'qblock_wood': '#c8945a', 'qblock_wood2': '#a8743a', 'qblock_label': '#f4ecd8', 'qblock_orange': '#ff8a1a',
    'qblock_leaf': '#2e8a3a', 'qblock_nail': '#5a4a3a', 'qblock_glow': '#fff0c0',
    'used_wood': '#9a8a7a', 'used_wood2': '#7a6a5a', 'used_label': '#b0a898', 'used_nail': '#5a5048',
}
M.COLORS.update(COLORS)


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


STD_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=3,   lid=0.12, mouth='grin',   feet='walk'),
    'hop':  dict(sx=0.92, sz=1.12, lean=-4,  lid=0.00, mouth='grin',   feet='tuck', eye=1.1),
    'curl': dict(sx=1.05, sz=0.95, lean=14,  lid=0.70, mouth='small',  feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0,   lid=1.00, mouth=None,     feet=None),
    'notice': dict(sx=0.96, sz=1.06, lean=-6, lid=0.00, mouth='open', feet='stand', eye=1.2, pupil=0.7),
    'charge': dict(sx=1.06, sz=0.95, lean=14, lid=0.30, mouth='grin',  feet='walk', angry=True),
    'stun': dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-12, lid=0.00, mouth='o',      feet='limp', x=True),
}


# ================================================================ TOMATO
def build_tomato(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.09, skin='tomato_skin')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.025 * abs(math.sin(TAU * t))
        lean += 4 * math.sin(TAU * t)
    lift = 0.12 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ about((0, 0, 0.1), diag(sx, sx, sz))
    c, r = V(0, 0, 0.44), (0.4, 0.36, 0.33)
    make_part('body', blob(c, *r, seg=28, rows=16), 'tomato_skin', root, Mx)
    surf = ellipsoid_surf(c, *r)
    # soft lobes: three slightly darker grooves down the camera side
    for k, a in enumerate((-1.95, -1.45, -0.95)):
        path = [surf(c.z + r[2] * 0.85 - 0.6 * r[2] * j / 4, a)[0] + V(0, -0.006, 0) for j in range(5)]
        make_part('groove%d' % k, tube(path, 0.012, seg=6), 'tomato_skin2', root, Mx, subsurf=1)
    make_part('shine', oval_patch(surf, c.z + r[2] * 0.5, 0.06, -2.1, 0.28), 'tomato_shine', root, Mx)
    top = c + Z * r[2]
    for k in range(5):
        a = TAU * k / 5 + 0.3
        d = V(math.cos(a), math.sin(a) * 0.8, 0)
        leaf = prism([top + d * 0.03 + V(0, 0, 0.01), top + d * 0.16 + V(0, 0, 0.05) + d.cross(Z) * 0.05, top + d * 0.26 + V(0, 0, -0.03),
                      top + d * 0.16 + V(0, 0, 0.03) - d.cross(Z) * 0.05], Z * 0.025)
        make_part('calyx%d' % k, leaf, 'tomato_calyx', root, Mx, subsurf=1)
    stem = [top, top + V(0.0, 0, 0.08), top + V(0.06, 0, 0.13), top + V(0.1, 0, 0.1)]
    make_part('stem', tube(stem, 0.03, 0.02, seg=8), 'tomato_stem', root, Mx)
    for side, az in (('r', -0.42), ('l', -1.2)):
        p, n = surf(0.52, az)
        eye_one('tomato', side, p - n * 0.012, n, root, Mx, P)
    if P['mouth']:
        make_part('mouth', mouth_bm(surf, P['mouth'], 0.36, math.radians(8), math.radians(-100), scale=1.1), 'tomato_mouth', root, Mx)
    if P['feet']:
        biped_legs('tomato', root, T((0, 0, lift)), P, t, (0.0, 0.1, 0.18), (0.1, 0.06, 0.045), 0.035, 'tomato_feet')


# ================================================================ ORANGE (the Spanish one: navel, blossom)
def orange_body(root, Mx, c, r):
    make_part('peel', sphere(c, r, seg=26, rows=14), 'orange_peel', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('shine', oval_patch(surf, c.z + r * 0.55, 0.06, -1.9, 0.42), 'orange_shine', root, Mx)
    make_part('navel', ellipsoid(c - Z * (r - 0.01), X * 0.05, Y * 0.05, Z * 0.02, seg=12, rows=6), 'orange_navel', root, Mx)
    top = c + Z * r
    make_part('stem', tube([top - Z * 0.02, top + V(0.0, 0, 0.06)], 0.025, 0.02, seg=8), 'orange_stem', root, Mx)
    for k, (dx, ang) in enumerate(((-0.14, 25), (0.13, -30))):
        lc = top + V(dx, 0, 0.06)
        leaf = ellipsoid(lc, X * 0.13, Y * 0.02, Z * 0.05, seg=12, rows=6)
        make_part('leaf%d' % k, leaf, 'orange_leaf', root, Mx @ about(lc, rot_y(ang)), subsurf=1)
    # an orange blossom (azahar) beside the stem
    bc = top + V(0.04, -0.06, 0.1)
    for k in range(5):
        a = TAU * k / 5
        make_part('petal%d' % k, ellipsoid(bc + V(math.cos(a) * 0.045, -0.01, math.sin(a) * 0.045), X * 0.035, Y * 0.012, Z * 0.035, seg=10, rows=6),
                  'orange_petal', root, Mx, subsurf=1)
    make_part('pistil', sphere(bc + V(0, -0.025, 0), 0.022, seg=10, rows=6), 'orange_pistil', root, Mx, subsurf=1)
    return surf


def build_orange(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.085, skin='orange_peel')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'roll':
        c, r = V(0, 0, 0.3), 0.3
        MR = about(c, rot_y(360 * t))
        surf = orange_body(root, MR, c, r)
        for side, az in (('r', -0.35), ('l', -1.2)):
            p, n = surf(0.36, az)
            eye_one('orange', side, p - n * 0.012, n, root, MR, P)
        return
    c, r = V(0, 0, 0.38), 0.3
    surf = orange_body(root, Mx, c, r)
    for side, az in (('r', -0.35), ('l', -1.2)):
        p, n = surf(0.45, az)
        eye_one('orange', side, p - n * 0.012, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.28, math.radians(5), math.radians(-105), scale=1.0), 'orange_mouth', root, Mx)
    biped_legs('orange', root, Mx, P, t, (0.0, 0.1, 0.2), (0.1, 0.06, 0.045), 0.035, 'orange_feet')


# ================================================================ HORCHATA
GLASS = [(0, 0.12), (0.17, 0.12), (0.19, 0.16), (0.235, 0.86), (0.25, 0.9), (0.225, 0.9), (0, 0.9)]


def build_horchata(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='horchata_milk')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    slosh = 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
        slosh = 0.02 * math.sin(TAU * t)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    make_part('glass', lathe(GLASS, seg=24), 'horchata_glass', root, Mx)
    # the milk shows through the glass: it sits just proud of the glass wall from the base to 0.8 m, leaving a clear
    # glass rim above it and a thick glass base below
    gr = lambda z: 0.19 + (0.235 - 0.19) * (z - 0.16) / 0.7
    milk = [(0, 0.2), (gr(0.2) + 0.012, 0.2)] + [(gr(z) + 0.014, z) for z in (0.4, 0.6, 0.78)] + [(gr(0.8) + 0.004, 0.8), (0, 0.8 + slosh)]
    make_part('milk', lathe(milk, seg=24), 'horchata_milk', root, Mx)
    make_part('top', ellipsoid(V(0, 0, 0.805), X * 0.235, Y * 0.235, Z * 0.025, seg=20, rows=6), 'horchata_milk2', root, Mx)
    for k, (dx, dy) in enumerate(((-0.08, -0.05), (0.06, -0.1), (0.1, 0.04), (-0.02, 0.08), (0.0, -0.16))):
        make_part('cin%d' % k, sphere(V(dx, dy, 0.83), 0.018, seg=8, rows=6), 'horchata_cinnamon', root, Mx, subsurf=0)
    # the striped straw, leaning back
    a, b = V(-0.04, 0.04, 0.5), V(-0.2, 0.04, 1.18)
    n = 6
    for k in range(n):
        p0, p1 = a.lerp(b, k / n), a.lerp(b, (k + 1) / n)
        make_part('straw%d' % k, tube([p0, p1], 0.032, seg=10), 'horchata_straw' if k % 2 else 'horchata_straw2', root, Mx, subsurf=0)
    make_part('bend', tube([b, b + V(-0.04, 0, 0.04), b + V(-0.12, 0, 0.04)], 0.032, seg=10), 'horchata_straw', root, Mx, subsurf=0)
    surf = lathe_surf(milk)
    for side, az in (('r', -0.42), ('l', -1.2)):
        p, n_ = surf(0.6, az)
        eye_one('horchata', side, p - n_ * 0.006, n_, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.44, math.radians(5), math.radians(-100), scale=0.9), 'horchata_mouth', root, Mx)
    biped_legs('horchata', root, Mx, P, t, (0.0, 0.09, 0.14), (0.09, 0.055, 0.04), 0.032, 'horchata_feet')


# ================================================================ BAT (flyer, centre)
def build_bat(root, pose, t):
    P = {'er': 0.075, 'skin': 'bat_fur', 'lid': 0.1, 'look': Vector((0.5, -0.85, -0.2))}
    flap, tilt, roll = 0.0, 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.6, 28
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.9, True, 0.5
    else:
        flap, P['x'], roll = -0.7, True, 180
    Mx = rot_y(tilt) @ rot_x(0) @ (rot_y(roll) if roll else Matrix.Identity(4))
    bc = V(0, 0, -0.02)
    make_part('body', blob(bc, 0.17, 0.15, 0.19, seg=20, rows=12), 'bat_fur', root, Mx)
    make_part('belly', ell_cap(bc, (0.17, 0.15, 0.19), (0.2, -1, -0.3), 45, seg=16, rows=5), 'bat_fur2', root, Mx)
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
    # wings: a membrane of three scallops between finger bones, spread to the sides and flapping up and down
    for side, sgn in (('l', -1), ('r', 1)):
        shoulder = V(sgn * 0.12, 0.02, 0.05)
        up = 0.32 * flap
        fingers = [shoulder + V(sgn * 0.3, 0.05, 0.12 + up * 0.6), shoulder + V(sgn * 0.5, 0.06, 0.02 + up),
                   shoulder + V(sgn * 0.44, 0.06, -0.16 + up * 0.8), shoulder + V(sgn * 0.24, 0.05, -0.2 + up * 0.4)]
        pts = [shoulder] + fingers + [shoulder + V(sgn * 0.02, 0.04, -0.12)]
        # membrane as a fan of triangles (a prism per gap, with a scalloped notch)
        for k in range(len(fingers) - 1):
            a, b = fingers[k], fingers[k + 1]
            mid = (a + b) / 2
            notch = shoulder + (mid - shoulder) * 0.78
            make_part('wing_%s%d' % (side, k), prism([shoulder, a, notch, b], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        last = fingers[-1]
        make_part('wing_%s_end' % side, prism([shoulder, last, shoulder + V(sgn * 0.08, 0, -0.18)], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        for k, f in enumerate(fingers):
            make_part('bone_%s%d' % (side, k), tube([shoulder + V(0, -0.012, 0), f + V(0, -0.012, 0)], 0.016, 0.01, seg=6), 'bat_bone', root, Mx, subsurf=0)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('foot_' + side, tube([V(sgn * 0.06, 0, -0.18), V(sgn * 0.07, 0, -0.27)], 0.02, 0.015, seg=6), 'bat_bone', root, Mx, subsurf=0)


# ================================================================ JELLY (custom-class swimmer, centre)
def build_jelly(root, pose, t):
    P = {'er': 0.07, 'skin': 'jelly_bell', 'lid': 0.15}
    pulse = math.sin(TAU * t) if pose == 'swim' else -0.4
    Mx = Matrix.Identity(4)
    if pose == 'ko':
        P['x'] = True
        Mx = rot_y(160)
    sxz = 1 + 0.08 * pulse
    c = V(0, 0, 0.06)
    rx, rz = 0.32 * sxz, 0.26 / sxz
    make_part('bell', ellipsoid(c, X * rx, Y * rx * 0.85, Z * rz, seg=28, rows=12, phi1=math.pi * 0.55), 'jelly_bell', root, Mx)
    make_part('inner', ellipsoid(c + V(0, -0.02, 0.02), X * rx * 0.6, Y * rx * 0.5, Z * rz * 0.6, seg=20, rows=8, phi1=math.pi * 0.5), 'jelly_innerglow', root, Mx)
    rim_z = c.z - rz * math.cos(math.pi * 0.55)
    make_part('rim', torus((0, 0, rim_z), rx * 0.98, 0.035, seg=28, rseg=8), 'jelly_rim', root, Mx)
    for k in range(10):     # scalloped skirt
        a = TAU * k / 10
        make_part('scal%d' % k, sphere(V(rx * 0.95 * math.cos(a), rx * 0.8 * math.sin(a), rim_z - 0.03), 0.055, seg=10, rows=6), 'jelly_rim', root, Mx, subsurf=1)
    # four frilly oral arms and thin tentacles, swaying
    for k, x0 in enumerate((-0.12, -0.04, 0.04, 0.12)):
        path = []
        for j in range(6):
            u = j / 5
            sway = 0.05 * math.sin(TAU * (t + u * 0.6) + k)
            path.append(V(x0 * (1 + 0.4 * u) + sway, -0.04 + 0.02 * k, rim_z - 0.04 - 0.42 * u * (1 - 0.15 * pulse)))
        make_part('arm%d' % k, tube(path, 0.035, 0.015, seg=8), 'jelly_arm', root, Mx)
    for k in range(6):
        a = TAU * (k + 0.5) / 6
        x0, y0 = rx * 0.85 * math.cos(a), rx * 0.7 * math.sin(a)
        path = [V(x0 + 0.04 * math.sin(TAU * (t + j * 0.15) + k) * j / 4, y0, rim_z - 0.05 - 0.13 * j) for j in range(5)]
        make_part('tent%d' % k, tube(path, 0.012, 0.008, seg=6), 'jelly_tent', root, Mx, subsurf=1)
    surf = ellipsoid_surf(c, rx, rx * 0.85, rz)
    for side, az in (('r', -1.25), ('l', -1.9)):
        p, n = surf(c.z + rz * 0.45, az)
        eye_one('jelly', side, p - n * 0.01, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, 'smile' if pose == 'swim' else 'o', c.z + rz * 0.18, -1.35, -1.8, scale=0.8), 'jelly_mouth', root, Mx)


# ================================================================ SHARK (swimmer, centre)
def build_shark(root, pose, t):
    P = {'er': 0.065, 'skin': 'shark_skin', 'lid': 0.3, 'look': Vector((0.7, -0.7, -0.1))}
    wag = math.sin(TAU * t) if pose == 'swim' else 0.0
    Mx = Matrix.Identity(4)
    if pose == 'ko':
        P['x'] = True
        Mx = rot_x(180)
    xs = [0.72, 0.6, 0.4, 0.15, -0.1, -0.35, -0.55, -0.68]
    rs = [0.02, 0.13, 0.2, 0.22, 0.2, 0.14, 0.08, 0.05]
    path = [V(x, 0.04 * wag * max(0, -x) / 0.68, 0.015 * math.sin(TAU * t + x * 2)) for x in xs]
    radii = rs
    bm = tube(path, 0.2, seg=16, radii=radii)
    bm.transform(diag(1, 0.8, 1))
    make_part('body', bm, 'shark_skin', root, Mx)
    belly = [p + V(0, -0.02, -0.07) for p in path[1:6]]
    bb = tube(belly, 0.12, seg=12, radii=[0.08, 0.14, 0.15, 0.13, 0.08])
    bb.transform(diag(1, 0.82, 0.85))
    make_part('belly', bb, 'shark_belly', root, Mx)
    tail_root = path[-1] + V(0.06, 0, 0)
    MT = Mx @ about(tail_root, rot_z(18 * wag))
    make_part('tail_up', prism([tail_root + V(0.08, 0, 0.0), tail_root + V(-0.3, 0, 0.42), tail_root + V(-0.16, 0, 0.0)], Y * 0.05), 'shark_fin', root, MT, subsurf=0, smooth=False)
    make_part('tail_dn', prism([tail_root + V(0.08, 0, 0.0), tail_root + V(-0.22, 0, -0.3), tail_root + V(-0.14, 0, 0.0)], Y * 0.05), 'shark_fin', root, MT, subsurf=0, smooth=False)
    make_part('dorsal', prism([V(0.26, 0, 0.17), V(0.02, 0, 0.52), V(-0.14, 0, 0.15)], Y * 0.05), 'shark_fin', root, Mx, subsurf=0, smooth=False)
    make_part('pect', prism([V(0.25, -0.12, -0.12), V(0.05, -0.16, -0.3), V(0.08, -0.12, -0.1)], Y * 0.04), 'shark_fin', root, Mx @ about(V(0.2, -0.12, -0.1), rot_x(10 * wag)), subsurf=0, smooth=False)
    for k in range(3):
        make_part('gill%d' % k, tube([V(0.36 - k * 0.05, -0.17, 0.08), V(0.34 - k * 0.05, -0.18, -0.06)], 0.01, seg=6), 'shark_gill', root, Mx, subsurf=0)
    hsurf = ellipsoid_surf(V(0.45, 0, 0.0), 0.3, 0.17, 0.18)
    p, n = hsurf(0.08, -1.2)
    eye_one('shark', 'r', p - n * 0.01, n, root, Mx, P)
    if not P.get('x'):
        brow('shark', 'r', p - n * 0.01, n, root, Mx, P['er'], angry=0.7)
    # the grin with a row of little teeth
    grin = [V(0.68, -0.08, -0.06), V(0.6, -0.14, -0.1), V(0.48, -0.16, -0.1), V(0.4, -0.15, -0.06)]
    make_part('mouth', tube(grin, 0.022, seg=8), 'shark_mouth', root, Mx, subsurf=1)
    for k in range(4):
        q = grin[0].lerp(grin[-1], (k + 0.5) / 4) + V(0, -0.03, 0.0)
        make_part('tooth%d' % k, cone(q + V(0, 0, 0.0), q + V(0, -0.005, -0.045), 0.02, seg=6), 'shark_tooth', root, Mx, subsurf=0)


# ================================================================ PETARDO
PAPER = [(0, 0.12), (0.15, 0.12), (0.16, 0.14), (0.16, 0.8), (0.15, 0.82), (0, 0.82)]


def build_petardo(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='petardo_paper')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose in ('walk', 'charge'):
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 4 * math.sin(TAU * t)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    make_part('paper', lathe(PAPER, seg=20), 'petardo_paper', root, Mx)
    for k, z in enumerate((0.3, 0.62)):
        make_part('band%d' % k, lathe([(0.165, z - 0.05), (0.165, z + 0.05)], seg=20), 'petardo_band', root, Mx, subsurf=0)
    make_part('cap', lathe([(0.15, 0.82), (0.1, 0.86), (0.03, 0.9), (0, 0.91)], seg=16), 'petardo_cap', root, Mx)
    fuse = [V(0, 0, 0.9), V(0.03, 0, 0.98), V(-0.02, 0, 1.05), V(0.03, 0, 1.12)]
    make_part('fuse', tube(fuse, 0.018, seg=6), 'petardo_fuse', root, Mx, subsurf=1)
    if pose in ('notice', 'charge'):
        tip = fuse[-1]
        flick = 1 + 0.25 * math.sin(TAU * t * 2)
        for k in range(8):
            a = TAU * k / 8 + 0.2
            rr = (0.09 if k % 2 == 0 else 0.045) * flick
            make_part('spark%d' % k, tube([tip, tip + V(math.cos(a) * rr, -0.02, math.sin(a) * rr)], 0.018, 0.006, seg=5),
                      'petardo_sparkglow' if k % 2 == 0 else 'petardo_spark2glow', root, Mx, subsurf=0)
        make_part('core', sphere(tip, 0.035, seg=10, rows=6), 'petardo_sparkglow', root, Mx, subsurf=0)
    surf = lathe_surf(PAPER)
    for side, az in (('r', -0.45), ('l', -1.15)):
        p, n = surf(0.5, az)
        eye_one('petardo', side, p - n * 0.006, n, root, Mx, P)
        if P.get('angry'):
            brow('petardo', side, p - n * 0.006, n, root, Mx, P['er'])
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.36, math.radians(5), math.radians(-100), scale=0.8), 'petardo_mouth', root, Mx)
    biped_legs('petardo', root, Mx, P, t, (0.0, 0.08, 0.14), (0.08, 0.05, 0.04), 0.03, 'petardo_feet')


# ================================================================ COIN: an orange
def build_coin(root, pose, t):
    Mx = rot_z(360 * t)
    r = 0.24
    make_part('peel', sphere((0, 0, -0.02), r, seg=22, rows=12), 'coin_peel', root, Mx)
    surf = ellipsoid_surf(V(0, 0, -0.02), r, r, r)
    make_part('shine', oval_patch(surf, 0.1, 0.05, -1.9, 0.4), 'coin_shine', root, Mx)
    make_part('stem', tube([V(0, 0, 0.2), V(0.01, 0, 0.27)], 0.022, 0.016, seg=6), 'coin_stem', root, Mx, subsurf=1)
    lc = V(0.09, 0, 0.27)
    make_part('leaf', ellipsoid(lc, X * 0.1, Y * 0.02, Z * 0.04, seg=10, rows=6), 'coin_leaf', root, Mx @ about(lc, rot_y(-25)), subsurf=1)


# ================================================================ STAR: the golden fan
def build_star(root, pose, t):
    Mx = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(4 * math.sin(TAU * t))
    piv = V(0, 0, -0.28)
    n = 9
    R = 0.52
    for k in range(n):
        a0 = math.radians(15 + 150 * k / n)
        a1 = math.radians(15 + 150 * (k + 1) / n)
        pts = [piv + V(math.cos(a0) * 0.12, 0, math.sin(a0) * 0.12), piv + V(math.cos(a0) * R, 0, math.sin(a0) * R),
               piv + V(math.cos((a0 + a1) / 2) * R * 1.03, 0, math.sin((a0 + a1) / 2) * R * 1.03),
               piv + V(math.cos(a1) * R, 0, math.sin(a1) * R), piv + V(math.cos(a1) * 0.12, 0, math.sin(a1) * 0.12)]
        make_part('leaf%d' % k, prism(pts, Y * 0.04), 'star_gold' if k % 2 else 'star_gold2', root, Mx, subsurf=0, smooth=False)
    for k in range(n + 1):
        a = math.radians(15 + 150 * k / n)
        make_part('rib%d' % k, tube([piv + V(0, -0.03, 0), piv + V(math.cos(a) * R * 0.98, -0.03, math.sin(a) * R * 0.98)], 0.014, 0.01, seg=5), 'star_rib', root, Mx, subsurf=0)
    make_part('arc', tube([piv + V(math.cos(math.radians(15 + 150 * k / 12)) * R * 0.62, -0.035, math.sin(math.radians(15 + 150 * k / 12)) * R * 0.62) for k in range(13)], 0.014, seg=5), 'star_rib', root, Mx, subsurf=0)
    make_part('rivet', sphere(piv + V(0, -0.04, 0), 0.05, seg=12, rows=8), 'star_rib', root, Mx)
    tas = [piv + V(0, -0.02, -0.02), piv + V(0.02, -0.02, -0.12), piv + V(-0.01, -0.02, -0.2)]
    make_part('cord', tube(tas, 0.014, seg=6), 'star_tassel', root, Mx, subsurf=1)
    make_part('tassel', cone(tas[-1] + V(0, 0, 0.02), tas[-1] + V(0, 0, -0.14), 0.05, seg=8), 'star_tassel', root, Mx)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.5 * math.cos(a), -0.2, 0.26 * math.sin(a))
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, Mx, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the fruit crate
def build_crate(root, Mx, kind, spent):
    H = 0.55
    wood, wood2, label, nail = (kind + '_wood', kind + '_wood2', kind + '_label', kind + '_nail')
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.04), wood2, root, Mx, subsurf=0)
    faces = [((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((0, 0, 1), (1, 0, 0))]
    for fi, (nrm, tng) in enumerate(faces):
        bn = Vector(nrm)
        c = bn * (H + 0.012)
        for k, v in enumerate((-0.36, 0.0, 0.36)):           # three slats with gaps
            slat = [(-0.5, v - 0.15), (0.5, v - 0.15), (0.5, v + 0.15), (-0.5, v + 0.15)]
            make_part('slat%d_%d' % (fi, k), prism(face_poly(c, nrm, tng, slat), bn * 0.04), wood, root, Mx, subsurf=0, smooth=False)
            for su in (-0.42, 0.42):
                nl = [(su + 0.03 * math.cos(TAU * j / 6), v + 0.03 * math.sin(TAU * j / 6)) for j in range(6)]
                make_part('nail%d_%d_%d' % (fi, k, su > 0), prism(face_poly(c + bn * 0.02, nrm, tng, nl), bn * 0.02), nail, root, Mx, subsurf=0, smooth=False)
        if fi < 2:   # a painted label: an orange with a leaf on a cream oval
            lab = [(0.3 * math.cos(TAU * j / 20), 0.22 * math.sin(TAU * j / 20)) for j in range(20)]
            make_part('label%d' % fi, prism(face_poly(c + bn * 0.04, nrm, tng, lab), bn * 0.02), label, root, Mx, subsurf=0, smooth=False)
            if not spent:
                orb = [(0.15 * math.cos(TAU * j / 18), -0.02 + 0.15 * math.sin(TAU * j / 18)) for j in range(18)]
                make_part('orange%d' % fi, prism(face_poly(c + bn * 0.055, nrm, tng, orb), bn * 0.02), 'qblock_orange', root, Mx, subsurf=0, smooth=False)
                leaf = [(0.02, 0.12), (0.12, 0.2), (0.2, 0.16), (0.1, 0.1)]
                make_part('leaf%d' % fi, prism(face_poly(c + bn * 0.06, nrm, tng, leaf), bn * 0.02), 'qblock_leaf', root, Mx, subsurf=0, smooth=False)


def build_qblock(root, pose, t):
    build_crate(root, Matrix.Identity(4), 'qblock', False)


def build_used(root, pose, t):
    build_crate(root, Matrix.Identity(4), 'used', True)


BUILDERS = {'tomato': build_tomato, 'orange': build_orange, 'horchata': build_horchata, 'bat': build_bat, 'jelly': build_jelly,
            'shark': build_shark, 'petardo': build_petardo, 'coin': build_coin, 'star': build_star, 'qblock': build_qblock,
            'used': build_used}


def build(kind, pose, t=0.0):
    if kind not in BUILDERS:
        raise ValueError('unknown kind %r' % kind)
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
