# Mozambique 4-5 "Ilha Fortress": the parallax background as a low-poly toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a coral-stone island fort over the sea.
#
#   L0  fort walls (base 330, the only layer): the bright sea filling from z = 0 down, and four crenellated wall
#       segments per period, each 7.1 m long with a string course and a sloping bastion on its right end. Each
#       segment carries one feature: a gateway arch with pennants, cannon embrasures with coconut cannons, a round
#       watch turret with a tiled cap, or a stair and a sentry box. Stone blocks show as paler and darker plates.
#   ground: the engine's 'grass' floor in the fort's colours (pale sea-grass cap over coral-stone rubble)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named '<MODULE>_<role>'; every object carries
# obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer (px from the top of
# the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mz_fort.py
# (builds, then renders each layer + composite previews + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mz_fort'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0']
BASES = {'L0': 330}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#3a8ad8', '#9ad0ff', '#fff4e0']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mzbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
# colour roles; the Blender material is named '<MODULE>_<role>' so the five Mozambique themes never clash.
# Roles whose name contains 'glow' render unlit (the look kit makes them emissive).
PALETTE = {
    'sea': '#2a8ab8', 'sea_deep': '#0e4a7a', 'sea_hi': '#7cd0ec',
    'wall': '#c8b898', 'wall_lt': '#dccfb0', 'wall_dk': '#b0a082', 'course': '#a89878', 'bastion': '#c0b090', 'merlon': '#d2c2a2',
    'shadow': '#5a4e3c', 'tile_roof': '#b8603a', 'pennant': '#ffd23a', 'pennant2': '#1a9a5a', 'cannon': '#3a3a44', 'coconut': '#6a4a2a',
    'palm_trunk': '#8a6a40', 'palm_leaf': '#3a9a5a',
    'g_cap': '#c8b898', 'g_cap_hi': '#e8dcc0', 'g_dirt': '#a89878', 'g_dirt2': '#7a6a50', 'g_rock': '#b8a888',
}

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

def material(role):
    """A plain Principled material (Base Color + roughness 0.6) named '<MODULE>_<role>'; the look kit restyles it."""
    name = f'{MODULE}_{role}'
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
        m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = hex_linear(PALETTE[role])
    bsdf.inputs['Roughness'].default_value = 0.6
    m.diffuse_color = hex_linear(PALETTE[role])
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
        """A rounded box (multi-segment bevel, smooth shaded): pebbles, stones, rock plates."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
        b = min(bevel, min(size) * 0.45)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=b, segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._add(bm, role, True, _xf(at, rot))

    def lathe(self, role, profile, segs, at=(0, 0, 0), yscale=1.0, cap_top=True, cap_bottom=False, jag=None, smooth=False, rot=None, phase=0.0):
        """Surface of revolution about local Z from a profile [(r, z), ...] bottom to top. `jag(k)` offsets the z of
        the first ring per segment. A final r = 0 makes an apex."""
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
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=d.length)
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
CELL_MARGIN = 0.045                        # mortar / soil kept clear inside every tile edge

def _split(a, b, n, rng, jitter=0.3):
    w = [rng.uniform(1 - jitter, 1 + jitter) for _ in range(n)]
    s = (b - a) / sum(w)
    edges = [a]
    for x in w:
        edges.append(edges[-1] + x * s)
    edges[-1] = b
    return edges

def cell_rects(col, row, rng, rows=(2, 3), cols=(2, 3), gap=0.09, top=0.0, jitter=0.3):
    """Whole elements filling floor tile (col, row): the tile's inner rectangle (CELL_MARGIN inside every edge, plus
    `top` below the tile's top edge for the cap) split into a jittered grid with `gap` between elements. Yields
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

def plain(L, name, role, y=2.0, depth=5.0, top=0.0, bottom=-3.0):
    """A full-period slab from `top` down to `bottom`: the solid ground under a layer so nothing shows through."""
    B = Builder(name, L)
    B.box(role, (P / 2, y, (top + bottom) / 2), (P, depth, top - bottom), bevel=0.0)
    return B.done(period=None)

# ----------------------------------------------------------------------------------------------- sea shapes
def dhow(B, x, y, s, hull, sail, mast, rng, facing=1):
    """A lateen-rigged dhow, `s` = hull length in metres, bow toward +X when facing = 1; sits on the water at z = 0."""
    f = facing
    pts = [(0.06 * s, -0.06 * s), (0.94 * s, -0.06 * s), (1.08 * s, 0.2 * s), (0.98 * s, 0.24 * s), (0.5 * s, 0.19 * s), (-0.02 * s, 0.26 * s), (-0.08 * s, 0.2 * s)]
    if f < 0:
        pts = [(-px, pz) for px, pz in pts][::-1]
    B.slab(hull, pts, 0.32 * s, at=(x, y - 0.16 * s, 0.0))
    mx = x + f * 0.42 * s
    B.rod(mast, (mx, y, 0.1 * s), (mx + f * 0.06 * s, y, 1.05 * s), 0.018 * s, segs=4, r2=0.012 * s)
    ya, yb = Vector((mx - f * 0.25 * s, y - 0.02 * s, 0.3 * s)), Vector((mx + f * 0.45 * s, y - 0.02 * s, 1.18 * s))
    B.rod(mast, ya, yb, 0.016 * s, segs=4)
    sail_pts = [(ya.x + f * 0.03 * s, ya.z + 0.02 * s), (yb.x - f * 0.03 * s, yb.z - 0.05 * s), (mx + f * 0.3 * s, 0.26 * s)]
    if f < 0:
        sail_pts = sail_pts[::-1]
    B.slab(sail, sail_pts, 0.04 * s, at=(0, y - 0.04 * s, 0))

def ripples(B, rng, role, n, z0, z1, w0, w1, y=-1.5, period=P):
    """Short pale bars on the water: the painter's ripple strokes."""
    for i in range(n):
        x, z, w = rng.uniform(0, period), rng.uniform(z0, z1), rng.uniform(w0, w1)
        for dx in wraps(x, w / 2, period):
            B.box(role, (x + dx, y, z), (w, 0.04, 0.07), bevel=0.0)

# ----------------------------------------------------------------------------------------------- fort pieces
WALL_H, WALL_W, BAST_W, BAST_H = 3.2, 7.1, 1.8, 3.9
SEG = P / 4                                   # 9.1 m per segment, like the painter's 256 px

def merlons(B, x0, x1, z, role, n, w=0.43):
    pitch = (x1 - x0) / n
    for k in range(n):
        B.box(role, (x0 + pitch * (k + 0.5), -0.1, z + w / 2), (w, 1.9, w), bevel=0.03)

def blocks(B, rng, x0, x1, z0, z1, n, y=-1.02):
    """Paler and darker coral-stone plates on the wall face."""
    for k in range(n):
        w, h = rng.uniform(0.5, 1.1), rng.uniform(0.25, 0.42)
        x = rng.uniform(x0 + w / 2, x1 - w / 2); z = rng.uniform(z0 + h / 2, z1 - h / 2)
        B.box(rng.choice(('wall_lt', 'wall_dk')), (x, y, z), (w, 0.04, h), bevel=0.0)

def palm(B, x, y, h, rng):
    """A coconut palm peeking over the wall: a curved trunk and a burst of fronds."""
    lean = rng.uniform(-0.25, 0.25)
    p0, p1, p2 = Vector((x, y, 0.0)), Vector((x + lean * h * 0.4, y, h * 0.55)), Vector((x + lean * h, y, h))
    B.rod('palm_trunk', p0, p1, 0.11, segs=5, r2=0.09); B.rod('palm_trunk', p1, p2, 0.09, segs=5, r2=0.07)
    for k in range(7):
        a = TAU * k / 7 + 0.3
        tip = p2 + Vector((math.cos(a) * 1.4, math.sin(a) * 0.5, -0.55 + 0.3 * (k % 2)))
        mid = p2 + (tip - p2) * 0.5 + Vector((0, 0, 0.3))
        B.rod('palm_leaf', p2, mid, 0.12, segs=4, r2=0.09); B.rod('palm_leaf', mid, tip, 0.09, segs=4, r2=0.02)
    for k in range(3):
        B.sphere('coconut', p2 + Vector((0.18 * (k - 1), -0.15, -0.2)), 0.11, subdiv=0)

def segment(B, rng, x0, feature):
    """One wall segment with its bastion: a thick wall 3.2 m tall, merlons, a string course at 1.07 m and the
    sloping bastion on the right; then its feature."""
    x1 = x0 + WALL_W
    B.box('wall', (x0 + WALL_W / 2, 0.0, WALL_H / 2 - 0.3), (WALL_W, 2.0, WALL_H + 0.6), bevel=0.04)
    B.box('course', (x0 + WALL_W / 2, -0.02, 1.07), (WALL_W, 2.06, 0.14), bevel=0.0)
    B.box('wall_lt', (x0 + WALL_W / 2, -0.02, WALL_H - 0.08), (WALL_W, 2.06, 0.16), bevel=0.0)                   # the parapet cap
    merlons(B, x0 + 0.1, x1 - 0.1, WALL_H, 'merlon', 10)
    blocks(B, rng, x0 + 0.2, x1 - 0.2, 1.25, WALL_H - 0.3, 7)
    blocks(B, rng, x0 + 0.2, x1 - 0.2, 0.0, 0.95, 4)
    # the bastion: a sloped-top wedge, taller than the wall, with a merlon pair
    pts = [(x1, -0.3), (x1 + BAST_W, -0.3), (x1 + BAST_W, WALL_H), (x1, BAST_H)]
    B.slab('bastion', pts, 2.4, at=(0, -1.2, 0))
    B.box('course', (x1 + BAST_W / 2, -1.22, 1.07), (BAST_W, 2.46, 0.14), bevel=0.0)
    B.box('merlon', (x1 + 0.45, -0.6, BAST_H + 0.2), (0.5, 1.6, 0.42), bevel=0.03)
    B.box('merlon', (x1 + 1.35, -0.6, WALL_H + 0.52), (0.5, 1.6, 0.42), bevel=0.03)
    cx = x0 + WALL_W / 2
    if feature == 'gate':
        B.arch('wall_lt', (cx, -1.04, -0.02), 1.9, 2.55, 0.05)
        B.arch('shadow', (cx, -1.08, 0.0), 1.5, 2.3, 0.05)
        for dx, role in ((-2.2, 'pennant'), (2.2, 'pennant2')):
            B.rod('cannon', (cx + dx, -0.2, WALL_H), (cx + dx, -0.2, WALL_H + 1.9), 0.04, segs=4)
            B.slab(role, [(0.0, 1.35), (0.0, 1.85), (0.9, 1.6)], 0.03, at=(cx + dx + 0.04, -0.22, WALL_H))
    elif feature == 'cannons':
        for dx in (-2.0, 0.0, 2.0):
            B.box('shadow', (cx + dx, -1.03, 2.1), (0.7, 0.06, 0.62), bevel=0.0)
            B.rod('cannon', (cx + dx, -0.7, 2.1), (cx + dx, -1.6, 1.95), 0.13, segs=6, r2=0.1)
            B.lathe('cannon', [(0.15, 0.0), (0.15, 0.08)], 6, at=(cx + dx, -1.55, 1.96), rot=(1.5, 0, 0), cap_top=True, cap_bottom=True)
        B.sphere('coconut', (cx - 1.0, -1.15, 0.26), 0.2, subdiv=1)
        B.sphere('coconut', (cx - 0.7, -1.1, 0.22), 0.18, subdiv=1)
        B.sphere('coconut', (cx - 0.85, -1.2, 0.52), 0.18, subdiv=1)
    elif feature == 'turret':
        tx = cx + 1.6
        B.lathe('wall', [(1.05, 2.4), (1.05, 4.6)], 10, at=(tx, 0.4, 0), cap_top=True, cap_bottom=True)
        B.lathe('course', [(1.14, 4.3), (1.14, 4.45)], 10, at=(tx, 0.4, 0), cap_top=True, cap_bottom=True)
        B.lathe('tile_roof', [(1.25, 4.55), (0.0, 5.75)], 10, at=(tx, 0.4, 0), cap_bottom=True)
        B.box('shadow', (tx, -0.7, 3.5), (0.22, 0.2, 0.45), bevel=0.0)
        blocks(B, rng, cx - 3.2, cx + 0.3, 1.3, 2.9, 2)
        palm(B, cx - 2.2, 1.2, 4.6, rng)
    elif feature == 'stair':
        for k in range(6):
            B.box('wall_dk', (cx - 2.4 + k * 0.45, -0.4, 1.25 + k * 0.32), (0.5, 1.2, 0.16), bevel=0.0)
        B.box('wall', (cx + 1.6, 0.2, WALL_H + 0.55), (1.2, 1.4, 1.1), bevel=0.04)                 # sentry box
        B.lathe('tile_roof', [(0.9, WALL_H + 1.1), (0.0, WALL_H + 1.75)], 4, at=(cx + 1.6, 0.2, 0), phase=math.pi / 4, cap_bottom=True)
        B.box('shadow', (cx + 1.6, -0.52, WALL_H + 0.55), (0.42, 0.06, 0.62), bevel=0.0)
        palm(B, cx - 0.4, 1.3, 4.2, rng)

# ----------------------------------------------------------------------------------------------- L0: the fort
def build_L0(rng):
    L = 'L0'
    B = Builder('L0_sea', L)
    B.box('sea', (P / 2, 2.5, -3.0), (P, 5.0, 6.0), bevel=0.0)
    B.box('sea_deep', (P / 2, 2.4, -4.6), (P, 5.0, 2.8), bevel=0.0)
    ripples(B, rng, 'sea_hi', 26, -2.4, -0.15, 0.5, 1.6, y=-0.1)
    B.done(period=None)
    features = ['gate', 'cannons', 'turret', 'stair']
    rng.shuffle(features)
    for i in range(4):
        B = Builder(f'L0_segment_{i}', L)
        segment(B, rng, i * SEG + 0.1, features[i])
        B.done()

BUILDERS = {'L0': build_L0}

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    for name in LAYERS:
        BUILDERS[name](random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """The theme's floor in the engine's 'grass' style with this theme's colours: a turf cap along the walking surface
    (z = 0) with a pale highlight line and a lumpy underside, over soil with embedded stones and darker earth patches,
    3 tiles deep. Laid out per 32-px tile (see cell_rects: at most 2 rows of at most 2 elements) so the engine can draw
    the tiles in any order. Periodic in x with period GP (not P), its own collection 'ground'. Returns the collection."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('g_dirt', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_stones', L)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(0.4 if row == 0 else 0.0), jitter=0.3):
                r = rng.random()
                if r < 0.42:
                    sw, sh = w * rng.uniform(0.55, 0.85), h * rng.uniform(0.55, 0.85)
                    B.rbox('g_rock', (xc + rng.uniform(-1, 1) * (w - sw) / 2, -0.08, zc + rng.uniform(-1, 1) * (h - sh) / 2), (sw, 0.4, sh), bevel=0.14, segments=2)
                elif r < 0.72:
                    B.box('g_dirt2', (xc, 0.25, zc), (w, 0.3, h), bevel=0.03)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('g_cap', (GP / 2, 0.1, -0.21), (GP, 0.9, 0.32), bevel=0.0)          # z -0.05 .. -0.37
    B.box('g_cap_hi', (GP / 2, 0.04, -0.09), (GP, 0.96, 0.05), bevel=0.0)
    for col in range(8):
        x0 = col * T + CELL_MARGIN + 0.1
        for k in range(2):
            xc = x0 + (k + 0.5) * (T - 0.3) / 2 + rng.uniform(-0.08, 0.08)
            B.sphere('g_cap', (xc, 0.0, -0.37), rng.uniform(0.12, 0.17), scale=(1.5, 0.8, 0.7), subdiv=1)
        for k in range(2):
            xc = x0 + rng.uniform(0.0, T - 0.32)
            hb = rng.uniform(0.1, 0.16)
            B.lathe('g_cap_hi', [(0.045, 0.0), (0.0, hb)], 4, at=(xc, -0.12, -0.02 - hb), rot=(0, rng.uniform(-0.35, 0.35), 0), cap_bottom=True)
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
    # glow roles preview unlit (the look kit does the same in the real render)
    for m in bpy.data.materials:
        if m.name.startswith(MODULE + '_') and 'glow' in m.name:
            bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if bsdf is not None:
                try:
                    bsdf.inputs['Emission Color'].default_value = bsdf.inputs['Base Color'].default_value
                    bsdf.inputs['Emission Strength'].default_value = 1.0
                except KeyError:
                    pass
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

def sky_gradient(h, w, sky=SKY):
    import numpy as np
    base = np.zeros((h, w, 4), dtype=np.float32); base[..., 3] = 1.0
    stops = [hex_linear(c)[:3] for c in sky]
    t = (h - 1 - np.arange(h)) / max(1, h - 1)          # 0 at the top row (image rows are bottom-up)
    t = t * (len(stops) - 1)
    i = np.minimum(t.astype(int), len(stops) - 2); f = (t - i)[:, None]
    s = np.array(stops)
    col = s[i] * (1 - f) + s[i + 1] * f
    base[..., :3] = col[:, None, :]
    return base

def over(base, px):
    a = px[..., 3:4]
    base[..., :3] = px[..., :3] * a + base[..., :3] * (1 - a)

def composite(paths, out_path, ground_path=None, floor_row=330):
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does; with a ground strip
    (rendered at 1x) the floor is tiled across from `floor_row` down, so the preview shows what the floor hides."""
    import numpy as np
    base = None
    for layer in LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            base = sky_gradient(*px.shape[:2])
        over(base, px)
    if ground_path:
        g = load_pixels(ground_path)
        gh, gw = g.shape[:2]
        h, w = base.shape[:2]
        reps = int(math.ceil(w / gw))
        strip = np.concatenate([g] * reps, axis=1)[:, :w]
        top = h - floor_row                    # image rows are bottom-up
        over(base[max(0, top - gh):top], strip[max(0, gh - top):])
    save_pixels(out_path, base)

def seam_check(path, out_path):
    """Roll the strip by half a period so the tile seam sits mid-frame (what the renderer's tiling shows)."""
    import numpy as np
    px = load_pixels(path)
    save_pixels(out_path, np.roll(px, px.shape[1] // 2, axis=1))

def shuffle_ground(path, out_path, seed=3):
    """Redraw the floor strip the way the engine does: every 32-px tile taken from a random column of the strip."""
    import numpy as np
    px = load_pixels(path)
    h, w = px.shape[:2]
    tw, th = w // 8, h // 3
    rng = random.Random(seed)
    out = np.zeros((h, w * 2, 4), dtype=np.float32)
    for r in range(3):
        for cidx in range(16):
            src = rng.randrange(8)
            out[r * th:(r + 1) * th, cidx * tw:(cidx + 1) * tw] = px[r * th:(r + 1) * th, src * tw:(src + 1) * tw]
    save_pixels(out_path, out)

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
    for layer in LAYERS:
        seam_check(paths[layer], os.path.join(SCRATCH, f'{MODULE}_{layer}_seam.png'))
    build_ground(seed)
    print('ground triangles:', triangle_count([GROUND_COLL]))
    gp = os.path.join(SCRATCH, f'{MODULE}_ground.png')
    render_ground(scene, cam, gp)
    g1 = os.path.join(SCRATCH, f'{MODULE}_ground_1x.png')
    render_ground(scene, cam, g1, scale=1)
    shuffle_ground(gp, os.path.join(SCRATCH, f'{MODULE}_ground_shuffled.png'))
    print('ground', gp)
    comp = os.path.join(SCRATCH, f'{MODULE}_composite.png')
    composite(paths, comp)
    composite(paths, os.path.join(SCRATCH, f'{MODULE}_scene.png'), ground_path=g1)
    print('composite', comp)
    for c in COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{MODULE}.blend'))
