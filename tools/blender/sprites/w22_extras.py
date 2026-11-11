# w22_extras: the NEW World 22 object skins planned by the level overhaul for 22-5 "The Writer's Desk"
# (docs/design/LEVEL_OVERHAUL.md §2/§8: typewriter keys, paperclip spring, ink pot), rendered ahead of the level work
# into their own atlas `w22_x` (not referenced by the game yet). The echo stays code-drawn; the envelope's loose-mail
# 'flutter' pose is in the live `w22` atlas.
#   key      a giant round typewriter key on its lever: cream cap in a chrome ring, a letter on top  idle  down   feet, 32 px
#            (idle = up; down = pressed, for the beat blocks that press down)
#   clip     a paperclip bent into a spring                                                    idle  boing        feet, 32 px
#            (idle = relaxed; boing = squashed, the frame the game shows as Brady lands)
#   inkpot   a squat ink pot with a quill and a drip of ink                                    idle (one frame)   feet, 40 px
# Render and pack:  W=/tmp/brady-sprites/w22_x; JOB=enemies:w22_extras LOOK=toon OUT=$W NAME=w22_x SCALE=3 OUTLINE=1.25 \
#   gui/bl.sh $W.log render_country.py; gui/bl.sh $W.pack.log pack_atlas.py $W/spec.json ../../../assets/sprites/super-brady-o-world/w22_x
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, tube, cone, lathe, torus,
                        prism, make_part, new_root, box_bm, superellipsoid)
import w22_kit as WK

PX = 28.1
KINDS = ['key', 'clip', 'inkpot']
POSES = {'key': ['idle', 'down'], 'clip': ['idle', 'boing'], 'inkpot': ['idle']}
FRAMES = {(k, p): (1, 1) for k in KINDS for p in POSES[k]}
ORIGIN = {k: 'feet' for k in KINDS}
HEIGHT = {'key': 32 / PX, 'clip': 32 / PX, 'inkpot': 40 / PX}
SIZE = dict(HEIGHT)
COLORS = {
    'key_cap': '#fff6e4', 'key_ring': '#c8ccd8', 'key_ring2': '#8a90a4', 'key_lever': '#4a4a5a', 'key_letter': '#3a2a5a',
    'clip_wire': '#c8d0dc', 'clip_wire2': '#9aa4b4',
    'inkpot_glass': '#2a2a4a', 'inkpot_glass2': '#4a4a7a', 'inkpot_label': '#f4ecd8', 'inkpot_cap': '#c8a040', 'inkpot_ink': '#1a1a3a',
    'inkpot_quill': '#f4f0e8', 'inkpot_quill2': '#c8b8d8', 'inkpot_letter': '#3a2a5a',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


def build_key(root, pose, t):
    press = 0.18 if pose == 'down' else 0.0
    make_part('lever', tube([V(-0.1, 0.06, 0.0), V(0.0, 0.06, 0.4 - press)], 0.05, seg=8), 'key_lever', root, None, subsurf=0)
    make_part('stem', tube([V(0, 0, 0.3 - press), V(0, 0, 0.62 - press)], 0.07, seg=10), 'key_ring2', root, None, subsurf=0)
    c = V(0, 0, 0.72 - press)
    TM = about(c, rot_x(28))      # the cap tilted toward the camera so its face (and its 22) reads
    make_part('ring', lathe([(0.0, -0.1), (0.5, -0.1), (0.55, -0.04), (0.55, 0.06), (0.5, 0.1), (0.0, 0.1)], seg=28), 'key_ring', root, TM @ T(c), subsurf=1)
    make_part('cap', lathe([(0.0, 0.0), (0.46, 0.0), (0.46, 0.06), (0.4, 0.12), (0.0, 0.11)], seg=28), 'key_cap', root, TM @ T(c + V(0, 0, 0.04)), subsurf=1)
    ob = make_part('letter', WK.text_bm('22', size=0.34, extrude=0.01), 'key_letter', root, TM @ T(c + V(0, 0, 0.17)) @ rot_x(-90), subsurf=0, smooth=False)
    ob['outline'] = 0


def build_clip(root, pose, t):
    sq = 0.55 if pose == 'boing' else 1.0
    # a paperclip's loops stretched into a zigzag spring, seen from the side
    pts = []
    n = 5
    for k in range(n * 2 + 1):
        z = 0.05 + (0.85 * sq) * k / (n * 2)
        x = 0.3 * (1 if k % 2 else -1) if 0 < k < n * 2 else 0.0
        pts.append(V(x, 0, z))
    smooth = []
    for a, b in zip(pts, pts[1:]):
        for j in range(4):
            u = j / 4
            smooth.append(a.lerp(b, u) + V(0, 0.04 * math.sin(math.pi * u), 0))
    smooth.append(pts[-1])
    make_part('wire', tube(smooth, 0.045, seg=8), 'clip_wire', root, None, subsurf=1)
    make_part('foot', superellipsoid(V(0, 0, 0.03), 0.34, 0.12, 0.03, e=0.5, seg=16, rows=6), 'clip_wire2', root, None, subsurf=0)
    make_part('top', superellipsoid(V(0, 0, 0.92 * sq + 0.05), 0.36, 0.14, 0.035, e=0.5, seg=16, rows=6), 'clip_wire2', root, None, subsurf=0)


def build_inkpot(root, pose, t):
    make_part('pot', lathe([(0.0, 0.0), (0.5, 0.0), (0.54, 0.3), (0.46, 0.5), (0.24, 0.6), (0.24, 0.72), (0.0, 0.72)], seg=24), 'inkpot_glass', root, None, subsurf=1)
    ob = make_part('shine', prism([V(-0.38, 0, 0.12), V(-0.3, 0, 0.12), V(-0.26, 0, 0.42), V(-0.34, 0, 0.42)], Y * 0.01), 'inkpot_glass2', root, T((0, -0.5, 0)), subsurf=0)
    ob['outline'] = 0
    make_part('label', box_bm((0.56, 0.02, 0.24), bevel=0.01), 'inkpot_label', root, T((0.04, -0.52, 0.26)), subsurf=0)
    ob = make_part('num', WK.text_bm('22', size=0.18, extrude=0.008), 'inkpot_letter', root, T((0.04, -0.54, 0.26)), subsurf=0, smooth=False)
    ob['outline'] = 0
    make_part('rim', torus(V(0, 0, 0.72), 0.25, 0.04, seg=20, rseg=6), 'inkpot_cap', root, None, subsurf=0)
    make_part('ink', ellipsoid(V(0, 0, 0.73), X * 0.22, Y * 0.22, Z * 0.02, seg=16, rows=4), 'inkpot_ink', root, None, subsurf=0)
    make_part('quill', prism([V(0.0, 0, 0.0), V(0.12, 0, 0.5), V(0.1, 0, 1.2), V(0.0, 0, 1.36), V(-0.06, 0, 1.0), V(-0.03, 0, 0.45)][::-1], Y * 0.04), 'inkpot_quill', root, T((0.05, 0.02, 0.6)) @ rot_y(18), subsurf=1)
    make_part('shaft', tube([V(0.05, -0.02, 0.6), V(0.5, -0.02, 1.85)], 0.015, seg=4), 'inkpot_quill2', root, None, subsurf=0)
    make_part('drip', tube([V(0.2, -0.24, 0.66), V(0.3, -0.36, 0.5), V(0.32, -0.42, 0.3)], 0.03, 0.045, seg=8), 'inkpot_ink', root, None, subsurf=1)


BUILDERS = {'key': build_key, 'clip': build_clip, 'inkpot': build_inkpot}


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
