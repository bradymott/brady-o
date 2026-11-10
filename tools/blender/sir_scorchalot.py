# Sir Scorchalot (Art Cart car #4): a scaly gentleman dragon with very bad manners, on a glossy emerald coach.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/sir_scorchalot.py', run_name='__main__')
# Writes assets/models/art-cart/sir_scorchalot.glb (showroom, <= 30k tris) and sir_scorchalot_lo.glb (race, <= 7k).
# Rig (rigV 2, posed by CART_GLB_PARTS['dragon:2'] in src/43_cart_bb_glb.js; the joints are repeated there as
# CART_DRAGON_J, keep them in step):
#   part_neck (0, 2.0, 1.6)        neck and head: sways, looks into turns, rears back when firing
#   part_jaw  (JAW_J)              the lower jaw with its glowing mouth: rides on the neck, gapes when firing
#   part_wingL/R (±0.75, 2.1, 0.1) the wings: a gentle flap, beating hard on boost and in the air
#   part_tail (0, 1.45, -2.25)     the tail's root half: wags
#   part_tailTip (TIP_J)           the tail's end and the gold spade: rides on the tail and wags a beat later
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, WING = '#2ab060', '#ffd84a', '#7aff5a', '#7a3ad8'   # CART_CARS.dragon palette
NECK_J = (0, 2.0, 1.6)
TAIL_J = (0, 1.45, -2.25)
TIP_J = (0, 1.25, -3.45)          # TAIL_J + the tail spine's third point
HULL_Y = 0.72
AYn = RX(180)   # primitive axis -> engine -Y (down)

# ---------------- small helpers (local to this car) ----------------
def aim(n):
    """Rotation taking Blender +Z (engine up, the pole of lathes/domes/cones) to the engine direction n."""
    return E(*n).to_track_quat('Z', 'Y').to_matrix().to_4x4()
def place(bm, at=(0, 0, 0), M=None):
    """Move an authored bmesh into a parent frame: translate to `at` after the rotation M (engine coords)."""
    xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4))); return bm
def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1.0; return tuple(c / l for c in v)
def add(a, b, k=1.0): return tuple(a[i] + b[i] * k for i in range(3))
def lerp3(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
def cone(r, length, at, direction, seg):
    """A claw/tooth: a cone of base radius r pointing along `direction` from its base at `at`."""
    d = norm(direction); c = add(at, d, length / 2)
    return bm_cyl(r, 0.0, length, seg, aim(d), c)

# ---------------- the body surface: a fat lathe along z, chest bulge, flatter belly ----------------
BC = (0.0, 1.55, -0.1); SX = 1.24          # centre, width/height ratio (procedural ellipsoid 1.05 × 0.85 × 2.3)
def R(z):
    u = (z - BC[2]) / 2.3
    return 0.85 * max(0.0, 1 - u * u) ** 0.42 * (1 + 0.1 * math.exp(-((z - 0.9) / 0.8) ** 2))
def flat(th): return 1 - 0.1 * max(0.0, -math.sin(th))
def S(th, z):
    """Body surface point at section angle th (pi/2 = spine, 3pi/2 = belly) and z."""
    r = R(z) * flat(th)
    return (math.cos(th) * r * SX, BC[1] + math.sin(th) * r, z)
def N(th, z):
    e = 1e-3
    a, b, c, d = S(th + e, z), S(th - e, z), S(th, z + e), S(th, z - e)
    t1 = (a[0] - b[0], a[1] - b[1], a[2] - b[2]); t2 = (c[0] - d[0], c[1] - d[1], c[2] - d[2])
    n = (t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0])
    p = S(th, z); o = (p[0] - BC[0], p[1] - BC[1], p[2] - BC[2])
    if n[0] * o[0] + n[1] * o[1] + n[2] * o[2] < 0: n = (-n[0], -n[1], -n[2])
    return norm(n)

def shift(bm, J):
    """Move a piece built in a parent's space into the local space of a part whose joint (in that space) is J."""
    xf(bm, Matrix.Translation(-E(*J))); return bm
def hull_ring(z, w, h, r, seg, yc=HULL_Y, splits=(0.6,)):
    """A rounded-rectangle section of the coach at z with extra points at the heights in `splits` (absolute y)."""
    pts = rrect_pts(w, h, r, seg); out = []
    lo_y, hi_y = -h / 2 + r + 0.004, h / 2 - r - 0.004
    ys = sorted(min(hi_y, max(lo_y, s - yc)) for s in splits)
    for i, (x, y) in enumerate(pts):
        out.append((x, y)); nx, ny = pts[(i + 1) % len(pts)]
        if abs(x - w / 2) < 1e-6 and abs(nx - w / 2) < 1e-6 and ny > y: out += [(w / 2, s) for s in ys if y < s < ny]
        if abs(x + w / 2) < 1e-6 and abs(nx + w / 2) < 1e-6 and ny < y: out += [(-w / 2, s) for s in reversed(ys) if ny < s < y]
    return [(x, yc + y, z) for x, y in out]

def fin_bm(h, seg, lean=-0.35):
    """A gold dorsal fin (sabre plate) of height h; thin in x, leaning back."""
    prof = [(0.34 * h, 0), (0.3 * h, 0.18 * h), (0.19 * h, 0.52 * h), (0.07 * h, 0.86 * h), (0.0, h)]
    bm = bm_lathe(prof, seg, sx=0.42)
    xf(bm, Matrix.Rotation(lean, 4, 'X'))
    return bm

def build(B):
    L = B.L; body = B.body; lo = B.lo
    # ---- materials ----
    M_hide = paint('hide_green', '#1f9a52', coat=0.8, rough=0.34, metal=0.1)        # the skin under the scales
    M_scale = paint('scale_green', COL, coat=1.0, rough=0.28, metal=0.15)           # clear-coated scale plates
    M_dark = paint('hide_dark', '#17703c', coat=0.6, rough=0.4, metal=0.05)         # lids, brows, paws
    M_goldp = paint('gold_paint', COL2, coat=1.0, rough=0.3, metal=0.3)             # belly, fins, spade
    M_gold = metal('gold', COL2, 0.25)                                              # rims, rivets, trim (chrome-mapped gold)
    M_wing = paint('wing_purple', WING, coat=0.6, rough=0.36, metal=0.05)
    M_horn = paint('horn_cream', '#ffe8b0', coat=0.5, rough=0.35, metal=0.0)
    M_hat = matte('hat_felt', '#15101a', rough=0.85)
    M_lip = matte('lip_dark', '#0c1a10')
    M_ember = glow('ember', '#ff8a2a', strength=1.5)
    M_nostril = glow('nostril', '#ff6a1a', strength=3.0)
    M_saddle = satin('saddle_leather', '#3a1a4a', rough=0.5)
    ledg, ledgold = led(LIGHT), led(COL2)

    # ======================= BODY (bone 0) =======================
    B.export_try = VCOL_EXPORT
    # the coach: a lofted emerald clear-coat body over a black sill, gold shoulder trim, gold-flared wheel arches,
    # green under-glow, gold tube bumpers, bezelled lamps
    M_coach = paint('coach_emerald', '#0f4a2a', coat=1.0, rough=0.2, metal=0.35); M_sill = paint('coach_black', '#0a120c', coat=1.0, rough=0.22, metal=0.2)
    cs = B.pick(6, 2)
    rings = [hull_ring(2.5, 1.7, 0.36, 0.16, cs, yc=0.74), hull_ring(2.42, 2.06, 0.54, 0.22, cs), hull_ring(2.26, 2.3, 0.64, 0.24, cs)]
    if not lo: rings += [hull_ring(0.0, 2.32, 0.66, 0.24, cs)]
    rings += [hull_ring(-2.26, 2.3, 0.64, 0.24, cs), hull_ring(-2.42, 2.06, 0.54, 0.22, cs), hull_ring(-2.5, 1.7, 0.36, 0.16, cs, yc=0.74)]
    coach = B.obj('coach', bm_loft(rings, closed_u=True, caps=True), [M_coach, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < 0.6 else 0)
    B.vcol(coach, lambda x, y, z: (lambda t: (0.7 + 0.3 * t, 0.8 + 0.2 * t, 0.75 + 0.25 * t))(sstep((y - 0.55) / 0.5)))
    for i, (x, z) in enumerate([(1.08, 1.75), (-1.08, 1.75), (1.08, -1.75), (-1.08, -1.75)]):
        B.cut([coach], bm_cyl(0.64, 0.64, 0.9, L['arch'], AX, (math.copysign(1.28, x), 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.036, B.pick(18, 12), B.pick(4, 3), AX, (math.copysign(1.165, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_gold)
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 0.9, 1.0, 2.45), (s * 1.14, 1.04, 1.9), (s * 1.16, 1.04, -1.9), (s * 0.9, 1.0, -2.45)], B.pick(12, 4)), 0.022, B.pick(8, 4)), M_gold)
        B.strip((s * 1.14, 0.44, 2.1), (s * 1.14, 0.44, -2.1), LIGHT, th=0.04)
        B.light(s * 1.0, 0.25, 0.0, 2.4, LIGHT, led=1)
        if not lo:   # a row of gold-ringed green marker lamps along the flank between the arches
            for k, z in enumerate((0.7, 0.0, -0.7)):
                B.obj('marker_%d_%d' % (s > 0, k), bm_ellipsoid(0.07, 0.07, 0.07, 10, 3, (s * 1.16, 0.8, z), aim((s, 0, 0)), phi1=math.pi / 2), ledg)
                B.obj('marker_ring_%d_%d' % (s > 0, k), bm_torus(0.075, 0.016, 10, 3, aim((s, 0, 0)), (s * 1.162, 0.8, z)), M_gold)
    B.strip((-0.85, 0.44, 2.5), (0.85, 0.44, 2.5), LIGHT, th=0.035); B.strip((-0.85, 0.44, -2.5), (0.85, 0.44, -2.5), LIGHT, th=0.035)
    for zs, zc in ((1, 2.66), (-1, -2.66)):
        B.obj('bumper_%d' % (zs > 0), bm_tube(catmull([(1.12, 0.55, zc - zs * 0.42), (1.0, 0.55, zc - zs * 0.1), (0.6, 0.55, zc), (-0.6, 0.55, zc), (-1.0, 0.55, zc - zs * 0.1), (-1.12, 0.55, zc - zs * 0.42)], B.pick(16, 7)), 0.06, B.pick(8, 6)), M_gold)
    for s in (1, -1):
        hx = s * 0.72
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.14, -0.05), (0.15, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.8, 2.49)), dark_chrome())
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.145, 0.026, B.pick(16, 10), B.pick(4, 3), AZ, (hx, 0.8, 2.505)), M_gold)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.12, 0.032, 0.12, L['cyl_s'], B.pick(5, 2), (hx, 0.8, 2.5), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.8, 2.64, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_torus(0.1, 0.02, B.pick(12, 8), 3, AZn, (s * 0.66, 0.82, -2.525)), M_gold)
        B.obj('taillamp_%d' % (s > 0), bm_ellipsoid(0.085, 0.03, 0.085, L['cyl_s'], B.pick(4, 2), (s * 0.66, 0.82, -2.52), phi1=math.pi / 2, M=AZn), led('#ff2a1a'))
        B.light(s * 0.66, 0.82, -2.64, 0.9, '#ff2a3a', tail=1)
    # the dragon's trunk: a lathe along z (fat chest, tapered rump, flatter belly)
    nrow = B.pick(22, 12)
    prof = [(R(BC[2] - 2.3 * math.cos(math.pi * i / nrow)), BC[2] - 2.3 * math.cos(math.pi * i / nrow)) for i in range(nrow + 1)]
    B.obj('trunk', bm_lathe(prof, L['cyl'], at=(0, BC[1], 0), axis=AZ, rmod=lambda th, t: flat(th), sx=SX), M_hide)
    # the gold belly: a ridged plate sheet hugging the underside
    nb = 0 if lo else 9
    def belly(u, v):
        z = -2.05 + u * 4.1; th = 1.5 * math.pi + (v - 0.5) * 2.1
        ridge = 0.03 * abs(math.sin(u * math.pi * nb)) ** 0.6 * (1 - abs(v - 0.5) * 1.4) if nb else 0.0
        return add(S(th, z), N(th, z), 0.025 + ridge)
    B.obj('belly', bm_surf(B.pick(44, 18), B.pick(6, 4), belly, flip=True), M_goldp)
    # scales: staggered rows of clear-coated shingle domes over the back and flanks (none under the saddle)
    M_scale2 = paint('scale_green2', '#36c070', coat=1.0, rough=0.28, metal=0.15)
    rows, per = B.pick(9, 3), B.pick(7, 4); spread = 1.95
    for i in range(rows):
        z = 1.8 - i * (3.75 / (rows - 1)); k = R(z) / 0.9
        for j in range(per):
            th = math.pi / 2 + (-spread + (j + 0.25 + 0.5 * (i % 2)) * 2 * spread / per)
            if abs(th - math.pi / 2) < 0.55 and -1.1 < z < 0.45: continue      # the saddle sits here
            n = N(th, z)
            bm = bm_ellipsoid(0.25 * k, 0.05, 0.21 * k, B.pick(10, 6), 2, add(S(th, z), n, -0.028), aim(n), phi1=math.pi / 2)
            B.obj('scale_%d_%d' % (i, j), bm, M_scale if i % 2 else M_scale2)
    # gold dorsal fins down the spine (leaning back), skipping the saddle
    for z, h in [(1.55, 0.46), (1.1, 0.5), (0.65, 0.48), (-1.15, 0.42), (-1.6, 0.36), (-2.05, 0.28)]:
        if lo and z in (1.1, -1.6): continue
        n = N(math.pi / 2, z)
        B.obj('fin_%d' % int(z * 100), place(fin_bm(h, B.pick(10, 5)), add(S(math.pi / 2, z), n, -0.03), aim(n)), M_goldp)
    # saddle on the back: leather pad, gold rim, rivets; the driver's seat sits in it
    B.obj('saddle', bm_ellipsoid(0.6, 0.14, 0.82, L['cyl_s'], B.pick(4, 2), (0, 2.33, -0.3), phi1=math.pi / 2), M_saddle)
    B.obj('saddle_rim', bm_torus(0.62, 0.03, L['torus'], L['tube'], AY, (0, 2.37, -0.3), sy=1.32), M_gold)
    if not lo:
        for i in range(12):
            a = TAU * i / 12
            B.obj('rivet_%d' % i, bm_uv(0.028, 6, 3, (math.cos(a) * 0.62, 2.39, -0.3 - math.sin(a) * 0.62 * 1.32)), chrome())
    # paws over the wheels: a leg from the trunk, a padded paw, three gold claws
    for sx in (1, -1):
        for sz in (1, -1):
            tag = '%d_%d' % (sx > 0, sz > 0)
            B.obj('leg_' + tag, bm_rod((sx * 0.5, 1.4, sz * 1.5), (sx * 1.0, 1.05, sz * 1.75), 0.25, L['cyl_s'], r1=0.2), M_hide)
            B.obj('paw_' + tag, bm_ellipsoid(0.34, 0.2, 0.4, B.pick(12, 8), B.pick(6, 4), (sx * 1.08, 1.02, sz * 1.75)), M_dark)
            for k, dx in enumerate((-0.17, 0.0, 0.17) if not lo else (-0.12, 0.12)):
                B.obj('claw_%s_%d' % (tag, k), cone(0.055, 0.26, (sx * 1.08 + dx, 0.95, sz * 1.75 + 0.3), (0, -0.45, 0.89), B.pick(8, 5)), M_gold)
    # steering column from the wheel down to a chrome base on the chest
    B.obj('column', bm_rod((0, 2.82, 0.42), (0, 2.38, 0.6), 0.04, L['rod']), dark_chrome())
    B.obj('column_base', bm_ellipsoid(0.1, 0.06, 0.1, L['cyl_s'], 3, (0, 2.4, 0.6), phi1=math.pi / 2), chrome())

    # ======================= NECK + HEAD (part_neck at (0, 2.0, 1.6)) =======================
    NK = B.part('neck', (0, 2.0, 1.6))
    d = norm((0, 0.95, 0.75)); NL = math.hypot(0.95, 0.75)
    n_up = (0, d[2], -d[1]); n_fr = (0, -d[2], d[1])        # perpendiculars: up/back and forward/down
    def on_neck(t, phi, out=0.0):
        """A point on the neck surface: t along it (0..1), phi around it (0 = car left, pi/2 = top), `out` offset."""
        r = 0.5 - 0.12 * t + out
        return add(add((0, 0, 0), d, t * NL), (math.cos(phi) * r, math.sin(phi) * n_up[1] * r, math.sin(phi) * n_up[2] * r))
    B.obj('neck', bm_rod((0, 0, 0), (0, 0.95, 0.75), 0.5, L['cyl'], r1=0.38), M_hide, parent=NK)
    B.obj('neck_base', bm_uv(0.5, L['cyl_s'], max(6, L['cyl_s'] // 2), (0, 0, 0)), M_hide, parent=NK)
    B.obj('neck_top', bm_uv(0.38, L['cyl_s'], max(6, L['cyl_s'] // 2), (0, 0.95, 0.75)), M_hide, parent=NK)
    for i, t in enumerate((0.3, 0.55, 0.8)):
        if lo and i == 1: continue
        B.obj('neck_fin_%d' % i, place(fin_bm(0.3 - i * 0.03, B.pick(8, 6)), on_neck(t, math.pi / 2, -0.03), aim(n_up)), M_goldp, parent=NK)
    if not lo:
        for i, t in enumerate((0.22, 0.45, 0.68)):
            for j, phi in enumerate((0.45, 1.05, 2.1, 2.7)):
                p = on_neck(t, phi, -0.03); n = norm(add(p, add((0, 0, 0), d, t * NL), -1))
                B.obj('neck_scale_%d_%d' % (i, j), bm_ellipsoid(0.16, 0.05, 0.14, 10, 2, p, aim(n), phi1=math.pi / 2), M_scale, parent=NK)
    for i, t in enumerate((0.36, 0.58, 0.8)):      # gold throat bands
        if lo and i == 1: continue
        B.obj('throat_%d' % i, bm_torus(0.5 - 0.12 * t + 0.005, 0.045, L['torus'], L['tube'], aim(d), add((0, 0, 0), d, t * NL), sweep=(math.pi, TAU)), M_goldp, parent=NK)
    # the gentleman's collar and bow tie
    B.obj('collar', bm_torus(0.5 - 0.12 * 0.14 + 0.01, 0.035, L['torus'], L['tube'], aim(d), add((0, 0, 0), d, 0.14 * NL)), chrome(), parent=NK)
    bow_at = on_neck(0.2, -math.pi / 2, 0.01); bow_M = rot(pitch=math.atan2(-n_fr[1], n_fr[2]))
    for s in (1, -1):
        pts = [(0, s * 0.05), (s * 0.3, s * 0.17), (s * 0.3, -s * 0.15), (0, -s * 0.05)]
        b = B.obj('bow_%d' % (s > 0), bm_profile(pts, 0.07, bow_at, bow_M), M_gold, parent=NK)
        B.bevel(b, 0.02, angle=False, segments=B.pick(3, 1))
    B.obj('bow_knot', bm_box(0.1, 0.13, 0.09, bow_at, bow_M), chrome(), parent=NK, bevel=0.03, bevel_angle=False)
    # ---- the head, authored head-local then placed at (0, 1.15, 1.05) with a slight nose-down pitch ----
    HEAD_AT, HEAD_M = (0, 1.15, 1.05), rot(pitch=0.12)
    def h2n(p):
        v = Matrix.Translation(E(*HEAD_AT)) @ HEAD_M @ E(*p); return (v.x, v.z, -v.y)
    def head(name, bm, m, **kw): return B.obj(name, place(bm, HEAD_AT, HEAD_M), m, parent=NK, **kw)
    head('cranium', bm_ellipsoid(0.5, 0.45, 0.62, L['cyl'], L['cyl_s'] // 2 + 2), M_hide)
    head('snout', bm_ellipsoid(0.34, 0.25, 0.56, L['cyl_s'] + 4, L['cyl_s'] // 2 + 1, (0, -0.12, 0.64)), M_hide)
    head('lip', bm_torus(0.355, 0.016, L['torus'], 4, AY, (0, -0.255, 0.6), sweep=(-math.pi / 2 - 1.45, -math.pi / 2 + 1.45), sy=1.38), M_lip, smooth=False)
    head('palate', bm_ellipsoid(0.3, 0.05, 0.42, B.pick(14, 8), 3, (0, -0.3, 0.6), phi0=math.pi / 2), mat('mouth_dark', '#3a0a0a', rough=0.5))
    # ---- the lower jaw (part_jaw, hinged under the cheeks): gold chin, a glowing ember mouth, lower fangs ----
    JH = (0, -0.22, 0.1); jn = h2n(JH)
    JAW = B.part('jaw', add(NECK_J, jn))
    def jaw(name, bm, m, **kw): return B.obj(name, shift(place(bm, HEAD_AT, HEAD_M), jn), m, parent=JAW, **kw)
    jaw('chin', bm_ellipsoid(0.31, 0.11, 0.42, L['cyl_s'], 5, (0, -0.3, 0.55)), M_goldp)
    jaw('mouth', bm_ellipsoid(0.27, 0.035, 0.38, B.pick(14, 8), 3, (0, -0.215, 0.56), phi1=math.pi / 2), mat('mouth_red', '#5a0e0a', rough=0.4))
    jaw('ember_core', bm_ellipsoid(0.15, 0.03, 0.24, B.pick(12, 6), 3, (0, -0.2, 0.5), phi1=math.pi / 2), led('#ff7a1a', 4.0))
    if not lo:
        jaw('ember', bm_torus(0.35, 0.011, L['torus'], 4, AY, (0, -0.275, 0.6), sweep=(-math.pi / 2 - 1.2, -math.pi / 2 + 1.2), sy=1.38), M_ember, smooth=False)
        for k in range(4):
            a = (k / 3 - 0.5) * 1.3
            jaw('ltooth_%d' % k, cone(0.035, 0.1, (math.sin(a) * 0.26, -0.24, 0.6 + math.cos(a) * 0.34), (0, 1, 0), 6), paint('tooth', '#ffffff', coat=0.4, rough=0.3, metal=0))
    B.light(*add(NECK_J, h2n((0, -0.2, 0.7))), 0.7, '#ff7a1a', led=1)
    for s in (1, -1):
        # orange cartoon eyes with hooded angry lids and a furrowed brow
        B.eye(h2n((s * 0.3, 0.2, 0.32)), 0.15, '#c84a1a', look=(s * 0.4, 0), parent=NK, name='eye_%d' % (s > 0))
        head('lid_%d' % (s > 0), bm_ellipsoid(0.165, 0.165, 0.165, B.pick(12, 8), 3, (s * 0.3, 0.2, 0.32), aim((-s * 0.35, 0.8, -0.35)), phi1=math.pi * 0.5), M_dark)
        head('brow_%d' % (s > 0), bm_ellipsoid(0.2, 0.06, 0.14, B.pick(12, 8), 2, (s * 0.27, 0.35, 0.32), rot(roll=s * 0.32)), M_dark)
        # scaly scale rows on the cheeks
        if not lo:
            for j, (y, z) in enumerate(((0.05, 0.05), (-0.05, -0.22), (0.25, -0.2))):
                head('cheek_%d_%d' % (s > 0, j), bm_ellipsoid(0.14, 0.05, 0.12, 10, 2, (s * 0.45, y, z), aim((s * 1, 0.25, 0.1)), phi1=math.pi / 2), M_scale)
        # horns: cream, curving up, out and back, with a chrome tip
        p0 = (s * 0.4, 0.26, -0.22); p1 = add(p0, (s * 0.1, 0.3, -0.18)); p2 = add(p1, (s * 0.15, 0.22, -0.2)); p3 = add(p2, (s * 0.13, 0.1, -0.14))
        head('horn_%d_0' % (s > 0), bm_rod(p0, p1, 0.1, L['cyl_s'], r1=0.075), M_horn)
        head('horn_%d_j0' % (s > 0), bm_uv(0.075, B.pick(10, 8), 5, p1), M_horn)
        head('horn_%d_1' % (s > 0), bm_rod(p1, p2, 0.075, L['cyl_s'], r1=0.045), M_horn)
        head('horn_%d_j1' % (s > 0), bm_uv(0.045, B.pick(10, 8), 5, p2), M_horn)
        head('horn_%d_tip' % (s > 0), bm_rod(p2, p3, 0.045, L['cyl_s'], r1=0.0), chrome())
        # glowing nostrils (+ game lights at them)
        head('nostril_%d' % (s > 0), bm_ellipsoid(0.042, 0.038, 0.045, 8, B.pick(4, 3), (s * 0.12, 0.0, 1.1)), M_nostril)
        px, py, pz = h2n((s * 0.12, 0.0, 1.14))
        B.light(px, py + 2.0, pz + 1.6, 0.5, '#ff6a1a', led=1)
    if not lo:   # a row of white fangs along the upper jaw
        for k in range(6):
            a = (k / 5 - 0.5) * 1.6
            head('tooth_%d' % k, cone(0.04, 0.13, (math.sin(a) * 0.3, -0.24, 0.62 + math.cos(a) * 0.4), (0, -1, 0), 6), paint('tooth', '#ffffff', coat=0.4, rough=0.3, metal=0))
    # the monocle (right eye): chrome ring and a bead chain down the cheek
    if not lo: head('monocle', bm_torus(0.2, 0.02, L['torus'], L['tube'], AZ, (-0.31, 0.2, 0.49)), chrome())
    if not lo:
        for i in range(6):
            t = i / 5
            head('chain_%d' % i, bm_uv(0.018, 6, 4, (-0.33 - 0.1 * t, 0.0 - 0.3 * t, 0.49 - 0.1 * t - 0.12 * math.sin(math.pi * t))), chrome())
    # the top hat, tilted jauntily between the horns, with a gold band
    hat = bm_lathe([(0, 0), (0.36, 0), (0.36, 0.03), (0.26, 0.03), (0.26, 0.34), (0.24, 0.36), (0, 0.36)], L['cyl'])
    xf(hat, Matrix.Translation(E(0, 0.4, -0.08)) @ rot(roll=0.2, pitch=-0.1))
    head('hat', hat, M_hat)
    head('hat_band', place(bm_torus(0.268, 0.03, L['torus'], L['tube'], AY, (0, 0.09, 0)), (0, 0.4, -0.08), rot(roll=0.2, pitch=-0.1)), M_gold)

    # ======================= WINGS (part_wingL / part_wingR at (±0.75, 2.1, 0.1)) =======================
    for s in (1, -1):
        name = 'wingL' if s > 0 else 'wingR'
        W = B.part(name, (s * 0.75, 2.1, 0.1))
        root, elbow, tip = (0, 0, 0.05), (s * 1.0, 0.3, 0.08), (s * 2.0, 0.62, 0.0)
        ue = 0.54
        def LE(u): return lerp3(root, elbow, u / ue) if u < ue else lerp3(elbow, tip, (u - ue) / (1 - ue))
        def chord(u): return (1.0 + 0.55 * u) * (1 - 0.3 * math.sin(math.pi * ((u * 3) % 1.0)) ** 0.8)
        def TE(u):
            p = LE(u); return (p[0] - s * 0.05 * u, p[1] - 0.28 - 0.15 * u, p[2] - chord(u))
        def fn(u, v):
            p = lerp3(LE(u), TE(u), v); return (p[0], p[1] - 0.06 * math.sin(math.pi * v) * math.sin(math.pi * u), p[2])
        nu, nv = B.pick(24, 10), B.pick(5, 3)
        for side, fl in (('', False), ('_b', True)):
            mb = B.obj(name + '_membrane' + side, bm_surf(nu, nv, fn, flip=fl), M_wing, parent=W)
            B.vcol(mb, lambda x, y, z: (lambda t: (0.75 + 0.5 * t, 0.7 + 0.1 * t, 1.0))(sstep(abs(x) / 2.0)))   # violet root to magenta tips
        B.obj(name + '_arm', bm_rod(root, elbow, 0.11, L['cyl_s'], r1=0.085), M_hide, parent=W)
        B.obj(name + '_elbow', bm_uv(0.09, L['cyl_s'], L['cyl_s'] // 2, elbow), M_hide, parent=W)
        B.obj(name + '_forearm', bm_rod(elbow, tip, 0.085, L['cyl_s'], r1=0.05), M_hide, parent=W)
        B.obj(name + '_wrist', bm_uv(0.05, L['cyl_s'], L['cyl_s'] // 2, tip), M_hide, parent=W)
        B.obj(name + '_thumb', cone(0.05, 0.22, add(elbow, (0, 0.04, 0.06)), (s * 0.15, 0.55, 0.82), B.pick(8, 5)), M_gold, parent=W)
        for k in (1, 2, 3):
            u = k / 3; a, b = LE(u), TE(u); dirn = norm(add(b, a, -1))
            B.obj(name + '_finger_%d' % k, bm_rod(add(a, (0, 0.03, 0)), add(b, (0, 0.03, 0)), 0.045, L['rod'], r1=0.022), M_hide, parent=W)
            B.obj(name + '_fclaw_%d' % k, cone(0.03, 0.14, add(b, dirn, -0.02), dirn, B.pick(8, 5)), M_gold, parent=W)

    # ======================= TAIL (part_tail at (0, 1.45, -2.25)) =======================
    T = B.part('tail', TAIL_J)
    P = [(0, 0, 0.05), (0, -0.12, -0.6), (0, -0.2, -1.2), (0, -0.05, -1.7), (0, 0.12, -2.1)]
    rad = [0.42, 0.33, 0.23, 0.14, 0.07]
    TP = B.part('tailTip', add(TAIL_J, P[2]))
    def tip(name, bm, m, **kw): return B.obj(name, shift(bm, P[2]), m, parent=TP, **kw)
    for i in range(4):
        put = (lambda n, bm, m: B.obj(n, bm, m, parent=T)) if i < 2 else tip
        put('tail_%d' % i, bm_rod(P[i], P[i + 1], rad[i], B.pick(L['cyl_s'] + 4, L['cyl_s']), r1=rad[i + 1]), M_hide)
        if i: put('tail_j%d' % i, bm_uv(rad[i] * 1.01, B.pick(14, 8), B.pick(7, 4), P[i]), M_hide)
    for i, h in ((1, 0.3), (2, 0.24), (3, 0.18)):
        if lo and i == 2: continue
        put = (lambda n, bm, m: B.obj(n, bm, m, parent=T)) if i < 2 else tip
        put('tail_fin_%d' % i, place(fin_bm(h, B.pick(8, 6)), add(P[i], (0, rad[i] - 0.03, 0)), None), M_goldp)
    for i in B.pick((1, 2), (1,)):
        dd = norm(add(P[i + 1], P[i - 1], -1))
        put = (lambda n, bm, m: B.obj(n, bm, m, parent=T)) if i < 2 else tip
        put('tail_band_%d' % i, bm_torus(rad[i] + 0.012, 0.04, L['torus'], L['tube'], aim(dd), P[i], sweep=(math.pi, TAU)), M_goldp)
    if not lo:
        for i in range(2):
            for j, phi in enumerate((0.5, 1.2, 1.95, 2.65)):
                c = lerp3(P[i], P[i + 1], 0.5); r = (rad[i] + rad[i + 1]) / 2
                p = add(c, (math.cos(phi) * r, math.sin(phi) * r, 0), 1); n = norm((math.cos(phi), math.sin(phi), 0))
                B.obj('tail_scale_%d_%d' % (i, j), bm_ellipsoid(0.13, 0.05, 0.14, 8, 2, add(p, n, -0.03), aim(n), phi1=math.pi / 2), M_scale, parent=T)
    # the gold spade: a puffy heart turned to point backward, on a short stem, with a glowing green gem
    k = 0.021
    spade = [(hy * k, hx * k) for hx, hy in [(16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) for t in (TAU * i / B.pick(28, 12) for i in range(B.pick(28, 12)))]]
    sp = tip('spade', bm_profile(spade, 0.06, (0, 0.14, -2.3), rot(yaw=-math.pi / 2)), M_goldp)
    B.bevel(sp, 0.028, angle=True, segments=B.pick(3, 1), profile=0.6)
    tip('tail_stem', bm_rod(P[4], (0, 0.14, -2.3), 0.07, L['rod'], r1=0.04), M_hide)
    for sx in (1, -1): tip('spade_gem_%d' % (sx > 0), bm_ellipsoid(0.05, 0.07, 0.05, B.pick(10, 6), B.pick(4, 2), (sx * 0.04, 0.16, -2.32), aim((sx, 0, 0)), phi1=math.pi / 2), ledg)

    # ======================= lights, wheels, seat, info =======================
    B.light(0, 3.2, 2.7, 1.6, '#ff7a2a', big=1)
    B.wheels_pro(1.08, 1.75, -1.75, r=0.5, w=0.42, rim=COL2, tyre='#141a14', cap=LIGHT, stripe=LIGHT)
    B.seat(0, 2.5, -0.25, col='#5a2a8a', accent=LIGHT, wheelY=2.86, wheelZ=0.4, column=False)
    B.info(5.6, 3.4, 3.8, muzzle=(0, 3.0, 3.1), wheelR=0.5)
    B.body['rigV'] = 2
    if not lo: print('sir_scorchalot JAW_J', tuple(round(c, 4) for c in add(NECK_J, jn)))

if __name__ == '__main__':
    run('sir_scorchalot', build, report=True, views=['side', 'high'], level_overrides={'hi': dict(bevel=3, cyl=28, torus=16, tube=4, arch=16, sph=16, ring=10), 'lo': dict(torus=8, tube=3, arch=8, cyl=10, cyl_s=6, rod=5)})
