# fr_extras: the NEW France cast still missing for the level overhaul (docs/design/LEVEL_OVERHAUL.md §2/§4/§8), rendered
# into their own atlas `fr_x` (the live `fr` atlas already has poele, coq, magpie, boar, snail, mole; nothing here
# touches it). Original cartoon designs (seafood, birds, pastry, a pig); helpers from jp_charkit.py, the bird body of
# np_enemies. Not referenced by the game yet: point an enemy's cfg.atlas at 'fr_x' (sprite = the kind name).
#   oyster      7-3 frOyster (still + snap): a craggy grey-lilac oyster with a frilly lip; open it shows a pink inside
#               and a pearl, shut it clamps with a grumpy face                 idle (open, t) shut stun ko   feet, 20 px
#   crab        7-3 frCrab: a chunky orange shore crab, big claws, eyes on stalks, scuttles sideways
#                                                                               walk (t) stun flat ko         feet, 16 px
#   gull        7-3 frGull: a herring gull of the Channel coast in a little blue-and-white striped neckerchief
#                                                                               fly (t) swoop stun ko         centre, 30 px
#   macaron     7-7 frMacaron (hop): a pistachio macaron with a cream filling (the coin is the pink one)
#                                                                               walk (t) hop stun flat ko     feet, 22 px
#   trufflePig  7-4 truffle-pig friend: a round pink pig in a red neckerchief that sniffs out truffles
#                                                                               idle (sniff, t) wave (t) point   feet, 30 px
# Render and pack:  W=/tmp/brady-sprites/fr_x; JOB=enemies:fr_extras LOOK=toon OUT=$W NAME=fr_x SCALE=3 OUTLINE=1.25 \
#   gui/bl.sh $W.log render_country.py; gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/fr_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        lathe, torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        biped_legs, quad_legs, superellipsoid, box_bm)
import jp_enemies as JE
from jp_enemies import STD_POSE, walk_bob, flat_mouth, puffy_slab
import np_enemies as NE

PX = 28.1
KINDS = ['oyster', 'crab', 'gull', 'macaron', 'trufflePig']
POSES = {
    'oyster': ['idle', 'shut', 'stun', 'ko'],
    'crab': ['walk', 'stun', 'flat', 'ko'],
    'gull': ['fly', 'swoop', 'stun', 'ko'],
    'macaron': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'trufflePig': ['idle', 'wave', 'point'],
}
FRAMES = {('oyster', 'idle'): (4, 5), ('crab', 'walk'): (6, 12), ('trufflePig', 'idle'): (6, 6), ('trufflePig', 'wave'): (6, 6)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN['gull'] = 'centre'
HEIGHT = {'oyster': 20 / PX, 'crab': 16 / PX, 'macaron': 22 / PX, 'trufflePig': 30 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'gull': 30 / PX, 'oyster': 26 / PX, 'crab': 26 / PX, 'trufflePig': 36 / PX})

COLORS = {
    'jp_tongue': '#ff7a8a',
    'oyster_shell': '#8a8498', 'oyster_shell2': '#a8a2b8', 'oyster_ridge': '#6a6478', 'oyster_lip': '#d8d0e4', 'oyster_inside': '#ffc8d4',
    'oyster_flesh': '#f0e4d8', 'oyster_pearl': '#fffaf4', 'oyster_eye_white': '#ffffff', 'oyster_pupil': '#1a1020', 'oyster_mouth': '#5a1a2a',
    'crab_shell': '#e8642a', 'crab_shell2': '#c84a1a', 'crab_spot': '#ffa860', 'crab_claw': '#e8642a', 'crab_tip': '#3a2a2a',
    'crab_leg': '#d8561e', 'crab_eye_white': '#ffffff', 'crab_pupil': '#1a1020', 'crab_mouth': '#5a1a1a',
    'gull_body': '#ffffff', 'gull_body2': '#f4f6f8', 'gull_wing': '#a8b6c6', 'gull_tip': '#3a3a48', 'gull_head': '#ffffff',
    'gull_beak': '#ffd23a', 'gull_spot': '#e8322a', 'gull_feet': '#ff9a6a', 'gull_scarf': '#2a5ad8', 'gull_scarf2': '#ffffff',
    'gull_eye_white': '#fff4c0', 'gull_pupil': '#1a1020', 'gull_mouth': '#2a2030',
    'macaron_shell': '#9ad86a', 'macaron_shell2': '#b8e88e', 'macaron_foot': '#7ab84e', 'macaron_cream': '#fff4e0',
    'macaron_eye_white': '#ffffff', 'macaron_pupil': '#1a1020', 'macaron_mouth': '#5a1a2a', 'macaron_cheek': '#ffa8b8',
    'macaron_feet': '#6a9a42',
    'trufflePig_skin': '#ffb0b8', 'trufflePig_skin2': '#f0909c', 'trufflePig_snout': '#ff8a98', 'trufflePig_nostril': '#8a3a4a',
    'trufflePig_hoof': '#6a3a3a', 'trufflePig_scarf': '#e8322a', 'trufflePig_scarf2': '#ffffff', 'trufflePig_truffle': '#3a2a24',
    'trufflePig_eye_white': '#ffffff', 'trufflePig_pupil': '#1a1020', 'trufflePig_mouth': '#6a1a2a', 'trufflePig_cheek': '#ff7a8a',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


# ================================================================ OYSTER (still + snap)
def shell(root, name, Mx, mat, mat2, ridge, w, d, h, flip=1):
    """One craggy half-shell: a flattened, lumpy cap with radial ridges (flip = -1 for the bottom half)."""
    make_part(name, ellipsoid(V(0, 0, 0), X * w, Y * d, Z * h * flip, seg=24, rows=8, phi1=math.pi / 2), mat, root, Mx)
    for k in range(5):
        a = -0.9 + 0.45 * k
        p0 = V(0.0, 0.0, h * flip * 0.95)
        p1 = V(math.sin(a) * w * 0.98, -math.cos(a) * d * 0.3 - d * 0.6, h * flip * 0.15)
        ob = make_part('%s_r%d' % (name, k), tube([p0 + V(-0.02, -0.05, 0), p0.lerp(p1, 0.5) + V(0, -0.05, 0.02 * flip), p1], 0.022, seg=5), ridge, root, Mx, subsurf=0)
        ob['outline'] = 0
    ob = make_part(name + '_hi', ellipsoid(V(-w * 0.25, -d * 0.55, h * flip * 0.55), X * w * 0.3, Y * 0.01, Z * h * 0.25, seg=10, rows=4), mat2, root, Mx, subsurf=0)
    ob['outline'] = 0


def build_oyster(root, pose, t):
    P = {'er': 0.065, 'skin': 'oyster_shell', 'lid': 0.1, 'look': Vector((0.55, -0.85, -0.05))}
    open_a = {'idle': 32 + 6 * math.sin(TAU * t), 'shut': 0, 'stun': 18, 'ko': 40}[pose]
    if pose == 'shut':
        P['lid'] = 0.6
    if pose == 'stun':
        P['dazed'], P['lid'] = True, 0.4
    if pose == 'ko':
        P['x'] = True
    w, d, h = 0.4, 0.28, 0.12
    hinge = V(-w * 0.9, 0, 0.13)
    base = T((0, 0, 0.13))
    shell(root, 'bottom', base, 'oyster_shell', 'oyster_shell2', 'oyster_ridge', w, d, h, flip=-1)
    make_part('lip_b', torus(V(0, 0, 0.0), 1.0, 0.03, axis=Z, seg=26, rseg=5), 'oyster_lip', root, base @ diag(w, d, 1), subsurf=0)
    if open_a > 5:
        make_part('inside', ellipsoid(V(0, 0, 0.01), X * w * 0.92, Y * d * 0.9, Z * 0.03, seg=22, rows=6), 'oyster_inside', root, base, subsurf=1)
        make_part('flesh', blob(V(0.04, 0, 0.04), w * 0.6, d * 0.6, 0.05), 'oyster_flesh', root, base, subsurf=1)
        if pose == 'idle':
            make_part('pearl', sphere(V(0.12, -0.05, 0.1), 0.07, seg=14, rows=8), 'oyster_pearl', root, base, subsurf=1)
    TM = base @ about(hinge - V(0, 0, 0.13), rot_y(-open_a))
    shell(root, 'top', TM, 'oyster_shell', 'oyster_shell2', 'oyster_ridge', w, d, h * 1.3)
    make_part('lip_t', torus(V(0, 0, 0.0), 1.0, 0.03, axis=Z, seg=26, rseg=5), 'oyster_lip', root, TM @ diag(w, d, 1), subsurf=0)
    # the face on the top shell: eyes near the front, a grumpy brow when shut
    n = Vector((0.4, -1, 0.6)).normalized()
    for side, dx, dy in (('r', 0.16, -0.12), ('l', 0.0, -0.16)):
        c = V(dx, dy, h * 1.3 * 0.75)
        eye_one('oyster', side, c, n, root, TM, P, er=0.065)
        if pose == 'shut':
            brow('oyster', side, c, n, root, TM, 0.065, angry=1.0)


# ================================================================ CRAB (walker)
def build_crab(root, pose, t):
    """Front to the camera, scuttling sideways along X (the way crabs walk)."""
    P = dict(STD_POSE[pose])
    P.update(er=0.065, skin='crab_shell', look=Vector((0.0, -1.0, 0.1)))
    sz = 0.42 if pose == 'flat' else 1.0
    sx = 1.2 if pose == 'flat' else 1.0
    bob = 0.02 * abs(math.sin(TAU * t * 2)) if pose == 'walk' else 0.0
    tilt = 5 * math.sin(TAU * t * 2) if pose == 'walk' else (-10 if pose == 'ko' else 0)
    Mx = T((0, 0, bob)) @ about((0, 0, 0.2), rot_y(tilt)) @ diag(sx, sx, sz)
    c = V(0, 0, 0.26)
    make_part('shell', superellipsoid(c, 0.4, 0.26, 0.14, e=0.7, seg=24, rows=10), 'crab_shell', root, Mx)
    make_part('belly', superellipsoid(c + V(0, -0.02, -0.08), 0.34, 0.22, 0.06, e=0.6, seg=20, rows=8), 'crab_shell2', root, Mx)
    for k, (x, z) in enumerate(((-0.2, 0.06), (0.18, 0.08), (0.0, 0.11))):
        ob = make_part('spot%d' % k, ellipsoid(c + V(x, -0.2, z), X * 0.05, Y * 0.02, Z * 0.03, seg=8, rows=4), 'crab_spot', root, Mx, subsurf=0)
        ob['outline'] = 0
    # eyes on stalks at the front
    for side, x in (('r', 0.1), ('l', -0.1)):
        st0, st1 = c + V(x, -0.12, 0.1), c + V(x * 1.3, -0.16, 0.28)
        make_part('stalk_' + side, tube([st0, st1], 0.025, seg=6), 'crab_shell', root, Mx, subsurf=0)
        eye_one('crab', side, st1 + V(0.0, -0.02, 0.04), Vector((x * 2, -1, 0.15)), root, Mx, P, er=0.065)
    if pose != 'flat':
        flat_mouth('crab', root, Mx, {'walk': 'smile', 'stun': 'wobble', 'ko': 'o'}.get(pose, 'smile'), c + V(0.0, -0.27, 0.0), Vector((0, -1, 0)), 0.1)
    # two big claws held up at the front, snapping
    snap = 14 * math.sin(TAU * t * 2) if pose == 'walk' else (35 if pose == 'stun' else 0)
    for k, sg in enumerate((-1, 1)):
        sh = c + V(sg * 0.3, -0.14, -0.02)
        el = sh + V(sg * 0.14, -0.06, 0.12)
        make_part('arm%d' % k, tube([sh, el], 0.04, seg=6), 'crab_claw', root, Mx, subsurf=0)
        cc = el + V(sg * 0.04, -0.02, 0.12)
        make_part('claw%d' % k, ellipsoid(cc, X * 0.11, Y * 0.07, Z * 0.13, seg=14, rows=8), 'crab_claw', root, Mx)
        PM = Mx @ about(cc + V(sg * 0.03, 0, 0.1), rot_y(sg * snap))
        make_part('pincer%d' % k, cone(cc + V(sg * 0.03, -0.01, 0.1), cc + V(sg * 0.0, -0.01, 0.24), 0.045, seg=6), 'crab_tip', root, PM, subsurf=0)
        make_part('pincerb%d' % k, cone(cc + V(-sg * 0.05, -0.01, 0.08), cc + V(-sg * 0.08, -0.01, 0.2), 0.035, seg=6), 'crab_tip', root, Mx, subsurf=0)
    # three legs a side, splayed out to the left and right, skittering
    for k in range(3):
        for sg in (-1, 1):
            ph = TAU * t * 2 + k * 2.1 + (0 if sg < 0 else math.pi)
            lift = 0.05 * max(0.0, math.sin(ph)) if pose == 'walk' else 0.0
            hip = c + V(sg * 0.3, -0.04 + 0.1 * k, -0.05)
            knee = hip + V(sg * 0.16, 0.02, 0.08 + lift)
            foot = V(sg * (0.58 + 0.03 * k) + 0.03 * math.cos(ph) * (pose == 'walk'), -0.04 + 0.1 * k, 0.02 + lift)
            if pose == 'flat':
                foot = V(sg * 0.66, -0.04 + 0.1 * k, 0.02)
            make_part('leg%d%d' % (k, sg > 0), tube([hip, knee, foot], 0.024, 0.016, seg=5), 'crab_leg', root, Mx if pose != 'flat' else None, subsurf=0)


# ================================================================ GULL (flyer)
def build_gull(root, pose, t):
    Mx, hc = NE.bird('gull', root, pose, t, 'gull_body', 'gull_body2', 'gull_wing', 'gull_tip', 'gull_head', 'gull_beak', 'gull_feet',
                     er=0.07, scale=1.0)
    make_part('spot', sphere(hc + V(0.24, -0.03, -0.07), 0.025, seg=8, rows=5), 'gull_spot', root, Mx, subsurf=0)
    # a little striped neckerchief, its tip fluttering behind
    nc = hc + V(-0.08, 0, -0.1)
    make_part('scarf', torus(nc, 0.1, 0.035, axis=Vector((0.6, 0, 1)), seg=18, rseg=6), 'gull_scarf', root, Mx, subsurf=0)
    fl = 0.03 * math.sin(TAU * t * 2)
    make_part('scarf_tip', prism([nc + V(-0.06, -0.12, 0.0), nc + V(-0.24, -0.12, 0.04 + fl), nc + V(-0.2, -0.12, -0.08 + fl)], Y * 0.02), 'gull_scarf', root, Mx, subsurf=0)
    ob = make_part('scarf_st', prism([nc + V(-0.12, -0.135, 0.0), nc + V(-0.18, -0.135, 0.01 + fl), nc + V(-0.17, -0.135, -0.03 + fl)], Y * 0.01), 'gull_scarf2', root, Mx, subsurf=0)
    ob['outline'] = 0


# ================================================================ MACARON (hopper)
def build_macaron(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='macaron_shell')
    bob, lean = walk_bob(pose, P, t)
    lift = 0.1 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    r = 0.34
    # two domed shells with frilly feet and a cream filling, seen from the side and a little from the front
    for k, (z, flip) in enumerate(((0.36, 1), (0.2, -1))):
        c = V(0, 0, z)
        make_part('shell%d' % k, ellipsoid(c, X * r, Y * r * 0.9, Z * 0.13 * flip, seg=26, rows=8, phi1=math.pi / 2), 'macaron_shell', root, Mx)
        make_part('foot%d' % k, torus(c - V(0, 0, 0.01 * flip), r * 0.96, 0.035, axis=Z, seg=26, rseg=6), 'macaron_foot', root, Mx, subsurf=1)
    make_part('cream', blob(V(0, 0, 0.28), r * 0.92, r * 0.82, 0.05, seg=24, rows=8), 'macaron_cream', root, Mx)
    ob = make_part('gleam', ellipsoid(V(-0.12, -0.18, 0.47), X * 0.08, Y * 0.02, Z * 0.025, seg=10, rows=4), 'macaron_shell2', root, Mx, subsurf=0)
    ob['outline'] = 0
    # face on the top shell's front
    n = Vector((0.3, -1, 0.35)).normalized()
    for side, dx in (('r', 0.12), ('l', -0.06)):
        eye_one('macaron', side, V(dx, -0.24, 0.42), n, root, Mx, P, er=0.075)
    if not P.get('x') and pose != 'flat':
        for k, dx in enumerate((0.24, -0.16)):
            ob = make_part('cheek%d' % k, ellipsoid(V(dx, -0.26, 0.37), X * 0.04, Y * 0.01, Z * 0.022, seg=10, rows=4), 'macaron_cheek', root, Mx, subsurf=0)
            ob['outline'] = 0
    flat_mouth('macaron', root, Mx, {'walk': 'grin', 'hop': 'o', 'stun': 'wobble', 'ko': 'o'}.get(pose, 'flat'), V(0.04, -0.3, 0.26), Vector((0.25, -1, 0)), 0.1)
    biped_legs('macaron', root, T((0, 0, lift)), P, t, (0.0, 0.1, 0.12), (0.07, 0.05, 0.03), 0.025, 'macaron_feet')


# ================================================================ TRUFFLE PIG (friend)
def build_trufflePig(root, pose, t):
    P = {'er': 0.075, 'skin': 'trufflePig_skin', 'lid': 0.15, 'pupil': 0.7, 'look': Vector((0.6, -0.8, -0.1))}
    sniff = 0.0
    nod = 0.0
    if pose == 'idle':
        sniff = 0.015 * math.sin(TAU * t * 3)
        nod = 6 * math.sin(TAU * t)
    elif pose == 'wave':
        P['lid'] = 1.0
        nod = -8 + 4 * math.sin(TAU * t)
    else:      # point: nose to the ground where the truffle is
        nod = 28
        P['look'] = Vector((0.5, -0.6, -0.6))
    Mx = Matrix.Identity(4)
    bc = V(-0.05, 0, 0.42)
    make_part('body', blob(bc, 0.42, 0.3, 0.3, seg=26, rows=14), 'trufflePig_skin', root, Mx)
    bs = ellipsoid_surf(bc, 0.42, 0.3, 0.3)
    make_part('belly', oval_patch(bs, bc.z - 0.12, 0.1, -1.3, 0.8), 'trufflePig_skin2', root, Mx)
    # head
    hc = V(0.36, 0, 0.56)
    HM = Mx @ about(V(0.26, 0, 0.5), rot_y(nod))
    make_part('head', blob(hc, 0.24, 0.23, 0.22, seg=24, rows=12), 'trufflePig_skin', root, HM)
    hs = ellipsoid_surf(hc, 0.24, 0.23, 0.22)
    sn = hc + V(0.24 + sniff, 0, -0.04)
    make_part('snout', lathe([(0.0, -0.06), (0.1, -0.06), (0.11, 0.0), (0.1, 0.06), (0.0, 0.07)], seg=18), 'trufflePig_snout', root, HM @ T(sn) @ rot_y(90))
    for k, sg in enumerate((-1, 1)):
        make_part('nostril%d' % k, ellipsoid(sn + V(0.075, sg * 0.04, 0.0), X * 0.01, Y * 0.022, Z * 0.03, seg=8, rows=4), 'trufflePig_nostril', root, HM, subsurf=0)
        ec = hc + V(-0.04, sg * 0.15, 0.2)
        make_part('ear%d' % k, cone(ec, ec + V(0.12, sg * 0.06, 0.12 - 0.08 * (pose == 'point')), 0.08, flat=0.35, seg=8), 'trufflePig_skin2', root, HM, subsurf=1)
    for side, az, dz in (('r', -0.7, 0.07), ('l', -1.35, 0.08)):
        p, n = hs(hc.z + dz, az)
        eye_one('trufflePig', side, p - n * 0.008, n, root, HM, P)
    for k, az in enumerate((-0.45, -1.6)):
        ob = make_part('cheek%d' % k, oval_patch(hs, hc.z - 0.05, 0.03, az, 0.14, thick=0.016), 'trufflePig_cheek', root, HM)
        ob['outline'] = 0
    JE.open_mouth('trufflePig', root, HM, hs, 'grin' if pose == 'wave' else 'smile', hc.z - 0.1, math.radians(-30), math.radians(-70), scale=0.9)
    # red neckerchief
    make_part('scarf', torus(V(0.24, 0, 0.52), 0.2, 0.05, axis=Vector((1, 0, 0.3)), seg=20, rseg=6), 'trufflePig_scarf', root, Mx, subsurf=0)
    make_part('knot', prism([V(0.3, -0.2, 0.46), V(0.22, -0.22, 0.3), V(0.38, -0.22, 0.32)], Y * 0.03), 'trufflePig_scarf', root, Mx, subsurf=0)
    for k in range(3):
        ob = make_part('dot%d' % k, sphere(V(0.18 + 0.08 * k, -0.24, 0.52 - 0.02 * k), 0.016, seg=6, rows=4), 'trufflePig_scarf2', root, Mx, subsurf=0)
        ob['outline'] = 0
    # curly tail, wagging when it waves
    wag = 20 * math.sin(TAU * t * 2) if pose == 'wave' else 5 * math.sin(TAU * t)
    tb = bc + V(-0.42, 0, 0.08)
    TM = Mx @ about(tb, rot_x(wag))
    make_part('tail', tube([tb + V(0.02 * math.cos(a), 0.0, 0.0) + V(-0.04 * j / 6 - 0.03 * math.cos(a), 0.03 * math.sin(a), 0.02 * j / 6) for j, a in enumerate(TAU * k / 6 for k in range(7))], 0.018, seg=5), 'trufflePig_skin2', root, TM, subsurf=0)
    # four trotters
    for k, (x, y) in enumerate(((0.2, -0.16), (0.2, 0.16), (-0.28, -0.16), (-0.28, 0.16))):
        lift = 0.04 * max(0.0, math.sin(TAU * t + k * 1.6)) if pose == 'wave' else 0.0
        make_part('leg%d' % k, tube([V(x, y, 0.3), V(x, y, 0.06 + lift)], 0.06, seg=8), 'trufflePig_skin', root, Mx, subsurf=0)
        make_part('hoof%d' % k, ellipsoid(V(x + 0.02, y, 0.04 + lift), X * 0.07, Y * 0.06, Z * 0.04, seg=8, rows=5), 'trufflePig_hoof', root, Mx, subsurf=0)
    if pose == 'point':
        make_part('truffle', blob(sn + V(0.1, -0.02, -0.38), 0.07, 0.06, 0.05, seg=10, rows=6), 'trufflePig_truffle', root, Mx, subsurf=1)


BUILDERS = {'oyster': build_oyster, 'crab': build_crab, 'gull': build_gull, 'macaron': build_macaron, 'trufflePig': build_trufflePig}


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    for ob in root.children:
        part = ob.get('sprite_part', '')
        if part.startswith('pupil_'):
            ob['outline'] = 0
        elif part.startswith(('eye_', 'lid_')):
            ob['outline'] = 0.5
    return root
