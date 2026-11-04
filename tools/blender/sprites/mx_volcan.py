# Mexico 1-4 "Volcán Escape": the parallax background as a low-poly paper-craft diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: climbing out of an erupting volcano at
# dusk, agave fields on black soil below it.
#
#   bg_far    the ACTIVE volcano (at 620/1024 of the period, 190 px tall): dark rock, a glowing crater and lava
#             streaks down the flank in material 'volcano_glow' (the look kit makes it emissive), dark ridges
#   bg_mid    three rows of agave rosettes on terraced dark soil, with the odd tall quiote flower stalk
#   ground    black columnar basalt with warm glowing cracks (basalt_dark / basalt_light / crack_glow)
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role so a look kit can restyle them later; every
# object carries obj['sprite_layer'] = <collection name>. BASES holds the engine's ground row for each layer
# (px from the top of the 444-px strip). The engine draws the smoke plume itself (dyn 'mxSmoke'), so none here.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_volcan.py
# (builds, then renders each layer + a composite preview + the ground strip into the scratch folder)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

MODULE = 'mx_volcan'
P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['bg_far', 'bg_mid']              # back to front
BASES = {'bg_far': 330, 'bg_mid': 372}
GROUND_COLL = 'ground'
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
RES = (1024, 444)
SKY = ['#2a0a1a', '#8a2a1a', '#ff8a3a']    # the theme's sky gradient (preview composite only)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mxbg'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
PALETTE = {
    'volcano_rock': '#3a1a1a', 'volcano_rock2': '#4a2424', 'volcano_glow': '#ff9a2a', 'crater_dark': '#241010',
    'ridge_dark': '#2a1018', 'ridge_far': '#4a2030', 'ridge_mid': '#3a1822',
    'agave_dark': '#3a2a20', 'agave_mid': '#4a3a2a', 'agave_light': '#5a4a34', 'agave_pale': '#6a5a40',
    'soil_dark': '#2e2018', 'soil_mid': '#3a2a20', 'soil_light': '#46342a', 'quiote': '#4a3626', 'quiote_bud': '#6a5a3a',
    'basalt_dark': '#2a1c1c', 'basalt_mid': '#503c3c', 'basalt_light': '#6e5454', 'basalt_cap': '#4a3a3a', 'basalt_cap_hi': '#8a6a5a',
    'crack_glow': '#ff6a2a',
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
    # the volcano at 620/1024 of the period: 190 px (6.76 m) tall, ~25 m wide, squashed in depth to stay in y ±6
    vx, vy, vys = P * 620 / 1024, -0.5, 0.3
    prof = [(12.8, 0.0), (8.6, 1.6), (5.7, 3.3), (3.9, 4.8), (2.7, 5.9), (2.0, 6.55), (1.9, 6.76)]
    B = Builder('far_volcano', L)
    B.lathe('volcano_rock', prof, 14, at=(vx, vy, 0), yscale=vys, cap_top=False, phase=0.1)
    # a lighter shoulder on the lit (screen-left) flank: a second, slightly smaller cone offset left
    B.lathe('volcano_rock2', [(r * 0.55, z) for r, z in prof[:-1]], 10, at=(vx - 3.6, vy - 0.05, 0), yscale=vys, cap_top=True, phase=0.3)
    # the crater: a dark rim lip with the glowing lava pool inside and a small spiky fountain of lava above it
    B.lathe('crater_dark', [(2.0, 6.5), (2.4, 6.72), (1.55, 6.92)], 14, at=(vx, vy, 0), yscale=vys, cap_top=False, phase=0.1)
    B.lathe('volcano_glow', [(1.58, 6.88), (1.58, 6.95)], 14, at=(vx, vy, 0), yscale=vys, cap_top=True, phase=0.1)
    for dx, h, tilt in ((0.0, 1.7, 0.0), (-0.5, 1.2, -0.3), (0.55, 1.0, 0.32), (-0.9, 0.7, -0.5), (0.95, 0.6, 0.5)):
        B.lathe('volcano_glow', [(0.2, 0.0), (0.11, h * 0.55), (0.0, h)], 5, at=(vx + dx, vy - 0.1, 6.9), rot=(0, tilt, 0), cap_bottom=True)
    for dx, dz in ((-1.2, 1.5), (1.3, 1.3), (-0.4, 2.3), (0.7, 2.1), (1.7, 0.8), (-1.6, 0.9)):
        B.sphere('volcano_glow', (vx + dx, vy - 0.1, 6.9 + dz), 0.11, subdiv=0)
    def rock_r(z):
        for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return prof[-1][0]
    # lava streaks: thin chains of tapering rods running down the front flank from the lip, with a slight wobble
    for k, (a0, zend, ph) in enumerate(((-1.3, 2.6, 0.0), (-1.8, 3.9, 1.2), (-0.95, 1.9, 2.3))):
        n = 8
        pts = []
        for i in range(n + 1):
            t = i / n
            z = 6.7 - (6.7 - zend) * t
            a = a0 + 0.1 * math.sin(ph + 5.0 * t) * t
            r = rock_r(z) + 0.08
            pts.append(Vector((vx + r * math.cos(a), vy + r * math.sin(a) * vys - 0.05, z)))
        for i, (p0, p1) in enumerate(zip(pts, pts[1:])):
            w0 = 0.13 - 0.07 * i / n
            B.rod('volcano_glow', p0, p1, w0, segs=5, r2=0.13 - 0.07 * (i + 1) / n)
            B.sphere('volcano_glow', p1, w0, subdiv=0)
        B.sphere('volcano_glow', pts[-1], 0.14, scale=(1.6, 1.0, 0.5), subdiv=1)
    B.done()
    # dark ridges staged in depth: far ones behind the volcano, near ones in front
    def ridge(name, x, y, R, h, role, yscale, segs=12):
        prof = [(R * math.cos(t * math.pi / 2), h * math.sin(t * math.pi / 2)) for t in (0, 0.3, 0.55, 0.78, 0.93, 1.0)]
        Builder(name, L).lathe(role, prof, segs, at=(x, y, 0), yscale=yscale, smooth=False, phase=rng.uniform(0, 1)).done()
    # a dark plain under everything so the far layer has no see-through band below its ground line
    B = Builder('far_plain', L)
    B.box('ridge_dark', (P / 2, 3.0, -1.5), (P, 6.0, 3.0), bevel=0.0)
    B.done(period=None)
    ridge('far_ridge_a', 6.5, 2.4, 9.0, 3.2, 'ridge_far', 0.4, 9)
    ridge('far_ridge_b', 34.0, 2.2, 7.5, 2.4, 'ridge_far', 0.4, 9)
    ridge('far_ridge_c', 14.5, 2.0, 6.0, 1.7, 'ridge_mid', 0.4, 9)
    ridge('far_ridge_d', 2.0, -2.3, 6.5, 1.4, 'ridge_dark', 0.45, 9)
    ridge('far_ridge_e', 30.5, -2.5, 6.0, 1.2, 'ridge_dark', 0.45, 9)
    ridge('far_ridge_f', 13.0, -2.6, 5.0, 1.0, 'ridge_dark', 0.45, 9)

# ----------------------------------------------------------------------------------------------- bg_mid
def build_mid(rng):
    L = 'bg_mid'
    # terraced dark soil: a slab filling from z = 0 down, and two low ridges behind for the back rows to stand on
    B = Builder('mid_soil', L)
    B.box('soil_dark', (P / 2, 1.0, -2.0), (P, 5.0, 4.0), bevel=0.0)
    B.box('soil_mid', (P / 2, 1.8, 0.2), (P, 1.2, 0.4), bevel=0.06)
    B.box('soil_light', (P / 2, 3.4, 0.4), (P, 1.6, 0.8), bevel=0.08)
    B.done(period=None)
    rows = [dict(y=3.4, z=0.8, s=(1.25, 1.6), roles=('agave_light', 'agave_pale'), name='back'),
            dict(y=1.8, z=0.4, s=(1.4, 1.9), roles=('agave_mid', 'agave_light'), name='mid'),
            dict(y=0.1, z=0.0, s=(1.6, 2.2), roles=('agave_dark', 'agave_mid'), name='front')]
    quiote_slots = set(rng.sample(range(14), 3))
    for ri, row in enumerate(rows):
        n = 14
        pitch = P / n
        off = pitch * (0.15 + 0.34 * ri)
        for k in range(n):
            x = off + k * pitch + rng.uniform(-0.3, 0.3)
            s = rng.uniform(*row['s'])
            with_quiote = (ri == 1 and k in quiote_slots)
            agave(L, f"mid_agave_{row['name']}_{k}", x, row['y'], row['z'], s, row['roles'], rng, with_quiote)

def agave(L, name, x, y, z0, s, roles, rng, with_quiote=False):
    """A rosette of 11 tapered leaves fanned in the picture plane (a few leaning fore/aft), optional flower stalk."""
    B = Builder(name, L)
    nleaf = 11
    for i in range(nleaf):
        t = (i / (nleaf - 1)) * 2 - 1              # -1 .. 1 across the fan
        tilt = t * 1.25 + rng.uniform(-0.06, 0.06)  # about Y: lean left / right
        length = s * (0.55 + 0.45 * (1 - abs(t)) ** 0.7) * rng.uniform(0.92, 1.08)
        w = s * 0.26
        pts = [(-w / 2, 0.0), (w / 2, 0.0), (w * 0.32, length * 0.5), (0.0, length), (-w * 0.32, length * 0.5)]
        role = roles[i % 2]
        dy = 0.12 * ((i % 3) - 1)
        B.slab(role, pts, 0.07, at=(x, y + dy, z0 + 0.05), rot=(0.25 * ((i % 3) - 1), tilt, 0))
    # a flat base pad hides the leaf roots
    B.sphere(roles[0], (x, y, z0 + 0.08), s * 0.22, scale=(1.4, 0.8, 0.6), subdiv=1)
    if with_quiote:
        hq = s * 2.2
        B.rod('quiote', (x, y, z0 + 0.1), (x + 0.15, y, z0 + hq), 0.07, segs=5, r2=0.04)
        for k in range(5):
            zz = z0 + hq * (0.62 + 0.09 * k)
            sx = 0.55 * (1 - 0.12 * k) * (1 if k % 2 else -1)
            tip = Vector((x + 0.15 * (zz - z0) / hq + sx, y, zz + 0.25))
            B.rod('quiote', (x + 0.15 * (zz - z0) / hq, y, zz), tip, 0.035, segs=4)
            B.sphere('quiote_bud', tip, 0.14, scale=(1.3, 0.8, 0.5), subdiv=1)
    B.done()

# ----------------------------------------------------------------------------------------------- scene api
def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_far(random.Random(rng.random()))
    build_mid(random.Random(rng.random()))
    return {name: COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """Black columnar basalt: a dark cap along the walking surface (z = 0), then tall chamfered columns in three
    basalt tones with warm 'crack_glow' showing through some of the joints, 3 tiles deep, laid out per 32-px tile
    (see cell_rects) so no column or glow patch crosses a tile edge. Periodic in x with period GP (not P), its own
    collection 'ground'. Returns the collection."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('basalt_dark', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    # per 32-px tile: an optional glow patch behind, then whole columns in front, so the engine can draw the tiles
    # in any order and a glowing joint never crosses a tile edge
    B = Builder('ground_glow', L)
    glow_cells = {(col, row) for col in range(8) for row in range(3) if rng.random() < 0.45}
    for col, row in sorted(glow_cells):
        x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
        z0, z1 = -row * T - CELL_MARGIN - (0.22 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN
        # a patch covering part of the tile, so the glow shows through only some of the joints
        gw, gh = (x1 - x0) * rng.uniform(0.45, 0.8), (z0 - z1) * rng.uniform(0.45, 0.8)
        gx = rng.uniform(x0 + gw / 2, x1 - gw / 2); gz = rng.uniform(z1 + gh / 2, z0 - gh / 2)
        B.box('crack_glow', (gx, 0.0, gz), (gw, 0.02, gh), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('basalt_cap', (GP / 2, 0.16, -0.11), (GP, 1.3, 0.22), bevel=0.0)
    B.box('basalt_cap_hi', (GP / 2, 0.14, -0.025), (GP, 1.34, 0.05), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_columns', L)
    roles = ['basalt_mid', 'basalt_mid', 'basalt_dark', 'basalt_light']
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1,), cols=(1, 2), gap=0.09, top=(0.22 if row == 0 else 0.0), jitter=0.25):
                B.box(rng.choice(roles), (xc, -0.2, zc), (w, 0.36, h), bevel=0.07)
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
