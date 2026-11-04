# Renders a country's parallax background layers as seamless 1024-logical-px strips in a candidate look.
#   LOOK=toon|paint|ink OUT=<dir> SCALE=<texels per logical px> SCENE=mx_mercado
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/render_bg.py
# Each strip is (1024*SCALE) x (444*SCALE): the engine's 384-px view plus 60 px below, with the layer's ground line
# (z = 0) at the engine's `base` row from the top. Writes <OUT>/<layer>.png and <OUT>/layers.json.
import bpy, os, sys, json, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lookkit as LK

STRIP_H = 384 + 60
# engine ground lines (logical px from the strip top) per layer, from the country file's theme
BASES = {'mx_mercado': {'bg_far': 300, 'bg_mid': 372, 'bg_papel': 70, 'bg_near': 375, 'ground': 0}}

def main():
    look = os.environ.get('LOOK', 'toon'); out = os.environ.get('OUT', '/tmp/bg'); scale = float(os.environ.get('SCALE', LK.TEX))
    scene_name = os.environ.get('SCENE', 'mx_mercado')
    mod = importlib.import_module(scene_name)
    cols = mod.build_mercado(seed=int(os.environ.get('SEED', '1')))
    layers = [l for l in mod.LAYERS if l in cols] + [l for l in cols if l not in mod.LAYERS]
    LK.setup_render('BLENDER_EEVEE', samples=int(os.environ.get('SAMPLES', '24')))
    objs = [o for c in cols.values() for o in c.all_objects]
    LK.apply_look(look, objs, outline_px=float(os.environ.get('OUTLINE', '0.8')))
    LK.lights(look, key_dir=(0.35, -0.75, 0.9))
    P = mod.P; px_m = LK.PPM * scale
    res_w, res_h = int(round(1024 * scale)), int(round(STRIP_H * scale))
    meta = {'look': look, 'scale': scale, 'strip': [1024, STRIP_H], 'layers': {}}
    bases = BASES.get(scene_name, {})
    for name in layers:
        base = bases.get(name, 300)
        for other in layers:
            cols[other].hide_render = other != name
        h_m = STRIP_H / LK.PPM; z_top = base / LK.PPM
        LK.ortho_camera(P / 2, z_top - h_m / 2, P, h_m, res_w, res_h)
        p = LK.render(os.path.join(out, name + '.png'))
        meta['layers'][name] = {'base': base, 'file': name + '.png'}
        print('RENDERED', p)
    # the floor tiles: an 8-tile-wide, 3-tile-tall seamless strip (256 x 96 logical px), walking surface at the top
    if hasattr(mod, 'build_ground') and os.environ.get('GROUND', '1') == '1':
        for other in layers: cols[other].hide_render = True
        gcol = mod.build_ground()
        LK.apply_look(look, list(gcol.all_objects), outline_px=float(os.environ.get('OUTLINE', '0.8')))
        GP, GH = 8 * 32 / LK.PPM, 3 * 32 / LK.PPM
        LK.ortho_camera(GP / 2, -GH / 2, GP, GH, int(round(256 * scale)), int(round(96 * scale)))
        p = LK.render(os.path.join(out, 'ground.png')); meta['ground'] = {'file': 'ground.png', 'tiles': [8, 3]}
        print('RENDERED', p)
    with open(os.path.join(out, 'layers.json'), 'w') as f: json.dump(meta, f, indent=1)

if __name__ == '__main__':
    try: main()
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
