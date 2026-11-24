"""Brady's right sleeve = his left sleeve, mirrored (Brady, 24 Nov 2026: "I have the same sleeve design on both arms").

Works on the shipped GLB's body atlas directly, so nothing else in the file changes (geometry, rig, clips, other maps):
  1. rasterise the LOD0 skin primitive's atlas UVs into a position map (bind pose, metres; T-pose, arms along +-X),
  2. for every right-arm texel (x < 0, along the arm, shoulder to wrist) look up the left-arm texels nearest the
     mirrored point (-x, y, z) and take their inverse-distance blend,
  3. feather the copy in at the shoulder (under the tee sleeve) and past the wrist band (bare skin both sides),
  4. re-encode the base colour JPEG in place (quality 95, 4:4:4) and write the GLB.

Usage (numpy, Pillow, scipy; outside Blender):
  python mirror_sleeve.py in.glb out.glb [preview_dir]
The LOD1/LOD2 meshes share the same atlas, so every level gets the new sleeve. The private source map
(private/work/tex/T_Brady_BaseColor_tat_4k.png, tattoo.py) now mirrors the left design too: tat_cfg.json has R = L."""
import sys, io, os, numpy as np
from PIL import Image
from scipy.spatial import cKDTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glbio as glb

SRC, DST = sys.argv[1], sys.argv[2]
PREV = sys.argv[3] if len(sys.argv) > 3 else None
js, bin_ = glb.load(SRC)
mat_skin = next(i for i, m in enumerate(js['materials']) if (m.get('extras') or {}).get('burns_kind') == 'skin')
img_i = js['textures'][js['materials'][mat_skin]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
im = Image.open(io.BytesIO(glb.image_bytes(js, bin_, img_i))).convert('RGB')
A = np.asarray(im).astype(np.float32) / 255
H, W = A.shape[:2]
mesh = js['meshes'][next(n for n in js['nodes'] if n.get('name') == 'Brady')['mesh']]   # LOD0 body
prim = next(p for p in mesh['primitives'] if p['material'] == mat_skin)
P = glb.acc(js, bin_, prim['attributes']['POSITION']).astype(np.float64)
UV = glb.acc(js, bin_, prim['attributes']['TEXCOORD_0']).astype(np.float64)
I = glb.acc(js, bin_, prim['indices']).reshape(-1, 3)

# ---- 1. position map by scanline rasterisation in UV space ----
pos = np.zeros((H, W, 3), np.float32); cov = np.zeros((H, W), bool)
px = UV[:, 0] * W - 0.5; py = UV[:, 1] * H - 0.5
for a, b, c in I:
    xs = np.array([px[a], px[b], px[c]]); ys = np.array([py[a], py[b], py[c]])
    x0, x1 = int(np.floor(xs.min())), int(np.ceil(xs.max())); y0, y1 = int(np.floor(ys.min())), int(np.ceil(ys.max()))
    x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, W - 1), min(y1, H - 1)
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
    if abs(d) < 1e-12: continue
    l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / d
    l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / d
    l2 = 1 - l0 - l1
    e = -0.02
    k = (l0 >= e) & (l1 >= e) & (l2 >= e)
    if not k.any(): continue
    p3 = l0[k, None] * P[a] + l1[k, None] * P[b] + l2[k, None] * P[c]
    pos[gy[k], gx[k]] = p3; cov[gy[k], gx[k]] = True

X, Y, Z = pos[..., 0], pos[..., 1], pos[..., 2]
SH_Y, SH_Z = 1.492, 0.019                    # arm axis (T-pose)
rho = np.hypot(Y - SH_Y, Z - SH_Z)
ARM0, ARM1 = 0.175, 0.70                     # |x| span copied (shoulder under the sleeve .. past the wrist band)
arm = cov & (rho < 0.11)
left = arm & (X > ARM0 - 0.03) & (X < ARM1 + 0.03)
right = arm & (X < -ARM0) & (X > -ARM1)

# ---- 2. mirrored lookup ----
ly, lx = np.nonzero(left)
tree = cKDTree(pos[ly, lx])
ry, rx = np.nonzero(right)
q = pos[ry, rx].copy(); q[:, 0] *= -1
dist, idx = tree.query(q, k=4)
w = 1.0 / np.maximum(dist, 2e-4); w /= w.sum(1, keepdims=True)
src = (A[ly[idx], lx[idx]] * w[..., None]).sum(1)

# ---- 3. feather at both ends ----
ax = -X[ry, rx]
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
f = ss(ARM0, ARM0 + 0.02, ax) * (1 - ss(ARM1 - 0.03, ARM1, ax))
# match the overall skin tone of the right arm (the two arms' bare skin can differ slightly): compare the lightest
# (un-inked) texels of both, near the wrist
old = A[ry, rx]
bare = (ax > 0.64) & (ax < 0.70)
if bare.sum() > 50:
    gain = np.median(old[bare], 0) / np.maximum(np.median(src[bare], 0), 1e-3)
    src = np.clip(src * gain[None], 0, 1)
    print('tone gain', np.round(gain, 3))
A[ry, rx] = old * (1 - f[:, None]) + src * f[:, None]
print('right texels', len(ry), 'left texels', len(ly), 'max lookup dist mm', round(float(dist[:, 0].max()) * 1000, 2),
      'p95 mm', round(float(np.percentile(dist[:, 0], 95)) * 1000, 2))

out = Image.fromarray((np.clip(A, 0, 1) * 255 + 0.5).astype(np.uint8))
buf = io.BytesIO(); out.save(buf, 'JPEG', quality=95, subsampling=0)
nb = glb.replace_image(js, bin_, img_i, buf.getvalue(), 'image/jpeg')
glb.save(DST, js, nb)
print('wrote', DST, os.path.getsize(DST))
if PREV:
    os.makedirs(PREV, exist_ok=True)
    ys_, xs_ = np.nonzero(right | left)
    y0, y1, x0, x1 = ys_.min(), ys_.max(), xs_.min(), xs_.max()
    im.crop((x0, y0, x1, y1)).save(os.path.join(PREV, 'sleeve_atlas_before.jpg'), quality=90)
    out.crop((x0, y0, x1, y1)).save(os.path.join(PREV, 'sleeve_atlas_after.jpg'), quality=90)
