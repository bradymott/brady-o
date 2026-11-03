# Dune Chomper (Art Cart car #11): a cruising land shark. Swims through sand, bites through bumpers.
# A muscle-car shark: sculpted countershaded hull (blue-grey back, white belly, a creased colour break), recessed gill
# slits with chrome lips, hooded mean eyes, chrome "bumper" lips with chrome teeth, a snapping lower jaw (part `jaw`),
# a wagging crescent tail (part `tail`), chrome side pipes, an LED spine stripe and blue underglow. The rider sits on
# its back behind the head. Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/dune_chomper.py
# Writes assets/models/art-cart/dune_chomper.glb (showroom, 20–30k tris) and dune_chomper_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#6a8ab0', '#f4f4f8', '#38c8ff'   # CART_CARS.shark palette
MOUTH, GILL = '#c82a4a', '#2a3a50'
FLOOR = 1.18            # the mouth roof (the upper lip line): the snout's underside is flat here
BREAK = 0.0             # section angle (rad, 0 = the left flank) of the colour break between back and belly

# ---------------- small helpers ----------------
def aim(n):
    """Rotation taking Blender +Z (engine up: the pole of lathes/domes/cones) to the engine direction n."""
    return E(*n).to_track_quat('Z', 'Y').to_matrix().to_4x4()
def eng(v): return (v.x, v.z, -v.y)
def norm3(v):
    l = math.sqrt(sum(c * c for c in v)) or 1.0; return tuple(c / l for c in v)
def add3(a, b, k=1.0): return tuple(a[i] + b[i] * k for i in range(3))
def sstep(x): x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)
def catmull(pts, t):
    """Catmull-Rom through equal-length tuples, t in 0..1 (clamped ends)."""
    n = len(pts); f = t * (n - 1); k = min(n - 2, max(0, int(math.floor(f)))); u = f - k
    p0 = pts[max(0, k - 1)]; p1 = pts[k]; p2 = pts[k + 1]; p3 = pts[min(n - 1, k + 2)]
    return [0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u) for a, b, c, d in zip(p0, p1, p2, p3)]
def spline(ctrl, per=4):
    """Closed Catmull-Rom outline through (x, y) control points for bm_profile; point i*per is control point i."""
    n = len(ctrl); out = []
    for i in range(n):
        p0, p1, p2, p3 = ctrl[(i - 1) % n], ctrl[i], ctrl[(i + 1) % n], ctrl[(i + 2) % n]
        for k in range(per):
            t = k / per; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out
def cone(r, length, at, direction, seg):
    """A tooth: a cone of base radius r pointing along `direction` from its base at `at`."""
    d = norm3(direction); c = add3(at, d, length / 2)
    return bm_cyl(r, 0.0, length, seg, aim(d), c)
def bm_tube(pts, r, tseg, r_fn=None, caps=True):
    """A round tube of radius r (× r_fn(t)) swept along an engine-space polyline; closed ends when caps."""
    P = [E(*p) for p in pts]; n = len(P); bm = bmesh.new(); rows = []
    for i in range(n):
        t = (P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized()
        q = t.to_track_quat('Z', 'Y').to_matrix()
        rr = r * (r_fn(i / (n - 1)) if r_fn else 1.0)
        rows.append([bm.verts.new(P[i] + q @ Vector((math.cos(a) * rr, math.sin(a) * rr, 0))) for a in (TAU * j / tseg for j in range(tseg))])
    for i in range(n - 1):
        A, Bq = rows[i], rows[i + 1]
        for j in range(tseg): bm.faces.new((A[j], Bq[j], Bq[(j + 1) % tseg], A[(j + 1) % tseg]))
    if caps:
        bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def outline_area(pts):
    return 0.5 * sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
def edge_run(pts, i0, i1, off):
    """Points i0..i1 of a closed outline pushed `off` outward along the local 2D normal."""
    sg = 1.0 if outline_area(pts) > 0 else -1.0; out = []
    for i in range(i0, i1 + 1):
        a, b = pts[(i - 1) % len(pts)], pts[(i + 1) % len(pts)]
        tx, ty = b[0] - a[0], b[1] - a[1]; l = math.hypot(tx, ty) or 1.0
        out.append((pts[i][0] + sg * ty / l * off, pts[i][1] - sg * tx / l * off))
    return out

# ---------------- the body surface: a sharky countershaded hull along z (tail -> nose) ----------------
# (z, half-width, half-height, centre height): fuller mid-body, a flattened wedge of a head, a tapering tail stock
BODY = [(-2.75, 0.0, 0.0, 1.6), (-2.6, 0.36, 0.34, 1.6), (-2.1, 0.5, 0.48, 1.58), (-1.5, 0.74, 0.7, 1.56),
        (-0.7, 1.0, 0.88, 1.55), (0.1, 1.05, 0.9, 1.55), (0.9, 1.0, 0.84, 1.54), (1.5, 0.92, 0.7, 1.5),
        (2.0, 0.82, 0.5, 1.45), (2.4, 0.64, 0.33, 1.4), (2.68, 0.36, 0.17, 1.35), (2.85, 0.0, 0.0, 1.31)]
def sec(v): return catmull(BODY, v)
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

def build(B):
    L = B.L; lo = B.lo
    M_back = paint('shark_back', COL, coat=1.0, rough=0.28, metal=0.2)
    M_belly = paint('shark_belly', COL2, coat=1.0, rough=0.3, metal=0.1)
    M_mouth = paint('shark_mouth', MOUTH, coat=0.8, rough=0.4, metal=0.0)
    M_mouth_d = paint('shark_mouth_d', '#8e1c36', coat=0.8, rough=0.45, metal=0.0)
    M_gill = matte('gill', GILL, 0.8)
    M_slit = matte('gill_slit', '#0a1018', 0.9)
    M_eye = mat('eye_black', '#07070c', rough=0.08, metal=0.3, coat=1.0)
    M_lid = paint('shark_lid', '#5a7898', coat=1.0, rough=0.3, metal=0.2)
    M_tooth = metal('tooth_chrome', '#dfe4f0', 0.1)
    cr, dcr = chrome(), dark_chrome()
    led_c, led_w = led(LIGHT), led('#ffffff')
    seg_t = B.pick(6, 5)

    # ---- chassis: dark platform with arches and chrome fenders, LED rows between the wheels, blue underglow ----
    B.platform(4.6, 2.2, 0.62, 0.42, '#1a2230')
    plat = [o for o in B.objs if o.name == 'platform']
    for i, (x, z) in enumerate([(1.1, 1.75), (-1.1, 1.75), (1.1, -1.75), (-1.1, -1.75)]):
        B.cut(plat, bm_cyl(0.6, 0.6, 0.72, B.pick(14, 10), AX, (x * 1.1, 0.46, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.62, 0.04, B.pick(16, 8), B.pick(6, 4), AX, (x * 0.96, 0.46, z), sweep=(math.pi / 2, 3 * math.pi / 2)), dcr)
    for s in (1, -1):
        B.leds((s * 1.11, 0.66, 1.05), (s * 1.11, 0.66, -1.05), B.pick(8, 4), [LIGHT, '#ffffff'], 0.055, 4, prefix='side%d' % (s > 0))
        B.strip((s * 1.0, 0.42, 1.1), (s * 1.0, 0.42, -1.1), LIGHT)
    B.strip((-0.8, 0.42, 2.2), (0.8, 0.42, 2.2), LIGHT); B.strip((-0.8, 0.42, -2.2), (0.8, 0.42, -2.2), LIGHT)
    for z in (2.36, -2.36): B.obj('bumper_%d' % (z > 0), bm_box(1.9, 0.12, 0.14, (0, 0.5, z)), cr, bevel=0.04, bevel_angle=False)
    B.lamps(0.8, 0.72, 2.32, -2.32, 0.72)

    # ---- the hull: back / belly / mouth roof on one sculpted surface ----
    hull = B.obj('hull', bm_hull(B.pick(48, 22), B.pick(40, 18)), M_back)
    hull.data.materials.append(M_belly); hull.data.materials.append(M_mouth)
    # the crease: a thin chrome bead along the colour break on both flanks (hi), with rivets
    if not lo:
        for s in (1, -1):
            th = side_th(s, BREAK)
            pts = [on_body(th, z, 0.0) for z in [-2.45 + 4.75 * k / 24 for k in range(25)] if raw_pt(th, v_of_z(z))[1] > floor_y(z) + 0.03]
            B.obj('bead_%d' % (s > 0), bm_tube(pts, 0.014, 5), cr)
            for k, z in enumerate((-2.0, -1.3, -0.6, 0.1, 0.8, 1.5)):
                B.obj('rivet_%d_%d' % (s > 0, k), bm_ico(0.022, 1, on_body(th, z, 0.012)), cr)
    # racing stripe down the spine: a blue LED bead flanked by white pinstripes (hi), from the snout to the seat and
    # again behind the dorsal fin
    for k, (z0, z1) in enumerate(((2.5, 0.78), (-1.7, -2.5))):
        zs = [z0 + (z1 - z0) * j / 16 for j in range(17)]
        B.obj('spine_led_%d' % k, bm_tube([on_body(math.pi / 2, z, 0.012) for z in zs], 0.022, B.pick(6, 4)), led_c)
        if not lo:
            for s in (1, -1):
                B.obj('pin_%d_%d' % (k, s > 0), bm_tube([on_body(math.pi / 2 + s * 0.11, z, 0.004) for z in zs], 0.012, 4), M_belly)
    # lateral line: blue bulbs along the flanks (a game light on one of them per side)
    n = B.pick(7, 4)
    for s in (1, -1):
        for i in range(n):
            p = on_body(side_th(s, 0.1), 0.9 - 2.6 * i / (n - 1), 0.03)
            B.obj('lat_%d_%d' % (s > 0, i), bm_ico(0.04, 1, p), led_c)
            if i == 1: B.light(p[0], p[1], p[2], 0.45, LIGHT, led=1)

    # ---- gills: three recessed slits per side, curved, each with a chrome lip behind it and a raised rim (hi) ----
    ng = B.pick(9, 6)
    for s in (1, -1):
        for i in range(3):
            z0 = 1.0 - i * 0.22
            arc = []; lip = []; rim = []
            for k in range(ng):
                t = k / (ng - 1); a = (t - 0.5) * 0.56; bul = 0.07 * (1 - (2 * t - 1) ** 2)
                arc.append(on_body(side_th(s, a), z0 + bul, -0.006))
                lip.append(on_body(side_th(s, a), z0 + bul - 0.045, 0.006))
                rim.append(on_body(side_th(s, a * 1.1), z0 + bul * 1.1 + 0.035, 0.003))
            B.obj('gill_%d_%d' % (s > 0, i), bm_tube(arc, 0.026, B.pick(5, 4)), M_slit)
            B.obj('gill_lip_%d_%d' % (s > 0, i), bm_tube(lip, 0.013, 4), cr)
            if not lo: B.obj('gill_rim_%d_%d' % (s > 0, i), bm_tube(rim, 0.011, 4), M_gill)
    # jaw axle across the throat with hex bolts
    B.obj('axle', bm_cyl(0.06, 0.06, 1.3, L['cyl_s'], AX, (0, 1.12, 1.25)), dcr)
    for s in (1, -1): B.obj('axle_bolt_%d' % (s > 0), bm_cyl(0.085, 0.085, 0.07, 6, AX, (s * 0.68, 1.12, 1.25)), cr, smooth=False)

    # ---- the face: hooded mean eyes, chrome upper lip with chrome teeth, a chrome nose with the blue nose light ----
    for s in (1, -1):
        e = (s * 0.72, 1.85, 1.75)
        B.obj('eye_%d' % (s > 0), bm_ellipsoid(0.14, 0.15, 0.11, B.pick(16, 10), B.pick(9, 5), e), M_eye)
        if not lo: B.obj('glint_%d' % (s > 0), bm_uv(0.03, 8, 5, (s * 0.78, 1.91, 1.84)), led_w)
        lid_at = (s * 0.7, 1.9, 1.74); Ml = aim((-s * 0.55, 1.0, 0.25)); rx, ry, rz, ph = 0.19, 0.2, 0.16, 1.25
        B.obj('lid_%d' % (s > 0), bm_ellipsoid(rx, ry, rz, B.pick(20, 10), B.pick(7, 4), lid_at, M=Ml, phi1=ph), M_lid)
        if not lo:   # dark chrome liner around the lid's brim
            brim = [eng(Matrix.Translation(E(*lid_at)) @ Ml @ Vector((rx * math.sin(ph) * math.cos(a), rz * math.sin(ph) * math.sin(a), ry * math.cos(ph)))) for a in [TAU * k / 16 for k in range(17)]]
            B.obj('liner_%d' % (s > 0), bm_tube(brim, 0.016, 5, caps=False), dcr)
    # the upper lip: a chrome bumper bead along the mouth roof's edge, chrome teeth hanging just inside it
    B.obj('upper_lip', bm_tube(lip_curve(B.pick(29, 15), y=FLOOR + 0.012), 0.03, seg_t), cr)
    nt = B.pick(9, 5)
    for i, p in enumerate(lip_curve(nt, z_back=1.9, inset=0.07, y=FLOOR + 0.02)):
        B.obj('tooth_u_%d' % i, cone(0.058, 0.19, p, (0, -1, 0.06), B.pick(7, 5)), M_tooth, smooth=False)
    B.obj('nose_cone', bm_cyl(0.115, 0.03, 0.3, B.pick(14, 8), AZ, (0, 1.33, 2.86)), cr)
    B.obj('nose_ring', bm_torus(0.115, 0.018, B.pick(14, 8), B.pick(6, 4), AZ, (0, 1.33, 2.72)), dcr)
    B.obj('nose_led', bm_uv(0.05, B.pick(10, 6), B.pick(6, 4), (0, 1.33, 3.02)), led_c)
    B.light(0, 1.2, 2.9, 1.8, LIGHT, big=1)

    # ---- the lower jaw (part `jaw`, hinged at the back; the pose fn pitches the front down) ----
    J = B.part('jaw', (0, 1.12, 1.25))
    JC, JRX, JRZ = 0.66, 0.68, 0.72     # the jaw's centre z and radii (local)
    B.obj('jaw_shell', bm_ellipsoid(JRX, 0.2, JRZ, B.pick(32, 14), B.pick(8, 4), (0, -0.05, JC), phi0=math.pi / 2), M_belly, parent=J)
    B.obj('jaw_top', bm_ellipsoid(JRX - 0.02, 0.015, JRZ - 0.02, B.pick(32, 14), 4, (0, -0.045, JC)), M_mouth_d, parent=J)
    B.obj('tongue', bm_ellipsoid(0.46, 0.075, 0.6, B.pick(20, 10), B.pick(5, 3), (0, -0.03, JC - 0.04), phi1=math.pi / 2), M_mouth, parent=J)
    if not lo: B.obj('tongue_groove', bm_tube([(0, 0.046 - 0.012 * (k / 6) ** 2, 0.2 + 0.85 * k / 6) for k in range(7)], 0.01, 4), M_mouth_d, parent=J)
    nr = B.pick(25, 13)
    rim = [(JRX * math.sin(a), 0.0, JC + JRZ * math.cos(a)) for a in [(k / (nr - 1) - 0.5) * 3.0 for k in range(nr)]]
    B.obj('lower_lip', bm_tube(rim, 0.03, seg_t), cr, parent=J)
    nt = B.pick(8, 5)
    for i in range(nt):
        a = (i / (nt - 1) - 0.5) * 2.3
        B.obj('tooth_l_%d' % i, cone(0.054, 0.17, ((JRX - 0.07) * math.sin(a), 0.0, JC + (JRZ - 0.07) * math.cos(a)), (0, 1, 0.05), B.pick(7, 5)), M_tooth, parent=J, smooth=False)
    if not lo:   # chrome rub strips along the jaw's flanks
        for s in (1, -1):
            B.obj('jaw_strip_%d' % (s > 0), bm_tube([(s * (JRX * 0.97 * math.sqrt(max(0.0, 1 - ((zz - JC) / JRZ) ** 2)) + 0.004), -0.1, zz) for zz in (0.2, 0.4, 0.6, 0.8, 1.0)], 0.012, 4), cr, parent=J)

    # ---- dorsal fin: a sabre with a chrome leading edge, an LED tip and a rivet row along the base ----
    dz = lambda z, y: (-z, y)     # profile x = -engine z (rot(yaw=90°))
    per = B.pick(5, 2)
    dctrl = [dz(-0.15, 2.1), dz(-0.3, 2.6), dz(-0.55, 3.0), dz(-0.82, 3.28), dz(-1.05, 3.4), dz(-1.1, 3.1), dz(-1.12, 2.75), dz(-1.3, 2.45), dz(-1.6, 2.2), dz(-0.85, 2.05)]
    dpts = spline(dctrl, per)
    d = B.obj('dorsal', bm_profile(dpts, 0.2, M=rot(yaw=math.pi / 2)), M_back)
    B.bevel(d, 0.07, angle=True, segments=min(L['prof_bev'], 3), profile=0.6)
    B.obj('dorsal_edge', bm_tube([(0, y, -x) for x, y in edge_run(dpts, per, 4 * per, 0.012)], 0.024, B.pick(7, 5)), cr)
    B.obj('dorsal_tip', bm_uv(0.045, B.pick(10, 6), B.pick(6, 4), (0, 3.38, -1.03)), led_c)
    if not lo:
        for k in range(5):
            for s in (1, -1): B.obj('dorsal_rivet_%d_%d' % (k, s > 0), bm_ico(0.02, 1, on_body(math.pi / 2 + s * 0.17, -0.3 - k * 0.26, 0.0)), cr)
        B.obj('dorsal_root', bm_tube([on_body(math.pi / 2, z, 0.012) for z in (-0.12, -0.35, -0.65, -0.95, -1.25, -1.5, -1.65)], 0.035, 6), M_back)

    # ---- pectoral fins: sweep out, back and down from the flanks; chrome leading edges, LED tips, grooves ----
    for s in (1, -1):
        at = (s * 0.95, 1.15, 0.5)
        ctrl = [(-0.2, 0.42), (0.1, 0.46), (0.4, 0.34), (0.68, 0.02), (0.88, -0.4), (0.78, -0.58), (0.5, -0.66), (0.15, -0.56), (-0.2, -0.32)]
        pts = [(s * x, z) for x, z in spline(ctrl, per)]
        Mf = rot(roll=-s * 0.38) @ rot(pitch=math.pi / 2)
        f = B.obj('pec_%d' % (s > 0), bm_profile(pts, 0.1, at, Mf), M_back)
        B.bevel(f, 0.045, angle=True, segments=min(L['prof_bev'], 3), profile=0.6)
        fp = lambda px, py, d=0.0: eng(E(*at) + (Mf @ E(px, py, d)))
        B.obj('pec_edge_%d' % (s > 0), bm_tube([fp(x, y) for x, y in edge_run(pts, per, 4 * per, 0.01)], 0.02, B.pick(6, 4)), cr)
        tip = fp(s * 0.88, -0.4)
        B.obj('pec_tip_%d' % (s > 0), bm_uv(0.045, B.pick(10, 6), B.pick(6, 4), tip), led_c)
        B.light(tip[0], tip[1], tip[2], 0.45, LIGHT, led=1)
        if not lo:
            for k, (x0, z0, x1, z1) in enumerate(((0.05, 0.25, 0.62, -0.02), (0.05, 0.0, 0.7, -0.3), (0.05, -0.25, 0.55, -0.5))):
                B.obj('pec_groove_%d_%d' % (s > 0, k), bm_tube([fp(s * x0, z0, 0.045), fp(s * x1, z1, 0.045)], 0.012, 4), M_back)

    # ---- the tail (part `tail`): tapered stock, chrome collar at the joint, a crescent caudal fin; the pose fn yaws it ----
    B.obj('tail_collar', bm_torus(0.355, 0.04, B.pick(20, 10), B.pick(6, 4), AZ, (0, 1.6, -2.6), sy=0.95), cr)
    T = B.part('tail', (0, 1.6, -2.6))
    B.obj('tail_stock', bm_lathe([(0.0, 0.05), (0.35, 0.0), (0.33, -0.15), (0.27, -0.42), (0.2, -0.65), (0.17, -0.78), (0.0, -0.82)], B.pick(24, 12), (0, 0.02, 0), AZ, sz=0.95), M_back, parent=T)
    tctrl = [dz(-0.5, 0.22), dz(-0.72, 0.5), dz(-1.0, 0.9), dz(-1.28, 1.22), dz(-1.33, 1.28), dz(-1.2, 1.0), dz(-1.06, 0.55), dz(-0.98, 0.12), dz(-1.02, -0.2),
             dz(-1.14, -0.56), dz(-1.18, -0.74), dz(-1.0, -0.62), dz(-0.76, -0.36), dz(-0.5, -0.2)]
    tper = B.pick(4, 2)
    tpts = spline(tctrl, tper)
    t = B.obj('tail_fin', bm_profile(tpts, 0.1, M=rot(yaw=math.pi / 2)), M_back, parent=T)
    B.bevel(t, 0.04, angle=True, segments=min(L['prof_bev'], 3), profile=0.6)
    B.obj('tail_edge_u', bm_tube([(0, y, -x) for x, y in edge_run(tpts, 0, 4 * tper, 0.01)], 0.02, B.pick(6, 4)), cr, parent=T)
    B.obj('tail_edge_l', bm_tube([(0, y, -x) for x, y in edge_run(tpts, 10 * tper, 13 * tper, 0.01)], 0.02, B.pick(6, 4)), cr, parent=T)
    B.obj('tail_tip_u', bm_uv(0.04, B.pick(10, 6), B.pick(6, 4), (0, 1.27, -1.32)), led_c, parent=T)
    B.obj('tail_tip_l', bm_uv(0.035, B.pick(10, 6), B.pick(6, 4), (0, -0.73, -1.17)), led_c, parent=T)

    # ---- chrome side pipes: headers out of the belly flank, straight pipes between the wheels, flared tips ----
    for s in (1, -1):
        run_ = [(s * 0.72, 1.08, 1.0), (s * 0.95, 1.02, 0.85), (s * 1.16, 0.96, 0.62), (s * 1.22, 0.95, 0.4), (s * 1.22, 0.95, -0.5), (s * 1.22, 0.95, -1.1)]
        B.obj('pipe_%d' % (s > 0), bm_tube(run_, 0.065, B.pick(12, 8)), cr)
        B.obj('pipe_tip_%d' % (s > 0), bm_cyl(0.065, 0.095, 0.16, B.pick(12, 8), AZn, (s * 1.22, 0.95, -1.2)), cr)
        B.obj('pipe_hole_%d' % (s > 0), bm_cyl(0.07, 0.07, 0.02, B.pick(12, 8), AZn, (s * 1.22, 0.95, -1.27)), matte('pipe_dark', '#0a0a0c'))
        for z in (0.1, -0.8): B.obj('pipe_bkt_%d_%d' % (s > 0, z > 0), bm_rod((s * 1.1, 0.83, z), (s * 1.2, 0.93, z), 0.02, B.pick(6, 5)), dcr)
        if not lo:
            for k in range(3): B.obj('pipe_ring_%d_%d' % (s > 0, k), bm_torus(0.072, 0.01, 10, 4, AZ, (s * 1.22, 0.95, -0.2 - k * 0.3)), dcr)

    # ---- the rider's perch: seat on the back, chrome grab bar in front of it, the steering stalk, footpegs ----
    B.seat(0, 2.55, 0.3, col='#1a2a40', accent=LIGHT, wheelY=2.92, wheelZ=0.95)
    B.obj('grab_bar', bm_tube([(0.42, 2.42, 0.7), (0.42, 2.66, 0.78), (0.3, 2.74, 0.8), (-0.3, 2.74, 0.8), (-0.42, 2.66, 0.78), (-0.42, 2.42, 0.7)], 0.03, B.pick(8, 5)), cr)
    B.obj('stalk', bm_rod((0, 2.3, 0.95), (0, 2.88, 1.02), 0.04, L['rod']), cr)
    if not lo:
        for s in (1, -1): B.obj('footpeg_%d' % (s > 0), bm_rod((s * 0.95, 2.0, 0.55), (s * 1.3, 1.95, 0.55), 0.025, 6), cr)

    # ---- wheels, size info ----
    B.wheels(1.0, 1.75, -1.75, r=0.46, w=0.4, rim=LIGHT, tyre='#14161a', cap='#ffffff')
    B.info(5.8, 2.6, 3.4, muzzle=(0, 1.3, 3.0), wheelR=0.46)

def extra(stem):
    """Debug aids (env SHARK_DEBUG=1): per-object triangle counts of the showroom build and side / front-low renders."""
    dg = bpy.context.evaluated_depsgraph_get()
    for lv in ('HI', 'LO'):
        c = bpy.data.collections.get(stem.upper() + '_' + lv); rows = []
        for ob in c.objects:
            if ob.type != 'MESH' or ob.hide_render: continue
            me = ob.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); rows.append((len(me.loop_triangles), ob.name.replace('__lo', ''))); ob.evaluated_get(dg).to_mesh_clear()
        rows.sort(reverse=True)
        print('SHARK_STATS %s %d objs: ' % (lv, len(rows)) + ', '.join('%s %d' % (n, t) for t, n in rows[:36]))
    col = bpy.data.collections.get(stem.upper() + '_HI')
    class Shim: pass
    sh = Shim(); sh.col = col; sh.objs = [o for o in col.objects if not o.hide_render]; sh.bounds = lambda: Build.bounds(sh)
    out = os.environ.get('SHARK_OUT', SHOTS)
    for vw, tag in (((1, 0.05, 0.12), 'side'), ((0.25, -1, -0.05), 'low'), ((0.6, -1, 0.5), 'high')):
        Build.preview(sh, os.path.join(out, '%s_hi_%s.png' % (stem, tag)), view=vw)

if __name__ == '__main__':
    run('dune_chomper', build, level_overrides={'hi': dict(ico=1)})
    if os.environ.get('SHARK_DEBUG'): extra('dune_chomper')
