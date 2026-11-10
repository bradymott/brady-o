# Turbo Escargot (Art Cart car #9): the fastest snail alive. Slimy about it. Quality-bar rebuild.
# A wet, glossy teal slug (baked mint-to-teal gradient in the vertex colours) on a gloss-black slime board with chrome
# tube bumpers, slime-green under-glow and premium wheels; a pearlescent spiral shell (iridescent lavender, pink and
# cyan, baked per vertex) with a glowing spine stripe and chase lights that flow out along the spiral, chrome racing
# stripes, number-7 roundels and twin chrome turbo rockets. The rider sits jockey-style on the snail's back, in front of
# the shell, so the chase camera only has to see over the shell.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/turbo_escargot.py', run_name='__main__')
# Writes assets/models/art-cart/turbo_escargot.glb (showroom, <= 30k tris) and turbo_escargot_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['snail:2'] in src/43_cart_bb_glb.js):
#   part_slug          the foot, skirt, mantle, neck and head. Joint at the car origin; the game squashes and
#                      stretches it about its sole (SOLE_Y, SOLE_Z) in a slow peristaltic wave, longer with speed
#   part_eyeL / eyeR   the eye stalks, joint at their root on the head: they sway and bob (and ride the squash)
#   part_shell         the coil, stripes, roundels and rockets, joint SHELL_AT: it wobbles (and rides the squash)
#   part_chase         the chase lights on the spiral, joint at the spiral's centre: the game turns them about the coil
#                      axis while scaling by the spiral's growth, so they flow out along the stripe and loop seamlessly
#                      (CHASE_DA: two bulb slots per loop, so the race level's every-other bulb loops seamlessly too)
# body extras: rigV = 2, extra.sight = the shell's top (the chase camera rises just enough to see over it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, BODY = '#9a6bff', '#7aff5a', '#b07aff', '#3ac8a0'   # CART_CARS.snail palette + the teal body
FOOT_AT, FRX, FRY, FRZ = (0, 0.78, 0), 1.1, 0.42, 2.6                 # the procedural foot ellipsoid
HEAD_AT, HEAD_R = (0, 1.95, 2.55), 0.46
SHELL_AT = (0, 1.15, -0.55)                                          # the `shell` part pivot (engine coords)
SOLE_Y, SOLE_Z = 0.45, 0.3                                           # the slug squashes about this (see the JS)
TURNS, A_END = 2.6, 2.6 * TAU
DEC, OFF, RR = 0.12, 0.8, 0.45                                       # coil decay per radian, centre offset, tube radius (×R)
WMAX, WPOW = 0.85, 0.35                                              # half-width of the coil at the aperture
GROOVE = 3 * math.pi / 4                                             # the suture groove sits on this tube ring (both faces)
CHASE_N = 24; CHASE_DA = (A_END - 1.2) / CHASE_N                     # chase-light slots along the spiral (0.6307 rad)
SEAT = (0, 1.86, 0.95)                                               # the jockey's hips, in front of the shell

# ---- local helpers ----
def norm(v):
    v = Vector(v); L = v.length
    return v / L if L > 1e-9 else v
def surf_closed(nu, nv, fn, wrap_u=True, wrap_v=False):
    bm = bm_surf(nu, nv, fn, wrap_u=wrap_u, wrap_v=wrap_v)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def tube_along(pts, rads, seg, caps=True, sy=1.0):
    return bm_tube(pts, rads, seg, caps=caps, section_fn=(lambda u: (1.0, sy)) if sy != 1.0 else None, ref=(1, 0, 0))

# ---- the spiral shell (shell-part local coords): a logarithmic tube, the coil axis along x ----
def sp_R(a): return 1.25 * math.exp(-DEC * a)
def sp_taper(a):
    t = 1.0
    if a < 0: t = math.sqrt(max(0.0, 1 - (a / 0.45) ** 2))
    if a > A_END - 1.0: t = min(t, math.sqrt(max(0.0, 1 - ((a - (A_END - 1.0)) / 1.0) ** 2)))
    return t
def sp_rib(a, ribs):
    if not ribs or a < 0.1: return 1.0
    return 1 + 0.05 * (0.5 + 0.5 * math.cos(a * 7)) ** 2
def sp_groove(a, ang, ribs):
    if not ribs or a < 0.2 or a > A_END - 1.5: return 1.0
    d = min(abs(abs(ang) - GROOVE), abs(abs(ang - TAU) - GROOVE))
    return 1 - 0.07 * math.exp(-(d / 0.2) ** 2)
def sp_centre(a):
    R = sp_R(a); return Vector((0.0, 1.3 + math.sin(a) * OFF * R, -math.cos(a) * OFF * R))
def sp_pt(a, ang, off=0.0, ribs=False):
    """Point on the shell tube at spiral angle a (rad) and tube angle ang (0 = the outer spine), `off` along the normal."""
    R = sp_R(a); mod = sp_taper(a) * sp_rib(a, ribs) * sp_groove(a, ang, ribs); r = R * RR * mod
    W = WMAX * (R / 1.25) ** WPOW * mod
    cx, cy = math.cos(a) * R * OFF, math.sin(a) * R * OFF
    p = cx + math.cos(a) * math.cos(ang) * r; q = cy + math.sin(a) * math.cos(ang) * r; w = math.sin(ang) * W
    P = Vector((w, 1.3 + q, -p))
    if off: P += norm(P - sp_centre(a)) * off
    return P
def sp_a(u, a0=-0.45, a1=A_END): return a0 + (a1 - a0) * (u ** 1.35)
def sp_glyph(a0, ang0, off, ribs):
    """A mapper (gu, gv) -> shell point for a flat decal around (a0, ang0) that hugs the coil."""
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
def pearl(x, y, z):
    """Pearlescent shell colour (vertex colour over a pale lavender base): lavender, pink and ice-cyan bands that drift
    around the coil and across its faces, brighter on the outer spine."""
    a = math.atan2(y - 1.3, -z); r = math.hypot(y - 1.3, z)
    h = 0.5 + 0.5 * math.sin(a * 2.0 + x * 3.2 + r * 2.5)
    k = 0.5 + 0.5 * math.sin(a * 1.3 - x * 2.1 + 1.7)
    lav, pink, cyan = (0.66, 0.46, 1.0), (0.98, 0.56, 0.9), (0.56, 0.82, 1.0)
    c = [lav[i] + (pink[i] - lav[i]) * h for i in range(3)]
    c = [c[i] + (cyan[i] - c[i]) * 0.45 * k * (1 - h) for i in range(3)]
    b = 0.86 + 0.14 * sstep((r - 0.3) / 0.9)
    return tuple(v * b for v in c)
def slug_skin(x, y, z):
    """The wet slug: pale mint on the belly and skirt, deepening to teal along the back, a darker dorsal line."""
    t = sstep((y - 0.62) / 1.25); d = math.exp(-(x / 0.32) ** 2) * sstep((y - 1.0) / 0.5) * 0.12
    k = 1.12 - 0.36 * t - d
    return (k * 0.92, k * 1.02, k * 0.98)

def build(B):
    L = B.L; lo = B.lo; body = B.body
    B.export_try = VCOL_EXPORT   # slug gradient and pearl shell are vertex colours
    # ---- materials ----
    M_body = paint('body_teal', '#4ad8b0', coat=1.0, rough=0.12, metal=0.05)        # wet: clear coat, very smooth
    M_body2 = paint('body_teal_dk', '#2aa888', coat=1.0, rough=0.18, metal=0.05)
    M_shell = paint('shell_pearl', '#c09cff', coat=1.0, rough=0.1, metal=0.35)     # pearlescent: the vcol tints it
    M_stripe = glow('shell_stripe', LIGHT, strength=1.8, rough=0.15)
    M_bulb = led('#e8d0ff'); M_bulb2 = led(COL2); M_slime = glow('slime', COL2, strength=1.0, rough=0.08)
    M_deck = paint('deck', '#16131c', coat=1.0, rough=0.2, metal=0.3)
    M_under = matte('under', '#0c0b10'); M_saddle = paint('saddle', '#5a2a8a', coat=0.8, rough=0.3, metal=0.0)
    M_nozzle = led('#ff4a2a', 4.5); M_bore = matte('bore', '#1a0a08', 0.7)
    M_smile = matte('smile', '#1a2a1a', 0.6); M_tongue = paint('tongue', '#ff6a9a', coat=0.8, rough=0.2, metal=0)
    M_lash = matte('lash', '#1a1424', 0.6); M_white = paint('roundel_white', '#f4f2ff', coat=1.0, rough=0.15, metal=0)

    # ================= the slime board (body bone): gloss-black deck, chrome bumpers, LED rows, under-glow, lamps =================
    deck = B.obj('deck', bm_box(2.1, 0.3, 4.8, (0, 0.53, -0.02)), M_deck, bevel=B.pick(0.1, 0.08), bevel_angle=False, segments=B.pick(2, 1))
    B.obj('deck_under', bm_box(1.7, 0.12, 4.2, (0, 0.4, -0.05)), M_under)
    for i, (x, z) in enumerate([(1.0, 1.7), (-1.0, 1.7), (1.0, -1.6), (-1.0, -1.6)]):
        B.cut([deck], bm_cyl(0.56, 0.56, 0.6, L['arch'], AX, (x * 1.15, 0.44, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.58, 0.04, B.pick(14, 8), B.pick(4, 3), AX, (x * 1.0, 0.44, z), sweep=(math.pi / 2 - 0.25, 3 * math.pi / 2 + 0.25)), chrome())
    for s in (1, -1):
        B.obj('rub_%d' % (s > 0), bm_rod((s * 1.06, 0.53, 0.95), (s * 1.06, 0.53, -0.85), 0.03, L['rod']), chrome())
        B.strip((s * 0.9, 0.36, 2.1), (s * 0.9, 0.36, -2.2), COL2, th=0.045)                 # slime-green under-glow
        B.light(s * 0.9, 0.25, 0.0, 2.2, COL2, led=1)
        n = B.pick(10, 5)
        for i in range(n):
            t = i / (n - 1); c = [COL2, LIGHT][i % 2]; p = (s * 1.06, 0.72, 1.8 + (-2.0 - 1.8) * t)
            B.obj('row%d_%d' % (s > 0, i), bm_ico(0.05, 1, p), led(c))
            if i % 3 == 0: B.light(p[0], p[1], p[2], 0.45, c, led=1)
    B.strip((-0.8, 0.36, -2.3), (0.8, 0.36, -2.3), COL2, th=0.045); B.strip((-0.8, 0.36, 2.35), (0.8, 0.36, 2.35), COL2, th=0.045)
    # chrome tube bumpers that wrap the corners
    for zs, zc in ((1, 2.5), (-1, -2.52)):
        path = catmull([(1.1, 0.5, zc - zs * 0.45), (1.0, 0.5, zc - zs * 0.1), (0.62, 0.5, zc), (-0.62, 0.5, zc), (-1.0, 0.5, zc - zs * 0.1), (-1.1, 0.5, zc - zs * 0.45)], B.pick(14, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.055, B.pick(8, 6)), chrome())
    # exhaust tips with slime dribbling out, a slime splat on the deck
    for s in (1, -1):
        B.obj('exh_%d' % (s > 0), bm_closed_lathe([(0, -0.18), (0.085, -0.18), (0.1, 0.12), (0.115, 0.17), (0.08, 0.18), (0.075, 0.1), (0, 0.1)], B.pick(14, 8), AZn, (s * 0.32, 0.6, -2.52)), chrome())
        B.obj('exh_slime_%d' % (s > 0), bm_ico(0.06, 1, (s * 0.32, 0.56, -2.7)), M_slime)
        if not lo: B.obj('exh_drip_%d' % (s > 0), bm_rod((s * 0.32, 0.56, -2.7), (s * 0.34, 0.38, -2.72), 0.025, 6, r1=0.012), M_slime)
    B.obj('slime_splat', bm_lathe([(0, 0.0), (0.42, 0.0), (0.5, 0.012), (0.3, 0.03), (0, 0.035)], B.pick(20, 10), (0, 0.68, -2.1), rmod=lambda th, t: 1 + 0.12 * math.sin(th * 5 + 1) * t), M_slime)
    # headlights in chrome bezels on dark pods; tail lamps in chrome rings
    for s in (1, -1):
        hx = s * 0.7
        B.obj('lamp_pod_%d' % (s > 0), bm_box(0.36, 0.22, 0.22, (hx, 0.72, 2.27)), M_deck, bevel=B.pick(0.06, None), bevel_angle=False, segments=B.pick(2, 1))
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.13, 0.024, B.pick(14, 6), 3, AZ, (hx, 0.76, 2.39)), chrome())
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.11, 0.03, 0.11, B.pick(12, 6), B.pick(3, 2), (hx, 0.76, 2.385), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.76, 2.5, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.34, 0.12, 0.05, 0.014, B.pick(2, 1), B.pick(4, 3), at=(s * 0.7, 0.6, -2.445), axis=AZn), chrome())
        B.obj('tail_%d' % (s > 0), bm_box(0.3, 0.08, 0.04, (s * 0.7, 0.6, -2.44)), led('#ff1a2a'))
        B.light(s * 0.7, 0.6, -2.55, 0.9, '#ff2a3a', tail=1)

    # ================= the slug (part `slug`, joint at the origin: authored in car coordinates) =================
    SL = B.part('slug', (0, 0, 0))
    foot = B.obj('foot', bm_ellipsoid(FRX, FRY, FRZ, B.pick(36, 16), B.pick(14, 7), FOOT_AT), M_body, parent=SL); B.vcol(foot, slug_skin)
    nwave = 12
    def skirt(u, v):
        th = TAU * u; top = v < 0.5; t = v * 2 if top else 2 - v * 2
        y0, k0 = 0.97, math.sqrt(1 - ((0.97 - 0.78) / 0.42) ** 2)
        wave = math.sin(th * nwave + 0.4)
        rad = k0 + (1.02 - k0 + 0.03 * wave) * t
        y = y0 + (0.80 - y0) * t + 0.025 * wave * t * t - (0.0 if top else 0.04 * math.sin(t * math.pi))
        return (FRX * rad * math.cos(th), y, FRZ * rad * math.sin(th))
    sk = B.obj('skirt', surf_closed(B.pick(72, 40), B.pick(6, 3), skirt, wrap_u=True, wrap_v=True), M_body, parent=SL); B.vcol(sk, slug_skin)
    ma = B.obj('mantle', bm_ellipsoid(0.98, 0.58, 1.78, B.pick(30, 14), B.pick(12, 6), (0, 1.3, -0.5)), M_body, parent=SL); B.vcol(ma, slug_skin)
    neck = catmull([(0, 0.72, 1.25), (0, 0.9, 1.7), (0, 1.25, 2.1), (0, 1.6, 2.38), (0, 1.9, 2.5)], B.pick(12, 6))
    nr = [hermite([0, 0.25, 0.5, 0.75, 1.0], [0.62, 0.5, 0.45, 0.42, 0.36], i / (len(neck) - 1)) for i in range(len(neck))]
    nk = B.obj('neck', tube_along(neck, nr, B.pick(24, 10), sy=0.92), M_body, parent=SL); B.vcol(nk, slug_skin)
    hd = B.obj('head', bm_uv(HEAD_R, B.pick(28, 14), B.pick(14, 8), HEAD_AT), M_body, parent=SL); B.vcol(hd, slug_skin)
    def on_head(x, y, dz=0.02):
        d = HEAD_R ** 2 - (x - HEAD_AT[0]) ** 2 - (y - HEAD_AT[1]) ** 2
        return (x, y, HEAD_AT[2] + math.sqrt(max(0.0, d)) + dz)
    smile = [on_head(0.2 * math.cos(t), 1.78 + 0.11 * math.sin(t), 0.0) for t in [math.radians(d) for d in range(200, 341, 14 if lo else 7)]]
    B.obj('smile', tube_along(smile, 0.028, B.pick(6, 4)), M_smile, parent=SL)
    B.obj('tongue', bm_ellipsoid(0.07, 0.03, 0.05, B.pick(10, 6), B.pick(5, 3), on_head(0, 1.69, -0.01)), M_tongue, parent=SL)
    for s in (1, -1):
        B.obj('feeler_%d' % (s > 0), bm_rod(on_head(s * 0.2, 1.72, -0.06), (s * 0.5, 1.62, 3.15), 0.055, B.pick(8, 6), r1=0.018), M_body, parent=SL)
        if not lo: B.obj('feeler_tip_%d' % (s > 0), bm_uv(0.03, 8, 4, (s * 0.5, 1.62, 3.15)), M_bulb2, parent=SL)
    if not lo:
        for s in (1, -1): B.obj('cheek_%d' % (s > 0), bm_ellipsoid(0.09, 0.07, 0.025, 10, 5, on_head(s * 0.3, 1.86, -0.012)), glow('cheek', '#ff9ac8', strength=0.5, rough=0.3, coat=1.0), parent=SL)
        stripe = catmull([(0, 1.45, 2.47), (0, 1.75, 2.78), (0, 2.05, 2.95), (0, 2.3, 2.9), (0, 2.42, 2.7)], 12)
        B.obj('head_stripe', tube_along(stripe, 0.03, 6), chrome(), parent=SL)
        # wet highlights: a few glossy slime beads along the foot's flanks
        for s in (1, -1):
            for k in range(3):
                z = 1.2 - k * 1.1; y = 0.95 + 0.05 * math.sin(k * 2.1)
                x = s * FRX * math.sqrt(max(0.0, 1 - ((y - 0.78) / FRY) ** 2 - (z / FRZ) ** 2)) * 1.01
                B.obj('bead_%d_%d' % (s > 0, k), bm_ellipsoid(0.045, 0.06, 0.045, 7, 4, (x, y, z)), M_slime, parent=SL)
    # the jockey's saddle on the snail's back, in front of the shell (on the slug), and a chrome steering column
    sx_, sy_, sz_ = SEAT
    B.obj('saddle', bm_box(0.66, 0.12, 0.62, (sx_, sy_ - 0.22, sz_ - 0.05)), M_saddle, bevel=B.pick(0.05, None), bevel_angle=False, segments=B.pick(2, 1), parent=SL)
    B.obj('saddle_skirt', bm_box(0.6, 0.12, 0.56, (sx_, sy_ - 0.32, sz_ - 0.05)), M_body2, parent=SL)
    if not lo:
        for s in (1, -1): B.obj('stirrup_%d' % (s > 0), bm_torus(0.07, 0.014, 10, 4, AX, (s * 0.42, sy_ - 0.75, sz_ + 0.15)), chrome(), parent=SL)
    B.obj('column', bm_rod((0, 1.45, 1.5), (0, sy_ + 0.35, sz_ + 0.6), 0.04, L['rod']), chrome(), parent=SL)

    # ================= eye stalks (parts eyeL / eyeR, pivots on the head top; stalk rises +y, eyeball on top) =================
    for s, name in ((1, 'eyeL'), (-1, 'eyeR')):
        P = B.part(name, (s * 0.22, 2.3, 2.55))
        B.obj(name + '_stalk', bm_rod((0, -0.1, 0), (0, 0.9, 0), 0.075, B.pick(14, 8), r1=0.05), M_body, parent=P)
        if not lo:
            for k, y in enumerate((0.2, 0.42, 0.62)):
                B.obj(name + '_ring%d' % k, bm_torus(0.074 - k * 0.006, 0.014, 10, 4, AY, (0, y, 0)), M_body2, parent=P)
        B.eye((0, 1.0, 0), 0.17, iris='#2a1a3a', look=(s * 0.12, 0.05), parent=P, name=name + '_eye')
        B.obj(name + '_lid', bm_ellipsoid(0.185, 0.185, 0.185, B.pick(20, 10), B.pick(6, 4), (0, 1.0, 0), M=rot(pitch=0.45), phi1=0.95), M_body, parent=P)
        if not lo:
            for k, ph in enumerate((-0.5, 0.0, 0.5)):
                th = 1.35; d = Vector((math.sin(th) * math.sin(ph), math.cos(th), math.sin(th) * math.cos(ph)))
                b = Vector((0, 1.0, 0)) + d * 0.185; e = b + norm(d + Vector((0, 0.9, 0))) * 0.11
                B.obj(name + '_lash%d' % k, bm_rod(tuple(b), tuple(e), 0.012, 5, r1=0.004), M_lash, parent=P)

    # ================= the shell (part `shell`): pearl coil, glowing spine, chrome stripes, roundels, rockets =================
    SH = B.part('shell', SHELL_AT)
    nu, nv = B.pick(110, 48), B.pick(16, 10)
    coil = B.obj('shell_coil', surf_closed(nu, nv, lambda u, v: tuple(sp_pt(sp_a(u), TAU * v, ribs=not lo)), wrap_u=False, wrap_v=True), M_shell, parent=SH)
    B.vcol(coil, pearl)
    nst = B.pick(80, 32)
    spine = [tuple(sp_pt(sp_a(i / nst, 0.0, A_END - 0.75), 0.0, 0.004, ribs=not lo)) for i in range(nst + 1)]
    B.obj('shell_spine', tube_along(spine, [0.045 * (0.35 + 0.65 * sp_R(sp_a(i / nst, 0.0, A_END - 0.75)) / 1.25) for i in range(nst + 1)], B.pick(5, 4)), M_stripe, parent=SH)
    if not lo:
        for side in (1, -1):
            n2 = 60
            pts = [tuple(sp_pt(sp_a(i / n2, 0.05, A_END - 1.2), side * 0.6, 0.012, ribs=True)) for i in range(n2 + 1)]
            rads = [0.03 * (0.3 + 0.7 * sp_R(sp_a(i / n2, 0.05, A_END - 1.2)) / 1.25) for i in range(n2 + 1)]
            B.obj('shell_chrome_%d' % (side > 0), tube_along(pts, rads, 4), chrome(), parent=SH)
    for side in (1, -1):
        G = sp_glyph(0.95, side * math.pi / 2, 0.06, False)
        B.obj('roundel_%d' % (side > 0), surf_closed(B.pick(28, 14), B.pick(3, 2), lambda u, v, G=G: G(0.32 * v * math.cos(TAU * u), 0.32 * v * math.sin(TAU * u)), wrap_u=True), M_white, parent=SH)
        B.obj('roundel_wall_%d' % (side > 0), surf_closed(B.pick(28, 14), 1, lambda u, v, G=G: G(0.32 * math.cos(TAU * u), 0.32 * math.sin(TAU * u), 0.06 - 0.1 * v), wrap_u=True), M_white, parent=SH)
        nr_ = B.pick(24, 12)
        ring = [G(0.31 * math.cos(TAU * i / nr_), 0.31 * math.sin(TAU * i / nr_), 0.065) for i in range(nr_)]
        B.obj('roundel_ring_%d' % (side > 0), bm_tube(ring, 0.028, B.pick(5, 3), closed=True, ref=(1, 0, 0)), chrome(), parent=SH)
        bar = [G(-0.15 + 0.3 * k / 4, 0.17, 0.085) for k in range(5)]
        diag = [G(0.15 - 0.2 * k / 5, 0.17 - 0.35 * k / 5, 0.085) for k in range(6)]
        B.obj('seven_bar_%d' % (side > 0), tube_along(bar, 0.032, B.pick(6, 4)), M_stripe, parent=SH)
        B.obj('seven_diag_%d' % (side > 0), tube_along(diag, 0.032, B.pick(6, 4)), M_stripe, parent=SH)
    # twin turbo rockets: chrome barrels, flared nozzles with glowing cores, fins, struts
    for s in (1, -1):
        rx, ry, rz = s * 0.95, 0.75, -0.65
        prof = [(0, 0.64), (0.1, 0.62), (0.17, 0.52), (0.2, 0.4), (0.2, -0.45), (0.23, -0.56), (0.25, -0.66), (0.21, -0.66), (0.17, -0.58), (0, -0.58)]
        B.obj('rocket_%d' % (s > 0), bm_closed_lathe(prof if not lo else [prof[0], prof[2], prof[4], prof[6], prof[7], prof[9]], L['cyl_s'], AZ, (rx, ry, rz)), chrome(), parent=SH)
        B.obj('rocket_core_%d' % (s > 0), bm_ellipsoid(0.16, 0.16, 0.06, B.pick(12, 8), B.pick(4, 2), (rx, ry, rz - 0.6), M=AZn, phi1=math.pi / 2), M_nozzle, parent=SH)
        if not lo:
            for k, zz in enumerate((-0.3, 0.3)): B.obj('rocket_band_%d_%d' % (s > 0, k), bm_torus(0.2, 0.022, 12, 3, AZ, (rx, ry, rz + zz)), satin('rocket_purple', COL, 0.3), parent=SH)
            for k in range(3): B.obj('rocket_fin_%d_%d' % (s > 0, k), bm_fin(rx, ry, rz, TAU * (k / 3 + 0.25)), chrome(), parent=SH, smooth=False, bevel=0.008, segments=1)
            B.obj('rocket_glowring_%d' % (s > 0), bm_torus(0.235, 0.015, 16, 4, AZ, (rx, ry, rz - 0.66)), M_nozzle, parent=SH)
        B.obj('rocket_strut_%d' % (s > 0), bm_rod((s * 0.9, 0.88, -1.05), (s * 0.4, 1.3, -1.05), 0.035, L['rod']), chrome(), parent=SH)
        B.obj('rocket_strut2_%d' % (s > 0), bm_rod((s * 0.9, 0.88, -0.4), (s * 0.35, 1.6, -0.3), 0.035, L['rod']), chrome(), parent=SH)
    B.light(0, 2.45, -0.55, 2.4, LIGHT, big=1)
    for s in (1, -1): B.light(s * 0.95, 1.9, -1.85, 0.7, '#ff6a2a', led=1)

    # ================= chase lights (part `chase`, joint at the spiral's centre): bulbs on the spine, every slot ∝ R =================
    CC = (SHELL_AT[0], SHELL_AT[1] + 1.3, SHELL_AT[2])
    CH = B.part('chase', CC)
    for i in range(2, CHASE_N + 1, 1 if not lo else 2):
        a = i * CHASE_DA; R = sp_R(a); rho = R * (OFF + RR + 0.075)
        p = (0.0, math.sin(a) * rho, -math.cos(a) * rho)   # chase-local (the spiral centre is the origin)
        if lo: B.obj('chase_%d' % i, bm_ico(0.1 * R, 1, p), M_bulb if i % 4 else M_bulb2, parent=CH)
        else: B.obj('chase_%d' % i, bm_uv(0.1 * R, 7, 4, p), M_bulb if i % 2 else M_bulb2, parent=CH)

    # ================= the jockey's seat (body bone, like the driver), wheels, size info =================
    B.seat(sx_, sy_, sz_, col='#5a2a8a', accent=COL2, wheelY=sy_ + 0.42, wheelZ=sz_ + 0.62, tilt=0.5, column=False)
    B.wheels_pro(1.0, 1.7, -1.6, r=0.44, w=0.38, rim=COL2, tyre='#14121a', cap=LIGHT, stripe=LIGHT)
    top = SHELL_AT[1] + max(sp_pt(a, 0.0, 0.0, True).y for a in [k * 0.05 for k in range(0, 60)])
    B.info(5.6, 2.3, top + 0.1, muzzle=(0, 0.6, -2.6), wheelR=0.44, steerTilt=0.5, extra={'rockets': [[0.95, 1.9, -1.75], [-0.95, 1.9, -1.75]], 'sight': [round(top + 0.04, 2), SHELL_AT[2]]})
    B.body['rigV'] = 2

def bm_fin(rx, ry, rz, a):
    """A thin chrome fin on a rocket barrel (centre rx, ry, rz), rotated about the barrel axis (z) by a."""
    pts = [(0.19, -0.02), (0.19, 0.34), (0.3, 0.42), (0.34, -0.02)]
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

LEVEL_OV = {'hi': dict(bevel=3, cyl=24, torus=18, tube=6, arch=16, sph=20, ring=12), 'lo': dict(torus=10, tube=4, arch=8)}
if __name__ == '__main__':
    run('turbo_escargot', build, report=True, views=['side', 'high'], level_overrides=LEVEL_OV)
