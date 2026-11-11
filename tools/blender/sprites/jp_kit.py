# jp_kit: the shared toon-diorama kit for the Japan (and Nepal) background modules of Super Brady-O World.
# A copy of ma_kit.py (Builder, tiling, floor cells, ridges, peaks, earth floors) without the Moroccan shapes, so the
# Japan and Nepal modules never depend on another country's files. A theme calls use(MODULE, PALETTE, LAYERS) first; materials are then named '<MODULE>_<role>' with colours
# from its PALETTE. Not a theme itself (no LAYERS), so build_country.sh skips it.
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
TAU = math.tau
CFG = {'module': 'jp_kit', 'palette': {}, 'layers': []}

def use(module, palette, layers):
    CFG['module'], CFG['palette'], CFG['layers'] = module, palette, list(layers)

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

def material(role):
    """A plain Principled material (Base Color + roughness 0.6) named '<MODULE>_<role>'; the look kit restyles it."""
    name = f'{CFG["module"]}_{role}'
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
        m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = hex_linear(CFG['palette'][role])
    bsdf.inputs['Roughness'].default_value = 0.6
    m.diffuse_color = hex_linear(CFG['palette'][role])
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
    for name in CFG['layers'] + [GROUND_COLL]:
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
    for name in (names or CFG['layers']):
        for ob in COLL[name].objects:
            ob.data.calc_loop_triangles()
            total += len(ob.data.loop_triangles)
    return total

def plain(L, name, role, y=2.0, depth=5.0, top=0.0, bottom=-3.0):
    """A full-period slab from `top` down to `bottom`: the solid ground under a layer so nothing shows through."""
    B = Builder(name, L)
    B.box(role, (P / 2, y, (top + bottom) / 2), (P + 2.0, depth, top - bottom), bevel=0.0)   # past both edges: no outline at the seam
    return B.done(period=None)


# ----------------------------------------------------------------------------------------------- shapes
def peak(L, name, x, y, R, h, role, segs, rng, snow=None, snow_from=0.6):
    """A faceted mountain cone; with `snow`, a jagged white cap from `snow_from` of its height up."""
    prof = [(R, 0.0), (R * 0.7, h * 0.34), (R * 0.42, h * 0.66), (R * 0.2, h * 0.88), (0.0, h)]
    B = Builder(name, L)
    ph = rng.uniform(0, TAU)
    B.lathe(role, prof, segs, at=(x, y, 0), yscale=0.35, smooth=False, phase=ph)
    if snow:
        def r_at(z):
            for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
                if z0 <= z <= z1:
                    return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
            return 0.0
        z0 = h * snow_from
        sp = [(r_at(z0) + 0.12, z0), (r_at(h * 0.8) + 0.1, h * 0.8), (r_at(h * 0.93) + 0.08, h * 0.93), (0.0, h + 0.06)]
        B.lathe(snow, sp, segs, at=(x, y - 0.02, 0), yscale=0.35, smooth=False, phase=ph, jag=lambda k: (-0.32 * (h / 6) if k % 2 else 0.0))
    return B.done()

def run_builders(builders, layers, seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in layers:
        new_collection(name)
    rng = random.Random(seed)
    for name in layers:
        builders[name](random.Random(rng.random()))
    return {name: COLL[name] for name in layers}


# ----------------------------------------------------------------------------------------------- shared floors
def stone_in(B, role, xc, zc, w, h, rng, y=-0.08, depth=0.4, squat=1.35):
    """A chunky rounded stone inside a cell (w x h), never thinner than 1/squat of its other side (no 'pills')."""
    s = min(w, h) * rng.uniform(0.62, 0.9)
    sw = min(w * 0.92, s * rng.uniform(1.0, squat))
    sh = min(h * 0.92, s * rng.uniform(0.8, 1.05))
    B.rbox(role, (xc + rng.uniform(-1, 1) * (w - sw) / 2, y, zc + rng.uniform(-1, 1) * (h - sh) / 2), (sw, depth, sh), bevel=min(sw, sh) * 0.32, segments=2)

def ground_earth(seed=1, tufts='nubs', stone_p=0.5, patch_p=0.25, cap_h=0.34):
    """An engine-'grass'-style floor: a cap band (roles g_cap / g_cap_hi) along z = 0 with a lumpy underside and
    `tufts` above it ('nubs' = earth crumbs, 'grass' = turf blades in g_blade, 'ripples' = sand ripples, None), over a
    body (g_dirt) with chunky stones (g_rock) and darker patches (g_dirt2), laid out per 32-px tile so the engine can
    draw the tiles in any order. Periodic in x with period GP; its own collection 'ground'."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('g_dirt', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)       # past the strip's edges: no outline on the tiles
    B.done(period=None)
    B = Builder('ground_stones', L)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.14, top=(cap_h + 0.12 if row == 0 else 0.0), jitter=0.25):
                r = rng.random()
                if r < stone_p:
                    stone_in(B, 'g_rock', xc, zc, w, h, rng)
                elif r < stone_p + patch_p:
                    stone_in(B, 'g_dirt2', xc, zc, w, h, rng, y=0.2, depth=0.3, squat=1.6)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('g_cap', (GP / 2, 0.1, -cap_h / 2 - 0.04), (GP + 1.0, 0.9, cap_h), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.04, -0.07), (GP + 1.0, 0.96, 0.07), bevel=0.0)
    for col in range(8):
        x0 = col * T + CELL_MARGIN + 0.12
        for k in range(2):            # the lumpy underside: two soft lobes per tile, inside the tile
            xc = x0 + (k + 0.5) * (T - 0.34) / 2 + rng.uniform(-0.06, 0.06)
            B.sphere('g_cap', (xc, 0.0, -cap_h - 0.02), rng.uniform(0.12, 0.16), scale=(1.5, 0.8, 0.7), subdiv=1)
        if tufts == 'nubs':
            for k in range(2):
                xc = x0 + rng.uniform(0.0, T - 0.36)
                hb = rng.uniform(0.08, 0.14)
                B.lathe('g_cap_hi', [(0.05, 0.0), (0.0, hb)], 4, at=(xc, -0.12, -0.02), rot=(0, rng.uniform(-0.35, 0.35), 0), cap_bottom=True)
        elif tufts == 'grass':
            for k in range(3):
                xc = x0 + rng.uniform(0.0, T - 0.36)
                for j in range(3):
                    hb = rng.uniform(0.14, 0.24)
                    B.lathe('g_blade', [(0.045, 0.0), (0.0, hb)], 4, at=(xc + (j - 1) * 0.06, -0.14, -0.04), rot=(0, (j - 1) * 0.35, 0), cap_bottom=True)
        elif tufts == 'ripples':
            for k in range(2):
                xc = x0 + 0.1 + k * (T - 0.4) / 2 + rng.uniform(0, 0.08)
                B.sphere('g_cap_hi', (xc, -0.1, -0.16), 0.12, scale=(1.6, 0.4, 0.28), subdiv=1)
    B.done(period=None)
    return c


# ----------------------------------------------------------------------------------------------- dunes and ridges
def periodic_profile(rng, base, amp, waves=((2, 1.0), (3, 0.5), (5, 0.25)), sharp=0.0):
    """A height function z(x), periodic over P: a sum of sines with whole-number cycles per period. sharp > 0 folds
    it into crested ridges (|sin|-like peaks)."""
    terms = [(k, w, rng.uniform(0, TAU)) for k, w in waves]
    tot = sum(w for _, w, _ in terms)
    def z(x):
        v = sum(w * math.sin(TAU * k * x / P + ph) for k, w, ph in terms) / tot
        if sharp:
            v = (1 - sharp) * v + sharp * (1 - 2 * abs(math.sin(math.pi * (v + 1) / 2 - math.pi / 2)))
        return base + amp * v
    return z

def ridge_slab(L, name, role, zf, y, depth=1.0, bottom=-3.0, step=0.3, shade=None, shade_depth=0.9, outline=1.0):
    """A full-period silhouette slab under the curve z = zf(x) (x in [0, P]), extruded along +Y from y. With `shade`,
    unoutlined lee-side wedges (from every crest down its right-hand slope) in that role give the dune its
    sun-and-shadow look."""
    n = int((P + 2.0) / step)
    xs = [-1.0 + (P + 2.0) * i / n for i in range(n + 1)]          # past both edges: no outline at the seam
    zs = [zf(x) for x in xs]
    pts = [(xs[0], bottom), (xs[-1], bottom)] + [(x, z) for x, z in zip(xs[::-1], zs[::-1])]
    B = Builder(name, L)
    B.slab(role, pts, depth, at=(0, y, 0))
    ob = B.done(period=None)
    ob['outline'] = outline
    if shade:
        S = Builder(name + '_shade', L)
        i = 1
        while i < n:
            if zs[i] >= zs[i - 1] and zs[i] > zs[i + 1]:          # a crest: walk down the lee side to the trough
                j = i
                while j < n and zs[j + 1] < zs[j]:
                    j += 1
                if j - i >= 2:
                    poly = [(xs[k], zs[k] - 0.01) for k in range(i, j + 1)]
                    # the wedge's lower edge: from the trough back up to just under the crest, a soft concave curve
                    m = j - i
                    for k in range(m, -1, -1):
                        u = k / m
                        if 0 < k < m:
                            poly.append((xs[i] + (xs[j] - xs[i]) * u, zs[j] + (zs[i] - zs[j]) * (1 - u) ** (1.5 + shade_depth)))
                    clean = []
                    for p in poly:
                        if not clean or (abs(p[0] - clean[-1][0]) > 1e-4 or abs(p[1] - clean[-1][1]) > 1e-4):
                            clean.append(p)
                    if len(clean) >= 3:
                        S.slab(shade, clean[::-1], 0.02, at=(0, y - 0.03, 0))
                i = j + 1
            else:
                i += 1
        so = S.done(period=None)
        so['outline'] = 0
    return ob


def ground_blocks(seed=1, cap_h=0.3, rows=(1, 2), cols=(1, 2), gap=0.1, jitter=0.2, roles=('g_rock',), rounded=False,
                  depth=0.4, bevel=0.06, cap=True, cap_deco=None, skip=0.0, hi_h=0.07):
    """A built floor: a backing (g_dirt) wider than the strip, whole blocks (roles, chosen at random) laid out per
    32-px tile so the engine can draw tiles in any order, and a cap band (g_cap, g_cap_hi along the top) over row 0.
    cap_deco(B, rng, x0, x1) adds per-tile decoration to the cap (it must stay inside [x0, x1])."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('g_dirt', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_blocks', L)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=rows, cols=cols, gap=gap, top=(cap_h + 0.1 if (row == 0 and cap) else 0.0), jitter=jitter):
                if skip and rng.random() < skip:
                    continue
                role = rng.choice(roles)
                if rounded:
                    B.rbox(role, (xc, -0.08, zc), (w, depth, h), bevel=min(w, h) * 0.3, segments=2)
                else:
                    B.box(role, (xc, -0.08, zc), (w, depth, h), bevel=bevel)
    B.done(period=None)
    if cap:
        B = Builder('ground_cap', L)
        B.box('g_cap', (GP / 2, 0.1, -cap_h / 2 - 0.02), (GP + 1.0, 0.9, cap_h), bevel=0.0)
        B.box('g_cap_hi', (GP / 2, 0.04, -hi_h / 2), (GP + 1.0, 0.96, hi_h), bevel=0.0)
        if cap_deco:
            for col in range(8):
                cap_deco(B, rng, col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN)
        B.done(period=None)
    return c
