# Assembles a style frame for one look: an in-game mock of Mexico 1-1 (sky, parallax layers, ground, Brady running,
# chili enemies) at the iPhone's on-screen scale, plus close-ups. Runs in Blender's Python (numpy via imgkit).
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/styleframe.py -- <look> <workdir> <outdir>
# workdir holds: bg3/ (render_bg at SCALE 3), brady3/ brady8/ (brady_sprite at 3 and 8), pepper3/ pepper8/, ground3/ optional
import bpy, numpy as np, os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import imgkit as IK

VIEW_W, VIEW_H, TEX = 1024, 384, 3
SKY = [(0.0, IK.hex_rgb('#2ab8e8')), (0.55, IK.hex_rgb('#86dcf2')), (1.0, IK.hex_rgb('#fff0c8'))]
LAYER_F = {'bg_far': 0.03, 'bg_mid': 0.14, 'bg_papel': 0.32, 'bg_near': 0.45}
GROUND_Y = 330          # logical px: the ground surface in the view (the guide's 'usual camera height')
LAYER_SHIFT = {'bg_near': -40}   # the stalls stand a little higher than the engine's base so they show above the floor
LOOK_POST = {'toon': dict(grain=0.0), 'paint': dict(grain=0.035, scale=2), 'ink': dict(grain=0.06, scale=2)}

def sun(canvas, cx, cy, r):
    h, w = canvas.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - cx, yy - cy)
    glow = np.clip(1 - d / (r * 3.2), 0, 1) ** 2 * 0.45
    disc = np.clip((r - d) / (r * 0.08), 0, 1)
    col = np.array(IK.hex_rgb('#fff8dc'), np.float32); gcol = np.array(IK.hex_rgb('#ffd27a'), np.float32)
    canvas[..., :3] = canvas[..., :3] * (1 - glow[..., None]) + gcol * glow[..., None]
    canvas[..., :3] = canvas[..., :3] * (1 - disc[..., None]) + col * disc[..., None]
    return canvas

def draw_layer(canvas, strip, f, cam_x, oy=0):
    """Tile a seamless strip across the view with parallax factor f (like BG.draw)."""
    H, W = canvas.shape[:2]; sw = strip.shape[1]
    ox = -int(round((cam_x * f * TEX) % sw))
    x = ox
    while x < W:
        IK.over(canvas, strip, x, oy * TEX); x += sw
    return canvas

def place(canvas, sprite, origin, x_logical, y_logical):
    """Draw a sprite whose feet-origin (texels) lands at logical (x, y)."""
    ox, oy = origin
    IK.over(canvas, sprite, int(round(x_logical * TEX - ox)), int(round(y_logical * TEX - oy)))

def mock(look, work):
    W, H = VIEW_W * TEX, VIEW_H * TEX
    cam_x = 1180
    canvas = IK.vgrad(W, H, SKY)
    sun(canvas, int(0.82 * W), int(0.18 * H), 38 * TEX)
    bg = json.load(open(os.path.join(work, 'bg3', 'layers.json')))
    fog = np.array(IK.hex_rgb('#ffe8d0'), np.float32)
    for name in ['bg_far', 'bg_mid', 'bg_papel', 'bg_near']:
        if name not in bg['layers']: continue
        strip = IK.load(os.path.join(work, 'bg3', bg['layers'][name]['file']))
        draw_layer(canvas, strip, LAYER_F[name], cam_x, LAYER_SHIFT.get(name, 0))
        if name != 'bg_near':
            # a touch of warm haze between the layers, like the engine's fog gradient
            t = np.linspace(0, 1, H)[:, None, None]; a = np.clip((t - 0.35) / 0.65, 0, 1) * 0.08
            canvas[..., :3] = canvas[..., :3] * (1 - a) + fog * a
    # ground: a rendered strip if there is one, else a flat warm band
    gpath = os.path.join(work, 'bg3', 'ground.png')
    gy = GROUND_Y * TEX
    if os.path.exists(gpath):
        g = IK.load(gpath)
        x = -int(round((cam_x * TEX) % g.shape[1]))
        while x < W:
            IK.over(canvas, g, x, gy); x += g.shape[1]
    else:
        canvas[gy:, :, :3] = IK.hex_rgb('#b89468'); canvas[gy:gy + 6 * TEX, :, :3] = IK.hex_rgb('#d8643a')
    # the cast
    bm = json.load(open(os.path.join(work, 'brady3', 'brady_meta.json')))
    brady = IK.load(os.path.join(work, 'brady3', 'brady_run_015.png'))
    place(canvas, brady, bm['origin'], 300, GROUND_Y)
    pm = json.load(open(os.path.join(work, 'pepper3', 'pepper_meta.json')))
    pep_idle = IK.load(os.path.join(work, 'pepper3', 'pepper_idle_000.png'))
    pep_hop = IK.load(os.path.join(work, 'pepper3', 'pepper_hop_000.png'))
    place(canvas, pep_idle, pm['origin'], 590, GROUND_Y)
    place(canvas, pep_hop, pm['origin'], 760, GROUND_Y - 58)
    post = LOOK_POST.get(look, {})
    if post.get('grain'): canvas = IK.grain(canvas, post['grain'], seed=3, scale=post.get('scale', 1))
    return canvas

def closeups(look, work):
    """Brady run + idle (8x), the chili idle + hop (8x), on the level's sky colour."""
    imgs = [IK.load(os.path.join(work, 'brady8', 'brady_run_015.png')), IK.load(os.path.join(work, 'brady8', 'brady_idle_000.png')),
            IK.load(os.path.join(work, 'pepper8', 'pepper_idle_000.png')), IK.load(os.path.join(work, 'pepper8', 'pepper_hop_000.png'))]
    ch = max(i.shape[0] for i in imgs); pad = 24
    cw = sum(i.shape[1] for i in imgs) + pad * (len(imgs) + 1)
    out = IK.vgrad(cw, ch + pad * 2, [(0, IK.hex_rgb('#86dcf2')), (1, IK.hex_rgb('#fff0c8'))])
    x = pad
    for im in imgs:
        IK.over(out, im, x, pad + ch - im.shape[0]); x += im.shape[1] + pad
    post = LOOK_POST.get(look, {})
    if post.get('grain'): out = IK.grain(out, post['grain'], seed=5, scale=post.get('scale', 1) * 2)
    return out

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:]
    look, work, out = argv[0], argv[1], argv[2]
    m = mock(look, work)
    IK.save(m, os.path.join(out, f'{look}_mock_full.png'))                 # 3072 x 1152: exactly what an iPhone draws
    IK.save(IK.downsample(m, 2), os.path.join(out, f'{look}_mock.png'))    # half size for the review page
    IK.save(m[GROUND_Y * TEX - 260 * TEX:GROUND_Y * TEX + 40 * TEX, 180 * TEX:700 * TEX], os.path.join(out, f'{look}_mock_crop.png'))
    IK.save(closeups(look, work), os.path.join(out, f'{look}_closeups.png'))
    print('DONE', look)
