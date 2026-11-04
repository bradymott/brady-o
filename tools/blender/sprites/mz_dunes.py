# Mozambique 4-2 "Dune Stampede": the parallax background as a low-poly toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: wind-shaped dunes rolling down to the
# Indian Ocean, dhows sailing the horizon.
#
#   L0  far dunes (dyn: the engine draws the stampede's dust on top): a teal sea band on the horizon with two dhows,
#       a back ridge of tall dunes and a front row of low humps, each dune a lit windward slope and a shaded slip
#       face, dune grass on the crests
#   L1  near dunes (base 352): the same closer and deeper-coloured, bigger dunes, one big dhow
#   ground: the engine's 'grass' floor in the dunes' colours (pale sand cap over warm sand with buried stones)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named '<MODULE>_<role>'; every object carries
# obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer (px from the top of
# the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mz_dunes.py
# (builds, then renders each layer + composite previews + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mz_dunes'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1']
BASES = {'L0': 320, 'L1': 352}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2a9ae8', '#9ad8ff', '#fff8e8']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mzbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
# colour roles; the Blender material is named '<MODULE>_<role>' so the five Mozambique themes never clash.
# Roles whose name contains 'glow' render unlit (the look kit makes them emissive).
PALETTE = {
    'sea_far': '#4ac4dc', 'sea_far_hi': '#a0ecf4', 'sea_far_deep': '#2a9ac0',
    'dune_lit': '#f8e2a8', 'dune_shade': '#e2bc78', 'dune_front_lit': '#f0d08a', 'dune_front_shade': '#d2aa60', 'dune_plain': '#e8c67e',
    'dune_grass': '#c8ac5c', 'hull_far': '#7a5230', 'sail_far': '#f8f0dc', 'mast_far': '#5a3a20',
    'sea_near': '#38b0cc', 'sea_near_hi': '#90e0ec', 'sea_near_deep': '#2088ac',
    'near_lit': '#f2cc82', 'near_shade': '#d6ac5e', 'near_front_lit': '#e8c070', 'near_front_shade': '#c89c4c', 'near_plain': '#dcb462',
    'near_grass': '#b89a48', 'hull_near': '#6a4628', 'sail_near': '#fff6e4', 'mast_near': '#4e3018',
    'g_cap': '#f0d89a', 'g_cap_hi': '#fff0c0', 'g_dirt': '#e8c47a', 'g_dirt2': '#c89a5a', 'g_rock': '#d8b06a',
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

# ----------------------------------------------------------------------------------------------- dune shapes
def dune(B, x0, w, h, lit, shade, y, depth, z0=-0.6, zoff=0.0):
    """One wind-shaped dune, left foot at x0: a long lit windward slope rising to the crest at 62 % of the width,
    then a short shaded slip face. Two slabs, so the cel shading reads as a sharp crest line. Wrapped at the seam."""
    cx = x0 + 0.68 * w
    wind = [(x0 + (cx - x0) * t, h * math.sin(t * math.pi / 2) ** 1.7) for t in (0.0, 0.3, 0.55, 0.75, 0.9, 1.0)]
    lee = [(cx + (x0 + w - cx) * t, h * math.cos(t * math.pi / 2) ** 0.55) for t in (0.0, 0.25, 0.5, 0.75, 1.0)]
    for dx in wraps(x0 + w / 2, w / 2 + 0.1):
        B.slab(lit, [(x0, z0)] + wind + [(cx, z0)], depth, at=(dx, y, zoff))
        B.slab(shade, [(cx, z0)] + lee + [(x0 + w, z0)], depth, at=(dx, y, zoff))

def dune_rows(L, prefix, rng, back, front, roles, grass_role, scale=1.0):
    """A back ridge of tall dunes (their feet raised on a bank so the ridge stands above the plain, like the painter's
    band) and a front row of low humps, overlapped so the rows never show gaps."""
    B = Builder(prefix + '_back', L)
    x = rng.uniform(-3.0, -1.0)
    while x < P:
        w = rng.uniform(*back['w']) * scale
        dune(B, x, w, rng.uniform(*back['h']) * scale, roles[0], roles[1], back['y'], back['depth'], z0=-0.4, zoff=back['lift'])
        x += w * rng.uniform(0.72, 0.9)
    B.done(period=None)
    B = Builder(prefix + '_bank', L)
    B.box(roles[1], (P / 2, back['y'] + back['depth'] / 2, back['lift'] / 2 - 0.3), (P, back['depth'], back['lift'] + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder(prefix + '_front', L)
    x = rng.uniform(-3.0, -1.0)
    crests = []
    while x < P:
        w = rng.uniform(*front['w']) * scale
        h = rng.uniform(*front['h']) * scale
        dune(B, x, w, h, roles[2], roles[3], front['y'], front['depth'], z0=-0.6)
        crests.append((x + 0.62 * w, h))
        x += w * rng.uniform(0.75, 0.95)
    B.done(period=None)
    B = Builder(prefix + '_grass', L)
    for cx, h in crests:
        if rng.random() < 0.7:
            for k in range(rng.choice((2, 3))):
                gx = cx + rng.uniform(-0.25, 0.25) * h
                for dx in wraps(gx, 0.3):
                    for lean in (-0.4, 0.1, 0.45):
                        B.lathe(grass_role, [(0.05 * scale, 0.0), (0.0, rng.uniform(0.3, 0.5) * scale)], 4, at=(gx + dx + lean * 0.08, front['y'] - 0.1, h * 0.97 - 0.05), rot=(0, lean, 0), cap_bottom=True)
    B.done(period=None)

def sea_band(L, prefix, rng, roles, height, y, dhows, dhow_roles, dhow_s, ripple_n):
    """The horizon: a flat teal sea standing `height` above the ground line behind the dunes, a pale horizon line,
    ripple bars, and dhows sailing on it."""
    B = Builder(prefix + '_sea', L)
    B.box(roles[0], (P / 2, y, height / 2 - 0.2), (P, 0.6, height + 0.4), bevel=0.0)
    B.box(roles[2], (P / 2, y - 0.05, height * 0.25), (P, 0.5, height * 0.5), bevel=0.0)
    B.box(roles[1], (P / 2, y - 0.1, height - 0.05), (P, 0.5, 0.09), bevel=0.0)
    ripples(B, rng, roles[1], ripple_n, height * 0.25, height * 0.9, 0.4, 1.3, y=y - 0.12)
    B.done(period=None)
    B = Builder(prefix + '_dhows', L)
    for i, (xf, facing) in enumerate(dhows):
        s = dhow_s * rng.uniform(0.9, 1.1)
        x = P * xf + rng.uniform(-0.5, 0.5)
        for dx in wraps(x + 0.5 * s, s):
            dhow(B, x + dx, y - 0.3, s, dhow_roles[0], dhow_roles[1], dhow_roles[2], rng, facing=facing)
    # lift the dhows to the horizon line (hulls were built with their waterline at z = 0), as the painter does
    B.bm.verts.ensure_lookup_table()
    bmesh.ops.translate(B.bm, vec=(0.0, 0.0, height - 0.08), verts=B.bm.verts[:])
    B.done(period=None)

# ----------------------------------------------------------------------------------------------- L0: far dunes
def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'dune_plain', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    sea_band(L, 'L0', rng, ('sea_far', 'sea_far_hi', 'sea_far_deep'), 2.15, 5.6, ((300 / 1024, 1), (760 / 1024, -1)), ('hull_far', 'sail_far', 'mast_far'), 1.7, 16)
    dune_rows(L, 'L0', rng,
              back=dict(w=(6.0, 9.5), h=(0.9, 1.5), y=3.2, depth=2.0, lift=0.6),
              front=dict(w=(4.5, 7.5), h=(0.45, 1.05), y=0.4, depth=2.2, lift=0.0),
              roles=('dune_lit', 'dune_shade', 'dune_front_lit', 'dune_front_shade'), grass_role='dune_grass')

# ----------------------------------------------------------------------------------------------- L1: near dunes
def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'near_plain', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    sea_band(L, 'L1', rng, ('sea_near', 'sea_near_hi', 'sea_near_deep'), 3.1, 5.6, ((560 / 1024, 1),), ('hull_near', 'sail_near', 'mast_near'), 2.6, 14)
    dune_rows(L, 'L1', rng,
              back=dict(w=(8.0, 12.0), h=(1.0, 1.8), y=3.0, depth=2.2, lift=0.8),
              front=dict(w=(6.0, 9.5), h=(0.6, 1.4), y=0.3, depth=2.4, lift=0.0),
              roles=('near_lit', 'near_shade', 'near_front_lit', 'near_front_shade'), grass_role='near_grass', scale=1.15)

BUILDERS = {'L0': build_L0, 'L1': build_L1}

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
