# Ecuador 2-4 "Cacao Works" (theme ec_fabrica): the chocolate factory's back wall as a Fiesta Toon diorama.
#   L0  ecFactoryWall (base 420, #7a4a32; the engine lifts it 60 px): a dim brick wall, tall copper pipes that elbow
#       into a run along the wall, round roasting drums with riveted rims and a glowing grate under each, pressure
#       gauges and a cacao-pod plaque. Calmer and darker than the belts, presses and vats in front.
#   ground: the factory floor: riveted iron plates (warm brown) under a worn brass-edged kerb
# Contract, conventions and the shared toolkit: see ec_equator.py.
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, GP, GROUND_DEPTH, CAP_H

MODULE = 'ec_fabrica'
LAYERS = ['L0']
BASES = {'L0': 420}
SKY = ['#3a2418', '#6a3a24', '#a8643a']
PALETTE = {
    'fab_wall': '#4e2e1e', 'fab_brick_a': '#5e3828', 'fab_brick_b': '#56321f', 'fab_brick_c': '#66402c',
    'fab_copper': '#c07438', 'fab_copper_hi': '#e09a5a', 'fab_copper_dk': '#8a4e24', 'fab_iron': '#3a2e2c', 'fab_iron_hi': '#5a4a44',
    'fab_drum': '#6a4430', 'fab_drum_rim': '#8a5a3a', 'fab_rivet': '#c8a07a', 'fab_door': '#2e1e16', 'fab_fire_glow': '#ff9a3a',
    'fab_gauge': '#f4ecd8', 'fab_needle': '#c8282a', 'fab_plaque': '#e8c870', 'fab_pod': '#d8782a', 'fab_pod_ridge': '#a8501a', 'fab_leaf': '#5a8a3a',
    'fab_g_body': '#4a3022', 'fab_g_plate': '#6a4a36', 'fab_g_plate2': '#5e4230', 'fab_g_rivet': '#a8805a', 'fab_g_cap': '#8a6a52', 'fab_g_cap_hi': '#c8a07a',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
BAYS = 4
BW = P / BAYS


def build_L0(rng):
    L = 'L0'
    W = Builder('L0_wall', L, TH)
    W.box('fab_wall', (P / 2, 4.0, 5.0), (P + 2 * K.OVER, 1.0, 20.0), bevel=0.0)
    ob = W.done(period=None); ob['outline'] = 0.0
    Bk = Builder('L0_bricks', L, TH)
    bw, bh = 1.0, 0.45
    for r in range(int(16.0 / bh)):
        z = -2.0 + r * bh + bh / 2
        x = -K.OVER + ((bw / 2) if r % 2 else 0.0)
        while x < P + K.OVER:
            if rng.random() < 0.78:
                Bk.box(rng.choice(('fab_brick_a', 'fab_brick_b', 'fab_brick_c')), (x + bw / 2, 3.45, z), (bw - 0.09, 0.2, bh - 0.09), bevel=0.03)
            x += bw
    ob = Bk.done(period=None); ob['outline'] = 0.0
    Pp = Builder('L0_pipes', L, TH)
    Dr = Builder('L0_drums', L, TH)
    G = Builder('L0_glow', L, TH)
    zrun = 108 / 28.1 + 0.3
    for i in range(BAYS):
        x0 = i * BW + 1.4
        # a tall pipe from the top down to the run, an elbow, the run along the wall to the drum
        Pp.rod('fab_copper', (x0, 2.6, 16.0), (x0, 2.6, zrun), 0.32, segs=10)
        Pp.rod('fab_copper_hi', (x0 - 0.12, 2.5, 16.0), (x0 - 0.12, 2.5, zrun + 0.2), 0.08, segs=6)
        Pp.sphere('fab_copper_dk', (x0, 2.6, zrun), 0.4, subdiv=2)
        Pp.rod('fab_copper', (x0, 2.6, zrun), (x0 + 3.4, 2.6, zrun), 0.32, segs=10)
        for k in range(3):
            Pp.lathe('fab_copper_dk', [(0.4, -0.08), (0.4, 0.08)], 12, at=(x0, 2.6, zrun + 2.0 + k * 3.2), cap_top=True, cap_bottom=True)
        # the roasting drum: a big riveted cylinder seen end-on, a little door, a glowing grate below
        dx, dz = x0 + 4.9, 125 / 28.1
        Dr.lathe('fab_drum', [(1.4, -0.3), (1.4, 0.3)], 20, at=(dx, 2.4, dz), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        Dr.lathe('fab_drum_rim', [(1.48, -0.05), (1.48, 0.05)], 20, at=(dx, 2.05, dz), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        Dr.lathe('fab_drum', [(1.22, -0.05), (1.22, 0.05)], 20, at=(dx, 1.98, dz), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        for k in range(10):
            a = TAU * k / 10
            Dr.sphere('fab_rivet', (dx + math.cos(a) * 1.35, 1.92, dz + math.sin(a) * 1.35), 0.07, subdiv=1)
        Dr.box('fab_door', (dx, 1.9, dz), (0.8, 0.1, 0.8), bevel=0.08)
        Dr.box('fab_iron', (dx, 2.3, dz - 2.0), (1.6, 0.6, 0.9), bevel=0.06)
        G.box('fab_fire_glow', (dx, 1.95, dz - 2.0), (1.1, 0.1, 0.3), bevel=0.04)
        # a gauge on the run and a cacao-pod plaque high on the wall
        gx = x0 + 2.0
        Dr.lathe('fab_iron', [(0.36, 0.0), (0.36, 0.1)], 14, at=(gx, 2.2, zrun + 0.9), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        Dr.lathe('fab_gauge', [(0.28, 0.0), (0.28, 0.05)], 14, at=(gx, 2.1, zrun + 0.9), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        Dr.box('fab_needle', (gx + 0.08, 2.0, zrun + 0.96), (0.2, 0.03, 0.04), bevel=0.0, rot=(0, -0.6 + 0.4 * i, 0))
        if i % 2 == 0:
            px, pz = x0 + 4.9, dz + 3.0
            Dr.lathe('fab_plaque', [(0.85, 0.0), (0.85, 0.1)], 18, at=(px, 2.2, pz), yscale=1.0, rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
            Dr.sphere('fab_pod', (px, 2.0, pz), 0.42, scale=(1.5, 0.6, 0.9), subdiv=2)
            for k in (-1, 0, 1):
                Dr.box('fab_pod_ridge', (px + k * 0.25, 1.82, pz), (0.05, 0.05, 0.6 - 0.15 * abs(k)), bevel=0.0)
            Dr.sphere('fab_leaf', (px - 0.75, 2.0, pz + 0.25), 0.22, scale=(1.5, 0.4, 0.7), subdiv=1)
    ob = Pp.done(period=None); ob['outline'] = 0.8
    ob = Dr.done(period=None); ob['outline'] = 0.7
    ob = G.done(period=None); ob['outline'] = 0.0


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    """Riveted iron floor plates (one per 32-px tile, a rivet in each corner) under a brass-edged kerb."""
    rng = random.Random(seed)
    L = TH.GROUND
    c = TH.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_body', L, TH).box('fab_g_body', (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_plates', L, TH)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * K.T + K.CELL_MARGIN + 0.03, (col + 1) * K.T - K.CELL_MARGIN - 0.03
            z0, z1 = -row * K.T - K.CELL_MARGIN - 0.03 - (CAP_H if row == 0 else 0.0), -(row + 1) * K.T + K.CELL_MARGIN + 0.03
            xc, zc, w, h = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z0 - z1
            B.rbox(rng.choice(('fab_g_plate', 'fab_g_plate2')), (xc, -0.1, zc), (w, 0.3, h), bevel=0.06, segments=2)
            for sx in (-1, 1):
                for sz in (-1, 1):
                    B.sphere('fab_g_rivet', (xc + sx * (w / 2 - 0.13), -0.27, zc + sz * (h / 2 - 0.13)), 0.05, subdiv=1)
    B.done(period=None)
    B = Builder('ground_cap', L, TH)
    B.box('fab_g_cap', (GP / 2, 0.1, -0.03 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box('fab_g_cap_hi', (GP / 2, 0.06, -0.06), (GP + 0.6, 0.95, 0.07), bevel=0.0)
    B.done(period=None)
    return c


def clear():
    TH.clear()
