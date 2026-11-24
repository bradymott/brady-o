# Burning Man prop: a pickup towing a polished-aluminium travel trailer (replaces BurnsProps.trailer: 12.6 m overall,
# trailer 7 x 2.4 x 2.9 centred at z = -2.6, the truck 5.2 m long centred at z = +3.6, front +Z).
# The trailer is a riveted "bullet": a superellipsoid shell in mirror-polished aluminium (the game's chrome gloss, so it
# reflects the real sky: blue by day, sunset gold, city glow at night), with rivet seams, a wrap-around front window
# under a stone guard, rounded side windows (some lit warm at night), a door with its own window, a grab handle and a
# step, a tandem axle under wheel skirts, an A-frame tongue with two propane bottles, a roof AC and vents, tail lights.
# The truck: rounded cab and bed, chrome grille and bumpers, glass, mirrors, wheels, head and tail lights.
# Materials `truck` (recoloured per seed by the game) and `skin` (the trailer's aluminium).
# Levels: hi (near) and lo (mid). Live Blender:  import runpy; runpy.run_path('<repo>/tools/blender/bm_trailer.py', run_name='__main__')
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

TZ, TL, TW, TH = -2.6, 7.0, 2.4, 2.9          # trailer centre z, length, width, roof height
Y0 = 0.58                                       # the shell's flat belly
KZ = 3.6                                        # truck centre z

def shell_pt(u, v, grow=0.0):
    """Trailer skin: u around the section (0 = belly centre, going up the left side), v along (0 = back, 1 = front)."""
    a = u * TAU
    ca, sa = math.cos(a), math.sin(a)
    n = 2.8
    sx = math.copysign(abs(sa) ** (2 / n), sa); sy = -math.copysign(abs(ca) ** (2 / n), ca)
    zt = (v - 0.5) * 2                          # -1 back .. 1 front
    m = 3.2 if zt < 0 else 2.6                  # the front end is a little rounder than the back
    k = max(0.0, 1 - abs(zt) ** m) ** (1 / m)   # plan + elevation taper toward the ends
    hy = (TH - Y0) / 2; cy = Y0 + hy
    x = sx * (TW / 2 + grow) * (0.25 + 0.75 * k)
    y = cy + sy * (hy + grow) * (0.35 + 0.65 * k)
    y = max(Y0 - grow, y)                       # flat belly
    z = TZ + zt * (TL / 2 + grow)
    return (x, y, z)

def build(B):
    L = B.L; lo = B.lo; slim(B, keep={'cab', 'bed', 'hood'})
    M_skin = metal('skin', '#dfe3ea', 0.16)               # polished aluminium: reflects the sky
    M_seam = metal('seam', '#9aa0aa', 0.3)
    M_glass = metal('glass', '#1a2232', 0.12)
    M_lit = led('#ffc070', 2.6)
    M_dark = matte('dark', '#22232a')
    M_truck = paint('truck', '#2a4a7a', coat=0.6, rough=0.3, metal=0.1)
    M_chrome = chrome()
    M_tyre = rubber(); M_rim = metal('rim', '#c8ccd4', 0.2)
    M_white = satin('propane', '#eeeeea', 0.45)
    # ---- the trailer shell ----
    nu, nv = B.pick((22, 14), (12, 8))
    B.obj('shell', bm_surf(nu, nv, lambda u, v: shell_pt(u, v), wrap_u=True, merge=True), M_skin)
    if not lo:
        # rivet seams: rings round the body every ~0.9 m, and two long seams along each side
        for i in range(1, 6):
            v = i / 6
            ring = [shell_pt(j / 18, v, 0.006) for j in range(18)]
            B.obj('seam_r%d' % i, bm_tube(ring, 0.008, 3, closed=True, caps=False), M_seam)
        for uu in (0.2, 0.8):
            pts = [shell_pt(uu, 0.06 + 0.88 * i / 14, 0.006) for i in range(15)]
            B.obj('seam_l%d' % int(uu * 100), bm_tube(pts, 0.008, 3, caps=False), M_seam)
    # ---- windows: a wrap-around front window under a stone guard, rounded side windows, the door ----
    def on_side(s, z, y, out=0.02):
        """A point on the trailer's side (s = +1 left, -1 right) at (y, z), pushed `out` metres off the skin."""
        v = (z - TZ) / TL + 0.5; best = None
        for j in range(60):
            uu = (0.02 + 0.46 * j / 59) if s > 0 else (0.52 + 0.46 * j / 59)
            p = shell_pt(uu, v)
            if best is None or abs(p[1] - y) < abs(best[1] - y): best = p
        return (best[0] + s * out, y, z)
    wins = [(1, -4.6, 1.0, False), (1, -2.4, 1.3, True), (1, -0.6, 0.9, False), (-1, -4.4, 1.0, True), (-1, -0.9, 0.8, False)]
    for k, (s, z, w, lit) in enumerate(wins):
        c = on_side(s, z, 1.95, 0.01)
        B.obj('win_%d' % k, bm_box(0.04, 0.55, w, c), M_lit if lit else M_glass, bevel=B.pick(0.12, None), bevel_angle=False)
        if not lo: B.obj('win_rim_%d' % k, bm_box(0.03, 0.63, w + 0.08, (c[0] - s * 0.01, c[1], c[2])), M_seam, bevel=0.14, bevel_angle=False)
    fz = TZ + TL / 2 - 0.55
    front = [shell_pt(u, (fz - TZ) / TL + 0.5, 0.012) for u in [0.3 + 0.4 * i / 8 for i in range(9)]]
    fr = [(p[0], 1.85 + (p[1] - 1.85) * 0.0, p[2] + 0.12) for p in front]
    B.obj('front_glass', bm_loft([[(p[0], 1.6, p[2] - 0.02) for p in front], [(p[0], 2.05, p[2] - 0.1) for p in front]], closed_u=False, caps=False), M_glass)
    if not lo:
        B.obj('stone_guard', bm_loft([[(p[0] * 1.02, 1.55, p[2] + 0.02) for p in front], [(p[0] * 1.02, 2.1, p[2] - 0.05) for p in front]], closed_u=False, caps=False), satin('guard', '#2a2c34', 0.5))
    # the door (on the right, -X, like the RV), its window, a grab handle and the fold-down step
    dc = on_side(-1, -3.4, 1.4, 0.012)
    B.obj('door', bm_box(0.04, 1.45, 0.7, (dc[0], 1.32, dc[2])), metal('door', '#cfd3da', 0.22), bevel=B.pick(0.1, None), bevel_angle=False)
    B.obj('door_win', bm_box(0.05, 0.3, 0.4, (dc[0] - 0.01, 1.72, dc[2])), M_lit, bevel=B.pick(0.08, None), bevel_angle=False)
    if not lo:
        B.obj('door_handle', bm_rod((dc[0] - 0.06, 1.0, dc[2] + 0.45), (dc[0] - 0.06, 1.6, dc[2] + 0.45), 0.018, 6), M_chrome)
        B.obj('step', bm_box(0.4, 0.06, 0.6, (dc[0] - 0.25, 0.4, dc[2])), M_dark, bevel=0.02, bevel_angle=False)
        B.obj('porch_light', bm_box(0.06, 0.1, 0.14, (dc[0] + 0.02, 2.15, dc[2] - 0.5)), led('#ffe0a8', 2.4))
    # wheels under skirts (tandem axle), the skirt line, tail lights, a bumper
    for z in (TZ - 0.45, TZ + 0.45):
        for s in (1, -1):
            B.obj('t_tyre_%d_%d' % (int(z * 10), s > 0), bm_cyl(0.36, 0.36, 0.22, B.pick(10, 8), AX, (s * (TW / 2 - 0.2), 0.36, z)), M_tyre, bevel=B.pick(0.07, None), segments=1)
            if not lo: B.obj('t_rim_%d_%d' % (int(z * 10), s > 0), bm_cyl(0.2, 0.2, 0.24, 10, AX, (s * (TW / 2 - 0.2), 0.36, z)), M_rim)
    for s in (1, -1):
        B.obj('skirt_%d' % (s > 0), bm_box(0.03, 0.22, 1.5, (s * (TW / 2 - 0.02), 0.72, TZ)), M_seam, bevel=B.pick(0.05, None), bevel_angle=False)
        B.obj('tail_%d' % (s > 0), bm_box(0.18, 0.12, 0.04, (s * 0.75, 0.85, TZ - TL / 2 + 0.12)), led('#ff2a2a', 2.5), bevel=B.pick(0.02, None))
    B.obj('t_bumper', bm_box(TW - 0.3, 0.1, 0.12, (0, 0.55, TZ - TL / 2 + 0.05)), M_seam)
    B.obj('t_frame', bm_box(TW - 0.4, 0.16, TL - 0.6, (0, 0.5, TZ)), M_dark)
    # roof: an AC shroud and two vents
    B.obj('t_ac', bm_box(0.75, 0.28, 0.85, (0, TH + 0.08, TZ - 0.6)), satin('ac', '#ececf0', 0.45), bevel=B.pick(0.08, None), bevel_angle=False)
    if not lo:
        for z in (TZ + 1.6, TZ - 2.4): B.obj('t_vent_%d' % int(z * 10), bm_box(0.4, 0.12, 0.4, (0.35, TH - 0.01, z)), satin('vent', '#c8c8cc'), bevel=0.03, bevel_angle=False)
    # the A-frame tongue, the coupler, two propane bottles with a cover, the jack
    tz0 = TZ + TL / 2
    for s in (1, -1): B.obj('tongue_%d' % (s > 0), bm_rod((s * 0.6, 0.5, tz0 - 0.2), (0, 0.5, tz0 + 1.0), 0.05, 4), M_dark)
    B.obj('coupler', bm_box(0.14, 0.12, 0.3, (0, 0.52, tz0 + 1.05)), M_dark)
    if not lo:
        for s in (1, -1): B.obj('propane_%d' % (s > 0), bm_capsule(0.16, 0.75, 10, 3, (s * 0.2, 0.95, tz0 + 0.35)), M_white)
        B.obj('jack', bm_rod((0.0, 0.05, tz0 + 0.75), (0.0, 0.9, tz0 + 0.75), 0.035, 6), M_dark)
    # ---- the pickup ----
    def tb(name, w, h, d, at, bev, m=M_truck): return B.obj(name, bm_box(w, h, d, at), m, bevel=bev, bevel_angle=False)
    tb('bed', 2.1, 0.62, 2.3, (0, 0.98, KZ - 1.4), 0.12)
    tb('hood', 2.0, 0.62, 1.55, (0, 0.98, KZ + 1.75), 0.22)
    tb('cab', 1.98, 1.3, 1.55, (0, 1.3, KZ + 0.3), 0.3)
    if not lo:
        B.obj('bed_floor', bm_box(1.86, 0.05, 2.1, (0, 1.12, KZ - 1.4)), M_dark)
    B.obj('k_frame', bm_box(1.7, 0.3, 5.0, (0, 0.55, KZ)), M_dark)
    # glass: windscreen, side and back windows
    B.obj('k_screen', bm_box(1.7, 0.5, 0.04, (0, 1.62, KZ + 1.06), M=rot(pitch=-0.35)), M_glass, bevel=B.pick(0.03, None))
    for s in (1, -1): B.obj('k_side_%d' % (s > 0), bm_box(0.03, 0.42, 1.05, (s * 1.0, 1.65, KZ + 0.35)), M_glass, bevel=B.pick(0.03, None))
    B.obj('k_back', bm_box(1.5, 0.4, 0.03, (0, 1.65, KZ - 0.46)), M_glass)
    # grille, bumpers, lamps
    B.obj('grille', bm_box(1.5, 0.36, 0.05, (0, 0.98, KZ + 2.53)), M_chrome, bevel=B.pick(0.03, None))
    for z, nm in ((KZ + 2.62, 'k_bump_f'), (KZ - 2.6, 'k_bump_r')): B.obj(nm, bm_box(2.1, 0.2, 0.16, (0, 0.62, z)), M_chrome, bevel=B.pick(0.06, None))
    for s in (1, -1):
        B.obj('k_head_%d' % (s > 0), bm_box(0.3, 0.16, 0.04, (s * 0.72, 1.02, KZ + 2.54)), lens(), bevel=B.pick(0.02, None))
        B.obj('k_tail_%d' % (s > 0), bm_box(0.12, 0.3, 0.04, (s * 0.95, 1.0, KZ - 2.56)), led('#ff2a2a', 2.5))
        if not lo:
            B.obj('k_mirror_%d' % (s > 0), bm_box(0.06, 0.22, 0.16, (s * 1.18, 1.62, KZ + 0.95)), M_dark, bevel=0.02)
            B.obj('k_marm_%d' % (s > 0), bm_rod((s * 0.98, 1.55, KZ + 0.95), (s * 1.16, 1.6, KZ + 0.95), 0.015, 4), M_dark)
    # truck wheels (arches cut into the bed and the hood at the near level)
    for z in (KZ + 1.7, KZ - 1.7):
        for s in (1, -1):
            B.obj('k_tyre_%d_%d' % (int(z * 10), s > 0), bm_cyl(0.4, 0.4, 0.28, B.pick(12, 8), AX, (s * 0.92, 0.4, z)), M_tyre, bevel=B.pick(0.08, None))
            if not lo: B.obj('k_rim_%d_%d' % (int(z * 10), s > 0), bm_cyl(0.22, 0.22, 0.3, 10, AX, (s * 0.92, 0.4, z)), M_rim)
    # (the trailer hitch ball meets the coupler)
    B.obj('hitch', bm_box(0.12, 0.12, 0.5, (0, 0.52, KZ - 2.75)), M_dark)

def shade(x, y, z, nx, ny, nz, m):
    r, g, b = dusty(0.85, col=(0.82, 0.74, 0.62))(x, y, z, nx, ny, nz, m)
    if m == 'skin' and ny > 0.75: r, g, b = r * 0.94, g * 0.92, b * 0.88     # dust settled on the roof
    return r, g, b

if __name__ == '__main__':
    run_prop('trailer', build, bake=dict(ao_dist=0.4, ao_k=0.6, rays=12, shade_fn=shade), max_tris={'hi': 6000, 'lo': 900},
             views=[((0.9, -0.6, 0.35), 'front'), ((-0.9, 0.7, 0.35), 'rear')])
