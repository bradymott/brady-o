# Mexico 1-3 "Cenote Dive": the parallax background as a low-poly paper-craft diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a flooded limestone cave lit from a
# round opening above, jungle roots hanging in.
#
#   bg_cave    the cenote wall filling the whole frame (base 0: its ground line is the strip's top row, the wall
#              hangs below it): chamfered rock plates, a round sky opening near the top-middle with a rock rim,
#              stalactites and wavy roots coming down from the top
#   bg_stalag  stalagmites and tall crystal clusters at base 420 (3.5-5 m, so their tips clear the floor)
#   ground     mineral limestone: pale cream stones on grey-brown silt, a cream cap along the walking surface
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role so a look kit can restyle them later
# ('crystal_glow' is meant to become emissive); every object carries obj['sprite_layer'] = <collection name>.
# BASES holds the engine's ground row for each layer (px from the top of the 444-px strip).
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_cenote.py
# (builds, then renders each layer + a composite preview + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mx_cenote'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['bg_cave', 'bg_stalag']          # back to front
BASES = {'bg_cave': 0, 'bg_stalag': 420}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2aa8b8', '#0a6a7a', '#04303a']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
PALETTE = {
    'cave_back': '#1a5256', 'plate_a': '#2f8a86', 'plate_b': '#277672', 'plate_c': '#1f6264', 'plate_pale': '#4aa39a',
    'plate_dark': '#174c50', 'sky_hole': '#b8f4ff', 'sky_rim': '#7ae0e8', 'root_dark': '#3a2416', 'root_light': '#5a3a22',
    'stalag_dark': '#0e4a50', 'stalag_mid': '#145a60', 'stalag_light': '#1c6a70', 'crystal_glow': '#5affe0',
    'crystal_pale': '#b8fff0', 'cave_floor': '#0a3a40',
    'silt': '#8e7c66', 'silt_dark': '#5e5044', 'cap_cream': '#e8dcc0', 'cap_white': '#ffffff',
    'stone_a': '#d0c4a8', 'stone_b': '#e0d4b8', 'stone_c': '#c0b498', 'stone_d': '#b8a888',
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

# ----------------------------------------------------------------------------------------------- bg_cave
HOLE = (P / 2, -3.0, 2.6)                  # (x, z, radius) of the sky opening: rows 11..157 of the strip

def build_cave(rng):
    L = 'bg_cave'
    H = 16.4                               # the wall hangs from z = 0 down past the bottom of the strip (15.8 m)
    hx, hz, hr = HOLE
    B = Builder('cave_back', L)
    B.box('cave_back', (P / 2, 3.6, -H / 2), (P, 1.0, H), bevel=0.0)
    B.done(period=None)
    # rock plates: big chamfered slabs on a loose jittered grid, then smaller ones scattered on top at a nearer
    # depth, so the wall reads as irregular limestone rather than brickwork; paler under the opening
    B = Builder('cave_plates', L)
    roles = ['plate_a', 'plate_b', 'plate_c', 'plate_a', 'plate_b', 'plate_dark']
    def plate(xc, zc, w, h, y, role):
        if math.hypot(xc - hx, zc - hz) < hr + 0.9:
            return                         # leave the opening clear
        if abs(xc - hx) < 5.5 and hz - 7.5 < zc < hz and rng.random() < 0.6:
            role = 'plate_pale'            # the light from the opening falls on the wall below it
        for dx in wraps(xc, w / 2):
            B.box(role, (xc + dx, y, zc), (w, 0.7, h), bevel=0.22, rot=(0, rng.uniform(-0.09, 0.09), 0))
    rows, cols = 7, 11
    rp, cp = H / rows, P / cols
    for r in range(rows):
        off = rng.uniform(0, cp)
        for k in range(cols):
            xc = (off + k * cp + rng.uniform(-0.6, 0.6)) % P
            zc = -(r + 0.5) * rp + rng.uniform(-0.5, 0.5)
            plate(xc, zc, rng.uniform(2.4, 4.4), rng.uniform(1.4, 2.6), rng.choice([2.0, 2.5]), rng.choice(roles))
    for k in range(70):
        xc, zc = rng.uniform(0, P), -rng.uniform(0.4, H - 0.4)
        plate(xc, zc, rng.uniform(0.8, 1.8), rng.uniform(0.6, 1.3), rng.choice([1.3, 1.6]), rng.choice(roles))
    B.done(period=None)
    # the opening: a pale disc set into the wall, a chunky rock rim around it
    B = Builder('cave_opening', L)
    B.lathe('sky_hole', [(hr + 0.5, 0.0), (hr + 0.5, 0.3)], 16, at=(hx, 3.0, hz), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    B.lathe('sky_rim', [(hr + 1.0, 0.0), (hr + 1.0, 0.2)], 16, at=(hx, 3.1, hz), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    nrim = 18
    for k in range(nrim):
        a = TAU * k / nrim + rng.uniform(-0.06, 0.06)
        rr = hr + 1.3 + rng.uniform(-0.1, 0.2)
        px, pz = hx + rr * math.cos(a), hz + rr * math.sin(a)
        if pz > -0.2:
            continue                       # nothing above the strip's top row
        role = rng.choice(['plate_dark', 'plate_c', 'plate_b', 'plate_dark'])
        B.box(role, (px, 1.0 + 0.02 * (k % 3), pz), (rng.uniform(1.9, 2.4), 0.8, rng.uniform(1.2, 1.6)), bevel=0.22, rot=(0, a + rng.uniform(-0.15, 0.15), 0))
    B.done()
    # stalactites from the ceiling line
    B = Builder('cave_stalactites', L)
    for k in range(9):
        x = rng.uniform(0, P)
        if abs(x - hx) < hr + 1.6:
            continue
        h, w = rng.uniform(1.6, 3.6), rng.uniform(0.45, 0.8)
        prof = [(0.0, -h), (w * 0.25, -h * 0.8), (w * 0.55, -h * 0.5), (w * 0.85, -h * 0.2), (w, 0.0)]
        for dx in wraps(x, w):
            B.lathe(rng.choice(['plate_dark', 'stalag_mid']), prof, 6, at=(x + dx, 0.6, 0.0), phase=rng.uniform(0, TAU), cap_top=True)
    B.done(period=None)
    # roots: wavy chains hanging from the top (and from the rim of the opening), some forking at the tip
    for k in range(24):
        x = rng.uniform(0, P)
        through_hole = abs(x - hx) < hr - 0.4
        z0 = (hz + math.sqrt(max(0.0, hr * hr - (x - hx) ** 2)) + 0.2) if through_hole else 0.0
        length = rng.uniform(2.0, 8.5) if not through_hole else rng.uniform(4.0, 9.0)
        root(L, f'cave_root_{k}', x, rng.uniform(0.2, 0.9), z0, length, 'root_light' if through_hole else rng.choice(['root_dark', 'root_dark', 'root_light']), rng)

def root(L, name, x, y, z0, length, role, rng):
    B = Builder(name, L)
    n = max(3, int(length / 0.7))
    r0, r1 = rng.uniform(0.11, 0.17), 0.045
    ph, amp = rng.uniform(0, TAU), rng.uniform(0.25, 0.6)
    pts = [Vector((x + amp * math.sin(ph + 2.4 * t * length / 4.0) * t, y, z0 - length * t)) for t in (i / n for i in range(n + 1))]
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        ra = r0 + (r1 - r0) * i / n
        rb = r0 + (r1 - r0) * (i + 1) / n
        B.rod(role, a, b, ra, segs=5, r2=rb)
        B.sphere(role, b, ra, subdiv=0)
    if rng.random() < 0.5:
        tip = pts[-2]
        for sx in (-0.45, 0.4):
            B.rod(role, tip, tip + Vector((sx, 0.0, -0.9)), 0.05, segs=4, r2=0.03)
    B.done()

# ----------------------------------------------------------------------------------------------- bg_stalag
def build_stalag(rng):
    L = 'bg_stalag'
    B = Builder('stalag_floor', L)
    B.box('cave_floor', (P / 2, 1.0, -0.6), (P, 3.0, 1.2), bevel=0.0)
    B.done(period=None)
    n = 10
    pitch = P / n
    x0 = rng.uniform(0, pitch)
    for i in range(n):
        x = x0 + i * pitch + rng.uniform(-0.8, 0.8)
        if i % 3 == 2:
            crystals(L, f'stalag_crystals_{i}', x, rng)
        else:
            stalag_cluster(L, f'stalag_cluster_{i}', x, rng)

def stalag_cluster(L, name, x, rng):
    B = Builder(name, L)
    h0 = rng.uniform(3.6, 5.2)
    parts = [(0.0, h0, rng.uniform(0.85, 1.25), 0.4), (-rng.uniform(0.8, 1.3), h0 * rng.uniform(0.45, 0.7), rng.uniform(0.45, 0.7), 1.4),
             (rng.uniform(0.8, 1.3), h0 * rng.uniform(0.4, 0.65), rng.uniform(0.4, 0.65), 1.0)]
    for dx, h, w, y in parts:
        role = 'stalag_dark' if y < 0.8 else ('stalag_mid' if y < 1.2 else 'stalag_light')
        prof = [(w, 0.0), (w * 0.78, h * 0.22), (w * 0.62, h * 0.36), (w * 0.5, h * 0.6), (w * 0.3, h * 0.8), (w * 0.13, h * 0.95), (0.0, h)]
        B.lathe(role, prof, 6, at=(x + dx, y, -0.1), phase=rng.uniform(0, TAU), cap_bottom=True)
    # a small crystal or two at the foot (hidden under the floor in-game, seen in the preview) and one on a flank
    B.lathe('crystal_glow', [(0.16, 0.0), (0.16, 0.5), (0.0, 0.75)], 6, at=(x + 0.65, 0.2, h0 * 0.45), rot=(0, 0.5, 0), cap_bottom=True)
    B.done()

def crystals(L, name, x, rng):
    """A tall cluster of glowing hexagonal crystals (3-4.5 m) leaning out of a dark rock mound."""
    B = Builder(name, L)
    B.lathe('stalag_dark', [(1.4, 0.0), (1.1, 0.5), (0.6, 0.9), (0.0, 1.1)], 7, at=(x, 0.6, -0.1), phase=rng.uniform(0, TAU), cap_bottom=True)
    spec = [(0.0, rng.uniform(3.6, 4.6), 0.42, 0.0), (-0.55, rng.uniform(2.6, 3.4), 0.32, 0.3), (0.6, rng.uniform(2.4, 3.2), 0.3, -0.32),
            (-0.95, rng.uniform(1.4, 2.0), 0.2, 0.55), (1.0, rng.uniform(1.5, 2.2), 0.22, -0.5)]
    for k, (dx, h, r, tilt) in enumerate(spec):
        role = 'crystal_pale' if k % 3 == 1 else 'crystal_glow'
        prof = [(r, 0.0), (r, h * 0.72), (r * 0.55, h * 0.9), (0.0, h)]
        B.lathe(role, prof, 6, at=(x + dx, 0.4 + 0.1 * k, 0.2), rot=(0, tilt, 0), phase=rng.uniform(0, TAU), cap_bottom=True)
    B.done()

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_cave(random.Random(rng.random()))
    build_stalag(random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """Mineral limestone: a cream cap along the walking surface (z = 0), then pale rounded stones of mixed sizes
    set in grey-brown silt, 3 tiles deep, laid out per 32-px tile (see cell_rects) so no stone crosses a tile edge.
    Periodic in x with period GP (not P), its own collection 'ground'."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_silt', L)
    B.box('silt', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('cap_cream', (GP / 2, 0.2, -0.11), (GP, 1.3, 0.22), bevel=0.0)
    B.box('cap_white', (GP / 2, 0.18, -0.025), (GP, 1.34, 0.05), bevel=0.0)
    B.done(period=None)
    # stones: each 32-px floor tile holds 1-4 big whole stones (1x1 / 1x2 / 2x1 / 2x2, some tiles one big slab) so the
    # engine can draw the tiles in any order
    B = Builder('ground_stones', L)
    roles = ['stone_a', 'stone_b', 'stone_c', 'stone_d']
    for col in range(8):
        for row in range(3):
            slab = row > 0 and rng.random() < 0.18
            spec = dict(rows=(1,), cols=(1,), jitter=0.0) if slab else dict(rows=(1, 2), cols=(1, 2), jitter=0.3)
            for xc, zc, w, h in cell_rects(col, row, rng, gap=0.09, top=(0.22 if row == 0 else 0.0), **spec):
                B.rbox(rng.choice(roles[:2] if slab else roles), (xc, -0.2 + rng.uniform(-0.03, 0.03), zc), (w, 0.36, h), bevel=0.1, segments=2,
                       rot=(0, rng.uniform(-0.05, 0.05), 0))
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
