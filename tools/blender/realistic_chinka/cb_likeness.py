"""Realistic Chinka, step 3c (on the face-rigged checkpoint): a likeness pass from her photos, as smooth vertex moves
on the rest mesh (weights untouched; the eyes and lid line stay where they are): a rounder, fuller lower face (widened
from cheekbone to jaw), fuller cheeks, a broader and softer nose tip, slightly fuller lips. Writes the moved landmarks
back to chinka_lm.json and re-exports the mesh data the skin painter reads."""
import bpy, json, math, numpy as np
W = '/Users/bradymott/brady-o/private/work/'
CFG = globals().get('LIKE_CFG', {})
LM = json.load(open(W + 'proj/chinka_lm.json'))
h = bpy.data.objects['Chinka_Body']; me = h.data
P = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
corner_i = {key: int(np.argmin(((P - np.array(LM[key])) ** 2).sum(1))) for key in ('mouthL', 'mouthR')}
x, y, z = P.T
def ss(e0, e1, t):
    t = np.clip((t - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def g3(c, s): return np.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) / (2 * s * s))
eye_z = (LM['eyeL'][2] + LM['eyeR'][2]) / 2; eye_y = LM['eyeL'][1]; lipF = LM['lipFront']
front = ss(0.02, -0.04, y)                                   # the face half of the head
# 1. lower face wider: zero at the eyes, most at the jaw corners, back to zero under the chin
band = ss(eye_z - 0.005, eye_z - 0.04, z) * (1 - ss(eye_z - 0.105, eye_z - 0.135, z))
k = CFG.get('widen', 0.065) * band * front * ss(0.012, 0.035, np.abs(x))
P[:, 0] = x * (1 + k)
# 2. fuller cheeks (push out along the normal)
cheek = sum(g3((s * 0.046, eye_y - 0.008, eye_z - 0.036), 0.019) for s in (1, -1))
P += N * (CFG.get('cheek', 0.0028) * cheek)[:, None]
# 3. nose tip broader and softer
nose = g3((0.0, lipF[1] - 0.018, (eye_z + LM['lipTop']) / 2 - 0.004), 0.011)
P[:, 0] += x * CFG.get('nose', 0.16) * nose
P[:, 1] += CFG.get('nose_soft', 0.0012) * nose
# 4. lips a touch fuller (forward along the normal around the lip line)
lips = g3((0.0, lipF[1], LM['seam']), 0.012) * ss(0.03, 0.02, np.abs(x))
P += N * (CFG.get('lips', 0.0009) * lips)[:, None]
me.vertices.foreach_set('co', P.ravel().astype(np.float32)); me.update()
# landmarks that moved (mouth corners widen with the lower face)
for key, i in corner_i.items(): LM[key] = P[i].tolist()
json.dump(LM, open(W + 'proj/chinka_lm.json', 'w'), indent=1)
# the mouth-corner joints follow
rig = bpy.data.objects['Armature']; M = 'mixamorig:'
for o in bpy.context.view_layer.objects: o.select_set(False)
rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
from mathutils import Vector
for s, key in (('Left', 'mouthL'), ('Right', 'mouthR')):
    b = rig.data.edit_bones[M + s + 'Mouth']; c = Vector(LM[key]); b.head = c; b.tail = c + Vector((0, -0.012, 0))
bpy.ops.object.mode_set(mode='OBJECT')
# mesh data for skin_paint.py
me.calc_loop_triangles()
nt = len(me.loop_triangles)
tri_v = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get('vertices', tri_v)
tri_l = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get('loops', tri_l)
uv = np.empty(len(me.loops) * 2, np.float32); me.uv_layers['UVMap'].data.foreach_get('uv', uv)
co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co)
no = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('normal', no)
np.savez(W + 'proj/chinka_body_mesh.npz', tri_v=tri_v.reshape(-1, 3), tri_l=tri_l.reshape(-1, 3), uv=uv.reshape(-1, 2), co=co.reshape(-1, 3), no=no.reshape(-1, 3))
print('likeness pass: max widen', round(float(k.max()), 3), 'corners', LM['mouthL'], LM['mouthR'])
