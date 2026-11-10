# fr_charkit: the character toolkit shared by fr_enemies.py and nl_enemies.py (a copy of the generic helpers of
# ec_enemies.py, so the France / Netherlands modules never depend on another country's files): colours and plain
# Principled materials, bmesh primitives (ellipsoid, superellipsoid, tube, lathe, torus, box, prism, sheet), the
# VSpine / Spine lathes, the per-kind Builder with cartoon eyes, brows and mouths, biped / quadruped legs, and the
# generic build() / clear() a module wires up with make_api().
#   Conventions (docs/SPRITE_BRIEF.md): Z up, characters FACE +X, the camera looks along +Y from -Y, 1 m = 28.1 px,
#   materials named <kind>_<part>, every object parented to one Empty named after the kind.
import math
import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
PX = 28.1
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
COLORS = {}          # every module registers its <kind>_<part> colours here (COLORS.update(...))
KINDS = []           # every kind built so far (clear() removes them all)

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
def catmull(pts, t):
    """Catmull-Rom through equal-length tuples; t in 0..1 (ends clamped)."""
    n = len(pts)
    f = min(1.0, max(0.0, t)) * (n - 1)
    k = min(n - 2, int(math.floor(f)))
    u = f - k
    p0, p1, p2, p3 = pts[max(0, k - 1)], pts[k], pts[k + 1], pts[min(n - 1, k + 2)]
    return [0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u ** 3)
            for a, b, c, d in zip(p0, p1, p2, p3)]


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


def tr(x, y=0.0, z=0.0):
    return Matrix.Translation(Vector((x, y, z)) if not isinstance(x, Vector) else x)


def scl(sx, sy, sz):
    return Matrix.Diagonal((sx, sy, sz, 1.0))


def about(pivot, M):
    """Apply M about a pivot point."""
    return tr(Vector(pivot)) @ M @ tr(-Vector(pivot))


def V(x, y, z):
    return Vector((x, y, z))


def lerp(a, b, u):
    return a + (b - a) * u


def smooth01(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def wrap_pi(a):
    return (a + math.pi) % TAU - math.pi


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
    """Parametric ellipsoid: c + sin(phi)(cos(th) ax + sin(th) ay) + cos(phi) az."""
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
        bm.transform(about(base, scl(1, flat, 1)))
    return bm


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


def sheet(fn, rows, cols, th, u0=0.0, u1=1.0, v0=0.0, v1=1.0):
    """A thin solid sheet around the parametric mid-surface fn(u, v) -> Vector; th is a number or th(u, v)."""
    outer, inner = [], []
    for i in range(rows + 1):
        u = u0 + (u1 - u0) * i / rows
        ro, ri = [], []
        for j in range(cols + 1):
            v = v0 + (v1 - v0) * j / cols
            p = fn(u, v)
            e = 1e-3
            du = fn(min(u1, u + e), v) - fn(max(u0, u - e), v)
            dv = fn(u, min(v1, v + e)) - fn(u, max(v0, v - e))
            n = du.cross(dv)
            if n.length < 1e-12:
                n = Vector((0, 1, 0))
            n.normalize()
            t = th(u, v) if callable(th) else th
            ro.append(p + n * t)
            ri.append(p - n * t)
        outer.append(ro)
        inner.append(ri)
    return solid_patch(outer, inner)


def lathe(profile, seg=24):
    """Surface of revolution around Z through (r, z) points in order; r = 0 is a pole."""
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append(Vector((0, 0, z)))
        else:
            rings.append([Vector((r * math.cos(TAU * j / seg), r * math.sin(TAU * j / seg), z)) for j in range(seg)])
    return ring_mesh(rings)


def lathe_y(profile, seg=32, closed=False):
    """Revolve a profile of (radius, y) around the Y axis (the disc normal faces the camera).  radius 0 = pole."""
    rings = []
    for rad, y in profile:
        if rad < 1e-6:
            rings.append(Vector((0, y, 0)))
        else:
            rings.append([Vector((rad * math.cos(th), y, rad * math.sin(th))) for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings, closed=closed)


def torus_bm(c, axis, R, r, seg=20, sides=8):
    """A torus around the unit vector axis."""
    axis = Vector(axis).normalized()
    ax, ay = perp_frame(axis)
    prof = [(R + r * math.cos(a), r * math.sin(a)) for a in (TAU * k / sides for k in range(sides))]
    rings = []
    for rad, h in prof:
        rings.append([Vector(c) + rad * (math.cos(th) * ax + math.sin(th) * ay) + axis * h for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings, closed=True)


def box_bm(size, bevel=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.transform(scl(*size))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=segments, affect='EDGES')
    return bm


def flat_poly(points, thick):
    """A flat polygon (list of coplanar Vectors) given a little thickness along its normal."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in points]
    bm.faces.new(vs)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bm.normal_update()
    return bm


def prism(pts, tv):
    """A thin prism: the planar polygon pts extruded along the vector tv (centred on the polygon)."""
    bm = bmesh.new()
    A = [bm.verts.new(p + tv * 0.5) for p in pts]
    B = [bm.verts.new(p - tv * 0.5) for p in pts]
    bm.faces.new(A)
    bm.faces.new(list(reversed(B)))
    n = len(pts)
    for i in range(n):
        bm.faces.new((A[i], B[i], B[(i + 1) % n], A[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
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


def ridged_body(c, rx, ry, rz, lobes, depth, phase=0.0, rings=22, seg=30, taper=1.0):
    """An ellipsoid along X with `lobes` ridges running nose to tail (the cacao pod); taper > 1 points the ends.
    Ring azimuth a: 0 = far side (+Y), pi/2 = top, pi = camera side (-Y)."""
    c = Vector(c)
    out = [c + X * rx]
    for i in range(1, rings):
        phi = math.pi * i / rings
        x = rx * math.cos(phi)
        k = math.sin(phi) ** taper
        ring = []
        for j in range(seg):
            a = TAU * j / seg
            m = 1 + depth * math.cos(lobes * a + phase)
            ring.append(c + Vector((x, ry * k * math.cos(a) * m, rz * k * math.sin(a) * m)))
        out.append(ring)
    out.append(c - X * rx)
    return ring_mesh(out)


# ---------------------------------------------------------------- surfaces (for placing faces)
def ellipsoid_surf(c, rx, ry, rz):
    """surf(z, a) -> (point, outward normal) on an axis-aligned ellipsoid at height z and azimuth a."""
    c = Vector(c)

    def f(z, a):
        k = math.sqrt(max(0.0, 1 - ((z - c.z) / rz) ** 2))
        p = c + Vector((rx * k * math.cos(a), ry * k * math.sin(a), z - c.z))
        n = Vector(((p.x - c.x) / rx ** 2, (p.y - c.y) / ry ** 2, (p.z - c.z) / rz ** 2)).normalized()
        return p, n
    return f


def on_ellipsoid(c, radii, az, el):
    """Point and outward normal on an axis-aligned ellipsoid; az from +X toward -Y (negative = camera side)."""
    rx, ry, rz = radii
    d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    p = Vector((rx * d.x, ry * d.y, rz * d.z))
    n = Vector((p.x / rx ** 2, p.y / ry ** 2, p.z / rz ** 2)).normalized()
    return Vector(c) + p, n


class VSpine:
    """A lathe along a curve in the XZ plane, bottom (v = 0) to top (v = 1).  ctrl: (x, z, r, ky).
    Ring azimuth a: 0 = front (+X side), -pi/2 = camera side (-Y)."""

    def __init__(self, ctrl, lobes=0, depth=0.0):
        self.ctrl, self.lobes, self.depth = ctrl, lobes, depth

    def frame(self, v):
        cx, cz, r, ky = catmull(self.ctrl, v)
        e = 1e-3
        ax, az = catmull(self.ctrl, min(1.0, v + e))[:2]
        bx, bz = catmull(self.ctrl, max(0.0, v - e))[:2]
        tx, tz = ax - bx, az - bz
        l = math.hypot(tx, tz) or 1.0
        n = Vector((tz / l, 0.0, -tx / l))
        return Vector((cx, 0.0, cz)), n, max(0.0, r), ky

    def point(self, v, a):
        c, n, r, ky = self.frame(v)
        m = 1 + self.depth * math.cos(self.lobes * a) if self.lobes else 1.0
        return c + r * m * (math.cos(a) * n + math.sin(a) * ky * Y)

    def normal(self, v, a):
        e = 1e-3
        dv = self.point(v + e, a) - self.point(v - e, a)
        da = self.point(v, a + e) - self.point(v, a - e)
        nrm = da.cross(dv)
        c = self.frame(v)[0]
        if nrm.length < 1e-9:
            nrm = self.point(v, a) - c
        nrm.normalize()
        if nrm.dot(self.point(v, a) - c) < 0:
            nrm = -nrm
        return nrm

    def surf(self):
        return lambda v, a: (self.point(v, a), self.normal(v, a))

    def mesh(self, rings=28, seg=24, v0=0.0, v1=1.0, scale=1.0):
        out = []
        for i in range(rings + 1):
            v = v0 + (v1 - v0) * i / rings
            c, n, r, ky = self.frame(v)
            if r * scale < 1e-4:
                out.append(c)
            else:
                out.append([self.point(v, a) * 1.0 if scale == 1.0 else c + (self.point(v, a) - c) * scale
                            for a in (TAU * j / seg for j in range(seg))])
        return ring_mesh(out)


class Spine:
    """A lathe along a 3D curve.  ctrl: (x, y, z, r, kz, ky) from the NOSE (v = 0) to the TAIL (v = 1).
    Ring azimuth a: 0 = up, +pi/2 = far side (+Y), -pi/2 = camera side (-Y), pi = underneath."""

    def __init__(self, ctrl):
        self.ctrl = ctrl

    def frame(self, v):
        x, y, z, r, kz, ky = catmull(self.ctrl, v)
        e = 1e-3
        a = catmull(self.ctrl, min(1.0, v + e))
        b = catmull(self.ctrl, max(0.0, v - e))
        T = Vector((a[0] - b[0], a[1] - b[1], a[2] - b[2]))
        if T.length < 1e-9:
            T = Vector((-1, 0, 0))
        T.normalize()
        n = Z - T * T.z
        if n.length < 1e-6:
            n = Y.copy()
        n.normalize()
        s = Y - T * T.y - n * n.y
        if s.length < 1e-6:
            s = n.cross(T)
        s.normalize()
        return Vector((x, y, z)), n, s, max(0.0, r), kz, ky

    def point(self, v, a):
        c, n, s, r, kz, ky = self.frame(v)
        return c + r * (math.cos(a) * kz * n + math.sin(a) * ky * s)

    def normal(self, v, a):
        e = 1e-3
        dv = self.point(v + e, a) - self.point(v - e, a)
        da = self.point(v, a + e) - self.point(v, a - e)
        nrm = da.cross(dv)
        c = self.frame(v)[0]
        if nrm.length < 1e-9:
            nrm = self.point(v, a) - c
        nrm.normalize()
        if nrm.dot(self.point(v, a) - c) < 0:
            nrm = -nrm
        return nrm

    def mesh(self, rings=24, seg=20, v0=0.0, v1=1.0, scale=1.0, a0=0.0, a1=TAU):
        """The lathe; a partial azimuth range (a0..a1 < full) gives an open band (the penguin's belly)."""
        full = abs((a1 - a0) - TAU) < 1e-6
        out = []
        for i in range(rings + 1):
            v = v0 + (v1 - v0) * i / rings
            c, n, s, r, kz, ky = self.frame(v)
            if r * scale < 1e-4 and full:
                out.append(c)
            else:
                cnt = seg if full else seg + 1
                out.append([c + r * scale * (math.cos(a) * kz * n + math.sin(a) * ky * s)
                            for a in (a0 + (a1 - a0) * j / seg for j in range(cnt))])
        if full:
            return ring_mesh(out)
        # an open band: a thin solid patch so it has an outline of its own
        inner = [[c + (p - c) * 0.9 for p in ring] if isinstance(ring, list) else ring for ring, c in
                 ((ring, self.frame(v0 + (v1 - v0) * i / rings)[0]) for i, ring in enumerate(out))]
        return solid_patch(out, inner)


# ---------------------------------------------------------------- scene objects
def clear(kind=None, kinds=None):
    """Remove one kind's hierarchy (or all of them) and their mesh data."""
    for k in ([kind] if kind is not None else (kinds or KINDS)):
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


class Builder:
    """Collects the parts of one kind: materials get the kind prefix, geometry gets the pose transform M."""

    def __init__(self, kind, pose, M):
        self.kind, self.M = kind, M
        clear(kind)
        if kind not in KINDS:
            KINDS.append(kind)
        root = bpy.data.objects.new(kind, None)
        root.empty_display_type = 'PLAIN_AXES'
        root.empty_display_size = 0.2
        _link(root)
        root['sprite_part'] = kind
        root['pose'] = pose
        self.root = root

    def part(self, name, bm, mat, subsurf=2, smooth=True, M=None):
        """mat is the part suffix ('body') or a full material name starting with the kind prefix."""
        mat_name = mat if mat.startswith(self.kind + '_') else self.kind + '_' + mat
        M = self.M if M is None else M
        bm.transform(M)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(self.kind + '_' + name)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(material(mat_name))
        if smooth:
            me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
        me.update()
        ob = bpy.data.objects.new(self.kind + '_' + name, me)
        _link(ob)
        ob.parent = self.root
        ob['sprite_part'] = name
        if subsurf:
            mod = ob.modifiers.new('subsurf', 'SUBSURF')
            mod.levels = mod.render_levels = subsurf
        return ob

    def eye(self, side, c, out, r, look=None, pupil=0.5, shut=None, lid=0.0, lid_mat='body', dazed=False, M=None):
        """A big cartoon eye: white ball, pupil, a lid cap (lid 0 open .. 1 shut).  shut='x' draws a knocked-out X,
        shut='lid' a closed lid with a lash crease.  dazed: the pupils roll (side l up-left, side r down-right)."""
        out = out.normalized()
        up = (Z - out * out.z).normalized()
        s = up.cross(out)
        self.part('eye_' + side, ellipsoid(c, out * r * 0.9, s * r * 0.95, up * r * 1.08, seg=18, rows=12), 'eye_white', M=M)
        if shut == 'x':
            ex, ey = perp_frame(out)
            for k, d in enumerate(((ex + ey).normalized(), (ex - ey).normalized())):
                path = [c + out * r * 0.86 - d * r * 0.62, c + out * r * 0.98, c + out * r * 0.86 + d * r * 0.62]
                self.part('xeye_%s%d' % (side, k), tube(path, r * 0.15, seg=6), 'pupil', subsurf=1, M=M)
            return
        closed = shut == 'lid' or lid >= 0.999
        if not closed:
            if dazed:
                look = Vector((0.25, -0.8, 0.55)) if side == 'l' else Vector((0.6, -0.8, -0.45))
            elif look is None:
                look = Vector((0.55, -0.85, -0.10))
            d = (out * 0.9 + look).normalized()
            px, py = perp_frame(d)
            pr = r * pupil
            self.part('pupil_' + side, ellipsoid(c + d * r * 0.8, px * pr, py * pr, d * pr * 0.6, seg=14, rows=8), 'pupil', M=M)
        if lid > 0.001 or closed:
            lup = (Z + out * 0.3).normalized()
            lax = (out - lup * lup.dot(out)).normalized()
            lay = lup.cross(lax)
            lr = r * 1.06
            phi1 = math.pi if closed else lid * math.pi
            self.part('lid_' + side, ellipsoid(c, lax * lr * 0.95, lay * lr * 0.95, lup * lr * 1.1, seg=18, rows=10, phi1=phi1), lid_mat, M=M)
            if closed:
                path = []
                for k in range(11):
                    sdeg = -1 + 2 * k / 10
                    phi = math.radians(90 - 26 * math.cos(sdeg * math.pi / 2))
                    th = sdeg * math.radians(52)
                    rr = lr + 0.010
                    path.append(c + rr * (math.sin(phi) * (math.cos(th) * lax + math.sin(th) * lay) + math.cos(phi) * lup * 1.1))
                self.part('lash_' + side, tube(path, 0.1 * r, seg=8), 'pupil', M=M)

    def brow(self, side, c, out, r, angry=1.0, M=None):
        out = out.normalized()
        up = (Z - out * out.z).normalized()
        s = up.cross(out)
        a = c + out * r * 0.5 + up * r * (1.15 - 0.45 * angry) + s * r * 0.95
        b = c + out * r * 0.5 + up * r * (1.25 + 0.35 * angry) - s * r * 0.7
        self.part('brow_' + side, tube([a, a.lerp(b, 0.5), b], r * 0.2, seg=8), 'pupil', M=M)


def mouth_bm(surf, style, z0, a0, a1, scale=1.0):
    """A mouth on a surface surf(z, a): 'grin'/'small' (a solid lip patch), 'o'/'open' (dark ellipsoid), 'flat'/
    'wobble'/'smile'/'frown' (a line).  a0 -> a1 sweeps from the front toward the camera side."""
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


def line_mouth(path, style, r=0.014):
    """A mouth from an explicit polyline: 'smile', 'flat', 'wobble', 'frown'."""
    pts = []
    n = len(path)
    for i, p in enumerate(path):
        u = i / (n - 1)
        dz = 0.0
        if style == 'wobble':
            dz = 0.018 * math.sin(3 * math.pi * u)
        elif style == 'frown':
            dz = -0.03 * 4 * (u - 0.5) ** 2 + 0.03
        elif style == 'smile':
            dz = 0.03 * 4 * (u - 0.5) ** 2 - 0.02
        pts.append(Vector(p) + Z * dz)
    return tube(pts, r, seg=8)


# ---------------------------------------------------------------- shared legs
PHASE = {'fl': math.pi / 2, 'br': math.pi / 2, 'fr': 3 * math.pi / 2, 'bl': 3 * math.pi / 2}


def gait(t, phase, A, H):
    """Foot offset (dx, dz) in a walk cycle: swings forward while lifted."""
    th = TAU * t + phase
    return A * math.sin(th), H * max(0.0, math.cos(th))


def biped_legs(b, P, t, hip, foot_dims, leg_r, mat, A=0.11, H=0.06, foot_mat=None, y=0.1):
    """Two tube legs from the (posed) hips to feet on the ground.  P['feet']: walk, stand, flat, limp, tuck."""
    foot_mat = foot_mat or mat
    for side, yy, phase in (('l', -y, math.pi / 2), ('r', y, 3 * math.pi / 2)):
        h = Vector((hip[0], yy, hip[2]))
        hw = b.M @ h
        stance = P['feet']
        dx = dz = tilt = 0.0
        if stance == 'walk':
            dx, dz = gait(t, phase, A, H)
        elif stance == 'stand':
            dx = 0.05 if side == 'l' else -0.03
        elif stance == 'flat':
            dx = 0.26 if side == 'l' else -0.22
            yy *= 0.7
        elif stance == 'limp':
            dx = 0.14 if side == 'l' else -0.1
            tilt = -30.0
        elif stance == 'tuck':
            dx = 0.0
            dz = 0.0
        fc = Vector((h.x + dx, yy, foot_dims[2] + dz))
        knee = (hw + fc) / 2 + Vector((dz * 0.8, 0, 0))
        b.part('leg_' + side, tube([hw, knee, fc], leg_r, seg=10), mat, M=Matrix.Identity(4))
        bm = ellipsoid(Vector((0, 0, 0)), X * foot_dims[0], Y * foot_dims[1], Z * foot_dims[2], seg=14, rows=8)
        b.part('foot_' + side, xf(bm, tr(fc) @ rot_y(tilt)), foot_mat, M=Matrix.Identity(4))


def quad_legs(b, P, t, hips, foot_z, leg_r, foot_r, mat, A=0.1, H=0.06, foot_mat=None, splay=0.0):
    """Four tube legs from the (posed) hips to feet on the ground.  P['feet']: walk, stand, flat, limp, tuck, hop."""
    foot_mat = foot_mat or mat
    for name, hip in hips.items():
        hw = b.M @ hip
        stance = P['feet']
        dx = dz = 0.0
        y = hip.y
        front = name[0] == 'f'
        if stance == 'walk':
            dx, dz = gait(t, PHASE[name], A, H)
        elif stance == 'flat':
            dx = 0.16 if front else -0.16
            y *= 1.4
        elif stance == 'limp':
            dx = 0.08 if front else -0.06
            dz = 0.02
        elif stance == 'tuck':
            dx = -0.04 if front else 0.04
            y *= 0.8
        foot = Vector((hip.x + dx, y + math.copysign(splay, y), foot_z + dz))
        knee = (hw + foot) / 2 + Vector((dz * 0.8, math.copysign(splay * 0.8, y), 0))
        b.part('leg_' + name, tube([hw, knee, foot], leg_r, seg=10), mat, M=Matrix.Identity(4))
        b.part('foot_' + name, ellipsoid(foot, X * foot_r[0], Y * foot_r[1], Z * foot_r[2], seg=12, rows=8),
               foot_mat, M=Matrix.Identity(4))


def pose_matrix(P, bob=0.0, lean_extra=0.0, sx_extra=1.0, sz_extra=1.0):
    return tr(0, 0, bob) @ rot_y(P['lean'] + lean_extra) @ scl(P['sx'] * sx_extra, P['sx'] * sx_extra, P['sz'] * sz_extra)



def make_api(BUILDERS):
    """build(kind, pose, t) and clear() for a module whose BUILDERS maps kind -> (fn, {pose: P or dict(M=..., P=...)})."""
    def build(kind, pose, t=0.0):
        fn, table = BUILDERS[kind]
        if pose not in table:
            raise ValueError('unknown pose %r for %s' % (pose, kind))
        P = dict(table[pose])
        mk = P.get('M')
        if mk is None:
            M = Matrix.Identity(4)
        else:
            try:
                M = mk(t)
            except TypeError:
                M = mk()
        b = Builder(kind, pose, M)
        fn(b, pose, t, P.get('P', P))
        return b.root

    def clear_all():
        clear(kinds=list(BUILDERS))
    return build, clear_all
