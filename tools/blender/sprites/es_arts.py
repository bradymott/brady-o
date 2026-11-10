# Spain 6-3 "City of Arts by Night" (theme es_arts): the parallax background as a Fiesta Toon diorama. Original
# art in the spirit of a futuristic white science park at night (no real building copied): a long ribbed shell
# roof, an eye-shaped dome with a glowing iris, a garden arcade of tall white ribs with palms, all standing over a
# dark reflecting pool that mirrors them; a far blue skyline with a few lit windows.
#
#   L0  esArts (base 330, #e8f0f8): the shells and ribs on the pool's edge; the pool below the ground line with
#       their darker reflections (the engine's 'pool' liquid is drawn in front, where the level has one)
#   ground: the engine's 'marble' style in moonlit white: a bright kerb over big pale slabs with cool veins
# Contract and shared toolkit: es_tomatina.py.
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_arts'
LAYERS = ['L0']
BASES = {'L0': 330}
SKY = ['#0a0e2a', '#1a2a5a', '#3a4a8a']
PALETTE = {
    'sky_city': '#24346a', 'sky_city2': '#1e2c5c', 'win_glow': '#ffd890', 'win2_glow': '#8ad8ff',
    'white': '#e8f0f8', 'white2': '#d4e0ee', 'white3': '#c4d2e4', 'rib': '#9ab0cc', 'iris_glow': '#7ad8ff', 'pupil': '#1a3a6a',
    'lamp_glow': '#bff0ff', 'palm': '#1e4a4a', 'palm2': '#173c3e', 'trunk': '#2e3a4a',
    'pool': '#123060', 'pool2': '#0e2650', 'refl': '#3a5a8e', 'refl2': '#33507f', 'edge': '#c8d6e6',
    # ground (marble, moonlit)
    'g_cap': '#f0f4f8', 'g_cap_hi': '#ffffff', 'g_seam': '#7a8aa8', 'g_slab': '#d8e0e8', 'g_slab2': '#c8d2de', 'g_mortar': '#98a4b4', 'g_vein': '#a8b8cc',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def shell(B, x0, w, h, role, rib_role, ribs=7, depth=1.0, y=0.0, flip=False):
    """A long ribbed shell roof: a lopsided crescent (low at one end, high and overhanging at the other) with
    radiating rib lines. Returns the outline points (for the reflection)."""
    pts = []
    n = 24
    for k in range(n + 1):
        u = k / n
        z = h * (math.sin(math.pi * u ** 0.8) ** 0.9) * (0.55 + 0.45 * u)
        pts.append((x0 + w * u, z))
    lower = []
    for k in range(n, -1, -1):
        u = k / n
        z = h * 0.45 * (math.sin(math.pi * u ** 0.8) ** 1.4) * (0.4 + 0.6 * u)
        lower.append((x0 + w * u, z))
    poly = [(x0, 0.0)] + pts[1:] + lower[:-1]
    if flip:
        cx = x0 + w / 2
        poly = [(2 * cx - px, pz) for px, pz in poly]
    B.slab(role, poly, depth, at=(0, y, 0))
    for k in range(1, ribs):
        u = k / ribs
        top = pts[int(u * n)]
        bot = lower[n - int(u * n)]
        if flip:
            top, bot = (2 * (x0 + w / 2) - top[0], top[1]), (2 * (x0 + w / 2) - bot[0], bot[1])
        B.rod(rib_role, (bot[0], y - 0.05, bot[1] + 0.1), (top[0] - (0.25 if not flip else -0.25), y - 0.05, top[1] - 0.12), 0.06, segs=4)
    return poly


def eye_dome(B, xc, w, h, y=0.0):
    """An eye-shaped dome: a white lens with upper and lower 'lids' and a glowing iris and pupil."""
    n = 24
    lens = [(xc + w / 2 * math.cos(math.pi * k / n), h * math.sin(math.pi * k / n)) for k in range(n + 1)]
    B.slab('white2', [(xc - w / 2, 0.0)] + lens[::-1][1:-1] + [(xc + w / 2, 0.0)], 1.2, at=(0, y, 0))
    lid = [(xc + w / 2 * 1.04 * math.cos(math.pi * k / n), h * 1.12 * math.sin(math.pi * k / n)) for k in range(n + 1)]
    inner = [(xc + w / 2 * 0.9 * math.cos(math.pi * k / n), h * 0.98 * math.sin(math.pi * k / n)) for k in range(n + 1)]
    B.slab('white', [p for p in lid] + inner[::-1], 0.6, at=(0, y - 0.5, 0))
    B.disc('iris_glow', (xc, y - 0.7, h * 0.42), h * 0.36, 0.1, segs=20)
    B.disc('pupil', (xc, y - 0.8, h * 0.42), h * 0.16, 0.1, segs=16)
    B.box('white', (xc, y - 0.6, 0.12), (w * 0.92, 0.6, 0.24), bevel=0.0)
    return [(xc - w / 2 * 1.04, 0.0)] + lid[::-1][1:-1] + [(xc + w / 2 * 1.04, 0.0)]


def rib_arcade(B, x0, x1, h, y, rng):
    """A garden arcade: a row of tall white ribs (thin pointed arches) with palms between them and lamps at their feet."""
    n = int((x1 - x0) / 1.3)
    for k in range(n + 1):
        x = x0 + (x1 - x0) * k / n
        B.band_arch('white', (x, y, 0.0), 0.55, h - 1.2, 0.11, 0.3, legs=0.6, segs=10, pointed=0.6)
        B.sphere('lamp_glow', (x, y - 0.3, 0.12), 0.12, subdiv=1)
    for k in range(3):
        px = x0 + (x1 - x0) * (k + 0.5) / 3 + rng.uniform(-0.3, 0.3)
        top = (px + 0.1, y + 0.6, h * 0.75)
        B.rod('trunk', (px, y + 0.6, 0.0), top, 0.1, segs=6, r2=0.07)
        for j in range(7):
            a = -math.pi + j * math.pi / 6
            B.sphere('palm' if j % 2 else 'palm2', (top[0] + math.cos(a) * 0.55, y + 0.55, top[2] + math.sin(a) * 0.3), 0.4,
                     scale=(1.5, 0.35, 0.3), rot=(0, -a * 0.6, 0), subdiv=1)


def build_L0(rng):
    L = 'L0'
    # far skyline: low blue towers with a few lit windows
    B = Builder('L0_city', L, TH)
    xs = K._split(-OVER, P + OVER, 16, rng, jitter=0.4)
    for a, b in zip(xs, xs[1:]):
        h = rng.uniform(2.5, 5.5)
        B.box(rng.choice(('sky_city', 'sky_city2')), ((a + b) / 2, 5.0, h / 2), (b - a - 0.1, 1.0, h), bevel=0.0)
        for k in range(rng.randint(0, 3)):
            B.box(rng.choice(('win_glow', 'win2_glow')), (rng.uniform(a + 0.3, b - 0.3), 4.45, rng.uniform(0.8, h - 0.4)), (0.18, 0.05, 0.22), bevel=0.0)
    B.done(period=None)
    # the pool: dark water below the ground line, a pale stone edge along it
    K.fill_below(TH, L, 'pool', top=0.0, depth=3.5, y=2.0)
    Builder('L0_edge', L, TH).box('edge', (P / 2, -0.5, -0.06), (P + 2 * OVER, 0.6, 0.12), bevel=0.0).done(period=None)
    S = Builder('L0_buildings', L, TH)
    outlines = []
    outlines.append(shell(S, 1.0, 10.5, 4.6, 'white', 'rib', ribs=8, y=0.4))
    outlines.append(eye_dome(S, 15.4, 4.8, 2.2, y=0.6))
    rib_arcade(S, 20.0, 29.5, 3.4, 0.2, rng)
    outlines.append(shell(S, 30.0, 6.0, 3.0, 'white3', 'rib', ribs=5, y=0.9, flip=True))
    S.done()
    # reflections: each outline mirrored under the waterline, darker and squashed
    R = Builder('L0_reflections', L, TH)
    for k, poly in enumerate(outlines):
        mir = [(px, -pz * 0.55 - 0.15) for px, pz in poly]
        R.slab('refl' if k % 2 == 0 else 'refl2', mir[::-1], 0.05, at=(0, -0.2, 0))
    for k in range(8):
        x = 20.0 + 9.5 * k / 7
        R.box('refl2', (x, -0.25, -0.9), (0.18, 0.05, 1.2), bevel=0.0)
    ob = R.done()
    ob['outline'] = 0


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.marble_ground(TH, random.Random(seed), {'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'seam': 'g_seam', 'slab': 'g_slab',
                                                     'slab2': 'g_slab2', 'mortar': 'g_mortar', 'vein': 'g_vein'})


def clear():
    TH.clear()


if __name__ == '__main__':
    K.preview(TH, build, build_ground)
