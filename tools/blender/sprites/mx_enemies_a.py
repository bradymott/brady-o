# mx_enemies_a: six original cartoon characters for the Mexico tour of Super Brady-O World, modelled for the
# pre-rendered 2D sprite pipeline with the same conventions as mx_pepper.py:
#   Z up, the character FACES +X (screen-right), feet on z = 0, centred on x = y = 0; the sprite camera looks
#   along +Y from -Y.  1 m = 28.1 px.  Plain Principled materials (Base Color, roughness 0.5) named <kind>_<part>
#   so a look kit can restyle them (the final look is flat toon shading with dark outlines, so everything is
#   chunky, big-eyed and silhouette-first).  Every object is parented to one Empty named after the kind and
#   carries obj['sprite_part'].  Subdivision modifiers are used on the smooth parts.
#
# Characters (kind: poses):
#   elote      a grilled corn cob on little green feet, husk peeled down like a collar   idle(t) walk(t) stun flat ko
#   burro      a papier-mache pinata donkey with fringe rows and paper-tassel legs         walk(t) hurt_walk(t) stun flat ko
#   chihuahua  a tiny fierce chihuahua in a striped knitted sweater                        walk(t) notice charge stun flat ko
#   armadillo  a banded armadillo that curls into a ball and rolls                         walk(t) curl roll(t) stun flat ko
#   salsa      a three-legged molcajete bowl of red salsa with a face, flinging blobs      idle(t) throw(t) stun flat ko
#   xolo       a friendly xoloitzcuintli with a mohawk tuft carrying a tray of tacos       idle(t) wave(t)
#
# API:  build(kind, pose='idle', t=0.0) -> root Empty named kind     clear() -> removes every hierarchy
#       KINDS, POSES[kind], HEIGHT[kind] (nominal standing height in metres = hitbox height / 28.1)
# Headless preview of everything:
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_enemies_a.py
import math
import os

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
PX = 28.1
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxen_a'

KINDS = ['elote', 'burro', 'chihuahua', 'armadillo', 'salsa', 'xolo']
POSES = {
    'elote': ['idle', 'walk', 'stun', 'flat', 'ko'],
    'burro': ['walk', 'hurt_walk', 'stun', 'flat', 'ko'],
    'chihuahua': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'armadillo': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'salsa': ['idle', 'throw', 'stun', 'flat', 'ko'],
    'xolo': ['idle', 'wave'],
}
# poses whose t parameter is a cycle phase (0..1)
CYCLES = {
    'elote': ['idle', 'walk'], 'burro': ['walk', 'hurt_walk'], 'chihuahua': ['walk'],
    'armadillo': ['walk', 'roll'], 'salsa': ['idle', 'throw'], 'xolo': ['idle', 'wave'],
}
HEIGHT = {'elote': 30 / PX, 'burro': 30 / PX, 'chihuahua': 16 / PX, 'armadillo': 18 / PX, 'salsa': 30 / PX, 'xolo': 30 / PX}

COLORS = {
    'elote_cob': '#ffd84a', 'elote_kernel': '#f0b020', 'elote_husk': '#7ab04a', 'elote_husk_dark': '#58983a',
    'elote_eye_white': '#fbfbf2', 'elote_pupil': '#1a1020', 'elote_mouth': '#6a2a10', 'elote_feet': '#3a6a2a',
    'burro_body': '#ff9ac8', 'burro_body_hurt': '#c8a0ff', 'burro_fringe_a': '#18c2c2', 'burro_fringe_b': '#8a4aff',
    'burro_fringe_c': '#5ad04a', 'burro_leg_pink': '#ff3d8b', 'burro_leg_orange': '#ff6a3a', 'burro_mane': '#ffd84a',
    'burro_tail': '#ff3d8b', 'burro_eye_white': '#fbfbf2', 'burro_pupil': '#1a1020', 'burro_muzzle': '#e87ab0',
    'burro_mouth': '#5a1a3a', 'burro_candy': '#ffd84a',
    'chihuahua_fur': '#d8a86a', 'chihuahua_sweater': '#18c2c2', 'chihuahua_stripe': '#ff3d8b',
    'chihuahua_ear_inner': '#ff9ac8', 'chihuahua_nose': '#1a1020', 'chihuahua_eye_white': '#fbfbf2',
    'chihuahua_pupil': '#1a1020', 'chihuahua_mouth': '#5a1a2a', 'chihuahua_tongue': '#ff7a9a',
    'armadillo_shell': '#9a8a7a', 'armadillo_band': '#5e4e40', 'armadillo_skin': '#c8a888', 'armadillo_nose': '#1a1020',
    'armadillo_eye_white': '#fbfbf2', 'armadillo_pupil': '#1a1020', 'armadillo_mouth': '#5a2a2a',
    'salsa_bowl': '#6e6e7c', 'salsa_bowl_dark': '#55555f', 'salsa_salsa': '#e8281a', 'salsa_chunk': '#ff8a6a',
    'salsa_herb': '#5ad04a', 'salsa_eye_white': '#fbfbf2', 'salsa_pupil': '#1a1020', 'salsa_mouth': '#2a1020',
    'xolo_skin': '#4a4a5a', 'xolo_tuft': '#eee0c0', 'xolo_ear_inner': '#ff9ac8', 'xolo_collar': '#18c2c2',
    'xolo_nose': '#1a1020', 'xolo_eye_white': '#fbfbf2', 'xolo_pupil': '#1a1020', 'xolo_mouth': '#2a1020',
    'xolo_tongue': '#ff7a9a', 'xolo_tray': '#c89a5a', 'xolo_taco_shell': '#f2c060', 'xolo_lettuce': '#5ad04a',
    'xolo_meat': '#8a4a2a', 'xolo_tomato': '#e83a2a',
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


def rot_y(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Y')


def rot_x(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'X')


def rot_z(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Z')


def T(v):
    return Matrix.Translation(Vector(v))


def diag(sx, sy, sz):
    return Matrix.Diagonal((sx, sy, sz, 1.0))


def about(pivot, M):
    """Apply M about a pivot point."""
    return T(pivot) @ M @ T(-Vector(pivot))


def aim(base, tip):
    """Matrix moving the +Z axis at the origin onto the segment base -> tip (length preserved)."""
    d = Vector(tip) - Vector(base)
    return T(base) @ Z.rotation_difference(d.normalized()).to_matrix().to_4x4()


def smooth01(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def wrap_pi(a):
    return (a + math.pi) % TAU - math.pi


# ---------------------------------------------------------------- bmesh builders
def ring_mesh(rings):
    """Rings ordered along the axis; each a list of Vectors (same count) or a single Vector (a pole)."""
    bm = bmesh.new()
    vs = []
    for ring in rings:
        if isinstance(ring, Vector):
            vs.append(bm.verts.new(ring))
        else:
            vs.append([bm.verts.new(p) for p in ring])
    for A, B in zip(vs, vs[1:]):
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


def superellipse_section(hx, hy, hz, e, dz, n=24):
    """n points (and unit tangents) evenly spaced by arc length around the horizontal section of a
    superellipsoid at height dz above its centre."""
    s = min(0.999, abs(dz) / hz)
    phi = math.asin(s ** (1.0 / e))
    cp = math.cos(phi) ** e
    fine = 600
    pts = [Vector((cp * _ce(th, e) * hx, cp * _se(th, e) * hy, dz)) for th in (TAU * j / fine for j in range(fine))]
    seglen = [(pts[(j + 1) % fine] - pts[j]).length for j in range(fine)]
    total = sum(seglen)
    out = []
    acc, j = 0.0, 0
    for k in range(n):
        target = total * k / n
        while acc + seglen[j] < target:
            acc += seglen[j]
            j += 1
        u = (target - acc) / seglen[j]
        p = pts[j].lerp(pts[(j + 1) % fine], u)
        tg = (pts[(j + 1) % fine] - pts[j]).normalized()
        out.append((p, tg))
    return out, total / n


def tube(path, r0, r1=None, seg=8, taper=None):
    """Round tube along a polyline of Vectors, radius r0 -> r1 (or taper(u) * r0), with pole-closed ends."""
    r1 = r0 if r1 is None else r1
    n = len(path)
    rings = []
    for i, p in enumerate(path):
        t = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        u = i / (n - 1)
        r = r0 * taper(u) if taper else r0 + (r1 - r0) * u
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


def lathe(profile, seg=24, zig=0.0):
    """Surface of revolution around Z through (r, z) points in order; r = 0 is a pole.  zig offsets the z of
    every other vertex on rings flagged with a third tuple element (a ragged fringe edge)."""
    rings = []
    for q in profile:
        r, z = q[0], q[1]
        ragged = len(q) > 2 and q[2]
        if r < 1e-6:
            rings.append(Vector((0, 0, z)))
        else:
            rings.append([Vector((r * math.cos(TAU * j / seg), r * math.sin(TAU * j / seg),
                                  z + (zig if (ragged and j % 2) else 0.0))) for j in range(seg)])
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


def ellipsoid_surf(c, rx, ry, rz):
    c = Vector(c)

    def f(z, a):
        k = math.sqrt(max(0.0, 1 - ((z - c.z) / rz) ** 2))
        p = c + Vector((rx * k * math.cos(a), ry * k * math.sin(a), z - c.z))
        n = Vector(((p.x - c.x) / rx ** 2, (p.y - c.y) / ry ** 2, (p.z - c.z) / rz ** 2)).normalized()
        return p, n
    return f


def sphere_point(c, r, az, el):
    """Point and normal on a sphere at azimuth az (0 = +X, -pi/2 = camera side) and elevation el."""
    n = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    return Vector(c) + n * r, n


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
    """One eye at centre c facing n: white, pupil, lid cap (skin material P['skin']) and a crease when shut."""
    er = (er or P['er']) * P.get('eye', 1.0)
    lid = P['lid'] if lid is None else lid
    n = n.normalized()
    up = (Z - n * n.z).normalized()
    s = up.cross(n)
    make_part('eye_' + side, ellipsoid(c, n * er * 0.9, s * er * 0.95, up * er * 1.08, seg=18, rows=12),
              kind + '_eye_white', root, M)
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
    """A mouth from an explicit polyline (quadruped muzzles): 'smile', 'flat', 'wobble', 'frown'."""
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


def quad_legs(kind, root, M, P, t, hips, foot_z, leg_r, foot_r, mat, A=0.1, H=0.06, foot_mat=None, raised=None):
    """Four tube legs from the (posed) hips to feet on the ground.  P['feet']: walk, stand, flat, charge, limp,
    tuck.  raised: name of a leg held up (a wave), with its paw position."""
    foot_mat = foot_mat or mat
    for name, hip in hips.items():
        hw = M @ hip
        stance = P['feet']
        dx = dz = 0.0
        y = hip.y
        front = name[0] == 'f'
        if raised and name == raised[0]:
            paw = Vector(raised[1])
            elbow = (hw + paw) / 2 + Vector((0.06, 0, 0.0))
            make_part('leg_' + name, tube([hw, elbow, paw], leg_r, seg=10), mat, root, None)
            make_part('foot_' + name, ellipsoid(paw, X * foot_r[0], Y * foot_r[1], Z * foot_r[2] * 1.3, seg=12, rows=8),
                      foot_mat, root, None)
            continue
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
            dx = -0.04 if front else 0.04
            y *= 0.8
        foot = Vector((hip.x + dx, y, foot_z + dz))
        knee = (hw + foot) / 2 + Vector((dz * 0.8, 0, 0))
        make_part('leg_' + name, tube([hw, knee, foot], leg_r, seg=10), mat, root, None)
        make_part('foot_' + name, ellipsoid(foot, X * foot_r[0], Y * foot_r[1], Z * foot_r[2], seg=12, rows=8),
                  foot_mat, root, None)


# ================================================================ ELOTE
ELOTE_PROFILE = [(0, 1.03), (0.1, 1.015), (0.19, 0.95), (0.22, 0.78), (0.225, 0.55), (0.215, 0.33),
                 (0.17, 0.21), (0.08, 0.175), (0, 0.17)]
ELOTE_POSE = {
    'idle': dict(sx=1.00, sz=1.00, lean=2, lid=0.15, mouth='grin', feet='stand', droop=0.0),
    'walk': dict(sx=1.00, sz=1.00, lean=4, lid=0.15, mouth='grin', feet='walk', droop=0.0),
    'stun': dict(sx=1.03, sz=0.95, lean=-6, lid=0.5, mouth='wobble', feet='stand', dazed=True, droop=0.8),
    'flat': dict(sx=1.30, sz=0.35, lean=0, lid=1.0, mouth='flat', feet='flat', droop=1.0),
    'ko':   dict(sx=1.00, sz=0.95, lean=-9, lid=1.0, mouth='o', feet='limp', droop=1.0),
}


def elote_leaf(az, droop):
    rows, cols = 9, 5
    d = Vector((math.cos(az), math.sin(az), 0))
    tg = Vector((-math.sin(az), math.cos(az), 0))
    centre = []
    for i in range(rows):
        v = i / (rows - 1)
        r = 0.16 + 0.19 * v + 0.08 * v * v + 0.08 * droop * v
        z = 0.14 + 0.5 * v * (1 - 0.35 * v) - droop * 0.42 * v * v
        centre.append(d * r + Z * z)
    outer, inner = [], []
    for i in range(rows):
        v = i / (rows - 1)
        c = centre[i]
        tan = (centre[min(i + 1, rows - 1)] - centre[max(i - 1, 0)]).normalized()
        nrm = tan.cross(tg).normalized()
        if nrm.dot(d) < 0:
            nrm = -nrm
        w = 0.17 * math.sin(math.pi * (0.1 + 0.9 * v)) ** 0.9
        ro, ri = [], []
        for j in range(cols):
            u = (j / (cols - 1)) * 2 - 1
            p = c + tg * w * u - nrm * 0.045 * u * u
            ro.append(p + nrm * 0.016)
            ri.append(p - nrm * 0.016)
        outer.append(ro)
        inner.append(ri)
    return solid_patch(outer, inner)


def elote_kernels(surf):
    bms = []
    zs = [0.3 + 0.62 * i / 6 for i in range(7)]
    for i, z in enumerate(zs):
        around = 9
        off = 0.5 if i % 2 else 0.0
        for j in range(around):
            a = TAU * (j + off) / around
            if -1.65 < wrap_pi(a) < 0.2 and 0.5 < z < 0.92:
                continue
            p, n = surf(z, a)
            tg = Z.cross(n).normalized()
            up = n.cross(tg)
            bms.append(ellipsoid(p + n * 0.006, n * 0.03, tg * 0.062, up * 0.042, seg=10, rows=6))
    return join(bms)


def biped_legs(kind, root, M, P, t, hip, foot_dims, leg_r, mat, A=0.11, H=0.06):
    for side, y, phase in (('l', -0.1, math.pi / 2), ('r', 0.1, 3 * math.pi / 2)):
        h = Vector((hip[0], y, hip[2]))
        hw = M @ h
        stance = P['feet']
        dx = dz = tilt = 0.0
        if stance == 'walk':
            dx, dz = gait(t, phase, A, H)
        elif stance == 'stand':
            dx = 0.05 if side == 'l' else -0.03
        elif stance == 'flat':
            dx = 0.26 if side == 'l' else -0.22
            y *= 0.7
        elif stance == 'limp':
            dx = 0.14 if side == 'l' else -0.1
            tilt = -30.0
        fc = Vector((h.x + dx, y, foot_dims[2] + dz))
        knee = (hw + fc) / 2 + Vector((dz * 0.8, 0, 0))
        make_part('leg_' + side, tube([hw, knee, fc], leg_r, seg=10), mat, root, None)
        bm = ellipsoid(Vector((0, 0, 0)), X * foot_dims[0], Y * foot_dims[1], Z * foot_dims[2], seg=14, rows=8)
        make_part('foot_' + side, xf(bm, T(fc) @ rot_y(tilt)), mat, root, None)


def build_elote(root, pose, t):
    P = dict(ELOTE_POSE[pose])
    P.update(er=0.09, skin='elote_cob')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'idle':
        b = math.sin(TAU * t)
        sz *= 1 + 0.035 * b
        sx *= 1 - 0.02 * b
    elif pose == 'walk':
        bob = 0.025 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    surf = lathe_surf(ELOTE_PROFILE)
    make_part('cob', lathe(ELOTE_PROFILE, seg=28), 'elote_cob', root, M)
    make_part('kernels', elote_kernels(surf), 'elote_kernel', root, M, subsurf=1)
    for k in range(6):
        az = math.radians(-60 + 60 * k)
        make_part('husk_%d' % k, elote_leaf(az, P['droop']), 'elote_husk' if k % 2 == 0 else 'elote_husk_dark', root, M)
    for side, az in (('r', -0.3), ('l', -1.25)):
        p, n = surf(0.78, az)
        eye_one('elote', side, p - n * 0.012, n, root, M, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.6, math.radians(10), math.radians(-105), scale=1.2), 'elote_mouth', root, M)
    biped_legs('elote', root, M, P, t, (0.02, 0, 0.21), (0.11, 0.065, 0.045), 0.035, 'elote_feet')


# ================================================================ BURRO
BURRO_BODY = (Vector((-0.05, 0, 0.56)), 0.47, 0.21, 0.24, 0.5)
BURRO_POSE = {
    'walk':      dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='smile', feet='walk', droop=0.0, hurt=False),
    'hurt_walk': dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='wobble', feet='walk', droop=0.25, hurt=True),
    'stun':      dict(sx=1.03, sz=0.96, lean=-6, lid=0.5, mouth='wobble', feet='stand', dazed=True, droop=0.7, hurt=False),
    'flat':      dict(sx=1.08, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat', droop=1.0, hurt=False),
    'ko':        dict(sx=1.00, sz=0.96, lean=-12, lid=1.0, mouth='o', feet='limp', droop=1.0, hurt=False),
}
BURRO_LEGS = {'fl': (0.33, -0.11, 'burro_leg_pink'), 'fr': (0.33, 0.11, 'burro_leg_orange'),
              'bl': (-0.3, -0.11, 'burro_leg_orange'), 'br': (-0.3, 0.11, 'burro_leg_pink')}


def burro_fringe(z, loose=None):
    c, hx, hy, hz, e = BURRO_BODY
    pts, spacing = superellipse_section(hx, hy, hz, e, z - c.z, n=26)
    bms = []
    w = spacing * 0.92
    for k, (p, tg) in enumerate(pts):
        p = c + p
        out = Vector((p.x - c.x, p.y - c.y, 0)).normalized()
        tl = p - tg * w / 2 + out * 0.012
        tr = p + tg * w / 2 + out * 0.012
        tip = p + out * 0.05 - Z * 0.1
        bm = prism([tl, tr, tip], out * 0.012)
        if loose is not None and k == loose:
            bm.transform(about(tl, Matrix.Rotation(math.radians(75), 4, out)))
        bms.append(bm)
    return join(bms)


def burro_tassel(x, y):
    bms = []
    for k in range(3):
        zt = 0.37 - 0.12 * k
        prof = [(0, zt + 0.02), (0.035, zt), (0.082, zt - 0.125, True), (0.06, zt - 0.115), (0, zt - 0.1)]
        bms.append(lathe(prof, seg=16, zig=0.018))
    return xf(join(bms), T((x, y, 0)))


def burro_ear(side, droop):
    y = -0.07 if side == 'l' else 0.07
    base = Vector((0.36 if side == 'l' else 0.44, y, 1.05))
    up_dir = Vector((-0.06 if side == 'l' else 0.03, y * 0.3, 0.2))
    down_dir = Vector((-0.22, y * 1.6, -0.02))
    tip = base + up_dir.lerp(down_dir, droop)
    return cone(base, tip, 0.075, flat=0.5)


def build_burro(root, pose, t):
    P = dict(BURRO_POSE[pose])
    hurt = P['hurt']
    skin = 'burro_body_hurt' if hurt else 'burro_body'
    P.update(er=0.085, skin=skin)
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    nod = 0.0
    walking = pose in ('walk', 'hurt_walk')
    if walking:
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
        nod = 4 * math.sin(TAU * t)
    M = T((-0.08, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)      # shifted back: the nose and tail both fit the frame
    c, hx, hy, hz, e = BURRO_BODY
    make_part('body', superellipsoid(c, hx, hy, hz, e, seg=28, rows=14), skin, root, M)
    loose = 6 if hurt else None          # a flap on the camera side of the top row
    for i, (z, mat) in enumerate(((0.75, 'burro_fringe_a'), (0.63, 'burro_fringe_b'), (0.51, 'burro_fringe_c'))):
        make_part('fringe_%d' % i, burro_fringe(z, loose if i == 0 else None), mat, root, M, subsurf=0, smooth=False)
    if hurt:
        make_part('candy', ellipsoid(Vector((-0.12, -0.215, 0.58)), X * 0.075, Y * 0.02, Z * 0.065, seg=12, rows=8),
                  'burro_candy', root, M)
    # neck and head (nod with the walk)
    MH = M @ about((0.35, 0, 0.7), rot_y(nod))
    nc = Vector((0.42, 0, 0.86))
    make_part('neck', xf(superellipsoid(nc, 0.15, 0.13, 0.25, 0.5, seg=20, rows=12), about(nc, rot_y(12))), skin, root, MH)
    hc = Vector((0.6, 0, 0.94))
    make_part('head', superellipsoid(hc, 0.21, 0.13, 0.13, 0.45, seg=24, rows=12), skin, root, MH)
    make_part('muzzle', ellipsoid(Vector((0.8, 0, 0.92)), X * 0.035, Y * 0.1, Z * 0.085, seg=14, rows=8), 'burro_muzzle', root, MH)
    make_part('nostril', sphere((0.825, -0.05, 0.91), 0.018, seg=10, rows=6), 'burro_pupil', root, MH)
    for side in ('l', 'r'):
        make_part('ear_' + side, burro_ear(side, P['droop']), 'burro_mane', root, MH)
    # mane: flaps along the back of the neck
    mane = []
    a, b = Vector((0.31, 0, 1.12)), Vector((0.19, 0, 0.8))
    for k in range(5):
        u0, u1 = k / 5, (k + 1) / 5
        p0, p1 = a.lerp(b, u0), a.lerp(b, u1)
        tip = (p0 + p1) / 2 + Vector((-0.09, 0, 0.07))
        mane.append(prism([p0, p1, tip], Y * 0.07))
    make_part('mane', join(mane), 'burro_mane', root, MH, subsurf=0, smooth=False)
    # eyes: the camera-side one squints when hurt
    for side, y in (('l', -0.125), ('r', 0.125)):
        n = Vector((0.15, -1 if side == 'l' else 1, 0.2))
        lid = 0.6 if (hurt and side == 'l' and pose != 'ko') else None
        eye_one('burro', side, Vector((0.63, y, 0.99)), n, root, MH, P, lid=lid)
    mouth_path = [(0.7, -0.135, 0.85), (0.76, -0.125, 0.835), (0.81, -0.095, 0.84), (0.835, -0.05, 0.855)]
    if P['mouth'] == 'o':
        make_part('mouth', ellipsoid(Vector((0.8, -0.085, 0.845)), X * 0.035, Y * 0.03, Z * 0.04, seg=12, rows=8), 'burro_mouth', root, MH)
    else:
        make_part('mouth', line_mouth(mouth_path, P['mouth']), 'burro_mouth', root, MH)
    # curly paper tail
    tc = Vector((-0.6, 0, 0.56))
    path = []
    for k in range(17):
        u = k / 16
        ang = math.pi * (0.2 + 1.7 * u)
        r = 0.1 - 0.04 * u
        path.append(tc + Vector((math.cos(ang) * r, 0, math.sin(ang) * r)))
    make_part('tail', tube(path, 0.03, 0.018, seg=8), 'burro_tail', root, M)
    # paper-tassel legs
    for name, (x, y, mat) in BURRO_LEGS.items():
        hip = Vector((x, y, 0.36))
        stance = P['feet']
        swing, lift, splay = 0.0, 0.0, 0.0
        if stance == 'walk':
            th = TAU * t + PHASE[name]
            swing = -14 * math.sin(th)
            lift = 0.05 * max(0.0, math.cos(th))
        elif stance == 'limp':
            swing = -25 if name[0] == 'f' else 25
        elif stance == 'flat':
            splay = 0.2 if name[0] == 'f' else -0.2
        hw = M @ hip
        if stance == 'flat':
            ML = M @ T((splay, 0, 0))
        else:
            ML = T(hw - hip + Z * lift) @ about(hip, rot_y(swing))
        make_part('leg_' + name, burro_tassel(x, y), mat, root, ML, subsurf=1)


# ================================================================ CHIHUAHUA
CHI_POSE = {
    'walk':   dict(sx=1.00, sz=1.00, lean=0, lid=0.1, pupil=1.0, mouth='smile', feet='walk', ears='up'),
    'notice': dict(sx=0.95, sz=1.08, lean=-14, lid=0.0, eye=1.15, pupil=0.7, mouth='o', feet='stand', ears='alert'),
    'charge': dict(sx=1.25, sz=0.85, lean=6, lid=0.35, pupil=1.0, mouth='open', feet='charge', ears='flat', angry=True),
    'stun':   dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, pupil=0.9, mouth='wobble', feet='stand', ears='droop', dazed=True),
    'flat':   dict(sx=1.25, sz=0.40, lean=0, lid=1.0, pupil=1.0, mouth='flat', feet='flat', ears='flat'),
    'ko':     dict(sx=1.00, sz=0.95, lean=-8, lid=1.0, pupil=1.0, mouth='o', feet='limp', ears='droop'),
}
CHI_HEAD = (Vector((0.3, 0, 0.5)), 0.19)
CHI_EARS = {   # tip offsets from the ear base, for the camera-side ear (the far ear mirrors y)
    'up': Vector((-0.04, -0.07, 0.33)), 'alert': Vector((0.02, -0.03, 0.36)), 'flat': Vector((-0.3, -0.05, 0.08)),
    'droop': Vector((-0.1, -0.16, 0.12)),
}


def chi_ear(side, mode, root, M):
    y = -0.1 if side == 'l' else 0.1
    base = Vector((0.27, y, 0.6))
    off = CHI_EARS[mode].copy()
    if side == 'r':
        off.y = -off.y
    tip = base + off
    make_part('ear_' + side, cone(base, tip, 0.085, flat=0.45), 'chihuahua_fur', root, M)
    if side == 'l':
        inner = cone(base + Vector((0, -0.022, 0.03)), base.lerp(tip, 0.8) + Vector((0, -0.022, 0)), 0.05, flat=0.45)
        make_part('ear_inner_' + side, inner, 'chihuahua_ear_inner', root, M)


def build_chihuahua(root, pose, t):
    P = dict(CHI_POSE[pose])
    P.update(er=0.08, skin='chihuahua_fur')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc = Vector((-0.05, 0, 0.33))
    make_part('body', ellipsoid(bc, X * 0.30, Y * 0.16, Z * 0.15, seg=24, rows=12), 'chihuahua_sweater', root, M)
    for i, x in enumerate((-0.2, -0.02, 0.14)):
        phi = math.acos(x / 0.30)
        make_part('stripe_%d' % i, ellipsoid(bc, Y * 0.165, Z * 0.155, X * 0.305, seg=24, rows=3, phi0=phi - 0.12, phi1=phi + 0.12),
                  'chihuahua_stripe', root, M)
    make_part('collar', tube([Vector((0.15, 0, 0.42)), Vector((0.24, 0, 0.47))], 0.11, 0.1, seg=14), 'chihuahua_sweater', root, M)
    hc, hr = CHI_HEAD
    make_part('head', sphere(hc, hr, seg=24, rows=14), 'chihuahua_fur', root, M)
    mc = Vector((0.47, 0, 0.44))
    make_part('muzzle', ellipsoid(mc, X * 0.1, Y * 0.085, Z * 0.07, seg=16, rows=10), 'chihuahua_fur', root, M)
    make_part('nose', ellipsoid(Vector((0.555, 0, 0.47)), X * 0.03, Y * 0.035, Z * 0.028, seg=10, rows=6), 'chihuahua_nose', root, M)
    for side in ('l', 'r'):
        chi_ear(side, P['ears'], root, M)
    for side, az in (('r', -0.42), ('l', -1.2)):
        p, n = sphere_point(hc, hr, az, 0.22)
        eye_one('chihuahua', side, p - n * 0.02, n, root, M, P)
        if P.get('angry'):
            brow('chihuahua', side, p - n * 0.02, n, root, M, P['er'])
    msurf = ellipsoid_surf(mc, 0.1, 0.085, 0.07)
    style = P['mouth']
    if style == 'open':
        make_part('mouth', mouth_bm(msurf, 'open', 0.43, math.radians(-15), math.radians(-70), scale=0.9), 'chihuahua_mouth', root, M)
        tongue = ellipsoid(Vector((0.53, -0.04, 0.38)), X * 0.035, Y * 0.03, Z * 0.045, seg=10, rows=6)
        make_part('tongue', tongue, 'chihuahua_tongue', root, M)
    elif style == 'o':
        make_part('mouth', mouth_bm(msurf, 'o', 0.42, math.radians(-15), math.radians(-70), scale=0.8), 'chihuahua_mouth', root, M)
    else:
        make_part('mouth', mouth_bm(msurf, style, 0.415, math.radians(-10), math.radians(-95), scale=0.7), 'chihuahua_mouth', root, M)
    # tail (wags while walking)
    wag = 30 * math.sin(2 * TAU * t) if pose == 'walk' else (0 if pose not in ('ko', 'flat') else -40)
    tail = tube([Vector((-0.33, 0, 0.36)), Vector((-0.42, 0, 0.44)), Vector((-0.45, 0, 0.58))], 0.03, 0.015, seg=8)
    make_part('tail', xf(tail, about((-0.33, 0, 0.36), rot_x(wag) if pose != 'ko' else rot_y(-50))), 'chihuahua_fur', root, M)
    hips = {'fl': Vector((0.13, -0.09, 0.3)), 'fr': Vector((0.13, 0.09, 0.3)),
            'bl': Vector((-0.23, -0.09, 0.3)), 'br': Vector((-0.23, 0.09, 0.3))}
    quad_legs('chihuahua', root, M, P, t, hips, 0.035, 0.035, (0.055, 0.04, 0.03), 'chihuahua_fur', A=0.09, H=0.05)


# ================================================================ ARMADILLO
ARM_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0, lid=0.15, mouth='smile', feet='walk'),
    'curl': dict(sx=1.00, sz=1.00, lean=18, lid=0.75, mouth='small', feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0, lid=1.0, mouth=None, feet=None),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.00, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=1.0, mouth='o', feet='limp'),
}


def arm_band_patch(c, rx, ry, rz, x0, half=0.022, th0=-0.25, th1=math.pi + 0.25, thick=0.012):
    """A dark band around the shell (constant-x ring, upper half only) as a thin solid patch."""
    phi_c = math.acos(max(-1.0, min(1.0, x0 / rx)))
    dphi = half / (rx * max(0.2, math.sin(phi_c)))
    outer, inner = [], []
    for i in range(3):
        phi = phi_c - dphi + 2 * dphi * i / 2
        ro, ri = [], []
        for j in range(17):
            th = th0 + (th1 - th0) * j / 16
            p = c + Vector((rx * math.cos(phi), ry * math.sin(phi) * math.cos(th), rz * math.sin(phi) * math.sin(th)))
            n = Vector(((p.x - c.x) / rx ** 2, (p.y - c.y) / ry ** 2, (p.z - c.z) / rz ** 2)).normalized()
            ro.append(p + n * thick)
            ri.append(p - n * thick)
        outer.append(ro)
        inner.append(ri)
    return solid_patch(outer, inner)


def build_armadillo(root, pose, t):
    P = dict(ARM_POSE[pose])
    P.update(er=0.07, skin='armadillo_skin')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.01 * (1 + math.sin(2 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'roll':
        c, r = Vector((0, 0, 0.32)), 0.32
        MR = about(c, rot_y(360 * t))
        make_part('shell', sphere(c, r, seg=28, rows=16), 'armadillo_shell', root, MR)
        for i, x0 in enumerate((-0.19, -0.065, 0.065, 0.19)):
            make_part('band_%d' % i, arm_band_patch(c, r, r, r, x0, half=0.016, th0=0.0, th1=TAU, thick=0.007), 'armadillo_band', root, MR, subsurf=1)
        make_part('belly', ellipsoid(c, X * r * 0.95, Y * r * 0.9, -Z * r * 1.012, seg=20, rows=6, phi1=math.radians(70)),
                  'armadillo_skin', root, MR)
        make_part('head', ellipsoid(c + Vector((0.22, 0, -0.16)), X * 0.15, Y * 0.1, Z * 0.11, seg=14, rows=8), 'armadillo_skin', root, MR)
        make_part('nose', sphere(c + Vector((0.36, 0, -0.14)), 0.03, seg=10, rows=6), 'armadillo_nose', root, MR)
        tail = tube([c + Vector((-0.2, 0, -0.2)), c + Vector((-0.05, 0, -0.28)), c + Vector((0.1, 0, -0.27))], 0.035, 0.012, seg=8)
        make_part('tail', tail, 'armadillo_skin', root, MR)
        return
    curl = pose == 'curl'
    if curl:
        sc, rx, ry, rz, phi1 = Vector((0, 0, 0.3)), 0.4, 0.3, 0.38, math.radians(125)
    else:
        sc, rx, ry, rz, phi1 = Vector((0, 0, 0.23)), 0.45, 0.3, 0.41, math.radians(100)
    make_part('shell', ellipsoid(sc, X * rx, Y * ry, Z * rz, seg=28, rows=14, phi1=phi1), 'armadillo_shell', root, M)
    for i, u in enumerate((-0.45, -0.15, 0.15, 0.45)):
        make_part('band_%d' % i, arm_band_patch(sc, rx, ry, rz, u * rx, half=0.014, thick=0.007,
                                                th0=-0.35 if curl else -0.2, th1=math.pi + (0.35 if curl else 0.2)),
                  'armadillo_band', root, M, subsurf=1)
    if curl:
        make_part('belly', ellipsoid(Vector((0.0, 0, 0.2)), X * 0.3, Y * 0.24, Z * 0.14, seg=20, rows=10), 'armadillo_skin', root, M)
        hc = Vector((0.3, 0, 0.17))
        MHd = about(hc, rot_y(-35))
        hbm = ellipsoid(hc, X * 0.2, Y * 0.12, Z * 0.1, seg=18, rows=10)
        make_part('head', xf(hbm, MHd), 'armadillo_skin', root, M)
        hsurf = ellipsoid_surf(hc, 0.2, 0.12, 0.1)
        for side, az in (('r', -0.5), ('l', -1.15)):
            p, n = hsurf(0.21, az)
            p, n = (MHd @ p), (MHd.to_3x3() @ n)
            eye_one('armadillo', side, p - n * 0.012, n, root, M, P)
        make_part('nose', xf(sphere((0.5, 0, 0.17), 0.03, seg=10, rows=6), MHd), 'armadillo_nose', root, M)
        tail = tube([Vector((-0.3, 0, 0.14)), Vector((-0.22, 0, 0.05)), Vector((-0.05, 0, 0.035))], 0.045, 0.015, seg=8)
        make_part('tail', tail, 'armadillo_skin', root, M)
        hips = {'fl': Vector((0.14, -0.12, 0.18)), 'fr': Vector((0.14, 0.12, 0.18)),
                'bl': Vector((-0.16, -0.12, 0.18)), 'br': Vector((-0.16, 0.12, 0.18))}
        quad_legs('armadillo', root, M, P, t, hips, 0.035, 0.04, (0.055, 0.045, 0.032), 'armadillo_skin')
        return
    make_part('belly', ellipsoid(Vector((0.02, 0, 0.21)), X * 0.4, Y * 0.26, Z * 0.13, seg=24, rows=10), 'armadillo_skin', root, M)
    hc = Vector((0.52, 0, 0.32))
    MHd = about(hc, rot_y(8))
    make_part('head', xf(ellipsoid(hc, X * 0.24, Y * 0.13, Z * 0.12, seg=20, rows=12), MHd), 'armadillo_skin', root, M)
    make_part('head_plate', xf(ellipsoid(Vector((0.47, 0, 0.37)), X * 0.15, Y * 0.115, Z * 0.08, seg=16, rows=8, phi1=math.radians(80)), MHd),
              'armadillo_shell', root, M)
    for side, y in (('l', -0.085), ('r', 0.085)):
        ear = ellipsoid(Vector((0.42, y, 0.47)), X * 0.035, Y * 0.028, Z * 0.08, seg=10, rows=6)
        make_part('ear_' + side, xf(ear, about((0.42, y, 0.4), rot_y(-25))), 'armadillo_skin', root, M)
    hsurf = ellipsoid_surf(hc, 0.24, 0.13, 0.12)
    for side, az in (('r', -0.5), ('l', -1.15)):
        p, n = hsurf(0.37, az)
        p, n = (MHd @ p), (MHd.to_3x3() @ n)
        eye_one('armadillo', side, p - n * 0.012, n, root, M, P)
    make_part('nose', ellipsoid(Vector((0.755, 0, 0.33)), X * 0.035, Y * 0.04, Z * 0.035, seg=10, rows=6), 'armadillo_nose', root, M)
    mp = [(0.64, -0.115, 0.27), (0.69, -0.095, 0.262), (0.73, -0.06, 0.268), (0.75, -0.02, 0.28)]
    if P['mouth'] == 'o':
        make_part('mouth', ellipsoid(Vector((0.72, -0.07, 0.27)), X * 0.03, Y * 0.03, Z * 0.03, seg=10, rows=6), 'armadillo_mouth', root, M)
    else:
        make_part('mouth', line_mouth(mp, P['mouth'], r=0.011), 'armadillo_mouth', root, M)
    tail = tube([Vector((-0.42, 0, 0.22)), Vector((-0.6, 0, 0.17)), Vector((-0.76, 0, 0.1))], 0.05, 0.015, seg=8)
    make_part('tail', tail, 'armadillo_skin', root, M)
    hips = {'fl': Vector((0.24, -0.13, 0.2)), 'fr': Vector((0.24, 0.13, 0.2)),
            'bl': Vector((-0.22, -0.13, 0.2)), 'br': Vector((-0.22, 0.13, 0.2))}
    quad_legs('armadillo', root, M, P, t, hips, 0.035, 0.045, (0.06, 0.045, 0.035), 'armadillo_skin', A=0.09, H=0.05)


# ================================================================ SALSA
SALSA_BOWL = [(0, 0.72), (0.22, 0.74), (0.3, 0.88), (0.33, 0.98), (0.37, 0.98), (0.37, 0.92), (0.33, 0.72),
              (0.27, 0.5), (0.2, 0.33), (0.1, 0.28), (0, 0.27)]
SALSA_OUTER = [(0.37, 0.98), (0.37, 0.92), (0.33, 0.72), (0.27, 0.5), (0.2, 0.33), (0.1, 0.28), (0, 0.27)]
SALSA_HEAP = (0.33, 0.33, 0.24)       # the heaped salsa dome radii (its centre is the rim level)
SALSA_POSE = {
    'idle':  dict(sx=1.00, sz=1.00, lean=2, lid=0.15, mouth='grin'),
    'throw': dict(sx=1.00, sz=1.00, lean=0, lid=0.0, mouth='open'),
    'stun':  dict(sx=1.03, sz=0.95, lean=-6, lid=0.5, mouth='wobble', dazed=True),
    'flat':  dict(sx=1.30, sz=0.35, lean=0, lid=1.0, mouth='flat'),
    'ko':    dict(sx=1.00, sz=0.95, lean=-10, lid=1.0, mouth='o'),
}


def build_salsa(root, pose, t):
    P = dict(SALSA_POSE[pose])
    P.update(er=0.095, skin='salsa_bowl')
    sx, sz, lean = P['sx'], P['sz'], P['lean']
    jiggle, scoop, blob_u = 0.0, 0.0, None
    if pose == 'idle':
        b = math.sin(TAU * t)
        sz *= 1 + 0.03 * b
        sx *= 1 - 0.015 * b
        jiggle = 0.12 * math.sin(TAU * t + 1.0)
    elif pose == 'throw':
        if t < 0.4:
            lean = -8 - 20 * smooth01(t / 0.4)
            P['eye'] = 1.1
        elif t < 0.6:
            lean = lerp(-28, 24, smooth01((t - 0.4) / 0.2))
        else:
            lean = lerp(24, 8, smooth01((t - 0.6) / 0.4))
        if t >= 0.45:
            blob_u = (t - 0.45) / 0.55
            scoop = 0.4
        jiggle = 0.15 * (1 - scoop) * math.sin(TAU * t * 2)
    M = rot_y(lean) @ diag(sx, sx, sz)
    make_part('bowl', lathe(SALSA_BOWL, seg=28), 'salsa_bowl', root, M)
    for az in (math.radians(-90), math.radians(30), math.radians(150)):
        d = Vector((math.cos(az), math.sin(az), 0))
        leg = tube([d * 0.15 + Z * 0.33, d * 0.19 + Z * 0.18, d * 0.22 + Z * 0.03], 0.085, 0.07, seg=12)
        make_part('leg_%d' % int(math.degrees(az)), leg, 'salsa_bowl_dark', root, M)
    sc = Vector((0, 0, 0.9))
    hx, hy, hz = SALSA_HEAP
    hz = hz * (1 + 0.6 * jiggle) * (1 - 0.35 * scoop)
    dome = ellipsoid(sc, X * hx, Y * hy, Z * hz, seg=24, rows=8, phi1=math.radians(95))
    make_part('salsa', dome, 'salsa_salsa', root, M)
    chunks, herbs = [], []
    for k, (az, el) in enumerate(((-1.3, 0.75), (-0.4, 1.0), (0.7, 0.6), (2.2, 0.9), (-2.4, 0.7), (-1.0, 0.25), (-2.0, 0.35))):
        n = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
        p = sc + Vector((hx * n.x, hy * n.y, hz * n.z))
        chunks.append(sphere(p, 0.05, seg=10, rows=6))
    for k, (az, el) in enumerate(((-0.9, 1.3), (-2.0, 1.05), (1.4, 1.15), (-1.5, 0.5))):
        n = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
        p = sc + Vector((hx * n.x, hy * n.y, hz * n.z))
        herbs.append(ellipsoid(p, X * 0.05, Y * 0.035, Z * 0.022, seg=10, rows=5))
    make_part('chunks', join(chunks), 'salsa_chunk', root, M, subsurf=1)
    make_part('herbs', join(herbs), 'salsa_herb', root, M, subsurf=1)
    surf = lathe_surf(SALSA_OUTER)
    for side, az in (('r', -0.3), ('l', -1.25)):
        p, n = surf(0.7, az)
        eye_one('salsa', side, p - n * 0.012, n, root, M, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.52, math.radians(10), math.radians(-105)), 'salsa_mouth', root, M)
    if blob_u is not None:
        u = blob_u
        bc = Vector((0.32 + 0.48 * u, 0, 1.05 + 0.4 * u - 0.32 * u * u))
        rb = 0.14 + 0.02 * math.sin(math.pi * u)
        make_part('blob', ellipsoid(bc, X * rb * (1 + 0.3 * u), Y * rb, Z * rb, seg=16, rows=10), 'salsa_salsa', root, None)
        make_part('blob_hl', sphere(bc + Vector((-0.04, -0.09, 0.05)), 0.045, seg=10, rows=6), 'salsa_chunk', root, None)
        make_part('blob_drip', sphere(bc + Vector((-rb * 1.2 * (1 + 0.3 * u), 0, -0.04)), 0.05, seg=10, rows=6), 'salsa_salsa', root, None)


# ================================================================ XOLO
XOLO_POSE = {
    'idle': dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='smile', feet='stand'),
    'wave': dict(sx=0.98, sz=1.02, lean=-8, lid=0.0, eye=1.1, mouth='open', feet='stand'),
}


def xolo_taco(cx, tilt):
    """One taco standing on its fold on the tray; returns bmeshes for shell, lettuce, meat, tomato."""
    R, W = 0.13, 0.055
    c = Vector((cx, 0, 0.765 + R))
    outer, inner = [], []
    for y in (-W, 0.0, W):
        ro, ri = [], []
        for j in range(13):
            a = math.pi + math.pi * j / 12
            ro.append(c + Vector((R * math.cos(a), y, R * math.sin(a))))
            ri.append(c + Vector(((R - 0.03) * math.cos(a), y, (R - 0.03) * math.sin(a))))
        outer.append(ro)
        inner.append(ri)
    shell = solid_patch(outer, inner)
    lettuce = join([ellipsoid(c + Vector((x, 0, 0.01)), X * 0.04, Y * 0.045, Z * 0.035, seg=10, rows=6) for x in (-0.08, -0.02, 0.05)])
    meat = superellipsoid(c + Vector((0, 0, -0.025)), 0.1, 0.04, 0.02, 0.4, seg=12, rows=6)
    tomato = join([sphere(c + Vector((x, -0.02, 0.03)), 0.028, seg=8, rows=5) for x in (-0.05, 0.03)])
    MT = about(c - Z * R, rot_y(tilt))
    return [xf(b, MT) for b in (shell, lettuce, meat, tomato)]


def build_xolo(root, pose, t):
    P = dict(XOLO_POSE[pose])
    P.update(er=0.075, skin='xolo_skin')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'idle':
        b = math.sin(TAU * t)
        sz *= 1 + 0.02 * b
        bob = 0.0
    elif pose == 'wave':
        bob = 0.01 * (1 + math.sin(TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc = Vector((-0.02, 0, 0.52))
    make_part('body', ellipsoid(bc, X * 0.44, Y * 0.19, Z * 0.2, seg=28, rows=14), 'xolo_skin', root, M)
    phi = math.acos(-0.05 / 0.44)
    make_part('strap', ellipsoid(bc, Y * 0.197, Z * 0.207, X * 0.44, seg=24, rows=3, phi0=phi - 0.09, phi1=phi + 0.09), 'xolo_collar', root, M)
    make_part('neck', tube([Vector((0.2, 0, 0.62)), Vector((0.4, 0, 0.8))], 0.1, 0.1, seg=14), 'xolo_skin', root, M)
    make_part('collar', tube([Vector((0.26, 0, 0.69)), Vector((0.31, 0, 0.735))], 0.125, 0.125, seg=16), 'xolo_collar', root, M)
    hc = Vector((0.45, 0, 0.88))
    make_part('head', ellipsoid(hc, X * 0.22, Y * 0.18, Z * 0.19, seg=24, rows=14), 'xolo_skin', root, M)
    mc = Vector((0.63, 0, 0.82))
    make_part('muzzle', ellipsoid(mc, X * 0.12, Y * 0.09, Z * 0.08, seg=16, rows=10), 'xolo_skin', root, M)
    make_part('nose', ellipsoid(Vector((0.735, 0, 0.85)), X * 0.035, Y * 0.04, Z * 0.032, seg=10, rows=6), 'xolo_nose', root, M)
    for side, y in (('l', -0.1), ('r', 0.1)):
        base = Vector((0.4 if side == 'l' else 0.46, y, 1.0))
        tip = base + Vector((-0.07, y * 0.5, 0.2))
        make_part('ear_' + side, cone(base, tip, 0.09, flat=0.5), 'xolo_skin', root, M)
        if side == 'l':
            make_part('ear_inner_' + side, cone(base + Vector((0, -0.025, 0.03)), base.lerp(tip, 0.78) + Vector((0, -0.025, 0)), 0.05, flat=0.5),
                      'xolo_ear_inner', root, M)
    tuft = []
    for k, x in enumerate((0.3, 0.37, 0.44, 0.51)):
        zt = hc.z + 0.19 * math.sqrt(max(0.0, 1 - ((x - hc.x) / 0.22) ** 2)) - 0.02
        tuft.append(cone(Vector((x, 0, zt)), Vector((x - 0.07, 0, zt + 0.16 - 0.02 * abs(k - 1.5))), 0.045, flat=0.5))
    make_part('tuft', join(tuft), 'xolo_tuft', root, M)
    for side, az in (('r', -0.42), ('l', -1.15)):
        p, n = sphere_point(hc, 1.0, az, 0.22)
        p = hc + Vector((n.x * 0.22, n.y * 0.18, n.z * 0.19))
        eye_one('xolo', side, p - n * 0.02, n, root, M, P)
    msurf = ellipsoid_surf(mc, 0.12, 0.09, 0.08)
    if P['mouth'] == 'open':
        make_part('mouth', mouth_bm(msurf, 'open', 0.8, math.radians(-15), math.radians(-70), scale=1.0), 'xolo_mouth', root, M)
        tongue = ellipsoid(Vector((0.7, -0.045, 0.74)), X * 0.04, Y * 0.035, Z * 0.05, seg=10, rows=6)
    else:
        make_part('mouth', mouth_bm(msurf, 'smile', 0.79, math.radians(-10), math.radians(-95), scale=0.8), 'xolo_mouth', root, M)
        tongue = ellipsoid(Vector((0.67, -0.06, 0.765)), X * 0.035, Y * 0.03, Z * 0.04, seg=10, rows=6)
    make_part('tongue', tongue, 'xolo_tongue', root, M)
    # tail wag
    wag_x = 35 * math.sin(TAU * t * (2 if pose == 'wave' else 1))
    wag_y = 12 * math.sin(TAU * t * (2 if pose == 'wave' else 1))
    tail = tube([Vector((-0.44, 0, 0.6)), Vector((-0.55, 0, 0.75)), Vector((-0.56, 0, 0.95))], 0.04, 0.02, seg=8)
    make_part('tail', xf(tail, about((-0.44, 0, 0.6), rot_x(wag_x) @ rot_y(wag_y))), 'xolo_skin', root, M)
    # the taco tray on its back
    make_part('tray', superellipsoid(Vector((-0.08, 0, 0.745)), 0.34, 0.2, 0.022, 0.3, seg=24, rows=6), 'xolo_tray', root, M)
    parts = [[], [], [], []]
    for cx, tilt in ((-0.3, 6), (-0.08, -4), (0.14, 8)):
        for i, b in enumerate(xolo_taco(cx, tilt)):
            parts[i].append(b)
    for i, (name, mat) in enumerate((('taco_shell', 'xolo_taco_shell'), ('taco_lettuce', 'xolo_lettuce'),
                                     ('taco_meat', 'xolo_meat'), ('taco_tomato', 'xolo_tomato'))):
        make_part(name, join(parts[i]), mat, root, M, subsurf=1)
    hips = {'fl': Vector((0.25, -0.1, 0.42)), 'fr': Vector((0.25, 0.1, 0.42)),
            'bl': Vector((-0.28, -0.1, 0.42)), 'br': Vector((-0.28, 0.1, 0.42))}
    raised = None
    if pose == 'wave':
        a = math.radians(55 + 20 * math.sin(TAU * t))
        paw = Vector((0.25 + 0.3 * math.cos(a), -0.12, 0.42 + 0.3 * math.sin(a) + 0.1))
        raised = ('fl', paw)
    quad_legs('xolo', root, M, P, t, hips, 0.04, 0.045, (0.07, 0.05, 0.04), 'xolo_skin', raised=raised)


# ================================================================ public API
BUILDERS = {'elote': build_elote, 'burro': build_burro, 'chihuahua': build_chihuahua,
            'armadillo': build_armadillo, 'salsa': build_salsa, 'xolo': build_xolo}


def build(kind, pose='idle', t=0.0):
    """Build one character in a pose (fresh geometry; any previous build of that kind is removed first)."""
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
    sheet[..., :3] = sheet[..., :3] + (1 - alpha) * 0.35     # mid-grey backdrop so the transparent film reads
    sheet[..., 3] = 1.0
    res = bpy.data.images.new('sheet', cell * n, cell, alpha=True)
    res.pixels[:] = sheet.ravel().tolist()
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
    import sys
    only = [a for a in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else []
    os.makedirs(SCRATCH, exist_ok=True)
    setup_preview_scene()
    for kind in KINDS:
        if only and kind not in only:
            continue
        outs = []
        for pose in POSES[kind]:
            for t in ([0.0, 0.5] if pose in CYCLES[kind] else [0.0]):
                root, path = render_pose(kind, pose, t, '' if t == 0.0 else '_t50')
                x0, x1, z0, z1 = bounds(root)
                print('%-9s %-10s t=%.1f  tris %5d  subdivided %6d  x %.2f..%.2f  z %.2f..%.2f  %s' % (
                    kind, pose, t, triangle_count(root), triangle_count(root, True), x0, x1, z0, z1, path))
                outs.append(path)
        clear(kind)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
