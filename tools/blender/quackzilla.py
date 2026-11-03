# Quackzilla (Art Cart car #5): the bath toy that ate the bathtub. A giant glossy rubber duck afloat on a tub of
# bath water, ridden on its back. Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/quackzilla.py
# Writes assets/models/art-cart/quackzilla.glb (showroom, 20–30k tris) and quackzilla_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT, WATER = '#ffd21a', '#ff8a1a', '#ffe24a', '#2a8ad8'   # CART_CARS.duck palette + bath water
BEAK = '#ff7a12'

def eng(v):
    """Blender vector -> engine (x, y, z) tuple."""
    return (v.x, v.z, -v.y)

def catmull(pts, t):
    """Catmull-Rom through a list of equal-length tuples, t in 0..1 (clamped ends)."""
    n = len(pts); f = t * (n - 1); k = min(n - 2, max(0, int(math.floor(f)))); u = f - k
    p0 = pts[max(0, k - 1)]; p1 = pts[k]; p2 = pts[k + 1]; p3 = pts[min(n - 1, k + 2)]
    out = []
    for a, b, c, d in zip(p0, p1, p2, p3):
        out.append(0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u))
    return out

# the duck's body: (z, half-width, half-height, centre height) from the tail tip to the chest
BODY = [(-2.35, 0.0, 0.0, 2.55), (-2.2, 0.3, 0.22, 2.2), (-1.9, 0.62, 0.42, 1.85), (-1.45, 0.98, 0.68, 1.55),
        (-0.8, 1.25, 0.95, 1.5), (0.0, 1.32, 1.0, 1.5), (0.8, 1.25, 0.95, 1.52), (1.45, 1.0, 0.78, 1.6),
        (1.85, 0.6, 0.5, 1.7), (2.05, 0.0, 0.0, 1.75)]
def body_pt(s, v):
    """Engine point on the body: s = angle around the section (pi/2 = top), v = 0 tail tip .. 1 chest."""
    z, rx, ry, yc = catmull(BODY, v)
    sn = math.sin(s); sn = sn if sn > 0 else sn * 0.86     # a flatter belly (it floats)
    return (rx * math.cos(s), yc + ry * sn, z)

def surf_closed(nu, nv, fn):
    bm = bm_surf(nu, nv, fn, wrap_u=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def tube_along(pts, r, tseg):
    """A tube of radius r along a polyline in the car's symmetry plane (engine coords); open ends."""
    def fn(u, v):
        i = v * (len(pts) - 1); k = min(len(pts) - 2, int(i)); f = i - k
        p = [pts[k][j] + (pts[k + 1][j] - pts[k][j]) * f for j in range(3)]
        q0, q1 = pts[max(0, k - 1 if f < 0.5 else k)], pts[min(len(pts) - 1, k + 1 if f < 0.5 else k + 2)]
        ty, tz = q1[1] - q0[1], q1[2] - q0[2]; L = math.hypot(ty, tz) or 1.0; ty /= L; tz /= L
        ny, nz = tz, -ty                                     # perpendicular, in the plane
        a = TAU * u
        return (r * math.cos(a), p[1] + r * math.sin(a) * ny, p[2] + r * math.sin(a) * nz)
    return bm_surf(tseg, len(pts) - 1, fn, wrap_u=True)

def rrect_tube(a, b, rc, r, nu, tseg, y, flat=1.0):
    """A rounded-rectangle ring (half sizes a × b, corner radius rc) with a round tube r, at height y (a tub lip)."""
    def fn(u, v):
        t = TAU * (u + 0.5 / nu)
        cx = math.copysign(a - rc, math.cos(t)); cz = math.copysign(b - rc, math.sin(t))
        ang = TAU * v
        rr = rc + r * math.cos(ang)
        return (cx + math.cos(t) * rr, y + r * math.sin(ang) * flat, cz + math.sin(t) * rr)
    return bm_surf(nu, tseg, fn, wrap_u=True, wrap_v=True)

def build(B):
    L = B.L; lo = B.lo; body = B.body
    M_duck = paint('duck_vinyl', COL, coat=1.0, rough=0.25, metal=0.05)
    M_wing = paint('wing_vinyl', '#ffc81a', coat=1.0, rough=0.25, metal=0.05)
    M_beak = paint('beak_vinyl', BEAK, coat=1.0, rough=0.28, metal=0.05)
    M_water = paint('bath_water', WATER, coat=1.0, rough=0.18, metal=0.1)
    M_enamel = paint('tub_enamel', '#f6f7ff', coat=1.0, rough=0.2, metal=0.05)
    M_bubble = mat('bubble', '#eaf8ff', rough=0.12, metal=0.0, coat=1.0, emit='#d8f0ff', strength=1.2)
    M_ripple = glow('ripple', '#9ad8ff', strength=0.8, rough=0.2)
    M_pink = paint('party_pink', '#ff4fd8', coat=1.0, rough=0.3)
    M_white = paint('pompom_white', '#ffffff', coat=0.3, rough=0.5, metal=0.0)
    M_mouth = matte('mouth', '#4a1608', 0.8)
    cr = chrome()

    # ---- the bath: glossy blue water in a white enamel tub lip, chrome strip, dark chassis beneath ----
    B.obj('water', bm_box(2.5, 0.46, 4.4, (0, 0.67, 0)), M_water, bevel=0.17, bevel_angle=False)
    B.obj('tub_lip', rrect_tube(1.27, 2.22, 0.5, 0.085, B.pick(72, 28), B.pick(10, 5), 0.9), M_enamel)
    B.obj('tub_strip', rrect_tube(1.27, 2.22, 0.5, 0.04, B.pick(72, 28), B.pick(8, 4), 0.47), cr)
    B.obj('chassis', bm_box(1.7, 0.34, 3.7, (0, 0.3, 0)), matte('under', '#0e0e12'), bevel=0.06, bevel_angle=False)
    if not lo:
        for i, (R, sy, z) in enumerate(((1.1, 1.62, 0.0), (1.19, 1.75, -0.05))):
            B.obj('ripple_%d' % i, bm_torus(R, 0.014, 56, 4, AY, (0, 0.905, z), sy=sy), M_ripple)
        # bubbles floating on the water around the duck, a few rising by the tail and the tap
        for i in range(16):
            a = (i + 0.5) / 16 * TAU
            r = 0.08 + (i % 3) * 0.025
            B.obj('bubble_%d' % i, bm_ico(r, 1, (math.sin(a) * 1.08, 0.9 + r * 0.3, math.cos(a) * 1.98)), M_bubble)
        for i, (x, y, z, r) in enumerate(((0.5, 1.2, -2.0, 0.06), (-0.7, 1.45, -1.9, 0.045), (0.25, 1.7, -2.1, 0.035),
                                         (0.22, 1.08, 2.42, 0.05), (-0.3, 1.3, 2.3, 0.04))):
            B.obj('bubble_up_%d' % i, bm_ico(r, 1, (x, y, z)), M_bubble)
    # LED rows along the water line (the same rows the procedural car has; every 3rd bulb is a game light)
    B.leds((1.26, 0.6, 1.9), (1.26, 0.6, -1.9), B.pick(10, 5), [LIGHT, '#5ac8ff'], 0.055, 3)
    B.leds((-1.26, 0.6, 1.9), (-1.26, 0.6, -1.9), B.pick(10, 5), [LIGHT, '#5ac8ff'], 0.055, 3)
    # head/tail lamps hidden in the skirt
    B.lamps(0.85, 0.665, 2.2, -2.2, 0.665)

    # ---- the duck: a sculpted vinyl body with a moulding seam over the back, and a neck up to the head ----
    B.obj('duck_body', surf_closed(B.pick(48, 24), B.pick(34, 16), lambda u, v: body_pt(TAU * u + math.pi / 2, v)), M_duck)
    if not lo:
        pts = [body_pt(math.pi / 2, 0.02 + 0.96 * i / 44) for i in range(45)]
        B.obj('body_seam', tube_along(pts, 0.03, 6), M_duck)
    B.obj('neck', bm_ellipsoid(0.64, 0.44, 0.64, L['cyl'], B.pick(12, 6), (0, 2.3, 1.32)), M_duck)

    # ---- the wings: plump scalloped feathers hinged on the body sides (flap on boost: CART_GLB_PARTS.duck.wingL/R) ----
    wing = [(-0.16, 0.0), (-0.12, 0.26), (0.08, 0.44), (0.4, 0.52), (0.8, 0.47), (1.15, 0.32), (1.5, 0.06),
            (1.3, -0.08), (1.42, -0.24), (1.18, -0.3), (1.24, -0.46), (0.98, -0.48), (0.6, -0.5), (0.25, -0.42), (0.02, -0.26)]
    for name, s in (('wingL', 1), ('wingR', -1)):
        W = B.part(name, (s * 1.18, 1.7, -0.2))
        # the wing plane hugs the body's taper (tucks inward toward the tail) and stands proud of the vinyl
        at = (s * 0.2, 0.0, 0.0); Mw = rot(yaw=math.radians(90 + s * 16), roll=0.14)
        w = B.obj(name + '_feather', bm_profile(wing, 0.22, at, Mw), M_wing, parent=W)
        B.bevel(w, 0.105, angle=True, segments=L['prof_bev'], profile=0.55)
        if not lo:   # feather grooves: three soft ridges along the outer face of the wing
            d = 0.12 if eng(Mw @ E(0, 0, 0.12))[0] * s > 0 else -0.12
            wp = lambda px, py: eng(E(*at) + (Mw @ E(px, py, d)))
            for i, (x0, y0, x1, y1) in enumerate(((0.3, 0.26, 1.25, 0.16), (0.3, 0.0, 1.3, -0.1), (0.3, -0.26, 1.15, -0.34))):
                B.obj(name + '_groove_%d' % i, bm_rod(wp(x0, y0), wp(x1, y1), 0.022, 5), M_wing, parent=W)

    # ---- the head: ball + beak + eyes + party hat (bobs, tilts, yaws with steering: CART_GLB_PARTS.duck.head) ----
    H = B.part('head', (0, 2.55, 1.35))
    HC = (0, 0.65, 0.15)
    B.obj('head_ball', bm_uv(0.92, L['sph'], L['ring'], HC), M_duck, parent=H)
    if not lo: B.obj('head_seam', bm_torus(0.925, 0.024, 40, 6, AX, HC), M_duck, parent=H)
    # the bill: upper and lower, slightly agape over a dark mouth
    Mb = rot(pitch=-0.14)
    B.obj('bill_upper', bm_ellipsoid(0.5, 0.15, 0.5, L['cyl'], B.pick(12, 6), (0, 0.42, 1.08), Mb), M_beak, parent=H)
    B.obj('bill_lower', bm_ellipsoid(0.37, 0.085, 0.37, L['cyl'], B.pick(10, 6), (0, 0.21, 1.03), Mb), M_beak, parent=H)
    B.obj('mouth', bm_ellipsoid(0.34, 0.075, 0.34, L['cyl_s'], B.pick(8, 5), (0, 0.29, 1.04), Mb), M_mouth, parent=H)
    if not lo:
        for s in (1, -1): B.obj('nostril_%d' % (s > 0), bm_ico(0.028, 1, (s * 0.14, 0.56, 1.33)), M_mouth, parent=H)
    for s in (1, -1): B.eye((s * 0.42, 0.95, 0.78), 0.2, '#1a1a2a', (s * 0.3, 0.1), parent=H, name='eye_%d' % (s > 0))
    # party hat: pink cone tilted to the left, white band, polka dots, pompom
    hat_at = (0.15, 1.5, 0.05); Mh = rot(roll=-0.2)
    hp = lambda x, y, z: eng(E(*hat_at) + (Mh @ E(x, y, z)))
    B.obj('hat', bm_lathe([(0.28, 0), (0.26, 0.04), (0.02, 0.62), (0, 0.64)], B.pick(24, 10), hat_at, Mh), M_pink, parent=H)
    B.obj('hat_band', bm_torus(0.245, 0.022, B.pick(24, 10), B.pick(6, 4), Mh, hp(0, 0.1, 0)), M_white, parent=H)
    B.obj('pompom', bm_uv(0.085, B.pick(14, 8), B.pick(9, 5), hp(0, 0.66, 0)), M_white, parent=H)
    if not lo:
        for i in range(6):
            a = i / 6 * TAU + 0.4; h = 0.22 + (i % 3) * 0.12; r = 0.28 * (1 - h / 0.64) + 0.012
            B.obj('hat_dot_%d' % i, bm_ico(0.028, 1, hp(math.cos(a) * r, h, math.sin(a) * r)), M_white, parent=H)
    B.light(0, 3.1, 2.3, 1.6, LIGHT, big=1)

    # ---- the rider's perch: seat on the duck's back, chrome grab rails ----
    B.seat(0, 2.62, -0.25, col=COL2, accent='#5ac8ff', wheelY=2.98, wheelZ=0.38)
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_rod((s * 0.52, 2.72, -0.05), (s * 0.52, 2.72, 0.55), 0.03, L['rod']), cr)
        for z in (-0.02, 0.52): B.obj('rail_post_%d_%d' % (s > 0, z > 0), bm_rod((s * 0.52, 2.4, z), (s * 0.52, 2.72, z), 0.022, L['rod']), cr)
    B.obj('wheel_post', bm_rod((0, 2.42, 0.42), (0, 2.95, 0.5), 0.04, L['rod']), cr)

    # ---- hood ornament: a chrome bath tap with hot & cold handles; a drain plug and chain astern ----
    B.obj('tap_base', bm_cyl(0.13, 0.1, 0.18, L['cyl_s'], AY, (0, 0.99, 2.02)), cr, bevel=0.025)
    B.obj('tap_pipe', bm_rod((0, 1.06, 2.02), (0, 1.36, 2.02), 0.055, L['rod']), cr)
    B.obj('tap_spout', bm_torus(0.26, 0.055, B.pick(20, 8), L['tube'], AX, (0, 1.36, 2.28), sweep=(math.pi / 2, 3 * math.pi / 2)), cr)
    B.obj('tap_tip', bm_cyl(0.055, 0.075, 0.12, L['cyl_s'], AY, (0, 1.3, 2.54)), cr)
    B.obj('tap_drip', bm_ico(0.045, L['ico'], (0, 1.16, 2.54)), M_bubble)
    for s, c in ((1, '#ff2a3a'), (-1, '#2a7aff')):
        B.obj('tap_stem_%d' % (s > 0), bm_rod((0, 1.02, 2.02), (s * 0.24, 1.08, 2.02), 0.026, L['rod']), cr)
        B.obj('tap_knob_%d' % (s > 0), bm_uv(0.07, B.pick(12, 8), B.pick(8, 5), (s * 0.27, 1.08, 2.02)), paint('knob_' + c.lstrip('#'), c, coat=1.0, rough=0.25))
    B.obj('plug', bm_cyl(0.13, 0.11, 0.05, L['cyl_s'], AY, (0, 0.915, -1.8)), cr, bevel=0.012)
    B.obj('plug_ring', bm_torus(0.055, 0.012, B.pick(16, 8), B.pick(6, 4), AZ, (0, 0.98, -1.8)), cr)
    if not lo:
        for i in range(7):
            t = i / 6
            B.obj('chain_%d' % i, bm_torus(0.028, 0.009, 10, 4, AX if i % 2 else AY, (0, 1.0 + 0.0 * t, -1.86 - 0.36 * t)), cr)

    # ---- wheels and size info ----
    B.wheels(1.0, 1.5, -1.5, r=0.42, w=0.36, rim=COL2, cap='#5ac8ff')
    B.info(4.6, 2.6, 4.2, muzzle=(0, 3.0, 2.4), wheelR=0.42)

if __name__ == '__main__':
    run('quackzilla', build)
