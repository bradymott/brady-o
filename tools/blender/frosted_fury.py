# Frosted Fury (Art Cart car #7): a tiny, sweet and absolutely furious cupcake kart. Piped buttercream, a pleated
# candy-striped wrapper, neon sprinkles and a bouncing glossy cherry on top.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/frosted_fury.py
# Writes assets/models/art-cart/frosted_fury.glb (showroom, 20–30k tris) and frosted_fury_lo.glb (race, 5–8k).
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#ff8ac8', '#fff4f8', '#ff9ad8'    # CART_CARS.cupcake palette: pink wrapper, frosting, light
NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff', '#ff3b5c']
LEDS = ['#ff8ac8', '#ffe24a', '#5ac8ff']
CUP = (0, 0.7, 0.75)                                 # the wrapper's base (the cupcake's axis is x = 0, z = 0.75)
CHERRY = (0, 3.25, 0.75)
# the piped rope: knots per turn (k = turns): ring radius, rope radius, height
NT = 3.4
KK = [0.0, 1.0, 2.0, 3.0, 3.4]
R_K = [0.84, 0.63, 0.42, 0.2, 0.0]
r_K = [0.31, 0.27, 0.23, 0.17, 0.0]
Y_K = [1.82, 2.28, 2.70, 3.02, 3.2]
SQ_OUT, SQ_UP = 1.06, 0.78                           # the rope squashes a little where it sits on the layer below

# ---- local helpers (the kit has no aimed primitives or swept tubes) ----
def aim(d):
    """A matrix that points a primitive's axis (Blender Z) along the engine direction d; use as `axis`/`M`."""
    v = E(*d); v.normalize()
    return v.to_track_quat('Z', 'Y').to_matrix().to_4x4()
def pch(ks, vs, k):
    """Piecewise cubic Hermite through (ks, vs) with finite-difference slopes (a smooth 1-D curve through knots)."""
    n = len(ks); k = min(max(k, ks[0]), ks[-1]); m = []
    for i in range(n):
        if i == 0: m.append((vs[1] - vs[0]) / (ks[1] - ks[0]))
        elif i == n - 1: m.append((vs[-1] - vs[-2]) / (ks[-1] - ks[-2]))
        else: m.append((vs[i + 1] - vs[i - 1]) / (ks[i + 1] - ks[i - 1]))
    for i in range(n - 1):
        if k <= ks[i + 1]:
            h = ks[i + 1] - ks[i]; t = (k - ks[i]) / h; t2 = t * t; t3 = t2 * t
            return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1]
    return vs[-1]
def sstep(x): x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)
def bm_sweep(nu, frame_fn, section_fn, caps=True):
    """A tube swept along a path: frame_fn(u) -> (C, N1, N2) engine Vectors (centre and two section axes);
    section_fn(u) -> [(a, b), …] offsets in that frame, or None for a collapsed ring (a tip)."""
    bm = bmesh.new(); rows = []
    for i in range(nu + 1):
        u = i / nu; C, N1, N2 = frame_fn(u); sec = section_fn(u)
        if sec is None: rows.append([bm.verts.new(E(C.x, C.y, C.z))]); continue
        rows.append([bm.verts.new(E(*(C + N1 * a + N2 * b))) for a, b in sec])
    for i in range(nu):
        A, B = rows[i], rows[i + 1]; n = max(len(A), len(B))
        if n == 1: continue
        for j in range(n):
            a0 = A[j % len(A)]; a1 = A[(j + 1) % len(A)]; b0 = B[j % len(B)]; b1 = B[(j + 1) % len(B)]
            vs = []
            for v in (a0, b0, b1, a1):
                if v not in vs: vs.append(v)
            if len(vs) >= 3: bm.faces.new(vs)
    if caps:
        for row in (rows[0], rows[-1]):
            if len(row) > 2:
                try: bm.faces.new(row)
                except ValueError: pass
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def bm_arch(c, Rin, Rout, w, a0, a1, seg):
    """A solid mudguard arch over a wheel at c: a rectangular section (thickness Rout-Rin, width w across x) swept
    through the YZ plane from angle a0 to a1 (0 = forward, pi/2 = up)."""
    Rm = (Rin + Rout) / 2; t = Rout - Rin; C0 = Vector(c)
    def frame(u):
        a = a0 + (a1 - a0) * u; n = Vector((0, math.sin(a), math.cos(a)))
        return C0 + n * Rm, n, Vector((1, 0, 0))
    sec = [(-t / 2, -w / 2), (t / 2, -w / 2), (t / 2, w / 2), (-t / 2, w / 2)]
    return bm_sweep(seg, frame, lambda u: sec)
def bm_arc_tube(zc, R, y, a0, a1, r, seg, tseg):
    """A round tube bent along a horizontal arc of radius R about (0, y, zc): angle 0 = forward."""
    def frame(u):
        a = a0 + (a1 - a0) * u
        return Vector((R * math.sin(a), y, zc + R * math.cos(a))), Vector((math.sin(a), 0, math.cos(a))), Vector((0, 1, 0))
    sec = [(math.cos(TAU * j / tseg) * r, math.sin(TAU * j / tseg) * r) for j in range(tseg)]
    return bm_sweep(seg, frame, lambda u: sec)
def bm_capsule(h, r, seg, lo, at, d):
    """A sprinkle: a bevelled capsule of half-length h, radius r, pointing along d at `at`."""
    if lo: prof = [(0, -h), (r, -h + r), (r, h - r), (0, h)]
    else: prof = [(0, -h), (r * 0.72, -h + r * 0.3), (r, -h + r), (r, h - r), (r * 0.72, h - r * 0.3), (0, h)]
    return bm_lathe(prof, seg, at=at, axis=aim(d))

# ---- the piped rope ----
def rope_R(u): return max(0.0, pch(KK, R_K, NT * u))
def rope_r(u): return max(0.0, pch(KK, r_K, NT * u)) * sstep(u / 0.05)
def rope_c(u):
    th = NT * u * TAU; R = rope_R(u)
    y = pch(KK, Y_K, NT * u) - 0.14 * (1 - sstep(u / 0.08))      # the start dips into the base dollop
    return Vector((R * math.sin(th), y, CUP[2] + R * math.cos(th)))
def rope_frame(u):
    C = rope_c(u); du = 1e-3
    T = rope_c(min(1, u + du)) - rope_c(max(0, u - du)); T.normalize()
    th = NT * u * TAU; rad = Vector((math.sin(th), 0, math.cos(th)))
    N1 = rad - T * rad.dot(T); N1.normalize()
    N2 = T.cross(N1)
    if N2.y < 0: N2 = -N2
    return C, N1, N2
def rope_pt(u, ph, ridges, amp):
    """Surface point and (approximate) outward normal of the rope at u, section angle ph (0 = outward, pi/2 = up)."""
    C, N1, N2 = rope_frame(u); r = rope_r(u)
    rr = r * (1 + amp * math.cos(ridges * ph + NT * u * 0.9))
    P = C + N1 * (math.cos(ph) * rr * SQ_OUT) + N2 * (math.sin(ph) * rr * SQ_UP)
    n = N1 * (math.cos(ph) / SQ_OUT) + N2 * (math.sin(ph) / SQ_UP); n.normalize()
    T = rope_c(min(1, u + 1e-3)) - rope_c(max(0, u - 1e-3)); T.normalize()
    return P, n, T
def bm_rope(nu, nv, ridges, amp):
    def sec(u):
        r = rope_r(u)
        if r < 0.004: return None
        tw = NT * u * 0.9; out = []
        for j in range(nv):
            ph = TAU * j / nv; rr = r * (1 + amp * math.cos(ridges * ph + tw))
            out.append((math.cos(ph) * rr * SQ_OUT, math.sin(ph) * rr * SQ_UP))
        return out
    return bm_sweep(nu, rope_frame, sec)

def build(B):
    L = B.L; lo = B.lo; rng = random.Random(77)
    # ---- materials: pearlescent frosting, candy-paper wrapper, white clear-coat plate, chrome, neon sprinkles ----
    M_frost = paint('frosting', COL2, coat=1.0, rough=0.22, metal=0.06)
    M_wrapP = paint('wrap_pink', COL, coat=0.5, rough=0.34, metal=0.0)
    M_wrapW = paint('wrap_white', '#fff8fb', coat=0.5, rough=0.34, metal=0.0)
    M_plate = paint('plate_white', '#ffffff', coat=1.0, rough=0.2, metal=0.1)
    M_under = paint('under_pink', COL, coat=0.8, rough=0.3, metal=0.05)
    M_fender = paint('fender_pink', '#ff6ab8', coat=1.0, rough=0.25, metal=0.1)
    M_cherry = glow('cherry_red', '#e8102a', strength=0.45, rough=0.12, coat=1.0)
    M_stem = satin('stem_green', '#3a6a1a', 0.5); M_leaf = paint('leaf_green', '#4a8a22', coat=0.4, rough=0.4, metal=0)
    M_bore = matte('bore', '#1a0a14', 0.7)
    led_p, led_y, led_w = led(COL), led('#ffe24a'), led('#ffffff', 3.0)
    def sprk(col): return glow('sprk_' + col.lstrip('#'), col, strength=0.6, rough=0.28, coat=1.0)

    # ---- chassis: glossy white plate with a candy-pink underside, wheel pockets, LED rows, racing stripes ----
    plate = B.obj('plate', bm_box(1.9, 0.36, 3.9, (0, 0.55, 0)), M_plate, bevel=0.13, bevel_angle=False, segments=B.pick(3, 1))
    B.obj('plate_under', bm_box(1.66, 0.12, 3.6, (0, 0.36, 0)), M_under, bevel=0.05, bevel_angle=False)
    for i, (x, z) in enumerate([(0.85, 1.45), (-0.85, 1.45), (0.85, -1.45), (-0.85, -1.45)]):
        B.cut([plate], bm_cyl(0.45, 0.45, 0.5, L['arch'], AX, (x * 1.12, 0.38, z)), 'arch_%d' % i)
        s = 1 if x > 0 else -1
        f = B.obj('fender_%d' % i, bm_arch((x, 0.38, z), 0.47, 0.56, 0.42, math.radians(14), math.radians(166), B.pick(20, 10)), M_fender, bevel=0.03, segments=B.pick(2, 1))
        if not lo:
            for a in (0.5, 1.06):
                a_ = a * math.pi
                B.obj('fender_rv_%d_%d' % (i, int(a * 100)), bm_uv(0.022, 8, 4, (x + s * 0.2, 0.38 + 0.57 * math.sin(a_), z + 0.57 * math.cos(a_))), chrome())
    for s in (1, -1):
        B.leds((s * 0.96, 0.55, 1.75), (s * 0.96, 0.55, -1.7), B.pick(8, 4), LEDS, 0.05, 3, prefix='led%d' % (s > 0))
        B.strip((s * 0.78, 0.745, 1.88), (s * 0.78, 0.745, -1.88), COL, name='stripe_%d' % (s > 0))
    # chrome tube bumpers front and rear (gentle arcs), with ball ends
    for s, zc in ((1, 2.06), (-1, -2.06)):
        R = 2.125; am = math.asin(0.9 / R); a0 = (0 if s > 0 else math.pi)
        B.obj('bumper_%d' % (s > 0), bm_arc_tube(zc - s * R, R, 0.41, a0 - am, a0 + am, 0.05, B.pick(20, 10), B.pick(8, 6)), chrome())
        for x in (0.9, -0.9):
            zz = zc - s * R + s * R * math.cos(am)
            B.obj('bumper_end_%d_%d' % (s > 0, x > 0), bm_uv(0.06, B.pick(10, 8), B.pick(6, 5), (x, 0.41, zz)), chrome())
    if not lo:
        for x in (0.82, -0.82):
            for z in (1.82, -1.82): B.obj('deck_rv_%d_%d' % (x > 0, z > 0), bm_uv(0.022, 8, 4, (x, 0.735, z)), chrome())
    B.lamps(0.6, 0.62, 1.97, -1.97, 0.62)

    # ---- the pleated wrapper: a 16-flute lathe with crisp creases, candy-striped pink/white, chrome beads ----
    def tri(x): return 1 - 4 * abs((x / TAU) % 1.0 - 0.5)
    rmod = lambda th, t: 1 + 0.045 * tri(16 * th)
    wr = B.obj('wrapper', bm_lathe([(0.82, 0), (0.83, 0.035), (1.02, 0.9), (1.05, 0.92)], 32, CUP, rmod=rmod), M_wrapP)
    wr.data.materials.append(M_wrapW)
    for p in wr.data.polygons:
        if len(p.vertices) > 4: continue
        c = p.center; th = math.atan2(c.y + CUP[2], c.x) % TAU
        j = int(th / (TAU / 32)); pleat = ((j + 1) // 2) % 16
        p.material_index = 1 if pleat % 2 else 0
    B.obj('wrap_lip', bm_lathe([(1.01, 0.895), (1.075, 0.925), (1.01, 0.955)], 32, CUP, rmod=rmod), chrome())
    B.obj('wrap_base', bm_torus(0.84, 0.028, B.pick(28, 16), B.pick(5, 4), AY, (0, 0.735, CUP[2])), chrome())

    # ---- the frosting: a core lathe under a piped rope with star-tip ridges, spiralling up to the cherry ----
    prof = [(0, 1.6), (1.1, 1.6), (1.15, 1.65), (1.12, 1.72), (0.98, 1.78)]
    for i in range(1, 11):
        u = 0.1 + 0.85 * i / 10; prof.append((max(0.02, rope_R(u) - 0.35 * rope_r(u)), rope_c(u).y))
    prof.append((0, rope_c(0.97).y))
    B.obj('frost_core', bm_lathe(prof, B.pick(28, 14), (0, 0, CUP[2])), M_frost)
    B.obj('frost_rope', bm_rope(B.pick(160, 72), B.pick(21, 8), 7, B.pick(0.16, 0.0)), M_frost)
    # sprinkles: deterministic scatter over the rope's top and outer face (~60 at hi, 14 at lo)
    n_sp = B.pick(48, 14); placed = 0; tries = 0
    while placed < n_sp and tries < 600:
        tries += 1
        u = rng.uniform(0.04, 0.9); ph = rng.uniform(-0.25 * math.pi, 0.72 * math.pi)
        P, n, T = rope_pt(u, ph, 7, B.pick(0.16, 0.0))
        if n.y < -0.05: continue
        t2 = n.cross(T); psi = rng.uniform(0, TAU); d = T * math.cos(psi) + t2 * math.sin(psi)
        at = P + n * 0.018
        col = NEON[(placed * 3 + rng.randrange(7)) % 7]
        B.obj('sprinkle_%d' % placed, bm_capsule(0.072, 0.026, B.pick(7, 5), lo, (at.x, at.y, at.z), (d.x, d.y, d.z)), sprk(col))
        placed += 1

    # ---- the cherry (part `cherry`): a glossy red ball with a stem and a leaf, bounces and rolls on its pivot ----
    CH = B.part('cherry', CHERRY)
    B.obj('cherry_ball', bm_uv(0.3, B.pick(24, 12), B.pick(16, 8)), M_cherry, parent=CH)
    B.obj('cherry_dimple', bm_uv(0.07, B.pick(10, 6), B.pick(6, 4), (0, 0.27, 0)), mat('cherry_dark', '#9a0818', rough=0.2, coat=1.0), parent=CH)
    if not lo: B.obj('cherry_hl', bm_uv(0.045, 8, 5, (0.12, 0.2, 0.2)), led_w, parent=CH)
    P0, P1, P2 = Vector((0, 0.24, 0)), Vector((-0.04, 0.58, 0.04)), Vector((0.14, 0.64, -0.1))
    def bez(t): return P0 * (1 - t) ** 2 + P1 * 2 * (1 - t) * t + P2 * t * t
    def stem_frame(u):
        C = bez(u); T = bez(min(1, u + 1e-3)) - bez(max(0, u - 1e-3)); T.normalize()
        N1 = Vector((1, 0, 0)) - T * T.x; N1.normalize(); N2 = T.cross(N1)
        return C, N1, N2
    ts = B.pick(8, 5)
    def stem_sec(u):
        r = 0.028 - 0.01 * u
        return [(math.cos(TAU * j / ts) * r, math.sin(TAU * j / ts) * r) for j in range(ts)]
    B.obj('cherry_stem', bm_sweep(B.pick(12, 5), stem_frame, stem_sec), M_stem, parent=CH)
    if not lo:
        leaf = [(0, 0), (0.045, 0.03), (0.07, 0.09), (0.05, 0.16), (0, 0.21), (-0.05, 0.16), (-0.07, 0.09), (-0.045, 0.03)]
        lf = B.obj('cherry_leaf', bm_profile(leaf, 0.012, (0.16, 0.66, -0.12), M=rot(yaw=-0.6, pitch=-1.1, roll=0.3)), M_leaf, parent=CH)
        B.bevel(lf, 0.008, angle=True, segments=2)
    B.light(*CHERRY, 1.4, '#ff2a4a', big=1)

    # ---- cockpit: a candy dash with a chrome gauge, the seat behind the cupcake, a sprinkle-mine dropper at the back ----
    B.obj('dash', bm_box(0.7, 0.18, 0.24, (0, 1.04, -0.3)), M_fender, bevel=0.04, bevel_angle=False)
    if not lo:
        B.obj('gauge_rim', bm_torus(0.07, 0.014, 14, 5, AZ, (0.18, 1.1, -0.43)), chrome())
        B.obj('gauge_face', bm_cyl(0.065, 0.065, 0.02, 14, AZ, (0.18, 1.1, -0.43)), glow('gauge', '#ffe6a0', strength=1.2, rough=0.2))
        B.obj('gauge_rim2', bm_torus(0.07, 0.014, 14, 5, AZ, (-0.18, 1.1, -0.43)), chrome())
        B.obj('gauge_face2', bm_cyl(0.065, 0.065, 0.02, 14, AZ, (-0.18, 1.1, -0.43)), glow('gauge2', '#9ad8ff', strength=1.2, rough=0.2))
    B.seat(0, 1.12, -1.3, col='#ff4fa8', accent='#ffe24a', wheelZ=-0.72)
    # the dropper: a pink mount block, a chrome funnel widening backwards to the muzzle, a glowing ring, a loaded mine
    B.obj('drop_mount', bm_box(0.42, 0.22, 0.3, (0, 0.8, -1.82)), M_fender, bevel=0.04, bevel_angle=False)
    B.obj('drop_funnel', bm_cyl(0.1, 0.17, 0.42, L['cyl_s'], AZn, (0, 0.8, -1.99)), chrome(), bevel=0.02)
    B.obj('drop_bore', bm_cyl(0.145, 0.145, 0.1, L['cyl_s'], AZn, (0, 0.8, -2.16), caps=False, flip=True), M_bore)
    B.obj('drop_ring', bm_torus(0.165, 0.018, B.pick(20, 10), B.pick(6, 4), AZ, (0, 0.8, -2.2)), led_p)
    B.obj('drop_mine', bm_uv(0.08, B.pick(12, 8), B.pick(8, 5), (0, 0.78, -2.1)), sprk('#ffe24a'))
    # twin chrome exhausts with a pink glow inside
    for s in (1, -1):
        B.obj('exh_%d' % (s > 0), bm_cyl(0.05, 0.065, 0.3, B.pick(12, 8), AZn, (s * 0.34, 0.52, -2.02)), chrome())
        B.obj('exh_glow_%d' % (s > 0), bm_cyl(0.045, 0.045, 0.03, B.pick(10, 8), AZn, (s * 0.34, 0.52, -2.17)), led_p)

    # ---- wheels and size info ----
    B.wheels(0.85, 1.45, -1.45, r=0.38, w=0.32, rim='#ffffff', tyre='#2a1a24', cap=LIGHT)
    B.info(4.2, 2.0, 3.5, muzzle=(0, 0.8, -2.2), wheelR=0.38, driverScale=1.0)

if __name__ == '__main__':
    run('frosted_fury', build, level_overrides={'hi': dict(ico=1, cyl=28)})
