# Mozambique 4-3 "The Great Baobab", a SECOND parallax layer rendered as its own atlas `mz_baobab_near` (strip 'L1'),
# for depth. Not wired yet: add to theme mz_baobab in src/29_tour_mz.js, after its L0 entry,
#   { kind: 'image', atlas: 'mz_baobab_near', id: 'L1', base: 365, f: 0.22, color: '#b8883a', fallback: <a mzSavanna layer> }
# (or a plain { kind: 'mzSavanna', color: '#b8883a', base: 365, f: 0.22 } layer plus that image swap).
#   L1  (base 365, f 0.22): the near savanna edge: a bank of golden grass in tufts, two umbrella acacias, a squat young
#       baobab, a termite spire and a weaver-bird colony (woven ball nests) hanging from a dead branch; calm values
#       a step darker than L0 so the climb stays on top; no ink on the grass
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU

MODULE = 'mz_baobab_near'
LAYERS = ['L1']
BASES = {'L1': 365}
SKY = ['#3a9ae8', '#a8d8ff', '#fff4d8']
PALETTE = {
    'bank': '#b8883a', 'bank2': '#a87a32', 'grass': '#d0a048', 'grass2': '#c09040', 'trunk': '#6e4e26', 'crown': '#7a7a30',
    'crown2': '#8a8a3a', 'baobab': '#8a6a3e', 'mound': '#a86a34', 'branch': '#5e4224', 'nest': '#c8b070', 'nest2': '#b09858',
}
K.use(MODULE, PALETTE, LAYERS)


def acacia(B, x, h, y, rng):
    B.rod('trunk', (x, y, -0.2), (x + 0.3, y, h * 0.7), 0.14, segs=5, r2=0.09)
    B.rod('trunk', (x + 0.3, y, h * 0.7), (x - 0.5, y, h * 0.85), 0.07, segs=4)
    B.rod('trunk', (x + 0.3, y, h * 0.7), (x + 1.0, y, h * 0.88), 0.07, segs=4)
    for k in range(5):
        B.sphere(('crown', 'crown2')[k % 2], (x + 0.25 + (k - 2) * 0.6, y - 0.1, h * 0.92 + 0.08 * (k % 2)), 0.55, scale=(1.4, 0.6, 0.38), subdiv=2)


def build_L1(rng):
    L = 'L1'
    zf = periodic_profile(rng, 0.35, 0.25, waves=((2, 1.0), (5, 0.4)))
    ridge_slab(L, 'L1_bank', 'bank', zf, y=2.0, depth=1.0, bottom=-4.0, outline=0.5)
    T = Builder('L1_tufts', L)
    for k in range(40):
        x = rng.uniform(0, P)
        for dx in wraps(x, 0.3):
            for j in range(3):
                h = rng.uniform(0.35, 0.6)
                T.slab(('grass', 'grass2')[(k + j) % 2], [(-0.05, 0.0), (0.05, 0.0), (0.04 + (j - 1) * 0.12, h), (0.0 + (j - 1) * 0.12, h)], 0.03, at=(x + dx + j * 0.08, 1.6, zf(x) - 0.08))
    T.done(period=None)['outline'] = 0
    B = Builder('L1_trees', L)
    for x, h in ((P * 0.15, 4.2), (P * 0.62, 3.6)):
        for dx in wraps(x, 2.0):
            acacia(B, x + dx, h, 1.4, rng)
    bx = P * 0.4
    for dx in wraps(bx, 1.6):
        B.lathe('baobab', [(0.9, -0.3), (1.0, 0.6), (0.85, 1.4), (0.5, 2.0), (0.42, 2.3)], 9, at=(bx + dx, 1.3, zf(bx) - 0.2), smooth=True)
        for k in range(5):
            a = -0.9 + 0.45 * k
            B.rod('branch', (bx + dx, 1.25, 2.2), (bx + dx + math.sin(a) * 1.0, 1.25, 2.2 + math.cos(a) * 0.8), 0.09, segs=4, r2=0.04)
    mx = P * 0.82
    for dx in wraps(mx, 0.8):
        B.lathe('mound', [(0.7, -0.2), (0.55, 0.8), (0.3, 1.8), (0.12, 2.5), (0.0, 2.6)], 7, at=(mx + dx, 1.4, zf(mx) - 0.2), smooth=False)
    # a dead branch with a weaver colony hanging from it
    wx = P * 0.95
    for dx in wraps(wx, 2.2):
        B.rod('branch', (wx + dx - 1.4, 1.2, 0.0), (wx + dx - 0.6, 1.2, 2.6), 0.12, segs=5, r2=0.08)
        B.rod('branch', (wx + dx - 0.6, 1.2, 2.6), (wx + dx + 1.6, 1.2, 3.1), 0.07, segs=4, r2=0.04)
        for k in range(4):
            nx = wx + dx - 0.3 + 0.5 * k
            nz = 2.6 + 0.12 * k
            B.rod('branch', (nx, 1.15, nz + 0.1), (nx, 1.15, nz - 0.25), 0.015, segs=3)
            B.sphere(('nest', 'nest2')[k % 2], (nx, 1.1, nz - 0.45), 0.2, scale=(1.0, 0.8, 1.15), subdiv=2)
    B.done(period=None)['outline'] = 0.6


BUILDERS = {'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
