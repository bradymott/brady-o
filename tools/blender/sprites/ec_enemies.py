# ec_enemies: the Ecuador tour of Super Brady-O World in the Fiesta Toon look, modelled for the pre-rendered 2D sprite
# pipeline with the same conventions as mx_pepper.py / mx_enemies_a.py / mx_enemies_b.py (all original cartoon
# designs):  Z up, every character FACES +X (screen-right), the sprite camera looks along +Y from -Y, 1 m = 28.1 px.
# Feet-origin kinds stand with their feet on z = 0; centre-origin kinds (the flyer, the swimmers and the items) are
# centred on the origin.  Plain Principled materials (Base Color only, roughness 0.5) named <kind>_<part> so the look
# kit can restyle them (materials with 'glow' in the name render unlit).  Every object is parented to one Empty named
# after the kind and carries obj['sprite_part'].
#
#   banana    a cheeky standing banana with a brown stem, peels open when knocked out      walk(t) stun flat ko
#   cacao     a ridged orange cacao pod that tucks in and tumbles along                    walk(t) curl roll(t) stun flat ko
#   alpaca    a fluffy cream alpaca in a woven scarf that spits (2 hp: shorn when hurt)    walk(t) idle(t) throw(t) stun flat ko
#   condor    a soaring Andean condor: white ruff, pink head, fingered wings               fly(t) swoop stun ko
#   frog      a glowing green canopy frog with blue glow spots and orange toes             walk(t) hop stun flat ko
#   iguana    a marine iguana with a pale crest and a rust flank that sneezes salt         walk(t) idle(t) throw(t) stun flat ko
#   iceCube   a living block of glacier ice on little skates                               walk(t) stun flat ko
#   seaLion   a sleek brown Galapagos sea lion with whiskers                               swim(t) ko
#   penguin   a torpedo Galapagos penguin with the white cheek stripe                      swim(t) ko
#   puffer    a spotted yellow pufferfish (custom class EcPuffer) that swells into a spiky ball  swim(t) puff(4 steps) ko
#   booby     the friendly blue-footed booby (ecBooby, the friend who lends the boots)     idle(t: foot dance) wave(t)
#   coin      the CACAO BEAN: a gold coin with a cacao bean on each face                   spin(t: rotation about Z)
#   star      the GOLDEN TORTOISE: a hovering golden giant tortoise                        idle(t: hover)
#   qblock    the item block: a woven Andean textile cube with white diamond motifs        idle(t: wobble)
#   used      the spent block: the same cube in undyed cloth                               idle
#
# API:  build(kind, pose, t=0.0) -> root Empty named kind (fresh geometry; the kind's previous build is removed)
#       clear() -> removes every hierarchy this module built
#       KINDS, POSES[kind], HEIGHT[kind] (feet kinds), SIZE[kind] (centre kinds), ORIGIN[kind]
# Headless preview of everything (or a few kinds):
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_enemies.py [-- kind ...]
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
PX = 28.1
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/ecen'

KINDS = ['banana', 'cacao', 'alpaca', 'condor', 'frog', 'iguana', 'iceCube', 'seaLion', 'penguin', 'puffer', 'booby',
         'coin', 'star', 'qblock', 'used']
POSES = {
    'banana': ['walk', 'stun', 'flat', 'ko'],
    'cacao': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'alpaca': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],      # (hurt_walk is modelled but the game never asks for it)
    'condor': ['fly', 'swoop', 'stun', 'ko'],
    'frog': ['walk', 'hop', 'stun', 'flat', 'ko'],
    'iguana': ['walk', 'idle', 'throw', 'stun', 'flat', 'ko'],
    'iceCube': ['walk', 'stun', 'flat', 'ko'],
    'seaLion': ['swim', 'ko'],
    'penguin': ['swim', 'ko'],
    'puffer': ['swim', 'puff', 'ko'],
    'booby': ['idle', 'wave'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
# poses whose t parameter is a 0..1 cycle phase
CYCLES = {('banana', 'walk'), ('cacao', 'walk'), ('cacao', 'roll'), ('alpaca', 'walk'), ('alpaca', 'hurt_walk'),
          ('alpaca', 'idle'), ('alpaca', 'throw'), ('condor', 'fly'), ('frog', 'walk'), ('iguana', 'walk'),
          ('iguana', 'idle'), ('iguana', 'throw'), ('iceCube', 'walk'), ('seaLion', 'swim'), ('penguin', 'swim'),
          ('coin', 'spin'), ('star', 'idle'), ('qblock', 'idle'), ('puffer', 'swim'), ('puffer', 'puff'), ('booby', 'idle'),
          ('booby', 'wave')}
# render_country.py frame counts that differ from its defaults: the item blocks are drawn from frame 000 only, and the
# puffer's 'puff' is four inflation steps (25 % .. 100 %) that EcPuffer picks from by how puffed it is
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('puffer', 'puff'): (4, 8)}
ORIGIN = {'banana': 'feet', 'cacao': 'feet', 'alpaca': 'feet', 'frog': 'feet', 'iguana': 'feet', 'iceCube': 'feet',
          'booby': 'feet', 'condor': 'centre', 'seaLion': 'centre', 'penguin': 'centre', 'puffer': 'centre', 'coin': 'centre', 'star': 'centre',
          'qblock': 'centre', 'used': 'centre'}
# nominal standing height (hit box height) for the feet kinds; the frog and the iguana are wider than tall, so they
# take the hit-box width (the renderer's frame box is 2.1 x this: the iguana's tail and sneeze need the room)
HEIGHT = {'booby': 44 / PX, 'banana': 32 / PX, 'cacao': 18 / PX, 'alpaca': 46 / PX, 'frog': 18 / PX, 'iguana': 30 / PX, 'iceCube': 24 / PX}
# nominal size for the centre kinds: the larger hit-box side, so the wide swimmers and the condor's span never clip
SIZE = {'puffer': 34 / PX, 'condor': 34 / PX, 'seaLion': 36 / PX, 'penguin': 26 / PX, 'coin': 17 / PX, 'star': 24 / PX,
        'qblock': 32 / PX, 'used': 32 / PX}
SIZE.update(HEIGHT)

COLORS = {
    'banana_peel': '#ffe04a', 'banana_peel_dark': '#e8c030', 'banana_flesh': '#fff4c0', 'banana_stem': '#6a4a22',
    'banana_eye_white': '#fbfbf2', 'banana_pupil': '#1a1020', 'banana_mouth': '#6a3a18', 'banana_feet': '#6a5a2a',
    'cacao_pod': '#e8902a', 'cacao_ridge': '#c05a18', 'cacao_stem': '#5a3a1a', 'cacao_eye_white': '#fbfbf2',
    'cacao_pupil': '#1a1020', 'cacao_mouth': '#6a2a10', 'cacao_feet': '#5a3a1a',
    'alpaca_fleece': '#f2e8d8', 'alpaca_fleece_dark': '#e0d2bc', 'alpaca_skin': '#e0b0a0', 'alpaca_face': '#f2e8d8',
    'alpaca_nose': '#9a6a5a', 'alpaca_hoof': '#6a5040', 'alpaca_scarf': '#e8323a', 'alpaca_scarf_yellow': '#ffd23a',
    'alpaca_scarf_blue': '#2a6ad8', 'alpaca_eye_white': '#fbfbf2', 'alpaca_pupil': '#1a1020', 'alpaca_mouth': '#7a4a4a',
    'alpaca_spit': '#d8eef4',
    'condor_body': '#24242e', 'condor_wing': '#2e2e3a', 'condor_wing_pale': '#d8d8e0', 'condor_ruff': '#ffffff',
    'condor_head': '#c86a5a', 'condor_beak': '#e8d870', 'condor_beak_tip': '#3a3a44', 'condor_leg': '#8a8a96',
    'condor_eye_white': '#fbfbf2', 'condor_pupil': '#1a1020',
    'frog_body': '#2ae88a', 'frog_belly': '#b8ffd8', 'frog_spot_glow': '#2a6aff', 'frog_toe': '#ff7a2a',
    'frog_eye_white': '#fbfbf2', 'frog_pupil': '#1a1020', 'frog_mouth': '#1a6a44',
    'iguana_skin': '#3a3a44', 'iguana_skin_light': '#52525e', 'iguana_patch': '#8a3a3a', 'iguana_crest': '#8a8a9a',
    'iguana_salt': '#ffffff', 'iguana_eye_white': '#ffffff', 'iguana_pupil': '#1a1020', 'iguana_mouth': '#1e1e26',
    'iceCube_ice': '#c8f0ff', 'iceCube_shine': '#ffffff', 'iceCube_limb': '#5a8ab0', 'iceCube_skate': '#2e3e50',
    'iceCube_crack': '#7ab8dc', 'iceCube_eye_white': '#ffffff', 'iceCube_pupil': '#1a1020', 'iceCube_mouth': '#3a6a90',
    'seaLion_fur': '#8a6a5a', 'seaLion_belly': '#b89a86', 'seaLion_nose': '#2a1a18', 'seaLion_whisker': '#e0d0c0',
    'seaLion_eye_white': '#ffffff', 'seaLion_pupil': '#1a1020', 'seaLion_mouth': '#4a2a28',
    'penguin_body': '#22222e', 'penguin_belly': '#ffffff', 'penguin_beak': '#ffb81a', 'penguin_foot': '#ff9a2a',
    'penguin_eye_white': '#ffffff', 'penguin_pupil': '#1a1020',
    'coin_gold': '#e8b02a', 'coin_gold_dark': '#c8901a', 'coin_bean': '#7a3a1a', 'coin_crease': '#c8642a', 'coin_glint': '#ffffff',
    'star_gold': '#ffd24a', 'star_scute': '#e0a028', 'star_plastron': '#f4c86a', 'star_eye_white': '#ffffff',
    'star_pupil': '#1a1020', 'star_mouth': '#a86a1a',
    'qblock_red': '#e8323a', 'qblock_yellow': '#ffd23a', 'qblock_blue': '#2a6ad8', 'qblock_green': '#2aa85a',
    'qblock_orange': '#ff7a2a', 'qblock_purple': '#8a3ab8', 'qblock_white': '#fff8f0', 'qblock_edge': '#5a1a1a',
    'booby_body': '#8a6a4a', 'booby_wing': '#765638', 'booby_belly': '#ffffff',
    'booby_head': '#f2ece0', 'booby_beak': '#6a8aaa', 'booby_beak_dark': '#34465e',
    'booby_foot': '#2ab4ff', 'booby_foot_dark': '#1a84d8', 'booby_eye_white': '#ffffff', 'booby_pupil': '#1a1020',
    'puffer_body': '#f2d86a', 'puffer_belly': '#fff4c8', 'puffer_spot': '#a8783a', 'puffer_spine': '#c8a03a',
    'puffer_fin': '#e8b84a', 'puffer_lips': '#e8703a', 'puffer_mouth': '#6a2a18', 'puffer_eye_white': '#ffffff',
    'puffer_pupil': '#1a1020',
    'used_cloth': '#a89078', 'used_line': '#7a6450', 'used_thread': '#8a7460',
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
    """Collects the parts of one kind: materials get the kind prefix, geometry gets the pose transform M."""

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


# ================================================================ BANANA (feet, 1.14 m)
BANANA_CTRL = [(0.06, 0.12, 0.00, 1.0), (0.06, 0.16, 0.08, 1.0), (0.02, 0.30, 0.15, 1.0), (-0.04, 0.50, 0.19, 1.0),
               (-0.05, 0.68, 0.19, 1.0), (-0.01, 0.86, 0.15, 1.0), (0.05, 0.99, 0.09, 1.0), (0.08, 1.04, 0.00, 1.0)]
BANANA_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=4, lid=0.15, mouth='grin', feet='walk'),
    'stun': dict(sx=1.03, sz=0.95, lean=-7, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.35, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=1.0, mouth='o', feet='limp', peeled=True),
}


def build_banana(b, pose, t, P):
    sp = VSpine(BANANA_CTRL, lobes=5, depth=0.05)
    surf = sp.surf()
    peeled = P.get('peeled')
    if peeled:
        # the top of the peel has split into three strips that droop down the sides; the pale flesh shows
        b.part('peel', sp.mesh(rings=20, seg=24, v1=0.62), 'peel')
        b.part('flesh', sp.mesh(rings=12, seg=20, v0=0.60, v1=0.97, scale=0.78), 'flesh')
        for k, a in enumerate((-0.35, -1.6, 2.4)):
            c0, n0, r0, ky0 = sp.frame(0.62)
            out = (math.cos(a) * n0 + math.sin(a) * Y).normalized()
            tg = Z.cross(out).normalized()

            def strip(u, w, c0=c0, out=out, tg=tg, r0=r0):
                ang = u * math.radians(150)          # peels outward and down
                p = c0 + out * (r0 + 0.32 * math.sin(ang)) + Z * (0.05 - 0.36 * (1 - math.cos(ang)))
                return p + tg * (w * 2 - 1) * (0.11 - 0.06 * u)
            b.part('strip%d' % k, sheet(strip, 8, 3, 0.012), 'peel' if k != 1 else 'peel_dark')
    else:
        b.part('peel', sp.mesh(rings=26, seg=24), 'peel')
        # a slightly darker ridge stripe on the camera side so the five-sided peel reads
        c, n, r, ky = sp.frame(0.5)
        path = [sp.point(v, -1.9) + sp.normal(v, -1.9) * 0.006 for v in (0.14 + 0.72 * k / 10 for k in range(11))]
        b.part('ridge', tube(path, 0.018, seg=6), 'peel_dark', subsurf=1)
    # stem and the dark tip
    top = sp.frame(1.0)[0]
    b.part('stem', tube([top - Z * 0.03, top + V(0.02, 0, 0.05), top + V(0.03, 0, 0.11)], 0.045, 0.035, seg=10), 'stem')
    bot = sp.frame(0.0)[0]
    b.part('tip', sphere(bot + Z * 0.015, 0.045, seg=12, rows=8), 'stem')
    # face: big eyes on the front belly, a grin below
    for side, a in (('r', -0.32), ('l', -1.25)):
        p, n = surf(0.60, a)
        b.eye(side, p - n * 0.012, n, 0.085, lid=P['lid'], lid_mat='peel', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None)
    b.part('mouth', mouth_bm(surf, P['mouth'], 0.44, math.radians(10), math.radians(-105), scale=1.1), 'mouth')
    biped_legs(b, P, t, (0.03, 0, 0.16), (0.11, 0.065, 0.045), 0.035, 'feet', y=0.1)


BANANA = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.025 * abs(math.sin(TAU * t)) if p == 'walk' else 0.0,
                                                 lean_extra=3 * math.sin(TAU * t) if p == 'walk' else 0.0), P=P)
          for p, P in BANANA_POSE.items()}


# ================================================================ CACAO (feet, 0.64 m)
CACAO_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0, lid=0.15, mouth='smile', feet='walk'),
    'curl': dict(sx=1.00, sz=1.00, lean=14, lid=0.7, mouth='small', feet='tuck'),
    'roll': dict(sx=1.00, sz=1.00, lean=0, lid=1.0, mouth=None, feet=None),
    'stun': dict(sx=1.03, sz=0.95, lean=-6, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.25, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-10, lid=1.0, mouth='o', feet='limp'),
}
CACAO_BODY = (V(0.0, 0, 0.34), 0.40, 0.27, 0.27)


def cacao_pod(b, c, rx, ry, rz, M=None):
    depth, phase, taper = 0.12, math.pi, 1.25      # phase pi: a ridge faces the camera with a groove either side
    b.part('pod', ridged_body(c, rx, ry, rz, 5, depth, phase=phase, taper=taper), 'pod', M=M)
    # the grooves between the ridges (the valleys of the cosine), as thin dark lines along the pod; only the ones
    # on the camera side and the top are built
    for k in range(5):
        a = (TAU * k + math.pi - phase) / 5
        if math.cos(a) > 0.35:            # the far side: skip
            continue
        path = []
        for i in range(9):
            phi = math.radians(24 + 132 * i / 8)
            x = rx * math.cos(phi)
            kk = math.sin(phi) ** taper
            m = 1 + depth * math.cos(5 * a + phase)
            path.append(c + Vector((x, ry * kk * math.cos(a) * m * 1.01, rz * kk * math.sin(a) * m * 1.01)))
        b.part('groove%d' % k, tube(path, 0.016, seg=6), 'ridge', subsurf=1, M=M)
    b.part('stem', tube([c - X * (rx - 0.02), c - X * (rx + 0.05) + Z * 0.01, c - X * (rx + 0.09) + Z * 0.04], 0.03, 0.022, seg=8), 'stem', M=M)


def build_cacao(b, pose, t, P):
    c, rx, ry, rz = CACAO_BODY
    if pose == 'roll':
        cr = V(0, 0, 0.36)
        MR = about(cr, rot_y(360 * t))
        cacao_pod(b, cr, 0.37, 0.27, 0.31, M=MR)
        return
    cacao_pod(b, c, rx, ry, rz)
    surf = ellipsoid_surf(c, rx * 1.03, ry * 1.03, rz * 1.03)
    for side, a in (('r', -0.45), ('l', -1.15)):
        p, n = on_ellipsoid(c, (rx * 1.02, ry * 1.02, rz * 1.02), a, 0.28)
        b.eye(side, p - n * 0.012, n, 0.07, lid=P['lid'], lid_mat='pod', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None)
    b.part('mouth', mouth_bm(surf, P['mouth'], c.z - 0.07, math.radians(-15), math.radians(-85), scale=0.8), 'mouth')
    biped_legs(b, P, t, (0.02, 0, 0.12), (0.08, 0.05, 0.035), 0.03, 'feet', A=0.09, H=0.05, y=0.12)


CACAO = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.012 * (1 + math.sin(2 * TAU * t)) if p == 'walk' else 0.0), P=P)
         for p, P in CACAO_POSE.items()}


# ================================================================ ALPACA (feet, 1.64 m, 2 hp)
ALPACA_POSE = {
    'walk':      dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='smile', feet='walk', hurt=False),
    'hurt_walk': dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='wobble', feet='walk', hurt=True),
    'idle':      dict(sx=1.00, sz=1.00, lean=0, lid=0.1, mouth='smile', feet='stand', hurt=False),
    'throw':     dict(sx=1.00, sz=1.00, lean=0, lid=0.0, mouth='o', feet='stand', hurt=False),
    'stun':      dict(sx=1.03, sz=0.96, lean=-6, lid=0.5, mouth='wobble', feet='stand', dazed=True, hurt=False),
    'flat':      dict(sx=1.15, sz=0.30, lean=0, lid=1.0, mouth='flat', feet='flat', hurt=False),
    'ko':        dict(sx=1.00, sz=0.96, lean=-12, lid=1.0, mouth='o', feet='limp', hurt=False),
}


def build_alpaca(b, pose, t, P):
    hurt = P['hurt']
    M = b.M
    nod, pull, blob_u, puff = 0.0, 0.0, None, 0.0
    if pose in ('walk', 'hurt_walk'):
        nod = 4 * math.sin(TAU * t)
    elif pose == 'idle':
        nod = 2 * math.sin(TAU * t)
    elif pose == 'throw':
        if t < 0.4:
            pull = -22 * smooth01(t / 0.4)
            puff = smooth01(t / 0.4)
        elif t < 0.6:
            pull = lerp(-22, 16, smooth01((t - 0.4) / 0.2))
            puff = 1 - smooth01((t - 0.4) / 0.2)
        else:
            pull = lerp(16, 4, smooth01((t - 0.6) / 0.4))
        if t >= 0.45:
            blob_u = (t - 0.45) / 0.55
    # body: a rounded barrel of fleece with fluff bumps along the back (shorn when hurt)
    bc = V(-0.02, 0, 0.9)
    b.part('body', superellipsoid(bc, 0.42, 0.25, 0.3, 0.6, seg=28, rows=14), 'fleece')
    if not hurt:
        for k, x in enumerate((-0.34, -0.14, 0.08, 0.3)):
            b.part('fluff%d' % k, sphere(bc + V(x, 0, 0.26 - 0.02 * (k % 2)), 0.12, seg=14, rows=9), 'fleece')
        b.part('chest', sphere(bc + V(0.42, 0, -0.04), 0.14, seg=14, rows=9), 'fleece')
        b.part('rump', sphere(bc + V(-0.44, 0, 0.02), 0.13, seg=14, rows=9), 'fleece')
    else:
        # shorn: a pink skin patch on the flank, a few stray tufts
        b.part('shorn', ellipsoid(bc + V(-0.05, -0.23, 0.05), X * 0.22, Y * 0.05, Z * 0.16, seg=16, rows=10), 'skin')
        b.part('tuft0', sphere(bc + V(0.3, 0, 0.27), 0.07, seg=12, rows=8), 'fleece')
        b.part('tuft1', sphere(bc + V(-0.36, 0, 0.26), 0.06, seg=12, rows=8), 'fleece')
    b.part('tail', xf(blob((-0.46, 0, 1.03), 0.08, 0.07, 0.1, seg=12, rows=8), about((-0.46, 0, 1.0), rot_y(-30))), 'fleece_dark')
    # neck, head and the topknot swing together (nod, pull-back for the spit)
    pivot = V(0.3, 0, 1.02)
    MH = M @ about(pivot, rot_y(nod + pull))
    b.part('neck', tube([V(0.3, 0, 0.98), V(0.4, 0, 1.25), V(0.47, 0, 1.46)], 0.14, 0.11, seg=14), 'fleece', M=MH)
    hc = V(0.52, 0, 1.5)
    head_r = (0.16, 0.12, 0.13)
    b.part('head', blob(hc, *head_r, seg=22, rows=12), 'face', M=MH)
    mc = V(0.67, 0, 1.45)
    mr = (0.1 + 0.04 * puff, 0.085 + 0.04 * puff, 0.08 + 0.03 * puff)
    b.part('muzzle', blob(mc, *mr, seg=16, rows=10), 'face', M=MH)
    b.part('nose', blob((0.75 + 0.04 * puff, 0, 1.48), 0.035, 0.03, 0.025, seg=10, rows=6), 'nose', M=MH)
    msurf = ellipsoid_surf(mc, *mr)
    if P['mouth'] in ('o',):
        b.part('mouth', mouth_bm(msurf, 'o', 1.43, math.radians(-15), math.radians(-70), scale=0.9), 'mouth', M=MH)
    else:
        b.part('mouth', mouth_bm(msurf, P['mouth'], 1.42, math.radians(-10), math.radians(-95), scale=0.7), 'mouth', M=MH)
    # topknot: a poof of fleece over the brow (flattened and askew when hurt)
    if hurt:
        b.part('topknot', xf(blob((0.5, -0.03, 1.6), 0.12, 0.09, 0.06, seg=14, rows=8), about((0.5, 0, 1.6), rot_x(-25))), 'fleece', M=MH)
    else:
        b.part('topknot', sphere((0.49, 0, 1.63), 0.115, seg=14, rows=9), 'fleece', M=MH)
        b.part('topknot2', sphere((0.59, 0, 1.6), 0.08, seg=12, rows=8), 'fleece', M=MH)
    for side, y in (('l', -0.08), ('r', 0.08)):
        base = V(0.42, y, 1.58)
        tip = base + (V(-0.1, y * 0.6, 0.24) if pose not in ('ko', 'flat') else V(-0.2, y * 2.0, 0.05))
        b.part('ear_' + side, cone(base, tip, 0.05, flat=0.6), 'face', M=MH)
    for side, az in (('r', -0.5), ('l', -1.2)):
        p, n = on_ellipsoid(hc, head_r, az, 0.12)
        lid = P['lid']
        if hurt and side == 'l':
            lid = 0.6
        b.eye(side, p - n * 0.012, n, 0.065, pupil=0.62, lid=lid, lid_mat='face', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None, M=MH)
    # the woven scarf: red band with yellow and blue stripes and three tassels on the camera side
    sc, sax = V(0.355, 0, 1.13), V(0.35, 0, 1.0).normalized()
    if hurt:
        sc = sc + V(0.03, -0.04, -0.08)
    b.part('scarf', torus_bm(sc, sax, 0.145, 0.05, seg=20, sides=8), 'scarf', M=MH)
    b.part('scarf_y', torus_bm(sc + sax * 0.045, sax, 0.148, 0.02, seg=20, sides=6), 'scarf_yellow', M=MH, subsurf=1)
    b.part('scarf_b', torus_bm(sc - sax * 0.045, sax, 0.148, 0.02, seg=20, sides=6), 'scarf_blue', M=MH, subsurf=1)
    for k in range(3):
        base = sc + V(0.05 * (k - 1), -0.16, -0.02 - 0.01 * abs(k - 1))
        b.part('tassel%d' % k, cone(base, base + V(0.02 * (k - 1), -0.02, -0.14), 0.028, seg=8), 'scarf_yellow', M=MH, subsurf=1)
    hips = {'fl': V(0.3, -0.15, 0.66), 'fr': V(0.3, 0.15, 0.66), 'bl': V(-0.3, -0.15, 0.66), 'br': V(-0.3, 0.15, 0.66)}
    quad_legs(b, P, t, hips, 0.045, 0.075, (0.1, 0.08, 0.045), 'fleece_dark', A=0.13, H=0.07, foot_mat='hoof')
    if blob_u is not None:
        u = blob_u
        bc2 = V(0.82 + 0.55 * u, -0.04, 1.44 + 0.25 * u - 0.45 * u * u)
        rb = 0.09 + 0.015 * math.sin(math.pi * u)
        b.part('spit', ellipsoid(bc2, X * rb * (1 + 0.3 * u), Y * rb, Z * rb, seg=14, rows=8), 'spit', M=Matrix.Identity(4))
        b.part('spit_drip', sphere(bc2 + V(-rb * 1.3, 0, -0.03), 0.04, seg=10, rows=6), 'spit', M=Matrix.Identity(4))


def _alpaca_M(t, P, p):
    bob = 0.012 * (1 + math.sin(2 * TAU * t)) if p in ('walk', 'hurt_walk') else 0.0
    sz = 1 + 0.015 * math.sin(TAU * t) if p == 'idle' else 1.0
    return pose_matrix(P, bob=bob, sz_extra=sz)


ALPACA = {p: dict(M=lambda t, P=P, p=p: _alpaca_M(t, P, p), P=P) for p, P in ALPACA_POSE.items()}


# ================================================================ CONDOR (centre flyer, span 1.2 m)
def wing_frame(root, side, flap_deg, sweep_deg):
    """World matrix for a wing whose local +Y is the span (mirrored for the camera-side wing, side = -1)."""
    return tr(root) @ rot_z(side * sweep_deg) @ rot_x(side * flap_deg) @ scl(1.0, side, 1.0)


def build_condor(b, pose, t, P):
    ns = P['ns']
    pts = [(0.30, 0.000, 1.0, 1.0), (0.26, 0.085, 1.0, 1.0), (0.14, 0.135, 1.0, 1.1), (0.0, 0.14, 1.0, 1.1),
           (-0.16, 0.12, 1.0, 1.0), (-0.30, 0.07, 1.1, 0.8), (-0.38, 0.000, 1.0, 1.0)]
    sp = Spine([(x, 0.0, 0.0, r, kz, ky) for x, r, kz, ky in pts])
    b.part('body', sp.mesh(rings=20, seg=20), 'body')
    # the white ruff collar, the bald pink head, the hooked beak with a dark tip
    hc = V(0.40, 0, 0.09) if pose != 'stun' else V(0.34, 0, 0.14)
    b.part('ruff', xf(blob((0.27, 0, 0.07), 0.11, 0.15, 0.13, seg=18, rows=10), about((0.27, 0, 0.07), rot_y(20))), 'ruff')
    b.part('neck', tube([V(0.28, 0, 0.08), hc], 0.055, 0.05, seg=10), 'head')
    head_r = (0.085, 0.075, 0.075)
    b.part('head', blob(hc, *head_r, seg=16, rows=10), 'head')
    b.part('comb', blob(hc + V(0.0, 0, 0.065), 0.055, 0.025, 0.03, seg=10, rows=6), 'head', subsurf=1)
    bd = (X * 0.98 - Z * 0.12).normalized()
    beak = [hc + bd * 0.06, hc + bd * 0.14, hc + bd * 0.19 - Z * 0.03]
    b.part('beak', tube(beak, 0.036, 0.016, seg=10), 'beak')
    b.part('beak_tip', tube([hc + bd * 0.17 - Z * 0.02, hc + bd * 0.2 - Z * 0.07], 0.018, 0.005, seg=8), 'beak_tip', subsurf=1)
    for side_name, az in (('r', -0.5), ('l', -1.25)):
        c, n = on_ellipsoid(hc, head_r, az * ns, 0.28)
        b.eye(side_name, c - n * 0.008, n, 0.036, pupil=0.55, lid=0.5 if pose == 'stun' else 0.15, lid_mat='head',
              shut='x' if pose == 'ko' else None, dazed=pose == 'stun')
    # wings: a broad dark panel with a pale covert band and six splayed finger feathers at the tip
    flap, sweep = P['flap'](t), P['sweep']
    for side_name, side in (('l', -1), ('r', 1)):
        W = wing_frame(V(0.0, 0.1 * side, 0.06), side, flap, sweep)

        def wing(u, v, W=W):
            span = 0.50 * u
            le = 0.15 - 0.10 * u * u
            chord = 0.34 - 0.08 * u
            return W @ V(le - chord * v, span, -0.02 * u * u)
        b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.022 - 0.01 * u), 'wing')
        b.part('covert_' + side_name, sheet(lambda u, v, W=W: wing(u, 0.08 + 0.3 * v, W) + (W.to_3x3() @ Z) * 0.012, 5, 2, 0.006, u0=0.08, u1=0.8), 'wing_pale', subsurf=1)
        tipc = wing(1.0, 0.45)
        for k in range(6):
            ang = -0.45 + 0.9 * k / 5
            d = (W.to_3x3() @ V(-math.sin(ang) * 0.9 - 0.25, math.cos(ang), 0.0)).normalized()
            root_p = wing(0.98, 0.1 + 0.16 * k)
            b.part('finger_%s%d' % (side_name, k), tube([root_p, root_p + d * 0.11, root_p + d * 0.2], 0.022, 0.006, seg=6), 'wing', subsurf=1)
    # tail fan and tucked legs
    def tail(u, v):
        return V(-0.32 - 0.2 * u, (v * 2 - 1) * (0.04 + 0.1 * u), 0.0 + 0.01 * u)
    b.part('tail', sheet(tail, 4, 4, 0.01), 'wing')
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('leg_' + side_name, tube([V(-0.08, 0.05 * side, -0.1), V(-0.14, 0.055 * side, -0.17 * ns)], 0.02, 0.014, seg=8), 'leg')
        b.part('foot_' + side_name, blob((-0.15, 0.055 * side, -0.19 * ns), 0.045, 0.02, 0.012, seg=8, rows=5), 'leg', subsurf=1)


CONDOR = {
    'fly':   dict(flap=lambda t: 18 + 36 * math.cos(TAU * t), sweep=18, M=lambda: Matrix.Identity(4), ns=1),
    'swoop': dict(flap=lambda t: 30, sweep=55, M=lambda: rot_y(24), ns=1),
    'stun':  dict(flap=lambda t: -60, sweep=6, M=lambda: rot_y(-8), ns=1),
    'ko':    dict(flap=lambda t: -70, sweep=12, M=lambda: rot_x(180) @ rot_y(-12), ns=-1),
}


# ================================================================ FROG (feet, 0.57 m, hopper)
FROG_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=0, lid=0.2, mouth='smile', feet='walk'),
    'hop':  dict(sx=0.95, sz=1.12, lean=14, lid=0.05, mouth='smile', feet='hop'),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat': dict(sx=1.30, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp'),
}


def build_frog(b, pose, t, P):
    bc, br = V(0.0, 0, 0.27), (0.31, 0.24, 0.2)
    b.part('body', blob(bc, *br, seg=24, rows=12), 'body')
    b.part('belly', ellipsoid(bc, X * br[0] * 1.01, Y * br[1] * 1.01, Z * br[2] * 1.01, seg=24, rows=5, phi0=math.radians(105)), 'belly')
    # bulging eyes on top of the head
    for side, y in (('l', -0.13), ('r', 0.13)):
        c = V(0.12, y, 0.44)
        out = V(0.5, -1.0 if side == 'l' else 1.0, 0.35).normalized()
        b.eye(side, c, out, 0.095, pupil=0.55, lid=P['lid'], lid_mat='body', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None, look=V(0.6, -0.7, 0.0))
        # the eyelid's skin socket (a green cup behind the eye)
        b.part('socket_' + side, ellipsoid(c - out * 0.03, out * 0.09, perp_frame(out)[0] * 0.1, perp_frame(out)[1] * 0.1, seg=14, rows=8), 'body')
    # glow spots on the back
    for k, (az, el) in enumerate(((-1.0, 0.85), (-1.9, 0.75), (2.6, 0.9), (-0.3, 0.95))):
        c, n = on_ellipsoid(bc, br, az, el)
        ax, ay = perp_frame(n)
        b.part('spot%d' % k, ellipsoid(c + n * 0.004, ax * 0.05, ay * 0.045, n * 0.02, seg=12, rows=6), 'spot_glow', subsurf=1)
    surf = ellipsoid_surf(bc, *br)
    b.part('mouth', mouth_bm(surf, P['mouth'], 0.22, math.radians(-5), math.radians(-120), scale=1.0), 'mouth')
    # legs: folded back legs with big thighs, little front arms, orange toe pads
    stance = P['feet']
    for side, y in (('l', -1), ('r', 1)):
        yy = 0.22 * y
        hip = b.M @ V(-0.14, 0.18 * y, 0.22)
        if stance == 'hop':
            knee, ankle, foot = V(-0.34, yy, 0.18), V(-0.44, yy, 0.1), V(-0.54, yy, 0.03)
        elif stance == 'flat':
            knee, ankle, foot = V(-0.28, yy * 1.5, 0.08), V(-0.36, yy * 1.6, 0.04), V(-0.44, yy * 1.6, 0.03)
        elif stance == 'limp':
            knee, ankle, foot = V(-0.3, yy, 0.12), V(-0.38, yy, 0.04), V(-0.46, yy, 0.03)
        else:
            dx, dz = gait(t, PHASE['bl' if side == 'l' else 'br'], 0.06, 0.04) if stance == 'walk' else (0.0, 0.0)
            knee, ankle, foot = V(-0.3, yy, 0.3), V(-0.2 + dx, yy, 0.06 + dz), V(0.0 + dx, yy, 0.035 + dz)
        b.part('thigh_' + side, tube([hip, knee], 0.075, 0.06, seg=10), 'body', M=Matrix.Identity(4))
        b.part('shin_' + side, tube([knee, ankle, foot], 0.045, 0.035, seg=8), 'body', M=Matrix.Identity(4))
        for k in range(3):
            b.part('toe_%s%d' % (side, k), sphere(foot + V(0.05, (k - 1) * 0.035, 0.0), 0.028, seg=8, rows=6), 'toe', subsurf=1)
        # front arm
        sh = b.M @ V(0.2, 0.17 * y, 0.2)
        if stance == 'hop':
            hand = V(0.4, 0.2 * y, 0.02)
        elif stance == 'flat':
            hand = V(0.42, 0.28 * y, 0.03)
        elif stance == 'limp':
            hand = V(0.34, 0.2 * y, 0.03)
        else:
            dx, dz = gait(t, PHASE['fl' if side == 'l' else 'fr'], 0.05, 0.03) if stance == 'walk' else (0.0, 0.0)
            hand = V(0.3 + dx, 0.21 * y, 0.03 + dz)
        b.part('arm_' + side, tube([sh, (sh + hand) / 2 + V(0.03, 0, 0.03), hand], 0.04, 0.03, seg=8), 'body', M=Matrix.Identity(4))
        for k in range(3):
            b.part('finger_%s%d' % (side, k), sphere(hand + V(0.04, (k - 1) * 0.03, 0.0), 0.024, seg=8, rows=6), 'toe', subsurf=1)


FROG = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.01 * (1 + math.sin(2 * TAU * t)) if p == 'walk' else (0.1 if p == 'hop' else 0.0)), P=P)
        for p, P in FROG_POSE.items()}


# ================================================================ IGUANA (feet, 0.64 m, sneezes salt)
IGUANA_POSE = {
    'walk':  dict(sx=1.00, sz=1.00, lean=0, lid=0.2, mouth='smile', feet='walk'),
    'idle':  dict(sx=1.00, sz=1.00, lean=0, lid=0.25, mouth='smile', feet='stand'),
    'throw': dict(sx=1.00, sz=1.00, lean=0, lid=0.0, mouth='open', feet='stand'),
    'stun':  dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True),
    'flat':  dict(sx=1.15, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':    dict(sx=1.00, sz=0.95, lean=-8, lid=1.0, mouth='o', feet='limp'),
}


def build_iguana(b, pose, t, P):
    M = b.M
    pull, salt_u, squint = 0.0, None, 0.0
    if pose == 'throw':
        if t < 0.4:
            pull = -18 * smooth01(t / 0.4)
            squint = smooth01(t / 0.4)
        elif t < 0.55:
            pull = lerp(-18, 14, smooth01((t - 0.4) / 0.15))
            squint = 1 - smooth01((t - 0.4) / 0.15)
        else:
            pull = lerp(14, 2, smooth01((t - 0.55) / 0.45))
        if t >= 0.45:
            salt_u = (t - 0.45) / 0.55
    elif pose == 'idle':
        pull = 2 * math.sin(TAU * t)
    bc, br = V(0.0, 0, 0.3), (0.36, 0.19, 0.18)
    b.part('body', blob(bc, *br, seg=26, rows=12), 'skin')
    b.part('patch', ellipsoid(V(0.0, -0.17, 0.31), X * 0.21, Y * 0.045, Z * 0.1, seg=16, rows=8), 'patch')
    # a lighter belly band low on the body
    b.part('belly', ellipsoid(bc, X * br[0] * 1.01, Y * br[1] * 1.01, Z * br[2] * 1.01, seg=24, rows=4, phi0=math.radians(118)), 'skin_light')
    # the head rears back for the sneeze
    pivot = V(0.3, 0, 0.36)
    MH = M @ about(pivot, rot_y(pull))
    hc, hr = V(0.46, 0, 0.41), (0.18, 0.13, 0.12)
    b.part('head', superellipsoid(hc, *hr, 0.6, seg=22, rows=12), 'skin', M=MH)
    b.part('snout', blob((0.6, 0, 0.39), 0.07, 0.09, 0.08, seg=14, rows=8), 'skin', M=MH)
    for side, y in (('l', -0.08), ('r', 0.08)):
        b.part('nostril_' + side, sphere((0.655, y * 0.8, 0.42), 0.014, seg=8, rows=5), 'mouth', subsurf=1, M=MH)
    for side, az in (('l', -1.05), ('r', 1.05)):
        c, n = on_ellipsoid(hc, (0.17, 0.14, 0.12), az, 0.35)
        lid = max(P['lid'], 0.7 * squint)
        b.eye(side, c - n * 0.01, n, 0.055, pupil=0.5, lid=lid, lid_mat='skin', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None, look=V(0.6, -0.7, -0.1), M=MH)
    msurf = ellipsoid_surf(V(0.54, 0, 0.38), 0.14, 0.11, 0.09)
    style = P['mouth']
    if style == 'open':
        b.part('mouth', mouth_bm(msurf, 'open', 0.36, math.radians(-10), math.radians(-70), scale=0.9 if squint < 0.5 else 0.5), 'mouth', M=MH)
    elif style == 'o':
        b.part('mouth', mouth_bm(msurf, 'o', 0.36, math.radians(-10), math.radians(-70), scale=0.7), 'mouth', M=MH)
    else:
        b.part('mouth', mouth_bm(msurf, style, 0.345, math.radians(-5), math.radians(-105), scale=0.7), 'mouth', M=MH)
    # crest: pale spines from the head down the back
    crest = []
    for k in range(4):
        x = 0.44 - 0.09 * k
        z = 0.53 - 0.02 * k
        crest.append(xf(cone(V(x, 0, z - 0.02), V(x - 0.03, 0, z + 0.1 - 0.015 * k), 0.03, flat=0.5), MH))
    b.part('crest_head', join(crest), 'crest', subsurf=1, M=Matrix.Identity(4))
    crest = []
    for k in range(8):
        x = 0.12 - 0.08 * k
        z = bc.z + br[2] * math.sqrt(max(0.0, 1 - (x / br[0]) ** 2)) - 0.02
        crest.append(cone(V(x, 0, z), V(x - 0.03, 0, z + 0.12 - 0.008 * k), 0.032, flat=0.5))
    b.part('crest_back', join(crest), 'crest', subsurf=1)
    # tail: curving toward the camera so it fits the frame
    tail = [V(-0.32, 0, 0.3), V(-0.48, -0.05, 0.27), V(-0.6, -0.14, 0.28), V(-0.68, -0.24, 0.33), V(-0.72, -0.32, 0.38)]
    if pose == 'ko':
        tail = [V(-0.32, 0, 0.3), V(-0.48, -0.03, 0.22), V(-0.6, -0.1, 0.12), V(-0.7, -0.18, 0.08), V(-0.76, -0.26, 0.06)]
    b.part('tail', tube(tail, 0.09, 0.02, seg=10), 'skin')
    for k in range(3):
        p = tail[1 + k // 2].lerp(tail[2 + k // 2], 0.5 * (k % 2))
        b.part('tail_spine%d' % k, cone(p + Z * 0.045, p + Z * 0.11 - X * 0.02, 0.022, flat=0.5), 'crest', subsurf=1)
    # sprawling lizard legs
    hips = {'fl': V(0.24, -0.16, 0.26), 'fr': V(0.24, 0.16, 0.26), 'bl': V(-0.2, -0.16, 0.26), 'br': V(-0.2, 0.16, 0.26)}
    quad_legs(b, P, t, hips, 0.035, 0.045, (0.07, 0.05, 0.03), 'skin', A=0.09, H=0.05, splay=0.1)
    if salt_u is not None:
        u = salt_u
        for k, (vx, vz, sz_) in enumerate(((0.35, 0.3, 0.09), (0.42, 0.42, 0.075), (0.3, 0.18, 0.065), (0.45, 0.26, 0.055))):
            p = V(0.72 + vx * u, -0.06 + 0.03 * (k % 2), 0.42 + vz * u - 0.35 * u * u)
            bm = box_bm((sz_, sz_, sz_), bevel=sz_ * 0.15, segments=2)
            b.part('salt%d' % k, xf(bm, tr(p) @ rot_y(40 * k + 360 * u) @ rot_x(30 * k)), 'salt', subsurf=0, smooth=False, M=Matrix.Identity(4))


IGUANA = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.008 * (1 + math.sin(2 * TAU * t)) if p == 'walk' else 0.0), P=P)
          for p, P in IGUANA_POSE.items()}


# ================================================================ ICE CUBE (feet, 0.85 m, skater)
ICE_POSE = {
    'walk': dict(sx=1.00, sz=1.00, lean=5, lid=0.1, mouth='smile', feet='walk'),
    'stun': dict(sx=1.03, sz=0.95, lean=-5, lid=0.5, mouth='wobble', feet='stand', dazed=True, cracks=1),
    'flat': dict(sx=1.30, sz=0.40, lean=0, lid=1.0, mouth='flat', feet='flat'),
    'ko':   dict(sx=1.00, sz=0.95, lean=-9, lid=1.0, mouth='o', feet='limp', cracks=2),
}


def build_ice_cube(b, pose, t, P):
    hc = V(0.0, 0, 0.45)
    H = 0.35
    b.part('block', superellipsoid(hc, H, H, H, 0.32, seg=28, rows=14), 'ice')
    face_y = -H - 0.012
    # shine streaks on the camera face
    b.part('shine0', xf(box_bm((0.08, 0.012, 0.22), bevel=0.005, segments=1), tr(V(-0.2, face_y, 0.58))), 'shine', subsurf=0, smooth=False)
    b.part('shine1', xf(box_bm((0.05, 0.012, 0.08), bevel=0.005, segments=1), tr(V(-0.1, face_y, 0.66))), 'shine', subsurf=0, smooth=False)
    # cracks when hit
    for k in range(P.get('cracks', 0)):
        zz = [V(-0.3, face_y, 0.6 - 0.3 * k), V(-0.18, face_y, 0.52 - 0.3 * k), V(-0.1, face_y, 0.6 - 0.28 * k), V(0.02, face_y, 0.5 - 0.3 * k)]
        if k == 1:
            zz = [V(0.3, face_y, 0.72), V(0.22, face_y, 0.62), V(0.3, face_y, 0.52), V(0.24, face_y, 0.42)]
        b.part('crack%d' % k, tube(zz, 0.012, seg=6), 'crack', subsurf=1)
    # face on the camera side, shifted toward the front
    for side, x in (('r', 0.16), ('l', -0.04)):
        c = V(x, face_y - 0.02, 0.56)
        b.eye(side, c, -Y, 0.085, pupil=0.5, lid=P['lid'], lid_mat='ice', dazed=P.get('dazed', False),
              shut='lid' if P['lid'] >= 0.999 else None, look=V(0.5, -1.0, -0.1))
    style = P['mouth']
    if style == 'o':
        b.part('mouth', ellipsoid(V(0.08, face_y - 0.01, 0.38), X * 0.035, Z * 0.045, Y * 0.02, seg=12, rows=6), 'mouth')
    else:
        path = [V(-0.04 + 0.2 * k / 8, face_y - 0.012, 0.36) for k in range(9)]
        b.part('mouth', line_mouth(path, style, r=0.014), 'mouth')
    # arms out of the front and back faces (swinging like a skater), skating legs below
    stance = P['feet']
    for side, sx in (('f', 1), ('b', -1)):
        sh = b.M @ V(H * sx, 0.0, 0.46)
        swing = 0.1 * math.sin(TAU * t + (0 if sx > 0 else math.pi)) if stance == 'walk' else 0.0
        if stance == 'flat':
            hand = V((H + 0.3) * sx, -0.05, 0.08)
        elif stance == 'limp':
            hand = V((H + 0.1) * sx, -0.05, 0.14)
        elif stance == 'stand':
            hand = V((H + 0.16) * sx, -0.05, 0.3)
        else:
            hand = V((H + 0.16) * sx, -0.05, 0.42 + 0.5 * swing * sx)
        b.part('arm_' + side, tube([sh, (sh + hand) / 2 + V(0.02 * sx, 0.0, 0.04), hand], 0.035, 0.03, seg=8), 'limb', M=Matrix.Identity(4))
        b.part('hand_' + side, sphere(hand, 0.045, seg=10, rows=6), 'limb', M=Matrix.Identity(4))
    for side, yy, phase in (('l', -0.13, math.pi / 2), ('r', 0.13, 3 * math.pi / 2)):
        hip = b.M @ V(0.0, yy, 0.12)
        dx = dz = 0.0
        tilt = 0.0
        if stance == 'walk':
            dx = 0.16 * math.sin(TAU * t + phase)
            dz = 0.03 * max(0.0, math.cos(TAU * t + phase))
        elif stance == 'stand':
            dx = 0.04 if side == 'l' else -0.04
        elif stance == 'flat':
            dx = 0.34 if side == 'l' else -0.3
        elif stance == 'limp':
            dx = 0.18 if side == 'l' else -0.14
            tilt = -35
        foot = V(0.02 + dx, yy, 0.05 + dz)
        b.part('leg_' + side, tube([hip, foot + Z * 0.02], 0.038, 0.034, seg=8), 'limb', M=Matrix.Identity(4))
        boot = xf(ellipsoid(V(0, 0, 0), X * 0.1, Y * 0.055, Z * 0.045, seg=12, rows=8), tr(foot) @ rot_y(tilt))
        b.part('boot_' + side, boot, 'limb', M=Matrix.Identity(4))
        blade = xf(box_bm((0.19, 0.016, 0.022), bevel=0.004, segments=1), tr(foot - Z * 0.04) @ rot_y(tilt))
        b.part('blade_' + side, blade, 'skate', subsurf=0, smooth=False, M=Matrix.Identity(4))


ICE = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.015 * (1 + math.sin(2 * TAU * t)) if p == 'walk' else 0.0,
                                              lean_extra=3 * math.sin(TAU * t) if p == 'walk' else 0.0), P=P)
       for p, P in ICE_POSE.items()}


# ================================================================ SEA LION (centre swimmer, 1.28 m)
def build_sea_lion(b, pose, t, P):
    ns = P['ns']
    wag = math.sin(TAU * t)
    pts = [(0.62, 0.0, 0.00, 0.0, 1.0, 1.0), (0.58, 0.0, 0.00, 0.07, 1.0, 1.0), (0.48, 0.0, 0.02, 0.15, 1.0, 1.0),
           (0.36, 0.0, 0.03, 0.17, 1.0, 1.0), (0.2, 0.0, 0.0, 0.17, 1.0, 1.0), (0.0, 0.0, 0.0, 0.19, 1.0, 1.0),
           (-0.2, 0.0, 0.0, 0.16, 1.0, 1.0), (-0.4, 0.0, 0.03 * wag, 0.1, 1.0, 1.0), (-0.52, 0.0, 0.06 * wag, 0.055, 1.0, 1.0),
           (-0.58, 0.0, 0.08 * wag, 0.0, 1.0, 1.0)]
    sp = Spine(pts)
    b.part('body', sp.mesh(rings=26, seg=22), 'fur')
    b.part('belly', ellipsoid(V(0.08, 0, -0.1), X * 0.34, Y * 0.14, Z * 0.09, seg=18, rows=8), 'belly')
    # tail flippers: two fans at the end of the tail
    tip = V(-0.56, 0, 0.08 * wag)
    for side_name, side in (('l', -1), ('r', 1)):
        def fin(u, w, side=side):
            return tip + V(-0.2 * u, side * (0.02 + 0.16 * u) * (0.3 + 0.7 * w), 0.04 * u * (w * 2 - 1))
        b.part('tailfin_' + side_name, sheet(fin, 5, 3, 0.012), 'fur')
    # front flippers: angled back, paddling
    for side_name, side in (('l', -1), ('r', 1)):
        stroke = 25 * math.sin(TAU * t + (0 if side < 0 else 0.8)) if pose == 'swim' else 0.0
        base = V(0.12, 0.12 * side, -0.08)
        R = about(base, rot_x(side * stroke))

        def flip(u, w, base=base, side=side, R=R):
            p = base + V(-0.3 * u + 0.05 * w * (1 - u), side * (0.03 + 0.2 * u), -0.1 * u) + V(0.0, 0.0, 0.0)
            p = p + V(0.0, 0.0, (w - 0.5) * 0.05 * (1 - u))
            return R @ p
        b.part('flipper_' + side_name, sheet(flip, 5, 3, lambda u, w: 0.02 - 0.012 * u), 'fur')
    # head: a round head with a blunt muzzle, big dark eyes at the front, whiskers, tiny ears
    hc, hr = V(0.42, 0, 0.03), (0.18, 0.16, 0.16)
    b.part('head', blob(hc, *hr, seg=20, rows=12), 'fur')
    mc, mr = V(0.57, 0, -0.01), (0.1, 0.1, 0.085)
    b.part('muzzle', blob(mc, *mr, seg=16, rows=10), 'fur')
    b.part('nose', blob((0.665, 0, 0.02), 0.035, 0.04, 0.03, seg=10, rows=6), 'nose')
    for side_name, az in (('r', -0.55), ('l', -1.2)):
        c, n = on_ellipsoid(hc, hr, az * ns, 0.3)
        b.eye(side_name, c - n * 0.012, n, 0.065, pupil=0.72, lid=0.18 if pose != 'ko' else 0, lid_mat='fur',
              shut='x' if pose == 'ko' else None, look=V(0.5, -0.8 * ns, 0.05))
    for side_name, side in (('l', -1), ('r', 1)):
        b.part('ear_' + side_name, cone(V(0.36, 0.14 * side, 0.1), V(0.3, 0.17 * side, 0.15), 0.028, flat=0.6, seg=8), 'fur', subsurf=1)
        for k in range(3):
            p0 = V(0.6, 0.07 * side, -0.02 * ns)
            d = V(0.15, side * 0.9, (0.25 - 0.25 * k) * ns).normalized()
            b.part('whisker_%s%d' % (side_name, k), tube([p0, p0 + d * 0.17], 0.009, 0.004, seg=5), 'whisker', subsurf=1)
    msurf = ellipsoid_surf(mc, *mr)
    if pose == 'ko':
        b.part('mouth', mouth_bm(msurf, 'o', -0.03 * ns, math.radians(-15), math.radians(-70), scale=0.6), 'mouth')
    else:
        b.part('mouth', mouth_bm(msurf, 'smile', -0.045, math.radians(-10), math.radians(-100), scale=0.6), 'mouth')


SEALION = {
    'swim': dict(M=lambda t: rot_y(-3 * math.sin(TAU * t)), ns=1),
    'ko':   dict(M=lambda t: rot_x(180) @ rot_y(10), ns=-1),
}


# ================================================================ PENGUIN (centre swimmer, 0.93 m)
def build_penguin(b, pose, t, P):
    ns = P['ns']
    pts = [(0.46, 0.0, 0.02, 0.0, 1.0, 1.0), (0.42, 0.0, 0.02, 0.1, 1.0, 1.0), (0.3, 0.0, 0.02, 0.15, 1.0, 1.0),
           (0.15, 0.0, 0.0, 0.17, 1.0, 1.05), (-0.05, 0.0, 0.0, 0.17, 1.0, 1.05), (-0.25, 0.0, 0.0, 0.12, 1.0, 1.0),
           (-0.4, 0.0, 0.0, 0.05, 1.0, 1.0), (-0.46, 0.0, 0.0, 0.0, 1.0, 1.0)]
    sp = Spine(pts)
    b.part('body', sp.mesh(rings=24, seg=22), 'body')
    # the white belly band (lower half) and the white cheek stripe curling from the eye to the throat
    b.part('belly', sp.mesh(rings=16, seg=12, v0=0.2, v1=0.85, scale=1.03, a0=math.radians(115), a1=math.radians(245)), 'belly')
    for side_name, side in (('l', -1), ('r', 1)):
        path = []
        for k in range(9):
            s = k / 8
            a = side * lerp(0.5, 2.6, s)
            v = 0.2 + 0.06 * math.sin(math.pi * s)
            path.append(sp.point(v, a) + sp.normal(v, a) * 0.006)
        b.part('stripe_' + side_name, tube(path, 0.02, seg=6), 'belly', subsurf=1)
    # beak, eyes
    b.part('beak', tube([V(0.42, 0, 0.02), V(0.52, 0, 0.015), V(0.62, 0, -0.005)], 0.055, 0.012, seg=10), 'beak')
    for side_name, a in (('l', -1.0), ('r', 1.0)):
        c = sp.point(0.14, a if ns > 0 else -a)
        n = sp.normal(0.14, a if ns > 0 else -a)
        b.eye(side_name, c - n * 0.01, n, 0.05, pupil=0.58, lid=0.1 if pose != 'ko' else 0, lid_mat='body',
              shut='x' if pose == 'ko' else None, look=V(0.5, -0.8 * ns, 0.0))
    # flippers stroking, feet trailing, a little tail
    for side_name, side in (('l', -1), ('r', 1)):
        stroke = (20 + 30 * math.sin(TAU * t)) if pose == 'swim' else 35
        base = V(0.08, 0.14 * side, 0.03)
        R = about(base, rot_x(side * stroke))

        def flip(u, w, base=base, side=side, R=R):
            return R @ (base + V(-0.3 * u + 0.06 * (w - 0.5) * (1 - u * 0.5), side * (0.02 + 0.2 * u), -0.03 * u))
        b.part('flipper_' + side_name, sheet(flip, 5, 3, lambda u, w: 0.018 - 0.01 * u), 'body')
        b.part('foot_' + side_name, xf(blob((0, 0, 0), 0.07, 0.035, 0.015, seg=10, rows=6), tr(V(-0.4, 0.07 * side, -0.06 * ns)) @ rot_y(-15 * ns)), 'foot', subsurf=1)
    b.part('tail', cone(V(-0.4, 0, 0.0), V(-0.52, 0, 0.03), 0.04, flat=0.5, seg=8), 'body', subsurf=1)


PENGUIN = {
    'swim': dict(M=lambda t: rot_y(-4 * math.sin(TAU * t)), ns=1),
    'ko':   dict(M=lambda t: rot_x(180) @ rot_y(12), ns=-1),
}


# ================================================================ COIN: the cacao bean
def build_coin(b, pose, t, P):
    R, T = 0.30, 0.09
    b.part('disc', lathe_y([(0.80 * R, -0.46 * T), (0.95 * R, -0.5 * T), (R, -0.25 * T), (R, 0.25 * T), (0.95 * R, 0.5 * T), (0.80 * R, 0.46 * T)], seg=48, closed=True), 'gold', subsurf=0)
    b.part('face', lathe_y([(0, 0.47 * T), (0.82 * R, 0.47 * T), (0.82 * R, -0.47 * T), (0, -0.47 * T)], seg=48), 'gold_dark', subsurf=0)
    for side_name, side in (('near', -1), ('far', 1)):
        y = side * (0.47 * T + 0.012)
        Mb = tr(V(0, y, 0)) @ rot_y(-17)
        b.part('bean_' + side_name, xf(ellipsoid(V(0, 0, 0), X * 0.19, Y * 0.035, Z * 0.26, seg=20, rows=12), Mb), 'bean')
        path = [Mb @ V(-0.03 + 0.07 * math.sin(math.pi * s), -0.04, -0.2 + 0.4 * s) for s in (k / 8 for k in range(9))]
        b.part('crease_' + side_name, tube(path, 0.014, seg=6), 'crease', subsurf=1)
    b.part('glint', ellipsoid(V(-0.19 * R, -0.5 * T - 0.02, 0.62 * R), X * 0.05, Z * 0.035, Y * 0.015, seg=12, rows=6), 'glint', subsurf=1)


COIN = {'spin': dict(M=lambda t: rot_z(360 * t))}


# ================================================================ STAR: the golden tortoise
def build_star(b, pose, t, P):
    paddle = math.sin(TAU * t)
    sc = V(-0.03, 0, 0.02)
    shell = (0.36, 0.27, 0.22)
    b.part('shell', ellipsoid(sc, X * shell[0], Y * shell[1], Z * shell[2], seg=28, rows=12, phi1=math.radians(98)), 'gold')
    b.part('rim', torus_bm(sc + Z * (-0.03), Z, 0.34, 0.045, seg=28, sides=8), 'scute')
    b.part('plastron', ellipsoid(sc + Z * (-0.03), X * 0.33, Y * 0.24, Z * 0.07, seg=22, rows=6, phi0=math.radians(90)), 'plastron')
    # scutes: a crown of rounded plates on the dome
    for k, (az, el) in enumerate(((0.0, 1.5), (-0.7, 0.65), (0.7, 0.65), (-2.0, 0.6), (2.0, 0.6), (math.pi, 0.75), (-1.35, 0.3), (1.35, 0.3))):
        c, n = on_ellipsoid(sc, shell, az, el)
        ax, ay = perp_frame(n)
        rr = 0.085 if el > 1.0 else 0.07
        b.part('scute%d' % k, ellipsoid(c + n * 0.004, ax * rr, ay * rr * 1.1, n * 0.02, seg=12, rows=6), 'scute', subsurf=1)
    # head on a neck, big eyes, a smile
    b.part('neck', tube([V(0.26, 0, -0.04), V(0.38, 0, -0.03)], 0.075, 0.07, seg=12), 'gold')
    hc, hr = V(0.44, 0, -0.02), (0.14, 0.105, 0.105)
    b.part('head', blob(hc, *hr, seg=18, rows=10), 'gold')
    for side_name, az in (('r', -0.5), ('l', -1.2)):
        c, n = on_ellipsoid(hc, hr, az, 0.3)
        b.eye(side_name, c - n * 0.01, n, 0.048, pupil=0.55, lid=0.12, lid_mat='gold')
    hsurf = ellipsoid_surf(hc, *hr)
    b.part('mouth', mouth_bm(hsurf, 'smile', -0.06, math.radians(-10), math.radians(-100), scale=0.6), 'mouth')
    # four stubby paddling legs and a tail
    for name, x, y, ph in (('fl', 0.18, -0.2, 0.0), ('fr', 0.18, 0.2, math.pi), ('bl', -0.22, -0.2, math.pi), ('br', -0.22, 0.2, 0.0)):
        sw = 0.04 * math.sin(TAU * t + ph)
        top = V(x, y, -0.04)
        foot = V(x + sw, y * 1.15, -0.2)
        b.part('leg_' + name, tube([top, foot], 0.06, 0.055, seg=10), 'gold')
        b.part('foot_' + name, blob(foot, 0.065, 0.06, 0.03, seg=10, rows=6), 'gold')
    b.part('tail', cone(V(-0.36, 0, -0.06), V(-0.46, 0, -0.1), 0.035, flat=0.7, seg=8), 'gold', subsurf=1)


STAR = {'idle': dict(M=lambda t: tr(V(0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(2 * math.sin(TAU * t)))}


# ================================================================ QBLOCK / USED: the woven textile block
BAND_MATS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'red']


def build_qblock(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.96
    b.part('core', box_bm((W, D, H), bevel=0.04), 'red', subsurf=0)
    n = len(BAND_MATS)
    bh = H / n
    sides = [((0, -1, 0), (1, 0, 0), W, D), ((1, 0, 0), (0, 1, 0), D, W), ((0, 1, 0), (-1, 0, 0), W, D), ((-1, 0, 0), (0, -1, 0), D, W)]
    for si, (nrm, tng, extent, off) in enumerate(sides):
        nrm, tng = Vector(nrm), Vector(tng)
        for k, mat in enumerate(BAND_MATS):
            zc = H / 2 - bh * (k + 0.5)
            c = nrm * (off / 2 + 0.008) + Z * zc
            bm = box_bm((extent + 0.02, 0.016, bh - 0.012), bevel=0.0)      # overlaps the corners: no gaps
            ang = math.degrees(math.atan2(tng.y, tng.x))
            b.part('band_%d_%d' % (si, k), xf(bm, tr(c) @ rot_z(ang)), mat, subsurf=0, smooth=False)
            if k % 2 == 1 and nrm.y != 0:
                # a row of white diamonds on the odd bands of the front and back faces (edge-on on the sides)
                cnt = 4 if extent > 0.95 else 3
                for i in range(cnt):
                    u = -extent / 2 + extent * (i + 0.5) / cnt
                    dc = nrm * (off / 2 + 0.02) + tng * u + Z * zc
                    hw, hh = 0.055, bh * 0.4
                    pts = [dc + tng * hw, dc + Z * hh, dc - tng * hw, dc - Z * hh]
                    b.part('diamond_%d_%d_%d' % (si, k, i), prism(pts, nrm * 0.01), 'white', subsurf=0, smooth=False)
    # the top: a yellow sun diamond on red with four little white dots
    top = Z * (H / 2 + 0.01)
    pts = [top + X * 0.22, top + Y * 0.22, top - X * 0.22, top - Y * 0.22]
    b.part('top_diamond', prism(pts, Z * 0.012), 'yellow', subsurf=0, smooth=False)
    pts = [top + X * 0.1 + Z * 0.006, top + Y * 0.1 + Z * 0.006, top - X * 0.1 + Z * 0.006, top - Y * 0.1 + Z * 0.006]
    b.part('top_inner', prism(pts, Z * 0.012), 'blue', subsurf=0, smooth=False)


def build_used(b, pose, t, P):
    W, D, H = 1.0, 0.92, 0.94
    b.part('core', box_bm((W, D, H), bevel=0.05), 'cloth', subsurf=0)
    for k in range(6):
        zc = H / 2 - H * (k + 1) / 7
        for si, (nrm, tng, extent, off) in enumerate((((0, -1, 0), (1, 0, 0), W, D), ((1, 0, 0), (0, 1, 0), D, W))):
            nrm, tng = Vector(nrm), Vector(tng)
            c = nrm * (off / 2 + 0.004) + Z * zc
            ang = math.degrees(math.atan2(tng.y, tng.x))
            b.part('line_%d_%d' % (si, k), xf(box_bm((extent - 0.1, 0.008, 0.022)), tr(c) @ rot_z(ang)), 'line', subsurf=0, smooth=False)
    # a loose thread curling on the camera face (kept inside the tile)
    y = -D / 2 - 0.012
    path = [V(0.3, y, -H / 2 + 0.05), V(0.38, y, -H / 2 + 0.1), V(0.42, y, -H / 2 + 0.18), V(0.36, y, -H / 2 + 0.24), V(0.3, y, -H / 2 + 0.2)]
    b.part('thread', tube(path, 0.012, 0.008, seg=6), 'thread', subsurf=1)


QBLOCK = {'idle': dict(M=lambda t: rot_y(2.0 * math.sin(TAU * t)) @ scl(1 + 0.012 * math.sin(TAU * t), 1, 1 - 0.012 * math.sin(TAU * t)))}
USED = {'idle': dict(M=lambda t: scl(1.02, 1.0, 0.96))}


# ================================================================ BOOBY (feet, 1.57 m, the friend with the blue boots)
BOOBY_POSE = {
    'idle': dict(sx=1.00, sz=1.00, lean=0, wave=False),
    'wave': dict(sx=1.00, sz=1.00, lean=-3, wave=True),
}


def build_booby(b, pose, t, P):
    """A blue-footed booby doing its high-stepping foot dance (idle) or waving a wing goodbye (wave).  Faces +X."""
    wave = P['wave']
    step_l = max(0.0, math.sin(TAU * t)) if not wave else 0.0          # the famous high-step: one foot up at a time
    step_r = max(0.0, -math.sin(TAU * t)) if not wave else 0.0
    sway = 3.0 * math.sin(TAU * t) if not wave else 2.0 * math.sin(TAU * t)
    M = b.M @ about(V(0, 0, 0.3), rot_x(sway))
    # body: a plump egg of brown back, white belly front
    bc, br = V(-0.02, 0, 0.62), (0.31, 0.27, 0.40)
    b.part('body', xf(blob(bc, *br, seg=26, rows=14), about(bc, rot_y(14))), 'body', M=M)
    b.part('belly', xf(ellipsoid(bc, Y * br[1] * 1.01, Z * br[2] * 1.01, X * br[0] * 1.01, seg=24, rows=10, phi1=math.radians(72)),
                       about(bc, rot_y(14))), 'belly', M=M)
    # tail: a dark pointed wedge
    b.part('tail', cone(V(-0.24, 0, 0.42), V(-0.5, 0, 0.26), 0.11, flat=0.45, seg=10), 'wing', M=M)
    # neck and head: pale head, a long pointed blue-grey beak, big friendly eyes
    nod = 3 * math.sin(2 * TAU * t)
    MH = M @ about(V(0.08, 0, 1.0), rot_y(nod))
    b.part('neck', tube([V(0.06, 0, 0.95), V(0.11, 0, 1.08), V(0.15, 0, 1.18)], 0.13, 0.11, seg=14), 'head', M=MH)
    hc, hr = V(0.17, 0, 1.27), (0.17, 0.15, 0.15)
    b.part('head', blob(hc, *hr, seg=22, rows=12), 'head', M=MH)
    bd = (X - Z * 0.22).normalized()
    root = hc + V(0.13, 0, -0.02)
    b.part('beak', tube([root, root + bd * 0.16, root + bd * 0.31], 0.075, 0.016, seg=12, radii=[0.075, 0.055, 0.016]), 'beak', M=MH)
    b.part('beak_line', tube([root + V(0.0, -0.0, -0.012), root + bd * 0.2 + V(0, 0, -0.012), root + bd * 0.29 + V(0, 0, -0.01)],
                             0.012, 0.006, seg=6), 'beak_dark', subsurf=1, M=MH)
    b.part('face_mask', blob(hc + V(0.1, 0, 0.0), 0.07, 0.11, 0.07, seg=14, rows=8), 'beak', M=MH)
    for side, az in (('r', -0.55), ('l', -1.25)):
        c, n = on_ellipsoid(hc, hr, az, 0.22)
        b.eye(side, c - n * 0.012, n, 0.07, pupil=0.5, lid=0.12, lid_mat='head', look=V(0.4, -0.85, 0.0), M=MH)
    # wings: folded along the back (idle, flicking a little with each step), or the camera-side one raised forward
    # and waving (wave)
    for side_name, side in (('l', -1), ('r', 1)):
        if wave and side == -1:
            a = math.radians(20 + 26 * math.sin(TAU * t))
            S = V(0.08, 0.27 * side, 0.86)
            d = V(math.cos(a), 0, math.sin(a))
            ch = V(-math.sin(a), 0, math.cos(a))

            def wing(u, v, S=S, d=d, ch=ch):
                return S + d * 0.5 * u + ch * (0.1 - 0.2 * v) * (1 - 0.45 * u) + V(0, side * 0.06 * u, 0)
            b.part('wing_' + side_name, sheet(wing, 6, 4, lambda u, v: 0.04 - 0.015 * u), 'wing', M=M)
            for k in range(3):
                root = wing(0.95, 0.15 + 0.35 * k)
                tip = root + d * (0.1 - 0.02 * k) + ch * (0.03 - 0.04 * k)
                b.part('feather_%d' % k, tube([root, tip], 0.03, 0.012, seg=6), 'wing', subsurf=1, M=M)
            continue
        flick = 7 * (step_l if side == -1 else step_r)
        wc = bc + V(-0.13, 0.205 * side, 0.08)
        W = tr(wc) @ rot_y(48 + flick) @ rot_x(side * 4)
        b.part('wing_' + side_name, xf(blob((0, 0, 0), 0.33, 0.05, 0.12, seg=18, rows=10), W), 'wing', M=M)
    # short legs and the stars of the show: big bright blue webbed feet
    for side_name, side, up in (('l', -1, step_l), ('r', 1, step_r)):
        hip = M @ V(0.03, 0.12 * side, 0.3)
        lift = 0.2 * up
        foot = V(0.04 + 0.1 * up, 0.13 * side, 0.04 + lift)
        knee = (hip + foot) / 2 + V(0.05 * up + 0.02, 0, 0)
        b.part('leg_' + side_name, tube([hip, knee, foot + V(0, 0, 0.02)], 0.06, 0.05, seg=10), 'foot', M=Matrix.Identity(4))
        Mf = tr(foot) @ rot_y(-30 * up)
        web = [V(-0.08, 0, 0), V(0.24, -0.15, 0), V(0.3, 0, 0), V(0.24, 0.15, 0)]
        b.part('web_' + side_name, xf(flat_poly(web, 0.045), Mf), 'foot', subsurf=1, M=Matrix.Identity(4))
        for k, yy in enumerate((-0.13, 0.0, 0.13)):
            b.part('toe_%s%d' % (side_name, k), xf(tube([V(-0.02, 0, 0.025), V(0.24, yy, 0.025), V(0.3, yy * 1.05, 0.02)], 0.03, 0.022, seg=8), Mf),
                   'foot_dark', subsurf=1, M=Matrix.Identity(4))


BOOBY = {p: dict(M=lambda t, P=P, p=p: pose_matrix(P, bob=0.015 * abs(math.sin(TAU * t)) if p == 'idle' else 0.0), P=P)
         for p, P in BOOBY_POSE.items()}


# ================================================================ PUFFER (centre swimmer, 0.71 m -> 1.2 m puffed)
PUFFER = {
    'swim': dict(M=lambda t: rot_y(3 * math.sin(TAU * t)), ns=1),
    'puff': dict(M=lambda t: Matrix.Identity(4), ns=1),
    'ko':   dict(M=lambda t: rot_x(180) @ rot_y(10), ns=-1),
}


def build_puffer(b, pose, t, P):
    """A spotted yellow pufferfish.  swim(t): a plump fish fanning its fins; puff(t): t = 0, .25, .5, .75 are the four
    inflation steps (25 % .. 100 %): it swells to a spiky ball with alarmed eyes and an 'o' mouth; ko: belly up."""
    ns = P['ns']
    pf = (t + 0.25) if pose == 'puff' else 0.0                      # 0.25 .. 1.0
    ko = pose == 'ko'
    fan = math.sin(TAU * t) if pose == 'swim' else 0.0
    rx = lerp(0.40, 0.56, pf)
    ry = lerp(0.30, 0.54, pf)
    rz = lerp(0.33, 0.55, pf)
    bc = V(0.0, 0, 0.0)
    b.part('body', blob(bc, rx, ry, rz, seg=28, rows=16), 'body')
    b.part('belly', ellipsoid(bc, X * rx * 1.01, Y * ry * 1.01, Z * rz * 1.01, seg=28, rows=6, phi0=math.radians(112)), 'belly')
    # brown spots on the back and flank
    for k, (az, el) in enumerate(((-1.4, 0.55), (-2.0, 0.35), (-2.5, 0.6), (-1.0, 0.85), (-2.9, 0.25), (-1.7, 0.05), (-2.3, -0.05), (2.6, 0.7))):
        c, n = on_ellipsoid(bc, (rx, ry, rz), az, el)
        ax, ay = perp_frame(n)
        rs = 0.045 * (1 + 0.3 * pf)
        b.part('spot%d' % k, ellipsoid(c + n * 0.003, ax * rs, ay * rs, n * 0.012, seg=10, rows=6), 'spot', subsurf=1)
    # spines (puffed only): cones around the silhouette, none facing the camera (they would read as dots)
    if pf > 0:
        L = 0.04 + 0.13 * pf
        k = 0
        for el in (-1.15, -0.75, -0.35, 0.0, 0.35, 0.75, 1.15):
            ring = max(4, int(round(14 * math.cos(el))))
            for j in range(ring):
                az = TAU * (j + 0.5 * (abs(round(el / 0.35)) % 2)) / ring
                c, n = on_ellipsoid(bc, (rx, ry, rz), az, el)
                if n.y < -0.45 or (math.cos(az) > 0.75 and abs(el) < 0.6):
                    continue                      # keep the camera-facing side and the face clear
                b.part('spine%d' % k, cone(c - n * 0.01, c + n * L, 0.026 + 0.012 * pf, seg=6), 'spine', subsurf=0, smooth=False)
                k += 1
    # tail fin: a little fan that sweeps side to side
    tb = V(-rx * 0.92, 0, 0.0)
    sw = 0.08 * fan

    def tail(u, v):
        return tb + V(-0.2 * u, sw * u * u + (0.0), (v * 2 - 1) * (0.06 + 0.14 * u))
    b.part('tail', sheet(tail, 4, 4, 0.02), 'fin')
    # pectoral fins fluttering: little paddles just behind the eyes
    for side_name, side in (('l', -1), ('r', 1)):
        c, n = on_ellipsoid(bc, (rx, ry, rz), side * 1.45, -0.15)
        Mp = tr(c + n * 0.03) @ rot_z(side * (25 + 30 * fan)) @ rot_y(-20)
        b.part('pec_' + side_name, xf(blob((-0.07, 0, 0), 0.085, 0.018, 0.05, seg=12, rows=6), Mp), 'fin', subsurf=1)
    c, n = on_ellipsoid(bc, (rx, ry, rz), math.pi, 1.2)
    b.part('dorsal', cone(c, c + V(-0.1, 0, 0.1), 0.06, flat=0.3, seg=8), 'fin', subsurf=1)
    # face: big eyes (wide and alarmed when puffed), puckered lips
    er = 0.085 * (1 + 0.25 * pf)
    for side, az in (('r', -0.42), ('l', -1.05)):
        c, n = on_ellipsoid(bc, (rx, ry, rz), az * ns, 0.38)
        b.eye(side, c - n * 0.015, n, er, pupil=0.5 - 0.15 * pf, lid=0.0 if pf else 0.18, lid_mat='body',
              shut='x' if ko else None, look=V(0.55, -0.8 * ns, 0.05))
    mc, mn = on_ellipsoid(bc, (rx, ry, rz), -0.12 * ns, -0.12)
    lr = 0.055 + 0.03 * pf
    b.part('lips', torus_bm(mc + mn * 0.01, mn, lr, 0.028 + 0.008 * pf, seg=16, sides=8), 'lips')
    b.part('mouth', blob(mc + mn * 0.015, 0.02, lr * 0.75, lr * 0.75, seg=10, rows=6), 'mouth', subsurf=1)


# ---------------------------------------------------------------- public API
BUILDERS = {
    'banana': (build_banana, BANANA), 'cacao': (build_cacao, CACAO), 'alpaca': (build_alpaca, ALPACA),
    'condor': (build_condor, CONDOR), 'frog': (build_frog, FROG), 'iguana': (build_iguana, IGUANA),
    'iceCube': (build_ice_cube, ICE), 'seaLion': (build_sea_lion, SEALION), 'penguin': (build_penguin, PENGUIN),
    'puffer': (build_puffer, PUFFER), 'booby': (build_booby, BOOBY),
    'coin': (build_coin, COIN), 'star': (build_star, STAR), 'qblock': (build_qblock, QBLOCK), 'used': (build_used, USED),
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
    fn(b, pose, t, P.get('P', P))
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


def frame_camera(kind):
    """Ortho scale 1.6 (the brief), widened for the tall alpaca; feet kinds are framed from the ground up."""
    cam = bpy.context.scene.camera
    size = SIZE[kind]
    if ORIGIN[kind] == 'feet':
        s = max(1.6, size * 1.3)
        cam.data.ortho_scale = s
        cam.location = (0.0, -4.0, s / 2 - 0.1)
    else:
        s = max(1.6, size * 1.3)
        cam.data.ortho_scale = s
        cam.location = (0.0, -4.0, 0.0)


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
        frame_camera(kind)
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
                print('%-8s %-10s t=%.3f  base tris %5d  subdivided %6d  x %.2f..%.2f (%.0f px)  z %.2f..%.2f (%.0f px)  %s'
                      % (kind, pose, t, triangle_count(root), triangle_count(root, evaluated=True), x0, x1, (x1 - x0) * PX,
                         z0, z1, (z1 - z0) * PX, path))
                outs.append(path)
        small = [thumbnail(p, 48) for p in outs]
        print('sheet', contact_sheet(outs, os.path.join(SCRATCH, '%s_sheet.png' % kind)))
        print('sheet48', contact_sheet(small, os.path.join(SCRATCH, '%s_sheet_48.png' % kind), cell=48))
        clear(kind)
