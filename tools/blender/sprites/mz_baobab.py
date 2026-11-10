# Mozambique 4-3 "The Great Baobab": the parallax background as a low-poly toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the savanna seen from the great tree, with
# its colossal sibling on the plain.
#
#   L0  far savanna (base 340, the only layer): rolling golden hills, the great baobab (a huge bottle trunk with a
#       crown of crooked branches and hanging fruit) at a third of the period, smaller baobabs and umbrella acacias,
#       termite spires, a waterhole with a lone elephant, grass tufts
#   ground: the engine's 'grass' floor in Gorongosa's colours (golden turf cap over red earth with embedded stones)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named '<MODULE>_<role>'; every object carries
# obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer (px from the top of
# the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mz_baobab.py
# (builds, then renders each layer + composite previews + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mz_baobab'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0']
BASES = {'L0': 340}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#3a9ae8', '#a8d8ff', '#fff4d8']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mzbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
# colour roles; the Blender material is named '<MODULE>_<role>' so the five Mozambique themes never clash.
# Roles whose name contains 'glow' render unlit (the look kit makes them emissive).
PALETTE = {
    'far_range': '#c4b4c8', 'far_massif': '#ab9eb8',
    'sav_plain': '#c89a4a', 'sav_hill': '#d6a85a', 'sav_hill2': '#c08e42', 'sav_trunk': '#6e4e26', 'sav_crown': '#8a7030',
    'sav_eleph': '#8a6a50', 'sav_tusk': '#f0e6d0', 'sav_mound': '#b4763a', 'sav_grass': '#e0b85c',
    'great_trunk': '#7a5830', 'great_fruit': '#a89a68', 'water': '#5ab0b8', 'water_hi': '#a8e0e4', 'water_rim': '#a0783a',
    'g_cap': '#c8b44a', 'g_cap_hi': '#e8d878', 'g_dirt': '#b8603a', 'g_dirt2': '#8a3a24', 'g_rock': '#c8784a',
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

# ----------------------------------------------------------------------------------------------- savanna shapes
def hill(L, name, x, y, R, h, role, segs=10, yscale=0.3, rng=None):
    """A low, wide dome for the rolling horizon."""
    prof = [(R * math.cos(t * math.pi / 2), h * math.sin(t * math.pi / 2)) for t in (0, 0.35, 0.65, 0.88, 1.0)]
    Builder(name, L).lathe(role, prof, segs, at=(x, y, 0), yscale=yscale, smooth=False, phase=(rng.uniform(0, 1) if rng else 0)).done()

def acacia(B, x, y, h, trunk, crown, rng, lean=None):
    """A flat-topped umbrella thorn: a slim forked trunk under a wide, thin, lumpy crown."""
    R, c = h * 0.62, h * 0.2
    lean = rng.uniform(-0.12, 0.12) if lean is None else lean
    top = h - c
    B.rod(trunk, (x, y, -0.1), (x + lean * h * 0.5, y, top * 0.62), 0.045 * h, segs=5, r2=0.03 * h)
    fx = x + lean * h * 0.5
    for sx in (-0.42, 0.38):
        B.rod(trunk, (fx, y, top * 0.6), (fx + sx * R, y, top + c * 0.4), 0.026 * h, segs=4, r2=0.014 * h)
    B.rod(trunk, (fx, y, top * 0.6), (fx + 0.05 * R, y, top + c * 0.5), 0.022 * h, segs=4, r2=0.012 * h)
    prof = [(0.2 * R, 0.0), (0.82 * R, 0.22 * c), (R, 0.52 * c), (0.78 * R, 0.84 * c), (0.0, c)]
    B.lathe(crown, prof, 9, at=(fx + 0.04 * R, y, top), yscale=0.45, phase=rng.uniform(0, TAU), cap_bottom=True)
    # a second, smaller lobe to break the ellipse
    side = rng.choice((-1, 1))
    B.lathe(crown, [(0.15 * R, 0.0), (0.42 * R, 0.3 * c), (0.36 * R, 0.8 * c), (0.0, 1.05 * c)], 7,
            at=(fx + side * 0.62 * R, y - 0.05, top + 0.12 * c), yscale=0.45, phase=rng.uniform(0, TAU), cap_bottom=True)

def baobab(B, x, y, h, trunk, rng, fruit=None):
    """A bottle-trunked baobab: a fat tapering trunk, a root flare, and a crown of short crooked branches."""
    prof = [(0.17 * h, -0.05 * h), (0.19 * h, 0.06 * h), (0.165 * h, 0.32 * h), (0.13 * h, 0.58 * h), (0.105 * h, 0.76 * h), (0.075 * h, 0.82 * h)]
    B.lathe(trunk, prof, 9, at=(x, y, 0.0), yscale=0.7, phase=rng.uniform(0, TAU), cap_bottom=True)
    B.sphere(trunk, (x, y, 0.0), 0.2 * h, scale=(1.35, 0.7, 0.3), subdiv=1)
    for k in range(-3, 4):
        base = Vector((x + k * 0.018 * h, y + (k % 2) * 0.03 * h - 0.015 * h, 0.8 * h))
        mid = Vector((x + k * 0.085 * h, base.y, h * (0.93 + (abs(k) % 2) * 0.04)))
        tip = Vector((x + k * 0.125 * h + rng.uniform(-0.01, 0.01) * h, base.y, h * (0.99 + rng.uniform(-0.02, 0.02))))
        B.rod(trunk, base, mid, 0.03 * h, segs=5, r2=0.018 * h)
        B.rod(trunk, mid, tip, 0.018 * h, segs=4, r2=0.008 * h)
        B.sphere(trunk, mid, 0.02 * h, subdiv=0)
        if k % 2:
            twig = Vector((mid.x - k * 0.03 * h, mid.y, mid.z + 0.05 * h))
            B.rod(trunk, mid, twig, 0.012 * h, segs=4, r2=0.006 * h)
        if fruit and rng.random() < 0.7:
            B.sphere(fruit, (tip.x, tip.y, tip.z - 0.045 * h), 0.016 * h, scale=(0.8, 0.8, 1.3), subdiv=0)

def elephant(B, x, y, s, role, rng, facing=1):
    """A distant elephant as a chunky silhouette, `s` metres at the shoulder, facing +X when facing = 1."""
    f = facing
    B.sphere(role, (x, y, 0.7 * s), 0.5 * s, scale=(1.15, 0.6, 0.62), subdiv=1)                            # body
    B.sphere(role, (x + f * 0.36 * s, y, 0.78 * s), 0.3 * s, scale=(0.9, 0.6, 0.72), subdiv=1)            # shoulders / domed back
    B.sphere(role, (x + f * 0.66 * s, y, 0.76 * s), 0.21 * s, scale=(1.0, 0.8, 1.05), subdiv=1)           # head
    B.sphere(role, (x + f * 0.5 * s, y - 0.1 * s, 0.72 * s), 0.19 * s, scale=(0.7, 0.3, 1.0), subdiv=1)    # ear
    # trunk: two rods curling down and forward
    p0 = Vector((x + f * 0.82 * s, y, 0.68 * s)); p1 = Vector((x + f * 0.96 * s, y, 0.38 * s)); p2 = Vector((x + f * 0.9 * s, y, 0.05 * s))
    B.rod(role, p0, p1, 0.06 * s, segs=5, r2=0.045 * s); B.sphere(role, p1, 0.045 * s, subdiv=0)
    B.rod(role, p1, p2, 0.045 * s, segs=5, r2=0.028 * s)
    for lx in (-0.4, -0.2, 0.18, 0.38):
        B.rod(role, (x + f * lx * s, y + (0.1 if lx in (-0.2, 0.18) else -0.1) * s, 0.0), (x + f * lx * s, y, 0.52 * s), 0.07 * s, segs=5)
    B.rod(role, (x - f * 0.55 * s, y, 0.8 * s), (x - f * 0.64 * s, y, 0.42 * s), 0.022 * s, segs=4, r2=0.01 * s)   # tail
    B.rod('sav_tusk', (x + f * 0.76 * s, y - 0.07 * s, 0.62 * s), (x + f * 0.92 * s, y - 0.07 * s, 0.52 * s), 0.02 * s, segs=4, r2=0.008 * s)

def mound(B, x, y, h, role, rng):
    """A termite mound: a tall lumpy spire of red earth."""
    prof = [(0.42 * h, -0.05 * h), (0.34 * h, 0.3 * h), (0.22 * h, 0.62 * h), (0.11 * h, 0.9 * h), (0.0, h)]
    B.lathe(role, prof, 7, at=(x, y, 0.0), yscale=0.75, phase=rng.uniform(0, TAU), cap_bottom=True)
    B.lathe(role, [(0.14 * h, 0.0), (0.06 * h, 0.3 * h), (0.0, 0.42 * h)], 5, at=(x + 0.26 * h, y - 0.05, 0.45 * h), rot=(0, 0.5, 0), cap_bottom=True)

def tuft(B, x, y, z, s, role, rng):
    """A clump of dry grass: three leaning blades."""
    for k, lean in enumerate((-0.45, 0.05, 0.5)):
        B.lathe(role, [(0.07 * s, 0.0), (0.0, s * rng.uniform(0.8, 1.1))], 4, at=(x + lean * 0.12 * s, y + 0.02 * k, z), rot=(0, lean, 0), cap_bottom=True)

# ----------------------------------------------------------------------------------------------- L0: the plain
def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'sav_plain', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    # the far horizon: a hazy blue-violet massif (the plain's mountain) and a paler range behind it, exactly periodic
    for k, (y, zmin, zmax, role, harm) in enumerate(((5.8, 1.2, 3.2, 'far_range', 4), (5.2, 0.4, 2.1, 'far_massif', 3))):
        terms = [(rng.uniform(0.4, 1.0) / n, n, rng.uniform(0, TAU)) for n in range(1, harm + 1)]
        raw = lambda x, terms=terms: sum(a * math.sin(TAU * c * x / P + ph) for a, c, ph in terms)
        smp = [raw(P * i / 256) for i in range(256)]; lo, hi = min(smp), max(smp)
        zf = lambda x, raw=raw, lo=lo, hi=hi, zmin=zmin, zmax=zmax: zmin + (zmax - zmin) * (raw(x) - lo) / (hi - lo)
        xs = [-0.6 + (P + 1.2) * i / 120 for i in range(121)]
        Builder(f'L0_far_{k}', L).slab(role, [(xs[0], -0.5), (xs[-1], -0.5)] + [(x, zf(x)) for x in reversed(xs)], 0.4, at=(0, y, 0)).done(period=None)
    for i in range(6):
        hill(L, f'L0_hill_{i}', i * P / 6 + rng.uniform(0, 3), 4.2 - (i % 2) * 1.3, rng.uniform(5.5, 8.5), rng.uniform(0.6, 1.1), 'sav_hill' if i % 2 == 0 else 'sav_hill2', yscale=0.25, rng=rng)
    # the great baobab: 6.2 m, so its crown stays inside the strip above base 340
    gx = P * 0.34
    B = Builder('L0_great_baobab', L)
    baobab(B, gx, 1.0, 6.2, 'great_trunk', rng, fruit='great_fruit')
    B.done()
    # a waterhole with a lone elephant drinking, two thirds along
    wx = P * 0.72
    B = Builder('L0_waterhole', L)
    B.lathe('water_rim', [(3.6, -0.2), (3.4, 0.05), (3.0, 0.08)], 10, at=(wx, 1.2, 0), yscale=0.28, phase=0.2)
    B.lathe('water', [(3.0, 0.0), (3.0, 0.1)], 10, at=(wx, 1.2, 0), yscale=0.28, phase=0.2, cap_top=True)
    for k in range(5):
        B.box('water_hi', (wx + rng.uniform(-2.2, 2.2), 1.0, 0.11), (rng.uniform(0.4, 0.9), 0.04, 0.05), bevel=0.0)
    elephant(B, wx - 3.4, 1.6, 1.7, 'sav_eleph', rng, facing=1)
    B.done()
    B = Builder('L0_trees', L)
    for x, kind, h in ((2.5, 'acacia', 2.4), (7.5, 'baobab', 3.6), (17.5, 'acacia', 2.6), (21.5, 'baobab', 3.2), (31.0, 'acacia', 2.3), (34.5, 'baobab', 3.8)):
        x += rng.uniform(-0.8, 0.8)
        if kind == 'acacia':
            acacia(B, x, rng.choice((0.6, 1.8)), h * rng.uniform(0.92, 1.08), 'sav_trunk', 'sav_crown', rng)
        else:
            baobab(B, x, rng.choice((0.8, 2.0)), h * rng.uniform(0.92, 1.08), 'sav_trunk', rng)
    B.done()
    B = Builder('L0_bushes', L)
    for x in (4.5, 10.5, 16.0, 25.5, 29.5, 35.5):
        x += rng.uniform(-1.0, 1.0)
        for dx in wraps(x, 1.0):
            for k, (bx, bz, br) in enumerate(((-0.4, 0.3, 0.42), (0.35, 0.28, 0.38), (0.0, 0.5, 0.4))):
                B.sphere('sav_crown', (x + dx + bx, rng.choice((0.5, 1.5)), bz), br, scale=(1.3, 0.8, 0.8), subdiv=1)
    for x in (12.5, 26.0):
        acacia(B, x + rng.uniform(-1.0, 1.0), 3.0, rng.uniform(1.5, 1.9), 'sav_trunk', 'sav_crown', rng)
    B.done(period=None)
    B = Builder('L0_mounds', L)
    for x in (5.0, 15.0, 28.5):
        mound(B, x + rng.uniform(-1.0, 1.0), rng.uniform(-0.6, 0.4), rng.uniform(0.9, 1.5), 'sav_mound', rng)
    B.done()
    B = Builder('L0_tufts', L)
    for i in range(36):
        tuft(B, rng.uniform(0, P), rng.uniform(-1.6, 1.6), -0.02, rng.uniform(0.3, 0.55), 'sav_grass', rng)
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
