# Renders one job of a country's sprite set in the chosen look and writes the frames plus a pack spec fragment.
#   JOB=enemies:<module>  (mx_enemies_a / mx_enemies_b / mx_pepper via the 'pepper' shim)   -> character frames + clips
#                         (a module may set FRAMES = {(kind, pose): (n, fps)} to override CYCLES below, e.g. a
#                          one-frame item block, or a 4-step 'puff' sequence the game picks frames from)
#   JOB=bg:<module>       (mx_mercado, mx_canal, ...)                                        -> layer strips + ground + tiles
#   LOOK=toon OUT=<dir> NAME=<atlas name> SCALE=3 (characters) / 2 (backgrounds)
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/render_country.py
# Then: pack_atlas.py -- <dir1>/spec.json <dir2>/spec.json ... assets/sprites/world/<name>
import bpy, os, sys, json, math, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lookkit as LK

# frames per cycle pose and the clip speed (fps); poses not listed are single frames
CYCLES = {'walk': (8, 10), 'idle': (6, 6), 'hop': (1, 1), 'fly': (6, 10), 'swim': (6, 8), 'spin': (8, 10), 'roll': (8, 14),
          'throw': (6, 8), 'up': (3, 6), 'down': (3, 6), 'wave': (6, 6), 'hurt_walk': (8, 10), 'curl': (1, 1)}
STRIP_H = 384 + 60

def frame_box(size_m, origin):
    """The ortho box around a character of nominal size size_m: (cx, cz, w, h, ox_frac, oy_frac)."""
    w = h = max(0.6, size_m * 2.1)
    if origin == 'centre': return 0.0, 0.0, w, h, 0.5, 0.5
    foot = 0.08
    return 0.0, h / 2 - foot, w, h, 0.5, 1 - foot / h

def render_enemies(mod, look, out, name, scale):
    LK.setup_render('BLENDER_EEVEE', samples=int(os.environ.get('SAMPLES', '24')))
    LK.lights(look, key_dir=(0.35, -0.75, 0.9))
    px_m = LK.PPM * scale
    spec = {'name': name, 'scale': scale, 'frames': [], 'anims': {}}
    kinds = os.environ.get('KINDS', '').split(',') if os.environ.get('KINDS') else mod.KINDS
    heights = getattr(mod, 'HEIGHT', {}) or {}; sizes = getattr(mod, 'SIZE', {}) or {}
    origins = getattr(mod, 'ORIGIN', {})
    for kind in kinds:
        origin = origins.get(kind, 'feet')
        size = (sizes.get(kind) if origin == 'centre' else heights.get(kind)) or sizes.get(kind) or heights.get(kind)
        cx, cz, bw, bh, oxf, oyf = frame_box(size, origin)
        res_w, res_h = int(round(bw * px_m)), int(round(bh * px_m))
        LK.ortho_camera(cx, cz, bw, bh, res_w, res_h)
        frames = getattr(mod, 'FRAMES', {}) or {}      # per-module override: {(kind, pose): (frames, fps)}
        for pose in mod.POSES[kind]:
            n, fps = frames.get((kind, pose)) or CYCLES.get(pose, (1, 1))
            ids = []
            for k in range(n):
                t = k / n if n > 1 else 0.0
                if hasattr(mod, 'clear'): mod.clear()          # every frame starts from an empty stage
                root = mod.build(kind, pose, t)
                LK.apply_look(look, LK.all_meshes(root), outline_px=float(os.environ.get('OUTLINE', '0.9')))
                fid = f'{kind}_{pose}_{k:03d}'
                p = LK.render(os.path.join(out, fid + '.png'))
                spec['frames'].append({'id': fid, 'file': p, 'ox': res_w * oxf, 'oy': res_h * oyf}); ids.append(fid)
                print('RENDERED', p)
            if n > 1: spec['anims'][f'{kind}/{pose}'] = {'frames': ids, 'fps': fps, 'loop': True}
    with open(os.path.join(out, 'spec.json'), 'w') as f: json.dump(spec, f, indent=1)

def render_bg(mod, look, out, name, scale):
    build = getattr(mod, 'build', None) or getattr(mod, 'build_mercado')
    cols = build(seed=int(os.environ.get('SEED', '1')))
    layers = [l for l in mod.LAYERS if l in cols]
    BASES = getattr(mod, 'BASES', None) or {'bg_far': 300, 'bg_mid': 372, 'bg_papel': 70, 'bg_near': 375}
    LK.setup_render('BLENDER_EEVEE', samples=int(os.environ.get('SAMPLES', '24')))
    objs = [o for c in cols.values() for o in c.all_objects]
    LK.apply_look(look, objs, outline_px=float(os.environ.get('OUTLINE', '0.9')))
    LK.lights(look, key_dir=(0.35, -0.75, 0.9))
    P = mod.P
    res_w, res_h = int(round(1024 * scale)), int(round(STRIP_H * scale))
    spec = {'name': name, 'scale': scale, 'frames': [], 'anims': {}, 'strips': []}
    for L in layers:
        base = BASES.get(L, 300)
        for other in layers: cols[other].hide_render = other != L
        h_m = STRIP_H / LK.PPM; z_top = base / LK.PPM
        LK.ortho_camera(P / 2, z_top - h_m / 2, P, h_m, res_w, res_h)
        p = LK.render(os.path.join(out, L + '.png')); spec['strips'].append({'id': L, 'file': p}); print('RENDERED', p)
    for other in layers: cols[other].hide_render = True
    if hasattr(mod, 'build_ground'):
        gcol = mod.build_ground()
        LK.apply_look(look, list(gcol.all_objects), outline_px=float(os.environ.get('OUTLINE', '0.9')))
        GP, GH = 8 * 32 / LK.PPM, 3 * 32 / LK.PPM
        LK.ortho_camera(GP / 2, -GH / 2, GP, GH, int(round(256 * scale)), int(round(96 * scale)))
        p = LK.render(os.path.join(out, 'ground.png'))
        spec['frames'].append({'id': 'ground', 'file': p, 'ox': 0, 'oy': 0, 'notrim': True}); print('RENDERED', p)
    with open(os.path.join(out, 'spec.json'), 'w') as f: json.dump(spec, f, indent=1)

def main():
    job = os.environ['JOB']; look = os.environ.get('LOOK', 'toon'); out = os.environ['OUT']; name = os.environ['NAME']
    kind, modname = job.split(':', 1)
    mod = importlib.import_module(modname)
    os.makedirs(out, exist_ok=True)
    if kind == 'enemies': render_enemies(mod, look, out, name, float(os.environ.get('SCALE', '3')))
    elif kind == 'bg': render_bg(mod, look, out, name, float(os.environ.get('SCALE', '2')))
    else: raise SystemExit('unknown job ' + job)

if __name__ == '__main__':
    try: main()
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
