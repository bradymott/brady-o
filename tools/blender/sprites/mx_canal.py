# Mexico 1-2 "Xochimilco Float": the parallax background as a low-poly paper-craft diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a boat ride along the flower canals.
#
#   bg_far    the snow-capped volcano (at 300/1024 of the period) + hazy distant hills
#   bg_mid    slender ahuejote willows along the bank, teal canal water filling from z = 0 down, reflections
#   bg_near   parked trajineras (flat boats with cream canopies and flower-ringed name arches), mooring posts
#   ground    a wooden dock: planks with staggered seams, a lighter rim plank along the walking surface
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role so a look kit can restyle them later; every
# object carries obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer
# (px from the top of the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_canal.py
# (builds, then renders each layer + a composite preview + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mx_canal'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['bg_far', 'bg_mid', 'bg_near']   # back to front
BASES = {'bg_far': 300, 'bg_mid': 360, 'bg_near': 400}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#48b8f0', '#a8e4ff', '#f8ffe8']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
PALETTE = {
    'volcano_rock': '#9ab0c8', 'volcano_snow': '#f8fbff', 'hill_far': '#a8c8dc', 'hill_green': '#86c48e', 'hill_green2': '#6cb07a',
    'water_teal': '#3ab0a0', 'water_light': '#8ee0d4', 'water_reflect': '#2f9a8c', 'bank_earth': '#6a5038', 'bank_grass': '#5aa050',
    'willow_a': '#3a8a4a', 'willow_b': '#4a9e58', 'willow_c': '#2e7a3e', 'willow_trunk': '#4a3a2a',
    'flower_pink': '#ff3d8b', 'flower_yellow': '#ffb81a', 'flower_teal': '#18c2c2', 'flower_violet': '#8a4aff',
    'flower_green': '#5ad04a', 'flower_orange': '#ff6a3a', 'flower_white': '#fff8f0',
    'boat_pink': '#ff3d8b', 'boat_yellow': '#ffb81a', 'boat_teal': '#18c2c2', 'boat_violet': '#8a4aff',
    'boat_green': '#5ad04a', 'boat_orange': '#ff6a3a', 'boat_trim': '#fff4d8', 'boat_roof': '#fff4d8', 'post_wood': '#7a5030',
    'rope': '#d8c090',
    'plank_a': '#c8884a', 'plank_b': '#b07038', 'plank_c': '#d8a060', 'plank_gap': '#6a4a30', 'plank_cap': '#e0a868', 'plank_cap_hi': '#f4c888',
}

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

def material(name):
    """A plain Principled material (Base Color + roughness 0.6) named by colour role; the look kit restyles it later."""
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
        m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = hex_linear(PALETTE[name])
    bsdf.inputs['Roughness'].default_value = 0.6
    m.diffuse_color = hex_linear(PALETTE[name])
    return m

# ----------------------------------------------------------------------------------------------- mesh builder
COLL = {}

def _xf(at=(0, 0, 0), rot=None, scale=None):
    m = Matrix.Translation(Vector(at))
    if rot is not None:
        m = m @ Euler(rot).to_matrix().to_4x4()
    if scale is not None:
        m = m @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    return m

class Builder:
    """Accumulates chunky parts into one mesh object; each part carries a material role and flat/smooth shading."""
    def __init__(self, name, layer):
        self.name, self.layer = name, layer
        self.bm = bmesh.new()
        self.mats = []

    def _mi(self, role):
        if role not in self.mats:
            self.mats.append(role)
        return self.mats.index(role)

    def _add(self, part, role, smooth=False, mat4=None):
        bmesh.ops.recalc_face_normals(part, faces=part.faces)
        if mat4 is not None:
            bmesh.ops.transform(part, matrix=mat4, verts=part.verts)
        tmp = bpy.data.meshes.new('_part')
        part.to_mesh(tmp); part.free()
        mi = self._mi(role)
        for p in tmp.polygons:
            p.material_index = mi
            p.use_smooth = smooth
        self.bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        return self

    def box(self, role, at, size, bevel=0.05, rot=None):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
        b = min(bevel, min(size) * 0.3)
        if b > 0.004:
            bmesh.ops.bevel(bm, geom=bm.edges[:], offset=b, segments=1, profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._add(bm, role, False, _xf(at, rot))

    def rbox(self, role, at, size, bevel=0.1, segments=2, rot=None):
        """A rounded box (multi-segment bevel, smooth shaded): cobbles, pebbles, rock plates."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
        b = min(bevel, min(size) * 0.45)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=b, segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._add(bm, role, True, _xf(at, rot))

    def lathe(self, role, profile, segs, at=(0, 0, 0), yscale=1.0, cap_top=True, cap_bottom=False, jag=None, smooth=False, rot=None, phase=0.0):
        """Surface of revolution about local Z from a profile [(r, z), ...] bottom to top. `jag(k)` offsets the z of
        the first ring per segment (a zig-zag snow line). A final r = 0 makes an apex."""
        bm = bmesh.new(); rings = []
        for i, (r, z) in enumerate(profile):
            if r <= 1e-6:
                rings.append([bm.verts.new((0.0, 0.0, z))] * segs)
                continue
            ring = []
            for k in range(segs):
                a = TAU * k / segs + phase
                zz = z + (jag(k) if (i == 0 and jag) else 0.0)
                ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a) * yscale, zz)))
            rings.append(ring)
        for i in range(len(rings) - 1):
            lo, hi = rings[i], rings[i + 1]
            for k in range(segs):
                vs = [lo[k], lo[(k + 1) % segs], hi[(k + 1) % segs], hi[k]]
                uniq = []
                for v in vs:
                    if v not in uniq: uniq.append(v)
                if len(uniq) >= 3:
                    bm.faces.new(uniq)
        if cap_top and profile[-1][0] > 1e-6:
            bm.faces.new(rings[-1][::-1])
        if cap_bottom and profile[0][0] > 1e-6:
            bm.faces.new(rings[0])
        return self._add(bm, role, smooth, _xf(at, rot))

    def sphere(self, role, at, r, scale=(1, 1, 1), smooth=True, subdiv=1, rot=None):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
        return self._add(bm, role, smooth, _xf(at, rot, scale))

    def rod(self, role, p0, p1, r, segs=5, r2=None):
        a, b = Vector(p0), Vector(p1); d = b - a
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=d.length)
        q = d.normalized().to_track_quat('Z', 'Y')
        return self._add(bm, role, False, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())

    def slab(self, role, pts, depth, at=(0, 0, 0), rot=None):
        """A flat outline in the local XZ plane (counter-clockwise seen from -Y) extruded `depth` along +Y."""
        bm = bmesh.new()
        vs = [bm.verts.new((x, 0.0, z)) for x, z in pts]
        f = bm.faces.new(vs)
        res = bmesh.ops.extrude_face_region(bm, geom=[f])
        new_verts = [g for g in res['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=(0.0, depth, 0.0), verts=new_verts)
        return self._add(bm, role, False, _xf(at, rot))

    def arch(self, role, at, w, h, depth, rot=None, segs=8):
        """An arched opening silhouette: a rectangle topped by a half-disc, bottom centre at `at`."""
        r = w / 2
        pts = [(-r, 0.0), (r, 0.0)]
        for i in range(segs + 1):
            a = math.pi * i / segs
            pts.append((r * math.cos(a), h - r + r * math.sin(a)))
        return self.slab(role, pts, depth, at, rot)

    def mark(self):
        return len(self.bm.verts)

    def transform_since(self, mark, mat4):
        """Move every part added since `mark` (parts are appended in order)."""
        self.bm.verts.ensure_lookup_table()
        bmesh.ops.transform(self.bm, matrix=mat4, verts=[self.bm.verts[i] for i in range(mark, len(self.bm.verts))])
        return self

    def done(self, period=P):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me); self.bm.free()
        for role in self.mats:
            me.materials.append(material(role))
        ob = bpy.data.objects.new(self.name, me)
        ob['sprite_layer'] = self.layer
        COLL[self.layer].objects.link(ob)
        if period:
            tile(ob, period)
        return ob

def tile(ob, period=P):
    """Duplicate (linked) at x ± period whatever crosses the strip edges so the layer repeats seamlessly."""
    xs = [v.co.x + ob.location.x for v in ob.data.vertices]
    if not xs:
        return
    for dx in ((period,) if min(xs) < 0 else ()) + ((-period,) if max(xs) > period else ()):
        d = ob.copy(); d.data = ob.data
        d.name = f'{ob.name}.tile{"+" if dx > 0 else "-"}'
        d.location.x += dx
        d['sprite_layer'] = ob['sprite_layer']
        COLL[ob['sprite_layer']].objects.link(d)

def wraps(xc, half, period=P):
    """x offsets at which a part centred at xc with half-width `half` must be copied so a one-period mesh tiles."""
    return (0.0,) + ((period,) if xc - half < 0 else ()) + ((-period,) if xc + half > period else ())

T = 32 / 28.1                              # one floor tile (1.139 m): ground elements never cross a tile edge
CELL_MARGIN = 0.045                        # mortar / dirt kept clear inside every tile edge

def _split(a, b, n, rng, jitter=0.3):
    w = [rng.uniform(1 - jitter, 1 + jitter) for _ in range(n)]
    s = (b - a) / sum(w)
    edges = [a]
    for x in w:
        edges.append(edges[-1] + x * s)
    edges[-1] = b
    return edges

def cell_rects(col, row, rng, rows=(2, 3), cols=(2, 3), gap=0.09, top=0.0, jitter=0.3):
    """Whole stones filling floor tile (col, row): the tile's inner rectangle (CELL_MARGIN inside every edge, plus
    `top` below the tile's top edge for the kerb cap) split into a jittered grid with `gap` between stones. Yields
    (xc, zc, w, h). The engine draws the floor one 32-px tile at a time from a random column of the strip, so nothing
    yielded ever crosses a tile edge (effective margin CELL_MARGIN + gap / 2)."""
    x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
    z0, z1 = -row * T - CELL_MARGIN - top, -(row + 1) * T + CELL_MARGIN
    zs = _split(z0, z1, rng.choice(rows), rng, jitter)
    for za, zb in zip(zs, zs[1:]):
        xs = _split(x0, x1, rng.choice(cols), rng, jitter)
        for xa, xb in zip(xs, xs[1:]):
            yield ((xa + xb) / 2, (za + zb) / 2, (xb - xa) - gap, abs(zb - za) - gap)

def new_collection(name):
    old = bpy.data.collections.get(name)
    if old is not None:
        for ob in list(old.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    COLL[name] = c
    return c

def clear():
    for name in LAYERS + [GROUND_COLL]:
        c = bpy.data.collections.get(name)
        if c is None:
            continue
        for ob in list(c.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(c)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)
    COLL.clear()

def triangle_count(names=None):
    total = 0
    for name in (names or LAYERS):
        for ob in COLL[name].objects:
            ob.data.calc_loop_triangles()
            total += len(ob.data.loop_triangles)
    return total

# ----------------------------------------------------------------------------------------------- bg_far
def build_far(rng):
    L = 'bg_far'
    # the volcano at 300/1024 of the period, 120 px (4.3 m) tall, ~21 m wide; squashed in depth to stay within y ±6
    vx, vy, vys = P * 300 / 1024, -0.5, 0.3
    s, rs = 0.8, 0.85
    prof = [(12.5 * rs, 0.0), (8.0 * rs, 1.3 * s), (5.2 * rs, 2.6 * s), (3.4 * rs, 3.8 * s), (2.3 * rs, 4.7 * s), (1.6 * rs, 5.3 * s)]
    B = Builder('far_volcano', L)
    B.lathe('volcano_rock', prof, 12, at=(vx, vy, 0), yscale=vys)
    def rock_r(z):
        for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return prof[-1][0]
    snow = [(rock_r(z) + 0.18, z) for z in (3.55 * s, 4.0 * s, 4.7 * s, 5.3 * s)] + [(1.5, 5.42 * s)]
    B.lathe('volcano_snow', snow, 12, at=(vx, vy, 0), yscale=vys, jag=lambda k: (-0.38 if k % 2 else 0.0))
    B.done()
    def hill(name, x, y, R, h, role, yscale):
        prof = [(R * math.cos(t * math.pi / 2), h * math.sin(t * math.pi / 2)) for t in (0, 0.3, 0.55, 0.78, 0.93, 1.0)]
        Builder(name, L).lathe(role, prof, 12, at=(x, y, 0), yscale=yscale, smooth=False).done()
    hill('far_hill_a', 24.0, 2.0, 9.5, 1.9, 'hill_far', 0.4)
    hill('far_hill_b', 34.0, 2.2, 7.0, 1.5, 'hill_far', 0.4)
    hill('far_hill_c', 2.5, 2.1, 6.0, 1.3, 'hill_far', 0.4)
    hill('far_hill_d', 17.5, -2.2, 6.5, 1.25, 'hill_green', 0.45)
    hill('far_hill_e', 30.0, -2.4, 5.5, 1.05, 'hill_green2', 0.45)
    hill('far_hill_f', 6.0, -2.5, 5.0, 1.0, 'hill_green', 0.45)

# ----------------------------------------------------------------------------------------------- bg_mid
def build_mid(rng):
    L = 'bg_mid'
    # the canal: a teal band filling from z = 0 downward, with pale ripple strokes, in front of a low earth bank
    B = Builder('mid_water', L)
    B.box('water_teal', (P / 2, 1.0, -2.2), (P, 6.0, 4.4), bevel=0.0)
    B.done(period=None)
    B = Builder('mid_ripples', L)
    for i in range(44):
        x, z, w = rng.uniform(0, P), -rng.uniform(0.2, 2.2), rng.uniform(0.5, 1.5)
        for dx in wraps(x, w / 2):
            B.box('water_light', (x + dx, -2.1, z), (w, 0.05, 0.08), bevel=0.0)
    B.done(period=None)
    B = Builder('mid_bank', L)
    B.box('bank_earth', (P / 2, 3.2, 0.16), (P, 3.4, 0.32), bevel=0.0)
    B.box('bank_grass', (P / 2, 3.2, 0.38), (P, 3.6, 0.14), bevel=0.0)
    B.done(period=None)
    # the willows: a dense row, staggered in depth, each with a flattened reflection in the water
    x, i = rng.uniform(0.3, 1.0), 0
    while x < P:
        h = rng.uniform(4.2, 7.2)
        r = rng.uniform(0.55, 0.9)
        y = rng.choice([1.4, 2.6, 3.8])
        role = rng.choice(['willow_a', 'willow_b', 'willow_c'])
        willow(L, f'mid_willow_{i}', x, y, h, r, role, rng)
        x += rng.uniform(0.9, 1.9)
        i += 1
    # flowers along the bank (lirios and marigolds), every few metres
    B = Builder('mid_flowers', L)
    for k in range(18):
        fx = rng.uniform(0, P)
        role = rng.choice(['flower_pink', 'flower_yellow', 'flower_orange', 'flower_violet', 'flower_white'])
        for dx in wraps(fx, 0.5):
            for (px, pz, pr) in ((-0.22, 0.52, 0.17), (0.2, 0.58, 0.19), (0.0, 0.78, 0.17), (0.35, 0.44, 0.13)):
                B.sphere(role, (fx + dx + px, 0.4, pz), pr, subdiv=1)
            B.sphere('flower_green', (fx + dx, 0.55, 0.42), 0.36, scale=(1.3, 0.8, 0.55), subdiv=1)
    B.done(period=None)

def willow(L, name, x, y, h, r, role, rng):
    B = Builder(name, L)
    B.rod('willow_trunk', (x, y, 0.0), (x, y, 1.4), 0.13, segs=6)
    cz = lambda t: 0.9 + (h - 0.9) * t
    prof = [(r * 0.3, cz(0.0)), (r * 0.85, cz(0.12)), (r, cz(0.36)), (r * 0.88, cz(0.6)), (r * 0.6, cz(0.8)), (r * 0.3, cz(0.94)), (0.0, cz(1.0))]
    B.lathe(role, prof, 7, at=(x, y, 0.0), yscale=0.8, phase=rng.uniform(0, TAU), cap_bottom=True)
    # reflection: a squashed, inverted canopy just in front of the water surface
    k = h / 6.0
    rprof = [(0.0, -2.0 * k), (r * 0.45, -1.6 * k), (r * 0.8, -1.0 * k), (r * 0.75, -0.45 * k), (r * 0.3, -0.12 * k)]
    B.lathe('water_reflect', rprof, 7, at=(x, -2.15, 0.0), yscale=0.2, phase=rng.uniform(0, TAU), cap_top=True)
    B.done()

# ----------------------------------------------------------------------------------------------- bg_near
BOAT_ROLES = ['boat_pink', 'boat_yellow', 'boat_teal', 'boat_violet', 'boat_green', 'boat_orange']
FLOWER_ROLES = ['flower_pink', 'flower_yellow', 'flower_teal', 'flower_violet', 'flower_green', 'flower_orange']

def build_near(rng):
    L = 'bg_near'
    roles = BOAT_ROLES[:]
    rng.shuffle(roles)
    n = 5
    pitch = P / n                              # 7.28 m: a 4.2 m boat + a ~3 m gap with a mooring post in it
    x0 = rng.uniform(0.5, 2.0)
    for i in range(n):
        x = x0 + i * pitch + rng.uniform(-0.4, 0.4)
        boat(L, i, x, roles[i % len(roles)], rng)
        post(L, f'near_post_{i}', x + 4.2 + (pitch - 4.2) * rng.uniform(0.35, 0.65), rng)

def post(L, name, x, rng):
    B = Builder(name, L)
    tilt = rng.uniform(-0.06, 0.06)
    B.rod('post_wood', (x, 1.0, -0.5), (x + tilt * 3.4, 1.0, 2.9), 0.11, segs=6)
    B.box('post_wood', (x + tilt * 3.4, 1.0, 2.95), (0.3, 0.3, 0.12), bevel=0.02)
    for z in (1.5, 1.72):
        B.lathe('rope', [(0.16, 0.0), (0.16, 0.12)], 8, at=(x + tilt * (z + 0.5), 1.0, z), cap_top=True, cap_bottom=True)
    B.done()

def boat(L, i, x, role, rng):
    """A trajinera, left end at `x`: flat hull, four posts, a cream canopy, the flower-ringed name arch on top."""
    LEN, W = 4.2, 1.6
    cx = x + LEN / 2
    B = Builder(f'near_boat_{i}', L)
    hull = [(0.3, 0.0), (LEN - 0.3, 0.0), (LEN, 0.72), (0.0, 0.72)]
    B.slab(role, hull, W, at=(x, -W / 2, 0.0))
    B.box('boat_trim', (cx, 0.0, 0.76), (LEN + 0.04, W + 0.08, 0.1), bevel=0.02)
    # a bench and a little table inside, peeking over the gunwale
    B.box('post_wood', (cx, 0.0, 1.0), (LEN - 1.2, 0.5, 0.12), bevel=0.02)
    for sx in (0.4, LEN - 0.4):
        for sy in (-W / 2 + 0.12, W / 2 - 0.12):
            B.box('post_wood', (x + sx, sy, 1.85), (0.1, 0.1, 2.2), bevel=0.0)
    B.box('boat_roof', (cx, 0.0, 2.96), (LEN + 0.3, W + 0.4, 0.14), bevel=0.03)
    B.box(role, (cx, -(W + 0.4) / 2 - 0.02, 2.78), (LEN + 0.3, 0.06, 0.26), bevel=0.0)
    # name arch: an elliptical band standing on the roof, flowers all round it, a cream name board inside
    R, RZ, T = 1.65, 0.95, 0.2
    pts = []
    for k in range(9):
        a = math.pi * k / 8
        pts.append((-(R + T) * math.cos(a), (RZ + T) * math.sin(a)))
    for k in range(8, -1, -1):
        a = math.pi * k / 8
        pts.append((-(R - T) * math.cos(a), (RZ - T) * math.sin(a)))
    B.slab('boat_trim', pts, 0.08, at=(cx, -0.35, 3.0))
    B.box('boat_trim', (cx, -0.3, 3.3), (1.7, 0.06, 0.34), bevel=0.0)
    order = FLOWER_ROLES[:]
    rng.shuffle(order)
    for k in range(11):
        a = math.pi * k / 10
        fx, fz = cx - (R + 0.04) * math.cos(a), 3.0 + (RZ + 0.04) * math.sin(a)
        B.sphere(order[k % len(order)], (fx, -0.42, fz), 0.21, subdiv=1)
    for k in range(10):
        a = math.pi * (k + 0.5) / 10
        fx, fz = cx - (R - 0.08) * math.cos(a), 3.0 + (RZ - 0.1) * math.sin(a)
        B.sphere(order[(k + 3) % len(order)], (fx, -0.42, fz), 0.15, subdiv=1)
    # a little bunting of flowers along the roof edge
    for k in range(7):
        B.sphere(order[(k + 1) % len(order)], (x - 0.1 + (k + 0.5) * (LEN + 0.3) / 7, -(W + 0.4) / 2 - 0.08, 2.62), 0.12, subdiv=1)
    B.done()

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_far(random.Random(rng.random()))
    build_mid(random.Random(rng.random()))
    build_near(random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """The dock: wooden planks 3 tiles deep, a lighter rim plank along the walking surface (z = 0). Laid out per
    32-px tile (see cell_rects) so no board crosses a tile edge. Periodic in x with period GP (not P), its own
    collection 'ground'. Returns the collection."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('plank_gap', (GP / 2, 0.3, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('plank_cap', (GP / 2, 0.1, -0.13), (GP, 0.9, 0.26), bevel=0.0)
    B.box('plank_cap_hi', (GP / 2, 0.08, -0.03), (GP, 0.95, 0.06), bevel=0.0)
    B.done(period=None)
    # planks: each 32-px floor tile holds two whole boards, one per course, so the engine can draw
    # the tiles in any order; the seams therefore stagger tile by tile rather than running across the strip
    B = Builder('ground_planks', L)
    roles = ['plank_a', 'plank_b', 'plank_c']
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(2,), cols=(1,), gap=0.09, top=(0.26 if row == 0 else 0.0), jitter=0.2):
                B.box(rng.choice(roles), (xc, -0.1, zc), (w, 0.4, h), bevel=0.03)
    B.done(period=None)
    return c

# ----------------------------------------------------------------------------------------------- preview render
FRAME_H = P * RES[1] / RES[0]

def z_center_for_row(row):
    """Camera z that puts the layer's ground line (z = 0) on pixel row `row` from the top of the strip."""
    return row * FRAME_H / RES[1] - FRAME_H / 2

def setup_render(scene):
    scene.render.resolution_x, scene.render.resolution_y = RES
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    try:
        scene.eevee.taa_render_samples = 24
    except AttributeError:
        pass
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    cam_data = bpy.data.cameras.new('sprite_cam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = P
    cam_data.clip_start = 0.1
    cam_data.clip_end = 200
    cam = bpy.data.objects.new('sprite_cam', cam_data)
    cam.rotation_euler = (math.pi / 2, 0, 0)
    cam.location = (P / 2, -30, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    sun_data = bpy.data.lights.new('sprite_sun', 'SUN')
    sun_data.energy = 3.0
    sun_data.angle = math.radians(4)
    sun = bpy.data.objects.new('sprite_sun', sun_data)
    sun.rotation_euler = Vector((0.55, 0.65, -0.75)).normalized().to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.get('sprite_world') or bpy.data.worlds.new('sprite_world')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.55, 0.65, 0.85, 1.0)
    bg.inputs['Strength'].default_value = 0.9
    scene.world = world
    return cam

def _show_only(name):
    for n, c in COLL.items():
        c.hide_render = (n != name)

def render_layer(scene, cam, layer, path):
    _show_only(layer)
    cam.data.ortho_scale = P
    scene.render.resolution_x, scene.render.resolution_y = RES
    cam.location = (P / 2, -30, z_center_for_row(BASES[layer]))
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def render_ground(scene, cam, path, scale=2):
    """The floor strip: 8 x 3 tiles (256 x 96 logical px) with the walking surface along the top edge."""
    _show_only(GROUND_COLL)
    cam.data.ortho_scale = GP
    scene.render.resolution_x, scene.render.resolution_y = 256 * scale, 96 * scale
    cam.location = (GP / 2, -30, -GROUND_DEPTH / 2)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def load_pixels(path):
    import numpy as np
    img = bpy.data.images.load(path)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    bpy.data.images.remove(img)
    return buf.reshape(h, w, 4)

def save_pixels(path, px):
    import numpy as np
    h, w = px.shape[:2]
    img = bpy.data.images.new('_out', w, h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(px, dtype=np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)

def composite(paths, out_path, sky=SKY):
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does."""
    import numpy as np
    base = None
    for layer in LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            h, w = px.shape[:2]
            base = np.zeros_like(px); base[..., 3] = 1.0
            stops = [hex_linear(c)[:3] for c in sky]
            t = (h - 1 - np.arange(h)) / max(1, h - 1)          # 0 at the top row (image rows are bottom-up)
            t = t * (len(stops) - 1)
            i = np.minimum(t.astype(int), len(stops) - 2); f = (t - i)[:, None]
            s = np.array(stops)
            col = s[i] * (1 - f) + s[i + 1] * f
            base[..., :3] = col[:, None, :]
        a = px[..., 3:4]
        base[..., :3] = px[..., :3] * a + base[..., :3] * (1 - a)
    save_pixels(out_path, base)

def seam_check(path, out_path):
    """Roll the strip by half a period so the tile seam sits mid-frame (what the renderer's tiling shows)."""
    import numpy as np
    px = load_pixels(path)
    save_pixels(out_path, np.roll(px, px.shape[1] // 2, axis=1))

if __name__ == '__main__':
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    os.makedirs(SCRATCH, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    build(seed)
    print('triangles:', triangle_count(), {l: triangle_count([l]) for l in LAYERS})
    cam = setup_render(scene)
    paths = {}
    for layer in LAYERS:
        paths[layer] = os.path.join(SCRATCH, f'{MODULE}_{layer}.png')
        render_layer(scene, cam, layer, paths[layer])
        print('rendered', paths[layer])
    comp = os.path.join(SCRATCH, f'{MODULE}_composite.png')
    composite(paths, comp)
    print('composite', comp)
    for layer in LAYERS:
        sp = os.path.join(SCRATCH, f'{MODULE}_{layer}_seam.png')
        seam_check(paths[layer], sp)
    build_ground(seed)
    print('ground triangles:', triangle_count([GROUND_COLL]))
    gp = os.path.join(SCRATCH, f'{MODULE}_ground.png')
    render_ground(scene, cam, gp)
    print('ground', gp)
    for c in COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{MODULE}.blend'))
