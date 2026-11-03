# Mannequin: the placeholder skinned character for the Burns engine's glTF skinning path (BurnsSkin,
# docs/BURNS_GUIDE.md §6.9). A simple rounded humanoid (black tee, jeans, white sneakers, sunglasses, a bun) on an
# armature with Mixamo bone NAMES and hierarchy, procedural skin weights, and three keyframed clips (idle, walk, wave)
# exported as glTF animations. Brady's real character, rigged by Mixamo, drops in with the same bone names.
#
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/mannequin.py
# Writes assets/models/shared/mannequin.glb (about 7k triangles, 25 joints, 3 clips). Set BRADY_ROOT to override
# the repo root, MANNEQUIN_OUT for another output path.
#
# Coordinates: authored in Blender space (Z up, the figure faces -Y, its LEFT is +X); the exporter's +Y-up conversion
# gives the engine's convention (faces +Z, +X is its left), the same as Mixamo's rigs. Units are metres, feet on z = 0.
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Quaternion

ROOT = os.environ.get('BRADY_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.environ.get('MANNEQUIN_OUT') or os.path.join(ROOT, 'assets', 'models', 'shared', 'mannequin.glb')
FPS = 30
TAU = math.tau

# ---------------- the Mixamo skeleton (name, parent, head, tail) in Blender space ----------------
# Heads are the joints; tails only orient the bones. T-pose, like Mixamo's rigs.
M = 'mixamorig:'
BONES = [
    ('Hips', None, (0, 0, 0.98), (0, 0, 1.08)),
    ('Spine', 'Hips', (0, 0, 1.08), (0, 0, 1.20)),
    ('Spine1', 'Spine', (0, 0, 1.20), (0, 0, 1.33)),
    ('Spine2', 'Spine1', (0, 0, 1.33), (0, 0, 1.47)),
    ('Neck', 'Spine2', (0, 0, 1.47), (0, 0, 1.56)),
    ('Head', 'Neck', (0, 0, 1.56), (0, 0, 1.70)),
    ('HeadTop_End', 'Head', (0, 0, 1.70), (0, 0, 1.80)),
]
for side, s in (('Left', 1), ('Right', -1)):
    BONES += [
        (side + 'Shoulder', 'Spine2', (s * 0.05, 0, 1.44), (s * 0.19, 0, 1.43)),
        (side + 'Arm', side + 'Shoulder', (s * 0.19, 0, 1.43), (s * 0.46, 0, 1.43)),
        (side + 'ForeArm', side + 'Arm', (s * 0.46, 0, 1.43), (s * 0.72, 0, 1.43)),
        (side + 'Hand', side + 'ForeArm', (s * 0.72, 0, 1.43), (s * 0.88, 0, 1.43)),
        (side + 'UpLeg', 'Hips', (s * 0.10, 0, 0.95), (s * 0.10, 0, 0.50)),
        (side + 'Leg', side + 'UpLeg', (s * 0.10, 0, 0.50), (s * 0.10, 0, 0.09)),
        (side + 'Foot', side + 'Leg', (s * 0.10, 0, 0.09), (s * 0.10, -0.12, 0.02)),
        (side + 'ToeBase', side + 'Foot', (s * 0.10, -0.12, 0.02), (s * 0.10, -0.20, 0.01)),
        (side + 'Toe_End', side + 'ToeBase', (s * 0.10, -0.20, 0.01), (s * 0.10, -0.25, 0.01)),
    ]
SEG = {b[0]: (Vector(b[2]), Vector(b[3])) for b in BONES}

# ---------------- materials ----------------
def mat(name, col, rough=0.8, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    c = col.lstrip('#'); rgb = [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in rgb]
    bsdf.inputs['Base Color'].default_value = (lin[0], lin[1], lin[2], 1.0)
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metal
    m.diffuse_color = (lin[0], lin[1], lin[2], 1.0)
    return m
MATS = {}
def material(key):
    if key not in MATS:
        MATS[key] = {
            'skin': lambda: mat('skin', '#d9a07a', rough=0.75),
            'tee': lambda: mat('tee_black', '#1b1a20', rough=0.9),
            'jeans': lambda: mat('jeans', '#2d3a5e', rough=0.85),
            'shoe': lambda: mat('sneaker_white', '#e8e6e2', rough=0.5),
            'sole': lambda: mat('sneaker_sole', '#d8d4cc', rough=0.7),
            'hair': lambda: mat('hair', '#2a1a12', rough=0.65),
            'shades': lambda: mat('sunglasses', '#0c0c10', rough=0.22),
            'stubble': lambda: mat('stubble', '#b98864', rough=0.8),
        }[key]()
    return MATS[key]

# ---------------- bmesh primitives (Blender space) ----------------
def bm_capsule(p0, p1, r, seg=16, cap=5, body=3, r1=None):
    """A rounded limb from p0 to p1: a cylinder (radius r at p0, r1 at p1) with hemispherical ends."""
    p0, p1 = Vector(p0), Vector(p1); r1 = r if r1 is None else r1
    axis = p1 - p0; L = axis.length; d = axis.normalized()
    q = d.to_track_quat('Z', 'Y'); R = q.to_matrix()
    rows = []   # (radius, height along axis)
    for i in range(cap + 1):
        a = -math.pi / 2 + (i / cap) * math.pi / 2
        rows.append((r * math.cos(a), r * math.sin(a)))
    for i in range(1, body):
        t = i / body; rows.append((r + (r1 - r) * t, L * t))
    for i in range(cap + 1):
        a = (i / cap) * math.pi / 2
        rows.append((r1 * math.cos(a), L + r1 * math.sin(a)))
    bm = bmesh.new(); ring_prev = None
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
                    try: bm.faces.new(vs)
                    except ValueError: pass
        ring_prev = ring
    bm.normal_update()
    return bm

def bm_rbox(center, size, bevel, segments=3, taper=None):
    """A bevelled box; taper = (x scale at the bottom, y scale at the bottom) for chests and hips."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    for v in bm.verts:
        k = 1.0
        if taper is not None and v.co.z < 0: v.co.x *= taper[0]; v.co.y *= taper[1]
        v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * 0.45), offset_type='OFFSET', segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
    for v in bm.verts: v.co += Vector(center)
    bm.normal_update()
    return bm

def bm_ellipsoid(center, rx, ry, rz, seg=24, rings=16, phi0=0.0, phi1=math.pi):
    bm = bmesh.new(); prev = None
    for i in range(rings + 1):
        phi = phi0 + (phi1 - phi0) * i / rings
        z = math.cos(phi); rr = math.sin(phi)
        if rr < 1e-5:
            v = bm.verts.new(Vector((0, 0, z * rz)) + Vector(center)); ring = [v] * seg
        else:
            ring = [bm.verts.new(Vector((rx * rr * math.cos(j / seg * TAU), ry * rr * math.sin(j / seg * TAU), z * rz)) + Vector(center)) for j in range(seg)]
        if prev:
            for j in range(seg):
                vs = []
                for v in (prev[j], ring[j], ring[(j + 1) % seg], prev[(j + 1) % seg]):
                    if v not in vs: vs.append(v)
                if len(vs) >= 3:
                    try: bm.faces.new(vs)
                    except ValueError: pass
        prev = ring
    bm.normal_update()
    return bm

# ---------------- the body: parts with their bone neighbourhoods ----------------
# Each part lists the bones that may deform it (the first is its primary); weights come from the distance to those
# bone segments, so joints bend smoothly and no vertex ever picks up a bone across the body.
PARTS = []
def part(name, bm, matkey, bones, soft=1.0):
    PARTS.append((name, bm, matkey, bones, soft))

def build_body():
    L, Rr = 'Left', 'Right'
    # torso (tee) and hips (jeans)
    part('chest', bm_rbox((0, 0, 1.27), (0.40, 0.24, 0.40), 0.09, 4, taper=(0.9, 0.9)), 'tee', ['Spine1', 'Spine2', 'Spine', 'Hips', 'LeftShoulder', 'RightShoulder'], 1.3)
    part('belly', bm_rbox((0, 0.005, 1.05), (0.36, 0.23, 0.18), 0.07, 3), 'tee', ['Spine', 'Hips', 'Spine1'], 1.3)
    part('hips', bm_rbox((0, 0, 0.93), (0.36, 0.24, 0.22), 0.08, 3), 'jeans', ['Hips', 'LeftUpLeg', 'RightUpLeg', 'Spine'], 1.2)
    # neck and head
    part('neck', bm_capsule((0, 0.01, 1.45), (0, 0.01, 1.58), 0.055, 14, 3, 2), 'skin', ['Neck', 'Spine2', 'Head'])
    part('head', bm_ellipsoid((0, 0.01, 1.675), 0.095, 0.11, 0.12, 24, 16), 'skin', ['Head', 'Neck'], 0.6)
    part('jaw', bm_ellipsoid((0, -0.01, 1.63), 0.082, 0.095, 0.08, 20, 10, math.pi * 0.45, math.pi), 'stubble', ['Head', 'Neck'], 0.6)
    # hair: a cap over the top and back of the head, and a bun
    part('hair', bm_ellipsoid((0, 0.025, 1.68), 0.105, 0.115, 0.125, 24, 12, 0.0, math.pi * 0.52), 'hair', ['Head'], 0.6)
    part('hair_back', bm_ellipsoid((0, 0.045, 1.63), 0.095, 0.1, 0.1, 20, 10, math.pi * 0.3, math.pi * 0.75), 'hair', ['Head'], 0.6)
    part('bun', bm_ellipsoid((0, 0.1, 1.76), 0.045, 0.045, 0.04, 16, 10), 'hair', ['Head'], 0.6)
    # sunglasses: two dark lenses, a bridge and the arms
    for s in (1, -1):
        part('lens%d' % s, bm_rbox((s * 0.042, -0.105, 1.685), (0.07, 0.025, 0.04), 0.012, 2), 'shades', ['Head'], 0.6)
        part('temple%d' % s, bm_rbox((s * 0.092, -0.03, 1.69), (0.012, 0.15, 0.012), 0.004, 1), 'shades', ['Head'], 0.6)
    part('bridge', bm_rbox((0, -0.108, 1.69), (0.03, 0.012, 0.012), 0.004, 1), 'shades', ['Head'], 0.6)
    for side, s in ((L, 1), (Rr, -1)):
        # sleeve (tee), upper arm, forearm, hand
        part(side + '_sleeve', bm_capsule((s * 0.15, 0, 1.43), (s * 0.31, 0, 1.43), 0.085, 16, 4, 2, 0.072), 'tee', [side + 'Arm', side + 'Shoulder', side + 'ForeArm', 'Spine2'])
        part(side + '_arm', bm_capsule((s * 0.27, 0, 1.43), (s * 0.465, 0, 1.43), 0.06, 16, 4, 3, 0.052), 'skin', [side + 'Arm', side + 'ForeArm', side + 'Shoulder'])
        part(side + '_forearm', bm_capsule((s * 0.455, 0, 1.43), (s * 0.72, 0, 1.43), 0.052, 16, 4, 3, 0.042), 'skin', [side + 'ForeArm', side + 'Hand', side + 'Arm'])
        part(side + '_hand', bm_rbox((s * 0.795, 0, 1.425), (0.17, 0.045, 0.085), 0.02, 3), 'skin', [side + 'Hand', side + 'ForeArm'], 0.7)
        # thigh, shin (jeans), shoe
        part(side + '_thigh', bm_capsule((s * 0.105, 0, 0.93), (s * 0.105, 0, 0.5), 0.092, 16, 4, 3, 0.072), 'jeans', [side + 'UpLeg', side + 'Leg', 'Hips'])
        part(side + '_shin', bm_capsule((s * 0.105, 0, 0.51), (s * 0.105, 0, 0.1), 0.07, 16, 4, 3, 0.06), 'jeans', [side + 'Leg', side + 'Foot', side + 'UpLeg'])
        part(side + '_shoe', bm_rbox((s * 0.105, -0.075, 0.065), (0.12, 0.3, 0.09), 0.03, 3), 'shoe', [side + 'Foot', side + 'ToeBase', side + 'Leg'], 0.8)
        part(side + '_sole', bm_rbox((s * 0.105, -0.075, 0.018), (0.125, 0.31, 0.035), 0.012, 2), 'sole', [side + 'Foot', side + 'ToeBase'], 0.8)

def seg_dist(p, a, b):
    ab = b - a; t = 0.0 if ab.length_squared < 1e-12 else max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length

def weights_for(p, bones, soft):
    """Up to four (bone, weight) pairs for point p from the distances to the allowed bone segments."""
    ws = []
    for i, b in enumerate(bones):
        a, t = SEG[b]
        d = seg_dist(p, a, t)
        # the primary bone gets a head start; the falloff is a soft inverse square so weights overlap only near joints
        w = 1.0 / ((d / (0.06 * soft)) ** 2 + 1.0) ** 2 * (1.6 if i == 0 else 1.0)
        ws.append((b, w))
    ws.sort(key=lambda x: -x[1]); ws = ws[:4]
    top = ws[0][1]
    ws = [(b, w) for b, w in ws if w > top * 0.03]
    tot = sum(w for _, w in ws)
    return [(b, w / tot) for b, w in ws]

# ---------------- scene ----------------
def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.unit_settings.system = 'METRIC'

def make_armature():
    arm = bpy.data.armatures.new('Armature'); ob = bpy.data.objects.new('Armature', arm)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for name, parent, head, tail in BONES:
        b = arm.edit_bones.new(M + name); b.head = Vector(head); b.tail = Vector(tail); b.roll = 0.0
        if parent: b.parent = eb[parent]; b.use_connect = False
        eb[name] = b
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob

def make_mesh(arm):
    bm = bmesh.new(); mesh = bpy.data.meshes.new('Mannequin')
    mats = []; vert_bones = []   # per vertex: list of (bone, weight)
    face_mat = []
    for name, pbm, matkey, bones, soft in PARTS:
        m = material(matkey)
        if m not in mats: mats.append(m)
        mi = mats.index(m)
        pbm.verts.ensure_lookup_table(); pbm.verts.index_update()
        vmap = {}
        for v in pbm.verts:
            nv = bm.verts.new(v.co.copy()); vmap[v.index] = nv
            vert_bones.append(weights_for(v.co, bones, soft))
        for f in pbm.faces:
            try:
                nf = bm.faces.new([vmap[v.index] for v in f.verts]); nf.material_index = mi; nf.smooth = True
            except ValueError: pass
        pbm.free()
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    bm.to_mesh(mesh); bm.free()
    for m in mats: mesh.materials.append(m)
    ob = bpy.data.objects.new('Mannequin', mesh); bpy.context.collection.objects.link(ob)
    # vertex groups named after the bones = the skin weights
    groups = {}
    for i, wl in enumerate(vert_bones):
        for b, w in wl:
            g = groups.get(b)
            if g is None: g = groups[b] = ob.vertex_groups.new(name=M + b)
            g.add([i], w, 'REPLACE')
    # smooth shading everywhere; the bevels and capsules carry the roundness
    for p in mesh.polygons: p.use_smooth = True
    ob.parent = arm
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
    return ob

# ---------------- animation ----------------
REST = {}   # bone name -> rest 3x3 (armature space)
def rest_mats(arm):
    for b in arm.data.bones: REST[b.name[len(M):]] = b.matrix_local.to_3x3()

def Rx(a): return Matrix.Rotation(a, 3, 'X')
def Ry(a): return Matrix.Rotation(a, 3, 'Y')
def Rz(a): return Matrix.Rotation(a, 3, 'Z')

def set_rot(arm, bone, R, frame):
    """Pose `bone` by the armature-space rotation R (about its head, in its rest frame) and keyframe it."""
    pb = arm.pose.bones[M + bone]; Mr = REST[bone]
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (Mr.inverted() @ R @ Mr).to_quaternion()
    pb.keyframe_insert('rotation_quaternion', frame=frame)

def set_loc(arm, bone, v, frame):
    """Put `bone`'s head at the armature-space point v (pose-bone location is an offset from the rest head, in bone space)."""
    pb = arm.pose.bones[M + bone]; Mr = REST[bone]
    pb.location = Mr.inverted() @ (Vector(v) - SEG[bone][0])
    pb.keyframe_insert('location', frame=frame)

def arms_down(arm, f, swing_l=0.0, swing_r=0.0, flex_l=0.25, flex_r=0.25, lift=1.25, wave_r=None):
    """Hanging arms (rest is a T-pose): left arm = Ry(+lift), right = Ry(-lift); swing forward is about the vertical
    axis in the rest frame (left: -, right: +); the elbow flexes about the same axis."""
    set_rot(arm, 'LeftShoulder', Rz(-0.05), f); set_rot(arm, 'RightShoulder', Rz(0.05), f)
    set_rot(arm, 'LeftArm', Ry(lift) @ Rz(-swing_l) @ Rx(0.12), f)
    set_rot(arm, 'LeftForeArm', Rz(-flex_l), f)
    set_rot(arm, 'LeftHand', Rz(-0.08), f)
    if wave_r is None:
        set_rot(arm, 'RightArm', Ry(-lift) @ Rz(swing_r) @ Rx(-0.12), f)
        set_rot(arm, 'RightForeArm', Rz(flex_r), f)
        set_rot(arm, 'RightHand', Rz(0.08), f)
    else:
        # the right arm (rest: along -X) lifts with Ry(+); its forearm bends up with Ry(+) too, and waving is that
        # same bend swinging, which reads as side to side from the front
        lift_r, flex, wag = wave_r
        set_rot(arm, 'RightArm', Ry(lift_r) @ Rz(0.25), f)       # raised above the shoulder, a little forward
        set_rot(arm, 'RightForeArm', Ry(flex + wag), f)            # bent up, waving
        set_rot(arm, 'RightHand', Ry(wag * 0.5), f)

def legs(arm, f, thigh_l, knee_l, foot_l, thigh_r, knee_r, foot_r):
    """Leg angles: thigh forward +, knee bend +, foot toes-down +."""
    set_rot(arm, 'LeftUpLeg', Rx(-thigh_l), f); set_rot(arm, 'LeftLeg', Rx(knee_l), f); set_rot(arm, 'LeftFoot', Rx(foot_l), f)
    set_rot(arm, 'RightUpLeg', Rx(-thigh_r), f); set_rot(arm, 'RightLeg', Rx(knee_r), f); set_rot(arm, 'RightFoot', Rx(foot_r), f)
    set_rot(arm, 'LeftToeBase', Rx(0.0), f); set_rot(arm, 'RightToeBase', Rx(0.0), f)

def clip_idle(arm, f, t):
    s = math.sin(t * TAU / 3.0)      # a breath every 3 s
    set_loc(arm, 'Hips', (0, 0, 0.98 + 0.004 * s), f)
    set_rot(arm, 'Hips', Rx(0.02), f)
    set_rot(arm, 'Spine', Rx(-0.02 * s), f); set_rot(arm, 'Spine1', Rx(-0.03 * s), f); set_rot(arm, 'Spine2', Rx(-0.025 * s), f)
    set_rot(arm, 'Neck', Rx(0.03 * s), f); set_rot(arm, 'Head', Rx(0.04 + 0.02 * s) @ Rz(0.02 * math.sin(t * TAU / 6.0)), f)
    arms_down(arm, f, swing_l=0.03 * s, swing_r=0.03 * s, flex_l=0.22 + 0.03 * s, flex_r=0.22 + 0.03 * s, lift=1.22 + 0.02 * s)
    legs(arm, f, 0.02, 0.05, 0.0, 0.02, 0.05, 0.0)

def clip_walk(arm, f, t):
    ph = t * TAU                   # one stride per second
    pl, pr = ph, ph + math.pi
    def leg(p):
        thigh = 0.5 * math.sin(p)
        swing = max(0.0, math.cos(p - 0.35))            # the leg bends most while swinging forward
        knee = 0.1 + 0.95 * swing ** 1.6
        foot = 0.3 * max(0.0, -math.sin(p + 0.6)) - 0.15 * max(0.0, math.sin(p - 0.3))   # toes down pushing off, up before the heel strike
        return thigh, knee, foot
    tl, kl, fl = leg(pl); tr, kr, fr = leg(pr)
    legs(arm, f, tl, kl, fl, tr, kr, fr)
    bob = 0.025 * abs(math.cos(ph))
    set_loc(arm, 'Hips', (0, 0, 0.965 + bob), f)
    set_rot(arm, 'Hips', Rz(0.06 * math.sin(ph)) @ Rx(0.05) @ Ry(0.04 * math.sin(ph)), f)
    set_rot(arm, 'Spine', Rz(-0.03 * math.sin(ph)) @ Rx(0.02), f); set_rot(arm, 'Spine1', Rz(-0.04 * math.sin(ph)), f)
    set_rot(arm, 'Spine2', Rz(-0.05 * math.sin(ph)) @ Rx(-0.02), f)
    set_rot(arm, 'Neck', Rx(0.02), f); set_rot(arm, 'Head', Rx(0.02 + 0.015 * math.cos(2 * ph)) @ Rz(0.03 * math.sin(ph)), f)
    # arms swing against the legs
    arms_down(arm, f, swing_l=0.45 * math.sin(pr), swing_r=0.45 * math.sin(pl), flex_l=0.3 + 0.2 * max(0.0, math.sin(pr)), flex_r=0.3 + 0.2 * max(0.0, math.sin(pl)), lift=1.2)

def clip_wave(arm, f, t):
    s = math.sin(t * TAU / 2.0)    # 2 s loop
    w = math.sin(t * TAU * 2.0)    # two wags per second
    set_loc(arm, 'Hips', (0, 0, 0.98 + 0.003 * s), f)
    set_rot(arm, 'Hips', Rx(0.02) @ Rz(0.03), f)
    set_rot(arm, 'Spine', Rz(0.03), f); set_rot(arm, 'Spine1', Rz(0.04) @ Rx(-0.02), f); set_rot(arm, 'Spine2', Rz(0.05) @ Rx(-0.03), f)
    set_rot(arm, 'Neck', Rz(-0.05), f); set_rot(arm, 'Head', Rz(-0.1) @ Rx(0.03 + 0.03 * s), f)
    arms_down(arm, f, swing_l=0.05, flex_l=0.25, lift=1.22, wave_r=(0.95 + 0.05 * s, 1.15, 0.4 * w))
    legs(arm, f, 0.02, 0.05, 0.0, -0.03, 0.06, 0.0)

CLIPS = [('idle', 3.0, clip_idle), ('walk', 1.0, clip_walk), ('wave', 2.0, clip_wave)]

def make_clips(arm):
    rest_mats(arm)
    if not arm.animation_data: arm.animation_data_create()
    ad = arm.animation_data
    actions = []
    for name, dur, fn in CLIPS:
        act = bpy.data.actions.new(name); act.use_fake_user = True
        ad.action = act
        if hasattr(act, 'slots') and hasattr(ad, 'action_slot'):
            slot = act.slots.new(id_type='OBJECT', name=arm.name) if not len(act.slots) else act.slots[0]
            ad.action_slot = slot
        n = int(round(dur * FPS))
        for k in range(n + 1):        # the last frame repeats the first, so loops are seamless
            fn(arm, k + 1, (k % n) / FPS)
        act.frame_range = (1, n + 1)
        if hasattr(act, 'use_frame_range'): act.use_frame_range = True
        actions.append((name, act, n))
    ad.action = None
    # one NLA track per clip: the exporter writes every action on the NLA as its own glTF animation
    for name, act, n in actions:
        tr = ad.nla_tracks.new(); tr.name = name
        st = tr.strips.new(name, 1, act); st.name = name
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)

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

def main():
    clear_scene()
    arm = make_armature()
    arm['burns_character'] = 'mannequin'
    build_body()
    mesh = make_mesh(arm)
    mesh['burns_height'] = 1.8
    make_clips(arm)
    tris = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    size = export(arm, mesh, OUT)
    print('mannequin: %d triangles, %d vertices, %d joints, clips %s -> %s (%d KB)' % (tris, len(mesh.data.vertices), len(arm.data.bones), [c[0] for c in CLIPS], OUT, size // 1024))

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; traceback.print_exc(); sys.exit(1)
