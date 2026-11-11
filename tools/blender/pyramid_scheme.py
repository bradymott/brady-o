# Pyramid Scheme (Art Cart car #6): an Egyptian-revival laser pyramid on a black sound truck. Join now!
# Rebuilt to the Bass Valentine quality bar, and lowered so the chase camera sees the road and the pack over it.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/pyramid_scheme.py', run_name='__main__')
# Writes assets/models/art-cart/pyramid_scheme.glb (showroom, <= 30k tris) and pyramid_scheme_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['pyramid:2'] in src/43_cart_bb_glb.js; joints must match CART_PYR2 there):
#   part_cap                 the gold capstone with its crystal, joint at its base centre: it turns slowly
#   part_emit0..3            the four laser emitters on the capstone's corners: they ride it and sweep up and down
#   part_glow0..3            the bright laser-line ring under each tier's coping, joint at the ring's centre: it pulses
#                            out of the tier face (on) and sinks back into it (off), tier by tier, bottom to top
#   part_subs                the four sub cones in the speaker towers (they pump backwards)
# body extras: rigV = 2, extra.sight = the crystal's top (the chase camera rises just enough to see the road over it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#2a2236', '#ffc83a', '#3aff8a'   # CART_CARS.pyramid palette: dark violet, gold, laser green
PZ = 0.5                                              # the pyramid's centre line (engine z)
DECK = 1.33
# (w, d, y0, y1) of the four tiers: battered walls (the base a little wider), 0.32 tall, the top one 0.26
TIERS = [(2.3, 3.2, DECK, 1.65), (1.82, 2.5, 1.65, 1.97), (1.36, 1.86, 1.97, 2.29), (0.92, 1.26, 2.29, 2.55)]
CAP_J = (0.0, 2.58, PZ)                               # part_cap: the capstone's base centre
CAP_B, CAP_H = 0.34, 0.36                             # its half base and height
EMIT_R = 0.5                                          # the emitters sit on the plinth's corners, this far out
SUBS_J = (0.0, 1.75, -2.3)                            # part_subs

def hull_ring(z, w, h, r, seg, yc):
    pts = rrect_pts(w, h, r, seg)
    return [(x, yc + y, z) for x, y in pts]

def tier_glow_y(i):
    return TIERS[i][3] - 0.06

def bm_frame(w, d, bw, th, at):
    """A flat rectangular frame (outer w × d, bar width bw, thickness th) lying in the XZ plane, centred at `at`:
    the gold coping that crowns each tier. One closed shell, so a bevel modifier rounds it."""
    bm = bmesh.new()
    def ring(hx, hz, y):
        return [bm.verts.new(E(at[0] + sx * hx, at[1] + y, at[2] + sz * hz)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    ob, ib = ring(w / 2, d / 2, -th / 2), ring(w / 2 - bw, d / 2 - bw, -th / 2)
    ot, it = ring(w / 2, d / 2, th / 2), ring(w / 2 - bw, d / 2 - bw, th / 2)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((ot[i], ot[j], it[j], it[i])); bm.faces.new((ob[i], ib[i], ib[j], ob[j]))
        bm.faces.new((ob[i], ob[j], ot[j], ot[i])); bm.faces.new((ib[i], it[i], it[j], ib[j]))
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def pyramidion(B, name, at, r, h, m, parent=None, bevel=0.02):
    """A small four-sided pyramid (faces square to the car), tip up, base centred at `at`, edges softly bevelled."""
    return B.obj(name, bm_cyl(r, 0.0, h, 4, RZ(45), (at[0], at[1] + h / 2, at[2])), m, parent=parent, bevel=B.pick(bevel, None), segments=B.pick(2, 1))

def rect_ring(hx, hz, y, z0=0.0):
    return [(hx, y, z0 + hz), (-hx, y, z0 + hz), (-hx, y, z0 - hz), (hx, y, z0 - hz)]

def almond(n, w, h, k=0.45):
    """n points (x, y) round an almond (a pointed-cornered eye outline), w half wide, h half tall, CCW from the outer corner."""
    out = []
    for i in range(n):
        a = TAU * i / n; s = math.sin(a)
        out.append((w * math.cos(a), h * s * ((1 - k) + k * abs(s))))
    return out

def circle(n, r):
    return [(r * math.cos(TAU * i / n), r * math.sin(TAU * i / n)) for i in range(n)]

def bm_dome(outline, prof, top, back=-0.01, at=(0, 0, 0), M=None):
    """A closed dome over a 2D outline [(x, y), …] facing +Z: a back pole at z = back, rings (scale, z) from `prof`, and a
    front pole at z = top. `at`/`M` (rot()) place it: build an eye part at the origin, then stand it on any face."""
    rings = [[(0.0, 0.0, back)]] + [[(x * s, y * s, z) for x, y in outline] for s, z in prof] + [[(0.0, 0.0, top)]]
    return bm_loft(rings, closed_u=True, caps=False, at=at, M=M)

def rtri_pts(hw, y0, y1, r, n):
    """A rounded triangle (apex up) in the XY plane: base half-width hw at y0, apex at y1, corner radius r, n points per corner."""
    P = [(-hw, y0), (hw, y0), (0.0, y1)]; out = []
    for i in range(3):
        p, a, b = Vector((*P[i], 0)), Vector((*P[i - 1], 0)), Vector((*P[(i + 1) % 3], 0))
        da, db = (a - p).normalized(), (b - p).normalized()
        half = math.acos(max(-1.0, min(1.0, da.dot(db)))) / 2; d = r / math.tan(half)
        c = p + (da + db).normalized() * (r / math.sin(half))
        t0, t1 = p + da * d, p + db * d
        a0 = math.atan2(t0.y - c.y, t0.x - c.x); a1 = math.atan2(t1.y - c.y, t1.x - c.x)
        while a1 < a0: a1 += TAU
        if a1 - a0 > math.pi: a1 -= TAU
        for k in range(n):
            aa = a0 + (a1 - a0) * k / max(1, n - 1)
            out.append((c.x + r * math.cos(aa), c.y + r * math.sin(aa)))
    return out

def all_seeing_eye(B, name, at, W, H, M=None, parent=None, lids=True, lite=False, fine=True, ring=True):
    """The all-seeing eye, built facing +Z at the origin and placed by `at` / `M` (rot()): an almond white (softly lit so it
    reads at night), a jade iris with a dark limbal rim and fine radial streaks (vertex colour) ringed by a laser-green LED
    ring, a glossy black pupil, two catch-lights, and gold upper and lower lids with a flick at the outer corner.
    lite=True: the small capstone eyes (no ring, one catch-light); fine=False: race-level tessellation for a small badge.
    W, H: the almond's half width and height."""
    lo = B.lo or not fine; hi = not B.lo
    n = (32 if not lo else 12 if not B.lo or W > 0.15 else 8) if not lite else B.pick(14, 8)
    ri = H * 0.86; mloc = Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)); minv = mloc.inverted()
    d = W * 0.2   # dome height
    def local(x, y, z):   # a parent-space engine point -> the eye's own engine frame (x, y, z forward)
        p = minv @ E(x, y, z); return p.x, p.z, -p.y
    sprof = [(1.0, 0.0), (0.82, d * 0.6)] if lo or lite else [(1.0, 0.0), (0.9, d * 0.45), (0.7, d * 0.78), (0.4, d * 0.95)]
    scl = B.obj(name + '_white', bm_dome(almond(n, W, H), sprof, d, at=at, M=M), glow('eye_sclera', '#fbf6ff', strength=0.6, rough=0.25), parent=parent)
    def scl_col(x, y, z):
        q = max(0.0, min(1.0, local(x, y, z)[2] / d)); return (0.74 + 0.26 * q, 0.72 + 0.28 * q, 0.84 + 0.16 * q)
    B.vcol(scl, scl_col)
    ni = (24 if not lo else 10 if not B.lo or W > 0.15 else 8) if not lite else B.pick(12, 8)
    iz = d * 0.92   # the iris stands proud of the white
    iprof = [(1.0, iz), (0.62, iz + d * 0.28)] if lo or lite else [(1.0, iz), (0.85, iz + d * 0.18), (0.62, iz + d * 0.3), (0.38, iz + d * 0.36)]
    iris = B.obj(name + '_iris', bm_dome(circle(ni, ri), iprof, iz + d * 0.4, back=0.0, at=at, M=M), glow('eye_iris', '#18d184', strength=1.1, rough=0.12), parent=parent)
    def iris_col(x, y, z):
        ex, ey, ez = local(x, y, z); rr = math.hypot(ex, ey) / ri; th = math.atan2(ey, ex)
        k = (1.0 - 0.55 * sstep((rr - 0.55) / 0.45)) * (0.88 + 0.12 * math.cos(th * 14))
        return (k * 0.85, k, k * (0.9 + 0.1 * min(rr, 1.0)))
    B.vcol(iris, iris_col)
    pr = ri * 0.46
    pprof = [(1.0, iz + d * 0.33)] if lo or lite else [(1.0, iz + d * 0.33), (0.6, iz + d * 0.43)]
    B.obj(name + '_pupil', bm_dome(circle(16 if not lo else 8, pr), pprof, iz + d * 0.47, back=iz, at=at, M=M), paint('eye_pupil', '#06050a', coat=1.0, rough=0.08, metal=0.0), parent=parent)
    if ring and not lite:
        bm = bm_torus(ri * 1.02, H * 0.06, 28 if not lo else 10, 6 if not lo else 3, AZ, (0, 0, iz + d * 0.02)); xf(bm, mloc)
        B.obj(name + '_ring', bm, led(LIGHT, 3.5), parent=parent)
    if hi:
        for k, (hx, hy, hr) in enumerate(((-0.42, 0.42, 1.0), (0.3, -0.3, 0.5))):
            if lite and k: continue
            bm = bm_ico(H * 0.16 * hr, 1); xf(bm, mloc @ Matrix.Translation(E(hx * ri, hy * ri, iz + d * 0.5)))
            B.obj(name + '_hl%d' % k, bm, led('#ffffff', 3.0), parent=parent)
    if lids:
        N = 22 if not lo else 7; M_g = metal('gold', COL2, 0.14)
        up = [(W * 1.34, H * 0.46, d * 0.12)] + [(W * 1.06 * math.cos(a), H * 1.14 * math.sin(a) * (0.55 + 0.45 * math.sin(a)), d * 0.2) for a in (math.pi * k / 8 for k in range(9))]
        upc = catmull(up, N)
        ru = [0.004 if i == 0 else H * (0.08 + 0.12 * math.sin(math.pi * min(1.0, max(0.0, (i - 0.5) / (N - 1.5))))) for i in range(N)]
        B.obj(name + '_lid_up', bm_tube(upc, ru, 8 if not lo else 3, at=at, M=M), M_g, parent=parent)
        lw = catmull([(W * 1.03 * math.cos(a), -H * 1.08 * math.sin(a) * (0.55 + 0.45 * math.sin(a)), d * 0.16) for a in (math.pi * k / 8 for k in range(9))], 16 if not lo else 6)
        rl = [H * (0.05 + 0.07 * math.sin(math.pi * i / (len(lw) - 1))) for i in range(len(lw))]
        B.obj(name + '_lid_lo', bm_tube(lw, rl, 8 if not lo else 3, at=at, M=M), M_g, parent=parent)

def build(B):
    L = B.L; lo = B.lo
    B.export_try = VCOL_EXPORT   # the tiers and the hull carry vertex-colour gradients
    # ---- materials: black-violet clear coat, violet tiers, polished gold, chrome, laser green ----
    M_paint = paint('paint_black', '#1a1622', coat=1.0, rough=0.18, metal=0.3)
    M_tier = [paint('tier_a', '#2a2238', coat=1.0, rough=0.2, metal=0.25), paint('tier_b', '#342a46', coat=1.0, rough=0.2, metal=0.25)]
    M_gold = metal('gold', COL2, 0.14); M_gold2 = metal('gold_dark', '#d0a030', 0.22)
    M_tower = paint('tower', '#141218', coat=1.0, rough=0.3, metal=0.2)
    M_crystal = glow('crystal', '#7affb0', strength=4.0, rough=0.05)
    M_dim = glow('laser_dim', '#1f8a4c', strength=1.2, rough=0.3)
    M_glass = mat('glass', '#1c2433', rough=0.04, extras={'burns_gloss': 3})
    ledg = led(LIGHT); cr = chrome(); dch = dark_chrome()

    # ---- the truck: a lofted, rounded black hull (soft nose, squarer tail), wheel arches with gold-rimmed flares ----
    cs = B.pick(6, 2); W, H, YC = 2.5, 0.9, 0.9
    rings = [hull_ring(2.64, 2.14, 0.66, 0.2, cs, 0.88), hull_ring(2.58, 2.36, 0.82, 0.24, cs, 0.89), hull_ring(2.45, 2.48, 0.89, 0.26, cs, YC),
             hull_ring(2.2, W, H, 0.26, cs, YC)]
    if not lo: rings += [hull_ring(0.0, W, H, 0.26, cs, YC)]
    rings += [hull_ring(-2.3, W, H, 0.26, cs, YC), hull_ring(-2.5, 2.4, 0.82, 0.24, cs, YC), hull_ring(-2.6, 2.1, 0.58, 0.2, cs, 0.88)]
    shell = B.obj('shell', bm_loft(rings, closed_u=True, caps=True), M_paint)
    B.vcol(shell, lambda x, y, z: (0.7 + 0.3 * sstep((y - 0.45) / 0.9),) * 2 + (0.8 + 0.2 * sstep((y - 0.45) / 0.9),))
    for i, (x, z) in enumerate([(1.12, 1.75), (-1.12, 1.75), (1.12, -1.75), (-1.12, -1.75)]):
        B.cut([shell], bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.1, 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.035, L['torus'], B.pick(5, 3), AX, (math.copysign(W / 2 + 0.005, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_gold)
    # gold shoulder lines along the deck edge, green under-glow
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 1.12, 1.33, 2.4), (s * 1.2, 1.345, 1.6), (s * 1.2, 1.345, -1.9), (s * 1.14, 1.33, -2.45)], B.pick(12, 4)), 0.022, B.pick(8, 4)), M_gold)
        B.strip((s * 1.13, 0.5, 2.1), (s * 1.13, 0.5, -2.2), LIGHT, th=0.04)
        B.light(s * 1.0, 0.3, 0.0, 2.4, LIGHT, led=1)
    B.strip((-0.95, 0.5, 2.52), (0.95, 0.5, 2.52), LIGHT, th=0.04); B.strip((-0.95, 0.5, -2.56), (0.95, 0.5, -2.56), LIGHT, th=0.04)
    B.obj('deck', bm_box(2.0, 0.03, 4.6, (0, DECK + 0.01, -0.05)), matte('deck_mat', '#0d0b10', 0.9), bevel=0.012, bevel_angle=False, segments=1)

    # ---- the face: chrome-framed grille, the gold winged sun disc, bezelled lamps; chrome tube bumpers ----
    B.obj('grille_back', bm_box(1.06, 0.3, 0.04, (0, 0.8, 2.63)), dch)
    B.obj('grille_frame', bm_rrect_tube(1.1, 0.34, 0.08, 0.026, B.pick(4, 1), B.pick(8, 4), at=(0, 0.8, 2.655), axis=AZ), cr)
    for k, y in enumerate((0.72, 0.8, 0.88)):
        B.obj('grille_bar_%d' % k, bm_rod((-0.52, y, 2.665), (0.52, y, 2.665), 0.016, L['rod']), cr)
    B.obj('sun_ring', bm_torus(0.13, 0.028, L['torus'], B.pick(6, 3), AZ, (0, 1.08, 2.66)), M_gold)
    B.obj('sun_disc', bm_ellipsoid(0.11, 0.04, 0.11, L['cyl_s'], B.pick(5, 3), (0, 1.08, 2.655), phi1=math.pi / 2, M=AZ), ledg)
    for s in (1, -1):   # the sun's wings: three tapering gold feathers each side
        for k, (dy, L1, a) in enumerate(((0.04, 0.42, 0.08), (-0.02, 0.38, 0.02), (-0.08, 0.32, -0.05))):
            if lo and k == 2: continue
            p0 = (s * 0.15, 1.08 + dy, 2.665); p1 = (s * (0.15 + L1), 1.08 + dy + a, 2.655)
            B.obj('wing_%d_%d' % (s > 0, k), bm_tube(catmull([p0, ((p0[0] + p1[0]) / 2, p0[1] + a * 0.7 + 0.02, 2.665), p1], B.pick(8, 3)), [0.024] + [0.02] * B.pick(6, 1) + [0.006], B.pick(6, 4)), M_gold)
        hx = s * 0.86
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.15, -0.05), (0.16, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.98, 2.6)), dch)
        B.obj('head_bezel_%d' % (s > 0), bm_rrect_tube(0.36, 0.36, 0.1, 0.026, B.pick(4, 1), B.pick(6, 3), at=(hx, 0.98, 2.62), axis=AZ), M_gold)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.13, 0.035, 0.13, L['cyl_s'], B.pick(5, 2), (hx, 0.98, 2.61), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.98, 2.72, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.44, 0.17, 0.07, 0.018, B.pick(4, 1), B.pick(4, 3), at=(s * 0.8, 1.0, -2.6), axis=AZn), M_gold)
        if lo: B.obj('tail_%d' % (s > 0), bm_box(0.4, 0.13, 0.04, (s * 0.8, 1.0, -2.58)), led('#ff1a2a'), bevel=0.015, bevel_angle=False, segments=1)
        else:   # a dark housing with three stacked red light bars and an amber turn lamp at the outer end
            B.obj('tail_%d' % (s > 0), bm_box(0.42, 0.15, 0.04, (s * 0.8, 1.0, -2.58)), dch, bevel=0.02, bevel_angle=False, segments=2)
            for j, yy in enumerate((0.955, 1.0, 1.045)):
                B.obj('tail_bar_%d_%d' % (s > 0, j), bm_capsule(0.017, 0.3 - 0.03 * abs(j - 1), 8, 2, (s * 0.77, yy, -2.603), AX), led('#ff1a2a', 5.0))
            B.obj('tail_turn_%d' % (s > 0), bm_closed_lathe([(0, -0.01), (0.032, -0.005), (0.026, 0.015), (0, 0.02)], 10, AZn, (s * 0.975, 1.0, -2.6)), led('#ffa21a', 4.0))
            B.obj('reverse_%d' % (s > 0), bm_closed_lathe([(0, -0.01), (0.05, -0.005), (0.042, 0.018), (0, 0.024)], 12, AZn, (s * 0.42, 0.74, -2.6)), led('#fff4e0', 2.0))
            B.obj('reverse_bezel_%d' % (s > 0), bm_torus(0.052, 0.01, 12, 4, AZn, (s * 0.42, 0.74, -2.602)), M_gold)
    # the tail panel: a gold-rimmed eye-in-a-pyramid badge of our own between the tail lights, a seam round the panel
    # and a laser-green pin line under it; the gold-and-green badge reads from the chase camera
    TB = (0.0, 0.94, -2.612)
    B.obj('badge_rim', bm_tube([(x, TB[1] + y, TB[2]) for x, y in rtri_pts(0.2, -0.13, 0.2, 0.03, B.pick(4, 2))], 0.018, B.pick(6, 4), closed=True), M_gold)
    all_seeing_eye(B, 'badge_eye', (0.0, TB[1] - 0.005, TB[2] + 0.004), 0.09, 0.046, M=rot(yaw=math.pi), lids=not lo, fine=False, ring=not lo)
    if not lo:
        B.obj('badge_back', bm_profile(rtri_pts(0.19, -0.12, 0.19, 0.025, 4), 0.012, at=(0, TB[1], TB[2] + 0.008)), paint('plaque', '#2e2540', coat=1.0, rough=0.2, metal=0.25))
        B.obj('tail_seam', bm_rrect_tube(1.86, 0.42, 0.12, 0.009, 4, 4, at=(0, 0.9, -2.603), axis=AZn), dch)
        B.strip((-0.55, 0.735, -2.606), (0.55, 0.735, -2.606), LIGHT, th=0.016, name='tail_pin')
        B.light(s * 0.8, 1.0, -2.7, 0.9, '#ff2a3a', tail=1)
    for zs, zc in ((1, 2.76), (-1, -2.74)):
        path = catmull([(1.2, 0.58, zc - zs * 0.42), (1.08, 0.58, zc - zs * 0.1), (0.7, 0.58, zc), (-0.7, 0.58, zc), (-1.08, 0.58, zc - zs * 0.1), (-1.2, 0.58, zc - zs * 0.42)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.065, B.pick(10, 6)), cr)

    # ---- gold obelisk pylons at the truck corners: a tapered shaft, a pyramidion and a green bulb ----
    for sx in (1, -1):
        for sz in (1, -1):
            x, z = sx * 1.1, sz * 2.3; top = 1.75 if sz > 0 else 2.05
            nm = 'pylon_%d_%d' % (sx > 0, sz > 0)
            B.obj(nm, bm_cyl(0.075, 0.05, top - 1.2, 4, RZ(45), (x, (top + 1.2) / 2, z)), M_gold, bevel=B.pick(0.015, None), segments=B.pick(2, 1))
            pyramidion(B, nm + '_cap', (x, top, z), 0.08, 0.2, M_gold2, bevel=0.01)
            B.obj(nm + '_tip', bm_ico(0.04, L['ico'], (x, top + 0.24, z)), ledg)

    # ---- the stepped pyramid: four battered violet tiers, gold copings, laser-line rings, LED rows, the eye ----
    for i, (w, d, y0, y1) in enumerate(TIERS):
        hw, hd, b = w / 2, d / 2, 0.05
        tr = [[(x, y0, PZ + z) for x, z in rrect_pts(w + 2 * b, d + 2 * b, 0.1, B.pick(3, 1))], [(x, y1, PZ + z) for x, z in rrect_pts(w, d, 0.08, B.pick(3, 1))]]
        t = B.obj('tier_%d' % i, bm_loft(tr, closed_u=True, caps='ngon'), M_tier[i % 2], bevel=B.pick(0.035, None), segments=B.pick(3, 1))
        B.vcol(t, lambda x, y, z, y0=y0, y1=y1: (0.62 + 0.38 * sstep((y - y0) / (y1 - y0)), 0.62 + 0.38 * sstep((y - y0) / (y1 - y0)), 0.7 + 0.3 * sstep((y - y0) / (y1 - y0))))
        B.obj('coping_%d' % i, bm_frame(w + 0.12, d + 0.12, 0.13, 0.06, (0, y1 + 0.02, PZ)), M_gold, bevel=B.pick(0.022, 0.0) or None, bevel_angle=False, segments=B.pick(2, 1))
        # the laser line: a dim always-on ring on the tier face, and the bright pulsing ring (part_glow<i>) just outside it
        gy = tier_glow_y(i); sl = (y1 - y0) / (2 * (y1 - y0))   # the battered wall's inset at gy is small; ignore it
        ox, oz = hw + b * 0.35, hd + b * 0.35
        ring = rect_ring(ox, oz, gy, PZ)
        B.obj('laser_dim_%d' % i, bm_tube(ring, 0.014, 4, closed=True), M_dim)
        G = B.part('glow%d' % i, (0, gy, PZ))
        B.obj('laser_%d' % i, bm_tube(rect_ring(ox + 0.012, oz + 0.012, 0.0), 0.022, B.pick(6, 4), closed=True), ledg, parent=G)
        for k, (cx, _, cz) in enumerate(rect_ring(ox + 0.012, oz + 0.012, 0.0)):
            B.obj('laser_%d_c%d' % (i, k), bm_ico(0.045, L['ico'], (cx, 0.0, cz)), ledg, parent=G)
        # LED rows along both flanks and the back (tier 1 also carries game lights)
        n = B.pick(6, 3) if i < 3 else B.pick(3, 2); yb = (y0 + y1) / 2 - 0.03
        for s in (1, -1):
            if lo and i in (1, 2, 3): continue   # the race level keeps the base tier's flank LEDs
            B.leds((s * (hw + b * 0.6 + 0.02), yb, PZ + hd - 0.2), (s * (hw + b * 0.6 + 0.02), yb, PZ - hd + 0.2), n, LIGHT, 0.042, 2 if i == 1 else 0, prefix='tled%d_%d' % (i, s > 0))
        if not lo or i == 0:
            B.leds((-hw + 0.2, yb, PZ - hd - b * 0.6 - 0.02), (hw - 0.2, yb, PZ - hd - b * 0.6 - 0.02), B.pick(5, 3) if i < 3 else 2, LIGHT, 0.042, 0, prefix='bled%d' % i)
    # the all-seeing eye: a gold-rimmed triangular plaque standing on the base tier's front ledge, a sunburst of gold rays
    # (showroom) round a big almond eye with a jade iris in a laser-green ring
    PZB, PY0, PY1, PHW = 1.885, 1.695, 2.62, 0.66
    plq = B.obj('eye_plaque', bm_profile(rtri_pts(PHW, PY0, PY1, 0.07, B.pick(5, 2)), 0.05, at=(0, 0, PZB)), paint('plaque', '#2e2540', coat=1.0, rough=0.2, metal=0.25),
                bevel=B.pick(0.015, None), bevel_angle=False, segments=2)
    B.vcol(plq, lambda x, y, z: (lambda q: (0.55 + 0.45 * q, 0.55 + 0.45 * q, 0.65 + 0.35 * q))(sstep((y - PY0) / (PY1 - PY0))))
    rim = [(x, y, PZB + 0.028) for x, y in rtri_pts(PHW + 0.012, PY0 - 0.012, PY1 + 0.02, 0.08, B.pick(5, 2))]
    B.obj('eye_plaque_rim', bm_tube(rim, 0.03, B.pick(8, 3), closed=True), M_gold)
    EC = (0.0, 2.0, PZB + 0.025)
    if not lo:
        tri = [(-PHW, PY0), (PHW, PY0), (0.0, PY1)]
        def hit(u):
            best = 9.0
            for i in range(3):
                (x1, y1), (x2, y2) = tri[i], tri[(i + 1) % 3]; ex, ey = x2 - x1, y2 - y1
                den = u[0] * ey - u[1] * ex
                if abs(den) < 1e-9: continue
                t = ((x1 - EC[0]) * ey - (y1 - EC[1]) * ex) / den; v = ((x1 - EC[0]) * u[1] - (y1 - EC[1]) * u[0]) / den
                if t > 0 and -0.001 <= v <= 1.001: best = min(best, t)
            return best
        for k in range(15):
            a = math.radians(-12 + 204 * k / 14); u = (math.cos(a), math.sin(a)); t1 = hit(u) - 0.075
            t0 = 0.4 if abs(u[1]) < 0.5 else 0.25
            if t1 - t0 < 0.05: continue
            B.obj('eye_ray_%d' % k, bm_tube([(EC[0] + u[0] * t, EC[1] + u[1] * t, PZB + 0.03) for t in (t0, (t0 + t1) / 2, t1)], [0.016, 0.011, 0.004], 5), M_gold)
    all_seeing_eye(B, 'eye', EC, 0.27, 0.135)

    # ---- the capstone (part_cap): a gold pyramidion with a glowing crystal; four laser emitters on its corners ----
    C = B.part('cap', CAP_J)
    B.obj('cap_plinth', bm_box(CAP_B * 2 + 0.12, 0.06, CAP_B * 2 + 0.12, (0, 0.03, 0)), M_gold2, parent=C, bevel=0.02, bevel_angle=False, segments=B.pick(2, 1))
    pyramidion(B, 'cap_gold', (0, 0.06, 0), CAP_B * math.sqrt(2), CAP_H, M_gold, parent=C, bevel=B.pick(0.025, 0.015))
    B.obj('cap_crystal', bm_lathe([(0, -0.08), (0.07, 0.0), (0.05, 0.08), (0.0, 0.14)], B.pick(8, 6), at=(0, 0.06 + CAP_H - 0.02, 0)), M_crystal, parent=C, smooth=False)
    if not lo:   # a small all-seeing eye on each face of the capstone: as it turns, one always looks back at the pack
        for k in range(4):
            a = k * math.pi / 2; nx, nz = math.sin(a), math.cos(a)
            dn = 0.06 + CAP_H * 0.33; rr = CAP_B * (1 - (dn - 0.06) / CAP_H) + 0.006
            all_seeing_eye(B, 'cap_eye_%d' % k, (nx * rr, dn, nz * rr), 0.1, 0.05, M=rot(yaw=a) @ rot(pitch=-0.757), parent=C, lids=False, lite=True)
    B.light(0, CAP_J[1] + 0.5, PZ, 3.2, LIGHT, big=1)
    for k in range(4):
        a = TAU * (k + 0.5) / 4; ex, ez2 = math.sin(a) * EMIT_R, math.cos(a) * EMIT_R
        Em = B.part('emit%d' % k, (ex, CAP_J[1] + 0.15, PZ + ez2))
        A = aim((math.sin(a), 0.35, math.cos(a)))
        B.obj('emit_yoke_%d' % k, bm_torus(0.065, 0.014, B.pick(12, 6), B.pick(4, 3), aim((math.cos(a), 0, -math.sin(a))), (0, 0, 0), sweep=(math.pi, TAU)), M_gold, parent=Em)
        B.obj('emit_body_%d' % k, bm_closed_lathe([(0, -0.09), (0.045, -0.09), (0.055, -0.04), (0.05, 0.08), (0.06, 0.1), (0.0, 0.1)], B.pick(12, 6), A, (0, 0, 0)), cr, parent=Em)
        d = Vector((math.sin(a), 0.35, math.cos(a))).normalized() * 0.11
        B.obj('emit_lens_%d' % k, bm_uv(0.035, B.pick(10, 6), B.pick(6, 3), tuple(d)), ledg, parent=Em)

    # ---- speaker towers at the back corners, two cones each facing the crowd behind (part_subs pumps them) ----
    Sb = B.part('subs', SUBS_J)
    for s in (1, -1):
        tx = s * 0.95; nm = 'tower_%d' % (s > 0)
        B.obj(nm, bm_box(0.6, 1.0, 0.62, (tx, 1.78, -2.0)), M_tower, bevel=B.pick(0.06, 0.04), bevel_angle=False, segments=B.pick(3, 1))
        B.obj(nm + '_cap', bm_box(0.68, 0.06, 0.7, (tx, 2.31, -2.0)), M_gold, bevel=0.02, bevel_angle=False, segments=1)
        pyramidion(B, nm + '_tip', (tx, 2.34, -2.0), 0.15, 0.3, M_gold, bevel=0.015)
        B.obj(nm + '_bulb', bm_ico(0.045, L['ico'], (tx, 2.68, -2.0)), ledg)
        for sx in (1, -1): B.strip((tx + sx * 0.31, 1.34, -2.31), (tx + sx * 0.31, 2.24, -2.31), LIGHT, name=nm + '_edge_%d' % (sx > 0))
        for yy in (1.53, 2.03):
            at = (tx, yy, -2.31); r = 0.17
            if not lo: B.obj('spk_plate_%d_%d' % (s > 0, yy > 1.8), bm_cyl(r + 0.07, r + 0.07, 0.02, L['cyl_s'], AZn, (tx, yy, -2.315)), satin('spk_plate', '#0c0a10', 0.45))
            B.obj('spk_trim_%d_%d' % (s > 0, yy > 1.8), bm_torus(r + 0.03, 0.022, L['cyl_s'], 4, AZn, (tx, yy, -2.33)), M_gold)
            B.obj('spk_glow_%d_%d' % (s > 0, yy > 1.8), bm_torus(r + 0.065, 0.014, L['cyl_s'], 3, AZn, (tx, yy, -2.322)), ledg)
            c = (tx - SUBS_J[0], yy - SUBS_J[1], -2.31 - SUBS_J[2])
            prof = [(0, -0.03), (r * 0.3, -0.025), (r * 0.6, -0.008), (r * 0.85, 0.006), (r * 0.95, 0.02), (r * 1.0, 0.0), (r * 0.9, -0.03), (0, -0.09)]
            B.obj('spk_cone_%d_%d' % (s > 0, yy > 1.8), bm_closed_lathe([(rr, hh - 0.03) for rr, hh in prof], L['cyl_s'], AZn, c), mat('spk_cone', '#16131a', rough=0.55), parent=Sb)
            B.obj('spk_cap_%d_%d' % (s > 0, yy > 1.8), bm_ellipsoid(r * 0.3, r * 0.3, r * 0.14, B.pick(12, 8), B.pick(5, 3), (c[0], c[1], c[2] + 0.05)), M_gold, parent=Sb)
    B.light(0, 1.8, -2.5, 1.2, LIGHT, led=1)

    # ---- wheels, the seat between the towers, a low glass wind deflector, size info ----
    B.wheels_pro(1.12, 1.75, -1.75, r=0.5, w=0.42, rim=COL2, tyre='#141218', cap=LIGHT, stripe=LIGHT)
    B.seat_pro(0, 1.62, -1.75, col=COL, accent=LIGHT, wheelZ=-1.2, piping=COL2)
    top = CAP_J[1] + 0.06 + CAP_H - 0.02 + 0.14
    B.info(5.4, 2.6, round(top, 2), muzzle=(0, CAP_J[1] + 0.3, PZ), wheelR=0.5, extra={'sight': [round(top + 0.02, 2), PZ]})
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('pyramid_scheme', build, report=True, views=['side', 'high'], level_overrides={'hi': {'ico': 1}})
