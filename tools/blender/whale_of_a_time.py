# Whale Of A Time (Art Cart car #12): a happy blue whale party bus with a very powerful blowhole.
# Quality-bar rebuild (rigV 2): a clear-coat blue whale with a baked deep-blue-spine-to-bright-flank vertex-colour
# gradient and pale freckles, a pale grooved belly with real throat ridges, a chrome waterline, cheeky smile, blush,
# a lofted rounded chassis tub with chrome tube bumpers and bezelled lamps, premium wheels, a plank party deck LOWER on
# the whale's back (the old one stood on legs and hid the road from the chase camera) with one rail height all round,
# twinkling rail bulbs, festoons, pennants, a cooler and a DJ speaker, a lifebuoy on the flank, cyan underglow.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/whale_of_a_time.py', run_name='__main__')
# Writes assets/models/art-cart/whale_of_a_time.glb (showroom, <= 30k tris) and whale_of_a_time_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['whale:2'] in src/43_cart_bb_glb.js):
#   part_flipperL / flipperR     the flippers, joint at the shoulder (they paddle)
#   part_tail                    tail stock + flukes, joint at the root (beats up and down)
#   part_spout                   the blowhole spout, joint in the blowhole (puffs; huge when firing)
#   part_eyes                    both eyes on one bone, joint on the line through their centres (blinks: squashed in y)
#   part_twLA / twLB / twRA / twRB   alternate rail bulbs, joint on their rail's axis (twinkle: shrunk across the rail)
# body extras: rigV = 2, extra.sight = the deck's top behind the driver (the chase camera rises just enough to see over).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#3478e8', '#bfe8ff', '#4ab0ff'   # CART_CARS.whale palette (the paint a touch brighter; the gradient deepens the back)
NAVY = '#0a1a3a'
BULBS = ['#ffe24a', '#ff4fd8', '#38f2ff']
BC = (0.0, 1.6, 0.1); RX, RY, RZ = 1.45, 1.1, 2.85    # the whale body ellipsoid (lower and flatter than before: top at 2.7)
Y_BREAK = -0.3                                         # belly colour break, body-local y
Q = 1 - (Y_BREAK / RY) ** 2
PH_BREAK = math.acos(Y_BREAK / RY)
DY, DZ = 2.73, -0.6          # the deck: plank top height, centre z
RAIL = DY + 0.42             # one rail height all round
ZF, ZR = 0.45, -1.65         # front / rear post z

def body_pt(x, y):
    """The engine point on the body ellipsoid for a given x and y (front sheet, z > centre) and its outward normal."""
    xl, yl = x - BC[0], y - BC[1]
    zl = RZ * math.sqrt(max(0.0, 1 - (xl / RX) ** 2 - (yl / RY) ** 2))
    n = Vector((xl / RX ** 2, yl / RY ** 2, zl / RZ ** 2)).normalized()
    return Vector((x, y, BC[2] + zl)), n
def body_side(y, z):
    """The engine point on the body's left flank (x > centre) for a given y and z, and its outward normal."""
    yl, zl = y - BC[1], z - BC[2]
    xl = RX * math.sqrt(max(0.0, 1 - (yl / RY) ** 2 - (zl / RZ) ** 2))
    n = Vector((xl / RX ** 2, yl / RY ** 2, zl / RZ ** 2)).normalized()
    return Vector((BC[0] + xl, y, z)), n
def body_top(x, z):
    """The engine point on the whale's back above (x, z) and its outward normal."""
    xl, zl = x - BC[0], z - BC[2]
    yl = RY * math.sqrt(max(0.0, 1 - (xl / RX) ** 2 - (zl / RZ) ** 2))
    n = Vector((xl / RX ** 2, yl / RY ** 2, zl / RZ ** 2)).normalized()
    return Vector((x, BC[1] + yl, z)), n
def fin_rings(centre, hz, ht, rows, tseg):
    """Rings of a fin spanning x: centre(u) -> engine point, hz(u)/ht(u) half chord / half thickness (section in zy)."""
    out = []
    for i in range(rows + 1):
        u = i / rows; c = Vector(centre(u)); a_, b_ = hz(u), ht(u)
        out.append([tuple(c + Vector((0, b_ * math.sin(a), a_ * math.cos(a)))) for a in (TAU * j / tseg for j in range(tseg))])
    return out
def chassis_ring(z, w, h, r, seg, yc):
    return [(x, yc + y, z) for x, y in rrect_pts(w, h, r, seg)]
def skin(x, y, z):
    """The whale's paint gradient (multiplies the material colour): a deep blue back fading to a bright flank."""
    t = sstep((y - BC[1] - 0.1) / (RY - 0.1))
    return (1 - 0.4 * t, 1 - 0.3 * t, 1 - 0.12 * t)

def build(B):
    L = B.L; lo = B.lo
    PL = dict(seg=2, phis=[-45, 0, 0, 45]) if lo else dict(seg=3)   # bm_pillow tessellation (rounded boxes)
    B.export_try = VCOL_EXPORT
    # ---- materials ----
    M_blue = paint('whale_blue', COL, coat=1.0, rough=0.2, metal=0.15)
    M_belly_a = paint('belly_a', '#dcefff', coat=0.8, rough=0.28, metal=0.0)
    M_belly_b = paint('belly_b', '#bcdcf6', coat=0.8, rough=0.3, metal=0.0)
    M_navy = mat('navy', NAVY, rough=0.22, coat=0.9)
    M_chassis = paint('chassis_navy', '#10203a', coat=1.0, rough=0.22, metal=0.35)
    M_blush = glow('blush', '#ff9ab8', strength=0.45, rough=0.45, coat=0.4)
    M_freckle = paint('freckle', '#9ccaff', coat=1.0, rough=0.22, metal=0.0)
    M_hole = matte('blowhole', '#061020', rough=0.9)
    M_wood_a = satin('plank_a', '#ecd9b2', rough=0.5); M_wood_b = satin('plank_b', '#d6b98a', rough=0.52)
    M_orange = paint('buoy_orange', '#ff7a2a', coat=0.8, rough=0.3, metal=0.0)
    M_white = paint('buoy_white', '#f6f6f2', coat=0.8, rough=0.3, metal=0.0)
    M_spray = glow('spray', '#cfeeff', strength=1.2, rough=0.08, coat=1.0)
    M_eye = paint('eye_white', '#ffffff', coat=0.6, rough=0.18, metal=0.0)
    M_iris = mat('iris_navy', NAVY, rough=0.06, metal=0.3, coat=1.0)
    M_cooler = paint('cooler_white', '#f2f6f8', coat=0.8, rough=0.3, metal=0.0)
    M_cyan = paint('cooler_cyan', '#38c8e8', coat=1.0, rough=0.25, metal=0.0)
    M_flag_y = satin('flag_yellow', '#ffe24a', rough=0.5); M_flag_p = satin('flag_pink', '#ff4fd8', rough=0.5)
    M_wire = matte('wire', '#101418', rough=0.8)
    cr, dcr = chrome(), dark_chrome()
    led_cy = led('#38f2ff'); led_w = led('#ffffff', 3.0)

    # ================= chassis: a rounded navy tub, arches, chrome flares, tube bumpers, lamps, cyan underglow =================
    cs = B.pick(5, 2)
    rings = [chassis_ring(2.55, 2.0, 0.28, 0.12, cs, 0.62), chassis_ring(2.46, 2.3, 0.38, 0.16, cs, 0.64), chassis_ring(2.3, 2.4, 0.42, 0.17, cs, 0.65)]
    if not lo: rings += [chassis_ring(0.0, 2.4, 0.42, 0.17, cs, 0.65)]
    rings += [chassis_ring(-2.3, 2.4, 0.42, 0.17, cs, 0.65), chassis_ring(-2.46, 2.3, 0.38, 0.16, cs, 0.64), chassis_ring(-2.55, 2.0, 0.28, 0.12, cs, 0.62)]
    tub = B.obj('chassis', bm_loft(rings[::-1], closed_u=True, caps=True), M_chassis)
    for i, (x, z) in enumerate([(1.15, 1.85), (-1.15, 1.85), (1.15, -1.85), (-1.15, -1.85)]):
        B.cut([tub], bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.12, 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.034, L['torus'], B.pick(4, 3), AX, (math.copysign(1.205, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), cr)
    B.obj('chassis_under', bm_box(1.9, 0.08, 4.5, (0, 0.44, 0)), matte('under', '#07090e'))
    for s in (1, -1):
        if not lo:
            B.obj('sill_%d' % (s > 0), bm_tube([(s * 1.212, 0.74, 1.12), (s * 1.212, 0.74, -1.12)], 0.016, 6), cr)
            for k in range(5): B.obj('rivet_%d_%d' % (s > 0, k), bm_ico(0.024, 1, (s * 1.215, 0.62, -0.8 + k * 0.4)), cr)
        B.strip((s * 1.05, 0.42, 1.2), (s * 1.05, 0.42, -1.2), '#38f2ff', th=0.04)
        B.light(s * 1.0, 0.3, 0.0, 2.4, '#38f2ff', led=1)
    B.strip((-0.9, 0.42, 2.35), (0.9, 0.42, 2.35), '#38f2ff', th=0.04); B.strip((-0.9, 0.42, -2.35), (0.9, 0.42, -2.35), '#38f2ff', th=0.04)
    for zs, zc in ((1, 2.66), (-1, -2.66)):
        path = catmull([(1.2, 0.5, zc - zs * 0.42), (1.1, 0.5, zc - zs * 0.08), (0.72, 0.5, zc), (-0.72, 0.5, zc), (-1.1, 0.5, zc - zs * 0.08), (-1.2, 0.5, zc - zs * 0.42)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.065, B.pick(10, 6)), cr)
        if not lo:
            for s in (1, -1): B.obj('overrider_%d_%d' % (zs > 0, s > 0), bm_capsule(0.05, 0.28, 8, 2, (s * 0.42, 0.55, zc + zs * 0.02)), cr)
    for s in (1, -1):
        hx = s * 0.82
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.05), (0.13, -0.04), (0.14, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.66, 2.53)), dcr)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.135, 0.024, L['torus'], B.pick(4, 3), AZ, (hx, 0.66, 2.545)), cr)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.115, 0.032, 0.115, L['cyl_s'], B.pick(5, 2), (hx, 0.66, 2.54), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.66, 2.65, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.42, 0.13, 0.055, 0.015, B.pick(4, 1), 4, at=(s * 0.78, 0.66, -2.545), axis=AZn), cr)
        B.obj('tail_%d' % (s > 0), bm_capsule(0.046, 0.38, B.pick(10, 5), B.pick(2, 1), (s * 0.78, 0.66, -2.545), AX), led('#ff1a2a'))
        B.light(s * 0.78, 0.66, -2.65, 0.9, '#ff2a3a', tail=1)

    # ================= the whale: clear-coat blue back, grooved pale belly, chrome waterline =================
    seg, rings_ = B.pick(48, 20), B.pick(18, 8)
    shell = B.obj('body_blue', bm_ellipsoid(RX, RY, RZ, seg, rings_, BC, phi0=0.0, phi1=PH_BREAK + 0.06), M_blue)
    B.vcol(shell, skin)
    # throat grooves: alternating raised stripes across the belly (real ridges), each a height-field strip of the ellipsoid
    XMAX = RX * math.sqrt(Q) * 0.996; nst = B.pick(17, 7); nu, nv = B.pick(3, 2), B.pick(12, 6)
    for k in range(nst):
        x0 = -XMAX + 2 * XMAX * k / nst; x1 = -XMAX + 2 * XMAX * (k + 1) / nst
        bump = 0.04 if k % 2 == 0 else 0.012
        def fn(u, v, x0=x0, x1=x1, bump=bump):
            x = x0 + (x1 - x0) * u
            zm = RZ * math.sqrt(max(0.0, Q - (x / RX) ** 2)); z = (2 * v - 1) * zm
            yl = -RY * math.sqrt(max(0.0, 1 - (x / RX) ** 2 - (z / RZ) ** 2))
            n = Vector((x / RX ** 2, yl / RY ** 2, z / RZ ** 2)).normalized()
            p = Vector((x, yl, z)) + n * (bump * math.sin(math.pi * u) ** 0.8)
            return (BC[0] + p.x, BC[1] + p.y, BC[2] + p.z)
        B.obj('belly_%d' % k, bm_surf(nu, nv, fn), M_belly_a if k % 2 == 0 else M_belly_b)
    B.obj('waterline', bm_torus(RX * math.sqrt(Q) + 0.01, 0.024, B.pick(48, 20), B.pick(5, 3), AY, (BC[0], BC[1] + Y_BREAK, BC[2]), sy=RZ / RX), cr)
    # pale freckles across the back (hi), little dome discs sitting on the surface
    if not lo:
        for i, (x, z, r) in enumerate([(0.95, 0.6, 0.07), (1.05, -0.3, 0.09), (0.8, -1.3, 0.07), (0.9, 1.15, 0.06), (1.2, 0.2, 0.05)]):
            for s in (1, -1):
                p, n = body_top(s * x, z)
                B.obj('freckle_%d_%d' % (i, s > 0), bm_ellipsoid(r, 0.012, r, 9, 3, tuple(p), M=aim((n.x, n.y, n.z))), M_freckle)
    # a small rounded dorsal fin near the tail
    ft, _ = body_top(0, -2.1)
    dle = [(0, ft.y - 0.12, -1.85), (0, ft.y + 0.12, -1.98), (0, ft.y + 0.27, -2.2), (0, ft.y + 0.3, -2.38)]
    dte = [(0, ft.y - 0.25, -2.45), (0, ft.y - 0.05, -2.45), (0, ft.y + 0.18, -2.4), (0, ft.y + 0.3, -2.38)]
    df = B.obj('dorsal', bm_loft([[(x, y, z) for x, y, z in ring] for ring in _fin_rings(dle, dte, 0.07, B.pick(6, 3), B.pick(14, 6))], closed_u=True, caps=True), M_blue)
    B.vcol(df, skin)

    # ================= face: cheeky smile, cartoon eyes (they blink), blush, blowhole =================
    pts = []
    nsm = B.pick(28, 8)
    for i in range(nsm + 1):
        t = -1 + 2 * i / nsm
        p, n = body_pt(0.88 * t, 1.42 + 0.32 * t * t * abs(t) ** 0.5); pts.append(tuple(p + n * 0.012))
    B.obj('smile', bm_tube(pts, [0.046 + 0.018 * math.sin(math.pi * i / nsm) for i in range(nsm + 1)], B.pick(8, 5)), M_navy)
    if not lo:
        for s in (1, -1):
            p, n = body_pt(s * 0.88, 1.74); B.obj('dimple_%d' % (s > 0), bm_uv(0.055, 12, 7, tuple(p + n * 0.01)), M_navy)
    EY, EZ = 1.9, 1.75
    Ep = B.part('eyes', (0, EY, EZ))
    for s in (1, -1):
        at = Vector((s * 1.0, 0.0, 0.0)); r = 0.21
        _, n = body_side(EY, EZ); n = Vector((s * n.x, n.y, n.z))
        look = (n + Vector((0, 0.02, 0.4))).normalized()   # outward along the flank, a touch forward
        B.obj('eye_white_%d' % (s > 0), bm_uv(r, B.pick(18, 8), B.pick(9, 5), tuple(at)), M_eye, parent=Ep)
        B.obj('eye_iris_%d' % (s > 0), bm_uv(r * 0.5, B.pick(14, 8), B.pick(8, 5), tuple(at + look * r * 0.8)), M_iris, parent=Ep)
        B.obj('eye_hl_%d' % (s > 0), bm_uv(r * 0.13, B.pick(8, 5), B.pick(5, 3), tuple(at + look * r * 1.18 + Vector((s * 0.03, 0.06, -0.02)))), led_w, parent=Ep)
        if not lo: B.obj('eye_hl2_%d' % (s > 0), bm_uv(r * 0.06, 6, 4, tuple(at + look * r * 1.12 + Vector((s * 0.02, -0.05, 0.04)))), led_w, parent=Ep)
        # a navy upper lash arc, tilted for the cheeky look (static, on the body)
        lid_ax = aim((look.x, look.y, look.z))
        B.obj('eyelid_%d' % (s > 0), bm_torus(r * 0.95, 0.036, B.pick(16, 8), B.pick(5, 4), lid_ax, (s * 1.0 + look.x * r * 0.42, EY + look.y * r * 0.42, EZ + look.z * r * 0.42), sweep=(0.1, math.pi - 0.1)), M_navy)
        p, n = body_pt(s * 1.05, 1.47)
        B.obj('blush_%d' % (s > 0), bm_ellipsoid(0.24, 0.06, 0.15, B.pick(12, 8), B.pick(6, 4), tuple(p + n * 0.015), M=aim((n.x, n.y, n.z))), M_blush)
    # blowhole: navy lip ring, dark bore, glowing core; the spout is a part (a jet with curling fronds and droplets)
    bp, bn = body_top(0, 1.05); bax = aim((bn.x, bn.y, bn.z))
    B.obj('blowhole_lip', bm_torus(0.17, 0.045, B.pick(18, 10), B.pick(6, 4), bax, tuple(bp + bn * 0.02), sy=0.72), M_navy)
    B.obj('blowhole_bore', bm_cyl(0.145, 0.145, 0.06, B.pick(20, 10), bax, tuple(bp - bn * 0.005)), M_hole)
    B.obj('blowhole_core', bm_uv(0.07, B.pick(12, 8), B.pick(6, 4), tuple(bp + bn * 0.02)), led(LIGHT, 4.0))
    S = B.part('spout', tuple(bp))
    jet = [(0, 0.0, 0), (0, 0.18, 0.0), (0, 0.38, -0.01), (0, 0.56, -0.02)]
    B.obj('spout_jet', bm_tube(catmull(jet, B.pick(8, 4)), [0.1, 0.09, 0.075, 0.06, 0.055, 0.05, 0.05, 0.05][:B.pick(8, 4)], B.pick(12, 6)), M_spray, parent=S)
    nfr = B.pick(6, 4)
    for k in range(nfr):
        a = TAU * k / nfr + 0.3; ca, sa = math.cos(a), math.sin(a)
        fr = catmull([(0, 0.56, -0.02), (ca * 0.12, 0.7, sa * 0.12 - 0.02), (ca * 0.28, 0.66, sa * 0.28 - 0.02), (ca * 0.36, 0.48, sa * 0.36 - 0.02)], B.pick(6, 4))
        B.obj('spout_frond_%d' % k, bm_tube(fr, [0.05 - 0.032 * i / (len(fr) - 1) for i in range(len(fr))], B.pick(6, 4)), M_spray, parent=S)
        B.obj('spout_drop_%d' % k, bm_uv(0.035, B.pick(8, 6), B.pick(5, 3), (ca * 0.38, 0.4, sa * 0.38 - 0.02)), M_spray, parent=S)
    B.obj('spout_cap', bm_uv(0.07, B.pick(10, 6), B.pick(6, 4), (0, 0.62, -0.02)), M_spray, parent=S)
    B.light(0, bp.y + 0.4, bp.z, 1.6, LIGHT, big=1)

    # ================= flippers (parts flipperL / flipperR, they paddle) =================
    for name, s in (('flipperL', 1), ('flipperR', -1)):
        P = B.part(name, (s * 1.3, 1.2, 0.9))
        def centre(u, s=s): return (s * 1.15 * u, -0.1 - 0.14 * u * u, -0.15 - 0.12 * u)
        def hz(u): return 0.33 * math.sqrt(max(0.0, 1 - u ** 3)) * (0.86 + 0.14 * math.sin(math.pi * u))
        def ht(u): return 0.1 * math.sqrt(max(0.0, 1 - u * u)) * (1 - 0.45 * u) + 0.012
        fo = B.obj(name + '_fin', bm_loft(fin_rings(centre, hz, ht, B.pick(12, 5), B.pick(16, 8)), closed_u=True, caps=True), M_blue, parent=P)
        B.vcol(fo, lambda x, y, z: (0.72 + 0.28 * sstep((y + 0.3) / 0.35), 0.8 + 0.2 * sstep((y + 0.3) / 0.35), 0.92 + 0.08 * sstep((y + 0.3) / 0.35)))
        if not lo:   # a pale leading-edge stripe
            P2 = [tuple(Vector(centre(u)) + Vector((0, 0.02, hz(u) * 0.9))) for u in (i / 10 for i in range(1, 10))]
            B.obj(name + '_edge', bm_tube(P2, 0.018, 5), M_belly_a, parent=P)

    # ================= tail (part `tail`, it beats): tapering stock and two swept flukes =================
    T = B.part('tail', (0, 1.56, -2.72))
    stock = [((0.0, 0.05, 0.55), 0.8, 0.62), ((0.0, 0.06, 0.2), 0.62, 0.5), ((0.0, 0.08, -0.15), 0.46, 0.38), ((0.0, 0.13, -0.5), 0.32, 0.29),
             ((0.0, 0.2, -0.82), 0.23, 0.22), ((0.0, 0.26, -1.02), 0.17, 0.16)]
    tseg = B.pick(18, 8)
    sr = [[tuple(Vector(c) + Vector((rx_ * math.cos(a), ry_ * math.sin(a), 0))) for a in (TAU * j / tseg for j in range(tseg))] for c, rx_, ry_ in stock]
    so = B.obj('tail_stock', bm_loft(sr, closed_u=True, caps=True), M_blue, parent=T)
    B.vcol(so, lambda x, y, z: skin(x, y + 1.56, z))
    for s in (1, -1):
        def centre(u, s=s): return (s * (0.08 + 1.12 * u), 0.27 + 0.1 * u, -0.98 - 0.36 * u - 0.1 * u * u)
        def hz(u): return 0.42 * (1 - 0.5 * u) * math.sqrt(max(0.0, 1 - u ** 2.6))
        def ht(u): return 0.085 * (1 - 0.55 * u) * math.sqrt(max(0.0, 1 - u ** 2.6)) + 0.01
        fl = B.obj('fluke_%d' % (s > 0), bm_loft(fin_rings(centre, hz, ht, B.pick(12, 5), B.pick(16, 8)), closed_u=True, caps=True), M_blue, parent=T)
        B.vcol(fl, lambda x, y, z: (0.66, 0.74, 0.9) if y > 0.27 else (0.82, 0.88, 0.96))
    B.obj('tail_notch', bm_uv(0.1, B.pick(12, 8), B.pick(7, 4), (0, 0.27, -1.0)), M_blue, parent=T)

    # ================= party deck: planks low on the back, chrome edge, a skirt down to the body =================
    npl = B.pick(6, 3); gap = 0.014; pw = (1.5 - gap * (npl - 1)) / npl
    for k in range(npl):
        x = -0.75 + pw / 2 + k * (pw + gap)
        if lo: continue
        B.obj('plank_%d' % k, bm_pillow(pw, 0.07, 2.2 - (0.06 if k in (0, npl - 1) else 0.0), 0.03, seg=2, phis=[-45, 0, 0, 45], at=(x, DY - 0.035, DZ)), M_wood_a if k % 2 == 0 else M_wood_b)
    if lo: B.obj('deck_top', bm_pillow(1.5, 0.07, 2.2, 0.034, seg=2, phis=[-45, 0, 0, 45], at=(0, DY - 0.035, DZ)), M_wood_a)
    B.obj('deck_edge', bm_rrect_tube(1.56, 2.26, 0.12, 0.028, B.pick(4, 1), B.pick(8, 5), at=(0, DY, DZ)), cr)
    # the skirt: a soft, rounded navy apron from under the planks down into the whale's back: it rolls out under the
    # deck edge, then tucks in as it settles into the back (rounder corners than the deck, so no box shows)
    outline = rrect_pts(1.46, 2.16, 0.3, B.pick(4, 2)); y_top = DY - 0.07
    def y_bot(x, z): return min(DY - 0.12, body_top(x, DZ + z)[0].y - 0.12)
    prof = [(1.0, 0.0), (1.02, 0.14), (1.0, 0.38), (0.975, 0.68), (0.95, 1.0)] if not lo else [(1.0, 0.0), (1.015, 0.25), (0.95, 1.0)]
    rings = [[(x * k, y_top + (y_bot(x * k, z * k) - y_top) * t, DZ + z * k) for x, z in outline] for k, t in prof]
    B.obj('deck_skirt', bm_loft(rings[::-1], closed_u=True, caps=True), M_navy)
    # posts at the four corners, all at one rail height, with chrome ball caps; rails along both sides and across the ends
    for s in (1, -1):
        for z in (ZF, ZR):
            B.obj('post_%d_%d' % (s > 0, z > 0), bm_rod((s * 0.72, DY, z), (s * 0.72, RAIL, z), 0.03, L['rod']), cr)
            B.obj('post_cap_%d_%d' % (s > 0, z > 0), bm_uv(0.045, B.pick(10, 6), B.pick(6, 3), (s * 0.72, RAIL + 0.02, z)), cr)
            if not lo: B.obj('post_foot_%d_%d' % (s > 0, z > 0), bm_cyl(0.06, 0.05, 0.03, 10, AY, (s * 0.72, DY + 0.015, z)), dcr)
        B.obj('rail_%d' % (s > 0), bm_rod((s * 0.72, RAIL, ZF), (s * 0.72, RAIL, ZR), 0.025, L['rod']), cr)
        # pennants on short masts above the front posts
        B.obj('mast_%d' % (s > 0), bm_rod((s * 0.72, RAIL, ZF), (s * 0.72, RAIL + 0.32, ZF), 0.015, B.pick(6, 4)), cr)
        flag = [(0, 0.0), (s * 0.34, -0.07), (0, -0.17)]
        B.obj('flag_%d' % (s > 0), bm_profile(flag, 0.012, (s * 0.735, RAIL + 0.3, ZF)), M_flag_y if s > 0 else M_flag_p, flat=True)
    B.obj('rail_front', bm_rod((-0.72, RAIL, ZF), (0.72, RAIL, ZF), 0.025, L['rod']), cr)
    B.obj('rail_rear', bm_rod((-0.72, RAIL, ZR), (0.72, RAIL, ZR), 0.025, L['rod']), cr)
    # twinkling bulbs along the side rails: alternate bulbs on two parts per rail (twLA/twLB, twRA/twRB), each part's
    # joint on the rail's axis so shrinking it across the rail dims the bulbs in place; sockets stay on the body
    n = B.pick(8, 4)
    for s in (1, -1):
        jy = RAIL + 0.055
        parts = [B.part('tw%sA' % ('L' if s > 0 else 'R'), (s * 0.72, jy, 0.0)), B.part('tw%sB' % ('L' if s > 0 else 'R'), (s * 0.72, jy, 0.0))]
        for i in range(n):
            z = ZF - (ZF - ZR) * (i + 0.5) / n
            B.obj('rail_bulb_%d_%d' % (s > 0, i), bm_ico(0.05, 1, (0, 0, z)), led(BULBS[i % 3]), parent=parts[i % 2])
            if not lo: B.obj('socket_%d_%d' % (s > 0, i), bm_cyl(0.03, 0.026, 0.045, 8, AY, (s * 0.72, RAIL + 0.018, z)), dcr)
            if i % 2 == 0: B.light(s * 0.72, jy, z, 0.45, BULBS[i % 3], led=1)
    # festoon strings: across the front and back, and a swag along each side under the rail
    def festoon(name, a, b, sag, nb, cols, r=0.036):
        P = catenary(a, b, sag, B.pick(14, 6))
        B.obj(name + '_wire', bm_tube(P, 0.009, B.pick(4, 3)), M_wire)
        for i in range(nb if not lo else max(2, nb // 2)):
            k = nb if not lo else max(2, nb // 2)
            t = (i + 1) / (k + 1); p = Vector(a).lerp(Vector(b), t) - Vector((0, sag * (1 - (2 * t - 1) ** 2), 0))
            B.obj(name + '_bulb_%d' % i, bm_ico(r, 1, tuple(p - Vector((0, 0.07, 0)))), led(cols[i % len(cols)]))
            if i % 2 == 0: B.light(p.x, p.y - 0.07, p.z, 0.4, cols[i % len(cols)], led=1)
    festoon('fest_front', (0.72, RAIL, ZF), (-0.72, RAIL, ZF), 0.12, 5, BULBS[1:] + BULBS[:1])
    festoon('fest_rear', (0.72, RAIL, ZR), (-0.72, RAIL, ZR), 0.12, 5, BULBS)
    for s in (1, -1):
        festoon('fest_side_%d' % (s > 0), (s * 0.76, RAIL - 0.04, ZF), (s * 0.76, RAIL - 0.04, ZR), 0.16, 6, BULBS[2:] + BULBS[:2])
    # deck props: a cooler (left rear) and a little DJ speaker box (right rear) facing backwards
    B.obj('cooler', bm_pillow(0.42, 0.28, 0.3, 0.05, **PL, at=(0.42, DY + 0.14, -1.3)), M_cooler)
    if not lo: B.obj('cooler_lid', bm_pillow(0.45, 0.07, 0.33, 0.034, **PL, at=(0.42, DY + 0.31, -1.3), crown=0.02), M_cyan)
    B.obj('cooler_handle', bm_tube(catmull([(0.42, DY + 0.34, -1.2), (0.42, DY + 0.39, -1.24), (0.42, DY + 0.39, -1.36), (0.42, DY + 0.34, -1.4)], B.pick(8, 4)), 0.014, B.pick(6, 4)), cr)
    B.obj('dj_box', bm_pillow(0.42, 0.38, 0.3, 0.05, **PL, at=(-0.42, DY + 0.19, -1.3)), satin('dj_box', '#1a1e2c', 0.45))
    B.speaker_pro((-0.42, DY + 0.19, -1.452), (0, 0, -1), 0.11, 'dj_spk', '#ff4fd8')
    if not lo: B.obj('dj_dial', bm_cyl(0.03, 0.03, 0.02, 10, AY, (-0.42, DY + 0.39, -1.3)), cr)
    B.light(-0.42, DY + 0.19, -1.55, 0.5, '#ff4fd8', led=1)
    # the steering column from the deck to the wheel
    B.obj('column', bm_rod((0, DY, 0.12), (0, DY + 0.7, 0.15), 0.04, L['rod']), cr)

    # ================= lifebuoy on the left flank, hung on a chrome hook =================
    p, n = body_side(1.95, -1.0); ax = aim((n.x, n.y, n.z)); c = p + n * 0.07
    for k in range(4):
        B.obj('buoy_%d' % k, bm_torus(0.3, 0.075, B.pick(7, 4), B.pick(9, 6), ax, tuple(c), sweep=(k * math.pi / 2, (k + 1) * math.pi / 2)), M_orange if k % 2 == 0 else M_white)
    B.obj('buoy_hook', bm_rod(tuple(p + Vector((0, 0.33, 0))), tuple(c + Vector((0, 0.36, 0))), 0.02, B.pick(8, 5)), cr)
    if not lo:
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            B.obj('buoy_rope_%d' % k, bm_torus(0.3, 0.012, 3, 4, ax, tuple(c), sweep=(a - 0.12, a + 0.12)), matte('rope', '#e8dcc0', 0.8))

    # ================= wheels, seat (on the deck), size info =================
    B.wheels_pro(1.15, 1.85, -1.85, r=0.5, w=0.42, rim='#5ab0ff', tyre='#121620', cap='#38f2ff', stripe='#38f2ff')
    B.seat_pro(0, DY + 0.38, -0.55, col='#1a3a7a', accent=COL2, wheelY=DY + 0.74, wheelZ=0.1, column=False, piping='#e8f4ff')
    top = RAIL + 0.08
    B.info(6.0, 3.2, 3.6, muzzle=(0, DY, 1.0), wheelR=0.5, extra={'sight': [round(top, 2), ZR]})
    B.body['rigV'] = 2

def _fin_rings(le, te, thick, n_span, n_ring):
    """Rings of a small rounded fin from leading / trailing edge control points (they meet at the tip), thickness in x."""
    out = []
    for i in range(n_span + 1):
        u = i / n_span; a, b = Vector(catmull_at(le, u)), Vector(catmull_at(te, u))
        if i == n_span: out.append([tuple((a + b) / 2)]); continue
        T = thick * (1 - u) ** 0.7 + 0.01; ring = []
        for j in range(n_ring):
            ang = TAU * j / n_ring; uc = (1 + math.cos(ang)) / 2; side = 1 if math.sin(ang) >= 0 else -1
            th = T * math.sin(math.pi * min(1.0, uc * 0.85 + 0.08)) ** 0.6
            ring.append(tuple(a + (b - a) * uc + Vector((side * th, 0, 0))))
        out.append(ring)
    return out

if __name__ == '__main__':
    run('whale_of_a_time', build, report=True, views=['side', 'high'], level_overrides={'hi': dict(ico=1)})
