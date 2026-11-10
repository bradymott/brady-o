# Amsterdam 8-1 "Canal Ring" (theme nl_canals): the parallax background as a Fiesta Toon diorama, one Collection
# per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a shoulder-to-shoulder row of tall,
# narrow gabled canal houses over a quay, and the canal itself with brick bridges, moored houseboats and ducks.
#
#   L0  nlCanalHouses (base 300, #7a3a2a)  step / bell / neck / spout gables with hoisting beams, cream window frames,
#                                          arched doors with stoop steps, flower boxes, elm trees on the pavement,
#                                          the brick quay wall below the ground line
#   L1  nlCanal       (base 330, #4a7a7a)  teal water filling from z = 0 down, ripple strokes, two brick arch
#                                          bridges (white railings, bikes leaning on them), three houseboats with
#                                          flower pots, bollards, a pair of ducks
#   ground                                 brick: a grey kerb cap over chunky red bricks on light mortar, tile-aligned
#
# This module also holds the toolkit shared by the other Amsterdam themes (nl_tulips, nl_rush, nl_frozen, nl_waag
# import it): the Theme context (materials, collections, tiling), the chunky-part Builder, the tile-aligned floors
# (brick / snow / wood / grass), the canal-house row, bridges, houseboats, bikes, trees and the preview renderer.
#
# Contract (same as mx_canal.py): every layer stands on its own ground line z = 0, is periodic in x with period P
# (anything crossing x = 0 or x = P is duplicated at x ± P) and stays within y in [-6, 6] (the camera looks along
# +Y from -Y). 1 m = 28.1 px; the player is 1.85 m tall. Materials are plain Principled BSDFs (Base Color only)
# named '<theme key>_<role>' so the look kit can restyle them (names containing 'glow' render unlit); every object
# carries obj['sprite_layer']. BASES holds the engine's ground row per layer (px from the top of the 444-px strip).
# Strip-wide parts overhang the period by OVER on each side so the toon outline hull never draws at the seam.
#
# Run headless:   [LOOK=toon|plain] /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/nl_canals.py [--seed N]
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

MODULE = 'nl_canals'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1']                      # back to front
BASES = {'L0': 300, 'L1': 330}
GROUND_COLL = 'ground'
PPM = 28.1
GP = 8 * (32 / PPM)                        # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / PPM)              # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#4a8ad8', '#a8d0f0', '#f4f4f0']
SCRATCH = os.environ.get('SCRATCH', '/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/nlbg')
TAU = math.tau
T = 32 / PPM                               # one floor tile (1.139 m): ground elements never cross a tile edge
CELL_MARGIN = 0.045                        # mortar kept clear inside every tile edge
OVER = 0.6                                 # strip-wide parts overhang the period by this much on each side
CAP_H = 0.32                               # the continuous cap band along the top of floor row 0 (9 px)

# =============================================================================================== shared toolkit
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

def shade(h, k):
    """Lighten (k > 0) or darken (k < 0) a hex colour, like the engine's shade()."""
    h = h.lstrip('#')
    out = []
    for i in (0, 2, 4):
        v = int(h[i:i + 2], 16)
        v = v + (255 - v) * k if k > 0 else v * (1 + k)
        out.append(max(0, min(255, int(round(v)))))
    return '#%02x%02x%02x' % tuple(out)

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
        """A rounded box (multi-segment bevel, smooth shaded): bricks, clods, pebbles, ice blocks."""
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

    def disc(self, role, at, r, thick, segs=12, phase=0.0):
        """A wheel: a capped cylinder of radius r whose axis runs along Y (it faces the camera), centred at `at`."""
        return self.lathe(role, [(r, -thick / 2), (r, thick / 2)], segs, at=at, cap_top=True, cap_bottom=True, rot=(math.pi / 2, 0, 0), phase=phase)

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

    def chain(self, role, pts, r, segs=5, taper=1.0):
        """Rods joining consecutive points (a rope, a crack, an arc), the radius tapering to r * taper at the end."""
        n = len(pts) - 1
        for i in range(n):
            ra = r * (1 + (taper - 1) * i / n); rb = r * (1 + (taper - 1) * (i + 1) / n)
            self.rod(role, pts[i], pts[i + 1], ra, segs=segs, r2=rb)
        return self

    def slab(self, role, pts, depth, at=(0, 0, 0), rot=None):
        """A flat outline in the local XZ plane extruded `depth` along +Y."""
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

    def band_arch(self, role, at, R, RZ, thick, depth, legs=0.0, segs=10, rot=None):
        """A standing arch band (a bridge deck): outer half-ellipse (R, RZ) minus the inner one, with optional
        straight legs of height `legs` under the spring line; bottom centre at `at`."""
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

def strip_box(th, L, name, role, z_top, z_bot, y0, y1):
    """A plain band across the whole period (overhanging by OVER) between z_bot and z_top, y0 .. y1."""
    return Builder(name, L, th).box(role, (P / 2, (y0 + y1) / 2, (z_top + z_bot) / 2), (P + 2 * OVER, y1 - y0, z_top - z_bot), bevel=0.0).done(period=None)

def quad(p0, p1, p2, t):
    return tuple(p0[i] * (1 - t) ** 2 + 2 * p1[i] * (1 - t) * t + p2[i] * t * t for i in range(2))

# ---------------------------------------------------------------------------------------------- tile-aligned floors
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

def brick_ground(th, rng, R):
    """Brick floor (the quay): a grey stone kerb cap (with a pale top strip and kerb joints) over chunky red bricks in
    a running bond on light mortar: two courses per tile, each of two bricks with a jittered split so the joints
    stagger course to course. R: cap, cap_hi, mortar, brick_a..brick_d."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(R['mortar'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_bricks', L, th)
    bricks = [R['brick_a'], R['brick_a'], R['brick_b'], R['brick_c'], R['brick_c'], R['brick_d']]
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
            z0 = -row * T - CELL_MARGIN - (CAP_H if row == 0 else 0.0)
            z1 = -(row + 1) * T + CELL_MARGIN
            zs = _split(z0, z1, 2, rng, 0.12)
            for ci, (za, zb) in enumerate(zip(zs, zs[1:])):
                # the running bond: alternate courses split near 1/3 and 2/3 of the tile
                f = rng.uniform(0.3, 0.42) if (ci + row) % 2 == 0 else rng.uniform(0.58, 0.7)
                xm = x0 + (x1 - x0) * f
                for xa, xb in ((x0, xm), (xm, x1)):
                    w, h = (xb - xa) - 0.09, abs(zb - za) - 0.09
                    B.rbox(rng.choice(bricks), ((xa + xb) / 2, -0.1, (za + zb) / 2), (w, 0.4, h), bevel=0.06, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(R['cap'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(R['cap_hi'], (GP / 2, 0.08, -0.095), (GP + 0.6, 0.95, 0.07), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.1)
        jx = rng.uniform(x0 + 0.25, x1 - 0.25)
        B.box(R['mortar'], (jx, -0.36, -0.06 - CAP_H / 2 - 0.02), (0.05, 0.06, CAP_H - 0.1), bevel=0.0)
    B.done(period=None)
    return c

def snow_ground(th, rng, R):
    """Snow floor: a snow cap band (pale rim, lumpy underside, an icicle or two per tile) over packed ice: rounded
    ice blocks in three blues (and the odd frozen-in quay brick) on a lighter ice mortar, tile-aligned.
    R: snow, snow_hi, icicle, mortar, ice, ice_deep, ice_light, brick."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(R['mortar'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_ice', L, th)
    roles = [R['ice'], R['ice'], R['ice_deep'], R['ice_light'], R['ice'], R['brick']]
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if w < 0.22 or h < 0.22:
                    continue
                B.rbox(rng.choice(roles), (xc, -0.1, zc), (w, 0.4, h), bevel=0.12, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(R['snow'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(R['snow_hi'], (GP / 2, 0.08, -0.09), (GP + 0.6, 0.95, 0.06), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.12)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere(R['snow'], (lx, 0.05, -0.06 - CAP_H), 0.16, scale=(1.3, 0.8, 0.7), subdiv=1)
        if rng.random() < 0.6:
            ix = rng.uniform(x0 + 0.12, x1 - 0.12)
            B.lathe(R['icicle'], [(0.11, -0.06), (0.0, rng.uniform(0.34, 0.5))], 5, at=(ix, -0.2, -0.06 - CAP_H), rot=(math.pi, 0, 0))
    B.done(period=None)
    return c

def wood_ground(th, rng, R):
    """Wood floor (the weigh house boards): a lighter rim plank along the walking surface, then two courses of
    boards per tile (one or two boards each, so the end seams stagger tile to tile) over a dark gap backing, with a
    nail at each board end. R: cap, cap_hi, gap, plank_a, plank_b, plank_c, nail."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(R['gap'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_planks', L, th)
    roles = [R['plank_a'], R['plank_b'], R['plank_c'], R['plank_a']]
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(2,), cols=(1, 1, 2), gap=0.07, top=(CAP_H if row == 0 else 0.0), jitter=0.2):
                if w < 0.25:
                    continue
                B.box(rng.choice(roles), (xc, -0.1, zc), (w, 0.4, h), bevel=0.03)
                for sx in (-1, 1):
                    B.sphere(R['nail'], (xc + sx * (w / 2 - 0.07), -0.31, zc), 0.028, subdiv=0)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(R['cap'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(R['cap_hi'], (GP / 2, 0.08, -0.09), (GP + 0.6, 0.95, 0.06), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.1)
        jx = rng.uniform(x0 + 0.2, x1 - 0.2)
        B.box(R['gap'], (jx, -0.36, -0.06 - CAP_H / 2), (0.04, 0.06, CAP_H - 0.02), bevel=0.0)
    B.done(period=None)
    return c

def grass_ground(th, rng, R):
    """Grass floor: a turf cap band (lumpy underside, pale top strip, little tufts) over soil with chunky clods and
    stones, two rows of up to two elements per 32-px tile. R: turf, turf_hi, soil, soil_dark, rock."""
    L = th.GROUND
    c = th.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, th).box(R['soil'], (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_clods', L, th)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.16, top=(CAP_H if row == 0 else 0.0), jitter=0.35):
                u = rng.random()
                if u < 0.3 or w < 0.22 or h < 0.22:
                    continue
                if u < 0.55:
                    B.rbox(R['rock'], (xc + rng.uniform(-0.08, 0.08), -0.1, zc), (w * rng.uniform(0.5, 0.8), 0.4, h * rng.uniform(0.5, 0.8)), bevel=0.14, segments=2)
                else:
                    B.rbox(R['soil_dark'], (xc, -0.1, zc), (w * rng.uniform(0.8, 1.0), 0.4, h * rng.uniform(0.75, 1.0)), bevel=0.1, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    B.box(R['turf'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box(R['turf_hi'], (GP / 2, 0.08, -0.095), (GP + 0.6, 0.95, 0.07), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.12)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere(R['turf'], (lx, 0.05, -0.06 - CAP_H), 0.15, scale=(1.3, 0.8, 0.7), subdiv=1)
        for k in range(2):
            tx = rng.uniform(x0 + 0.08, x1 - 0.08)
            lean = rng.uniform(-0.04, 0.04)
            B.slab(R['turf_hi'], [(-0.09, -0.14), (0.09, -0.14), (0.03 + lean, -0.005), (-0.04 + lean, -0.02)], 0.05, at=(tx, 0.0, 0.0))
    B.done(period=None)
    return c

# ---------------------------------------------------------------------------------------------- canal houses
HOUSE_D = 2.4                               # house depth (y)

def gable_pts(kind, w):
    """The gable outline above the cornice, local x in [-w/2, w/2], z up from the cornice top; returns (pts, peak)."""
    if kind == 'bell':
        pts = [(-w / 2, 0.0)]
        for seg in (((-w / 2, 0.0), (-w / 2 + 0.12, 0.72), (-0.2 * w, 0.82)), ((-0.2 * w, 0.82), (0.0, 1.9), (0.2 * w, 0.82)), ((0.2 * w, 0.82), (w / 2 - 0.12, 0.72), (w / 2, 0.0))):
            for i in range(1, 7):
                pts.append(quad(*seg, i / 6))
        return pts, max(z for _, z in pts)
    if kind == 'neck':
        pts = [(-w / 2, 0.0)]
        for i in range(1, 6):
            t = i / 5 * math.pi / 2
            pts.append((-(0.25 * w + 0.25 * w * (1 - math.sin(t))), 0.5 * (1 - math.cos(t))))
        pts += [(-0.25 * w, 1.0), (-0.34 * w, 1.0), (0.0, 1.42), (0.34 * w, 1.0), (0.25 * w, 1.0)]
        for i in range(4, -1, -1):
            t = i / 5 * math.pi / 2
            pts.append(((0.25 * w + 0.25 * w * (1 - math.sin(t))), 0.5 * (1 - math.cos(t))))
        return pts, 1.42
    # spout: a steep triangle with a tiny flat tip
    return [(-w / 2, 0.0), (w / 2, 0.0), (0.09, 1.3), (-0.09, 1.3)], 1.3

def canal_house(th, L, name, x0, w, h, wall, R, rng, y=0.6, night=False, snow=False, gable=None, flowers=False):
    """One canal house, left edge x0, width w, cornice height h: the body runs 3.2 m below the ground line (the
    quay wall shows below the pavement), a cream cornice, a step / bell / neck / spout gable with the hoisting beam
    and hook, floors of tall cream-framed windows (lit or dark at night), an arched door with stoop steps on the
    ground floor. R: trim, glass, glass_dark, window_glow, door, step, hook, snow, flower_box, flower_a..c."""
    B = Builder(name, L, th)
    cx, D = x0 + w / 2, HOUSE_D
    B.box(wall, (cx, y + D / 2, (h - 3.2) / 2), (w, D, h + 3.2), bevel=0.0)
    B.box(R['trim'], (cx, y - 0.04, h + 0.07), (w + 0.04, 0.3, 0.14), bevel=0.0)
    gz = h + 0.14
    gable = gable or rng.choice(['step', 'bell', 'neck', 'spout', 'step'])
    if gable == 'step':
        for k in range(3):
            ww = w * (1 - 2 * k / 7)
            B.box(wall, (cx, y + D / 2, gz + 0.19 + k * 0.38), (ww, D, 0.38), bevel=0.0)
            if snow:
                for sx in (-1, 1):
                    B.box(R['snow'], (cx + sx * (ww / 2 - w / 14), y + 0.12, gz + 0.38 * (k + 1) + 0.04), (w / 7 + 0.06, 0.5, 0.1), bevel=0.02)
        B.box(wall, (cx, y + D / 2, gz + 1.14 + 0.17), (w / 7 + 0.12, D, 0.34), bevel=0.0)
        peak = gz + 1.48
        if snow:
            B.box(R['snow'], (cx, y + 0.12, peak + 0.04), (w / 7 + 0.2, 0.5, 0.1), bevel=0.02)
    else:
        pts, pk = gable_pts(gable, w)
        B.slab(wall, pts, D, at=(cx, y, gz))
        peak = gz + pk
        if snow:
            B.box(R['snow'], (cx, y + 0.12, peak + 0.03), (0.5 if gable != 'spout' else 0.3, 0.5, 0.1), bevel=0.02)
            if gable == 'neck':
                for sx in (-1, 1):
                    B.box(R['snow'], (cx + sx * 0.3 * w, y + 0.12, gz + 1.03), (0.16 * w, 0.5, 0.08), bevel=0.02)
    # hoisting beam: the cream bar on the gable top, the hook hanging from it
    B.box(R['trim'], (cx, y - 0.22, peak - 0.22), (0.12, 0.66, 0.42), bevel=0.0)
    B.rod(R['hook'], (cx, y - 0.5, peak - 0.4), (cx, y - 0.5, peak - 0.72), 0.025, segs=4)
    B.sphere(R['hook'], (cx, y - 0.5, peak - 0.78), 0.06, subdiv=0)
    # floors of windows; the ground floor has the door on one side
    nf = max(2, int(round((h - 0.5) / 1.3)))
    pitch = (h - 0.55) / nf
    ww, wh = w / 2 - 0.46, min(0.95, pitch - 0.38)
    door_side = rng.choice([-1, 1])
    fy = y - 0.03
    for f in range(nf):
        zc = 0.3 + pitch * f + wh / 2 + 0.18
        for k in (-1, 1):
            wx = cx + k * (w / 4)
            if f == 0 and k == door_side:
                dw = min(0.9, w / 2 - 0.5)
                B.arch(R['trim'], (wx, fy, 0.0), dw + 0.12, 2.0 + 0.12, 0.07)
                B.arch(R['door'], (wx, fy - 0.04, 0.0), dw, 2.0, 0.07)
                B.box(R['trim'], (wx, fy - 0.06, 1.62), (dw - 0.1, 0.03, 0.05), bevel=0.0)
                B.box(R['step'], (wx, fy - 0.25, 0.08), (dw + 0.3, 0.5, 0.16), bevel=0.02)
                B.box(R['step'], (wx, fy - 0.12, 0.24), (dw + 0.16, 0.26, 0.16), bevel=0.02)
                continue
            if night:
                glass = R['window_glow'] if rng.random() < 0.55 else R['glass_dark']
            else:
                glass = R['glass']
            B.box(R['trim'], (wx, fy, zc), (ww + 0.12, 0.08, wh + 0.12), bevel=0.0)
            B.box(glass, (wx, fy - 0.045, zc), (ww, 0.06, wh), bevel=0.0)
            B.box(R['trim'], (wx, fy - 0.085, zc), (0.05, 0.03, wh), bevel=0.0)
            B.box(R['trim'], (wx, fy - 0.085, zc + wh * 0.12), (ww, 0.03, 0.05), bevel=0.0)
            if snow:
                B.box(R['snow'], (wx, fy - 0.1, zc - wh / 2 - 0.08), (ww + 0.16, 0.2, 0.08), bevel=0.02)
            elif flowers and f > 0 and rng.random() < 0.3:
                B.box(R['flower_box'], (wx, fy - 0.16, zc - wh / 2 - 0.12), (ww + 0.06, 0.3, 0.2), bevel=0.02)
                for i, dx in enumerate((-0.3, -0.1, 0.1, 0.3)):
                    B.sphere(R['flower_' + 'abc'[(i + f) % 3]], (wx + dx * ww, fy - 0.2, zc - wh / 2 + 0.06), 0.09, subdiv=0)
    B.done()

def house_row(th, L, walls, R, rng, hmin=4.3, hmax=7.2, night=False, snow=False, flowers=False, y=0.6):
    """A shoulder-to-shoulder row of canal houses exactly one period long (the row starts a little left of x = 0,
    so the seam cuts through a wall and the straddling house is tiled at ± P). Neighbours differ in height."""
    widths = []
    while sum(widths) < P:
        widths.append(rng.uniform(1.9, 3.1))
    s = P / sum(widths)
    widths = [w * s for w in widths]
    x = -rng.uniform(0.6, 1.6)
    hs = []
    last = None
    for i, w in enumerate(widths):
        h = rng.uniform(hmin, hmax)
        if last is not None and abs(h - last) < 0.5:
            h = last + (0.6 if h >= last else -0.6)
            h = min(max(h, hmin), hmax)
        wall = walls[i % len(walls)] if i < len(walls) else rng.choice(walls)
        hs.append((x, w, h, wall))
        x += w
        last = h
    rng.shuffle(walls)
    for i, (x0, w, h, wall) in enumerate(hs):
        canal_house(th, L, f'{L}_house_{i}', x0, w, h, walls[i % len(walls)], R, rng, y=y, night=night, snow=snow, flowers=flowers)

def elm_tree(B, x, y, h, R, rng, kind='leafy'):
    """A quay elm: a tall trunk with two short branches and a tall lumpy crown (two greens); 'bare' is the winter
    tree, branches only, with snow lumps; 'autumn' an orange crown."""
    B.rod(R['trunk'], (x, y, -0.3), (x, y, h * 0.55), 0.14, segs=6, r2=0.1)
    for sx in (-1, 1):
        B.rod(R['trunk'], (x, y, h * 0.42), (x + sx * 0.7, y, h * 0.7), 0.06, segs=5, r2=0.03)
    if kind == 'bare':
        for sx, dz in ((-1, 0.72), (1, 0.78), (-0.4, 0.95), (0.5, 1.0), (0.0, 0.98)):
            B.rod(R['trunk'], (x, y, h * 0.5), (x + sx * 0.9, y, h * dz), 0.05, segs=4, r2=0.02)
            B.sphere(R['snow'], (x + sx * 0.9, y - 0.05, h * dz + 0.04), 0.12, scale=(1.2, 0.8, 0.6), subdiv=0)
        return
    a, b = (R['leaf'], R['leaf2']) if kind == 'leafy' else (R['leaf_autumn'], R['leaf_autumn2'])
    B.sphere(a, (x, y, h * 0.72), h * 0.22, scale=(1.0, 0.75, 1.15), subdiv=1)
    B.sphere(b, (x - h * 0.14, y - 0.1, h * 0.62), h * 0.16, scale=(1.0, 0.75, 1.0), subdiv=1)
    B.sphere(b, (x + h * 0.15, y - 0.1, h * 0.66), h * 0.15, scale=(1.0, 0.75, 1.0), subdiv=1)
    B.sphere(a, (x + h * 0.04, y - 0.15, h * 0.88), h * 0.14, subdiv=1)

def bike(B, x, y, R, rng, facing=1, lean=0.0):
    """A parked city bike facing +X when facing = 1: two dark wheels with lighter hubs, a frame of rods, a
    handlebar and a saddle; about 1.0 m tall. lean tilts it about the ground contact."""
    f = facing
    r = 0.33
    pts = {}
    def pt(px, pz):
        return (x + f * (px * math.cos(lean) - pz * math.sin(lean)), y, px * math.sin(lean) * f + pz * math.cos(lean))
    for wx in (-0.52, 0.52):
        B.disc(R['bike'], pt(wx, r), r, 0.06, segs=12)
        B.disc(R['bike_hub'], (pt(wx, r)[0], y - 0.04, pt(wx, r)[2]), r * 0.55, 0.03, segs=10)
        B.sphere(R['bike'], (pt(wx, r)[0], y - 0.06, pt(wx, r)[2]), 0.045, subdiv=0)
    frame = [((-0.52, r), (-0.1, 0.82)), ((-0.1, 0.82), (0.42, 0.82)), ((0.42, 0.82), (0.52, r)), ((-0.52, r), (0.08, 0.38)), ((0.08, 0.38), (0.42, 0.82)), ((0.08, 0.38), (-0.1, 0.82))]
    for a, b in frame:
        B.rod(R['bike'], pt(*a), pt(*b), 0.028, segs=4)
    B.rod(R['bike'], pt(0.42, 0.82), pt(0.5, 1.02), 0.028, segs=4)
    B.box(R['bike'], pt(0.5, 1.04), (0.3, 0.08, 0.05), bevel=0.0)
    B.rod(R['bike'], pt(-0.1, 0.82), pt(-0.14, 0.98), 0.028, segs=4)
    B.box(R['bike_saddle'], pt(-0.17, 1.02), (0.26, 0.1, 0.07), bevel=0.02)
    B.disc(R['bike'], (pt(0.08, 0.38)[0], y - 0.05, pt(0.08, 0.38)[2]), 0.09, 0.03, segs=8)

def bridge(th, L, name, x, R, rng, span=5.0, rise=1.45, night=False, bikes=3, snow=False):
    """A brick arch bridge whose left end is at x: an arch band (the water shows through beneath), cream railing
    posts and a rail along the arc, bikes leaning on it; lanterns along the rail at night."""
    B = Builder(name, L, th)
    cx = x + span / 2
    Rr = span / 2
    B.band_arch(R['bridge'], (cx, 0.3, -0.05), Rr, rise, 0.4, 1.4)
    B.box(R['bridge'], (cx, 1.0, 0.1), (span + 1.2, 0.2, 0.6), bevel=0.0)
    def top(t):
        a = math.pi * t
        return cx - (Rr + 0.4) * math.cos(a), -0.05 + (rise + 0.4) * math.sin(a)
    rail = []
    for i in range(9):
        px, pz = top(0.06 + 0.88 * i / 8)
        B.rod(R['rail'], (px, 0.25, pz - 0.05), (px, 0.25, pz + 0.95), 0.045, segs=4)
        rail.append((px, 0.25, pz + 0.95))
    B.chain(R['rail'], rail, 0.04, segs=4)
    B.chain(R['rail'], [(px, py, pz - 0.45) for px, py, pz in rail], 0.03, segs=4)
    if snow:
        B.chain(R['snow'], [(px, py - 0.02, pz + 0.07) for px, py, pz in rail], 0.05, segs=4)
    if night:
        for i in range(1, 8, 2):
            px, py, pz = rail[i]
            B.rod(R['hook'], (px, py, pz), (px, py, pz + 0.3), 0.025, segs=4)
            B.box(R['lantern_glow'], (px, py, pz + 0.48), (0.26, 0.26, 0.3), bevel=0.0)
            B.box(R['hook'], (px, py, pz + 0.66), (0.34, 0.34, 0.06), bevel=0.0)
    for k in range(bikes):
        t = 0.2 + 0.6 * (k + rng.uniform(0.2, 0.8)) / bikes
        px, pz = top(t)
        bike(B, px, 0.0, R, rng, facing=rng.choice([-1, 1]), lean=0.0)
    B.done()

def houseboat(th, L, name, x, R, hull, rng, length=5.5, snow=False, night=False):
    """A houseboat with its left end at x: a dark hull low in the water, a cream cabin with pale windows and a red
    roof strip, flower pots and a stovepipe on the roof."""
    B = Builder(name, L, th)
    W = 1.9
    cx = x + length / 2
    B.slab(hull, [(0.0, -0.55), (length, -0.55), (length + 0.3, 0.35), (-0.3, 0.35)], W, at=(x, -W / 2, 0.0))
    B.box(R['boat_trim'], (cx, 0.0, 0.4), (length + 0.66, W + 0.06, 0.1), bevel=0.0)
    B.box(R['boat_cabin'], (cx, 0.05, 0.45 + 0.7), (length - 1.0, W - 0.3, 1.4), bevel=0.03)
    n = max(2, int((length - 1.6) / 1.1))
    for k in range(n):
        wx = x + 0.8 + (k + 0.5) * (length - 1.6) / n
        glass = (R['window_glow'] if rng.random() < 0.6 else R['glass_dark']) if night else R['boat_glass']
        B.box(R['boat_trim'], (wx, 0.05 - (W - 0.3) / 2 - 0.02, 1.25), (0.74, 0.06, 0.64), bevel=0.0)
        B.box(glass, (wx, 0.05 - (W - 0.3) / 2 - 0.05, 1.25), (0.62, 0.06, 0.52), bevel=0.0)
    B.box(R['boat_roof'], (cx, 0.05, 1.92), (length - 0.7, W - 0.1, 0.16), bevel=0.03)
    B.rod(R['hook'], (x + length - 1.1, 0.0, 1.9), (x + length - 1.1, 0.0, 2.45), 0.06, segs=6)
    if snow:
        B.box(R['snow'], (cx, 0.05, 2.08), (length - 0.6, W, 0.18), bevel=0.05)
    else:
        for k in range(3):
            px = x + 1.0 + k * (length - 2.4) / 2
            B.lathe(R['pot'], [(0.14, 0.0), (0.2, 0.34)], 6, at=(px, -0.5, 2.0), cap_bottom=True)
            for i, (dx, dz) in enumerate(((-0.12, 0.44), (0.1, 0.5), (0.0, 0.6))):
                B.sphere(R['flower_' + 'abc'[(i + k) % 3]], (px + dx, -0.55, 2.0 + dz), 0.11, subdiv=0)
    B.done()

def duck(B, x, y, R, facing=1, z=0.0):
    f = facing
    B.sphere(R['duck'], (x, y, z + 0.14), 0.2, scale=(1.3, 0.8, 0.7), subdiv=1)
    B.sphere(R['duck'], (x + f * 0.2, y, z + 0.38), 0.13, subdiv=1)
    B.lathe(R['beak'], [(0.055, 0.0), (0.0, 0.16)], 5, at=(x + f * 0.3, y, z + 0.36), rot=(0, f * math.pi / 2, 0))
    B.sphere(R['hook'], (x + f * 0.24, y - 0.1, z + 0.42), 0.025, subdiv=0)

def bollard(B, x, y, R):
    B.lathe(R['bollard'], [(0.16, -0.3), (0.14, 0.5), (0.18, 0.56), (0.18, 0.68), (0.0, 0.76)], 8, at=(x, y, 0.0), cap_bottom=True)

def ripples(B, rng, role, n, zmin, zmax, y, wmin=0.5, wmax=1.5):
    for i in range(n):
        x, z, w = rng.uniform(0, P), -rng.uniform(zmin, zmax), rng.uniform(wmin, wmax)
        for dx in wraps(x, w / 2):
            B.box(role, (x + dx, y, z), (w, 0.05, 0.07), bevel=0.0)

def canal_layer(th, L, R, rng, hulls, night=False, snow=False):
    """The canal (shared by nl_canals and nl_rush): water from z = 0 down to -16 m, ripple strokes, bridges at
    200/1024 and 700/1024 of the period, houseboats moored between them, bollards and ducks."""
    strip_box(th, L, f'{L}_water', R['water'], 0.0, -16.0, 1.0, 6.0)
    B = Builder(f'{L}_ripples', L, th)
    ripples(B, rng, R['water_light'], 40, 0.25, 2.6, 0.97)
    ripples(B, rng, R['water_dark'], 16, 0.4, 2.2, 0.97, 0.8, 2.0)
    B.done(period=None)
    bx = [P * 200 / 1024, P * 700 / 1024]
    for i, x in enumerate(bx):
        bridge(th, L, f'{L}_bridge_{i}', x, R, rng, night=night, bikes=rng.randint(2, 4), snow=snow)
    slots = [(bx[0] + 6.0, bx[1] - 1.0), (bx[1] + 6.0, bx[0] + P - 1.0)]
    i = 0
    for a, b in slots:
        x = a + rng.uniform(0.0, 1.2)
        while x + 5.0 < b:
            ln = rng.uniform(4.6, 6.4)
            if x + ln > b:
                break
            houseboat(th, L, f'{L}_boat_{i}', x % P, R, hulls[i % len(hulls)], rng, length=ln, snow=snow, night=night)
            i += 1
            x += ln + rng.uniform(1.6, 3.2)
    B = Builder(f'{L}_quay_bits', L, th)
    for x in jittered(rng, 7, 0.3):
        bollard(B, x, -1.0, R)
    for x, f in ((bx[0] - 2.5, 1), (bx[1] + 7.5, -1)):
        duck(B, x % P, -0.6, R, facing=f)
        duck(B, (x + f * 0.9) % P, -0.4, R, facing=f)
    B.done(period=None)

def pavement(th, L, R, rng, lane=False, snow=False):
    """The pavement in front of the houses (its top at the ground line) over the brick quay wall below it."""
    strip_box(th, L, f'{L}_quay', R['quay'], -0.16, -3.2, -1.4, 0.6)
    strip_box(th, L, f'{L}_pave', R['pave'], 0.0, -0.16, -1.4, 0.6)
    if lane:
        strip_box(th, L, f'{L}_lane', R['lane'], 0.02, -0.14, -1.4, -0.25)
        B = Builder(f'{L}_lane_marks', L, th)
        x = rng.uniform(0, 1.5)
        while x < P:
            B.box(R['lane_mark'], (x, -0.3, 0.03), (0.7, 0.06, 0.03), bevel=0.0)
            x += 1.6
        B.done(period=None)
    if snow:
        B = Builder(f'{L}_snow_edge', L, th)
        for x in jittered(rng, 12, 0.4):
            for dx in wraps(x, 0.9):
                B.sphere(R['snow'], (x + dx, -0.9, 0.0), 0.5, scale=(1.6, 0.9, 0.36), subdiv=1)
        B.done(period=None)

# ---------------------------------------------------------------------------------------------- preview renderer
FRAME_H = P * RES[1] / RES[0]

def z_center_for_row(row):
    """Camera z that puts the layer's ground line (z = 0) on pixel row `row` from the top of the strip."""
    return row * FRAME_H / RES[1] - FRAME_H / 2

def setup_render(scene, look):
    import lookkit as LK
    LK.setup_render('BLENDER_EEVEE', samples=24)
    LK.lights(look if look != 'plain' else 'toon', key_dir=(0.35, -0.75, 0.9))
    cam = LK.ortho_camera(P / 2, 0.0, P, FRAME_H, RES[0], RES[1], name='sprite_cam', y=-30.0)
    cam.data.ortho_scale = P
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
    """Stack the layer renders far -> near over the theme's sky gradient, the way the engine does; with a ground
    strip (rendered at 1x) the floor is tiled across from `floor_row` down, so the preview shows what the floor hides."""
    import numpy as np
    base = None
    for layer in th.LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            base = sky_gradient(px.shape[0], px.shape[1], th.SKY)
        over(base, px)
    if ground_path:
        g = load_pixels(ground_path)
        gh, gw = g.shape[:2]
        h, w = base.shape[:2]
        reps = int(math.ceil(w / gw))
        strip = np.concatenate([g] * reps, axis=1)[:, :w]
        top = h - floor_row
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
    h, w = px.shape[:2]
    out = np.zeros((h, w * 2, 4), dtype=np.float32)
    for row in range(3):
        for col in range(16):
            src = rng.randrange(8)
            out[row * t:(row + 1) * t, col * t:(col + 1) * t] = px[row * t:(row + 1) * t, src * t:(src + 1) * t]
    save_pixels(out_path, out)

def preview(th, build, build_ground, argv=None, floor_row=330):
    """Main-guard body shared by the Amsterdam themes: build, apply the look (LOOK=toon by default, 'plain' for the
    raw preview), render every layer, a composite over the sky, a scene composite with the floor tiled in, seam
    checks, the floor strip and a shuffled-tile floor preview into the scratch folder; save the .blend."""
    seed = 1
    argv = sys.argv if argv is None else argv
    for i, a in enumerate(argv):
        if a == '--seed' and i + 1 < len(argv):
            seed = int(argv[i + 1])
    look = os.environ.get('LOOK', 'toon')
    os.makedirs(SCRATCH, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    cols = build(seed)
    print('triangles:', th.triangle_count(), {l: th.triangle_count([l]) for l in th.LAYERS})
    cam = setup_render(scene, look)
    import lookkit as LK
    if look != 'plain':
        LK.apply_look(look, [o for c in cols.values() for o in c.all_objects], outline_px=0.9)
    tag = '' if look == 'toon' else f'_{look}'
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
    if look != 'plain':
        LK.apply_look(look, list(gcol.all_objects), outline_px=0.9)
    gp = os.path.join(SCRATCH, f'{th.module}_ground{tag}.png')
    render_ground(th, scene, cam, gp)
    g1 = os.path.join(SCRATCH, f'{th.module}_ground_1x{tag}.png')
    render_ground(th, scene, cam, g1, scale=1)
    shuffled_ground(gp, os.path.join(SCRATCH, f'{th.module}_ground_shuffled{tag}.png'), random.Random(seed + 7))
    composite(th, paths, os.path.join(SCRATCH, f'{th.module}_scene{tag}.png'), ground_path=g1, floor_row=floor_row)
    print('ground', gp)
    for c in th.COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{th.module}{tag}.blend'))

# =============================================================================================== nl_canals
GABLE = ['#7a3a2a', '#3a4a5a', '#5a2a2a', '#2a3a2a', '#8a6a4a', '#4a3a5a']
PALETTE = {
    # L0 canal houses (#7a3a2a)
    **{f'canals_wall{i}': c for i, c in enumerate(GABLE)},
    'canals_trim': '#dcd4c4', 'canals_glass': '#a4bcd2', 'canals_door': '#1e3a3a', 'canals_step': '#9a9aa2', 'canals_hook': '#2e2e38',
    'canals_pave': '#aeaeb6', 'canals_quay': '#8a4636', 'canals_flower_box': '#6a4a2a',
    'canals_flower_a': '#e8322a', 'canals_flower_b': '#ffd23a', 'canals_flower_c': '#ff6ab8',
    'canals_trunk': '#5a4030', 'canals_leaf': '#4a9a4a', 'canals_leaf2': '#3a8438',
    # L1 the canal (#4a7a7a)
    'canals_water': '#4a7a7a', 'canals_water_light': '#8cbcb6', 'canals_water_dark': '#365e5e',
    'canals_bridge': '#7a4a3a', 'canals_rail': '#f2ece0',
    'canals_hull_a': '#2a5a3a', 'canals_hull_b': '#2a3a6a', 'canals_hull_c': '#6a2a2a',
    'canals_boat_cabin': '#b8b2a2', 'canals_boat_trim': '#c8c2b2', 'canals_boat_glass': '#5a8aa8', 'canals_boat_roof': '#4a6a66', 'canals_pot': '#b85a3a',
    'canals_bollard': '#2a2a30', 'canals_bike': '#1e1e26', 'canals_bike_hub': '#9a9aa2', 'canals_bike_saddle': '#6a4a2a',
    'canals_duck': '#ffffff', 'canals_beak': '#ff9a1a',
    # ground (brick)
    'canals_g_cap': '#8a8a90', 'canals_g_cap_hi': '#b8b8c0', 'canals_g_mortar': '#d8c8b8',
    'canals_g_brick_a': '#a8483a', 'canals_g_brick_b': '#8a3a2a', 'canals_g_brick_c': '#9a4a32', 'canals_g_brick_d': '#6e2c20',
}
TH = Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def roles(prefix, **extra):
    """Role names for the shared builders, '<prefix>_<role>'; extra maps a role to a different suffix."""
    names = ['trim', 'glass', 'glass_dark', 'window_glow', 'door', 'step', 'hook', 'snow', 'flower_box', 'flower_a', 'flower_b', 'flower_c',
             'trunk', 'leaf', 'leaf2', 'leaf_autumn', 'leaf_autumn2', 'pave', 'quay', 'lane', 'lane_mark',
             'water', 'water_light', 'water_dark', 'bridge', 'rail', 'lantern_glow', 'boat_cabin', 'boat_trim', 'boat_glass', 'boat_roof', 'pot',
             'bollard', 'bike', 'bike_hub', 'bike_saddle', 'duck', 'beak']
    R = {n: f'{prefix}_{n}' for n in names}
    R.update({k: f'{prefix}_{v}' for k, v in extra.items()})
    return R

R_CANALS = roles('canals')

def build_L0(rng):
    L = 'L0'
    pavement(TH, L, R_CANALS, rng)
    house_row(TH, L, [f'canals_wall{i}' for i in range(6)], R_CANALS, rng, flowers=True)
    B = Builder('L0_trees', L, TH)
    for x in jittered(rng, 3, 0.25):
        for dx in wraps(x, 1.6):
            elm_tree(B, x + dx, -0.9, rng.uniform(5.6, 6.8), R_CANALS, rng)
    B.done(period=None)
    B = Builder('L0_bikes', L, TH)
    for x in jittered(rng, 5, 0.4):
        for dx in wraps(x, 0.7):
            bike(B, x + dx, -0.6, R_CANALS, rng, facing=rng.choice([-1, 1]))
    B.done(period=None)

def build_L1(rng):
    canal_layer(TH, 'L1', R_CANALS, rng, ['canals_hull_a', 'canals_hull_b', 'canals_hull_c'])

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
    """Brick floor (grey kerb cap over red bricks on light mortar), tile-aligned, period GP; collection 'ground'."""
    return brick_ground(TH, random.Random(seed), {'cap': 'canals_g_cap', 'cap_hi': 'canals_g_cap_hi', 'mortar': 'canals_g_mortar',
                                                  'brick_a': 'canals_g_brick_a', 'brick_b': 'canals_g_brick_b', 'brick_c': 'canals_g_brick_c', 'brick_d': 'canals_g_brick_d'})

def clear():
    TH.clear()

if __name__ == '__main__':
    preview(TH, build, build_ground)
