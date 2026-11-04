# Mexico 1-5 "Hacienda Fiesta": the parallax background as a low-poly paper-craft diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the hacienda's arcade at dusk, the
# volcano a dusky silhouette behind it.
#
#   bg_far     the volcano as a dusky silhouette (at 760/1024 of the period, 110 px tall) + violet hills
#   bg_arches  the arcade: a continuous row of cream arches on pillars (3.5 m openings), a cornice and tile roof,
#              bougainvillea (pink / magenta blobs on green) draped along the top, lanterns hanging in some
#              openings, stone benches with clay pots in others
#   ground     cobblestones, reused from mx_mercado (from mx_mercado import build_ground)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role so a look kit can restyle them later
# ('lantern_glow' is meant to become emissive); every object carries obj['sprite_layer'] = <collection name>.
# BASES holds the engine's ground row for each layer (px from the top of the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_hacienda.py
# (builds, then renders each layer + a composite preview + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

MODULE = 'mx_hacienda'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['bg_far', 'bg_arches']           # back to front
BASES = {'bg_far': 290, 'bg_arches': 360}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2a1a4a', '#c84a7a', '#ffb06a']    # the theme's dusk sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
PALETTE = {
    'volcano_rock': '#5a3a6a', 'volcano_rock2': '#664676', 'volcano_snow': '#f0dce8', 'hill_far': '#6a4a7a', 'hill_near': '#4e3060',
    'arcade_cream': '#f2d8b0', 'arcade_light': '#f8e6c4', 'arcade_dark': '#6a5644', 'arcade_warm': '#8e7152',
    'pillar_base': '#e8c8a0', 'cornice': '#fff0d8', 'roof_tile': '#c85a3a', 'roof_tile2': '#d8704a',
    'bou_pink': '#ff3d8b', 'bou_light': '#ff6ab0', 'bou_deep': '#c82a6a', 'bou_leaf': '#4a8a3a', 'bou_leaf2': '#5a9a46',
    'pot_terracotta': '#c8703a', 'pot_dark': '#a85a2a', 'lantern_iron': '#2b2b36', 'lantern_glow': '#ffd27a',
    'bench_stone': '#d8c0a0', 'nopal_green': '#4a9a4a',
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
    # the volcano at 760/1024 of the period, 110 px (3.9 m) tall, ~20 m wide, a dusky silhouette with a pale cap
    vx, vy, vys = P * 760 / 1024, -0.5, 0.3
    s, rs = 0.73, 0.8
    prof = [(12.5 * rs, 0.0), (8.0 * rs, 1.3 * s), (5.2 * rs, 2.6 * s), (3.4 * rs, 3.8 * s), (2.3 * rs, 4.7 * s), (1.6 * rs, 5.3 * s)]
    B = Builder('far_volcano', L)
    B.lathe('volcano_rock', prof, 12, at=(vx, vy, 0), yscale=vys)
    def rock_r(z):
        for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return prof[-1][0]
    snow = [(rock_r(z) + 0.16, z) for z in (3.7 * s, 4.1 * s, 4.7 * s, 5.3 * s)] + [(1.4, 5.42 * s)]
    B.lathe('volcano_snow', snow, 12, at=(vx, vy, 0), yscale=vys, jag=lambda k: (-0.32 if k % 2 else 0.0))
    B.done()
    B = Builder('far_plain', L)
    B.box('hill_near', (P / 2, 3.0, -1.5), (P, 6.0, 3.0), bevel=0.0)
    B.done(period=None)
    def hill(name, x, y, R, h, role, yscale):
        prof = [(R * math.cos(t * math.pi / 2), h * math.sin(t * math.pi / 2)) for t in (0, 0.3, 0.55, 0.78, 0.93, 1.0)]
        Builder(name, L).lathe(role, prof, 12, at=(x, y, 0), yscale=yscale, smooth=False).done()
    hill('far_hill_a', 8.0, 2.0, 9.0, 1.8, 'hill_far', 0.4)
    hill('far_hill_b', 18.0, 2.2, 7.0, 1.4, 'hill_far', 0.4)
    hill('far_hill_c', 35.5, 2.1, 6.5, 1.3, 'hill_far', 0.4)
    hill('far_hill_d', 2.0, -2.2, 6.0, 1.15, 'hill_near', 0.45)
    hill('far_hill_e', 14.0, -2.4, 5.5, 1.0, 'hill_near', 0.45)
    hill('far_hill_f', 25.5, -2.5, 5.0, 0.95, 'hill_near', 0.45)

# ----------------------------------------------------------------------------------------------- bg_arches
def build_arches(rng):
    L = 'bg_arches'
    DEPTH = 3.0
    N = 14
    pitch = P / N                          # 2.6 m per bay: a 1.9 m opening + a 0.7 m pillar
    H_WALL, H_ARCH, W_OPEN = 4.3, 3.5, 1.9
    # the wall, cornice and tile roof span exactly one period (they tile by construction)
    B = Builder('arcade_wall', L)
    B.box('arcade_cream', (P / 2, DEPTH / 2, H_WALL / 2), (P, DEPTH, H_WALL), bevel=0.0)
    B.box('arcade_light', (P / 2, -0.02, H_WALL - 0.3), (P, 0.08, 0.14), bevel=0.0)
    B.box('cornice', (P / 2, DEPTH / 2 - 0.1, H_WALL + 0.12), (P, DEPTH + 0.3, 0.26), bevel=0.0)
    B.box('roof_tile', (P / 2, DEPTH / 2 - 0.15, H_WALL + 0.42), (P, DEPTH + 0.5, 0.34), bevel=0.0)
    B.box('roof_tile2', (P / 2, -0.4, H_WALL + 0.46), (P, 0.08, 0.16), bevel=0.0)
    for k in range(int(P / 0.52)):
        B.lathe('roof_tile2', [(0.14, 0.0), (0.14, 0.5)], 6, at=(0.26 + k * 0.52, -0.42, H_WALL + 0.56), rot=(-math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    B.done(period=None)
    # the bays
    lantern_bays = set(rng.sample(range(N), 5))
    bench_bays = set(rng.sample([k for k in range(N) if k not in lantern_bays], 4))
    for k in range(N):
        x0 = k * pitch
        cx = x0 + pitch / 2
        B = Builder(f'arcade_bay_{k}', L)
        B.arch('arcade_dark', (cx, -0.06, 0.0), W_OPEN, H_ARCH, 0.3)
        B.box('arcade_warm', (cx, -0.09, 1.1), (W_OPEN - 0.2, 0.1, 2.2), bevel=0.0)
        # pillar at the left of the bay: plinth and capital
        px = x0                            # the pillar is centred on the bay edge
        B.box('pillar_base', (px, -0.12, 0.3), (pitch - W_OPEN + 0.2, 0.3, 0.6), bevel=0.04)
        B.box('cornice', (px, -0.12, H_ARCH - W_OPEN / 2 - 0.08), (pitch - W_OPEN + 0.24, 0.32, 0.16), bevel=0.03)
        if k in lantern_bays:
            lantern(B, cx, H_ARCH)
        if k in bench_bays:
            B.box('bench_stone', (cx, -0.5, 0.24), (1.5, 0.6, 0.48), bevel=0.04)
            B.box('bench_stone', (cx, -0.5, 0.06), (1.2, 0.5, 0.12), bevel=0.02)
            pot(B, cx - 0.35, -0.5, 0.48, 1.0, 'pot_terracotta')
            pot(B, cx + 0.4, -0.45, 0.48, 0.8, 'pot_dark')
        elif rng.random() < 0.4:
            pot(B, cx + rng.uniform(-0.5, 0.5), -0.6, 0.0, 1.25, rng.choice(['pot_terracotta', 'pot_dark']))
        B.done()
    # bougainvillea draped along the top: leafy mounds with pink blossoms, cascading over the cornice and pillars
    B = Builder('arcade_bougainvillea', L)
    for k in range(N):
        if rng.random() < 0.3:
            continue
        x = k * pitch + rng.uniform(-0.5, 0.5)
        bougainvillea(B, x, H_WALL + 0.2, rng, drop=rng.random() < 0.5)
    B.done(period=None)

def lantern(B, cx, h_arch):
    top = h_arch - 0.05
    B.rod('lantern_iron', (cx, -0.3, top), (cx, -0.3, top - 0.5), 0.025, segs=4)
    z = top - 0.5
    B.box('lantern_glow', (cx, -0.3, z - 0.26), (0.26, 0.26, 0.4), bevel=0.0)
    for sx in (-0.15, 0.15):
        B.box('lantern_iron', (cx + sx, -0.3, z - 0.26), (0.04, 0.3, 0.44), bevel=0.0)
    B.box('lantern_iron', (cx, -0.3, z - 0.49), (0.34, 0.34, 0.05), bevel=0.0)
    B.lathe('lantern_iron', [(0.24, 0.0), (0.05, 0.22)], 4, at=(cx, -0.3, z - 0.04), rot=(0, 0, math.pi / 4), cap_bottom=True, cap_top=True)

def pot(B, x, y, z, s, role):
    prof = [(0.24, 0.0), (0.40, 0.18), (0.44, 0.42), (0.36, 0.64), (0.30, 0.72), (0.35, 0.74), (0.35, 0.84)]
    B.lathe(role, [(r * s, zz * s) for r, zz in prof], 12, at=(x, y, z), smooth=True, cap_bottom=True)
    # a tuft of green in the big pots
    if s >= 1.0:
        B.sphere('nopal_green', (x, y, z + 0.95 * s), 0.3 * s, scale=(1.2, 0.8, 0.8), subdiv=1)
        B.sphere('nopal_green', (x - 0.25 * s, y, z + 1.1 * s), 0.2 * s, subdiv=1)
        B.sphere('bou_pink', (x + 0.2 * s, y - 0.1, z + 1.18 * s), 0.1 * s, subdiv=0)

def bougainvillea(B, x, z, rng, drop=False):
    leaves = [(0.0, 0.0, 0.55), (-0.6, -0.05, 0.42), (0.65, 0.05, 0.45), (-0.3, 0.3, 0.38), (0.35, 0.32, 0.4)]
    for dx, dz, r in leaves:
        B.sphere(rng.choice(['bou_leaf', 'bou_leaf2']), (x + dx, -0.25, z + dz), r, scale=(1.3, 0.9, 0.8), subdiv=1)
    for k in range(10):
        a = rng.uniform(0, TAU)
        rr = rng.uniform(0.2, 0.95)
        B.sphere(rng.choice(['bou_pink', 'bou_light', 'bou_deep']), (x + rr * math.cos(a) * 1.3, -0.5, z + 0.1 + rr * math.sin(a) * 0.6), rng.uniform(0.16, 0.26), subdiv=1)
    if drop:
        # a cascade down the pillar face
        for k in range(5):
            zz = z - 0.5 - k * 0.42
            B.sphere(rng.choice(['bou_leaf', 'bou_leaf2']), (x + rng.uniform(-0.2, 0.2), -0.28, zz), 0.26, scale=(1.1, 0.7, 0.8), subdiv=1)
            B.sphere(rng.choice(['bou_pink', 'bou_light', 'bou_deep']), (x + rng.uniform(-0.3, 0.3), -0.45, zz + 0.1), 0.17, subdiv=1)

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_far(random.Random(rng.random()))
    build_arches(random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """The hacienda's courtyard is cobbled like the market street: mx_mercado's floor strip, unchanged."""
    import mx_mercado
    c = mx_mercado.build_ground(seed)
    COLL[GROUND_COLL] = c
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
