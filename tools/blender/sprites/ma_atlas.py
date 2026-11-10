# Morocco 5-3 "Atlas Kasbah": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  maAtlas (base 330, f 0.03): the snowy High Atlas, faceted lavender peaks with jagged snow caps, a lower
#       blue-grey foothill ridge in front
#   L1  maKasbah (base 360, f 0.1): a red-earth kasbah on its hill: tapering crenellated towers with carved
#       diamond friezes, a long curtain wall, small dark windows, palms and almond trees in blossom at its foot
#   ground: the engine's 'grass' style: a green turf cap with blades over red Atlas earth with stones
# Contract and helpers: see ma_kit.py / ma_souk.py (period P, ground row = BASES[layer], y within +-6).
import math, random
import ma_kit as K
from ma_kit import P, Builder, plain, peak, ridge_slab, periodic_profile, hs_arch

MODULE = 'ma_atlas'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 360}
SKY = ['#3a7ad8', '#a0d0ff', '#ffffff']
PALETTE = {
    'mtn_a': '#9090b8', 'mtn_b': '#8a8ab0', 'mtn_c': '#7e7ea6', 'mtn_snow': '#f8faff', 'mtn_plain': '#8484aa',
    'foot': '#7a8aa8', 'foot_sh': '#6a7898',
    'hill': '#b87048', 'hill_sh': '#a05e3a',
    'kas': '#c8784a', 'kas2': '#d4865a', 'kas3': '#b86a40', 'kas_dk': '#7a3e24', 'kas_hi': '#e09a6a', 'win': '#4a2418',
    'door': '#5a2e1c', 'palm': '#3a8a3a', 'palm_dk': '#2a6a2e', 'trunk': '#7a5a3a', 'blossom': '#f4b8c8', 'blossom2': '#fcd8e0',
    'branch': '#6a4a32', 'field': '#7aa84a',
    'g_cap': '#7aa84a', 'g_cap_hi': '#a8d070', 'g_blade': '#6a9a3e', 'g_dirt': '#b8704a', 'g_dirt2': '#9a5634', 'g_rock': '#c8805a',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'mtn_plain', y=4.0, depth=4.0, top=0.0, bottom=-3.0)
    xs = [1.5, 7.0, 12.5, 18.5, 24.0, 30.0, 35.5]
    for i, x in enumerate(xs):
        x += rng.uniform(-0.6, 0.6)
        peak(L, f'L0_peak_{i}', x, 3.2, rng.uniform(4.2, 5.6), rng.uniform(5.8, 7.6), ('mtn_a', 'mtn_b', 'mtn_c')[i % 3],
             rng.choice((6, 7, 8)), rng, snow='mtn_snow', snow_from=rng.uniform(0.5, 0.6))
    zf = periodic_profile(rng, 1.0, 0.6, waves=((4, 1.0), (6, 0.5), (11, 0.2)))
    ridge_slab(L, 'L0_foot', 'foot', zf, y=0.5, shade='foot_sh', shade_depth=1.0)


def tower(B, x, y, z0, w, h, rng, role='kas'):
    """A tapering kasbah tower: a battered shaft, a carved diamond frieze near the top, crenellated corners."""
    taper = 0.12
    prof = [(w / 2, 0.0), (w / 2 * (1 - taper), h)]
    # a square, slightly tapering shaft: a 4-sided lathe rotated 45 degrees
    B.lathe(role, [(r * 1.414, z) for r, z in prof], 4, at=(x, y, z0), phase=math.pi / 4, cap_top=True, cap_bottom=True)
    wt = w * (1 - taper)
    B.box('kas_hi', (x, y - wt / 2 - 0.02, z0 + h - 0.12), (wt + 0.04, 0.06, 0.18), bevel=0.0)
    # carved frieze: a row of small dark diamonds and a zig-zag band
    n = 3 if w < 1.6 else 4
    for k in range(n):
        dx = -wt / 2 + (k + 0.5) * wt / n
        B.box('kas_dk', (x + dx, y - wt / 2 - 0.03, z0 + h - 0.62), (0.18, 0.04, 0.18), bevel=0.0, rot=(0, math.pi / 4, 0))
        B.box('kas_dk', (x + dx, y - wt / 2 - 0.03, z0 + h - 1.0), (0.09, 0.04, 0.32), bevel=0.0)
    # merlons at the four corners
    for sx in (-1, 0, 1):
        mx = x + sx * (wt / 2 - 0.18)
        B.box(role, (mx, y - wt / 2 + 0.2, z0 + h + 0.22), (0.36, 0.4, 0.44), bevel=0.0)          # stepped merlons
        B.box(role, (mx, y - wt / 2 + 0.2, z0 + h + 0.5), (0.2, 0.3, 0.16), bevel=0.0)
    # small windows down the shaft
    for k in range(rng.choice((2, 3))):
        B.box('win', (x + rng.uniform(-0.2, 0.2) * w, y - w / 2 - 0.01, z0 + h * (0.3 + 0.18 * k)), (0.16, 0.06, 0.3), bevel=0.0)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'hill', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    # the hill the kasbah stands on
    zh = periodic_profile(rng, 1.1, 0.7, waves=((2, 1.0), (3, 0.5), (7, 0.15)))
    ridge_slab(L, 'L1_hill', 'hill', zh, y=2.0, shade='hill_sh', shade_depth=0.8)
    B = Builder('L1_kasbah', L)
    # two kasbahs per period, each: a curtain wall with a gate and 3-4 towers of mixed heights
    for kx in (8.0 + rng.uniform(-1, 1), 26.5 + rng.uniform(-1, 1)):
        zb = zh(kx) - 0.4
        span = rng.uniform(9.0, 10.5)
        x0 = kx - span / 2
        wall_h = rng.uniform(2.4, 2.9)
        B.box('kas3', (kx, 1.2, zb + wall_h / 2), (span, 1.6, wall_h), bevel=0.0)
        # crenellation along the wall top
        m = int(span / 0.55)
        for k in range(m):
            B.box('kas3', (x0 + (k + 0.5) * span / m, 0.5, zb + wall_h + 0.15), (0.3, 0.3, 0.3), bevel=0.0)
        hs_arch(B, 'door', (kx + rng.uniform(-1, 1), 0.38, zb), 0.9, 1.6, 0.1)
        # houses behind the wall
        for k in range(3):
            hx = x0 + span * (0.2 + 0.3 * k) + rng.uniform(-0.4, 0.4)
            hh = wall_h + rng.uniform(0.8, 1.6)
            B.box('kas2', (hx, 1.8, zb + hh / 2), (rng.uniform(1.8, 2.4), 1.6, hh), bevel=0.0)
            B.box('win', (hx + rng.uniform(-0.4, 0.4), 0.99, zb + hh - 0.6), (0.18, 0.06, 0.3), bevel=0.0)
        # towers at the ends and one or two inside
        txs = [x0, x0 + span * rng.uniform(0.35, 0.45), x0 + span]
        if rng.random() < 0.6:
            txs.append(x0 + span * rng.uniform(0.62, 0.75))
        for i, tx in enumerate(txs):
            w = rng.uniform(1.5, 1.9)
            h = rng.uniform(3.8, 5.4) if i != 1 else rng.uniform(5.0, 6.0)
            tower(B, tx, 0.2 + (i % 2) * 0.6, zb, w, h, rng, role=('kas', 'kas2')[i % 2])
    B.done()
    # palms and almond trees in blossom along the foot of the hill
    T = Builder('L1_trees', L)
    for x in (2.0, 4.0, 14.5, 17.5, 20.0, 33.0, 35.0):
        x += rng.uniform(-0.5, 0.5)
        z = zh(x) - 0.6
        if rng.random() < 0.55:
            h = rng.uniform(2.6, 3.4)
            lean = rng.uniform(-0.25, 0.25)
            top = (x + lean, -1.0, z + h)
            T.rod('trunk', (x, -1.0, z), top, 0.11, segs=6, r2=0.08)
            for k in range(7):
                a = -math.pi + k * math.pi / 6
                T.sphere('palm' if k % 2 else 'palm_dk', (top[0] + math.cos(a) * 0.6, -1.05, top[2] + math.sin(a) * 0.32 + 0.05), 0.42,
                         scale=(1.5, 0.35, 0.32), rot=(0, -a * 0.6, 0), subdiv=1)
        else:
            T.rod('branch', (x, -0.9, z), (x, -0.9, z + 1.0), 0.09, segs=5)
            T.rod('branch', (x, -0.9, z + 0.8), (x - 0.4, -0.9, z + 1.4), 0.05, segs=4)
            T.rod('branch', (x, -0.9, z + 0.8), (x + 0.45, -0.9, z + 1.35), 0.05, segs=4)
            for k in range(5):
                T.sphere('blossom' if k % 2 else 'blossom2', (x + rng.uniform(-0.7, 0.7), -1.0, z + 1.5 + rng.uniform(-0.25, 0.3)), rng.uniform(0.35, 0.5), scale=(1.2, 0.6, 0.9), subdiv=1)
    T.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.45, patch_p=0.25)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
