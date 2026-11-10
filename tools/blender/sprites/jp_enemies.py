# jp_enemies: the Japan cast of Super Brady-O World (world 11) for the pre-rendered Fiesta Toon sprite pipeline.
# All original cartoon designs (food, toys, animals and folklore objects; no existing characters). Same conventions as
# ma_enemies.py / es_enemies.py, with the helpers copied into jp_charkit.py:
#   Z up, every character FACES +X (screen-right), the sprite camera looks along +Y from -Y.  1 m = 28.1 px.
#   Feet-origin kinds stand with their feet on z = 0; centre-origin kinds are centred on the origin.  Plain Principled
#   materials named <kind>_<part>; materials whose name contains 'glow' render unlit.  Every object is parented to one
#   Empty named after the kind and carries obj['sprite_part'].
#
#   onigiri    a lumpy rice-ball triangle with a nori belt and a pickled plum peeking out of the top  walk hop stun flat ko
#   beetle     a chestnut rhinoceros beetle with a forked horn; lowers it to charge, flips on its back when KO'd
#                                                                                   walk notice charge stun flat ko
#   crow       a slate-blue crow (light enough to read against the night city)            fly swoop stun ko   centre
#   tamago     egg-omelette nigiri: a striped yellow slab on a rice block, belted with nori     walk stun flat ko
#   tako       a takoyaki ball: sauce cap, mayo zigzag, green flecks, waving bonito flakes and a little tentacle
#                                                                                   walk curl roll stun flat ko
#   wasabi     a cross dollop of wasabi with a curly tip, sitting on a shiso leaf               walk hop stun flat ko
#   capsule    a capsule toy: a pink base and a clear blue dome with a yellow toy chick inside walk curl roll stun flat ko
#   luckyCat   a beckoning-cat toy of our own: chubby calico, happy shut eyes, a red collar and bell, a koban held
#              against its belly, sitting on a red cushion; waves, then flings its paw         walk idle throw stun flat ko
#   umbrella   the hopping one-eyed paper umbrella of folklore on one wooden leg and a geta     walk hop stun flat ko
#   umbrellaFly a runaway blue umbrella, blown open and tumbling, one eye on the canopy       fly swoop stun ko   centre
#   top        a wooden spinning top with red / yellow / indigo bands                          walk curl roll stun flat ko
#   koi        a white-and-orange koi leaping out of the pond                                   up down ko          centre
#   shiba      the friend (custom class JpShiba): a sitting shiba in a red bandana with the nunchucks in its mouth
#              (idle) and, once they're handed over, waving with its tongue out (wave)          idle wave
#   coin       the GOLDEN KOBAN: an oval gold coin with stamped bands                           spin                centre
#   star       the GOLDEN SAKURA: a gold cherry blossom with sparkles                           idle (hover)        centre
#   qblock     the item block: a red lacquer bento box with a gold blossom on each face         idle (frame 000)    centre
#   used       the same box spent: dull brown lacquer, no blossom                              idle                centre
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        lathe, torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        mouth_bm, biped_legs, quad_legs, superellipsoid, ring_mesh, box_bm, perp_frame, smooth01, xf)

PX = 28.1
KINDS = ['onigiri', 'beetle', 'crow', 'tamago', 'tako', 'wasabi', 'capsule', 'luckyCat', 'umbrella', 'umbrellaFly', 'top',
         'koi', 'shiba', 'coin', 'star', 'qblock', 'used']
POSES = {
    'onigiri': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'beetle': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'crow': ['fly', 'swoop', 'stun', 'ko'],
    'tamago': ['walk', 'stun', 'flat', 'ko'],
    'tako': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'wasabi': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'capsule': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'luckyCat': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'umbrella': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'umbrellaFly': ['fly', 'swoop', 'stun', 'ko'],
    'top': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'koi': ['up', 'down', 'ko'],
    'shiba': ['idle', 'wave'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('luckyCat', 'idle'): (4, 5), ('luckyCat', 'throw'): (4, 6),
          ('shiba', 'idle'): (4, 5), ('shiba', 'wave'): (4, 6)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'crow': 'centre', 'umbrellaFly': 'centre', 'koi': 'centre', 'coin': 'centre', 'star': 'centre',
               'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'onigiri': 24 / PX, 'beetle': 22 / PX, 'tamago': 22 / PX, 'tako': 22 / PX, 'wasabi': 20 / PX, 'capsule': 22 / PX,
          'luckyCat': 40 / PX, 'umbrella': 44 / PX, 'top': 24 / PX, 'shiba': 30 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'beetle': 30 / PX, 'crow': 30 / PX, 'umbrellaFly': 34 / PX, 'koi': 30 / PX, 'coin': 16 / PX, 'star': 24 / PX,
             'qblock': 32 / PX, 'used': 32 / PX, 'shiba': 34 / PX})

COLORS = {
    'onigiri_rice': '#fbf8ee', 'onigiri_grain': '#efe8d6', 'onigiri_nori': '#1e3226', 'onigiri_nori2': '#2e4a36',
    'onigiri_plum': '#d8324a', 'onigiri_cheek': '#ffa8b4', 'onigiri_feet': '#e2d8c0',
    'onigiri_eye_white': '#fbfbf2', 'onigiri_pupil': '#1a1020', 'onigiri_mouth': '#5a1a2a',
    'beetle_shell': '#8a3c1e', 'beetle_shell2': '#6a2a14', 'beetle_shine': '#d88a5a', 'beetle_dark': '#3a1a10',
    'beetle_leg': '#2a140c', 'beetle_eye_white': '#fbfbf2', 'beetle_pupil': '#1a1020', 'beetle_mouth': '#1a0a08',
    'crow_body': '#4a5470', 'crow_body2': '#5e6a8a', 'crow_wing': '#3a4260', 'crow_tip': '#7a86a8', 'crow_beak': '#9aa0b0',
    'crow_feet': '#8a8a98', 'crow_eye_white': '#fbfbf2', 'crow_pupil': '#1a1020', 'crow_mouth': '#2a2030',
    'tamago_egg': '#ffd23a', 'tamago_egg2': '#f0b81a', 'tamago_brown': '#d8902a', 'tamago_rice': '#fbf8ee',
    'tamago_grain': '#efe8d6', 'tamago_nori': '#1e3226', 'tamago_feet': '#e2d8c0',
    'tamago_eye_white': '#fbfbf2', 'tamago_pupil': '#1a1020', 'tamago_mouth': '#7a3a10',
    'tako_ball': '#f2b24e', 'tako_crisp': '#d88a32', 'tako_sauce': '#6a3018', 'tako_gloss': '#b8683a', 'tako_mayo': '#fff8e8', 'tako_nori': '#4a9a3a',
    'tako_flake': '#f0b8a0', 'tako_flake2': '#e89a80', 'tako_tent': '#e86a6a', 'tako_feet': '#b8702a',
    'tako_eye_white': '#fbfbf2', 'tako_pupil': '#1a1020', 'tako_mouth': '#6a1424', 'xtako_mouth': '#5a2a14',
    'wasabi_paste': '#8ac84a', 'wasabi_paste2': '#6aa83a', 'wasabi_hi': '#c8ec8a', 'wasabi_leaf': '#4aa83a', 'wasabi_vein': '#8ad06a',
    'wasabi_feet': '#5a9a2a', 'wasabi_eye_white': '#fbfbf2', 'wasabi_pupil': '#1a1020', 'wasabi_mouth': '#6a1424', 'xwasabi_mouth': '#2a4a1a', 'wasabi_tooth': '#ffffff',
    'capsule_base': '#ff4a8a', 'capsule_dome': '#a8dcff', 'capsule_dome2': '#e8f8ff', 'capsule_band': '#ffffff',
    'capsule_toy': '#ffd23a', 'capsule_toybeak': '#ff8a2a', 'capsule_feet': '#c8306a',
    'capsule_eye_white': '#fbfbf2', 'capsule_pupil': '#1a1020', 'capsule_mouth': '#6a1424', 'xcapsule_mouth': '#6a1a3a',
    'luckyCat_fur': '#fbf8f0', 'luckyCat_patch': '#f09a3a', 'luckyCat_patch2': '#3a3a44', 'luckyCat_ear': '#ffb0c0',
    'luckyCat_collar': '#e8384f', 'luckyCat_bell': '#ffd23a', 'luckyCat_coin': '#ffd24a', 'luckyCat_coin2': '#c8901a',
    'luckyCat_cushion': '#c8322a', 'luckyCat_cushion2': '#ffd23a', 'luckyCat_whisker': '#8a8a96', 'luckyCat_pad': '#ff9ab0',
    'luckyCat_eye_white': '#fbfbf2', 'luckyCat_pupil': '#1a1020', 'luckyCat_mouth': '#5a2a30',
    'umbrella_paper': '#d8322a', 'umbrella_paper2': '#b8221e', 'umbrella_band': '#fff4e0', 'umbrella_rib': '#7a4a24',
    'umbrella_leg': '#a8743a', 'umbrella_geta': '#8a5a2a', 'umbrella_strap': '#26408a', 'umbrella_tongue': '#ff6a8a',
    'umbrella_eye_white': '#fbfbf2', 'umbrella_pupil': '#1a1020', 'umbrella_mouth': '#5a0e14',
    'umbrellaFly_cloth': '#3a72d8', 'umbrellaFly_cloth2': '#2a58b8', 'umbrellaFly_rib': '#d8d8e0', 'umbrellaFly_handle': '#8a5a2a',
    'umbrellaFly_tip': '#d8d8e0', 'umbrellaFly_eye_white': '#fbfbf2', 'umbrellaFly_pupil': '#1a1020', 'umbrellaFly_mouth': '#1a2a5a', 'umbrellaFly_x': '#000000',
    'top_wood': '#d8a466', 'top_wood2': '#b8844a', 'top_red': '#e8384f', 'top_yellow': '#ffd23a', 'top_blue': '#26408a',
    'top_tip': '#9a9aa8', 'top_eye_white': '#fbfbf2', 'top_pupil': '#1a1020', 'top_mouth': '#5a2a14',
    'koi_white': '#fbfbf6', 'koi_orange': '#ff6a1a', 'koi_red': '#e8382a', 'koi_fin': '#ffe8d8', 'koi_lip': '#ffb8a0',
    'koi_eye_white': '#fbfbf2', 'koi_pupil': '#1a1020', 'koi_mouth': '#a83a2a',
    'shiba_fur': '#e0893a', 'shiba_cream': '#fff4e2', 'shiba_dark': '#b8662a', 'shiba_nose': '#1a1214', 'shiba_ear': '#ffc8a8',
    'shiba_bandana': '#e8384f', 'shiba_stick': '#a8603a', 'shiba_cap': '#ffd23a', 'shiba_chain': '#c8c8d4', 'shiba_tongue': '#ff7a8a',
    'shiba_eye_white': '#fbfbf2', 'shiba_pupil': '#1a1020', 'shiba_mouth': '#3a1a1a',
    'coin_gold': '#ffd24a', 'coin_gold2': '#e8a820', 'coin_shine': '#fff6c0',
    'star_gold': '#ffd24a', 'star_gold2': '#ffe890', 'star_core': '#e8a820', 'star_glow': '#fff6c0',
    'jp_tongue': '#ff7a8a',
    'qblock_lacquer': '#d8283a', 'qblock_black': '#2a141a', 'qblock_gold': '#ffcc3a', 'qblock_gold2': '#e8a820',
    'used_lacquer': '#7a4a44', 'used_black': '#3a2a2a', 'used_dull': '#9a7a6a',
}
M.use(COLORS, KINDS)

STD_POSE = {
    'walk':   dict(sx=1.00, sz=1.00, lean=3,   lid=0.12, mouth='grin',   feet='walk'),
    'idle':   dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='stand'),
    'hop':    dict(sx=0.92, sz=1.12, lean=-4,  lid=0.00, mouth='grin',   feet='tuck', eye=1.1),
    'curl':   dict(sx=1.05, sz=0.95, lean=14,  lid=0.70, mouth='small',  feet='tuck'),
    'roll':   dict(sx=1.00, sz=1.00, lean=0,   lid=1.00, mouth=None,     feet=None),
    'notice': dict(sx=0.96, sz=1.06, lean=-6,  lid=0.00, mouth='open',   feet='stand', eye=1.2, pupil=0.7),
    'charge': dict(sx=1.06, sz=0.95, lean=14,  lid=0.30, mouth='grin',   feet='walk', angry=True),
    'throw':  dict(sx=1.00, sz=1.00, lean=0,   lid=0.00, mouth='grin',   feet='stand'),
    'stun':   dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat':   dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':     dict(sx=1.00, sz=0.95, lean=-12, lid=0.00, mouth='o',      feet='limp', x=True),
}


def clear(kind=None):
    M.use(COLORS, KINDS)
    M.clear(kind)


# ---------------------------------------------------------------- flat-face helpers
def face_frame(n):
    """(n, up, right) for a face looking along n (right = screen-right on a camera-facing face)."""
    n = Vector(n).normalized()
    up = (Z - n * n.z).normalized() if abs(n.z) < 0.95 else X.copy()
    return n, up, up.cross(n)


def flat_mouth(kind, root, Mx, style, c, n, w, name='mouth', mat=None):
    """A mouth on a (locally flat) face at c looking along n, about w wide."""
    if not style:
        return
    mat = mat or kind + '_mouth'
    n, up, s = face_frame(n)
    c = Vector(c) + n * 0.006
    if style in ('grin', 'small', 'open_grin'):
        k = 1.0 if style == 'grin' else 0.6
        pts = [c - s * w / 2 * k + up * 0.004]
        for j in range(1, 10):
            a = math.pi * j / 10
            pts.append(c - s * math.cos(a) * w / 2 * k - up * math.sin(a) * w * 0.42 * k)
        pts.append(c + s * w / 2 * k + up * 0.004)
        make_part(name, prism(pts[::-1], n * 0.02), mat, root, Mx, subsurf=0, smooth=False)
        return
    if style in ('o', 'open'):
        kk = 0.5 if style == 'o' else 0.85
        make_part(name, ellipsoid(c - up * w * 0.15, s * w * 0.32 * kk, up * w * 0.4 * kk, n * 0.02, seg=14, rows=8), mat, root, Mx)
        return
    path = []
    for j in range(13):
        u = j / 12
        z = 0.0
        if style == 'wobble':
            z = 0.12 * w * math.sin(3 * math.pi * u)
        elif style == 'smile':
            z = 0.22 * w * (4 * (u - 0.5) ** 2 - 1)
        elif style == 'frown':
            z = -0.22 * w * (4 * (u - 0.5) ** 2 - 1)
        path.append(c + s * (u - 0.5) * w + up * z)
    make_part(name, tube(path, max(0.012, w * 0.07), seg=8), mat, root, Mx, subsurf=1)


def open_mouth(kind, root, Mx, surf, style, z0, a0, a1, scale=1.0, tongue=True):
    """mouth_bm, but a 'grin' / 'smile' becomes an open dark-red crescent with a pink tongue (reads as a mouth, never
    as a moustache); other styles pass through."""
    if not style:
        return
    if style in ('grin', 'smile'):
        make_part('mouth', mouth_bm(surf, 'grin', z0, a0, a1, scale=scale), kind + '_mouth', root, Mx)
        if tongue:
            am = (a0 + a1) / 2
            make_part('tongue', oval_patch(surf, z0 - 0.035 * scale, 0.016 * scale, am, abs(a1 - a0) * 0.18, thick=0.02), 'jp_tongue', root, Mx)
        return
    make_part('mouth', mouth_bm(surf, style, z0, a0, a1, scale=scale), kind + '_mouth', root, Mx)


def blush(kind, root, Mx, c, n, r, mat=None, name='cheek'):
    n, up, s = face_frame(n)
    make_part(name, ellipsoid(Vector(c) + n * 0.004, s * r, up * r * 0.6, n * r * 0.18, seg=12, rows=6), mat or kind + '_cheek', root, Mx, subsurf=1)


def rounded_poly(corners, r, k=5):
    """A rounded polygon (list of (x, z) corners, counter-clockwise) with corner radius r, as (x, z) points."""
    out = []
    n = len(corners)
    for i in range(n):
        p0, p1, p2 = Vector(corners[i - 1]), Vector(corners[i]), Vector(corners[(i + 1) % n])
        a, b = (p0 - p1).normalized(), (p2 - p1).normalized()
        q0, q1 = p1 + a * r, p1 + b * r
        for j in range(k + 1):
            u = j / k
            out.append(tuple((q0 * (1 - u) ** 2 + p1 * 2 * u * (1 - u) + q1 * u * u)))
    return out


def puffy_slab(pts2, half_depth, at=(0, 0, 0), rows=6, squish=0.18, y_off=0.0):
    """A pillow: the (x, z) outline extruded through y in [-half_depth, half_depth], its rim rounding inward toward
    the front and back faces (ring scale 1 at the middle, 1 - squish at the faces)."""
    c = Vector((sum(p[0] for p in pts2) / len(pts2), 0, sum(p[1] for p in pts2) / len(pts2)))
    rings = []
    rings.append(Vector(at) + V(c.x, y_off - half_depth, c.z))
    for i in range(rows + 1):
        w = -1 + 2 * i / rows
        sc = 1 - squish * (1 - math.sqrt(max(0.0, 1 - w * w)))
        if i in (0, rows):
            sc = 1 - squish
        y = y_off + w * half_depth
        rings.append([Vector(at) + V(c.x + (p[0] - c.x) * sc, y, c.z + (p[1] - c.z) * sc) for p in pts2[::-1]])
    rings.append(Vector(at) + V(c.x, y_off + half_depth, c.z))
    return ring_mesh(rings)


def stub_legs(kind, root, Mx, P, t, hip_z, spread, foot, leg_r, mat, A=0.1, H=0.05):
    biped_legs(kind, root, Mx, P, t, (0.0, spread, hip_z), foot, leg_r, mat, A=A, H=H)


def walk_bob(pose, P, t, amp=0.02, sway=3):
    bob = 0.0
    lean = P['lean']
    if pose == 'walk':
        bob = amp * abs(math.sin(TAU * t))
        lean += sway * math.sin(TAU * t)
    return bob, lean


# ================================================================ ONIGIRI
def _lumpy(pts, amp, seed=3):
    """Nudge an outline's points in and out a little so the rim reads as packed rice."""
    out = []
    n = len(pts)
    cx = sum(p[0] for p in pts) / n
    cz = sum(p[1] for p in pts) / n
    for i, (x, z) in enumerate(pts):
        k = 1 + amp * math.sin(i * 2.3 + seed) * math.sin(i * 0.9 + seed * 0.5)
        out.append((cx + (x - cx) * k, cz + (z - cz) * k))
    return out


ONI = _lumpy(rounded_poly([(-0.46, 0.0), (0.46, 0.0), (0.0, 0.78)], 0.17, 7), 0.035)


def build_onigiri(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='onigiri_rice')
    bob, lean = walk_bob(pose, P, t)
    lift = 0.1 if pose == 'hop' else 0.0
    base = 0.1
    Mx = T((0, 0, bob + lift + base)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('body', puffy_slab(ONI, 0.22, squish=0.2), 'onigiri_rice', root, Mx)
    # nori belt: a wrap round the bottom middle
    make_part('nori', box_bm((0.36, 0.48, 0.34), bevel=0.03, segments=2), 'onigiri_nori', root, Mx @ T((0.0, 0, 0.15)), subsurf=0)
    make_part('nori_hi', box_bm((0.28, 0.02, 0.022), bevel=0.0), 'onigiri_nori2', root, Mx @ T((0.0, -0.245, 0.27)), subsurf=0)
    # a pickled plum peeking out of the top
    make_part('plum', sphere(V(0.0, -0.17, 0.64), 0.075, seg=14, rows=8), 'onigiri_plum', root, Mx)
    make_part('plum_hi', sphere(V(-0.02, -0.235, 0.67), 0.02, seg=8, rows=4), 'onigiri_rice', root, Mx, subsurf=0)
    n = Vector((0.3, -1, 0)).normalized()
    for side, x in (('r', 0.15), ('l', -0.05)):
        eye_one('onigiri', side, V(x, -0.2, 0.45), n, root, Mx, P)
    if not P.get('x') and pose != 'flat':
        for k, x in enumerate((-0.14, 0.3)):
            blush('onigiri', root, Mx, V(x, -0.215, 0.36), n, 0.045, name='cheek%d' % k)
    flat_mouth('onigiri', root, Mx, P['mouth'], V(0.07, -0.222, 0.35), n, 0.11)
    legM = T((0, 0, lift))
    biped_legs('onigiri', root, legM, P, t, (0.0, 0.12, 0.14), (0.09, 0.06, 0.04), 0.035, 'onigiri_feet')


# ================================================================ BEETLE (charger)
def build_beetle(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='beetle_dark')
    sx, sz = P['sx'], P['sz']
    pitch = {'walk': 0, 'notice': -14, 'charge': 10, 'stun': -6, 'flat': 0, 'ko': -22}[pose]
    bob = 0.015 * abs(math.sin(TAU * t)) if pose == 'walk' else 0.0
    Mx = T((0, 0, bob)) @ about((0.2, 0, 0.1), rot_y(pitch)) @ diag(sx, sx, sz)
    # wing cases: a glossy dome with a seam and a shine
    ec, er_ = V(-0.14, 0, 0.36), (0.36, 0.25, 0.23)
    make_part('elytra', blob(ec, *er_, seg=26, rows=14), 'beetle_shell', root, Mx)
    surf = ellipsoid_surf(ec, *er_)
    make_part('shine', oval_patch(surf, ec.z + 0.15, 0.035, -1.9, 0.6, thick=0.014), 'beetle_shine', root, Mx)
    seam = []
    for k in range(9):
        x = ec.x - er_[0] * 0.92 + 1.84 * er_[0] * k / 8
        seam.append(V(x, -0.03, ec.z + er_[2] * math.sqrt(max(0.0, 1 - ((x - ec.x) / er_[0]) ** 2)) * 0.98 + 0.004))
    make_part('seam', tube(seam, 0.012, seg=6), 'beetle_shell2', root, Mx, subsurf=1)
    # thorax and head
    tc = V(0.22, 0, 0.36)
    make_part('thorax', blob(tc, 0.15, 0.21, 0.16, seg=20, rows=12), 'beetle_shell2', root, Mx)
    hc = V(0.38, 0, 0.3)
    make_part('head', blob(hc, 0.12, 0.14, 0.11, seg=18, rows=10), 'beetle_dark', root, Mx)
    # the forked horn: up and forward from the head, two prongs at the tip
    if pose == 'charge':
        horn = [hc + V(0.08, 0, 0.02), hc + V(0.22, 0, 0.05), hc + V(0.36, 0, 0.1), hc + V(0.44, 0, 0.18)]
    else:
        lift = {'notice': 0.05}.get(pose, 0.0)
        horn = [hc + V(0.08, 0, 0.02), hc + V(0.18, 0, 0.08), hc + V(0.24, 0, 0.2 + lift), hc + V(0.24, 0, 0.32 + lift)]
    make_part('horn', tube(horn, 0.05, seg=10, radii=[0.06, 0.05, 0.042, 0.034]), 'beetle_shell2', root, Mx)
    tip = horn[-1]
    d = (horn[-1] - horn[-2]).normalized()
    side = Vector((d.z, 0, -d.x))
    for k, sg in enumerate((-1, 1)):
        prong = [tip, tip + d * 0.04 + side * sg * 0.04, tip + d * 0.08 + side * sg * 0.07]
        make_part('prong%d' % k, tube(prong, 0.028, 0.016, seg=8), 'beetle_shell2', root, Mx, subsurf=1)
    make_part('thorn', cone(tc + V(0.04, 0, 0.13), tc + V(0.12, 0, 0.24), 0.035, seg=8), 'beetle_shell2', root, Mx, subsurf=1)
    hsurf = ellipsoid_surf(hc, 0.12, 0.14, 0.11)
    p, n = hsurf(hc.z + 0.03, -1.05)
    eye_one('beetle', 'r', p - n * 0.01, n, root, Mx, P, er=0.08)
    p2, n2 = hsurf(hc.z + 0.04, -1.75)
    eye_one('beetle', 'l', p2 - n2 * 0.01, n2, root, Mx, P, er=0.07)
    if P.get('angry'):
        brow('beetle', 'r', p - n * 0.01, n, root, Mx, 0.08)
        brow('beetle', 'l', p2 - n2 * 0.01, n2, root, Mx, 0.07)
    # six thin legs (three per side), a tripod walk
    moving = pose in ('walk', 'charge')
    for side_name, sg in (('l', 1), ('r', -1)):
        for k, x in enumerate((0.24, 0.02, -0.22)):
            ph = TAU * t + (math.pi if (k % 2) ^ (side_name == 'r') else 0)
            dx = 0.07 * math.sin(ph) if moving else 0.0
            dz = 0.05 * max(0.0, math.cos(ph)) if moving else 0.0
            out = 1 if k == 0 else -1
            hip = V(x, sg * 0.12, 0.22)
            knee = V(x + 0.05 * out, sg * 0.24, 0.2 + dz)
            foot = V(x + dx + 0.1 * out, sg * 0.26, 0.012 + dz)
            if pose == 'flat':
                knee, foot = V(x + 0.06 * out, sg * 0.34, 0.06), V(x + 0.14 * out, sg * 0.4, 0.02)
            elif pose == 'ko':
                knee, foot = V(x + 0.06 * out, sg * 0.26, 0.14), V(x + 0.08 * out, sg * 0.3, 0.3 + 0.05 * k)
            make_part('leg_%s%d' % (side_name, k), tube([hip, knee, foot], 0.022, 0.016, seg=6), 'beetle_leg', root, Mx, subsurf=1)
    for side_name, sg in (('l', 1), ('r', -1)):
        make_part('feeler_' + side_name, tube([hc + V(0.08, sg * 0.06, -0.04), hc + V(0.16, sg * 0.1, -0.09), hc + V(0.2, sg * 0.12, -0.06)], 0.012, 0.01, seg=5), 'beetle_leg', root, Mx, subsurf=1)


# ================================================================ CROW (flyer, centre)
WING = [(0.1, -0.03), (0.09, 0.1), (0.02, 0.22), (-0.08, 0.33), (-0.15, 0.4), (-0.18, 0.34), (-0.24, 0.38), (-0.26, 0.3),
        (-0.33, 0.32), (-0.33, 0.24), (-0.4, 0.24), (-0.37, 0.16), (-0.3, 0.08), (-0.18, 0.0), (-0.06, -0.04)]


def crow_wing(sh, up):
    """A broad wing in the XZ plane from the shoulder sh, four primary feather fingers at the tip; up in -1..1 raises
    (or lowers) it."""
    k = 1.0 + 0.9 * up if up >= 0 else 1.0 + 1.6 * up
    return [sh + V(x * (1 - 0.25 * abs(up)), 0, z * k) for x, z in WING]


def build_crow(root, pose, t):
    P = {'er': 0.075, 'skin': 'crow_body', 'lid': 0.15, 'look': Vector((0.55, -0.85, -0.1))}
    flap, tilt, roll = 0.0, 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.9, 24
        P['lid'] = 0.0
        P['eye'] = 1.1
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.6, True, 0.5
    else:
        flap, P['x'], roll = -0.5, True, 150
    Mx = rot_y(tilt) @ (rot_x(roll) if roll else Matrix.Identity(4))
    bc = V(-0.05, 0, -0.04)
    up = flap
    sh = V(-0.02, 0, 0.04)
    make_part('wing_far', prism(crow_wing(sh, up)[::-1], Y * 0.04), 'crow_wing', root, Mx @ T((0, 0.12, 0)), subsurf=1)
    make_part('body', blob(bc, 0.27, 0.15, 0.15, seg=22, rows=12), 'crow_body', root, Mx)
    make_part('chest', ell_cap(bc, (0.27, 0.15, 0.15), (0.5, -0.6, -0.6), 50, seg=16, rows=5), 'crow_body2', root, Mx)
    hc, hr = V(0.22, 0, 0.08), 0.14
    make_part('head', sphere(hc, hr, seg=20, rows=12), 'crow_body', root, Mx)
    make_part('tuft', cone(hc + V(-0.02, 0, 0.11), hc + V(-0.1, 0, 0.21), 0.04, flat=0.4, seg=8), 'crow_body', root, Mx, subsurf=1)
    make_part('beak', cone(hc + V(0.1, 0, -0.01), hc + V(0.31, 0, -0.04), 0.06, flat=0.7, seg=10), 'crow_beak', root, Mx)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    p, n = hsurf(hc.z + 0.04, -0.8)
    eye_one('crow', 'r', p - n * 0.01, n, root, Mx, P, er=0.075)
    p, n = hsurf(hc.z + 0.05, -1.6)
    eye_one('crow', 'l', p - n * 0.01, n, root, Mx, P, er=0.065)
    tb = bc + V(-0.22, 0, 0.0)
    tail = [tb + V(0, 0, 0.05), tb + V(-0.26, 0, 0.12), tb + V(-0.31, 0, 0.04), tb + V(-0.3, 0, -0.06), tb + V(-0.26, 0, -0.12), tb + V(0, 0, -0.05)]
    make_part('tail', prism(tail, Y * 0.06), 'crow_wing', root, Mx @ about(tb, rot_y(-6)), subsurf=1)
    make_part('wing_near', prism(crow_wing(sh, up)[::-1], Y * 0.04), 'crow_wing', root, Mx @ T((0, -0.17, 0)), subsurf=1)
    cov = crow_wing(sh, up)
    cov = [sh + (p - sh) * 0.55 for p in cov[:4]] + [sh + (cov[-2] - sh) * 0.55]
    make_part('wing_hi', prism(cov[::-1], Y * 0.02), 'crow_tip', root, Mx @ T((0, -0.2, 0)), subsurf=1)
    for k, sg in enumerate((-1, 1)):
        f = bc + V(0.02, sg * 0.05, -0.14)
        make_part('leg%d' % k, tube([f, f + V(-0.04, 0, -0.09), f + V(0.02, 0, -0.13)], 0.016, 0.012, seg=5), 'crow_feet', root, Mx, subsurf=1)


# ================================================================ TAMAGO (egg nigiri)
def build_tamago(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='tamago_egg')
    bob, lean = walk_bob(pose, P, t)
    Mx = T((0, 0, bob + 0.1)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    # the rice block, lumpy at the rim
    make_part('rice', superellipsoid(V(0, 0, 0.13), 0.38, 0.22, 0.13, e=0.35, seg=24, rows=10), 'tamago_rice', root, Mx)
    for k in range(6):
        x = -0.32 + 0.13 * k
        make_part('grain%d' % k, ellipsoid(V(x, -0.2, 0.22 if k % 2 else 0.06), X * 0.05, Y * 0.03, Z * 0.03, seg=10, rows=6), 'tamago_grain', root, Mx, subsurf=1)
    # the omelette slab: overhangs the rice, striped layers on the side, a toasty top
    ec = V(0.0, 0, 0.42)
    make_part('egg', superellipsoid(ec, 0.46, 0.26, 0.17, e=0.3, seg=26, rows=10), 'tamago_egg', root, Mx)
    for k, z in enumerate((-0.06, 0.04)):
        make_part('layer%d' % k, box_bm((0.88, 0.02, 0.018)), 'tamago_egg2', root, Mx @ T((0.0, -0.262, ec.z + z)), subsurf=0)
    make_part('toast', superellipsoid(ec + V(0, 0, 0.16), 0.4, 0.2, 0.025, e=0.3, seg=20, rows=6), 'tamago_brown', root, Mx)
    # the nori belt round both
    make_part('nori', box_bm((0.2, 0.56, 0.62), bevel=0.03, segments=2), 'tamago_nori', root, Mx @ T((-0.16, 0, 0.32)), subsurf=0)
    n = Vector((0.25, -1, 0.0)).normalized()
    for side, x in (('r', 0.27), ('l', 0.08)):
        eye_one('tamago', side, V(x, -0.24, 0.45), n, root, Mx, P)
    flat_mouth('tamago', root, Mx, P['mouth'], V(0.2, -0.262, 0.34), n, 0.11)
    biped_legs('tamago', root, Matrix.Identity(4), P, t, (0.0, 0.12, 0.12), (0.09, 0.06, 0.04), 0.035, 'tamago_feet')


# ================================================================ TAKO (takoyaki roller)
def tako_ball(root, Mx, c, r, t):
    make_part('ball', sphere(c, r, seg=26, rows=14), 'tako_ball', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('sauce', ell_cap(c, (r, r, r), (0, 0, 1), 46, seg=22, rows=6, scale=1.03), 'tako_sauce', root, Mx)
    make_part('gloss', oval_patch(surf, c.z + r * 0.86, 0.03, -2.3, 0.35, thick=0.035), 'tako_gloss', root, Mx)
    for k, a in enumerate((-2.3, -1.1, 0.3)):
        p, n = surf(c.z + r * 0.62, a)
        make_part('drip%d' % k, ellipsoid(p + n * 0.012 - Z * 0.03, X * 0.04, Y * 0.04, Z * 0.06, seg=10, rows=6), 'tako_sauce', root, Mx, subsurf=1)
    zz = []
    for k in range(9):
        u = -1 + 2 * k / 8
        a = -1.57 + u * 0.75
        p, n = surf(c.z + r * (0.84 if k % 2 else 0.68), a)
        zz.append(p + n * 0.03)
    make_part('mayo', tube(zz, 0.02, seg=6), 'tako_mayo', root, Mx, subsurf=1)
    for k in range(6):
        a = -2.3 + 0.6 * k
        p, n = surf(c.z + r * (0.74 + 0.1 * (k % 2)), a)
        make_part('nori%d' % k, box_bm((0.028, 0.028, 0.028)), 'tako_nori', root, Mx @ T(p + n * 0.035), subsurf=0)
    # a bonito-flake curl lying on top and a toothpick stuck in at an angle
    top = c + V(-0.04, 0, r)
    make_part('flake', torus(top + V(0.0, 0, 0.01), 0.05, 0.016, axis=Vector((0.3, -0.2, 1)), seg=12, rseg=5), 'tako_flake2', root, Mx, subsurf=0)
    make_part('pick', tube([c + V(0.06, 0.02, r * 0.6), c + V(0.16, 0.02, r + 0.2)], 0.016, 0.012, seg=6), 'tako_mayo', root, Mx, subsurf=0)
    return surf


def build_tako(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='tako_ball')
    bob, lean = walk_bob(pose, P, t)
    c, r = V(0, 0, 0.37), 0.3
    if pose in ('roll', 'curl'):
        c = V(0, 0, 0.31)
        MR = about(c, rot_y(360 * t if pose == 'roll' else 20))
        surf = tako_ball(root, MR, c, r, t)
        for side, az in (('r', -0.55), ('l', -1.3)):
            p, n = surf(c.z - 0.03, az)
            eye_one('tako', side, p - n * 0.012, n, root, MR, P)
        tip = c + V(-0.28, -0.05, -0.05)
        make_part('tent', tube([tip, tip + V(-0.06, 0, -0.02), tip + V(-0.08, 0, 0.04)], 0.035, 0.018, seg=8), 'tako_tent', root, MR, subsurf=1)
        return
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    surf = tako_ball(root, Mx, c, r, t)
    for side, az in (('r', -0.8), ('l', -1.5)):
        p, n = surf(0.4, az)
        eye_one('tako', side, p - n * 0.012, n, root, Mx, P)
    if P['mouth']:
        open_mouth('tako', root, Mx, surf, P['mouth'], 0.29, math.radians(-50), math.radians(-100), scale=0.9)
    # a little tentacle curling out of the back, waving
    w = 0.05 * math.sin(TAU * t)
    tip = c + V(-0.28, -0.04, -0.12)
    make_part('tent', tube([tip, tip + V(-0.07, 0, -0.03), tip + V(-0.13, 0, 0.02 + w), tip + V(-0.12, 0, 0.09 + w), tip + V(-0.08, 0, 0.1 + w)], 0.024, 0.01, seg=8), 'tako_tent', root, Mx, subsurf=1)
    biped_legs('tako', root, Mx, P, t, (0.0, 0.1, 0.14), (0.08, 0.055, 0.04), 0.03, 'tako_feet')


# ================================================================ WASABI (a cross little wasabi root, hopper)
ROOT_PROF = [(0.0, 0.0), (0.17, 0.02), (0.24, 0.08), (0.27, 0.18), (0.27, 0.3), (0.25, 0.42), (0.21, 0.5), (0.12, 0.55), (0.0, 0.56)]


def build_wasabi(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='wasabi_paste')
    bob, lean = walk_bob(pose, P, t)
    lift = 0.1 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift + 0.07)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('root', lathe(ROOT_PROF, seg=24), 'wasabi_paste', root, Mx)
    surf = lathe_surf(ROOT_PROF)
    # a few darker nubs (old leaf scars) away from the face
    for k, (z, a) in enumerate(((0.44, -2.5), (0.12, -2.2), (0.46, -0.3), (0.08, 0.1))):
        p, n = surf(z, a)
        make_part('nub%d' % k, ellipsoid(p + n * 0.004, X * 0.035, Y * 0.035, Z * 0.018, seg=8, rows=4), 'wasabi_paste2', root, Mx @ about(p, rot_y(0)), subsurf=0)
    make_part('hi', oval_patch(surf, 0.34, 0.06, -2.2, 0.25), 'wasabi_hi', root, Mx)
    # three stalks with round leaves on top
    sway = 6 * math.sin(TAU * t) if pose == 'walk' else (12 if pose == 'hop' else 0)
    for k, (dx, ang, h) in enumerate(((-0.07, -38, 0.14), (0.0, 2, 0.2), (0.07, 40, 0.13))):
        b = V(dx, 0.02 * k, 0.52)
        RM = Mx @ about(b, rot_y(ang + sway))
        tipp = b + V(0, 0, h)
        make_part('stalk%d' % k, tube([b, tipp], 0.024, 0.02, seg=6), 'wasabi_vein', root, RM, subsurf=1)
        heart = [tipp]
        for j in range(17):
            a = math.pi * j / 16
            rr = 0.13 * (1 - 0.18 * math.sin(2 * a) ** 8)
            heart.append(tipp + V(-0.14 * math.cos(a) * (1.0 + 0.15 * math.sin(a)), 0, 0.02 + 0.18 * math.sin(a) ** 0.8 + 0.06 * (1 - abs(math.cos(a)))))
        heart.append(tipp + V(0.0, 0, 0.02))
        make_part('leaf%d' % k, prism(heart[::-1], Y * 0.03), 'wasabi_leaf', root, RM, subsurf=1)
        make_part('lvein%d' % k, tube([tipp + V(0, -0.02, 0.02), tipp + V(0, -0.02, 0.2)], 0.008, seg=4), 'wasabi_vein', root, RM, subsurf=0)
    for side, az in (('r', -0.75), ('l', -1.45)):
        p, n = surf(0.31, az)
        eye_one('wasabi', side, p - n * 0.012, n, root, Mx, P)
        if pose not in ('flat', 'ko'):
            brow('wasabi', side, p - n * 0.012, n, root, Mx, 0.075, angry=1.0)
    if P['mouth']:
        open_mouth('wasabi', root, Mx, surf, P['mouth'], 0.18, math.radians(-30), math.radians(-105), scale=1.0, tongue=False)
        if P['mouth'] == 'grin':
            for k, a in enumerate((-0.75, -1.4)):
                p, n = surf(0.175, a)
                make_part('tooth%d' % k, cone(p + n * 0.012, p + n * 0.014 - Z * 0.04, 0.02, seg=6), 'wasabi_tooth', root, Mx, subsurf=0)
    if P['feet']:
        biped_legs('wasabi', root, T((0, 0, lift)), P, t, (0.0, 0.1, 0.1), (0.07, 0.05, 0.035), 0.028, 'wasabi_feet')


# ================================================================ CAPSULE (capsule toy roller)
def capsule_ball(root, Mx, c, r, t):
    make_part('base', ellipsoid(c, X * r, Y * r, Z * r, seg=24, rows=12, phi0=math.pi / 2, phi1=math.pi), 'capsule_base', root, Mx)
    make_part('dome', ellipsoid(c, X * r, Y * r, Z * r, seg=24, rows=12, phi0=0.0, phi1=math.pi / 2), 'capsule_dome', root, Mx)
    make_part('band', torus(c, r * 1.0, 0.016, axis=Z, seg=28, rseg=6), 'capsule_feet', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('gleam', oval_patch(surf, c.z + r * 0.6, 0.06, -2.1, 0.3, thick=0.02), 'capsule_dome2', root, Mx)
    # the toy inside: a little yellow chick seen through the dome (drawn just in front so it reads)
    tc = c + V(0.0, -r * 0.6, r * 0.34)
    make_part('toy', sphere(tc, 0.11, seg=14, rows=8), 'capsule_toy', root, Mx)
    make_part('toyhead', sphere(tc + V(0.07, -0.02, 0.08), 0.07, seg=12, rows=8), 'capsule_toy', root, Mx)
    make_part('toybeak', cone(tc + V(0.13, -0.04, 0.08), tc + V(0.2, -0.05, 0.07), 0.025, seg=6), 'capsule_toybeak', root, Mx, subsurf=0)
    make_part('toyeye', sphere(tc + V(0.1, -0.08, 0.11), 0.016, seg=8, rows=4), 'capsule_pupil', root, Mx, subsurf=0)
    return surf


def build_capsule(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.065, skin='capsule_base')
    bob, lean = walk_bob(pose, P, t)
    r = 0.3
    if pose in ('roll', 'curl'):
        c = V(0, 0, 0.31)
        MR = about(c, rot_y(360 * t if pose == 'roll' else 25))
        surf = capsule_ball(root, MR, c, r, t)
        for side, az in (('r', -0.8), ('l', -1.5)):
            p, n = surf(c.z - 0.13, az)
            eye_one('capsule', side, p - n * 0.012, n, root, MR, P)
        return
    c = V(0, 0, 0.38)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    surf = capsule_ball(root, Mx, c, r, t)
    for side, az in (('r', -0.8), ('l', -1.5)):
        p, n = surf(c.z - 0.09, az)
        eye_one('capsule', side, p - n * 0.012, n, root, Mx, P)
    open_mouth('capsule', root, Mx, surf, P['mouth'], c.z - 0.2, math.radians(-50), math.radians(-105), scale=0.8)
    biped_legs('capsule', root, Mx, P, t, (0.0, 0.1, 0.14), (0.08, 0.055, 0.04), 0.03, 'capsule_feet')


# ================================================================ LUCKY CAT (thrower)
def build_luckyCat(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='luckyCat_fur')
    if pose in ('walk', 'idle', 'throw'):
        P['lid'] = 1.0               # happy shut eyes
    bob, lean = 0.0, P['lean']
    if pose == 'walk':
        bob = 0.03 * abs(math.sin(TAU * t))
        lean = 5 * math.sin(TAU * t)
    sx, sz = P['sx'], P['sz']
    flat = pose == 'flat'
    # the red cushion it sits on
    make_part('cushion', superellipsoid(V(0, 0, 0.1), 0.38, 0.3, 0.09, e=0.4, seg=22, rows=8), 'luckyCat_cushion', root, diag(sx, 1, 1 if not flat else 0.6))
    for k, sg in enumerate((-1, 1)):
        make_part('tassel%d' % k, sphere(V(sg * 0.36, -0.26, 0.12), 0.04, seg=8, rows=5), 'luckyCat_cushion2', root, diag(sx, 1, 1), subsurf=0)
    Mx = T((0, 0, 0.18 + bob)) @ about((0, 0, 0), rot_y(lean)) @ diag(sx, sx, sz)
    # body: a chubby pear, a big round head on top
    bc = V(0, 0, 0.33)
    make_part('body', blob(bc, 0.3, 0.26, 0.34, seg=24, rows=14), 'luckyCat_fur', root, Mx)
    bsurf = ellipsoid_surf(bc, 0.3, 0.26, 0.34)
    make_part('patch_b', oval_patch(bsurf, bc.z + 0.12, 0.14, 2.6, 0.6), 'luckyCat_patch', root, Mx)
    hc, hr = V(0.03, 0, 0.86), 0.27
    make_part('head', blob(hc, hr * 1.08, hr, hr * 0.92, seg=26, rows=14), 'luckyCat_fur', root, Mx)
    hsurf = ellipsoid_surf(hc, hr * 1.08, hr, hr * 0.92)
    make_part('patch_h', oval_patch(hsurf, hc.z + 0.14, 0.1, -2.3, 0.35), 'luckyCat_patch', root, Mx)
    make_part('patch_h2', oval_patch(hsurf, hc.z + 0.12, 0.08, -0.6, 0.25), 'luckyCat_patch2', root, Mx)
    for k, sg in enumerate((-1, 1)):
        b = hc + V(sg * 0.15, 0, 0.17)
        tipp = hc + V(sg * 0.22, 0, 0.36)
        make_part('ear%d' % k, cone(b, tipp, 0.1, flat=0.5, seg=10), 'luckyCat_fur' if sg > 0 else 'luckyCat_patch', root, Mx)
        make_part('earin%d' % k, cone(b + V(0, -0.04, 0.02), tipp + V(0, -0.04, -0.06), 0.06, flat=0.3, seg=8), 'luckyCat_ear', root, Mx, subsurf=1)
    for side, az, ex in (('r', -1.15, 0.07), ('l', -1.95, 0.065)):
        p, n = hsurf(hc.z + 0.05, az)
        eye_one('luckyCat', side, p - n * 0.01, n, root, Mx, P, er=ex)
    p, n = hsurf(hc.z - 0.08, -1.55)
    make_part('nose', ellipsoid(p + n * 0.01, X * 0.03, Y * 0.02, Z * 0.022, seg=10, rows=6), 'luckyCat_pad', root, Mx, subsurf=1)
    if P['mouth'] in ('grin', 'smile'):
        for k, (a0, a1) in enumerate(((-1.55, -1.35), (-1.75, -1.55))):
            path = []
            for j in range(7):
                u = j / 6
                q, nn = hsurf(hc.z - 0.11 - 0.025 * math.sin(math.pi * u), a0 + (a1 - a0) * u)
                path.append(q + nn * 0.01)
            ob = make_part('mouth%d' % k, tube(path, 0.011, seg=5), 'luckyCat_mouth', root, Mx, subsurf=0)
            ob['outline'] = 0
    elif P['mouth']:
        make_part('mouth', mouth_bm(hsurf, P['mouth'], hc.z - 0.12, -1.35, -1.75, scale=0.6), 'luckyCat_mouth', root, Mx)
    for k, (sg, dz) in enumerate(((1, 0.0), (1, -0.04), (-1, 0.0), (-1, -0.04))):
        a = -1.2 if sg > 0 else -1.9
        p, n = hsurf(hc.z - 0.07 + dz, a)
        ob = make_part('whisker%d' % k, tube([p + n * 0.01, p + n * 0.02 + V(sg * 0.12, -0.02, dz * 1.2)], 0.007, seg=4), 'luckyCat_whisker', root, Mx, subsurf=0)
        ob['outline'] = 0
    # red collar and bell
    make_part('collar', torus(V(0.02, 0, 0.64), 0.21, 0.035, axis=Z, seg=26, rseg=8), 'luckyCat_collar', root, Mx)
    make_part('bell', sphere(V(0.04, -0.22, 0.6), 0.055, seg=14, rows=8), 'luckyCat_bell', root, Mx)
    # the koban held against its belly by the left paw
    kc = V(0.02, -0.27, 0.34)
    make_part('koban', ellipsoid(kc, X * 0.14, Y * 0.03, Z * 0.18, seg=18, rows=8), 'luckyCat_coin', root, Mx)
    for k in range(3):
        make_part('kband%d' % k, box_bm((0.18, 0.012, 0.016)), 'luckyCat_coin2', root, Mx @ T(kc + V(0, -0.03, -0.08 + 0.08 * k)), subsurf=0)
    make_part('pawL', sphere(V(-0.1, -0.24, 0.42), 0.08, seg=12, rows=8), 'luckyCat_fur', root, Mx)
    # the beckoning paw: up and nodding when idle; swung forward and down to fling a coin when throwing
    if pose == 'throw':
        ang = -60 + 150 * smooth01(min(1.0, t / 0.5)) if t < 0.5 else 90 - 150 * smooth01((t - 0.5) / 0.5)
    elif pose in ('idle', 'walk'):
        ang = -20 + 25 * math.sin(TAU * t)
    elif pose == 'stun':
        ang = 60
    else:
        ang = 80
    sh = V(0.2, -0.04, 0.56)
    MA = Mx @ about(sh, rot_y(-ang))
    make_part('arm', tube([sh, sh + V(0.04, 0, 0.12), sh + V(0.06, 0, 0.24)], 0.075, 0.07, seg=10), 'luckyCat_fur', root, MA)
    make_part('paw', sphere(sh + V(0.06, 0, 0.29), 0.085, seg=12, rows=8), 'luckyCat_fur', root, MA)
    make_part('pad', ellipsoid(sh + V(0.07, -0.08, 0.29), X * 0.035, Y * 0.01, Z * 0.035, seg=8, rows=4), 'luckyCat_pad', root, MA, subsurf=1)
    make_part('tail', tube([V(-0.26, 0.05, 0.12), V(-0.36, 0.05, 0.2), V(-0.34, 0.05, 0.32)], 0.05, 0.04, seg=8), 'luckyCat_patch2', root, Mx)


# ================================================================ UMBRELLA (folklore hopping umbrella)
UMB = [(0.05, 0.42), (0.24, 0.5), (0.34, 0.62), (0.3, 0.84), (0.22, 1.08), (0.12, 1.32), (0.04, 1.48), (0.0, 1.52)]


def build_umbrella(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.12, skin='umbrella_paper')
    bob, lean = walk_bob(pose, P, t, amp=0.04, sway=5)
    lift = 0.12 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('paper', lathe(UMB, seg=8), 'umbrella_paper', root, Mx, subsurf=1)
    surf = lathe_surf(UMB)
    for k in range(8):
        a = TAU * k / 8
        rib = [V((r + 0.012) * math.cos(a), (r + 0.012) * math.sin(a), z) for r, z in UMB[:-1]]
        ob = make_part('rib%d' % k, tube(rib, 0.009, seg=5), 'umbrella_paper2', root, Mx, subsurf=0)
        ob['outline'] = 0
    make_part('band', torus(V(0, 0, 0.66), 0.335, 0.03, axis=Z, seg=8, rseg=6), 'umbrella_band', root, Mx, subsurf=0)
    make_part('band2', torus(V(0, 0, 1.18), 0.18, 0.022, axis=Z, seg=8, rseg=6), 'umbrella_band', root, Mx, subsurf=0)
    make_part('cap', lathe([(0.06, 1.46), (0.05, 1.56), (0.0, 1.6)], seg=8), 'umbrella_rib', root, Mx, subsurf=0)
    # one big eye and a long tongue
    p, n = surf(0.9, -1.15)
    eye_one('umbrella', 'r', p - n * 0.01, n, root, Mx, P, er=0.12)
    if pose not in ('flat',):
        p, n = surf(0.6, -1.1)
        lick = 0.04 * math.sin(TAU * t)
        tong = [p + n * 0.01, p + n * 0.07 + V(0.03, 0, -0.06), p + n * 0.09 + V(0.07, 0, -0.14 + lick), p + n * 0.08 + V(0.1, 0, -0.19 + lick)]
        make_part('tongue', tube(tong, 0.06, seg=10, radii=[0.05, 0.06, 0.06, 0.045]), 'umbrella_tongue', root, Mx, subsurf=1)
        make_part('mouth', ellipsoid(p + n * 0.0, X * 0.07, Y * 0.04, Z * 0.035, seg=12, rows=6), 'umbrella_mouth', root, Mx, subsurf=1)
    # one wooden leg ending in a geta sandal
    leg_top = V(0, 0, 0.44)
    stretch = {'hop': 0.06, 'flat': -0.2}.get(pose, 0.0)
    foot = V(0.02 + (0.04 * math.sin(TAU * t) if pose == 'walk' else 0.0), 0, 0.1 + stretch * 0.0 + (0.08 if pose == 'hop' else 0.0))
    make_part('leg', tube([leg_top, (leg_top + foot) / 2 + V(-0.02, 0, 0), foot], 0.045, seg=8), 'umbrella_leg', root, T((0, 0, lift)) @ diag(P['sx'], P['sx'], 1))
    GM = T((0, 0, lift)) @ T(foot)
    make_part('geta', box_bm((0.3, 0.16, 0.04), bevel=0.01), 'umbrella_geta', root, GM @ T((0.03, 0, -0.04)), subsurf=0)
    for k, x in enumerate((-0.07, 0.11)):
        make_part('tooth%d' % k, box_bm((0.04, 0.14, 0.06)), 'umbrella_geta', root, GM @ T((x, 0, -0.09)), subsurf=0)
    make_part('strap', torus(V(0.04, 0, 0.0), 0.06, 0.016, axis=X, seg=12, rseg=5), 'umbrella_strap', root, GM, subsurf=0)


# ================================================================ UMBRELLA FLY (runaway umbrella, centre)
def build_umbrellaFly(root, pose, t):
    P = {'er': 0.09, 'skin': 'umbrellaFly_cloth', 'lid': 0.1, 'look': Vector((0.55, -0.85, -0.15))}
    if pose == 'fly':
        ang = -20 + 18 * math.sin(TAU * t)
    elif pose == 'swoop':
        ang = 30
        P['eye'] = 1.15
    elif pose == 'stun':
        ang, P['dazed'], P['lid'] = -50, True, 0.5
    else:
        ang, P['x'] = 150, True
    Mx = rot_y(ang) @ T((0, 0, -0.04))
    prof = [(0.0, 0.26), (0.14, 0.25), (0.28, 0.19), (0.4, 0.09), (0.5, -0.04), (0.52, -0.08)]
    make_part('cloth', lathe(prof, seg=8), 'umbrellaFly_cloth', root, Mx, subsurf=1)
    for k in range(8):
        a = TAU * k / 8
        rib = [V((r + 0.01) * math.cos(a), (r + 0.01) * math.sin(a), z) for r, z in prof[1:]]
        ob = make_part('rib%d' % k, tube(rib, 0.008, seg=5), 'umbrellaFly_cloth2', root, Mx, subsurf=0)
        ob['outline'] = 0
        make_part('ribtip%d' % k, sphere(V(0.54 * math.cos(a), 0.54 * math.sin(a), -0.09), 0.025, seg=8, rows=4), 'umbrellaFly_tip', root, Mx, subsurf=0)
    make_part('tip', cone(V(0, 0, 0.25), V(0, 0, 0.38), 0.03, seg=6), 'umbrellaFly_tip', root, Mx, subsurf=0)
    make_part('shaft', tube([V(0, 0, 0.2), V(0, 0, -0.36)], 0.022, seg=6), 'umbrellaFly_handle', root, Mx, subsurf=0)
    make_part('hook', tube([V(0, 0, -0.36), V(0.03, 0, -0.46), V(0.1, 0, -0.47), V(0.12, 0, -0.4)], 0.03, seg=8), 'umbrellaFly_handle', root, Mx, subsurf=1)
    surf = lathe_surf(prof)
    p, n = surf(0.1, -1.25)
    eye_one('umbrellaFly', 'r', p - n * 0.01, n, root, Mx, P, er=0.1)
    open_mouth('umbrellaFly', root, Mx, surf, 'o' if pose in ('swoop', 'ko') else 'wobble', -0.0, -0.95, -1.4, scale=0.8)


# ================================================================ TOP (spinning top roller)
TOP = [(0.0, 0.02), (0.05, 0.04), (0.16, 0.14), (0.3, 0.3), (0.38, 0.42), (0.39, 0.48), (0.34, 0.54), (0.12, 0.58), (0.0, 0.58)]


def build_top(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='top_wood')
    spin = 0.0
    tilt, sway = 0.0, 0.0
    if pose == 'walk':
        tilt = 8 * math.sin(TAU * t)
    elif pose == 'roll':
        spin = 360 * t / 2
        tilt = 6
    elif pose == 'curl':
        tilt = 14
    elif pose == 'stun':
        tilt = -18
    elif pose == 'ko':
        tilt = -70
    Mx = about((0, 0, 0.02), rot_y(tilt)) @ diag(P['sx'], P['sx'], P['sz']) @ rot_z(spin)
    make_part('body', lathe(TOP, seg=26), 'top_wood', root, Mx)
    for k, (z, R, mat) in enumerate(((0.15, 0.15, 'top_blue'), (0.23, 0.23, 'top_yellow'), (0.48, 0.39, 'top_red'))):
        make_part('band%d' % k, torus(V(0, 0, z), R + 0.012, 0.03, axis=Z, seg=26, rseg=6), mat, root, Mx)
    # painted dabs so the spin reads
    for k in range(4):
        a = TAU * k / 4 + 0.4
        make_part('dab%d' % k, ellipsoid(V(0.36 * math.cos(a), 0.36 * math.sin(a), 0.48), X * 0.05, Y * 0.05, Z * 0.025, seg=8, rows=4), 'top_red' if k % 2 else 'top_blue', root, Mx, subsurf=0)
    make_part('lid', lathe([(0.0, 0.58), (0.3, 0.58), (0.3, 0.6), (0.0, 0.61)], seg=24), 'top_wood2', root, Mx)
    make_part('stem', tube([V(0, 0, 0.58), V(0, 0, 0.76)], 0.045, seg=10), 'top_wood2', root, Mx)
    make_part('knob', sphere(V(0, 0, 0.77), 0.05, seg=10, rows=6), 'top_red', root, Mx)
    make_part('tip', lathe([(0.0, 0.0), (0.04, 0.03), (0.06, 0.07), (0.0, 0.08)], seg=10), 'top_tip', root, Mx)
    surf = lathe_surf(TOP)
    look_a = -0.5 - (math.radians(spin) if pose == 'roll' else 0.0)
    for side, az in (('r', -0.85), ('l', -1.5)):
        p, n = surf(0.36, az)
        eye_one('top', side, p - n * 0.012, n, root, Mx, P, er=0.07)
    if P['mouth']:
        open_mouth('top', root, Mx, surf, P['mouth'], 0.29, math.radians(-55), math.radians(-100), scale=0.7, tongue=False)


# ================================================================ KOI (leaper, centre)
def build_koi(root, pose, t):
    P = {'er': 0.055, 'skin': 'koi_white', 'lid': 0.0, 'look': Vector((0.6, -0.8, 0.0))}
    flick = 18 * math.sin(TAU * t)
    if pose == 'up':
        Mx = rot_y(-78)
    elif pose == 'down':
        Mx = rot_y(75)
        flick *= 0.6
    else:
        Mx = rot_y(165)
        P['x'] = True
    # the fish is modelled lying along +X (head at +X, its side to the camera); the pose stands it head-up or -down
    bc, rad = V(0.0, 0, 0), (0.3, 0.1, 0.14)
    make_part('body', blob(bc, *rad, seg=24, rows=12), 'koi_white', root, Mx)
    surf = ellipsoid_surf(bc, *rad)
    make_part('spot1', oval_patch(surf, 0.05, 0.07, -1.85, 0.42), 'koi_orange', root, Mx)
    make_part('spot2', oval_patch(surf, -0.03, 0.07, -2.45, 0.3), 'koi_red', root, Mx)
    make_part('spot3', oval_patch(surf, 0.09, 0.04, -1.25, 0.16), 'koi_orange', root, Mx)
    make_part('lips', torus(V(0.3, 0, -0.01), 0.035, 0.018, axis=X, seg=14, rseg=6), 'koi_lip', root, Mx)
    for k, sg in enumerate((-1, 1)):
        make_part('barbel%d' % k, tube([V(0.3, sg * 0.03, -0.04), V(0.35, sg * 0.05, -0.08), V(0.35, sg * 0.04, -0.12)], 0.01, 0.007, seg=5), 'koi_lip', root, Mx, subsurf=0)
    eye_one('koi', 'r', V(0.19, -0.062, 0.04), Vector((0.35, -1, 0.15)), root, Mx, P, er=0.055)
    TM = Mx @ about(V(-0.27, 0, 0), rot_y(flick))
    tail = [V(-0.26, 0, 0.0), V(-0.46, 0, 0.16), V(-0.4, 0, 0.0), V(-0.46, 0, -0.16)]
    make_part('tail', prism(tail[::-1], Y * 0.03), 'koi_fin', root, TM, subsurf=1)
    make_part('dorsal', prism([V(-0.14, 0, 0.12), V(-0.18, 0, 0.2), V(0.0, 0, 0.21), V(0.1, 0, 0.13)], Y * 0.02), 'koi_fin', root, Mx, subsurf=1)
    make_part('pfin', prism([V(0.12, 0, -0.1), V(0.0, 0, -0.2), V(0.04, 0, -0.1)], Y * 0.02), 'koi_fin', root, Mx @ T((0, -0.09, 0)), subsurf=1)
    if pose != 'ko':
        make_part('mouth', ellipsoid(V(0.315, -0.01, -0.01), X * 0.012, Y * 0.02, Z * 0.02, seg=8, rows=4), 'koi_mouth', root, Mx, subsurf=0)


# ================================================================ SHIBA (friend: idle offers the nunchucks, wave after)
def build_shiba(root, pose, t):
    P = {'er': 0.07, 'skin': 'shiba_fur', 'lid': 0.1, 'look': Vector((0.6, -0.8, 0.0))}
    give = pose == 'idle'
    wag = math.sin(TAU * t * (1 if give else 2))
    if not give:
        P['lid'] = 1.0
    Mx = Matrix.Identity(4)
    # sitting body: haunch, chest, front legs
    make_part('haunch', blob(V(-0.16, 0, 0.26), 0.26, 0.24, 0.24, seg=22, rows=12), 'shiba_fur', root, Mx)
    make_part('chest', blob(V(0.06, 0, 0.4), 0.2, 0.2, 0.3, seg=22, rows=12), 'shiba_fur', root, Mx)
    csurf = ellipsoid_surf(V(0.06, 0, 0.4), 0.2, 0.2, 0.3)
    make_part('bib', oval_patch(csurf, 0.4, 0.22, -0.7, 0.55), 'shiba_cream', root, Mx)
    for k, sg in enumerate((-1, 1)):
        y = sg * 0.1
        make_part('fleg%d' % k, tube([V(0.12, y, 0.32), V(0.15, y, 0.16), V(0.16, y, 0.05)], 0.055, 0.05, seg=8), 'shiba_fur', root, Mx)
        make_part('fpaw%d' % k, ellipsoid(V(0.2, y, 0.04), X * 0.08, Y * 0.06, Z * 0.045, seg=10, rows=6), 'shiba_cream', root, Mx)
        make_part('hpaw%d' % k, ellipsoid(V(-0.12, y * 1.8, 0.04), X * 0.1, Y * 0.06, Z * 0.045, seg=10, rows=6), 'shiba_cream', root, Mx)
    if not give:
        # waving: the near front paw raised and swinging
        sh = V(0.14, -0.14, 0.36)
        MA = Mx @ about(sh, rot_y(-110 - 25 * wag))
        make_part('wavearm', tube([sh, sh + V(0.0, 0, 0.12), sh + V(0.0, 0, 0.22)], 0.05, seg=8), 'shiba_fur', root, MA)
        make_part('wavepaw', sphere(sh + V(0.0, 0, 0.25), 0.06, seg=10, rows=6), 'shiba_cream', root, MA)
    # the curled tail over the back, wagging
    tb = V(-0.36, 0, 0.34)
    TM = Mx @ about(tb, rot_x(14 * wag))
    tail = [tb, tb + V(-0.06, 0, 0.12), tb + V(0.02, 0, 0.22), tb + V(0.12, 0, 0.18), tb + V(0.1, 0, 0.1)]
    make_part('tail', tube(tail, 0.07, 0.04, seg=10), 'shiba_fur', root, TM)
    make_part('tailin', sphere(tb + V(0.03, -0.04, 0.14), 0.045, seg=10, rows=6), 'shiba_cream', root, TM)
    # head
    hc, hr = V(0.18, 0, 0.78), 0.2
    HM = Mx @ about(hc, rot_y(-6 if give else 4))
    make_part('head', blob(hc, 0.21, 0.19, 0.18, seg=24, rows=12), 'shiba_fur', root, HM)
    hsurf = ellipsoid_surf(hc, 0.21, 0.19, 0.18)
    make_part('cheeks', oval_patch(hsurf, hc.z - 0.07, 0.07, -1.25, 0.75), 'shiba_cream', root, HM)
    for side, az in (('r', -1.0), ('l', -1.6)):
        p, n = hsurf(hc.z + 0.11, az)
        make_part('brow_' + side, ellipsoid(p + n * 0.006, X * 0.03, Y * 0.02, Z * 0.018, seg=8, rows=4), 'shiba_cream', root, HM, subsurf=0)
    mc = hc + V(0.18, -0.02, -0.05)
    make_part('muzzle', blob(mc, 0.12, 0.1, 0.08, seg=16, rows=8), 'shiba_cream', root, HM)
    make_part('nose', sphere(mc + V(0.11, 0, 0.03), 0.035, seg=10, rows=6), 'shiba_nose', root, HM)
    msurf = ellipsoid_surf(mc, 0.12, 0.1, 0.08)
    make_part('mouth', mouth_bm(msurf, 'smile', mc.z - 0.03, 0.2, -1.2, scale=0.6), 'shiba_mouth', root, HM)
    if not give:
        make_part('tongue', ellipsoid(mc + V(0.06, -0.06, -0.08), X * 0.035, Y * 0.02, Z * 0.05, seg=10, rows=6), 'shiba_tongue', root, HM, subsurf=1)
    for k, sg in enumerate((-1, 1)):
        b = hc + V(-0.02, sg * 0.1, 0.13)
        tip = hc + V(0.0, sg * 0.14, 0.3)
        make_part('ear%d' % k, cone(b, tip, 0.08, flat=0.55, seg=10), 'shiba_fur', root, HM)
        make_part('earin%d' % k, cone(b + V(0.03, 0, 0.02), tip + V(0.03, 0, -0.06), 0.045, flat=0.3, seg=8), 'shiba_ear', root, HM, subsurf=1)
    for side, az, ex in (('r', -1.0, 0.045), ('l', -1.6, 0.04)):
        p, n = hsurf(hc.z + 0.05, az)
        if give:
            make_part('eye_' + side, ellipsoid(p + n * 0.005, X * ex, Y * ex * 0.6, Z * ex * 1.15, seg=12, rows=8), 'shiba_pupil', root, HM, subsurf=1)
            make_part('glint_' + side, sphere(p + n * 0.03 + V(-0.012, 0, 0.02), ex * 0.35, seg=8, rows=4), 'shiba_eye_white', root, HM, subsurf=0)
        else:
            _, up, rt = face_frame(n)
            arc = [p + n * 0.012 + rt * ex * math.cos(math.pi * j / 6) + up * ex * 0.8 * math.sin(math.pi * j / 6) for j in range(7)]
            make_part('eye_' + side, tube(arc, 0.014, seg=5), 'shiba_pupil', root, HM, subsurf=0)
    # the red bandana
    make_part('bandana', torus(V(0.12, 0, 0.6), 0.16, 0.04, axis=Vector((0.2, 0, 1)), seg=22, rseg=6), 'shiba_bandana', root, Mx)
    make_part('knot', prism([V(0.18, -0.17, 0.6), V(0.3, -0.17, 0.56), V(0.22, -0.17, 0.44)], Y * 0.03), 'shiba_bandana', root, Mx, subsurf=1)
    if give:
        # the nunchucks in its mouth: two wooden sticks with gold caps on a short chain
        bite = mc + V(0.06, -0.02, -0.06)
        sw = 8 * math.sin(TAU * t)
        for k, sg in enumerate((-1, 1)):
            a = bite + V(0.0, -0.08, 0.0)
            SM = Mx @ about(bite, rot_y(sw)) @ T((sg * 0.08, -0.08, 0))
            make_part('stick%d' % k, tube([a + V(0, 0, 0.02), a + V(0, 0, -0.26)], 0.026, seg=8), 'shiba_stick', root, SM)
            make_part('scap%d' % k, sphere(a + V(0, 0, -0.27), 0.03, seg=8, rows=5), 'shiba_cap', root, SM, subsurf=0)
        make_part('chain', tube([bite + V(-0.08, -0.08, 0.03), bite + V(0, -0.08, 0.07), bite + V(0.08, -0.08, 0.03)], 0.012, seg=5), 'shiba_chain', root, Mx @ about(bite, rot_y(sw)), subsurf=0)


# ================================================================ COIN: the koban
def build_coin(root, pose, t):
    Mx = rot_z(360 * t)
    make_part('koban', ellipsoid(V(0, 0, 0), X * 0.19, Y * 0.045, Z * 0.27, seg=24, rows=10), 'coin_gold', root, Mx)
    make_part('rim', torus(V(0, 0, 0), 1.0, 0.02, axis=Y, seg=28, rseg=6), 'coin_gold2', root, Mx @ diag(0.18, 1, 0.26))
    for k in range(5):
        z = -0.16 + 0.08 * k
        w = 0.15 * math.sqrt(max(0.1, 1 - (z / 0.27) ** 2))
        for sg in (-1, 1):
            make_part('band%d%s' % (k, sg), box_bm((w * 2, 0.012, 0.018)), 'coin_gold2', root, Mx @ T((0, sg * 0.046, z)), subsurf=0)
    make_part('shine', ellipsoid(V(-0.07, -0.05, 0.12), X * 0.03, Y * 0.01, Z * 0.06, seg=8, rows=4), 'coin_shine', root, Mx, subsurf=0)


# ================================================================ STAR: the golden sakura
def build_star(root, pose, t):
    Mx = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(6 * math.sin(TAU * t))
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        d = V(math.cos(a), 0, math.sin(a))
        s = V(-math.sin(a), 0, math.cos(a))
        c = d * 0.2
        pts = [c - d * 0.2, c - d * 0.08 + s * 0.13, c + d * 0.08 + s * 0.15, c + d * 0.2 + s * 0.07, c + d * 0.15,
               c + d * 0.2 - s * 0.07, c + d * 0.08 - s * 0.15, c - d * 0.08 - s * 0.13]
        make_part('petal%d' % k, prism(pts, Y * 0.06), 'star_gold', root, Mx @ T((0, 0.01 * k, 0)), subsurf=1)
        ob = make_part('vein%d' % k, prism([c - d * 0.04 - s * 0.025, c + d * 0.1, c - d * 0.04 + s * 0.025], Y * 0.08), 'star_gold2', root, Mx, subsurf=0, smooth=False)
        ob['outline'] = 0
    make_part('core', sphere(V(0, -0.03, 0), 0.08, seg=14, rows=8), 'star_core', root, Mx)
    for k in range(6):
        a = TAU * k / 6
        make_part('stamen%d' % k, sphere(V(0.09 * math.cos(a), -0.05, 0.09 * math.sin(a)), 0.02, seg=8, rows=4), 'star_glow', root, Mx, subsurf=0)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.44 * math.cos(a), -0.2, 0.26 * math.sin(a))
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, Mx, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the bento box
def blossom_face(root, Mx, c, nrm, tng, r, mat, mat2, name):
    bn, bt = Vector(nrm).normalized(), Vector(tng).normalized()
    bu = bn.cross(bt)
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        d = bt * math.cos(a) + bu * math.sin(a)
        e = bt * -math.sin(a) + bu * math.cos(a)
        pc = Vector(c) + d * r * 0.5
        pts = [pc - d * r * 0.42, pc + e * r * 0.36, pc + d * r * 0.42 + e * r * 0.2, pc + d * r * 0.32, pc + d * r * 0.42 - e * r * 0.2, pc - e * r * 0.36]
        make_part('%s_p%d' % (name, k), prism(pts, bn * 0.03), mat, root, Mx, subsurf=0, smooth=False)
    make_part(name + '_c', ellipsoid(Vector(c) + bn * 0.02, bt * r * 0.18, bu * r * 0.18, bn * 0.02, seg=10, rows=4), mat2, root, Mx, subsurf=0)


def build_block(root, Mx, spent):
    H = 0.55
    k = 'used' if spent else 'qblock'
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.06, segments=2), k + '_lacquer', root, Mx, subsurf=0)
    # the lid seam: a black lacquer band round the middle, black rims on the edges
    make_part('band', box_bm((2 * H + 0.02, 2 * H + 0.02, 0.07)), k + '_black', root, Mx @ T((0, 0, 0.08)), subsurf=0)
    for fi, (nrm, tng) in enumerate((((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((0, 0, 1), (1, 0, 0)))):
        bn = Vector(nrm)
        c = bn * (H + 0.012)
        bt = Vector(tng)
        bu = bn.cross(bt)
        # an inset gold frame
        for (du, dv, w, h) in ((0, 0.4, 0.86, 0.04), (0, -0.4, 0.86, 0.04), (0.4, 0, 0.04, 0.86), (-0.4, 0, 0.04, 0.86)):
            p = c + bt * du + bu * dv
            sz = bt * w + bu * h + bn * 0.02
            make_part('frame%d_%d%d' % (fi, int(du * 10), int(dv * 10)), box_bm((abs(sz.x) + 0.001, abs(sz.y) + 0.001, abs(sz.z) + 0.001)), (k + '_dull') if spent else 'qblock_gold2', root, Mx @ T(p), subsurf=0)
        if not spent:
            blossom_face(root, Mx, c + bu * (0.08 if fi != 2 else 0.0), nrm, tng, 0.36, 'qblock_gold', 'qblock_lacquer', 'bl%d' % fi)


def build_qblock(root, pose, t):
    build_block(root, Matrix.Identity(4), False)


def build_used(root, pose, t):
    build_block(root, Matrix.Identity(4), True)


BUILDERS = {'onigiri': build_onigiri, 'beetle': build_beetle, 'crow': build_crow, 'tamago': build_tamago, 'tako': build_tako,
            'wasabi': build_wasabi, 'capsule': build_capsule, 'luckyCat': build_luckyCat, 'umbrella': build_umbrella,
            'umbrellaFly': build_umbrellaFly, 'top': build_top, 'koi': build_koi, 'shiba': build_shiba, 'coin': build_coin,
            'star': build_star, 'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    M.use(COLORS, KINDS)
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
