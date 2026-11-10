# Amsterdam 8-3 "Bike Lane Rush" (theme nl_rush): the canal ring at sunset, for the auto-scrolling bike lane. Original
# art, built with nl_canals' kit: the same gabled house row in deeper sunset tones with warm reflections in the glass,
# a red bike lane with white dashes along the pavement, and the canal with bridges and houseboats under a peach sky.
#
#   L0  nlCanalHouses (base 300, #5a2a2a)   the house row (sunset palette), pavement with a red bike lane, elms, bikes
#   L1  nlCanal       (base 340, #5a7a8a)   the canal (canal_layer) in dusky blue-grey with gold ripples
#   ground        brick (nl_canals.brick_ground, sunset-tinted kerb)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, jittered, wraps

MODULE = 'nl_rush'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 340}
SKY = ['#ff9a6a', '#ffd0a0', '#fff4e8']
WALLS = ['#5a2a2a', '#3a3446', '#6a3a2e', '#2e3a34', '#7a5a42', '#4a3048']
PALETTE = {
    **{f'rush_wall{i}': c for i, c in enumerate(WALLS)},
    'rush_trim': '#dcc8b0', 'rush_glass': '#e0aa7a', 'rush_glass_dark': '#4a3a48', 'rush_window_glow': '#ffd890', 'rush_door': '#2a2a3a',
    'rush_step': '#9a8a8a', 'rush_hook': '#2a2430', 'rush_pave': '#b49c94', 'rush_quay': '#7a3a2e', 'rush_lane': '#c84a3a', 'rush_lane_mark': '#fff0e0',
    'rush_flower_box': '#5a3a2a', 'rush_flower_a': '#ff4a3a', 'rush_flower_b': '#ffd23a', 'rush_flower_c': '#ff7ab8',
    'rush_trunk': '#4a3428', 'rush_leaf': '#5a8a3a', 'rush_leaf2': '#4a7a32',
    'rush_water': '#5a7a8a', 'rush_water_light': '#ffc89a', 'rush_water_dark': '#46626e',
    'rush_bridge': '#6a3a30', 'rush_rail': '#f4e4cc', 'rush_lantern_glow': '#ffd890',
    'rush_hull_a': '#2a4a3a', 'rush_hull_b': '#2a3060', 'rush_hull_c': '#5a2a2a',
    'rush_boat_cabin': '#c0a890', 'rush_boat_trim': '#ccb49c', 'rush_boat_glass': '#c8906a', 'rush_boat_roof': '#5a4a4a', 'rush_pot': '#a85a3a',
    'rush_bollard': '#2a2430', 'rush_bike': '#1e1a24', 'rush_bike_hub': '#a89a96', 'rush_bike_saddle': '#5a3a2a',
    'rush_duck': '#fff4ec', 'rush_beak': '#ff9a1a',
    'rush_g_cap': '#9a8a88', 'rush_g_cap_hi': '#d0bcb4', 'rush_g_mortar': '#dcc4b4',
    'rush_g_brick_a': '#a8483a', 'rush_g_brick_b': '#8a3a2a', 'rush_g_brick_c': '#9a4a32', 'rush_g_brick_d': '#6e2c20',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
R = NC.roles('rush')

def build_L0(rng):
    L = 'L0'
    NC.pavement(TH, L, R, rng, lane=True)
    NC.house_row(TH, L, [f'rush_wall{i}' for i in range(6)], R, rng, flowers=True)
    B = Builder('L0_trees', L, TH)
    for x in jittered(rng, 3, 0.25):
        for dx in wraps(x, 1.6):
            NC.elm_tree(B, x + dx, -0.9, rng.uniform(5.6, 6.8), R, rng)
    B.done(period=None)
    B = Builder('L0_bikes', L, TH)
    for x in jittered(rng, 6, 0.4):
        for dx in wraps(x, 0.7):
            NC.bike(B, x + dx, -1.0, R, rng, facing=rng.choice([-1, 1]))
    B.done(period=None)

def build_L1(rng):
    NC.canal_layer(TH, 'L1', R, rng, ['rush_hull_a', 'rush_hull_b', 'rush_hull_c'])

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed + 11)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return NC.brick_ground(TH, random.Random(seed), {'cap': 'rush_g_cap', 'cap_hi': 'rush_g_cap_hi', 'mortar': 'rush_g_mortar',
                                                     'brick_a': 'rush_g_brick_a', 'brick_b': 'rush_g_brick_b', 'brick_c': 'rush_g_brick_c', 'brick_d': 'rush_g_brick_d'})

def clear():
    TH.clear()

if __name__ == '__main__':
    NC.preview(TH, build, build_ground)
