# Art Cart Blender kit: shared helpers for the parametric car scripts (tools/blender/<car>.py).
# Mirrors the game's procedural car kit (src/43_cart_b_models.js) so a Blender car drops onto the same rig.
#
# Run a car headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/<car>.py
# or exec the script in a live Blender. Set BRADY_ROOT to override the repo root.
#
# Coordinates: author in ENGINE space through E(x, y, z): x = the car's LEFT, y = up, z = forward. Blender stores
# (x, -z, y) and the glTF exporter's +Y-up flips it back. Units are metres; the origin is on the ground under the
# car's centre. Rig convention (docs/BURNS_GUIDE.md §6.8): root objects `body`, `wheel_FL/FR/RL/RR`, `steer`,
# `part_<name>` are bones; their origin is the joint. Empties `seat`, `muzzle`, `light_<n>` are markers.
import bpy, bmesh, math, os, json
from mathutils import Vector, Matrix

ROOT = os.environ.get('BRADY_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'models', 'art-cart')
BLEND_DIR = os.path.join(ROOT, 'assets', 'blender')
SHOTS = os.path.join(ROOT, 'shots', 'blender')
for d in (OUT, BLEND_DIR, SHOTS): os.makedirs(d, exist_ok=True)

# detail tables: hi = showroom (20–30k triangles), lo = race (5–8k)
# ico = icosphere subdivisions for bulbs (bm_ico): 0 and 1 are both the 20-triangle icosahedron, 2 is 80 triangles
# (the hi default: one LED bulb costs 80), 3 is 320. Cars with many bulbs override ico=1 at hi (20 per bulb).
LEVELS = {
    'hi': dict(bevel=4, cyl=32, cyl_s=16, torus=24, tube=8, ico=2, prof=56, prof_bev=6, bulbs=1.0, arch=24, rod=8, sph=24, ring=16, surf=28),
    'lo': dict(bevel=1, cyl=12, cyl_s=8, torus=12, tube=5, ico=1, prof=22, prof_bev=1, bulbs=0.5, arch=12, rod=6, sph=10, ring=7, surf=10),
}
TAU = math.tau
# named preview directions (Blender-space vectors from the model to the eye) for Build.preview(views=…) and run(views=…)
VIEWS = {'front': (0.7, -1, 0.3), 'rear': (-0.8, 0.9, 0.35), 'side': (1, 0.05, 0.12), 'top': (0.05, -0.35, 1.0), 'low': (0.25, -1, -0.05), 'high': (0.6, -1, 0.5)}
def E(x, y, z): return Vector((x, -z, y))
RX = lambda d: Matrix.Rotation(math.radians(d), 4, 'X')
RY = lambda d: Matrix.Rotation(math.radians(d), 4, 'Y')
RZ = lambda d: Matrix.Rotation(math.radians(d), 4, 'Z')
AX = RY(90)        # primitive axis Blender Z -> engine +X (car's left)
AXn = RY(-90)      # -> engine -X (car's right)
AZ = RX(90)        # -> engine +Z (forward)
AZn = RX(-90)      # -> engine -Z (backward)
AY = Matrix.Identity(4)   # -> engine +Y (up)
AYn = RX(180)             # -> engine -Y (down)
def rot(yaw=0.0, pitch=0.0, roll=0.0):
    """Engine-style rotation (radians) like BurnsMesh.tf: yaw about +Y, pitch about +X, roll about +Z, in Blender space."""
    # engine Y = Blender Z, engine X = Blender X, engine Z = Blender -Y
    return Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(pitch, 4, 'X') @ Matrix.Rotation(-roll, 4, 'Y')
def aim(direction):
    """A 4x4 matrix that points a primitive's local Z (engine up: the pole of lathes, domes, cones, rods, capsules) along
    the engine-space direction (x left, y up, z forward). Use it as the `axis` of bm_cyl/bm_torus/bm_lathe/bm_capsule or
    the `M` of bm_box/bm_profile/bm_surf: aim((0, -1, 0.3)) is a tooth pointing down and a little forward."""
    v = E(*direction)
    if v.length < 1e-9: return Matrix.Identity(4)
    return v.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
def frame(ax, ay, az):
    """A rotation (for bm_box/bm_profile/bm_surf `M`) that maps a piece's local engine x/y/z axes onto the engine directions
    ax/ay/az (they should be orthonormal): an aimed box, a plate lying on a curved hull."""
    c0 = E(*ax); c1 = -E(*az); c2 = E(*ay)
    return Matrix(((c0.x, c1.x, c2.x, 0), (c0.y, c1.y, c2.y, 0), (c0.z, c1.z, c2.z, 0), (0, 0, 0, 1)))

# ---------------- curves (engine-space tuples in, tuples out) ----------------
def catmull_at(pts, t, closed=False):
    """One point on the Catmull-Rom spline through `pts` (equal-length tuples: (r, h), (x, y) or (x, y, z)) at t in 0..1.
    Open: clamped ends, t = 0 is pts[0] and t = 1 is pts[-1]. Closed: the loop wraps and t = 1 is t = 0 again."""
    n = len(pts)
    if n == 1: return tuple(pts[0])
    if closed:
        f = (t % 1.0) * n; k = int(math.floor(f)) % n; u = f - math.floor(f)
        p0, p1, p2, p3 = pts[(k - 1) % n], pts[k], pts[(k + 1) % n], pts[(k + 2) % n]
    else:
        f = min(max(t, 0.0), 1.0) * (n - 1); k = min(n - 2, max(0, int(math.floor(f)))); u = f - k
        p0, p1, p2, p3 = pts[max(0, k - 1)], pts[k], pts[k + 1], pts[min(n - 1, k + 2)]
    u2 = u * u; u3 = u2 * u
    return tuple(0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3) for a, b, c, d in zip(p0, p1, p2, p3))
def catmull(pts, n, closed=False):
    """`n` points evenly spaced in parameter along the Catmull-Rom spline through `pts`. Open: from pts[0] to pts[-1]
    inclusive (a smooth bm_lathe profile from a few (r, h) knots, a bm_tube path). Closed: n points around the loop (a smooth
    CCW outline for bm_profile from a handful of (x, y) control points; point i * n / len(pts) sits on control point i)."""
    if closed: return [catmull_at(pts, i / n, True) for i in range(n)]
    return [catmull_at(pts, i / max(1, n - 1)) for i in range(n)]
def hermite(ks, vs, k):
    """Piecewise cubic Hermite through the knots (ks, vs) with finite-difference slopes, evaluated at k (clamped): a smooth
    1-D curve through a few values, e.g. a rope's radius or height per turn, a taper along a path."""
    n = len(ks); k = min(max(k, ks[0]), ks[-1])
    if n == 1: return vs[0]
    m = [(vs[1] - vs[0]) / (ks[1] - ks[0])] + [(vs[i + 1] - vs[i - 1]) / (ks[i + 1] - ks[i - 1]) for i in range(1, n - 1)] + [(vs[-1] - vs[-2]) / (ks[-1] - ks[-2])]
    for i in range(n - 1):
        if k <= ks[i + 1]:
            h = ks[i + 1] - ks[i]; t = (k - ks[i]) / h; t2 = t * t; t3 = t2 * t
            return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1]
    return vs[-1]
def sstep(x):
    """Smoothstep, clamped to 0..1."""
    x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)
def catenary(a, b, sag, n):
    """n + 1 engine points on a wire hung from a to b, drooping `sag` (metres) at the middle: bulb strings, bunting."""
    a, b = Vector(a), Vector(b)
    return [tuple(a.lerp(b, t) - Vector((0, sag * (1 - (2 * t - 1) ** 2), 0))) for t in (i / n for i in range(n + 1))]
def arc_walk(fn, n, closed=False, fine=600):
    """n parameter values t in 0..1 at which the curve fn(t) -> point is evenly spaced by arc length (open: t = 0 and 1
    included; closed: n values around the loop). Rivets along a rail, bulbs along a catenary, tiles around an oval."""
    P = [Vector(fn(i / fine)) for i in range(fine + 1)]
    cum = [0.0]
    for i in range(fine): cum.append(cum[-1] + (P[i + 1] - P[i]).length)
    L = cum[-1] or 1.0; out = []
    for i in range(n):
        s = L * (i / n if closed else i / max(1, n - 1)); k = 0
        while k < fine and cum[k + 1] < s: k += 1
        seg = cum[k + 1] - cum[k]
        out.append((k + ((s - cum[k]) / seg if seg > 1e-12 else 0.0)) / fine)
    return out
def rrect_pts(w, d, r, seg):
    """A rounded-rectangle outline (w across x, d across y, corner radius r, `seg` segments per corner) as CCW (x, y) points,
    centred on the origin: a bm_profile sign plate or the ring of bm_rrect_tube."""
    r = min(r, w / 2, d / 2); out = []
    for ci, (cx, cy, a0) in enumerate(((w / 2 - r, -d / 2 + r, -0.25), (w / 2 - r, d / 2 - r, 0.0), (-w / 2 + r, d / 2 - r, 0.25), (-w / 2 + r, -d / 2 + r, 0.5))):
        for i in range(seg + 1):
            if i == seg and r <= 1e-9: continue
            a = TAU * (a0 + 0.25 * i / seg)
            p = (cx + math.cos(a) * r, cy + math.sin(a) * r)
            if not out or (abs(out[-1][0] - p[0]) > 1e-9 or abs(out[-1][1] - p[1]) > 1e-9): out.append(p)
    if len(out) > 1 and abs(out[0][0] - out[-1][0]) < 1e-9 and abs(out[0][1] - out[-1][1]) < 1e-9: out.pop()
    return out

# ---------------- materials ----------------
def srgb_lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
MATS = {}
def mat(name, col, rough=0.5, metal=0.0, coat=0.0, emit=None, strength=0.0, extras=None):
    """A Principled material. The game maps: metal>=.5 & rough<=.35 -> chrome; coat>0 or rough<=.4 -> paint;
    rough<=.7 -> satin; else matte. Emission strength/3 -> glow (>=3 is a full LED). extras: burns_gloss, burns_e."""
    key = 'bv_' + name
    if key in MATS: return MATS[key]
    m = bpy.data.materials.get(key) or bpy.data.materials.new(key); m.use_nodes = True
    n = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    lin = srgb_lin(col)
    n.inputs['Base Color'].default_value = (*lin, 1)
    n.inputs['Roughness'].default_value = rough
    n.inputs['Metallic'].default_value = metal
    n.inputs['Coat Weight'].default_value = coat
    if coat: n.inputs['Coat Roughness'].default_value = 0.03
    n.inputs['Emission Color'].default_value = (*srgb_lin(emit), 1) if emit else (0, 0, 0, 1)
    n.inputs['Emission Strength'].default_value = strength if emit else 0.0
    m.diffuse_color = (*lin, 1)
    for k, v in (extras or {}).items(): m[k] = v
    MATS[key] = m
    return m
def paint(name, col, coat=1.0, rough=0.3, metal=0.2, emit=None, strength=0.0): return mat(name, col, rough=rough, metal=metal, coat=coat, emit=emit, strength=strength)
def metal(name, col, rough=0.1): return mat(name, col, rough=rough, metal=1.0)
def led(col, strength=4.0): return mat('led_' + col.lstrip('#'), col, emit=col, strength=strength)
def glow(name, col, strength=1.0, rough=0.3, coat=1.0): return mat(name, col, rough=rough, coat=coat, emit=col, strength=strength)
def matte(name, col, rough=0.85): return mat(name, col, rough=rough)
def satin(name, col, rough=0.55): return mat(name, col, rough=rough)
def chrome(): return metal('chrome', '#c8ccd8', 0.08)
def dark_chrome(): return metal('dark_chrome', '#2a2230', 0.18)
def rubber(): return mat('rubber', '#18181c', rough=0.65)
def lens(): return led('#fff6d8')

# ---------------- bmesh primitives (engine coords via E) ----------------
def xf(bm, M): bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
def bm_box(w, h, d, at=(0, 0, 0), M=None):
    """Box w (x) × h (y) × d (z) centred at `at`; M: extra rotation (rot()) about the centre."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)) @ Matrix.Diagonal((w, d, h, 1)))
    return bm
def bm_cyl(r1, r2, depth, seg, axis=AY, at=(0, 0, 0), caps=True, flip=False):
    """Cylinder/cone along `axis` (AY up, AX left, AZ forward…), centred at `at`. r1 = base (-axis), r2 = tip (+axis)."""
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    xf(bm, Matrix.Translation(E(*at)) @ axis)
    return bm
def bm_rod(p0, p1, r, seg, r1=None):
    """A rod from engine point p0 to p1, radius r (r1 at the far end for a taper)."""
    a, b = E(*p0), E(*p1); d = b - a; L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r1 is None else r1, depth=L)
    q = d.normalized().to_track_quat('Z', 'Y')
    xf(bm, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    return bm
def bm_ico(r, sub, at=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, Matrix.Translation(E(*at)))
    return bm
def bm_uv(r, seg, rings, at=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    xf(bm, Matrix.Translation(E(*at)))
    return bm
def bm_ellipsoid(rx, ry, rz, seg, rings, at=(0, 0, 0), M=None, phi0=0.0, phi1=math.pi):
    """Ellipsoid radii (rx, ry, rz) in engine axes; phi0..phi1 (0 top pole .. pi bottom) for caps/domes; M: rot()."""
    bm = bmesh.new()
    rows = []
    nr = max(2, rings)
    for i in range(nr + 1):
        ph = phi0 + (phi1 - phi0) * i / nr
        if (i == 0 and phi0 <= 1e-6) or (i == nr and phi1 >= math.pi - 1e-6):
            rows.append([bm.verts.new((0, 0, math.cos(ph)))]); continue
        row = []
        for j in range(seg):
            th = TAU * j / seg
            row.append(bm.verts.new((math.sin(ph) * math.cos(th), math.sin(ph) * math.sin(th), math.cos(ph))))
        rows.append(row)
    for i in range(nr):
        A, B = rows[i], rows[i + 1]
        for j in range(seg):
            a0 = A[j % len(A)]; a1 = A[(j + 1) % len(A)]; b0 = B[j % len(B)]; b1 = B[(j + 1) % len(B)]
            vs = [v for k, v in enumerate((a0, b0, b1, a1)) if v not in (a0, b0, b1, a1)[:k]]
            if len(vs) >= 3: bm.faces.new(vs)
    bm.normal_update()
    # unit sphere in Blender space (x, y, z): engine axes map x->x, y(up)->z, z(fwd)->-y
    S = Matrix.Diagonal((rx, rz, ry, 1))
    xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)) @ S)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def bm_torus(R, r, seg, tseg, axis=AY, at=(0, 0, 0), sweep=None, sy=1.0):
    """Ring of radius R, tube r, in the plane perpendicular to `axis`; sweep=(a0, a1) for a partial ring."""
    bm = bmesh.new(); a0, a1 = sweep or (0.0, TAU); closed = sweep is None
    n = seg if closed else seg + 1
    rows = []
    for i in range(n):
        a = a0 + (a1 - a0) * i / seg
        row = []
        for j in range(tseg):
            b = TAU * j / tseg
            rr = R + math.cos(b) * r
            row.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr * sy, math.sin(b) * r)))
        rows.append(row)
    for i in range(n if closed else n - 1):
        r0, r1 = rows[i], rows[(i + 1) % n]
        for j in range(tseg):
            bm.faces.new((r0[j], r1[j], r1[(j + 1) % tseg], r0[(j + 1) % tseg]))
    bm.normal_update()
    xf(bm, Matrix.Translation(E(*at)) @ axis)
    return bm
def bm_lathe(profile, seg, at=(0, 0, 0), axis=AY, rmod=None, sx=1.0, sz=1.0, caps=True, flip=False):
    """Surface of revolution of [(radius, height), …] about the axis (engine Y by default), like BurnsMesh.lathe.
    rmod(theta, t) scales the radius per vertex (lumps, petals); sx/sz squash the section into an oval."""
    bm = bmesh.new(); rows = []
    for k, (r, h) in enumerate(profile):
        t = k / max(1, len(profile) - 1)
        if r <= 1e-6:
            rows.append([bm.verts.new((0, 0, h))]); continue
        row = []
        for j in range(seg):
            th = TAU * j / seg
            rr = r * (rmod(th, t) if rmod else 1.0)
            row.append(bm.verts.new((math.cos(th) * rr * sx, math.sin(th) * rr * sz, h)))
        rows.append(row)
    for i in range(len(rows) - 1):
        A, B = rows[i], rows[i + 1]
        if len(A) == 1 and len(B) == 1: continue
        for j in range(seg):
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
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    # here the profile height runs along Blender Z = engine Y, then `axis` re-aims it
    xf(bm, Matrix.Translation(E(*at)) @ axis)
    return bm
def bm_surf(nu, nv, fn, at=(0, 0, 0), wrap_u=False, wrap_v=False, flip=False, M=None, merge=False):
    """Parametric sheet: fn(u, v) -> engine (x, y, z) for u, v in 0..1 (nu × nv quads). Two-sided: build twice with flip.
    merge=True welds coincident vertices (remove_doubles) and recalculates normals: use it with wrap_u for a closed body
    whose fn collapses to a point at v = 0 and v = 1 (whale, duck, shark hulls), so the poles are one vertex each and the
    surface is watertight instead of leaking a fan of unwelded triangles at each end."""
    bm = bmesh.new(); rows = []
    for i in range(nv + (0 if wrap_v else 1)):
        v = i / nv; row = []
        for j in range(nu + (0 if wrap_u else 1)):
            u = j / nu; x, y, z = fn(u, v); row.append(bm.verts.new(E(x, y, z)))
        rows.append(row)
    NV, NU = len(rows), len(rows[0])
    for i in range(nv):
        for j in range(nu):
            a = rows[i % NV][j % NU]; b = rows[i % NV][(j + 1) % NU]; c = rows[(i + 1) % NV][(j + 1) % NU]; d = rows[(i + 1) % NV][j % NU]
            vs = []
            for v in (a, b, c, d):
                if v not in vs: vs.append(v)
            if len(vs) >= 3:
                try: bm.faces.new(vs)
                except ValueError: pass
    bm.normal_update()
    if merge:
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)))
    return bm
def _skin(bm, rows, closed_u=True, closed_v=False, caps=True):
    """Faces between consecutive rows of BMVerts (a row of one vertex is a pole). closed_u wraps each row into a ring,
    closed_v joins the last row back to the first. caps: True = a fan to a new centre vertex on each open end ring,
    'ngon' = one polygon per end (planar rings only), False = open ends."""
    nr = len(rows)
    for i in range(nr if closed_v else nr - 1):
        A, B = rows[i], rows[(i + 1) % nr]; n = max(len(A), len(B))
        if n == 1: continue
        for j in range(n if closed_u else n - 1):
            a0 = A[j % len(A)]; a1 = A[(j + 1) % len(A)]; b0 = B[j % len(B)]; b1 = B[(j + 1) % len(B)]
            vs = []
            for v in (a0, b0, b1, a1):
                if v not in vs: vs.append(v)
            if len(vs) >= 3:
                try: bm.faces.new(vs)
                except ValueError: pass
    if caps and closed_u and not closed_v:
        for row, rev in ((rows[0], True), (rows[-1], False)):
            if len(row) < 3: continue
            if caps == 'ngon':
                try: bm.faces.new(row[::-1] if rev else row)
                except ValueError: pass
            else:
                c = Vector((0, 0, 0))
                for v in row: c += v.co
                pv = bm.verts.new(c / len(row))
                for j in range(len(row)):
                    a, b = row[j], row[(j + 1) % len(row)]
                    bm.faces.new((b, a, pv) if rev else (a, b, pv))
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def rmf(points, closed=False, ref=None):
    """Rotation-minimising (parallel transport) frames along an engine polyline: [(T, N, B), …] unit engine Vectors per
    point, so a tube swept with them never twists. `ref` seeds the first normal (default: engine up, or left when the path
    starts vertical). A closed loop gets its residual twist spread evenly so the frames meet at the seam."""
    P = [Vector(p) for p in points]; n = len(P); T = []
    for i in range(n):
        a, b = (P[(i - 1) % n], P[(i + 1) % n]) if closed else (P[max(0, i - 1)], P[min(n - 1, i + 1)])
        t = b - a
        T.append(t.normalized() if t.length > 1e-9 else (T[-1] if T else Vector((0, 1, 0))))
    if ref is None: ref = Vector((0, 1, 0)) if abs(T[0].y) < 0.9 else Vector((1, 0, 0))
    N = Vector(ref) - T[0] * T[0].dot(Vector(ref))
    if N.length < 1e-9: N = T[0].orthogonal()
    N.normalize(); out = []
    for i in range(n):
        N = N - T[i] * T[i].dot(N)
        if N.length < 1e-9: N = T[i].orthogonal()
        N.normalize(); out.append((T[i], N, T[i].cross(N)))
    if closed and n > 1:
        N1 = N - T[0] * T[0].dot(N); N1.normalize(); N0 = out[0][1]
        twist = math.atan2(T[0].cross(N1).dot(N0), N1.dot(N0))   # how far the transported normal misses the first one
        if abs(twist) > 1e-9:
            fixed = []
            for i, (t, nn, bb) in enumerate(out):
                q = Matrix.Rotation(twist * i / n, 3, t); nn = q @ nn; fixed.append((t, nn, t.cross(nn)))
            out = fixed
    return out
def bm_tube(points, r, seg, closed=False, caps=True, section_fn=None, ref=None, at=(0, 0, 0), M=None):
    """A round tube swept along an engine-space polyline with rotation-minimising frames (no twist). `r` is one radius or
    a radius per point (0 collapses that ring to a tip). `section_fn(u) -> (sx, sy)` squashes the section at u in 0..1
    (sx along the frame normal, sy along the binormal). closed=True joins the last point back to the first (a ring; the
    rounded-rect lip, an oval rail). caps: True = n-gon ends, 'fan' = fan ends, False = open. Pass a smooth path from
    catmull(); arms, tentacles, cables, pipes, fin edges, mudguard rails."""
    P = [Vector(p) for p in points]; n = len(P)
    rs = list(r) if isinstance(r, (list, tuple)) else [r] * n
    bm = bmesh.new(); rows = []
    for i, (T, N, B) in enumerate(rmf(P, closed, ref)):
        u = i / n if closed else i / max(1, n - 1)
        if rs[i] <= 1e-9: rows.append([bm.verts.new(E(*P[i]))]); continue
        sx, sy = section_fn(u) if section_fn else (1.0, 1.0)
        rows.append([bm.verts.new(E(*(P[i] + N * (math.cos(a) * rs[i] * sx) + B * (math.sin(a) * rs[i] * sy)))) for a in (TAU * j / seg for j in range(seg))])
    _skin(bm, rows, True, closed, 'ngon' if caps is True else caps)
    if at != (0, 0, 0) or M is not None: xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)))
    return bm
def bm_sweep(path_fn, section, n, frame_fn=None, caps=True, ref=None, closed=False, at=(0, 0, 0), M=None):
    """A 2D section swept along a path: path_fn(u) -> engine point for u in 0..1 (n steps), `section` a list of (a, b)
    offsets in the section plane or section_fn(u) -> that list (varying section) or None (a collapsed tip). Frames are
    rotation-minimising unless frame_fn(u) -> (N1, N2) engine Vectors gives them (e.g. a frosting rope whose section must
    stay upright, a mudguard arch whose section is radial). What bm_tube can't do: star/rect/varying sections and tips."""
    us = [i / n for i in range(n)] if closed else [i / n for i in range(n + 1)]
    C = [Vector(path_fn(u)) for u in us]
    frames = None if frame_fn else rmf(C, closed, ref)
    bm = bmesh.new(); rows = []
    for i, u in enumerate(us):
        sec = section(u) if callable(section) else section
        if sec is None: rows.append([bm.verts.new(E(*C[i]))]); continue
        if frame_fn: N1, N2 = (Vector(v) for v in frame_fn(u))
        else: _, N1, N2 = frames[i]
        rows.append([bm.verts.new(E(*(C[i] + N1 * a + N2 * b))) for a, b in sec])
    _skin(bm, rows, True, closed, 'ngon' if caps is True else caps)
    if at != (0, 0, 0) or M is not None: xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)))
    return bm
def bm_loft(sections, closed_u=True, closed_v=False, caps=True, at=(0, 0, 0), M=None):
    """Loft a list of rings (each a list of engine points with the same count; a single point is a tip) into a surface.
    closed_u: each ring is a loop (False: open strips, a sheet). closed_v: the last ring joins the first (a torus-like body).
    caps: True = a fan to the ring's centre on each open end, 'ngon' = one polygon, False = open. Fins, flukes, tail stocks,
    anything whose sections you can write down ring by ring."""
    bm = bmesh.new()
    rows = [[bm.verts.new(E(*p)) for p in ring] for ring in sections]
    _skin(bm, rows, closed_u, closed_v, caps)
    if at != (0, 0, 0) or M is not None: xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)))
    return bm
def bm_capsule(r, h, seg, rings, at=(0, 0, 0), axis=AY):
    """A capsule of radius r and total length h (tip to tip, along `axis`, engine up by default) centred at `at`; `rings`
    rows per hemisphere. Sprinkles, bulbs, pills, bumpers; aim it with aim(d)."""
    h = max(h, 2 * r); c = h / 2 - r; prof = [(0.0, -h / 2)]
    for i in range(1, rings + 1):
        a = (math.pi / 2) * i / rings; prof.append((r * math.sin(a), -c - r * math.cos(a)))
    for i in range(1, rings + 1):
        a = (math.pi / 2) * i / rings; prof.append((r * math.cos(a), c + r * math.sin(a)))
    return bm_lathe(prof, seg, at=at, axis=axis, caps=False)
def bm_rrect_tube(w, d, r, tube_r, seg, tseg=8, at=(0, 0, 0), axis=AY):
    """A rounded-rectangle ring (w across x, d across z in the plane perpendicular to `axis`, corner radius r, `seg`
    segments per corner) made of a round tube of radius tube_r (tseg around), centred at `at`: a tub lip, a sign frame,
    a bumper hoop. Like bm_torus, the ring lies flat (engine XZ) for axis=AY."""
    ring = [(x, 0.0, y) for x, y in rrect_pts(w, d, r, seg)]
    return bm_tube(ring, tube_r, tseg, closed=True, at=at, M=axis)
def bm_profile(pts, depth, at=(0, 0, 0), M=None):
    """A flat 2D outline [(x, y), …] (engine XY plane, CCW) extruded `depth` along Z, centred on the pivot. Fins, flags,
    letters, hearts. Add a bevel modifier for a puffy edge."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, depth / 2, y)) for x, y in pts]     # Blender (x, -z, y): the back face at engine z = -depth/2
    f = bm.faces.new(vs); bm.normal_update()
    if f.normal.y < 0: bmesh.ops.reverse_faces(bm, faces=[f])
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    ev = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ev, vec=(0, -depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    xf(bm, Matrix.Translation(E(*at)) @ (M or Matrix.Identity(4)))
    return bm
def heart_pts(n, k=0.0875, yoff=0.18):
    out = []
    for i in range(n):
        t = TAU * i / n
        x = 16 * math.sin(t) ** 3; y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        out.append((x * k, y * k + yoff))
    return out
def merge(*bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); out.from_mesh(me); bpy.data.meshes.remove(me)
    return out

# ---------------- the build ----------------
class Build:
    """One detail level of one car. Pieces are objects parented to a bone root (an empty): body(), part(), wheels()…"""
    def __init__(self, stem, level, levels=None):
        self.stem = stem; self.level = level; self.L = dict(LEVELS[level]); self.L.update((levels or {}).get(level, {}))
        self.objs = []; self.cutters = []; self.bones = {}; self.n_light = 0
        self.col = bpy.data.collections.new('%s_%s' % (stem.upper(), level.upper())); bpy.context.scene.collection.children.link(self.col)
        self.body = self.bone('body', (0, 0, 0))
    @property
    def lo(self): return self.level == 'lo'
    def pick(self, hi, lo): return lo if self.lo else hi
    # ---- objects ----
    def empty(self, name, at, props=None, display='PLAIN_AXES'):
        ob = bpy.data.objects.new(name, None); ob.empty_display_type = display; ob.empty_display_size = 0.15
        ob.location = E(*at)
        for k, v in (props or {}).items(): ob[k] = v
        self.col.objects.link(ob); self.objs.append(ob); return ob
    def bone(self, name, at):
        """A rig root (`body`, `wheel_FL`…, `steer`, `part_<x>`): an empty at the joint; parent its pieces to it."""
        ob = self.empty(name, at, display='SPHERE'); self.bones[name] = ob; return ob
    def part(self, name, at):
        """An animated part bone `part_<name>` at joint `at` (engine coords). Author its pieces in part-local space."""
        return self.bone('part_' + name, at)
    def obj(self, name, bm, m, parent=None, smooth=True, bevel=None, bevel_angle=True, segments=None, profile=None, flat=False, face_mat=None):
        """A mesh piece. `parent` = a bone root (default: the body). Pieces are authored in the parent's local space.
        bevel: width in metres (a Bevel modifier, angle-limited by default, harden normals).
        flat=True keeps the piece faceted through smooth_by_angle (which otherwise re-smooths even smooth=False pieces):
        every edge is marked sharp, so the mesh stays welded for bevels and the exporter splits the normals (mirror tiles,
        gems, low-poly props). flat='split' splits the edges instead (same glb, more Blender-side vertices).
        m may be a list of materials: face_mat(bmface) -> index picks one per face (two-tone wrappers, back/belly splits;
        the face's normal and calc_center_median() are ready); without face_mat the bmesh's own material_index is kept."""
        if flat == 'split': bmesh.ops.split_edges(bm, edges=bm.edges[:])
        elif flat:
            for e in bm.edges: e.smooth = False
        if face_mat:
            bm.normal_update()
            for f in bm.faces: f.material_index = int(face_mat(f))
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = smooth
        for mm in (m if isinstance(m, (list, tuple)) else ([m] if m else [])): me.materials.append(mm)
        ob = bpy.data.objects.new(name, me); self.col.objects.link(ob)
        ob.parent = parent if parent is not None else self.body
        if bevel: self.bevel(ob, bevel, bevel_angle, segments, profile)
        self.objs.append(ob)
        return ob
    def bevel(self, ob, width, angle=True, segments=None, profile=None):
        b = ob.modifiers.new('bevel', 'BEVEL'); b.width = width; b.segments = segments or self.L['bevel']; b.harden_normals = True
        b.limit_method = 'ANGLE' if angle else 'NONE'; b.angle_limit = math.radians(35); b.use_clamp_overlap = True
        if profile: b.profile = profile
        return b
    def cut(self, targets, bm, name):
        """Boolean-subtract `bm` from the target objects (wheel arches, portholes, mouths)."""
        cut = self.obj(name, bm, None, smooth=False); cut.display_type = 'WIRE'; cut.hide_set(True); cut.hide_render = True
        self.objs.remove(cut); self.cutters.append(cut)
        for t in targets:
            bo = t.modifiers.new(name, 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut; bo.solver = 'EXACT'
            # keep the bevel last
            for mod in list(t.modifiers):
                if mod.type == 'BEVEL': bpy.context.view_layer.objects.active = t; t.modifiers.move(t.modifiers.find(mod.name), len(t.modifiers) - 1)
        return cut
    # ---- markers ----
    def light(self, x, y, z, size, col, **flags):
        """A glow sprite + point light the game draws at this car-local point (big=1 for the main feature light,
        head/tail/led flags as the procedural cars use)."""
        self.empty('light_%d' % self.n_light, (x, y, z), dict(color=col, size=size, **flags)); self.n_light += 1
    def info(self, len, w, h, muzzle=(0, 1.6, 2.6), wheelR=0.5, steerTilt=0.45, driverScale=1.0, seatYaw=0.0, extra=None):
        """The car's size for the race sim, its weapon muzzle point and any per-car extras (JSON) the sim reads."""
        b = self.body
        b['len'] = float(len); b['w'] = float(w); b['h'] = float(h); b['wheelR'] = float(wheelR); b['steerTilt'] = float(steerTilt)
        b['driverScale'] = float(driverScale); b['seatYaw'] = float(seatYaw)
        if extra: b['extra'] = json.dumps(extra)
        self.empty('muzzle', muzzle)
    # ---- stock pieces (same shapes and args as the procedural kit) ----
    def wheels(self, x, zf, zr, r=0.48, w=0.36, rim='#c8ccd8', tyre='#18181c', cap='#ff4fd8', spokes=5):
        """Four wheels on bones wheel_FL/FR/RL/RR (FL = +x front). Returns the four bone roots."""
        L = self.L; out = []
        for name, px, pz in (('wheel_FL', x, zf), ('wheel_FR', -x, zf), ('wheel_RL', x, zr), ('wheel_RR', -x, zr)):
            side = 1 if px > 0 else -1
            root = self.bone(name, (px, r, pz)); out.append(root)
            self.obj(name + '_tyre', bm_cyl(r, r, w, L['cyl'], AX), mat('tyre', tyre, rough=0.65), parent=root, bevel=min(0.13, r * 0.26))
            self.obj(name + '_rim', bm_cyl(r * 0.6, r * 0.6, w * 0.8, L['cyl_s'], AX), metal('rim_' + rim.lstrip('#'), rim, 0.12), parent=root, bevel=0.03)
            if not self.lo:
                for k in range(spokes):
                    a = k / spokes * TAU
                    self.obj(name + '_spoke_%d' % k, bm_rod((side * w * 0.41, math.cos(a) * r * 0.12, math.sin(a) * r * 0.12), (side * w * 0.41, math.cos(a) * r * 0.52, math.sin(a) * r * 0.52), 0.03, L['rod']), chrome(), parent=root)
            self.obj(name + '_cap', bm_cyl(r * 0.16, r * 0.16, 0.05, L['cyl_s'], AX, (side * w * 0.44, 0, 0)), led(cap, 3.0), parent=root)
        self.body['wheelR'] = float(r)
        return out
    def seat(self, x, y, z, col='#2a1a2a', accent='#ff4fd8', wheelY=None, wheelZ=None, tilt=0.45, column=True):
        """Driver seat (hips at x, y, z) + the steering wheel on bone `steer`. Sets the `seat` empty."""
        L = self.L; wy = y + 0.42 if wheelY is None else wheelY; wz = z + 0.62 if wheelZ is None else wheelZ
        sm = satin('seat_' + col.lstrip('#'), col); sm2 = matte('seatbase_' + col.lstrip('#'), col)
        self.obj('seat_cushion', bm_box(0.62, 0.16, 0.58, (x, y - 0.14, z - 0.05)), sm, bevel=0.06, bevel_angle=False)
        self.obj('seat_back', bm_box(0.6, 0.7, 0.14, (x, y + 0.26, z - 0.36)), sm, bevel=0.05, bevel_angle=False)
        self.obj('seat_base', bm_box(0.5, 0.22, 0.5, (x, y - 0.32, z - 0.05)), sm2, bevel=0.04, bevel_angle=False)
        if column: self.obj('column', bm_rod((x, wy - 0.05, wz + 0.05), (x, y - 0.1, wz + 0.36), 0.04, L['rod']), dark_chrome())
        st = self.bone('steer', (x, wy, wz))
        self.obj('steer_ring', bm_torus(0.19, 0.03, L['torus'], L['tube'], AZ), dark_chrome(), parent=st)
        self.obj('steer_spoke', bm_rod((-0.17, 0, 0), (0.17, 0, 0), 0.018, L['rod']), chrome(), parent=st)
        self.obj('steer_hub', bm_uv(0.05, L['cyl_s'], max(4, L['cyl_s'] // 2)), chrome(), parent=st)
        self.obj('steer_accent', bm_uv(0.025, max(6, L['cyl_s'] // 2), 4, (0, 0, 0.04)), led(accent), parent=st)
        self.empty('seat', (x, y, z)); self.body['steerTilt'] = float(tilt)
        return st
    def platform(self, len, w, y=0.62, h=0.5, col='#1c1a22', leds=None):
        """A low rounded chassis skirt with optional LED rows along both sides (cartPlatform)."""
        self.obj('platform', bm_box(w, h, len, (0, y, 0)), paint('platform_' + col.lstrip('#'), col, coat=0.6, rough=0.35), bevel=min(0.2, h * 0.4), bevel_angle=False)
        self.obj('platform_under', bm_box(w - 0.3, h * 0.3, len - 0.5, (0, y - h * 0.42, 0)), matte('under', '#0e0e12'), bevel=0.06, bevel_angle=False)
        if leds:
            n = self.pick(12, 6)
            self.leds((w / 2 + 0.01, y, len / 2 - 0.3), (w / 2 + 0.01, y, -len / 2 + 0.3), n, leds, 0.06, 4)
            self.leds((-w / 2 - 0.01, y, len / 2 - 0.3), (-w / 2 - 0.01, y, -len / 2 + 0.3), n, leds, 0.06, 4)
    def leds(self, a, b, n, cols, size=0.07, light_every=0, parent=None, prefix='led'):
        """A row of n glowing bulbs from a to b, cycling `cols`; every k-th one also gets a game light."""
        cols = cols if isinstance(cols, (list, tuple)) else [cols]
        for i in range(n):
            t = 0.5 if n == 1 else i / (n - 1); c = cols[i % len(cols)]
            p = tuple(a[k] + (b[k] - a[k]) * t for k in range(3))
            self.obj('%s_%d_%d' % (prefix, self.n_light, i), bm_ico(size, self.L['ico'], p), led(c), parent=parent)
            if light_every and i % light_every == 0: self.light(p[0], p[1], p[2], size * 9, c, led=1)
    def strip(self, a, b, col, th=0.035, parent=None, name=None):
        """A glowing LED strip (thin bar) from a to b."""
        x0, y0, z0 = a; x1, y1, z1 = b
        bm = bm_rod(a, b, th * 0.7, 4)
        self.obj(name or 'strip_%d' % len(self.objs), bm, led(col), parent=parent, smooth=False)
    def lamps(self, x, y, z, zb, yb=None):
        """Headlights at (±x, y, z) and tail lights at (±x, yb, zb), with their game lights (cartLamps)."""
        L = self.L; yb = y if yb is None else yb
        for s in (1, -1):
            self.obj('lamp_h_%d' % (s > 0), bm_cyl(0.17, 0.17, 0.08, L['cyl_s'], AZ, (s * x, y, z)), dark_chrome(), bevel=0.03)
            self.obj('lamp_lens_%d' % (s > 0), bm_cyl(0.13, 0.13, 0.04, L['cyl_s'], AZ, (s * x, y, z + 0.05)), lens())
            self.light(s * x, y, z + 0.1, 1.3, '#fff2c8', head=1)
            self.obj('tail_%d' % (s > 0), bm_box(0.32, 0.12, 0.06, (s * x, yb, zb - 0.02)), led('#ff1a2a'), bevel=0.02, bevel_angle=False)
            self.light(s * x, yb, zb - 0.1, 0.9, '#ff2a3a', tail=1)
    def speaker(self, at, axis, r_in, r_rim, name, glow_col='#ff3a6a', parent=None):
        """A speaker: chrome rim ring, glowing ring, recessed cone and a chrome dust cap, facing `axis`."""
        L = self.L
        self.obj(name + '_rim', bm_torus(r_rim, 0.03, L['torus'], L['tube'], axis, at), chrome(), parent=parent)
        self.obj(name + '_glow', bm_torus(r_rim - 0.045, 0.02, L['torus'], max(3, L['tube'] - 4), axis, at), led(glow_col), parent=parent)
        self.obj(name + '_cone', bm_cyl(0.06, r_in, 0.13, L['cyl_s'], axis, at, caps=False, flip=True), matte('speaker_cone', '#0c0a10', 0.6), parent=parent)
        self.obj(name + '_cap', bm_uv(0.07, L['cyl_s'], max(4, L['cyl_s'] // 2), at), chrome(), parent=parent)
    def eye(self, at, r, iris='#1a1a2a', look=(0, 0), parent=None, name='eye', M=None):
        """A cartoon eye looking along +Z (cartEye): white ball, iris, highlight."""
        L = self.L; x, y, z = at; lx, ly = look
        self.obj(name + '_white', bm_uv(r, L['sph'], L['ring'], at), paint('eye_white', '#ffffff', coat=0.3, rough=0.25, metal=0), parent=parent)
        self.obj(name + '_iris', bm_uv(r * 0.45, max(8, L['sph'] // 2), max(5, L['ring'] // 2), (x + lx * r * 0.5, y + ly * r * 0.5 + r * 0.05, z + r * 0.72)), mat('iris_' + iris.lstrip('#'), iris, rough=0.1, metal=0.4), parent=parent)
        if not self.lo: self.obj(name + '_hl', bm_uv(r * 0.12, 8, 5, (x + lx * r * 0.5 + r * 0.16, y + r * 0.25, z + r * 0.98)), led('#ffffff', 3.0), parent=parent)
    # ---- stats, shading, export ----
    def tris(self):
        """(triangles, vertices, {bone: triangles}) of the evaluated pieces; also fills self.per_obj = [(tris, name), …]
        sorted heaviest first, for the report."""
        dg = bpy.context.evaluated_depsgraph_get(); total = 0; verts = 0; per = {}; per_obj = []
        for ob in self.objs:
            if ob.type != 'MESH': continue
            me = ob.evaluated_get(dg).to_mesh(); me.calc_loop_triangles()
            n = len(me.loop_triangles); total += n; verts += len(me.vertices); per_obj.append((n, ob.name))
            root = ob
            while root.parent: root = root.parent
            per[root.name] = per.get(root.name, 0) + n
            ob.evaluated_get(dg).to_mesh_clear()
        self.per_obj = sorted(per_obj, key=lambda kv: (-kv[0], kv[1]))
        return total, verts, per
    def report(self, top=12):
        """Print the `top` heaviest pieces of this level by triangle count (after tris())."""
        rows = getattr(self, 'per_obj', None) or []
        print('CARTKIT_TOP %s %s: ' % (self.stem, self.level) + ', '.join('%s %d' % (n, t) for t, n in rows[:top]))
    def smooth_by_angle(self):
        try:
            bpy.ops.object.select_all(action='DESELECT')
            meshes = [o for o in self.objs if o.type == 'MESH']
            for o in meshes: o.select_set(True)
            bpy.context.view_layer.objects.active = meshes[0]
            bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
        except Exception as e:
            print('smooth_by_angle skipped:', e)
    def export(self, path):
        bpy.ops.object.select_all(action='DESELECT')
        for o in self.objs: o.select_set(True)
        bpy.context.view_layer.objects.active = self.body
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                                  export_extras=True, export_materials='EXPORT', export_normals=True, export_animations=False,
                                  export_skins=False, export_lights=False, export_cameras=False, export_image_format='NONE', export_tangents=False)
        return os.path.getsize(path)
    def bounds(self):
        dg = bpy.context.evaluated_depsgraph_get(); lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
        for ob in self.objs:
            if ob.type != 'MESH': continue
            for c in ob.bound_box:
                w = ob.matrix_world @ Vector(c)
                lo = Vector(min(lo[i], w[i]) for i in range(3)); hi = Vector(max(hi[i], w[i]) for i in range(3))
        return lo, hi
    def preview(self, path, view=(0.7, -1, 0.3), size=(900, 600), samples=24, views=None):
        """Render this level from a direction (Blender-space unit vector from the car to the eye) with EEVEE.
        views=[…] renders several: each a VIEWS name ('front', 'rear', 'side', 'top', 'low', 'high') or a (direction, tag)
        pair; `path` then takes the tag before its extension (…/car_hi.png -> …/car_hi_side.png) and a list comes back."""
        if views is not None:
            stem, ext = os.path.splitext(path); out = []
            for vw in views:
                d, tag = (VIEWS[vw], vw) if isinstance(vw, str) else vw
                out.append(Build.preview(self, '%s_%s%s' % (stem, tag, ext or '.png'), view=d, size=size, samples=samples))
            return out
        sc = bpy.context.scene
        lo, hi = self.bounds(); c = (lo + hi) / 2; ext = max((hi - lo).length, 1.0)
        cam = bpy.data.objects.get('__preview_cam')
        if cam is None:
            cam = bpy.data.objects.new('__preview_cam', bpy.data.cameras.new('__preview_cam')); sc.collection.objects.link(cam)
        d = Vector(view).normalized(); cam.location = c + d * ext * 1.25; cam.data.lens = 40
        cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler(); sc.camera = cam
        sun = bpy.data.objects.get('__preview_sun')
        if sun is None:
            sun = bpy.data.objects.new('__preview_sun', bpy.data.lights.new('__preview_sun', 'SUN')); sc.collection.objects.link(sun)
            sun.data.energy = 4.0; sun.data.angle = math.radians(6); sun.data.color = (1.0, 0.92, 0.8)
        sun.location = c + Vector((0.5, -0.6, 1.0)) * ext; sun.rotation_euler = (c - sun.location).to_track_quat('-Z', 'Y').to_euler()
        w = sc.world or bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
        bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (0.32, 0.3, 0.37, 1); bg.inputs[1].default_value = 1.0
        sc.render.resolution_x, sc.render.resolution_y = size; sc.render.resolution_percentage = 100
        try: sc.eevee.taa_render_samples = samples
        except Exception: pass
        sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = path
        # only this level visible
        for col in bpy.context.scene.collection.children:
            lc = bpy.context.view_layer.layer_collection.children.get(col.name)
            if lc: lc.hide_viewport = col is not self.col
        bpy.ops.render.render(write_still=True)
        return path

def clear(stem):
    """Remove an earlier build of this car (and the default cube) from the open file."""
    cube = bpy.data.objects.get('Cube')
    if cube and cube.type == 'MESH' and len(cube.data.vertices) == 8: bpy.data.objects.remove(cube)
    for c in list(bpy.data.collections):
        if c.name.startswith(stem.upper() + '_'):
            for o in list(c.objects): bpy.data.objects.remove(o)
            bpy.data.collections.remove(c)
    for me in list(bpy.data.meshes):
        if me.users == 0: bpy.data.meshes.remove(me)
    MATS.clear()

def _debug(report): return bool(report) or bool(os.environ.get('CARTKIT_DEBUG'))
def run(stem, build_fn, levels=('hi', 'lo'), save=True, preview=True, level_overrides=None, report=False, views=None):
    """Build, export and preview a car. build_fn(B) adds everything to the Build B.
    Writes assets/models/art-cart/<stem>.glb (+ _lo), assets/blender/<stem>.blend, shots/blender/<stem>_*.png.
    report=True (or env CARTKIT_DEBUG=1) also prints the 12 heaviest pieces of each level (CARTKIT_TOP lines).
    views: extra showroom previews on top of the default front and rear, as VIEWS names or (direction, tag) pairs,
    e.g. views=['side', 'top']; the race level always gets the front view only."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    clear(stem)
    rep = {}; builds = {}
    # the race level first: its objects get a '__lo' suffix after export, so the showroom build keeps the clean names
    for lv in [l for l in ('lo', 'hi') if l in levels]:
        B = Build(stem, lv, level_overrides); build_fn(B); B.smooth_by_angle()
        t, v, per = B.tris()
        if _debug(report): B.report()
        path = os.path.join(OUT, '%s%s.glb' % (stem, '' if lv == 'hi' else '_lo'))
        size = B.export(path)
        rep[lv] = dict(tris=t, verts=v, bytes=size, per=per, path=path)
        if v > 65535: rep[lv]['error'] = 'too many vertices for the engine (max 65535)'
        builds[lv] = B
        if preview:
            vws = ['front', 'rear'] + list(views or []) if lv == 'hi' else ['front']
            rep[lv]['previews'] = B.preview(os.path.join(SHOTS, '%s_%s.png' % (stem, lv)), views=vws)
        if lv == 'lo':
            for o in B.objs + B.cutters: o.name = o.name + '__lo'
    for col in bpy.context.scene.collection.children:
        lc = bpy.context.view_layer.layer_collection.children.get(col.name)
        if lc: lc.hide_viewport = col.name.endswith('_LO')
    if save: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND_DIR, stem + '.blend'), compress=True)
    print('CARTKIT_REPORT ' + json.dumps({k: {kk: vv for kk, vv in v.items() if kk != 'per'} for k, v in rep.items()}))
    for k, v in rep.items(): print('  %s per bone: %s' % (k, dict(sorted(v['per'].items(), key=lambda kv: -kv[1]))))
    return rep

def run_static(stem, build_fn, app='burning-man', level='hi', save=True, preview=True, level_overrides=None, report=False, views=('front', 'side')):
    """Build and export a static prop (not a car): one detail level, a single bone `body` with everything parented to it,
    no wheels, seat or markers needed. build_fn(B) adds the pieces to the Build B (B.obj(...) parents to the body).
    Writes assets/models/<app>/<stem>.glb, assets/blender/<stem>.blend and shots/blender/<stem>_<tag>.png for `views`.
    Lamp posts, signs, bins, sculptures: anything the engine drops in as one rigid mesh."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    clear(stem)
    B = Build(stem, level, level_overrides); build_fn(B); B.smooth_by_angle()
    extra = [b for b in B.bones if b != 'body']
    if extra: print('run_static: %s is meant to be single-bone; found extra bones %s' % (stem, extra))
    t, v, per = B.tris()
    if _debug(report): B.report()
    out = os.path.join(ROOT, 'assets', 'models', app); os.makedirs(out, exist_ok=True)
    path = os.path.join(out, stem + '.glb'); size = B.export(path)
    rep = {level: dict(tris=t, verts=v, bytes=size, path=path)}
    if v > 65535: rep[level]['error'] = 'too many vertices for the engine (max 65535)'
    if preview: rep[level]['previews'] = B.preview(os.path.join(SHOTS, stem + '.png'), views=list(views))
    if save: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND_DIR, stem + '.blend'), compress=True)
    print('CARTKIT_REPORT ' + json.dumps(rep))
    return rep

def bootstrap(script_file):
    """Call at the top of a car script so `from cartkit import *` works both headless and when exec'd in a live Blender."""
    import sys
    d = os.path.dirname(os.path.abspath(script_file))
    if d not in sys.path: sys.path.insert(0, d)
