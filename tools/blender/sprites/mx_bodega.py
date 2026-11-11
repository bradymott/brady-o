# Mexico 1-1 "La Bodega" (the secret cellar shop under the market): the parallax background as a toon diorama.
#   L0  mxCellar (f 0.18): a vaulted brick cellar wall: four deep arched niches, each with two dim shelves of glass
#       jars (chilies, nopal, tamarind, hibiscus, pickled limes), voussoir rims, chili ristras hanging between the
#       vaults, squat barrels at the pier feet. Rendered with its ground line at row 352 (the room's floor row), so
#       the game wires it with no shift (29_tour_mx_levels.js).
#   ground: the cellar floor: a dark-wood kerb over square saltillo (terracotta) tiles, one per 32-px tile.
# The same atlas also carries the 1-1 cellar lane's vault decor frames (vault_a / vault_b, from mx_vault.py):
#   build_country.sh mx <work> mx_bodega        (theme only: strips + ground)
#   then re-pack with the vault frames:
#   W=<work>; JOB=enemies:mx_vault LOOK=toon OUT=$W/mx_vault NAME=mx_bodega SCALE=2 OUTLINE=0.9 gui/bl.sh $W/v.log render_country.py
#   gui/bl.sh $W/p.log pack_atlas.py $W/mx_bodega/spec.json $W/mx_vault/spec.json ../../../assets/sprites/super-brady-o-world/mx_bodega
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, Builder, new_collection

MODULE = 'mx_bodega'
LAYERS = ['L0']
BASES = {'L0': 352}
SKY = ['#1a0e08', '#2e1a10', '#3e2416']
PALETTE = {
    'wall': '#6e3a22', 'brick_a': '#84482a', 'brick_b': '#76402a', 'brick_c': '#8e5634', 'mortar': '#5a2e1a',
    'niche': '#2a150c', 'niche2': '#341c10', 'rim': '#a8663e', 'rim2': '#94583a', 'pier': '#7a4428',
    'shelf': '#5a3418', 'jar': '#a8c4c8', 'lid': '#7a4a24', 'j_red': '#b8402a', 'j_orange': '#d8902e', 'j_green': '#5a8a3a',
    'j_pink': '#c85a7a', 'j_cream': '#d8c89a', 'chili': '#c8281a', 'chili2': '#9a1a10', 'stem': '#4a7a2a', 'cord': '#8a6a44',
    'barrel': '#6a3c1e', 'barrel_dk': '#52301a', 'hoop': '#3e3a44', 'floor_dk': '#3a2014',
    # ground
    'g_grout': '#3e2216', 'g_cap': '#7a4a2c', 'g_cap_hi': '#a8704a', 'g_cap_dk': '#5a341e',
    'g_tile_a': '#b0623a', 'g_tile_b': '#a05632', 'g_tile_c': '#bc7046', 'g_tile_hi': '#cc8a5a',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau
BAYS = 4
BW = P / BAYS


def jar(B, x, y, z, h, rng):
    r = rng.uniform(0.2, 0.26)
    B.lathe('jar', [(r * 0.8, 0.0), (r, h * 0.15), (r, h * 0.8), (r * 0.7, h * 0.92), (r * 0.7, h)], 10, at=(x, y, z), cap_top=True, cap_bottom=True, smooth=True)
    fill = rng.choice(('j_red', 'j_orange', 'j_green', 'j_pink', 'j_cream', 'j_red'))
    B.lathe(fill, [(r * 0.78, 0.02), (r * 0.9, h * 0.15), (r * 0.9, h * 0.62)], 10, at=(x, y - 0.06, z), cap_top=True, cap_bottom=True, smooth=True)
    B.lathe('lid', [(r * 0.78, 0.0), (r * 0.78, 0.1)], 10, at=(x, y, z + h), cap_top=True, cap_bottom=True)


def ristra(B, x, y, z0, n, rng):
    B.rod('cord', (x, y, z0 + 0.4), (x, y, z0 - n * 0.24 - 0.2), 0.03, segs=4)
    for k in range(n):
        zz = z0 - k * 0.24
        for s in (-1, 1):
            if (k + (s > 0)) % 2:
                continue
            B.sphere('chili' if k % 3 else 'chili2', (x + s * 0.13, y - 0.1, zz - 0.15), 0.1, scale=(0.75, 0.75, 2.2), rot=(0, s * 0.45, 0), subdiv=1)
    B.sphere('stem', (x, y - 0.1, z0 + 0.15), 0.12, scale=(1.4, 1, 0.8), subdiv=1)


def build_L0(rng):
    L = 'L0'
    # the wall, carried past both strip edges (no outline at the seam), and a dark floor strip under the ground line
    W = Builder('L0_wall', L)
    W.box('wall', (P / 2, 4.0, 4.5), (P + 2.0, 1.0, 18.0), bevel=0.0)
    W.box('floor_dk', (P / 2, 2.0, -1.5), (P + 2.0, 1.0, 3.2), bevel=0.0)
    W.done(period=None)['outline'] = 0
    # brick courses: soft raised bricks, close in value, no ink (a calm backdrop)
    Bk = Builder('L0_bricks', L)
    bh, bw = 0.42, 0.95
    for r in range(int(14.5 / bh)):
        z = -0.2 + r * bh + bh / 2
        off = (bw / 2) if r % 2 else 0.0
        x = -1.0 + off
        while x < P + 1.0:
            if rng.random() < 0.82:
                Bk.box(rng.choice(('brick_a', 'brick_b', 'brick_c', 'brick_a')), (x + bw / 2, 3.45, z), (bw - 0.08, 0.2, bh - 0.08), bevel=0.03)
            x += bw
    Bk.done(period=None)['outline'] = 0
    # the vaulted niches with their voussoir rims, piers between them
    N = Builder('L0_niches', L)
    R = Builder('L0_rims', L)
    S = Builder('L0_shelves', L)
    for i in range(BAYS):
        xc = (i + 0.5) * BW
        nw, nh = 5.6, 8.2
        N.arch('niche', (xc, 3.0, 0.0), nw, nh, 0.2, segs=14)
        N.arch('niche2', (xc, 2.98, 0.0), nw - 0.9, nh - 0.6, 0.05, segs=14)
        # voussoirs: chunky wedge bricks around the arch
        r0 = nw / 2
        cz = nh - r0
        nv = 13
        for k in range(nv):
            a = math.pi * (k + 0.5) / nv
            px, pz = xc + math.cos(a) * (r0 + 0.32), cz + math.sin(a) * (r0 + 0.32)
            R.box('rim' if k % 2 else 'rim2', (px, 2.9, pz), (0.62, 0.3, 0.42), bevel=0.05, rot=(0, -(a - math.pi / 2), 0))
        for s in (-1, 1):
            R.box('rim', (xc + s * (r0 + 0.32), 2.9, cz * 0.5), (0.5, 0.3, cz), bevel=0.04)
        # two shelves of jars inside the niche, dim and recessed
        for sz in (1.4, 3.7):
            S.box('shelf', (xc, 2.75, sz), (nw - 1.3, 0.5, 0.14), bevel=0.02)
            n = 6
            for k in range(n):
                jx = xc - (nw - 1.9) / 2 + (k + 0.5) * (nw - 1.9) / n + rng.uniform(-0.05, 0.05)
                jar(S, jx, 2.6, sz + 0.07, rng.uniform(0.55, 0.95), rng)
        # pier between this niche and the next, with a squat barrel at its foot
        px = (i + 1) * BW
        for dx in K.wraps(px, 0.8):
            Bb = Builder(f'L0_barrel_{i}{"" if dx == 0 else ("p" if dx > 0 else "m")}', L)
            bx = px + dx
            Bb.lathe('barrel', [(0.55, 0.0), (0.68, 0.45), (0.7, 0.75), (0.66, 1.1), (0.55, 1.45)], 12, at=(bx, 1.8, 0.0), cap_top=True, smooth=True)
            for hz in (0.25, 1.2):
                Bb.lathe('hoop', [(0.66 if hz < 0.5 else 0.68, 0.0), (0.66 if hz < 0.5 else 0.68, 0.1)], 12, at=(bx, 1.75, hz), cap_top=False)
            Bb.box('barrel_dk', (bx, 1.7, 1.47), (0.9, 0.2, 0.05), bevel=0.0)
            Bb.done(period=None)
    N.done(period=None)['outline'] = 0.5
    R.done(period=None)['outline'] = 0.6
    S.done(period=None)['outline'] = 0.45
    # chili ristras hanging from the vault between the niches
    Rs = Builder('L0_ristras', L)
    for i in range(BAYS):
        x = (i + 1) * BW - 0.0
        for dx in K.wraps(x, 0.4):
            ristra(Rs, x + dx + 0.0, 2.2, 10.8 - 0.4 * (i % 2), 11 + (i % 2) * 2, rng)
    Rs.done(period=None)


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """The cellar floor: a dark-wood kerb (cap) along z = 0, then one square saltillo tile per 32-px tile with dark
    grout around it, a few chipped or two-tone, so the engine can draw the tiles in any order."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_grout', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_cap', (GP / 2, 0.1, -0.17), (GP + 1.0, 0.9, 0.3), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.04, -0.05), (GP + 1.0, 0.96, 0.07), bevel=0.0)
    B.box('g_cap_dk', (GP / 2, 0.05, -0.31), (GP + 1.0, 0.95, 0.04), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_tiles', GROUND_COLL)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN + 0.03, (col + 1) * T - CELL_MARGIN - 0.03
            z0, z1 = -row * T - CELL_MARGIN - 0.03 - (0.36 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN + 0.03
            xc, zc, w, h = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z0 - z1
            role = rng.choice(('g_tile_a', 'g_tile_b', 'g_tile_c', 'g_tile_a'))
            if rng.random() < 0.3 and row > 0:
                # a tile laid as two half-pavers
                for k in (-1, 1):
                    B.rbox(rng.choice(('g_tile_a', 'g_tile_b', 'g_tile_c')), (xc + k * w / 4, -0.1, zc), (w / 2 - 0.05, 0.3, h), bevel=0.08, segments=2)
            else:
                B.rbox(role, (xc, -0.1, zc), (w, 0.3, h), bevel=0.1, segments=2)
                if rng.random() < 0.5:
                    B.sphere('g_tile_hi', (xc - w * 0.22, -0.27, zc + h * 0.22), 0.07, scale=(1.6, 0.4, 1.0), subdiv=1)
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
