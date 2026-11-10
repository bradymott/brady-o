# Jelly Jolt (Art Cart car #10): a floating jellyfish full of static and bad intentions. Quality-bar rebuild.
# A candy-glass violet bell (a soft emissive glow, its translucency faked in the vertex colours: bright pink-white at the
# rim, deep violet at the crown, light streaks between the ribs) with glowing pink ribs, a cyan rim ring and a ruffled
# curtain of oral arms, hovering over a sculpted clear-coat violet pod (chrome tube bumpers, cyan under-glow, premium
# wheels) on two chrome emitter struts above a Tesla coil. Four two-jointed tentacles trail beneath it; static bolts
# crackle out from its glowing core.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/jelly_jolt.py', run_name='__main__')
# Writes assets/models/art-cart/jelly_jolt.glb (showroom, <= 30k tris) and jelly_jolt_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['jelly:2'] in src/43_cart_bb_glb.js):
#   part_bell                 dome, inner glow, ribs, rim, oral arms, crown and spire; joint BELL_AT (the rim centre):
#                             it pulses (a quick contraction, a slow relax)
#   part_zap                  the static bolts around the core and the rim, joint at the core: they flicker on and off
#                             and jump to new places (and ride the pulse)
#   part_tent<i>a / tent<i>b  four tentacles in two segments, joints at the root and the knee: they sway, trail back
#                             with speed, and the lower segment lags behind the upper (and they ride the pulse)
# body extras: rigV = 2, extra.sight = the bell's crown (the chase camera rises just enough to see over it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, RIB = '#c86aff', '#5af2ff', '#5af2ff', '#ff9af0'   # CART_CARS.jelly palette + the rib pink
BELL_AT = (0, 2.1, 0.45)                                            # lowered 0.25 m from the procedural car (chase camera)
BELL_PROFILE = [(1.55, 0), (1.6, 0.18), (1.45, 0.75), (1.05, 1.25), (0.55, 1.52), (0, 1.6)]
CORE_Y = 0.72                                                       # the core's height in the bell
TENT_R, TENT_Y = 1.22, 2.2                                          # tentacle roots: radius around the bell axis, height
TENT_A = [math.radians(a) for a in (40, 140, 220, 320)]             # around the bell (0 = forward); none over the seat
SEG1, SEG2 = 0.56, 0.5                                              # upper and lower tentacle segment lengths
POD_W, POD_H, POD_Y, POD_R = 2.14, 0.44, 0.6, 0.17                  # the pod: width, height, centre height, corner radius

def crom(P, s):
    """Catmull-Rom point on the polyline P (tuples) at parameter s in 0..len(P)-1."""
    k = min(len(P) - 2, max(0, int(math.floor(s)))); t = s - k
    p0 = P[max(k - 1, 0)]; p1 = P[k]; p2 = P[k + 1]; p3 = P[min(k + 2, len(P) - 1)]
    t2 = t * t; t3 = t2 * t
    return Vector(tuple(0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3) for i in range(len(p1))))
def dome(t, prof=BELL_PROFILE):
    """(radius, height) on the smooth bell profile at t in 0..1, plus the outward normal (nr, nh)."""
    n = len(prof) - 1; s = t * n
    r, h = crom(prof, s); r2, h2 = crom(prof, min(n, s + 0.005)); r1, h1 = crom(prof, max(0, s - 0.005))
    dr, dh = r2 - r1, h2 - h1; L = math.hypot(dr, dh) or 1.0
    return r, h, dh / L, -dr / L
def resample(prof, rows):
    out = []
    for i in range(rows + 1):
        r, h, _, _ = dome(i / rows, prof); out.append((max(0.0, r), h))
    out[-1] = (0.0, prof[-1][1]) if prof[-1][0] <= 1e-6 else out[-1]
    return out
def scallop(h): return 0.08 * max(0.0, 1 - h / 0.45) ** 1.5
def frac(i, k=0.6180339887): return (i * k + 0.137) % 1.0
def pod_ring(z, w, h, r, seg, yc=POD_Y):
    return [(x, yc + y, z) for x, y in rrect_pts(w, h, r, seg)]
def bolt(p0, d, n, amp, seed):
    """A jagged lightning bolt from p0 along d (engine vectors): n kinks, sideways jitter `amp`."""
    p0 = Vector(p0); d = Vector(d); L = d.length; t = d.normalized(); u, v = perp_basis(tuple(t)); pts = [tuple(p0)]
    for k in range(1, n + 1):
        f = k / n; j = amp * (1 - f * 0.5) if k < n else 0.0
        q = p0 + d * f + u * ((frac(seed * 7 + k, 0.31) - 0.5) * 2 * j) + v * ((frac(seed * 3 + k, 0.53) - 0.5) * 2 * j)
        pts.append(tuple(q))
    return pts
def candy(x, y, z):
    """The bell's candy-glass colour (bell-local): glowing pink-white at the rim, violet through the middle, deep at the
    crown, lighter streaks halfway between the eight ribs (light passing through the thinner jelly)."""
    r = math.hypot(x, z); t = sstep(y / 1.5); a = math.atan2(x, z)
    streak = 0.5 + 0.5 * math.cos(a * 8 + math.pi)       # 1 halfway between ribs
    rim = (1.0, 0.86, 1.0); mid = (0.84, 0.6, 1.0); top = (0.58, 0.4, 0.96)
    c = [rim[i] + (mid[i] - rim[i]) * sstep(t / 0.55) for i in range(3)]
    c = [c[i] + (top[i] - c[i]) * sstep((t - 0.45) / 0.55) for i in range(3)]
    k = 1 + 0.12 * streak * (1 - t)
    return tuple(min(1.0, v * k) for v in c)
def pod_paint(x, y, z):
    """The pod's clear-coat violet: lighter along the shoulders, deep toward the sill, a little lift at nose and tail."""
    t = sstep((y - 0.4) / 0.45); e = 0.08 * sstep((abs(z) - 1.5) / 0.6)
    k = 0.7 + 0.42 * t + e
    return (k * 0.98, k * 0.9, k * 1.05)

def build(B):
    L = B.L; lo = B.lo; body = B.body
    B.export_try = VCOL_EXPORT
    M_pod = paint('pod_violet', '#5a2a9a', coat=1.0, rough=0.18, metal=0.3)
    M_sill = paint('pod_sill', '#140c22', coat=1.0, rough=0.22, metal=0.2)
    M_deck = matte('pod_deck', '#120c1c', 0.85)
    M_bell = glow('bell_candy', '#d890ff', strength=0.85, rough=0.1, coat=1.0)
    M_bell_in = glow('bell_inner', '#f0c8ff', strength=1.1, rough=0.3, coat=0.6)
    M_rib = glow('rib_pink', RIB, strength=1.8, rough=0.2)
    M_core = glow('core_white', '#fff2ff', strength=3.0, rough=0.2)
    M_tv = glow('tent_violet', COL, strength=1.3, rough=0.15, coat=1.0)
    M_tp = glow('tent_pink', RIB, strength=1.3, rough=0.15, coat=1.0)
    M_frill = glow('frill', '#ffc8f4', strength=1.2, rough=0.2, coat=1.0)
    M_coil = metal('coil_copper', '#e0a868', 0.15)
    led_c, led_p, led_w = led(COL2), led(RIB), led('#ffffff')
    M_bolt = led('#c8fbff', 4.0)

    # ================= the pod (body bone): a lofted rounded hull, two-tone, chrome flares, bumpers, under-glow =================
    cs = B.pick(5, 2)
    rings = [pod_ring(2.2, 1.6, 0.26, 0.12, cs), pod_ring(2.14, 1.92, 0.36, 0.15, cs), pod_ring(2.0, POD_W, POD_H, POD_R, cs)]
    if not lo: rings += [pod_ring(0.0, POD_W + 0.04, POD_H, POD_R, cs)]
    rings += [pod_ring(-2.0, POD_W, POD_H, POD_R, cs), pod_ring(-2.14, 1.92, 0.36, 0.15, cs), pod_ring(-2.2, 1.6, 0.26, 0.12, cs)]
    pod = B.obj('pod', bm_loft(rings, closed_u=True, caps=True), [M_pod, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < POD_Y - 0.08 else 0)
    B.vcol(pod, pod_paint)
    for i, (x, z) in enumerate([(0.95, 1.55), (-0.95, 1.55), (0.95, -1.55), (-0.95, -1.55)]):
        B.cut([pod], bm_cyl(0.55, 0.55, 0.8, L['arch'], AX, (x * 1.12, 0.42, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.565, 0.032, B.pick(20, 10), B.pick(4, 3), AX, (math.copysign(POD_W / 2 + 0.01, x), 0.42, z), sweep=(math.pi / 2, 3 * math.pi / 2)), chrome())
    B.obj('deck', bm_box(1.86, 0.025, 3.7, (0, POD_Y + POD_H / 2 + 0.005, 0)), M_deck)
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 0.9, 0.835, 2.1), (s * 1.06, 0.84, 1.4), (s * 1.06, 0.84, -1.4), (s * 0.9, 0.835, -2.1)], B.pick(12, 4)), 0.02, B.pick(6, 4)), chrome())
        B.strip((s * 0.9, 0.36, 1.8), (s * 0.9, 0.36, -1.8), COL2, th=0.045)
        B.light(s * 0.9, 0.25, 0.0, 2.2, COL2, led=1)
        n = B.pick(8, 4)
        for i in range(n):
            t = i / (n - 1); c = [COL2, RIB][i % 2]; p = (s * (POD_W / 2 + 0.012), POD_Y + 0.02, 0.95 + (-0.95 - 0.95) * t)
            B.obj('row%d_%d' % (s > 0, i), bm_ico(0.05, 1, p), led(c))
            if i % 3 == 0: B.light(p[0], p[1], p[2], 0.45, c, led=1)
    B.strip((-0.75, 0.36, 2.15), (0.75, 0.36, 2.15), COL2, th=0.045); B.strip((-0.75, 0.36, -2.15), (0.75, 0.36, -2.15), COL2, th=0.045)
    for zs, zc in ((1, 2.32), (-1, -2.32)):
        path = catmull([(1.1, 0.48, zc - zs * 0.5), (1.0, 0.48, zc - zs * 0.12), (0.6, 0.48, zc), (-0.6, 0.48, zc), (-1.0, 0.48, zc - zs * 0.12), (-1.1, 0.48, zc - zs * 0.5)], B.pick(14, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.055, B.pick(8, 6)), chrome())
    # headlights in chrome bezels on the nose; tail lamps in chrome rings
    for s in (1, -1):
        hx = s * 0.62
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.12, 0.022, B.pick(14, 6), 3, AZ, (hx, 0.68, 2.2)), chrome())
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.1, 0.03, 0.1, B.pick(12, 6), B.pick(3, 2), (hx, 0.68, 2.195), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.68, 2.3, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.32, 0.11, 0.05, 0.013, B.pick(2, 1), B.pick(4, 3), at=(s * 0.62, 0.66, -2.205), axis=AZn), chrome())
        B.obj('tail_%d' % (s > 0), bm_box(0.28, 0.07, 0.04, (s * 0.62, 0.66, -2.2)), led('#ff1a2a'))
        B.light(s * 0.62, 0.66, -2.32, 0.9, '#ff2a3a', tail=1)
    # the two chrome struts that hold the bell's field, with cyan emitters on top
    for s in (1, -1):
        B.obj('strut_foot_%d' % (s > 0), bm_closed_lathe([(0, 0.0), (0.17, 0.0), (0.16, 0.05), (0.1, 0.1), (0.0, 0.1)], L['cyl_s'], AY, (s * 0.6, 0.83, 0.55)), dark_chrome())
        B.obj('strut_%d' % (s > 0), bm_rod((s * 0.6, 0.86, 0.55), (s * 0.47, 1.78, 0.47), 0.055, L['cyl_s'], r1=0.045), chrome())
        if not lo: B.obj('strut_band_%d' % (s > 0), bm_torus(0.058, 0.016, 12, 4, AY, (s * 0.555, 1.2, 0.52)), led_c)
        B.obj('strut_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.04), (0.05, -0.04), (0.11, 0.06), (0.09, 0.07), (0.0, 0.02)], L['cyl_s'], AY, (s * 0.47, 1.8, 0.47)), dark_chrome())
        B.obj('strut_emit_%d' % (s > 0), bm_uv(0.08, B.pick(14, 8), B.pick(7, 4), (s * 0.47, 1.88, 0.47)), led_c)
        B.light(s * 0.47, 1.9, 0.47, 0.6, COL2, led=1)
    # Tesla coil base: dark chrome drum, copper core with chrome windings, a crackling ball
    B.obj('coil_drum', bm_closed_lathe([(0, 0.0), (0.36, 0.0), (0.37, 0.04), (0.32, 0.16), (0.0, 0.16)], L['cyl'], AY, (0, 0.83, 0.5)), dark_chrome())
    B.obj('coil_ring', bm_torus(0.33, 0.02, B.pick(24, 10), 3, AY, (0, 0.99, 0.5)), led_c)
    B.obj('coil_core', bm_cyl(0.15, 0.13, 0.42, L['cyl_s'], AY, (0, 1.2, 0.5)), M_coil)
    for k in range(B.pick(5, 2)):
        B.obj('coil_wind_%d' % k, bm_torus(0.155, 0.014, 12, 3, AY, (0, 1.04 + k * 0.08, 0.5)), chrome())
    B.obj('coil_ball', bm_uv(0.11, B.pick(14, 8), B.pick(7, 4), (0, 1.5, 0.5)), led_c)
    B.light(0, 1.52, 0.5, 0.7, COL2, led=1)

    # ================= the bell (part `bell`, pulses) =================
    P = B.part('bell', BELL_AT)
    rows = B.pick(16, 6); seg = B.pick(56, 20)
    prof_out = resample(BELL_PROFILE, rows)
    def rmod_out(th, t):
        h = prof_out[min(rows, int(round(t * rows)))][1]
        return 1 + scallop(h) * math.sin(th * 10)
    d = B.obj('bell_dome', bm_lathe(prof_out, seg, rmod=rmod_out, caps=False), M_bell, parent=P); B.vcol(d, candy)
    prof_in = resample([(1.55, 0), (1.56, 0.18), (1.4, 0.72), (1.0, 1.2), (0.5, 1.44), (0, 1.5)], B.pick(9, 4))
    nin = len(prof_in) - 1
    def rmod_in(th, t):
        h = prof_in[min(nin, int(round(t * nin)))][1]
        return 1 + scallop(h) * math.sin(th * 10)
    di = B.obj('bell_inner', bm_lathe(prof_in, B.pick(40, 16), rmod=rmod_in, caps=False, flip=True), M_bell_in, parent=P); B.vcol(di, lambda x, y, z: tuple(c * (0.75 + 0.25 * sstep(1 - y / 1.4)) for c in (1, 0.92, 1)))
    tseg = B.pick(8, 4); ring_prof = [(1.58 + 0.07 * math.cos(TAU * j / tseg), 0.1 + 0.07 * math.sin(TAU * j / tseg)) for j in range(tseg + 1)]
    B.obj('bell_ring', bm_lathe(ring_prof, seg, rmod=lambda th, t: 1 + scallop(0.1) * math.sin(th * 10), caps=False), led_c, parent=P)
    rib_pts = [dome(t) for t in [i / 400 for i in range(401)]]
    rib_pts = [(r + 0.03 * nr, h + 0.03 * nh) for r, h, nr, nh in rib_pts if 0.24 <= h <= 1.5]
    step = max(1, len(rib_pts) // B.pick(12, 6)); rib_pts = rib_pts[::step] + [rib_pts[-1]]
    for i in range(8):
        a = i / 8 * TAU; sa, ca = math.sin(a), math.cos(a)
        pts = [(sa * r, h, ca * r) for r, h in rib_pts]; n = len(pts)
        B.obj('rib_%d' % i, bm_tube(pts, [0.055 - 0.025 * k / (n - 1) for k in range(n)], B.pick(6, 4)), M_rib, parent=P)
        if not lo: B.obj('rib_bulb_%d' % i, bm_uv(0.07, 10, 6, (sa * 1.6, 0.25, ca * 1.6)), led_p, parent=P)
    # marquee dots between the ribs near the rim (the bell's "lit from inside" freckles), showroom only
    if not lo:
        for i in range(16):
            a = (i + 0.5) / 16 * TAU; r, h, nr, nh = dome(0.3 + 0.12 * (i % 2))
            B.obj('dot_%d' % i, bm_ico(0.035, 1, (math.sin(a) * (r + 0.02), h + 0.02, math.cos(a) * (r + 0.02))), led_w, parent=P)
    # the glowing core (seen from below and through the rim) and a curtain of ruffled oral arms
    B.obj('core', bm_uv(0.36, B.pick(18, 10), B.pick(10, 6), (0, CORE_Y, 0)), M_core, parent=P)
    na = B.pick(6, 4)
    for i in range(na):
        a = (i + 0.5) / na * TAU
        def arm(u, v, a=a):
            th = a + (v - 0.5) * 0.7; rr = 0.18 + 0.22 * u
            y = 0.5 - 0.62 * u
            ruffle = 0.06 * math.sin(v * TAU * 2 + u * 5) * u
            return (math.sin(th) * (rr + ruffle), y, math.cos(th) * (rr + ruffle))
        B.obj('oral_%d' % i, bm_surf(B.pick(6, 3), B.pick(6, 3), arm), M_frill, parent=P)
        B.obj('oral_b_%d' % i, bm_surf(B.pick(6, 3), B.pick(6, 3), arm, flip=True), M_frill, parent=P)
    B.obj('crown', bm_lathe([(0.46, 1.44), (0.44, 1.52), (0.3, 1.62), (0.0, 1.68)], L['cyl'], caps=False), chrome(), parent=P)
    B.obj('crown_ring', bm_torus(0.46, 0.022, B.pick(28, 12), 3, AY, (0, 1.46, 0)), led_c, parent=P)
    B.obj('spire', bm_rod((0, 1.62, 0), (0, 1.9, 0), 0.04, L['cyl_s'], r1=0.025), chrome(), parent=P)
    for k, (y, r) in enumerate(((1.7, 0.14), (1.78, 0.11), (1.85, 0.08))):
        B.obj('spire_disc_%d' % k, bm_closed_lathe([(0, -0.012), (r, -0.006), (r, 0.006), (0, 0.012)], L['cyl_s'], AY, (0, y, 0)), chrome(), parent=P)
    B.obj('spire_ball', bm_uv(0.11, B.pick(14, 8), B.pick(7, 4), (0, 1.97, 0)), led_c, parent=P)
    B.light(0, BELL_AT[1] + 0.8, BELL_AT[2], 4.0, LIGHT, big=1)

    # ================= static (part `zap`, joint at the core): bolts from the core out under the rim, sparks on the rim =================
    Z = B.part('zap', (BELL_AT[0], BELL_AT[1] + CORE_Y, BELL_AT[2]))
    nb = B.pick(7, 4)
    for i in range(nb):
        a = (i + 0.3 * frac(i)) / nb * TAU; out = Vector((math.sin(a) * 1.55, -0.62 - 0.25 * frac(i + 5, 0.47), math.cos(a) * 1.55))
        pts = bolt((0, 0, 0), tuple(out), B.pick(6, 3), 0.12, i)
        B.obj('zap_bolt_%d' % i, bm_tube(pts, 0.022, B.pick(4, 3)), M_bolt, parent=Z, smooth=False)
        if not lo:   # a fork near the tip
            q = Vector(pts[-2]); fk = bolt(tuple(q), (math.sin(a + 0.6) * 0.3, -0.2, math.cos(a + 0.6) * 0.3), 3, 0.05, i + 20)
            B.obj('zap_fork_%d' % i, bm_tube(fk, 0.014, 3), M_bolt, parent=Z, smooth=False)
    for i in range(B.pick(10, 5)):   # crackles leaping off the rim, outside the bell (the chase camera sees these)
        a = TAU * frac(i + 3, 0.71); p = Vector((math.sin(a) * 1.66, -CORE_Y + 0.12 + 0.2 * frac(i, 0.37), math.cos(a) * 1.66))
        pts = bolt(tuple(p), (math.sin(a) * 0.35, 0.12 * (frac(i, 0.83) - 0.5), math.cos(a) * 0.35), B.pick(4, 2), 0.07, i + 40)
        B.obj('zap_rim_%d' % i, bm_tube(pts, 0.016, 3), M_bolt, parent=Z, smooth=False)

    # ================= four tentacles in two segments (parts tent<i>a / tent<i>b) =================
    ts = B.pick(9, 5); tr = B.pick(5, 3)
    def seg_tube(name, y0, y1, r0, r1, wav, parent, m):
        pts = [(math.sin(k / tr * math.pi) * wav, y0 + (y1 - y0) * k / tr, 0.0) for k in range(tr + 1)]
        return B.obj(name, bm_tube(pts, [r0 + (r1 - r0) * k / tr for k in range(tr + 1)], ts), m, parent=parent)
    for i, a in enumerate(TENT_A):
        root = (math.sin(a) * TENT_R, TENT_Y, BELL_AT[2] + math.cos(a) * TENT_R)
        knee = (root[0], root[1] - SEG1, root[2])
        TA = B.part('tent%da' % i, root); TB = B.part('tent%db' % i, knee)
        seg_tube('tent%da_tube' % i, 0.05, -SEG1 - 0.03, 0.085, 0.06, 0.06, TA, M_tv)
        B.obj('tent%da_bead' % i, bm_uv(0.075, B.pick(12, 6), B.pick(6, 4), (0, -SEG1, 0)), led_c, parent=TA)
        if not lo:
            for k in range(3): B.obj('tent%da_ring_%d' % (i, k), bm_torus(0.08 - k * 0.006, 0.013, 12, 3, AY, (0.04 * math.sin((k + 1) / 4 * math.pi), -0.14 * (k + 1), 0)), led_p, parent=TA)
        seg_tube('tent%db_tube' % i, 0.0, -SEG2 + 0.05, 0.06, 0.025, -0.05, TB, M_tp)
        # a frilly tip (two-sided) and the cyan tip bulb
        frill = [(0.025, -SEG2 + 0.08), (0.05, -SEG2 + 0.02), (0.09, -SEG2 - 0.03), (0.12, -SEG2 - 0.06)]
        fseg = B.pick(14, 6); fmod = lambda th, t: 1 + 0.3 * t * math.sin(th * 6)
        B.obj('tent%db_frill' % i, bm_lathe(frill, fseg, rmod=fmod, caps=False), M_frill, parent=TB)
        if not lo: B.obj('tent%db_frill_in' % i, bm_lathe(frill, fseg, rmod=fmod, caps=False, flip=True), M_frill, parent=TB)
        B.obj('tent%db_tip' % i, bm_uv(0.06, B.pick(12, 6), B.pick(6, 4), (0, -SEG2 - 0.06, 0)), led_c, parent=TB)
        B.light(knee[0], knee[1] - SEG2, knee[2], 0.55, COL2, led=1)

    # ================= wheels, seat (behind the bell), size info =================
    B.wheels_pro(0.95, 1.55, -1.55, r=0.42, w=0.36, rim=COL2, tyre='#14121a', cap=COL2, stripe=RIB)
    # the seat rides high on a chrome-trimmed plinth at the back, so the driver's head clears the bell's rim
    B.obj('plinth', bm_box(0.62, 0.3, 0.56, (0, 0.98, -1.79)), M_pod, bevel=B.pick(0.05, None), bevel_angle=False, segments=B.pick(2, 1))
    B.obj('plinth_trim', bm_rrect_tube(0.64, 0.58, 0.06, 0.016, B.pick(2, 1), 4, at=(0, 1.13, -1.79)), chrome())
    B.seat(0, 1.5, -1.74, col='#3a1a5a', accent=COL2, wheelZ=-1.14)
    top = BELL_AT[1] + 1.62
    B.info(4.6, 3.3, BELL_AT[1] + 2.08, muzzle=(0, BELL_AT[1] + 0.3, BELL_AT[2]), wheelR=0.42, extra={'sight': [round(top, 2), BELL_AT[2]]})
    B.body['rigV'] = 2

LEVEL_OV = {'hi': dict(ico=1, bevel=3), 'lo': dict(ico=1)}
if __name__ == '__main__':
    run('jelly_jolt', build, report=True, views=['side', 'high'], level_overrides=LEVEL_OV)
