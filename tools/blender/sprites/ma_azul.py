# Morocco (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `ma_azul`: "Chefchaouen Blue" (5-3, PHASE level).
# Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this atlas's name.
#   L0  (base 300, f 0.04): the green Rif mountains, two ridges, a scatter of tiny blue houses on the lower slope
#   L1  (base 352, f 0.2):  the blue medina: stepped blue-washed houses with darker blue doors and window frames,
#       blue stairs between them, rows of painted flower pots on the walls, a hanging lantern or two (unlit by day)
#   ground: blue-washed plaster steps: a white-blue kerb cap over pale blue cobbles set in lighter mortar
# The night variant (V `ma_azul_night`) reuses these builders with a night palette (ma_azul_night.py); parts
# that light up at night use roles whose name contains 'glow' (unlit), coloured dark by day.
import math, random
import ma_kit as K
from ma_kit import P, Builder, plain, peak, ridge_slab, periodic_profile, hs_arch, lantern, _split

MODULE = 'ma_azul'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 352}
SKY = ['#3a8ae8', '#a8d8ff', '#f4fbff']
PALETTE = {
    'rif': '#6a9a6a', 'rif_sh': '#5a8a60', 'rif2': '#7aa874', 'rif2_sh': '#68966a', 'rif_plain': '#6a9a6a',
    'fhouse': '#9ac4ec', 'fhouse2': '#c8e0f8',
    'blue1': '#5a9ae0', 'blue2': '#7ab4ec', 'blue3': '#a8d0f4', 'blue4': '#4a86d0', 'white': '#eef6ff', 'trim': '#2a5aa8',
    'door': '#1e4a8a', 'win_glow': '#2a5a9a', 'stair': '#8ac0f0', 'stair2': '#6aa8e4',
    'pot_r': '#e8503a', 'pot_y': '#f0c040', 'pot_g': '#3aa86a', 'pot_p': '#e86aa8', 'leaf': '#3a8a3a', 'bloom': '#ff5a6a', 'bloom2': '#ffffff',
    'brass': '#c8a03a', 'pane_glow': '#3a6aa8', 'wire': '#2a3a5a', 'plain2': '#7ab0e4',
    'g_cap': '#eef6ff', 'g_cap_hi': '#ffffff', 'g_dirt': '#bcd8f4', 'g_dirt2': '#9cc4ec', 'g_rock': '#7ab0e8',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'rif_plain', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    z1 = periodic_profile(rng, 4.0, 1.6, waves=((2, 1.0), (3, 0.6), (7, 0.2)))
    ridge_slab(L, 'L0_rif', 'rif', z1, y=3.0, shade='rif_sh', shade_depth=0.6)
    z2 = periodic_profile(rng, 1.8, 0.8, waves=((3, 1.0), (5, 0.5), (9, 0.15)))
    ridge_slab(L, 'L0_rif2', 'rif2', z2, y=1.5, shade='rif2_sh', shade_depth=0.9)
    B = Builder('L0_houses', L)
    for k in range(26):
        x = rng.uniform(0.5, P - 0.5)
        z = z2(x) - rng.uniform(0.3, 1.2)
        w, h = rng.uniform(0.35, 0.6), rng.uniform(0.3, 0.5)
        B.box(rng.choice(('fhouse', 'fhouse2', 'fhouse')), (x, 0.8, z + h / 2), (w, 0.3, h), bevel=0.0)
    B.done()


def blue_house(B, x0, x1, y, h, rng, role):
    w, xc = x1 - x0, (x0 + x1) / 2
    B.box(role, (xc, y, h / 2 - 0.1), (w - 0.05, 2.0, h + 0.2), bevel=0.04)
    B.box('white', (xc, y - 0.04, h + 0.08), (w - 0.02, 2.06, 0.16), bevel=0.0)
    if w > 1.6 and rng.random() < 0.8:
        dx = x0 + w * rng.uniform(0.3, 0.7)
        hs_arch(B, 'trim', (dx, y - 1.04, 0.0), 0.9, 1.75, 0.06)
        hs_arch(B, 'door', (dx, y - 1.06, 0.0), 0.72, 1.6, 0.06)
    nw = 1 if w < 2.4 else 2
    for k in range(nw):
        wx = x0 + w * (k + 1) / (nw + 1)
        wz = rng.uniform(2.2, max(2.3, h - 0.9))
        if wz + 0.4 < h:
            B.box('trim', (wx, y - 1.03, wz + 0.25), (0.58, 0.05, 0.72), bevel=0.0)
            hs_arch(B, 'win_glow', (wx, y - 1.06, wz), 0.42, 0.6, 0.05)
    # painted flower pots in a row on the wall
    if rng.random() < 0.7:
        pz = rng.uniform(1.4, min(2.0, h - 0.6))
        n = int((w - 0.4) / 0.42)
        for k in range(n):
            px = x0 + 0.3 + k * 0.42
            if abs(px - (x0 + w / 2)) < 0.1:
                continue
            B.lathe(rng.choice(('pot_r', 'pot_y', 'pot_g', 'pot_p')), [(0.1, 0.0), (0.15, 0.2), (0.16, 0.24)], 8, at=(px, y - 1.12, pz), cap_top=True, cap_bottom=True)
            B.sphere('leaf', (px, y - 1.14, pz + 0.3), 0.14, scale=(1.3, 0.6, 0.8), subdiv=1)
            B.sphere(rng.choice(('bloom', 'bloom2')), (px + 0.05, y - 1.22, pz + 0.36), 0.06, subdiv=1)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'plain2', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    B = Builder('L1_back', L)
    edges = _split(0, P, 10, rng, jitter=0.35)
    for a, b in zip(edges, edges[1:]):
        blue_house(B, a, b, 2.6, rng.uniform(4.4, 6.4), rng, rng.choice(('blue3', 'blue2')))
    B.done(period=None)
    F = Builder('L1_front', L)
    edges = _split(0, P, 9, rng, jitter=0.4)
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        if i % 3 == 1:
            # a blue stair climbing between the houses
            w = b - a
            n = 8
            for k in range(n):
                F.box('stair' if k % 2 else 'stair2', (a + w * 0.5, 0.6 - k * 0.0, k * 0.36 + 0.18), (w - 0.3, 1.2 - k * 0.08, 0.36), bevel=0.0)
            continue
        blue_house(F, a, b, 0.9, rng.uniform(2.8, 4.2), rng, rng.choice(('blue1', 'blue4', 'blue2')))
    F.done(period=None)
    W = Builder('L1_lanterns', L)
    for k in range(3):
        x = (k + 0.5) * P / 3 + rng.uniform(-1, 1)
        lantern(W, x, -0.3, rng.uniform(3.0, 3.4), 0.55, 'brass', 'pane_glow', wire='wire')
    W.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts=None, stone_p=0.75, patch_p=0.1)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
