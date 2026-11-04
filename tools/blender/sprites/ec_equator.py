# Ecuador 2-1 "Middle of the World" (theme ec_equator): the parallax background as a Fiesta Toon diorama, one
# Collection per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the equator line's plateau,
# the Middle of the World monument (a plain obelisk on steps with a globe on top), patchwork Andean ridges and a
# banana plantation in front.
#
#   L0  mountains  (base 280, #8aa0c8, blur)  far faceted peaks with snow caps over a hazy backing ridge
#   L1  ecMonument (base 360, #c8b898)        the monument at 640/1024 of the period on a plaza with low walls
#   L2  ecAndes    (base 330, #4a9a4a)        two rows of green domed ridges quilted with patchwork fields
#   L3  ecBananas  (base 352, #3a8a3a)        banana plants (stem, a fan of six leaves, a bunch) over bushes
#   ground         grass: turf cap over soil with clods and stones, tile-aligned
#
# This module also holds the toolkit shared by the other Ecuador themes (ec_andes, ec_amazon, ec_galapagos,
# ec_cotopaxi import it): the Theme context (materials, collections, tiling), the chunky-part Builder, the
# tile-aligned floor helpers, the shared scenery (far mountains, Andean ridges, the Cotopaxi cone, grass floor)
# and the preview renderer.
#
# Contract (same as mx_canal.py): every layer stands on its own ground line z = 0, is periodic in x with period P
# (anything crossing x = 0 or x = P is duplicated at x ± P) and stays within y in [-6, 6] (the camera looks along
# +Y from -Y). 1 m = 28.1 px; the player is 1.85 m tall. Materials are plain Principled BSDFs (Base Color only)
# named '<theme>_<role>' so the look kit can restyle them (names containing 'glow' render unlit); every object
# carries obj['sprite_layer']. BASES holds the engine's ground row per layer (px from the top of the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_equator.py [--seed N]
# (LOOK=toon in the environment previews through lookkit's toon look; default is the plain preview)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

MODULE = 'ec_equator'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1', 'L2', 'L3']          # back to front
BASES = {'L0': 280, 'L1': 360, 'L2': 330, 'L3': 352}
GROUND_COLL = 'ground'
PPM = 28.1
GP = 8 * (32 / PPM)                        # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / PPM)              # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2a8ae8', '#8ad0ff', '#f0fff0']
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/ecbg'
TAU = math.tau
T = 32 / PPM                               # one floor tile (1.139 m): ground elements never cross a tile edge
CELL_MARGIN = 0.045                        # mortar kept clear inside every tile edge

# =============================================================================================== shared toolkit
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

class Theme:
    """One theme's context: its palette (material name -> hex), its layer collections and the ground collection."""
    def __init__(self, module, layers, bases, palette, sky, ground=GROUND_COLL):
        self.module, self.LAYERS, self.BASES, self.PALETTE, self.SKY, self.GROUND = module, layers, bases, palette, sky, ground
        self.COLL = {}

    def material(self, name):
        """A plain Principled material (Base Color + roughness 0.6); the look kit restyles it later."""
        m = bpy.data.materials.get(name)
        if m is None:
            m = bpy.data.materials.new(name)
            m.use_nodes = True
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bsdf is None:
            bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
            out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
            m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        bsdf.inputs['Base Color'].default_value = hex_linear(self.PALETTE[name])
        bsdf.inputs['Roughness'].default_value = 0.6
        m.diffuse_color = hex_linear(self.PALETTE[name])
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
        """A rounded box (multi-segment bevel, smooth shaded): clods, pebbles, rock plates, ice blocks."""
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

    def chain(self, role, pts, r, segs=5, taper=1.0):
        """Rods joining consecutive points (a vine, a kelp stalk), the radius tapering to r * taper at the end."""
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

    def band_arch(self, role, at, R, RZ, thick, depth, legs=0.0, segs=8, rot=None):
        """A standing arch *band* (a rainbow / rock arch): outer half-ellipse (R, RZ) minus the inner one, with
        optional straight legs of height `legs` under the spring line; bottom centre at `at`."""
        pts = [(-(R + thick), 0.0), (-(R + thick), legs)] if legs > 0 else [(-(R + thick), 0.0)]
        for k in range(segs + 1):
            a = math.pi - math.pi * k / segs
            pts.append(((R + thick) * math.cos(a), legs + (RZ + thick) * math.sin(a)))
        if legs > 0:
            pts.append((R + thick, 0.0)); pts.append((R - thick, 0.0))
        pts.append((R - thick, legs))
        for k in range(segs, -1, -1):
            a = math.pi - math.pi * k / segs
            pts.append(((R - thick) * math.cos(a), legs + (RZ - thick) * math.sin(a)))
        if legs > 0:
            pts.append((-(R - thick), 0.0))
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

def profile_r(prof, z):
    """Radius of a lathe profile at height z (linear between rings)."""
    for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / ((z1 - z0) or 1.0)
    return prof[-1][0] if z > prof[-1][1] else prof[0][0]

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

def fill_below(th, L, role, top=0.0, depth=2.0, y=2.5):
    """A plain band from `top` down `depth` across the period: seals the layer under its ground line."""
    return Builder(f'{L}_fill', L, th).box(role, (P / 2, y, top - depth / 2), (P + 2 * OVER, 6.0, depth), bevel=0.0).done(period=None)

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

def grass_ground(th, rng, roles):
    """Grass floor: a turf cap band (lumpy underside, pale top strip, little tufts) over soil with chunky clods and
    stones, two rows of up to two elements per 32-px tile. roles: turf, turf_hi, soil, soil_dark, rock."""
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
    B.done(period=None)
    return c

# ---------------------------------------------------------------------------------------------- shared scenery
def far_mountains(th, L, rng, roles, amp=5.3, yscale=0.3, snow=True, n=(6, 8), haze=True):
    """A far range: faceted cone peaks (5-7 sides, two rock tones, snow caps with a zig-zag snow line on the tall
    ones) in front of a hazy backing ridge, the foot sealed below the ground line. roles: rock, rock2, snow, haze, foot."""
    if haze:
        ridge_slab(th, L, f'{L}_haze', periodic_fn(rng, amp * 0.22, amp * 0.5, 3), roles['haze'], y=4.5, depth=1.0, zb=-2.0)
    B = Builder(f'{L}_peaks', L, th)
    xs = jittered(rng, rng.randint(*n), 0.3)
    for i, x in enumerate(xs):
        h = amp * rng.uniform(0.5, 1.0)
        R = h * rng.uniform(0.85, 1.3)
        y = rng.choice([0.0, 1.0, 2.2])
        segs = rng.choice([5, 6, 7])
        ph = rng.uniform(0, TAU)
        prof = [(R, -0.4), (R * 0.6, h * 0.4), (R * 0.3, h * 0.74), (0.0, h)]
        B.lathe(roles['rock'] if i % 2 == 0 else roles['rock2'], prof, segs, at=(x, y, 0), yscale=yscale, phase=ph)
        if snow and h > amp * 0.62:
            zs = h * 0.62
            snowp = [(profile_r(prof, zs) + 0.12, zs), (profile_r(prof, h * 0.82) + 0.1, h * 0.82), (0.0, h + 0.06)]
            B.lathe(roles['snow'], snowp, segs, at=(x, y, 0), yscale=yscale, phase=ph, jag=lambda k: (-0.32 if k % 2 else 0.0))
    B.done()
    fill_below(th, L, roles['foot'], top=0.3, depth=2.0, y=3.0)

def andean_ridges(th, L, rng, roles, hmax=2.5, rows=2, fields=True):
    """Green Andean ridges: per row (the back row 1.4 m lower and darker, as the painter's base + 40 px) a backing
    skyline slab and a run of broad domes quilted with tilted patchwork fields that sit on the dome fronts.
    roles: hill, hill2, field_a..field_d."""
    field_roles = [roles[k] for k in ('field_a', 'field_b', 'field_c', 'field_d')]
    for r in range(rows - 1, -1, -1):
        z_off = -r * 1.4
        role = roles['hill'] if r == 0 else roles['hill2']
        y = 1.2 + r * 2.6
        ridge_slab(th, L, f'{L}_ridge{r}', periodic_fn(rng, 0.7 + z_off, 1.5 + z_off, 3), role, y=y + 1.2, depth=1.0, zb=-2.5)
        B = Builder(f'{L}_domes{r}', L, th)
        for x in jittered(rng, rng.randint(5, 7), 0.25):
            R = rng.uniform(3.4, 5.8); h = hmax * rng.uniform(0.6, 1.0); ys = 0.4
            prof = [(R * math.cos(t * math.pi / 2), z_off + h * math.sin(t * math.pi / 2)) for t in (0, 0.3, 0.55, 0.78, 0.93, 1.0)]
            B.lathe(role, prof, 12, at=(x, y, 0), yscale=ys)
            if not fields:
                continue
            for k in range(rng.randint(3, 5)):
                dx = rng.uniform(-0.8, 0.8) * R
                zmax = h * math.sqrt(1 - (dx / R) ** 2)
                if zmax < 0.6:
                    continue
                z = rng.uniform(0.25, zmax * 0.9)
                rho = R * math.sqrt(max(0.0, 1 - (z / h) ** 2))
                yf = y - ys * math.sqrt(max(0.0, rho * rho - dx * dx)) - 0.2
                slope = -(h / R) * (dx / R) / math.sqrt(1 - (dx / R) ** 2)
                B.box(rng.choice(field_roles), (x + dx, yf, z_off + z), (rng.uniform(1.2, 2.0), 0.06, rng.uniform(0.34, 0.5)), bevel=0.02, rot=(0, -math.atan(slope) * 0.8, 0))
        B.done()

def volcano_cone(th, L, rng, roles, x=P * 560 / 1024, h=8.6, R=11.2, yscale=0.32, steam=True):
    """Cotopaxi: a perfect faceted cone (10 sides) with a zig-zag snow cap over the top third, a wisp of steam puffs
    drifting off the summit, low foothills and the foot sealed below. roles: rock, snow, steam, foot."""
    B = Builder(f'{L}_cone', L, th)
    segs, ph = 10, rng.uniform(0, TAU)
    prof = [(R, -0.4), (R * 0.55, h * 0.36), (R * 0.27, h * 0.7), (R * 0.12, h * 0.92), (0.9, h)]
    B.lathe(roles['rock'], prof, segs, at=(x, 0.5, 0), yscale=yscale, phase=ph, cap_top=True)
    zs = h - 2.9
    snow = [(profile_r(prof, zs) + 0.15, zs), (profile_r(prof, h * 0.86) + 0.12, h * 0.86), (1.0, h + 0.06)]
    B.lathe(roles['snow'], snow, segs, at=(x, 0.5, 0), yscale=yscale, phase=ph, jag=lambda k: (-0.55 if k % 2 else 0.0), cap_top=True)
    if steam:
        for k in range(4):
            B.sphere(roles['steam'], (x + 0.5 + k * 0.62, 0.0, h + 0.45 + k * 0.5), 0.42 + k * 0.15, subdiv=1)
    B.done()
    ridge_slab(th, L, f'{L}_foothills', periodic_fn(rng, 0.5, 1.5, 3), roles['foot'], y=4.2, depth=1.0, zb=-2.0)
    fill_below(th, L, roles['foot'], top=0.3, depth=2.0, y=3.0)

# ---------------------------------------------------------------------------------------------- preview renderer
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

def composite(th, paths, out_path):
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does."""
    import numpy as np
    base = None
    for layer in th.LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            h, w = px.shape[:2]
            base = np.zeros_like(px); base[..., 3] = 1.0
            stops = [hex_linear(c)[:3] for c in th.SKY]
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
    """Main-guard body shared by the Ecuador themes: build, render every layer, a composite over the sky, seam
    checks, the floor strip and a shuffled-tile floor preview into the scratch folder; save the .blend."""
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
    cam = setup_render(scene)
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
    shuffled_ground(gp, os.path.join(SCRATCH, f'{th.module}_ground_shuffled{tag}.png'), random.Random(seed + 7))
    print('ground', gp)
    for c in th.COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{th.module}{tag}.blend'))

# =============================================================================================== ec_equator
PALETTE = {
    # L0 far peaks (#8aa0c8)
    'equator_peak': '#8aa0c8', 'equator_peak2': '#7e94bf', 'equator_haze': '#a4b6d6', 'equator_snow': '#f4f8ff', 'equator_foot': '#7a90b8',
    # L1 monument (#c8b898)
    'equator_stone': '#c8b898', 'equator_stone_dark': '#a89878', 'equator_stone_light': '#e4d8b8', 'equator_plaza': '#b4a484',
    'equator_globe': '#c8a050', 'equator_globe_band': '#8a6a30', 'equator_hedge': '#5a9a4a', 'equator_hedge2': '#4d8a40',
    'equator_line_red': '#e8323a', 'equator_line_yellow': '#ffd23a',
    # L2 ridges (#4a9a4a)
    'equator_hill': '#4a9a4a', 'equator_hill2': '#3e843e',
    'equator_field_a': '#a4c462', 'equator_field_b': '#78b858', 'equator_field_c': '#bcb86a', 'equator_field_d': '#60a84c',
    # L3 bananas (#3a8a3a)
    'equator_leaf': '#3a8a3a', 'equator_leaf_light': '#4aa048', 'equator_leaf_dark': '#2e7030', 'equator_stem': '#2a5e2a',
    'equator_banana': '#e8d84a', 'equator_bud': '#8a2a5a', 'equator_bush': '#2f7430', 'equator_floor': '#2a6a2a',
    # ground (grass)
    'equator_g_turf': '#5ab84a', 'equator_g_turf_hi': '#a8e86a', 'equator_g_soil': '#7e5236', 'equator_g_soil_dark': '#5a3a24', 'equator_g_rock': '#a87a5a',
}
TH = Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def build_L0(rng):
    far_mountains(TH, 'L0', rng, {'rock': 'equator_peak', 'rock2': 'equator_peak2', 'snow': 'equator_snow', 'haze': 'equator_haze', 'foot': 'equator_foot'}, amp=5.3)

def build_L1(rng):
    """The Middle of the World monument: a plaza, three steps, a tapering square obelisk, a cornice and drum, the
    globe with its equator ring, flanked by low walls with globe finials and a hedge at each end."""
    L = 'L1'
    x = P * 640 / 1024
    B = Builder('L1_monument', L, TH)
    B.box('equator_plaza', (x, 1.0, 0.1), (11.0, 2.8, 0.2), bevel=0.02)
    for i, (w, zc) in enumerate(((5.2, 0.35), (4.2, 0.65), (3.3, 0.95))):
        B.box('equator_stone_dark' if i == 0 else 'equator_stone', (x, 0.0, zc), (w, w * 0.8, 0.3), bevel=0.03)
    z0, hob = 1.1, 4.1
    B.lathe('equator_stone', [(1.15, z0), (0.78, z0 + hob)], 4, at=(x, 0, 0), phase=math.pi / 4, cap_top=True)
    B.box('equator_stone_light', (x, 0, z0 + hob + 0.12), (1.7, 1.7, 0.24), bevel=0.03)
    B.lathe('equator_stone_dark', [(0.34, z0 + hob + 0.24), (0.34, z0 + hob + 0.5), (0.5, z0 + hob + 0.62)], 8, at=(x, 0, 0), cap_top=True)
    gz = z0 + hob + 0.62 + 0.68
    B.sphere('equator_globe', (x, 0, gz), 0.72, subdiv=2)
    B.lathe('equator_globe_band', [(0.76, gz - 0.06), (0.76, gz + 0.06)], 16, at=(x, 0, 0), cap_top=False)
    B.lathe('equator_globe_band', [(0.76, -0.06), (0.76, 0.06)], 16, at=(x, 0, gz), rot=(math.pi / 2, 0, 0), cap_top=False)
    # the painted equator line across the plaza top (red with a yellow centre)
    B.box('equator_line_red', (x, 0.0, 0.21), (11.0, 0.5, 0.03), bevel=0.0)
    B.box('equator_line_yellow', (x, 0.0, 0.225), (11.0, 0.16, 0.02), bevel=0.0)
    # flanking low walls with small globe finials
    for sx in (-1, 1):
        wx = x + sx * 3.9
        B.box('equator_stone_dark', (wx, 0.0, 0.5), (3.2, 0.6, 0.6), bevel=0.03)
        B.box('equator_stone', (wx, 0.0, 0.84), (3.3, 0.7, 0.1), bevel=0.02)
        for px in (-1.3, 1.3):
            B.box('equator_stone', (wx + px, 0.0, 1.05), (0.4, 0.4, 0.34), bevel=0.03)
            B.sphere('equator_globe', (wx + px, 0.0, 1.38), 0.17, subdiv=1)
    B.done()
    B = Builder('L1_hedges', L, TH)
    for sx in (-1, 1):
        hx = x + sx * 6.4
        for k, (dx, r) in enumerate(((-0.6, 0.5), (0.0, 0.62), (0.6, 0.5))):
            B.sphere('equator_hedge' if k % 2 == 0 else 'equator_hedge2', (hx + dx, 0.6, 0.45), r, scale=(1.0, 0.7, 0.8), subdiv=1)
    B.done()

def build_L2(rng):
    andean_ridges(TH, 'L2', rng, {'hill': 'equator_hill', 'hill2': 'equator_hill2', 'field_a': 'equator_field_a', 'field_b': 'equator_field_b',
                                  'field_c': 'equator_field_c', 'field_d': 'equator_field_d'}, hmax=2.5)

def leaf_pts(Lf, W, c):
    """A banana leaf outline: a pointed blade along +Z (length Lf, half-width W) whose spine bends sideways by c."""
    ss = [0.0, 0.16, 0.36, 0.58, 0.78, 0.92, 1.0]
    right, left = [], []
    for s in ss:
        cx, cz = c * s * s * Lf, s * Lf
        w = W * (math.sin(math.pi * s) ** 0.55) if 0 < s < 1 else 0.0
        right.append((cx + w, cz)); left.append((cx - w, cz))
    return right + left[-2:0:-1]

def banana_plant(L, name, x, y, h, rng):
    """A banana plant: a thick pseudo-stem, a fan of six drooping leaves (two greens) and a bunch of bananas with
    its purple flower bud hanging to one side."""
    B = Builder(name, L, TH)
    B.rod('equator_stem', (x, y, -0.3), (x, y, h), 0.13, segs=6, r2=0.1)
    lean = rng.uniform(-0.12, 0.12)
    for k in range(6):
        a = (k - 2.5) * 0.5 + lean
        Lf, W = rng.uniform(1.3, 1.9), rng.uniform(0.24, 0.32)
        pts = leaf_pts(Lf, W, 0.28 if a > 0 else -0.28)
        B.slab('equator_leaf_light' if k % 2 else 'equator_leaf', pts, 0.06, at=(x, y - 0.26 + k * 0.08, h - 0.05), rot=(0, a, 0))
    side = rng.choice([-1, 1])
    bx = x + side * 0.1
    B.rod('equator_leaf_dark', (bx, y - 0.3, h - 0.1), (bx + side * 0.45, y - 0.3, h - 0.95), 0.05, segs=5)
    for tier in range(2):
        for k in range(3):
            px = bx + side * (0.2 + tier * 0.12) + (k - 1) * 0.11
            B.sphere('equator_banana', (px, y - 0.34 - (k % 2) * 0.04, h - 0.45 - tier * 0.26), 0.11, scale=(0.6, 0.6, 1.5), subdiv=1)
    B.sphere('equator_bud', (bx + side * 0.5, y - 0.3, h - 1.12), 0.14, scale=(0.9, 0.9, 1.3), subdiv=1)
    B.done()

def build_L3(rng):
    L = 'L3'
    fill_below(TH, L, 'equator_floor', top=0.1, depth=1.6, y=2.0)
    B = Builder('L3_bushes', L, TH)
    for k in range(16):
        bx = rng.uniform(0, P)
        for dx in wraps(bx, 1.0):
            B.sphere('equator_bush', (bx + dx, 0.9, 0.2), rng.uniform(0.55, 0.8), scale=(1.3, 0.8, 0.6), subdiv=1)
    B.done(period=None)
    x, i = rng.uniform(0.3, 1.2), 0
    while x < P:
        banana_plant(L, f'L3_banana_{i}', x, rng.choice([-0.5, 0.3, 1.1]), rng.uniform(2.3, 3.9), rng)
        x += rng.uniform(2.8, 4.6)
        i += 1

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    build_L3(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Grass floor (turf cap over soil), tile-aligned, period GP; its own collection 'ground'."""
    return grass_ground(TH, random.Random(seed), {'turf': 'equator_g_turf', 'turf_hi': 'equator_g_turf_hi', 'soil': 'equator_g_soil',
                                                  'soil_dark': 'equator_g_soil_dark', 'rock': 'equator_g_rock'})

def clear():
    TH.clear()

if __name__ == '__main__':
    preview(TH, build, build_ground)
