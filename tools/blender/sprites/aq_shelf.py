# Antarctica 13-1 "The Ice Shelf" (theme aq_shelf): original toon art for the bright ice shelf under a low polar sun.
#   L0  mountains (base 290, f 0.03, #b8d0e8, blur): a far wall of pale blue peaks under heavy snow, unlined
#   L1  aqBergs   (base 320, f 0.08, #e8f6ff): peaked, domed and weathered icebergs (never flat tables, so nothing
#       behind the platforms reads as walkable) on a dark polar sea, their submerged feet showing pale
#   L2  aqShelf   (base 360, f 0.2, #d0eaff): the shelf's pressure ridge: wind-carved snow drifts with clusters of
#       tilted, pointed blue ice shards pushed up through them (no flat tops behind the platforms)
#   ground snow: a white snow cap with soft lumps and little icicles over pale blue packed-ice blocks
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain
import aq_kit as AK

MODULE = 'aq_shelf'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 290, 'L1': 320, 'L2': 360}
SKY = ['#6aa8e8', '#c8e8ff', '#ffffff']
PX = 28.1
PALETTE = {
    'base_far': '#c4d8ec', 'rock_far': '#b8d0e8', 'snow_far': '#e6f0fa', 'rock': '#9cb6d8', 'rock2': '#94aed2', 'snow': '#f2f8ff',
    'berg': '#d6eaf8', 'berg2': '#cce2f4', 'berg_top': '#f2faff', 'berg_sh': '#b2d0ea', 'berg_streak': '#a8c8e6', 'berg_under': '#3a72a8',
    'sea': '#1e4e80', 'sea_hi': '#6aa0d0', 'sea_glint': '#8ab8e0',
    'shelf': '#cde3f5', 'shelf2': '#c2dbf1', 'shelf_top': '#f4faff', 'shelf_cut': '#6a9ccc', 'shelf_streak': '#9cc0e2', 'shelf_snow': '#f6fbff',
    'drift': '#e2eefa', 'drift_sh': '#c4d8ee', 'serac': '#a6cdec', 'serac2': '#b8d8f2', 'serac_hi': '#d6ecfa',
    'g_cap': '#eef6ff', 'g_cap_hi': '#ffffff', 'g_lip': '#f4faff', 'g_icicle': '#c8ecff', 'g_dirt': '#6a98c6',
    'g_rock': '#90bae2', 'g_rock2': '#84b0dc', 'g_rock3': '#9cc4e8',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    AK.far_peaks('L0', rng)


def build_L1(rng):
    AK.sea('L1', rng, y=2.6)
    AK.bergs('L1', rng, y=1.6)


def build_L2(rng):
    AK.pressure_ridge('L2', rng, y=1.2)


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return AK.snow_ground(seed)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
