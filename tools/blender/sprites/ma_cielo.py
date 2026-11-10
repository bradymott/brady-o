# Morocco (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `ma_cielo`: "Carpet Skies" (5-6, secret SKY level).
# Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this atlas's name.
#   L0  (base 330, f 0.03, blur-friendly): the High Atlas seen from far above, small snowy peaks over a hazy plain,
#       a medina far below with two minarets as plain distant silhouettes only
#   L1  (base 380, f 0.12): banks of big toon clouds in warm white and peach, a few storks gliding between them
#   ground: a flying-carpet surface: a fringed woven edge as the cap over a red rug body with a diamond motif per tile
import math, random
import ma_kit as K
from ma_kit import P, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, Builder, plain, peak, new_collection, _split

MODULE = 'ma_cielo'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 380}
SKY = ['#4a8ae0', '#a8d0ff', '#ffe8d0']
PALETTE = {
    'mtn_a': '#a8b0d0', 'mtn_b': '#9ca4c8', 'mtn_snow': '#f6f8ff', 'haze': '#c8c8dc', 'town': '#d8b8a0', 'town2': '#ccaa90',
    'minaret': '#c8a890', 'minaret_band': '#9ab8b0', 'minaret_gold': '#c8b07a',
    'cloud': '#ffffff', 'cloud2': '#fff2e4', 'cloud3': '#ffe0cc', 'cloud_sh': '#e8d8e8',
    'stork': '#ffffff', 'stork_wing': '#2a2a34', 'stork_beak': '#e8502a',
    'g_rug': '#b8222a', 'g_rug2': '#a01c24', 'g_gold': '#e8a02a', 'g_blue': '#2a4a9a', 'g_cream': '#f4e8d0', 'g_fringe': '#f4e8d0', 'g_edge': '#e8a02a',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'haze', y=4.0, depth=4.0, top=0.0, bottom=-3.0)
    for i, x in enumerate([2.0, 7.0, 12.5, 18.0, 23.5, 29.0, 34.0]):
        peak(L, f'L0_peak_{i}', x + rng.uniform(-0.6, 0.6), 3.5, rng.uniform(2.6, 3.4), rng.uniform(2.4, 3.4), ('mtn_a', 'mtn_b')[i % 2],
             rng.choice((6, 7)), rng, snow='mtn_snow', snow_from=0.55)
    B = Builder('L0_town', L)
    for a, b in zip(*(lambda e: (e, e[1:]))(_split(9.0, 17.0, 14, rng))):
        h = rng.uniform(0.3, 0.7)
        B.box(rng.choice(('town', 'town2')), ((a + b) / 2, 1.0, h / 2), (b - a - 0.04, 0.4, h), bevel=0.0)
    B.done(period=None)
    # two minarets far below, as plain tiny silhouettes only
    M = Builder('L0_minarets_far', L)
    for x in (11.0, 15.4):
        s = 0.32
        M.box('minaret', (x, 1.2, 1.25 * s * 1.0), (1.42 * s, 1.42 * s, 2.5 * s * 1.0), bevel=0.0)
        M.box('minaret', (x, 1.2, 2.5 * s + 0.15), (0.86 * s, 0.86 * s, 0.3), bevel=0.0)
        M.box('minaret_band', (x, 1.18, 2.2 * s), (1.46 * s, 1.46 * s, 0.09), bevel=0.0)
    M.done()


def cloud_bank(B, x, z, w, rng):
    """A toon cloud bank: overlapping round puffs (big in the middle), a peach-tinted lower row; no flat base, so it
    never reads as a ledge."""
    n = max(3, int(w / 1.1))
    for k in range(n):
        u = (k + 0.5) / n
        px = x - w / 2 + u * w + rng.uniform(-0.2, 0.2)
        r = rng.uniform(0.9, 1.3) * (1.0 - 0.45 * abs(u - 0.5) * 2)
        B.sphere('cloud3', (px, 0.2, z + r * 0.5), r * 0.9, scale=(1.25, 0.7, 0.75), subdiv=2)
        B.sphere('cloud2' if k % 2 else 'cloud', (px + 0.2, 0.0, z + r * 0.95), r, scale=(1.2, 0.7, 0.9), subdiv=2)
    for k in range(max(1, n - 2)):
        px = x - w / 2 + (k + 1) * w / n + rng.uniform(-0.2, 0.2)
        B.sphere('cloud', (px, -0.2, z + 1.9 + rng.uniform(0, 0.5)), rng.uniform(0.8, 1.1), scale=(1.2, 0.7, 0.9), subdiv=2)


def stork(B, x, z, s, flap):
    B.sphere('stork', (x, -0.5, z), 0.3 * s, scale=(1.6, 0.6, 0.6), subdiv=1)
    B.rod('stork', (x + 0.4 * s, -0.5, z + 0.05), (x + 0.75 * s, -0.5, z + 0.1), 0.06 * s, segs=5)
    B.sphere('stork', (x + 0.8 * s, -0.5, z + 0.12), 0.1 * s, subdiv=1)
    B.rod('stork_beak', (x + 0.88 * s, -0.5, z + 0.1), (x + 1.2 * s, -0.5, z + 0.04), 0.03 * s, segs=4)
    B.slab('stork_wing', [(-0.3 * s, 0.0), (0.25 * s, 0.0), (0.0, 0.85 * s * flap)], 0.04, at=(x, -0.55, z + 0.08))
    B.rod('stork_beak', (x - 0.4 * s, -0.5, z - 0.02), (x - 0.8 * s, -0.5, z - 0.06), 0.02 * s, segs=4)


def build_L1(rng):
    L = 'L1'
    B = Builder('L1_clouds', L)
    for k in range(5):
        x = (k + 0.5) * P / 5 + rng.uniform(-1.2, 1.2)
        cloud_bank(B, x, rng.uniform(-0.6, 0.6), rng.uniform(5.0, 7.0), rng)
    B.done()
    S = Builder('L1_storks', L)
    for k in range(3):
        stork(S, rng.uniform(2, P - 2), rng.uniform(4.5, 6.5), rng.uniform(0.8, 1.0), rng.choice((1, -0.6)))
    S.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """A flying carpet's surface: a gold-edged woven cap with a cream fringe, over a red rug with a diamond motif in
    each 32-px tile (tile-aligned, so the engine can draw the tiles in any order)."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_rug', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_edge', (GP / 2, 0.1, -0.18), (GP + 1.0, 0.9, 0.3), bevel=0.0)
    B.box('g_cream', (GP / 2, 0.04, -0.06), (GP + 1.0, 0.96, 0.06), bevel=0.0)
    B.box('g_blue', (GP / 2, -0.37, -0.2), (GP + 1.0, 0.04, 0.06), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_motifs', GROUND_COLL)
    for col in range(8):
        for row in range(3):
            xc = (col + 0.5) * T
            zc = -(row + 0.5) * T - (0.18 if row == 0 else 0.0)
            r = (T / 2 - CELL_MARGIN) * (0.8 if row else 0.6)
            B.box('g_rug2', (xc, -0.1, zc), (T - 2 * CELL_MARGIN - 0.1, 0.3, (T - 2 * CELL_MARGIN - 0.1) * (0.75 if row == 0 else 1.0)), bevel=0.0)
            B.box(rng.choice(('g_gold', 'g_blue', 'g_cream')), (xc, -0.28, zc), (r, 0.05, r), bevel=0.0, rot=(0, math.pi / 4, 0))
            B.box('g_rug', (xc, -0.32, zc), (r * 0.45, 0.05, r * 0.45), bevel=0.0, rot=(0, math.pi / 4, 0))
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
