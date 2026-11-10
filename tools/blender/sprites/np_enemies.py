# np_enemies: the Nepal cast of Super Brady-O World (world 12, the finale) for the pre-rendered Fiesta Toon pipeline.
# All original cartoon designs (food, animals, the Baron's toys). Same conventions as jp_enemies.py (helpers in
# jp_charkit.py): Z up, characters FACE +X, camera along +Y; feet-origin kinds stand on z = 0, centre-origin kinds are
# centred; materials <kind>_<part>, 'glow' materials unlit; one Empty per kind.
#
#   momo     a steamed dumpling with a pleated twist on top                                walk hop stun flat ko
#   roti     a sel roti: a golden ring-doughnut standing on its edge, it rolls             walk curl roll stun flat ko
#   monal    a Himalayan monal pheasant: green head and crest, blue-violet body, copper tail  fly swoop stun ko  centre
#   marmot   a Himalayan marmot standing up, pebble in paw; it lobs pebbles               walk idle throw stun flat ko
#   chough   an alpine chough: slate-black, yellow beak, red legs                          fly swoop stun ko   centre
#   yeti     a big, friendly-silly snow creature in a striped scarf; it throws snowballs (2 hp)
#                                                                                         walk idle throw stun flat ko
#   snowball a snowball with eyes and a twig                                              walk curl roll stun flat ko
#   tinBot   the Baron's wind-up tin robot (souvenir goon) with a turning key             walk stun flat ko
#   bobble   the Baron's bobble-head toy of himself: top hat, monocle, curly moustache     walk hop stun flat ko
#   globe    a stolen snow globe on little feet, a gold tower inside                      walk curl roll stun flat ko
#   (level overhaul, not used by the game yet: yeti tell / breathe / pant for its frost breath, marmot sleep / tell /
#    whistle for the sleeper and alarm-caller behaviours; the frost cone and the Zzz are drawn by the engine)
#   pen      the friend (custom class NpPen): the shaggy yak in its little wooden pen (idle); once it is lent, the
#            empty pen with a heap of hay (wave)                                           idle wave
#   coin     the GOLDEN MOHAR: a round gold coin with a square inner field and dots       spin                centre
#   star     the GOLDEN RHODODENDRON: a gold cluster of bell flowers in a leaf rosette    idle (hover)        centre
#   qblock   the item block: a red-painted chest with a gold sunburst and brass corners   idle (frame 000)    centre
#   used     the same chest spent                                                          idle                centre
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
import jp_enemies as JE
from jp_enemies import STD_POSE as JP_POSE, walk_bob, face_frame, blush, flat_mouth

STD_POSE = dict(JP_POSE)
STD_POSE.update({
    'sleep':   dict(sx=1.06, sz=0.9, lean=10, lid=1.0, mouth='small', feet='stand'),
    'tell':    dict(sx=1.06, sz=1.02, lean=-6, lid=0.0, mouth='o', feet='stand', eye=1.15, pupil=0.8),
    'whistle': dict(sx=0.96, sz=1.08, lean=-8, lid=0.4, mouth='o', feet='stand'),
    'breathe': dict(sx=1.04, sz=1.0, lean=8, lid=0.55, mouth='open', feet='stand'),
    'pant':    dict(sx=1.02, sz=0.94, lean=-10, lid=0.45, mouth='grin', feet='stand'),
})

PX = 28.1
KINDS = ['momo', 'roti', 'monal', 'marmot', 'chough', 'yeti', 'snowball', 'tinBot', 'bobble', 'globe', 'pen',
         'coin', 'star', 'qblock', 'used']
POSES = {
    'momo': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'roti': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'monal': ['fly', 'swoop', 'stun', 'ko'],
    'marmot': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko', 'sleep', 'tell', 'whistle'],
    'chough': ['fly', 'swoop', 'stun', 'ko'],
    'yeti': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko', 'tell', 'breathe', 'pant'],
    'snowball': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'tinBot': ['walk', 'stun', 'flat', 'ko'],
    'bobble': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'globe': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'pen': ['idle', 'wave'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('marmot', 'idle'): (4, 5), ('marmot', 'throw'): (4, 6),
          ('yeti', 'idle'): (4, 5), ('yeti', 'throw'): (6, 8),
          ('yeti', 'pant'): (1, 1), ('marmot', 'sleep'): (1, 1), ('yeti', 'walk'): (6, 8), ('pen', 'idle'): (4, 4), ('pen', 'wave'): (1, 1)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'monal': 'centre', 'chough': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'momo': 22 / PX, 'roti': 22 / PX, 'marmot': 30 / PX, 'yeti': 54 / PX, 'snowball': 24 / PX, 'tinBot': 46 / PX,
          'bobble': 36 / PX, 'globe': 26 / PX, 'pen': 40 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'monal': 30 / PX, 'chough': 28 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX,
             'pen': 56 / PX})

COLORS = {
    'jp_tongue': '#ff7a8a',
    'momo_dough': '#fff2dc', 'momo_steamglow': '#ffffff', 'momo_dough2': '#ece2cc', 'momo_pleat': '#d8c8a8', 'momo_cheek': '#ffa8b4', 'momo_feet': '#e2d6bc',
    'momo_eye_white': '#fbfbf2', 'momo_pupil': '#1a1020', 'momo_mouth': '#6a1424',
    'roti_dough': '#d88a3a', 'roti_crust': '#b86a24', 'roti_shine': '#f0b866', 'roti_sugar': '#fff4e0', 'roti_feet': '#9a5a1e',
    'roti_eye_white': '#fbfbf2', 'roti_pupil': '#1a1020', 'roti_mouth': '#6a1424',
    'monal_head': '#2aa88a', 'monal_crest': '#3ac89a', 'monal_body': '#4a5ad8', 'monal_body2': '#7a3ac8', 'monal_wing': '#3a48b8',
    'monal_tail': '#d8701a', 'monal_tail2': '#b8501a', 'monal_beak': '#d8b030', 'monal_ring': '#5ad8ff', 'monal_feet': '#8a8a98',
    'monal_eye_white': '#fbfbf2', 'monal_pupil': '#1a1020', 'monal_mouth': '#2a2030',
    'marmot_fur': '#c8904e', 'marmot_fur2': '#a87038', 'marmot_belly': '#f0d8a8', 'marmot_face': '#7a5230', 'marmot_nose': '#2a1a14',
    'marmot_tooth': '#ffffff', 'marmot_pebble': '#8a8680', 'marmot_ear': '#8a5a34',
    'marmot_eye_white': '#fbfbf2', 'marmot_pupil': '#1a1020', 'marmot_mouth': '#5a1a1a',
    'chough_body': '#3a3e52', 'chough_body2': '#4e5470', 'chough_wing': '#2e3246', 'chough_tip': '#5e6684', 'chough_beak': '#ffd23a',
    'chough_feet': '#e83a3a', 'chough_eye_white': '#fbfbf2', 'chough_pupil': '#1a1020', 'chough_mouth': '#2a2030',
    'yeti_fur': '#f4f8ff', 'yeti_fur2': '#dce6f4', 'yeti_face': '#8ab0d8', 'yeti_face2': '#a8c8e8', 'yeti_hand': '#7aa0cc',
    'yeti_scarf': '#e8384f', 'yeti_scarf2': '#ffd23a', 'yeti_snow': '#ffffff', 'yeti_tooth': '#ffffff', 'yeti_horn': '#c8b898',
    'yeti_frost': '#2a6ad8', 'yeti_frostglow': '#d8f4ff', 'yeti_eye_white': '#fbfbf2', 'yeti_pupil': '#1a1020', 'yeti_mouth': '#3a2a5a',
    'snowball_snow': '#f4f8ff', 'snowball_shade': '#c8d8f0', 'snowball_twig': '#6a4a2a', 'snowball_pebble': '#7a7e8a',
    'snowball_eye_white': '#fbfbf2', 'snowball_pupil': '#1a1020', 'snowball_mouth': '#3a4a6a',
    'tinBot_tin': '#a8aebc', 'tinBot_tin2': '#8a909e', 'tinBot_band': '#ffd84a', 'tinBot_belt': '#7a2ac8', 'tinBot_eyeglow': '#ff4a4a',
    'tinBot_key': '#d8d8e0', 'tinBot_rivet': '#6a6e7a', 'tinBot_eye_white': '#fbfbf2', 'tinBot_pupil': '#1a1020', 'tinBot_mouth': '#3a3a48',
    'bobble_base': '#ffd84a', 'bobble_base2': '#c8a01a', 'bobble_coat': '#7a2ac8', 'bobble_coat2': '#5a1a9a', 'bobble_skin': '#f2c8a8',
    'bobble_hat': '#1e1424', 'bobble_band': '#ffd84a', 'bobble_monocle': '#ffd84a', 'bobble_glass': '#d8f0ff', 'bobble_tache': '#3a2a20',
    'bobble_spring': '#c8c8d0', 'bobble_cheek': '#ffa0a0', 'bobble_eye_white': '#fbfbf2', 'bobble_pupil': '#1a1020', 'bobble_mouth': '#5a1a1a',
    'globe_glass': '#cfeeff', 'globe_glass2': '#eaf8ff', 'globe_base': '#7a2ac8', 'globe_base2': '#ffd84a', 'globe_tower': '#e8b838',
    'globe_snow': '#ffffff', 'globe_feet': '#5a1a9a', 'globe_eye_white': '#fbfbf2', 'globe_pupil': '#1a1020', 'globe_mouth': '#3a1a4a',
    'pen_wood': '#8a6a42', 'pen_wood2': '#6a4a2a', 'pen_hay': '#d8b85a', 'pen_hay2': '#c8a040',
    'pen_coat': '#4a3428', 'pen_coat2': '#3a2820', 'pen_coat3': '#6a4a38', 'pen_muzzle': '#f2ece0', 'pen_horn': '#ece4cc',
    'pen_blanket': '#c8322a', 'pen_stripe': '#ffd23a', 'pen_stripe2': '#2a6ad8', 'pen_bell': '#ffd23a', 'pen_hoof': '#2a1e18',
    'pen_eye_white': '#fbfbf2', 'pen_pupil': '#1a1020', 'pen_mouth': '#2a1a14',
    'coin_gold': '#ffd24a', 'coin_gold2': '#e0a020', 'coin_shine': '#fff6c0',
    'star_gold': '#ffd24a', 'star_gold2': '#ffe890', 'star_core': '#e8a820', 'star_leaf': '#e8b030', 'star_glow': '#fff6c0',
    'qblock_paint': '#c8322a', 'qblock_paint2': '#a82418', 'qblock_gold': '#ffd23a', 'qblock_brass': '#d8a830', 'qblock_wood': '#7a4a2a',
    'used_paint': '#6a4434', 'used_paint2': '#5a3828', 'used_dull': '#8a7464', 'used_wood': '#4a3424',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


# ================================================================ MOMO (hopper)
MOMO = [(0.0, 0.0), (0.32, 0.02), (0.42, 0.1), (0.43, 0.2), (0.38, 0.3), (0.28, 0.38), (0.16, 0.44), (0.07, 0.48), (0.0, 0.5)]


def build_momo(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='momo_dough')
    bob, lean = walk_bob(pose, P, t)
    lift = 0.1 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift + 0.06)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('body', lathe(MOMO, seg=28), 'momo_dough', root, Mx)
    surf = lathe_surf(MOMO)
    # pleats: curved ridges sweeping up to a twisted knot on top
    for k in range(10):
        a0 = -3.1 + 0.33 * k
        path = []
        for j in range(7):
            u = j / 6
            z = 0.3 + 0.18 * u
            a = a0 + 1.1 * u
            p, n = surf(z, a)
            path.append(p + n * 0.012)
        ob = make_part('pleat%d' % k, tube(path, 0.014, seg=5), 'momo_pleat', root, Mx, subsurf=1)
        ob['outline'] = 0
    make_part('knot', tube([V(0, 0, 0.46), V(0.03, 0, 0.53), V(-0.01, 0, 0.58)], 0.045, 0.025, seg=8), 'momo_dough2', root, Mx)
    if pose in ('walk', 'hop'):
        for k, (x, z, r) in enumerate(((-0.08, 0.68, 0.05), (0.02, 0.78, 0.06), (-0.04, 0.9, 0.045))):
            ob = make_part('steam%d' % k, sphere(V(x + 0.03 * math.sin(TAU * t + k), -0.05, z), r, seg=10, rows=6), 'momo_steamglow', root, Mx)
            ob['outline'] = 0
    make_part('shine', oval_patch(surf, 0.24, 0.05, -2.2, 0.3), 'momo_dough', root, Mx)
    for side, az in (('r', -0.8), ('l', -1.5)):
        p, n = surf(0.21, az)
        eye_one('momo', side, p - n * 0.012, n, root, Mx, P)
    if not P.get('x') and pose != 'flat':
        for k, az in enumerate((-0.45, -1.85)):
            p, n = surf(0.12, az)
            make_part('cheek%d' % k, oval_patch(surf, 0.12, 0.022, az, 0.12, thick=0.016), 'momo_cheek', root, Mx)
    JE.open_mouth('momo', root, Mx, surf, P['mouth'], 0.1, math.radians(-55), math.radians(-100), scale=0.75)
    biped_legs('momo', root, T((0, 0, lift)), P, t, (0.0, 0.11, 0.08), (0.08, 0.055, 0.035), 0.03, 'momo_feet')


# ================================================================ ROTI (sel roti ring, roller)
def roti_ring(root, Mx, c, R, r, spin=0.0):
    make_part('ring', torus(c, R, r, axis=Y, seg=30, rseg=12), 'roti_dough', root, Mx)
    make_part('crust', torus(c + V(0, 0.012, 0), R, r * 0.96, axis=Y, seg=30, rseg=12), 'roti_crust', root, Mx @ about(c, diag(1.0, 1.0, 1.0)) @ T((0, 0.02, 0)))
    for k in range(10):
        a = TAU * k / 10 + 0.3 - spin
        p = c + V(R * math.cos(a), -r * 0.9, R * math.sin(a))
        ob = make_part('sugar%d' % k, sphere(p, 0.018, seg=6, rows=4), 'roti_sugar', root, Mx, subsurf=0)
        ob['outline'] = 0
    hl = [c + V((R + r * 0.35) * math.cos(a), -r * 0.82, (R + r * 0.35) * math.sin(a)) for a in [math.radians(100 + 8 * j) - spin for j in range(8)]]
    ob = make_part('shine', tube(hl, 0.02, seg=5), 'roti_shine', root, Mx, subsurf=1)
    ob['outline'] = 0


def build_roti(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='roti_dough')
    bob, lean = walk_bob(pose, P, t)
    R, r = 0.24, 0.09
    if pose in ('roll', 'curl'):
        # the ring spins about its own axis: only its sugar, shine and eyes show the turn
        c = V(0, 0, R + r)
        spin = TAU * t if pose == 'roll' else 0.3
        roti_ring(root, Matrix.Identity(4), c, R, r, spin=spin)
        for side, a in (('r', -0.45), ('l', -0.95)):
            a = a - spin
            p = c + V(R * math.cos(a), -r * 0.8, R * math.sin(a))
            eye_one('roti', side, p, Vector((0.2, -1, -0.1)), root, Matrix.Identity(4), P, er=0.06)
        return
    c = V(0, 0, R + r + 0.07)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    roti_ring(root, Mx, c, R, r)
    n = Vector((0.25, -1, 0.05)).normalized()
    for side, x in (('r', 0.1), ('l', -0.06)):
        eye_one('roti', side, c + V(x, -r * 0.85, -R + 0.03), n, root, Mx, P, er=0.06)
    flat_mouth('roti', root, Mx, P['mouth'], c + V(0.02, -r * 0.95, -R - 0.06), n, 0.08)
    biped_legs('roti', root, Mx, P, t, (0.0, 0.08, 0.08), (0.07, 0.05, 0.035), 0.028, 'roti_feet')


# ================================================================ birds (monal, chough): the crow body plan of jp_enemies
def bird(kind, root, pose, t, body, body2, wing, tip, head, beak, feet, crest=None, tail=None, tail2=None, er=0.075, scale=1.0):
    P = {'er': er, 'skin': body, 'lid': 0.15, 'look': Vector((0.55, -0.85, -0.1))}
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
    Mx = diag(scale, scale, scale) @ rot_y(tilt) @ (rot_x(roll) if roll else Matrix.Identity(4))
    bc = V(-0.05, 0, -0.04)
    sh = V(-0.02, 0, 0.04)
    make_part('wing_far', prism(JE.crow_wing(sh, flap)[::-1], Y * 0.04), wing, root, Mx @ T((0, 0.12, 0)), subsurf=1)
    if tail:
        tb = bc + V(-0.2, 0, 0.0)
        tl = [tb + V(0, 0, 0.06), tb + V(-0.34, 0, 0.1), tb + V(-0.4, 0, 0.0), tb + V(-0.34, 0, -0.1), tb + V(0, 0, -0.06)]
        make_part('tail', prism(tl, Y * 0.06), tail, root, Mx @ about(tb, rot_y(-4)), subsurf=1)
        make_part('tailband', prism([tb + V(-0.3, 0, 0.09), tb + V(-0.36, 0, 0.0), tb + V(-0.3, 0, -0.09), tb + V(-0.27, 0, 0.0)], Y * 0.07), tail2, root, Mx @ about(tb, rot_y(-4)), subsurf=1)
    else:
        tb = bc + V(-0.22, 0, 0.0)
        tl = [tb + V(0, 0, 0.05), tb + V(-0.26, 0, 0.12), tb + V(-0.31, 0, 0.04), tb + V(-0.3, 0, -0.06), tb + V(-0.26, 0, -0.12), tb + V(0, 0, -0.05)]
        make_part('tail', prism(tl, Y * 0.06), wing, root, Mx @ about(tb, rot_y(-6)), subsurf=1)
    make_part('body', blob(bc, 0.27, 0.15, 0.15, seg=22, rows=12), body, root, Mx)
    make_part('chest', ell_cap(bc, (0.27, 0.15, 0.15), (0.5, -0.6, -0.6), 50, seg=16, rows=5), body2, root, Mx)
    hc, hr = V(0.22, 0, 0.08), 0.14
    make_part('head', sphere(hc, hr, seg=20, rows=12), head, root, Mx)
    if crest:
        for k in range(3):
            base = hc + V(-0.02 + 0.03 * k, 0, 0.12)
            tipp = base + V(-0.12 + 0.05 * k, 0, 0.14)
            make_part('crest%d' % k, tube([base, tipp], 0.014, seg=5), crest, root, Mx, subsurf=0)
            make_part('crestb%d' % k, sphere(tipp, 0.028, seg=8, rows=5), crest, root, Mx, subsurf=0)
    make_part('beak', cone(hc + V(0.1, 0, -0.01), hc + V(0.28, 0, -0.06), 0.05, flat=0.7, seg=10), beak, root, Mx)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    p, n = hsurf(hc.z + 0.04, -0.8)
    eye_one(kind, 'r', p - n * 0.01, n, root, Mx, P, er=er)
    p, n = hsurf(hc.z + 0.05, -1.6)
    eye_one(kind, 'l', p - n * 0.01, n, root, Mx, P, er=er * 0.87)
    make_part('wing_near', prism(JE.crow_wing(sh, flap)[::-1], Y * 0.04), wing, root, Mx @ T((0, -0.17, 0)), subsurf=1)
    cov = JE.crow_wing(sh, flap)
    cov = [sh + (p_ - sh) * 0.55 for p_ in cov[:4]] + [sh + (cov[-2] - sh) * 0.55]
    make_part('wing_hi', prism(cov[::-1], Y * 0.02), tip, root, Mx @ T((0, -0.2, 0)), subsurf=1)
    for k, sg in enumerate((-1, 1)):
        f = bc + V(0.02, sg * 0.05, -0.14)
        make_part('leg%d' % k, tube([f, f + V(-0.04, 0, -0.09), f + V(0.02, 0, -0.13)], 0.018, 0.014, seg=5), feet, root, Mx, subsurf=1)
    return Mx, hc


def build_monal(root, pose, t):
    Mx, hc = bird('monal', root, pose, t, 'monal_body', 'monal_body2', 'monal_wing', 'monal_body2', 'monal_head', 'monal_beak', 'monal_feet',
                  crest='monal_crest', tail='monal_tail', tail2='monal_tail2', er=0.07, scale=1.0)
    ob = make_part('ring', torus(hc + V(0.06, -0.12, 0.04), 0.06, 0.012, axis=Vector((0.4, -1, 0.1)), seg=14, rseg=5), 'monal_ring', root, Mx, subsurf=0)
    ob['outline'] = 0


def build_chough(root, pose, t):
    bird('chough', root, pose, t, 'chough_body', 'chough_body2', 'chough_wing', 'chough_tip', 'chough_body', 'chough_beak', 'chough_feet', er=0.075, scale=0.92)


# ================================================================ MARMOT (thrower)
def build_marmot(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.065, skin='marmot_fur')
    bob, lean = 0.0, P['lean']
    if pose == 'walk':
        bob = 0.025 * abs(math.sin(TAU * t))
        lean = 4 * math.sin(TAU * t)
    elif pose == 'idle':
        bob = 0.012 * math.sin(TAU * t)
    Mx = T((0, 0, bob)) @ about((0, 0, 0), rot_y(lean)) @ diag(P['sx'], P['sx'], P['sz'])
    bc = V(0, 0, 0.34)
    make_part('body', blob(bc, 0.24, 0.22, 0.3, seg=24, rows=14), 'marmot_fur', root, Mx)
    bsurf = ellipsoid_surf(bc, 0.24, 0.22, 0.3)
    make_part('belly', oval_patch(bsurf, bc.z - 0.02, 0.2, -1.2, 0.6), 'marmot_belly', root, Mx)
    hc = V(0.05, 0, 0.74) if pose != 'sleep' else V(0.1, 0, 0.62)
    make_part('head', blob(hc, 0.17, 0.16, 0.15, seg=22, rows=12), 'marmot_fur', root, Mx)
    hsurf = ellipsoid_surf(hc, 0.17, 0.16, 0.15)
    make_part('cap', ell_cap(hc, (0.17, 0.16, 0.15), (-0.2, -0.1, 1), 55, seg=18, rows=5), 'marmot_fur2', root, Mx)
    mc = hc + V(0.13, -0.04, -0.04)
    make_part('muzzle', blob(mc, 0.08, 0.08, 0.06, seg=14, rows=8), 'marmot_belly', root, Mx)
    make_part('nose', sphere(mc + V(0.07, -0.01, 0.03), 0.025, seg=8, rows=5), 'marmot_nose', root, Mx)
    make_part('teeth', box_bm((0.04, 0.02, 0.04)), 'marmot_tooth', root, Mx @ T(mc + V(0.06, -0.06, -0.05)), subsurf=0)
    for k, sg in enumerate((-1, 1)):
        make_part('ear%d' % k, ellipsoid(hc + V(-0.05, sg * 0.12, 0.11), X * 0.04, Y * 0.02, Z * 0.04, seg=8, rows=5), 'marmot_ear', root, Mx, subsurf=1)
    for side, az in (('r', -0.95), ('l', -1.6)):
        p, n = hsurf(hc.z + 0.04, az)
        eye_one('marmot', side, p - n * 0.01, n, root, Mx, P)
    if pose in ('throw', 'idle', 'walk'):
        pass
    # arms: the pebble in the near paw; thrown overhead and forward
    if pose == 'throw':
        ang = -150 + 170 * smooth01(min(1.0, t / 0.55)) if t < 0.55 else 20 - 60 * smooth01((t - 0.55) / 0.45)
    elif pose == 'idle':
        ang = 10 + 8 * math.sin(TAU * t)
    elif pose == 'walk':
        ang = 20 + 15 * math.sin(TAU * t)
    elif pose == 'stun':
        ang = -60
    elif pose == 'whistle':
        ang = -125
    elif pose == 'tell':
        ang = -20
    elif pose == 'sleep':
        ang = 60
    else:
        ang = 30
    sh = V(0.12, -0.16, 0.5)
    MA = Mx @ about(sh, rot_y(-ang))
    make_part('arm', tube([sh, sh + V(0.06, 0, -0.08), sh + V(0.12, 0, -0.14)], 0.045, 0.04, seg=8), 'marmot_fur', root, MA)
    make_part('paw', sphere(sh + V(0.14, 0, -0.16), 0.045, seg=10, rows=6), 'marmot_fur2', root, MA)
    if pose == 'whistle':
        for k in range(3):
            c0 = hc + V(0.3 + 0.08 * k, -0.1, 0.05 + 0.1 * k)
            ob = make_part('note%d' % k, tube([c0, c0 + V(0.05, 0, 0.04), c0 + V(0.1, 0, 0.0)], 0.012, seg=4), 'marmot_tooth', root, Mx, subsurf=0)
            ob['outline'] = 0.6
    if pose in ('throw', 'idle', 'walk') and not (pose == 'throw' and t >= 0.55):
        make_part('pebble', sphere(sh + V(0.17, -0.04, -0.14), 0.055, seg=10, rows=6), 'marmot_pebble', root, MA, subsurf=1)
    make_part('arm2', tube([V(0.1, 0.14, 0.5), V(0.18, 0.14, 0.38)], 0.04, seg=8), 'marmot_fur2', root, Mx)
    make_part('tail', tube([V(-0.2, 0.05, 0.12), V(-0.32, 0.05, 0.08), V(-0.38, 0.05, 0.16)], 0.05, 0.035, seg=8), 'marmot_fur2', root, Mx)
    biped_legs('marmot', root, Mx, P, t, (0.0, 0.11, 0.1), (0.09, 0.055, 0.04), 0.04, 'marmot_fur2')


# ================================================================ YETI (2 hp thrower)
def build_yeti(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.1, skin='yeti_face')
    if pose == 'throw':
        P['mouth'] = 'grin'
    bob, lean = 0.0, P['lean']
    if pose == 'walk':
        bob = 0.04 * abs(math.sin(TAU * t))
        lean = 4 * math.sin(TAU * t)
    elif pose == 'idle':
        bob = 0.02 * math.sin(TAU * t)
    Mx = T((0, 0, bob)) @ about((0, 0, 0), rot_y(lean)) @ diag(P['sx'], P['sx'], P['sz'])
    # a shaggy pear of a body
    bc = V(-0.04, 0, 0.72)
    make_part('body', blob(bc, 0.5, 0.42, 0.5, seg=28, rows=16), 'yeti_fur', root, Mx)
    bsurf = ellipsoid_surf(bc, 0.5, 0.42, 0.5)
    for k in range(11):
        a = -3.0 + 0.55 * k
        p, n = bsurf(bc.z - 0.36, a)
        make_part('tuft%d' % k, cone(p - n * 0.05, p + n * 0.05 - Z * 0.13, 0.08, seg=6), 'yeti_fur', root, Mx, subsurf=1)
    make_part('belly', oval_patch(bsurf, bc.z - 0.05, 0.22, -1.2, 0.5), 'yeti_fur2', root, Mx)
    # the head: round, a pale-blue face, little horns
    hc = V(0.08, 0, 1.36)
    HM = Mx @ about(V(0, 0, 1.1), rot_y(-4 if pose != 'stun' else 10))
    make_part('head', blob(hc, 0.38, 0.34, 0.33, seg=26, rows=14), 'yeti_fur', root, HM)
    hsurf = ellipsoid_surf(hc, 0.38, 0.34, 0.33)
    make_part('face', oval_patch(hsurf, hc.z - 0.02, 0.2, -1.2, 0.75, thick=0.03), 'yeti_face', root, HM)
    for k, sg in enumerate((-1, 1)):
        make_part('horn%d' % k, cone(hc + V(-0.05, sg * 0.2, 0.24), hc + V(-0.12, sg * 0.3, 0.42), 0.06, seg=8), 'yeti_horn', root, HM, subsurf=1)
    for k in range(3):
        make_part('fringe%d' % k, cone(hc + V(0.12 + 0.06 * k, -0.08 + 0.04 * k, 0.26), hc + V(0.26 + 0.05 * k, -0.12 + 0.04 * k, 0.16), 0.06, seg=6), 'yeti_fur', root, HM, subsurf=1)
    for side, az in (('r', -0.85), ('l', -1.5)):
        p, n = hsurf(hc.z + 0.05, az)
        eye_one('yeti', side, p + n * 0.025, n, root, HM, P)
    if pose in ('tell', 'breathe'):
        for k, az in enumerate((-0.6, -1.75)):
            make_part('bluecheek%d' % k, oval_patch(hsurf, hc.z - 0.07, 0.06, az, 0.22, thick=0.04), 'yeti_frost', root, HM)
    if pose == 'breathe':
        p, n = hsurf(hc.z - 0.12, -1.2)
        for k in range(3):
            ob = make_part('puff%d' % k, sphere(p + n * (0.12 + 0.14 * k) + V(0.1 * k, 0, 0.02 * k), 0.07 + 0.03 * k, seg=10, rows=6), 'yeti_frostglow', root, HM)
            ob['outline'] = 0.5
    if pose == 'pant':
        p, n = hsurf(hc.z - 0.18, -1.2)
        make_part('pant_tongue', ellipsoid(p + n * 0.05 - Z * 0.06, X * 0.05, Y * 0.03, Z * 0.08, seg=10, rows=6), 'jp_tongue', root, HM, subsurf=1)
    if P['mouth']:
        JE.open_mouth('yeti', root, HM, hsurf, P['mouth'], hc.z - 0.12, math.radians(-45), math.radians(-100), scale=1.2, tongue=True)
        if P['mouth'] == 'grin':
            for k, a in enumerate((-0.95, -1.3)):
                p, n = hsurf(hc.z - 0.13, a)
                make_part('fang%d' % k, cone(p + n * 0.035, p + n * 0.037 - Z * 0.05, 0.025, seg=6), 'yeti_tooth', root, HM, subsurf=0)
    # the striped scarf round the neck, an end flapping behind
    sc = V(0.02, 0, 1.06)
    make_part('scarf', torus(sc, 0.34, 0.1, axis=Vector((0.12, 0, 1)), seg=26, rseg=8), 'yeti_scarf', root, Mx)
    for k in range(5):
        a = -2.6 + 0.5 * k
        make_part('sstripe%d' % k, box_bm((0.06, 0.06, 0.2)), 'yeti_scarf2', root, Mx @ T(sc + V(0.42 * math.cos(a), 0.42 * math.sin(a), 0.0)) @ rot_z(math.degrees(a)), subsurf=0)
    flap = 0.06 * math.sin(TAU * t) if pose in ('walk', 'idle') else 0.0
    end = [sc + V(-0.32, -0.12, -0.02), sc + V(-0.52, -0.12, -0.08 + flap), sc + V(-0.68, -0.12, -0.16 + flap * 2)]
    make_part('scarf_end', tube(end, 0.09, 0.07, seg=8), 'yeti_scarf', root, Mx)
    make_part('scarf_stripe', box_bm((0.05, 0.16, 0.16)), 'yeti_scarf2', root, Mx @ T(end[1]), subsurf=0)
    # arms: thick and furry with blue hands; the throw lifts a snowball overhead and hurls it
    if pose == 'throw':
        ang = -40 - 120 * smooth01(min(1.0, t / 0.5)) if t < 0.5 else -160 + 220 * smooth01((t - 0.5) / 0.5)
    elif pose == 'walk':
        ang = 10 + 18 * math.sin(TAU * t)
    elif pose == 'idle':
        ang = 8 + 6 * math.sin(TAU * t)
    elif pose == 'stun':
        ang = -120
    elif pose in ('tell', 'breathe'):
        ang = -30
    elif pose == 'pant':
        ang = 25
    else:
        ang = 40
    for side, sg, a0 in (('far', 1, -ang * 0.5 + 12), ('near', -1, ang)):
        sh = V(0.08, sg * 0.42, 0.98)
        MA = Mx @ about(sh, rot_y(-a0))
        make_part('arm_' + side, tube([sh, sh + V(0.06, 0, -0.22), sh + V(0.1, 0, -0.42)], 0.14, 0.11, seg=10), 'yeti_fur', root, MA)
        make_part('hand_' + side, ellipsoid(sh + V(0.11, 0, -0.5), X * 0.11, Y * 0.1, Z * 0.1, seg=12, rows=8), 'yeti_hand', root, MA)
        if side == 'near' and pose == 'throw' and t < 0.6:
            make_part('snowball', sphere(sh + V(0.14, -0.08, -0.64), 0.15, seg=14, rows=8), 'yeti_snow', root, MA)
    # short legs, big feet
    for k, (sg, ph) in enumerate(((-1, 0.0), (1, math.pi))):
        dx = 0.12 * math.sin(TAU * t + ph) if pose == 'walk' else (0.2 * sg if pose == 'flat' else 0.0)
        dz = 0.06 * max(0.0, math.cos(TAU * t + ph)) if pose == 'walk' else 0.0
        LM = Matrix.Identity(4) if pose != 'flat' else diag(1, 1, 0.5)
        make_part('leg%d' % k, tube([V(0.0, sg * 0.22, 0.34), V(0.04 + dx * 0.6, sg * 0.22, 0.12 + dz)], 0.14, 0.12, seg=10), 'yeti_fur', root, LM)
        make_part('foot%d' % k, ellipsoid(V(0.1 + dx, sg * 0.22, 0.07 + dz), X * 0.22, Y * 0.13, Z * 0.08, seg=14, rows=8), 'yeti_hand', root, LM)


# ================================================================ SNOWBALL (roller)
def snowball_body(root, Mx, c, r):
    make_part('ball', sphere(c, r, seg=24, rows=14), 'snowball_snow', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('shade', oval_patch(surf, c.z - r * 0.5, 0.08, 0.2, 0.9), 'snowball_shade', root, Mx)
    for k, (z, a) in enumerate(((0.65, -2.4), (0.2, -2.8), (0.45, 0.4))):
        p, n = surf(c.z + r * (z - 0.4), a)
        make_part('pebble%d' % k, sphere(p + n * 0.005, 0.035, seg=8, rows=5), 'snowball_pebble', root, Mx, subsurf=0)
    top = c + Z * r
    make_part('twig', tube([top - Z * 0.03 + X * 0.03, top + V(0.06, 0, 0.1), top + V(0.02, 0, 0.17)], 0.018, 0.012, seg=6), 'snowball_twig', root, Mx, subsurf=0)
    make_part('twig2', tube([top + V(0.05, 0, 0.08), top + V(0.12, 0, 0.12)], 0.012, seg=5), 'snowball_twig', root, Mx, subsurf=0)
    return surf


def build_snowball(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='snowball_snow')
    bob, lean = walk_bob(pose, P, t)
    r = 0.36
    if pose in ('roll', 'curl'):
        c = V(0, 0, r)
        MR = about(c, rot_y(360 * t if pose == 'roll' else 20))
        surf = snowball_body(root, MR, c, r)
        for side, az in (('r', -0.8), ('l', -1.45)):
            p, n = surf(c.z + 0.04, az)
            eye_one('snowball', side, p - n * 0.012, n, root, MR, P)
        return
    c = V(0, 0, r + 0.04)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    surf = snowball_body(root, Mx, c, r)
    for side, az in (('r', -0.8), ('l', -1.45)):
        p, n = surf(c.z + 0.06, az)
        eye_one('snowball', side, p - n * 0.012, n, root, Mx, P)
    JE.open_mouth('snowball', root, Mx, surf, P['mouth'], c.z - 0.1, math.radians(-50), math.radians(-100), scale=0.9)
    biped_legs('snowball', root, Mx, P, t, (0.0, 0.1, 0.06), (0.08, 0.055, 0.035), 0.03, 'snowball_shade')


# ================================================================ TIN BOT (wind-up walker)
def build_tinBot(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.07, skin='tinBot_tin')
    bob, lean = walk_bob(pose, P, t, amp=0.03, sway=4)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('body', superellipsoid(V(0, 0, 0.6), 0.34, 0.26, 0.3, e=0.3, seg=22, rows=10), 'tinBot_tin', root, Mx)
    make_part('band', box_bm((0.7, 0.54, 0.08)), 'tinBot_band', root, Mx @ T((0, 0, 0.7)), subsurf=0)
    make_part('belt', box_bm((0.7, 0.54, 0.09)), 'tinBot_belt', root, Mx @ T((0, 0, 0.42)), subsurf=0)
    for k in range(3):
        make_part('rivet%d' % k, sphere(V(-0.18 + 0.18 * k, -0.27, 0.56), 0.025, seg=8, rows=4), 'tinBot_rivet', root, Mx, subsurf=0)
    hc = V(0.02, 0, 1.08)
    make_part('head', superellipsoid(hc, 0.24, 0.22, 0.2, e=0.35, seg=22, rows=10), 'tinBot_tin', root, Mx)
    make_part('neck', tube([V(0, 0, 0.88), V(0, 0, 0.92)], 0.08, seg=10), 'tinBot_tin2', root, Mx)
    make_part('visor', box_bm((0.36, 0.04, 0.12), bevel=0.02), 'tinBot_tin2', root, Mx @ T(hc + V(0.06, -0.22, 0.03)), subsurf=0)
    if not P.get('x'):
        for k, dx in enumerate((-0.04, 0.16)):
            make_part('eye%d' % k, sphere(hc + V(dx, -0.245, 0.03), 0.045, seg=10, rows=6), 'tinBot_eyeglow', root, Mx, subsurf=0)
    else:
        for k, dx in enumerate((-0.04, 0.16)):
            for j, d in enumerate((1, -1)):
                make_part('x%d%d' % (k, j), tube([hc + V(dx - 0.035, -0.25, 0.03 - 0.035 * d), hc + V(dx + 0.035, -0.25, 0.03 + 0.035 * d)], 0.012, seg=4), 'tinBot_pupil', root, Mx, subsurf=0)
    make_part('grille', box_bm((0.14, 0.03, 0.04)), 'tinBot_mouth', root, Mx @ T(hc + V(0.08, -0.22, -0.1)), subsurf=0)
    make_part('antenna', tube([hc + V(0, 0, 0.18), hc + V(0, 0, 0.32)], 0.015, seg=5), 'tinBot_key', root, Mx, subsurf=0)
    make_part('bulb', sphere(hc + V(0, 0, 0.34), 0.04, seg=8, rows=5), 'tinBot_eyeglow', root, Mx, subsurf=0)
    # the wind-up key in its back, turning
    kc = V(-0.36, 0, 0.62)
    KM = Mx @ about(kc, rot_x(360 * t))
    make_part('keyshaft', tube([kc + V(0.04, 0, 0), kc + V(-0.12, 0, 0)], 0.02, seg=6), 'tinBot_key', root, Mx, subsurf=0)
    for sg in (-1, 1):
        make_part('keylobe%d' % (sg > 0), ellipsoid(kc + V(-0.14, sg * 0.0, sg * 0.1), X * 0.02, Y * 0.04, Z * 0.08, seg=10, rows=6), 'tinBot_key', root, KM, subsurf=0)
    # stiff toy arms and legs
    sw = 18 * math.sin(TAU * t) if pose == 'walk' else (60 if pose == 'stun' else 0)
    for k, sg in enumerate((-1, 1)):
        sh = V(0.0, sg * 0.36, 0.78)
        MA = Mx @ about(sh, rot_y(sw * sg))
        make_part('arm%d' % k, tube([sh, sh + V(0.0, 0, -0.3)], 0.05, seg=8), 'tinBot_tin2', root, MA, subsurf=0)
        make_part('hand%d' % k, sphere(sh + V(0, 0, -0.33), 0.06, seg=8, rows=5), 'tinBot_band', root, MA, subsurf=0)
    for k, sg in enumerate((-1, 1)):
        dx = 0.08 * math.sin(TAU * t + (0 if sg < 0 else math.pi)) if pose == 'walk' else (0.15 * sg if pose == 'flat' else 0.0)
        make_part('leg%d' % k, tube([V(0.0, sg * 0.14, 0.32), V(dx, sg * 0.14, 0.08)], 0.06, seg=8), 'tinBot_tin2', root, Mx, subsurf=0)
        make_part('boot%d' % k, box_bm((0.2, 0.14, 0.08), bevel=0.02), 'tinBot_belt', root, T((dx + 0.03, sg * 0.14, 0.04)), subsurf=0)


# ================================================================ BOBBLE (the Baron's bobble-head, hopper)
def build_bobble(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='bobble_skin')
    bob, lean = walk_bob(pose, P, t)
    lift = 0.1 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    make_part('base', lathe([(0.0, 0.0), (0.3, 0.0), (0.32, 0.05), (0.3, 0.12), (0.0, 0.12)], seg=24), 'bobble_base', root, Mx)
    make_part('baseband', torus(V(0, 0, 0.06), 0.315, 0.02, seg=24, rseg=5), 'bobble_base2', root, Mx, subsurf=0)
    make_part('coat', lathe([(0.2, 0.12), (0.2, 0.3), (0.16, 0.46), (0.08, 0.52), (0.0, 0.53)], seg=20), 'bobble_coat', root, Mx)
    make_part('lapel', prism([V(0.12, -0.17, 0.46), V(0.18, -0.17, 0.3), V(0.08, -0.17, 0.4)], Y * 0.02), 'bobble_coat2', root, Mx, subsurf=0)
    for k in range(2):
        make_part('button%d' % k, sphere(V(0.18, -0.12, 0.22 + 0.1 * k), 0.02, seg=6, rows=4), 'bobble_base', root, Mx, subsurf=0)
    # the spring and the big wobbly head
    wob = 14 * math.sin(TAU * t * 2) if pose in ('walk', 'hop') else (25 if pose == 'stun' else 0)
    make_part('spring', tube([V(0, 0, 0.5 + 0.02 * j) + V(0.03 * math.cos(j * 2.2), 0.03 * math.sin(j * 2.2), 0) for j in range(7)], 0.012, seg=5), 'bobble_spring', root, Mx, subsurf=0)
    hc = V(0.02, 0, 0.82)
    HM = Mx @ about(V(0, 0, 0.6), rot_y(wob))
    make_part('head', blob(hc, 0.24, 0.22, 0.22, seg=24, rows=14), 'bobble_skin', root, HM)
    hsurf = ellipsoid_surf(hc, 0.24, 0.22, 0.22)
    for side, az in (('r', -0.85), ('l', -1.45)):
        p, n = hsurf(hc.z + 0.04, az)
        eye_one('bobble', side, p - n * 0.01, n, root, HM, P)
    if not P.get('x'):
        p, n = hsurf(hc.z + 0.04, -0.85)
        make_part('monocle', torus(p + n * 0.02, 0.085, 0.014, axis=n, seg=16, rseg=5), 'bobble_monocle', root, HM, subsurf=0)
        make_part('mchain', tube([p + n * 0.02 + V(0.0, 0, -0.085), p + V(0.04, -0.04, -0.25)], 0.007, seg=4), 'bobble_monocle', root, HM, subsurf=0)
    # a curly moustache under the nose
    p, n = hsurf(hc.z - 0.07, -1.15)
    make_part('nose', sphere(p + n * 0.01, 0.045, seg=10, rows=6), 'bobble_skin', root, HM)
    for k, sg in enumerate((-1, 1)):
        _, up, rt = face_frame(n)
        path = [p + n * 0.03 - up * 0.04, p + n * 0.03 - up * 0.05 + rt * sg * 0.08, p + n * 0.025 - up * 0.02 + rt * sg * 0.14]
        make_part('tache%d' % k, tube(path, 0.022, 0.012, seg=6), 'bobble_tache', root, HM, subsurf=1)
    JE.open_mouth('bobble', root, HM, hsurf, 'o' if pose in ('stun', 'ko', 'hop') else None, hc.z - 0.14, -1.0, -1.3, scale=0.6)
    for k, az in enumerate((-0.6, -1.7)):
        if not P.get('x'):
            make_part('cheek%d' % k, oval_patch(hsurf, hc.z - 0.05, 0.025, az, 0.12, thick=0.016), 'bobble_cheek', root, HM)
    # top hat
    make_part('brim', lathe([(0.0, 0.0), (0.26, 0.0), (0.26, 0.03), (0.0, 0.03)], seg=24), 'bobble_hat', root, HM @ T(hc + V(-0.02, 0, 0.17)))
    make_part('crown', lathe([(0.0, 0.0), (0.16, 0.0), (0.17, 0.26), (0.0, 0.26)], seg=20), 'bobble_hat', root, HM @ T(hc + V(-0.02, 0, 0.19)))
    make_part('hband', torus(hc + V(-0.02, 0, 0.24), 0.163, 0.022, seg=20, rseg=5), 'bobble_band', root, HM, subsurf=0)


# ================================================================ GLOBE (snow globe roller)
def globe_body(root, Mx, c, r, t):
    make_part('glass', sphere(c, r, seg=24, rows=14), 'globe_glass', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('gleam', oval_patch(surf, c.z + r * 0.55, 0.05, -2.2, 0.3, thick=0.02), 'globe_glass2', root, Mx)
    # a little gold tower inside (drawn just in front so it reads through the glass)
    tc = c + V(0.0, -r * 0.55, -r * 0.35)
    make_part('tower', lathe([(0.0, 0.0), (0.08, 0.0), (0.06, 0.2), (0.03, 0.3), (0.0, 0.36)], seg=8), 'globe_tower', root, Mx @ T(tc), subsurf=0)
    for k in range(6):
        a = TAU * k / 6 + t * TAU * 0.5
        ob = make_part('flake%d' % k, sphere(c + V(0.16 * math.cos(a), -r * 0.6, 0.1 + 0.1 * math.sin(a * 1.7)), 0.018, seg=6, rows=4), 'globe_snow', root, Mx, subsurf=0)
        ob['outline'] = 0
    return surf


def build_globe(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.06, skin='globe_base')
    bob, lean = walk_bob(pose, P, t)
    r = 0.27
    if pose in ('roll', 'curl'):
        c = V(0, 0, 0.36)
        MR = about(c, rot_y(360 * t if pose == 'roll' else 20))
        globe_body(root, MR, c + V(0, 0, 0.06), r, t)
        make_part('base', lathe([(0.0, -0.36), (0.24, -0.36), (0.26, -0.24), (0.18, -0.18), (0.0, -0.18)], seg=20), 'globe_base', root, MR @ T(c))
        for side, x in (('r', 0.1), ('l', -0.06)):
            eye_one('globe', side, c + V(x, -0.24, -0.26), Vector((0.25, -1, 0)), root, MR, P, er=0.055)
        return
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    c = V(0, 0, 0.5)
    globe_body(root, Mx, c, r, t)
    bp = [(0.0, 0.08), (0.24, 0.08), (0.27, 0.16), (0.2, 0.26), (0.0, 0.26)]
    make_part('base', lathe(bp, seg=22), 'globe_base', root, Mx)
    make_part('baseband', torus(V(0, 0, 0.16), 0.265, 0.02, seg=22, rseg=5), 'globe_base2', root, Mx, subsurf=0)
    n = Vector((0.25, -1, 0)).normalized()
    for side, x in (('r', 0.11), ('l', -0.05)):
        eye_one('globe', side, V(x, -0.22, 0.18), n, root, Mx, P, er=0.055)
    flat_mouth('globe', root, Mx, P['mouth'] if P['mouth'] != 'grin' else 'smile', V(0.04, -0.245, 0.11), n, 0.08)
    biped_legs('globe', root, Mx, P, t, (0.0, 0.1, 0.08), (0.07, 0.05, 0.035), 0.028, 'globe_feet')


# ================================================================ PEN (friend: the yak in its pen)
def yak(root, Mx, t, chew):
    """The shaggy yak (matching the ridden one the game draws): dark coat, long fringe, a red woven blanket with
    yellow and blue stripes, cream horns and muzzle, a bell."""
    bc = V(0.0, 0, 0.62)
    make_part('yak_body', blob(bc, 0.62, 0.32, 0.34, seg=26, rows=14), 'pen_coat', root, Mx)
    # the fringe: a skirt of shaggy tufts
    for k in range(13):
        x = -0.6 + 0.1 * k
        sway = 0.02 * math.sin(TAU * t + k)
        make_part('fringe%d' % k, cone(V(x, -0.18, 0.5), V(x + sway, -0.22, 0.26), 0.07, flat=0.6, seg=6), 'pen_coat2', root, Mx, subsurf=1)
    make_part('hump', blob(bc + V(0.22, 0, 0.24), 0.26, 0.24, 0.16, seg=18, rows=10), 'pen_coat3', root, Mx)
    # legs and hooves
    for k, (x, y) in enumerate(((-0.42, -0.16), (-0.42, 0.16), (0.36, -0.16), (0.36, 0.16))):
        make_part('yleg%d' % k, tube([V(x, y, 0.4), V(x, y, 0.08)], 0.07, seg=8), 'pen_coat2', root, Mx, subsurf=1)
        make_part('hoof%d' % k, ellipsoid(V(x + 0.02, y, 0.05), X * 0.08, Y * 0.06, Z * 0.05, seg=8, rows=5), 'pen_hoof', root, Mx, subsurf=0)
    # blanket
    make_part('blanket', box_bm((0.46, 0.68, 0.06), bevel=0.02), 'pen_blanket', root, Mx @ T((-0.08, 0, 0.95)), subsurf=0)
    make_part('bl_drape', box_bm((0.46, 0.04, 0.26), bevel=0.01), 'pen_blanket', root, Mx @ T((-0.08, -0.33, 0.82)), subsurf=0)
    for k, (z, m) in enumerate(((0.86, 'pen_stripe'), (0.78, 'pen_stripe2'))):
        make_part('bl_stripe%d' % k, box_bm((0.46, 0.02, 0.04)), m, root, Mx @ T((-0.08, -0.36, z)), subsurf=0)
    # head with cream muzzle, horns and a bell; it chews
    hc = V(0.72, 0, 0.66)
    HM = Mx @ about(hc, rot_y(8 + 4 * math.sin(TAU * t)))
    make_part('yak_head', blob(hc, 0.2, 0.18, 0.2, seg=20, rows=12), 'pen_coat', root, HM)
    mc = hc + V(0.14, 0, -0.08 - 0.01 * chew)
    make_part('muzzle', blob(mc, 0.1, 0.12, 0.09, seg=14, rows=8), 'pen_muzzle', root, HM)
    for k, sg in enumerate((-1, 1)):
        make_part('nostril%d' % k, sphere(mc + V(0.09, sg * 0.04, 0.0), 0.016, seg=6, rows=4), 'pen_mouth', root, HM, subsurf=0)
        make_part('horn%d' % k, tube([hc + V(-0.04, sg * 0.14, 0.12), hc + V(-0.06, sg * 0.26, 0.24), hc + V(0.02, sg * 0.24, 0.36)], 0.04, 0.018, seg=8), 'pen_horn', root, HM)
        make_part('ear%d' % k, ellipsoid(hc + V(-0.08, sg * 0.2, 0.04), X * 0.04, Y * 0.07, Z * 0.03, seg=8, rows=5), 'pen_coat2', root, HM, subsurf=1)
    make_part('forelock', cone(hc + V(0.0, 0, 0.12), hc + V(0.12, -0.04, 0.02), 0.09, flat=0.6, seg=8), 'pen_coat2', root, HM, subsurf=1)
    hsurf = ellipsoid_surf(hc, 0.2, 0.18, 0.2)
    P = {'er': 0.05, 'skin': 'pen_coat', 'lid': 0.35, 'look': Vector((0.6, -0.8, -0.1))}
    for side, az in (('r', -0.8), ('l', -1.4)):
        p, n = hsurf(hc.z + 0.06, az)
        eye_one('pen', side, p - n * 0.01, n, root, HM, P)
    make_part('bell', sphere(hc + V(-0.02, -0.06, -0.26), 0.05, seg=10, rows=6), 'pen_bell', root, Mx)
    make_part('tail', tube([V(-0.6, 0, 0.78), V(-0.74, 0, 0.66), V(-0.72, 0, 0.5 + 0.03 * math.sin(TAU * t))], 0.04, 0.06, seg=8), 'pen_coat2', root, Mx)


def build_pen(root, pose, t):
    Mx = Matrix.Identity(4)
    # the fence: four posts and two rails (in front of the yak, near side; the far side behind)
    for side, y in (('far', 0.4), ('near', -0.42)):
        for k, x in enumerate((-0.92, -0.32, 0.32, 0.92)):
            make_part('post_%s%d' % (side, k), box_bm((0.08, 0.08, 0.72), bevel=0.015), 'pen_wood', root, T((x, y, 0.36)), subsurf=0)
            make_part('cap_%s%d' % (side, k), box_bm((0.1, 0.1, 0.03)), 'pen_wood2', root, T((x, y, 0.73)), subsurf=0)
        for k, z in enumerate((0.3, 0.6)):
            make_part('rail_%s%d' % (side, k), box_bm((1.96, 0.05, 0.07), bevel=0.01), 'pen_wood', root, T((0.0, y - 0.05, z)), subsurf=0)
    make_part('straw', ellipsoid(V(0.0, 0, 0.02), X * 1.0, Y * 0.4, Z * 0.05, seg=16, rows=6), 'pen_hay2', root, Mx, subsurf=1)
    if pose == 'idle':
        chew = math.sin(TAU * t)
        yak(root, T((-0.06, 0, 0)) @ diag(0.92, 0.92, 0.92), t, chew)
    else:
        # the yak is out on the trail: a heap of hay and a little bucket
        for k, (x, r) in enumerate(((-0.2, 0.26), (0.08, 0.22), (-0.04, 0.18))):
            make_part('hay%d' % k, ellipsoid(V(x, 0.0, 0.1 + 0.08 * k), X * r, Y * 0.22, Z * r * 0.6, seg=14, rows=8), 'pen_hay' if k % 2 == 0 else 'pen_hay2', root, Mx)
        for k in range(5):
            ob = make_part('stalk%d' % k, tube([V(-0.3 + 0.12 * k, -0.2, 0.22), V(-0.36 + 0.14 * k, -0.24, 0.34)], 0.01, seg=4), 'pen_hay2', root, Mx, subsurf=0)
            ob['outline'] = 0
        make_part('bucket', lathe([(0.0, 0.0), (0.1, 0.0), (0.13, 0.18), (0.0, 0.18)], seg=12), 'pen_wood2', root, T((0.55, -0.05, 0.0)))


# ================================================================ COIN: the mohar
def build_coin(root, pose, t):
    Mx = rot_z(360 * t)
    make_part('disc', lathe([(0.0, -0.04), (0.24, -0.04), (0.26, 0.0), (0.24, 0.04), (0.0, 0.04)], seg=28), 'coin_gold', root, Mx @ rot_x(90))
    for sg in (-1, 1):
        make_part('rim%d' % (sg > 0), torus(V(0, sg * 0.04, 0), 0.215, 0.016, axis=Y, seg=28, rseg=5), 'coin_gold2', root, Mx, subsurf=0)
        make_part('square%d' % (sg > 0), box_bm((0.18, 0.012, 0.18)), 'coin_gold2', root, Mx @ T((0, sg * 0.046, 0)) @ rot_y(45), subsurf=0)
        make_part('inner%d' % (sg > 0), box_bm((0.1, 0.016, 0.1)), 'coin_gold', root, Mx @ T((0, sg * 0.05, 0)) @ rot_y(45), subsurf=0)
        for k in range(8):
            a = TAU * k / 8
            make_part('dot%d_%d' % (sg > 0, k), sphere(V(0.165 * math.cos(a), sg * 0.045, 0.165 * math.sin(a)), 0.018, seg=6, rows=4), 'coin_gold2', root, Mx, subsurf=0)
    make_part('shine', ellipsoid(V(-0.1, -0.06, 0.1), X * 0.03, Y * 0.01, Z * 0.05, seg=8, rows=4), 'coin_shine', root, Mx, subsurf=0)


# ================================================================ STAR: the golden rhododendron
def build_star(root, pose, t):
    Mx = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(6 * math.sin(TAU * t))
    for k in range(6):
        a = TAU * k / 6 + 0.3
        d = V(math.cos(a), 0, math.sin(a))
        s = V(-math.sin(a), 0, math.cos(a))
        leaf = [d * 0.12, d * 0.3 + s * 0.08, d * 0.44, d * 0.3 - s * 0.08]
        make_part('leaf%d' % k, prism(leaf, Y * 0.03), 'star_leaf', root, Mx @ T((0, 0.05, -0.04)), subsurf=1)
    for k, (x, z) in enumerate(((0.0, 0.12), (-0.15, 0.02), (0.15, 0.02), (-0.08, -0.12), (0.08, -0.12))):
        c = V(x, -0.02 - 0.02 * k, z)
        make_part('bell%d' % k, lathe([(0.0, 0.0), (0.05, 0.02), (0.09, 0.08), (0.12, 0.14), (0.11, 0.16)], seg=10), 'star_gold', root, Mx @ T(c) @ rot_x(90) @ T((0, 0, -0.08)))
        make_part('core%d' % k, sphere(c + V(0, -0.1, 0), 0.03, seg=8, rows=4), 'star_core', root, Mx, subsurf=0)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.44 * math.cos(a), -0.2, 0.26 * math.sin(a))
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, Mx, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the painted chest
def build_block(root, Mx, spent):
    H = 0.55
    k = 'used' if spent else 'qblock'
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.05, segments=2), k + '_paint', root, Mx, subsurf=0)
    for z in (-0.34, 0.34):
        make_part('slat%d' % (z > 0), box_bm((2 * H + 0.01, 2 * H + 0.01, 0.04)), k + '_paint2', root, Mx @ T((0, 0, z)), subsurf=0)
    corner = (k + '_dull') if spent else 'qblock_brass'
    for sx in (-1, 1):
        for sz in (-1, 1):
            for sy in (-1, 1):
                make_part('corner%d%d%d' % (sx > 0, sy > 0, sz > 0), box_bm((0.2, 0.2, 0.2), bevel=0.02), corner, root, Mx @ T((sx * (H - 0.08), sy * (H - 0.08), sz * (H - 0.08))), subsurf=0)
    if not spent:
        for fi, (nrm, tng) in enumerate((((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((0, 0, 1), (1, 0, 0)))):
            bn, bt = Vector(nrm), Vector(tng)
            bu = bn.cross(bt)
            c = bn * (H + 0.015)
            for j in range(8):
                a = TAU * j / 8 + TAU / 16
                d = bt * math.cos(a) + bu * math.sin(a)
                e = bt * -math.sin(a) + bu * math.cos(a)
                make_part('ray%d_%d' % (fi, j), prism([c + d * 0.14 - e * 0.05, c + d * 0.34, c + d * 0.14 + e * 0.05], bn * 0.03), 'qblock_gold', root, Mx, subsurf=0, smooth=False)
            make_part('sun%d' % fi, ellipsoid(c + bn * 0.01, bt * 0.12, bu * 0.12, bn * 0.03, seg=14, rows=5), 'qblock_gold', root, Mx, subsurf=0)


def build_qblock(root, pose, t):
    build_block(root, Matrix.Identity(4), False)


def build_used(root, pose, t):
    build_block(root, Matrix.Identity(4), True)


BUILDERS = {'momo': build_momo, 'roti': build_roti, 'monal': build_monal, 'marmot': build_marmot, 'chough': build_chough,
            'yeti': build_yeti, 'snowball': build_snowball, 'tinBot': build_tinBot, 'bobble': build_bobble, 'globe': build_globe,
            'pen': build_pen, 'coin': build_coin, 'star': build_star, 'qblock': build_qblock, 'used': build_used}


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
