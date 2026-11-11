# Quackzilla (Art Cart car #5): the bath toy that ate the bathtub. A giant glossy rubber duck afloat in a white enamel
# bathtub on wheels, ridden on its back. Rebuilt to the Bass Valentine quality bar.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/quackzilla.py', run_name='__main__')
# Writes assets/models/art-cart/quackzilla.glb (showroom, <= 30k tris) and quackzilla_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['duck:2'] in src/43_cart_bb_glb.js; joints must match CART_DUCK2 there):
#   part_duck            the duck's body, joint at the float pivot (0, 1.0, 0): it bobs and rocks on the bath water
#   part_wingL / wingR   the wings, joint at the wing root: they ride the float and flap on boost
#   part_head            the head, joint at the neck: it rides the float, tilts and looks into turns
#   part_hat             the party hat, joint at its brim: it rides the head and wobbles
#   part_foam            the bubble clusters on the water (they drift and bob)
#   part_ripple          the glowing ripple rings round the duck (they spread and pulse)
# body extras: rigV = 2, extra.sight = the head's top (the chase camera rises just enough to see the road over it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, WATER = '#ffd21a', '#ff8a1a', '#ffe24a', '#2a8ad8'   # CART_CARS.duck palette + bath water
BEAK, CYAN = '#ff7a12', '#5ac8ff'
PIVOT = (0.0, 1.0, 0.0)            # the duck's float pivot (part_duck)
HEAD_J = (0.0, 2.3, 1.3)           # the neck joint (part_head)
HEAD_C = (0.0, 0.55, 0.15)         # the head ball's centre, head-local
HEAD_R = 0.84
HAT_J = (0.17, 3.67, 1.45)         # the hat brim (part_hat), car space: on top of the head, tipped to the left
WING_J = (1.12, 1.86, 0.32)        # the left wing root (part_wingL); the right one mirrors x
TUB_TOP = 0.86                     # the enamel roll rim
WATER_Y = 0.845

# the duck's body: (z, half-width, half-height, centre height) from the tail tip to the chest
BODY = [(-2.3, 0.0, 0.0, 2.22), (-2.22, 0.16, 0.12, 2.12), (-2.05, 0.4, 0.28, 1.92), (-1.75, 0.72, 0.5, 1.64), (-1.35, 1.0, 0.7, 1.46),
        (-0.8, 1.22, 0.88, 1.38), (0.0, 1.3, 0.95, 1.38), (0.8, 1.24, 0.92, 1.42), (1.4, 1.02, 0.78, 1.5), (1.8, 0.66, 0.52, 1.58),
        (2.0, 0.3, 0.24, 1.62), (2.06, 0.0, 0.0, 1.63)]

def body_pt(s, v):
    """Engine point on the body (car space): s = angle around the section (pi/2 = top), v = 0 tail tip .. 1 chest."""
    z, rx, ry, yc = catmull_at(BODY, v)
    sn = math.sin(s); sn = sn if sn > 0 else sn * 0.86     # a flatter belly (it floats)
    return (rx * math.cos(s), yc + ry * sn, z)

def rr_ring(w, d, r, seg, y):
    """A rounded-rectangle ring (w across x, d along z) at height y, as engine points."""
    return [(x, y, z) for x, z in rrect_pts(w, d, r, seg)]

def face_up(bm):
    """Make an open, flat-ish sheet face +engine Y (Blender +Z)."""
    bm.normal_update()
    if sum(f.normal.z for f in bm.faces) < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm

def wing_outline(n):
    """A plump wing seen from the side (local x = backward along the body, y = up): a rounded shoulder at the front and
    three soft feather tips at the back. Star-shaped about (0.68, -0.32)."""
    K = [(0.0, -0.05), (0.08, 0.1), (0.3, 0.17), (0.65, 0.16), (1.0, 0.08), (1.32, -0.06), (1.52, -0.16), (1.42, -0.26),
         (1.5, -0.38), (1.34, -0.46), (1.38, -0.6), (1.16, -0.64), (0.85, -0.7), (0.5, -0.68), (0.2, -0.56), (0.03, -0.32)]
    ts = arc_walk(lambda t: (*catmull_at(K, t, True), 0.0), n, closed=True)
    return [catmull_at(K, t, True) for t in ts]

def bill_outline(n, w, l):
    """The bill from above: local x across, y forward (tip at y = l); a wide, rounded spatula. Star-shaped about (0, l/2)."""
    K = [(0.0, 0.0), (0.45, 0.04), (0.82, 0.22), (1.0, 0.5), (0.92, 0.8), (0.6, 0.98), (0.0, 1.04), (-0.6, 0.98), (-0.92, 0.8),
         (-1.0, 0.5), (-0.82, 0.22), (-0.45, 0.04)]
    K = [(x * w, y * l) for x, y in K]
    ts = arc_walk(lambda t: (*catmull_at(K, t, True), 0.0), n, closed=True)
    return [catmull_at(K, t, True) for t in ts]

def build(B):
    L = B.L; lo = B.lo
    B.export_try = VCOL_EXPORT   # the duck, bill, hat and water carry vertex-colour gradients
    # ---- materials: glossy vinyl-toy clear coats, white enamel, glassy bath water, chrome, LEDs ----
    M_duck = paint('duck_vinyl', COL, coat=1.0, rough=0.16, metal=0.05, emit='#ffc020', strength=0.4)   # a soft night-light glow
    M_wing = paint('wing_vinyl', '#ffc81a', coat=1.0, rough=0.16, metal=0.05)
    M_beak = paint('beak_vinyl', BEAK, coat=1.0, rough=0.18, metal=0.05)
    M_enamel = paint('tub_enamel', '#f4f6ff', coat=1.0, rough=0.14, metal=0.05)
    M_water = paint('bath_water', WATER, coat=1.0, rough=0.05, metal=0.25)
    M_bubble = mat('bubble', '#eaf8ff', rough=0.08, metal=0.0, coat=1.0, emit='#dff4ff', strength=1.6)
    M_ripple = glow('ripple', '#9ad8ff', strength=1.2, rough=0.2)
    M_hat = paint('party_hat', '#ff4fd8', coat=1.0, rough=0.2, metal=0.1)
    M_white = paint('pompom_white', '#ffffff', coat=0.3, rough=0.45, metal=0.0)
    M_mouth = matte('mouth', '#4a1608', 0.8)
    M_glass = mat('glass', '#1c2433', rough=0.04, extras={'burns_gloss': 3})
    M_under = matte('under', '#0e0e12')
    M_eye = paint('eye_white', '#ffffff', coat=1.0, rough=0.12, metal=0.0)
    M_pupil = paint('pupil', '#06060c', coat=1.0, rough=0.1, metal=0.0)
    cr = chrome(); dch = dark_chrome(); ledw = led('#fff0d8')

    # ---- the bathtub: a lofted enamel tub, roll rim, chrome trims and bumpers, a soft lilac-to-white gradient ----
    cs = B.pick(8, 3)
    rings = [rr_ring(1.86, 3.7, 0.5, cs, 0.44), rr_ring(2.3, 4.24, 0.6, cs, 0.5), rr_ring(2.48, 4.44, 0.66, cs, 0.6),
             rr_ring(2.56, 4.54, 0.7, cs, 0.74), rr_ring(2.6, 4.58, 0.72, cs, TUB_TOP - 0.04)]
    tub = B.obj('tub', bm_loft(rings, closed_u=True, caps=True), M_enamel)
    B.vcol(tub, lambda x, y, z: (0.78 + 0.22 * sstep((y - 0.44) / 0.4), 0.8 + 0.2 * sstep((y - 0.44) / 0.4), 0.95 + 0.05 * sstep((y - 0.44) / 0.4)))
    B.obj('tub_rim', bm_rrect_tube(2.6, 4.58, 0.72, 0.075, B.pick(7, 3), B.pick(9, 5), at=(0, TUB_TOP, 0)), M_enamel)
    B.obj('tub_trim', bm_rrect_tube(2.53, 4.5, 0.68, 0.022, B.pick(8, 3), B.pick(6, 4), at=(0, 0.66, 0)), cr)
    B.obj('chassis', bm_pillow(1.6, 0.26, 3.5, 0.1, **(dict(seg=2, phis=[-45, 0, 0, 45]) if B.lo else dict(seg=3, phis=[-50, -20, 0, 0, 20, 50])), at=(0, 0.36, 0)), M_under)
    # the bath water: a disc inside the rim with a ripple-and-foam gradient (pale near the duck, deep blue at the walls)
    nr = B.pick(7, 3); bound = rrect_pts(2.5, 4.46, 0.66, B.pick(8, 3))
    secs = [[(0.0, WATER_Y, 0.0)]] + [[(x * k, WATER_Y, z * k) for x, z in bound] for k in [(i + 1) / nr for i in range(nr)]]
    water = B.obj('water', face_up(bm_loft(secs, closed_u=True, caps=False)), M_water)
    def water_col(x, y, z):
        d = math.hypot(x / 1.25, z / 2.2); rip = 0.5 + 0.5 * math.cos(d * 26)
        k = 0.72 + 0.28 * sstep((0.8 - d) / 0.5) + 0.08 * rip
        return (min(1, k * 0.9), min(1, k * 0.98), min(1, k * 1.05))
    B.vcol(water, water_col)
    # LED rows along the tub's flank (yellow and cyan, every 3rd bulb a game light), cyan under-glow below
    for s in (1, -1):
        B.leds((s * 1.3, 0.74, 1.6), (s * 1.3, 0.74, -1.6), B.pick(8, 4), [LIGHT, CYAN], 0.05, 3, prefix='tled%d' % (s > 0))
        B.strip((s * 0.95, 0.47, 1.7), (s * 0.95, 0.47, -1.7), CYAN, th=0.04)
        B.light(s * 0.9, 0.25, 0.0, 2.4, CYAN, led=1)
    B.leds((0.45, 0.76, -2.3), (-0.45, 0.76, -2.3), B.pick(4, 2), [LIGHT, CYAN], 0.045, 0, prefix='rled')   # the back wall, for the cars behind
    B.strip((-0.75, 0.47, 1.98), (0.75, 0.47, 1.98), CYAN, th=0.04); B.strip((-0.75, 0.47, -1.98), (0.75, 0.47, -1.98), CYAN, th=0.04)
    # chrome tube bumpers wrapping the tub's ends, with overriders on the showroom car
    for zs, zc in ((1, 2.36), (-1, -2.36)):
        path = catmull([(1.2, 0.5, zc - zs * 0.55), (1.12, 0.5, zc - zs * 0.18), (0.72, 0.5, zc), (-0.72, 0.5, zc), (-1.12, 0.5, zc - zs * 0.18), (-1.2, 0.5, zc - zs * 0.55)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.06, B.pick(10, 6)), cr)
    # bezelled headlights in the tub's front wall, chrome-ringed tail lights at the back
    for s in (1, -1):
        hx = s * 0.74
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.14, -0.05), (0.15, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.66, 2.24)), dch)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.145, 0.024, L['torus'], B.pick(4, 3), AZ, (hx, 0.66, 2.255)), cr)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.12, 0.035, 0.12, L['cyl_s'], B.pick(5, 2), (hx, 0.66, 2.25), phi1=math.pi / 2, M=AZ), ledw)
        B.light(hx, 0.66, 2.36, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.4, 0.13, 0.06, 0.016, B.pick(4, 1), 4, at=(s * 0.74, 0.68, -2.26), axis=AZn), cr)
        B.obj('tail_%d' % (s > 0), bm_capsule(0.046, 0.36, B.pick(10, 5), B.pick(2, 1), (s * 0.74, 0.68, -2.26), AX), led('#ff1a2a'))
        B.light(s * 0.74, 0.68, -2.38, 0.9, '#ff2a3a', tail=1)

    # ---- hood ornament: a chrome bath tap on the rim, hot and cold handles, a glowing drip ----
    B.obj('tap_base', bm_closed_lathe([(0, 0.0), (0.18, 0.0), (0.18, 0.04), (0.12, 0.08), (0.085, 0.2), (0.0, 0.2)], L['cyl_s'], AY, (0, TUB_TOP + 0.05, 2.04)), cr)
    spout = catmull([(0, 1.05, 2.04), (0, 1.42, 2.04), (0, 1.58, 2.2), (0, 1.54, 2.42), (0, 1.38, 2.52)], B.pick(14, 6))
    B.obj('tap_spout', bm_tube(spout, 0.065, B.pick(12, 6)), cr)
    B.obj('tap_tip', bm_cyl(0.065, 0.085, 0.1, L['cyl_s'], aim((0, -1, 0.3)), (0, 1.33, 2.54)), cr)
    B.obj('tap_drip', bm_lathe([(0, -0.07), (0.035, -0.04), (0.04, -0.01), (0.02, 0.03), (0.0, 0.06)], B.pick(10, 6), (0, 1.17, 2.58)), M_bubble)
    for s, c in ((1, '#ff2a3a'), (-1, '#2a7aff')):
        B.obj('tap_stem_%d' % (s > 0), bm_rod((0, 1.02, 2.04), (s * 0.3, 1.1, 2.04), 0.03, L['rod']), cr)
        B.obj('tap_knob_%d' % (s > 0), bm_ellipsoid(0.095, 0.075, 0.095, B.pick(14, 8), B.pick(7, 4), (s * 0.34, 1.11, 2.04)), paint('knob_' + c.lstrip('#'), c, coat=1.0, rough=0.15))
        if not lo:
            for k in range(4):
                a = TAU * k / 4
                B.obj('tap_cross_%d_%d' % (s > 0, k), bm_capsule(0.022, 0.16, 6, 2, (s * 0.34 + math.cos(a) * 0.1, 1.11, 2.04 + math.sin(a) * 0.1), axis=aim((math.cos(a), 0, math.sin(a)))), cr)
    # astern: a chrome drain plug and a little chain hanging over the back wall
    B.obj('plug', bm_closed_lathe([(0, 0.0), (0.12, 0.0), (0.12, 0.03), (0.09, 0.05), (0.0, 0.05)], L['cyl_s'], AZn, (0, 0.62, -2.27)), cr)
    B.obj('plug_ring', bm_torus(0.045, 0.012, B.pick(16, 8), B.pick(6, 4), AY, (0, 0.62, -2.34)), cr)
    if not lo:
        for i in range(7):
            p = catmull_at([(0, 0.66, -2.34), (0, 0.84, -2.36), (0, 0.92, -2.2)], i / 6)
            B.obj('chain_%d' % i, bm_torus(0.026, 0.008, B.pick(8, 6), 3, AX if i % 2 else AZ, p), cr)

    # ---- the duck (part_duck): a sculpted vinyl body on the float pivot, warm gradient, upturned tail ----
    D = B.part('duck', PIVOT)
    px, py, pz = PIVOT
    nb = B.pick(44, 22); nv = B.pick(32, 14)
    body = B.obj('duck_body', bm_surf(nb, nv, lambda u, v: (lambda p: (p[0] - px, p[1] - py, p[2] - pz))(body_pt(TAU * u + math.pi / 2, v)), wrap_u=True, merge=True), M_duck, parent=D)
    def vinyl(x, y, z):   # local to the pivot: a warm orange shade under the belly, a sunny top, a hint of blush at the waterline
        Y = y + py; t = sstep((Y - 0.7) / 1.5)
        return (1.0, 0.72 + 0.28 * t, 0.5 + 0.5 * t)
    B.vcol(body, vinyl)
    # the neck: a soft collar that blends the body into the head
    neck = B.obj('neck', bm_ellipsoid(0.7, 0.5, 0.66, B.pick(28, 12), B.pick(12, 6), (0, 2.16 - py, 1.3)), M_duck, parent=D)
    B.vcol(neck, vinyl)
    # chrome grab rails round the rider's perch (the seat and the steering wheel are on the body bone)
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_tube(catmull([(s * 0.5, 2.22 - py, -0.75), (s * 0.55, 2.55 - py, -0.6), (s * 0.55, 2.6 - py, 0.0), (s * 0.5, 2.36 - py, 0.3)], B.pick(12, 5)), 0.028, B.pick(8, 5)), cr, parent=D)

    # ---- the wings (part_wingL/R): puffy scalloped feathers hinged at the shoulder, feather lines painted in ----
    wo = [(x * math.cos(0.22) - y * math.sin(0.22), x * math.sin(0.22) + y * math.cos(0.22)) for x, y in wing_outline(B.pick(40, 18))]   # tips swept up
    wdepth = lambda p: 0.11 + 0.09 * sstep((0.9 - p[0]) / 0.9)
    for name, s in (('wingL', 1), ('wingR', -1)):
        W = B.part(name, (s * WING_J[0], WING_J[1], WING_J[2]))
        out = wo if s > 0 else [(x, -y) for x, y in wo]
        ay = (0, 1, 0) if s > 0 else (0, -1, 0)
        Mw = rot(yaw=s * 0.2, roll=s * 0.2) @ frame((0, 0, -1), ay, (s, 0, 0))
        w = B.obj(name + '_feather', bm_puffy(out, wdepth, 0.24, B.pick(12, 6), centre=(0.72, -0.17 * (1 if s > 0 else -1)), M=Mw), M_duck, parent=W)
        def feathers(x, y, z, s=s):   # wing-local: darker grooves that follow the feather tips
            # undo the wing's yaw/roll approximately: the wing runs back along -z, its height is y
            u = -z; v = y + 0.32
            g = min(abs(v - 0.13 + 0.12 * u), abs(v + 0.02 + 0.1 * u), abs(v + 0.16 + 0.06 * u))
            k = 1.0 - 0.16 * (1 - sstep(g / 0.045)) * sstep((u - 0.25) / 0.3)
            t = sstep((y + WING_J[1] - 0.7) / 1.5)
            return (k, k * (0.72 + 0.28 * t), k * (0.5 + 0.5 * t))
        B.vcol(w, feathers)

    # ---- the head (part_head): a glossy ball with blushing cheeks, big glossy eyes, a wide rubber bill ----
    H = B.part('head', HEAD_J)
    hx, hy, hz = HEAD_C
    head = B.obj('head_ball', bm_uv(HEAD_R, B.pick(30, 16), B.pick(18, 10), HEAD_C), M_duck, parent=H)
    def head_col(x, y, z):
        Y = y + HEAD_J[1]; t = sstep((Y - 2.0) / 1.6)
        blush = max(0.0, 1 - math.hypot(abs(x) - 0.52, y - 0.32, z - 0.68) / 0.26)
        b = sstep(blush)
        return (1.0, (0.78 + 0.22 * t) * (1 - 0.32 * b), (0.55 + 0.45 * t) * (1 - 0.28 * b) + 0.25 * b)
    B.vcol(head, head_col)
    # the bill: an upper spatula and a smaller lower one, slightly agape over a dark mouth
    bo = bill_outline(B.pick(32, 16), 0.5, 0.62)
    Mb = rot(pitch=-0.1) @ frame((-1, 0, 0), (0, 0, 1), (0, 1, 0))
    bdep = lambda p: 0.05 + 0.06 * sstep((0.62 - p[1]) / 0.5)
    up = B.obj('bill_upper', bm_puffy(bo, bdep, 0.13, B.pick(12, 5), centre=(0.0, 0.31), at=(0, 0.36, 0.78), M=Mb), M_beak, parent=H)
    lb = bill_outline(B.pick(26, 12), 0.4, 0.5)
    B.obj('bill_lower', bm_puffy(lb, lambda p: 0.035 + 0.035 * sstep((0.5 - p[1]) / 0.4), 0.08, B.pick(10, 4), centre=(0.0, 0.25), at=(0, 0.16, 0.8), M=rot(pitch=0.06) @ frame((-1, 0, 0), (0, 0, 1), (0, 1, 0))), M_beak, parent=H)
    B.obj('mouth', bm_ellipsoid(0.34, 0.07, 0.3, B.pick(20, 8), B.pick(8, 4), (0, 0.25, 0.98)), M_mouth, parent=H)
    bill_col = lambda x, y, z: (1.0, 0.82 + 0.18 * sstep((y - 0.2) / 0.3), 0.7 + 0.3 * sstep((y - 0.2) / 0.3))
    B.vcol(up, bill_col)
    if not lo:
        for s in (1, -1): B.obj('nostril_%d' % (s > 0), bm_ellipsoid(0.035, 0.018, 0.05, 8, 4, (s * 0.13, 0.5, 1.2)), M_mouth, parent=H)
    # eyes: glossy domes set into the head, big black pupils looking a little outward and up, two catch-lights each
    for s in (1, -1):
        d = Vector((s * 0.4, 0.36, 0.84)).normalized(); c = Vector(HEAD_C) + d * (HEAD_R - 0.12)
        A = aim(tuple(d))
        B.obj('eye_white_%d' % (s > 0), bm_ellipsoid(0.23, 0.2, 0.23, B.pick(20, 10), B.pick(10, 5), tuple(c), M=A @ rot(pitch=0)), M_eye, parent=H)
        look = (d + Vector((s * 0.05, 0.06, 0.3))).normalized(); pc = c + look * 0.155
        B.obj('eye_pupil_%d' % (s > 0), bm_ellipsoid(0.15, 0.07, 0.15, B.pick(16, 8), B.pick(8, 4), tuple(pc), M=aim(tuple(look))), M_pupil, parent=H)
        B.obj('eye_hl_%d' % (s > 0), bm_ico(0.04, B.pick(2, 1), tuple(pc + look * 0.07 + Vector((s * 0.03, 0.05, 0)))), led('#ffffff', 3.0), parent=H)
        if not lo:
            B.obj('eye_hl2_%d' % (s > 0), bm_ico(0.018, 1, tuple(pc + look * 0.07 + Vector((-s * 0.04, -0.045, 0)))), led('#ffffff', 3.0), parent=H)
            # a cheeky eyebrow arc above each eye
            br = [tuple(Vector(HEAD_C) + (Vector((s * (0.2 + 0.26 * t), 0.66 + 0.07 * math.sin(t * math.pi) - 0.05 * t, 0.72 - 0.12 * t))).normalized() * (HEAD_R + 0.012)) for t in (i / 8 for i in range(9))]
            B.obj('brow_%d' % (s > 0), bm_tube(br, [0.015, 0.03, 0.04, 0.044, 0.044, 0.04, 0.03, 0.022, 0.014], 6), paint('brow', '#8a3a0a', coat=1.0, rough=0.25), parent=H)
    B.light(0, 3.1, 2.3, 1.6, LIGHT, big=1)

    # ---- the party hat (part_hat): candy-striped cone, gold band, fluffy pompom ----
    T = B.part('hat', HAT_J)
    Mh = rot(roll=-0.2)
    hp = lambda x, y, z: (lambda v: (v.x, v.z, -v.y))(Mh @ E(x, y, z))
    hat = B.obj('hat', bm_lathe([(0.27, 0.0), (0.27, 0.03), (0.2, 0.18), (0.13, 0.34), (0.07, 0.5), (0.03, 0.6), (0.0, 0.63)], B.pick(32, 12), axis=Mh, caps=True), M_hat, parent=T)
    def stripes(x, y, z):
        v = rot(roll=0.2) @ E(x, y, z); lx, ly, lz = v.x, v.z, -v.y
        a = math.atan2(lz, lx); k = 0.5 + 0.5 * math.sin(a * 3 + ly * 22)
        w = sstep((k - 0.45) / 0.1)
        return (1.0, 0.31 + 0.69 * w, 0.85 + 0.15 * w)   # pink stripes over white
    B.vcol(hat, stripes)
    B.obj('hat_band', bm_torus(0.27, 0.024, B.pick(32, 12), B.pick(6, 4), Mh, hp(0, 0.04, 0)), metal('gold', '#ffcf4a', 0.18), parent=T)
    pom = bm_lathe([(0, -0.1)] + [(0.1 * math.sin(math.pi * i / 6), -0.1 * math.cos(math.pi * i / 6)) for i in range(1, 6)] + [(0, 0.1)], B.pick(16, 8), at=hp(0, 0.68, 0),
                   rmod=None if lo else (lambda th, t: 1 + 0.12 * math.sin(th * 5) * math.sin(t * math.pi * 3)))
    B.obj('pompom', pom, M_white, parent=T)

    # ---- bubble clusters floating on the water (part_foam) and the glowing ripples round the duck (part_ripple) ----
    F = B.part('foam', (0, WATER_Y, 0))
    clusters = [(1.0, 1.2), (-1.0, 1.0), (0.95, -0.6), (-0.98, -0.9), (0.6, -1.85), (-0.55, -1.9), (0.0, 2.02), (1.02, 0.2), (-1.04, 0.1)]
    if lo: clusters = clusters[:5]
    for ci, (cx, cz) in enumerate(clusters):
        for k in range(B.pick(3, 2)):
            a = ci * 1.7 + k * 2.1; r = (0.11, 0.08, 0.065, 0.05)[k]
            ox = math.cos(a) * 0.1 * (k > 0); oz = math.sin(a) * 0.1 * (k > 0)
            B.obj('bubble_%d_%d' % (ci, k), bm_ico(r, B.pick(2 if k == 0 else 1, 1), (cx + ox, r * 0.45 + 0.01 * k, cz + oz)), M_bubble, parent=F)
    if not lo:
        for i, (x, y, z, r) in enumerate(((0.5, 0.45, -2.0, 0.06), (-0.7, 0.7, -1.95, 0.045), (0.25, 0.95, -2.1, 0.035), (-0.3, 0.5, 2.1, 0.04))):
            B.obj('bubble_up_%d' % i, bm_ico(r, 2, (x, y, z)), M_bubble, parent=F)
    R = B.part('ripple', (0, WATER_Y, 0))
    for i, (Rr, sy, z) in enumerate(((1.12, 1.62, 0.0), (1.2, 1.74, -0.05))):
        if lo and i: continue
        B.obj('ripple_%d' % i, bm_torus(Rr, 0.014, B.pick(36, 24), 3, AY, (0, 0.012, z), sy=sy), M_ripple, parent=R)

    # ---- the rider's seat on the duck's back, the steering wheel on a chrome post ----
    B.seat_pro(0, 2.48, -0.3, col=COL2, accent=CYAN, wheelY=2.86, wheelZ=0.3, piping='#fff4c8')
    B.obj('wheel_post', bm_rod((0, 2.3, 0.36), (0, 2.81, 0.36), 0.04, L['rod']), cr)

    # ---- wheels and size info ----
    B.wheels_pro(1.0, 1.5, -1.5, r=0.42, w=0.36, rim=COL2, cap=CYAN, stripe=LIGHT)
    top = HEAD_J[1] + HEAD_C[1] + HEAD_R
    B.info(4.8, 2.62, round(top, 2), muzzle=(0, 2.7, 2.5), wheelR=0.42, extra={'sight': [round(top + 0.02, 2), round(HEAD_J[2] + HEAD_C[2], 2)]})
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('quackzilla', build, report=True, views=['side', 'high'], level_overrides={'hi': {'ico': 1}})   # 20-tri LED bulbs
