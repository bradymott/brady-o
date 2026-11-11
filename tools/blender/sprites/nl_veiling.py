# Netherlands overhaul theme nl_veiling (8-2 "Flower Auction", level overhaul §8: N nl_veiling): original toon art for
# the inside of a giant flower-auction hall, built with the Amsterdam toolkit (nl_canals.py).
# Suggested theme entry: sky ['#c8d4dc', '#dce4e8', '#eef2f0'], ground 'metal', layers
#   [{kind:'nlAuction', color:'#9aa8b0', base:360, f:0.08}].
#   L0  nlAuction (base 360, f 0.08): a full backdrop of the hall: pale steel-clad walls under zig-zag roof trusses
#                 and skylight strips, the great auction clock (a ring of lamps round a dial with one pointer, our own
#                 design, no text) high on the wall above three rows of buyers' chairs, overhead trolley rails, and trains
#                 of flower trolleys (tiered racks of tulip buckets in many colours) along the floor line
#   ground metal: a painted concrete hall floor: grey slabs under a yellow-edged kerb cap
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, OVER, PPM, TAU, jittered, wraps

MODULE = 'nl_veiling'
LAYERS = ['L0']
BASES = {'L0': 360}
SKY = ['#c8d4dc', '#dce4e8', '#eef2f0']
TULIPS = ('ve_t0', 've_t1', 've_t2', 've_t3', 've_t4', 've_t5')
PALETTE = {
    've_wall': '#b4c0c6', 've_wall2': '#a8b4bc', 've_seam': '#98a4ac', 've_truss': '#6a7884', 've_sky': '#e8f4f8', 've_floorline': '#8a969e',
    've_clock': '#3a4450', 've_dial': '#f4f0e4', 've_lamp_glow': '#ffd84a', 've_lamp_off': '#8a8a80', 've_hand': '#e8322a', 've_screen': '#2a3a4a',
    've_screen_glow': '#7ad8a8', 've_bench': '#4a6a8a', 've_bench2': '#3a5a7a', 've_rail': '#5a6672',
    've_cart': '#d8dcdc', 've_cart2': '#a8b0b4', 've_wheel': '#2a2e34', 've_bucket': '#2a7a4a', 've_leaf': '#3a8a3a',
    've_t0': '#e8322a', 've_t1': '#ffd23a', 've_t2': '#ff6ab8', 've_t3': '#ff8a1a', 've_t4': '#b84aff', 've_t5': '#ffffff',
    've_g_cap': '#9aa2a8', 've_g_cap_hi': '#ffd23a', 've_g_mortar': '#6a7278',
    've_g_brick_a': '#8a9298', 've_g_brick_b': '#7e868c', 've_g_brick_c': '#949ca2', 've_g_brick_d': '#747c82',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def auction_clock(B, G, x, z, R):
    B.lathe('ve_clock', [(R + 0.35, 0.0), (R + 0.35, 0.25), (0.0, 0.25)], 32, at=(x, 2.2, z), rot=(math.pi / 2, 0, 0), cap_bottom=True)
    B.lathe('ve_dial', [(R - 0.2, 0.0), (R - 0.2, 0.04), (0.0, 0.04)], 32, at=(x, 1.93, z), rot=(math.pi / 2, 0, 0), cap_bottom=True)
    n = 48
    for k in range(n):
        a = TAU * k / n
        role = 've_lamp_glow' if (k < 17) else 've_lamp_off'
        G.sphere(role, (x + math.sin(a) * R * 1.02, 1.88, z + math.cos(a) * R * 1.02), 0.09, subdiv=1)
    a = TAU * 16 / n
    B.rod('ve_hand', (x, 1.85, z), (x + math.sin(a) * (R - 0.35), 1.85, z + math.cos(a) * (R - 0.35)), 0.08, segs=5)
    B.sphere('ve_hand', (x, 1.83, z), 0.16, subdiv=1)
    for k in range(4):
        B.box('ve_screen', (x - 1.5 + 1.0 * k, 2.0, z - R - 1.0), (0.8, 0.08, 0.5), bevel=0.03)
        G.box('ve_screen_glow', (x - 1.5 + 1.0 * k, 1.94, z - R - 1.0), (0.6, 0.02, 0.08), bevel=0.0)


def trolley(B, x, y, rng):
    w, h = 1.3, 1.9
    for k in range(4):
        z = 0.25 + k * 0.48
        B.box('ve_cart', (x, y, z), (w, 0.6, 0.05), bevel=0.0)
        for j in range(4):
            bx = x - w / 2 + 0.17 + j * 0.32
            B.lathe('ve_bucket', [(0.12, 0.0), (0.14, 0.2)], 8, at=(bx, y - 0.1, z + 0.02), cap_top=True, cap_bottom=True)
            col = rng.choice(TULIPS)
            for i in range(3):
                B.sphere(col, (bx - 0.07 + 0.07 * i, y - 0.16, z + 0.3 + 0.03 * (i % 2)), 0.06, scale=(0.9, 0.9, 1.3), subdiv=1)
    for sx in (-w / 2, w / 2):
        B.rod('ve_cart2', (x + sx, y - 0.3, 0.1), (x + sx, y - 0.3, h + 0.1), 0.03, segs=4)
    for sx in (-w / 2 + 0.15, w / 2 - 0.15):
        B.sphere('ve_wheel', (x + sx, y - 0.3, 0.08), 0.09, subdiv=1)


def build_L0(rng):
    L = 'L0'
    NC.strip_box(TH, L, 'L0_wall', 've_wall', 14.0, -4.0, 2.6, 4.0)
    B = Builder('L0_hall', L, TH)
    G = Builder('L0_glow', L, TH)
    # wall cladding seams and a darker dado band
    for k in range(int(P / 1.2)):
        x = k * 1.2
        B.box('ve_seam', (x, 2.55, 6.0), (0.05, 0.02, 12.0), bevel=0.0)
    B.box('ve_wall2', (P / 2, 2.52, 1.0), (P + 2 * OVER, 0.04, 2.0), bevel=0.0)
    B.box('ve_floorline', (P / 2, 2.5, -2.0), (P + 2 * OVER, 0.04, 4.0), bevel=0.0)
    # roof trusses and skylight strips high up
    zt = 10.6
    B.box('ve_truss', (P / 2, 2.3, zt), (P + 2 * OVER, 0.1, 0.18), bevel=0.0)
    B.box('ve_truss', (P / 2, 2.3, zt + 1.6), (P + 2 * OVER, 0.1, 0.18), bevel=0.0)
    for k in range(int(P / 1.6) + 1):
        x0 = k * 1.6
        B.rod('ve_truss', (x0, 2.3, zt), (x0 + 0.8, 2.3, zt + 1.6), 0.05, segs=4)
        B.rod('ve_truss', (x0 + 0.8, 2.3, zt + 1.6), (x0 + 1.6, 2.3, zt), 0.05, segs=4)
    for k in range(6):
        x = (k + 0.5) * P / 6
        G.box('ve_sky', (x, 2.4, zt + 2.4), (3.6, 0.04, 0.5), bevel=0.0)
    # overhead trolley rails
    B.box('ve_rail', (P / 2, 2.2, 7.6), (P + 2 * OVER, 0.12, 0.1), bevel=0.0)
    for k in range(int(P / 4.0)):
        B.rod('ve_rail', (k * 4.0 + 1.0, 2.25, 7.6), (k * 4.0 + 1.0, 2.25, 10.6), 0.035, segs=4)
    # the great clock and its tiered benches, once per period
    cx = P * 0.5
    auction_clock(B, G, cx, 5.6, 1.9)
    # the buyers' seats: three rows of round-backed chairs climbing behind each other (no solid steps)
    for r in range(3):
        n = 9 - 2 * r
        for k in range(n):
            sx = cx - (n - 1) * 0.42 + k * 0.84
            role = ('ve_bench', 've_bench2')[(r + k) % 2]
            B.rbox(role, (sx, 2.1 - 0.1 * r, 0.35 + 0.55 * r), (0.6, 0.4, 0.16), bevel=0.06, segments=2)
            B.rbox(role, (sx, 2.25 - 0.1 * r, 0.62 + 0.55 * r), (0.6, 0.1, 0.5), bevel=0.12, segments=2)
            B.rod('ve_rail', (sx, 2.0 - 0.1 * r, 0.0), (sx, 2.0 - 0.1 * r, 0.35 + 0.55 * r), 0.03, segs=4)
    # trolley trains along the floor line
    x = 1.0
    while x < P - 1.6:
        if abs(x - cx) < 4.8:
            x = cx + 4.8
            continue
        n = rng.randrange(2, 5)
        for j in range(n):
            for dx in wraps(x + j * 1.45, 0.8):
                trolley(B, x + j * 1.45 + dx, 1.5, rng)
        x += n * 1.45 + rng.uniform(1.4, 3.0)
    B.done(period=None)['outline'] = 0.6
    G.done(period=None)['outline'] = 0


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed + 3)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return NC.brick_ground(TH, random.Random(seed), {'cap': 've_g_cap', 'cap_hi': 've_g_cap_hi', 'mortar': 've_g_mortar',
                                                     'brick_a': 've_g_brick_a', 'brick_b': 've_g_brick_b', 'brick_c': 've_g_brick_c', 'brick_d': 've_g_brick_d'})


def clear():
    TH.clear()
