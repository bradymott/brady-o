# id_enemies: the Indonesia (Bali) cast of Super Brady-O World (world 9) for the pre-rendered Fiesta Toon pipeline.
# All original cartoon designs (animals, food and objects; no people). Helpers: id_charkit.py (a copy of the
# Morocco character kit). Z up, every character FACES +X, the camera looks along +Y; 1 m = 28.1 px; feet-origin kinds
# stand on z = 0, centre-origin kinds are centred on the origin; materials '<kind>_<part>'.
#
#   flyfish    a flying fish: cobalt back, silver belly, big glassy wing fins, a long lower tail lobe
#                                                                       up(t) down(t) ko                  centre, 22 px
#   urchin     a grumpy purple sea urchin bristling with lilac-tipped spines   idle(t) walk(t) stun flat ko  feet, 18 px
#   duck       a Balinese runner duck, upright as a bottle; the leader carries a little flag on a bamboo stick
#              (custom class: 'lead' is the leader's walk, 'hop' the panic)  walk(t) lead(t) hop stun flat ko feet, 26 px
#   scarecrow  a rice-field scarecrow (an object): bamboo cross, coconut-shell head with painted eyes, a tin-pail hat,
#              a striped cloth, rattling tin cans; it shakes them to throw   idle(t) throw(t) walk(t) stun flat ko feet, 50 px
#   dragonfly  a scarlet dragonfly with teal eyes and four glassy wings  fly(t) swoop stun ko             centre, 30 px
#   sate       a satay skewer on legs: four glazed grilled chunks on a bamboo stick, a sharp tip (spiky)
#                                                                       walk(t) stun flat ko              feet, 44 px
#   civet      a palm civet (luwak) for the night climb: pale grey-tan, a black mask, a ringed tail, amber eyes
#                                                                       walk(t) notice charge stun flat ko feet, 16 px
#   bat        a fruit bat with a fox face and a ginger mantle (night: lighter values)  fly(t) swoop stun ko  centre, 30 px
#   lionfish   a lionfish with a striped body and feathery striped fans  swim(t) ko                       centre, 30 px
#   angler     an anglerfish (custom class): a round dusky body, a huge toothy underbite; the lure line and the fake
#              coin stay code-drawn from the stub on its brow             swim(t) lunge ko                 centre, 32 px
#   moray      a moray eel reaching out of its hole (custom class): 'out_000..005' are six reach steps with the hole
#              at the origin; 'ko' is the eel curled up, centred           out ko                           centre
#   monkey     a long-tailed macaque (custom class)                     perch(t) drop grab(t) climb(t) flat ko feet, 26 px
#   troop      a young macaque of Boss Kera's troop (minion)             run(t) carry(t) climb(t) flat ko  feet, 22 px
#   glowJelly  a glowing night jellyfish (custom class): swim / swimb / swimc in cyan, violet and green   centre, 22 px
#   jelly      a pastel surf jellyfish (custom class): swim / swimb / swimc in lilac, pink and sky, flat / flatb /
#              flatc squashed                                                                          centre, 22 px
#   gecko      the friendly tokay gecko (friend): idle holds out a surfboard, wave waves      idle(t) wave(t) feet, 30 px
#   coin       the GOLDEN FRANGIPANI: a chunky gold blossom             spin(t)                           centre, 17 px
#   star       the GOLDEN GECKO: a gold gecko with sparkles             idle(t)                           centre, 24 px
#   qblock     the item block: a bundle wrapped in brown kawung batik, knotted on top with a frangipani   centre, 32 px
#   used       the same bundle spent (faded, no flower)                                                    centre, 32 px
# Build: ATLAS_QUALITY=87 tools/blender/sprites/build_country.sh id <workdir> enemies   (keeps the 'id' atlas under 400 KB)
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import id_charkit as CK
from id_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, smooth01, lerp, ellipsoid, sphere, blob,
                        ell_cap, tube, cone, lathe, torus, prism, box_bm, superellipsoid, lathe_surf, ellipsoid_surf,
                        oval_patch, on_face, make_part, new_root, eye_one, brow, mouth_bm, biped_legs, quad_legs, gait)

PX = 28.1
KINDS = ['flyfish', 'urchin', 'duck', 'scarecrow', 'dragonfly', 'sate', 'civet', 'bat', 'lionfish', 'angler', 'moray',
         'monkey', 'troop', 'glowJelly', 'jelly', 'gecko', 'coin', 'star', 'qblock', 'used']
POSES = {
    'flyfish': ['up', 'down', 'ko'],
    'urchin': ['idle', 'stun', 'flat', 'ko'],          # 'walk' falls back to idle (it never moves)
    'duck': ['walk', 'lead', 'hop', 'stun', 'flat', 'ko'],
    'scarecrow': ['idle', 'throw', 'stun', 'flat', 'ko'],   # 'walk' falls back to idle
    'dragonfly': ['fly', 'swoop', 'stun', 'ko'],
    'sate': ['walk', 'stun', 'flat', 'ko'],
    'civet': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'bat': ['fly', 'swoop', 'stun', 'ko'],
    'lionfish': ['swim', 'ko'],
    'angler': ['swim', 'lunge', 'ko'],
    'moray': ['out', 'ko'],
    'monkey': ['perch', 'drop', 'grab', 'climb', 'flat', 'ko'],
    'troop': ['run', 'carry', 'climb', 'flat', 'ko'],
    'glowJelly': ['swim', 'swimb', 'swimc', 'ko'],
    'jelly': ['swim', 'swimb', 'swimc', 'flat', 'flatb', 'flatc'],
    'gecko': ['idle', 'wave'],
    'coin': ['spin'], 'star': ['idle'], 'qblock': ['idle'], 'used': ['idle'],
}
# fewer frames than the default cycles keep the country atlas inside its budget (small sprites read fine at 4-6)
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('moray', 'out'): (6, 1), ('coin', 'spin'): (6, 10)}
for _k, _ps in POSES.items():
    for _p in _ps:
        if _p in ('walk', 'lead', 'grab', 'run', 'carry'):
            FRAMES.setdefault((_k, _p), (6, 10))
        elif _p in ('idle', 'perch', 'wave', 'throw', 'climb', 'fly', 'swim', 'swimb', 'swimc', 'up', 'down'):
            FRAMES.setdefault((_k, _p), (4, 8 if _p in ('fly', 'swim', 'swimb', 'swimc', 'climb') else 6))
FRAMES[('flyfish', 'up')] = (3, 6)
FRAMES[('flyfish', 'down')] = (3, 6)
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({k: 'centre' for k in ('flyfish', 'dragonfly', 'bat', 'lionfish', 'angler', 'moray', 'glowJelly', 'jelly',
                                      'coin', 'star', 'qblock', 'used')})
HEIGHT = {'urchin': 18 / PX, 'duck': 26 / PX, 'scarecrow': 50 / PX, 'sate': 44 / PX, 'civet': 18 / PX,
          'monkey': 26 / PX, 'troop': 22 / PX, 'gecko': 30 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'flyfish': 24 / PX, 'dragonfly': 30 / PX, 'bat': 30 / PX, 'lionfish': 30 / PX, 'angler': 32 / PX,
             'moray': 3.5, 'glowJelly': 24 / PX, 'jelly': 24 / PX, 'coin': 17 / PX, 'star': 24 / PX, 'qblock': 32 / PX,
             'used': 32 / PX, 'civet': 30 / PX, 'scarecrow': 50 / PX, 'sate': 44 / PX})

COLORS = {
    'flyfish_back': '#2a6ad8', 'flyfish_back2': '#1e52b0', 'flyfish_belly': '#e4f0f8', 'flyfish_fin': '#a8dcff',
    'flyfish_rib': '#5aa0e0', 'flyfish_tail': '#2a5ac0', 'flyfish_eye_white': '#fbfbf2', 'flyfish_pupil': '#1a1020',
    'flyfish_mouth': '#1a2a5a',
    'urchin_body': '#6a3a9a', 'urchin_body2': '#542a80', 'urchin_spine': '#4a2470', 'urchin_tip': '#d8b0ff',
    'urchin_foot': '#ff9ac8', 'urchin_eye_white': '#fbfbf2', 'urchin_pupil': '#1a1020', 'urchin_mouth': '#2a0e3a',
    'duck_body': '#f6f2e6', 'duck_wing': '#dcc8a2', 'duck_wing2': '#c4a878', 'duck_bill': '#ffa02a', 'duck_bill2': '#e8801a',
    'duck_feet': '#ff9a2a', 'duck_stick': '#c8a060', 'duck_flag': '#fffaf0', 'duck_dot': '#ff5a8a',
    'duck_eye_white': '#fbfbf2', 'duck_pupil': '#1a1020', 'duck_mouth': '#8a4a1a',
    'scarecrow_pole': '#c8b46a', 'scarecrow_node': '#8a7a3a', 'scarecrow_head': '#a8784a', 'scarecrow_fibre': '#c8a070',
    'scarecrow_hat': '#e8c87a', 'scarecrow_hat2': '#9aa0b0', 'scarecrow_cloth': '#d8402a', 'scarecrow_stripe': '#ffd23a',
    'scarecrow_straw': '#f0d88a', 'scarecrow_can': '#d0d4e0', 'scarecrow_label': '#e8402a', 'scarecrow_string': '#5a4a3a',
    'scarecrow_mound': '#7a5232', 'scarecrow_grass': '#5ab83a', 'scarecrow_eye_white': '#fbfbf2',
    'scarecrow_pupil': '#1a1020', 'scarecrow_mouth': '#f4ecd8',
    'dragonfly_body': '#ff4a2e', 'dragonfly_body2': '#c8321e', 'dragonfly_band': '#ffb04a', 'dragonfly_wing': '#dcf4ff',
    'dragonfly_vein': '#7ab8d8', 'dragonfly_eye': '#2ad8a0', 'dragonfly_eye_white': '#fbfbf2', 'dragonfly_pupil': '#1a1020',
    'dragonfly_mouth': '#5a0e0e', 'dragonfly_leg': '#3a1a1a',
    'sate_stick': '#e8d098', 'sate_meat': '#c0602a', 'sate_meat2': '#a84e20', 'sate_char': '#4a200c', 'sate_glaze': '#e88a3a',
    'sate_sauce': '#c88a3a', 'sate_lime': '#8ad04a', 'sate_feet': '#a8743a', 'sate_eye_white': '#fbfbf2',
    'sate_pupil': '#1a1020', 'sate_mouth': '#3a1408',
    'civet_fur': '#b8ac9a', 'civet_fur2': '#9a8e7e', 'civet_dark': '#4a423c', 'civet_mask': '#2e2824', 'civet_white': '#f4eee2',
    'civet_nose': '#2a1e1e', 'civet_eye_white': '#ffe066', 'civet_pupil': '#1a1020', 'civet_mouth': '#3a1a1a',
    'bat_fur': '#b07848', 'bat_mantle': '#e8a050', 'bat_wing': '#8a6a62', 'bat_bone': '#4a3634', 'bat_ear': '#5a4038',
    'bat_nose': '#3a2420', 'bat_eye_white': '#fbfbf2', 'bat_pupil': '#1a1020', 'bat_mouth': '#3a1a1a', 'bat_fang': '#ffffff',
    'lionfish_body': '#e8603a', 'lionfish_stripe': '#fff0e0', 'lionfish_fin': '#ff9a6a', 'lionfish_spine': '#c8402a',
    'lionfish_eye_white': '#fbfbf2', 'lionfish_pupil': '#1a1020', 'lionfish_mouth': '#5a1a10',
    'angler_skin': '#5a5a86', 'angler_skin2': '#4a4a72', 'angler_belly': '#9a98bc', 'angler_spot': '#7a7aa8',
    'angler_tooth': '#fffaf0', 'angler_gum': '#c84a6a', 'angler_inside': '#2a1426', 'angler_stalk': '#8a88b0',
    'angler_eye_white': '#e8f8ff', 'angler_pupil': '#1a1020', 'angler_mouth': '#2a1426',
    'moray_skin': '#8ab04a', 'moray_skin2': '#6a9036', 'moray_spot': '#3e5a1e', 'moray_belly': '#c8d878',
    'moray_inside': '#3a1420', 'moray_tooth': '#fffaf0', 'moray_eye_white': '#f4ffb0', 'moray_pupil': '#1a1020',
    'moray_mouth': '#3a1420',
    'monkey_fur': '#a89680', 'monkey_fur2': '#8a7a66', 'monkey_belly': '#d8ccb8', 'monkey_face': '#f0b8a8',
    'monkey_ear': '#e09a8a', 'monkey_eye_white': '#fbfbf2', 'monkey_pupil': '#1a1020', 'monkey_mouth': '#6a2a2a',
    'troop_fur': '#b8a690', 'troop_fur2': '#9a8a74', 'troop_belly': '#e4d8c4', 'troop_face': '#f4c4b4',
    'troop_ear': '#e8a898', 'troop_eye_white': '#fbfbf2', 'troop_pupil': '#1a1020', 'troop_mouth': '#6a2a2a',
    'glowJelly_bellglow': '#8af4ff', 'glowJelly_innerglow': '#e0ffff', 'glowJelly_tentglow': '#5ad8f0',
    'glowJelly_bellbglow': '#d0b0ff', 'glowJelly_innerbglow': '#f4ecff', 'glowJelly_tentbglow': '#a888f0',
    'glowJelly_bellcglow': '#a8ffa0', 'glowJelly_innercglow': '#f0fff0', 'glowJelly_tentcglow': '#70e070',
    'glowJelly_bellkoglow': '#9ab0c8', 'glowJelly_innerkoglow': '#d4e0ea', 'glowJelly_tentkoglow': '#7a90aa', 'glowJelly_eye_white': '#fbfbf2', 'glowJelly_pupil': '#1a1020', 'glowJelly_mouth': '#1a3a4a',
    'jelly_bell': '#c88aff', 'jelly_inner': '#ecd8ff', 'jelly_tent': '#b070f0',
    'jelly_bellb': '#ff8ad0', 'jelly_innerb': '#ffd8ef', 'jelly_tentb': '#f06ab0',
    'jelly_bellc': '#8ad0ff', 'jelly_innerc': '#d8f0ff', 'jelly_tentc': '#5ab0f0',
    'jelly_eye_white': '#fbfbf2', 'jelly_pupil': '#1a1020', 'jelly_mouth': '#5a1a4a',
    'gecko_skin': '#7a9ad0', 'gecko_skin2': '#6484bc', 'gecko_belly': '#c8d8f0', 'gecko_spot': '#ff8a3a', 'gecko_pad': '#a8bce0',
    'gecko_eye': '#ffd23a', 'gecko_slit': '#1a1020', 'gecko_mouth': '#2a3a6a', 'gecko_board': '#fffaf0', 'gecko_stripe': '#ff5a8a',
    'gecko_band': '#14b4ac', 'gecko_petal': '#ffffff', 'gecko_heart': '#ffc23a', 'gecko_eye_white': '#fbfbf2',
    'gecko_pupil': '#1a1020',
    'coin_gold': '#ffd24a', 'coin_gold2': '#e8a820', 'coin_heart': '#fff0a0', 'coin_rim': '#c88a1a',
    'star_gold': '#ffd24a', 'star_gold2': '#e8a820', 'star_spot': '#fff0a0', 'star_eye': '#7a3a0a', 'star_glow': '#fff6c0',
    'qblock_cloth': '#6a3418', 'qblock_cloth2': '#55280f', 'qblock_motif': '#f0d8a8', 'qblock_dot': '#d88a2a',
    'qblock_knot': '#8a4a1c', 'qblock_petal': '#fffaf0', 'qblock_heart': '#ffc23a', 'qblock_pink': '#ffd0e0',
    'used_cloth': '#8a7058', 'used_cloth2': '#76604a', 'used_motif': '#a8927a', 'used_dot': '#94806a', 'used_knot': '#7a644e',
}
CK.COLORS.update(COLORS)


def clear(kind=None):
    CK.clear(kind if kind else KINDS)


STD_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=3,   lid=0.12, mouth='grin',   feet='walk'),
    'idle': dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='stand'),
    'hop':  dict(sx=0.92, sz=1.12, lean=-4,  lid=0.00, mouth='open',   feet='tuck', eye=1.15, pupil=0.75),
    'notice': dict(sx=0.96, sz=1.06, lean=-6, lid=0.00, mouth='open', feet='stand', eye=1.2, pupil=0.7),
    'charge': dict(sx=1.06, sz=0.95, lean=10, lid=0.30, mouth='grin',  feet='walk', angry=True),
    'stun': dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-12, lid=0.00, mouth='o',      feet='limp', x=True),
}


def fin_fan(name, root, M, base, dirs, lens, mat, rib_mat=None, thick=0.02, rib_r=0.012):
    """A fan fin: triangles between successive ray tips from `base`, plus thin rays (rib_mat)."""
    tips = [base + d.normalized() * l for d, l in zip(dirs, lens)]
    for k in range(len(tips) - 1):
        a, b = tips[k], tips[k + 1]
        mid = (a + b) / 2
        notch = base + (mid - base) * 0.86
        make_part('%s_%d' % (name, k), prism([base, a, notch, b], Y * thick), mat, root, M, subsurf=0, smooth=False)
    if rib_mat:
        for k, tp in enumerate(tips):
            make_part('%s_rib%d' % (name, k), tube([base + V(0, -thick, 0), tp + V(0, -thick, 0)], rib_r, rib_r * 0.6, seg=5),
                      rib_mat, root, M, subsurf=0)
    return tips


# ================================================================ FLYFISH (leaper, centre)
def build_flyfish(root, pose, t):
    P = {'er': 0.075, 'skin': 'flyfish_back', 'lid': 0.1, 'look': Vector((0.75, -0.65, 0.0)), 'eye': 1.1}
    pitch, flap = 0.0, math.sin(TAU * t)
    if pose == 'up':
        pitch = -24
    elif pose == 'down':
        pitch = 22
        flap = 0.3 * flap - 0.4
    else:
        P['x'] = True
    Mx = rot_y(pitch) if pose != 'ko' else rot_x(180) @ rot_y(10)
    xs = [0.4, 0.32, 0.18, 0.0, -0.18, -0.3, -0.36]
    rs = [0.02, 0.09, 0.125, 0.13, 0.1, 0.06, 0.04]
    path = [V(x, 0, 0.0) for x in xs]
    bm = tube(path, 0.1, seg=16, radii=rs)
    bm.transform(diag(1, 0.85, 1))
    make_part('body', bm, 'flyfish_back', root, Mx)
    belly = [V(x, -0.012, -0.045) for x in xs[1:6]]
    bb = tube(belly, 0.1, seg=14, radii=[0.07, 0.1, 0.105, 0.08, 0.045])
    bb.transform(diag(1, 0.88, 0.8))
    make_part('belly', bb, 'flyfish_belly', root, Mx)
    make_part('stripe', tube([V(0.3, -0.1, 0.035), V(0.05, -0.115, 0.045), V(-0.25, -0.085, 0.03)], 0.016, seg=6), 'flyfish_back2', root, Mx, subsurf=1)
    # the big wing fins (pectorals) spread from behind the gills, flapping
    base = V(0.14, -0.02, 0.02)
    up = 0.22 * flap
    dirs = [V(-0.2, 0, 0.9 + up), V(-0.6, 0, 0.75 + up), V(-0.9, 0, 0.45 + up * 0.8), V(-1.0, 0, 0.12 + up * 0.5)]
    fin_fan('wing', root, Mx, base, dirs, (0.32, 0.46, 0.5, 0.42), 'flyfish_fin', 'flyfish_rib')
    # the far wing, lower and a bit behind, for depth
    fin_fan('wing2', root, Mx, base + V(-0.02, 0.06, -0.02), [V(-0.5, 0, 0.6 - up), V(-0.95, 0, 0.2 - up * 0.7)], (0.36, 0.38), 'flyfish_rib')
    # pelvic fins and the forked tail (the lower lobe is the long one)
    fin_fan('pelvic', root, Mx, V(-0.12, -0.02, -0.06), [V(-0.6, 0, -0.5), V(-0.95, 0, -0.2)], (0.18, 0.2), 'flyfish_fin')
    tr = V(-0.34, 0, 0.0)
    wag = 0.08 * math.sin(TAU * t * 2)
    make_part('tail_up', prism([tr + V(0.04, 0, 0.02), tr + V(-0.24, 0, 0.18 + wag), tr + V(-0.12, 0, 0.0)], Y * 0.03), 'flyfish_tail', root, Mx, subsurf=0, smooth=False)
    make_part('tail_dn', prism([tr + V(0.04, 0, -0.02), tr + V(-0.34, 0, -0.26 + wag), tr + V(-0.12, 0, 0.0)], Y * 0.03), 'flyfish_tail', root, Mx, subsurf=0, smooth=False)
    hs = ellipsoid_surf(V(0.22, 0, 0.0), 0.2, 0.11, 0.12)
    p, n = hs(0.035, -1.35)
    eye_one('flyfish', 'r', p - n * 0.01, n, root, Mx, P)
    make_part('mouth', tube([V(0.39, -0.03, -0.02), V(0.35, -0.07, -0.03)], 0.012, seg=6), 'flyfish_mouth', root, Mx, subsurf=1)


# ================================================================ URCHIN (still, feet)
URCHIN_POSE = dict(STD_POSE)


def build_urchin(root, pose, t):
    P = dict(URCHIN_POSE['stun' if pose == 'stun' else 'flat' if pose == 'flat' else 'ko' if pose == 'ko' else 'idle'])
    P.update(er=0.085, skin='urchin_body', mouth={'idle': 'frown', 'walk': 'frown'}.get(pose, P['mouth']))
    sx, sz, lean = P['sx'], P['sz'], P['lean']
    pulse = math.sin(TAU * t) if pose in ('idle', 'walk') else 0.0
    bob = 0.01 * abs(math.sin(TAU * t)) if pose == 'walk' else 0.0
    Mx = T((0, 0, bob)) @ rot_y(lean) @ about((0, 0, 0.0), diag(sx, sx, sz))
    c, r = V(0, 0, 0.27), 0.22
    make_part('body', blob(c, r, r * 0.92, r * 0.92, seg=24, rows=14), 'urchin_body', root, Mx)
    make_part('cap', ell_cap(c, (r, r * 0.92, r * 0.92), (0.1, 0.2, -1), 40, seg=16, rows=5), 'urchin_body2', root, Mx)
    # spines: a ring in the silhouette plane and a crown on the back, never across the face
    k = 0
    spine_len = 0.17 * (1 + 0.06 * pulse) if pose != 'flat' else 0.12
    for ring, (tilt, n) in enumerate(((0.0, 16), (0.45, 12))):
        for j in range(n):
            a = TAU * j / n + ring * 0.2
            if pose != 'flat' and ring == 0 and math.sin(a) < -0.85:
                continue                         # leave the underside clear for the tube feet
            d = V(math.cos(a), tilt, math.sin(a))
            if ring == 1 and d.z < -0.35:
                continue
            d.normalize()
            base = c + V(d.x * r * 0.9, d.y * r * 0.85, d.z * r * 0.9)
            sway = 0.04 * math.sin(TAU * t + j) if pose in ('idle', 'walk') else 0.0
            tip = base + (d + V(sway, 0, 0)).normalized() * spine_len * (0.8 + 0.25 * ((j * 7) % 3) / 2)
            make_part('spine%d' % k, cone(base, tip, 0.032, seg=8), 'urchin_spine', root, Mx, subsurf=0)
            make_part('tip%d' % k, sphere(tip, 0.016, seg=6, rows=4), 'urchin_tip', root, Mx, subsurf=0, smooth=False)
            k += 1
    surf = ellipsoid_surf(c, r, r * 0.92, r * 0.92)
    for side, az in (('r', -1.25), ('l', -1.9)):
        p, n = surf(c.z + 0.05, az)
        eye_one('urchin', side, p - n * 0.012, n, root, Mx, P)
        if not P.get('x') and pose in ('idle', 'walk'):
            brow('urchin', side, p - n * 0.012, n, root, Mx, P['er'], angry=0.9)
    if P['mouth']:
        make_part('mouth', mouth_bm(surf, P['mouth'], c.z - 0.09, -1.35, -1.85, scale=0.9), 'urchin_mouth', root, Mx)
    if pose != 'flat':
        for j in range(5):
            x = -0.14 + 0.07 * j
            make_part('foot%d' % j, sphere(V(x, -0.05, 0.05 + 0.006 * math.sin(TAU * t + j)), 0.03, seg=8, rows=5), 'urchin_foot', root, Mx, subsurf=1)


# ================================================================ DUCK (custom class: a Balinese runner duck, feet)
DUCK_POSE = dict(STD_POSE)
DUCK_POSE['lead'] = DUCK_POSE['walk']


def build_duck(root, pose, t):
    P = dict(DUCK_POSE[pose])
    P.update(er=0.07, skin='duck_body', mouth=None)
    if pose in ('walk', 'lead'):
        P['lid'] = 0.0
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    sway = 0.0
    if pose in ('walk', 'lead'):
        bob = 0.025 * abs(math.sin(TAU * t))
        sway = 5 * math.sin(TAU * t)
    lift = 0.14 if pose == 'hop' else 0.0
    Mx = T((0, 0, bob + lift)) @ rot_y(lean + sway) @ about((0, 0, 0.1), diag(sx, sx, sz))
    # the upright bottle body of a runner duck
    bc, br = V(-0.02, 0, 0.4), (0.17, 0.16, 0.26)
    MB = Mx @ about(bc, rot_y(28))
    make_part('body', blob(bc, *br, seg=24, rows=14), 'duck_body', root, MB)
    wing_up = 0.0 if pose != 'hop' else 1.0
    for side, sgn in (('n', -1), ('f', 1)):
        if side == 'f' and pose != 'hop':
            continue
        wc = bc + V(-0.07, sgn * 0.13, -0.03)
        wing = ellipsoid(wc, X * 0.1, Y * 0.035, Z * 0.15, seg=16, rows=10)
        Mw = MB @ about(wc + V(0.05, 0, 0.14), rot_y(-70 * wing_up) @ rot_x(sgn * 35 * wing_up))
        make_part('wing_' + side, wing, 'duck_wing', root, Mw)
        make_part('wingtip_' + side, ellipsoid(wc + V(-0.03, sgn * 0.02, -0.1), X * 0.06, Y * 0.03, Z * 0.07, seg=12, rows=6), 'duck_wing2', root, Mw, subsurf=1)
    make_part('tail', cone(bc + V(-0.08, 0, -0.22), bc + V(-0.2, 0, -0.32), 0.07, flat=0.6, seg=10), 'duck_body', root, MB)
    neck = [V(0.08, 0, 0.56), V(0.12, 0, 0.66), V(0.12, 0, 0.74)]
    make_part('neck', tube(neck, 0.085, 0.07, seg=12), 'duck_body', root, Mx)
    hc, hr = V(0.14, 0, 0.84), (0.15, 0.13, 0.135)
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'duck_body', root, Mx)
    open_ = 0.035 if pose in ('hop', 'stun') else 0.0
    make_part('bill', blob(V(0.33, 0, 0.81 + open_ * 0.5), 0.12, 0.06, 0.034, seg=14, rows=8), 'duck_bill', root, Mx)
    make_part('bill2', blob(V(0.31, 0, 0.78 - open_), 0.1, 0.05, 0.022, seg=12, rows=6), 'duck_bill2', root, Mx)
    hsurf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -0.95), ('l', -1.7)):
        p, n = hsurf(0.87, az)
        eye_one('duck', side, p - n * 0.01, n, root, Mx, P)
    if pose == 'lead':
        # a little bamboo flagstick tucked under the wing, waving
        s0, s1 = V(-0.1, 0.06, 0.42), V(-0.18, 0.06, 1.2)
        make_part('stick', tube([s0, s1], 0.018, seg=6), 'duck_stick', root, Mx, subsurf=0)
        fl = 0.04 * math.sin(TAU * t * 2)
        flag = [s1 + V(0, 0, -0.02), s1 + V(-0.32, 0, -0.04 + fl), s1 + V(-0.02, 0, -0.2)]
        make_part('flag', prism(flag, Y * 0.015), 'duck_flag', root, Mx, subsurf=0, smooth=False)
        make_part('dot', sphere(s1 + V(-0.11, -0.012, -0.08 + fl * 0.4), 0.032, seg=8, rows=5), 'duck_dot', root, Mx @ about(s1, diag(1, 0.4, 1)), subsurf=0)
    feet = P['feet']
    for side, y, ph in (('l', -0.06, math.pi / 2), ('r', 0.06, 3 * math.pi / 2)):
        hip = Mx @ V(0.0, y, 0.2)
        dx = dz = 0.0
        if feet == 'walk':
            dx, dz = gait(t, ph, 0.08, 0.05)
        elif feet == 'tuck':
            dx, dz = (0.04 if side == 'l' else -0.05), 0.1
        elif feet == 'flat':
            dx = 0.2 if side == 'l' else -0.16
        elif feet == 'limp':
            dx, dz = (0.1 if side == 'l' else -0.05), 0.02
        foot = V(0.02 + dx, y, 0.02 + dz + lift)
        make_part('leg_' + side, tube([hip, (hip + foot) / 2 + V(0.02, 0, 0), foot], 0.025, seg=8), 'duck_feet', root, None, subsurf=1)
        web = [foot + V(-0.03, 0, 0), foot + V(0.12, -0.04, -0.01), foot + V(0.13, 0.04, -0.01)]
        make_part('web_' + side, prism(web, Z * 0.025), 'duck_feet', root, None, subsurf=0, smooth=False)


# ================================================================ SCARECROW (thrower, feet; an object)
SCARE_POSE = {
    'idle':  dict(lid=0.10, mouth='grin',   tilt=0,   x=False),
    'walk':  dict(lid=0.10, mouth='grin',   tilt=0,   x=False),
    'throw': dict(lid=0.00, mouth='grin',   tilt=0,   x=False, eye=1.15),
    'stun':  dict(lid=0.50, mouth='wobble', tilt=-8,  x=False, dazed=True),
    'flat':  dict(lid=1.00, mouth='flat',   tilt=0,   x=False),
    'ko':    dict(lid=0.00, mouth='o',      tilt=-16, x=True),
}


def build_scarecrow(root, pose, t):
    P = dict(SCARE_POSE[pose])
    P.update(er=0.085, skin='scarecrow_head')
    shake, swing = 0.0, 0.0
    if pose in ('idle', 'walk'):
        shake = 2.5 * math.sin(TAU * t)
        swing = 10 * math.sin(TAU * t + 0.6)
    elif pose == 'throw':
        shake = 9 * math.sin(TAU * t * 3)
        swing = 38 * math.sin(TAU * t * 3 + 0.8)
    Mx = about((0, 0, 0.1), diag(1.25, 1.25, 0.35)) if pose == 'flat' else Matrix.Identity(4)
    MS = Mx @ about((0, 0, 0.12), rot_y(P['tilt'] + shake))
    # a mound of earth with rice tufts holds the pole
    make_part('mound', ellipsoid(V(0, 0, 0.0), X * 0.3, Y * 0.22, Z * 0.12, seg=18, rows=8, phi1=math.pi / 2), 'scarecrow_mound', root, Mx)
    for k, dx in enumerate((-0.2, -0.1, 0.12, 0.22)):
        for j in range(3):
            a = (j - 1) * 0.35
            make_part('tuft%d_%d' % (k, j), cone(V(dx, -0.12, 0.04), V(dx + math.sin(a) * 0.12, -0.14, 0.18 + 0.04 * (j == 1)), 0.02, seg=5), 'scarecrow_grass', root, Mx, subsurf=0)
    # the bamboo pole with its nodes, the cross bar
    make_part('pole', tube([V(0, 0, 0.0), V(0, 0, 1.36)], 0.035, seg=10), 'scarecrow_pole', root, MS)
    for z in (0.3, 0.62, 0.95):
        make_part('node%.0f' % (z * 100), torus((0, 0, z), 0.038, 0.012, seg=12, rseg=6), 'scarecrow_node', root, MS, subsurf=0)
    bar = 0.48
    make_part('bar', tube([V(-bar, -0.02, 1.13), V(bar, -0.02, 1.13)], 0.03, seg=10), 'scarecrow_pole', root, MS)
    for sx_ in (-1, 1):
        make_part('barnode%d' % sx_, torus((sx_ * 0.3, -0.02, 1.13), 0.033, 0.011, axis=X, seg=12, rseg=6), 'scarecrow_node', root, MS, subsurf=0)
    # the striped cloth hung over the bar (a wide sarong-like drape)
    cloth = [(-0.3, 1.16), (0.3, 1.16), (0.24, 0.6), (0.0, 0.55), (-0.24, 0.6)]
    make_part('cloth', prism([V(x, -0.06, z) for x, z in cloth], Y * 0.06), 'scarecrow_cloth', root, MS, subsurf=0, smooth=False)
    for k, z in enumerate((1.0, 0.86, 0.72)):
        w = 0.3 - (1.16 - z) * 0.1
        make_part('stripe%d' % k, prism([V(-w, -0.095, z + 0.03), V(w, -0.095, z + 0.03), V(w - 0.01, -0.095, z - 0.03), V(-w + 0.01, -0.095, z - 0.03)], Y * 0.012), 'scarecrow_stripe', root, MS, subsurf=0, smooth=False)
    # straw spilling from the sleeves (bar ends)
    for sx_ in (-1, 1):
        for j in range(4):
            a = -0.7 + j * 0.45
            tip = V(sx_ * (bar + 0.12 + 0.03 * j), -0.02, 1.13 + math.sin(a) * 0.12)
            make_part('straw%d_%d' % (sx_, j), cone(V(sx_ * (bar - 0.02), -0.02, 1.13), tip, 0.025, seg=5), 'scarecrow_straw', root, MS, subsurf=0)
    # two tin cans dangling from strings at the bar, swinging
    for sx_, ph in ((-1, 0.0), (1, 1.4)):
        hook = V(sx_ * 0.36, -0.06, 1.12)
        a = math.radians(swing * (1 if sx_ > 0 else -0.8))
        if pose == 'flat':
            a = 0
        L = 0.34
        can = hook + V(math.sin(a) * L, 0, -math.cos(a) * L)
        make_part('string%d' % sx_, tube([hook, can], 0.006, seg=4), 'scarecrow_string', root, MS, subsurf=0)['outline'] = 0.25
        MC = MS @ about(can, rot_y(-math.degrees(a)))
        make_part('can%d' % sx_, lathe([(0, -0.14), (0.065, -0.14), (0.07, -0.13), (0.07, -0.01), (0.065, 0.0), (0, 0.0)], seg=14), 'scarecrow_can', root, MC @ T(can), subsurf=0)
        make_part('label%d' % sx_, lathe([(0.072, -0.1), (0.072, -0.04)], seg=14), 'scarecrow_label', root, MC @ T(can), subsurf=0)
    # the coconut-shell head with painted eyes and a toothy painted grin, under a woven conical hat
    hc, hr = V(0.0, 0, 1.34), (0.2, 0.18, 0.18)
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'scarecrow_head', root, MS)
    for k in range(7):
        a = TAU * k / 7
        p0 = hc + V(math.cos(a) * 0.19, 0.05, math.sin(a) * 0.17)
        make_part('fibre%d' % k, tube([p0, p0 + V(math.cos(a) * 0.05, 0.02, math.sin(a) * 0.05 - 0.02)], 0.01, seg=4), 'scarecrow_fibre', root, MS, subsurf=0)
    hsurf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -1.15), ('l', -1.95)):
        p, n = hsurf(1.38, az)
        eye_one('scarecrow', side, p - n * 0.012, n, root, MS, P)
    if P['mouth']:
        make_part('mouth', mouth_bm(hsurf, 'smile' if P['mouth'] == 'grin' else P['mouth'], 1.27, -1.3, -1.85, scale=1.0), 'scarecrow_pupil', root, MS)
    # an upturned tin pail for a hat (it is a junk-built scarecrow), dented, with a wire handle
    MH = MS @ about(V(0, 0, 1.5), rot_y(-10 + shake * 0.6))
    make_part('pail', lathe([(0.0, 1.49), (0.17, 1.49), (0.175, 1.5), (0.13, 1.72), (0.0, 1.72)], seg=20), 'scarecrow_can', root, MH, subsurf=0)
    make_part('pail_rim', torus((0, 0, 1.5), 0.175, 0.018, seg=20, rseg=6), 'scarecrow_hat2', root, MH, subsurf=0)
    make_part('pail_band', lathe([(0.152, 1.58), (0.142, 1.62)], seg=20), 'scarecrow_label', root, MH, subsurf=0)
    make_part('handle', tube([V(-0.15, 0, 1.56), V(-0.12, -0.05, 1.42), V(0.0, -0.06, 1.36)], 0.008, seg=4), 'scarecrow_string', root, MH, subsurf=0)


# ================================================================ DRAGONFLY (flyer, centre)
def build_dragonfly(root, pose, t):
    """Seen from the side and a little from above (the whole insect tips its back toward the camera) so all four
    long glassy wings read: the far pair above the body, the near pair below."""
    P = {'er': 0.05, 'skin': 'dragonfly_eye', 'lid': 0.0, 'look': Vector((0.6, -0.8, -0.05)), 'pupil': 0.9}
    flap, pitch = math.sin(TAU * t), 0.0
    if pose == 'swoop':
        flap, pitch = -0.4, 22
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = 0.3, True, 0.45
    elif pose == 'ko':
        flap, P['x'] = 0.0, True
    view = rot_x(-62)                       # tip the back toward the camera
    Mx = rot_y(pitch) @ view if pose != 'ko' else rot_y(160) @ view
    # the abdomen: one smooth tapering tube, banded
    xs = [0.04, -0.1, -0.24, -0.38, -0.5, -0.6]
    path = [V(x, 0, 0.02 * (0.04 - x)) for x in xs]
    make_part('abdomen', tube(path, 0.045, 0.025, seg=12), 'dragonfly_body', root, Mx)
    for k, u in enumerate((0.25, 0.45, 0.65, 0.82)):
        q = path[0].lerp(path[-1], u)
        r = 0.045 - 0.02 * u + 0.006
        make_part('band%d' % k, torus(q, r, 0.012, axis=X, seg=12, rseg=5), 'dragonfly_band', root, Mx, subsurf=0)
    th_c = V(0.12, 0, 0.0)
    make_part('thorax', blob(th_c, 0.1, 0.075, 0.085, seg=18, rows=10), 'dragonfly_body2', root, Mx)
    hc = V(0.24, 0, 0.01)
    make_part('head', blob(hc, 0.06, 0.065, 0.06, seg=14, rows=8), 'dragonfly_body', root, Mx)
    # the big compound-eye domes, with one cartoon eye looking out of the near dome
    for side, dy in (('r', -0.055), ('l', 0.055)):
        ec = hc + V(0.035, dy, 0.03)
        make_part('dome_' + side, blob(ec, 0.07, 0.065, 0.07, seg=16, rows=10), 'dragonfly_eye', root, Mx)
    n = (V(0.55, -0.7, 0.45)).normalized()
    eye_one('dragonfly', 'r', hc + V(0.035, -0.055, 0.03) + n * 0.04, n, root, Mx, P, er=0.042)
    if pose != 'ko':
        make_part('mouth', tube([V(0.3, -0.04, -0.035), V(0.27, -0.06, -0.045)], 0.009, seg=5), 'dragonfly_mouth', root, Mx, subsurf=1)
    for k in range(3):
        a0 = th_c + V(0.05 - 0.045 * k, -0.03, -0.06)
        make_part('leg%d' % k, tube([a0, a0 + V(0.03, -0.02, -0.05), a0 + V(0.07, -0.02, -0.07)], 0.008, seg=5), 'dragonfly_leg', root, Mx, subsurf=0)
    # four long wings spread sideways (along +-Y), flapping about the body axis
    for k, (wx, ln, sweep, ph) in enumerate(((0.15, 0.44, 16, 0.0), (0.07, 0.42, -18, 0.7))):
        for side, sgn in (('n', -1), ('f', 1)):
            up = 22 * math.sin(TAU * t + ph) if pose == 'fly' else 22 * flap
            rp = V(wx, sgn * 0.03, 0.05)
            wc = rp + V(0, sgn * ln * 0.5, 0)
            wing = ellipsoid(wc, X * 0.085, Y * ln * 0.5, Z * 0.008, seg=16, rows=8)
            Mw = Mx @ about(rp, rot_x(sgn * -up) @ rot_z(sgn * sweep))
            make_part('wing%d_%s' % (k, side), wing, 'dragonfly_wing', root, Mw, subsurf=1)
            make_part('vein%d_%s' % (k, side), tube([rp + V(0.02, 0, 0.01), rp + V(0.025, sgn * ln * 0.92, 0.01)], 0.007, seg=4), 'dragonfly_vein', root, Mw, subsurf=0)
            make_part('spot%d_%s' % (k, side), ellipsoid(rp + V(0.03, sgn * ln * 0.86, 0.01), X * 0.02, Y * 0.03, Z * 0.006, seg=8, rows=4), 'dragonfly_body2', root, Mw, subsurf=0)


# ================================================================ SATE (spiky walker, feet; a satay skewer)
def build_sate(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.08, skin='sate_meat')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.03 * abs(math.sin(TAU * t))
        lean += 5 * math.sin(TAU * t)
    if pose == 'flat':
        sx, sz = 1.0, 1.0
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'flat':
        Mx = T((0, 0, 0.09)) @ rot_y(-90) @ T((-0.75, 0, 0)) @ diag(0.95, 1, 0.95)     # tipped over flat on the ground
    # the bamboo skewer, sharpened to a point at the top
    make_part('stick', tube([V(0, 0, 0.22), V(0, 0, 1.38)], 0.026, seg=8), 'sate_stick', root, Mx, subsurf=0)
    make_part('tip', cone(V(0, 0, 1.36), V(0, 0, 1.54), 0.028, seg=8), 'sate_stick', root, Mx, subsurf=0)
    # four chunky grilled pieces, each turned a little, char marks and a glaze shine
    chunks = [(0.36, 0.13, 0.1), (0.62, 0.14, 4), (0.88, 0.13, -6), (1.16, 0.16, 0)]
    for k, (z, r, rot) in enumerate(chunks):
        c = V(0.0, 0, z)
        Mc = Mx @ about(c, rot_z(rot * 3) @ rot_y(rot))
        e = 0.9 if k == 3 else 0.55
        make_part('meat%d' % k, superellipsoid(c, r, r * 0.92, 0.1 if k < 3 else 0.12, e=e, seg=20, rows=10), 'sate_meat' if k % 2 == 0 else 'sate_meat2', root, Mc)
        for j in range(2):
            zz = z - 0.03 + 0.06 * j
            make_part('char%d_%d' % (k, j), tube([c + V(-r * 0.75, -r * 0.92, zz - z + 0.02), c + V(r * 0.75, -r * 0.92, zz - z - 0.02)], 0.012, seg=5), 'sate_char', root, Mc, subsurf=0)
        make_part('glaze%d' % k, ellipsoid(c + V(-r * 0.4, -r * 0.88, 0.05), X * 0.04, Y * 0.01, Z * 0.02, seg=8, rows=5), 'sate_glaze', root, Mc, subsurf=0)
    # a drizzle of peanut sauce down the top chunk and a wedge of lime on the bottom one
    make_part('sauce', tube([V(-0.06, -0.12, 1.23), V(-0.04, -0.13, 1.14), V(-0.05, -0.13, 1.06)], 0.018, seg=6), 'sate_sauce', root, Mx, subsurf=1)
    make_part('sauce2', sphere(V(-0.05, -0.13, 1.05), 0.024, seg=8, rows=5), 'sate_sauce', root, Mx, subsurf=1)
    # the face on the top chunk
    c, r = V(0, 0, 1.16), 0.16
    surf = ellipsoid_surf(c, r, r * 0.92, 0.12)
    for side, az in (('r', -1.15), ('l', -1.95)):
        p, n = surf(1.19, az)
        eye_one('sate', side, p + n * 0.01, n, root, Mx, P)
    if P['mouth'] and pose != 'flat':
        make_part('mouth', mouth_bm(surf, P['mouth'], 1.11, -1.3, -1.85, scale=0.85), 'sate_mouth', root, Mx)
    if pose != 'flat':
        biped_legs('sate', root, T((0, 0, bob)), P, t, (0.0, 0.07, 0.24), (0.08, 0.05, 0.035), 0.028, 'sate_feet', A=0.09)


# ================================================================ CIVET (charger, feet; night: lighter values, amber eyes)
CIVET_POSE = dict(STD_POSE)
CIVET_POSE['notice'] = dict(sx=0.96, sz=1.04, lean=-6, lid=0.00, mouth='open', feet='stand', eye=1.25, pupil=0.6)
CIVET_POSE['charge'] = dict(sx=1.1, sz=0.9, lean=4, lid=0.35, mouth='grin', feet='charge', angry=True)


def build_civet(root, pose, t):
    P = dict(CIVET_POSE[pose])
    P.update(er=0.075, skin='civet_mask', pupil=0.8 * P.get('pupil', 1.0))
    if pose == 'walk':
        P['feet'] = 'walk'
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.01 * (1 + math.sin(2 * TAU * t))
    crouch = -0.04 if pose == 'notice' else 0.0
    Mx = T((0, 0, bob + crouch)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc, br = V(-0.06, 0, 0.3), (0.34, 0.13, 0.13)
    make_part('body', blob(bc, *br, seg=24, rows=12), 'civet_fur', root, Mx)
    make_part('belly', ell_cap(bc, br, (0.1, -0.3, -1), 45, seg=18, rows=5), 'civet_white', root, Mx)
    # rows of dark spots and a dark back stripe
    surf = ellipsoid_surf(bc, *br)
    make_part('stripe', ell_cap(bc, br, (0, 0, 1), 28, seg=20, rows=5), 'civet_fur2', root, Mx)
    for k in range(4):
        make_part('spot%d' % k, oval_patch(surf, bc.z + 0.03 + 0.03 * (k % 2), 0.035, -1.57 + 0.3 * (k - 1.5), 0.09, rows=4, cols=6), 'civet_fur2', root, Mx)
    hc, hr = V(0.3, 0, 0.38), (0.16, 0.14, 0.14)
    MH = Mx @ about(V(0.22, 0, 0.34), rot_y(12 if pose == 'charge' else -6 if pose == 'notice' else 0))
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'civet_fur', root, MH)
    make_part('snout', cone(V(0.4, 0, 0.35), V(0.57, 0, 0.32), 0.085, seg=12), 'civet_white', root, MH)
    make_part('nose', sphere(V(0.57, 0, 0.325), 0.032, seg=10, rows=6), 'civet_nose', root, MH)
    hsurf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -1.0), ('l', -1.7)):
        make_part('goggle_' + side, oval_patch(hsurf, 0.41, 0.06, az, 0.36, rows=5, cols=8), 'civet_mask', root, MH)
        make_part('brow_' + side, oval_patch(hsurf, 0.49, 0.022, az, 0.22, rows=4, cols=6), 'civet_white', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        ec = V(0.24, sgn * 0.09, 0.5 + (0.02 if pose == 'notice' else 0))
        make_part('ear_' + side, cone(ec + V(0, 0, -0.04), ec + V(-0.02, sgn * 0.01, 0.07), 0.045, flat=0.5, seg=10), 'civet_dark', root, MH)
    for side, az in (('r', -1.0), ('l', -1.7)):
        p, n = hsurf(0.415, az)
        eye_one('civet', side, p + n * 0.006, n, root, MH, P)
        if P.get('angry'):
            brow('civet', side, p - n * 0.01, n, root, MH, P['er'], angry=0.8)
    if P['mouth']:
        make_part('mouth', tube([V(0.52, -0.07, 0.28), V(0.45, -0.1, 0.27)], 0.012, seg=5), 'civet_mouth', root, MH, subsurf=1)
        if P['mouth'] == 'open':
            make_part('mouth_o', sphere(V(0.5, -0.08, 0.27), 0.028, seg=8, rows=5), 'civet_mouth', root, MH, subsurf=1)
    # the long ringed tail
    mode = pose
    tb = V(-0.38, 0, 0.32)
    if mode == 'walk':
        w = 0.05 * math.sin(TAU * t)
        tail = [tb, V(-0.56, 0, 0.3 + w), V(-0.74, 0, 0.26 + 2 * w), V(-0.88, 0, 0.3 + 3 * w)]
    elif mode == 'charge':
        tail = [tb, V(-0.58, 0, 0.36), V(-0.78, 0, 0.4), V(-0.96, 0, 0.42)]
    elif mode == 'notice':
        tail = [tb, V(-0.52, 0, 0.44), V(-0.6, 0, 0.6), V(-0.56, 0, 0.74)]
    elif mode in ('stun', 'ko'):
        tail = [tb, V(-0.54, 0, 0.22), V(-0.7, 0, 0.12), V(-0.84, 0, 0.1)]
    else:
        tail = [tb, V(-0.58, 0, 0.3), V(-0.78, 0, 0.3), V(-0.95, 0, 0.3)]
    n = 8
    pts = []
    for k in range(n + 1):
        u = k / n * (len(tail) - 1)
        i = min(len(tail) - 2, int(u))
        pts.append(tail[i].lerp(tail[i + 1], u - i))
    for k in range(n):
        r0 = 0.06 - 0.025 * k / n
        make_part('tail%d' % k, tube([pts[k], pts[k + 1]], r0, r0 * 0.94, seg=10), 'civet_dark' if k % 2 else 'civet_fur', root, Mx, subsurf=1)
    hips = {'fl': V(0.16, -0.08, 0.24), 'fr': V(0.16, 0.08, 0.24), 'bl': V(-0.28, -0.08, 0.24), 'br': V(-0.28, 0.08, 0.24)}
    quad_legs('civet', root, Mx, P, t, hips, 0.035, 0.032, (0.05, 0.04, 0.03), 'civet_dark', A=0.1, H=0.05)


# ================================================================ BAT (flyer, centre; a fruit bat)
def build_bat(root, pose, t):
    P = {'er': 0.062, 'skin': 'bat_fur', 'lid': 0.1, 'look': Vector((0.5, -0.85, -0.2))}
    flap, tilt, roll = 0.0, 0.0, 0.0
    if pose == 'fly':
        flap = math.sin(TAU * t)
    elif pose == 'swoop':
        flap, tilt = -0.6, 28
    elif pose == 'stun':
        flap, P['dazed'], P['lid'] = -0.9, True, 0.5
    else:
        flap, P['x'], roll = -0.7, True, 180
    Mx = rot_y(tilt) @ (rot_y(roll) if roll else Matrix.Identity(4))
    bc = V(0, 0, -0.04)
    make_part('body', blob(bc, 0.15, 0.13, 0.2, seg=20, rows=12), 'bat_fur', root, Mx)
    make_part('mantle', blob(V(0, 0, 0.1), 0.17, 0.15, 0.1, seg=18, rows=10), 'bat_mantle', root, Mx)
    hc, hr = V(0.06, 0, 0.21), 0.12
    make_part('head', sphere(hc, hr, seg=20, rows=12), 'bat_fur', root, Mx)
    # the fox snout
    make_part('snout', cone(hc + V(0.02, -0.06, -0.02), hc + V(0.1, -0.16, -0.06), 0.065, seg=12), 'bat_fur', root, Mx)
    make_part('nose', sphere(hc + V(0.1, -0.165, -0.055), 0.025, seg=10, rows=6), 'bat_nose', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        base = hc + V(sgn * 0.07, 0.01, 0.08)
        tip = hc + V(sgn * 0.11, 0.02, 0.2)
        make_part('ear_' + side, cone(base, tip, 0.045, flat=0.5, seg=10), 'bat_ear', root, Mx)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -1.15), ('l', -1.95)):
        p, n = hsurf(0.25, az)
        eye_one('bat', side, p - n * 0.01, n, root, Mx, P)
    if not P.get('x'):
        p, n = hsurf(0.15, -1.45)
        make_part('fang', cone(p + V(0.04, -0.06, -0.01), p + V(0.04, -0.07, -0.05), 0.014, seg=6), 'bat_fang', root, Mx, subsurf=0)
    make_part('mouth', mouth_bm(hsurf, 'smile' if pose != 'stun' else 'wobble', 0.15, -1.3, -1.75, scale=0.6), 'bat_mouth', root, Mx)
    for side, sgn in (('l', -1), ('r', 1)):
        shoulder = V(sgn * 0.11, 0.03, 0.06)
        up = 0.32 * flap
        fingers = [shoulder + V(sgn * 0.3, 0.05, 0.14 + up * 0.6), shoulder + V(sgn * 0.52, 0.06, 0.04 + up),
                   shoulder + V(sgn * 0.46, 0.06, -0.16 + up * 0.8), shoulder + V(sgn * 0.24, 0.05, -0.22 + up * 0.4)]
        for k in range(len(fingers) - 1):
            a, b = fingers[k], fingers[k + 1]
            notch = shoulder + ((a + b) / 2 - shoulder) * 0.78
            make_part('wing_%s%d' % (side, k), prism([shoulder, a, notch, b], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        make_part('wing_%s_end' % side, prism([shoulder, fingers[-1], shoulder + V(sgn * 0.06, 0, -0.2)], Y * 0.02), 'bat_wing', root, Mx, subsurf=0, smooth=False)
        for k, f in enumerate(fingers):
            make_part('bone_%s%d' % (side, k), tube([shoulder + V(0, -0.012, 0), f + V(0, -0.012, 0)], 0.014, 0.009, seg=6), 'bat_bone', root, Mx, subsurf=0)
        make_part('thumb_' + side, cone(fingers[0], fingers[0] + V(sgn * 0.02, -0.01, 0.05), 0.015, seg=6), 'bat_bone', root, Mx, subsurf=0)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('foot_' + side, tube([V(sgn * 0.05, 0, -0.22), V(sgn * 0.06, 0, -0.31)], 0.018, 0.013, seg=6), 'bat_bone', root, Mx, subsurf=0)


# ================================================================ LIONFISH (swimmer, centre)
def build_lionfish(root, pose, t):
    P = {'er': 0.06, 'skin': 'lionfish_body', 'lid': 0.15, 'look': Vector((0.7, -0.7, 0.0))}
    wave = math.sin(TAU * t)
    Mx = diag(1.5, 1.5, 1.5)
    if pose == 'ko':
        P['x'] = True
        Mx = rot_x(180) @ Mx
    bc, br = V(0.04, 0, 0.0), (0.24, 0.12, 0.15)
    make_part('body', blob(bc, *br, seg=24, rows=14), 'lionfish_body', root, Mx)
    surf = ellipsoid_surf(bc, *br)
    # bold cream bands around the body
    for k, x in enumerate((-0.14, -0.06, 0.02, 0.1, 0.18)):
        u = (x - bc.x) / br[0]
        k2 = math.sqrt(max(0.05, 1 - u * u))
        ring = [bc + V(x, -br[1] * k2 * 1.03 * math.sin(a), br[2] * k2 * 1.03 * math.cos(a)) for a in [math.pi * j / 10 for j in range(11)]]
        make_part('band%d' % k, tube(ring, 0.017, seg=6), 'lionfish_stripe', root, Mx, subsurf=0)
    # the crown of striped dorsal spines
    for k in range(7):
        x = 0.16 - k * 0.055
        a = math.radians(-20 - k * 9)
        top = V(x + 0.32 * math.sin(a) * 0.5, 0.02, 0.12 + 0.3 * math.cos(a) * (1 - 0.06 * k) + 0.02 * math.sin(TAU * t + k))
        make_part('spine%d' % k, tube([V(x, 0.02, 0.1), top], 0.013, 0.006, seg=5), 'lionfish_spine' if k % 2 else 'lionfish_stripe', root, Mx, subsurf=0)
    # the big feathery pectoral fans: alternating red and cream rays with webbing
    base = V(0.08, -0.12, -0.04)
    dirs = [V(-0.3, 0, -0.95 + 0.1 * wave), V(-0.62, 0, -0.78 + 0.1 * wave), V(-0.88, 0, -0.45 + 0.08 * wave), V(-1.0, 0, -0.1 + 0.06 * wave)]
    tips = fin_fan('pect', root, Mx, base, dirs, (0.3, 0.38, 0.4, 0.34), 'lionfish_fin')
    for k, tp in enumerate(tips):
        for j in range(3):
            q0, q1 = base.lerp(tp, j / 3), base.lerp(tp, (j + 1) / 3)
            make_part('ray%d_%d' % (k, j), tube([q0 + V(0, -0.02, 0), q1 + V(0, -0.02, 0)], 0.012, seg=5), 'lionfish_spine' if (j + k) % 2 else 'lionfish_stripe', root, Mx, subsurf=0)
    fin_fan('tailfin', root, Mx, V(-0.2, 0, 0.0), [V(-1, 0, 0.6 + 0.1 * wave), V(-1, 0, 0.0), V(-1, 0, -0.6 + 0.1 * wave)], (0.2, 0.18, 0.2), 'lionfish_fin', 'lionfish_stripe', rib_r=0.008)
    fin_fan('anal', root, Mx, V(-0.1, 0, -0.1), [V(-0.4, 0, -1), V(-0.9, 0, -0.5)], (0.16, 0.16), 'lionfish_fin')
    p, n = surf(0.05, -1.05)
    eye_one('lionfish', 'r', p - n * 0.01, n, root, Mx, P)
    if not P.get('x'):
        brow('lionfish', 'r', p - n * 0.01, n, root, Mx, P['er'], angry=0.6)
    make_part('mouth', mouth_bm(surf, 'frown' if pose == 'swim' else 'o', -0.035, -0.5, -0.95, scale=0.7), 'lionfish_mouth', root, Mx)
    # little tentacle 'eyebrow' feelers over the eye
    make_part('feeler', tube([V(0.2, -0.08, 0.1), V(0.24, -0.09, 0.2), V(0.2, -0.09, 0.25)], 0.01, seg=5), 'lionfish_stripe', root, Mx, subsurf=0)


# ================================================================ ANGLER (custom class, centre; the lure stays code-drawn)
def build_angler(root, pose, t):
    P = {'er': 0.07, 'skin': 'angler_skin', 'lid': 0.35, 'look': Vector((0.8, -0.6, 0.0)), 'pupil': 0.7}
    gape = 0.25 + 0.1 * math.sin(TAU * t) if pose == 'swim' else 1.0 if pose == 'lunge' else 0.6
    Mx = Matrix.Identity(4)
    if pose == 'lunge':
        P.update(lid=0.0, eye=1.2, pupil=0.55)
    if pose == 'ko':
        P['x'] = True
        Mx = rot_x(180)
    bc, br = V(-0.04, 0, 0.0), (0.36, 0.26, 0.3)
    make_part('body', blob(bc, *br, seg=26, rows=16), 'angler_skin', root, Mx)
    make_part('back', ell_cap(bc, br, (-0.3, 0.2, 1), 50, seg=20, rows=6), 'angler_skin2', root, Mx)
    surf = ellipsoid_surf(bc, *br)
    make_part('belly', oval_patch(surf, -0.17, 0.09, -1.45, 0.75, rows=6, cols=12), 'angler_belly', root, Mx)
    for k, (zc, ac) in enumerate(((0.1, -1.9), (0.0, -2.3), (0.16, -2.4), (-0.06, -2.0))):
        make_part('spot%d' % k, oval_patch(surf, zc, 0.03, ac, 0.07, rows=4, cols=6), 'angler_spot', root, Mx)
    # the big jaw: a dark mouth wedge at the front, an upturned lower jaw full of needle teeth
    jx = 0.28
    open_ = 0.06 + 0.16 * gape
    MJ = Mx @ about(V(0.05, 0, -0.06), rot_y(-14 * gape))
    make_part('inside', blob(V(jx - 0.02, -0.03, -0.04), 0.1, 0.18, open_ * 0.75 + 0.02, seg=16, rows=8), 'angler_inside', root, Mx)
    make_part('jaw', blob(V(jx - 0.04, 0, -0.14 - open_ * 0.4), 0.18, 0.22, 0.09, seg=18, rows=10), 'angler_skin', root, MJ)
    make_part('gum', tube([V(jx + 0.1, -0.12, -0.08 - open_ * 0.4), V(jx + 0.13, -0.02, -0.07 - open_ * 0.4)], 0.02, seg=6), 'angler_gum', root, MJ, subsurf=0)
    for k in range(5):
        x = jx + 0.12 - k * 0.055
        b = V(x, -0.14 + 0.012 * k, -0.07 - open_ * 0.4)
        make_part('ltooth%d' % k, cone(b, b + V(0.01, -0.005, 0.07 + 0.02 * (k % 2)), 0.016, seg=6), 'angler_tooth', root, MJ, subsurf=0)
    for k in range(4):
        x = jx + 0.08 - k * 0.06
        b = V(x, -0.16 + 0.015 * k, 0.03 + 0.03 * k * 0.2)
        make_part('utooth%d' % k, cone(b, b + V(0.0, -0.005, -0.06), 0.014, seg=6), 'angler_tooth', root, Mx, subsurf=0)
    # the lure stalk stub on the brow (the line to the glinting fake coin is code-drawn from its tip)
    stalk = [V(0.06, 0, 0.26), V(0.1, 0, 0.36), V(0.15, 0, 0.42)]
    make_part('stalk', tube(stalk, 0.022, 0.016, seg=8), 'angler_stalk', root, Mx, subsurf=1)
    # small fins: pectoral fan, dorsal frill, a tail
    w = 0.2 * math.sin(TAU * t)
    fin_fan('pect', root, Mx, V(-0.05, -0.24, -0.04), [V(-0.6, 0, 0.5 + w), V(-0.9, 0, 0.0 + w), V(-0.6, 0, -0.5 + w)], (0.13, 0.15, 0.13), 'angler_skin2')
    fin_fan('tail', root, Mx, V(-0.36, 0, 0.0), [V(-1, 0, 0.7 + w), V(-1, 0, 0.0), V(-1, 0, -0.7 + w)], (0.2, 0.15, 0.2), 'angler_skin2')
    fin_fan('dorsal', root, Mx, V(-0.18, 0, 0.24), [V(-0.4, 0, 1), V(-0.9, 0, 0.5)], (0.12, 0.12), 'angler_skin2')
    p, n = surf(0.12, -0.75)
    eye_one('angler', 'r', p - n * 0.01, n, root, Mx, P)
    if pose == 'lunge':
        brow('angler', 'r', p - n * 0.01, n, root, Mx, P['er'], angry=1.0)


# ================================================================ MORAY (custom class; the hole is the origin, the eel reaches +X)
def moray_eel(root, Mx, length, t, gape, P, pose):
    """An eel from inside the hole (x < 0) to its head at x = length; a wavy thick body with dark speckles."""
    n = max(4, int(length / 0.22) + 2)
    pts, radii = [], []
    for k in range(n + 1):
        u = k / n
        x = -0.25 + (length - 0.2 + 0.25) * u
        amp = 0.06 * math.sin(math.pi * u)
        pts.append(V(x, 0, amp * math.sin(TAU * (t + u * 1.2))))
        radii.append(0.15 - 0.02 * u)
    make_part('body', tube(pts, 0.15, seg=14, radii=radii), 'moray_skin', root, Mx)
    belly = [p + V(0, -0.04, -0.07) for p in pts[1:]]
    make_part('belly', tube(belly, 0.08, seg=10, radii=[0.07] * len(belly)), 'moray_belly', root, Mx)
    make_part('fin', tube([p + V(0, 0.0, 0.14) for p in pts[1:-1]] if len(pts) > 3 else [pts[0] + V(0, 0, 0.14), pts[-1] + V(0, 0, 0.14)], 0.035, seg=6), 'moray_skin2', root, Mx, subsurf=1)
    # speckles on the camera side
    for k in range(1, n):
        for j in range(2):
            q = pts[k].lerp(pts[min(n, k + 1)], 0.3 + 0.4 * j) + V(0, -radii[k] * 0.92, 0.05 * (1 if (k + j) % 2 else -1))
            make_part('spk%d_%d' % (k, j), ellipsoid(q, X * 0.035, Y * 0.01, Z * 0.025, seg=8, rows=4), 'moray_spot', root, Mx, subsurf=0)
    # the head: a long jaw, open when lunging
    hp = pts[-1] + V(0.12, 0, 0.0)
    hc, hr = hp + V(0.04, 0, 0.03), (0.22, 0.14, 0.15)
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'moray_skin', root, Mx)
    MJ = Mx @ about(hc + V(-0.12, 0, -0.06), rot_y(-22 * gape))
    make_part('jaw', blob(hc + V(0.06, 0, -0.1), 0.18, 0.11, 0.06, seg=16, rows=8), 'moray_skin2', root, MJ)
    if gape > 0.1:
        make_part('inside', blob(hc + V(0.1, -0.02, -0.06), 0.12, 0.1, 0.04 + 0.05 * gape, seg=14, rows=8), 'moray_inside', root, Mx)
        for k in range(3):
            b = hc + V(0.18 - 0.07 * k, -0.11, -0.04)
            make_part('tooth%d' % k, cone(b, b + V(0, -0.005, -0.05), 0.014, seg=6), 'moray_tooth', root, Mx, subsurf=0)
    hs = ellipsoid_surf(hc, *hr)
    p, n_ = hs(hc.z + 0.07, -1.0)
    eye_one('moray', 'r', p - n_ * 0.01, n_, root, Mx, P)
    if not P.get('x'):
        brow('moray', 'r', p - n_ * 0.01, n_, root, Mx, P['er'], angry=1.0)


def build_moray(root, pose, t):
    P = {'er': 0.06, 'skin': 'moray_skin', 'lid': 0.3, 'look': Vector((0.8, -0.6, 0.0))}
    if pose == 'out':
        out = (round(t * 6) + 1) / 6.0                      # frames 000..005: out = 1/6 .. 1
        length = (8 + out * 2.6 * 32) / PX
        moray_eel(root, Matrix.Identity(4), length, 0.0, min(1.0, out * 1.3), P, pose)
        return
    P['x'] = True
    # ko: a short curled eel, centred on the origin, upside down
    Mx = rot_x(180) @ T((-0.6, 0, 0))
    moray_eel(root, Mx, 1.0, 0.25, 0.3, P, pose)


# ================================================================ MACAQUES: MONKEY (custom class) and TROOP (minion)
MONKEY_POSE = {
    'perch': dict(lid=0.15, mouth='grin',   body='sit'),
    'drop':  dict(lid=0.0,  mouth='o',      body='drop', eye=1.2, pupil=0.7),
    'grab':  dict(lid=0.0,  mouth='grin',   body='run'),
    'run':   dict(lid=0.1,  mouth='grin',   body='run'),
    'carry': dict(lid=0.1,  mouth='grin',   body='carry'),
    'climb': dict(lid=0.1,  mouth='smile',  body='climb'),
    'flat':  dict(lid=1.0,  mouth='flat',   body='flat'),
    'ko':    dict(lid=0.0,  mouth='o',      body='ko', x=True),
}


def build_macaque(root, kind, pose, t, s):
    P = dict(MONKEY_POSE[pose])
    P.update(er=0.066, skin=kind + '_fur')
    body = P['body']
    fur, fur2, belly, face, ear = (kind + x for x in ('_fur', '_fur2', '_belly', '_face', '_ear'))
    ph = TAU * t
    lean, bob = 0.0, 0.0
    if body == 'sit':
        bob = 0.01 * math.sin(ph)
    elif body in ('run', 'carry'):
        bob = 0.03 * abs(math.sin(ph))
        lean = 18 if body == 'run' else 0
    elif body == 'climb':
        bob = 0.03 * math.sin(ph)
    elif body == 'drop':
        lean = -8
    base = diag(s, s, s)
    if body == 'flat':
        base = diag(s * 1.3, s * 1.3, s * 0.38)
    Mx = base @ T((0, 0, bob)) @ about((0, 0, 0.3), rot_y(lean))
    if body == 'ko':
        Mx = base @ about((0, 0, 0.4), rot_y(-14))
    sit = body == 'sit'
    bc, br = (V(-0.04, 0, 0.36), (0.19, 0.16, 0.22)) if sit else (V(-0.04, 0, 0.42), (0.2, 0.15, 0.2))
    make_part('body', blob(bc, *br, seg=22, rows=12), fur, root, Mx)
    make_part('belly', ell_cap(bc, br, (0.5, -0.6, -0.2), 42, seg=18, rows=5), belly, root, Mx)
    # the head: a round furry head, a crest, a heart-shaped pink face with a cheeky grin
    hc, hr = V(0.12, 0, 0.76), (0.18, 0.17, 0.17)
    turn = rot_z(-25)
    MH = Mx @ about(hc, turn @ rot_y(-10 if body == 'drop' else 0))
    make_part('head', blob(hc, *hr, seg=22, rows=12), fur, root, MH)
    make_part('crest', cone(hc + V(-0.02, 0, 0.11), hc + V(-0.08, 0, 0.21), 0.06, flat=0.5, seg=10), fur2, root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('whisk_' + side, cone(hc + V(-0.02, sgn * 0.11, -0.02), hc + V(-0.04, sgn * 0.2, -0.07), 0.05, flat=0.5, seg=8), fur2, root, MH)
        make_part('ear_' + side, blob(hc + V(-0.03, sgn * 0.14, 0.03), 0.035, 0.02, 0.045, seg=10, rows=6), ear, root, MH, subsurf=1)
    fc, fr = hc + V(0.09, 0, -0.02), (0.12, 0.11, 0.12)
    make_part('face', blob(fc, *fr, seg=18, rows=10), face, root, MH)
    make_part('muzzle', blob(fc + V(0.06, 0, -0.06), 0.075, 0.085, 0.06, seg=14, rows=8), face, root, MH)
    fsurf = ellipsoid_surf(fc, *fr)
    for side, az in (('r', -0.2), ('l', 0.35)):
        p, n = fsurf(fc.z + 0.035, az)
        eye_one(kind, side, p - n * 0.01, n, root, MH, P)
    msurf = ellipsoid_surf(fc + V(0.06, 0, -0.06), 0.075, 0.085, 0.06)
    if P['mouth']:
        make_part('mouth', mouth_bm(msurf, P['mouth'], fc.z - 0.06, 0.45, -0.45, scale=0.75), kind + '_mouth', root, MH)
    # arms and legs per stance
    def limb(name, a, b, r, mat=fur, hand=None):
        mid = (a + b) / 2 + V(0, 0, 0.02)
        make_part(name, tube([a, mid, b], r, r * 0.85, seg=10), mat, root, Mx)
        if hand:
            make_part(name + '_h', sphere(b, r * 1.25, seg=10, rows=6), hand, root, Mx, subsurf=1)
    sh = V(0.06, 0, 0.56)
    hip = V(-0.08, 0, 0.26)
    for side, sgn, k in (('n', -1, 0), ('f', 1, 1)):
        y = sgn * 0.12
        if body == 'sit':
            limb('arm_' + side, sh + V(0, y, 0), V(0.2 - 0.04 * k, y * 0.6, 0.3 + 0.03 * math.sin(ph + k)), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(0.16, y, 0.1), 0.072, hand=face)
        elif body in ('run',):
            sw = math.sin(ph + k * math.pi)
            limb('arm_' + side, sh + V(0, y, 0), V(0.28 + 0.12 * sw, y * 0.8, 0.28 - 0.06 * abs(sw)), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(-0.02 - 0.16 * sw, y, 0.04 + 0.06 * max(0, sw)), 0.072, hand=face)
        elif body == 'carry':
            sw = math.sin(ph + k * math.pi)
            limb('arm_' + side, sh + V(0, y, 0), V(0.08 + 0.02 * k, y * 0.7, 0.98), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(0.02 - 0.14 * sw, y, 0.04 + 0.06 * max(0, sw)), 0.072, hand=face)
        elif body == 'climb':
            sw = math.sin(ph + k * math.pi)
            limb('arm_' + side, sh + V(0, y, 0), V(0.16, y * 0.5, 0.86 + 0.14 * sw), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(0.16, y * 0.5, 0.12 - 0.1 * sw), 0.072, hand=face)
        elif body == 'drop':
            limb('arm_' + side, sh + V(0, y, 0), V(0.1 + 0.18 * sgn, y * 1.4, 0.92), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(0.1 * sgn, y * 1.3, 0.02), 0.072, hand=face)
        elif body == 'flat':
            limb('arm_' + side, sh + V(0, y, 0), V(0.34 * (1 if k else -0.4), y * 1.6, 0.42), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(-0.3 + 0.5 * k, y * 1.6, 0.1), 0.072, hand=face)
        else:      # ko
            limb('arm_' + side, sh + V(0, y, 0), V(0.3, y * 1.3, 0.78 + 0.08 * k), 0.062, hand=face)
            limb('leg_' + side, hip + V(0, y, 0), V(0.18 - 0.2 * k, y * 1.2, 0.02), 0.072, hand=face)
    # the long tail
    tb = bc + V(-0.18, 0, -0.14)
    w = 0.06 * math.sin(ph)
    if body == 'sit':
        tail = [tb, tb + V(-0.12, 0, -0.16), tb + V(-0.2, 0, -0.3 + w), tb + V(-0.16, 0, -0.42 + w)]
    elif body == 'climb':
        tail = [tb, tb + V(-0.14, 0, -0.14), tb + V(-0.12, 0, -0.34 + w), tb + V(-0.02, 0, -0.42 + w)]
    else:
        tail = [tb, tb + V(-0.16, 0, 0.04), tb + V(-0.3, 0, 0.16 + w), tb + V(-0.32, 0, 0.32 + w)]
    make_part('tail', tube(tail, 0.045, 0.028, seg=10), fur2, root, Mx)


def build_monkey(root, pose, t):
    build_macaque(root, 'monkey', pose, t, 1.12)


def build_troop(root, pose, t):
    build_macaque(root, 'troop', pose, t, 0.96)


# ================================================================ JELLIES (custom classes, centre)
def jelly_body(root, kind, Mx, t, swim, glow, var, P):
    sfx = var
    bell = '%s_bell%s%s' % (kind, sfx, 'glow' if glow else '')
    inner = '%s_inner%s%s' % (kind, sfx, 'glow' if glow else '')
    tent = '%s_tent%s%s' % (kind, sfx, 'glow' if glow else '')
    pulse = math.sin(TAU * t) if swim else -0.3
    sxz = 1 + 0.08 * pulse
    c = V(0, 0, 0.08)
    rx, rz = 0.3 * sxz, 0.25 / sxz
    make_part('bell', ellipsoid(c, X * rx, Y * rx * 0.85, Z * rz, seg=26, rows=12, phi1=math.pi * 0.55), bell, root, Mx)
    make_part('inner', ellipsoid(c + V(-0.03, -0.03, 0.04), X * rx * 0.55, Y * rx * 0.45, Z * rz * 0.55, seg=18, rows=8, phi1=math.pi * 0.5), inner, root, Mx)
    rim_z = c.z - rz * math.cos(math.pi * 0.55)
    for k in range(10):
        a = TAU * k / 10
        make_part('scal%d' % k, sphere(V(rx * 0.95 * math.cos(a), rx * 0.8 * math.sin(a), rim_z - 0.025), 0.05, seg=10, rows=6), bell, root, Mx, subsurf=1)
    for k, x0 in enumerate((-0.14, -0.05, 0.05, 0.14)):
        path = []
        for j in range(6):
            u = j / 5
            sway = 0.05 * math.sin(TAU * (t + u * 0.6) + k)
            path.append(V(x0 * (1 + 0.3 * u) + sway, -0.04 + 0.02 * k, rim_z - 0.03 - 0.4 * u * (1 - 0.15 * pulse)))
        make_part('arm%d' % k, tube(path, 0.026, 0.01, seg=8), tent, root, Mx)
    surf = ellipsoid_surf(c, rx, rx * 0.85, rz)
    for side, az in (('r', -1.25), ('l', -1.9)):
        p, n = surf(c.z + rz * 0.35, az)
        eye_one(kind, side, p - n * 0.01, n, root, Mx, P)
    make_part('mouth', mouth_bm(surf, 'smile' if swim else 'o', c.z + rz * 0.08, -1.38, -1.78, scale=0.75), kind + '_mouth', root, Mx)


def build_glowJelly(root, pose, t):
    P = {'er': 0.06, 'skin': 'glowJelly_bellglow', 'lid': 0.15}
    if pose == 'ko':
        P['x'] = True
    var = {'swim': '', 'swimb': 'b', 'swimc': 'c', 'ko': 'ko'}[pose]
    Mx = rot_y(180) if pose == 'ko' else Matrix.Identity(4)
    jelly_body(root, 'glowJelly', Mx, t, pose != 'ko', True, var, P)


def build_jelly(root, pose, t):
    P = {'er': 0.06, 'skin': 'jelly_bell', 'lid': 0.15}
    var = pose[-1] if pose[-1] in 'bc' else ''
    P['skin'] = 'jelly_bell' + var
    if pose.startswith('flat'):
        P.update(lid=1.0)
        Mx = T((0, 0, -0.08)) @ diag(1.35, 1.2, 0.35)
        jelly_body(root, 'jelly', Mx, 0.0, False, False, var, P)
        return
    jelly_body(root, 'jelly', Matrix.Identity(4), t, True, False, var, P)


# ================================================================ GECKO (friend, feet): the tokay that lends the surfboard
def frangipani_bm(c, r, n_axis, petal, heart, root, M, name, twist=0.35, thick=0.02):
    """A five-petal frangipani lying in the plane facing n_axis (pinwheel petals), centred on c."""
    nz = Vector(n_axis).normalized()
    ax = (Z.cross(nz) if abs(nz.z) < 0.9 else X.cross(nz)).normalized()
    ay = nz.cross(ax)
    for k in range(5):
        a = TAU * k / 5
        d = math.cos(a) * ax + math.sin(a) * ay
        e = -math.sin(a) * ax + math.cos(a) * ay
        pc = c + d * r * 0.55 + e * r * 0.12
        pet = ellipsoid(pc, (d * math.cos(twist) + e * math.sin(twist)) * r * 0.58, (e * math.cos(twist) - d * math.sin(twist)) * r * 0.34, nz * thick, seg=12, rows=6)
        make_part('%s_p%d' % (name, k), pet, petal, root, M, subsurf=1)
    make_part(name + '_h', ellipsoid(c + nz * thick, ax * r * 0.2, ay * r * 0.2, nz * thick, seg=10, rows=5), heart, root, M, subsurf=1)


def surfboard(root, M, base, length, width, name='board'):
    """A cream surfboard standing on its tail at `base`, its deck facing the camera (-Y)."""
    c = base + V(0, 0, length / 2)
    bm = superellipsoid(c, width / 2, 0.035, length / 2, e=0.7, seg=20, rows=14)
    make_part(name, bm, 'gecko_board', root, M, subsurf=1)
    make_part(name + '_nose', cone(c + V(0, 0, length * 0.42), c + V(0, 0, length * 0.53), width * 0.32, flat=0.2, seg=10), 'gecko_board', root, M, subsurf=1)
    make_part(name + '_stripe', prism([c + V(-0.03, -0.04, -length * 0.42), c + V(0.03, -0.04, -length * 0.42), c + V(0.03, -0.04, length * 0.44), c + V(-0.03, -0.04, length * 0.44)], Y * 0.01), 'gecko_stripe', root, M, subsurf=0, smooth=False)
    make_part(name + '_band', prism([c + V(-width * 0.47, -0.042, -length * 0.3), c + V(width * 0.47, -0.042, -length * 0.3), c + V(width * 0.47, -0.042, -length * 0.22), c + V(-width * 0.47, -0.042, -length * 0.22)], Y * 0.01), 'gecko_band', root, M, subsurf=0, smooth=False)
    frangipani_bm(c + V(0, -0.05, length * 0.12), 0.1, (0, -1, 0), 'gecko_petal', 'gecko_heart', root, M, name + '_fl')


def build_gecko(root, pose, t):
    ph = TAU * t
    turn = rot_z(-38)                  # three-quarter toward the camera, a little to screen-right
    Mx = turn @ T((0, 0, 0.012 * math.sin(ph)))
    bc, br = V(0, 0, 0.34), (0.16, 0.15, 0.24)
    make_part('body', blob(bc, *br, seg=22, rows=14), 'gecko_skin', root, Mx)
    make_part('belly', ell_cap(bc, br, (0.6, -0.4, 0.0), 42, seg=18, rows=6), 'gecko_belly', root, Mx)
    surf = ellipsoid_surf(bc, *br)
    for k, (zc, ac) in enumerate(((0.44, -2.2), (0.3, -2.6), (0.22, -1.9), (0.5, -2.8), (0.38, -3.1))):
        make_part('spot%d' % k, oval_patch(surf, zc, 0.03, ac, 0.13, rows=4, cols=6), 'gecko_spot', root, Mx)
    # the big flat head with bulging eyes and a wide grin
    hc, hr = V(0.05, 0, 0.7), (0.19, 0.17, 0.14)
    nod = 4 * math.sin(ph) if pose == 'idle' else 6 * math.sin(ph * 2)
    MH = Mx @ about(V(0.02, 0, 0.58), rot_y(nod))
    make_part('head', blob(hc, *hr, seg=22, rows=14), 'gecko_skin', root, MH)
    make_part('snout', blob(hc + V(0.12, 0, -0.03), 0.11, 0.13, 0.08, seg=16, rows=8), 'gecko_skin', root, MH)
    hsurf = ellipsoid_surf(hc, *hr)
    for k, (zc, ac) in enumerate(((0.79, -2.6), (0.74, -3.0))):
        make_part('hspot%d' % k, oval_patch(hsurf, zc, 0.025, ac, 0.16, rows=4, cols=6), 'gecko_spot', root, MH)
    blink = pose == 'idle' and 0.82 < t < 0.98
    for side, sgn in (('l', 1), ('r', -1)):
        ec = hc + V(0.06, sgn * 0.12, 0.08)
        make_part('eye_' + side, sphere(ec, 0.075, seg=16, rows=10), 'gecko_eye', root, MH)
        if blink:
            make_part('lid_' + side, ellipsoid(ec, X * 0.078, Y * 0.078, Z * 0.078, seg=16, rows=8, phi1=math.pi * 0.95), 'gecko_skin', root, MH)
        else:
            n = (V(0.2, -1.0, 0.1)).normalized()
            make_part('slit_' + side, ellipsoid(ec + n * 0.068, X * 0.012, Y * 0.012, Z * 0.055, seg=8, rows=6), 'gecko_slit', root, MH @ about(ec, rot_z(-10)), subsurf=1)
            make_part('glint_' + side, sphere(ec + V(0.03, -0.06, 0.04), 0.014, seg=6, rows=4), 'gecko_petal', root, MH, subsurf=0)
    big = pose == 'wave'
    smile = [V(0.22, -0.1, 0.65), V(0.15, -0.17, 0.61 - 0.02 * big), V(0.04, -0.18, 0.62 - 0.02 * big), V(-0.05, -0.15, 0.66)]
    make_part('smile', tube(smile, 0.014, seg=6), 'gecko_mouth', root, MH, subsurf=1)
    # sitting legs with round toe pads, the tail curling on the ground behind
    for side, sgn in (('n', -1), ('f', 1)):
        knee = V(0.12, sgn * 0.16, 0.2)
        foot = V(0.14, sgn * 0.15, 0.03)
        make_part('thigh_' + side, tube([V(-0.04, sgn * 0.1, 0.18), knee, foot], 0.05, 0.04, seg=10), 'gecko_skin', root, Mx)
        for j in range(4):
            a = -0.7 + j * 0.45
            toe = foot + V(math.cos(a) * 0.08, sgn * 0.02 + math.sin(a) * 0.05, -0.01)
            make_part('toe%s%d' % (side, j), tube([foot, toe], 0.016, seg=5), 'gecko_skin', root, Mx, subsurf=0)
            make_part('pad%s%d' % (side, j), sphere(toe, 0.024, seg=8, rows=5), 'gecko_pad', root, Mx, subsurf=0)
    w = 0.04 * math.sin(ph)
    tail = [V(-0.12, 0.04, 0.12), V(-0.3, 0.1, 0.05), V(-0.44, 0.0, 0.06 + w), V(-0.46, -0.14, 0.1 + w), V(-0.36, -0.18, 0.14 + w)]
    make_part('tail', tube(tail, 0.06, 0.02, seg=10), 'gecko_skin', root, Mx)
    for k in range(3):
        q = tail[1 + k]
        make_part('tband%d' % k, sphere(q + V(0, -0.03, 0.03), 0.03, seg=8, rows=5), 'gecko_spot', root, Mx, subsurf=0)
    sh_n, sh_f = V(0.08, -0.13, 0.5), V(0.08, 0.13, 0.5)
    if pose == 'idle':
        # holding the board up beside it, one hand on the rail; the other on its belly
        surfboard(root, turn, V(0.5, 0.05, 0.0), 1.22, 0.36)
        make_part('arm_n', tube([sh_n, V(0.24, -0.16, 0.52), V(0.36, -0.12, 0.62)], 0.04, 0.035, seg=10), 'gecko_skin', root, Mx)
        make_part('hand_n', sphere(V(0.37, -0.12, 0.63), 0.045, seg=10, rows=6), 'gecko_pad', root, Mx, subsurf=1)
        make_part('arm_f', tube([sh_f, V(0.16, 0.1, 0.38), V(0.16, 0.0, 0.32)], 0.04, 0.035, seg=10), 'gecko_skin', root, Mx)
    else:
        a = 30 * math.sin(ph * 2)
        MA = Mx @ about(sh_n, rot_x(-a))
        make_part('arm_n', tube([sh_n, sh_n + V(0.06, -0.14, 0.14), sh_n + V(0.06, -0.12, 0.34)], 0.04, 0.035, seg=10), 'gecko_skin', root, MA)
        hand = sh_n + V(0.06, -0.12, 0.38)
        make_part('hand_n', sphere(hand, 0.05, seg=10, rows=6), 'gecko_skin', root, MA, subsurf=1)
        for j in range(4):
            a2 = -0.6 + j * 0.4
            make_part('fing%d' % j, sphere(hand + V(math.sin(a2) * 0.07, -0.01, math.cos(a2) * 0.07), 0.022, seg=8, rows=5), 'gecko_pad', root, MA, subsurf=0)
        make_part('arm_f', tube([sh_f, V(0.16, 0.1, 0.38), V(0.16, 0.0, 0.32)], 0.04, 0.035, seg=10), 'gecko_skin', root, Mx)


# ================================================================ COIN: the golden frangipani
def build_coin(root, pose, t):
    M = rot_z(360 * t)
    c = V(0, 0, 0)
    make_part('disc', ellipsoid(c + V(0, 0.03, 0), X * 0.2, Y * 0.05, Z * 0.2, seg=20, rows=8), 'coin_gold2', root, M, subsurf=1)
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        d = V(math.cos(a), 0, math.sin(a))
        e = V(-math.sin(a), 0, math.cos(a))
        tw = 0.45
        pc = c + d * 0.17 + e * 0.04
        ax = (d * math.cos(tw) + e * math.sin(tw)) * 0.17
        az = (e * math.cos(tw) - d * math.sin(tw)) * 0.1
        make_part('petal%d' % k, ellipsoid(pc, ax, Y * 0.055, az, seg=14, rows=8), 'coin_gold', root, M, subsurf=1)
        make_part('vein%d' % k, ellipsoid(pc - d * 0.06 + V(0, -0.05, 0), ax * 0.5, Y * 0.01, az * 0.25, seg=10, rows=4), 'coin_rim', root, M, subsurf=0)
    make_part('heart', ellipsoid(c + V(0, -0.04, 0), X * 0.08, Y * 0.05, Z * 0.08, seg=12, rows=8), 'coin_heart', root, M, subsurf=1)


# ================================================================ STAR: the golden gecko
def build_star(root, pose, t):
    M = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(10 * math.sin(TAU * t))
    make_part('body', blob(V(0, 0, -0.02), 0.11, 0.07, 0.2, seg=16, rows=10), 'star_gold', root, M)
    make_part('head', blob(V(0, 0, 0.27), 0.13, 0.08, 0.11, seg=16, rows=10), 'star_gold', root, M)
    for k, (x, z) in enumerate(((-0.05, 0.05), (0.04, -0.06), (-0.02, -0.14), (0.05, 0.12))):
        make_part('spot%d' % k, ellipsoid(V(x, -0.065, z), X * 0.025, Y * 0.01, Z * 0.025, seg=8, rows=4), 'star_spot', root, M, subsurf=0)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('eye_' + side, sphere(V(sgn * 0.06, -0.06, 0.3), 0.025, seg=8, rows=6), 'star_eye', root, M, subsurf=0)
    for k, (sx, sz) in enumerate(((-1, 1), (1, 1), (-1, -1), (1, -1))):
        a0 = V(sx * 0.08, 0, 0.1 if sz > 0 else -0.14)
        knee = a0 + V(sx * 0.12, 0, 0.06 * sz)
        foot = knee + V(sx * 0.02, 0, 0.1 * sz)
        make_part('leg%d' % k, tube([a0, knee, foot], 0.032, 0.026, seg=8), 'star_gold', root, M, subsurf=1)
        for j in range(3):
            a = math.atan2(sz, sx * 0.3) + (j - 1) * 0.6
            make_part('toe%d_%d' % (k, j), sphere(foot + V(math.cos(a) * 0.04, 0, math.sin(a) * 0.04), 0.022, seg=8, rows=5), 'star_gold2', root, M, subsurf=0)
    tail = [V(0, 0, -0.2), V(0.03, 0, -0.34), V(0.12, 0, -0.42), V(0.18, 0, -0.36), V(0.14, 0, -0.3)]
    make_part('tail', tube(tail, 0.045, 0.02, seg=8), 'star_gold', root, M)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.4 * math.cos(a), -0.2, 0.25 * math.sin(a) + 0.04)
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, M, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the batik bundle
def face_poly(c, nrm, tng, pts2d):
    bn, bt = Vector(nrm).normalized(), Vector(tng).normalized()
    bu = bn.cross(bt)
    return [Vector(c) + bt * u + bu * v for u, v in pts2d]


def build_bundle(root, M, kind, spent):
    H = 0.46
    cloth, cloth2, motif, dot, knot = (kind + x for x in ('_cloth', '_cloth2', '_motif', '_dot', '_knot'))
    make_part('box', superellipsoid((0, 0, -0.03), H, H, H, e=0.2, seg=24, rows=12), cloth, root, M, subsurf=0)
    faces = [((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((0, 0, 1), (1, 0, 0))]
    for fi, (nrm, tng) in enumerate(faces):
        bn = Vector(nrm)
        c = bn * (H + 0.01) + V(0, 0, -0.03)
        # a 2 x 2 kawung pattern: four petals in a diamond around a dot, with cloth showing between
        for iu, cu in enumerate((-0.21, 0.21)):
            for iv, cv in enumerate((-0.21, 0.21)):
                for j in range(4):
                    a = TAU * j / 4 + TAU / 8
                    pu, pv = cu + math.cos(a) * 0.1, cv + math.sin(a) * 0.1
                    pts = [(pu + 0.075 * math.cos(a) * math.cos(b) - 0.045 * math.sin(a) * math.sin(b),
                            pv + 0.075 * math.sin(a) * math.cos(b) + 0.045 * math.cos(a) * math.sin(b)) for b in [TAU * q / 10 for q in range(10)]]
                    make_part('k%d_%d%d_%d' % (fi, iu, iv, j), prism(face_poly(c, nrm, tng, pts), bn * 0.016), motif, root, M, subsurf=0, smooth=False)
                dd = [(cu + 0.03 * math.cos(TAU * q / 8), cv + 0.03 * math.sin(TAU * q / 8)) for q in range(8)]
                make_part('d%d_%d%d' % (fi, iu, iv), prism(face_poly(c + bn * 0.006, nrm, tng, dd), bn * 0.016), dot, root, M, subsurf=0, smooth=False)
        # a border line around the face
        for (a0, a1) in (((-0.4, -0.4), (0.4, -0.4)), ((0.4, -0.4), (0.4, 0.4)), ((0.4, 0.4), (-0.4, 0.4)), ((-0.4, 0.4), (-0.4, -0.4))):
            p0, p1 = face_poly(c, nrm, tng, [a0, a1])
            make_part('edge%d_%.1f%.1f' % (fi, a0[0], a0[1]), tube([p0, p1], 0.012, seg=4), cloth2, root, M, subsurf=0)
    # the knot on top: two cloth ears
    for k, sgn in enumerate((-1, 1)):
        ec = V(sgn * 0.13, -0.08, 0.47)
        make_part('ear%d' % k, ellipsoid(ec, X * 0.15, Y * 0.07, Z * 0.06, seg=12, rows=8), knot, root, M @ about(ec, rot_y(sgn * 20)), subsurf=1)
    make_part('knotc', sphere(V(0, -0.1, 0.46), 0.06, seg=10, rows=6), knot, root, M, subsurf=1)
    if not spent:
        frangipani_bm(V(0.0, -0.17, 0.47), 0.1, (0, -1, 0.4), 'qblock_petal', 'qblock_heart', root, M, 'flower')


def build_qblock(root, pose, t):
    build_bundle(root, rot_z(-22) @ rot_x(8), 'qblock', False)


def build_used(root, pose, t):
    build_bundle(root, rot_z(-22) @ rot_x(8), 'used', True)


# ================================================================ public API
BUILDERS = {'flyfish': build_flyfish, 'urchin': build_urchin, 'duck': build_duck, 'scarecrow': build_scarecrow,
            'dragonfly': build_dragonfly, 'sate': build_sate, 'civet': build_civet, 'bat': build_bat,
            'lionfish': build_lionfish, 'angler': build_angler, 'moray': build_moray, 'monkey': build_monkey,
            'troop': build_troop, 'glowJelly': build_glowJelly, 'jelly': build_jelly, 'gecko': build_gecko,
            'coin': build_coin, 'star': build_star, 'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    """Build one kind in a pose (fresh geometry; any previous build of that kind is removed first)."""
    if kind not in KINDS:
        raise ValueError('unknown kind %r; one of %s' % (kind, KINDS))
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s; one of %s' % (pose, kind, POSES[kind]))
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    thin_face_ink(root)
    return root


# these characters are small (16-30 px): full-width ink around every eye, pupil and mouth would swallow their faces,
# so face details get a thinner line (the silhouette keeps the full one)
FACE_INK = (('pupil_', 0.0), ('eye_', 0.6), ('lid_', 0.6), ('lash_', 0.0), ('xeye_', 0.4), ('mouth', 0.45), ('brow_', 0.4),
            ('glint', 0.0), ('slit_', 0.0), ('spot', 0.35), ('hspot', 0.35), ('band', 0.5), ('stripe', 0.5), ('goggle', 0.5))


def thin_face_ink(root):
    for ob in root.children_recursive:
        part = ob.get('sprite_part', '')
        for pre, k in FACE_INK:
            if part.startswith(pre):
                ob['outline'] = k
                break
