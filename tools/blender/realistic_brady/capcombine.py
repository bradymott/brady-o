import numpy as np, cv2, json
P = '/Users/bradymott/brady-o/private/work/proj/cap/'
T = '/Users/bradymott/brady-o/private/work/tex/'
H = '/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad/head/'
cfg = json.load(open(H + 'capcombine_cfg.json'))
cams = cfg['cams']; REF = cfg['ref']
imgs = {}; ws = {}
for c, q in cams.items():
    e = np.load(P + '%s_EMIT.npy' % c).astype(np.float32)
    d = cv2.GaussianBlur(np.load(P + '%s_DIFFUSE.npy' % c).astype(np.float32)[..., 0], (0, 0), 2)
    valid = (e.sum(2) > 1e-4)
    lum = e @ np.array([0.2126, 0.7152, 0.0722])
    mx = e.max(2); mn = e.min(2); sat = (mx - mn) / np.maximum(mx, 1e-4)
    valid &= lum < cfg.get('max_lum', 0.22)                     # background walls / pillows
    valid &= ~((sat > cfg.get('skin_sat', 0.33)) & (lum > cfg.get('skin_lum', 0.06)))   # skin
    p99 = np.percentile(d[d > 0], 99.5) if (d > 0).any() else 1
    w = np.clip(d / p99, 0, 1); w = np.clip((w - cfg.get('cos_min', 0.08)) / (1 - cfg.get('cos_min', 0.08)), 0, 1) * valid
    w = cv2.erode(w, np.ones((5, 5), np.uint8))
    imgs[c] = e; ws[c] = (w ** cfg.get('pow', 2.0)) * q
gains = {}
for c in cams:
    if c == REF: gains[c] = np.ones(3); continue
    m = (ws[c] > 0.02) & (ws[REF] > 0.02)
    if m.sum() < 500: gains[c] = np.ones(3); print(c, 'no overlap'); continue
    g = np.median(imgs[REF][m], 0) / np.maximum(np.median(imgs[c][m], 0), 1e-4)
    gains[c] = np.clip(g, 0.75, 1.35); gains[c] = gains[c] / gains[c].mean() * np.clip(gains[c].mean(), 0.75, 1.35); print(c, np.round(gains[c], 2), m.sum())
for c in cams: imgs[c] = imgs[c] * gains[c]
def low(img, w, s):
    return cv2.GaussianBlur(img * w[..., None], (0, 0), s) / np.maximum(cv2.GaussianBlur(w, (0, 0), s)[..., None], 1e-6)
lows = 0; highs = 0; wl = 0; wh = 0
for c in cams:
    v = (ws[c] > 0).astype(np.float32)
    lo = low(imgs[c], v, 4); hi = imgs[c] - lo
    lows = lows + lo * (ws[c] ** 0.5)[..., None]; wl = wl + ws[c] ** 0.5
    highs = highs + hi * (ws[c] ** 2)[..., None]; wh = wh + ws[c] ** 2
photo = lows / np.maximum(wl, 1e-8)[..., None] + highs / np.maximum(wh, 1e-8)[..., None]
cover = np.clip(wl / cfg.get('cover_norm', 0.15), 0, 1)
cover = cv2.GaussianBlur(cover, (0, 0), 6) * cfg.get('photo_max', 1.0)
# highlight compression (sheen is shading, not albedo)
lum = photo @ np.array([0.2126, 0.7152, 0.0722])
wide = cv2.GaussianBlur(lum * (cover > 0.05), (0, 0), 25) / np.maximum(cv2.GaussianBlur((cover > 0.05).astype(np.float32), (0, 0), 25), 1e-4)
rat = lum / np.maximum(wide, 1e-4); kn = 1.25
photo = photo * np.clip(np.where(rat > kn, kn + (rat - kn) * 0.35, rat) / np.maximum(rat, 1e-4), 0.3, 1)[..., None]
# recolour photo hair: keep its luminance (strands, grey streaks), take the hue from his hair median,
# low-saturation pixels stay neutral grey (grey hair); remove dark speckles
plum = photo @ np.array([0.2126, 0.7152, 0.0722])
med = cv2.medianBlur((np.clip(plum, 0, 1) * 255).astype(np.uint8), 9).astype(np.float32) / 255
plum = np.where(plum < 0.6 * med, med, plum)
pmx = photo.max(2); pmn = photo.min(2); psat = (pmx - pmn) / np.maximum(pmx, 1e-4)
brown = np.array(cfg.get('brown', [0.034, 0.022, 0.015])); brown_dir = brown / (brown @ np.array([0.2126, 0.7152, 0.0722]))
gs = np.clip((plum - 0.06) / 0.12, 0, 1)            # brighter strands read as grey
photo = plum[..., None] * (brown_dir * (1 - gs[..., None]) + np.array([1.0, 1.0, 0.98]) * gs[..., None])
# fill: procedural flow strands, matched to the photo hair statistics
flow = np.load(P + 'flow_EMIT.npy').astype(np.float32)
m = cover > 0.6
tgt = np.median(photo[m], 0) if m.sum() > 100 else np.array([0.03, 0.022, 0.016])
src = np.median(flow[(flow.sum(2) > 0)], 0)
fill = flow * (tgt / np.maximum(src, 1e-4)) * cfg.get('fill_gain', 1.0)
alb = photo * cover[..., None] + fill * (1 - cover[..., None])
alb = np.clip(alb * cfg.get('gain', 1.0), 0, 1)
fade = np.load(P + 'fade_EMIT.npy').astype(np.float32)[..., 0]
# ragged strand edge: modulate fade with strand texture luminance
fl = flow @ np.array([0.2126, 0.7152, 0.0722]); fl = fl / max(np.percentile(fl[fl > 0], 90), 1e-4)
alpha = np.clip(fade * (0.6 + 0.8 * np.clip(fl, 0, 1.2)) - 0.08, 0, 1)
alpha = np.where(fade > 0.97, 1.0, alpha)
def srgb(x):
    x = np.clip(x, 0, 1); return np.where(x <= 0.0031308, 12.92 * x, 1.055 * x ** (1 / 2.4) - 0.055)
rgba = np.dstack([srgb(alb), alpha])
img = (rgba[::-1] * 255 + 0.5).astype(np.uint8)
cv2.imwrite(T + 'T_HairCap_2k.png', cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA))
cv2.imwrite(T + 'T_HairCap_1k.png', cv2.cvtColor(cv2.resize(img, (1024, 1024), interpolation=cv2.INTER_AREA), cv2.COLOR_RGBA2BGRA))
# normal: baked strand bump + high-pass of albedo
nb = np.load(P + 'normal_NORMAL.npy').astype(np.float32)
la = np.log(np.maximum(alb @ np.array([0.2126, 0.7152, 0.0722]), 1e-3))
hp = la - cv2.GaussianBlur(la, (0, 0), 3)
gy, gx = np.gradient(cv2.GaussianBlur(hp, (0, 0), 0.7))
n = nb * 2 - 1
n[..., 0] += -gx * 1.5; n[..., 1] += -gy * 1.5
n /= np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-6)
nimg = ((n * 0.5 + 0.5)[::-1] * 255 + 0.5).astype(np.uint8)
cv2.imwrite(T + 'T_HairCap_N_2k.png', cv2.cvtColor(nimg, cv2.COLOR_RGB2BGR))
cv2.imwrite(T + 'T_HairCap_N_1k.png', cv2.cvtColor(cv2.resize(nimg, (1024, 1024), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR))
prev = cv2.resize(img, (1024, 1024)); bg = np.full_like(prev[..., :3], 200)
a = prev[..., 3:4] / 255.0
cv2.imwrite('/Users/bradymott/brady-o/private/work/proj/cap/prev.jpg', cv2.cvtColor((prev[..., :3] * a + bg * (1 - a)).astype(np.uint8), cv2.COLOR_RGB2BGR))
print('ok coverage', float((cover > 0.5).mean()))
