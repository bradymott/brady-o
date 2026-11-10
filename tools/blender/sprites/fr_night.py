# France 7-3 "Rooftops by Moonlight" (theme fr_night): the parallax background as a Fiesta Toon diorama. Original
# art: the city's zinc rooftops at night. The lattice tower stands far away as a plain, UNLIT dark silhouette (no
# lights, no beacon, no sparkle near it); the far houses show a few warm windows; the near layer is a jumble of dark
# zinc roofs, chimney stacks with pots, TV aerials, skylights and the odd warm dormer.
#
#   L0  frTower   (base 330, #1a1e3a)   the tower at 240/1024 of the period, a flat dark silhouette, unlit
#   L1  frFacades (base 350, #2a3050)   night facades (fr_morning's house row with night=True): dark stone, dim
#                                        roofs, ~35% of the windows lit warm
#   L2  frRoofs   (base 375, #141830)   near roofs: mansard and gabled zinc roofs at varying heights, chimney stacks,
#                                        aerials, skylights, a few lit dormers
#   ground        frZinc (standing-seam zinc, fr_morning.zinc_ground)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM
import fr_morning as FM

MODULE = 'fr_night'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 330, 'L1': 350, 'L2': 375}
SKY = ['#0a0e2a', '#1a2050', '#3a3a6a']

PALETTE = {
    # the tower: two near-black blues, no lit parts at all
    'iron': '#11142c', 'deck': '#151934',
    # night facades (#2a3050)
    'stone': '#2a3050', 'stone2': '#2e3456', 'stone3': '#272c4a', 'stone_light': '#343a5e', 'stone_dark': '#222842',
    'roof': '#1e2440', 'roof_dark': '#181d36', 'window': '#1a2034', 'window_hi': '#2a3048', 'dormer_win': '#1a2034',
    'dormer_glow': '#e8b868', 'win_glow': '#d8a860', 'win_dark': '#161b30', 'chimney': '#2a2440', 'pot': '#342c4a',
    'balcony': '#12162a', 'door': '#1a1a2e', 'shop_win': '#1e2438', 'flower_a': '#3a2a4a', 'flower_b': '#3a2a4a',
    'flower_c': '#3a2a4a', 'leaf': '#1e2a34',
    # near roofs (#141830)
    'zinc': '#1a1f3a', 'zinc_light': '#262c4e', 'zinc_seam': '#2e3558', 'wall': '#141830', 'wall_light': '#1c2140',
    'stack': '#2a2238', 'stack_light': '#342a44', 'potr': '#3a2c40', 'aerial': '#0e1024',
    'sky_glow': '#e8b868', 'skylight': '#2a3a5a', 'moonlit': '#3a4270',
    # ground (frZinc)
    'g_dark': '#3a4250', 'g_cap': '#9aa8b8', 'g_cap_hi': '#dce4ee', 'g_zinc_a': '#6a7484', 'g_zinc_b': '#5e6878', 'g_zinc_hi': '#9aa6b6',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
FACADE_ROLES = dict(FM.FACADE_ROLES)

def build_L0(rng):
    FM.lattice_tower(TH, 'L0', 'L0_tower', P * 240 / 1024, 280 / PPM, {'iron': 'iron', 'deck': 'deck'}, y=2.0)

def build_L1(rng):
    FM.facade_row(TH, 'L1', rng, FACADE_ROLES, floors=(4, 5), night=True, flowers=False)

def roof_block(th, L, name, x0, w, top, kind, rng):
    """One near roof: a dark wall body from below the ground line up to `top`, a zinc mansard (or a gable) with seam
    lines, a chimney stack with pots, sometimes an aerial, a skylight or a warm dormer."""
    B = Builder(name, L, th)
    B.box('wall', (x0 + w / 2, 0.6, (top - 2.0) / 2), (w, 1.2, top + 2.0), bevel=0.0)
    if kind == 'mansard':
        rh = 0.9
        B.slab('zinc', [(x0 - 0.06, top), (x0 + w + 0.06, top), (x0 + w - 0.35, top + rh), (x0 + 0.35, top + rh)], 1.2, at=(0, 0.0, 0))
        B.box('zinc_light', (x0 + w / 2, -0.02, top + rh - 0.04), (w - 0.6, 0.1, 0.08), bevel=0.0)
        n = int(w / 0.5)
        for k in range(1, n):
            sx = x0 + k * w / n
            B.box('zinc_seam', (sx, -0.04, top + rh / 2), (0.04, 0.05, rh - 0.1), bevel=0.0)
        ridge = top + rh
    else:
        rh = 1.2
        B.slab('zinc', [(x0 - 0.1, top), (x0 + w + 0.1, top), (x0 + w / 2, top + rh)], 1.2, at=(0, 0.0, 0))
        B.box('moonlit', (x0 + w * 0.25, -0.03, top + rh * 0.5), (w * 0.62, 0.05, 0.07), bevel=0.0, rot=(0, -math.atan2(rh, w / 2), 0))
        ridge = top + rh * 0.55
    # the chimney stack with its row of pots
    cx = x0 + w * rng.uniform(0.62, 0.8)
    sh = rng.uniform(0.7, 1.1)
    B.box('stack', (cx, 0.3, ridge + sh / 2 - 0.2), (0.55, 0.5, sh + 0.4), bevel=0.02)
    B.box('stack_light', (cx, 0.3, ridge + sh), (0.65, 0.6, 0.12), bevel=0.02)
    for k in range(rng.choice([2, 3])):
        B.lathe('potr', [(0.07, 0.0), (0.06, 0.22), (0.08, 0.26)], 6, at=(cx - 0.15 + k * 0.15, 0.3, ridge + sh + 0.06), cap_top=True)
    # extras
    r = rng.random()
    if r < 0.4:
        ax = x0 + w * rng.uniform(0.25, 0.45)
        B.rod('aerial', (ax, 0.0, ridge - 0.2), (ax, 0.0, ridge + 1.5), 0.03, segs=4)
        for k in range(3):
            hw = 0.42 - k * 0.1
            B.rod('aerial', (ax - hw, 0.0, ridge + 1.0 + k * 0.17), (ax + hw, 0.0, ridge + 1.0 + k * 0.17), 0.018, segs=4)
    elif r < 0.7 and kind == 'mansard':
        dx = x0 + w * rng.uniform(0.25, 0.45)
        B.box('zinc', (dx, -0.15, top + 0.35), (0.42, 0.5, 0.56), bevel=0.02)
        B.slab('zinc_light', [(dx - 0.27, top + 0.6), (dx + 0.27, top + 0.6), (dx, top + 0.82)], 0.5, at=(0, -0.17, 0))
        B.box('sky_glow' if rng.random() < 0.7 else 'skylight', (dx, -0.42, top + 0.33), (0.24, 0.04, 0.32), bevel=0.0)
    # one or two windows in the wall, mostly dark
    for k in range(int(w / 1.3)):
        wx = x0 + 0.6 + k * 1.3
        if wx > x0 + w - 0.4:
            break
        lit = rng.random() < 0.3
        B.box('sky_glow' if lit else 'skylight', (wx, -0.05, top - 0.9), (0.4, 0.06, 0.6), bevel=0.0)
    B.done()

def build_L2(rng):
    L = 'L2'
    x = rng.uniform(-0.6, -0.2)
    x_end = x + P
    i = 0
    while x < x_end - 0.5:
        w = min(rng.uniform(1.8, 3.4), x_end - x)
        if x_end - x - w < 1.4:
            w = x_end - x
        top = rng.uniform(0.2, 1.9)
        roof_block(TH, L, f'L2_roof_{i}', x, w, top, 'mansard' if rng.random() < 0.6 else 'gable', rng)
        x += w
        i += 1

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return FM.zinc_ground(TH, random.Random(seed), {'dark': 'g_dark', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'zinc_a': 'g_zinc_a', 'zinc_b': 'g_zinc_b', 'zinc_hi': 'g_zinc_hi'})

def clear():
    TH.clear()

if __name__ == '__main__':
    FM.preview(TH, build, build_ground)
