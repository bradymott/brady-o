# mz_extras: the rebuilt Mozambique's new cast (29_tour_mz_levels.js), rendered into their own atlas `mz_x` (the live
# `mz` atlas is never re-packed). Wiring (cfg.atlas = 'mz_x', the sprite names below) is listed in the art handoff.
#   dungBeetle   an emerald dung beetle (pusher): walks, braces against its ball, flips on its back
#                                                            walk(t) push(t) stun flat ko             feet 20 px
#   pangolin     a scaly pangolin (curlShield)               walk(t) curl ball(t) uncurl stun flat ko feet 22 px
#   chameleon    a chameleon on a twig (tongue; the game shifts its hue)   idle(t) tell lash stun flat ko feet 20 px
#   moleRat      a pink naked mole-rat (burrower)            under tell pop exposed dig stun flat ko  feet 22 px
#   fruitBat     a straw-coloured fruit bat                  fly(t) swoop stun ko                      centre 14 px
#   ostrich      AVESTRUZ, 4-1's racing ostrich in a number bib    idle(t) run(t) tired             feet 56 px
#   hornbill     the hornbill keeping the Banca da Gorongosa       idle(t)                          feet 48 px
# Built with the ec_enemies.py part kit (materials named <kind>_<part>, colours below).
#   W=<work>/mz_x; JOB=enemies:mz_extras LOOK=toon OUT=$W NAME=mz_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/mz_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ec_enemies as E
from ec_enemies import (TAU, X, Y, Z, V, tr, scl, rot_x, rot_y, rot_z, about, perp_frame, ellipsoid, sphere, blob, tube, cone, sheet,
                        xf, box_bm, on_ellipsoid)

PX = 28.1
KINDS = ['dungBeetle', 'pangolin', 'chameleon', 'moleRat', 'fruitBat', 'ostrich', 'hornbill']
POSES = {
    'dungBeetle': ['walk', 'push', 'stun', 'flat', 'ko'],
    'pangolin': ['walk', 'curl', 'ball', 'uncurl', 'stun', 'flat', 'ko'],
    'chameleon': ['idle', 'tell', 'lash', 'stun', 'flat', 'ko'],
    'moleRat': ['under', 'tell', 'pop', 'exposed', 'dig', 'stun', 'flat', 'ko'],
    'fruitBat': ['fly', 'swoop', 'stun', 'ko'],
    'ostrich': ['idle', 'run', 'tired'],
    'hornbill': ['idle'],
}
FRAMES = {('dungBeetle', 'push'): (6, 10), ('pangolin', 'ball'): (6, 14), ('chameleon', 'idle'): (4, 4), ('ostrich', 'run'): (8, 16),
          ('ostrich', 'idle'): (4, 6), ('hornbill', 'idle'): (4, 4)}
ORIGIN = {'dungBeetle': 'feet', 'pangolin': 'feet', 'chameleon': 'feet', 'moleRat': 'feet', 'fruitBat': 'centre', 'ostrich': 'feet', 'hornbill': 'feet'}
HEIGHT = {'dungBeetle': 0.5, 'pangolin': 0.62, 'chameleon': 0.6, 'moleRat': 0.62, 'ostrich': 1.05, 'hornbill': 0.9}
SIZE = {'fruitBat': 0.6}

E.COLORS.update({
    'dungBeetle_shell': '#1aa04a', 'dungBeetle_shell_hi': '#6ae86a', 'dungBeetle_body': '#14502a', 'dungBeetle_leg': '#123a1e',
    'dungBeetle_horn': '#0e2e18', 'dungBeetle_eye_white': '#ffffff', 'dungBeetle_pupil': '#1a1020', 'dungBeetle_star': '#ffd84a',
    'pangolin_scale': '#a8824e', 'pangolin_scale2': '#8a6a3a', 'pangolin_skin': '#d8b890', 'pangolin_body': '#a8824e', 'pangolin_nose': '#3a2a1e',
    'pangolin_claw': '#3a2a1e', 'pangolin_eye_white': '#ffffff', 'pangolin_pupil': '#1a1020', 'pangolin_star': '#ffd84a',
    'chameleon_body': '#4aa84a', 'chameleon_body2': '#3a8a3a', 'chameleon_stripe': '#e8e070', 'chameleon_tongue': '#ff6a8a', 'chameleon_tip': '#ff3a6a',
    'chameleon_twig': '#7a5a34', 'chameleon_eye_white': '#ffffff', 'chameleon_pupil': '#1a1020', 'chameleon_turret': '#3a8a3a',
    'chameleon_mouth': '#1a4a1a', 'chameleon_star': '#ffd84a',
    'moleRat_skin': '#f0b8a8', 'moleRat_skin2': '#d8988a', 'moleRat_tooth': '#fff8e8', 'moleRat_nose': '#c87a7a', 'moleRat_body': '#f0b8a8',
    'moleRat_dirt': '#a07850', 'moleRat_dirt2': '#8a6440', 'moleRat_eye_white': '#ffffff', 'moleRat_pupil': '#1a1020', 'moleRat_star': '#ffd84a',
    'fruitBat_body': '#c89a5a', 'fruitBat_head': '#b8884a', 'fruitBat_wing': '#7a4a32', 'fruitBat_wing2': '#5e3828', 'fruitBat_ear': '#4a2a1e',
    'fruitBat_nose': '#2a1a14', 'fruitBat_eye_white': '#ffffff', 'fruitBat_pupil': '#1a1020', 'fruitBat_star': '#ffd84a',
    'ostrich_body': '#2a2a30', 'ostrich_plume': '#f4ecd8', 'ostrich_neck': '#e8c0b0', 'ostrich_leg': '#e8b0a0', 'ostrich_beak': '#e8a050',
    'ostrich_bib': '#ffffff', 'ostrich_num': '#c8287a', 'ostrich_eye_white': '#ffffff', 'ostrich_pupil': '#1a1020', 'ostrich_sweat': '#9ad8ff',
    'ostrich_lid': '#e8c0b0',
    'hornbill_body': '#2a2a34', 'hornbill_belly': '#f4ecd8', 'hornbill_beak': '#ffd23a', 'hornbill_casque': '#e8422a', 'hornbill_eye_white': '#ffffff',
    'hornbill_pupil': '#1a1020', 'hornbill_skin': '#3a6ad8', 'hornbill_leg': '#3a3a44', 'hornbill_apron': '#1aa8a8', 'hornbill_apron2': '#ffd23a',
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
    root.matrix_world = tr(0, 0, pivot_z + lift) @ rot_y(deg) @ tr(0, 0, -pivot_z)
    return root


def ink(ob, k=0.0):
    ob['outline'] = k
    return ob


def stars(b, c, r=0.12, n=3):
    for k in range(n):
        a = TAU * k / n + 0.3
        b.part('star%d' % k, sphere(c + V(math.cos(a) * r, math.sin(a) * r * 0.4, 0), 0.03, seg=8, rows=6), 'star', subsurf=1, M=Matrix.Identity(4))


def legs6(b, t, z0, xs, walk, mat, reach=0.18, push=False):
    for side, sy in (('l', -1), ('r', 1)):
        for k, x in enumerate(xs):
            ph = TAU * t + k * 2.1 + (0 if sy < 0 else math.pi)
            lift = 0.04 * max(0.0, math.sin(ph)) if walk else 0.0
            dx = 0.04 * math.cos(ph) if walk else 0.0
            if push and k == len(xs) - 1:
                dx -= 0.08
            hip = V(x, sy * 0.1, z0)
            knee = V(x + dx * 0.5, sy * (0.1 + reach * 0.6), z0 + 0.06 + lift)
            foot = V(x + dx + (0.05 if k == 0 else -0.04 * k), sy * (0.1 + reach), 0.015 + lift * 0.4)
            b.part('leg_%s%d' % (side, k), tube([hip, knee, foot], 0.022, 0.014, seg=6), mat, subsurf=1)


# ================================================================ DUNG BEETLE
def build_dungBeetle(pose, t):
    lean = {'push': 16, 'stun': -6}.get(pose, 0)
    M = rot_y(lean) @ scl(1.0, 1.0, 0.4 if pose == 'flat' else 1.0)
    b = E.Builder('dungBeetle', pose, M)
    b.part('body', blob(V(0.0, 0, 0.17), 0.24, 0.17, 0.12, seg=22, rows=10), 'body')
    b.part('shell', ellipsoid(V(-0.04, 0, 0.2), X * 0.24, Y * 0.18, Z * 0.15, seg=24, rows=10, phi1=math.radians(85)), 'shell')
    ink(b.part('shine', ellipsoid(V(-0.1, -0.12, 0.3), X * 0.07, Y * 0.02, Z * 0.035, 10, 6), 'shell_hi', subsurf=1))
    ink(b.part('seam', tube([V(-0.27, -0.0, 0.25), V(-0.04, -0.0, 0.355), V(0.17, 0.0, 0.29)], 0.01, seg=5), 'body', subsurf=1), 0.3)
    hc = V(0.24, 0, 0.16)
    b.part('head', blob(hc, 0.09, 0.11, 0.07, seg=16, rows=8), 'body')
    b.part('horn', tube([hc + V(0.05, 0, 0.03), hc + V(0.12, 0, 0.09), hc + V(0.13, 0, 0.15)], 0.025, 0.01, seg=6), 'horn', subsurf=1)
    for side, sy in (('l', -1), ('r', 1)):
        b.eye(side, hc + V(0.04, sy * 0.075, 0.035), V(0.6, sy, 0.3), 0.042, pupil=0.6, lid=0.0 if pose == 'push' else 0.1, lid_mat='body',
              dazed=pose == 'stun', shut='x' if pose == 'ko' else ('lid' if pose == 'flat' else None), look=V(0.6, -0.8, 0))
    legs6(b, t, 0.12, (0.13, 0.0, -0.13), pose in ('walk', 'push'), 'leg', push=pose == 'push')
    if pose == 'stun':
        stars(b, V(0.05, 0, 0.45))
    return spin(b.root, 180, 0.2, 0.0) if pose == 'ko' else b.root     # flipped on its back, legs up


# ================================================================ PANGOLIN
def pangolin_ball(b, t, roll=True, open_=0.0):
    c = V(0, 0, 0.3)
    b.part('ball', sphere(c, 0.27, 22, 14), 'scale2')
    a0 = TAU * t * (1 if roll else 0)
    for r, (el, n) in enumerate(((0.0, 10), (0.5, 9), (-0.5, 9), (1.0, 6), (-1.0, 6))):
        for k in range(n):
            az = TAU * k / n + a0 + r * 0.3
            d = Vector((math.cos(el) * math.cos(az), math.sin(el), math.cos(el) * math.sin(az)))
            p = c + d * 0.27
            ax, ay = perp_frame(d)
            b.part('sc%d_%d' % (r, k), ellipsoid(p + d * 0.01, ax * 0.075, ay * 0.06, d * 0.03, 10, 6), 'scale' if (k + r) % 2 else 'scale2', subsurf=1)
    if open_ > 0:
        b.part('peek', blob(c + V(0.2, -0.08, -0.05), 0.07, 0.06, 0.06, 12, 8), 'skin')
        b.eye('l', c + V(0.23, -0.14, -0.02), V(0.6, -1, 0), 0.035, pupil=0.6, lid=0.3, lid_mat='skin')


def build_pangolin(pose, t):
    M = scl(1.0, 1.0, 0.4 if pose == 'flat' else 1.0) @ rot_y({'stun': -6}.get(pose, 0))
    b = E.Builder('pangolin', pose, M)
    if pose in ('curl', 'ball'):
        pangolin_ball(b, t, roll=pose == 'ball')
        return b.root
    if pose == 'uncurl':
        pangolin_ball(b, 0.0, roll=False, open_=1.0)
        return b.root
    # walking pangolin: an arched body of overlapping scale rows, a long tail, a small pale head
    for k in range(7):
        x = 0.24 - 0.11 * k
        z = 0.24 + 0.06 * math.sin(math.pi * (k + 0.5) / 7)
        r = 0.16 - 0.006 * abs(k - 3)
        b.part('seg%d' % k, ellipsoid(V(x, 0, z), X * 0.09, Y * r, Z * r, 16, 10, phi1=math.radians(110)), 'scale' if k % 2 else 'scale2')
    b.part('belly', blob(V(-0.08, 0, 0.17), 0.36, 0.12, 0.09, 18, 10), 'skin')
    tail = [V(-0.42, 0, 0.22), V(-0.6, 0, 0.15), V(-0.74, 0, 0.08), V(-0.82, 0, 0.04)]
    for k in range(3):
        b.part('tail%d' % k, tube([tail[k], tail[k + 1]], 0.11 - 0.03 * k, 0.09 - 0.03 * k, seg=10), 'scale' if k % 2 else 'scale2')
    hc = V(0.38, 0, 0.2)
    b.part('head', blob(hc, 0.11, 0.08, 0.08, 16, 10), 'skin')
    b.part('snout', tube([hc + V(0.07, 0, -0.01), hc + V(0.17, 0, -0.04)], 0.045, 0.025, seg=8), 'skin', subsurf=1)
    b.part('nose', sphere(hc + V(0.18, 0, -0.045), 0.022, 8, 6), 'nose', subsurf=1)
    b.eye('l', hc + V(0.05, -0.065, 0.03), V(0.4, -1, 0.2), 0.035, pupil=0.6, lid=0.25, lid_mat='skin', dazed=pose == 'stun',
          shut='x' if pose == 'ko' else ('lid' if pose == 'flat' else None))
    for k, (x, sy) in enumerate(((0.2, -1), (0.2, 1), (-0.22, -1), (-0.22, 1))):
        ph = TAU * t + (0 if k in (0, 3) else math.pi)
        dx = 0.05 * math.sin(ph) if pose == 'walk' else 0.0
        lift = 0.04 * max(0.0, math.cos(ph)) if pose == 'walk' else 0.0
        b.part('leg%d' % k, tube([V(x, sy * 0.09, 0.14), V(x + dx, sy * 0.1, 0.03 + lift)], 0.04, 0.035, seg=8), 'skin', subsurf=1)
        b.part('claw%d' % k, ellipsoid(V(x + dx + 0.04, sy * 0.1, 0.02 + lift), X * 0.045, Y * 0.025, Z * 0.018, 8, 6), 'claw', subsurf=1)
    if pose == 'stun':
        stars(b, V(0.3, 0, 0.5))
    return spin(b.root, 165, 0.22, 0.05) if pose == 'ko' else b.root


# ================================================================ CHAMELEON
def build_chameleon(pose, t):
    sway = 2 * math.sin(TAU * t) if pose == 'idle' else 0
    M = rot_y(sway + {'stun': -6, 'lash': 8}.get(pose, 0)) @ scl(1.0, 1.0, 0.4 if pose == 'flat' else 1.0)
    b = E.Builder('chameleon', pose, M)
    # a leaf-shaped body with a crest, a curled tail, a helmet head with a turret eye
    pts = [(-0.24, 0.2), (-0.12, 0.34), (0.06, 0.38), (0.2, 0.32), (0.26, 0.2), (0.14, 0.12), (-0.08, 0.1), (-0.22, 0.14)]
    b.part('body', blob(V(0.0, 0, 0.24), 0.25, 0.12, 0.13, 20, 12), 'body')
    ink(b.part('stripe', ellipsoid(V(0.0, -0.1, 0.2), X * 0.18, Y * 0.03, Z * 0.025, 14, 6), 'stripe', subsurf=1))
    for k in range(5):
        b.part('crest%d' % k, cone(V(-0.15 + 0.07 * k, 0, 0.35 + 0.02 * math.sin(k)), V(-0.17 + 0.07 * k, 0, 0.41), 0.025, flat=0.4, seg=6), 'body2', subsurf=1)
    hc = V(0.27, 0, 0.27)
    b.part('head', blob(hc, 0.12, 0.09, 0.1, 16, 10), 'body')
    b.part('casque', cone(hc + V(-0.04, 0, 0.06), hc + V(-0.12, 0, 0.16), 0.07, flat=0.4, seg=8), 'body2')
    # the turret eye: a cone with the eye at its tip, swivelling in the tell
    look = {'tell': V(-0.6, -0.8, 0.3), 'lash': V(0.9, -0.4, 0.0)}.get(pose, V(0.5, -0.85, 0.0))
    turret = hc + V(0.02, -0.08, 0.02)
    b.part('turret', blob(turret, 0.05, 0.035, 0.05, 12, 8), 'turret')
    b.eye('l', turret + V(0.0, -0.04, 0.0), V(0.3, -1, 0.1), 0.04, pupil=0.45, lid=0.0, look=look, dazed=pose == 'stun',
          shut='x' if pose == 'ko' else ('lid' if pose == 'flat' else None))
    if pose == 'lash':
        mouth = hc + V(0.12, 0, -0.02)
        b.part('tongue', tube([mouth, mouth + V(0.3, 0, 0.0), mouth + V(0.6, 0, 0.01)], 0.022, seg=8), 'tongue', subsurf=1)
        b.part('tip', sphere(mouth + V(0.62, 0, 0.01), 0.05, 12, 8), 'tip', subsurf=1)
    else:
        b.part('mouth', tube([hc + V(0.06, -0.08, -0.04), hc + V(0.12, -0.05, -0.03)], 0.009, seg=5), 'mouth', subsurf=1)
    # curled tail
    tail = []
    for k in range(12):
        u = k / 11
        if u < 0.5:
            tail.append(V(-0.24 - 0.3 * u, 0, 0.2 - 0.12 * u))
        else:
            a = (u - 0.5) * 2 * TAU * 0.85
            tail.append(V(-0.42 + 0.07 * math.sin(a), 0, 0.08 + 0.07 * (1 - math.cos(a)) * 0.6))
    b.part('tail', tube(tail, 0.04, 0.015, seg=8), 'body')
    # gripping legs on a little twig
    b.part('twig', tube([V(-0.4, 0.05, 0.03), V(0.4, 0.05, 0.03)], 0.03, seg=8), 'twig', subsurf=1)
    for k, (x, sy) in enumerate(((0.16, -1), (0.16, 1), (-0.12, -1), (-0.12, 1))):
        b.part('leg%d' % k, tube([V(x, sy * 0.07, 0.17), V(x + 0.04, sy * 0.08, 0.1), V(x + 0.02, sy * 0.06, 0.04)], 0.025, 0.02, seg=6), 'body2', subsurf=1)
    if pose == 'stun':
        stars(b, V(0.15, 0, 0.55))
    return spin(b.root, 165, 0.2, 0.04) if pose == 'ko' else b.root


# ================================================================ MOLE-RAT
def build_moleRat(pose, t):
    b = E.Builder('moleRat', pose, scl(1.0, 1.0, 0.4 if pose == 'flat' else 1.0))
    if pose in ('under', 'tell', 'dig'):
        # a mound of dirt (the 'under' hitbox is only 8 px tall); in the tell the nose and teeth poke out, digging: the tail end
        b.part('mound', blob(V(0, 0, 0.0), 0.3, 0.2, 0.14 if pose == 'under' else 0.18, 18, 10), 'dirt')
        for k in range(5):
            b.part('clod%d' % k, sphere(V(-0.25 + 0.12 * k, -0.12, 0.06 + 0.04 * (k % 2)), 0.05, 8, 6), 'dirt2', subsurf=1)
        if pose == 'tell':
            b.part('snout', blob(V(0.04, -0.03, 0.16), 0.08, 0.07, 0.07, 12, 8), 'skin')
            b.part('tooth', box_bm((0.02, 0.02, 0.05)) if False else ellipsoid(V(0.09, -0.06, 0.13), X * 0.015, Y * 0.02, Z * 0.035, 8, 6), 'tooth', subsurf=1)
        if pose == 'dig':
            b.part('rump', blob(V(-0.02, 0, 0.18), 0.12, 0.1, 0.09, 12, 8), 'skin')
            b.part('tail', tube([V(-0.12, 0, 0.2), V(-0.2, 0, 0.27)], 0.02, 0.01, seg=6), 'skin2', subsurf=1)
        return b.root
    up = pose == 'pop'
    M = rot_y(-60 if up else {'stun': -6}.get(pose, 0)) if up else rot_y({'stun': -6}.get(pose, 0))
    if up:
        b = E.Builder('moleRat', pose, Matrix.Identity(4))
    else:
        b = E.Builder('moleRat', pose, M @ scl(1.0, 1.0, 0.4 if pose == 'flat' else 1.0))
    bc = V(0.0, 0, 0.22)
    b.part('body', blob(bc, 0.27, 0.17, 0.18, 20, 12), 'skin')
    for k in range(4):
        ink(b.part('wrinkle%d' % k, tube([V(-0.15 + 0.1 * k, -0.15, 0.32), V(-0.13 + 0.1 * k, -0.17, 0.2), V(-0.15 + 0.1 * k, -0.15, 0.1)], 0.01, seg=5), 'skin2', subsurf=1), 0.2)
    hc = V(0.25, 0, 0.24)
    b.part('head', blob(hc, 0.13, 0.12, 0.12, 16, 10), 'skin')
    b.part('nose', blob(hc + V(0.12, 0, -0.01), 0.04, 0.05, 0.035, 10, 6), 'nose', subsurf=1)
    for k, sy in enumerate((-0.025, 0.025)):
        b.part('tooth%d' % k, xf(box_bm((0.03, 0.022, 0.07), bevel=0.008, segments=2), tr(hc + V(0.11, sy - 0.03, -0.1))), 'tooth', subsurf=1)
    b.eye('l', hc + V(0.06, -0.09, 0.05), V(0.4, -1, 0.3), 0.026, pupil=0.7, lid=0.4 if pose == 'exposed' else 0.1, lid_mat='skin',
          dazed=pose == 'stun', shut='x' if pose == 'ko' else ('lid' if pose == 'flat' else None))
    for k, (x, sy) in enumerate(((0.16, -1), (0.16, 1), (-0.16, -1), (-0.16, 1))):
        b.part('leg%d' % k, tube([V(x, sy * 0.1, 0.1), V(x + 0.03, sy * 0.11, 0.02)], 0.035, 0.03, seg=8), 'skin2', subsurf=1)
    b.part('tail', tube([V(-0.25, 0, 0.18), V(-0.36, 0, 0.12)], 0.02, 0.01, seg=6), 'skin2', subsurf=1)
    if up:
        for k in range(6):
            a = math.pi * k / 5
            b.part('spray%d' % k, sphere(V(-0.25 + math.sin(a) * 0.12, -0.1, 0.25 + math.cos(a) * 0.32), 0.05, 8, 6), 'dirt', subsurf=1, M=Matrix.Identity(4))
        return spin(b.root, -70, 0.2, 0.05)
    if pose == 'stun':
        stars(b, V(0.15, 0, 0.5))
    return spin(b.root, 165, 0.2, 0.04) if pose == 'ko' else b.root


# ================================================================ FRUIT BAT
def build_fruitBat(pose, t):
    tilt = {'swoop': 22, 'stun': -10}.get(pose, 0)
    b = E.Builder('fruitBat', pose, rot_y(tilt))
    b.part('body', blob(V(0, 0, -0.02), 0.11, 0.1, 0.14, 16, 10), 'body')
    hc = V(0.08, 0, 0.13)
    b.part('head', blob(hc, 0.1, 0.09, 0.085, 16, 10), 'head')
    b.part('muzzle', tube([hc + V(0.05, 0, -0.01), hc + V(0.13, 0, -0.03)], 0.045, 0.03, seg=10), 'head', subsurf=1)
    b.part('nose', sphere(hc + V(0.14, 0, -0.025), 0.018, 8, 6), 'nose', subsurf=1)
    for side, sy in (('l', -1), ('r', 1)):
        b.part('ear_' + side, cone(hc + V(-0.02, sy * 0.05, 0.06), hc + V(-0.03, sy * 0.06, 0.14), 0.025, flat=0.5, seg=6), 'ear', subsurf=1)
    b.eye('l', hc + V(0.06, -0.06, 0.03), V(0.4, -1, 0.2), 0.035, pupil=0.62, lid=0.1, lid_mat='head', dazed=pose == 'stun',
          shut='x' if pose == 'ko' else None, look=V(0.7, -0.6, -0.2) if pose == 'swoop' else None)
    flap = 15 + 45 * math.cos(TAU * t) if pose == 'fly' else {'swoop': 30, 'stun': -45, 'ko': -50}[pose]
    sweep = 45 if pose == 'swoop' else 10
    for side, sgn in (('far', 1), ('near', -1)):
        W = tr(V(0.0, sgn * 0.08, 0.04)) @ rot_z(sgn * sweep) @ rot_x(-sgn * flap)

        def wing(u, w, W=W, sgn=sgn):
            span = 0.5 * u
            scal = 0.035 * math.sin(math.pi * u * 3) * w
            return W @ V(0.06 - (0.28 * (1 - 0.45 * u)) * w - scal, sgn * span, 0.0)
        b.part('wing_' + side, sheet(wing, 8, 3, 0.012), 'wing' if sgn < 0 else 'wing2', subsurf=1)
    if pose == 'stun':
        stars(b, V(0.05, 0, 0.32), r=0.1)
    return spin(b.root, 165, 0.0) if pose == 'ko' else b.root


# ================================================================ OSTRICH (the race rival) and the HORNBILL keeper
def build_ostrich(pose, t):
    run = pose == 'run'
    lean = 22 if run else (8 if pose == 'tired' else 2)
    bob = 0.05 * abs(math.sin(TAU * t)) if run else 0.0
    b = E.Builder('ostrich', pose, tr(0, 0, bob))
    Mb = tr(0, 0, 0.0) @ about(V(0, 0, 0.75), rot_y(lean))
    bc = V(-0.05, 0, 0.9)
    b.part('body', blob(bc, 0.36, 0.26, 0.24, 22, 12), 'body', M=Mb)
    for k in range(5):
        b.part('plume%d' % k, blob(bc + V(-0.32 + 0.03 * k, 0, 0.06 + 0.04 * k), 0.12, 0.1, 0.06, 12, 8), 'plume', M=Mb)
    for side, sy in (('l', -1), ('r', 1)):
        flap = 30 * math.sin(TAU * t) if run else (-20 if pose == 'tired' else 0)
        b.part('wing_' + side, xf(blob((0, 0, 0), 0.2, 0.05, 0.1, 14, 8), tr(bc + V(0.0, sy * 0.24, 0.05)) @ rot_x(sy * flap) @ rot_y(20)), 'plume', M=Mb)
    # the racing bib with a number
    bib_c = bc + V(0.24, -0.16, -0.02)
    b.part('bib', xf(box_bm((0.05, 0.22, 0.2), bevel=0.02, segments=2), tr(bib_c) @ rot_z(-35)), 'bib', subsurf=1, M=Mb)
    for k, (dz, h, dx) in enumerate(((0.05, 0.03, 0.0), (0.0, 0.1, 0.03), (-0.05, 0.03, 0.0))):
        pass
    b.part('num7a', xf(box_bm((0.02, 0.08, 0.025), bevel=0.0), tr(bib_c + V(0.03, -0.02, 0.05)) @ rot_z(-35)), 'num', subsurf=0, M=Mb)
    b.part('num7b', xf(box_bm((0.02, 0.025, 0.12), bevel=0.0), tr(bib_c + V(0.03, -0.035, -0.0)) @ rot_z(-35) @ rot_x(-20)), 'num', subsurf=0, M=Mb)
    # neck and head
    neck_top = V(0.32, 0, 1.55) if not run else V(0.45, 0, 1.42)
    if pose == 'tired':
        neck_top = V(0.45, 0, 1.25)
    p0 = bc + V(0.26, 0, 0.12)
    neck = [p0, (p0 + neck_top) / 2 + V(0.06, 0, 0), neck_top]
    b.part('neck', tube(neck, 0.075, 0.055, seg=10), 'neck', M=Mb)
    hc = neck_top + V(0.04, 0, 0.06)
    b.part('head', blob(hc, 0.09, 0.08, 0.075, 14, 10), 'neck', M=Mb)
    b.part('beak', tube([hc + V(0.07, 0, -0.01), hc + V(0.17, 0, -0.03)], 0.04, 0.015, seg=8), 'beak', subsurf=1, M=Mb)
    b.eye('l', hc + V(0.03, -0.06, 0.03), V(0.4, -1, 0.2), 0.045, pupil=0.55, lid=0.55 if pose == 'tired' else 0.1, lid_mat='lid', M=Mb,
          look=V(0.8, -0.5, 0.0))
    if pose == 'tired':
        for k in range(2):
            b.part('sweat%d' % k, blob(hc + V(-0.06 - 0.06 * k, -0.08, 0.1 + 0.05 * k), 0.025, 0.02, 0.04, 8, 6), 'sweat', subsurf=1, M=Mb)
    # the long legs (a running stride, or standing)
    for side, sy, ph in (('l', -1, 0.0), ('r', 1, math.pi)):
        hip = V(0.0, sy * 0.1, 0.72)
        if run:
            a = TAU * t + ph
            foot = V(0.32 * math.sin(a), sy * 0.1, 0.04 + 0.18 * max(0.0, math.cos(a)))
            knee = V(0.1 + 0.12 * math.sin(a + 0.6), sy * 0.1, 0.42 + 0.08 * max(0.0, math.cos(a)))
        else:
            foot = V(0.06 * sy, sy * 0.1, 0.04)
            knee = V(0.12 if pose == 'tired' else 0.08, sy * 0.1, 0.38)
        b.part('leg_' + side, tube([hip, knee, foot], 0.04, 0.03, seg=8), 'leg', M=Matrix.Identity(4))
        b.part('foot_' + side, ellipsoid(foot + V(0.06, 0, -0.015), X * 0.08, Y * 0.04, Z * 0.025, 10, 6), 'leg', subsurf=1, M=Matrix.Identity(4))
    return b.root


def build_hornbill(pose, t):
    bob = 0.015 * math.sin(TAU * t)
    b = E.Builder('hornbill', pose, tr(0, 0, bob))
    bc = V(0.0, 0, 0.42)
    b.part('body', blob(bc, 0.22, 0.2, 0.3, 20, 12), 'body')
    ink(b.part('belly', ellipsoid(bc + V(0.08, -0.09, -0.04), X * 0.12, Y * 0.12, Z * 0.2, 16, 10), 'belly'), 0.4)
    # a shop apron (teal with a yellow pocket)
    b.part('apron', xf(box_bm((0.04, 0.26, 0.26), bevel=0.03, segments=2), tr(bc + V(0.2, -0.04, -0.1)) @ rot_z(-25)), 'apron', subsurf=1)
    b.part('pocket', xf(box_bm((0.02, 0.1, 0.08), bevel=0.01, segments=1), tr(bc + V(0.24, -0.1, -0.16)) @ rot_z(-25)), 'apron2', subsurf=0)
    hc = V(0.06, 0, 0.84)
    b.part('head', sphere(hc, 0.13), 'body')
    ink(b.part('skin', ellipsoid(hc + V(0.06, -0.09, 0.0), X * 0.06, Y * 0.03, Z * 0.06, 12, 8), 'skin', subsurf=1), 0.3)
    nod = 4 * math.sin(TAU * t)
    MB = about(hc, rot_y(nod))
    b.part('beak', tube([hc + V(0.1, 0, 0.0), hc + V(0.3, 0, -0.06), hc + V(0.42, 0, -0.16)], 0.06, 0.015, seg=10, radii=[0.07, 0.05, 0.015]), 'beak', M=MB)
    b.part('casque', tube([hc + V(0.08, 0, 0.08), hc + V(0.22, 0, 0.06), hc + V(0.3, 0, 0.0)], 0.045, 0.015, seg=8), 'casque', M=MB)
    b.eye('l', hc + V(0.05, -0.1, 0.03), V(0.4, -1, 0.2), 0.05, pupil=0.55, lid=0.15, lid_mat='body')
    for side, sy in (('l', -1), ('r', 1)):
        b.part('leg_' + side, tube([V(0.0, sy * 0.08, 0.16), V(0.02, sy * 0.08, 0.02)], 0.03, seg=8), 'leg', subsurf=1)
        b.part('foot_' + side, ellipsoid(V(0.06, sy * 0.08, 0.015), X * 0.07, Y * 0.035, Z * 0.02, 10, 6), 'leg', subsurf=1)
    b.part('tail', blob(V(-0.26, 0, 0.3), 0.14, 0.08, 0.05, 12, 8), 'body')
    return b.root


BUILD = {'dungBeetle': build_dungBeetle, 'pangolin': build_pangolin, 'chameleon': build_chameleon, 'moleRat': build_moleRat,
         'fruitBat': build_fruitBat, 'ostrich': build_ostrich, 'hornbill': build_hornbill}


def build(kind, pose, t=0.0):
    clear(kind)
    return BUILD[kind](pose, t)
