# Spain (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `es_teide`: "Teide Updrafts" (6-4, GLIDE, Canary Islands).
# Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this atlas's name.
# Original art: a great volcano over a lava plain, in the islands' clear light.
#   L0  (base 300, f 0.03): the volcano: a broad cone banded in ochre and rust with a small summit cone, a collar of
#       cloud around its waist, the sea's blue line at its foot
#   L1  (base 360, f 0.15): the lava field: black and rust rock mounds, dragon trees (thick trunks forking into
#       umbrella crowns), slim Canary pines, red flower spikes
#   ground: volcanic rock: a dark basalt cap with pale pumice crumbs over rust-black lava plates
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_teide'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 360}
SKY = ['#2a7ae0', '#8ac8ff', '#f0f8ff']
PALETTE = {
    'sea': '#3a8ad0', 'vol': '#b8784a', 'vol2': '#a4683e', 'vol3': '#c88c5a', 'vol_top': '#8a5a3a', 'snow': '#f4f4f8', 'cloud': '#ffffff', 'cloud2': '#eef2fa',
    'lava': '#3a3238', 'lava2': '#4a3a3a', 'rust': '#8a4a32', 'drago': '#8a8a6a', 'drago_leaf': '#4a8a4a', 'drago_leaf2': '#3a7a40',
    'pine': '#3a6a3a', 'pine2': '#2e5a32', 'pine_trunk': '#6a4a32', 'flower': '#d83a3a', 'flower2': '#ff6a5a', 'fill': '#3a3238',
    'g_cap': '#4a4448', 'g_cap_hi': '#8a8288', 'g_plate': '#2e282c', 'g_plate2': '#5a3a30', 'g_mortar': '#6a5a54',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def build_L0(rng):
    L = 'L0'
    K.fill_below(TH, L, 'sea', top=0.3, depth=3.0, y=6.0)
    cx = P * 0.55
    B = Builder('L0_volcano', L, TH)
    # the cone as stacked bands (wide base to a small summit cone)
    bands = [(13.0, 0.0, 'vol'), (10.0, 2.0, 'vol2'), (7.0, 3.8, 'vol3'), (4.2, 5.4, 'vol2'), (2.2, 6.8, 'vol_top')]
    for (w, z, role), nxt in zip(bands, bands[1:] + [(0.6, 7.9, None)]):
        B.slab(role, [(-w, z), (w, z), (nxt[0], nxt[1]), (-nxt[0], nxt[1])], 1.0, at=(cx, 4.0 - z * 0.05, 0))
    B.slab('snow', [(-0.9, 7.5), (0.9, 7.5), (0.6, 7.9), (0.3, 7.7), (0.0, 7.95), (-0.4, 7.7), (-0.6, 7.9)], 0.6, at=(cx, 3.4, 0))
    # foothills to the sides so the period tiles
    zf = K.periodic_fn(rng, 0.4, 1.6, 4)
    B.done(period=None)
    K.ridge_slab(TH, L, 'L0_foot', zf, 'vol2', y=4.6, depth=0.8, zb=-2.5)
    C = Builder('L0_cloud', L, TH)
    for k in range(9):
        x = cx - 7.0 + k * 1.75 + rng.uniform(-0.3, 0.3)
        C.sphere('cloud' if k % 2 else 'cloud2', (x, 3.0, 3.2 + rng.uniform(-0.2, 0.3)), rng.uniform(0.8, 1.1), scale=(1.5, 0.6, 0.55), subdiv=2)
    C.done()


def drago(B, x, y, z, s, rng):
    """A dragon tree: a thick grey trunk forking into many branches, each topped with a spiky green tuft."""
    top = (x, y, z + 1.6 * s)
    B.rod('drago', (x, y, z), top, 0.28 * s, segs=7, r2=0.22 * s)
    tips = []
    for k in range(6):
        a = math.radians(30 + 120 * k / 5)
        tip = (top[0] + math.cos(a) * 1.3 * s, y, top[2] + math.sin(a) * 0.9 * s + 0.2 * s)
        B.rod('drago', top, tip, 0.12 * s, segs=5, r2=0.08 * s)
        tips.append(tip)
    for k, t in enumerate(tips):
        for j in range(5):
            a = math.radians(20 + 35 * j)
            B.rod('drago_leaf' if (j + k) % 2 else 'drago_leaf2', t, (t[0] + math.cos(a) * 0.55 * s, y - 0.05, t[2] + math.sin(a) * 0.4 * s), 0.06 * s, segs=3, r2=0.01)


def pine(B, x, y, z, s):
    B.rod('pine_trunk', (x, y, z), (x, y, z + 3.2 * s), 0.08 * s, segs=5)
    for k in range(4):
        zz = z + (1.2 + k * 0.6) * s
        r = (0.9 - k * 0.18) * s
        B.sphere('pine' if k % 2 else 'pine2', (x, y - 0.05, zz), r, scale=(1.3, 0.6, 0.45), subdiv=1)


def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'fill', top=0.2, depth=3.0, y=3.0)
    zf = K.periodic_fn(rng, 0.3, 1.4, 4)
    K.ridge_slab(TH, L, 'L1_lava', zf, 'lava', y=2.0, depth=1.0, zb=-2.5)
    R = Builder('L1_rocks', L, TH)
    for x in K.jittered(rng, 12, 0.4):
        w, h = rng.uniform(0.8, 2.0), rng.uniform(0.5, 1.2)
        for dx in K.wraps(x, w):
            R.rbox(rng.choice(('lava', 'lava2', 'rust')), (x + dx, rng.uniform(0.6, 1.4), zf(x) - h * 0.2), (w, 0.8, h), bevel=0.25, segments=2, rot=(0, rng.uniform(-0.3, 0.3), 0))
    R.done(period=None)
    T = Builder('L1_trees', L, TH)
    for x in (4.0, 21.0):
        drago(T, x, 0.2, zf(x) - 0.2, rng.uniform(1.4, 1.7), rng)
    for x in (9.5, 11.0, 27.0, 31.5, 33.0):
        pine(T, x + rng.uniform(-0.3, 0.3), 1.0, zf(x) - 0.2, rng.uniform(1.0, 1.3))
    for x in (6.5, 15.5, 17.0, 24.5, 35.0):
        z = zf(x) - 0.1
        T.lathe('flower', [(0.14, 0.0), (0.11, 0.6), (0.0, 1.6)], 8, at=(x, -0.4, z), cap_bottom=True)
        T.lathe('flower2', [(0.1, 0.5), (0.0, 1.3)], 8, at=(x, -0.48, z), cap_bottom=True)
    T.done()


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    """Basalt floor: a dark cap with pale pumice crumbs, rust-black lava plates below (the marble layout)."""
    return K.marble_ground(TH, random.Random(seed), {'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'seam': 'g_plate', 'slab': 'g_plate',
                                                     'slab2': 'g_plate2', 'mortar': 'g_mortar', 'vein': 'g_cap_hi'})


def clear():
    TH.clear()


if __name__ == '__main__':
    K.preview(TH, build, build_ground)
