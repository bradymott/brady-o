"""Realistic cast kit: the baked atlas -> the kit texture set (numpy/OpenCV, outside Blender).
  T_KC_Base.jpg 2048 sRGB (+ the hair swatch for the opaque far-LOD hair), T_KC_ORM.jpg 1024 (occlusion flat: the kit's
  parts all overlap at the origin in Blender, so a baked AO would be meaningless; R = 1), T_KC_Normal.png 512.
Usage: python kc_atlas_post.py"""
import os, json, numpy as np
import cv2
from PIL import Image
W = '/Users/bradymott/brady-o/private/work/'
D = W + 'tex/kc_atlas/'
L = lambda f: np.asarray(Image.open(D + f).convert('RGB' if 'base' in f else 'L')).astype(np.float32) / 255
base = L('atlas_base.png'); ro = L('atlas_rough.png'); me = L('atlas_metal.png')
nm = cv2.imread(D + 'atlas_normal.png', cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1].astype(np.float32) / 65535
meta = json.load(open(W + 'proj/kc_atlas_meta.json'))
(u0, v0), (u1, v1) = meta['swatch']; S = base.shape[0]
x0, x1 = int(u0 * S) - 6, int(u1 * S) + 6; y0, y1 = int((1 - v1) * S) - 6, int((1 - v0) * S) + 6
hair = np.asarray(Image.open(W + 'tex/T_Cast_Hair.png').convert('RGBA')).astype(np.float32) / 255
hc = np.median(hair[..., :3][hair[..., 3] > 0.8], axis=0)
rng = np.random.default_rng(3); h, w = y1 - y0, x1 - x0
strands = np.clip(1 + 0.35 * (rng.random((1, w)) - 0.5) + 0.12 * (rng.random((h, w)) - 0.5), 0.5, 1.5)
base[y0:y1, x0:x1] = np.clip(hc[None, None] * strands[..., None], 0, 1); ro[y0:y1, x0:x1] = 0.55; me[y0:y1, x0:x1] = 0; nm[y0:y1, x0:x1] = (0.5, 0.5, 1.0)
Image.fromarray((base * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_KC_Base.jpg', quality=90, subsampling=0)
orm = np.stack([np.ones_like(ro), ro, me * 0.6], -1)
orm = cv2.resize(orm, (1024, 1024), interpolation=cv2.INTER_AREA)
Image.fromarray((np.clip(orm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_KC_ORM.jpg', quality=90, subsampling=0)
n = cv2.resize(nm, (512, 512), interpolation=cv2.INTER_AREA)
v = n * 2 - 1; v /= np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-6); n = v * 0.5 + 0.5
Image.fromarray((np.clip(n, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_KC_Normal.png')
Image.fromarray((base * 255).astype(np.uint8)).resize((1024, 1024)).save(W + 'wip/kc_atlas_base_prev.jpg')
for f in ('T_KC_Base.jpg', 'T_KC_ORM.jpg', 'T_KC_Normal.png'): print(f, os.path.getsize(W + 'tex/' + f))
