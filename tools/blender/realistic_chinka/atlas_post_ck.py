"""Realistic Chinka: the baked atlas maps -> the shipped texture set (numpy/OpenCV, outside Blender).
  T_CK_Base.jpg    2048 sRGB base colour (+ the LOD2 hair swatch filled with her hair colour)
  T_CK_ORM.jpg     1024 (R occlusion from the AO bake, G roughness, B metallic)
  T_CK_Normal.png  1024 tangent-space normal (OpenGL, +Y up), renormalised
Usage: OPENCV_IO_ENABLE_OPENEXR=1 python atlas_post_ck.py"""
import os, json, numpy as np
os.environ['OPENCV_IO_ENABLE_OPENEXR'] = '1'
import cv2
from PIL import Image
W = '/Users/bradymott/brady-o/private/work/'
D = W + 'tex/ck_atlas/'
L = lambda f: np.asarray(Image.open(D + f).convert('RGB' if 'base' in f else 'L')).astype(np.float32) / 255
base = L('atlas_base.png'); ao = L('atlas_ao.png'); ro = L('atlas_rough.png'); me = L('atlas_metal.png')
# the normal bake is saved as a 16-bit PNG by Blender (Raw view transform; this OpenCV build reads no EXR)
nm = cv2.imread(D + 'atlas_normal.png', cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 65535
meta = json.load(open(W + 'proj/ck_atlas_meta.json'))
(u0, v0), (u1, v1) = meta['swatch']; S = base.shape[0]
x0, x1 = int(u0 * S) - 6, int(u1 * S) + 6; y0, y1 = int((1 - v1) * S) - 6, int((1 - v0) * S) + 6
hair = np.asarray(Image.open(W + 'tex/T_Chinka_Hair.png').convert('RGBA')).astype(np.float32) / 255
m = hair[..., 3] > 0.8
hc = np.median(hair[..., :3][m], axis=0)
rng = np.random.default_rng(3); h, w = y1 - y0, x1 - x0
strands = np.clip(1 + 0.35 * (rng.random((1, w)) - 0.5) + 0.12 * (rng.random((h, w)) - 0.5), 0.5, 1.5)
base[y0:y1, x0:x1] = np.clip(hc[None, None] * strands[..., None], 0, 1); ro[y0:y1, x0:x1] = 0.55; ao[y0:y1, x0:x1] = 0.85; me[y0:y1, x0:x1] = 0
nm[y0:y1, x0:x1] = (0.5, 0.5, 1.0)
Image.fromarray((base * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_CK_Base.jpg', quality=92, subsampling=0)
aoK = 0.35 + 0.65 * np.clip(ao, 0, 1) ** 0.8
# gold at full metal reflects the (often blue) sky probe and reads dark on a phone; part-metal keeps its warm colour
me = me * 0.55; ro = np.where(me > 0.2, np.maximum(ro, 0.34), ro)
orm = np.stack([aoK, ro, me], -1)
orm = cv2.resize(orm, (1024, 1024), interpolation=cv2.INTER_AREA)
Image.fromarray((np.clip(orm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_CK_ORM.jpg', quality=92, subsampling=0)
NS = 512   # cloth folds and skin bump read fine at 512 on a phone; keeps her at ~17 MB of textures on medium (guide §6.12)
n = cv2.resize(nm.astype(np.float32), (NS, NS), interpolation=cv2.INTER_AREA)
v = n * 2 - 1; v /= np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-6); n = v * 0.5 + 0.5
Image.fromarray((np.clip(n, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_CK_Normal.png')
Image.fromarray((base * 255).astype(np.uint8)).resize((1024, 1024)).save(W + 'wip/ck_atlas_base_prev.jpg')
for f in ('T_CK_Base.jpg', 'T_CK_ORM.jpg', 'T_CK_Normal.png'): print(f, os.path.getsize(W + 'tex/' + f))
print('hair swatch', hc, 'metal mean', float(me.mean()))
