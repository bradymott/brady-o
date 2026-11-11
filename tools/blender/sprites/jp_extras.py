# jp_extras: the NEW Japan cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §4.3/§8), rendered ahead
# of the engine work into their own atlas `jp_x` (not referenced by the game yet, so the live `jp` atlas stays lean).
# When the overhaul wires these enemies, point their cfg.atlas at 'jp_x' (or move the kinds into jp_enemies.py).
# Same conventions and helpers as jp_enemies.py. Kinds are named like the planned spawn types (jpTanuki -> 'tanuki').
#   tanuki   mimic: a round raccoon-dog of our own (dark eye mask, cream muzzle, black stockings, bushy tail, a leaf on
#            its head; no clothes). Disguises are scenery objects with the tell drawn in (the leaf on top and the tail
#            tip peeking out), two frames each for the leaf twitch:
#              soy (a soy-sauce bottle, 11-1), lantern (a little stone garden lantern, 11-3), sandal (a straw sandal, 11-6)
#            then reveal (pops out in a puff, laughing), walk (the chase hop cycle), hop, stun, flat, ko        feet, 26 px
#   chochin  blinker: a paper-lantern spirit of our own (one big eye, a torn-paper grin with a long tongue, red bands)
#            idle(t) (sways, tongue wags), fade (folding up thin), appear (popping open), stun, flat, ko        feet, 30 px
# Render and pack (build_country.sh only packs <cc>_enemies*.py into the country atlas):
#   W=/tmp/brady-sprites/jp_x; JOB=enemies:jp_extras LOOK=toon OUT=$W NAME=jp_x SCALE=3 OUTLINE=1.25 gui/bl.sh $W.log render_country.py
#   gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/jp_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        lathe, torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        mouth_bm, biped_legs, superellipsoid, box_bm, smooth01)
import jp_enemies as JE
from jp_enemies import STD_POSE, walk_bob, face_frame

PX = 28.1
KINDS = ['tanuki', 'chochin']
POSES = {
    'tanuki': ['soy', 'lantern', 'sandal', 'reveal', 'walk', 'hop', 'stun', 'flat', 'ko'],
    'chochin': ['idle', 'fade', 'appear', 'stun', 'flat', 'ko'],
}
FRAMES = {('tanuki', 'soy'): (2, 1), ('tanuki', 'lantern'): (2, 1), ('tanuki', 'sandal'): (2, 1)}
ORIGIN = {'tanuki': 'feet', 'chochin': 'feet'}
HEIGHT = {'tanuki': 26 / PX, 'chochin': 30 / PX}
SIZE = {'tanuki': 30 / PX, 'chochin': 32 / PX}

COLORS = {
    'jp_tongue': '#ff7a8a',
    'tanuki_fur': '#9a7a5e', 'tanuki_fur2': '#7a5e46', 'tanuki_cream': '#f2e2c4', 'tanuki_mask': '#3a2a22', 'tanuki_leg': '#2e2420',
    'tanuki_nose': '#1a1214', 'tanuki_ear': '#5a4434', 'tanuki_leaf': '#4aa83a', 'tanuki_leaf2': '#2e7a2a', 'tanuki_tailtip': '#2e2420',
    'tanuki_smokeglow': '#ffffff', 'tanuki_eye_white': '#fbfbf2', 'tanuki_pupil': '#1a1020', 'tanuki_mouth': '#6a1424',
    'tanuki_glass': '#b8d0c8', 'tanuki_soy': '#4a2414', 'tanuki_cap': '#d8322a', 'tanuki_label': '#f4ecd8',
    'tanuki_stone': '#a8a49a', 'tanuki_stone2': '#8a867c', 'tanuki_window': '#3a3630', 'tanuki_moss': '#7a9a5a',
    'tanuki_straw': '#d8b866', 'tanuki_straw2': '#b8964a', 'tanuki_strap': '#c8322a',
    'chochin_paper': '#fff4e0', 'chochin_rib': '#d8c8a8', 'chochin_band': '#d8322a', 'chochin_cap': '#2a1a14',
    'chochin_tongue': '#ff6a8a', 'chochin_tear': '#7a1424', 'chochin_glow': '#ffe0a0',
    'chochin_eye_white': '#fbfbf2', 'chochin_pupil': '#1a1020', 'chochin_mouth': '#7a1424',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


# ================================================================ TANUKI
def leaf(root, Mx, at, ang, name='leaf'):
    """The folklore leaf on the head: a pointed green leaf with a darker midrib and a little stem."""
    LM = Mx @ about(at, rot_y(ang))
    pts = [at + V(-0.02, 0, 0.0), at + V(-0.1, 0, 0.08), at + V(-0.08, 0, 0.2), at + V(0.0, 0, 0.27), at + V(0.08, 0, 0.2), at + V(0.1, 0, 0.08), at + V(0.02, 0, 0.0)]
    make_part(name, prism(pts[::-1], Y * 0.03), 'tanuki_leaf', root, LM, subsurf=1)
    ob = make_part(name + '_rib', tube([at + V(0, -0.02, 0.0), at + V(0, -0.02, 0.24)], 0.009, seg=4), 'tanuki_leaf2', root, LM, subsurf=0)
    ob['outline'] = 0
    make_part(name + '_stem', tube([at + V(0, 0, 0.0), at + V(0.02, 0, -0.05)], 0.01, seg=4), 'tanuki_leaf2', root, LM, subsurf=0)


def tail_tip(root, Mx, at, wag=0.0):
    make_part('tailtip', ellipsoid(at, X * 0.08, Y * 0.07, Z * 0.06, seg=12, rows=8), 'tanuki_fur', root, Mx @ about(at, rot_y(wag)))
    make_part('tailtip2', ellipsoid(at + V(-0.05, 0, 0.0), X * 0.04, Y * 0.06, Z * 0.05, seg=10, rows=6), 'tanuki_tailtip', root, Mx @ about(at, rot_y(wag)))


def build_tanuki_body(root, pose, t):
    P = dict(STD_POSE.get(pose, STD_POSE['walk']))
    P.update(er=0.085, skin='tanuki_mask')
    if pose == 'reveal':
        P.update(mouth='grin', lid=0.0, eye=1.15, feet='stand')
    bob, lean = walk_bob(pose, P, t, amp=0.06, sway=6)
    if pose == 'walk':
        bob = 0.08 * abs(math.sin(TAU * t))             # the chase is a bouncy hop
        P['feet'] = 'tuck' if math.sin(TAU * t) ** 2 > 0.4 else 'stand'
    lift = 0.12 if pose in ('hop', 'reveal') else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    bc = V(-0.02, 0, 0.36)
    make_part('body', blob(bc, 0.3, 0.26, 0.28, seg=24, rows=14), 'tanuki_fur', root, Mx)
    bsurf = ellipsoid_surf(bc, 0.3, 0.26, 0.28)
    make_part('belly', oval_patch(bsurf, bc.z - 0.04, 0.16, -1.2, 0.55), 'tanuki_cream', root, Mx)
    hc = V(0.1, 0, 0.74)
    make_part('head', blob(hc, 0.26, 0.23, 0.21, seg=24, rows=12), 'tanuki_fur', root, Mx)
    hsurf = ellipsoid_surf(hc, 0.26, 0.23, 0.21)
    make_part('cheeks', oval_patch(hsurf, hc.z - 0.07, 0.07, -1.2, 0.7), 'tanuki_cream', root, Mx)
    # the dark mask round the eyes
    for side, az in (('r', -0.95), ('l', -1.6)):
        make_part('mask_' + side, oval_patch(hsurf, hc.z + 0.01, 0.085, az, 0.4, thick=0.016), 'tanuki_mask', root, Mx)
    mc = hc + V(0.21, -0.03, -0.06)
    make_part('muzzle', blob(mc, 0.08, 0.08, 0.06, seg=14, rows=8), 'tanuki_cream', root, Mx)
    make_part('nose', sphere(mc + V(0.07, -0.01, 0.03), 0.03, seg=10, rows=6), 'tanuki_nose', root, Mx)
    for k, sg in enumerate((-1, 1)):
        ec = hc + V(-0.04, sg * 0.15, 0.18)
        make_part('ear%d' % k, ellipsoid(ec, X * 0.06, Y * 0.04, Z * 0.06, seg=10, rows=6), 'tanuki_ear', root, Mx)
    for side, az in (('r', -0.95), ('l', -1.6)):
        p, n = hsurf(hc.z + 0.02, az)
        eye_one('tanuki', side, p + n * 0.02, n, root, Mx, P)
    msurf = ellipsoid_surf(mc, 0.08, 0.08, 0.06)
    if P['mouth']:
        JE.open_mouth('tanuki', root, Mx, msurf, P['mouth'], mc.z - 0.03, 0.3, -1.3, scale=0.6, tongue=pose == 'reveal')
    leaf(root, Mx, hc + V(-0.02, 0, 0.2), 10 + (14 * math.sin(TAU * t) if pose == 'walk' else 0))
    # arms: up in a cheer when revealed
    for k, sg in enumerate((-1, 1)):
        sh = V(0.1, sg * 0.24, 0.48)
        ang = -130 if pose == 'reveal' else (20 + 20 * math.sin(TAU * t + k * math.pi) if pose == 'walk' else 30)
        MA = Mx @ about(sh, rot_y(-ang))
        make_part('arm%d' % k, tube([sh, sh + V(0.06, 0, -0.12)], 0.05, 0.045, seg=8), 'tanuki_fur2', root, MA)
    # the big bushy tail with a dark tip
    tb = V(-0.3, 0.05, 0.26)
    wag = 10 * math.sin(TAU * t * 2)
    TM = Mx @ about(tb, rot_y(wag))
    make_part('tail', tube([tb, tb + V(-0.14, 0, 0.04), tb + V(-0.24, 0, 0.14)], 0.12, seg=12, radii=[0.08, 0.12, 0.1]), 'tanuki_fur', root, TM)
    make_part('tailend', sphere(tb + V(-0.28, 0, 0.2), 0.08, seg=12, rows=8), 'tanuki_tailtip', root, TM)
    if pose == 'reveal':
        for k, (x, z, r) in enumerate(((-0.4, 0.2, 0.14), (0.4, 0.3, 0.12), (-0.3, 0.75, 0.1), (0.36, 0.78, 0.11), (0.0, 1.0, 0.09))):
            ob = make_part('puff%d' % k, sphere(V(x, -0.2, z), r, seg=12, rows=8), 'tanuki_smokeglow', root, Matrix.Identity(4))
            ob['outline'] = 0.6
    biped_legs('tanuki', root, T((0, 0, lift)), P, t, (0.0, 0.12, 0.14), (0.08, 0.06, 0.04), 0.045, 'tanuki_leg')


def build_tanuki(root, pose, t):
    tw = 18 * (1 if t >= 0.5 else -1) if pose in ('soy', 'lantern', 'sandal') else 0     # frame 1 = the leaf twitches
    if pose == 'soy':
        # a tabletop soy-sauce bottle: teardrop glass with dark sauce inside, a red cap and spout, a paper label
        prof = [(0.0, 0.0), (0.2, 0.0), (0.24, 0.06), (0.26, 0.2), (0.24, 0.34), (0.18, 0.46), (0.12, 0.54), (0.11, 0.6)]
        make_part('glass', lathe(prof + [(0.0, 0.6)], seg=22), 'tanuki_glass', root, Matrix.Identity(4))
        make_part('sauce', lathe([(0.0, 0.03), (0.21, 0.03), (0.235, 0.2), (0.22, 0.32), (0.0, 0.33)], seg=20), 'tanuki_soy', root, T((0, -0.02, 0)) @ diag(1.0, 1.04, 1.0))
        make_part('cap', lathe([(0.0, 0.58), (0.13, 0.58), (0.13, 0.7), (0.1, 0.74), (0.0, 0.74)], seg=18), 'tanuki_cap', root, Matrix.Identity(4))
        make_part('spout', tube([V(0.08, 0, 0.7), V(0.18, 0, 0.76)], 0.025, seg=6), 'tanuki_cap', root, Matrix.Identity(4), subsurf=0)
        make_part('label', box_bm((0.22, 0.02, 0.12), bevel=0.0), 'tanuki_label', root, T((0.0, -0.255, 0.2)), subsurf=0)
        leaf(root, Matrix.Identity(4), V(-0.02, 0, 0.74), 8 + tw)
        tail_tip(root, Matrix.Identity(4), V(-0.3, 0.06, 0.07), wag=tw * 0.5)
    elif pose == 'lantern':
        # a little stone garden lantern: base, post, a fire box with a dark window, a hat roof and a knob, moss here
        # and there
        I = Matrix.Identity(4)
        make_part('base', box_bm((0.46, 0.4, 0.1), bevel=0.02), 'tanuki_stone2', root, T((0, 0, 0.05)), subsurf=0)
        make_part('post', lathe([(0.0, 0.1), (0.09, 0.1), (0.07, 0.36), (0.0, 0.36)], seg=8), 'tanuki_stone', root, I, subsurf=0)
        make_part('saddle', box_bm((0.36, 0.32, 0.06), bevel=0.02), 'tanuki_stone2', root, T((0, 0, 0.39)), subsurf=0)
        make_part('firebox', box_bm((0.28, 0.26, 0.2), bevel=0.02), 'tanuki_stone', root, T((0, 0, 0.52)), subsurf=0)
        make_part('window', box_bm((0.12, 0.02, 0.1)), 'tanuki_window', root, T((0, -0.13, 0.52)), subsurf=0)
        make_part('roof', lathe([(0.0, 0.62), (0.32, 0.62), (0.3, 0.66), (0.12, 0.76), (0.0, 0.78)], seg=6), 'tanuki_stone2', root, I @ rot_z(30), subsurf=0)
        make_part('knob', sphere(V(0, 0, 0.82), 0.05, seg=10, rows=6), 'tanuki_stone', root, I)
        make_part('moss', ellipsoid(V(0.12, -0.13, 0.66), X * 0.08, Y * 0.04, Z * 0.03, seg=8, rows=4), 'tanuki_moss', root, I, subsurf=0)
        leaf(root, I, V(0.0, 0, 0.84), 8 + tw)
        tail_tip(root, I, V(-0.3, 0.08, 0.08), wag=tw * 0.5)
    elif pose == 'sandal':
        # a straw sandal lying on the ground: a woven oval sole with ridges and red straps
        I = Matrix.Identity(4)
        make_part('sole', superellipsoid(V(0, 0, 0.05), 0.36, 0.16, 0.05, e=0.6, seg=20, rows=6), 'tanuki_straw', root, I)
        for k in range(6):
            ob = make_part('weave%d' % k, box_bm((0.02, 0.28, 0.02)), 'tanuki_straw2', root, T((-0.25 + 0.1 * k, -0.02, 0.1)), subsurf=0)
            ob['outline'] = 0
        make_part('strap', tube([V(-0.2, -0.14, 0.09), V(0.0, -0.16, 0.2), V(0.2, -0.14, 0.09)], 0.025, seg=6), 'tanuki_strap', root, I, subsurf=1)
        make_part('toe', tube([V(0.22, 0.0, 0.09), V(0.26, 0, 0.16)], 0.025, seg=6), 'tanuki_strap', root, I, subsurf=0)
        leaf(root, I, V(0.02, 0.0, 0.11), 4 + tw)
        tail_tip(root, I, V(-0.4, 0.06, 0.07), wag=tw * 0.5)
    else:
        build_tanuki_body(root, pose, t)


# ================================================================ CHOCHIN (paper-lantern spirit)
CHO = [(0.0, 0.0), (0.16, 0.0), (0.26, 0.06), (0.32, 0.18), (0.34, 0.34), (0.32, 0.5), (0.26, 0.62), (0.16, 0.68), (0.0, 0.68)]


def build_chochin(root, pose, t):
    P = {'er': 0.12, 'skin': 'chochin_paper', 'lid': 0.1, 'look': Vector((0.6, -0.8, -0.1))}
    sway, sx, sz, hover = 0.0, 1.0, 1.0, 0.14
    if pose == 'idle':
        sway = 8 * math.sin(TAU * t)
        hover = 0.14 + 0.03 * math.sin(TAU * t)
    elif pose == 'fade':
        sx, sz, P['lid'] = 0.45, 1.15, 0.7
    elif pose == 'appear':
        sx, sz, P['eye'], P['lid'] = 1.18, 0.86, 1.2, 0.0
    elif pose == 'stun':
        P['dazed'], P['lid'], sway = True, 0.5, -10
    elif pose == 'flat':
        sx, sz, hover, P['lid'] = 1.3, 0.35, 0.0, 1.0
    else:
        P['x'], sway = True, 20
    Mx = T((0, 0, hover)) @ about((0, 0, 0.34), rot_y(sway)) @ about((0, 0, 0.34), diag(sx, sx, sz))
    make_part('paper', lathe(CHO, seg=24), 'chochin_paper', root, Mx)
    surf = lathe_surf(CHO)
    for k, z in enumerate((0.12, 0.24, 0.44, 0.56)):
        r = surf(z, 0.0)[0].x
        ob = make_part('rib%d' % k, torus(V(0, 0, z), r + 0.006, 0.01, axis=Z, seg=24, rseg=4), 'chochin_rib', root, Mx, subsurf=0)
        ob['outline'] = 0
    for k, z in enumerate((0.06, 0.62)):
        r = surf(z, 0.0)[0].x
        make_part('band%d' % k, torus(V(0, 0, z), r + 0.01, 0.035, axis=Z, seg=24, rseg=6), 'chochin_band', root, Mx)
    make_part('captop', lathe([(0.0, 0.66), (0.17, 0.66), (0.17, 0.74), (0.0, 0.74)], seg=18), 'chochin_cap', root, Mx)
    make_part('capbot', lathe([(0.0, -0.06), (0.17, -0.06), (0.17, 0.02), (0.0, 0.02)], seg=18), 'chochin_cap', root, Mx)
    make_part('hook', torus(V(0, 0, 0.8), 0.05, 0.012, axis=Y, seg=12, rseg=4), 'chochin_cap', root, Mx, subsurf=0)
    # one big eye up front
    p, n = surf(0.44, -1.2)
    eye_one('chochin', 'r', p + n * 0.01, n, root, Mx, P, er=0.12)
    # the torn-paper grin and its long lolling tongue
    if pose not in ('flat',):
        a0, a1, z0 = -0.75, -1.75, 0.24
        make_part('tear', mouth_bm(surf, 'grin', z0, a0, a1, scale=1.4), 'chochin_tear', root, Mx)
        p, n = surf(z0 - 0.05, -1.25)
        wag = 0.05 * math.sin(TAU * t * 2) if pose == 'idle' else 0.0
        tong = [p + n * 0.01, p + n * 0.08 + V(0.03, 0, -0.08), p + n * 0.1 + V(0.06 + wag, 0, -0.2), p + n * 0.08 + V(0.04 + wag, 0, -0.28)]
        make_part('tongue', tube(tong, 0.06, seg=10, radii=[0.05, 0.06, 0.055, 0.04]), 'chochin_tongue', root, Mx, subsurf=1)


BUILDERS = {'tanuki': build_tanuki, 'chochin': build_chochin}


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
