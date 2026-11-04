# mz_enemies: the Mozambique cast of Super Brady-O World (world 4) for the pre-rendered Fiesta Toon sprite pipeline.
# All original cartoon designs.  Same conventions as mx_pepper.py / mx_enemies_a.py / mx_enemies_b.py:
#   Z up, every character FACES +X (screen-right), the sprite camera looks along +Y from -Y.  1 m = 28.1 px.
#   Feet-origin kinds stand with their feet on z = 0; centre-origin kinds (the flyer and the items) are centred on
#   the origin.  Plain Principled materials (Base Color only, roughness 0.5) named <kind>_<part>; materials whose
#   name contains 'glow' render unlit in the toon look.  Every object is parented to one Empty named after the kind
#   and carries obj['sprite_part'].  Subdivision modifiers on the smooth parts.
#
#   warthog    a chunky savanna warthog: bristle crest, cream tusks, warty cheeks, tail straight up when charging
#              walk(t) notice charge stun flat ko                                                   feet, 24 px
#   cashew     a cashew apple (orange-red) with its tan kidney nut hanging under its chin, hopping on green feet
#              walk(t) hop stun flat ko                                                             feet, 26 px
#   weaver     a chubby yellow weaver bird with a black face mask, carrying a grass strand for its nest
#              fly(t) swoop stun ko                                                                 centre, 14 px
#   prawn      a coral piri-piri prawn scuttling on eight legs, stalk eyes, long antennae, tail fan
#              walk(t) stun flat ko                                                                 feet, 20 px
#   monkey     a grey vervet-style monkey with a black face, white brow and a curling tail, lobbing baobab pods
#              walk(t) idle(t) throw(t) stun flat ko                                                feet, 36 px
#   ghostCrab  a pale sand-coloured ghost crab with periscope eyes and one big claw, running sideways
#              walk(t) stun flat ko                                                                 feet, 14 px
#   mango      a ripe red-blushed mango with a leaf, that tucks its feet and rolls
#              walk(t) curl roll(t) stun flat ko                                                    feet, 20 px
#   coin       the CASHEW NUT: a tan kidney-shaped nut                       spin(t: about Z)        centre, 16 px
#   star       the GOLDEN BAOBAB: a bottle-trunked golden tree with sparkles idle(t: hover)          centre, 24 px
#   qblock     the item block: a capulana cloth bundle (orange cloth, bold print circles, blue band, knot on top)
#              idle(t: wobble)                                                                      centre, 32 px
#   used       the same bundle spent: faded cloth, knot undone                 idle                 centre, 32 px
#
# API:  build(kind, pose, t=0.0) -> root Empty named kind (fresh geometry; any previous build of that kind removed)
#       clear(kind=None) -> removes one kind's hierarchy, or every kind's
#       KINDS, POSES[kind], CYCLES, HEIGHT[kind] (feet kinds), SIZE[kind] (every kind: the renderer frames by it),
#       ORIGIN[kind]
# Headless preview of everything (previews + contact sheets at 256 and 48 px into SCRATCH):
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mz_enemies.py [-- kind ...]
#   LOOK=toon in the environment restyles the previews with lookkit's toon look (outlines) before rendering.
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
PX = 28.1
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mzen'

KINDS = ['warthog', 'cashew', 'weaver', 'prawn', 'monkey', 'ghostCrab', 'mango', 'coin', 'star', 'qblock', 'used']
POSES = {
    'warthog': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'cashew': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'weaver': ['fly', 'swoop', 'stun', 'ko'],
    'prawn': ['walk', 'stun', 'flat', 'ko'],
    'monkey': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'ghostCrab': ['walk', 'stun', 'flat', 'ko'],
    'mango': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
# (kind, pose) pairs whose t is a 0..1 cycle phase
CYCLES = {('warthog', 'walk'), ('cashew', 'walk'), ('weaver', 'fly'), ('prawn', 'walk'), ('monkey', 'walk'),
          ('monkey', 'idle'), ('monkey', 'throw'), ('ghostCrab', 'walk'), ('mango', 'walk'), ('mango', 'roll'),
          ('coin', 'spin'), ('star', 'idle'), ('qblock', 'idle')}
ORIGIN = {'warthog': 'feet', 'cashew': 'feet', 'weaver': 'centre', 'prawn': 'feet', 'monkey': 'feet',
          'ghostCrab': 'feet', 'mango': 'feet', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'}
# nominal standing height of the feet-origin kinds (hitbox height / 28.1)
HEIGHT = {'warthog': 24 / PX, 'cashew': 26 / PX, 'prawn': 20 / PX, 'monkey': 36 / PX, 'ghostCrab': 14 / PX, 'mango': 20 / PX}
# nominal size of the centre-origin kinds; render_country.py frames EVERY kind by SIZE when it exists, so it also
# repeats the feet heights
SIZE = dict(HEIGHT)
SIZE.update({'weaver': 14 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX})

COLORS = {
    'warthog_hide': '#8a6a58', 'warthog_wart': '#6e5244', 'warthog_snout': '#b89080', 'warthog_mane': '#3a2a20',
    'warthog_tusk': '#f4ecd8', 'warthog_hoof': '#3a2a20', 'warthog_ear_inner': '#d8a090', 'warthog_dark': '#2a1a14',
    'warthog_eye_white': '#fbfbf2', 'warthog_pupil': '#1a1020', 'warthog_mouth': '#3a1a1a',
    'cashew_apple': '#ff6a2a', 'cashew_blush': '#ffb020', 'cashew_highlight': '#ffd8a0', 'cashew_nut': '#c8a070',
    'cashew_nut_dark': '#a88050', 'cashew_leaf': '#3a8a3a', 'cashew_feet': '#2a6a2a',
    'cashew_eye_white': '#fbfbf2', 'cashew_pupil': '#1a1020', 'cashew_mouth': '#5a1a10',
    'weaver_body': '#ffd23a', 'weaver_wing': '#e8b81a', 'weaver_tip': '#5a4a20', 'weaver_mask': '#1a1020',
    'weaver_beak': '#3a2a20', 'weaver_feet': '#e87a2a', 'weaver_grass': '#a8c84a',
    'weaver_eye_white': '#ffffff', 'weaver_pupil': '#1a1020',
    'prawn_shell': '#ff7a5a', 'prawn_shell2': '#ff6040', 'prawn_antenna': '#e8422a', 'prawn_leg': '#e8422a',
    'prawn_fan': '#e8422a', 'prawn_eye_white': '#fbfbf2', 'prawn_pupil': '#1a1020', 'prawn_mouth': '#8a2a2a',
    'monkey_fur': '#9a9a8a', 'monkey_belly': '#d8d8c8', 'monkey_face': '#2a2a2a', 'monkey_brow': '#f0f0e8',
    'monkey_muzzle': '#7a7a74', 'monkey_hand': '#3a3a3a', 'monkey_ear': '#d8a0a0', 'monkey_fruit': '#c8b898',
    'monkey_fruit_stem': '#6a5a3a', 'monkey_eye_white': '#fbfbf2', 'monkey_pupil': '#1a1020', 'monkey_mouth': '#1a1010',
    'ghostCrab_shell': '#ece4cc', 'ghostCrab_shell2': '#d8cca8', 'ghostCrab_leg': '#e0d6b8', 'ghostCrab_claw': '#f2ecd8',
    'ghostCrab_eye_white': '#fbfbf2', 'ghostCrab_pupil': '#1a1020', 'ghostCrab_mouth': '#8a6a5a', 'ghostCrab_dark': '#4a3a30',
    'mango_skin': '#ffa82a', 'mango_blush': '#ff3a3a', 'mango_belly': '#ffe04a', 'mango_stem': '#6a8a3a', 'mango_leaf': '#3a8a3a',
    'mango_feet': '#c8702a', 'mango_eye_white': '#fbfbf2', 'mango_pupil': '#1a1020', 'mango_mouth': '#5a1a10',
    'coin_shell': '#e8c890', 'coin_shell_dark': '#c8a060', 'coin_highlight': '#fff8e8',
    'star_gold': '#ffd24a', 'star_gold_dark': '#e8a820', 'star_leaf': '#ffe88a', 'star_glow': '#fff6c0',
    'qblock_cloth': '#ff7a1a', 'qblock_print_teal': '#1aa8a8', 'qblock_print_yellow': '#ffd23a', 'qblock_print_magenta': '#c8287a',
    'qblock_band': '#2a5ad8', 'qblock_knot': '#f8f4e8', 'qblock_dot': '#ff7a1a',
    'used_cloth': '#9a8070', 'used_print': '#8a7262', 'used_band': '#6a6a70', 'used_knot': '#c8c0b0', 'used_dot': '#9a8070',
}


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


def catmull(pts, t):
    """Catmull-Rom through equal-length tuples; t in 0..1 (ends clamped)."""
    n = len(pts)
    f = min(1.0, max(0.0, t)) * (n - 1)
    k = min(n - 2, int(math.floor(f)))
    u = f - k
    p0, p1, p2, p3 = pts[max(0, k - 1)], pts[k], pts[k + 1], pts[min(n - 1, k + 2)]
    return [0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u ** 3)
            for a, b, c, d in zip(p0, p1, p2, p3)]


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


def disc(c, normal, r, th, seg=24):
    """A flat round disc (a short cylinder) of radius r and thickness th, facing along normal."""
    normal = Vector(normal).normalized()
    ax, ay = perp_frame(normal)
    rings = [Vector(c) + normal * th]
    rings.append([Vector(c) + normal * th + r * (math.cos(a) * ax + math.sin(a) * ay) for a in (TAU * j / seg for j in range(seg))])
    rings.append([Vector(c) - normal * th + r * (math.cos(a) * ax + math.sin(a) * ay) for a in (TAU * j / seg for j in range(seg))])
    rings.append(Vector(c) - normal * th)
    return ring_mesh(rings)


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


def on_ellipsoid(c, radii, az, el):
    """Point and outward normal on an axis-aligned ellipsoid; az from +X toward -Y (negative = camera side)."""
    rx, ry, rz = radii
    d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    p = Vector((rx * d.x, ry * d.y, rz * d.z))
    n = Vector((p.x / rx ** 2, p.y / ry ** 2, p.z / rz ** 2)).normalized()
    return Vector(c) + p, n


# ---------------------------------------------------------------- scene objects
def clear(kind=None):
    """Remove the hierarchy of one kind (or of every kind) and its mesh data."""
    for k in ([kind] if kind else KINDS):
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


def quad_legs(kind, root, M, P, t, hips, foot_z, leg_r, foot_r, mat, A=0.1, H=0.06, foot_mat=None):
    """Four tube legs from the (posed) hips to feet on the ground.  P['feet']: walk, stand, flat, charge, limp."""
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


# ================================================================ WARTHOG
WARTHOG_POSE = {
    'walk':   dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='walk',   tail='sway',  ears='up',    pitch=0),
    'notice': dict(sx=0.96, sz=1.06, lean=-10, lid=0.00, eye=1.2, pupil=0.65, mouth='o', feet='stand', tail='up', ears='alert', pitch=-18),
    'charge': dict(sx=1.15, sz=0.90, lean=8,   lid=0.30, mouth='open',   feet='charge', tail='up',    ears='flat',  pitch=16, angry=True),
    'stun':   dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand',  tail='droop', ears='droop', pitch=-6, dazed=True),
    'flat':   dict(sx=1.20, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat',   tail='flat',  ears='flat',  pitch=0),
    'ko':     dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',   tail='droop', ears='droop', pitch=-10, x=True),
}
WARTHOG_BODY = (Vector((-0.1, 0, 0.47)), 0.42, 0.21, 0.23, 0.55)
WARTHOG_EARS = {'up': V(-0.05, 0.07, 0.2), 'alert': V(0.02, 0.04, 0.23), 'flat': V(-0.22, 0.05, 0.05), 'droop': V(-0.08, 0.14, 0.07)}


def warthog_top(x):
    c, hx, hy, hz, e = WARTHOG_BODY
    u = min(1.0, abs((x - c.x) / hx))
    return c.z + hz * max(0.0, 1 - u ** (2 / e)) ** (e / 2)


def build_warthog(root, pose, t):
    P = dict(WARTHOG_POSE[pose])
    P.update(er=0.088, skin='warthog_hide')
    sx, sz, lean, bob, nod = P['sx'], P['sz'], P['lean'], 0.0, 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
        nod = 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    c, hx, hy, hz, e = WARTHOG_BODY
    make_part('body', superellipsoid(c, hx, hy, hz, e, seg=28, rows=14), 'warthog_hide', root, M)
    # the bristle crest down the neck and back
    bristles = []
    for k in range(9):
        x = 0.3 - 0.085 * k
        zt = warthog_top(x) - 0.02
        bristles.append(prism([V(x - 0.045, 0, zt), V(x + 0.045, 0, zt), V(x - 0.07, 0, zt + 0.14 - 0.01 * abs(k - 3))], Y * 0.05))
    make_part('crest', join(bristles), 'warthog_mane', root, M, subsurf=0, smooth=False)
    # head (pitches with the pose and nods with the walk)
    MH = M @ about((0.28, 0, 0.55), rot_y(P['pitch'] + nod))
    hc, hr = Vector((0.42, 0, 0.5)), (0.27, 0.2, 0.22)
    make_part('head', blob(hc, *hr, seg=24, rows=14), 'warthog_hide', root, MH)
    make_part('snout', ellipsoid(V(0.65, 0, 0.44), X * 0.07, Y * 0.115, Z * 0.095, seg=16, rows=10), 'warthog_snout', root, MH)
    for side, y in (('l', -0.045), ('r', 0.045)):
        make_part('nostril_' + side, sphere((0.715, y, 0.45), 0.022, seg=10, rows=6), 'warthog_dark', root, MH)
    make_part('wart_a', sphere((0.5, -0.19, 0.5), 0.038, seg=12, rows=8), 'warthog_wart', root, MH)
    make_part('wart_b', sphere((0.44, -0.2, 0.4), 0.03, seg=12, rows=8), 'warthog_wart', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        path = [V(0.59, sgn * 0.1, 0.38), V(0.68, sgn * 0.15, 0.34), V(0.76, sgn * 0.165, 0.42), V(0.78, sgn * 0.155, 0.55)]
        make_part('tusk_' + side, tube(path, 0.046, 0.016, seg=10), 'warthog_tusk', root, MH)
        base = V(0.33, sgn * 0.13, 0.66)
        off = WARTHOG_EARS[P['ears']].copy()
        off.y *= sgn
        make_part('ear_' + side, cone(base, base + off, 0.07, flat=0.5), 'warthog_hide', root, MH)
        if side == 'l':
            make_part('ear_inner_' + side, cone(base + V(0, -0.02, 0.02), base.lerp(base + off, 0.78) + V(0, -0.02, 0), 0.042, flat=0.5),
                      'warthog_ear_inner', root, MH)
    surf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -0.42), ('l', -1.2)):
        p, n = surf(0.6, az)
        eye_one('warthog', side, p - n * 0.02, n, root, MH, P)
        if P.get('angry'):
            brow('warthog', side, p - n * 0.015, n, root, MH, P['er'])
    mp = [(0.57, -0.135, 0.355), (0.62, -0.125, 0.345), (0.67, -0.095, 0.35), (0.70, -0.05, 0.36)]
    if P['mouth'] in ('o', 'open'):
        k = 1.0 if P['mouth'] == 'o' else 1.6
        make_part('mouth', ellipsoid(V(0.655, -0.095, 0.345), X * 0.035 * k, Y * 0.03, Z * 0.035 * k, seg=12, rows=8), 'warthog_mouth', root, MH)
    else:
        make_part('mouth', line_mouth(mp, P['mouth'], r=0.012), 'warthog_mouth', root, MH)
    # tail: straight up like a flag when running, with a dark tuft
    tb = V(-0.5, 0, 0.58)
    mode = P['tail']
    if mode == 'up':
        path = [tb, V(-0.53, 0, 0.78), V(-0.55, 0, 0.98)]
    elif mode == 'sway':
        w = 0.06 * math.sin(TAU * t)
        path = [tb, V(-0.56 + w, 0, 0.74), V(-0.6 + 2 * w, 0, 0.9)]
    elif mode == 'flat':
        path = [tb, V(-0.68, 0, 0.5), V(-0.86, 0, 0.44)]
    else:
        path = [tb, V(-0.56, 0, 0.5), V(-0.6, 0, 0.36)]
    make_part('tail', tube(path, 0.028, 0.02, seg=8), 'warthog_hide', root, M)
    make_part('tuft', ellipsoid(path[-1], X * 0.045, Y * 0.04, Z * 0.06, seg=10, rows=6), 'warthog_mane', root, M)
    hips = {'fl': Vector((0.2, -0.13, 0.33)), 'fr': Vector((0.2, 0.13, 0.33)),
            'bl': Vector((-0.3, -0.13, 0.33)), 'br': Vector((-0.3, 0.13, 0.33))}
    quad_legs('warthog', root, M, P, t, hips, 0.045, 0.05, (0.075, 0.055, 0.045), 'warthog_hide', A=0.1, H=0.06, foot_mat='warthog_hoof')


# ================================================================ CASHEW
CASHEW_PROFILE = [(0, 0.88), (0.09, 0.87), (0.18, 0.80), (0.24, 0.68), (0.275, 0.52), (0.265, 0.38), (0.21, 0.27), (0.11, 0.21), (0, 0.2)]
CASHEW_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=3,   lid=0.15, mouth='grin',   feet='walk',  swing=0.0),
    'hop':  dict(sx=0.90, sz=1.14, lean=10,  lid=0.10, mouth='grin',   feet='tuck',  swing=-0.08),
    'stun': dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', swing=0.0, dazed=True),
    'flat': dict(sx=1.30, sz=0.35, lean=0,   lid=1.00, mouth='flat',   feet='flat',  swing=0.0),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',  swing=0.04, x=True),
}


def build_cashew(root, pose, t):
    P = dict(CASHEW_POSE[pose])
    P.update(er=0.09, skin='cashew_apple')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.025 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    surf = lathe_surf(CASHEW_PROFILE)
    make_part('apple', lathe(CASHEW_PROFILE, seg=28), 'cashew_apple', root, M)
    # a yellow blush on the upper back and a highlight on the camera side
    make_part('blush', oval_patch(surf, 0.66, 0.17, math.radians(175), math.radians(70), thick=0.012), 'cashew_blush', root, M)
    p, n = surf(0.7, -2.2)
    up = (Z - n * n.z).normalized()
    s = up.cross(n)
    make_part('highlight', ellipsoid(p - n * 0.018, s * 0.045, up * 0.07, n * 0.028, seg=12, rows=6), 'cashew_highlight', root, M)
    # the kidney nut hanging under the chin
    sw = P['swing']
    nut = [V(0.0, 0, 0.25), V(0.11 + sw, 0, 0.14), V(0.23 + 2 * sw, 0, 0.09), V(0.32 + 2 * sw, 0, 0.13), V(0.35 + 2 * sw, 0, 0.23)]
    make_part('nut', tube(nut, 0.07, 0.045, seg=12, radii=[0.065, 0.075, 0.072, 0.06, 0.045]), 'cashew_nut', root, M)
    crease = [V(0.1 + sw, -0.03, 0.2), V(0.2 + 2 * sw, -0.045, 0.15), V(0.29 + 2 * sw, -0.04, 0.17)]
    make_part('nut_crease', tube(crease, 0.01, seg=6), 'cashew_nut_dark', root, M, subsurf=1)
    # stem and leaf
    make_part('stem', tube([V(0, 0, 0.86), V(-0.02, 0, 0.95)], 0.03, 0.024, seg=10), 'cashew_leaf', root, M)
    leaf = prism([V(-0.02, 0, 0.93), V(-0.1, 0, 0.99), V(-0.2, 0, 0.98), V(-0.17, 0, 0.92), V(-0.08, 0, 0.9)], Y * 0.03)
    make_part('leaf', leaf, 'cashew_leaf', root, M, subsurf=1)
    for side, az in (('r', -0.3), ('l', -1.25)):
        p, n = surf(0.62, az)
        eye_one('cashew', side, p - n * 0.012, n, root, M, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.45, math.radians(10), math.radians(-105), scale=1.1), 'cashew_mouth', root, M)
    biped_legs('cashew', root, M, P, t, (-0.1, 0.1, 0.25), (0.1, 0.06, 0.045), 0.035, 'cashew_feet')


# ================================================================ WEAVER (flyer, centre origin)
WEAVER_POSE = {
    'fly':   dict(flap=lambda t: 18 + 48 * math.cos(TAU * t), sweep=34, M=lambda: Matrix.Identity(4), ns=1, lid=0.08, pupil=1.0),
    'swoop': dict(flap=lambda t: 58, sweep=68, M=lambda: rot_y(28), ns=1, lid=0.0, pupil=0.8, eye=1.1),
    'stun':  dict(flap=lambda t: -70, sweep=8, M=lambda: rot_y(-10), ns=1, lid=0.5, pupil=0.9, dazed=True),
    'ko':    dict(flap=lambda t: -78, sweep=15, M=lambda: rot_x(180) @ rot_y(-15), ns=-1, lid=0.0, x=True),
}


def wing_frame(origin, side, flap_deg, sweep_deg):
    """World matrix for a wing whose local +Y is the span (mirrored for the camera-side wing, side = -1)."""
    return T(origin) @ rot_z(side * sweep_deg) @ rot_x(side * flap_deg) @ diag(1.0, side, 1.0)


def build_weaver(root, pose, t):
    P = dict(WEAVER_POSE[pose])
    P.update(er=0.054, skin='weaver_mask')
    ns = P['ns']
    M = P['M']()
    body_r = (0.2, 0.15, 0.16)
    make_part('body', blob((0, 0, 0), *body_r, seg=22, rows=12), 'weaver_body', root, M)
    hc, hr = V(0.15, 0, 0.1), 0.135
    make_part('head', sphere(hc, hr, seg=22, rows=14), 'weaver_body', root, M)
    d = Vector((0.85, 0, -0.3)).normalized()
    make_part('mask', cap(hc, d, hr, 66, seg=22, rows=7), 'weaver_mask', root, M)
    bd = (X * 0.98 - Z * 0.2).normalized()
    make_part('beak', cone(hc + bd * 0.1, hc + bd * 0.26, 0.04, flat=0.8), 'weaver_beak', root, M)
    # the grass strand carried for the nest
    tip = hc + bd * 0.24
    grass = [tip + V(0, -0.02 * ns, 0), tip + V(0.07, -0.05 * ns, -0.05), tip + V(0.06, -0.07 * ns, -0.16), tip + V(0.0, -0.08 * ns, -0.22)]
    make_part('grass', tube(grass, 0.014, 0.01, seg=6), 'weaver_grass', root, M)
    for side, az in (('r', -0.45), ('l', -1.1)):
        n = Vector((math.cos(0.28) * math.cos(az), math.cos(0.28) * math.sin(az) * ns, math.sin(0.28)))
        c = hc + n * hr
        eye_one('weaver', side, c - n * 0.012, n, root, M, P, look=Vector((0.5, -0.85 * ns, -0.1)))
    # wings: yellow with dark fingered tips
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(-0.02, 0.12 * side, 0.06), side, flap, sweep)

        def wing(u, v, W=W):
            span = 0.46 * u
            le = 0.12 - 0.12 * u * u
            chord = 0.28 * (1 - u ** 1.4) + 0.02 + 0.04 * math.sin(4 * math.pi * u) ** 2 * u
            return W @ V(le - chord * v, span, -0.02 * u * u)
        make_part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.02 - 0.01 * u, u1=0.62), 'weaver_wing', root, M)
        make_part('wingtip_' + side_name, sheet(wing, 8, 4, lambda u, v: 0.012 - 0.006 * u, u0=0.6), 'weaver_tip', root, M)

    def tail(u, v):
        return V(-0.18 - 0.16 * u, (v * 2 - 1) * (0.03 + 0.05 * u), -0.01 + 0.02 * u)
    make_part('tail', sheet(tail, 4, 4, 0.01), 'weaver_tip', root, M)
    for side_name, side in (('l', -1), ('r', 1)):
        f0 = V(0.04, 0.06 * side, -0.14)
        make_part('foot_' + side_name, tube([f0, f0 + V(0.05, 0, -0.04)], 0.016, 0.012, seg=6), 'weaver_feet', root, M)


# ================================================================ PRAWN
PRAWN_SEGS = [((0.14, 0.40), (0.13, 0.11, 0.13), -5), ((0.0, 0.45), (0.12, 0.1, 0.12), 12), ((-0.14, 0.42), (0.11, 0.095, 0.11), 32),
              ((-0.26, 0.34), (0.095, 0.085, 0.095), 52), ((-0.35, 0.23), (0.08, 0.07, 0.08), 68)]
PRAWN_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='walk', droop=0.0),
    'stun': dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', droop=0.5, dazed=True),
    'flat': dict(sx=1.20, sz=0.40, lean=0,   lid=1.00, mouth='flat',   feet='flat', droop=1.0),
    'ko':   dict(sx=1.00, sz=0.95, lean=-14, lid=0.00, mouth='o',      feet='limp', droop=1.0, x=True),
}


def build_prawn(root, pose, t):
    P = dict(PRAWN_POSE[pose])
    P.update(er=0.068, skin='prawn_shell')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.01 * (1 + math.sin(4 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    cc, cr = V(0.3, 0, 0.37), (0.21, 0.14, 0.17)
    make_part('carapace', blob(cc, *cr, seg=24, rows=14), 'prawn_shell', root, M)
    make_part('rostrum', cone(V(0.46, 0, 0.44), V(0.63, 0, 0.5), 0.035, flat=0.7), 'prawn_shell2', root, M)
    for k, ((x, z), r, tilt) in enumerate(PRAWN_SEGS):
        bm = xf(blob((0, 0, 0), *r, seg=18, rows=10), T((x, 0, z)) @ rot_y(tilt))
        make_part('seg%d' % k, bm, 'prawn_shell' if k % 2 == 0 else 'prawn_shell2', root, M)
    # tail fan: three fins spread from the last segment
    for k, ang in enumerate((-28, 0, 28)):
        fin = prism([V(-0.4, 0, 0.18), V(-0.57, 0, 0.1), V(-0.6, 0, 0.19), V(-0.55, 0, 0.27)], Y * 0.02)
        make_part('fan%d' % k, xf(fin, about(V(-0.4, 0, 0.18), rot_y(ang))), 'prawn_fan', root, M, subsurf=1)
    # stalk eyes (the far one a little higher so both show), a smile under them
    dr = P['droop']
    for side, y, z_off in (('l', -0.13, 0.0), ('r', 0.1, 0.12)):
        stalk = [V(0.42, y * 0.6, 0.46), V(0.47 + z_off * 0.3, y, 0.55 + z_off - 0.06 * dr)]
        make_part('stalk_' + side, tube(stalk, 0.026, 0.022, seg=8), 'prawn_shell2', root, M)
        n = Vector((0.3, -1.0, 0.15)).normalized()
        eye_one('prawn', side, V(0.48 + z_off * 0.3, y, 0.57 + z_off - 0.06 * dr), n, root, M, P)
    msurf = ellipsoid_surf(cc, *cr)
    make_part('mouth', mouth_bm(msurf, P['mouth'], 0.3, math.radians(-15), math.radians(-70), scale=0.8), 'prawn_mouth', root, M)
    # antennae sweeping up and back (drooping when stunned / out), short antennules forward
    a_near = [V(0.47, -0.06, 0.45), V(0.6, -0.1, 0.6 - 0.1 * dr), V(0.56, -0.12, 0.78 - 0.3 * dr), V(0.36, -0.14, 0.88 - 0.45 * dr), V(0.14, -0.14, 0.86 - 0.55 * dr)]
    a_far = [V(0.47, 0.06, 0.45), V(0.62, 0.1, 0.56 - 0.1 * dr), V(0.62, 0.12, 0.72 - 0.3 * dr), V(0.5, 0.14, 0.82 - 0.45 * dr)]
    make_part('antenna_l', tube(a_near, 0.016, 0.01, seg=6), 'prawn_antenna', root, M, subsurf=1)
    make_part('antenna_r', tube(a_far, 0.016, 0.01, seg=6), 'prawn_antenna', root, M, subsurf=1)
    for side, y in (('l', -0.04), ('r', 0.04)):
        make_part('antennule_' + side, tube([V(0.5, y, 0.4), V(0.64, y * 1.5, 0.35 - 0.06 * dr)], 0.012, 0.008, seg=6), 'prawn_antenna', root, M, subsurf=1)
    # eight scuttling legs
    stance = P['feet']
    for k in range(4):
        x = 0.3 - 0.14 * k
        for side, y, ph in (('l', -0.09, 0.0), ('r', 0.09, math.pi)):
            hip = M @ V(x, y * 0.8, 0.3 - 0.02 * k)
            dx = dz = 0.0
            if stance == 'walk':
                dx, dz = gait(t, ph + TAU * k / 4, 0.06, 0.04)
            elif stance == 'flat':
                dx = 0.1 * (1.5 - k)
            elif stance == 'limp':
                dx, dz = 0.04 * (1.5 - k), 0.03
            foot = V(x + dx, y * 1.3, 0.02 + dz)
            knee = (hip + foot) / 2 + V(0.03 + dz, y * 0.3, 0.0)
            make_part('leg_%s%d' % (side, k), tube([hip, knee, foot], 0.022, 0.016, seg=8), 'prawn_leg', root, None, subsurf=1)
            make_part('foot_%s%d' % (side, k), sphere(foot, 0.024, seg=8, rows=5), 'prawn_leg', root, None, subsurf=1)


# ================================================================ MONKEY
MONKEY_POSE = {
    'walk':  dict(sx=1.00, sz=1.00, lean=4,   lid=0.12, mouth='smile',  feet='walk',  arms='walk',  tail='sway'),
    'idle':  dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='stand', arms='hold',  tail='curl'),
    'throw': dict(sx=1.00, sz=1.00, lean=0,   lid=0.00, mouth='open',   feet='stand', arms='throw', tail='curl'),
    'stun':  dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', arms='hang',  tail='droop', dazed=True),
    'flat':  dict(sx=1.30, sz=0.35, lean=0,   lid=1.00, mouth='flat',   feet='flat',  arms='flat',  tail='flat'),
    'ko':    dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',  arms='hang',  tail='flat', x=True),
}


def monkey_fruit(c):
    """A baobab pod: a velvety grey-green oval with a stub stem (two bmeshes)."""
    c = Vector(c)
    pod = ellipsoid(c, X * 0.065, Y * 0.06, Z * 0.095, seg=14, rows=10)
    stem = tube([c + Z * 0.08, c + V(0.02, 0, 0.14)], 0.014, 0.01, seg=6)
    return pod, stem


def build_monkey(root, pose, t):
    P = dict(MONKEY_POSE[pose])
    P.update(er=0.09, skin='monkey_face')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.015 * (1 + math.sin(2 * TAU * t))
    elif pose == 'idle':
        sz *= 1 + 0.02 * math.sin(TAU * t)
    elif pose == 'throw':
        if t < 0.4:
            lean = -6 - 16 * smooth01(t / 0.4)
            P['eye'] = 1.1
        elif t < 0.6:
            lean = lerp(-22, 16, smooth01((t - 0.4) / 0.2))
        else:
            lean = lerp(16, 4, smooth01((t - 0.6) / 0.4))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    tc, tr_ = V(0, 0, 0.5), (0.27, 0.23, 0.26)
    make_part('torso', blob(tc, *tr_, seg=24, rows=14), 'monkey_fur', root, M)
    make_part('belly', ell_cap(tc, tr_, (1, 0, -0.15), 52, seg=20, rows=6), 'monkey_belly', root, M)
    hc, hr = V(0.06, 0, 0.95), 0.26
    make_part('head', sphere(hc, hr, seg=24, rows=14), 'monkey_fur', root, M)
    make_part('face', cap(hc, (1, 0, -0.12), hr, 60, seg=22, rows=7), 'monkey_face', root, M)
    # white brow band over the face and cheek fringes beside it
    path = []
    for k in range(9):
        az = -1.0 + 2.0 * k / 8
        n = Vector((math.cos(0.72) * math.cos(az), math.cos(0.72) * math.sin(az), math.sin(0.72)))
        path.append(hc + n * (hr + 0.01))
    make_part('brow', tube(path, 0.022, seg=8), 'monkey_brow', root, M)
    for side, sgn in (('l', -1), ('r', 1)):
        n = Vector((math.cos(-0.42) * math.cos(sgn * 1.2), math.cos(-0.42) * math.sin(sgn * 1.2), math.sin(-0.42)))
        p = hc + n * hr
        ax, ay = perp_frame(n)
        make_part('cheek_' + side, ellipsoid(p, ax * 0.05, ay * 0.075, n * 0.03, seg=12, rows=8), 'monkey_brow', root, M)
        ec = V(-0.03, sgn * 0.25, 1.03)
        make_part('ear_' + side, ellipsoid(ec, X * 0.085, Y * 0.03, Z * 0.085, seg=14, rows=8), 'monkey_fur', root, M)
        if side == 'l':
            make_part('ear_inner_' + side, ellipsoid(ec + V(0, -0.025, 0), X * 0.055, Y * 0.015, Z * 0.055, seg=12, rows=6), 'monkey_ear', root, M)
    for side, az in (('r', -0.3), ('l', -0.92)):
        n = Vector((math.cos(0.14) * math.cos(az), math.cos(0.14) * math.sin(az), math.sin(0.14)))
        eye_one('monkey', side, hc + n * (hr - 0.02), n, root, M, P)
    mc, mr = V(0.28, 0, 0.86), (0.08, 0.1, 0.062)
    make_part('muzzle', blob(mc, *mr, seg=16, rows=10), 'monkey_muzzle', root, M)
    msurf = ellipsoid_surf(mc, *mr)
    style = P['mouth']
    if style in ('o', 'open'):
        make_part('mouth', mouth_bm(msurf, style, 0.86, math.radians(-20), math.radians(-70), scale=0.8), 'monkey_mouth', root, M)
    else:
        make_part('mouth', mouth_bm(msurf, style, 0.845, math.radians(-10), math.radians(-95), scale=0.7), 'monkey_mouth', root, M)
    # arms: the camera-side one holds a pod up, winds back and flings it in the throw cycle
    arms = P['arms']
    fruit_at = None
    flying = None
    sh = {'l': V(0.04, -0.22, 0.68), 'r': V(0.04, 0.22, 0.68)}
    hands = {}
    if arms == 'hold':
        hands['l'] = (V(0.2, -0.21, 0.72), V(0.3, -0.17, 0.95))
        hands['r'] = (V(0.1, 0.21, 0.6), V(0.16, 0.19, 0.45))
        fruit_at = V(0.36, -0.15, 1.02)
    elif arms == 'throw':
        if t < 0.4:
            u = smooth01(t / 0.4)
            hand = V(0.3, -0.17, 0.95).lerp(V(-0.16, -0.2, 1.3), u)
            elbow = V(0.2, -0.21, 0.72).lerp(V(-0.1, -0.24, 1.0), u)
            fruit_at = hand + V(0.03, 0.02, 0.09)
        elif t < 0.6:
            u = smooth01((t - 0.4) / 0.2)
            hand = V(-0.16, -0.2, 1.3).lerp(V(0.42, -0.16, 1.05), u)
            elbow = V(-0.1, -0.24, 1.0).lerp(V(0.26, -0.21, 0.95), u)
        else:
            u = smooth01((t - 0.6) / 0.4)
            hand = V(0.42, -0.16, 1.05).lerp(V(0.3, -0.17, 0.95), u)
            elbow = V(0.26, -0.21, 0.95).lerp(V(0.2, -0.21, 0.72), u)
        hands['l'] = (elbow, hand)
        hands['r'] = (V(0.1, 0.21, 0.6), V(0.16, 0.19, 0.45))
        if t >= 0.45:
            fu = (t - 0.45) / 0.55
            flying = V(0.42 + 0.55 * fu, -0.12, 1.1 + 0.4 * fu - 0.45 * fu * fu)
    elif arms == 'walk':
        for side, y, ph in (('l', -0.19, 0.0), ('r', 0.19, math.pi)):
            sw = 0.16 * math.sin(TAU * t + ph)
            hands[side] = (V(0.06 + sw * 0.5, y * 1.1, 0.62), V(0.1 + sw, y, 0.46 + 0.03 * abs(sw)))
    elif arms == 'flat':
        hands['l'] = (V(0.25, -0.2, 0.62), V(0.5, -0.22, 0.55))
        hands['r'] = (V(-0.2, 0.2, 0.62), V(-0.45, 0.22, 0.55))
    else:
        hands['l'] = (V(0.1, -0.21, 0.6), V(0.14, -0.19, 0.42))
        hands['r'] = (V(0.1, 0.21, 0.6), V(0.16, 0.19, 0.45))
    for side, (elbow, hand) in hands.items():
        make_part('arm_' + side, tube([sh[side], elbow, hand], 0.055, 0.045, seg=10), 'monkey_fur', root, M)
        make_part('hand_' + side, sphere(hand, 0.062, seg=12, rows=8), 'monkey_hand', root, M)
    if fruit_at is not None:
        pod, stem = monkey_fruit(fruit_at)
        make_part('fruit', pod, 'monkey_fruit', root, M)
        make_part('fruit_stem', stem, 'monkey_fruit_stem', root, M, subsurf=1)
    if flying is not None:
        pod, stem = monkey_fruit(V(0, 0, 0))
        MF = T(flying) @ rot_y(-120 * (t - 0.45) / 0.55 * 3)
        make_part('fruit', pod, 'monkey_fruit', root, MF)
        make_part('fruit_stem', stem, 'monkey_fruit_stem', root, MF, subsurf=1)
    # tail
    mode = P['tail']
    tb = V(-0.2, 0, 0.38)
    if mode in ('curl', 'sway'):
        w = 0.05 * math.sin(TAU * t) if mode == 'sway' else 0.0
        path = [tb, V(-0.3, 0, 0.5), V(-0.38 - w, 0, 0.68), V(-0.36 - 2 * w, 0, 0.86), V(-0.26 - 2 * w, 0, 0.96), V(-0.15 - w, 0, 0.9)]
    elif mode == 'droop':
        path = [tb, V(-0.3, 0, 0.4), V(-0.42, 0, 0.28), V(-0.5, 0, 0.12), V(-0.6, 0, 0.06)]
    else:
        path = [V(-0.17, 0, 0.12), V(-0.35, 0, 0.07), V(-0.55, 0, 0.05), V(-0.72, 0, 0.09)]
    make_part('tail', tube(path, 0.045, 0.025, seg=10), 'monkey_fur', root, M if mode != 'flat' else None)
    biped_legs('monkey', root, M, P, t, (0.0, 0.12, 0.27), (0.13, 0.07, 0.05), 0.06, 'monkey_fur', A=0.12, H=0.07, foot_mat='monkey_hand')


# ================================================================ GHOST CRAB
CRAB_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0,   lid=0.10, mouth='smile',  feet='walk',  stalks='up'),
    'stun': dict(sx=1.03, sz=0.95, lean=-4,  lid=0.50, mouth='wobble', feet='stand', stalks='splay', dazed=True),
    'flat': dict(sx=1.25, sz=0.40, lean=0,   lid=1.00, mouth='flat',   feet='flat',  stalks='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-22, lid=0.00, mouth='o',      feet='limp',  stalks='droop', x=True),
}


def build_ghostCrab(root, pose, t):
    P = dict(CRAB_POSE[pose])
    P.update(er=0.055, skin='ghostCrab_shell')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(4 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc = V(0, 0, 0.22)
    make_part('shell', superellipsoid(bc, 0.3, 0.17, 0.13, 0.6, seg=28, rows=12), 'ghostCrab_shell', root, M)
    make_part('shell_top', ell_cap(bc, (0.3, 0.17, 0.13), (0, -0.25, 1), 50, seg=22, rows=5, scale=1.02), 'ghostCrab_shell2', root, M)
    # periscope eyes on tall stalks
    stalks = P['stalks']
    for side, sx_ in (('l', -1), ('r', 1)):
        base = V(sx_ * 0.1, -0.09, 0.3)
        if stalks == 'up':
            top = V(sx_ * 0.12, -0.11, 0.56)
        elif stalks == 'splay':
            top = V(sx_ * 0.24, -0.12, 0.5)
        elif stalks == 'flat':
            top = V(sx_ * 0.3, -0.12, 0.34)
        else:
            top = V(sx_ * 0.22, -0.12, 0.26)
        make_part('stalk_' + side, tube([base, (base + top) / 2 + V(0, -0.01, 0), top], 0.03, 0.026, seg=8), 'ghostCrab_shell', root, M)
        n = Vector((sx_ * 0.15, -1.0, 0.25)).normalized()
        eye_one('ghostCrab', side, top + Z * 0.03, n, root, M, P, look=Vector((sx_ * 0.2, -0.9, -0.15)))
    msurf = ellipsoid_surf(bc, 0.3, 0.17, 0.13)
    make_part('mouth', mouth_bm(msurf, P['mouth'], 0.2, math.radians(-70), math.radians(-110), scale=0.7), 'ghostCrab_mouth', root, M)
    # claws: the +X one bigger
    for side, sx_, big in (('l', -1, 0.82), ('r', 1, 1.0)):
        arm0 = V(sx_ * 0.26, -0.1, 0.2)
        arm1 = V(sx_ * 0.38, -0.14, 0.27)
        make_part('arm_' + side, tube([arm0, arm1], 0.04, 0.035, seg=8), 'ghostCrab_leg', root, M)
        cc = V(sx_ * 0.45, -0.15, 0.3)
        claw = ellipsoid(cc, X * 0.11 * big, Y * 0.06 * big, Z * 0.075 * big, seg=14, rows=10)
        make_part('claw_' + side, xf(claw, about(cc, rot_y(sx_ * 25))), 'ghostCrab_claw', root, M)
        notch = prism([cc + V(sx_ * 0.11 * big, -0.07, 0.0), cc + V(sx_ * 0.03 * big, -0.07, 0.015), cc + V(sx_ * 0.11 * big, -0.07, 0.04 * big)], Y * 0.01)
        make_part('notch_' + side, notch, 'ghostCrab_dark', root, M, subsurf=0, smooth=False)
    # three legs each side, scuttling
    stance = P['feet']
    for side, sx_ in (('l', -1), ('r', 1)):
        for k in range(3):
            hip = M @ V(sx_ * 0.22, 0.06 - 0.06 * k, 0.2)
            dz = 0.0
            spread = 0.32 + 0.08 * k
            if stance == 'walk':
                _, dz = gait(t, TAU * (k / 3 + (0.5 if sx_ > 0 else 0.0)), 0.0, 0.07)
            elif stance == 'flat':
                spread += 0.1
            elif stance == 'limp':
                dz = 0.05 + 0.03 * k
            foot = V(sx_ * spread, 0.06 - 0.06 * k, 0.025 + dz)
            knee = V(sx_ * (spread - 0.06), 0.06 - 0.06 * k, 0.3 + dz * 0.5)
            make_part('leg_%s%d' % (side, k), tube([hip, knee, foot], 0.03, 0.02, seg=8), 'ghostCrab_leg', root, None)
            make_part('foot_%s%d' % (side, k), sphere(foot, 0.028, seg=8, rows=5), 'ghostCrab_leg', root, None, subsurf=1)


# ================================================================ MANGO
MANGO_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=3,   lid=0.15, mouth='grin',   feet='walk'),
    'curl': dict(sx=1.05, sz=0.95, lean=16,  lid=0.70, mouth='small',  feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0,   lid=1.00, mouth=None,     feet=None),
    'stun': dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp', x=True),
}


def mango_body(root, M, c, radii, tilt):
    """The mango: an orange ellipsoid tilted nose-down with a red blush cap on the top-back and a yellow belly."""
    MB = M @ about(c, rot_y(tilt))
    make_part('skin', blob(c, *radii, seg=26, rows=14), 'mango_skin', root, MB)
    make_part('blush', ell_cap(c, radii, (-0.35, 0, 1), 58, seg=22, rows=6), 'mango_blush', root, MB)
    make_part('belly', ell_cap(c, radii, (0.5, 0, -1), 48, seg=22, rows=6), 'mango_belly', root, MB)
    top = c + V(-0.04, 0, radii[2])
    make_part('stem', tube([top - Z * 0.02, top + V(-0.01, 0, 0.07)], 0.026, 0.02, seg=8), 'mango_stem', root, MB)
    leaf = prism([top + V(-0.01, 0, 0.05), top + V(-0.1, 0, 0.12), top + V(-0.24, 0, 0.11), top + V(-0.2, 0, 0.04), top + V(-0.08, 0, 0.03)], Y * 0.03)
    make_part('leaf', leaf, 'mango_leaf', root, MB, subsurf=1)
    return MB


def build_mango(root, pose, t):
    P = dict(MANGO_POSE[pose])
    P.update(er=0.085, skin='mango_skin')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'roll':
        c, radii = V(0, 0, 0.3), (0.3, 0.24, 0.27)
        MR = about(c, rot_y(360 * t))
        MB = mango_body(root, MR, c, radii, 0)
        surf = ellipsoid_surf(c, *radii, M=about(c, rot_y(0)))
        for side, az in (('r', -0.35), ('l', -1.2)):
            p, n = surf(0.36, az)
            eye_one('mango', side, p - n * 0.012, n, root, MB, P)
        return
    c, radii = V(0, 0, 0.36), (0.33, 0.24, 0.27)
    MB = mango_body(root, M, c, radii, 18)
    surf = ellipsoid_surf(c, *radii)
    for side, az in (('r', -0.35), ('l', -1.2)):
        p, n = surf(0.42, az)
        eye_one('mango', side, p - n * 0.012, n, root, MB, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.27, math.radians(5), math.radians(-105), scale=1.0), 'mango_mouth', root, MB)
    biped_legs('mango', root, M, P, t, (0.0, 0.1, 0.2), (0.1, 0.06, 0.045), 0.035, 'mango_feet')


# ================================================================ COIN: the cashew nut
def build_coin(root, pose, t):
    M = rot_z(360 * t) @ rot_y(-35)
    path, radii = [], []
    n = 12
    for k in range(n + 1):
        a = math.radians(145 + 235 * k / n)
        path.append(V(0.16 * math.cos(a), 0, 0.16 * math.sin(a) + 0.06))
        u = k / n
        radii.append(0.04 + 0.085 * math.sin(math.pi * u) ** 1.2)
    make_part('shell', tube(path, 0.06, seg=16, radii=radii), 'coin_shell', root, M)
    # the pale crease along the inside of the curve (on the front face) and a glint on the thick lobe
    crease = [path[k] + (V(0, 0, 0.06) - path[k]).normalized() * (radii[k] * 0.55) + V(0, -radii[k] * 0.8, 0) for k in range(3, n - 2)]
    make_part('crease', tube(crease, 0.012, seg=6), 'coin_shell_dark', root, M, subsurf=1)
    gk = 5
    gc = path[gk] + V(-0.03, -radii[gk] * 0.92, 0.02)
    make_part('glint', ellipsoid(gc, X * 0.028, Z * 0.045, Y * 0.012, seg=10, rows=6), 'coin_highlight', root, M, subsurf=1)


# ================================================================ STAR: the golden baobab
STAR_TRUNK = [(0, -0.43), (0.21, -0.43), (0.25, -0.38), (0.22, -0.26), (0.21, -0.1), (0.18, 0.08), (0.14, 0.2), (0.1, 0.26), (0, 0.27)]
STAR_BRANCHES = [(-140, 0.3, 0.75), (-60, 0.28, 0.9), (20, 0.32, 0.7), (100, 0.27, 0.95), (170, 0.3, 0.8)]


def build_star(root, pose, t):
    M = T((0, 0, 0.035 * math.sin(TAU * t)))
    make_part('trunk', lathe(STAR_TRUNK, seg=24), 'star_gold', root, M)
    for k, (az, L, up) in enumerate(STAR_BRANCHES):
        d = Vector((math.cos(math.radians(az)) * 0.7, math.sin(math.radians(az)) * 0.7, up)).normalized()
        b0 = V(0, 0, 0.2)
        b1 = b0 + d * L * 0.55 + Z * 0.02
        b2 = b0 + d * L + Z * 0.04
        make_part('branch%d' % k, tube([b0, b1, b2], 0.07, 0.03, seg=10), 'star_gold_dark', root, M)
        for j, (ang, L2) in enumerate(((-35, 0.11), (30, 0.1))):
            td = (rot_z(ang).to_3x3() @ d + Z * 0.5).normalized()
            make_part('twig%d_%d' % (k, j), tube([b2 - d * 0.02, b2 + td * L2], 0.03, 0.012, seg=8), 'star_gold_dark', root, M, subsurf=1)
            make_part('leaf%d_%d' % (k, j), sphere(b2 + td * L2, 0.038, seg=10, rows=6), 'star_leaf', root, M, subsurf=1)
    # sparkles circling the tree (unlit)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.42 * math.cos(a), -0.2, 0.2 * math.sin(a) - 0.05)
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = []
        for j in range(8):
            rr = r if j % 2 == 0 else r * 0.38
            pts.append(c + V(rr * math.cos(TAU * j / 8), 0, rr * math.sin(TAU * j / 8)))
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, M, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the capulana bundle
def build_bundle(root, M, kind, spent, t):
    cloth = kind + '_cloth'
    make_part('box', box_bm((1.0, 1.0, 1.0), bevel=0.05), cloth, root, M, subsurf=0)
    prints = ['_print' if spent else s for s in ('_print_teal', '_print_yellow', '_print_magenta')]
    faces = [((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((-1, 0, 0), (0, -1, 0))]
    for fi, (nrm, tng) in enumerate(faces):
        nrm, tng = Vector(nrm), Vector(tng)
        for k, (u, w) in enumerate(((-0.3, 0.18), (0.0, -0.14), (0.3, 0.18))):
            c = nrm * 0.515 + tng * u + Z * w
            make_part('print%d_%d' % (fi, k), disc(c, nrm, 0.155, 0.012, seg=24), kind + prints[k], root, M, subsurf=0)
            make_part('dot%d_%d' % (fi, k), disc(c + nrm * 0.013, nrm, 0.055, 0.012, seg=16), kind + '_dot', root, M, subsurf=0)
    make_part('band', box_bm((1.03, 1.03, 0.1), bevel=0.02), kind + '_band', root, M @ T((0, 0, -0.36)), subsurf=0)
    # the knot on top: two cloth ears and a knot ball
    if spent:
        make_part('knot', sphere((0, 0, 0.54), 0.08, seg=14, rows=8), kind + '_knot', root, M)
        for side, sgn in (('l', -1), ('r', 1)):
            ear = tube([V(sgn * 0.05, 0, 0.55), V(sgn * 0.4, -0.1, 0.5), V(sgn * 0.58, -0.12, 0.2)], 0.06, 0.03, seg=8)
            make_part('ear_' + side, ear, cloth, root, M)
        return
    make_part('knot', sphere((0, 0, 0.56), 0.1, seg=14, rows=8), kind + '_knot', root, M)
    for side, sgn in (('l', -1), ('r', 1)):
        fl = 6 * math.sin(TAU * t + (0 if sgn < 0 else 1.5))
        ear = ellipsoid(V(sgn * 0.17, 0, 0.66), X * 0.13, Y * 0.06, Z * 0.075, seg=14, rows=8)
        make_part('ear_' + side, xf(ear, about(V(sgn * 0.06, 0, 0.58), rot_y(sgn * (-42 + fl)))), cloth, root, M)


def build_qblock(root, pose, t):
    M = rot_y(2.5 * math.sin(TAU * t)) @ diag(1 + 0.012 * math.sin(TAU * t), 1, 1 - 0.012 * math.sin(TAU * t))
    build_bundle(root, M, 'qblock', False, t)


def build_used(root, pose, t):
    build_bundle(root, Matrix.Identity(4), 'used', True, t)


# ================================================================ public API
BUILDERS = {'warthog': build_warthog, 'cashew': build_cashew, 'weaver': build_weaver, 'prawn': build_prawn,
            'monkey': build_monkey, 'ghostCrab': build_ghostCrab, 'mango': build_mango, 'coin': build_coin,
            'star': build_star, 'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    """Build one kind in a pose (fresh geometry; any previous build of that kind is removed first)."""
    if kind not in KINDS:
        raise ValueError('unknown kind %r; one of %s' % (kind, KINDS))
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s; one of %s' % (pose, kind, POSES[kind]))
    clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root


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
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try:
            scene.render.engine = eng
            break
        except TypeError as e:
            print('engine fallback:', e)
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
    cam.location = (0.0, -4.0, 0.5)
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


def render_pose(kind, pose, t=0.0, suffix='', look=None):
    root = build(kind, pose, t)
    cam = bpy.data.objects['sprite_cam']
    cam.location.z = 0.5 if ORIGIN[kind] == 'feet' else 0.0
    if look:
        import lookkit as LK
        # the pipeline renders at PX * 3 px/m with a 1.25 px outline; scale it to this preview's 512 px / 1.6 m
        LK.apply_look(look, LK.all_meshes(root), outline_px=1.25 * (PX * 3) / (512 / 1.6))
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
    sheet_ = np.zeros((cell, cell * n, 4), dtype=np.float32)
    for i, p in enumerate(paths):
        img = bpy.data.images.load(p)
        img.scale(cell, cell)
        px = np.array(img.pixels[:], dtype=np.float32).reshape(cell, cell, 4)
        sheet_[:, i * cell:(i + 1) * cell, :] = px
        bpy.data.images.remove(img)
    alpha = sheet_[..., 3:4]
    sheet_[..., :3] = sheet_[..., :3] + (1 - alpha) * 0.35     # mid-grey backdrop so the transparent film reads
    sheet_[..., 3] = 1.0
    res = bpy.data.images.new('sheet', cell * n, cell, alpha=True)
    res.pixels[:] = sheet_.ravel().tolist()
    res.filepath_raw = out
    res.file_format = 'PNG'
    res.save()
    bpy.data.images.remove(res)
    return out


def bounds(root):
    pts = [ob.matrix_world @ Vector(co) for ob in root.children_recursive if ob.type == 'MESH' for co in ob.bound_box]
    xs, zs = [p.x for p in pts], [p.z for p in pts]
    return min(xs), max(xs), min(zs), max(zs)


if __name__ == '__main__':
    only = [a for a in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else []
    look = os.environ.get('LOOK')
    if look:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(SCRATCH, exist_ok=True)
    setup_preview_scene()
    for kind in KINDS:
        if only and kind not in only:
            continue
        outs = []
        for pose in POSES[kind]:
            ts = [(0.0, '')]
            if (kind, pose) in CYCLES:
                ts.append((0.5, '_t50'))
            if kind == 'coin':
                ts = [(0.0, ''), (0.125, '_t12'), (0.25, '_t25'), (0.375, '_t37')]
            if (kind, pose) == ('monkey', 'throw'):
                ts = [(0.0, ''), (0.3, '_t30'), (0.5, '_t50'), (0.7, '_t70')]
            for t, suffix in ts:
                root, path = render_pose(kind, pose, t, suffix, look)
                x0, x1, z0, z1 = bounds(root)
                print('%-9s %-7s t=%.2f  tris %5d  subdivided %6d  x %.2f..%.2f (%.0f px)  z %.2f..%.2f (%.0f px)  %s' % (
                    kind, pose, t, triangle_count(root), triangle_count(root, True), x0, x1, (x1 - x0) * PX, z0, z1, (z1 - z0) * PX, path))
                outs.append(path)
        clear(kind)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
