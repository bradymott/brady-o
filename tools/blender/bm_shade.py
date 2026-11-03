# Burning Man hero prop: a camp shade structure (replaces BurnsProps.shade, authored at w = 5, d = 5, h = 2.9).
# The game emits the roots separately so any w × d × h fits: `body` (the sagging aluminet cover with its edge pipes,
# scaled w/5 × 1 × d/5 and lifted to h), `pole` (one pipe leg at the origin, placed at each corner and stretched to h),
# `guy` (one guy line + stake running from the pole top toward +X+Z, yawed per corner) and `lights` (the front
# string of bulbs, stretched to w). Materials: `cover` is recoloured from opts.col.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_shade.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

W0, D0, H0 = 5.0, 5.0, 2.9
NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a3a', '#9a6bff', '#ff3a6a']

def build(B):
    L = B.L
    M_cover = mat('cover', '#d8c8a8', rough=0.75)   # matte, like the procedural canvas (a self-lit sheet washed out against the sky)
    M_pipe = metal('pipe', '#9a9aa4', 0.35)
    # the cover: a sheet that sags between the four corners, two-sided
    def top(u, v, dy=0.0):
        x, z = (u - 0.5) * (W0 + 0.2), (v - 0.5) * (D0 + 0.2)
        return (x, H0 + 0.03 - math.sin(math.pi * u) * math.sin(math.pi * v) * 0.32 + dy, z)
    B.obj('cover', merge(bm_surf(14, 14, top), flip(bm_surf(14, 14, lambda u, v: top(u, v, -0.012)))), M_cover)
    # edge pipes and the two diagonal ridge cables that hold the sag
    c = [(W0 / 2, H0, D0 / 2), (-W0 / 2, H0, D0 / 2), (-W0 / 2, H0, -D0 / 2), (W0 / 2, H0, -D0 / 2)]
    for k in range(4): B.obj('edge_%d' % k, bm_rod(c[k], c[(k + 1) % 4], 0.035, L['rod']), M_pipe)
    for k in range(4): B.obj('corner_%d' % k, bm_ico(0.07, 1, c[k]), M_pipe)
    # one pole (root `pole`): a pipe leg with a foot plate and a clamp at the top
    Pole = B.bone('pole', (0, 0, 0))
    B.obj('pole_pipe', bm_rod((0, 0, 0), (0, H0 - 0.02, 0), 0.05, L['rod']), M_pipe, parent=Pole)
    B.obj('pole_foot', bm_cyl(0.16, 0.16, 0.04, 10, AY, (0, 0.02, 0)), matte('foot', '#5a5a62'), parent=Pole)
    B.obj('pole_clamp', bm_cyl(0.075, 0.075, 0.12, 8, AY, (0, H0 - 0.08, 0)), matte('clamp', '#3a3a42'), parent=Pole)
    B.obj('pole_band', bm_torus(0.055, 0.012, 10, 5, AY, (0, 1.2, 0)), matte('tape', '#ff4fd8'), parent=Pole)
    # one guy line (root `guy`): a thin cable from the pole top out to a stake toward +X+Z, with a flag of tape
    G = B.bone('guy', (0, 0, 0))
    B.obj('guy_line', bm_rod((0.02, H0 - 0.1, 0.02), (0.95, 0.04, 0.95), 0.012, 4), matte('cable', '#2a2a2e', 0.7), parent=G)
    B.obj('guy_stake', bm_rod((0.9, 0.3, 0.9), (1.02, -0.02, 1.02), 0.02, 5), M_pipe, parent=G)
    B.obj('guy_flag', bm_box(0.12, 0.08, 0.02, (0.5, H0 * 0.45, 0.5), M=rot(yaw=0.78)), matte('flag', '#ffe24a', 0.6), parent=G)
    # the front string of lights (root `lights`): a sagging wire with ten bulbs
    Li = B.bone('lights', (0, 0, 0))
    pts = catenary((-W0 / 2, H0 - 0.15, D0 / 2), (W0 / 2, H0 - 0.15, D0 / 2), 0.3, 9)
    for i in range(9): B.obj('wire_%d' % i, bm_rod(pts[i], pts[i + 1], 0.008, 4), matte('cable', '#2a2a2e', 0.7), parent=Li)
    for i, p in enumerate(pts[:10]):
        B.obj('bulb_%d' % i, bm_ico(0.05, 1, (p[0], p[1] - 0.05, p[2])), led(NEON[i % 7], 3.0), parent=Li)
        B.obj('socket_%d' % i, bm_cyl(0.018, 0.018, 0.04, 6, AY, (p[0], p[1] - 0.01, p[2])), matte('socket', '#1a1a1e'), parent=Li)

if __name__ == '__main__':
    run_static('shade', build)
