# Spain 6-5 "The Silk Exchange" (theme es_lonja): the parallax background as a Fiesta Toon diorama. Original art: a
# Gothic merchants' hall at dusk: spiral-twisted columns rising into ribbed pointed vaults, tall pointed windows
# glowing amber, silk banners hanging between the columns and bolts of silk stacked on merchants' benches.
#
#   L0  esHall (base 360, f 0.08, #5a4a38): a backdrop that fills the whole strip: the back wall with its windows,
#       the vault ribs, the twisted columns in front, banners and benches at their feet
#   ground: the engine's 'marble' style in warm stone: a honey kerb over big sandstone slabs with veins
# Contract and shared toolkit: es_tomatina.py.
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_lonja'
LAYERS = ['L0']
BASES = {'L0': 360}
SKY = ['#2a1e1a', '#4a3a2a', '#6a5038']
PALETTE = {
    'wall': '#5a4a38', 'wall2': '#52432f', 'vault': '#4a3c2c', 'rib': '#7a6448', 'rib2': '#6a5640', 'col': '#8a7454', 'col2': '#74603f',
    'capital': '#9a8460', 'win_frame': '#3e3226', 'win_glow': '#ffc870', 'win2_glow': '#ffb050', 'tracery': '#5a4630',
    'silk_r': '#b8323a', 'silk_g': '#2a7a5a', 'silk_b': '#2a4a8a', 'silk_y': '#d8a02a', 'silk_p': '#7a3a7a', 'rod': '#3a2e22',
    'bench': '#6a4a2e', 'bench2': '#543a24', 'floor_bg': '#4a3c2c',
    'g_cap': '#d8c8a8', 'g_cap_hi': '#f0e4c8', 'g_seam': '#7a6448', 'g_slab': '#c8b898', 'g_slab2': '#b8a888', 'g_mortar': '#8a7a62', 'g_vein': '#a89070',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
SILKS = ['silk_r', 'silk_g', 'silk_b', 'silk_y', 'silk_p']
TOP = 360 / 28.1 + 0.5          # the strip's top edge (13.3 m above the ground line), plus a margin


def twisted_column(B, x, y, h, r, role, role2):
    """A spiral-twisted column: a fluted shaft (a lathe with a twist) wrapped by a contrasting spiral band."""
    prof = [(r * 1.25, 0.0), (r * 1.25, 0.25), (r, 0.35), (r, h - 0.35), (r * 1.3, h - 0.2), (r * 1.3, h)]
    B.lathe(role, prof, 8, at=(x, y, 0.0), twist=0.0)
    n = int(h / 0.35)
    for k in range(n):
        z0 = 0.4 + k * (h - 0.8) / n
        a = k * 1.1
        px, pz = math.cos(a) * r * 0.9, z0
        B.rod(role2, (x - r * 0.95, y - r * 0.4, pz), (x + r * 0.95, y - r * 0.4, pz + 0.3), r * 0.28, segs=5)
    B.box('capital', (x, y, h + 0.15), (r * 3.0, r * 3.0, 0.3), bevel=0.04)


def pointed_window(B, x, y, z0, w, h, rng):
    B.band_arch('win_frame', (x, y, z0), w / 2, h * 0.32, 0.1, 0.12, legs=h * 0.68, segs=10, pointed=w * 0.35)
    pts = [(-w / 2, 0.0), (w / 2, 0.0), (w / 2, h * 0.68)]
    for k in range(1, 10):
        a = math.pi * k / 10
        lift = w * 0.35 * (1 - abs(math.cos(a))) ** 1.5
        pts.append((w / 2 * math.cos(a), h * 0.68 + h * 0.32 * math.sin(a) + lift))
    pts.append((-w / 2, h * 0.68))
    B.slab(rng.choice(('win_glow', 'win2_glow')), pts, 0.06, at=(x, y + 0.05, z0))
    B.box('tracery', (x, y - 0.02, z0 + h * 0.5), (0.08, 0.06, h), bevel=0.0)
    B.box('tracery', (x, y - 0.02, z0 + h * 0.45), (w, 0.06, 0.08), bevel=0.0)


def banner(B, x, y, ztop, w, h, role, role2):
    """A hanging silk banner on a rod: a long cloth with a swallow-tail hem and a contrasting stripe."""
    B.rod('rod', (x - w / 2 - 0.15, y, ztop), (x + w / 2 + 0.15, y, ztop), 0.04, segs=5)
    B.slab(role, [(-w / 2, 0.0), (w / 2, 0.0), (w / 2, -h), (0.0, -h + 0.35), (-w / 2, -h)], 0.04, at=(x, y, ztop))
    B.box(role2, (x, y - 0.03, ztop - 0.35), (w, 0.02, 0.12), bevel=0.0)


def build_L0(rng):
    L = 'L0'
    bay = P / 6
    B = Builder('L0_hall', L, TH)
    # back wall, full height and past the edges; a slightly darker vault zone above
    B.box('wall', (P / 2, 3.0, (TOP - 3.0) / 2), (P + 2 * OVER, 0.4, TOP + 3.0), bevel=0.0)
    B.box('vault', (P / 2, 2.7, 9.4 + (TOP - 9.4) / 2), (P + 2 * OVER, 0.2, TOP - 9.4 + 0.2), bevel=0.0)
    for i in range(6):
        xc = (i + 0.5) * bay
        if i % 2:
            pointed_window(B, xc, 2.6, 3.2, 1.5, 4.4, rng)
        # vault ribs springing from the column capitals into pointed arches, and a crossing rib
        B.band_arch('rib', (xc, 2.2, 7.6), bay / 2, 2.4, 0.12, 0.2, legs=0.05, segs=12, pointed=1.4)
        B.band_arch('rib2', (xc, 2.3, 7.6), bay / 4, 1.8, 0.08, 0.15, legs=0.05, segs=10, pointed=0.9)
    B.done()
    C = Builder('L0_columns', L, TH)
    for i in range(7):
        x = i * bay
        twisted_column(C, x, 1.6, 7.5, 0.32, 'col', 'col2')
    C.done()
    S = Builder('L0_silk', L, TH)
    for i in range(6):
        xc = (i + 0.5) * bay
        if i % 2 == 0:
            banner(S, xc, 1.2, 7.0, 1.5, rng.uniform(2.6, 3.4), rng.choice(SILKS), 'silk_y')
        else:
            # a merchant's bench stacked with bolts of silk
            S.box('bench', (xc, 0.8, 0.5), (2.6, 1.0, 0.12), bevel=0.02)
            for sx in (-1.1, 1.1):
                S.box('bench2', (xc + sx, 0.8, 0.22), (0.14, 0.9, 0.44), bevel=0.0)
            for k in range(4):
                for j in range(2 if k % 2 else 3):
                    S.lathe(rng.choice(SILKS), [(0.16, -0.4), (0.16, 0.4)], 10, at=(xc - 0.9 + k * 0.6, 0.6, 0.74 + j * 0.31), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    S.done()


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
