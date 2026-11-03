# Jelly Jolt (Art Cart car #10): a floating jellyfish full of static and bad intentions. A violet clear-coat bell with
# glowing pink ribs, a cyan rim ring and a white core hovers over a dark glossy platform on two chrome struts; five
# glowing tentacles hang beneath it, a Tesla spire crackles on top.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/jelly_jolt.py
# Writes assets/models/art-cart/jelly_jolt.glb (showroom, 20–30k tris) and jelly_jolt_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, RIB = '#c86aff', '#5af2ff', '#5af2ff', '#ff9af0'   # CART_CARS.jelly palette + the rib pink
BELL_AT = (0, 2.35, 0.5)
# the bell's lathe profile (radius, height) in bell-local space, same as CART_BUILD.jelly
BELL_PROFILE = [(1.55, 0), (1.6, 0.18), (1.45, 0.75), (1.05, 1.25), (0.55, 1.52), (0, 1.6)]
# the five tentacle pivots (engine coords); tentacle2 would hang through the seat so the procedural car skips it
TENTACLES = {0: (0.917, 2.3, 1.348), 1: (1.19, 2.3, 0.13), 3: (-0.917, 2.3, -0.348), 4: (-1.19, 2.3, 0.87), 5: (-0.277, 2.3, 1.72)}
# a tentacle's spine in part-local space: a gentle S wave in x, hanging 1.68 m down (the frill + tip ball finish it)
TENT_SPINE = [(0, 0, 0), (0.05, -0.3, 0.01), (0.11, -0.6, 0.0), (0.0, -0.9, -0.02), (-0.1, -1.2, 0.0), (-0.04, -1.5, 0.01), (0, -1.68, 0)]

# ---- local helpers (the kit has no swept tubes or spline sampling) ----
def crom(P, s):
    """Catmull-Rom point on the polyline P (tuples) at parameter s in 0..len(P)-1."""
    k = min(len(P) - 2, max(0, int(math.floor(s)))); t = s - k
    p0 = P[max(k - 1, 0)]; p1 = P[k]; p2 = P[k + 1]; p3 = P[min(k + 2, len(P) - 1)]
    t2 = t * t; t3 = t2 * t
    return Vector(tuple(0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3) for i in range(len(p1))))
def bm_tube(P, s0, s1, rf, tseg, rows, cap0=True, cap1=True):
    """A round tube swept along the Catmull-Rom spline through P (engine tuples) from parameter s0 to s1, radius rf(s).
    Rotation-minimising frames (parallel transport), so the tube never twists."""
    bm = bmesh.new(); rings = []; n = len(P) - 1; N = None
    for i in range(rows + 1):
        s = s0 + (s1 - s0) * i / rows
        C = crom(P, s); T = crom(P, min(n, s + 0.01)) - crom(P, max(0, s - 0.01)); T.normalize()
        if N is None:
            ref = Vector((0, 0, 1)) if abs(T.z) < 0.9 else Vector((1, 0, 0))
            N = ref - T * ref.dot(T)
        else:
            N = N - T * N.dot(T)
        N.normalize(); Bn = T.cross(N); r = rf(s); ring = []
        for j in range(tseg):
            a = TAU * j / tseg; p = C + (N * math.cos(a) + Bn * math.sin(a)) * r
            ring.append(bm.verts.new(E(*p)))
        rings.append(ring)
    for i in range(rows):
        for j in range(tseg):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % tseg], rings[i + 1][(j + 1) % tseg], rings[i + 1][j]))
    if cap0: bm.faces.new(rings[0][::-1])
    if cap1: bm.faces.new(rings[-1])
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def dome(t, prof=BELL_PROFILE):
    """(radius, height) on the smooth bell profile at t in 0..1, plus the outward normal (nr, nh)."""
    n = len(prof) - 1; s = t * n
    r, h = crom(prof, s); r2, h2 = crom(prof, min(n, s + 0.005)); r1, h1 = crom(prof, max(0, s - 0.005))
    dr, dh = r2 - r1, h2 - h1; L = math.hypot(dr, dh) or 1.0
    return r, h, dh / L, -dr / L
def resample(prof, rows):
    """A smooth lathe profile of `rows` + 1 rings through the control points."""
    out = []
    for i in range(rows + 1):
        r, h, _, _ = dome(i / rows, prof); out.append((max(0.0, r), h))
    out[-1] = (0.0, prof[-1][1]) if prof[-1][0] <= 1e-6 else out[-1]
    return out
def scallop(h):
    """Amplitude of the wavy rim at bell height h (strongest on the lowest rings, gone by 0.45)."""
    return 0.08 * max(0.0, 1 - h / 0.45) ** 1.5
def frac(i, k=0.6180339887):
    """A deterministic 0..1 scatter (golden-ratio sequence), no real randomness so every build is identical."""
    return (i * k + 0.137) % 1.0

def build(B):
    L = B.L; lo = B.lo
    M_bell = glow('bell_violet', COL, strength=0.8, rough=0.22, coat=1.0)
    M_bell_in = glow('bell_inner', '#e2b0ff', strength=0.6, rough=0.3, coat=0.6)
    M_rib = glow('rib_pink', RIB, strength=1.7, rough=0.3)
    M_core = glow('core_white', '#fff2ff', strength=2.7, rough=0.2)
    M_tv = glow('tent_violet', COL, strength=1.4, rough=0.3)
    M_tp = glow('tent_pink', RIB, strength=1.4, rough=0.3)
    M_coil = metal('coil_copper', '#d8a060', 0.2)
    led_c, led_p, led_w = led(COL2), led(RIB), led('#ffffff')
    # ---------------- platform, trim, bumpers, underglow ----------------
    B.platform(4.2, 2.1, 0.6, 0.4, '#1a1028', leds=[COL2, COL])
    for s in (1, -1):
        B.obj('trim_%d' % (s > 0), bm_box(0.06, 0.04, 4.0, (s * 1.03, 0.81, 0)), chrome(), bevel=0.015, bevel_angle=False)
        B.strip((s * 0.98, 0.43, 1.85), (s * 0.98, 0.43, -1.85), COL2)
    B.strip((-0.95, 0.43, 2.06), (0.95, 0.43, 2.06), COL2); B.strip((-0.95, 0.43, -2.06), (0.95, 0.43, -2.06), COL2)
    for z in (2.17, -2.17): B.obj('bumper_%d' % (z > 0), bm_box(1.9, 0.12, 0.14, (0, 0.46, z)), chrome(), bevel=0.04, bevel_angle=False)
    if not lo:   # rivets along the chrome trim
        for s in (1, -1):
            for i in range(9):
                B.obj('rivet_%d_%d' % (s > 0, i), bm_uv(0.025, 6, 3, (s * 1.03, 0.835, -1.8 + i * 0.45)), dark_chrome())
    B.lamps(0.75, 0.66, 2.12, -2.12, 0.66)
    # ---------------- the two chrome struts that hold the bell's field, with cyan emitters on top ----------------
    for s in (1, -1):
        B.obj('strut_foot_%d' % (s > 0), bm_cyl(0.16, 0.12, 0.08, L['cyl_s'], AY, (s * 0.6, 0.84, 0.55)), dark_chrome(), bevel=0.02)
        B.obj('strut_%d' % (s > 0), bm_rod((s * 0.6, 0.82, 0.55), (s * 0.45, 2.1, 0.45), 0.06, L['cyl_s'], r1=0.05), chrome())
        for k in range(B.pick(2, 1)):
            t = 0.32 + k * 0.3
            B.obj('strut_band_%d_%d' % (s > 0, k), bm_torus(0.062, 0.016, 10, 4, AY, (s * (0.6 - 0.15 * t), 0.82 + 1.28 * t, 0.55 - 0.1 * t)), led_c)
        B.obj('strut_cup_%d' % (s > 0), bm_cyl(0.05, 0.11, 0.1, L['cyl_s'], AY, (s * 0.45, 2.13, 0.45), caps=False), dark_chrome())
        B.obj('strut_emit_%d' % (s > 0), bm_uv(0.09, L['cyl_s'], max(5, L['cyl_s'] // 2), (s * 0.45, 2.2, 0.45)), led_c)
        B.light(s * 0.45, 2.22, 0.45, 0.6, COL2, led=1)
    # ---------------- Tesla coil base on the deck: dark chrome drum, copper coil, cyan rings and a crackling ball ----------------
    B.obj('coil_drum', bm_cyl(0.34, 0.3, 0.16, L['cyl'], AY, (0, 0.88, 0.5)), dark_chrome(), bevel=0.03)
    B.obj('coil_ring', bm_torus(0.33, 0.02, L['cyl'], max(4, L['tube'] - 2), AY, (0, 0.97, 0.5)), led_c)
    B.obj('coil_core', bm_cyl(0.15, 0.13, 0.5, L['cyl_s'], AY, (0, 1.21, 0.5)), M_coil)
    for k in range(B.pick(6, 2)):
        B.obj('coil_wind_%d' % k, bm_torus(0.155, 0.014, 12, 4, AY, (0, 1.02 + k * 0.08, 0.5)), chrome())
    B.obj('coil_top', bm_cyl(0.2, 0.2, 0.05, L['cyl_s'], AY, (0, 1.48, 0.5)), chrome(), bevel=0.015)
    B.obj('coil_ball', bm_uv(0.11, L['cyl_s'], max(5, L['cyl_s'] // 2), (0, 1.6, 0.5)), led_c)
    B.light(0, 1.62, 0.5, 0.7, COL2, led=1)
    # ---------------- the bell (part `bell`, pulses: squash + stretch) ----------------
    P = B.part('bell', BELL_AT)
    rows = B.pick(14, 7); seg = B.pick(44, 20)
    prof_out = resample(BELL_PROFILE, rows)
    def rmod_out(th, t):
        h = prof_out[min(rows, int(round(t * rows)))][1]
        return 1 + scallop(h) * math.sin(th * 10)
    B.obj('bell_dome', bm_lathe(prof_out, seg, rmod=rmod_out, caps=False), M_bell, parent=P)
    prof_in = resample([(1.55, 0), (1.56, 0.18), (1.4, 0.72), (1.0, 1.2), (0.5, 1.44), (0, 1.5)], B.pick(10, 5))
    nin = len(prof_in) - 1
    def rmod_in(th, t):
        h = prof_in[min(nin, int(round(t * nin)))][1]
        return 1 + scallop(h) * math.sin(th * 10)
    B.obj('bell_inner', bm_lathe(prof_in, seg, rmod=rmod_in, caps=False, flip=True), M_bell_in, parent=P)
    # the cyan rim ring follows the scallops (a lathe of a small circle, so it hugs the lobes)
    tseg = B.pick(8, 4); ring_prof = [(1.58 + 0.07 * math.cos(TAU * j / tseg), 0.1 + 0.07 * math.sin(TAU * j / tseg)) for j in range(tseg + 1)]
    B.obj('bell_ring', bm_lathe(ring_prof, seg, rmod=lambda th, t: 1 + scallop(0.1) * math.sin(th * 10), caps=False), led_c, parent=P)
    # eight pink ribs: tubes riding the dome's curve from the rim to the crown
    rib_pts = [dome(t) for t in [i / 400 for i in range(401)]]
    rib_pts = [(r + 0.028 * nr, h + 0.028 * nh) for r, h, nr, nh in rib_pts if 0.24 <= h <= 1.5]
    step = max(1, len(rib_pts) // 9); rib_pts = rib_pts[::step] + [rib_pts[-1]]
    for i in range(8):
        a = i / 8 * TAU; sa, ca = math.sin(a), math.cos(a)
        pts = [(sa * r, h, ca * r) for r, h in rib_pts]
        nR = len(pts) - 1
        B.obj('rib_%d' % i, bm_tube(pts, 0, nR, lambda s, nR=nR: 0.052 - 0.022 * s / nR, B.pick(7, 5), B.pick(12, 6)), M_rib, parent=P)
        if not lo: B.obj('rib_bulb_%d' % i, bm_uv(0.065, 10, 6, (sa * 1.56, 0.25, ca * 1.56)), led_p, parent=P)
    # the glowing white core under the dome
    B.obj('core', bm_uv(0.42, B.pick(20, 10), B.pick(12, 6), (0, 0.75, 0)), M_core, parent=P)
    if not lo:
        B.obj('core_ring', bm_torus(0.5, 0.025, L['torus'], max(4, L['tube'] - 3), rot(0, 0.5, 0.3), (0, 0.75, 0)), led_c, parent=P)
    # crown cap + Tesla spire: chrome discs climbing to a cyan ball
    B.obj('crown', bm_lathe([(0.46, 1.44), (0.44, 1.52), (0.3, 1.62), (0.0, 1.68)], L['cyl'], caps=False), chrome(), parent=P)
    B.obj('crown_ring', bm_torus(0.46, 0.022, L['cyl'], max(4, L['tube'] - 3), AY, (0, 1.46, 0)), led_c, parent=P)
    B.obj('spire', bm_rod((0, 1.62, 0), (0, 1.9, 0), 0.04, L['cyl_s'], r1=0.025), chrome(), parent=P)
    for k, (y, r) in enumerate(((1.7, 0.14), (1.78, 0.11), (1.85, 0.08))):
        B.obj('spire_disc_%d' % k, bm_cyl(r, r, 0.02, L['cyl_s'], AY, (0, y, 0)), chrome(), bevel=0.006, parent=P)
    B.obj('spire_ball', bm_uv(0.11, L['cyl_s'], max(5, L['cyl_s'] // 2), (0, 1.97, 0)), led_c, parent=P)
    # static: tiny cyan sparks crackling around the rim and the spire (showroom only)
    if not lo:
        for i in range(22):
            a = TAU * frac(i); r0 = 1.66 + 0.1 * frac(i + 7, 0.41); y0 = 0.02 + 0.3 * frac(i + 3, 0.73)
            p = Vector((math.sin(a) * r0, y0, math.cos(a) * r0))
            for k in range(3):
                d = Vector((math.sin(a) * 0.07 + (frac(i * 3 + k, 0.29) - 0.5) * 0.08, (frac(i * 5 + k, 0.53) - 0.5) * 0.12, math.cos(a) * 0.07 + (frac(i * 7 + k, 0.67) - 0.5) * 0.08))
                q = p + d
                B.obj('spark_%d_%d' % (i, k), bm_rod(tuple(p), tuple(q), 0.012, 4), led_c, parent=P, smooth=False)
                p = q
        for i in range(6):
            a = TAU * frac(i + 11, 0.37); p = Vector((0, 1.9, 0))
            for k in range(2):
                q = p + Vector((math.sin(a) * 0.12 + (frac(i + k, 0.31) - 0.5) * 0.06, 0.05 + (frac(i * 2 + k, 0.59) - 0.5) * 0.08, math.cos(a) * 0.12 + (frac(i * 3 + k, 0.71) - 0.5) * 0.06))
                B.obj('spire_spark_%d_%d' % (i, k), bm_rod(tuple(p), tuple(q), 0.01, 4), led_c, parent=P, smooth=False)
                p = q
    B.light(0, 3.0, 0.5, 4.0, LIGHT, big=1)
    # ---------------- five tentacles (parts `tentacle<i>`, pitch + roll sway) ----------------
    nS = len(TENT_SPINE) - 1; tseg_t = B.pick(8, 6); rows_t = B.pick(6, 3)
    def tent_r(s): return 0.09 - 0.06 * s / nS
    for i, at in TENTACLES.items():
        T = B.part('tentacle%d' % i, at)
        for k in range(4):
            s0, s1 = nS * k / 4, nS * (k + 1) / 4
            B.obj('tent%d_seg_%d' % (i, k), bm_tube(TENT_SPINE, s0, s1, tent_r, tseg_t, rows_t), M_tp if k % 2 else M_tv, parent=T)
            if k:   # a cyan bead at each joint
                C = crom(TENT_SPINE, s0)
                B.obj('tent%d_bead_%d' % (i, k), bm_uv(tent_r(s0) * 1.3, B.pick(8, 6), B.pick(5, 4), tuple(C)), led_c, parent=T)
        # frilly skirt at the tip (two-sided), then the cyan tip ball
        frill = [(0.03, -1.5), (0.06, -1.6), (0.12, -1.66), (0.15, -1.7)]
        fseg = B.pick(18, 8); fmod = lambda th, t: 1 + 0.28 * t * math.sin(th * 6)
        B.obj('tent%d_frill' % i, bm_lathe(frill, fseg, rmod=fmod, caps=False), M_tp, parent=T)
        B.obj('tent%d_frill_in' % i, bm_lathe(frill, fseg, rmod=fmod, caps=False, flip=True), M_tp, parent=T)
        B.obj('tent%d_tip' % i, bm_uv(0.08, B.pick(12, 6), B.pick(7, 4), (0, -1.7, 0)), led_c, parent=T)
        B.light(at[0], at[1] - 1.7, at[2], 0.55, COL2, led=1)
    # ---------------- wheels, seat (under the back of the bell), size info ----------------
    B.wheels(0.95, 1.55, -1.55, r=0.42, w=0.36, rim=COL2, tyre='#14121a', cap=COL2)
    B.seat(0, 1.2, -1.4, col='#3a1a5a', accent=COL2, wheelZ=-0.82)
    B.info(4.4, 3.3, 4.0, muzzle=(0, 2.6, 0.5), wheelR=0.42)

if __name__ == '__main__':
    run('jelly_jolt', build)
