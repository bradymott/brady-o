# Calamari Inferno (Art Cart car #3): a riveted steampunk copper octopus; eight arms, every one of them breathes fire.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/calamari_inferno.py
# Writes assets/models/art-cart/calamari_inferno.glb (showroom, 20–30k tris) and calamari_inferno_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#c8743a', '#ffd06a', '#ff8a2a'   # CART_CARS.octo palette: copper, brass, flame
HEAD = (0, 2.75, 0.55)                               # the head bone's pivot (engine coords)
ARM_PTS = [(0, 0, 0), (0, -0.15, 0.5), (0, -0.45, 0.95), (0, -0.8, 1.25), (0, -1.0, 1.45)]   # arm spine, part-local

# ---- local helpers (the kit has no aimed primitives or swept tubes) ----
def aim(d):
    """A matrix that points a primitive's axis (Blender Z) along the engine direction d; use as `axis`/`M`."""
    v = E(*d); v.normalize()
    return v.to_track_quat('Z', 'Y').to_matrix().to_4x4()
def crom(P, s):
    """Catmull-Rom point on the polyline P at parameter s in 0..len(P)-1."""
    k = min(len(P) - 2, max(0, int(s))); t = s - k
    p0 = P[max(k - 1, 0)]; p1 = P[k]; p2 = P[k + 1]; p3 = P[min(k + 2, len(P) - 1)]
    t2 = t * t; t3 = t2 * t
    return Vector(tuple(0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3) for i in range(3)))
def arm_frame(s):
    """Centre, tangent and 'up' (the outside of the curl) of the arm spine at s (0..4), engine vectors."""
    n = len(ARM_PTS) - 1
    C = crom(ARM_PTS, s); T = crom(ARM_PTS, min(n, s + 0.01)) - crom(ARM_PTS, max(0, s - 0.01)); T.normalize()
    X = Vector((1, 0, 0)); U = T.cross(X); U.normalize()
    return C, T, U
def arm_r(s): return 0.24 - 0.045 * s
def bm_arm_tube(s0, s1, seg, rows, flat=0.18):
    """One copper arm plate: a tube swept along the spine from s0 to s1, slightly flattened on the sucker side, capped."""
    bm = bmesh.new(); rings = []; X = Vector((1, 0, 0))
    for i in range(rows + 1):
        s = s0 + (s1 - s0) * i / rows; C, T, U = arm_frame(s); r = arm_r(s); ring = []
        for j in range(seg):
            th = TAU * j / seg; cx, sy = math.cos(th), math.sin(th)
            f = 1 - flat * max(0.0, -sy)
            p = C + (X * cx + U * sy) * r * f
            ring.append(bm.verts.new(E(*p)))
        rings.append(ring)
    for i in range(rows):
        for j in range(seg):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % seg], rings[i + 1][(j + 1) % seg], rings[i + 1][j]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def ell_pt(c, R, a, ph, k=1.0):
    """A point on the mantle ellipsoid (centre c, radii R) at azimuth a (0 = forward) and polar angle ph (0 = top), scaled k."""
    return (c[0] + math.sin(a) * math.sin(ph) * R[0] * k, c[1] + math.cos(ph) * R[1] * k, c[2] + math.cos(a) * math.sin(ph) * R[2] * k)
def ell_n(c, R, p):
    n = Vector(((p[0] - c[0]) / R[0] ** 2, (p[1] - c[1]) / R[1] ** 2, (p[2] - c[2]) / R[2] ** 2)); n.normalize(); return n

def build(B):
    L = B.L; lo = B.lo
    # ---- materials: polished copper and brass, dark iron chassis, warm glows ----
    M_cu = metal('copper', COL, 0.2); M_cu2 = metal('copper_dark', '#9a5228', 0.28); M_cu3 = metal('copper_deep', '#7a3e1c', 0.3)
    M_br = metal('brass', COL2, 0.14); M_br2 = metal('brass_dark', '#b8863a', 0.22)
    M_fe = metal('iron', '#2e2622', 0.5); M_fe2 = metal('iron_dark', '#1c1614', 0.6)
    M_eye = glow('eye_glow', '#ff9a2a', strength=2.4, rough=0.2); M_pupil = mat('pupil', '#1a0a04', rough=0.15, coat=1.0)
    M_flame = led(LIGHT, 4.5); M_gauge = glow('gauge_glow', '#ffe6a0', strength=1.2, rough=0.2)
    rivet_r = 0.045
    def rivet(name, p, r=rivet_r, parent=None, m=M_br):
        if lo: return
        B.obj(name, bm_ico(r, 0, p), m, parent=parent)

    # ---- chassis: platform with LED rows, wheel arches, brass deck plate ----
    B.platform(4.8, 2.4, 0.66, 0.5, '#3a2418', leds=[LIGHT, COL2])
    plat = [o for o in B.objs if o.name == 'platform']
    for i, (x, z) in enumerate([(1.1, 1.7), (-1.1, 1.7), (1.1, -1.7), (-1.1, -1.7)]):
        B.cut(plat, bm_cyl(0.62, 0.62, 0.9, B.pick(14, 10), AX, (x * 1.1, 0.5, z)), 'arch_%d' % i)
        if not lo: B.obj('fender_%d' % i, bm_torus(0.64, 0.045, 14, 5, AX, (x, 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_br2)
    B.obj('deck', bm_box(2.3, 0.14, 4.0, (0, 0.98, -0.3)), M_br2, bevel=0.04, bevel_angle=False)
    if not lo:
        for s in (1, -1):
            for k in range(10): rivet('deck_rv_%d_%d' % (s > 0, k), (s * 1.06, 1.05, -2.2 + k * 0.4))
        for k in range(5):
            rivet('deck_rvf_%d' % k, (-0.8 + k * 0.4, 1.05, 1.6)); rivet('deck_rvb_%d' % k, (-0.8 + k * 0.4, 1.05, -2.2))
    # front cowcatcher: brass rails and angled bars; rear iron bumper
    B.obj('cow_rail', bm_rod((-1.0, 0.72, 2.5), (1.0, 0.72, 2.5), 0.04, L['rod']), M_br)
    B.obj('cow_rail2', bm_rod((-0.55, 0.22, 2.72), (0.55, 0.22, 2.72), 0.035, L['rod']), M_br)
    nb = B.pick(7, 3)
    for k in range(nb):
        x = -0.9 + 1.8 * k / (nb - 1)
        B.obj('cow_bar_%d' % k, bm_rod((x, 0.72, 2.5), (x * 0.55, 0.2, 2.73), 0.03, L['rod']), M_br)
    B.obj('bumper_rear', bm_box(2.3, 0.14, 0.14, (0, 0.6, -2.5)), M_fe, bevel=0.04, bevel_angle=False)
    # ---- boiler drum under the head: iron, brass bands, rivets, a pressure gauge, valve wheels ----
    B.obj('boiler', bm_cyl(0.95, 0.95, 0.62, L['cyl'], AY, (0, 1.0, 0.55)), M_fe, bevel=0.05)
    for k, y in enumerate((0.76, 1.24)):
        B.obj('boiler_band_%d' % k, bm_torus(0.95, 0.045, B.pick(24, 12), B.pick(5, 4), AY, (0, y, 0.55)), M_br)
    if not lo:
        for k in range(12):
            a = k / 12 * TAU; rivet('boiler_rv_%d' % k, (math.sin(a) * 0.95, 1.0, 0.55 + math.cos(a) * 0.95))
    B.obj('neck', bm_cyl(0.82, 0.78, 0.5, L['cyl_s'], AY, (0, 1.55, 0.55)), M_cu2)
    B.obj('collar', bm_torus(1.05, 0.09, B.pick(24, 12), B.pick(6, 5), AY, (0, 1.42, 0.55)), M_br)
    B.obj('neck_ring', bm_torus(0.8, 0.05, L['cyl_s'], B.pick(6, 4), AY, (0, 1.82, 0.55)), M_br)
    # the pressure gauge on the boiler's nose
    gp = (0, 1.0, 1.5)
    B.obj('gauge_rim', bm_torus(0.2, 0.03, B.pick(20, 10), B.pick(6, 4), AZ, gp), chrome())
    B.obj('gauge_face', bm_cyl(0.19, 0.19, 0.05, B.pick(20, 10), AZ, gp), M_gauge)
    if not lo:
        B.obj('gauge_needle', bm_rod((0, 1.0, 1.54), (0.1, 1.12, 1.54), 0.012, 5), M_fe2)
        B.obj('gauge_hub', bm_uv(0.025, 8, 4, (0, 1.0, 1.54)), chrome())
    # valve wheels on the boiler's flanks
    for s in (1, -1):
        vp = (s * 0.96, 1.0, 0.3)
        B.obj('valve_stem_%d' % (s > 0), bm_rod((s * 0.9, 1.0, 0.3), (s * 1.08, 1.0, 0.3), 0.035, L['rod']), M_br2)
        if lo: continue
        B.obj('valve_wheel_%d' % (s > 0), bm_torus(0.14, 0.025, 12, 5, AX, (s * 1.08, 1.0, 0.3)), M_br)
        if True:
            for k in range(4):
                a = k / 4 * TAU
                B.obj('valve_spoke_%d_%d' % (s > 0, k), bm_rod((s * 1.08, 1.0, 0.3), (s * 1.08, 1.0 + math.sin(a) * 0.13, 0.3 + math.cos(a) * 0.13), 0.012, 5), M_br)
    # copper steam pipes along the deck to flared exhaust stacks at the rear corners
    for s in (1, -1):
        B.obj('pipe_%d' % (s > 0), bm_rod((s * 1.0, 1.14, -0.1), (s * 1.0, 1.14, -2.25), 0.055, L['rod']), M_cu)
        if not lo: B.obj('pipe_elbow_%d' % (s > 0), bm_uv(0.06, 10, 6, (s * 1.0, 1.14, -2.25)), M_cu)
        B.obj('stack_%d' % (s > 0), bm_rod((s * 1.0, 1.14, -2.25), (s * 1.0, 1.7, -2.25), 0.055, L['rod']), M_cu)
        B.obj('stack_flare_%d' % (s > 0), bm_cyl(0.06, 0.1, 0.16, B.pick(12, 8), AY, (s * 1.0, 1.76, -2.25)), M_br)
        if not lo:
            B.obj('stack_bore_%d' % (s > 0), bm_cyl(0.075, 0.075, 0.1, 8, AY, (s * 1.0, 1.8, -2.25), caps=False, flip=True), M_fe2)
            for z in (-0.5, -1.2, -1.9): B.obj('clamp_%d_%d' % (s > 0, int(-z * 10)), bm_torus(0.062, 0.018, 8, 4, AZ, (s * 1.0, 1.14, z)), M_br)
            B.obj('pipe_in_%d' % (s > 0), bm_rod((s * 0.55, 1.14, -0.1), (s * 1.0, 1.14, -0.1), 0.055, L['rod']), M_cu)
    # ---- head lamps with brass rings, tail lamps ----
    B.lamps(0.85, 0.95, 2.42, -2.42, 0.85)
    if not lo:
        for s in (1, -1): B.obj('lamp_ring_%d' % (s > 0), bm_torus(0.19, 0.025, 16, 5, AZ, (s * 0.85, 0.95, 2.45)), M_br)

    # ---- the head (mantle): bobs, pitches and yaws on bone part_head ----
    H = B.part('head', HEAD)
    hc, hr = (0, 0.35, -0.2), (1.25, 1.45, 1.35)
    B.obj('mantle', bm_ellipsoid(*hr, B.pick(26, 14), B.pick(16, 9), hc), M_cu, parent=H)
    B.obj('mantle_skirt', bm_ellipsoid(1.05, 0.45, 1.05, B.pick(24, 12), B.pick(6, 4), (0, -0.5, 0.05), phi0=math.pi / 2), M_cu3, parent=H)
    B.obj('skirt_rim', bm_torus(1.05, 0.05, B.pick(24, 12), B.pick(6, 4), AY, (0, -0.5, 0.05)), M_br, parent=H)
    # brass seam bands around the mantle, with rivet rows between them
    for k, ph in enumerate((0.82, 1.28)):
        B.obj('mantle_band_%d' % k, bm_torus(hr[0] * math.sin(ph), 0.035, B.pick(28, 14), B.pick(6, 4), AY, (0, hc[1] + hr[1] * math.cos(ph), hc[2]), sy=hr[2] / hr[0]), M_br, parent=H)
    # two longitudinal plate seams over the crown
    for s in ((1, -1) if not lo else ()):
        x = s * 0.5; q = math.sqrt(1 - (x / hr[0]) ** 2)
        B.obj('mantle_seam_%d' % (s > 0), bm_torus(hr[1] * q, 0.03, 20, 6, AX, (x, hc[1], hc[2]), sweep=(math.pi / 2 + 0.15, 3 * math.pi / 2 - 0.55), sy=hr[2] / hr[1]), M_br, parent=H)
    if not lo:
        for r in range(3):
            n = 16; ph = 0.6 + r * 0.45
            for i in range(n):
                a = (i + 0.5 * (r % 2)) / n * TAU
                rivet('mantle_rv_%d_%d' % (r, i), ell_pt(hc, hr, a, ph, 1.015), parent=H)
    # porthole eyes: brass rim and bolts on a brass flange, a warm glowing lens, a dark pupil, a highlight
    for s in (1, -1):
        p = (s * 0.62, 0.05, 0.98); n = ell_n(hc, hr, p); nn = tuple(n); P = Vector(p)
        def off(k): return tuple(P + n * k)
        if not lo: B.obj('eye_flange_%d' % (s > 0), bm_cyl(0.37, 0.37, 0.06, 20, aim(nn), off(-0.02)), M_br2, parent=H)
        B.obj('eye_rim_%d' % (s > 0), bm_torus(0.3, 0.07, B.pick(18, 10), B.pick(6, 5), aim(nn), off(0.03)), M_br, parent=H)
        B.obj('eye_lens_%d' % (s > 0), bm_cyl(0.27, 0.25, 0.12, B.pick(20, 10), aim(nn), off(0.02)), M_eye, parent=H)
        B.obj('eye_pupil_%d' % (s > 0), bm_ellipsoid(0.1, 0.05, 0.14, B.pick(12, 8), B.pick(6, 4), tuple(P + n * 0.1 + Vector((s * 0.03, 0, 0))), M=aim(nn)), M_pupil, parent=H)
        if not lo:
            B.obj('eye_hl_%d' % (s > 0), bm_uv(0.03, 8, 4, tuple(P + n * 0.11 + Vector((s * 0.09, 0.09, 0)))), led('#ffffff', 3.0), parent=H)
            for k in range(6):
                a = k / 6 * TAU
                # bolts around the rim, in the rim's plane
                u = Vector((1, 0, 0)).cross(n); u.normalize(); v = n.cross(u)
                rivet('eye_bolt_%d_%d' % (s > 0, k), tuple(P + n * 0.0 + (u * math.cos(a) + v * math.sin(a)) * 0.36), 0.035, parent=H)
    # a brass hatch with a valve wheel on the crown, in front of the chimney
    hp = (0, 1.62, 0.45); hn = ell_n(hc, hr, hp); HP = Vector(hp)
    B.obj('hatch', bm_cyl(0.3, 0.28, 0.08, B.pick(20, 10), aim(tuple(hn)), tuple(HP + hn * 0.02)), M_br2, parent=H)
    if not lo:
        B.obj('hatch_wheel', bm_torus(0.16, 0.025, 16, 5, aim(tuple(hn)), tuple(HP + hn * 0.13)), M_br, parent=H)
        B.obj('hatch_stem', bm_rod(tuple(HP + hn * 0.04), tuple(HP + hn * 0.14), 0.03, L['rod']), M_br2, parent=H)
        u = Vector((1, 0, 0)); v = hn.cross(u)
        for k in range(4):
            a = k / 4 * TAU
            B.obj('hatch_spoke_%d' % k, bm_rod(tuple(HP + hn * 0.13), tuple(HP + hn * 0.13 + (u * math.cos(a) + v * math.sin(a)) * 0.15), 0.012, 5), M_br, parent=H)
    # the chimney (puffs smoke in the game: world ≈ (0, 4.7, -0.15) = pivot + local (0, 1.95, -0.7))
    c0, c1 = (0, 1.4, -0.5), (0, 1.95, -0.7)
    cd = Vector(c1) - Vector(c0); cd.normalize()
    B.obj('chimney', bm_rod(c0, c1, 0.15, B.pick(16, 8), r1=0.17), M_fe, parent=H)
    B.obj('chimney_flare', bm_cyl(0.17, 0.22, 0.12, B.pick(16, 8), aim(tuple(cd)), tuple(Vector(c1) - cd * 0.04)), M_fe, parent=H)
    B.obj('chimney_cap', bm_torus(0.215, 0.035, B.pick(16, 8), B.pick(6, 4), aim(tuple(cd)), tuple(Vector(c1) + cd * 0.02)), M_br, parent=H)
    if not lo:
        B.obj('chimney_bore', bm_cyl(0.18, 0.18, 0.14, 12, aim(tuple(cd)), tuple(Vector(c1) - cd * 0.05), caps=False, flip=True), M_fe2, parent=H)
        B.obj('chimney_band', bm_torus(0.165, 0.028, 16, 5, aim(tuple(cd)), tuple(Vector(c0) + cd * 0.28)), M_br, parent=H)
        for k in range(8):
            a = k / 8 * TAU; u = Vector((1, 0, 0)); v = cd.cross(u)
            rivet('chimney_rv_%d' % k, tuple(Vector(c0) + cd * 0.28 + (u * math.cos(a) + v * math.sin(a)) * 0.165), 0.028, parent=H)
    B.obj('chimney_base', bm_cyl(0.24, 0.17, 0.1, B.pick(16, 8), aim(tuple(cd)), tuple(Vector(c0) + cd * 0.08)), M_br2, parent=H)
    B.light(0, 2.8, 1.55, 2.4, '#ff9a2a', big=1)

    # ---- eight arms: identical, un-rotated (the pose fn yaws each one into place) ----
    seg = B.pick(12, 7); rows = B.pick(4, 2)
    for i in range(8):
        a = (i + 0.5) / 8 * TAU
        A = B.part('arm%d' % i, (math.sin(a) * 1.05, 1.55, 0.55 + math.cos(a) * 1.1))
        # a brass socket on the body where the arm emerges
        B.obj('socket_%d' % i, bm_cyl(0.3, 0.27, 0.16, B.pick(16, 8), aim((math.sin(a), 0, math.cos(a))), (math.sin(a) * 0.97, 1.55, 0.55 + math.cos(a) * 1.02)), M_br)
        # four tapered copper plates with brass joint rings between them
        for k in range(4):
            B.obj('arm%d_seg%d' % (i, k), bm_arm_tube(k, k + 1, seg, rows), M_cu if k % 2 == 0 else M_cu2, parent=A)
        for k in (1, 2, 3):
            C, T, U = arm_frame(k)
            if not lo: B.obj('arm%d_ring%d' % (i, k), bm_torus(arm_r(k) + 0.005, 0.035, 10, 4, aim(tuple(T)), tuple(C)), M_br, parent=A)
        # sucker pads along the underside (the inside of the curl)
        if not lo:
            for k, s in enumerate((0.9, 1.5, 2.1, 2.65, 3.2)):
                C, T, U = arm_frame(s); r = arm_r(s); rs = 0.085 - 0.012 * k
                p = C - U * (r * (1 - 0.18) + 0.01)
                B.obj('arm%d_suck%d' % (i, k), bm_cyl(rs * 0.7, rs, 0.045, 8, aim(tuple(-U)), tuple(p)), M_br, parent=A)
        # the flame nozzle: brass flared cone, dark bore, brass lip, a glowing flame tip
        C, T, U = arm_frame(4.0)
        B.obj('arm%d_nozzle' % i, bm_cyl(0.065, 0.1, 0.26, B.pick(12, 8), aim(tuple(T)), tuple(C + T * 0.12)), M_br, parent=A)
        if not lo:
            B.obj('arm%d_lip' % i, bm_torus(0.1, 0.025, 10, 4, aim(tuple(T)), tuple(C + T * 0.25)), M_br2, parent=A)
            B.obj('arm%d_bore' % i, bm_cyl(0.08, 0.08, 0.08, 10, aim(tuple(T)), tuple(C + T * 0.22), caps=False, flip=True), M_fe2, parent=A)
        B.obj('arm%d_flame' % i, bm_uv(0.075, 10, 6, tuple(C + T * 0.3)) if not lo else bm_ico(0.075, 0, tuple(C + T * 0.3)), M_flame, parent=A)

    # ---- wheels, seat, size info ----
    B.wheels(1.1, 1.7, -1.7, r=0.5, w=0.4, rim=COL2, tyre='#1a1410', cap=LIGHT)
    B.seat(0, 1.45, -1.75, col='#5a2a14', accent=LIGHT)
    B.info(5.2, 3.6, 4.3, muzzle=(0, 1.6, 1.3), wheelR=0.5, extra={'arms': 8, 'armZ': 0.55, 'chimney': [0, 4.7, -0.15]})

if __name__ == '__main__':
    run('calamari_inferno', build, level_overrides={'hi': {'cyl': 24, 'bevel': 3}})
