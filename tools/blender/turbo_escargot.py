# Turbo Escargot (Art Cart car #9): the fastest snail alive. Slimy about it. A glossy teal slug on a dark slime board,
# a clear-coat purple spiral shell with a glowing bulb stripe, chrome racing stripes, a number roundel and twin
# turbo rockets; the rider sits on a saddle on top of the shell; the eye stalks wobble.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/turbo_escargot.py
# Writes assets/models/art-cart/turbo_escargot.glb (showroom, 20–30k tris) and turbo_escargot_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, BODY = '#9a6bff', '#7aff5a', '#b07aff', '#3ac8a0'   # CART_CARS.snail palette + the teal body
FOOT_AT, FRX, FRY, FRZ = (0, 0.78, 0), 1.1, 0.42, 2.6                 # the procedural foot ellipsoid
HEAD_AT, HEAD_R = (0, 1.95, 2.55), 0.46
SHELL_AT = (0, 1.15, -0.55)                                          # the `shell` part pivot (engine coords)
TURNS, A_END = 2.6, 2.6 * TAU
SS = 1.0                                                             # shell scale (the coil's own proportions are tuned below)
DEC, OFF, RR = 0.12, 0.8, 0.45                                       # coil decay per radian, centre offset, tube radius (×R)
WMAX, WPOW = 0.85, 0.35                                              # half-width of the coil at the aperture; the width decays slower than R so every whorl bulges out of the face
GROOVE = 3 * math.pi / 4                                             # the suture groove sits on this tube ring (both faces)

# ---- local helpers ----
def norm(v):
    v = Vector(v); L = v.length
    return v / L if L > 1e-9 else v
def add(a, b, k=1.0): return (a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k)

def tube_along(pts, rads, seg, ref=(1, 0, 0), caps=True, sy=1.0):
    """A tube along a 3D engine polyline with a radius per point (parallel-transported frames, no twist)."""
    n = len(pts); P = [Vector(p) for p in pts]
    if not isinstance(rads, (list, tuple)): rads = [rads] * n
    T = []
    for i in range(n):
        a = P[max(0, i - 1)]; b = P[min(n - 1, i + 1)]; T.append(norm(b - a))
    N = norm(Vector(ref) - T[0] * T[0].dot(Vector(ref)))
    bm = bmesh.new(); rings = []
    for i in range(n):
        N = norm(N - T[i] * T[i].dot(N)); Bn = T[i].cross(N)
        ring = []
        for j in range(seg):
            th = TAU * j / seg
            q = P[i] + N * (math.cos(th) * rads[i]) + Bn * (math.sin(th) * rads[i] * sy)
            ring.append(bm.verts.new(E(q.x, q.y, q.z)))
        rings.append(ring)
    for i in range(n - 1):
        for j in range(seg):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % seg], rings[i + 1][(j + 1) % seg], rings[i + 1][j]))
    if caps:
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def surf_closed(nu, nv, fn, wrap_u=True, wrap_v=False):
    bm = bm_surf(nu, nv, fn, wrap_u=wrap_u, wrap_v=wrap_v)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

# ---- the spiral shell (shell-part local coords): the procedural's logarithmic tube, yawed so the coil axis is x ----
def sp_R(a): return 1.25 * math.exp(-DEC * a)
def sp_taper(a):
    """Closes both ends of the tube: a dome over the first 0.45 rad and the last 1.0 rad."""
    t = 1.0
    if a < 0: t = math.sqrt(max(0.0, 1 - (a / 0.45) ** 2))
    if a > A_END - 1.0: t = min(t, math.sqrt(max(0.0, 1 - ((a - (A_END - 1.0)) / 1.0) ** 2)))
    return t
def sp_rib(a, ribs):
    if not ribs or a < 0.1: return 1.0
    k = (0.5 + 0.5 * math.cos(a * 7)) ** 2
    return 1 + 0.05 * k
def sp_groove(a, ang, ribs):
    """The suture: a shallow V groove along the coil on both faces where the next whorl tucks under this one."""
    if not ribs or a < 0.2 or a > A_END - 1.5: return 1.0
    d = min(abs(abs(ang) - GROOVE), abs(abs(ang - TAU) - GROOVE))
    return 1 - 0.07 * math.exp(-(d / 0.2) ** 2)
def sp_centre(a):
    R = sp_R(a); return Vector((0.0, 1.3 + math.sin(a) * OFF * R * SS, -math.cos(a) * OFF * R * SS))
def sp_pt(a, ang, off=0.0, ribs=False):
    """Point on the shell tube at spiral angle a (rad) and tube angle ang (0 = the outer spine), `off` along the normal."""
    R = sp_R(a); mod = sp_taper(a) * sp_rib(a, ribs) * sp_groove(a, ang, ribs); r = R * RR * mod
    W = WMAX * (R / 1.25) ** WPOW * mod
    cx, cy = math.cos(a) * R * OFF, math.sin(a) * R * OFF
    p = cx + math.cos(a) * math.cos(ang) * r; q = cy + math.sin(a) * math.cos(ang) * r; w = math.sin(ang) * W
    P = Vector((w * SS, 1.3 + q * SS, -p * SS))
    if off: P += norm(P - sp_centre(a)) * off
    return P
def sp_a(u, a0=-0.45, a1=A_END): return a0 + (a1 - a0) * (u ** 1.35)
def sp_glyph(a0, ang0, off, ribs):
    """A mapper (gu, gv) -> shell point for a flat decal around (a0, ang0): gu = the viewer's right, gv = world up,
    solved through the surface tangents so the decal hugs the coil."""
    P0 = sp_pt(a0, ang0, 0.0, ribs); n = norm(P0 - sp_centre(a0))
    U = norm(Vector((0, 1, 0)) - n * n.y); Rt = U.cross(n)
    Ta = (sp_pt(a0 + 1e-3, ang0, 0.0, ribs) - sp_pt(a0 - 1e-3, ang0, 0.0, ribs)) / 2e-3
    Tg = (sp_pt(a0, ang0 + 1e-3, 0.0, ribs) - sp_pt(a0, ang0 - 1e-3, 0.0, ribs)) / 2e-3
    aa, ab, bb = Ta.dot(Ta), Ta.dot(Tg), Tg.dot(Tg); det = aa * bb - ab * ab
    def f(gu, gv, o=off):
        D = Rt * gu + U * gv; da, dg = D.dot(Ta), D.dot(Tg)
        x = (da * bb - dg * ab) / det; y = (aa * dg - ab * da) / det
        return tuple(sp_pt(a0 + x, ang0 + y, o, ribs))
    return f

def build(B):
    L = B.L; lo = B.lo
    # ---- materials ----
    M_body = paint('body_teal', BODY, coat=1.0, rough=0.22, metal=0.08)
    M_body2 = paint('body_teal_dk', '#2aa888', coat=1.0, rough=0.25, metal=0.08)
    M_shell = paint('shell_purple', COL, coat=1.0, rough=0.18, metal=0.25)
    M_stripe = glow('shell_stripe', LIGHT, strength=1.6, rough=0.2)
    M_bulb = led(LIGHT); M_slime = glow('slime', COL2, strength=0.9, rough=0.12)
    M_deck = paint('deck', '#1c1824', coat=0.7, rough=0.32, metal=0.1)
    M_under = matte('under', '#0c0b10'); M_saddle = satin('saddle', '#3a2a1a', 0.5)
    M_nozzle = led('#ff4a2a', 4.5); M_bore = matte('bore', '#1a0a08', 0.7)
    M_smile = matte('smile', '#1a2a1a', 0.6); M_tongue = paint('tongue', '#ff6a9a', coat=0.6, rough=0.3, metal=0)
    M_lash = matte('lash', '#1a1424', 0.6); M_white = paint('roundel_white', '#f4f2ff', coat=0.8, rough=0.25, metal=0)

    # ================= the slime board: a dark bevelled deck with chrome rub strips, LED rows, lamps and exhausts =================
    deck = B.obj('deck', bm_box(2.1, 0.3, 4.8, (0, 0.53, -0.02)), M_deck, bevel=0.1, bevel_angle=False, segments=B.pick(2, 1))
    B.obj('deck_under', bm_box(1.7, 0.12, 4.2, (0, 0.4, -0.05)), M_under, bevel=0.04, bevel_angle=False, segments=1)
    for i, (x, z) in enumerate([(1.0, 1.7), (-1.0, 1.7), (1.0, -1.6), (-1.0, -1.6)]):
        B.cut([deck], bm_cyl(0.56, 0.56, 0.6, L['arch'], AX, (x * 1.15, 0.44, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.58, 0.04, L['torus'], L['tube'], AX, (x * 1.0, 0.44, z), sweep=(math.pi / 2 - 0.25, 3 * math.pi / 2 + 0.25)), dark_chrome())
    for s in (1, -1):
        B.obj('rub_%d' % (s > 0), bm_rod((s * 1.06, 0.5, 0.95), (s * 1.06, 0.5, -0.85), 0.03, L['rod']), chrome())
        B.obj('rub_f_%d' % (s > 0), bm_rod((s * 1.06, 0.5, 2.25), (s * 1.06, 0.5, 2.4), 0.03, L['rod']), chrome()) if not lo else None
        B.strip((s * 0.9, 0.39, 2.1), (s * 0.9, 0.39, -2.2), COL2)                       # slime-green underglow strips
        n = B.pick(10, 5)
        for i in range(n):
            t = i / (n - 1); c = [COL2, LIGHT][i % 2]; p = (s * 1.05, 0.72, 1.8 + (-2.0 - 1.8) * t)
            B.obj('row%d_%d' % (s > 0, i), bm_uv(0.05, B.pick(8, 6), B.pick(4, 3), p), led(c))
            if i % 3 == 0: B.light(p[0], p[1], p[2], 0.45, c, led=1)
    B.strip((-0.8, 0.39, -2.25), (0.8, 0.39, -2.25), COL2)
    if not lo:   # chrome rivets along the deck's flanks
        for s in (1, -1):
            for k in range(11): B.obj('rivet_%d_%d' % (s > 0, k), bm_ico(0.028, 0, (s * 1.055, 0.62, 2.2 - k * 0.45)), chrome())
    # chrome bumpers, the exhaust tips (slime dribbling out) and the headlamps / tail lamps on the deck corners
    B.obj('bumper_f', bm_rod((-0.92, 0.5, 2.42), (0.92, 0.5, 2.42), 0.045, L['rod']), chrome())
    B.obj('bumper_r', bm_rod((-0.95, 0.5, -2.45), (0.95, 0.5, -2.45), 0.045, L['rod']), chrome())
    for s in (1, -1):
        B.obj('exh_%d' % (s > 0), bm_cyl(0.085, 0.1, 0.36, L['cyl_s'], AZn, (s * 0.32, 0.6, -2.5)), chrome())
        B.obj('exh_bore_%d' % (s > 0), bm_cyl(0.075, 0.075, 0.1, L['cyl_s'], AZn, (s * 0.32, 0.6, -2.66), caps=False, flip=True), M_bore)
        B.obj('exh_slime_%d' % (s > 0), bm_ico(0.06, L['ico'], (s * 0.32, 0.56, -2.68)), M_slime)
        if not lo: B.obj('exh_drip_%d' % (s > 0), bm_rod((s * 0.32, 0.56, -2.68), (s * 0.34, 0.38, -2.7), 0.025, 6, r1=0.012), M_slime)
    B.obj('slime_splat', bm_lathe([(0, 0.0), (0.42, 0.0), (0.5, 0.012), (0.3, 0.03), (0, 0.035)], B.pick(20, 10), (0, 0.68, -2.1), rmod=lambda th, t: 1 + 0.12 * math.sin(th * 5 + 1) * t), M_slime)
    B.lamps(0.7, 0.75, 2.4, -2.45)
    for s in (1, -1):   # lamp pods: a dark chrome base so the headlamps sit on the deck corners
        B.obj('lamp_pod_%d' % (s > 0), bm_box(0.36, 0.2, 0.22, (s * 0.7, 0.68, 2.27)), dark_chrome(), bevel=0.05, bevel_angle=False)

    # ================= the foot: a glossy teal slug with a ruffled skirt, a mantle hump, neck and head =================
    B.obj('foot', bm_ellipsoid(FRX, FRY, FRZ, B.pick(36, 18), B.pick(14, 8), FOOT_AT), M_body)
    nwave = 12
    def skirt(u, v):
        th = TAU * u; top = v < 0.5; t = v * 2 if top else 2 - v * 2
        y0, k0 = 0.97, math.sqrt(1 - ((0.97 - 0.78) / 0.42) ** 2)
        wave = math.sin(th * nwave + 0.4)
        rad = k0 + (1.02 - k0 + 0.03 * wave) * t
        y = y0 + (0.80 - y0) * t + 0.025 * wave * t * t - (0.0 if top else 0.04 * math.sin(t * math.pi))
        return (FRX * rad * math.cos(th), y, FRZ * rad * math.sin(th))
    B.obj('skirt', surf_closed(B.pick(96, 48), B.pick(6, 3), skirt, wrap_u=True, wrap_v=True), M_body)
    B.obj('mantle', bm_ellipsoid(0.98, 0.58, 1.78, B.pick(28, 14), B.pick(11, 6), (0, 1.3, -0.5)), M_body)
    # neck: a smooth tapered tube rising from the foot to the head
    neck = [(0, 0.72, 1.25), (0, 0.9, 1.7), (0, 1.25, 2.1), (0, 1.6, 2.38), (0, 1.9, 2.5)]
    B.obj('neck', tube_along(neck, [0.62, 0.5, 0.45, 0.42, 0.36], B.pick(24, 10), sy=0.92), M_body)
    B.obj('head', bm_uv(HEAD_R, B.pick(28, 14), B.pick(14, 8), HEAD_AT), M_body)
    # the smile (a dark arc set into the head), a tiny tongue and two lower feelers
    def on_head(x, y, dz=0.02):
        d = HEAD_R ** 2 - (x - HEAD_AT[0]) ** 2 - (y - HEAD_AT[1]) ** 2
        return (x, y, HEAD_AT[2] + math.sqrt(max(0.0, d)) + dz)
    smile = [on_head(0.2 * math.cos(t), 1.78 + 0.11 * math.sin(t), 0.0) for t in [math.radians(d) for d in range(200, 341, 14 if lo else 7)]]
    B.obj('smile', tube_along(smile, 0.028, B.pick(6, 4)), M_smile)
    B.obj('tongue', bm_ellipsoid(0.07, 0.03, 0.05, B.pick(10, 6), B.pick(5, 3), on_head(0, 1.69, -0.01)), M_tongue)
    for s in (1, -1):
        B.obj('feeler_%d' % (s > 0), bm_rod(on_head(s * 0.2, 1.72, -0.06), (s * 0.5, 1.62, 3.15), 0.055, B.pick(8, 6), r1=0.018), M_body)
    # cheeks: a soft blush on each side of the smile
    if not lo:
        for s in (1, -1): B.obj('cheek_%d' % (s > 0), bm_ellipsoid(0.09, 0.07, 0.025, 10, 5, on_head(s * 0.3, 1.86, -0.012)), paint('cheek', '#ff9ac8', coat=0.4, rough=0.4, metal=0))
    # a chrome racing stripe running up the neck onto the forehead, with a tiny purple LED star on top
    if not lo:
        stripe = [(0, 1.45, 2.47), (0, 1.75, 2.78), (0, 2.05, 2.95), (0, 2.3, 2.9), (0, 2.42, 2.7)]
        B.obj('head_stripe', tube_along(stripe, 0.03, 6), chrome())

    # ================= eye stalks (parts eyeL / eyeR, pivots on the head top; stalk rises +y, eyeball on top) =================
    for s, name in ((1, 'eyeL'), (-1, 'eyeR')):
        P = B.part(name, (s * 0.22, 2.3, 2.55))
        B.obj(name + '_stalk', bm_rod((0, -0.1, 0), (0, 0.9, 0), 0.075, B.pick(14, 8), r1=0.05), M_body, parent=P)
        if not lo:
            for k, y in enumerate((0.2, 0.42, 0.62)):
                B.obj(name + '_ring%d' % k, bm_torus(0.074 - k * 0.006, 0.014, 10, 4, AY, (0, y, 0)), M_body2, parent=P)
        B.eye((0, 1.0, 0), 0.17, iris='#2a1a3a', look=(s * 0.12, 0.05), parent=P, name=name + '_eye')
        # a droopy teal eyelid over the top of the ball, lashes along its front edge
        B.obj(name + '_lid', bm_ellipsoid(0.185, 0.185, 0.185, B.pick(20, 10), B.pick(6, 4), (0, 1.0, 0), M=rot(pitch=0.45), phi1=0.95), M_body, parent=P)
        if not lo:
            for k, ph in enumerate((-0.5, 0.0, 0.5)):
                th = 1.35; d = Vector((math.sin(th) * math.sin(ph), math.cos(th), math.sin(th) * math.cos(ph)))
                b = Vector((0, 1.0, 0)) + d * 0.185; e = b + norm(d + Vector((0, 0.9, 0))) * 0.11
                B.obj(name + '_lash%d' % k, bm_rod(tuple(b), tuple(e), 0.012, 5, r1=0.004), M_lash, parent=P)

    # ================= the shell (part `shell`): the spiral tube, ribs, stripes, bulbs, roundels, rockets =================
    SH = B.part('shell', SHELL_AT)
    nu, nv = B.pick(150, 48), B.pick(16, 10)
    shell = B.obj('shell_coil', surf_closed(nu, nv, lambda u, v: tuple(sp_pt(sp_a(u), TAU * v, ribs=not lo)), wrap_u=False, wrap_v=True), M_shell, parent=SH)
    # glowing spine stripe with the bulbs (22 hi / 10 lo), chrome racing stripes either side of it
    nst = B.pick(100, 32)
    spine = [tuple(sp_pt(sp_a(i / nst, 0.0, A_END - 0.75), 0.0, 0.004, ribs=not lo)) for i in range(nst + 1)]
    B.obj('shell_spine', tube_along(spine, [0.045 * (0.35 + 0.65 * sp_R(sp_a(i / nst, 0.0, A_END - 0.75)) / 1.25) for i in range(nst + 1)], B.pick(5, 4), caps=True), M_stripe, parent=SH)
    nb = B.pick(22, 10)
    for i in range(nb):
        a = i / nb * (A_END - 1.2); R = sp_R(a); r = R * RR
        p = sp_pt(a, 0.0, 0.0, ribs=not lo)
        B.obj('shell_bulb_%d' % i, bm_uv((0.06 + r * 0.04) * SS, B.pick(8, 6), B.pick(4, 3), tuple(p)), M_bulb, parent=SH)
    if not lo:
        for side in (1, -1):
            n2 = 80
            pts = [tuple(sp_pt(sp_a(i / n2, 0.05, A_END - 1.2), side * 0.6, 0.012, ribs=True)) for i in range(n2 + 1)]
            rads = [0.03 * (0.3 + 0.7 * sp_R(sp_a(i / n2, 0.05, A_END - 1.2)) / 1.25) for i in range(n2 + 1)]
            B.obj('shell_chrome_%d' % (side > 0), tube_along(pts, rads, 4), chrome(), parent=SH)
    # number roundels on both flanks: a white disc that hugs the coil, a chrome ring and a chrome "7"
    for side in (1, -1):
        G = sp_glyph(0.95, side * math.pi / 2, 0.06, False)      # a smooth plate above the rib peaks, with a wall down into the valleys
        B.obj('roundel_%d' % (side > 0), surf_closed(B.pick(28, 14), B.pick(3, 2), lambda u, v, G=G: G(0.32 * v * math.cos(TAU * u), 0.32 * v * math.sin(TAU * u)), wrap_u=True), M_white, parent=SH)
        B.obj('roundel_wall_%d' % (side > 0), surf_closed(B.pick(28, 14), 1, lambda u, v, G=G: G(0.32 * math.cos(TAU * u), 0.32 * math.sin(TAU * u), 0.06 - 0.1 * v), wrap_u=True), M_white, parent=SH)
        nr = B.pick(24, 12)
        ring = [G(0.31 * math.cos(TAU * i / nr), 0.31 * math.sin(TAU * i / nr), 0.065) for i in range(nr + 1)]
        B.obj('roundel_ring_%d' % (side > 0), tube_along(ring, 0.028, B.pick(5, 3), caps=False), chrome(), parent=SH)
        bar = [G(-0.15 + 0.3 * k / 4, 0.17, 0.085) for k in range(5)]
        diag = [G(0.15 - 0.2 * k / 5, 0.17 - 0.35 * k / 5, 0.085) for k in range(6)]
        B.obj('seven_bar_%d' % (side > 0), tube_along(bar, 0.032, B.pick(6, 4)), chrome(), parent=SH)
        B.obj('seven_diag_%d' % (side > 0), tube_along(diag, 0.032, B.pick(6, 4)), chrome(), parent=SH)
    # twin turbo rockets: chrome barrels along z, flared nozzles with glowing red cores, fins and a bracket
    for s in (1, -1):
        rx, ry, rz = s * 0.95, 0.75, -0.65
        B.obj('rocket_%d' % (s > 0), bm_cyl(0.2, 0.2, 1.1, L['cyl'], AZ, (rx, ry, rz)), chrome(), bevel=0.05, segments=B.pick(2, 1), parent=SH)
        B.obj('rocket_nose_%d' % (s > 0), bm_cyl(0.2, 0.1, 0.18, L['cyl_s'], AZ, (rx, ry, rz + 0.64)), chrome(), bevel=0.03, segments=1, parent=SH)
        B.obj('rocket_flare_%d' % (s > 0), bm_cyl(0.25, 0.2, 0.14, L['cyl'], AZ, (rx, ry, rz - 0.62)), chrome(), bevel=0.02, segments=1, parent=SH)
        B.obj('rocket_bore_%d' % (s > 0), bm_cyl(0.21, 0.17, 0.16, L['cyl_s'], AZ, (rx, ry, rz - 0.64), caps=False, flip=True), M_bore, parent=SH)
        B.obj('rocket_core_%d' % (s > 0), bm_uv(0.13, B.pick(10, 8), B.pick(6, 4), (rx, ry, rz - 0.63)), M_nozzle, parent=SH)
        if not lo:
            B.obj('rocket_band_%d' % (s > 0), bm_torus(0.2, 0.025, 14, 5, AZ, (rx, ry, rz - 0.3)), dark_chrome(), parent=SH)
            B.obj('rocket_band2_%d' % (s > 0), bm_torus(0.2, 0.025, 14, 5, AZ, (rx, ry, rz + 0.35)), dark_chrome(), parent=SH)
        B.obj('rocket_strut_%d' % (s > 0), bm_rod((s * 0.9, 0.88, -1.05), (s * 0.4, 1.3, -1.05), 0.035, L['rod']), chrome(), parent=SH)
        B.obj('rocket_strut2_%d' % (s > 0), bm_rod((s * 0.9, 0.88, -0.4), (s * 0.35, 1.6, -0.3), 0.035, L['rod']), chrome(), parent=SH)
        if not lo:
            for k in range(3):
                a = TAU * (k / 3 + 0.25)
                B.obj('rocket_fin_%d_%d' % (s > 0, k), bm_fin(rx, ry, rz, a), chrome(), parent=SH, smooth=False, bevel=0.01)
            B.obj('rocket_glowring_%d' % (s > 0), bm_torus(0.225, 0.015, 16, 4, AZ, (rx, ry, rz - 0.7)), M_nozzle, parent=SH)
    B.light(0, 2.45, -0.55, 2.4, LIGHT, big=1)
    for s in (1, -1): B.light(s * 0.95, 1.9, -1.85, 0.7, '#ff6a2a', led=1)

    # ================= the saddle on top of the shell (body bone), the seat and the steering mast =================
    B.obj('saddle', bm_box(0.7, 0.12, 0.8, (0, 3.98, -0.62)), M_saddle, bevel=0.05, bevel_angle=False)
    B.obj('saddle_plate', bm_box(0.5, 0.06, 0.6, (0, 3.9, -0.62)), dark_chrome(), bevel=0.02, bevel_angle=False)
    for s in (1, -1):
        B.obj('saddle_rail_%d' % (s > 0), bm_rod((s * 0.3, 3.92, -0.25), (s * 0.3, 3.92, -1.0), 0.02, L['rod']), chrome())
    B.obj('mast', bm_rod((0, 3.0, 0.05), (0, 4.1, 0.36), 0.045, L['rod']), dark_chrome())
    B.obj('mast_foot', bm_cyl(0.14, 0.1, 0.1, L['cyl_s'], AY, (0, 3.04, 0.05)), dark_chrome())
    B.seat(0, 4.2, -0.6, col='#5a2a8a', accent=COL2, wheelY=4.58, wheelZ=0.02)

    # ================= wheels and size info =================
    B.wheels(1.0, 1.7, -1.6, r=0.44, w=0.38, rim=COL2, tyre='#14121a', cap=LIGHT)
    B.info(5.6, 2.3, 5.1, muzzle=(0, 0.6, -2.6), wheelR=0.44, extra={'rockets': [[0.95, 1.9, -1.75], [-0.95, 1.9, -1.75]]})

def bm_fin(rx, ry, rz, a):
    """A thin chrome fin on a rocket barrel (centre rx, ry, rz), rotated about the barrel axis (z) by a."""
    pts = [(0.19, -0.02), (0.19, 0.34), (0.3, 0.42), (0.34, -0.02)]   # (radial, z-from-fin-base) outline
    bm = bmesh.new()
    ca, sa = math.cos(a), math.sin(a)
    def P(rr, zz, w): return E(rx + rr * ca - w * sa, ry + rr * sa + w * ca, rz - 0.3 + zz)
    front = [bm.verts.new(P(rr, zz, 0.012)) for rr, zz in pts]
    back = [bm.verts.new(P(rr, zz, -0.012)) for rr, zz in pts]
    bm.faces.new(front); bm.faces.new(back[::-1])
    for i in range(4):
        bm.faces.new((front[i], back[i], back[(i + 1) % 4], front[(i + 1) % 4]))
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

if __name__ == '__main__':
    run('turbo_escargot', build, level_overrides={'hi': dict(bevel=3, cyl=24, torus=18, tube=6, arch=16, sph=20, ring=12), 'lo': dict(torus=10, tube=4, arch=8)})
    if os.environ.get('CART_DEBUG'):
        dg = bpy.context.evaluated_depsgraph_get(); rows = []
        for ob in bpy.data.objects:
            if ob.type != 'MESH': continue
            me = ob.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); rows.append((len(me.loop_triangles), ob.name)); ob.evaluated_get(dg).to_mesh_clear()
        for n, nm in sorted(rows, reverse=True)[:40]: print('CART_OBJ %6d %s' % (n, nm))
