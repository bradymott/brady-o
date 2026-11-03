# Bass Valentine (Art Cart car #1): a glossy black sound truck crowned with a beating heart.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bass_valentine.py
# Writes assets/models/art-cart/bass_valentine.glb (showroom, 20–30k tris) and bass_valentine_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#ff2a5a', '#ffb0c8', '#ff3a6a'   # CART_CARS.heart palette
SEAT_X = -0.6   # the driver sits on the car's right, so the heart doesn't hide him on the showroom turntable

def build(B):
    L = B.L; body = B.body
    M_paint = paint('paint_black', '#16121a', rough=0.28, metal=0.25)
    M_pink = glow('paint_pink', COL, strength=1.0)
    ledp, ledp2, ledw = led(LIGHT), led('#ff9ac8'), led('#ffffff')
    # ---- body: bevelled box with a slight tumblehome, dark skirt, wheel-arch pockets ----
    bm = bm_box(2.5, 1.0, 5.0, (0, 1.0, -0.1))
    for v in bm.verts:
        if v.co.z > 1.2: v.co.x *= 0.93
    shell = B.obj('shell', bm, M_paint, bevel=0.22)
    skirt = B.obj('skirt', bm_box(2.2, 0.3, 4.6, (0, 0.5, -0.1)), matte('skirt', '#0a080c'), bevel=0.08)
    for i, (x, z) in enumerate([(1.12, 1.7), (-1.12, 1.7), (1.12, -1.75), (-1.12, -1.75)]):
        B.cut([shell, skirt], bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.1, 0.5, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.66, 0.05, L['torus'], L['tube'], AX, (x, 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), dark_chrome())
    # glowing strips along the skirt, the nose, the tail and the deck edges
    for s in (1, -1):
        B.strip((s * 1.115, 0.66, 2.05), (s * 1.115, 0.66, -2.25), LIGHT)
        B.strip((s * 1.17, 1.49, 2.2), (s * 1.17, 1.49, -2.4), '#ff9ac8')
    B.strip((-1.0, 0.66, 2.2), (1.0, 0.66, 2.2), LIGHT); B.strip((-1.0, 0.66, -2.4), (1.0, 0.66, -2.4), LIGHT)
    for z in (2.48, -2.68): B.obj('bumper_%d' % (z > 0), bm_box(2.3, 0.14, 0.16, (0, 0.62, z)), chrome(), bevel=0.05, bevel_angle=False)
    # speakers along both flanks
    for s in (1, -1):
        for i, z in enumerate((-1.6, -0.35, 0.9)):
            B.speaker((s * 1.26, 1.05, z), AX if s > 0 else AXn, 0.3, 0.36, 'spk_%d_%d' % (s > 0, i), LIGHT)
    # grille: dark chrome plate, chrome bars, three rows of pink LEDs
    B.obj('grille', bm_box(1.9, 0.62, 0.12, (0, 1.0, 2.42)), dark_chrome(), bevel=0.04, bevel_angle=False)
    for r in range(3):
        y = 0.82 + r * 0.18
        B.obj('grille_bar_%d' % r, bm_rod((-0.9, y + 0.09, 2.49), (0.9, y + 0.09, 2.49), 0.02, L['rod']), chrome())
        B.leds((-0.8, y, 2.5), (0.8, y, 2.5), B.pick(9, 5), [LIGHT, '#ff9ac8'], 0.045, 4 if r == 1 else 0, prefix='gled%d' % r)
    B.lamps(0.95, 1.18, 2.42, -2.62, 1.05)
    # sub stack across the back with two cones facing backwards
    B.obj('sub', bm_box(2.2, 0.66, 0.8, (0, 1.82, -2.12)), satin('sub_box', '#1e1a24'), bevel=0.1, bevel_angle=False)
    for s in (1, -1): B.speaker((s * 0.55, 1.82, -2.54), AZn, 0.27, 0.29, 'sub_cone_%d' % (s > 0), LIGHT)
    # deck rail with posts and bulbs
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_rod((s * 1.15, 1.85, 1.6), (s * 1.15, 1.85, -1.4), 0.035, L['rod']), chrome())
        for z in (1.6, 0.1, -1.4): B.obj('post_%d_%d' % (s > 0, int(z * 10)), bm_rod((s * 1.15, 1.5, z), (s * 1.15, 1.85, z), 0.025, L['rod']), chrome())
        B.leds((s * 1.15, 1.9, 1.6), (s * 1.15, 1.9, -1.4), B.pick(8, 4), [LIGHT, '#ffffff'], 0.05, 0, prefix='rail%d' % (s > 0))
    # the heart's chrome pedestal with a glowing ring
    B.obj('pedestal', bm_cyl(0.42, 0.42, 0.55, L['cyl'], AY, (0, 1.775, 0.8)), chrome(), bevel=0.06)
    B.obj('pedestal_ring', bm_torus(0.42, 0.022, L['torus'], L['tube'], AY, (0, 2.06, 0.8)), ledp)
    # the heart: a puffy extruded profile, pulses to the beat (CART_GLB_PARTS.heart.heart)
    s = 1.35
    H = B.part('heart', (0, 3.15, 0.8))
    h = B.obj('heart_body', bm_profile(heart_pts(L['prof']), 0.84 * s), M_pink, parent=H)
    B.bevel(h, 0.26 * s, angle=True, segments=L['prof_bev'], profile=0.62)
    n = B.pick(16, 8)
    for i in range(n):
        a = i / n * TAU
        B.obj('heart_bulb_%d' % i, bm_ico(0.05, L['ico'], (math.sin(a) * 0.98, math.cos(a) * 0.8 + 0.02, 0.6)), ledw, parent=H)
    B.light(0, 3.2, 0.8, 4.2, LIGHT, big=1)
    for s_ in (1, -1):
        B.light(s_ * 0.4, 1.0, 2.5, 0.45, LIGHT, led=1); B.light(s_ * 1.3, 1.05, -0.35, 0.5, LIGHT, led=1)
    # wheels, seat (on the right), size info
    B.wheels(1.12, 1.7, -1.75, r=0.5, w=0.42, rim=COL2)
    B.seat(SEAT_X, 1.62, -1.25, col='#5a1a2a', accent=LIGHT)
    B.info(5.2, 2.6, 4.5, muzzle=(0, 3.0, 0.8), wheelR=0.5)

if __name__ == '__main__':
    run('bass_valentine', build)
