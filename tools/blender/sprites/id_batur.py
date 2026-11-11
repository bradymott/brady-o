# Indonesia 9-3 "Batur Sunrise Trek": the parallax background as a toon diorama (Fiesta Toon pipeline).
# The sky changes from night to sunrise as Brady climbs (IdSunrise), so every colour here is a muted violet that
# reads as a soft silhouette against the night and as a dark one against the dawn.
#   L0  backdrop (base 0, f 0, dyn idNightSky): the procedural theme drew nothing here; now the far outer rim of the
#       caldera runs low across the bottom of the sky with a bank of cloud lying in the valley (no ink on the clouds)
#       and the top left open for the code-drawn stars and moon
#   L1  idVolcanoes (base 250, f 0.025): a tall far cone and the broad volcano with a lava glow at its vents, the
#       crater lake at its foot
#   L2  idCrater (base 330, f 0.16): the black lava field of the crater rim, glowing cracks, a few hardy pines
#   ground: the engine's 'basalt' style: rough dark lava blocks under a grey-violet crust
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_batur'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 0, 'L1': 250, 'L2': 330}
SKY = ['#05061a', '#16123a', '#2a2050']
PALETTE = {
    'rim': '#363058', 'rim_sh': '#2e2850', 'rim_far': '#40396a', 'cloud': '#5a5484', 'cloud2': '#4c4676',
    'vol': '#2c2a48', 'vol_sh': '#24223e', 'vol2': '#34304e', 'vol2_sh': '#2a2644', 'lava_glow': '#ff8a3a', 'lava2_glow': '#ffc06a',
    'lake': '#2e4470', 'lake_hi': '#5a74a0',
    'field': '#2a2232', 'field_sh': '#221a2a', 'field_hi': '#3c3044', 'crack_glow': '#ff7a2e', 'pine': '#1e2a2e', 'pine2': '#26343a',
    'pine_trunk': '#3a2a24',
    # ground (engine 'basalt' style)
    'g_cap': '#4a3e48', 'g_cap_hi': '#7a6a72', 'g_dirt': '#2e262c', 'g_dirt2': '#221a20', 'g_rock': '#4e4048',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau
Z0 = -8.6        # L0 hangs from z = 0 (the top of the screen): the rim's ground line lies this far below


def build_L0(rng):
    L = 'L0'
    zf = periodic_profile(rng, Z0 + 0.6, 0.7, waves=((2, 1.0), (3, 0.5), (7, 0.15)))
    ridge_slab(L, 'L0_far', 'rim_far', lambda x: zf(x) + 1.1 + 0.4 * math.sin(TAU * 4 * x / P), y=4.0, bottom=-17.0, outline=0.35)
    ridge_slab(L, 'L0_rim', 'rim', zf, y=2.5, bottom=-17.0, shade='rim_sh', shade_depth=0.8, outline=0.5)
    C = Builder('L0_clouds', L)
    x = 1.0
    while x < P:
        K.cloud(C, x, 1.0, Z0 - 0.4 + rng.uniform(-0.3, 0.3), rng.uniform(2.5, 4.5), rng.choice(('cloud', 'cloud2')), rng)
        x += rng.uniform(4.0, 7.0)
    C.done()
    K.no_ink(L, 'L0_clouds')


def cone_profile(x0, hw, h, crater=0.0, notch=0.0):
    def z(x):
        best = -1.0
        for dx in (-P, 0, P):
            u = abs(x - x0 - dx) / hw
            if u < 1:
                v = h * (1 - u) ** 1.45
                if u < crater:
                    v = h * (1 - crater) ** 1.45 - notch * (1 - u / crater)
                best = max(best, v)
        return best
    return z


def build_L1(rng):
    L = 'L1'
    far = cone_profile(9.0, 10.0, 6.0, 0.03, 0.12)
    ridge_slab(L, 'L1_far', 'vol', far, y=3.0, bottom=-3.0, shade='vol_sh', shade_depth=0.6, outline=0.5)
    batur = cone_profile(26.0, 9.5, 3.2, 0.16, 0.35)
    ridge_slab(L, 'L1_batur', 'vol2', batur, y=1.5, bottom=-3.0, shade='vol2_sh', shade_depth=0.7, outline=0.6)
    # thin lava trickles running down the flanks from the vents, and a small glow in the crater notch
    G = Builder('L1_lava', L)
    top = batur(26.0)
    for k, (sgn, x0, ln) in enumerate(((-1, 25.3, 0.8), (1, 26.6, 0.7), (1, 26.9, 1.0))):
        prev = None
        for j in range(7):
            x = x0 + sgn * ln * j / 6
            q = (x + 0.04 * math.sin(j * 2.1 + k), batur(x) - 0.06)
            if prev:
                G.rod('lava_glow' if j < 5 else 'lava2_glow', (prev[0], 1.2, prev[1]), (q[0], 1.2, q[1]), 0.06 - 0.005 * j, segs=4)
            prev = q
    G.sphere('lava2_glow', (26.0, 1.3, top - 0.05), 0.16, scale=(1.0, 0.4, 0.7), subdiv=1)
    G.done(period=None)['outline'] = 0
    W = Builder('L1_lake', L)
    W.sphere('lake', (31.5, 0.6, 0.0), 2.6, scale=(1.0, 0.3, 0.1), subdiv=2)
    W.box('lake_hi', (31.2, 0.2, 0.08), (2.6, 0.05, 0.04), bevel=0.0)
    W.done()
    for o in K.COLL[L].objects:
        if o.name.startswith('L1_lake'):
            o['outline'] = 0.4


def pine(B, x, z, s, rng):
    B.rod('pine_trunk', (x, 0.0, z - 0.1), (x, 0.0, z + 0.4 * s), 0.06 * s)
    for k in range(4):
        r = (0.55 - 0.1 * k) * s
        zc = z + (0.3 + 0.38 * k) * s
        B.lathe('pine' if k % 2 else 'pine2', [(r, 0.0), (0.0, 0.55 * s)], 7, at=(x, -0.02 * k, zc), yscale=0.5, cap_bottom=True)


def build_L2(rng):
    L = 'L2'
    plain(L, 'L2_plain', 'field', y=3.0, depth=2.0, top=-0.3, bottom=-4.0)
    zf = periodic_profile(rng, 1.1, 0.9, waves=((2, 1.0), (5, 0.4), (11, 0.15)))
    ridge_slab(L, 'L2_field', 'field', zf, y=1.0, bottom=-4.0, shade='field_sh', shade_depth=1.0, outline=0.7)
    R = Builder('L2_rocks', L)
    for k in range(9):
        x = (k + 0.5) * P / 9 + rng.uniform(-1, 1)
        R.rbox('field_hi', (x, 0.4, zf(x) - 0.25), (rng.uniform(0.8, 1.6), 0.8, rng.uniform(0.4, 0.7)), bevel=0.18)
    R.done()
    Cr = Builder('L2_cracks', L)
    for k in range(12):
        x = rng.uniform(0, P)
        z = zf(x) - rng.uniform(0.6, 2.4)
        for j in range(4):
            x2, z2 = x + rng.uniform(0.25, 0.5), z + rng.uniform(-0.18, 0.18)
            Cr.rod('crack_glow', (x, -0.05, z), (x2, -0.05, z2), 0.035, segs=4)
            x, z = x2, z2
    Cr.done()
    K.no_ink(L, 'L2_cracks')
    T = Builder('L2_pines', L)
    x = 2.0
    while x < P:
        pine(T, x, zf(x) - 0.1, rng.uniform(1.1, 1.7), rng)
        x += rng.uniform(4.5, 8.0)
    T.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts="nubs", stone_p=0.35, patch_p=0.35)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
