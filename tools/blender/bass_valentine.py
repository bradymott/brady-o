# Bass Valentine (Art Cart car #1) — parametric Blender build + glTF export.
# Builds the car at two detail levels and writes
#   assets/models/art-cart/bass_valentine.glb      showroom (20–30k triangles)
#   assets/models/art-cart/bass_valentine_lo.glb   race     (5–8k triangles)
# Run headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bass_valentine.py
# or exec it inside a live Blender (the MCP does this). Set BRADY_ROOT to override the repo root.
#
# Rig convention (see docs/BURNS_GUIDE.md §6.8): root objects are bones. `body` (0), wheel_FL/FR/RL/RR (1–4),
# `steer` (5), `part_<name>` (6+). Each bone's origin is its joint. Empties `seat`, `muzzle`, `light_*` carry
# custom properties that become glTF extras. Authored in ENGINE coordinates through E(): x = car's left,
# y = up, z = forward; Blender stores them as (x, -z, y) and the exporter's +Y-up flips them back.
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ROOT = os.environ.get('BRADY_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'models', 'art-cart')
BLEND_DIR = os.path.join(ROOT, 'assets', 'blender')
os.makedirs(OUT, exist_ok=True); os.makedirs(BLEND_DIR, exist_ok=True)

LEVELS = {
    'hi': dict(bevel=4, cyl=32, cyl_s=16, torus=24, tube=8, ico=2, heart=56, heart_bev=6, bulbs=1.0, arch=24, rod=8),
    'lo': dict(bevel=1, cyl=12, cyl_s=8, torus=12, tube=5, ico=1, heart=22, heart_bev=1, bulbs=0.5, arch=12, rod=6),
}
C_COL, C_COL2, C_LIGHT = '#ff2a5a', '#ffb0c8', '#ff3a6a'   # CART_CARS.heart palette

def E(x, y, z): return Vector((x, -z, y))
RX = lambda d: Matrix.Rotation(math.radians(d), 4, 'X')
RY = lambda d: Matrix.Rotation(math.radians(d), 4, 'Y')
RZ = lambda d: Matrix.Rotation(math.radians(d), 4, 'Z')
AX = RY(90)       # cylinder axis Blender Z -> engine X
AZ = RX(90)       # cylinder axis Blender Z -> engine +Z (Blender -Y)
AY = Matrix.Identity(4)  # axis up

# ---------------- materials ----------------
def srgb_lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
MATS = {}
def mat(name, col, rough=0.5, metal=0.0, coat=0.0, emit=None, strength=0.0, extras=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new('bv_' + name); m.use_nodes = True
    n = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    lin = srgb_lin(col)
    n.inputs['Base Color'].default_value = (*lin, 1)
    n.inputs['Roughness'].default_value = rough
    n.inputs['Metallic'].default_value = metal
    n.inputs['Coat Weight'].default_value = coat
    if coat: n.inputs['Coat Roughness'].default_value = 0.03
    if emit:
        n.inputs['Emission Color'].default_value = (*srgb_lin(emit), 1)
        n.inputs['Emission Strength'].default_value = strength
    else:
        n.inputs['Emission Strength'].default_value = 0.0
    m.diffuse_color = (*lin, 1)
    for k, v in (extras or {}).items(): m[k] = v
    MATS[name] = m
    return m
def materials():
    return dict(
        paint=mat('paint_black', '#16121a', rough=0.28, metal=0.25, coat=1.0),
        pink=mat('paint_pink', C_COL, rough=0.3, coat=1.0, emit=C_COL, strength=1.0),
        rim=mat('rim_pink', C_COL2, rough=0.12, metal=1.0),
        chrome=mat('chrome', '#c8ccd8', rough=0.08, metal=1.0),
        dchrome=mat('dark_chrome', '#2a2230', rough=0.18, metal=1.0),
        rubber=mat('rubber', '#18181c', rough=0.65),
        skirt=mat('skirt', '#0a080c', rough=0.85),
        cone=mat('speaker_cone', '#0c0a10', rough=0.6),
        sub=mat('sub_box', '#1e1a24', rough=0.6),
        seat=mat('seat', '#5a1a2a', rough=0.6),
        seat2=mat('seat_base', '#3a1018', rough=0.7),
        rail=mat('rail', '#3a2a3a', rough=0.35),
        ledp=mat('led_pink', C_LIGHT, emit=C_LIGHT, strength=4.0),
        ledp2=mat('led_pink_soft', '#ff9ac8', emit='#ff9ac8', strength=4.0),
        ledw=mat('led_white', '#ffffff', emit='#ffffff', strength=4.0),
        ledr=mat('led_red', '#ff1a2a', emit='#ff1a2a', strength=4.0),
        lens=mat('lamp_lens', '#fff6d8', emit='#fff6d8', strength=4.0),
        cap=mat('hub_cap', '#ff4fd8', emit='#ff4fd8', strength=3.0),
    )

# ---------------- bmesh primitives (engine coords via E) ----------------
def xf(bm, M): bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
def bm_box(w, h, d, at=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    xf(bm, Matrix.Translation(E(*at)) @ Matrix.Diagonal((w, d, h, 1)))
    return bm
def bm_cyl(r1, r2, depth, seg, axis=AY, at=(0, 0, 0), caps=True, flip=False):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    xf(bm, Matrix.Translation(E(*at)) @ axis)
    return bm
def bm_rod(p0, p1, r, seg):
    a, b = E(*p0), E(*p1); d = b - a; L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=L)
    q = d.normalized().to_track_quat('Z', 'Y')
    xf(bm, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    return bm
def bm_ico(r, sub, at=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, Matrix.Translation(E(*at)))
    return bm
def bm_uv(r, seg, rings, at=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    xf(bm, Matrix.Translation(E(*at)))
    return bm
def bm_torus(R, r, seg, tseg, axis=AY, at=(0, 0, 0), sweep=None, sy=1.0):
    # ring in the plane perpendicular to the local Z axis; sweep=(a0,a1) radians for a partial ring
    bm = bmesh.new(); a0, a1 = sweep or (0.0, 2 * math.pi); closed = sweep is None
    n = seg if closed else seg + 1
    rows = []
    for i in range(n):
        a = a0 + (a1 - a0) * i / seg
        cx, cy = math.cos(a) * R, math.sin(a) * R
        row = []
        for j in range(tseg):
            b = 2 * math.pi * j / tseg
            rr = R + math.cos(b) * r
            row.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr * sy, math.sin(b) * r)))
        rows.append(row)
    for i in range(n if closed else n - 1):
        r0, r1 = rows[i], rows[(i + 1) % n]
        for j in range(tseg):
            bm.faces.new((r0[j], r1[j], r1[(j + 1) % tseg], r0[(j + 1) % tseg]))
    bm.normal_update()
    xf(bm, Matrix.Translation(E(*at)) @ axis)
    return bm
def bm_heart(k, n, depth, at=(0, 0, 0)):
    # classic parametric heart in the engine XY plane, extruded along Z (front face at +Z)
    bm = bmesh.new(); pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3; y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append(bm.verts.new((x * k, depth / 2, y * k + 0.18)))   # Blender: (x, -z, y); back face, extruded forward
    f = bm.faces.new(pts); bm.normal_update()
    if f.normal.y > 0: bmesh.ops.reverse_faces(bm, faces=[f])       # face the engine -Z side (back), extrude forward
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    vs = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=vs, vec=(0, -depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    xf(bm, Matrix.Translation(E(*at)))
    return bm
def merge(*bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); out.from_mesh(me); bpy.data.meshes.remove(me)
    return out

# ---------------- scene objects ----------------
class Build:
    def __init__(self, level):
        self.L = LEVELS[level]; self.level = level; self.M = materials(); self.objs = []; self.cutters = []
        self.col = bpy.data.collections.new('BV_' + level.upper()); bpy.context.scene.collection.children.link(self.col)
    def obj(self, name, bm, m, parent=None, loc=None, smooth=True, bevel=None, bevel_angle=False):
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = smooth
        if m: me.materials.append(m)
        ob = bpy.data.objects.new(name, me); self.col.objects.link(ob)
        if loc is not None: ob.location = loc
        if parent is not None: ob.parent = parent
        if bevel:
            b = ob.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = self.L['bevel']; b.harden_normals = True
            b.limit_method = 'ANGLE' if bevel_angle else 'NONE'; b.angle_limit = math.radians(40); b.use_clamp_overlap = True
        self.objs.append(ob)
        return ob
    def empty(self, name, at, props):
        ob = bpy.data.objects.new(name, None); ob.empty_display_type = 'SPHERE'; ob.empty_display_size = 0.15
        ob.location = E(*at)
        for k, v in props.items(): ob[k] = v
        self.col.objects.link(ob); self.objs.append(ob); return ob
    def light(self, i, x, y, z, s, c, **flags):
        self.empty('light_%d' % i, (x, y, z), dict(color=c, size=s, **flags))
    # ---- pieces ----
    def body(self):
        L, M = self.L, self.M
        bm = bm_box(2.5, 1.0, 5.0, (0, 1.0, -0.1))
        # tumblehome: lean the upper sides in a little
        for v in bm.verts:
            if v.co.z > 1.2: v.co.x *= 0.93
        body = self.obj('body', bm, M['paint'])
        skirt = self.obj('skirt', bm_box(2.2, 0.3, 4.6, (0, 0.5, -0.1)), M['skirt'], parent=body)
        # wheel arches: boolean pockets, then one angle-limited bevel so the lips round off
        for i, (x, z) in enumerate([(1.12, 1.7), (-1.12, 1.7), (1.12, -1.75), (-1.12, -1.75)]):
            cut = self.obj('cut_%d' % i, bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.1, 0.5, z)), None, smooth=False)
            cut.display_type = 'WIRE'; cut.hide_set(True); cut.hide_render = True; self.objs.remove(cut); self.cutters.append(cut)
            for target in (body, skirt):
                bo = target.modifiers.new('arch_%d' % i, 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut; bo.solver = 'EXACT'
            # fender lip: a half torus over the arch
            self.obj('fender_%d' % i, bm_torus(0.66, 0.05, L['torus'], L['tube'], AX, (x, 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M['dchrome'], parent=body)
        for target, w in ((body, 0.22), (skirt, 0.08)):
            b = target.modifiers.new('bevel', 'BEVEL'); b.width = w; b.segments = L['bevel']; b.harden_normals = True
            b.limit_method = 'ANGLE'; b.angle_limit = math.radians(35); b.use_clamp_overlap = True
        for k in ('len', 'w', 'h', 'wheelR', 'steerTilt', 'driverScale'):
            body[k] = dict(len=5.2, w=2.6, h=4.5, wheelR=0.5, steerTilt=0.45, driverScale=1.0)[k]
        self.root = body
        # LED strips along the skirt edges and the front/rear: thin glowing bars
        for s in (1, -1):
            self.obj('strip_side_%d' % (s > 0), bm_box(0.035, 0.035, 4.3, (s * 1.115, 0.66, -0.1)), M['ledp'], parent=body)
        self.obj('strip_front', bm_box(2.0, 0.035, 0.035, (0, 0.66, 2.2)), M['ledp'], parent=body)
        self.obj('strip_rear', bm_box(2.0, 0.035, 0.035, (0, 0.66, -2.4)), M['ledp'], parent=body)
        self.obj('strip_deck_l', bm_box(0.035, 0.035, 4.6, (1.17, 1.49, -0.1)), M['ledp2'], parent=body)
        self.obj('strip_deck_r', bm_box(0.035, 0.035, 4.6, (-1.17, 1.49, -0.1)), M['ledp2'], parent=body)
        # bumpers
        for z in (2.48, -2.68):
            self.obj('bumper_%d' % (z > 0), bm_box(2.3, 0.14, 0.16, (0, 0.62, z)), M['chrome'], parent=body, bevel=0.05)
        # speakers along both flanks
        for s in (1, -1):
            for i, z in enumerate((-1.6, -0.35, 0.9)):
                self.speaker(body, (s * 1.26, 1.05, z), AX if s > 0 else RY(-90), 0.3, 0.36, 'spk_%d_%d' % (s > 0, i))
        # front grille: dark chrome plate, three chrome bars, three rows of pink LEDs
        self.obj('grille', bm_box(1.9, 0.62, 0.12, (0, 1.0, 2.42)), M['dchrome'], parent=body, bevel=0.04)
        for r in range(3):
            y = 0.82 + r * 0.18
            self.obj('grille_bar_%d' % r, bm_rod((-0.9, y + 0.09, 2.49), (0.9, y + 0.09, 2.49), 0.02, L['rod']), M['chrome'], parent=body)
            n = 9 if L['bulbs'] >= 1 else 5
            for i in range(n):
                x = -0.8 + 1.6 * i / (n - 1)
                self.obj('led_f_%d_%d' % (r, i), bm_ico(0.045, L['ico'], (x, y, 2.5)), M['ledp' if (i + r) % 2 == 0 else 'ledp2'], parent=body)
        # lamps
        for s in (1, -1):
            self.obj('lamp_h_%d' % (s > 0), bm_cyl(0.17, 0.17, 0.08, L['cyl_s'], AZ, (s * 0.95, 1.18, 2.42)), M['dchrome'], parent=body, bevel=0.03, bevel_angle=True)
            self.obj('lamp_lens_%d' % (s > 0), bm_cyl(0.13, 0.13, 0.04, L['cyl_s'], AZ, (s * 0.95, 1.18, 2.47)), M['lens'], parent=body)
            self.obj('tail_%d' % (s > 0), bm_box(0.32, 0.12, 0.06, (s * 0.95, 1.05, -2.64)), M['ledr'], parent=body, bevel=0.02)
        # sub stack across the back, two cones facing backwards
        self.obj('sub', bm_box(2.2, 0.66, 0.8, (0, 1.82, -2.12)), M['sub'], parent=body, bevel=0.1)
        for s in (1, -1):
            self.speaker(body, (s * 0.55, 1.82, -2.54), RX(-90), 0.27, 0.29, 'sub_cone_%d' % (s > 0))
        # deck rail with posts and bulbs
        for s in (1, -1):
            self.obj('rail_%d' % (s > 0), bm_rod((s * 1.15, 1.85, 1.6), (s * 1.15, 1.85, -1.4), 0.035, L['rod']), M['chrome'], parent=body)
            for z in (1.6, 0.1, -1.4):
                self.obj('post_%d_%d' % (s > 0, int(z * 10)), bm_rod((s * 1.15, 1.5, z), (s * 1.15, 1.85, z), 0.025, L['rod']), M['chrome'], parent=body)
            n = 8 if L['bulbs'] >= 1 else 4
            for i in range(n):
                z = 1.6 - 3.0 * i / (n - 1)
                self.obj('bulb_%d_%d' % (s > 0, i), bm_ico(0.05, L['ico'], (s * 1.15, 1.9, z)), M['ledp' if i % 2 == 0 else 'ledw'], parent=body)
        # pedestal for the heart, with a glowing ring on top
        self.obj('pedestal', bm_cyl(0.42, 0.42, 0.55, L['cyl'], AY, (0, 1.775, 0.8)), M['chrome'], parent=body, bevel=0.06, bevel_angle=True)
        self.obj('pedestal_ring', bm_torus(0.42, 0.022, L['torus'], L['tube'], AY, (0, 2.06, 0.8)), M['ledp'], parent=body)
        # seat and steering column
        self.obj('seat_cushion', bm_box(0.62, 0.16, 0.58, (0, 1.48, -1.3)), M['seat'], parent=body, bevel=0.06)
        self.obj('seat_back', bm_box(0.6, 0.7, 0.14, (0, 1.88, -1.61)), M['seat'], parent=body, bevel=0.05)
        self.obj('seat_base', bm_box(0.5, 0.22, 0.5, (0, 1.3, -1.3)), M['seat2'], parent=body, bevel=0.04)
        self.obj('column', bm_rod((0, 1.99, -0.58), (0, 1.52, -0.27), 0.04, L['rod']), M['dchrome'], parent=body)
    def speaker(self, parent, at, axis, r_in, r_rim, name):
        L, M = self.L, self.M
        x, y, z = at
        self.obj(name + '_rim', bm_torus(r_rim, 0.03, L['torus'], L['tube'], axis, at), M['chrome'], parent=parent)
        self.obj(name + '_glow', bm_torus(r_rim - 0.045, 0.02, L['torus'], max(3, L['tube'] - 4), axis, at), M['ledp'], parent=parent)
        # the cone: wide at the surface, narrowing inward (local +Z of the primitive points outward after `axis`)
        self.obj(name + '_cone', bm_cyl(0.06, r_in, 0.13, L['cyl_s'], axis, at, caps=False, flip=True), M['cone'], parent=parent)
        self.obj(name + '_cap', bm_uv(0.07, L['cyl_s'], max(4, L['cyl_s'] // 2), at), M['chrome'], parent=parent)
    def wheels(self):
        L, M = self.L, self.M
        for name, x, z in (('wheel_FL', 1.12, 1.7), ('wheel_FR', -1.12, 1.7), ('wheel_RL', 1.12, -1.75), ('wheel_RR', -1.12, -1.75)):
            side = 1 if x > 0 else -1
            tyre = self.obj(name, bm_cyl(0.5, 0.5, 0.42, L['cyl'], AX), M['rubber'], loc=E(x, 0.5, z), bevel=0.13, bevel_angle=True)
            self.obj(name + '_rim', bm_cyl(0.3, 0.3, 0.34, L['cyl_s'], AX), M['rim'], parent=tyre, bevel=0.03, bevel_angle=True)
            for k in range(5):
                a = k / 5 * 2 * math.pi
                self.obj(name + '_spoke_%d' % k, bm_rod((side * 0.175, math.cos(a) * 0.06, math.sin(a) * 0.06), (side * 0.175, math.cos(a) * 0.26, math.sin(a) * 0.26), 0.03, L['rod']), M['chrome'], parent=tyre)
            self.obj(name + '_cap', bm_cyl(0.08, 0.08, 0.05, L['cyl_s'], AX, (side * 0.185, 0, 0)), M['cap'], parent=tyre)
    def steer(self):
        L, M = self.L, self.M
        st = self.obj('steer', bm_torus(0.19, 0.03, L['torus'], L['tube'], AZ), M['dchrome'], loc=E(0, 2.04, -0.63))
        self.obj('steer_spoke', bm_rod((-0.17, 0, 0), (0.17, 0, 0), 0.018, L['rod']), M['chrome'], parent=st)
        self.obj('steer_hub', bm_uv(0.05, L['cyl_s'], max(4, L['cyl_s'] // 2)), M['chrome'], parent=st)
        self.obj('steer_accent', bm_uv(0.025, max(6, L['cyl_s'] // 2), 4, (0, 0, 0.04)), M['ledp'], parent=st)
    def heart(self):
        L, M = self.L, self.M
        s = 1.35
        h = self.obj('part_heart', bm_heart(0.0875, L['heart'], 0.84 * s), M['pink'], loc=E(0, 3.15, 0.8))
        b = h.modifiers.new('bevel', 'BEVEL'); b.width = 0.26 * s; b.segments = L['heart_bev']; b.harden_normals = True; b.profile = 0.62; b.use_clamp_overlap = True
        n = 16 if L['bulbs'] >= 1 else 8
        for i in range(n):
            a = i / n * 2 * math.pi
            self.obj('heart_bulb_%d' % i, bm_ico(0.05, L['ico'], (math.sin(a) * 0.98, math.cos(a) * 0.8 + 0.02, 0.6)), M['ledw'], parent=h)
    def extras(self):
        self.empty('seat', (0, 1.62, -1.25), {})
        self.empty('muzzle', (0, 3.0, 0.8), {})
        self.light(0, 0, 3.2, 0.8, 4.2, C_LIGHT, big=1)
        for i, s in enumerate((1, -1)):
            self.light(1 + i, s * 0.95, 1.18, 2.52, 1.3, '#fff2c8', head=1)
            self.light(3 + i, s * 0.95, 1.05, -2.72, 0.9, '#ff2a3a', tail=1)
            self.light(5 + i, s * 0.4, 1.0, 2.5, 0.45, C_LIGHT, led=1)
            self.light(7 + i, s * 1.3, 1.05, -0.35, 0.5, C_LIGHT, led=1)
    def build(self):
        self.body(); self.wheels(); self.steer(); self.heart(); self.extras()
        return self
    def tris(self):
        dg = bpy.context.evaluated_depsgraph_get(); total = 0; verts = 0; per = {}
        for ob in self.objs:
            if ob.type != 'MESH': continue
            me = ob.evaluated_get(dg).to_mesh(); me.calc_loop_triangles()
            n = len(me.loop_triangles); total += n; verts += len(me.vertices)
            root = ob; 
            while root.parent: root = root.parent
            per[root.name] = per.get(root.name, 0) + n
            ob.evaluated_get(dg).to_mesh_clear()
        return total, verts, per
    def smooth_by_angle(self):
        try:
            bpy.ops.object.select_all(action='DESELECT')
            meshes = [o for o in self.objs if o.type == 'MESH']
            for o in meshes: o.select_set(True)
            bpy.context.view_layer.objects.active = meshes[0]
            bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
        except Exception as e:
            print('smooth_by_angle skipped:', e)
    def export(self, path):
        bpy.ops.object.select_all(action='DESELECT')
        for o in self.objs: o.select_set(True)
        bpy.context.view_layer.objects.active = self.root
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                                  export_extras=True, export_materials='EXPORT', export_normals=True, export_animations=False,
                                  export_skins=False, export_lights=False, export_cameras=False, export_image_format='NONE', export_tangents=False)
        return os.path.getsize(path)

def clear_default():
    cube = bpy.data.objects.get('Cube')
    if cube and cube.type == 'MESH' and len(cube.data.vertices) == 8: bpy.data.objects.remove(cube)
    for c in list(bpy.data.collections):
        if c.name.startswith('BV_'):
            for o in list(c.objects): bpy.data.objects.remove(o)
            bpy.data.collections.remove(c)
    for m in list(bpy.data.materials):
        if m.name.startswith('bv_'): bpy.data.materials.remove(m)
    for me in list(bpy.data.meshes):
        if me.users == 0: bpy.data.meshes.remove(me)

def run(levels=('hi', 'lo'), save=True):
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    clear_default(); MATS.clear()
    report = {}
    builds = {}
    # the race level first: once exported, its objects get a '__lo' suffix so the showroom build keeps the clean bone names
    for lv in [l for l in ('lo', 'hi') if l in levels]:
        B = Build(lv).build(); B.smooth_by_angle()
        t, v, per = B.tris()
        path = os.path.join(OUT, 'bass_valentine%s.glb' % ('' if lv == 'hi' else '_lo'))
        size = B.export(path)
        report[lv] = dict(tris=t, verts=v, bytes=size, per=per, path=path)
        builds[lv] = B
        if lv == 'lo':
            for o in B.objs + B.cutters: o.name = o.name + '__lo'
    if 'lo' in builds:
        bpy.context.view_layer.layer_collection.children['BV_LO'].hide_viewport = True
    if save:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND_DIR, 'bass_valentine.blend'), compress=True)
    return report

if __name__ == '__main__':
    import json
    print(json.dumps(run(), indent=1, default=str))
