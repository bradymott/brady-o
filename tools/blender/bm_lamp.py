# Burning Man prop: the Esplanade lamp post (BurnsOW.lampPost, the `ow_lamp` prototype: about 40 line the Esplanade and
# the promenades). A weathered wooden pole 6.8 m tall on an iron foot, an iron crook with a scroll brace reaching 0.6 m
# toward +Z, and a hanging lantern: iron frame, a little hipped roof with a finial, four warm glass panes that glow at
# night (the lamplighters light them at dusk) around a bright mantle. Baked: AO, dust up the pole, grain streaks.
# Levels: hi (near) and lo (mid). Live Blender:  import runpy; runpy.run_path('<repo>/tools/blender/bm_lamp.py', run_name='__main__')
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

PH = 6.8                    # pole height
LZ, LY = 0.6, 6.35          # lantern centre (z out along the crook, y)

def build(B):
    lo = B.lo; slim(B, keep=())
    M_wood = satin('wood', '#6e4c32', 0.75)
    M_iron = mat('iron', '#2a2a30', rough=0.45, metal=0.6)
    M_glass = glow('lantern_glass', '#ffc070', strength=2.0, rough=0.3, coat=0.0)
    M_core = led('#fff0d0', 4.0)
    # pole: an octagonal turned post, slightly tapered, with a chamfered top
    seg = B.pick(8, 6)
    B.obj('pole', bm_lathe([(0.0, 0.0), (0.11, 0.0), (0.105, 1.2), (0.085, PH - 0.15), (0.06, PH), (0.0, PH + 0.02)], seg, caps=False), M_wood, smooth=False)
    # iron foot collar and the ground plate
    B.obj('foot', bm_cyl(0.16, 0.14, 0.5, seg, AY, (0, 0.25, 0)), M_iron)
    if not lo:
        B.obj('plate', bm_box(0.6, 0.06, 0.6, (0, 0.03, 0)), M_iron, bevel=0.02, bevel_angle=False)
        B.obj('band', bm_cyl(0.1, 0.1, 0.08, seg, AY, (0, PH - 0.9, 0)), M_iron)
    # the crook: an arm out to the lantern and a scrolled brace under it
    arm = catmull([(0, PH - 0.25, 0), (0, PH - 0.05, 0.2), (0, PH - 0.02, 0.45), (0, PH - 0.08, LZ)], B.pick(8, 3))
    B.obj('arm', bm_tube(arm, 0.028, B.pick(6, 3), caps=False), M_iron)
    if not lo:
        brace = catmull([(0, PH - 0.9, 0.08), (0, PH - 0.6, 0.2), (0, PH - 0.32, 0.36), (0, PH - 0.12, 0.42)], 8)
        B.obj('brace', bm_tube(brace, 0.016, 5, caps=False), M_iron)
        scroll = [(0, PH - 0.55 + 0.09 * math.sin(a), 0.26 + 0.09 * math.cos(a)) for a in [i / 10 * TAU * 0.85 for i in range(11)]]
        B.obj('scroll', bm_tube(scroll, 0.012, 4, caps=False), M_iron)
        B.obj('hook', bm_rod((0, PH - 0.08, LZ), (0, LY + 0.36, LZ), 0.012, 4), M_iron)
    # the lantern: roof, finial, frame posts, glass panes, the base and the bright mantle inside
    w = 0.32; top = LY + 0.24; bot = LY - 0.22
    B.obj('roof', bm_cyl(w * 0.75, 0.02, 0.16, 4, rot(yaw=math.pi / 4), (0, top + 0.08, LZ)), M_iron)
    B.obj('lantern_base', bm_box(w * 0.95, 0.06, w * 0.95, (0, bot - 0.03, LZ)), M_iron)
    if not lo:
        B.obj('finial', bm_ico(0.035, 1, (0, top + 0.2, LZ)), M_iron)
        B.obj('cap_ring', bm_box(w + 0.04, 0.04, w + 0.04, (0, top, LZ)), M_iron)
        for sx in (-1, 1):
            for sz in (-1, 1):
                B.obj('post_%d_%d' % (sx > 0, sz > 0), bm_box(0.025, top - bot, 0.025, (sx * w / 2, LY + 0.01, LZ + sz * w / 2)), M_iron)
        B.obj('drip', bm_cyl(0.05, 0.02, 0.08, 6, AY, (0, bot - 0.1, LZ)), M_iron)
    B.obj('glass', bm_box(w - 0.02, top - bot - 0.02, w - 0.02, (0, LY + 0.01, LZ)), M_glass)
    if not lo: B.obj('mantle', bm_capsule(0.05, 0.16, 8, 3, (0, LY, LZ)), M_core)

def shade(x, y, z, nx, ny, nz, m):
    r, g, b = dusty(1.0, col=(0.86, 0.78, 0.66))(x, y, z, nx, ny, nz, m)
    if m == 'wood':   # grain: long darker streaks round the pole, a sun-greyed top
        k = 0.88 + 0.12 * math.sin(math.atan2(x, z) * 7 + y * 0.6) ** 2
        g2 = 1.0 + 0.1 * min(1.0, max(0.0, (y - 4.5) / 2))
        r, g, b = r * k * g2, g * k * g2, b * k * (g2 + 0.04)
    return min(1, r), min(1, g), min(1, b)

if __name__ == '__main__':
    run_prop('lamp', build, bake=dict(ao_dist=0.25, ao_k=0.6, rays=12, shade_fn=shade), max_tris={'hi': 900, 'lo': 200},
             views=[((0.9, -0.9, 0.2), 'front'), ((-0.6, -0.9, 0.9), 'top')])
