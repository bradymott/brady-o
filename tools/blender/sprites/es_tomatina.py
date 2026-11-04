# Valencia 6-1 "La Tomatina" (theme es_tomatina): the parallax background as a Fiesta Toon diorama, one Collection
# per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: an orange grove under a pale sierra,
# and a whitewashed town street splattered red by the tomato fight.
#
#   L0  esGrove (base 300, #3a8a3a)  a hazy green ridge, two staggered rows of lumpy orange trees heavy with fruit,
#                                    orange crates between them over a dark grove floor
#   L1  esTown  (base 340, #f4f0e8)  a continuous street of whitewashed houses with terracotta gable roofs, green
#                                    shutters and flower boxes, arched doors, balconies, bunting, tomato splats
#                                    sliding down the walls, crate stacks and loose tomatoes along the kerb
#   ground                           grass style in the theme's sandy street colours: a pale turf cap over tan
#                                    soil with stones and clods, a few tomato-pulp blobs on the cap
#
# This module also holds the toolkit shared by the other Valencia themes (es_aquarium, es_arts, es_fallas,
# es_lonja import it): the Theme context (materials, collections, tiling), the chunky-part Builder, the
# tile-aligned floor helpers (grass / coral / marble floors), the house builder and the preview renderer.
#
# Contract (same as mx_canal.py): every layer stands on its own ground line z = 0, is periodic in x with period P
# (anything crossing x = 0 or x = P is duplicated at x ± P) and stays within y in [-6, 6] (the camera looks along
# +Y from -Y). 1 m = 28.1 px; the player is 1.85 m tall. Materials are plain Principled BSDFs (Base Color only)
# named '<theme key>_<role>' so the look kit can restyle them (names containing 'glow' render unlit); every object
# carries obj['sprite_layer']. BASES holds the engine's ground row per layer (px from the top of the 444-px strip).
#
# Run headless:   [LOOK=toon] /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/es_tomatina.py [--seed N]
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

MODULE = 'es_tomatina'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1']                      # back to front
BASES = {'L0': 300, 'L1': 340}
GROUND_COLL = 'ground'
PPM = 28.1
GP = 8 * (32 / PPM)                        # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / PPM)              # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2a8ae8', '#8ad0ff', '#fff4e0']
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/esbg'
TAU = math.tau
T = 32 / PPM                               # one floor tile (1.139 m): ground elements never cross a tile edge
CELL_MARGIN = 0.045                        # mortar kept clear inside every tile edge
FALLA = ['#ff5a8a', '#ffd23a', '#3ac8ff', '#7ae05a', '#ff8a2a', '#b86aff']   # the country's festival colours

# =============================================================================================== shared toolkit
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

class Theme:
    """One theme's context: its palette (role -> hex), its layer collections and the ground collection. Materials
    are named '<module>_<role>' so the five Valencia themes never clash."""
    def __init__(self, module, layers, bases, palette, sky, ground=GROUND_COLL):
        self.module, self.LAYERS, self.BASES, self.PALETTE, self.SKY, self.GROUND = module, layers, bases, palette, sky, ground
        self.COLL = {}

    def material(self, role):
        name = f'{self.module}_{role}'
        m = bpy.data.materials.get(name)
        if m is None:
            m = bpy.data.materials.new(name)
            m.use_nodes = True
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bsdf is None:
            bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
            out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
            m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        bsdf.inputs['Base Color'].default_value = hex_linear(self.PALETTE[role])
        bsdf.inputs['Roughness'].default_value = 0.6
        m.diffuse_color = hex_linear(self.PALETTE[role])
        return m

    def new_collection(self, name):
        old = bpy.data.collections.get(name)
        if old is not None:
            for ob in list(old.objects):
                bpy.data.objects.remove(ob, do_unlink=True)
            bpy.data.collections.remove(old)
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
        self.COLL[name] = c
        return c

    def clear(self):
        for name in self.LAYERS + [self.GROUND]:
            c = bpy.data.collections.get(name)
            if c is None:
                continue
            for ob in list(c.objects):
                bpy.data.objects.remove(ob, do_unlink=True)
            bpy.data.collections.remove(c)
        for me in list(bpy.data.meshes):
            if me.users == 0:
                bpy.data.meshes.remove(me)
        self.COLL.clear()

    def triangle_count(self, names=None):
        total = 0
        for name in (names or self.LAYERS):
            for ob in self.COLL[name].objects:
                ob.data.calc_loop_triangles()
                total += len(ob.data.loop_triangles)
        return total

    def tile(self, ob, period=P):
        """Duplicate (linked) at x ± period whatever crosses the strip edges so the layer repeats seamlessly."""
        xs = [v.co.x + ob.location.x for v in ob.data.vertices]
        if not xs:
            return
        for dx in ((period,) if min(xs) < 0 else ()) + ((-period,) if max(xs) > period else ()):
            d = ob.copy(); d.data = ob.data
            d.name = f'{ob.name}.tile{"+" if dx > 0 else "-"}'
            d.location.x += dx
            d['sprite_layer'] = ob['sprite_layer']
            self.COLL[ob['sprite_layer']].objects.link(d)

def _xf(at=(0, 0, 0), rot=None, scale=None):
    m = Matrix.Translation(Vector(at))
    if rot is not None:
        m = m @ Euler(rot).to_matrix().to_4x4()
    if scale is not None:
        m = m @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    return m

class Builder:
    """Accumulates chunky parts into one mesh object; each part carries a material role and flat/smooth shading."""
    def __init__(self, name, layer, th):
        self.name, self.layer, self.th = name, layer, th
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
        """A rounded box (multi-segment bevel, smooth shaded): clods, pebbles, rock plates, cushions."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
        b = min(bevel, min(size) * 0.45)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=b, segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._add(bm, role, True, _xf(at, rot))

    def lathe(self, role, profile, segs, at=(0, 0, 0), yscale=1.0, cap_top=True, cap_bottom=False, jag=None, smooth=False, rot=None, phase=0.0, twist=0.0):
        """Surface of revolution about local Z from a profile [(r, z), ...] bottom to top. `jag(k)` offsets the z of
        the first ring per segment; `twist` rotates each successive ring (a twisted column). A final r = 0 makes an apex."""
        bm = bmesh.new(); rings = []
        for i, (r, z) in enumerate(profile):
            if r <= 1e-6:
                rings.append([bm.verts.new((0.0, 0.0, z))] * segs)
                continue
            ring = []
            for k in range(segs):
                a = TAU * k / segs + phase + twist * i
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

    def chain(self, role, pts, r, segs=5, taper=1.0):
        """Rods joining consecutive points (a vine, a kelp stalk, a cable), the radius tapering to r * taper."""
        n = len(pts) - 1
        for i in range(n):
            ra = r * (1 + (taper - 1) * i / n); rb = r * (1 + (taper - 1) * (i + 1) / n)
            self.rod(role, pts[i], pts[i + 1], ra, segs=segs, r2=rb)
        return self

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

    def band_arch(self, role, at, R, RZ, thick, depth, legs=0.0, segs=8, rot=None, pointed=0.0):
        """A standing arch *band*: outer half-ellipse (R, RZ) minus the inner one, optional straight legs under
        the spring line, bottom centre at `at`. `pointed` > 0 lifts the crown into a Gothic point (metres)."""
        def ring(rr, rz):
            out = []
            for k in range(segs + 1):
                a = math.pi - math.pi * k / segs
                lift = pointed * (1 - abs(math.cos(a))) ** 1.5 if pointed else 0.0
                out.append((rr * math.cos(a), legs + rz * math.sin(a) + lift))
            return out
        pts = [(-(R + thick), 0.0), (-(R + thick), legs)] if legs > 0 else [(-(R + thick), 0.0)]
        pts += ring(R + thick, RZ + thick)
        if legs > 0:
            pts.append((R + thick, 0.0)); pts.append((R - thick, 0.0))
        pts.append((R - thick, legs))
        pts += ring(R - thick, RZ - thick)[::-1]
        if legs > 0:
            pts.append((-(R - thick), 0.0))
        return self.slab(role, pts, depth, at, rot)

    def disc(self, role, at, r, depth, segs=12, rot=None, ry=None):
        """A flat disc (or ellipse, ry) in the XZ plane extruded `depth` along +Y: splats, signs, plates."""
        ry = r if ry is None else ry
        pts = [(r * math.cos(TAU * k / segs), ry * math.sin(TAU * k / segs)) for k in range(segs)]
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
            me.materials.append(self.th.material(role))
        ob = bpy.data.objects.new(self.name, me)
        ob['sprite_layer'] = self.layer
        self.th.COLL[self.layer].objects.link(ob)
        if period:
            self.th.tile(ob, period)
        return ob

def wraps(xc, half, period=P):
    """x offsets at which a part centred at xc with half-width `half` must be copied so a one-period mesh tiles."""
    return (0.0,) + ((period,) if xc - half < 0 else ()) + ((-period,) if xc + half > period else ())

def jittered(rng, n, jitter=0.3, period=P):
    """n positions spread evenly over the period, each nudged by up to ±jitter of the pitch."""
    pitch = period / n
    off = rng.uniform(0, pitch)
    return [(off + i * pitch + rng.uniform(-jitter, jitter) * pitch) % period for i in range(n)]

def periodic_fn(rng, zmin, zmax, harmonics=3):
    """A smooth random function of x with exact period P (a sum of whole-cycle sines), scaled into [zmin, zmax]."""
    terms = [(rng.uniform(0.4, 1.0) / k, k, rng.uniform(0, TAU)) for k in range(1, harmonics + 1)]
    raw = lambda x: sum(a * math.sin(TAU * c * x / P + ph) for a, c, ph in terms)
    samples = [raw(P * i / 256) for i in range(256)]
    lo, hi = min(samples), max(samples)
    return lambda x: zmin + (zmax - zmin) * (raw(x) - lo) / ((hi - lo) or 1.0)

OVER = 0.6                                 # strip-wide parts overhang the period by this much on each side, so the toon
                                           # outline hull of their x edges stays out of frame (no hairline at the seam)

def ridge_slab(th, L, name, zf, role, y=3.0, depth=1.0, zb=-2.0, dx=0.5):
    """A periodic skyline slab: the top edge follows zf(x) (exactly periodic) across the period and OVER beyond
    both edges, the bottom sits at zb."""
    B = Builder(name, L, th)
    n = int((P + 2 * OVER) / dx)
    xs = [-OVER + (P + 2 * OVER) * i / n for i in range(n + 1)]
    pts = [(xs[0], zb), (xs[-1], zb)] + [(x, zf(x)) for x in reversed(xs)]
    B.slab(role, pts, depth, at=(0, y, 0))
    return B.done(period=None)

def fill_below(th, L, role, top=0.0, depth=2.0, y=2.5, name=None):
    """A plain band from `top` down `depth` across the period: seals the layer under its ground line."""
    return Builder(name or f'{L}_fill', L, th).box(role, (P / 2, y, top - depth / 2), (P + 2 * OVER, 6.0, depth), bevel=0.0).done(period=None)

# ---------------------------------------------------------------------------------------------- tile-aligned floor
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
    yielded ever crosses a tile edge."""
    x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
    z0, z1 = -row * T - CELL_MARGIN - top, -(row + 1) * T + CELL_MARGIN
    zs = _split(z0, z1, rng.choice(rows), rng, jitter)
    for za, zb in zip(zs, zs[1:]):
        xs = _split(x0, x1, rng.choice(cols), rng, jitter)
        for xa, xb in zip(xs, xs[1:]):
            yield ((xa + xb) / 2, (za + zb) / 2, (xb - xa) - gap, abs(zb - za) - gap)

def tile_span(col, inset=0.0):
    """The x range inside floor tile `col` that cap decorations may use."""
    return col * T + CELL_MARGIN + inset, (col + 1) * T - CELL_MARGIN - inset

CAP_H = 0.32                               # the continuous cap band along the top of row 0 (9 px)
# NB: strip-wide boxes (backing, cap bands) are oversized by 0.6 m so the toon outline hull never shows at the
# strip's x edges (the engine draws every tile from a random column, so an edge line would appear anywhere).

def grass_ground(th, rng, roles, extra=None):
    """Grass floor: a turf cap band (lumpy underside, pale top strip, little tufts) over soil with chunky clods and
    stones, two rows of up to two elements per 32-px tile. roles: turf, turf_hi, soil, soil_dark, rock.
    `extra(B, col, x0, x1)` may add per-tile decorations on the cap (splats, confetti)."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(roles['soil'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_clods', L, th)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.16, top=(CAP_H if row == 0 else 0.0), jitter=0.35):
                u = rng.random()
                if u < 0.3 or w < 0.22 or h < 0.22:
                    continue                                   # bare soil (and no slivers)
                if u < 0.55:                                   # a stone: smaller than its cell, rounded
                    B.rbox(roles['rock'], (xc + rng.uniform(-0.08, 0.08), -0.1, zc), (w * rng.uniform(0.5, 0.8), 0.4, h * rng.uniform(0.5, 0.8)), bevel=0.14, segments=2)
                else:                                          # a dark clod
                    B.rbox(roles['soil_dark'], (xc, -0.1, zc), (w * rng.uniform(0.8, 1.0), 0.4, h * rng.uniform(0.75, 1.0)), bevel=0.1, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(roles['turf'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(roles['turf_hi'], (GP / 2, 0.08, -0.095), (GP + 0.6, 0.95, 0.07), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.12)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere(roles['turf'], (lx, 0.05, -0.06 - CAP_H), 0.15, scale=(1.3, 0.8, 0.7), subdiv=1)
        for k in range(2):
            tx = rng.uniform(x0 + 0.08, x1 - 0.08)
            lean = rng.uniform(-0.04, 0.04)
            B.slab(roles['turf_hi'], [(-0.09, -0.14), (0.09, -0.14), (0.03 + lean, -0.005), (-0.04 + lean, -0.02)], 0.05, at=(tx, 0.0, 0.0))
        if extra:
            extra(B, col, x0, x1)
    B.done(period=None)
    return c

def coral_ground(th, rng, roles):
    """Coral floor: a coral cap band (round nubs, a pale rim, polyp dots) over dark rock plates on a lighter rock
    mortar, two rows of up to two plates per tile. roles: coral, coral2, coral_hi, rock, rock_dark, rock_deep."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(roles['rock'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_plates', L, th)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if w < 0.22 or h < 0.22:
                    continue
                role = roles['rock_deep'] if rng.random() < 0.35 else roles['rock_dark']
                B.rbox(role, (xc, -0.1, zc), (w, 0.4, h), bevel=0.1, segments=2)
                if rng.random() < 0.5:                         # a coral polyp dot on the plate
                    B.sphere(roles['coral'], (xc + rng.uniform(-w * 0.25, w * 0.25), -0.3, zc + rng.uniform(-h * 0.25, h * 0.25)), 0.06, subdiv=1)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(roles['coral'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(roles['coral_hi'], (GP / 2, 0.08, -0.1), (GP + 0.6, 0.95, 0.06), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.12)
        for k in range(2):
            nx = rng.uniform(x0 + 0.1, x1 - 0.1)
            r = rng.uniform(0.09, 0.15)
            B.sphere(roles['coral'] if rng.random() < 0.5 else roles['coral2'], (nx, -0.05, -0.02 - r), r, subdiv=1)
            B.sphere(roles['coral_hi'], (nx - r * 0.3, -0.05 - r * 0.5, -0.02 - r * 0.7), r * 0.3, subdiv=1)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere(roles['coral'], (lx, 0.05, -0.06 - CAP_H), 0.14, scale=(1.3, 0.8, 0.7), subdiv=1)
    B.done(period=None)
    return c

def marble_ground(th, rng, roles):
    """Marble floor (the engine's 'marble' style): a pale cap band with a bright top strip and a thin dark seam
    under it, over big polished slabs (one or two rows of one or two whole slabs per tile) in two stone tones on a
    darker mortar, each slab with a thin slanted vein. roles: cap, cap_hi, seam, slab, slab2, mortar, vein."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(roles['mortar'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_slabs', L, th)
    for col in range(8):
        for row in range(3):
            big = rng.random() < 0.3
            spec = dict(rows=(1,), cols=(1,), jitter=0.0) if big else dict(rows=(1, 2), cols=(1, 2), jitter=0.25)
            for xc, zc, w, h in cell_rects(col, row, rng, gap=0.08, top=(CAP_H if row == 0 else 0.0), **spec):
                if w < 0.2 or h < 0.2:
                    continue
                role = roles['slab'] if rng.random() < 0.6 else roles['slab2']
                B.box(role, (xc, -0.1, zc), (w, 0.4, h), bevel=0.03)
                if rng.random() < 0.6:                         # a vein: a thin slanted bar inset in the slab face
                    vl = min(w, h) * rng.uniform(0.5, 0.8)
                    B.box(roles['vein'], (xc + rng.uniform(-0.15, 0.15) * w, -0.31, zc + rng.uniform(-0.15, 0.15) * h), (vl, 0.02, 0.025), bevel=0.0, rot=(0, rng.uniform(0.5, 1.1) * rng.choice((-1, 1)), 0))
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(roles['cap'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(roles['cap_hi'], (GP / 2, 0.08, -0.085), (GP + 0.6, 0.95, 0.09), bevel=0.0)
    B.box(roles['seam'], (GP / 2, 0.08, -0.06 - CAP_H + 0.02), (GP + 0.6, 0.95, 0.04), bevel=0.0)
    for col in range(8):                                       # a glint on the polished cap every tile
        x0, x1 = tile_span(col, 0.15)
        gx = rng.uniform(x0 + 0.15, x1 - 0.15)
        B.box(roles['cap_hi'], (gx, 0.0, -0.21), (rng.uniform(0.2, 0.35), 0.02, 0.03), bevel=0.0)
    B.done(period=None)
    return c

# ---------------------------------------------------------------------------------------------- shared scenery
def house(B, x, y, w, h, roles, rng, z0=-2.6, floors=None, door=True, balcony=None, shutters=True, splats=0, pots=True):
    """A whitewashed Valencian town house, left wall at `x`, standing on z = 0 (walls continue to z0 under the
    street), with a terracotta gable roof, rows of green-shuttered windows with flower boxes, an arched door and an
    optional iron balcony. roles: wall (a role name), roof, roof_dark, shutter, frame, door, iron, flower_* list, splat, splat_dark."""
    cx = x + w / 2
    B.box(roles['wall'], (cx, y, (h + z0) / 2), (w - 0.06, 1.6, h - z0), bevel=0.02)
    # gable roof: a terracotta wedge with a darker ridge beam and a run of curved tile ends along the eave
    rh = 0.55 + w * 0.08
    B.slab(roles['roof'], [(-w / 2 - 0.16, h), (w / 2 + 0.16, h), (0.0, h + rh)], 1.9, at=(cx, y - 0.95, 0))
    B.box(roles['roof_dark'], (cx, y - 0.95, h + 0.02), (w + 0.4, 1.95, 0.1), bevel=0.0)
    for k in range(int(w / 0.3)):
        B.sphere(roles['roof_dark'], (x - 0.16 + (k + 0.5) * (w + 0.32) / int(w / 0.3), y - 1.0, h + 0.03), 0.07, subdiv=0)
    # windows: rows every 1.1 m from 1.0 up, columns every 0.75 m; shutters as two green leaves with a cream frame
    floors = floors or max(1, int((h - 0.9) / 1.15))
    cols = max(1, int((w - 0.4) / 0.78))
    for fi in range(floors):
        wz = 1.25 + fi * 1.15
        if wz + 0.4 > h - 0.1:
            break
        for ci in range(cols):
            wx = x + w / 2 + (ci - (cols - 1) / 2) * 0.78
            if fi == 0 and door and abs(wx - cx) < 0.3 and cols % 2 == 1:
                continue
            B.box(roles['frame'], (wx, y - 0.82, wz), (0.5, 0.06, 0.62), bevel=0.0)
            B.box(roles['glass'], (wx, y - 0.84, wz), (0.36, 0.04, 0.5), bevel=0.0)
            if shutters:
                for s in (-1, 1):
                    B.box(roles['shutter'], (wx + s * 0.31, y - 0.86, wz), (0.14, 0.05, 0.6), bevel=0.01)
            # flower box under the sill
            B.box(roles['pot'], (wx, y - 0.9, wz - 0.4), (0.44, 0.16, 0.12), bevel=0.02)
            for k in range(3):
                B.sphere(rng.choice(roles['flowers']), (wx - 0.14 + k * 0.14, y - 0.96, wz - 0.3), 0.075, subdiv=1)
            B.sphere(roles['leaf'], (wx, y - 0.95, wz - 0.33), 0.2, scale=(1.2, 0.5, 0.4), subdiv=1)
    if door:
        B.arch(roles['door'], (cx, y - 0.84, 0.0), 0.8, 1.6, 0.06)
        B.arch(roles['frame'], (cx, y - 0.82, 0.0), 0.96, 1.72, 0.04)
    if balcony is not None:
        bz = 1.25 + balcony * 1.15 - 0.45
        B.box(roles['wall'], (cx, y - 1.0, bz), (min(w - 0.5, 2.4), 0.5, 0.1), bevel=0.0)
        for k in range(int(min(w - 0.5, 2.4) / 0.22) + 1):
            bx = cx - min(w - 0.5, 2.4) / 2 + k * 0.22
            B.rod(roles['iron'], (bx, y - 1.22, bz), (bx, y - 1.22, bz + 0.55), 0.015, segs=4)
        B.box(roles['iron'], (cx, y - 1.22, bz + 0.56), (min(w - 0.5, 2.4) + 0.05, 0.03, 0.04), bevel=0.0)
    for k in range(splats):
        sx = x + rng.uniform(0.3, w - 0.3); sz = rng.uniform(0.3, min(h - 0.4, 2.6))
        splat(B, sx, y - 0.84, sz, rng.uniform(0.18, 0.34), roles, rng)

def splat(B, x, y, z, r, roles, rng, drips=True):
    """A tomato splat on a wall: a lumpy red disc (a ring of overlapping discs) with a couple of drips running down."""
    B.disc(roles['splat'], (x, y, z), r, 0.04, segs=10)
    for k in range(5):
        a = TAU * k / 5 + rng.uniform(0, 0.6)
        rr = r * rng.uniform(0.35, 0.6)
        B.disc(roles['splat'], (x + math.cos(a) * r * 0.85, y, z + math.sin(a) * r * 0.85), rr, 0.04, segs=8)
    B.disc(roles['splat_dark'], (x - r * 0.25, y - 0.01, z + r * 0.15), r * 0.35, 0.03, segs=8)
    if drips:
        for k in range(2):
            dx = x + rng.uniform(-0.6, 0.6) * r
            ln = rng.uniform(0.2, 0.5)
            B.rod(roles['splat'], (dx, y, z), (dx, y, z - ln), 0.03, segs=4)
            B.sphere(roles['splat'], (dx, y, z - ln), 0.045, subdiv=0)

def orange_tree(B, x, y, h, roles, rng, oranges=True):
    """A lumpy orange tree: a short dark trunk, three overlapping crown blobs, a scatter of orange fruit."""
    r = h * 0.36
    B.rod(roles['trunk'], (x, y, -0.1), (x, y, h * 0.42), 0.055 * h, segs=5, r2=0.04 * h)
    B.sphere(roles['crown'], (x, y, h - r), r, scale=(1.15, 0.8, 1.0), subdiv=1)
    B.sphere(roles['crown2'], (x - r * 0.6, y - 0.1, h - r - r * 0.35), r * 0.7, scale=(1.0, 0.8, 0.9), subdiv=1)
    B.sphere(roles['crown2'], (x + r * 0.62, y - 0.12, h - r - r * 0.3), r * 0.68, scale=(1.0, 0.8, 0.9), subdiv=1)
    B.sphere(roles['crown'], (x + r * 0.1, y - 0.2, h - r + r * 0.45), r * 0.6, subdiv=1)
    if oranges:
        for k in range(rng.randint(5, 8)):
            a = rng.uniform(0, TAU); d = rng.uniform(0.2, 0.9)
            ox, oz = x + math.cos(a) * r * 1.05 * d, h - r + math.sin(a) * r * 0.85 * d
            B.sphere(roles['orange'], (ox, y - r * 0.8 - 0.1, oz), 0.065 * h, subdiv=1)

def crate(B, x, y, z, w, roles, rng, fruit='orange'):
    """A wooden slat crate heaped with fruit."""
    B.box(roles['crate'], (x, y, z + w * 0.3), (w, w * 0.8, w * 0.6), bevel=0.02)
    for k in range(2):
        B.box(roles['crate_dark'], (x, y - w * 0.41, z + w * 0.15 + k * w * 0.26), (w + 0.02, 0.02, w * 0.06), bevel=0.0)
    for k in range(4):
        B.sphere(roles[fruit], (x - w * 0.3 + k * w * 0.2, y - w * 0.1, z + w * 0.66), w * 0.14, subdiv=1)
    B.sphere(roles[fruit], (x + w * 0.05, y - w * 0.2, z + w * 0.82), w * 0.14, subdiv=1)

def bunting(B, x0, x1, y, z, sag, roles, rng, n=None, flag=True):
    """A string of triangular flags (or round bulbs) sagging between two points."""
    n = n or max(3, int((x1 - x0) / 0.45))
    pts = []
    for k in range(n + 1):
        t = k / n
        pts.append((x0 + (x1 - x0) * t, y, z - sag * math.sin(math.pi * t)))
    B.chain(roles['string'], pts, 0.012, segs=3)
    for k in range(n):
        px, py, pz = pts[k]; qx, qy, qz = pts[k + 1]
        mx, mz = (px + qx) / 2, (pz + qz) / 2
        role = rng.choice(roles['flags'])
        if flag:
            B.slab(role, [(-0.14, 0.0), (0.14, 0.0), (0.0, -0.3)], 0.02, at=(mx, py - 0.02, mz))
        else:
            B.sphere(role, (mx, py, mz - 0.09), 0.075, subdiv=1)

# ---------------------------------------------------------------------------------------------- preview renderer
FRAME_H = P * RES[1] / RES[0]

def z_center_for_row(row):
    """Camera z that puts the layer's ground line (z = 0) on pixel row `row` from the top of the strip."""
    return row * FRAME_H / RES[1] - FRAME_H / 2

def setup_render(scene, th):
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
        if m.name.startswith(th.module + '_') and 'glow' in m.name:
            bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if bsdf is not None:
                try:
                    bsdf.inputs['Emission Color'].default_value = bsdf.inputs['Base Color'].default_value
                    bsdf.inputs['Emission Strength'].default_value = 1.0
                except KeyError:
                    pass
    return cam

def _show_only(th, name):
    for n, c in th.COLL.items():
        c.hide_render = (n != name)

def render_layer(th, scene, cam, layer, path):
    _show_only(th, layer)
    cam.data.ortho_scale = P
    scene.render.resolution_x, scene.render.resolution_y = RES
    cam.location = (P / 2, -30, z_center_for_row(th.BASES[layer]))
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

def render_ground(th, scene, cam, path, scale=2):
    """The floor strip: 8 x 3 tiles (256 x 96 logical px) with the walking surface along the top edge."""
    _show_only(th, th.GROUND)
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

def sky_gradient(h, w, sky):
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

def composite(th, paths, out_path, ground_path=None, floor_row=330):
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does (the strip's
    bottom sealed with the layer colour), optionally with the floor strip tiled across from `floor_row` down."""
    import numpy as np
    base = None
    for layer in th.LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            base = sky_gradient(*px.shape[:2], th.SKY)
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

def shuffled_ground(path, out_path, rng, scale=2):
    """Redraw the floor strip the way the engine does: every 32-px tile taken from a random column of the strip."""
    import numpy as np
    px = load_pixels(path)
    t = 32 * scale
    out = px.copy()
    for row in range(3):
        for col in range(8):
            src = rng.randrange(8)
            out[row * t:(row + 1) * t, col * t:(col + 1) * t] = px[row * t:(row + 1) * t, src * t:(src + 1) * t]
    save_pixels(out_path, out)

def preview(th, build, build_ground, argv=None):
    """Main-guard body shared by the Valencia themes: build, render every layer (LOOK=toon applies the look kit),
    a composite over the sky, a scene composite with the floor, seam checks, the floor strip and a shuffled-tile
    floor preview into the scratch folder; save the .blend."""
    seed = 1
    argv = sys.argv if argv is None else argv
    for i, a in enumerate(argv):
        if a == '--seed' and i + 1 < len(argv):
            seed = int(argv[i + 1])
    look = os.environ.get('LOOK', '')
    os.makedirs(SCRATCH, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    cols = build(seed)
    print('triangles:', th.triangle_count(), {l: th.triangle_count([l]) for l in th.LAYERS})
    cam = setup_render(scene, th)
    if look:
        import lookkit as LK
        LK.apply_look(look, [o for c in cols.values() for o in c.all_objects], outline_px=0.9)
    tag = f'_{look}' if look else ''
    paths = {}
    for layer in th.LAYERS:
        paths[layer] = os.path.join(SCRATCH, f'{th.module}_{layer}{tag}.png')
        render_layer(th, scene, cam, layer, paths[layer])
        print('rendered', paths[layer])
    comp = os.path.join(SCRATCH, f'{th.module}_composite{tag}.png')
    composite(th, paths, comp)
    print('composite', comp)
    for layer in th.LAYERS:
        seam_check(paths[layer], os.path.join(SCRATCH, f'{th.module}_{layer}_seam{tag}.png'))
    gcol = build_ground(seed)
    print('ground triangles:', th.triangle_count([th.GROUND]))
    if look:
        import lookkit as LK
        LK.apply_look(look, list(gcol.all_objects), outline_px=0.9)
    gp = os.path.join(SCRATCH, f'{th.module}_ground{tag}.png')
    render_ground(th, scene, cam, gp)
    g1 = os.path.join(SCRATCH, f'{th.module}_ground_1x{tag}.png')
    render_ground(th, scene, cam, g1, scale=1)
    shuffled_ground(gp, os.path.join(SCRATCH, f'{th.module}_ground_shuffled{tag}.png'), random.Random(seed + 7))
    composite(th, paths, os.path.join(SCRATCH, f'{th.module}_scene{tag}.png'), ground_path=g1)
    print('ground', gp)
    for c in th.COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{th.module}{tag}.blend'))

# =============================================================================================== es_tomatina
PALETTE = {
    # L0 grove (#3a8a3a)
    'ridge': '#6aa868', 'ridge2': '#56985a', 'floor': '#3a8a3a', 'floor_dark': '#2e7030', 'path': '#5a9a4c',
    'trunk': '#5a3a22', 'crown': '#3a8a3a', 'crown2': '#2f7a32', 'crown_far': '#4a9448', 'crown_far2': '#3f8640',
    'orange': '#ff8a1a', 'crate': '#b8884a', 'crate_dark': '#8a6030',
    # L1 town (#f4f0e8)
    'wall_a': '#f4f0e8', 'wall_b': '#ebe5d8', 'wall_c': '#f8f2e4', 'wall_d': '#f2e8dc', 'street': '#dcd4c4', 'kerb': '#c8bea8',
    'roof': '#c8603a', 'roof_dark': '#a84a2c', 'shutter': '#2a7a4a', 'frame': '#fffaf0', 'glass': '#9ab8c8', 'door': '#6a4a30',
    'iron': '#2a2a30', 'pot': '#b86a3a', 'leaf': '#3a8a3a',
    'fl_pink': '#ff5a8a', 'fl_yellow': '#ffd23a', 'fl_blue': '#3ac8ff', 'fl_violet': '#b86aff', 'fl_orange': '#ff8a2a',
    'splat': '#e8322a', 'splat_dark': '#b81e1e', 'tomato': '#e8322a', 'tomato_leaf': '#2a8a3a', 'string': '#4a3a30',
    'truck': '#3a8ad8', 'truck_dark': '#2a6ab0', 'tyre': '#2a2a30', 'hub': '#c8c8c8',
    # ground (grass style, the theme's sandy street colours)
    'g_turf': '#c8b8a0', 'g_turf_hi': '#e8dcc8', 'g_soil': '#b8a48a', 'g_soil_dark': '#8a7a62', 'g_rock': '#c8b498', 'g_pulp': '#e8322a',
}
TH = Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
TREE_ROLES = {'trunk': 'trunk', 'crown': 'crown', 'crown2': 'crown2', 'orange': 'orange', 'crate': 'crate', 'crate_dark': 'crate_dark'}
FAR_TREE_ROLES = dict(TREE_ROLES, crown='crown_far', crown2='crown_far2')
HOUSE_ROLES = {'roof': 'roof', 'roof_dark': 'roof_dark', 'shutter': 'shutter', 'frame': 'frame', 'glass': 'glass', 'door': 'door',
               'iron': 'iron', 'pot': 'pot', 'leaf': 'leaf', 'flowers': ['fl_pink', 'fl_yellow', 'fl_blue', 'fl_violet', 'fl_orange'],
               'splat': 'splat', 'splat_dark': 'splat_dark', 'string': 'string', 'flags': ['fl_pink', 'fl_yellow', 'fl_blue', 'fl_violet', 'fl_orange']}

def build_L0(rng):
    """The grove: a pale green ridge behind, a dark grove floor, a back row of smaller trees, a front row of big
    lumpy orange trees, crates of oranges and a dirt path."""
    L = 'L0'
    ridge_slab(TH, L, 'L0_ridge', periodic_fn(rng, 1.6, 3.2, 3), 'ridge', y=5.0, depth=1.0, zb=-2.5)
    ridge_slab(TH, L, 'L0_ridge2', periodic_fn(rng, 0.9, 2.0, 4), 'ridge2', y=4.2, depth=0.8, zb=-2.5)
    fill_below(TH, L, 'floor', top=0.25, depth=3.0, y=3.0)
    Builder('L0_path', L, TH).box('path', (P / 2, 1.2, 0.08), (P + 2 * OVER, 1.2, 0.16), bevel=0.0).done(period=None)
    B = Builder('L0_back_trees', L, TH)
    for x in jittered(rng, 14, 0.3):
        h = rng.uniform(2.0, 2.6)
        for dx in wraps(x, h * 0.6):
            orange_tree(B, x + dx, rng.uniform(2.4, 3.2), h, FAR_TREE_ROLES, rng)
    B.done(period=None)
    B = Builder('L0_front_trees', L, TH)
    for x in jittered(rng, 11, 0.3):
        h = rng.uniform(2.6, 3.4)
        for dx in wraps(x, h * 0.6):
            orange_tree(B, x + dx, rng.uniform(-0.3, 0.6), h, TREE_ROLES, rng)
    B.done(period=None)
    B = Builder('L0_crates', L, TH)
    for x in jittered(rng, 5, 0.4):
        for dx in wraps(x, 0.8):
            crate(B, x + dx, -0.6, 0.02, 0.55, TREE_ROLES, rng)
            if rng.random() < 0.6:
                crate(B, x + dx + 0.62, -0.5, 0.02, 0.5, TREE_ROLES, rng)
    B.done(period=None)

def build_L1(rng):
    """The town street: a continuous facade of whitewashed houses (2-3.8 m wide, 2.8-5.3 m tall) with terracotta
    roofs, shutters and flower boxes, tomato splats over the lower walls, bunting between the roofs, crate stacks,
    loose tomatoes on the kerb and one parked tomato truck per period."""
    L = 'L1'
    fill_below(TH, L, 'street', top=0.2, depth=3.0, y=2.0)
    Builder('L1_kerb', L, TH).box('kerb', (P / 2, -1.2, 0.07), (P + 2 * OVER, 0.5, 0.14), bevel=0.0).done(period=None)
    walls = ['wall_a', 'wall_b', 'wall_c', 'wall_d']
    # houses: widths summing exactly to P so the street is continuous across the seam
    n = 11
    ws = [rng.uniform(2.3, 4.0) for _ in range(n)]
    s = P / sum(ws); ws = [w * s for w in ws]
    x = 0.0
    B = Builder('L1_houses', L, TH)
    truck_at = rng.randrange(n)
    for i, w in enumerate(ws):
        h = rng.uniform(3.0, 5.2)
        y = rng.choice([0.0, 0.35, 0.7])
        roles = dict(HOUSE_ROLES, wall=walls[i % 4])
        balcony = 1 if (h > 3.6 and rng.random() < 0.5) else None
        house(B, x, y, w, h, roles, rng, balcony=balcony, splats=rng.randint(1, 3), door=(i != truck_at))
        # bunting from this roof to the next (the last string wraps to the first house at x + P)
        nx = x + w
        if rng.random() < 0.7:
            bunting(B, x + w * 0.5, nx + ws[(i + 1) % n] * 0.5, y - 1.1, min(h, 4.2) - 0.2, 0.5, roles, rng)
        x = nx
    B.done()
    # street dressing: crate stacks, loose tomatoes, the parked truck
    B = Builder('L1_street', L, TH)
    for x in jittered(rng, 6, 0.4):
        for dx in wraps(x, 1.0):
            crate(B, x + dx, -1.0, 0.0, 0.6, dict(TREE_ROLES, orange='tomato'), rng, fruit='orange')
            if rng.random() < 0.5:
                crate(B, x + dx + 0.1, -1.0, 0.37, 0.55, dict(TREE_ROLES, orange='tomato'), rng, fruit='orange')
    for x in jittered(rng, 14, 0.5):
        for dx in wraps(x, 0.3):
            r = rng.uniform(0.11, 0.16)
            B.sphere('tomato', (x + dx, -1.3, r), r, scale=(1.0, 1.0, 0.85), subdiv=1)
            B.sphere('tomato_leaf', (x + dx, -1.3, r * 1.8), r * 0.4, scale=(1.4, 1.0, 0.5), subdiv=0)
    B.done(period=None)
    tx = sum(ws[:truck_at]) + ws[truck_at] / 2
    B = Builder('L1_truck', L, TH)
    truck(B, tx, -0.2, rng)
    B.done()

def truck(B, x, y, rng):
    """A stubby flatbed truck heaped with tomatoes, facing +X."""
    B.box('truck', (x - 0.5, y, 0.9), (3.4, 1.6, 0.5), bevel=0.04)                  # bed
    B.box('truck_dark', (x - 0.5, y - 0.85, 1.0), (3.4, 0.08, 0.7), bevel=0.0)     # side board
    B.box('truck', (x + 1.9, y, 1.25), (1.3, 1.5, 1.4), bevel=0.08)                 # cab
    B.box('glass', (x + 2.0, y, 1.5), (1.1, 1.3, 0.6), bevel=0.03)
    B.box('truck', (x + 2.6, y, 0.95), (0.4, 1.5, 0.8), bevel=0.06)                 # bonnet
    for wx in (x - 1.4, x + 0.5, x + 2.2):
        B.lathe('tyre', [(0.38, -0.3), (0.38, 0.3)], 10, at=(wx, y - 0.6, 0.38), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        B.lathe('hub', [(0.16, -0.32), (0.16, 0.32)], 8, at=(wx, y - 0.6, 0.38), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    for k in range(14):
        hx = x - 1.9 + (k % 7) * 0.47 + (k // 7) * 0.2
        B.sphere('tomato', (hx, y - 0.6 + (k // 7) * 0.4, 1.45 + (k // 7) * 0.3), 0.21, subdiv=1)
    B.sphere('tomato', (x - 0.4, y - 0.7, 2.05), 0.21, subdiv=1)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Grass style in the theme's sandy street colours, with tomato-pulp blobs splashed along the cap."""
    rng = random.Random(seed)
    def pulp(B, col, x0, x1):
        if rng.random() < 0.7:
            px = rng.uniform(x0 + 0.15, x1 - 0.15)
            B.sphere('g_pulp', (px, -0.05, -0.08), rng.uniform(0.08, 0.13), scale=(1.5, 0.8, 0.6), subdiv=1)
            B.sphere('g_pulp', (px + 0.1, -0.05, -0.2), 0.05, subdiv=0)
    return grass_ground(TH, rng, {'turf': 'g_turf', 'turf_hi': 'g_turf_hi', 'soil': 'g_soil', 'soil_dark': 'g_soil_dark', 'rock': 'g_rock'}, extra=pulp)

def clear():
    TH.clear()

if __name__ == '__main__':
    preview(TH, build, build_ground)
