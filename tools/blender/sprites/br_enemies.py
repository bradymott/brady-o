# br_enemies: the Brazil (world 3) enemies and items of Super Brady-O World for the pre-rendered 2D sprite pipeline,
# all original cartoon designs in the Fiesta Toon look (chunky low-poly shapes, big eyes, plain Principled materials
# with a Base Color only; the look kit adds the flat cel bands and the dark outline at render time).
# Conventions (as mx_pepper.py / mx_enemies_b.py): Blender native axes, Z up, every character FACES +X (screen-right),
# the sprite camera looks along +Y from -Y.  1 m = 28.1 px.  Feet-origin kinds stand with their feet on z = 0;
# centre-origin kinds (the gull, the piranha and the four items) are centred on the origin.
#
#   crab        a red beach crab on eye stalks, big front claw up, scuttling sideways      walk(t) stun flat ko
#   coconut     a green coconut with a pink bendy straw that curls up and rolls             walk(t) curl roll(t) stun flat ko
#   gull        a smug beach gull with a stolen ring biscuit in its beak                    fly(t) swoop stun ko
#   brigadeiro  a chocolate truffle covered in carnival sprinkles, hopping in its paper cup  walk(t) hop stun flat ko
#   pandeiro    a tambourine that rolls on its rim, jingles spinning, face on the skin       walk(t) stun flat ko
#   coati       a ringed-tail coin thief (custom class BrCoati), tail up like a flag         walk(t) flee(t: gallop) stun flat ko
#   jaguar      a rosetted jaguar that charges; 2 hp (hurt_walk modelled, not rendered)    walk(t) notice charge stun flat ko
#   piranha     a deep-bodied silver piranha with a red belly and a mouthful of teeth       up(t) down(t) ko
#   toucanito   a little black toucan with a big orange beak: O Tucanao's flock (boss minion)  fly(t) swoop stun ko
#   coin        PAO DE QUEIJO: a golden cheese bun with pale cracks                          spin(t: rotation about Z)
#   star        GOLDEN TOUCAN: a chubby gold toucan with a huge beak                         idle(t: hover + flutter)
#   qblock      Brazil's item block: a carnival feather box (gold frame, gold star, fan of feathers)  idle(t: sway)
#   used        the same block spent: dull mauve, feathers gone                             idle
#
# API:  build(kind, pose, t=0.0) -> root Empty named kind (fresh geometry; the previous build of that kind is removed)
#       clear() -> removes everything the module built.   KINDS, POSES, HEIGHT (feet kinds), SIZE (every kind), ORIGIN.
# Every object is parented to one Empty named after the kind and carries obj['sprite_part']; materials are named
# <kind>_<part>.
# Headless preview of everything (contact sheets at 256 and 48 px into SCRATCH):
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_enemies.py [-- kind ...]
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
PX = 28.1
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/bren'

KINDS = ['crab', 'coconut', 'gull', 'brigadeiro', 'pandeiro', 'coati', 'jaguar', 'piranha', 'toucanito', 'coin', 'star', 'qblock', 'used']
POSES = {
    'crab': ['walk', 'stun', 'flat', 'ko'],
    'coconut': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'gull': ['fly', 'swoop', 'stun', 'ko'],
    'brigadeiro': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'pandeiro': ['walk', 'stun', 'flat', 'ko'],
    'coati': ['walk', 'flee', 'stun', 'flat', 'ko'],
    'jaguar': ['walk', 'notice', 'charge', 'stun', 'flat', 'ko'],      # (hurt_walk is modelled but the game never asks for it)
    'piranha': ['up', 'down', 'ko'],
    'toucanito': ['fly', 'swoop', 'stun', 'ko'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
# poses whose t parameter is a 0..1 cycle phase
CYCLES = {('crab', 'walk'), ('coconut', 'walk'), ('coconut', 'roll'), ('gull', 'fly'), ('brigadeiro', 'walk'),
          ('pandeiro', 'walk'), ('jaguar', 'walk'), ('jaguar', 'hurt_walk'), ('piranha', 'up'), ('piranha', 'down'),
          ('coin', 'spin'), ('star', 'idle'), ('qblock', 'idle'), ('coati', 'walk'), ('coati', 'flee'), ('toucanito', 'fly')}
# render_country.py frame counts that differ from its defaults: the item blocks are drawn from frame 000 only; the
# coati's 'flee' is a quick gallop
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('coati', 'walk'): (8, 10), ('coati', 'flee'): (8, 18)}
ORIGIN = {'crab': 'feet', 'coconut': 'feet', 'coati': 'feet', 'toucanito': 'centre', 'gull': 'centre', 'brigadeiro': 'feet', 'pandeiro': 'feet',
          'jaguar': 'feet', 'piranha': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'}
# nominal height of the feet-origin kinds (hitbox height / 28.1)
# (the coati's frame takes 22 px, not its 18 px hitbox, to fit the tail it holds up like a flag)
HEIGHT = {'coati': 22 / PX, 'crab': 16 / PX, 'coconut': 22 / PX, 'brigadeiro': 22 / PX, 'pandeiro': 26 / PX, 'jaguar': 26 / PX}
# nominal size of the centre-origin kinds; the renderer reads SIZE for every kind, so the feet kinds repeat HEIGHT here
SIZE = {'toucanito': 26 / PX, 'gull': 14 / PX, 'piranha': 18 / PX, 'coin': 17 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX}
SIZE.update(HEIGHT)

CARN = ['#ff4a4a', '#ff9a2a', '#ffe02a', '#4ad84a', '#3a8aff', '#8a4aff']
COLORS = {
    'crab_shell': '#e8422a', 'crab_belly': '#ff8a60', 'crab_claw': '#c8321a', 'crab_leg': '#b82a16',
    'crab_eye_white': '#ffffff', 'crab_pupil': '#1a1020', 'crab_mouth': '#5a1410',
    'coconut_husk': '#3a8a3a', 'coconut_shine': '#5aaa4a', 'coconut_stem': '#6a5a2a', 'coconut_straw': '#ff3d8b',
    'coconut_straw_stripe': '#ffffff', 'coconut_foot': '#2a5a2a', 'coconut_eye_white': '#ffffff',
    'coconut_pupil': '#1a1020', 'coconut_mouth': '#1a3a1a', 'coconut_tongue': '#ff7a9a',
    'gull_body': '#f8f8ff', 'gull_wing': '#c8ccd8', 'gull_tip': '#4a4e60', 'gull_beak': '#ffb81a', 'gull_beak_spot': '#ff3d2a',
    'gull_leg': '#ff9a4a', 'gull_eye_white': '#ffffff', 'gull_pupil': '#1a1020', 'gull_biscuit': '#f0d8a0',
    'brigadeiro_choc': '#4a2416', 'brigadeiro_cup': '#ff8ac0', 'brigadeiro_cup_dark': '#e86aa8', 'brigadeiro_foot': '#2e1408',
    'brigadeiro_s_red': '#ff4a4a', 'brigadeiro_s_yellow': '#ffe02a', 'brigadeiro_s_green': '#4ad84a', 'brigadeiro_s_blue': '#3a8aff',
    'brigadeiro_eye_white': '#ffffff', 'brigadeiro_pupil': '#1a1020', 'brigadeiro_mouth': '#ff7a9a',
    'pandeiro_hoop': '#c8a060', 'pandeiro_hoop_dark': '#9a7438', 'pandeiro_skin': '#f4ecd8', 'pandeiro_jingle': '#d8d8e0',
    'pandeiro_slot': '#3a2a18', 'pandeiro_eye_white': '#ffffff', 'pandeiro_pupil': '#1a1020', 'pandeiro_mouth': '#8a4a2a',
    'jaguar_fur': '#e8a83a', 'jaguar_fur_hurt': '#d8a858', 'jaguar_cream': '#f4e8d0', 'jaguar_spot': '#3a2410',
    'jaguar_nose': '#5a2a3a', 'jaguar_ear': '#3a2410', 'jaguar_eye_white': '#ffffff', 'jaguar_pupil': '#1a1020',
    'jaguar_mouth': '#5a1a2a', 'jaguar_tooth': '#ffffff', 'jaguar_tongue': '#ff7a9a', 'jaguar_bandage': '#f4f0e0',
    'jaguar_bump': '#ff8a9a',
    'piranha_body': '#8a9aa8', 'piranha_belly': '#e8422a', 'piranha_fin': '#6a7a88', 'piranha_mouth': '#3a1020',
    'piranha_tooth': '#ffffff', 'piranha_eye_white': '#ffffff', 'piranha_pupil': '#1a1020', 'piranha_brow': '#3a4450',
    'coin_crust': '#e0a848', 'coin_top': '#f8d480', 'coin_crack': '#fffae8', 'coin_toast': '#a86a22',
    'star_gold': '#ffd24a', 'star_beak': '#ffe88a', 'star_beak_tip': '#c8901a', 'star_wing': '#e8b020',
    'star_eye_white': '#ffffff', 'star_pupil': '#1a1020', 'star_feet': '#c8901a', 'star_sparkle_glow': '#ffffff',
    'qblock_paper': '#e8408a', 'qblock_gold': '#ffd23a', 'qblock_quill': '#f8f0e0',
    'qblock_f_red': '#ff4a4a', 'qblock_f_orange': '#ff9a2a', 'qblock_f_yellow': '#ffe02a', 'qblock_f_green': '#4ad84a',
    'qblock_f_blue': '#3a8aff',
    'coati_fur': '#a8622e', 'coati_fur_dark': '#5a3418', 'coati_cream': '#f2dcb0', 'coati_nose': '#2e1c14',
    'coati_eye_white': '#ffffff', 'coati_pupil': '#1a1020', 'coati_mouth': '#4a2014',
    'toucanito_body': '#1a1a24', 'toucanito_wing': '#2e2e40', 'toucanito_bib': '#fff4c8', 'toucanito_under': '#ff3d3d',
    'toucanito_beak': '#ff8a2a', 'toucanito_beak_top': '#ffd23a', 'toucanito_beak_tip': '#2a1a1a', 'toucanito_eye_ring': '#3a8aff',
    'toucanito_leg': '#5a7ad8', 'toucanito_eye_white': '#ffffff', 'toucanito_pupil': '#1a1020',
    'used_card': '#a07890', 'used_rim': '#7a5a6a', 'used_quill': '#c8b8c0',
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
    n = len(pts)
    f = min(1.0, max(0.0, t)) * (n - 1)
    k = min(n - 2, int(math.floor(f)))
    u = f - k
    p0, p1, p2, p3 = pts[max(0, k - 1)], pts[k], pts[k + 1], pts[min(n - 1, k + 2)]
    return [0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u ** 3)
            for a, b, c, d in zip(p0, p1, p2, p3)]


def perp_frame(az):
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
    return tr(Vector(pivot)) @ M @ tr(-Vector(pivot))


def V(x, y, z):
    return Vector((x, y, z))


def lerp(a, b, u):
    return a + (b - a) * u


def smooth01(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


# ---------------------------------------------------------------- bmesh builders
def ring_mesh(rings, closed=False):
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
    """Revolve (radius, y) around the Y axis (the disc faces the camera); radius 0 = pole."""
    rings = []
    for rad, y in profile:
        if rad < 1e-6:
            rings.append(Vector((0, y, 0)))
        else:
            rings.append([Vector((rad * math.cos(th), y, rad * math.sin(th))) for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings, closed=closed)


def lathe(profile, seg=24, flute=0.0):
    """Revolve (r, z) around Z; r = 0 is a pole.  flute > 0 bulges every other vertex outward (a pleated cup)."""
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append(Vector((0, 0, z)))
        else:
            rings.append([Vector((r * (1 + (flute if j % 2 else 0.0)) * math.cos(TAU * j / seg),
                                  r * (1 + (flute if j % 2 else 0.0)) * math.sin(TAU * j / seg), z)) for j in range(seg)])
    return ring_mesh(rings)


def torus_bm(c, axis, R, r, seg=20, sides=8):
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


def flat_poly(points, thick):
    """A flat polygon (coplanar Vectors) given a little thickness."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in points]
    bm.faces.new(vs)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bm.normal_update()
    return bm


def cone(base, tip, r, seg=12, flat=1.0):
    base, tip = Vector(base), Vector(tip)
    bm = tube([base, base.lerp(tip, 0.45), tip], r, 0.004, seg=seg)
    if flat != 1.0:
        bm.transform(about(base, scl(1, flat, 1)))
    return bm


def join(bms):
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


def star_poly(c, r_out, r_in, n=5):
    """A flat 5-point star in the XZ plane at c (facing the camera)."""
    pts = []
    for k in range(2 * n):
        a = math.pi / 2 + k * math.pi / n
        r = r_out if k % 2 == 0 else r_in
        pts.append(c + V(r * math.cos(a), 0.0, r * math.sin(a)))
    return pts


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
    """Collects the parts of one kind: every part gets the kind prefix on its material and the pose transform M."""

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

    def eye(self, side, c, out, r, look=None, pupil=0.5, shut=False, lid=0.0, lid_mat='body', dazed=False,
            white='eye_white', M=None):
        """A big cartoon eye: white ball, pupil looking at the camera-front, a lid cap, or an X when knocked out."""
        out = out.normalized()
        ex, ey = perp_frame(out)
        self.part('eye_' + side, ellipsoid(c, ex * r, ey * r, out * r * 0.85, seg=16, rows=10), white, M=M)
        if shut:
            for k, d in enumerate(((ex + ey).normalized(), (ex - ey).normalized())):
                path = [c + out * r * 0.86 - d * r * 0.62, c + out * r * 0.98, c + out * r * 0.86 + d * r * 0.62]
                self.part('xeye_%s%d' % (side, k), tube(path, r * 0.15, seg=6), 'pupil', subsurf=1, M=M)
            return
        if dazed:
            look = Vector((0.25, -0.8, 0.55)) if side == 'l' else Vector((0.6, -0.8, -0.45))
        elif look is None:
            look = Vector((0.45, -0.85, -0.05))
        d = (out * 0.9 + look).normalized()
        px, py = perp_frame(d)
        pr = r * pupil
        self.part('pupil_' + side, ellipsoid(c + d * r * 0.80, px * pr, py * pr, d * pr * 0.55, 14, 8), 'pupil', M=M)
        if lid > 0.001:
            lup = (Z + out * 0.3).normalized()
            lax = (out - lup * lup.dot(out)).normalized()
            lay = lup.cross(lax)
            lr = r * 1.07
            self.part('lid_' + side, ellipsoid(c, lax * lr * 0.95, lay * lr * 0.95, lup * lr * 1.1, 16, 10, phi1=lid * math.pi),
                      lid_mat, M=M)

    def brow(self, side, c, out, r, angry=1.0, mat='pupil', M=None):
        """An angry eyebrow above the eye at c (inner end lower)."""
        out = out.normalized()
        up = (Z - out * out.z).normalized()
        s = up.cross(out)
        a = c + out * r * 0.5 + up * r * (1.15 - 0.45 * angry) + s * r * 0.95
        b = c + out * r * 0.5 + up * r * (1.25 + 0.35 * angry) - s * r * 0.7
        self.part('brow_' + side, tube([a, a.lerp(b, 0.5), b], r * 0.22, seg=8), mat, M=M)

    def mouth_on(self, c, radii, style, az0, az1, el, r=0.016, mat='mouth', M=None):
        """A line mouth on an ellipsoid surface sweeping az0 -> az1 at elevation el: smile, flat, wobble, frown, grin."""
        if style in ('o', 'open'):
            p, n = on_ellipsoid(c, radii, (az0 + az1) / 2, el)
            ax, ay = perp_frame(n)
            k = 1.0 if style == 'o' else 1.6
            return self.part('mouth', ellipsoid(p - n * 0.01, ax * 0.035 * k, ay * 0.04 * k, n * 0.025, 14, 8), mat, M=M)
        path = []
        for k in range(13):
            u = k / 12
            dz = 0.0
            if style == 'wobble':
                dz = 0.06 * math.sin(3 * math.pi * u)
            elif style in ('smile', 'grin'):
                dz = (0.12 if style == 'smile' else 0.2) * 4 * (u - 0.5) ** 2 - 0.05
            elif style == 'frown':
                dz = -0.1 * 4 * (u - 0.5) ** 2 + 0.05
            p, n = on_ellipsoid(c, radii, lerp(az0, az1, u), el + dz)
            path.append(p + n * 0.006)
        return self.part('mouth', tube(path, r, seg=8), mat, M=M)


PHASE = {'fl': math.pi / 2, 'br': math.pi / 2, 'fr': 3 * math.pi / 2, 'bl': 3 * math.pi / 2}


def gait(t, phase, A, H):
    th = TAU * t + phase
    return A * math.sin(th), H * max(0.0, math.cos(th))


def pose_matrix(P, t, pose, bob=0.0):
    """Squash / stretch about the ground, a lean (deg, + = top toward +X) and a bob."""
    return tr(0, 0, bob) @ rot_y(P.get('lean', 0)) @ scl(P.get('sx', 1.0), P.get('sx', 1.0), P.get('sz', 1.0))


# ================================================================= crab
CRAB = {
    'walk': dict(sx=1.0, sz=1.0, lean=0, lid=0.15, mouth='smile', claws='up'),
    'stun': dict(sx=1.03, sz=0.94, lean=-5, lid=0.5, mouth='wobble', claws='down', dazed=True),
    'flat': dict(sx=1.1, sz=0.40, lean=0, lid=1.0, mouth='flat', claws='flat', shut=True),
    'ko':   dict(sx=1.0, sz=0.95, lean=-8, lid=1.0, mouth='o', claws='limp', shut=True),
}


def build_crab(b, pose, t, P):
    sc, rx, ry, rz = V(0, 0, 0.27), 0.37, 0.27, 0.18
    b.part('shell', blob(sc, rx, ry, rz, seg=28, rows=14), 'shell')
    b.part('belly', ellipsoid(sc + Z * 0.004, X * rx * 1.01, Y * ry * 1.01, -Z * rz * 1.02, seg=28, rows=6, phi1=math.radians(62)), 'belly')
    # eye stalks and big eyes
    droop = 1.0 if pose in ('ko', 'flat') else (0.5 if pose == 'stun' else 0.0)
    for side, x, y in (('l', -0.11, -0.06), ('r', 0.11, -0.02)):
        top = V(x * (1 + 0.6 * droop), y - 0.05 * droop, 0.40 + 0.22 * (1 - 0.8 * droop))
        base = V(x * 0.8, y * 0.5, 0.42)
        mid = (base + top) / 2 + V(0.0, 0, 0.03 * (1 - droop))
        b.part('stalk_' + side, tube([base, mid, top], 0.045, 0.04, seg=10), 'shell')
        out = V(0.55, -0.85, 0.2).normalized()
        b.eye(side, top + out * 0.01, out, 0.085, shut=P.get('shut', False), lid=P['lid'], lid_mat='shell',
              dazed=P.get('dazed', False), pupil=0.5)
    b.mouth_on(sc, (rx, ry, rz), P['mouth'], -0.95, -1.75, -0.05, r=0.014)
    # claws: a big raised one in front (+X), a smaller one behind
    claws = P['claws']
    for name, x, y, big in (('front', 0.40, -0.06, 1.0), ('back', -0.40, 0.08, 0.8)):
        sgn = 1 if x > 0 else -1
        shoulder = V(x * 0.85, y, 0.30)
        if claws == 'up':
            elbow, hand = V(x * 1.15, y, 0.40), V(x * 1.2, y, 0.60)
            hd = Z
        elif claws == 'down':
            elbow, hand = V(x * 1.12, y, 0.26), V(x * 1.15, y, 0.16)
            hd = (X * sgn * 0.4 - Z).normalized()
        elif claws == 'flat':
            elbow, hand = V(x * 1.05, y, 0.07), V(x * 1.1, y, 0.07)
            hd = (X * sgn * 0.5 + Z).normalized()
        else:  # limp
            elbow, hand = V(x * 1.05, y, 0.2), V(x * 1.05, y, 0.06)
            hd = (X * sgn * 0.8 - Z * 0.6).normalized()
        b.part('arm_' + name, tube([shoulder, elbow, hand], 0.055 * big, 0.05 * big, seg=10), 'claw')
        ax, ay = perp_frame(hd)
        # pincer: a fat palm plus a thinner upper finger, with a wedge gap between them
        b.part('palm_' + name, ellipsoid(hand + hd * 0.02, ax * 0.085 * big, ay * 0.07 * big, hd * 0.13 * big, 16, 10), 'claw')
        fdir = (hd * 0.9 + ax * (0.45 if name == 'front' else -0.45) * sgn).normalized()
        b.part('finger_' + name, cone(hand + hd * 0.04 - ax * 0.035 * big * sgn * (1 if name == 'front' else -1),
                                      hand + hd * 0.1 * big + fdir * 0.12 * big, 0.04 * big, seg=10), 'claw')
    # six legs: three on the camera side, three behind
    for i, x in enumerate((-0.22, 0.0, 0.22)):
        for side, y, ph in (('l', -0.2, 0.0), ('r', 0.2, math.pi)):
            hip = V(x, y * 0.9, 0.22)
            dx = dz = 0.0
            if pose == 'walk':
                th = TAU * t + ph + i * 2.1
                dx, dz = 0.05 * math.sin(th), 0.05 * max(0.0, math.cos(th))
            elif pose == 'flat':
                dx = 0.1 * (1 if x >= 0 else -1)
            elif pose == 'ko':
                dz = 0.04
            foot = V(x + dx + (0.06 if x > 0 else (-0.06 if x < 0 else 0)), y * 1.5, 0.03 + dz)
            knee = (hip + foot) / 2 + V(0, y * 0.4, 0.09 - dz * 0.5)
            b.part('leg_%s%d' % (side, i), tube([hip, knee, foot], 0.03, 0.022, seg=8), 'leg')


# ================================================================= coconut
COCONUT = {
    'walk': dict(sx=1.0, sz=1.0, lean=3, lid=0.15, mouth='grin', feet='walk'),
    'curl': dict(sx=1.04, sz=0.96, lean=14, lid=0.7, mouth='small', feet='tuck'),
    'roll': dict(sx=1.0, sz=1.0, lean=0),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.3, sz=0.4, lean=0, lid=1.0, mouth='flat', feet='flat', shut=True),
    'ko':   dict(sx=1.0, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp', shut=True),
}


def coconut_body(b, c, r, P, pose, t, M=None):
    """The husk, shine, stem, straw and face around centre c (radius r)."""
    rad = (r, r, r * 1.06)
    b.part('husk', blob(c, *rad, seg=28, rows=16), 'husk', M=M)
    p, n = on_ellipsoid(c, rad, -2.2, 0.7)
    ax, ay = perp_frame(n)
    b.part('shine', ellipsoid(p - n * 0.01, ax * 0.09, ay * 0.07, n * 0.03, 14, 8), 'shine', M=M)
    top = c + Z * rad[2]
    b.part('stem', tube([top - Z * 0.03 - X * 0.08, top + Z * 0.03 - X * 0.1], 0.045, 0.035, seg=10), 'stem', M=M)
    # the pink bendy straw, leaning back, with a white stripe near the top
    base = top - Z * 0.04 + X * 0.06
    wob = 0.0 if pose == 'roll' else 0.04 * math.sin(TAU * t)
    if pose == 'roll':      # the bendy straw folds flat along the husk while it rolls
        path = [base, base + V(0.0, 0, 0.1), base + V(-0.12, 0, 0.12), base + V(-0.24, 0, 0.03)]
        b.part('straw', tube(path, 0.034, 0.03, seg=10), 'straw', M=M)
        b.part('straw_stripe', tube([base + V(-0.04, 0, 0.12), base + V(-0.08, 0, 0.125)], 0.037, 0.037, seg=10), 'straw_stripe', M=M, subsurf=1)
        return
    path = [base, base + V(0.02, 0, 0.16), base + V(0.0, 0, 0.26), base + V(-0.06 + wob, 0, 0.32), base + V(-0.16 + wob, 0, 0.35)]
    b.part('straw', tube(path, 0.034, 0.03, seg=10), 'straw', M=M)
    b.part('straw_stripe', tube([base + V(0.012, 0, 0.19), base + V(0.004, 0, 0.23)], 0.037, 0.037, seg=10), 'straw_stripe', M=M, subsurf=1)
    for side, az in (('r', -0.42), ('l', -1.2)):
        p, n = on_ellipsoid(c, rad, az, 0.18)
        b.eye(side, p - n * 0.015, n, 0.082, shut=P.get('shut', False), lid=P['lid'], lid_mat='husk',
              dazed=P.get('dazed', False), pupil=0.5, M=M)
    style = P['mouth']
    if style == 'small':
        b.mouth_on(c, rad, 'smile', -0.6, -1.1, -0.18, r=0.013, M=M)
    elif style == 'grin':
        b.mouth_on(c, rad, 'grin', -0.4, -1.35, -0.2, r=0.016, M=M)
        p, n = on_ellipsoid(c, rad, -0.85, -0.36)
        ax, ay = perp_frame(n)
        b.part('tongue', ellipsoid(p - n * 0.008, ax * 0.035, ay * 0.03, n * 0.02, 10, 6), 'tongue', M=M)
    else:
        b.mouth_on(c, rad, style, -0.45, -1.3, -0.2, r=0.015, M=M)


def biped_feet(b, P, t, hip_z, y_off, foot_dims, leg_r, mat, A=0.08, H=0.05):
    for side, y, phase in (('l', -y_off, math.pi / 2), ('r', y_off, 3 * math.pi / 2)):
        stance = P['feet']
        dx = dz = tilt = 0.0
        if stance == 'walk':
            dx, dz = gait(t, phase, A, H)
        elif stance == 'stand':
            dx = 0.04 if side == 'l' else -0.03
        elif stance == 'flat':
            dx = 0.24 if side == 'l' else -0.2
            y *= 0.7
        elif stance == 'limp':
            dx = 0.12 if side == 'l' else -0.08
            tilt = -30.0
        elif stance == 'tuck':
            dx = -0.02 if side == 'l' else 0.03
            dz = 0.05
        hip = V(0.02, y, hip_z)
        fc = V(0.03 + dx, y, foot_dims[2] + dz)
        knee = (hip + fc) / 2 + V(dz * 0.8, 0, 0)
        b.part('leg_' + side, tube([hip, knee, fc], leg_r, seg=10), mat)
        bm = ellipsoid(Vector((0, 0, 0)), X * foot_dims[0], Y * foot_dims[1], Z * foot_dims[2], seg=14, rows=8)
        b.part('foot_' + side, xf(bm, tr(fc) @ rot_y(tilt)), mat)


def build_coconut(b, pose, t, P):
    r = 0.30
    if pose == 'roll':
        c = V(0, 0, r * 1.06)
        coconut_body(b, c, r, P, pose, t, M=about(c, rot_y(360 * t)))
        return
    c = V(0, 0, 0.09 + r * 1.06)
    coconut_body(b, c, r, P, pose, t)
    biped_feet(b, P, t, 0.14, 0.11, (0.10, 0.06, 0.042), 0.035, 'foot')


# ================================================================= gull
GULL = {
    'fly':   dict(flap=lambda t: 50 * math.cos(TAU * t), sweep=12, M=lambda t: tr(-0.08, 0, 0.02 * math.sin(TAU * t)) @ scl(0.94, 0.94, 0.94), ns=1, biscuit=True),
    'swoop': dict(flap=lambda t: 22, sweep=52, M=lambda t: tr(-0.08, 0, 0) @ scl(0.94, 0.94, 0.94) @ rot_y(26), ns=1, biscuit=True),
    'stun':  dict(flap=lambda t: -60, sweep=4, M=lambda t: tr(-0.08, 0, 0) @ scl(0.94, 0.94, 0.94) @ rot_y(-8), ns=1, biscuit=False, dazed=True),
    'ko':    dict(flap=lambda t: -68, sweep=10, M=lambda t: tr(-0.08, 0, 0) @ scl(0.94, 0.94, 0.94) @ rot_x(180) @ rot_y(-12), ns=-1, biscuit=False),
}


def wing_frame(root, side, flap_deg, sweep_deg):
    return tr(root) @ rot_z(side * sweep_deg) @ rot_x(side * flap_deg) @ scl(1.0, side, 1.0)


def build_gull(b, pose, t, P):
    ns = P['ns']
    pts = [(0.26, 0.00, 1.0, 1.0), (0.22, 0.09, 1.0, 1.0), (0.10, 0.15, 1.0, 1.0), (-0.05, 0.155, 1.0, 1.0),
           (-0.18, 0.12, 1.0, 1.0), (-0.28, 0.06, 1.2, 0.7), (-0.33, 0.00, 1.0, 1.0)]
    sp = Spine([(x, 0.0, 0.0, r, kz, ky) for x, r, kz, ky in pts])
    b.part('body', sp.mesh(rings=20, seg=20), 'body')
    hc = V(0.26, 0, 0.10) if pose != 'swoop' else V(0.30, 0, 0.06)
    head_r = (0.125, 0.11, 0.115)
    b.part('head', blob(hc, *head_r, seg=18, rows=12), 'body')
    # beak: a stout yellow wedge with a red spot, slightly hooked
    bd = (X - Z * 0.15).normalized()
    beak0 = hc + bd * 0.08
    b.part('beak', tube([beak0, beak0 + bd * 0.12, beak0 + bd * 0.2 - Z * 0.02], 0.05, 0.012, seg=10), 'beak')
    b.part('beak_spot', sphere(beak0 + bd * 0.13 - Z * 0.03 - Y * 0.035 * ns, 0.014, 8, 6), 'beak_spot', subsurf=1)
    if P['biscuit']:      # the stolen ring biscuit, clamped in the beak
        bc = beak0 + bd * 0.19 - Z * 0.02
        b.part('biscuit', torus_bm(bc, Y, 0.065, 0.028, seg=20, sides=8), 'biscuit')
    # smug half-lidded eyes
    for side, az in (('r', -0.45), ('l', -1.2)):
        c, n = on_ellipsoid(hc, head_r, az * ns, 0.30)
        b.eye(side, c - n * 0.012, n, 0.052, shut=pose == 'ko', pupil=0.5, lid=0.5 if pose == 'stun' else 0.38,
              dazed=P.get('dazed', False), look=Vector((0.5, -0.85, -0.25)))
    # wings: pale panel + dark fingered tips; tail fan with a dark band; short orange legs tucked under
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.0, 0.1 * side, 0.08), side, flap, sweep)

        def wing(u, v, W=W):
            span = 0.46 * u
            le = 0.12 - 0.16 * u * u
            chord = 0.28 * (1 - u ** 1.4) + 0.02 + 0.04 * math.sin(4 * math.pi * u) ** 2 * u
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.024 - 0.012 * u, u1=0.66), 'wing')
        b.part('wingtip_' + side_name, sheet(wing, 8, 4, lambda u, v: 0.013 - 0.006 * u, u0=0.64), 'tip')

    def tail(u, v):
        return V(-0.28 - 0.17 * u, (v * 2 - 1) * (0.04 + 0.07 * u), 0.01 + 0.03 * u)
    b.part('tail', sheet(tail, 4, 4, 0.01, u1=0.75), 'body')
    b.part('tail_band', sheet(tail, 2, 4, 0.011, u0=0.72), 'tip')
    for side_name, side in (('l', -1), ('r', 1)):
        y = 0.06 * side
        if pose in ('stun', 'ko'):
            path = [V(-0.04, y, -0.10), V(-0.02, y, -0.2), V(0.02, y, -0.26)]
        else:
            path = [V(-0.04, y, -0.10), V(-0.10, y, -0.16), V(-0.14, y, -0.19)]
        b.part('leg_' + side_name, tube(path, 0.018, 0.014, seg=8), 'leg')
        b.part('foot_' + side_name, ellipsoid(path[-1] + X * 0.03, X * 0.05, Y * 0.03, Z * 0.012, 10, 6), 'leg', subsurf=1)


# ================================================================= brigadeiro
BRIGADEIRO = {
    'walk': dict(sx=1.0, sz=1.0, lean=2, lid=0.12, mouth='grin', feet='walk'),
    'hop':  dict(sx=0.9, sz=1.14, lean=10, lid=0.0, mouth='open', feet='tuck', eye=1.1),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.3, sz=0.4, lean=0, lid=1.0, mouth='flat', feet='flat', shut=True),
    'ko':   dict(sx=1.0, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp', shut=True),
}
SPRINKLES = [(-0.3, 0.9), (0.6, 0.95), (1.6, 0.8), (2.6, 0.75), (-2.4, 0.6), (-1.9, 0.95), (3.0, 0.3), (2.2, 0.2),
             (1.3, 0.35), (0.3, 0.55), (-2.8, -0.1), (2.7, -0.3), (1.9, -0.2), (-2.2, 0.15), (-1.7, -0.35), (0.2, -0.45),
             (-0.9, -0.55), (-2.6, -0.5), (1.0, -0.6), (2.4, -0.65), (-0.2, 0.25), (-1.55, 0.62), (0.9, 0.05), (-1.0, 0.9)]


def build_brigadeiro(b, pose, t, P):
    # the fluted paper cup
    cup = [(0, 0.09), (0.19, 0.09), (0.23, 0.20), (0.27, 0.33), (0.245, 0.33), (0.205, 0.21), (0.17, 0.11), (0, 0.11)]
    b.part('cup', lathe(cup, seg=28, flute=0.04), 'cup', subsurf=1)
    b.part('cup_rim', lathe([(0.26, 0.335), (0.275, 0.34), (0.245, 0.34)], seg=28, flute=0.04), 'cup_dark', subsurf=1)
    c, r = V(0, 0, 0.47), 0.29
    rad = (r, r, r)
    b.part('choc', sphere(c, r, seg=28, rows=16), 'choc')
    mats = ['s_red', 's_yellow', 's_green', 's_blue']
    for k, (az, el) in enumerate(SPRINKLES):
        if -1.75 < az < 0.1 and -0.45 < el < 0.5:      # keep the face clear
            continue
        if el < -0.4 and math.cos(el) * r + c.z < 0.36:  # inside the cup
            continue
        p, n = on_ellipsoid(c, rad, az, el)
        ax, ay = perp_frame(n)
        rot = (k * 1.3) % math.pi
        d1 = (ax * math.cos(rot) + ay * math.sin(rot))
        d2 = (ay * math.cos(rot) - ax * math.sin(rot))
        b.part('sprinkle%d' % k, ellipsoid(p + n * 0.004, d1 * 0.05, d2 * 0.017, n * 0.016, 10, 6), mats[k % 4], subsurf=1)
    er = 0.08 * P.get('eye', 1.0)
    for side, az in (('r', -0.4), ('l', -1.2)):
        p, n = on_ellipsoid(c, rad, az, 0.2)
        b.eye(side, p - n * 0.015, n, er, shut=P.get('shut', False), lid=P['lid'], lid_mat='choc',
              dazed=P.get('dazed', False), pupil=0.5)
    style = P['mouth']
    if style in ('grin', 'open', 'o'):
        b.mouth_on(c, rad, 'open' if style != 'o' else 'o', -0.5, -1.15, -0.22, mat='mouth')
    else:
        b.mouth_on(c, rad, style, -0.45, -1.3, -0.2, r=0.016, mat='mouth')
    biped_feet(b, P, t, 0.12, 0.1, (0.09, 0.055, 0.04), 0.03, 'foot')


# ================================================================= pandeiro
PANDEIRO = {
    'walk': dict(sx=1.0, sz=1.0, lean=0, lid=0.12, mouth='grin', spin=True),
    'stun': dict(sx=1.03, sz=0.95, lean=-10, lid=0.5, mouth='wobble', spin=False, dazed=True),
    'flat': dict(sx=1.3, sz=0.4, lean=0, lid=1.0, mouth='flat', spin=False, shut=True),
    'ko':   dict(sx=1.0, sz=0.95, lean=-14, lid=1.0, mouth='o', spin=False, shut=True),
}


def build_pandeiro(b, pose, t, P):
    R, D = 0.44, 0.17
    c = V(0, 0, R + 0.02)
    MR = b.M @ about(c, rot_y(360 * t)) if P['spin'] else b.M
    # the wooden hoop (a ring around Y), the skin stretched on its camera face, and the jingle slots
    hoop = [(R - 0.05, -D / 2 - 0.0), (R, -D / 2 + 0.02), (R, D / 2 - 0.02), (R - 0.05, D / 2), (R - 0.05, -D / 2)]
    b.part('hoop', xf(lathe_y([(rad, y) for rad, y in hoop[:-1]], seg=40, closed=True), tr(c)), 'hoop', subsurf=1, M=MR)
    b.part('hoop_back', xf(lathe_y([(0, D / 2 - 0.01), (R - 0.04, D / 2 - 0.01), (R - 0.04, D / 2 - 0.04), (0, D / 2 - 0.04)], seg=40), tr(c)), 'hoop_dark', subsurf=0, M=MR)
    b.part('skin', xf(lathe_y([(0, -D / 2 - 0.012), (R - 0.045, -D / 2 - 0.012), (R - 0.045, -D / 2 + 0.03), (0, -D / 2 + 0.03)], seg=40), tr(c)), 'skin', subsurf=0)
    for k in range(5):
        a = TAU * k / 5 + math.pi / 2
        p = c + V(R * math.cos(a), 0, R * math.sin(a))
        out = V(math.cos(a), 0, math.sin(a))
        tg = V(-math.sin(a), 0, math.cos(a))
        b.part('slot%d' % k, ellipsoid(p, tg * 0.075, Y * 0.045, out * 0.045, 10, 6), 'slot', subsurf=1, M=MR)
        for j, y in enumerate((-0.035, 0.035)):
            jc = p + Y * y - out * 0.005
            b.part('jingle%d_%d' % (k, j), ellipsoid(jc, tg * 0.062, Y * 0.012, out * 0.062, 14, 8), 'jingle', subsurf=1, M=MR)
    # the face on the skin stays upright while the hoop spins
    rad = (R - 0.05, D / 2 + 0.01, R - 0.05)
    for side, x in (('r', 0.12), ('l', -0.13)):
        ec = c + V(x, -D / 2 - 0.03, 0.08)
        b.eye(side, ec, -Y, 0.09, shut=P.get('shut', False), lid=P['lid'], lid_mat='skin', dazed=P.get('dazed', False),
              pupil=0.5, look=Vector((0.4, -1.0, -0.2)))
    style = P['mouth']
    y = -D / 2 - 0.03
    if style == 'o':
        b.part('mouth', ellipsoid(c + V(0.0, y, -0.12), X * 0.045, Z * 0.05, Y * 0.02, 12, 8), 'mouth')
    else:
        path = []
        for k in range(11):
            u = k / 10
            x = lerp(-0.14, 0.14, u)
            if style == 'grin':
                z = -0.10 - 0.09 * math.sin(math.pi * u)
            elif style == 'wobble':
                z = -0.12 + 0.02 * math.sin(3 * math.pi * u)
            else:
                z = -0.12
            path.append(c + V(x, y, z))
        b.part('mouth', tube(path, 0.016, seg=8), 'mouth')
        if style == 'grin':
            b.part('grin_fill', flat_poly([c + V(lerp(-0.14, 0.14, k / 10), y + 0.005, -0.10 - 0.085 * math.sin(math.pi * k / 10)) for k in range(11)], 0.01), 'mouth', subsurf=0, smooth=False)


# ================================================================= jaguar
JAGUAR = {
    'walk':      dict(sx=1.0, sz=1.0, lean=0, lid=0.12, mouth='smile', feet='walk', ears='up', hurt=False),
    'hurt_walk': dict(sx=1.0, sz=1.0, lean=0, lid=0.12, mouth='wobble', feet='walk', ears='droop', hurt=True),
    'notice':    dict(sx=0.95, sz=1.08, lean=-10, lid=0.0, eye=1.15, pupil=0.4, mouth='o', feet='stand', ears='alert', hurt=False),
    'charge':    dict(sx=1.07, sz=0.88, lean=6, lid=0.3, mouth='open', feet='charge', ears='flat', angry=True, teeth=True, hurt=False),
    'stun':      dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', ears='droop', dazed=True, hurt=False),
    'flat':      dict(sx=1.1, sz=0.4, lean=0, lid=1.0, mouth='flat', feet='flat', ears='flat', shut=True, hurt=False),
    'ko':        dict(sx=1.0, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp', ears='droop', shut=True, hurt=False),
}
JAG_EARS = {'up': V(-0.03, -0.05, 0.17), 'alert': V(0.02, -0.02, 0.19), 'flat': V(-0.18, -0.04, 0.03), 'droop': V(-0.08, -0.12, 0.05)}
ROSETTES = [(0.15, -1.25, 0.35), (-0.05, -1.3, 0.75), (-0.25, -1.2, 0.3), (-0.35, -1.35, 0.8), (0.0, -1.5, -0.15),
            (-0.2, -1.55, -0.3), (0.28, -1.5, -0.2), (-0.4, -1.1, -0.35), (0.1, -1.0, 1.1), (-0.28, -0.9, 1.2), (-0.12, -1.35, 0.25)]


def quad_legs(b, P, t, hips, foot_z, leg_r, foot_r, mat, A=0.12, H=0.07):
    for name, hip in hips.items():
        stance = P['feet']
        dx = dz = 0.0
        front = name[0] == 'f'
        y = hip.y
        if stance == 'walk':
            dx, dz = gait(t, PHASE[name], A, H)
        elif stance == 'flat':
            dx = 0.2 if front else -0.2
            y *= 1.4
        elif stance == 'charge':
            dx = 0.2 if front else -0.22
            dz = 0.02 if front else 0.0
        elif stance == 'limp':
            dx = 0.1 if front else -0.08
            dz = 0.02
        elif stance == 'stand':
            dx = 0.03 if front else -0.03
        foot = V(hip.x + dx, y, foot_z + dz)
        knee = (hip + foot) / 2 + V(dz * 0.8 + (0.03 if front else -0.03), 0, 0)
        b.part('leg_' + name, tube([hip, knee, foot], leg_r, leg_r * 0.9, seg=10), mat)
        b.part('foot_' + name, ellipsoid(foot, X * foot_r[0], Y * foot_r[1], Z * foot_r[2], seg=12, rows=8), mat)


def build_jaguar(b, pose, t, P):
    fur = 'fur_hurt' if P['hurt'] else 'fur'
    bc, brad = V(-0.08, 0, 0.56), (0.48, 0.23, 0.25)
    b.part('body', blob(bc, *brad, seg=28, rows=14), fur)
    b.part('belly', ellipsoid(bc + Z * 0.004, X * brad[0] * 0.98, Y * brad[1] * 1.01, -Z * brad[2] * 1.02, seg=24, rows=6, phi1=math.radians(55)), 'cream')
    # neck + head
    nod = 4 * math.sin(TAU * t) if pose in ('walk', 'hurt_walk') else 0.0
    MH = about((0.34, 0, 0.66), rot_y(nod))
    b.part('neck', tube([V(0.28, 0, 0.62), V(0.42, 0, 0.7)], 0.19, 0.18, seg=16), fur, M=b.M @ MH)
    hc, hrad = V(0.50, 0, 0.72), (0.23, 0.21, 0.21)
    b.part('head', blob(hc, *hrad, seg=24, rows=14), fur, M=b.M @ MH)
    mc, mrad = V(0.68, 0, 0.64), (0.13, 0.12, 0.09)
    b.part('muzzle', blob(mc, *mrad, seg=16, rows=10), 'cream', M=b.M @ MH)
    b.part('nose', ellipsoid(V(0.80, 0, 0.68), X * 0.035, Y * 0.045, Z * 0.03, 10, 6), 'nose', M=b.M @ MH)
    # round ears with dark backs
    for side, y in (('l', -0.13), ('r', 0.13)):
        base = V(0.42, y, 0.88)
        off = JAG_EARS[P['ears']].copy()
        if side == 'r':
            off.y = -off.y
        tip = base + off
        d = off.normalized()
        ax, ay = perp_frame(d)
        ec = base + d * 0.08
        b.part('ear_' + side, ellipsoid(ec, ax * 0.07, ay * 0.06, d * 0.1, 12, 8), fur, M=b.M @ MH)
        b.part('ear_in_' + side, ellipsoid(ec + ay * 0.0 - Y * 0.0 + (X * 0.5 - Y * 0.6).normalized() * 0.03, ax * 0.045, ay * 0.035, d * 0.065, 10, 6), 'ear', M=b.M @ MH)
    # eyes (the camera-side one squints when hurt), brows when charging
    er = 0.075 * P.get('eye', 1.0)
    for side, az in (('r', -0.42), ('l', -1.15)):
        p, n = on_ellipsoid(hc, hrad, az, 0.25)
        lid = P['lid']
        if P['hurt'] and side == 'l':
            lid = 0.6
        b.eye(side, p - n * 0.02, n, er, shut=P.get('shut', False), lid=lid, lid_mat=fur, dazed=P.get('dazed', False),
              pupil=P.get('pupil', 0.5), M=b.M @ MH)
        if P.get('angry'):
            b.brow(side, p - n * 0.02, n, er, M=b.M @ MH)
    style = P['mouth']
    if style == 'open':
        b.mouth_on(mc, mrad, 'open', -0.5, -1.3, -0.3, M=b.M @ MH)
        for k, x in enumerate((0.70, 0.76)):
            b.part('tooth%d' % k, cone(V(x, -0.085, 0.60), V(x + 0.005, -0.09, 0.545), 0.02, seg=8), 'tooth', subsurf=1, M=b.M @ MH)
    elif style == 'o':
        b.mouth_on(mc, mrad, 'o', -0.5, -1.3, -0.3, M=b.M @ MH)
    else:
        b.mouth_on(mc, mrad, style, -0.35, -1.4, -0.25, r=0.013, M=b.M @ MH)
    if P['hurt']:
        p, n = on_ellipsoid(mc, mrad, -0.9, -0.45)
        ax, ay = perp_frame(n)
        b.part('tongue', ellipsoid(p + n * 0.01 - Z * 0.03, ax * 0.03, ay * 0.045, n * 0.02, 10, 6), 'tongue', M=b.M @ MH)
        b.part('bump', sphere(V(0.44, -0.04, 0.95), 0.06, 12, 8), 'bump', M=b.M @ MH)
    # rosettes: dark rings on the camera-side flank (and little solid spots on the head)
    for k, (x, az, el) in enumerate(ROSETTES):
        # at flank station x, the cross-section is an ellipse scaled by kx; az / el pick the point around it
        kx = math.sqrt(max(0.05, 1 - (x / brad[0]) ** 2))
        p = V(bc.x + x, bc.y + brad[1] * kx * math.sin(az) * math.cos(el), bc.z + brad[2] * kx * math.sin(el))
        n = V((p.x - bc.x) / brad[0] ** 2, (p.y - bc.y) / brad[1] ** 2, (p.z - bc.z) / brad[2] ** 2).normalized()
        b.part('rosette%d' % k, torus_bm(p + n * 0.004, n, 0.04, 0.012, seg=14, sides=6), 'spot', subsurf=1)
    for k, (az, el) in enumerate(((-0.9, 0.85), (-1.5, 0.5), (-0.2, 0.95))):
        p, n = on_ellipsoid(hc, hrad, az, el)
        ax, ay = perp_frame(n)
        b.part('headspot%d' % k, ellipsoid(p + n * 0.003, ax * 0.03, ay * 0.025, n * 0.012, 8, 6), 'spot', subsurf=1, M=b.M @ MH)
    if P['hurt']:      # a crossed bandage on the shoulder
        for k, ang in enumerate((40, -40)):
            bm = box_bm((0.2, 0.03, 0.055))
            p, n = on_ellipsoid(bc, brad, -1.3, 0.2)
            p = V(0.18, p.y, p.z)
            b.part('bandage%d' % k, xf(bm, tr(p + n * 0.01) @ rot_y(ang)), 'bandage', subsurf=0, smooth=False)
    # tail: long, curving up, dark tip
    if pose in ('ko', 'flat'):
        path = [V(-0.52, 0, 0.5), V(-0.66, 0, 0.42), V(-0.78, 0, 0.3), V(-0.84, 0, 0.12)]
    elif pose == 'charge':
        path = [V(-0.52, 0, 0.56), V(-0.68, 0, 0.62), V(-0.82, 0, 0.64), V(-0.9, 0, 0.6)]
    else:
        wag = 0.06 * math.sin(TAU * t)
        path = [V(-0.52, 0, 0.58), V(-0.68, 0.03, 0.7), V(-0.78, 0.06, 0.88 + wag), V(-0.74, 0.08, 1.02 + wag)]
    b.part('tail', tube(path, 0.05, 0.03, seg=10), fur)
    b.part('tail_tip', sphere(path[-1], 0.045, 10, 6), 'spot', subsurf=1)
    hips = {'fl': V(0.26, -0.14, 0.42), 'fr': V(0.26, 0.14, 0.42), 'bl': V(-0.34, -0.14, 0.42), 'br': V(-0.34, 0.14, 0.42)}
    quad_legs(b, P, t, hips, 0.05, 0.065, (0.095, 0.07, 0.05), fur)


# ================================================================= piranha
PIRANHA = {
    'up':   dict(M=lambda t: rot_y(-62 + 4 * math.sin(TAU * t)), ns=1),
    'down': dict(M=lambda t: rot_y(64 + 4 * math.sin(TAU * t)), ns=1),
    'ko':   dict(M=lambda t: rot_x(180) @ rot_y(14), ns=-1),
}


def build_piranha(b, pose, t, P):
    ns = P['ns']
    wag = math.sin(TAU * t) if pose != 'ko' else 0.0
    pts = [(0.34, 0.000, 1.0, 1.0), (0.30, 0.10, 1.05, 0.65), (0.18, 0.19, 1.25, 0.62), (0.04, 0.22, 1.3, 0.6),
           (-0.10, 0.195, 1.25, 0.6), (-0.22, 0.12, 1.1, 0.6), (-0.30, 0.055, 1.0, 0.6), (-0.33, 0.000, 1.0, 1.0)]
    ctrl = []
    for x, r, kz, ky in pts:
        w = max(0.0, -x - 0.05) / 0.3
        ctrl.append((x, 0.05 * wag * w * w, 0.0, r, kz, ky))
    sp = Spine(ctrl)
    b.part('body', sp.mesh(rings=24, seg=22), 'body')

    def belly(u, w):
        v = 0.06 + 0.72 * u
        a = math.pi * (0.58 + 0.84 * w)
        return sp.point(v, a)
    b.part('belly', sheet(belly, 8, 6, 0.012), 'belly')
    # forked tail, dorsal and anal fins, camera-side pectoral
    pivot = V(-0.31, 0.04 * wag, 0.0)
    T = tr(pivot) @ rot_z(24 * wag)

    def tail(u, w):
        ww = w * 2 - 1
        x = -u * (0.22 - 0.08 * (1 - abs(ww)) * u)
        return T @ V(x, 0.0, ww * (0.04 + 0.15 * u))
    b.part('tail', sheet(tail, 6, 6, lambda u, w: 0.012 * (1 - abs(w * 2 - 1)) * (1 - 0.6 * u) + 0.004), 'fin')

    def dorsal(u, w):
        x = 0.0 - 0.24 * u
        v = (0.34 - x) / 0.67
        c, n, s, r, kz, ky = sp.frame(v)
        h = 0.09 * math.sin(math.pi * u) ** 0.6 + 0.01
        return c + n * (r * kz - 0.02 + w * h) - X * 0.04 * w
    b.part('dorsal', sheet(dorsal, 6, 3, lambda u, w: 0.012 * (1 - w) + 0.004), 'fin')

    def anal(u, w):
        x = -0.06 - 0.18 * u
        v = (0.34 - x) / 0.67
        c, n, s, r, kz, ky = sp.frame(v)
        h = 0.06 * math.sin(math.pi * u) ** 0.6 + 0.01
        return c - n * (r * kz - 0.02 + w * h) - X * 0.03 * w
    b.part('anal', sheet(anal, 5, 3, lambda u, w: 0.01 * (1 - w) + 0.004), 'fin')
    pc = V(0.06, -0.11 * ns, -0.07)
    pd = Vector((-0.7, -0.4 * ns, -0.5)).normalized()
    px, py = perp_frame(pd)
    b.part('pectoral', ellipsoid(pc + pd * 0.05, px * 0.025, py * 0.05, pd * 0.09, 10, 6), 'fin')
    # a wide open mouth full of teeth at the nose
    mc = V(0.315, 0, -0.03)
    b.part('mouth', ellipsoid(mc, X * 0.1, Y * 0.095, Z * 0.115, 14, 10), 'mouth')
    for k in range(4):
        y = -0.055 * ns - 0.012 * k * ns
        x = 0.40 - 0.045 * k
        zt = 0.095 - 0.012 * k
        b.part('tooth_u%d' % k, cone(V(x, y, zt + 0.02), V(x - 0.012, y, zt - 0.055), 0.018, seg=6), 'tooth', subsurf=1)
        b.part('tooth_l%d' % k, cone(V(x - 0.012, y, -zt - 0.03), V(x, y, -zt + 0.05), 0.018, seg=6), 'tooth', subsurf=1)
    # one big angry eye on the camera side (and a far one peeking over)
    for side, a in (('l', ns * -1.35), ('r', ns * 1.35)):
        v = 0.16
        c, n = sp.point(v, a), sp.normal(v, a)
        b.eye(side, c - n * 0.025, n, 0.09, shut=pose == 'ko', pupil=0.42, lid=0.0,
              look=Vector((0.6, -0.8 * ns, -0.1)))
        if pose != 'ko':
            up = (Z - n * n.z).normalized()
            s = up.cross(n)
            a0 = c + n * 0.05 + up * 0.075 + s * 0.08
            a1 = c + n * 0.05 + up * 0.105 - s * 0.06
            b.part('brow_' + side, tube([a0, a0.lerp(a1, 0.5), a1], 0.018, seg=8), 'brow')


# ================================================================= coin (pao de queijo)
COIN = {'spin': dict(M=lambda t: rot_z(360 * t))}


def build_coin(b, pose, t, P):
    rad = (0.30, 0.30, 0.255)
    b.part('crust', blob((0, 0, 0), *rad, seg=28, rows=16), 'crust')
    b.part('top', ellipsoid(V(0, 0, 0.004), X * rad[0] * 1.0, Y * rad[1] * 1.0, Z * rad[2] * 1.015, seg=28, rows=6, phi1=math.radians(48)), 'top')
    # pale cracks where the crust split, and a few toasted freckles
    for k, (az, el, rot) in enumerate(((-0.6, 0.25, 0.3), (1.6, 0.15, -0.5), (3.3, 0.3, 0.9), (-2.2, -0.05, 0.1))):
        p, n = on_ellipsoid((0, 0, 0), rad, az, el)
        ax, ay = perp_frame(n)
        d1 = ax * math.cos(rot) + ay * math.sin(rot)
        d2 = ay * math.cos(rot) - ax * math.sin(rot)
        b.part('crack%d' % k, ellipsoid(p - n * 0.006, d1 * 0.13, d2 * 0.045, n * 0.032, 12, 6), 'crack', subsurf=1)
    for k, (az, el) in enumerate(((0.3, -0.35), (-1.3, 0.55), (2.4, -0.3), (-2.9, 0.6), (1.0, 0.7), (-0.2, 0.5))):
        p, n = on_ellipsoid((0, 0, 0), rad, az, el)
        ax, ay = perp_frame(n)
        b.part('toast%d' % k, ellipsoid(p + n * 0.002, ax * 0.03, ay * 0.03, n * 0.012, 8, 6), 'toast', subsurf=1)


# ================================================================= star (golden toucan)
STAR = {'idle': dict(M=lambda t: tr(0, 0, 0.035 * math.sin(TAU * t)))}


def build_star(b, pose, t, P):
    bc, brad = V(-0.08, 0, -0.06), (0.22, 0.2, 0.25)
    b.part('body', blob(bc, *brad, seg=22, rows=14), 'gold')
    hc, hrad = V(0.10, 0, 0.2), (0.17, 0.16, 0.16)
    b.part('head', blob(hc, *hrad, seg=20, rows=12), 'gold')
    # the enormous beak, curving down to a darker tip
    beak = [V(0.22, 0, 0.2), V(0.36, 0, 0.19), V(0.48, 0, 0.15), V(0.56, 0, 0.09)]
    b.part('beak', tube(beak, 0.0, seg=14, radii=[0.1, 0.095, 0.07, 0.03]), 'beak')
    b.part('beak_tip', tube([V(0.5, 0, 0.135), V(0.58, 0, 0.08)], 0.055, 0.02, seg=12), 'beak_tip')
    b.part('beak_line', tube([V(0.25, -0.07, 0.17), V(0.4, -0.065, 0.16), V(0.5, -0.045, 0.12)], 0.008, seg=6), 'beak_tip', subsurf=1)
    for side, az in (('r', -0.5), ('l', -1.25)):
        p, n = on_ellipsoid(hc, hrad, az, 0.3)
        b.eye(side, p - n * 0.015, n, 0.058, pupil=0.5, lid=0.1, lid_mat='gold', look=Vector((0.5, -0.85, -0.1)))
    # fluttering wings and a stubby tail
    flap = 40 + 18 * math.sin(TAU * t)
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(-0.06, 0.1 * side, 0.02), side, flap, 20)

        def wing(u, v, W=W):
            span = 0.26 * u
            le = 0.08 - 0.03 * u
            te = -0.12 - 0.03 * u + 0.03 * math.sin(3 * math.pi * u) ** 2
            return W @ V(lerp(le, te, v), span, 0.0)
        b.part('wing_' + side_name, sheet(wing, 8, 4, lambda u, v: 0.014 - 0.007 * u), 'wing')
    for k, y in enumerate((-0.05, 0.0, 0.05)):
        b.part('tail%d' % k, ellipsoid(V(-0.33, y, -0.14), X * 0.1, Y * 0.025, Z * 0.035, 10, 6), 'wing')
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('foot_' + side_name, ellipsoid(V(0.0, 0.07 * side, -0.31), X * 0.05, Y * 0.025, Z * 0.018, 8, 6), 'feet', subsurf=1)
    # a sparkle (unlit) twinkling by the beak
    s = 0.06 + 0.02 * math.sin(2 * TAU * t)
    sc = V(0.46, -0.12, 0.33)
    pts = [sc + V(s, 0, 0), sc + V(0.012, 0, 0.012), sc + V(0, 0, s), sc + V(-0.012, 0, 0.012), sc + V(-s, 0, 0),
           sc + V(-0.012, 0, -0.012), sc + V(0, 0, -s), sc + V(0.012, 0, -0.012)]
    b.part('sparkle', flat_poly(pts, 0.01), 'sparkle_glow', subsurf=0, smooth=False)


# ================================================================= qblock / used (carnival feather box)
QBLOCK = {'idle': dict(M=lambda t: tr(0, 0, 0.0))}
USED = {'idle': dict(M=lambda t: Matrix.Identity(4))}
FEATHER_MATS = ['f_red', 'f_orange', 'f_yellow', 'f_green', 'f_blue']


def feather(base, d, length, width, mat, b, name, quill_mat='quill'):
    """One plume: a flattened elongated ellipsoid (facing the camera) with a pale quill down its middle."""
    d = d.normalized()
    side = Y.cross(d).normalized()
    c = base + d * length * 0.55
    b.part(name, ellipsoid(c, d * length * 0.55, side * width, Y * 0.02, 12, 8), mat)
    b.part(name + '_quill', tube([base, base + d * length * 0.5, base + d * length * 0.9], 0.012, 0.006, seg=6), quill_mat, subsurf=1)


def build_qblock(b, pose, t, P):
    W, D, H = 1.0, 0.9, 0.95
    b.part('box', box_bm((W, D, H), bevel=0.05), 'paper', subsurf=0)
    # the gold frame on the camera face and a gold star in the middle
    y = -D / 2 - 0.012
    fw, fh, bar = W / 2 - 0.08, H / 2 - 0.08, 0.045
    for k, (cx, cz, sx, sz) in enumerate(((0, fh, fw * 2 + bar, bar), (0, -fh, fw * 2 + bar, bar), (fw, 0, bar, fh * 2), (-fw, 0, bar, fh * 2))):
        b.part('frame%d' % k, xf(box_bm((sx, 0.03, sz)), tr(cx, y, cz)), 'gold', subsurf=0, smooth=False)
    b.part('star', flat_poly(star_poly(V(0, y - 0.01, -0.06), 0.24, 0.105), 0.03), 'gold', subsurf=0, smooth=False)
    for k, (x, z) in enumerate(((-0.33, -0.3), (0.33, 0.28))):
        b.part('glint%d' % k, xf(box_bm((0.06, 0.02, 0.06)), tr(x, y - 0.01, z)), 'quill', subsurf=0, smooth=False)
    # the fan of plumes on the lid, swaying with t
    top = V(0, -0.05, H / 2 - 0.02)
    for k in range(5):
        ang = -0.9 + k * 0.45 + 0.08 * math.sin(TAU * t + k)
        d = V(math.sin(ang), 0, math.cos(ang))
        feather(top + V(0.06 * (k - 2), 0.0, 0.0), d, 0.44 + 0.06 * (1 - abs(k - 2) / 2), 0.085, FEATHER_MATS[k], b, 'plume%d' % k)
    b.part('lid_band', xf(box_bm((0.5, 0.2, 0.06)), tr(0, -0.05, H / 2 + 0.01)), 'gold', subsurf=0, smooth=False)


def build_used(b, pose, t, P):
    W, D, H = 1.0, 0.9, 0.95
    b.part('box', box_bm((W, D, H * 0.97), bevel=0.05), 'card', subsurf=0)
    y = -D / 2 - 0.012
    fw, fh, bar = W / 2 - 0.08, H / 2 - 0.08, 0.04
    for k, (cx, cz, sx, sz) in enumerate(((0, fh, fw * 2 + bar, bar), (0, -fh, fw * 2 + bar, bar), (fw, 0, bar, fh * 2), (-fw, 0, bar, fh * 2))):
        b.part('frame%d' % k, xf(box_bm((sx, 0.03, sz)), tr(cx, y, cz)), 'rim', subsurf=0, smooth=False)
    # two broken quills drooping off the lid, the plumes long gone
    top = V(0, -0.05, H * 0.97 / 2)
    for k, (x, dx) in enumerate(((-0.12, -0.2), (0.14, 0.22))):
        path = [top + V(x, 0, 0), top + V(x + dx * 0.5, 0, 0.1), top + V(x + dx, 0, 0.05)]
        b.part('quill%d' % k, tube(path, 0.014, 0.008, seg=6), 'quill', subsurf=1)
    b.part('lid_band', xf(box_bm((0.5, 0.2, 0.05)), tr(0, -0.05, H * 0.97 / 2 + 0.01)), 'rim', subsurf=0, smooth=False)


# ================================================================= coati (custom class BrCoati: steals coins, then flees)
COATI = {
    'walk': dict(sx=1.0, sz=1.0, lean=0, lid=0.15, mouth='smile', feet='walk', tail='up'),
    'flee': dict(sx=1.06, sz=0.93, lean=7, lid=0.4, mouth='grin', feet='walk', tail='back', fast=True),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', tail='droop', dazed=True),
    'flat': dict(sx=1.1, sz=0.4, lean=0, lid=1.0, mouth='flat', feet='flat', tail='flat', shut=True),
    'ko':   dict(sx=1.0, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp', tail='droop', shut=True),
}


def ringed_tail(b, path, r0, r1, n=9, mats=('fur_dark', 'cream')):
    """A tail of n short tube segments along a Catmull-Rom path, alternating ring colours."""
    pts = [tuple(p) for p in path]
    for k in range(n):
        u0, u1 = k / n, (k + 1) / n
        a, m, c = (Vector(catmull(pts, u)) for u in (u0, (u0 + u1) / 2, u1))
        ra, rc = lerp(r0, r1, u0), lerp(r0, r1, u1)
        if k % 2:      # the pale rings sit a touch proud so the bands read at game size
            ra, rc = ra * 1.1, rc * 1.1
        b.part('tail%d' % k, tube([a - (m - a) * 0.15, m, c + (c - m) * 0.15], ra, rc, seg=10), mats[k % 2])
    b.part('tail_tip', sphere(Vector(catmull(pts, 1.0)), r1 * 1.05, 10, 6), mats[(n - 1) % 2], subsurf=1)


def build_coati(b, pose, t, P):
    fast = P.get('fast', False)
    bc, brad = V(-0.05, 0, 0.36), (0.36, 0.17, 0.17)
    b.part('body', blob(bc, *brad, seg=24, rows=12), 'fur')
    b.part('belly', ellipsoid(bc + Z * 0.004, X * brad[0] * 0.97, Y * brad[1] * 1.01, -Z * brad[2] * 1.02, seg=22, rows=6, phi1=math.radians(55)), 'cream')
    nod = (6 if fast else 4) * math.sin(TAU * t) if pose in ('walk', 'flee') else 0.0
    MH = b.M @ about(V(0.26, 0, 0.42), rot_y(nod))
    b.part('neck', tube([V(0.2, 0, 0.4), V(0.32, 0, 0.45)], 0.13, 0.12, seg=14), 'fur', M=MH)
    hc, hrad = V(0.36, 0, 0.47), (0.15, 0.13, 0.13)
    b.part('head', blob(hc, *hrad, seg=20, rows=12), 'fur', M=MH)
    # the long, slightly upturned snout with its dark rubbery tip, cream cheek and brow marks
    snout = [V(0.44, 0, 0.45), V(0.56, 0, 0.42), V(0.68, 0, 0.42)]
    b.part('snout', tube(snout, 0.0, seg=12, radii=[0.08, 0.06, 0.04]), 'fur', M=MH)
    b.part('nose', sphere(V(0.71, 0, 0.43), 0.042, 12, 8), 'nose', M=MH)
    b.part('muzzle', tube([V(0.45, -0.05, 0.4), V(0.58, -0.035, 0.395)], 0.03, 0.02, seg=8), 'cream', subsurf=1, M=MH)
    for side, y in (('l', -0.08), ('r', 0.08)):
        b.part('ear_' + side, ellipsoid(V(0.29, y, 0.6), X * 0.04, Y * 0.045, Z * 0.05, 10, 6), 'fur_dark', M=MH)
        b.part('ear_in_' + side, ellipsoid(V(0.305, y * 1.05, 0.6), X * 0.02, Y * 0.03, Z * 0.035, 8, 5), 'cream', subsurf=1, M=MH)
    for side, az in (('r', -0.45), ('l', -1.2)):
        p, n = on_ellipsoid(hc, hrad, az, 0.22)
        b.part('mark_' + side, ellipsoid(p - n * 0.005 + Z * 0.045, perp_frame(n)[0] * 0.05, perp_frame(n)[1] * 0.025, n * 0.02, 10, 6), 'cream', subsurf=1, M=MH)
        b.eye(side, p - n * 0.015, n, 0.055, shut=P.get('shut', False), lid=P['lid'], lid_mat='fur', dazed=P.get('dazed', False),
              pupil=0.55, look=Vector((0.55, -0.8, 0.0)), M=MH)
    if P['mouth'] in ('o', 'open'):
        b.mouth_on(hc, hrad, 'o', -0.35, -0.9, -0.4, M=MH)
    else:
        b.mouth_on(hc, hrad, 'grin' if P['mouth'] == 'grin' else P['mouth'], -0.15, -1.1, -0.38, r=0.012, M=MH)
    # the ringed tail: held up like a flag on the prowl, streaming back when it bolts
    sway = 0.04 * math.sin(TAU * t)
    tails = {
        'up':    [V(-0.36, 0, 0.42), V(-0.5, 0, 0.6), V(-0.52 + sway, 0, 0.84), V(-0.44 + sway * 1.5, 0, 1.02)],
        'back':  [V(-0.36, 0, 0.42), V(-0.58, 0, 0.5), V(-0.8, 0, 0.58 + sway), V(-0.98, 0, 0.66 + sway)],
        'droop': [V(-0.36, 0, 0.4), V(-0.52, 0, 0.32), V(-0.66, 0, 0.18), V(-0.72, 0, 0.06)],
        'flat':  [V(-0.36, 0, 0.36), V(-0.6, 0, 0.3), V(-0.84, 0, 0.26), V(-1.0, 0, 0.24)],
    }
    ringed_tail(b, tails[P['tail']], 0.065, 0.04)
    hips = {'fl': V(0.2, -0.1, 0.27), 'fr': V(0.2, 0.1, 0.27), 'bl': V(-0.28, -0.1, 0.27), 'br': V(-0.28, 0.1, 0.27)}
    quad_legs(b, P, t, hips, 0.035, 0.045, (0.065, 0.045, 0.035), 'fur_dark', A=0.15 if fast else 0.09, H=0.09 if fast else 0.05)


# ================================================================= toucanito (O Tucanao's flock minion)
TOUCANITO = {
    'fly':   dict(flap=lambda t: 45 * math.cos(TAU * t), sweep=10, M=lambda t: tr(-0.1, 0, 0.02 * math.sin(TAU * t)), ns=1),
    'swoop': dict(flap=lambda t: 20, sweep=50, M=lambda t: tr(-0.1, 0, 0) @ rot_y(24), ns=1),
    'stun':  dict(flap=lambda t: -60, sweep=4, M=lambda t: tr(-0.1, 0, 0) @ rot_y(-8), ns=1, dazed=True),
    'ko':    dict(flap=lambda t: -68, sweep=10, M=lambda t: tr(-0.1, 0, 0) @ rot_x(180) @ rot_y(-12), ns=-1),
}


def build_toucanito(b, pose, t, P):
    ns = P['ns']
    pts = [(0.2, 0.00, 1.0, 1.0), (0.17, 0.1, 1.0, 1.0), (0.05, 0.15, 1.05, 1.0), (-0.1, 0.14, 1.0, 1.0),
           (-0.22, 0.09, 1.0, 0.85), (-0.3, 0.0, 1.0, 1.0)]
    sp = Spine([(x, 0.0, 0.0, r, kz, ky) for x, r, kz, ky in pts])
    b.part('body', sp.mesh(rings=18, seg=18), 'body')
    hc = V(0.2, 0, 0.1) if pose != 'swoop' else V(0.23, 0, 0.06)
    head_r = (0.13, 0.12, 0.12)
    b.part('head', blob(hc, *head_r, seg=18, rows=12), 'body')
    # the cream bib on the throat and chest, red under the tail
    b.part('bib', ellipsoid(hc + V(0.04, 0, -0.06), X * 0.11, Y * 0.105, Z * 0.1, 16, 10), 'bib')
    b.part('undertail', blob((-0.2, 0, -0.08), 0.08, 0.06, 0.05, 12, 8), 'under')
    # the huge orange beak with a yellow ridge and a dark tip, curving down
    bd = (X - Z * 0.1).normalized()
    b0 = hc + V(0.1, 0, 0.0)
    beak = [b0, b0 + bd * 0.13, b0 + bd * 0.26 - Z * 0.02, b0 + bd * 0.36 - Z * 0.06]
    b.part('beak', tube(beak, 0.0, seg=14, radii=[0.085, 0.08, 0.055, 0.02]), 'beak')
    b.part('beak_ridge', tube([p + Z * (0.07 - 0.02 * k) for k, p in enumerate(beak[:3])], 0.0, seg=10, radii=[0.035, 0.03, 0.02]), 'beak_top', subsurf=1)
    b.part('beak_tip', tube([beak[2] + bd * 0.04, beak[3]], 0.045, 0.02, seg=10), 'beak_tip', subsurf=1)
    for side, az in (('r', -0.45), ('l', -1.2)):
        c, n = on_ellipsoid(hc, head_r, az * ns, 0.3)
        b.part('ring_' + side, torus_bm(c - n * 0.006, n, 0.04, 0.011, seg=14, sides=6), 'eye_ring', subsurf=1)
        b.eye(side, c - n * 0.012, n, 0.045, shut=pose == 'ko', pupil=0.55, lid=0.45 if pose == 'stun' else 0.1, lid_mat='body',
              dazed=P.get('dazed', False), look=Vector((0.5, -0.85, -0.1)))
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(-0.02, 0.1 * side, 0.08), side, flap, sweep)

        def wing(u, v, W=W):
            span = 0.36 * u
            le = 0.1 - 0.1 * u * u
            chord = 0.24 * (1 - 0.55 * u)
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.024 - 0.01 * u), 'wing')

    def tail(u, v):
        return V(-0.27 - 0.2 * u, (v * 2 - 1) * (0.05 + 0.03 * u), 0.02 - 0.03 * u)
    b.part('tail', sheet(tail, 4, 4, 0.014), 'body')
    for side_name, side in (('l', -1), ('r', 1)):
        y = 0.05 * side
        path = [V(0.0, y, -0.1), V(-0.06, y, -0.16), V(-0.1, y, -0.18)] if pose not in ('stun', 'ko') else [V(0.0, y, -0.1), V(0.02, y, -0.19), V(0.05, y, -0.23)]
        b.part('leg_' + side_name, tube(path, 0.018, 0.014, seg=8), 'leg')
        b.part('foot_' + side_name, ellipsoid(path[-1] + X * 0.025, X * 0.04, Y * 0.025, Z * 0.012, 10, 6), 'leg', subsurf=1)


# ---------------------------------------------------------------- public API
FEET_BUILDERS = {'crab': (build_crab, CRAB), 'coconut': (build_coconut, COCONUT), 'brigadeiro': (build_brigadeiro, BRIGADEIRO),
                 'pandeiro': (build_pandeiro, PANDEIRO), 'jaguar': (build_jaguar, JAGUAR), 'coati': (build_coati, COATI)}
CENTRE_BUILDERS = {'toucanito': (build_toucanito, TOUCANITO), 'gull': (build_gull, GULL), 'piranha': (build_piranha, PIRANHA), 'coin': (build_coin, COIN),
                   'star': (build_star, STAR), 'qblock': (build_qblock, QBLOCK), 'used': (build_used, USED)}


def build(kind, pose, t=0.0):
    """Build one kind in the given pose (fresh geometry every call) and return its root Empty."""
    if kind not in KINDS:
        raise ValueError('unknown kind %r; one of %s' % (kind, KINDS))
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s; one of %s' % (pose, kind, POSES[kind]))
    if kind in FEET_BUILDERS:
        fn, table = FEET_BUILDERS[kind]
        P = dict(table[pose])
        bob = 0.0
        if pose in ('walk', 'hurt_walk', 'flee') and kind != 'pandeiro':
            bob = 0.012 * (1 + math.sin(2 * TAU * t))
        elif kind == 'pandeiro' and pose == 'walk':
            bob = 0.02 * abs(math.sin(TAU * t * 2.5))
        M = pose_matrix(P, t, pose, bob)
    else:
        fn, table = CENTRE_BUILDERS[kind]
        P = dict(table[pose])
        M = P['M'](t)
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
    cam.location = (0.0, -4.0, 0.0)
    cam.rotation_euler = (math.pi / 2, 0.0, 0.0)      # looking along +Y
    _link(cam)
    scene.camera = cam
    sun_data = bpy.data.lights.new('sprite_sun', 'SUN')
    sun_data.energy = 3.0
    sun_data.angle = math.radians(12)
    sun = bpy.data.objects.new('sprite_sun', sun_data)
    sun.rotation_euler = (math.radians(55), 0.0, math.radians(35))
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
    cam = bpy.data.objects['sprite_cam']
    cam.location.z = 0.5 if ORIGIN[kind] == 'feet' else 0.0
    cam.data.ortho_scale = 2.2 if kind == 'jaguar' else (2.4 if kind in ('qblock', 'used') else 1.6)
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
    sheet_px = np.zeros((cell, cell * n, 4), dtype=np.float32)
    for i, p in enumerate(paths):
        img = bpy.data.images.load(p)
        img.scale(cell, cell)
        px = np.array(img.pixels[:], dtype=np.float32).reshape(cell, cell, 4)
        sheet_px[:, i * cell:(i + 1) * cell, :] = px
        bpy.data.images.remove(img)
    alpha = sheet_px[..., 3:4]
    sheet_px[..., :3] = sheet_px[..., :3] + (1 - alpha) * 0.35      # mid-grey backdrop so the transparent film reads
    sheet_px[..., 3] = 1.0
    res = bpy.data.images.new('sheet', cell * n, cell, alpha=True)
    res.pixels[:] = sheet_px.ravel().tolist()
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
    return min(xs), max(xs), min(zs), max(zs)


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
            if kind == 'coin':
                ts = [(0.0, ''), (0.125, '_t12'), (0.25, '_t25'), (0.375, '_t37')]
            for t, suffix in ts:
                root, path = render_pose(kind, pose, t, suffix)
                x0, x1, z0, z1 = extent(root)
                print('%-11s %-10s t=%.3f  tris %5d  subdivided %6d  x %.2f..%.2f (%.0f px)  z %.2f..%.2f (%.0f px)  %s' % (
                    kind, pose, t, triangle_count(root), triangle_count(root, True), x0, x1, (x1 - x0) * PX, z0, z1, (z1 - z0) * PX, path))
                outs.append(path)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
        clear(kind)
