"""Realistic Chinka, step 3: from the T-posed MPFB body, read the helper landmarks (eyes, mouth), delete the helper
geometry, build the eyeballs, add the face joints (Jaw, eyelids, mouth corners, as realistic Brady has) with
procedural weights split off the Head, and the secondary bones (hair x6, skirt x8, from tools/blender/chinka.py).
Writes the landmarks to private/work/proj/chinka_lm.json. Run in the open Blender: exec(open(path).read())."""
import bpy, bmesh, json, math, numpy as np
from mathutils import Vector
W = '/Users/bradymott/brady-o/private/work/'
MPFB_TEX = '/Users/bradymott/Library/Application Support/Blender/5.2/extensions/user_default/mpfb/data/textures/'
h = bpy.data.objects[globals().get('BODY', 'Chinka_Body')]; me = h.data; rig = bpy.data.objects[globals().get('RIG', 'Armature')]; M = 'mixamorig:'
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

P = np.array([v.co[:] for v in me.vertices])
def grp_ids(name, thr=0.5):
    gi = h.vertex_groups[name].index
    return np.array([v.index for v in me.vertices if any(g.group == gi and g.weight > thr for g in v.groups)], int)
LM = {}
for s, n in (('L', 'helper-l-eye'), ('R', 'helper-r-eye')):
    ids = grp_ids(n); c = P[ids].mean(0); r = float(np.linalg.norm(P[ids] - c, axis=1).mean())
    LM['eye' + s] = c.tolist(); LM['eyeR' + s] = r

# ---- lips from the MPFB lips mask (vertex UVs)
_im = bpy.data.images.load(MPFB_TEX + 'mpfb_lips.jpg', check_existing=True)
_px = np.empty(_im.size[0] * _im.size[1] * 4, np.float32); _im.pixels.foreach_get(_px)
lipm = _px.reshape(_im.size[1], _im.size[0], 4)[::-1, :, 0]          # top-down rows
bpy.data.images.remove(_im)
uvl = me.uv_layers['UVMap'].data
vuv = np.zeros((len(me.vertices), 2))
for p in me.polygons:
    for li in p.loop_indices: vuv[me.loops[li].vertex_index] = uvl[li].uv
S = lipm.shape[0]
lipw = lipm[np.clip(((1 - vuv[:, 1]) * S).astype(int), 0, S - 1), np.clip((vuv[:, 0] * S).astype(int), 0, S - 1)]
body_ids = set(grp_ids('body').tolist())
lips = np.array([i for i in np.nonzero(lipw > 0.5)[0] if i in body_ids])
LP = P[lips]
cl = LP[np.argmax(LP[:, 0])]; cr = LP[np.argmin(LP[:, 0])]
front = LP[np.argmin(LP[:, 1])]
# lip seam height: the middle of the lips' vertical extent near the centre line
mid = LP[np.abs(LP[:, 0]) < 0.006]
LM.update(mouthL=cl.tolist(), mouthR=cr.tolist(), lipFront=front.tolist(), lipTop=float(mid[:, 2].max()), lipBot=float(mid[:, 2].min()),
          seam=float((cl[2] + cr[2]) / 2))
print('lips', len(lips), 'corners', np.round(cl, 4), np.round(cr, 4), 'top/bot', round(LM['lipTop'], 4), round(LM['lipBot'], 4))

# ---- delete the helpers (everything not 'body') and the mask modifier
bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table()
kill = [bm.verts[i] for i in range(len(bm.verts)) if i not in body_ids]
bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(me); bm.free()
for md in list(h.modifiers):
    if md.type == 'MASK': h.modifiers.remove(md)
for vg in list(h.vertex_groups):
    if not vg.name.startswith(M): h.vertex_groups.remove(vg)
P = np.array([v.co[:] for v in me.vertices]); nv = len(P)
print('body verts', nv)

# ---- face joints and secondary bones
eL, eR = Vector(LM['eyeL']), Vector(LM['eyeR'])
eye_z = (eL.z + eR.z) / 2
seam = LM['seam']
jaw_head = Vector((0.0, (eL.y + 0.075), eye_z - 0.032))         # hinge: behind and below the eyes, on the centre line
LM['jaw'] = list(jaw_head)
sel([rig]); bpy.ops.object.mode_set(mode='EDIT')
E = rig.data.edit_bones
headb = E[M + 'Head']
def bone(name, head, tail, parent):
    b = E.get(M + name) or E.new(M + name)
    b.head = head; b.tail = tail; b.roll = 0; b.parent = E[M + parent]; b.use_connect = False; b.use_deform = True
    return b
bone('Jaw', jaw_head, Vector((0, LM['lipFront'][1] + 0.01, LM['lipBot'] - 0.03)), 'Head')
for s, e in (('Left', eL), ('Right', eR)):
    bone(s + 'Eyelid', e, e + Vector((0, -0.02, 0)), 'Head')
    c = Vector(LM['mouth' + ('L' if s == 'Left' else 'R')])
    bone(s + 'Mouth', c, c + Vector((0, -0.012, 0)), 'Head')
# hair and skirt bones (positions from chinka.py, scaled to this body: engine (x, y, z) -> Blender (x, -z, y))
def Bv(p): return Vector((p[0], -p[2], p[1]))
hz = rig.data.bones[M + 'Head'].head_local.z
top = float(P[:, 2].max())
hipz = rig.data.bones[M + 'Hips'].head_local.z
hipy = rig.data.bones[M + 'Hips'].head_local.y
k = top / 1.68
EX = [
    ('HairL1', 'Head', (0.075, top - 0.10, -0.01), (0.10, top - 0.33, -0.05)), ('HairL2', 'HairL1', (0.10, top - 0.33, -0.05), (0.12, top - 0.62, -0.08)),
    ('HairR1', 'Head', (-0.075, top - 0.10, -0.01), (-0.10, top - 0.33, -0.05)), ('HairR2', 'HairR1', (-0.10, top - 0.33, -0.05), (-0.12, top - 0.62, -0.08)),
    ('HairB1', 'Head', (0.0, top - 0.11, 0.09), (0.0, top - 0.33, 0.12)), ('HairB2', 'HairB1', (0.0, top - 0.33, 0.12), (0.0, top - 0.66, 0.11)),
    ('SkirtF1', 'Hips', (0.0, hipz + 0.06, hipy - 0.13), (0.0, 0.48 * k, hipy - 0.17)), ('SkirtF2', 'SkirtF1', (0.0, 0.48 * k, hipy - 0.17), (0.0, 0.06, hipy - 0.25)),
    ('SkirtB1', 'Hips', (0.0, hipz + 0.0, hipy + 0.15), (0.0, 0.48 * k, hipy + 0.2)), ('SkirtB2', 'SkirtB1', (0.0, 0.48 * k, hipy + 0.2), (0.0, 0.06, hipy + 0.27)),
    ('SkirtL1', 'Hips', (0.19, hipz + 0.06, hipy), (0.24, 0.48 * k, hipy)), ('SkirtL2', 'SkirtL1', (0.24, 0.48 * k, hipy), (0.31, 0.06, hipy)),
    ('SkirtR1', 'Hips', (-0.19, hipz + 0.06, hipy), (-0.24, 0.48 * k, hipy)), ('SkirtR2', 'SkirtR1', (-0.24, 0.48 * k, hipy), (-0.31, 0.06, hipy)),
]
for n, par, a, b in EX:
    # tuples are (x, z_up, y_blender): front is -y
    bone(n, Vector((a[0], a[2], a[1])), Vector((b[0], b[2], b[1])), par)
bpy.ops.object.mode_set(mode='OBJECT')
LM['extra'] = [(n, par) for n, par, a, b in EX]

# ---- face weights: split from Head
def vg(name): return h.vertex_groups.get(M + name) or h.vertex_groups.new(name=M + name)
gH = vg('Head'); gi = gH.index
headw = np.zeros(nv)
for v in me.vertices:
    for g in v.groups:
        if g.group == gi: headw[v.index] = g.weight
x, y, z = P[:, 0], P[:, 1], P[:, 2]
# jaw: below the lip seam, in front of the hinge, fading toward the neck and the ears
lipF = LM['lipFront'][1]
w_jaw = ss(seam + 0.002, seam - 0.004, z) * ss(jaw_head.y + 0.015, jaw_head.y - 0.03, y) * ss(eye_z - 0.125, eye_z - 0.10, z)
# keep the cheeks above the jaw line mostly on the head: fade with height above the chin line on the sides
w_jaw *= 1 - 0.6 * ss(0.03, 0.06, np.abs(x)) * ss(seam - 0.03, seam, z)
w_jaw = np.clip(w_jaw, 0, 1) * headw
# eyelids (upper): lid skin over the eyeball, from the lid margin up to the crease
def lid(e):
    d = np.linalg.norm(P - np.array(e), axis=1)
    r = LM['eyeRL']
    w = ss(r + 0.0085, r + 0.0035, d) * ss(e[2] - 0.0015, e[2] + 0.0025, z) * ss(e[1] + 0.002, e[1] - 0.006, y)
    w *= ss(0.019, 0.014, np.abs(x - e[0]))
    w *= 1 - ss(e[2] + 0.009, e[2] + 0.013, z)
    return np.clip(w, 0, 1) * headw
w_lL, w_lR = lid(LM['eyeL']), lid(LM['eyeR'])
def corner(c):
    d = np.linalg.norm(P - np.array(c), axis=1); return np.clip(ss(0.016, 0.004, d), 0, 1) * headw * 0.9
w_mL, w_mR = corner(LM['mouthL']), corner(LM['mouthR'])
w_jaw = w_jaw * (1 - np.maximum(w_mL, w_mR) * 0.5)
rest = headw - w_jaw - w_lL - w_lR - w_mL - w_mR
over = rest < 0
if over.any():
    tot = (w_jaw + w_lL + w_lR + w_mL + w_mR)[over]; kk = headw[over] / np.maximum(tot, 1e-6)
    for a in (w_jaw, w_lL, w_lR, w_mL, w_mR): a[over] *= kk
    rest = np.maximum(headw - w_jaw - w_lL - w_lR - w_mL - w_mR, 0)
for name, w in (('Jaw', w_jaw), ('LeftEyelid', w_lL), ('RightEyelid', w_lR), ('LeftMouth', w_mL), ('RightMouth', w_mR)):
    g = vg(name)
    for i in np.nonzero(w > 0.002)[0]: g.add([int(i)], float(w[i]), 'REPLACE')
for i in np.nonzero(headw > 0)[0]: gH.add([int(i)], float(rest[i]), 'REPLACE')
print('face weights: jaw', int((w_jaw > 0.05).sum()), 'lids', int((w_lL > 0.05).sum()), int((w_lR > 0.05).sum()), 'corners', int((w_mL > 0.05).sum()))

# ---- eyeballs: UV spheres from the helpers, cornea bulge, front-planar UVs onto the iris texture
for s in ('L', 'R'):
    name = globals().get('EYE', 'Chinka_Eye_') + s
    old = bpy.data.objects.get(name)
    if old: bpy.data.objects.remove(old)
    c = Vector(LM['eye' + s]); r = LM['eyeRL'] * 0.98
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=r)
    for v in bm.verts:
        p = v.co.copy()
        f = max(0.0, -p.y / r)            # front (-Y)
        if f > 0.82: p.y -= r * 0.09 * ((f - 0.82) / 0.18) ** 1.5
        v.co = p + c
    uvl = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            p = l.vert.co - c
            u = 0.5 + p.x / (2 * r) * (1 if p.y < 0 else 0.98); vv = 0.5 + p.z / (2 * r) * (1 if p.y < 0 else 0.98)
            if p.y > 0: u = 0.5 + (u - 0.5) * 1.6 + (0.45 if p.x > 0 else -0.45); vv = 0.5 + (vv - 0.5) * 1.6
            l[uvl].uv = (min(max(u, 0.01), 0.99), min(max(vv, 0.01), 0.99))
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
    for p in m.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, m); bpy.context.scene.collection.objects.link(ob)
    ob.vertex_groups.new(name=M + 'Head').add(list(range(len(m.vertices))), 1.0, 'REPLACE')
    ob.parent = rig; am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = rig
json.dump(LM, open(W + 'proj/' + globals().get('LM_FILE', 'chinka_lm.json'), 'w'), indent=1)
print('bones', len(rig.data.bones))
