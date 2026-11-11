# Mozambique 4-4 "Turtle Beach", a SECOND parallax layer rendered as its own atlas `mz_beach_near` (strip 'L1'), for
# depth. Not wired yet: add to theme mz_beach in src/29_tour_mz.js, after its L0 entry,
#   { kind: 'image', atlas: 'mz_beach_near', id: 'L1', base: 360, f: 0.2, color: '#0a1a30', fallback: <an mzNightSea layer> }
#   L1  (base 360, f 0.2): the near shore at night: a dark dune line with tufts of beach grass, coconut palms in deep
#       navy silhouette, a beached dhow on its side, two fishermen's huts with warm lantern windows (unlit glow) and a
#       scatter of glowing plankton along the wet sand; dark and calm so the turtles and crabs stay on top
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU

MODULE = 'mz_beach_near'
LAYERS = ['L1']
BASES = {'L1': 360}
SKY = ['#040814', '#0a1a34', '#1a3050']
PALETTE = {
    'dune': '#0e1c30', 'dune2': '#122238', 'grass': '#16283e', 'palm': '#0a1626', 'frond': '#0e2032', 'hull': '#1a2232', 'sail': '#2a3a52',
    'hut': '#1c2434', 'roof': '#141c2a', 'lamp_glow': '#ffc860', 'plankton_glow': '#5affdc', 'wet': '#163048',
}
K.use(MODULE, PALETTE, LAYERS)


def palm(B, x, h, y, rng, lean):
    pts = [(x + lean * h * (i / 5) ** 1.6, y, h * i / 5) for i in range(6)]
    for a, b in zip(pts, pts[1:]):
        B.rod('palm', a, b, 0.12, segs=5, r2=0.1)
    top = pts[-1]
    # a fan of arching fronds over the top (none pointing straight down), their tips drooping
    for k, a in enumerate((-0.25, 0.3, 0.85, 1.4, 1.95, 2.5, 3.05, 3.5)):
        c, s_ = math.cos(a), math.sin(a)
        pts = []
        for u in (0.0, 0.35, 0.7, 1.0):
            r = 1.7 * u
            pts.append((top[0] + c * r, top[2] + s_ * r - 0.9 * u * u))
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            B.rod('frond', (x0, y - 0.1, z0), (x1, y - 0.1, z1), 0.13 if x0 == pts[0][0] else 0.1, segs=4, r2=0.06)


def build_L1(rng):
    L = 'L1'
    zf = periodic_profile(rng, 0.3, 0.3, waves=((2, 1.0), (4, 0.5), (9, 0.15)))
    ridge_slab(L, 'L1_dune', 'dune', zf, y=2.0, depth=1.0, bottom=-4.0, outline=0.4)
    W = Builder('L1_wet', L)
    W.box('wet', (P / 2, 1.5, -1.2), (P + 2.0, 0.1, 0.6), bevel=0.0)
    for k in range(30):
        x = rng.uniform(0, P)
        for dx in wraps(x, 0.2):
            W.sphere('plankton_glow', (x + dx, 1.4, -0.9 - rng.uniform(0, 0.6)), rng.uniform(0.04, 0.08), subdiv=1)
    W.done(period=None)['outline'] = 0
    T = Builder('L1_grass', L)
    for k in range(30):
        x = rng.uniform(0, P)
        for dx in wraps(x, 0.3):
            for j in range(3):
                h = rng.uniform(0.3, 0.55)
                T.slab('grass', [(-0.04, 0.0), (0.04, 0.0), (0.03 + (j - 1) * 0.14, h), ((j - 1) * 0.14, h)], 0.03, at=(x + dx + j * 0.07, 1.6, zf(x) - 0.06))
    T.done(period=None)['outline'] = 0
    B = Builder('L1_shore', L)
    G = Builder('L1_glow', L)
    for x, h, lean in ((P * 0.08, 4.4, 0.25), (P * 0.14, 3.6, -0.2), (P * 0.55, 4.8, 0.3), (P * 0.78, 4.0, -0.25)):
        for dx in wraps(x, 2.0):
            palm(B, x + dx, h, 1.4, rng, lean)
    dx0 = P * 0.33
    for dx in wraps(dx0, 2.0):
        B.slab('hull', [(-1.8, 0.0), (1.6, 0.0), (2.0, 0.7), (-1.9, 0.5)], 0.9, at=(dx0 + dx, 1.2, zf(dx0) - 0.1), rot=(0, 0.1, 0))
        B.rod('hull', (dx0 + dx + 0.2, 1.1, zf(dx0) + 0.5), (dx0 + dx + 1.4, 1.1, zf(dx0) + 2.2), 0.05, segs=4)
        B.slab('sail', [(0.0, 0.0), (1.4, 1.8), (-0.2, 1.2)], 0.03, at=(dx0 + dx + 0.2, 1.05, zf(dx0) + 0.5))
    for hx in (P * 0.66, P * 0.92):
        for dx in wraps(hx, 1.4):
            z0 = zf(hx) - 0.1
            B.box('hut', (hx + dx, 1.4, z0 + 0.6), (1.8, 1.2, 1.2), bevel=0.04)
            B.slab('roof', [(-1.2, 0.0), (1.2, 0.0), (0.0, 0.9)], 1.4, at=(hx + dx, 0.7, z0 + 1.2))
            G.box('lamp_glow', (hx + dx - 0.35, 0.78, z0 + 0.7), (0.34, 0.04, 0.3), bevel=0.0)
            G.box('lamp_glow', (hx + dx + 0.4, 0.78, z0 + 0.7), (0.3, 0.04, 0.3), bevel=0.0)
    B.done(period=None)['outline'] = 0.5
    G.done(period=None)['outline'] = 0


BUILDERS = {'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
