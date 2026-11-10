# France 7-5 "Hall of Mirrors" (theme fr_chateau): the château's long gallery as one Fiesta Toon backdrop. Original
# art: a cream-and-gold hall: tall arched mirrors in gilded frames every 128 px with pale glass and a soft diagonal
# sheen, fluted pilasters with gold capitals between them, a painted cornice and a coved ceiling band at the top,
# little crystal chandeliers hanging from the ceiling in the gaps, and a dark oak dado along the bottom.
#
#   L0  frMirrors (base 0, #c8962a)   a backdrop hanging from z = 0 (the top of the strip) down 15.8 m; the dado's top
#                                      is at row 318 like the painter's, everything below is panelled oak
#   ground        frParquet: oak boards with staggered joints (fr_morning.parquet_ground)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM
import fr_morning as FM

MODULE = 'fr_chateau'
LAYERS = ['L0']
BASES = {'L0': 0}
SKY = ['#f2e6c8', '#e8d4a8', '#d8b888']

PALETTE = {
    'wall': '#efe2c2', 'wall_panel': '#f6ecd4', 'wall_line': '#dcc8a0',
    'gold': '#d8a83a', 'gold_dark': '#b07e22', 'gold_light': '#f0cc6a',
    'glass': '#b8cce4', 'glass_deep': '#9ab0d0', 'sheen': '#d2e0f2',
    'ceiling': '#e8d8b4', 'cove': '#f4e8cc', 'fresco': '#a8c4e0', 'fresco_cloud': '#f4f0e6',
    'crystal': '#f4f4ff', 'candle': '#fff8e0', 'flame_glow': '#ffd86a',
    'dado': '#7a3a44', 'dado_dark': '#5e2a34', 'dado_light': '#9a5a62',
    # ground (frParquet)
    'g_joint': '#5a3a1a', 'g_cap': '#d8a05a', 'g_cap_hi': '#ffd890', 'g_board_a': '#a8743c', 'g_board_b': '#9a6832',
    'g_board_c': '#b07c42', 'g_gloss': '#c8925a',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
M = 1 / PPM                      # metres per strip pixel
Z_DADO = -318 * M                # the dado top, like the painter's wainscot at row 318

def mirror(B, x, rng):
    """A tall arched mirror in a gilded frame, the glass with a diagonal sheen, a gold crest on top."""
    w, z0, h = 84 * M, -300 * M, 226 * M
    # frame (an arch silhouette), the glass in front of it, the sheen, the crest
    B.arch('gold_dark', (x, 0.35, z0 - 0.05), w + 0.36, h + 0.3, 0.2, segs=16)
    B.arch('gold', (x, 0.2, z0), w + 0.2, h + 0.12, 0.2, segs=16)
    B.arch('glass', (x, 0.05, z0 + 0.1), w - 0.12, h - 0.12, 0.1, segs=16)
    B.arch('glass_deep', (x + 0.38, 0.02, z0 + 0.12), w * 0.36, h * 0.5, 0.05, segs=10)
    B.arch('sheen', (x - w * 0.27, 0.0, z0 + 0.3), w * 0.16, h * 0.78, 0.04, segs=8)
    # muntins: the mirror is made of panes (a gilded grid)
    for k in range(1, 4):
        B.box('gold', (x, -0.01, z0 + k * (h - w / 2) / 4 + 0.1), (w - 0.12, 0.04, 0.05), bevel=0.0)
    B.box('gold', (x, -0.01, z0 + (h - w / 2) / 2), (0.05, 0.04, h - w / 2 - 0.1), bevel=0.0)
    # the crest: a shell of three gold lobes and a little scroll either side
    top = z0 + h + 0.12
    for dx, r in ((0.0, 0.3), (-0.3, 0.2), (0.3, 0.2)):
        B.sphere('gold_light', (x + dx, 0.0, top + 0.12 + 0.12 * (dx == 0)), r, scale=(1.0, 0.4, 0.9), subdiv=1)
    for sx in (-1, 1):
        B.sphere('gold', (x + sx * 0.75, 0.05, top - 0.1), 0.12, scale=(1.6, 0.4, 0.8), subdiv=1)

def pilaster(B, x):
    """A fluted pilaster with a gold capital and base."""
    B.box('wall_panel', (x, 0.25, (Z_DADO - 1.4) / 2 - 0.3), (0.62, 0.3, -Z_DADO - 2.4), bevel=0.02)
    for k in (-1, 0, 1):
        B.box('wall_line', (x + k * 0.16, 0.08, (Z_DADO - 1.4) / 2 - 0.3), (0.05, 0.04, -Z_DADO - 3.0), bevel=0.0)
    B.box('gold', (x, 0.05, -1.95), (0.86, 0.4, 0.3), bevel=0.04)
    B.sphere('gold_light', (x - 0.24, -0.1, -1.95), 0.12, scale=(1, 0.5, 1), subdiv=1)
    B.sphere('gold_light', (x + 0.24, -0.1, -1.95), 0.12, scale=(1, 0.5, 1), subdiv=1)
    B.box('gold_dark', (x, 0.1, Z_DADO + 0.1), (0.8, 0.4, 0.2), bevel=0.03)

def chandelier(B, x, z):
    """A small crystal chandelier on a gold chain: a gold ring, five candles with flames, crystal drops."""
    B.rod('gold_dark', (x, -0.4, -1.3), (x, -0.4, z + 0.3), 0.025, segs=4)
    B.lathe('gold', [(0.0, -0.2), (0.25, -0.05), (0.6, 0.0), (0.62, 0.08), (0.2, 0.15), (0.06, 0.3)], 10, at=(x, -0.4, z), cap_top=True)
    for k in range(5):
        a = math.pi * (0.1 + 0.8 * k / 4)
        cx, cy = x + 0.5 * math.cos(a) * (1 if k % 2 else -1) * 0 + (k - 2) * 0.24, -0.4 - 0.2 * math.sin(a)
        B.box('candle', (cx, cy, z + 0.22), (0.07, 0.07, 0.24), bevel=0.0)
        B.sphere('flame_glow', (cx, cy, z + 0.4), 0.06, scale=(1, 1, 1.5), subdiv=1)
    for k in range(7):
        B.sphere('crystal', (x + (k - 3) * 0.13, -0.5, z - 0.12 - 0.08 * (k % 2)), 0.06, scale=(1, 1, 1.8), subdiv=1)

def build_L0(rng):
    L = 'L0'
    B = Builder('L0_wall', L, TH)
    zb = -444 * M - 0.6
    B.box('wall', (P / 2, 1.2, zb / 2), (P + 2 * OVER, 1.0, -zb + 0.4), bevel=0.0)
    # the coved ceiling band at the top with a painted sky strip and a gold cornice under it
    B.box('ceiling', (P / 2, 0.8, -0.55), (P + 2 * OVER, 0.6, 1.3), bevel=0.0)
    B.box('fresco', (P / 2, 0.6, -0.5), (P + 2 * OVER, 0.2, 0.62), bevel=0.0)
    B.box('cove', (P / 2, 0.5, -1.25), (P + 2 * OVER, 0.6, 0.3), bevel=0.0)
    B.box('gold', (P / 2, 0.3, -1.45), (P + 2 * OVER, 0.6, 0.16), bevel=0.02)
    # the oak dado: a rail, raised panels, the skirting
    B.box('dado', (P / 2, 0.4, (Z_DADO + zb) / 2), (P + 2 * OVER, 0.6, Z_DADO - zb), bevel=0.0)
    B.box('dado_light', (P / 2, 0.2, Z_DADO - 0.05), (P + 2 * OVER, 0.6, 0.16), bevel=0.02)
    B.box('gold', (P / 2, 0.15, Z_DADO - 0.18), (P + 2 * OVER, 0.6, 0.05), bevel=0.0)
    B.done(period=None)
    B = Builder('L0_clouds', L, TH)
    for x in K.jittered(rng, 9, jitter=0.3):
        for dx in K.wraps(x, 0.9):
            for ox, r in ((-0.35, 0.18), (0.0, 0.24), (0.35, 0.17)):
                B.sphere('fresco_cloud', (x + dx + ox, 0.45, -0.5 + 0.05 * (ox == 0)), r, scale=(1.4, 0.3, 0.8), subdiv=1)
    B.done(period=None)
    B = Builder('L0_dado_panels', L, TH)
    for k in range(16):
        x = (k + 0.5) * P / 16
        for dx in K.wraps(x, 1.0):
            B.box('dado_dark', (x + dx, 0.05, Z_DADO - 1.0), (1.6, 0.1, 1.2), bevel=0.06)
            B.box('dado_light', (x + dx, -0.02, Z_DADO - 1.0), (1.3, 0.1, 0.9), bevel=0.04)
    B.done(period=None)
    # 8 mirrors per period (one every 128 px), pilasters between them, chandeliers in front of every other pilaster
    B = Builder('L0_mirrors', L, TH)
    for k in range(8):
        x = (k * 128 + 64) * M
        mirror(B, x, rng)
    B.done(period=None)
    B = Builder('L0_pilasters', L, TH)
    for k in range(8):
        x = k * 128 * M
        for dx in K.wraps(x, 0.5):
            pilaster(B, x + dx)
    B.done(period=None)
    B = Builder('L0_chandeliers', L, TH)
    for k in range(0, 8, 2):
        x = (k * 128 + 128) * M
        for dx in K.wraps(x, 0.7):
            chandelier(B, x + dx, -3.0)
    B.done(period=None)

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return FM.parquet_ground(TH, random.Random(seed), {'joint': 'g_joint', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'board_a': 'g_board_a',
                                                      'board_b': 'g_board_b', 'board_c': 'g_board_c', 'gloss': 'g_gloss'})

def clear():
    TH.clear()

if __name__ == '__main__':
    FM.preview(TH, build, build_ground)
