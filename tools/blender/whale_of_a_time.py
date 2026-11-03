# Whale Of A Time (Art Cart car #12): a happy blue whale with a very powerful blowhole, a party deck on its back.
# Clear-coat blue back, a pale grooved belly with real throat ridges, a chrome waterline, cheeky smile, blush, string
# lights on a plank deck, a lifebuoy on the flank, cyan underglow. The flippers roll and the tail flukes beat.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/whale_of_a_time.py
# Writes assets/models/art-cart/whale_of_a_time.glb (showroom, 20–30k tris) and whale_of_a_time_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#2a6ad8', '#bfe8ff', '#4ab0ff'   # CART_CARS.whale palette
NAVY = '#0a1a3a'
BULBS = ['#ffe24a', '#ff4fd8', '#38f2ff']
BC = (0.0, 1.75, 0.1); RX, RY, RZ = 1.45, 1.22, 2.85   # the whale body ellipsoid (CART_BUILD.whale)
Y_BREAK = -0.3                                         # belly colour break, body-local y (engine y 1.45)
Q = 1 - (Y_BREAK / RY) ** 2
PH_BREAK = math.acos(Y_BREAK / RY)

# ---- local helpers (the kit has no lofted sections, swept tubes or aimed primitives) ----
def aim(d):
    """A matrix that points a primitive's axis (Blender Z) along the engine direction d; use as `axis`/`M`."""
    v = E(*d); v.normalize()
    return v.to_track_quat('Z', 'Y').to_matrix().to_4x4()
def body_pt(x, y, lower=False):
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
def bm_loft(rings, cap0=True, cap1=True):
    """Skin a list of rings (each a list of engine points, equal counts) into a tube; caps are fans to a pole."""
    bm = bmesh.new(); rows = [[bm.verts.new(E(*p)) for p in ring] for ring in rings]; n = len(rows[0])
    for i in range(len(rows) - 1):
        A, Bq = rows[i], rows[i + 1]
        for j in range(n): bm.faces.new((A[j], A[(j + 1) % n], Bq[(j + 1) % n], Bq[j]))
    def cap(row, rev):
        c = Vector((0, 0, 0))
        for v in row: c += v.co
        pv = bm.verts.new(c / len(row))
        for j in range(n):
            a, b = row[j], row[(j + 1) % n]
            bm.faces.new((b, a, pv) if rev else (a, b, pv))
    if cap0: cap(rows[0], True)
    if cap1: cap(rows[-1], False)
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def bm_sweep(P, rf, tseg, cap0=True, cap1=True):
    """A round tube along the sampled engine points P, radius rf(t) for t in 0..1, parallel-transport frames."""
    rings = []; N = None; n = len(P) - 1
    for i, C in enumerate(P):
        T = (P[min(i + 1, n)] - P[max(i - 1, 0)]).normalized()
        if N is None:
            ref = Vector((0, 1, 0)) if abs(T.y) < 0.9 else Vector((1, 0, 0)); N = (ref - T * ref.dot(T)).normalized()
        else: N = (N - T * N.dot(T)).normalized()
        Bn = T.cross(N); r = rf(i / n)
        rings.append([tuple(C + (N * math.cos(a) + Bn * math.sin(a)) * r) for a in (TAU * j / tseg for j in range(tseg))])
    return bm_loft(rings, cap0, cap1)
def catenary(a, b, sag, n):
    """n+1 engine points on a wire hung from a to b, drooping `sag` in the middle."""
    a, b = Vector(a), Vector(b)
    return [a.lerp(b, t) - Vector((0, sag * (1 - (2 * t - 1) ** 2), 0)) for t in (i / n for i in range(n + 1))]
def fin_rings(centre, hz, ht, rows, tseg, section='zy'):
    """Rings of a fin: centre(u) -> engine point, hz(u)/ht(u) half chord / half thickness, section in the zy plane
    (a fin spanning x) or the xy plane (a tail stock running along z)."""
    out = []
    for i in range(rows + 1):
        u = i / rows; c = Vector(centre(u)); a_, b_ = hz(u), ht(u); ring = []
        for j in range(tseg):
            a = TAU * j / tseg
            ring.append(tuple(c + (Vector((0, b_ * math.sin(a), a_ * math.cos(a))) if section == 'zy' else Vector((a_ * math.cos(a), b_ * math.sin(a), 0)))))
        out.append(ring)
    return out

def build(B):
    L = B.L; lo = B.lo
    L['ico'] = B.pick(1, 0)   # bulbs: 80 tris at hi, 20 at lo
    L['cyl'] = B.pick(24, 12); L['bevel'] = B.pick(2, 1)
    # ---- materials ----
    M_blue = paint('whale_blue', COL, coat=1.0, rough=0.22, metal=0.12)
    M_blue2 = paint('whale_blue_deep', '#1e56b8', coat=1.0, rough=0.25, metal=0.12)
    M_belly_a = paint('belly_a', '#d8eefc', coat=0.7, rough=0.3, metal=0.0)
    M_belly_b = paint('belly_b', '#bfe0f4', coat=0.7, rough=0.32, metal=0.0)
    M_navy = mat('navy', NAVY, rough=0.25, coat=0.8)
    M_chassis = paint('chassis_navy', '#0e1a2e', coat=0.6, rough=0.32, metal=0.1)
    M_blush = glow('blush', '#ff9ab8', strength=0.45, rough=0.45, coat=0.4)
    M_hole = matte('blowhole', '#061020', rough=0.9)
    M_wood_a = satin('plank_a', '#e8d8b8', rough=0.6); M_wood_b = satin('plank_b', '#d2bb92', rough=0.62)
    M_orange = paint('buoy_orange', '#ff7a2a', coat=0.8, rough=0.35, metal=0.0)
    M_white = paint('buoy_white', '#f6f6f2', coat=0.8, rough=0.35, metal=0.0)
    M_spray = glow('spray', '#d8f0ff', strength=1.8, rough=0.15, coat=1.0)
    M_eye = paint('eye_white', '#ffffff', coat=0.4, rough=0.22, metal=0.0)
    M_iris = mat('iris_navy', NAVY, rough=0.1, metal=0.3, coat=1.0)
    M_cooler = paint('cooler_white', '#f2f6f8', coat=0.5, rough=0.4, metal=0.0)
    M_cyan = paint('cooler_cyan', '#38c8e8', coat=0.8, rough=0.3, metal=0.0)
    M_flag_y = satin('flag_yellow', '#ffe24a', rough=0.7); M_flag_p = satin('flag_pink', '#ff4fd8', rough=0.7)
    M_wire = matte('wire', '#101418', rough=0.8)
    led_cy = led('#38f2ff'); led_w = led('#ffffff', 3.0)

    # ================= chassis: dark navy rounded box, wheel arches, fenders, chrome trim, rivets, cyan underglow =================
    chassis = B.obj('chassis', bm_box(2.4, 0.4, 4.9, (0, 0.65, 0)), M_chassis, bevel=0.14, bevel_angle=False, segments=B.pick(3, 1))
    B.obj('chassis_under', bm_box(2.0, 0.12, 4.4, (0, 0.47, 0)), matte('under', '#07090e'), bevel=0.04, bevel_angle=False)
    for i, (x, z) in enumerate([(1.15, 1.85), (-1.15, 1.85), (1.15, -1.85), (-1.15, -1.85)]):
        B.cut([chassis], bm_cyl(0.64, 0.64, 0.9, B.pick(16, 10), AX, (x * 1.12, 0.5, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.66, 0.05, B.pick(16, 6), B.pick(6, 3), AX, (x, 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_navy)
    for s in (1, -1):
        B.obj('side_trim_%d' % (s > 0), bm_box(0.05, 0.05, 2.0, (s * 1.21, 0.7, 0)), chrome(), bevel=0.015, bevel_angle=False, segments=B.pick(2, 1))
        B.strip((s * 1.17, 0.46, 2.15), (s * 1.17, 0.46, -2.15), '#38f2ff')
        B.light(s * 1.3, 0.5, 0.0, 0.7, '#38f2ff', led=1)
        if not lo:
            for k in range(5): B.obj('rivet_%d_%d' % (s > 0, k), bm_uv(0.028, 8, 4, (s * 1.215, 0.78, -0.8 + k * 0.4)), chrome())
    B.strip((-1.0, 0.46, 2.4), (1.0, 0.46, 2.4), '#38f2ff'); B.strip((-1.0, 0.46, -2.4), (1.0, 0.46, -2.4), '#38f2ff')
    for z in (2.52, -2.52):
        B.obj('bumper_%d' % (z > 0), bm_box(2.2, 0.13, 0.16, (0, 0.5, z)), chrome(), bevel=0.05, bevel_angle=False, segments=B.pick(2, 1))
        if not lo:
            for s in (1, -1): B.obj('bumper_cap_%d_%d' % (z > 0, s > 0), bm_uv(0.09, 10, 6, (s * 1.1, 0.5, z)), chrome())
    B.lamps(0.95, 0.75, 2.45, -2.45, 0.75)
    if not lo:
        for s in (1, -1): B.obj('lamp_ring_%d' % (s > 0), bm_torus(0.19, 0.022, 12, 4, AZ, (s * 0.95, 0.75, 2.47)), chrome())

    # ================= the whale: clear-coat blue back, grooved pale belly, chrome waterline =================
    seg, rings = B.pick(44, 20), B.pick(16, 8)
    shell = B.obj('body_blue', bm_ellipsoid(RX, RY, RZ, seg, rings, BC, phi0=0.0, phi1=PH_BREAK + 0.06), M_blue)
    # throat grooves: alternating raised stripes across the belly (real ridges), each a height-field strip of the ellipsoid
    XMAX = RX * math.sqrt(Q) * 0.996; nst = 17; nu, nv = B.pick(3, 2), B.pick(18, 7)
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
    # chrome waterline pinstripe along the colour break
    B.obj('waterline', bm_torus(RX * math.sqrt(Q) + 0.01, 0.022, B.pick(48, 24), B.pick(6, 4), AY, (BC[0], BC[1] + Y_BREAK, BC[2]), sy=RZ / RX), chrome())
    # a small dorsal fin near the tail
    fin_at, _ = body_top(0, -2.2)
    fin = B.obj('dorsal', bm_profile([(-0.3, -0.2), (0.32, -0.2), (0.36, 0.0), (0.3, 0.26), (0.2, 0.4), (0.0, 0.3), (-0.22, 0.12)], 0.1, (0, fin_at.y - 0.06, -2.2), M=rot(math.pi / 2)), M_blue2)
    B.bevel(fin, 0.045, angle=True, segments=B.pick(4, 1), profile=0.6)

    # ================= face: cheeky smile on the surface, cartoon eyes with lids, blush, blowhole =================
    pts = []
    nsm = B.pick(28, 12)
    for i in range(nsm + 1):
        t = -1 + 2 * i / nsm
        p, n = body_pt(0.88 * t, 1.5 + 0.34 * t * t * abs(t) ** 0.5); pts.append(p + n * 0.01)
    B.obj('smile', bm_sweep(pts, lambda t: 0.048 + 0.018 * math.sin(math.pi * t), B.pick(8, 5)), M_navy)
    for s in ((1, -1) if not lo else ()):
        p, n = body_pt(s * 0.88, 1.84); B.obj('dimple_%d' % (s > 0), bm_uv(0.055, B.pick(12, 8), B.pick(7, 5), tuple(p + n * 0.01)), M_navy)
    for s in (1, -1):
        at = Vector((s * 1.02, 1.95, 1.75)); r = 0.2
        _, n = body_side(1.95, 1.75); n = Vector((s * n.x, n.y, n.z))
        look = (n + Vector((0, 0.02, 0.4))).normalized()   # outward along the flank, a touch forward
        B.obj('eye_white_%d' % (s > 0), bm_uv(r, B.pick(20, 10), B.pick(12, 7), tuple(at)), M_eye)
        B.obj('eye_iris_%d' % (s > 0), bm_uv(r * 0.47, max(8, L['sph'] // 2), max(5, L['ring'] // 2), tuple(at + look * r * 0.83)), M_iris)
        if not lo:
            B.obj('eye_hl_%d' % (s > 0), bm_uv(r * 0.11, 8, 5, tuple(at + look * r * 1.22 + Vector((s * 0.03, 0.05, -0.02)))), led_w)
        # a navy upper eyelid arc, tilted for the cheeky look
        lid_ax = aim((look.x, look.y, look.z))
        B.obj('eyelid_%d' % (s > 0), bm_torus(r * 0.9, 0.035, B.pick(14, 8), B.pick(5, 4), lid_ax, tuple(at + look * r * 0.46), sweep=(0.05, math.pi - 0.05)), M_navy)
        # blush
        p, n = body_pt(s * 1.05, 1.55)
        B.obj('blush_%d' % (s > 0), bm_ellipsoid(0.24, 0.06, 0.15, B.pick(12, 8), B.pick(6, 4), tuple(p + n * 0.015), M=aim((n.x, n.y, n.z))), M_blush)
    # blowhole: navy lip ring and a dark bore, and the spout (a plume of pale glowing droplets at hi)
    bp, bn = body_top(0, 1.0); bax = aim((bn.x, bn.y, bn.z))
    B.obj('blowhole_lip', bm_torus(0.17, 0.045, B.pick(18, 10), B.pick(6, 4), bax, tuple(bp + bn * 0.02), sy=0.72), M_navy)
    B.obj('blowhole_bore', bm_cyl(0.145, 0.145, 0.06, B.pick(20, 10), bax, tuple(bp - bn * 0.005)), M_hole)
    B.obj('blowhole_core', bm_uv(0.07, B.pick(12, 8), B.pick(6, 4), tuple(bp + bn * 0.02)), led(LIGHT, 4.0))
    if not lo:
        for i, (x, y, z, r) in enumerate([(0.0, 3.14, 1.0, 0.065), (0.1, 3.3, 1.04, 0.05), (-0.12, 3.36, 0.96, 0.055), (0.04, 3.52, 1.0, 0.045),
                                          (-0.2, 3.5, 1.1, 0.04), (0.22, 3.66, 0.9, 0.04), (-0.05, 3.76, 1.02, 0.035), (0.14, 3.9, 1.06, 0.03), (-0.16, 3.86, 0.92, 0.03)]):
            B.obj('spray_%d' % i, bm_uv(r, 8, 5, (x, y, z)), M_spray)
    B.light(0, 3.1, 1.0, 1.6, LIGHT, big=1)

    # ================= flippers (parts flipperL / flipperR, rolled by the game) =================
    for name, s in (('flipperL', 1), ('flipperR', -1)):
        P = B.part(name, (s * 1.3, 1.25, 0.9))
        def centre(u, s=s): return (s * 1.15 * u, -0.1 - 0.14 * u * u, -0.15 - 0.12 * u)
        def hz(u): return 0.33 * math.sqrt(max(0.0, 1 - u ** 3)) * (0.86 + 0.14 * math.sin(math.pi * u))
        def ht(u): return 0.1 * math.sqrt(max(0.0, 1 - u * u)) * (1 - 0.45 * u) + 0.012
        B.obj(name + '_fin', bm_loft(fin_rings(centre, hz, ht, B.pick(14, 6), B.pick(16, 8))), M_blue, parent=P)
        if not lo:   # a pale leading-edge highlight stripe
            P2 = [Vector(centre(u)) + Vector((0, 0.02, hz(u) * 0.9)) for u in (i / 10 for i in range(1, 10))]
            B.obj(name + '_edge', bm_sweep(P2, lambda t: 0.018, 5), M_belly_a, parent=P)

    # ================= tail (part `tail`, pitched by the game): tapering stock and two swept flukes =================
    T = B.part('tail', (0, 1.7, -2.75))
    stock = [((0.0, 0.05, 0.55), 0.8, 0.68), ((0.0, 0.06, 0.2), 0.62, 0.53), ((0.0, 0.08, -0.15), 0.46, 0.4), ((0.0, 0.13, -0.5), 0.32, 0.3),
             ((0.0, 0.22, -0.82), 0.23, 0.23), ((0.0, 0.29, -1.02), 0.17, 0.17)]
    sr = []
    tseg = B.pick(16, 8)
    for c, rx_, ry_ in stock:
        sr.append([tuple(Vector(c) + Vector((rx_ * math.cos(a), ry_ * math.sin(a), 0))) for a in (TAU * j / tseg for j in range(tseg))])
    B.obj('tail_stock', bm_loft(sr), M_blue, parent=T)
    for s in (1, -1):
        def centre(u, s=s): return (s * (0.08 + 1.12 * u), 0.3 + 0.1 * u, -0.98 - 0.36 * u - 0.1 * u * u)
        def hz(u): return 0.42 * (1 - 0.5 * u) * math.sqrt(max(0.0, 1 - u ** 2.6))
        def ht(u): return 0.085 * (1 - 0.55 * u) * math.sqrt(max(0.0, 1 - u ** 2.6)) + 0.01
        B.obj('fluke_%d' % (s > 0), bm_loft(fin_rings(centre, hz, ht, B.pick(14, 6), B.pick(16, 8))), M_blue, parent=T)
    B.obj('tail_notch', bm_uv(0.1, B.pick(12, 8), B.pick(7, 4), (0, 0.3, -1.0)), M_blue, parent=T)

    # ================= party deck: plank platform, chrome edge, legs, posts, rails, bulbs, festoons, flags =================
    DY, DZ = 3.0, -0.6
    npl = B.pick(6, 3); gap = 0.014; pw = (1.5 - gap * (npl - 1)) / npl
    for k in range(npl):
        x = -0.75 + pw / 2 + k * (pw + gap)
        B.obj('plank_%d' % k, bm_box(pw, 0.08, 2.2, (x, DY, DZ)), M_wood_a if k % 2 == 0 else M_wood_b, bevel=0.012, bevel_angle=False, segments=B.pick(3, 1))
    B.obj('deck_frame', bm_box(1.46, 0.1, 2.16, (0, DY - 0.09, DZ)), M_navy, bevel=0.03, bevel_angle=False)
    for s in (1, -1):
        B.obj('deck_edge_%d' % (s > 0), bm_rod((s * 0.76, DY + 0.03, DZ + 1.1), (s * 0.76, DY + 0.03, DZ - 1.1), 0.022, L['rod']), chrome())
    for z in (DZ + 1.1, DZ - 1.1): B.obj('deck_edge_z_%d' % (z > DZ), bm_rod((-0.76, DY + 0.03, z), (0.76, DY + 0.03, z), 0.022, L['rod']), chrome())
    for s in (1, -1):
        for z in (0.35, -1.55):
            top, _ = body_top(s * 0.62, z)
            B.obj('deck_leg_%d_%d' % (s > 0, z > 0), bm_rod((s * 0.62, top.y - 0.08, z), (s * 0.62, DY - 0.1, z), 0.04, L['rod']), dark_chrome())
    # posts: front pair to the rail height, rear pair taller with pennants; rails along both sides and across the ends
    for s in (1, -1):
        B.obj('post_f_%d' % (s > 0), bm_rod((s * 0.72, DY, 0.45), (s * 0.72, 3.5, 0.45), 0.03, L['rod']), chrome())
        B.obj('post_r_%d' % (s > 0), bm_rod((s * 0.72, DY, -1.65), (s * 0.72, 4.25, -1.65), 0.03, L['rod']), chrome())
        B.obj('post_r_cap_%d' % (s > 0), bm_uv(0.045, B.pick(10, 6), B.pick(6, 4), (s * 0.72, 4.27, -1.65)), chrome())
        B.obj('rail_%d' % (s > 0), bm_rod((s * 0.72, 3.5, 0.45), (s * 0.72, 3.5, -1.65), 0.025, L['rod']), chrome())
        if not lo:
            for z in (0.45, -1.65): B.obj('post_foot_%d_%d' % (s > 0, z > 0), bm_cyl(0.06, 0.05, 0.03, 12, AY, (s * 0.72, DY + 0.055, z)), dark_chrome())
        # pennant flags on the rear posts
        flag = [(0, 0.0), (s * 0.46, -0.1), (0, -0.24)]
        B.obj('flag_%d' % (s > 0), bm_profile(flag, 0.012, (s * 0.75, 4.2, -1.65)), M_flag_y if s > 0 else M_flag_p, smooth=False)
    B.obj('rail_front', bm_rod((-0.72, 3.5, 0.45), (0.72, 3.5, 0.45), 0.025, L['rod']), chrome())
    B.obj('rail_rear', bm_rod((-0.72, 3.5, -1.65), (0.72, 3.5, -1.65), 0.025, L['rod']), chrome())
    # the spec'd LED bulbs along the rail tops (every 3rd gets a game light), with sockets at hi
    n = B.pick(8, 4)
    for s in (1, -1):
        B.leds((s * 0.72, 3.52, 0.45), (s * 0.72, 3.52, -1.65), n, BULBS, 0.05, 3, prefix='rail%d' % (s > 0))
        if not lo:
            for i in range(n):
                z = 0.45 - 2.1 * i / (n - 1)
                B.obj('socket_%d_%d' % (s > 0, i), bm_cyl(0.028, 0.024, 0.04, 10, AY, (s * 0.72, 3.5, z)), dark_chrome())
    # festoon strings: the front rail, the tall rear posts, and a swag along each side from the front post up to the rear post
    def festoon(name, a, b, sag, nb, cols, r=0.038):
        P = catenary(a, b, sag, B.pick(16, 8))
        B.obj(name + '_wire', bm_sweep(P, lambda t: 0.009, B.pick(5, 4)), M_wire, smooth=False)
        if lo: return
        for i in range(nb):
            t = (i + 1) / (nb + 1); p = Vector(a).lerp(Vector(b), t) - Vector((0, sag * (1 - (2 * t - 1) ** 2), 0))
            B.obj(name + '_pend_%d' % i, bm_rod(tuple(p), tuple(p - Vector((0, 0.05, 0))), 0.007, 4), M_wire, smooth=False)
            B.obj(name + '_sock_%d' % i, bm_cyl(0.02, 0.017, 0.03, 8, AY, tuple(p - Vector((0, 0.06, 0)))), dark_chrome())
            B.obj(name + '_bulb_%d' % i, bm_ico(r, 1, tuple(p - Vector((0, 0.1, 0)))), led(cols[i % len(cols)]))
    festoon('fest_front', (0.72, 3.5, 0.45), (-0.72, 3.5, 0.45), 0.12, 5, BULBS[1:] + BULBS[:1])
    festoon('fest_rear', (0.72, 4.25, -1.65), (-0.72, 4.25, -1.65), 0.14, 5, BULBS)
    for s in (1, -1):
        festoon('fest_side_%d' % (s > 0), (s * 0.78, 3.5, 0.45), (s * 0.78, 4.25, -1.65), 0.16, 6, BULBS[2:] + BULBS[:2])
    # deck props: a cooler (left rear) and a little DJ speaker box (right rear) facing backwards
    B.obj('cooler', bm_box(0.42, 0.3, 0.3, (0.42, DY + 0.19, -1.3)), M_cooler, bevel=0.03, bevel_angle=False)
    B.obj('cooler_lid', bm_box(0.45, 0.07, 0.33, (0.42, DY + 0.37, -1.3)), M_cyan, bevel=0.025, bevel_angle=False)
    B.obj('cooler_handle', bm_rod((0.42, DY + 0.41, -1.18), (0.42, DY + 0.41, -1.42), 0.015, B.pick(8, 5)), chrome())
    B.obj('dj_box', bm_box(0.42, 0.4, 0.3, (-0.42, DY + 0.24, -1.3)), satin('dj_box', '#1a1e2c', 0.5), bevel=0.03, bevel_angle=False)
    B.speaker((-0.42, DY + 0.24, -1.46), AZn, 0.12, 0.15, 'dj_spk', '#ff4fd8')
    if not lo: B.obj('dj_dial', bm_cyl(0.03, 0.03, 0.02, 10, AY, (-0.42, DY + 0.45, -1.3)), chrome())
    B.light(-0.42, DY + 0.24, -1.55, 0.5, '#ff4fd8', led=1)
    # the steering column from the deck to the wheel
    B.obj('column', bm_rod((0, DY + 0.04, 0.12), (0, 3.74, 0.15), 0.04, L['rod']), chrome())

    # ================= lifebuoy on the left flank, hung on a chrome hook =================
    p, n = body_side(2.1, -1.0); ax = aim((n.x, n.y, n.z)); c = p + n * 0.07
    for k in range(4):
        B.obj('buoy_%d' % k, bm_torus(0.3, 0.075, B.pick(8, 4), B.pick(10, 6), ax, tuple(c), sweep=(k * math.pi / 2, (k + 1) * math.pi / 2)), M_orange if k % 2 == 0 else M_white)
    B.obj('buoy_hook', bm_rod(tuple(p + n * 0.0 + Vector((0, 0.33, 0))), tuple(c + Vector((0, 0.36, 0))), 0.02, B.pick(8, 5)), chrome())
    if not lo:
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            B.obj('buoy_rope_%d' % k, bm_torus(0.3, 0.012, 3, 4, ax, tuple(c), sweep=(a - 0.12, a + 0.12)), matte('rope', '#e8dcc0', 0.8))

    # ================= wheels, seat (on the deck), size info =================
    B.wheels(1.15, 1.85, -1.85, r=0.5, w=0.42, rim=COL2, tyre='#141a24', cap=LIGHT)
    B.seat(0, 3.42, -0.55, col='#1a3a7a', accent=COL2, wheelY=3.78, wheelZ=0.1, column=False)
    B.info(6.0, 3.2, 4.4, muzzle=(0, 3.0, 1.0), wheelR=0.5)

if __name__ == '__main__':
    run('whale_of_a_time', build)
