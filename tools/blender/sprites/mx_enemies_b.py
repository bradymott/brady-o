# mxEnemiesB: the flying / swimming / leaping Mexico enemies and the Mexico items for the pre-rendered 2D sprite
# pipeline (all original cartoon designs).  Same conventions as mx_pepper.py: Blender native axes, Z up, every
# creature FACES +X (screen-right), the sprite camera looks along +Y from -Y.  All of these have a CENTRE origin
# (the Empty sits in the middle of the body: they fly, swim, leap or spin), 1 m = 28.1 px.
#
#   axolotl       pink smiling axolotl with frilly gills (leaps out of the canal)      up(t) down(t) ko
#   heron         grey-blue heron in flight, legs trailing                            fly(t) swoop stun ko
#   fish          pale cheeky cenote fish with one big eye                            swim(t) ko
#   bat           round folk-art fruit bat with big ears                              fly(t) swoop stun ko
#   lava          grumpy lava blob (body material lava_glow is treated as emissive)   up(t) down(t) ko
#   lime          the GOLDEN LIME coin: a lime slice seen from the side              spin(t: rotation about Z)
#   alebrije      the GOLDEN ALEBRIJE star: a winged, big-eared jaguar-lizard         idle(t: hover + flutter)
#   pinata_block  the item block: a paper pinata cube with fringe rows and a face     idle(t: wobble) used
#   taco          the thrown taco                                                     fly(t: spin about Y)
#
# Every object is parented to one Empty named after the kind and carries obj['sprite_part'].  Materials are plain
# Principled BSDFs (Base Color only, roughness 0.5) named <kind>_<part> so a look kit can restyle them later.
#
# API:  build(kind, pose, t=0.0) -> root Empty (deletes any previous build of that kind)      clear() -> all kinds
# Headless preview of everything:
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_enemies_b.py [-- kind ...]
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
PX = 28.1
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxen_b'

KINDS = ['axolotl', 'heron', 'fish', 'bat', 'lava', 'lime', 'alebrije', 'pinata_block', 'taco']
POSES = {
    'axolotl': ['up', 'down', 'ko'],
    'heron': ['fly', 'swoop', 'stun', 'ko'],
    'fish': ['swim', 'ko'],
    'bat': ['fly', 'swoop', 'stun', 'ko'],
    'lava': ['up', 'down', 'ko'],
    'lime': ['spin'],
    'alebrije': ['idle'],
    'pinata_block': ['idle', 'used'],
    'taco': ['fly'],
}
# poses whose t parameter is a 0..1 cycle
CYCLES = {('axolotl', 'up'), ('axolotl', 'down'), ('heron', 'fly'), ('fish', 'swim'), ('bat', 'fly'),
          ('lava', 'up'), ('lava', 'down'), ('lime', 'spin'), ('alebrije', 'idle'), ('pinata_block', 'idle'),
          ('taco', 'fly')}
# nominal height (or diameter) in metres: the game's hit box height
SIZE = {'axolotl': 14 / PX, 'heron': 16 / PX, 'fish': 14 / PX, 'bat': 16 / PX, 'lava': 18 / PX,
        'lime': 17 / PX, 'alebrije': 24 / PX, 'pinata_block': 32 / PX, 'taco': 16 / PX}
ORIGIN = {k: 'centre' for k in KINDS}

COLORS = {
    'axolotl_body': '#ffaacc', 'axolotl_fin': '#ffc6de', 'axolotl_gill': '#ff5a9a', 'axolotl_limb': '#f49cc4',
    'axolotl_eye_white': '#ffffff', 'axolotl_pupil': '#1a1020', 'axolotl_mouth': '#c84a7a',
    'heron_body': '#e3e9f4', 'heron_wing': '#c2cce0', 'heron_tip': '#5a6688', 'heron_beak': '#ffb81a',
    'heron_leg': '#3a3a4a', 'heron_eye_white': '#ffffff', 'heron_pupil': '#1a1020',
    'fish_body': '#ece6f4', 'fish_fin': '#b2a6d2', 'fish_stripe': '#c0b2de', 'fish_eye_white': '#ffffff',
    'fish_iris': '#a89ac8', 'fish_pupil': '#1a1020', 'fish_mouth': '#8a6aa0',
    'bat_body': '#8a4aff', 'bat_wing_near': '#ff3d8b', 'bat_wing_far': '#18c2c2', 'bat_spot': '#ffd84a',
    'bat_ear': '#ff8ab8', 'bat_eye_white': '#ffffff', 'bat_pupil': '#1a1020', 'bat_mouth': '#3a1850',
    'lava_glow': '#ff8a2a', 'lava_crust': '#5a2416', 'lava_eye_white': '#fff6d0', 'lava_pupil': '#1a1020',
    'lime_rind': '#e2a92c', 'lime_pith': '#eeffc0', 'lime_flesh': '#7ad04a', 'lime_highlight': '#ffffff',
    'alebrije_gold': '#ffd24a', 'alebrije_pink': '#ff3d8b', 'alebrije_teal': '#18c2c2',
    'alebrije_eye_white': '#ffffff', 'alebrije_pupil': '#1a1020',
    'pinata_block_paper': '#ff3d8b', 'pinata_block_fringe_yellow': '#ffb81a', 'pinata_block_fringe_teal': '#18c2c2',
    'pinata_block_fringe_violet': '#8a4aff', 'pinata_block_fringe_pink': '#ff8ab8', 'pinata_block_cone': '#ffd84a',
    'pinata_block_eye_white': '#ffffff', 'pinata_block_pupil': '#1a1020', 'pinata_block_mouth': '#7a1a3a',
    'pinata_block_card': '#c8a888', 'pinata_block_tear': '#5a4030', 'pinata_block_scrap': '#b89098',
    'taco_shell': '#f2c060', 'taco_rim': '#c8902a', 'taco_lettuce': '#5ad04a', 'taco_tomato': '#e83a2a',
    'taco_meat': '#8a4a2a',
}

X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))


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


def V(x, y, z):
    return Vector((x, y, z))


def lerp(a, b, u):
    return a + (b - a) * u


# ---------------------------------------------------------------- bmesh builders
def ring_mesh(rings, closed=False):
    """Rings ordered along the axis; each a list of Vectors (same count) or a single Vector (a pole).
    Returns a bmesh of quads with triangle fans at the poles.  closed=True joins the last ring to the first."""
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
    ax, ay = perp_frame(axis)
    prof = [(R + r * math.cos(a), r * math.sin(a)) for a in (TAU * k / sides for k in range(sides))]
    rings = []
    for rad, h in prof:
        rings.append([c + rad * (math.cos(th) * ax + math.sin(th) * ay) + axis * h for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings, closed=True)


def box_bm(size, bevel=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.transform(scl(*size))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=segments, affect='EDGES')
    return bm


def flat_poly(points, normal, thick):
    """A flat polygon (list of Vectors, coplanar) given a little thickness along its normal."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in points]
    bm.faces.new(vs)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bm.normal_update()
    return bm


def cone(base, tip, r, seg=12):
    return tube([Vector(base), (Vector(base) + Vector(tip)) * 0.5, Vector(tip)], r, 0.004, seg=seg)


# ---------------------------------------------------------------- a spine lathe (horizontal creatures)
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

    def mesh(self, rings=24, seg=20, v0=0.0, v1=1.0, scale=1.0):
        out = []
        for i in range(rings + 1):
            v = v0 + (v1 - v0) * i / rings
            c, n, s, r, kz, ky = self.frame(v)
            if r * scale < 1e-4:
                out.append(c)
            else:
                out.append([c + r * scale * (math.cos(a) * kz * n + math.sin(a) * ky * s)
                            for a in (TAU * j / seg for j in range(seg))])
        return ring_mesh(out)


def on_ellipsoid(c, radii, az, el):
    """Point and outward normal on an axis-aligned ellipsoid; az from +X toward -Y (negative = camera side)."""
    rx, ry, rz = radii
    d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    p = Vector((rx * d.x, ry * d.y, rz * d.z))
    n = Vector((p.x / rx ** 2, p.y / ry ** 2, p.z / rz ** 2)).normalized()
    return Vector(c) + p, n


# ---------------------------------------------------------------- scene objects
def clear(kind=None):
    """Remove one kind's hierarchy (or all of them) and their mesh data."""
    for k in (KINDS if kind is None else [kind]):
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
    """Collects parts for one kind: every part gets the kind prefix on its material and the pose transform M."""

    def __init__(self, kind, pose, M):
        self.kind, self.M = kind, M
        clear(kind)
        root = bpy.data.objects.new(kind, None)
        root.empty_display_type = 'PLAIN_AXES'
        root.empty_display_size = 0.2
        _link(root)
        root['sprite_part'] = kind
        root['pose'] = pose
        self.root = root

    def part(self, name, bm, mat, subsurf=2, smooth=True, M=None):
        """mat is the part suffix ('body') or a full material name containing an underscore prefix of the kind."""
        mat_name = mat if mat.startswith(self.kind + '_') else self.kind + '_' + mat
        M = self.M if M is None else M
        bm.transform(M)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(material(mat_name))
        if smooth:
            me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
        me.update()
        ob = bpy.data.objects.new(name, me)
        _link(ob)
        ob.parent = self.root
        ob['sprite_part'] = name
        if subsurf:
            mod = ob.modifiers.new('subsurf', 'SUBSURF')
            mod.levels = mod.render_levels = subsurf
        return ob

    def eye(self, side, c, out, r, look=None, pupil=0.5, shut=False, lid=0.0, lid_mat='body', iris=None,
            dazed=None, white='eye_white'):
        """A big cartoon eye: white ball, pupil looking at the camera-front, optional lid or X (knocked out)."""
        out = out.normalized()
        ex, ey = perp_frame(out)
        self.part('eye_' + side, ellipsoid(c, ex * r, ey * r, out * r * 0.85, seg=16, rows=10), white)
        if shut:
            for k, d in enumerate(((ex + ey).normalized(), (ex - ey).normalized())):
                path = [c + out * r * 0.86 - d * r * 0.62, c + out * r * 0.98, c + out * r * 0.86 + d * r * 0.62]
                self.part('xeye_%s%d' % (side, k), tube(path, r * 0.15, seg=6), 'pupil', subsurf=1)
            return
        look = Vector((0.45, -0.85, -0.05)) if look is None else look
        if dazed is not None:
            look = dazed
        d = (out * 0.9 + look).normalized()
        px, py = perp_frame(d)
        if iris:
            self.part('iris_' + side, ellipsoid(c + d * r * 0.60, px * r * 0.64, py * r * 0.64, d * r * 0.45, 14, 8), iris)
        pr = r * pupil
        self.part('pupil_' + side, ellipsoid(c + d * r * 0.80, px * pr, py * pr, d * pr * 0.55, 14, 8), 'pupil')
        if lid > 0.001:
            lup = (Z + out * 0.3).normalized()
            lax = (out - lup * lup.dot(out)).normalized()
            lay = lup.cross(lax)
            lr = r * 1.07
            self.part('lid_' + side, ellipsoid(c, lax * lr * 0.95, lay * lr * 0.95, lup * lr * 1.1, 16, 10, phi1=lid * math.pi), lid_mat)


def wing_frame(root, side, flap_deg, sweep_deg):
    """World matrix for a wing whose local +Y is the span (mirrored for the camera-side wing, side = -1)."""
    return tr(root) @ rot_z(side * sweep_deg) @ rot_x(side * flap_deg) @ scl(1.0, side, 1.0)


# ================================================================= axolotl
def build_axolotl(b, pose, t, P):
    arch, wag = P['arch'], 0.6 * math.sin(TAU * t)
    pts = [(0.42, 0.000, 1.00, 1.00), (0.38, 0.085, 0.85, 1.10), (0.28, 0.150, 0.95, 1.20), (0.15, 0.155, 1.00, 1.15),
           (0.02, 0.125, 1.00, 1.00), (-0.14, 0.095, 1.05, 0.90), (-0.28, 0.065, 1.40, 0.70), (-0.40, 0.035, 2.20, 0.50),
           (-0.48, 0.000, 1.00, 1.00)]
    ctrl = []
    for x, r, kz, ky in pts:
        z = arch * 0.09 * (1 - (x / 0.45) ** 2)
        w = max(0.0, -x - 0.05) / 0.45
        ctrl.append((x, wag * 0.10 * w * w, z, r, kz, ky))
    sp = Spine(ctrl)
    b.part('body', sp.mesh(rings=28, seg=22), 'body')
    # tail fin: a vertical blade along the tail
    def fin(u, w):
        v = 0.60 + 0.40 * u
        c, n, s, r, kz, ky = sp.frame(v)
        h = r * kz + 0.075 * math.sin(math.pi * u) ** 0.8
        return c + n * ((w * 2 - 1) * h)
    b.part('fin', sheet(fin, 8, 6, lambda u, w: 0.012 * (1 - abs(w * 2 - 1)) + 0.004), 'fin')
    # frilly gills: three feathered stalks each side, sweeping back from the head
    ns = P['ns']
    for side_name, sgn in (('l', -1), ('r', 1)):
        for k in range(3):
            v = 0.30 + 0.04 * k
            a = sgn * (0.55 + 0.42 * k)
            base, nrm = sp.point(v, a), sp.normal(v, a)
            wig = 0.15 * math.sin(TAU * t + k * 1.3)
            d = (nrm * 1.0 - X * 0.40 + Z * (0.55 - 0.45 * k + wig)).normalized()
            if pose == 'ko':
                d = (nrm * 0.6 - X * 0.3 - Z * 0.9 * ns).normalized()
            path = [base - nrm * 0.02, base + d * 0.09, base + d * 0.17 - X * 0.03, base + d * 0.23 - X * 0.08]
            b.part('gill_%s%d' % (side_name, k), tube(path, 0.042, 0.018, seg=8), 'gill')
            px, py = perp_frame(d)
            for j in range(3):
                q = base + d * (0.08 + 0.055 * j) - X * 0.028 * j
                off = (px if j % 2 == 0 else -px) * 0.04
                b.part('frill_%s%d%d' % (side_name, k, j), ellipsoid(q + off, px * 0.046, py * 0.028, d * 0.03, 10, 6), 'gill', subsurf=1)
    # eyes: big, high on the head so both peek out, frog-style
    for side_name, sgn in (('l', -1), ('r', 1)):
        v, a = 0.21, sgn * 0.80
        c, n = sp.point(v, a), sp.normal(v, a)
        b.eye(side_name, c - n * 0.02, n, 0.08, shut=pose == 'ko', pupil=0.6, lid=0.12 if pose != 'ko' else 0,
              look=Vector((0.5, -0.8 * ns, 0.1)))
    # smile (camera side; mirrored when the ko pose flips the body)
    if pose == 'ko':
        v, a = 0.08, ns * -2.0
        c, n = sp.point(v, a), sp.normal(v, a)
        ax, ay = perp_frame(n)
        b.part('mouth', ellipsoid(c - n * 0.01, ax * 0.03, ay * 0.03, n * 0.02, 12, 6), 'mouth', subsurf=1)
    else:
        path = []
        for k in range(11):
            s = k / 10
            v = 0.04 + 0.17 * s
            a = ns * (-(math.pi / 2 + 0.50) + 0.60 * s * s)
            path.append(sp.point(v, a) + sp.normal(v, a) * 0.008)
        b.part('mouth', tube(path, 0.02, seg=8), 'mouth')
    # four stubby legs
    for name, x, y in (('leg_fl', 0.17, -0.10), ('leg_fr', 0.17, 0.10), ('leg_bl', -0.10, -0.09), ('leg_br', -0.10, 0.09)):
        c = Vector((x, y, -0.10 + arch * 0.09 * (1 - (x / 0.45) ** 2)))
        d = Vector((-0.35, 0.0, -1.0)).normalized()
        px, py = perp_frame(d)
        b.part(name, ellipsoid(c + d * 0.03, px * 0.036, py * 0.030, d * 0.065, 12, 8), 'limb')


AXOLOTL = {
    'up':   dict(arch=1.0, M=lambda: rot_y(-30), ns=1),
    'down': dict(arch=-0.5, M=lambda: rot_y(38), ns=1),
    'ko':   dict(arch=0.2, M=lambda: rot_x(180) @ rot_y(10), ns=-1),
}


# ================================================================= heron
def build_heron(b, pose, t, P):
    ns = P['ns']
    pts = [(0.28, 0.000, 1.0, 1.0), (0.24, 0.075, 1.0, 1.0), (0.12, 0.125, 1.0, 1.0), (-0.02, 0.135, 1.0, 1.0),
           (-0.16, 0.115, 1.0, 1.0), (-0.30, 0.065, 1.2, 0.8), (-0.40, 0.000, 1.0, 1.0)]
    sp = Spine([(x, 0.0, 0.0, r, kz, ky) for x, r, kz, ky in pts])
    b.part('body', sp.mesh(rings=20, seg=20), 'body')
    # neck (folded in an S in flight, stretched out in the swoop), head, beak, crest
    if pose == 'swoop':
        neck = [V(0.20, 0, 0.04), V(0.30, 0, 0.08), V(0.39, 0, 0.12)]
        hc = V(0.44, 0, 0.13)
    elif pose == 'stun':
        neck = [V(0.18, 0, 0.06), V(0.30, 0, 0.13), V(0.33, 0, 0.21), V(0.26, 0, 0.26)]
        hc = V(0.25, 0, 0.29)
    else:
        neck = [V(0.18, 0, 0.06), V(0.30, 0, 0.12), V(0.36, 0, 0.21), V(0.33, 0, 0.29)]
        hc = V(0.33, 0, 0.32)
    b.part('neck', tube(neck, 0.055, 0.045, seg=10), 'body')
    head_r = (0.085, 0.07, 0.072)
    b.part('head', blob(hc, *head_r, seg=16, rows=10), 'body')
    bd = (X * 0.98 - Z * 0.08).normalized() if pose != 'stun' else (X * 0.95 - Z * 0.35).normalized()
    b.part('beak', tube([hc + bd * 0.05, hc + bd * 0.18, hc + bd * 0.32], 0.036, 0.004, seg=10), 'beak')
    for k in range(2):
        p0 = hc + V(-0.05, 0, 0.03 + 0.02 * k)
        p1 = p0 + V(-0.10, 0, 0.07 - 0.03 * k)
        p2 = p0 + V(-0.19, 0, 0.09 - 0.06 * k)
        b.part('crest%d' % k, tube([p0, p1, p2], 0.016, 0.006, seg=8), 'tip')
    for side_name, az in (('r', -0.45), ('l', -1.25)):
        c, n = on_ellipsoid(hc, head_r, az * ns, 0.30)
        dazed = Vector((0.3, -0.8, 0.5)) if side_name == 'l' else Vector((0.5, -0.8, -0.4))
        b.eye(side_name, c - n * 0.008, n, 0.034, shut=pose == 'ko', pupil=0.55, lid=0.5 if pose == 'stun' else 0.1,
              dazed=dazed if pose == 'stun' else None)
    # wings: one tapered, slightly scalloped surface; the pale inner panel and the dark fingered tips
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.02, 0.09 * side, 0.08), side, flap, sweep)
        def wing(u, v, W=W):
            span = 0.62 * u
            le = 0.13 - 0.20 * u * u
            chord = 0.33 * (1 - u ** 1.3) + 0.015 + 0.05 * math.sin(5 * math.pi * u) ** 2 * u
            return W @ V(le - chord * v, span, -0.03 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.022 - 0.012 * u, u1=0.58), 'wing')
        b.part('wingtip_' + side_name, sheet(wing, 10, 4, lambda u, v: 0.012 - 0.006 * u, u0=0.56), 'tip')
    # tail fan
    def tail(u, v):
        return V(-0.33 - 0.17 * u, (v * 2 - 1) * (0.03 + 0.06 * u), 0.02 + 0.01 * u)
    b.part('tail', sheet(tail, 4, 4, 0.008), 'wing')
    # long legs trailing behind
    for side_name, side in (('l', -1), ('r', 1)):
        legs = P['legs']
        path = [V(-0.08, 0.045 * side, -0.10)] + [V(x, 0.05 * side, z) for x, z in legs]
        b.part('leg_' + side_name, tube(path, 0.015, 0.013, seg=8), 'leg')
        fx, fz = legs[-1]
        b.part('foot_' + side_name, tube([V(fx, 0.05 * side, fz), V(fx - 0.07, 0.05 * side, fz + 0.01 * ns)], 0.013, 0.008, seg=6), 'leg')


HERON = {
    'fly':   dict(flap=lambda t: 55 * math.cos(TAU * t), sweep=16, legs=[(-0.30, -0.15), (-0.50, -0.17)], M=lambda: Matrix.Identity(4), ns=1),
    'swoop': dict(flap=lambda t: 28, sweep=55, legs=[(-0.32, -0.12), (-0.55, -0.12)], M=lambda: rot_y(22), ns=1),
    'stun':  dict(flap=lambda t: -62, sweep=6, legs=[(-0.14, -0.28), (-0.17, -0.42)], M=lambda: rot_y(-8), ns=1),
    'ko':    dict(flap=lambda t: -70, sweep=12, legs=[(-0.12, -0.30), (-0.10, -0.46)], M=lambda: rot_x(180) @ rot_y(-12), ns=-1),
}


# ================================================================= fish
def build_fish(b, pose, t, P):
    ns = P['ns']
    wag = math.sin(TAU * t)
    pts = [(0.40, 0.000, 1.0, 1.0), (0.36, 0.085, 0.90, 0.70), (0.26, 0.150, 1.00, 0.65), (0.12, 0.185, 1.00, 0.60),
           (-0.04, 0.170, 1.00, 0.60), (-0.18, 0.120, 1.00, 0.60), (-0.30, 0.060, 1.10, 0.60), (-0.34, 0.000, 1.0, 1.0)]
    ctrl = []
    for x, r, kz, ky in pts:
        w = max(0.0, -x - 0.05) / 0.3
        ctrl.append((x, 0.04 * wag * w * w, 0.0, r, kz, ky))
    sp = Spine(ctrl)
    b.part('body', sp.mesh(rings=24, seg=22), 'body')
    for k, vc in enumerate((0.40, 0.53, 0.66)):
        b.part('stripe%d' % k, sp.mesh(rings=3, seg=22, v0=vc - 0.022, v1=vc + 0.022, scale=1.03), 'stripe', subsurf=1)
    # forked tail, wagging about the root
    pivot = V(-0.31, 0.03 * wag, 0.0)
    T = tr(pivot) @ rot_z(P['wag'] * wag)
    def tail(u, w):
        ww = w * 2 - 1
        x = -u * (0.25 - 0.09 * (1 - abs(ww)) * u)
        return T @ V(x, 0.0, ww * (0.035 + 0.15 * u))
    b.part('tail', sheet(tail, 6, 6, lambda u, w: 0.012 * (1 - abs(w * 2 - 1)) * (1 - 0.6 * u) + 0.004), 'fin')
    # dorsal fin (raked back) and the camera-side pectoral fin
    def dorsal(u, w):
        x = 0.05 - 0.27 * u
        v = 0.0
        # find the body top at this x (the spine is close to straight so v ~ linear in x)
        v = (0.40 - x) / 0.74
        c, n, s, r, kz, ky = sp.frame(v)
        h = 0.10 * math.sin(math.pi * u) ** 0.6 + 0.01
        return c + n * (r * kz - 0.02 + w * h) - X * 0.05 * w
    b.part('dorsal', sheet(dorsal, 6, 3, lambda u, w: 0.012 * (1 - w) + 0.004), 'fin')
    pc = V(0.07, -0.10 * ns, -0.05)
    pd = Vector((-0.75, -0.35 * ns, -0.55 if pose != 'ko' else -0.1)).normalized()
    px, py = perp_frame(pd)
    b.part('pectoral', ellipsoid(pc + pd * 0.05, px * 0.025, py * 0.045, pd * 0.085, 10, 6), 'fin')
    # one huge cheeky eye on the camera side
    v, a = 0.21, ns * -1.2
    c, n = sp.point(v, a), sp.normal(v, a)
    b.eye('l', c - n * 0.015, n, 0.085, shut=pose == 'ko', pupil=0.42, iris='iris', lid=0.28 if pose != 'ko' else 0,
          look=Vector((0.5, -0.9 * ns, -0.15)))
    # grin
    if pose == 'ko':
        v, a = 0.07, ns * -1.95
        c, n = sp.point(v, a), sp.normal(v, a)
        ax, ay = perp_frame(n)
        b.part('mouth', ellipsoid(c - n * 0.01, ax * 0.03, ay * 0.03, n * 0.02, 12, 6), 'mouth', subsurf=1)
    else:
        path = []
        for k in range(11):
            s = k / 10
            v = 0.02 + 0.15 * s
            a = ns * (-(math.pi / 2 + 0.45) + 0.55 * s * s)
            path.append(sp.point(v, a) + sp.normal(v, a) * 0.008)
        b.part('mouth', tube(path, 0.02, seg=8), 'mouth')


FISH = {
    'swim': dict(wag=28, M=lambda: Matrix.Identity(4), ns=1),
    'ko':   dict(wag=0, M=lambda: rot_x(180) @ rot_y(12), ns=-1),
}


# ================================================================= bat
def build_bat(b, pose, t, P):
    ns = P['ns']
    body_r = (0.16, 0.15, 0.18)
    b.part('body', blob((0, 0, 0), *body_r, seg=20, rows=12), 'body')
    # big ears with pink inner ears
    for side_name, side in (('l', -1), ('r', 1)):
        base = V(0.02, 0.085 * side, 0.14)
        d = Vector((0.0, 0.45 * side, 1.0)).normalized()
        if pose == 'ko':
            d = Vector((-0.2, 0.9 * side, 0.4)).normalized()
        ax, ay = perp_frame(d)
        b.part('ear_' + side_name, ellipsoid(base + d * 0.09, X * 0.058, ax.cross(d).normalized() * 0.036, d * 0.125, 12, 8), 'body')
        inner_dir = (X * 0.6 - Y * 0.6 * ns + d * 0.0).normalized()
        b.part('ear_in_' + side_name, ellipsoid(base + d * 0.095 + inner_dir * 0.025, X * 0.036, ax.cross(d).normalized() * 0.02, d * 0.085, 10, 6), 'ear')
    # face: two big eyes, a grin, three yellow chest dashes
    for side_name, az in (('r', -0.45), ('l', -1.25)):
        c, n = on_ellipsoid((0, 0, 0), body_r, az * ns, 0.32)
        dazed = Vector((0.3, -0.8, 0.5)) if side_name == 'l' else Vector((0.5, -0.8, -0.4))
        b.eye(side_name, c - n * 0.012, n, 0.056, shut=pose == 'ko', pupil=0.5, lid=0.5 if pose == 'stun' else 0.08,
              dazed=dazed if pose == 'stun' else None)
    path = []
    for k in range(11):
        s = k / 10
        az = ns * lerp(-0.25, -1.45, s)
        el = -0.22 - 0.12 * math.sin(math.pi * s) * (1 if pose != 'ko' else -1)
        c, n = on_ellipsoid((0, 0, 0), body_r, az, el)
        path.append(c + n * 0.006)
    b.part('mouth', tube(path, 0.014, seg=8), 'mouth')
    for k in range(3):
        c, n = on_ellipsoid((0, 0, 0), body_r, ns * -0.95, -0.42 - 0.28 * k)
        ax, ay = perp_frame(n)
        b.part('dash%d' % k, ellipsoid(c, ax * 0.012, ay * 0.045, n * 0.012, 8, 6), 'spot', subsurf=1)
    # scalloped wings: pink on the camera side, teal on the far side
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.0, 0.13 * side, 0.04), side, flap, sweep)
        def wing(u, v, W=W):
            span = 0.50 * u
            le = 0.09 - 0.11 * u
            te = -0.12 - 0.22 * (1 - u) ** 0.5 + 0.08 * math.sin(3 * math.pi * u) ** 2
            return W @ V(lerp(le, te, v), span, 0.0)
        b.part('wing_' + side_name, sheet(wing, 12, 4, lambda u, v: 0.013 - 0.008 * u), 'wing_near' if side_name == 'l' else 'wing_far')
        sc = wing(0.5, 0.42)
        du = wing(0.52, 0.42) - wing(0.48, 0.42)
        dv = wing(0.5, 0.46) - wing(0.5, 0.38)
        n = du.cross(dv).normalized()
        ax, ay = perp_frame(n)
        b.part('spot_' + side_name, ellipsoid(sc, ax * 0.038, ay * 0.038, n * 0.025, 12, 6), 'spot', subsurf=1)
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('foot_' + side_name, blob((-0.03, 0.06 * side, -0.17), 0.03, 0.022, 0.035, 8, 6), 'mouth', subsurf=1)


BAT = {
    'fly':   dict(flap=lambda t: 18 + 48 * math.cos(TAU * t), sweep=36, M=lambda: Matrix.Identity(4), ns=1),
    'swoop': dict(flap=lambda t: 58, sweep=70, M=lambda: rot_y(28), ns=1),
    'stun':  dict(flap=lambda t: -72, sweep=8, M=lambda: rot_y(-10), ns=1),
    'ko':    dict(flap=lambda t: -78, sweep=15, M=lambda: rot_x(180) @ rot_y(-15), ns=-1),
}


# ================================================================= lava
def build_lava(b, pose, t, P):
    rx, rz = 0.27, 0.27
    body_mat = 'crust' if pose == 'ko' else 'glow'
    body_r = (rx, 0.25, rz)
    b.part('body', blob((0, 0, 0), *body_r, seg=20, rows=12), body_mat)
    stretch = 0.08 * math.sin(TAU * t)
    if pose == 'up':
        b.part('tip', tube([V(0, 0, 0.10), V(0, 0, 0.26), V(0.03, 0, 0.38 + stretch)], 0.16, 0.01, seg=14), body_mat)
        drops = [(0.10, -0.10, -0.36 - 0.06 * t, 0.055), (-0.12, 0.05, -0.40 - 0.10 * t, 0.045), (0.02, 0.13, -0.33 - 0.04 * t, 0.035)]
    elif pose == 'down':
        b.part('tip', tube([V(0, 0, -0.10), V(0, 0, -0.24), V(-0.02, 0, -0.33)], 0.17, 0.04, seg=14), body_mat)
        drops = [(0.08, -0.10, 0.38 + 0.08 * t, 0.05), (-0.13, 0.05, 0.46 + 0.14 * t, 0.045), (0.03, 0.13, 0.35 + 0.05 * t, 0.035)]
    else:
        drops = []
        for k, (az, el) in enumerate(((-0.3, -0.5), (-1.6, 0.1), (0.8, 0.5), (-2.4, -0.2))):
            c, n = on_ellipsoid((0, 0, 0), body_r, az, el)
            ax, ay = perp_frame(n)
            b.part('ember%d' % k, ellipsoid(c, ax * 0.035, ay * 0.05, n * 0.02, 10, 6), 'glow', subsurf=1)
    for k, (x, y, z, r) in enumerate(drops):
        anchor = V(x * 0.6, y * 0.6, 0.0)
        b.part('drip%d' % k, sphere((x, y, z), r, 12, 8), 'glow')
        b.part('stem%d' % k, tube([anchor, V(x * 0.8, y * 0.8, z * 0.5), V(x, y, z)], 0.028, 0.012, seg=8), 'glow')
    # grumpy face: angry brows, small pupils, a frown
    for side_name, az in (('r', -0.45), ('l', -1.25)):
        c, n = on_ellipsoid((0, 0, 0), body_r, az, 0.28)
        b.eye(side_name, c - n * 0.012, n, 0.07, shut=pose == 'ko', pupil=0.48, white='eye_white')
        inner = 1 if az > -0.85 else -1          # toward the middle of the face
        path = []
        for k in range(5):
            s = k / 4
            a = az + inner * (-0.28 + 0.56 * s)
            el = 0.50 + 0.16 * s
            c2, n2 = on_ellipsoid((0, 0, 0), body_r, a, el)
            path.append(c2 + n2 * 0.015)
        b.part('brow_' + side_name, tube(path, 0.022, seg=8), 'crust')
    path = []
    for k in range(11):
        s = k / 10
        az = lerp(-0.3, -1.4, s)
        el = -0.30 + 0.14 * math.sin(math.pi * s) * (1 if pose != 'ko' else 0)
        c, n = on_ellipsoid((0, 0, 0), body_r, az, el)
        path.append(c + n * 0.012)
    b.part('mouth', tube(path, 0.022, seg=8), 'crust')


LAVA = {
    'up':   dict(M=lambda: scl(0.84, 0.84, 1.12)),
    'down': dict(M=lambda: scl(1.15, 1.15, 0.88)),
    'ko':   dict(M=lambda: scl(1.15, 1.15, 0.72)),
}


# ================================================================= lime (coin)
def build_lime(b, pose, t, P):
    R, T = 0.30, 0.09
    b.part('rind', lathe_y([(0.78 * R, -0.46 * T), (0.95 * R, -0.5 * T), (R, -0.3 * T), (R, 0.3 * T), (0.95 * R, 0.5 * T), (0.78 * R, 0.46 * T)], seg=48, closed=True), 'rind', subsurf=0)
    b.part('pith_ring', lathe_y([(0.72 * R, -0.47 * T), (0.80 * R, -0.47 * T), (0.80 * R, 0.47 * T), (0.72 * R, 0.47 * T)], seg=48, closed=True), 'pith', subsurf=0)
    b.part('flesh', lathe_y([(0, 0.41 * T), (0.74 * R, 0.41 * T), (0.74 * R, -0.41 * T), (0, -0.41 * T)], seg=48), 'flesh', subsurf=0)
    b.part('hub', lathe_y([(0, 0.47 * T), (0.10 * R, 0.47 * T), (0.10 * R, -0.47 * T), (0, -0.47 * T)], seg=16), 'pith', subsurf=0)
    for k in range(6):
        th = math.radians(k * 60 + 30)
        r0, r1 = 0.08 * R, 0.75 * R
        mid = (r0 + r1) / 2
        M = tr(V(mid * math.cos(th), 0.0, mid * math.sin(th))) @ rot_y(-math.degrees(th)) @ scl(r1 - r0, 0.94 * T, 0.05)
        bm = box_bm((1.0, 1.0, 1.0))
        bm.transform(M)
        b.part('spoke%d' % k, bm, 'pith', subsurf=0, smooth=False)
    # a glint on the front face
    b.part('glint', ellipsoid(V(-0.38 * R, -0.50 * T, 0.48 * R), X * 0.055, Z * 0.035, Y * 0.015, 12, 6), 'highlight', subsurf=1)


LIME = {'spin': dict(M=lambda t: rot_z(360 * t))}


# ================================================================= alebrije (star)
def build_alebrije(b, pose, t, P):
    pts = [(0.26, 0.000, 1.0, 1.0), (0.22, 0.085, 1.0, 1.0), (0.10, 0.130, 1.0, 1.0), (-0.05, 0.135, 1.0, 1.0),
           (-0.20, 0.115, 1.0, 1.0), (-0.30, 0.060, 1.0, 1.0), (-0.34, 0.000, 1.0, 1.0)]
    sp = Spine([(x, 0.0, -0.02, r, kz, ky) for x, r, kz, ky in pts])
    b.part('body', sp.mesh(rings=20, seg=20), 'gold')
    hc = V(0.31, 0, 0.12)
    head_r = (0.12, 0.11, 0.11)
    b.part('head', blob(hc, *head_r, seg=18, rows=12), 'gold')
    b.part('snout', blob((0.42, 0, 0.07), 0.075, 0.07, 0.06, 14, 8), 'gold')
    b.part('nose', sphere((0.485, -0.01, 0.085), 0.03, 10, 6), 'teal', subsurf=1)
    for side_name, az in (('r', -0.45), ('l', -1.2)):
        c, n = on_ellipsoid(hc, head_r, az, 0.32)
        b.eye(side_name, c - n * 0.01, n, 0.05, pupil=0.5, lid=0.1, lid_mat='gold')
    # big ears
    for side_name, side in (('l', -1), ('r', 1)):
        base = V(0.28, 0.07 * side, 0.20)
        d = Vector((0.05, 0.55 * side, 1.0)).normalized()
        ax, ay = perp_frame(d)
        wide = ax.cross(d).normalized()
        b.part('ear_' + side_name, ellipsoid(base + d * 0.08, X * 0.055, wide * 0.032, d * 0.115, 12, 8), 'gold')
        inner_dir = (X * 0.6 - Y * 0.6).normalized()
        b.part('ear_in_' + side_name, ellipsoid(base + d * 0.085 + inner_dir * 0.025, X * 0.032, wide * 0.018, d * 0.075, 10, 6), 'pink')
    # feathered wings fluttering on the back
    flap = 52 + 16 * math.sin(TAU * t)
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(-0.04, 0.07 * side, 0.09), side, flap, 28)
        def wing(u, v, W=W):
            span = 0.42 * u
            le = 0.11 - 0.03 * u
            te = -0.13 - 0.05 * u + 0.045 * math.sin(4 * math.pi * u) ** 2 + 0.10 * u * u
            return W @ V(lerp(le, te, v), span, 0.0)
        b.part('wing_' + side_name, sheet(wing, 10, 4, lambda u, v: 0.013 - 0.007 * u), 'teal')
        for k, (u, v) in enumerate(((0.3, 0.45), (0.62, 0.45))):
            sc = wing(u, v)
            n = (wing(u + 0.02, v) - wing(u - 0.02, v)).cross(wing(u, v + 0.04) - wing(u, v - 0.04)).normalized()
            ax, ay = perp_frame(n)
            b.part('wingspot_%s%d' % (side_name, k), ellipsoid(sc, ax * 0.03, ay * 0.03, n * 0.02, 10, 6), 'pink', subsurf=1)
    # four little legs with paws
    for name, x, y in (('leg_fl', 0.13, -0.08), ('leg_fr', 0.13, 0.08), ('leg_bl', -0.17, -0.08), ('leg_br', -0.17, 0.08)):
        b.part(name, tube([V(x, y, -0.08), V(x, y, -0.19)], 0.038, 0.034, seg=10), 'gold')
        b.part(name + '_paw', blob((x + 0.01, y, -0.21), 0.045, 0.04, 0.03, 10, 6), 'gold')
    # a curling tail with a pink tuft
    centre = V(-0.33, 0, 0.14)
    path = []
    for k in range(13):
        s = k / 12
        ph = -math.pi / 2 + s * 1.75 * math.pi
        rr = 0.13 - 0.07 * s
        path.append(centre + V(rr * math.cos(ph), 0.0, rr * math.sin(ph)))
    b.part('tail', tube(path, 0.042, 0.016, seg=10), 'gold')
    b.part('tuft', sphere(path[-1], 0.035, 10, 6), 'pink', subsurf=1)
    # back spikes and painted swirl rings on the camera-side flank
    for k, x in enumerate((0.08, -0.02, -0.12, -0.22)):
        v = (0.26 - x) / 0.60
        c, n, s, r, kz, ky = sp.frame(v)
        top = c + n * (r * kz)
        b.part('spike%d' % k, cone(top - n * 0.02, top + n * 0.075 + X * 0.02, 0.03, seg=10), 'teal', subsurf=1)
    for k, (v, a) in enumerate(((0.30, -1.5), (0.48, -1.75), (0.66, -1.45))):
        c, n = sp.point(v, a), sp.normal(v, a)
        b.part('swirl%d' % k, torus_bm(c + n * 0.004, n, 0.036, 0.013, seg=16, sides=6), 'pink', subsurf=1)


ALEBRIJE = {'idle': dict(M=lambda t: tr(V(0, 0, 0.035 * math.sin(TAU * t))))}


# ================================================================= pinata block
def build_pinata_block(b, pose, t, P):
    W, D, H = 1.00, 0.90, 0.95
    if pose == 'used':
        b.part('box', box_bm((W, D, H * 0.96), bevel=0.04), 'card', subsurf=0)
        pts = [(-0.25, 0.37), (-0.06, 0.06), (-0.19, -0.06), (0.06, -0.26), (-0.09, 0.37)]
        poly = [V(x * W, -D / 2 - 0.006, z * H) for x, z in pts]
        b.part('tear', flat_poly(poly, -Y, 0.012), 'tear', subsurf=0, smooth=False)
        for k, (x, w) in enumerate(((-0.36, 0.08), (0.12, 0.07), (0.34, 0.06))):
            poly = [V(x - w, -D / 2 - 0.01, H / 2 - 0.02), V(x + w, -D / 2 - 0.01, H / 2 - 0.02), V(x + 0.01, -D / 2 - 0.01, H / 2 - 0.09 - 0.03 * k)]
            b.part('scrap%d' % k, flat_poly(poly, -Y, 0.012), 'scrap', subsurf=0, smooth=False)
        return
    b.part('box', box_bm((W, D, H), bevel=0.05), 'paper', subsurf=0)
    rows = ['fringe_yellow', 'fringe_teal', 'fringe_violet', 'fringe_pink']
    sides = [((0, -1, 0), (1, 0, 0), W, D), ((1, 0, 0), (0, 1, 0), D, W), ((0, 1, 0), (-1, 0, 0), W, D), ((-1, 0, 0), (0, -1, 0), D, W)]
    for si, (nrm, tng, extent, off) in enumerate(sides):
        nrm, tng = Vector(nrm), Vector(tng)
        for k, mat in enumerate(rows):
            ztop = H / 2 - 0.05 - k * 0.215
            n_teeth = int(round(extent / 0.11))
            step = extent / n_teeth
            bm = bmesh.new()
            top = [bm.verts.new(nrm * (off / 2 + 0.014) + tng * (-extent / 2 + i * step) + Z * ztop) for i in range(n_teeth + 1)]
            bot = [bm.verts.new(nrm * (off / 2 + 0.014) + tng * (-extent / 2 + i * step) + Z * (ztop - 0.05)) for i in range(n_teeth + 1)]
            tips = [bm.verts.new(nrm * (off / 2 + 0.014) + tng * (-extent / 2 + (i + 0.5) * step) + Z * (ztop - 0.05 - 0.15)) for i in range(n_teeth)]
            for i in range(n_teeth):
                bm.faces.new((top[i], top[i + 1], bot[i + 1], bot[i]))
                bm.faces.new((bot[i], bot[i + 1], tips[i]))
            bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.012)
            b.part('fringe_%d_%d' % (si, k), bm, mat, subsurf=0, smooth=False)
    # cones and streamers on top
    for k, x in enumerate((-0.25, 0.25)):
        b.part('cone%d' % k, cone((x, 0, H / 2 - 0.02), (x, 0, H / 2 + 0.22), 0.09, seg=12), 'cone')
        wave = 0.03 * math.sin(TAU * t + k)
        path = [V(x, 0, H / 2 + 0.21), V(x + 0.07, -0.03, H / 2 + 0.27 + wave), V(x + 0.14, -0.05, H / 2 + 0.23 - wave), V(x + 0.19, -0.06, H / 2 + 0.26)]
        b.part('streamer%d' % k, tube(path, 0.014, 0.010, seg=6), rows[(k * 2 + 1) % 4])
    # the little face on the camera side
    for side_name, x in (('l', -0.17), ('r', 0.17)):
        c = V(x, -D / 2 - 0.03, 0.10)
        b.eye(side_name, c, -Y, 0.08, pupil=0.5, look=Vector((0.15 if x < 0 else -0.15, -1.0, -0.1)), lid=0)
    path = [V(0.13 * math.cos(a), -D / 2 - 0.028, -0.10 + 0.13 * math.sin(a)) for a in (math.radians(-150 + 12 * k) for k in range(11))]
    b.part('mouth', tube(path, 0.02, seg=8), 'mouth')


PINATA_BLOCK = {
    'idle': dict(M=lambda t: rot_y(2.5 * math.sin(TAU * t)) @ scl(1 + 0.012 * math.sin(TAU * t), 1, 1 - 0.012 * math.sin(TAU * t))),
    'used': dict(M=lambda t: Matrix.Identity(4)),
}


# ================================================================= taco
def build_taco(b, pose, t, P):
    R = 0.33
    for side_name, side, rr in (('far', 1, R), ('near', -1, 0.92 * R)):
        S = tr(V(0, 0.012 * side, 0)) @ rot_x(-14 * side)
        def shell(u, v, S=S, rr=rr):
            a = math.pi * u
            return S @ V(rr * v * math.cos(a), 0.0, rr * v * math.sin(a))
        b.part('shell_' + side_name, sheet(shell, 14, 4, 0.022, v0=0.05), 'shell')
        rim = [S @ V(rr * 1.0 * math.cos(math.pi * k / 14), -0.01 * side, rr * math.sin(math.pi * k / 14)) for k in range(15)]
        b.part('rim_' + side_name, tube(rim, 0.012, seg=6), 'rim', subsurf=1)
    # fillings along the top: meat, lettuce, tomato
    meat = [V(0.72 * R * math.cos(a), 0.0, 0.72 * R * math.sin(a)) for a in (math.radians(12 + 13 * k) for k in range(13))]
    b.part('meat', tube(meat, 0.055, seg=8), 'meat')
    for k, a in enumerate((22, 52, 82, 112, 142, 166)):
        a = math.radians(a)
        y = -0.025 if k % 2 == 0 else 0.03
        b.part('lettuce%d' % k, blob((0.86 * R * math.cos(a), y, 0.86 * R * math.sin(a)), 0.07, 0.05, 0.062, 12, 8), 'lettuce')
    for k, a in enumerate((68, 125)):
        a = math.radians(a)
        b.part('tomato%d' % k, sphere((0.95 * R * math.cos(a), -0.04, 0.95 * R * math.sin(a)), 0.046, 12, 8), 'tomato')


TACO = {'fly': dict(M=lambda t: rot_y(360 * t) @ tr(V(0, 0, -0.13)) @ rot_x(22))}


# ---------------------------------------------------------------- public API
BUILDERS = {
    'axolotl': (build_axolotl, AXOLOTL), 'heron': (build_heron, HERON), 'fish': (build_fish, FISH),
    'bat': (build_bat, BAT), 'lava': (build_lava, LAVA), 'lime': (build_lime, LIME),
    'alebrije': (build_alebrije, ALEBRIJE), 'pinata_block': (build_pinata_block, PINATA_BLOCK), 'taco': (build_taco, TACO),
}


def build(kind, pose, t=0.0):
    """Build one kind in the given pose (fresh geometry every call) and return its root Empty."""
    if kind not in BUILDERS:
        raise ValueError('unknown kind %r; one of %s' % (kind, KINDS))
    fn, table = BUILDERS[kind]
    if pose not in table:
        raise ValueError('unknown pose %r for %s; one of %s' % (pose, kind, POSES[kind]))
    P = dict(table[pose])
    mk = P.get('M')
    try:
        M = mk(t)
    except TypeError:
        M = mk()
    b = Builder(kind, pose, M)
    fn(b, pose, t, P)
    return b.root


def triangle_count(root, evaluated=False):
    total = 0
    dg = bpy.context.evaluated_depsgraph_get() if evaluated else None
    for ob in root.children_recursive:
        if ob.type != 'MESH':
            continue
        me = ob.evaluated_get(dg).data if evaluated else ob.data
        total += sum(len(p.vertices) - 2 for p in me.polygons)
    return total


# ---------------------------------------------------------------- preview rendering
def setup_preview_scene():
    scene = bpy.context.scene
    for ob in list(bpy.data.objects):
        if ob.get('sprite_part') is None:
            bpy.data.objects.remove(ob, do_unlink=True)
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except TypeError as e:
        print('engine fallback:', e)
        scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    if hasattr(scene, 'eevee'):
        scene.eevee.taa_render_samples = 32

    cam_data = bpy.data.cameras.new('sprite_cam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.6
    cam = bpy.data.objects.new('sprite_cam', cam_data)
    cam.location = (0.0, -4.0, 0.0)
    cam.rotation_euler = (math.pi / 2, 0.0, 0.0)      # looking along +Y
    _link(cam)
    scene.camera = cam

    sun_data = bpy.data.lights.new('sprite_sun', 'SUN')
    sun_data.energy = 3.0
    sun_data.angle = math.radians(12)
    sun = bpy.data.objects.new('sprite_sun', sun_data)
    sun.rotation_euler = (math.radians(55), 0.0, math.radians(35))   # from the upper front, camera side
    _link(sun)

    world = scene.world or bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
    if bg is not None:
        bg.inputs[0].default_value = (0.55, 0.62, 0.72, 1.0)
        bg.inputs[1].default_value = 0.55
    return scene


def render_pose(kind, pose, t=0.0, suffix=''):
    root = build(kind, pose, t)
    path = os.path.join(SCRATCH, '%s_%s%s.png' % (kind, pose, suffix))
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return root, path


def thumbnail(path, size=48):
    img = bpy.data.images.load(path)
    img.scale(size, size)
    out = path.replace('.png', '_%d.png' % size)
    img.filepath_raw = out
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)
    return out


def contact_sheet(paths, out, cell=256):
    import numpy as np
    n = len(paths)
    sheet = np.zeros((cell, cell * n, 4), dtype=np.float32)
    for i, p in enumerate(paths):
        img = bpy.data.images.load(p)
        img.scale(cell, cell)
        px = np.array(img.pixels[:], dtype=np.float32).reshape(cell, cell, 4)
        sheet[:, i * cell:(i + 1) * cell, :] = px
        bpy.data.images.remove(img)
    alpha = sheet[..., 3:4]
    sheet[..., :3] = sheet[..., :3] + (1 - alpha) * 0.35      # mid-grey backdrop so the transparent film reads
    sheet[..., 3] = 1.0
    res = bpy.data.images.new('sheet', cell * n, cell, alpha=True)
    res.pixels[:] = sheet.ravel().tolist()
    res.filepath_raw = out
    res.file_format = 'PNG'
    res.save()
    bpy.data.images.remove(res)
    return out


def extent(root):
    xs, zs = [], []
    for ob in root.children_recursive:
        if ob.type == 'MESH':
            for co in ob.bound_box:
                p = ob.matrix_world @ Vector(co)
                xs.append(p.x)
                zs.append(p.z)
    return max(xs) - min(xs), max(zs) - min(zs)


if __name__ == '__main__':
    os.makedirs(SCRATCH, exist_ok=True)
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    kinds = [k for k in args if k in KINDS] or KINDS
    setup_preview_scene()
    for kind in kinds:
        outs = []
        for pose in POSES[kind]:
            ts = [(0.0, '')]
            if (kind, pose) in CYCLES:
                ts.append((0.5, '_t50'))
            if kind == 'lime':
                ts = [(0.0, ''), (0.125, '_t12'), (0.25, '_t25'), (0.375, '_t37')]
            for t, suffix in ts:
                root, path = render_pose(kind, pose, t, suffix)
                w, h = extent(root)
                print('%-12s %-6s t=%.3f %s  base tris %d  subdivided %d  w %.2f m (%.0f px)  h %.2f m (%.0f px)'
                      % (kind, pose, t, path, triangle_count(root), triangle_count(root, evaluated=True), w, w * PX, h, h * PX))
                outs.append(path)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
        clear(kind)
