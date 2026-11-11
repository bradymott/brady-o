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
# Touch-up pass: the dragon is sculpted (a muscular trunk with shoulder and haunch masses, a dorsal ridge of curved gold
# spines, gold belly plates down the chest, throat and tail, armoured scute rows), real membrane wings (arm, three
# finger bones, scalloped two-tone membrane with a little billow), and a characterful lofted head (brow ridges, ridged
# swept horns, cheek spikes, flared glowing nostrils, fangs and underbite tusks, a dandy's barbel moustache, ear frills).
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
def sub(a, b): return tuple(a[i] - b[i] for i in range(3))
def lerp3(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def G(x, mu, sig): return math.exp(-((x - mu) / sig) ** 2)
def cone(r, length, at, direction, seg):
    """A claw/tooth: a cone of base radius r pointing along `direction` from its base at `at`."""
    d = norm(direction); c = add(at, d, length / 2)
    return bm_cyl(r, 0.0, length, seg, aim(d), c)
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
def curved_tube(pts, r0, r1, seg, n, taper=1.0, ridges=0, ridge_h=0.0):
    """A smooth tapered tube through the control points (a horn, a claw, a barbel): radius r0 -> r1, `ridges` raised rings."""
    path = catmull(pts, n)
    rs = []
    for i in range(n):
        u = i / (n - 1); r = r0 + (r1 - r0) * (u ** taper)
        if ridges: r *= 1 + ridge_h * max(0.0, math.sin(u * math.pi * ridges)) ** 3 * (1 - u)
        rs.append(r)
    return bm_tube(path, rs, seg)
def spine_bm(base, up, back, h, w, n, seg=6):
    """A curved gold spine (a sabre-like blade) standing on a surface at `base` with normal `up`, sweeping toward `back`:
    a lens section, flat across the car's x, tapering to a sharp tip. The foot sinks a little into the surface."""
    up = norm(up); back = norm(back)
    def path(u): return add(add(base, up, -0.05 + h * u), back, h * 0.5 * u * u)
    def frame(u):
        a, b = path(max(0.0, u - 0.02)), path(min(1.0, u + 0.02)); T = norm(sub(b, a))
        X = (1.0, 0.0, 0.0); N2 = norm(cross(X, T))
        return Vector(X), Vector(N2)
    sec = [(math.cos(TAU * j / seg) * 0.32, math.sin(TAU * j / seg)) for j in range(seg)]
    def section(u):
        if u >= 1.0 - 1e-6: return None
        r = w * (1 - u) ** 0.85
        return [(a * r, b * r) for a, b in sec]
    return bm_sweep(path, section, n, frame_fn=frame)
def bump_patch(F, a0, a1, b0, b1, na, nb, h):
    """A raised plate on a surface F(a, b) -> (point, normal): flush at its rim, lifted up to h inside, highest near the
    b1 edge (a shingle that overlaps the next plate). Gold belly plates, armour scutes."""
    def fn(u, v):
        a = a0 + (a1 - a0) * u; b = b0 + (b1 - b0) * v
        p, n = F(a, b)
        lift = h * math.sin(math.pi * u) ** 0.5 * (math.sin(math.pi * min(1.0, v * 0.62 + 0.0)) ** 0.6) * (1 - v ** 8) - 0.012
        return add(p, n, lift)
    return bm_surf(na, nb, fn, merge=True)

# ---------------- the trunk: a muscular body along z (shoulders, haunches, a spine ridge, a flatter belly) ----------------
TZ = [-2.55, -2.3, -1.85, -1.35, -0.6, 0.2, 0.9, 1.4, 1.8, 2.05, 2.18]
TCY = [1.46, 1.47, 1.52, 1.55, 1.56, 1.56, 1.6, 1.65, 1.68, 1.69, 1.7]
THW = [0.0, 0.46, 0.8, 0.95, 0.92, 0.94, 1.0, 0.96, 0.78, 0.46, 0.0]
THH = [0.0, 0.42, 0.66, 0.79, 0.81, 0.83, 0.85, 0.81, 0.66, 0.4, 0.0]
def tfr(z): return hermite(TZ, TCY, z), max(0.0, hermite(TZ, THW, z)), max(0.0, hermite(TZ, THH, z))
def trunk_p(a, z, out=0.0):
    """Trunk surface at section angle a (pi/2 = spine, 3pi/2 = belly, 0 = the car's left) and z."""
    cy, hw, hh = tfr(z); ca, sa = math.cos(a), math.sin(a)
    elev = math.atan2(sa, abs(ca))
    k = 1 + 0.12 * G(z, 1.15, 0.36) * G(elev, 0.3, 0.45) + 0.12 * G(z, -1.4, 0.4) * G(elev, 0.25, 0.5)
    k += 0.05 * G(elev, math.pi / 2, 0.2) * (1 - G(z, -0.3, 0.75))           # spine ridge (not under the saddle)
    k += 0.015 * math.sin(z * 13) * G(elev, 0.0, 0.45) * G(z, -0.2, 0.8)     # a hint of ribs along the flanks
    sy = sa * (0.84 if sa < 0 else 1.0)
    return (ca * hw * k + out * ca, cy + sy * hh * k + out * sa, z)
def trunk_n(a, z):
    e = 1e-3; p = trunk_p(a, z)
    t1 = sub(trunk_p(a + e, z), trunk_p(a - e, z)); t2 = sub(trunk_p(a, z + e), trunk_p(a, z - e))
    n = norm(cross(t1, t2)); cy = tfr(z)[0]
    if dot(n, (p[0], p[1] - cy, 0.0)) < 0: n = tuple(-c for c in n)
    return n
def trunk_F(a, z): return trunk_p(a, z), trunk_n(a, z)
def hide_col(e):
    """The hide's two-tone gradient by height around a section (e = -1 belly .. 1 spine): dark emerald along the back,
    bright green flanks, a warm yellow-green toward the belly (a multiplier on the light hide paint)."""
    top, flank, belly = (0.34, 0.5, 0.36), (0.78, 0.95, 0.72), (1.0, 1.0, 0.55)
    c = [belly[i] + (flank[i] - belly[i]) * sstep((e + 0.55) / 0.6) for i in range(3)]
    return tuple(c[i] + (top[i] - c[i]) * sstep((e - 0.15) / 0.75) for i in range(3))

class Tube:
    """A smooth body tube in the x = 0 plane along a Catmull-Rom spine (neck, tail): p(a, b) is the surface point at
    section angle a (pi/2 = the spine side, -pi/2 = the belly side, 0 = the car's left) and b in 0..1 along it."""
    def __init__(self, ctrl, radii, sx=1.0, sy=1.0, top_ridge=0.0):
        self.ctrl, self.radii, self.sx, self.sy, self.ridge = ctrl, radii, sx, sy, top_ridge
        T = self.t(0.5); U = cross((1.0, 0.0, 0.0), T); self.sg = 1.0 if U[1] >= 0 else -1.0
    def c(self, b): return catmull_at(self.ctrl, min(1.0, max(0.0, b)))
    def t(self, b): return norm(sub(self.c(b + 0.004), self.c(b - 0.004)))
    def up(self, b): U = cross((1.0, 0.0, 0.0), self.t(b)); return norm(tuple(c * self.sg for c in U))
    def r(self, b): return catmull_at([(r,) for r in self.radii], min(1.0, max(0.0, b)))[0]
    def p(self, a, b, out=0.0):
        U = self.up(b); r = self.r(b) * (1 + self.ridge * G(a, math.pi / 2, 0.3)); c = self.c(b)
        x = math.cos(a) * (r * self.sx + out); y = math.sin(a) * (r * self.sy + out)
        return (c[0] + x, c[1] + U[1] * y, c[2] + U[2] * y)
    def n(self, a, b):
        U = self.up(b); x = math.cos(a) / self.sx; y = math.sin(a) / self.sy
        return norm((x, U[1] * y, U[2] * y))
    def F(self, a, b): return self.p(a, b), self.n(a, b)
    def mesh(self, nu, nv, b0=0.0, b1=1.0):
        return bm_surf(nu, nv, lambda u, v: self.p(TAU * u, b0 + (b1 - b0) * v), wrap_u=True, merge=True)
    def elev(self, x, y, z):
        """-1 (belly side) .. 1 (spine side) of a point near the tube (for the vertex colours)."""
        best, bb = 1e9, 0.0
        for i in range(41):
            b = i / 40; c = self.c(b); d = (x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2
            if d < best: best, bb = d, b
        c = self.c(bb); U = self.up(bb); v = (x - c[0], y - c[1], z - c[2]); L = math.sqrt(dot(v, v)) or 1.0
        return dot(v, U) / L

# ---------------- the head: a lofted skull, authored head-local (+z = the snout, y up) ----------------
HZ = [-0.6, -0.48, -0.25, 0.05, 0.3, 0.5, 0.75, 0.98, 1.14, 1.24]
HW = [0.0, 0.3, 0.43, 0.46, 0.42, 0.35, 0.32, 0.31, 0.26, 0.0]
HYT = [0.04, 0.3, 0.42, 0.44, 0.38, 0.22, 0.13, 0.15, 0.09, -0.08]
HYB = [-0.12, -0.28, -0.32, -0.3, -0.27, -0.25, -0.25, -0.24, -0.22, -0.14]
def head_p(a, z):
    w = max(0.0, hermite(HZ, HW, z)); yt = hermite(HZ, HYT, z); yb = hermite(HZ, HYB, z)
    end = min(1.0, (z - HZ[0]) / 0.06, (HZ[-1] - z) / 0.06)
    yc, hh = (yt + yb) / 2, max(0.0, (yt - yb) / 2) * max(0.0, end) ** 0.5; ca, sa = math.cos(a), math.sin(a)
    e = 2.0 / (2.6 if sa > 0 else 3.6)
    sx = math.copysign(abs(ca) ** e, ca); sy = math.copysign(abs(sa) ** e, sa)
    w *= 1 + 0.13 * G(z, -0.05, 0.22) * G(sa, -0.25, 0.5)            # cheeks
    w *= 1 - 0.12 * G(z, 0.36, 0.12) * G(sa, 0.35, 0.3)              # eye sockets
    y = yc + sy * hh
    y += 0.05 * G(z, 1.04, 0.07) * G(abs(ca * w), 0.13, 0.07) * max(0.0, sa)   # nostril mounds
    return (sx * w, y, z)

def build(B):
    L = B.L; body = B.body; lo = B.lo
    # ---- materials ----
    M_hide = paint('hide_light', '#36c86a', coat=0.9, rough=0.3, metal=0.12)      # the hide: painted dark-to-light by vertex colour
    M_scale = paint('scale_green', COL, coat=1.0, rough=0.28, metal=0.15)
    M_scute = paint('scute_dark', '#1a7a42', coat=1.0, rough=0.26, metal=0.18)     # armour scutes along the back
    M_dark = paint('hide_dark', '#17703c', coat=0.6, rough=0.4, metal=0.05)         # lids, brows, paws, wing bones
    M_goldp = paint('gold_paint', COL2, coat=1.0, rough=0.3, metal=0.3)             # belly plates, spines, spade
    M_gold = metal('gold', COL2, 0.25)                                              # rims, rivets, trim (chrome-mapped gold)
    M_wing = paint('wing_membrane', '#e27aff', coat=0.5, rough=0.38, metal=0.0)     # two-tone by vertex colour
    M_horn = paint('horn_cream', '#ffe8b0', coat=0.5, rough=0.35, metal=0.0)
    M_hat = matte('hat_felt', '#15101a', rough=0.85)
    M_ember = glow('ember', '#ff8a2a', strength=1.5)
    M_nostril = glow('nostril', '#ff6a1a', strength=3.0)
    M_saddle = satin('saddle_leather', '#3a1a4a', rough=0.5)
    M_tooth = paint('tooth', '#ffffff', coat=0.4, rough=0.3, metal=0)
    ledg = led(LIGHT)

    # ======================= BODY (bone 0) =======================
    B.export_try = VCOL_EXPORT
    # the coach: a lofted emerald clear-coat body over a black sill, gold shoulder trim, gold-flared wheel arches,
    # green under-glow, gold tube bumpers, bezelled lamps
    M_coach = paint('coach_emerald', '#0f4a2a', coat=1.0, rough=0.2, metal=0.35); M_sill = paint('coach_black', '#0a120c', coat=1.0, rough=0.22, metal=0.2)
    cs = B.pick(6, 3)
    rings = [hull_ring(2.5, 1.7, 0.36, 0.16, cs, yc=0.74), hull_ring(2.42, 2.06, 0.54, 0.22, cs), hull_ring(2.26, 2.3, 0.64, 0.24, cs)]
    if not lo: rings += [hull_ring(0.0, 2.32, 0.66, 0.24, cs)]
    rings += [hull_ring(-2.26, 2.3, 0.64, 0.24, cs), hull_ring(-2.42, 2.06, 0.54, 0.22, cs), hull_ring(-2.5, 1.7, 0.36, 0.16, cs, yc=0.74)]
    coach = B.obj('coach', bm_loft(rings, closed_u=True, caps=True), [M_coach, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < 0.6 else 0)
    B.vcol(coach, lambda x, y, z: (lambda t: (0.7 + 0.3 * t, 0.8 + 0.2 * t, 0.75 + 0.25 * t))(sstep((y - 0.55) / 0.5)))
    for i, (x, z) in enumerate([(1.08, 1.75), (-1.08, 1.75), (1.08, -1.75), (-1.08, -1.75)]):
        B.cut([coach], bm_cyl(0.64, 0.64, 0.9, L['arch'], AX, (math.copysign(1.28, x), 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.036, B.pick(18, 8), B.pick(4, 3), AX, (math.copysign(1.165, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_gold)
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 0.9, 1.0, 2.45), (s * 1.14, 1.04, 1.9), (s * 1.16, 1.04, -1.9), (s * 0.9, 1.0, -2.45)], B.pick(12, 4)), 0.022, B.pick(8, 4)), M_gold)
        B.strip((s * 1.14, 0.44, 2.1), (s * 1.14, 0.44, -2.1), LIGHT, th=0.04)
        B.light(s * 1.0, 0.25, 0.0, 2.4, LIGHT, led=1)
        if not lo:   # a row of gold-ringed green marker lamps along the flank between the arches
            for k, z in enumerate((0.55, -0.55)):
                B.obj('marker_%d_%d' % (s > 0, k), bm_ellipsoid(0.07, 0.07, 0.07, 10, 3, (s * 1.16, 0.8, z), aim((s, 0, 0)), phi1=math.pi / 2), ledg)
                B.obj('marker_ring_%d_%d' % (s > 0, k), bm_torus(0.075, 0.016, 10, 3, aim((s, 0, 0)), (s * 1.162, 0.8, z)), M_gold)
    B.strip((-0.85, 0.44, 2.5), (0.85, 0.44, 2.5), LIGHT, th=0.035); B.strip((-0.85, 0.44, -2.5), (0.85, 0.44, -2.5), LIGHT, th=0.035)
    for zs, zc in ((1, 2.66), (-1, -2.66)):
        B.obj('bumper_%d' % (zs > 0), bm_tube(catmull([(1.12, 0.55, zc - zs * 0.42), (1.0, 0.55, zc - zs * 0.1), (0.6, 0.55, zc), (-0.6, 0.55, zc), (-1.0, 0.55, zc - zs * 0.1), (-1.12, 0.55, zc - zs * 0.42)], B.pick(13, 7)), 0.06, B.pick(8, 6)), M_gold)
    for s in (1, -1):
        hx = s * 0.72
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.14, -0.05), (0.15, 0.0), (0.0, 0.01)], B.pick(L['cyl_s'], 8), AZ, (hx, 0.8, 2.49)), dark_chrome())
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.145, 0.026, B.pick(16, 10), B.pick(4, 3), AZ, (hx, 0.8, 2.505)), M_gold)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.12, 0.032, 0.12, B.pick(L['cyl_s'], 8), B.pick(5, 2), (hx, 0.8, 2.5), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.8, 2.64, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_torus(0.1, 0.02, B.pick(12, 8), 3, AZn, (s * 0.66, 0.82, -2.525)), M_gold)
        B.obj('taillamp_%d' % (s > 0), bm_ellipsoid(0.085, 0.03, 0.085, B.pick(L['cyl_s'], 8), B.pick(4, 2), (s * 0.66, 0.82, -2.52), phi1=math.pi / 2, M=AZn), led('#ff2a1a'))
        B.light(s * 0.66, 0.82, -2.64, 0.9, '#ff2a3a', tail=1)

    # ---- the trunk: one sculpted surface, two-tone hide ----
    nz = B.pick(26, 12); na = B.pick(30, 12)
    zs_ = lambda v: (TZ[0] + TZ[-1]) / 2 - (TZ[-1] - TZ[0]) / 2 * math.cos(math.pi * v)
    trunk = B.obj('trunk', bm_surf(na, nz, lambda u, v: trunk_p(TAU * u, zs_(v)), wrap_u=True, merge=True), M_hide)
    def trunk_col(x, y, z):
        cy, hw, hh = tfr(z); return hide_col(max(-1.0, min(1.0, (y - cy) / max(hh, 0.02))))
    B.vcol(trunk, trunk_col)
    # armour scutes: tidy rows of low keeled plates either side of the spine (none under the saddle)
    if False:   # (armour scute rows: tried, they read as dark patches; dropped)
        for side in (1, -1):
            for row, (el, zr, n) in enumerate(((1.12, (1.65, -2.2), 11), (0.78, (1.5, -2.0), 9))):
                for k in range(n):
                    z = zr[0] + (zr[1] - zr[0]) * k / (n - 1)
                    if row == 0 and -1.15 < z < 0.55: continue
                    a = el if side > 0 else math.pi - el
                    sz = 0.15 * (0.7 + 0.3 * tfr(z)[1])
                    sc = bump_patch(trunk_F, a - 0.13, a + 0.13, z + sz, z - sz, 4, 2, 0.05)
                    B.obj('scute_%d_%d_%d' % (side > 0, row, k), sc, M_scute)
    # gold belly plates down the chest (the front of the trunk, below the neck)
    for k, (z0, z1) in enumerate(((1.62, 1.78), (1.78, 1.92), (1.92, 2.04), (2.04, 2.13))):
        if lo and k % 2: continue
        pl = bump_patch(trunk_F, 1.5 * math.pi - 0.95, 1.5 * math.pi + 0.95, z1, z0, B.pick(8, 4), B.pick(3, 2), 0.045)
        B.obj('chest_plate_%d' % k, pl, M_goldp)
    # the dorsal ridge: curved gold spines (they lean back), leaving the saddle clear
    for z, h in ([(1.62, 0.36), (1.3, 0.44), (0.98, 0.34), (-1.22, 0.4), (-1.55, 0.36), (-1.88, 0.3), (-2.18, 0.24)] if not lo else [(1.3, 0.44), (-1.3, 0.4), (-1.9, 0.3)]):
        p, n = trunk_F(math.pi / 2, z)
        B.obj('spine_%d' % int(z * 100), spine_bm(p, n, (0, 0, -1), h, h * 0.36, B.pick(5, 3), B.pick(6, 4)), M_goldp)
    # saddle on the back: leather pad, gold rim, rivets; the driver's seat sits in it
    B.obj('saddle', bm_ellipsoid(0.6, 0.14, 0.82, L['cyl_s'], B.pick(4, 2), (0, 2.35, -0.3), phi1=math.pi / 2), M_saddle)
    B.obj('saddle_rim', bm_torus(0.62, 0.03, L['torus'], L['tube'], AY, (0, 2.39, -0.3), sy=1.32), M_gold)
    if not lo:
        for i in range(10):
            a = TAU * i / 10
            B.obj('rivet_%d' % i, bm_uv(0.028, 6, 3, (math.cos(a) * 0.62, 2.41, -0.3 - math.sin(a) * 0.62 * 1.32)), chrome())
    # legs over the wheels: a muscled upper limb, a lower limb, a padded paw with toes and curved gold claws
    for sx in (1, -1):
        for sz in (1, -1):
            tag = '%d_%d' % (sx > 0, sz > 0)
            if sz > 0: P = [(sx * 0.6, 1.72, 1.2), (sx * 0.92, 1.5, 1.4), (sx * 1.04, 1.28, 1.6), (sx * 1.08, 1.12, 1.74)]; R = [0.34, 0.28, 0.2, 0.17]
            else: P = [(sx * 0.62, 1.7, -1.35), (sx * 0.98, 1.5, -1.2), (sx * 1.06, 1.28, -1.48), (sx * 1.08, 1.12, -1.72)]; R = [0.4, 0.3, 0.2, 0.17]
            path = catmull(P, B.pick(8, 4)); rr = [catmull_at([(r,) for r in R], i / (len(path) - 1))[0] for i in range(len(path))]
            leg = B.obj('leg_' + tag, bm_tube(path, rr, B.pick(10, 6)), M_hide)
            B.vcol(leg, lambda x, y, z: hide_col(0.35 + 0.5 * sstep((y - 1.2) / 0.5)))
            pc = (sx * 1.08, 1.04, sz * 1.75 + 0.04)
            B.obj('paw_' + tag, bm_ellipsoid(0.3, 0.15, 0.34, B.pick(12, 8), B.pick(6, 4), pc), M_dark)
            toes = (-0.15, 0.0, 0.15) if not lo else (-0.12, 0.12)
            for k, dx in enumerate(toes):
                if not lo: B.obj('toe_%s_%d' % (tag, k), bm_ellipsoid(0.075, 0.07, 0.12, 7, 3, (pc[0] + dx, 1.0, pc[2] + 0.26)), M_dark)
                tip = (pc[0] + dx * 1.1, 0.9, pc[2] + 0.5)
                B.obj('claw_%s_%d' % (tag, k), curved_tube([(pc[0] + dx, 1.0, pc[2] + 0.3), (pc[0] + dx * 1.05, 1.0, pc[2] + 0.42), tip], 0.045, 0.0, B.pick(5, 3), B.pick(4, 3)), M_gold)
    # steering column from the wheel down to a chrome base on the chest
    B.obj('column', bm_rod((0, 2.82, 0.42), (0, 2.38, 0.6), 0.04, L['rod']), dark_chrome())
    B.obj('column_base', bm_ellipsoid(0.1, 0.06, 0.1, L['cyl_s'], 3, (0, 2.4, 0.6), phi1=math.pi / 2), chrome())

    # ======================= NECK + HEAD (part_neck at (0, 2.0, 1.6)) =======================
    NK = B.part('neck', NECK_J)
    d = norm((0, 0.95, 0.75)); NL = math.hypot(0.95, 0.75)
    n_up = (0, d[2], -d[1]); n_fr = (0, -d[2], d[1])        # perpendiculars: up/back and forward/down
    def on_neck(t, phi, out=0.0):
        """A point on the neck surface: t along it (0..1), phi around it (0 = car left, pi/2 = top), `out` offset."""
        r = 0.5 - 0.12 * t + out
        return add(add((0, 0, 0), d, t * NL), (math.cos(phi) * r, math.sin(phi) * n_up[1] * r, math.sin(phi) * n_up[2] * r))
    neckT = Tube([(0, -0.42, -0.36), (0, 0.0, 0.0), (0, 0.48, 0.37), (0, 0.95, 0.75), (0, 1.12, 1.02)], [0.56, 0.5, 0.44, 0.38, 0.34], sx=0.98, sy=1.0, top_ridge=0.04)
    nk = B.obj('neck', neckT.mesh(B.pick(24, 10), B.pick(12, 7)), M_hide, parent=NK)
    B.vcol(nk, lambda x, y, z: hide_col(neckT.elev(x, y, z)))
    # throat plates: gold scutes down the front of the neck
    nplates = B.pick(7, 3)
    for k in range(nplates):
        b0 = 0.2 + 0.7 * k / nplates; b1 = b0 + 0.7 / nplates + 0.012
        B.obj('throat_%d' % k, bump_patch(neckT.F, -math.pi / 2 - 0.95, -math.pi / 2 + 0.95, b1, b0, B.pick(8, 4), B.pick(3, 2), 0.04), M_goldp, parent=NK)
    for k, (b, h) in enumerate(((0.3, 0.27), (0.52, 0.24), (0.74, 0.2)) if not lo else ((0.42, 0.25),)):
        B.obj('neck_spine_%d' % k, spine_bm(neckT.p(math.pi / 2, b, -0.01), neckT.n(math.pi / 2, b), tuple(-c for c in neckT.t(b)), h, h * 0.36, B.pick(6, 3), B.pick(6, 4)), M_goldp, parent=NK)
    # the gentleman's collar and bow tie
    B.obj('collar', bm_torus(0.5 - 0.12 * 0.14 + 0.012, 0.035, L['torus'], L['tube'], aim(d), add((0, 0, 0), d, 0.14 * NL)), chrome(), parent=NK)
    bow_at = on_neck(0.2, -math.pi / 2, 0.035); bow_M = rot(pitch=math.atan2(-n_fr[1], n_fr[2]))
    for s in (1, -1):
        bow = [(0.03 * s, 0.0), (0.16 * s, 0.13), (0.3 * s, 0.1), (0.31 * s, -0.1), (0.16 * s, -0.13)]
        out_ = [(x + 0.0, y) for x, y in catmull(bow, B.pick(14, 7), closed=True)]
        if s < 0: out_ = out_[::-1]
        b = B.obj('bow_%d' % (s > 0), bm_puffy(out_, lambda p: 0.045, 0.06, B.pick(5, 3), centre=(0.16 * s, 0.0), at=bow_at, M=bow_M), M_gold, parent=NK)
    B.obj('bow_knot', bm_ellipsoid(0.07, 0.08, 0.07, B.pick(12, 8), B.pick(6, 4), bow_at, bow_M), chrome(), parent=NK)
    # ---- the head, authored head-local then placed at (0, 1.15, 1.05) with a slight nose-down pitch ----
    HEAD_AT, HEAD_M = (0, 1.15, 1.05), rot(pitch=0.12)
    def h2n(p):
        v = Matrix.Translation(E(*HEAD_AT)) @ HEAD_M @ E(*p); return (v.x, v.z, -v.y)
    def head(name, bm, m, **kw): return B.obj(name, place(bm, HEAD_AT, HEAD_M), m, parent=NK, **kw)
    hz = lambda v: (HZ[0] + HZ[-1]) / 2 - (HZ[-1] - HZ[0]) / 2 * math.cos(math.pi * v)
    skull = head('skull', bm_surf(B.pick(28, 12), B.pick(18, 9), lambda u, v: head_p(TAU * u, hz(v)), wrap_u=True, merge=True), M_hide)
    B.vcol(skull, lambda x, y, z: hide_col(max(-1.0, min(1.0, (y - 1.17) / 0.32))))
    head('palate', bm_ellipsoid(0.27, 0.05, 0.5, B.pick(14, 8), 3, (0, -0.27, 0.6), phi0=math.pi / 2), mat('mouth_dark', '#3a0a0a', rough=0.5))
    # ---- the lower jaw (part_jaw, hinged under the cheeks): a lofted jaw, gold chin plates, a glowing ember mouth ----
    JH = (0, -0.22, 0.1); jn = h2n(JH)
    JAW = B.part('jaw', add(NECK_J, jn))
    def jaw(name, bm, m, **kw): return B.obj(name, shift(place(bm, HEAD_AT, HEAD_M), jn), m, parent=JAW, **kw)
    JZ, JW, JT, JB = [-0.05, 0.1, 0.4, 0.75, 1.02, 1.14], [0.0, 0.33, 0.31, 0.26, 0.2, 0.0], [-0.26, -0.26, -0.27, -0.27, -0.26, -0.3], [-0.3, -0.4, -0.45, -0.42, -0.37, -0.32]
    def jaw_p(a, z):
        w = max(0.0, hermite(JZ, JW, z)); yt, yb = hermite(JZ, JT, z), hermite(JZ, JB, z); end = max(0.0, min(1.0, (z - JZ[0]) / 0.05, (JZ[-1] - z) / 0.05)); yc, hh = (yt + yb) / 2, max(0.0, (yt - yb) / 2) * end ** 0.5
        ca, sa = math.cos(a), math.sin(a); e = 2 / (4.0 if sa > 0 else 2.4)
        return (math.copysign(abs(ca) ** e, ca) * w, yc + math.copysign(abs(sa) ** e, sa) * hh, z)
    jz = lambda v: (JZ[0] + JZ[-1]) / 2 - (JZ[-1] - JZ[0]) / 2 * math.cos(math.pi * v)
    jm = jaw('jaw', bm_surf(B.pick(22, 10), B.pick(10, 6), lambda u, v: jaw_p(TAU * u, jz(v)), wrap_u=True, merge=True), M_hide)
    B.vcol(jm, lambda x, y, z: hide_col(0.1))
    if not lo:
        def jaw_F(a, z):
            e = 1e-3; p = jaw_p(a, z); t1 = sub(jaw_p(a + e, z), jaw_p(a - e, z)); t2 = sub(jaw_p(a, z + e), jaw_p(a, z - e))
            n = norm(cross(t1, t2))
            if n[1] > 0: n = tuple(-c for c in n)
            return p, n
        for k in range(4):
            z0 = 0.15 + 0.2 * k
            jaw('chin_plate_%d' % k, bump_patch(jaw_F, 1.5 * math.pi - 0.9, 1.5 * math.pi + 0.9, z0, z0 + 0.21, 6, 2, 0.03), M_goldp)
    jaw('tongue', bm_ellipsoid(0.2, 0.04, 0.42, B.pick(14, 8), 3, (0, -0.26, 0.6), phi1=math.pi / 2), mat('mouth_red', '#5a0e0a', rough=0.4))
    jaw('ember_core', bm_ellipsoid(0.13, 0.03, 0.26, B.pick(12, 6), 3, (0, -0.24, 0.55), phi1=math.pi / 2), led('#ff7a1a', 4.0))
    for s in (1, -1):   # underbite tusks poking up past the lip
        jaw('tusk_%d' % (s > 0), curved_tube([(s * 0.2, -0.28, 0.98), (s * 0.22, -0.18, 0.99), (s * 0.235, -0.1, 0.95)], 0.042, 0.0, B.pick(8, 5), B.pick(5, 3)), M_tooth)
    if not lo:
        for k in range(4):
            a = (k / 3 - 0.5) * 1.0
            jaw('ltooth_%d' % k, cone(0.028, 0.08, (math.sin(a) * 0.24, -0.27, 0.55 + math.cos(a) * 0.32), (0, 1, 0), 6), M_tooth)
    B.light(*add(NECK_J, h2n((0, -0.2, 0.7))), 0.7, '#ff7a1a', led=1)
    for s in (1, -1):
        sk = s > 0
        # orange cartoon eyes in sockets, with hooded angry lids and a heavy ridged brow
        ep = (s * 0.33, 0.21, 0.36)
        B.eye(h2n(ep), 0.145, '#c84a1a', look=(s * 0.4, 0), parent=NK, name='eye_%d' % sk)
        head('lid_%d' % sk, bm_ellipsoid(0.158, 0.158, 0.158, B.pick(14, 8), B.pick(4, 3), ep, aim((-s * 0.35, 0.8, -0.35)), phi1=math.pi * 0.5), M_hide)
        brow = [(s * 0.13, 0.36, 0.5), (s * 0.27, 0.4, 0.44), (s * 0.4, 0.4, 0.33), (s * 0.48, 0.34, 0.18)]
        head('brow_%d' % sk, bm_tube(catmull(brow, B.pick(9, 4)), [0.05, 0.075, 0.08, 0.075, 0.07, 0.06, 0.05, 0.04, 0.03][:B.pick(9, 4)] if not lo else [0.05, 0.075, 0.06, 0.035], B.pick(6, 5)), M_dark)
        # horns: cream, ridged, sweeping back and out with a gold tip
        hp = [(s * 0.36, 0.3, -0.12), (s * 0.5, 0.52, -0.32), (s * 0.66, 0.68, -0.62), (s * 0.7, 0.8, -0.95)]
        head('horn_%d' % sk, curved_tube(hp, 0.115, 0.0, B.pick(10, 6), B.pick(14, 5), taper=1.1, ridges=B.pick(6, 0), ridge_h=0.18), M_horn)
        head('horn_tip_%d' % sk, curved_tube([hp[3], (s * 0.71, 0.84, -1.07), (s * 0.68, 0.9, -1.16)], 0.025, 0.0, B.pick(8, 4), B.pick(4, 3)), M_gold)
        # cheek spikes sweeping back from the jaw hinge, and a little membrane ear frill
        head('cheek_spike_%d' % sk, curved_tube([(s * 0.4, -0.08, -0.05), (s * 0.55, -0.1, -0.3), (s * 0.64, -0.06, -0.55)], 0.07, 0.0, B.pick(8, 4), B.pick(6, 3)), M_horn)
        if not lo:
            fr0 = (s * 0.4, 0.12, -0.2)
            rays = [(s * 0.62, 0.42, -0.45), (s * 0.72, 0.24, -0.55), (s * 0.7, 0.06, -0.5)]
            for k, r_ in enumerate(rays): head('frill_ray_%d_%d' % (sk, k), curved_tube([fr0, lerp3(fr0, r_, 0.5), r_], 0.025, 0.006, 4, 3), M_dark)
            def frill(u, v, fr0=fr0, rays=rays):
                q = rays[0] if v < 0.5 else rays[1]; q2 = rays[1] if v < 0.5 else rays[2]; t = (v * 2) % 1.0 if v < 1 else 1.0
                tip = lerp3(q, q2, t); tip = lerp3(tip, fr0, 0.18 * math.sin(math.pi * t))
                return lerp3(fr0, tip, u)
            for fl in (False, True):
                fm = head('frill_%d%s' % (sk, 'b' if fl else ''), bm_surf(5, 8, frill, flip=fl if s > 0 else not fl), M_wing)
                B.vcol(fm, lambda x, y, z: (0.5, 0.2, 0.9))
        # flared nostrils with a glowing bore (+ game lights at them)
        npos = (s * 0.13, 0.11, 1.08)
        head('nostril_rim_%d' % sk, bm_torus(0.05, 0.022, B.pick(10, 6), B.pick(4, 3), aim((s * 0.35, 0.7, 0.6)), npos), M_hide)
        head('nostril_%d' % sk, bm_ellipsoid(0.036, 0.03, 0.036, 8, B.pick(4, 3), npos, aim((s * 0.35, 0.7, 0.6))), M_nostril)
        px, py, pz = h2n((s * 0.12, 0.05, 1.14))
        B.light(px, py + 2.0, pz + 1.6, 0.5, '#ff6a1a', led=1)
        # upper fangs hanging over the lip, and (showroom) a dandy's curled barbel moustache
        head('fang_%d' % sk, curved_tube([(s * 0.22, -0.22, 0.92), (s * 0.22, -0.32, 0.93), (s * 0.21, -0.39, 0.9)], 0.04, 0.0, B.pick(8, 5), B.pick(5, 3)), M_tooth)
        if not lo:
            for k in range(3):
                head('tooth_%d_%d' % (sk, k), cone(0.026, 0.08, (s * (0.27 - 0.01 * k), -0.24, 0.72 - 0.17 * k), (0, -1, 0), 6), M_tooth)
            head('barbel_%d' % sk, curved_tube([(s * 0.2, -0.1, 1.02), (s * 0.38, -0.2, 0.98), (s * 0.58, -0.17, 0.88), (s * 0.66, -0.04, 0.88), (s * 0.6, 0.03, 0.95)], 0.035, 0.012, 6, 10), M_dark)
    # the monocle (right eye): chrome ring and a bead chain down the cheek
    if not lo:
        head('monocle', bm_torus(0.19, 0.02, L['torus'], L['tube'], AZ, (-0.34, 0.21, 0.52)), chrome())
        for i in range(5):
            t = i / 4
            head('chain_%d' % i, bm_uv(0.018, 5, 3, (-0.36 - 0.1 * t, 0.02 - 0.3 * t, 0.52 - 0.1 * t - 0.12 * math.sin(math.pi * t))), chrome())
    # the top hat, tilted jauntily between the horns, with a gold band
    hat = bm_lathe([(0, 0), (0.36, 0), (0.37, 0.015), (0.36, 0.03), (0.26, 0.03), (0.255, 0.18), (0.27, 0.34), (0.255, 0.36), (0, 0.365)], L['cyl'])
    xf(hat, Matrix.Translation(E(0, 0.42, -0.08)) @ rot(roll=0.2, pitch=-0.1))
    head('hat', hat, M_hat)
    head('hat_band', place(bm_torus(0.262, 0.03, L['torus'], L['tube'], AY, (0, 0.09, 0)), (0, 0.42, -0.08), rot(roll=0.2, pitch=-0.1)), M_gold)

    # ======================= WINGS (part_wingL / part_wingR at (±0.75, 2.1, 0.1)) =======================
    for s in (1, -1):
        name = 'wingL' if s > 0 else 'wingR'
        W_ = B.part(name, (s * 0.75, 2.1, 0.1))
        R0, EL, WR = (0, 0, 0.05), (s * 0.66, 0.5, 0.22), (s * 1.16, 1.0, -0.02)
        TIPS = [(s * 1.78, 1.72, -0.42), (s * 1.98, 1.12, -0.95), (s * 1.6, 0.55, -1.32)]
        RB = (s * 0.12, -0.2, -1.18)
        def bone_c(T, u, bow=0.1):
            """A finger bone from the wrist to tip T, bowed backward a little."""
            p = lerp3(WR, T, u); return (p[0], p[1] + bow * 0.5 * math.sin(math.pi * u), p[2] - bow * math.sin(math.pi * u))
        rays = [lambda u, T=T: bone_c(T, u) for T in TIPS] + [lambda u: lerp3(WR, RB, u)]
        nu, nv = B.pick(8, 4), B.pick(6, 3)
        def fan(i):
            A, Bn = rays[i], rays[i + 1]; sc = 0.24 if i < 2 else 0.2
            def fn(u, v):
                p = lerp3(A(u), Bn(u), v); k = 1 - sc * math.sin(math.pi * v) * u ** 2.5
                p = lerp3(WR, p, k)
                return (p[0], p[1] + 0.07 * math.sin(math.pi * v) * math.sin(math.pi * u), p[2])
            return fn
        arm_pts = catmull([R0, EL, WR], 12)
        def inner(u, v):   # between the arm (u = 0) and the body attachment RB (u = 1)
            a = catmull_at([R0, EL, WR], v); p = lerp3(a, RB, u)
            return (p[0], p[1] + 0.06 * math.sin(math.pi * u) * math.sin(math.pi * v), p[2])
        segs = [(TIPS[0], TIPS[1]), (TIPS[1], TIPS[2]), (TIPS[2], RB)]
        bones = [(WR, T) for T in TIPS] + [(R0, EL), (EL, WR)]
        def mem_col(x, y, z):
            dmin = 9.0
            for a, b in bones:
                ab = sub(b, a); t = max(0.0, min(1.0, dot(sub((x, y, z), a), ab) / max(1e-6, dot(ab, ab))))
                q = add(a, ab, t); dmin = min(dmin, math.sqrt(dot(sub((x, y, z), q), sub((x, y, z), q))))
            t = sstep(dmin / 0.42); dark, light = (0.36, 0.12, 0.82), (1.0, 0.5, 0.8)
            return tuple(dark[i] + (light[i] - dark[i]) * t for i in range(3))
        pieces = [(fan(i), nu, nv) for i in range(3)] + [(inner, B.pick(5, 2), B.pick(8, 4))]
        for k, (fn, a_, b_) in enumerate(pieces):
            for side, fl in (('', s < 0), ('_b', s > 0)):
                mb = B.obj('%s_membrane%d%s' % (name, k, side), bm_surf(a_, b_, fn, flip=fl), M_wing, parent=W_)
                B.vcol(mb, mem_col)
        # the bones: the arm (shoulder, elbow, wrist), three fingers, knuckles, a thumb claw and claw tips
        arm = B.obj(name + '_arm', bm_tube(arm_pts, [0.13 - 0.06 * i / 11 for i in range(12)], B.pick(10, 5)), M_dark, parent=W_)
        B.obj(name + '_elbow', bm_uv(0.1, B.pick(12, 6), B.pick(7, 4), EL), M_dark, parent=W_)
        B.obj(name + '_wrist', bm_uv(0.085, B.pick(12, 6), B.pick(7, 4), WR), M_dark, parent=W_)
        B.obj(name + '_thumb', curved_tube([WR, add(WR, (s * 0.08, 0.14, 0.12)), add(WR, (s * 0.06, 0.26, 0.2))], 0.05, 0.0, B.pick(8, 4), B.pick(5, 3)), M_gold, parent=W_)
        for k, T in enumerate(TIPS):
            nb_ = B.pick(8, 4); pts = [bone_c(T, i / (nb_ - 1)) for i in range(nb_)]
            B.obj('%s_finger_%d' % (name, k), bm_tube(pts, [0.06 - 0.035 * i / (nb_ - 1) for i in range(nb_)], B.pick(6, 4)), M_dark, parent=W_)
            dirn = norm(sub(T, bone_c(T, 0.9)))
            B.obj('%s_fclaw_%d' % (name, k), cone(0.03, 0.15, add(T, dirn, -0.02), dirn, B.pick(7, 4)), M_gold, parent=W_)

    # ======================= TAIL (part_tail at (0, 1.45, -2.25)) =======================
    T = B.part('tail', TAIL_J)
    P = [(0, 0, 0.05), (0, -0.12, -0.6), (0, -0.2, -1.2), (0, -0.05, -1.7), (0, 0.12, -2.1)]
    TP = B.part('tailTip', add(TAIL_J, P[2]))
    tailT = Tube([(0, 0.06, 0.45)] + P + [(0, 0.14, -2.3)], [0.46, 0.42, 0.33, 0.23, 0.14, 0.07, 0.04], top_ridge=0.06)
    bs = 1 / 6; b2 = bs * 3          # tube parameter at P[2] (the tip joint)
    t0 = B.obj('tail_root', tailT.mesh(B.pick(20, 10), B.pick(10, 5), 0.0, b2 + 0.02), M_hide, parent=T)
    t1 = B.obj('tail_end', shift(tailT.mesh(B.pick(14, 8), B.pick(12, 5), b2 - 0.02, 1.0), P[2]), M_hide, parent=TP)
    B.vcol(t0, lambda x, y, z: hide_col(tailT.elev(x, y, z)))
    B.vcol(t1, lambda x, y, z: hide_col(tailT.elev(x + P[2][0], y + P[2][1], z + P[2][2])))
    B.obj('tail_band', bm_torus(tailT.r(b2) + 0.012, 0.035, L['torus'], L['tube'], aim(tailT.t(b2)), P[2]), M_gold, parent=T)
    def put(b, n, bm, m):
        if b < b2: return B.obj(n, bm, m, parent=T)
        return B.obj(n, shift(bm, P[2]), m, parent=TP)
    for k, b in enumerate((0.22, 0.32, 0.42, 0.56, 0.67, 0.78, 0.88) if not lo else (0.3, 0.6, 0.8)):
        h = 0.3 * (1 - b) + 0.08
        put(b, 'tail_spine_%d' % k, spine_bm(tailT.p(math.pi / 2, b, -0.01), tailT.n(math.pi / 2, b), tuple(-c for c in tailT.t(b)), h, h * 0.36, B.pick(5, 3), B.pick(6, 4)), M_goldp)
    if not lo:
        for k in range(9):
            b0 = 0.12 + 0.08 * k; b1 = b0 + 0.085
            if b0 < b2 < b1: continue
            put(b0, 'tail_plate_%d' % k, bump_patch(tailT.F, -math.pi / 2 - 0.9, -math.pi / 2 + 0.9, b0, b1, 6, 2, 0.03), M_goldp)
    # the gold spade: a puffy heart turned to point backward, with a glowing green gem
    k = 0.021
    spade = [(hy * k, hx * k) for hx, hy in [(16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) for t in (TAU * i / B.pick(28, 12) for i in range(B.pick(28, 12)))]]
    def tip(name, bm, m, **kw): return B.obj(name, shift(bm, P[2]), m, parent=TP, **kw)
    sp = tip('spade', bm_profile(spade, 0.06, (0, 0.14, -2.3), rot(yaw=-math.pi / 2)), M_goldp)
    B.bevel(sp, 0.028, angle=True, segments=B.pick(3, 1), profile=0.6)
    for sx in (1, -1): tip('spade_gem_%d' % (sx > 0), bm_ellipsoid(0.05, 0.07, 0.05, B.pick(10, 6), B.pick(4, 2), (sx * 0.04, 0.16, -2.32), aim((sx, 0, 0)), phi1=math.pi / 2), ledg)

    # ======================= lights, wheels, seat, info =======================
    B.light(0, 3.2, 2.7, 1.6, '#ff7a2a', big=1)
    B.wheels_pro(1.08, 1.75, -1.75, r=0.5, w=0.42, rim=COL2, tyre='#141a14', cap=LIGHT, stripe=LIGHT)
    B.seat_round(0, 2.5, -0.25, col='#5a2a8a', accent=LIGHT, wheelY=2.86, wheelZ=0.4, column=False)
    B.info(5.6, 3.4, 3.8, muzzle=(0, 3.0, 3.1), wheelR=0.5)
    ORG = ('trunk', 'leg_', 'paw_', 'toe_', 'claw_', 'spine_', 'chest_plate', 'neck', 'throat_', 'skull', 'jaw', 'chin_plate', 'tusk', 'ltooth', 'lid_',
           'brow_', 'horn_', 'cheek_spike', 'frill', 'nostril_rim', 'fang_', 'tooth_', 'barbel', 'wingL_', 'wingR_', 'tail_root', 'tail_end', 'tail_spine', 'tail_plate')
    keep_soft(B, *[o for o in B.objs if o.type == 'MESH' and o.name.startswith(ORG)])
    B.body['rigV'] = 2
    if not lo: print('sir_scorchalot JAW_J', tuple(round(c, 4) for c in add(NECK_J, jn)))

LEVEL_OV = {'hi': dict(bevel=3, cyl=24, torus=16, tube=4, arch=16, sph=12, ring=8), 'lo': dict(torus=8, tube=3, arch=8, cyl=10, cyl_s=6, rod=5, sph=8, ring=5)}
if __name__ == '__main__':
    run('sir_scorchalot', build, report=True, views=['side', 'high'], level_overrides=LEVEL_OV)
