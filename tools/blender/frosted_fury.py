# Frosted Fury (Art Cart car #7): a tiny, sweet and absolutely furious cupcake kart. Piped buttercream, a pleated
# candy-striped wrapper with a cross little face, neon sprinkles and a bouncing glossy cherry on top.
# Rebuilt to the Bass Valentine quality bar. Run it inside an open Blender (Blender 5.2 crashes headless):
#   import runpy; runpy.run_path('/abs/path/tools/blender/frosted_fury.py', run_name='__main__')
# Writes assets/models/art-cart/frosted_fury.glb (showroom, <= 30k tris) and frosted_fury_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['cupcake:2'] in src/43_cart_bb_glb.js; joints must match CART_CUP2 there):
#   part_frosting        the piped frosting + its sprinkles, joint at its base (FROST_J): it jiggles (squash and stretch)
#   part_cherry          the cherry, joint at its centre: it rides the frosting, bounces and wobbles
#   part_glintA / glintB tiny star glints on the sprinkles, joint at FROST_J: they ride the frosting and twinkle
#                        (scaled to 1 they stand on the surface; scaled down they sink into the frosting)
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#ff8ac8', '#fff4f8', '#ff9ad8'    # CART_CARS.cupcake palette: pink wrapper, frosting, light
NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff', '#ff3b5c']
LEDS = ['#ff8ac8', '#ffe24a', '#5ac8ff']
CUP = (0, 0.7, 0.75)                                 # the wrapper's base (the cupcake's axis is x = 0, z = 0.75)
CHERRY = (0, 3.25, 0.75)
FROST_J = (0, 1.6, 0.75)                             # part_frosting / part_glint*: the frosting's base
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

def hull_ring(z, w, h, r, seg, yc):
    return [(x, yc + y, z) for x, y in rrect_pts(w, h, r, seg)]

def wrap_R(y):
    """The wrapper's radius at height y (car space), between its pleats."""
    return 0.83 + 0.19 * min(1.0, max(0.0, (y - CUP[1] - 0.035) / 0.865))

def wrap_pt(x, y, off=0.0):
    """A point on the front of the wrapper at (x, y) pushed `off` out along the surface normal, and that normal."""
    R = wrap_R(y) * 1.03; z = math.sqrt(max(0.0, R * R - x * x))
    n = Vector((x / R, -0.21, z / R)); n.normalize()
    return Vector((x, y, CUP[2] + z)) + n * off, n

def to_local(bm, J):
    xf(bm, Matrix.Translation(-E(*J))); return bm

def build(B):
    L = B.L; lo = B.lo; rng = random.Random(77)
    B.export_try = VCOL_EXPORT   # the body, the wrapper and the frosting carry vertex-colour gradients
    # ---- materials: pearlescent frosting, candy-paper wrapper, white/pink clear coats, chrome, chocolate, neon sprinkles ----
    M_frost = paint('frosting', COL2, coat=1.0, rough=0.2, metal=0.06)
    M_wrapP = paint('wrap_pink', COL, coat=1.0, rough=0.24, metal=0.0)
    M_wrapW = paint('wrap_white', '#fff8fb', coat=1.0, rough=0.24, metal=0.0)
    M_plate = paint('plate_white', '#ffffff', coat=1.0, rough=0.16, metal=0.1)
    M_under = paint('under_pink', '#ff5aa8', coat=1.0, rough=0.2, metal=0.15)
    M_fender = paint('fender_pink', '#ff6ab8', coat=1.0, rough=0.2, metal=0.12)
    M_cherry = glow('cherry_red', '#e8102a', strength=0.45, rough=0.1, coat=1.0)
    M_stem = satin('stem_green', '#3a6a1a', 0.5); M_leaf = paint('leaf_green', '#4a8a22', coat=0.6, rough=0.35, metal=0)
    M_bore = matte('bore', '#1a0a14', 0.7)
    M_choc = paint('chocolate', '#3a1a10', coat=1.0, rough=0.18, metal=0.05)
    M_eye = paint('eye_white', '#ffffff', coat=1.0, rough=0.12, metal=0.0)
    M_pupil = paint('pupil', '#08060c', coat=1.0, rough=0.08, metal=0.0)
    led_p, led_w = led(COL), led('#ffffff', 3.0)
    cr = chrome()
    def sprk(col): return glow('sprk_' + col.lstrip('#'), col, strength=0.6, rough=0.2, coat=1.0)

    # ---- chassis: a lofted, rounded body, glossy white over candy pink, wheel arches with sculpted pink fenders ----
    cs = B.pick(5, 2)
    rings = [hull_ring(2.0, 1.4, 0.26, 0.12, cs, 0.56), hull_ring(1.94, 1.72, 0.36, 0.15, cs, 0.56), hull_ring(1.8, 1.9, 0.42, 0.17, cs, 0.56)]
    if not lo: rings += [hull_ring(0.0, 1.92, 0.42, 0.17, cs, 0.56)]
    rings += [hull_ring(-1.8, 1.9, 0.42, 0.17, cs, 0.56), hull_ring(-1.94, 1.72, 0.36, 0.15, cs, 0.56), hull_ring(-2.0, 1.4, 0.26, 0.12, cs, 0.56)]
    plate = B.obj('plate', bm_loft(rings, closed_u=True, caps=True), [M_plate, M_under], face_mat=lambda f: 1 if f.calc_center_median().z < 0.5 else 0)
    B.vcol(plate, lambda x, y, z: (1.0, 0.9 + 0.1 * sstep((y - 0.35) / 0.4), 0.94 + 0.06 * sstep((y - 0.35) / 0.4)))
    for i, (x, z) in enumerate([(0.85, 1.45), (-0.85, 1.45), (0.85, -1.45), (-0.85, -1.45)]):
        B.cut([plate], bm_cyl(0.45, 0.45, 0.5, L['arch'], AX, (x * 1.12, 0.38, z)), 'arch_%d' % i)
        s = 1 if x > 0 else -1
        B.obj('fender_%d' % i, bm_arch((x, 0.38, z), 0.47, 0.56, 0.42, math.radians(14), math.radians(166), B.pick(18, 10)), M_fender, bevel=B.pick(0.03, None), segments=B.pick(2, 1))
        if not lo:
            for a in (0.5, 1.06):
                a_ = a * math.pi
                B.obj('fender_rv_%d_%d' % (i, int(a * 100)), bm_uv(0.022, 8, 4, (x + s * 0.2, 0.38 + 0.57 * math.sin(a_), z + 0.57 * math.cos(a_))), cr)
    for s in (1, -1):
        B.leds((s * 0.97, 0.55, 1.0), (s * 0.97, 0.55, -1.0), B.pick(5, 3), LEDS, 0.045, 2, prefix='led%d' % (s > 0))
        B.strip((s * 0.66, 0.78, 1.8), (s * 0.66, 0.78, -1.8), COL, th=0.03, name='stripe_%d' % (s > 0))
        B.strip((s * 0.7, 0.33, 1.2), (s * 0.7, 0.33, -1.2), COL, th=0.035, name='glow_%d' % (s > 0))
        B.light(s * 0.6, 0.2, 0.0, 2.0, COL, led=1)
    # chrome tube bumpers front and rear (gentle arcs), with ball ends
    for s, zc in ((1, 2.08), (-1, -2.08)):
        R = 2.125; am = math.asin(0.9 / R); a0 = (0 if s > 0 else math.pi)
        B.obj('bumper_%d' % (s > 0), bm_arc_tube(zc - s * R, R, 0.41, a0 - am, a0 + am, 0.05, B.pick(20, 10), B.pick(8, 6)), cr)
        for x in (0.9, -0.9):
            zz = zc - s * R + s * R * math.cos(am)
            B.obj('bumper_end_%d_%d' % (s > 0, x > 0), bm_uv(0.06, B.pick(10, 8), B.pick(6, 5), (x, 0.41, zz)), cr)
    # bezelled headlights in the nose, chrome-ringed tail lights
    for s in (1, -1):
        hx = s * 0.52
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.05), (0.11, -0.04), (0.12, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.58, 1.97)), dark_chrome())
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.115, 0.02, L['torus'], B.pick(4, 3), AZ, (hx, 0.58, 1.985)), cr)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.1, 0.03, 0.1, L['cyl_s'], B.pick(5, 2), (hx, 0.58, 1.98), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.58, 2.08, 1.1, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.3, 0.12, 0.05, 0.014, B.pick(4, 1), 4, at=(s * 0.55, 0.6, -1.995), axis=AZn), cr)
        B.obj('tail_%d' % (s > 0), bm_box(0.26, 0.08, 0.04, (s * 0.55, 0.6, -1.99)), led('#ff1a2a'), bevel=0.012, bevel_angle=False, segments=1)
        B.light(s * 0.55, 0.6, -2.1, 0.8, '#ff2a3a', tail=1)

    # ---- the pleated wrapper: a 16-flute lathe with crisp creases, candy-striped pink/white, chrome beads ----
    def tri(x): return 1 - 4 * abs((x / TAU) % 1.0 - 0.5)
    rmod = lambda th, t: 1 + 0.045 * tri(16 * th)
    def pleat_mat(f):
        if len(f.verts) > 4: return 0
        c = f.calc_center_median(); th = math.atan2(c.y + CUP[2], c.x) % TAU
        j = int(th / (TAU / 32)); pleat = ((j + 1) // 2) % 16
        return 1 if pleat % 2 else 0
    wr = B.obj('wrapper', bm_lathe([(0.82, 0), (0.83, 0.035), (1.02, 0.9), (1.05, 0.92)], 32, CUP, rmod=rmod), [M_wrapP, M_wrapW], face_mat=pleat_mat)
    B.vcol(wr, lambda x, y, z: (0.82 + 0.18 * sstep((y - 0.7) / 0.8),) * 3)
    B.obj('wrap_lip', bm_lathe([(1.01, 0.895), (1.075, 0.925), (1.01, 0.955)], 32, CUP, rmod=rmod), cr)
    B.obj('wrap_base', bm_torus(0.84, 0.028, B.pick(28, 16), B.pick(5, 4), AY, (0, 0.735, CUP[2])), cr)

    # ---- the face on the wrapper: big glossy eyes glaring inward, furious chocolate brows, a tight little frown ----
    for s in (1, -1):
        c, n = wrap_pt(s * 0.27, 1.27, 0.035)
        A = aim(tuple(n))
        B.obj('eye_white_%d' % (s > 0), bm_ellipsoid(0.15, 0.06, 0.18, B.pick(20, 10), B.pick(10, 5), tuple(c), M=A), M_eye)
        pc = c + n * 0.045 + Vector((-s * 0.045, -0.035, 0))
        B.obj('eye_pupil_%d' % (s > 0), bm_ellipsoid(0.075, 0.03, 0.085, B.pick(16, 8), B.pick(8, 4), tuple(pc), M=A), M_pupil)
        B.obj('eye_hl_%d' % (s > 0), bm_ico(0.026, B.pick(2, 1), tuple(pc + n * 0.03 + Vector((s * 0.015, 0.03, 0)))), led_w)
        # the angry lid: a pink cap slanting down toward the nose over the top of the eye
        lid = [tuple(wrap_pt(s * (0.1 + 0.36 * t), 1.39 + 0.12 * t + 0.035 * math.sin(t * math.pi), 0.06)[0]) for t in (k / 8 for k in range(9))]
        B.obj('brow_%d' % (s > 0), bm_tube(lid, [0.03, 0.042, 0.05, 0.052, 0.052, 0.05, 0.044, 0.034, 0.02], B.pick(8, 5)), M_choc)
    mouth = [tuple(wrap_pt(0.15 * (2 * t - 1), 1.02 + 0.055 * (1 - (2 * t - 1) ** 2), 0.03)[0]) for t in (k / 8 for k in range(9))]
    B.obj('mouth', bm_tube(mouth, [0.012, 0.022, 0.028, 0.03, 0.03, 0.03, 0.028, 0.022, 0.012], B.pick(8, 4)), M_choc)

    # ---- the frosting (part_frosting): a core lathe under a piped rope with star-tip ridges, sprinkles on top ----
    F = B.part('frosting', FROST_J)
    prof = [(0, 1.6), (1.1, 1.6), (1.15, 1.65), (1.12, 1.72), (0.98, 1.78)]
    for i in range(1, 11):
        u = 0.1 + 0.85 * i / 10; prof.append((max(0.02, rope_R(u) - 0.35 * rope_r(u)), rope_c(u).y))
    prof.append((0, rope_c(0.97).y))
    def frost_col(x, y, z):   # local to FROST_J: a strawberry-milk blush at the base fading to pearl white at the top
        t = sstep((y - 0.05) / 1.3); return (1.0, 0.86 + 0.14 * t, 0.92 + 0.08 * t)
    core = B.obj('frost_core', to_local(bm_lathe(prof, B.pick(28, 14), (0, 0, CUP[2])), FROST_J), M_frost, parent=F)
    rope = B.obj('frost_rope', to_local(bm_rope(B.pick(124, 56), B.pick(19, 7), 7, B.pick(0.16, 0.0)), FROST_J), M_frost, parent=F)
    B.vcol(core, frost_col); B.vcol(rope, frost_col)
    # sprinkles: deterministic scatter over the rope's top and outer face
    n_sp = B.pick(44, 12); placed = 0; tries = 0; spots = []
    while placed < n_sp and tries < 600:
        tries += 1
        u = rng.uniform(0.04, 0.9); ph = rng.uniform(-0.25 * math.pi, 0.72 * math.pi)
        P, n, T = rope_pt(u, ph, 7, B.pick(0.16, 0.0))
        if n.y < -0.05: continue
        t2 = n.cross(T); psi = rng.uniform(0, TAU); d = T * math.cos(psi) + t2 * math.sin(psi)
        at = P + n * 0.018 - Vector(FROST_J)
        col = NEON[(placed * 3 + rng.randrange(7)) % 7]
        B.obj('sprinkle_%d' % placed, bm_capsule(0.072, 0.026, B.pick(7, 5), lo, (at.x, at.y, at.z), (d.x, d.y, d.z)), sprk(col), parent=F)
        spots.append((P, n)); placed += 1
    # glints: little four-point stars beside some sprinkles, two groups that twinkle in turn (part_glintA / glintB)
    for gi, gname in enumerate(('glintA', 'glintB')):
        G = B.part(gname, FROST_J)
        for k in range(B.pick(6, 3)):
            P, n = spots[(k * 2 + gi) * 3 % len(spots)]
            c = P + n * 0.06 - Vector(FROST_J); u_, v_ = perp_basis(tuple(n))
            for m_, (a, b) in enumerate(((u_, 0.09), (v_, 0.09))):
                p0 = c - a * b; p1 = c + a * b
                B.obj('%s_%d_%d' % (gname, k, m_), bm_tube([tuple(p0), tuple(c), tuple(p1)], [0.0, 0.014, 0.0], 4, caps=False), led_w, parent=G)
            B.obj('%s_%d_c' % (gname, k), bm_ico(0.022, 1, tuple(c)), led_w, parent=G)

    # ---- the cherry (part_cherry): a glossy red ball with a stem and a leaf; it rides the frosting, bounces, wobbles ----
    CH = B.part('cherry', CHERRY)
    ball = B.obj('cherry_ball', bm_uv(0.3, B.pick(24, 12), B.pick(16, 8)), M_cherry, parent=CH)
    B.vcol(ball, lambda x, y, z: (0.62 + 0.38 * sstep((y + 0.3) / 0.6),) * 3)
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

    # ---- cockpit: a candy dash with chrome gauges, the seat behind the cupcake, a sprinkle-mine dropper at the back ----
    B.obj('dash', bm_box(0.7, 0.18, 0.24, (0, 1.04, -0.3)), M_fender, bevel=0.06, bevel_angle=False, segments=B.pick(3, 1))
    if not lo:
        for s, gc in ((1, '#ffe6a0'), (-1, '#9ad8ff')):
            B.obj('gauge_rim_%d' % (s > 0), bm_torus(0.07, 0.014, 14, 5, AZ, (s * 0.18, 1.1, -0.43)), cr)
            B.obj('gauge_face_%d' % (s > 0), bm_cyl(0.065, 0.065, 0.02, 14, AZ, (s * 0.18, 1.1, -0.43)), glow('gauge_' + gc.lstrip('#'), gc, strength=1.2, rough=0.2))
    B.seat(0, 1.12, -1.3, col='#ff4fa8', accent='#ffe24a', wheelZ=-0.72)
    B.obj('drop_mount', bm_box(0.42, 0.22, 0.3, (0, 0.8, -1.82)), M_fender, bevel=0.05, bevel_angle=False, segments=B.pick(2, 1))
    B.obj('drop_funnel', bm_cyl(0.1, 0.17, 0.42, L['cyl_s'], AZn, (0, 0.8, -1.99)), cr, bevel=0.02)
    B.obj('drop_bore', bm_cyl(0.145, 0.145, 0.1, L['cyl_s'], AZn, (0, 0.8, -2.16), caps=False, flip=True), M_bore)
    B.obj('drop_ring', bm_torus(0.165, 0.018, B.pick(20, 10), B.pick(6, 4), AZ, (0, 0.8, -2.2)), led_p)
    B.obj('drop_mine', bm_uv(0.08, B.pick(12, 8), B.pick(8, 5), (0, 0.78, -2.1)), sprk('#ffe24a'))
    for s in (1, -1):
        B.obj('exh_%d' % (s > 0), bm_cyl(0.05, 0.065, 0.3, B.pick(12, 8), AZn, (s * 0.34, 0.5, -2.02)), cr)
        B.obj('exh_glow_%d' % (s > 0), bm_cyl(0.045, 0.045, 0.03, B.pick(10, 8), AZn, (s * 0.34, 0.5, -2.17)), led_p)

    # ---- wheels and size info ----
    B.wheels_pro(0.85, 1.45, -1.45, r=0.38, w=0.32, rim='#ff6ab8', tyre='#2a1a24', cap=LIGHT, stripe='#ffffff')
    B.info(4.2, 2.0, 3.55, muzzle=(0, 0.8, -2.2), wheelR=0.38, driverScale=1.0)
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('frosted_fury', build, report=True, views=['side', 'high'], level_overrides={'hi': dict(ico=1, cyl=28)})
