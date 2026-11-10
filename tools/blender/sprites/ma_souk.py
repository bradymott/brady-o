# Morocco 5-1 "Souk Spice Maze": the parallax background as a low-poly toon diorama, one Collection per parallax
# layer, for the pre-rendered 2D sprite pipeline. Original art: a sun-baked medina under the High Atlas, and the
# covered souk lane with its rugs, lanterns and spice stalls.
#
#   L0  maAtlas (blur, base 300): faceted lavender-grey peaks with snow caps over a hazy plain
#   L1  maMedina (base 300): ochre rooftops, two rows of flat-roofed houses stepping up in depth, arched doors,
#       zellige-blue windows, rooftop pots and laundry; the minaret far off as a plain silhouette (no detail)
#   L2  maMedina (base 352): the souk lane: warmer walls with mashrabiya windows, striped awnings on poles,
#       hanging rugs, a wire of brass lanterns, spice cones and sacks, pots stacked along the ground
#   ground: the engine's 'grass' floor in the souk's colours (packed ochre earth cap over red clay with stones)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named '<MODULE>_<role>'; every object carries
# obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer (px from the top of
# the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ma_souk.py
# (builds, then renders each layer + composite previews + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'ma_souk'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 300, 'L2': 352}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#3a8ae8', '#9ad0ff', '#fff0d8']    # the theme's sky gradient (preview composite only)
SCRATCH = os.environ.get('SCRATCH', '/tmp/brady-sprites/mabg')
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
# colour roles; the Blender material is named '<MODULE>_<role>' so the five Morocco themes never clash.
# Roles whose name contains 'glow' render unlit (the look kit makes them emissive).
PALETTE = {
    # L0: the High Atlas, hazy
    'mtn_far': '#b4b4d0', 'mtn_mid': '#a8a8c8', 'mtn_dark': '#9696b8', 'mtn_snow': '#f6f8ff', 'mtn_plain': '#a4a4c4',
    # L1: the medina
    'wall': '#e8b088', 'wall2': '#e0a67c', 'wall3': '#f0bc98', 'parapet': '#f4c8a4', 'wall_shade': '#d09468',
    'door': '#7a4a34', 'win_blue': '#1a6ab8', 'win_teal': '#1a9a8a', 'win_frame': '#f4ecd8',
    'minaret': '#dca480', 'minaret_band': '#1a9a8a', 'minaret_gold': '#c8a03a',
    'pot': '#c8603a', 'pot_blue': '#1a6ab8', 'laundry_a': '#f4e8d0', 'laundry_b': '#1a6ab8', 'laundry_c': '#c8323a', 'line': '#6a4a3a',
    'plain1': '#dca478',
    # L2: the souk lane
    'nwall': '#d8946a', 'nwall2': '#cc8a60', 'nwall3': '#e09e74', 'ndoor': '#6a3e2c', 'lattice': '#f4e8d0', 'lattice_dark': '#4a2a1c',
    'rug_red': '#b8222a', 'rug_gold': '#e8a02a', 'rug_blue': '#2a4a9a', 'rug_cream': '#f4e8d0',
    'awn_red': '#c8323a', 'awn_cream': '#f4e8d0', 'awn_green': '#1a8a6a', 'awn_blue': '#1a6ab8', 'pole': '#6a4a2a',
    'brass': '#c8a03a', 'pane': '#ffd890', 'wire': '#4a3a2a',
    'spice_red': '#c8322a', 'spice_yellow': '#e8b81a', 'spice_brown': '#8a4a1a', 'spice_green': '#2a8a3a', 'sack': '#e8d8b8', 'sack_dark': '#c8b490',
    'npot': '#c8603a', 'npot_blue': '#1a6ab8', 'npot_teal': '#1a9a8a', 'plain2': '#c8805a',
    # ground (engine 'grass' style in the souk's colours)
    'g_cap': '#d8a070', 'g_cap_hi': '#f0c890', 'g_dirt': '#c87a4a', 'g_dirt2': '#9a5a32', 'g_rock': '#d88a5a',
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
    B.box(role, (P / 2, y, (top + bottom) / 2), (P + 2.0, depth, top - bottom), bevel=0.0)   # past both edges: no outline at the seam
    return B.done(period=None)


# ----------------------------------------------------------------------------------------------- morocco shapes
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

def hs_arch(B, role, at, w, h, depth, segs=10, rot=None):
    """A horseshoe arch opening: bottom centre at `at`, `w` wide at the jambs, `h` tall; the arc bulges past the jambs."""
    r = w / 2 * 1.12
    cz = h - r * 0.96
    a0, a1 = math.radians(-18), math.radians(198)
    pts = [(-w / 2, 0.0), (w / 2, 0.0)]
    for i in range(segs + 1):
        a = a0 + (a1 - a0) * i / segs
        pts.append((r * math.cos(a), cz + r * math.sin(a)))
    return B.slab(role, pts, depth, at, rot)

def lantern(B, x, y, z, s, body, pane, wire=None):
    """A brass souk lantern hanging from `z` (its hook): a six-sided belly, a pointed top, a wire above."""
    if wire:
        B.rod(wire, (x, y, z + 0.3 * s), (x, y, z), 0.012, segs=4)
    prof = [(0.0, -1.0 * s), (0.14 * s, -0.92 * s), (0.3 * s, -0.7 * s), (0.3 * s, -0.36 * s), (0.16 * s, -0.16 * s), (0.08 * s, -0.08 * s), (0.0, 0.0)]
    B.lathe(pane, prof, 6, at=(x, y, z), cap_bottom=True)
    B.lathe(body, [(0.1 * s, -0.2 * s), (0.2 * s, -0.08 * s), (0.0, 0.02 * s)], 6, at=(x, y, z), cap_bottom=True)
    B.lathe(body, [(0.0, -1.06 * s), (0.17 * s, -0.86 * s), (0.17 * s, -0.8 * s)], 6, at=(x, y, z), cap_top=True)
    for k in range(3):
        a = TAU * (k + 0.5) / 6 - TAU / 4
        B.box(body, (x + 0.29 * s * math.cos(a), y + 0.29 * s * math.sin(a), z - 0.53 * s), (0.04 * s + 0.03, 0.04 * s + 0.03, 0.4 * s), bevel=0.0)

def rug(B, x, y, z, w, h, main, border, motif):
    """A hanging rug: a thick woven panel with a pale border, a central diamond and a row of small diamonds."""
    B.box(main, (x, y, z - h / 2), (w, 0.1, h), bevel=0.0)
    t = 0.09
    for (bx, bz, bw, bh) in ((0, h / 2 - t / 2, w, t), (0, -h / 2 + t / 2, w, t), (-w / 2 + t / 2, 0, t, h), (w / 2 - t / 2, 0, t, h)):
        B.box(border, (x + bx, y - 0.055, z - h / 2 + bz), (bw, 0.02, bh), bevel=0.0)
    d = min(w, h) * 0.26
    B.box(motif, (x, y - 0.055, z - h / 2), (d, 0.02, d), bevel=0.0, rot=(0, TAU / 8, 0))
    B.box(border, (x, y - 0.065, z - h / 2), (d * 0.42, 0.02, d * 0.42), bevel=0.0, rot=(0, TAU / 8, 0))
    for k in (-1, 1):
        B.box(motif, (x + k * w * 0.3, y - 0.055, z - h * 0.72), (0.14, 0.02, 0.14), bevel=0.0, rot=(0, TAU / 8, 0))
        B.box(motif, (x + k * w * 0.3, y - 0.055, z - h * 0.28), (0.14, 0.02, 0.14), bevel=0.0, rot=(0, TAU / 8, 0))
    for k in range(int(w / 0.18)):
        B.rod(border, (x - w / 2 + (k + 0.5) * w / int(w / 0.18), y - 0.02, z - h), (x - w / 2 + (k + 0.5) * w / int(w / 0.18), y - 0.02, z - h - 0.13), 0.025, segs=4)

def awning(B, x, y, z, w, roles, pole, depth=1.5, tilt=0.42, n=None):
    """A striped cloth canopy projecting from a wall toward the player, sloping down, two poles holding its front."""
    n = n or max(3, int(w / 0.45))
    sw = w / n
    rot = (tilt, 0, 0)
    c, s = math.cos(tilt), math.sin(tilt)
    for k in range(n):
        B.box(roles[k % len(roles)], (x - w / 2 + (k + 0.5) * sw, y - depth / 2 * c, z - depth / 2 * s), (sw + 0.012, depth, 0.08), bevel=0.0, rot=rot)
    # a scalloped valance along the front edge
    fy, fz = y - depth * c, z - depth * s
    m = int(w / 0.3)
    for k in range(m):
        B.sphere(roles[(k + 1) % len(roles)], (x - w / 2 + (k + 0.5) * w / m, fy, fz - 0.06), 0.15, scale=(1.0, 0.4, 0.8), subdiv=1)
    for sx in (-w / 2 + 0.15, w / 2 - 0.15):
        B.rod(pole, (x + sx, fy + 0.05, -0.2), (x + sx, fy + 0.05, fz + 0.02), 0.045, segs=5)

def pot(B, x, y, z, s, role, kind=0):
    """A clay jar (kind 0, bellied) or a tagine (kind 1, a dish with a conical lid)."""
    if kind == 0:
        B.lathe(role, [(0.22 * s, 0.0), (0.34 * s, 0.25 * s), (0.36 * s, 0.5 * s), (0.26 * s, 0.78 * s), (0.2 * s, 0.86 * s), (0.24 * s, 0.96 * s), (0.24 * s, 1.0 * s)], 8, at=(x, y, z), cap_top=True, cap_bottom=True)
    else:
        B.lathe(role, [(0.36 * s, 0.0), (0.4 * s, 0.22 * s), (0.36 * s, 0.3 * s), (0.3 * s, 0.32 * s), (0.1 * s, 0.82 * s), (0.06 * s, 0.9 * s), (0.0, 0.98 * s)], 8, at=(x, y, z), cap_bottom=True)

def spice_cone(B, x, y, z, s, spice, sack):
    """A spice stall pyramid: a cone of ground spice heaped over an open sack."""
    B.lathe(sack, [(0.46 * s, 0.0), (0.5 * s, 0.26 * s), (0.44 * s, 0.4 * s)], 8, at=(x, y, z), cap_top=True, cap_bottom=True)
    B.lathe(spice, [(0.43 * s, 0.34 * s), (0.2 * s, 0.75 * s), (0.0, 1.05 * s)], 8, at=(x, y, z), cap_bottom=True)

def mashrabiya(B, x, y, z, w, h, dark, light):
    """A wooden screen window: a dark opening with a cream lattice of thin bars."""
    B.box(dark, (x, y, z + h / 2), (w, 0.06, h), bevel=0.0)
    nx, nz = max(2, int(w / 0.22)), max(2, int(h / 0.22))
    for k in range(1, nx):
        B.box(light, (x - w / 2 + k * w / nx, y - 0.04, z + h / 2), (0.05, 0.03, h), bevel=0.0)
    for k in range(1, nz):
        B.box(light, (x, y - 0.04, z + k * h / nz), (w, 0.03, 0.05), bevel=0.0)
    B.box(light, (x, y - 0.05, z + h + 0.03), (w + 0.12, 0.08, 0.07), bevel=0.0)
    B.box(light, (x, y - 0.05, z - 0.03), (w + 0.12, 0.08, 0.07), bevel=0.0)

def minaret(B, x, y, z0, role, band, gold):
    """A distant minaret as a plain square-tower silhouette: a shaft, a small lantern room, a teal band and a finial."""
    B.box(role, (x, y, z0 + 3.9), (1.42, 1.42, 7.8), bevel=0.0)
    B.box(role, (x, y, z0 + 8.22), (0.86, 0.86, 0.9), bevel=0.0)
    B.box(band, (x, y - 0.02, z0 + 7.1), (1.46, 1.46, 0.28), bevel=0.0)
    B.box(role, (x, y, z0 + 7.84), (1.6, 1.6, 0.12), bevel=0.0)
    B.sphere(gold, (x, y, z0 + 8.86), 0.18, subdiv=1)
    B.rod(role, (x, y, z0 + 8.66), (x, y, z0 + 8.9), 0.04, segs=4)

# ----------------------------------------------------------------------------------------------- L0: the Atlas
def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'mtn_plain', y=3.0, depth=6.0, top=0.0, bottom=-3.0)
    # back row: tall snow-capped peaks (the painter's ridge is 4.3-8.2 m); front row: lower, darker ridges
    xs = [2.0, 7.5, 13.0, 18.5, 24.0, 29.5, 34.5]
    for i, x in enumerate(xs):
        x += rng.uniform(-0.7, 0.7)
        h = rng.uniform(5.0, 8.0)
        peak(L, f'L0_peak_{i}', x, 2.6, rng.uniform(4.0, 5.6), h, 'mtn_far' if i % 2 == 0 else 'mtn_mid', rng.choice((6, 7, 8)), rng, snow='mtn_snow', snow_from=0.62)
    for i, x in enumerate([4.5, 10.5, 16.0, 21.5, 27.0, 32.5]):
        x += rng.uniform(-0.8, 0.8)
        peak(L, f'L0_ridge_{i}', x, -1.2, rng.uniform(3.8, 5.0), rng.uniform(2.2, 3.6), 'mtn_dark' if i % 2 else 'mtn_mid', rng.choice((6, 7)), rng)

# ----------------------------------------------------------------------------------------------- L1: the medina
def house(B, x0, x1, y, h, role, rng, door=True, pots=True):
    """A flat-roofed medina house from x0 to x1: the wall, a lighter parapet, a dark arched door and a window or two."""
    w, xc = x1 - x0, (x0 + x1) / 2
    B.box(role, (xc, y, h / 2 - 0.1), (w - 0.06, 2.4, h + 0.2), bevel=0.0)
    B.box('parapet', (xc, y - 0.04, h + 0.1), (w - 0.06, 2.5, 0.22), bevel=0.0)
    if door and w > 1.6:
        hs_arch(B, 'door', (x0 + w * rng.uniform(0.3, 0.7), y - 1.25, 0.0), 0.68, 1.3, 0.1)
    nw = 1 if w < 2.6 else 2
    for k in range(nw):
        wx = x0 + w * (k + 1) / (nw + 1) + rng.uniform(-0.15, 0.15)
        wz = rng.uniform(1.7, max(1.8, h - 1.0))
        B.box('win_frame', (wx, y - 1.24, wz + 0.3), (0.56, 0.06, 0.74), bevel=0.0)
        hs_arch(B, rng.choice(('win_blue', 'win_teal')), (wx, y - 1.27, wz), 0.42, 0.62, 0.06)
    if pots and rng.random() < 0.5:
        pot(B, x0 + w * rng.uniform(0.2, 0.8), y - 0.8, h + 0.2, rng.uniform(0.36, 0.5), rng.choice(('pot', 'pot_blue')))

def laundry(B, x0, x1, y, z, rng):
    B.rod('line', (x0, y, z), (x1, y, z - 0.08), 0.02, segs=4)
    n = int((x1 - x0) / 0.5)
    for k in range(n):
        if rng.random() < 0.7:
            cx = x0 + (k + 0.5) * (x1 - x0) / n
            B.box(rng.choice(('laundry_a', 'laundry_b', 'laundry_c')), (cx, y - 0.02, z - 0.3), (0.3, 0.04, 0.48), bevel=0.0)

def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'plain1', y=2.0, depth=5.0, top=0.0, bottom=-3.0)
    # back row: taller, paler houses rising toward the hills
    B = Builder('L1_back', L)
    edges = _split(0, P, 13, rng, jitter=0.35)
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        house(B, a, b, 3.6, rng.uniform(4.2, 6.6), rng.choice(('wall3', 'wall', 'wall3')), rng, door=False, pots=False)
    B.done(period=None)
    # the minaret: a plain silhouette at 700/1024 of the period, between the rows
    M = Builder('L1_minaret', L)
    minaret(M, P * 700 / 1024, 2.4, 0.0, 'minaret', 'minaret_band', 'minaret_gold')
    M.done()
    # front row: the street-front houses with doors, windows, rooftop pots and a laundry line or two
    B = Builder('L1_front', L)
    edges = _split(0, P, 11, rng, jitter=0.4)
    hs = []
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        h = rng.uniform(2.6, 4.6)
        hs.append(h)
        house(B, a, b, 1.0, h, rng.choice(('wall', 'wall2', 'wall')), rng)
    for i in range(len(hs) - 1):
        if rng.random() < 0.4:
            z = min(hs[i], hs[i + 1]) - 0.5
            laundry(B, edges[i] + 0.4, edges[i + 2] - 0.4, 0.8, z, rng)
    B.done(period=None)

# ----------------------------------------------------------------------------------------------- L2: the souk lane
def build_L2(rng):
    L = 'L2'
    plain(L, 'L2_plain', 'plain2', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    # the lane's walls: tall shop fronts with doorways and mashrabiya windows
    B = Builder('L2_walls', L)
    edges = _split(0, P, 8, rng, jitter=0.3)
    tops = []
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        h = rng.uniform(5.0, 6.8)
        tops.append(h)
        xc, w = (a + b) / 2, b - a
        B.box(rng.choice(('nwall', 'nwall2', 'nwall3')), (xc, 1.2, h / 2 - 0.1), (w - 0.05, 2.0, h + 0.2), bevel=0.0)
        B.box('nwall3', (xc, 1.16, h + 0.1), (w - 0.05, 2.1, 0.24), bevel=0.0)
        if rng.random() < 0.6:
            hs_arch(B, 'ndoor', (a + w * rng.uniform(0.25, 0.75), 0.15, 0.0), 1.1, 2.3, 0.1)
        mashrabiya(B, a + w * rng.uniform(0.3, 0.7), 0.2, rng.uniform(3.3, 4.2), rng.uniform(0.8, 1.2), rng.uniform(0.9, 1.3), 'lattice_dark', 'lattice')
    B.done(period=None)
    # stalls along the lane: an awning, a rug or two beside it, wares below
    S = Builder('L2_stalls', L)
    awn_sets = (('awn_red', 'awn_cream'), ('awn_green', 'awn_cream'), ('awn_blue', 'awn_cream'), ('awn_red', 'awn_cream', 'awn_green'))
    rug_sets = (('rug_red', 'rug_cream', 'rug_gold'), ('rug_blue', 'rug_cream', 'rug_red'), ('rug_gold', 'rug_cream', 'rug_blue'))
    n = 5
    for i in range(n):
        x = (i + 0.5) * P / n + rng.uniform(-1.0, 1.0)
        w = rng.uniform(3.2, 4.4)
        awning(S, x, 0.2, rng.uniform(3.0, 3.5), w, rng.choice(awn_sets), 'pole', depth=1.5)
        # wares under the awning: spice cones on a bench, pots, a tagine
        bz = 0.85
        S.box('pole', (x, -0.9, bz - 0.06), (w * 0.7, 0.8, 0.12), bevel=0.0)
        S.box('pole', (x, -0.9, bz - 0.5), (w * 0.7 - 0.2, 0.7, 0.8), bevel=0.0)
        spices = ['spice_red', 'spice_yellow', 'spice_brown', 'spice_green']
        rng.shuffle(spices)
        m = 3 if w < 3.8 else 4
        for k in range(m):
            sx = x - w * 0.3 + (k + 0.5) * w * 0.6 / m
            spice_cone(S, sx, -0.95, bz, rng.uniform(0.62, 0.8), spices[k % 4], rng.choice(('sack', 'sack_dark')))
        # rugs hung at the edge of the stall, and a lantern or two under the awning
        side = rng.choice((-1, 1))
        rs = rng.choice(rug_sets)
        rug(S, x + side * (w / 2 + 0.85), 0.05, rng.uniform(3.6, 4.2), rng.uniform(1.3, 1.7), rng.uniform(2.0, 2.5), rs[0], rs[1], rs[2])
        if rng.random() < 0.6:
            rs2 = rng.choice(rug_sets)
            rug(S, x - side * (w / 2 + 0.75), 0.1, rng.uniform(3.2, 3.8), rng.uniform(1.0, 1.3), rng.uniform(1.4, 1.9), rs2[0], rs2[1], rs2[2])
        for k in range(rng.choice((1, 2))):
            lantern(S, x + rng.uniform(-w * 0.3, w * 0.3), -0.6, rng.uniform(2.5, 2.8), rng.uniform(0.5, 0.65), 'brass', 'pane', wire='wire')
        # pots stacked on the ground beside the stall
        px = x + side * (w / 2 + 0.1) - side * 0.3
        for k, (dx, s, kind) in enumerate(((0.0, 0.9, 0), (0.55, 0.7, 0), (0.25, 0.55, 1))):
            pot(S, px + side * dx, -1.2 + k * 0.15, 0.0, s, rng.choice(('npot', 'npot_blue', 'npot_teal')), kind)
    S.done()
    # a wire of lanterns across the lane between stalls
    W = Builder('L2_lanterns', L)
    for i in range(n):
        x0 = (i + 1.0) * P / n + rng.uniform(-0.8, 0.8)
        z = rng.uniform(4.6, 5.2)
        W.rod('wire', (x0 - 2.6, -0.4, z + 0.1), (x0 + 2.6, -0.4, z + 0.1), 0.02, segs=4)
        for k in range(3):
            lantern(W, x0 - 1.7 + k * 1.7, -0.4, z - 0.1 - 0.15 * (k % 2), rng.uniform(0.55, 0.7), 'brass', 'pane', wire='wire')
    W.done()

BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}

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
    """The theme's floor in the engine's 'grass' style with the souk's colours: a packed-earth cap along the walking
    surface (z = 0) with a pale highlight line, a lumpy underside and earth crumbs, over red clay with chunky stones
    and darker patches, 3 tiles deep, laid out per 32-px tile (ma_kit.ground_earth). Its own collection 'ground'."""
    import ma_kit as K
    K.use(MODULE, PALETTE, LAYERS)
    COLL[GROUND_COLL] = K.ground_earth(seed, tufts='nubs')
    return COLL[GROUND_COLL]

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
