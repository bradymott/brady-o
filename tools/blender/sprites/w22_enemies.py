# w22_enemies: the World 22 cast of Super Brady-O World (secret world 22, a dream land where every clock says 22:22)
# for the pre-rendered Fiesta Toon pipeline. Original, soft and strange objects that wandered out of a dream; no people
# (the Other Brady and the echo stay code-drawn). Same conventions as jp_enemies.py / np_enemies.py (helpers in
# jp_charkit.py): Z up, characters FACE +X, camera along +Y; feet-origin kinds stand on z = 0, centre-origin kinds are
# centred; materials <kind>_<part>, 'glow' materials unlit; one Empty per kind. Palette: lilac, peach, cream and teal
# with plum ink, so they read on the dusk, the lake, the dark corridor and the white room alike.
#
#   alarm      a twin-bell alarm clock in lilac on little brass feet, its dial stopped at 22:22, two sleepy eyes above
#              the hands; it rings (hammer and bells shaking) as it hops                  walk hop stun flat ko
#   moth       a pale dream moth: cream fuzz, lilac wings with peach and teal eye-spots, feathery feelers, a faint
#              glow                                                                         fly swoop stun ko   centre
#   envelope   an airmail envelope on two feet: red-and-blue chevron border, a peach stamp, "22" on the front; the
#              flap flaps like a mouth (overhaul: 'flutter' when it flies loose as mail)  walk flutter stun flat ko
#   hourglass  a walnut hourglass with peach sand running down; tips over and rolls      walk curl roll stun flat ko
#   coin       the STAR: a plump five-pointed peach-gold star, spinning about Z          spin                centre
#   star       the GOLDEN CLOCK: a gold pocket watch at 22:22 with a bow and sparkles     idle (hover)        centre
#   qblock     the item block: a lilac dream box with a cream clock face (22:22) on each face and gold corners
#                                                                                          idle (frame 000)    centre
#   used       the same box spent: faded grey-lilac, the dial blank                       idle                centre
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        lathe, torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        mouth_bm, biped_legs, superellipsoid, box_bm, perp_frame, smooth01, xf)
import jp_enemies as JE
from jp_enemies import STD_POSE, walk_bob, face_frame, flat_mouth
import np_enemies as NE
import w22_kit as WK

PX = 28.1
KINDS = ['alarm', 'moth', 'envelope', 'hourglass', 'coin', 'star', 'qblock', 'used']
POSES = {
    'alarm': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'moth': ['fly', 'swoop', 'stun', 'ko'],
    'envelope': ['walk', 'flutter', 'stun', 'flat', 'ko'],
    'hourglass': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('envelope', 'flutter'): (6, 10)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'moth': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'alarm': 26 / PX, 'envelope': 26 / PX, 'hourglass': 26 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'moth': 26 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX})

INK = '#3a2a5a'
COLORS = {
    'jp_tongue': '#ff8aa0',
    'alarm_case': '#b48ae0', 'alarm_case2': '#9a6ad0', 'alarm_bell': '#d8b8f4', 'alarm_brass': '#ffc860', 'alarm_dial': '#fff6e8',
    'alarm_ink': INK, 'alarm_hand': '#5a3a8a', 'alarm_tick': '#8a6ab8', 'alarm_ring': '#ffffff',
    'alarm_eye_white': '#ffffff', 'alarm_pupil': '#2a1a3a', 'alarm_mouth': '#6a1a3a', 'alarm_cheek': '#ffb0c8',
    'moth_fur': '#fff2e4', 'moth_fur2': '#f0dcc8', 'moth_wing': '#d8c4f4', 'moth_wing2': '#c4aaea', 'moth_spot': '#ffb890',
    'moth_spot2': '#5ad8c8', 'moth_vein': '#a888d8', 'moth_feeler': '#8a6ab8', 'moth_glow': '#fff0e0',
    'moth_eye_white': '#ffffff', 'moth_pupil': '#2a1a3a', 'moth_mouth': '#6a1a3a',
    'envelope_paper': '#fff8ec', 'envelope_paper2': '#f0e4d0', 'envelope_red': '#e8485a', 'envelope_blue': '#3a6ad8',
    'envelope_stamp': '#ffb890', 'envelope_stamp2': '#5ad8c8', 'envelope_ink': INK, 'envelope_feet': '#8a6ab8',
    'envelope_eye_white': '#ffffff', 'envelope_pupil': '#2a1a3a', 'envelope_mouth': '#6a1a3a',
    'hourglass_wood': '#8a5a3e', 'hourglass_wood2': '#6a4430', 'hourglass_glass': '#d8f4f4', 'hourglass_glass2': '#f4ffff',
    'hourglass_sand': '#ffc890', 'hourglass_sand2': '#f0a870', 'hourglass_feet': '#6a4430',
    'hourglass_eye_white': '#ffffff', 'hourglass_pupil': '#2a1a3a', 'hourglass_mouth': '#6a1a3a',
    'coin_gold': '#ffd08a', 'coin_gold2': '#f0a860', 'coin_shine': '#fff8ec',
    'star_gold': '#ffd24a', 'star_gold2': '#e8a820', 'star_dial': '#fff6e0', 'star_hand': '#5a3a20', 'star_bow': '#c8a0e8',
    'star_glow': '#fff6c0',
    'qblock_box': '#c8b0f0', 'qblock_box2': '#ffc8d8', 'qblock_gold': '#ffd24a', 'qblock_dial': '#fff8ec', 'qblock_hand': INK,
    'used_box': '#a8a0b8', 'used_box2': '#988ea8', 'used_gold': '#8a8298', 'used_dial': '#c8c2d0',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


def dial(kind, root, Mx, c, r, n_ticks=12, face='_dial', ink='_ink', hand='_hand', depth=0.02, hands=True, name='dial'):
    """A camera-facing clock face at c (radius r) stopped at 22:22."""
    make_part(name, ellipsoid(c, X * r, Y * depth, Z * r, seg=26, rows=8), kind + face, root, Mx, subsurf=1)
    for k in range(n_ticks):
        a = TAU * k / n_ticks
        dx, dz = WK.dial_dir(a)
        big = k % 3 == 0
        ob = make_part('%s_tick%d' % (name, k), sphere(c + V(dx * r * 0.78, -depth - 0.004, dz * r * 0.78), r * (0.085 if big else 0.05), seg=6, rows=4), kind + ink, root, Mx, subsurf=0)
        ob['outline'] = 0
    if hands:
        for nm, a, ln, w in (('h', WK.HOUR_A, 0.5, 0.075), ('m', WK.MIN_A, 0.76, 0.05)):
            dx, dz = WK.dial_dir(a)
            p0 = c + V(0, -depth - 0.008, 0)
            ob = make_part('%s_%s' % (name, nm), tube([p0, p0 + V(dx * r * ln, 0, dz * r * ln)], r * w, seg=6), kind + hand, root, Mx, subsurf=0)
            ob['outline'] = 0
        make_part(name + '_pin', sphere(c + V(0, -depth - 0.01, 0), r * 0.08, seg=8, rows=5), kind + hand, root, Mx, subsurf=0)


# ================================================================ ALARM CLOCK (hopper)
def build_alarm(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='alarm_case')
    P['lid'] = 0.3 if pose in ('walk', 'idle') else P['lid']
    bob, lean = walk_bob(pose, P, t)
    lift = 0.12 if pose == 'hop' else 0.0
    shake = 6 * math.sin(TAU * t * 4) if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ about((0, 0, 0.4), rot_y(lean + shake)) @ diag(P['sx'], P['sx'], P['sz'])
    c, r = V(0, 0, 0.44), 0.3
    # the round case seen face-on, slightly turned toward +X
    CM = Mx @ about(c, rot_z(-18))
    make_part('case', ellipsoid(c, X * r, Y * 0.16, Z * r, seg=28, rows=12), 'alarm_case', root, CM)
    make_part('rim', torus(c + V(0, -0.12, 0), r * 0.93, 0.035, axis=Y, seg=28, rseg=6), 'alarm_case2', root, CM, subsurf=0)
    dial('alarm', root, CM, c + V(0, -0.13, 0), r * 0.84, name='dial')
    # eyes on the dial's upper half, cheeks, a little mouth under the hands
    if pose != 'flat':
        n = Vector((0.12, -1, 0.05)).normalized()
        for side, dx in (('r', 0.1), ('l', -0.1)):
            eye_one('alarm', side, c + V(dx * 1.1, -0.16, 0.09), n, root, CM, P, er=0.085)
        if not P.get('x'):
            for k, dx in enumerate((0.19, -0.19)):
                ob = make_part('cheek%d' % k, ellipsoid(c + V(dx, -0.155, -0.02), X * 0.045, Y * 0.01, Z * 0.028, seg=10, rows=5), 'alarm_cheek', root, CM, subsurf=0)
                ob['outline'] = 0
        mouth = {'hop': 'o', 'stun': 'wobble', 'ko': 'o', 'walk': 'smile'}.get(pose, 'smile')
        flat_mouth('alarm', root, CM, mouth, c + V(0.0, -0.16, -0.17), n, 0.1)
    # twin bells with a hammer between, a carry handle
    ring = 4 * math.sin(TAU * t * 6) if pose == 'hop' else 0.0
    for k, sg in enumerate((-1, 1)):
        bc = c + V(sg * 0.2, 0.0, r + 0.02)
        BM = CM @ about(bc, rot_y(sg * (32 + ring)))
        make_part('bell%d' % k, lathe([(0.0, -0.02), (0.13, -0.02), (0.12, 0.04), (0.08, 0.1), (0.0, 0.12)], seg=18), 'alarm_bell', root, BM @ T(bc))
        make_part('knob%d' % k, sphere(bc + V(0, 0, 0.14), 0.025, seg=8, rows=5), 'alarm_brass', root, BM, subsurf=0)
    hm = c + V(0.0, 0.02, r + 0.03)
    HMx = CM @ about(hm, rot_y(25 * math.sin(TAU * t * 6) if pose == 'hop' else 0))
    make_part('hammer_arm', tube([hm, hm + V(0, 0, 0.1)], 0.015, seg=5), 'alarm_brass', root, HMx, subsurf=0)
    make_part('hammer', sphere(hm + V(0, 0, 0.12), 0.035, seg=8, rows=5), 'alarm_brass', root, HMx, subsurf=0)
    make_part('handle', torus(c + V(0, 0.06, r + 0.12), 0.1, 0.018, axis=Y, seg=16, rseg=5), 'alarm_case2', root, CM @ about(c, diag(1, 1, 1)) @ T((0, 0, 0)), subsurf=0)
    if pose == 'hop':
        for k, sg in enumerate((-1, 1)):
            for j in range(2):
                a0 = c + V(sg * (0.36 + 0.08 * j), -0.2, r + 0.05 + 0.06 * j)
                ob = make_part('ringline%d%d' % (k, j), tube([a0, a0 + V(sg * 0.08, 0, 0.06)], 0.014, seg=4), 'alarm_ink', root, Mx, subsurf=0)
                ob['outline'] = 0
    # brass legs and round feet
    biped_legs('alarm', root, Mx, P, t, (0.0, 0.11, 0.18), (0.075, 0.05, 0.035), 0.025, 'alarm_brass')


# ================================================================ MOTH (flyer)
def build_moth(root, pose, t):
    P = {'er': 0.065, 'skin': 'moth_fur', 'lid': 0.3, 'look': Vector((0.55, -0.85, -0.1))}
    flap, tilt, roll = 0.0, 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.6, 22
        P['lid'], P['eye'] = 0.0, 1.1
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.3, True, 0.5
    else:
        flap, P['x'], roll = -0.4, True, 150
    Mx = rot_y(tilt) @ (rot_x(roll) if roll else Matrix.Identity(4))
    # fuzzy body: thorax and a striped abdomen behind
    bc = V(-0.02, 0, 0.0)
    make_part('thorax', blob(bc, 0.12, 0.1, 0.11, seg=18, rows=10), 'moth_fur', root, Mx)
    make_part('abdomen', blob(bc + V(-0.17, 0, -0.03), 0.14, 0.08, 0.08, seg=18, rows=10), 'moth_fur2', root, Mx)
    for k in range(2):
        ob = make_part('stripe%d' % k, torus(bc + V(-0.13 - 0.07 * k, 0, -0.03), 0.075 - 0.01 * k, 0.014, axis=X, seg=14, rseg=4), 'moth_spot', root, Mx, subsurf=0)
        ob['outline'] = 0
    hc = V(0.12, 0, 0.03)
    make_part('head', sphere(hc, 0.085, seg=16, rows=10), 'moth_fur', root, Mx)
    make_part('ruff', torus(V(0.06, 0, 0.02), 0.08, 0.035, axis=X, seg=16, rseg=6), 'moth_fur', root, Mx, subsurf=1)
    hs = ellipsoid_surf(hc, 0.085, 0.085, 0.085)
    for side, az, dz in (('r', -0.7, 0.02), ('l', -1.45, 0.025)):
        p, n = hs(hc.z + dz, az)
        eye_one('moth', side, p - n * 0.006, n, root, Mx, P)
    # feathery feelers
    for k, sg in enumerate((-1, 1)):
        base = hc + V(0.03, sg * 0.03, 0.06)
        tip = base + V(0.12, sg * 0.04, 0.12)
        make_part('feeler%d' % k, tube([base, base.lerp(tip, 0.5) + V(0, 0, 0.02), tip], 0.008, seg=4), 'moth_feeler', root, Mx, subsurf=0)
        for j in range(4):
            q = base.lerp(tip, 0.35 + 0.17 * j)
            ob = make_part('barb%d%d' % (k, j), tube([q, q + V(0.035, 0, -0.01)], 0.006, seg=3), 'moth_feeler', root, Mx, subsurf=0)
            ob['outline'] = 0
    # wings: broad rounded forewings and hindwings with eye-spots; the far pair behind the body
    def wing(name, y, sc, up):
        k = 1.0 + 0.8 * up if up >= 0 else 1.0 + 1.2 * up
        fw = [V(0.02, 0, 0.02), V(0.1, 0, 0.18 * k), V(0.02, 0, 0.36 * k), V(-0.16, 0, 0.4 * k), V(-0.26, 0, 0.28 * k), V(-0.14, 0, 0.06)]
        hw = [V(-0.06, 0, 0.0), V(-0.18, 0, 0.18 * k), V(-0.34, 0, 0.2 * k), V(-0.38, 0, 0.06 * k), V(-0.24, 0, -0.04)]
        W = Mx @ T((0, y, 0.02)) @ diag(sc, 1, sc)
        make_part(name + '_hind', prism(hw[::-1], Y * 0.02), 'moth_wing2', root, W, subsurf=1)
        make_part(name + '_fore', prism(fw[::-1], Y * 0.02), 'moth_wing', root, W @ T((0, -0.012, 0)), subsurf=1)
        return W, k
    wing('wfar', 0.09, 1.2, flap)
    W, k = wing('wnear', -0.12, 1.3, flap)
    if abs(flap) < 0.95:
        for nm, cc, r, mat in (('spot', V(-0.1, -0.03, 0.24 * k), 0.06, 'moth_spot'), ('spot2', V(-0.27, -0.03, 0.11 * k), 0.045, 'moth_spot2')):
            make_part(nm, ellipsoid(cc, X * r, Y * 0.012, Z * r * max(0.4, min(1.0, k)), seg=14, rows=6), mat, root, W, subsurf=0)
            ob = make_part(nm + '_c', ellipsoid(cc + V(0, -0.012, 0), X * r * 0.4, Y * 0.008, Z * r * 0.4 * max(0.4, min(1.0, k)), seg=10, rows=4), 'moth_vein', root, W, subsurf=0)
            ob['outline'] = 0


# ================================================================ ENVELOPE (walker / flutter)
def env_body(root, Mx, flap_a, P, pose, t):
    w, h, d = 0.72, 0.5, 0.07
    c = V(0, 0, 0.0)
    make_part('paper', box_bm((w, d, h), bevel=0.02, segments=2), 'envelope_paper', root, Mx @ T(c), subsurf=0)
    # the chevron airmail border along every edge (red and blue alternating)
    n = 9
    for k in range(n):
        u = (k + 0.5) / n
        for z, sgn in ((h / 2 - 0.03, 1), (-h / 2 + 0.03, -1)):
            x = -w / 2 + u * w
            pts = [V(x - 0.02, 0, z - 0.02 * sgn), V(x + 0.02, 0, z - 0.02 * sgn), V(x + 0.045, 0, z + 0.02 * sgn), V(x + 0.005, 0, z + 0.02 * sgn)]
            ob = make_part('chev%d_%d' % (k, sgn > 0), prism(pts if sgn > 0 else pts[::-1], Y * 0.01), 'envelope_red' if k % 2 else 'envelope_blue', root, Mx @ T((0, -d / 2 - 0.006, 0)), subsurf=0, smooth=False)
            ob['outline'] = 0
    # the back flap folded over the top edge (it opens like a mouth)
    FM = Mx @ about(V(0, 0, h / 2), rot_x(0)) @ about(V(0, -d / 2, h / 2), rot_x(-flap_a))
    make_part('flap', prism([V(-w / 2 + 0.01, 0, h / 2), V(w / 2 - 0.01, 0, h / 2), V(0, 0, h / 2 - 0.2)][::-1], Y * 0.012), 'envelope_paper2', root, FM @ T((0, -d / 2 - 0.012, 0)), subsurf=0, smooth=False)
    # the stamp (top right) and the "22"
    make_part('stamp', box_bm((0.1, 0.012, 0.12), bevel=0.01), 'envelope_stamp', root, Mx @ T((w / 2 - 0.1, -d / 2 - 0.01, h / 2 - 0.1)), subsurf=0)
    ob = make_part('stamp2', box_bm((0.05, 0.014, 0.06)), 'envelope_stamp2', root, Mx @ T((w / 2 - 0.1, -d / 2 - 0.014, h / 2 - 0.1)), subsurf=0)
    ob['outline'] = 0
    ob = make_part('num', WK.text_bm('22', size=0.2, extrude=0.008), 'envelope_ink', root, Mx @ T((-0.17, -d / 2 - 0.012, -0.1)), subsurf=0, smooth=False)
    ob['outline'] = 0
    # eyes peeking from under the flap's point
    if pose != 'flat':
        n = Vector((0.15, -1, 0.0)).normalized()
        for side, dx in (('r', 0.06), ('l', -0.08)):
            eye_one('envelope', side, V(dx * 1.2 + 0.02, -d / 2 - 0.02, 0.04), n, root, Mx, P, er=0.075)
    return w, h, d


def build_envelope(root, pose, t):
    P = dict(STD_POSE['walk' if pose == 'flutter' else pose])
    P.update(er=0.06, skin='envelope_paper')
    if pose == 'flutter':
        flap = 40 + 30 * math.sin(TAU * t)
        Mx = T((0, 0, 0.5 + 0.03 * math.sin(TAU * t))) @ rot_y(8 * math.sin(TAU * t)) @ rot_x(6 * math.sin(TAU * t + 1))
        env_body(root, Mx, flap, P, pose, t)
        return
    bob, lean = walk_bob(pose, P, t)
    flap = {'walk': 18 + 14 * max(0, math.sin(TAU * t * 2)), 'stun': 50, 'ko': 70, 'flat': 0}.get(pose, 10)
    sz = 0.4 if pose == 'flat' else 1.0
    Mx = T((0, 0, (0.2 if pose != 'flat' else 0.08) + bob)) @ rot_y(lean) @ diag(1.0 if pose != 'flat' else 1.25, 1, sz) @ T((0, 0, 0.25))
    env_body(root, Mx, flap, P, pose, t)
    biped_legs('envelope', root, T((0, 0, 0)), P, t, (0.0, 0.1, 0.2 if pose != 'flat' else 0.06), (0.07, 0.05, 0.03), 0.022, 'envelope_feet')


# ================================================================ HOURGLASS (roller)
def hourglass_body(root, Mx, c, sand_t=0.4):
    for k, dz in enumerate((-0.3, 0.3)):
        make_part('plate%d' % k, superellipsoid(c + V(0, 0, dz), 0.2, 0.15, 0.035, e=0.4, seg=18, rows=6), 'hourglass_wood', root, Mx, subsurf=0)
    for k, (dx, dy) in enumerate(((-0.15, -0.1), (0.15, -0.1), (0.15, 0.1), (-0.15, 0.1))):
        make_part('post%d' % k, tube([c + V(dx, dy, -0.28), c + V(dx, dy, 0.28)], 0.022, seg=6), 'hourglass_wood2', root, Mx, subsurf=0)
    prof = [(0.0, -0.27), (0.13, -0.26), (0.14, -0.15), (0.06, -0.04), (0.025, 0.0), (0.06, 0.04), (0.14, 0.15), (0.13, 0.26), (0.0, 0.27)]
    make_part('glass', lathe(prof, seg=22), 'hourglass_glass', root, Mx @ T(c) @ diag(1, 0.85, 1))
    # sand: a mound in the bottom bulb, a cone draining from the top, a thin stream
    top = 0.18 * (1 - sand_t)
    ob = make_part('sand_bot', lathe([(0.0, -0.25), (0.12, -0.25), (0.1, -0.2), (0.05, -0.15 + 0.1 * sand_t), (0.0, -0.14 + 0.1 * sand_t)], seg=18), 'hourglass_sand', root, Mx @ T(c + V(0, -0.02, 0)) @ diag(1, 0.8, 1))
    ob['outline'] = 0
    if top > 0.02:
        ob = make_part('sand_top', lathe([(0.0, 0.04), (0.05, 0.06), (0.1, 0.06 + top * 0.8), (0.0, 0.06 + top)], seg=18), 'hourglass_sand2', root, Mx @ T(c + V(0, -0.02, 0)) @ diag(1, 0.8, 1))
        ob['outline'] = 0
    ob = make_part('stream', tube([c + V(0, -0.03, 0.04), c + V(0, -0.03, -0.14)], 0.01, seg=5), 'hourglass_sand', root, Mx, subsurf=0)
    ob['outline'] = 0
    make_part('gleam', prism([V(-0.1, 0, 0.12), V(-0.06, 0, 0.2), V(-0.04, 0, 0.18), V(-0.08, 0, 0.1)], Y * 0.01), 'hourglass_glass2', root, Mx @ T(c + V(0, -0.13, 0)), subsurf=0)


def build_hourglass(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.06, skin='hourglass_glass')
    bob, lean = walk_bob(pose, P, t)
    if pose in ('roll', 'curl'):
        c = V(0, 0, 0.3)
        MR = about(c, rot_y(90 + (360 * t if pose == 'roll' else 0)))
        hourglass_body(root, MR, c, sand_t=0.5)
        if pose == 'curl':
            for side, dx in (('r', 0.07), ('l', -0.07)):
                eye_one('hourglass', side, c + V(dx, -0.14, 0.12), Vector((0.1, -1, 0)), root, about(c, rot_y(90)), P, er=0.055)
        return
    sz = 0.4 if pose == 'flat' else 1.0
    Mx = T((0, 0, bob)) @ about((0, 0, 0), rot_y(lean)) @ diag(1.25 if pose == 'flat' else 1.0, 1, sz)
    c = V(0, 0, 0.42)
    hourglass_body(root, Mx, c, sand_t=0.3 + 0.4 * t if pose == 'walk' else 0.45)
    if pose != 'flat':
        n = Vector((0.2, -1, 0.0)).normalized()
        for side, dx in (('r', 0.07), ('l', -0.05)):
            eye_one('hourglass', side, c + V(dx, -0.125, 0.15), n, root, Mx, P, er=0.068)
        flat_mouth('hourglass', root, Mx, P['mouth'] if P['mouth'] != 'grin' else 'smile', c + V(0.01, -0.14, 0.07), n, 0.07)
    biped_legs('hourglass', root, Mx, P, t, (0.0, 0.09, 0.12), (0.065, 0.05, 0.03), 0.024, 'hourglass_feet')


# ================================================================ COIN: the star
def build_coin(root, pose, t):
    Mx = rot_z(360 * t)
    pts = []
    for j in range(10):
        a = TAU * j / 10 + math.pi / 2
        r = 0.27 if j % 2 == 0 else 0.12
        pts.append(V(r * math.cos(a), 0, r * math.sin(a)))
    from jp_enemies import puffy_slab
    make_part('star', puffy_slab([(p.x, p.z) for p in pts[::-1]], 0.05, rows=4, squish=0.35), 'coin_gold', root, Mx, subsurf=1)
    inner = [p * 0.55 for p in pts]
    ob = make_part('inner', prism([p + V(0, -0.055, 0) for p in inner], Y * 0.01), 'coin_gold2', root, Mx, subsurf=0, smooth=False)
    ob['outline'] = 0
    ob = make_part('shine', ellipsoid(V(-0.06, -0.07, 0.07), X * 0.025, Y * 0.01, Z * 0.04, seg=8, rows=4), 'coin_shine', root, Mx, subsurf=0)
    ob['outline'] = 0


# ================================================================ STAR: the golden clock (pocket watch)
def build_star(root, pose, t):
    Mx = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(6 * math.sin(TAU * t))
    c = V(0, 0, -0.03)
    make_part('case', ellipsoid(c, X * 0.26, Y * 0.07, Z * 0.26, seg=28, rows=10), 'star_gold', root, Mx)
    make_part('bezel', torus(c + V(0, -0.06, 0), 0.24, 0.025, axis=Y, seg=28, rseg=6), 'star_gold2', root, Mx, subsurf=0)
    dial('star', root, Mx, c + V(0, -0.065, 0), 0.2, face='_dial', ink='_hand', hand='_hand', name='dial')
    make_part('stem', tube([c + V(0, 0, 0.26), c + V(0, 0, 0.32)], 0.03, seg=8), 'star_gold2', root, Mx, subsurf=0)
    make_part('crown', sphere(c + V(0, 0, 0.34), 0.04, seg=10, rows=6), 'star_gold', root, Mx, subsurf=0)
    make_part('bow', torus(c + V(0, 0, 0.41), 0.06, 0.02, axis=Y, seg=16, rseg=5), 'star_gold', root, Mx, subsurf=0)
    for k in range(3):
        a = TAU * (t + k / 3)
        cc = V(0.42 * math.cos(a), -0.2, 0.28 * math.sin(a))
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [cc + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, Mx, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the dream box
def build_block(root, Mx, spent):
    H = 0.55
    k = 'used' if spent else 'qblock'
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.1, segments=3), k + '_box', root, Mx, subsurf=0)
    make_part('band', box_bm((2 * H + 0.015, 2 * H + 0.015, 0.16), bevel=0.04), k + '_box2' if not spent else 'used_box2', root, Mx @ T((0, 0, -0.32)), subsurf=0)
    for sx in (-1, 1):
        for sz in (-1, 1):
            for sy in (-1, 1):
                make_part('corner%d%d%d' % (sx > 0, sy > 0, sz > 0), sphere(V(sx * (H - 0.04), sy * (H - 0.04), sz * (H - 0.04)), 0.07, seg=10, rows=6), k + '_gold', root, Mx, subsurf=0)
    for fi, (nrm, tng) in enumerate((((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)))):
        bn, bt = Vector(nrm), Vector(tng)
        bu = bn.cross(bt)
        FM = Mx @ Matrix.Translation(bn * (H + 0.01) + bu * 0.08) @ Matrix(((bt.x, -bn.x, bu.x, 0), (bt.y, -bn.y, bu.y, 0), (bt.z, -bn.z, bu.z, 0), (0, 0, 0, 1)))
        make_part('ring%d' % fi, torus(V(0, 0, 0), 0.33, 0.035, axis=Y, seg=26, rseg=6), k + '_gold', root, FM, subsurf=0)
        if spent:
            make_part('dial%d' % fi, ellipsoid(V(0, 0, 0), X * 0.31, Y * 0.015, Z * 0.31, seg=22, rows=6), 'used_dial', root, FM, subsurf=0)
        else:
            dial('qblock', root, FM, V(0, 0, 0), 0.31, face='_dial', ink='_hand', hand='_hand', depth=0.015, name='dial%d' % fi)


def build_qblock(root, pose, t):
    build_block(root, Matrix.Identity(4), False)


def build_used(root, pose, t):
    build_block(root, Matrix.Identity(4), True)


BUILDERS = {'alarm': build_alarm, 'moth': build_moth, 'envelope': build_envelope, 'hourglass': build_hourglass,
            'coin': build_coin, 'star': build_star, 'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    # small faces: the 1.25 px ink would swallow the eyes, so the pupils get none and the whites a thin one
    for ob in root.children:
        part = ob.get('sprite_part', '')
        if part.startswith('pupil_'):
            ob['outline'] = 0
        elif part.startswith(('eye_', 'lid_')):
            ob['outline'] = 0.45
    return root
