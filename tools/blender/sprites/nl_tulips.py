# Amsterdam 8-2 "Tulips & Windmills" (theme nl_tulips): the polder as a Fiesta Toon diorama. Original art: a flat green
# polder under a big sky, three windmills on the horizon (brown-thatch smock towers with white-latticed sails, a
# gallery and a red door), a farm with a steep red roof, a row of poplars, and in front the tulip fields: bands of
# red, yellow, pink, orange and purple blooms between green rows, widening toward the viewer, cut by a blue ditch.
#
#   L0  nlPolder (base 300, #3a8a3a)   horizon (z = 0): windmills at 150 / 520 / 860 px, the farm, poplars;
#                                        below it the striped tulip fields down to the floor line
#   ground        grass (nl_canals.grass_ground in polder greens)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, OVER, PPM, TAU, jittered, wraps

MODULE = 'nl_tulips'
LAYERS = ['L0']
BASES = {'L0': 300}
SKY = ['#3a8ae8', '#9ad0ff', '#ffffff']
TULIPS = ['#e8322a', '#ffd23a', '#ff6ab8', '#ff8a1a', '#b84aff']
PALETTE = {
    'tulips_grass': '#4a9a3a', 'tulips_grass_far': '#7ab86a', 'tulips_row': '#3a8a3a', 'tulips_ditch': '#5aa8d8', 'tulips_ditch_hi': '#a8dcf4',
    **{f'tulips_bloom{i}': c for i, c in enumerate(TULIPS)},
    'tulips_mill': '#6a5048', 'tulips_mill_dark': '#4a3832', 'tulips_cap': '#3a2a26', 'tulips_gallery': '#2a3a2a', 'tulips_door': '#c8322a',
    'tulips_sail': '#f0e8d8', 'tulips_sail_frame': '#8a6a4a', 'tulips_hub': '#c8a070', 'tulips_window': '#e8e0d0',
    'tulips_farm': '#a84a3a', 'tulips_farm_roof': '#c83a2a', 'tulips_farm_wall': '#f0e8dc', 'tulips_farm_trim': '#2a5a3a',
    'tulips_poplar': '#3a7a3a', 'tulips_poplar2': '#4a8a42', 'tulips_trunk': '#5a4a3a',
    # ground (grass)
    'tulips_g_turf': '#5ab84a', 'tulips_g_turf_hi': '#9ae08a', 'tulips_g_soil': '#6a4a2a', 'tulips_g_soil_dark': '#4a3018', 'tulips_g_rock': '#7a5a3a',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
M = 1 / PPM

def windmill(th, L, name, x, h, rng, sail_phase=0.4, y=2.0):
    """A smock windmill: a tapering eight-sided thatched tower on a brick base, a gallery ring, a red door, a
    boat-shaped cap, four latticed sails on a hub (seen from the side, slightly turned toward the camera)."""
    B = Builder(name, L, th)
    B.lathe('tulips_mill_dark', [(1.15, 0.0), (1.1, 0.7)], 8, at=(x, y, 0.0), cap_top=True, phase=math.pi / 8)
    B.lathe('tulips_mill', [(0.98, 0.7), (0.62, h)], 8, at=(x, y, 0.0), cap_top=True, phase=math.pi / 8)
    B.lathe('tulips_gallery', [(1.45, 0.7), (1.45, 0.82)], 12, at=(x, y, 0.0), cap_top=True, cap_bottom=True)
    for k in range(8):
        a = TAU * k / 8
        B.rod('tulips_gallery', (x + math.cos(a) * 1.4, y + math.sin(a) * 1.4 * 0.6, 0.82), (x + math.cos(a) * 1.4, y + math.sin(a) * 1.4 * 0.6, 1.25), 0.03, segs=4)
    B.arch('tulips_door', (x, y - 1.1, 0.0), 0.5, 0.8, 0.1)
    B.box('tulips_window', (x, y - 0.75, h * 0.62), (0.26, 0.06, 0.34), bevel=0.0)
    # the cap
    B.slab('tulips_cap', [(x - 0.8, h - 0.05), (x + 0.75, h - 0.05), (x + 0.45, h + 0.55), (x - 0.5, h + 0.55)], 1.4, at=(0, y - 0.7, 0))
    B.sphere('tulips_cap', (x, y, h + 0.5), 0.5, scale=(1.4, 1.2, 0.7), subdiv=1)
    # the sails: four lattice blades on a hub in front of the cap
    hub = (x + 0.15, y - 1.1, h + 0.15)
    B.sphere('tulips_hub', hub, 0.2, subdiv=1)
    R = h * 0.62
    for k in range(4):
        a = sail_phase + k * math.pi / 2
        d = (math.cos(a), math.sin(a))
        tip = (hub[0] + d[0] * R, hub[1] - 0.1, hub[2] + d[1] * R)
        B.rod('tulips_sail_frame', hub, tip, 0.06, segs=5)
        # the sail cloth: a lattice panel on one side of the stock
        n = (-d[1], d[0])
        for i in range(5):
            t0 = 0.22 + 0.15 * i
            p0 = (hub[0] + d[0] * R * t0, hub[2] + d[1] * R * t0)
            B.box('tulips_sail', (p0[0] + n[0] * 0.28 + d[0] * R * 0.07, hub[1] - 0.12, p0[1] + n[1] * 0.28 + d[1] * R * 0.07),
                  (R * 0.13, 0.04, 0.5), bevel=0.0, rot=(0, -a, 0))
        for i in range(3):
            t0 = 0.2 + 0.39 * i
            p0 = (hub[0] + d[0] * R * t0, hub[2] + d[1] * R * t0)
            B.rod('tulips_sail_frame', (p0[0], hub[1] - 0.15, p0[1]), (p0[0] + n[0] * 0.56, hub[1] - 0.15, p0[1] + n[1] * 0.56), 0.025, segs=4)
        e0 = (hub[0] + d[0] * R * 0.2 + n[0] * 0.56, hub[2] + d[1] * R * 0.2 + n[1] * 0.56)
        e1 = (hub[0] + d[0] * R * 0.98 + n[0] * 0.56, hub[2] + d[1] * R * 0.98 + n[1] * 0.56)
        B.rod('tulips_sail_frame', (e0[0], hub[1] - 0.15, e0[1]), (e1[0], hub[1] - 0.15, e1[1]), 0.03, segs=4)
    B.done()

def farm(th, L, name, x, rng, y=2.5):
    """A polder farmhouse: a white-walled front with green trim, a tall steep red roof, a big barn door."""
    B = Builder(name, L, th)
    w, hw, hr = 4.2, 1.5, 2.2
    B.box('tulips_farm_wall', (x, y, hw / 2), (w, 1.6, hw), bevel=0.02)
    B.slab('tulips_farm_roof', [(x - w / 2 - 0.2, hw), (x + w / 2 + 0.2, hw), (x + 0.2, hw + hr), (x - 0.2, hw + hr)], 1.8, at=(0, y - 0.9, 0))
    B.arch('tulips_farm', (x - 0.8, y - 0.82, 0.0), 1.0, 1.3, 0.05)
    for k in range(2):
        B.box('tulips_farm_trim', (x + 0.5 + k * 0.9, y - 0.82, 0.85), (0.5, 0.05, 0.6), bevel=0.0)
        B.box('tulips_window', (x + 0.5 + k * 0.9, y - 0.85, 0.85), (0.38, 0.04, 0.48), bevel=0.0)
    B.done()

def poplar(B, x, h, y=3.0):
    B.rod('tulips_trunk', (x, y, 0.0), (x, y, h * 0.3), 0.08, segs=5)
    B.sphere('tulips_poplar', (x, y, h * 0.6), h * 0.2, scale=(0.55, 0.55, 1.6), subdiv=1)
    B.sphere('tulips_poplar2', (x + h * 0.03, y - 0.12, h * 0.52), h * 0.13, scale=(0.55, 0.5, 1.5), subdiv=1)

def build_L0(rng):
    L = 'L0'
    # the polder below the horizon: far grass, then the striped tulip fields widening toward the viewer
    NC.strip_box(TH, L, 'L0_far', 'tulips_grass_far', 0.0, -0.3, 4.0, 5.0)
    z = -0.3
    k = 0
    widths = [0.28, 0.34, 0.42, 0.5, 0.6, 0.72, 0.86, 1.0, 1.15]
    for i, w in enumerate(widths):
        if i == 3:
            NC.strip_box(TH, L, 'L0_ditch', 'tulips_ditch', z, z - 0.32, 3.0, 4.0)
            NC.strip_box(TH, L, 'L0_ditch_hi', 'tulips_ditch_hi', z - 0.04, z - 0.09, 2.9, 3.0)
            z -= 0.32
        role = f'tulips_bloom{k % 5}' if i % 2 == 0 else 'tulips_row'
        if i % 2 == 0:
            k += 1
        NC.strip_box(TH, L, f'L0_band_{i}', role, z, z - w, 3.0, 4.0)
        if i % 2 == 0:
            # bloom bumps along the top of each flower band so it reads as rows of tulips
            B = Builder(f'L0_blooms_{i}', L, TH)
            n = int(P / (0.3 + 0.1 * i))
            for j in range(n):
                bx = (j + 0.5) * P / n
                B.sphere(role, (bx, 2.9, z - 0.02), 0.14 + 0.035 * i, scale=(1.0, 0.5, 0.8), subdiv=1)
            B.done(period=None)
        z -= w
    NC.strip_box(TH, L, 'L0_base', 'tulips_grass', z, z - 3.0, 3.0, 4.0)
    # the horizon: poplars, a farm, three windmills
    B = Builder('L0_poplars', L, TH)
    for x in jittered(rng, 7, 0.3):
        if any(abs(x - P * m / 1024) < 2.4 for m in (150, 520, 860)):
            continue
        for dx in wraps(x, 0.6):
            poplar(B, x + dx, rng.uniform(2.6, 3.4))
    B.done(period=None)
    farm(TH, L, 'L0_farm', P * 330 / 1024, rng)
    for i, m in enumerate((150, 520, 860)):
        windmill(TH, L, f'L0_mill_{i}', P * m / 1024, rng.uniform(3.6, 4.2), rng, sail_phase=0.35 + 0.5 * i)

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return NC.grass_ground(TH, random.Random(seed), {'turf': 'tulips_g_turf', 'turf_hi': 'tulips_g_turf_hi', 'soil': 'tulips_g_soil',
                                                     'soil_dark': 'tulips_g_soil_dark', 'rock': 'tulips_g_rock'})

def clear():
    TH.clear()

if __name__ == '__main__':
    NC.preview(TH, build, build_ground)
