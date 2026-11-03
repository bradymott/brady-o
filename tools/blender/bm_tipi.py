# Burning Man hero prop: a canvas tipi (authored at r = 2.6, h = 5.6 like bcmTipi; the game scales it by opts.r and h).
# Nine poles crossing above the smoke hole, a patterned canvas with two painted bands, a door flap on +Z,
# a small warm glow at the top. Materials `canvas`, `band`, `band2` are recoloured per tipi by the game.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_tipi.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

R0, H0 = 2.6, 5.6

def build(B):
    L = B.L; r, h = R0, H0
    M_can = mat('canvas', '#ece0c4', rough=0.8); M_band = mat('band', '#8a4a2a', rough=0.75); M_band2 = mat('band2', '#2a6a5a', rough=0.75)
    M_pole = satin('pole', '#6a4a2a', 0.6)
    # the canvas cone: a lathe with a soft hem and a narrow neck; bands are thin rings just proud of it
    prof = [(r, 0), (r * 0.985, 0.18), (r * 0.83, h * 0.15), (r * 0.79, h * 0.2), (r * 0.7, h * 0.32), (r * 0.66, h * 0.36), (r * 0.1, h * 0.9), (r * 0.05, h * 0.95), (0, h * 0.96)]
    B.obj('canvas', bm_lathe(prof, 24, caps=False), M_can)
    B.obj('canvas_in', bm_lathe([(pr * 0.992, py) for pr, py in prof[:-1]], 24, caps=False, flip=True), mat('canvas_in', '#d8c49c', rough=0.85))
    B.obj('hem', bm_torus(r * 0.99, 0.03, 24, 6, AY, (0, 0.02, 0)), M_band)
    B.obj('band1', bm_lathe([(r * 0.838, h * 0.14), (r * 0.812, h * 0.185)], 24, caps=False), M_band)
    B.obj('band2', bm_lathe([(r * 0.708, h * 0.315), (r * 0.688, h * 0.345)], 24, caps=False), M_band2)
    # the pattern: a ring of diamonds below the lower band and a ring of dots above it
    for k in range(10):
        a = k / 10 * TAU + 0.31
        d = bm_profile([(0, -0.16), (0.11, 0), (0, 0.16), (-0.11, 0)], 0.03, (math.sin(a) * r * 0.9, h * 0.085, math.cos(a) * r * 0.9), M=rot(yaw=a, pitch=0.46))
        B.obj('diamond_%d' % k, d, M_band2 if k % 2 else M_band, bevel=0.01, bevel_angle=False)
    for k in range(12):
        a = k / 12 * TAU
        B.obj('dot_%d' % k, scale_bm(bm_uv(0.08, 8, 5, (math.sin(a) * r * 0.75, h * 0.26, math.cos(a) * r * 0.75)), 1, 1, 0.4, (math.sin(a) * r * 0.75, h * 0.26, math.cos(a) * r * 0.75)), M_band)
    # smoke flaps either side of the neck
    for sd in (-1, 1):
        B.obj('flap_%d' % (sd > 0), bm_box(0.36, 0.7, 0.03, (sd * 0.3, h * 0.86, -0.12), M=rot(yaw=sd * 0.9, pitch=0.35, roll=sd * 0.25)), mat('flap', '#dccfb0', rough=0.8), bevel=0.015, bevel_angle=False)
    # nine poles: from the ground ring up through the smoke hole, crossing above it
    for k in range(9):
        a = k / 9 * TAU + 0.3
        x0, z0 = math.sin(a) * r * 0.06, math.cos(a) * r * 0.06
        B.obj('pole_%d' % k, bm_rod((math.sin(a) * r * 0.9, 0.02, math.cos(a) * r * 0.9), (-x0 * 5, h * 1.22, -z0 * 5), 0.045, L['rod'], r1=0.03), M_pole)
    B.obj('lash', bm_torus(r * 0.1, 0.02, 10, 5, AY, (0, h * 0.99, 0)), matte('lash', '#3a2a1a'))
    # door: a dark oval opening and the pinned-back flap, both facing +Z
    B.obj('door', scale_bm(bm_uv(0.52, 12, 7, (0, 0.75, r * 0.9 - 0.05)), 1, 1.5, 0.08, (0, 0.75, r * 0.9 - 0.05), ), matte('door', '#2a1a10', 0.9))
    B.obj('door_flap', bm_box(0.6, 1.5, 0.03, (0.62, 0.8, r * 0.86), M=rot(yaw=-0.4, pitch=-0.18)), mat('flap', '#dccfb0', rough=0.8), bevel=0.012, bevel_angle=False)
    # the glow at the top (a lantern hung at the pole crossing) and a small one by the door
    B.obj('lantern', bm_ico(0.11, 1, (0, h * 1.03, 0)), led('#ffd890', 2.4))
    B.obj('lantern_hook', bm_rod((0, h * 0.99, 0), (0, h * 1.08, 0), 0.012, 4), matte('lash', '#3a2a1a'))
    B.obj('door_lamp', bm_ico(0.06, 1, (-0.6, 1.5, r * 0.88)), led('#ffd890', 2.4))

if __name__ == '__main__':
    run_static('tipi', build)
