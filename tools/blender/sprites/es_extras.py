# es_extras: the NEW Spain cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §4.3/§8), rendered ahead
# of the engine work into their own atlas `es_x` (not referenced by the game yet, so the live `es` atlas stays lean).
# When the overhaul wires these enemies, either point their cfg.atlas at 'es_x' or move the kinds into es_enemies.py.
# Same conventions and helpers as ma_enemies.py / es_enemies.py. Kinds are named like the planned spawn types
# (esStork -> 'stork'). Poses follow the planned behaviours (§4.2):
#   stork    grabber flyer: a white stork with black flight feathers and a red beak   fly(t) swoop carry rest stun ko  centre, 36 px
#   pulpo    inkBlot: an octopus sitting on a wooden plate, paprika speckles          idle(t) tell squirt stun flat ko  feet, 24 px
#   olive    roll: a green olive with a red pepper stuffing                           walk(t) curl roll(t) stun flat ko feet, 18 px
#   gamba    hop: a pink prawn standing on its tail fan                               walk(t) hop stun flat ko         feet, 20 px
#   lizard   pouncer: a Canary giant lizard (dark, blue cheeks)                      walk(t) crouch tell pounce stun flat ko feet, 16 px
#   kestrel  flyer: a rusty little falcon with a grey head                            fly(t) swoop stun ko             centre, 30 px
#   lynx     pouncer: an Iberian lynx (spotted, ear tufts, cheek ruff)               walk(t) crouch tell pounce stun flat ko feet, 24 px
#   sheep    walker: a fluffy merino sheep with a dark face                           walk(t) stun flat ko             feet, 26 px
# Render and pack (build_country.sh only packs <cc>_enemies*.py into the country atlas):
#   W=/tmp/brady-sprites/es_x; JOB=enemies:es_extras LOOK=toon OUT=$W NAME=es_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/es_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ma_enemies as M
from ma_enemies import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone, lathe,
                        torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow, mouth_bm,
                        biped_legs, quad_legs, superellipsoid)
from es_enemies import STD_POSE

PX = 28.1
KINDS = ['stork', 'pulpo', 'olive', 'gamba', 'lizard', 'kestrel', 'lynx', 'sheep']
POSES = {
    'stork': ['fly', 'swoop', 'carry', 'rest', 'stun', 'ko'],
    'pulpo': ['idle', 'tell', 'squirt', 'stun', 'flat', 'ko'],
    'olive': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'gamba': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'lizard': ['walk', 'crouch', 'tell', 'pounce', 'stun', 'flat', 'ko'],
    'kestrel': ['fly', 'swoop', 'stun', 'ko'],
    'lynx': ['walk', 'crouch', 'tell', 'pounce', 'stun', 'flat', 'ko'],
    'sheep': ['walk', 'stun', 'flat', 'ko'],
}
FRAMES = {('pulpo', 'idle'): (4, 6)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'stork': 'centre', 'kestrel': 'centre'})
HEIGHT = {'pulpo': 24 / PX, 'olive': 18 / PX, 'gamba': 20 / PX, 'lizard': 16 / PX, 'lynx': 24 / PX, 'sheep': 26 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'stork': 36 / PX, 'kestrel': 30 / PX, 'lizard': 26 / PX})

COLORS = {
    'stork_white': '#fbfbf6', 'stork_black': '#2a2a34', 'stork_beak': '#e8502a', 'stork_leg': '#e8603a',
    'stork_eye_white': '#fbfbf2', 'stork_pupil': '#1a1020', 'stork_mouth': '#8a2a1a',
    'pulpo_skin': '#e86a7a', 'pulpo_skin2': '#d8506a', 'pulpo_spot': '#b83a3a', 'pulpo_sucker': '#ffc8c8', 'pulpo_plate': '#c8945a',
    'pulpo_plate2': '#a8743a', 'pulpo_ink': '#2a2238', 'pulpo_eye_white': '#fbfbf2', 'pulpo_pupil': '#1a1020', 'pulpo_mouth': '#7a1a3a',
    'olive_skin': '#6a9a3a', 'olive_shine': '#a8d070', 'olive_pepper': '#e8322a', 'olive_feet': '#4a6a2a',
    'olive_eye_white': '#fbfbf2', 'olive_pupil': '#1a1020', 'olive_mouth': '#2a3a1a',
    'gamba_shell': '#ff8a7a', 'gamba_shell2': '#ff6a5a', 'gamba_fan': '#ff5a4a', 'gamba_leg': '#e85a4a', 'gamba_feeler': '#c84a3a',
    'gamba_eye_white': '#fbfbf2', 'gamba_pupil': '#1a1020', 'gamba_mouth': '#7a1a1a',
    'lizard_skin': '#4a4a44', 'lizard_skin2': '#3a3a36', 'lizard_cheek': '#4aa8d8', 'lizard_belly': '#8a8a72', 'lizard_eyeglow': '#ffd23a',
    'lizard_eye_white': '#fbfbf2', 'lizard_pupil': '#1a1020', 'lizard_mouth': '#2a1a1a',
    'kestrel_back': '#c8703a', 'kestrel_head': '#8a9ab0', 'kestrel_belly': '#f4e0c0', 'kestrel_spot': '#5a3a2a', 'kestrel_wing': '#a85a2a',
    'kestrel_tip': '#3a2a2a', 'kestrel_beak': '#f0c040', 'kestrel_eye_white': '#fbfbf2', 'kestrel_pupil': '#1a1020', 'kestrel_mouth': '#3a2a2a',
    'lynx_fur': '#d8a868', 'lynx_fur2': '#c8945a', 'lynx_cream': '#f8ecd8', 'lynx_spot': '#5a3a2a', 'lynx_tuft': '#2a2220', 'lynx_nose': '#c86a6a',
    'lynx_eyeglow': '#ffe060', 'lynx_eye_white': '#fbfbf2', 'lynx_pupil': '#1a1020', 'lynx_mouth': '#3a1a1a',
    'sheep_wool': '#f4f0e6', 'sheep_wool2': '#e4dccc', 'sheep_face': '#3a3236', 'sheep_ear': '#4a4046', 'sheep_hoof': '#2a2226',
    'sheep_eye_white': '#fbfbf2', 'sheep_pupil': '#1a1020', 'sheep_mouth': '#1a1418',
}
M.COLORS.update(COLORS)
POSE = dict(STD_POSE)
POSE.update({
    'crouch': dict(sx=1.08, sz=0.8, lean=6, lid=0.45, mouth='smile', feet='stand'),
    'tell': dict(sx=1.04, sz=0.86, lean=10, lid=0.0, mouth='grin', feet='stand', eye=1.15, angry=True),
    'pounce': dict(sx=1.15, sz=0.9, lean=-18, lid=0.2, mouth='open', feet='tuck', angry=True),
    'idle': dict(sx=1.0, sz=1.0, lean=0, lid=0.15, mouth='smile', feet='stand'),
    'squirt': dict(sx=0.92, sz=1.1, lean=-6, lid=0.0, mouth='o', feet='stand', eye=1.1),
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


# ================================================================ STORK (grabber flyer, centre)
def build_stork(root, pose, t):
    P = {'er': 0.06, 'skin': 'stork_white', 'lid': 0.15, 'look': Vector((0.7, -0.7, -0.15))}
    flap, tilt, legs = 0.0, 0.0, 'back'
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt, legs = -0.7, 26, 'down'
    elif pose == 'carry':
        flap, legs = 0.6 * math.sin(TAU * t) + 0.3, 'grab'
    elif pose == 'rest':
        flap, legs, P['lid'] = -0.9, 'stand', 0.6
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.8, True, 0.5
    else:
        flap, P['x'], tilt = -0.8, True, 150
    Mx = rot_y(tilt)
    bc = V(0, 0, 0)
    make_part('body', blob(bc, 0.42, 0.2, 0.2, seg=24, rows=14), 'stork_white', root, Mx)
    make_part('tail', prism([V(-0.36, 0, 0.05), V(-0.62, 0, 0.1), V(-0.6, 0, -0.06), V(-0.36, 0, -0.06)], Y * 0.12), 'stork_white', root, Mx, subsurf=0, smooth=False)
    neck = [V(0.32, 0, 0.06), V(0.46, 0, 0.12), V(0.56, 0, 0.18)]
    make_part('neck', tube(neck, 0.08, 0.07, seg=10), 'stork_white', root, Mx)
    hc = V(0.62, 0, 0.22)
    make_part('head', sphere(hc, 0.11, seg=16, rows=10), 'stork_white', root, Mx)
    make_part('beak', cone(hc + V(0.08, 0, -0.01), hc + V(0.5, 0, -0.08), 0.045, seg=8), 'stork_beak', root, Mx)
    hs = ellipsoid_surf(hc, 0.11, 0.11, 0.11)
    p, n = hs(hc.z + 0.03, -1.2)
    eye_one('stork', 'r', p - n * 0.01, n, root, Mx, P)
    for side, sgn in (('l', 1), ('r', -1)):
        up = 0.4 * flap * (1 if side == 'r' else 0.85)
        sh = V(0.05, sgn * 0.12, 0.12)
        tip = sh + V(-0.25, sgn * 0.15, 0.7 * up + 0.05)
        mid = sh + V(0.1, sgn * 0.1, 0.4 * up + 0.08)
        wing = [sh + V(0.25, 0, 0), mid + V(0.25, 0, 0), tip + V(0.1, 0, 0), tip + V(-0.35, 0, -0.05), sh + V(-0.3, 0, 0)]
        make_part('wing_' + side, prism(wing, Y * 0.04), 'stork_white', root, Mx, subsurf=0, smooth=False)
        make_part('wingtip_' + side, prism([tip + V(0.1, 0, 0), tip + V(-0.35, 0, -0.05), tip + V(-0.5, 0, -0.25 * (1 if up >= 0 else -1)), tip + V(0.05, 0, -0.12)], Y * 0.05),
                  'stork_black', root, Mx, subsurf=0, smooth=False)
    if legs == 'back':
        lp = [[V(-0.2, s * 0.06, -0.1), V(-0.55, s * 0.06, -0.18), V(-0.85, s * 0.06, -0.2)] for s in (-1, 1)]
    elif legs == 'down':
        lp = [[V(0.0, s * 0.06, -0.15), V(0.05, s * 0.06, -0.45), V(0.12, s * 0.06, -0.62)] for s in (-1, 1)]
    elif legs == 'grab':
        lp = [[V(0.0, s * 0.06, -0.15), V(0.0, s * 0.06, -0.42), V(0.12 * s, s * 0.06, -0.52)] for s in (-1, 1)]
    else:
        lp = [[V(-0.05, s * 0.06, -0.15), V(-0.05 + 0.04 * s, s * 0.06, -0.45), V(-0.05, s * 0.06, -0.75)] for s in (-1, 1)]
    for k, path in enumerate(lp):
        make_part('leg%d' % k, tube(path, 0.022, seg=6), 'stork_leg', root, Mx, subsurf=0)


# ================================================================ PULPO (on a wooden plate)
def build_pulpo(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.085, skin='pulpo_skin')
    sx, sz, lean = P['sx'], P['sz'], P['lean']
    bob = 0.02 * math.sin(TAU * t) if pose == 'idle' else 0.0
    make_part('plate', lathe([(0.0, 0.0), (0.52, 0.0), (0.56, 0.06), (0.0, 0.06)], seg=28), 'pulpo_plate', root, None, subsurf=0)
    make_part('plate_rim', torus((0, 0, 0.06), 0.53, 0.025, seg=28), 'pulpo_plate2', root, None, subsurf=0)
    Mx = T((0, 0, 0.06 + bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    hc, hr = V(-0.02, 0, 0.5), (0.3, 0.27, 0.34)
    make_part('head', blob(hc, *hr, seg=26, rows=16), 'pulpo_skin', root, Mx)
    surf = ellipsoid_surf(hc, *hr)
    for k, (z, a) in enumerate(((0.7, -1.9), (0.62, -1.3), (0.78, -1.55), (0.55, -2.3), (0.72, -0.9))):
        p, n = surf(z, a)
        make_part('spot%d' % k, ellipsoid(p + n * 0.004, X * 0.035, Y * 0.035, Z * 0.035, seg=8, rows=6), 'pulpo_spot', root, Mx, subsurf=0)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = surf(0.48, az)
        eye_one('pulpo', side, p - n * 0.01, n, root, Mx, P)
        if P.get('angry'):
            brow('pulpo', side, p - n * 0.01, n, root, Mx, P['er'])
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.32, math.radians(0), math.radians(-90), scale=0.9), 'pulpo_mouth', root, Mx)
    # eight curling arms around the plate
    for k in range(8):
        a = TAU * k / 8 + 0.2
        curl = 0.6 + 0.3 * math.sin(TAU * t + k)
        base = V(math.cos(a) * 0.2, math.sin(a) * 0.18, 0.22)
        path = [base]
        for j in range(1, 6):
            u = j / 5
            r = 0.2 + 0.32 * u
            path.append(V(math.cos(a) * r, math.sin(a) * r * 0.9, 0.22 - 0.16 * u + 0.12 * curl * u * u))
        make_part('arm%d' % k, tube(path, 0.07, 0.025, seg=8), 'pulpo_skin2' if k % 2 else 'pulpo_skin', root, Mx)
    if pose == 'squirt':
        for k in range(4):
            c = V(0.42 + 0.14 * k, -0.05, 0.3 - 0.03 * k)
            make_part('ink%d' % k, sphere(c, 0.06 + 0.03 * k, seg=10, rows=6), 'pulpo_ink', root, None)


# ================================================================ OLIVE (roll)
def olive_body(root, Mx, c):
    r = (0.24, 0.22, 0.3)
    make_part('skin', blob(c, *r, seg=24, rows=14), 'olive_skin', root, Mx)
    surf = ellipsoid_surf(c, *r)
    make_part('shine', oval_patch(surf, c.z + 0.12, 0.06, -1.9, 0.35), 'olive_shine', root, Mx)
    make_part('pepper', ellipsoid(c + V(0, 0, 0.27), X * 0.08, Y * 0.08, Z * 0.05, seg=12, rows=6), 'olive_pepper', root, Mx)
    return surf


def build_olive(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.075, skin='olive_skin')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 4 * math.sin(TAU * t)
    if pose == 'roll':
        c = V(0, 0, 0.3)
        MR = about(c, rot_y(360 * t)) @ about(c, rot_y(90))
        surf = olive_body(root, MR, c)
        return
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    c = V(0, 0, 0.42)
    surf = olive_body(root, Mx, c)
    for side, az in (('r', -0.4), ('l', -1.2)):
        p, n = surf(0.48, az)
        eye_one('olive', side, p - n * 0.012, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.33, math.radians(5), math.radians(-100), scale=0.8), 'olive_mouth', root, Mx)
    biped_legs('olive', root, Mx, P, t, (0.0, 0.08, 0.14), (0.08, 0.05, 0.04), 0.03, 'olive_feet')


# ================================================================ GAMBA (hop)
def build_gamba(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.075, skin='gamba_shell')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
    lift = 0.1 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ diag(sx, sx, sz)
    # a curled body of shell segments standing on its tail fan
    segs = []
    for k in range(6):
        a = math.radians(-100 + k * 32)
        segs.append(V(-0.05 + 0.24 * math.cos(a), 0, 0.36 + 0.26 * math.sin(a)))
    for k, c in enumerate(segs):
        make_part('seg%d' % k, sphere(c, 0.16 - 0.012 * k, seg=16, rows=10), 'gamba_shell' if k % 2 else 'gamba_shell2', root, Mx)
    fan = segs[0] + V(-0.02, 0, -0.08)
    for k in range(3):
        a = math.radians(-120 + k * 30)
        make_part('fan%d' % k, prism([fan, fan + V(math.cos(a) * 0.22, 0, math.sin(a) * 0.22) + V(-0.05, 0, 0), fan + V(math.cos(a + 0.3) * 0.22, 0, math.sin(a + 0.3) * 0.22)], Y * 0.08),
                  'gamba_fan', root, Mx, subsurf=0, smooth=False)
    hc, hr = segs[-1] + V(0.12, 0, 0.02), 0.17
    make_part('head', sphere(hc, hr, seg=18, rows=12), 'gamba_shell', root, Mx)
    surf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = surf(hc.z + 0.05, az)
        eye_one('gamba', side, p - n * 0.01, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], hc.z - 0.06, math.radians(0), math.radians(-80), scale=0.7), 'gamba_mouth', root, Mx)
    for k in range(2):
        make_part('feeler%d' % k, tube([hc + V(0.1, -0.04 + 0.08 * k, 0.1), hc + V(0.24, -0.04 + 0.08 * k, 0.22), hc + V(0.36 - 0.08 * k, 0, 0.3)], 0.015, seg=6), 'gamba_feeler', root, Mx, subsurf=1)
    if P['feet']:
        for k in range(3):
            base = segs[2 + k] + V(0.05, 0, -0.1)
            ph = TAU * t + k * 2.1
            make_part('leg%d' % k, tube([base, base + V(0.06 + 0.04 * math.sin(ph), -0.05, -0.15), V(base.x + 0.05, -0.05, 0.03 if pose != 'hop' else 0.08)], 0.02, seg=6),
                      'gamba_leg', root, T((0, 0, lift)), subsurf=0)


# ================================================================ LIZARD (pouncer)
def build_lizard(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.06, skin='lizard_skin')
    sx, sz, lean = P['sx'], P['sz'], P['lean']
    bob = 0.01 * math.sin(2 * TAU * t) if pose == 'walk' else 0.0
    lift = 0.12 if pose == 'pounce' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean * 0.5) @ diag(sx, sx, sz)
    sway = 0.06 * math.sin(TAU * t) if pose == 'walk' else (0.04 * math.sin(TAU * 4 * t) if pose == 'tell' else 0.0)
    body = [V(0.3, 0, 0.18), V(0.05, sway, 0.17), V(-0.25, -sway, 0.15), V(-0.55, sway, 0.1), V(-0.85, 0, 0.06)]
    make_part('body', tube(body, 0.12, seg=12, radii=[0.1, 0.13, 0.11, 0.06, 0.02]), 'lizard_skin', root, Mx)
    belly = [p + V(0, -0.03, -0.05) for p in body[:3]]
    make_part('belly', tube(belly, 0.08, seg=10), 'lizard_belly', root, Mx)
    hc, hr = V(0.42, 0, 0.21), (0.17, 0.11, 0.09)
    make_part('head', blob(hc, *hr, seg=18, rows=10), 'lizard_skin', root, Mx)
    make_part('cheek', ellipsoid(hc + V(-0.03, -0.09, -0.02), X * 0.06, Y * 0.02, Z * 0.04, seg=10, rows=6), 'lizard_cheek', root, Mx, subsurf=1)
    surf = ellipsoid_surf(hc, *hr)
    p, n = surf(hc.z + 0.05, -1.0)
    eye_one('lizard', 'r', p - n * 0.006, n, root, Mx, P)
    if P.get('angry'):
        brow('lizard', 'r', p - n * 0.006, n, root, Mx, P['er'])
    make_part('mouth', mouth_bm(surf, P['mouth'] or 'smile', hc.z - 0.03, math.radians(-30), math.radians(-90), scale=0.6), 'lizard_mouth', root, Mx)
    for k, (x, side) in enumerate(((0.22, 1), (0.22, -1), (-0.25, 1), (-0.25, -1))):
        ph = TAU * t + (0 if k in (0, 3) else math.pi)
        dx = 0.06 * math.sin(ph) if pose == 'walk' else (0.1 if pose == 'pounce' and x > 0 else (-0.1 if pose == 'pounce' else 0.0))
        hip = V(x, side * 0.08, 0.13)
        foot = V(x + dx + 0.04, side * 0.18, 0.02 if pose not in ('pounce',) else 0.0)
        make_part('leg%d' % k, tube([hip, (hip + foot) / 2 + V(0, side * 0.02, 0.06), foot], 0.03, seg=6), 'lizard_skin2', root, Mx @ T((0, 0, -lift * 0.5)), subsurf=0)


# ================================================================ KESTREL (flyer, centre)
def build_kestrel(root, pose, t):
    P = {'er': 0.065, 'skin': 'kestrel_head', 'lid': 0.15, 'look': Vector((0.7, -0.7, -0.2))}
    flap, tilt = 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.8, 30
        P['angry'] = True
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.7, True, 0.5
    else:
        flap, P['x'], tilt = -0.7, True, 160
    Mx = rot_y(tilt)
    bc = V(0, 0, 0)
    make_part('body', blob(bc, 0.3, 0.17, 0.17, seg=22, rows=12), 'kestrel_back', root, Mx)
    make_part('belly', ell_cap(bc, (0.3, 0.17, 0.17), (0.3, -0.6, -0.7), 50, seg=18, rows=5), 'kestrel_belly', root, Mx)
    make_part('tail', prism([V(-0.25, 0, 0.04), V(-0.6, 0, 0.06), V(-0.62, 0, -0.06), V(-0.25, 0, -0.05)], Y * 0.1), 'kestrel_back', root, Mx, subsurf=0, smooth=False)
    make_part('tailband', prism([V(-0.55, -0.06, 0.06), V(-0.62, -0.06, 0.06), V(-0.63, -0.06, -0.06), V(-0.56, -0.06, -0.06)], Y * 0.02), 'kestrel_tip', root, Mx, subsurf=0, smooth=False)
    hc, hr = V(0.3, 0, 0.1), 0.14
    make_part('head', sphere(hc, hr, seg=18, rows=12), 'kestrel_head', root, Mx)
    make_part('beak', cone(hc + V(0.11, 0, -0.01), hc + V(0.22, 0, -0.07), 0.04, seg=8), 'kestrel_beak', root, Mx)
    surf = ellipsoid_surf(hc, hr, hr, hr)
    p, n = surf(hc.z + 0.03, -1.15)
    eye_one('kestrel', 'r', p - n * 0.01, n, root, Mx, P)
    if P.get('angry'):
        brow('kestrel', 'r', p - n * 0.01, n, root, Mx, P['er'])
    make_part('stripe', tube([p + V(-0.01, -0.02, -0.05), p + V(-0.02, -0.03, -0.14)], 0.018, seg=6), 'kestrel_spot', root, Mx, subsurf=0)
    for side, sgn in (('l', 1), ('r', -1)):
        up = 0.35 * flap
        sh = V(0.05, sgn * 0.1, 0.08)
        tip = sh + V(-0.3, sgn * 0.12, 0.6 * up + 0.05)
        wing = [sh + V(0.15, 0, 0), sh + V(0.05, 0, 0.35 * up + 0.08), tip, sh + V(-0.3, 0, -0.03)]
        make_part('wing_' + side, prism(wing, Y * 0.04), 'kestrel_wing', root, Mx, subsurf=0, smooth=False)
        make_part('wtip_' + side, prism([tip, tip + V(-0.18, 0, -0.06), sh + V(-0.2, 0, 0.0)], Y * 0.05), 'kestrel_tip', root, Mx, subsurf=0, smooth=False)


# ================================================================ LYNX (pouncer)
def build_lynx(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.075, skin='lynx_fur')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
    lift = 0.12 if pose == 'pounce' else 0.0
    feet = {'crouch': 'stand', 'tell': 'stand', 'pounce': 'tuck'}.get(pose, P['feet'])
    P['feet'] = feet
    Mx = T((0, 0, bob + lift)) @ rot_y(lean * 0.4) @ diag(sx, sx, sz)
    bc, br = V(-0.08, 0, 0.42), (0.4, 0.2, 0.2)
    make_part('body', blob(bc, *br, seg=26, rows=14), 'lynx_fur', root, Mx)
    make_part('chest', ell_cap(bc, br, (0.6, -0.4, -0.7), 45, seg=18, rows=5), 'lynx_cream', root, Mx)
    surf_b = ellipsoid_surf(bc, *br)
    for k, (z, a) in enumerate(((0.5, -1.7), (0.42, -1.4), (0.55, -2.1), (0.36, -1.9), (0.47, -2.4), (0.5, -1.1))):
        p, n = surf_b(z, a)
        make_part('spot%d' % k, ellipsoid(p + n * 0.004, X * 0.035, Y * 0.03, Z * 0.03, seg=8, rows=6), 'lynx_spot', root, Mx, subsurf=0)
    MH = Mx @ about(V(0.28, 0, 0.5), rot_y(10 if pose == 'crouch' else 0))
    hc, hr = V(0.38, 0, 0.6), 0.19
    make_part('head', sphere(hc, hr, seg=22, rows=14), 'lynx_fur', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('ruff_' + side, cone(hc + V(-0.05, sgn * 0.12, -0.08), hc + V(-0.02, sgn * 0.3, -0.2), 0.08, flat=0.5, seg=8), 'lynx_cream', root, MH, subsurf=1)
        eb = hc + V(-0.04, sgn * 0.09, 0.14)
        make_part('ear_' + side, cone(eb, eb + V(0.02, sgn * 0.02, 0.18), 0.07, flat=0.5, seg=8), 'lynx_fur2', root, MH, subsurf=1)
        make_part('tuft_' + side, tube([eb + V(0.02, sgn * 0.02, 0.17), eb + V(0.03, sgn * 0.02, 0.27)], 0.015, 0.008, seg=5), 'lynx_tuft', root, MH, subsurf=0)
    mc = hc + V(0.14, 0, -0.05)
    make_part('muzzle', blob(mc, 0.09, 0.09, 0.07, seg=14, rows=8), 'lynx_cream', root, MH)
    make_part('nose', sphere(mc + V(0.08, 0, 0.03), 0.03, seg=10, rows=6), 'lynx_nose', root, MH)
    hs = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -0.5), ('l', -1.15)):
        p, n = hs(hc.z + 0.04, az)
        eye_one('lynx', side, p - n * 0.01, n, root, MH, P)
        if P.get('angry'):
            brow('lynx', side, p - n * 0.01, n, root, MH, P['er'])
    ms = ellipsoid_surf(mc, 0.09, 0.09, 0.07)
    make_part('mouth', mouth_bm(ms, P['mouth'] or 'smile', mc.z - 0.03, math.radians(-15), math.radians(-85), scale=0.5), 'lynx_mouth', root, MH)
    make_part('tail', tube([V(-0.46, 0, 0.5), V(-0.56, 0, 0.58)], 0.06, 0.05, seg=8), 'lynx_fur', root, Mx)
    make_part('tailtip', sphere(V(-0.58, 0, 0.6), 0.055, seg=10, rows=6), 'lynx_tuft', root, Mx)
    hips = {'fl': V(0.2, -0.11, 0.32), 'fr': V(0.2, 0.11, 0.32), 'bl': V(-0.3, -0.11, 0.32), 'br': V(-0.3, 0.11, 0.32)}
    quad_legs('lynx', root, Mx, P, t, hips, 0.04, 0.06, (0.075, 0.06, 0.045), 'lynx_fur', A=0.1, H=0.06, foot_mat='lynx_cream')


# ================================================================ SHEEP (walker)
def build_sheep(root, pose, t):
    P = dict(POSE[pose])
    P.update(er=0.07, skin='sheep_face')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
    Mx = T((0, 0, bob)) @ rot_y(lean * 0.5) @ diag(sx, sx, sz)
    bc = V(-0.05, 0, 0.55)
    make_part('body', blob(bc, 0.42, 0.28, 0.3, seg=24, rows=14), 'sheep_wool', root, Mx)
    for k in range(9):          # fluffy wool bumps
        a = TAU * k / 9
        c = bc + V(0.36 * math.cos(a), -0.12, 0.25 * math.sin(a))
        make_part('puff%d' % k, sphere(c, 0.14, seg=12, rows=8), 'sheep_wool2' if k % 2 else 'sheep_wool', root, Mx, subsurf=1)
    hc, hr = V(0.42, 0, 0.66), (0.15, 0.13, 0.17)
    make_part('head', blob(hc, *hr, seg=18, rows=12), 'sheep_face', root, Mx)
    make_part('topknot', sphere(hc + V(-0.04, 0, 0.15), 0.12, seg=12, rows=8), 'sheep_wool', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('ear_' + side, ellipsoid(hc + V(-0.04, sgn * 0.16, 0.04), X * 0.06, Y * 0.09, Z * 0.035, seg=10, rows=6), 'sheep_ear', root, Mx)
    surf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -0.45), ('l', -1.1)):
        p, n = surf(hc.z + 0.04, az)
        eye_one('sheep', side, p - n * 0.01, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, P['mouth'] or 'smile', hc.z - 0.09, math.radians(-15), math.radians(-80), scale=0.6), 'sheep_mouth', root, Mx)
    hips = {'fl': V(0.18, -0.12, 0.34), 'fr': V(0.18, 0.12, 0.34), 'bl': V(-0.28, -0.12, 0.34), 'br': V(-0.28, 0.12, 0.34)}
    quad_legs('sheep', root, Mx, P, t, hips, 0.04, 0.045, (0.06, 0.05, 0.04), 'sheep_face', A=0.08, H=0.05, foot_mat='sheep_hoof')


BUILDERS = {'stork': build_stork, 'pulpo': build_pulpo, 'olive': build_olive, 'gamba': build_gamba, 'lizard': build_lizard,
            'kestrel': build_kestrel, 'lynx': build_lynx, 'sheep': build_sheep}


def build(kind, pose, t=0.0):
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
