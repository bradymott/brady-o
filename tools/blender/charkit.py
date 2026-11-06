# Character kit: the shared rig, skin-weight, clip and export code for the Burns engine's skinned glTF characters
# (BurnsSkin, docs/BURNS_GUIDE.md §6.9), factored out of tools/blender/mannequin.py so brady.py and chinka.py only
# describe their looks. The mannequin keeps its own copy; this kit adds engine-space authoring, per-face materials,
# emissive materials, extra (hair / skirt / cape) bones and the full clip set the engine bridge expects.
#
# Use:  from charkit import *; rig = Rig('brady', height=1.8); rig.part(...); rig.extra_bones([...]); rig.secondary = fn
#       build(rig, out_glb, out_blend)
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/brady.py
#
# Coordinates: author in ENGINE space (x = the character's LEFT, y = up, z = forward) through E(); Blender stores
# (x, -z, y) and the exporter's +Y-up flip gives the engine's convention (faces +Z), the same as Mixamo's rigs. Units
# are metres, feet on y = 0. Rotations in the clip code are Blender-space (Rx = pitch about the left axis, Ry = roll
# about the forward axis, Rz = yaw about up), exactly as mannequin.py.
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import (E, bm_tube, bm_loft, bm_ico, bm_torus, bm_lathe, bm_uv, bm_sweep, bm_box, bm_cyl, bm_rod, bm_profile,
                     catmull, hermite, sstep, aim, rot, frame, rmf, AX, AY, AZ, srgb_lin, merge as bm_merge)

ROOT = os.environ.get('BRADY_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
MODELS = os.path.join(ROOT, 'assets', 'models', 'shared')
BLEND_DIR = os.path.join(ROOT, 'assets', 'blender')
FPS = 24
TAU = math.tau
M = 'mixamorig:'

# ---------------- the Mixamo skeleton (engine space: x left, y up, z forward), T-pose ----------------
def mixamo_bones(h=1.8, w=1.0, arm=1.0):
    """(name, parent, head, tail) for the 25-bone Mixamo hierarchy of a figure `h` metres tall (the mannequin's
    proportions scaled), `w` widening the shoulders and hips, `arm` lengthening the arms."""
    k = h / 1.8; kw = k * w
    B = [
        ('Hips', None, (0, 0.98, 0), (0, 1.08, 0)),
        ('Spine', 'Hips', (0, 1.08, 0), (0, 1.20, 0)),
        ('Spine1', 'Spine', (0, 1.20, 0), (0, 1.33, 0)),
        ('Spine2', 'Spine1', (0, 1.33, 0), (0, 1.47, 0)),
        ('Neck', 'Spine2', (0, 1.47, 0), (0, 1.56, 0)),
        ('Head', 'Neck', (0, 1.56, 0), (0, 1.70, 0)),
        ('HeadTop_End', 'Head', (0, 1.70, 0), (0, 1.80, 0)),
    ]
    for side, s in (('Left', 1), ('Right', -1)):
        a = arm
        B += [
            (side + 'Shoulder', 'Spine2', (s * 0.05, 1.44, 0), (s * 0.19, 1.43, 0)),
            (side + 'Arm', side + 'Shoulder', (s * 0.19, 1.43, 0), (s * (0.19 + 0.27 * a), 1.43, 0)),
            (side + 'ForeArm', side + 'Arm', (s * (0.19 + 0.27 * a), 1.43, 0), (s * (0.19 + 0.53 * a), 1.43, 0)),
            (side + 'Hand', side + 'ForeArm', (s * (0.19 + 0.53 * a), 1.43, 0), (s * (0.19 + 0.69 * a), 1.43, 0)),
            (side + 'UpLeg', 'Hips', (s * 0.10, 0.95, 0), (s * 0.10, 0.50, 0)),
            (side + 'Leg', side + 'UpLeg', (s * 0.10, 0.50, 0), (s * 0.10, 0.09, 0)),
            (side + 'Foot', side + 'Leg', (s * 0.10, 0.09, 0), (s * 0.10, 0.02, 0.12)),
            (side + 'ToeBase', side + 'Foot', (s * 0.10, 0.02, 0.12), (s * 0.10, 0.01, 0.20)),
            (side + 'Toe_End', side + 'ToeBase', (s * 0.10, 0.01, 0.20), (s * 0.10, 0.01, 0.25)),
        ]
    out = []
    for name, parent, hd, tl in B:
        sc = lambda p: (p[0] * kw, p[1] * k, p[2] * k)
        out.append((name, parent, sc(hd), sc(tl)))
    return out

# ---------------- materials (one colour each: the engine maps base colour -> vertex colour, emission -> glow) ----------------
MATS = {}
def mat(name, col, rough=0.8, metal=0.0, emit=None, strength=1.0, coat=0.0, extras=None):
    """A Principled material. The loader: metal>=.5 & rough<=.35 -> chrome gloss; coat>0 or rough<=.4 -> paint; rough<=.7
    -> satin; else matte. Emission: the vertex colour becomes the emission colour and glow = strength / 3 (4 = a full LED,
    1 = a soft glow). extras: burns_gloss (0..3), burns_e (0..1) override."""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    lin = srgb_lin(col)
    bsdf.inputs['Base Color'].default_value = (*lin, 1.0)
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metal
    if coat: bsdf.inputs['Coat Weight'].default_value = coat; bsdf.inputs['Coat Roughness'].default_value = 0.05
    if emit:
        bsdf.inputs['Emission Color'].default_value = (*srgb_lin(emit), 1.0)
        bsdf.inputs['Emission Strength'].default_value = strength
    else:
        bsdf.inputs['Emission Strength'].default_value = 0.0
    m.diffuse_color = (*lin, 1.0)
    for k, v in (extras or {}).items(): m[k] = v
    MATS[name] = m
    return m
def glowmat(name, col, strength=1.0, rough=0.4): return mat(name, col, rough=rough, emit=col, strength=strength)
def ledmat(col, strength=4.0): return mat('led_' + col.lstrip('#'), col, rough=0.3, emit=col, strength=strength)

# ---------------- primitives (engine space in, Blender-space bmesh out) ----------------
def capsule(p0, p1, r, r1=None, seg=16, cap=5, body=3):
    """A rounded limb from engine point p0 to p1: a cylinder (radius r at p0, r1 at p1) with hemispherical ends."""
    return limb(p0, p1, r, r1, seg, cap, body)[0]

def limb(p0, p1, r, r1=None, seg=16, cap=5, body=3, pattern=None):
    """capsule() that also returns per-face (t, angle) parameters: t runs 0 at p0 to 1 at p1 along the axis, angle 0..TAU
    around it (0 = the frame normal, which is engine 'up' or 'left' for a vertical limb). pattern(t, ang, c) -> material
    index sets each face's material_index (tattoo sleeves, striped robes); c is the face centre in engine space.
    Returns (bm, params)."""
    p0, p1 = E(*p0), E(*p1); r1 = r if r1 is None else r1
    axis = p1 - p0; L = axis.length; d = axis.normalized()
    q = d.to_track_quat('Z', 'Y'); R = q.to_matrix()
    rows = []
    for i in range(cap + 1):
        a = -math.pi / 2 + (i / cap) * math.pi / 2
        rows.append((r * math.cos(a), r * math.sin(a)))
    for i in range(1, body):
        t = i / body; rows.append((r + (r1 - r) * t, L * t))
    for i in range(cap + 1):
        a = (i / cap) * math.pi / 2
        rows.append((r1 * math.cos(a), L + r1 * math.sin(a)))
    bm = bmesh.new(); ring_prev = None; params = {}
    for k, (rr, h) in enumerate(rows):
        if rr < 1e-5:
            v = bm.verts.new(R @ Vector((0, 0, h)) + p0); ring = [v] * seg
        else:
            ring = [bm.verts.new(R @ Vector((rr * math.cos(j / seg * TAU), rr * math.sin(j / seg * TAU), h)) + p0) for j in range(seg)]
        if ring_prev:
            for j in range(seg):
                a, b = ring_prev[j], ring_prev[(j + 1) % seg]; c, dd = ring[(j + 1) % seg], ring[j]
                vs = []
                for v in (a, b, c, dd):
                    if v not in vs: vs.append(v)
                if len(vs) >= 3:
                    try: f = bm.faces.new(vs)
                    except ValueError: continue
                    hc = (rows[k - 1][1] + h) / 2; fc = f.calc_center_median()
                    params[f] = (max(0.0, min(1.0, hc / L)), ((j + 0.5) / seg * TAU) % TAU, (fc.x, fc.z, -fc.y))
        ring_prev = ring
    bm.normal_update()
    if pattern:
        for f, (t, ang, c) in params.items(): f.material_index = int(pattern(t, ang, c))
    return bm, params

def rbox(center, size, bevel, segments=3, taper=None):
    """A bevelled box: engine centre, size (w across x, h up, d along z); taper = (x, z) scale at the bottom."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    w, h, d = size
    for v in bm.verts:
        if taper is not None and v.co.z < 0: v.co.x *= taper[0]; v.co.y *= taper[1]
        v.co.x *= w; v.co.y *= d; v.co.z *= h
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * 0.45), offset_type='OFFSET', segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
    c = E(*center)
    for v in bm.verts: v.co += c
    bm.normal_update()
    return bm

def ellipsoid(center, rx, ry, rz, seg=24, rings=16, phi0=0.0, phi1=math.pi, M=None):
    """An ellipsoid (engine radii: rx across, ry up, rz along z) at an engine centre; phi0..phi1 (0 top .. pi bottom)
    for caps and domes; M = rot(yaw, pitch, roll) tilts it about its centre."""
    bm = bmesh.new(); prev = None
    for i in range(rings + 1):
        phi = phi0 + (phi1 - phi0) * i / rings
        z = math.cos(phi); rr = math.sin(phi)
        if rr < 1e-5:
            v = bm.verts.new(Vector((0, 0, z * ry))); ring = [v] * seg
        else:
            ring = [bm.verts.new(Vector((rx * rr * math.cos(j / seg * TAU), rz * rr * math.sin(j / seg * TAU), z * ry))) for j in range(seg)]
        if prev:
            for j in range(seg):
                vs = []
                for v in (prev[j], ring[j], ring[(j + 1) % seg], prev[(j + 1) % seg]):
                    if v not in vs: vs.append(v)
                if len(vs) >= 3:
                    try: bm.faces.new(vs)
                    except ValueError: pass
        prev = ring
    bmesh.ops.transform(bm, matrix=Matrix.Translation(E(*center)) @ (M or Matrix.Identity(4)), verts=bm.verts)
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def shell(bm, thickness):
    """Give an open sheet (a skirt, a cape, a hem) a back face so it survives back-face culling: a solidify by the
    vertex normals. Returns the same bm."""
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=thickness)
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def hair_sheet(center, rx, rz, y_top, y_bot, half_gap, thick, rows, seg, flare=0.015, wave=0.0):
    """A lofted sheet of hair hugging the back and sides of the head from y_top down to y_bot: an ellipse (rx, rz) about
    the engine centre's x/z, leaving a gap of `half_gap` (fraction of a turn each side of the front) for the face. It
    flares outward by `flare` at the bottom and is shelled `thick` so it survives back-face culling."""
    rows_pts = []
    for i in range(rows + 1):
        v = i / rows; y = y_top + (y_bot - y_top) * v; row = []
        for j in range(seg + 1):
            u = half_gap + (1 - 2 * half_gap) * j / seg          # fraction of a turn from the front, clockwise
            a = u * TAU; fx = rx + flare * v; fz = rz + flare * v
            w = wave * math.sin(a * 3 + v * 4) * v
            row.append((center[0] + (fx + w) * math.sin(a), y, center[2] + (fz + w) * math.cos(a)))
        rows_pts.append(row)
    bm = bm_loft(rows_pts, closed_u=False, closed_v=False, caps=False)
    return shell(bm, thick)

def bevel_all(bm, width, segments=2):
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=width, offset_type='OFFSET', segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
    bm.normal_update()
    return bm

def bm_xf(bm, M):
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); bm.normal_update(); return bm

def tilt(center, yaw=0.0, pitch=0.0, roll=0.0):
    """A matrix rotating about an engine point (for bm_xf): engine-style yaw/pitch/roll in radians."""
    c = E(*center)
    return Matrix.Translation(c) @ rot(yaw, pitch, roll) @ Matrix.Translation(-c)

# ---------------- the rig: bones, parts, weights ----------------
class Rig:
    def __init__(self, name, height=1.8, width=1.0, arm=1.0):
        self.name = name; self.height = height; self.k = height / 1.8
        self.bones = mixamo_bones(height, width, arm)
        self.extra = []            # extra bones (name, parent, head, tail) in engine space
        self.parts = []            # (name, bm, [materials], bones, soft, weight_fn)
        self.secondary = None      # fn(arm, f, t, pose, rig): keyframes the extra bones per frame
        self.hips = height / 1.8 * 0.98
        self.seat = height / 1.8 * 0.50   # hips height when seated (a 0.45 m seat)
        self.SEG = {}
        self._seg()
    def _seg(self):
        self.SEG = {b[0]: (E(*b[2]), E(*b[3])) for b in self.bones + self.extra}
    def extra_bones(self, bones):
        """Add secondary bones (hair, skirt, cape): (name, parent, head, tail) in engine space; parent may be a Mixamo
        name or another extra. They get the mixamorig: prefix too, so the engine keeps one namespace."""
        self.extra += list(bones); self._seg()
        n = len(self.bones) + len(self.extra)
        if n > 64: raise RuntimeError('%s: %d joints > 64' % (self.name, n))
    def joint(self, name):
        """The engine-space head of a bone."""
        b = self.SEG[name][0]; return (b.x, b.z, -b.y)
    def part(self, name, bm, mats, bones, soft=1.0, weight_fn=None):
        """A piece of the body: bm (Blender-space bmesh), one material or a list indexed by the faces' material_index,
        the bones allowed to deform it (the first is primary; weights come from the distance to the bone segments), and
        soft (falloff scale). weight_fn(p_engine) -> [(bone, w), …] overrides the weights per vertex."""
        self.parts.append((name, bm, mats if isinstance(mats, (list, tuple)) else [mats], bones, soft, weight_fn))

def seg_dist(p, a, b):
    ab = b - a; t = 0.0 if ab.length_squared < 1e-12 else max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length

def weights_for(rig, p, bones, soft):
    """Up to four (bone, weight) pairs for Blender point p from the distances to the allowed bone segments."""
    ws = []
    for i, b in enumerate(bones):
        a, t = rig.SEG[b]
        d = seg_dist(p, a, t)
        w = 1.0 / ((d / (0.06 * soft)) ** 2 + 1.0) ** 2 * (1.6 if i == 0 else 1.0)
        ws.append((b, w))
    ws.sort(key=lambda x: -x[1]); ws = ws[:4]
    top = ws[0][1]
    if top <= 0: return [(bones[0], 1.0)]
    ws = [(b, w) for b, w in ws if w > top * 0.03]
    tot = sum(w for _, w in ws)
    return [(b, w / tot) for b, w in ws]

def clear_scene():
    if bpy.app.background:
        bpy.ops.wm.read_factory_settings(use_empty=True)
    else:
        # Keep the live window/context valid when invoked from Blender's console.
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
        for obj in list(bpy.context.scene.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        for collection in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials):
            for block in list(collection):
                if block.users == 0: collection.remove(block)
        # Generated clips have fake users. Drop only orphaned kit clips so a second
        # character does not export the previous rig's actions or '.001' names.
        clip_names = {clip[0] for clip in CLIPS}
        for action in list(bpy.data.actions):
            if action.name.split('.')[0] in clip_names and action.users == int(action.use_fake_user):
                bpy.data.actions.remove(action)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.unit_settings.system = 'METRIC'
    MATS.clear()

def make_armature(rig):
    arm = bpy.data.armatures.new('Armature'); ob = bpy.data.objects.new('Armature', arm)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for name, parent, head, tail in rig.bones + rig.extra:
        b = arm.edit_bones.new(M + name); b.head = E(*head); b.tail = E(*tail); b.roll = 0.0
        if parent: b.parent = eb[parent]; b.use_connect = False
        eb[name] = b
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob

def make_mesh(rig, arm):
    bm = bmesh.new(); mesh = bpy.data.meshes.new(rig.name)
    mats = []; vert_bones = []
    for name, pbm, pmats, bones, soft, wfn in rig.parts:
        idx = []
        for m in pmats:
            if m not in mats: mats.append(m)
            idx.append(mats.index(m))
        pbm.verts.ensure_lookup_table(); pbm.verts.index_update()
        vmap = {}
        for v in pbm.verts:
            nv = bm.verts.new(v.co.copy()); vmap[v.index] = nv
            if wfn: vert_bones.append(wfn((v.co.x, v.co.z, -v.co.y)))
            else: vert_bones.append(weights_for(rig, v.co, bones, soft))
        for f in pbm.faces:
            try:
                nf = bm.faces.new([vmap[v.index] for v in f.verts]); nf.material_index = idx[min(f.material_index, len(idx) - 1)]; nf.smooth = True
            except ValueError: pass
        pbm.free()
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    bm.to_mesh(mesh); bm.free()
    for m in mats: mesh.materials.append(m)
    ob = bpy.data.objects.new(rig.name, mesh); bpy.context.collection.objects.link(ob)
    groups = {}
    for i, wl in enumerate(vert_bones):
        for b, w in wl:
            g = groups.get(b)
            if g is None: g = groups[b] = ob.vertex_groups.new(name=M + b)
            g.add([i], w, 'REPLACE')
    for p in mesh.polygons: p.use_smooth = True
    ob.parent = arm
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
    return ob

# ---------------- posing ----------------
REST = {}
def rest_mats(arm):
    for b in arm.data.bones: REST[b.name[len(M):]] = b.matrix_local.to_3x3()

def Rx(a): return Matrix.Rotation(a, 3, 'X')
def Ry(a): return Matrix.Rotation(a, 3, 'Y')
def Rz(a): return Matrix.Rotation(a, 3, 'Z')
def PRY(pitch=0.0, roll=0.0, yaw=0.0):
    """Blender-space rotation for an upright bone: pitch + = forward lean, roll + = lean to the left, yaw + = turn left."""
    return Rz(yaw) @ Ry(roll) @ Rx(pitch)

def set_rot(arm, bone, R, frame):
    """Pose `bone` by the armature-space rotation R (about its head, in its rest frame) and keyframe it."""
    pb = arm.pose.bones[M + bone]; Mr = REST[bone]
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (Mr.inverted() @ R @ Mr).to_quaternion()
    pb.keyframe_insert('rotation_quaternion', frame=frame)

def set_loc(rig, arm, bone, p_engine, frame):
    """Put `bone`'s head at the engine-space point."""
    pb = arm.pose.bones[M + bone]; Mr = REST[bone]
    pb.location = Mr.inverted() @ (E(*p_engine) - rig.SEG[bone][0])
    pb.keyframe_insert('location', frame=frame)

class Pose:
    """One frame of a clip. Angles in radians. Arms: lift (0 = T-pose, pi/2 = hanging, -pi/2 = straight up), swing
    (forward +, after the lift), inward (toward the body's centre line, for a forward arm), flex (elbow: hand comes
    forward when hanging, up when the arm is forward), flexout (elbow bend the other way: hand out to the side),
    hand (wrist curl), twist (upper arm roll). Legs: thigh forward +, knee bend +, foot toes-down +, spread outward +."""
    def __init__(self):
        self.hips = (0.0, 0.0, 0.0); self.hipsR = (0.03, 0.0, 0.0)
        self.spine = (0.0, 0.0, 0.0); self.spine1 = (0.0, 0.0, 0.0); self.spine2 = (0.0, 0.0, 0.0)
        self.neck = (0.0, 0.0, 0.0); self.head = (0.03, 0.0, 0.0)
        self.shoulders = (0.05, 0.05)
        self.armL = dict(lift=1.25, swing=0.0, inward=0.0, flex=0.25, flexout=0.0, hand=0.0, twist=0.0)
        self.armR = dict(lift=1.25, swing=0.0, inward=0.0, flex=0.25, flexout=0.0, hand=0.0, twist=0.0)
        self.legL = dict(thigh=0.02, knee=0.05, foot=0.0, spread=0.0); self.legR = dict(thigh=0.02, knee=0.05, foot=0.0, spread=0.0)
        self.toes = 0.0
        self.ctx = {}      # hints for secondary motion: gait (0 idle, 1 walk, 2 run), phase, flutter, lying, seated
    def arm(self, side, **kw):
        (self.armL if side == 'L' else self.armR).update(kw)
    def arms(self, **kw):
        self.armL.update(kw); self.armR.update(kw)
    def leg(self, side, **kw):
        (self.legL if side == 'L' else self.legR).update(kw)
    def legs(self, **kw):
        self.legL.update(kw); self.legR.update(kw)

def apply_pose(rig, arm, f, P):
    hx, hy, hz = P.hips
    set_loc(rig, arm, 'Hips', (hx, rig.hips + hy, hz), f)
    set_rot(arm, 'Hips', PRY(*P.hipsR), f)
    for b, v in (('Spine', P.spine), ('Spine1', P.spine1), ('Spine2', P.spine2), ('Neck', P.neck), ('Head', P.head)):
        set_rot(arm, b, PRY(*v), f)
    set_rot(arm, 'HeadTop_End', Matrix.Identity(3), f)
    set_rot(arm, 'LeftShoulder', Rz(-P.shoulders[0]), f); set_rot(arm, 'RightShoulder', Rz(P.shoulders[1]), f)
    for side, s, A in (('Left', 1, P.armL), ('Right', -1, P.armR)):
        R = Rz(-s * A['inward']) @ Rx(-A['swing']) @ Ry(s * A['lift']) @ Rx(s * A.get('twist', 0.0) * 0)
        set_rot(arm, side + 'Arm', R, f)
        set_rot(arm, side + 'ForeArm', Rz(-s * A['flex']) @ Ry(-s * A['flexout']), f)
        set_rot(arm, side + 'Hand', Rz(-s * A['hand']), f)
    for side, s, L in (('Left', 1, P.legL), ('Right', -1, P.legR)):
        set_rot(arm, side + 'UpLeg', Ry(-s * L['spread']) @ Rx(-L['thigh']), f)
        set_rot(arm, side + 'Leg', Rx(L['knee']), f)
        set_rot(arm, side + 'Foot', Rx(L['foot']), f)
        set_rot(arm, side + 'ToeBase', Rx(P.toes), f); set_rot(arm, side + 'Toe_End', Matrix.Identity(3), f)
    # extra bones: rest first, then the character's secondary motion
    for name, parent, head, tail in rig.extra:
        set_rot(arm, name, Matrix.Identity(3), f)

def hang(P, lift=1.22, flex=0.25):
    P.arms(lift=lift, swing=0.0, inward=0.0, flex=flex, flexout=0.0, hand=0.0)

def seated(P, rig, lean=0.08, knee=1.5):
    """Sitting on a 0.45 m seat: thighs forward, shins down, hips lowered."""
    P.hips = (0.0, rig.seat - rig.hips, 0.0)
    P.hipsR = (-0.05 + lean, 0.0, 0.0)
    P.legs(thigh=1.45, knee=knee, foot=0.25, spread=0.12)
    P.ctx['seated'] = True

# ---------------- the clips ----------------
def clip_idle(P, t, rig):
    s = math.sin(t * TAU / 2.5); s2 = math.sin(t * TAU / 2.5 * 2 + 0.7)
    P.hips = (0.012 * s, 0.004 * s2, 0.0); P.hipsR = (0.02, 0.03 * s, 0.02 * s)
    P.spine = (-0.02 * s2, -0.02 * s, 0); P.spine1 = (-0.03 * s2, -0.02 * s, 0); P.spine2 = (-0.025 * s2, -0.01 * s, 0)
    P.neck = (0.03 * s2, 0, 0); P.head = (0.03 + 0.02 * s2, 0, 0.04 * math.sin(t * TAU / 2.5 + 1.5))
    hang(P, 1.22 + 0.02 * s2, 0.22 + 0.03 * s2)
    P.arms(swing=0.03 * s2)
    P.leg('L', thigh=0.02 + 0.02 * s, knee=0.05 + 0.03 * s); P.leg('R', thigh=0.02 - 0.02 * s, knee=0.05 - 0.03 * s)
    P.ctx.update(gait=0, phase=t * TAU / 2.5)

def gait(P, t, rig, period, stride, bob, lean, armswing, knee_k, run=False):
    ph = t * TAU / period; pl, pr = ph, ph + math.pi
    def leg(p):
        thigh = stride * math.sin(p)
        swing = max(0.0, math.cos(p - 0.35))
        knee = 0.1 + knee_k * swing ** 1.6
        foot = 0.3 * max(0.0, -math.sin(p + 0.6)) - 0.15 * max(0.0, math.sin(p - 0.3))
        return thigh, knee, foot
    tl, kl, fl = leg(pl); tr, kr, fr = leg(pr)
    P.leg('L', thigh=tl, knee=kl, foot=fl); P.leg('R', thigh=tr, knee=kr, foot=fr)
    b = bob * abs(math.cos(ph))
    P.hips = (0.0, -0.015 * rig.k + b, 0.0); P.hipsR = (lean, 0.0, -0.06 * math.sin(ph))
    P.spine = (0.02, -0.03 * math.sin(ph), 0.02 * math.sin(ph)); P.spine1 = (0.0, -0.04 * math.sin(ph), 0.03 * math.sin(ph))
    P.spine2 = (-0.02 + lean * 0.5, -0.05 * math.sin(ph), 0.04 * math.sin(ph))
    P.neck = (0.02, 0, 0); P.head = (0.02 + 0.015 * math.cos(2 * ph), 0, -0.03 * math.sin(ph))
    hang(P, 1.2 if not run else 1.1)
    P.arm('L', swing=armswing * math.sin(pr), flex=(0.3 + 0.2 * max(0.0, math.sin(pr))) if not run else 1.3)
    P.arm('R', swing=armswing * math.sin(pl), flex=(0.3 + 0.2 * max(0.0, math.sin(pl))) if not run else 1.3)
    P.ctx.update(gait=2 if run else 1, phase=ph, legL=tl, legR=tr)

def clip_walk(P, t, rig): gait(P, t, rig, 1.0, 0.5, 0.025, 0.05, 0.45, 0.95)
def clip_run(P, t, rig):
    gait(P, t, rig, 0.8, 0.75, 0.05, 0.22, 0.7, 1.4, run=True)
    P.hips = (0.0, -0.03 * rig.k + 0.05 * abs(math.cos(P.ctx['phase'])), 0.0)

def clip_jump(P, t, rig):
    # 1.0 s, not looped: crouch (0-0.25), launch (0.25-0.4), tuck in the air (0.4-0.8), extend for the landing
    if t < 0.25:
        k = sstep(t / 0.25); P.hips = (0, -0.22 * k * rig.k, 0); P.hipsR = (0.35 * k, 0, 0)
        P.legs(thigh=0.9 * k, knee=1.5 * k, foot=0.1 * k); P.spine1 = (0.15 * k, 0, 0); P.spine2 = (0.1 * k, 0, 0); P.head = (-0.2 * k, 0, 0)
        hang(P, 1.1, 0.4); P.arms(swing=-0.9 * k)
    elif t < 0.4:
        k = sstep((t - 0.25) / 0.15)
        P.hips = (0, (-0.22 + 0.62 * k) * rig.k, 0); P.hipsR = (0.35 - 0.3 * k, 0, 0)
        P.legs(thigh=0.9 - 1.0 * k, knee=1.5 - 1.4 * k, foot=0.1 + 0.5 * k); P.spine1 = (0.15 - 0.15 * k, 0, 0); P.head = (-0.2 + 0.1 * k, 0, 0)
        hang(P, 1.1 - 1.9 * k, 0.4 - 0.2 * k); P.arms(swing=-0.9 + 0.9 * k)
    elif t < 0.8:
        k = sstep((t - 0.4) / 0.2) * (1 - sstep((t - 0.65) / 0.15))
        P.hips = (0, (0.40 + 0.1 * math.sin((t - 0.4) / 0.4 * math.pi)) * rig.k, 0); P.hipsR = (0.05 + 0.3 * k, 0, 0)
        P.legs(thigh=-0.1 + 1.3 * k, knee=0.1 + 1.6 * k, foot=0.6 - 0.3 * k); P.spine1 = (0.1 * k, 0, 0); P.head = (-0.1, 0, 0)
        hang(P, -0.8 + 1.2 * k, 0.2 + 0.6 * k); P.arms(swing=0.0 + 0.4 * k)
    else:
        k = sstep((t - 0.8) / 0.2)
        P.hips = (0, (0.40 - 0.4 * k) * rig.k, 0); P.hipsR = (0.05 + 0.1 * k, 0, 0)
        P.legs(thigh=-0.1 + 0.3 * k, knee=0.1 + 0.3 * k, foot=0.3 - 0.4 * k); P.head = (-0.1 + 0.1 * k, 0, 0)
        hang(P, 0.4 + 0.8 * k, 0.5); P.arms(swing=0.4 * (1 - k))
    P.ctx.update(gait=0, phase=t * TAU, flutter=1.0 if 0.3 < t < 0.9 else 0.0)

def clip_land(P, t, rig):
    k = math.sin(min(1.0, t / 0.5) * math.pi)      # knees absorb, then stand
    P.hips = (0, -0.18 * k * rig.k, 0); P.hipsR = (0.25 * k, 0, 0)
    P.legs(thigh=0.8 * k, knee=1.3 * k, foot=0.1 * k, spread=0.1 * k); P.spine1 = (0.12 * k, 0, 0); P.head = (-0.1 * k, 0, 0)
    hang(P, 1.0 + 0.2 * (1 - k), 0.5); P.arms(swing=0.5 * k, flexout=0.3 * k)
    P.ctx.update(gait=0, phase=0.0, flutter=k)

def clip_hurt(P, t, rig):
    k = math.sin(min(1.0, t / 0.6) * math.pi)
    P.hips = (0, -0.03 * k, -0.08 * k); P.hipsR = (-0.15 * k, 0, 0.1 * k)
    P.spine1 = (-0.15 * k, 0, 0.15 * k); P.spine2 = (-0.1 * k, 0, 0); P.head = (-0.25 * k, 0.1 * k, -0.2 * k)
    P.legs(thigh=0.15 * k, knee=0.3 * k, spread=0.1 * k)
    hang(P, 1.0, 0.9 * k + 0.25); P.arms(swing=0.5 * k, flexout=0.4 * k)
    P.ctx.update(gait=0, phase=0.0, flutter=k)

def clip_knocked(P, t, rig):
    # 0.9 s: flail (0-0.35), fall back (0.35-0.75), lie (0.75-0.9)
    a = sstep(t / 0.35); b = sstep((t - 0.35) / 0.4)
    P.hips = (0, (-0.02 * a - (rig.hips - 0.22 * rig.k) * b), -0.1 * a - 0.5 * b); P.hipsR = (-0.2 * a - 1.25 * b, 0, 0.05 * a)
    P.spine1 = (-0.1 * a - 0.05 * b, 0, 0); P.spine2 = (-0.1 * a, 0, 0); P.head = (-0.3 * a + 0.3 * b, 0, 0.1 * a)
    P.legs(thigh=0.3 * a + 0.6 * b, knee=0.4 * a + 0.9 * b, foot=0.3 * b, spread=0.15)
    hang(P, 0.4 + 0.3 * b, 0.7); P.arms(swing=0.9 * a - 0.4 * b, flexout=0.3 * a)
    P.arm('L', swing=0.9 * a - 0.6 * b + 0.2 * math.sin(t * 30)); P.arm('R', swing=0.8 * a - 0.3 * b + 0.2 * math.cos(t * 28))
    P.ctx.update(gait=0, phase=0.0, flutter=a * (1 - b), lying=b)

def clip_dance(P, t, rig):
    ph = t * TAU / 1.0; s = math.sin(ph); c = math.cos(ph); s2 = math.sin(t * TAU / 2.0)
    P.hips = (0.06 * s2, -0.05 * rig.k + 0.03 * abs(c), 0.0); P.hipsR = (0.05, 0.08 * s2, 0.15 * s)
    P.spine = (0.03, -0.05 * s2, -0.08 * s); P.spine1 = (0.02, -0.05 * s2, -0.1 * s); P.spine2 = (-0.02, -0.03 * s2, -0.1 * s)
    P.neck = (0.0, 0.05 * s2, 0.0); P.head = (0.05 + 0.08 * c, 0.1 * s2, 0.2 * s)
    P.leg('L', thigh=0.2 + 0.15 * s, knee=0.35 + 0.25 * abs(c), foot=0.1, spread=0.15); P.leg('R', thigh=0.2 - 0.15 * s, knee=0.35 + 0.25 * abs(c), foot=0.1, spread=0.15)
    P.arm('L', lift=0.3 - 0.5 * s2, swing=0.6 + 0.3 * s, inward=0.3, flex=1.6 + 0.4 * c, flexout=0.2, hand=0.3 * s)
    P.arm('R', lift=0.3 + 0.5 * s2, swing=0.6 - 0.3 * s, inward=0.3, flex=1.6 - 0.4 * c, flexout=0.2, hand=-0.3 * s)
    P.ctx.update(gait=1, phase=ph, flutter=0.6, legL=P.legL['thigh'], legR=P.legR['thigh'])

def clip_wave(P, t, rig):
    s = math.sin(t * TAU / 1.4); w = math.sin(t * TAU * 2.15)     # three wags in 1.4 s
    P.hips = (0, 0.003 * s, 0); P.hipsR = (0.02, 0.03, 0.0)
    P.spine = (0, 0.03, 0); P.spine1 = (-0.02, 0.04, 0); P.spine2 = (-0.03, 0.05, 0)
    P.neck = (0, -0.05, 0); P.head = (0.03 + 0.03 * s, -0.1, -0.05)
    hang(P); P.arm('L', swing=0.05)
    P.arm('R', lift=-0.55 - 0.05 * s, swing=0.25, inward=0.1, flex=0.0, flexout=0.9 + 0.3 * w, hand=0.3 * w)
    P.leg('L', thigh=0.02, knee=0.05); P.leg('R', thigh=-0.03, knee=0.06)
    P.ctx.update(gait=0, phase=t * TAU / 1.4)

def clip_talk(P, t, rig):
    s = math.sin(t * TAU / 2.0); s3 = math.sin(t * TAU / 2.0 * 3); c2 = math.cos(t * TAU / 2.0 * 2 + 0.5)
    P.hips = (0.01 * s, 0.003 * s3, 0); P.hipsR = (0.03, 0.02 * s, 0.03 * s)
    P.spine1 = (0.02, -0.02 * s, 0.04 * s); P.spine2 = (-0.02, 0, 0.04 * s)
    P.neck = (0.02, 0, 0); P.head = (0.05 + 0.06 * s3, 0.08 * s, 0.08 * c2)
    hang(P, 1.1, 0.4)
    P.arm('L', lift=1.0 + 0.1 * s, swing=0.5 + 0.25 * s3, inward=0.3, flex=1.3 + 0.3 * c2, flexout=0.3, hand=0.2 * s3)
    P.arm('R', lift=1.0 - 0.1 * s, swing=0.45 - 0.25 * s3, inward=0.25, flex=1.2 - 0.3 * c2, flexout=0.3, hand=-0.2 * s3)
    P.ctx.update(gait=0, phase=t * TAU / 2.0)

def clip_hug(P, t, rig):
    k = math.sin(min(1.0, t / 1.6) * math.pi)      # arms open wide, then close, 1.6 s
    close = sstep((t - 0.7) / 0.6) * (1 - sstep((t - 1.35) / 0.25))
    P.hips = (0, -0.01 * k, 0.03 * k); P.hipsR = (0.08 * k, 0, 0)
    P.spine1 = (0.08 * k, 0, 0); P.spine2 = (0.06 * k, 0, 0); P.head = (0.1 * k + 0.1 * close, 0.15 * close, 0)
    P.legs(thigh=0.05 * k, knee=0.08 * k)
    P.arms(lift=0.15 + 0.4 * close, swing=0.7 * k + 0.7 * close, inward=0.1 + 0.7 * close, flex=0.2 + 1.1 * close, flexout=0.1 * k)
    P.ctx.update(gait=0, phase=t * TAU / 1.6, flutter=0.3 * k)

def clip_sit(P, t, rig):
    s = math.sin(t * TAU / 2.5)
    seated(P, rig); P.hips = (0, rig.seat - rig.hips + 0.003 * s, 0)
    P.spine1 = (0.06, 0, 0.02 * s); P.spine2 = (-0.03 * s, 0, 0); P.head = (0.05 + 0.03 * s, 0, 0.1 * s)
    P.arms(lift=1.1, swing=0.9, inward=0.1, flex=0.5 + 0.05 * s, flexout=0.0, hand=0.2)
    P.ctx.update(gait=0, phase=t * TAU / 2.5)

def clip_sleep(P, t, rig):
    s = math.sin(t * TAU / 2.5)
    # lying curled on the right side, head toward +z (forward), 0.3 m off the ground at the hips
    P.hips = (0.0, 0.21 * rig.k - rig.hips, 0.0); P.hipsR = (1.45, 1.45, 0.0)
    P.spine = (0.25 + 0.02 * s, 0, 0); P.spine1 = (0.3, 0, 0); P.spine2 = (0.2 + 0.02 * s, 0, 0); P.neck = (0.15, 0, 0); P.head = (0.25, 0, 0)
    P.leg('L', thigh=1.5, knee=1.9, foot=0.4, spread=0.0); P.leg('R', thigh=1.35, knee=1.8, foot=0.4, spread=0.0)
    P.arm('L', lift=0.6, swing=1.35, inward=0.3, flex=2.1 + 0.05 * s, flexout=0.0, hand=0.3)
    P.arm('R', lift=1.0, swing=1.4, inward=0.1, flex=1.6, flexout=0.0, hand=0.3)
    P.ctx.update(gait=0, phase=t * TAU / 2.5, lying=1.0)

def clip_cheer(P, t, rig):
    ph = t * TAU / 1.0; b = abs(math.sin(ph)); s = math.sin(ph)
    P.hips = (0.0, -0.02 * rig.k + 0.05 * b, 0); P.hipsR = (-0.05, 0.0, 0.0)
    P.spine1 = (-0.08, 0, 0); P.spine2 = (-0.1, 0, 0); P.head = (-0.25 + 0.05 * b, 0, 0.05 * s)
    P.legs(thigh=0.1 + 0.2 * (1 - b), knee=0.2 + 0.35 * (1 - b), foot=-0.1 * b, spread=0.15)
    P.arms(lift=-1.1 - 0.15 * b, swing=0.3, inward=-0.2, flex=0.3 + 0.3 * (1 - b), flexout=0.0, hand=0.2 * s)
    P.ctx.update(gait=1, phase=ph, flutter=0.5, legL=P.legL['thigh'], legR=P.legR['thigh'])

def drive_pose(P, t, rig):
    s = math.sin(t * TAU / 2.0); b = math.sin(t * TAU / 0.5)
    seated(P, rig, lean=0.12); P.hips = (0, rig.seat - rig.hips + 0.006 * b, 0)
    P.spine1 = (0.08, 0, 0.02 * s); P.spine2 = (0.0, 0, 0); P.head = (0.05 + 0.02 * b, 0.0, 0.08 * s)
    # hands forward on a wheel at chest height, elbows a little bent
    P.arms(lift=1.0, swing=1.25, inward=0.35, flex=0.45, flexout=0.0, hand=0.4)
    P.arm('L', inward=0.35 + 0.08 * s); P.arm('R', inward=0.35 - 0.08 * s)
    P.ctx.update(gait=0, phase=t * TAU / 2.0)

def clip_drive(P, t, rig): drive_pose(P, t, rig)

def clip_fire(P, t, rig):
    drive_pose(P, t * 0.4, rig)
    k = math.sin(min(1.0, t / 0.8) * math.pi) ** 0.6
    P.arm('R', lift=1.0 - 2.1 * k, swing=1.25 - 0.9 * k, inward=0.35 - 0.3 * k, flex=0.45 + 0.6 * k * (1 - k), flexout=0.0, hand=0.8 * k)
    P.spine2 = (-0.08 * k, 0.08 * k, 0.1 * k); P.head = (-0.2 * k, 0.05 * k, 0.1 * k)
    P.ctx.update(gait=0, phase=t * TAU / 0.8, flutter=0.3 * k)

def clip_sulk(P, t, rig):
    s = math.sin(t * TAU / 2.5)
    seated(P, rig, lean=0.22); P.hips = (0, rig.seat - rig.hips + 0.002 * s, 0)
    P.spine = (0.12, 0, 0); P.spine1 = (0.2, 0, 0); P.spine2 = (0.15 + 0.02 * s, 0, 0); P.neck = (0.1, 0, 0); P.head = (0.3, 0.1 * s, 0.1 * s)
    P.arms(lift=1.0, swing=1.1, inward=0.3, flex=1.9, flexout=0.0, hand=0.2)
    P.arm('R', flex=1.5, inward=0.1)
    P.ctx.update(gait=0, phase=t * TAU / 2.5)

def clip_captive(P, t, rig):
    s = math.sin(t * TAU / 2.5); c = math.cos(t * TAU / 2.5); s2 = math.sin(t * TAU / 2.5 * 2)
    P.hips = (0.01 * s, 0.003 * s2, 0); P.hipsR = (0.0, 0.02 * s, 0.0)
    P.spine1 = (-0.03, 0, 0.05 * s); P.spine2 = (-0.05, 0, 0.05 * s); P.neck = (0, 0, 0.1 * s); P.head = (0.02, 0.06 * c, 0.5 * s)
    # hands clasped behind the back: arms hang a little crossed, swing back, forearms bend in toward the spine
    P.arms(lift=1.45, swing=-0.45, inward=0.0, flex=0.15, flexout=-1.1, hand=0.3)
    P.legs(thigh=0.03, knee=0.06, spread=0.05)
    P.ctx.update(gait=0, phase=t * TAU / 2.5)

def clip_photo(P, t, rig):
    s = math.sin(t * TAU / 2.0)
    P.hips = (0.03, 0.002 * s, 0); P.hipsR = (0.02, 0.05, 0.08)
    P.spine = (0, 0.03, 0.03); P.spine1 = (-0.02, 0.04, 0.03); P.spine2 = (-0.04, 0.04, 0.0)
    P.neck = (0, -0.06, 0); P.head = (0.02 + 0.02 * s, -0.18, -0.1)
    hang(P, 1.15, 0.3); P.arm('L', swing=0.05, inward=0.05)
    # the peace sign: the right hand up beside the cheek
    P.arm('R', lift=0.95, swing=1.15 + 0.03 * s, inward=0.75, flex=2.25, flexout=0.0, hand=-0.4)
    P.leg('L', thigh=0.02, knee=0.05, spread=0.05); P.leg('R', thigh=-0.08, knee=0.3, foot=0.3, spread=0.2)
    P.ctx.update(gait=0, phase=t * TAU / 2.0)

CLIPS = [('idle', 2.5, clip_idle), ('walk', 1.0, clip_walk), ('run', 0.8, clip_run), ('jump', 1.0, clip_jump), ('land', 0.5, clip_land),
         ('hurt', 0.6, clip_hurt), ('knocked', 0.9, clip_knocked), ('dance', 2.0, clip_dance), ('wave', 1.4, clip_wave), ('talk', 2.0, clip_talk),
         ('hug', 1.6, clip_hug), ('sit', 2.5, clip_sit), ('sleep', 2.5, clip_sleep), ('cheer', 1.0, clip_cheer), ('drive', 2.0, clip_drive),
         ('fire', 0.8, clip_fire), ('sulk', 2.5, clip_sulk), ('captive', 2.5, clip_captive), ('photo', 2.0, clip_photo)]
LOOPS = {'idle', 'walk', 'run', 'dance', 'wave', 'talk', 'sit', 'sleep', 'cheer', 'drive', 'sulk', 'captive', 'photo'}

def make_clips(rig, arm, clips=None):
    rest_mats(arm)
    if not arm.animation_data: arm.animation_data_create()
    ad = arm.animation_data
    actions = []
    for name, dur, fn in (clips or CLIPS):
        act = bpy.data.actions.new(name); act.use_fake_user = True
        ad.action = act
        if hasattr(act, 'slots') and hasattr(ad, 'action_slot'):
            slot = act.slots.new(id_type='OBJECT', name=arm.name) if not len(act.slots) else act.slots[0]
            ad.action_slot = slot
        n = int(round(dur * FPS)); loop = name in LOOPS
        for k in range(n + 1):        # loops: the last frame repeats the first, so they are seamless
            t = ((k % n) / FPS) if loop else min(k, n) / FPS
            P = Pose(); fn(P, t, rig)
            apply_pose(rig, arm, k + 1, P)
            if rig.secondary: rig.secondary(arm, k + 1, t, P, rig)
        act.frame_range = (1, n + 1)
        if hasattr(act, 'use_frame_range'): act.use_frame_range = True
        actions.append((name, act, n))
    ad.action = None
    for name, act, n in actions:
        tr = ad.nla_tracks.new(); tr.name = name
        st = tr.strips.new(name, 1, act); st.name = name
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    return actions

def export(arm, mesh, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True); mesh.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=False, export_yup=True,
                              export_extras=True, export_materials='EXPORT', export_normals=True, export_animations=True,
                              export_animation_mode='ACTIONS', export_force_sampling=True, export_optimize_animation_size=False,
                              export_skins=True, export_def_bones=False, export_rest_position_armature=True,
                              export_lights=False, export_cameras=False, export_image_format='NONE', export_tangents=False)
    return os.path.getsize(path)

def preview(arm, mesh, path, clip=None, frame=1, view=(0.35, -1, 0.25), dist=1.15, size=(700, 900), look=None, samples=16):
    """An EEVEE render of the character (optionally posed by `clip` at `frame`) from a Blender-space direction."""
    sc = bpy.context.scene
    ad = arm.animation_data
    for tr in ad.nla_tracks: tr.mute = True
    if clip:
        act = bpy.data.actions[clip]; ad.action = act
        if hasattr(act, 'slots') and hasattr(ad, 'action_slot'): ad.action_slot = act.slots[0]
        sc.frame_set(frame)
    else:
        ad.action = None; sc.frame_set(1)
        for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    dg = bpy.context.evaluated_depsgraph_get(); me = mesh.evaluated_get(dg).to_mesh()
    for v in me.vertices:
        w = mesh.matrix_world @ v.co
        lo = Vector(min(lo[i], w[i]) for i in range(3)); hi = Vector(max(hi[i], w[i]) for i in range(3))
    mesh.evaluated_get(dg).to_mesh_clear()
    c = Vector(look) if look else (lo + hi) / 2; ext = max((hi - lo).length, 0.5) * dist
    cam = bpy.data.objects.get('__cam')
    if cam is None: cam = bpy.data.objects.new('__cam', bpy.data.cameras.new('__cam')); sc.collection.objects.link(cam)
    d = Vector(view).normalized(); cam.location = c + d * ext; cam.data.lens = 50
    cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler(); sc.camera = cam
    sun = bpy.data.objects.get('__sun')
    if sun is None:
        sun = bpy.data.objects.new('__sun', bpy.data.lights.new('__sun', 'SUN')); sc.collection.objects.link(sun)
        sun.data.energy = 3.5; sun.data.angle = math.radians(8); sun.data.color = (1.0, 0.93, 0.82)
    sun.location = c + Vector((0.6, -0.8, 1.0)) * 3; sun.rotation_euler = (c - sun.location).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world or bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (0.36, 0.33, 0.4, 1); bg.inputs[1].default_value = 1.0
    sc.render.resolution_x, sc.render.resolution_y = size; sc.render.resolution_percentage = 100
    try: sc.eevee.taa_render_samples = samples
    except Exception: pass
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    ad.action = None
    for tr in ad.nla_tracks: tr.mute = False
    return path

def build(rig, out_glb=None, out_blend=None, previews=None, height=None):
    """Assemble, weight, animate and export the rig. previews: [(path, clip, frame, view, dist, look), …] EEVEE shots."""
    arm = make_armature(rig)
    arm['burns_character'] = rig.name
    mesh = make_mesh(rig, arm)
    mesh['burns_height'] = float(height or rig.height); mesh['burns_character'] = rig.name
    make_clips(rig, arm)
    tris = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    out_glb = out_glb or os.path.join(MODELS, rig.name + '.glb')
    size = export(arm, mesh, out_glb)
    print('%s: %d triangles, %d vertices, %d joints, %d clips %s -> %s (%d KB)' % (rig.name, tris, len(mesh.data.vertices), len(arm.data.bones), len(CLIPS), [c[0] for c in CLIPS], out_glb, size // 1024))
    for pv in (previews or []):
        preview(arm, mesh, pv[0], clip=pv[1], frame=pv[2], view=pv[3], dist=pv[4], look=pv[5])
    if out_blend:
        os.makedirs(os.path.dirname(out_blend), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=out_blend, compress=True)
    return dict(tris=tris, verts=len(mesh.data.vertices), joints=len(arm.data.bones), bytes=size, arm=arm, mesh=mesh)

