# Morocco 5-5 "Riad of Fountains": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  maMedina (base 330, f 0.08): the riad's courtyard walls: a ground-floor arcade of horseshoe arches over a
#       zellige dado, a carved plaster frieze, a cedar beam, the upper gallery with a turned-wood balustrade and
#       smaller arches, green glazed roof tiles along the eaves; potted orange trees and two tall palms in front
#   ground: the engine's 'marble' style as a zellige floor: a cream marble kerb with a blue inlay line over square
#       glazed tiles (each 32-px tile its own tile: an eight-point star, a checker or a rosette), lighter grout
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, Builder, plain, hs_arch, new_collection

MODULE = 'ma_riad'
LAYERS = ['L0']
BASES = {'L0': 330}
SKY = ['#2a6ab8', '#7ab8e8', '#e8f4ff']
PALETTE = {
    'wall': '#f0e0c8', 'wall2': '#e8d4b8', 'plaster': '#f8eedc', 'plaster_dk': '#d8c4a4', 'arch_dk': '#8a9cbc', 'arch_dk2': '#7a8cae',
    'z_blue': '#1a6ab8', 'z_teal': '#1a9a8a', 'z_cream': '#f4ecd8', 'z_green': '#2a8a4a', 'z_navy': '#2a3a6a', 'z_gold': '#c8a03a',
    'cedar': '#8a5a3a', 'cedar_dk': '#6a4028', 'roof': '#2a8a5a', 'roof_dk': '#1e6a44', 'plain': '#e8d8bc',
    'potb': '#1a6ab8', 'pott': '#1a9a8a', 'leaf': '#3a8a3a', 'leaf2': '#2e7a32', 'fruit': '#ff9a1a', 'trunk': '#7a5a3a', 'palm': '#3a8a3a', 'palm2': '#2a6a2e',
    # ground (zellige floor)
    'g_grout': '#e8dcc4', 'g_cap': '#f4ecd8', 'g_cap_hi': '#ffffff', 'g_inlay': '#1a6ab8',
}
K.use(MODULE, PALETTE, LAYERS)


def dado(B, x0, x1, z0, z1, y, rng):
    """A zellige dado: a checker of small glazed squares with a navy border band on top."""
    s = 0.24
    n, m = int((x1 - x0) / s), int((z1 - z0) / s)
    roles = ('z_blue', 'z_cream', 'z_teal', 'z_cream')
    for i in range(n):
        for j in range(m):
            B.box(roles[(i + 2 * j) % 4] if (i + j) % 2 else roles[(i + j + 1) % 4], (x0 + (i + 0.5) * s, y, z0 + (j + 0.5) * s), (s - 0.02, 0.05, s - 0.02), bevel=0.0)
    B.box('z_navy', ((x0 + x1) / 2, y - 0.01, z0 + m * s + 0.06), (x1 - x0, 0.06, 0.12), bevel=0.0)


def horseshoe(B, role, at, w, h, depth, bulge=1.06, segs=14):
    """A gentle horseshoe arch (the arc bulges `bulge` past straight jambs), bottom centre at `at`."""
    r = w / 2 * bulge
    cz = h - r
    a0 = math.asin(min(0.99, (w / 2) / r)) if bulge > 1 else math.pi / 2
    start = math.pi / 2 - a0            # angle where the arc meets the jamb, below the centre
    pts = [(-w / 2, 0.0), (w / 2, 0.0), (w / 2, cz - r * math.sin(start) * 0.0)]
    for i in range(segs + 1):
        a = -start + (math.pi + 2 * start) * i / segs
        pts.append((r * math.cos(a), cz + r * math.sin(a)))
    pts.append((-w / 2, cz))
    clean = []
    for p in pts:
        if not clean or abs(p[0] - clean[-1][0]) + abs(p[1] - clean[-1][1]) > 1e-4:
            clean.append(p)
    return B.slab(role, clean, depth, at)


def potted_orange(B, x, y, s, rng):
    B.lathe(rng.choice(('potb', 'pott')), [(0.3 * s, 0.0), (0.42 * s, 0.35 * s), (0.44 * s, 0.6 * s), (0.5 * s, 0.66 * s), (0.5 * s, 0.72 * s)], 10, at=(x, y, 0.0), cap_top=True, cap_bottom=True)
    B.rod('trunk', (x, y, 0.7 * s), (x, y, 1.6 * s), 0.07 * s, segs=5)
    B.sphere('leaf', (x, y, 2.05 * s), 0.62 * s, scale=(1.0, 0.7, 0.85), subdiv=2)
    B.sphere('leaf2', (x + 0.32 * s, y + 0.1, 1.85 * s), 0.38 * s, scale=(1.0, 0.7, 0.85), subdiv=1)
    for k in range(6):
        a = TAU * k / 6 + rng.uniform(-0.3, 0.3)
        B.sphere('fruit', (x + math.cos(a) * 0.48 * s, y - 0.42 * s, 2.05 * s + math.sin(a) * 0.4 * s), 0.09 * s, subdiv=1)


TAU = math.tau


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'plain', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    B = Builder('L0_arcade', L)
    O = Builder('L0_openings', L)        # the shaded openings: a light ink line only
    bays = 6
    bw = P / bays
    for i in range(bays):
        xc = (i + 0.5) * bw
        # the ground-floor horseshoe arch (a shaded opening) between piers, the zellige dado on the piers
        horseshoe(O, 'arch_dk', (xc, 1.0, 0.0), bw * 0.6, 3.3, 0.1)
        O.box('arch_dk2', (xc, 0.98, 0.45), (bw * 0.6, 0.06, 0.9), bevel=0.0)
        for side in (-1, 1):
            px0 = xc + side * bw * 0.3
            px1 = xc + side * bw * 0.5
            dado(B, min(px0, px1) + 0.04, max(px0, px1) - 0.04, 0.0, 0.96, 0.92, rng)
        # the upper storey: one carved cedar screen window per bay, alternating with a small arched niche
        if i % 2 == 0:
            K.mashrabiya(B, xc, 1.0, 4.75, 1.5, 1.1, 'cedar_dk', 'cedar')
        else:
            horseshoe(O, 'arch_dk2', (xc, 1.0, 4.7), 0.8, 1.3, 0.08)
    # the wall face (the openings sit proud of it)
    B.box('wall', (P / 2, 1.16, 3.1), (P + 2.0, 0.1, 6.2), bevel=0.0)
    # carved plaster frieze with little diamonds, the cedar beam, the eave of green roof tiles
    B.box('plaster', (P / 2, 0.95, 3.75), (P + 2.0, 0.12, 0.46), bevel=0.0)
    for k in range(int(P / 0.6)):
        B.box('plaster_dk', ((k + 0.5) * 0.6, 0.88, 3.75), (0.16, 0.04, 0.16), bevel=0.0, rot=(0, math.pi / 4, 0))
    B.box('cedar', (P / 2, 0.9, 4.2), (P + 2.0, 0.3, 0.26), bevel=0.0)
    B.box('cedar_dk', (P / 2, 0.86, 6.2), (P + 2.0, 0.4, 0.2), bevel=0.0)
    for k in range(int(P / 0.4) + 6):
        x = -1.0 + k * 0.4
        B.rod('roof' if k % 2 else 'roof_dk', (x, 0.2, 6.3), (x, 1.2, 6.62), 0.19, segs=6)
    B.done(period=None)
    O.done(period=None)['outline'] = 0.45
    # potted orange trees under every other arch, palms rising behind the eave
    F = Builder('L0_garden', L)
    for i in range(bays):
        if i % 2 == 1:
            potted_orange(F, (i + 0.5) * bw + rng.uniform(-0.3, 0.3), -0.6, rng.uniform(1.0, 1.15), rng)
    F.done()
    Pm = Builder('L0_palms', L)
    for x, h in ((P * 0.18, 9.4), (P * 0.24, 8.4), (P * 0.68, 9.0)):
        top = (x + 0.4, 3.0, h)
        Pm.rod('trunk', (x, 3.0, 5.5), top, 0.16, segs=6, r2=0.11)
        for k in range(9):
            a = -math.pi + k * math.pi / 8 - 0.1
            Pm.sphere('palm' if k % 2 else 'palm2', (top[0] + math.cos(a) * 1.0, 2.95, top[2] + math.sin(a) * 0.5 + 0.1), 0.66,
                      scale=(1.55, 0.35, 0.3), rot=(0, -a * 0.6, 0), subdiv=1)
    Pm.done()


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def star8(B, role, xc, zc, r, y):
    """An eight-point star: two squares, one turned 45 degrees."""
    B.box(role, (xc, y, zc), (r * 1.41, 0.06, r * 1.41), bevel=0.0)
    B.box(role, (xc, y, zc), (r * 1.41, 0.06, r * 1.41), bevel=0.0, rot=(0, math.pi / 4, 0))


def build_ground(seed=1):
    """A zellige floor: a marble kerb (cap) along z = 0 with a blue inlay line, then every 32-px tile a glazed
    tile of its own, inside the tile with grout around it, so the engine can draw them in any order."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_grout', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_cap', (GP / 2, 0.1, -0.2), (GP + 1.0, 0.9, 0.36), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.04, -0.06), (GP + 1.0, 0.96, 0.06), bevel=0.0)
    B.box('g_inlay', (GP / 2, -0.37, -0.27), (GP + 1.0, 0.04, 0.07), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_tiles', GROUND_COLL)
    designs = ['star', 'star', 'check', 'rosette', 'star', 'plain']
    bases = ('z_blue', 'z_teal', 'z_green', 'z_navy')
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN + 0.03, (col + 1) * T - CELL_MARGIN - 0.03
            z0, z1 = -row * T - CELL_MARGIN - 0.03 - (0.42 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN + 0.03
            xc, zc, w, h = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z0 - z1
            base = rng.choice(bases)
            d = rng.choice(designs)
            B.rbox('z_cream' if d in ('plain', 'star') else base, (xc, -0.1, zc), (w, 0.3, h), bevel=0.05, segments=1)
            r = min(w, h) * 0.3
            if d == 'star':
                star8(B, base, xc, zc, r * 1.15, -0.28)
                B.box('z_gold', (xc, -0.32, zc), (r * 0.6, 0.04, r * 0.6), bevel=0.0, rot=(0, math.pi / 4, 0))
            elif d == 'check':
                q = min(w, h) / 4
                for i in range(4):
                    for j in range(4):
                        if (i + j) % 2 and abs(zc - h / 2 + (j + 0.5) * q - zc) < h / 2:
                            B.box('z_cream', (xc - w / 2 + (i + 0.5) * w / 4, -0.28, zc - h / 2 + (j + 0.5) * h / 4), (w / 4 - 0.03, 0.05, h / 4 - 0.03), bevel=0.0)
            elif d == 'rosette':
                B.box('z_cream', (xc, -0.28, zc), (r * 1.6, 0.05, r * 1.6), bevel=0.0, rot=(0, math.pi / 4, 0))
                star8(B, rng.choice(bases), xc, zc, r * 0.55, -0.32)
            else:
                B.box(base, (xc, -0.28, zc), (r * 0.7, 0.05, r * 0.7), bevel=0.0, rot=(0, math.pi / 4, 0))
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
