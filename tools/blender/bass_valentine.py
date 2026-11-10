# Bass Valentine (Art Cart car #1): a rolling sound system with a giant beating heart on top. The quality-bar car.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/bass_valentine.py', run_name='__main__')
# Writes assets/models/art-cart/bass_valentine.glb (showroom, <= 30k tris) and bass_valentine_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['heart:2'] in src/43_cart_bb_glb.js):
#   part_heart                  the puffy heart, joint at its centre (it beats lub-dub)
#   part_coneL0..2 / coneR0..2  the flank speaker cones + dust caps, joint on the panel (they pump outwards)
#   part_subL / part_subR       the two rear subwoofer cones (they pump backwards)
# body extras: rigV = 2, extra.sight = the heart's top (the chase camera rises just enough to see the road over it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#ff2a5a', '#ffb0c8', '#ff3a6a'   # CART_CARS.heart palette
SEAT_X = -0.6          # the driver sits on the car's right, so the heart doesn't hide him on the showroom turntable
HY, HZ = 2.56, 0.6     # the heart's centre (its top is at HY + 0.86, the tip at HY - 0.95)
HULL_W, HULL_Y, HULL_H, HULL_R = 2.46, 1.0, 0.98, 0.2   # the body tub: width, centre height, height (deck ~1.49), corner

def hull_ring(z, w, h, r, seg, yc=HULL_Y, splits=(0.64,)):
    """One rounded-rectangle section of the body at z, with extra points on the straight sides at the heights in
    `splits` (absolute y) so the two-tone paint line and the chrome trims land on real edges."""
    pts = rrect_pts(w, h, r, seg); out = []
    lo_y, hi_y = -h / 2 + r + 0.004, h / 2 - r - 0.004
    ys = sorted(min(hi_y, max(lo_y, s - yc)) for s in splits)
    for i, (x, y) in enumerate(pts):
        out.append((x, y)); nx, ny = pts[(i + 1) % len(pts)]
        if abs(x - w / 2) < 1e-6 and abs(nx - w / 2) < 1e-6 and ny > y: out += [(w / 2, s) for s in ys if y < s < ny]
        if abs(x + w / 2) < 1e-6 and abs(nx + w / 2) < 1e-6 and ny < y: out += [(-w / 2, s) for s in reversed(ys) if ny < s < y]
    return [(x, yc + y, z) for x, y in out]

def build(B):
    L = B.L; lo = B.lo
    B.export_try = VCOL_EXPORT   # the heart's candy gradient is a vertex colour
    # ---- materials: deep black-cherry clear coat over a gloss-black sill, chrome, glass, candy heart, LEDs ----
    M_paint = paint('paint_cherry', '#560f30', coat=1.0, rough=0.2, metal=0.3)
    M_sill = paint('paint_black', '#121014', coat=1.0, rough=0.22, metal=0.2)
    M_deck = matte('deck_mat', '#0d0b10', 0.9)   # a matte dance-floor mat: no grazing sky glare on the flat top
    M_glass = mat('glass', '#1c2433', rough=0.04, extras={'burns_gloss': 3})
    M_heart = glow('heart_candy', '#ff5c86', strength=0.9, rough=0.12, coat=1.0)
    M_cradle = chrome(); M_dch = dark_chrome()
    ledp, ledp2, ledw, ledwarm = led(LIGHT), led('#ff9ac8'), led('#ffffff'), led('#fff0d8')

    # ---- the body tub: lofted rounded sections (soft nose, squarer tail), two-tone below the sill line ----
    cs = B.pick(6, 2)
    rings = [hull_ring(2.66, 1.96, 0.56, 0.2, cs), hull_ring(2.6, 2.24, 0.8, 0.24, cs), hull_ring(2.48, 2.42, 0.95, 0.26, cs),
             hull_ring(2.3, HULL_W, HULL_H, HULL_R, cs)]
    if not lo: rings += [hull_ring(0.0, HULL_W, HULL_H, HULL_R, cs)]
    rings += [hull_ring(-2.45, HULL_W, HULL_H, HULL_R, cs), hull_ring(-2.62, 2.36, 0.88, 0.24, cs), hull_ring(-2.72, 2.06, 0.62, 0.2, cs)]
    shell = B.obj('shell', bm_loft(rings, closed_u=True, caps=True), [M_paint, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < 0.7 else 0)
    for i, (x, z) in enumerate([(1.12, 1.7), (-1.12, 1.7), (1.12, -1.75), (-1.12, -1.75)]):
        B.cut([shell], bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.1, 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.035, L['torus'], B.pick(4, 3), AX, (math.copysign(HULL_W / 2 + 0.005, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), chrome())
    # chrome shoulder lines along the deck edge (they catch the sky) and the gloss-black sill's pink under-glow
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 1.09, 1.435, 2.42), (s * 1.152, 1.445, 1.6), (s * 1.152, 1.445, -1.8), (s * 1.1, 1.43, -2.55)], B.pick(12, 4)), 0.022, B.pick(8, 4)), chrome())
        B.strip((s * 1.13, 0.53, 2.2), (s * 1.13, 0.53, -2.3), LIGHT, th=0.04)
        B.light(s * 1.0, 0.3, 0.0, 2.4, LIGHT, led=1)
    B.strip((-0.95, 0.53, 2.62), (0.95, 0.53, 2.62), LIGHT, th=0.04); B.strip((-0.95, 0.53, -2.68), (0.95, 0.53, -2.68), LIGHT, th=0.04)
    B.obj('deck', bm_box(1.9, 0.03, 4.5, (0, 1.495, -0.12)), M_deck, bevel=0.012, bevel_angle=False, segments=1)
    for s in (1, -1): B.strip((s * 0.96, 1.515, 2.05), (s * 0.96, 1.515, -1.75), '#ff9ac8', th=0.025)   # pink LED piping along the mat

    # ---- the face: chrome-framed grille with three bars and pink LEDs, bezelled headlights ----
    B.obj('grille_back', bm_box(1.0, 0.42, 0.04, (0, 0.98, 2.65)), M_dch)
    B.obj('grille_frame', bm_rrect_tube(1.04, 0.46, 0.08, 0.026, B.pick(4, 1), B.pick(8, 4), at=(0, 0.98, 2.675), axis=AZ), chrome())
    for k, y in enumerate((0.86, 0.98, 1.1)):
        B.obj('grille_bar_%d' % k, bm_rod((-0.49, y, 2.685), (0.49, y, 2.685), 0.016, L['rod']), chrome())
    for k, y in enumerate((0.92, 1.04)):
        B.leds((-0.4, y, 2.69), (0.4, y, 2.69), B.pick(7, 4), [LIGHT, '#ff9ac8'], 0.03, 4 if k == 0 else 0, prefix='gled%d' % k)
    for s in (1, -1):
        hx = s * 0.8
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.15, -0.05), (0.16, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 1.12, 2.63)), M_dch)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.155, 0.026, L['torus'], B.pick(4, 3), AZ, (hx, 1.12, 2.645)), chrome())
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.13, 0.035, 0.13, L['cyl_s'], B.pick(5, 2), (hx, 1.12, 2.64), phi1=math.pi / 2, M=AZ), ledwarm)
        B.light(hx, 1.12, 2.75, 1.3, '#fff2c8', head=1)
    # chrome tube bumpers wrapping the corners, with overriders on the showroom car
    for zs, zc in ((1, 2.8), (-1, -2.86)):
        path = catmull([(1.18, 0.6, zc - zs * 0.42), (1.06, 0.6, zc - zs * 0.1), (0.7, 0.6, zc), (-0.7, 0.6, zc), (-1.06, 0.6, zc - zs * 0.1), (-1.18, 0.6, zc - zs * 0.42)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.065, B.pick(10, 6)), chrome())
        if not lo:
            for s in (1, -1): B.obj('overrider_%d_%d' % (zs > 0, s > 0), bm_capsule(0.05, 0.3, 8, 2, (s * 0.42, 0.66, zc + zs * 0.02)), chrome())
    # tail: chrome-ringed red bars and a little glowing heart badge
    for s in (1, -1):
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.46, 0.14, 0.06, 0.016, B.pick(4, 1), 4, at=(s * 0.78, 1.16, -2.735), axis=AZn), chrome())
        B.obj('tail_%d' % (s > 0), bm_box(0.42, 0.1, 0.04, (s * 0.78, 1.16, -2.73)), led('#ff1a2a'), bevel=0.015, bevel_angle=False, segments=1)
        B.light(s * 0.78, 1.16, -2.85, 0.9, '#ff2a3a', tail=1)
    B.obj('tail_heart', bm_profile(heart_pts(B.pick(28, 12), k=0.012, yoff=0.0), 0.04, (0, 1.17, -2.74)), led(LIGHT))

    # ---- speakers: three cones down each flank (they pump), a sub box with two cones facing the cars behind ----
    for s in (1, -1):
        for i, z in enumerate((0.72, 0.0, -0.72)):
            B.speaker_pro((s * (HULL_W / 2 + 0.002), 1.0, z), (s, 0, 0), 0.22, 'spk_%d_%d' % (s > 0, i), LIGHT, part='cone%s%d' % ('L' if s > 0 else 'R', i))
        B.light(s * 1.3, 1.0, 0.0, 0.5, LIGHT, led=1)
    sub_m = satin('sub_box', '#1c1822', 0.45)
    B.obj('sub', bm_box(2.2, 0.72, 0.72, (0, 1.86, -2.2)), sub_m, bevel=B.pick(0.07, 0.05), bevel_angle=False, segments=B.pick(3, 1))
    B.obj('sub_frame', bm_rrect_tube(2.16, 0.68, 0.1, 0.022, B.pick(4, 1), B.pick(6, 4), at=(0, 1.86, -2.565), axis=AZn), chrome())
    for s in (1, -1):
        B.speaker_pro((s * 0.55, 1.86, -2.562), (0, 0, -1), 0.24, 'sub_%d' % (s > 0), LIGHT, part='sub' + ('L' if s > 0 else 'R'), guard=True)
    B.light(0, 1.86, -2.75, 1.2, LIGHT, led=1)
    if not lo:   # two horn tweeters on top of the sub box
        for s in (1, -1):
            B.obj('horn_%d' % (s > 0), bm_closed_lathe([(0, -0.16), (0.05, -0.16), (0.06, -0.04), (0.13, 0.04), (0.13, 0.06), (0.0, 0.0)], 16, AZn, (s * 0.8, 2.3, -2.3)), chrome())
            B.obj('horn_glow_%d' % (s > 0), bm_torus(0.13, 0.012, 16, 3, AZn, (s * 0.8, 2.3, -2.365)), ledp)

    # ---- deck rails with marquee bulbs, and a raked glass windscreen in front of the driver ----
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_rod((s * 1.1, 1.86, 1.5), (s * 1.1, 1.86, -1.7), 0.03, L['rod']), chrome())
        for z in (1.5, -0.1, -1.7): B.obj('post_%d_%d' % (s > 0, int(z * 10)), bm_rod((s * 1.1, 1.5, z), (s * 1.1, 1.86, z), 0.022, L['rod']), chrome())
        B.leds((s * 1.1, 1.91, 1.4), (s * 1.1, 1.91, -1.6), B.pick(8, 4), [LIGHT, '#ffffff'], 0.042, 0, prefix='rail%d' % (s > 0))
    tilt = rot(pitch=-0.42)
    B.obj('windscreen', bm_box(0.8, 0.4, 0.02, (SEAT_X, 1.76, -0.16), M=tilt), M_glass)
    B.obj('windscreen_frame', bm_rrect_tube(0.84, 0.44, 0.05, 0.016, B.pick(3, 1), 4, at=(SEAT_X, 1.76, -0.16), axis=tilt @ AZ), chrome())

    # ---- the heart: an inflated candy heart with a glowing LED outline and marquee bulbs, on a chrome cradle ----
    B.obj('cradle', bm_closed_lathe([(0, 1.49), (0.36, 1.49), (0.38, 1.54), (0.3, 1.6), (0.22, 1.66), (0.27, 1.73), (0.31, 1.75), (0.0, 1.75)], L['cyl'], AY, (0, 0, HZ)), M_cradle)
    B.obj('cradle_glow', bm_torus(0.3, 0.02, L['torus'], 3, AY, (0, 1.75, HZ)), ledp)
    H = B.part('heart', (0, HY, HZ))
    nu = B.pick(64, 26)
    outline = heart_outline(nu)
    depth = lambda p: 0.28 + 0.16 * sstep((p[1] + 0.6) / 1.2)   # fat lobes, a slimmer tip
    DC = 0.46
    h = B.obj('heart_body', bm_puffy(outline, depth, DC, B.pick(26, 9)), M_heart, parent=H)
    def candy(x, y, z):   # deeper red toward the tip and the rim, bright pink on the upper lobes
        t = sstep((y + 0.95) / 1.75); rim = 0.78 + 0.22 * sstep(abs(z) / 0.3)
        return ((0.62 + 0.38 * t) * rim, (0.3 + 0.7 * t) * rim, (0.42 + 0.58 * t) * rim)
    B.vcol(h, candy)
    # the LED outline strip around the rim, a hair outside the surface
    rim = [(p[0] * 1.02, p[1] * 1.02 + 0.0, 0.0) for p in heart_outline(B.pick(72, 24))]
    B.obj('heart_led', bm_tube(rim, 0.034, B.pick(6, 4), closed=True), led('#ffd0e0'), parent=H)
    # marquee bulbs on both faces, following an inset outline (the back row is what the chase camera sees)
    nb = B.pick(16, 8); ring = heart_outline(nb)
    phi = math.acos(0.8 ** (1 / 0.7))   # where the surface is at 80 % of the outline
    for face in (1, -1):
        for i, p in enumerate(ring):
            x, y, z = puffy_point(p, face * phi, depth, DC)
            bulb = bm_uv(0.05, 8, 4, (x, y, z + face * 0.03)) if not lo else bm_ico(0.05, 1, (x, y, z + face * 0.03))
            B.obj('heart_bulb_%d_%d' % (face > 0, i), bulb, ledwarm if i % 2 else ledw, parent=H)
    B.light(0, HY, HZ, 4.0, LIGHT, big=1)

    # ---- wheels, seat (on the right), size info ----
    B.wheels_pro(1.12, 1.7, -1.75, r=0.5, w=0.42, rim='#ff6a9a', cap=LIGHT)
    B.seat(SEAT_X, 1.62, -1.25, col='#5a1a2a', accent=LIGHT)
    top = HY + 0.86
    B.info(5.7, 2.6, top, muzzle=(0, HY, HZ), wheelR=0.5, extra={'sight': [round(top + 0.02, 2), HZ]})
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('bass_valentine', build, report=True, views=['side', 'high'], level_overrides={'hi': {'ico': 1}})   # 20-tri bulbs on rails and grille
