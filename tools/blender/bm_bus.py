# Burning Man hero prop: a converted school bus at rest (replaces BurnsProps.bus: 2.5 × 11 m, roof deck 3.2, front +Z).
# An original stripes-and-dots paint job, a rounded roof with a deck rail, a window strip, chunky bumpers.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_bus.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

L_, W, H = 11.0, 2.5, 3.1
ZF, ZB = L_ / 2, -L_ / 2
NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a3a', '#9a6bff', '#ff3a6a']

def build(B):
    L = B.L
    M_body = paint('body', '#e8b020', coat=0.5, rough=0.32, metal=0.05)   # recoloured from opts.col by the game
    M_dark = matte('dark', '#26262c'); M_glass = metal('glass', '#1a2232', 0.12); M_lit = led('#ffc070', 2.6)
    M_alu = metal('alu', '#d8d8de', 0.3); M_wood = satin('deck', '#8a5a3a', 0.7); M_rail = metal('rail', '#2a2a30', 0.3)
    B.obj('chassis', bm_box(W - 0.3, 0.3, L_ - 0.5, (0, 0.5, 0)), M_dark, bevel=0.05)
    body = B.obj('body', bm_box(W, H - 0.75, L_ - 0.8, (0, (0.75 + H) / 2, -0.4)), M_body, bevel=0.34, bevel_angle=False)
    hood = B.obj('hood', bm_box(W - 0.1, 0.75, 1.2, (0, 1.1, ZF - 0.6)), M_body, bevel=0.22, bevel_angle=False)
    for i, z in enumerate((ZF - 1.4, ZB + 2.0)):
        for s in (1, -1):
            B.cut([body, hood] if z > 3 else [body], bm_cyl(0.62, 0.62, 0.5, L['arch'], AX, (s * 1.2, 0.48, z)), 'arch_%d_%d' % (i, s > 0))
    # rounded roof cap (a squashed capsule along the bus), the deck above it
    B.obj('roofcap', scale_bm(bm_cyl(W / 2 - 0.1, W / 2 - 0.1, ZF - 1.4 - (ZB + 0.5), L['cyl'], AZ, (0, H - 0.02, (ZB + 0.5 + ZF - 1.4) / 2)), 1, 0.24, 1, (0, H - 0.02, 0)), M_body)
    # paint job: a wide darker belt, a thin bright stripe, and rows of dots along the belt
    M_belt = paint('belt', '#2a4a8a', coat=0.3, rough=0.35); M_stripe = paint('stripe', '#ffffff', coat=0.3, rough=0.35)
    for s in (1, -1):
        x = s * (W / 2 + 0.012)
        B.obj('belt_%d' % (s > 0), bm_box(0.025, 0.55, L_ - 1.3, (x, 1.3, -0.4)), M_belt, bevel=0.01)
        B.obj('stripe_%d' % (s > 0), bm_box(0.025, 0.07, L_ - 1.3, (x, 1.66, -0.4)), M_stripe, bevel=0.008)
        B.obj('stripe2_%d' % (s > 0), bm_box(0.025, 0.07, L_ - 1.3, (x, 0.95, -0.4)), M_stripe, bevel=0.008)
        for i in range(9):
            z = ZB + 1.1 + i * 1.1
            B.obj('dot_%d_%d' % (i, s > 0), scale_bm(bm_uv(0.15, 10, 6, (x + s * 0.01, 1.3, z)), 0.25, 1, 1, (x + s * 0.01, 1.3, z)), paint('dot_%d' % (i % 4), ['#ff4fd8', '#ffe24a', '#38f2ff', '#7aff5a'][i % 4], coat=0.5, rough=0.3))
    # the window strip: seven framed windows a side, alternately lit
    for i in range(7):
        z = ZB + 0.9 + i * 1.35
        for s in (1, -1):
            B.obj('win_frame_%d_%d' % (i, s > 0), bm_box(0.03, 0.7, 1.1, (s * (W / 2 + 0.005), 2.25, z)), matte('frame', '#1e1e24', 0.6))
            B.obj('win_%d_%d' % (i, s > 0), bm_box(0.03, 0.6, 1.0, (s * (W / 2 + 0.02), 2.25, z)), M_lit if (i + (s > 0)) % 3 == 0 else M_glass, bevel=0.012)
    B.obj('windscreen', bm_box(W - 0.3, 0.9, 0.05, (0, 2.1, ZF - 1.21)), M_glass, bevel=0.02)
    for s in (1, -1):
        B.obj('headlamp_%d' % (s > 0), bm_cyl(0.16, 0.16, 0.06, L['cyl_s'], AZ, (s * 0.85, 1.15, ZF + 0.02)), M_lit)
        B.obj('headlamp_ring_%d' % (s > 0), bm_torus(0.17, 0.025, L['torus'], L['tube'], AZ, (s * 0.85, 1.15, ZF + 0.02)), chrome())
        B.obj('taillamp_%d' % (s > 0), bm_box(0.2, 0.35, 0.05, (s * 1.0, 1.0, ZB + 0.38)), led('#ff2a2a', 2.5), bevel=0.02)
        B.obj('mirror_arm_%d' % (s > 0), bm_rod((s * (W / 2 - 0.05), 2.1, ZF - 1.0), (s * (W / 2 + 0.4), 2.2, ZF - 1.0), 0.022, 5), M_dark)
        B.obj('mirror_%d' % (s > 0), bm_box(0.06, 0.4, 0.22, (s * (W / 2 + 0.43), 2.2, ZF - 1.0)), M_dark, bevel=0.02)
    B.obj('grille', bm_box(1.3, 0.45, 0.06, (0, 1.1, ZF + 0.01)), M_dark, bevel=0.03)
    for k in range(4): B.obj('grille_bar_%d' % k, bm_box(1.1, 0.04, 0.03, (0, 0.95 + k * 0.1, ZF + 0.04)), chrome())
    # folding door at the front right (-X), a step
    B.obj('door', bm_box(0.04, 1.9, 0.9, (-W / 2 - 0.01, 1.7, ZF - 2.0)), M_glass, bevel=0.015)
    B.obj('door_split', bm_box(0.05, 1.9, 0.04, (-W / 2 - 0.015, 1.7, ZF - 2.0)), M_dark)
    B.obj('step', bm_box(0.3, 0.06, 0.8, (-W / 2 - 0.15, 0.55, ZF - 2.0)), matte('step', '#3a3a40'), bevel=0.02)
    for z in (ZF + 0.06, ZB - 0.06):
        B.obj('bumper_%d' % (z > 0), bm_box(W + 0.02, 0.26, 0.22, (0, 0.64, z)), M_dark, bevel=0.09, bevel_angle=False)
        B.obj('bumper_strip_%d' % (z > 0), bm_box(W * 0.84, 0.05, 0.03, (0, 0.67, z + (0.11 if z > 0 else -0.11))), chrome())
    for i, z in enumerate((ZF - 1.4, ZB + 2.0)):
        for s in (1, -1):
            x = s * (W / 2 - 0.13)
            B.obj('tyre_%d_%d' % (i, s > 0), bm_cyl(0.48, 0.48, 0.3, L['cyl'], AX, (x, 0.48, z)), rubber(), bevel=0.1)
            B.obj('rim_%d_%d' % (i, s > 0), bm_cyl(0.27, 0.27, 0.26, L['cyl_s'], AX, (x, 0.48, z)), M_alu, bevel=0.03)
            B.obj('hub_%d_%d' % (i, s > 0), bm_cyl(0.08, 0.08, 0.3, 8, AX, (x, 0.48, z)), satin('grey', '#9a9aa2'))
    # roof deck: planks, posts, a top rail, bulbs along both rails, a couch at the back
    B.obj('deck', bm_box(W - 0.2, 0.1, 6, (0, H + 0.05, -0.8)), M_wood, bevel=0.02)
    for k in range(9): B.obj('plank_%d' % k, bm_box(W - 0.3, 0.012, 0.05, (0, H + 0.105, -3.6 + k * 0.7)), matte('plank_gap', '#5a3a22', 0.8))
    for s in (1, -1):
        x = s * (W / 2 - 0.12)
        B.obj('rail_%d' % (s > 0), bm_rod((x, H + 0.6, -3.8), (x, H + 0.6, 2.2), 0.03, L['rod']), M_rail)
        B.obj('rail_mid_%d' % (s > 0), bm_rod((x, H + 0.35, -3.8), (x, H + 0.35, 2.2), 0.018, 5), M_rail)
        for k in range(5): B.obj('post_%d_%d' % (k, s > 0), bm_rod((x, H + 0.05, -3.6 + k * 1.4), (x, H + 0.62, -3.6 + k * 1.4), 0.025, 5), M_rail)
        for i in range(8): B.obj('bulb_%d_%d' % (i, s > 0), bm_ico(0.055, L['ico'], (x, H + 0.68, -3.8 + i * 0.85)), led(NEON[i % 7], 3.0))
    B.obj('rail_back', bm_rod((-(W / 2 - 0.12), H + 0.6, -3.8), (W / 2 - 0.12, H + 0.6, -3.8), 0.03, L['rod']), M_rail)
    M_couch = satin('couch', '#a02a5a', 0.6)
    B.obj('couch_seat', bm_box(1.8, 0.5, 0.7, (0, H + 0.35, -2.4)), M_couch, bevel=0.1, bevel_angle=False)
    B.obj('couch_back', bm_box(1.8, 0.6, 0.18, (0, H + 0.6, -2.7)), M_couch, bevel=0.07, bevel_angle=False)
    for s in (1, -1): B.obj('couch_arm_%d' % (s > 0), bm_box(0.18, 0.3, 0.7, (s * 0.85, H + 0.7, -2.4)), M_couch, bevel=0.06, bevel_angle=False)
    # roof hatch and a stovepipe
    B.obj('hatch', bm_box(0.7, 0.08, 0.7, (0, H + 0.12, 2.9)), satin('hatch', '#e8e0d0'), bevel=0.03)
    B.obj('pipe', bm_cyl(0.07, 0.07, 0.9, L['cyl_s'], AY, (0.8, H + 0.45, 3.2)), M_alu)
    B.obj('pipe_cap', bm_cyl(0.14, 0.14, 0.06, L['cyl_s'], AY, (0.8, H + 0.93, 3.2)), M_alu)

if __name__ == '__main__':
    run_static('bus', build)
