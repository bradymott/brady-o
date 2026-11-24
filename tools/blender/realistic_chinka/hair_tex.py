"""Realistic Chinka's hair texture (1024^2 RGBA, strands along V, roots at the top), numpy, outside Blender.
Layout (pixels, top-down):  x 0-511     the scalp cap: dense strands running down, opaque, soft at the bottom 6 %
                            x 512-1023, y 0-895: four 128-px card columns of wavy clumps (alpha = coverage, tapering
                                        tips, colour bled past the alpha edge)
                            x 512-1023, y 896-959: eyebrow strip;  y 960-1023: upper-lash strip
Colour: very dark brown with warm brown lowlights, the colour of her hair in the photos.
Writes private/work/tex/T_Chinka_Hair.png."""
import numpy as np
from PIL import Image
from scipy import ndimage
W = '/Users/bradymott/brady-o/private/work/'
S = 1024
rng = np.random.default_rng(11)
img = np.zeros((S, S, 3), np.float32); alpha = np.zeros((S, S), np.float32)
LIN = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
SRGB = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
def col(h): h = h.lstrip('#'); return LIN(np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32))
import sys
# python hair_tex.py [out.png dark mid warm]  (defaults: Chinka's very dark brown; the cast kit uses a light neutral it tints)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'T_Chinka_Hair.png'
DARK, MID, WARM = (col(sys.argv[2]), col(sys.argv[3]), col(sys.argv[4])) if len(sys.argv) > 4 else (col('#1a110c'), col('#2e1f15'), col('#5a3c26'))
acc = np.zeros((S, S), np.float32); cacc = np.zeros((S, S, 3), np.float32)
def strand(x0, y0, y1, amp, freq, ph, width, c, a=1.0, taper=True, region=None):
    ys = np.arange(int(y0), int(y1))
    if len(ys) < 2: return
    t = (ys - y0) / max(y1 - y0, 1)
    xs = x0 + amp * np.sin(t * freq * 2 * np.pi + ph) + rng.normal(0, 0.25, len(ys)).cumsum() * 0.08
    w = width * (1 - 0.7 * t ** 3) if taper else np.full(len(ys), width)
    for dx in (-1, 0, 1):
        xi = np.round(xs).astype(int) + dx
        k = (xi >= 0) & (xi < S) & (ys >= 0) & (ys < S)
        if region is not None: k &= (xi >= region[0]) & (xi < region[1])
        f = np.clip(w[k] - np.abs(xs[k] - xi[k]) * 1.0, 0, 1) * a * ((1 - 0.85 * t[k] ** 4) if taper else 1.0)
        acc[ys[k], xi[k]] += f; cacc[ys[k], xi[k]] += f[:, None] * c
def hcol():
    r = rng.random()
    return DARK * (1 - r) + MID * r if rng.random() > 0.12 else MID * 0.4 + WARM * 0.6
# ---- cap
for i in range(5200):
    x0 = rng.uniform(0, 512); strand(x0, rng.uniform(-40, 600), rng.uniform(500, 1100), rng.uniform(0, 3), rng.uniform(0.3, 1.2), rng.uniform(0, 6.3), rng.uniform(0.6, 1.1), hcol(), 0.9, taper=False, region=(0, 512))
cap_a = np.zeros((S, S), np.float32); cap_a[:, :512] = 1.0
yy = np.arange(S)[:, None] / S
cap_a[:, :512] *= np.clip((0.995 - yy) / 0.06, 0, 1)                       # soft hairline at the bottom
# ---- card columns: each a clump; strands run the full height, wave, taper; density thins toward the edges
for c in range(4):
    x_lo, x_hi = 512 + c * 128, 512 + (c + 1) * 128
    n = [900, 700, 520, 360][c]
    freq = [1.6, 2.2, 1.9, 2.6][c]
    for i in range(n):
        u = rng.beta(2.2, 2.2); x0 = x_lo + 8 + u * 112
        y0 = rng.uniform(0, 30); y1 = rng.uniform(760, 896)
        strand(x0, y0, y1, rng.uniform(4, 11), freq + rng.normal(0, 0.15), rng.uniform(0, 0.8) + c, rng.uniform(0.7, 1.2), hcol(), 0.75, region=(x_lo, x_hi))
# ---- eyebrow strip (y 896-959): short angled hairs, denser in the middle of the strip
for i in range(3200):
    x0 = rng.uniform(516, 1020); yc = rng.normal(928, 8)
    L = rng.uniform(8, 18); ang = rng.normal(0.9, 0.25)
    for k in range(int(L)):
        x = int(x0 + k * np.cos(ang) * 0.6); y = int(yc - k * np.sin(ang) * 0.6)
        if 896 <= y < 960 and 512 <= x < S: acc[y, x] += 0.7; cacc[y, x] += 0.7 * col('#140d09')
# ---- lash strip (y 960-1023): roots at the top, curving lashes
for i in range(500):
    x0 = rng.uniform(516, 1020); L = rng.uniform(30, 60)
    for k in range(int(L)):
        x = int(x0 + (k / L) ** 2 * rng.uniform(-6, 6)); y = int(962 + k)
        if 960 <= y < S and 512 <= x < S: acc[y, x] += 0.8 * (1 - k / L * 0.6); cacc[y, x] += 0.8 * col('#080606')
a = np.clip(acc, 0, 1)
c = cacc / np.maximum(acc[..., None], 1e-4)
alpha = np.maximum(a, cap_a)
alpha[:, :512] = cap_a[:, :512]
# cap colour: strands over a dark base
base = MID * 0.7
c[:, :512] = np.where(acc[:, :512, None] > 0.05, c[:, :512] * 0.8 + base * 0.2, base)
# bleed colour past the alpha edges
known = alpha > 0.02
idx = ndimage.distance_transform_edt(~known, return_distances=False, return_indices=True)
c = c[idx[0], idx[1]]
# shading variation down each clump (root darker)
c[:, 512:] *= (0.78 + 0.32 * (np.arange(S)[:, None, None] / S))[:, :1]
out = np.dstack([np.clip(SRGB(c), 0, 1), alpha])
Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(W + 'tex/' + OUT)
prev = Image.fromarray((out[..., :3] * out[..., 3:] * 255).astype(np.uint8)); prev.resize((512, 512)).save(W + 'wip/hair_tex_prev.png')
print('ok', float(alpha[:, 512:].mean()))
