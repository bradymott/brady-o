# Brazil 3-1 "Copacabana Boardwalk": the parallax background as a low-poly Fiesta Toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the bay at Copacabana, granite domes rising
# from the sea, a line of palms along the promenade.
#
#   L0  brSugarloaf  three granite domes (the tall one at 700/1024 of the period) with a forest skirt, a cable car
#                    wire between the two big domes with a little cabin on it
#   L1  brSea        the bay: teal water filling from z = 0 down, four lines of chunky surf, two small sailboats
#   L2  brPalms      leaning coconut palms (3.2-5 m) with seven serrated fronds and a coconut cluster
#   ground           the Copacabana promenade (ground style brWalk): cream cap with the black wave mosaic, one wave per
#                    32-px tile, over warm sandstone paving on pale sand
#
# This file also holds the shared kit (Builder, tiling, floor-cell helpers, materials registry, preview renders)
# used by br_samba, br_falls, br_pantanal and br_barracao.
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role, prefixed with the theme key so the five Brazil
# modules never clash ('glow' in a name renders unlit); every object carries obj['sprite_layer'] = <collection name>.
# BASES holds the engine's ground row for each layer (px from the top of the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_beach.py
# (builds, then renders each layer + a composite preview + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'br_beach'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1', 'L2']                # back to front: brSugarloaf, brSea, brPalms
BASES = {'L0': 330, 'L1': 330, 'L2': 365}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#1a8ae8', '#7ad0ff', '#fff4d8']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/brbg'
TAU = math.tau
PX = 1 / 28.1                              # metres per logical pixel

# ----------------------------------------------------------------------------------------------- materials
PALETTES = {}                              # every Brazil module registers its (theme-prefixed) colour roles here

def register(palette):
    PALETTES.update(palette)

CARN = ['#ff3d8b', '#ffd23a', '#2ad8a0', '#3a8aff', '#ff7a2a', '#b84aff']   # the country's carnival colours

def carn_roles(prefix, glow=False):
    """Register (and return) six carnival-colour roles for a theme, e.g. 'samba_carn_pink'."""
    names = ['pink', 'yellow', 'teal', 'blue', 'orange', 'violet']
    roles = [f'{prefix}_carn_{n}' + ('_glow' if glow else '') for n in names]
    register(dict(zip(roles, CARN)))
    return roles

PALETTE = {
    'beach_dome': '#5a7a6a', 'beach_dome_lit': '#6c8c7a', 'beach_dome_dark': '#4a6858', 'beach_forest': '#3a6a42', 'beach_forest2': '#447a4c',
    'beach_cable': '#3a4a44', 'beach_cabin': '#f4ecd8', 'beach_cabin_band': '#e85a3a',
    'beach_sea': '#1aa8d8', 'beach_sea_deep': '#1286b4', 'beach_foam': '#ffffff', 'beach_hull_a': '#ff7a2a', 'beach_hull_b': '#3a8aff',
    'beach_sail': '#fff8ec', 'beach_mast': '#6a5038',
    'beach_trunk': '#5a4a34', 'beach_trunk_ring': '#6e5a40', 'beach_frond': '#2a8a4a', 'beach_frond2': '#36a05a', 'beach_coconut': '#8a9a3a',
    'beach_sand': '#f0dca8', 'beach_pave_a': '#e8c88a', 'beach_pave_b': '#d8b878', 'beach_pave_c': '#c8a060',
    'beach_cap': '#f4f0e4', 'beach_cap_hi': '#ffffff', 'beach_wave': '#1a1a20', 'beach_cap_shadow': '#c8b89c',
}
register(PALETTE)

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
    bsdf.inputs['Base Color'].default_value = hex_linear(PALETTES[name])
    bsdf.inputs['Roughness'].default_value = 0.6
    m.diffuse_color = hex_linear(PALETTES[name])
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
        the first ring per segment (a zig-zag line). A final r = 0 makes an apex."""
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

    def disc(self, role, at, r, depth, segs=12, rot=None, scale_z=1.0):
        """A flat disc (optionally elliptical) in the XZ plane extruded `depth` along +Y: a lily pad, a drum skin."""
        pts = [(r * math.cos(TAU * k / segs), r * scale_z * math.sin(TAU * k / segs)) for k in range(segs)]
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
    `top` below the tile's top edge for the cap) split into a jittered grid with `gap` between stones. Yields
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

def clear_collections(names):
    for name in list(names) + [GROUND_COLL]:
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

def clear():
    clear_collections(LAYERS)

def triangle_count(names):
    total = 0
    for name in names:
        for ob in COLL[name].objects:
            ob.data.calc_loop_triangles()
            total += len(ob.data.loop_triangles)
    return total

# ----------------------------------------------------------------------------------------------- shared props
def leaf_pts(length, width, droop, teeth=7, tooth=0.065):
    """A serrated palm frond outline along +X (base at the origin), drooping `droop` at the tip, in the XZ plane."""
    n = teeth * 2
    top, bot = [], []
    for i in range(n + 1):
        t = i / n
        mid = -droop * t * t
        half = width * 0.5 * math.sin(math.pi * min(1.0, 0.08 + t * 0.92)) ** 0.8
        if i == n:
            half = 0.0
        tz = tooth if (i % 2 == 1 and 0 < i < n) else 0.0
        top.append((length * t, mid + half + tz))
        bot.append((length * t, mid - half - tz * 0.6))
    return bot + top[::-1][1:]

def palm(B, x, y, h, lean, R, rng, frond_len=2.1, frond_w=0.46):
    """A leaning coconut palm with feet at (x, y, 0): a segmented trunk following a quadratic curve to the crown at
    height h, seven serrated fronds fanned over the top half, coconuts under the crown. R maps 'trunk', 'ring',
    'frond', 'frond2', 'coconut' to material roles."""
    p0, p1, p2 = Vector((x, y, 0.0)), Vector((x + lean, y, 0.6 * h)), Vector((x + 1.5 * lean, y, h))
    bez = lambda t: (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2
    n = 6
    pts = [bez(i / n) for i in range(n + 1)]
    r0, r1 = 0.17, 0.1
    for i in range(n):
        ra, rb = r0 + (r1 - r0) * i / n, r0 + (r1 - r0) * (i + 1) / n
        B.rod(R['trunk'], pts[i], pts[i + 1], ra, segs=6, r2=rb)
        B.sphere(R['ring'], pts[i + 1], rb * 1.22, scale=(1, 1, 0.55), subdiv=0)
    cx, cz = pts[-1].x, pts[-1].z
    order = [0, 6, 1, 5, 2, 4, 3]
    for j, k in enumerate(order):
        a = math.pi * k / 6 + rng.uniform(-0.08, 0.08)
        role = R['frond'] if (k % 2 == 0) else R['frond2']
        L = frond_len * rng.uniform(0.9, 1.1)
        droop = 0.55 if k in (0, 6) else (0.75 if k in (1, 5) else 0.95)
        B.slab(role, leaf_pts(L, frond_w, droop), 0.09, at=(cx, y - 0.04 * j, cz + 0.05), rot=(0, -a, 0))
    for dx, dz in ((-0.14, -0.12), (0.14, -0.1), (0.0, -0.24)):
        B.sphere(R['coconut'], (cx + dx, y - 0.3, cz + dz), 0.14, subdiv=1)

def palm_row(L, R, rng, name='palm', h_range=(3.2, 5.0), pitch=(3.2, 6.0), ys=(0.6, 1.6, 2.6)):
    """The brPalms layer: palms every 90-170 px, staggered in depth (the painter's loop)."""
    x, i = rng.uniform(0.7, 2.0), 0
    while x < P:
        h = rng.uniform(*h_range)
        lean = rng.uniform(-0.55, 0.55)
        B = Builder(f'{name}_{i}', L)
        palm(B, x, rng.choice(ys), h, lean, R, rng)
        B.done()
        x += rng.uniform(*pitch)
        i += 1

# ----------------------------------------------------------------------------------------------- L0 Sugarloaf
def dome(B, x, y, W, h, role, lit_role, rng, yscale=0.3):
    """A granite dome: steep sides and a rounded top (the painter's bezier), a lighter shoulder on the lit flank."""
    prof = [(W, 0.0), (0.97 * W, 0.15 * h), (0.9 * W, 0.4 * h), (0.78 * W, 0.62 * h), (0.6 * W, 0.8 * h), (0.38 * W, 0.93 * h), (0.15 * W, 0.995 * h), (0.0, h)]
    B.lathe(role, prof, 12, at=(x, y, 0), yscale=yscale, phase=0.13)
    lit = [(r * 0.5, z * 0.97) for r, z in prof]
    B.lathe(lit_role, lit, 10, at=(x - 0.42 * W, y - 0.05, 0), yscale=yscale, phase=0.3)

def build_L0(rng):
    L = 'L0'
    # domes at 700, 520 and 880 / 1024 of the period: 250, 150 and 110 px tall; half-widths 0.6 x their painter width
    specs = [(P * 700 / 1024, 150 * PX * 0.6, 250 * PX, 'beach_dome', 'beach_dome_lit', -0.6),
             (P * 520 / 1024, 170 * PX * 0.6, 150 * PX, 'beach_dome', 'beach_dome_lit', 0.4),
             (P * 880 / 1024, 120 * PX * 0.6, 110 * PX, 'beach_dome_dark', 'beach_dome', 1.0)]
    B = Builder('sugarloaf', L)
    tops = []
    for x, W, h, role, lit, y in specs:
        dome(B, x, y, W, h, role, lit, rng)
        tops.append((x, y, h))
        # the forest skirt: a flattened dark-green mound at the foot and a few bushes climbing the flank
        B.sphere('beach_forest', (x, y - 0.35, 0.0), 1.0, scale=(W * 1.08, 0.35 * W, 0.72), subdiv=2)
        for k in range(6):
            a = rng.uniform(-1.0, 1.0)
            bx, bz = x + a * W * 0.92, rng.uniform(0.5, 1.4) + (1 - abs(a)) * 0.6
            B.sphere(rng.choice(['beach_forest', 'beach_forest2']), (bx, y - 0.45, bz), rng.uniform(0.3, 0.5), scale=(1.3, 0.6, 0.8), subdiv=1)
    # the cable car: a wire from the lower dome's top to the big dome's top, a cabin hanging a third of the way up
    (x1, y1, h1), (x2, y2, h2) = tops[1], tops[0]
    a = Vector((x1 + 0.1, (y1 + y2) / 2 - 0.3, h1 + 0.25)); b = Vector((x2 - 0.15, (y1 + y2) / 2 - 0.3, h2 + 0.2))
    B.rod('beach_cable', a, b, 0.035, segs=4)
    for p, hh in ((a, h1), (b, h2)):
        B.box('beach_cabin', (p.x, p.y + 0.1, hh - 0.05), (0.7, 0.5, 0.5), bevel=0.04)
        B.box('beach_cable', (p.x, p.y, (p.z + hh) / 2), (0.12, 0.12, p.z - hh + 0.2), bevel=0.0)
    c = a.lerp(b, 0.42)
    B.rod('beach_cable', c, c + Vector((0, 0, -0.32)), 0.04, segs=4)
    B.box('beach_cabin', (c.x, c.y, c.z - 0.6), (0.62, 0.4, 0.5), bevel=0.06)
    B.box('beach_cabin_band', (c.x, c.y - 0.01, c.z - 0.78), (0.64, 0.42, 0.12), bevel=0.0)
    B.done()

# ----------------------------------------------------------------------------------------------- L1 the bay
def build_L1(rng):
    L = 'L1'
    B = Builder('sea', L)
    B.box('beach_sea', (P / 2, 3.5, -1.1), (P, 5.0, 2.2), bevel=0.0)
    B.box('beach_sea_deep', (P / 2, 3.5, -9.3), (P, 5.0, 14.4), bevel=0.0)
    B.done(period=None)
    # four lines of surf: chunky white dashes with gaps, bobbing a little along the line
    B = Builder('surf', L)
    for r in range(4):
        z = -(8 + r * 14) * PX
        x = rng.uniform(0, 1.2)
        while x < P:
            w = rng.uniform(0.6, 1.7)
            zz = z + 0.06 * math.sin(x * 0.04 * 28.1 + r)
            for dx in wraps(x + w / 2, w / 2):
                B.rbox('beach_foam', (x + w / 2 + dx, 0.8 - 0.02 * r, zz), (w, 0.1, 0.09), bevel=0.04, segments=1)
            x += w + rng.uniform(0.5, 1.6)
    B.done(period=None)
    # two small sailboats out on the bay
    for i, (bx, hull) in enumerate(((P * 0.18, 'beach_hull_a'), (P * 0.62, 'beach_hull_b'))):
        B = Builder(f'sailboat_{i}', L)
        B.slab(hull, [(-0.7, -0.3), (0.7, -0.3), (0.85, 0.02), (-0.85, 0.02)], 0.3, at=(bx, 0.3, 0.0))
        B.box('beach_mast', (bx + 0.05, 0.45, 0.7), (0.06, 0.06, 1.4), bevel=0.0)
        B.slab('beach_sail', [(0.1, 0.1), (0.1, 1.35), (0.82, 0.12)], 0.05, at=(bx, 0.42, 0.0))
        B.slab('beach_sail', [(0.0, 0.25), (-0.48, 0.25), (0.0, 1.2)], 0.05, at=(bx, 0.42, 0.0))
        B.done()

# ----------------------------------------------------------------------------------------------- L2 palms
PALM_R = {'trunk': 'beach_trunk', 'ring': 'beach_trunk_ring', 'frond': 'beach_frond', 'frond2': 'beach_frond2', 'coconut': 'beach_coconut'}

def build_L2(rng):
    palm_row('L2', PALM_R, rng)

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def wave_cap(B, cap, cap_hi, wave, shadow, cap_h=9 * PX, mid=4.5 * PX, amp=3 * PX, depth=0.9):
    """The promenade cap (brWalk): a cream band `cap_h` tall along z = 0 with the black wave mosaic below a sine
    boundary (one wave per 32-px tile, so the engine's shuffled tiles still join), a thin shadow line under it."""
    B.box(cap, (GP / 2, 0.25, -cap_h / 2), (GP, depth, cap_h), bevel=0.0)
    B.box(cap_hi, (GP / 2, 0.23, -0.5 * PX), (GP, depth + 0.02, 1.0 * PX), bevel=0.0)
    n = 128
    pts = [(GP, -cap_h), (0.0, -cap_h)]
    for i in range(n + 1):
        x = GP * i / n
        pts.append((x, -(mid + amp * math.sin(TAU * x / T))))
    B.slab(wave, pts, 0.5, at=(0.0, -0.45, 0.0))
    B.box(shadow, (GP / 2, -0.2, -cap_h - 0.75 * PX), (GP, 0.6, 1.5 * PX), bevel=0.0)

def paving(B, roles, rng, top, y=-0.1, bevel=0.03, rows=(2,), cols=(1, 2), jitter=0.2):
    """Chunky paving: each 32-px tile holds whole blocks (1-2 per row, 2 rows), so the engine can draw tiles in any order."""
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=rows, cols=cols, gap=0.09, top=(top if row == 0 else 0.0), jitter=jitter):
                B.box(rng.choice(roles), (xc, y, zc), (w, 0.4, h), bevel=bevel)

def build_ground(seed=1):
    """The Copacabana promenade: the black-and-white wave mosaic cap along the walking surface (z = 0) over warm
    sandstone paving set in pale sand, 3 tiles deep, tile-aligned (see cell_rects). Periodic in x with period GP
    (not P), its own collection 'ground'. Returns the collection."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('beach_sand', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    wave_cap(B, 'beach_cap', 'beach_cap_hi', 'beach_wave', 'beach_cap_shadow')
    B.done(period=None)
    B = Builder('ground_paving', L)
    paving(B, ['beach_pave_a', 'beach_pave_a', 'beach_pave_b', 'beach_pave_c'], rng, top=10.5 * PX)
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

def render_layer(scene, cam, layer, base, path):
    _show_only(layer)
    cam.data.ortho_scale = P
    scene.render.resolution_x, scene.render.resolution_y = RES
    cam.location = (P / 2, -30, z_center_for_row(base))
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

def composite(layers, paths, out_path, sky):
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does."""
    import numpy as np
    base = None
    for layer in layers:
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

def ground_grid_check(col):
    """Assert nothing but the cap / backing bands comes within 0.04 m of a 32-px tile edge."""
    worst, n = 1e9, 0
    for o in col.objects:
        if o.name.startswith(('ground_cap', 'ground_backing')):
            continue
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            fx = w.x % T; fz = (-w.z) % T
            m = min(fx, T - fx, fz, T - fz)
            worst = min(worst, m); n += 1
            assert m >= 0.04 and 0 <= w.x <= GP and w.z <= -0.04, (o.name, tuple(w), m)
    print('GRID OK verts', n, 'worst margin %.3f' % worst)

def shuffled_ground(path, out_path, scale=2):
    """The ground strip with its columns shuffled per row, the way the engine draws the floor."""
    import numpy as np
    px = load_pixels(path)
    s = 32 * scale
    rng = random.Random(7); out = px.copy()
    for r in range(3):
        for c in range(8):
            k = rng.randrange(8)
            out[r * s:(r + 1) * s, c * s:(c + 1) * s] = px[r * s:(r + 1) * s, k * s:(k + 1) * s]
    save_pixels(out_path, out)

def preview(mod, seed=1):
    """Build `mod` (a Brazil theme module), render every layer, a composite, seam checks and the ground strip."""
    os.makedirs(SCRATCH, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    mod.build(seed)
    print('triangles:', triangle_count(mod.LAYERS), {l: triangle_count([l]) for l in mod.LAYERS})
    cam = setup_render(scene)
    paths = {}
    for layer in mod.LAYERS:
        paths[layer] = os.path.join(SCRATCH, f'{mod.MODULE}_{layer}.png')
        render_layer(scene, cam, layer, mod.BASES[layer], paths[layer])
        print('rendered', paths[layer])
    comp = os.path.join(SCRATCH, f'{mod.MODULE}_composite.png')
    composite(mod.LAYERS, paths, comp, mod.SKY)
    print('composite', comp)
    for layer in mod.LAYERS:
        seam_check(paths[layer], os.path.join(SCRATCH, f'{mod.MODULE}_{layer}_seam.png'))
    gcol = mod.build_ground(seed)
    print('ground triangles:', triangle_count([GROUND_COLL]))
    ground_grid_check(gcol)
    gp = os.path.join(SCRATCH, f'{mod.MODULE}_ground.png')
    render_ground(scene, cam, gp)
    shuffled_ground(gp, os.path.join(SCRATCH, f'{mod.MODULE}_ground_shuffled.png'))
    print('ground', gp)
    for c in COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{mod.MODULE}.blend'))

if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    preview(sys.modules[__name__], seed)
