"""Realistic Chinka, step 3b: re-split the Jaw weights at the lips. MPFB's mouth is a closed cavity whose upper and
lower lip surfaces meet within half a millimetre, so a height threshold half-moves both lips. Inside the mouth region
the split follows the surface normal (up-facing: lower lip and cavity floor -> Jaw; down-facing: upper lip and roof ->
Head); outside it, a smooth fall-off below the lip line, toward the ears and down the neck."""
import bpy, json, numpy as np
h = bpy.data.objects[globals().get('BODY', 'Chinka_Body')]; me = h.data; M = 'mixamorig:'
LM = json.load(open('/Users/bradymott/brady-o/private/work/proj/' + globals().get('LM_FILE', 'chinka_lm.json')))
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
P = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices]); nv = len(P)
gi = {g.name: g.index for g in h.vertex_groups}
def wget(name):
    a = np.zeros(nv); i = gi.get(M + name)
    if i is None: return a
    for v in me.vertices:
        for g in v.groups:
            if g.group == i: a[v.index] = g.weight
    return a
head = wget('Head'); jaw = wget('Jaw'); mL = wget('LeftMouth'); mR = wget('RightMouth')
tot = head + jaw                       # what Head + Jaw share; corners and lids stay as they are
x, y, z = P.T
seam = LM['seam']; cx = max(abs(LM['mouthL'][0]), abs(LM['mouthR'][0]))
eye_z = (LM['eyeL'][2] + LM['eyeR'][2]) / 2; hinge_y = LM['jaw'][1]
lipF = LM['lipFront'][1]
# outside: below the lip line, in front of the hinge, above the neck, sides lighter on the cheeks
f = ss(seam + 0.0008, seam - 0.0025, z) * ss(hinge_y + 0.015, hinge_y - 0.03, y) * ss(eye_z - 0.125, eye_z - 0.10, z)
f *= 1 - 0.6 * ss(0.03, 0.06, np.abs(x)) * ss(seam - 0.03, seam, z)
# mouth region: lips and cavity
R = (np.abs(x) < cx + 0.003) & (z > seam - 0.016) & (z < seam + 0.016) & (y > lipF - 0.003) & (y < lipF + 0.04)
fr = np.where(N[:, 2] > 0.15, 1.0, np.where(N[:, 2] < -0.15, 0.0, (z < seam).astype(float)))
# front lip skin (facing forward) keeps the height rule, sharpened
front = R & (N[:, 1] < -0.6)
fr = np.where(front, (z < seam - 0.0003).astype(float), fr)
f = np.where(R, fr, f)
corner = np.maximum(mL, mR)
jaw_new = np.clip(f, 0, 1) * tot * (1 - 0.5 * np.minimum(corner / np.maximum(tot + corner, 1e-6) * 2, 1))
head_new = tot - jaw_new
gJ = h.vertex_groups[M + 'Jaw']; gH = h.vertex_groups[M + 'Head']
for i in np.nonzero(tot > 0)[0]:
    gJ.add([int(i)], float(jaw_new[i]), 'REPLACE'); gH.add([int(i)], float(head_new[i]), 'REPLACE')
print('jaw verts', int((jaw_new > 0.5).sum()), 'mouth region', int(R.sum()))
