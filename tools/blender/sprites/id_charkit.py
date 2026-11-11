# id_charkit: the character toolkit for the Indonesia (and Vietnam) casts of Super Brady-O World, copied from
# ma_enemies.py (Morocco) so these modules never depend on another country's files. Not an enemies module itself
# (build_country.sh only renders <cc>_enemies*.py). A cast module does `from id_charkit import *`, fills COLORS with
# its '<kind>_<part>' colours (COLORS.update) and calls clear(kinds) with its own KINDS.
# Conventions (as mx_pepper.py / ma_enemies.py): Z up, every character FACES +X (screen-right), the sprite camera
# looks along +Y from -Y, 1 m = 28.1 px; feet-origin kinds stand on z = 0, centre-origin kinds are centred on the
# origin; plain Principled materials (Base Color only) named <kind>_<part>, 'glow' in the name renders unlit; every
# object is parented to one Empty named after the kind and carries obj['sprite_part'].
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
PX = 28.1
SCRATCH = os.environ.get('SCRATCH', '/tmp/brady-sprites/iden')

COLORS = {}


# ---------------------------------------------------------------- colours / materials
def hex_linear(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    lin = [(x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (lin[0], lin[1], lin[2], 1.0)


def material(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    col = hex_linear(COLORS[name])
    if bsdf:      # None once a look kit has restyled the material: keep its node tree
        bsdf.inputs['Base Color'].default_value = col
        bsdf.inputs['Roughness'].default_value = 0.5
    m.diffuse_color = col
    return m


# ---------------------------------------------------------------- maths helpers
def perp_frame(az):
    """Two unit vectors ax, ay with ax x ay = az (az unit)."""
    ref = Vector((0, 0, 1)) if abs(az.z) < 0.9 else Vector((1, 0, 0))
    ax = ref.cross(az).normalized()
    ay = az.cross(ax)
    return ax, ay


def rot_x(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'X')


def rot_y(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Y')


def rot_z(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Z')


def T(v):
    return Matrix.Translation(Vector(v))


def diag(sx, sy, sz):
    return Matrix.Diagonal((sx, sy, sz, 1.0))


def about(pivot, M):
    """Apply M about a pivot point."""
    return T(pivot) @ M @ T(-Vector(pivot))


def V(x, y, z):
    return Vector((x, y, z))


def smooth01(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


# ---------------------------------------------------------------- bmesh builders
def ring_mesh(rings, closed=False):
    """Rings ordered along the axis; each a list of Vectors (same count) or a single Vector (a pole)."""
    bm = bmesh.new()
    vs = []
    for ring in rings:
        if isinstance(ring, Vector):
            vs.append(bm.verts.new(ring))
        else:
            vs.append([bm.verts.new(p) for p in ring])
    pairs = list(zip(vs, vs[1:]))
    if closed:
        pairs.append((vs[-1], vs[0]))
    for A, B in pairs:
        if isinstance(A, list) and isinstance(B, list):
            n = len(A)
            for j in range(n):
                bm.faces.new((A[j], B[j], B[(j + 1) % n], A[(j + 1) % n]))
        elif isinstance(A, list):
            n = len(A)
            for j in range(n):
                bm.faces.new((A[j], B, A[(j + 1) % n]))
        elif isinstance(B, list):
            n = len(B)
            for j in range(n):
                bm.faces.new((A, B[j], B[(j + 1) % n]))
    bm.normal_update()
    return bm


def ellipsoid(c, ax, ay, az, seg=16, rows=10, phi0=0.0, phi1=math.pi):
    """Parametric ellipsoid: c + sin(phi)(cos(th) ax + sin(th) ay) + cos(phi) az (phi1 < pi gives a cap about +az)."""
    c = Vector(c)
    rings = []
    for i in range(rows + 1):
        phi = phi0 + (phi1 - phi0) * i / rows
        if phi < 1e-6:
            rings.append(c + az)
        elif phi > math.pi - 1e-6:
            rings.append(c - az)
        else:
            rings.append([c + math.sin(phi) * (math.cos(th) * ax + math.sin(th) * ay) + math.cos(phi) * az
                          for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings)


def sphere(c, r, seg=16, rows=10):
    return ellipsoid(Vector(c), X * r, Y * r, Z * r, seg, rows)


def blob(c, rx, ry, rz, seg=16, rows=10):
    return ellipsoid(Vector(c), X * rx, Y * ry, Z * rz, seg, rows)


def cap(c, axis, r, phi1_deg, seg=20, rows=6, scale=1.012):
    """A spherical cap (patch) of radius r about the unit direction axis, sitting a hair proud of the sphere."""
    axis = Vector(axis).normalized()
    ax, ay = perp_frame(axis)
    return ellipsoid(Vector(c), ax * r * scale, ay * r * scale, axis * r * scale, seg=seg, rows=rows, phi1=math.radians(phi1_deg))


def ell_cap(c, radii, axis, phi1_deg, seg=20, rows=6, scale=1.012):
    """A cap of an axis-aligned ellipsoid (radii rx, ry, rz) about the direction axis (given in the unit sphere)."""
    rx, ry, rz = radii
    bm = cap((0, 0, 0), axis, 1.0, phi1_deg, seg, rows, scale)
    bm.transform(T(c) @ diag(rx, ry, rz))
    return bm


def _se(w, e):
    s = math.sin(w)
    return math.copysign(abs(s) ** e, s)


def _ce(w, e):
    c = math.cos(w)
    return math.copysign(abs(c) ** e, c)


def superellipsoid(c, hx, hy, hz, e=0.45, seg=24, rows=12):
    """A rounded box (e small) .. sphere (e = 1) with half sizes hx, hy, hz, axis-aligned, centred on c."""
    c = Vector(c)
    rings = [c + Z * hz]
    for i in range(1, rows):
        phi = math.pi / 2 - math.pi * i / rows
        cp, zz = _ce(phi, e), _se(phi, e)
        rings.append([c + Vector((cp * _ce(th, e) * hx, cp * _se(th, e) * hy, zz * hz))
                      for th in (TAU * j / seg for j in range(seg))])
    rings.append(c - Z * hz)
    return ring_mesh(rings)


def tube(path, r0, r1=None, seg=8, radii=None):
    """Round tube along a polyline of Vectors, radius r0 -> r1 (or an explicit per-point list), pole-closed ends."""
    r1 = r0 if r1 is None else r1
    n = len(path)
    rings = []
    for i, p in enumerate(path):
        t = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        r = radii[i] if radii else r0 + (r1 - r0) * i / (n - 1)
        az = -t
        ax, ay = perp_frame(az)
        if i == 0:
            rings.append(p + az * r * 0.5)
        rings.append([p + r * (math.cos(th) * ax + math.sin(th) * ay) for th in (TAU * j / seg for j in range(seg))])
        if i == n - 1:
            rings.append(p - az * r * 0.5)
    return ring_mesh(rings)


def cone(base, tip, r, flat=1.0, seg=12):
    """A cone from base (radius r) to a point, optionally flattened in Y (about the base)."""
    base, tip = Vector(base), Vector(tip)
    bm = tube([base, base.lerp(tip, 0.45), tip], r, 0.006, seg=seg)
    if flat != 1.0:
        bm.transform(about(base, diag(1, flat, 1)))
    return bm


def lathe(profile, seg=24):
    """Surface of revolution around Z through (r, z) points in order; r = 0 is a pole."""
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append(Vector((0, 0, z)))
        else:
            rings.append([Vector((r * math.cos(TAU * j / seg), r * math.sin(TAU * j / seg), z)) for j in range(seg)])
    return ring_mesh(rings)


def torus(c, R, r, axis=Z, seg=28, rseg=10):
    """A ring of major radius R, tube radius r, around the unit direction axis (seg = 6 gives a hexagonal ring)."""
    axis = Vector(axis).normalized()
    ax, ay = perp_frame(axis)
    rings = []
    for i in range(seg):
        a = TAU * i / seg
        rad = math.cos(a) * ax + math.sin(a) * ay
        centre = Vector(c) + R * rad
        rings.append([centre + r * (math.cos(b) * rad + math.sin(b) * axis) for b in (TAU * j / rseg for j in range(rseg))])
    return ring_mesh(rings, closed=True)


def solid_patch(outer, inner):
    """A closed slab between two rows x cols grids of Vectors (outer and inner skins)."""
    bm = bmesh.new()
    R, C = len(outer), len(outer[0])
    O = [[bm.verts.new(p) for p in row] for row in outer]
    I = [[bm.verts.new(p) for p in row] for row in inner]
    for r in range(R - 1):
        for c in range(C - 1):
            bm.faces.new((O[r][c], O[r][c + 1], O[r + 1][c + 1], O[r + 1][c]))
            bm.faces.new((I[r + 1][c], I[r + 1][c + 1], I[r][c + 1], I[r][c]))
    for c in range(C - 1):
        bm.faces.new((O[0][c + 1], O[0][c], I[0][c], I[0][c + 1]))
        bm.faces.new((O[R - 1][c], O[R - 1][c + 1], I[R - 1][c + 1], I[R - 1][c]))
    for r in range(R - 1):
        bm.faces.new((O[r][0], O[r + 1][0], I[r + 1][0], I[r][0]))
        bm.faces.new((O[r + 1][C - 1], O[r][C - 1], I[r][C - 1], I[r + 1][C - 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def prism(pts, tv):
    """A thin prism: the planar polygon pts extruded along the vector tv (centred on the polygon)."""
    bm = bmesh.new()
    A = [bm.verts.new(Vector(p) + tv * 0.5) for p in pts]
    B = [bm.verts.new(Vector(p) - tv * 0.5) for p in pts]
    bm.faces.new(A)
    bm.faces.new(list(reversed(B)))
    n = len(pts)
    for i in range(n):
        bm.faces.new((A[i], B[i], B[(i + 1) % n], A[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def box_bm(size, bevel=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.transform(diag(*size))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=segments, affect='EDGES')
    return bm


def join(bms):
    """Merge several bmeshes into one (frees the inputs)."""
    out = bmesh.new()
    for bm in bms:
        vmap = {v: out.verts.new(v.co) for v in bm.verts}
        for f in bm.faces:
            out.faces.new([vmap[v] for v in f.verts])
        bm.free()
    out.normal_update()
    return out


def xf(bm, M):
    bm.transform(M)
    return bm


# ---------------------------------------------------------------- surfaces (for placing faces)
def lathe_surf(profile):
    """surf(z, a) -> (point, outward normal) on a surface of revolution given by outer (r, z) points."""
    pts = sorted(((q[0], q[1]) for q in profile), key=lambda q: q[1])

    def f(z, a):
        R, dR = pts[0][0], 0.0
        for (r0, z0), (r1, z1) in zip(pts, pts[1:]):
            if z0 <= z <= z1 and z1 > z0:
                u = (z - z0) / (z1 - z0)
                R, dR = r0 + (r1 - r0) * u, (r1 - r0) / (z1 - z0)
                break
        p = Vector((R * math.cos(a), R * math.sin(a), z))
        n = Vector((math.cos(a), math.sin(a), -dR)).normalized()
        return p, n
    return f


def ellipsoid_surf(c, rx, ry, rz, M=None):
    """surf(z, a) on an axis-aligned ellipsoid; with M the result is transformed (M applied about c's frame)."""
    c = Vector(c)
    M3 = M.to_3x3() if M is not None else None

    def f(z, a):
        k = math.sqrt(max(0.0, 1 - ((z - c.z) / rz) ** 2))
        p = c + Vector((rx * k * math.cos(a), ry * k * math.sin(a), z - c.z))
        n = Vector(((p.x - c.x) / rx ** 2, (p.y - c.y) / ry ** 2, (p.z - c.z) / rz ** 2)).normalized()
        if M is not None:
            p, n = M @ p, (M3 @ n).normalized()
        return p, n
    return f


def oval_patch(surf, zc, zh, ac, ah, rows=8, cols=12, thick=0.012):
    """An oval patch lying on a surf(z, a) surface: centred on height zc / azimuth ac, half extents zh / ah."""
    outer, inner = [], []
    for i in range(rows + 1):
        w = -1 + 2 * i / rows
        z = zc + zh * w * 0.98
        half = ah * math.sqrt(max(0.02, 1 - w * w))
        ro, ri = [], []
        for j in range(cols + 1):
            a = ac - half + 2 * half * j / cols
            p, n = surf(z, a)
            ro.append(p + n * thick)
            ri.append(p - n * thick * 0.5)
        outer.append(ro)
        inner.append(ri)
    return solid_patch(outer, inner)


def on_face(c, radii, x, z, side=-1):
    """Point on the camera-side (-Y) face of an axis-aligned ellipsoid at the given x / z offsets from its centre."""
    rx, ry, rz = radii
    k = math.sqrt(max(0.02, 1 - (x / rx) ** 2 - (z / rz) ** 2))
    return Vector(c) + V(x, side * ry * k, z)


# ---------------------------------------------------------------- scene objects
def clear(kinds):
    """Remove the hierarchy of the given kinds (a name or a list) and their mesh data."""
    for k in ([kinds] if isinstance(kinds, str) else kinds):
        root = bpy.data.objects.get(k)
        if root is None:
            continue
        for ob in list(root.children_recursive) + [root]:
            me = ob.data if ob.type == 'MESH' else None
            bpy.data.objects.remove(ob, do_unlink=True)
            if me is not None and me.users == 0:
                bpy.data.meshes.remove(me)


def _link(ob):
    bpy.context.scene.collection.objects.link(ob)


def make_part(name, bm, mat_name, root, M=None, subsurf=2, smooth=True):
    if M is not None:
        bm.transform(M)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(root.name + '_' + name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material(mat_name))
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.update()
    ob = bpy.data.objects.new(root.name + '_' + name, me)
    _link(ob)
    ob.parent = root
    ob['sprite_part'] = name
    if subsurf:
        mod = ob.modifiers.new('subsurf', 'SUBSURF')
        mod.levels = mod.render_levels = subsurf
    return ob


def new_root(kind, pose):
    root = bpy.data.objects.new(kind, None)
    root.empty_display_type = 'PLAIN_AXES'
    root.empty_display_size = 0.2
    _link(root)
    root['sprite_part'] = kind
    root['pose'] = pose
    return root


# ---------------------------------------------------------------- shared face parts
def eye_one(kind, side, c, n, root, M, P, er=None, lid=None, look=None):
    """One big cartoon eye at centre c facing n: white, pupil, lid cap (P['skin']) and a crease when shut, or a
    dark X over the white when P['x'] (knocked out).  P: er, eye (scale), pupil (scale), lid 0..1, dazed, look."""
    er = (er or P['er']) * P.get('eye', 1.0)
    lid = P['lid'] if lid is None else lid
    n = n.normalized()
    up = (Z - n * n.z).normalized() if abs(n.z) < 0.95 else X.copy()
    s = up.cross(n)
    make_part('eye_' + side, ellipsoid(c, n * er * 0.9, s * er * 0.95, up * er * 1.08, seg=18, rows=12),
              kind + '_eye_white', root, M)
    if P.get('x'):
        for k, d in enumerate(((s + up).normalized(), (s - up).normalized())):
            path = [c + n * er * 0.80 - d * er * 0.62, c + n * er * 0.96, c + n * er * 0.80 + d * er * 0.62]
            make_part('xeye_%s%d' % (side, k), tube(path, er * 0.16, seg=6), kind + '_pupil', root, M, subsurf=1)
        return
    shut = lid >= 0.999
    if not shut:
        if P.get('dazed'):
            look = Vector((0.25, -0.8, 0.55)) if side == 'l' else Vector((0.6, -0.8, -0.45))
        elif look is None:
            look = P.get('look', Vector((0.55, -0.85, -0.10)))
        d = (n * 0.9 + look).normalized()
        pr = er * 0.5 * P.get('pupil', 1.0)
        px, py = perp_frame(d)
        make_part('pupil_' + side, ellipsoid(c + d * er * 0.8, px * pr, py * pr, d * pr * 0.6, seg=14, rows=8),
                  kind + '_pupil', root, M)
    if lid > 0.001:
        lup = (Z + n * 0.3).normalized()
        lax = (n - lup * lup.dot(n)).normalized()
        lay = lup.cross(lax)
        lr = er * 1.06
        phi1 = math.pi if shut else lid * math.pi
        make_part('lid_' + side, ellipsoid(c, lax * lr * 0.95, lay * lr * 0.95, lup * lr * 1.1, seg=18, rows=10, phi1=phi1),
                  P['skin'], root, M)
        if shut:
            path = []
            for k in range(11):
                sdeg = -1 + 2 * k / 10
                phi = math.radians(90 - 26 * math.cos(sdeg * math.pi / 2))
                th = sdeg * math.radians(52)
                rr = lr + 0.010
                path.append(c + rr * (math.sin(phi) * (math.cos(th) * lax + math.sin(th) * lay) + math.cos(phi) * lup * 1.1))
            make_part('lash_' + side, tube(path, 0.1 * er, seg=8), kind + '_pupil', root, M)


def brow(kind, side, c, n, root, M, er, angry=1.0):
    """An angry eyebrow above the eye at c (inner end lower)."""
    n = n.normalized()
    up = (Z - n * n.z).normalized()
    s = up.cross(n)            # toward the front
    a = c + n * er * 0.5 + up * er * (1.15 - 0.45 * angry) + s * er * 0.95
    b = c + n * er * 0.5 + up * er * (1.25 + 0.35 * angry) - s * er * 0.7
    make_part('brow_' + side, tube([a, a.lerp(b, 0.5), b], er * 0.2, seg=8), kind + '_pupil', root, M)


def mouth_bm(surf, style, z0, a0, a1, scale=1.0):
    """A mouth on a surface: 'grin'/'small' (solid lip patch), 'o'/'open' (dark ellipsoid), 'flat'/'wobble'/
    'smile'/'frown' (line).  a0 -> a1 sweeps from the front toward the camera side."""
    if style in ('grin', 'small'):
        depth = (0.065 if style == 'grin' else 0.035) * scale
        curl = (0.04 if style == 'grin' else 0.02) * scale
        if style == 'small':
            a0, a1 = a0 - 0.3, a1 + 0.3
        cols, rows = 14, 3
        outer, inner = [], []
        for r in range(rows):
            w = r / (rows - 1)
            ro, ri = [], []
            for cidx in range(cols):
                u = cidx / (cols - 1)
                a = a0 + (a1 - a0) * u
                z_top = z0 + curl * 4 * (u - 0.5) ** 2
                z_bot = z_top - depth * math.sin(math.pi * u) ** 0.85
                z = z_top + (z_bot - z_top) * w
                p, n = surf(z, a)
                ro.append(p + n * 0.012 * scale)
                ri.append(p - n * 0.02 * scale)
            outer.append(ro)
            inner.append(ri)
        return solid_patch(outer, inner)
    if style in ('o', 'open'):
        a = (a0 + a1) / 2
        p, n = surf(z0 - 0.02 * scale, a)
        up = (Z - n * n.z).normalized()
        s = up.cross(n)
        k = 1.0 if style == 'o' else 1.7
        return ellipsoid(p - n * 0.015 * scale, s * 0.04 * k * scale, up * 0.045 * k * scale, n * 0.03 * scale, seg=14, rows=8)
    path = []
    for k in range(13):
        u = k / 12
        a = a0 + (a1 - a0) * u
        z = z0 - 0.01 * scale
        if style == 'wobble':
            z += 0.02 * scale * math.sin(3 * math.pi * u)
        elif style == 'smile':
            z += 0.035 * scale * 4 * (u - 0.5) ** 2
        elif style == 'frown':
            z -= 0.03 * scale * 4 * (u - 0.5) ** 2
        p, n = surf(z, a)
        path.append(p + n * 0.008 * scale)
    return tube(path, 0.015 * scale, seg=8)


# ---------------------------------------------------------------- shared legs
PHASE = {'fl': math.pi / 2, 'br': math.pi / 2, 'fr': 3 * math.pi / 2, 'bl': 3 * math.pi / 2}


def gait(t, phase, A, H):
    """Foot offset (dx, dz) in a walk cycle: swings forward while lifted."""
    th = TAU * t + phase
    return A * math.sin(th), H * max(0.0, math.cos(th))


def quad_legs(kind, root, M, P, t, hips, foot_z, leg_r, foot_r, mat, A=0.1, H=0.06, foot_mat=None):
    """Four tube legs from the (posed) hips to feet on the ground.  P['feet']: walk, stand, flat, charge, limp, tuck."""
    foot_mat = foot_mat or mat
    for name, hip in hips.items():
        hw = M @ hip
        stance = P['feet']
        dx = dz = 0.0
        y = hip.y
        front = name[0] == 'f'
        if stance == 'walk':
            dx, dz = gait(t, PHASE[name], A, H)
        elif stance == 'flat':
            dx = 0.16 if front else -0.16
            y *= 1.4
        elif stance == 'charge':
            dx = 0.14 if front else -0.14
        elif stance == 'limp':
            dx = 0.08 if front else -0.06
            dz = 0.02
        elif stance == 'tuck':
            dx = 0.08 if front else -0.1
            dz = 0.1
        foot = Vector((hip.x + dx, y, foot_z + dz))
        knee = (hw + foot) / 2 + Vector((dz * 0.8, 0, 0))
        make_part('leg_' + name, tube([hw, knee, foot], leg_r, seg=10), mat, root, None)
        make_part('foot_' + name, ellipsoid(foot, X * foot_r[0], Y * foot_r[1], Z * foot_r[2], seg=12, rows=8),
                  foot_mat, root, None)


def biped_legs(kind, root, M, P, t, hip, foot_dims, leg_r, mat, A=0.11, H=0.06, foot_mat=None):
    """Two stubby legs with oval feet.  P['feet']: walk, stand, tuck, flat, limp."""
    foot_mat = foot_mat or mat
    for side, y, phase in (('l', -0.1, math.pi / 2), ('r', 0.1, 3 * math.pi / 2)):
        h = Vector((hip[0], y * (hip[1] / 0.1 if hip[1] else 1.0), hip[2]))
        hw = M @ h
        stance = P['feet']
        dx = dz = tilt = 0.0
        if stance == 'walk':
            dx, dz = gait(t, phase, A, H)
        elif stance == 'stand':
            dx = 0.05 if side == 'l' else -0.03
        elif stance == 'tuck':
            dx = 0.02 if side == 'l' else -0.04
            dz = 0.09
            tilt = 35.0
        elif stance == 'flat':
            dx = 0.26 if side == 'l' else -0.22
            y *= 0.7
        elif stance == 'limp':
            dx = 0.14 if side == 'l' else -0.1
            tilt = -30.0
        fc = Vector((h.x + dx, h.y, foot_dims[2] + dz))
        knee = (hw + fc) / 2 + Vector((dz * 0.8, 0, 0))
        make_part('leg_' + side, tube([hw, knee, fc], leg_r, seg=10), mat, root, None)
        bm = ellipsoid(Vector((0, 0, 0)), X * foot_dims[0], Y * foot_dims[1], Z * foot_dims[2], seg=14, rows=8)
        make_part('foot_' + side, xf(bm, T(fc) @ rot_y(tilt)), foot_mat, root, None)

