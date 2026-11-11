# br_extras: the rebuilt Brazil's new cast (29_tour_br_levels.js), rendered into their own atlas `br_x` (the live `br`
# atlas is never re-packed). Wiring (cfg.atlas = 'br_x', the sprite names below) is listed in the art handoff.
#   sloth        the three-toed sloth (ceilingDrop): hangs by its arms, drops, sits stuck, climbs back up slowly
#                                                                    hang tell drop stuck climb(t) stun flat ko   feet 26 px
#   swift        the sooty swift behind the falls (hoverDart)        hover(t) aim dart recover return stun ko    centre 12 px
#   parrot       a scarlet macaw (flyer, swoops)                     fly(t) swoop stun ko                         centre 16 px
#   kite         a striped beach kite with a face, ribbon tail       fly(t) swoop stun ko                         centre 30 px
#   piranha      a red-bellied piranha of the lagoon schools (the br model, swimming)   swim(t) ko             centre 16 px
#   quati        QUATI the coati thief (the br coati in a bandit mask with a satchel of stamps)
#                                                                    idle(t) grab run(t) caught                   feet 26 px
#   quatiKeeper  the coati keeping the Banca do Quati, in a straw hat   idle(t)                                   feet 26 px
# Render and pack:
#   W=<work>/br_x; JOB=enemies:br_extras LOOK=toon OUT=$W NAME=br_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/br_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import br_enemies as E
from br_enemies import (TAU, X, Y, Z, V, tr, scl, rot_x, rot_y, rot_z, about, perp_frame, ellipsoid, sphere, blob, tube, cone, sheet,
                        xf, box_bm, on_ellipsoid, torus_bm)

PX = 28.1
KINDS = ['sloth', 'swift', 'parrot', 'kite', 'piranha', 'quati', 'quatiKeeper']
POSES = {
    'sloth': ['hang', 'tell', 'drop', 'stuck', 'climb', 'stun', 'flat', 'ko'],
    'swift': ['hover', 'aim', 'dart', 'recover', 'return', 'stun', 'ko'],
    'parrot': ['fly', 'swoop', 'stun', 'ko'],
    'kite': ['fly', 'swoop', 'stun', 'ko'],
    'piranha': ['swim', 'ko'],
    'quati': ['idle', 'grab', 'run', 'caught'],
    'quatiKeeper': ['idle'],
}
FRAMES = {('swift', 'hover'): (4, 16), ('sloth', 'climb'): (4, 3), ('quati', 'run'): (6, 12), ('kite', 'fly'): (6, 6)}
ORIGIN = {'sloth': 'feet', 'swift': 'centre', 'parrot': 'centre', 'kite': 'centre', 'piranha': 'centre', 'quati': 'feet', 'quatiKeeper': 'feet'}
HEIGHT = {'sloth': 0.62, 'quati': 26 / PX, 'quatiKeeper': 26 / PX}
SIZE = {'swift': 0.5, 'parrot': 0.6, 'kite': 0.62, 'piranha': 0.42}

for src, dst in (('coati', 'quati'), ('coati', 'quatiKeeper')):
    for k, v in list(E.COLORS.items()):
        if k.startswith(src + '_'):
            E.COLORS[dst + k[len(src):]] = v
E.COLORS.update({
    'quati_mask': '#1e1418', 'quati_bag': '#c8902a', 'quati_strap': '#8a5a14', 'quati_stamp_a': '#ff6a8a', 'quati_stamp_b': '#5ac8ff',
    'quati_stamp_c': '#ffd84a', 'quati_star': '#ffd84a',
    'quatiKeeper_hat': '#e8c870', 'quatiKeeper_hat_dk': '#c8a050', 'quatiKeeper_band': '#ff3d8b',
    'sloth_fur': '#9a8060', 'sloth_fur2': '#7a6448', 'sloth_face': '#f0e0c0', 'sloth_patch': '#3a2a1a', 'sloth_claw': '#2e2218',
    'sloth_nose': '#2a1a10', 'sloth_mouth': '#2a1a10', 'sloth_eye_white': '#ffffff', 'sloth_pupil': '#1a1020', 'sloth_star': '#ffd84a',
    'swift_body': '#3a3a4a', 'swift_wing': '#2a2a38', 'swift_throat': '#c8c8d8', 'swift_beak': '#1a1a20', 'swift_eye_white': '#ffffff',
    'swift_pupil': '#1a1020', 'swift_star': '#ffd84a',
    'parrot_body': '#e8302a', 'parrot_wing': '#ffd23a', 'parrot_wing2': '#2a6ad8', 'parrot_tail': '#2a5ac8', 'parrot_face': '#fff4e8',
    'parrot_beak': '#f4eadc', 'parrot_beak_dk': '#2a2420', 'parrot_eye_white': '#ffffff', 'parrot_pupil': '#1a1020', 'parrot_star': '#ffd84a',
    'kite_a': '#ff3d8b', 'kite_b': '#ffffff', 'kite_c': '#ffd23a', 'kite_d': '#2ad8a0', 'kite_spar': '#6a4a2a', 'kite_string': '#3a2a1a',
    'kite_bow_a': '#3a8aff', 'kite_bow_b': '#ff7a2a', 'kite_eye_white': '#ffffff', 'kite_pupil': '#1a1020', 'kite_mouth': '#3a1020', 'kite_star': '#ffd84a',
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
    """Turn a finished character in the picture plane by its root (a turn baked into the mesh loses the outline)."""
    root.matrix_world = tr(0, 0, pivot_z + lift) @ rot_y(deg) @ tr(0, 0, -pivot_z)
    return root


def flat_ink(ob, k=0.0):
    ob['outline'] = k
    return ob


def stars(b, c, r=0.12, n=3):
    for k in range(n):
        a = TAU * k / n + 0.3
        b.part('star%d' % k, sphere(c + V(math.cos(a) * r, math.sin(a) * r * 0.4, 0), 0.03, seg=8, rows=6), 'star', subsurf=1, M=Matrix.Identity(4))


# ================================================================ SLOTH
def build_sloth(pose, t):
    s = 0.95
    lean = {'tell': 8, 'drop': -4, 'stun': -6}.get(pose, 0)
    sq = 0.4 if pose == 'flat' else 1.0
    M = rot_y(lean) @ scl(s * (1.3 if pose == 'flat' else 1.0), s, s * sq)
    b = E.Builder('sloth', pose, M)
    hang = pose in ('hang', 'tell', 'climb')
    bc = V(0.0, 0, 0.3)
    b.part('body', blob(bc, 0.24, 0.2, 0.25, seg=22, rows=12), 'fur')
    for k in range(5):
        flat_ink(b.part('shag%d' % k, ellipsoid(V(-0.16 + 0.08 * k, -0.14, 0.14 + 0.05 * (k % 2)), X * 0.04, Y * 0.03, Z * 0.09, 8, 6), 'fur2', subsurf=1))
    hc = V(0.04, 0, 0.6)
    b.part('head', blob(hc, 0.17, 0.16, 0.15, seg=20, rows=12), 'fur')
    # the face mask with its dark eye stripes and the smug smile
    fc = hc + V(0.0, -0.11, -0.01)
    flat_ink(b.part('face', ellipsoid(fc, X * 0.15, Y * 0.06, Z * 0.125, 18, 10), 'face'), 0.5)
    for side, sx in (('l', -1), ('r', 1)):
        flat_ink(b.part('patch_' + side, ellipsoid(fc + V(sx * 0.062, -0.048, 0.025), X * 0.06, Y * 0.02, Z * 0.03, 12, 6), 'patch', subsurf=1))
        shut = pose in ('flat', 'stuck')
        b.eye(side, fc + V(sx * 0.06, -0.058, 0.03), V(sx * 0.3, -1, 0.1), 0.034, pupil=0.6, lid=0.0 if pose in ('tell', 'drop') else 0.35,
              lid_mat='patch', shut=pose == 'ko' or shut, dazed=pose == 'stun', look=V(0.1, -1, 0))
    b.part('nose', sphere(fc + V(0.0, -0.06, -0.02), 0.022, 10, 6), 'nose', subsurf=1)
    b.part('mouth', tube([fc + V(-0.04, -0.06, -0.05), fc + V(0.0, -0.068, -0.062), fc + V(0.045, -0.06, -0.045)], 0.01, seg=6), 'mouth', subsurf=1)
    # long arms out to the sides (the sloth faces the camera): up to the branch when hanging (alternating in the
    # climb), flailing up in the drop, splayed when stuck
    for side, sx in (('l', -1), ('r', 1)):
        sh = V(sx * 0.17, -0.02, 0.46)
        if hang:
            reach = 0.08 * math.sin(TAU * t + (0 if sx < 0 else math.pi)) if pose == 'climb' else 0.0
            hand = V(sx * 0.22, -0.02, 0.9 + reach)
            claw_d = V(0, 0, 1)
        elif pose == 'drop':
            hand = V(sx * 0.36, -0.02, 0.78)
            claw_d = V(sx * 0.5, 0, 1).normalized()
        elif pose in ('stuck', 'flat', 'ko'):
            hand = V(sx * 0.4, -0.02, 0.1)
            claw_d = V(sx, 0, -0.3).normalized()
        else:
            hand = V(sx * 0.3, -0.04, 0.22)
            claw_d = V(sx * 0.3, 0, -1).normalized()
        elbow = (sh + hand) / 2 + V(sx * 0.07, -0.02, 0)
        b.part('arm_' + side, tube([sh, elbow, hand], 0.075, 0.06, seg=10), 'fur')
        for c in (-1, 0, 1):
            tip = hand + claw_d * 0.09 + V(0.025 * c, -0.01, 0)
            b.part('claw_%s%d' % (side, c + 1), tube([hand, (hand + tip) / 2 + V(0, -0.015, 0), tip], 0.014, 0.006, seg=6), 'claw', subsurf=1)
        foot = V(sx * 0.14, -0.04, 0.04) if not hang else V(sx * 0.12, -0.02, 0.08)
        b.part('leg_' + side, tube([V(sx * 0.1, 0, 0.16), foot], 0.05, 0.045, seg=8), 'fur')
    if pose in ('stun', 'stuck'):
        stars(b, V(0.04, 0, 0.88))
    return spin(b.root, 160, 0.3, 0.05) if pose == 'ko' else b.root


# ================================================================ SWIFT (sooty swift, hoverDart)
def build_swift(pose, t):
    tilt = {'aim': 20, 'dart': 6, 'recover': -18, 'stun': -18}.get(pose, -6)
    M = rot_y(tilt) @ scl(1.1, 1.1, 1.1)
    b = E.Builder('swift', pose, M)
    b.part('body', blob(V(0, 0, 0), 0.17, 0.09, 0.09, seg=20, rows=10), 'body')
    b.part('head', sphere(V(0.14, 0, 0.03), 0.085), 'body')
    flat_ink(b.part('throat', ellipsoid(V(0.17, -0.05, -0.01), X * 0.05, Y * 0.04, Z * 0.04, 12, 8), 'throat'), 0.3)
    b.part('beak', cone(V(0.22, 0, 0.02), V(0.27, 0, 0.01), 0.022, seg=8), 'beak', subsurf=1)
    c = V(0.17, -0.065, 0.05)
    b.eye('l', c, V(0.35, -1, 0.2), 0.045, pupil=0.55, lid=0.0 if pose in ('aim', 'dart') else 0.12, shut=pose == 'ko',
          dazed=pose in ('recover', 'stun'), look=V(0.8, -0.5, 0) if pose in ('aim', 'dart') else None)
    if pose in ('aim', 'dart'):
        b.brow('l', c, V(0.35, -1, 0.2), 0.045)
    b.part('tail', blob(V(-0.22, 0, 0.0), 0.09, 0.04, 0.03, seg=12, rows=6), 'wing')
    # long scythe wings
    if pose == 'hover':
        flap = 60 * math.cos(TAU * t)
    elif pose == 'return':
        flap = 35
    else:
        flap = {'aim': 70, 'dart': 8, 'recover': -45, 'stun': -45, 'ko': -50}[pose]
    sweep = 65 if pose == 'dart' else 30
    for side, sgn in (('far', 1), ('near', -1)):
        W = tr(V(0.0, sgn * 0.06, 0.05)) @ rot_z(sgn * sweep) @ rot_x(-sgn * flap)

        def wing(u, w, W=W, sgn=sgn):
            span = 0.4 * u
            chord = 0.1 * (1 - u) ** 0.7 + 0.015
            return W @ V(-span * 0.35 + (w - 0.3) * chord, sgn * span, 0.0)
        b.part('wing_' + side, sheet(wing, 8, 3, 0.014), 'wing')
    if pose in ('recover', 'stun'):
        stars(b, V(0.05, 0, 0.22), r=0.1)
    return spin(b.root, 165, 0.0) if pose == 'ko' else b.root


# ================================================================ PARROT (scarlet macaw)
def build_parrot(pose, t):
    tilt = {'swoop': 24, 'stun': -10}.get(pose, 0)
    M = rot_y(tilt) @ scl(1.05, 1.05, 1.05)
    b = E.Builder('parrot', pose, M)
    b.part('body', blob(V(0, 0, 0), 0.2, 0.11, 0.12, seg=20, rows=10), 'body')
    hc = V(0.2, 0, 0.08)
    b.part('head', sphere(hc, 0.1), 'body')
    flat_ink(b.part('face', ellipsoid(hc + V(0.03, -0.075, 0.0), X * 0.055, Y * 0.03, Z * 0.05, 12, 8), 'face'), 0.3)
    b.part('beak', tube([hc + V(0.08, 0, 0.02), hc + V(0.15, 0, -0.01), hc + V(0.14, 0, -0.07)], 0.045, 0.012, seg=10), 'beak')
    b.part('beak_low', tube([hc + V(0.07, 0, -0.03), hc + V(0.11, 0, -0.05)], 0.025, 0.012, seg=8), 'beak_dk', subsurf=1)
    b.eye('l', hc + V(0.03, -0.085, 0.03), V(0.35, -1, 0.2), 0.04, pupil=0.55, lid=0.1, shut=pose == 'ko', dazed=pose == 'stun',
          look=V(0.8, -0.5, -0.2) if pose == 'swoop' else None)
    if pose == 'swoop':
        b.brow('l', hc + V(0.03, -0.085, 0.03), V(0.35, -1, 0.2), 0.04)
    # the long blue tail
    for k, dz in enumerate((-0.02, 0.02)):
        b.part('tail%d' % k, tube([V(-0.18, 0, dz), V(-0.36, 0, dz - 0.04), V(-0.52, 0, dz - 0.09)], 0.05, 0.015, seg=8), 'tail')
    if pose == 'fly':
        flap = 50 * math.cos(TAU * t)
    else:
        flap = {'swoop': 25, 'stun': -55, 'ko': -60}[pose]
    sweep = 50 if pose == 'swoop' else 15
    for side, sgn in (('far', 1), ('near', -1)):
        W = tr(V(0.02, sgn * 0.08, 0.06)) @ rot_z(sgn * sweep) @ rot_x(-sgn * flap)

        def wing(u, w, W=W, sgn=sgn):
            span = 0.42 * u
            chord = 0.2 * (1 - 0.6 * u)
            return W @ V(0.06 - chord * w - 0.1 * u * u, sgn * span, 0.0)
        b.part('wing_' + side, sheet(wing, 6, 4, 0.02), 'wing')
        # the blue flight-feather band along the wing's trailing half
        def band(u, w, W=W, sgn=sgn):
            span = 0.42 * (0.45 + 0.55 * u)
            chord = 0.2 * (1 - 0.6 * (0.45 + 0.55 * u))
            return W @ V(0.06 - chord * (0.55 + 0.45 * w) - 0.1 * (0.45 + 0.55 * u) ** 2, sgn * span, 0.012 * sgn * 0)
        flat_ink(b.part('band_' + side, sheet(band, 5, 2, 0.024), 'wing2'), 0.4)
    if pose == 'stun':
        stars(b, V(0.15, 0, 0.3), r=0.12)
    return spin(b.root, 165, 0.0) if pose == 'ko' else b.root


# ================================================================ KITE
def build_kite(pose, t):
    tilt = {'swoop': 25, 'stun': -20}.get(pose, 6 * math.sin(TAU * t))
    b = E.Builder('kite', pose, rot_y(tilt))
    # a diamond sail in four coloured panels, seen face-on
    top, right, bot, left = V(0, 0, 0.36), V(0.24, 0, 0.0), V(0, 0, -0.36), V(-0.24, 0, 0.0)
    ctr = V(0, -0.01, 0.03)
    for k, (a, c, role) in enumerate(((top, right, 'a'), (right, bot, 'b'), (bot, left, 'c'), (left, top, 'b'))):
        bm = E.flat_poly([a, c, ctr], 0.025) if hasattr(E, 'flat_poly') else None
        b.part('panel%d' % k, xf(bm, Matrix.Identity(4)) if bm else sphere(ctr, 0.1), role, subsurf=0, smooth=False)
    b.part('spar_v', tube([top, bot], 0.012, seg=6), 'spar', subsurf=1)
    b.part('spar_h', tube([left, right], 0.012, seg=6), 'spar', subsurf=1)
    # a face on the sail
    for side, sx in (('l', -1), ('r', 1)):
        b.eye(side, V(sx * 0.07, -0.06, 0.08), V(0, -1, 0), 0.05, pupil=0.55, lid=0.0, shut=pose == 'ko', dazed=pose == 'stun',
              look=V(0.2, -1, -0.2) if pose == 'swoop' else V(0, -1, 0), lid_mat='a')
        if pose == 'swoop':
            b.brow(side, V(sx * 0.07, -0.06, 0.08), V(sx * 0.2, -1, 0), 0.045, angry=1.0)
    b.part('mouth', tube([V(-0.05, -0.05, -0.03), V(0.0, -0.055, -0.05), V(0.05, -0.05, -0.03)], 0.014, seg=6), 'mouth', subsurf=1)
    # the ribbon tail with bows, waving
    pts = []
    for k in range(7):
        u = k / 6
        pts.append(V(0.06 * math.sin(TAU * t * 1.0 + u * 4) + 0.02 * k, 0.0, -0.36 - 0.07 * k))
    b.part('string', tube(pts, 0.008, seg=5), 'string', subsurf=1)
    for k in (2, 4, 6):
        p = pts[k]
        for sx in (-1, 1):
            b.part('bow%d%d' % (k, sx), ellipsoid(p + V(sx * 0.035, -0.01, 0), X * 0.035, Y * 0.01, Z * 0.022, 8, 6), 'bow_a' if k % 4 else 'bow_b', subsurf=1)
    if pose == 'stun':
        stars(b, V(0, 0, 0.48), r=0.12)
    return spin(b.root, 160, 0.0) if pose == 'ko' else b.root


# ================================================================ PIRANHA (swimming, the br model)
def build_piranha(pose, t):
    P = {'ns': 1}
    b = E.Builder('piranha', pose, rot_y(-3 * math.sin(TAU * t)) if pose == 'swim' else Matrix.Identity(4))
    E.build_piranha(b, 'up' if pose == 'swim' else 'ko', t, P)
    if pose == 'ko':
        return spin(b.root, 165, 0.0)
    return b.root


# ================================================================ QUATI (the br coati) and the keeper
def build_quati(pose, t, kind='quati'):
    src = {'idle': 'walk', 'grab': 'walk', 'run': 'flee', 'caught': 'stun'}[pose]
    P = dict(E.COATI[src])
    tt = t if pose in ('idle', 'run') else 0.25
    if pose == 'idle':
        P['feet'] = 'stand'; P['lean'] = -4; P['mouth'] = 'grin'
    if pose == 'grab':
        P['lean'] = 10; P['mouth'] = 'grin'; P['lid'] = 0.0
    bob = 0.012 * (1 + math.sin(2 * TAU * tt)) if pose in ('run',) else 0.0
    M = E.pose_matrix(P, tt, src, bob)
    b = E.Builder(kind, pose, M)
    E.build_coati(b, src, tt, P)
    nod = (6 if pose == 'run' else 4) * math.sin(TAU * tt) if pose in ('run',) else 0.0
    MH = b.M @ about(V(0.26, 0, 0.42), rot_y(nod))
    hc = V(0.36, 0, 0.47)
    if kind == 'quati':
        # the bandit mask over the eyes, the satchel of stamps on his back
        mask = []
        for k in range(9):
            az = -1.5 + 1.1 * k / 8
            p, n = on_ellipsoid(hc, (0.152, 0.132, 0.132), az, 0.24)
            mask.append(p + n * 0.012)
        b.part('mask', tube(mask, 0.035, seg=8), 'mask', subsurf=1, M=MH)
        bag_c = V(-0.12, -0.15, 0.56)
        b.part('bag', xf(box_bm((0.24, 0.1, 0.18), bevel=0.04, segments=2), tr(bag_c) @ rot_y(-10)), 'bag', subsurf=1)
        b.part('strap', tube([bag_c + V(0.1, 0, 0.08), V(0.12, -0.16, 0.5), V(0.2, -0.15, 0.36)], 0.015, seg=6), 'strap', subsurf=1)
        if pose != 'caught':
            for k, role in enumerate(('stamp_a', 'stamp_b', 'stamp_c')):
                b.part('stamp%d' % k, xf(box_bm((0.06, 0.02, 0.07), bevel=0.01, segments=1), tr(bag_c + V(-0.06 + 0.06 * k, -0.02, 0.12)) @ rot_y(-15 + 15 * k)), role, subsurf=0)
        else:
            for k, role in enumerate(('stamp_a', 'stamp_b', 'stamp_c')):
                b.part('stamp%d' % k, xf(box_bm((0.06, 0.02, 0.07), bevel=0.01, segments=1), tr(V(-0.25 + 0.25 * k, -0.2, 0.95 + 0.06 * (k % 2))) @ rot_y(30 * k - 20)), role, subsurf=0, M=Matrix.Identity(4))
            stars(b, V(0.36, 0, 0.75))
        if pose == 'grab':
            # a paw raised, reaching
            b.part('reach', tube([V(0.22, -0.12, 0.34), V(0.4, -0.16, 0.42), V(0.52, -0.16, 0.5)], 0.035, 0.03, seg=8), 'fur_dark', subsurf=1)
    else:
        # the keeper's straw hat with a pink band
        b.part('brim', ellipsoid(hc + V(-0.02, 0, 0.12), X * 0.24, Y * 0.22, Z * 0.025, 20, 6), 'hat', M=MH)
        b.part('crown', blob(hc + V(-0.02, 0, 0.18), 0.12, 0.11, 0.08, seg=14, rows=8), 'hat_dk', M=MH)
        flat_ink(b.part('band', ellipsoid(hc + V(-0.02, 0, 0.145), X * 0.122, Y * 0.112, Z * 0.025, 14, 6), 'band', subsurf=1, M=MH), 0.3)
    return b.root


BUILD = {'sloth': build_sloth, 'swift': build_swift, 'parrot': build_parrot, 'kite': build_kite, 'piranha': build_piranha,
         'quati': build_quati, 'quatiKeeper': lambda pose, t: build_quati('idle', t, 'quatiKeeper')}


def build(kind, pose, t=0.0):
    clear(kind)
    return BUILD[kind](pose, t)
