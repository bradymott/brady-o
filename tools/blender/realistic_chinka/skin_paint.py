"""Realistic Chinka's skin, painted in MPFB UV space at 4K from a rasterised T-pose position map (numpy, outside
Blender). Built from her reference photos' colouring rather than projected from them (the only close photo is a
smiling, tilted three-quarter view, which would bake teeth and a smile into a neutral face): warm medium-brown skin with
a golden undertone, warmer cheeks, nose and ears, soft nude-rose lips, the black winged eyeliner and dark lashes she
wears, a light brown crease shadow, a few light freckles over the nose and cheeks, pink nail beds, a dark inner mouth.
Writes private/work/tex/T_Chinka_Skin_4k.png (sRGB) and T_Chinka_SkinRough_4k.png (linear roughness).

Usage: python skin_paint.py [cfg.json]   (needs private/work/proj/chinka_body_mesh.npz and chinka_lm.json)"""
import sys, json, numpy as np
from PIL import Image
W = '/Users/bradymott/brady-o/private/work/'
MT = '/Users/bradymott/Library/Application Support/Blender/5.2/extensions/user_default/mpfb/data/textures/'
CFG = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
S = CFG.get('size', 4096)
STEM = CFG.get('stem', 'chinka')
D = np.load(W + 'proj/%s_body_mesh.npz' % STEM); LM = json.load(open(W + 'proj/%s_lm.json' % STEM))
co, no, uv, tv, tl = D['co'], D['no'], D['uv'], D['tri_v'], D['tri_l']

# ---- rasterise position + normal into UV space (rows top-down, v up -> row = (1 - v) * S)
pos = np.zeros((S, S, 3), np.float32); nrm = np.zeros((S, S, 3), np.float32); cov = np.zeros((S, S), bool)
px = uv[:, 0] * S - 0.5; py = (1 - uv[:, 1]) * S - 0.5
for (a, b, c), (la, lb, lc) in zip(tv, tl):
    xs = np.array([px[la], px[lb], px[lc]]); ys = np.array([py[la], py[lb], py[lc]])
    x0, x1 = max(int(np.floor(xs.min())) - 1, 0), min(int(np.ceil(xs.max())) + 1, S - 1)
    y0, y1 = max(int(np.floor(ys.min())) - 1, 0), min(int(np.ceil(ys.max())) + 1, S - 1)
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
    if abs(d) < 1e-12: continue
    l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / d
    l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / d
    l2 = 1 - l0 - l1
    k = (l0 >= -0.03) & (l1 >= -0.03) & (l2 >= -0.03)
    if not k.any(): continue
    L0, L1, L2 = l0[k, None], l1[k, None], l2[k, None]
    pos[gy[k], gx[k]] = L0 * co[a] + L1 * co[b] + L2 * co[c]
    nrm[gy[k], gx[k]] = L0 * no[a] + L1 * no[b] + L2 * no[c]
    cov[gy[k], gx[k]] = True
np.save(W + 'proj/chinka_posmap.npy', pos)
X, Y, Z = pos[..., 0], pos[..., 1], pos[..., 2]
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def gauss(c, s):
    d2 = (X - c[0]) ** 2 + (Y - c[1]) ** 2 + (Z - c[2]) ** 2; return np.exp(-d2 / (2 * s * s))
def mask(name):
    m = np.asarray(Image.open(MT + name).convert('L').resize((S, S), Image.BILINEAR)).astype(np.float32) / 255
    return m
LIN = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
SRGB = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
def col(h): h = h.lstrip('#'); return LIN(np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32))

# ---- base tone and slow variation
base = col(CFG.get('skin', '#a07864'))
rng = np.random.default_rng(7)
noise = np.zeros((S, S), np.float32)
for k in range(14):
    f = rng.normal(size=3); f /= np.linalg.norm(f); fr = rng.uniform(6, 40); ph = rng.uniform(0, 6.3)
    noise += np.sin((X * f[0] + Y * f[1] + Z * f[2]) * fr + ph) / 14
out = np.ones((S, S, 3), np.float32) * base * (1 + 0.05 * noise[..., None])
# fine mottling (2-8 mm): skin is never one flat colour; slightly redder in the darker blotches
fine = np.zeros((S, S), np.float32)
for k in range(24):
    f = rng.normal(size=3); f /= np.linalg.norm(f); fr = rng.uniform(250, 900); ph = rng.uniform(0, 6.3)
    fine += np.sin((X * f[0] + Y * f[1] + Z * f[2]) * fr + ph) / 24
fine = fine / (np.abs(fine).max() + 1e-6)
out *= (1 + CFG.get('mottle', 0.055) * fine[..., None] * np.array([0.8, 1.0, 1.1], np.float32))
def tint(w, c, k=1.0):
    global out
    w = np.clip(w * k, 0, 1)[..., None]; out = out * (1 - w) + col(c) * w
def mul(w, c):
    global out
    w = np.clip(w, 0, 1)[..., None]; out = out * (1 - w + w * col(c) / np.maximum(base, 1e-4))

eL, eR = np.array(LM['eyeL']), np.array(LM['eyeR']); r = LM['eyeRL']
eye_z = (eL[2] + eR[2]) / 2; lipF = np.array(LM['lipFront'])
# torso/limbs a touch lighter and more golden than the face; palms and soles paler
face = ss(eye_z - 0.14, eye_z - 0.10, Z) * ss(0.02, -0.02, Y + 0.03)
mul((1 - face) * 0.6, CFG.get('body', '#a67c66'))
hand = ss(0.58, 0.62, np.abs(X)) * (nrm[..., 2] < -0.35)
mul(hand * 0.7, '#d8a888')
sole = ss(0.03, 0.0, Z) * (nrm[..., 2] < -0.5)
mul(sole * 0.7, '#d4a080')
# warmth: cheeks, nose, ears, knuckles
nose_tip = np.array([0.0, lipF[1] - 0.012, (eye_z + LM['lipTop']) / 2 - 0.004])
for s in (1, -1):
    mul(gauss((s * 0.042, lipF[1] + 0.025, eye_z - 0.03), 0.018) * 0.55, CFG.get('blush', '#b8705a'))
    mul(gauss((s * 0.075, -0.06, eye_z - 0.005), 0.016) * 0.4, '#b06a58')        # ears
mul(gauss(nose_tip, 0.012) * 0.45, '#b46e5c')
# ---- lips (MPFB lips mask), soft edge
lips = np.clip(mask('mpfb_lips.jpg') * 1.15, 0, 1) ** 1.4
tint(lips, CFG.get('lips', '#9a5652'), 0.9)
lipline = lips * (1 - lips) * 4
mul(lipline * 0.25, '#8a4a44')
# ---- eyes: crease shadow, winged liner, lash line
lidm = mask('mpfb_eyelids.jpg')
mul(lidm * 0.45, CFG.get('shadow', '#8a5a44'))
liner = np.zeros((S, S), np.float32)
for e, sd in ((eL, 1), (eR, -1)):
    dx = (X - e[0]) * sd; dz = Z - e[2]; dy = Y - e[1]
    front = ss(-0.3 * r, -0.75 * r, dy)
    a = CFG.get('eye_a', 0.0128); b = CFG.get('eye_b', 0.0042); zc = CFG.get('eye_zc', 0.0005)
    u = np.clip(dx / a, -1.2, 1.6)
    marg = zc + b * np.sqrt(np.clip(1 - np.clip(u, -1, 1) ** 2, 0, 1))           # upper lid margin height
    th = 0.0011 + 0.0012 * ss(-0.2, 0.9, u)                                       # thicker toward the outer corner
    band = ss(marg - 0.0004, marg + 0.0002, dz) * (1 - ss(marg + th, marg + th + 0.0005, dz))
    band *= ss(-1.05, -0.85, u) * (1 - ss(1.0, 1.05, u))
    # wing: from the outer corner out and up
    t = (dx - a * 0.92) / 0.008
    wz = zc + 0.0045 * np.clip(t, 0, 1) + 0.0004
    wing = (t > 0) * (t < 1) * ss(wz - 0.0012 * (1 - t) - 0.0003, wz - 0.0012 * (1 - t), dz) * (1 - ss(wz + 0.0002, wz + 0.0006, dz))
    # lower lash line: a faint shadow
    lowm = zc - b * 0.75 * np.sqrt(np.clip(1 - np.clip(u, -1, 1) ** 2, 0, 1))
    low = ss(lowm - 0.0012, lowm - 0.0005, dz) * (1 - ss(lowm - 0.0002, lowm + 0.0003, dz)) * ss(-0.9, -0.2, u) * 0.45
    liner = np.maximum(liner, np.maximum(np.maximum(band, wing), low) * front * ss(0.03, 0.02, np.abs(dx)))
tint(liner, '#120c0a', CFG.get('liner', 0.92))
# ---- freckles: light, over the nose bridge and upper cheeks
fr = np.zeros((S, S), np.float32)
k = cov & (np.abs(X) < 0.06) & (Z > eye_z - 0.05) & (Z < eye_z - 0.005) & (Y < lipF[1] + 0.035)
ys_, xs_ = np.nonzero(k)
pts = pos[ys_, xs_]
sel = rng.choice(len(pts), size=min(CFG.get('freckles', 90), len(pts)), replace=False)
from scipy.spatial import cKDTree
fp = pts[sel]
fp = fp[np.abs(fp[:, 0]) > 0.012]
tree = cKDTree(fp)
qd, qi = tree.query(pos[k], k=1)
rad = 0.00045 + 0.0004 * rng.random(len(fp))
fr[k] = np.exp(-(qd / rad[qi]) ** 2) * (0.6 + 0.4 * rng.random(len(fp)))[qi]
mul(fr * 0.45, '#7a4a34')
# ---- nails, inner mouth
nails = np.maximum(mask('mpfb_fingernails.jpg'), mask('mpfb_toenails.jpg'))
tint(nails, CFG.get('nails', '#d6a59a'), 0.8)
tint(mask('mpfb_inside-mouth.jpg'), '#4a1c1c', 0.9)
# eyebrow shadow under the cards: painted brow shape (the cards add the hair)
brow = np.zeros((S, S), np.float32)
for e, sd in ((eL, 1), (eR, -1)):
    dx = (X - e[0]) * sd; dz = Z - e[2]
    t = (dx + 0.017) / 0.04                     # 0 inner .. 1 outer
    zc = 0.0135 + 0.006 * np.sin(np.clip(t, 0, 1) * np.pi * 0.85) - 0.003 * np.clip(t - 0.8, 0, 1) * 5
    hw = 0.0028 * (1 - 0.6 * np.clip(t, 0, 1))
    m = (t > 0) * (t < 1) * ss(hw + 0.001, hw, np.abs(dz - zc)) * ss(-0.3 * r, -0.9 * r, Y - e[1])
    brow = np.maximum(brow, m)
tint(brow, '#22160f', 0.62)
# ---- fill outside the islands by dilation (so the atlas bake's margin never samples black)
img = np.clip(SRGB(out), 0, 1)
from scipy import ndimage
idx = ndimage.distance_transform_edt(~cov, return_distances=False, return_indices=True)
img = img[idx[0], idx[1]]
Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(W + 'tex/' + CFG.get('out', 'T_Chinka_Skin_4k.png'))
rough = np.full((S, S), CFG.get('rough', 0.52), np.float32)
rough -= 0.1 * gauss(nose_tip, 0.02) + 0.08 * gauss((0, lipF[1] + 0.03, eye_z + 0.05), 0.03)    # T-zone sheen
rough = rough * (1 - lips) + 0.36 * lips
rough = rough * (1 - nails) + 0.3 * nails
rough = rough[idx[0], idx[1]]
Image.fromarray((np.clip(rough, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/' + CFG.get('out_rough', 'T_Chinka_SkinRough_4k.png'))
# face crop preview
ys_, xs_ = np.nonzero(cov & (Z > eye_z - 0.12) & (Y < -0.02))
Image.fromarray((img[ys_.min():ys_.max(), xs_.min():xs_.max()] * 255).astype(np.uint8)).save(W + 'wip/' + STEM + '_skin_face_uv.png')
print('ok', ys_.min(), ys_.max(), xs_.min(), xs_.max())
