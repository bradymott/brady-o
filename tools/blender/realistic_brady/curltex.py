"""Overwrite atlas region A (x 0..256) with curl sprites (2x7 cells of 128 px, ring/spiral strands with alpha)
and an opaque dense curl-mass tile (row 7) for the bun core."""
import numpy as np, cv2, math
p = '/Users/bradymott/brady-o/private/work/tex/T_HairCards.png'
im = cv2.cvtColor(cv2.imread(p, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
rng = np.random.default_rng(21)
def lin(x): return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
def srgb(x): x = np.clip(x, 0, 1); return np.where(x <= 0.0031308, 12.92 * x, 1.055 * x ** (1 / 2.4) - 0.055)
DARK = np.array([0.028, 0.018, 0.012]); TIP = np.array([0.05, 0.03, 0.017]); GREY = np.array([0.2, 0.19, 0.18])
def render_cell(x0, y0, size, n_curls, opaque=False):
    A = np.zeros((size, size), np.float32); C = np.zeros((size, size, 3), np.float32)
    def splat(xs, ys, a, cols):
        xi = np.round(xs).astype(int); yi = np.round(ys).astype(int)
        m = (xi >= 0) & (xi < size) & (yi >= 0) & (yi < size)
        np.add.at(A, (yi[m], xi[m]), a[m])
        for c in range(3): np.add.at(C[..., c], (yi[m], xi[m]), a[m] * cols[m, c])
    for k in range(n_curls):
        cx = rng.uniform(0.3, 0.7) * size if not opaque else rng.uniform(0, size)
        cy = rng.uniform(0.3, 0.7) * size if not opaque else rng.uniform(0, size)
        r0 = rng.uniform(0.16, 0.34) * size if not opaque else rng.uniform(0.04, 0.12) * size
        ph = rng.uniform(0, 6.3); span = rng.uniform(1.6, 3.4); s_shape = rng.random() < 0.45
        rot = rng.uniform(0, 3.14); asp = rng.uniform(0.5, 1.0)
        for st in range(rng.integers(14, 30)):
            t = np.linspace(0, 1, 500)
            rr = r0 * (1 + rng.normal(0, 0.07)) * (1 - 0.25 * t)
            if s_shape:
                # S: first half bends one way around c1, second half the other way around c2
                a1 = ph + span * 0.5 * np.minimum(t * 2, 1)
                a2 = ph + math.pi - span * 0.5 * np.clip(t * 2 - 1, 0, 1)
                c2x, c2y = 2 * rr * np.cos(ph + span * 0.5), 2 * rr * np.sin(ph + span * 0.5)
                ex = np.where(t < 0.5, rr * np.cos(a1), c2x + rr * np.cos(a2 + math.pi))
                ey = np.where(t < 0.5, rr * np.sin(a1), c2y + rr * np.sin(a2 + math.pi))
                ex = ex - c2x * 0.5; ey = ey - c2y * 0.5
            else:
                a = ph + span * t + rng.normal(0, 0.12)
                ex = rr * np.cos(a); ey = rr * np.sin(a)
            ey = ey * asp
            jx = rng.normal(0, 1.4); jy = rng.normal(0, 1.4)
            xs = cx + jx + ex * np.cos(rot) - ey * np.sin(rot); ys = cy + jy + ex * np.sin(rot) + ey * np.cos(rot)
            cols = DARK[None] * (1 - t[:, None]) + TIP[None] * t[:, None] * rng.uniform(0.8, 1.3)
            if rng.random() < 0.06: cols = np.repeat(GREY[None], len(t), 0)
            a_ = rng.uniform(0.25, 0.6) * np.clip(np.sin(np.pi * t) * 3, 0, 1)
            splat(xs, ys, a_, cols)
    alpha = 1 - np.exp(-A * 1.4)
    col = C / np.maximum(A[..., None], 1e-6)
    col[A < 1e-5] = DARK
    if opaque:
        alpha[:] = 1.0
        col = col * 0.85 + DARK * 0.15
    else:
        # soft circular vignette so sprite edges never show
        yy, xx = np.mgrid[0:size, 0:size]; r = np.hypot(xx - size / 2, yy - size / 2) / (size / 2)
        alpha *= np.clip((1.0 - r) / 0.2, 0, 1)
    im[y0:y0 + size, x0:x0 + size, :3] = srgb(col)
    im[y0:y0 + size, x0:x0 + size, 3] = alpha
for row in range(8):
    for c in range(2):
        render_cell(c * 128, row * 128, 128, 3 if row < 7 else 60, opaque=(row == 7))
cv2.imwrite(p, cv2.cvtColor((np.clip(im, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGBA2BGRA))
prev = im[..., :3] * im[..., 3:] + 0.85 * (1 - im[..., 3:])
cv2.imwrite('/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad/head/hair_prev.png', cv2.cvtColor((cv2.resize(prev, (768, 768)) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
print('ok')
