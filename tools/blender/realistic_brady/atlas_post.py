import os, json, numpy as np
os.environ['OPENCV_IO_ENABLE_OPENEXR'] = '1'
import cv2
from PIL import Image
D = '/Users/bradymott/brady-o/private/work/tex/atlas/'
W = '/Users/bradymott/brady-o/private/work/'
base = np.asarray(Image.open(D + 'atlas_base.png').convert('RGB')).astype(np.float32) / 255
ao = np.asarray(Image.open(D + 'atlas_ao.png').convert('L')).astype(np.float32) / 255
ro = np.asarray(Image.open(D + 'atlas_rough.png').convert('L')).astype(np.float32) / 255
nm = cv2.imread(D + 'atlas_normal.exr', cv2.IMREAD_UNCHANGED)[..., :3][..., ::-1]   # BGR -> RGB
print('normal range', nm.min(), nm.max(), 'ao', ao.min(), ao.max())
meta = json.load(open(W + 'proj/atlas_meta.json'))
(u0, v0), (u1, v1) = meta['swatch']
S = base.shape[0]
x0, x1 = int(u0 * S) - 6, int(u1 * S) + 6; y0, y1 = int((1 - v1) * S) - 6, int((1 - v0) * S) + 6
cap = np.asarray(Image.open(W + 'tex/T_HairCap_1k.png').convert('RGBA')).astype(np.float32) / 255
m = cap[..., 3] > 0.8
hc = np.median(cap[..., :3][m], axis=0) * 0.85
rng = np.random.default_rng(3)
h, w = y1 - y0, x1 - x0
strands = np.clip(1 + 0.35 * (rng.random((1, w)) - 0.5) + 0.12 * (rng.random((h, w)) - 0.5), 0.5, 1.5)
base[y0:y1, x0:x1] = np.clip(hc[None, None] * strands[..., None], 0, 1)
ro[y0:y1, x0:x1] = 0.6; ao[y0:y1, x0:x1] = 0.85
nm[y0:y1, x0:x1] = (0.5, 0.5, 1.0)
print('hair swatch colour', hc, (x0, y0, x1, y1))
Image.fromarray((base * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_BradyRB_Base.jpg', quality=92, subsampling=0)
aoK = 0.3 + 0.7 * np.clip(ao, 0, 1) ** 0.8
orm = np.stack([aoK, ro, np.zeros_like(ro)], -1)
orm = cv2.resize(orm, (1024, 1024), interpolation=cv2.INTER_AREA)
Image.fromarray((np.clip(orm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_BradyRB_ORM.jpg', quality=92, subsampling=0)
n = cv2.resize(nm.astype(np.float32), (1024, 1024), interpolation=cv2.INTER_AREA)
v = n * 2 - 1; v /= np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-6); n = v * 0.5 + 0.5
Image.fromarray((np.clip(n, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_BradyRB_Normal.png')
Image.fromarray((base * 255).astype(np.uint8)).resize((1024, 1024)).save(W + 'wip/atlas_base_prev.jpg')
Image.fromarray((np.clip(n, 0, 1) * 255).astype(np.uint8)).resize((512, 512)).save(W + 'wip/atlas_n_prev.png')
Image.fromarray((np.clip(orm, 0, 1) * 255).astype(np.uint8)).resize((512, 512)).save(W + 'wip/atlas_orm_prev.png')
for f in ('T_BradyRB_Base.jpg', 'T_BradyRB_ORM.jpg', 'T_BradyRB_Normal.png'): print(f, os.path.getsize(W + 'tex/' + f))
