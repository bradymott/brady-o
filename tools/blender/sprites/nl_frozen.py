# Amsterdam 8-4 "Frozen Canals" (theme nl_frozen): the canal ring on a snowy winter night. Original art, built with
# nl_canals' kit: the gabled house row under snow with warm windows, bare elms, and the canal frozen hard: pale ice
# with skate marks, snowy bridges hung with warm lanterns, houseboats frozen in with snow on their roofs.
#
#   L0  nlCanalHouses (base 300, #2a2a3a, night)   house row (night=True, snow=True), snowy pavement, bare elms
#   L1  nlIce         (base 335, #c8e0f0)          the frozen canal (canal_layer with ice colours, night, snow)
#   ground        snow: a snow cap over packed ice blocks (nl_canals.snow_ground)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, jittered, wraps

MODULE = 'nl_frozen'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 335}
SKY = ['#0a1430', '#1a2a50', '#3a4a70']
WALLS = ['#2a2a3a', '#26303e', '#342834', '#24302c', '#3a3430', '#302a40']
PALETTE = {
    **{f'frozen_wall{i}': c for i, c in enumerate(WALLS)},
    'frozen_trim': '#8a90a8', 'frozen_glass': '#3a4a68', 'frozen_glass_dark': '#1a2034', 'frozen_window_glow': '#f0c070',
    'frozen_door': '#141826', 'frozen_step': '#4a5068', 'frozen_hook': '#12141e', 'frozen_snow': '#e4eefa',
    'frozen_pave': '#5a6278', 'frozen_quay': '#3a2a2e', 'frozen_flower_box': '#3a2a2a', 'frozen_flower_a': '#6a3a4a',
    'frozen_flower_b': '#6a5a3a', 'frozen_flower_c': '#5a3a5a', 'frozen_trunk': '#2a2430', 'frozen_leaf': '#2a3a34', 'frozen_leaf2': '#24302c',
    # the ice (the canal kit's water roles)
    'frozen_water': '#a8c4dc', 'frozen_water_light': '#e8f4ff', 'frozen_water_dark': '#86a8c8',
    'frozen_bridge': '#4a3038', 'frozen_rail': '#9aa0b8', 'frozen_lantern_glow': '#ffd890',
    'frozen_hull_a': '#1e3028', 'frozen_hull_b': '#1e2448', 'frozen_hull_c': '#3a1e22',
    'frozen_boat_cabin': '#6a6a7a', 'frozen_boat_trim': '#8a8a9a', 'frozen_boat_glass': '#3a4a68', 'frozen_boat_roof': '#7a2a2a', 'frozen_pot': '#4a3030',
    'frozen_bollard': '#14161e', 'frozen_bike': '#14141c', 'frozen_bike_hub': '#5a5a6a', 'frozen_bike_saddle': '#3a2a2a',
    'frozen_duck': '#d8dce8', 'frozen_beak': '#c87a2a',
    # ground (snow)
    'frozen_g_snow': '#f0f8ff', 'frozen_g_snow_hi': '#ffffff', 'frozen_g_icicle': '#c8e8ff', 'frozen_g_mortar': '#a8c8e0',
    'frozen_g_ice': '#7ab0d8', 'frozen_g_ice_deep': '#5a90c0', 'frozen_g_ice_light': '#a8d0ec', 'frozen_g_brick': '#8a4a3a',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
R = NC.roles('frozen')

def build_L0(rng):
    L = 'L0'
    NC.pavement(TH, L, R, rng, snow=True)
    NC.house_row(TH, L, [f'frozen_wall{i}' for i in range(6)], R, rng, night=True, snow=True)
    B = Builder('L0_trees', L, TH)
    for x in jittered(rng, 3, 0.25):
        for dx in wraps(x, 1.6):
            NC.elm_tree(B, x + dx, -0.9, rng.uniform(5.6, 6.8), R, rng, kind='bare')
    B.done(period=None)

def build_L1(rng):
    L = 'L1'
    NC.canal_layer(TH, L, R, rng, ['frozen_hull_a', 'frozen_hull_b', 'frozen_hull_c'], night=True, snow=True)
    # long skate marks and snow drifts along the frozen canal
    B = Builder('L1_skates', L, TH)
    for i in range(14):
        x, z, w = rng.uniform(0, P), -rng.uniform(0.3, 2.4), rng.uniform(2.0, 4.5)
        for dx in wraps(x, w / 2):
            B.box('frozen_water_light', (x + dx, 0.9, z), (w, 0.05, 0.05), bevel=0.0, rot=(0, rng.uniform(-0.04, 0.04), 0))
    for x in jittered(rng, 9, 0.35):
        for dx in wraps(x, 1.2):
            B.sphere('frozen_snow', (x + dx, 0.8, -0.05), 0.6, scale=(2.0, 0.6, 0.3), subdiv=1)
    B.done(period=None)

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed + 23)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return NC.snow_ground(TH, random.Random(seed), {'snow': 'frozen_g_snow', 'snow_hi': 'frozen_g_snow_hi', 'icicle': 'frozen_g_icicle',
                                                    'mortar': 'frozen_g_mortar', 'ice': 'frozen_g_ice', 'ice_deep': 'frozen_g_ice_deep',
                                                    'ice_light': 'frozen_g_ice_light', 'brick': 'frozen_g_brick'})

def clear():
    TH.clear()

if __name__ == '__main__':
    NC.preview(TH, build, build_ground)
