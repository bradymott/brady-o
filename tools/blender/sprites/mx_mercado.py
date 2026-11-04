# Mexico 1-1 "Mercado Mayhem": the parallax background as a low-poly paper-craft diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a sunny colonial-town market street.
#
#   bg_far    volcano (snow cap) + distant hills
#   bg_mid    the continuous row of colonial facades (dome, bell tower)
#   bg_papel  two staggered rows of sagging papel picado strings (anchors at z = 0, flags hang below)
#   bg_near   market stalls with striped awnings, fruit, clay pots, nopales, crates
#
# Contract: every layer stands on its own ground line z = 0, is seamlessly periodic in x with period P (anything
# crossing x = 0 or x = P is duplicated at x ± P), and stays within y in [-6, 6] (the camera looks along +Y from
# -Y, so -Y is "toward the player"). 1 m = 28.1 screen px; the player is 1.85 m tall. Materials are plain
# Principled BSDFs (Base Color + roughness 0.6) named by colour role so a look kit can restyle them later; every
# object carries obj['sprite_layer'] = <collection name>.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_mercado.py
# (builds, then renders each layer + a composite preview into the scratch folder, printing the paths)
import os, sys, math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

P = 36.4                                   # period in metres (1024 px / 28.1 px per m)
LAYERS = ['bg_far', 'bg_mid', 'bg_papel', 'bg_near']
GROUND_COLL = 'ground'                     # the cobblestone floor strip (not a parallax layer; see build_ground)
GP = 8 * (32 / 28.1)                       # ground period: 8 tiles of 32 px = 9.11 m
GROUND_DEPTH = 3 * (32 / 28.1)             # 3 tiles tall: z from 0 down to -3.42 m
GROUND_ROW = {'bg_far': 300, 'bg_mid': 372, 'bg_papel': 70, 'bg_near': 375}   # pixel row of z = 0 in a 508-px frame
RES = (1024, 508)
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/mercado'
TAU = math.tau

# ----------------------------------------------------------------------------------------------- materials
PALETTE = {
    'facade_pink': '#ff7a9a', 'facade_yellow': '#ffc04a', 'facade_teal': '#4ac8c0', 'facade_violet': '#9a7aff',
    'facade_orange': '#ff8a4a', 'facade_green': '#7ad06a', 'facade_cream': '#f2e2c8',
    'facade_trim': '#fff7ea', 'arch_dark': '#3a2a4a', 'door_wood': '#7a4a2a', 'balcony_iron': '#2b2b36',
    'roof_tile': '#d0663a', 'dome_tile': '#f2c230', 'dome_band': '#2aa8a0', 'tower_stone': '#efe3cc',
    'volcano_rock': '#7a6aa0', 'volcano_snow': '#f8fbff', 'hill_green': '#8cc46e', 'hill_far': '#8eaed2',
    'flag_pink': '#ff3d8b', 'flag_yellow': '#ffb81a', 'flag_teal': '#18c2c2', 'flag_violet': '#8a4aff',
    'flag_green': '#5ad04a', 'flag_orange': '#ff6a3a', 'string_dark': '#4a3a30',
    'awning_stripe_a': '#fff8f0', 'awning_red': '#e8402e', 'awning_green': '#2ea85a', 'awning_blue': '#2a6fd6',
    'awning_yellow': '#f7b324', 'post_wood': '#7a5030', 'table_wood': '#b07a44', 'crate_wood': '#c69557',
    'crate_dark': '#8a5a30', 'cloth_blue': '#3a6fd0', 'cloth_pink': '#f05a8a', 'cloth_yellow': '#f6c53a',
    'cloth_teal': '#2fb6ae', 'fruit_orange': '#ff8c1a', 'fruit_lime': '#8ad04a', 'fruit_red': '#e83a3a',
    'fruit_yellow': '#ffd23a', 'fruit_melon': '#2e9e5a', 'fruit_purple': '#8a3ab0',
    'cap_terracotta': '#d8643a', 'cap_light': '#f09060', 'cobble_a': '#c9a97c', 'cobble_b': '#b8956b',
    'cobble_c': '#d7b98e', 'dirt_dark': '#8a6a4e',
    'pot_terracotta': '#c8703a', 'pot_dark': '#a85a2a', 'nopal_green': '#4a9a4a', 'nopal_pale': '#7cc064',
}

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)

def material(name):
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
        """A rounded box (multi-segment bevel, smooth shaded): cobbles, pebbles."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
        b = min(bevel, min(size) * 0.45)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=b, segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._add(bm, role, True, _xf(at, rot))

    def lathe(self, role, profile, segs, at=(0, 0, 0), yscale=1.0, cap_top=True, cap_bottom=False, jag=None, smooth=False, rot=None):
        """Surface of revolution about local Z from a profile [(r, z), ...] bottom to top. `jag(k)` offsets the z of
        the first ring per segment (a zig-zag snow line). A final r = 0 makes an apex."""
        bm = bmesh.new(); rings = []
        for i, (r, z) in enumerate(profile):
            if r <= 1e-6:
                rings.append([bm.verts.new((0.0, 0.0, z))] * segs)
                continue
            ring = []
            for k in range(segs):
                a = TAU * k / segs
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

    def rod(self, role, p0, p1, r, segs=5):
        a, b = Vector(p0), Vector(p1); d = b - a
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=segs, radius1=r, radius2=r, depth=d.length)
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

# ----------------------------------------------------------------------------------------------- bg_far
def build_far(rng):
    L = 'bg_far'
    # the volcano: concave cone, 25 m wide on screen, 5.3 m tall, squashed in depth to stay within y ±6
    # depth staging (all within y ±6): pale far hills behind, the volcano in the middle, green hills in front
    vx, vy, vys = 21.0, -0.5, 0.3
    prof = [(12.5, 0.0), (8.0, 1.3), (5.2, 2.6), (3.4, 3.8), (2.3, 4.7), (1.6, 5.3)]
    B = Builder('far_volcano', L)
    B.lathe('volcano_rock', prof, 12, at=(vx, vy, 0), yscale=vys)
    # snow cap: the same cone a little fatter, with a zig-zag snow line
    def rock_r(z):
        for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return prof[-1][0]
    snow = [(rock_r(z) + 0.2, z) for z in (3.55, 4.0, 4.7, 5.3)] + [(1.75, 5.42)]
    B.lathe('volcano_snow', snow, 12, at=(vx, vy, 0), yscale=vys, jag=lambda k: (-0.45 if k % 2 else 0.0))
    B.done()
    # hills: dome profiles, two tones, some crossing the strip edge (tiled automatically)
    def hill(name, x, y, R, h, role, yscale):
        prof = [(R * math.cos(t * math.pi / 2), h * math.sin(t * math.pi / 2)) for t in (0, 0.3, 0.55, 0.78, 0.93, 1.0)]
        Builder(name, L).lathe(role, prof, 12, at=(x, y, 0), yscale=yscale, smooth=False).done()
    hill('far_hill_a', 34.5, 2.0, 9.5, 2.1, 'hill_far', 0.4)
    hill('far_hill_b', 8.0, 2.0, 7.5, 1.7, 'hill_far', 0.4)
    hill('far_hill_c', 3.0, -2.0, 6.5, 1.3, 'hill_green', 0.45)
    hill('far_hill_d', 27.5, -2.2, 7.0, 1.45, 'hill_green', 0.45)
    hill('far_hill_e', 15.5, -2.5, 5.0, 1.0, 'hill_green', 0.45)

# ----------------------------------------------------------------------------------------------- bg_mid
FACADE_ROLES = ['facade_pink', 'facade_yellow', 'facade_teal', 'facade_violet', 'facade_orange', 'facade_green', 'facade_cream']

def build_mid(rng):
    L = 'bg_mid'
    DEPTH = 3.0
    # a continuous street: 6 houses + 1 bell tower whose widths sum exactly to P
    n = 6
    widths = [rng.uniform(4.6, 7.6) for _ in range(n)]
    tower_i = rng.randrange(1, n)              # the tower slots between two houses
    heights = []
    choices = [4.8, 5.4, 6.0, 6.6, 7.3, 8.0]
    for i in range(n):
        h = rng.choice(choices)
        while heights and abs(h - heights[-1]) < 0.5:
            h = rng.choice(choices)
        heights.append(h)
    if abs(heights[0] - heights[-1]) < 0.5:
        heights[-1] = 8.0 if heights[0] < 6 else 4.8
    roles = rng.sample(FACADE_ROLES, n)
    if 'facade_pink' not in roles:
        roles[rng.randrange(n)] = 'facade_pink'
    tower_w = 2.8
    s = (P - tower_w) / sum(widths)
    widths = [w * s for w in widths]
    dome_i = max(range(n), key=lambda i: widths[i])
    x = 0.0
    for i in range(n):
        if i == tower_i:
            tower(L, x, tower_w, DEPTH)
            x += tower_w
        house(L, i, x, widths[i], heights[i], roles[i], DEPTH, rng, dome=(i == dome_i))
        x += widths[i]

def house(L, i, x0, w, h, role, depth, rng, dome=False):
    cx = x0 + w / 2
    B = Builder(f'mid_house_{i}', L)
    B.box(role, (cx, depth / 2, h / 2), (w, depth, h), bevel=0.06)
    # cornice + roof treatment
    B.box('facade_trim', (cx, depth / 2 - 0.1, h - 0.17), (w + 0.3, depth + 0.2, 0.34), bevel=0.04)
    style = rng.choice(['tile', 'parapet', 'parapet', 'tile'])
    if style == 'tile':
        B.box('roof_tile', (cx, 0.45, h + 0.1), (w + 0.5, 1.1, 0.26), bevel=0.04)
        B.box('roof_tile', (cx, depth / 2 + 0.4, h + 0.08), (w - 0.2, depth - 0.8, 0.22), bevel=0.04)
    else:
        B.box(role, (cx, depth / 2, h + 0.3), (w * 0.55, depth, 0.6), bevel=0.05)
        B.box('facade_trim', (cx, depth / 2 - 0.05, h + 0.66), (w * 0.55 + 0.25, depth + 0.1, 0.16), bevel=0.03)
    # string course between the floors (lower on the short houses so the upper windows keep their height)
    zf = 2.75 if h < 5.6 else 3.0
    B.box('facade_trim', (cx, -0.06, zf), (w + 0.12, 0.3, 0.22), bevel=0.03)
    # openings
    nop = max(1, round(w / 2.3))
    pitch = w / nop
    for k in range(nop):
        ox = x0 + pitch * (k + 0.5)
        # ground floor: arched shop doorway, trim surround, dark interior, a warm door panel
        B.arch('facade_trim', (ox, -0.04, 0.0), 1.5, zf - 0.4, 0.3)
        B.arch('arch_dark', (ox, -0.08, 0.0), 1.2, zf - 0.55, 0.3)
        if rng.random() < 0.5:
            B.box('door_wood', (ox, -0.1, 0.7), (1.0, 0.1, 1.4), bevel=0.03)
        # upper floor: arched window with a balcony on most
        wz = zf + 0.5
        wh = max(1.0, min(1.9, h - zf - 1.2))
        B.arch('facade_trim', (ox, -0.04, wz - 0.1), 1.25, wh + 0.2, 0.3)
        B.arch('arch_dark', (ox, -0.08, wz), 1.0, wh, 0.3)
        if (k + i) % 2 == 0 or nop == 1:
            B.box('balcony_iron', (ox, -0.3, wz - 0.16), (1.6, 0.6, 0.12), bevel=0.03)
            B.box('balcony_iron', (ox, -0.57, wz + 0.1), (1.6, 0.06, 0.42), bevel=0.0)
            B.box('balcony_iron', (ox, -0.57, wz + 0.82), (1.62, 0.07, 0.07), bevel=0.0)
            for px in (-0.76, -0.25, 0.25, 0.76):
                B.box('balcony_iron', (ox + px, -0.57, wz + 0.5), (0.08, 0.08, 0.75), bevel=0.0)
        else:
            B.box('facade_trim', (ox, -0.1, wz - 0.1), (1.35, 0.22, 0.14), bevel=0.02)
    if dome:
        dz = h + (0.6 if style == 'parapet' else 0.2)
        R = min(1.9, w * 0.26)
        B.lathe('facade_trim', [(R + 0.1, 0.0), (R + 0.1, 0.9)], 12, at=(cx, depth / 2, dz), cap_top=True)
        B.lathe('dome_band', [(R + 0.22, 0.0), (R + 0.22, 0.25)], 12, at=(cx, depth / 2, dz + 0.9), cap_top=True)
        dprof = [(R * math.cos(t * math.pi / 2), 1.15 + R * 0.95 * math.sin(t * math.pi / 2)) for t in (0, 0.25, 0.5, 0.72, 0.9, 1.0)]
        B.lathe('dome_tile', dprof, 12, at=(cx, depth / 2, dz), smooth=True)
        top = dz + 1.15 + R * 0.95
        B.lathe('facade_trim', [(0.32, 0.0), (0.32, 0.55)], 8, at=(cx, depth / 2, top - 0.05), cap_top=True)
        B.sphere('dome_tile', (cx, depth / 2, top + 0.7), 0.28)
    B.done()

def tower(L, x0, w, depth):
    cx = x0 + w / 2
    H = 10.6
    B = Builder('mid_tower', L)
    B.box('tower_stone', (cx, depth / 2, 3.75), (w, depth, 7.5), bevel=0.06)
    B.box('facade_trim', (cx, depth / 2 - 0.1, 7.6), (w + 0.3, depth + 0.2, 0.3), bevel=0.04)
    B.box('tower_stone', (cx, depth / 2, 7.7 + 1.45), (w - 0.6, depth - 0.6, 2.9), bevel=0.05)
    B.box('facade_trim', (cx, depth / 2 - 0.1, H), (w - 0.3, depth - 0.3, 0.3), bevel=0.04)
    B.arch('facade_trim', (cx, 0.26, 0.0), 1.3, 2.6, 0.3)
    B.arch('arch_dark', (cx, 0.22, 0.0), 1.0, 2.45, 0.3)
    B.arch('facade_trim', (cx, 0.26, 3.9), 0.95, 1.5, 0.3)
    B.arch('arch_dark', (cx, 0.22, 3.95), 0.7, 1.35, 0.3)
    B.arch('facade_trim', (cx, 0.26, 8.0), 1.2, 2.15, 0.3)
    B.arch('arch_dark', (cx, 0.22, 8.05), 0.9, 2.0, 0.3)
    B.box('facade_trim', (cx, 0.1, 3.84), (1.3, 0.2, 0.14), bevel=0.02)
    R = 0.95
    dprof = [(R * math.cos(t * math.pi / 2), R * 0.9 * math.sin(t * math.pi / 2)) for t in (0, 0.25, 0.5, 0.72, 0.9, 1.0)]
    B.lathe('dome_band', [(R + 0.12, 0.0), (R + 0.12, 0.22)], 12, at=(cx, depth / 2, H + 0.15), cap_top=True)
    B.lathe('dome_tile', dprof, 12, at=(cx, depth / 2, H + 0.37), smooth=True)
    B.lathe('facade_trim', [(0.14, 0.0), (0.14, 0.6)], 6, at=(cx, depth / 2, H + 0.37 + R * 0.9 - 0.05), cap_top=True)
    B.sphere('dome_tile', (cx, depth / 2, H + 0.37 + R * 0.9 + 0.65), 0.2)
    B.done()

# ----------------------------------------------------------------------------------------------- bg_papel
FLAG_ROLES = ['flag_pink', 'flag_yellow', 'flag_teal', 'flag_violet', 'flag_green', 'flag_orange']

def build_papel(rng):
    L = 'bg_papel'
    rows = [dict(y=-1.6, sag=0.95, spans=5, offset=0.0, fw=0.62, fh=0.8, name='papel_front'),
            dict(y=1.6, sag=1.3, spans=5, offset=0.5, fw=0.58, fh=0.74, name='papel_back')]
    for row in rows:
        n = row['spans']
        weights = [rng.uniform(0.8, 1.2) for _ in range(n)]
        s = P / sum(weights)
        spans = [w * s for w in weights]
        x = row['offset'] * spans[0]
        for si, span in enumerate(spans):
            string_with_flags(L, f"{row['name']}_{si}", x, x + span, row['y'], row['sag'] * (span / (P / n)) ** 0.7, row['fw'], row['fh'], rng)
            x += span

def string_with_flags(L, name, xa, xb, y, sag, fw, fh, rng):
    B = Builder(name, L)
    N = 14
    pts = [Vector((xa + (xb - xa) * t, y, -4.0 * sag * t * (1.0 - t))) for t in (i / N for i in range(N + 1))]
    for a, b in zip(pts, pts[1:]):
        B.rod('string_dark', a, b, 0.035, segs=5)
    for end in (xa, xb):
        B.sphere('string_dark', (end, y, 0.0), 0.09, subdiv=1)
    # flags every ~0.85 m along the string, colours cycling from a per-string shuffle
    order = FLAG_ROLES[:]
    rng.shuffle(order)
    span = xb - xa
    step = 0.85
    nflags = max(1, int((span - 0.5) / step))
    start = (span - (nflags - 1) * step) / 2
    for k in range(nflags):
        t = (start + k * step) / span
        px = xa + span * t
        pz = -4.0 * sag * t * (1.0 - t)
        slope = -4.0 * sag * (1.0 - 2.0 * t) / span
        tilt = math.atan(slope) * 0.55
        role = order[k % len(order)]
        hw = fw / 2
        pts2 = [(-hw, 0.0), (hw, 0.0), (hw, -fh + 0.16), (hw * 0.5, -fh), (0.0, -fh + 0.16), (-hw * 0.5, -fh), (-hw, -fh + 0.16)]
        B.slab(role, pts2, 0.03, at=(px, y - 0.015, pz - 0.02), rot=(0, tilt, 0))
    B.done()

# ----------------------------------------------------------------------------------------------- bg_near
def build_near(rng):
    L = 'bg_near'
    stalls = [(2.4, 'awning_red', 'cloth_blue'), (11.6, 'awning_green', 'cloth_yellow'),
              (20.7, 'awning_blue', 'cloth_pink'), (29.9, 'awning_yellow', 'cloth_teal')]
    fruit_sets = [['fruit_orange', 'fruit_lime', 'fruit_red'], ['fruit_yellow', 'fruit_melon', 'fruit_orange'],
                  ['fruit_red', 'fruit_purple', 'fruit_lime'], ['fruit_orange', 'fruit_yellow', 'fruit_melon']]
    for k, (x, awn, cloth) in enumerate(stalls):
        stall(L, k, x, awn, cloth, fruit_sets[k], rng)
    pots(L, 'near_pots_a', 6.6, rng, 3)
    nopal(L, 'near_nopal_a', 8.3, 1.0, potted=True)
    crates(L, 'near_crates_a', 15.9, rng, 3)
    pots(L, 'near_pots_b', 17.6, rng, 2)
    nopal(L, 'near_nopal_b', 25.2, 1.35, potted=False)
    crates(L, 'near_crates_b', 26.9, rng, 2)
    crates(L, 'near_crates_c', 33.6, rng, 2)
    pots(L, 'near_pots_c', 35.6, rng, 3)       # crosses the strip edge: tiled to x - P

def stall(L, k, x, awn, cloth, fruits, rng):
    W, D = 3.2, 1.7
    B = Builder(f'near_stall_{k}', L)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.box('post_wood', (x + sx * (W / 2 - 0.12), sy * (D / 2 - 0.12), 1.3), (0.15, 0.15, 2.6), bevel=0.02)
    # table: a draped cloth with a wooden top
    B.box(cloth, (x, 0.0, 0.44), (2.7, 1.25, 0.88), bevel=0.05)
    B.box('table_wood', (x, 0.0, 0.92), (2.9, 1.4, 0.09), bevel=0.02)
    # striped awning, tilted down toward the street, with a zig-zag valance on the front edge
    nstripe = 8
    sw = (W + 0.3) / nstripe
    tilt = math.atan2(0.32, D + 0.3)
    m0 = B.mark()
    for i in range(nstripe):
        role = 'awning_stripe_a' if i % 2 else awn
        B.box(role, (-(W + 0.3) / 2 + (i + 0.5) * sw, 0.0, 0.0), (sw + 0.01, D + 0.3, 0.09), bevel=0.02)
    # the stripe boxes were placed at the local origin; move them into place as one tilted sheet
    B.transform_since(m0, _xf((x, 0.0, 2.72), (-tilt, 0, 0)))
    teeth = 8
    tw = (W + 0.3) / teeth
    x0 = -(W + 0.3) / 2
    pts = [(x0, 0.0), (-x0, 0.0)]
    for i in range(teeth, 0, -1):
        pts.append((x0 + i * tw, -0.3)); pts.append((x0 + (i - 0.5) * tw, -0.12))
    pts.append((x0, -0.3))
    B.slab(awn, pts, 0.04, at=(x, -(D + 0.3) / 2 - 0.02, 2.72 - (D + 0.3) / 2 * math.tan(tilt) + 0.02))
    # produce: two crates of fruit and a pyramid pile between them
    for cxo, role in ((-0.85, fruits[0]), (0.85, fruits[1])):
        B.box('crate_wood', (x + cxo, 0.0, 1.11), (0.9, 0.7, 0.3), bevel=0.03)
        B.box('crate_dark', (x + cxo, -0.36, 1.11), (0.9, 0.02, 0.07), bevel=0.0)
        for r in range(2):
            for c in range(3):
                B.sphere(role, (x + cxo - 0.28 + c * 0.28, -0.17 + r * 0.34, 1.28), 0.17, subdiv=1)
        for c in range(2):
            B.sphere(role, (x + cxo - 0.14 + c * 0.28, 0.0, 1.5), 0.17, subdiv=1)
    pile = fruits[2]
    for (px, py, pz) in ((-0.22, -0.12, 0.0), (0.22, -0.12, 0.0), (0.0, 0.25, 0.0), (0.0, 0.0, 0.32)):
        B.sphere(pile, (x + px, py, 1.17 + pz), 0.21, subdiv=1)
    B.done()

def pots(L, name, x, rng, n):
    B = Builder(name, L)
    prof = [(0.24, 0.0), (0.40, 0.18), (0.44, 0.42), (0.36, 0.64), (0.30, 0.72), (0.35, 0.74), (0.35, 0.84)]
    sizes = [1.0, 0.8, 0.65][:n]
    roles = ['pot_terracotta', 'pot_dark', 'pot_terracotta']
    if n >= 3:
        # a stacked trio: two on the ground, one perched on top
        for i, (dx, dy, dz, s) in enumerate(((-0.42, 0.0, 0.0, 0.95), (0.42, 0.3, 0.0, 0.85), (0.0, 0.1, 0.72, 0.7))):
            B.lathe(roles[i], [(r * s, z * s) for r, z in prof], 12, at=(x + dx, dy, dz), smooth=True, cap_bottom=True)
    else:
        for i in range(n):
            s = sizes[i]
            B.lathe(roles[i], [(r * s, z * s) for r, z in prof], 12, at=(x + (i - (n - 1) / 2) * 0.8, 0.0, 0.0), smooth=True, cap_bottom=True)
    B.done()

def nopal(L, name, x, s, potted=True):
    B = Builder(name, L)
    z0 = 0.0
    if potted:
        prof = [(0.30, 0.0), (0.40, 0.45), (0.46, 0.5), (0.46, 0.6)]
        B.lathe('pot_terracotta', prof, 12, at=(x, 0.0, 0.0), smooth=True, cap_bottom=True)
        z0 = 0.55
    pads = [((0.0, 0.0, 0.5), 0.0, 1.0), ((-0.3, 0.06, 1.05), 0.45, 0.9), ((0.32, -0.06, 1.1), -0.4, 0.95),
            ((0.0, 0.0, 1.62), 0.1, 0.85), ((-0.62, 0.06, 1.6), 0.8, 0.72), ((0.64, -0.06, 1.7), -0.75, 0.74)]
    for (px, py, pz), rot, ps in pads:
        role = 'nopal_green' if abs(rot) < 0.6 else 'nopal_pale'
        B.sphere(role, (x + px * s, py, z0 + pz * s), 0.5 * s * ps, scale=(0.8, 0.28, 1.0), rot=(0, rot, 0))
    # prickly-pear fruit along the top pads
    for (px, pz) in ((-0.08, 2.08), (0.22, 2.0), (-0.92, 2.0), (0.98, 2.12)):
        B.sphere('fruit_red', (x + px * s, -0.05, z0 + pz * s), 0.1 * s, subdiv=1)
    B.done()

def crates(L, name, x, rng, n):
    B = Builder(name, L)
    layout = [((0.0, 0.0, 0.25), 0.0), ((0.72, 0.1, 0.25), 0.05), ((0.36, 0.05, 0.75), -0.04)][:n]
    for (dx, dy, dz), rot in layout:
        B.box('crate_wood', (x + dx, dy, dz), (0.7, 0.6, 0.5), bevel=0.04, rot=(0, 0, rot))
        B.box('crate_dark', (x + dx, dy - 0.3, dz), (0.7, 0.02, 0.08), bevel=0.0, rot=(0, 0, rot))
        B.box('crate_dark', (x + dx, dy - 0.3, dz + 0.17), (0.7, 0.02, 0.05), bevel=0.0, rot=(0, 0, rot))
    B.done()

# ----------------------------------------------------------------------------------------------- scene api
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

def build_mercado(seed=1):
    clear()
    scene = bpy.context.scene
    for name in LAYERS:
        c = bpy.data.collections.new(name)
        scene.collection.children.link(c)
        COLL[name] = c
    rng = random.Random(seed)
    build_far(random.Random(rng.random()))
    build_mid(random.Random(rng.random()))
    build_papel(random.Random(rng.random()))
    build_near(random.Random(rng.random()))
    return dict(COLL)

# ----------------------------------------------------------------------------------------------- ground
def build_ground(seed=1):
    """The level's cobblestone floor as the 2D game draws it: a terracotta kerb cap along the walking surface
    (z = 0), then rounded warm cobbles set in dark dirt, 3 tiles deep. Periodic in x with period GP (not P), its own
    collection 'ground' (not a parallax layer, not built by build_mercado). Returns the collection."""
    L = GROUND_COLL
    old = bpy.data.collections.get(L)
    if old is not None:
        for ob in list(old.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    c = bpy.data.collections.new(L)
    bpy.context.scene.collection.children.link(c)
    COLL[L] = c
    rng = random.Random(seed)
    D = GROUND_DEPTH
    # dirt slab (spans exactly one period, so it tiles by construction) and the kerb cap with a lighter top edge
    B = Builder('ground_dirt', L)
    B.box('dirt_dark', (GP / 2, 0.2, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    B.box('cap_terracotta', (GP / 2, 0.18, -0.1), (GP, 1.06, 0.2), bevel=0.0)
    B.box('cap_light', (GP / 2, 0.16, -0.025), (GP, 1.1, 0.05), bevel=0.0)
    B.done(period=None)
    # cobbles: the engine draws the floor one 32-px tile at a time from a random column of the strip, so each tile
    # (T = 1.139 m square, 8 columns x 3 rows) is filled with 1-4 big whole stones (1x1 / 1x2 / 2x1 / 2x2, ~12-14 px
    # each), with a dirt margin inside every tile edge; no stone ever crosses a tile edge. Row 0 keeps the kerb cap along its top, the stones sit below it.
    B = Builder('ground_cobbles', L)
    T = 32 / 28.1
    margin, gap = 0.045, 0.09
    roles = ['cobble_a', 'cobble_b', 'cobble_c']
    def split(a, b, n):
        w = [rng.uniform(0.75, 1.25) for _ in range(n)]
        s = (b - a) / sum(w)
        edges = [a]
        for x in w:
            edges.append(edges[-1] + x * s)
        edges[-1] = b
        return edges
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + margin, (col + 1) * T - margin
            z0, z1 = -row * T - margin - (0.2 if row == 0 else 0.0), -(row + 1) * T + margin
            for za, zb in zip(*(lambda e: (e, e[1:]))(split(z0, z1, rng.choice((1, 2))))):
                xs = split(x0, x1, rng.choice((1, 2)))
                for xa, xb in zip(xs, xs[1:]):
                    B.rbox(rng.choice(roles), ((xa + xb) / 2, -0.12, (za + zb) / 2), ((xb - xa) - gap, 0.4, (za - zb) - gap),
                           bevel=0.075, segments=2, rot=(0, rng.uniform(-0.03, 0.03), 0))
    B.done(period=None)
    return c

def triangle_count():
    total = 0
    for name in LAYERS:
        for ob in COLL[name].objects:
            ob.data.calc_loop_triangles()
            total += len(ob.data.loop_triangles)
    return total

# ----------------------------------------------------------------------------------------------- preview render
FRAME_H = P * RES[1] / RES[0]

def z_center_for_row(row):
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
    # camera
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
    # sun from upper-left-front
    sun_data = bpy.data.lights.new('sprite_sun', 'SUN')
    sun_data.energy = 3.0
    sun_data.angle = math.radians(4)
    sun = bpy.data.objects.new('sprite_sun', sun_data)
    sun.rotation_euler = Vector((0.55, 0.65, -0.75)).normalized().to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(sun)
    # soft sky fill
    world = bpy.data.worlds.get('sprite_world') or bpy.data.worlds.new('sprite_world')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.55, 0.65, 0.85, 1.0)
    bg.inputs['Strength'].default_value = 0.9
    scene.world = world
    return cam

def render_layer(scene, cam, layer, path):
    for name in LAYERS:
        COLL[name].hide_render = (name != layer)
    cam.location.z = z_center_for_row(GROUND_ROW[layer])
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    for name in LAYERS:
        COLL[name].hide_render = False

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

def composite(paths, out_path, sky=(0.68, 0.86, 0.98)):
    """Stack the layer renders far -> near over a light-blue sky, the way the engine does."""
    import numpy as np
    base = None
    for layer in LAYERS:
        px = load_pixels(paths[layer])
        if base is None:
            base = np.zeros_like(px); base[..., :3] = sky; base[..., 3] = 1.0
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
    # a clean scene (the default cube etc. would otherwise show up in the renders)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    build_mercado(seed)
    print('triangles:', triangle_count())
    cam = setup_render(scene)
    paths = {}
    for layer in LAYERS:
        paths[layer] = os.path.join(SCRATCH, f'{layer}.png')
        render_layer(scene, cam, layer, paths[layer])
        print('rendered', paths[layer])
    comp = os.path.join(SCRATCH, 'composite.png')
    composite(paths, comp)
    print('composite', comp)
    for layer in ('bg_mid', 'bg_near', 'bg_papel'):
        sp = os.path.join(SCRATCH, f'{layer}_seam.png')
        seam_check(paths[layer], sp)
        print('seam check', sp)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, 'mx_mercado.blend'))
