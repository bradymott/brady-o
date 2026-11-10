# fr_enemies: the France tour of Super Brady-O World in the Fiesta Toon look (original cartoon designs, humour from
# food, animals and objects; no people). Conventions as in docs/SPRITE_BRIEF.md: Z up, every character FACES +X, the
# camera looks along +Y from -Y, 1 m = 28.1 px; feet kinds stand on z = 0, centre kinds are centred on the origin;
# materials <kind>_<part>; one Empty per kind (fr_charkit.Builder).
#
#   baguette   a tall, cheeky baguette with diagonal scores and a dusting of flour         walk(t) stun flat ko
#   croissant  a flaky crescent croissant on stubby legs that curls up and rolls           walk(t) curl roll(t) stun flat ko
#   poele      a walking cast-iron crêpe pan (frPoele, replaces the mime: the brief's        walk(t) idle(t) throw(t) stun flat ko
#              boomerang crêpe thrower) wearing a crêpe flopped over its rim like a beret
#   pigeon     a plump city pigeon with an iridescent neck                                  fly(t) swoop stun ko
#   poodle     a pompom poodle with a pink bow that charges                                 walk(t) notice charge stun flat ko
#   cat        a black rooftop cat with lamp-green eyes that pounces                        walk(t) notice charge stun flat ko
#   keychain   a brass souvenir tower keychain on two feet (the Baron's minion)             walk(t) hop stun flat ko
#   accordion  a red accordion with wheezing bellows that puffs out notes                   walk(t) idle(t) throw(t) stun flat ko
#   coin       the MACARON: a pink macaron on edge, spinning about Z                        spin(t)
#   star       the GOLDEN CROISSANT, hovering                                               idle(t)
#   qblock     the item block: a striped pâtisserie box tied with a gold ribbon             idle (one frame)
#   used       the spent block: the box opened and empty                                    idle (one frame)
# (frMime is not modelled: the overhaul replaces it with frPoele; it keeps its procedural art until then.)
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_charkit as CK
from fr_charkit import (TAU, PX, X, Y, Z, V, tr, rot_x, rot_y, rot_z, scl, about, xf, ellipsoid, sphere, blob, superellipsoid,
                        tube, cone, sheet, lathe, lathe_y, torus_bm, box_bm, prism, on_ellipsoid, ellipsoid_surf, VSpine,
                        mouth_bm, biped_legs, quad_legs, pose_matrix, perp_frame)

KINDS = ['baguette', 'croissant', 'poele', 'pigeon', 'poodle', 'cat', 'keychain', 'accordion', 'coin', 'star', 'qblock', 'used']
POSES = {
    'baguette': ['walk', 'stun', 'flat', 'ko'],
    'croissant': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'poele': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'pigeon': ['fly', 'swoop', 'stun', 'ko'],
    'poodle': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'cat': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'keychain': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'accordion': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'coin': ['spin'], 'star': ['idle'], 'qblock': ['idle'], 'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'pigeon': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'baguette': 38 / PX, 'croissant': 22 / PX, 'poele': 26 / PX, 'poodle': 24 / PX, 'cat': 20 / PX,
          'keychain': 36 / PX, 'accordion': 30 / PX}
SIZE = {'pigeon': 26 / PX, 'coin': 17 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX}
SIZE.update(HEIGHT)

COLORS = {
    'baguette_crust': '#d68a34', 'baguette_crust_dark': '#b0661e', 'baguette_score': '#f6d48a', 'baguette_flour': '#fff8ec',
    'baguette_eye_white': '#ffffff', 'baguette_pupil': '#1a1020', 'baguette_mouth': '#6a3214', 'baguette_feet': '#6a4a2a',
    'croissant_a': '#e8a040', 'croissant_b': '#d0802a', 'croissant_tip': '#b86a20', 'croissant_glaze': '#f8cc78',
    'croissant_eye_white': '#ffffff', 'croissant_pupil': '#1a1020', 'croissant_mouth': '#6a3010', 'croissant_feet': '#4a3020',
    'poele_iron': '#2e2e38', 'poele_iron_light': '#4a4a58', 'poele_rim': '#5a5a6a', 'poele_handle': '#9a6a3a',
    'poele_handle_dark': '#6a4422', 'poele_crepe': '#f2cc7a', 'poele_crepe_spot': '#c8843a', 'poele_eye_white': '#ffffff',
    'poele_pupil': '#1a1020', 'poele_mouth': '#e8586a', 'poele_feet': '#2a2a32', 'poele_cheek': '#ff8a9a',
    'pigeon_body': '#8a90a8', 'pigeon_wing': '#7a8098', 'pigeon_bar': '#3e4254', 'pigeon_neck': '#4ab894',
    'pigeon_neck2': '#9a6ac8', 'pigeon_head': '#6e7490', 'pigeon_belly': '#a4aac0', 'pigeon_beak': '#3a3a44',
    'pigeon_cere': '#f4f0f0', 'pigeon_feet': '#e8706a', 'pigeon_tail': '#5a6078', 'pigeon_eye_white': '#ffb43a',
    'pigeon_pupil': '#1a1020',
    'poodle_fur': '#ffc4dc', 'poodle_fur_shade': '#f4a8c8', 'poodle_skin': '#f8b4cc', 'poodle_bow': '#d8205a',
    'poodle_nose': '#2a1a24', 'poodle_eye_white': '#ffffff', 'poodle_pupil': '#1a1020', 'poodle_mouth': '#a03050',
    'poodle_collar': '#3a6ad8', 'poodle_tag': '#ffd23a',
    'cat_fur': '#9498ba', 'cat_fur_light': '#b0b4d0', 'cat_chest': '#e8e8f0', 'cat_ear': '#e88aa0', 'cat_nose': '#ff8aa0',
    'cat_eye_white': '#d8ff4a', 'cat_pupil': '#101018', 'cat_mouth': '#101018', 'cat_whisker': '#d8d8e8',
    'keychain_brass': '#d8a850', 'keychain_brass_dark': '#a87a30', 'keychain_brass_light': '#f4d488', 'keychain_ring': '#d8dce8',
    'keychain_plate': '#f4e8c8', 'keychain_eye_white': '#ffffff', 'keychain_pupil': '#1a1020', 'keychain_mouth': '#6a3a1a',
    'keychain_feet': '#8a5a2a',
    'accordion_box': '#d02a3a', 'accordion_box_dark': '#a01a2a', 'accordion_trim': '#f2d27a', 'accordion_bellow': '#2a2a3a',
    'accordion_fold': '#f4ece0', 'accordion_key': '#fff8ec', 'accordion_key_dark': '#2a2a34', 'accordion_strap': '#6a3a2a',
    'accordion_eye_white': '#ffffff', 'accordion_pupil': '#1a1020', 'accordion_mouth': '#5a0a14', 'accordion_feet': '#3a2a2a',
    'coin_shell': '#ff9ab8', 'coin_shell_light': '#ffc4d6', 'coin_foot': '#f07aa0', 'coin_fill': '#fff4e0', 'coin_glint': '#ffffff',
    'star_a': '#ffd24a', 'star_b': '#f0b02a', 'star_tip': '#d8901a', 'star_glaze': '#fff0a0', 'star_eye_white': '#ffffff',
    'star_pupil': '#1a1020', 'star_mouth': '#9a5a10', 'star_sparkle': '#fffbe0',
    'qblock_pink': '#ffb0c4', 'qblock_white': '#fff8f4', 'qblock_ribbon': '#ffd23a', 'qblock_ribbon_dark': '#e8a81a',
    'qblock_edge': '#e07a98', 'qblock_label': '#fff4e0', 'qblock_ink': '#c84a7a',
    'used_box': '#c8a8b4', 'used_stripe': '#dcc4cc', 'used_inside': '#8a6a78', 'used_edge': '#a88894',
}
CK.COLORS.update(COLORS)

def face(b, c, radii, P, az=(-0.42, -1.15), el=0.3, r=0.075, lid_mat='body', pupil=0.5, mouth=None, mz=None, ma=(10, -95), mscale=1.0):
    """Two big eyes on an ellipsoidal head (az: the two eye azimuths, -pi/2 faces the camera) and a mouth under them."""
    for side, a in zip(('r', 'l'), az):
        p, n = on_ellipsoid(c, radii, a, el)
        b.eye(side, p - n * 0.012, n, r, lid=P.get('lid', 0.1), lid_mat=lid_mat, dazed=P.get('dazed', False), pupil=pupil,
              shut='x' if P.get('ko') else ('lid' if P.get('lid', 0) >= 0.999 else None))
    m = mouth or P.get('mouth')
    if m:
        surf = ellipsoid_surf(c, radii[0] * 1.02, radii[1] * 1.02, radii[2] * 1.02)
        b.part('mouth', mouth_bm(surf, m, c.z - radii[2] * 0.25 if mz is None else mz, math.radians(ma[0]), math.radians(ma[1]), scale=mscale), 'mouth')

STD = {
    'walk': dict(sx=1.0, sz=1.0, lean=3, lid=0.12, mouth='grin', feet='walk'),
    'idle': dict(sx=1.0, sz=1.0, lean=0, lid=0.12, mouth='smile', feet='stand'),
    'stun': dict(sx=1.03, sz=0.95, lean=-7, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.3, sz=0.35, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.0, sz=0.95, lean=-10, lid=1.0, mouth='o', feet='limp', ko=True),
}

def std_table(extra=None, walk_bob=0.02, wobble=3.0):
    d = {k: dict(v) for k, v in STD.items()}
    if extra:
        for k, v in extra.items():
            d[k] = dict(v)
    out = {}
    for p, P in d.items():
        out[p] = dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=walk_bob * abs(math.sin(TAU * t)) if p == 'walk' else 0.0,
                                                       lean_extra=wobble * math.sin(TAU * t) if p in ('walk', 'idle') else 0.0), P=P)
    return out

# ================================================================ BAGUETTE (feet, 1.35 m)
BAG_CTRL = [(0.02, 0.14, 0.09, 0.85), (0.02, 0.20, 0.17, 0.85), (0.00, 0.40, 0.205, 0.85), (-0.02, 0.70, 0.215, 0.85),
            (0.00, 1.00, 0.205, 0.85), (0.03, 1.22, 0.17, 0.85), (0.04, 1.34, 0.09, 0.85), (0.04, 1.37, 0.0, 0.85)]

def build_baguette(b, pose, t, P):
    sp = VSpine(BAG_CTRL)
    surf = sp.surf()
    b.part('crust', sp.mesh(rings=30, seg=22), 'crust')
    b.part('base', blob(V(0.02, 0, 0.17), 0.12, 0.11, 0.06), 'crust_dark', subsurf=1)
    # four diagonal scores on the camera side, the cut edges lifted and pale
    for k in range(4):
        v0 = 0.12 + k * 0.105 if k < 2 else 0.6 + k * 0.1
        path = [sp.point(v0 - 0.04 + 0.08 * u, -1.55 + 0.9 * u) + sp.normal(v0 - 0.04 + 0.08 * u, -1.55 + 0.9 * u) * 0.012 for u in (0, 0.33, 0.66, 1.0)]
        b.part('score%d' % k, tube(path, 0.03, 0.022, seg=8), 'score', subsurf=1)
    # flour dust on the top
    for k, (v, a) in enumerate(((0.96, -1.2), (0.93, -0.5), (0.98, -2.0), (0.9, -1.7), (0.99, -0.9))):
        p = sp.point(v, a) + sp.normal(v, a) * 0.005
        b.part('flour%d' % k, sphere(p, 0.022, seg=8, rows=5), 'flour', subsurf=0)
    for side, a in (('r', -0.55), ('l', -1.3)):
        p, n = surf(0.6, a)
        b.eye(side, p - n * 0.012, n, 0.095, lid=P['lid'], lid_mat='crust', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    if P.get('mouth'):
        b.part('mouth', mouth_bm(surf, P['mouth'], 0.47, math.radians(-25), math.radians(-120), scale=1.1), 'mouth')
    biped_legs(b, P, t, (0.03, 0, 0.18), (0.11, 0.065, 0.045), 0.035, 'feet', y=0.1)

BAGUETTE = std_table(walk_bob=0.03, wobble=4.0)

# ================================================================ CROISSANT (feet, ~0.78 m long)
def croissant_body(b, c, R, open_deg, mats, M=None, size=1.0):
    """Five flaky segments on an arc over the top: the fat middle one, two shoulders, two curled pointed horns.
    open_deg: how far the horns swing down (90 = a crescent, 165 = nearly a ring)."""
    segs = [(-1.0, 0.5, mats[2]), (-0.5, 0.8, mats[1]), (0.0, 1.0, mats[0]), (0.5, 0.8, mats[1]), (1.0, 0.5, mats[2])]
    for k, (u, s, mat) in enumerate(segs):
        a = math.radians(90 - u * open_deg)
        p = c + V(math.cos(a) * R * 1.25, 0, math.sin(a) * R) * size
        rr = 0.2 * s * size
        Mseg = tr(p) @ rot_y(-math.degrees(a) + 90)
        b.part('seg%d' % k, xf(ellipsoid(V(0, 0, 0), X * rr * 1.3, Y * rr * 1.25, Z * rr * 0.95), Mseg), mat, M=M)
        # a glaze highlight on the top of the three big segments
        if s > 0.7:
            b.part('glaze%d' % k, xf(ellipsoid(V(0, -rr * 0.35, rr * 0.55), X * rr * 0.45, Y * rr * 0.5, Z * rr * 0.32, seg=12, rows=6), Mseg), 'glaze', subsurf=1, M=M)
        if abs(u) == 1.0:
            tip = p + V(math.cos(a) * 0.08, 0, math.sin(a) * 0.04 - 0.06) * size
            b.part('tip%d' % k, cone(p, tip, rr * 0.7, seg=10), mats[2], subsurf=1, M=M)

def build_croissant(b, pose, t, P):
    if pose == 'roll':
        c = V(0, 0, 0.3)
        MR = about(c, rot_y(360 * t))
        croissant_body(b, c - V(0, 0, 0.0), 0.16, 150, ('a', 'b', 'tip'), M=MR, size=1.0)
        return
    open_deg = 125 if pose == 'curl' else 78
    c = V(0, 0, 0.12 if pose != 'curl' else 0.2)
    croissant_body(b, c, 0.24, open_deg, ('a', 'b', 'tip'))
    hc, hr = c + V(0.04, 0, 0.24), (0.2, 0.25, 0.2)
    face(b, hc, hr, P, az=(-0.55, -1.25), el=0.15, r=0.07, lid_mat='a', mz=hc.z - 0.07, ma=(-10, -95), mscale=0.8)
    if pose != 'curl':
        biped_legs(b, P, t, (0.02, 0, 0.1), (0.055, 0.04, 0.03), 0.025, 'feet', A=0.07, H=0.05, y=0.1)

CROISSANT = std_table({'curl': dict(sx=1.0, sz=1.0, lean=0, lid=0.7, mouth='small', feet='tuck'),
                       'roll': dict(sx=1.0, sz=1.0, lean=0, lid=1.0, mouth=None, feet=None)}, walk_bob=0.015)

# ================================================================ POELE: the walking crêpe pan (feet, ~0.95 m)
def pan(b, c, tilt, P, crepe=True):
    """The pan stands on its rim with its black base toward the camera: a cast-iron disc with a pale rim, a wooden
    handle out the back, a crêpe flopped over the top rim like a beret. tilt: degrees about X (+ = top leans back)."""
    R = 0.36
    Mp = tr(c) @ rot_x(tilt)
    prof = [(0.0, -0.075), (0.30, -0.075), (0.345, -0.06), (R, -0.02), (R + 0.02, 0.06), (R + 0.01, 0.09), (R - 0.03, 0.09), (R - 0.05, 0.03), (0.0, 0.03)]
    b.part('disc', xf(lathe_y(prof, seg=36), Mp), 'iron')
    b.part('rim', xf(torus_bm(V(0, 0.045, 0), Y, R + 0.005, 0.03, seg=36, sides=8), Mp), 'rim', subsurf=1)
    b.part('shine', xf(ellipsoid(V(-0.16, -0.08, 0.14), X * 0.07, Y * 0.01, Z * 0.035, seg=12, rows=6), Mp @ rot_y(35)), 'iron_light', subsurf=1)
    # the handle: an iron neck, then a wooden grip with a hanging hole
    h0, h1, h2 = V(-R + 0.02, 0.02, -0.02), V(-R - 0.18, 0.02, -0.06), V(-R - 0.5, 0.02, -0.14)
    b.part('neck', xf(tube([h0, h1], 0.035, 0.03, seg=8), Mp), 'iron', subsurf=1)
    b.part('grip', xf(tube([h1, h1.lerp(h2, 0.5), h2], 0.05, 0.055, seg=10), Mp), 'handle')
    b.part('hole', xf(torus_bm(h2 + V(0.06, -0.0, 0.015), Y, 0.025, 0.008, seg=10, sides=5), Mp), 'handle_dark', subsurf=0)
    if crepe:
        # the crêpe beret: a thin golden sheet over the top of the rim, drooping on both faces, with brown spots
        def beret(u, v):
            a = math.radians(55 + 70 * u)
            y = -0.13 + 0.26 * v
            sag = 0.05 * math.sin(math.pi * u)
            return V(math.cos(a) * (R + 0.02), y + 0.03, math.sin(a) * (R + 0.02) + sag + 0.06 * (1 - abs(2 * v - 1)) - 0.03)
        b.part('crepe', xf(sheet(beret, 8, 6, 0.012), Mp), 'crepe')
        for k, (dx, dz) in enumerate(((-0.06, 0.38), (0.08, 0.36), (0.0, 0.41))):
            b.part('spot%d' % k, xf(blob(V(dx, -0.11, dz), 0.025, 0.006, 0.02, seg=8, rows=4), Mp), 'crepe_spot', subsurf=0)
    # the face, on the black base: big eyes, rosy cheeks, a smile
    for side, ex in (('r', 0.18), ('l', -0.03)):
        b.eye(side, (Mp @ V(ex, -0.075, 0.07)), (Mp.to_3x3() @ V(0.25, -1, 0)).normalized(), 0.1, lid=P['lid'], lid_mat='iron',
              dazed=P.get('dazed', False), shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    for k, ex in enumerate((0.27, -0.1)):
        b.part('cheek%d' % k, xf(blob(V(ex, -0.08, -0.06), 0.045, 0.006, 0.03, seg=10, rows=5), Mp), 'cheek', subsurf=0)
    style = P.get('mouth')
    if style:
        k = {'grin': 0.04, 'smile': 0.03, 'wobble': 0.0, 'flat': 0.0, 'o': 0.0}.get(style, 0.02)
        if style == 'o':
            b.part('mouth', xf(blob(V(0.08, -0.08, -0.11), 0.04, 0.008, 0.05, seg=12, rows=6), Mp), 'mouth', subsurf=0)
        else:
            pts = [V(0.0 + 0.16 * u, -0.08, -0.1 - k * math.sin(math.pi * u) + (0.012 * math.sin(3 * math.pi * u) if style == 'wobble' else 0)) for u in (i / 8 for i in range(9))]
            b.part('mouth', xf(tube(pts, 0.016, seg=8), Mp), 'mouth', subsurf=1)
    return Mp

def build_poele(b, pose, t, P):
    c = V(0.02, 0, 0.5)
    tilt = P.get('tilt', 0.0)
    flick = 0.0
    if pose == 'throw':
        # wind up (the pan tips back), then flick forward: the crêpe leaves the rim and sails off in front
        u = t
        tilt = -25 * math.sin(math.pi * min(1.0, u / 0.5)) if u < 0.5 else 30 * math.sin(math.pi * (u - 0.5) / 0.5)
        flick = max(0.0, (u - 0.5) / 0.5)
    Mp = pan(b, c, tilt, P, crepe=(pose != 'throw' or flick < 0.15) and pose != 'flat')
    if pose == 'throw' and flick >= 0.15:
        cc = c + V(0.25 + 0.5 * flick, 0, 0.45 + 0.25 * math.sin(math.pi * flick))
        b.part('crepe_fly', xf(lathe([(0.0, 0.015), (0.2, 0.012), (0.24, 0.0), (0.2, -0.012), (0.0, -0.012)], seg=24), tr(cc) @ rot_y(-25 + 90 * flick)), 'crepe')
    biped_legs(b, P, t, (0.03, 0, 0.18), (0.09, 0.06, 0.04), 0.035, 'feet', y=0.13)

POELE = std_table({'throw': dict(sx=1.0, sz=1.0, lean=0, lid=0.0, mouth='o', feet='stand'),
                   'flat': dict(sx=1.25, sz=0.4, lean=0, lid=1.0, mouth='flat', feet='flat')}, walk_bob=0.025, wobble=4.0)

# ================================================================ PIGEON (centre flyer, ~0.9 m)
def wing_frame(root, side, flap_deg, sweep_deg):
    return tr(root) @ rot_z(side * sweep_deg) @ rot_x(side * flap_deg) @ scl(1.0, side, 1.0)

def build_pigeon(b, pose, t, P):
    bc, br = V(-0.02, 0, -0.02), (0.27, 0.19, 0.19)
    b.part('body', blob(bc, *br), 'body')
    b.part('belly', blob(bc + V(0.04, 0, -0.06), 0.2, 0.17, 0.13), 'belly')
    # the iridescent neck collar, the head, the beak with its white cere
    hc = V(0.27, 0, 0.13)
    b.part('neck', tube([V(0.16, 0, 0.03), V(0.24, 0, 0.1)], 0.12, 0.09, seg=12), 'neck')
    b.part('neck2', blob(V(0.18, -0.02, 0.0), 0.08, 0.14, 0.09), 'neck2')
    hr = (0.14, 0.13, 0.13)
    b.part('head', blob(hc, *hr), 'head')
    b.part('beak', cone(hc + V(0.12, 0, -0.015), hc + V(0.23, 0, -0.035), 0.03, seg=10), 'beak', subsurf=1)
    b.part('cere', blob(hc + V(0.13, 0, 0.014), 0.03, 0.024, 0.017, seg=8, rows=5), 'cere', subsurf=1)
    for side, az in (('r', -0.55), ('l', -1.3)):
        p, n = on_ellipsoid(hc, hr, az, 0.3)
        b.eye(side, p - n * 0.01, n, 0.062, pupil=0.42, lid=P.get('lid', 0.15), lid_mat='head', dazed=pose == 'stun',
              shut='x' if pose == 'ko' else None)
    # the tail: a dark fan with a black band
    def tail(u, v):
        return V(-0.24 - 0.22 * u, (v * 2 - 1) * (0.06 + 0.08 * u), 0.02 - 0.03 * u)
    b.part('tail', sheet(tail, 4, 4, 0.012), 'tail')
    b.part('tailbar', sheet(lambda u, v: tail(0.85 + 0.15 * u, v) + V(0, 0, 0.014), 2, 4, 0.008), 'bar', subsurf=1)
    # wings: grey panels with two black bars
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.02, 0.12 * side, 0.08), side, flap, sweep)
        def wing(u, v, W=W):
            span = 0.44 * u
            le = 0.1 + 0.04 * math.sin(math.pi * u) - 0.16 * u ** 3
            chord = 0.28 * (1 - u ** 1.6) + 0.05
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.022 - 0.01 * u), 'wing')
        for k, v0 in enumerate((0.55, 0.75)):
            b.part('bar_%s%d' % (side_name, k), sheet(lambda u, v, W=W, v0=v0: wing(0.15 + 0.5 * u, v0 + 0.08 * v, W) + (W.to_3x3() @ Z) * 0.014, 4, 1, 0.006), 'bar', subsurf=1)
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('leg_' + side_name, tube([V(-0.02, 0.06 * side, -0.17), V(-0.08, 0.06 * side, -0.24)], 0.02, 0.016, seg=8), 'feet', subsurf=1)
        b.part('foot_' + side_name, blob(V(-0.1, 0.06 * side, -0.255), 0.045, 0.025, 0.014, seg=8, rows=5), 'feet', subsurf=1)

PIGEON = {
    'fly': dict(flap=lambda t: 15 + 45 * math.cos(TAU * t), sweep=12, M=lambda t: tr(0, 0, 0.03 * math.sin(TAU * t))),
    'swoop': dict(flap=lambda t: 35, sweep=55, M=lambda: rot_y(26)),
    'stun': dict(flap=lambda t: -55, sweep=6, M=lambda: rot_y(-10), lid=0.5),
    'ko': dict(flap=lambda t: -70, sweep=10, M=lambda: rot_y(-15)),
}

# ================================================================ POODLE (feet, 0.85 m)
def lumpy(c, r, lobes=6, depth=0.13, seed=0, sx=1.0, sz=1.0, seg=28, rows=16):
    """One closed fluffy ball: a sphere whose radius bulges in `lobes` tufts around and up/down, so a clipped pompom
    reads as fluffy with a single clean outline (overlapping balls would scribble ink lines at 24 px)."""
    c = Vector(c)
    rings = [c + Z * r * sz * (1 + depth * 0.5)]
    for i in range(1, rows):
        phi = math.pi * i / rows
        ring = []
        for j in range(seg):
            th = TAU * j / seg
            k = 1 + depth * math.cos(lobes * th + seed) * math.sin(phi) ** 2 + depth * 0.7 * math.cos(3 * phi + seed * 0.7) * math.sin(phi)
            ring.append(c + Vector((math.sin(phi) * math.cos(th) * r * k * sx, math.sin(phi) * math.sin(th) * r * k, math.cos(phi) * r * k * sz)))
        rings.append(ring)
    rings.append(c - Z * r * sz * (1 + depth * 0.5))
    return CK.ring_mesh(rings)

def pom(b, name, c, r, mat='fur', n=7, seed=0, M=None):
    b.part(name, lumpy(c, r, lobes=n, seed=seed), mat, subsurf=1, M=M)

def build_poodle(b, pose, t, P):
    lift = P.get('head_up', 0.0)
    # a cartoon poodle: a big round head with big eyes, a fluffy chest pompom, a hip pompom, a clipped waist, short
    # legs with pompom cuffs, a pompom tail, a topknot with a pink bow
    b.part('waist', blob(V(-0.06, 0, 0.34), 0.16, 0.11, 0.1), 'skin')
    pom(b, 'chest', V(0.08, 0, 0.38), 0.18, seed=1)
    pom(b, 'hip', V(-0.21, 0, 0.36), 0.15, seed=2)
    tail_tip = V(-0.36, 0, 0.6 + 0.03 * math.sin(TAU * t * 2))
    b.part('tail', tube([V(-0.3, 0, 0.42), V(-0.35, 0, 0.5), tail_tip], 0.03, seg=8), 'skin', subsurf=1)
    pom(b, 'tailpom', tail_tip, 0.08, n=5, seed=3)
    hc = V(0.24, 0, 0.7 + lift)
    hr = (0.18, 0.17, 0.17)
    b.part('head', lumpy(hc, 0.17, lobes=7, depth=0.06, seed=4, sx=1.05), 'fur', subsurf=1)
    b.part('muzzle', blob(hc + V(0.17, 0, -0.06), 0.09, 0.075, 0.065), 'skin')
    b.part('nose', sphere(hc + V(0.25, -0.01, -0.04), 0.035, seg=10, rows=6), 'nose', subsurf=1)
    pom(b, 'topknot', hc + V(-0.04, 0, 0.18), 0.11, n=6, seed=5)
    bowc = hc + V(0.04, -0.08, 0.22)
    b.part('bow_l', cone(bowc, bowc + V(-0.1, 0, 0.05), 0.055, flat=0.4, seg=8), 'bow', subsurf=1)
    b.part('bow_r', cone(bowc, bowc + V(0.1, 0, 0.05), 0.055, flat=0.4, seg=8), 'bow', subsurf=1)
    b.part('bow_c', sphere(bowc + V(0, -0.01, 0), 0.035, seg=8, rows=5), 'bow', subsurf=1)
    pom(b, 'ear', hc + V(-0.1, -0.1, -0.1 + (0.05 if lift else 0.0)), 0.1, n=5, seed=6)
    for side, az in (('r', -0.42), ('l', -1.12)):
        p, n = on_ellipsoid(hc, hr, az, 0.18)
        b.eye(side, p - n * 0.012, n, 0.085, lid=P['lid'], lid_mat='fur', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    mc = hc + V(0.17, -0.07, -0.11)
    if m == 'o':
        b.part('mouth', blob(mc, 0.04, 0.02, 0.04, seg=10, rows=6), 'mouth', subsurf=1)
    elif m:
        b.part('mouth', tube([mc + V(-0.05, 0, 0.01), mc, mc + V(0.05, 0.005, 0.015)], 0.016, seg=6), 'mouth', subsurf=1)
    b.part('collar', xf(torus_bm(V(0, 0, 0), Z, 0.1, 0.022, seg=16, sides=6), tr(V(0.2, 0, 0.53 + lift * 0.6)) @ rot_y(-30)), 'collar', subsurf=1)
    b.part('tag', sphere(V(0.27, -0.05, 0.48 + lift * 0.6), 0.03, seg=8, rows=5), 'tag', subsurf=1)
    hips = {'fl': V(0.12, -0.08, 0.26), 'fr': V(0.12, 0.08, 0.26), 'bl': V(-0.2, -0.08, 0.26), 'br': V(-0.2, 0.08, 0.26)}
    quad_legs(b, P, t, hips, 0.065, 0.05, (0.08, 0.075, 0.07), 'skin', A=0.08 if P['feet'] == 'walk' else 0.0, H=0.05, foot_mat='fur')

POODLE = std_table({'notice': dict(sx=1.0, sz=1.0, lean=-6, lid=0.0, mouth='o', feet='stand', head_up=0.06),
                    'charge': dict(sx=1.06, sz=0.94, lean=12, lid=0.3, mouth='grin', feet='walk')}, walk_bob=0.03)
POODLE['charge'] = dict(M=lambda t, P=POODLE['charge']['P']: pose_matrix(P, bob=0.04 * abs(math.sin(TAU * t))), P=POODLE['charge']['P'])

# ================================================================ CAT (feet, black rooftop cat)
def build_cat(b, pose, t, P):
    crouch = P.get('crouch', 0.0)
    stretch = P.get('stretch', 1.0)
    bz = 0.34 - crouch
    b.part('body', blob(V(-0.04, 0, bz), 0.27 * stretch, 0.13, 0.12), 'fur')
    b.part('chest', blob(V(0.17 * stretch, -0.02, bz - 0.02), 0.1, 0.1, 0.1), 'fur')
    b.part('tuft', blob(V(0.24 * stretch, -0.07, bz - 0.03), 0.05, 0.03, 0.07, seg=10, rows=6), 'chest', subsurf=1)
    hc = V(0.31 * stretch, 0, bz + 0.16 - crouch * 0.5)
    hr = (0.18, 0.17, 0.16)
    b.part('head', blob(hc, *hr), 'fur')
    for side, y in (('l', -0.065), ('r', 0.065)):
        base = hc + V(-0.02, y * 1.3, 0.1)
        b.part('ear_' + side, cone(base, base + V(0.02, y * 0.4, 0.14), 0.06, flat=0.5, seg=8), 'fur', subsurf=1)
        b.part('earin_' + side, cone(base + V(0.012, -0.012 if y < 0 else 0.012, 0.01), base + V(0.025, y * 0.4, 0.1), 0.03, flat=0.3, seg=8), 'ear', subsurf=1)
    b.part('nose', blob(hc + V(0.17, -0.03, -0.02), 0.024, 0.02, 0.016, seg=8, rows=5), 'nose', subsurf=0)
    for side, az in (('r', -0.45), ('l', -1.2)):
        p, n = on_ellipsoid(hc, hr, az, 0.22)
        b.eye(side, p - n * 0.012, n, 0.088, pupil=0.32, lid=P['lid'], lid_mat='fur', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    for k, dz in enumerate((-0.035, -0.005)):
        a0 = hc + V(0.13, -0.12, dz - 0.03)
        b.part('whisker%d' % k, tube([a0, a0 + V(0.09, -0.02, 0.01 + dz * 0.5)], 0.005, seg=4), 'whisker', subsurf=0)
    if P.get('mouth') == 'o':
        b.part('mouth', blob(hc + V(0.13, -0.08, -0.08), 0.03, 0.015, 0.03, seg=8, rows=5), 'mouth', subsurf=0)
    # the tail: up and curling at the tip (fluffed when it notices Brady)
    sw = 0.04 * math.sin(TAU * t)
    tail = [V(-0.28 * stretch, 0, bz + 0.03), V(-0.4 * stretch, 0, bz + 0.15), V(-0.42 * stretch + sw, 0, bz + 0.34), V(-0.34 * stretch + sw, 0, bz + 0.44)]
    b.part('tail', tube(tail, 0.045 * P.get('fluff', 1.0), 0.035 * P.get('fluff', 1.0), seg=10), 'fur')
    hips = {'fl': V(0.16 * stretch, -0.07, bz - 0.05), 'fr': V(0.16 * stretch, 0.07, bz - 0.05),
            'bl': V(-0.22 * stretch, -0.07, bz - 0.04), 'br': V(-0.22 * stretch, 0.07, bz - 0.04)}
    quad_legs(b, P, t, hips, 0.04, 0.042, (0.06, 0.05, 0.04), 'fur', A=0.1 if P['feet'] == 'walk' else 0.0, H=0.06)

CAT = std_table({'notice': dict(sx=1.0, sz=1.0, lean=-4, lid=0.0, mouth='o', feet='stand', crouch=0.06, fluff=1.5),
                 'charge': dict(sx=1.0, sz=1.0, lean=6, lid=0.25, mouth=None, feet='walk', stretch=1.18),
                 'walk': dict(sx=1.0, sz=1.0, lean=0, lid=0.35, mouth=None, feet='walk')}, walk_bob=0.012, wobble=1.0)

# ================================================================ KEYCHAIN (feet, 1.28 m): the souvenir tower minion
def build_keychain(b, pose, t, P):
    H = 1.0
    z0 = 0.16
    # four curved brass legs (two seen, two behind), the arch, two decks, the spire, the key ring
    def leg(u, sx, y):
        x0, z1 = 0.24 * sx, H * 0.62
        return V(x0 * (1 - u) ** 1.6 + 0.04 * sx * u, y, z0 + z1 * u)
    for sx in (-1, 1):
        for y in (-0.06, 0.06):
            b.part('leg_%d_%d' % (sx, int(y > 0)), tube([leg(u, sx, y) for u in (0, 0.33, 0.66, 1.0)], 0.04, 0.025, seg=8), 'brass_dark' if y > 0 else 'brass')
    b.part('arch', xf(torus_bm(V(0, 0, 0), Y, 0.13, 0.025, seg=16, sides=6), tr(V(0, -0.07, z0 + 0.12)) @ scl(1, 1, 0.9)), 'brass', subsurf=1)
    b.part('deck1', box_bm((0.34, 0.2, 0.05), bevel=0.012, segments=1), 'brass_light', subsurf=0, M=pose_matrix_cached(b) @ tr(0, 0, z0 + H * 0.3))
    b.part('deck2', box_bm((0.2, 0.15, 0.04), bevel=0.01, segments=1), 'brass_light', subsurf=0, M=pose_matrix_cached(b) @ tr(0, 0, z0 + H * 0.62))
    b.part('spire', cone(V(0, 0, z0 + H * 0.62), V(0, 0, z0 + H * 0.98), 0.05, seg=8), 'brass', subsurf=1)
    b.part('ring', xf(torus_bm(V(0, 0, 0), Y, 0.09, 0.016, seg=20, sides=6), tr(V(0, 0, z0 + H * 1.08))), 'ring', subsurf=1)
    # X braces on the front legs
    for k in range(2):
        za, zb = z0 + 0.32 + k * 0.14, z0 + 0.44 + k * 0.14
        xa, xb = 0.24 * (1 - (za - z0) / (H * 0.62)) ** 1.6 + 0.02, 0.24 * (1 - (zb - z0) / (H * 0.62)) ** 1.6 + 0.02
        b.part('xa%d' % k, tube([V(-xa, -0.07, za), V(xb, -0.07, zb)], 0.012, seg=5), 'brass_dark', subsurf=0)
        b.part('xb%d' % k, tube([V(xa, -0.07, za), V(-xb, -0.07, zb)], 0.012, seg=5), 'brass_dark', subsurf=0)
    # the face: a little enamel plate under the first deck with the eyes and a grin
    fc = V(0.03, -0.1, z0 + H * 0.2)
    b.part('plate', xf(lathe_y([(0.0, -0.015), (0.16, -0.015), (0.17, 0.0), (0.16, 0.015), (0.0, 0.015)], seg=24), tr(fc)), 'plate', subsurf=1)
    for side, ex in (('r', 0.075), ('l', -0.05)):
        b.eye(side, fc + V(ex, -0.02, 0.035), V(0.2, -1, 0).normalized(), 0.07, lid=P['lid'], lid_mat='brass', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(fc + V(0.01, -0.03, -0.06), 0.025, 0.01, 0.025, seg=8, rows=5), 'mouth', subsurf=0)
    elif m:
        k = 0.02 if m in ('grin', 'smile') else 0.0
        b.part('mouth', tube([fc + V(-0.04 + 0.1 * u, -0.03, -0.06 - k * math.sin(math.pi * u)) for u in (0, 0.25, 0.5, 0.75, 1)], 0.011, seg=6), 'mouth', subsurf=1)
    biped_legs(b, P, t, (0.0, 0, 0.16), (0.08, 0.05, 0.035), 0.028, 'feet', y=0.13)

def pose_matrix_cached(b):
    return b.M

KEYCHAIN = std_table({'hop': dict(sx=0.92, sz=1.12, lean=0, lid=0.0, mouth='o', feet='tuck')}, walk_bob=0.03, wobble=4.0)
KEYCHAIN['hop'] = dict(M=lambda t, P=KEYCHAIN['hop']['P']: tr(0, 0, 0.12) @ pose_matrix(P), P=KEYCHAIN['hop']['P'])

# ================================================================ ACCORDION (feet, 1.07 m)
def build_accordion(b, pose, t, P):
    squeeze = P.get('squeeze', lambda t: 1.0)(t)
    W, Hh, D = 0.2, 0.62, 0.3                 # one end box
    gap = 0.34 * squeeze                       # the bellows
    zc = 0.2 + Hh / 2
    for side, sx in (('back', -1), ('front', 1)):
        cx = sx * (gap / 2 + W / 2)
        b.part('box_' + side, superellipsoid(V(cx, 0, zc), W / 2, D / 2, Hh / 2, e=0.25, seg=20, rows=10), 'box')
        b.part('trim_' + side, superellipsoid(V(cx, -0.004, zc), W / 2 - 0.03, D / 2 + 0.006, Hh / 2 - 0.03, e=0.2, seg=16, rows=8), 'box_dark', subsurf=1)
    # bellows: alternating dark folds and pale pleat edges, zig-zagging in depth
    n = 7
    for k in range(n + 1):
        x = -gap / 2 + gap * k / n
        mat = 'fold' if k % 2 else 'bellow'
        b.part('pleat%d' % k, superellipsoid(V(x, 0.0 if k % 2 else 0.015, zc), 0.012 + 0.012 * (k % 2 == 0), D / 2 - 0.01 - 0.02 * (k % 2), Hh / 2 - 0.03, e=0.2, seg=14, rows=6), mat, subsurf=0)
    b.part('bellow_core', box_bm((gap, D - 0.06, Hh - 0.08)), 'bellow', subsurf=0, M=b.M @ tr(0, 0, zc))
    # piano keys on the back end, buttons on the front end... and the face on the front end
    bx = -(gap / 2 + W / 2)
    for k in range(6):
        b.part('key%d' % k, box_bm((0.1, 0.02, 0.06), bevel=0.01, segments=1), 'key' if k % 2 == 0 else 'key_dark', subsurf=0,
               M=b.M @ tr(bx - 0.01, -D / 2 - 0.01, zc + 0.22 - k * 0.085))
    fx = gap / 2 + W / 2
    fc = V(fx + 0.01, -D / 2 - 0.006, zc + 0.08)
    for side, ex in (('r', 0.07), ('l', -0.07)):
        b.eye(side, fc + V(ex, -0.012, 0.0), V(0.15, -1, 0).normalized(), 0.08, lid=P['lid'], lid_mat='box', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    m = P.get('mouth')
    if m == 'o':
        b.part('mouth', blob(fc + V(0.0, -0.02, -0.15), 0.04, 0.012, 0.05, seg=10, rows=6), 'mouth', subsurf=0)
    elif m:
        k = 0.03 if m in ('grin', 'smile') else 0.0
        b.part('mouth', tube([fc + V(-0.06 + 0.12 * u, -0.022, -0.14 - k * math.sin(math.pi * u) + (0.01 * math.sin(3 * math.pi * u) if m == 'wobble' else 0)) for u in (0, 0.25, 0.5, 0.75, 1)], 0.014, seg=6), 'mouth', subsurf=1)
    for k in range(3):
        b.part('btn%d' % k, sphere(V(fx + 0.06 - k * 0.06, -D / 2 - 0.01, zc - 0.24), 0.018, seg=8, rows=5), 'key', subsurf=0)
    # the strap over the top and a gold trim line
    b.part('strap', tube([V(bx, -0.02, zc + Hh / 2), V(0, -0.02, zc + Hh / 2 + 0.12), V(fx, -0.02, zc + Hh / 2)], 0.025, seg=8), 'strap', subsurf=1)
    biped_legs(b, P, t, (0.0, 0, 0.18), (0.09, 0.06, 0.04), 0.035, 'feet', y=0.12)

ACCORDION = std_table({'throw': dict(sx=1.0, sz=1.0, lean=0, lid=0.0, mouth='o', feet='stand',
                                     squeeze=lambda t: 1.0 - 0.45 * math.sin(math.pi * t))}, walk_bob=0.02, wobble=3.0)
for _p in ('walk', 'idle'):
    ACCORDION[_p]['P']['squeeze'] = (lambda t: 1.0 + 0.12 * math.sin(TAU * t))

# ================================================================ COIN: the macaron
def build_coin(b, pose, t, P):
    # the macaron stands on edge facing the camera (axis Y): two domed shells, the ruffled feet, the cream filling
    for k, sy in enumerate((-1, 1)):
        prof = [(0.0, sy * 0.19), (0.12, sy * 0.185), (0.22, sy * 0.15), (0.27, sy * 0.1), (0.28, sy * 0.07), (0.0, sy * 0.07)]
        b.part('shell%d' % k, lathe_y(prof if sy > 0 else list(reversed(prof)), seg=32), 'shell')
        b.part('foot%d' % k, torus_bm(V(0, sy * 0.06, 0), Y, 0.27, 0.025, seg=32, sides=6), 'foot', subsurf=1)
    b.part('fill', lathe_y([(0.0, -0.06), (0.25, -0.06), (0.26, 0.0), (0.25, 0.06), (0.0, 0.06)], seg=32), 'fill')
    b.part('glint', ellipsoid(V(-0.1, -0.19, 0.12), X * 0.06, Y * 0.01, Z * 0.035, seg=10, rows=5), 'glint', subsurf=1)

COIN = {'spin': dict(M=lambda t: rot_z(360 * t))}

# ================================================================ STAR: the golden croissant
def build_star(b, pose, t, P):
    c = V(0, 0, -0.12)
    croissant_body(b, c, 0.27, 80, ('a', 'b', 'tip'))
    hc, hr = c + V(0.04, 0, 0.27), (0.22, 0.27, 0.22)
    face(b, hc, hr, {'lid': 0.1, 'mouth': 'smile'}, az=(-0.55, -1.25), el=0.15, r=0.07, lid_mat='a', mz=hc.z - 0.08, ma=(-10, -95), mscale=0.8)
    for k, (x, z, s) in enumerate(((-0.36, 0.3, 0.06), (0.4, 0.26, 0.05), (0.02, 0.42, 0.04))):
        for d in (X, Z):
            b.part('spark%d%s' % (k, 'x' if d is X else 'z'), ellipsoid(V(x, -0.25, z), d * s * 1.8 + Y * 0.0001, Y * 0.01, (Z if d is X else X) * s * 0.35, seg=8, rows=4), 'sparkle', subsurf=0)

STAR = {'idle': dict(M=lambda t: tr(V(0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(4 * math.sin(TAU * t)))}

# ================================================================ QBLOCK / USED: the pâtisserie box
def build_qblock(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.94
    b.part('core', box_bm((W, D, H), bevel=0.05, segments=2), 'pink', subsurf=0)
    # vertical white stripes on the front (and the visible top edge)
    n = 5
    for k in range(n):
        x = -W / 2 + W * (k + 0.5) / n
        b.part('stripe%d' % k, box_bm((W / n * 0.45, 0.012, H - 0.1)), 'white', subsurf=0, smooth=False, M=b.M @ tr(x, -D / 2 - 0.006, 0))
    # the ribbon: a vertical and a horizontal band on the front, the band over the top, a bow
    b.part('rib_v', box_bm((0.16, 0.03, H + 0.01)), 'ribbon', subsurf=0, smooth=False, M=b.M @ tr(0, -D / 2 - 0.012, 0))
    b.part('rib_h', box_bm((W + 0.01, 0.03, 0.14)), 'ribbon', subsurf=0, smooth=False, M=b.M @ tr(0, -D / 2 - 0.014, -0.05))
    b.part('rib_top', box_bm((0.16, D + 0.02, 0.03)), 'ribbon', subsurf=0, smooth=False, M=b.M @ tr(0, 0, H / 2 + 0.012))
    b.part('rib_top2', box_bm((W + 0.02, 0.16, 0.03)), 'ribbon', subsurf=0, smooth=False, M=b.M @ tr(0, 0, H / 2 + 0.014))
    top = V(0, -0.1, H / 2 + 0.05)
    for sx in (-1, 1):
        b.part('loop%d' % sx, xf(torus_bm(V(0, 0, 0), Y, 0.11, 0.035, seg=16, sides=6), tr(top + V(sx * 0.13, 0, 0.07)) @ scl(1.2, 1, 0.75)), 'ribbon', subsurf=1)
        b.part('tail%d' % sx, tube([top, top + V(sx * 0.1, -0.02, -0.06), top + V(sx * 0.16, -0.03, -0.16)], 0.03, 0.025, seg=6), 'ribbon_dark', subsurf=1)
    b.part('knot', sphere(top + V(0, -0.01, 0.03), 0.06, seg=10, rows=6), 'ribbon_dark', subsurf=1)
    # a little oval label with a pink ink macaron on it
    lc = V(0.27, -D / 2 - 0.03, 0.2)
    b.part('label', xf(lathe_y([(0.0, -0.01), (0.13, -0.01), (0.14, 0.0), (0.13, 0.01), (0.0, 0.01)], seg=24), tr(lc) @ scl(1.3, 1, 1)), 'label', subsurf=0)
    b.part('ink', blob(lc + V(0, -0.012, 0.0), 0.06, 0.006, 0.04, seg=12, rows=5), 'ink', subsurf=0)

def build_used(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.9
    b.part('core', box_bm((W, D, H), bevel=0.05, segments=2), 'box', subsurf=0, M=b.M @ tr(0, 0, -0.02))
    for k in range(5):
        x = -W / 2 + W * (k + 0.5) / 5
        b.part('stripe%d' % k, box_bm((W / 5 * 0.45, 0.012, H - 0.12)), 'stripe', subsurf=0, smooth=False, M=b.M @ tr(x, -D / 2 - 0.006, -0.02))
    b.part('inside', box_bm((W - 0.12, D - 0.12, 0.03)), 'inside', subsurf=0, smooth=False, M=b.M @ tr(0, 0, H / 2 - 0.0))
    b.part('flap', box_bm((W, 0.03, 0.34), bevel=0.02, segments=1), 'edge', subsurf=0, M=b.M @ tr(0, D / 2 + 0.05, H / 2 + 0.12) @ rot_x(-25))

# ================================================================ EXTRA KINDS for the level overhaul (docs/design/LEVEL_OVERHAUL.md
# §4.3 / §8.2): not referenced by the game yet; when frCoq / frBoar / frSnail / frMole / frMagpie arrive they pick these
# clips up by name ('coq', 'boar', ...) from the fr atlas.
def build_coq(b, pose, t, P):
    """A plump russet rooster with a big red comb and wattles, a dark green sickle tail; 'notice' is his wake-up crow."""
    crow = P.get('crow', False)
    bc = V(-0.02, 0, 0.5)
    b.part('body', blob(bc, 0.27, 0.2, 0.24), 'body')
    b.part('breast', blob(bc + V(0.1, 0, -0.04), 0.17, 0.17, 0.18), 'breast')
    b.part('wing', blob(bc + V(-0.05, -0.14, 0.02), 0.18, 0.06, 0.12), 'wing')
    # the sickle tail: three arched dark feathers
    for k in range(3):
        a0 = bc + V(-0.22, (k - 1) * 0.04, 0.08)
        path = [a0, a0 + V(-0.08, 0, 0.18 + 0.05 * k), a0 + V(-0.2 - 0.04 * k, 0, 0.26 + 0.06 * k), a0 + V(-0.3 - 0.05 * k, 0, 0.12 + 0.08 * k)]
        b.part('tail%d' % k, tube(path, 0.045, 0.02, seg=8), 'tail' if k != 1 else 'tail2')
    hc = V(0.2, 0, 0.86) + (V(0.02, 0, 0.06) if crow else V(0, 0, 0))
    b.part('neck', tube([bc + V(0.14, 0, 0.1), hc - V(0.02, 0, 0.06)], 0.12, 0.09, seg=10), 'neck')
    hr = (0.13, 0.12, 0.12)
    b.part('head', blob(hc, *hr), 'neck')
    for k in range(4):   # the comb: four round lobes
        b.part('comb%d' % k, sphere(hc + V(-0.07 + k * 0.05, 0, 0.12 + 0.03 * math.sin(math.pi * k / 3)), 0.05, seg=10, rows=6), 'comb', subsurf=1)
    b.part('wattle', blob(hc + V(0.1, -0.01, -0.12), 0.035, 0.03, 0.06, seg=10, rows=6), 'comb', subsurf=1)
    if crow:
        b.part('beak_t', cone(hc + V(0.1, 0, 0.0), hc + V(0.23, 0, 0.06), 0.035, flat=0.7, seg=8), 'beak', subsurf=1)
        b.part('beak_b', cone(hc + V(0.1, 0, -0.03), hc + V(0.2, 0, -0.08), 0.03, flat=0.7, seg=8), 'beak', subsurf=1)
    else:
        b.part('beak', cone(hc + V(0.1, 0, -0.01), hc + V(0.22, 0, -0.04), 0.04, flat=0.7, seg=8), 'beak', subsurf=1)
    for side, az in (('r', -0.45), ('l', -1.2)):
        p, n = on_ellipsoid(hc, hr, az, 0.25)
        b.eye(side, p - n * 0.01, n, 0.06, lid=P['lid'] if not crow else 0.6, lid_mat='neck', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
    biped_legs(b, P, t, (0.0, 0, 0.3), (0.1, 0.05, 0.03), 0.03, 'legs', A=0.1, H=0.08, y=0.09)

COQ = std_table({'notice': dict(sx=1.0, sz=1.06, lean=-12, lid=0.6, mouth=None, feet='stand', crow=True)}, walk_bob=0.03, wobble=3.0)

def build_boar(b, pose, t, P):
    """A bristly brown wild boar: a big wedge of a body, a pale snout disc, two curled tusks, a ridge of bristles;
    'idle' is the sleeper (eyes shut, a snore bubble), 'notice' the snort, 'charge' the head-down run."""
    asleep = P.get('asleep', False)
    bc = V(-0.05, 0, 0.42)
    b.part('body', blob(bc, 0.36, 0.22, 0.24), 'body')
    b.part('belly', blob(bc + V(0.02, 0, -0.08), 0.28, 0.19, 0.15), 'belly')
    for k in range(7):   # bristles along the back
        x = -0.3 + k * 0.09
        b.part('bristle%d' % k, cone(bc + V(x, 0, 0.21 - 0.04 * abs(x)), bc + V(x - 0.04, 0, 0.32 - 0.05 * abs(x)), 0.04, flat=0.4, seg=6), 'bristle', subsurf=1)
    hc = bc + V(0.36, 0, 0.0 - P.get('head_down', 0.0))
    hr = (0.17, 0.15, 0.15)
    b.part('head', blob(hc, *hr), 'body')
    b.part('snout', tube([hc + V(0.1, 0, -0.03), hc + V(0.24, 0, -0.06)], 0.08, 0.075, seg=12), 'snout')
    b.part('disc', xf(lathe([(0.0, 0.0), (0.072, 0.0), (0.075, 0.02), (0.0, 0.02)], seg=16), tr(hc + V(0.245, 0, -0.06)) @ rot_y(90)), 'nose', subsurf=1)
    for k, y in enumerate((-0.025, 0.025)):
        b.part('nostril%d' % k, sphere(hc + V(0.27, y - 0.01, -0.06), 0.015, seg=6, rows=4), 'nostril', subsurf=0)
    for k, y in enumerate((-0.07, 0.07)):
        b.part('tusk%d' % k, tube([hc + V(0.17, y, -0.1), hc + V(0.21, y * 1.1, -0.04), hc + V(0.18, y * 1.1, 0.02)], 0.022, 0.008, seg=6), 'tusk', subsurf=1)
        b.part('ear%d' % k, cone(hc + V(-0.06, y * 1.4, 0.1), hc + V(-0.1, y * 1.8, 0.24), 0.05, flat=0.5, seg=8), 'body', subsurf=1)
    for side, az in (('r', -0.5), ('l', -1.25)):
        p, n = on_ellipsoid(hc, hr, az, 0.3)
        b.eye(side, p - n * 0.01, n, 0.06, lid=1.0 if asleep else P['lid'], lid_mat='body', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if asleep or P['lid'] >= 0.999 else None))
        if P.get('angry'):
            b.brow(side, p - n * 0.01, n, 0.06, angry=1.0)
    if asleep:
        b.part('snore', sphere(hc + V(0.28, -0.05, 0.05), 0.07, seg=12, rows=8), 'snore', subsurf=1)
    b.part('tail', tube([bc + V(-0.35, 0, 0.1), bc + V(-0.42, 0, 0.14), bc + V(-0.44, 0, 0.08)], 0.02, seg=6), 'body', subsurf=1)
    hips = {'fl': V(0.18, -0.1, 0.28), 'fr': V(0.18, 0.1, 0.28), 'bl': V(-0.26, -0.1, 0.3), 'br': V(-0.26, 0.1, 0.3)}
    quad_legs(b, P, t, hips, 0.04, 0.05, (0.06, 0.05, 0.04), 'body', A=0.1 if P['feet'] == 'walk' else 0.0, H=0.06, foot_mat='hoof')

BOAR = std_table({'idle': dict(sx=1.0, sz=0.96, lean=0, lid=1.0, mouth=None, feet='flat', asleep=True),
                  'notice': dict(sx=1.0, sz=1.0, lean=-6, lid=0.0, mouth=None, feet='stand', angry=True),
                  'charge': dict(sx=1.05, sz=0.95, lean=8, lid=0.3, mouth=None, feet='walk', angry=True, head_down=0.06)}, walk_bob=0.02, wobble=1.5)
BOAR['idle'] = dict(M=lambda t, P=BOAR['idle']['P']: pose_matrix(P, sz_extra=1.0 + 0.03 * math.sin(TAU * t)), P=BOAR['idle']['P'])

def build_snail(b, pose, t, P):
    """An escargot with a striped spiral shell: 'curl' hides in the shell (only the shell and a peeking eye)."""
    hide = pose in ('curl',)
    sc = V(-0.06, 0, 0.36)
    # the shell: a stack of shrinking tori spiralling in toward the camera side, over a round core
    b.part('shell', xf(lathe_y([(0.0, -0.17), (0.2, -0.16), (0.27, -0.08), (0.28, 0.0), (0.26, 0.1), (0.15, 0.17), (0.0, 0.17)], seg=32), tr(sc)), 'shell')
    for k in range(18):
        a = k * 0.62
        r = 0.21 * (1 - k / 22)
        p = sc + V(math.cos(a) * r, -0.17, math.sin(a) * r)
        b.part('spiral%d' % k, sphere(p, 0.03 * (1 - k / 26), seg=8, rows=5), 'stripe', subsurf=0)
    if not hide:
        sp = [V(-0.3, 0, 0.06), V(-0.05, 0, 0.07), V(0.18, 0, 0.09), V(0.3, 0, 0.2), V(0.32, 0, 0.36)]
        b.part('foot', tube(sp, 0.07, 0.09, seg=12, radii=[0.03, 0.08, 0.09, 0.1, 0.09]), 'skin')
        hc = V(0.32, 0, 0.4)
        for k, y in enumerate((-0.05, 0.05)):
            tip = hc + V(0.06 + 0.02 * k, y, 0.24 + 0.02 * math.sin(TAU * t + k))
            b.part('stalk%d' % k, tube([hc + V(0.0, y, 0.05), tip], 0.025, 0.02, seg=8), 'skin', subsurf=1)
        for side, (k, y) in zip(('r', 'l'), enumerate((0.05, -0.05))):
            tip = hc + V(0.06 + 0.02 * k, y, 0.24 + 0.02 * math.sin(TAU * t + k))
            b.eye(side, tip + V(0, -0.02, 0.03), V(0.3, -1, 0.2).normalized(), 0.06, lid=P['lid'], lid_mat='skin', dazed=P.get('dazed', False),
                  shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
        if P.get('mouth'):
            b.part('mouth', tube([hc + V(0.06, -0.09, 0.0), hc + V(0.1, -0.095, -0.02), hc + V(0.13, -0.08, 0.0)], 0.013, seg=6), 'mouth', subsurf=1)
    else:
        b.part('peek', blob(sc + V(0.24, -0.05, -0.16), 0.08, 0.06, 0.05), 'skin')
        b.eye('r', sc + V(0.27, -0.1, -0.14), V(0.3, -1, 0).normalized(), 0.045, lid=0.5, lid_mat='skin')

SNAIL = std_table({'curl': dict(sx=1.0, sz=1.0, lean=0, lid=0.5, mouth=None, feet='tuck')}, walk_bob=0.006, wobble=1.0)

def build_mole(b, pose, t, P):
    """A velvety mole with tiny round spectacles, a pink star nose and big pink digging paws."""
    bc = V(0.0, 0, 0.32)
    b.part('body', blob(bc, 0.26, 0.2, 0.26), 'fur')
    b.part('belly', blob(bc + V(0.08, -0.03, -0.04), 0.17, 0.16, 0.18), 'fur_light')
    hc = bc + V(0.17, 0, 0.17)
    hr = (0.15, 0.14, 0.13)
    b.part('head', blob(hc, *hr), 'fur')
    b.part('snout', tube([hc + V(0.1, 0, -0.02), hc + V(0.2, 0, -0.04)], 0.05, 0.035, seg=10), 'fur')
    b.part('nose', sphere(hc + V(0.22, 0, -0.04), 0.04, seg=10, rows=6), 'nose', subsurf=1)
    # the spectacles: two round wire rims with pale lenses, a bridge, over two little eyes
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = on_ellipsoid(hc, hr, az, 0.3)
        b.eye(side, p - n * 0.015, n, 0.055, pupil=0.6, lid=P['lid'], lid_mat='fur', dazed=P.get('dazed', False),
              shut='x' if P.get('ko') else ('lid' if P['lid'] >= 0.999 else None))
        b.part('rim_' + side, torus_bm(p + n * 0.03, n, 0.052, 0.008, seg=18, sides=5), 'specs', subsurf=0)
    p1, n1 = on_ellipsoid(hc, hr, -0.5, 0.3); p2, n2 = on_ellipsoid(hc, hr, -1.2, 0.3)
    b.part('bridge', tube([p1 + n1 * 0.04, (p1 + p2) / 2 + (n1 + n2) * 0.04, p2 + n2 * 0.04], 0.01, seg=5), 'specs', subsurf=0)
    if P.get('mouth'):
        b.part('mouth', tube([hc + V(0.12, -0.08, -0.08), hc + V(0.15, -0.085, -0.095), hc + V(0.18, -0.07, -0.085)], 0.012, seg=6), 'mouth', subsurf=1)
    dig = math.sin(TAU * t) if pose in ('walk', 'idle') else 0.0
    for side, y in (('l', -0.17), ('r', 0.17)):
        pc = bc + V(0.18 + 0.04 * dig * (1 if side == 'l' else -1), y, -0.08)
        b.part('paw_' + side, blob(pc, 0.08, 0.04, 0.07), 'paw')
        for k in range(4):
            b.part('claw_%s%d' % (side, k), cone(pc + V(0.06, 0, -0.04 + k * 0.03), pc + V(0.12, 0, -0.05 + k * 0.035), 0.016, seg=6), 'claw', subsurf=0)
    biped_legs(b, P, t, (-0.08, 0, 0.12), (0.08, 0.05, 0.035), 0.035, 'paw', A=0.07, H=0.04, y=0.12)

MOLE = std_table({'idle': dict(sx=1.0, sz=1.0, lean=0, lid=0.2, mouth='smile', feet='stand')}, walk_bob=0.015, wobble=2.0)

def build_magpie(b, pose, t, P):
    """A black-and-white magpie with a long glossy blue-green tail (the coin thief)."""
    bc = V(-0.02, 0, 0.0)
    b.part('body', blob(bc, 0.22, 0.15, 0.15), 'black')
    b.part('belly', blob(bc + V(0.02, 0, -0.05), 0.16, 0.13, 0.1), 'white')
    hc = V(0.22, 0, 0.1)
    hr = (0.12, 0.11, 0.11)
    b.part('head', blob(hc, *hr), 'black')
    b.part('beak', cone(hc + V(0.1, 0, -0.01), hc + V(0.22, 0, -0.03), 0.03, flat=0.7, seg=8), 'beak', subsurf=1)
    for side, az in (('r', -0.5), ('l', -1.25)):
        p, n = on_ellipsoid(hc, hr, az, 0.25)
        b.eye(side, p - n * 0.01, n, 0.055, lid=P.get('lid', 0.15), lid_mat='black', dazed=pose == 'stun', shut='x' if pose == 'ko' else None)
    def tail(u, v):
        return V(-0.2 - 0.42 * u, (v * 2 - 1) * (0.04 + 0.03 * u), 0.03 + 0.04 * u)
    b.part('tail', sheet(tail, 6, 3, 0.012), 'gloss')
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.02, 0.1 * side, 0.06), side, flap, sweep)
        def wing(u, v, W=W):
            span = 0.4 * u
            le = 0.08 + 0.03 * math.sin(math.pi * u) - 0.12 * u ** 3
            chord = 0.24 * (1 - u ** 1.6) + 0.05
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.02 - 0.008 * u), 'black')
        b.part('patch_' + side_name, sheet(lambda u, v, W=W: wing(0.05 + 0.45 * u, 0.15 + 0.35 * v, W) + (W.to_3x3() @ Z) * 0.012, 4, 2, 0.006), 'white', subsurf=1)

MAGPIE = {
    'fly': dict(flap=lambda t: 15 + 45 * math.cos(TAU * t), sweep=12, M=lambda t: tr(0, 0, 0.03 * math.sin(TAU * t))),
    'swoop': dict(flap=lambda t: 35, sweep=55, M=lambda: rot_y(26)),
    'stun': dict(flap=lambda t: -55, sweep=6, M=lambda: rot_y(-10), lid=0.5),
    'ko': dict(flap=lambda t: -70, sweep=10, M=lambda: rot_y(-15)),
}

EXTRA = ['coq', 'boar', 'snail', 'mole', 'magpie']
KINDS += EXTRA
POSES.update({'coq': ['walk', 'notice', 'stun', 'flat', 'ko'], 'boar': ['walk', 'idle', 'notice', 'charge', 'stun', 'flat', 'ko'],
              'snail': ['walk', 'curl', 'stun', 'flat', 'ko'], 'mole': ['walk', 'idle', 'stun', 'flat', 'ko'],
              'magpie': ['fly', 'swoop', 'stun', 'ko']})
FRAMES.update({('boar', 'idle'): (2, 2), ('mole', 'idle'): (4, 6), ('coq', 'walk'): (6, 9), ('boar', 'walk'): (6, 9),
               ('snail', 'walk'): (4, 5), ('mole', 'walk'): (6, 9), ('magpie', 'fly'): (4, 8)})   # extras: lighter clips
ORIGIN.update({'coq': 'feet', 'boar': 'feet', 'snail': 'feet', 'mole': 'feet', 'magpie': 'centre'})
HEIGHT.update({'coq': 30 / PX, 'boar': 26 / PX, 'snail': 20 / PX, 'mole': 22 / PX})
SIZE.update({'magpie': 28 / PX}); SIZE.update(HEIGHT)
COLORS2 = {
    'coq_body': '#c8582a', 'coq_breast': '#e8823a', 'coq_wing': '#8a3418', 'coq_tail': '#1e3a3a', 'coq_tail2': '#2a5a4a',
    'coq_neck': '#f0a040', 'coq_comb': '#e8222a', 'coq_beak': '#ffc83a', 'coq_legs': '#ffb02a', 'coq_eye_white': '#ffffff',
    'coq_pupil': '#1a1020', 'coq_mouth': '#6a1a10',
    'boar_body': '#7a5034', 'boar_belly': '#9a6a48', 'boar_bristle': '#4a2e1c', 'boar_snout': '#c88a78', 'boar_nose': '#e8a090',
    'boar_nostril': '#3a1a14', 'boar_tusk': '#fff4dc', 'boar_hoof': '#2a1e18', 'boar_eye_white': '#ffffff', 'boar_pupil': '#1a1020',
    'boar_snore': '#d8f0ff', 'boar_mouth': '#3a1a14',
    'snail_shell': '#d8a058', 'snail_stripe': '#8a5226', 'snail_skin': '#c8c89a', 'snail_eye_white': '#ffffff',
    'snail_pupil': '#1a1020', 'snail_mouth': '#5a5a3a',
    'mole_fur': '#3a3448', 'mole_fur_light': '#54506a', 'mole_nose': '#ff8aa8', 'mole_paw': '#f4a8b8', 'mole_claw': '#fff4ec',
    'mole_specs': '#a8802a', 'mole_eye_white': '#ffffff', 'mole_pupil': '#1a1020', 'mole_mouth': '#1a1020',
    'magpie_black': '#22232e', 'magpie_white': '#f4f6fa', 'magpie_gloss': '#2a5a7a', 'magpie_beak': '#2a2a30',
    'magpie_eye_white': '#ffffff', 'magpie_pupil': '#1a1020',
}
CK.COLORS.update(COLORS2)

BUILDERS = {
    'baguette': (build_baguette, BAGUETTE), 'croissant': (build_croissant, CROISSANT), 'poele': (build_poele, POELE),
    'pigeon': (build_pigeon, PIGEON), 'poodle': (build_poodle, POODLE), 'cat': (build_cat, CAT),
    'keychain': (build_keychain, KEYCHAIN), 'accordion': (build_accordion, ACCORDION),
    'coin': (build_coin, COIN), 'star': (build_star, STAR), 'qblock': (build_qblock, {'idle': {}}), 'used': (build_used, {'idle': {}}),
    'coq': (build_coq, COQ), 'boar': (build_boar, BOAR), 'snail': (build_snail, SNAIL), 'mole': (build_mole, MOLE), 'magpie': (build_magpie, MAGPIE),
}
build, clear = CK.make_api(BUILDERS)
