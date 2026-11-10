# ma_enemies: the Morocco cast of Super Brady-O World (world 5) for the pre-rendered Fiesta Toon sprite pipeline.
# All original cartoon designs.  Same conventions as mx_pepper.py / mx_enemies_a.py / mx_enemies_b.py:
#   Z up, every character FACES +X (screen-right), the sprite camera looks along +Y from -Y.  1 m = 28.1 px.
#   Feet-origin kinds stand with their feet on z = 0; centre-origin kinds (the leaper and the items) are centred on
#   the origin.  Plain Principled materials (Base Color only, roughness 0.5) named <kind>_<part>; materials whose
#   name contains 'glow' render unlit in the toon look.  Every object is parented to one Empty named after the kind
#   and carries obj['sprite_part'].  Subdivision modifiers on the smooth parts.
#
#   tagine   a terracotta tagine: wide dish, tall conical lid with a teal zellige collar and a yellow knob; the lid
#            lifts off in a puff of steam when it hops                 walk(t) hop stun flat ko            feet, 30 px
#   teapot   a silver Moroccan teapot on a pedestal with little feet: bulbous body, etched bands, long curved spout,
#            domed lid; it tips forward to pour tea                   walk(t) idle(t) throw(t) stun flat ko feet, 30 px
#   cobra    an olive basket cobra, coiled, hood flared and turned three-quarter to the camera, cream hood spots,
#            red forked tongue                                        up(t) down(t) ko                   centre, 30 px
#   scarab   a navy scarab beetle with a sky-blue wing-case seam and glint, clubbed antennae, six legs; it tucks
#            into a ball and rolls                                    walk(t) curl roll(t) stun flat ko   feet, 18 px
#   fennec   a sand fennec fox with enormous pink-lined ears, cream chest, dark-tipped brush tail; hops
#                                                                     walk(t) hop stun flat ko            feet, 20 px
#   goat     a cream Atlas tree goat with curved grey horns, floppy ears, a goatee and an argan sprig in its mouth;
#            lowers its head to charge                                walk(t) notice charge stun flat ko  feet, 26 px
#   orange   a juice-cart orange with a leaf, a shine and little feet; tucks them in and rolls
#                                                                     walk(t) curl roll(t) stun flat ko   feet, 20 px
#   snail    a soup snail: tan body, periscope eye stalks, brown spiral shell; after the first hit the shell is
#            cracked and chipped and it hurries on, sweating           walk(t) hurt_walk(t) stun flat ko   feet, 20 px
#   coin     the DATE: a glossy brown oblong date with a cap and a wrinkle   spin(t: about Z)             centre, 16 px
#   star     the GOLDEN LANTERN: a six-sided gold lantern, amber glass panels lit from inside, handle ring, sparkles
#                                                                     idle(t: hover)                      centre, 24 px
#   qblock   the item block: a blue zellige cube with a gold eight-point star rosette ringed by cream and teal
#            diamonds on every face                                   idle(t: wobble)                     centre, 32 px
#   used     the same block spent: grey tiles, dull rosette           idle                                centre, 32 px
#
# API:  build(kind, pose, t=0.0) -> root Empty named kind (fresh geometry; any previous build of that kind removed)
#       clear(kind=None) -> removes one kind's hierarchy, or every kind's
#       KINDS, POSES[kind], CYCLES, HEIGHT[kind] (feet kinds), SIZE[kind] (every kind: the renderer frames by it),
#       ORIGIN[kind]
# Headless preview of everything (previews + contact sheets at 256 and 48 px into SCRATCH):
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ma_enemies.py [-- kind ...]
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
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/maen'

KINDS = ['tagine', 'teapot', 'cobra', 'scarab', 'fennec', 'goat', 'orange', 'snail', 'coin', 'star', 'qblock', 'used']
POSES = {
    'tagine': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'teapot': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'cobra': ['up', 'down', 'ko'],
    'scarab': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'fennec': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'goat': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],
    'orange': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'snail': ['walk', 'hurt_walk', 'stun', 'flat', 'ko'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
# (kind, pose) pairs whose t is a 0..1 cycle phase
CYCLES = {('tagine', 'walk'), ('teapot', 'walk'), ('teapot', 'idle'), ('teapot', 'throw'), ('cobra', 'up'),
          ('cobra', 'down'), ('scarab', 'walk'), ('scarab', 'roll'), ('fennec', 'walk'), ('goat', 'walk'),
          ('orange', 'walk'), ('orange', 'roll'), ('snail', 'walk'), ('snail', 'hurt_walk'), ('coin', 'spin'),
          ('star', 'idle'), ('qblock', 'idle')}
ORIGIN = {'tagine': 'feet', 'teapot': 'feet', 'cobra': 'centre', 'scarab': 'feet', 'fennec': 'feet', 'goat': 'feet',
          'orange': 'feet', 'snail': 'feet', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'}
# nominal standing height of the feet-origin kinds (hitbox height / 28.1)
HEIGHT = {'tagine': 30 / PX, 'teapot': 30 / PX, 'scarab': 18 / PX, 'fennec': 20 / PX, 'goat': 26 / PX,
          'orange': 20 / PX, 'snail': 20 / PX}
# nominal size of the centre-origin kinds; render_country.py frames EVERY kind by SIZE when it exists, so it also
# repeats the feet heights
SIZE = dict(HEIGHT)
SIZE.update({'cobra': 30 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX})

COLORS = {
    'tagine_dish': '#a84e26', 'tagine_rim': '#c0623a', 'tagine_lid': '#d8743a', 'tagine_band': '#1a9a8a',
    'tagine_band2': '#f4ecd8', 'tagine_knob': '#e8b81a', 'tagine_steamglow': '#ffffff', 'tagine_feet': '#7a3418',
    'tagine_eye_white': '#fbfbf2', 'tagine_pupil': '#1a1020', 'tagine_mouth': '#4a1a10',
    'teapot_silver': '#d8d8e0', 'teapot_silver2': '#b8b8c4', 'teapot_etch': '#8a8a98', 'teapot_finial': '#ffd24a',
    'teapot_tea': '#a86a2a', 'teapot_feet': '#8a8a98', 'teapot_eye_white': '#fbfbf2', 'teapot_pupil': '#1a1020',
    'teapot_mouth': '#3a2a3a',
    'cobra_skin': '#6a8a4a', 'cobra_hood': '#4e7034', 'cobra_belly': '#e8d870', 'cobra_mark': '#f4e8a0',
    'cobra_tongue': '#e8322a', 'cobra_eye_white': '#fbfbf2', 'cobra_pupil': '#1a1020', 'cobra_mouth': '#3a2a1a',
    'scarab_shell': '#1a3a5a', 'scarab_elytra': '#244e7a', 'scarab_line': '#3a8ab8', 'scarab_glint': '#9ad8ff',
    'scarab_leg': '#122a44', 'scarab_eye_white': '#fbfbf2', 'scarab_pupil': '#1a1020', 'scarab_mouth': '#0e1e30',
    'fennec_fur': '#f0d8a8', 'fennec_cream': '#fff4e0', 'fennec_ear': '#ffb8a8', 'fennec_nose': '#1a1020',
    'fennec_tip': '#5a3a2a', 'fennec_paw': '#d8b888', 'fennec_eye_white': '#fbfbf2', 'fennec_pupil': '#1a1020',
    'fennec_mouth': '#5a2a2a',
    'goat_coat': '#f4f0e8', 'goat_muzzle': '#e8e0d0', 'goat_nose': '#3a2a28', 'goat_beard': '#d8d0c0',
    'goat_horn': '#8a7a6a', 'goat_hoof': '#3a2a20', 'goat_twig': '#6a5a3a', 'goat_leaf': '#4a8a3a',
    'goat_fruit': '#c8c84a', 'goat_ear': '#e8b8a8', 'goat_eye_white': '#fbfbf2', 'goat_pupil': '#1a1020',
    'goat_mouth': '#3a1a1a',
    'orange_peel': '#ff8a1a', 'orange_shine': '#ffc46a', 'orange_stem': '#6a8a3a', 'orange_leaf': '#3a8a3a',
    'orange_feet': '#c86a10', 'orange_eye_white': '#fbfbf2', 'orange_pupil': '#1a1020', 'orange_mouth': '#5a1a10',
    'snail_body': '#c8b898', 'snail_shell': '#8a5a3a', 'snail_shell_hi': '#a87a52', 'snail_spiral': '#5a3a1a',
    'snail_crack': '#2e1a0c', 'snail_sweatglow': '#c8f0ff', 'snail_eye_white': '#fbfbf2', 'snail_pupil': '#1a1020',
    'snail_mouth': '#6a4a3a',
    'coin_date': '#9a5228', 'coin_crease': '#5a2a14', 'coin_shine': '#e0a878', 'coin_cap': '#c8a060',
    'star_gold': '#ffd24a', 'star_gold_dark': '#e8a820', 'star_glassglow': '#ffc85a', 'star_glow': '#fff6c0',
    'qblock_tile': '#1a6ab8', 'qblock_cream': '#f4ecd8', 'qblock_teal': '#1a9a8a', 'qblock_gold': '#c8a03a',
    'qblock_navy': '#2a3a6a',
    'used_tile': '#8a8a90', 'used_dull': '#66666e', 'used_dull2': '#78787f',
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


# ================================================================ TAGINE
TAGINE_DISH = [(0, 0.08), (0.34, 0.08), (0.43, 0.14), (0.47, 0.24), (0.47, 0.31), (0, 0.31)]
TAGINE_LID = [(0.45, 0.0), (0.43, 0.05), (0.33, 0.26), (0.2, 0.48), (0.09, 0.64), (0.0, 0.72)]     # relative to the seat
TAGINE_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0,   lid=0.15, mouth='grin',   feet='walk',  lift=0.0,  tilt=0),
    'hop':  dict(sx=0.95, sz=1.08, lean=6,   lid=0.05, mouth='grin',   feet='tuck',  lift=0.2,  tilt=-6, eye=1.1),
    'stun': dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', lift=0.05, tilt=-14, dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat',  lift=0.0,  tilt=0),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',  lift=0.08, tilt=22, x=True),
}


def build_tagine(root, pose, t):
    P = dict(TAGINE_POSE[pose])
    P.update(er=0.085, skin='tagine_lid')
    sx, sz, lean, bob, tilt = P['sx'], P['sz'], P['lean'], 0.0, P['tilt']
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        tilt += 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    make_part('dish', lathe(TAGINE_DISH, seg=28), 'tagine_dish', root, M)
    make_part('rim', torus((0, 0, 0.31), 0.455, 0.03), 'tagine_rim', root, M)
    seat = 0.31 + P['lift']
    ML = M @ T((0, 0, seat)) @ about((0, 0, 0.06), rot_y(tilt))
    make_part('lid', lathe(TAGINE_LID, seg=28), 'tagine_lid', root, ML)
    make_part('band', torus((0, 0, 0.09), 0.41, 0.032), 'tagine_band', root, ML)
    make_part('band2', torus((0, 0, 0.155), 0.382, 0.016), 'tagine_band2', root, ML)
    make_part('knob', sphere((0, 0, 0.74), 0.07, seg=16, rows=10), 'tagine_knob', root, ML)
    surf = lathe_surf(TAGINE_LID)
    for side, az in (('r', -0.4), ('l', -1.15)):
        p, n = surf(0.40, az)
        eye_one('tagine', side, p - n * 0.012, n, root, ML, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.25, math.radians(8), math.radians(-100), scale=1.1), 'tagine_mouth', root, ML)
    if P['lift'] > 0.1:
        # steam escaping the gap, on the camera side
        for k, (x, r) in enumerate(((-0.2, 0.07), (0.05, 0.095), (0.28, 0.065))):
            c = V(x, -0.3, 0.31 + P['lift'] * (0.4 + 0.25 * (k == 1)))
            make_part('steam%d' % k, sphere(c, r, seg=12, rows=8), 'tagine_steamglow', root, M)
    biped_legs('tagine', root, M, P, t, (-0.02, 0.12, 0.12), (0.11, 0.07, 0.045), 0.04, 'tagine_feet')


# ================================================================ TEAPOT
TEAPOT_BODY = [(0, 0.16), (0.2, 0.16), (0.31, 0.23), (0.36, 0.39), (0.33, 0.54), (0.25, 0.64), (0.2, 0.7), (0.24, 0.75), (0.25, 0.79), (0, 0.79)]
TEAPOT_LID = [(0.25, 0.79), (0.2, 0.82), (0.12, 0.94), (0.05, 1.04), (0, 1.06)]
TEAPOT_FOOT = [(0, 0.09), (0.17, 0.09), (0.21, 0.11), (0.2, 0.17), (0, 0.17)]
TEAPOT_POSE = {
    'walk':  dict(sx=1.00, sz=1.00, lean=3,   lid=0.15, mouth='smile',  feet='walk'),
    'idle':  dict(sx=1.00, sz=1.00, lean=0,   lid=0.15, mouth='smile',  feet='stand'),
    'throw': dict(sx=1.00, sz=1.00, lean=0,   lid=0.00, mouth='grin',   feet='stand'),
    'stun':  dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat':  dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':    dict(sx=1.00, sz=0.95, lean=-12, lid=0.00, mouth='o',      feet='limp', x=True),
}


def build_teapot(root, pose, t):
    P = dict(TEAPOT_POSE[pose])
    P.update(er=0.085, skin='teapot_silver')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    tip, lift, drops = 0.0, 0.0, []
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    elif pose == 'idle':
        sz *= 1 + 0.02 * math.sin(TAU * t)
    elif pose == 'throw':
        if t < 0.3:
            tip = 36 * smooth01(t / 0.3)
        elif t < 0.6:
            tip = 36
        else:
            tip = 36 * (1 - smooth01((t - 0.6) / 0.4))
        lift = 0.05 * math.sin(math.pi * min(1.0, t / 0.6)) if t < 0.6 else 0.0
        for off in (0.0, 0.35):
            fu = (t - 0.25) / 0.6 - off
            if 0.0 <= fu <= 1.0:
                drops.append(fu)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    MT = M @ about((0.2, 0, 0.1), rot_y(tip))
    make_part('body', lathe(TEAPOT_BODY, seg=28), 'teapot_silver', root, MT)
    make_part('pedestal', lathe(TEAPOT_FOOT, seg=24), 'teapot_silver2', root, MT)
    make_part('etch', torus((0, 0, 0.39), 0.368, 0.014), 'teapot_etch', root, MT)
    make_part('etch2', torus((0, 0, 0.27), 0.33, 0.012), 'teapot_etch', root, MT)
    make_part('collar', torus((0, 0, 0.7), 0.21, 0.02), 'teapot_silver2', root, MT)
    MLid = MT @ T((0, 0, lift))
    make_part('lid', lathe(TEAPOT_LID, seg=28), 'teapot_silver2', root, MLid)
    make_part('finial', sphere((0, 0, 1.08), 0.05, seg=14, rows=8), 'teapot_finial', root, MLid)
    spout = [V(0.3, 0, 0.36), V(0.46, 0, 0.44), V(0.56, 0, 0.62), V(0.6, 0, 0.84)]
    make_part('spout', tube(spout, 0.08, 0.045, seg=12, radii=[0.085, 0.065, 0.05, 0.048]), 'teapot_silver', root, MT)
    make_part('spout_lip', torus(spout[-1], 0.05, 0.014, axis=(0.15, 0, 1)), 'teapot_silver2', root, MT)
    handle = [V(-0.3, 0, 0.66), V(-0.46, 0, 0.74), V(-0.54, 0, 0.56), V(-0.48, 0, 0.36), V(-0.3, 0, 0.31)]
    make_part('handle', tube(handle, 0.04, seg=10), 'teapot_silver2', root, MT)
    surf = lathe_surf(TEAPOT_BODY)
    for side, az in (('r', -0.4), ('l', -1.15)):
        p, n = surf(0.52, az)
        eye_one('teapot', side, p - n * 0.012, n, root, MT, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.36, math.radians(5), math.radians(-100), scale=1.0), 'teapot_mouth', root, MT)
    tipw = MT @ spout[-1]
    for k, fu in enumerate(drops):
        c = tipw + V(0.08 + 0.55 * fu, -0.02, 0.02 + 0.22 * fu - 0.7 * fu * fu)
        make_part('drop%d' % k, ellipsoid(c, X * 0.045, Y * 0.045, Z * 0.055, seg=12, rows=8), 'teapot_tea', root, None)
    biped_legs('teapot', root, M, P, t, (0.0, 0.1, 0.1), (0.1, 0.06, 0.04), 0.035, 'teapot_feet')


# ================================================================ COBRA (leaper, centre origin)
COBRA_FACE = rot_z(-50)        # the head turns three-quarter toward the camera so the hood reads
COBRA_POSE = {
    'up':   dict(lid=0.08, pitch=-16, rise=1.0,  hood=1.0,  mouth='smile'),
    'down': dict(lid=0.25, pitch=28,  rise=0.85, hood=1.0,  mouth='grin'),
    'ko':   dict(lid=0.00, pitch=85,  rise=0.7,  hood=0.55, mouth='o', x=True),
}


def build_cobra(root, pose, t):
    P = dict(COBRA_POSE[pose])
    P.update(er=0.075, skin='cobra_skin')
    M = T((0, 0, -0.06))
    wig = math.sin(TAU * t)
    N = 26
    cc = V(-0.04, 0, -0.44)
    coil = []
    for k in range(N):
        u = k / (N - 1)
        a = 1.5 * TAU * (1 - u) + 0.3
        rs = 0.28 - 0.06 * u
        coil.append(cc + V(rs * math.cos(a), rs * math.sin(a), 0.12 * u))
    radii = [0.05 + 0.045 * min(1.0, k / 5) for k in range(N)]
    make_part('coil', tube(coil, 0.09, seg=12, radii=radii), 'cobra_skin', root, M)
    end = coil[-1]
    rise = P['rise']
    if pose == 'ko':
        path = [end, V(0.2, 0.02, -0.18), V(0.3, 0, -0.02), V(0.3, 0, 0.1)]
    else:
        sw = 0.03 * wig
        path = [end, V(0.12 + sw, 0.03, -0.2), V(0.0 + sw, 0.0, -0.02), V(-0.06 - sw, 0, 0.14 * rise), V(0.0, 0, 0.28 * rise)]
    make_part('body', tube(path, 0.095, 0.09, seg=12), 'cobra_skin', root, M)
    fd = COBRA_FACE.to_3x3() @ X
    belly = [p + fd * 0.045 for p in path[1:]]
    make_part('belly', tube(belly, 0.06, 0.055, seg=10), 'cobra_belly', root, M)
    neck = path[-1]
    MH = M @ T(neck) @ COBRA_FACE @ rot_y(P['pitch'])
    hood = P['hood']
    make_part('hood', ellipsoid(V(-0.05, 0, 0.12), X * 0.07, Y * 0.3 * hood, Z * 0.28, seg=24, rows=14), 'cobra_hood', root, MH)
    hc, hr = V(0.12, 0, 0.1), (0.19, 0.15, 0.13)
    make_part('head', blob(hc, *hr, seg=24, rows=14), 'cobra_skin', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('mark_' + side, ellipsoid(V(0.02, sgn * 0.17 * hood, 0.03), X * 0.02, Y * 0.07 * hood, Z * 0.1, seg=12, rows=8),
                  'cobra_mark', root, MH)
    surf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', 0.25), ('l', -0.6)):
        p, n = surf(0.17, az)
        eye_one('cobra', side, p - n * 0.012, n, root, MH, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.04, 0.3, -0.75, scale=0.8), 'cobra_mouth', root, MH)
    if pose == 'ko':
        tongue = [V(0.28, 0, 0.03), V(0.36, 0, -0.06), V(0.38, 0, -0.14)]
    else:
        tongue = [V(0.28, 0, 0.03), V(0.4, 0, 0.0)]
    make_part('tongue', tube(tongue, 0.016, seg=6), 'cobra_tongue', root, MH, subsurf=1)
    tip = tongue[-1]
    d = (tongue[-1] - tongue[-2]).normalized()
    for side, sgn in (('l', -1), ('r', 1)):
        fork = [tip, tip + d * 0.08 + Y * sgn * 0.035]
        make_part('fork_' + side, tube(fork, 0.014, 0.008, seg=6), 'cobra_tongue', root, MH, subsurf=1)


# ================================================================ SCARAB
SCARAB_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='walk'),
    'curl': dict(sx=0.92, sz=1.08, lean=12,  lid=0.70, mouth='small',  feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0,   lid=1.00, mouth=None,     feet=None),
    'stun': dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.25, sz=0.40, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-14, lid=0.00, mouth='o',      feet='limp', x=True),
}


def scarab_shell(root, M, bc, radii):
    """The wing cases: navy body, lighter elytra cap, the sky-blue seam down the back and a glint."""
    make_part('body', blob(bc, *radii, seg=26, rows=14), 'scarab_shell', root, M)
    make_part('elytra', ell_cap(bc, radii, (-0.25, 0, 1), 60, seg=24, rows=6), 'scarab_elytra', root, M)
    rx, ry, rz = radii
    seam = []
    for k in range(9):
        x = 0.1 - (0.1 + rx * 0.9) * k / 8
        z = bc.z + rz * math.sqrt(max(0.0, 1 - ((x - bc.x) / rx) ** 2)) + 0.012
        seam.append(V(x, 0, z))
    make_part('seam', tube(seam, 0.016, seg=6), 'scarab_line', root, M, subsurf=1)
    surf = ellipsoid_surf(bc, *radii)
    make_part('glint', oval_patch(surf, bc.z + rz * 0.5, 0.05, -1.75, 0.3), 'scarab_glint', root, M)


def build_scarab(root, pose, t):
    P = dict(SCARAB_POSE[pose])
    P.update(er=0.06, skin='scarab_shell')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.01 * (1 + math.sin(4 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'roll':
        bc, radii = V(0, 0, 0.3), (0.3, 0.25, 0.29)
        MR = about(bc, rot_y(360 * t))
        scarab_shell(root, MR, bc, radii)
        hc, hr = V(0.22, 0, 0.16), (0.11, 0.13, 0.09)
        make_part('head', blob(hc, *hr, seg=18, rows=10), 'scarab_shell', root, MR)
        surf = ellipsoid_surf(hc, *hr)
        for side, az in (('r', -0.35), ('l', -1.1)):
            p, n = surf(0.19, az)
            eye_one('scarab', side, p - n * 0.01, n, root, MR, P)
        for k in range(3):
            for side, sgn in (('l', -1), ('r', 1)):
                a0 = V(0.12 - 0.12 * k, sgn * 0.2, 0.08)
                make_part('leg_%s%d' % (side, k), tube([a0, a0 + V(0.06, sgn * 0.04, 0.04)], 0.022, 0.016, seg=6), 'scarab_leg', root, MR, subsurf=1)
        return
    bc, radii = V(-0.02, 0, 0.3), (0.34, 0.25, 0.23)
    scarab_shell(root, M, bc, radii)
    hc, hr = V(0.36, 0, 0.27), (0.13, 0.15, 0.11)
    make_part('head', blob(hc, *hr, seg=20, rows=12), 'scarab_shell', root, M)
    surf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -0.35), ('l', -1.1)):
        p, n = surf(0.31, az)
        eye_one('scarab', side, p - n * 0.01, n, root, M, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.22, math.radians(-10), math.radians(-80), scale=0.6), 'scarab_mouth', root, M)
    for side, sgn in (('l', -1), ('r', 1)):
        make_part('mandible_' + side, cone(V(0.46, sgn * 0.05, 0.22), V(0.57, sgn * 0.1, 0.19), 0.025), 'scarab_leg', root, M, subsurf=1)
        a0, a1 = V(0.42, sgn * 0.08, 0.34), V(0.5, sgn * 0.17, 0.47)
        make_part('antenna_' + side, tube([a0, a1], 0.014, 0.012, seg=6), 'scarab_leg', root, M, subsurf=1)
        make_part('club_' + side, sphere(a1, 0.03, seg=10, rows=6), 'scarab_leg', root, M, subsurf=1)
    stance = P['feet']
    for k in range(3):
        x = 0.2 - 0.2 * k
        for side, y, ph in (('l', -0.16, 0.0), ('r', 0.16, math.pi)):
            hip = M @ V(x, y, 0.22)
            dx = dz = 0.0
            spread = 0.3
            if stance == 'walk':
                dx, dz = gait(t, ph + TAU * k / 3, 0.07, 0.05)
            elif stance == 'flat':
                dx, spread = 0.12 * (1 - k), 0.36
            elif stance == 'limp':
                dx, dz = 0.05 * (1 - k), 0.03
            elif stance == 'tuck':
                spread, dz = 0.18, 0.1
            foot = V(x + dx, y / 0.16 * spread, 0.025 + dz)
            knee = (hip + foot) / 2 + V(0.03 + dz, y * 0.4, 0.04)
            make_part('leg_%s%d' % (side, k), tube([hip, knee, foot], 0.024, 0.018, seg=8), 'scarab_leg', root, None, subsurf=1)
            make_part('foot_%s%d' % (side, k), sphere(foot, 0.026, seg=8, rows=5), 'scarab_leg', root, None, subsurf=1)


# ================================================================ FENNEC
FENNEC_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0,   lid=0.10, mouth='smile',  feet='walk',  ears='up',    tail='sway'),
    'hop':  dict(sx=1.05, sz=1.00, lean=-8,  lid=0.00, mouth='grin',   feet='tuck',  ears='back',  tail='up', eye=1.1),
    'stun': dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand', ears='droop', tail='droop', dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat',  ears='flat',  tail='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',  ears='droop', tail='droop', x=True),
}
FENNEC_EARS = {'up': (18, -5), 'back': (14, -35), 'droop': (62, -10), 'flat': (20, -85)}    # (spread, back) degrees


def build_fennec(root, pose, t):
    P = dict(FENNEC_POSE[pose])
    P.update(er=0.07, skin='fennec_fur', pupil=1.1)
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.015 * (1 + math.sin(2 * TAU * t))
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc, br = V(-0.06, 0, 0.32), (0.3, 0.18, 0.19)
    make_part('body', blob(bc, *br, seg=24, rows=14), 'fennec_fur', root, M)
    make_part('chest', ell_cap(bc, br, (0.5, 0, -0.9), 50, seg=20, rows=6), 'fennec_cream', root, M)
    hc, hr = V(0.28, 0, 0.46), 0.19
    make_part('head', sphere(hc, hr, seg=24, rows=14), 'fennec_fur', root, M)
    mc, mr = V(0.43, 0, 0.4), (0.1, 0.09, 0.07)
    make_part('muzzle', blob(mc, *mr, seg=16, rows=10), 'fennec_cream', root, M)
    make_part('nose', sphere((0.52, 0, 0.42), 0.035, seg=12, rows=8), 'fennec_nose', root, M)
    msurf = ellipsoid_surf(mc, *mr)
    make_part('mouth', mouth_bm(msurf, P['mouth'], 0.37, math.radians(-15), math.radians(-85), scale=0.6), 'fennec_mouth', root, M)
    spread, back = FENNEC_EARS[P['ears']]
    for side, sgn in (('l', -1), ('r', 1)):
        base = V(0.24, sgn * 0.09, 0.6)
        ME = M @ about(base, rot_y(back) @ rot_x(-sgn * spread))
        ec, er_ = base + V(-0.02, sgn * 0.04, 0.24), (0.1, 0.05, 0.25)
        make_part('ear_' + side, blob(ec, *er_, seg=16, rows=12), 'fennec_fur', root, ME)
        make_part('ear_inner_' + side, ell_cap(ec, er_, (0.8, sgn * 0.5, 0.15), 48, seg=16, rows=6), 'fennec_ear', root, ME)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    for side, az in (('r', -0.45), ('l', -1.15)):
        p, n = hsurf(0.5, az)
        eye_one('fennec', side, p - n * 0.012, n, root, M, P)
    mode = P['tail']
    tb = V(-0.32, 0, 0.32)
    if mode == 'sway':
        w = 0.05 * math.sin(TAU * t)
        path = [tb, V(-0.5, 0, 0.34 + w), V(-0.64, 0, 0.44 + 2 * w)]
    elif mode == 'up':
        path = [tb, V(-0.52, 0, 0.4), V(-0.66, 0, 0.56)]
    elif mode == 'droop':
        path = [tb, V(-0.48, 0, 0.22), V(-0.6, 0, 0.08)]
    else:
        path = [tb, V(-0.55, 0, 0.3), V(-0.75, 0, 0.28)]
    make_part('tail', tube(path, 0.05, seg=10, radii=[0.05, 0.08, 0.085]), 'fennec_fur', root, M)
    make_part('tail_tip', sphere(path[-1], 0.075, seg=12, rows=8), 'fennec_tip', root, M)
    hips = {'fl': V(0.14, -0.1, 0.24), 'fr': V(0.14, 0.1, 0.24), 'bl': V(-0.22, -0.1, 0.24), 'br': V(-0.22, 0.1, 0.24)}
    quad_legs('fennec', root, M, P, t, hips, 0.04, 0.035, (0.06, 0.045, 0.035), 'fennec_fur', A=0.09, H=0.06, foot_mat='fennec_paw')


# ================================================================ GOAT
GOAT_POSE = {
    'walk':   dict(sx=1.00, sz=1.00, lean=0,   lid=0.12, mouth='smile',  feet='walk',   pitch=0,   sprig=True),
    'notice': dict(sx=0.97, sz=1.05, lean=-8,  lid=0.00, eye=1.2, pupil=0.7, mouth='open', feet='stand', pitch=-22, sprig=False),
    'charge': dict(sx=1.12, sz=0.92, lean=6,   lid=0.30, mouth='open',   feet='charge', pitch=38,  sprig=False, angry=True),
    'stun':   dict(sx=1.03, sz=0.95, lean=-5,  lid=0.50, mouth='wobble', feet='stand',  pitch=-6,  sprig=False, dazed=True),
    'flat':   dict(sx=1.20, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat',   pitch=0,   sprig=False),
    'ko':     dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp',   pitch=-12, sprig=False, x=True),
}


def build_goat(root, pose, t):
    P = dict(GOAT_POSE[pose])
    P.update(er=0.07, skin='goat_coat')
    sx, sz, lean, bob, nod = P['sx'], P['sz'], P['lean'], 0.0, 0.0
    if pose == 'walk':
        bob = 0.012 * (1 + math.sin(2 * TAU * t))
        nod = 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    bc = V(-0.08, 0, 0.52)
    make_part('body', superellipsoid(bc, 0.4, 0.22, 0.23, 0.6, seg=28, rows=14), 'goat_coat', root, M)
    MH = M @ about((0.3, 0, 0.62), rot_y(P['pitch'] + nod))
    hc, hr = V(0.42, 0, 0.74), (0.2, 0.15, 0.16)
    make_part('head', blob(hc, *hr, seg=24, rows=14), 'goat_coat', root, MH)
    mc, mr = V(0.58, 0, 0.67), (0.1, 0.1, 0.08)
    make_part('muzzle', blob(mc, *mr, seg=16, rows=10), 'goat_muzzle', root, MH)
    make_part('nose', sphere((0.67, 0, 0.69), 0.035, seg=12, rows=8), 'goat_nose', root, MH)
    make_part('beard', cone(V(0.56, 0, 0.6), V(0.6, 0, 0.42), 0.06, flat=0.8), 'goat_beard', root, MH)
    for side, sgn in (('l', -1), ('r', 1)):
        ec = V(0.33, sgn * 0.17, 0.66)
        ear = ellipsoid(ec, X * 0.06, Y * 0.04, Z * 0.13, seg=14, rows=8)
        make_part('ear_' + side, xf(ear, about(ec + Z * 0.1, rot_x(sgn * 25))), 'goat_coat', root, MH)
        horn = [V(0.36, sgn * 0.08, 0.86), V(0.3, sgn * 0.1, 1.0), V(0.17, sgn * 0.11, 1.05), V(0.05, sgn * 0.1, 0.98)]
        make_part('horn_' + side, tube(horn, 0.05, seg=10, radii=[0.05, 0.04, 0.028, 0.015]), 'goat_horn', root, MH)
    hsurf = ellipsoid_surf(hc, *hr)
    for side, az in (('r', -0.45), ('l', -1.15)):
        p, n = hsurf(0.8, az)
        eye_one('goat', side, p - n * 0.012, n, root, MH, P)
        if P.get('angry'):
            brow('goat', side, p - n * 0.012, n, root, MH, P['er'])
    msurf = ellipsoid_surf(mc, *mr)
    make_part('mouth', mouth_bm(msurf, P['mouth'], 0.64, math.radians(-15), math.radians(-80), scale=0.7), 'goat_mouth', root, MH)
    if P['sprig']:
        twig = [V(0.64, -0.05, 0.63), V(0.76, -0.1, 0.68), V(0.86, -0.13, 0.76)]
        make_part('twig', tube(twig, 0.012, seg=6), 'goat_twig', root, MH, subsurf=1)
        for k, (p, d) in enumerate(((twig[1], V(0.02, -0.03, 0.1)), (twig[2], V(0.08, -0.03, 0.06)))):
            leaf = prism([p, p + d * 0.5 + V(0.05, 0, 0.0), p + d, p + d * 0.5 - V(0.04, 0, 0.0)], Y * 0.02)
            make_part('leaf%d' % k, leaf, 'goat_leaf', root, MH, subsurf=1)
        make_part('fruit', ellipsoid(twig[1] + V(0.02, -0.02, -0.06), X * 0.03, Y * 0.03, Z * 0.04, seg=10, rows=6), 'goat_fruit', root, MH, subsurf=1)
    make_part('tail', tube([V(-0.47, 0, 0.66), V(-0.52, 0, 0.74), V(-0.54, 0, 0.82)], 0.035, 0.025, seg=8), 'goat_coat', root, M)
    hips = {'fl': V(0.2, -0.12, 0.36), 'fr': V(0.2, 0.12, 0.36), 'bl': V(-0.3, -0.12, 0.36), 'br': V(-0.3, 0.12, 0.36)}
    quad_legs('goat', root, M, P, t, hips, 0.04, 0.045, (0.07, 0.055, 0.04), 'goat_coat', A=0.1, H=0.06, foot_mat='goat_hoof')


# ================================================================ ORANGE
ORANGE_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=3,   lid=0.12, mouth='grin',   feet='walk'),
    'curl': dict(sx=1.05, sz=0.95, lean=14,  lid=0.70, mouth='small',  feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0,   lid=1.00, mouth=None,     feet=None),
    'stun': dict(sx=1.03, sz=0.95, lean=-6,  lid=0.50, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.38, lean=0,   lid=1.00, mouth='flat',   feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=0.00, mouth='o',      feet='limp', x=True),
}


def orange_body(root, M, c, r):
    make_part('peel', sphere(c, r, seg=26, rows=14), 'orange_peel', root, M)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('shine', oval_patch(surf, c.z + r * 0.55, 0.06, -1.9, 0.42), 'orange_shine', root, M)
    top = c + Z * r
    make_part('stem', tube([top - Z * 0.02, top + V(0.02, 0, 0.07)], 0.025, 0.02, seg=8), 'orange_stem', root, M)
    leaf = prism([top + V(0.02, 0, 0.05), top + V(-0.08, 0, 0.13), top + V(-0.22, 0, 0.12), top + V(-0.18, 0, 0.05), top + V(-0.07, 0, 0.03)], Y * 0.03)
    make_part('leaf', leaf, 'orange_leaf', root, M, subsurf=1)
    return surf


def build_orange(root, pose, t):
    P = dict(ORANGE_POSE[pose])
    P.update(er=0.085, skin='orange_peel')
    sx, sz, lean, bob = P['sx'], P['sz'], P['lean'], 0.0
    if pose == 'walk':
        bob = 0.02 * abs(math.sin(TAU * t))
        lean += 3 * math.sin(TAU * t)
    M = T((0, 0, bob)) @ rot_y(lean) @ diag(sx, sx, sz)
    if pose == 'roll':
        c, r = V(0, 0, 0.3), 0.3
        MR = about(c, rot_y(360 * t))
        surf = orange_body(root, MR, c, r)
        for side, az in (('r', -0.35), ('l', -1.2)):
            p, n = surf(0.36, az)
            eye_one('orange', side, p - n * 0.012, n, root, MR, P)
        return
    c, r = V(0, 0, 0.38), 0.3
    surf = orange_body(root, M, c, r)
    for side, az in (('r', -0.35), ('l', -1.2)):
        p, n = surf(0.45, az)
        eye_one('orange', side, p - n * 0.012, n, root, M, P)
    make_part('mouth', mouth_bm(surf, P['mouth'], 0.28, math.radians(5), math.radians(-105), scale=1.0), 'orange_mouth', root, M)
    biped_legs('orange', root, M, P, t, (0.0, 0.1, 0.2), (0.1, 0.06, 0.045), 0.035, 'orange_feet')


# ================================================================ SNAIL (2 hp)
SNAIL_POSE = {
    'walk':      dict(sx=1.00, sz=1.00, lid=0.12, mouth='smile',  stalks='up',    cracked=False, wave=True),
    'hurt_walk': dict(sx=1.00, sz=1.00, lid=0.00, mouth='frown',  stalks='up',    cracked=True,  wave=True, sweat=True, eye=1.1),
    'stun':      dict(sx=1.03, sz=0.95, lid=0.50, mouth='wobble', stalks='droop', cracked=True,  wave=False, dazed=True),
    'flat':      dict(sx=1.25, sz=0.40, lid=1.00, mouth='flat',   stalks='flat',  cracked=True,  wave=False),
    'ko':        dict(sx=1.00, sz=0.95, lid=0.00, mouth='o',      stalks='limp',  cracked=True,  wave=False, x=True),
}
SNAIL_STALKS = {'up': (0.06, 0.04, 0.19), 'droop': (0.12, 0.05, 0.03), 'flat': (0.16, 0.05, -0.03), 'limp': (0.14, 0.03, -0.13)}


def build_snail(root, pose, t):
    P = dict(SNAIL_POSE[pose])
    P.update(er=0.055, skin='snail_body')
    sx, sz = P['sx'], P['sz']
    M = diag(sx, sx, sz)
    base = [(-0.5, 0.07), (-0.3, 0.1), (-0.1, 0.11), (0.1, 0.12), (0.28, 0.16), (0.4, 0.26), (0.45, 0.4)]
    radii = [0.04, 0.09, 0.11, 0.12, 0.11, 0.1, 0.1]
    speed = 2.0 if pose == 'hurt_walk' else 1.0
    path = []
    for k, (x, z) in enumerate(base):
        dz = 0.0
        if P['wave'] and k < 5:
            dz = 0.025 * math.sin(TAU * (2 * k / 4 - t * speed))
        path.append(V(x, 0, z + dz))
    make_part('body', tube(path, 0.1, seg=14, radii=radii), 'snail_body', root, M)
    hc, hr = V(0.45, 0, 0.4), 0.11
    make_part('head', sphere(hc, hr, seg=18, rows=10), 'snail_body', root, M)
    dx, dy, dz = SNAIL_STALKS[P['stalks']]
    for side, sgn in (('l', -1), ('r', 1)):
        b = V(0.44, sgn * 0.05, 0.47)
        top = b + V(dx, sgn * dy, dz)
        make_part('stalk_' + side, tube([b, (b + top) / 2 + V(-0.01, 0, 0.01), top], 0.028, 0.024, seg=8), 'snail_body', root, M)
        n = Vector((0.5, -0.8, 0.25)).normalized()
        eye_one('snail', side, top + Z * 0.02, n, root, M, P)
        make_part('feeler_' + side, tube([V(0.52, sgn * 0.04, 0.36), V(0.63, sgn * 0.08, 0.33 - 0.02 * max(0, -dz))], 0.014, 0.01, seg=6), 'snail_body', root, M, subsurf=1)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    make_part('mouth', mouth_bm(hsurf, P['mouth'], 0.37, math.radians(-10), math.radians(-80), scale=0.6), 'snail_mouth', root, M)
    # the shell: a brown sphere with a spiral on the camera side, cracked after the first hit
    bobz = 0.015 * math.sin(TAU * t * speed) if P['wave'] else 0.0
    sc, sr = V(-0.12, 0, 0.38 + bobz), (0.3, 0.24, 0.29)
    make_part('shell', blob(sc, *sr, seg=26, rows=14), 'snail_shell', root, M)
    ssurf = ellipsoid_surf(sc, *sr)
    make_part('shell_hi', oval_patch(ssurf, sc.z + 0.16, 0.05, -1.9, 0.35), 'snail_shell_hi', root, M)
    spiral = []
    n = 44
    for k in range(n):
        u = k / (n - 1)
        a = 2.4 * TAU * u + 0.6
        rs = 0.25 * (1 - 0.92 * u)
        spiral.append(on_face(sc, sr, rs * math.cos(a), rs * math.sin(a)) - Y * 0.012)
    make_part('spiral', tube(spiral, 0.02, seg=6), 'snail_spiral', root, M, subsurf=1)
    if P['cracked']:
        crack = [(-0.22, 0.27), (-0.14, 0.18), (-0.2, 0.1), (-0.12, 0.02), (-0.17, -0.06)]
        pts = [on_face(sc, sr, x, z) - Y * 0.012 for x, z in crack]
        make_part('crack', tube(pts, 0.02, 0.012, seg=6), 'snail_crack', root, M, subsurf=1)
        chip = prism([sc + V(-0.3, 0, 0.3), sc + V(-0.14, 0, 0.3), sc + V(-0.22, 0, 0.2)], Y * 0.12)
        make_part('chip', chip, 'snail_crack', root, M, subsurf=0, smooth=False)
    if P.get('sweat'):
        make_part('sweat', ellipsoid(V(0.56, -0.12, 0.6), X * 0.025, Y * 0.02, Z * 0.045, seg=10, rows=6), 'snail_sweatglow', root, M, subsurf=1)


# ================================================================ COIN: the date
def build_coin(root, pose, t):
    M = rot_z(360 * t)
    radii = (0.16, 0.11, 0.27)
    make_part('date', superellipsoid((0, 0, 0), *radii, 0.85, seg=24, rows=14), 'coin_date', root, M)
    make_part('cap', ellipsoid((0, 0, 0.26), X * 0.06, Y * 0.045, Z * 0.035, seg=12, rows=6), 'coin_cap', root, M)
    make_part('stem', tube([V(0, 0, 0.27), V(0.01, 0, 0.32)], 0.014, 0.01, seg=6), 'coin_cap', root, M, subsurf=1)
    crease = [on_face((0, 0, 0), radii, 0.02 * math.sin(3 * k), -0.19 + 0.34 * k / 6) - Y * 0.008 for k in range(7)]
    make_part('crease', tube(crease, 0.012, seg=6), 'coin_crease', root, M, subsurf=1)
    gc = on_face((0, 0, 0), radii, -0.06, 0.1) - Y * 0.01
    make_part('shine', ellipsoid(gc, X * 0.03, Y * 0.012, Z * 0.07, seg=10, rows=6), 'coin_shine', root, M, subsurf=1)


# ================================================================ STAR: the golden lantern
STAR_BODY = [(0, -0.4), (0.08, -0.36), (0.2, -0.24), (0.26, -0.06), (0.26, 0.1), (0.2, 0.26), (0.1, 0.36), (0, 0.4)]


def build_star(root, pose, t):
    M = T((0, 0, 0.035 * math.sin(TAU * t))) @ diag(0.92, 0.92, 0.92)
    make_part('glass', lathe(STAR_BODY, seg=6), 'star_glassglow', root, M, subsurf=0, smooth=False)
    for k in range(6):
        a = TAU * k / 6
        rib = [V((r + 0.012) * math.cos(a), (r + 0.012) * math.sin(a), z) for r, z in STAR_BODY]
        make_part('rib%d' % k, tube(rib, 0.022, seg=6), 'star_gold', root, M, subsurf=1)
    for k, (z, R) in enumerate(((-0.24, 0.2), (0.1, 0.26), (0.26, 0.2))):
        make_part('ring%d' % k, torus((0, 0, z), R + 0.01, 0.02, seg=6, rseg=8), 'star_gold', root, M, subsurf=1)
    make_part('cap', lathe([(0.12, 0.36), (0.15, 0.4), (0.09, 0.48), (0, 0.52)], seg=6), 'star_gold', root, M, subsurf=1)
    make_part('neck', tube([V(0, 0, 0.5), V(0, 0, 0.56)], 0.03, 0.025, seg=8), 'star_gold_dark', root, M, subsurf=1)
    make_part('handle', torus((0, 0, 0.64), 0.08, 0.022, axis=Y, seg=20, rseg=8), 'star_gold', root, M)
    make_part('foot', lathe([(0.1, -0.4), (0.12, -0.42), (0.06, -0.48), (0, -0.52)], seg=6), 'star_gold', root, M, subsurf=1)
    make_part('drop', sphere((0, 0, -0.55), 0.045, seg=12, rows=8), 'star_gold_dark', root, M)
    # sparkles circling the lantern (unlit)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.44 * math.cos(a), -0.2, 0.22 * math.sin(a) + 0.02)
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = []
        for j in range(8):
            rr = r if j % 2 == 0 else r * 0.38
            pts.append(c + V(rr * math.cos(TAU * j / 8), 0, rr * math.sin(TAU * j / 8)))
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, M, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the zellige block
def face_poly(c, nrm, tng, pts2d):
    """A polygon in a block face's plane from (u, v) offsets along tng / nrm x tng."""
    bn, bt = Vector(nrm).normalized(), Vector(tng).normalized()
    bu = bn.cross(bt)
    return [Vector(c) + bt * u + bu * v for u, v in pts2d]


def build_block(root, M, kind, spent, t):
    H = 0.55
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.05), kind + '_tile', root, M, subsurf=0)
    star_mat = 'used_dull' if spent else 'qblock_gold'
    ring_mats = ('used_dull2', 'used_dull2') if spent else ('qblock_cream', 'qblock_teal')
    corner_mat = 'used_dull' if spent else 'qblock_navy'
    faces = [((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)), ((0, 0, 1), (1, 0, 0))]
    for fi, (nrm, tng) in enumerate(faces):
        bn = Vector(nrm)
        c = bn * (H + 0.012)
        star = [((0.24 if j % 2 == 0 else 0.1) * math.cos(TAU * j / 16), (0.24 if j % 2 == 0 else 0.1) * math.sin(TAU * j / 16)) for j in range(16)]
        make_part('star%d' % fi, prism(face_poly(c, nrm, tng, star), bn * 0.024), star_mat, root, M, subsurf=0, smooth=False)
        for j in range(8):
            a = TAU * j / 8 + TAU / 16
            u, v = 0.36 * math.cos(a), 0.36 * math.sin(a)
            h = 0.075
            dia = [(u + h, v), (u, v + h), (u - h, v), (u, v - h)]
            make_part('dia%d_%d' % (fi, j), prism(face_poly(c, nrm, tng, dia), bn * 0.02), ring_mats[j % 2], root, M, subsurf=0, smooth=False)
        for j, (su, sv) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
            u, v, h = su * 0.41, sv * 0.41, 0.06
            dia = [(u + h, v), (u, v + h), (u - h, v), (u, v - h)]
            make_part('corner%d_%d' % (fi, j), prism(face_poly(c, nrm, tng, dia), bn * 0.02), corner_mat, root, M, subsurf=0, smooth=False)


def build_qblock(root, pose, t):
    M = rot_y(2.5 * math.sin(TAU * t)) @ diag(1 + 0.012 * math.sin(TAU * t), 1, 1 - 0.012 * math.sin(TAU * t))
    build_block(root, M, 'qblock', False, t)


def build_used(root, pose, t):
    build_block(root, Matrix.Identity(4), 'used', True, t)


# ================================================================ public API
BUILDERS = {'tagine': build_tagine, 'teapot': build_teapot, 'cobra': build_cobra, 'scarab': build_scarab,
            'fennec': build_fennec, 'goat': build_goat, 'orange': build_orange, 'snail': build_snail,
            'coin': build_coin, 'star': build_star, 'qblock': build_qblock, 'used': build_used}


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
        LK.apply_look(look, LK.all_meshes(root), outline_px=1.25)
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
            if (kind, pose) == ('teapot', 'throw'):
                ts = [(0.0, ''), (0.3, '_t30'), (0.5, '_t50'), (0.7, '_t70')]
            for t, suffix in ts:
                root, path = render_pose(kind, pose, t, suffix, look)
                x0, x1, z0, z1 = bounds(root)
                print('%-7s %-9s t=%.2f  tris %5d  subdivided %6d  x %.2f..%.2f (%.0f px)  z %.2f..%.2f (%.0f px)  %s' % (
                    kind, pose, t, triangle_count(root), triangle_count(root, True), x0, x1, (x1 - x0) * PX, z0, z1, (z1 - z0) * PX, path))
                outs.append(path)
        clear(kind)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
