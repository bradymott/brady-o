# Vietnam 10-3 "Hoi An Lantern River": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  vnOldTown (base 316, f 0.1, night, dyn vnLanterns): the old merchant houses across the river: ochre walls,
#       dark tiled roofs with curled ends, warm lit windows and doorways (unlit, they glow), a row of silk lanterns
#       under each eave (the swaying lantern strings are code-drawn on top)
#   L1  vnRiverBg (base 322, f 0.14, dyn vnFloaters): the dark river from the far bank down, long coloured lantern
#       reflections shimmering on it (no ink: water)
#   ground: the engine's 'vnRiverStone' style: worn river cobbles under a stone kerb
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain

MODULE = 'vn_river'
LAYERS = ['L0', 'L1']
BASES = {'L0': 316, 'L1': 322}
SKY = ['#0c0a24', '#24183e', '#4a2a4a']
LANT = ['lant_r', 'lant_o', 'lant_p', 'lant_y', 'lant_g', 'lant_b']
PALETTE = {
    'wall': '#c8943a', 'wall2': '#b8843a', 'wall3': '#d4a24a', 'roof': '#5a3a2a', 'roof2': '#4a2e22', 'tile': '#6e4a36',
    'beam': '#4a2a1a', 'shutter': '#3a5a4a', 'win_glow': '#ffcf7a', 'door_glow': '#ffb860',
    'lant_r_glow': '#ff4a3a', 'lant_o_glow': '#ffa02a', 'lant_p_glow': '#ff6a9a', 'lant_y_glow': '#ffd23a', 'lant_g_glow': '#3ac87a', 'lant_b_glow': '#5a8aff',
    'cap': '#2a1a10',
    'river': '#1e3050', 'river2': '#172640', 'river3': '#101c30', 'refl_r_glow': '#8a3a3a', 'refl_y_glow': '#8a6a2a', 'refl_g_glow': '#2a6a4a',
    # ground (river cobbles)
    'g_cap': '#8a7a5a', 'g_cap_hi': '#c8b88a', 'g_dirt': '#4a3e2c', 'g_dirt2': '#3a3020', 'g_rock': '#8a7a60',
}
for k in LANT:
    PALETTE[k + 'glow'] = PALETTE[k + '_glow']
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def house(B, G, x, w, rng):
    h = rng.uniform(2.2, 3.4)
    B.box(rng.choice(('wall', 'wall2', 'wall3')), (x + w / 2, 0.6, h / 2 - 0.5), (w - 0.1, 0.8, h + 1.0), bevel=0.0)
    # a dark tiled roof with curled-up ends
    B.slab('roof', [(x - 0.35, h - 0.1), (x + w + 0.35, h - 0.1), (x + w - 0.3, h + 0.6), (x + 0.3, h + 0.6)], 1.0, at=(0, -0.1, 0))
    for s, ex in ((-1, x - 0.35), (1, x + w + 0.35)):
        B.rod('roof2', (ex, -0.15, h - 0.1), (ex + s * 0.12, -0.15, h + 0.08), 0.06, segs=5)
    for k in range(int(w / 0.3)):
        tx = x + 0.1 + k * 0.3
        B.rod('tile', (tx + 0.15, -0.16, h + 0.55), (tx - 0.02, -0.16, h - 0.05), 0.035, segs=4)
    B.box('beam', (x + w / 2, 0.15, 1.0), (w - 0.1, 0.4, 0.12), bevel=0.0)
    # windows upstairs (lit or shuttered), a lit doorway below the beam
    n = max(1, int(w / 1.0))
    for k in range(n):
        wx = x + (k + 0.5) * w / n
        if rng.random() < 0.65:
            G.box('win_glow', (wx, 0.15, h - 1.1), (0.42, 0.06, 0.55), bevel=0.0)
            B.box('beam', (wx, 0.1, h - 1.1), (0.05, 0.06, 0.55), bevel=0.0)
        else:
            B.box('shutter', (wx, 0.15, h - 1.1), (0.46, 0.06, 0.58), bevel=0.0)
    G.box('door_glow', (x + w / 2, 0.15, 0.4), (min(0.9, w * 0.4), 0.06, 0.8), bevel=0.0)
    # silk lanterns hanging under the eave
    for k in range(int(w / 0.55)):
        lx = x + 0.3 + k * 0.55
        lz = h - 0.45
        G.sphere(rng.choice(LANT) + 'glow', (lx, -0.3, lz), 0.15, scale=(1.0, 1.0, 0.9), subdiv=2)
        B.box('cap', (lx, -0.3, lz + 0.16), (0.12, 0.12, 0.04), bevel=0.0)
        B.box('cap', (lx, -0.3, lz - 0.16), (0.12, 0.12, 0.04), bevel=0.0)


def build_L0(rng):
    L = 'L0'
    B = Builder('L0_houses', L)
    G = Builder('L0_lights', L)
    x = 0.0
    while x < P - 0.8:
        w = min(P - x, rng.uniform(2.4, 4.2))
        house(B, G, x, w, rng)
        x += w + 0.14
    B.done(period=None)['outline'] = 0.7
    G.done(period=None)['outline'] = 0.35


def build_L1(rng):
    L = 'L1'
    W = Builder('L1_river', L)
    W.box('river', (P / 2, 1.0, -0.5), (P + 2.0, 1.0, 1.0), bevel=0.0)
    W.box('river2', (P / 2, 1.05, -2.2), (P + 2.0, 1.0, 2.4), bevel=0.0)
    W.box('river3', (P / 2, 1.1, -9.0), (P + 2.0, 1.0, 11.0), bevel=0.0)
    W.done(period=None)
    R = Builder('L1_reflections', L)
    for k in range(70):
        x = rng.uniform(0, P)
        z = -rng.uniform(0.1, 2.4)
        R.box(rng.choice(('refl_r_glow', 'refl_y_glow', 'refl_g_glow')), (x, 0.5, z), (rng.uniform(0.06, 0.12), 0.05, rng.uniform(0.2, 0.55)), bevel=0.0)
    R.done()
    for o in K.COLL[L].objects:
        o['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.7, patch_p=0.15)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
