# Netherlands overhaul variant nl_polder (8-1 "Polder Pumps", level overhaul §8: V nl_polder): the canal-ring kit
# moved out to the polder, with a brick steam pumping station of our own. Built with the Amsterdam toolkit
# (nl_canals.py, nl_tulips.py).
# Suggested theme entry: sky ['#5a9ae8', '#b4dcf8', '#f4f4ec'], ground 'brick', liquid 'canal', layers
#   [{kind:'nlPolder', color:'#5a9a4a', base:300, f:0.06}, {kind:'nlCanal', color:'#4a7a7a', base:330, f:0.12}].
#   L0  nlPolder (base 300, f 0.06): flat green polder strips and a ditch under a wide sky, a grassy dyke, three
#                windmills, poplar rows, a farm and the pumping station: a red-brick hall with tall arched windows, a
#                slate roof, a slim chimney with a white band and its outfall gushing into the ditch
#   L1  nlCanal  (base 330, f 0.12): the canal with brick bridges, moored houseboats, bollards and ducks (as 8-1)
#   ground brick: a grey kerb cap over red bricks on light mortar
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, OVER, PPM, TAU, jittered, wraps
import nl_tulips as NT

MODULE = 'nl_polder'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 330}
SKY = ['#5a9ae8', '#b4dcf8', '#f4f4ec']
PALETTE = {
    'polder_far': '#8ab87a', 'polder_grass': '#6aa85a', 'polder_grass2': '#5a9a4a', 'polder_dyke': '#4e8e44', 'polder_ditch': '#5aa0c8',
    'polder_ditch_hi': '#a8d8f0',
    'polder_brick': '#9a4232', 'polder_brick2': '#7a3226', 'polder_slate': '#4a5262', 'polder_stone': '#e8e0d0', 'polder_glass': '#a4bcd2',
    'polder_chimney': '#8a3a2c', 'polder_band': '#f2ece0', 'polder_foam': '#ffffff', 'polder_door': '#2a4a3a',
    # windmills, poplars and the farm (role names used by nl_tulips' builders)
    'tulips_mill': '#6a5048', 'tulips_mill_dark': '#4a3832', 'tulips_cap': '#3a2a26', 'tulips_gallery': '#2a3a2a', 'tulips_door': '#c8322a',
    'tulips_sail': '#f0e8d8', 'tulips_sail_frame': '#8a6a4a', 'tulips_hub': '#c8a070', 'tulips_window': '#e8e0d0',
    'tulips_farm': '#a84a3a', 'tulips_farm_roof': '#c83a2a', 'tulips_farm_wall': '#f0e8dc', 'tulips_farm_trim': '#2a5a3a',
    'tulips_poplar': '#3a7a3a', 'tulips_poplar2': '#4a8a42', 'tulips_trunk': '#5a4a3a',
    # the canal (#4a7a7a)
    'polder_water': '#4a7a7a', 'polder_water_light': '#8cbcb6', 'polder_water_dark': '#365e5e',
    'polder_bridge': '#7a4a3a', 'polder_rail': '#f2ece0',
    'polder_hull_a': '#2a5a3a', 'polder_hull_b': '#2a3a6a', 'polder_hull_c': '#6a2a2a',
    'polder_boat_cabin': '#b8b2a2', 'polder_boat_trim': '#c8c2b2', 'polder_boat_glass': '#5a8aa8', 'polder_boat_roof': '#4a6a66', 'polder_pot': '#b85a3a',
    'polder_bollard': '#2a2a30', 'polder_bike': '#1e1e26', 'polder_bike_hub': '#9a9aa2', 'polder_bike_saddle': '#6a4a2a',
    'polder_duck': '#ffffff', 'polder_beak': '#ff9a1a', 'polder_lantern_glow': '#ffd890', 'polder_hook': '#2e2e38', 'polder_trim': '#dcd4c4',
    'polder_glass_dark': '#3a4a5a', 'polder_window_glow': '#ffd890', 'polder_step': '#9a9aa2', 'polder_snow': '#ffffff',
    'polder_glass': '#a4bcd2', 'polder_flower_box': '#6a4a2a', 'polder_flower_a': '#e8322a', 'polder_flower_b': '#ffd23a', 'polder_flower_c': '#ff6ab8',
    'polder_trunk': '#5a4030', 'polder_leaf': '#4a9a4a', 'polder_leaf2': '#3a8438', 'polder_leaf_autumn': '#c8822a', 'polder_leaf_autumn2': '#a85a1a',
    'polder_pave': '#aeaeb6', 'polder_quay': '#8a4636', 'polder_lane': '#9a4a3a', 'polder_lane_mark': '#f2ece0',
    # ground (brick)
    'polder_g_cap': '#8a8a90', 'polder_g_cap_hi': '#b8b8c0', 'polder_g_mortar': '#d8c8b8',
    'polder_g_brick_a': '#a8483a', 'polder_g_brick_b': '#8a3a2a', 'polder_g_brick_c': '#9a4a32', 'polder_g_brick_d': '#6e2c20',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
R = NC.roles('polder')


def pumping_station(th, L, name, x, y=2.4):
    B = Builder(name, L, th)
    w, h = 5.0, 2.6
    B.box('polder_brick', (x, y, h / 2), (w, 1.6, h), bevel=0.03)
    B.box('polder_stone', (x, y - 0.82, h - 0.12), (w + 0.1, 0.08, 0.16), bevel=0.0)
    B.slab('polder_slate', [(x - w / 2 - 0.2, h), (x + w / 2 + 0.2, h), (x + w / 2 - 0.9, h + 1.2), (x - w / 2 + 0.9, h + 1.2)], 1.7, at=(0, y - 0.85, 0))
    for k in range(4):
        wx = x - 1.8 + 1.2 * k
        B.arch('polder_stone', (wx, y - 0.84, 0.55), 0.62, 1.5, 0.05)
        B.arch('polder_glass', (wx, y - 0.87, 0.62), 0.48, 1.36, 0.04)
    B.arch('polder_door', (x + w / 2 - 0.5, y - 0.86, 0.0), 0.6, 1.1, 0.05)
    # the chimney
    cx = x - w / 2 + 0.6
    B.lathe('polder_chimney', [(0.32, 0.0), (0.24, 5.6), (0.3, 5.7), (0.3, 5.85)], 10, at=(cx, y + 0.4, 0.0), cap_top=True)
    B.lathe('polder_band', [(0.27, 4.6), (0.265, 4.85)], 10, at=(cx, y + 0.38, 0.0), cap_top=False)
    # the outfall into the ditch
    B.box('polder_stone', (x + 0.4, y - 0.9, 0.18), (1.2, 0.1, 0.36), bevel=0.02)
    for k in range(3):
        B.sphere('polder_foam', (x + 0.1 + 0.3 * k, y - 1.0, 0.0), 0.2, scale=(1.2, 0.5, 0.6), subdiv=1)
    B.done()


def build_L0(rng):
    L = 'L0'
    NC.strip_box(TH, L, 'L0_far', 'polder_far', 0.0, -0.3, 4.0, 5.0)
    z = -0.3
    for i, (w, role) in enumerate(((0.3, 'polder_grass'), (0.28, 'polder_ditch'), (0.5, 'polder_grass2'), (0.7, 'polder_grass'), (1.0, 'polder_grass2'))):
        NC.strip_box(TH, L, f'L0_band_{i}', role, z, z - w, 3.0, 4.0)
        if role == 'polder_ditch':
            NC.strip_box(TH, L, 'L0_ditch_hi', 'polder_ditch_hi', z - 0.04, z - 0.08, 2.9, 3.0)
        z -= w
    NC.strip_box(TH, L, 'L0_base', 'polder_grass', z, z - 3.0, 3.0, 4.0)
    # the dyke: a long low grassy bank along the horizon
    D = Builder('L0_dyke', L, TH)
    D.slab('polder_dyke', [(-OVER, 0.0), (P + OVER, 0.0), (P + OVER, 0.55), (-OVER, 0.55)], 0.5, at=(0, 4.6, 0))
    D.done(period=None)
    B = Builder('L0_poplars', L, TH)
    for x in jittered(rng, 8, 0.3):
        if any(abs(x - P * m / 1024) < 2.6 for m in (110, 480, 820, 640)):
            continue
        for dx in wraps(x, 0.6):
            NT.poplar(B, x + dx, rng.uniform(2.4, 3.2))
    B.done(period=None)
    NT.farm(TH, L, 'L0_farm', P * 300 / 1024, rng)
    for i, m in enumerate((110, 480, 820)):
        NT.windmill(TH, L, f'L0_mill_{i}', P * m / 1024, rng.uniform(3.4, 4.0), rng, sail_phase=0.25 + 0.55 * i)
    pumping_station(TH, L, 'L0_gemaal', P * 650 / 1024)


def build_L1(rng):
    NC.canal_layer(TH, 'L1', R, rng, ['polder_hull_a', 'polder_hull_b', 'polder_hull_c'])


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed + 5)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return NC.brick_ground(TH, random.Random(seed), {'cap': 'polder_g_cap', 'cap_hi': 'polder_g_cap_hi', 'mortar': 'polder_g_mortar',
                                                     'brick_a': 'polder_g_brick_a', 'brick_b': 'polder_g_brick_b', 'brick_c': 'polder_g_brick_c', 'brick_d': 'polder_g_brick_d'})


def clear():
    TH.clear()
