# ma_extras: the NEW Morocco cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §4.3/§8), rendered ahead
# of the engine work into their own atlas `ma_x` (not referenced by the game yet, so the live `ma` atlas stays lean).
# When the overhaul wires these enemies, either point their cfg.atlas at 'ma_x' or move the kinds into ma_enemies.py.
# Kinds are named like the planned spawn types (maMoth -> 'moth'); poses follow the planned behaviours (§4.2):
#   moth   platEater: a fluffy rug moth, cream fur, wings patterned like a red-and-blue rug; it munches the tile
#          behind it                                                         walk(t) eat(t) stun flat ko          feet, 18 px
#   cat    sleeper -> pouncer: a ginger street cat with a white chest        sleep(t) walk(t) crouch tell pounce stun flat ko feet, 22 px
#   stork  perched, swoops (5-6): the white stork (shared design with es_extras) fly(t) swoop rest stun ko     centre, 36 px
# Render and pack (build_country.sh only packs <cc>_enemies*.py into the country atlas):
#   W=/tmp/brady-sprites/ma_x; JOB=enemies:ma_extras LOOK=toon OUT=$W NAME=ma_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/ma_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ma_enemies as M
from ma_enemies import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone, prism,
                        ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow, mouth_bm, quad_legs)
import es_extras as EX

PX = 28.1
KINDS = ['moth', 'cat', 'stork']
POSES = {
    'moth': ['walk', 'eat', 'stun', 'flat', 'ko'],
    'cat': ['sleep', 'walk', 'crouch', 'tell', 'pounce', 'stun', 'flat', 'ko'],
    'stork': ['fly', 'swoop', 'rest', 'stun', 'ko'],
}
FRAMES = {('moth', 'eat'): (4, 8), ('cat', 'sleep'): (4, 3)}
ORIGIN = {'moth': 'feet', 'cat': 'feet', 'stork': 'centre'}
HEIGHT = {'moth': 18 / PX, 'cat': 22 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'moth': 26 / PX, 'cat': 28 / PX, 'stork': 36 / PX})
COLORS = {
    'moth_fur': '#f4e8d0', 'moth_fur2': '#e0d0b0', 'moth_wing': '#b8222a', 'moth_wing2': '#2a4a9a', 'moth_wing3': '#e8a02a',
    'moth_feeler': '#6a4a2a', 'moth_leg': '#8a6a4a', 'moth_crumb': '#b8222a',
    'moth_eye_white': '#fbfbf2', 'moth_pupil': '#1a1020', 'moth_mouth': '#5a2a2a',
    'cat_fur': '#e8964a', 'cat_fur2': '#c8763a', 'cat_white': '#fff4e4', 'cat_nose': '#e87a8a', 'cat_ear': '#f4a8a8', 'cat_zglow': '#ffffff',
    'cat_eye_white': '#fbfbf2', 'cat_pupil': '#1a1020', 'cat_mouth': '#5a2a2a',
}
M.COLORS.update(COLORS)
POSE = dict(EX.POSE)


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


# ================================================================ MOTH (platform eater)
def build_moth(root, pose, t):
    P = dict(POSE['walk' if pose == 'eat' else pose])
    P.update(er=0.08, skin='moth_fur')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    munch = 0.0
    if pose == 'walk':
        bob = 0.015 * abs(math.sin(2 * TAU * t))
    elif pose == 'eat':
        munch = math.sin(TAU * t)
        lean = 18 + 6 * munch
        P['mouth'] = 'open' if munch > 0 else 'grin'
        P['lid'] = 0.4
    Mx = T((0, 0, bob)) @ about(V(0.2, 0, 0.1), rot_y(lean * 0.6)) @ diag(sx, sx, sz)
    bc, br = V(-0.1, 0, 0.32), (0.32, 0.2, 0.2)
    make_part('body', blob(bc, *br, seg=22, rows=12), 'moth_fur2', root, Mx)
    for k in range(4):
        make_part('ring%d' % k, ellipsoid(bc + V(-0.25 + k * 0.13, 0, 0), X * 0.05, Y * 0.21, Z * 0.21, seg=14, rows=8), 'moth_fur', root, Mx, subsurf=1)
    hc, hr = V(0.26, 0, 0.36), 0.2
    make_part('head', sphere(hc, hr, seg=20, rows=12), 'moth_fur', root, Mx)
    make_part('ruff', ellipsoid(V(0.12, 0, 0.34), X * 0.1, Y * 0.24, Z * 0.24, seg=16, rows=10), 'moth_fur', root, Mx)
    surf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = surf(hc.z + 0.05, az)
        eye_one('moth', side, p - n * 0.01, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'] or 'smile', hc.z - 0.08, math.radians(0), math.radians(-90), scale=0.7), 'moth_mouth', root, Mx)
    for side, sgn in (('l', 1), ('r', -1)):
        base = hc + V(0.02, sgn * 0.08, 0.15)
        tip = base + V(0.22, sgn * 0.05, 0.22)
        make_part('feeler_' + side, tube([base, (base + tip) / 2 + V(0.04, 0, 0.03), tip], 0.015, seg=6), 'moth_feeler', root, Mx, subsurf=1)
        for j in range(3):
            make_part('fz_%s%d' % (side, j), ellipsoid(base.lerp(tip, 0.4 + 0.25 * j) + V(0.03, 0, -0.01), X * 0.04, Y * 0.01, Z * 0.012, seg=6, rows=4), 'moth_feeler', root, Mx, subsurf=0)
    # the rug-patterned wings folded up over the back like a little tent
    flut = 4 * math.sin(TAU * t * 2) if pose == 'walk' else 0.0
    for side, sgn in (('l', 1), ('r', -1)):
        MW = Mx @ about(V(0.05, sgn * 0.05, 0.48), rot_x(-sgn * (25 + flut)))
        wing = [V(0.18, sgn * 0.05, 0.48), V(0.04, sgn * 0.05, 0.74), V(-0.2, sgn * 0.05, 0.84), V(-0.46, sgn * 0.05, 0.76), V(-0.6, sgn * 0.05, 0.56), V(-0.56, sgn * 0.05, 0.4), V(-0.1, sgn * 0.05, 0.42)]
        make_part('wing_' + side, prism(wing, Y * 0.03), 'moth_wing', root, MW, subsurf=0, smooth=False)
        if side == 'r':     # the camera-side wing carries the rug motif
            dc = V(-0.18, -0.08, 0.6)
            make_part('motif', prism([dc + V(0.12, 0, 0), dc + V(0, 0, 0.12), dc + V(-0.12, 0, 0), dc + V(0, 0, -0.12)], Y * 0.02), 'moth_wing3', root, MW, subsurf=0, smooth=False)
            make_part('motif2', prism([dc + V(0.05, -0.01, 0), dc + V(0, -0.01, 0.05), dc + V(-0.05, -0.01, 0), dc + V(0, -0.01, -0.05)], Y * 0.02), 'moth_wing2', root, MW, subsurf=0, smooth=False)
            for k in range(4):
                p0 = V(-0.48 + k * 0.1, -0.07, 0.41 + 0.07 * k)
                make_part('fringe%d' % k, tube([p0, p0 + V(-0.04, 0, -0.07)], 0.012, seg=4), 'moth_fur', root, MW, subsurf=0)
    # six little legs
    for k in range(3):
        for side, sgn in (('l', 1), ('r', -1)):
            x = 0.15 - k * 0.18
            ph = TAU * t + k * 2.1 + (0 if side == 'l' else math.pi)
            dx = 0.04 * math.sin(ph) if pose == 'walk' else 0.0
            hip = V(x, sgn * 0.1, 0.2)
            foot = V(x + dx + 0.05, sgn * 0.16, 0.02) if pose != 'flat' else V(x + 0.12, sgn * 0.22, 0.02)
            make_part('leg_%s%d' % (side, k), tube([hip, (hip + foot) / 2 + V(0, sgn * 0.03, 0.03), foot], 0.018, seg=5), 'moth_leg', root, Mx, subsurf=0)
    if pose == 'eat':
        for k in range(3):
            c = V(0.42 + 0.06 * k, -0.08, 0.15 + 0.04 * math.sin(TAU * t + k))
            make_part('crumb%d' % k, sphere(c, 0.03, seg=8, rows=6), 'moth_crumb', root, None, subsurf=0)


# ================================================================ CAT (sleeper, then pouncer)
def build_cat(root, pose, t):
    if pose == 'sleep':
        P = dict(POSE['idle'])
        P.update(lid=1.0, mouth='smile', feet='stand')
    else:
        P = dict(POSE[pose])
    P.update(er=0.07, skin='cat_fur')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
    lift = 0.14 if pose == 'pounce' else 0.0
    P['feet'] = {'crouch': 'stand', 'tell': 'stand', 'pounce': 'tuck', 'sleep': 'tuck'}.get(pose, P['feet'])
    if pose == 'sleep':
        breath = 1 + 0.04 * math.sin(TAU * t)
        Mx = diag(1.05, 1.0, 0.72 * breath)
    else:
        Mx = T((0, 0, bob + lift)) @ rot_y(lean * 0.4) @ diag(sx, sx, sz)
    bc, br = V(-0.08, 0, 0.36), (0.32, 0.17, 0.18)
    make_part('body', blob(bc, *br, seg=24, rows=14), 'cat_fur', root, Mx)
    make_part('chest', ell_cap(bc, br, (0.7, -0.4, -0.5), 40, seg=16, rows=5), 'cat_white', root, Mx)
    sb = ellipsoid_surf(bc, *br)
    for k, a in enumerate((-1.3, -1.7, -2.1)):
        path = [sb(bc.z + br[2] * (0.9 - 0.45 * j), a)[0] + V(0, -0.01, 0) for j in range(3)]
        make_part('stripe%d' % k, tube(path, 0.022, seg=6), 'cat_fur2', root, Mx, subsurf=1)
    hc, hr = V(0.3, 0, 0.52), 0.17
    MH = Mx @ (about(V(0.26, 0, 0.4), rot_y(25)) if pose == 'sleep' else Matrix.Identity(4))
    make_part('head', sphere(hc, hr, seg=22, rows=14), 'cat_fur', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        eb = hc + V(-0.02, sgn * 0.09, 0.12)
        make_part('ear_' + side, cone(eb, eb + V(0.03, sgn * 0.03, 0.16), 0.075, flat=0.45, seg=8), 'cat_fur', root, MH, subsurf=1)
        make_part('earin_' + side, cone(eb + V(0.0, -0.03, 0.02), eb + V(0.03, -0.01, 0.12), 0.04, flat=0.3, seg=6), 'cat_ear', root, MH, subsurf=1)
    mc = hc + V(0.13, 0, -0.05)
    make_part('muzzle', blob(mc, 0.08, 0.08, 0.06, seg=14, rows=8), 'cat_white', root, MH)
    make_part('nose', sphere(mc + V(0.07, 0, 0.03), 0.025, seg=10, rows=6), 'cat_nose', root, MH)
    hs = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -0.5), ('l', -1.15)):
        p, n = hs(hc.z + 0.03, az)
        eye_one('cat', side, p - n * 0.01, n, root, MH, P)
        if P.get('angry'):
            brow('cat', side, p - n * 0.01, n, root, MH, P['er'])
    ms = ellipsoid_surf(mc, 0.08, 0.08, 0.06)
    make_part('mouth', mouth_bm(ms, P['mouth'] or 'smile', mc.z - 0.025, math.radians(-15), math.radians(-85), scale=0.5), 'cat_mouth', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        for k in range(2):
            make_part('whisk_%s%d' % (side, k), tube([mc + V(0.02, -0.07, -0.01 + 0.03 * k), mc + V(0.18, -0.09, -0.03 + 0.06 * k)], 0.006, seg=4), 'cat_fur2', root, MH, subsurf=0)
    # tail: wraps round the body asleep, flicks up when telling
    if pose == 'sleep':
        tail = [V(-0.38, 0, 0.3), V(-0.42, -0.1, 0.12), V(-0.1, -0.2, 0.06), V(0.2, -0.2, 0.08)]
    elif pose == 'tell':
        w = 0.08 * math.sin(TAU * t * 3)
        tail = [V(-0.38, 0, 0.4), V(-0.5, 0, 0.55), V(-0.5 + w, 0, 0.75), V(-0.42 + w, 0, 0.88)]
    else:
        w = 0.04 * math.sin(TAU * t)
        tail = [V(-0.38, 0, 0.4), V(-0.55, 0, 0.5), V(-0.62 + w, 0, 0.66), V(-0.58 + w, 0, 0.78)]
    make_part('tail', tube(tail, 0.045, 0.035, seg=8), 'cat_fur', root, Mx)
    make_part('tailtip', sphere(tail[-1], 0.04, seg=10, rows=6), 'cat_fur2', root, Mx)
    if pose == 'sleep':
        for k, (dx, dz, r) in enumerate(((0.45, 0.75, 0.06), (0.55, 0.9, 0.08))):
            c = V(dx, -0.2, dz)
            zz = [c + V(-r, 0, r), c + V(r, 0, r), c + V(-r, 0, -r), c + V(r, 0, -r)]
            make_part('z%d' % k, tube(zz, 0.018, seg=4), 'cat_zglow', root, None, subsurf=0)
        return
    hips = {'fl': V(0.16, -0.09, 0.26), 'fr': V(0.16, 0.09, 0.26), 'bl': V(-0.26, -0.09, 0.26), 'br': V(-0.26, 0.09, 0.26)}
    quad_legs('cat', root, Mx, P, t, hips, 0.035, 0.045, (0.06, 0.05, 0.035), 'cat_fur', A=0.08, H=0.05, foot_mat='cat_white')


def build_stork(root, pose, t):
    EX.build_stork(root, pose, t)


BUILDERS = {'moth': build_moth, 'cat': build_cat, 'stork': build_stork}


def build(kind, pose, t=0.0):
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
