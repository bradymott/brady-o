# aq_extras: the NEW Antarctica cast planned by the level overhaul (docs/design/LEVEL_OVERHAUL.md §2/§4/§8), rendered
# ahead of the level work into their own atlas `aq_x` (not referenced by the game yet). Same Adelie penguin as the
# live `aq` atlas (aq_enemies.penguin_parts), so the conga line matches the friend and the skidders. The Snow-Plough Bot
# mini-boss is not modelled here (bosses stay out of the sprite set).
#   conga      13-1 / 13-5 conga-line belly-slider (aqPenguin swarm): an Adelie on its belly
#                                                                        walk (= slide, t) stun flat ko   feet, 18 px
#   congaLead  the conga leader: the same slider in a tiny red-and-white striped scarf      walk stun flat ko  feet, 18 px
#   krill      13-2 aqKrill swarm member: a little pink krill with a fan tail, paddling legs and long feelers
#                                                                                   fly (t) stun ko      centre, 14 px
#   egg        13-5 CARRY: the emperor penguin's egg (cream, speckled) wobbling      idle (t)             centre, 16 px
#   pedestal   13-5 egg pedestal: a ring of packed snow blocks with a soft nest       idle (one frame)     feet, 20 px
#   keeper     Station Store keeper: an Adelie in a little blue apron and a knitted bobble hat
#                                                                                   idle (t) wave (t)    feet, 40 px
# Render and pack:  W=/tmp/brady-sprites/aq_x; JOB=enemies:aq_extras LOOK=toon OUT=$W NAME=aq_x SCALE=3 OUTLINE=1.25 \
#   gui/bl.sh $W.log render_country.py; gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/aq_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, tube, cone, lathe,
                        torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, box_bm,
                        superellipsoid)
import aq_enemies as AE

PX = 28.1
KINDS = ['conga', 'congaLead', 'krill', 'egg', 'pedestal', 'keeper']
POSES = {
    'conga': ['walk', 'stun', 'flat', 'ko'],
    'congaLead': ['walk', 'stun', 'flat', 'ko'],
    'krill': ['fly', 'stun', 'ko'],
    'egg': ['idle'],
    'pedestal': ['idle'],
    'keeper': ['idle', 'wave'],
}
FRAMES = {('conga', 'walk'): (6, 12), ('congaLead', 'walk'): (6, 12), ('krill', 'fly'): (4, 12), ('egg', 'idle'): (4, 6),
          ('pedestal', 'idle'): (1, 1), ('keeper', 'idle'): (6, 6), ('keeper', 'wave'): (6, 6)}
ORIGIN = {'conga': 'feet', 'congaLead': 'feet', 'krill': 'centre', 'egg': 'centre', 'pedestal': 'feet', 'keeper': 'feet'}
HEIGHT = {'conga': 18 / PX, 'congaLead': 18 / PX, 'pedestal': 20 / PX, 'keeper': 40 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'conga': 30 / PX, 'congaLead': 30 / PX, 'krill': 14 / PX, 'egg': 16 / PX, 'pedestal': 30 / PX})

COLORS = {'jp_tongue': '#ff7a8a'}
for k in ('conga', 'congaLead', 'keeper'):
    COLORS.update({k + '_black': '#1c2030', k + '_white': '#ffffff', k + '_beak': '#ff8a3a', k + '_feet': '#ff9a6a',
                   k + '_dust': '#e8f6ff', k + '_eye_white': '#ffffff', k + '_pupil': '#1a1020', k + '_mouth': '#8a2a1a'})
COLORS.update({
    'penguin_cheek': '#ff9ab0',
    'congaLead_scarf': '#e8324a', 'congaLead_scarf2': '#ffffff',
    'keeper_apron': '#2a7ad8', 'keeper_apron2': '#ffd23a', 'keeper_hat': '#e8324a', 'keeper_hat2': '#ffffff',
    'krill_body': '#ff7a8a', 'krill_body2': '#ffb0b8', 'krill_leg': '#e8505e', 'krill_eye': '#1a1020', 'krill_glint': '#ffffff', 'krill_eye_white': '#ffffff', 'krill_pupil': '#1a1020',
    'egg_shell': '#fff4e0', 'egg_shell2': '#f0dcb8', 'egg_speck': '#c8a878',
    'pedestal_snow': '#eef6ff', 'pedestal_block': '#b8d8f2', 'pedestal_block2': '#a6cbea', 'pedestal_nest': '#d8c8a8',
    'pedestal_nest2': '#c0ac88',
})


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


def build_conga(root, pose, t):
    AE.penguin_pose('conga', root, 'skid' if pose == 'walk' else pose, t, s=0.92)


def build_congaLead(root, pose, t):
    AE.penguin_pose('congaLead', root, 'skid' if pose == 'walk' else pose, t, s=0.92)
    if pose != 'walk':
        # the scarf still shows when it stops (penguin_parts adds it only on the slide)
        s = 0.92 if pose not in ('stun', 'ko') else 0.92 * 0.85
        sz = 0.38 if pose == 'flat' else 1.0
        sx = 1.3 if pose == 'flat' else 1.0
        Mx = diag(s * sx, s * sx, s * sz)
        sc = V(0.03, 0, 0.66)
        make_part('scarf', torus(sc, 0.26, 0.08, axis=Vector((0.1, 0, 1)), seg=22, rseg=8), 'congaLead_scarf', root, Mx)
        end = [sc + V(0.14, -0.22, -0.04), sc + V(0.2, -0.25, -0.2), sc + V(0.17, -0.25, -0.36)]
        make_part('scarf_end', tube(end, 0.07, 0.055, seg=8), 'congaLead_scarf', root, Mx)
        make_part('scarf_st', box_bm((0.13, 0.12, 0.04)), 'congaLead_scarf2', root, Mx @ T(end[1]), subsurf=0)


def build_krill(root, pose, t):
    P = {'er': 0.045, 'skin': 'krill_body', 'lid': 0.0, 'look': Vector((0.6, -0.8, 0.0))}
    if pose == 'ko':
        Mx = rot_y(160)
        P['x'] = True
    elif pose == 'stun':
        Mx = rot_y(-25)
    else:
        Mx = rot_y(6 * math.sin(TAU * t))
    # a plump curved body (head at +X) tapering into a fan tail, pale bands across the back
    path = [V(0.2 - 0.07 * k, 0, 0.03 * math.sin(math.pi * k / 6) - 0.05 * (k / 6) ** 2) for k in range(7)]
    radii = [0.07, 0.085, 0.085, 0.078, 0.066, 0.052, 0.038]
    make_part('body', tube(path, 0, radii=radii, seg=12), 'krill_body', root, Mx)
    for k in (1, 3):
        ob = make_part('band%d' % k, torus(path[k], radii[k] * 0.98, 0.012, axis=(path[k + 1] - path[k - 1]).normalized(), seg=14, rseg=4), 'krill_body2', root, Mx, subsurf=0)
        ob['outline'] = 0
    tail = path[-1]
    for k, a in enumerate((-35, 0, 35)):
        d = Vector((-math.cos(math.radians(a)), 0, math.sin(math.radians(a))))
        make_part('fan%d' % k, cone(tail, tail + d * 0.1, 0.035, flat=0.4, seg=6), 'krill_body', root, Mx, subsurf=0)
    hc = path[0]
    if not P.get('x'):
        make_part('eye', sphere(hc + V(0.02, -0.06, 0.03), 0.032, seg=8, rows=5), 'krill_eye', root, Mx, subsurf=0)
        ob = make_part('glint', sphere(hc + V(0.03, -0.088, 0.042), 0.01, seg=6, rows=4), 'krill_glint', root, Mx, subsurf=0)
        ob['outline'] = 0
    else:
        eye_one('krill', 'r', hc + V(0.02, -0.055, 0.03), Vector((0.3, -1, 0)), root, Mx, P, er=0.03)
    for k, sg in enumerate((1, -1)):
        wav = 0.02 * math.sin(TAU * t + k)
        make_part('feeler%d' % k, tube([hc + V(0.05, sg * 0.01, 0.04), hc + V(0.13, sg * 0.02, 0.1 + wav), hc + V(0.2, sg * 0.03, 0.08 + wav)], 0.01, seg=4), 'krill_leg', root, Mx, subsurf=0)
    for k in range(4):
        ph = TAU * t + k * 0.9
        base = path[k + 1] + V(0, -0.03, -0.06)
        make_part('leg%d' % k, tube([base, base + V(0.03 * math.sin(ph), -0.01, -0.06)], 0.011, seg=4), 'krill_leg', root, Mx, subsurf=0)


def build_egg(root, pose, t):
    wob = 8 * math.sin(TAU * t)
    Mx = about(V(0, 0, -0.22), rot_y(wob))
    prof = [(0.0, -0.22), (0.12, -0.2), (0.18, -0.12), (0.19, 0.0), (0.16, 0.1), (0.1, 0.18), (0.0, 0.22)]
    make_part('shell', lathe(prof, seg=22), 'egg_shell', root, Mx)
    surf = lathe_surf(prof)
    make_part('shade', oval_patch(surf, -0.1, 0.07, -0.2, 1.1), 'egg_shell2', root, Mx)
    for k, (z, a) in enumerate(((0.08, -1.2), (-0.04, -1.7), (0.0, -0.8), (0.12, -1.9), (-0.1, -1.3))):
        p, n = surf(z, a)
        ob = make_part('speck%d' % k, sphere(p + n * 0.003, 0.016, seg=6, rows=4), 'egg_speck', root, Mx, subsurf=0)
        ob['outline'] = 0


def build_pedestal(root, pose, t):
    # a mound of packed snow ringed by snow blocks, a soft nest of down on top
    make_part('mound', lathe([(0.0, 0.0), (0.46, 0.0), (0.42, 0.12), (0.32, 0.26), (0.18, 0.33), (0.0, 0.35)], seg=24), 'pedestal_snow', root, None, subsurf=1)
    for k in range(7):
        a = math.pi * (1.05 + 0.9 * k / 6)
        make_part('block%d' % k, superellipsoid(V(0.42 * math.cos(a), 0.3 * math.sin(a), 0.09), 0.1, 0.08, 0.09, e=0.35, seg=12, rows=6),
                  'pedestal_block' if k % 2 else 'pedestal_block2', root, None, subsurf=0)
    make_part('nest', torus(V(0, 0.0, 0.37), 0.17, 0.065, axis=Z, seg=18, rseg=6), 'pedestal_nest', root, None, subsurf=1)
    make_part('nest_in', ellipsoid(V(0, 0, 0.36), X * 0.15, Y * 0.15, Z * 0.04, seg=14, rows=6), 'pedestal_nest2', root, None, subsurf=1)
    for k in range(7):
        a = TAU * k / 7 + 0.3
        ob = make_part('tuft%d' % k, cone(V(0.17 * math.cos(a), 0.17 * math.sin(a), 0.4), V(0.25 * math.cos(a), 0.25 * math.sin(a), 0.47), 0.03, seg=5), 'pedestal_nest2', root, None, subsurf=0)
        ob['outline'] = 0.5


def build_keeper(root, pose, t):
    P = dict(AE.STD_POSE['idle'])
    P.update(er=0.082, skin='keeper_black', blush=True)
    s = 1.32
    if pose == 'idle':
        f = math.sin(TAU * t)
        Mx = T((0, 0, 0.012 * abs(f))) @ about((0, 0, 0), rot_y(3 * f)) @ diag(s, s, s)
        HM, hc = AE.penguin_parts('keeper', root, Mx, P, t, flip_near=20 + 8 * f, flip_far=15, beak_open=0.0)
    else:
        P['lid'] = 1.0
        Mx = diag(s, s, s)
        HM, hc = AE.penguin_parts('keeper', root, Mx, P, t, flip_near=85 + 28 * math.sin(TAU * t), flip_far=-20, beak_open=0.7, head_tilt=-6)
    # the apron: a blue bib with a yellow pocket, tied at the back
    surf = lathe_surf(AE.PEN)
    make_part('apron', oval_patch(surf, 0.3, 0.22, -0.7, 0.75, rows=8, cols=12, thick=0.07), 'keeper_apron', root, Mx)
    make_part('pocket', oval_patch(surf, 0.22, 0.06, -0.75, 0.3, rows=4, cols=6, thick=0.1), 'keeper_apron2', root, Mx)
    make_part('strap', torus(V(0.0, 0, 0.48), 0.29, 0.018, axis=Z, seg=22, rseg=4), 'keeper_apron', root, Mx, subsurf=0)
    # a knitted bobble hat
    make_part('hat', lathe([(0.21, 0.0), (0.2, 0.08), (0.15, 0.16), (0.07, 0.21), (0.0, 0.22)], seg=20), 'keeper_hat', root, HM @ T(hc + V(-0.02, 0, 0.1)) @ rot_y(-12))
    make_part('hatband', torus(hc + V(-0.02, 0, 0.11), 0.205, 0.03, axis=Vector((-0.2, 0, 1)), seg=20, rseg=6), 'keeper_hat2', root, HM, subsurf=0)
    make_part('bobble', sphere(hc + V(-0.07, 0, 0.36), 0.06, seg=10, rows=6), 'keeper_hat2', root, HM)


BUILDERS = {'conga': build_conga, 'congaLead': build_congaLead, 'krill': build_krill, 'egg': build_egg,
            'pedestal': build_pedestal, 'keeper': build_keeper}


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
