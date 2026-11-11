# ec_extras: the rebuilt Ecuador's new cast (29_tour_ec.js), rendered into their own atlas `ec_x` (the live `ec` atlas
# is never re-packed). The game points these enemies at it with cfg.atlas = 'ec_x'; their sprite names are the
# 30_tour_sprites.js defaults (ecGlassFrog -> 'glassFrog').
#   glassFrog    a see-through-pale glass frog, its little red heart showing   show hidden walk stun flat ko              feet 16 px
#   hummingbird  an emerald hummingbird with a violet throat (hoverDart)       hover(t) aim dart recover return stun ko   centre 12 px
#   crab         a Sally Lightfoot crab, seen face-on (it scuttles sideways)   walk(t) stun flat ko                       feet 14 px
#   dipper       a white-capped dipper that hangs under rope bridges and drops (ceilingDrop)
#                                                                              hang tell drop stuck climb(t) stun flat ko feet 18 px
#   iguanaSalt   the marine iguana of 2-3 (the ec model) with its sneeze       walk(t) tell sneeze stun flat ko           feet 18 px
#   seaLionLand  the sea lion on the shore (the ec model): waddle, bark, belly slide
#                                                                              walk(t) notice charge stun flat ko         feet 16 px
#   pataAzul     PATA AZUL, 2-3's racing booby (the ec booby in a racing bib and a sweatband)
#                                                                              idle(t) run(t)                             feet 44 px
# Render and pack (build_country.sh packs only <cc>_enemies*.py into the country atlas):
#   W=<work>/ec_x; JOB=enemies:ec_extras LOOK=toon OUT=$W NAME=ec_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/ec_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ec_enemies as E
from ec_enemies import (TAU, X, Y, Z, V, tr, scl, rot_x, rot_y, rot_z, about, perp_frame, ellipsoid, sphere, blob, tube, cone, sheet,
                        xf, box_bm, on_ellipsoid, pose_matrix, smooth01)

PX = 28.1
KINDS = ['glassFrog', 'hummingbird', 'crab', 'dipper', 'iguanaSalt', 'seaLionLand', 'pataAzul']
POSES = {
    'glassFrog': ['show', 'hidden', 'walk', 'stun', 'flat', 'ko'],
    'hummingbird': ['hover', 'aim', 'dart', 'recover', 'return', 'stun', 'ko'],
    'crab': ['walk', 'stun', 'flat', 'ko'],
    'dipper': ['hang', 'tell', 'drop', 'stuck', 'climb', 'stun', 'flat', 'ko'],
    'iguanaSalt': ['walk', 'tell', 'sneeze', 'stun', 'flat', 'ko'],
    'seaLionLand': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'pataAzul': ['idle', 'run'],
}
FRAMES = {('hummingbird', 'hover'): (4, 16), ('glassFrog', 'walk'): (1, 1), ('dipper', 'climb'): (4, 10), ('pataAzul', 'run'): (8, 14),
          ('dipper', 'tell'): (1, 1)}
ORIGIN = {'glassFrog': 'feet', 'hummingbird': 'centre', 'crab': 'feet', 'dipper': 'feet', 'iguanaSalt': 'feet', 'seaLionLand': 'feet',
          'pataAzul': 'feet'}
HEIGHT = {'glassFrog': 0.42, 'crab': 0.44, 'dipper': 0.62, 'iguanaSalt': 30 / PX, 'seaLionLand': 0.68, 'pataAzul': 44 / PX}
SIZE = {'hummingbird': 0.46}

# copies of the ec models' colours under the new kinds' names
for src, dst in (('iguana', 'iguanaSalt'), ('seaLion', 'seaLionLand'), ('booby', 'pataAzul')):
    for k, v in list(E.COLORS.items()):
        if k.startswith(src + '_'):
            E.COLORS[dst + k[len(src):]] = v
E.COLORS.update({
    'pataAzul_bib': '#fff8f0', 'pataAzul_bib_num': '#e8323a', 'pataAzul_band': '#e8323a', 'pataAzul_band2': '#ffd23a',
    'seaLionLand_sand': '#f0e2c0', 'seaLionLand_spark': '#ffffff', 'seaLionLand_star': '#ffd84a', 'iguanaSalt_star': '#ffd84a',
    'glassFrog_body': '#a6eebc', 'glassFrog_back': '#86dca2', 'glassFrog_spot': '#5ab87a', 'glassFrog_belly': '#dcfff0',
    'glassFrog_heart': '#e83a4a', 'glassFrog_bone': '#f4fff8', 'glassFrog_pad': '#e8ffd8', 'glassFrog_eye_white': '#fff6c8',
    'glassFrog_pupil': '#1a1020', 'glassFrog_mouth': '#2a7a4a', 'glassFrog_star': '#ffd84a',
    'hummingbird_body': '#2ac88a', 'hummingbird_back': '#1a9a6a', 'hummingbird_throat': '#9a4aff', 'hummingbird_belly': '#f0fff4',
    'hummingbird_beak': '#2a2a30', 'hummingbird_tail': '#14644a', 'hummingbird_wing': '#c8fff0', 'hummingbird_wing2': '#a0eedc',
    'hummingbird_eye_white': '#ffffff', 'hummingbird_pupil': '#1a1020', 'hummingbird_star': '#ffd84a',
    'crab_shell': '#ff5a2a', 'crab_shell_dk': '#d8401a', 'crab_spot': '#3a8aff', 'crab_belly': '#ffd0a0', 'crab_leg': '#e8401a',
    'crab_claw': '#ff7a3a', 'crab_stalk': '#c83a1a', 'crab_eye_white': '#ffffff', 'crab_pupil': '#1a1020', 'crab_mouth': '#6a1a10',
    'crab_star': '#ffd84a',
    'dipper_body': '#5e4030', 'dipper_wing': '#4a3022', 'dipper_cap': '#ffffff', 'dipper_throat': '#ffffff', 'dipper_belly': '#8a4a2a',
    'dipper_beak': '#2a2026', 'dipper_leg': '#c89a7a', 'dipper_eye_white': '#ffffff', 'dipper_pupil': '#1a1020', 'dipper_star': '#ffd84a',
    'dipper_dust': '#e8dcc0',
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


def spin(root, deg, pivot_z, lift=0.0):
    """Turn a finished character in the picture plane (about Y) by moving its root: a turn baked into the mesh
    loses the toon outline on these builders, a turn of the root keeps it."""
    root.matrix_world = tr(0, 0, pivot_z + lift) @ rot_y(deg) @ tr(0, 0, -pivot_z)
    return root


def stars(b, c, r=0.12, n=3, M=None):
    for k in range(n):
        a = TAU * k / n + 0.3
        b.part('star%d' % k, sphere(c + V(math.cos(a) * r, math.sin(a) * r * 0.4, 0), 0.028, seg=8, rows=6), 'star', subsurf=1, M=M or Matrix.Identity(4))


# ================================================================ GLASS FROG
def flat_ink(ob, k=0.0):
    ob['outline'] = k
    return ob


def build_glassFrog(pose, t):
    sq, lean, lid, dazed, shut = 1.0, 0.0, 0.05, False, None
    if pose == 'hidden':
        sq, lid = 0.92, 0.6
    elif pose == 'stun':
        lean, lid, dazed = -8, 0.3, True
    elif pose == 'flat':
        sq, shut = 0.4, 'lid'
    elif pose == 'ko':
        shut = 'x'
    M = rot_y(lean) @ scl(1.25 if pose == 'flat' else 1.0, 1.0, sq)
    if pose == 'ko':
        M = Matrix.Identity(4)
    b = E.Builder('glassFrog', pose, M)
    # one chunky see-through-pale body (body and head in one), a paler belly, the little red heart showing through
    b.part('body', blob(V(-0.02, 0, 0.18), 0.27, 0.21, 0.165, seg=24, rows=12), 'body')
    b.part('head', blob(V(0.16, 0, 0.21), 0.16, 0.2, 0.125, seg=20, rows=12), 'body')
    flat_ink(b.part('belly', ellipsoid(V(0.03, -0.11, 0.12), X * 0.19, Y * 0.1, Z * 0.075, seg=18, rows=8), 'belly'))
    flat_ink(b.part('heart', blob(V(0.04, -0.19, 0.15), 0.05, 0.025, 0.045, seg=12, rows=8), 'heart', subsurf=1), 0.3)
    for k, (x, y, z) in enumerate(((-0.13, -0.06, 0.33), (0.02, 0.05, 0.345), (-0.2, 0.08, 0.3))):
        flat_ink(b.part('spot%d' % k, ellipsoid(V(x, y, z), X * 0.035, Y * 0.035, Z * 0.012, seg=10, rows=4), 'spot', subsurf=1))
    # big golden eyes on top of the head
    for side, y in (('l', -0.105), ('r', 0.105)):
        c = V(0.19, y, 0.35)
        n = V(0.6, y * 5, 0.7).normalized()
        b.eye(side, c, n, 0.088, pupil=0.42, lid=lid, lid_mat='body', dazed=dazed, shut=shut, look=V(0.5, -0.85, 0.1))
    b.part('mouth', tube([V(0.3, -0.14, 0.18), V(0.33, -0.07, 0.165), V(0.335, 0.0, 0.165)], 0.012, seg=6), 'mouth', subsurf=1)
    # folded legs: chunky thighs, round toe pads
    for side, y in (('l', -1), ('r', 1)):
        b.part('thigh_' + side, blob(V(-0.17, y * 0.17, 0.09), 0.13, 0.06, 0.085, seg=14, rows=8), 'body')
        b.part('arm_' + side, tube([V(0.17, y * 0.15, 0.13), V(0.23, y * 0.18, 0.03)], 0.035, 0.03, seg=8), 'body', subsurf=1)
        for fx in (-0.06, 0.26):
            flat_ink(b.part('pad_%s%d' % (side, int(fx > 0)), blob(V(fx, y * 0.2, 0.02), 0.05, 0.035, 0.02, seg=10, rows=6), 'pad', subsurf=1), 0.5)
    if pose == 'stun':
        stars(b, V(0.05, 0, 0.58))
    return spin(b.root, 160, 0.18, 0.1) if pose == 'ko' else b.root


# ================================================================ HUMMINGBIRD
def build_hummingbird(pose, t):
    tilt = {'aim': 22, 'dart': 6, 'recover': -18, 'stun': -18}.get(pose, -8)
    k = 1.15
    M = rot_y(tilt) @ scl(k, k, k)
    if pose == 'ko':
        M = scl(k, k, k)
    b = E.Builder('hummingbird', pose, M)
    b.part('body', blob(V(-0.03, 0, 0), 0.16, 0.1, 0.105, seg=20, rows=10), 'body')
    flat_ink(b.part('belly', ellipsoid(V(-0.01, -0.06, -0.035), X * 0.1, Y * 0.05, Z * 0.05, seg=14, rows=8), 'belly'))
    b.part('head', sphere(V(0.13, 0, 0.05), 0.09), 'body')
    flat_ink(b.part('throat', ellipsoid(V(0.15, -0.055, 0.0), X * 0.06, Y * 0.04, Z * 0.045, seg=12, rows=8), 'throat'), 0.3)
    bd = V(1, 0, -0.06).normalized()
    root = V(0.2, 0, 0.045)
    b.part('beak', tube([root, root + bd * 0.12, root + bd * 0.22], 0.02, 0.007, seg=8), 'beak', subsurf=1)
    shut = 'x' if pose == 'ko' else None
    c = V(0.165, -0.07, 0.085)
    b.eye('l', c, V(0.35, -1, 0.25), 0.05, pupil=0.55, lid=0.0 if pose in ('aim', 'dart') else 0.12,
          dazed=pose in ('recover', 'stun'), shut=shut, look=V(0.8, -0.5, 0.0) if pose in ('aim', 'dart') else None)
    if pose in ('aim', 'dart'):
        b.brow('l', c, V(0.35, -1, 0.25), 0.05, angry=1.0)
    # a dark forked tail fan
    for s in (-1, 1):
        b.part('tail%d' % s, blob(V(-0.24, 0, -0.02 + 0.025 * s), 0.1, 0.03, 0.03, seg=12, rows=6), 'tail')
    # wings: broad pale blades. hover: four flap angles; aim: both up; dart: swept back; recover: drooping
    if pose == 'hover':
        flap = 65 * math.cos(TAU * t)
    elif pose == 'return':
        flap = 45
    else:
        flap = {'aim': 75, 'dart': 15, 'recover': -50, 'stun': -50, 'ko': -55}[pose]
    sweep = 55 if pose == 'dart' else 20
    for side, sgn in (('far', 1), ('near', -1)):
        Mw = tr(V(-0.02, sgn * 0.06, 0.07)) @ rot_z(sgn * sweep) @ rot_x(-sgn * flap) @ tr(V(-0.03, sgn * 0.14, 0))
        b.part('wing_' + side, xf(blob((0, 0, 0), 0.075, 0.16, 0.02, seg=14, rows=8), Mw), 'wing' if sgn < 0 else 'wing2')
    if pose in ('recover', 'stun'):
        stars(b, V(0.05, 0, 0.24), r=0.1)
    return spin(b.root, 165, 0.0) if pose == 'ko' else b.root


# ================================================================ CRAB (face-on)
def build_crab(pose, t):
    sq, bob, lean = 1.0, 0.0, 0.0
    if pose == 'walk':
        bob = 0.012 * abs(math.sin(2 * TAU * t))
        lean = 4 * math.sin(TAU * t)
    elif pose == 'flat':
        sq = 0.38
    elif pose == 'stun':
        lean = -6
    M = tr(0, 0, bob) @ rot_x(lean) @ scl(1.0, 1.0, sq)
    if pose == 'ko':
        M = Matrix.Identity(4)
    b = E.Builder('crab', pose, M)
    # the crab faces the camera (-Y): a wide domed shell, eye stalks on top, claws in front
    sc = V(0, 0, 0.21)
    b.part('shell', blob(sc, 0.27, 0.19, 0.12, seg=24, rows=12), 'shell')
    b.part('rim', ellipsoid(sc + V(0, 0, -0.02), X * 0.275, Y * 0.195, Z * 0.06, seg=24, rows=6), 'shell_dk')
    b.part('belly', ellipsoid(sc + V(0, -0.02, -0.06), X * 0.2, Y * 0.15, Z * 0.06, seg=18, rows=8), 'belly')
    for k, (x, z) in enumerate(((-0.13, 0.28), (0.12, 0.29), (0.0, 0.31), (-0.2, 0.22), (0.2, 0.22))):
        b.part('spot%d' % k, ellipsoid(V(x, -0.12, z), X * 0.035, Y * 0.02, Z * 0.03, seg=10, rows=6), 'spot', subsurf=1)
    # eye stalks and eyes
    for side, x in (('l', -0.07), ('r', 0.07)):
        base = V(x, -0.08, 0.3)
        top = V(x * 1.25, -0.1, 0.43)
        b.part('stalk_' + side, tube([base, top], 0.022, 0.018, seg=8), 'stalk', subsurf=1)
        b.eye(side, top + V(0, -0.01, 0.03), V(x * 4, -1, 0.3), 0.05, pupil=0.6, lid=0.1, lid_mat='stalk',
              dazed=pose == 'stun', shut='x' if pose == 'ko' else ('lid' if pose == 'flat' else None), look=V(0.0, -1, 0.0))
    # a little mouth under the eyes
    b.part('mouth', tube([V(-0.04, -0.17, 0.22), V(0.0, -0.18, 0.205), V(0.04, -0.17, 0.22)], 0.012, seg=6), 'mouth', subsurf=1)
    # claws raised in front
    for side, sgn in (('l', -1), ('r', 1)):
        up = 0.05 * math.sin(TAU * t + (0 if sgn < 0 else math.pi)) if pose == 'walk' else 0.0
        arm0 = V(sgn * 0.2, -0.1, 0.17)
        elbow = V(sgn * 0.31, -0.16, 0.2 + up)
        claw = V(sgn * 0.3, -0.2, 0.31 + up)
        b.part('arm_' + side, tube([arm0, elbow, claw], 0.03, 0.035, seg=8), 'leg')
        b.part('claw_' + side, blob(claw + V(0, 0, 0.03), 0.07, 0.05, 0.08, seg=14, rows=8), 'claw')
        b.part('pincer_' + side, ellipsoid(claw + V(sgn * 0.03, -0.02, 0.11), X * 0.025, Y * 0.025, Z * 0.05, seg=8, rows=6), 'claw', subsurf=1)
    # six walking legs, three each side, scuttling
    for side, sgn in (('l', -1), ('r', 1)):
        for k in range(3):
            ph = TAU * t + k * 2.1 + (0 if sgn < 0 else math.pi)
            lift = 0.05 * max(0.0, math.sin(ph)) if pose == 'walk' else 0.0
            hip = V(sgn * 0.22, 0.02 + 0.06 * (k - 1), 0.17)
            knee = V(sgn * (0.36 + 0.02 * k), 0.03 + 0.08 * (k - 1), 0.22 + lift)
            foot = V(sgn * (0.42 + 0.03 * k), 0.04 + 0.1 * (k - 1), 0.02 + lift * 0.5)
            if pose == 'flat':
                knee, foot = V(sgn * 0.42, knee.y, 0.12), V(sgn * 0.55, foot.y, 0.04)
            b.part('leg_%s%d' % (side, k), tube([hip, knee, foot], 0.022, 0.012, seg=6), 'leg', subsurf=1)
    if pose == 'stun':
        stars(b, V(0, 0, 0.55), r=0.14, M=M)
    return spin(b.root, 165, 0.2) if pose == 'ko' else b.root


# ================================================================ DIPPER
def build_dipper(pose, t):
    s = 0.9
    lift = 0.0
    if pose == 'hang':
        M = scl(s, s, s)                                                  # turned upside down below (spin)
    elif pose == 'tell':
        M = scl(s, s, s)
    elif pose == 'drop':
        M = rot_y(-10) @ scl(s, s, s * 1.06)
    elif pose == 'stuck':
        M = about(V(0.2, 0, 0.0), rot_y(62)) @ scl(s, s, s)                 # beak stuck in the floor, tail up
    elif pose == 'climb':
        lift = 0.02 * math.sin(TAU * t)
        M = tr(0, 0, lift) @ rot_y(-12) @ scl(s, s, s)
    elif pose == 'flat':
        M = scl(s * 1.25, s, s * 0.38)
    elif pose == 'ko':
        M = scl(s, s, s)
    else:   # stun
        M = rot_y(-6) @ scl(s, s, s)
    b = E.Builder('dipper', pose, M)
    bc = V(0.0, 0, 0.28)
    b.part('body', blob(bc, 0.22, 0.17, 0.2, seg=22, rows=12), 'body')
    b.part('belly', ellipsoid(bc + V(0.05, -0.02, -0.06), X * 0.14, Y * 0.13, Z * 0.12, seg=16, rows=8), 'belly')
    b.part('throat', ellipsoid(V(0.17, -0.04, 0.33), X * 0.07, Y * 0.1, Z * 0.08, seg=14, rows=8), 'throat')
    hc = V(0.15, 0, 0.47)
    b.part('head', sphere(hc, 0.13), 'body')
    b.part('cap', ellipsoid(hc + V(0.0, 0, 0.04), X * 0.12, Y * 0.12, Z * 0.1, seg=16, rows=6, phi1=math.radians(60)), 'cap')
    b.part('beak', cone(hc + V(0.11, 0, -0.01), hc + V(0.23, 0, -0.03), 0.03, seg=8), 'beak', subsurf=1)
    shut = 'x' if pose == 'ko' else ('lid' if pose in ('flat', 'stuck') else None)
    b.eye('l', hc + V(0.06, -0.09, 0.02), V(0.5, -1, 0.2), 0.065, pupil=0.55, lid=0.0 if pose in ('tell', 'drop') else 0.15,
          dazed=pose == 'stun', shut=shut, look=V(0.6, -0.7, -0.3) if pose == 'hang' else None)
    # cocked tail
    b.part('tail', cone(V(-0.18, 0, 0.32), V(-0.32, 0, 0.48), 0.07, flat=0.45, seg=10), 'wing')
    # wings: folded, or flapping (tell, climb, drop)
    flap = {'tell': 70, 'drop': 80, 'climb': 50 * math.cos(TAU * t), 'stun': -30}.get(pose, None)
    for side, sgn in (('far', 1), ('near', -1)):
        if flap is None:
            b.part('wing_' + side, xf(blob((0, 0, 0), 0.17, 0.04, 0.1, seg=14, rows=8), tr(V(-0.04, sgn * 0.15, 0.3)) @ rot_y(30)), 'wing')
        else:
            Mw = tr(V(0.0, sgn * 0.14, 0.36)) @ rot_x(-sgn * flap)

            def wing(u, w, Mw=Mw, sgn=sgn):
                return Mw @ V(-0.12 * u + (w - 0.4) * (0.14 * (1 - u) + 0.04), sgn * 0.26 * u, 0.0)
            b.part('wing_' + side, sheet(wing, 5, 3, 0.02), 'wing', subsurf=1)
    # legs and toes (gripping up when hanging)
    for side, y in (('l', -0.06), ('r', 0.06)):
        foot = V(0.02, y, 0.0)
        b.part('leg_' + side, tube([V(0.0, y, 0.12), foot + V(0, 0, 0.02)], 0.022, seg=6), 'leg', subsurf=1)
        for k in (-1, 0, 1):
            b.part('toe_%s%d' % (side, k + 1), tube([foot + V(0, 0, 0.01), foot + V(0.07 * (1 if k >= 0 else -0.6), 0.02 * k, 0.0)], 0.012, seg=5), 'leg', subsurf=1)
    if pose == 'stuck':
        for k in range(4):
            a = TAU * k / 4
            b.part('dust%d' % k, sphere(V(0.45 + math.cos(a) * 0.12, -0.05, 0.04 + abs(math.sin(a)) * 0.08), 0.04, seg=8, rows=6), 'dust', subsurf=1,
                   M=Matrix.Identity(4))
        stars(b, V(0.1, 0, 0.55), r=0.13)
    if pose == 'stun':
        stars(b, V(0.1, 0, 0.75), r=0.13)
    turn = {'hang': (180, 0.31), 'tell': (172, 0.31), 'ko': (160, 0.3)}.get(pose)
    return spin(b.root, turn[0], turn[1] * s) if turn else b.root


# ================================================================ IGUANA (sneezer), SEA LION (land), PATA AZUL: the ec models
def build_iguanaSalt(pose, t):
    src = {'tell': 'throw', 'sneeze': 'throw'}.get(pose, pose)
    tt = {'tell': 0.36, 'sneeze': 0.62}.get(pose, t)
    P = dict(E.IGUANA_POSE[src])
    M = E.IGUANA[src]['M'](tt)
    b = E.Builder('iguanaSalt', pose, M)
    E.build_iguana(b, 'throw' if src == 'throw' else pose, tt, P)
    if pose == 'tell':
        # puffed cheeks and a big inhale: two little air puffs going in at the nostrils
        for k in range(2):
            b.part('inhale%d' % k, sphere(V(0.82 + 0.08 * k, -0.06, 0.62 - 0.04 * k), 0.035 - 0.008 * k, seg=8, rows=6), 'salt', subsurf=1)
    return b.root


def build_seaLionLand(pose, t):
    s = 0.92
    lift = 0.19 * s
    if pose == 'walk':
        M = tr(0, 0, lift + 0.01 * abs(math.sin(TAU * t))) @ rot_y(-12 + 3 * math.sin(TAU * t)) @ scl(s, s, s)
    elif pose == 'notice':
        M = tr(0, 0, lift + 0.05) @ rot_y(-26) @ scl(s, s, s)
    elif pose == 'charge':
        M = tr(0, 0, lift - 0.03) @ rot_y(4) @ scl(s * 1.05, s, s * 0.92)
    elif pose == 'stun':
        M = tr(0, 0, lift) @ rot_y(-8) @ scl(s, s, s)
    elif pose == 'flat':
        M = tr(0, 0, 0.07) @ scl(s * 1.15, s * 1.1, s * 0.38)
    else:
        M = scl(s, s, s)
    b = E.Builder('seaLionLand', pose, M)
    E.build_sea_lion(b, 'swim' if pose in ('walk', 'charge') else ('ko' if pose == 'ko' else 'idle'), t if pose == 'walk' else 0.3,
                     {'ns': 1})
    if pose == 'charge':
        # the belly slide: a spray of sand and sparkles behind
        for k in range(5):
            b.part('sand%d' % k, sphere(V(-0.7 - 0.1 * k, -0.05 + 0.04 * (k % 2), -0.15 + 0.06 * (k % 3)), 0.06 - 0.008 * k, seg=8, rows=6), 'sand', subsurf=1)
    if pose == 'notice':
        b.part('bark', blob(V(0.72, -0.05, 0.03), 0.035, 0.03, 0.04, seg=10, rows=6), 'mouth', subsurf=1)
    if pose == 'stun':
        stars(b, V(0.4, 0, 0.32), r=0.14)
    return spin(b.root, 170, 0.0, lift + 0.04) if pose == 'ko' else b.root


def build_pataAzul(pose, t):
    P = dict(E.BOOBY_POSE['idle'])
    if pose == 'run':
        P['lean'] = 14
        M = pose_matrix(P, bob=0.03 * abs(math.sin(TAU * t)))
        tt = (t * 1.0) % 1.0
    else:
        M = E.BOOBY['idle']['M'](t)
        tt = t
    b = E.Builder('pataAzul', pose, M)
    E.build_booby(b, 'idle', tt, P)
    Mb = b.M @ about(V(0, 0, 0.3), rot_x(3.0 * math.sin(TAU * tt)))
    # the racing bib on the belly (a white square with a red '1') and a sweatband
    bib_c = V(0.27, -0.12, 0.66)
    b.part('bib', xf(box_bm((0.05, 0.24, 0.26), bevel=0.02, segments=2), tr(bib_c) @ rot_z(-28) @ rot_y(14)), 'bib', subsurf=1, M=Mb)
    for k, (dz, h, dx) in enumerate(((0.0, 0.16, 0.0), (0.06, 0.04, -0.04))):
        b.part('num%d' % k, xf(box_bm((0.02, 0.035 if k == 0 else 0.06, h), bevel=0.004, segments=1), tr(bib_c + V(0.03, -0.012 + dx * 0.3, dz)) @ rot_z(-28) @ rot_y(14)),
               'bib_num', subsurf=0, M=Mb)
    nod = 3 * math.sin(2 * TAU * tt)
    MH = Mb @ about(V(0.08, 0, 1.0), rot_y(nod))
    b.part('band', E.torus_bm(V(0.15, 0, 1.33), V(0.25, 0, 1).normalized(), 0.17, 0.035, seg=20, sides=8), 'band', subsurf=1, M=MH)
    return b.root


BUILD = {'glassFrog': build_glassFrog, 'hummingbird': build_hummingbird, 'crab': build_crab, 'dipper': build_dipper,
         'iguanaSalt': build_iguanaSalt, 'seaLionLand': build_seaLionLand, 'pataAzul': build_pataAzul}


def build(kind, pose, t=0.0):
    clear(kind)
    return BUILD[kind](pose, t)
