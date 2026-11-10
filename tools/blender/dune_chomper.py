# Dune Chomper (Art Cart car #11): a cruising land shark. Swims through sand, bites through bumpers.
# Quality-bar rebuild (rigV 2): a sculpted countershaded hull in clear-coat steel blue with a baked spine-to-flank
# vertex-colour gradient and a white belly, recessed gills with chrome lips, hooded mean eyes, a chrome upper lip with
# white enamel teeth, a rounded gunmetal chassis tub with chrome flares and wrap-around tube bumpers, premium wheels,
# chrome side pipes, an LED spine stripe and blue underglow. The fins are lofted airfoils (thick at the root, so the
# dorsal reads as a fin from the chase camera instead of a thin pole), raked back and lower than before.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/dune_chomper.py', run_name='__main__')
# Writes assets/models/art-cart/dune_chomper.glb (showroom, <= 30k tris) and dune_chomper_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['shark:2'] in src/43_cart_bb_glb.js):
#   part_jaw            the lower jaw, hinged at the throat (chomps; wide open when firing)
#   part_tail           tail stock + caudal fin, joint at the chrome collar (sweeps side to side)
#   part_dorsal         the dorsal fin, joint at its root (flexes)
#   part_pecL / pecR    the pectoral fins, joint at their roots (paddle)
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#4a82b8', '#f2f5f9', '#38c8ff'   # a bluer steel than CART_CARS.shark's #6a8ab0 (it read lavender at night)
MOUTH, GILL = '#c82a4a', '#22344c'
FLOOR = 1.18            # the mouth roof (the upper lip line): the snout's underside is flat here
BREAK = 0.0             # section angle (rad, 0 = the left flank) of the colour break between back and belly
DORSAL_AT = (0.0, 2.3, -0.85)   # the dorsal fin's joint (root centre)
TAIL_AT = (0.0, 1.6, -2.6)

# ---------------- small helpers ----------------
def eng(v): return (v.x, v.z, -v.y)
def norm3(v):
    l = math.sqrt(sum(c * c for c in v)) or 1.0; return tuple(c / l for c in v)
def add3(a, b, k=1.0): return tuple(a[i] + b[i] * k for i in range(3))
def cone(r, length, at, direction, seg):
    """A tooth: a cone of base radius r pointing along `direction` from its base at `at`."""
    d = norm3(direction); c = add3(at, d, length / 2)
    return bm_cyl(r, 0.0, length, seg, aim(d), c)
def naca(u):
    """Normalised symmetric airfoil half-thickness (1 at its fattest, ~0.3 of the chord back), u = 0 leading .. 1 trailing."""
    u = min(max(u, 0.0), 1.0)
    return max(0.0, 0.2969 * math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4) / 0.06
def bm_fin(le, te, thick, normal, n_span, n_ring):
    """A lofted airfoil fin: le(u) / te(u) give the leading / trailing edge points (engine tuples) for u = 0 root .. 1 tip
    (they meet at the tip, which becomes a single welded vertex), thick(u) the root-to-tip maximum half-thickness and
    normal(u) the thickness direction. The root ring gets a fan cap (it is buried in the body)."""
    rings = []
    for i in range(n_span + 1):
        u = i / n_span; a, b = Vector(le(u)), Vector(te(u))
        if i == n_span: rings.append([tuple((a + b) / 2)]); continue
        n = Vector(normal(u)).normalized(); T = thick(u); ring = []
        for j in range(n_ring):
            ang = TAU * j / n_ring; uc = (1 + math.cos(ang)) / 2; side = 1 if math.sin(ang) >= 0 else -1
            ring.append(tuple(a + (b - a) * uc + n * (side * T * naca(uc))))
        rings.append(ring)
    return bm_loft(rings, closed_u=True, caps=True)

# ---------------- the body surface: a sharky countershaded hull along z (tail -> nose) ----------------
# (z, half-width, half-height, centre height): fuller mid-body, a flattened wedge of a head, a tapering tail stock
BODY = [(-2.75, 0.0, 0.0, 1.6), (-2.6, 0.36, 0.34, 1.6), (-2.1, 0.5, 0.48, 1.58), (-1.5, 0.74, 0.7, 1.56),
        (-0.7, 1.0, 0.88, 1.55), (0.1, 1.05, 0.9, 1.55), (0.9, 1.0, 0.84, 1.54), (1.5, 0.92, 0.7, 1.5),
        (2.0, 0.82, 0.5, 1.45), (2.4, 0.64, 0.33, 1.4), (2.68, 0.36, 0.17, 1.35), (2.85, 0.0, 0.0, 1.31)]
def sec(v): return catmull_at(BODY, v)
def floor_y(z):
    """The mouth roof height: flat at FLOOR under the snout, fading away behind the jaw hinge (no clamp)."""
    return FLOOR - 0.7 * sstep((1.3 - z) / 0.7)
def belly(th): return 1 - 0.12 * max(0.0, -math.sin(th))
def raw_pt(th, v):
    z, rx, ry, yc = sec(v)
    return (rx * math.cos(th), yc + ry * math.sin(th) * belly(th), z)
def body_pt(th, v):
    x, y, z = raw_pt(th, v)
    return (x, max(y, floor_y(z)), z)
def body_n(th, v):
    e = 1e-3
    a, b = body_pt(th + e, v), body_pt(th - e, v); c, d = body_pt(th, min(1, v + e)), body_pt(th, max(0, v - e))
    t1 = (a[0] - b[0], a[1] - b[1], a[2] - b[2]); t2 = (c[0] - d[0], c[1] - d[1], c[2] - d[2])
    n = (t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0])
    p = body_pt(th, v); yc = sec(v)[3]
    if n[0] * p[0] + n[1] * (p[1] - yc) < 0: n = (-n[0], -n[1], -n[2])
    return norm3(n)
def v_of_z(z):
    """Invert the z of the BODY spline (monotonic) by bisection."""
    lo, hi = 0.0, 1.0
    for _ in range(40):
        m = (lo + hi) / 2
        if sec(m)[0] < z: lo = m
        else: hi = m
    return (lo + hi) / 2
def on_body(th, z, out=0.0):
    v = v_of_z(z); return add3(body_pt(th, v), body_n(th, v), out)
def side_th(s, a):
    """Section angle `a` off the flank on side s (+1 left, -1 right), mirrored."""
    return a if s > 0 else math.pi - a
def lip_x(z):
    """Half-width of the flat mouth roof at z (where the section crosses the floor), 0 where there is none."""
    _, rx, ry, yc = sec(v_of_z(z)); f = floor_y(z)
    if ry <= 1e-4 or f <= yc - ry * 0.88: return 0.0
    s = (yc - f) / (ry * 0.88)
    return rx * math.sqrt(max(0.0, 1 - s * s))
def lip_curve(n, z_back=1.45, z_front=2.585, inset=0.0, y=FLOOR):
    """Points along the upper lip (the mouth roof's edge), left to right, nose at the middle."""
    out = []
    for k in range(n):
        t = (k / (n - 1) - 0.5) * 2
        z = z_back + (z_front - z_back) * (1 - t * t)
        out.append((-t * max(0.0, lip_x(z) - inset), y, z))
    return out

def bm_hull(nu, nv):
    """The closed body surface. Faces carry material indices: 0 back, 1 belly, 2 mouth roof. The colour break row is
    dented inward for a crisp crease; the angle list is built so the break lands exactly on a vertex row."""
    brk = (BREAK % TAU, (math.pi - BREAK) % TAU)
    angs = sorted(set([TAU * j / nu for j in range(nu)] + list(brk)))
    bm = bmesh.new(); rows = []; tags = []
    for i in range(nv + 1):
        v = i / nv; z, rx, ry, yc = sec(v)
        if rx < 1e-4:
            rows.append([bm.verts.new(E(0, yc, z))]); tags.append(None); continue
        row = []; tag = []
        for th in angs:
            p = body_pt(th, v); r = raw_pt(th, v)
            if th in brk and r[1] > floor_y(z) + 0.02:     # the crease: pull the break row in a touch
                p = add3(p, body_n(th, v), -0.022)
            row.append(bm.verts.new(E(*p)))
            mouth = r[1] < floor_y(z) + 0.015
            below = math.sin(th) < math.sin(BREAK) - 1e-6
            tag.append(2 if mouth else (1 if below else 0))
        rows.append(row); tags.append(tag)
    na = len(angs)
    for i in range(nv):
        A, Bq = rows[i], rows[i + 1]
        for j in range(na):
            a0 = A[j % len(A)]; a1 = A[(j + 1) % len(A)]; b0 = Bq[j % len(Bq)]; b1 = Bq[(j + 1) % len(Bq)]
            vs = []
            for vv in (a0, b0, b1, a1):
                if vv not in vs: vs.append(vv)
            if len(vs) < 3: continue
            f = bm.faces.new(vs)
            ts = [t[j] for t in (tags[i], tags[i + 1]) if t] + [t[(j + 1) % na] for t in (tags[i], tags[i + 1]) if t]
            f.material_index = 2 if ts.count(2) >= 2 else (1 if ts.count(1) >= 2 else 0)
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def skin_col(x, y, z, yc=1.55):
    """The shark's paint gradient (multiplies the material colour): a deep blue spine fading to the bright steel flank,
    a cool white belly, a touch darker toward the tail."""
    t = sstep((y - yc - 0.05) / 0.8); tail = 0.93 + 0.07 * sstep((z + 2.6) / 2.0)
    if y < yc - 0.02: return (0.97 * tail, 0.98 * tail, 1.0 * tail)
    return ((1 - 0.42 * t) * tail, (1 - 0.3 * t) * tail, (1 - 0.14 * t) * tail)
def chassis_ring(z, w, h, r, seg, yc):
    return [(x, yc + y, z) for x, y in rrect_pts(w, h, r, seg)]

def build(B):
    L = B.L; lo = B.lo
    B.export_try = VCOL_EXPORT
    M_back = paint('shark_back', COL, coat=1.0, rough=0.24, metal=0.25)
    M_belly = paint('shark_belly', COL2, coat=1.0, rough=0.26, metal=0.05)
    M_mouth = paint('shark_mouth', MOUTH, coat=0.8, rough=0.4, metal=0.0)
    M_mouth_d = paint('shark_mouth_d', '#8e1c36', coat=0.8, rough=0.45, metal=0.0)
    M_gill = matte('gill', GILL, 0.8)
    M_slit = matte('gill_slit', '#081018', 0.9)
    M_eye = mat('eye_black', '#07070c', rough=0.06, metal=0.3, coat=1.0)
    M_lid = paint('shark_lid', '#2f5a88', coat=1.0, rough=0.26, metal=0.25)
    M_tooth = paint('tooth_enamel', '#fbf8ee', coat=1.0, rough=0.18, metal=0.0)
    M_chassis = paint('chassis_gunmetal', '#1b2838', coat=1.0, rough=0.22, metal=0.4)
    M_under = matte('under', '#0b0f15', 0.85)
    cr, dcr = chrome(), dark_chrome()
    led_c, led_w = led(LIGHT), led('#ffffff')
    seg_t = B.pick(8, 5)

    # ---- chassis: a rounded gunmetal tub (lofted sections, soft nose and tail), arches, chrome flares, underglow ----
    cs = B.pick(5, 2)
    # the nose is lower than the rest, so the chomping jaw has room to drop open above it
    rings = [chassis_ring(2.42, 1.7, 0.22, 0.09, cs, 0.52), chassis_ring(2.34, 2.02, 0.3, 0.13, cs, 0.53), chassis_ring(2.18, 2.2, 0.32, 0.14, cs, 0.54),
             chassis_ring(1.15, 2.2, 0.32, 0.14, cs, 0.54), chassis_ring(0.55, 2.2, 0.42, 0.17, cs, 0.62)]
    if not lo: rings += [chassis_ring(-0.6, 2.2, 0.42, 0.17, cs, 0.62)]
    rings += [chassis_ring(-2.18, 2.2, 0.42, 0.17, cs, 0.62), chassis_ring(-2.34, 2.02, 0.38, 0.15, cs, 0.62), chassis_ring(-2.42, 1.7, 0.26, 0.11, cs, 0.62)]
    tub = B.obj('chassis', bm_loft(rings[::-1], closed_u=True, caps=True), M_chassis)
    for i, (x, z) in enumerate([(1.0, 1.75), (-1.0, 1.75), (1.0, -1.75), (-1.0, -1.75)]):
        B.cut([tub], bm_cyl(0.6, 0.6, 0.9, L['arch'], AX, (x * 1.1, 0.46, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.615, 0.032, L['torus'], B.pick(4, 3), AX, (math.copysign(1.105, x), 0.46, z), sweep=(math.pi / 2, 3 * math.pi / 2)), cr)
    B.obj('chassis_under', bm_box(1.7, 0.08, 4.2, (0, 0.41, 0)), M_under)
    for s in (1, -1):
        B.leds((s * 1.115, 0.66, 1.0), (s * 1.115, 0.66, -1.0), B.pick(7, 4), [LIGHT, '#ffffff'], 0.045, 3, prefix='side%d' % (s > 0))
        if not lo: B.obj('sill_%d' % (s > 0), bm_tube([(s * 1.112, 0.76, 1.12), (s * 1.112, 0.76, -1.12)], 0.016, 6), cr)
        B.strip((s * 0.95, 0.4, 1.1), (s * 0.95, 0.4, -1.1), LIGHT, th=0.04)
        B.light(s * 0.9, 0.3, 0.0, 2.2, LIGHT, led=1)
    B.strip((-0.7, 0.4, 2.2), (0.7, 0.4, 2.2), LIGHT, th=0.04); B.strip((-0.7, 0.4, -2.2), (0.7, 0.4, -2.2), LIGHT, th=0.04)
    # chrome tube bumpers wrapping the corners
    for zs, zc, by in ((1, 2.52, 0.4), (-1, -2.52, 0.52)):
        path = catmull([(1.08, by, zc - zs * 0.4), (0.98, by, zc - zs * 0.08), (0.62, by, zc), (-0.62, by, zc), (-0.98, by, zc - zs * 0.08), (-1.08, by, zc - zs * 0.4)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.06, B.pick(10, 6)), cr)
        if not lo:
            for s in (1, -1): B.obj('overrider_%d_%d' % (zs > 0, s > 0), bm_capsule(0.045, 0.26, 8, 2, (s * 0.36, by + 0.04, zc + zs * 0.02)), cr)
    # bezelled headlights in the nose, chrome-ringed tail bars
    for s in (1, -1):
        hx = s * 0.68
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.05), (0.12, -0.04), (0.13, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.56, 2.4)), dcr)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.125, 0.022, L['torus'], B.pick(4, 3), AZ, (hx, 0.56, 2.415)), cr)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.105, 0.03, 0.105, L['cyl_s'], B.pick(5, 2), (hx, 0.56, 2.41), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.56, 2.52, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.4, 0.12, 0.05, 0.014, B.pick(4, 1), 4, at=(s * 0.66, 0.66, -2.415), axis=AZn), cr)
        B.obj('tail_%d' % (s > 0), bm_box(0.36, 0.09, 0.04, (s * 0.66, 0.66, -2.41)), led('#ff1a2a'))
        B.light(s * 0.66, 0.66, -2.52, 0.9, '#ff2a3a', tail=1)

    # ---- the hull: back / belly / mouth roof on one sculpted surface, painted with the spine gradient ----
    hull = B.obj('hull', bm_hull(B.pick(44, 20), B.pick(36, 16)), [M_back, M_belly, M_mouth])
    B.vcol(hull, skin_col)
    # the crease: a thin chrome bead along the colour break on both flanks, with rivets (hi)
    for s in (1, -1):
        th = side_th(s, BREAK)
        pts = [on_body(th, z, 0.0) for z in [-2.45 + 4.75 * k / 24 for k in range(25)] if raw_pt(th, v_of_z(z))[1] > floor_y(z) + 0.03]
        if lo: pts = pts[::3]
        B.obj('bead_%d' % (s > 0), bm_tube(pts, 0.016, B.pick(6, 4)), cr)
        if not lo:
            for k, z in enumerate((-2.0, -1.3, -0.6, 0.1, 0.8, 1.5)):
                B.obj('rivet_%d_%d' % (s > 0, k), bm_ico(0.022, 1, on_body(th, z, 0.012)), cr)
    # racing stripe down the spine: a blue LED bead flanked by white pinstripes (hi), snout to seat, and behind the fin
    for k, (z0, z1) in enumerate(((2.5, 0.78), (-1.95, -2.5))):
        zs = [z0 + (z1 - z0) * j / 16 for j in range(17)]
        if lo: zs = zs[::2]
        B.obj('spine_led_%d' % k, bm_tube([on_body(math.pi / 2, z, 0.012) for z in zs], 0.024, B.pick(6, 4)), led_c)
        if not lo:
            for s in (1, -1):
                B.obj('pin_%d_%d' % (k, s > 0), bm_tube([on_body(math.pi / 2 + s * 0.11, z, 0.004) for z in zs], 0.012, 4), M_belly)
    # lateral line: blue bulbs along the flanks (a game light on one of them per side)
    n = B.pick(7, 3)
    for s in (1, -1):
        for i in range(n):
            p = on_body(side_th(s, 0.1), 0.9 - 2.6 * i / (n - 1), 0.03)
            B.obj('lat_%d_%d' % (s > 0, i), bm_ico(0.042, 1, p), led_c)
            if i == 1: B.light(p[0], p[1], p[2], 0.45, LIGHT, led=1)

    # ---- gills: three recessed slits per side, curved, each with a chrome lip behind it and a raised rim (hi) ----
    ng = B.pick(9, 5)
    for s in (1, -1):
        for i in range(3):
            z0 = 1.0 - i * 0.22
            arc = []; lip = []; rim = []
            for k in range(ng):
                t = k / (ng - 1); a = (t - 0.5) * 0.56; bul = 0.07 * (1 - (2 * t - 1) ** 2)
                arc.append(on_body(side_th(s, a), z0 + bul, -0.006))
                lip.append(on_body(side_th(s, a), z0 + bul - 0.045, 0.006))
                rim.append(on_body(side_th(s, a * 1.1), z0 + bul * 1.1 + 0.035, 0.003))
            B.obj('gill_%d_%d' % (s > 0, i), bm_tube(arc, 0.028, B.pick(6, 4)), M_slit)
            B.obj('gill_lip_%d_%d' % (s > 0, i), bm_tube(lip, 0.014, B.pick(5, 3)), cr)
            if not lo: B.obj('gill_rim_%d_%d' % (s > 0, i), bm_tube(rim, 0.011, 4), M_gill)
    # jaw axle across the throat with hex bolts
    B.obj('axle', bm_cyl(0.06, 0.06, 1.3, L['cyl_s'], AX, (0, 1.12, 1.25)), dcr)
    for s in (1, -1): B.obj('axle_bolt_%d' % (s > 0), bm_cyl(0.085, 0.085, 0.07, 6, AX, (s * 0.68, 1.12, 1.25)), cr, flat=True)

    # ---- the face: hooded mean eyes, chrome upper lip with white teeth, a chrome nose with the blue nose light ----
    for s in (1, -1):
        e = (s * 0.72, 1.85, 1.75)
        B.obj('eye_%d' % (s > 0), bm_ellipsoid(0.14, 0.15, 0.11, B.pick(16, 10), B.pick(9, 5), e), M_eye)
        B.obj('glint_%d' % (s > 0), bm_uv(0.032, B.pick(8, 6), B.pick(5, 3), (s * 0.78, 1.91, 1.84)), led_w)
        lid_at = (s * 0.7, 1.9, 1.74); Ml = aim((-s * 0.55, 1.0, 0.25)); rx, ry, rz, ph = 0.19, 0.2, 0.16, 1.25
        B.obj('lid_%d' % (s > 0), bm_ellipsoid(rx, ry, rz, B.pick(20, 10), B.pick(7, 4), lid_at, M=Ml, phi1=ph), M_lid)
        if not lo:   # dark chrome liner around the lid's brim
            brim = [eng(Matrix.Translation(E(*lid_at)) @ Ml @ Vector((rx * math.sin(ph) * math.cos(a), rz * math.sin(ph) * math.sin(a), ry * math.cos(ph)))) for a in [TAU * k / 16 for k in range(17)]]
            B.obj('liner_%d' % (s > 0), bm_tube(brim, 0.016, 5, caps=False), dcr)
    B.obj('upper_lip', bm_tube(lip_curve(B.pick(29, 13), y=FLOOR + 0.012), 0.032, seg_t), cr)
    nt = B.pick(11, 5)
    for i, p in enumerate(lip_curve(nt, z_back=1.85, inset=0.07, y=FLOOR + 0.02)):
        sz = 1.0 - 0.25 * abs(i / (nt - 1) - 0.5) * 2
        B.obj('tooth_u_%d' % i, cone(0.06 * sz, 0.2 * sz, p, (0, -1, 0.06), B.pick(8, 5)), M_tooth)
    B.obj('nose_cone', bm_closed_lathe([(0, -0.15), (0.115, -0.15), (0.11, -0.02), (0.07, 0.1), (0.0, 0.15)], B.pick(16, 8), AZ, (0, 1.33, 2.86)), cr)
    B.obj('nose_ring', bm_torus(0.118, 0.02, B.pick(16, 8), B.pick(6, 4), AZ, (0, 1.33, 2.72)), dcr)
    B.obj('nose_led', bm_uv(0.05, B.pick(10, 6), B.pick(6, 4), (0, 1.33, 3.02)), led_c)
    B.light(0, 1.2, 2.9, 1.8, LIGHT, big=1)

    # ---- the lower jaw (part `jaw`, hinged at the back; the pose fn pitches the front down) ----
    J = B.part('jaw', (0, 1.12, 1.25))
    JC, JRX, JRZ = 0.66, 0.68, 0.72     # the jaw's centre z and radii (local)
    js = B.obj('jaw_shell', bm_ellipsoid(JRX, 0.2, JRZ, B.pick(32, 14), B.pick(8, 4), (0, -0.05, JC), phi0=math.pi / 2), M_belly, parent=J)
    B.vcol(js, lambda x, y, z: (0.9 + 0.1 * sstep((y + 0.25) / 0.2),) * 2 + (0.95 + 0.05 * sstep((y + 0.25) / 0.2),))
    B.obj('jaw_top', bm_ellipsoid(JRX - 0.02, 0.015, JRZ - 0.02, B.pick(32, 14), 4, (0, -0.045, JC)), M_mouth_d, parent=J)
    B.obj('tongue', bm_ellipsoid(0.46, 0.075, 0.6, B.pick(20, 10), B.pick(5, 3), (0, -0.03, JC - 0.04), phi1=math.pi / 2), M_mouth, parent=J)
    if not lo: B.obj('tongue_groove', bm_tube([(0, 0.046 - 0.012 * (k / 6) ** 2, 0.2 + 0.85 * k / 6) for k in range(7)], 0.01, 4), M_mouth_d, parent=J)
    nr = B.pick(25, 9)
    rim = [(JRX * math.sin(a), 0.0, JC + JRZ * math.cos(a)) for a in [(k / (nr - 1) - 0.5) * 3.0 for k in range(nr)]]
    B.obj('lower_lip', bm_tube(rim, 0.032, seg_t), cr, parent=J)
    nt = B.pick(10, 6)
    for i in range(nt):
        a = (i / (nt - 1) - 0.5) * 2.3; sz = 1.0 - 0.25 * abs(i / (nt - 1) - 0.5) * 2
        B.obj('tooth_l_%d' % i, cone(0.056 * sz, 0.18 * sz, ((JRX - 0.07) * math.sin(a), 0.0, JC + (JRZ - 0.07) * math.cos(a)), (0, 1, 0.05), B.pick(8, 5)), M_tooth, parent=J)
    if not lo:   # chrome rub strips along the jaw's flanks
        for s in (1, -1):
            B.obj('jaw_strip_%d' % (s > 0), bm_tube([(s * (JRX * 0.97 * math.sqrt(max(0.0, 1 - ((zz - JC) / JRZ) ** 2)) + 0.004), -0.1, zz) for zz in (0.2, 0.4, 0.6, 0.8, 1.0)], 0.012, 4), cr, parent=J)

    # ---- dorsal fin (part `dorsal`): a raked, falcate airfoil, thick at the root so it reads as a fin from behind;
    #      chrome leading edge, glowing trailing edge and tip. Its root is buried in the back so it can flex. ----
    D = B.part('dorsal', DORSAL_AT)
    dle = [(0, -0.22, 0.55), (0, 0.1, 0.38), (0, 0.4, 0.02), (0, 0.6, -0.48), (0, 0.7, -0.92)]
    dte = [(0, -0.22, -0.78), (0, 0.08, -0.8), (0, 0.36, -0.72), (0, 0.58, -0.8), (0, 0.7, -0.92)]
    dlf = lambda u: catmull_at(dle, u); dtf = lambda u: catmull_at(dte, u)
    dth = lambda u: 0.13 * (1 - u) ** 0.75 + 0.012
    fin = B.obj('dorsal', bm_fin(dlf, dtf, dth, lambda u: (1, 0, 0), B.pick(12, 5), B.pick(20, 8)), M_back, parent=D)
    B.vcol(fin, lambda x, y, z: (0.62 + 0.38 * (1 - sstep((y + 0.1) / 0.8)) ** 1.2, 0.72 + 0.28 * (1 - sstep((y + 0.1) / 0.8)), 0.86 + 0.14 * (1 - sstep((y + 0.1) / 0.8))))
    ue = [i / 10 for i in range(1, 11)] if not lo else [0.15, 0.4, 0.7, 1.0]
    B.obj('dorsal_edge', bm_tube([add3(dlf(u), (0, 0.006, 0.012)) for u in ue], [0.026 - 0.012 * u for u in ue], B.pick(7, 4)), cr, parent=D)
    ut = [i / 10 for i in range(1, 10)] if not lo else [0.15, 0.45, 0.8]
    B.obj('dorsal_glow', bm_tube([add3(dtf(u), (0, 0, -0.012)) for u in ut], [0.022 - 0.01 * u for u in ut], B.pick(6, 4)), led_c, parent=D)
    B.obj('dorsal_tip', bm_uv(0.045, B.pick(10, 6), B.pick(6, 4), (0, 0.71, -0.94)), led_c, parent=D)
    if not lo:   # a chrome collar where the fin meets the back, rivets along it
        for s in (1, -1):
            for k in range(4): B.obj('dorsal_rivet_%d_%d' % (k, s > 0), bm_ico(0.02, 1, on_body(math.pi / 2 + s * 0.2, -0.45 - k * 0.32, 0.0)), cr)
    B.light(0, DORSAL_AT[1] + 0.7, DORSAL_AT[2] - 0.94, 0.5, LIGHT, led=1)

    # ---- pectoral fins (parts pecL / pecR): lofted airfoils sweeping out, back and down; chrome leading edge, LED tip ----
    for s, nm in ((1, 'pecL'), (-1, 'pecR')):
        P = B.part(nm, (s * 0.9, 1.15, 0.5))
        ple = [(-s * 0.08, 0.04, 0.34), (s * 0.4, -0.08, 0.22), (s * 0.75, -0.18, -0.06), (s * 0.98, -0.3, -0.44)]
        pte = [(-s * 0.08, 0.04, -0.4), (s * 0.35, -0.1, -0.46), (s * 0.72, -0.21, -0.52), (s * 0.98, -0.3, -0.44)]
        plf = lambda u, ple=ple: catmull_at(ple, u); ptf = lambda u, pte=pte: catmull_at(pte, u)
        pf = B.obj(nm, bm_fin(plf, ptf, lambda u: 0.075 * (1 - u) ** 0.7 + 0.01, lambda u, s=s: (s * 0.3, 0.95, 0), B.pick(9, 4), B.pick(16, 8)), M_back, parent=P)
        B.vcol(pf, lambda x, y, z: (0.75 + 0.25 * sstep((y + 0.3) / 0.34), 0.82 + 0.18 * sstep((y + 0.3) / 0.34), 0.92 + 0.08 * sstep((y + 0.3) / 0.34)))
        ue = [i / 8 for i in range(1, 9)] if not lo else [0.2, 0.55, 1.0]
        B.obj(nm + '_edge', bm_tube([add3(plf(u), (0, 0.01, 0.012)) for u in ue], [0.022 - 0.01 * u for u in ue], B.pick(6, 4)), cr, parent=P)
        B.obj(nm + '_tip', bm_uv(0.045, B.pick(10, 6), B.pick(6, 4), (s * 0.98, -0.3, -0.44)), led_c, parent=P)
        B.light(s * 1.88, 0.85, 0.06, 0.45, LIGHT, led=1)

    # ---- the tail (part `tail`): tapered stock, chrome collar at the joint, a crescent caudal fin of two lofted lobes
    #      (the upper lobe lower than before, so the chase camera sees past it); the pose fn sweeps it ----
    B.obj('tail_collar', bm_torus(0.355, 0.04, B.pick(20, 10), B.pick(6, 4), AZ, TAIL_AT, sy=0.95), cr)
    T = B.part('tail', TAIL_AT)
    st = B.obj('tail_stock', bm_lathe([(0.0, 0.05), (0.35, 0.0), (0.33, -0.15), (0.27, -0.42), (0.2, -0.65), (0.15, -0.8), (0.0, -0.86)], B.pick(24, 10), (0, 0.02, 0), AZ, sz=0.95), M_back, parent=T)
    B.vcol(st, lambda x, y, z: skin_col(x, y + 1.6, z - 2.6, 1.6))
    lobes = (('tail_upper', [(0, 0.12, -0.55), (0, 0.42, -0.8), (0, 0.72, -1.12), (0, 0.95, -1.46)], [(0, -0.06, -0.86), (0, 0.14, -1.0), (0, 0.5, -1.2), (0, 0.95, -1.46)]),
             ('tail_lower', [(0, -0.08, -0.6), (0, -0.3, -0.8), (0, -0.5, -1.02), (0, -0.62, -1.24)], [(0, 0.02, -0.9), (0, -0.15, -1.0), (0, -0.4, -1.14), (0, -0.62, -1.24)]))
    for nm, le, te in lobes:
        lf = lambda u, le=le: catmull_at(le, u); tf = lambda u, te=te: catmull_at(te, u)
        lb = B.obj(nm, bm_fin(lf, tf, lambda u: 0.09 * (1 - u) ** 0.7 + 0.01, lambda u: (1, 0, 0), B.pick(9, 4), B.pick(16, 8)), M_back, parent=T)
        B.vcol(lb, lambda x, y, z: (0.68, 0.76, 0.88) if y > 0.3 else (0.8, 0.86, 0.94))
        ue = [i / 8 for i in range(1, 9)] if not lo else [0.25, 0.6, 1.0]
        B.obj(nm + '_edge', bm_tube([add3(lf(u), (0, 0.008 if nm == 'tail_upper' else -0.008, 0.008)) for u in ue], [0.02 - 0.008 * u for u in ue], B.pick(6, 4)), cr, parent=T)
        tip = te[-1]
        B.obj(nm + '_tip', bm_uv(0.04, B.pick(10, 6), B.pick(6, 4), tip), led_c, parent=T)

    # ---- chrome side pipes: headers out of the belly flank, straight pipes between the wheels, flared tips ----
    for s in (1, -1):
        run_ = catmull([(s * 0.72, 1.08, 1.0), (s * 0.95, 1.02, 0.85), (s * 1.16, 0.96, 0.62), (s * 1.22, 0.95, 0.4), (s * 1.22, 0.95, -0.5), (s * 1.22, 0.95, -1.1)], B.pick(14, 7))
        B.obj('pipe_%d' % (s > 0), bm_tube(run_, 0.065, B.pick(12, 7)), cr)
        B.obj('pipe_tip_%d' % (s > 0), bm_cyl(0.065, 0.095, 0.16, B.pick(14, 8), AZn, (s * 1.22, 0.95, -1.2)), cr)
        B.obj('pipe_hole_%d' % (s > 0), bm_cyl(0.075, 0.075, 0.02, B.pick(14, 8), AZn, (s * 1.22, 0.95, -1.27)), led('#2a8cff', 2.0))
        for z in (0.1, -0.8): B.obj('pipe_bkt_%d_%d' % (s > 0, z > 0), bm_rod((s * 1.1, 0.83, z), (s * 1.2, 0.93, z), 0.02, B.pick(6, 5)), dcr)
        if not lo:
            for k in range(3): B.obj('pipe_ring_%d_%d' % (s > 0, k), bm_torus(0.072, 0.01, 12, 4, AZ, (s * 1.22, 0.95, -0.2 - k * 0.3)), dcr)

    # ---- the rider's perch: seat on the back, chrome grab bar in front of it, the steering stalk, footpegs ----
    B.seat(0, 2.55, 0.3, col='#16304e', accent=LIGHT, wheelY=2.92, wheelZ=0.95)
    B.obj('grab_bar', bm_tube(catmull([(0.42, 2.42, 0.7), (0.42, 2.66, 0.78), (0.3, 2.74, 0.8), (-0.3, 2.74, 0.8), (-0.42, 2.66, 0.78), (-0.42, 2.42, 0.7)], B.pick(14, 6)), 0.03, B.pick(8, 5)), cr)
    B.obj('stalk', bm_rod((0, 2.3, 0.95), (0, 2.88, 1.02), 0.04, L['rod']), cr)
    if not lo:
        for s in (1, -1): B.obj('footpeg_%d' % (s > 0), bm_rod((s * 0.95, 2.0, 0.55), (s * 1.3, 1.95, 0.55), 0.025, 6), cr)

    # ---- wheels, size info ----
    B.wheels_pro(1.0, 1.75, -1.75, r=0.46, w=0.4, rim='#3a9ad8', tyre='#121418', cap=LIGHT, stripe=LIGHT)
    B.info(5.8, 2.6, 3.2, muzzle=(0, 1.3, 3.0), wheelR=0.46)
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('dune_chomper', build, report=True, views=['side', 'high', 'top'], level_overrides={'hi': dict(ico=1)})
