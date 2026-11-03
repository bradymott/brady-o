# Burning Man hero prop: a porta-potty (replaces BurnsProps.portapotty: 1.2 × 1.2 m, 2.46 tall, door on +Z).
# Vents under the roof line, a roof stack, a door with a latch sign, a grab handle. `body` is recoloured by the game.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_potty.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

def build(B):
    L = B.L
    M_body = paint('body', '#2a6ac8', coat=0.25, rough=0.45, metal=0.0)
    M_door = paint('door', '#1f55a6', coat=0.25, rough=0.45, metal=0.0)
    M_roof = mat('roof', '#eeeeee', rough=0.55, emit='#ffffff', strength=0.35)   # the translucent roof glows a touch
    M_dark = matte('vent', '#1a1a20', 0.7)
    B.obj('base', bm_box(1.3, 0.12, 1.3, (0, 0.06, 0)), matte('base', '#2a2a30'), bevel=0.03)
    B.obj('body', bm_box(1.2, 2.3, 1.2, (0, 1.15, 0)), M_body, bevel=0.09, bevel_angle=False)
    B.obj('roof', bm_box(1.3, 0.16, 1.3, (0, 2.38, 0)), M_roof, bevel=0.06, bevel_angle=False)
    B.obj('roof_dome', scale_bm(bm_uv(0.5, L['cyl_s'], 6, (0, 2.46, 0)), 1, 0.2, 1, (0, 2.46, 0)), M_roof)
    # vents: three louvre slots high on each side wall, a stack up the back
    for s in (1, -1):
        for k in range(3): B.obj('vent_%d_%d' % (k, s > 0), bm_box(0.03, 0.05, 0.6, (s * 0.605, 2.0 + k * 0.09, 0)), M_dark)
    for k in range(3): B.obj('vent_back_%d' % k, bm_box(0.6, 0.05, 0.03, (0, 2.0 + k * 0.09, -0.605)), M_dark)
    B.obj('stack', bm_cyl(0.06, 0.06, 0.5, 8, AY, (0.4, 2.55, -0.4)), satin('stack', '#dddddd'))
    B.obj('stack_cap', bm_cyl(0.1, 0.1, 0.05, 8, AY, (0.4, 2.8, -0.4)), satin('stack', '#dddddd'))
    # the door: a recessed darker panel with ribs, a latch sign, a handle, hinges
    B.obj('door', bm_box(0.9, 2.0, 0.05, (0, 1.1, 0.6)), M_door, bevel=0.02, bevel_angle=False)
    for k in range(3): B.obj('rib_%d' % k, bm_box(0.78, 0.035, 0.02, (0, 0.55 + k * 0.35, 0.63)), M_door)
    B.obj('sign_plate', bm_box(0.3, 0.16, 0.02, (0, 1.95, 0.635)), matte('plate', '#ffffff', 0.5), bevel=0.008)
    B.obj('sign_dot', bm_box(0.08, 0.08, 0.012, (-0.08, 1.95, 0.65)), led('#2ac84a', 2.0))
    B.obj('sign_bar', bm_box(0.12, 0.03, 0.012, (0.06, 1.95, 0.65)), matte('sign_text', '#1a1a1a', 0.6))
    B.obj('latch', bm_box(0.14, 0.06, 0.03, (0.32, 1.25, 0.64)), chrome(), bevel=0.01)
    B.obj('handle', bm_rod((0.34, 1.0, 0.66), (0.34, 1.16, 0.66), 0.014, 5), chrome())
    for y in (0.4, 1.1, 1.8): B.obj('hinge_%d' % int(y * 10), bm_box(0.05, 0.12, 0.04, (-0.46, y, 0.62)), matte('hinge', '#3a3a40'))
    # the hand-sanitiser box on the left wall
    B.obj('sani', bm_box(0.04, 0.22, 0.14, (0.62, 1.3, 0.2)), matte('sani', '#f0f0f0', 0.5), bevel=0.01)

if __name__ == '__main__':
    run_static('potty', build)
